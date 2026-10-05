// tests/rules/e2e.test.js — quy ước để CI gom e2e theo bức (spec §19.9): describe trong e2e/<slug>.spec.js bắt đầu bằng "{tên bức} · "; nhóm gồm đúng các bức của registry, cộng "chung".
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { paintings } from '../../src/paintings/registry.js';
import { groups } from '../../scripts/e2e-groups.js';

const E2E = fileURLToPath(new URL('../../e2e/', import.meta.url));
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
    const chung = new RegExp(g[g.length - 1].grepInvert);
    for (const { meta } of paintings) {
      const own = new RegExp(g.find((x) => x.id === meta.slug).grep);
      expect(own.test(`webgl2 painting.spec.js ${meta.title} · 3D mài về cốt`)).toBe(true);
      expect(chung.test(`webgl2 painting.spec.js ${meta.title} · 3D mài về cốt`)).toBe(true);
      for (const other of paintings.filter((p) => p.meta !== meta)) {
        expect(own.test(`${other.meta.title} · 3D`), `${meta.title} không bắt ${other.meta.title}`).toBe(false);
      }
    }
    expect(chung.test('static lat-tranh.spec.js Lật tranh đi qua lại')).toBe(false);
  });
});
