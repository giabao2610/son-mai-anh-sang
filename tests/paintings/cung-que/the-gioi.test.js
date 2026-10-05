// tests/paintings/cung-que/the-gioi.test.js — số của thế giới Bức 3: khối bao chứa mọi vật (kể cả khi cây bay cao nhất); cú chạm tìm đúng điểm trên tán.
import { describe, it, expect } from 'vitest';
import { BOUNDS, TREE, PLANET, canopyEllipsoid, canopyHit, partBounds } from '../../../src/paintings/cung-que/parts/cot-the-gioi.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

describe('cot-the-gioi', () => {
  it.each([0, TREE.maxLift])('khối bao chứa hình bao của mọi vật (cây bay %s)', (lift) => {
    for (const part of partBounds(lift)) {
      expect(dist(part.center, BOUNDS.center) + part.radius, part.name).toBeLessThanOrEqual(BOUNDS.radius);
    }
  });

  it('tia trúng tán thì điểm nằm trên mặt hình bầu dục, ở phía gần camera', () => {
    const { center, radii } = canopyEllipsoid(0);
    const origin = [0, center[1], 5];
    const p = canopyHit(origin, [0, 0, -1], 0);
    const q = p.map((v, i) => (v - center[i]) / radii[i]);
    expect(Math.hypot(...q)).toBeCloseTo(1, 5);
    expect(p[2]).toBeGreaterThan(center[2]);
  });

  it('tia trượt tán: điểm trên mặt tán gần tia nhất (không NaN), và lên theo cây khi cây bay', () => {
    const onSurface = (p, lift) => {
      const { center, radii } = canopyEllipsoid(lift);
      return Math.hypot(...p.map((v, i) => (v - center[i]) / radii[i]));
    };
    const p0 = canopyHit([3, 0, 5], [0, 0, -1], 0);
    const p1 = canopyHit([3, 0, 5], [0, 0, -1], TREE.maxLift);
    expect(p0.every(Number.isFinite)).toBe(true);
    expect(onSurface(p0, 0)).toBeCloseTo(1, 6);
    expect(onSurface(p1, TREE.maxLift)).toBeCloseTo(1, 6);
    // Tia đứng yên, tán dời lên: điểm gần tia nhất không dời thẳng đúng bằng lift, nhưng vẫn lên gần bằng
    expect(p1[1] - p0[1]).toBeGreaterThan(0.4);
    expect(p0[0]).toBeGreaterThan(0); // về phía tia
  });

  it('hành tinh bán kính 1, cây đứng ở đỉnh (+Y)', () => {
    expect(PLANET.radius).toBe(1);
    expect(canopyEllipsoid(0).center[1]).toBeGreaterThan(PLANET.radius);
  });
});
