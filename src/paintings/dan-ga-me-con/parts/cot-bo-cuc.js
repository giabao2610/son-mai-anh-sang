// paintings/dan-ga-me-con/parts/cot-bo-cuc.js — bố cục của tờ tranh (dữ liệu thuần): tờ giấy cong, gà mẹ, chỗ "nhà" và tám chỗ núp của gà con, thân mẹ trên sàn (cho gà con tránh), nhúm thóc lúc mở trang, khung và đầu mỏ của gà con khi cúi, hướng nắng, góc nhìn của tranh; điểm chạm trên sàn; góc lệch của camera khỏi góc của tranh; không import three.

const RAD = Math.PI / 180;
const unit = (v) => v.map((c) => c / Math.hypot(...v));
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Tờ giấy cong như phông chụp ảnh (spec §20.1), đơn vị cảnh 10 cm: sàn phẳng rộng 14 từ mép trước z = 5 tới z = −3; chỗ uốn là cung tròn
 * bán kính 2; vách đứng ở z = −5, mép trên ở y = 4,5 (điểm duyệt ảnh GĐ 8 Task 4: vách cao 6 để trống gần nửa tờ giấy phía trên đàn gà).
 * Sàn sâu 8 + chỗ uốn 2 = 10.
 */
export const PAPER = Object.freeze({ width: 14, front: 5, back: -3, bend: 2, top: 4.5 });
/** Phần sàn phẳng mà gà đứng và thóc nằm được, chừa mép 0,3. */
export const FLOOR = Object.freeze({ x: Object.freeze([-6.7, 6.7]), z: Object.freeze([-2.7, 4.7]) });
/** Hướng nắng (đơn vị, chỉ VỀ phía nắng): từ trên, bên trái, phía trước (§20.1). */
export const SUN = Object.freeze(unit([-0.45, 0.75, 0.5]));
/** Gà mẹ đứng giữa sàn, quay sang trái (−x): hướng h nghĩa là phía trước là (sin h, 0, cos h), như rotation.y của three. */
export const HEN = Object.freeze({ at: Object.freeze([0, 0]), heading: -Math.PI / 2, length: 4, height: 3.2, back: 2.6, width: 2.4 });
/**
 * Thân gà mẹ trên sàn, cho đàn gà dạng đóng tránh (parts/dan-ga-duong.js): hình viên thuốc, là mọi điểm cách đoạn xương sống a–b không quá
 * r. Bầu dục của mình mẹ (nửa trục 2 × 1,2) nằm trọn trong nó; xương sống chạy dọc mẹ (trục x), dài length − width = 1,6.
 */
export const HEN_BODY = Object.freeze({ a: Object.freeze([-0.8, 0]), b: Object.freeze([0.8, 0]), r: HEN.width / 2 });

/**
 * Gà con trong khung của nó (chân ở gốc, trước +z, lên +y; hình ở parts/cot-hinh-ga.js):
 * - `pivot` [y, z]: đầu (mọi phần từ HEAD trở lên) cúi quanh trục ngang (x) qua TÂM MÌNH, không qua cổ: quanh cổ thì mỏ không với tới sàn;
 * - `headDown`: góc cúi tối đa (rad), lúc thuộc tính `head` bằng 1;
 * - `beak` [y, z]: đầu mỏ lúc ngẩng;
 * - `center`: độ cao tâm con gà, nơi Tấm bìa phẳng dẹt quanh.
 */
export const CHICK = Object.freeze({ pivot: Object.freeze([0.48, 0]), headDown: Math.PI / 3, beak: Object.freeze([0.86, 0.8]), center: 0.45 });

/**
 * Đầu mỏ của gà con khi cúi phần k (0 ngẩng … 1 cúi hẳn), trong khung của nó: [ra trước, lên trên]. Cùng phép xoay với positionNode
 * (cot-hinh-ga.js#chickPosition): quanh trục +x qua CHICK.pivot, góc k · headDown; góc dương đưa mỏ xuống.
 * @param {number} k
 * @returns {[number, number]}
 */
export function beakTip(k) {
  const a = k * CHICK.headDown;
  const [py, pz] = CHICK.pivot;
  const dy = CHICK.beak[0] - py;
  const dz = CHICK.beak[1] - pz;
  return [pz + dz * Math.cos(a) + dy * Math.sin(a), py + dy * Math.cos(a) - dz * Math.sin(a)];
}

