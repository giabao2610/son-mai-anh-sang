// tests/unit/studio.test.js — bàn thợ: API duy nhất mà Sổ tay và __sma thấy (trọng số, núm, thí nghiệm, số đo, snapshot).
import { describe, it, expect, vi } from 'vitest';
import { buildLayers, createWeights } from '../../src/engine/gpu/layers.js';
import { createStudio } from '../../src/engine/gpu/studio.js';

const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }] };

/** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm và số đo. */
function setup({ tier = 'webgl2' } = {}) {
  const log = [];
  const cot = {
    id: 'cot',
    knobs: [
      { id: 'openness', min: 0, max: 1, step: 0.01, value: 0.5 },
      { id: 'count', via: 'rebuild', min: 10, max: { webgpu: 2000, webgl2: 500 }, value: 100 },
    ],
    createLayer: () => ({
      onKnob: { count: vi.fn(async (v) => { log.push(`count=${v}`); }) },
      dispose() {},
    }),
  };
  const two = {
    id: 'lop-hai',
    knobs: [{ id: 'tone', kind: 'select', options: ['none', 'agx'], value: 'agx' }],
    createLayer: () => ({
      experiments: [{ id: 'pha', toggle: vi.fn((on) => { log.push(`pha=${on}`); }) }],
      readouts: [{ id: 'dinh', get: () => 42, unit: 'đỉnh' }, { id: 'ten', get: () => 'x' }],
      dispose() {},
    }),
  };
  const weights = createWeights(meta.layers);
  const layers = buildLayers([cot, two], {}, {}, { ...env, tier });
  const redraw = vi.fn();
  const studio = createStudio({ meta, layers, weights, tier, redraw, tweenSeconds: 0.5 });
  return { studio, weights, layers, redraw, log };
}

