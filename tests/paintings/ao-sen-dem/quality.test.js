// tests/paintings/ao-sen-dem/quality.test.js — bảng chất lượng của Bức 1: số theo mức, và thang nấc thật ở mức cao và thấp.
import { describe, it, expect, vi } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { budgetFor } from '../../../src/engine/quality.js';
import { createLadder } from '../../../src/engine/gpu/ladder.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

/** Thang nấc như scene.js dựng, trên một màn hình có DPR `device`. */
function ladderAt(level, device) {
  const { built } = buildPainting(painting, meta, { level, tier: level === 'cao' ? 'webgpu' : 'webgl2' });
  const budget = budgetFor(level, painting.quality);
  const stage = { dpr: () => Math.min(device, budget.dpr), setDpr: vi.fn() };
  return createLadder({ ladder: painting.quality.ladder, layers: built, stage, dpr: budget.dpr });
}

describe('quality.js của Bức 1', () => {
  it('bảng §10: DPR, phản chiếu (0 = giả), đom đóm, lá, bóng (0 = tắt), bloom, octave sương, hoa đăng (GĐ 5)', () => {
    expect(budgetFor('cao', painting.quality)).toEqual({
      dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3, lanterns: 8,
    });
    expect(budgetFor('vua', painting.quality)).toMatchObject({ lanterns: 6 });
    expect(budgetFor('thap', painting.quality)).toMatchObject({ reflection: 0, shadow: 0, fogOctaves: 1, lanterns: 4 });
  });

  it('mức cao, màn DPR 2: 4 nấc dpr rồi đủ 5 nấc của các lớp, đúng thứ tự', () => {
    const ladder = ladderAt('cao', 2);
    while (ladder.down());
    expect(ladder.ids()).toEqual([
      'dpr=1.75', 'dpr=1.5', 'dpr=1.25', 'dpr=1',
      'suong.chi-tiet', 'mat-nuoc.phan-chieu', 'phu-bong.bloom', 'vang-la.dom-dom', 'anh-trang.bong',
    ]);
  });

  it('mức thấp: phản chiếu giả, không bóng, sương vốn 1 octave nên không có ba nấc đó (GĐ 4); màn DPR 1 thì không có nấc dpr', () => {
    const ladder = ladderAt('thap', 1);
    while (ladder.down());
    expect(ladder.ids()).toEqual(['phu-bong.bloom', 'vang-la.dom-dom']);
  });
});
