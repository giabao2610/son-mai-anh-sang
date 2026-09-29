// paintings/_mau/painting.js — phần nặng của tranh mẫu: chồng lớp (cùng thứ tự với meta.layers) và camera. Không có setup.
import * as cot from './layers/l1-cot.js';
import * as toMau from './layers/l2-to-mau.js';

/** @type {import('../../engine/contracts/runtime.js').LayerModule[]} */
export const layers = [cot, toMau];

/**
 * Không có setup(): xưởng đưa cho mọi lớp cùng một object shared = {}. Cốt ghi shared.cot, Tô màu đọc.
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 2.2, 6],
  target: [0, 1, 0],
  fov: 40,
  azimuth: [-1.2, 1.2],
  polar: [0.6, 1.5],
  distance: [4, 10],
  breathe: 0.1,
};
