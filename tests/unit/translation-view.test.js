// @vitest-environment jsdom
// tests/unit/translation-view.test.js — khung Bản dịch (GĐ 9): ô Vật, Đỉnh/Điểm ảnh, dòng trạng thái và nhắc, sáng dòng theo núm, giữ chỗ khi dịch lại.
import { describe, it, expect } from 'vitest';
import { createTranslationView } from '../../src/ui/translation-view.js';
import t from '../../src/ui/strings.vi.js';

// Mã giả của ba nơi. Số dòng và số dòng có uniform của lớp (w_hai, hai_size, hai_glow) ghi bên cạnh, để test đếm bằng tay.
const VERT_A = ['@vertex', 'fn main( @location(0) p : vec3<f32> ) -> f32 {', '  let s = nodeUniforms.hai_size;', '  return s;', '}'].join('\n'); // 5 dòng, 1 có lớp
const FRAG_A = [
  '@fragment',
  'fn main() -> vec4<f32> {',
  '  let w = nodeUniforms.w_hai;',
  '  let g = nodeUniforms.hai_glow * w;',
  '  return vec4<f32>(g * nodeUniforms.hai_glow, g, w, 1.0);',
  '}',
].join('\n'); // 6 dòng, 3 có lớp (dòng 3, 4, 5); hai_glow ở dòng 4 và 5
const VERT_B = ['fn v() {', '  let a = nodeUniforms.hai_size;', '  let b = a * nodeUniforms.w_hai;', '}'].join('\n'); // 4 dòng, 2 có lớp
const FRAG_B = ['fn f() {', '  return nodeUniforms.w_hai;', '}'].join('\n'); // 3 dòng, 1 có lớp
const VERT_C = ['fn v() {', '  let a = nodeUniforms.w_hai;', '}'].join('\n'); // 3 dòng, 1 có lớp
const FRAG_C = ['fn f() {', '  let a = nodeUniforms.hai_glow;', '}'].join('\n'); // 3 dòng, 1 có lớp

const A = { key: 'a', label: 'Lá · Hai', owner: 'hai', own: true, post: false, drawn: true, vertex: VERT_A, fragment: FRAG_A, hits: { vertex: 1, fragment: 3 } };
const B = { key: 'b', label: 'Thân · Hai', owner: 'hai', own: true, post: false, drawn: true, vertex: VERT_B, fragment: FRAG_B, hits: { vertex: 2, fragment: 1 } };
const C = { key: 'c', label: 'Lượt cuối · hậu kỳ', owner: null, own: false, post: true, drawn: true, vertex: VERT_C, fragment: FRAG_C, hits: { vertex: 1, fragment: 1 } };
const translation = (over = {}) => ({
  language: 'wgsl',
  backend: 'webgpu',
  uniforms: { weight: 'w_hai', knobs: { size: 'hai_size', glow: 'hai_glow' } },
  places: [A, B, C],
  jsOnly: false,
  ...over,
});

function mount() {
  const view = document.createElement('div');
  const tr = createTranslationView(document, { t, view });
  const q = (sel) => tr.el.querySelector(sel);
  return {
    tr,
    view,
    status: q('.tr-status'),
    hint: q('.tr-hint'),
    controls: q('.tr-controls'),
    select: q('[data-tr-place]'),
    stage: (name) => q(`[data-tr-stage="${name}"]`),
    pressed: () => ['vertex', 'fragment'].filter((s) => q(`[data-tr-stage="${s}"]`).getAttribute('aria-pressed') === 'true'),
    lit: () => [...view.querySelectorAll('.is-lit')].map((el) => el.dataset.line),
    pick(i) {
      q('[data-tr-place]').value = String(i);
      q('[data-tr-place]').dispatchEvent(new Event('change'));
    },
    statusText: (lines, hits, layer = 'Hai') => t.translation.status({ language: 'wgsl', backend: 'webgpu', lines, hits, layer }),
  };
}

