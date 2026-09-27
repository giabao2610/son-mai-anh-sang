import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseAt, readFlags } from '../../src/engine/flags.js';

// 21:00 ngày 28/09/2026 giờ Việt Nam = 14:00 UTC.
const VN_21H = '2026-09-28T14:00:00.000Z';

afterEach(() => vi.restoreAllMocks());

describe('readFlags: cờ bật/tắt', () => {
  it('không có cờ nào thì mọi thứ tắt', () => {
    expect(readFlags('')).toEqual({
      static: false, webgl: false, force3d: false, debug: false, at: null, freeze: false, poster: false,
    });
  });

  it('?webgl và ?webgl=1 bật; ?webgl=0 và ?webgl=false tắt', () => {
    expect(readFlags('?webgl').webgl).toBe(true);
    expect(readFlags('?webgl=1').webgl).toBe(true);
    expect(readFlags('?webgl=0').webgl).toBe(false);
    expect(readFlags('?webgl=false').webgl).toBe(false);
  });

  it('đọc nhiều cờ cùng lúc; thiếu dấu "?" ở đầu vẫn đọc được', () => {
    expect(readFlags('?static&force3d&poster')).toMatchObject({ static: true, force3d: true, poster: true, webgl: false });
    expect(readFlags('webgl&force3d')).toMatchObject({ webgl: true, force3d: true });
  });

  it('?debug → true, ?debug=stats → "stats", ?debug=0 → false', () => {
    expect(readFlags('?debug').debug).toBe(true);
    expect(readFlags('?debug=1').debug).toBe(true);
    expect(readFlags('?debug=stats').debug).toBe('stats');
    expect(readFlags('?debug=0').debug).toBe(false);
  });

  it('?freeze → true, ?freeze=40 → 40, giá trị không phải số nguyên dương → true, không có → false', () => {
    expect(readFlags('?freeze').freeze).toBe(true);
    expect(readFlags('?freeze=40').freeze).toBe(40);
    expect(readFlags('?freeze=10&webgl').freeze).toBe(10);
    expect(readFlags('?freeze=abc').freeze).toBe(true);
    expect(readFlags('?freeze=-3').freeze).toBe(true);
    expect(readFlags('?freeze=1.5').freeze).toBe(true);
    expect(readFlags('?freeze=0').freeze).toBe(false);
    expect(readFlags('?webgl').freeze).toBe(false);
  });
});

describe('parseAt và ?at', () => {
  it('không ghi offset thì hiểu là giờ Việt Nam (+07:00), bất kể múi giờ của máy', () => {
    expect(parseAt('2026-09-28T21:00').toISOString()).toBe(VN_21H);
    expect(parseAt('2026-09-28T21:00:30').toISOString()).toBe('2026-09-28T14:00:30.000Z');
    expect(readFlags('?at=2026-09-28T21:00').at.toISOString()).toBe(VN_21H);
  });

  it('dấu "+" gõ thẳng vào URL bị giải mã thành khoảng trắng, nhưng vẫn đọc đúng', () => {
    expect(new URLSearchParams('?at=2026-09-28T21:00+07:00').get('at')).toBe('2026-09-28T21:00 07:00');
    expect(readFlags('?at=2026-09-28T21:00+07:00').at.toISOString()).toBe(VN_21H);
  });

  it('offset viết bằng %2B', () => {
    expect(readFlags('?at=2026-09-28T21:00%2B07:00').at.toISOString()).toBe(VN_21H);
  });

  it('offset Z (UTC) và offset âm', () => {
    expect(readFlags('?at=2026-09-28T14:00Z').at.toISOString()).toBe(VN_21H);
    expect(parseAt('2026-09-28T09:00-05:00').toISOString()).toBe(VN_21H);
  });

  it('chuỗi hỏng thì trả null', () => {
    for (const v of ['hôm qua', '', '2026-09-28', '09/28/2026', 'September 28, 2026 21:00', '2026-13-45T25:99', '2026-09-28T21:00+7']) {
      expect(parseAt(v), v).toBeNull();
    }
    expect(parseAt(null)).toBeNull();
    expect(parseAt(undefined)).toBeNull();
    expect(readFlags('?at=abc').at).toBeNull();
  });

  it('có ?debug thì in cảnh báo khi ?at hỏng; không có ?debug thì im lặng', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readFlags('?at=abc');
    expect(warn).not.toHaveBeenCalled();
    readFlags('?debug&at=abc');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('?at');
  });
});
