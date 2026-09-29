// @vitest-environment jsdom
// tests/unit/workshop.test.js — thanh lớp + Sổ tay + chế độ mài, chạy trên một bàn thợ giả (không three).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountWorkshop } from '../../src/ui/workshop.js';
import t from '../../src/ui/strings.vi.js';

const meta = {
  layers: [
    { id: 'cot', name: 'Cốt', files: ['a/l1.js'] },
    { id: 'hai', name: 'Hai', files: ['a/l2.js'], poem: { lines: ['Một câu thơ'], source: 'Ca dao' } },
    { id: 'ba', name: 'Ba', files: ['a/l3.js'] },
  ],
};
const content = {
  hint: 'x',
  layers: {
    cot: { understand: 'Cốt là đất sét.', learned: ['Instancing'], readMore: [{ title: 'Đọc', url: 'https://example.org/' }], knobs: { size: 'Cỡ lá' } },
    hai: {
      understand: 'Lớp hai.',
      diagram: '<svg viewBox="0 0 10 10"><title>Sơ đồ</title></svg>',
      learned: ['Fresnel'],
      readMore: [],
      knobs: {},
      experiments: { pha: { label: 'Phá thử', explain: 'Xem chuyện gì xảy ra.' } },
      readouts: { dinh: 'Số đỉnh' },
    },
  },
};

/** Bàn thợ giả: đủ các hàm mà Sổ tay và thanh lớp gọi, ghi lại lời gọi. */
function fakeStudio() {
  const weights = { cot: 1, hai: 1, ba: 1 };
  const on = new Set();
  return {
    calls: [],
    layers: () => [
      { id: 'cot', knobs: [{ id: 'size', kind: 'number', via: 'uniform', min: 0, max: 1, step: 0.1 }], experiments: [], readouts: [] },
      { id: 'hai', knobs: [], experiments: [{ id: 'pha', kind: 'toggle' }], readouts: [{ id: 'dinh', unit: '' }] },
      { id: 'ba', knobs: [], experiments: [], readouts: [] },
    ],
    weight: (id) => ({ value: weights[id], target: weights[id] }),
    setWeight(id, v, options) {
      this.calls.push(['setWeight', id, v, options]);
      weights[id] = v;
    },
    knobs: () => ({ size: 0.5 }),
    setKnob: vi.fn(async () => {}),
    experiment: (layerId, id) => on.has(`${layerId}.${id}`),
    toggleExperiment: vi.fn(async (layerId, id, value) => (value ? on.add(`${layerId}.${id}`) : on.delete(`${layerId}.${id}`))),
    readouts: () => [{ id: 'dinh', value: 1234, unit: '' }],
    stats: () => ({ drawCalls: 21, triangles: 90000, ms: 16.66 }),
  };
}

const loadCode = async (file) => ({ html: `<pre><code><span class="line" data-line="1">${file}</span><span class="line" data-line="2">y</span></code></pre>`, knobs: { size: [2] } });
let knobsModule;
const loadKnobs = vi.fn(async () => knobsModule);

function mount(studio, extra = {}) {
  const workshop = mountWorkshop(document, { meta, content, t, studio: () => studio, notebook: { loadCode, loadKnobs }, ...extra });
  const $ = (sel) => document.querySelector(sel);
  return { workshop, $, rail: $('[data-rail]'), notebook: $('[data-notebook]') };
}

