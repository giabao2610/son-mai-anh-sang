// ui/badge.js — huy hiệu tầng: WebGPU / WebGL2 / Tranh tĩnh kèm mức chất lượng và số nấc đang hạ; data-backend, data-steps, data-locked cho test đọc

/**
 * Vẽ huy hiệu vào nút [data-badge]. Huy hiệu ghi backend THẬT (run.js đọc sau renderer.init()),
 * vì three có thể lặng lẽ lùi từ WebGPU về WebGL2. `data-backend` là thứ e2e kiểm; chữ hiển thị
 * thì có thể đổi theo ngôn ngữ nên test không dựa vào chữ.
 * Bộ điều chỉnh đang hạ nấc (GĐ 3) thì ghi thêm "hạ {n} nấc", và lời giải thích nói máy đang bớt chi tiết để giữ nhịp.
 * GĐ 4: có nấc bị khóa chống dao động thì lời giải thích nói thật là nấc đó giữ tới khi tải lại trang (không hứa trở lại).
 * @param {HTMLElement} el
 * @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: 'cao' | 'vua' | 'thap' | null, steps?: number, locked?: number }} info
 * @param {Record<string, any>} t  chữ giao diện của trang (strings.<lang>.js)
 */
export function renderBadge(el, { tier, level, steps = 0, locked = 0 }, t) {
  const held = steps > 0 ? Math.min(locked, steps) : 0; // nấc bị khóa mà đang hạ
  const text = t.tierName[tier] + (level ? ` · ${t.levelName[level]}` : '') + (steps > 0 ? ` · ${t.badge.steps(steps)}` : '');
  let explain = t.badge.explain[tier];
  if (held > 0) explain += ` ${t.badge.lockedExplain(steps, held)}`;
  else if (steps > 0) explain += ` ${t.badge.stepsExplain(steps)}`;
  el.dataset.backend = tier;
  el.dataset.steps = String(steps);
  el.dataset.locked = String(held);
  el.textContent = text;
  el.title = explain; // chuột: rê vào là thấy; chạm: shell.js mở ô giải thích
  el.setAttribute('aria-label', `${text}. ${explain}`);
  el.hidden = false;
}
