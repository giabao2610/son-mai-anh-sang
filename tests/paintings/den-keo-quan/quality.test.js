// tests/paintings/den-keo-quan/quality.test.js — bảng chất lượng của Bức 2 (spec §18.7): ba mức cùng bộ khóa, số đúng bảng, thang nấc đúng thứ tự, trần núm theo mức.
import { describe, it, expect } from 'vitest';
import { quality } from '../../../src/paintings/den-keo-quan/quality.js';
import { knobs } from '../../../src/paintings/den-keo-quan/layers/l1-cot.js';
import { knobMax } from '../../../src/engine/gpu/knob-set.js';

describe('quality của Bức 2', () => {
  it('đúng bảng §18.7', () => {
    expect(quality.levels).toEqual({
      cao: { dpr: 2, mask: 2048, octaves: 3, fiber: 2, shadowMap: 512, bloom: 0.5 },
      vua: { dpr: 1.5, mask: 2048, octaves: 2, fiber: 1, shadowMap: 256, bloom: 0.25 },
      thap: { dpr: 1.25, mask: 1024, octaves: 1, fiber: 1, shadowMap: 0, bloom: 0.25 },
    });
  });

  it('thang: thứ ít thấy nhất hạ trước', () => {
    expect(quality.ladder).toEqual(['dpr', 'gian-nha.chi-tiet', 'giay.soi', 'phu-bong.bloom']);
  });

  it('núm figures: mức thấp tối đa 8 hình (vẽ lại mặt nạ trên máy yếu), mức cao và vừa tối đa 10', () => {
    const figures = knobs.find((k) => k.id === 'figures');
    expect(knobMax(figures, { tier: 'webgl2', level: 'thap' })).toBe(8);
    expect(knobMax(figures, { tier: 'webgpu', level: 'vua' })).toBe(10);
    expect(knobMax(figures, { tier: 'webgpu', level: 'cao' })).toBe(10);
  });
});
