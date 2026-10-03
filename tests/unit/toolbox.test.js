// @vitest-environment jsdom
// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, móc lần vẽ, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ, chỗ của thanh công cụ trong trang.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToolbox } from '../../src/engine/gpu/toolbox.js';

/** views.js giả: một tap của lớp 'phu-bong', normal chưa sẵn sàng; setOverlays ghi lại các overlay được ghép. */
function fakeViews() {
  return {
    list: () => [
      { id: 'final', ready: true },
      { id: 'phu-bong:truoc-tone', ready: true, layerId: 'phu-bong', tapId: 'truoc-tone' },
      { id: 'emissive', ready: true },
      { id: 'normal', ready: false },
    ],
    require: vi.fn(async () => {}),
    setOverlays: vi.fn((entries) => {
      const broken = [];
      for (const e of entries) {
        try {
          e.fn('final', () => 'view');
        } catch {
          broken.push(e.id);
        }
      }
      return broken;
    }),
  };
}

/** Công cụ giả: ghi lại api nhận được, lời gọi activate, và trả `grab` cho cử chỉ. */
function fakeTool(id, { grab = false, overlay = true, mountError = null, overlayError = null } = {}) {
  const tool = { id, api: null, activate: vi.fn(), dispose: vi.fn(), gestures: [] };
  tool.mount = (api) => {
    if (mountError) throw mountError;
    tool.api = api;
    api.el.append(document.createElement('button'));
    return {
      overlay: overlay ? (c) => { if (overlayError) throw overlayError; return c; } : undefined,
      onGesture: (g) => { tool.gestures.push(g.kind); return grab; },
      activate: tool.activate,
      dispose: tool.dispose,
    };
  };
  return tool;
}

const t = { views: { final: 'Ảnh cuối', emissive: 'Chỉ emissive', normal: 'Normal' } };
const content = { layers: { 'phu-bong': { taps: { 'truoc-tone': 'Trước tone' } } } };

beforeEach(() => {
  document.body.replaceChildren();
  delete document.body.dataset.tool;
});

