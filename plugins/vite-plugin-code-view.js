// plugins/vite-plugin-code-view.js — import '…?code' → code của lớp đã tô màu bằng Shiki LÚC BUILD, mỗi dòng có data-line, kèm bảng núm → dòng.
import { readFile } from 'node:fs/promises';
import { createHighlighter } from 'shiki';
import { PALETTE } from '../src/engine/palette.js';

/** Marker của núm: `// @knob <id>` ở dòng dùng uniform (núm 'uniform') hoặc dòng xử lý onKnob (núm 'js'/'rebuild'). */
const MARKER = /\/\/\s*@knob\s+([A-Za-z0-9_]+)/g;

/**
 * Dòng (tính từ 1) của mọi marker trong một file: { knobId: [dòng, …] }. Một núm có thể có nhiều dòng.
 * @param {string} source
 * @returns {Record<string, number[]>}
 */
export function knobLines(source) {
  const lines = {};
  source.split('\n').forEach((text, i) => {
    for (const [, id] of text.matchAll(MARKER)) (lines[id] ??= []).push(i + 1);
  });
  return lines;
}

/**
 * Theme Shiki làm từ bảng màu sơn mài: nền đen then, chữ ngà, từ khóa vàng lá, hàm vàng lá sáng, chuỗi bạc lá,
 * chú thích đất sét. Số dùng một sắc đỏ son pha ngà: đỏ son nguyên chất quá tối để đọc trên nền đen then.
 * Mọi màu chữ đạt độ tương phản ≥ 4.5:1 (WCAG AA) trên nền; test giữ điều đó.
 */
export function lacquerTheme(p = PALETTE) {
  const number = '#D08476'; // = trung bình của đỏ son (#B3261E) và ngà (#EDE3CF)
  const rule = (scope, foreground, fontStyle) => ({ scope, settings: fontStyle ? { foreground, fontStyle } : { foreground } });
  return {
    name: 'son-mai',
    type: 'dark',
    colors: { 'editor.background': p.denThen, 'editor.foreground': p.nga },
    tokenColors: [
      rule(['comment', 'punctuation.definition.comment'], p.datSet, 'italic'),
      rule(['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'keyword.operator.expression'], p.vangLa),
      rule(['string', 'string.template', 'punctuation.definition.string', 'punctuation.definition.template-expression'], p.bacLa),
      rule(['constant.numeric', 'constant.language', 'constant.character'], number),
      rule(['entity.name.function', 'support.function', 'meta.function-call entity.name.function'], p.vangLaSang),
      rule(['entity.name.type', 'entity.name.class', 'support.class', 'support.type'], p.vangLaSang),
      rule(['variable', 'variable.other', 'variable.parameter', 'meta.object-literal.key'], p.nga),
    ],
  };
}

/**
 * Plugin Vite: `import code from './l1-cot.js?code'` (ui/code-view.js import qua import.meta.glob) cho ra
 * `{ html, knobs }`: html là <pre class="shiki"> đã tô màu, mỗi `<span class="line">` có `data-line="N"`;
 * knobs là bảng núm → dòng. Shiki chạy lúc build (và lúc dev), nên trình duyệt không tải Shiki.
 */
export function codeView() {
  let highlighter = null; // tạo một lần, lần đầu có file ?code (Shiki nạp ngữ pháp mất vài trăm ms)
  return {
    name: 'son-mai:code-view',
    enforce: 'pre',
    async load(id) {
      const [file, query] = id.split('?');
      if (query !== 'code') return null;
      const source = await readFile(file, 'utf8');
      highlighter ??= createHighlighter({ themes: [lacquerTheme()], langs: ['javascript'] });
      const html = (await highlighter).codeToHtml(source, {
        lang: 'javascript',
        theme: 'son-mai',
        transformers: [{ line(node, line) { node.properties['data-line'] = line; } }],
      });
      return `export default ${JSON.stringify({ html, knobs: knobLines(source) })};`;
    },
  };
}
