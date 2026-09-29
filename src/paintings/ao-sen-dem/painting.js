// paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers), camera, bảng chất lượng.
import * as cot from './layers/l1-cot.js';
import * as anhTrang from './layers/l2-anh-trang.js';
import * as suong from './layers/l3-suong.js';
import * as matNuoc from './layers/l4-mat-nuoc.js';
import * as vangLa from './layers/l5-vang-la.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, anhTrang, suong, matNuoc, vangLa, phuBong];

/** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, xoáy sương, cử chỉ (shared.js). */
export { setup } from './shared.js';

/** Số theo mức (cao / vừa / thấp) và thứ tự hạ nấc của bộ điều chỉnh (quality.js). */
export { quality } from './quality.js';

/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng ở z = 32, cao 6, nhìn gần ngang về phía xa (−z): trăng thấp (4°–13°) nằm ở phần ba trên
 * của khung, lối trăng chạy từ chân trời về tiền cảnh. l1-cot chừa "lối trăng" hướng về đúng chỗ này.
 * breathe: camera "thở" nhẹ quanh điểm nhìn (xưởng tắt khi người xem xin giảm chuyển động).
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 6, 32],
  target: [0, 2.2, -14],
  fov: 42,
  azimuth: [-0.6, 0.6],
  polar: [1.1, 1.52],
  distance: [24, 60],
  breathe: 0.4,
};