describe('createStudio', () => {
  it('layers(): khai báo tĩnh theo thứ tự phủ, trần núm đã tính theo tầng', () => {
    const { studio } = setup();
    const [cot, two] = studio.layers();
    expect(cot).toMatchObject({ id: 'cot', name: 'Cốt', experiments: [], readouts: [] });
    expect(cot.knobs).toEqual([
      { id: 'openness', kind: 'number', via: 'uniform', min: 0, max: 1, step: 0.01, options: undefined },
      { id: 'count', kind: 'number', via: 'rebuild', min: 10, max: 500, step: undefined, options: undefined },
    ]);
    expect(setup({ tier: 'webgpu' }).studio.layers()[0].knobs[1].max).toBe(2000);
    expect(two).toMatchObject({ experiments: [{ id: 'pha', kind: 'toggle' }], readouts: [{ id: 'dinh', unit: 'đỉnh' }, { id: 'ten', unit: '' }] });
  });

  it('setWeight: mặc định đặt ngay rồi vẽ lại; tween: true thì chỉ đặt đích (vòng lặp tiến dần)', async () => {
    const { studio, weights, redraw } = setup();
    await studio.setWeight('lop-hai', 0);
    expect(studio.weight('lop-hai')).toEqual({ value: 0, target: 0 });
    expect(redraw).toHaveBeenCalledTimes(1);
    studio.setWeight('lop-hai', 1, { tween: true });
    expect(studio.weight('lop-hai')).toEqual({ value: 0, target: 1 });
    weights.step(0.25);
    expect(studio.weight('lop-hai').value).toBeCloseTo(0.5, 6); // tweenSeconds 0.5 → nửa đường
    expect(redraw).toHaveBeenCalledTimes(1);
    await expect(studio.setWeight('khong-co', 1)).rejects.toThrow('Không có lớp "khong-co"');
  });

  it('setKnob: núm uniform đổi ngay; núm rebuild chờ onKnob; luôn vẽ lại sau khi xong', async () => {
    const { studio, layers, redraw, log } = setup();
    await studio.setKnob('cot', 'openness', 0.9);
    expect(layers[0].knobs.knob('openness').value).toBe(0.9);
    await studio.setKnob('cot', 'count', 9999);
    expect(log).toEqual(['count=500']); // kẹp theo trần của WebGL2
    expect(studio.knobs('cot')).toEqual({ openness: 0.9, count: 500 });
    expect(redraw).toHaveBeenCalledTimes(2);
    await expect(studio.setKnob('cot', 'khong-co', 1)).rejects.toThrow('Lớp "cot" không có núm "khong-co"');
    expect(redraw).toHaveBeenCalledTimes(3);
  });

  it('thí nghiệm: toggle gọi lớp, nhớ trạng thái bật/tắt; id lạ thì ném lỗi', async () => {
    const { studio, log } = setup();
    expect(studio.experiment('lop-hai', 'pha')).toBe(false);
    await studio.toggleExperiment('lop-hai', 'pha', true);
    expect(studio.experiment('lop-hai', 'pha')).toBe(true);
    await studio.toggleExperiment('lop-hai', 'pha', false);
    expect(studio.experiment('lop-hai', 'pha')).toBe(false);
    expect(log).toEqual(['pha=true', 'pha=false']);
    expect(() => studio.experiment('lop-hai', 'khac')).toThrow('Lớp "lop-hai" không có thí nghiệm "khac"');
  });

  it('readouts đọc ngay lúc gọi; stats: draw call, tam giác, ms giữa hai khung (trung bình trượt)', () => {
    const { studio } = setup();
    expect(studio.readouts('lop-hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }, { id: 'ten', value: 'x', unit: '' }]);
    const info = { render: { drawCalls: 21, triangles: 90000 } };
    studio.measure(info, 1000);
    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0 });
    studio.measure(info, 1016);
    expect(studio.stats().ms).toBe(16);
    studio.measure(info, 1052);
    expect(studio.stats().ms).toBeCloseTo(16 * 0.9 + 36 * 0.1, 6);
  });

  it('snapshot → JSON gọn: trọng số lấy ĐÍCH của tween, núm theo địa chỉ "layerId.knobId"', () => {
    const { studio } = setup();
    studio.setWeight('lop-hai', 0, { tween: true });
    const snap = studio.snapshot();
    expect(snap).toEqual({ weights: { cot: 1, 'lop-hai': 0 }, knobs: { 'cot.openness': 0.5, 'cot.count': 100, 'lop-hai.tone': 'agx' } });
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });

  it('restore: trọng số đặt ngay; chỉ set núm khác giá trị hiện tại; id lạ thì bỏ qua kèm cảnh báo', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { studio, layers, redraw, log } = setup();
    await studio.restore({
      weights: { 'lop-hai': 0.25, 'da-xoa': 1 },
      knobs: { 'cot.openness': 0.5, 'cot.count': 300, 'lop-hai.tone': 'none', 'cot.da-xoa': 1, 'khong-co.x': 1 },
    });
    expect(studio.weight('lop-hai')).toEqual({ value: 0.25, target: 0.25 });
    expect(log).toEqual(['count=300']); // openness không đổi nên không set lại
    expect(layers[1].knobs.knob('tone').value).toBe(0);
    expect(warn.mock.calls.map((c) => c[0])).toEqual([
      'restore: bỏ qua trọng số của lớp lạ "da-xoa"', 'restore: bỏ qua núm lạ "cot.da-xoa"', 'restore: bỏ qua núm lạ "khong-co.x"',
    ]);
    expect(redraw).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('restore(snapshot()) của một bàn thợ khác cho lại đúng trạng thái', async () => {
    const a = setup().studio;
    await a.setWeight('lop-hai', 0);
    await a.setKnob('cot', 'count', 250);
    await a.setKnob('lop-hai', 'tone', 'none');
    const b = setup().studio;
    await b.restore(a.snapshot());
    expect(b.snapshot()).toEqual(a.snapshot());
  });
});
