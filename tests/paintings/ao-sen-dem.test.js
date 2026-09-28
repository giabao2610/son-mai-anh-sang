// tests/paintings/ao-sen-dem.test.js — Bức 1 v0: dựng từng lớp trong Node (không GPU) với ctx giả theo EngineCtx.
import { describe, it, expect, vi } from 'vitest';
import { Scene, PerspectiveCamera, Color, Vector2, Matrix4, AdditiveBlending } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { mergePalette } from '../../src/engine/palette.js';
import { createWeights, createKnobs } from '../../src/engine/gpu/layers.js';
import meta from '../../src/paintings/ao-sen-dem/meta.js';
import * as vangLa from '../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';

/** ctx giống run.js dựng (EngineCtx [0]) + knob() của chính lớp; renderer giả chỉ ghi lời gọi compute. */
function makeCtx(module, { level = 'cao', budget = {} } = {}) {
  const hex = mergePalette();
  const env = { tier: 'webgpu', level, budget, now: new Date('2026-09-28T21:00:00+07:00'), mobile: false };
  const ctx = {
    ...env,
    reducedMotion: false,
    renderer: { compute: vi.fn() },
    scene: new Scene(),
    camera: new PerspectiveCamera(40, 1.6, 0.1, 200),
    palette: { hex, color: (token) => new Color(hex[token]) },
    u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)) },
    weight: createWeights(meta.layers).weight,
    debug: false,
  };
  return { ...ctx, knob: createKnobs(module.id, module.knobs, env).knob };
}

describe('l5-vang-la (Vàng lá v0)', () => {
  it('kernel khởi tạo chạy MỘT lần trong createLayer; mỗi update chạy kernel bước', () => {
    const ctx = makeCtx(vangLa);
    const layer = vangLa.createLayer(ctx, {});
    expect(ctx.renderer.compute).toHaveBeenCalledTimes(1);
    const init = ctx.renderer.compute.mock.calls[0][0];
    expect([init.isComputeNode, init.count]).toEqual([true, 3000]);
    layer.update(1 / 60, 1 / 60);
    layer.update(1 / 60, 2 / 60);
    expect(ctx.renderer.compute).toHaveBeenCalledTimes(3);
    const step = ctx.renderer.compute.mock.calls[1][0];
    expect([step.isComputeNode, step.count]).toEqual([true, 3000]);
    expect(step).not.toBe(init);
    expect(ctx.renderer.compute.mock.calls[2][0]).toBe(step);
  });

  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, có emissiveNode; số con theo mức', () => {
    const [sprite] = vangLa.createLayer(makeCtx(vangLa), {}).objects;
    expect(sprite.isSprite).toBe(true);
    expect(sprite.count).toBe(3000);
    expect(sprite.frustumCulled).toBe(false);
    expect(sprite.material.isSpriteNodeMaterial).toBe(true);
    expect(sprite.material.blending).toBe(AdditiveBlending);
    expect(sprite.material.depthWrite).toBe(false);
    expect(sprite.material.positionNode).toBeTruthy();
    expect(sprite.material.emissiveNode).toBeTruthy();
    expect(vangLa.createLayer(makeCtx(vangLa, { level: 'thap' }), {}).objects[0].count).toBe(600);
    expect(vangLa.createLayer(makeCtx(vangLa, { budget: { fireflies: 7 } }), {}).objects[0].count).toBe(7);
  });

  it('knobs tĩnh size + glow; dispose gỡ sprite (2 lần vẫn an toàn)', () => {
    expect(vangLa.id).toBe('vang-la');
    expect(vangLa.knobs.map((k) => [k.id, k.value])).toEqual([['size', 0.12], ['glow', 3]]);
    const ctx = makeCtx(vangLa);
    const layer = vangLa.createLayer(ctx, {});
    expect(ctx.scene.children).toEqual(layer.objects);
    layer.dispose();
    layer.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });
});
