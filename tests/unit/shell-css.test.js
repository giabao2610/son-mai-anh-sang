// tests/unit/shell-css.test.js — CSS của vỏ trang: nhấn giữ trên canvas là cử chỉ của bức, không phải chọn chữ (iOS).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../src/styles/shell.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
function declarations(selector) {
  const out = [];
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
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
