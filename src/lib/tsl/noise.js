// lib/tsl/noise.js — hàm TSL dùng chung cho mọi bức: fbm (cộng nhiều tầng noise) và curl (dòng xoáy không phân kỳ), dựng trên noise của three.
import { Break, Fn, If, Loop, float, max, mx_noise_float, mx_noise_vec3, vec3 } from 'three/tsl';

/** Trần số tầng của fbm, cả khi số tầng là số JS lẫn khi là node. */
export const MAX_OCTAVES = 5;

/**
 * fbm ("fractal Brownian motion"): cộng nhiều tầng noise. Tầng sau có tần số gấp `lacunarity` lần
 * và biên độ nhân `gain`, nên có cả mảng lớn lẫn chi tiết nhỏ (vân đá, sương, mây).
 *
 * `octaves` có hai dạng, dạy hai điều khác nhau:
 * - SỐ JS: vòng lặp chạy lúc DỰNG đồ thị node, shader sinh ra chỉ là một chuỗi phép cộng, không có vòng lặp.
 *   Rẻ nhất, nhưng đổi số tầng là đồ thị khác, tức phải biên dịch lại.
 * - NODE (ví dụ uniform của một núm): shader có vòng lặp THẬT, chạy tối đa MAX_OCTAVES lần và `Break` khi đủ.
 *   Đổi số tầng chỉ đổi giá trị uniform, không biên dịch lại. Lớp nào đặt fbm vào thứ nằm trong cache key
 *   của mọi material (như scene.fogNode) thì nên dùng dạng này.
 *
 * @param {any} p  node vec3 (tọa độ lấy mẫu)
 * @param {{ octaves?: number | any, lacunarity?: number, gain?: number }} [options]
 * @returns {any}  node float, xấp xỉ trong [−1, 1]
 */
export function fbm(p, { octaves = 4, lacunarity = 2, gain = 0.5 } = {}) {
  if (octaves?.isNode) return fbmLoop(p, octaves, lacunarity, gain);
  if (!Number.isInteger(octaves) || octaves < 1 || octaves > MAX_OCTAVES) {
    throw new RangeError(`fbm: octaves phải là số nguyên từ 1 đến ${MAX_OCTAVES}, nhận ${octaves}`);
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

/** fbm với số tầng là node: vòng lặp thật trong shader (xem fbm). */
function fbmLoop(p, octaves, lacunarity, gain) {
  return Fn(() => {
    const q = vec3(p).toVar();
    const sum = float(0).toVar();
    const total = float(0).toVar();
    const amplitude = float(1).toVar();
    Loop(MAX_OCTAVES, ({ i }) => {
      // i là số nguyên của vòng lặp; so với số thực của uniform thì đổi sang float trước.
      If(float(i).greaterThanEqual(octaves), () => {
        Break();
      });
      sum.addAssign(mx_noise_float(q).mul(amplitude));
      total.addAssign(amplitude);
      amplitude.mulAssign(gain);
      q.mulAssign(lacunarity);
    });
    // Ít nhất một tầng thì total ≥ 1; max(…, 1) chỉ để số tầng 0 cho ra 0 thay vì chia cho 0.
    return sum.div(max(total, 1));
  })();
}

/**
 * Curl noise: curl của trường vec3 F = mx_noise_vec3(p), tức v = ∇ × F, tính bằng sai phân trung tâm (6 lần lấy mẫu).
 * Trường nào là curl của một trường khác thì KHÔNG phân kỳ: hạt trôi theo nó thành những dòng xoáy mềm,
 * không dồn về một chỗ và không tản hết ra (như khói, như nước). Độ lớn xấp xỉ vài đơn vị: nhân thêm hệ số tốc độ.
 * @param {any} p  node vec3
 * @param {{ epsilon?: number }} [options]  bước sai phân, theo đơn vị của p
 * @returns {any}  node vec3
 */
export function curl(p, { epsilon = 0.1 } = {}) {
  return Fn(() => {
    const q = vec3(p).toVar();
    const dx = vec3(epsilon, 0, 0);
    const dy = vec3(0, epsilon, 0);
    const dz = vec3(0, 0, epsilon);
    const x0 = mx_noise_vec3(q.sub(dx)).toVar();
    const x1 = mx_noise_vec3(q.add(dx)).toVar();
    const y0 = mx_noise_vec3(q.sub(dy)).toVar();
    const y1 = mx_noise_vec3(q.add(dy)).toVar();
    const z0 = mx_noise_vec3(q.sub(dz)).toVar();
    const z1 = mx_noise_vec3(q.add(dz)).toVar();
    // (∂Fz/∂y − ∂Fy/∂z, ∂Fx/∂z − ∂Fz/∂x, ∂Fy/∂x − ∂Fx/∂y); mọi đạo hàm cùng chia 2·epsilon ở cuối.
    const cx = y1.z.sub(y0.z).sub(z1.y.sub(z0.y));
    const cy = z1.x.sub(z0.x).sub(x1.z.sub(x0.z));
    const cz = x1.y.sub(x0.y).sub(y1.x.sub(y0.x));
    return vec3(cx, cy, cz).div(2 * epsilon);
  })();
}