describe('ô Vật và hai nút Đỉnh / Điểm ảnh', () => {
  it('ô Vật là <select> có nhãn "Vật", liệt kê nhãn các nơi theo đúng thứ tự engine trả về', () => {
    const { tr, select } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect([...select.options].map((o) => o.textContent)).toEqual(['Lá · Hai', 'Thân · Hai', 'Lượt cuối · hậu kỳ']);
    expect(select.closest('label').textContent).toContain(t.translation.object);
  });

  it('mặc định là phần có nhiều dòng của lớp hơn: nơi A nhiều ở Điểm ảnh, nơi B nhiều ở Đỉnh', () => {
    const { tr, pressed, pick } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(pressed()).toEqual(['fragment']);
    pick(1);
    expect(pressed()).toEqual(['vertex']);
  });

  it('bằng nhau thì Điểm ảnh', () => {
    const { tr, pressed, pick } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    pick(2);
    expect(pressed()).toEqual(['fragment']);
  });

  it('bấm Đỉnh / Điểm ảnh đổi mã và aria-pressed; bấm nút không đổi nơi đang xem', () => {
    const { tr, view, stage, pressed, select } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(view.querySelectorAll('.line')).toHaveLength(6);
    stage('vertex').click();
    expect(pressed()).toEqual(['vertex']);
    expect(view.querySelectorAll('.line')).toHaveLength(5);
    expect(select.value).toBe('0');
    stage('fragment').click();
    expect(view.querySelectorAll('.line')).toHaveLength(6);
  });

  it('nút Đỉnh bị khóa khi vertex là null (nút Điểm ảnh khóa khi fragment là null), và nơi đó mở ở phần còn mã', () => {
    const { tr, stage, pressed, view } = mount();
    tr.show(translation({ places: [{ ...A, vertex: null, hits: { vertex: 0, fragment: 3 } }] }), { layerName: 'Hai' });
    expect(stage('vertex').disabled).toBe(true);
    expect(stage('fragment').disabled).toBe(false);
    tr.show(translation({ places: [{ ...A, fragment: null, hits: { vertex: 0, fragment: 0 } }] }), { layerName: 'Hai' });
    expect(stage('fragment').disabled).toBe(true);
    expect(stage('vertex').disabled).toBe(false);
    expect(pressed(), 'phần có mã thì mở, dù mặc định là Điểm ảnh').toEqual(['vertex']);
    expect(view.querySelectorAll('.line')).toHaveLength(5);
  });

  it('nhãn của nơi là chữ thô, không phải HTML', () => {
    const { tr, select } = mount();
    tr.show(translation({ places: [{ ...A, label: '<img src=x onerror=alert(1)>' }] }), { layerName: 'Hai' });
    expect(select.options[0].textContent).toBe('<img src=x onerror=alert(1)>');
    expect(select.querySelector('img')).toBeNull();
  });
});

describe('mã, dòng trạng thái và dòng nhắc', () => {
  it('mã có thẻ HTML giả thì chỉ ra chữ: khung view không có phần tử lạ nào (innerHTML nhận chuỗi đã escape từng token)', () => {
    const { tr, view } = mount();
    const code = 'fn f() {\n  let a = w_hai; // <img src=x onerror="alert(1)">\n  let b = a < 2 && a > 0;\n  let c = "<script>alert(2)</script>";\n}';
    tr.show(translation({ places: [{ ...A, fragment: code, hits: { vertex: 1, fragment: 1 } }] }), { layerName: 'Hai' });
    expect(view.querySelector('img, script')).toBeNull();
    expect(view.textContent).toBe(code);
    expect([...view.querySelectorAll('*')].every((n) => n.tagName === 'SPAN' || n.tagName === 'PRE' || n.tagName === 'CODE')).toBe(true);
  });

  it('mã vào khung view đã tô màu: uniform của lớp có span.u-layer, dòng có nó mang is-layer', () => {
    const { tr, view } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(view.querySelectorAll('.line.is-layer')).toHaveLength(3);
    expect(view.querySelectorAll('.u-layer[data-u="w_hai"]')).toHaveLength(1);
    expect(view.querySelectorAll('.u-layer[data-u="hai_glow"]')).toHaveLength(2);
    expect(view.querySelector('.tk-a').textContent).toBe('@fragment');
  });

  it('dòng trạng thái theo t.translation.status: ngôn ngữ, backend, số dòng, số dòng có lớp, tên lớp', () => {
    const { tr, status, stage, statusText } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(status.textContent).toBe(statusText(6, 3));
    expect(status.textContent).toContain('WGSL · WebGPU');
    stage('vertex').click();
    expect(status.textContent).toBe(statusText(5, 1));
    tr.show(translation({ language: 'glsl', backend: 'webgl2' }), { layerName: 'Hai' });
    expect(status.textContent).toContain('GLSL ES 3.0 · WebGL2');
  });

  it('dòng nhắc là weightHint(tên uniform trọng số); Cốt (không có trọng số) thì trống và ẩn', () => {
    const { tr, hint } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(hint.textContent).toBe(t.translation.weightHint('w_hai'));
    expect(hint.hidden).toBe(false);
    tr.show(translation({ uniforms: { weight: null, knobs: {} } }), { layerName: 'Cốt' });
    expect(hint.textContent).toBe('');
    expect(hint.hidden).toBe(true);
  });

  it('lớp chỉ đổi cảnh bằng JS (jsOnly): dòng nhắc là t.translation.jsOnly, vẫn hiện vật của chính nó', () => {
    const { tr, hint, select } = mount();
    tr.show(translation({ jsOnly: true, places: [{ ...A, hits: { vertex: 0, fragment: 0 } }] }), { layerName: 'Hai' });
    expect(hint.textContent).toBe(t.translation.jsOnly);
    expect(select.options).toHaveLength(1);
  });

  it('không có nơi nào: chỉ câu jsOnly (một lần, ở dòng trạng thái), không ô Vật, không nút', () => {
    const { tr, status, hint, controls, view } = mount();
    tr.show(translation({ jsOnly: true, places: [] }), { layerName: 'Hai' });
    expect(status.textContent).toBe(t.translation.jsOnly);
    expect(hint.hidden).toBe(true);
    expect(controls.hidden).toBe(true);
    expect(view.textContent).toBe('');
  });

  it('nơi có error: dòng trạng thái là t.translation.failed, khung mã trống, hai nút bị khóa', () => {
    const { tr, status, view, stage } = mount();
    tr.show(translation({ places: [{ ...A, vertex: null, fragment: null, hits: { vertex: 0, fragment: 0 }, error: 'boom' }] }), { layerName: 'Hai' });
    expect(status.textContent).toBe(t.translation.failed);
    expect(view.textContent).toBe('');
    expect(stage('vertex').disabled && stage('fragment').disabled).toBe(true);
  });

  it('nơi drawn === false: dòng trạng thái là t.translation.notDrawn, khung mã trống, hai nút bị khóa; chuyển sang nơi có mã thì mở lại', () => {
    const { tr, status, view, stage, pick } = mount();
    const absent = { ...B, drawn: false, vertex: null, fragment: null, hits: { vertex: 0, fragment: 0 } };
    tr.show(translation({ places: [A, absent] }), { layerName: 'Hai' });
    pick(1);
    expect(status.textContent).toBe(t.translation.notDrawn);
    expect(view.textContent).toBe('');
    expect(stage('vertex').disabled && stage('fragment').disabled).toBe(true);
    pick(0);
    expect(stage('vertex').disabled || stage('fragment').disabled).toBe(false);
    expect(view.querySelectorAll('.line')).toHaveLength(6);
  });
});

