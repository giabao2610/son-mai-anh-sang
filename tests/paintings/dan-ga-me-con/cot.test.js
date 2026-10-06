// tests/paintings/dan-ga-me-con/cot.test.js — Lớp 1 · Cốt của Bức 4: tờ giấy, gà mẹ, mười gà con bằng NodeMaterial gốc tô theo recipe; camera trực giao; không đèn, không shadow map; dịch được ở hai backend.
import { describe, it, expect } from 'vitest';
import { InstancedMesh, NodeMaterial, OrthographicCamera } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { HEN, HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'cot', ...options });
/** Mọi Mesh của một vật (Group của gà mẹ có mesh con), để dịch từng material. */
const meshesOf = (object) => {
  const found = [];
  object.traverse((o) => { if (o.isMesh) found.push(o); });
  return found;
};

describe('l1-cot (Bức 4)', () => {
  it('ba vật đúng tên: giay, ga-me (Group), ga-con (InstancedMesh 10 con, vị trí tính trong shader nên không bị cắt theo khung bao)', () => {
    const { layers } = build();
    expect(layers.cot.objects.map((o) => o.name)).toEqual(['giay', 'ga-me', 'ga-con']);
    const [, hen, chicks] = layers.cot.objects;
    expect(hen.isGroup).toBe(true);
    expect(chicks).toBeInstanceOf(InstancedMesh);
    expect([chicks.count, chicks.frustumCulled]).toEqual([10, false]);
  });

  it('mọi material là NodeMaterial gốc (lights = false: màu ra là colorNode), có colorNode và emissiveNode tường minh', () => {
    const { layers } = build();
    for (const object of layers.cot.objects) {
      for (const mesh of meshesOf(object)) {
        expect(mesh.material.constructor, mesh.name || object.name).toBe(NodeMaterial);
        expect(mesh.material.colorNode, `${object.name}: colorNode`).toBeTruthy();
        expect(mesh.material.emissiveNode, `${object.name}: emissiveNode`).toBeTruthy();
      }
    }
  });

  it('camera trực giao; cảnh không có đèn nào của three, shadowMap không bật', () => {
    const { ctx } = build();
    expect(ctx.camera).toBeInstanceOf(OrthographicCamera);
    const lights = [];
    ctx.scene.traverse((o) => { if (o.isLight) lights.push(o.type); });
    expect(lights).toEqual([]);
    expect(ctx.renderer.shadowMap?.enabled ?? false).toBe(false);
  });

  it('shared.cot: recipe đủ năm hàm; sàn; pixel là đơn vị cảnh của một điểm ảnh, tính lại mỗi khung theo khung nhìn và zoom', () => {
    const { shared, layers, ctx } = build();
    for (const fn of ['base', 'fill', 'ink', 'paper', 'glint']) expect(typeof shared.cot.recipe[fn], fn).toBe('function');
    expect(shared.cot.floor.x).toEqual([-6.7, 6.7]);
    expect(shared.cot.pixel.value).toBeCloseTo(12 / 400, 9); // khung nhìn cao 12 trên 400 điểm ảnh của canvas giả
    ctx.camera.zoom = 2;
    ctx.camera.updateProjectionMatrix();
    layers.cot.update(0, 0);
    expect(shared.cot.pixel.value).toBeCloseTo(12 / 2 / 400, 9);
  });

  it('chỗ của mười gà con lấy từ HOMES: (x, y, z, hướng); con trèo lưng đứng trên lưng mẹ', () => {
    const { shared } = build();
    const pose = shared.cot.chicks.pose.array;
    HOMES.forEach((home, i) => {
      const y = home.kind === 'back' ? HEN.back : 0;
      expect([...pose.slice(i * 4, i * 4 + 4)]).toEqual([home.at[0], y, home.at[1], home.heading].map((v) => expect.closeTo(v, 6)));
    });
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch được cả ba vật (mọi mesh của gà mẹ), không lỗi', (backend) => {
    const built = build();
    for (const object of built.layers.cot.objects) {
      for (const mesh of meshesOf(object)) {
        const { problems } = compileMaterial(mesh, built.ctx, backend);
        expect(problems, `${object.name}`).toEqual([]);
      }
    }
  });
});
