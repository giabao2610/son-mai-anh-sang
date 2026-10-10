// engine/gpu/recipe-url.js — thanh địa chỉ mang công thức (GĐ 9): ghi #r=… bằng history.replaceState (gộp 500 ms), và áp công thức khi người xem đổi hash.
import { RECIPE_PREFIX } from '../recipe.js';

/** Gộp các lần đổi trong chừng này ms: WebKit ném SecurityError khi replaceState quá 100 lần trong 30 giây; 500 ms là tối đa 60 lần. */
export const WRITE_MS = 500;

/**
 * run.js gắn khi cảnh live, gỡ bằng disposer; "Dựng lại cảnh" gắn lại với bàn thợ mới (spec §21.4).
 * replaceState không phát 'hashchange', nên chỉ thay đổi của người xem (dán link khác, sửa tay, Back/Forward) tới onHash.
 * @param {object} p
 * @param {Window} p.win
 * @param {{ recipe: () => { text: string }, onChange: (cb: () => void) => () => void, applyRecipe: (text: string) => Promise<any>,
 *   reset: () => Promise<void> }} p.studio   bàn thợ của cảnh này
 * @param {() => void} p.onApplied   người xem đổi hash và công thức đã áp: mở xưởng với dòng tóm tắt
 * @returns {() => void}  gỡ
 */
export function syncRecipeUrl({ win, studio, onApplied }) {
  const fromHash = (hash) => (hash.startsWith(RECIPE_PREFIX) ? hash.slice(RECIPE_PREFIX.length) : '');
  let written = fromHash(win.location.hash); // chuỗi đang nằm trên thanh địa chỉ
  let timer = null;
  let broken = false;
  let disposed = false;

  const write = () => {
    timer = null;
    if (broken) return;
    const { text } = studio.recipe();
    if (text === written) return;
    const { pathname, search } = win.location;
    try {
      // Giữ query string của trang đang mở (cờ của người xem); không thêm mục vào lịch sử.
      win.history.replaceState(win.history.state, '', pathname + search + (text ? RECIPE_PREFIX + text : ''));
      written = text;
    } catch (err) {
      broken = true; // WebKit: quá 100 lần trong 30 giây. Thôi ghi cho phiên này; nút chép link vẫn chạy.
      console.warn('Không ghi được công thức lên thanh địa chỉ; nút "Chép link công thức" vẫn dùng được.', err);
    }
  };
  const schedule = () => {
    timer ??= win.setTimeout(write, WRITE_MS);
  };
  const flush = () => {
    if (timer === null) return;
    win.clearTimeout(timer);
    write();
  };
  const onHash = async () => {
    const { hash } = win.location;
    if (hash === '' || hash === '#') {
      written = '';
      await studio.reset();
      return;
    }
    if (!hash.startsWith(RECIPE_PREFIX)) return; // hash khác dạng: không phải của xưởng
    written = fromHash(hash);
    await studio.applyRecipe(written);
    if (!disposed) onApplied(); // gỡ giữa lúc áp (mất GPU): không mở xưởng của cảnh đã gỡ
  };
  const onHide = () => flush();
  const onVisibility = () => {
    if (win.document?.visibilityState === 'hidden') flush();
  };

  const off = studio.onChange(schedule);
  win.addEventListener('hashchange', onHash);
  win.addEventListener('pagehide', onHide);
  win.document?.addEventListener('visibilitychange', onVisibility);
  schedule(); // hash lúc mở trang chưa ở dạng chuẩn (mục hỏng, số chưa làm tròn): ghi lại dạng chuẩn
  return () => {
    disposed = true;
    off();
    win.clearTimeout(timer);
    timer = null;
    win.removeEventListener('hashchange', onHash);
    win.removeEventListener('pagehide', onHide);
    win.document?.removeEventListener('visibilitychange', onVisibility);
  };
}
