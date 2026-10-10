// ui/notebook.js — Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá (panel bên phải trên máy tính, tấm trượt dưới trên điện thoại).
import { h } from './dom.js';
import { createCodeView } from './code-view.js';
import { createKnobPane } from './knob-pane.js';
import { understandPage, experimentList, measureList, compareBars } from './notebook-pages.js';

const TABS = ['hieu', 'chinh', 'pha'];
const READOUT_MS = 250; // số đo đổi 4 lần mỗi giây: đủ đọc được, không làm nặng khung hình

/**
 * Sổ tay không biết three hay engine/: mọi thứ của cảnh đến qua `studio()` (bàn thợ, engine/gpu/studio.js).
 * studio() trả null ở tầng tĩnh (hoặc lúc đang mất GPU): khi đó Sổ tay chỉ đọc (chữ, sơ đồ, code; không núm).
 * @param {Document} doc
 * @param {object} opts
 * @param {import('../engine/contracts/painting.js').PaintingMeta} opts.meta
 * @param {import('../engine/contracts/painting.js').PaintingContent | null} opts.content
 * @param {Record<string, any>} opts.t
 * @param {() => any} opts.studio
 * @param {() => Promise<{ mountKnobs: Function }>} [opts.loadKnobs]  Tweakpane chỉ tải khi tab Chỉnh mở lần đầu
 * @param {(file: string) => Promise<any>} [opts.loadCode]           test thay bộ nạp code
 */