describe('sáng dòng theo núm (light)', () => {
  it("light('glow') sáng đúng các dòng có data-u của núm ấy; light(null) tắt hết; núm không có uniform thì 0", () => {
    const { tr, lit } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    expect(tr.light('glow')).toBe(2);
    expect(lit()).toEqual(['4', '5']);
    expect(tr.light(null)).toBe(0);
    expect(lit()).toEqual([]);
    expect(tr.light('khong-co')).toBe(0);
    expect(tr.light('constructor'), 'tên thừa kế của Object không phải núm').toBe(0);
    expect(tr.light('size'), 'hai_size không có trong Điểm ảnh của nơi A').toBe(0);
    expect(lit()).toEqual([]);
  });

  it('đổi nơi (hay đổi Đỉnh/Điểm ảnh) thì giữ núm đang sáng và sáng lại trên mã mới', () => {
    const { tr, lit, pick, stage } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    tr.light('glow');
    pick(2); // nơi C: hai_glow ở dòng 2 của Điểm ảnh
    expect(lit()).toEqual(['2']);
    stage('vertex').click(); // Đỉnh của C không có hai_glow
    expect(lit()).toEqual([]);
    stage('fragment').click();
    expect(lit()).toEqual(['2']);
  });

  it('khung cuộn RIÊNG tới dòng sáng đầu tiên (ở 1/3 trên của khung), không gọi scrollIntoView', () => {
    const { tr, view } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    let calls = 0;
    Element.prototype.scrollIntoView = () => { calls += 1; };
    Object.defineProperty(view.querySelector('[data-line="4"]'), 'offsetTop', { value: 300 });
    Object.defineProperty(view, 'clientHeight', { value: 120 });
    let scrolled = null;
    Object.defineProperty(view, 'scrollTop', { get: () => scrolled ?? 0, set: (v) => { scrolled = v; }, configurable: true });
    tr.light('glow');
    delete Element.prototype.scrollIntoView;
    expect(calls).toBe(0);
    expect(scrolled).toBe(260);
  });

  it('khung thò xuống dưới đáy Sổ tay (tab Chỉnh dài hơn màn hình): dòng sáng ở 1/3 phần khung mà người xem THẤY, không phải 1/3 cả khung', () => {
    const { tr, view } = mount();
    const panel = document.createElement('div');
    panel.setAttribute('role', 'tabpanel');
    panel.append(tr.el, view);
    tr.show(translation(), { layerName: 'Hai' });
    Object.defineProperty(view.querySelector('[data-line="4"]'), 'offsetTop', { value: 300 });
    Object.defineProperty(view, 'clientHeight', { value: 360 });
    // Khung từ y = 600 tới 960; đáy Sổ tay ở y = 732: người xem thấy 132 điểm ảnh đầu của khung
    view.getBoundingClientRect = () => ({ top: 600, bottom: 960 });
    panel.getBoundingClientRect = () => ({ top: 0, bottom: 732 });
    let scrolled = null;
    Object.defineProperty(view, 'scrollTop', { get: () => scrolled ?? 0, set: (v) => { scrolled = v; }, configurable: true });
    tr.light('glow');
    expect(scrolled).toBe(300 - 132 / 3);
    // Khung nằm gọn trong Sổ tay thì như cũ: 1/3 cả khung
    panel.getBoundingClientRect = () => ({ top: 0, bottom: 2000 });
    tr.light('glow');
    expect(scrolled).toBe(300 - 360 / 3);
    // Khung nằm hẳn dưới đáy (không thấy gì): không đo được, lấy cả khung
    panel.getBoundingClientRect = () => ({ top: 0, bottom: 500 });
    tr.light('glow');
    expect(scrolled).toBe(300 - 360 / 3);
  });

  it('chưa có bản dịch nào thì light không làm gì', () => {
    const { tr } = mount();
    expect(tr.light('glow')).toBe(0);
  });
});

