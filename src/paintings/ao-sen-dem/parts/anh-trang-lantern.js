// paintings/ao-sen-dem/parts/anh-trang-lantern.js — đèn hoa đăng của lớp Ánh trăng: đèn ở bờ và mọi hoa đăng thả ra chung MỘT InstancedMesh; mỗi khung ghi ma trận, tâm, độ sáng.
import {
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardNodeMaterial,
  Object3D,
  Vector4,
} from 'three/webgpu';
import { attribute, color, mix, uniform, uniformArray, uv } from 'three/tsl';
import { lanternAt } from './anh-trang-drift.js';

export const PETALS = 8; // số cánh của một đèn
// Đèn ở bờ (số của l2 trước GĐ 5): chỗ đặt, bán kính vòng cánh, cỡ cánh, góc ngả. Góc ngả là góc xoay quanh trục X của
// cánh, như cánh sen của Cốt: âm thì mũi cánh ngả ra ngoài, dương thì chụm vào trong.
export const SHORE = { position: [-5, 0.08, 13], radius: 0.12, scale: 0.55, tilt: -0.45 };
// Búp vừa thả: cánh chụm vào trên ngọn nến (mũi cánh vốn cong ra ngoài, nên vẫn hở một chút ở đỉnh), rồi nở dần tới đúng
// góc của đèn ở bờ.
const CLOSED_TILT = 0.25;
// Chìm hẳn: đèn nhỏ đi 35% và xuống thấp 0,45 đơn vị, đủ để cả mũi cánh cũng ở dưới mặt nước (y = 0) trước khi ô bị
// giấu: đèn lặn mất chứ không biến mất đột ngột. Ở khung cuối mũi cánh chỉ còn dưới mặt nước chừng 0,06, nên thứ gì
// nâng đèn lên trong lúc chìm (nhấp nhô theo gợn) phải nhạt dần theo sink như độ sáng, kẻo mũi cánh nhô lên đúng lúc
// ô bị giấu.
const SINK = { shrink: 0.35, drop: 0.45 };

/**
 * Mọi đèn hoa đăng của lớp Ánh trăng trong MỘT InstancedMesh (một draw call), cấp phát MỘT lần theo sức chứa của vòng
 * đệm: ô 0 là đèn ở bờ (đứng yên, ghi một lần), ô i + 1 là ô i của vòng đệm (anh-trang-drift.js). Mọi đèn chung một
 * material, nên núm candleColor, thí nghiệm "Đổi màu đèn" và trọng số của lớp áp cho tất cả.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ geometry: any, w: any, candle: any, slots: ReturnType<typeof import('./anh-trang-drift.js').createLanternSlots> }} p
 *   geometry: shared.cot.petalGeometry (hình cánh Cốt dựng riêng cho đèn, chỉ đèn dùng: gắn thêm thuộc tính instance vào
 *   đây được); w: trọng số của lớp; candle: uniform màu nến (núm candleColor); slots: vòng đệm shared.lanterns
 * @returns {{ mesh: any, material: any, flame: any, swap: any, pool: { node: any, count: any, size: number },
 *   write: (t: number) => void, alive: (t: number) => number, dispose: () => void }}
 *   pool (cho lớp Mặt nước): node = uniformArray `size` ô vec4(x, z, độ sáng, 0), tên lanternPool; count = uniform FLOAT
 *   lanternCount, số đèn đang trôi: shader so nó với chỉ số vòng lặp (số nguyên) thì đổi chỉ số sang float trước.
 */
