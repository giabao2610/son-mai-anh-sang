// engine/sma.js — window.__sma: bảng trạng thái công khai của trang, cho e2e và người tò mò mở DevTools

/**
 * `window.__sma` là "ô kính" nhìn vào trang. Playwright đọc nó để biết lúc nào trang đã ổn định
 * (`state` là 'live' hoặc 'static'), đang chạy backend nào, đã vẽ bao nhiêu khung; khi rơi về tầng tĩnh
 * thì `reason` nói vì sao. Có từ GĐ 0, kể cả ở tầng tĩnh. GĐ 2 thêm `expose(fns)`.
 *
 * Chỉ giữ DỮ LIỆU thuần (chuỗi, số, null) ngoài hai hàm, nên `JSON.stringify(window.__sma)` đọc được ngay.
 * @param {Window | Record<string, any>} win
 */
export function createSma(win) {
  const sma = {
    state: 'poster', // luôn bằng body[data-state] (boot nối qua shell.setState → onState)
    tier: null, // tầng dò được: 'webgpu' | 'webgl2' | 'static'
    backend: null, // backend THẬT sau renderer.init() (run.js ghi)
    level: null, // 'cao' | 'vua' | 'thap' (run.js ghi)
    frames: 0,
    reason: null, // vì sao về tầng tĩnh: 'flag' | 'no-gpu' | 'chunk-load' | 'timeout' | 'frame-errors' | ...
    error: null, // message của lỗi, nếu có
    /** Ghép một phần trạng thái: sma.set({ state: 'live' }). */
    set(patch) {
      return Object.assign(sma, patch);
    },
    /** Mỗi khung đã vẽ xong gọi một lần. */
    frame() {
      sma.frames += 1;
    },
  };
  win.__sma = sma;
  return sma;
}
