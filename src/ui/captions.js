// ui/captions.js — chữ đi theo vật (GĐ 5): một vùng aria-live phủ lên canvas; mỗi lúc một dòng thơ kèm nguồn, đặt theo điểm neo.
import { h } from './dom.js';

/**
 * Chữ đứng bao lâu, tính bằng giây của đồng hồ cảnh (ctx.u.time; engine/gpu/caption-set.js đếm giờ): ?freeze đứng đồng hồ
 * thì chữ ở lại.
 */
export const CAPTION_SECONDS = 9;
/** Bắt đầu tan trước khi hết giờ bấy nhiêu giây: đúng thời gian tan của [data-fading] trong styles/captions.css. */
export const CAPTION_FADE = 1.2;
/**
 * Chân khung của trang: gợi ý / lời mời, rồi thơ, trăng và con dấu. main.frame vẽ đè lên [data-stage], nên chữ đi theo vật
 * xuống tới đó là hai lớp chữ in chồng lên nhau, không đọc được dòng nào. Điểm neo ở phần ba dưới màn hình (chỗ ngón cái chạm
 * tới trên điện thoại) thì nằm ngay dưới thơ. Tìm bằng các ô data-* mà tests/paintings/html.test.js giữ ở mọi trang, không
 * bằng class của CSS: thơ, trăng (nếu có) và con dấu là con của chân trang, nên mép trên cao nhất của chúng cũng là mép trên
 * của chân trang.
 */
const FLOOR = '[data-hint], [data-poem], [data-seal], [data-moon]';

/**
 * Vùng chữ nằm trong [data-stage], ngay trên canvas và cùng cỡ với nó, nên toạ độ px tính từ góc trái trên của canvas
 * (engine/gpu/caption-set.js chiếu điểm neo ra) cũng là toạ độ trong vùng. Không biết bức nào: chỉ nhận { lines, source,
 * author? } (cùng dạng với thơ của meta) và một điểm trên màn hình.
 *
 * Vùng là aria-live="polite": trình đọc màn hình đọc câu và nguồn mỗi khi một dòng mới vào. Theo luật của vùng live, vùng
 * KHÔNG BAO GIỜ `hidden` và để trống khi không có chữ. Điểm neo ra ngoài khung thì chữ mang data-away (CSS cho nó trong
 * suốt) chứ không `hidden`: chữ vẫn ở trong cây trợ năng, nên vào lại khung không bị đọc lại, và vẫn mờ dần hiện ra.
 * Hiện mờ dần, tan dần đều là CSS transition trên opacity (styles/captions.css; giảm chuyển động thì bỏ transition).
 * @param {Document} doc
 * @param {HTMLElement} parent   [data-stage] (chứa canvas)
 * @returns {{ show: (poem: { lines: string[], source: string, author?: string }) => void,
 *   place: (x: number, y: number, visible: boolean) => void, fade: () => void, clear: () => void, dispose: () => void }}
 */
