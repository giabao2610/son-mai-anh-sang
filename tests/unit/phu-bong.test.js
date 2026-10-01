// tests/unit/phu-bong.test.js — lớp dùng chung Phủ bóng: chặng build (bloom, tone, tap), chặng display (LUT, grain, vignette, FXAA), nấc.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { Scene, PerspectiveCamera } from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import * as phuBong from '../../src/engine/stock/phu-bong/layer.js';
import phuBongMeta from '../../src/engine/stock/phu-bong/meta.js';
import { createKnobs } from '../../src/engine/gpu/knob-set.js';
import { PALETTE } from '../../src/engine/palette.js';

// Bọc bloom() thật để xem lớp gọi nó với tham số nào (vẫn dựng BloomNode thật).
const created = vi.hoisted(() => []);
vi.mock('three/addons/tsl/display/BloomNode.js', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    bloom: (...args) => {
      const node = mod.bloom(...args);
      created.push({ args, node });
      return node;
    },
  };
});

const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };

function makeCtx(budget = {}) {
  const knobs = createKnobs(phuBong.id, phuBong.knobs, env);
  return { budget, knob: vi.fn(knobs.knob), knobs, palette: { hex: PALETTE }, u: { time: uniform(0) } };
}

function buildOnce(ctx) {
  const layer = phuBong.createLayer(ctx);
  const scenePass = pass(new Scene(), new PerspectiveCamera());
  const channel = vi.fn((name) => scenePass.getTextureNode(name));
  const taps = [];
  const out = layer.post.build({
    color: scenePass.getTextureNode('output'), channel, weight: uniform(1), tap: (id, node) => taps.push([id, node]),
  });
  return { layer, channel, out, taps, scenePass, glow: created.at(-1) };
}

describe('engine/stock/phu-bong/meta.js', () => {
  it('căn cước của lớp dùng chung: file đầu là layer.js (hiện trước trong Sổ tay), rồi hai file của chặng display', () => {
    expect(phuBongMeta).toEqual({
      id: 'phu-bong',
      name: 'Phủ bóng',
      files: ['engine/stock/phu-bong/layer.js', 'engine/stock/phu-bong/display.js', 'engine/stock/phu-bong/lut.js'],
    });
    expect(phuBongMeta.id).toBe(phuBong.id);
  });
});

