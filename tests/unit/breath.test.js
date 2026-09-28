// tests/unit/breath.test.js — camera "thở": lệch nhỏ, bị chặn, tất định; biên độ 0 thì đứng yên.
import { describe, it, expect } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { breathAmplitude, breathOffset } from '../../src/engine/gpu/breath.js';

describe('breathOffset', () => {
  it('biên độ 0 (hoặc thiếu) → không lệch', () => {
    expect(breathOffset(12.3, 0)).toEqual([0, 0, 0]);
    expect(breathOffset(12.3, undefined)).toEqual([0, 0, 0]);
  });

  it('mỗi trục bị chặn bởi biên độ; cùng t cho cùng kết quả (?freeze tất định)', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const [x, y, z] = breathOffset(t, 0.4);
      expect(Math.abs(x)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.4 * 0.35);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.4 * 0.6);
    }
    expect(breathOffset(7.5, 0.4)).toEqual(breathOffset(7.5, 0.4));
  });

  it('có chuyển động: hai thời điểm khác nhau cho độ lệch khác nhau', () => {
    expect(breathOffset(1, 0.4)).not.toEqual(breathOffset(3, 0.4));
  });
});

describe('breathAmplitude', () => {
  it('lấy CameraSpec.breathe; bức không khai báo thì 0', () => {
    expect(breathAmplitude({ breathe: 0.4 }, false)).toBe(0.4);
    expect(breathAmplitude({}, false)).toBe(0);
  });

  it('người xem xin giảm chuyển động thì camera không thở (§10)', () => {
    expect(breathAmplitude({ breathe: 0.4 }, true)).toBe(0);
  });
});

describe('thở với OrbitControls (cơ chế mà stage.breathe dựa vào)', () => {
  it('dời điểm nhìn thì camera giữ nguyên vị trí, chỉ quay theo (cái nhìn đảo chậm, không thị sai)', () => {
    const camera = new PerspectiveCamera(42, 16 / 10, 0.1, 400);
    camera.position.set(0, 6, 32);
    const controls = new OrbitControls(camera);
    controls.target.set(0, 2.2, -14);
    controls.update();
    const position = camera.position.clone();
    const before = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const [x, y, z] = breathOffset(3, 0.4);
    controls.target.set(x, 2.2 + y, -14 + z);
    controls.update();
    expect(camera.position.distanceTo(position)).toBeLessThan(1e-9);
    const after = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    expect(before.angleTo(after)).toBeGreaterThan(0);
    expect(before.angleTo(after)).toBeLessThan(0.4 / 40); // ≈ breathe / khoảng cách (rad)
  });
});
