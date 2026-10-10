// @vitest-environment jsdom
// tests/unit/workshop.test.js — thanh lớp + Sổ tay + chế độ mài, chạy trên một bàn thợ giả (không three); chỗ của chúng trong trang.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountWorkshop } from '../../src/ui/workshop.js';
import { createToolbox } from '../../src/engine/gpu/toolbox.js';
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
      experiments: {
        pha: { label: 'Phá thử', explain: 'Xem chuyện gì xảy ra.' },
        so: { label: 'So sánh', explain: 'Đo lúc tắt và lúc bật.' },
      },
      readouts: { dinh: 'Số đỉnh' },
    },
  },
};

const studioRecipe = { text: '' }; // công thức mà bàn thợ giả báo (test đặt)

/** Bàn thợ giả: đủ các hàm mà Sổ tay và thanh lớp gọi, ghi lại lời gọi. */
function fakeStudio() {
  const weights = { cot: 1, hai: 1, ba: 1 };
  const on = new Set();
  const listeners = new Set();
  let knobValues = { size: 0.5 };
  return {
    calls: [],
    /** studio.onChange (GĐ 9): báo sau mỗi thay đổi của người xem; trả hàm bỏ nghe. */
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    listeners,
    /** Thay đổi từ chỗ khác ("Về nguyên bản", link dán, Back/Forward, __sma): núm đổi rồi báo, như studio.restore. */
    external(values) {
      knobValues = { ...knobValues, ...values };
      listeners.forEach((cb) => cb());
    },
    layers: () => [
      { id: 'cot', knobs: [{ id: 'size', kind: 'number', via: 'uniform', min: 0, max: 1, step: 0.1 }], experiments: [], readouts: [] },
      { id: 'hai', knobs: [], experiments: [{ id: 'pha', kind: 'toggle' }, { id: 'so', kind: 'compare' }], readouts: [{ id: 'dinh', unit: '' }] },
      { id: 'ba', knobs: [], experiments: [], readouts: [] },
    ],
    weight: (id) => ({ value: weights[id], target: weights[id] }),
    setWeight(id, v, options) {
      this.calls.push(['setWeight', id, v, options]);
      weights[id] = v;
    },
    knobs: () => ({ ...knobValues }),
    setKnob: vi.fn(async () => {}),
    experiment: (layerId, id) => on.has(`${layerId}.${id}`),
    toggleExperiment: vi.fn(async (layerId, id, value) => (value ? on.add(`${layerId}.${id}`) : on.delete(`${layerId}.${id}`))),
    readouts: () => [{ id: 'dinh', value: 1234, unit: '' }],
    tools: () => [{ id: 'kinh-mai', on: false }],
    setTool: vi.fn(async () => {}),
    dials: () => [],
    setDial: vi.fn(async () => {}),
    recipe: () => ({ text: studioRecipe.text, counts: { layers: 1, knobs: 0, dials: [] } }),
    reset: vi.fn(async () => {}),
    gpuMs: 4.56,
    stats() {
      return { drawCalls: 21, triangles: 90000, ms: 16.66, cpuMs: 3.21, gpuMs: this.gpuMs };
    },
    compare: (layerId, id) => (id === 'so'
      ? { off: { ms: 16.7, cpuMs: 2, gpuMs: 4 }, on: { ms: 33.4, cpuMs: 9.5, gpuMs: null } }
      : { off: null, on: null }),
    /** Bản dịch (GĐ 9): một nơi có mã giả, trọng số `w_<id>` (Cốt không có). */
    translation: vi.fn(async (id) => ({
      language: 'wgsl',
      backend: 'webgpu',
      uniforms: { weight: id === 'cot' ? null : `w_${id}`, knobs: { size: 'cot_size' } },
      places: [{
        key: 'o:', label: 'Vật', owner: id, own: true, post: false, drawn: true, vertex: 'fn v() {}', fragment: `fn f() {\n  let a = w_${id};\n}`,
        hits: { vertex: 0, fragment: 1 },
      }],
      jsOnly: false,
    })),
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
  studioRecipe.text = '';
  document.body.replaceChildren();
  knobsModule = { mountKnobs: vi.fn((container, opts) => ({ opts, refresh: vi.fn(), dispose: vi.fn() })) };
  loadKnobs.mockClear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks(); // spyOn (console.error…): trả lại cả khi một expect hỏng giữa test
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

  it('Đồ nghề (GĐ 4): nằm trong thanh lớp, ngay dưới danh sách lớp, trước nút "Phủ lớp tiếp theo"', () => {
    const { workshop, rail } = mount(fakeStudio());
    workshop.open();
    const section = rail.querySelector('.rail-tools');
    expect(section.previousElementSibling.tagName).toBe('OL');
    expect(section.nextElementSibling.classList.contains('rail-recipe-tools')).toBe(true); // GĐ 9: mục Công thức ngay sau Đồ nghề
    expect(section.nextElementSibling.nextElementSibling.classList.contains('rail-next')).toBe(true);
    expect(section.querySelector('[data-tool="kinh-mai"]').textContent).toBe(t.tools['kinh-mai'].name);
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
    expect(workshop.isOpen).toBe(false);
    workshop.open({ grind: true });
    expect(workshop.isOpen).toBe(true);
    rail.querySelector('.rail-close').click();
    expect(workshop.isOpen).toBe(false);
    expect(rail.hidden).toBe(true);
    expect(notebook.hidden).toBe(true);
    expect(studio.calls.slice(-2)).toEqual([['setWeight', 'hai', 1, { tween: true }], ['setWeight', 'ba', 1, { tween: true }]]);
    expect(studio.setTool).toHaveBeenCalledWith(null); // đóng thanh lớp thì công cụ học tắt, tranh về ảnh cuối
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

  it('vòng rAF của thanh lớp: một khung ném lỗi (bàn thợ đang dở) thì các khung sau vẫn vẽ lại thanh lớp; một console.error, không báo mỗi khung', () => {
    vi.useFakeTimers();
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const studio = fakeStudio();
    const { workshop, rail } = mount(studio);
    workshop.open();
    const weight = studio.weight;
    let broken = 2; // hai khung liền ném
    studio.weight = (id) => {
      if (broken > 0) {
        broken -= 1;
        throw new Error('bàn thợ đang dựng lại');
      }
      return weight(id);
    };
    vi.advanceTimersByTime(16 * 2);
    studio.setWeight('hai', 0); // đổi sau hai khung hỏng: thanh lớp phải theo kịp
    vi.advanceTimersByTime(16 * 2);
    expect(rail.querySelector('[data-layer="hai"] [role="switch"]').getAttribute('aria-checked')).toBe('false');
    expect(error).toHaveBeenCalledTimes(1);
    workshop.dispose();
  });
});

describe('thứ tự trong trang (GĐ 5, WCAG 2.4.3: Tab đi theo thứ tự DOM)', () => {
  /** Các con của body theo thứ tự DOM: tấm cố định gọi theo tên, phần tử khác theo thẻ. */
  const order = () => [...document.body.children].map((el) => ['rail', 'toolbar', 'notebook'].find((a) => el.hasAttribute(`data-${a}`)) ?? el.localName);
  /** Hộp đồ nghề thật (engine/gpu/toolbox.js) với một công cụ giả: như scene.js dựng mỗi lần mở trang hay "Dựng lại cảnh". */
  const scene = () => createToolbox({
    tools: [{
      id: 'kinh-mai',
      mount: ({ el }) => {
        el.append(document.createElement('button'));
        return { dispose() {} };
      },
    }],
    views: { list: () => [], require: async () => {}, setOverlays: () => [] },
    doc: document,
  });

  it('Sổ tay mở lần đầu khi cảnh đã có thanh công cụ: thanh lớp ngay trước nó, Sổ tay ngay sau (đi hết thanh lớp là Tab vào bảng)', () => {
    const bar = document.createElement('div');
    bar.setAttribute('data-toolbar', '');
    document.body.append(document.createElement('main'), bar, document.createElement('aside'));
    const { workshop } = mount(fakeStudio());
    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook', 'aside']);
    workshop.dispose();
  });

  it('chưa có thanh công cụ (tầng tĩnh, hay bức không có công cụ nào): thanh lớp rồi Sổ tay ở cuối body', () => {
    document.body.append(document.createElement('main'));
    const { workshop } = mount(null);
    expect(order()).toEqual(['main', 'rail', 'notebook']);
    workshop.dispose();
  });

  it('cả vòng đời: mở trang (thanh công cụ) → mở Sổ tay → "Dựng lại cảnh" (thanh công cụ mới): luôn thanh lớp → thanh công cụ → Sổ tay', () => {
    document.body.append(document.createElement('main'));
    const first = scene();
    const { workshop } = mount(fakeStudio());
    workshop.open({ grind: true });
    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook']);
    first.dispose(); // mất GPU: cảnh cũ bị gỡ, thanh lớp và Sổ tay ở lại
    expect(order()).toEqual(['main', 'rail', 'notebook']);
    scene();
    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook']);
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

  it('Chỉnh (GĐ 9): có bàn thợ thì có nút "Bản dịch" gọi studio.translation(id lớp), ghi tên lớp lên dòng trạng thái; tầng tĩnh không có nút', async () => {
    const studio = fakeStudio();
    const { workshop, notebook } = mount(studio);
    workshop.open({ grind: true });
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(notebook.querySelector('[data-code-translate]')).not.toBeNull());
    notebook.querySelector('[data-code-translate]').click();
    expect(studio.translation.mock.calls).toEqual([['cot']]);
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toContain('dòng có lớp Cốt'));
    expect(notebook.querySelector('.tr-hint').hidden, 'Cốt không có trọng số: không có dòng nhắc').toBe(true);
    // lớp khác: khung về code JS (Bản dịch không đi theo sang lớp khác), nút dịch lớp mới
    document.querySelector('[data-layer="hai"] .rail-name').click();
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toBe(''));
    await vi.waitFor(() => expect(notebook.querySelector('.code-view [data-line="1"]')).not.toBeNull());
    notebook.querySelector('[data-code-translate]').click();
    expect(studio.translation).toHaveBeenLastCalledWith('hai');
    await vi.waitFor(() => expect(notebook.querySelector('.tr-hint').textContent).toBe(t.translation.weightHint('w_hai')));
    workshop.dispose();

    document.body.replaceChildren();
    const readOnly = mount(null);
    readOnly.workshop.open({ grind: true });
    await vi.waitFor(() => expect(readOnly.notebook.querySelector('.code-view [data-line="1"]')).not.toBeNull());
    expect(readOnly.notebook.querySelector('[data-code-translate]')).toBeNull();
    readOnly.workshop.dispose();
  });

  it('Bản dịch đang mở: núm áp xong hay thí nghiệm áp xong thì dịch lại sau 300 ms (kéo liền nhiều lần chỉ dịch một lần); code JS thì không dịch', async () => {
    const studio = fakeStudio();
    const { workshop, rail, notebook } = mount(studio);
    workshop.open({ grind: true });
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(notebook.querySelector('[data-code-translate]')).not.toBeNull());
    const { opts } = knobsModule.mountKnobs.mock.results[0].value;
    vi.useFakeTimers();
    await opts.onChange('size', 0.6); // đang ở code JS: không dịch
    await vi.advanceTimersByTimeAsync(1000);
    expect(studio.translation).not.toHaveBeenCalled();
    vi.useRealTimers();
    notebook.querySelector('[data-code-translate]').click();
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toContain('dòng có lớp'));
    expect(studio.translation).toHaveBeenCalledTimes(1);

    vi.useFakeTimers();
    await opts.onChange('size', 0.7);
    await vi.advanceTimersByTimeAsync(200);
    await opts.onChange('size', 0.8); // kéo tiếp: hẹn lại từ lần này
    await vi.advanceTimersByTimeAsync(299);
    expect(studio.translation).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(studio.translation).toHaveBeenCalledTimes(2);
    expect(studio.translation).toHaveBeenLastCalledWith('cot');

    // thí nghiệm ở tab Phá của lớp đang xem cũng làm Bản dịch đang mở dịch lại
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    await vi.advanceTimersByTimeAsync(0);
    vi.useRealTimers();
    await vi.waitFor(() => expect(notebook.querySelector('[data-code-translate]')).not.toBeNull());
    notebook.querySelector('[data-code-translate]').click();
    await vi.waitFor(() => expect(studio.translation).toHaveBeenCalledTimes(3));
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toContain('dòng có lớp Hai'));
    notebook.querySelector('[data-tab="pha"]').click();
    vi.useFakeTimers();
    notebook.querySelector('[data-experiment="pha"]').click();
    await vi.advanceTimersByTimeAsync(299);
    expect(studio.translation).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(1);
    expect(studio.translation).toHaveBeenCalledTimes(4);
    expect(studio.translation).toHaveBeenLastCalledWith('hai');
    workshop.dispose();
  });

  it('bàn thợ đổi từ chỗ khác (Về nguyên bản, link dán, Back/Forward, __sma): núm đọc lại giá trị thật; Bản dịch đang mở thì dịch lại (F1)', async () => {
    const studio = fakeStudio();
    const { workshop, notebook } = mount(studio);
    workshop.open({ grind: true });
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1));
    const pane = knobsModule.mountKnobs.mock.results[0].value;
    studio.external({ size: 0.2 });
    expect(pane.refresh).toHaveBeenLastCalledWith({ size: 0.2 });
    pane.refresh.mockClear();
    studio.external({}); // thay đổi khác (trọng số, Dial): núm không đổi thì ô núm không vẽ lại
    expect(pane.refresh).not.toHaveBeenCalled();

    await vi.waitFor(() => expect(notebook.querySelector('[data-code-translate]')).not.toBeNull());
    notebook.querySelector('[data-code-translate]').click();
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toContain('dòng có lớp'));
    expect(studio.translation).toHaveBeenCalledTimes(1);
    vi.useFakeTimers();
    studio.external({ size: 0.9 }); // núm 'rebuild' áp qua restore(): mã có thể đổi
    await vi.advanceTimersByTimeAsync(300);
    expect(studio.translation).toHaveBeenCalledTimes(2);
    workshop.dispose();
    expect(studio.listeners.size, 'gỡ xưởng thì bỏ nghe').toBe(0);
  });

  it('Sổ tay đang đóng lúc bàn thợ đổi: mở lại đúng lớp ấy thì núm đã là giá trị thật, không phải giá trị cũ (F1)', async () => {
    const studio = fakeStudio();
    const { workshop, rail, notebook } = mount(studio);
    workshop.open({ grind: true });
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1));
    const pane = knobsModule.mountKnobs.mock.results[0].value;
    notebook.querySelector('.nb-close').click();
    studio.external({ size: 0.1 });
    rail.querySelector('[data-layer="cot"] .rail-name').click();
    expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1); // cùng ô núm, không dựng lại
    expect(pane.refresh).toHaveBeenLastCalledWith({ size: 0.1 });
    workshop.dispose();
  });

  it('"Dựng lại cảnh" (bàn thợ mới): nghe bàn thợ mới, bỏ nghe bàn thợ cũ (F1)', () => {
    let current = fakeStudio();
    const workshop = mountWorkshop(document, { meta, content, t, studio: () => current, notebook: { loadCode, loadKnobs } });
    const old = current;
    expect(old.listeners.size).toBe(1);
    current = null; // mất GPU: chưa có bàn thợ
    workshop.open();
    current = fakeStudio();
    workshop.open(); // (vòng rAF gọi sync mỗi khung)
    expect([old.listeners.size, current.listeners.size]).toEqual([0, 1]);
    workshop.dispose();
    expect(current.listeners.size).toBe(0);
  });

  it('mất GPU sau khi Sổ tay dựng nút "Bản dịch": bấm thì báo "chưa dịch được" kèm lỗi tiếng Việt, không TypeError (C5)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let current = fakeStudio();
    const workshop = mountWorkshop(document, { meta, content, t, studio: () => current, notebook: { loadCode, loadKnobs } });
    const notebook = document.querySelector('[data-notebook]');
    workshop.open({ grind: true });
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(notebook.querySelector('[data-code-translate]')).not.toBeNull());
    current = null;
    notebook.querySelector('[data-code-translate]').click();
    await vi.waitFor(() => expect(notebook.querySelector('.tr-status').textContent).toBe(t.translation.failed));
    const err = warn.mock.calls.find(([text]) => text === 'Sổ tay: không dịch được:')?.[1];
    expect(err?.message).toBe('Cảnh chưa sẵn sàng: không có bản dịch');
    warn.mockRestore();
    workshop.dispose();
  });

  it('Chỉnh: Tweakpane tải hỏng → báo lỗi thay vì "Đang tải…" mãi; mở lại tab thì tải lại', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    loadKnobs.mockRejectedValueOnce(new Error('Failed to fetch dynamically imported module: knobs-abc.js'));
    const { workshop, notebook } = mount(fakeStudio());
    workshop.open({ grind: true });
    const box = notebook.querySelector('[data-knobs]');
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(box.dataset.state).toBe('error'));
    expect(box.textContent).toBe(t.notebook.knobsFailed);
    notebook.querySelector('[data-tab="hieu"]').click();
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(box.dataset.state).toBe('ready'));
    expect(loadKnobs).toHaveBeenCalledTimes(2);
    warn.mockRestore();
    workshop.dispose();
  });

  it('núm hay thí nghiệm áp không được: Sổ tay báo một dòng; núm và nút về trạng thái THẬT của bàn thợ', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const studio = fakeStudio();
    studio.setKnob.mockRejectedValueOnce(new Error('núm hỏng'));
    studio.toggleExperiment.mockRejectedValueOnce(new Error('thí nghiệm hỏng'));
    const { workshop, rail, notebook } = mount(studio);
    workshop.open({ grind: true });
    const status = notebook.querySelector('.nb-busy');
    notebook.querySelector('[data-tab="chinh"]').click();
    await vi.waitFor(() => expect(knobsModule.mountKnobs).toHaveBeenCalledTimes(1));
    const pane = knobsModule.mountKnobs.mock.results[0].value;
    await pane.opts.onChange('size', 0.8);
    expect(pane.refresh).toHaveBeenCalledWith({ size: 0.5 });
    expect(status.textContent).toBe(t.notebook.changeFailed);
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    const button = notebook.querySelector('[data-experiment="pha"]');
    button.click();
    await vi.waitFor(() => expect(button.disabled).toBe(false));
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(status.textContent).toBe(t.notebook.changeFailed);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
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
    expect(read('cpuMs')).toBe('3,2');
    expect(read('gpuMs')).toBe('4,6');
    expect(notebook.querySelector('.nb-gpu-missing').hidden).toBe(true);
    workshop.dispose();
  });

  it('Phá: máy không đo được ms GPU thì dòng đó ghi "—", kèm một câu giải thích (GĐ 4)', () => {
    vi.useFakeTimers();
    const studio = fakeStudio();
    studio.gpuMs = null;
    const { workshop, rail, notebook } = mount(studio);
    workshop.open();
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    expect(notebook.querySelector('[data-readout="gpuMs"]').textContent).toBe('—');
    const note = notebook.querySelector('.nb-gpu-missing');
    expect(note.hidden).toBe(false);
    expect(note.textContent).toBe(t.notebook.gpuMissing);
    studio.gpuMs = 3; // mẫu GPU đầu tiên về muộn: số hiện ra, câu giải thích ẩn đi
    vi.advanceTimersByTime(300);
    expect(notebook.querySelector('[data-readout="gpuMs"]').textContent).toBe('3');
    expect(note.hidden).toBe(true);
    workshop.dispose();
  });

  it('Phá: lớp đang tắt (chế độ mài) thì nhắc bật lớp lên, điền ở nhịp sau lúc tab hiện (cùng nhịp thì VoiceOver bỏ qua)', () => {
    vi.useFakeTimers();
    const studio = fakeStudio();
    const { workshop, rail, notebook } = mount(studio);
    workshop.open({ grind: true }); // mọi lớp trừ Cốt về 0
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    const hint = notebook.querySelector('.nb-off');
    expect(hint.textContent).toBe('');
    vi.advanceTimersByTime(300);
    expect(hint.textContent).toBe(t.notebook.layerOff);
    rail.querySelector('[data-layer="ba"] .rail-name').click(); // sang một lớp khác cũng đang tắt, vẫn ở tab Phá
    expect(hint.textContent).toBe('');
    vi.advanceTimersByTime(300);
    expect(hint.textContent).toBe(t.notebook.layerOff);
    studio.setWeight('ba', 1); // phủ lớp rồi thì dòng nhắc trống
    vi.advanceTimersByTime(300);
    expect(hint.textContent).toBe('');
    workshop.dispose();
  });

  it('Phá: dòng nhắc "lớp đang tắt" không bị ghi lại mỗi 250 ms khi chữ không đổi (trình đọc màn hình có thể đọc lại)', () => {
    vi.useFakeTimers();
    const { workshop, rail, notebook } = mount(fakeStudio());
    workshop.open({ grind: true });
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    vi.advanceTimersByTime(300);
    const hint = notebook.querySelector('.nb-off');
    expect(hint.textContent).toBe(t.notebook.layerOff);
    const seen = new MutationObserver(() => {});
    seen.observe(hint, { childList: true, characterData: true, subtree: true });
    vi.advanceTimersByTime(1000);
    expect(seen.takeRecords()).toHaveLength(0);
    seen.disconnect();
    workshop.dispose();
  });

  it('Phá: thí nghiệm so sánh có hai cột "Tắt / Bật" ngay dưới nút (ms khung và ms CPU); thí nghiệm thường thì không', () => {
    vi.useFakeTimers();
    const { workshop, rail, notebook } = mount(fakeStudio());
    workshop.open();
    rail.querySelector('[data-layer="hai"] .rail-name').click();
    notebook.querySelector('[data-tab="pha"]').click();
    const bars = notebook.querySelectorAll('[data-compare]');
    expect(bars).toHaveLength(1);
    expect(bars[0].previousElementSibling.dataset.experiment).toBe('so');
    const row = (side) => bars[0].querySelector(`[data-side="${side}"]`);
    expect(row('off').textContent).toBe(`${t.notebook.compare.off}khung 16,7 ms · CPU 2 ms · GPU 4 ms`);
    // Bên "Bật" chưa có mẫu GPU (hay máy không đo được): không bịa số GPU.
    expect(row('on').querySelector('.nb-compare-value').textContent).toBe('khung 33,4 ms · CPU 9,5 ms');
    const [frame, cpu, gpu] = row('off').querySelectorAll('.nb-bars i');
    expect([frame.style.width, cpu.style.width, gpu.style.width]).toEqual(['50%', `${(2 / 9.5) * 100}%`, '100%']);
    expect(row('on').querySelectorAll('.nb-bars i')[2].style.width).toBe('0%');
    expect(row('on').querySelector('.nb-bars').getAttribute('aria-hidden')).toBe('true');
    workshop.dispose();
  });

  it('tầng tĩnh (studio() = null): không công tắc, không Đồ nghề, không nút tiếp theo, Chỉnh không tải Tweakpane, Phá chỉ đọc', () => {
    const { workshop, rail, notebook } = mount(null);
    workshop.open({ grind: true });
    expect(rail.querySelector('[role="switch"]')).toBeNull();
    expect(rail.querySelector('.rail-tools')).toBeNull();
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

describe('mục Công thức (GĐ 9)', () => {
  it('open({ recipe }): thanh lớp mở, KHÔNG lớp nào tween về 0; dòng tóm tắt trống ngay lúc mở, điền ở khung sau (F5: VoiceOver)', () => {
    vi.useFakeTimers();
    studioRecipe.text = 'hai:0';
    const studio = fakeStudio();
    const { workshop, rail, $ } = mount(studio);
    workshop.open({ recipe: true });
    expect(rail.hidden).toBe(false);
    expect(studio.calls).toEqual([]);
    expect($('.rail-recipe-text').textContent, 'cùng nhịp với lúc bỏ hidden: chưa điền').toBe('');
    vi.advanceTimersByTime(16); // một khung
    expect($('.rail-recipe-text').textContent).toBe('Công thức trong link: 1 lớp đã mài');
    expect(workshop.layer).toBe(null);
    workshop.dispose();
  });

  it('dispose() ngay sau open({ recipe }): khung chờ của dòng tóm tắt bị hủy, không đọc bàn thợ của cảnh đã gỡ', () => {
    vi.useFakeTimers();
    studioRecipe.text = 'hai:0';
    const studio = fakeStudio();
    const { workshop } = mount(studio);
    workshop.open({ recipe: true });
    workshop.dispose();
    studio.recipe = vi.fn(() => { throw new Error('bàn thợ đã gỡ'); });
    vi.advanceTimersByTime(16 * 2);
    expect(studio.recipe).not.toHaveBeenCalled();
  });

  it('open({ grind }): dòng tóm tắt ẩn, kể cả khi vừa hiện', () => {
    studioRecipe.text = 'hai:0';
    const { workshop, $ } = mount(fakeStudio());
    workshop.open({ recipe: true });
    workshop.open({ grind: true });
    expect($('.rail-recipe-text').textContent).toBe('');
    expect($('[data-recipe-reset]').hidden).toBe(true);
    workshop.dispose();
  });

  it('mục Công thức nằm TRONG thanh lớp (Tab đi theo thứ tự DOM), sau Đồ nghề; tóm tắt đứng đầu', () => {
    const { workshop, rail } = mount(fakeStudio());
    const kids = [...rail.children].map((c) => c.className.split(' ')[0]);
    expect(kids.indexOf('rail-recipe')).toBe(0);
    expect(kids.indexOf('rail-recipe-tools')).toBe(kids.indexOf('rail-tools') + 1);
    workshop.dispose();
  });

  it('tầng tĩnh (không có bàn thợ): không có mục Công thức', () => {
    const { workshop, rail } = mount(null);
    expect(rail.querySelector('.rail-recipe, .rail-recipe-tools')).toBeNull();
    workshop.open({ recipe: true });
    workshop.dispose();
  });
});
