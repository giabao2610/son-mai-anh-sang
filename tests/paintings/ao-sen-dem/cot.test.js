// tests/paintings/ao-sen-dem/cot.test.js — Lớp 1 · Cốt: lá nổi, lá đứng, hoa và nụ (nở theo uniform), cuống, lau sậy; núm, thí nghiệm, số đo.
import { describe, it, expect } from 'vitest';
import { Matrix4, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as cot from '../../../src/paintings/ao-sen-dem/layers/l1-cot.js';
import { inMoonPath, makeLeafGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-leaf.js';
import { PETAL_CAPACITY, makePetalGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-flower.js';
import { LOOSE_MAX } from '../../../src/paintings/ao-sen-dem/parts/cot-lab.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'cot', ...options });
const m4 = new Matrix4();
/** Vị trí (x, z) của instance i trong một InstancedMesh. */
const at = (mesh, i) => new Vector3().setFromMatrixPosition(mesh.getMatrixAt(i, m4));
/** Cỡ (x, y) của instance i. */
const scaleOf = (mesh, i) => new Vector3().setFromMatrixScale(mesh.getMatrixAt(i, m4));
const matrices = (mesh) => Array.from(mesh.instanceMatrix.array.slice(0, mesh.count * 16));

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

  it('lối trăng là hình nêm từ camera về phía trăng: phương vị âm thì nêm lệch trái', () => {
    expect(inMoonPath(0, -40)).toBe(true);
    expect(inMoonPath(0, -40, -0.3)).toBe(false);
    expect(inMoonPath(-72 * Math.tan(0.3), -40, -0.3)).toBe(true);
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
    expect(centers.itemSize).toBe(2);
    expect(centers.count).toBeGreaterThanOrEqual(leaves.count); // cấp phát theo trần của núm leafCount
    for (let i = 0; i < leaves.count; i++) {
      const p = at(leaves, i);
      expect([centers.getX(i), centers.getY(i)]).toEqual([Math.fround(p.x), Math.fround(p.z)]);
    }
  });

  it('theo hạt giống cố định; hoa và lau không đổi theo mức; lối trăng (về phía trăng lúc 21:00) trống', () => {
    const { shared, layers } = build();
    const a = layers.cot.objects;
    const b = build().layers.cot.objects;
    a.forEach((mesh, i) => expect(matrices(mesh)).toEqual(matrices(b[i])));
    const low = build({ level: 'thap' }).layers.cot.objects;
    for (const k of [2, 3, 5]) expect(matrices(low[k])).toEqual(matrices(a[k]));
    const dir = shared.moon.dir.value;
    const azimuth = Math.atan2(dir.x, -dir.z);
    expect(azimuth).toBeLessThan(-0.1); // 21:00: trăng còn ở phía đông (bên trái)
    for (const mesh of a.slice(0, 4)) {
      for (let i = 0; i < mesh.count; i++) {
        const { x, z } = at(mesh, i);
        expect(inMoonPath(x, z, azimuth), `${i} nằm trên lối trăng`).toBe(false);
      }
    }
  });

  it('hoa: 12 bông × 24 cánh + 20 nụ × 5 cánh trong MỘT InstancedMesh; nụ không nở', () => {
    const [, , petals, cores, stems] = build().layers.cot.objects;
    expect(petals.count).toBe(12 * 24 + 20 * 5);
    expect(PETAL_CAPACITY).toBe(petals.count);
    const hinge = petals.geometry.getAttribute('petalHinge');
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

  it('núm: openness là uniform, còn lại là rebuild; mọi material là đất sét có emissiveNode', () => {
    expect(cot.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['leafCount', 'rebuild'], ['seed', 'rebuild'], ['sizeVariance', 'rebuild'], ['cupAmount', 'rebuild'],
      ['openness', 'uniform'], ['wireframe', 'rebuild'],
    ]);
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

describe('l1-cot · núm rebuild (GĐ 2): ghi lại InstancedMesh sẵn có, không tạo mesh mới', () => {
  it('leafCount: đổi số lá, cùng các object cũ', () => {
    const { layers, knobs } = build();
    const before = [...layers.cot.objects];
    knobs.cot.set('leafCount', 600);
    const [leaves, standing] = layers.cot.objects;
    expect(leaves.count + standing.count).toBe(600);
    expect(layers.cot.objects).toEqual(before);
  });

  it('seed: cả ao đổi (lá, hoa, lau); về lại 0 thì đúng ao cũ', () => {
    const { layers, knobs } = build();
    const original = layers.cot.objects.map(matrices);
    knobs.cot.set('seed', 7);
    layers.cot.objects.forEach((mesh, i) => expect(matrices(mesh), `object ${i}`).not.toEqual(original[i]));
    knobs.cot.set('seed', 0);
    layers.cot.objects.forEach((mesh, i) => expect(matrices(mesh)).toEqual(original[i]));
  });

  it('sizeVariance = 0: mọi lá nổi cùng cỡ; cupAmount = 2: lá lõm gấp đôi (y = 2 × x)', () => {
    const { layers, knobs } = build();
    knobs.cot.set('sizeVariance', 0);
    const [leaves] = layers.cot.objects;
    const first = scaleOf(leaves, 0).x;
    for (let i = 1; i < leaves.count; i++) expect(scaleOf(leaves, i).x).toBeCloseTo(first, 5);
    knobs.cot.set('cupAmount', 2);
    const s = scaleOf(leaves, 3);
    expect(s.y / s.x).toBeCloseTo(2, 5);
  });

  it('wireframe: bật trên mọi material của Cốt và báo cần biên dịch lại', () => {
    const { shared, knobs } = build();
    const version = shared.cot.leafMaterial.version;
    knobs.cot.set('wireframe', true);
    for (const m of ['leafMaterial', 'petalMaterial', 'reedMaterial']) expect(shared.cot[m].wireframe, m).toBe(true);
    expect(shared.cot.leafMaterial.version).toBeGreaterThan(version);
  });
});

describe('l1-cot · Phá (GĐ 2)', () => {
  const experiment = (layer, id) => layer.experiments.find((e) => e.id === id);

  it('"Tắt instancing": lá nổi thành từng Mesh riêng (tối đa theo mức), giấu InstancedMesh; tắt thì như cũ', () => {
    for (const level of ['cao', 'thap']) {
      const { ctx, layers } = build({ level });
      const [leaves] = layers.cot.objects;
      experiment(layers.cot, 'noInstancing').toggle(true);
      experiment(layers.cot, 'noInstancing').toggle(true); // bật hai lần vẫn chỉ một Group
      const group = layers.cot.objects.at(-1);
      expect(group.isGroup).toBe(true);
      expect(group.children).toHaveLength(Math.min(leaves.count, LOOSE_MAX[level]));
      expect(group.children[0].material).toBe(leaves.material);
      expect(ctx.scene.children).toContain(group);
      expect(leaves.visible).toBe(false);
      // Renderer giữ một RenderObject (kèm bộ đệm uniform) cho mỗi Mesh ở mỗi pass, và chỉ gỡ khi object bắn
      // 'dispose': tắt thí nghiệm mà không dispose Mesh rời là rò bộ nhớ sau mỗi lần bật/tắt.
      const meshes = [...group.children];
      const disposed = new Set();
      for (const mesh of meshes) mesh.addEventListener('dispose', () => disposed.add(mesh));
      let sharedDisposed = 0;
      for (const owner of [leaves.geometry, leaves.material]) owner.addEventListener('dispose', () => { sharedDisposed += 1; });
      experiment(layers.cot, 'noInstancing').toggle(false);
      expect(disposed.size).toBe(meshes.length);
      expect(sharedDisposed).toBe(0); // hình và material dùng chung với lá instanced: không dispose
      expect(layers.cot.objects).toHaveLength(6);
      expect(ctx.scene.children).not.toContain(group);
      expect(leaves.visible).toBe(true);
    }
  });

  it('"Tắt instancing" đang bật mà đổi số lá: dựng lại các Mesh rời theo số lá mới; dispose gỡ cả chúng', () => {
    const { ctx, layers, knobs } = build({ level: 'thap' });
    experiment(layers.cot, 'noInstancing').toggle(true);
    knobs.cot.set('leafCount', 100);
    const group = layers.cot.objects.at(-1);
    expect(group.children).toHaveLength(layers.cot.objects[0].count);
    layers.cot.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });

  it('"Normal phẳng": flatShading trên mọi material của Cốt', () => {
    const { shared, layers } = build();
    experiment(layers.cot, 'flatNormals').toggle(true);
    expect(shared.cot.stemMaterial.flatShading).toBe(true);
    experiment(layers.cot, 'flatNormals').toggle(false);
    expect(shared.cot.stemMaterial.flatShading).toBe(false);
  });

  it('số đo: số lá và số đỉnh (đỉnh của hình × số bản sao; Mesh rời tính từng cái)', () => {
    const { layers, knobs } = build({ level: 'thap' });
    const read = (id) => layers.cot.readouts.find((r) => r.id === id).get();
    expect(read('leaves')).toBe(500);
    knobs.cot.set('leafCount', 200); // ít lá hơn trần Mesh rời của mức thấp (300): so được hai cách vẽ
    const expected = layers.cot.objects.reduce((n, o) => n + o.geometry.getAttribute('position').count * o.count, 0);
    expect(read('vertices')).toBe(expected);
    experiment(layers.cot, 'noInstancing').toggle(true);
    expect(read('vertices')).toBe(expected); // cùng số đỉnh; chỉ số draw call là khác
  });
});
