// tests/helpers/svg.js — đọc mã màu hex trong một SVG (poster, sơ đồ của Sổ tay) để so với bảng màu sơn mài.

/**
 * Mã màu hex trong một SVG, viết hoa. Bỏ các tham chiếu id trước (url(#bed), href="#bed"): id như "bed", "face"
 * trông giống mã màu 3 chữ số hex nhưng không phải màu.
 * @param {string} svg
 * @returns {Set<string>}
 */
export function svgColors(svg) {
  const text = svg.replace(/url\(#[^)]*\)/g, '').replace(/href="#[^"]*"/g, '');
  return new Set((text.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).map((h) => h.toUpperCase()));
}
