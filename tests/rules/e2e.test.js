// tests/rules/e2e.test.js — quy ước để CI gom e2e theo bức (spec §19.9): describe trong e2e/<slug>.spec.js (và e2e/<slug>-<phần>.spec.js, khi spec tách file; bức có ciWebgpuSmoke phải có test mang tag khói ở một trong các file ấy) bắt đầu bằng "{tên bức} · "; nhóm gồm đúng các bức của registry, cộng "chung"; regex khớp như Playwright khớp; nhóm không khớp test nào thì CI đỏ.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Chính hàm Playwright dùng cho --grep và --grep-invert (cờ 'gi': không phân biệt hoa thường), để test khớp đúng như CI lọc.
import { createTitleMatcher, forceRegExp } from 'playwright/lib/util';
import { paintings } from '../../src/paintings/registry.js';
import { SMOKE_TAG, groups } from '../../scripts/e2e-groups.js';
import { importedNames, stripComments } from '../helpers/source.js';

const E2E = fileURLToPath(new URL('../../e2e/', import.meta.url));
const WORKFLOW = fileURLToPath(new URL('../../.github/workflows/deploy.yml', import.meta.url));
/** Bộ khớp của một mẫu --grep, như Playwright dựng. */
const grep = (pattern) => createTitleMatcher(forceRegExp(pattern));
const SLUGS = paintings.map((p) => p.meta.slug);
const FILES = readdirSync(E2E).sort();
/**
 * Bức sở hữu một file spec (GĐ 8): slug DÀI NHẤT mà tên file (bỏ `.spec.js`) bằng slug hay bắt đầu bằng `<slug>-`. Chọn slug dài nhất để một slug
 * ngắn (vd `dan-ga`) không nhận nhầm file của slug dài hơn cùng tiền tố (`dan-ga-me-con*.spec.js`). Spec chung (painting, a11y…) không thuộc bức nào.
 */
