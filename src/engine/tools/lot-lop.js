// engine/tools/lot-lop.js — công cụ Lột lớp: một thanh trượt đi ngược danh sách view, lột dần ảnh cuối về từng bước của pipeline.
import { Fn, uniform, vec3, vec4 } from 'three/tsl';
import { h } from '../../ui/dom.js';
import { pickView } from './pick.js';

export const id = 'lot-lop';

/** Overlay: cả khung là view thứ `peel` (0 là ảnh cuối, tức không đổi gì). */
export function peelNode(final, view, { ids, peel }) {
  return Fn(() => {
    const out = vec3(final.rgb).toVar();
    pickView(peel, ids, view, out);
    return vec4(out, 1);
  })();
}

/**
 * Thanh là một input type="range": số nấc bằng số view (Bức 1 có sáu), nấc bên PHẢI cùng là ảnh cuối, kéo sang trái
 * là lột dần về trước; aria-valuetext là tên view, phím mũi tên đi từng nấc. Lột lớp không giữ cử chỉ nào trên canvas:
 * chạm vẫn tạo gợn sóng, để người xem thấy gợn sóng hiện ra trong ảnh Normal hay Depth.
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const views = api.views(); // views[0] là ảnh cuối
  const last = views.length - 1;
  const ids = views.slice(1).map((v) => v.id);
  const peel = uniform(0).setName('peel_view');
  let at = 0; // view đang hiện (chỉ số trong views)

  const range = h(doc, 'input', {
    type: 'range', id: 'lot-lop-range', min: '0', max: String(last), step: '1', value: String(last),
  });
  const shown = h(doc, 'output', { for: 'lot-lop-range', class: 'tool-value' });
  const status = h(doc, 'p', { class: 'tool-status', 'aria-live': 'polite' });
  api.el.append(h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
    h(doc, 'div', { class: 'tool-row' }, h(doc, 'label', { for: 'lot-lop-range', text: text.label }), range, shown),
    status));

  const sync = () => {
    range.value = String(last - at);
    range.setAttribute('aria-valuetext', views[at].label);
    shown.textContent = views[at].label;
  };
  /** Hiện view thứ k. View chưa sẵn sàng (Normal) thì mài trước; hỏng thì báo và quay về view cũ. */
  const show = async (k) => {
    if (!api.views()[k].ready) {
      status.textContent = t.toolStatus.grinding;
      try {
        await api.requireView(views[k].id);
      } catch (err) {
        console.warn(`Lột lớp: không mài được view "${views[k].id}":`, err);
        status.textContent = t.toolStatus.failed;
        sync();
        return;
      }
      status.textContent = '';
    }
    at = k;
    peel.value = k;
    sync();
    await api.redraw();
  };
  range.addEventListener('input', () => show(last - Number(range.value)));
  sync();

  return {
    overlay: (final, view) => peelNode(final, view, { ids, peel }),
    /** Bật hay tắt đều bắt đầu lại từ ảnh cuối: tắt thì không còn gì phủ lên tranh. */
    activate() {
      at = 0;
      peel.value = 0;
      sync();
    },
    dispose() {},
  };
}
