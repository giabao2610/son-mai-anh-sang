// tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
import { moonPhase } from '../../../src/lib/astro/moon.js';
import { knobValue } from '../../../src/engine/gpu/knob-set.js';
import { NOW, buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
const lights = (scene, flag) => scene.children.filter((o) => o[flag]);

describe('l2-anh-trang', () => {
  it('núm tĩnh; pha trăng mặc định là pha của đêm nay', () => {
    expect(anhTrang.id).toBe('anh-trang');
    expect(anhTrang.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['moonPhase', 'uniform'], ['rimPower', 'uniform'], ['rimColor', 'uniform'], ['translucency', 'uniform'],
      ['clearcoat', 'uniform'], ['candleColor', 'uniform'],
      ['candleIntensity', 'js'], ['shadowMapSize', 'js'], ['shadowBias', 'js'],
    ]);
    const phase = anhTrang.knobs.find((k) => k.id === 'moonPhase');
    expect(knobValue(phase, { now: NOW })).toBe(moonPhase(NOW).phase);
  });

  it('trăng và đèn hoa đăng là objects của lớp; trăng có emissiveNode', () => {
    const { ctx, layers } = build();
    const [moon, lantern] = layers['anh-trang'].objects;
    expect(moon.geometry.parameters.radius).toBe(MOON.radius);
    expect(moon.material.emissiveNode).toBeTruthy();
    expect(lantern.isInstancedMesh).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([moon, lantern]));
    expect(lights(ctx.scene, 'isDirectionalLight')).toHaveLength(1);
    expect(lights(ctx.scene, 'isPointLight')).toHaveLength(1);
  });

  it('sơn lên material của Cốt: màu mới, clearcoat cho lá, sheen + emissive cho cánh', () => {
    const { shared } = build();
    const { leafMaterial, standingMaterial, petalMaterial } = shared.cot;
    for (const m of [leafMaterial, standingMaterial]) expect(m.clearcoatNode).toBeTruthy();
    expect(petalMaterial.sheenNode).toBeTruthy();
    expect(petalMaterial.emissiveNode.isNode).toBe(true);
  });

  it('bóng bật MỘT lần lúc dựng theo mức: cao 1024, vừa 512, thấp tắt', () => {
    for (const [level, size] of [['cao', 1024], ['vua', 512], ['thap', 0]]) {
      const { ctx, shared } = build({ level });
      const [sun] = lights(ctx.scene, 'isDirectionalLight');
      expect(ctx.renderer.shadowMap.enabled, level).toBe(size > 0);
      expect(sun.castShadow, level).toBe(size > 0);
      if (size) expect(sun.shadow.mapSize.x).toBe(size);
      for (const o of shared.cot.casters) expect(o.castShadow, level).toBe(size > 0);
      for (const o of shared.cot.receivers) expect(o.receiveShadow, level).toBe(size > 0);
    }
  });

  it('update: trọng số 1 → ánh trăng sáng, đèn xưởng tắt; trọng số 0 → ngược lại; trăng theo hướng của bức', () => {
    const { ctx, shared, layers } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    layers['anh-trang'].update(1 / 60, 1);
    expect(sun.intensity).toBeGreaterThan(0);
    expect(shared.cot.hemi.intensity).toBe(0);
    const [moon] = layers['anh-trang'].objects;
    expect(moon.position.clone().normalize().distanceTo(shared.moon.dir.value)).toBeLessThan(1e-9);
    ctx.weights.set('anh-trang', 0);
    layers['anh-trang'].update(1 / 60, 2);
    expect(sun.intensity).toBe(0);
    expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
  });

  it('dispose gỡ trăng, đèn, hoa đăng (2 lần vẫn an toàn); đèn xưởng của Cốt thì ở lại', () => {
    const { ctx, shared, layers } = build();
    const before = ctx.scene.children.length;
    layers['anh-trang'].dispose();
    layers['anh-trang'].dispose();
    // Lớp này thêm 6 thứ: trăng, ánh trăng + target của nó, đèn trời chàm, hoa đăng, ngọn nến.
    expect(ctx.scene.children).toHaveLength(before - 6);
    expect(ctx.scene.children.filter((o) => o.isLight)).toEqual([shared.cot.hemi]);
    for (const o of layers['anh-trang'].objects) expect(o.parent).toBeNull();
  });

  it('núm js: cường độ nến (update đọc), cỡ shadow map và bias (ShadowNode đọc mỗi khung, không biên dịch lại)', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['anh-trang'];
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [candle] = lights(ctx.scene, 'isPointLight');
    knobs['anh-trang'].set('candleIntensity', 0);
    layer.update(1 / 60, 1);
    expect(candle.intensity).toBe(0);
    knobs['anh-trang'].set('candleIntensity', 20);
    layer.update(1 / 60, 1);
    expect(candle.intensity).toBeGreaterThan(10);
    knobs['anh-trang'].set('shadowMapSize', 2048);
    expect(sun.shadow.mapSize.toArray()).toEqual([2048, 2048]);
    knobs['anh-trang'].set('shadowBias', -0.002);
    expect(sun.shadow.bias).toBe(-0.002);
    expect(layer.readouts.find((r) => r.id === 'shadowMap').get()).toBe(2048);
    expect(build({ level: 'thap' }).layers['anh-trang'].readouts[0].get()).toBe(0); // mức thấp: tắt bóng
  });

  it('Phá: "Bias = 0" rồi trả lại đúng bias của núm; "Tắt fresnel", "Đổi màu đèn" chỉ đổi uniform', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['anh-trang'];
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [candle] = lights(ctx.scene, 'isPointLight');
    const exp = (id) => layer.experiments.find((e) => e.id === id);
    exp('biasZero').toggle(true);
    expect([sun.shadow.bias, sun.shadow.normalBias]).toEqual([0, 0]);
    knobs['anh-trang'].set('shadowBias', -0.001); // đang phá: nhớ ý người xem, chưa áp
    expect(sun.shadow.bias).toBe(0);
    exp('biasZero').toggle(false);
    expect(sun.shadow.bias).toBe(-0.001);
    expect(sun.shadow.normalBias).toBeGreaterThan(0);
    exp('redCandle').toggle(true);
    layer.update(1 / 60, 1);
    expect(candle.color.getHexString()).toBe(ctx.palette.color('doSon').getHexString());
    exp('redCandle').toggle(false);
    layer.update(1 / 60, 1);
    expect(candle.color.getHexString()).toBe(ctx.palette.color('vangLaSang').getHexString());
    expect(() => { exp('noRim').toggle(true); exp('noRim').toggle(false); }).not.toThrow();
  });
});
