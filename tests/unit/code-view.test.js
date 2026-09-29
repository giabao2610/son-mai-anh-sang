// @vitest-environment jsdom
// tests/unit/code-view.test.js — khung code của một lớp: glob ?code, đổi file, sáng dòng theo núm.
import { describe, it, expect, vi } from 'vitest';
import { createCodeView, hasCode } from '../../src/ui/code-view.js';
import t from '../../src/ui/strings.vi.js';

/** HTML giống đầu ra của plugin: mỗi dòng một span.line có data-line. */
const html = (n) => `<pre class="shiki"><code>${Array.from({ length: n }, (_, i) => `<span class="line" data-line="${i + 1}">x</span>`).join('\n')}</code></pre>`;
const FAKE = {
  'a/layers/l1.js': { html: html(5), knobs: { size: [2] } },
  'a/parts/p.js': { html: html(9), knobs: { glow: [4, 7] } },
};
const load = vi.fn(async (file) => FAKE[file] ?? null);

describe('hasCode (glob ?code của ui/code-view.js)', () => {
  it('có file lớp và parts của các bức, file lớp dùng chung; không có _mau, meta, content', () => {
    expect(hasCode('engine/stock/phu-bong/layer.js')).toBe(true);
    expect(hasCode('engine/stock/phu-bong/meta.js')).toBe(false);
    expect(hasCode('paintings/_mau/layers/l1-cot.js')).toBe(false);
    for (const file of ['meta.js', 'content.vi.js', 'painting.js']) {
      expect(hasCode(`paintings/_mau/${file}`)).toBe(false);
    }
  });
});

describe('createCodeView', () => {
  it('show() nạp mọi file của lớp và hiện file đầu; một file thì không hiện hàng tab', async () => {
    const code = createCodeView(document, { t, load });
    await code.show(['a/layers/l1.js', 'a/parts/p.js']);
    expect(code.el.querySelectorAll('[data-line]')).toHaveLength(5);
    const buttons = [...code.el.querySelectorAll('.code-files button')];
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['l1.js', 'true'], ['p.js', 'false']]);
    buttons[1].click();
    expect(code.el.querySelectorAll('[data-line]')).toHaveLength(9);
    await code.show(['a/layers/l1.js']);
    expect(code.el.querySelector('.code-files').hidden).toBe(true);
  });

  it('light(núm) chuyển sang file có marker và làm sáng đúng các dòng; light(null) tắt hết', async () => {
    const code = createCodeView(document, { t, load });
    await code.show(['a/layers/l1.js', 'a/parts/p.js']);
    expect(code.light('glow')).toBe(2);
    const lit = [...code.el.querySelectorAll('.is-lit')].map((el) => el.dataset.line);
    expect(lit).toEqual(['4', '7']);
    expect(code.light('size')).toBe(1);
    expect([...code.el.querySelectorAll('.is-lit')].map((el) => el.dataset.line)).toEqual(['2']);
    expect(code.light(null)).toBe(0);
    expect(code.el.querySelectorAll('.is-lit')).toHaveLength(0);
    expect(code.light('khong-co')).toBe(0);
  });

  it('sáng dòng chỉ cuộn RIÊNG khung code, không gọi scrollIntoView (nó cuộn cả Sổ tay, kéo núm ra khỏi con trỏ)', async () => {
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy; // jsdom không có scrollIntoView: gắn tạm để bắt nếu có ai gọi
    const code = createCodeView(document, { t, load });
    await code.show(['a/parts/p.js']);
    const view = code.el.querySelector('.code-view');
    const line = view.querySelector('[data-line="7"]');
    Object.defineProperty(line, 'offsetTop', { value: 300 });
    Object.defineProperty(view, 'clientHeight', { value: 120 });
    code.light('glow');
    expect(spy).not.toHaveBeenCalled();
    expect(view.scrollTop).toBeGreaterThanOrEqual(0);
    delete Element.prototype.scrollIntoView;
  });

  it('file nằm ngoài glob hay tải hỏng: báo chữ thay cho code, không ném lỗi', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const code = createCodeView(document, { t, load: async () => { throw new Error('mạng hỏng'); } });
    await code.show(['x.js']);
    expect(code.el.querySelector('.code-view').textContent).toBe(t.notebook.codeMissing);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('show() gọi lại khi lần trước chưa xong: kết quả cũ về muộn bị bỏ', async () => {
    let release;
    const slow = new Promise((resolve) => { release = resolve; });
    const code = createCodeView(document, { t, load: (file) => (file === 'cham.js' ? slow : load(file)) });
    const first = code.show(['cham.js']);
    await code.show(['a/parts/p.js']);
    release({ html: html(2), knobs: {} });
    await first;
    expect(code.el.querySelectorAll('[data-line]')).toHaveLength(9);
  });
});
