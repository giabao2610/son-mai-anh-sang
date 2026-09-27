// engine/gpu/clock.js — đồng hồ của cảnh: thật (theo ms của requestAnimationFrame) hoặc tất định khi có ?freeze.

const FRAME = 1 / 60;
const MAX_DT = 0.1;

/**
 * Hàm thuần, không dùng three: stage.js đổ { t, dt } vào ctx.u.time / ctx.u.delta mỗi khung.
 * Vì vậy KHÔNG dùng time/deltaTime của TSL: chúng chạy theo đồng hồ riêng của renderer và bỏ qua ?freeze.
 *
 * - freeze (true hoặc số N của ?freeze=N): mỗi tick đúng 1/60 s, t = frames × 1/60, không đọc đồng hồ tường.
 *   Cùng ?at&freeze=N trên cùng máy, cùng backend → cùng một ảnh (§8.7).
 * - thật: dt = khoảng cách giữa hai lần tick, kẹp trong [0, 0.1] s.
 *   Tab bị ẩn lâu rồi hiện lại thì dt không nhảy vọt; ms lùi lại thì dt = 0, không bao giờ âm.
 *   ms không phải số (khung đầu tiên của renderer có thể nhận undefined) thì dt = 0 và bỏ qua mốc đó.
 *
 * @param {{ freeze?: boolean | number }} [options]
 * @returns {{ tick: (ms: number) => { t: number, dt: number }, readonly frames: number }}
 */
export function createClock({ freeze = false } = {}) {
  let frames = 0;
  let t = 0;
  let last = null;

  return {
    tick(ms) {
      frames += 1;
      if (freeze) {
        t = frames * FRAME;
        return { t, dt: FRAME };
      }
      let dt = 0;
      if (Number.isFinite(ms)) {
        if (last !== null) dt = Math.min(Math.max((ms - last) / 1000, 0), MAX_DT);
        last = ms;
      }
      t += dt;
      return { t, dt };
    },
    get frames() {
      return frames;
    },
  };
}
