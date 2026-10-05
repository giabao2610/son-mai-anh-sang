// tests/unit/fov.test.js — fov theo khung: CameraSpec.minHorizontalFov nới fov dọc trên khung hẹp (điện thoại dọc); khung rộng giữ nguyên fov của bức.
import { describe, it, expect } from 'vitest';
import { fitFov } from '../../src/engine/gpu/fov.js';

/** Góc nhìn ngang (độ) của camera có fov dọc `fov` (độ) ở khung tỉ lệ `aspect`. */
const horizontal = (fov, aspect) => (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * aspect) * 180) / Math.PI;

describe('fitFov', () => {
  it('bức không khai báo minHorizontalFov: luôn là fov của bức', () => {
    for (const aspect of [0.3, 390 / 844, 1, 1.6, 3]) expect(fitFov({ fov: 48 }, aspect)).toBe(48);
  });

  it('khung đã đủ góc ngang: giữ nguyên fov (máy tính 16:10, iPad dọc)', () => {
    expect(fitFov({ fov: 48, minHorizontalFov: 30 }, 1.6)).toBe(48);
    expect(fitFov({ fov: 48, minHorizontalFov: 30 }, 0.75)).toBe(48); // 2·atan(tan 24° · 0,75) ≈ 37° ≥ 30°
  });

  it('khung hẹp: nới fov dọc vừa đủ để góc ngang bằng minHorizontalFov', () => {
    const aspect = 390 / 844;
    const fov = fitFov({ fov: 48, minHorizontalFov: 30 }, aspect);
    expect(fov).toBeGreaterThan(48);
    expect(horizontal(fov, aspect)).toBeCloseTo(30, 6);
  });

  it('khung hẹp bất thường thì fov dọc có trần; tỉ lệ khung không hợp lệ thì giữ fov của bức', () => {
    expect(fitFov({ fov: 48, minHorizontalFov: 30 }, 0.05)).toBeLessThanOrEqual(100);
    for (const aspect of [0, -1, NaN, Infinity]) expect(fitFov({ fov: 48, minHorizontalFov: 30 }, aspect)).toBe(48);
  });
});