beforeEach(() => {
  document.body.replaceChildren();
  knobsModule = { mountKnobs: vi.fn((container, opts) => ({ opts, refresh: vi.fn(), dispose: vi.fn() })) };
  loadKnobs.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('chế độ mài', () => {
  it('open({ grind }) → mọi lớp trừ Cốt tween về 0; thanh lớp hiện; Sổ tay mở trang Hiểu của Cốt', () => {
    const studio = fakeStudio();
    const { workshop, rail, notebook } = mount(studio);
    expect(rail.hidden).toBe(true);
    workshop.open({ grind: true });
    expect(rail.hidden).toBe(false);
    expect(studio.calls).toEqual([['setWeight', 'hai', 0, { tween: true }], ['setWeight', 'ba', 0, { tween: true }]]);
    expect(workshop.layer).toBe('cot');
    expect(notebook.querySelector('h2').textContent).toBe('Cốt');
    expect(notebook.querySelector('.nb-no').textContent).toBe(t.notebook.layerNo(1, 3));
    expect(notebook.querySelector('[data-tab="hieu"]').getAttribute('aria-selected')).toBe('true');
    expect(rail.querySelector('[data-layer="cot"] .rail-name').getAttribute('aria-current')).toBe('true');
    workshop.dispose();
  });

  it('"Phủ lớp tiếp theo" phủ lớp đầu tiên còn ở 0, mở Sổ tay của nó; hết lớp thì nút ẩn', () => {
    const studio = fakeStudio();
    const { workshop, rail } = mount(studio);
    workshop.open({ grind: true });
    const next = rail.querySelector('.rail-next');
    expect(next.hidden).toBe(false);
    expect(next.textContent).toBe(t.rail.next('Hai'));
    next.click();
    expect(studio.calls.at(-1)).toEqual(['setWeight', 'hai', 1, { tween: true }]);
    expect(workshop.layer).toBe('hai');
    workshop.open(); // đồng bộ lại thanh lớp (vòng rAF làm việc này mỗi khung)
    expect(next.textContent).toBe(t.rail.next('Ba'));
    next.click();
    workshop.open();
    expect(next.hidden).toBe(true);
    workshop.dispose();
  });

  it('công tắc bật/tắt tự do (tween); Cốt không có công tắc; vạch trọng số theo giá trị', () => {
    const studio = fakeStudio();
    const { workshop, rail } = mount(studio);
    workshop.open();
    expect(rail.querySelector('[data-layer="cot"] [role="switch"]')).toBeNull();
    const sw = rail.querySelector('[data-layer="hai"] [role="switch"]');
    expect(sw.getAttribute('aria-checked')).toBe('true');
    sw.click();
    expect(studio.calls.at(-1)).toEqual(['setWeight', 'hai', 0, { tween: true }]);
    workshop.open();
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(rail.querySelector('[data-layer="hai"] .rail-bar').style.getPropertyValue('--w')).toBe('0.000');
    workshop.dispose();
  });

  it('đóng thanh lớp → phủ lại mọi lớp (về chế độ ngắm), Sổ tay đóng, báo onClose (để mời lại)', () => {
    const studio = fakeStudio();
    const onClose = vi.fn();
    const { workshop, rail, notebook } = mount(studio, { onClose });
    workshop.open({ grind: true });
    rail.querySelector('.rail-close').click();
    expect(rail.hidden).toBe(true);
    expect(notebook.hidden).toBe(true);
    expect(studio.calls.slice(-2)).toEqual([['setWeight', 'hai', 1, { tween: true }], ['setWeight', 'ba', 1, { tween: true }]]);
    expect(onClose).toHaveBeenCalledTimes(1);
    workshop.dispose();
    expect(document.querySelector('[data-rail]')).toBeNull();
  });

  it('cảnh được dựng lại (bàn thợ mới): Sổ tay đang mở vẽ lại theo bàn thợ mới; lúc mất GPU thì các nút không làm gì', async () => {
    let current = fakeStudio();
    const workshop = mountWorkshop(document, { meta, content, t, studio: () => current, notebook: { loadCode, loadKnobs } });
    const notebook = document.querySelector('[data-notebook]');
    workshop.open();
    document.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    const button = () => notebook.querySelector('[data-experiment="pha"]');
    button().click();
    await vi.waitFor(() => expect(button().getAttribute('aria-pressed')).toBe('true'));
    current = null; // mất GPU: chưa có bàn thợ
    document.querySelector('[data-layer="ba"] [role="switch"]').click(); // không ném lỗi
    current = fakeStudio(); // dựng lại xong: thí nghiệm về tắt hết
    workshop.open(); // (vòng rAF gọi sync mỗi khung)
    expect(button().getAttribute('aria-pressed')).toBe('false');
    workshop.dispose();
  });
});

describe('Sổ tay', () => {
  it('Hiểu: thơ riêng của lớp, chữ, sơ đồ SVG, bạn vừa học, đọc thêm (mở tab mới, noopener)', () => {
    const { workshop, rail, notebook } = mount(fakeStudio());
    workshop.open();
    rail.querySelector('[data-layer="cot"] .rail-name').click();
    expect(notebook.querySelector('.nb-understand').textContent).toBe('Cốt là đất sét.');
    const link = notebook.querySelector('.nb-read a');
    expect([link.href, link.target, link.rel]).toEqual(['https://example.org/', '_blank', 'noopener']);
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    expect(notebook.querySelector('.nb-poem cite').textContent).toBe('Ca dao');
    expect(notebook.querySelector('.nb-diagram svg title').textContent).toBe('Sơ đồ');
    rail.querySelector('[data-layer="ba"] .rail-name').click();
    expect(notebook.querySelector('.nb-missing').textContent).toBe(t.notebook.contentMissing);
    workshop.dispose();
  });

  it('tab theo mẫu ARIA: mũi tên đổi tab, chỉ tab đang chọn có tabindex 0', () => {
    const { workshop, notebook } = mount(fakeStudio());
    workshop.open({ grind: true });
    const tablist = notebook.querySelector('[role="tablist"]');
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(notebook.querySelector('[data-tab="chinh"]').getAttribute('aria-selected')).toBe('true');
    expect(notebook.querySelector('[data-panel="chinh"]').hidden).toBe(false);
    expect(notebook.querySelector('[data-panel="hieu"]').hidden).toBe(true);
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(notebook.querySelector('[data-tab="pha"]').tabIndex).toBe(0);
    expect(notebook.querySelector('[data-tab="hieu"]').tabIndex).toBe(-1);
    workshop.dispose();
  });

  it('Chỉnh: Tweakpane chỉ tải khi mở tab lần đầu; kéo núm → setKnob; rê núm → sáng dòng code', async () => {
    const studio = fakeStudio();
    const { workshop, notebook } = mount(studio);
    workshop.open({ grind: true });
    expect(loadKnobs).not.toHaveBeenCalled();
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1));
    expect(notebook.querySelector('[data-knobs]').dataset.state).toBe('ready');
    const { opts } = knobsModule.mountKnobs.mock.results[0].value;
    expect(opts.values).toEqual({ size: 0.5 });
    expect(opts.labels).toEqual({ size: 'Cỡ lá' });
    await vi.waitFor(() => expect(notebook.querySelector('[data-line="2"]')).not.toBeNull());
    opts.onHover('size');
    expect(notebook.querySelector('[data-line="2"]').classList.contains('is-lit')).toBe(true);
    await opts.onChange('size', 0.8);
    expect(studio.setKnob).toHaveBeenCalledWith('cot', 'size', 0.8);
    workshop.dispose();
  });

  it('Phá: bật thí nghiệm → toggleExperiment, aria-pressed; số đo của lớp và của xưởng đổi 4 lần mỗi giây', async () => {
    vi.useFakeTimers();
    const studio = fakeStudio();
    const { workshop, rail, notebook } = mount(studio);
    workshop.open();
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    const button = notebook.querySelector('[data-experiment="pha"]');
    expect(button.textContent).toBe('Phá thử');
    button.click();
    await vi.waitFor(() => expect(button.getAttribute('aria-pressed')).toBe('true'));
    expect(studio.toggleExperiment).toHaveBeenCalledWith('hai', 'pha', true);
    const read = (id) => notebook.querySelector(`[data-readout="${id}"]`).textContent;
    expect(read('lop:dinh')).toBe('1.234');
    expect(read('drawCalls')).toBe('21');
    expect(read('ms')).toBe('16,7');
    workshop.dispose();
  });

  it('tầng tĩnh (studio() = null): không công tắc, không nút tiếp theo, Chỉnh không tải Tweakpane, Phá chỉ đọc', () => {
    const { workshop, rail, notebook } = mount(null);
    workshop.open({ grind: true });
    expect(rail.querySelector('[role="switch"]')).toBeNull();
    expect(rail.querySelector('.rail-next').hidden).toBe(true);
    notebook.querySelector('[data-tab="chinh"]').click();
    expect(notebook.querySelector('[data-knobs]').textContent).toBe(t.notebook.knobsStatic);
    expect(notebook.querySelector('[data-knobs]').dataset.state).toBe('static');
    expect(loadKnobs).not.toHaveBeenCalled();
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    expect(notebook.querySelector('[data-experiment="pha"]').disabled).toBe(true);
    expect(notebook.querySelector('.nb-readouts')).toBeNull();
    workshop.dispose();
  });

  it('Escape hay nút × đóng Sổ tay (thanh lớp vẫn mở)', () => {
    const { workshop, rail, notebook } = mount(fakeStudio());
    workshop.open({ grind: true });
    notebook.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(notebook.hidden).toBe(true);
    expect(workshop.layer).toBeNull();
    rail.querySelector('[data-layer="cot"] .rail-name').click();
    notebook.querySelector('.nb-close').click();
    expect(notebook.hidden).toBe(true);
    expect(rail.hidden).toBe(false);
    workshop.dispose();
  });
});
