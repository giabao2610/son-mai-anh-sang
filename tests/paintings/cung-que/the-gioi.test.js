// tests/paintings/cung-que/the-gioi.test.js — số của thế giới Bức 3: khối bao chứa mọi vật (kể cả khi cây bay cao nhất); cú chạm tìm đúng điểm trên tán; Cuội và trâu đủ to; khung dọc thấy trọn hành tinh.
import { describe, it, expect } from 'vitest';
import {
  BOUNDS, CUOI, TRAU, TREE, PLANET, canopyEllipsoid, canopyHit, cuoiToWorld, partBounds, trauToWorld,
} from '../../../src/paintings/cung-que/parts/cot-the-gioi.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import { fitFov } from '../../../src/engine/gpu/fov.js';

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

  it('Cuội và trâu: mọi phần có số hữu hạn, và nằm gọn trong hình bao mà shader dùng để bỏ qua (cả khi cây bay cao nhất)', () => {
    const finite = (part) => [...part.a, ...(part.b ?? []), ...[].concat(part.r)].every(Number.isFinite);
    /** Bán kính bao của một phần quanh tâm c: khoảng cách xa nhất của hai đầu, cộng bán kính (bầu dục: bán kính lớn nhất). */
    const reach = (part, c) => Math.max(dist(part.a, c), dist(part.b ?? part.a, c)) + Math.max(...[].concat(part.r));
    for (const lift of [0, TREE.maxLift]) {
      const bounds = Object.fromEntries(partBounds(lift).map((b) => [b.name, b]));
      for (const part of CUOI.parts) {
        expect(finite(part)).toBe(true);
        const world = { ...part, a: cuoiToWorld(part.a, lift), b: part.b && cuoiToWorld(part.b, lift) };
        expect(reach(world, bounds['Cuội'].center), `Cuội ${part.kind}`).toBeLessThanOrEqual(bounds['Cuội'].radius);
      }
      for (const part of TRAU.parts) {
        expect(finite(part)).toBe(true);
        const world = { ...part, a: trauToWorld(part.a), b: part.b && trauToWorld(part.b) };
        expect(reach(world, bounds['trâu'].center), `trâu ${part.kind}`).toBeLessThanOrEqual(bounds['trâu'].radius);
      }
    }
  });

  it('hành tinh bán kính 1, cây đứng ở đỉnh (+Y)', () => {
    expect(PLANET.radius).toBe(1);
    expect(canopyEllipsoid(0).center[1]).toBeGreaterThan(PLANET.radius);
  });

  it('Cuội và trâu đủ to để đọc được ở khung máy tính (điểm duyệt ảnh Task 4: 1,4 lần cỡ đầu), vẫn chạm đất', () => {
    /** Khoảng [thấp, cao] theo trục `axis` của cả vật (bầu dục: bán kính theo trục đó). */
    const range = (parts, axis) => {
      const lo = [];
      const hi = [];
      for (const p of parts) {
        const r = Array.isArray(p.r) ? p.r[axis] : p.r;
        const v = [p.a[axis], (p.b ?? p.a)[axis]];
        lo.push(Math.min(...v) - r);
        hi.push(Math.max(...v) + r);
      }
      return [Math.min(...lo), Math.max(...hi)];
    };
    const [cuoiLow, cuoiTop] = range(CUOI.parts, 1);
    expect(cuoiTop, 'Cuội ngồi cao chừng 0,24, hơn nửa thân cây').toBeGreaterThan(0.23);
    expect(CUOI.height).toBeCloseTo(cuoiTop, 2);
    expect(cuoiLow, 'Cuội ngồi trên đất, không lơ lửng').toBeLessThanOrEqual(0.005);
    expect(cuoiLow, 'không lún').toBeGreaterThan(-0.03);
    const [trauBack, trauFront] = range(TRAU.parts, 0);
    expect(trauFront - trauBack, 'trâu dài chừng 0,33 từ đuôi tới đầu').toBeGreaterThan(0.3);
    const [trauLow] = range(TRAU.parts, 1);
    expect(trauLow, 'bốn chân chạm đất').toBeLessThanOrEqual(0.005);
    expect(trauLow, 'không lún').toBeGreaterThan(-0.03);
  });

  it('khung dọc 390×844 thấy trọn bề ngang hành tinh ở khoảng cách mặc định; khung máy tính giữ nguyên fov (spec §19.2)', () => {
    const { camera } = painting;
    const sub = (a, b) => a.map((v, i) => v - b[i]);
    const toCenter = sub([0, 0, 0], camera.position);
    const look = sub(camera.target, camera.position);
    const depth = (toCenter[0] * look[0] + toCenter[1] * look[1] + toCenter[2] * look[2]) / Math.hypot(...look);
    // Mặt phẳng qua camera chứa trục dọc của khung và tiếp xúc quả cầu: tan nửa bề ngang = R / √(sâu² − R²), không phụ thuộc
    // chỗ quả cầu nằm cao hay thấp trong khung.
    const halfWidth = PLANET.radius / Math.sqrt(depth ** 2 - PLANET.radius ** 2);
    const aspect = 390 / 844;
    const halfFrame = Math.tan((fitFov(camera, aspect) * Math.PI) / 360) * aspect;
    expect(halfWidth / halfFrame, 'hành tinh chiếm dưới 90% bề ngang khung dọc').toBeLessThan(0.9);
    expect(fitFov(camera, 1280 / 800)).toBe(camera.fov);
  });
});
