// ui/layer-rail.js — thanh lớp: tên từng lớp theo thứ tự phủ, công tắc (trừ Cốt), vạch trọng số, nút "Phủ lớp tiếp theo".
import { h } from './dom.js';

/**
 * Thanh lớp là DOM thuần: nó không đổi trọng số, chỉ báo ý người xem qua `on.*` và vẽ lại khi được bảo (setWeight).
 * Cốt không có công tắc (luật 1: trọng số của Cốt luôn là 1). Ở tầng tĩnh (interactive = false) chỉ còn tên lớp:
 * bấm tên để đọc Sổ tay.
 * @param {Document} doc
 * @param {object} opts
 * @param {{ id: string, name: string }[]} opts.layers   meta.layers, đúng thứ tự phủ
 * @param {Record<string, any>} opts.t
 * @param {boolean} opts.interactive
 * @param {{ open: (id: string) => void, toggle: (id: string, on: boolean) => void, next: () => void, close: () => void }} opts.on
 */
export function createRail(doc, { layers, t, interactive, on }) {
  const items = new Map();
  const list = h(doc, 'ol', {}, layers.map(({ id, name }, i) => {
    const open = h(doc, 'button', { type: 'button', class: 'rail-name', onclick: () => on.open(id) },
      h(doc, 'span', { class: 'rail-no', text: String(i + 1) }), name);
    const toggle = interactive && id !== 'cot'
      ? h(doc, 'button', {
        type: 'button',
        class: 'rail-switch',
        role: 'switch',
        'aria-checked': 'true',
        'aria-label': t.rail.toggle(name),
        onclick: () => on.toggle(id, toggle.getAttribute('aria-checked') !== 'true'),
      })
      : null;
    // Vạch trọng số: rộng theo giá trị hiện tại (--w), nên thấy lớp "phủ" dần trong lúc tween.
    const bar = h(doc, 'span', { class: 'rail-bar', 'aria-hidden': 'true' });
    const li = h(doc, 'li', { 'data-layer': id }, open, toggle, bar);
    items.set(id, { li, open, toggle, bar });
    return li;
  }));
  const next = h(doc, 'button', { type: 'button', class: 'rail-next', hidden: true, onclick: () => on.next() });
  const close = h(doc, 'button', { type: 'button', class: 'rail-close', 'aria-label': t.rail.close, text: '×', onclick: () => on.close() });
  const el = h(doc, 'nav', { class: 'rail', 'data-rail': '', 'aria-label': t.rail.label, hidden: true }, list, next, close);

  return {
    el,
    /** Vẽ trọng số của một lớp: vạch theo `value`, công tắc theo `target` (ý người xem, kể cả khi đang tween). */
    setWeight(id, { value, target }) {
      const item = items.get(id);
      if (!item) return;
      item.bar.style.setProperty('--w', value.toFixed(3));
      item.toggle?.setAttribute('aria-checked', String(target >= 0.5));
      item.li.dataset.on = String(target >= 0.5);
    },
    /** Đánh dấu lớp đang mở Sổ tay (aria-current), và cuộn thanh lớp tới nó (điện thoại: dải ngang cuộn được). */
    setActive(id) {
      for (const [key, { open }] of items) {
        if (key === id) {
          open.setAttribute('aria-current', 'true');
          open.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
        } else open.removeAttribute('aria-current');
      }
    },
    /** Nút "Phủ lớp tiếp theo · <tên>"; null thì ẩn nút (đã phủ đủ, hoặc tầng tĩnh). */
    setNext(name) {
      next.hidden = name == null;
      if (name != null) next.textContent = t.rail.next(name);
    },
  };
}
