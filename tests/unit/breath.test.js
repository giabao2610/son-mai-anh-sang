// tests/unit/breath.test.js — camera "thở": lệch nhỏ, bị chặn, tất định; biên độ 0 thì đứng yên.
import { describe, it, expect } from 'vitest';
import { breathAmplitude, breathOffset } from '../../src/engine/gpu/breath.js';

describe('breathOffset', () => {
  it('biên độ 0 (hoặc thiếu) → không lệch', () => {
    expect(breathOffset(12.3, 0)).toEqual([0, 0, 0]);
    expect(breathOffset(12.3, undefined)).toEqual([0, 0, 0]);
  });

  it('mỗi trục bị chặn bởi biên độ; cùng t cho cùng kết quả (?freeze tất định)', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const [x, y, z] = breathOffset(t, 0.4);
      expect(Math.abs(x)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.4 * 0.35);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.4 * 0.6);
    }
    expect(breathOffset(7.5, 0.4)).toEqual(breathOffset(7.5, 0.4));
  });

  it('có chuyển động: hai thời điểm khác nhau cho độ lệch khác nhau', () => {
    expect(breathOffset(1, 0.4)).not.toEqual(breathOffset(3, 0.4));
  });
});

describe('breathAmplitude', () => {
  it('lấy CameraSpec.breathe; bức không khai báo thì 0', () => {
    expect(breathAmplitude({ breathe: 0.4 }, false)).toBe(0.4);
    expect(breathAmplitude({}, false)).toBe(0);
  });

  it('người xem xin giảm chuyển động thì camera không thở (§10)', () => {
    expect(breathAmplitude({ breathe: 0.4 }, true)).toBe(0);
  });
});
