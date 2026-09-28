// tests/unit/input.test.js — con trỏ → hàng đợi cử chỉ có NDC + tia; ctx.u.pointer; camera đứng yên khi giữ tay.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerspectiveCamera, Vector2 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { GESTURE } from '../../src/engine/gpu/gesture.js';
import { createInput } from '../../src/engine/gpu/input.js';

/** Canvas giả 200 × 100 ở góc trang: EventTarget thật của Node + kích thước. */
function fakeCanvas() {
  const canvas = new EventTarget();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  return canvas;
}
/** PointerEvent tối thiểu: Event thật, thêm các trường input.js đọc. */
const pointer = (type, x, y, extra = {}) => Object.assign(new Event(type), { clientX: x, clientY: y, pointerId: 1, button: 0, ...extra });

let canvas;
let camera;
let controls;
let u;
let input;
let clock;
let win;
beforeEach(() => {
  vi.useFakeTimers();
  clock = 0;
  canvas = fakeCanvas();
  camera = new PerspectiveCamera(45, 2, 0.1, 100);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  controls = { enabled: true };
  u = uniform(new Vector2());
  win = Object.assign(new EventTarget(), { performance: { now: () => clock }, setTimeout, clearTimeout });
  input = createInput({ canvas, camera, controls, pointer: u, win });
});
afterEach(() => {
  input.dispose();
  vi.useRealTimers();
});

describe('createInput', () => {
  it('chạm giữa canvas → tap ở NDC (0, 0), tia đi từ camera về phía trước', () => {
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    clock = 80;
    canvas.dispatchEvent(pointer('pointerup', 100, 50));
    const [g] = input.drain();
    expect(g.kind).toBe('tap');
    expect(g.ndc).toEqual({ x: 0, y: 0 });
    expect(g.ray.origin.toArray()).toEqual([0, 5, 10]);
    const dir = camera.getWorldDirection(g.ray.direction.clone());
    expect(g.ray.direction.dot(dir)).toBeCloseTo(1, 6);
    expect(input.drain()).toEqual([]); // hàng đợi rỗng sau khi lấy
  });

  it('pointermove cập nhật ctx.u.pointer (NDC), kể cả khi chỉ rê chuột', () => {
    canvas.dispatchEvent(pointer('pointermove', 200, 0));
    expect(u.value.toArray()).toEqual([1, 1]);
  });

  it('giữ yên holdMs → hold-start và camera đứng yên; thả → hold-end, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    expect(controls.enabled).toBe(false);
    canvas.dispatchEvent(pointer('pointermove', 60, 50));
    canvas.dispatchEvent(pointer('pointerup', 60, 50));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-move', 'hold-end']);
    expect(controls.enabled).toBe(true);
  });

  it('onFirst: gọi đúng một lần ở lần chạm đầu tiên', () => {
    const first = vi.fn();
    input.onFirst(first);
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    canvas.dispatchEvent(pointer('pointerup', 1, 1));
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('nhấn giữ trên điện thoại không mở menu ngữ cảnh', () => {
    const menu = new Event('contextmenu', { cancelable: true });
    canvas.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
  });

  it('rời trang giữa lúc giữ (blur, pointercancel) → hold-end, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    win.dispatchEvent(new Event('blur'));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end']);
    expect(controls.enabled).toBe(true);
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock += GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    canvas.dispatchEvent(pointer('pointercancel', 50, 50));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end']);
  });

  it('bỏ qua nút phụ của chuột; dispose gỡ listener', () => {
    canvas.dispatchEvent(pointer('pointerdown', 1, 1, { button: 2 }));
    canvas.dispatchEvent(pointer('pointerup', 1, 1, { button: 2 }));
    expect(input.drain()).toEqual([]);
    input.dispose();
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    canvas.dispatchEvent(pointer('pointerup', 1, 1));
    expect(input.drain()).toEqual([]);
  });
});