describe('createToolbox', () => {
  it('gắn mọi công cụ: mỗi công cụ một ô trong [data-toolbar]; api có views (kèm nhãn), requireView, el, t, redraw', async () => {
    const views = fakeViews();
    const redraw = vi.fn(async () => {});
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh, fakeTool('lot')], views, doc: document, t, content, redraw });
    const bar = document.querySelector('[data-toolbar]');
    expect(bar.hidden).toBe(true);
    expect([...bar.querySelectorAll('[data-tool-slot]')].map((el) => el.dataset.toolSlot)).toEqual(['kinh', 'lot']);
    expect(kinh.api.el).toBe(bar.querySelector('[data-tool-slot="kinh"]'));
    expect(kinh.api.views()).toEqual([
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: false },
    ]);
    await kinh.api.requireView('normal');
    expect(views.require).toHaveBeenCalledWith('normal');
    expect([kinh.api.t, kinh.api.redraw]).toEqual([t, redraw]);
    expect(views.setOverlays.mock.calls[0][0].map((e) => e.id)).toEqual(['kinh', 'lot']);
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: false }, { id: 'lot', on: false }]);
  });

  it('api.draws (GĐ 5): mount nhận đúng móc lần vẽ của cảnh, chỉ năm hàm (không có begin/end); không có móc thì api.draws là null', () => {
    // Móc như scene.js giữ (draws.js): năm hàm của DrawProbe, cộng begin/end mà scene.js gọi quanh mỗi pipeline.render().
    const list = [];
    const counts = { scene: 3, reflection: 2, other: 24 };
    const draws = {
      start: vi.fn(), stop: vi.fn(), list: vi.fn(() => list), limit: vi.fn(), counts: vi.fn(() => counts), begin: vi.fn(), end: vi.fn(),
    };
    const soi = fakeTool('soi');
    createToolbox({ tools: [soi], views: fakeViews(), doc: document, t, content, draws });
    const probe = soi.api.draws;
    // Công cụ không bao giờ tự mở hay đóng một khung ghi, và không thay được hàm nào của móc.
    expect(Object.keys(probe).sort()).toEqual(['counts', 'limit', 'list', 'start', 'stop']);
    expect(Object.isFrozen(probe)).toBe(true);
    probe.start();
    probe.limit(2);
    expect(probe.list()).toBe(list);
    expect(probe.counts()).toBe(counts);
    probe.stop();
    expect([draws.start, draws.stop, draws.list, draws.counts].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
    expect(draws.limit.mock.calls).toEqual([[2]]);
    expect(draws.begin).not.toHaveBeenCalled();
    expect(draws.end).not.toHaveBeenCalled();
    const kinh = fakeTool('kinh');
    createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content });
    expect(kinh.api.draws).toBeNull();
  });

  it('chữ của bức tải hỏng (content = null): nhãn tap rơi về id của tap, công cụ vẫn gắn và dùng được', () => {
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content: null });
    expect(kinh.api.views().map((v) => v.label)).toEqual(['Ảnh cuối', 'truoc-tone', 'Chỉ emissive', 'Normal']);
    toolbox.set('kinh');
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: true }]);
  });

  it('mỗi lúc MỘT công cụ: bật cái này thì cái kia tắt; body[data-tool]; null tắt hết; id lạ thì ném lỗi', () => {
    const kinh = fakeTool('kinh');
    const lot = fakeTool('lot');
    const toolbox = createToolbox({ tools: [kinh, lot], views: fakeViews(), doc: document, t, content });
    const bar = document.querySelector('[data-toolbar]');
    toolbox.set('kinh');
    expect([bar.hidden, document.body.dataset.tool]).toEqual([false, 'kinh']);
    expect(bar.querySelector('[data-tool-slot="kinh"]').hidden).toBe(false);
    toolbox.set('lot');
    expect(kinh.activate.mock.calls).toEqual([[true], [false]]);
    expect(lot.activate.mock.calls).toEqual([[true]]);
    expect(bar.querySelector('[data-tool-slot="kinh"]').hidden).toBe(true);
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: false }, { id: 'lot', on: true }]);
    toolbox.set(null);
    expect([bar.hidden, document.body.dataset.tool]).toEqual([true, undefined]);
    expect(lot.activate.mock.calls).toEqual([[true], [false]]);
    expect(() => toolbox.set('khong-co')).toThrow('Không có công cụ "khong-co"');
  });

  it('cử chỉ: chỉ công cụ ĐANG BẬT nhận; nó trả true thì dừng ở đó (bức không nhận)', () => {
    const kinh = fakeTool('kinh', { grab: true });
    const lot = fakeTool('lot', { grab: false });
    const toolbox = createToolbox({ tools: [kinh, lot], views: fakeViews(), doc: document, t, content });
    expect(toolbox.gesture({ kind: 'tap' })).toBe(false); // chưa bật công cụ nào
    toolbox.set('kinh');
    expect(toolbox.gesture({ kind: 'tap' })).toBe(true);
    toolbox.set('lot');
    expect(toolbox.gesture({ kind: 'hold-start' })).toBe(false);
    expect([kinh.gestures, lot.gestures]).toEqual([['tap'], ['hold-start']]);
  });

  it('công cụ ném lỗi khi gắn hay khi ghép overlay: cảnh báo, bỏ công cụ đó (không có ô, không có trong list), còn lại vẫn chạy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = fakeTool('hong', { mountError: new Error('gắn hỏng') });
    const ugly = fakeTool('xau', { overlayError: new Error('node sai') });
    const toolbox = createToolbox({ tools: [bad, ugly, fakeTool('tot')], views: fakeViews(), doc: document, t, content });
    expect(toolbox.list().map((x) => x.id)).toEqual(['tot']);
    expect(document.querySelectorAll('[data-tool-slot]')).toHaveLength(1);
    expect(ugly.dispose).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe('Công cụ "hong" gắn không được, bỏ công cụ này:');
    warn.mockRestore();
  });

  it('thứ tự Tab (GĐ 5): chưa có thanh lớp thì thanh công cụ gắn cuối body; "Dựng lại cảnh" khi đã có thì gắn NGAY SAU thanh lớp, trước Sổ tay', () => {
    const first = createToolbox({ tools: [fakeTool('kinh')], views: fakeViews(), doc: document, t, content });
    expect(document.body.lastElementChild.hasAttribute('data-toolbar')).toBe(true);
    // Thanh lớp và Sổ tay của ui/workshop.js sống qua các lần dựng lại (đang đóng hay mở thì thứ tự vẫn thế); cảnh cũ bị gỡ.
    const panel = (attr) => {
      const el = document.createElement('div');
      el.setAttribute(attr, '');
      el.hidden = true;
      return el;
    };
    document.body.append(panel('data-rail'), panel('data-notebook'), document.createElement('aside'));
    first.dispose();
    createToolbox({ tools: [fakeTool('kinh')], views: fakeViews(), doc: document, t, content });
    const names = [...document.body.children].map((el) => ['rail', 'toolbar', 'notebook'].find((a) => el.hasAttribute(`data-${a}`)) ?? el.localName);
    expect(names).toEqual(['rail', 'toolbar', 'notebook', 'aside']);
  });

  it('không có công cụ nào: không đụng tới DOM; dispose gỡ công cụ, thanh công cụ và body[data-tool]', () => {
    const empty = createToolbox({ tools: [], views: fakeViews() });
    expect(empty.list()).toEqual([]);
    empty.dispose();
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content });
    toolbox.set('kinh');
    toolbox.dispose();
    expect(kinh.dispose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-toolbar]')).toBeNull();
    expect(document.body.dataset.tool).toBeUndefined();
  });
});
