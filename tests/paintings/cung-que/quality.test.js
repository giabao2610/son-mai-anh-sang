// tests/paintings/cung-que/quality.test.js — bảng chất lượng của Bức 3 (spec §19.8): ba mức cùng bộ khóa và đúng số; thang nấc có thật ở lớp; trần núm theo mức; số lá theo mức.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

/** Bảng §19.8. */
const TABLE = {
  cao: { dpr: 2, steps: 128, shadowSteps: 32, ao: 5, leaves: 64, bloom: 0.5 },
  vua: { dpr: 1.5, steps: 96, shadowSteps: 24, ao: 4, leaves: 48, bloom: 0.25 },
  thap: { dpr: 1.25, steps: 64, shadowSteps: 16, ao: 3, leaves: 32, bloom: 0.25 },
};
const LEVELS = ['cao', 'vua', 'thap'];

describe('quality (Bức 3)', () => {
  it('ba mức đúng bảng §19.8, cùng một bộ khóa', () => {
    expect(painting.quality.levels).toEqual(TABLE);
  });

  it.each(LEVELS)('mức %s: mọi nấc trong thang có thật ở lớp tương ứng; thang đúng thứ tự', (level) => {
    expect(painting.quality.ladder).toEqual(['dpr', 'bong-mem.chi-tiet', 'cot.buoc', 'phu-bong.bloom']);
    const { layers } = buildPainting(painting, meta, { level });
    for (const step of painting.quality.ladder.slice(1)) {
      const [layerId, stepId] = step.split('.');
      expect(layers[layerId].degrade?.map((d) => d.id) ?? [], `${level}: ${step}`).toContain(stepId);
    }
  });

  it.each(LEVELS)('mức %s: núm cot.steps mặc định và tối đa bằng budget.steps (kéo quá trần thì kẹp lại); lá cấp đúng budget.leaves', async (level) => {
    const built = buildPainting(painting, meta, { level });
    expect(built.knobs.cot.get('steps')).toBe(TABLE[level].steps);
    await built.knobs.cot.set('steps', 1000);
    expect(built.knobs.cot.get('steps')).toBe(TABLE[level].steps);
    const leaves = built.layers['la-da'].objects.find((o) => o.name === 'la-roi');
    expect(leaves.count).toBe(TABLE[level].leaves);
  });
});
