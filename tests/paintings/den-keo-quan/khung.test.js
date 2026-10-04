// tests/paintings/den-keo-quan/khung.test.js — Bức 2 dựng được như run.js: đèn nến bật castShadow mà không có shadow map (node bóng giữ chỗ), vật nhận bóng, đất sét khi mọi trọng số bằng 0.
import { describe, it, expect } from 'vitest';
import { CylinderGeometry } from 'three/webgpu';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { LANTERN, cornerAngles } from '../../../src/paintings/den-keo-quan/parts/cot-den.js';
import { ROOM } from '../../../src/paintings/den-keo-quan/parts/cot-phong.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'ngon-nen', ...options });
const named = (layer, name) => layer.objects.find((o) => o.name === name);

describe('Bức 2 · khung', () => {
  it('trục đèn cách vách sau 1,9; ngọn lửa ở giữa dải hình nhân; lửa nằm trong ống trống', () => {
    expect(LANTERN.axis[1] - -ROOM.half).toBeCloseTo(1.9, 6);
    expect(LANTERN.flame[1]).toBeCloseTo((LANTERN.drum.y0 + LANTERN.drum.y1) / 2, 6);
    expect(Math.hypot(LANTERN.flame[0] - LANTERN.axis[0], LANTERN.flame[2] - LANTERN.axis[1])).toBeLessThan(LANTERN.drum.r);
  });

  it('cornerAngles khớp đỉnh thật của CylinderGeometry (quy ước góc atan(z, x) mà gobo và giấy dùng)', () => {
    for (const sides of [4, 6, 8]) {
      const pos = new CylinderGeometry(1, 1, 1, sides, 1, true).getAttribute('position');
      const real = new Set();
      for (let i = 0; i < pos.count; i += 1) real.add(Math.atan2(pos.getZ(i), pos.getX(i)).toFixed(4));
      const expected = new Set(cornerAngles(sides).map((a) => Math.atan2(Math.sin(a), Math.cos(a)).toFixed(4)));
      expect([...real].sort()).toEqual([...expected].sort());
    }
  });

  it('ngọn nến: một PointLight bật castShadow, có node bóng tự viết (three không dựng PointShadowNode), shadowMap bật', () => {
    const { ctx, shared } = build();
    const lights = ctx.scene.children.filter((o) => o.isPointLight);
    expect(lights).toHaveLength(1);
    const [light] = lights;
    expect(light.castShadow).toBe(true);
    expect(light.shadow.shadowNode?.isNode, 'thiếu light.shadow.shadowNode').toBe(true);
    expect(light.decay).toBe(2);
    expect(ctx.renderer.shadowMap.enabled).toBe(true);
    expect(shared.ngonNen.light).toBe(light);
  });

  it('gian nhà nhận bóng; giấy và vật trong đèn không nhận; vật trong đèn đổ bóng (cho thí nghiệm "Shadow map thật")', () => {
    const { layers } = build();
    for (const name of ['san', 'vach', 'tran', 'xa', 'cot-go']) expect(named(layers.cot, name).receiveShadow, name).toBe(true);
    for (const name of ['giay', 'khung-tre', 'de-chop', 'cay-nen']) expect(named(layers.cot, name).receiveShadow, name).toBe(false);
    for (const name of ['khung-tre', 'de-chop', 'cay-nen']) expect(named(layers.cot, name).castShadow, name).toBe(true);
    expect(named(layers.cot, 'giay').castShadow).toBe(false);
  });

  it('mọi trọng số (trừ Cốt) bằng 0: đèn nến tắt, đèn xưởng đủ sáng (luật 3)', () => {
    const { ctx, shared, layers } = build();
    ctx.weights.set('ngon-nen', 0);
    layers['ngon-nen'].update(0, 0);
    expect(shared.ngonNen.light.intensity).toBe(0);
    expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
  });
});
