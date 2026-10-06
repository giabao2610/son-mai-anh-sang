// paintings/dan-ga-me-con/parts/cot-hinh-ga.js — của lớp Cốt: hình gà ghép từ khối cơ bản (cầu kéo dãn, nón, trụ) thành BufferGeometry, mỗi đỉnh mang thuộc tính `part`; positionNode cho đầu cúi, cánh xòe, chân bới và Tấm bìa phẳng.
import { BufferAttribute, ConeGeometry, CylinderGeometry, Quaternion, SphereGeometry, Vector3 } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Fn, abs, attribute, cos, cross, dot, float, normalLocal, positionLocal, sin, step, vec3 } from 'three/tsl';
import { CHICK, HEN } from './cot-bo-cuc.js';

/** Phần của hình gà (thuộc tính `part`, số thực). Mọi phần từ HEAD trở lên đi theo đầu khi cúi, gật, ngoảnh. */
export const PART = Object.freeze({ BODY: 0, TAIL: 1, LEG: 2, WING: 3, HEAD: 4, BEAK: 5, COMB: 6, EYE: 7, BEE: 8 });

const RAD = Math.PI / 180;
/** Hướng của đỉnh nón: đuôi gà con chĩa ra sau (−z), ngóc lên 35°; đuôi gà mẹ ngóc lên 55°; mỏ chĩa ra trước (+z). */
const TAIL = [0, Math.sin(35 * RAD), -Math.cos(35 * RAD)];
const HEN_TAIL = [0, Math.sin(55 * RAD), -Math.cos(55 * RAD)];
const AHEAD = [0, 0, 1];

// Một khối: cầu kéo dãn (bán kính, tỉ lệ), nón (bán kính đáy, cao, hướng của đỉnh) hay trụ (bán kính, cao); `at` là tâm. `detail` < 1:
// khối nhỏ (mắt, mào, ong, chân) có ít vòng hơn núm `segments`. `tilt` [x, z]: xoay (rad) quanh trục x rồi z sau khi kéo dãn (cánh mẹ,
// cánh ong). Nón có `flat` < 1 thì dẹt ngang (trục x) thành cái quạt, như đuôi gà mẹ.
const ball = (part, r, scale, at, { detail = 1, tilt = [0, 0] } = {}) => ({ part, kind: 'ball', r, scale, at, detail, tilt });
const cone = (part, r, h, dir, at, { flat = 1 } = {}) => ({ part, kind: 'cone', r, h, dir, at, detail: 1, flat });
const rod = (part, r, h, at) => ({ part, kind: 'rod', r, h, at, detail: 0.5 });
/** Một khối và ảnh gương của nó qua mặt giữa (x → −x): hai chân, hai cánh, hai mắt. Khối có xoay quanh z thì xoay ngược lại. */
const pair = (shape) => [
  shape,
  { ...shape, at: [-shape.at[0], shape.at[1], shape.at[2]], tilt: shape.tilt && [shape.tilt[0], -shape.tilt[1]] },
];

/**
 * Gà con trong khung của nó (chân ở gốc, trước +z, lên +y): tròn mập như tượng đất (spec §20.3); mỏ, đuôi là khối đơn giản. Số thiết kế,
 * chốt ở điểm duyệt ảnh (GĐ 8 Task 4).
 */
export const CHICK_SHAPE = Object.freeze([
  ball('BODY', 0.45, [1, 0.9, 1.25], [0, 0.48, -0.05]),
  cone('TAIL', 0.14, 0.3, TAIL, [0, 0.62, -0.6]),
  ...pair(rod('LEG', 0.04, 0.22, [0.14, 0.11, 0])),
  ...pair(ball('WING', 0.3, [0.35, 0.6, 1], [0.4, 0.5, -0.05])),
  ball('HEAD', 0.3, [1, 1, 1], [0, 0.88, 0.38]),
  cone('BEAK', 0.07, 0.16, AHEAD, [0, 0.86, 0.72]),
  ...pair(ball('EYE', 0.045, [1, 1, 1], [0.2, 0.95, 0.55], { detail: 0.5 })),
]);

