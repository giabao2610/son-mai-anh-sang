// paintings/den-keo-quan/parts/keo-quan-quay.js — của lớp Kéo quân, hàm thuần: góc của trống tính thẳng từ thời gian (giữ, thả, gạt), không cộng dồn theo khung.

/**
 * tauFree: hằng số thời gian khi thả (ma sát, khí nóng kéo trống về tốc độ thường). tauGrip: khi tay giữ, trống dừng nhanh.
 * maxOmega: trần tốc độ (rad/s, ≈ 57 vòng/phút). perNdc: một đơn vị vận tốc vuốt cộng bao nhiêu rad/s; vận tốc của cử chỉ 'swipe' tính
 * theo NDC mỗi giây (input.js: cả bề ngang khung là 2), một cú vuốt nhanh chừng 10. maxFlick: trần của một cú gạt.
 */
export const SPIN = Object.freeze({ tauFree: 2.5, tauGrip: 0.25, maxOmega: 6, perNdc: 0.35, maxFlick: 4 });

export const rpmToOmega = (rpm) => (rpm * 2 * Math.PI) / 60;

/** Một cú vuốt → lượng tốc độ cộng vào (rad/s): theo chiều ngang của vuốt (NDC/s), có trần. Vuốt sang phải: mặt trước trống chạy sang phải. */
export function flickOf(velocity) {
  const vx = velocity?.x ?? 0;
  return Math.sign(vx) * Math.min(Math.abs(vx) * SPIN.perNdc, SPIN.maxFlick);
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Trống quay: ω đi dần về ω* với hằng số thời gian τ. Đang giữ thì ω* = 0, τ = tauGrip; không thì ω* = tốc độ thường, τ = tauFree.
 * Giữa hai sự kiện có dạng đóng (Δ = t − t₀):
 *   ω(t) = ω* + (ω₀ − ω*)·e^(−Δ/τ)
 *   θ(t) = θ₀ + ω*·Δ + (ω₀ − ω*)·τ·(1 − e^(−Δ/τ))
 * Sự kiện nào cũng CHỐT trạng thái (t₀, θ₀, ω₀) ở lúc đó rồi mới đổi ω*, τ hay ω, nên θ và ω liên tục. angle(t) chỉ đọc trạng
 * thái đã chốt: gọi bao nhiêu lần cũng ra một số, và update(0, t) lúc ?freeze vẽ lại đúng khung N (CLAUDE.md, chuyển động).
 * @param {{ omega: number }} p  tốc độ thường lúc đầu (rad/s)
 */
export function createSpin({ omega }) {
  let base = omega;
  let gripped = false;
  let pinned = { t: 0, theta: 0, omega };
  const at = (t) => {
    const dt = Math.max(0, t - pinned.t);
    const target = gripped ? 0 : base;
    const tau = gripped ? SPIN.tauGrip : SPIN.tauFree;
    const e = Math.exp(-dt / tau);
    return { theta: pinned.theta + target * dt + (pinned.omega - target) * tau * (1 - e), omega: target + (pinned.omega - target) * e };
  };
  const pin = (t) => {
    const s = at(t);
    pinned = { t: Math.max(t, pinned.t), theta: s.theta, omega: s.omega };
  };
  return {
    angle: (t) => at(t).theta,
    speed: (t) => at(t).omega,
    grip(t) { pin(t); gripped = true; },
    release(t) { pin(t); gripped = false; },
    flick(t, dOmega) {
      pin(t);
      if (!gripped) pinned.omega = clamp(pinned.omega + dOmega, -SPIN.maxOmega, SPIN.maxOmega);
    },
    setBase(t, value) { pin(t); base = clamp(value, -SPIN.maxOmega, SPIN.maxOmega); },
  };
}
