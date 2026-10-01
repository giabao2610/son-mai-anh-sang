// engine/tools/kinh-mai.js — công cụ Kính mài: soi một view (trước tone, emissive, normal…) qua kính tròn đi theo tay, hay gạt trước/sau.
import { Vector2 } from 'three/webgpu';
import { Fn, If, abs, color, length, min, mix, oneMinus, screenCoordinate, screenSize, smoothstep, step, uniform, vec3, vec4 } from 'three/tsl';
import { h } from '../../ui/dom.js';
import { pickView } from './pick.js';

export const id = 'kinh-mai';

/** Bán kính mặc định của kính tròn: 18% cạnh ngắn của khung (spec §7). */
export const LENS_RADIUS = 0.18;
const SHAPES = ['tron', 'gat']; // chỉ số trong uniform lens_shape
const RIM = '#D4A94A'; // viền vàng lá của bảng sơn mài
const STEP = 0.02; // một lần bấm mũi tên trên tay nắm gạt: 2% chiều ngang
const HOLD = ['tap', 'hold-start', 'hold-move', 'hold-end'];
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/**
 * Overlay của kính: ảnh cuối; trong kính tròn (hay bên TRÁI vạch gạt) là view đang chọn; viền vàng lá.
 * Tính theo điểm ảnh (screenCoordinate: gốc ở góc trên trái trên cả hai backend), nên kính luôn tròn dù khung dẹt.
 * Chọn hình bằng mix theo uniform (0/1), chọn view bằng If: mọi thay đổi chỉ là đổi uniform.
 * @param {any} final
 * @param {(id: string) => any} view
 * @param {{ ids: string[], u: Record<string, any> }} p
 */
export function lensNode(final, view, { ids, u }) {
  return Fn(() => {
    const out = vec3(final.rgb).toVar();
    If(u.mode.greaterThan(0), () => {
      const seen = vec3(out).toVar();
      pickView(u.mode, ids, view, seen);
      const px = screenCoordinate.xy;
      const r = min(screenSize.x, screenSize.y).mul(u.radius);
      const d = length(px.sub(u.pos.mul(screenSize))); // khoảng cách (điểm ảnh) tới tâm kính
      const inCircle = oneMinus(smoothstep(r.sub(1.5), r, d));
      const ringCircle = oneMinus(smoothstep(1, 2.5, abs(d.sub(r))));
      const edge = u.split.mul(screenSize.x);
      const inLeft = oneMinus(step(edge, px.x));
      const ringLine = oneMinus(smoothstep(0.5, 1.5, abs(px.x.sub(edge))));
      const inside = mix(inCircle, inLeft, u.shape);
      const rim = mix(ringCircle, ringLine, u.shape);
      out.assign(mix(mix(out, seen, inside), color(RIM), rim.mul(0.9)));
    });
    return vec4(out, 1);
  })();
}

/**
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const views = api.views().filter((v) => v.id !== 'final'); // view soi được, cố định từ lúc gắn
  const ids = views.map((v) => v.id);
  const u = {
    mode: uniform(0).setName('lens_mode'), // 0: không soi; k: soi ids[k − 1]
    shape: uniform(0).setName('lens_shape'), // 0: tròn, 1: gạt
    pos: uniform(new Vector2(0.5, 0.5)).setName('lens_pos'), // tâm kính, theo khung (0–1, gốc trên trái)
    radius: uniform(LENS_RADIUS).setName('lens_radius'),
    split: uniform(0.5).setName('lens_split'), // vạch gạt, 0–1 theo chiều ngang
  };
  let chosen = 0; // chỉ số (trong ids) của view đang soi; giữ lại qua các lần tắt/bật
  let on = false;

  const status = h(doc, 'p', { class: 'tool-status', 'aria-live': 'polite' });
  const shapeButtons = SHAPES.map((shape, i) => h(doc, 'button', {
    type: 'button', 'data-shape': shape, text: text.shapes[shape], onclick: () => setShape(i),
  }));
  const viewButtons = views.map((v, i) => h(doc, 'button', { type: 'button', 'data-view': v.id, text: v.label, onclick: () => choose(i) }));
  // Tay nắm của hình gạt: phần tử DOM role="slider", nên kéo bằng chuột, ngón tay, bàn phím, và trình đọc màn hình đọc được.
  const handle = h(doc, 'div', {
    class: 'lens-handle', role: 'slider', tabindex: '0', 'aria-label': text.handle, 'aria-valuemin': '0', 'aria-valuemax': '100',
  });
  api.el.append(
    h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
      h(doc, 'div', { class: 'tool-row', role: 'group', 'aria-label': text.shapeLabel }, shapeButtons),
      h(doc, 'div', { class: 'tool-row', role: 'group', 'aria-label': text.viewLabel }, viewButtons),
      status),
    handle,
  );

  const sync = () => {
    shapeButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(u.shape.value === i)));
    viewButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(chosen === i)));
    const pct = Math.round(u.split.value * 100);
    handle.setAttribute('aria-valuenow', String(pct));
    handle.setAttribute('aria-valuetext', `${pct}%`);
    handle.style.setProperty('--split', String(u.split.value));
    handle.hidden = u.shape.value !== 1;
  };
  const setShape = (i) => {
    u.shape.value = i;
    sync();
    return api.redraw();
  };
  const setSplit = (v) => {
    u.split.value = clamp01(v);
    sync();
    return api.redraw();
  };
  /** Chọn view. View chưa sẵn sàng (Normal) thì mài trước: "đang mài…", rồi mới đổi; hỏng thì báo và giữ view cũ. */
  const choose = async (i) => {
    if (!api.views().find((v) => v.id === ids[i])?.ready) {
      status.textContent = t.toolStatus.grinding;
      try {
        await api.requireView(ids[i]);
      } catch (err) {
        console.warn(`Kính mài: không mài được view "${ids[i]}":`, err);
        status.textContent = t.toolStatus.failed;
        return;
      }
      status.textContent = '';
    }
    chosen = i;
    if (on) u.mode.value = i + 1;
    sync();
    await api.redraw();
  };
  const move = (ndc) => u.pos.value.set(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5); // NDC (y lên) → khung (y xuống)

  handle.addEventListener('keydown', (e) => {
    const keys = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP };
    if (e.key in keys) setSplit(u.split.value + keys[e.key]);
    else if (e.key === 'Home') setSplit(0);
    else if (e.key === 'End') setSplit(1);
    else return;
    e.preventDefault();
  });
  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture?.(e.pointerId);
    setSplit(e.clientX / doc.defaultView.innerWidth);
  });
  handle.addEventListener('pointermove', (e) => {
    if (handle.hasPointerCapture?.(e.pointerId)) setSplit(e.clientX / doc.defaultView.innerWidth);
  });
  sync();

  return {
    overlay: (final, view) => lensNode(final, view, { ids, u }),
    onGesture(g) {
      if (!on || u.shape.value !== 0) return false; // gạt: tay nắm DOM lo, canvas không giữ cử chỉ nào
      if (g.kind === 'hover') {
        move(g.ndc); // máy tính: kính đi theo chuột
        return true;
      }
      // Chạm và giữ của ngón tay, bút: đặt và dời kính. Bấm chuột thì vẫn là của bức (gợn sóng); vuốt, kéo cũng vậy.
      if (g.pointer === 'mouse' || !HOLD.includes(g.kind)) return false;
      move(g.ndc);
      return true;
    },
    activate(value) {
      on = value;
      u.mode.value = on ? chosen + 1 : 0;
      sync();
    },
    dispose() {
      handle.remove();
    },
  };
}
