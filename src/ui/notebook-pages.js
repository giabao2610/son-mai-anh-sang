// ui/notebook-pages.js — nội dung các trang của Sổ tay: Hiểu (thơ, chữ, sơ đồ, bạn vừa học, đọc thêm), thí nghiệm, số đo.
import { h } from './dom.js';

/**
 * Trang Hiểu của một lớp. Thiếu chữ (content tải hỏng) thì một dòng báo, không vỡ.
 * @param {Document} doc
 * @param {{ layer: import('../engine/contracts/painting.js').LayerMeta, text?: object, t: Record<string, any> }} p
 * @returns {HTMLElement[]}
 */
export function understandPage(doc, { layer, text, t }) {
  if (!text) return [h(doc, 'p', { class: 'nb-missing', text: t.notebook.contentMissing })];
  const poem = layer.poem
    ? h(doc, 'figure', { class: 'nb-poem' },
      h(doc, 'blockquote', {}, layer.poem.lines.map((line) => h(doc, 'p', { text: line }))),
      h(doc, 'figcaption', {}, h(doc, 'cite', { text: layer.poem.source }), layer.poem.author ? ` · ${layer.poem.author}` : null))
    : null;
  let diagram = null;
  if (text.diagram) {
    diagram = h(doc, 'figure', { class: 'nb-diagram' });
    // SVG do bức import bằng '?raw' từ thư mục diagrams/ trong repo (test hợp đồng kiểm có <title>): tin được.
    diagram.innerHTML = text.diagram;
  }
  const links = text.readMore ?? [];
  return [
    poem,
    h(doc, 'p', { class: 'nb-understand', text: text.understand }),
    diagram,
    h(doc, 'h3', { text: t.notebook.learned }),
    h(doc, 'ul', { class: 'nb-learned' }, text.learned.map((item) => h(doc, 'li', { text: item }))),
    links.length > 0 ? h(doc, 'h3', { text: t.notebook.readMore }) : null,
    links.length > 0
      ? h(doc, 'ul', { class: 'nb-read' }, links.map(({ title, url }) => h(doc, 'li', {},
        h(doc, 'a', { href: url, target: '_blank', rel: 'noopener', text: title }))))
      : null,
  ];
}

/**
 * Danh sách "Thử phá": mỗi thí nghiệm một nút bật/tắt (aria-pressed) kèm lời giải thích.
 * onToggle = null (tầng tĩnh): nút bị khóa, chỉ đọc được lời giải thích.
 * @param {Document} doc
 * @param {{ experiments: { id: string }[], text?: object, t: Record<string, any>,
 *           isOn: (id: string) => boolean, onToggle: ((id: string, on: boolean) => Promise<void>) | null }} p
 */
export function experimentList(doc, { experiments, text, t, isOn, onToggle }) {
  if (experiments.length === 0) return h(doc, 'p', { class: 'nb-missing', text: t.notebook.noExperiments });
  return h(doc, 'ul', { class: 'nb-experiments' }, experiments.map(({ id }) => {
    const words = text?.experiments?.[id];
    const button = h(doc, 'button', {
      type: 'button',
      'data-experiment': id,
      'aria-pressed': String(isOn(id)),
      disabled: onToggle === null,
      text: words?.label ?? id,
    });
    button.addEventListener('click', async () => {
      const on = button.getAttribute('aria-pressed') !== 'true';
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      try {
        await onToggle(id, on);
      } finally {
        // Đọc lại trạng thái THẬT (áp hỏng thì thí nghiệm vẫn như cũ), không tin vào ý định của cú bấm.
        button.setAttribute('aria-pressed', String(isOn(id)));
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    });
    return h(doc, 'li', {}, button, words?.explain ? h(doc, 'p', { text: words.explain }) : null);
  }));
}

/**
 * Bảng số đo: mỗi dòng một <dt> nhãn và <dd> giá trị. update() nhận { id: số | chuỗi } và định dạng theo ngôn ngữ trang.
 * @param {Document} doc
 * @param {{ rows: { id: string, label: string, unit?: string }[], lang: string }} p
 */
export function readoutList(doc, { rows, lang }) {
  const format = new Intl.NumberFormat(lang, { maximumFractionDigits: 1 });
  const cells = new Map();
  const el = h(doc, 'dl', { class: 'nb-readouts' }, rows.map(({ id, label }) => {
    const dd = h(doc, 'dd', { 'data-readout': id, text: '—' });
    cells.set(id, dd);
    return h(doc, 'div', {}, h(doc, 'dt', { text: label }), dd);
  }));
  const units = new Map(rows.map((r) => [r.id, r.unit ?? '']));
  return {
    el,
    update(values) {
      for (const [id, dd] of cells) {
        const v = values[id];
        if (v === undefined) continue;
        const shown = typeof v === 'number' ? format.format(v) : String(v);
        dd.textContent = units.get(id) ? `${shown} ${units.get(id)}` : shown;
      }
    },
  };
}
