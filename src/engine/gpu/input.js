// engine/gpu/input.js — con trỏ trên canvas → cử chỉ có NDC, tia (Raycaster) và loại con trỏ; rê chuột → 'hover'; kéo để dành cho camera.
import { Raycaster, Vector2 } from 'three/webgpu';
import { GESTURE, createGestureTracker } from './gesture.js';

/** Phím bổ trợ: nhấn riêng chúng (thường là mở đầu một phím tắt) không phải là dùng trang. */
const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'OS'];

/**
 * Nghe pointer events trên canvas, phân loại bằng gesture.js, rồi xếp cử chỉ vào HÀNG ĐỢI.
 * run.js lấy hàng đợi ra ở đầu mỗi khung (drain), nên cử chỉ được xử lý TRONG khung:
 * có lưới bắt lỗi của khung, và thứ bức ghi lại theo cử chỉ (lúc bắt đầu, vị trí) khớp đồng hồ (kể cả ?freeze).
 * GĐ 4: mỗi cử chỉ mang `pointer` ('mouse' | 'touch' | 'pen'); rê chuột mà không bấm sinh cử chỉ 'hover' (hàng đợi giữ
 * tối đa MỘT, cái mới nhất), chỉ công cụ học nhận (Kính mài đi theo chuột).
 * @param {{ canvas: any, camera: any, controls?: any, pointer: any, win?: any, onQueue?: (kind: string) => void }} opts
 *   pointer: uniform vec2 (ctx.u.pointer), NDC của con trỏ, cho shader nào cần.
 *   onQueue(kind): gọi mỗi khi hàng đợi có cử chỉ mới, kèm loại của cử chỉ mới nhất (cảnh đứng yên ở ?freeze thì vẽ lại).
 * @returns {{ drain: () => object[], onFirst: (fn: () => void) => void, dispose: () => void }}
 */
export function createInput({ canvas, camera, controls = null, pointer, win = window, onQueue = () => {} }) {
  const tracker = createGestureTracker();
  const raycaster = new Raycaster();
  const queue = [];
  let first = null; // hàm gọi một lần ở lần tương tác đầu tiên: chạm canvas, hay phím đầu tiên (shell hiện lời mời)
  let holdTimer = null;
  let holdingCamera = false; // input.js đã khóa camera (đang giữ tay): chỉ khi đó mới được trả camera lại
  let kind = 'mouse'; // pointerType của lần chạm gần nhất: chạm, giữ, vuốt đều của con trỏ đó

  const ndcOf = (x, y) => {
    const r = canvas.getBoundingClientRect();
    return new Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  };
  /** Cử chỉ ở (x, y) px: NDC và một tia từ camera qua điểm đó; bức tự giao tia với mặt phẳng của nó. */
  const gestureAt = (name, x, y, type) => {
    const ndc = ndcOf(x, y);
    raycaster.setFromCamera(ndc, camera);
    return { kind: name, ndc: { x: ndc.x, y: ndc.y }, ray: raycaster.ray.clone(), pointer: type };
  };

  const emit = (events) => {
    for (const e of events) {
      const g = gestureAt(e.kind, e.x, e.y, kind);
      if (e.velocity) {
        const r = canvas.getBoundingClientRect();
        g.velocity = { x: (e.velocity.x / r.width) * 2, y: -(e.velocity.y / r.height) * 2 }; // NDC mỗi giây
      }
      // Đang giữ tay thì camera đứng yên: ngón tay thuộc về bức (OrbitControls bỏ qua khi enabled = false).
      if (controls && e.kind === 'hold-start') {
        controls.enabled = false;
        holdingCamera = true;
      }
      if (controls && e.kind === 'hold-end' && holdingCamera) {
        controls.enabled = true;
        holdingCamera = false;
      }
      queue.push(g);
    }
    if (events.length > 0) onQueue(events.at(-1).kind);
  };
  /** Rê chuột mà không bấm: 'hover', và hàng đợi chỉ giữ cái mới nhất (mỗi khung tối đa một). */
  const hover = (x, y) => {
    const g = gestureAt('hover', x, y, 'mouse');
    if (queue.at(-1)?.kind === 'hover') queue[queue.length - 1] = g;
    else queue.push(g);
    onQueue('hover');
  };

  const point = (e) => ({ id: e.pointerId ?? 1, x: e.clientX, y: e.clientY, t: win.performance.now(), primary: e.isPrimary });
  const clearHold = () => win.clearTimeout(holdTimer);

  const fireFirst = () => {
    first?.();
    first = null;
  };
  const onDown = (e) => {
    if (e.button > 0) return; // chỉ nút chính của chuột; chạm và bút luôn là 0
    kind = e.pointerType || 'mouse';
    fireFirst();
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
    if (e.pointerType === 'mouse' && e.buttons === 0) hover(p.x, p.y);
  };
  const onUp = (e) => {
    if (e.button > 0) return; // nhả nút phụ (chuột phải) không kết thúc cái giữ của nút chính
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
  // Pha capture: chạy TRƯỚC OrbitControls (gắn listener lúc dựng camera, trước input.js). Nhờ vậy khi ngón thứ hai
  // chạm xuống giữa lúc giữ, camera đã được thả kịp để OrbitControls nhận ngón đó (chụm zoom), thay vì bỏ qua nó.
  for (const [type, fn] of listeners) canvas.addEventListener(type, fn, { capture: true });
  // Rời trang giữa lúc giữ (chuyển tab, có cuộc gọi, khóa máy) thì không bao giờ có pointerup: coi như thả tay.
  // Điện thoại chuyển app thường chỉ ẩn trang (visibilitychange), không có blur.
  const onHidden = () => {
    if (win.document?.hidden) onCancel();
  };
  win.addEventListener('blur', onCancel);
  win.document?.addEventListener('visibilitychange', onHidden);
  // Người chỉ dùng bàn phím không chạm được canvas: phím đầu tiên (thường là Tab) cũng là lần tương tác đầu,
  // để lời mời mài lớp (một nút) hiện ra và đi tới được bằng Tab. Bỏ qua phím tắt (Cmd/Ctrl/Alt + …), phím bổ trợ
  // đứng một mình và phím giữ lặp: đó là việc của hệ điều hành hay trình duyệt, không phải người xem đang dùng trang.
  // Riêng Option+Tab thì tính: Safari mặc định chỉ đưa Tab qua ô nhập liệu, muốn tới nút phải bấm Option+Tab.
  const onKey = (e) => {
    const shortcut = e.ctrlKey || e.metaKey || (e.altKey && e.key !== 'Tab');
    if (e.repeat || shortcut || MODIFIER_KEYS.includes(e.key)) return;
    fireFirst();
  };
  win.addEventListener('keydown', onKey);

  return {
    /** Lấy hết cử chỉ đang chờ (hàng đợi rỗng sau lần gọi). */
    drain: () => queue.splice(0),
    onFirst(fn) {
      first = fn;
    },
    dispose() {
      clearHold();
      for (const [type, fn] of listeners) canvas.removeEventListener(type, fn, { capture: true });
      win.removeEventListener('blur', onCancel);
      win.removeEventListener('keydown', onKey);
      win.document?.removeEventListener('visibilitychange', onHidden);
      // Chỉ trả lại camera nếu chính input.js đã khóa nó (đang giữ tay lúc gỡ); ai khác khóa thì để yên.
      if (controls && holdingCamera) controls.enabled = true;
      holdingCamera = false;
      queue.length = 0;
    },
  };
}
