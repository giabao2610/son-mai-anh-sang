// engine/gpu/hold.js — giữ khung: trong lúc một việc async chạy với render target của lượt khác đang đặt trên renderer (biên dịch lại giữa chừng), cảnh không vẽ.

/**
 * Bộ giữ khung của MỘT cảnh (spec §21.3). three r186 dựng mã của vật trong lúc `compileAsync` nhường luồng chính, và lúc dựng nó đọc
 * render target + MRT đang đặt trên renderer (Phụ lục A.103, A.105). Việc nào phải để target của lượt khác qua một lần chờ thì chạy trong
 * `run()`: lúc giữ, scene.step() bỏ khung (scene-quality.js) và vẽ lại khung đứng yên chờ `idle()` (scene.js), nên không khung nào vẽ
 * với target sai.
 */
export function createHold() {
  let count = 0;
  let waiters = [];
  const listeners = new Set();

  const release = () => {
    count -= 1;
    if (count > 0) return;
    const done = waiters;
    waiters = [];
    for (const resolve of done) resolve();
    for (const cb of listeners) cb();
  };

  return {
    /** Có việc nào đang giữ khung không. */
    get active() {
      return count > 0;
    },
    /**
     * Chạy `fn` trong lúc giữ khung; luôn thả, kể cả khi `fn` ném lỗi (lỗi đi tiếp tới người gọi). Giữ lồng nhau được: thả hết mới vẽ.
     * Giữ ngay lúc gọi (phần đồng bộ của hàm async), trước khi `fn` chạy.
     * @template T
     * @param {() => T | Promise<T>} fn
     * @returns {Promise<T>}
     */
    async run(fn) {
      count += 1;
      try {
        return await fn();
      } finally {
        release();
      }
    },
    /** Promise xong khi không còn việc nào giữ (xong ngay nếu đang không giữ). */
    idle() {
      return count === 0 ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve));
    },
    /** Nghe lúc thả hết (bộ điều chỉnh đo lại từ đầu). Trả hàm bỏ nghe. */
    onRelease(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
