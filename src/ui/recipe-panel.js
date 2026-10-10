// ui/recipe-panel.js — Công thức trong thanh lớp: dòng tóm tắt "Công thức trong link" + "Về nguyên bản", và nút chép link (GĐ 9, spec §21.5).
import { h } from './dom.js';

/** Dòng "Đã chép link" tự xóa sau chừng này ms (vùng aria-live đã đọc xong). */
const STATUS_MS = 4000;

/**
 * Hai phần tử, thanh lớp (layer-rail.js) đặt: `summary` ở đầu thanh, `section` sau Đồ nghề. Không biết engine: mọi thứ đọc
 * và ghi qua studio() (recipe(), dials(), reset()); studio() là null ở tầng tĩnh thì các nút không làm gì.
 * Hai vùng aria-live (dòng tóm tắt, dòng trạng thái) luôn có mặt và không bao giờ `hidden`: trống thì CSS thu lại (:empty).
 * @param {Document} doc
 * @param {{ t: Record<string, any>, content?: object | null, studio: () => any, win?: Window }} p
 */
export function createRecipePanel(doc, { t, content = null, studio, win = doc.defaultView }) {
  let showing = false;
  let ready = false; // khung đầu sau show() đã qua: được điền vùng aria-live
  let armed = 0; // rAF đang chờ của show()
  let last = null; // chuỗi công thức đã viết thành tóm tắt (sync chỉ viết lại khi nó đổi)
  let statusTimer = 0;

  const text = h(doc, 'p', { class: 'rail-recipe-text', 'aria-live': 'polite' });
  const reset = h(doc, 'button', {
    type: 'button', class: 'rail-recipe-reset', 'data-recipe-reset': '', hidden: true, text: t.recipe.reset,
    onclick: async () => {
      await studio()?.reset();
      hide();
    },
  });
  // Nhãn ngắn chỉ hiện ở dải điện thoại (chip "Công thức · Về nguyên bản"), nơi dòng tóm tắt dài không nằm vừa; chữ đầy đủ vẫn ở vùng aria-live.
  const label = h(doc, 'span', { class: 'rail-recipe-label', 'aria-hidden': 'true', text: t.recipe.title });
  const summary = h(doc, 'div', { class: 'rail-recipe', 'data-recipe-summary': '' }, label, text, reset);

  const status = h(doc, 'p', { class: 'rail-recipe-status', 'aria-live': 'polite' });
  const field = h(doc, 'input', {
    type: 'text', readonly: true, class: 'rail-recipe-link', hidden: true, 'aria-label': t.recipe.linkLabel,
  });
  const say = (message, ms = 0) => {
    win.clearTimeout(statusTimer);
    status.textContent = message;
    if (ms) statusTimer = win.setTimeout(() => { status.textContent = ''; }, ms);
  };
  const copy = h(doc, 'button', {
    type: 'button', class: 'rail-recipe-copy', 'data-recipe-copy': '', text: t.recipe.copy,
    onclick: async () => {
      let url = null;
      try {
        // Link không mang query string (cờ ?force3d… là của người chép, không phải của công thức).
        const recipe = studio()?.recipe().text ?? '';
        url = win.location.origin + win.location.pathname + (recipe ? `#r=${recipe}` : '');
        await win.navigator.clipboard.writeText(url); // không có clipboard (http, trình duyệt cũ): ném, vào catch
        field.hidden = true;
        say(t.recipe.copied, STATUS_MS);
      } catch (err) {
        console.warn('Công thức: chưa chép được link vào clipboard.', err);
        if (url === null) {
          // recipe() hỏng: không có link nào để đưa ra ô.
          field.hidden = true;
          say(t.recipe.linkFailed);
          return;
        }
        // Chưa chép được (không có quyền, trang không an toàn): đưa link ra ô chỉ đọc, đã chọn sẵn để người xem tự chép. Focus trước rồi
        // mới chọn: Safari chỉ chọn chữ trong ô đang có focus, và người dùng bàn phím đứng ngay ở ô để chép.
        field.value = url;
        field.hidden = false;
        field.focus();
        field.select();
        // Điện thoại: dải thanh lớp cuộn ngang, ô link nằm cuối dải; kéo nó vào tầm nhìn (nearest: không đổi gì khi đã thấy).
        field.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        say(t.recipe.copyFailed);
      }
    },
  });
  const section = h(doc, 'section', { class: 'rail-recipe-tools', 'aria-labelledby': 'rail-recipe-title' },
    h(doc, 'h2', { id: 'rail-recipe-title', class: 'rail-title', text: t.recipe.title }), copy, status, field);

  /** Ghi vùng aria-live dòng tóm tắt; cùng một câu thì không ghi lại (kéo núm đổi công thức mà câu giữ nguyên: trình đọc màn hình đọc lại). */
  const write = (next) => {
    if (text.textContent !== next) text.textContent = next;
  };

  /** Viết lại dòng tóm tắt khi công thức đổi; công thức về rỗng thì ẩn. Chưa qua khung đầu sau show() thì chưa điền. */
  function sync() {
    if (!showing || !ready) return;
    const s = studio();
    if (!s) return;
    const { text: recipe, counts } = s.recipe();
    if (recipe === last) return;
    if (!recipe) {
      hide();
      return;
    }
    last = recipe;
    const dialText = new Map(s.dials().map((d) => [d.id, d.text]));
    const dials = counts.dials.map((id) => ({ label: content?.dials?.[id]?.label ?? id, text: dialText.get(id) ?? '' }));
    write(t.recipe.summary({ layers: counts.layers, knobs: counts.knobs, dials }));
    reset.hidden = false;
    summary.setAttribute('data-on', '');
  }
  function hide() {
    // "Về nguyên bản" đang giữ focus mà sắp ẩn: đưa focus sang nút chép link (cùng thanh lớp), không thì bàn phím và VoiceOver rơi về
    // <body>. Nút chép không có trong trang thì sang tên lớp đầu tiên của thanh.
    if (doc.activeElement === reset) (copy.isConnected ? copy : summary.parentElement?.querySelector('.rail-name'))?.focus();
    showing = false;
    ready = false;
    win.cancelAnimationFrame(armed);
    armed = 0;
    last = null;
    write('');
    reset.hidden = true;
    summary.removeAttribute('data-on');
  }

  return {
    summary,
    section,
    /**
     * Hiện dòng tóm tắt. Lần mở đầu, thanh lớp bỏ hidden (và vùng aria-live vừa được tạo) trong chính nhịp này: điền cùng nhịp thì
     * VoiceOver bỏ qua (luật của CLAUDE.md), nên điền ở khung sau, như tab Phá của Sổ tay.
     */
    show() {
      showing = true;
      ready = false;
      last = null;
      win.cancelAnimationFrame(armed);
      armed = win.requestAnimationFrame(() => {
        armed = 0;
        ready = true;
        sync();
      });
    },
    hide,
    sync,
  };
}
