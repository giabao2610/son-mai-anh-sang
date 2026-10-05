// tests/paintings/cung-que/la-da.test.js — lá đa rơi: thời gian rơi theo trọng lực trăng và Trái Đất; chạm đất đúng chỗ; nằm yên rồi biến mất; chạm dồn thay ô cũ nhất; mỗi lá giữ g của nó; lá tự rụng; lớp Lá đa dịch được và chạm thì có lá rơi.
import { describe, it, expect } from 'vitest';
import { InstancedMesh, NodeMaterial, StaticDrawUsage } from 'three/webgpu';
import { AUTO, FALL, GRAVITY, createLeafFall } from '../../../src/paintings/cung-que/parts/la-da-roi.js';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import content from '../../../src/paintings/cung-que/content.vi.js';
import { knobs as laDaKnobs } from '../../../src/paintings/cung-que/layers/l5-la-da.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial } from '../../helpers/nodes.js';

const R = 1;
const top = [0, R + 0.6, 0]; // tán cách đất 0,6

describe('la-da-roi', () => {
  it('rơi 0,6 đơn vị (6 m): chừng 2,7 s trên trăng, 1,1 s trên Trái Đất', () => {
    for (const [g, s] of [[GRAVITY.trang, 2.7], [GRAVITY.traiDat, 1.1]]) {
      const f = createLeafFall({ cap: 4, radius: R, seed: 1 });
      f.g = g;
      f.count = 1;
      f.burst(0, top);
      expect(f.state(f.slots.find((x) => x.t0 === 0), 0).landAt).toBeCloseTo(s, 0);
    }
  });

  it('chạm đất thì nằm trên mặt cầu, nằm yên FALL.rest giây, rồi nhỏ dần về 0 trong FALL.fade giây', () => {
    const f = createLeafFall({ cap: 4, radius: R, seed: 2 });
    f.count = 1;
    f.burst(0, top);
    const slot = f.slots.find((x) => x.t0 === 0);
    const { landAt } = f.state(slot, 0);
    const at = f.state(slot, landAt + 0.5);
    expect(Math.hypot(...at.pos)).toBeCloseTo(R, 2);
    expect(at.scale).toBe(1);
    expect(f.state(slot, landAt + FALL.rest + FALL.fade + 0.01).scale).toBe(0);
  });

  it('chạm dồn: 20 lần × 8 lá với trần 32: ô bị thay luôn là ô cũ nhất; vị trí hữu hạn; số lá đang rơi ≤ trần (Review Focus 1)', () => {
    const f = createLeafFall({ cap: 32, radius: R, seed: 3 });
    f.count = 8;
    for (let i = 0; i < 20; i += 1) {
      const oldest = Math.min(...f.slots.map((s) => s.t0));
      f.burst(i * 0.1, top);
      if (i >= 4) expect(f.slots.filter((s) => s.t0 === oldest).length).toBe(0);
    }
    for (const s of f.slots) expect(f.state(s, 2.5).pos.every(Number.isFinite)).toBe(true);
    expect(f.falling(2.5)).toBeLessThanOrEqual(32);
  });

  it('mỗi lá giữ g của lúc nó rơi: đổi g sau đó không làm lá đang rơi đổi chỗ', () => {
    const f = createLeafFall({ cap: 4, radius: R, seed: 4 });
    f.count = 1;
    f.burst(0, top);
    const slot = f.slots.find((x) => x.t0 === 0);
    const before = f.state(slot, 1).pos;
    f.g = GRAVITY.traiDat;
    expect(f.state(slot, 1).pos).toEqual(before);
  });

  it('lá tự rụng: mỗi AUTO.every giây một lá; cảnh mở ra giữa chừng (ở t = 0 đã có lá đang rơi và lá nằm trên đất); gọi lại cùng t không thêm lá', () => {
    const f = createLeafFall({ cap: 16, radius: R, seed: 8 });
    const origin = () => top;
    f.drift(0, origin);
    const visible = f.slots.filter((s) => f.state(s, 0).scale > 0);
    expect(visible.length).toBe(Math.floor(AUTO.lead / AUTO.every) + 1);
    expect(f.falling(0)).toBeGreaterThan(0);
    expect(visible.some((s) => !f.state(s, 0).falling), 'có lá đã nằm trên đất').toBe(true);
    const version = f.version;
    f.drift(0, origin);
    expect(f.version).toBe(version);
    f.drift(AUTO.every * 2, origin);
    expect(f.slots.filter((s) => s.t0 > -1e3).length).toBe(visible.length + 2);
    expect(f.slots.filter((s) => s.t0 === 0).length, 'mỗi lần tự rụng chỉ một lá').toBe(1);
  });

  it('trần số lá phải là số nguyên ≥ 1: thiếu, bằng 0 hay số lẻ thì báo lỗi lúc dựng, không phải lúc chạm', () => {
    for (const cap of [0, undefined, 2.5]) expect(() => createLeafFall({ cap, radius: R }), String(cap)).toThrow(/budget\.leaves/);
  });

  it('tất định: cùng chuỗi chạm thì cùng ô; ô trống an toàn (không NaN, cỡ 0)', () => {
    const run = () => {
      const f = createLeafFall({ cap: 8, radius: R, seed: 5 });
      f.count = 3;
      f.burst(0.5, top);
      f.burst(0.9, top);
      return f.slots.map((s) => [...s.p0, ...s.v0, s.spin]);
    };
    expect(run()).toEqual(run());
    const empty = createLeafFall({ cap: 2, radius: R, seed: 6 });
    const s = empty.state(empty.slots[0], 10);
    expect(s.pos.every(Number.isFinite)).toBe(true);
    expect(s.scale).toBe(0);
  });
});

