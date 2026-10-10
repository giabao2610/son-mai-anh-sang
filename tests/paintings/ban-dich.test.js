// tests/paintings/ban-dich.test.js — Bản dịch (GĐ 9): với mỗi bức, lớp nào có mặt trong mã shader của vật nào (bảng ghi lại để đọc).
import { describe, it, expect } from 'vitest';
import { buildPainting } from '../helpers/fake-ctx.js';
import { compileMaterial, compileRenderer } from '../helpers/nodes.js';
import { ALL } from '../helpers/paintings.js';
import { countLines, drawablesOf, layerUniforms } from '../../src/engine/gpu/translate.js';

/**
 * Bảng `{ id lớp: ['chủ/tên vật', …] }`: những vật mà mã (đỉnh hay điểm ảnh) có uniform của lớp (trọng số hay núm 'uniform').
 * Cốt không có trọng số, và có bức không có núm uniform nào của Cốt (Bức 2, 4): danh sách rỗng. Lớp chỉ có ở quad cuối (Phủ bóng, Bản nét) ra danh sách rỗng: e2e kiểm phần đó (quad cuối không có trong cảnh dựng ở Node).
 */
async function whereTable(entry, meta) {
  const painting = await entry.load();
  const built = buildPainting(painting, meta, { level: 'cao' });
  const { ctx } = built;
  const renderer = compileRenderer('webgpu', { shadows: ctx.renderer.shadowMap.enabled });
  const codes = drawablesOf(built.built).map((d) => {
    const { vertexShader, fragmentShader } = compileMaterial(d.object, ctx, 'webgpu', {
      renderer, lights: true, shadows: ctx.renderer.shadowMap.enabled,
    });
    return { label: `${d.owner}/${d.name ?? '(không tên)'}${d.of > 1 ? `#${d.index}` : ''}`, vertexShader, fragmentShader };
  });
  const table = {};
  for (const b of built.built) {
    const u = layerUniforms(b);
    const names = [...(u.weight ? [u.weight] : []), ...Object.values(u.knobs)];
    table[b.id] = codes
      .filter((c) => countLines(c.vertexShader, names) + countLines(c.fragmentShader, names) > 0)
      .map((c) => c.label);
  }
  return table;
}

describe.each(ALL.filter((p) => p.deployed).map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, { meta, entry }) => {
  it('bảng nơi mỗi lớp có mặt trong mã (WGSL, mức cao)', async () => {
    const table = await whereTable(entry, meta);
    expect(Object.keys(table)).toEqual(meta.layers.map((l) => l.id));
    expect(table).toMatchSnapshot();
  }, 60_000);
});
