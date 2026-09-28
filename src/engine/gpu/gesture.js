// engine/gpu/gesture.js — phân loại thao tác con trỏ thành cử chỉ: chạm, giữ (bắt đầu / di / thả), vuốt, kéo. Hàm thuần.

/** Ngưỡng mặc định: lệch quá tapPx là "kéo" (camera); giữ yên quá holdMs là "giữ"; kéo nhanh và xa là "vuốt". */
export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300 });

/**
 * Máy trạng thái cho MỘT ngón (hoặc chuột). Không biết DOM hay three: nhận tọa độ màn hình (px)
 * và thời điểm (ms), trả mảng cử chỉ vừa sinh ra. input.js đổi tọa độ sang NDC và thêm tia.
 *
 *   idle ─down→ pending ─(lệch > tapPx)→ drag ─up→ (nhanh + xa: 'swipe') → idle
 *                 │ └─up (trước holdMs)→ 'tap' → idle
 *                 └─poll (≥ holdMs, chưa lệch)→ 'hold-start' → hold ─move→ 'hold-move' ─up→ 'hold-end'
 * Ngón thứ hai chạm xuống (chụm hai ngón = zoom camera) thì hủy: đang giữ thì phát 'hold-end'.
 * 'drag' không phát ra ngoài: kéo là của camera (OrbitControls tự nghe).
 *
 * @param {Partial<typeof GESTURE>} [options]
 */
export function createGestureTracker(options = {}) {
  const { tapPx, holdMs, swipePx, swipeMs } = { ...GESTURE, ...options };
  let state = 'idle';
  let start = null; // { id, x, y, t } lúc chạm xuống
  const pointers = new Set();

  const moved = (p) => Math.hypot(p.x - start.x, p.y - start.y);
  const at = (kind, p, extra = {}) => ({ kind, x: p.x, y: p.y, ...extra });

  return {
    get state() {
      return state;
    },

    /** @param {{ id: number, x: number, y: number, t: number }} p */
    down(p) {
      pointers.add(p.id);
      if (pointers.size > 1) {
        const out = state === 'hold' ? [at('hold-end', p)] : [];
        state = 'multi';
        return out;
      }
      state = 'pending';
      start = p;
      return [];
    },

    move(p) {
      if (!start || p.id !== start.id) return [];
      if (state === 'pending' && moved(p) > tapPx) state = 'drag';
      if (state === 'hold') return [at('hold-move', p)];
      return [];
    },

    /** Gọi định kỳ (setTimeout sau holdMs, hoặc mỗi lần move): đủ lâu mà chưa lệch thì thành "giữ". */
    poll(t) {
      if (state === 'pending' && t - start.t >= holdMs) {
        state = 'hold';
        return [at('hold-start', start)];
      }
      return [];
    },

    up(p) {
      pointers.delete(p.id);
      if (!start || p.id !== start.id) {
        if (pointers.size === 0) state = 'idle';
        return [];
      }
      let out = [];
      if (state === 'hold') out = [at('hold-end', p)];
      else if (state === 'pending') out = [at('tap', start)];
      else if (state === 'drag') {
        const dt = p.t - start.t;
        if (dt > 0 && dt <= swipeMs && moved(p) >= swipePx) {
          out = [at('swipe', p, { velocity: { x: ((p.x - start.x) / dt) * 1000, y: ((p.y - start.y) / dt) * 1000 } })];
        }
      }
      start = null;
      state = pointers.size === 0 ? 'idle' : 'multi';
      return out;
    },

    /** Mất con trỏ (pointercancel, rời trang): bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
    cancel() {
      const out = state === 'hold' && start ? [at('hold-end', start)] : [];
      pointers.clear();
      start = null;
      state = 'idle';
      return out;
    },
  };
}
