// tests/unit/shader-text.test.js — tô màu mã shader do three sinh (WGSL, GLSL): escape từng token, từ khóa, kiểu, số, chú thích, uniform của lớp.
import { describe, it, expect } from 'vitest';
import { shaderHtml } from '../../src/ui/shader-text.js';

/** Một dòng mã → HTML của riêng dòng đó (bỏ khung <pre><code> và thẻ .line). */
const inner = (code, options) => {
  const { html } = shaderHtml(code, options);
  return html.replace(/^<pre class="shader"><code>/, '').replace(/<\/code><\/pre>$/, '').replace(/^<span class="line[^"]*" data-line="1">/, '').replace(/<\/span>$/, '');
};
/** HTML → chữ thô: bỏ thẻ, trả entity về ký tự. Mã không được mất hay thêm ký tự nào sau khi tô. */
const plain = (html) => html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const span = (cls, text) => `<span class="${cls}">${text}</span>`;

describe('escape', () => {
  it('escape từng token: < & > thành entity, không còn ký tự HTML thô trong mã', () => {
    const html = inner('a < b && c > 0');
    expect(html).toBe(`a &lt; b &amp;&amp; c &gt; ${span('tk-n', '0')}`);
  });

  it('dấu ngoặc kép, ký tự lạ và thẻ giả trong chú thích cũng bị escape', () => {
    expect(inner('x // <img src=x onerror="a">')).toBe(`x ${span('tk-c', '// &lt;img src=x onerror=&quot;a&quot;&gt;')}`);
    expect(inner('"<b>"')).toBe('&quot;&lt;b&gt;&quot;');
  });

  it('không mất và không thêm ký tự nào: chữ thô sau khi tô bằng đúng mã vào', () => {
    const code = [
      '@group(0) @binding(1) var<uniform> object : NodeUniformsStruct;',
      'fn main( @location(0) p : vec4<f32> ) -> f32 {',
      '\tlet a = 1e-3 + .5 * 0x1Fu; // chú thích "có" <dấu> & ký tự',
      '\tif ( a < 2u && a >= 0.5f ) { return a; }',
      '',
      '}',
    ].join('\n');
    const { html } = shaderHtml(code, { uniforms: ['object'] });
    expect(plain(html)).toBe(code);
  });
});

describe('từ khóa, kiểu, số, chú thích, thuộc tính', () => {
  it.each(['fn', 'let', 'var', 'const', 'return', 'struct', 'uniform', 'void', 'layout', 'precision', 'highp', 'flat'])(
    'từ khóa %s mang tk-k',
    (word) => expect(inner(word)).toBe(span('tk-k', word)),
  );

  it('tên chỉ CHỨA từ khóa thì không được tô (letter, uniformity, fn_main)', () => {
    for (const word of ['letter', 'uniformity', 'fn_main', 'varying_x', 'myvoid']) expect(inner(word), word).toBe(word);
  });

  it.each(['f32', 'u32', 'i32', 'bool', 'float', 'int', 'vec2', 'vec3f', 'uvec4', 'mat4x4', 'mat3', 'mat4x4f', 'sampler', 'sampler2D', 'texture_2d', 'array'])(
    'kiểu %s mang tk-t',
    (word) => expect(inner(word)).toBe(span('tk-t', word)),
  );

  it('vec4<f32>: kiểu, dấu < >, kiểu', () => {
    expect(inner('vec4<f32>')).toBe(`${span('tk-t', 'vec4')}&lt;${span('tk-t', 'f32')}&gt;`);
  });

  it.each(['0.5', '1e-3', '2u', '1.0f', '10', '.5', '3.0e+2', '0x1Fu', '1.', '0.5h'])('số %s mang tk-n', (num) => {
    expect(inner(`x = ${num};`)).toContain(span('tk-n', num));
  });

  it('chữ số nằm trong tên thì không phải số (foo2, _3, a1b)', () => {
    for (const word of ['foo2', '_3', 'a1b', 'nodeUniform0']) expect(inner(word), word).toBe(word);
  });

  it('chú thích // đến hết dòng mang tk-c, và nuốt cả từ khóa, số bên trong', () => {
    expect(inner('let a = 1; // let b = 2')).toBe(`${span('tk-k', 'let')} a = ${span('tk-n', '1')}; ${span('tk-c', '// let b = 2')}`);
  });

  it('@location(0): thuộc tính mang tk-a, phần còn lại tô như thường', () => {
    expect(inner('@location(0)')).toBe(`${span('tk-a', '@location')}(${span('tk-n', '0')})`);
    for (const attr of ['@builtin', '@group', '@binding', '@vertex', '@fragment']) expect(inner(attr), attr).toBe(span('tk-a', attr));
  });
});

