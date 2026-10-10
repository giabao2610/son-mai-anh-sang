// ui/knob-pane.js — ô núm của Sổ tay (tab Chỉnh): Tweakpane của lớp đang mở, và (GĐ 9) đọc lại giá trị thật khi bàn thợ đổi từ chỗ khác.
import { h } from './dom.js';

/**
 * Tách từ notebook.js (GĐ 9). Tweakpane chỉ tải khi tab Chỉnh mở lần đầu (`loadKnobs`); tầng tĩnh thì một dòng giải thích thay cho núm.
 * Ô núm nhớ những giá trị nó đang HIỆN (`shown`): bàn thợ đổi từ chỗ khác ("Về nguyên bản", link dán, Back/Forward, `__sma`) thì
 * `sync()` so với giá trị thật và vẽ lại; cú kéo của chính người xem đã nằm trong `shown`, nên không bị vẽ đè giữa chừng.
 * @param {Document} doc
 * @param {object} p
 * @param {Record<string, any>} p.t
 * @param {object | null} p.content
 * @param {() => any} p.studio
 * @param {() => Promise<{ mountKnobs: Function }>} p.loadKnobs
 * @param {(change: () => any) => Promise<void>} p.track   chờ một thay đổi, hiện "đang dựng…" (notebook.js)
 * @param {(knobId: string | null) => void} p.onHover      rê một núm: sáng dòng code
 */
export function createKnobPane(doc, { t, content, studio, loadKnobs, track, onHover }) {
  const el = h(doc, 'div', { class: 'nb-knobs', 'data-knobs': '' });
  let pane = null; // Tweakpane của lớp đang mở (null: chưa dựng)
  let paneFor = null;
  let shown = {}; // giá trị mà ô núm đang hiện

  /** Ô núm: chữ (hoặc trống) kèm data-state = 'loading' | 'ready' | 'empty' | 'static' | 'error' cho CSS và e2e đọc. */
  const state = (name, text = '') => {
    el.dataset.state = name;
    el.textContent = text;
  };
  /** Vẽ lại theo giá trị thật (refresh của knobs.js không phát onChange). */
  const show = (values) => {
    shown = { ...values };
    pane?.refresh(values);
  };
  const dispose = () => {
    pane?.dispose();
    pane = null;
    paneFor = null;
    shown = {};
  };

  /** Núm của lớp `id` (Tweakpane). Đã dựng cho lớp ấy thì thôi. */
  async function mount(id) {
    if (paneFor === id) return;
    dispose();
    paneFor = id;
    const spec = studio()?.layers().find((l) => l.id === id) ?? null;
    if (!spec) {
      state('static', t.notebook.knobsStatic);
      return;
    }
    if (spec.knobs.length === 0) {
      state('empty', t.notebook.noKnobs);
      return;
    }
    state('loading', t.notebook.loading);
    try {
      const { mountKnobs } = await loadKnobs();
      if (paneFor !== id) return; // người xem đã chuyển lớp trong lúc tải Tweakpane
      state('ready');
      shown = { ...studio().knobs(id) };
      pane = mountKnobs(el, {
        knobs: spec.knobs,
        values: { ...shown },
        labels: content?.layers?.[id]?.knobs,
        // Xong (hay hỏng) thì đọc lại giá trị thật: lớp có thể đã kẹp giá trị, hoặc áp hỏng và giữ giá trị cũ.
        onChange: (knobId, value) => {
          shown[knobId] = value;
          return track(() => studio()?.setKnob(id, knobId, value)).then(() => {
            if (paneFor === id) show(studio()?.knobs(id) ?? {});
          });
        },
        onHover,
      });
    } catch (err) {
      // Chunk Tweakpane tải hỏng (mạng, hay trang vừa deploy): báo thay vì "Đang tải…" mãi; mở lại tab thì thử lại.
      console.warn('Sổ tay: không dựng được núm:', err);
      if (paneFor !== id) return;
      paneFor = null;
      state('error', t.notebook.knobsFailed);
    }
  }

  return {
    el,
    mount,
    dispose,
    /** Lớp mà ô núm đang dựng cho (null: chưa dựng). */
    get layer() {
      return paneFor;
    },
    /** Bàn thợ vừa đổi: giá trị thật khác giá trị đang hiện thì vẽ lại; giống hệt thì không đụng (không làm gián đoạn cú kéo). */
    sync() {
      if (!pane) return;
      const values = studio()?.knobs(paneFor);
      if (values && Object.keys(values).some((k) => !Object.is(values[k], shown[k]))) show(values);
    },
  };
}