// Cánh gà mẹ: cầu dẹt áp vào sườn, đuôi cánh hếch lên phía sau.
const [wingL, wingR] = pair(ball('WING', 1, [0.3, 0.55, 1.15], [0.98, 1.55, -0.3], { tilt: [0.25, 0] }));
/**
 * Gà mẹ trong khung của nó (như gà con): mình và đầu như bản khung; phần nhỏ (chân, mỏ, mắt) lấy số của gà con nhân chừng 2,7; đuôi là cái
 * quạt (nón dẹt) mọc từ phía trên lưng sau, cánh to hơn để thành mảng màu. Mào là ba cầu nhỏ trên đỉnh đầu; con ong ngậm ở đầu mỏ, có hai
 * cánh mỏng (mọi phần của ong mang PART.BEE, nên đi theo đầu). Hai cánh là hai geometry riêng: cánh trái (+x, phía người xem khi mẹ quay
 * sang −x) và cánh phải.
 */
export const HEN_SHAPE = Object.freeze({
  body: Object.freeze([
    ball('BODY', 1, [1.2, 1.1, 2], [0, 1.6, 0]),
    cone('TAIL', 0.62, 1.4, HEN_TAIL, [0, 2.3, -1.75], { flat: 0.45 }),
    ...pair(rod('LEG', 0.11, 0.6, [0.38, 0.3, 0])),
    ball('HEAD', 0.6, [1, 1, 1], [0, 2.7, 1.6]),
    cone('BEAK', 0.19, 0.43, AHEAD, [0, 2.62, 2.36]),
    ...[[3.25, 1.3], [3.32, 1.58], [3.24, 1.86]].map(([y, z]) => ball('COMB', 0.16, [0.6, 1, 1], [0, y, z], { detail: 0.5 })),
    ...pair(ball('EYE', 0.1, [1, 1, 1], [0.4, 2.84, 1.94], { detail: 0.5 })),
    ball('BEE', 0.16, [1, 0.8, 1.4], [0, 2.6, 2.76], { detail: 0.5 }),
    ...pair(ball('BEE', 0.17, [0.09, 0.65, 1], [0.05, 2.8, 2.72], { detail: 0.5, tilt: [-0.5, 0.35] })),
  ]),
  wingL,
  wingR,
});

/** Khớp của gà mẹ trong khung của nó: cổ (đầu gật, ngoảnh quanh đây), hông của chân trái (chân bới), vai trái (cánh trái xòe quanh trục trước). */
const NECK = [0, 2.3, 1.25];
const HIP = [0.38, 0.6, 0];
const SHOULDER = [0.95, 2, 0];

const cosH = Math.cos(HEN.heading);
const sinH = Math.sin(HEN.heading);
/** Quay một hướng của khung gà mẹ sang thế giới (như rotation.y = HEN.heading của three); điểm thì dời thêm tới HEN.at. */
const turnToWorld = ([x, y, z]) => [x * cosH + z * sinH, y, z * cosH - x * sinH];
const toWorld = (p) => turnToWorld(p).map((v, i) => v + [HEN.at[0], 0, HEN.at[1]][i]);

/**
 * Khớp và trục của gà mẹ ở tọa độ thế giới, tính bằng JS lúc dựng (geometry của mẹ đã xoay, dời sẵn, nên positionLocal là tọa độ thế
 * giới): trục trước, trục ngang (sang trái mẹ), cổ, hông chân trái, hai vai, và tâm mẹ (Tấm bìa phẳng dẹt quanh đó).
 */
export const HEN_JOINTS = Object.freeze({
  at: [HEN.at[0], 0, HEN.at[1]],
  center: [HEN.at[0], HEN.height / 2, HEN.at[1]],
  forward: turnToWorld([0, 0, 1]),
  left: turnToWorld([1, 0, 0]),
  neck: toWorld(NECK),
  hip: toWorld(HIP),
  shoulderL: toWorld(SHOULDER),
  shoulderR: toWorld([-SHOULDER[0], SHOULDER[1], SHOULDER[2]]),
});

