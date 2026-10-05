// paintings/cung-que/parts/cot-sdf.js — hình SDF của Bức 3: hàm khoảng cách cơ bản, phép hòa mềm, và scene(p) = (khoảng cách, id của vật gần nhất).
import { Fn, If, abs, atan, clamp, cos, dot, exp, float, floor, length, max, min, normalize, sin, vec2, vec3 } from 'three/tsl';
import { CRATERS, CUOI, PLANET, TRAU, TREE, trauFrame } from './cot-the-gioi.js';

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
const TAU = Math.PI * 2;
/** Hố làm khoảng cách sai lệch (mặt đất là quả cầu bị dời theo hướng): nhân để tia không đi quá bề mặt. */
const LIPSCHITZ = 0.8;
const v3 = (a) => vec3(a[0], a[1], a[2]);

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

/** Khoảng cách tới một phần (dữ liệu của cot-the-gioi.js): cầu, viên thuốc hay bầu dục. */
function partDistance(p, part) {
  if (part.kind === 'sphere') return sdSphere(p.sub(v3(part.a)), part.r);
  if (part.kind === 'capsule') return sdCapsule(p, v3(part.a), v3(part.b), part.r);
  return sdEllipsoid(p.sub(v3(part.a)), v3(part.r));
}

/** Một vật ghép từ nhiều phần, hòa mềm với độ hòa nhỏ cố định: khớp tay chân liền như đất nặn. */
function figure(p, parts, k) {
  let d = float(1e3);
  for (const part of parts) d = smin(d, partDistance(p, part), k);
  return d;
}

/**
 * Rễ phụ: MỘT viên thuốc trong một nan quạt góc, lặp count lần quanh trục (domain repetition): nhiều bản mà giá như một.
 * q ở khung của cây. Mỗi rễ lệch ra vào một chút theo số thứ tự nan, để không thẳng hàng như hàng rào.
 */
function aerialRoots(q) {
  const { count, ring, top, bottom, radius } = TREE.roots;
  const sector = TAU / count;
  const a = atan(q.z, q.x.add(1e-6)); // cộng EPS: atan(0, 0) không định nghĩa
  const k = floor(a.div(sector).add(0.5));
  const da = a.sub(k.mul(sector));
  const rad = length(vec2(q.x, q.z));
  const local = vec3(rad.mul(cos(da)), q.y, rad.mul(sin(da)));
  const r = sin(k.mul(1.7)).mul(0.03).add(ring);
  return sdCapsule(local, vec3(r, bottom, 0), vec3(r.mul(0.85), top, 0), radius);
}

/** Cây đa trong khung của cây: gỗ (thân, chân rễ, cành, rễ phụ) hòa với tán (bảy khối hòa mềm theo blend). */
function treeShape(q, blend) {
  const { trunk, buttress, branches, lobes } = TREE;
  let wood = sdRoundCone(q, float(trunk.r0), float(trunk.r1), float(trunk.height));
  for (let i = 0; i < buttress.count; i += 1) {
    const a = buttress.offset + (i * TAU) / buttress.count;
    const tip = vec3(Math.cos(a) * buttress.length, -0.01, Math.sin(a) * buttress.length);
    wood = smin(wood, sdCapsule(q, vec3(0, 0.06, 0), tip, buttress.radius), 0.04);
  }
  for (const [ax, ay, az, bx, by, bz, r] of branches) wood = smin(wood, sdCapsule(q, vec3(ax, ay, az), vec3(bx, by, bz), r), 0.03);
  wood = min(wood, aerialRoots(q)); // rễ phụ mảnh: ghép cứng, hòa mềm làm chúng dính vào nhau
  let canopy = float(1e3);
  for (const [x, y, z, rx, ry, rz] of lobes) canopy = smin(canopy, sdEllipsoid(q.sub(vec3(x, y, z)), vec3(rx, ry, rz)), blend);
  return smin(wood, canopy, blend.mul(0.5));
}

/** Số hình cơ bản trong scene (số đo "Số hình SDF"); rễ phụ là một hình lặp. */
export const PRIMITIVES = 1 + CRATERS.length + 1 + TREE.buttress.count + TREE.branches.length + 1 + TREE.lobes.length
  + CUOI.parts.length + TRAU.parts.length;

/**
 * Hàm khoảng cách của cả thế giới, viết thành MỘT hàm shader (setLayout): mỗi chỗ gọi là một lời gọi hàm, không chép thân.
 * Trả vec2(khoảng cách, id của vật gần nhất). Mỗi vật có một hình cầu bao rẻ: điểm còn xa hơn vật gần nhất đã có thì khỏi tính vật đó.
 *
 * Uniform KHÔNG được đọc thẳng trong thân hàm có layout: three giữ mã của hàm theo backend và chỉ đăng ký uniform ở lần dựng đầu,
 * nên lần dựng sau (khi xưởng biên dịch lại, ví dụ lúc đổi MRT) WGSL báo "struct member … not found" (Phụ lục A.87). Vì vậy độ cao
 * bay và độ hòa khối đi vào làm tham số (tên `blend`: `smooth` là từ khóa của WGSL và GLSL); chỗ gọi (trong hàm chính) đọc uniform.
 * @param {{ lift: any, smooth: any }} u  uniform: độ cao bay của cây (spec §19.5); độ hòa khối (núm smooth; thí nghiệm "Hòa khối
 *   cứng" đưa về 0)
 * @returns {(p: any) => any}  scene(p) → vec2
 */
export function createScene({ lift, smooth }) {
  const frame = trauFrame();
  const fn = Fn(([p, liftY, blend]) => {
    const d = ground(p).toVar();
    const id = float(ID.GROUND).toVar();
    // Khung của cây: gốc ở (0, R + lift, 0). Cuội dời theo cây (níu rễ, spec §19.2).
    const q = p.sub(vec3(0, liftY.add(R), 0));
    If(length(q.sub(v3(TREE.bound.center))).sub(TREE.bound.radius).lessThan(d), () => {
      const tree = treeShape(q, blend);
      If(tree.lessThan(d), () => {
        id.assign(ID.TREE);
      });
      d.assign(smin(d, tree, blend)); // chân rễ hòa với đất: cây bay lên quá độ hòa thì đứt
    });
    If(length(q.sub(v3(CUOI.bound.center))).sub(CUOI.bound.radius).lessThan(d), () => {
      const body = figure(q, CUOI.parts, CUOI.blend);
      If(body.lessThan(d), () => {
        id.assign(ID.CUOI);
      });
      d.assign(min(d, body));
    });
    // Khung của trâu: x trước, y lên (ra ngoài hành tinh), z sang bên. Trâu không dời theo cây.
    const o = p.sub(v3(frame.origin));
    const b = vec3(dot(o, v3(frame.forward)), dot(o, v3(frame.up)), o.z);
    If(length(b.sub(v3(TRAU.bound.center))).sub(TRAU.bound.radius).lessThan(d), () => {
      const body = figure(b, TRAU.parts, TRAU.blend);
      If(body.lessThan(d), () => {
        id.assign(ID.TRAU);
      });
      d.assign(min(d, body));
    });
    return vec2(d, id);
  }).setLayout({
    name: 'sdfScene',
    type: 'vec2',
    inputs: [{ name: 'p', type: 'vec3' }, { name: 'lift', type: 'float' }, { name: 'blend', type: 'float' }],
  });
  return (p) => fn(p, lift, smooth);
}