/**
 * Chỗ "nhà" của mười gà con (x, z), hướng lúc nghỉ, và màu (chỉ số trong bảng màu của Bản màu, Task 4), theo tinh thần tranh gốc (§20.1).
 * kind 'free': đi lại được. 'back': trèo trên lưng mẹ (y = HEN.back). 'belly': nấp dưới bụng mẹ. Hai con sau luôn ở yên.
 */
export const HOMES = Object.freeze([
  { at: [-3.4, 1.3], heading: 1.75, pigment: 0, kind: 'free' }, // trước mặt mẹ, ngước nhìn mồi
  { at: [-5.2, -0.3], heading: 0.9, pigment: 1, kind: 'free' },
  { at: [3.4, 1.3], heading: -1.9, pigment: 2, kind: 'free' }, // sau lưng mẹ, rỉa lông
  { at: [5.3, -0.6], heading: -2.3, pigment: 3, kind: 'free' },
  { at: [-3.4, -2.3], heading: 0.6, pigment: 4, kind: 'free' }, // ở xa: nằm cao hơn trong khung, ra ngoài đầu mẹ để không bị che
  { at: [3.3, -2.4], heading: -0.7, pigment: 0, kind: 'free' }, // ở xa, ra ngoài đuôi mẹ
  { at: [-1.4, 3.3], heading: 2.6, pigment: 2, kind: 'free' }, // ở gần: nằm thấp hơn
  { at: [1.9, 3.6], heading: -2.6, pigment: 1, kind: 'free' },
  { at: [0.2, 1.75], heading: -Math.PI / 2, pigment: 4, kind: 'belly' }, // sát bụng mẹ, phía người xem, dưới cánh trái
  { at: [0.75, 0.0], heading: -Math.PI / 2, pigment: 3, kind: 'back' }, // đứng trên lưng mẹ, chân chạm lưng
].map((h) => Object.freeze({ ...h, at: Object.freeze(h.at) })));

/**
 * Tám chỗ núp quanh gà mẹ khi mẹ gọi con (§20.2, §20.5). Nằm trên vòng bán kính 2,1 quanh tâm mẹ: dưới 2,2 để số đo `quanhMe` đếm đủ
 * mười, và đủ xa thân mẹ cho gà con quay ra ngoài (ló đầu, lưng về phía mẹ) không lún vào thân, đuôi hay cánh mẹ, cả khi cánh mở 60°.
 * Con nấp bụng đứng ở góc 83° (cách tâm 1,76) chiếm một chỗ của vòng, nên hai chỗ kề nó cách 45°, sáu chỗ còn lại cách đều chừng 38°:
 * đôi một cách nhau ≥ 1,35, cách con nấp bụng ≥ 1,5, nên các gà con núp không chồng lên nhau (test đọc chỗ thật của khối, kể cả lúc ngó
 * nghiêng). Xếp theo góc, từ đầu đuôi vòng về phía người xem rồi ra sau lưng mẹ: hai chỗ giữa lưng ([−0,9; −1,9] và [0,45; −2,05])
 * từ camera của tranh bị mẹ che hẳn, kéo xoay mới thấy; sáu chỗ còn lại thấy được (hai chỗ ở góc sau thấy một phần).
 */
export const SLOTS = Object.freeze([[2.1, 0], [1.65, 1.3], [-1.3, 1.65], [-2.05, 0.45], [-1.9, -0.9], [-0.9, -1.9], [0.45, -2.05], [1.65, -1.3]]
  .map((s) => Object.freeze(s)));
/**
 * Nhúm thóc nằm sẵn lúc mở trang, và chỗ gà mẹ bới: trước mặt mẹ (mẹ quay sang −x), cách đầu mỏ chừng 1,35 (mỏ ở x = −2,6, con ong ở −3).
 * Đúng chỗ gà con xúm quanh được: các con đứng trên vòng bán kính 1 quanh nắm và nhảy tối đa 0,25, nên tâm nắm cách đầu xương sống
 * (−0,8; 0) từ 3,1 (parts/dan-ga-cho.js#createPlacer dời mọi điểm rắc gần hơn ra tới đó: đặt gần hơn thì nhúm bị dời).
 */
export const PILE = Object.freeze([-3.95, 0.4]);
export const HEN_FRONT = Object.freeze([-3.95, 0]);
/** Bố cục mà đàn gà dạng đóng cần (shared.js truyền vào dan-ga-song.js, vì lớp Đàn gà không import part của Cốt). */
export const LAYOUT = Object.freeze({
  homes: HOMES, hen: HEN.at, slots: SLOTS, pile: PILE, henFront: HEN_FRONT, beakTip, back: HEN.back, floor: FLOOR, body: HEN_BODY,
});

