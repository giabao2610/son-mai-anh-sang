// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng; chữ đi theo vật.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';
import { CAPTION_FADE } from '../../src/ui/captions.js';

const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const css = read('shell.css');
const notebookCss = read('notebook.css');
const captionsCss = read('captions.css');

/** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
function declarations(selector, source = css) {
  const out = [];
  for (const [, selectors, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some((s) => s.trim() === selector)) out.push(body);
  }
  return out.join(';').replace(/\s+/g, ' ');
}

/** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
const reducedMotion = (source = css) => [...source.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
  .map((m) => m[1])
  .join('\n');

/**
 * Khai báo thắng của một .caption mang các thuộc tính `attrs` (vd. ['data-shown', 'data-away']) trong captions.css, tính như
 * trình duyệt: mọi bộ chọn của chữ là .caption kèm vài [thuộc tính] (file không dùng !important), nên khối khớp có nhiều thuộc
 * tính hơn thì thắng, bằng nhau thì khối đứng sau thắng. `reduced`: người xem xin giảm chuyển động (tính cả khối @media đó).
 * Gặp luật cho .caption mà nó không tính đúng được (bộ chọn khác dạng trên, hay một khối @media khác) thì ném lỗi: bỏ qua lặng
 * lẽ thì một luật như `.captions .caption[data-shown]` đè lên data-away trên trình duyệt mà test vẫn xanh.
 * @param {string[]} attrs
 * @param {{ reduced?: boolean, source?: string }} [opts]  source: CSS đã bỏ chú thích (mặc định captions.css)
 * @returns {Record<string, string>}  thuộc tính CSS → giá trị
 */
function captionStyle(attrs, { reduced = false, source = captionsCss } = {}) {
  const won = {};
  // Các khối theo thứ tự trong file: một khối @media (lồng một tầng ngoặc) hay một khối thường.
  for (const [, media, inner, selectors, body] of source.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}|([^{}]+)\{([^{}]*)\}/g)) {
    const isReduced = media !== undefined && /prefers-reduced-motion:\s*reduce/.test(media);
    const blocks = media === undefined ? [[selectors, body]] : [...inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1], m[2]]);
    for (const [list, decls] of blocks) {
      for (const raw of list.split(',')) {
        const selector = raw.trim();
        if (!/\.caption(?![\w-])/.test(selector)) continue; // .captions, .caption-line…: không phải luật của chữ
        const m = /^\.caption((?:\[[\w-]+\])*)$/.exec(selector);
        if (!m) throw new Error(`captionStyle chưa hiểu bộ chọn "${selector}": mở rộng bộ giải trước khi thêm luật này`);
        if (media !== undefined && !isReduced) throw new Error(`captionStyle chưa hiểu khối @media${media}có luật cho .caption`);
        if (media !== undefined && !reduced) continue; // khối giảm chuyển động chỉ áp khi người xem xin
        const need = m[1].match(/[\w-]+/g) ?? [];
        if (!need.every((a) => attrs.includes(a))) continue;
        for (const decl of decls.split(';')) {
          const colon = decl.indexOf(':');
          const prop = decl.slice(0, colon).trim();
          // Khai báo trước chỉ giữ được chỗ khi khối của nó có nhiều thuộc tính hơn; bằng nhau thì khối này (đứng sau) thắng.
          if (colon < 0 || (won[prop] && won[prop].specificity > need.length)) continue;
          won[prop] = { specificity: need.length, value: decl.slice(colon + 1).trim().replace(/\s+/g, ' ') };
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(won).map(([prop, { value }]) => [prop, value]));
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

describe('captions.css · chữ đi theo vật (GĐ 5)', () => {
  it('vùng chữ phủ kín [data-stage] (cùng cỡ canvas), không nhận chạm; cả vùng live lẫn chữ không bao giờ display: none hay visibility: hidden', () => {
    const region = declarations('.captions', captionsCss);
    expect(region).toMatch(/position: absolute/);
    expect(region).toMatch(/inset: 0/);
    expect(region).toMatch(/pointer-events: none/);
    // Chữ ra ngoài khung chỉ trong suốt (data-away): vẫn ở trong cây trợ năng, nên vào lại khung không bị đọc lại.
    expect(captionsCss).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    expect(declarations('.caption[data-away]', captionsCss)).toMatch(/opacity: 0(;|\s|$)/);
  });

  it('điểm neo ra ngoài khung (data-away) thì chữ ẩn ngay, đè lên [data-shown] và [data-fading], cả khi giảm chuyển động', () => {
    for (const reduced of [false, true]) {
      for (const attrs of [['data-away'], ['data-shown', 'data-away'], ['data-shown', 'data-fading', 'data-away']]) {
        const { opacity, transition } = captionStyle(attrs, { reduced });
        expect({ opacity, transition }, `${attrs.join(' ')}${reduced ? ' (giảm chuyển động)' : ''}`).toEqual({ opacity: '0', transition: 'none' });
      }
    }
    // Vào lại khung: gỡ data-away là về [data-shown], và chữ mờ dần hiện ra như lúc mới thả.
    expect(captionStyle(['data-shown']).opacity).toBe('1');
    expect(captionStyle(['data-shown']).transition).toMatch(/^opacity \d/);
  });

  it('bộ giải cascade của test (captionStyle) báo lỗi khi gặp luật cho .caption mà nó chưa hiểu, không lặng lẽ bỏ qua', () => {
    expect(() => captionStyle(['data-shown'], { source: '.captions .caption[data-shown] { opacity: 1; }' })).toThrow(/chưa hiểu/);
    expect(() => captionStyle(['data-shown'], { source: '@media (max-width: 40rem) { .caption[data-shown] { opacity: 0.95; } }' }))
      .toThrow(/chưa hiểu/);
    const plain = '.captions { inset: 0; } .caption-line { display: block; } .caption[data-shown] { opacity: 1; }';
    expect(captionStyle(['data-shown'], { source: plain })).toEqual({ opacity: '1' });
  });

  it(`tan trong đúng CAPTION_FADE (${CAPTION_FADE} s) của ui/captions.js; giảm chuyển động thì không mờ dần và giữ dòng chữ tới khi bị gỡ`, () => {
    expect(captionStyle(['data-shown', 'data-fading']).opacity).toBe('0');
    expect(captionStyle(['data-shown', 'data-fading']).transition).toMatch(new RegExp(`^opacity ${CAPTION_FADE}s `));
    const reduced = reducedMotion(captionsCss);
    expect(declarations('.caption', reduced)).toMatch(/transition: none/);
    expect(declarations('.caption[data-fading]', reduced)).toMatch(/transition: none/);
    // Không tan sớm CAPTION_FADE giây: chữ đứng nguyên rồi tắt ngay khi clear() gỡ nó (hết CAPTION_SECONDS).
    for (const attrs of [['data-shown'], ['data-shown', 'data-fading']]) {
      const { opacity, transition } = captionStyle(attrs, { reduced: true });
      expect({ opacity, transition }, attrs.join(' ')).toEqual({ opacity: '1', transition: 'none' });
    }
  });

  it('?poster không có chữ: body[data-poster] ẩn cả vùng chữ (thứ tự @import do tests/paintings/html.test.js giữ)', () => {
    const hidden = /body\[data-poster\] :is\(([^)]*)\)\s*\{\s*display: none !important;?\s*\}/.exec(css)?.[1] ?? '';
    expect(hidden.split(',').map((s) => s.trim())).toContain('.captions');
  });
});
