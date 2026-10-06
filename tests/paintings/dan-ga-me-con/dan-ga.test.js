// tests/paintings/dan-ga-me-con/dan-ga.test.js — Lớp 5 · Đàn gà của Bức 4, dựng cả bức: compute của bể thóc (mảng mỏ 10 phần tử) và Sprite thóc dịch được ở hai backend; update(0, t) không tiến mô phỏng; trọng số 0 thì không rắc, không dồn hàng đợi; số đo, thí nghiệm, nấc, núm ở hai đầu; Cốt áp dáng đàn gà theo trọng số (shared.cot.pose).
import { describe, it, expect } from 'vitest';
import { Raycaster, Sprite, Vector2, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { HEN, HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileCompute, compileMaterial } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, options);
const BEAK_ARRAY = { webgpu: /array<\s*vec4<f32>,\s*10\s*>/, webgl2: /NodeBuffer_\d+/ };
/** Tia tới điểm (x, 0, z) của sàn, như input.js dựng. */
function rayTo(camera, [x, z]) {
  const ndc = new Vector3(x, 0, z).project(camera);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
  return raycaster.ray.clone();
}
/** Một khung như scene.step: đồng hồ, cử chỉ, setup.update rồi mọi lớp; dt = 0 là khung đứng yên của ?freeze. */
function frame(built, t, dt, gestures = []) {
  built.ctx.u.time.value = t;
  built.ctx.u.delta.value = dt;
  for (const g of gestures) built.setup.onGesture(g);
  built.setup.update(dt, t);
  for (const { layer } of built.built) layer.update?.(dt, t);
}
const tapAt = (built, at) => ({ kind: 'tap', ray: rayTo(built.ctx.camera, at), pointer: 'mouse' });
const read = (built, id) => built.layers['dan-ga'].readouts.find((r) => r.id === id).get();
const grains = (built) => built.layers['dan-ga'].objects.find((o) => o.name === 'thoc');
/** Compute bước của bể thóc: lần compute cuối sau một khung có dt > 0. */
function stepNode(built) {
  frame(built, 1 / 60, 1 / 60);
  return built.ctx.renderer.compute.mock.calls.at(-1)[0];
}

