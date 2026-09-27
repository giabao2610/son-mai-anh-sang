// engine/palette.js — Bảng màu sơn mài (10 token của chất liệu) và phép ghép màu riêng của từng bức.

/**
 * 10 màu của chất liệu sơn mài, dùng chung cho CSS và TSL.
 * - CSS: styles/tokens.css khai báo đúng các màu này dưới dạng biến (test giữ cho hai nơi khớp nhau).
 * - TSL: lớp đọc bảng ĐÃ GHÉP qua ctx.palette, không import file này.
 * Tên token là tên chất liệu (thuộc về xưởng), không phải tên chủ đề của một bức.
 */
export const PALETTE = Object.freeze({
  denThen: '#0E0A08', // đen then: nền sơn
  canhGian: '#3B1F14', // nâu cánh gián
  doSon: '#B3261E', // đỏ son
  vangLa: '#D4A94A', // vàng lá
  vangLaSang: '#F2D48A', // vàng lá sáng
  bacLa: '#C9C6BD', // bạc lá
  nga: '#EDE3CF', // ngà vỏ trứng
  cham: '#1B2A4A', // chàm
  xanhLuc: '#2E4A3A', // xanh lục (màu lá)
  datSet: '#8A8580', // đất sét: màu của cốt khi mài hết mọi lớp
});

const HEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Ghép bảng riêng của một bức (meta.palette) lên bảng chung: thêm token mới hoặc ghi đè token cũ.
 * Kiểm màu ngay lúc ghép, để lỗi gõ sai hiện ra khi khởi động chứ không thành một màu đen lạ trong shader.
 * @param {Record<string, string>} [overrides]  ví dụ { diep: '#EFE6D2' }
 * @returns {Readonly<Record<string, string>>}  bảng đã ghép, đóng băng
 */
export function mergePalette(overrides = {}) {
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (typeof value !== 'string' || !HEX.test(value)) {
      throw new Error(`Màu "${key}" không hợp lệ: ${value}`);
    }
  }
  return Object.freeze({ ...PALETTE, ...overrides });
}

/**
 * Tên biến CSS của một token: camelCase → kebab-case có tiền tố `--`.
 * Ví dụ 'denThen' → '--den-then', 'canhGian' → '--canh-gian'.
 * @param {string} token
 * @returns {string}
 */
export function cssVarName(token) {
  return `--${token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
}
