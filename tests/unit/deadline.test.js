import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeadlineError, withDeadline } from '../../src/engine/deadline.js';

/** Promise điều khiển bằng tay: gọi resolve/reject lúc nào tùy test. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

/** Ghi lại kết quả của một Promise mà không làm test dừng lại chờ. */
function track(promise) {
  const state = { settled: false, value: undefined, error: undefined };
  promise.then(
    (value) => Object.assign(state, { settled: true, value }),
    (error) => Object.assign(state, { settled: true, error }),
  );
  return state;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('withDeadline', () => {
  it('xong trước hạn → trả đúng giá trị và hủy đồng hồ', async () => {
    const d = deferred();
    const state = track(withDeadline(d.promise, 10_000));
    await vi.advanceTimersByTimeAsync(3_000);
    d.resolve('cảnh');
    await vi.advanceTimersByTimeAsync(0);
    expect(state).toMatchObject({ settled: true, value: 'cảnh' });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lỗi trước hạn → trả đúng lỗi đó', async () => {
    const boom = new Error('compileAsync bị reject');
    const state = track(withDeadline(Promise.reject(boom), 10_000));
    await vi.advanceTimersByTimeAsync(0);
    expect(state.error).toBe(boom);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('chưa xong thì chưa hết hạn; tới đúng hạn thì reject bằng DeadlineError', async () => {
    const d = deferred();
    const state = track(withDeadline(d.promise, 10_000));
    await vi.advanceTimersByTimeAsync(9_999);
    expect(state.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.error).toBeInstanceOf(DeadlineError);
    expect(state.error).toBeInstanceOf(Error);
    expect(state.error.name).toBe('DeadlineError');
  });

  it('xong sau hạn → gọi onLate(value) đúng một lần để dọn phần khởi động trễ', async () => {
    const d = deferred();
    const onLate = vi.fn();
    const state = track(withDeadline(d.promise, 10_000, { onLate }));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(state.error).toBeInstanceOf(DeadlineError);
    expect(onLate).not.toHaveBeenCalled();
    const handle = { dispose: vi.fn() };
    d.resolve(handle);
    await vi.advanceTimersByTimeAsync(0);
    expect(onLate).toHaveBeenCalledTimes(1);
    expect(onLate).toHaveBeenCalledWith(handle);
  });

  it('lỗi sau hạn → bỏ qua: không gọi onLate, không có unhandled rejection', async () => {
    const d = deferred();
    const onLate = vi.fn();
    const state = track(withDeadline(d.promise, 10_000, { onLate }));
    await vi.advanceTimersByTimeAsync(10_000);
    d.reject(new Error('lỗi trễ'));
    await vi.advanceTimersByTimeAsync(0);
    expect(state.error).toBeInstanceOf(DeadlineError);
    expect(onLate).not.toHaveBeenCalled();
  });

  it('xong sau hạn mà không có onLate → không ném lỗi', async () => {
    const d = deferred();
    const state = track(withDeadline(d.promise, 50));
    await vi.advanceTimersByTimeAsync(50);
    d.resolve('trễ');
    await vi.advanceTimersByTimeAsync(0);
    expect(state.error).toBeInstanceOf(DeadlineError);
  });

  it('onLate ném lỗi → chỉ ghi console.error, không làm sập trang', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const d = deferred();
    track(withDeadline(d.promise, 50, { onLate: () => { throw new Error('dispose hỏng'); } }));
    await vi.advanceTimersByTimeAsync(50);
    d.resolve({});
    await vi.advanceTimersByTimeAsync(0);
    expect(error).toHaveBeenCalledTimes(1);
  });
});