/** Một khối đã đặt chỗ, mọi đỉnh mang `part`. Bỏ index: mergeGeometries cần mọi geometry cùng có hay cùng không có index. */
export function piece(geometry, part) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.setAttribute('part', new BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
  return g;
}

const UP = new Vector3(0, 1, 0);
/** Dựng một khối thành geometry. `segments`: số vòng quanh của khối (núm Cốt). Nón và trụ của three dựng dọc +y, nên quay đỉnh nón theo dir. */
function solid(shape, segments) {
  const n = Math.max(6, Math.round(segments * shape.detail));
  let g;
  if (shape.kind === 'ball') {
    g = new SphereGeometry(shape.r, n, Math.max(6, Math.round(n * 0.6))).scale(...shape.scale).rotateX(shape.tilt[0]).rotateZ(shape.tilt[1]);
  } else if (shape.kind === 'cone') {
    g = new ConeGeometry(shape.r, shape.h, n).scale(shape.flat, 1, 1)
      .applyQuaternion(new Quaternion().setFromUnitVectors(UP, new Vector3(...shape.dir).normalize()));
  } else {
    g = new CylinderGeometry(shape.r, shape.r, shape.h, n);
  }
  return piece(g.translate(...shape.at), PART[shape.part]);
}

const build = (shapes, segments) => mergeGeometries(shapes.map((shape) => solid(shape, segments)));

/**
 * Gà con trong khung của nó (CHICK_SHAPE). Mười con dùng chung geometry này (InstancedMesh); chỗ, hướng, góc cúi áp trong positionNode.
 * @param {{ segments: number }} p
 */
export function chickGeometry({ segments }) {
  return build(CHICK_SHAPE, segments);
}

/**
 * Gà mẹ: ba geometry (mình kèm mọi phần khác, cánh trái, cánh phải), xoay sẵn sang HEN.heading và dời tới HEN.at, nên tọa độ của mesh là
 * tọa độ thế giới.
 * @param {{ segments: number }} p
 * @returns {{ body: import('three/webgpu').BufferGeometry, wingL: import('three/webgpu').BufferGeometry, wingR: import('three/webgpu').BufferGeometry }}
 */
export function henGeometry({ segments }) {
  const place = (g) => g.rotateY(HEN.heading).translate(HEN.at[0], 0, HEN.at[1]);
  return {
    body: place(build(HEN_SHAPE.body, segments)),
    wingL: place(build([HEN_SHAPE.wingL], segments)),
    wingR: place(build([HEN_SHAPE.wingR], segments)),
  };
}

/** Xoay điểm (hay pháp tuyến, khi pivot là vec3(0)) quanh trục đơn vị `axis` qua `pivot` một góc `angle` (công thức Rodrigues). */
export const rotateAround = (p, pivot, axis, angle) => {
  const v = p.sub(pivot);
  const cosA = cos(angle);
  return pivot.add(v.mul(cosA)).add(cross(axis, v).mul(sin(angle))).add(axis.mul(dot(axis, v).mul(float(1).sub(cosA))));
};

/** Tấm bìa phẳng: dẹt điểm p (thế giới) về mặt phẳng qua `center`, vuông góc với hướng nhìn `view` của tranh, còn `keep` phần (1: nguyên). */
export const flatten = (p, center, view, keep) => p.sub(view.mul(dot(p.sub(center), view).mul(float(1).sub(keep))));

const ZERO = vec3(0);
const Y = vec3(0, 1, 0);
/** 1 ở phần `part`, 0 ở phần khác. Thuộc tính `part` là số thực: so bằng khoảng cách nửa đơn vị, không so bằng ==. */
const isPart = (part) => float(1).sub(step(0.5, abs(attribute('part', 'float').sub(part))));
/** 1 ở đầu và mọi phần đi theo đầu (từ HEAD trở lên). */
const inHead = () => step(PART.HEAD - 0.5, attribute('part', 'float'));

