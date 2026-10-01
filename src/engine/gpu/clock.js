// engine/gpu/clock.js — đồng hồ của cảnh (thật, hoặc tất định khi có ?freeze) và bộ chặn 60 khung/giây.

const FRAME = 1 / 60;
const MAX_DT = 0.1;
/** Cảnh vẽ tối đa chừng này khung mỗi giây, dù màn hình nhanh hơn (spec §10, GĐ 3). */
export const MAX_FPS = 60;

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

/**
 * Bộ chặn khung (hàm thuần): trình duyệt gọi requestAnimationFrame theo nhịp màn hình (60, 90, 120, 144 Hz…), mà một
 * bức tranh ngắm chậm chỉ cần 60 khung/giây. Nhịp nào tới sớm quá thì bỏ: màn 120 Hz không bắt GPU vẽ gấp đôi, máy mát
 * hơn, pin lâu hơn. Mốc "đã vẽ" tiến đều từng bước 1/60 s (không bám nhịp màn hình), nên màn 90 Hz vẽ xen kẽ, trung bình
 * vẫn 60 khung/giây. Màn 60 Hz, hay máy chậm hơn 60 khung, thì không khung nào bị bỏ.
 * @param {number} [fps]
 * @returns {{ ready: (ms: number) => boolean }}  ready(ms) = true: vẽ khung này
 */
export function createFrameCap(fps = MAX_FPS) {
  const step = 1000 / fps;
  const slack = 1.5; // ms: nhịp 60 Hz thật dao động nhẹ, đừng bỏ nhầm khung của màn 60 Hz
  let last = -Infinity;
  return {
    ready(ms) {
      if (!Number.isFinite(ms)) return true;
      const gap = ms - last;
      if (gap < step - slack) return false;
      // Tụt lại xa (tab vừa hiện lại, máy chậm): bám lại thời điểm hiện tại, không vẽ dồn để đuổi kịp.
      last = gap > 2 * step ? ms : last + step;
      return true;
    },
  };
}
