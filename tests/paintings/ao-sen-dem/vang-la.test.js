// tests/paintings/ao-sen-dem/vang-la.test.js — Lớp 5 · Vàng lá (bản đơn giản): compute trên GPU, một Sprite, hút/đẩy theo cử chỉ.
import { describe, it, expect } from 'vitest';
import { AdditiveBlending } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'vang-la', ...options });

describe('l5-vang-la', () => {
  it('núm tĩnh size, glow, attraction', () => {
    expect(vangLa.id).toBe('vang-la');
    expect(vangLa.knobs.map((k) => [k.id, k.value])).toEqual([['size', 0.12], ['glow', 3], ['attraction', 1]]);
  });

  it('kernel khởi tạo chạy MỘT lần lúc dựng; mỗi update chạy kernel bước', () => {
    const { ctx, layers } = build();
    const calls = ctx.renderer.compute.mock.calls;
    expect(calls).toHaveLength(1);
    expect([calls[0][0].isComputeNode, calls[0][0].count]).toEqual([true, 3000]);
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
    expect(build({ budget: { fireflies: 7 } }).layers['vang-la'].objects[0].count).toBe(7);
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
