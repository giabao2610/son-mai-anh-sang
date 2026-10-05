// paintings/cung-que/painting.js — phần nặng của Bức 3: chồng lớp (cùng thứ tự với meta.layers), camera, bảng chất lượng.
import * as cot from './layers/l1-cot.js';
import * as matTroi from './layers/l2-mat-troi.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, matTroi, phuBong];

/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng ngang hành tinh, nhìn hơi ngước lên: hành tinh ở dưới, cây ở giữa, Trái Đất ở trên (spec §19.2).
 * Xoay ngang trọn vòng: OrbitControls coi ±Infinity là không giới hạn (Phụ lục A.86). Tiểu hành tinh thì phải đi vòng quanh được.
 * Góc ngang tối thiểu 30°: ở điện thoại dọc (390×844), fov dọc nới từ 48° lên chừng 60° và hành tinh chiếm chừng 84% bề ngang, không
 * bị cắt hai bên; khung máy tính (16:10, góc ngang chừng 71°) không đổi gì.
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 0.95, 4.6],
  target: [0, 1.2, 0],
  fov: 48,
  minHorizontalFov: 30,
  azimuth: [-Infinity, Infinity],
  polar: [1.2, 1.95],
  distance: [3.6, 6.5],
  breathe: 0.05,
};

/** setup() chạy TRƯỚC mọi createLayer: cây bay, Dial Ngày âm lịch (shared.js). */
export { setup } from './shared.js';

/** Số theo mức (cao / vừa / thấp) và thứ tự hạ nấc của bộ điều chỉnh (quality.js). */
export { quality } from './quality.js';