/**
 * positionNode của mười gà con (InstancedMesh, ma trận instance là đơn vị: vị trí thật chỉ có trong shader, nên frustumCulled = false):
 * đầu (mọi phần từ HEAD trở lên) cúi quanh trục ngang qua CHICK.pivot theo thuộc tính `head`; cả con quay theo hướng rồi dời tới chỗ
 * trong `pose`; rồi Tấm bìa phẳng. normalLocal xoay theo, để nấc sáng đúng với đầu đã cúi.
 * @param {{ pose: any, head: any, view: any, keep: any }} p   pose: vec4 (x, y, z, hướng); head: 0–1; view: hướng nhìn của tranh;
 *   keep: phần bề dày còn lại (Tấm bìa phẳng)
 */
export function chickPosition({ pose, head, view, keep }) {
  return Fn(() => {
    const a = head.mul(CHICK.headDown).mul(inHead());
    const pivot = vec3(0, CHICK.pivot[0], CHICK.pivot[1]);
    const side = vec3(1, 0, 0); // trục ngang của gà con: góc dương đưa mỏ xuống
    const p = rotateAround(rotateAround(positionLocal, pivot, side, a), ZERO, Y, pose.w);
    normalLocal.assign(rotateAround(rotateAround(normalLocal, ZERO, side, a), ZERO, Y, pose.w));
    return flatten(p.add(pose.xyz), pose.xyz.add(vec3(0, CHICK.center, 0)), view, keep);
  })();
}

/**
 * positionNode của mình gà mẹ (tọa độ thế giới): đầu (mọi phần từ HEAD trở lên) gật `nod` quanh trục ngang qua cổ (góc dương cúi xuống),
 * rồi ngoảnh `look` quanh trục đứng qua cổ (góc dương ngoảnh về bên trái mẹ, phía người xem); chân trái (phía người xem) bới `scratch`
 * quanh hông (góc dương đá chân ra sau); rồi Tấm bìa phẳng quanh tâm mẹ. Mọi góc là uniform (radian).
 * @param {{ nod: any, look: any, scratch: any, view: any, keep: any }} p
 */
export function henPosition({ nod, look, scratch, view, keep }) {
  return Fn(() => {
    const J = HEN_JOINTS;
    const neck = vec3(...J.neck);
    const hip = vec3(...J.hip);
    const side = vec3(...J.left);
    const head = inHead();
    const leftLeg = isPart(PART.LEG).mul(step(0, dot(positionLocal.sub(vec3(...J.at)), side)));
    const a = nod.mul(head);
    const b = look.mul(head);
    const k = scratch.mul(leftLeg);
    const p = rotateAround(rotateAround(rotateAround(positionLocal, neck, side, a), neck, Y, b), hip, side, k);
    normalLocal.assign(rotateAround(rotateAround(rotateAround(normalLocal, ZERO, side, a), ZERO, Y, b), ZERO, side, k));
    return flatten(p, vec3(...J.center), view, keep);
  })();
}

/**
 * positionNode của một cánh gà mẹ: xoay `±wing` quanh trục vai (theo hướng phía trước của mẹ), dấu theo bên (`sign` 1: cánh trái, −1: cánh
 * phải), nên góc dương xòe cả hai cánh ra ngoài; rồi Tấm bìa phẳng quanh tâm mẹ.
 * @param {{ sign: 1 | -1, wing: any, view: any, keep: any }} p
 */
export function henWingPosition({ sign, wing, view, keep }) {
  return Fn(() => {
    const J = HEN_JOINTS;
    const forward = vec3(...J.forward);
    const a = wing.mul(sign);
    const p = rotateAround(positionLocal, vec3(...(sign > 0 ? J.shoulderL : J.shoulderR)), forward, a);
    normalLocal.assign(rotateAround(normalLocal, ZERO, forward, a));
    return flatten(p, vec3(...J.center), view, keep);
  })();
}
