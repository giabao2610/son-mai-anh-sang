// tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
import { moonPhase } from '../../../src/lib/astro/moon.js';
import { knobValue } from '../../../src/engine/gpu/layers.js';
import { NOW, buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
const lights = (scene, flag) => scene.children.filter((o) => o[flag]);

describe('l2-anh-trang', () => {
  it('núm tĩnh; pha trăng mặc định là pha của đêm nay', () => {
    expect(anhTrang.id).toBe('anh-trang');
    expect(anhTrang.knobs.map((k) => k.id)).toEqual(['moonPhase', 'rimPower', 'rimColor', 'translucency', 'clearcoat', 'candleColor']);
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

  it('dispose gỡ trăng, đèn, hoa đăng (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    layers['anh-trang'].dispose();
    layers['anh-trang'].dispose();
    expect(ctx.scene.children.filter((o) => o.isLight && !o.isHemisphereLight)).toHaveLength(0);
    for (const o of layers['anh-trang'].objects) expect(o.parent).toBeNull();
  });
});
