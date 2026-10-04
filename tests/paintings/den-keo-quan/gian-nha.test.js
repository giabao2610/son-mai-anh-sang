// tests/paintings/den-keo-quan/gian-nha.test.js — Lớp 3 · Gian nhà: texture thủ tục trộn theo trọng số, octave là uniform có trần theo mức, nấc chi-tiet, hai thí nghiệm chỉ đổi uniform.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import * as gianNha from '../../../src/paintings/den-keo-quan/layers/l3-gian-nha.js';
import { knobMax, knobValue } from '../../../src/engine/gpu/knob-set.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, uniformNames } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'gian-nha', ...options });
const octaves = (layer) => layer.readouts.find((r) => r.id === 'octaves').get();
const named = ({ layers }, name) => layers.cot.objects.find((o) => o.name === name);

describe('l3-gian-nha', () => {
  it('lớp nằm giữa Ngọn nến và Kéo quân; núm đều là uniform; octave mặc định và trần theo mức', () => {
    expect(meta.layers.map((l) => l.id)).toEqual(['cot', 'ngon-nen', 'gian-nha', 'keo-quan', 'phu-bong']);
    expect(gianNha.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['tileSize', 'uniform'], ['stain', 'uniform'], ['grain', 'uniform'], ['clearcoat', 'uniform'], ['octaves', 'uniform'],
    ]);
    const knob = gianNha.knobs.find((k) => k.id === 'octaves');
    expect(knobValue(knob, { budget: { octaves: 3 } })).toBe(3);
    expect(knobValue(knob, { budget: { octaves: 1 } })).toBe(1);
    expect([knobMax(knob, { tier: 'webgpu', level: 'cao' }), knobMax(knob, { tier: 'webgl2', level: 'thap' })]).toEqual([5, 3]);
  });

  it('mọi bề mặt của gian nhà và đèn trộn theo trọng số của Gian nhà (mài về 0 là về đất sét)', () => {
    const built = build();
    for (const key of ['san', 'vach', 'tran', 'go', 'cot', 'tre', 'nen']) {
      expect(uniformNames(built.shared.cot.materials[key].colorNode), key).toContain('w_gian_nha');
    }
  });

  it('cột sơn son có clearcoat theo núm × trọng số; lớp không thêm vật nào', () => {
    const built = build();
    const names = uniformNames(built.shared.cot.materials.cot.clearcoatNode);
    expect(names).toEqual(expect.arrayContaining(['gian_nha_clearcoat', 'w_gian_nha']));
    expect(built.layers['gian-nha'].objects).toEqual([]);
  });

  it('số octave đang chạy = min(núm, trần): nấc chi-tiet hạ trần về 1 rồi trả lại; núm vẫn là ý người xem', () => {
    const { layers, knobs } = build({ level: 'cao' });
    const layer = layers['gian-nha'];
    expect(octaves(layer)).toBe(3);
    const [step] = layer.degrade;
    expect(step.id).toBe('chi-tiet');
    step.apply();
    expect(octaves(layer)).toBe(1);
    knobs['gian-nha'].set('octaves', 5);
    expect([octaves(layer), knobs['gian-nha'].get('octaves')]).toEqual([1, 5]);
    step.revert();
    expect(octaves(layer)).toBe(5);
  });

  it("nấc 'chi-tiet' chỉ có khi mức chạy hơn 1 octave: mức thấp (1 octave) không đưa nấc không tác dụng", () => {
    expect(build({ level: 'cao' }).layers['gian-nha'].degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    expect(build({ level: 'vua' }).layers['gian-nha'].degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    expect(build({ level: 'thap' }).layers['gian-nha'].degrade).toEqual([]);
  });

  it('"Một màu cho tất cả" và "Xem lưới gạch" chỉ đổi uniform: không material nào phải biên dịch lại', () => {
    const built = build();
    const materials = Object.values(built.shared.cot.materials);
    const versions = materials.map((m) => m.version);
    for (const exp of built.layers['gian-nha'].experiments) {
      exp.toggle(true);
      exp.toggle(false);
    }
    expect(materials.map((m) => m.version)).toEqual(versions);
    expect(built.layers['gian-nha'].experiments.map((e) => e.id)).toEqual(['flat', 'rawTiles']);
  });

  it.each(['webgpu', 'webgl2'])('%s: sàn, vách, trần, xà, cột dịch được (có bóng của đèn nến), không lỗi; vòng lặp fbm thật trong shader', (backend) => {
    const built = buildPainting(painting, meta, { until: 'keo-quan' });
    for (const name of ['san', 'vach', 'tran', 'xa', 'cot-go']) {
      const { problems, fragmentShader } = compileMaterial(named(built, name), built.ctx, backend, { shadows: true });
      expect(problems, name).toEqual([]);
      if (name !== 'cot-go') expect(fragmentShader, `${name}: octave là node nên có vòng lặp`).toMatch(/for\s*\(/);
    }
  });
});
