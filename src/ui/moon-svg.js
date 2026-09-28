// ui/moon-svg.js — vẽ trăng đúng pha vào <svg data-moon> của trang (tầng nào cũng có); chỉ DOM + toán, không three.

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;

/**
 * Đường viền phần SÁNG của đĩa trăng bán kính 1, tâm (0, 0), trục y hướng XUỐNG như SVG.
 * phase theo lib/astro/moon.js: 0 trăng mới → π trăng tròn → 2π.
 *
 * Phần sáng = nửa vòng tròn phía có nắng (trăng đang lên sáng bên PHẢI, trăng đang tàn sáng bên TRÁI)
 * ghép với đường ranh sáng/tối: nửa elip có bán trục ngang |cos(phase)|. Trăng khuyết (sáng < nửa)
 * thì đường ranh lồi về phía sáng; trăng gần tròn (sáng > nửa) thì lồi về phía tối.
 * Trong SVG, cờ sweep = 1 là đi theo chiều kim đồng hồ trên màn hình.
 * @param {number} phase
 * @returns {string}  thuộc tính d của <path>
 */
export function moonPath(phase) {
  const p = ((phase % TAU) + TAU) % TAU;
  const waxing = p < Math.PI;
  const gibbous = Math.cos(p) < 0;
  const rx = Math.abs(Math.cos(p)).toFixed(4);
  const outer = waxing ? 1 : 0; // trên → phải → dưới (1) hoặc trên → trái → dưới (0)
  const inner = waxing !== gibbous ? 0 : 1; // từ dưới quay về trên, qua phía nào
  return `M0 -1A1 1 0 0 ${outer} 0 1A${rx} 1 0 0 ${inner} 0 -1Z`;
}

/**
 * Điền <svg data-moon>: một đĩa tối (cả vầng trăng) và phần sáng đúng pha phủ lên trên.
 * Gọi lại thì thay hẳn nội dung cũ. Màu do CSS quyết (.moon-dark, .moon-lit).
 * @param {SVGSVGElement} svg
 * @param {number} phase
 */
export function drawMoon(svg, phase) {
  const doc = svg.ownerDocument;
  const disc = doc.createElementNS(NS, 'circle');
  disc.setAttribute('r', '1');
  disc.setAttribute('class', 'moon-dark');
  const lit = doc.createElementNS(NS, 'path');
  lit.setAttribute('d', moonPath(phase));
  lit.setAttribute('class', 'moon-lit');
  svg.replaceChildren(disc, lit);
}
