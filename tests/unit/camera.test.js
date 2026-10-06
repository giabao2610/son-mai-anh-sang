// tests/unit/camera.test.js — camera của sân khấu theo CameraSpec (GĐ 8): phối cảnh như cũ khi thiếu kind; trực giao có khung nhìn đúng tỉ lệ, giữ zoom khi khớp khung; giới hạn OrbitControls theo loại camera.
import { describe, it, expect } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three/webgpu';
import { FAR, NEAR, createCamera, fitCamera, isOrtho, limitControls } from '../../src/engine/gpu/camera.js';

const PERSPECTIVE = {
  position: [0, 1, 5], target: [0, 1, 0], fov: 48, minHorizontalFov: 30,
  azimuth: [-1, 1], polar: [1, 2], distance: [3, 7],
};
const ORTHO = {
  kind: 'ortho', position: [0, 7.2, 11.55], target: [0, 2.8, -0.45], height: 12, minWidth: 15.5, zoom: [1, 2.5],
  azimuth: [-1.3, 1.3], polar: [0.35, 1.4],
};
/** OrbitControls giả: chỉ các trường limitControls ghi. */
const fakeControls = () => ({ target: new Vector3(), minZoom: 0, maxZoom: Infinity, minDistance: 0, maxDistance: Infinity, enableZoom: true });

describe('createCamera', () => {
  it('thiếu kind: PerspectiveCamera như ba bức trước (fov theo khung, near 0,1, far 500), đặt ở position, nhìn target', () => {
    const cam = createCamera(PERSPECTIVE, 1.6);
    expect(cam).toBeInstanceOf(PerspectiveCamera);
    expect([cam.fov, cam.aspect, cam.near, cam.far]).toEqual([48, 1.6, NEAR, FAR]);
    expect(cam.position.toArray()).toEqual(PERSPECTIVE.position);
    const forward = cam.getWorldDirection(new Vector3());
    expect(forward.dot(new Vector3(0, 0, -1))).toBeCloseTo(1, 6);
    expect(isOrtho(PERSPECTIVE)).toBe(false);
  });

  it("kind 'ortho': OrthographicCamera, khung nhìn cao height, rộng height × tỉ lệ khung, zoom 1, near 0,1, far 500", () => {
    const cam = createCamera(ORTHO, 1.6);
    expect(cam).toBeInstanceOf(OrthographicCamera);
    expect([cam.top, cam.bottom, cam.near, cam.far, cam.zoom]).toEqual([6, -6, NEAR, FAR, 1]);
    expect(cam.right).toBeCloseTo(9.6, 9);
    expect(cam.left).toBeCloseTo(-9.6, 9);
    expect(isOrtho(ORTHO)).toBe(true);
  });
});

describe('fitCamera', () => {
  it('camera trực giao ở khung hẹp: nới theo minWidth (fitOrtho); zoom người xem chọn giữ nguyên', () => {
    const cam = createCamera(ORTHO, 1.6);
    cam.zoom = 2;
    const aspect = 390 / 844;
    fitCamera(cam, ORTHO, aspect);
    expect(cam.right - cam.left).toBeCloseTo(15.5, 6);
    expect(cam.zoom).toBe(2);
  });

  it('camera phối cảnh: fov theo minHorizontalFov như fitFov', () => {
    const cam = createCamera(PERSPECTIVE, 1.6);
    fitCamera(cam, PERSPECTIVE, 390 / 844);
    expect(cam.fov).toBeGreaterThan(48);
    expect(cam.aspect).toBeCloseTo(390 / 844, 9);
  });
});

describe('limitControls', () => {
  it('camera trực giao: zoom kẹp trong spec.zoom, khoảng cách không đụng tới (Phụ lục A.92); không xoay ngang quá azimuth', () => {
    const c = fakeControls();
    limitControls(c, ORTHO, false);
    expect([c.minZoom, c.maxZoom, c.enableZoom]).toEqual([1, 2.5, true]);
    expect([c.minDistance, c.maxDistance]).toEqual([0, Infinity]);
    expect([c.minAzimuthAngle, c.maxAzimuthAngle, c.minPolarAngle, c.maxPolarAngle]).toEqual([-1.3, 1.3, 0.35, 1.4]);
    expect(c.target.toArray()).toEqual(ORTHO.target);
    expect([c.enablePan, c.enableDamping]).toEqual([false, true]);
  });

  it('camera trực giao không khai báo zoom: tắt zoom; giảm chuyển động: tắt quán tính', () => {
    const c = fakeControls();
    const { zoom, ...noZoom } = ORTHO;
    limitControls(c, noZoom, true);
    expect([c.enableZoom, c.enableDamping]).toEqual([false, false]);
  });

  it('camera phối cảnh: như cũ (distance kẹp khoảng cách)', () => {
    const c = fakeControls();
    limitControls(c, PERSPECTIVE, false);
    expect([c.minDistance, c.maxDistance, c.enableZoom]).toEqual([3, 7, true]);
  });
});
