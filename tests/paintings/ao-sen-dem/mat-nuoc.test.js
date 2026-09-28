// tests/paintings/ao-sen-dem/mat-nuoc.test.js — Lớp 4 · Mặt nước: đĩa nước có chiếu sáng, reflector nằm ngang, MRT riêng, lá nhấp nhô.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as matNuoc from '../../../src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'mat-nuoc', ...options });

describe('l4-mat-nuoc', () => {
  it('núm tĩnh: 4 núm gợn sóng + distortion + fresnelPower', () => {
    expect(matNuoc.id).toBe('mat-nuoc');
    expect(matNuoc.knobs.map((k) => k.id)).toEqual(['amplitude', 'speed', 'decay', 'wavelength', 'distortion', 'fresnelPower']);
  });

  it('đĩa nước nằm ngang bán kính 60; material CÓ chiếu sáng (luật 3: trọng số 0 là đất sét dưới đèn)', () => {
    const [water] = build().layers['mat-nuoc'].objects;
    expect(water.material.isMeshStandardNodeMaterial).toBe(true);
    for (const key of ['colorNode', 'normalNode', 'emissiveNode', 'mrtNode']) expect(water.material[key], key).toBeTruthy();
    water.geometry.computeBoundingSphere();
    expect(water.geometry.boundingSphere.radius).toBeCloseTo(60, 5);
    expect(water.geometry.getAttribute('normal').getY(0)).toBeCloseTo(1, 5);
  });

  it('target của reflector nằm TRONG scene và trục +Z của nó chỉ lên trời (gương nằm ngang)', () => {
    const { ctx, layers } = build();
    const [water] = layers['mat-nuoc'].objects;
    // Lớp Ánh trăng cũng thêm một Object3D (target của đèn trăng); lớp này thêm target NGAY TRƯỚC mặt nước.
    const target = ctx.scene.children[ctx.scene.children.indexOf(water) - 1];
    expect(target.type).toBe('Object3D');
    expect(target?.parent).toBe(ctx.scene);
    ctx.scene.updateMatrixWorld();
    expect(new Vector3(0, 0, 1).transformDirection(target.matrixWorld).y).toBeCloseTo(1, 5);
  });

  it('lá nổi của Cốt nhấp nhô: lớp này gán positionNode cho leafMaterial (lá đứng thì không)', () => {
    const { shared } = build();
    expect(shared.cot.leafMaterial.positionNode).toBeTruthy();
    expect(shared.cot.standingMaterial.positionNode).toBeNull();
  });

  it('dispose gỡ nước và target (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const before = ctx.scene.children.length;
    layers['mat-nuoc'].dispose();
    layers['mat-nuoc'].dispose();
    expect(ctx.scene.children).toHaveLength(before - 2);
  });
});
