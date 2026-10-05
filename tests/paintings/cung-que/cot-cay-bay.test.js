// tests/paintings/cung-que/cot-cay-bay.test.js — cây bay: giữ thì lên gần 0,45 trong 1,5 s; thả thì rơi theo trọng lực trăng, nảy một lần, đứng yên; liên tục ở mọi mốc; bão giữ thả không làm hỏng.
import { describe, it, expect } from 'vitest';
import { LIFT, createLift } from '../../../src/paintings/cung-que/parts/cot-cay-bay.js';
import { mulberry32 } from '../../../src/lib/random.js';

describe('cot-cay-bay', () => {
  it('chưa giữ thì cây đứng yên ở 0', () => {
    expect(createLift().height(5)).toBe(0);
  });

  it('giữ: lên gần H trong 1,5 s, không vượt H', () => {
    const f = createLift();
    f.grip(1);
    expect(f.height(2.5)).toBeGreaterThan(0.42);
    for (let t = 1; t < 6; t += 0.01) expect(f.height(t)).toBeLessThanOrEqual(LIFT.height + 1e-9);
  });

  it('thả sau khi lên hẳn: rơi chậm (trăng), nảy một lần, rồi đứng yên ở 0', () => {
    const f = createLift();
    f.grip(0);
    f.release(4);
    expect(f.height(5)).toBeGreaterThan(0.2); // trọng lực trăng: sau 1 s mới rơi chừng 0,08
    let ups = 0;
    for (let t = 4.01; t < 12; t += 0.01) if (f.velocity(t) > 0 && f.velocity(t - 0.01) <= 0) ups += 1;
    expect(ups, 'số lần nảy').toBe(1);
    expect(f.height(12)).toBe(0);
    expect(f.velocity(12)).toBe(0);
  });

  it('độ cao và vận tốc liên tục ở mỗi mốc, kể cả giữ lúc đang rơi', () => {
    const f = createLift();
    const marks = [[0, 'grip'], [1.2, 'release'], [2.1, 'grip'], [2.6, 'release']];
    for (const [t, k] of marks) f[k](t);
    for (const [t] of marks) {
      expect(Math.abs(f.height(t + 1e-6) - f.height(t - 1e-6)), `y tại ${t}`).toBeLessThan(1e-4);
      expect(Math.abs(f.velocity(t + 1e-6) - f.velocity(t - 1e-6)), `v tại ${t}`).toBeLessThan(1e-3);
    }
  });

  it('gọi theo thứ tự nào cũng ra cùng số (không có trạng thái theo khung)', () => {
    const f = createLift();
    f.grip(1);
    f.release(2);
    const ts = [3.3, 1.5, 2.2, 7, 1.1];
    const a = ts.map((t) => f.height(t));
    const b = [...ts].reverse().map((t) => f.height(t)).reverse();
    expect(b).toEqual(a);
  });

  it('bão giữ thả (PRNG): giữ hai lần, thả khi chưa giữ, mốc lùi: luôn hữu hạn, trong [0; H + 0,05], cuối cùng về 0 (Review Focus 2)', () => {
    const f = createLift();
    const rand = mulberry32(11);
    let t = 0;
    for (let i = 0; i < 60; i += 1) {
      t += rand() * 0.6 - 0.05; // có lúc lùi một chút
      (rand() < 0.5 ? f.grip : f.release)(t);
    }
    f.release(t + 0.1);
    for (let s = 0; s < t + 20; s += 0.05) {
      const y = f.height(s);
      expect(Number.isFinite(y)).toBe(true);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(LIFT.height + 0.05);
    }
    expect(f.height(t + 20)).toBe(0);
  });

  it('giảm chuyển động: lên và rơi chậm hơn', () => {
    const [a, b] = [createLift(), createLift({ reduced: true })];
    a.grip(0);
    b.grip(0);
    expect(b.height(0.6)).toBeLessThan(a.height(0.6));
  });
});
