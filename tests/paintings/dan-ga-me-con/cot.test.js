// tests/paintings/dan-ga-me-con/cot.test.js — Lớp 1 · Cốt của Bức 4: tờ giấy, gà mẹ (mình, hai cánh), mười gà con bằng NodeMaterial gốc tô theo recipe; dáng đi qua positionNode (thuộc tính instance, bốn uniform); Tấm bìa phẳng không biên dịch lại; khung khối mình gà mẹ cho Bản nét; camera trực giao; không đèn, không shadow map; dịch được ở hai backend.
import { describe, it, expect } from 'vitest';
import { DynamicDrawUsage, InstancedMesh, Matrix4, NodeMaterial, OrthographicCamera, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { CAMERA, HEN, HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { PART } from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';
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
    expect(shared.cot.pixel.value).toBeCloseTo(CAMERA.height / 400, 9); // khung nhìn cao CAMERA.height trên 400 điểm ảnh của canvas giả
    ctx.camera.zoom = 2;
    ctx.camera.updateProjectionMatrix();
    layers.cot.update(0, 0);
    expect(shared.cot.pixel.value).toBeCloseTo(CAMERA.height / 2 / 400, 9);
  });

  it('số đo goc: đọc camera SỐNG của sân khấu, 0,0° ở góc của tranh, đổi theo camera (e2e đọc số này để kiểm tranh tự khép lại)', () => {
    const { layers, ctx } = build();
    const goc = layers.cot.readouts.find((r) => r.id === 'goc');
    expect(goc.unit).toBe('°');
    expect(goc.get()).toBe('0.0');
    const target = new Vector3(...CAMERA.target);
    ctx.camera.position.sub(target).applyAxisAngle(new Vector3(0, 1, 0), 0.5).add(target); // xoay 0,5 rad quanh trục đứng qua điểm nhìn
    expect(Number(goc.get())).toBeCloseTo(26.9, 1); // 0,5 rad = 28,6° quanh trục đứng; camera nhìn chếch xuống nên góc 3D nhỏ hơn
  });

  it('chỗ của mười gà con lấy từ HOMES: (x, y, z, hướng); con trèo lưng đứng trên lưng mẹ', () => {
    const { shared } = build();
    const pose = shared.cot.chicks.pose.array;
    HOMES.forEach((home, i) => {
      const y = home.kind === 'back' ? HEN.back : 0;
      expect([...pose.slice(i * 4, i * 4 + 4)]).toEqual([home.at[0], y, home.at[1], home.heading].map((v) => expect.closeTo(v, 6)));
    });
  });

  it('gà mẹ: Group ga-me có đúng ba Mesh (mình, cánh trái, cánh phải); mọi material có positionNode, nên frustumCulled = false', () => {
    const { layers, shared } = build();
    const hen = layers.cot.objects.find((o) => o.name === 'ga-me');
    const meshes = meshesOf(hen);
    expect(meshes).toHaveLength(3);
    expect(meshes).toEqual([shared.cot.hen.body, shared.cot.hen.wingL, shared.cot.hen.wingR]);
    expect(shared.cot.hen.group).toBe(hen);
    for (const mesh of meshes) {
      expect(mesh.material.positionNode, 'positionNode').toBeTruthy();
      expect(mesh.frustumCulled, 'đỉnh dời trong shader: khung bao trên CPU không còn đúng').toBe(false);
    }
    // Bốn uniform dáng (radian) mà lớp Đàn gà ghi mỗi khung (Task 8); lúc dựng là dáng nghỉ.
    const pose = ['wing', 'nod', 'look', 'scratch'].map((k) => shared.cot.hen[k]);
    expect(pose.map((u) => u.name)).toEqual(['henWing', 'henNod', 'henLook', 'henScratch']);
    expect(pose.map((u) => u.value)).toEqual([0, 0, 0, 0]);
  });

  it('shared.cot.hen.bodyFrame (cho viền cánh của Bản nét) đưa điểm thế giới về khung của khối mình gà mẹ: mọi đỉnh của khối mình trong geometry thật nằm trên mặt cầu đơn vị', () => {
    const { shared } = build();
    const { bodyFrame, body } = shared.cot.hen;
    expect(bodyFrame).toBeInstanceOf(Matrix4);
    const { position, part } = body.geometry.attributes;
    let n = 0;
    for (let i = 0; i < position.count; i += 1) {
      if (part.getX(i) !== PART.BODY) continue;
      expect(new Vector3().fromBufferAttribute(position, i).applyMatrix4(bodyFrame).length()).toBeCloseTo(1, 6);
      n += 1;
    }
    expect(n).toBeGreaterThan(100);
  });

  it.each(['webgpu', 'webgl2'])('%s: mỗi mesh của gà mẹ đọc đúng uniform dáng của nó; positionNode đọc uniform của Tấm bìa phẳng', (backend) => {
    const built = build();
    const { body, wingL, wingR } = built.shared.cot.hen;
    const read = (mesh) => compileMaterial(mesh, built.ctx, backend).uniforms;
    expect(read(body)).toEqual(expect.arrayContaining(['henNod', 'henLook', 'henScratch', 'cotBiaPhang']));
    expect(read(body)).not.toContain('henWing');
    for (const wing of [wingL, wingR]) {
      expect(read(wing)).toEqual(expect.arrayContaining(['henWing', 'cotBiaPhang']));
      expect(read(wing)).not.toContain('henNod');
    }
    expect(read(built.shared.cot.chicks.mesh)).toContain('cotBiaPhang');
  });

  it('gà con: pose, head là instancedDynamicBufferAttribute (lớp Đàn gà ghi mỗi khung); positionNode đọc cả hai; dáng nghỉ đầu ngẩng', () => {
    const built = build();
    const { chicks } = built.shared.cot;
    expect(chicks.mesh.material.positionNode).toBeTruthy();
    // Thuộc tính instance không nằm trong geometry.attributes: shader đọc chúng qua node, trong thân một Fn. Chưa có Bản màu thì không
    // ai đọc pigment (ban-mau.test.js kiểm nó).
    const attrs = compileMaterial(chicks.mesh, built.ctx, 'webgpu').bufferAttributes
      .filter((a) => a.isInstancedBufferAttribute && a !== chicks.mesh.instanceMatrix);
    expect(attrs).toHaveLength(2);
    expect(attrs).toContain(chicks.pose);
    expect(attrs).toContain(chicks.head);
    expect([chicks.pose.itemSize, chicks.head.itemSize]).toEqual([4, 1]);
    expect([chicks.pose.usage, chicks.head.usage]).toEqual([DynamicDrawUsage, DynamicDrawUsage]);
    expect([...chicks.head.array], 'dáng nghỉ: đầu ngẩng').toEqual(HOMES.map(() => 0));
  });

  it('thí nghiệm biaPhang (Tấm bìa phẳng) chỉ đổi một uniform: bật rồi tắt, không material nào biên dịch lại (version không đổi)', async () => {
    const { layers } = build();
    const exp = layers.cot.experiments.find((e) => e.id === 'biaPhang');
    expect(exp).toBeTruthy();
    const materials = layers.cot.objects.flatMap(meshesOf).map((m) => m.material);
    const versions = materials.map((m) => m.version);
    await exp.toggle(true);
    expect(materials.map((m) => m.version)).toEqual(versions);
    await exp.toggle(false);
    expect(materials.map((m) => m.version)).toEqual(versions);
  });

  it('núm segments dựng lại cả bốn geometry (mình, hai cánh của mẹ; gà con) và gỡ geometry cũ', async () => {
    const { knobs, shared } = build();
    const meshes = [shared.cot.hen.body, shared.cot.hen.wingL, shared.cot.hen.wingR, shared.cot.chicks.mesh];
    const old = meshes.map((m) => m.geometry);
    const gone = old.map(() => false);
    old.forEach((g, i) => g.addEventListener('dispose', () => { gone[i] = true; }));
    await knobs.cot.set('segments', 48);
    meshes.forEach((m, i) => {
      expect(m.geometry, `geometry ${i}`).not.toBe(old[i]);
      expect(m.geometry.attributes.position.count).toBeGreaterThan(old[i].attributes.position.count);
    });
    expect(gone).toEqual([true, true, true, true]);
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch được cả ba vật (mọi mesh của gà mẹ) ở segments 8 và 48, không lỗi', async (backend) => {
    for (const segments of [8, 48]) {
      const built = build();
      await built.knobs.cot.set('segments', segments);
      for (const object of built.layers.cot.objects) {
        for (const mesh of meshesOf(object)) {
          const { problems } = compileMaterial(mesh, built.ctx, backend);
          expect(problems, `${object.name}, segments ${segments}`).toEqual([]);
        }
      }
    }
  });
});
