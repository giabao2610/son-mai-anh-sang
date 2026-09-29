// engine/static.js — tầng C (tranh tĩnh) theo lý do: poster, thơ, con dấu, lời giải thích đúng lý do, và Sổ tay chỉ đọc

/**
 * Lỗi "không tải được chunk". Hay gặp nhất ngay sau một lần deploy: HTML cũ còn trong cache trỏ tới
 * chunk mang hash cũ, mà chunk đó đã bị xóa. Mỗi trình duyệt báo một câu khác nhau, nên so cả bốn mẫu
 * (Chrome, Safari, Firefox, và lỗi preload của Vite).
 */
const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported|Unable to preload/i;

/** Những lý do có lời riêng. Mọi lý do khác là "lỗi": dùng chung một câu, kèm gợi ý ?debug. */
const NAMED_REASONS = ['flag', 'no-gpu', 'chunk-load', 'timeout'];

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
  // Quá hạn 10 giây thường là mạng chậm hoặc máy đang bận: tải lại hay được, nên có nút.
  if (reason === 'timeout') return { text: t.static.timeout, reload: true };
  return { text: t.static.error, reload: false };
}

/** message + stack cho ?debug. V8 (Chrome) ghi message ở dòng đầu của stack; Firefox và Safari thì không. */
function errorDetail(error) {
  if (error == null) return null;
  const message = String(error.message ?? error);
  const stack = typeof error.stack === 'string' ? error.stack : '';
  return stack.includes(message) ? stack : [message, stack].filter(Boolean).join('\n');
}

/** Sổ tay chỉ đọc đã mở cho vỏ trang nào (mở lại thì dùng lại, không dựng thêm một thanh lớp nữa). */
const readers = new WeakMap();

/**
 * Sổ tay chỉ đọc (GĐ 2): tải ui/workshop.js và chữ của bức bằng import() động. Cả hai đều không kéo three,
 * nên tầng tĩnh vẫn không tải chunk three (e2e kiểm). Không có bàn thợ (studio), nên chỉ có chữ, sơ đồ và code.
 * @param {object} entry
 * @param {object} shell
 * @param {Record<string, any>} t
 * @param {() => Promise<{ mountWorkshop: Function }>} loadWorkshop
 */
function openReader(entry, shell, t, loadWorkshop) {
  if (!readers.has(shell)) {
    const loadContent = entry.content?.[t.lang];
    readers.set(shell, Promise.all([
      loadWorkshop(),
      // Chữ tải hỏng thì Sổ tay vẫn mở (báo thiếu chữ), như ở tầng 3D.
      loadContent ? loadContent().then((m) => m.default, (err) => {
        console.warn(`Không tải được chữ của bức (${t.lang}):`, err);
        return null;
      }) : null,
    ]).then(([{ mountWorkshop }, content]) => mountWorkshop(shell.stageEl.ownerDocument, { meta: entry.meta, content, t })));
  }
  readers.get(shell).then((workshop) => workshop.open({ grind: true }), (err) => {
    readers.delete(shell); // lần bấm sau thử tải lại
    console.warn('Không mở được Sổ tay:', err);
    // Chunk hỏng thường là trang vừa được cập nhật: nút "Xem các lớp" không làm được gì nữa, nên mời tải lại.
    if (isChunkError(err)) shell.showNote(staticNote('chunk-load', t));
  });
}

/**
 * Về tầng C. Poster, thơ và con dấu vốn là HTML tĩnh của trang; ở đây chỉ đổi trạng thái, huy hiệu,
 * lời giải thích, và nút mở Sổ tay chỉ đọc. Gọi nhiều lần vẫn an toàn: cùng lý do thì bỏ qua, lý do khác thì cập nhật.
 * @param {object} entry  PaintingEntry của bức (Sổ tay chỉ đọc dùng meta và content)
 * @param {object} shell  vỏ trang từ ui/shell.js#mountShell
 * @param {{ reason: string, error?: any, debug?: boolean, t: Record<string, any>, sma: object,
 *           loadWorkshop?: () => Promise<{ mountWorkshop: Function }> }} opts   loadWorkshop: test thay bộ nạp Sổ tay
 */
export function showStatic(entry, shell, { reason, error = null, debug = false, t, sma, loadWorkshop = () => import('../ui/workshop.js') }) {
  if (sma.state === 'static' && sma.reason === reason) return;
  if (error) console.error(`Về tranh tĩnh (${reason}):`, error);
  sma.set({ reason, error: error ? String(error.message ?? error) : null });
  shell.setState('static');
  shell.showBadge({ tier: 'static' });
  const note = staticNote(reason, t);
  // Người xem thường không có ?debug: với lý do lỗi, chỉ cho họ cách xem chi tiết.
  const hint = !debug && !NAMED_REASONS.includes(reason);
  const text = hint ? `${note.text} ${t.static.debugHint}` : note.text;
  // Trang vừa được cập nhật (chunk-load) thì chunk của Sổ tay cũng hỏng: chỉ mời tải lại.
  const action = reason === 'chunk-load'
    ? undefined
    : { label: t.notebook.openStatic(entry.meta.layers.length), run: () => openReader(entry, shell, t, loadWorkshop) };
  shell.showNote({ text, reload: note.reload, action }, debug ? errorDetail(error) : null);
}
