// engine/gpu/recipe-url.js — thanh địa chỉ mang công thức (GĐ 9): ghi #r=… bằng history.replaceState (gộp 500 ms), và áp công thức khi người xem đổi hash.
import { RECIPE_PREFIX } from '../recipe.js';

/** Gộp các lần đổi trong chừng này ms: WebKit ném SecurityError khi replaceState quá 100 lần trong 30 giây; 500 ms là tối đa 60 lần. */
export const WRITE_MS = 500;

/**
 * run.js gắn khi cảnh live, gỡ bằng disposer; "Dựng lại cảnh" gắn lại với bàn thợ mới (spec §21.4).
 * replaceState không phát 'hashchange', nên chỉ thay đổi của người xem (dán link khác, sửa tay, Back/Forward) tới onHash.
 * @param {object} p
 * @param {Window} p.win
 * @param {{ recipe: () => { text: string }, onChange: (cb: () => void) => () => void,
 *   applyRecipe: (text: string) => Promise<{ applied?: boolean } | void>, reset: () => Promise<void> }} p.studio   bàn thợ của cảnh này
 * @param {() => void} p.onApplied   người xem đổi hash và công thức đã áp: mở xưởng với dòng tóm tắt
 * @returns {() => void}  gỡ
 */
export function syncRecipeUrl({ win, studio, onApplied }) {
  const fromHash = (hash) => (hash.startsWith(RECIPE_PREFIX) ? hash.slice(RECIPE_PREFIX.length) : '');
  let written = fromHash(win.location.hash); // chuỗi đang nằm trên thanh địa chỉ
  let timer = null;
  let broken = false;
  let disposed = false;
  // Các lần áp hash của người xem nối đuôi nhau (Back rồi Forward thật nhanh): lần sau chỉ bắt đầu khi restore() của lần trước xong, nên
  // hai lần không bao giờ đan vào nhau. `waiting` > 0: còn lần áp đang chạy hay đang chờ, recipe().text chưa phải của hash cuối: không ghi.
  let queue = Promise.resolve();
  let waiting = 0;

  const write = () => {
    timer = null;
    if (broken || waiting > 0) return;
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
  /** Áp MỘT hash (đã tới lượt trong hàng). Gỡ rồi (mất GPU) thì thôi: bàn thợ đã gỡ, không mở xưởng của cảnh đã gỡ. */
  const apply = async (hash) => {
    if (disposed) return;
    if (hash === '' || hash === '#') {
      await studio.reset();
      return;
    }
    const result = await studio.applyRecipe(fromHash(hash));
    // Link hỏng hoàn toàn: cảnh giữ nguyên (applyRecipe đã cảnh báo), không mở xưởng; lần ghi sau đưa thanh địa chỉ về công thức của cảnh.
    if (!disposed && result?.applied !== false) onApplied();
  };
  const onHash = () => {
    const { hash } = win.location;
    const isReset = hash === '' || hash === '#';
    if (!isReset && !hash.startsWith(RECIPE_PREFIX)) return queue; // hash khác dạng: không phải của xưởng
    // Hủy lần ghi đang hẹn và chặn ghi tới khi áp xong: restore chờ núm và vẽ lại, nên recipe().text còn là chuỗi CŨ hay dở dang;
    // ghi lúc đó sẽ đè lên hash vừa dán (kể cả mục Back/Forward).
    win.clearTimeout(timer);
    timer = null;
    waiting += 1;
    written = isReset ? '' : fromHash(hash); // chuỗi đang nằm trên thanh địa chỉ, ngay lúc này
    queue = queue
      .then(() => apply(hash))
      .catch((err) => console.error('Công thức: áp hash mới hay mở xưởng sau đó không được:', err))
      .finally(() => {
        waiting -= 1;
        if (waiting === 0 && !disposed) schedule(); // MỘT lần ghi dạng chuẩn (số làm tròn, mục hỏng bỏ), sau lần áp cuối
      });
    return queue;
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
