// ui/notebook-pages.js — nội dung các trang của Sổ tay: Hiểu (thơ, chữ, sơ đồ, bạn vừa học, đọc thêm), thí nghiệm, số đo, cột so sánh.
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
        if (v === null) {
          dd.textContent = '—'; // máy không đo được số này (ms GPU trên Safari, nhiều điện thoại, GPU Apple)
          continue;
        }
        const shown = typeof v === 'number' ? format.format(v) : String(v);
        dd.textContent = units.get(id) ? `${shown} ${units.get(id)}` : shown;
      }
    },
  };
}

/** Số đo của xưởng, cho mọi lớp, theo thứ tự hiện trong tab Phá. */
const STUDIO_READOUTS = ['drawCalls', 'triangles', 'ms', 'cpuMs', 'gpuMs'];

/**
 * Số đo trực tiếp của tab Phá: của lớp (nhãn trong content), rồi của xưởng. Máy không đo được ms GPU thì dòng đó ghi "—"
 * và có thêm một câu giải thích (GĐ 4); mẫu GPU đầu tiên về thì câu ấy ẩn đi.
 * @param {Document} doc
 * @param {{ readouts: { id: string, unit?: string }[], labels?: Record<string, string>, t: Record<string, any> }} p
 */
export function measureList(doc, { readouts, labels, t }) {
  const rows = [
    ...readouts.map((r) => ({ id: `lop:${r.id}`, label: labels?.[r.id] ?? r.id, unit: r.unit })),
    ...STUDIO_READOUTS.map((id) => ({ id, label: t.notebook.readouts[id] })),
  ];
  const list = readoutList(doc, { rows, lang: t.lang });
  const missing = h(doc, 'p', { class: 'nb-gpu-missing', text: t.notebook.gpuMissing });
  return {
    el: h(doc, 'div', { class: 'nb-measure' }, list.el, missing),
    /** @param {Record<string, number | string | null>} values  'lop:<id>' cho số của lớp, còn lại là stats() của bàn thợ */
    update(values) {
      list.update(values);
      missing.hidden = values.gpuMs !== null;
    },
  };
}

/**
 * Hai cột "Tắt / Bật" của một thí nghiệm 'compare' (GĐ 3). Mỗi hàng có ba vạch: ms mỗi khung (vàng lá), ms CPU (bạc lá)
 * và (GĐ 4) ms GPU (chàm sáng), mỗi loại dài theo số lớn hơn của hai hàng; kèm số viết ra. Vạch chỉ để nhìn
 * (aria-hidden), số là chữ để đọc. Máy mạnh thường thấy hai vạch ms khung bằng nhau: trình duyệt khóa ở nhịp màn hình.
 * ms CPU và ms GPU thì không bị khóa. Bên nào chưa có mẫu GPU (hay máy không đo được) thì không ghi số GPU.
 * @param {Document} doc
 * @param {{ t: Record<string, any> }} p
 */
export function compareBars(doc, { t }) {
  const format = new Intl.NumberFormat(t.lang, { maximumFractionDigits: 1 });
  const KEYS = ['ms', 'cpuMs', 'gpuMs'];
  const row = (side) => {
    const bars = KEYS.map(() => h(doc, 'i'));
    const value = h(doc, 'span', { class: 'nb-compare-value', text: t.notebook.compare.empty });
    const el = h(doc, 'div', { class: 'nb-compare-row', 'data-side': side },
      h(doc, 'span', { text: t.notebook.compare[side] }),
      h(doc, 'span', { class: 'nb-bars', 'aria-hidden': 'true' }, bars),
      value);
    return { el, bars, value };
  };
  const rows = { off: row('off'), on: row('on') };
  return {
    el: h(doc, 'div', { class: 'nb-compare', 'data-compare': '' }, rows.off.el, rows.on.el),
    /** @param {{ off: { ms: number, cpuMs: number, gpuMs?: number | null } | null, on: object | null }} data */
    update(data) {
      const top = (key) => Math.max(data.off?.[key] ?? 0, data.on?.[key] ?? 0) || 1;
      for (const side of ['off', 'on']) {
        const { bars, value } = rows[side];
        const v = data[side];
        KEYS.forEach((key, i) => {
          bars[i].style.width = v?.[key] != null ? `${(v[key] / top(key)) * 100}%` : '0%';
        });
        const gpu = v?.gpuMs != null ? format.format(v.gpuMs) : null;
        value.textContent = v ? t.notebook.compare.value(format.format(v.ms), format.format(v.cpuMs), gpu) : t.notebook.compare.empty;
      }
    },
  };
}
