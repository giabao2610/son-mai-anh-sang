// ui/workshop.js — xưởng trên trang: thanh lớp + Sổ tay + chế độ mài có hướng dẫn. Nhận studio() (null ở tầng tĩnh: chỉ đọc).
import { createRail } from './layer-rail.js';
import { createNotebook } from './notebook.js';
import { createRailTools } from './rail-tools.js';
import { createRecipePanel } from './recipe-panel.js';

/**
 * Chế độ mài (spec §4.1): mọi lớp trừ Cốt mờ dần về 0, bức trở về đất sét; "Phủ lớp tiếp theo" sơn lại lần lượt
 * từ lớp 2 tới lớp N, mỗi lần mở Sổ tay của lớp vừa phủ. Người xem cũng bật/tắt tự do trên thanh lớp.
 * "Lớp tiếp theo" luôn là lớp đầu tiên (sau Cốt) đang hướng về 0, nên bật/tắt tự do không làm lệch thứ tự.
 *
 * Không biết three: mọi thay đổi đi qua `studio()` (engine/gpu/studio.js). studio() trả null ở tầng tĩnh, và cả
 * lúc cảnh đang mất GPU chờ dựng lại: khi đó các nút không làm gì, còn CSS ẩn thanh lớp cho tới khi cảnh live lại.
 * @param {Document} doc
 * @param {object} opts
 * @param {import('../engine/contracts/painting.js').PaintingMeta} opts.meta
 * @param {import('../engine/contracts/painting.js').PaintingContent | null} opts.content
 * @param {Record<string, any>} opts.t
 * @param {() => any} [opts.studio]
 * @param {() => void} [opts.onClose]  sau khi đóng thanh lớp (run.js mời lại, để người xem mở lại được)
 * @param {object} [opts.notebook]   tùy chọn thêm cho createNotebook (test tiêm bộ nạp giả)
 */
export function mountWorkshop(doc, { meta, content, t, studio = () => null, onClose = () => {}, notebook: notebookOptions = {} }) {
  const win = doc.defaultView;
  const interactive = studio() !== null;
  const rest = meta.layers.slice(1); // mọi lớp trừ Cốt
  let frame = 0;
  let bound = studio(); // bàn thợ đang vẽ Sổ tay; "Dựng lại cảnh" tạo bàn thợ mới

  const notebook = createNotebook(doc, { meta, content, t, studio, ...notebookOptions });
  // Đồ nghề (công cụ học) và thanh trượt của các Dial: chỉ khi có cảnh 3D.
  const tools = interactive ? createRailTools(doc, { t, content, studio }) : null;
  // Công thức (GĐ 9): dòng tóm tắt đầu thanh và nút chép link; cũng chỉ khi có cảnh 3D (công thức là trạng thái của cảnh).
  const panel = interactive ? createRecipePanel(doc, { t, content, studio, win }) : null;
  const openLayer = (id, options) => {
    notebook.show(id, options);
    rail.setActive(id);
  };
  const nextLayer = () => {
    const s = studio();
    return s ? rest.find(({ id }) => s.weight(id).target < 0.5) ?? null : null;
  };
  const rail = createRail(doc, {
    layers: meta.layers,
    t,
    interactive,
    on: {
      open: (id) => openLayer(id),
      toggle: (id, on) => studio()?.setWeight(id, on ? 1 : 0, { tween: true }),
      next: () => {
        const layer = nextLayer();
        if (!layer) return;
        studio()?.setWeight(layer.id, 1, { tween: true });
        openLayer(layer.id, { tab: 'hieu' });
      },
      close: () => close(),
    },
    tools: tools?.el ?? null,
    recipe: panel,
  });
  // Thứ tự Tab theo thứ tự DOM (WCAG 2.4.3): thanh lớp → thanh công cụ → Sổ tay. Đi hết thanh lớp là Tab vào bảng công cụ.
  // Cảnh dựng thanh công cụ trước khi xưởng mở lần đầu, nên hai tấm của xưởng đứng hai bên nó; "Dựng lại cảnh" thì
  // engine/gpu/toolbox.js gắn thanh mới ngay sau thanh lớp. Trên màn hình, z-index giữ thanh công cụ dưới hai tấm (tools.css).
  const toolbar = doc.querySelector('[data-toolbar]');
  if (toolbar) {
    toolbar.before(rail.el);
    toolbar.after(notebook.el);
  } else doc.body.append(rail.el, notebook.el);

  /** Vẽ lại thanh lớp theo bàn thợ: vạch trọng số chạy theo tween, công tắc theo đích, nút "tiếp theo". */
  const sync = () => {
    const s = studio();
    if (s) for (const { id } of meta.layers) rail.setWeight(id, s.weight(id));
    rail.setNext(nextLayer()?.name ?? null);
    tools?.sync();
    panel?.sync();
    // Cảnh vừa được dựng lại (bàn thợ mới, thí nghiệm về tắt hết): vẽ lại Sổ tay đang mở theo bàn thợ mới.
    if (s && s !== bound) {
      bound = s;
      if (notebook.layer) notebook.show(notebook.layer);
    }
  };
  // Chỉ chạy khi thanh lớp đang mở: người chỉ ngắm tranh không tốn gì.
  const loop = () => {
    sync();
    frame = win.requestAnimationFrame(loop);
  };
  const stop = () => {
    win.cancelAnimationFrame(frame);
    frame = 0;
  };

  /** Đóng thanh lớp và Sổ tay, tắt công cụ học, phủ lại mọi lớp: về chế độ ngắm, thấy bức tranh hoàn chỉnh. */
  function close() {
    stop();
    rail.el.hidden = true;
    notebook.hide();
    if (interactive) studio()?.setTool(null);
    for (const { id } of rest) studio()?.setWeight(id, 1, { tween: true });
    onClose();
  }

  return {
    /**
     * Mở thanh lớp. grind: true (bấm lời mời) = vào chế độ mài: mọi lớp trừ Cốt mờ về 0, Sổ tay mở trang Cốt.
     * Ở tầng tĩnh không có trọng số để mài: chỉ mở Sổ tay trang Cốt để đọc.
     * recipe: true (trang mở bằng link có công thức, hay người xem dán link khác) = mở thanh lớp theo công thức: KHÔNG mài lớp nào,
     * chỉ hiện dòng tóm tắt "Công thức trong link" (spec §21.2). Mài thì dòng đó ẩn: người xem đang bắt đầu lại từ đầu.
     * @param {{ grind?: boolean, recipe?: boolean }} [options]
     */
    open({ grind = false, recipe = false } = {}) {
      rail.el.hidden = false;
      if (recipe) panel?.show();
      if (grind) {
        panel?.hide();
        if (interactive) for (const { id } of rest) studio()?.setWeight(id, 0, { tween: true });
        openLayer(meta.layers[0].id, { tab: 'hieu' });
      }
      sync();
      if (interactive && !frame) loop();
    },
    close,
    /** Thanh lớp đang mở không. Dựng lại cảnh xong mà thanh lớp đang đóng thì run.js mời lại (poster đã xóa lời mời). */
    get isOpen() {
      return !rail.el.hidden;
    },
    /** Sổ tay đang mở lớp nào (null nếu đóng): test và e2e đọc. */
    get layer() {
      return notebook.layer;
    },
    dispose() {
      stop();
      notebook.dispose();
      rail.el.remove();
    },
  };
}