const ownerOf = (file, slugs = SLUGS) => {
  const base = file.replace(/\.spec\.js$/, '');
  return slugs.filter((s) => base === s || base.startsWith(`${s}-`)).sort((x, y) => y.length - x.length)[0] ?? null;
};
/** Mọi spec của một bức: e2e/<slug>.spec.js, và e2e/<slug>-<phần>.spec.js khi spec dài quá mà phải tách (GĐ 8). */
const specsOf = (slug, files = FILES, slugs = SLUGS) => files.filter((f) => f.endsWith('.spec.js') && ownerOf(f, slugs) === slug);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Tiêu đề test: chuỗi hằng của JS ('…', "…" hay `…`, có \ thoát). */
const TITLE = /(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/.source;
/** `{ tag: '@khoi' }` */
const TAG_LITERAL = String.raw`\{\s*tag:\s*'${escapeRe(SMOKE_TAG)}'\s*\}`;
/**
 * Số test mang tag khói trong một file spec (spec §19.9, §20.9): `test(…)` hay `test.describe(…)` truyền `SMOKE` hay chính `{ tag: '@khoi' }` làm
 * đối số thứ hai. `SMOKE` chỉ tính khi tới từ một chỗ khai báo tag thật: file tự khai báo `const SMOKE = { tag: '@khoi' }` (Bức 3), hay import
 * `SMOKE` từ `./<slug>.helpers.js` (spec tách file, GĐ 8) mà file ấy chứa `tag: '@khoi'`. Chú thích và danh sách import không tính.
 * @param {string} source  nội dung file spec
 * @param {{ slug: string, helpers: string | null, file?: string }} options  `helpers`: nội dung e2e/<slug>.helpers.js (null nếu không có)
 */
function smokeTestCount(source, { slug, helpers, file = 'input.js' }) {
  const code = stripComments(source, file);
  const names = [];
  if (new RegExp(String.raw`\bconst\s+SMOKE\s*=\s*${TAG_LITERAL}`).test(code)) names.push('SMOKE');
  const imported = importedNames(code, `./${slug}.helpers.js`, file).find((n) => n.name === 'SMOKE');
  if (imported && helpers?.includes(`tag: '${SMOKE_TAG}'`)) names.push(imported.local);
  const uses = (arg) => (code.match(new RegExp(String.raw`\btest(?:\.describe)?\s*\(\s*${TITLE}\s*,\s*${arg}\s*,`, 'g')) ?? []).length;
  return uses(TAG_LITERAL) + names.reduce((n, name) => n + uses(escapeRe(name)), 0);
}
/** Số test mang tag khói của một file spec thật (và e2e/<slug>.helpers.js của bức, nếu có). */
const smokeTests = (slug, spec) => {
  const helpers = FILES.includes(`${slug}.helpers.js`) ? readFileSync(`${E2E}${slug}.helpers.js`, 'utf8') : null;
  return smokeTestCount(readFileSync(`${E2E}${spec}`, 'utf8'), { slug, helpers, file: spec });
};
/** Tên describe viết bằng chuỗi hằng ('…', "…"); describe dùng template literal là của file lặp qua registry. */
const literalTitles = (src) => [...src.matchAll(/test\.describe\(\s*(['"])((?:(?!\1).)*)\1/g)].map((m) => m[2]);

describe('e2e gom theo bức (CI, GĐ 7)', () => {
  it.each(paintings.map((p) => [p.meta.slug, p.meta.title]))('e2e/%s*.spec.js: mọi describe bắt đầu bằng "{tên bức} · "', (slug, title) => {
    for (const spec of specsOf(slug)) {
      for (const name of literalTitles(readFileSync(`${E2E}${spec}`, 'utf8'))) expect(name.startsWith(`${title} · `), `${spec}: ${name}`).toBe(true);
    }
  });

  it('tự kiểm: bắt cả spec đã tách ra file riêng (Bức 4: e2e/dan-ga-me-con-giay.spec.js), không bắt file của bức khác hay file tiện ích', () => {
    expect(specsOf('dan-ga-me-con')).toEqual(expect.arrayContaining(['dan-ga-me-con.spec.js', 'dan-ga-me-con-giay.spec.js']));
    expect(specsOf('dan-ga-me-con').every((f) => f.endsWith('.spec.js'))).toBe(true);
    expect(specsOf('cung-que')).toEqual(['cung-que.spec.js']);
  });

  it('tự kiểm: slug ngắn không nhận nhầm spec của slug dài hơn có cùng tiền tố (dan-ga và dan-ga-me-con); spec chung và file tiện ích không thuộc bức nào', () => {
    const slugs = ['dan-ga', 'dan-ga-me-con', 'cung-que'];
    const files = [
      'a11y.spec.js', 'cung-que.spec.js', 'dan-ga-giay.spec.js', 'dan-ga-me-con-giay.spec.js', 'dan-ga-me-con.helpers.js', 'dan-ga-me-con.spec.js',
      'dan-ga.spec.js', 'painting.spec.js',
    ];
    expect(specsOf('dan-ga', files, slugs)).toEqual(['dan-ga-giay.spec.js', 'dan-ga.spec.js']);
    expect(specsOf('dan-ga-me-con', files, slugs)).toEqual(['dan-ga-me-con-giay.spec.js', 'dan-ga-me-con.spec.js']);
    expect(specsOf('cung-que', files, slugs)).toEqual(['cung-que.spec.js']);
    expect(files.filter((f) => f.endsWith('.spec.js') && ownerOf(f, slugs) === null)).toEqual(['a11y.spec.js', 'painting.spec.js']);
  });

  it('tự kiểm tag khói: tính test dùng SMOKE khai báo trong file (Bức 3) hay import từ ./<slug>.helpers.js (Bức 4); không tính chú thích, danh sách import, helpers không khai báo tag, import từ module khác', () => {
    const helpers = `export const SMOKE = { tag: '${SMOKE_TAG}' };`;
    const count = (source, options = {}) => smokeTestCount(source, { slug: 'x', helpers: null, ...options });
    const imported = "import { WALL, SMOKE } from './x.helpers.js';\ntest('a', SMOKE, async () => {});\ntest('b', SMOKE, async () => {});\ntest('c', async () => {});";
    // khai báo trong file: hai test mang tag (một test thường, một describe mang tag cũng tính)
    expect(count(`const SMOKE = { tag: '${SMOKE_TAG}' };\ntest('a', SMOKE, async () => {});\ntest('b', async () => {});\ntest.describe('c', SMOKE, () => {});`)).toBe(2);
    // import từ helpers của đúng bức, kể cả đổi tên; helpers phải khai báo tag
    expect(count(imported, { helpers })).toBe(2);
    expect(count("import { SMOKE as KHOI } from './x.helpers.js';\ntest('a', KHOI, async () => {});", { helpers })).toBe(1);
    expect(count(imported, { helpers: 'export const SMOKE = {};' })).toBe(0);
    expect(count(imported, { helpers: null })).toBe(0);
    // import từ module khác, hay từ helpers của bức khác
    expect(count(imported.replace('./x.helpers.js', './helpers.js'), { helpers })).toBe(0);
    expect(count(imported.replace('./x.helpers.js', './y.helpers.js'), { helpers })).toBe(0);
    // chỉ khai báo hay import mà không test nào dùng; test nằm trong chú thích
    expect(count("import { SMOKE } from './x.helpers.js';", { helpers })).toBe(0);
    expect(count(`const SMOKE = { tag: '${SMOKE_TAG}' };\n// test('a', SMOKE, async () => {});`)).toBe(0);
    // literal làm đối số thứ hai
    expect(count(`test('a', { tag: '${SMOKE_TAG}' }, async () => {});`)).toBe(1);
  });

  it('tự kiểm tag khói trên bố cục thật: Bức 4 có test khói ở cả spec chính (SMOKE nhận từ helpers) lẫn spec tách file; Bức 3 khai báo SMOKE trong file', () => {
    const per = (slug) => Object.fromEntries(specsOf(slug).map((spec) => [spec, smokeTests(slug, spec)]));
    const counts = per('dan-ga-me-con');
    expect(counts['dan-ga-me-con.spec.js'], JSON.stringify(counts)).toBeGreaterThan(0);
    expect(counts['dan-ga-me-con-giay.spec.js'], JSON.stringify(counts)).toBeGreaterThan(0);
    expect(per('cung-que')['cung-que.spec.js']).toBeGreaterThan(0);
  });

  it('e2e lặp qua registry (painting, a11y) đặt tên describe bằng `${meta.title} · …`', () => {
    for (const f of ['painting.spec.js', 'a11y.spec.js']) {
      expect(readFileSync(`${E2E}${f}`, 'utf8'), f).toMatch(/describe\(`\$\{meta\.title\} · /);
    }
  });

  it('nhóm: mỗi bức một nhóm, cộng "chung"; regex của bức bắt đúng bức đó; nhóm chung loại mọi bức', () => {
    const g = groups();
    expect(g.map((x) => x.id)).toEqual([...paintings.map((p) => p.meta.slug), 'chung']);
    const chung = grep(g[g.length - 1].grepInvert);
    for (const { meta } of paintings) {
      const own = grep(g.find((x) => x.id === meta.slug).grep);
      expect(own(`webgl2 painting.spec.js ${meta.title} · 3D mài về cốt`)).toBe(true);
      expect(chung(`webgl2 painting.spec.js ${meta.title} · 3D mài về cốt`)).toBe(true);
      for (const other of paintings.filter((p) => p.meta !== meta)) {
        expect(own(`${other.meta.title} · 3D`), `${meta.title} không bắt ${other.meta.title}`).toBe(false);
      }
    }
    expect(chung('static lat-tranh.spec.js Lật tranh đi qua lại')).toBe(false);
  });

  it('regex của nhóm khớp như Playwright khớp: không phân biệt hoa thường (tên bức viết thường vẫn thuộc nhóm của bức)', () => {
    const g = groups();
    for (const { meta } of paintings) {
      const name = `webgl2 cung-que.spec.js ${meta.title.toLowerCase()} · 3D`;
      expect(grep(g.find((x) => x.id === meta.slug).grep)(name), name).toBe(true);
      expect(grep(g[g.length - 1].grepInvert)(name), `nhóm chung loại ${name}`).toBe(true);
    }
  });

  it('job e2e WebGPU của CI: bức có ciWebgpuSmoke chỉ chạy test mang tag khói của nó; bức khác chạy như job chặn; nhóm chung giữ nguyên', () => {
    const g = groups();
    for (const { meta, ciWebgpuSmoke } of paintings) {
      const { grep: own, webgpuGrep } = g.find((x) => x.id === meta.slug);
      const name = `webgpu-swiftshader cung-que.spec.js ${meta.title} · khối bao độ sâu`;
      if (!ciWebgpuSmoke) {
        expect(webgpuGrep, meta.slug).toBe(own);
        continue;
      }
      expect(grep(webgpuGrep)(`${name} ${SMOKE_TAG}`), `${meta.slug}: test khói`).toBe(true);
      expect(grep(webgpuGrep)(name), `${meta.slug}: test không có tag thì bỏ`).toBe(false);
      // Cả các spec tách file: test khói có thể nằm ở bất kỳ file nào của bức, và tag có thể khai báo trong file hay import từ <slug>.helpers.js.
      const tagged = specsOf(meta.slug).reduce((n, spec) => n + smokeTests(meta.slug, spec), 0);
      expect(tagged, `e2e/${meta.slug}*.spec.js phải có ít nhất một test mang tag ${SMOKE_TAG}`).toBeGreaterThan(0);
    }
    expect(g[g.length - 1].webgpuGrep).toBe('');
    expect(readFileSync(WORKFLOW, 'utf8')).toMatch(/GREP: \$\{\{ matrix\.group\.webgpuGrep \}\}/);
    // Nhánh khói, cả khi registry chưa bức nào bật: mẫu lọc bắt tag, bỏ test không tag
    const [smoke] = groups([{ meta: { slug: 'x', title: 'Tranh X' }, ciWebgpuSmoke: true }]);
    expect(grep(smoke.webgpuGrep)(`webgpu-swiftshader x.spec.js Tranh X · a ${SMOKE_TAG}`)).toBe(true);
    expect(grep(smoke.webgpuGrep)('webgpu-swiftshader x.spec.js Tranh X · a')).toBe(false);
  });

  it('CI không có --pass-with-no-tests: nhóm không khớp test nào thì Playwright báo "No tests found" và job đỏ, không lặng lẽ xanh', () => {
    const commands = readFileSync(WORKFLOW, 'utf8').split('\n').filter((line) => !line.trim().startsWith('#')); // chú thích được nhắc tên cờ
    expect(commands.join('\n')).not.toMatch(/--pass-with-no-tests/);
  });
});
