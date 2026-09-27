// tests/paintings/contract.test.js — hợp đồng của mọi bức trong registry: meta, thứ tự lớp, marker núm.
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { paintings } from '../../src/paintings/registry.js';

const SRC = resolve(import.meta.dirname, '../../src');
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MARKER = /\/\/\s*@knob\s+([A-Za-z0-9_]+)/g;

/** Tập id núm có marker `// @knob <id>` trong các file (đường dẫn tính từ src/). */
function markersIn(files) {
  const ids = new Set();
  for (const file of files) {
    for (const m of readFileSync(resolve(SRC, file), 'utf8').matchAll(MARKER)) ids.add(m[1]);
  }
  return ids;
}

/** Nạp module nặng qua cửa vào nhẹ, đúng đường mà trình duyệt đi. */
async function loadPainting(slug) {
  const { default: entry } = await import(`../../src/paintings/${slug}/index.js`);
  return { entry, painting: await entry.load() };
}

describe.each(paintings.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
  const { meta } = row;

  it('slug trùng tên thư mục, registry dùng đúng meta.js của thư mục đó', async () => {
    expect(slug, 'slug phải là kebab-case không dấu').toMatch(KEBAB);
    expect(existsSync(resolve(SRC, 'paintings', slug)), `thiếu thư mục src/paintings/${slug}/`).toBe(true);
    const { default: own } = await import(`../../src/paintings/${slug}/meta.js`);
    expect(own, `registry phải import src/paintings/${slug}/meta.js`).toBe(meta);
  });

  it('thơ có nguồn (cả bức và từng lớp có thơ riêng)', () => {
    expect(meta.poem.lines.length, 'poem.lines rỗng').toBeGreaterThan(0);
    expect(meta.poem.source, 'poem.source là bắt buộc').toBeTruthy();
    for (const layer of meta.layers.filter((l) => l.poem)) {
      expect(layer.poem.source, `thơ của lớp "${layer.id}" thiếu source`).toBeTruthy();
    }
  });

  it('lớp đầu là Cốt; id lớp duy nhất và kebab-case', () => {
    expect(meta.layers[0].id, 'layers[0] phải là Cốt').toBe('cot');
    const ids = meta.layers.map((l) => l.id);
    expect(new Set(ids).size, `id lớp bị trùng: ${ids.join(', ')}`).toBe(ids.length);
    for (const id of ids) expect(id, `id lớp "${id}" phải là kebab-case không dấu`).toMatch(KEBAB);
  });

  it('file của lớp tồn tại trong src/ và mỗi file thuộc tối đa một lớp', () => {
    const owner = new Map();
    for (const layer of meta.layers) {
      expect(layer.files.length, `lớp "${layer.id}" chưa khai báo files`).toBeGreaterThan(0);
      for (const file of layer.files) {
        expect(existsSync(resolve(SRC, file)), `lớp "${layer.id}": không thấy src/${file}`).toBe(true);
        expect(owner.get(file), `src/${file} thuộc cả lớp "${owner.get(file)}" và "${layer.id}"`).toBeUndefined();
        owner.set(file, layer.id);
      }
    }
  });

  it('painting.js: cùng id lớp, cùng thứ tự với meta; module lớp và camera đúng hình dạng', async () => {
    const { entry, painting } = await loadPainting(slug);
    expect(entry.meta, 'index.js phải export meta của chính bức').toBe(meta);
    expect(painting.layers.map((m) => m.id)).toEqual(meta.layers.map((l) => l.id));
    for (const m of painting.layers) {
      expect(Array.isArray(m.knobs), `lớp "${m.id}" thiếu export const knobs`).toBe(true);
      expect(typeof m.createLayer, `lớp "${m.id}" thiếu createLayer`).toBe('function');
    }
    const { position, target, fov, azimuth, polar, distance } = painting.camera;
    expect(position).toHaveLength(3);
    expect(target).toHaveLength(3);
    expect(fov).toBeGreaterThan(0);
    for (const [lo, hi] of [azimuth, polar, distance]) expect(lo).toBeLessThanOrEqual(hi);
  });

  it('marker // @knob trong file của mỗi lớp khớp đúng knobs của lớp đó', async () => {
    const { painting } = await loadPainting(slug);
    meta.layers.forEach((layer, i) => {
      const expected = new Set(painting.layers[i].knobs.map((k) => k.id));
      expect(markersIn(layer.files), `marker của lớp "${layer.id}"`).toEqual(expected);
    });
  });
});
