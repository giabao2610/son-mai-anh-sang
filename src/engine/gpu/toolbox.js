// engine/gpu/toolbox.js — hộp đồ nghề: gắn các công cụ học vào pipeline, cử chỉ tới công cụ đang bật trước bức, mỗi lúc một công cụ.
import { h } from '../../ui/dom.js';

/**
 * Công cụ học (spec §7) chạy trên MỌI bức, vì chỉ nhìn các view mà xưởng liệt kê (views.js). Hộp đồ nghề:
 * - gắn từng công cụ (`mount(api)`), cho nó một ô trong thanh công cụ ([data-toolbar]) để dựng thanh điều khiển;
 * - ghép overlay của mọi công cụ lên ảnh cuối MỘT lần; công cụ nào gắn hay ghép hỏng thì bỏ nó, cảnh vẫn chạy (spec §9);
 * - bật MỘT công cụ mỗi lúc: bật cái này thì cái kia tắt; body[data-tool] cho CSS (khung hẹp: Sổ tay thu lại);
 * - cử chỉ tới công cụ đang bật TRƯỚC bức; công cụ trả true thì cử chỉ dừng ở đó;
 * - (GĐ 5) đưa móc lần vẽ của cảnh (draws.js) cho công cụ qua api.draws, chỉ năm hàm của DrawProbe: công cụ tự start() khi
 *   bật, stop() khi tắt;
 * - (GĐ 5) đặt thanh công cụ ngay sau thanh lớp trong trang: Tab từ nút công cụ trên thanh lớp đi qua phần còn lại của thanh
 *   lớp rồi vào bảng của nó, không vòng về đầu trang.
 * Bức không biết có công cụ nào: nó chỉ nhận những cử chỉ không công cụ nào dùng.
 *
 * @param {object} p
 * @param {import('../contracts/runtime.js').Tool[]} p.tools
 * @param {ReturnType<import('./views.js').createViews>} p.views
 * @param {Document} [p.doc]
 * @param {Record<string, any>} [p.t]        chữ giao diện: nhãn view ở t.views
 * @param {object | null} [p.content]        chữ của bức: nhãn tap ở content.layers[layerId].taps[tapId]
 * @param {() => Promise<void>} [p.redraw]   vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
 * @param {import('../contracts/runtime.js').DrawProbe | null} [p.draws]   móc lần vẽ của cảnh (Từng sợi): móc mà scene.js giữ, có
 *                                           cả begin()/end(); công cụ chỉ nhận năm hàm của DrawProbe. null: công cụ không có móc
 */
export function createToolbox({ tools, views, doc, t = {}, content = null, redraw = async () => {}, draws = null }) {
  const mounted = []; // { id, instance, slot }
  const bar = tools.length > 0 ? h(doc, 'div', { class: 'toolbar', 'data-toolbar': '', hidden: true }) : null;
  // Chữ của bức tải hỏng (mạng chập chờn) thì nhãn của tap rơi về id của nó: công cụ vẫn dùng được.
  const labelOf = (v) => t.views?.[v.id] ?? content?.layers?.[v.layerId]?.taps?.[v.tapId] ?? v.tapId ?? v.id;
  const viewInfos = () => views.list().map((v) => ({ id: v.id, label: labelOf(v), ready: v.ready }));
  // Công cụ thấy móc như bức thấy ctx.captions (captionSet.api): chỉ phần dành cho nó. begin()/end() là của scene.js, bọc mỗi
  // pipeline.render(), nên công cụ không bao giờ tự mở hay đóng một khung ghi; object đông cứng: không thay được hàm nào của móc.
  const probe = draws && Object.freeze({
    start: () => draws.start(),
    stop: () => draws.stop(),
    list: () => draws.list(),
    limit: (k) => draws.limit(k),
    counts: () => draws.counts(),
  });
  let active = null;

  const remove = (id) => {
    const i = mounted.findIndex((m) => m.id === id);
    if (i < 0) return;
    const [m] = mounted.splice(i, 1);
    m.slot.remove();
    try {
      m.instance.dispose();
    } catch (err) {
      console.warn(`Gỡ công cụ "${id}" bị lỗi:`, err);
    }
  };

  for (const tool of tools) {
    const slot = h(doc, 'div', { class: 'tool', 'data-tool-slot': tool.id, hidden: true });
    try {
      const instance = tool.mount({ views: viewInfos, requireView: (id) => views.require(id), el: slot, t, redraw, draws: probe });
      mounted.push({ id: tool.id, instance, slot });
      bar.append(slot);
    } catch (err) {
      console.warn(`Công cụ "${tool.id}" gắn không được, bỏ công cụ này:`, err);
    }
  }
  const overlays = mounted.filter((m) => m.instance.overlay).map((m) => ({ id: m.id, fn: (c, view) => m.instance.overlay(c, view) }));
  for (const id of views.setOverlays(overlays)) remove(id);
  if (bar && mounted.length > 0) {
    // Thứ tự Tab theo thứ tự DOM (WCAG 2.4.3): thanh công cụ đứng NGAY SAU thanh lớp, nơi có nút bật nó, và trước Sổ tay.
    // "Dựng lại cảnh" dựng thanh mới khi thanh lớp đã có; lần mở trang thì chưa: ui/workshop.js đặt thanh lớp ngay trước thanh này.
    const rail = doc.querySelector('[data-rail]');
    if (rail) rail.after(bar);
    else doc.body.append(bar);
  }

  const find = (id) => mounted.find((m) => m.id === id) ?? null;

  return {
    /** Công cụ đã gắn được, theo thứ tự tools/index.js: [{ id, on }]. */
    list: () => mounted.map(({ id }) => ({ id, on: id === active })),
    /** Bật một công cụ (tắt công cụ đang bật), hay null để tắt hết. Id lạ thì ném lỗi. */
    set(id) {
      if (id !== null && !find(id)) throw new Error(`Không có công cụ "${id}"`);
      if (id === active) return;
      const prev = find(active);
      if (prev) {
        prev.instance.activate?.(false);
        prev.slot.hidden = true;
      }
      active = id;
      const next = find(id);
      if (next) {
        next.slot.hidden = false;
        next.instance.activate?.(true);
        doc.body.dataset.tool = id;
      } else delete doc.body.dataset.tool;
      bar.hidden = !next;
    },
    /** Cử chỉ tới công cụ đang bật trước; true = công cụ đã dùng, không chuyển cho bức. */
    gesture(g) {
      return Boolean(find(active)?.instance.onGesture?.(g));
    },
    dispose() {
      for (const { id } of [...mounted]) remove(id);
      bar?.remove();
      if (doc?.body) delete doc.body.dataset.tool;
      active = null;
    },
  };
}
