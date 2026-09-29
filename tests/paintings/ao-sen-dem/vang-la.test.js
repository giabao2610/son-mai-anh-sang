// tests/paintings/ao-sen-dem/vang-la.test.js — Lớp 5 · Vàng lá (bản đơn giản): compute trên GPU, một Sprite, hút/đẩy theo cử chỉ.
import { describe, it, expect } from 'vitest';
import { AdditiveBlending } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'vang-la', ...options });

describe('l5-vang-la', () => {
  it('núm tĩnh size, glow, attraction (uniform) và count (js, trần theo tầng)', () => {
    expect(vangLa.id).toBe('vang-la');
    expect(vangLa.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['size', 'uniform'], ['glow', 'uniform'], ['attraction', 'uniform'], ['count', 'js'],
    ]);
    expect(vangLa.knobs.find((k) => k.id === 'count').max).toEqual({ webgpu: 200000, webgl2: 20000 });
  });

  it('kernel khởi tạo chạy MỘT lần lúc dựng, trên CẢ bộ đệm (trần của tầng); mỗi update chạy kernel bước', () => {
    const { ctx, layers } = build();
    const calls = ctx.renderer.compute.mock.calls;
    expect(calls).toHaveLength(1);
    expect([calls[0][0].isComputeNode, calls[0][0].count]).toEqual([true, 200000]);
    expect(build({ tier: 'webgl2' }).ctx.renderer.compute.mock.calls[0][0].count).toBe(20000);
    layers['vang-la'].update(1 / 60, 1 / 60);
    layers['vang-la'].update(1 / 60, 2 / 60);
    expect(calls).toHaveLength(3);
    expect(calls[1][0]).not.toBe(calls[0][0]);
    expect(calls[2][0]).toBe(calls[1][0]);
  });

  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, có emissiveNode; số con theo mức', () => {
    const [sprite] = build().layers['vang-la'].objects;
    expect(sprite.isSprite).toBe(true);
    expect(sprite.count).toBe(3000);
    expect(sprite.frustumCulled).toBe(false);
    expect(sprite.material.blending).toBe(AdditiveBlending);
    expect(sprite.material.depthWrite).toBe(false);
    expect(sprite.material.emissiveNode).toBeTruthy();
    expect(build({ level: 'thap' }).layers['vang-la'].objects[0].count).toBe(600);
    expect(build({ budget: { fireflies: 700 } }).layers['vang-la'].objects[0].count).toBe(700);
    // Núm count không xuống dưới 100: sprite có count > 1 nằm trong cache key, về 1 là phải biên dịch lại.
    expect(build({ budget: { fireflies: 7 } }).layers['vang-la'].objects[0].count).toBe(100);
  });

  it('núm count: chỉ đổi số con được tính (kernel bước) và được vẽ (sprite), không tạo bộ đệm mới', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['vang-la'];
    layer.update(1 / 60, 1 / 60);
    const step = ctx.renderer.compute.mock.calls[1][0];
    expect(step.count).toBe(3000);
    knobs['vang-la'].set('count', 50000);
    expect([step.count, layer.objects[0].count]).toEqual([50000, 50000]);
    layer.update(1 / 60, 2 / 60);
    expect(ctx.renderer.compute.mock.calls[2][0]).toBe(step);
  });

  it('dispose gỡ sprite (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const [sprite] = layers['vang-la'].objects;
    layers['vang-la'].dispose();
    layers['vang-la'].dispose();
    expect(sprite.parent).toBeNull();
    expect(ctx.scene.children).not.toContain(sprite);
  });
});
