// paintings/cung-que/parts/mat-troi-pha.js — pha trăng của Bức 3: ngày âm lịch → góc tuổi trăng → hướng nắng quanh tiểu hành tinh; phần sáng nhìn từ Trái Đất và của Trái Đất; nhãn và ghi chú của Dial. Không import three.
import { SYNODIC_MONTH } from '../../../lib/astro/lunar.js';
import { moonPhase } from '../../../lib/astro/moon.js';

const TAU = Math.PI * 2;

/** Ngày âm lịch (1–30, có phần lẻ) → góc tuổi trăng φ: 0 trăng mới, π trăng tròn (quy ước của lib/astro/moon.js). */
export const phaseOfDay = (day) => (TAU * (day - 1)) / SYNODIC_MONTH;

/** Mặc định của Dial: tuổi trăng của `now`, nên lúc mở trang hành tinh sáng đúng như trăng đêm nay. Kẹp [1; 30]. */
export function defaultDay(now) {
  return Math.min(30, Math.max(1, 1 + moonPhase(now).fraction * SYNODIC_MONTH));
}

/**
 * Hướng từ hành tinh tới Mặt Trời (world space): S = −E·cos φ + A·sin φ, với E = +Y (về Trái Đất), A = +X (bên phải khung mặc định).
 * Khác sunDirection của hộp màu (view space, cho quả cầu trăng của Bức 1): xem spec §19.2.
 */
export const sunDirection = (phi) => [Math.sin(phi), -Math.cos(phi), 0];

/** Phần nửa hướng về Trái Đất được nắng chiếu (= illumination của moonPhase). */
export const litFraction = (phi) => (1 - Math.cos(phi)) / 2;
/** Phần sáng của Trái Đất nhìn từ trăng: ngược pha (trăng mới thì Trái Đất tròn). */
export const earthLit = (phi) => (1 + Math.cos(phi)) / 2;

/** Nhãn của Dial: chỉ số ngày. Tên pha là chữ, nằm ở content.dials.ngay.notes (phaseNote). */
export const formatDay = (day) => String(Math.round(day));

/** Khóa ghi chú gần bốn pha chính (±0,9 ngày), null ở giữa. */
export function phaseNote(day) {
  const q = ((day - 1) / SYNODIC_MONTH) * 4; // 0 trăng mới, 1 thượng huyền, 2 tròn, 3 hạ huyền, 4 trăng mới
  const near = (x) => Math.abs(q - x) < 0.12;
  if (near(0) || near(4)) return 'trangMoi';
  if (near(1)) return 'thuongHuyen';
  if (near(2)) return 'ram';
  if (near(3)) return 'haHuyen';
  return null;
}
