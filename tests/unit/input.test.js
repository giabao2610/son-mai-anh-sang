// tests/unit/input.test.js — con trỏ → hàng đợi cử chỉ có NDC + tia; ctx.u.pointer; camera đứng yên khi giữ tay.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
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
  win = Object.assign(new EventTarget(), {
    performance: { now: () => clock },
    setTimeout,
    clearTimeout,
    document: Object.assign(new EventTarget(), { hidden: false }),
  });
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

  it('mất pointerup giữa lúc giữ: lần chạm sau khép cái giữ cũ, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    expect(controls.enabled).toBe(false);
    clock = 2000;
    canvas.dispatchEvent(pointer('pointerdown', 80, 80)); // pointerup trước đó không bao giờ tới
    expect(controls.enabled).toBe(true);
    canvas.dispatchEvent(pointer('pointerup', 80, 80));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end', 'tap']);
  });

  it('ngón thứ hai giữa lúc giữ: camera (nghe TRƯỚC input.js) đã được thả khi thấy ngón đó', () => {
    // OrbitControls gắn listener lúc dựng camera, trước input.js, và bỏ qua pointerdown khi enabled = false.
    // input.js nghe ở pha capture nên chạy trước: thả camera kịp để OrbitControls nhận ngón thứ hai (chụm zoom).
    // jsdom (như trình duyệt) gọi listener capture trước ở chính phần tử đích; EventTarget của Node thì không.
    const { window } = new JSDOM('<canvas></canvas>');
    const el = window.document.querySelector('canvas');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
    const seen = [];
    el.addEventListener('pointerdown', (e) => seen.push([e.pointerId, controls.enabled]));
    const late = createInput({ canvas: el, camera, controls, pointer: u, win });
    const down = (id, x) => Object.assign(new window.Event('pointerdown'), { clientX: x, clientY: 50, pointerId: id, button: 0 });
    el.dispatchEvent(down(1, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    expect(controls.enabled).toBe(false);
    el.dispatchEvent(down(2, 150));
    expect(seen).toEqual([[1, true], [2, true]]);
    late.dispose();
  });

  it('onFirst: gọi đúng một lần ở lần chạm đầu tiên', () => {
    const first = vi.fn();
    input.onFirst(first);
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    canvas.dispatchEvent(pointer('pointerup', 1, 1));
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('onFirst: người chỉ dùng bàn phím → phím đầu tiên cũng tính, một lần; phím tắt, phím bổ trợ thì không; dispose gỡ', () => {
    const first = vi.fn();
    input.onFirst(first);
    const key = (k, extra = {}) => win.dispatchEvent(Object.assign(new Event('keydown'), { key: k, ...extra }));
    // Phím tắt của hệ điều hành hay trình duyệt (Cmd+Tab, Cmd+Opt+I, Ctrl+R…) và phím bổ trợ đứng một mình: không phải
    // người xem đang dùng trang, nên gợi ý "Chạm vào…" của người dùng chuột phải còn nguyên.
    key('Meta');
    key('Tab', { metaKey: true });
    key('i', { altKey: true, metaKey: true });
    key('r', { ctrlKey: true });
    key('Shift');
    key('Tab', { repeat: true });
    expect(first).not.toHaveBeenCalled();
    key('Tab', { shiftKey: true }); // Shift+Tab vẫn là đi lùi giữa các ô: tính
    expect(first).toHaveBeenCalledTimes(1);
    key('Tab');
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    expect(first).toHaveBeenCalledTimes(1);
    const later = vi.fn();
    input.onFirst(later);
    input.dispose();
    key('Tab');
    expect(later).not.toHaveBeenCalled();
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

  it('tab bị ẩn giữa lúc giữ (điện thoại chuyển app: không có blur) → hold-end, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    win.document.dispatchEvent(new Event('visibilitychange')); // vẫn hiện: không làm gì
    expect(controls.enabled).toBe(false);
    win.document.hidden = true;
    win.document.dispatchEvent(new Event('visibilitychange'));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end']);
    expect(controls.enabled).toBe(true);
  });

  it('nhả nút phải giữa lúc giữ nút trái: cái giữ vẫn tiếp tục', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    canvas.dispatchEvent(pointer('pointerup', 50, 50, { button: 2 }));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start']);
    expect(controls.enabled).toBe(false);
  });

  it('vuốt nhanh qua canvas → swipe kèm vận tốc tính theo NDC mỗi giây', () => {
    canvas.dispatchEvent(pointer('pointerdown', 20, 50));
    clock = 50;
    canvas.dispatchEvent(pointer('pointermove', 60, 50));
    clock = 100;
    canvas.dispatchEvent(pointer('pointerup', 120, 50));
    const [g] = input.drain();
    expect(g.kind).toBe('swipe');
    // 100 px trong 100 ms trên canvas rộng 200 px = 1000 px/s = 10 NDC/s theo trục x; trục y đảo chiều.
    expect(g.velocity.x).toBeCloseTo(10, 6);
    expect(g.velocity.y).toBeCloseTo(0, 6);
    expect(controls.enabled).toBe(true);
  });

  it('dispose chỉ trả camera khi chính input.js đã khóa nó', () => {
    controls.enabled = false; // ai khác (một công cụ) đang khóa camera
    input.dispose();
    expect(controls.enabled).toBe(false);
    controls.enabled = true;
    const again = createInput({ canvas, camera, controls, pointer: u, win });
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock += GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    expect(controls.enabled).toBe(false);
    again.dispose(); // gỡ giữa lúc giữ: trả camera
    expect(controls.enabled).toBe(true);
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
