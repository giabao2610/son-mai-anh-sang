// tests/unit/fov.test.js — fov theo khung: CameraSpec.minHorizontalFov nới fov dọc trên khung hẹp (điện thoại dọc); khung rộng giữ nguyên fov của bức. GĐ 8: fitOrtho (bề cao khung nhìn của camera trực giao theo minWidth, và theo shortFrame ở canvas thấp).
import { describe, it, expect } from 'vitest';
import { fitFov, fitOrtho, shortGrow } from '../../src/engine/gpu/fov.js';

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

describe('fitOrtho (GĐ 8)', () => {
  const spec = { height: 12, minWidth: 15.5 };
  it('bức không khai báo minWidth: luôn là height', () => {
    for (const aspect of [0.3, 390 / 844, 1, 1.6, 3]) expect(fitOrtho({ height: 12 }, aspect)).toBe(12);
  });

  it('khung đủ rộng: giữ height (máy tính 16:10 thấy 19,2 ≥ 15,5)', () => {
    expect(fitOrtho(spec, 1.6)).toBe(12);
    expect(fitOrtho(spec, 15.5 / 12)).toBe(12);
  });

  it('khung hẹp (điện thoại dọc): nới bề cao để bề ngang thấy đúng minWidth', () => {
    const aspect = 390 / 844;
    expect(fitOrtho(spec, aspect) * aspect).toBeCloseTo(15.5, 9);
  });

  it('khung hẹp bất thường thì có trần 4 lần height; tỉ lệ khung không hợp lệ thì giữ height', () => {
    expect(fitOrtho(spec, 0.05)).toBe(48);
    for (const aspect of [0, -1, NaN, Infinity]) expect(fitOrtho(spec, aspect)).toBe(12);
  });
});

describe('fitOrtho · canvas thấp (shortFrame, sau điểm duyệt ảnh GĐ 8)', () => {
  const short = { height: 13.2, minWidth: 15.5, shortFrame: { below: 800, maxGrow: 1.3 } };

  it('canvas cao từ `below` trở lên, hay không biết bề cao: như cũ (máy tính 1280 × 800, 1440 × 900, 1920 × 1080)', () => {
    for (const css of [800, 900, 1080, undefined]) expect(fitOrtho(short, 1.6, css)).toBe(13.2);
    expect(shortGrow(short.shortFrame, 800)).toBe(1);
  });

  it('bức không khai báo shortFrame: canvas thấp mấy cũng như cũ', () => {
    for (const css of [390, 650, 720]) expect(fitOrtho({ height: 13.2, minWidth: 15.5 }, 2, css)).toBe(13.2);
  });

  it('thấp hơn `below`: bề cao khung nhìn nhân below / bề cao canvas (laptop 1366 × 650, 1280 × 720)', () => {
    expect(fitOrtho(short, 1366 / 650, 650)).toBeCloseTo((13.2 * 800) / 650, 9);
    expect(fitOrtho(short, 1280 / 720, 720)).toBeCloseTo((13.2 * 800) / 720, 9);
    expect(shortGrow(short.shortFrame, 650)).toBeCloseTo(800 / 650, 9);
  });

  it('có trần maxGrow: điện thoại xoay ngang (cao 390) không thu tờ tranh thành một dải', () => {
    expect(fitOrtho(short, 844 / 390, 390)).toBeCloseTo(13.2 * 1.3, 9);
    expect(shortGrow(short.shortFrame, 100)).toBe(1.3);
  });

  it('bề cao canvas không hợp lệ (0, âm, NaN, vô cực): như cũ', () => {
    for (const css of [0, -1, NaN, Infinity]) expect(fitOrtho(short, 1.6, css)).toBe(13.2);
  });

  it('gộp với minWidth: lấy bề cao lớn hơn, không nhân hai lần (khung vừa hẹp vừa thấp)', () => {
    const aspect = 500 / 700;
    expect(fitOrtho(short, aspect, 700)).toBeCloseTo(15.5 / aspect, 9); // minWidth đòi 21,7 > 13,2 · 800/700 ≈ 15,1
    expect(fitOrtho(short, 1.2, 700)).toBeCloseTo((13.2 * 800) / 700, 9); // minWidth đòi 12,9 < 15,1
  });
});
