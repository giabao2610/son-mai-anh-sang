// paintings/cung-que/parts/la-da-mesh.js — mesh lá đa: InstancedMesh cấp theo trần một lần; positionNode tính đường rơi và độ xoay trên GPU từ thời gian (thuộc tính chỉ ghi lúc chạm); tô bằng recipe của khối bao.
import { DoubleSide, InstancedBufferAttribute, InstancedMesh, NodeMaterial, Shape, ShapeGeometry } from 'three/webgpu';
import {
  Fn, cameraPosition, clamp, cos, cross, dot, faceDirection, float, instancedBufferAttribute, length, max, normalLocal, normalWorld,
  normalize, positionLocal, positionWorld, sin, sqrt, step,
} from 'three/tsl';
import { FALL } from './la-da-roi.js';

/** Xoay v quanh trục đơn vị k một góc a (công thức Rodrigues). */
const rotate = (v, k, a) => v.mul(cos(a)).add(cross(k, v).mul(sin(a))).add(k.mul(dot(k, v)).mul(float(1).sub(cos(a))));

/** Lá đa: hình bầu dục có mũi nhọn, dài chừng 0,07 (lớn hơn lá thật để thấy được ở khoảng cách của camera). */
function leafGeometry() {
  const s = new Shape();
  s.moveTo(0, -0.025);
  s.quadraticCurveTo(0.018, -0.01, 0.012, 0.012);
  s.quadraticCurveTo(0.004, 0.022, 0, 0.03);
  s.quadraticCurveTo(-0.004, 0.022, -0.012, 0.012);
  s.quadraticCurveTo(-0.018, -0.01, 0, -0.025);
  return new ShapeGeometry(s, 3).scale(1.3, 1.3, 1);
}

/**
 * Lá rơi vẽ bằng một InstancedMesh: mỗi ô của `fall` là một bản. Vị trí thật chỉ có trong shader, tính từ thời gian như
 * `fall.state` (cùng công thức), nên CPU không bước gì mỗi khung.
 * @param {{ fall: object, time: any, w: any, shade: (h: object) => any, radius: number, leafId: number, glow: any }} p
 *   fall: createLeafFall(); time: ctx.u.time; w: trọng số của lớp (lá nhỏ về 0 khi mài); shade: công thức tô của khối bao;
 *   glow: màu tỏa của lá (node vec3)
 * @returns {{ mesh: InstancedMesh, sync: () => void }}  sync() ghi lại thuộc tính khi có cú chạm mới
 */
export function createLeafMesh({ fall, time, w, shade, radius, leafId, glow }) {
  const cap = fall.slots.length;
  // Bốn thuộc tính vec4 mỗi lá: (t0, g, spin, —), (p0, —), (v0, —), (trục quay, —). Chỉ ghi lúc chạm: usage mặc định (Static).
  const attrs = [0, 1, 2, 3].map(() => new InstancedBufferAttribute(new Float32Array(cap * 4), 4));
  const [A, P, V, X] = attrs.map((a) => instancedBufferAttribute(a));

  const material = new NodeMaterial();
  material.side = DoubleSide;
  material.fog = false;
  material.positionNode = Fn(() => {
    const p0 = P.xyz;
    const g = max(A.y, 1e-4);
    const u = normalize(p0);
    const vu = dot(V.xyz, u);
    const h0 = max(length(p0).sub(radius), 0);
    const landAt = vu.add(sqrt(max(vu.mul(vu).add(g.mul(2).mul(h0)), 0))).div(g);
    const tau = time.sub(A.x);
    const tf = clamp(tau, 0, landAt);
    const center = p0.add(V.xyz.mul(tf)).sub(u.mul(g.mul(0.5).mul(tf).mul(tf)));
    const after = tau.sub(landAt).sub(FALL.rest);
    const size = step(0, tau).mul(float(1).sub(clamp(after.div(FALL.fade), 0, 1))).mul(w);
    const angle = A.z.mul(tf); // lá thôi quay khi chạm đất
    normalLocal.assign(rotate(normalLocal, X.xyz, angle));
    return center.add(rotate(positionLocal.mul(size), X.xyz, angle));
  })();
  // Lá tô bằng cùng recipe với khối bao: điểm chạm là điểm trên lá, pháp tuyến quay về phía người nhìn (lá hai mặt)
  material.colorNode = Fn(() => shade({
    p: positionWorld, n: normalWorld.mul(faceDirection), v: normalize(cameraPosition.sub(positionWorld)), id: float(leafId),
  }))();
  // Lá đa thần tỏa nhẹ (lá thuốc trong truyện Cuội): thấy được cả khi lá rơi trong bóng tán hay về đêm, và Phủ bóng làm nó lấp lánh
  material.emissiveNode = glow.mul(w);

  const mesh = new InstancedMesh(leafGeometry(), material, cap);
  mesh.frustumCulled = false; // vị trí thật chỉ có trong shader
  mesh.name = 'la-roi';

  let seen = -1;
  /** Ghi lại thuộc tính khi có cú chạm mới (fall.version đổi). */
  function sync() {
    if (fall.version === seen) return;
    seen = fall.version;
    fall.slots.forEach((s, i) => {
      attrs[0].array.set([s.t0, s.g, s.spin, 0], i * 4);
      attrs[1].array.set([...s.p0, 0], i * 4);
      attrs[2].array.set([...s.v0, 0], i * 4);
      attrs[3].array.set([...s.axis, 0], i * 4);
    });
    for (const a of attrs) a.needsUpdate = true;
  }
  sync();
  return { mesh, sync };
}
