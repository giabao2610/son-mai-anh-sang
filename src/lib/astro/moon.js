// lib/astro/moon.js — Pha trăng, hướng Mặt Trời giả và "đêm nay" của một thời điểm; chỉ trả về số và Date.
// Hàm thuần: nhận một thời điểm tuyệt đối (JS Date), không đọc đồng hồ máy.
// Dựa trên thời điểm trăng mới CHÍNH XÁC của lunar.js, không chỉ dùng hằng số 29,53.

import { TZ_VN, SYNODIC_MONTH, jdFromInstant, jdNewMoon } from './lunar.js';

const PI = Math.PI;
const TAU = 2 * PI;
const HOUR = 3600000;

/**
 * Tìm lần trăng mới gần nhất ĐÃ XẢY RA: k sao cho jdNewMoon(k) <= jd < jdNewMoon(k + 1).
 * Đoán k bằng tháng trung bình, rồi sửa bằng thời điểm thật (lệch tối đa ±14 giờ).
 */
export function lunationIndex(jd) {
  let k = Math.floor((jd - jdNewMoon(0)) / SYNODIC_MONTH);
  while (jdNewMoon(k + 1) <= jd) k++;
  while (jdNewMoon(k) > jd) k--;
  return k;
}

/**
 * Trạng thái trăng tại thời điểm `date`.
 *
 * Quy ước góc pha `phase` (radian, trong [0, 2π)):
 *   0 = trăng mới · π/2 = thượng huyền · π = trăng tròn · 3π/2 = hạ huyền.
 * Đây là "góc tuổi trăng" (gần bằng góc lệch Mặt Trời–Trái Đất–Mặt Trăng),
 * KHÔNG phải "phase angle" i của sách thiên văn (i = π − phase).
 *
 * Điểm học: độ sáng = (1 − cos(phase)) / 2 — phần đĩa trăng được chiếu sáng
 * khi nhìn từ Trái Đất. phase = π thì cos = −1, độ sáng = 1 (trăng tròn).
 *
 * Cách tính phase: nội suy tuyến tính TỪNG NỬA tháng giữa ba mốc chính xác
 * trăng mới k → trăng tròn (k + 0,5) → trăng mới k + 1. Công thức Meeus mà
 * lunar.js dùng cho k nguyên (trăng mới) cũng đúng cho k + 0,5 (trăng tròn).
 * Nhờ vậy đêm rằm cho độ sáng đúng 1 dù nửa tháng đầu dài 13,9 hay 15,6 ngày.
 */
export function moonPhase(date) {
  const jd = jdFromInstant(date);
  const k = lunationIndex(jd);
  const jdNew = jdNewMoon(k);
  const jdFull = jdNewMoon(k + 0.5);
  const jdNext = jdNewMoon(k + 1);
  const phase = jd < jdFull
    ? (PI * (jd - jdNew)) / (jdFull - jdNew)
    : PI + (PI * (jd - jdFull)) / (jdNext - jdFull);
  return {
    jd,
    k,
    jdNewMoon: jdNew, // thời điểm trăng mới vừa qua (UT)
    jdFullMoon: jdFull, // thời điểm trăng tròn của tháng này (có thể còn ở phía trước)
    jdNextNewMoon: jdNext,
    age: jd - jdNew, // tuổi trăng, tính bằng ngày
    lunation: jdNext - jdNew, // độ dài tháng âm hiện tại (29,27 → 29,83 ngày)
    phase,
    fraction: phase / TAU, // 0 → 1 trong một tháng âm
    illumination: (1 - Math.cos(phase)) / 2,
    waxing: phase < PI, // true: trăng đang tròn dần (thượng tuần)
  };
}

/**
 * Hướng "Mặt Trời giả" để shader vẽ đường ranh sáng–tối (terminator) trên quả cầu trăng.
 *
 * Hệ trục: hệ QUAN SÁT của camera (trùng view space của three.js):
 *   +x sang phải màn hình · +y lên trên · +z hướng từ trăng VỀ PHÍA người xem.
 * (three.js: camera nhìn theo −Z cục bộ, xem Camera.getWorldDirection.)
 * Vector trả về chỉ TỪ tâm trăng TỚI Mặt Trời, đã chuẩn hóa: [x, y, z].
 *
 *   phase = 0   → [ 0, 0, −1]: Mặt Trời sau lưng trăng, ta thấy mặt tối.
 *   phase = π/2 → [ 1, 0,  0]: sáng nửa PHẢI (thượng huyền, bắc bán cầu).
 *   phase = π   → [ 0, 0,  1]: Mặt Trời sau lưng người xem, trăng tròn.
 *   phase = 3π/2→ [−1, 0,  0]: sáng nửa TRÁI (hạ huyền).
 *
 * Kiểm tra: phần đĩa sáng của quả cầu Lambert = (1 + L·V)/2 với V = [0,0,1]
 * = (1 − cos(phase))/2, khớp với `illumination`.
 *
 * `tilt` (radian): xoay quanh trục nhìn, ngược chiều kim đồng hồ, để nghiêng
 * lưỡi liềm cho đẹp (ở vĩ độ thấp như Việt Nam, trăng non nằm ngửa như thuyền).
 * Dùng trong TSL: so với `normalView` của quả cầu trăng (cùng view space),
 * hoặc đổi sang world: new Vector3(...dir).transformDirection(camera.matrixWorld).
 */
export function sunDirection(phase, { tilt = 0 } = {}) {
  const x0 = Math.sin(phase);
  const z = -Math.cos(phase);
  const c = Math.cos(tilt);
  const s = Math.sin(tilt);
  const x = x0 * c;
  const y = x0 * s;
  const len = Math.hypot(x, y, z) || 1; // luôn = 1 về lý thuyết; chia để chống sai số làm tròn
  return [x / len, y / len, z / len];
}

/**
 * "Đêm nay" của thời điểm `date`, theo giờ địa phương tz (mặc định +7).
 *
 * Đêm là khoảng 18:00 → trước 05:30 sáng hôm sau. Trả về:
 *   instant — luôn là chính `date`, kể cả ban ngày. Ban ngày thì dùng giờ nào thay
 *             là chính sách của từng bức, không nằm trong hộp màu.
 *   isNight — true nếu giờ địa phương thuộc [18:00, 24:00) hoặc [00:00, 05:30).
 *   evening — Date lúc 00:00 (giờ tz) của NGÀY mà đêm bắt đầu: 02:00 sáng ngày 29
 *             vẫn thuộc đêm ngày 28. Ban ngày thì là 00:00 của chính ngày đó.
 */
export function tonight(date, tz = TZ_VN) {
  const local = new Date(date.getTime() + tz * HOUR); // dịch sang giờ tz rồi đọc bằng getUTC*
  const h = local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600;
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - tz * HOUR;
  if (h < 5.5) return { instant: date, isNight: true, evening: new Date(midnight - 24 * HOUR) };
  return { instant: date, isNight: h >= 18, evening: new Date(midnight) };
}

/**
 * Số giờ từ `evening` tới `instant`: 21:00 → 21, 02:00 hôm sau → 26, 05:30 hôm sau → 29,5.
 * Một bức có thể dùng số này làm giá trị cho thanh giờ của nó.
 */
export function hourOfNight(instant, evening) {
  return (instant.getTime() - evening.getTime()) / HOUR;
}
