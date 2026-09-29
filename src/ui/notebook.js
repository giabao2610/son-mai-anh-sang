// ui/notebook.js — Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá (panel bên phải trên máy tính, tấm trượt dưới trên điện thoại).
import { h } from './dom.js';
import { createCodeView } from './code-view.js';
import { understandPage, experimentList, readoutList } from './notebook-pages.js';

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
  const knobsBox = h(doc, 'div', { class: 'nb-knobs', 'data-knobs': '' });
  const busy = h(doc, 'p', { class: 'nb-busy', 'aria-live': 'polite' }); // "đang dựng…" khi núm 'rebuild' đang chạy
  panels.chinh.append(knobsBox, busy, h(doc, 'h3', { text: t.notebook.code }), code.el);
  const el = h(doc, 'section', { class: 'notebook', 'data-notebook': '', 'aria-labelledby': 'notebook-title', hidden: true },
    h(doc, 'header', { class: 'nb-head' }, h(doc, 'div', {}, no, title), close),
    h(doc, 'div', { class: 'nb-tabs', role: 'tablist', 'aria-label': t.notebook.label }, tabs),
    Object.values(panels));

  let layerId = null;
  let tab = 'hieu';
  let pane = null; // Tweakpane của lớp đang mở (null: chưa dựng)
  let paneFor = null;
  let readouts = null;
  let timer = null;
  let pending = 0;

  const layerOf = (id) => meta.layers.find((l) => l.id === id);
  const specOf = (id) => studio()?.layers().find((l) => l.id === id) ?? null;

  /** Chờ một thay đổi (núm, thí nghiệm) xong; trong lúc chờ hiện "đang dựng…". Lỗi thì ghi log, Sổ tay vẫn chạy. */
  const track = async (change) => {
    pending += 1;
    busy.textContent = t.notebook.building;
    try {
      await change();
    } catch (err) {
      console.warn('Sổ tay: thay đổi không áp được:', err);
    } finally {
      pending -= 1;
      if (pending === 0) busy.textContent = '';
    }
  };

  const disposePane = () => {
    pane?.dispose();
    pane = null;
    paneFor = null;
  };

  /** Ô núm: chữ (hoặc trống) kèm data-state = 'loading' | 'ready' | 'empty' | 'static' cho CSS và e2e đọc. */
  const knobsState = (state, text = '') => {
    knobsBox.dataset.state = state;
    knobsBox.textContent = text;
  };

  /** Núm của lớp đang mở (Tweakpane). Tầng tĩnh: một dòng giải thích thay cho núm. */
  const mountPane = async () => {
    const id = layerId;
    if (paneFor === id) return;
    disposePane();
    paneFor = id;
    const spec = specOf(id);
    if (!spec) {
      knobsState('static', t.notebook.knobsStatic);
      return;
    }
    if (spec.knobs.length === 0) {
      knobsState('empty', t.notebook.noKnobs);
      return;
    }
    knobsState('loading', t.notebook.loading);
    const { mountKnobs } = await loadKnobs();
    if (paneFor !== id) return; // người xem đã chuyển lớp trong lúc tải Tweakpane
    knobsState('ready');
    pane = mountKnobs(knobsBox, {
      knobs: spec.knobs,
      values: studio().knobs(id),
      labels: content?.layers?.[id]?.knobs,
      onChange: (knobId, value) => track(async () => {
        await studio()?.setKnob(id, knobId, value);
        pane?.refresh(studio()?.knobs(id) ?? {}); // lớp có thể đã kẹp giá trị
      }),
      onHover: (knobId) => code.light(knobId),
    });
  };

  const tick = () => {
    const s = studio();
    if (!s || !readouts) return;
    const values = { ...s.stats() };
    for (const r of s.readouts(layerId)) values[`lop:${r.id}`] = r.value;
    readouts.update(values);
  };
  const stopTimer = () => {
    clearInterval(timer);
    timer = null;
  };

  /** Trang Phá: thí nghiệm của lớp + số đo (của lớp, rồi của xưởng). Tầng tĩnh: chỉ lời giải thích. */
  const renderBreak = () => {
    const s = studio();
    const spec = specOf(layerId);
    const text = content?.layers?.[layerId];
    const experiments = spec?.experiments ?? Object.keys(text?.experiments ?? {}).map((id) => ({ id }));
    const list = experimentList(doc, {
      experiments,
      text,
      t,
      isOn: (id) => (s ? s.experiment(layerId, id) : false),
      onToggle: s ? (id, on) => track(() => studio()?.toggleExperiment(layerId, id, on)) : null,
    });
    readouts = null;
    if (!spec) {
      panels.pha.replaceChildren(list, h(doc, 'p', { class: 'nb-missing', text: t.notebook.experimentsStatic }));
      return;
    }
    const rows = [
      ...spec.readouts.map((r) => ({ id: `lop:${r.id}`, label: text?.readouts?.[r.id] ?? r.id, unit: r.unit })),
      ...['drawCalls', 'triangles', 'ms'].map((id) => ({ id, label: t.notebook.readouts[id] })),
    ];
    readouts = readoutList(doc, { rows, lang: t.lang });
    panels.pha.replaceChildren(list, h(doc, 'h3', { text: t.notebook.measure }), readouts.el);
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
    if (id === 'chinh') mountPane();
    stopTimer();
    if (id === 'pha' && readouts) {
      tick();
      timer = setInterval(tick, READOUT_MS);
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
      code.show(layer.files);
      if (paneFor !== id) disposePane();
      renderBreak();
      el.hidden = false;
      select(want);
    },
    hide,
    dispose() {
      hide();
      disposePane();
      el.remove();
    },
  };
}
