// tests/rules/imports.test.js — luật ranh giới §8.2: bảng hướng phụ thuộc, đường nhẹ, hàng rào từ vựng, chữ giao diện.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { paintings } from '../../src/paintings/registry.js';
import { ROOT, globsOf, importsOf, isBare, isThree, listSrc, read, staticClosure, stripComments } from '../helpers/source.js';

const FILES = listSrc();
const report = (title, errors) => `${title}\n${errors.map((e) => `  ${e}`).join('\n')}`;

// ─── Bảng §8.2 ───────────────────────────────────────────────────────────
/** Hàng của bảng: file nguồn thuộc vùng nào. null = ngoài bảng (plugins/…). */
function zoneOf(file) {
  if (file === 'src/paintings/registry.js') return 'registry';
  if (/^src\/paintings\/[^/]+\//.test(file)) return 'painting';
  if (/^src\/engine\/stock\/[^/]+\//.test(file)) return 'stock';
  if (/^src\/engine\/(gpu|tools)\//.test(file)) return 'heavy';
  if (/^src\/engine\/([^/]+\.js$|contracts\/)/.test(file)) return 'light';
  if (file.startsWith('src/ui/')) return 'ui';
  if (file.startsWith('src/lib/')) return 'lib';
  return null;
}

/** Cột của bảng: thứ được import thuộc loại nào. */
function columnOf(bare, target) {
  if (bare) {
    // Inspector nằm trong gói three nhưng dùng localStorage: tính như gói npm "chỉ import() động".
    if (target.startsWith('three/addons/inspector/')) return 'npm';
    return isThree(target) ? 'three' : 'npm';
  }
  if (target.startsWith('src/lib/')) return 'lib';
  if (target.startsWith('src/engine/stock/')) return 'stock';
  if (/^src\/engine\/(gpu|tools)\//.test(target)) return 'heavy';
  if (/^src\/engine\/([^/]+\.js$|contracts\/)/.test(target)) return 'light';
  if (target.startsWith('src/ui/')) return 'ui';
  if (target.startsWith('src/paintings/')) return 'paintings';
  return 'other';
}

const ZONE_NAME = {
  lib: 'lib/', light: 'engine/*.js', heavy: 'engine/gpu, engine/tools', stock: 'engine/stock/<id>/',
  ui: 'ui/', painting: 'paintings/<slug>/', registry: 'paintings/registry.js',
};
const COLUMN_NAME = {
  three: 'three', npm: 'gói npm', lib: 'lib/', light: 'engine/*.js', stock: 'engine/stock/',
  heavy: 'engine/gpu, engine/tools', ui: 'ui/', paintings: 'paintings/', other: 'file ngoài các vùng',
};
const ownDir = (file, depth) => `${file.split('/').slice(0, depth).join('/')}/`;

/**
 * Một ô của bảng §8.2. Trả null nếu được phép, hoặc lý do (tiếng Việt) nếu cấm.
 * @param {string} file  file đang import
 * @param {{ spec: string, target: string, dynamic: boolean }} imp
 */
function violation(file, { spec, target: raw, dynamic }) {
  const bare = isBare(spec);
  // Thiếu đuôi thì luật "ghi rõ đuôi" bên dưới đã báo; ở đây coi như có .js để khỏi báo trùng.
  const target = bare || /\.[a-z]+$/.test(raw) ? raw : `${raw}.js`;
  const zone = zoneOf(file);
  const col = columnOf(bare, target);
  const no = `${ZONE_NAME[zone]} không được import ${COLUMN_NAME[col]}`;
  switch (zone) {
    case null:
      return null;
    case 'lib':
      if (col === 'lib') return null;
      if (col === 'three') return file.startsWith('src/lib/tsl/') ? null : 'chỉ lib/tsl được import three';
      return 'lib/ là lá: chỉ import lib/';
    case 'light':
      if (col === 'light' || col === 'ui') return null;
      if (col === 'lib') return /^src\/lib\/(astro\/|random\.js$)/.test(target) ? null : 'xưởng nhẹ chỉ dùng lib/astro và lib/random.js';
      if (col === 'heavy') return dynamic && file === 'src/engine/boot.js' ? null : 'phần nặng chỉ được boot.js tải bằng import() động';
      return no;
    case 'heavy':
      if (['three', 'lib', 'light', 'heavy'].includes(col)) return null;
      if (col === 'ui') return target === 'src/ui/knobs.js' && !dynamic ? 'ui/knobs.js chỉ được import() động' : null;
      if (col === 'npm') {
        const lazyOk = target === 'stats-gl' || target.startsWith('three/addons/inspector/');
        return lazyOk && dynamic ? null : 'engine/gpu chỉ dùng stats-gl và Inspector, và chỉ qua import() động';
      }
      return no;
    case 'stock':
      if (col === 'three' || col === 'lib') return null;
      if (col === 'stock') return target.startsWith(ownDir(file, 4)) ? null : 'lớp dùng chung chỉ import trong thư mục của mình';
      if (col === 'light') return 'lớp dùng chung lấy màu qua ctx.palette, kiểu qua JSDoc import()';
      return no;
    case 'ui':
      if (col === 'ui') return null;
      if (col === 'lib') return target.startsWith('src/lib/astro/') ? null : 'ui/ chỉ dùng lib/astro';
      if (col === 'npm') return file === 'src/ui/knobs.js' && target === 'tweakpane' ? null : 'ui/ chỉ được dùng gói npm tweakpane, và chỉ trong knobs.js';
      return no;
    case 'painting':
      if (['three', 'lib', 'stock'].includes(col)) return null;
      if (col === 'paintings') return target.startsWith(ownDir(file, 3)) ? null : 'các bức độc lập: chỉ import trong thư mục của mình';
      if (col === 'light') return 'bức không import xưởng; kiểu lấy qua JSDoc import()';
      return no;
    case 'registry':
      return /^src\/paintings\/[^/]+\/meta\.js$/.test(target) ? null : 'registry chỉ import */meta.js';
    default:
      return `vùng lạ: ${zone}`;
  }
}

describe('luật ranh giới (§8.2)', () => {
  it('có file để quét', () => {
    expect(FILES.length).toBeGreaterThan(0);
  });

  it('mọi import theo đúng bảng hướng phụ thuộc', () => {
    const errors = FILES.flatMap((file) => importsOf(file)
      .filter((imp) => imp.spec !== null)
      .map((imp) => [imp, violation(file, imp)])
      .filter(([, why]) => why)
      .map(([imp, why]) => `${file}:${imp.line} → ${imp.spec}${imp.dynamic ? ' (import động)' : ''}: ${why}`));
    expect(errors, report('Import sai hướng:', errors)).toEqual([]);
  });

  it('import() chỉ nhận chuỗi hằng (để Vite và test biết trước file nào được tải)', () => {
    const errors = FILES.flatMap((file) => importsOf(file).filter((imp) => imp.spec === null).map((imp) => `${file}:${imp.line}`));
    expect(errors, report('import() với tham số không phải chuỗi hằng:', errors)).toEqual([]);
  });

  it('import tương đối ghi rõ đuôi .js hoặc .css', () => {
    const errors = FILES.flatMap((file) => importsOf(file)
      .filter((imp) => imp.spec !== null && !isBare(imp.spec) && !/\.(js|css)$/.test(imp.spec.split('?')[0]))
      .map((imp) => `${file}:${imp.line} → ${imp.spec}`));
    expect(errors, report('Thiếu đuôi file:', errors)).toEqual([]);
  });

  it('@fontsource/* chỉ được import từ file .css', () => {
    const errors = FILES.flatMap((file) => importsOf(file)
      .filter((imp) => imp.target?.startsWith('@fontsource/'))
      .map((imp) => `${file}:${imp.line} → ${imp.spec}`));
    expect(errors, report('Font phải import trong src/styles/shell.css:', errors)).toEqual([]);
  });

  it('không file nào trong src/ import ui/strings.*.js (chữ giao diện đi vào qua tham số t)', () => {
    const errors = listSrc(/^src\//).flatMap((file) => importsOf(file)
      .filter((imp) => /^src\/ui\/strings\.[^/]+\.js$/.test(imp.target ?? ''))
      .map((imp) => `${file}:${imp.line} → ${imp.spec}`));
    expect(errors, report('Chỉ trang HTML được import strings.*.js:', errors)).toEqual([]);
  });

  it('import.meta.glob chỉ dùng ở src/ui/code-view.js và luôn kèm ?code', () => {
    const errors = FILES.flatMap((file) => globsOf(read(file), file)
      .filter((g) => file !== 'src/ui/code-view.js' || g.query !== '?code')
      .map((g) => `${file}:${g.line} → import.meta.glob(${g.patterns.join(', ')})`));
    expect(errors, report('import.meta.glob sai chỗ:', errors)).toEqual([]);
  });
});

// ─── Đường nhẹ: bằng chứng cho "poster dưới 1 giây" ─────────────────────
const LIGHT_ALLOW = [
  /^src\/engine\/[^/]+\.js$/,
  /^src\/engine\/contracts\//,
  /^src\/engine\/stock\/[^/]+\/meta\.js$/,
  /^src\/ui\/(?!knobs\.js$)/,
  /^src\/lib\/astro\//,
  /^src\/lib\/random\.js$/,
  /^src\/paintings\/[^/]+\/(index|meta)\.js$/,
];
const LIGHT_ROOTS = listSrc(/^src\/engine\/boot\.js$|^src\/paintings\/[^/]+\/index\.js$/);

describe('đường nhẹ (§8.2)', () => {
  it('có ít nhất một điểm vào (boot.js hoặc paintings/*/index.js)', () => {
    expect(LIGHT_ROOTS.length).toBeGreaterThan(0);
  });

  it('bao đóng import tĩnh từ boot.js và paintings/*/index.js chỉ gồm file trong danh sách cho phép, không có gói npm', () => {
    const errors = LIGHT_ROOTS.flatMap((root) => staticClosure(root)
      .filter((t) => !LIGHT_ALLOW.some((re) => re.test(t)))
      .map((t) => `${root} ⇒ ${t}${t.startsWith('src/') ? '' : ' (gói npm hoặc file ngoài src/)'}`));
    expect(errors, report('Đường nhẹ kéo theo thứ nặng (three chỉ được tải bằng import() động):', errors)).toEqual([]);
  });

  // Tầng tĩnh là chỗ dựa của máy cũ: phần nhẹ phải chạy cả trên Safari 14 (phần nhẹ đã cần replaceChildren, có từ Safari 14).
  // Built-in từ ES2022 trở đi (và structuredClone) thì Safari 14 chưa có: gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ huy
  // hiệu và ghi chú. Phần nặng chỉ chạy trên trình duyệt có WebGPU/WebGL2 đời mới, nên được dùng.
  const MODERN = /\bObject\s*\.\s*hasOwn\s*\(|\.\s*at\s*\(|\bstructuredClone\s*\(|\.\s*(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\s*\(|\b(?:Object|Map)\s*\.\s*groupBy\s*\(|\bPromise\s*\.\s*withResolvers\s*\(/g;
  it('phần nhẹ không gọi built-in ES2022 trở lên (Object.hasOwn, .at(), findLast…): tầng tĩnh chạy cả trên Safari 14', () => {
    const files = [...new Set(LIGHT_ROOTS.flatMap((root) => [root, ...staticClosure(root)]))]
      .filter((f) => f.startsWith('src/') && f.endsWith('.js'));
    const errors = [];
    for (const file of files) {
      const code = stripComments(read(file), file);
      for (const m of code.matchAll(MODERN)) {
        errors.push(`${file}:${code.slice(0, m.index).split('\n').length} — ${m[0].replace(/\s+/g, '')}`);
      }
    }
    expect(errors, report('Phần nhẹ gọi built-in mà trình duyệt cũ của tầng tĩnh chưa có (dùng cách cũ, vd. hasOwnProperty.call):', errors)).toEqual([]);
  });
});

// ─── Hàng rào từ vựng: xưởng không nói tiếng của bức ─────────────────────
const STOCK_IDS = readdirSync(join(ROOT, 'src/engine/stock'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const METAS = paintings.map((p) => p.meta);
const FENCE = [...new Set([
  ...METAS.map((m) => m.slug),
  ...METAS.flatMap((m) => m.layers.map((l) => l.id)).filter((id) => id !== 'cot' && !STOCK_IDS.includes(id)),
  ...METAS.flatMap((m) => m.fence ?? []),
])];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAsciiWord = (s) => /^[\x21-\x7e]+$/.test(s); // ASCII, không có khoảng trắng
// Từ ASCII: chuỗi con, không phân biệt hoa thường (bắt được rippleHeight, addRipple, uHourNode).
// Cụm từ (có dấu hoặc có khoảng trắng): theo ranh giới chữ \p{L} sau khi chuẩn hóa NFC.
const MATCHERS = FENCE.map((term) => ({
  term,
  re: isAsciiWord(term)
    ? new RegExp(escapeRe(term), 'gi')
    : new RegExp(`(?<!\\p{L})${escapeRe(term.normalize('NFC'))}(?!\\p{L})`, 'giu'),
}));

/** Mọi chỗ trong text chạm hàng rào: [{ term, index }]. */
function fenceHits(text) {
  const s = text.normalize('NFC');
  return MATCHERS.flatMap(({ term, re }) => [...s.matchAll(re)].map((m) => ({ term, index: m.index })));
}

describe('hàng rào từ vựng (§8.2)', () => {
  it('hàng rào lấy từ meta của mọi bức: slug, id lớp riêng (trừ cot và lớp dùng chung), meta.fence', () => {
    expect(FENCE).toContain('ao-sen-dem');
    expect(FENCE).toContain('mat-nuoc');
    expect(FENCE).not.toContain('cot');
    for (const id of STOCK_IDS) expect(FENCE).not.toContain(id);
  });

  it('tự kiểm: bắt rippleHeight, addRipple, uHourNode; không bắt vangLa, tripleBuffer, Firefox', () => {
    for (const word of ['rippleHeight', 'addRipple', 'uHourNode']) expect(fenceHits(word), word).not.toEqual([]);
    for (const word of ['vangLa', 'tripleBuffer', 'Firefox']) expect(fenceHits(word), word).toEqual([]);
    // Cụm từ: không phân biệt hoa thường, nhưng phải đứng riêng (không dính vào chữ khác).
    expect(fenceHits('const s = "Mặt nước";').map((h) => h.term)).toContain('mặt nước');
    expect(fenceHits('const s = "Hoa sen";').map((h) => h.term)).toContain('hoa sen');
    expect(fenceHits('const s = "hoa senx";').map((h) => h.term)).not.toContain('hoa sen');
    // GĐ 8: bắt được từ của Bức 4; không bắt token của xưởng (denThen chứa "hen") hay núm grain của Phủ bóng.
    expect(fenceHits('chickPeck')).not.toEqual([]);
    expect(fenceHits('const s = "Gà mẹ";').map((h) => h.term)).toContain('gà mẹ');
    for (const word of ['denThen', 'grainAmount']) expect(fenceHits(word), word).toEqual([]);
  });

  it('engine/, ui/, lib/tsl/ (sau khi bỏ chú thích) không chứa từ vựng của bức nào', () => {
    const errors = [];
    for (const file of listSrc(/^src\/(engine|ui|lib\/tsl)\//)) {
      const code = stripComments(read(file), file).normalize('NFC');
      for (const { term, index } of fenceHits(code)) errors.push(`${file}:${code.slice(0, index).split('\n').length} — "${term}"`);
    }
    expect(errors, report('Từ vựng của bức lọt vào xưởng (đưa code đó về thư mục của bức):', errors)).toEqual([]);
  });
});
