// tests/paintings/cung-que/bong-mem.test.js — Lớp 3 · Bóng mềm của Bức 3: bóng và AO dò bằng chính trường khoảng cách; dịch được ở hai backend với núm ở biên; nấc chi-tiet; thí nghiệm Bóng cứng.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import content from '../../../src/paintings/cung-que/content.vi.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, compileRenderer } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'bong-mem', ...options });
const volume = ({ layers }) => layers.cot.objects.find((o) => o.name === 'khoi-bao');
const marchDecls = (code) => (code.match(/\b(?:var(?:<\w+>)?|float)\s+sdfT\w*/g) ?? []).length;

describe('l3-bong-mem', () => {
  it.each(['webgpu', 'webgl2'])('%s: dịch được với núm ở biên (softness 2 và 32, ao 0 và 1); vẫn một vòng dò chính; shader đọc softness, ao, trọng số', async (backend) => {
    // Vòng dò bóng và vòng AO là vòng khác (không khai báo sdfT): chỉ đếm vòng dò chính.
    for (const [softness, ao] of [[2, 0], [32, 1]]) {
      const built = build();
      await built.knobs['bong-mem'].set('softness', softness);
      await built.knobs['bong-mem'].set('ao', ao);
      const { fragmentShader, problems, uniforms } = compileMaterial(volume(built), built.ctx, backend);
      expect(problems).toEqual([]);
      expect(marchDecls(fragmentShader), 'số vòng dò chính').toBe(1);
      expect(uniforms).toEqual(expect.arrayContaining(['bong_mem_softness', 'bong_mem_ao', 'w_bong_mem', 'bongMemShadowCap', 'bongMemAoCap']));
    }
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch lại trên CÙNG renderer vẫn đăng ký đủ uniform của bóng (Phụ lục A.87: hàm bóng, AO không có layout)', (backend) => {
    const built = build();
    const renderer = compileRenderer(backend);
    const first = compileMaterial(volume(built), built.ctx, backend, { renderer });
    const second = compileMaterial(volume(built), built.ctx, backend, { renderer });
    expect(new Set(second.uniforms)).toEqual(new Set(first.uniforms));
    expect(second.uniforms).toEqual(expect.arrayContaining(['bong_mem_softness', 'bongMemShadowCap', 'treeLift']));
  });

  it.each(['cao', 'vua', 'thap'])('mức %s: có nấc chi-tiet; apply giảm một nửa số bước bóng và số mẫu AO (AO ít nhất 2); revert trả về như cũ', (level) => {
    const { layers, ctx } = build({ level });
    const layer = layers['bong-mem'];
    expect(layer.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    const read = () => Object.fromEntries(layer.readouts.map((r) => [r.id, Number(r.get())]));
    const full = read();
    expect(full).toEqual({ buocBong: ctx.budget.shadowSteps, mauAo: ctx.budget.ao });
    const [step] = layer.degrade;
    step.apply();
    expect(read()).toEqual({ buocBong: ctx.budget.shadowSteps / 2, mauAo: Math.max(2, Math.ceil(ctx.budget.ao / 2)) });
    step.revert();
    expect(read()).toEqual(full);
  });

  it('thang hạ nấc: chi-tiet của Bóng mềm ngay sau dpr (bóng đắt mà ít người để ý số bước)', () => {
    expect(painting.quality.ladder.slice(0, 2)).toEqual(['dpr', 'bong-mem.chi-tiet']);
  });

  it('thí nghiệm "Bóng cứng" bật tắt được và có nhãn; núm và số đo có nhãn', () => {
    const { layers } = build();
    const layer = layers['bong-mem'];
    expect(layer.experiments.map((e) => e.id)).toEqual(['bongCung']);
    layer.experiments[0].toggle(true);
    layer.experiments[0].toggle(false);
    const text = content.layers['bong-mem'];
    expect(text.experiments.bongCung.label).toBeTruthy();
    for (const k of ['softness', 'ao']) expect(text.knobs[k], k).toBeTruthy();
    for (const r of ['buocBong', 'mauAo']) expect(text.readouts[r], r).toBeTruthy();
  });
});
