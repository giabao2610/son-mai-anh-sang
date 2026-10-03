// tests/paintings/html.test.js — trang HTML của mỗi dòng registry khớp meta của bức (đọc bằng JSDOM, không chạy script)
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { SITE, paintings } from '../../src/paintings/registry.js';
import { mergePalette } from '../../src/engine/palette.js';
import { svgColors } from '../helpers/svg.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const nfc = (s) => s.normalize('NFC').trim();


describe('svgColors (tự kiểm)', () => {
  it('bắt màu thật, bỏ qua tham chiếu id', () => {
    expect([...svgColors('<rect fill="#bed"/><use href="#bed"/><rect fill="url(#bed)"/>')]).toEqual(['#BED']);
    expect([...svgColors('<use href="#face"/><path fill="url(#cafe)"/>')]).toEqual([]);
  });
});

for (const { meta, page, lang } of paintings) {
  describe(`${page} · ${meta.slug}`, () => {
    let doc;
    const $ = (sel) => doc.querySelector(sel);
    beforeAll(() => {
      doc = new JSDOM(readFileSync(ROOT + page, 'utf8')).window.document;
    });

    it('lang, data-painting, data-state đầu, <title> và description khớp meta', () => {
      expect(doc.documentElement.lang).toBe(lang);
      expect(doc.body.dataset.painting).toBe(meta.slug);
      expect(doc.body.dataset.state).toBe('poster');
      expect(doc.title.startsWith(`${meta.title} · `)).toBe(true);
      expect($('meta[name="description"]')?.getAttribute('content')).toBe(meta.tagline);
    });

    it('thơ in sẵn: mỗi con của [data-poem] là một <p> đúng một câu; nguồn nằm ngoài, trong <figcaption>', () => {
      const poem = $('[data-poem]');
      const kids = [...poem.children];
      expect(kids.map((el) => el.tagName)).toEqual(meta.poem.lines.map(() => 'P'));
      expect(kids.map((el) => nfc(el.textContent))).toEqual(meta.poem.lines.map(nfc));
      const cite = poem.closest('figure')?.querySelector('figcaption cite');
      expect(nfc(cite?.textContent ?? '')).toBe(nfc(meta.poem.source));
    });

    it('poster: src, width, height, alt khớp meta.poster; file có trong public/ và đủ nhẹ', () => {
      const img = $('img[data-poster]');
      expect(img.getAttribute('src')).toBe(meta.poster.src);
      expect(Number(img.getAttribute('width'))).toBe(meta.poster.width);
      expect(Number(img.getAttribute('height'))).toBe(meta.poster.height);
      expect(img.getAttribute('alt')).toBe(meta.poster.alt);
      expect(img.getAttribute('fetchpriority')).toBe('high');
      const file = ROOT + 'public' + meta.poster.src;
      expect(existsSync(file)).toBe(true);
      const limit = meta.poster.src.endsWith('.svg') ? 10 * 1024 : 150 * 1024;
      expect(statSync(file).size).toBeLessThanOrEqual(limit);
    });

    it('thẻ chia sẻ (GĐ 4): og:title = <title>, og:description = tagline, og:url = SITE, og:image = SITE + meta.og (1200×630), twitter summary_large_image', () => {
      const prop = (name) => $(`meta[property="${name}"]`)?.getAttribute('content');
      expect(prop('og:title')).toBe(doc.title);
      expect(prop('og:description')).toBe(meta.tagline);
      expect(prop('og:type')).toBe('website');
      expect(prop('og:url')).toBe(SITE + page.replace(/index\.html$/, ''));
      expect(meta.og, 'meta.og là đường dẫn trong public/, không có "/" đầu').toMatch(/^[^/].*\.jpg$/);
      expect(prop('og:image')).toBe(SITE + meta.og);
      expect([prop('og:image:width'), prop('og:image:height')]).toEqual(['1200', '630']);
      expect($('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
    });

    it('poster SVG chỉ dùng màu của bảng sơn mài (đã ghép meta.palette)', () => {
      if (!meta.poster.src.endsWith('.svg')) return;
      const svg = readFileSync(ROOT + 'public' + meta.poster.src, 'utf8');
      const allowed = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));
      expect([...svgColors(svg)].filter((h) => !allowed.has(h))).toEqual([]);
    });

    it('có đủ các ô mà xưởng điền vào: stage, con dấu, huy hiệu (+ ghi chú), tầng tĩnh, gợi ý', () => {
      expect($('[data-stage]')).not.toBeNull();
      expect($('[data-seal]')).not.toBeNull();
      const badge = $('button[data-badge]');
      expect(badge?.getAttribute('type')).toBe('button');
      expect(badge.hidden).toBe(true);
      // Vùng aria-live có sẵn trong cây trợ năng từ đầu (không hidden) và để trống: nhờ vậy trình đọc màn hình
      // đọc được chữ điền vào sau. Vừa bỏ hidden vừa điền chữ trong cùng một nhịp thì VoiceOver hay bỏ qua.
      for (const sel of ['[data-badge-note]', '[data-hint]', 'section[data-static]']) {
        const live = $(sel);
        expect(live, sel).not.toBeNull();
        expect(live.hidden, `${sel} không được có hidden`).toBe(false);
        expect(live.getAttribute('aria-live'), sel).toBe('polite');
        expect(live.childNodes.length, `${sel} phải trống`).toBe(0);
      }
    });

    it('nếu có ô trăng [data-moon] thì là <svg> rỗng, viewBox bao đĩa bán kính 1, ẩn với trình đọc màn hình', () => {
      const moon = $('[data-moon]');
      if (!moon) return; // bức không có trăng thì bỏ ô này
      expect(moon.tagName.toLowerCase()).toBe('svg');
      expect(moon.getAttribute('viewBox')).toBe('-1.1 -1.1 2.2 2.2');
      expect(moon.getAttribute('aria-hidden')).toBe('true');
      expect(moon.childElementCount).toBe(0);
    });

    it('favicon và stylesheet trỏ tới file có thật', () => {
      const icon = $('link[rel="icon"]')?.getAttribute('href') ?? '';
      expect(icon.startsWith('/')).toBe(true);
      expect(existsSync(ROOT + 'public' + icon)).toBe(true);
      expect($('link[rel="stylesheet"]')?.getAttribute('href')).toBe('/src/styles/shell.css');
      expect(existsSync(ROOT + 'src/styles/shell.css')).toBe(true);
    });

    it('một script module inline duy nhất, import index.js của CHÍNH bức này và strings của ngôn ngữ trang', () => {
      const scripts = doc.querySelectorAll('script');
      expect(scripts).toHaveLength(1);
      const [script] = scripts;
      expect(script.getAttribute('type')).toBe('module');
      expect(script.hasAttribute('src')).toBe(false);
      const code = script.textContent;
      expect(code).toContain("import { boot } from '/src/engine/boot.js';");
      expect(code).toContain(`import entry from '/src/paintings/${meta.slug}/index.js';`);
      expect(code).toContain(`import t from '/src/ui/strings.${lang}.js';`);
      expect(code).toContain(`boot(entry, { lang: '${lang}', t });`);
      expect(existsSync(`${ROOT}src/paintings/${meta.slug}/index.js`)).toBe(true);
      expect(existsSync(`${ROOT}src/ui/strings.${lang}.js`)).toBe(true);
    });
  });
}

