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
 * 'hold-end' luôn ở chỗ ngón giữ đứng lần cuối, dù cái giữ kết thúc bằng cách nào.
 *
 * @param {Partial<typeof GESTURE>} [options]
 */
export function createGestureTracker(options = {}) {
  const { tapPx, holdMs, swipePx, swipeMs } = { ...GESTURE, ...options };
  let state = 'idle';
  let start = null; // { id, x, y, t } lúc chạm xuống
  let last = null; // vị trí mới nhất của ngón đó
  const pointers = new Set();

  const moved = (p) => Math.hypot(p.x - start.x, p.y - start.y);
  const at = (kind, p, extra = {}) => ({ kind, x: p.x, y: p.y, ...extra });

  /** Bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
  function cancel() {
    const out = state === 'hold' && start ? [at('hold-end', last ?? start)] : [];
    pointers.clear();
    start = null;
    last = null;
    state = 'idle';
    return out;
  }

  return {
    get state() {
      return state;
    },

    /** @param {{ id: number, x: number, y: number, t: number, primary?: boolean }} p  primary: PointerEvent.isPrimary */
    down(p) {
      // Cùng một con trỏ chạm xuống lần nữa, hoặc trình duyệt báo đây là con trỏ chính (mọi ngón khác đã rời):
      // pointerup trước đó đã bị mất. Khép cử chỉ cũ lại rồi bắt đầu như mới, để không kẹt ở "giữ" hay "hai ngón".
      const out = pointers.has(p.id) || (p.primary === true && pointers.size > 0) ? cancel() : [];
      pointers.add(p.id);
      if (pointers.size > 1) {
        if (state === 'hold') out.push(at('hold-end', last ?? start));
        state = 'multi';
        return out;
      }
      state = 'pending';
      start = p;
      last = p;
      return out;
    },

    move(p) {
      if (!start || p.id !== start.id) return [];
      last = p;
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
      // Đã giữ đủ lâu nhưng đồng hồ hẹn giờ chưa kịp poll (máy bận, tab bị bóp nhịp): vẫn là một lần giữ, không phải chạm.
      else if (state === 'pending' && p.t - start.t >= holdMs) out = [at('hold-start', start), at('hold-end', p)];
      else if (state === 'pending') out = [at('tap', start)];
      else if (state === 'drag') {
        const dt = p.t - start.t;
        if (dt > 0 && dt <= swipeMs && moved(p) >= swipePx) {
          out = [at('swipe', p, { velocity: { x: ((p.x - start.x) / dt) * 1000, y: ((p.y - start.y) / dt) * 1000 } })];
        }
      }
      start = null;
      last = null;
      state = pointers.size === 0 ? 'idle' : 'multi';
      return out;
    },

    /** Mất con trỏ (pointercancel, rời trang): bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
    cancel,
  };
}
