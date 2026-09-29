// lib/tsl/noise.js — hàm TSL dùng chung cho mọi bức: fbm (cộng nhiều tầng noise) dựng trên mx_noise_float của three.
import { float, mx_noise_float } from 'three/tsl';

/**
 * fbm ("fractal Brownian motion"): cộng nhiều tầng noise. Tầng sau có tần số gấp `lacunarity` lần
 * và biên độ nhân `gain`, nên có cả mảng lớn lẫn chi tiết nhỏ (vân đá, sương, mây).
 *
 * `octaves` là số JS, không phải uniform: vòng lặp chạy lúc DỰNG đồ thị node, nên shader sinh ra
 * chỉ là một chuỗi phép cộng, không có vòng lặp. Đổi số tầng = dựng lại đồ thị (núm 'rebuild').
 *
 * @param {any} p  node vec3 (tọa độ lấy mẫu)
 * @param {{ octaves?: number, lacunarity?: number, gain?: number }} [options]
 * @returns {any}  node float, xấp xỉ trong [−1, 1]
 */
export function fbm(p, { octaves = 4, lacunarity = 2, gain = 0.5 } = {}) {
  if (!Number.isInteger(octaves) || octaves < 1 || octaves > 5) {
    throw new RangeError(`fbm: octaves phải là số nguyên từ 1 đến 5, nhận ${octaves}`);
  }
  let sum = float(0);
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    sum = sum.add(mx_noise_float(p.mul(frequency)).mul(amplitude));
    total += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum.div(total); // chia tổng biên độ: nhiều tầng hay ít tầng vẫn cùng khoảng giá trị
}
