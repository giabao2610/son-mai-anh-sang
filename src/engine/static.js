// engine/static.js — tầng C (tranh tĩnh) theo lý do: poster, thơ, con dấu, cộng lời giải thích đúng lý do

/**
 * Lỗi "không tải được chunk". Hay gặp nhất ngay sau một lần deploy: HTML cũ còn trong cache trỏ tới
 * chunk mang hash cũ, mà chunk đó đã bị xóa. Mỗi trình duyệt báo một câu khác nhau, nên so cả bốn mẫu
 * (Chrome, Safari, Firefox, và lỗi preload của Vite).
 */
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload/i;

/** Những lý do có lời riêng. Mọi lý do khác là "lỗi": dùng chung một câu, kèm gợi ý ?debug. */
const NAMED_REASONS = ['flag', 'no-gpu', 'chunk-load'];

/** @param {unknown} err */
export function isChunkError(err) {
  return CHUNK_ERROR.test(String(err?.message ?? err));
}

/**
 * Lời giải thích cho từng lý do về tầng tĩnh.
 * @param {string} reason  'flag' | 'no-gpu' | 'chunk-load' | 'timeout' | 'frame-errors' | 'gpu-error' | 'device-lost' | 'error'
 * @param {Record<string, any>} t
 * @returns {{ text: string | null, reload: boolean }}
 */
export function staticNote(reason, t) {
  if (reason === 'flag') return { text: null, reload: false }; // người xem tự chọn ?static: không cần giải thích
  if (reason === 'no-gpu') return { text: t.static.noGpu, reload: false };
  if (reason === 'chunk-load') return { text: t.static.chunkLoad, reload: true };
  return { text: t.static.error, reload: false };
}

/** message + stack cho ?debug. V8 (Chrome) ghi message ở dòng đầu của stack; Firefox và Safari thì không. */
function errorDetail(error) {
  if (error == null) return null;
  const message = String(error.message ?? error);
  const stack = typeof error.stack === 'string' ? error.stack : '';
  return stack.includes(message) ? stack : [message, stack].filter(Boolean).join('\n');
}

/**
 * Về tầng C. Poster, thơ và con dấu vốn là HTML tĩnh của trang; ở đây chỉ đổi trạng thái, huy hiệu
 * và lời giải thích. Gọi nhiều lần vẫn an toàn: cùng lý do thì bỏ qua, lý do khác thì cập nhật.
 * @param {object} entry  PaintingEntry của bức (GĐ 2 dùng cho Sổ tay chỉ đọc)
 * @param {object} shell  vỏ trang từ ui/shell.js#mountShell
 * @param {{ reason: string, error?: any, debug?: boolean, t: Record<string, any>, sma: object }} opts
 */
export function showStatic(entry, shell, { reason, error = null, debug = false, t, sma }) {
  if (sma.state === 'static' && sma.reason === reason) return;
  if (error) console.error(`Về tranh tĩnh (${reason}):`, error);
  sma.set({ reason, error: error ? String(error.message ?? error) : null });
  shell.setState('static');
  shell.showBadge({ tier: 'static' });
  const note = staticNote(reason, t);
  // Người xem thường không có ?debug: với lý do lỗi, chỉ cho họ cách xem chi tiết.
  const hint = !debug && !NAMED_REASONS.includes(reason);
  const text = hint ? `${note.text} ${t.static.debugHint}` : note.text;
  shell.showNote({ text, reload: note.reload }, debug ? errorDetail(error) : null);
}