describe('show(…, { keep }): dịch lại thì đứng nguyên chỗ', () => {
  it('giữ nơi đang xem theo key nếu còn; không còn thì về nơi đầu', () => {
    const { tr, select } = mount();
    tr.show(translation(), { layerName: 'Hai', keep: 'b' });
    expect(select.value).toBe('1');
    expect(tr.key).toBe('b');
    tr.show(translation({ places: [A, C] }), { layerName: 'Hai', keep: 'b' });
    expect(select.value).toBe('0');
    expect(tr.key).toBe('a');
  });

  it('giữ cả phần Đỉnh/Điểm ảnh mà người xem đã chọn (không đoán lại mặc định) và núm đang sáng', () => {
    const { tr, pick, stage, pressed, lit } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    pick(1); // B: mặc định Đỉnh
    stage('fragment').click(); // người xem chọn Điểm ảnh
    tr.light('size');
    tr.show(translation(), { layerName: 'Hai', keep: tr.key });
    expect(tr.key).toBe('b');
    expect(pressed()).toEqual(['fragment']);
    // B không có hai_size trong Điểm ảnh; qua Đỉnh thì núm vẫn sáng (núm được nhớ, không bị bản dịch lại làm mất)
    stage('vertex').click();
    expect(lit()).toEqual(['2']);
  });

  it('không có keep (người xem bấm "Bản dịch") thì bắt đầu lại: về nơi đầu và về mặc định của nơi, không giữ phần cũ', () => {
    const { tr, pick, stage, pressed } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    pick(1);
    tr.show(translation(), { layerName: 'Hai' });
    expect(tr.key, 'nơi đang xem không được giữ').toBe('a');
    stage('vertex').click(); // nơi A mặc định là Điểm ảnh; người xem chọn Đỉnh
    expect(pressed()).toEqual(['vertex']);
    tr.show(translation(), { layerName: 'Hai' });
    expect(pressed(), 'phần đang xem không được giữ').toEqual(['fragment']);
  });

  it('mã y hệt thì KHÔNG vẽ lại khung (giữ nguyên chọn chữ, vị trí cuộn) và không ghi lại dòng trạng thái (trình đọc màn hình đọc lại câu cũ)', () => {
    const { tr, view, status } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    const shader = view.querySelector('.shader');
    const text = status.firstChild;
    tr.show(translation(), { layerName: 'Hai', keep: tr.key });
    expect(view.querySelector('.shader')).toBe(shader);
    expect(status.firstChild).toBe(text);
  });

  it('mã đổi thì khung vẽ lại và dòng trạng thái cập nhật số dòng', () => {
    const { tr, view, status, statusText } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    const shader = view.querySelector('.shader');
    tr.show(translation({ places: [{ ...A, fragment: `${FRAG_A}\n// thêm` }, B, C] }), { layerName: 'Hai', keep: tr.key });
    expect(view.querySelector('.shader')).not.toBe(shader);
    expect(status.textContent).toBe(statusText(7, 3));
  });

  it('đổi nơi thì cuộn về đầu khung mã', () => {
    const { tr, view, pick } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    const writes = [];
    Object.defineProperty(view, 'scrollTop', { get: () => 0, set: (v) => { writes.push(v); }, configurable: true });
    pick(1);
    expect(writes.at(-1)).toBe(0);
  });
});

