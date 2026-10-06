// paintings/dan-ga-me-con/painting.js — phần nặng của Bức 4: setup (đàn gà, cử chỉ), chồng lớp (cùng thứ tự với meta.layers), camera trực giao, bảng chất lượng.
import * as cot from './layers/l1-cot.js';
import * as banMau from './layers/l2-ban-mau.js';
import * as banNet from './layers/l3-ban-net.js';
import * as giayDiep from './layers/l4-giay-diep.js';
import * as danGa from './layers/l5-dan-ga.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';
import { CAMERA } from './parts/cot-bo-cuc.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, banMau, banNet, giayDiep, danGa, phuBong];

/** Đàn gà dạng đóng và hai cử chỉ (chạm rắc thóc, giữ gọi con): chạy TRƯỚC mọi createLayer (spec §20.2, §20.5). */
export { setup } from './shared.js';

/**
 * Góc nhìn của tranh: camera trực giao (CameraSpec.kind 'ortho', spec §20.2). Số nằm ở parts/cot-bo-cuc.js, nơi lớp Cốt cũng đọc.
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = CAMERA;

/** Số theo mức (cao / vừa / thấp) và thứ tự hạ nấc của bộ điều chỉnh (quality.js). */
export { quality } from './quality.js';