describe('l5-dan-ga (Bức 4)', () => {
  it.each(['webgpu', 'webgl2'])('%s: compute khởi tạo và compute bước của bể thóc dịch được; bước đọc mảng mỏ 10 phần tử (vec4)', (backend) => {
    const built = build({ tier: backend });
    const init = built.ctx.renderer.compute.mock.calls[0][0];
    const { code, problems } = compileCompute(stepNode(built), backend);
    expect(problems).toEqual([]);
    expect(code).toMatch(BEAK_ARRAY[backend]);
    expect(compileCompute(init, backend).problems).toEqual([]);
  });

  it.each(['webgpu', 'webgl2'])('%s: Sprite thoc: không ghi độ sâu, transparent, không cắt theo khung bao, count = budget.grains; màu đi qua recipe (Bản màu, Chỉ bản nét), trọng số, Tô theo luồng', (backend) => {
    const built = build({ tier: backend });
    const sprite = grains(built);
    expect(sprite).toBeInstanceOf(Sprite);
    expect([sprite.material.depthWrite, sprite.material.transparent, sprite.frustumCulled]).toEqual([false, true, false]);
    expect(sprite.count).toBe(built.ctx.budget.grains);
    const { problems, uniforms } = compileMaterial(sprite, built.ctx, backend);
    expect(problems).toEqual([]);
    expect(uniforms).toEqual(expect.arrayContaining(['w_dan_ga', 'w_ban_mau', 'banNetChiNet', 'danGaLane', 'cotPixel']));
  });

  it('update(0, t) (khung đứng yên của ?freeze) không tiến mô phỏng: không compute, không rắc; khung có dt thì có', () => {
    const built = build();
    const { compute } = built.ctx.renderer;
    frame(built, 1, 1 / 60); // khung đầu: nhúm lúc mở trang
    compute.mockClear();
    const rac = read(built, 'rac');
    frame(built, 1, 0, [tapAt(built, [-4.5, 2.5])]);
    frame(built, 1, 0);
    expect(compute).not.toHaveBeenCalled();
    expect(read(built, 'rac')).toBe(rac);
    frame(built, 1 + 1 / 60, 1 / 60);
    expect(compute).toHaveBeenCalledTimes(1);
    expect(read(built, 'rac'), 'nắm của cú chạm rắc ở khung có dt').toBe(rac + 120);
  });

  it('trọng số Đàn gà về 0: không compute, cú chạm không rắc, nắm đang chờ bị bỏ; phủ lại thì không có nắm cũ bung ra; Sprite ẩn', () => {
    const built = build();
    const { compute } = built.ctx.renderer;
    frame(built, 1, 1 / 60);
    expect(read(built, 'rac'), 'nhúm lúc mở trang').toBe(40);
    // Hai cú chạm trong một khung: bể rắc một nắm mỗi bước, nắm kia chờ bước sau.
    frame(built, 1.5, 1 / 60, [tapAt(built, [-4.5, 2.5]), tapAt(built, [4.5, 2.5])]);
    expect(read(built, 'rac')).toBe(160);
    built.ctx.weights.set('dan-ga', 0);
    compute.mockClear();
    frame(built, 1.6, 1 / 60, [tapAt(built, [0, 3.8])]);
    frame(built, 1.7, 1 / 60, [tapAt(built, [-2.5, 3.5])]);
    expect(compute).not.toHaveBeenCalled();
    expect(grains(built).visible).toBe(false);
    built.ctx.weights.set('dan-ga', 1);
    for (let k = 0; k < 5; k += 1) frame(built, 1.8 + k / 60, 1 / 60);
    expect(compute).toHaveBeenCalled();
    expect(grains(built).visible).toBe(true);
    expect(read(built, 'rac'), 'không nắm nào bung ra khi phủ lại').toBe(160);
  });

  it('số đo rac, dangAn, quanhMe trả số; thí nghiệm Tô theo luồng chỉ đổi uniform; nấc thoc hạ trần số hạt về nửa rồi gỡ về như cũ', async () => {
    const built = build();
    frame(built, 1, 1 / 60);
    for (const id of ['rac', 'dangAn', 'quanhMe']) expect(typeof read(built, id), id).toBe('number');
    expect(read(built, 'quanhMe'), 'con trèo lưng và con nấp bụng').toBe(2);
    const layer = built.layers['dan-ga'];
    const sprite = grains(built);
    const exp = layer.experiments.find((e) => e.id === 'toTheoLuong');
    const lane = compileMaterial(sprite, built.ctx, 'webgpu').uniformNodes.danGaLane;
    const version = sprite.material.version;
    await exp.toggle(true);
    expect(lane.value).toBe(1);
    await exp.toggle(false);
    expect([lane.value, sprite.material.version]).toEqual([0, version]);
    const step = layer.degrade.find((d) => d.id === 'thoc');
    step.apply();
    expect(sprite.count).toBe(built.ctx.budget.grains / 2);
    step.revert();
    expect(sprite.count).toBe(built.ctx.budget.grains);
  });

  it.each([['webgpu'], ['webgl2']])('%s: núm ở hai đầu (gravity cả hai lựa chọn, bounce 0 và 0,8) dịch được; handful 300 khi count 100 thì nắm bị cắt còn 100', async (backend) => {
    for (const [gravity, bounce] of [['traiDat', 0], ['trang', 0.8]]) {
      const built = build({ tier: backend });
      await built.knobs['dan-ga'].set('gravity', gravity);
      await built.knobs['dan-ga'].set('bounce', bounce);
      expect(compileCompute(stepNode(built), backend).problems, `${gravity}, ${bounce}`).toEqual([]);
    }
    const built = build({ tier: backend });
    await built.knobs['dan-ga'].set('count', 100);
    await built.knobs['dan-ga'].set('handful', 300);
    expect(grains(built).count).toBe(100);
    frame(built, 1, 1 / 60, [tapAt(built, [-4.5, 2.5])]);
    frame(built, 1 + 1 / 60, 1 / 60);
    expect(read(built, 'rac'), 'nhúm 40 hạt rồi nắm 300 hạt cắt còn 100: không quá số đang tính').toBe(100);
  });

  it('Cốt áp dáng (shared.cot.pose): trọng số 1 là dáng của đàn gà, 0 là dáng nghỉ ở nhà; hướng hòa theo đường ngắn nhất; gà mẹ bốn uniform nhân trọng số', () => {
    const built = build();
    const { cot } = built.shared;
    const chicks = HOMES.map((h, i) => ({
      x: h.at[0] + 1, y: h.kind === 'back' ? HEN.back : 0, z: h.at[1] - 0.5, heading: i === 0 ? h.heading + Math.PI + 0.2 : h.heading + 0.4, head: 0.8,
    }));
    const state = { chicks, hen: { wing: 1, nod: 0.5, look: 0.2, scratch: 0.6 } };
    const pose = cot.chicks.pose.array;
    const head = cot.chicks.head.array;
    const version = cot.chicks.pose.version;
    cot.pose(state, 1);
    expect(cot.chicks.pose.version).toBeGreaterThan(version);
    HOMES.forEach((h, i) => {
      expect(pose[i * 4]).toBeCloseTo(h.at[0] + 1, 6);
      expect(pose[i * 4 + 2]).toBeCloseTo(h.at[1] - 0.5, 6);
      expect(head[i]).toBeCloseTo(0.8, 6);
    });
    expect(['wing', 'nod', 'look', 'scratch'].map((k) => cot.hen[k].value)).toEqual([1, 0.5, 0.2, 0.6].map((v) => expect.closeTo(v, 6)));
    cot.pose(state, 0.5);
    expect(pose[0]).toBeCloseTo(HOMES[0].at[0] + 0.5, 6);
    // Con 0 cần quay π + 0,2 theo chiều dương, tức π − 0,2 theo chiều âm: đường ngắn nhất là chiều âm, nửa đường là −(π − 0,2)/2
    // (hòa thẳng hai số thì ra +(π + 0,2)/2: quay vòng xa).
    expect(pose[3] - HOMES[0].heading).toBeCloseTo(-(Math.PI - 0.2) / 2, 6);
    expect(cot.hen.wing.value).toBeCloseTo(0.5, 6);
    cot.pose(state, 0);
    HOMES.forEach((h, i) => {
      expect([...pose.slice(i * 4, i * 4 + 4)]).toEqual([h.at[0], h.kind === 'back' ? HEN.back : 0, h.at[1], h.heading].map((v) => expect.closeTo(v, 6)));
      expect(head[i]).toBe(0);
    });
    expect(['wing', 'nod', 'look', 'scratch'].map((k) => cot.hen[k].value)).toEqual([0, 0, 0, 0]);
  });

  it('mỗi khung lớp áp dáng của đàn gà vào Cốt: lúc mở trang có con đang mổ nhúm thóc (đầu cúi), trọng số 0 thì về dáng nghỉ', () => {
    const built = build();
    const head = built.shared.cot.chicks.head.array;
    let bowed = 0;
    for (let t = 2; t < 2.45; t += 0.05) { // hơn một nhịp cúi (0,4 giây)
      frame(built, t, 0.05);
      bowed = Math.max(bowed, ...head);
    }
    expect(bowed, 'có con cúi đầu mổ').toBeGreaterThan(0.85);
    expect(read(built, 'dangAn')).toBeGreaterThanOrEqual(2);
    built.ctx.weights.set('dan-ga', 0);
    frame(built, 2.5, 1 / 60);
    expect(Math.max(...head)).toBe(0);
  });
});
