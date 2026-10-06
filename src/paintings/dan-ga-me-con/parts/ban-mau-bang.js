// paintings/dan-ga-me-con/parts/ban-mau-bang.js — của lớp Bản màu: bảng màu in theo phần của hình gà (năm màu tự nhiên của Đông Hồ), và ánh sáng chia nấc mềm mép.
import { float, floor, fract, fwidth, max, min, mix, smoothstep, step } from 'three/tsl';

/** Gà mẹ (spec §20.3): mình vàng hòe; cánh đỏ son; đuôi xanh; mào đỏ son; mỏ, chân vàng hòe; mắt mực; con ong vàng hòe (vằn mực ở nét trong). */
export const HEN_TOKENS = Object.freeze({
  BODY: 'hoe', TAIL: 'xanhDong', LEG: 'hoe', WING: 'sonSoi', HEAD: 'hoe', BEAK: 'hoe', COMB: 'sonSoi', EYE: 'muc', BEE: 'hoe',
});
/** Gà con: mỗi con một màu theo chỉ số trong HOMES; 'diep' là gà "trắng": để màu giấy, chỉ có nét. */
export const CHICK_TOKENS = Object.freeze(['hoe', 'sonSoi', 'xanhDong', 'muc', 'diep']);
/** Phần mang màu lông (theo màu riêng của gà con); phần khác (chân, mỏ, mắt) theo bảng của gà mẹ. */
export const PLUMAGE = Object.freeze(['BODY', 'TAIL', 'WING', 'HEAD']);

/**
 * Nấc sáng: l (0–1) chia `bands` nấc; mép nấc mềm trong fwidth(l·bands) + edge (chống răng cưa, rồi mềm thêm theo núm). Trả 0 (nấc tối)
 * … 1 (nấc sáng): nấc sáng nhất là đúng màu in. bands = 1: phẳng hẳn (luôn 1). smoothstep(1 − soft, 1, …) có 1 − soft < 1 vì soft ≥ 1e-3.
 * @param {any} l      độ sáng Lambert, 0–1
 * @param {any} bands  số nấc (núm, số nguyên 1–4)
 * @param {any} edge   độ mềm thêm của mép nấc (núm, ≥ 0)
 */
export function bandOf(l, bands, edge) {
  const x = l.mul(bands);
  const soft = max(fwidth(x).add(edge), 1e-3);
  const k = floor(x).add(smoothstep(float(1).sub(soft), float(1), fract(x)));
  const stair = min(k, bands.sub(1)).div(max(bands.sub(1), 1));
  return mix(float(1), stair, step(1.5, bands));
}
