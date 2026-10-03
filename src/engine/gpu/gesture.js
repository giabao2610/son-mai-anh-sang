// engine/gpu/gesture.js — phân loại thao tác con trỏ thành cử chỉ: chạm, chạm hai lần, giữ (bắt đầu / di / thả), vuốt, kéo. Hàm thuần.

/**
 * Ngưỡng mặc định: lệch quá tapPx là "kéo" (camera); giữ yên quá holdMs là "giữ"; kéo nhanh và xa là "vuốt";
 * chạm xuống lại trong doubleMs sau lúc nhấc ngón, cách chỗ chạm trước ≤ doublePx, là "chạm hai lần" (GĐ 5).
 */
export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300, doubleMs: 300, doublePx: 24 });

/**
 * Máy trạng thái cho MỘT ngón (hoặc chuột). Không biết DOM hay three: nhận tọa độ màn hình (px)
 * và thời điểm (ms), trả mảng cử chỉ vừa sinh ra. input.js đổi tọa độ sang NDC và thêm tia.
 *
 *   idle ─down→ pending ─(lệch > tapPx)→ drag ─up→ (nhanh + xa: 'swipe') → idle
 *                 │ └─up (trước holdMs)→ 'tap' → idle
 *                 └─poll (≥ holdMs, chưa lệch)→ 'hold-start' → hold ─move→ 'hold-move' ─up→ 'hold-end'
 * 'tap' tới ngay sau một 'tap' lẻ (xuống trong doubleMs sau lúc nhấc ngón đó, cách chỗ của nó ≤ doublePx) thì kèm 'double-tap'
 * cùng chỗ, rồi cặp tính lại từ đầu. Hai lần chạm vẫn là hai 'tap'; cử chỉ nào khác 'tap' cũng xóa 'tap' lẻ đang chờ.
 * Ngón thứ hai chạm xuống (chụm hai ngón = zoom camera) thì hủy: đang giữ thì phát 'hold-end'.
 * 'drag' không phát ra ngoài: kéo là của camera (OrbitControls tự nghe).
 * 'hold-end' luôn ở chỗ ngón giữ đứng lần cuối, dù cái giữ kết thúc bằng cách nào.
 *
 * @param {Partial<typeof GESTURE>} [options]
 */
export function createGestureTracker(options = {}) {
  const { tapPx, holdMs, swipePx, swipeMs, doubleMs, doublePx } = { ...GESTURE, ...options };
  let state = 'idle';
  let start = null; // { id, x, y, t } lúc chạm xuống
  let last = null; // vị trí mới nhất của ngón đó
  let lone = null; // { x, y, t }: 'tap' lẻ chờ lần chạm hai (chỗ chạm xuống, lúc nhấc ngón)
  const pointers = new Set();

  const moved = (p) => Math.hypot(p.x - start.x, p.y - start.y);
  const at = (kind, p, extra = {}) => ({ kind, x: p.x, y: p.y, ...extra });
  // Lần chạm đang kết thúc là lần hai của một cặp? Đo từ lúc NHẤC ngón của 'tap' lẻ: mỗi lần chạm đè ngón lâu hay mau
  // tùy người, còn khoảng hở giữa hai lần chạm thì luôn ngắn. Không xét id: mỗi lần ngón tay chạm là một con trỏ mới.
  const isSecondTap = () => lone !== null && start.t - lone.t <= doubleMs && Math.hypot(start.x - lone.x, start.y - lone.y) <= doublePx;

  /** Bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
  function cancel() {
    const out = state === 'hold' && start ? [at('hold-end', last ?? start)] : [];
    pointers.clear();
    start = null;
    last = null;
    lone = null; // mất con trỏ giữa hai lần chạm: không ghép cặp qua chỗ đứt đó
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
      // Không đợi xem có lần chạm sau: mỗi 'tap' phát ngay, không trễ. Lần hai của một cặp kèm 'double-tap' liền sau, cùng chỗ.
      else if (state === 'pending') out = isSecondTap() ? [at('tap', start), at('double-tap', start)] : [at('tap', start)];
      else if (state === 'drag') {
        const dt = p.t - start.t;
        if (dt > 0 && dt <= swipeMs && moved(p) >= swipePx) {
          out = [at('swipe', p, { velocity: { x: ((p.x - start.x) / dt) * 1000, y: ((p.y - start.y) / dt) * 1000 } })];
        }
      }
      // Chỉ một 'tap' lẻ được nhớ để chờ lần hai. Đã thành cặp thì quên (lần chạm thứ ba mở cặp mới); giữ, kéo, vuốt,
      // hai ngón cũng quên: lần chạm sau không ghép với 'tap' trước chúng.
      lone = out.length === 1 && out[0].kind === 'tap' ? { x: start.x, y: start.y, t: p.t } : null;
      start = null;
      last = null;
      state = pointers.size === 0 ? 'idle' : 'multi';
      return out;
    },

    /** Mất con trỏ (pointercancel, rời trang): bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
    cancel,
  };
}
