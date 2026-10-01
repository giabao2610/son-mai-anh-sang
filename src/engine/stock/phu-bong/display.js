// engine/stock/phu-bong/display.js — chặng display của Phủ bóng (màu hiển thị vào → ra): LUT sơn mài, grain, vignette, FXAA; trộn theo trọng số.
import { convertToTexture, floor, length, mix, mx_cell_noise_float, oneMinus, screenCoordinate, screenSize, screenUV, smoothstep, texture3D, vec2, vec3, vec4 } from 'three/tsl';
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { LUT_SIZE } from './lut.js';

/**
 * Bốn bước, trên MÀU HIỂN THỊ (sRGB, sau renderOutput): LUT và FXAA cần đúng không gian này (Phụ lục A.41, A.6).
 * 1. LUT "sơn mài" (lut3D): tra màu trong khối 32³ sinh từ bảng màu (lut.js).
 * 2. Grain: nhiễu (hash của điểm ảnh và số khung) trừ 0,5, nên trung bình bằng 0: ảnh không sáng hay tối đi. Số khung tính
 *    từ ctx.u.time, nên ?freeze cho ra đúng cùng một lớp hạt. Không dùng film() của three: nó không có trung bình 0.
 * 3. Vignette: tối dần theo khoảng cách tới tâm khung, đo theo tỉ lệ khung nên góc khung dẹt cũng tối như góc khung vuông.
 * 4. FXAA đứng cuối: chuỗi phía trước được vẽ ra một ảnh riêng (RTT, +1 lượt vẽ mỗi khung), rồi FXAA đọc các điểm quanh
 *    từng điểm ảnh để làm mềm mép răng cưa (Phụ lục A.42).
 * Mọi bước trộn theo trọng số `weight` của lớp: 0 là ảnh chưa phủ bóng (không LUT, không hạt, không tối góc, không FXAA).
 * @param {{ color: any, weight: any, time: any, lut: any, lutIntensity: any, grain: any, vignette: any, fxaaOff: any }} p
 *   lut: Data3DTexture (lutTexture); fxaaOff: uniform 0/1 của thí nghiệm "Tắt FXAA"; còn lại là uniform của núm
 */
export function displayStage({ color, weight, time, lut, lutIntensity, grain, vignette, fxaaOff }) {
  const graded = lut3D(color, texture3D(lut), LUT_SIZE, lutIntensity.mul(weight));
  const frame = floor(time.mul(60));
  const noise = mx_cell_noise_float(vec3(floor(screenCoordinate.xy), frame)); // [0, 1), đổi theo điểm ảnh và theo khung
  const grained = graded.rgb.add(noise.sub(0.5).mul(grain).mul(weight));
  const aspect = screenSize.x.div(screenSize.y);
  const corner = length(vec2(aspect, 1).mul(0.5)); // khoảng cách từ tâm tới góc, để góc khung luôn là 1
  const edge = length(screenUV.sub(0.5).mul(vec2(aspect, 1))).div(corner);
  const shaded = grained.mul(oneMinus(smoothstep(0.45, 1.1, edge).mul(vignette).mul(weight)));
  const flat = convertToTexture(vec4(shaded, 1)); // chuỗi phía trước → một RTT; FXAA và phép trộn đều đọc ảnh này
  return mix(flat, fxaa(flat), weight.mul(oneMinus(fxaaOff)));
}