/**
 * Góc nhìn của tranh (CameraSpec, §20.2). Nhìn chếch xuống 20° (position − target = [0; 4,4; 12]). Khung cao 13,2 và tờ giấy cao 7,67 trên
 * màn, nên giấy chiếm chừng 58% bề cao khung, nằm cao hơn tâm khung 0,33 đơn vị: ở máy tính 16 : 10 tới 16 : 9 (800–1080 điểm ảnh CSS bề
 * cao), tên tranh, dải link ở trên và gợi ý, thơ ở dưới đều nằm trên ván tối, không đè lên giấy (điểm duyệt ảnh GĐ 8 Task 4; khung cao 12
 * cũ để giấy chiếm 75% bề cao, chữ đè lên giấy). Điểm nhìn gần tâm gà mẹ, nên kéo xoay thì đàn gà quay quanh chính nó.
 * polar đo từ trục y: xoay dọc 10°–70° trên mặt sàn là polar 80°–20°.
 * `shortFrame`: canvas thấp hơn 800 điểm ảnh CSS (laptop 1366 × 768, trang còn chừng 650) thì khung nhìn cao thêm 800 / bề cao, tới 1,3
 * lần: dải ván trên và dưới còn chừng số điểm ảnh của chúng ở 1280 × 800, đủ chỗ cho chữ (vòng sau điểm duyệt ảnh, spec §20.2). Trần 1,3
 * đủ cho bề cao 615 trở lên; điện thoại xoay ngang (cao 390) giữ tờ giấy chừng 45% bề cao, gợi ý còn đè một phần như ba bức đầu.
 * `home`: buông tay 3 giây thì camera êm êm về góc này trong 1,2 giây (spec §20.2, CameraSpec.home, engine/gpu/home.js).
 * @type {import('../../../engine/contracts/runtime.js').CameraSpec}
 */
export const CAMERA = Object.freeze({
  kind: 'ortho',
  position: [0, 6.26, 11.9],
  target: [0, 1.86, -0.1],
  height: 13.2,
  minWidth: 15.5,
  shortFrame: { below: 800, maxGrow: 1.3 },
  zoom: [1, 2.5],
  azimuth: [-75 * RAD, 75 * RAD],
  polar: [20 * RAD, 80 * RAD],
  breathe: 0,
  home: { after: 3, duration: 1.2 },
});

/** Kẹp vào [lo, hi]; NaN (tia hỏng) thì về giữa khoảng. ±Infinity kẹp về mép như số thường. */
const clampTo = (v, [lo, hi]) => (Number.isNaN(v) ? (lo + hi) / 2 : clamp(v, lo, hi));

/**
 * Điểm trên sàn cho một cú chạm (§20.2): tia cắt mặt y = 0; tia không đi xuống (song song, hướng lên, gốc dưới sàn) thì lấy chân của gốc
 * tia. Rồi kẹp vào FLOOR, nên chạm lên vách hay ra ván vẫn có điểm gần nhất trên sàn. Hàm toàn phần: tia hỏng (thiếu, có NaN như khi khung
 * vẽ cỡ 0, vô cực) vẫn ra một điểm hữu hạn trong sàn, vì đàn gà ném lỗi với điểm không hữu hạn.
 * @param {{ origin: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number } } | undefined} ray
 * @returns {[number, number]} x, z
 */
export function floorPoint(ray) {
  const o = ray?.origin ?? { x: NaN, y: NaN, z: NaN };
  const d = ray?.direction ?? { x: NaN, y: NaN, z: NaN };
  const s = d.y < -1e-6 && o.y > 0 ? -o.y / d.y : 0;
  return [clampTo(o.x + d.x * s, FLOOR.x), clampTo(o.z + d.z * s, FLOOR.z)];
}

/**
 * Góc lệch (độ) của camera ở `position` khỏi góc nhìn của tranh, quanh điểm nhìn của tranh (số đo `goc` của Cốt). Là góc 3D giữa hai
 * hướng nhìn (từ điểm nhìn tới camera), nên xoay ngang 30° khi camera nhìn chếch xuống 20° chỉ lệch chừng 28°: camera đi trên một vòng
 * nhỏ hơn vòng lớn của hình cầu quanh điểm nhìn.
 * @param {[number, number, number]} position
 */
export function viewAngle(position) {
  const a = position.map((v, i) => v - CAMERA.target[i]);
  const b = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
  const cos = a.reduce((s, v, i) => s + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}
