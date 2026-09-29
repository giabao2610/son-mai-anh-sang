// ui/knobs.js — núm của một lớp vẽ bằng Tweakpane: kéo núm → onChange, rê chuột hay kéo → onHover (sáng dòng code). Chỉ import() động.
import { Pane } from 'tweakpane';

/** Nhãn của núm lấy từ content: chuỗi, hoặc { label, options } với núm 'select'. Thiếu thì dùng id. */
const labelOf = (text, id) => (typeof text === 'string' ? text : text?.label) ?? id;

/** Số chữ số thập phân đủ để thấy một bước của núm: bước 0.0001 → 4 (Tweakpane mặc định chỉ hiện tới 3). */
const digitsOf = (step) => (step > 0 && step < 1 ? Math.ceil(-Math.log10(step) - 1e-9) : 0);

/**
 * Có áp giá trị ngay không. Núm 'rebuild' chỉ áp khi thả tay (`last` của sự kiện change của Tweakpane):
 * dựng lại hình ở mỗi nấc kéo thì khựng. Núm 'uniform' và 'js' thì áp ngay, cả trong lúc kéo.
 * @param {{ via?: string }} knob
 * @param {boolean} last
 */
export const appliesNow = (knob, last) => knob.via !== 'rebuild' || last;

/**
 * Vẽ núm của MỘT lớp vào `container`. Sổ tay chỉ import() file này khi tab Chỉnh mở lần đầu (Tweakpane ≈ 31 KB gzip,
 * người chỉ ngắm tranh không tải). Mỗi núm là một "binding" trên object `params`: Tweakpane đọc và ghi ở đó.
 *
 * - Núm 'rebuild' chỉ báo onChange khi thả tay (ev.last): dựng lại hình mỗi nấc kéo thì khựng.
 * - Rê chuột, focus bàn phím, hay đang kéo (điện thoại không có rê chuột) đều gọi onHover(id); rời ra gọi onHover(null).
 *
 * @param {HTMLElement} container
 * @param {object} opts
 * @param {{ id: string, kind: string, via: string, min?: number, max?: number, step?: number, options?: string[] }[]} opts.knobs
 * @param {Record<string, any>} opts.values                 giá trị hiện tại (bàn thợ)
 * @param {Record<string, any>} [opts.labels]               content.layers[id].knobs
 * @param {(id: string, value: any) => void} opts.onChange
 * @param {(id: string | null) => void} [opts.onHover]
 */
export function mountKnobs(container, { knobs, values, labels = {}, onChange, onHover = () => {} }) {
  const pane = new Pane({ container });
  const params = { ...values };

  for (const knob of knobs) {
    const text = labels[knob.id];
    const opts = { label: labelOf(text, knob.id) };
    if (knob.kind === 'number') {
      Object.assign(opts, { min: knob.min, max: knob.max, step: knob.step });
      if (knob.step) opts.format = (v) => v.toFixed(digitsOf(knob.step));
    }
    if (knob.kind === 'select') {
      // Tweakpane nhận { nhãn: giá trị }; content có thể đặt nhãn cho từng lựa chọn.
      opts.options = Object.fromEntries(knob.options.map((o) => [text?.options?.[o] ?? o, o]));
    }
    if (knob.kind === 'color') opts.view = 'color';
    const binding = pane.addBinding(params, knob.id, opts);
    binding.on('change', (ev) => {
      onHover(knob.id);
      if (appliesNow(knob, ev.last)) onChange(knob.id, ev.value);
    });
    const el = binding.element;
    el.dataset.knob = knob.id;
    el.addEventListener('pointerenter', () => onHover(knob.id));
    el.addEventListener('focusin', () => onHover(knob.id));
    el.addEventListener('pointerleave', () => onHover(null));
    el.addEventListener('focusout', () => onHover(null));
  }

  return {
    /** Đọc lại giá trị từ bàn thợ (sau restore, hay sau khi lớp tự kẹp giá trị). */
    refresh(next) {
      Object.assign(params, next);
      pane.refresh();
    },
    dispose() {
      pane.dispose();
    },
  };
}
