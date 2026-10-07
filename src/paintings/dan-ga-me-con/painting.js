// paintings/dan-ga-me-con/painting.js — phần nặng của Bức 4: setup (đàn gà, cử chỉ), chồng lớp (cùng thứ tự với meta.layers), camera trực giao, bảng chất lượng.
import * as cot from './layers/l1-cot.js';
import * as banMau from './layers/l2-ban-mau.js';
import * as banNet from './layers/l3-ban-net.js';
import * as giayDiep from './layers/l4-giay-diep.js';
import * as danGa from './layers/l5-dan-ga.js';
import * as phuBongStock from '../../engine/stock/phu-bong/layer.js';
import { CAMERA } from './parts/cot-bo-cuc.js';

/**
 * Phủ bóng của Bức 4: tranh in trên giấy sáng, nên tone và lộ sáng khác mặc định của lớp dùng chung (lượt màu GĐ 8 Task 11, spec §20.3,
 * §20.4 lớp 6; cách ghi đè ở §15 a: chỉ đổi `value`). AgX nén vùng sáng và nhạt màu: giấy ngà hiện ra xám be (196, 187, 168), năm màu in
 * nhạt đi. ACES giữ màu đậm; lộ sáng 1,2 cho giấy ngà sáng (229, 219, 198) mà chưa cháy trắng. Bloom 0,5: hạt điệp lóe nhẹ, quầng nhỏ.
 */
const PHU_BONG = { toneMapping: 'aces', exposure: 1.2, bloomStrength: 0.5 };
const phuBong = { ...phuBongStock, knobs: phuBongStock.knobs.map((k) => (k.id in PHU_BONG ? { ...k, value: PHU_BONG[k.id] } : k)) };

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó. Phủ bóng là bản sao của module dùng
 * chung, chỉ khác mặc định của ba núm (PHU_BONG).
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
