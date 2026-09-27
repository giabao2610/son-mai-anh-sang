import { describe, it, expect } from 'vitest';
import { mulberry32, randRange } from '../../src/lib/random.js';

const take = (rng, n) => Array.from({ length: n }, () => rng());

describe('mulberry32', () => {
  it('cùng hạt giống → cùng một dãy số (tất định)', () => {
    expect(take(mulberry32(42), 8)).toEqual(take(mulberry32(42), 8));
  });

  it('khóa thuật toán: ba số đầu của hạt giống 1 khớp bản mulberry32 gốc', () => {
    // Đổi thuật toán là đổi mọi bố cục đã sinh (vị trí lá, hạt…) và mọi ảnh chụp ?freeze.
    expect(take(mulberry32(1), 3)).toEqual([0.6270739405881613, 0.002735721180215478, 0.5274470399599522]);
  });

  it('hạt giống khác → dãy khác; hạt giống được ép về số nguyên 32 bit không dấu', () => {
    expect(take(mulberry32(1), 5)).not.toEqual(take(mulberry32(2), 5));
    expect(take(mulberry32(-1), 3)).toEqual(take(mulberry32(2 ** 32 - 1), 3));
  });

  it('mọi số nằm trong [0, 1) và rải đều trên 10 ô', () => {
    const rng = mulberry32(2026);
    const bins = new Array(10).fill(0);
    let min = 1;
    let max = 0;
    for (let i = 0; i < 100_000; i++) {
      const x = rng();
      min = Math.min(min, x);
      max = Math.max(max, x);
      bins[Math.floor(x * 10)]++;
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(1);
    for (const n of bins) expect(Math.abs(n - 10_000)).toBeLessThan(500); // mỗi ô lệch dưới 5%
  });
});

describe('randRange', () => {
  it('đổi [0, 1) của rng thành [min, max)', () => {
    expect(randRange(() => 0, 2, 5)).toBe(2);
    expect(randRange(() => 0.5, 2, 5)).toBe(3.5);
    expect(randRange(() => 0.999999, -1, 1)).toBeLessThan(1);
  });

  it('đi cùng mulberry32: tất định và luôn nằm trong khoảng', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const x = randRange(a, -3, 3);
      expect(x).toBe(randRange(b, -3, 3));
      expect(x).toBeGreaterThanOrEqual(-3);
      expect(x).toBeLessThan(3);
    }
  });
});
