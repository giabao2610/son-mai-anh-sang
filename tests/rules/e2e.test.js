// tests/rules/e2e.test.js — quy ước để CI gom e2e theo bức (spec §19.9): describe trong e2e/<slug>.spec.js bắt đầu bằng "{tên bức} · "; nhóm gồm đúng các bức của registry, cộng "chung"; regex khớp như Playwright khớp; nhóm không khớp test nào thì CI đỏ.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Chính hàm Playwright dùng cho --grep và --grep-invert (cờ 'gi': không phân biệt hoa thường), để test khớp đúng như CI lọc.
import { createTitleMatcher, forceRegExp } from 'playwright/lib/util';
import { paintings } from '../../src/paintings/registry.js';
import { SMOKE_TAG, groups } from '../../scripts/e2e-groups.js';

const E2E = fileURLToPath(new URL('../../e2e/', import.meta.url));
const WORKFLOW = fileURLToPath(new URL('../../.github/workflows/deploy.yml', import.meta.url));
/** Bộ khớp của một mẫu --grep, như Playwright dựng. */
const grep = (pattern) => createTitleMatcher(forceRegExp(pattern));
/** Tên describe viết bằng chuỗi hằng ('…', "…"); describe dùng template literal là của file lặp qua registry. */
const literalTitles = (src) => [...src.matchAll(/test\.describe\(\s*(['"])((?:(?!\1).)*)\1/g)].map((m) => m[2]);

describe('e2e gom theo bức (CI, GĐ 7)', () => {
  it.each(paintings.map((p) => [p.meta.slug, p.meta.title]))('e2e/%s.spec.js: mọi describe bắt đầu bằng "{tên bức} · "', (slug, title) => {
    const file = `${E2E}${slug}.spec.js`;
    if (!existsSync(file)) return;
    for (const name of literalTitles(readFileSync(file, 'utf8'))) expect(name.startsWith(`${title} · `), name).toBe(true);
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
      const file = readFileSync(`${E2E}${meta.slug}.spec.js`, 'utf8');
      expect(file, `e2e/${meta.slug}.spec.js có test mang tag ${SMOKE_TAG}`).toContain(`tag: '${SMOKE_TAG}'`);
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
