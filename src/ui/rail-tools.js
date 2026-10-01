// ui/rail-tools.js — mục "Đồ nghề" trong thanh lớp: nút aria-pressed của từng công cụ học, và thanh trượt của các Dial.
import { h } from './dom.js';
import { createDials } from './dials.js';

/**
 * Chỉ có khi cảnh 3D đang chạy (tầng tĩnh không có Đồ nghề hay thanh giờ: cả hai cần cảnh). Mọi thay đổi đi qua bàn thợ:
 * studio().setTool(id | null), studio().setDial(id, v). Mỗi lúc chỉ một công cụ bật: bấm lại nút đang bật thì tắt.
 * Điện thoại: dải thanh lớp chỉ có nút công cụ và một nút nhỏ ghi giá trị của Dial ("◷ 21:00"); chạm vào thì ô trượt
 * mở ra ngay trên dải (CSS đặt ô đó theo khung nhìn).
 * @param {Document} doc
 * @param {{ t: Record<string, any>, content?: object | null, studio: () => any }} p
 */
export function createRailTools(doc, { t, content = null, studio }) {
  const s = studio();
  const buttons = s.tools().map(({ id }) => {
    const button = h(doc, 'button', { type: 'button', 'data-tool': id, 'aria-pressed': 'false', text: t.tools[id]?.name ?? id });
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') === 'true';
      studio()?.setTool(on ? null : id);
    });
    return button;
  });
  const dialList = s.dials();
  const dials = createDials(doc, { dials: dialList, content, onChange: (id, v) => studio()?.setDial(id, v) });
  const panel = h(doc, 'div', { class: 'rail-dials', id: 'rail-dials' }, dials.el);
  const chip = dialList.length > 0
    ? h(doc, 'button', { type: 'button', class: 'dial-chip', 'aria-expanded': 'false', 'aria-controls': 'rail-dials' })
    : null;
  chip?.addEventListener('click', () => {
    const open = chip.getAttribute('aria-expanded') !== 'true';
    chip.setAttribute('aria-expanded', String(open));
    panel.toggleAttribute('data-open', open);
  });
  const el = h(doc, 'section', { class: 'rail-tools', 'aria-labelledby': 'rail-tools-title' },
    h(doc, 'h2', { id: 'rail-tools-title', class: 'rail-title', text: t.rail.tools }),
    h(doc, 'div', { class: 'rail-tool-list' }, buttons),
    chip,
    dialList.length > 0 ? panel : null);

  return {
    el,
    /** Vẽ lại theo bàn thợ (workshop gọi mỗi nhịp khi thanh lớp mở): nút công cụ, giá trị và ghi chú của Dial. */
    sync() {
      const now = studio();
      if (!now) return;
      const on = new Map(now.tools().map((x) => [x.id, x.on]));
      for (const b of buttons) b.setAttribute('aria-pressed', String(Boolean(on.get(b.dataset.tool))));
      const list = now.dials();
      dials.update(list);
      if (chip && list[0]) {
        const label = content?.dials?.[list[0].id]?.label ?? list[0].id;
        chip.textContent = `◷ ${list[0].text}`;
        chip.setAttribute('aria-label', `${label}: ${list[0].text}`);
      }
    },
  };
}