describe('l5-la-da', () => {
  const build = (options) => buildPainting(painting, meta, { until: 'la-da', ...options });
  const leaves = ({ layers }) => layers['la-da'].objects.find((o) => o.name === 'la-roi');

  it.each(['cao', 'thap'])('mức %s: InstancedMesh "la-roi" cấp theo trần budget.leaves một lần; không frustum culling; thuộc tính không ghi mỗi khung', (level) => {
    const built = build({ level });
    const mesh = leaves(built);
    expect(mesh).toBeInstanceOf(InstancedMesh);
    expect(mesh.count).toBe(built.ctx.budget.leaves);
    expect(mesh.frustumCulled).toBe(false);
    expect(mesh.material).toBeInstanceOf(NodeMaterial);
    expect(mesh.material.positionNode).toBeTruthy();
    expect(mesh.material.emissiveNode).toBeTruthy();
    // Bốn thuộc tính vec4 của lá không nằm trong geometry.attributes: shader đọc qua instancedBufferAttribute trong thân một Fn, nên
    // tìm trong lần dịch. DynamicDrawUsage thì three tải lại chúng ở mọi lần vẽ, dù chỉ đổi lúc chạm. (instancedBufferAttribute của TSL
    // tự ghi Static lên thuộc tính, setUsage trước đó không còn tác dụng; instancedDynamicBufferAttribute thì ghi Dynamic.)
    const attrs = compileMaterial(mesh, built.ctx, 'webgpu').bufferAttributes
      .filter((a) => a.isInstancedBufferAttribute && a !== mesh.instanceMatrix);
    expect(attrs, 'bốn thuộc tính vec4 của lá').toHaveLength(4);
    for (const a of attrs) expect(a.usage).toBe(StaticDrawUsage);
    expect(content.layers['la-da'].objects['la-roi']).toBeTruthy();
  });

  it('trần số lá đọc từ budget.leaves của bảng chất lượng, không có số dự phòng viết cứng', () => {
    expect(() => build({ budget: { leaves: undefined } })).toThrow(/budget\.leaves/);
    expect(build({ budget: { leaves: 20 } }).shared.leafFall.slots).toHaveLength(20);
  });

  it('núm gravity lấy lựa chọn từ bảng GRAVITY (một nguồn): lựa chọn nào cũng có g và có nhãn trong Sổ tay', async () => {
    const { options } = laDaKnobs.find((k) => k.id === 'gravity');
    expect(options).toEqual(Object.keys(GRAVITY));
    const { knobs, shared } = build();
    for (const option of options) {
      await knobs['la-da'].set('gravity', option);
      expect(shared.leafFall.g, option).toBe(GRAVITY[option]);
      expect(content.layers['la-da'].knobs.gravity.options[option], option).toBeTruthy();
    }
  });

  it.each(['webgpu', 'webgl2'])('%s: lá và khối bao dịch được', (backend) => {
    const built = build();
    expect(compileMaterial(leaves(built), built.ctx, backend).problems).toEqual([]);
    const volume = built.layers.cot.objects.find((o) => o.name === 'khoi-bao');
    expect(compileMaterial(volume, built.ctx, backend).problems).toEqual([]);
  });

  it('chạm vào tán: lá rơi (version tăng, số đo "Lá đang rơi" > 0); núm burst và gravity đi tới đường rơi', async () => {
    const { setup, shared, layers, knobs, ctx } = build();
    const before = shared.leafFall.version;
    ctx.u.time.value = 1;
    setup.onGesture({ kind: 'tap', ray: { origin: { x: 0, y: 1.6, z: 5 }, direction: { x: 0, y: 0, z: -1 } } });
    expect(shared.leafFall.version).toBe(before + 1);
    ctx.u.time.value = 1.5;
    const la = () => Number(layers['la-da'].readouts.find((r) => r.id === 'la').get());
    expect(la()).toBe(shared.leafFall.count);
    await knobs['la-da'].set('burst', 7);
    expect(shared.leafFall.count).toBe(7);
    await knobs['la-da'].set('gravity', 'traiDat');
    expect(shared.leafFall.g).toBe(GRAVITY.traiDat);
    expect(content.layers['la-da'].knobs.gravity.options.traiDat).toBeTruthy();
  });

  it('không chạm gì: khung ?freeze=10 đã có lá tự rụng thấy được (mài Lá đa thì thấy khác); giảm chuyển động thì không có lá tự rụng', () => {
    const shown = (options) => {
      const { setup, shared } = build(options);
      setup.update(0, 10 / 60);
      return shared.leafFall.slots.filter((s) => shared.leafFall.state(s, 10 / 60).scale > 0).length;
    };
    expect(shown()).toBeGreaterThan(0);
    expect(shown({ reducedMotion: true })).toBe(0);
  });

  it('thí nghiệm "Không ghi độ sâu" đổi uniform depthOff của khối bao', () => {
    const { layers, shared } = build();
    const [doSau] = layers['la-da'].experiments;
    expect(doSau.id).toBe('doSau');
    doSau.toggle(true);
    expect(shared.cot.depthOff.value).toBe(1);
    doSau.toggle(false);
    expect(shared.cot.depthOff.value).toBe(0);
  });
});
