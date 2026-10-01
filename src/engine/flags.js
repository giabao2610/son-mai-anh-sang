// engine/flags.js — đọc cờ URL (?static, ?webgl, ?force3d, ?debug, ?at, ?freeze, ?poster, ?level) thành một object thuần.
// Ba mức lấy từ quality.js: từ GĐ 4 file đó chỉ còn chọn mức (bộ điều chỉnh ở tuner.js), nên đường nhẹ import được.
import { LEVELS } from './quality.js';

// ?at chỉ nhận dạng ISO 8601: "2026-09-28T21:00", có thể thêm ":ss" và một offset ("Z", "+07:00", "-05:00").
// Dạng khác (ví dụ "09/28/2026") bị V8 đọc theo múi giờ của MÁY, nên bị loại: ?at phải cho cùng kết quả ở mọi nơi.
const AT = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})?$/;
const OFF = ['0', 'false'];

/**
 * Đọc giá trị của ?at thành Date.
 * Không ghi offset → hiểu là giờ Việt Nam (+07:00), bất kể múi giờ của máy đang chạy.
 * @param {string | null | undefined} value  giá trị đã được URLSearchParams giải mã
 * @returns {Date | null}  null khi giá trị hỏng (xưởng sẽ dùng giờ thật)
 */
export function parseAt(value) {
  if (typeof value !== 'string') return null;
  // Trong query string, '+' bị giải mã thành khoảng trắng: "21:00+07:00" tới đây là "21:00 07:00". Đổi lại trước.
  const m = AT.exec(value.replaceAll(' ', '+'));
  if (!m) return null;
  const date = new Date(m[1] + (m[2] ?? '+07:00'));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Đọc mọi cờ của trang. Query string là "môi trường" (tầng, đồng hồ, chế độ thợ); hash để dành cho trạng thái tác phẩm.
 * Cờ bật khi có mặt: ?webgl hay ?webgl=1 đều bật; ?webgl=0 hoặc ?webgl=false thì tắt.
 * @param {string} [search]  location.search, ví dụ '?webgl&at=2026-09-28T21:00'
 * @returns {{ static: boolean, webgl: boolean, force3d: boolean, debug: false | true | 'stats',
 *   at: Date | null, freeze: false | true | number, poster: boolean, level: 'cao' | 'vua' | 'thap' | null }}
 */
export function readFlags(search = '') {
  const q = new URLSearchParams(search);
  const on = (name) => q.has(name) && !OFF.includes(q.get(name));

  const debug = on('debug') ? (q.get('debug') === 'stats' ? 'stats' : true) : false;

  // ?freeze = đồng hồ tất định (mỗi khung đúng 1/60 s). ?freeze=N còn dừng vòng vẽ sau khung N để so ảnh.
  const n = q.get('freeze');
  const freeze = on('freeze') ? (/^\d+$/.test(n) && Number(n) > 0 ? Number(n) : true) : false;

  const at = parseAt(q.get('at'));
  if (debug && q.has('at') && at === null) {
    console.warn(`?at="${q.get('at')}" không hợp lệ nên dùng giờ thật. Ví dụ đúng: ?at=2026-09-28T21:00`);
  }

  // ?level=thap: ép mức chất lượng thay cho bảng tầng × máy (xem mức thấp ngay trên máy tính; e2e dùng).
  const level = LEVELS.includes(q.get('level')) ? q.get('level') : null;
  if (debug && q.has('level') && level === null) {
    console.warn(`?level="${q.get('level')}" không hợp lệ nên bỏ qua. Dùng một trong: ${LEVELS.join(', ')}`);
  }

  return { static: on('static'), webgl: on('webgl'), force3d: on('force3d'), debug, at, freeze, poster: on('poster'), level };
}
