// tests/paintings/den-keo-quan/ngon-nen-thoi.test.js — ngọn lửa: thổi thì ngả theo hướng thổi rồi đứng lại trong ~2 s; bốn lần thổi chồng; nhấp nháy tất định.
import { describe, it, expect } from 'vitest';
import { FLAME, createFlame } from '../../../src/paintings/den-keo-quan/parts/ngon-nen-thoi.js';
import { mulberry32 } from '../../../src/lib/random.js';

describe('ngon-nen-thoi', () => {
  it('chưa thổi: chỉ nhấp nháy vài mm, sáng quanh 1; tất định', () => {
    const f = createFlame();
    const a = f.at(3.21);
    expect(Math.hypot(...a.offset)).toBeLessThan(0.005);
    expect(a.glow).toBeGreaterThan(0.85);
    expect(createFlame().at(3.21)).toEqual(a);
    expect(a.lean).toBe(0);
  });

  it('thổi: lửa ngả theo hướng thổi (cỡ 1 cm), tối đi, rồi đứng lại (sau 3 s còn < 0,5 mm)', () => {
    const f = createFlame();
    f.blow(1, [0, -1]);
    const peak = Math.max(...[1.1, 1.2, 1.3].map((t) => f.at(t).lean));
    expect(peak).toBeGreaterThan(0.006);
    expect(f.at(1.15).offset[2]).toBeLessThan(0); // ngả về −z, đúng hướng thổi
    expect(f.at(1.2).glow).toBeLessThan(0.9);
    expect(f.at(4).lean).toBeLessThan(0.0005);
  });

  it('lửa không giật: ngay lúc thổi chưa ngả (bắt đầu từ 0)', () => {
    const f = createFlame();
    f.blow(1, [1, 0]);
    expect(f.at(1).lean).toBeLessThan(1e-6);
  });

  it('tối đa FLAME.blows lần thổi cùng lúc: đủ bốn lần còn đang ngả thì lần chạm sau không làm lửa giật (Review Focus 1)', () => {
    const f = createFlame();
    for (const t of [1, 1.1, 1.2, 1.3]) f.blow(t, [1, 0]);
    const before = f.at(1.4 - 1e-6);
    f.blow(1.4, [1, 0]); // lần thứ năm: lần đầu vẫn đang dao động, bỏ nó ra là bóng trên vách nhảy cả mảng
    const after = f.at(1.4 + 1e-6);
    const jump = Math.hypot(after.offset[0] - before.offset[0], after.offset[2] - before.offset[2]);
    expect(jump, 'độ lệch nhảy (m)').toBeLessThan(1e-5);
    expect(after.glow).toBeGreaterThanOrEqual(FLAME.minGlow);
  });

  it('lần thổi đã tắt hẳn thì nhường chỗ: sau vài giây, chạm lại vẫn thổi được', () => {
    const f = createFlame();
    for (const t of [1, 1.1, 1.2, 1.3]) f.blow(t, [1, 0]);
    f.blow(10, [0, -1]);
    const peak = Math.max(...[10.05, 10.1, 10.2, 10.3].map((t) => f.at(t).lean));
    expect(peak).toBeGreaterThan(0.004);
  });

  it('chạm dồn bao nhiêu lần, lửa cũng không lệch quá FLAME.lean (12 mm), và độ lệch luôn liên tục', () => {
    const f = createFlame();
    const rand = mulberry32(7);
    const taps = Array.from({ length: 30 }, (_, i) => 1 + i * 0.07 + rand() * 0.05);
    let prev = null;
    for (let t = 0.9; t < 6; t += 0.002) {
      while (taps.length && taps[0] <= t) f.blow(taps.shift(), [Math.cos(t), Math.sin(t)]);
      const a = f.at(t);
      expect(a.lean, `t = ${t.toFixed(3)}`).toBeLessThanOrEqual(FLAME.lean + 1e-9);
      if (prev) expect(Math.hypot(a.offset[0] - prev.offset[0], a.offset[2] - prev.offset[2]), `t = ${t.toFixed(3)}`).toBeLessThan(0.0015);
      prev = a;
    }
  });

  it('giảm chuyển động: ngả và nhấp nháy ít hơn', () => {
    const [a, b] = [createFlame(), createFlame({ reduced: true })];
    a.blow(1, [1, 0]);
    b.blow(1, [1, 0]);
    expect(b.at(1.2).lean).toBeLessThan(a.at(1.2).lean);
  });

  it('flicker = 0 ("Tắt nhấp nháy"): đứng yên khi không thổi', () => {
    const f = createFlame();
    f.flicker = 0;
    expect(f.at(5)).toEqual({ offset: [0, 0, 0], glow: 1, lean: 0 });
  });
});
