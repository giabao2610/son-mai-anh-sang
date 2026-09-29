// paintings/ao-sen-dem/parts/mat-nuoc-gia.js — của lớp Mặt nước: phản chiếu GIẢ ở mức thấp (màu trời theo hướng phản xạ + đĩa trăng), không vẽ cảnh lần hai.
import { cameraPosition, color, dot, mix, normalize, positionWorld, pow, reflect, saturate } from 'three/tsl';

const SHARPNESS = 900; // đĩa trăng phản xạ: số mũ càng lớn đĩa càng nhỏ (trăng rộng chừng 2°)
const MOON_GLOW = 2.5; // sáng quá 1 để bóng trăng trên nước còn bloom

/**
 * Máy yếu không đủ sức vẽ cả cảnh thêm một lần cho reflector. Thay vào đó, mỗi điểm trên mặt nước tự tính tia phản xạ
 * (reflect: tia từ mắt bật lên khỏi mặt nước theo pháp tuyến gợn), rồi hỏi "trời theo hướng này màu gì" bằng đúng hàm màu
 * trời của lớp Sương, cộng đĩa trăng nếu tia gần hướng trăng. Pháp tuyến gợn và noise làm tia lệch từng chút: đĩa trăng
 * vỡ thành lối trăng lấp lánh, đúng cách lối trăng thật hình thành. Cái giá: trong nước không có sen, lá hay đom đóm.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ suong: { sky: (dir: any) => any }, moon: { dir: any }, anhTrang: { glow: any } }} shared
 * @param {any} normal  pháp tuyến (thế giới) của mặt nước tại điểm đang vẽ
 */
export function fakeReflection(ctx, shared, normal) {
  const hex = ctx.palette.hex;
  const view = normalize(cameraPosition.sub(positionWorld)); // từ mặt nước tới mắt
  const ray = reflect(view.negate(), normal); // tia từ mắt, bật lên khỏi mặt nước
  const disc = pow(saturate(dot(ray, shared.moon.dir)), SHARPNESS); // saturate: cơ số không âm trước pow
  const tint = mix(color(hex.nga), color(hex.vangLaSang), 0.6); // cùng màu với trăng của lớp Ánh trăng
  return shared.suong.sky(ray).add(tint.mul(disc.mul(MOON_GLOW)).mul(shared.anhTrang.glow));
}
