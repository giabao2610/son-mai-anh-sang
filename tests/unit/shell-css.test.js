// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const css = read('shell.css');
const notebookCss = read('notebook.css');

/** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
function declarations(selector, source = css) {
  const out = [];
  for (const [, selectors, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some((s) => s.trim() === selector)) out.push(body);
  }
  return out.join(';').replace(/\s+/g, ' ');
}

describe('shell.css · canvas của sân khấu', () => {
  it('nhấn giữ không chọn chữ, không mở kính lúp hay callout (iOS không có contextmenu để chặn)', () => {
    const canvas = declarations('[data-stage] canvas');
    expect(canvas).toMatch(/(^|[;\s])user-select: none/);
    expect(canvas).toMatch(/-webkit-user-select: none/);
    expect(canvas).toMatch(/-webkit-touch-callout: none/);
  });
});

describe('shell.css · vùng aria-live', () => {
  it('khi trống chỉ thu khung (không viền, không nền), không display: none hay visibility: hidden', () => {
    const regions = [['[data-badge-note]:empty', css], ['[data-static]:empty', css], ['.hint:empty', css], ['.nb-busy:empty', notebookCss]];
    for (const [sel, source] of regions) {
      const d = declarations(sel, source);
      expect(d, sel).toMatch(/padding: 0/);
      expect(d, sel).toMatch(/border: 0/);
      expect(d, sel).not.toMatch(/display: none|visibility: hidden/);
    }
  });
});
