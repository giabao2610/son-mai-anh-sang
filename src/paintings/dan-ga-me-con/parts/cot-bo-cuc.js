// paintings/dan-ga-me-con/parts/cot-bo-cuc.js — bố cục của tờ tranh (dữ liệu thuần): tờ giấy cong, gà mẹ, chỗ "nhà" của mười gà con, hướng nắng, góc nhìn của tranh; điểm chạm trên sàn; không import three.

const RAD = Math.PI / 180;
const unit = (v) => v.map((c) => c / Math.hypot(...v));
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Tờ giấy cong như phông chụp ảnh (spec §20.1), đơn vị cảnh 10 cm: sàn phẳng rộng 14 từ mép trước z = 5 tới z = −3; chỗ uốn là cung tròn
 * bán kính 2; vách đứng ở z = −5, mép trên ở y = 6. Sàn sâu 8 + chỗ uốn 2 = 10.
 */
export const PAPER = Object.freeze({ width: 14, front: 5, back: -3, bend: 2, top: 6 });
/** Phần sàn phẳng mà gà đứng và thóc nằm được, chừa mép 0,3. */
export const FLOOR = Object.freeze({ x: Object.freeze([-6.7, 6.7]), z: Object.freeze([-2.7, 4.7]) });
/** Hướng nắng (đơn vị, chỉ VỀ phía nắng): từ trên, bên trái, phía trước (§20.1). */
export const SUN = Object.freeze(unit([-0.45, 0.75, 0.5]));
/** Gà mẹ đứng giữa sàn, quay sang trái (−x): hướng h nghĩa là phía trước là (sin h, 0, cos h), như rotation.y của three. */
export const HEN = Object.freeze({ at: Object.freeze([0, 0]), heading: -Math.PI / 2, length: 4, height: 3.2, back: 2.3 });

/**
 * Chỗ "nhà" của mười gà con (x, z), hướng lúc nghỉ, và màu (chỉ số trong bảng màu của Bản màu, Task 4), theo tinh thần tranh gốc (§20.1).
 * kind 'free': đi lại được. 'back': trèo trên lưng mẹ (y = HEN.back). 'belly': nấp dưới bụng mẹ. Hai con sau luôn ở yên.
 */
export const HOMES = Object.freeze([
  { at: [-3.2, 0.9], heading: 1.9, pigment: 0, kind: 'free' }, // trước mặt mẹ, ngước nhìn mồi
  { at: [-3.0, -0.6], heading: 1.2, pigment: 1, kind: 'free' },
  { at: [3.0, 1.2], heading: -1.4, pigment: 2, kind: 'free' }, // sau lưng mẹ, rỉa lông
  { at: [3.3, -0.4], heading: -2.2, pigment: 3, kind: 'free' },
  { at: [-1.0, -2.4], heading: 0.4, pigment: 4, kind: 'free' }, // ở xa: nằm cao hơn trong khung
  { at: [1.6, -2.5], heading: -0.5, pigment: 0, kind: 'free' },
  { at: [-1.4, 3.0], heading: 2.8, pigment: 2, kind: 'free' }, // ở gần: nằm thấp hơn
  { at: [1.8, 3.4], heading: -2.7, pigment: 1, kind: 'free' },
  { at: [0.3, 0.0], heading: -Math.PI / 2, pigment: 4, kind: 'belly' },
  { at: [0.6, 0.0], heading: -Math.PI / 2, pigment: 3, kind: 'back' },
].map((h) => Object.freeze({ ...h, at: Object.freeze(h.at) })));

/**
 * Góc nhìn của tranh (CameraSpec, §20.2). Nhìn chếch xuống 20°; điểm nhìn đặt sao cho tờ giấy nằm giữa khung theo chiều dọc: mép trước
 * và mép trên của giấy cách tâm khung chừng 4,5 đơn vị, trong khung cao 12, nên giấy chiếm chừng 75% bề cao và chữ nằm trên ván tối.
 * (Số §20.2 cũ, target [0; 1,6; 0], để giấy lệch hẳn lên trên: mép trên chỉ cách mép khung 0,15. Đã sửa §20.2 cùng task.)
 * polar đo từ trục y: xoay dọc 10°–70° trên mặt sàn là polar 80°–20°.
 * @type {import('../../../engine/contracts/runtime.js').CameraSpec}
 */
export const CAMERA = Object.freeze({
  kind: 'ortho',
  position: [0, 7.2, 11.55],
  target: [0, 2.8, -0.45],
  height: 12,
  minWidth: 15.5,
  zoom: [1, 2.5],
  azimuth: [-75 * RAD, 75 * RAD],
  polar: [20 * RAD, 80 * RAD],
  breathe: 0,
});

/**
 * Điểm trên sàn cho một cú chạm (§20.2): tia cắt mặt y = 0; tia không đi xuống (song song, hướng lên, gốc dưới sàn) thì lấy chân của gốc
 * tia. Rồi kẹp vào FLOOR, nên chạm lên vách hay ra ván vẫn có điểm gần nhất trên sàn.
 * @param {{ origin: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number } }} ray
 * @returns {[number, number]} x, z
 */
export function floorPoint({ origin: o, direction: d }) {
  const s = d.y < -1e-6 && o.y > 0 ? -o.y / d.y : 0;
  return [clamp(o.x + d.x * s, ...FLOOR.x), clamp(o.z + d.z * s, ...FLOOR.z)];
}
