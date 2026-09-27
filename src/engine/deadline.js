// engine/deadline.js — withDeadline(): đặt hạn cho một Promise (khởi động 3D tối đa 10 giây); phần xong trễ được dọn qua onLate.

/** Lỗi "quá hạn". boot.js nhận ra nó bằng instanceof để ghi lý do 'timeout'. */
export class DeadlineError extends Error {
  /** @param {number} ms  hạn đã đặt, tính bằng mili giây */
  constructor(ms) {
    super(`Quá hạn ${ms} ms`);
    this.name = 'DeadlineError';
    this.ms = ms;
  }
}

/**
 * Chạy đua giữa promise và một đồng hồ hẹn giờ.
 * - Xong trước hạn: trả đúng giá trị hoặc lỗi của promise.
 * - Tới hạn mà chưa xong: reject bằng DeadlineError. Nếu sau đó promise mới xong, gọi onLate(value) để dọn
 *   (ví dụ dispose() cảnh 3D khởi động trễ). Lỗi đến sau hạn thì bỏ qua, vì trang đã về tầng tĩnh rồi.
 * Dùng setTimeout/clearTimeout toàn cục, nên test điều khiển được bằng vi.useFakeTimers().
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {{ onLate?: (value: T) => void }} [options]
 * @returns {Promise<T>}
 */
export function withDeadline(promise, ms, { onLate } = {}) {
  return new Promise((resolve, reject) => {
    let late = false;
    const timer = setTimeout(() => {
      late = true;
      reject(new DeadlineError(ms));
    }, ms);

    Promise.resolve(promise).then(
      (value) => {
        if (!late) {
          clearTimeout(timer);
          resolve(value);
          return;
        }
        try {
          onLate?.(value);
        } catch (err) {
          console.error('withDeadline: onLate ném lỗi', err);
        }
      },
      (error) => {
        if (late) return; // lỗi đến sau hạn: bỏ qua
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
