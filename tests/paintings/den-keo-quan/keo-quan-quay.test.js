// tests/paintings/den-keo-quan/keo-quan-quay.test.js — trống quay tính thẳng từ thời gian: giữ, thả, gạt, đổi tốc độ; không có trạng thái theo khung.
import { describe, it, expect } from 'vitest';
import { SPIN, createSpin, flickOf, rpmToOmega } from '../../../src/paintings/den-keo-quan/parts/keo-quan-quay.js';
import { mulberry32 } from '../../../src/lib/random.js';

const W = rpmToOmega(6);

describe('keo-quan-quay', () => {
  it('không có sự kiện: quay đều ở tốc độ thường', () => {
    const s = createSpin({ omega: W });
    expect(s.speed(10)).toBeCloseTo(W, 12);
    expect(s.angle(10)).toBeCloseTo(W * 10, 12);
  });

  it('giữ: tốc độ về gần 0 trong ≤ 1 s, rồi góc gần như đứng yên', () => {
    const s = createSpin({ omega: W });
    s.grip(2);
    expect(Math.abs(s.speed(3))).toBeLessThan(W * 0.02);
    expect(s.angle(5) - s.angle(3)).toBeLessThan(0.01);
  });

  it('thả: quay lại, dần về tốc độ thường (sau 5τ còn lệch < 1%)', () => {
    const s = createSpin({ omega: W });
    s.grip(1);
    s.release(3);
    expect(s.speed(3)).toBeLessThan(W * 0.05);
    expect(s.speed(3 + 5 * SPIN.tauFree)).toBeCloseTo(W, 2);
  });

  it('gạt: cộng tốc độ theo chiều vuốt, tắt dần về tốc độ thường; có trần; vuốt ngược hãm được', () => {
    const s = createSpin({ omega: W });
    s.flick(1, flickOf({ x: 9, y: 0 })); // vận tốc vuốt theo NDC/s (input.js): cú vuốt nhanh chừng 10
    expect(s.speed(1)).toBeGreaterThan(W + 1);
    expect(s.speed(1 + 7 * SPIN.tauFree)).toBeCloseTo(W, 2); // dư 3 × e^(−7) ≈ 0,003 rad/s
    s.flick(20, 1e6);
    expect(s.speed(20)).toBeLessThanOrEqual(SPIN.maxOmega);
    const r = createSpin({ omega: W });
    r.flick(1, flickOf({ x: -12, y: 0 }));
    expect(r.speed(1)).toBeLessThan(0);
  });

  it('θ và ω liên tục tại mỗi sự kiện (không nhảy)', () => {
    const s = createSpin({ omega: W });
    for (const [t, act] of [[1, 'grip'], [2.5, 'release'], [4, 'base']]) {
      const before = { a: s.angle(t), w: s.speed(t) };
      if (act === 'base') s.setBase(t, rpmToOmega(12)); else s[act](t);
      expect(s.angle(t)).toBeCloseTo(before.a, 12);
      expect(s.speed(t)).toBeCloseTo(before.w, 12);
    }
  });

  it('angle(t) không có trạng thái theo khung: gọi nhiều lần, theo thứ tự bất kỳ, ra cùng số', () => {
    const s = createSpin({ omega: W });
    s.flick(1, 2);
    const once = s.angle(7.3);
    s.angle(2);
    s.angle(9);
    expect(s.angle(7.3)).toBe(once);
  });

  it('bão cử chỉ (Review Focus 1): 300 sự kiện có hạt giống, góc và tốc độ luôn hữu hạn, |ω| ≤ trần', () => {
    const rng = mulberry32(6);
    const s = createSpin({ omega: W });
    let t = 0;
    for (let i = 0; i < 300; i += 1) {
      t += rng() * 0.2;
      const pick = rng();
      if (pick < 0.3) s.grip(t);
      else if (pick < 0.6) s.release(t);
      else s.flick(t, flickOf({ x: (rng() - 0.5) * 60, y: 0 }));
      expect(Number.isFinite(s.angle(t)) && Number.isFinite(s.speed(t))).toBe(true);
      expect(Math.abs(s.speed(t))).toBeLessThanOrEqual(SPIN.maxOmega + 1e-9);
    }
  });
});
