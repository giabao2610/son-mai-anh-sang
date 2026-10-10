// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng; chữ đi theo vật; chỗ của bảng công cụ.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';
import { CAPTION_FADE } from '../../src/ui/captions.js';
import { lacquerTheme } from '../../plugins/vite-plugin-code-view.js';

const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const css = read('shell.css');
const notebookCss = read('notebook.css');
const toolsCss = read('tools.css');
const captionsCss = read('captions.css');

/** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
function declarations(selector, source = css) {
  const out = [];
  for (const [, selectors, body] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selectors.split(',').some((s) => s.trim() === selector)) out.push(body);
  }
  return out.join(';').replace(/\s+/g, ' ');
}

/**
 * Mọi khối của một file theo thứ tự, kèm điều kiện của khối @media bao nó (mỗi khối @media lồng được một tầng ngoặc):
 * { media, selectors, body }, media là '' ngoài mọi @media, không thì như '(min-width: 1240px)'.
 */
function blocks(source) {
  const out = [];
  for (const [, media, inner, selectors, body] of source.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}|([^{}]+)\{([^{}]*)\}/g)) {
    if (media === undefined) out.push({ media: '', selectors: selectors.trim(), body });
    else for (const m of inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({ media: media.trim().replace(/\s+/g, ' '), selectors: m[1].trim(), body: m[2] });
  }
  return out;
}

