// tests/paintings/den-keo-quan/ngon-nen-thoi.test.js — ngọn lửa: thổi thì ngả theo hướng thổi rồi đứng lại trong ~2 s; bốn lần thổi chồng; nhấp nháy tất định.
import { describe, it, expect } from 'vitest';
import { FLAME, createFlame } from '../../../src/paintings/den-keo-quan/parts/ngon-nen-thoi.js';

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

  it('tối đa FLAME.blows lần thổi cùng lúc: lần thứ năm đẩy lần đầu ra; độ ngả có trần', () => {
    const f = createFlame();
    for (let i = 0; i < 10; i += 1) f.blow(1 + i * 0.01, [1, 0]);
    expect(f.at(1.2).lean).toBeLessThanOrEqual(FLAME.blows * FLAME.lean + 1e-9);
    expect(f.at(1.2).glow).toBeGreaterThanOrEqual(FLAME.minGlow);
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