describe('engine/stock/phu-bong/layer.js', () => {
  it('knobs tĩnh: núm của chặng build và (GĐ 4) chặng display, tất cả là uniform; tone mapping là select none/agx/aces', () => {
    expect(phuBong.id).toBe('phu-bong');
    expect(phuBong.knobs.map((k) => k.id)).toEqual([
      'bloomStrength', 'bloomRadius', 'bloomThreshold', 'toneMapping', 'exposure', 'lutIntensity', 'grain', 'vignette',
    ]);
    const range = (id) => { const k = phuBong.knobs.find((x) => x.id === id); return [k.min, k.max]; };
    expect([range('lutIntensity'), range('grain'), range('vignette')]).toEqual([[0, 1], [0, 0.15], [0, 1]]);
    for (const k of phuBong.knobs) expect(k.via ?? 'uniform').toBe('uniform');
    const tone = phuBong.knobs.find((k) => k.id === 'toneMapping');
    expect([tone.kind, tone.options, tone.value]).toEqual(['select', ['none', 'agx', 'aces'], 'agx']);
  });

  it('có đủ hai chặng: build (HDR) và display (màu hiển thị: LUT, grain, vignette, FXAA)', () => {
    const ctx = makeCtx();
    const { layer, scenePass } = buildOnce(ctx);
    const shown = layer.post.display({ color: scenePass.getTextureNode('output'), channel: () => null, weight: uniform(1) });
    expect(shown.isNode).toBe(true);
    for (const id of ['lutIntensity', 'grain', 'vignette']) expect(ctx.knob).toHaveBeenCalledWith(id);
    layer.dispose();
  });

  it('tap (GĐ 4): chụp "truoc-bloom" (màu cảnh) rồi "truoc-tone" (màu + bloom), là biểu thức thuần, theo thứ tự pipeline', () => {
    const { taps, scenePass } = buildOnce(makeCtx());
    expect(taps.map(([id]) => id)).toEqual(['truoc-bloom', 'truoc-tone']);
    expect(taps[0][1]).toBe(scenePass.getTextureNode('output'));
    expect(taps[1][1].isNode).toBe(true);
  });

  it('build dựng node từ texture của một pass thật; bloom nhận ĐÚNG uniform của ba núm bloom', () => {
    const ctx = makeCtx();
    const { out, channel, glow, layer } = buildOnce(ctx);
    expect(out.isNode).toBe(true);
    expect(channel).toHaveBeenCalledWith('emissive');
    for (const id of ['bloomStrength', 'bloomRadius', 'bloomThreshold', 'toneMapping', 'exposure']) {
      expect(ctx.knob).toHaveBeenCalledWith(id);
    }
    expect(glow.args.slice(1)).toEqual([
      ctx.knobs.uniforms.bloomStrength, ctx.knobs.uniforms.bloomRadius, ctx.knobs.uniforms.bloomThreshold,
    ]);
    // BloomNode dùng thẳng node được truyền vào (không bọc uniform mới): kéo núm là đổi bloom.
    expect(glow.node.strength).toBe(ctx.knobs.uniforms.bloomStrength);
    expect(glow.node.radius).toBe(ctx.knobs.uniforms.bloomRadius);
    expect(glow.node.threshold).toBe(ctx.knobs.uniforms.bloomThreshold);
    expect(glow.node.getResolutionScale()).toBe(0.5);
    layer.dispose();
  });

  it("thí nghiệm 'wholeFrame': bloom đọc cả ảnh màu thay vì chỉ emissive (một uniform, không biên dịch lại)", () => {
    const ctx = makeCtx();
    const { channel, layer } = buildOnce(ctx);
    expect(channel).toHaveBeenCalledWith('output');
    const [exp, noFxaa] = layer.experiments;
    expect(exp.id).toBe('wholeFrame');
    expect(() => { exp.toggle(true); exp.toggle(false); }).not.toThrow();
    expect(noFxaa.id).toBe('noFxaa'); // GĐ 4: "Tắt FXAA", một uniform
    expect(() => { noFxaa.toggle(true); noFxaa.toggle(false); }).not.toThrow();
    layer.dispose();
  });

  it('bloom chạy ở ctx.budget.bloom nếu bức đặt', () => {
    const { glow, layer } = buildOnce(makeCtx({ bloom: 0.25 }));
    expect(glow.node.getResolutionScale()).toBe(0.25);
    layer.dispose();
  });

  it("nấc 'bloom': chia đôi độ phân giải của bloom rồi trả lại; số đo đọc theo; áp được cả trước khi dựng pipeline", () => {
    const { glow, layer } = buildOnce(makeCtx({ bloom: 0.5 }));
    const [step] = layer.degrade;
    const scale = () => layer.readouts.find((r) => r.id === 'bloomScale').get();
    expect(step.id).toBe('bloom');
    step.apply();
    expect([glow.node.getResolutionScale(), scale()]).toEqual([0.25, 0.25]);
    step.revert();
    expect([glow.node.getResolutionScale(), scale()]).toEqual([0.5, 0.5]);
    const early = phuBong.createLayer(makeCtx({ bloom: 0.25 }));
    early.degrade[0].apply();
    expect(early.readouts[0].get()).toBe(0.125);
    layer.dispose();
  });

  it('dispose gỡ bloom; gọi hai lần (hoặc trước build) vẫn an toàn', () => {
    expect(() => {
      const fresh = phuBong.createLayer(makeCtx());
      fresh.dispose();
      fresh.dispose();
    }).not.toThrow();
    const { glow, layer } = buildOnce(makeCtx());
    const spy = vi.spyOn(glow.node, 'dispose');
    layer.dispose();
    layer.dispose();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('mỗi núm có marker // @knob trong file của lớp', () => {
    const source = readFileSync(new URL('../../src/engine/stock/phu-bong/layer.js', import.meta.url), 'utf8');
    const markers = new Set([...source.matchAll(/\/\/\s*@knob\s+(\w+)/g)].map((m) => m[1]));
    expect([...markers].sort()).toEqual(phuBong.knobs.map((k) => k.id).sort());
  });
});
