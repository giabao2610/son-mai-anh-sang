// paintings/den-keo-quan/parts/cot-den.js — của lớp Cốt: số đo của chiếc đèn, đỉnh lăng trụ giấy, hai hàm TSL giao tia từ ngọn lửa (ống trụ, mặt phẳng ngang), và các vật của đèn.
import { CapsuleGeometry, CylinderGeometry, InstancedMesh, Mesh, Object3D, RingGeometry } from 'three/webgpu';
import { Fn, atan, dot, max, sqrt, vec3 } from 'three/tsl';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Chiếc đèn treo giữa gian nhà (mét; spec §18.1). Số chốt lúc làm: đổi ở đây thì test khung kiểm lại các ràng buộc.
 * - axis: (x, z) của trục; cách vách sau (z = −2,5) đúng 1,9, nên bóng trên vách sau to gấp 1,9 / 0,09 ≈ 21 lần.
 * - paper: lăng trụ giấy, bán kính ngoại tiếp r, từ y0 tới y1. Đáy kín (đế), miệng trên hở bán kính `mouth`.
 * - drum: trống hình nhân (bán kính r, dải hình từ y0 tới y1). flame: tâm ngọn lửa lúc đứng yên, ở giữa dải hình.
 * - candle: thân nến. fan: chong chóng (độ cao, bán kính, số cánh). hang: chỗ buộc dây trên xà giữa.
 */
export const LANTERN = Object.freeze({
  axis: Object.freeze([0, -0.6]),
  sides: 6,
  paper: Object.freeze({ r: 0.17, y0: 1.36, y1: 1.74 }),
  mouth: 0.12,
  drum: Object.freeze({ r: 0.09, y0: 1.47, y1: 1.61 }),
  flame: Object.freeze([0, 1.54, -0.6]),
  candle: Object.freeze({ r: 0.012, y0: 1.36, y1: 1.5 }),
  fan: Object.freeze({ y: 1.7, r: 0.1, blades: 8 }),
  hang: 3.05,
});

/** Nan tre: bán kính và độ ra ngoài mặt giấy (m). Số nan tối đa = số cạnh tối đa của núm sides. */
const RIB = { r: 0.0045, out: 0.003, max: 8 };
/** Đế gỗ dày bao nhiêu (m), nằm ngay dưới đáy giấy. */
const BASE = 0.02;
/** Tua treo ở các góc đáy đèn: bán kính, chiều dài (m). */
const TASSEL = { r: 0.006, length: 0.05 };

/**
 * Góc (atan(z, x)) của các đỉnh lăng trụ `sides` cạnh mà CylinderGeometry dựng: three đặt đỉnh đầu tiên ở +z, tức góc π/2, rồi đi
 * ngược chiều atan theo bước 2π/sides. Gobo (nan tre) và lớp Giấy (tấm nào) dùng cùng quy ước này; test khung so với hình thật.
 * @param {number} sides
 */
export function cornerAngles(sides) {
  return Array.from({ length: sides }, (_, k) => Math.PI / 2 - (k * 2 * Math.PI) / sides);
}

/**
 * Tia từ C (ngọn lửa, ở TRONG ống) qua P cắt ống trụ đứng: trục qua `axis` = vec2(x, z), bán kính r.
 * d = P − C không chuẩn hóa, nên t là phần của đoạn C → P ở điểm cắt (t < 1: P ở ngoài ống). Nghiệm dương của
 * |o + t·d.xz|² = r² với o = C.xz − axis: c < 0 vì C ở trong ống, nên luôn có đúng một nghiệm dương.
 * Trả vec3(góc quanh trục bằng atan(z, x) theo radian, độ cao của điểm cắt, t).
 */
export const cylinderExit = Fn(([P, C, axis, r]) => {
  const d = P.sub(C);
  const o = C.xz.sub(axis);
  const a = max(dot(d.xz, d.xz), 1e-8); // tia gần như thẳng đứng: a ≈ 0, điểm cắt ở rất xa trên/dưới
  const b = dot(o, d.xz);
  const c = dot(o, o).sub(r.mul(r));
  const t = b.negate().add(sqrt(max(b.mul(b).sub(a.mul(c)), 0))).div(a);
  const h = C.add(d.mul(t));
  return vec3(atan(h.z.sub(axis.y), h.x.sub(axis.x)), h.y, t);
});

/**
 * Tia từ C qua P cắt mặt phẳng ngang y = Y, PHÍA TRÊN C. Tia đi xuống thì d.y bị kẹp về 1e-4: điểm cắt ra rất xa (hữu hạn), nên
 * người gọi luôn trộn bằng một hệ số "tia đi lên" chứ không cần nhánh If, và không bao giờ sinh NaN.
 * Trả vec3(dx, dz so với trục ở điểm cắt, t).
 */
export const planeCross = Fn(([P, C, axis, Y]) => {
  const d = P.sub(C);
  const t = Y.sub(C.y).div(max(d.y, 1e-4));
  const h = C.xz.add(d.xz.mul(t)).sub(axis);
  return vec3(h.x, h.y, t);
});

