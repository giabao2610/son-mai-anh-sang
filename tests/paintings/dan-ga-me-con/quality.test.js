// tests/paintings/dan-ga-me-con/quality.test.js — bảng chất lượng của Bức 4 (spec §20.8): ba mức cùng bộ khóa và đúng số; thang nấc có thật ở lớp; trần của núm count và segments theo mức, số tam giác trong ngân sách; nấc chi-tiet chỉ khi paper > 1.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

/** Bảng §20.8. segments, segmentsMax: số vòng của khối gà (núm cot.segments) mặc định và tối đa ở mức đó. */
const TABLE = {
  cao: { dpr: 2, segments: 32, segmentsMax: 48, grains: 4096, paper: 3, bloom: 0.5 },
  vua: { dpr: 1.5, segments: 28, segmentsMax: 32, grains: 2048, paper: 2, bloom: 0.25 },
  thap: { dpr: 1.25, segments: 24, segmentsMax: 32, grains: 1024, paper: 2, bloom: 0.25 },
};
const LEVELS = ['cao', 'vua', 'thap'];
/** Ngân sách tam giác của các vật có hình (tờ giấy, gà mẹ, mười gà con; §20.8): ở segments mặc định của mức, và khi kéo núm hết cỡ. */
const TRIANGLES = { cao: [150_000, 340_000], vua: [115_000, 150_000], thap: [85_000, 150_000] };

/** Số tam giác của các vật trong Cốt, đếm như renderer.info của three: mỗi bản của InstancedMesh một lần. */
function triangles(cot) {
  let n = 0;
  for (const object of cot.objects) {
    object.traverse((o) => {
      if (o.isMesh) n += (o.geometry.index.count / 3) * (o.isInstancedMesh ? o.count : 1);
    });
  }
  return n;
}

describe('quality (Bức 4)', () => {
  it('ba mức đúng bảng §20.8, cùng một bộ khóa; thang đúng thứ tự', () => {
    expect(painting.quality.levels).toEqual(TABLE);
    expect(painting.quality.ladder).toEqual(['dpr', 'dan-ga.thoc', 'giay-diep.chi-tiet', 'phu-bong.bloom']);
  });

  it.each(LEVELS)('mức %s: mọi nấc của thang có thật ở lớp tương ứng', (level) => {
    const { layers } = buildPainting(painting, meta, { level });
    for (const step of painting.quality.ladder.slice(1)) {
      const [layerId, stepId] = step.split('.');
      expect(layers[layerId].degrade?.map((d) => d.id) ?? [], `${level}: ${step}`).toContain(stepId);
    }
  });

  it.each(LEVELS)('mức %s: dan-ga.count mặc định và tối đa bằng budget.grains, Sprite thóc vẽ đúng số đó; handful tối đa 300', async (level) => {
    const built = buildPainting(painting, meta, { level });
    expect(built.knobs['dan-ga'].get('count')).toBe(TABLE[level].grains);
    await built.knobs['dan-ga'].set('count', 1e6);
    expect(built.knobs['dan-ga'].get('count')).toBe(TABLE[level].grains);
    expect(built.layers['dan-ga'].objects.find((o) => o.name === 'thoc').count).toBe(TABLE[level].grains);
    await built.knobs['dan-ga'].set('handful', 1000);
    expect(built.knobs['dan-ga'].get('handful')).toBe(300);
  });

  it.each(LEVELS)('mức %s: cot.segments mặc định budget.segments, tối đa budget.segmentsMax (kéo quá thì kẹp lại); hình dựng theo số đó, số tam giác trong ngân sách', async (level) => {
    const built = buildPainting(painting, meta, { level, until: 'cot' });
    expect(built.knobs.cot.get('segments')).toBe(TABLE[level].segments);
    const [atDefault, atMax] = TRIANGLES[level];
    expect(triangles(built.layers.cot), `${level}: mặc định`).toBeLessThanOrEqual(atDefault);
    await built.knobs.cot.set('segments', 1000);
    expect(built.knobs.cot.get('segments')).toBe(TABLE[level].segmentsMax);
    expect(triangles(built.layers.cot), `${level}: kéo hết cỡ`).toBeLessThanOrEqual(atMax);
  });

  it('mức cao: kéo segments lên 48 thì số tam giác hơn gấp đôi lúc mặc định (hình dựng lại thật, ngân sách không đếm suông)', async () => {
    const built = buildPainting(painting, meta, { level: 'cao', until: 'cot' });
    const before = triangles(built.layers.cot);
    await built.knobs.cot.set('segments', 48);
    expect(triangles(built.layers.cot)).toBeGreaterThan(2 * before);
  });

  it('paper = 1: lớp Giấy điệp không đưa nấc chi-tiet (nấc chỉ có khi có tác dụng)', () => {
    const { layers } = buildPainting(painting, meta, { budget: { paper: 1 } });
    expect(layers['giay-diep'].degrade ?? []).toEqual([]);
  });
});
