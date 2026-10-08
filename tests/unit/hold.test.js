// tests/unit/hold.test.js — bộ giữ khung (GĐ 9): giữ trong lúc việc async chạy, luôn thả kể cả khi lỗi, lồng nhau, idle() và onRelease.
import { describe, it, expect, vi } from 'vitest';
import { createHold } from '../../src/engine/gpu/hold.js';

/** Việc async mà test tự kết thúc. */
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('createHold', () => {
  it('run(): giữ NGAY lúc gọi (đồng bộ), thả khi việc xong, trả đúng giá trị', async () => {
    const hold = createHold();
    const job = deferred();
    const run = hold.run(() => job.promise);
    expect(hold.active).toBe(true);
    job.resolve(42);
    await expect(run).resolves.toBe(42);
    expect(hold.active).toBe(false);
  });

  it('việc ném lỗi (đồng bộ hay async): vẫn thả, lỗi tới người gọi', async () => {
    const hold = createHold();
    await expect(hold.run(() => { throw new Error('a'); })).rejects.toThrow('a');
    expect(hold.active).toBe(false);
    const job = deferred();
    const run = hold.run(() => job.promise);
    job.reject(new Error('b'));
    await expect(run).rejects.toThrow('b');
    expect(hold.active).toBe(false);
  });

  it('lồng nhau: thả hết mới hết giữ; idle() và onRelease báo đúng một lần, lúc thả hết', async () => {
    const hold = createHold();
    const released = vi.fn();
    hold.onRelease(released);
    const a = deferred();
    const b = deferred();
    const runA = hold.run(() => a.promise);
    const runB = hold.run(() => b.promise);
    let idle = false;
    hold.idle().then(() => { idle = true; });
    a.resolve();
    await runA;
    expect(hold.active).toBe(true);
    expect(idle).toBe(false);
    expect(released).not.toHaveBeenCalled();
    b.resolve();
    await runB;
    await Promise.resolve();
    expect(idle).toBe(true);
    expect(released).toHaveBeenCalledTimes(1);
  });

  it('idle() khi không ai giữ: xong ngay; onRelease trả hàm bỏ nghe', async () => {
    const hold = createHold();
    await expect(hold.idle()).resolves.toBeUndefined();
    const cb = vi.fn();
    hold.onRelease(cb)();
    await hold.run(() => {});
    expect(cb).not.toHaveBeenCalled();
  });
});
