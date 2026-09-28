// tests/paintings/ao-sen-dem/cot.test.js — Lớp 1 · Cốt: lá nổi, lá đứng, hoa và nụ (nở theo uniform), cuống, lau sậy.
import { describe, it, expect } from 'vitest';
import { Matrix4, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as cot from '../../../src/paintings/ao-sen-dem/layers/l1-cot.js';
import { makeLeafGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-leaf.js';
import { makePetalGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-flower.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'cot', ...options });
/** Vị trí (x, z) của instance i trong một InstancedMesh. */
const at = (mesh, i) => new Vector3().setFromMatrixPosition(mesh.getMatrixAt(i, new Matrix4()));

describe('hình học', () => {
  it('một chiếc lá: 40–80 đỉnh, mặt trên hướng lên', () => {
    const g = makeLeafGeometry();
    expect(g.getAttribute('position').count).toBeGreaterThanOrEqual(40);
    expect(g.getAttribute('position').count).toBeLessThanOrEqual(80);
    expect(g.getAttribute('normal').getY(0)).toBeGreaterThan(0.9);
  });

  it('một cánh sen: gốc ở 0, mũi ở y = 1, có uv dọc cánh', () => {
    const g = makePetalGeometry();
    g.computeBoundingBox();
    expect(g.boundingBox.min.y).toBeCloseTo(0, 6);
    expect(g.boundingBox.max.y).toBeCloseTo(1, 6);
    expect(g.getAttribute('uv').itemSize).toBe(2);
  });
});

describe('l1-cot', () => {
  it('lá nổi + lá đứng = số lá theo mức; khoảng 10% là lá đứng', () => {
    for (const [level, total] of [['cao', 1200], ['vua', 800], ['thap', 500]]) {
      const { shared } = build({ level });
      const [leaves, standing] = [shared.cot.receivers[0], shared.cot.casters[0]];
      expect(leaves.count + standing.count, level).toBe(total);
      expect(standing.count / total).toBeGreaterThan(0.05);
      expect(standing.count / total).toBeLessThan(0.15);
    }
    const { shared } = build({ budget: { leaves: 40 } });
    expect(shared.cot.receivers[0].count + shared.cot.casters[0].count).toBe(40);
  });

  it('tâm instance của lá nổi khớp ma trận (lớp Mặt nước đọc để lá nhấp nhô)', () => {
    const [leaves] = build().shared.cot.receivers;
    const centers = leaves.geometry.getAttribute('instanceCenter');
    expect([centers.itemSize, centers.count]).toEqual([2, leaves.count]);
    for (let i = 0; i < leaves.count; i++) {
      const p = at(leaves, i);
      expect([centers.getX(i), centers.getY(i)]).toEqual([p.x, p.z]);
    }
  });

  it('theo hạt giống cố định; hoa và lau không đổi theo mức; lối trăng trước camera trống', () => {
    const a = build().layers.cot.objects;
    const b = build().layers.cot.objects;
    a.forEach((mesh, i) => expect(Array.from(mesh.instanceMatrix.array)).toEqual(Array.from(b[i].instanceMatrix.array)));
    const low = build({ level: 'thap' }).layers.cot.objects;
    for (const k of [2, 3, 5]) expect(Array.from(low[k].instanceMatrix.array)).toEqual(Array.from(a[k].instanceMatrix.array));
    for (const mesh of a.slice(0, 4)) {
      for (let i = 0; i < mesh.count; i++) {
        const { x, z } = at(mesh, i);
        expect(Math.abs(x) < 1.5 && z > -40 && z < 15, `${mesh.name || 'mesh'} ${i} trên lối trăng`).toBe(false);
      }
    }
  });

  it('hoa: 12 bông × 24 cánh + 20 nụ × 5 cánh trong MỘT InstancedMesh; nụ không nở', () => {
    const [, , petals, cores, stems] = build().layers.cot.objects;
    expect(petals.count).toBe(12 * 24 + 20 * 5);
    const hinge = petals.geometry.getAttribute('petalHinge');
    expect(hinge.count).toBe(petals.count);
    expect(hinge.getW(0)).toBeGreaterThan(0); // cánh hoa: có góc mở thêm
    expect(hinge.getW(petals.count - 1)).toBe(0); // cánh nụ: không mở
    expect(petals.material.positionNode).toBeTruthy(); // nở theo uniform openness
    expect(cores.count).toBe(12);
    expect(stems.count).toBeGreaterThanOrEqual(12 + 20);
  });

  it('300 ngọn lau ở rìa ao (bán kính 48–60)', () => {
    const reeds = build().layers.cot.objects[5];
    expect(reeds.count).toBe(300);
    for (let i = 0; i < reeds.count; i++) {
      const { x, z } = at(reeds, i);
      expect(Math.hypot(x, z)).toBeGreaterThan(48);
      expect(Math.hypot(x, z)).toBeLessThan(60);
    }
  });

  it('núm openness (uniform); mọi material là đất sét có emissiveNode; lá và cánh là MeshPhysical', () => {
    expect(cot.knobs.map((k) => [k.id, k.value])).toEqual([['openness', 0.85]]);
    const { shared, layers } = build();
    for (const mesh of layers.cot.objects) {
      expect(mesh.isInstancedMesh).toBe(true);
      expect(mesh.material.colorNode).toBeTruthy();
      expect(mesh.material.emissiveNode).toBeTruthy();
    }
    expect(shared.cot.leafMaterial.isMeshPhysicalNodeMaterial).toBe(true);
    expect(shared.cot.petalMaterial.isMeshPhysicalNodeMaterial).toBe(true);
  });

  it('công bố shared.cot; đèn xưởng; dispose gỡ sạch (2 lần vẫn an toàn)', () => {
    const { ctx, shared, layers } = build();
    const c = shared.cot;
    for (const key of ['leafMaterial', 'standingMaterial', 'petalMaterial', 'coreMaterial', 'stemMaterial', 'reedMaterial']) {
      expect(c[key]?.isNodeMaterial, key).toBe(true);
    }
    expect(c.hemi.isHemisphereLight).toBe(true);
    expect(c.hemiIntensity).toBeCloseTo(Math.PI, 6);
    expect(c.petalGeometry.isBufferGeometry).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([...layers.cot.objects, c.hemi]));
    layers.cot.dispose();
    layers.cot.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });
});
