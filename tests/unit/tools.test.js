// @vitest-environment jsdom
// tests/unit/tools.test.js — luật chung của mọi công cụ học (engine/tools/index.js): giữ 'tap' thì giữ cả 'double-tap', với mọi loại con trỏ, trước và sau khi bật, ở mọi hình.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tools } from '../../src/engine/tools/index.js';
import t from '../../src/ui/strings.vi.js';

/** ToolApi giả đủ cho mọi công cụ: vài view đã sẵn sàng, ô DOM thật, móc lần vẽ chưa ghi khung nào. */
function fakeApi() {
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'depth', label: 'Depth', ready: true },
    ],
    requireView: vi.fn(async () => {}),
    redraw: vi.fn(async () => {}),
    draws: { start: vi.fn(), stop: vi.fn(), limit: vi.fn(), list: () => [], counts: () => ({ scene: 0, reflection: 0, other: 0 }) },
  };
}

beforeEach(() => document.body.replaceChildren());

describe.each(tools.map((tool) => [tool.id, tool]))('công cụ %s', (id, tool) => {
  // Hợp đồng [5] (contracts/runtime.js, ToolInstance.onGesture): 'double-tap' tới ngay sau 'tap' thứ hai. Công cụ giữ hai 'tap'
  // mà để lọt 'double-tap' thì bức nhận một cú chạm hai lần không có hai 'tap' làm nên nó: Ao Sen Đêm thả hoa đăng ngay dưới
  // Kính mài, điều người xem không định. Công cụ thứ tư sau này cũng phải giữ luật này.
  it("giữ 'tap' thì giữ cả 'double-tap' (ngón tay, bút, chuột; trước và sau khi bật; mọi hình chọn bằng nút [data-shape])", () => {
    const api = fakeApi();
    const instance = tool.mount(api);
    const held = (kind, pointer) => Boolean(instance.onGesture?.({ kind, pointer, ndc: { x: 0.25, y: -0.4 } }));
    const check = (state) => {
      for (const pointer of ['touch', 'pen', 'mouse']) {
        expect(!held('tap', pointer) || held('double-tap', pointer), `${id}, ${state}, ${pointer}`).toBe(true);
      }
    };
    check('chưa bật');
    instance.activate?.(true);
    check('vừa bật');
    for (const button of api.el.querySelectorAll('[data-shape]')) {
      button.click();
      check(`hình ${button.dataset.shape}`);
    }
    instance.dispose();
  });
});
