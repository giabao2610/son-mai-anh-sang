// ui/dom.js — h(): dựng một phần tử DOM trong một dòng (thẻ, thuộc tính, con). Thanh lớp và Sổ tay dùng chung.

/**
 * h(doc, 'button', { class: 'x', type: 'button', onclick: fn, text: 'Bấm' }, ...con)
 * - `class` → className; `text` → textContent; `onxxx` → addEventListener('xxx', fn).
 * - Giá trị true → thuộc tính rỗng (hidden, disabled…); false/null/undefined → bỏ qua.
 * - Con là phần tử hoặc chuỗi; mảng được trải phẳng; null/false bị bỏ qua.
 * @param {Document} doc
 * @param {string} tag
 * @param {Record<string, any>} [attrs]
 * @param {...any} children
 * @returns {HTMLElement}
 */
export function h(doc, tag, attrs = {}, ...children) {
  const el = doc.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === false || value == null) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}