/** Lăng trụ giấy `sides` cạnh, mở hai đầu, đúng độ cao (tọa độ cục bộ: trục ở gốc). */
const paperGeometry = (sides) => {
  const { r, y0, y1 } = LANTERN.paper;
  return new CylinderGeometry(r, r, y1 - y0, sides, 1, true).translate(0, (y0 + y1) / 2, 0);
};

/**
 * Đế gỗ (đĩa kín ngay dưới đáy giấy) và vành chóp (vòng từ miệng tới mép giấy, ở đỉnh), gộp làm một hình.
 * RingGeometry nằm ở mặt XY: xoay về mặt ngang rồi xoay quanh trục đứng để đỉnh của nó trùng đỉnh lăng trụ (cornerAngles).
 */
const woodGeometry = (sides) => {
  const { r, y0, y1 } = LANTERN.paper;
  const base = new CylinderGeometry(r, r, BASE, sides).translate(0, y0 - BASE / 2, 0);
  const rim = new RingGeometry(LANTERN.mouth, r, sides).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2).translate(0, y1, 0);
  const merged = mergeGeometries([base, rim]); // cả hai đều có chỉ mục (index): gộp được thẳng
  base.dispose();
  rim.dispose();
  return merged;
};

/**
 * Các vật của chiếc đèn, mỗi vật có `name` (Từng sợi, Sổ tay). Cấp phát MỘT lần; đổi số cạnh chỉ thay hình học của giấy và đế,
 * và ghi lại ma trận nan tre (InstancedMesh cấp sẵn 8 bản, chỉ đổi count), không tạo mesh mới (như cot-leaf.js của Bức 1).
 * @param {{ giay: any, tre: any, go: any, nen: any }} materials
 * @param {number} sides
 */
export function createLantern(materials, sides) {
  const [ax, az] = LANTERN.axis;
  const paper = new Mesh(paperGeometry(sides), materials.giay);
  paper.name = 'giay';
  const { y0, y1 } = LANTERN.paper;
  const rib = new CylinderGeometry(RIB.r, RIB.r, y1 - y0 + BASE, 6).translate(0, (y0 + y1 - BASE) / 2, 0);
  const frame = new InstancedMesh(rib, materials.tre, RIB.max);
  frame.name = 'khung-tre';
  const wood = new Mesh(woodGeometry(sides), materials.go);
  wood.name = 'de-chop';
  const { r: cr, y0: c0, y1: c1 } = LANTERN.candle;
  const candle = new Mesh(new CylinderGeometry(cr, cr, c1 - c0, 12).translate(0, (c0 + c1) / 2, 0), materials.nen);
  candle.name = 'cay-nen';
  const cord = new Mesh(new CylinderGeometry(0.002, 0.002, LANTERN.hang - y1, 4).translate(0, (LANTERN.hang + y1) / 2, 0), materials.go);
  cord.name = 'day-treo';
  // Tua: mỗi góc đáy một tua treo xuống (cấp sẵn 8 bản như nan tre, chỉ đổi count theo số cạnh).
  const tassels = new InstancedMesh(new CapsuleGeometry(TASSEL.r, TASSEL.length, 2, 6), materials.tre, RIB.max);
  tassels.name = 'tua';
  const objects = [paper, frame, wood, candle, cord, tassels];
  for (const o of objects) o.position.set(ax, 0, az);
  // Vật trong đèn đổ bóng cho thí nghiệm "Shadow map thật" (castShadow nằm trong cache key: bật một lần lúc dựng). Gobo không
  // cần cờ này. Giấy không đổ bóng (ánh sáng đi xuyên qua nó), và không vật nào của đèn nhận bóng: giấy tự tính ánh sáng xuyên qua.
  for (const o of [frame, wood, candle, tassels]) o.castShadow = true;
  // Tua treo dưới đế: nhận node bóng của đèn nến để đế che (không thì tua sáng trắng giữa vùng tối dưới đèn).
  tassels.receiveShadow = true;

  const dummy = new Object3D();
  const placeRibs = (n) => {
    cornerAngles(n).forEach((a, i) => {
      const rr = LANTERN.paper.r + RIB.out;
      dummy.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      dummy.updateMatrix();
      frame.setMatrixAt(i, dummy.matrix);
    });
    frame.count = n;
    frame.instanceMatrix.needsUpdate = true;
    frame.computeBoundingSphere(); // setMatrixAt không cập nhật khung bao (frustum culling dùng nó)
    cornerAngles(n).forEach((a, i) => {
      const rr = LANTERN.paper.r + RIB.out;
      dummy.position.set(Math.cos(a) * rr, y0 - BASE - TASSEL.length / 2 - TASSEL.r, Math.sin(a) * rr);
      dummy.updateMatrix();
      tassels.setMatrixAt(i, dummy.matrix);
    });
    tassels.count = n;
    tassels.instanceMatrix.needsUpdate = true;
    tassels.computeBoundingSphere();
  };
  placeRibs(sides);

  return {
    objects,
    paper,
    /** Đổi số cạnh: thay hình của giấy và đế, ghi lại nan tre. */
    rebuild(n) {
      paper.geometry.dispose();
      paper.geometry = paperGeometry(n);
      wood.geometry.dispose();
      wood.geometry = woodGeometry(n);
      placeRibs(n);
    },
  };
}
