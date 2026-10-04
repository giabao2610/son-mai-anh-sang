// paintings/den-keo-quan/painting.js — phần nặng của Bức 2: chồng lớp (cùng thứ tự với meta.layers), camera, bảng chất lượng.
import * as cot from './layers/l1-cot.js';
import * as ngonNen from './layers/l2-ngon-nen.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, ngonNen, phuBong];

/** setup() chạy TRƯỚC mọi createLayer: góc trống, ngọn lửa (shared.js). */
export { setup } from './shared.js';

/** Số theo mức (cao / vừa / thấp) và thứ tự hạ nấc của bộ điều chỉnh (quality.js). */
export { quality } from './quality.js';

/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng phía trước gian (phía không có vách), cao ngang đèn, nhìn hơi ngước về đèn và vách sau. Ở khoảng cách lớn nhất
 * 2,75 và góc ngang ±0,6, camera vẫn ở trong gian: |x| ≤ 2,75 × sin 0,6 ≈ 1,55 < 2,5; z ≤ −0,6 + 2,75 = 2,15 < 2,5.
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 1.45, 2.1],
  target: [0, 1.55, -0.6],
  fov: 50,
  azimuth: [-0.6, 0.6],
  polar: [1.3, 1.75],
  distance: [1.8, 2.75],
  breathe: 0.03,
};
