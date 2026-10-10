// tests/unit/recipe-url.test.js — thanh địa chỉ mang công thức: ghi gộp 500 ms bằng replaceState, áp công thức khi hash đổi, ghi nốt lúc rời trang.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncRecipeUrl, WRITE_MS } from '../../src/engine/gpu/recipe-url.js';

/** Cửa sổ giả: EventTarget có location, history.replaceState (đổi location.hash như trình duyệt), timer thật của vitest, document. */
function fakeWindow(hash = '') {
  const win = new EventTarget();
  win.location = { pathname: '/son-mai-anh-sang/', search: '?force3d', hash };
  win.history = {
    state: null,
    replaceState: vi.fn((_s, _title, url) => {
      win.location.hash = url.includes('#') ? url.slice(url.indexOf('#')) : '';
    }),
  };
  win.setTimeout = (...a) => setTimeout(...a);
  win.clearTimeout = (id) => clearTimeout(id);
  win.document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  return win;
}

function fakeStudio(initial = '') {
  const listeners = new Set();
  const studio = {
    text: initial,
    recipe: () => ({ text: studio.text }),
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    change(text) { studio.text = text; listeners.forEach((cb) => cb()); },
    listeners,
    applyRecipe: vi.fn(async () => ({ counts: {}, problems: [] })),
    reset: vi.fn(async () => {}),
  };
  return studio;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('syncRecipeUrl · ghi lên thanh địa chỉ', () => {
  it('đổi 20 lần trong 400 ms: không ghi gì; tới 500 ms ghi MỘT lần chuỗi cuối, giữ query string', () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    for (let i = 1; i <= 20; i += 1) {
      studio.change(`suong:${i}`);
      vi.advanceTimersByTime(20);
    }
    expect(win.history.replaceState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '/son-mai-anh-sang/?force3d#r=suong:20');
  });

  it('chuỗi không đổi thì không ghi', () => {
    const win = fakeWindow('#r=a:1');
    const studio = fakeStudio('a:1');
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('a:1');
    vi.advanceTimersByTime(WRITE_MS * 2);
    expect(win.history.replaceState).not.toHaveBeenCalled();
  });

  it('chuỗi rỗng: ghi pathname + search, không có #r=', () => {
    const win = fakeWindow('#r=a:1');
    const studio = fakeStudio('a:1');
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('');
    vi.advanceTimersByTime(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '/son-mai-anh-sang/?force3d');
  });

  it('replaceState ném SecurityError: một console.warn rồi thôi ghi dù còn đổi', () => {
    const win = fakeWindow();
    win.history.replaceState.mockImplementation(() => { throw new DOMException('quá nhiều', 'SecurityError'); });
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('a:1');
    vi.advanceTimersByTime(WRITE_MS);
    studio.change('a:2');
    vi.advanceTimersByTime(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('pagehide, hay visibilityState thành "hidden": ghi ngay phần còn hẹn', () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('a:1');
    win.dispatchEvent(new Event('pagehide'));
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    studio.change('a:2');
    win.document.visibilityState = 'visible';
    win.document.dispatchEvent(new Event('visibilitychange'));
    expect(win.history.replaceState).toHaveBeenCalledTimes(1); // đang hiện: chưa ghi
    win.document.visibilityState = 'hidden';
    win.document.dispatchEvent(new Event('visibilitychange'));
    expect(win.history.replaceState).toHaveBeenCalledTimes(2);
    expect(win.location.hash).toBe('#r=a:2');
  });

  it('mở trang với hash chưa chuẩn (#r=a:1.50 mà recipe().text là a:1.5): sau 500 ms ghi dạng chuẩn', () => {
    const win = fakeWindow('#r=a:1.50');
    const studio = fakeStudio('a:1.5');
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    expect(win.history.replaceState).not.toHaveBeenCalled();
    vi.advanceTimersByTime(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledWith(null, '', '/son-mai-anh-sang/?force3d#r=a:1.5');
  });

  it('gỡ: bỏ nghe mọi sự kiện và hủy hẹn', () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    const off = syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('a:1');
    off();
    expect(studio.listeners.size).toBe(0);
    vi.advanceTimersByTime(WRITE_MS * 2);
    win.dispatchEvent(new Event('pagehide'));
    win.location.hash = '#r=b:2';
    win.dispatchEvent(new Event('hashchange'));
    expect(win.history.replaceState).not.toHaveBeenCalled();
    expect(studio.applyRecipe).not.toHaveBeenCalled();
  });
});

describe('syncRecipeUrl · hashchange', () => {
  const hashChange = async (win, hash) => {
    win.location.hash = hash;
    win.dispatchEvent(new Event('hashchange'));
    await vi.advanceTimersByTimeAsync(0);
  };

  it('#r=a:1 → applyRecipe("a:1") rồi onApplied', async () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    const onApplied = vi.fn();
    syncRecipeUrl({ win, studio, onApplied });
    await hashChange(win, '#r=a:1');
    expect(studio.applyRecipe).toHaveBeenCalledWith('a:1');
    expect(onApplied).toHaveBeenCalledTimes(1);
  });

  it('hash rỗng → reset(); hash lạ (#khac) → không làm gì', async () => {
    const win = fakeWindow('#r=a:1');
    const studio = fakeStudio('a:1');
    const onApplied = vi.fn();
    syncRecipeUrl({ win, studio, onApplied });
    await hashChange(win, '#khac');
    expect(studio.applyRecipe).not.toHaveBeenCalled();
    expect(studio.reset).not.toHaveBeenCalled();
    await hashChange(win, '');
    expect(studio.reset).toHaveBeenCalledTimes(1);
    expect(onApplied).not.toHaveBeenCalled();
  });

  /** Promise điều khiển bằng tay. */
  const deferred = () => {
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    return { promise, resolve };
  };

  it('áp dở dang: lần ghi đang hẹn không đè hash vừa dán; áp xong thì ghi MỘT lần dạng chuẩn', async () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.change('cu:1'); // lần ghi đã hẹn, sắp tới 500 ms
    await vi.advanceTimersByTimeAsync(400);
    const gate = deferred();
    studio.applyRecipe.mockImplementation(async (text) => {
      await gate.promise; // restore chờ núm và vẽ lại
      studio.change(text.replace('1.50', '1.5')); // onChange chỉ báo ở cuối (finally của restore)
    });
    win.location.hash = '#r=moi:1.50';
    win.dispatchEvent(new Event('hashchange'));
    await vi.advanceTimersByTimeAsync(WRITE_MS * 2); // hẹn cũ có tới hạn cũng không ghi gì
    expect(win.history.replaceState).not.toHaveBeenCalled();
    expect(win.location.hash).toBe('#r=moi:1.50');
    gate.resolve();
    await vi.advanceTimersByTimeAsync(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    expect(win.location.hash).toBe('#r=moi:1.5');
  });

  it('reset dở dang: cũng không bị ghi đè bằng chuỗi cũ; xong thì ghi một lần', async () => {
    const win = fakeWindow('#r=a:1');
    const studio = fakeStudio('a:1');
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    const gate = deferred();
    studio.reset.mockImplementation(async () => {
      await gate.promise;
      studio.change('');
    });
    win.location.hash = '';
    win.dispatchEvent(new Event('hashchange'));
    await vi.advanceTimersByTimeAsync(WRITE_MS * 2);
    expect(win.history.replaceState).not.toHaveBeenCalled();
    gate.resolve();
    await vi.advanceTimersByTimeAsync(WRITE_MS);
    expect(win.history.replaceState).not.toHaveBeenCalled(); // hash đã rỗng, chuỗi rỗng: không có gì để ghi
    expect(studio.recipe().text).toBe('');
  });

  it('áp xong mà chuỗi khác hash đã dán (mục hỏng bỏ): ghi dạng chuẩn một lần', async () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.applyRecipe.mockImplementation(async () => { studio.text = 'a:1'; });
    win.location.hash = '#r=a:1,hong';
    win.dispatchEvent(new Event('hashchange'));
    await vi.advanceTimersByTimeAsync(WRITE_MS);
    expect(win.history.replaceState).toHaveBeenCalledTimes(1);
    expect(win.location.hash).toBe('#r=a:1');
  });

  it('hai lần đổi hash liền nhau (Back rồi Forward): áp nối đuôi, lần sau chờ lần trước xong; không ghi chuỗi cũ; cuối cùng là công thức sau (C3)', async () => {
    const win = fakeWindow();
    const studio = fakeStudio();
    const onApplied = vi.fn();
    syncRecipeUrl({ win, studio, onApplied });
    const gates = [deferred(), deferred()];
    const order = [];
    studio.applyRecipe.mockImplementation(async (text) => {
      const gate = gates[order.filter((e) => e.startsWith('bắt đầu')).length];
      order.push(`bắt đầu ${text}`);
      await gate.promise;
      studio.change(text);
      order.push(`xong ${text}`);
      return { applied: true };
    });
    win.location.hash = '#r=a:1';
    win.dispatchEvent(new Event('hashchange'));
    win.location.hash = '#r=b:2';
    win.dispatchEvent(new Event('hashchange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(['bắt đầu a:1']); // lần sau chưa chen vào restore() của lần trước
    gates[0].resolve();
    await vi.advanceTimersByTimeAsync(WRITE_MS * 2); // lần trước xong, lần sau đang chạy: không ghi a:1 đè lên hash b:2
    expect(win.history.replaceState).not.toHaveBeenCalled();
    expect(order).toEqual(['bắt đầu a:1', 'xong a:1', 'bắt đầu b:2']);
    gates[1].resolve();
    await vi.advanceTimersByTimeAsync(WRITE_MS * 2);
    expect(order.at(-1)).toBe('xong b:2');
    expect(studio.text).toBe('b:2');
    expect(win.location.hash).toBe('#r=b:2');
    expect(win.history.replaceState).not.toHaveBeenCalled(); // hash đã là dạng chuẩn của cảnh
    expect(onApplied).toHaveBeenCalledTimes(2);
  });

  it('một lần áp ném lỗi: một console.error, lần đổi hash sau vẫn áp (hàng không kẹt)', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const win = fakeWindow();
    const studio = fakeStudio();
    syncRecipeUrl({ win, studio, onApplied: vi.fn() });
    studio.applyRecipe.mockRejectedValueOnce(new Error('hỏng'));
    await hashChange(win, '#r=a:1');
    expect(error).toHaveBeenCalledTimes(1);
    await hashChange(win, '#r=b:2');
    expect(studio.applyRecipe).toHaveBeenLastCalledWith('b:2');
  });

  it('link hỏng hoàn toàn (applyRecipe trả applied false): cảnh giữ nguyên, không mở xưởng, thanh địa chỉ về công thức của cảnh (C6)', async () => {
    const win = fakeWindow('#r=a:1');
    const studio = fakeStudio('a:1');
    const onApplied = vi.fn();
    syncRecipeUrl({ win, studio, onApplied });
    studio.applyRecipe.mockResolvedValue({ counts: {}, problems: ['khong-co:1 (khóa lạ)'], applied: false });
    await hashChange(win, '#r=khong-co:1');
    expect(studio.reset).not.toHaveBeenCalled();
    expect(onApplied).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(WRITE_MS);
    expect(win.location.hash).toBe('#r=a:1');
  });
});
