// tests/paintings/ao-sen-dem.test.js — Bức 1 v0: dựng từng lớp trong Node (không GPU) với ctx giả theo EngineCtx.
import { describe, it, expect, vi } from 'vitest';
import { Scene, PerspectiveCamera, Color, Vector2, Vector3, Matrix4 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { mergePalette } from '../../src/engine/palette.js';
import { createWeights, createKnobs } from '../../src/engine/gpu/layers.js';
import meta from '../../src/paintings/ao-sen-dem/meta.js';
import * as cot from '../../src/paintings/ao-sen-dem/layers/l1-cot.js';

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
