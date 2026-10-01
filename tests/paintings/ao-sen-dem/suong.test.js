// tests/paintings/ao-sen-dem/suong.test.js — Lớp 3 · Sương: vòm trời, sương gán MỘT lần vào scene.fogNode, octave là uniform, nấc, thí nghiệm.
import { describe, it, expect } from 'vitest';
import { BackSide } from 'three/webgpu';
import { vec3 } from 'three/tsl';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as suong from '../../../src/paintings/ao-sen-dem/layers/l3-suong.js';
import { SKY_RADIUS } from '../../../src/paintings/ao-sen-dem/parts/suong-troi.js';
import { knobMax, knobValue } from '../../../src/engine/gpu/knob-set.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'suong', ...options });
const octaves = (layer) => layer.readouts.find((r) => r.id === 'octaves').get();

describe('l3-suong', () => {
  it('núm tĩnh, đều là uniform (kể cả octaves: không biên dịch lại); octave mặc định theo mức', () => {
    expect(suong.id).toBe('suong');
    expect(suong.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['density', 'uniform'], ['heightFalloff', 'uniform'], ['noiseScale', 'uniform'], ['octaves', 'uniform'],
      ['windStrength', 'uniform'], ['starDensity', 'uniform'], ['haloSize', 'uniform'],
    ]);
    const knob = suong.knobs.find((k) => k.id === 'octaves');
    expect(knobValue(knob, { budget: {} })).toBe(3);
    expect(knobValue(knob, { budget: { fogOctaves: 1 } })).toBe(1);
    expect([knobMax(knob, { tier: 'webgpu', level: 'cao' }), knobMax(knob, { tier: 'webgl2', level: 'thap' })]).toEqual([5, 3]);
  });

  it('vòm trời: cầu bán kính 300 nhìn từ trong, không nhận sương, không ghi độ sâu, vẽ trước, có emissiveNode', () => {
    const { ctx, layers } = build();
    const [dome] = layers.suong.objects;
    expect(ctx.scene.children).toContain(dome);
    expect(dome.geometry.parameters.radius).toBe(SKY_RADIUS);
    expect(dome.material.side).toBe(BackSide);
    expect([dome.material.fog, dome.material.depthWrite, dome.renderOrder]).toEqual([false, false, -1]);
    expect(dome.material.colorNode.isNode).toBe(true);
    expect(dome.material.emissiveNode).toBeTruthy();
  });

  it('sương gán MỘT lần vào scene.fogNode; công bố fogFactor và sky cho các lớp sau', () => {
    const { ctx, shared } = build();
    expect(ctx.scene.fogNode?.isNode).toBe(true);
    expect(shared.suong.fogFactor.isNode).toBe(true);
    expect(shared.suong.sky(vec3(0, 1, 0)).isNode).toBe(true);
  });

  it('thí nghiệm chỉ đổi uniform: fogNode giữ nguyên (không biên dịch lại mọi material)', () => {
    const { ctx, layers } = build();
    const fogNode = ctx.scene.fogNode;
    for (const exp of layers.suong.experiments) {
      exp.toggle(true);
      exp.toggle(false);
    }
    expect(ctx.scene.fogNode).toBe(fogNode);
    expect(layers.suong.experiments.map((e) => [e.id, e.kind ?? 'toggle'])).toEqual([['rawNoise', 'toggle'], ['oneOctave', 'compare']]);
  });

  it('số octave đang chạy = min(núm, trần): "Chỉ 1 octave" và nấc chi-tiet hạ trần; núm vẫn là ý người xem', () => {
    const { layers, knobs } = build();
    const layer = layers.suong;
    const [one] = layer.experiments.filter((e) => e.id === 'oneOctave');
    const [step] = layer.degrade;
    expect(octaves(layer)).toBe(3);
    one.toggle(true);
    expect(octaves(layer)).toBe(1);
    one.toggle(false);
    expect(octaves(layer)).toBe(3);
    expect(step.id).toBe('chi-tiet');
    step.apply();
    expect(octaves(layer)).toBe(1);
    knobs.suong.set('octaves', 5);
    expect([octaves(layer), knobs.suong.get('octaves')]).toEqual([1, 5]);
    step.revert();
    expect(octaves(layer)).toBe(5);
    expect(octaves(build({ level: 'thap', budget: { fogOctaves: 1 } }).layers.suong)).toBe(1);
  });

  it("nấc 'chi-tiet' chỉ có khi mức chạy hơn 1 octave (GĐ 4): mức thấp vốn 1 octave thì không đưa nấc không tác dụng", () => {
    expect(build({ level: 'cao' }).layers.suong.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    expect(build({ level: 'vua' }).layers.suong.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    expect(build({ level: 'thap' }).layers.suong.degrade).toEqual([]);
  });

  it('dispose gỡ vòm trời và trả fogNode về như cũ (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const [dome] = layers.suong.objects;
    layers.suong.dispose();
    layers.suong.dispose();
    expect(dome.parent).toBeNull();
    expect(ctx.scene.fogNode ?? null).toBeNull(); // Scene của three không có fogNode cho tới khi được gán
  });
});
