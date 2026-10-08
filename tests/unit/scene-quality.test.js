// tests/unit/scene-quality.test.js — bộ điều chỉnh của một cảnh (GĐ 9): lúc giữ khung thì bỏ khung; thôi giữ thì bộ quyết định đo lại từ đầu.
import { describe, it, expect, vi } from 'vitest';
import { createQuality } from '../../src/engine/gpu/scene-quality.js';
import { createHold } from '../../src/engine/gpu/hold.js';

const ladder = { ids: () => [], idAt: () => null, down: () => false, up: () => false, reset() {} };
const timer = { available: false };
const tunerSpy = () => ({
  sample: vi.fn(() => null), guard: vi.fn(), cpu: vi.fn(), gpu: vi.fn(), state: () => ({ capped: false, locked: [] }),
});

describe('createQuality + hold (GĐ 9)', () => {
  it('lúc giữ: sample() trả true (bỏ khung) mà không hỏi bộ quyết định; thôi giữ: tuner.guard(chế độ hiện tại), rồi đo như thường', async () => {
    const hold = createHold();
    const tuner = tunerSpy();
    const quality = createQuality({ level: 'cao', ladder, tuner, timer, hold });
    quality.start();
    quality.guard(true); // thanh lớp mở: chế độ canh
    tuner.guard.mockClear();
    let release;
    const job = hold.run(() => new Promise((resolve) => { release = resolve; }));
    expect(quality.sample(100)).toBe(true);
    expect(tuner.sample).not.toHaveBeenCalled();
    release();
    await job;
    expect(tuner.guard).toHaveBeenCalledWith(true);
    expect(quality.sample(116)).toBe(false);
    expect(tuner.sample).toHaveBeenCalledTimes(1);
  });

  it('?freeze (không có bộ quyết định): giữ vẫn bỏ khung; thả không lỗi', async () => {
    const hold = createHold();
    const quality = createQuality({ level: 'cao', ladder, tuner: null, timer, hold });
    quality.start();
    let release;
    const job = hold.run(() => new Promise((resolve) => { release = resolve; }));
    expect(quality.sample(0)).toBe(true);
    release();
    await job;
    expect(quality.sample(16)).toBe(false);
  });
});
