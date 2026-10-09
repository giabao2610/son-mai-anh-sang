// ui/shader-text.js — tô màu mã shader do three sinh (WGSL hay GLSL) và đánh dấu uniform của lớp: hàm thuần, không three, không DOM.

const KEYWORDS = new Set([
  'fn', 'let', 'var', 'const', 'return', 'if', 'else', 'for', 'loop', 'while', 'break', 'continue', 'struct', 'switch', 'case',
  'default', 'discard', 'override', 'alias', 'void', 'in', 'out', 'inout', 'uniform', 'layout', 'precision', 'highp', 'mediump', 'lowp',
  'flat', 'smooth',
]);
const TYPES = /^(?:f32|f16|i32|u32|bool|float|int|uint|[iub]?vec[234][fiuh]?|mat[234](?:x[234])?[fh]?|texture_\w+|[iu]?sampler\w*|array|ptr|atomic)$/;
/**
 * Một token: chú thích, thuộc tính WGSL, số, tên, khoảng trắng, hay một ký tự bất kỳ. Thứ tự các nhánh có nghĩa: tên (`[A-Za-z_]\w*`)
 * nuốt cả chữ số bên trong nó, nên `foo2` không bao giờ bị cắt ra một số; số thập lục phân đứng trước số thập phân, không thì `0x1F`
 * tách thành `0` và `x1F`. Số: `1`, `1.`, `.5`, `1e-3`, `2u`, `0.5h`.
 */
const TOKEN = /\/\/.*|@\w+|0[xX][0-9a-fA-F]+[iu]?|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?[fhiu]?|[A-Za-z_]\w*|\s+|./g;
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escape = (s) => s.replace(/[&<>"]/g, (c) => ESC[c]);
const span = (cls, text, extra = '') => `<span class="${cls}"${extra}>${escape(text)}</span>`;

/**
 * Mã shader thành HTML theo dòng (spec §21.5): mỗi dòng `<span class="line" data-line="N">`, dòng có uniform của lớp thêm `is-layer`;
 * mỗi uniform của lớp là `<span class="u-layer" data-u="<tên>">`, để khung Bản dịch sáng dòng theo núm. Escape TỪNG token lúc ghi ra,
 * nên mã có `<`, `&&` vẫn hiện đúng và không còn ký tự HTML thô nào lọt vào. Màu ở notebook.css, cùng sáu màu của theme code sống.
 * Uniform so bằng TẬP HỢP trên cả tên (token là một tên trọn vẹn), nên `w_hai` không khớp `w_hai_2` hay `aw_hai`; uniform nằm trong
 * chú thích thì không tính. Nơi không có mã (`null`, rỗng) ra khung rỗng, 0 dòng.
 * @param {string | null | undefined} code
 * @param {{ uniforms?: string[] }} [options]  tên uniform của lớp (trọng số và núm)
 * @returns {{ html: string, lines: number, hits: number }}
 */
export function shaderHtml(code, { uniforms = [] } = {}) {
  if (!code) return { html: '<pre class="shader"><code></code></pre>', lines: 0, hits: 0 };
  const mine = new Set(uniforms);
  const rows = code.replace(/\n$/, '').split('\n');
  let hits = 0;
  const body = rows.map((row, i) => {
    let has = false;
    const html = row.replace(TOKEN, (tok) => {
      if (tok.startsWith('//')) return span('tk-c', tok);
      if (tok.startsWith('@')) return span('tk-a', tok);
      if (/^\.?\d/.test(tok)) return span('tk-n', tok);
      if (/^[A-Za-z_]/.test(tok)) {
        if (mine.has(tok)) {
          has = true;
          return span('u-layer', tok, ` data-u="${tok}"`);
        }
        if (KEYWORDS.has(tok)) return span('tk-k', tok);
        if (TYPES.test(tok)) return span('tk-t', tok);
      }
      return escape(tok);
    });
    if (has) hits += 1;
    return `<span class="line${has ? ' is-layer' : ''}" data-line="${i + 1}">${html}</span>`;
  }).join('\n');
  return { html: `<pre class="shader"><code>${body}</code></pre>`, lines: rows.length, hits };
}
