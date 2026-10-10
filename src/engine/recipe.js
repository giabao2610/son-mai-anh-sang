// engine/recipe.js — công thức của tác phẩm trong hash (#r=…): đọc và ghi chuỗi khóa:giá trị (hàm thuần, đường nhẹ, không three).

/** Hash của công thức bắt đầu bằng chuỗi này (spec §8.7, §21.2). */
export const RECIPE_PREFIX = '#r=';
/** Trần độ dài (sau khi giải mã): Bức 1 chỉnh hết mọi núm chưa tới 1.500 ký tự (spec §21.10). */
export const MAX_RECIPE = 2048;
/** Khóa: id lớp (kebab), hay id lớp + '.' + id núm (camelCase), hay id Dial (kebab). */
const KEY = /^[a-z0-9-]+(\.[A-Za-z][A-Za-z0-9]*)?$/;
/** Giá trị: số, 1/0, id lựa chọn, màu hex: không có dấu phẩy, hai chấm, '#'. */
const VALUE = /^[A-Za-z0-9.+-]+$/;
/** Phần người dùng gõ trong một dòng cảnh báo (mục hỏng) dài tối đa chừng này ký tự. */
const MAX_SHOWN = 60;

/**
 * Cắt phần người dùng gõ (một mục `khóa:giá trị` hỏng) cho dòng cảnh báo: link có thể dài 2.048 ký tự. Lý do của xưởng thì không bao giờ cắt.
 * @param {string} text
 */
export const clipEntry = (text) => (text.length > MAX_SHOWN ? `${text.slice(0, MAX_SHOWN)}…` : text);

/**
 * Đọc công thức từ location.hash. Mục sai dạng vào `problems` (người gọi cảnh báo MỘT dòng); khóa lặp thì mục sau thắng. Không biết bức
 * nào: phân loại khóa (trọng số, núm, Dial) làm ở engine/gpu/recipe-set.js.
 * @param {string | undefined} hash  ví dụ '#r=suong:0,gio:23'
 * @returns {{ entries: { key: string, value: string }[], problems: string[] } | null}  null: hash không phải công thức
 */
export function readRecipe(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(RECIPE_PREFIX)) return null;
  let text;
  try {
    text = decodeURIComponent(hash.slice(RECIPE_PREFIX.length));
  } catch {
    return { entries: [], problems: [`không giải mã được "${hash.slice(0, 40)}"`] };
  }
  if (text.length > MAX_RECIPE) return { entries: [], problems: [`dài ${text.length} ký tự, quá ${MAX_RECIPE}`] };
  const problems = [];
  const byKey = new Map();
  for (const part of text.split(',')) {
    if (part === '') continue;
    const colon = part.indexOf(':');
    const key = colon < 0 ? part : part.slice(0, colon);
    const value = colon < 0 ? '' : part.slice(colon + 1);
    if (!KEY.test(key) || !VALUE.test(value)) {
      problems.push(clipEntry(part));
      continue;
    }
    byKey.delete(key); // khóa lặp: mục sau thắng, đứng ở chỗ của mục sau
    byKey.set(key, value);
  }
  return { entries: [...byKey].map(([key, value]) => ({ key, value })), problems };
}

/**
 * Ghi các mục thành chuỗi (không có '#r='), đúng thứ tự đưa vào.
 * @param {{ key: string, value: string }[]} entries
 */
export function writeRecipe(entries) {
  return entries.map(({ key, value }) => `${key}:${value}`).join(',');
}

/**
 * Số chữ số thập phân của step (0.001 → 3, 0.25 → 2, 1 → 0), tối đa 4; không có step thì 4.
 * @param {number | undefined} step
 */
export function stepDecimals(step) {
  if (!Number.isFinite(step) || step <= 0) return 4;
  for (let d = 0; d < 4; d += 1) {
    const scaled = step * 10 ** d;
    if (Math.abs(Math.round(scaled) - scaled) < 1e-9) return d;
  }
  return 4;
}

/**
 * Giá trị thành chữ của công thức (spec §21.2): số ghi ngắn nhất theo số chữ số thập phân, bool 1/0, select là id, màu 6 chữ số hex
 * không '#'.
 * @param {'number' | 'bool' | 'select' | 'color'} kind
 * @param {any} value
 * @param {number} [decimals]
 */
export function formatValue(kind, value, decimals = 4) {
  if (kind === 'bool') return value ? '1' : '0';
  if (kind === 'select') return String(value);
  if (kind === 'color') return String(value).replace(/^#/, '').toLowerCase();
  return String(Number(Number(value).toFixed(Math.min(decimals, 4)))); // bỏ số 0 thừa; '-0' thành '0'
}