/** Như declarations(), nhưng chỉ trong các khối @media có đúng điều kiện `media` ('' là ngoài mọi @media). */
function declarationsIn(media, selector, source) {
  return blocks(source)
    .filter((b) => b.media === media && b.selectors.split(',').some((s) => s.trim() === selector))
    .map((b) => b.body)
    .join(';')
    .replace(/\s+/g, ' ');
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

describe('shell.css · khung chữ', () => {
  it('một cột: mọi khối của .frame ghim vào cột 1 ([data-static] và .hint cùng ở hàng 2 không đẻ ra cột ngầm thứ hai)', () => {
    // Không ghim cột thì lưới tự xếp .hint sang một cột ngầm bên phải [data-static]: gợi ý bị ép vào cột hẹp (5 dòng trên
    // điện thoại 390px), đầu và chân trang chỉ còn cột 1 nên huy hiệu và con dấu lệch vào giữa màn hình máy tính.
    expect(declarations('.frame > *')).toMatch(/grid-column: 1(;|\s|$)/);
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

describe('tools.css · vùng aria-live của mục Công thức (GĐ 9)', () => {
  it('không có luật :empty nào ẩn vùng bằng display: none hay visibility: hidden (trống thì chỉ bỏ lề)', () => {
    const emptyRules = blocks(toolsCss).filter((b) => /:empty/.test(b.selectors));
    expect(emptyRules.length).toBeGreaterThan(0); // .rail-recipe-status:empty, .tool-status:empty…
    for (const { selectors, body } of emptyRules) expect(body, selectors).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    for (const sel of ['.rail-recipe-text', '.rail-recipe-status', '.rail-recipe-text:empty', '.rail-recipe-status:empty']) {
      expect(declarations(sel, toolsCss), sel).not.toMatch(/display:\s*none|visibility:\s*hidden/);
    }
  });
});

describe('notebook.css · vị trí thanh lớp (GĐ 9)', () => {
  it('máy tính: thanh lớp đứng ngay dưới đầu trang (--rail-top do ui/workshop.js đo), không còn giữa theo chiều dọc', () => {
    const d = declarationsIn('', '.rail', notebookCss);
    expect(d).toMatch(/top: var\(--rail-top/);
    expect(d).not.toMatch(/translateY/);
    expect(d).toMatch(/max-height: calc\(100vh - var\(--rail-top[^)]*\) - var\(--gutter\)\)/);
    expect(d).toMatch(/overflow: auto/);
  });
});

describe('notebook.css · Bản dịch (GĐ 9)', () => {
  it('.tr-status là vùng aria-live: trống thì chỉ bỏ lề, không display: none hay visibility: hidden (như mọi vùng aria-live)', () => {
    for (const selector of ['.tr-status', '.tr-status:empty']) {
      expect(declarations(selector, notebookCss), selector).not.toMatch(/display: none|visibility: hidden/);
    }
    expect(declarations('.tr-status:empty', notebookCss)).toMatch(/margin: 0/);
  });

  it('khung mã: mỗi dòng là một khối xuống dòng được, và <pre> không giữ ký tự \\n giữa các khối (không thì mỗi dòng cách một dòng trống: đo trên Chromium, bước dòng 18 → 37 px)', () => {
    expect(declarations('.code-view .shader', notebookCss)).toMatch(/white-space: normal/);
    const line = declarations('.code-view .shader .line', notebookCss);
    expect(line).toMatch(/display: block/);
    expect(line).toMatch(/white-space: pre-wrap/);
    expect(line).toMatch(/overflow-wrap: anywhere/);
  });

  it('màu từng loại token trùng với theme của code sống (lacquerTheme): từ khóa, kiểu, số, chú thích, thuộc tính, chữ thường', () => {
    const tokens = Object.fromEntries([...read('tokens.css').matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)].map(([, name, hex]) => [name, hex.toUpperCase()]));
    const colorOf = (selector) => {
      const m = declarations(selector, notebookCss).match(/(?:^|[ ;])color: (?:var\((--[a-z0-9-]+)\)|(#[0-9A-Fa-f]{6}))/);
      return (m[1] ? tokens[m[1]] : m[2]).toUpperCase();
    };
    const theme = (scope) => lacquerTheme().tokenColors.find((rule) => rule.scope.includes(scope)).settings.foreground.toUpperCase();
    expect(colorOf('.shader .tk-k'), 'từ khóa').toBe(theme('keyword'));
    expect(colorOf('.shader .tk-t'), 'kiểu').toBe(theme('entity.name.type'));
    expect(colorOf('.shader .tk-n'), 'số').toBe(theme('constant.numeric'));
    expect(colorOf('.shader .tk-c'), 'chú thích').toBe(theme('comment'));
    expect(colorOf('.shader .tk-a'), 'thuộc tính (cùng màu chuỗi của theme)').toBe(theme('string'));
    expect(colorOf('.code-view .shader'), 'chữ thường').toBe(theme('variable'));
    expect(declarations('.code-view .shader', notebookCss)).toMatch(/background: var\(--den-then\)/); // nền của theme: đen then
  });

  it('chỉ dùng màu của bảng sơn mài (biến của tokens.css), ngoài số đỏ son pha ngà của theme code sống', () => {
    const block = notebookCss.slice(notebookCss.indexOf('.tr-head'), notebookCss.indexOf('.nb-experiments'));
    expect([...new Set(block.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? [])]).toEqual(['#D08476']);
  });
});

describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
  it('vòng nét không tô, dasharray 1 2: vòng có pathLength 1 nên dashoffset 1 là rỗng, 0 là đầy', () => {
    const halo = declarations('.moon-halo');
    expect(halo).toMatch(/fill: none/);
    // Vì sao là `1 2`: chú thích cạnh stroke-dasharray của .moon-halo trong shell.css.
    expect(halo).toMatch(/stroke-dasharray: 1 2(;|\s|$)/);
  });

  it('nét 9: vòng vẽ ở toạ độ riêng gấp 100 rồi scale(0.01) (ui/moon-progress.js), trên trăng nét còn 0,09', () => {
    expect(declarations('.moon-halo')).toMatch(/stroke-width: 9(;|\s|$)/);
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

describe('tools.css · bảng công cụ không bao giờ nằm dưới thanh lớp hay Sổ tay (GĐ 5)', () => {
  const RAIL_OPEN = '.rail:not([hidden]) ~ .toolbar';
  // Bảng hẹp nhất còn dùng được, đo trên GPU thật ở 1280×800: hàng của Từng sợi (nhãn, thanh 260px, số đếm, "Dệt lại") một dòng là
  // 451px, cộng 26px đệm và viền của .tool-panel là 477px; hàng view của Kính mài 475px, Lột lớp 458px.
  const PANEL_MIN = 480;

  it('thanh lớp và Sổ tay đọc bề rộng từ --rail-w và --notebook-w: chính hai biến mà tools.css dùng để đặt bảng công cụ', () => {
    const root = declarations(':root', notebookCss);
    expect(root).toMatch(/--rail-w: 224px/);
    expect(root).toMatch(/--notebook-w: min\(440px, calc\(100vw - 300px\)\)/);
    expect(declarations('.rail', notebookCss)).toMatch(/(^|[;\s])width: var\(--rail-w\)/);
    expect(declarations('.notebook', notebookCss)).toMatch(/(^|[;\s])width: var\(--notebook-w\)/);
  });

  it('máy tính, thanh lớp mở: bảng bắt đầu sau thanh lớp; đủ chỗ thì dừng trước Sổ tay (cả khi Sổ tay đóng, bảng không nhảy), không thì Sổ tay thu lại khi công cụ bật', () => {
    // Thanh công cụ đứng ngay sau thanh lớp trong trang (thứ tự Tab), nên "~" đọc được thanh lớp đang mở mà không cần :has().
    // Bề rộng CSS có thể lẻ (zoom trình duyệt: cửa sổ 1549px ở 125% là 1239.2px), nên không có cặp min-width 641px / max-width
    // 640px (640.8px lọt giữa hai ngưỡng): luật máy tính là mặc định, ngoài mọi @media, và điện thoại đè lên.
    const desktop = declarationsIn('', RAIL_OPEN, toolsCss);
    expect(desktop).toMatch(/left: calc\(var\(--gutter\) \+ var\(--rail-w\) \+ 16px\)/);
    expect(desktop).toMatch(/right: var\(--gutter\)/);
    expect(declarationsIn('(max-width: 640px)', RAIL_OPEN, toolsCss)).toMatch(/left: 0; right: 0/);
    expect(declarationsIn('(min-width: 1240px)', RAIL_OPEN, toolsCss)).toMatch(/right: calc\(var\(--gutter\) \+ var\(--notebook-w\) \+ 16px\)/);
    // Cùng độ ưu tiên thì khối đứng sau thắng: khối của điện thoại và khối 1240px phải đứng sau luật mặc định.
    const at = (media) => blocks(toolsCss).findIndex((b) => b.media === media && b.selectors === RAIL_OPEN);
    expect(at('(max-width: 640px)'), 'khối điện thoại đứng sau luật mặc định').toBeGreaterThan(at(''));
    expect(at('(min-width: 1240px)'), 'khối 1240px đứng sau luật mặc định').toBeGreaterThan(at(''));
    // Một ngưỡng duy nhất cho "Sổ tay thu lại khi công cụ bật", từ điện thoại tới máy tính hẹp; 1239.98px chứ không phải 1239px
    // (quy ước .02 của Bootstrap), để 1239.2px cũng khớp.
    const hides = blocks(toolsCss).filter((b) => b.selectors.split(',').some((s) => s.trim() === 'body[data-tool] .notebook'));
    expect(hides.map((b) => [b.media, b.body.replace(/\s+/g, ' ').trim()])).toEqual([['(max-width: 1239.98px)', 'display: none;']]);
    // Bảng co theo ô của nó (phần tử flex của thanh). Một phần trăm trong max-width của máy tính là phần trăm "vòng" lúc tính bề
    // rộng nội dung của ô: trình duyệt bỏ qua cả max-width (kể cả 560px), ô rộng theo dòng chữ dài nhất và bảng lệch khỏi giữa.
    expect(declarationsIn('', '.tool-panel', toolsCss)).toMatch(/max-width: min\(560px, [^;%]*\);/);
  });

  it(`ngưỡng 1240px = 2 lề + thanh lớp + Sổ tay + 2 khe + bảng hẹp nhất còn dùng được (${PANEL_MIN}px)`, () => {
    const px = (re, source) => Number(re.exec(source)?.[1]);
    const gutter = px(/--gutter: (\d+)px/, css); // lề máy tính (khối :root đầu tiên của shell.css)
    const rail = px(/--rail-w: (\d+)px/, notebookCss);
    const notebook = px(/--notebook-w: min\((\d+)px/, notebookCss); // từ 740px trở lên Sổ tay rộng đúng 440px
    const gap = px(/\+ var\(--rail-w\) \+ (\d+)px/, toolsCss);
    expect([gutter, rail, notebook, gap].every(Number.isFinite), `${gutter} ${rail} ${notebook} ${gap}`).toBe(true);
    expect(px(/\+ var\(--notebook-w\) \+ (\d+)px/, toolsCss), 'hai khe bằng nhau: bảng ở giữa khoảng trống').toBe(gap);
    const threshold = 2 * gutter + rail + notebook + 2 * gap + PANEL_MIN;
    const media = (selector) => blocks(toolsCss).filter((b) => b.selectors === selector).map((b) => b.media);
    expect(media(RAIL_OPEN)).toContain(`(min-width: ${threshold}px)`);
    expect(media('body[data-tool] .notebook')).toEqual([`(max-width: ${threshold - 0.02}px)`]);
  });

  it('không transform, filter, backdrop-filter (hay thuộc tính nào khác tạo khối chứa) trên .toolbar và .tool: tay nắm gạt (position: fixed) đo theo khung nhìn', () => {
    const subject = /\.(toolbar|tool)(?![\w-])[^\s>+~]*$/; // phần cuối của bộ chọn là .toolbar hay .tool (không phải .tool-panel…)
    const errors = [];
    for (const [file, source] of [['shell.css', css], ['notebook.css', notebookCss], ['tools.css', toolsCss], ['captions.css', captionsCss]]) {
      for (const b of blocks(source).filter((x) => x.selectors.split(',').some((s) => subject.test(s.trim())))) {
        for (const m of b.body.matchAll(/(?:^|[;\s])((?:-webkit-)?(?:transform|filter|backdrop-filter|perspective|will-change|contain))\s*:/g)) {
          errors.push(`${file} › ${b.selectors} › ${m[1]}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});