describe('uniform của lớp', () => {
  const options = { uniforms: ['w_hai', 'hai_glow'] };

  it('object.w_hai ra span.u-layer có data-u, và dòng của nó mang is-layer', () => {
    const { html } = shaderHtml('let k = object.w_hai * 2.0;', options);
    expect(html).toContain('<span class="u-layer" data-u="w_hai">w_hai</span>');
    expect(html).toContain('<span class="line is-layer" data-line="1">');
  });

  it('so cả tên: w_hai_2, aw_hai, w_hai2 không được đánh dấu; dòng của chúng không có is-layer', () => {
    for (const name of ['w_hai_2', 'aw_hai', 'w_hai2', 'hai_glow_x']) {
      const { html, hits } = shaderHtml(`let k = object.${name};`, options);
      expect(html, name).not.toContain('u-layer');
      expect(html, name).not.toContain('is-layer');
      expect(hits, name).toBe(0);
    }
  });

  it('uniform nằm trong chú thích thì không được đánh dấu (chú thích nuốt hết dòng)', () => {
    const { html, hits } = shaderHtml('let a = 1; // w_hai', options);
    expect(html).not.toContain('u-layer');
    expect(hits).toBe(0);
  });

  it('không có danh sách uniform thì không có dấu nào', () => {
    expect(shaderHtml('let k = object.w_hai;').html).not.toContain('u-layer');
    expect(shaderHtml('let k = object.w_hai;', { uniforms: [] }).hits).toBe(0);
  });

  it('hai uniform trên cùng một dòng: hai span, nhưng dòng chỉ tính một lần', () => {
    const { html, hits } = shaderHtml('let k = w_hai + hai_glow;', options);
    expect(html.match(/class="u-layer"/g)).toHaveLength(2);
    expect(hits).toBe(1);
  });

  it('tên uniform có ký tự đặc biệt của regex không làm hỏng việc so (so bằng tập hợp, không bằng regex)', () => {
    const { html } = shaderHtml('let k = a$b;', { uniforms: ['a$b', '(x'] });
    expect(html).not.toContain('u-layer');
  });
});

describe('dòng', () => {
  const code = 'fn main() {\n  let a = w_hai;\n\n  let b = hai_glow;\n  let c = 0.0;\n}';

  it('lines bằng số dòng; hits bằng số dòng có uniform của lớp', () => {
    const out = shaderHtml(code, { uniforms: ['w_hai', 'hai_glow'] });
    expect(out.lines).toBe(6);
    expect(out.hits).toBe(2);
  });

  it('mỗi dòng một span.line có data-line từ 1; dòng trống giữ nguyên (không mất số dòng)', () => {
    const { html } = shaderHtml(code, { uniforms: ['w_hai'] });
    const numbers = [...html.matchAll(/<span class="line[^"]*" data-line="(\d+)">/g)].map((m) => Number(m[1]));
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
    expect(html).toContain('<span class="line" data-line="3"></span>');
  });

  it('khung <pre class="shader"><code>; các dòng nối bằng \\n để chữ thô giữ đủ xuống dòng', () => {
    const { html } = shaderHtml('a\nb');
    expect(html.startsWith('<pre class="shader"><code>')).toBe(true);
    expect(html.endsWith('</code></pre>')).toBe(true);
    expect(plain(html)).toBe('a\nb');
  });

  it('một \\n ở cuối mã không đẻ ra dòng cuối trống', () => {
    expect(shaderHtml('a\nb\n').lines).toBe(2);
  });

  it('null, undefined, chuỗi rỗng (nơi không có mã): 0 dòng, 0 dòng có lớp, khung rỗng', () => {
    for (const empty of [null, undefined, '']) {
      const out = shaderHtml(empty, { uniforms: ['w_hai'] });
      expect(out).toEqual({ html: '<pre class="shader"><code></code></pre>', lines: 0, hits: 0 });
    }
  });

  it('mã dài hàng nghìn ký tự trên một dòng vẫn là một dòng', () => {
    const long = `let a = ${Array.from({ length: 300 }, (_, i) => `w_hai * ${i}.5`).join(' + ')};`;
    const out = shaderHtml(long, { uniforms: ['w_hai'] });
    expect(out.lines).toBe(1);
    expect(out.hits).toBe(1);
    expect(plain(out.html)).toBe(long);
  });
});
