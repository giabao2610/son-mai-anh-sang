// @vitest-environment jsdom
// tests/unit/code-view.test.js — khung code của một lớp: glob ?code, đổi file, sáng dòng theo núm, và (GĐ 9) nút "Bản dịch" chuyển qua mã shader.
import { describe, it, expect, vi, afterEach } from 'vitest';
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
    const line = view.querySelector('[data-line="4"]'); // dòng ĐẦU TIÊN của núm glow (4 và 7): khung cuộn tới nó
    Object.defineProperty(line, 'offsetTop', { value: 300 });
    Object.defineProperty(view, 'clientHeight', { value: 120 });
    let scrolled = null; // jsdom không có layout, không giữ scrollTop: bắt giá trị được ghi vào
    Object.defineProperty(view, 'scrollTop', { get: () => scrolled ?? 0, set: (v) => { scrolled = v; } });
    code.light('glow');
    expect(spy).not.toHaveBeenCalled();
    expect(scrolled).toBe(260); // dòng sáng ở 1/3 trên của khung: 300 - 120 / 3
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

// ─── Bản dịch (GĐ 9) ─────────────────────────────────────────────────────────────────────────────────────────────
const place = (key, label, over = {}) => ({
  key,
  label,
  owner: 'a',
  own: true,
  post: false,
  drawn: true,
  vertex: 'fn v() {\n  return w_a;\n}', // 3 dòng, 1 có lớp
  fragment: 'fn f() {\n  let g = a_glow;\n  let w = w_a;\n}', // 4 dòng, 2 có lớp (a_glow ở dòng 2)
  hits: { vertex: 1, fragment: 2 },
  ...over,
});
const translation = (over = {}) => ({
  language: 'wgsl',
  backend: 'webgpu',
  uniforms: { weight: 'w_a', knobs: { glow: 'a_glow' } },
  places: [place('x:', 'Lá · Một'), place('post:0', 'Lượt cuối · hậu kỳ', { own: false, post: true })],
  jsOnly: false,
  ...over,
});
const defer = () => {
  const d = {};
  d.promise = new Promise((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
};
/** Mở khung code của lớp 'a' với một hàm dịch (null: tầng không có bản dịch). */
async function open(translate, files = ['a/layers/l1.js']) {
  const code = createCodeView(document, { t, load });
  await code.show(files, { layerId: 'a', layerName: 'Một', translate });
  return code;
}
const settle = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};
const q = (code, sel) => code.el.querySelector(sel);
const status = (code) => q(code, '.tr-status').textContent;
const statusLine = (lines, hits) => t.translation.status({ language: 'wgsl', backend: 'webgpu', lines, hits, layer: 'Một' });
/** Không phần tử nào từ .tr-status lên tới gốc khung code (gồm cả gốc) có thuộc tính hidden. */
function expectLiveRegionVisible(code, where) {
  for (let node = q(code, '.tr-status'); node; node = node.parentElement) {
    expect(node.hidden, `${where}: ${node.className || node.tagName} đang hidden`).toBe(false);
    if (node === code.el) return;
  }
  throw new Error('.tr-status không nằm trong khung code');
}

describe('createCodeView · nút "Bản dịch"', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('có translate thì hàng nút hiện kể cả khi lớp chỉ có một file, và nút "Bản dịch" đứng cuối', async () => {
    const code = await open(vi.fn());
    expect(q(code, '.code-files').hidden).toBe(false);
    const buttons = [...code.el.querySelectorAll('.code-files button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['l1.js', t.translation.button]);
    expect(buttons.at(-1).hasAttribute('data-code-translate')).toBe(true);
    expect(buttons.at(-1).getAttribute('aria-pressed')).toBe('false');
    expect(buttons.at(-1).type).toBe('button');
    const many = await open(vi.fn(), ['a/layers/l1.js', 'a/parts/p.js']);
    expect([...many.el.querySelectorAll('.code-files button')].map((b) => b.textContent)).toEqual(['l1.js', 'p.js', 'Bản dịch']);
  });

  it('không có translate (tầng tĩnh) thì không có nút, và một file thì không hiện hàng nút', async () => {
    for (const code of [await open(null), await open(undefined)]) {
      expect(code.el.querySelector('[data-code-translate]')).toBeNull();
      expect(q(code, '.code-files').hidden).toBe(true);
    }
    const noOptions = createCodeView(document, { t, load });
    await noOptions.show(['a/layers/l1.js']);
    expect(noOptions.el.querySelector('[data-code-translate]')).toBeNull();
  });

  it('show() cho lớp khác thì nút Bản dịch của lớp cũ đi mất, nút mới gọi translate với id lớp mới', async () => {
    const first = vi.fn(async () => translation());
    const second = vi.fn(async () => translation());
    const code = await open(first);
    await code.show(['a/parts/p.js'], { layerId: 'b', layerName: 'Hai', translate: second });
    expect(code.el.querySelectorAll('[data-code-translate]')).toHaveLength(1);
    q(code, '[data-code-translate]').click();
    expect(first).not.toHaveBeenCalled();
    expect(second.mock.calls).toEqual([['b']]);
    await settle();
    expect(status(code)).toContain('dòng có lớp Hai');
  });

  it('bấm thì gọi translate(layerId) (một đối số), hiện "Đang dịch…" trong lúc chờ, rồi hiện kết quả', async () => {
    const d = defer();
    const translate = vi.fn(() => d.promise);
    const code = await open(translate);
    const button = q(code, '[data-code-translate]');
    button.click();
    expect(translate.mock.calls).toEqual([['a']]);
    expect(status(code)).toBe('Đang dịch…');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(q(code, '.code-files button').getAttribute('aria-pressed'), 'tên file không còn được chọn').toBe('false');
    expect(q(code, '.code-view').textContent, 'code JS đã ra khỏi khung, chưa có mã shader').toBe('');
    d.resolve(translation());
    await settle();
    expect(code.el.querySelectorAll('.code-view .shader .line')).toHaveLength(4);
    expect(status(code)).toBe(statusLine(4, 2));
    expect(q(code, '.tr-controls').hidden).toBe(false);
    expect([...code.el.querySelectorAll('[data-tr-place] option')].map((o) => o.textContent)).toEqual(['Lá · Một', 'Lượt cuối · hậu kỳ']);
  });

  it('bấm tên file thì về code JS: mã shader, ô Vật và dòng trạng thái đều đi, nút Bản dịch hết bấm', async () => {
    const code = await open(vi.fn(async () => translation()));
    q(code, '[data-code-translate]').click();
    await settle();
    expect(q(code, '.shader')).not.toBeNull();
    q(code, '.code-files button').click();
    expect(q(code, '.shader')).toBeNull();
    expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(5);
    expect(status(code)).toBe('');
    expect(q(code, '.tr-controls').hidden).toBe(true);
    expect(q(code, '[data-code-translate]').getAttribute('aria-pressed')).toBe('false');
    expect(q(code, '.code-files button').getAttribute('aria-pressed')).toBe('true');
    expect(code.light('size'), 'về code JS thì núm js sáng dòng như cũ').toBe(1);
  });

  it('bấm Bản dịch lần nữa sau khi về code JS thì dịch lại từ đầu (Điểm ảnh mặc định, nơi đầu)', async () => {
    const translate = vi.fn(async () => translation());
    const code = await open(translate);
    q(code, '[data-code-translate]').click();
    await settle();
    q(code, '[data-tr-stage="vertex"]').click();
    q(code, '.code-files button').click();
    q(code, '[data-code-translate]').click();
    await settle();
    expect(translate).toHaveBeenCalledTimes(2);
    expect(q(code, '[data-tr-stage="fragment"]').getAttribute('aria-pressed')).toBe('true');
    expect(code.el.querySelectorAll('.shader .line')).toHaveLength(4);
  });

  it('đang ở Bản dịch thì light(núm) sáng dòng của uniform, không chuyển về code JS; núm không có uniform thì 0', async () => {
    const code = await open(vi.fn(async () => translation()), ['a/layers/l1.js', 'a/parts/p.js']);
    q(code, '[data-code-translate]').click();
    await settle();
    expect(code.light('glow')).toBe(1);
    expect([...code.el.querySelectorAll('.shader .is-lit')].map((el) => el.dataset.line)).toEqual(['2']);
    expect(code.light('size'), 'size có marker trong l1.js nhưng không có uniform').toBe(0);
    expect(q(code, '.shader'), 'vẫn ở Bản dịch').not.toBeNull();
    expect(q(code, '[data-code-translate]').getAttribute('aria-pressed')).toBe('true');
    expect(code.light(null)).toBe(0);
    expect(code.el.querySelectorAll('.is-lit')).toHaveLength(0);
  });

  it('hover núm bắt đầu và kết thúc lúc đã về code JS: không còn dòng sáng nào của Bản dịch cũ khi vào lại', async () => {
    const code = await open(vi.fn(async () => translation()));
    q(code, '[data-code-translate]').click();
    await settle();
    code.light('glow');
    q(code, '.code-files button').click(); // về code JS khi núm còn đang rê
    code.light(null);
    q(code, '[data-code-translate]').click();
    await settle();
    expect(code.el.querySelectorAll('.shader .is-lit')).toHaveLength(0);
  });

  describe('kết quả của lần dịch cũ về muộn bị bỏ', () => {
    it('người xem đã đổi lớp (show() lại)', async () => {
      const d = defer();
      const code = await open(vi.fn(() => d.promise));
      q(code, '[data-code-translate]').click();
      await code.show(['a/parts/p.js'], { layerId: 'b', layerName: 'Hai', translate: vi.fn(async () => translation()) });
      d.resolve(translation());
      await settle();
      expect(q(code, '.shader')).toBeNull();
      expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(9);
      expect(status(code)).toBe('');
    });

    it('người xem đã bấm tên file (showFile không tăng request: phải xét cả mode)', async () => {
      const d = defer();
      const code = await open(vi.fn(() => d.promise));
      q(code, '[data-code-translate]').click();
      q(code, '.code-files button').click();
      d.resolve(translation());
      await settle();
      expect(q(code, '.shader')).toBeNull();
      expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(5);
      expect(status(code)).toBe('');
      expect(q(code, '.tr-controls').hidden).toBe(true);
    });

    it('người xem bấm Bản dịch hai lần: chỉ kết quả của lần bấm sau được dùng', async () => {
      const first = defer();
      const second = defer();
      const translate = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
      const code = await open(translate);
      q(code, '[data-code-translate]').click();
      q(code, '[data-code-translate]').click();
      second.resolve(translation({ places: [place('moi:', 'Nơi mới')] }));
      await settle();
      first.resolve(translation({ places: [place('cu:', 'Nơi cũ')] }));
      await settle();
      expect([...code.el.querySelectorAll('[data-tr-place] option')].map((o) => o.textContent)).toEqual(['Nơi mới']);
    });

    it('lần dịch cũ hỏng muộn cũng không ghi "chưa dịch được" lên khung đã sang việc khác', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const d = defer();
      const code = await open(vi.fn(() => d.promise));
      q(code, '[data-code-translate]').click();
      q(code, '.code-files button').click();
      d.reject(new Error('muộn'));
      await settle();
      expect(status(code)).toBe('');
      warn.mockRestore();
    });
  });

  describe('lớp mới đang nạp: hàng nút của lớp cũ còn trong cây nhưng không còn dùng được (review Task 3)', () => {
    /**
     * Người xem đang ở Bản dịch (hay ở code JS) của lớp 'a' thì Sổ tay mở lớp 'b': notebook.js#show đã đặt tên và số của lớp mới, còn
     * file của 'b' nạp chậm, nên trong khoảng ấy hàng nút vẫn là của 'a'. `loading` là lời hứa của show() của 'b'; `release()` cho file
     * chậm nạp xong; `pressedBefore` là aria-pressed của hàng nút lúc còn là lớp 'a'. translateA nhận các lần gọi: lần đầu (người xem bấm
     * khi 'a' còn là lớp đang xem) xong ngay, lần sau do `afterwards` quyết định.
     */
    async function switching({ inTranslation = true, afterwards = async () => translation() } = {}) {
      const slow = defer();
      const loadSlow = (file) => (file === 'b/parts/slow.js' ? slow.promise : load(file));
      const code = createCodeView(document, { t, load: loadSlow });
      const translateA = vi.fn().mockImplementationOnce(async () => translation()).mockImplementation(afterwards);
      const translateB = vi.fn(async () => translation({ places: [place('y:', 'Cành · Hai')] }));
      await code.show(['a/layers/l1.js'], { layerId: 'a', layerName: 'Một', translate: translateA });
      if (inTranslation) {
        q(code, '[data-code-translate]').click();
        await settle();
      }
      const pressedBefore = bar(code).map((b) => b.getAttribute('aria-pressed'));
      const loading = code.show(['b/parts/slow.js'], { layerId: 'b', layerName: 'Hai', translate: translateB });
      return { code, translateA, translateB, loading, pressedBefore, release: () => slow.resolve({ html: html(9), knobs: {} }) };
    }
    const bar = (code) => [...code.el.querySelectorAll('.code-files button')];
    /** Sau khi lớp 'b' nạp xong: hàng nút, code, dòng trạng thái đều là của 'b' (code JS, chưa dịch), mọi nút dùng được. */
    function expectLayerB(code) {
      expect(bar(code).map((b) => b.textContent), 'hàng nút phải là của lớp mới: show() của nó đã xong').toEqual(['slow.js', t.translation.button]);
      expect(bar(code).map((b) => b.disabled)).toEqual([false, false]);
      expect(q(code, '[data-code-translate]').getAttribute('aria-pressed')).toBe('false');
      expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(9);
      expect(q(code, '.shader')).toBeNull();
      expect(status(code), 'không còn dòng trạng thái của lớp cũ').toBe('');
      expect(q(code, '.tr-controls').hidden).toBe(true);
      expect(code.el.querySelectorAll('[data-tr-place] option'), 'chưa dịch lớp mới: ô Vật không giữ nơi nào của lớp cũ').toHaveLength(0);
    }
    /** Bản dịch của lớp mới chạy bình thường: gọi translate của 'b', các nơi và dòng trạng thái là của 'b'. */
    async function expectTranslatesB(code, translateB) {
      q(code, '[data-code-translate]').click();
      await settle();
      expect(translateB.mock.calls).toEqual([['b']]);
      expect([...code.el.querySelectorAll('[data-tr-place] option')].map((o) => o.textContent)).toEqual(['Cành · Hai']);
      expect(status(code)).toContain('dòng có lớp Hai');
    }

    it('nút "Bản dịch" của lớp cũ bị khóa và bỏ chọn ngay khi lớp mới bắt đầu nạp; bấm nó không dịch lớp cũ, không hủy lần nạp; nạp xong thì mọi thứ là của lớp mới', async () => {
      const { code, translateA, translateB, loading, pressedBefore, release } = await switching();
      expect(pressedBefore, 'trước khi đổi lớp: đang ở Bản dịch').toEqual(['false', 'true']);
      const old = bar(code);
      expect(old.map((b) => b.textContent)).toEqual(['l1.js', t.translation.button]);
      expect(old.map((b) => b.disabled), 'mọi nút của lớp cũ bị khóa').toEqual([true, true]);
      expect(old.map((b) => b.getAttribute('aria-pressed')), 'và không nút nào còn đang chọn (Bản dịch đã tắt)').toEqual(['false', 'false']);
      expect(status(code)).toBe('');
      expect(q(code, '.code-view').textContent).toBe(t.notebook.loading);
      old[1].click(); // người xem bấm "Bản dịch" của lớp cũ trong khoảng nạp
      expect(q(code, '.code-view').textContent, 'cú bấm không làm gì').toBe(t.notebook.loading);
      expect(status(code)).toBe('');
      release();
      await loading;
      await settle();
      expectLayerB(code);
      expect(translateA, 'chỉ lần bấm đầu, lúc lớp cũ còn là lớp đang xem').toHaveBeenCalledTimes(1);
      await expectTranslatesB(code, translateB);
    });

    it('nút tên file của lớp cũ cũng bị khóa và bỏ chọn: bấm nó không hiện code lớp cũ dưới tên lớp mới', async () => {
      const { code, loading, pressedBefore, release } = await switching({ inTranslation: false });
      expect(pressedBefore, 'trước khi đổi lớp: đang ở code JS của file đầu').toEqual(['true', 'false']);
      const [file] = bar(code);
      expect(file.disabled).toBe(true);
      expect(bar(code).map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false']);
      file.click();
      expect(q(code, '.code-view').textContent, 'khung vẫn là "Đang tải…", không phải code lớp cũ').toBe(t.notebook.loading);
      release();
      await loading;
      await settle();
      expectLayerB(code);
    });

    // Lớp phòng thủ thứ hai: `show()` và `translate()` không dùng chung bộ đếm, nên dù nút bị khóa mà vẫn có một cú bấm tới `translate()`
    // (sự kiện tổng hợp, mà jsdom và vài trình duyệt cho qua nút disabled), lần nạp của lớp mới vẫn xong và xóa dấu vết của lớp cũ.
    it('dù một cú bấm lọt qua nút đã khóa, lần dịch của lớp cũ không hủy lần nạp của lớp mới; khung về đúng lớp mới', async () => {
      const { code, translateB, loading, release } = await switching();
      const stale = q(code, '[data-code-translate]');
      expect(stale.disabled).toBe(true);
      stale.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await settle(); // lần dịch (muộn) của lớp cũ xong TRƯỚC khi lớp mới nạp xong
      release();
      await loading;
      await settle();
      expectLayerB(code);
      await expectTranslatesB(code, translateB);
    });

    it('lần dịch của lớp cũ (cú bấm lọt qua nút khóa) về SAU khi lớp mới nạp xong thì bị bỏ, không đè lên code của lớp mới', async () => {
      const slowA = defer();
      const { code, loading, release } = await switching({ afterwards: () => slowA.promise });
      q(code, '[data-code-translate]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      release();
      await loading;
      await settle();
      expectLayerB(code);
      slowA.resolve(translation({ places: [place('cu:', 'Nơi của lớp cũ')] }));
      await settle();
      expectLayerB(code);
      expect(code.el.querySelectorAll('[data-tr-place] option')).toHaveLength(0);
    });
  });

  describe('refresh(): dịch lại sau 300 ms, chỉ khi đang ở Bản dịch', () => {
    /** Mở Bản dịch bằng đồng hồ giả. */
    async function inTranslation(translate) {
      vi.useFakeTimers();
      const code = await open(translate);
      q(code, '[data-code-translate]').click();
      await vi.advanceTimersByTimeAsync(0);
      return code;
    }

    it('gọi lại translate đúng sau 300 ms; nhiều lần refresh gộp thành một, tính từ lần cuối', async () => {
      const translate = vi.fn(async () => translation());
      const code = await inTranslation(translate);
      expect(translate).toHaveBeenCalledTimes(1);
      code.refresh();
      await vi.advanceTimersByTimeAsync(299);
      expect(translate).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(translate).toHaveBeenCalledTimes(2);
      expect(translate.mock.calls[1]).toEqual(['a']);
      code.refresh();
      await vi.advanceTimersByTimeAsync(100);
      code.refresh();
      await vi.advanceTimersByTimeAsync(100);
      code.refresh();
      await vi.advanceTimersByTimeAsync(299);
      expect(translate).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(translate).toHaveBeenCalledTimes(3);
    });

    it('không đang ở Bản dịch (code JS, hay không có translate) thì không làm gì', async () => {
      vi.useFakeTimers();
      const translate = vi.fn(async () => translation());
      const code = await open(translate);
      code.refresh();
      await vi.advanceTimersByTimeAsync(1000);
      expect(translate).not.toHaveBeenCalled();
      const plain = await open(null);
      plain.refresh();
      await vi.advanceTimersByTimeAsync(1000);
      expect(q(plain, '.tr-status').textContent).toBe('');
    });

    it('người xem về code JS trong lúc chờ 300 ms: lần dịch lại bị hủy', async () => {
      const translate = vi.fn(async () => translation());
      const code = await inTranslation(translate);
      code.refresh();
      q(code, '.code-files button').click();
      await vi.advanceTimersByTimeAsync(1000);
      expect(translate).toHaveBeenCalledTimes(1);
      expect(q(code, '.shader')).toBeNull();
    });

    it('không xóa khung trong lúc dịch lại, không đổi dòng trạng thái; giữ nơi, Đỉnh/Điểm ảnh và núm đang sáng', async () => {
      const d = defer();
      const translate = vi.fn().mockResolvedValueOnce(translation()).mockReturnValueOnce(d.promise);
      const code = await inTranslation(translate);
      const select = q(code, '[data-tr-place]');
      select.value = '1';
      select.dispatchEvent(new Event('change'));
      q(code, '[data-tr-stage="vertex"]').click(); // người xem chọn nơi thứ hai, phần Đỉnh
      code.light('glow'); // vertex của place() không có a_glow: núm được nhớ, chưa sáng dòng nào
      const shader = q(code, '.shader');
      const before = status(code);
      code.refresh();
      await vi.advanceTimersByTimeAsync(300);
      expect(translate).toHaveBeenCalledTimes(2);
      expect(q(code, '.shader'), 'khung vẫn còn trong lúc chờ').toBe(shader);
      expect(status(code)).toBe(before);
      d.resolve(translation({ places: [place('x:', 'Lá · Một'), place('post:0', 'Lượt cuối · hậu kỳ', { own: false, post: true, vertex: 'fn v() {\n  return w_a;\n  // mới\n}' })] }));
      await vi.advanceTimersByTimeAsync(0);
      expect(select.value, 'vẫn ở nơi thứ hai').toBe('1');
      expect(q(code, '[data-tr-stage="vertex"]').getAttribute('aria-pressed')).toBe('true');
      expect(code.el.querySelectorAll('.shader .line'), 'mã mới có thêm một dòng').toHaveLength(4);
      q(code, '[data-tr-stage="fragment"]').click();
      expect(code.el.querySelectorAll('.shader .is-lit'), 'núm vẫn được nhớ qua lần dịch lại').toHaveLength(1);
    });

    it('lần dịch lại về muộn sau khi người xem đã về code JS thì bị bỏ', async () => {
      const d = defer();
      const translate = vi.fn().mockResolvedValueOnce(translation()).mockReturnValueOnce(d.promise);
      const code = await inTranslation(translate);
      code.refresh();
      await vi.advanceTimersByTimeAsync(300);
      q(code, '.code-files button').click();
      d.resolve(translation());
      await vi.advanceTimersByTimeAsync(0);
      expect(q(code, '.shader')).toBeNull();
      expect(status(code)).toBe('');
      expect(q(code, '.tr-controls').hidden).toBe(true);
    });

    it('dịch lại hỏng thì báo "chưa dịch được" và ghi console.warn bằng tiếng Việt', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const translate = vi.fn().mockResolvedValueOnce(translation()).mockRejectedValueOnce(new Error('hỏng'));
      const code = await inTranslation(translate);
      code.refresh();
      await vi.advanceTimersByTimeAsync(300);
      expect(status(code)).toBe(t.translation.failed);
      expect(warn.mock.calls[0][0]).toMatch(/dịch/);
      warn.mockRestore();
    });
  });

  it('dịch hỏng (Promise từ chối, hay ném ngay): dòng "chưa dịch được", console.warn, và các nút tên file vẫn dùng được', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const translate of [vi.fn(async () => { throw new Error('hỏng'); }), vi.fn(() => { throw new Error('ném ngay'); })]) {
      const code = await open(translate);
      q(code, '[data-code-translate]').click();
      await settle();
      expect(status(code)).toBe(t.translation.failed);
      q(code, '.code-files button').click();
      expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(5);
      expect(status(code)).toBe('');
    }
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('vùng aria-live .tr-status không bao giờ nằm trong phần tử hidden: lúc rảnh, lúc dịch, có kết quả, hỏng, về code JS', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const d = defer();
    const code = await open(vi.fn().mockReturnValueOnce(d.promise).mockRejectedValueOnce(new Error('x')));
    expectLiveRegionVisible(code, 'rảnh');
    q(code, '[data-code-translate]').click();
    expectLiveRegionVisible(code, 'đang dịch');
    d.resolve(translation());
    await settle();
    expectLiveRegionVisible(code, 'có kết quả');
    q(code, '.code-files button').click();
    expectLiveRegionVisible(code, 'về code JS');
    q(code, '[data-code-translate]').click();
    await settle();
    expectLiveRegionVisible(code, 'hỏng');
    expect(q(code, '.tr-status').getAttribute('aria-live')).toBe('polite');
    // Thứ tự trong khung: hàng nút, khung Bản dịch, rồi khung mã (cuộn riêng)
    expect([...code.el.children].map((el) => el.className)).toEqual(['code-files', 'tr-head', 'code-view']);
    warn.mockRestore();
  });

  it('show() lại (đổi lớp, hay "Dựng lại cảnh") đưa khung về code JS', async () => {
    const translate = vi.fn(async () => translation());
    const code = await open(translate);
    q(code, '[data-code-translate]').click();
    await settle();
    await code.show(['a/layers/l1.js'], { layerId: 'a', layerName: 'Một', translate });
    expect(q(code, '.shader')).toBeNull();
    expect(code.el.querySelectorAll('.code-view [data-line]')).toHaveLength(5);
    expect(status(code)).toBe('');
    expect(q(code, '[data-code-translate]').getAttribute('aria-pressed')).toBe('false');
  });
});
