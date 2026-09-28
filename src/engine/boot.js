// engine/boot.js — khởi động một bức: cờ URL → dò tầng → tranh tĩnh, hoặc tải phần 3D (import động) trong hạn 10 giây
import { readFlags } from './flags.js';
import { detectTier, envFromWindow } from './tier.js';
import { withDeadline, DeadlineError } from './deadline.js';
import { createSma } from './sma.js';
import { showStatic, isChunkError } from './static.js';
import { mountShell } from '../ui/shell.js';

/** Hạn cho cả phần 3D: tải chunk, dựng cảnh, biên dịch shader, vẽ khung ẩn. Quá hạn thì về tranh tĩnh. */
const BOOT_DEADLINE_MS = 10_000;

/**
 * Cửa vào của mọi trang: script inline trong HTML gọi `boot(entry, { lang: 'vi', t })`.
 *
 * File này nằm trên "đường nhẹ": không import three, không import bức nào. Phần nặng (three + các lớp)
 * chỉ được tải bằng import() động khi máy có GPU dùng được, nên poster luôn hiện ngay, kể cả trên máy yếu.
 * `win`, `doc`, `loadRun` là chỗ để test tiêm đồ giả; trang thật dùng mặc định.
 * @param {{ meta: object, load: () => Promise<object> }} entry  PaintingEntry từ paintings/<slug>/index.js
 * @param {{ lang?: string, t: Record<string, any>, win?: any, doc?: Document, loadRun?: () => Promise<{ run: Function }> }} [opts]
 */
export async function boot(entry, { lang = 'vi', t, win = window, doc = document, loadRun = () => import('./gpu/run.js') } = {}) {
  const flags = readFlags(win.location.search);
  const now = flags.at ?? new Date(); // cố định lúc khởi động: con dấu và pha trăng cùng một "bây giờ"
  const sma = createSma(win);
  const shell = mountShell(doc, entry.meta, { now, t, onState: (state) => sma.set({ state }) });
  shell.setState('detecting');

  // Dò tầng không bao giờ được làm trắng trang: lỗi bất ngờ, kể cả lúc đọc window, đều về tầng tĩnh.
  let tier = 'static';
  try {
    tier = await detectTier(flags, envFromWindow(win));
  } catch {
    // giữ 'static'
  }
  sma.set({ tier });
  const debug = !!flags.debug;
  if (tier === 'static') {
    showStatic(entry, shell, { reason: flags.static ? 'flag' : 'no-gpu', debug, t, sma });
    return;
  }

  shell.setState('loading');
  const onFail = (reason, error) => showStatic(entry, shell, { reason, error, debug, t, sma });

  // Quá hạn thì run() vẫn có thể chạy nốt (máy yếu biên dịch shader lâu). Vỏ trang đưa cho run bị "khóa"
  // từ lúc đó, để phần 3D đến muộn không kéo được poster đi hay đổi data-state; onLate sẽ gỡ nó.
  let late = false;
  const unlessLate = (fn) => (...args) => (late ? undefined : fn(...args));
  const runShell = {
    stageEl: shell.stageEl,
    setState: unlessLate(shell.setState),
    crossfade: (canvas) => (late ? Promise.resolve() : shell.crossfade(canvas)),
    showBadge: unlessLate(shell.showBadge),
    showNote: unlessLate(shell.showNote),
    showHint: unlessLate(shell.showHint),
    invite: unlessLate(shell.invite),
  };

  try {
    await withDeadline(
      loadRun().then(({ run }) => run(entry, runShell, { tier, flags, now, lang, t, sma, onFail })),
      BOOT_DEADLINE_MS,
      { onLate: (handle) => handle?.dispose?.() },
    );
  } catch (err) {
    late = true;
    const reason = err instanceof DeadlineError ? 'timeout' : isChunkError(err) ? 'chunk-load' : 'error';
    showStatic(entry, shell, { reason, error: err, debug, t, sma });
  }
}