describe('pending, failed, hide', () => {
  it('pending(): xóa khung mã, dòng trạng thái là t.translation.translating (chuỗi thường, không đếm)', () => {
    const { tr, view, status, controls } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    tr.pending();
    expect(status.textContent).toBe('Đang dịch…');
    expect(status.textContent).toBe(t.translation.translating);
    expect(view.textContent).toBe('');
    expect(controls.hidden).toBe(true);
    // Có kết quả thì mọi thứ hiện lại, kể cả khi mã y hệt lần trước (khung đã bị xóa nên phải vẽ lại).
    tr.show(translation(), { layerName: 'Hai' });
    expect(view.querySelectorAll('.line')).toHaveLength(6);
    expect(controls.hidden).toBe(false);
  });

  it('failed(): dòng trạng thái là t.translation.failed', () => {
    const { tr, status } = mount();
    tr.failed();
    expect(status.textContent).toBe(t.translation.failed);
  });

  it('hide(): ẩn ô Vật, hai nút và dòng nhắc; dòng trạng thái rỗng; quên nơi, núm đang sáng', () => {
    const { tr, status, hint, controls, view, lit } = mount();
    tr.show(translation(), { layerName: 'Hai' });
    tr.light('glow');
    tr.hide();
    expect(controls.hidden).toBe(true);
    expect(hint.hidden).toBe(true);
    expect(status.textContent).toBe('');
    expect(tr.key).toBeNull();
    // khung view là của bên ngoài (code-view.js) sau hide(); Bản dịch kế tiếp vẽ lại hoàn toàn và không sáng núm cũ
    view.textContent = 'code JS';
    tr.show(translation(), { layerName: 'Hai' });
    expect(view.querySelectorAll('.line')).toHaveLength(6);
    expect(lit()).toEqual([]);
  });
});

describe('vùng aria-live .tr-status không bao giờ nằm trong phần tử hidden (VoiceOver bỏ qua chữ điền cùng nhịp với lúc bỏ hidden)', () => {
  /** Không phần tử nào từ .tr-status lên tới gốc của khung Bản dịch (gồm cả gốc) có thuộc tính hidden. */
  const noHiddenAncestor = (tr) => {
    for (let node = tr.el.querySelector('.tr-status'); node; node = node.parentElement) {
      expect(node.hidden, `${node.className || node.tagName} đang hidden`).toBe(false);
      if (node === tr.el) return;
    }
    throw new Error('.tr-status không nằm trong gốc của khung Bản dịch');
  };

  it('lúc rảnh, lúc đang dịch, lúc có kết quả, lúc hỏng, lúc ẩn, lúc không có nơi nào', () => {
    const { tr } = mount();
    noHiddenAncestor(tr);
    tr.pending();
    noHiddenAncestor(tr);
    tr.show(translation(), { layerName: 'Hai' });
    noHiddenAncestor(tr);
    tr.show(translation({ jsOnly: true, places: [] }), { layerName: 'Hai' });
    noHiddenAncestor(tr);
    tr.failed();
    noHiddenAncestor(tr);
    tr.hide();
    noHiddenAncestor(tr);
  });

  it('có aria-live="polite", và lúc rảnh trống để CSS thu lại bằng :empty', () => {
    const { tr, status } = mount();
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('');
    expect(status.matches(':empty')).toBe(true);
    tr.pending();
    expect(status.matches(':empty')).toBe(false);
  });
});

describe('dựng', () => {
  it('hai nút có aria-pressed, ô chọn và nhóm nút có tên cho trình đọc màn hình', () => {
    const { tr } = mount();
    const group = tr.el.querySelector('.tr-stages');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe(t.translation.stages);
    for (const name of ['vertex', 'fragment']) {
      const button = tr.el.querySelector(`[data-tr-stage="${name}"]`);
      expect(button.textContent).toBe(t.translation[name]);
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.type).toBe('button');
    }
    expect(tr.el.hasAttribute('data-translation')).toBe(true);
  });

  it('lúc đầu ô Vật, hai nút và dòng nhắc ẩn (chưa có gì để chọn), khung view không bị đụng tới', () => {
    const { controls, hint, view } = mount();
    expect(controls.hidden).toBe(true);
    expect(hint.hidden).toBe(true);
    expect(view.innerHTML).toBe('');
  });
});