export function mountCaptions(doc, parent) {
  const region = h(doc, 'div', { class: 'captions', 'data-captions': true, 'aria-live': 'polite' });
  parent.append(region);
  let caption = null; // <p class="caption"> đang hiện; null khi vùng trống
  let box = { width: 0, height: 0 }; // cỡ (px) của chữ đang hiện, đo một lần lúc show
  let floor = Infinity; // mép trên của chân khung (px trong vùng), đo cùng lúc với box; không có chân khung thì vô cùng

  /**
   * Mép trên cao nhất của chân khung, đổi từ toạ độ của trang sang toạ độ trong vùng. Ô cao 0 thì bỏ qua: gợi ý đang trống
   * (thanh lớp mở), hay khung bị gỡ khỏi bố cục (?poster cho nó display: none, mọi số đo về 0).
   */
  const measureFloor = () => {
    let top = Infinity;
    for (const el of doc.querySelectorAll(FLOOR)) {
      const r = el.getBoundingClientRect();
      if (r.height > 0) top = Math.min(top, r.top);
    }
    return top - region.getBoundingClientRect().top;
  };

  return {
    /** Thay dòng đang hiện (nếu có) bằng một dòng mới: từng câu một hàng, rồi nguồn (· tác giả), như thơ trong Sổ tay. */
    show(poem) {
      caption = h(doc, 'p', { class: 'caption' },
        poem.lines.map((line) => h(doc, 'span', { class: 'caption-line', text: line })),
        h(doc, 'span', { class: 'caption-cite' }, h(doc, 'cite', { text: poem.source }), poem.author ? ` · ${poem.author}` : null));
      region.replaceChildren(caption);
      // Đọc style trước khi đổi: trình duyệt "chốt" opacity 0 của chữ vừa vào, nên data-shown chắc chắn sinh transition.
      // Thiếu bước này, gắn chữ và hiện chữ rơi vào cùng một lần tính style, và chữ hiện ngay, không mờ dần.
      void doc.defaultView?.getComputedStyle(caption).opacity;
      caption.setAttribute('data-shown', '');
      // Đo cỡ chữ và chân khung một lần cho mỗi dòng (một lần tính bố cục khi dòng vào, không phải mỗi khung): place() cần
      // chúng để giữ chữ trong vùng và trên chân khung. Lời mời hiện từ lần chạm đầu, trước cả cử chỉ làm chữ hiện, nên đã có
      // trong số đo. Xoay máy, hay gợi ý đổi giữa chừng, thì số đo lệch trong vài giây còn lại của dòng đó.
      box = { width: caption.offsetWidth, height: caption.offsetHeight };
      floor = measureFloor();
    },
    /**
     * Đặt chữ ngay TRÊN điểm (x, y) (px trong vùng), căn giữa theo chiều ngang. Điểm sát mép thì chữ dừng ở mép mà vẫn ở
     * trên điểm: chữ không tràn ra ngoài màn hình (spec §12). Trên điện thoại chữ rộng gần hết bề ngang, nên chuyện này xảy
     * ra gần như mỗi lần. Điểm nằm dưới mép trên của chân khung thì chữ dừng ở mép đó: vẫn ở trên điểm và đi theo nó sang
     * ngang, nhưng không in chồng lên gợi ý hay thơ. Chỉ đổi transform: không đụng tới bố cục, nên gọi mỗi khung vẫn rẻ.
     * visible = false (điểm neo ngoài khung, sau camera) thì gắn data-away cho chữ (CSS đưa opacity về 0 ngay), không bao giờ
     * `hidden`, không đụng vùng live; transform cũ để nguyên. visible = true thì gỡ data-away: chữ mờ dần hiện lại.
     */
    place(x, y, visible) {
      if (!caption) return;
      if (visible) {
        // Bề ngang của vùng thì đọc mỗi lần (xoay máy là đổi). Đọc trước khi ghi transform, nên không bắt trình duyệt tính
        // lại bố cục giữa khung.
        const room = region.clientWidth;
        const half = box.width / 2;
        // Vùng hẹp hơn chữ (max-width 80vw nên không xảy ra) thì đặt chữ giữa vùng: hai bên bị cắt như nhau.
        const cx = room > box.width ? Math.min(Math.max(x, half), room - half) : room / 2;
        // Dưới chân khung thì dừng ở chân khung; sát mép trên thì giữ cả câu, kể cả khi màn thấp tới mức chân khung còn cao
        // hơn chính chữ: chữ đè lên điểm neo hay lên chân khung còn hơn mất nửa câu.
        const cy = Math.max(Math.min(y, floor), box.height);
        caption.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`;
      }
      const away = !visible;
      if (caption.hasAttribute('data-away') !== away) caption.toggleAttribute('data-away', away); // chỉ ghi khi đổi: hàm này chạy mỗi khung
    },
    /** Chữ bắt đầu tan (CSS đưa opacity về 0); clear() gỡ hẳn khi hết giờ. */
    fade() {
      caption?.setAttribute('data-fading', '');
    },
    clear() {
      region.replaceChildren();
      caption = null;
    },
    dispose() {
      region.remove();
      caption = null;
    },
  };
}
