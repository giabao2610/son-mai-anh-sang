// tests/paintings/ao-sen-dem.test.js — Bức 1 v0: dựng từng lớp trong Node (không GPU) với ctx giả theo EngineCtx.
import { describe, it, expect, vi } from 'vitest';
import { Scene, PerspectiveCamera, Color, Vector2, Vector3, Matrix4, AdditiveBlending } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { mergePalette } from '../../src/engine/palette.js';
import { createWeights, createKnobs } from '../../src/engine/gpu/layers.js';
import meta from '../../src/paintings/ao-sen-dem/meta.js';
import * as cot from '../../src/paintings/ao-sen-dem/layers/l1-cot.js';
import * as matNuoc from '../../src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js';
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

describe('l1-cot (Cốt v0)', () => {
  it('lá instanced: số lá theo mức, 40–80 đỉnh, mặt trên hướng lên, có tâm instance', () => {
    const layer = cot.createLayer(makeCtx(cot), {});
    const [leaves] = layer.objects;
    expect(leaves.isInstancedMesh).toBe(true);
    expect(leaves.count).toBe(1200);
    const vertices = leaves.geometry.getAttribute('position').count;
    expect(vertices).toBeGreaterThanOrEqual(40);
    expect(vertices).toBeLessThanOrEqual(80);
    expect(leaves.geometry.getAttribute('normal').getY(0)).toBeGreaterThan(0.9);
    const centers = leaves.geometry.getAttribute('instanceCenter');
    expect(centers.isInstancedBufferAttribute).toBe(true);
    expect([centers.itemSize, centers.count]).toEqual([2, 1200]);
    const m = new Matrix4();
    const p = new Vector3();
    for (let i = 0; i < leaves.count; i++) {
      p.setFromMatrixPosition(leaves.getMatrixAt(i, m));
      expect([centers.getX(i), centers.getY(i)]).toEqual([p.x, p.z]);
    }
  });

  it('rải theo hạt giống cố định và chừa lối trăng trước camera', () => {
    const a = cot.createLayer(makeCtx(cot), {}).objects[0];
    const b = cot.createLayer(makeCtx(cot), {}).objects[0];
    expect(Array.from(a.instanceMatrix.array)).toEqual(Array.from(b.instanceMatrix.array));
    const centers = a.geometry.getAttribute('instanceCenter');
    for (let i = 0; i < a.count; i++) {
      const x = centers.getX(i);
      const z = centers.getY(i);
      const inPath = Math.abs(x) < 1.5 && z > -40 && z < 15;
      expect(inPath, `lá ${i} nằm trên lối trăng (${x.toFixed(2)}, ${z.toFixed(2)})`).toBe(false);
    }
  });

  it('số lá đọc từ ctx.budget.leaves, thiếu thì theo mức', () => {
    expect(cot.createLayer(makeCtx(cot, { level: 'thap' }), {}).objects[0].count).toBe(500);
    expect(cot.createLayer(makeCtx(cot, { level: 'vua' }), {}).objects[0].count).toBe(800);
    expect(cot.createLayer(makeCtx(cot, { budget: { leaves: 42 } }), {}).objects[0].count).toBe(42);
  });

  it('đất sét có emissiveNode tường minh, đèn xưởng, công bố shared.cot; dispose gỡ sạch (2 lần vẫn an toàn)', () => {
    const ctx = makeCtx(cot);
    const shared = {};
    const layer = cot.createLayer(ctx, shared);
    const [leaves] = layer.objects;
    expect(cot.id).toBe('cot');
    expect(cot.knobs).toEqual([]);
    expect(leaves.material.colorNode).toBeTruthy();
    expect(leaves.material.emissiveNode).toBeTruthy();
    expect(shared.cot.leafMaterial).toBe(leaves.material);
    expect(shared.cot.hemi.isHemisphereLight).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([leaves, shared.cot.hemi]));
    layer.dispose();
    layer.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });
});

describe('l4-mat-nuoc (Mặt nước v0)', () => {
  it('đĩa nước nằm ngang bán kính 60, MeshBasicNodeMaterial có colorNode và emissiveNode', () => {
    const layer = matNuoc.createLayer(makeCtx(matNuoc), {});
    const [water] = layer.objects;
    expect(water.isMesh).toBe(true);
    expect(water.material.isMeshBasicNodeMaterial).toBe(true);
    expect(water.material.colorNode).toBeTruthy();
    expect(water.material.emissiveNode).toBeTruthy();
    water.geometry.computeBoundingSphere();
    expect(water.geometry.boundingSphere.radius).toBeCloseTo(60, 5);
    expect(water.geometry.getAttribute('normal').getY(0)).toBeCloseTo(1, 5);
  });

  it('target của reflector nằm TRONG scene và trục +Z của nó chỉ lên trời (gương nằm ngang)', () => {
    const ctx = makeCtx(matNuoc);
    matNuoc.createLayer(ctx, {});
    const target = ctx.scene.children.find((o) => !o.isMesh);
    expect(target?.parent).toBe(ctx.scene);
    ctx.scene.updateMatrixWorld();
    expect(new Vector3(0, 0, 1).transformDirection(target.matrixWorld).y).toBeCloseTo(1, 5);
  });

  it('knobs tĩnh distortion + fresnelPower; dispose gỡ nước và target (2 lần vẫn an toàn)', () => {
    expect(matNuoc.id).toBe('mat-nuoc');
    expect(matNuoc.knobs.map((k) => [k.id, k.value])).toEqual([['distortion', 0.02], ['fresnelPower', 5]]);
    const ctx = makeCtx(matNuoc);
    const layer = matNuoc.createLayer(ctx, {});
    expect(ctx.scene.children).toHaveLength(2);
    layer.dispose();
    layer.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });
});

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
