// tests/paintings/html.test.js — trang HTML của mỗi dòng registry khớp meta của bức (đọc bằng JSDOM, không chạy script)
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { paintings } from '../../src/paintings/registry.js';
import { mergePalette } from '../../src/engine/palette.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const nfc = (s) => s.normalize('NFC').trim();

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

    it('poster SVG chỉ dùng màu của bảng sơn mài (đã ghép meta.palette)', () => {
      if (!meta.poster.src.endsWith('.svg')) return;
      const svg = readFileSync(ROOT + 'public' + meta.poster.src, 'utf8');
      const allowed = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));
      const used = new Set((svg.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).map((h) => h.toUpperCase()));
      expect([...used].filter((h) => !allowed.has(h))).toEqual([]);
    });

    it('có đủ các ô mà xưởng điền vào: stage, con dấu, huy hiệu (+ ghi chú), tầng tĩnh', () => {
      expect($('[data-stage]')).not.toBeNull();
      expect($('[data-seal]')).not.toBeNull();
      const badge = $('button[data-badge]');
      expect(badge?.getAttribute('type')).toBe('button');
      expect(badge.hidden).toBe(true);
      expect($('[data-badge-note]')?.hidden).toBe(true);
      const note = $('section[data-static]');
      expect(note?.hidden).toBe(true);
      expect(note.getAttribute('aria-live')).toBe('polite');
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

describe('styles/shell.css (trang nào cũng dùng)', () => {
  it('@import tokens.css rồi đúng 5 file font theo trọng lượng (spec §5), tất cả trước luật đầu tiên', () => {
    const css = readFileSync(ROOT + 'src/styles/shell.css', 'utf8');
    const imports = [...css.matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
    expect(imports).toEqual([
      './tokens.css',
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
