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
 * Màn có nhịp từ chừng này trở lên (tức ≤ ~63 Hz) thì không bị chặn: mọi khung đều vẽ. Nhiều màn "60 Hz" thật ra chạy
 * 60,02–60,1 Hz, nhịp ngắn hơn 1/60 s một chút (GĐ 4).
 */
export const SLOW_DISPLAY_MS = 1000 / 63;
const HICCUP_MS = 100; // khoảng rAF dài hơn thế (tab ẩn, debugger, máy khựng) không tính vào nhịp màn hình

/**
 * Bộ chặn khung (hàm thuần): trình duyệt gọi requestAnimationFrame theo nhịp màn hình (60, 90, 120, 144 Hz…), mà một
 * bức tranh ngắm chậm chỉ cần 60 khung/giây. Nhịp nào tới sớm quá thì bỏ: màn 120 Hz không bắt GPU vẽ gấp đôi, máy mát
 * hơn, pin lâu hơn. Mốc "đã vẽ" tiến đều từng bước 1/60 s (không bám nhịp màn hình), nên màn 90 Hz vẽ xen kẽ, trung bình
 * vẫn 60 khung/giây. Máy chậm hơn 60 khung thì không khung nào bị bỏ.
 *
 * GĐ 4: bộ chặn đo NHỊP MÀN HÌNH (trung bình trượt của mọi khoảng rAF, kể cả nhịp bị bỏ). Màn ≤ ~63 Hz thì không chặn
 * gì. Lý do: màn 60,1 Hz có nhịp 16,64 ms, ngắn hơn bước 16,67 ms của mốc "đã vẽ"; độ lệch dồn dần tới lúc quá dung sai
 * 1,5 ms thì một khung bị bỏ, tức hình giật một nhịp (GĐ 3 đo được 2–15 lần mỗi phút trên các màn 60,02–60,1 Hz).
 * @param {number} [fps]
 * @returns {{ ready: (ms: number) => boolean }}  ready(ms) = true: vẽ khung này
 */
export function createFrameCap(fps = MAX_FPS) {
  const step = 1000 / fps;
  const slack = 1.5; // ms: nhịp 60 Hz thật dao động nhẹ, đừng bỏ nhầm khung của màn 60 Hz
  let last = -Infinity; // mốc "đã vẽ"
  let prev = null; // thời điểm của nhịp rAF trước, dù nhịp đó vẽ hay bị bỏ
  let period = null; // nhịp màn hình (ms), trung bình trượt; null = chưa đo được
  return {
    ready(ms) {
      if (!Number.isFinite(ms)) return true;
      const raw = prev === null ? null : ms - prev;
      prev = ms;
      if (raw > 0 && raw < HICCUP_MS) period = period === null ? raw : period * 0.9 + raw * 0.1;
      // Màn chậm (hay chưa đo được nhịp): vẽ mọi khung, mốc "đã vẽ" bám theo thời điểm thật.
      if (period === null || period >= SLOW_DISPLAY_MS) {
        last = ms;
        return true;
      }
      const gap = ms - last;
      if (gap < step - slack) return false;
      // Tụt lại xa (tab vừa hiện lại, máy chậm): bám lại thời điểm hiện tại, không vẽ dồn để đuổi kịp.
      last = gap > 2 * step ? ms : last + step;
      return true;
    },
  };
}