export function createLanterns(ctx, { geometry, w, candle, slots }) {
  const hex = ctx.palette.hex;
  const ring = slots.slots;
  const size = (1 + ring.length) * PETALS;
  // Thuộc tính theo từng bản (8 bản của một đèn mang cùng số): tâm đèn (x, z) để lớp Mặt nước lấy độ cao gợn tại đó, và
  // độ sáng 0 → 1. Để usage mặc định: renderer chỉ chép thuộc tính lên GPU khi version của nó tăng (needsUpdate), tức
  // lúc có đèn trôi và thêm MỘT khung để giấu đèn vừa tắt. Đừng setUsage(DynamicDrawUsage): ở r186 cờ đó nghĩa là
  // "chép lại ở MỌI lần render, bất kể version" (renderers/common/Attributes.js, chung cho WebGPU và WebGL2), nên ao
  // trống vẫn chép ở mỗi lần render có vẽ đèn: cảnh chính, rồi ảnh phản chiếu của reflector.
  const centers = new InstancedBufferAttribute(new Float32Array(size * 2), 2);
  const glows = new InstancedBufferAttribute(new Float32Array(size), 1);
  geometry.setAttribute('lanternCenter', centers);
  geometry.setAttribute('lanternGlow', glows);

  // Thí nghiệm "Đổi màu đèn": 0 = màu nến của núm, 1 = đỏ son. Cùng một ánh sáng, mỗi chất liệu đáp lại một kiểu.
  const swap = uniform(0).setName('anh_trang_swap');
  const flame = mix(candle, color(hex.doSon), swap);
  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép. lanternGlow là độ sáng riêng của từng đèn:
  // đèn ở bờ luôn 1; hoa đăng sáng dần lúc thả, tắt dần khi chìm.
  material.emissiveNode = flame.mul(mix(1.6, 0.3, uv().y)).mul(w).mul(attribute('lanternGlow', 'float'));

  const mesh = new InstancedMesh(geometry, material, size);
  mesh.name = 'hoa-dang';
  // Ma trận: (2 + lanterns) × 8 bản × 64 byte, tối đa 5 KB, dưới giới hạn uniform buffer (WebGPU ≥ 64 KB, WebGL2
  // ≥ 16 KB). Khi đó three (nodes/accessors/Instance.js) đặt instanceMatrix vào uniform buffer của từng vật và chép lại
  // nguyên bộ đệm ở MỖI lượt vẽ, dù needsUpdate có bật hay không: 5 KB thì rẻ, và không tránh được. needsUpdate chỉ có
  // tác dụng khi vượt giới hạn (three chuyển sang thuộc tính interleaved); ở đường đó DynamicDrawUsage cũng ép chép mỗi
  // lần render, nên ma trận cũng để usage mặc định.
  const [shoreX, shoreY, shoreZ] = SHORE.position;
  // Ô trống: ma trận cỡ 0 dồn mọi đỉnh về một điểm. Tam giác suy biến không phủ điểm ảnh nào, nên GPU bỏ nó ngay sau vertex
  // shader: ô trống gần như không tốn gì, và count của mesh không bao giờ phải đổi. Điểm đó đặt ngay ở đèn ở bờ để ô trống
  // không làm khung bao của mesh phình ra: ao chưa có hoa đăng thì khung bao chỉ ôm đèn ở bờ, và khi đèn ở bờ ra khỏi khung
  // hình (điện thoại dọc) thì frustum culling vẫn bỏ qua cả mesh như trước.
  const hidden = new Matrix4().makeScale(0, 0, 0).setPosition(shoreX, shoreY, shoreZ);

  const dummy = new Object3D();
  dummy.rotation.order = 'YXZ'; // ma trận = Ry · Rx: cánh ngả quanh trục X của nó trước, rồi mới quay theo hướng
  /**
   * Ghi 8 cánh của MỘT đèn vào ô `slot` (bản slot·8 … slot·8 + 7). Cánh k đứng trên vòng bán kính `radius` quanh (x, z),
   * quay mặt về góc yaw + k·45°: −Z của cánh chỉ ra ngoài, lòng cánh (+Z) hướng vào ngọn nến.
   */
  const place = (slot, { x, y, z, yaw, tilt, scale, radius }) => {
    for (let k = 0; k < PETALS; k++) {
      const a = yaw + (k / PETALS) * Math.PI * 2;
      dummy.position.set(x + Math.cos(a) * radius, y, z + Math.sin(a) * radius);
      dummy.rotation.set(tilt, -a - Math.PI / 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot * PETALS + k, dummy.matrix);
    }
  };
  /** Tâm và độ sáng của cả 8 bản trong ô `slot`. */
  const mark = (slot, x, z, glow) => {
    for (let i = slot * PETALS; i < (slot + 1) * PETALS; i++) {
      centers.setXY(i, x, z);
      glows.setX(i, glow);
    }
  };
  /**
   * Giấu cả 8 bản của ô `slot`. Tâm cũng về đèn ở bờ (như ma trận): ô trống không giữ dấu gì của đèn cũ, nên nội dung
   * các mảng chỉ phụ thuộc t, không phụ thuộc trước đó đã vẽ những khung nào.
   */
  const hide = (slot) => {
    for (let i = slot * PETALS; i < (slot + 1) * PETALS; i++) {
      mesh.setMatrixAt(i, hidden);
      centers.setXY(i, shoreX, shoreZ);
      glows.setX(i, 0);
    }
  };

  // Chưa vẽ lần nào: lần vẽ đầu chép nguyên các mảng lên GPU, nên ghi xong ở đây không cần needsUpdate.
  place(0, { x: shoreX, y: shoreY, z: shoreZ, yaw: 0, tilt: SHORE.tilt, scale: SHORE.scale, radius: SHORE.radius });
  mark(0, shoreX, shoreZ, 1);
  for (let slot = 1; slot <= ring.length; slot++) hide(slot);

  // Cho lớp Mặt nước (vũng sáng quanh đèn): đèn đang trôi dồn lên đầu, mỗi ô vec4(x, z, độ sáng, 0). Shader lặp tối đa
  // `size` vòng và Break khi tới `count`: ao không có đèn trôi thì không chạy vòng nào. Mảng có tên để mã WGSL và
  // Inspector gọi nó là lanternPool chứ không phải NodeBuffer_<số>. WebGL2 thì không: GLSLNodeBuilder của r186 vẫn đặt
  // tên NodeBuffer_<số> cho khối uniform, và ghi đè luôn tên của node.
  const spots = ring.map(() => new Vector4(0, 0, 0, 0)); // Vector4() mặc định w = 1; ô trống là (0, 0, 0, 0) ngay từ đầu
  const pool = {
    node: uniformArray(spots, 'vec4').setName('lanternPool'),
    count: uniform(0).setName('lanternCount'), // uniform(0) là float, không phải int
    size: ring.length,
  };
  const shown = ring.map(() => false); // ô đang có cánh hiện: đèn vừa tắt thì ghi thêm MỘT lần để giấu cánh của nó

  return {
    mesh,
    material,
    flame, // màu nến (đã tính "Đổi màu đèn"): lớp Mặt nước tô vũng sáng bằng màu này
    swap,
    pool,
    /**
     * Mỗi khung, kể cả lần vẽ lại update(0, t): chỗ, dáng và độ sáng của từng đèn tính thẳng từ t (lanternAt), nên cùng t
     * thì cùng ma trận. Chỉ ghi ô có đèn sống và ô vừa tắt; ao không có đèn trôi thì không ghi gì và không đánh dấu
     * needsUpdate: hai thuộc tính instance không phải chép lên GPU (ma trận thì three vẫn chép theo uniform buffer của
     * mỗi lượt vẽ, xem trên).
     */
    write(t) {
      let live = 0;
      let dirty = false;
      ring.forEach((slot, i) => {
        const s = lanternAt(slot, t);
        if (s.alive) {
          const k = 1 - SINK.shrink * s.sink; // chìm thì nhỏ dần, cả vòng cánh lẫn cánh
          place(i + 1, {
            x: s.x,
            y: shoreY - SINK.drop * s.sink,
            z: s.z,
            yaw: s.yaw,
            tilt: CLOSED_TILT + (SHORE.tilt - CLOSED_TILT) * s.open,
            scale: SHORE.scale * k,
            radius: SHORE.radius * k,
          });
          mark(i + 1, s.x, s.z, s.glow);
          spots[live++].set(s.x, s.z, s.glow, 0);
        } else if (shown[i]) {
          hide(i + 1);
        }
        if (s.alive || shown[i]) dirty = true;
        shown[i] = s.alive;
      });
      for (let j = live; j < spots.length; j++) spots[j].set(0, 0, 0, 0);
      pool.count.value = live;
      if (!dirty) return;
      mesh.instanceMatrix.needsUpdate = true;
      centers.needsUpdate = true;
      glows.needsUpdate = true;
      // InstancedMesh tính khung bao một lần rồi giữ nguyên (setMatrixAt không tính lại): không tính lại thì đèn trôi ra
      // ngoài khung cũ, và khi khung cũ ra khỏi màn hình thì frustum culling bỏ cả mesh, mất luôn mọi đèn.
      mesh.computeBoundingSphere();
    },
    /** Số đèn còn sống lúc t (đang nổi + đang chìm): số đo "Hoa đăng đang trôi". */
    alive: (t) => slots.alive(t),
    /** Geometry là của Cốt (Cốt gỡ): ở đây chỉ gỡ mesh và material. */
    dispose() {
      mesh.dispose();
      material.dispose();
    },
  };
}
