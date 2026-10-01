// @vitest-environment jsdom
// tests/unit/kinh-mai.test.js — Kính mài: thanh điều khiển (hình, view, tay nắm gạt), mài Normal khi cần, cử chỉ, overlay dựng được.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vec4 } from 'three/tsl';
import * as kinhMai from '../../src/engine/tools/kinh-mai.js';
import t from '../../src/ui/strings.vi.js';

/** ToolApi giả: bốn view (normal chưa sẵn sàng tới khi requireView), ô DOM thật, redraw ghi lại.
 *  hold: requireView chờ tới khi gọi finish() (mài Normal lâu, như trên máy yếu). */
function fakeApi({ requireFails = false, hold = false } = {}) {
  let normalReady = false;
  let release = null;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: normalReady },
    ],
    requireView: vi.fn(async () => {
      if (hold) await new Promise((resolve) => { release = resolve; });
      if (requireFails) throw new Error('biên dịch hỏng');
      normalReady = true;
    }),
    redraw: vi.fn(async () => {}),
    finish: () => release?.(),
  };
}
const gesture = (kind, pointer, x = 0.5, y = -0.5) => ({ kind, pointer, ndc: { x, y } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => document.body.replaceChildren());

describe('Kính mài', () => {
  it('thanh điều khiển: hai nút hình (Tròn đang chọn), nút view lấy từ views() bỏ ảnh cuối; tay nắm gạt ẩn khi kính tròn', () => {
    const api = fakeApi();
    kinhMai.mount(api);
    const shapes = [...api.el.querySelectorAll('[data-shape]')];
    expect(shapes.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Tròn', 'true'], ['Gạt', 'false']]);
    expect([...api.el.querySelectorAll('[data-view]')].map((b) => b.dataset.view)).toEqual(['phu-bong:truoc-tone', 'emissive', 'normal']);
    const handle = api.el.querySelector('[role="slider"]');
    expect(handle.hidden).toBe(true);
    expect(handle.getAttribute('aria-label')).toBe(t.tools['kinh-mai'].handle);
    expect(api.el.querySelector('.tool-status').getAttribute('aria-live')).toBe('polite');
  });

  it('overlay dựng được node (If trong Fn; thân Fn chỉ chạy lúc three biên dịch shader)', () => {
    const lens = kinhMai.mount(fakeApi());
    expect(lens.overlay(vec4(0, 0, 0, 1), () => vec4(1, 1, 1, 1)).isNode).toBe(true);
    expect(kinhMai.LENS_RADIUS).toBe(0.18);
  });

  it('cử chỉ: tắt thì không giữ gì; kính tròn đi theo chuột (hover), ngón tay và bút chạm/giữ để đặt kính; chuột bấm, vuốt thì để cho bức', () => {
    const lens = kinhMai.mount(fakeApi());
    expect(lens.onGesture(gesture('hover', 'mouse'))).toBe(false);
    lens.activate(true);
    expect(lens.onGesture(gesture('hover', 'mouse'))).toBe(true);
    expect(lens.onGesture(gesture('tap', 'mouse'))).toBe(false); // gợn sóng như thường
    for (const kind of ['tap', 'hold-start', 'hold-move', 'hold-end']) {
      expect(lens.onGesture(gesture(kind, 'touch')), kind).toBe(true);
    }
    expect(lens.onGesture(gesture('tap', 'pen'))).toBe(true);
    expect(lens.onGesture(gesture('swipe', 'touch'))).toBe(false); // sương xoáy vẫn là của bức
  });

  it('hình gạt: tay nắm hiện; mũi tên ±2%, Home/End; mỗi lần đổi thì vẽ lại; canvas không giữ cử chỉ nào', async () => {
    const api = fakeApi();
    const lens = kinhMai.mount(api);
    lens.activate(true);
    api.el.querySelector('[data-shape="gat"]').click();
    const handle = api.el.querySelector('[role="slider"]');
    expect(handle.hidden).toBe(false);
    expect([handle.getAttribute('aria-valuenow'), handle.getAttribute('aria-valuetext')]).toEqual(['50', '50%']);
    const key = (k) => handle.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('ArrowRight');
    expect(handle.getAttribute('aria-valuenow')).toBe('52');
    key('ArrowLeft');
    key('ArrowLeft');
    expect(handle.getAttribute('aria-valuenow')).toBe('48');
    key('Home');
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    key('End');
    expect(handle.style.getPropertyValue('--split')).toBe('1');
    expect(api.redraw).toHaveBeenCalledTimes(6); // đổi hình + 5 phím
    expect(lens.onGesture(gesture('tap', 'touch'))).toBe(false);
  });

  it('chọn view Normal (chưa sẵn sàng): "đang mài…" trong vùng aria-live, requireView, xong mới đổi; hỏng thì báo và giữ view cũ', async () => {
    const api = fakeApi();
    kinhMai.mount(api).activate(true);
    const status = api.el.querySelector('.tool-status');
    const normal = api.el.querySelector('[data-view="normal"]');
    normal.click();
    expect(status.textContent).toBe(t.toolStatus.grinding);
    expect(normal.getAttribute('aria-pressed')).toBe('false');
    await flush();
    expect(api.requireView).toHaveBeenCalledWith('normal');
    expect(status.textContent).toBe('');
    expect(normal.getAttribute('aria-pressed')).toBe('true');
    const broken = fakeApi({ requireFails: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    kinhMai.mount(broken).activate(true);
    broken.el.querySelector('[data-view="normal"]').click();
    await flush();
    expect(broken.el.querySelector('.tool-status').textContent).toBe(t.toolStatus.failed);
    expect(broken.el.querySelector('[data-view="phu-bong:truoc-tone"]').getAttribute('aria-pressed')).toBe('true');
    warn.mockRestore();
  });

  it('Normal còn đang mài mà chọn view khác, hay tắt kính: lần chọn cũ về muộn không đè lên lần sau (lần chọn sau cùng thắng)', async () => {
    const pressed = (api) => [...api.el.querySelectorAll('[data-view]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.view);
    // Đổi ý trong lúc chờ: chọn Emissive (sẵn sàng) thì Emissive hiện ngay, và vẫn là Emissive khi Normal mài xong.
    const api = fakeApi({ hold: true });
    kinhMai.mount(api).activate(true);
    const status = api.el.querySelector('.tool-status');
    api.el.querySelector('[data-view="normal"]').click();
    await flush();
    expect(status.textContent).toBe(t.toolStatus.grinding);
    api.el.querySelector('[data-view="emissive"]').click();
    await flush();
    expect([pressed(api), status.textContent]).toEqual([['emissive'], '']);
    api.finish();
    await flush();
    expect([pressed(api), status.textContent]).toEqual([['emissive'], '']);
    // Tắt kính trong lúc chờ: bật lại vẫn là view cũ, không còn "đang mài…".
    const off = fakeApi({ hold: true });
    const lens = kinhMai.mount(off);
    lens.activate(true);
    off.el.querySelector('[data-view="normal"]').click();
    await flush();
    lens.activate(false);
    off.finish();
    await flush();
    lens.activate(true);
    expect([pressed(off), off.el.querySelector('.tool-status').textContent]).toEqual([['phu-bong:truoc-tone'], '']);
  });
});