export function createNotebook(doc, { meta, content, t, studio, loadKnobs = () => import('./knobs.js'), loadCode }) {
  const code = createCodeView(doc, { t, load: loadCode });
  const no = h(doc, 'p', { class: 'nb-no' });
  const title = h(doc, 'h2', { id: 'notebook-title' });
  const close = h(doc, 'button', { type: 'button', class: 'nb-close', 'aria-label': t.notebook.close, text: '×' });
  const tabs = TABS.map((id) => h(doc, 'button', {
    type: 'button', role: 'tab', id: `nb-tab-${id}`, 'aria-controls': `nb-panel-${id}`, 'data-tab': id, text: t.notebook.tabs[id],
  }));
  const panels = Object.fromEntries(TABS.map((id) => [id, h(doc, 'div', {
    role: 'tabpanel', id: `nb-panel-${id}`, 'aria-labelledby': `nb-tab-${id}`, 'data-panel': id, tabindex: '0',
  })]));
  // Dòng trạng thái ở đáy Sổ tay, thấy được ở mọi tab: "đang dựng…" khi núm hay thí nghiệm đang áp, hoặc báo áp hỏng.
  // Là vùng aria-live nên luôn có mặt, trống khi không có gì để nói (CSS thu lại khi :empty).
  const busy = h(doc, 'p', { class: 'nb-busy', 'aria-live': 'polite' });
  const el = h(doc, 'section', { class: 'notebook', 'data-notebook': '', 'aria-labelledby': 'notebook-title', hidden: true },
    h(doc, 'header', { class: 'nb-head' }, h(doc, 'div', {}, no, title), close),
    h(doc, 'div', { class: 'nb-tabs', role: 'tablist', 'aria-label': t.notebook.label }, tabs),
    Object.values(panels),
    busy);

  let layerId = null;
  let tab = 'hieu';
  let readouts = null;
  let compares = new Map(); // id thí nghiệm 'compare' → hai cột "Tắt / Bật"
  // "Lớp đang tắt": vùng aria-live nên luôn có mặt, trống khi lớp đang phủ (CSS thu lại khi :empty, không dùng hidden).
  const off = h(doc, 'p', { class: 'nb-off', 'aria-live': 'polite' });
  let timer = null;
  let pending = 0;

  const layerOf = (id) => meta.layers.find((l) => l.id === id);
  const specOf = (id) => studio()?.layers().find((l) => l.id === id) ?? null;
  /**
   * Bản dịch của một lớp (GĐ 9): hỏi bàn thợ ĐANG CÓ lúc bấm (cảnh dựng lại thì bàn thợ đổi). Không có bàn thợ lúc dựng Sổ tay: code-view
   * không có nút; mất GPU sau đó: Promise hỏng với câu tiếng Việt (code-view báo "chưa dịch được"), không TypeError.
   */
  const translateLayer = (id) => studio()?.translation(id) ?? Promise.reject(new Error('Cảnh chưa sẵn sàng: không có bản dịch'));

  /**
   * Chờ một thay đổi (núm, thí nghiệm) xong; trong lúc chờ hiện "đang dựng…". Áp không được thì ghi log và báo một
   * dòng trong Sổ tay (spec §9); cảnh vẫn chạy, và nơi gọi đọc lại trạng thái THẬT từ bàn thợ để núm, nút không nói dối.
   */
  const track = async (change) => {
    pending += 1;
    busy.textContent = t.notebook.building;
    let failed = false;
    try {
      await change();
    } catch (err) {
      failed = true;
      console.warn('Sổ tay: thay đổi không áp được:', err);
    } finally {
      pending -= 1;
      if (pending === 0) busy.textContent = failed ? t.notebook.changeFailed : '';
      code.refresh(); // Bản dịch đang mở thì dịch lại: núm 'rebuild' và thí nghiệm có thể đã đổi material
    }
  };

  // Ô núm (Tweakpane; ui/knob-pane.js): dựng khi tab Chỉnh mở, đọc lại giá trị thật khi bàn thợ đổi từ chỗ khác (sync).
  const knobs = createKnobPane(doc, { t, content, studio, loadKnobs, track, onHover: (knobId) => code.light(knobId) });
  panels.chinh.append(knobs.el, h(doc, 'h3', { text: t.notebook.code }), code.el);

  /** Số đo của tab Phá. `announce = false`: chưa đụng dòng "lớp đang tắt" (lần gọi cùng nhịp với lúc tab hiện). */
  const tick = (announce = true) => {
    const s = studio();
    if (!s || !readouts) return;
    const values = { ...s.stats() };
    for (const r of s.readouts(layerId)) values[`lop:${r.id}`] = r.value;
    readouts.update(values);
    for (const [expId, bars] of compares) bars.update(s.compare(layerId, expId));
    if (!announce) return;
    // Lớp ở trọng số 0 (chế độ mài): thí nghiệm của nó không làm gì thấy được, số đo so sánh cũng vô nghĩa.
    // Vùng aria-live: chỉ ghi khi chữ đổi, vì ghi lại cùng một câu thì vài trình đọc màn hình đọc lại.
    const text = s.weight(layerId).target < 0.5 ? t.notebook.layerOff : '';
    if (off.textContent !== text) off.textContent = text;
  };
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };

  /** Trang Phá: thí nghiệm của lớp + số đo (của lớp, rồi của xưởng). Tầng tĩnh: chỉ lời giải thích. */
  const renderBreak = () => {
    const id = layerId; // giữ lớp của trang này: người xem có thể đổi lớp trong lúc một thí nghiệm đang áp
    const spec = specOf(id);
    const text = content?.layers?.[id];
    const experiments = spec?.experiments ?? Object.keys(text?.experiments ?? {}).map((expId) => ({ id: expId }));
    const list = experimentList(doc, {
      experiments,
      text,
      t,
      isOn: (expId) => Boolean(studio()?.experiment(id, expId)),
      onToggle: studio() ? (expId, on) => track(() => studio()?.toggleExperiment(id, expId, on)) : null,
    });
    readouts = null;
    compares = new Map();
    if (!spec) {
      panels.pha.replaceChildren(list, h(doc, 'p', { class: 'nb-missing', text: t.notebook.experimentsStatic }));
      return;
    }
    // Thí nghiệm so sánh: hai cột "Tắt / Bật" ngay dưới nút, cùng nhịp với số đo.
    for (const { id: expId } of experiments.filter((e) => e.kind === 'compare')) {
      const bars = compareBars(doc, { t });
      list.querySelector(`[data-experiment="${expId}"]`).after(bars.el);
      compares.set(expId, bars);
    }
    readouts = measureList(doc, { readouts: spec.readouts, labels: text?.readouts, t });
    panels.pha.replaceChildren(off, list, h(doc, 'h3', { text: t.notebook.measure }), readouts.el);
  };

  /** Chọn tab: đúng mẫu tab của ARIA (aria-selected, roving tabindex). Chỉnh → dựng núm; Phá → chạy số đo. */
  const select = (id) => {
    tab = id;
    for (const button of tabs) {
      const on = button.dataset.tab === id;
      button.setAttribute('aria-selected', String(on));
      button.tabIndex = on ? 0 : -1;
    }
    for (const [name, panel] of Object.entries(panels)) panel.hidden = name !== id;
    if (id === 'chinh') knobs.mount(layerId);
    stopTimer();
    if (id === 'pha' && readouts) {
      // Tab vừa hiện: dòng nhắc để trống, nhịp đo sau mới điền (điền cùng nhịp với lúc bỏ hidden thì VoiceOver bỏ qua).
      off.textContent = '';
      tick(false);
      timer = setInterval(() => tick(), READOUT_MS);
    }
  };

  for (const button of tabs) button.addEventListener('click', () => select(button.dataset.tab));
  // Mũi tên trái/phải, Home/End chuyển tab (bàn phím, trình đọc màn hình).
  el.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const i = TABS.indexOf(tab);
    const next = { ArrowRight: (i + 1) % 3, ArrowLeft: (i + 2) % 3, Home: 0, End: 2 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(TABS[next]);
    tabs[next].focus();
  });

  const hide = () => {
    el.hidden = true;
    stopTimer();
  };
  close.addEventListener('click', hide);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });

  return {
    el,
    get layer() {
      return el.hidden ? null : layerId;
    },
    /**
     * Mở Sổ tay của một lớp. `tab` mặc định giữ tab đang xem (đổi lớp trên thanh lớp mà vẫn ở tab Chỉnh);
     * chế độ mài mở tab Hiểu cho lớp vừa phủ.
     */
    show(id, { tab: want = tab } = {}) {
      const layer = layerOf(id);
      if (!layer) throw new Error(`Sổ tay: không có lớp "${id}"`);
      layerId = id;
      const index = meta.layers.indexOf(layer);
      no.textContent = t.notebook.layerNo(index + 1, meta.layers.length);
      title.textContent = layer.name;
      panels.hieu.replaceChildren(...understandPage(doc, { layer, text: content?.layers?.[id], t }).filter(Boolean));
      code.show(layer.files, { layerId: id, layerName: layer.name, translate: studio() ? translateLayer : null });
      if (knobs.layer !== id) knobs.dispose();
      else knobs.sync(); // ô núm của lớp này còn từ lần mở trước: bàn thợ có thể đã đổi trong lúc Sổ tay đóng
      renderBreak();
      el.hidden = false;
      select(want);
    },
    hide,
    /**
     * Bàn thợ vừa đổi (GĐ 9: công thức áp, "Về nguyên bản", Back/Forward, __sma; workshop.js nghe studio.onChange): núm hiện giá trị
     * thật, và Bản dịch đang mở thì dịch lại (núm 'rebuild' có thể đã đổi material; code.refresh gộp và chỉ chạy ở Bản dịch).
     */
    sync() {
      knobs.sync();
      if (!el.hidden) code.refresh();
    },
    dispose() {
      hide();
      knobs.dispose();
      el.remove();
    },
  };
}
