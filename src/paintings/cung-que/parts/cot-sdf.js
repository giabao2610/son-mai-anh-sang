// paintings/cung-que/parts/cot-sdf.js — hình SDF của Bức 3: hàm khoảng cách cơ bản, phép hòa mềm, và scene(p) = (khoảng cách, id của vật gần nhất).
import { Fn, If, abs, clamp, dot, exp, float, length, max, min, normalize, vec2, vec3 } from 'three/tsl';
import { CRATERS, PLANET, TREE } from './cot-the-gioi.js';

/** Id của vật, để các lớp sau tô màu theo vật (lá rơi là mesh riêng nhưng tô bằng cùng công thức). */
export const ID = Object.freeze({ GROUND: 0, TREE: 1, CUOI: 2, TRAU: 3, LEAF: 4 });

export const sdSphere = (p, r) => length(p).sub(r);
/** Bầu dục (Inigo Quilez): gần đúng, đủ tốt khi ba bán kính không chênh nhau quá nhiều. */
export const sdEllipsoid = (p, r) => {
  const k0 = length(p.div(r));
  const k1 = length(p.div(r.mul(r)));
  return k0.mul(k0.sub(1)).div(max(k1, 1e-5));
};
export const sdCapsule = (p, a, b, r) => {
  const pa = p.sub(a);
  const ba = b.sub(a);
  const h = clamp(dot(pa, ba).div(dot(ba, ba)), 0, 1);
  return length(pa.sub(ba.mul(h))).sub(r);
};
/** Nón tròn đứng (trục Y, đáy ở y = 0): bán kính r0 ở đáy, r1 ở đỉnh, cao h. Gần đúng: viên thuốc có bán kính đổi theo độ cao. */
export const sdRoundCone = (p, r0, r1, h) => {
  const y = clamp(p.y.div(h), 0, 1);
  return length(vec3(p.x, p.y.sub(y.mul(h)), p.z)).sub(r0.add(r1.sub(r0).mul(y)));
};
/** Hòa mềm (Quilez, đa thức bậc hai). k là bề rộng vùng hòa; k → 0 thì thành min (sàn 1e-5 tránh chia 0). */
export const smin = (a, b, k) => {
  const kk = max(k, 1e-5);
  const h = max(kk.sub(abs(a.sub(b))), 0).div(kk);
  return min(a, b).sub(h.mul(h).mul(kk).mul(0.25));
};

const R = PLANET.radius;
/** Hố làm khoảng cách sai lệch (mặt đất là quả cầu bị dời theo hướng): nhân để tia không đi quá bề mặt. */
const LIPSCHITZ = 0.8;

/** Mặt đất: quả cầu có hố. Mỗi hố lõm theo khoảng cách dây cung tới tâm hố, có gờ thấp (rẻ: không acos, không noise). */
function ground(p) {
  const n = normalize(p);
  let height = float(0);
  for (const c of CRATERS) {
    const len = Math.hypot(...c.dir);
    const x = length(n.sub(vec3(c.dir[0] / len, c.dir[1] / len, c.dir[2] / len))).div(c.radius);
    const bowl = max(float(1).sub(x.mul(x)), 0).mul(-c.depth);
    const edge = x.sub(1).div(0.25);
    const rim = exp(edge.mul(edge).negate()).mul(c.rim);
    height = height.add(bowl).add(rim);
  }
  return length(p).sub(height.add(R)).mul(LIPSCHITZ);
}

/** Số hình cơ bản trong scene (số đo "Số hình SDF"): đất, sáu hố, thân, bảy khối tán. Task 2 cộng thêm khi thêm hình. */
export const PRIMITIVES = 1 + CRATERS.length + 1 + TREE.lobes.length;

/**
 * Hàm khoảng cách của cả thế giới, viết thành MỘT hàm shader (setLayout): mỗi chỗ gọi là một lời gọi hàm, không chép thân.
 * Trả vec2(khoảng cách, id của vật gần nhất).
 *
 * Uniform KHÔNG được đọc thẳng trong thân hàm có layout: three giữ mã của hàm theo backend và chỉ đăng ký uniform ở lần dựng đầu,
 * nên lần dựng sau (khi xưởng biên dịch lại, ví dụ lúc đổi MRT) WGSL báo "struct member … not found" (Phụ lục A.87). Vì vậy độ cao
 * bay và độ hòa khối đi vào làm tham số; chỗ gọi (trong hàm chính) đọc uniform.
 * @param {{ lift: any, smooth: any }} u  uniform: độ cao bay của cây (spec §19.5); độ hòa khối (núm smooth; thí nghiệm "Hòa khối
 *   cứng" đưa về 0)
 * @returns {(p: any) => any}  scene(p) → vec2
 */
export function createScene({ lift, smooth }) {
  const fn = Fn(([p, liftY, blend]) => {
    const d = ground(p).toVar();
    const id = float(ID.GROUND).toVar();
    // Cây trong khung riêng: gốc ở (0, R + lift, 0)
    const q = p.sub(vec3(0, liftY.add(R), 0));
    // Hình bao rẻ của cả cây (thân + tán): còn xa hơn vật gần nhất thì khỏi tính cây
    const treeBound = length(q.sub(vec3(0, 0.42, 0))).sub(0.72);
    If(treeBound.lessThan(d), () => {
      const trunk = sdRoundCone(q, float(TREE.trunk.r0), float(TREE.trunk.r1), float(TREE.trunk.height));
      let canopy = float(1e3);
      for (const [x, y, z, rx, ry, rz] of TREE.lobes) {
        canopy = smin(canopy, sdEllipsoid(q.sub(vec3(x, y, z)), vec3(rx, ry, rz)), blend);
      }
      const tree = smin(trunk, canopy, blend.mul(0.5));
      // Chân cây hòa với đất: cây bay lên quá độ hòa thì đứt (spec §19.2)
      const joined = smin(d, tree, blend);
      If(tree.lessThan(d), () => {
        id.assign(ID.TREE);
      });
      d.assign(joined);
    });
    return vec2(d, id);
  }).setLayout({
    name: 'sdfScene',
    type: 'vec2',
    inputs: [{ name: 'p', type: 'vec3' }, { name: 'lift', type: 'float' }, { name: 'blend', type: 'float' }],
  });
  return (p) => fn(p, lift, smooth);
}
