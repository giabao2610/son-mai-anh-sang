// engine/gpu/input.js — con trỏ trên canvas → cử chỉ có NDC và tia (Raycaster), cập nhật ctx.u.pointer; kéo để dành cho camera.
import { Raycaster, Vector2 } from 'three/webgpu';
import { GESTURE, createGestureTracker } from './gesture.js';

/**
 * Nghe pointer events trên canvas, phân loại bằng gesture.js, rồi xếp cử chỉ vào HÀNG ĐỢI.
 * run.js lấy hàng đợi ra ở đầu mỗi khung (drain), nên cử chỉ được xử lý TRONG khung:
 * có lưới bắt lỗi của khung, và thời điểm của gợn sóng khớp đồng hồ (kể cả ?freeze).
 * @param {{ canvas: any, camera: any, controls?: any, pointer: any, win?: any }} opts
 *   pointer: uniform vec2 (ctx.u.pointer), NDC của con trỏ, cho shader nào cần.
 * @returns {{ drain: () => object[], onFirst: (fn: () => void) => void, dispose: () => void }}
 */
export function createInput({ canvas, camera, controls = null, pointer, win = window }) {
  const tracker = createGestureTracker();
  const raycaster = new Raycaster();
  const queue = [];
  let first = null; // hàm gọi một lần ở lần chạm đầu tiên (shell hiện lời mời)
  let holdTimer = null;

  const ndcOf = (x, y) => {
    const r = canvas.getBoundingClientRect();
    return new Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  };

  /** Mỗi cử chỉ kèm NDC và một tia từ camera qua điểm chạm; bức tự giao tia với mặt phẳng của nó. */
  const emit = (events) => {
    for (const e of events) {
      const ndc = ndcOf(e.x, e.y);
      raycaster.setFromCamera(ndc, camera);
      const g = { kind: e.kind, ndc: { x: ndc.x, y: ndc.y }, ray: raycaster.ray.clone() };
      if (e.velocity) {
        const r = canvas.getBoundingClientRect();
        g.velocity = { x: (e.velocity.x / r.width) * 2, y: -(e.velocity.y / r.height) * 2 }; // NDC mỗi giây
      }
      // Đang giữ tay thì camera đứng yên: ngón tay thuộc về bức (OrbitControls bỏ qua khi enabled = false).
      if (controls && e.kind === 'hold-start') controls.enabled = false;
      if (controls && e.kind === 'hold-end') controls.enabled = true;
      queue.push(g);
    }
  };

  const point = (e) => ({ id: e.pointerId ?? 1, x: e.clientX, y: e.clientY, t: win.performance.now() });
  const clearHold = () => win.clearTimeout(holdTimer);

  const onDown = (e) => {
    if (e.button > 0) return; // chỉ nút chính của chuột; chạm và bút luôn là 0
    first?.();
    first = null;
    emit(tracker.down(point(e)));
    clearHold();
    holdTimer = win.setTimeout(() => emit(tracker.poll(win.performance.now())), GESTURE.holdMs);
  };
  const onMove = (e) => {
    const p = point(e);
    const ndc = ndcOf(p.x, p.y);
    pointer.value.set(ndc.x, ndc.y);
    emit(tracker.poll(p.t));
    emit(tracker.move(p));
  };
  const onUp = (e) => {
    clearHold();
    emit(tracker.up(point(e)));
  };
  const onCancel = () => {
    clearHold();
    emit(tracker.cancel());
  };
  // Nhấn giữ trên điện thoại mở menu ngữ cảnh (và hủy con trỏ): chặn đi, vì "giữ" là cử chỉ của bức.
  const onMenu = (e) => e.preventDefault();

  const listeners = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onCancel],
    ['contextmenu', onMenu],
  ];
  for (const [type, fn] of listeners) canvas.addEventListener(type, fn);
  // Rời trang giữa lúc giữ (chuyển tab, có cuộc gọi) thì không bao giờ có pointerup: coi như thả tay.
  win.addEventListener('blur', onCancel);

  return {
    /** Lấy hết cử chỉ đang chờ (hàng đợi rỗng sau lần gọi). */
    drain: () => queue.splice(0),
    onFirst(fn) {
      first = fn;
    },
    dispose() {
      clearHold();
      for (const [type, fn] of listeners) canvas.removeEventListener(type, fn);
      win.removeEventListener('blur', onCancel);
      if (controls) controls.enabled = true;
      queue.length = 0;
    },
  };
}
