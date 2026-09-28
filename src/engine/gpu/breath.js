// engine/gpu/breath.js — camera "thở": độ lệch nhỏ và chậm của điểm nhìn theo thời gian (hàm thuần, tất định).

// Ba nhịp (giây) lệch nhau: chuyển động không bao giờ lặp đều như con lắc.
const PERIODS = [11, 7, 13];

/**
 * Biên độ thở thật sự: CameraSpec.breathe của bức, ép về 0 khi người xem xin giảm chuyển động (§10).
 * @param {{ breathe?: number }} spec
 * @param {boolean} reducedMotion
 */
export function breathAmplitude(spec, reducedMotion) {
  return reducedMotion ? 0 : (spec.breathe ?? 0);
}

/**
 * Độ lệch [x, y, z] của điểm nhìn tại thời điểm t (giây của ctx.u.time, nên ?freeze cho cùng một khung).
 * Biên độ 0 (không khai báo breathe, hoặc người xem xin giảm chuyển động) thì không lệch.
 * @param {number} t
 * @param {number} amplitude  CameraSpec.breathe (đơn vị của cảnh)
 * @returns {[number, number, number]}
 */
export function breathOffset(t, amplitude) {
  if (!amplitude) return [0, 0, 0];
  const wave = (i) => Math.sin((t * 2 * Math.PI) / PERIODS[i] + i);
  return [wave(0) * amplitude, wave(1) * amplitude * 0.35, wave(2) * amplitude * 0.6];
}
