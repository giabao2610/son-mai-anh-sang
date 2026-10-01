// @vitest-environment jsdom
// tests/unit/lot-lop.test.js — Lột lớp: input range đi ngược danh sách view, aria-valuetext là tên view, mài Normal khi cần.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vec4 } from 'three/tsl';
import * as lotLop from '../../src/engine/tools/lot-lop.js';
import t from '../../src/ui/strings.vi.js';

function fakeApi({ requireFails = false } = {}) {
  let normalReady = false;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'phu-bong:truoc-bloom', label: 'Trước bloom', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: normalReady },
      { id: 'depth', label: 'Depth', ready: true },
    ],
    requireView: vi.fn(async () => {
      if (requireFails) throw new Error('biên dịch hỏng');
      normalReady = true;
    }),
    redraw: vi.fn(async () => {}),
  };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const slide = (range, v) => {
  range.value = String(v);
  range.dispatchEvent(new Event('input', { bubbles: true }));
};

beforeEach(() => document.body.replaceChildren());

describe('Lột lớp', () => {
  it('một input range: sáu nấc cho sáu view, nấc phải cùng là ảnh cuối; nhãn và aria-valuetext là tên view', () => {
    const api = fakeApi();
    const tool = lotLop.mount(api);
    const range = api.el.querySelector('input[type="range"]');
    expect([range.min, range.max, range.step, range.value]).toEqual(['0', '5', '1', '5']);
    expect(range.getAttribute('aria-valuetext')).toBe('Ảnh cuối');
    expect(api.el.querySelector(`label[for="${range.id}"]`).textContent).toBe(t.tools['lot-lop'].label);
    expect(tool.onGesture).toBeUndefined(); // chạm vẫn tạo gợn sóng
    expect(tool.overlay(vec4(0, 0, 0, 1), () => vec4(1)).isNode).toBe(true);
  });

  it('kéo sang trái thì lột dần: mỗi nấc một view, vẽ lại; về nấc phải cùng là ảnh cuối', async () => {
    const api = fakeApi();
    lotLop.mount(api).activate(true);
    const range = api.el.querySelector('input[type="range"]');
    slide(range, 4);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Trước tone');
    expect(api.el.querySelector('output').textContent).toBe('Trước tone');
    slide(range, 0);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Depth');
    slide(range, 5);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Ảnh cuối');
    expect(api.redraw).toHaveBeenCalledTimes(3);
  });

  it('nấc Normal (chưa sẵn sàng): "đang mài…", requireView rồi mới hiện; hỏng thì báo và quay về view cũ', async () => {
    const api = fakeApi();
    lotLop.mount(api).activate(true);
    const range = api.el.querySelector('input[type="range"]');
    const status = api.el.querySelector('.tool-status');
    slide(range, 1);
    expect(status.textContent).toBe(t.toolStatus.grinding);
    await flush();
    expect(api.requireView).toHaveBeenCalledWith('normal');
    expect([status.textContent, range.getAttribute('aria-valuetext')]).toEqual(['', 'Normal']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = fakeApi({ requireFails: true });
    lotLop.mount(broken).activate(true);
    const r2 = broken.el.querySelector('input[type="range"]');
    slide(r2, 1);
    await flush();
    expect(broken.el.querySelector('.tool-status').textContent).toBe(t.toolStatus.failed);
    expect([r2.value, r2.getAttribute('aria-valuetext')]).toEqual(['5', 'Ảnh cuối']);
    warn.mockRestore();
  });

  it('bật hay tắt công cụ đều về ảnh cuối', async () => {
    const api = fakeApi();
    const tool = lotLop.mount(api);
    tool.activate(true);
    const range = api.el.querySelector('input[type="range"]');
    slide(range, 2);
    await flush();
    tool.activate(false);
    expect([range.value, range.getAttribute('aria-valuetext')]).toEqual(['5', 'Ảnh cuối']);
  });
});
