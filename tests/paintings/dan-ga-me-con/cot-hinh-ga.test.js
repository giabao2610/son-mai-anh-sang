// tests/paintings/dan-ga-me-con/cot-hinh-ga.test.js — hình gà đủ phần (spec §20.3) và chỗ của chúng: phần nào của gà mẹ, gà con có trong geometry; đầu mỏ khớp CHICK; khớp của gà mẹ ở tọa độ thế giới; cực của cầu mắt ở giữa chỏm mắt; con trèo lưng, con nấp bụng sát mẹ mà không lún vào mọi khối của mẹ (đọc chỗ thật qua placement()); ở góc nhìn của tranh thấy được cả mười con.
import { describe, it, expect } from 'vitest';
import { ConeGeometry, CylinderGeometry, Matrix4, Mesh, MeshBasicMaterial, Raycaster, SphereGeometry, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import { CAMERA, CHICK, HEN, HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import {
  CHICK_SHAPE, HEN_JOINTS, HEN_SHAPE, PART, chickGeometry, henGeometry, placement,
} from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';

const SEGMENTS = 24;
const partsOf = (geometry) => new Set(geometry.attributes.part.array);
const named = (set) => Object.keys(PART).filter((name) => set.has(PART[name])).sort();
/** Đỉnh (x, y, z) của các phần thỏa `keep` trong một geometry. */
const vertices = (geometry, keep = () => true) => {
  const { position, part } = geometry.attributes;
  const out = [];
  for (let i = 0; i < position.count; i += 1) if (keep(part.getX(i))) out.push([position.getX(i), position.getY(i), position.getZ(i)]);
  return out;
};
/** Chỗ thật của một đỉnh gà con ở dáng nghỉ: quay theo hướng (như rotation.y của three) rồi dời tới chỗ (x, y, z). */
const place = ([x, y, z], [px, py, pz, h]) => [px + x * Math.cos(h) + z * Math.sin(h), py + y, pz + z * Math.cos(h) - x * Math.sin(h)];
const restPose = (home) => [home.at[0], home.kind === 'back' ? HEN.back : 0, home.at[1], home.heading];
/** Điểm thế giới về khung của gà mẹ (ngược của xoay HEN.heading rồi dời HEN.at). */
const toHen = ([x, y, z]) => {
  const [dx, dz] = [x - HEN.at[0], z - HEN.at[1]];
  const h = -HEN.heading;
  return [dx * Math.cos(h) + dz * Math.sin(h), y, dz * Math.cos(h) - dx * Math.sin(h)];
};
/** Mọi khối của gà mẹ (mình, đuôi, chân, bàn chân, đầu, mỏ, mào, mắt, ong, hai cánh), trong khung của mẹ. */
const henSolids = [...HEN_SHAPE.body, HEN_SHAPE.wingL, HEN_SHAPE.wingR];
/** Phần có tên của một khối, cho lời báo lỗi. */
const nameOf = (shape) => `${shape.part} ${shape.kind} ở ${shape.at}`;
/**
 * Điểm p (khung của khối) có nằm trong khối lý tưởng không: đưa p về dạng chuẩn bằng nghịch đảo của placement() (đúng phép đặt mà hình
 * dùng, kể cả kéo dãn, xoay, dẹt), rồi so với cầu, nón, trụ chuẩn của three (dọc +y, tâm ở gốc). Lưới đa diện nằm trong khối lý tưởng, nên
 * phép thử này chặt hơn lưới thật.
 */
const inside = (shape, p) => {
  const q = new Vector3(...p).applyMatrix4(new Matrix4().copy(placement(shape)).invert());
  if (shape.kind === 'ball') return q.length() < shape.r;
  if (Math.abs(q.y) > shape.h / 2) return false;
  const radius = shape.kind === 'cone' ? (shape.r * (shape.h / 2 - q.y)) / shape.h : shape.r;
  return Math.hypot(q.x, q.z) < radius;
};
/** Tâm (trong khung của gà con) của khối đầu tiên mang phần `part`. */
const centerOf = (part) => CHICK_SHAPE.find((s) => s.part === part).at;
/** Bàn chân của gà con: đáy của mỗi trụ chân (dời xuống nửa chiều cao từ tâm). */
const chickFeet = () => CHICK_SHAPE.filter((s) => s.part === 'LEG').map((s) => [s.at[0], s.at[1] - s.h / 2, s.at[2]]);

describe('cot-hinh-ga', () => {
  it('gà con đủ phần: mình, đuôi, chân, cánh, đầu, mỏ, mắt; gà mẹ: mình có cả mào và con ong (thân, cánh ong), hai cánh là hai geometry riêng', () => {
    expect(named(partsOf(chickGeometry({ segments: SEGMENTS })))).toEqual(['BEAK', 'BODY', 'EYE', 'HEAD', 'LEG', 'TAIL', 'WING']);
    const hen = henGeometry({ segments: SEGMENTS });
    expect(named(partsOf(hen.body))).toEqual(['BEAK', 'BEE', 'BEE_WING', 'BODY', 'COMB', 'EYE', 'HEAD', 'LEG', 'TAIL']);
    // Cánh ong là phần riêng: vằn của Bản nét chỉ ở thân ong. Mọi phần của ong đi theo đầu (từ HEAD trở lên).
    expect(Math.min(PART.BEE, PART.BEE_WING)).toBeGreaterThan(PART.HEAD);
    expect(named(partsOf(hen.wingL))).toEqual(['WING']);
    expect(named(partsOf(hen.wingR))).toEqual(['WING']);
    // Mỗi geometry có đủ thuộc tính cho các lớp sau: pháp tuyến (nấc sáng), UV (nét trong của Task 5), part.
    for (const g of [chickGeometry({ segments: SEGMENTS }), hen.body, hen.wingL]) {
      expect(Object.keys(g.attributes).sort()).toEqual(['normal', 'part', 'position', 'uv']);
    }
  });

  it('đầu mỏ của gà con lúc ngẩng là CHICK.beak; tâm mình ở chừng CHICK.center (tấm bìa dẹt quanh đó)', () => {
    const beak = vertices(chickGeometry({ segments: SEGMENTS }), (p) => p === PART.BEAK);
    const tip = beak.reduce((a, b) => (b[2] > a[2] ? b : a));
    expect(tip[2]).toBeCloseTo(CHICK.beak[1], 6);
    expect(tip[1]).toBeCloseTo(CHICK.beak[0], 6);
    const body = vertices(chickGeometry({ segments: SEGMENTS }), (p) => p === PART.BODY).map((v) => v[1]);
    expect((Math.min(...body) + Math.max(...body)) / 2).toBeCloseTo(CHICK.center, 1);
  });

  it('gà mẹ dựng sẵn ở tọa độ thế giới: quay sang trái (−x), mắt và mỏ ở phía trước; khớp (cổ, hông, vai) đã đổi sang thế giới', () => {
    const hen = henGeometry({ segments: SEGMENTS });
    const beak = vertices(hen.body, (p) => p === PART.BEAK);
    const tail = vertices(hen.body, (p) => p === PART.TAIL);
    expect(Math.min(...beak.map((v) => v[0])), 'mỏ ở bên trái').toBeLessThan(-2);
    expect(Math.max(...tail.map((v) => v[0])), 'đuôi ở bên phải').toBeGreaterThan(2);
    expect(HEN_JOINTS.forward.map((v) => Math.round(v * 1e9) / 1e9)).toEqual([-1, 0, 0]);
    // Bên trái của gà mẹ hướng về người xem (+z): cánh trái ở phía +z, cánh phải ở phía −z.
    expect(HEN_JOINTS.left[2]).toBeCloseTo(1, 9);
    const zOf = (g) => vertices(g).reduce((s, v) => s + v[2], 0) / g.attributes.position.count;
    expect(zOf(hen.wingL)).toBeGreaterThan(0.8);
    expect(zOf(hen.wingR)).toBeLessThan(-0.8);
    expect(HEN_JOINTS.shoulderL[2]).toBeGreaterThan(0);
    expect(HEN_JOINTS.shoulderR[2]).toBeLessThan(0);
    expect(HEN_JOINTS.center).toEqual([HEN.at[0], HEN.height / 2, HEN.at[1]]);
    expect(HEN_JOINTS.neck[0], 'cổ ở phía trước tâm mình').toBeLessThan(HEN.at[0] - 0.5);
  });

  it('mắt (gà con, gà mẹ, cả hai bên): đỉnh có uv.y = 1 (cực trên của cầu mắt) nằm đúng hướng từ tâm đầu ra tâm mắt; Bản nét vẽ vòng mắt và con ngươi quanh cực ấy', () => {
    // Gà mẹ dựng sẵn ở tọa độ thế giới: đưa đỉnh về khung của mẹ trước khi so với bảng khối.
    for (const [shapes, geometry, back] of [
      [CHICK_SHAPE, chickGeometry({ segments: SEGMENTS }), (v) => v],
      [HEN_SHAPE.body, henGeometry({ segments: SEGMENTS }).body, toHen],
    ]) {
      const head = shapes.find((s) => s.part === 'HEAD');
      const { position, part, uv } = geometry.attributes;
      for (const eye of shapes.filter((s) => s.part === 'EYE')) {
        const out = new Vector3(...eye.at).sub(new Vector3(...head.at)).normalize();
        const poles = [];
        for (let i = 0; i < position.count; i += 1) {
          if (part.getX(i) !== PART.EYE || uv.getY(i) < 0.9999) continue;
          const p = new Vector3(...back([position.getX(i), position.getY(i), position.getZ(i)]));
          if (Math.sign(p.x) === Math.sign(eye.at[0])) poles.push(p);
        }
        expect(poles.length, `mắt ở ${eye.at}`).toBeGreaterThan(0);
        for (const p of poles) expect(p.sub(new Vector3(...eye.at)).normalize().dot(out), `mắt ở ${eye.at}`).toBeCloseTo(1, 6);
      }
    }
  });

  it('phép thử "nằm trong khối" khớp hình thật của three: mọi đỉnh của từng khối gà mẹ (cầu xoay, nón dẹt, trụ) co 1% về tâm thì trong, nở 1% thì ngoài', () => {
    // Đỉnh của SphereGeometry, ConeGeometry, CylinderGeometry nằm đúng trên mặt khối lý tưởng; khối nào cũng lồi, tâm ở trong. Sai hướng nón
    // (đỉnh ở −y), quên phép xoay hay phép dẹt thì đỉnh co vào vẫn bị coi là ngoài, hay đỉnh nở ra vẫn bị coi là trong.
    const canonical = (s) => {
      if (s.kind === 'ball') return new SphereGeometry(s.r, 24, 14);
      if (s.kind === 'cone') return new ConeGeometry(s.r, s.h, 24);
      return new CylinderGeometry(s.r, s.r, s.h, 24);
    };
    for (const shape of henSolids) {
      const m = placement(shape);
      const center = new Vector3().setFromMatrixPosition(m);
      const { position } = canonical(shape).applyMatrix4(m).attributes;
      for (let i = 0; i < position.count; i += 1) {
        const v = new Vector3().fromBufferAttribute(position, i);
        expect(inside(shape, v.clone().lerp(center, 0.01).toArray()), `${nameOf(shape)}: đỉnh ${i} co vào`).toBe(true);
        expect(inside(shape, v.clone().sub(center).multiplyScalar(1.01).add(center).toArray()), `${nameOf(shape)}: đỉnh ${i} nở ra`).toBe(false);
      }
    }
  });

  it('con trèo lưng và con nấp bụng sát mẹ mà không lún vào mẹ: mọi đỉnh (trừ chân con trèo lưng) ở ngoài mọi khối của mẹ', () => {
    const chick = chickGeometry({ segments: SEGMENTS });
    for (const kind of ['back', 'belly']) {
      const home = HOMES.find((h) => h.kind === kind);
      const keep = kind === 'back' ? (p) => p !== PART.LEG : () => true;
      for (const v of vertices(chick, keep)) {
        const p = toHen(place(v, restPose(home)));
        for (const s of henSolids) expect(inside(s, p), `con ${kind}: đỉnh ${p.map((c) => c.toFixed(2))} lún vào ${nameOf(s)}`).toBe(false);
      }
    }
  });

  it('con trèo lưng đứng ĐÚNG trên lưng mẹ: đáy mỗi chân (đọc từ CHICK_SHAPE) chạm mặt lưng (lệch dưới 0,05), không lơ lửng', () => {
    const home = HOMES.find((h) => h.kind === 'back');
    const body = HEN_SHAPE.body.find((s) => s.part === 'BODY');
    for (const foot of chickFeet().map((f) => toHen(place(f, restPose(home))))) {
      // Mặt lưng ngay dưới (hay trên) bàn chân: tìm đôi y, một trong một ngoài khối mình, rồi chia đôi.
      let [lo, hi] = [body.at[1], body.at[1] + 2 * body.r * body.scale[1]];
      for (let i = 0; i < 50; i += 1) {
        const mid = (lo + hi) / 2;
        if (inside(body, [foot[0], mid, foot[2]])) lo = mid;
        else hi = mid;
      }
      expect(Math.abs(foot[1] - lo), `chân ở ${foot.map((c) => c.toFixed(2))}`).toBeLessThan(0.05);
    }
  });

  it.each([1.6, 390 / 844])('ở góc nhìn của tranh (khung tỉ lệ %s), thấy được cả mười con: tia qua đầu và mình mỗi con trúng chính nó trước', (aspect) => {
    const cam = createCamera(CAMERA, aspect);
    const material = new MeshBasicMaterial();
    const hen = henGeometry({ segments: SEGMENTS });
    const henMeshes = [hen.body, hen.wingL, hen.wingR].map((g) => new Mesh(g, material));
    const chicks = HOMES.map((home) => {
      const [x, y, z, h] = restPose(home);
      const mesh = new Mesh(chickGeometry({ segments: SEGMENTS }), material);
      mesh.position.set(x, y, z);
      mesh.rotation.y = h;
      mesh.updateMatrixWorld();
      return mesh;
    });
    const raycaster = new Raycaster();
    chicks.forEach((mesh, i) => {
      for (const local of [centerOf('HEAD'), centerOf('BODY')]) {
        const ndc = new Vector3(...local).applyMatrix4(mesh.matrixWorld).project(cam);
        raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
        const [hit] = raycaster.intersectObjects([...henMeshes, ...chicks], false);
        const who = chicks.indexOf(hit?.object);
        expect(who, `con ${i} (${HOMES[i].kind}) bị ${who < 0 ? 'gà mẹ' : `con ${who}`} che ở ${local}`).toBe(i);
      }
    });
  });
});
