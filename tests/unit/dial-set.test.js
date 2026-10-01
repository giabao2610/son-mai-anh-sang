// tests/unit/dial-set.test.js — Dial của bức: kẹp theo min/max, làm tròn theo step, chữ giá trị, ghi chú, snapshot/restore.
import { describe, it, expect, vi } from 'vitest';
import { uniform } from 'three/tsl';
import { createDialSet } from '../../src/engine/gpu/dial-set.js';

const pad = (n) => String(n).padStart(2, '0');
/** Một Dial giống thanh giờ: 18 → 29,5, bước 15 phút, ghi "hh:mm", có ghi chú khi còn ở giá trị đầu. */
function gio() {
  const u = uniform(21);
  return {
    u,
    dial: {
      id: 'gio', uniform: u, min: 18, max: 29.5, step: 0.25,
      format: (v) => `${pad(Math.floor(v) % 24)}:${pad(Math.round((v % 1) * 60))}`,
      note: () => (u.value === 21 ? 'daytime' : null),
    },
  };
}

describe('createDialSet', () => {
  it('list(): khoảng giá trị, giá trị hiện tại, chữ (format), khóa ghi chú', () => {
    const { dial } = gio();
    const dials = createDialSet([dial]);
    expect(dials.size).toBe(1);
    expect(dials.list()).toEqual([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }]);
  });

  it('set(): đổi .value của CHÍNH uniform đó; kẹp theo min/max; làm tròn về bước 0,25; ghi chú theo note()', () => {
    const { u, dial } = gio();
    const dials = createDialSet([dial]);
    dials.set('gio', 26.1);
    expect(u.value).toBe(26);
    expect(dials.list()[0]).toMatchObject({ text: '02:00', note: null });
    dials.set('gio', 99);
    expect([u.value, dials.list()[0].text]).toEqual([29.5, '05:30']);
    dials.set('gio', '18.4');
    expect(u.value).toBe(18.5);
    expect(() => dials.set('gio', 'abc')).toThrow('Dial "gio": "abc" không phải số');
    expect(() => dials.set('mua', 1)).toThrow('Bức không có Dial "mua"');
  });

  it('không có format thì chữ là số; khai báo trùng id thì ném lỗi; bức không có Dial thì rỗng', () => {
    const plain = createDialSet([{ id: 'a', uniform: uniform(0.5), min: 0, max: 1, step: 0 }]);
    expect(plain.list()[0]).toMatchObject({ text: '0.5', note: null });
    expect(() => createDialSet([gio().dial, gio().dial])).toThrow('Bức khai báo Dial "gio" hai lần');
    const none = createDialSet();
    expect([none.size, none.list(), none.snapshot()]).toEqual([0, [], {}]);
  });

  it('snapshot/restore: { dialId: số }; Dial lạ hay giá trị hỏng thì bỏ qua kèm cảnh báo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = gio();
    const dials = createDialSet([a.dial]);
    dials.set('gio', 27);
    expect(dials.snapshot()).toEqual({ gio: 27 });
    const b = gio();
    const again = createDialSet([b.dial]);
    again.restore({ gio: 27, mua: 3 });
    again.restore({ gio: 'hỏng' });
    expect(b.u.value).toBe(27);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
