import { describe, it, expect, vi } from 'vitest';
import { createFailCounter, createBurstCounter, createLatch } from '../../src/engine/gpu/guards.js';

describe('createFailCounter: 3 khung lỗi LIÊN TIẾP thì dừng', () => {
  it('báo true đúng ở lần lỗi thứ 3 liên tiếp', () => {
    const c = createFailCounter({ limit: 3 });
    expect(c.fail()).toBe(false);
    expect(c.fail()).toBe(false);
    expect(c.fail()).toBe(true);
  });

  it('một khung tốt xóa chuỗi lỗi', () => {
    const c = createFailCounter({ limit: 3 });
    c.fail();
    c.fail();
    c.ok();
    expect(c.streak).toBe(0);
    expect(c.fail()).toBe(false);
    expect(c.fail()).toBe(false);
    expect(c.fail()).toBe(true);
  });

  it('lỗi xen kẽ khung tốt thì không bao giờ báo', () => {
    const c = createFailCounter();
    for (let i = 0; i < 10; i += 1) {
      expect(c.fail()).toBe(false);
      c.ok();
    }
  });

  it('mặc định limit = 3', () => {
    const c = createFailCounter();
    c.fail();
    c.fail();
    expect(c.fail()).toBe(true);
  });
});

describe('createBurstCounter: 3 lỗi GPU trong 1 giây thì dừng', () => {
  it('3 lần trong vòng 1 s → true ở lần thứ 3', () => {
    const b = createBurstCounter({ limit: 3, windowMs: 1000 });
    expect(b.hit(0)).toBe(false);
    expect(b.hit(400)).toBe(false);
    expect(b.hit(999)).toBe(true);
  });

  it('lỗi cũ từ 1 s trở lên rơi khỏi cửa sổ', () => {
    const b = createBurstCounter({ limit: 3, windowMs: 1000 });
    b.hit(0);
    b.hit(500);
    expect(b.hit(1000)).toBe(false); // lần ở 0 ms đã cũ đúng 1 s → không tính
    expect(b.count).toBe(2);
    expect(b.hit(1400)).toBe(true); // 500, 1000, 1400
  });

  it('mỗi giây một lỗi thì không bao giờ báo', () => {
    const b = createBurstCounter();
    for (let ms = 0; ms < 10_000; ms += 1000) expect(b.hit(ms)).toBe(false);
  });

  it('mặc định limit = 3, windowMs = 1000', () => {
    const b = createBurstCounter();
    b.hit(10);
    b.hit(20);
    expect(b.hit(1009)).toBe(true);
  });
});

describe('createLatch', () => {
  it('người nghe trước được báo ngay; người nghe sau được báo bù ở microtask kế tiếp', async () => {
    const latch = createLatch();
    const early = vi.fn();
    latch.on(early);
    expect(latch.fired).toBe(false);
    latch.fire({ message: 'mất' });
    expect(early).toHaveBeenCalledWith({ message: 'mất' });
    const late = vi.fn();
    latch.on(late);
    expect(late).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(late).toHaveBeenCalledWith({ message: 'mất' });
    expect(latch.fired).toBe(true);
  });

  it('clear() bỏ mọi người nghe: sự kiện tới sau đó không gọi ai', () => {
    const latch = createLatch();
    const cb = vi.fn();
    latch.on(cb);
    latch.clear();
    latch.fire({});
    expect(cb).not.toHaveBeenCalled();
  });
});
