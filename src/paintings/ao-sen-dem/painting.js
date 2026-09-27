// paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers) và camera.
import * as cot from './layers/l1-cot.js';
import * as matNuoc from './layers/l4-mat-nuoc.js';
import * as vangLa from './layers/l5-vang-la.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, matNuoc, vangLa, phuBong];

/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng ở z = 30, cao 7, nhìn về tâm ao: l1-cot chừa "lối trăng" hướng về đúng chỗ này.
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 7, 30],
  target: [0, 0, 0],
  fov: 40,
  azimuth: [-0.6, 0.6],
  polar: [1.0, 1.45],
  distance: [18, 45],
};
