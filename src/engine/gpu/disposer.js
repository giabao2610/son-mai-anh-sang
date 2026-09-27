// engine/gpu/disposer.js — sổ ghi mọi thứ đã tạo, để gỡ tất cả theo thứ tự ngược, mỗi mục một try/catch.

/**
 * Thứ tạo sau thường dựa vào thứ tạo trước (pipeline cần renderer, lớp cần scene…),
 * nên gỡ theo thứ tự NGƯỢC: cái tạo sau cùng gỡ trước (§8.5: loop → UI → pipeline → lớp → stage).
 *
 * - Một hàm gỡ ném lỗi thì ghi log rồi gỡ tiếp (bảng lỗi §9).
 * - Sau closeAll(), add() chạy hàm NGAY. Nhờ vậy phần khởi động xong trễ (quá hạn 10 s,
 *   trang đã về tầng tĩnh) tự dọn chính nó thay vì bị bỏ quên.
 * - `closed` thành true ngay khi closeAll() bắt đầu, nên hàm nào add() trong lúc đang gỡ cũng chạy ngay.
 *
 * @param {{ log?: { error: (...args: any[]) => void } }} [options]
 * @returns {{ add: (fn: () => void) => () => void, closeAll: () => void, readonly closed: boolean }}
 */
export function createDisposer({ log = console } = {}) {
  /** @type {Array<() => void>} */
  const fns = [];
  let closed = false;

  const runSafely = (fn) => {
    try {
      fn();
    } catch (err) {
      log.error('Gỡ tài nguyên bị lỗi (vẫn gỡ tiếp phần còn lại):', err);
    }
  };

  return {
    add(fn) {
      if (typeof fn !== 'function') throw new TypeError('disposer.add() cần một hàm');
      if (closed) runSafely(fn);
      else fns.push(fn);
      return fn;
    },
    closeAll() {
      if (closed) return;
      closed = true;
      // pop() lấy phần tử cuối trước: đúng thứ tự ngược với lúc add().
      while (fns.length > 0) runSafely(fns.pop());
    },
    get closed() {
      return closed;
    },
  };
}
