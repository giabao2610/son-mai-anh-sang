// ui/dials.js — thanh trượt cho các Dial (núm của cả bức): input type="range", chữ giá trị (cũng là aria-valuetext), ghi chú.
import { h } from './dom.js';

/**
 * Xưởng vẽ thanh trượt cho mọi Dial mà bức khai báo (spec §4.1). Không biết Dial nghĩa là gì: nhãn và chữ ghi chú lấy từ
 * content của bức (content.dials[id]), chữ giá trị lấy từ Dial.format (bàn thợ đưa sẵn ở `text`).
 * Ghi chú là vùng aria-live: luôn có mặt, trống khi không có gì để nói (CSS thu lại), chỉ ghi khi chữ đổi.
 * @param {Document} doc
 * @param {{ dials: { id: string, min: number, max: number, step: number, value: number, text: string, note: string | null }[],
 *   content?: object | null, onChange: (id: string, v: number) => Promise<void> | void }} p
 */
export function createDials(doc, { dials, content = null, onChange }) {
  const rows = new Map();
  const el = h(doc, 'div', { class: 'dials' }, dials.map((d) => {
    const inputId = `dial-${d.id}`;
    const text = content?.dials?.[d.id];
    const input = h(doc, 'input', {
      type: 'range', id: inputId, min: String(d.min), max: String(d.max), step: String(d.step || 'any'), value: String(d.value),
    });
    const shown = h(doc, 'output', { for: inputId });
    const note = h(doc, 'p', { class: 'dial-note', 'aria-live': 'polite' });
    input.addEventListener('input', () => onChange(d.id, Number(input.value)));
    rows.set(d.id, { input, shown, note, notes: text?.notes ?? {} });
    return h(doc, 'div', { class: 'dial', 'data-dial': d.id },
      h(doc, 'label', { for: inputId, text: text?.label ?? d.id }), shown, input, note);
  }));

  const update = (list) => {
    for (const d of list) {
      const row = rows.get(d.id);
      if (!row) continue;
      if (Number(row.input.value) !== d.value) row.input.value = String(d.value);
      row.input.setAttribute('aria-valuetext', d.text);
      if (row.shown.textContent !== d.text) row.shown.textContent = d.text;
      const note = d.note ? row.notes[d.note] ?? '' : '';
      if (row.note.textContent !== note) row.note.textContent = note; // vùng live: chỉ ghi khi chữ đổi
    }
  };
  update(dials);
  return { el, update };
}
