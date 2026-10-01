// tests/paintings/ao-sen-dem/vang-la.test.js — Lớp 5 · Vàng lá (bản đơn giản): compute trên GPU, một Sprite, hút/đẩy theo cử chỉ.
import { describe, it, expect } from 'vitest';
import { AdditiveBlending, NormalBlending } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { knobMax } from '../../../src/engine/gpu/knob-set.js';

const build = (options) => buildPainting(painting, meta, { until: 'vang-la', ...options });

describe('l5-vang-la', () => {
  it('núm tĩnh: size, glow, attraction, flowScale, speed, blinkRate (uniform) và count (js, trần theo tầng)', () => {
    expect(vangLa.id).toBe('vang-la');
    expect(vangLa.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['size', 'uniform'], ['glow', 'uniform'], ['attraction', 'uniform'], ['flowScale', 'uniform'], ['speed', 'uniform'],
      ['blinkRate', 'uniform'], ['count', 'js'],
    ]);
    // Trần theo tầng VÀ theo mức: máy yếu không bị kéo quá sức.
    const count = vangLa.knobs.find((k) => k.id === 'count');
    const max = (tier, level) => knobMax(count, { tier, level });
    expect([max('webgpu', 'cao'), max('webgpu', 'vua'), max('webgl2', 'vua'), max('webgl2', 'thap')]).toEqual([200000, 50000, 20000, 10000]);
  });

  it('kernel khởi tạo chạy lúc dựng trên CẢ bộ đệm (trần của tầng); WebGL2 chạy hai lần; mỗi update chạy kernel bước', () => {
    const { ctx, layers } = build();
    const calls = ctx.renderer.compute.mock.calls;
    expect(calls).toHaveLength(1);
    expect([calls[0][0].isComputeNode, calls[0][0].count]).toEqual([true, 200000]);
    // WebGL2: transform feedback giữ HAI bản của mỗi bộ đệm (đọc/ghi, đổi vai sau mỗi lần chạy): khởi tạo cả hai,
    // để tăng count lúc chạy thì con mới không xuất phát cùng một chỗ (0, 0, 0) từ bản chưa từng được ghi.
    const gl = build({ tier: 'webgl2' }).ctx.renderer.compute.mock.calls;
    expect(gl.map(([node]) => node.count)).toEqual([20000, 20000]);
    expect(gl[1][0]).toBe(gl[0][0]);
    layers['vang-la'].update(1 / 60, 1 / 60);
    layers['vang-la'].update(1 / 60, 2 / 60);
    expect(calls).toHaveLength(3);
    expect(calls[1][0]).not.toBe(calls[0][0]);
    expect(calls[2][0]).toBe(calls[1][0]);
  });

  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, không nhận sương (tự mờ đi), có emissiveNode; số con theo mức', () => {
    const [sprite] = build().layers['vang-la'].objects;
    expect(sprite.isSprite).toBe(true);
    expect(sprite.count).toBe(3000);
    expect(sprite.frustumCulled).toBe(false);
    expect(sprite.material.blending).toBe(AdditiveBlending);
    expect(sprite.material.depthWrite).toBe(false);
    expect(sprite.material.fog).toBe(false);
    expect(sprite.material.emissiveNode).toBeTruthy();
    expect(build({ level: 'thap' }).layers['vang-la'].objects[0].count).toBe(600);
    expect(build({ budget: { fireflies: 700 } }).layers['vang-la'].objects[0].count).toBe(700);
    // Núm count không xuống dưới 100: sprite có count > 1 nằm trong cache key, về 1 là phải biên dịch lại.
    expect(build({ budget: { fireflies: 7 } }).layers['vang-la'].objects[0].count).toBe(100);
  });

  it('núm count: chỉ đổi số con được tính (kernel bước) và được vẽ (sprite), không tạo bộ đệm mới', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['vang-la'];
    layer.update(1 / 60, 1 / 60);
    const step = ctx.renderer.compute.mock.calls[1][0];
    expect(step.count).toBe(3000);
    knobs['vang-la'].set('count', 50000);
    expect([step.count, layer.objects[0].count]).toEqual([50000, 50000]);
    layer.update(1 / 60, 2 / 60);
    expect(ctx.renderer.compute.mock.calls[2][0]).toBe(step);
  });

  it('trọng số 0: không chạy compute và giấu sprite (không tốn draw call); bật lại thì tính tiếp', () => {
    const { ctx, layers } = build();
    const layer = layers['vang-la'];
    const [sprite] = layer.objects;
    const calls = ctx.renderer.compute.mock.calls;
    ctx.weights.set('vang-la', 0);
    layer.update(1 / 60, 1 / 60);
    expect([calls.length, sprite.visible]).toEqual([1, false]);
    ctx.weights.set('vang-la', 0.5);
    layer.update(1 / 60, 2 / 60);
    expect([calls.length, sprite.visible]).toEqual([2, true]);
  });

  it('vẽ lại khung đứng yên (update(0, t), GĐ 4): không chạy compute, không bước đàn CPU; sprite vẫn theo trọng số', async () => {
    const { ctx, layers } = build();
    const layer = layers['vang-la'];
    const [sprite] = layer.objects;
    const computes = () => ctx.renderer.compute.mock.calls.length;
    const before = computes();
    layer.update(0, 1);
    expect(computes()).toBe(before);
    ctx.weights.set('vang-la', 0);
    layer.update(0, 1);
    expect(sprite.visible).toBe(false);
    ctx.weights.set('vang-la', 1);
    const cpu = layer.experiments.find((e) => e.id === 'cpu');
    await cpu.toggle(true);
    const [, cpuSprite] = layer.objects;
    // Đàn CPU ghi vị trí vào một thuộc tính instance (material.positionNode = cell.xyz): mỗi bước tăng version của nó.
    const attr = cpuSprite.material.positionNode.node.value;
    const version = attr.version;
    layer.update(0, 1);
    expect([attr.version, computes()]).toEqual([version, before]);
    expect([sprite.visible, cpuSprite.visible]).toEqual([false, true]);
    layer.update(1 / 60, 1);
    expect(attr.version).toBeGreaterThan(version);
  });

  it("nấc 'dom-dom': trần = nửa số mặc định của mức; hiệu lực = min(núm, trần); số đo đọc theo", () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['vang-la'];
    const [step] = layer.degrade;
    const count = () => layer.readouts.find((r) => r.id === 'count').get();
    layer.update(1 / 60, 1 / 60);
    const kernel = ctx.renderer.compute.mock.calls[1][0];
    expect(step.id).toBe('dom-dom');
    step.apply();
    expect([count(), kernel.count]).toEqual([1500, 1500]);
    knobs['vang-la'].set('count', 50000); // người xem kéo núm lên: trần vẫn giữ
    expect(count()).toBe(1500);
    knobs['vang-la'].set('count', 800); // núm dưới trần: theo núm
    expect(count()).toBe(800);
    step.revert();
    knobs['vang-la'].set('count', 50000);
    expect([count(), kernel.count]).toEqual([50000, 50000]);
    const low = build({ level: 'thap' }).layers['vang-la'];
    low.degrade[0].apply();
    expect(low.readouts[0].get()).toBe(300);
  });

  it('"Tắt additive": blending thường rồi trả lại, báo cần biên dịch lại một lần', () => {
    const layer = build().layers['vang-la'];
    const [sprite] = layer.objects;
    const exp = layer.experiments.find((e) => e.id === 'noAdditive');
    const version = sprite.material.version;
    exp.toggle(true);
    expect(sprite.material.blending).toBe(NormalBlending);
    expect(sprite.material.version).toBeGreaterThan(version);
    exp.toggle(false);
    expect(sprite.material.blending).toBe(AdditiveBlending);
  });

  it('"CPU vs GPU" (compare): lần bật đầu dựng đàn CPU (một Sprite thứ hai, giữ lại); bật thì JS tính thay compute, tối đa 5.000 con', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['vang-la'];
    const exp = layer.experiments.find((e) => e.id === 'cpu');
    expect(exp.kind).toBe('compare');
    const count = () => layer.readouts.find((r) => r.id === 'count').get();
    const children = ctx.scene.children.length;
    exp.toggle(true);
    expect(ctx.scene.children).toHaveLength(children + 1);
    const [gpuSprite, cpuSprite] = layer.objects;
    expect([gpuSprite.visible, cpuSprite.visible]).toEqual([false, true]);
    const computes = ctx.renderer.compute.mock.calls.length;
    layer.update(1 / 60, 1 / 60);
    expect(ctx.renderer.compute.mock.calls).toHaveLength(computes); // CPU tính: không gọi compute
    knobs['vang-la'].set('count', 50000);
    expect(count()).toBe(5000);
    exp.toggle(false);
    expect([gpuSprite.visible, cpuSprite.visible, count()]).toEqual([true, false, 50000]);
    layer.update(1 / 60, 2 / 60);
    expect(ctx.renderer.compute.mock.calls).toHaveLength(computes + 1);
    exp.toggle(true); // bật lại: dùng lại đàn CPU cũ, không dựng thêm
    expect(ctx.scene.children).toHaveLength(children + 1);
    layer.dispose();
    expect(ctx.scene.children).toHaveLength(children - 1);
  });

  it('dispose gỡ sprite (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const [sprite] = layers['vang-la'].objects;
    layers['vang-la'].dispose();
    layers['vang-la'].dispose();
    expect(sprite.parent).toBeNull();
    expect(ctx.scene.children).not.toContain(sprite);
  });
});