describe('styles/tools.css (GĐ 4)', () => {
  it('thanh công cụ nằm DƯỚI thanh lớp và Sổ tay (z-index nhỏ hơn hẳn): nó đứng ngay sau thanh lớp trong DOM (thứ tự Tab, GĐ 5), bằng z-index thì nó và tay nắm gạt (cao cả khung) đè lên thanh lớp', () => {
    const zIndex = (file, selector) => {
      const css = readFileSync(ROOT + file, 'utf8');
      const rule = css.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`));
      return Number(rule?.[1].match(/z-index:\s*(\d+)/)?.[1]);
    };
    const toolbar = zIndex('src/styles/tools.css', '\\.toolbar');
    const panels = zIndex('src/styles/notebook.css', '\\.rail,\\s*\\.notebook');
    expect([toolbar, panels].every(Number.isFinite), `toolbar ${toolbar}, rail/notebook ${panels}`).toBe(true);
    expect(toolbar).toBeLessThan(panels);
  });

  it('các dòng chữ dưới hàng thanh trượt giữ khoảng 8px của .tool-panel; dòng trống (aria-live, tóm tắt lúc đang đếm) thì thu lại', () => {
    // JSDOM 30 tính cascade theo độ ưu tiên: `.tool-x { margin: 0 }` ngang hàng `.tool-panel > * + *` mà đứng sau thì xóa khoảng 8px.
    const css = readFileSync(ROOT + 'src/styles/tools.css', 'utf8');
    const lines = ['tool-status', 'tool-detail', 'tool-summary', 'tool-note'].map((c) => `<p class="${c}">chữ</p>`).join('');
    const { window } = new JSDOM(`<style>${css}</style><div class="tool-panel"><div class="tool-row"></div>${lines}`
      + '<p class="tool-status"></p><p class="tool-summary"></p></div>');
    const [, ...rows] = window.document.querySelector('.tool-panel').children;
    expect(rows.map((p) => `${p.className}${p.textContent ? '' : ' (trống)'} ${window.getComputedStyle(p).marginTop}`)).toEqual([
      'tool-status 8px', 'tool-detail 8px', 'tool-summary 8px', 'tool-note 8px', 'tool-status (trống) 0px', 'tool-summary (trống) 0px',
    ]);
  });
});

describe('styles/shell.css (trang nào cũng dùng)', () => {
  it('@import tokens.css, notebook.css (GĐ 2), tools.css (GĐ 4), captions.css (GĐ 5) rồi đúng 5 file font theo trọng lượng (spec §5), trước luật đầu tiên', () => {
    const css = readFileSync(ROOT + 'src/styles/shell.css', 'utf8');
    const imports = [...css.matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
    expect(imports).toEqual([
      './tokens.css',
      './notebook.css',
      './tools.css',
      './captions.css',
      '@fontsource/cormorant-garamond/500.css',
      '@fontsource/cormorant-garamond/500-italic.css',
      '@fontsource/be-vietnam-pro/400.css',
      '@fontsource/be-vietnam-pro/600.css',
      '@fontsource/jetbrains-mono/400.css',
    ]);
    // @import đứng sau một luật bất kỳ sẽ bị trình duyệt lặng lẽ bỏ qua.
    expect(css.indexOf('{')).toBeGreaterThan(css.lastIndexOf('@import'));
  });
});
