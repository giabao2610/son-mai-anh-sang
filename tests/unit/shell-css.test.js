// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';

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

  it('hòa dần trong đúng CROSSFADE_MS của ui/moon-progress.js: quầng trăng đầy rồi tan xong cùng lúc canvas hiện rõ', () => {
    expect(declarations('[data-stage] canvas')).toMatch(new RegExp(`transition: opacity ${CROSSFADE_MS}ms `));
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

describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
  /** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
  const reducedMotion = () => [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
    .map((m) => m[1])
    .join('\n');

  it('vòng nét không tô, dasharray 1 2: vòng có pathLength 1 nên dashoffset 1 là rỗng, 0 là đầy', () => {
    const halo = declarations('.moon-halo');
    expect(halo).toMatch(/fill: none/);
    // Vì sao là `1 2`: chú thích cạnh stroke-dasharray của .moon-halo trong shell.css.
    expect(halo).toMatch(/stroke-dasharray: 1 2(;|\s|$)/);
  });

  it('nét 7: vòng vẽ ở toạ độ riêng gấp 100 rồi scale(0.01) (ui/moon-progress.js), trên trăng nét còn 0,07', () => {
    expect(declarations('.moon-halo')).toMatch(/stroke-width: 7(;|\s|$)/);
  });

  it('giảm chuyển động thì không có transition: !important thắng transition inline của ui/moon-progress.js', () => {
    expect(declarations('.moon-halo', reducedMotion())).toMatch(/transition: none !important/);
  });
});
