// tests/unit/studio.test.js — bàn thợ: API duy nhất mà Sổ tay và __sma thấy (trọng số, núm, thí nghiệm, số đo, snapshot).
import { describe, it, expect, vi } from 'vitest';
import { buildLayers, createWeights } from '../../src/engine/gpu/layers.js';
import { createStudio } from '../../src/engine/gpu/studio.js';
import { createDialSet } from '../../src/engine/gpu/dial-set.js';
import { uniform } from 'three/tsl';

const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }] };

/** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm (một kiểu compare) và số đo. */
function setup({ tier = 'webgl2', quality, toolbox, dials, translator } = {}) {
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
      experiments: [
        { id: 'pha', toggle: vi.fn((on) => { log.push(`pha=${on}`); }) },
        { id: 'so', kind: 'compare', toggle: vi.fn() },
      ],
      readouts: [{ id: 'dinh', get: () => 42, unit: 'đỉnh' }, { id: 'ten', get: () => 'x' }],
      dispose() {},
    }),
  };
  const weights = createWeights(meta.layers);
  const layers = buildLayers([cot, two], {}, {}, { ...env, tier });
  const redraw = vi.fn();
  const studio = createStudio({
    meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality, toolbox, dials, translator,
  });
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
    expect(two).toMatchObject({
      experiments: [{ id: 'pha', kind: 'toggle' }, { id: 'so', kind: 'compare' }],
      readouts: [{ id: 'dinh', unit: 'đỉnh' }, { id: 'ten', unit: '' }],
    });
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

  it('readouts đọc ngay lúc gọi; stats: draw call, tam giác, ms giữa hai khung và ms CPU (trung bình trượt)', () => {
    const { studio } = setup();
    expect(studio.readouts('lop-hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }, { id: 'ten', value: 'x', unit: '' }]);
    const info = { render: { drawCalls: 21, triangles: 90000 } };
    studio.measure(info, 1000, 4);
    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0, cpuMs: 4, gpuMs: null });
    studio.measure(info, 1016, 4);
    expect(studio.stats().ms).toBe(16);
    studio.measure(info, 1052, 14);
    expect(studio.stats().ms).toBeCloseTo(16 * 0.9 + 36 * 0.1, 6);
    expect(studio.stats().cpuMs).toBeCloseTo(4 * 0.9 + 14 * 0.1, 6);
  });

  it("compare: số đo tách theo trạng thái của thí nghiệm; bỏ 0,25 s đầu sau mỗi lần đổi; thí nghiệm thường thì null", async () => {
    const { studio } = setup();
    const info = { render: { drawCalls: 1, triangles: 1 } };
    let t = 0;
    const frames = (n, gap, cpu) => {
      for (let i = 0; i < n; i++) studio.measure(info, (t += gap), cpu);
    };
    expect(studio.compare('lop-hai', 'so')).toEqual({ off: null, on: null });
    frames(10, 16, 2); // 160 ms đầu: còn trong khoảng bỏ qua
    expect(studio.compare('lop-hai', 'so').off).toBeNull();
    frames(20, 16, 2);
    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 2, gpuMs: null });
    await studio.toggleExperiment('lop-hai', 'so', true);
    frames(7, 33, 9); // vừa bật: 231 ms đầu vẫn bị bỏ qua
    expect(studio.compare('lop-hai', 'so').on).toBeNull();
    frames(20, 33, 9);
    expect(studio.compare('lop-hai', 'so')).toEqual({ off: { ms: 16, cpuMs: 2, gpuMs: null }, on: { ms: 33, cpuMs: 9, gpuMs: null } });
    expect(studio.compare('lop-hai', 'pha')).toEqual({ off: null, on: null });
    expect(() => studio.compare('lop-hai', 'khac')).toThrow('Lớp "lop-hai" không có thí nghiệm "khac"');
  });

  it('ms GPU (GĐ 4): null tới khi có mẫu; compare ghi vào bên đang đo, bỏ mẫu về trong 0,25 s sau lần đổi', async () => {
    const { studio } = setup();
    const info = { render: { drawCalls: 1, triangles: 1 } };
    let t = 0;
    const frames = (n, gap, gpu) => {
      for (let i = 0; i < n; i++) {
        studio.measure(info, (t += gap), 1);
        if (gpu !== undefined && i % 4 === 0) studio.gpu(gpu); // mẫu GPU về thưa hơn khung
      }
    };
    expect(studio.stats().gpuMs).toBeNull();
    frames(30, 16, 5);
    expect(studio.stats().gpuMs).toBe(5);
    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 1, gpuMs: 5 });
    await studio.toggleExperiment('lop-hai', 'so', true);
    studio.measure(info, (t += 16), 1); // khung đầu sau lần đổi đặt mốc bỏ qua
    studio.gpu(40); // mẫu của khung TRƯỚC lúc đổi, về muộn: không ghi vào bên "Bật"
    frames(20, 16, 12);
    const { off, on } = studio.compare('lop-hai', 'so');
    expect(off.gpuMs).toBe(5);
    expect(on.gpuMs).toBeCloseTo(12, 6);
    expect(studio.stats().gpuMs).toBeGreaterThan(5);
    studio.gpu(null); // đo GPU hỏng giữa phiên (gpu-timer thôi đo): Sổ tay về "—", cột so sánh giữ số đã đo
    expect(studio.stats().gpuMs).toBeNull();
    expect(studio.compare('lop-hai', 'so').on.gpuMs).toBeCloseTo(12, 6);
  });

  it('nấc: quality() đọc bộ điều chỉnh; degrade()/upgrade() hạ/nâng tay một nấc rồi vẽ lại; thiếu bộ điều chỉnh thì không có gì', async () => {
    const steps = [];
    const listeners = [];
    const quality = {
      state: () => ({ level: 'cao', steps: [...steps], guarding: false, capped: false }),
      degrade: () => (steps.length < 2 ? Boolean(steps.push(`n${steps.length}`)) : false),
      upgrade: () => Boolean(steps.pop()),
      onChange: (cb) => {
        listeners.push(cb);
        return () => {};
      },
    };
    const { studio, redraw } = setup({ quality });
    expect(await studio.degrade()).toBe(true);
    expect(await studio.degrade()).toBe(true);
    expect(await studio.degrade()).toBe(false);
    expect(studio.quality()).toEqual({ level: 'cao', steps: ['n0', 'n1'], guarding: false, capped: false });
    expect(await studio.upgrade()).toBe(true);
    expect(studio.quality().steps).toEqual(['n0']);
    expect(redraw).toHaveBeenCalledTimes(4);
    const cb = () => {};
    studio.onQuality(cb);
    expect(listeners).toEqual([cb]);
    const bare = setup().studio;
    expect(bare.quality()).toEqual({ level: null, steps: [], guarding: false, capped: false, gpu: false, locked: [] });
    expect(await bare.degrade()).toBe(false);
  });

  it('công cụ học (GĐ 4): tools() đọc hộp đồ nghề; setTool() bật/tắt rồi vẽ lại; không có hộp đồ nghề thì không có công cụ', async () => {
    let on = null;
    const toolbox = { list: () => [{ id: 'kinh', on: on === 'kinh' }], set: vi.fn((id) => { on = id; }) };
    const { studio, redraw } = setup({ toolbox });
    await studio.setTool('kinh');
    expect(studio.tools()).toEqual([{ id: 'kinh', on: true }]);
    await studio.setTool(null);
    expect(toolbox.set.mock.calls).toEqual([['kinh'], [null]]);
    expect(redraw).toHaveBeenCalledTimes(2);
    const bare = setup().studio;
    expect(bare.tools()).toEqual([]);
    await expect(bare.setTool('kinh')).rejects.toThrow('Không có công cụ "kinh"');
    await expect(bare.setTool(null)).resolves.toBeUndefined();
  });

  it('Dial (GĐ 4): dials() đọc, setDial() kẹp rồi vẽ lại; snapshot có dials (bức không có Dial thì không có khóa này); restore đem về', async () => {
    const hour = uniform(21);
    const dials = createDialSet([{ id: 'gio', uniform: hour, min: 18, max: 29.5, step: 0.25, format: (v) => `${v}h` }]);
    const { studio, redraw } = setup({ dials });
    expect(studio.dials()).toEqual([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21h', note: null }]);
    await studio.setDial('gio', 40);
    expect(hour.value).toBe(29.5);
    expect(redraw).toHaveBeenCalledTimes(1);
    const snap = studio.snapshot();
    expect(snap.dials).toEqual({ gio: 29.5 });
    hour.value = 18;
    await studio.restore(snap);
    expect(hour.value).toBe(29.5);
    expect(setup().studio.snapshot()).not.toHaveProperty('dials');
    await expect(setup().studio.setDial('gio', 20)).rejects.toThrow('Bức không có Dial "gio"');
  });

  it('Bản dịch (GĐ 9): translation(id) gọi bộ dịch; lớp lạ thì ném; cảnh không có bộ dịch thì Promise hỏng', async () => {
    const result = { language: 'wgsl', places: [] };
    const translator = { translation: vi.fn(async () => result) };
    const { studio, redraw } = setup({ translator });
    await expect(studio.translation('lop-hai')).resolves.toBe(result);
    expect(translator.translation.mock.calls).toEqual([['lop-hai']]);
    expect(() => studio.translation('khong-co')).toThrow('Không có lớp "khong-co"');
    expect(translator.translation).toHaveBeenCalledTimes(1);
    expect(redraw).not.toHaveBeenCalled(); // bàn thợ không tự vẽ lại: bộ dịch bắt khung (và vẽ lại khi ?freeze) qua móc lần vẽ
    await expect(setup().studio.translation('cot')).rejects.toThrow('Cảnh này không có bản dịch');
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

  it('núm hay thí nghiệm hỏng: Promise hỏng (Sổ tay báo), giá trị và trạng thái giữ nguyên, vẫn vẽ lại', async () => {
    const { studio, layers, redraw } = setup();
    layers[0].layer.onKnob.count.mockRejectedValueOnce(new Error('dựng lại hỏng'));
    await expect(studio.setKnob('cot', 'count', 300)).rejects.toThrow('dựng lại hỏng');
    expect(studio.knobs('cot').count).toBe(100);
    layers[1].layer.experiments[0].toggle.mockImplementationOnce(() => {
      throw new Error('thí nghiệm hỏng');
    });
    await expect(studio.toggleExperiment('lop-hai', 'pha', true)).rejects.toThrow('thí nghiệm hỏng');
    expect(studio.experiment('lop-hai', 'pha')).toBe(false);
    expect(redraw).toHaveBeenCalledTimes(2);
  });

  it('restore: núm áp không được thì cảnh báo rồi áp tiếp các núm sau (dựng lại cảnh không vì thế mà hỏng)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { studio, layers, redraw } = setup();
    layers[0].layer.onKnob.count.mockRejectedValueOnce(new Error('dựng lại hỏng'));
    await studio.restore({ knobs: { 'cot.count': 300, 'cot.openness': 'abc', 'lop-hai.tone': 'none' } });
    expect(studio.knobs('cot')).toEqual({ openness: 0.5, count: 100 });
    expect(layers[1].knobs.knob('tone').value).toBe(0);
    expect(warn.mock.calls.map((c) => c[0])).toEqual([
      'restore: núm "cot.count" áp không được, giữ giá trị cũ:', 'restore: núm "cot.openness" áp không được, giữ giá trị cũ:',
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

  describe('công thức và onChange (GĐ 9)', () => {
    const hourDials = () => createDialSet([{ id: 'gio', uniform: uniform(21), min: 18, max: 29.5, step: 0.25 }]);

    it('onChange báo đúng MỘT lần sau setWeight (cả tween), setKnob, setDial, restore; trả hàm bỏ nghe; thí nghiệm thì không', async () => {
      const { studio } = setup({ dials: hourDials() });
      const cb = vi.fn();
      const off = studio.onChange(cb);
      await studio.setWeight('lop-hai', 0.5, { tween: true });
      expect(cb).toHaveBeenCalledTimes(1);
      await studio.setWeight('lop-hai', 0.4);
      expect(cb).toHaveBeenCalledTimes(2);
      await studio.setKnob('cot', 'count', 200);
      expect(cb).toHaveBeenCalledTimes(3);
      await studio.setDial('gio', 22);
      expect(cb).toHaveBeenCalledTimes(4);
      await studio.restore({ weights: { 'lop-hai': 1 }, knobs: { 'cot.openness': 0.7 } });
      expect(cb).toHaveBeenCalledTimes(5);
      await studio.toggleExperiment('lop-hai', 'pha', true);
      expect(cb).toHaveBeenCalledTimes(5);
      off();
      await studio.setWeight('lop-hai', 0.1);
      expect(cb).toHaveBeenCalledTimes(5);
    });

    it('onChange báo cả khi núm hỏng (setKnob ném): finally, và restore báo sau khi vẽ lại', async () => {
      const { studio, redraw } = setup();
      const order = [];
      redraw.mockImplementation(() => { order.push('redraw'); });
      studio.onChange(() => order.push('change'));
      await studio.restore({ weights: { 'lop-hai': 0 } });
      expect(order).toEqual(['redraw', 'change']);
    });

    it('recipe().text rỗng ở nguyên bản, đúng chuỗi sau khi đổi; applyRecipe rồi recipe().text ra dạng chuẩn', async () => {
      const { studio } = setup({ dials: hourDials() });
      expect(studio.recipe()).toEqual({ text: '', counts: { layers: 0, knobs: 0, dials: [] } });
      await studio.setWeight('lop-hai', 0.5);
      await studio.setKnob('cot', 'openness', 0.25);
      await studio.setDial('gio', 23);
      expect(studio.recipe().text).toBe('lop-hai:0.5,cot.openness:0.25,gio:23');
      expect(studio.recipe().counts).toEqual({ layers: 1, knobs: 1, dials: ['gio'] });
      await studio.applyRecipe('gio:23.0,cot.openness:0.250,lop-hai:0.50');
      expect(studio.recipe().text).toBe('lop-hai:0.5,cot.openness:0.25,gio:23');
      await studio.applyRecipe('lop-hai:0');
      expect(studio.recipe().text).toBe('lop-hai:0');
      expect(studio.knobs('cot').openness).toBe(0.5);
      await studio.applyRecipe('');
      expect(studio.recipe().text).toBe('');
    });

    it('Dial mặc định lệch nấc: restore giữ đúng giá trị, setDial vẫn làm tròn', async () => {
      const hour = uniform(21.6167);
      const dials = createDialSet([{ id: 'gio', uniform: hour, min: 18, max: 29.5, step: 0.25 }]);
      const { studio } = setup({ dials });
      expect(studio.recipe().text).toBe('');
      await studio.restore({ dials: { gio: 21.6167 } });
      expect(hour.value).toBe(21.6167);
      await studio.applyRecipe('');
      await studio.reset();
      expect([hour.value, studio.recipe().text]).toEqual([21.6167, '']);
      await studio.applyRecipe('gio:23.1');
      expect(hour.value).toBe(23);
      await studio.setDial('gio', 22.1);
      expect(hour.value).toBe(22);
    });

    it('reset: trọng số tween về 1, núm và Dial về mặc định', async () => {
      const { studio, weights } = setup({ dials: hourDials() });
      await studio.setWeight('lop-hai', 0);
      await studio.setKnob('cot', 'count', 300);
      await studio.setDial('gio', 25);
      await studio.reset();
      weights.step(1);
      expect(studio.snapshot()).toEqual(setup({ dials: hourDials() }).studio.snapshot());
      expect(studio.recipe().text).toBe('');
    });
  });
});
