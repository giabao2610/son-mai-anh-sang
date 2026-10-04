// tests/paintings/den-keo-quan/keo-quan.test.js — Lớp 5 · Kéo quân: gobo là node bóng của đèn nến, dịch được ra WGSL và GLSL; quy ước góc giữa trống và gobo.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf, uniformNames } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'keo-quan', ...options });
const wall = ({ layers }) => layers.cot.objects.find((o) => o.name === 'vach');

describe('l5-keo-quan', () => {
  it('node bóng của đèn chứa gobo: trộn theo trọng số; shader của vách đọc góc trống, mặt nạ và "Trống không cắt"', () => {
    const built = build();
    const nodes = nodesOf(built.shared.ngonNen.light.shadow.shadowNode);
    expect(nodes.some((n) => n.isUniformNode && n.name === 'w_keo_quan'), 'trộn theo trọng số của lớp').toBe(true);
    // Gobo nằm trong thân Fn (nodesOf không thấy): dịch vách ra WGSL rồi đọc uniform và texture mà shader thật sự dùng.
    const { uniforms, fragmentShader } = compileMaterial(wall(built), built.ctx, 'webgpu', { shadows: true });
    expect(uniforms).toEqual(expect.arrayContaining(['drumAngle', 'drumSolid', 'keo_quan_strength']));
    expect(fragmentShader).toMatch(/textureSampleLevel/);
  });

  it.each(['webgpu', 'webgl2'])('%s: vách nhận bóng dịch được, có atan và tra texture, không lỗi', (backend) => {
    const built = build();
    const { fragmentShader, problems } = compileMaterial(wall(built), built.ctx, backend, { shadows: true });
    expect(problems).toEqual([]);
    expect(fragmentShader).toMatch(/atan/);
    expect(fragmentShader).toMatch(backend === 'webgpu' ? /textureSampleLevel/ : /textureLod/);
  });

  it('có đèn mà tắt shadowMap thì shader của vách không có gobo (khẳng định ngược: test trên không qua oan)', () => {
    const built = build();
    const { fragmentShader } = compileMaterial(wall(built), built.ctx, 'webgpu', { lights: true });
    // Dấu vết của đèn điểm: suy giảm theo khoảng cách, 1 / max(pow(length(L), decay), 0.01) (getDistanceAttenuation của three).
    expect(fragmentShader, 'phải có chiếu sáng của đèn điểm').toMatch(/pow\(\s*length\(/);
    expect(fragmentShader).not.toMatch(/textureSampleLevel/);
  });

  it('quy ước góc: điểm ở góc cục bộ φ của trống, sau khi trống quay θ, nằm ở góc thế giới φ − θ; gobo tra u = (φ_thế giới + θ) / 2π', () => {
    const theta = 0.7;
    for (const phiLocal of [0, 1, 2.5, -2]) {
      const [x, z] = [Math.cos(phiLocal), Math.sin(phiLocal)];
      // rotation.y = θ của three: x' = x cos θ + z sin θ, z' = −x sin θ + z cos θ
      const [xw, zw] = [x * Math.cos(theta) + z * Math.sin(theta), -x * Math.sin(theta) + z * Math.cos(theta)];
      const u = (((Math.atan2(zw, xw) + theta) / (2 * Math.PI)) % 1 + 1) % 1;
      expect(u).toBeCloseTo((((phiLocal / (2 * Math.PI)) % 1) + 1) % 1, 9);
    }
  });

  it('số đo: bóng ở vách sau to gấp vách / bán kính trống; nửa tối ở vách sau theo cỡ lửa và núm penumbra', () => {
    const { layers, shared } = build();
    const read = (id) => layers['keo-quan'].readouts.find((r) => r.id === id).get();
    const d = shared.cot.lantern.axis[1] + shared.cot.room.half; // 1,9
    expect(read('magnify')).toBeCloseTo(d / shared.cot.lantern.drum.r, 1); // ≈ 21,1
    // s × (D − r) / r, đổi ra cm (s là cỡ lửa lúc này, núm penumbra mặc định 1): 0,004 × (1,9 − 0,09) / 0,09 × 100 ≈ 8 cm
    const s = shared.ngonNen.size.value;
    expect(read('penumbra')).toBeCloseTo((s * (d - 0.09)) / 0.09 * 100, 0);
  });

  it.each([
    ['penumbra 0', { penumbra: 0 }], ['penumbra 2', { penumbra: 2 }], ['nguồn sáng là một điểm', { point: 1 }], ['công thức gọn', { naive: 1 }],
  ])('núm biên (%s): vách vẫn dịch được ra WGSL và GLSL, không lỗi', (_, set) => {
    const built = build();
    for (const [k, v] of Object.entries(set)) built.shared.keoQuan.u[k].value = v;
    for (const backend of ['webgpu', 'webgl2']) {
      expect(compileMaterial(wall(built), built.ctx, backend, { shadows: true }).problems, backend).toEqual([]);
    }
  });

  const shadowMap = ({ layers }) => layers['keo-quan'].experiments.find((e) => e.id === 'shadowMap');
  const realLight = ({ ctx }) => ctx.scene.children.find((o) => o.isPointLight && !o.shadow.shadowNode);

  it('"Shadow map thật": chưa bật thì scene chỉ có MỘT đèn điểm; bật lần đầu thêm đèn thứ hai có castShadow; tắt thì không vẽ bóng', () => {
    const built = build();
    const points = () => built.ctx.scene.children.filter((o) => o.isPointLight);
    expect(points()).toHaveLength(1);
    const exp = shadowMap(built);
    expect(exp.kind).toBe('compare');
    exp.toggle(true);
    expect(points()).toHaveLength(2);
    const real = realLight(built);
    expect(real.castShadow).toBe(true);
    expect(real.shadow.mapSize.x).toBe(512);
    // Trống cách lửa 9 cm: camera của cube shadow map phải thấy gần hơn thế (mặc định của three là 0,5 m).
    expect(real.shadow.camera.near).toBeLessThan(0.05);
    exp.toggle(false);
    expect(real.shadow.autoUpdate).toBe(false);
  });

  it('bật thì đèn gobo tắt và đèn thật mang công suất của nến; tắt thì ngược lại', () => {
    const built = build();
    const { light, power } = built.shared.ngonNen;
    shadowMap(built).toggle(true);
    built.layers['ngon-nen'].update(0, 1);
    built.layers['keo-quan'].update(0, 1);
    expect(light.intensity).toBe(0);
    expect(realLight(built).intensity).toBeCloseTo(power.value, 6);
    expect(realLight(built).position.equals(light.position)).toBe(true);
    shadowMap(built).toggle(false);
    built.layers['ngon-nen'].update(0, 1);
    built.layers['keo-quan'].update(0, 1);
    expect(light.intensity).toBeCloseTo(power.value, 6);
    expect(realLight(built).intensity).toBe(0);
  });

  it('mức thấp: không có thí nghiệm "Shadow map thật"', () => {
    const { layers } = build({ level: 'thap' });
    expect(layers['keo-quan'].experiments.map((e) => e.id)).not.toContain('shadowMap');
  });

  it('bật rồi gỡ lớp (như "Dựng lại cảnh", Review Focus 3): không còn đèn nào trong scene', () => {
    const built = build();
    shadowMap(built).toggle(true);
    for (const b of [...built.built].reverse()) b.layer.dispose();
    expect(built.ctx.scene.children.filter((o) => o.isLight)).toHaveLength(0);
  });

  it('bóng thật đang bật: hai đèn hòa theo trọng số Kéo quân; mài về 0 là về đúng bốn lớp dưới (Review Focus 2)', () => {
    const built = build();
    const { light, power } = built.shared.ngonNen;
    shadowMap(built).toggle(true);
    const frame = (k) => {
      built.ctx.weights.set('keo-quan', k);
      built.layers['ngon-nen'].update(0, 1);
      built.layers['keo-quan'].update(0, 1);
      return [light.intensity, realLight(built).intensity, realLight(built).shadow.autoUpdate];
    };
    const [candle1, real1, auto1] = frame(1);
    expect([candle1, auto1]).toEqual([0, true]);
    expect(real1).toBeCloseTo(power.value, 6);
    const [candleQ, realQ] = frame(0.25);
    expect(candleQ).toBeCloseTo(power.value * 0.75, 6);
    expect(realQ).toBeCloseTo(power.value * 0.25, 6);
    // Mài hết: chỉ còn đèn nến (mang màu giấy, không gobo), đèn thật tắt và thôi vẽ sáu mặt bóng.
    const [candle0, real0, auto0] = frame(0);
    expect(candle0).toBeCloseTo(power.value, 6);
    expect([real0, auto0]).toEqual([0, false]);
    expect(uniformNames(light.shadow.shadowNode)).toContain('goboReal');
  });

  it('bóng thật theo "Ánh sáng không suy giảm" (decay) và núm "Độ đậm của bóng"; tắt rồi bật lại vẫn vẽ bóng', async () => {
    const built = build();
    shadowMap(built).toggle(true);
    built.layers['ngon-nen'].experiments.find((e) => e.id === 'noDecay').toggle(true);
    built.knobs['keo-quan'].set('strength', 0.4);
    built.layers['ngon-nen'].update(0, 1);
    built.layers['keo-quan'].update(0, 1);
    expect(realLight(built).decay).toBe(0);
    expect(realLight(built).shadow.intensity).toBeCloseTo(0.4, 6);
    shadowMap(built).toggle(false);
    built.layers['keo-quan'].update(0, 1);
    expect(realLight(built).shadow.autoUpdate).toBe(false);
    shadowMap(built).toggle(true);
    built.layers['keo-quan'].update(0, 1);
    expect(realLight(built).shadow.autoUpdate).toBe(true);
  });

  it.each(['webgpu', 'webgl2'])('%s: bật bóng thật (hai đèn điểm, một có cube shadow map) thì vách vẫn dịch được, không lỗi', (backend) => {
    const built = build();
    shadowMap(built).toggle(true);
    expect(compileMaterial(wall(built), built.ctx, backend, { shadows: true }).problems).toEqual([]);
  });

  it('sides 4 và 8: góc nan tre theo uniform lanternSides, không cần biên dịch lại', async () => {
    const built = build();
    await built.knobs.cot.set('sides', 8);
    expect(built.shared.cot.lantern.sides.value).toBe(8);
  });
});
