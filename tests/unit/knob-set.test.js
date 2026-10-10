// tests/unit/knob-set.test.js — bộ núm của một lớp: uniform có tên hợp lệ, kiểu giá trị, kẹp theo tầng, onKnob.
import { describe, it, expect, vi } from 'vitest';
import { uniformName, knobValue, knobMax, normalizeKnob, createKnobs } from '../../src/engine/gpu/knob-set.js';

// Tên uniform đi thẳng vào WGSL/GLSL: phải là định danh hợp lệ.
const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const env = { tier: 'webgl2', level: 'vua', budget: { bloom: 0.25 }, now: new Date('2026-09-28T14:00:00Z'), mobile: false };

describe('uniformName', () => {
  it('đổi "-" thành "_"', () => {
    expect(uniformName('mat-nuoc', 'fresnelPower')).toBe('mat_nuoc_fresnelPower');
    expect(uniformName('phu-bong', 'bloomStrength')).toBe('phu_bong_bloomStrength');
  });
});

describe('knobValue / knobMax', () => {
  it('value là hàm thì được gọi với env', () => {
    const value = vi.fn((e) => (e.level === 'vua' ? 800 : 1200));
    expect(knobValue({ id: 'leafCount', value }, env)).toBe(800);
    expect(value).toHaveBeenCalledWith(env);
    expect(knobValue({ id: 'size', value: 0.5 }, env)).toBe(0.5);
  });

  it('max theo tầng, một số, hoặc (GĐ 3) một hàm của env: trần theo mức chất lượng', () => {
    const webgl2 = { tier: 'webgl2', level: 'vua' };
    const webgpu = { tier: 'webgpu', level: 'cao' };
    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, webgl2)).toBe(20000);
    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, webgpu)).toBe(200000);
    expect(knobMax({ id: 'size', max: 0.5 }, webgpu)).toBe(0.5);
    expect(knobMax({ id: 'size' }, webgpu)).toBeUndefined();
    const byLevel = { id: 'count', max: (e) => ({ cao: 9, vua: 5, thap: 2 })[e.level] };
    expect([knobMax(byLevel, webgpu), knobMax(byLevel, { tier: 'webgpu', level: 'thap' })]).toEqual([9, 2]);
    expect(normalizeKnob('x', { ...byLevel, min: 1 }, 7, webgl2)).toBe(5);
  });
});

describe('createKnobs: trần do max() trả (GĐ 4)', () => {
  it('max() trả số không hữu hạn, nhỏ hơn min, hay thiếu tầng: ném lỗi tiếng Việt ngay lúc dựng (không lặng lẽ bỏ trần)', () => {
    const bad = [
      { id: 'count', min: 100, max: () => Number.NaN },
      { id: 'count', min: 100, max: () => undefined },
      { id: 'count', min: 100, max: (e) => (e.level === 'vua' ? 50 : 500) },
      { id: 'count', min: 100, max: { webgpu: 200000 } },
    ];
    for (const knob of bad) {
      expect(() => createKnobs('vang-la', [{ ...knob, value: 100 }], env), String(knob.max)).toThrow(/Lớp "vang-la": trần của núm "count"/);
    }
    expect(() => createKnobs('vang-la', [{ id: 'count', min: 100, max: (e) => (e.level === 'vua' ? 100 : 500), value: 100 }], env)).not.toThrow();
  });
});

describe('normalizeKnob', () => {
  it('số: kẹp trong [min, trần của tầng]; chuỗi số cũng nhận; không phải số thì ném lỗi', () => {
    const count = { id: 'count', min: 100, max: { webgpu: 200000, webgl2: 20000 } };
    expect(normalizeKnob('vang-la', count, 50000, { tier: 'webgl2' })).toBe(20000);
    expect(normalizeKnob('vang-la', count, 50000, { tier: 'webgpu' })).toBe(50000);
    expect(normalizeKnob('vang-la', count, 3, { tier: 'webgpu' })).toBe(100);
    expect(normalizeKnob('vang-la', count, '1500', { tier: 'webgpu' })).toBe(1500);
    expect(() => normalizeKnob('vang-la', count, 'nhiều', { tier: 'webgpu' })).toThrow('Núm "vang-la.count": "nhiều" không phải số');
  });

  it("bool → true/false; color → '#rrggbb' chữ thường; select phải có trong options", () => {
    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 1, { tier: 'webgpu' })).toBe(true);
    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 0, { tier: 'webgpu' })).toBe(false);
    expect(normalizeKnob('x', { id: 'c', kind: 'color' }, '#F2D48A', { tier: 'webgpu' })).toBe('#f2d48a');
    expect(() => normalizeKnob('x', { id: 'c', kind: 'color' }, 'vàng', { tier: 'webgpu' })).toThrow('màu phải có dạng #rrggbb');
    const tone = { id: 'tone', kind: 'select', options: ['none', 'agx'] };
    expect(normalizeKnob('phu-bong', tone, 'agx', { tier: 'webgpu' })).toBe('agx');
    expect(() => normalizeKnob('phu-bong', tone, 'aces', { tier: 'webgpu' })).toThrow('Núm "phu-bong.tone": "aces" không có trong options');
    expect(() => normalizeKnob('phu-bong', { id: 'x', kind: 'vector' }, 1, { tier: 'webgpu' })).toThrow('Núm "phu-bong.x" có kind lạ: "vector"');
  });
});

describe('createKnobs', () => {
  const knobs = [
    { id: 'distortion', min: 0, max: 0.1, step: 0.001, value: 0.02 },
    { id: 'fresnelPower', value: (e) => (e.tier === 'webgl2' ? 3 : 5) },
    { id: 'toneMapping', kind: 'select', options: ['none', 'agx', 'aces'], value: 'agx' },
    { id: 'rimColor', kind: 'color', value: '#F2D48A' },
    { id: 'wireframe', kind: 'bool', value: true },
    { id: 'count', via: 'js', value: 100 },
    { id: 'octaves', via: 'rebuild', value: 3 },
  ];

  it("chỉ núm 'uniform' có uniform; mọi tên đều hợp lệ", () => {
    for (const layerId of ['mat-nuoc', 'phu-bong']) {
      const k = createKnobs(layerId, knobs, env);
      expect(Object.keys(k.uniforms)).toEqual(['distortion', 'fresnelPower', 'toneMapping', 'rimColor', 'wireframe']);
      for (const [id, u] of Object.entries(k.uniforms)) {
        expect(u.isUniformNode).toBe(true);
        expect(u.name).toBe(uniformName(layerId, id));
        expect(u.name).toMatch(VALID_NAME);
        expect(k.knob(id)).toBe(u);
      }
    }
  });

  it('giá trị mặc định: value là hàm thì nhận env; select giữ CHỈ SỐ; color là THREE.Color; bool thành 1/0', () => {
    const k = createKnobs('phu-bong', knobs, env);
    expect(k.knob('distortion').value).toBe(0.02);
    expect(k.knob('fresnelPower').value).toBe(3);
    expect(createKnobs('phu-bong', knobs, { ...env, tier: 'webgpu' }).knob('fresnelPower').value).toBe(5);
    expect(k.knob('toneMapping').value).toBe(1);
    expect(k.knob('rimColor').value.isColor).toBe(true);
    expect(k.knob('rimColor').value.getHexString()).toBe('f2d48a');
    expect(k.knob('wireframe').value).toBe(1);
    expect(k.values()).toEqual({
      distortion: 0.02, fresnelPower: 3, toneMapping: 'agx', rimColor: '#f2d48a', wireframe: true, count: 100, octaves: 3,
    });
  });

  it("knob() của núm 'js'/'rebuild' hoặc id lạ thì ném lỗi; khai báo trùng id thì ném lỗi", () => {
    const k = createKnobs('mat-nuoc', knobs, env);
    expect(() => k.knob('count')).toThrow('Lớp "mat-nuoc" không có núm uniform "count"');
    expect(() => k.knob('constructor')).toThrow('không có núm uniform "constructor"');
    expect(() => k.get('constructor')).toThrow('Lớp "mat-nuoc" không có núm "constructor"');
    expect(() => createKnobs('x', [{ id: 'a', value: 1 }, { id: 'a', value: 2 }], env)).toThrow('khai báo núm "a" hai lần');
  });

  it('set() núm uniform: đổi .value của CÙNG uniform (không tạo node mới), đúng kiểu, kẹp theo min/max', () => {
    const k = createKnobs('phu-bong', knobs, env);
    const u = k.knob('distortion');
    expect(k.set('distortion', 0.5)).toBeUndefined();
    expect(k.knob('distortion')).toBe(u);
    expect(u.value).toBe(0.1);
    expect(k.get('distortion')).toBe(0.1);
    k.set('toneMapping', 'aces');
    expect(k.knob('toneMapping').value).toBe(2);
    const color = k.knob('rimColor').value;
    k.set('rimColor', '#B3261E');
    expect(k.knob('rimColor').value).toBe(color);
    expect(color.getHexString()).toBe('b3261e');
    k.set('wireframe', false);
    expect(k.knob('wireframe').value).toBe(0);
    expect(k.values()).toMatchObject({ distortion: 0.1, toneMapping: 'aces', rimColor: '#b3261e', wireframe: false });
  });

  it("set() núm 'js'/'rebuild': gọi onKnob với giá trị đã chuẩn hóa và trả về thứ nó trả (Promise khi dựng lại)", async () => {
    const k = createKnobs('vang-la', [{ id: 'count', via: 'js', min: 10, max: 500, value: 100 }, { id: 'octaves', via: 'rebuild', value: 3 }], env);
    const count = vi.fn();
    const octaves = vi.fn(async () => 'xong');
    k.bind({ count, octaves });
    expect(k.set('count', 9999)).toBeUndefined();
    expect(count).toHaveBeenCalledWith(500);
    await expect(k.set('octaves', 5)).resolves.toBe('xong');
    expect(k.values()).toEqual({ count: 500, octaves: 5 });
  });

  it('onKnob ném lỗi (ngay, hoặc Promise hỏng) thì giữ giá trị cũ: snapshot không mang giá trị cảnh chưa từng áp', async () => {
    const k = createKnobs('vang-la', [{ id: 'count', via: 'js', value: 100 }, { id: 'octaves', via: 'rebuild', value: 3 }], env);
    k.bind({
      count: () => {
        throw new Error('hỏng');
      },
      octaves: async () => {
        throw new Error('dựng lại hỏng');
      },
    });
    expect(() => k.set('count', 200)).toThrow('hỏng');
    await expect(k.set('octaves', 5)).rejects.toThrow('dựng lại hỏng');
    expect(k.values()).toEqual({ count: 100, octaves: 3 });
  });

  it("bind() ném lỗi nếu một núm 'js'/'rebuild' chưa có hàm onKnob", () => {
    const k = createKnobs('vang-la', [{ id: 'count', via: 'js', value: 100 }], env);
    expect(() => k.bind({})).toThrow(`Lớp "vang-la": núm 'js' "count" chưa có hàm onKnob.count`);
    expect(() => k.bind(undefined)).toThrow('chưa có hàm onKnob.count');
    expect(() => createKnobs('cot', [{ id: 'openness', value: 1 }], env).bind(undefined)).not.toThrow();
  });
});

describe('createKnobs: giá trị ban đầu từ công thức (GĐ 9)', () => {
  const knobs = [
    { id: 'size', min: 0, max: 1, value: 0.5 },
    { id: 'tone', kind: 'select', options: ['none', 'agx'], value: 'agx' },
  ];
  it('initial thắng mặc định, đã kẹp; uniform mang giá trị đó ngay từ đầu', () => {
    const k = createKnobs('lop', knobs, env, { size: 7, tone: 'none' });
    expect(k.get('size')).toBe(1);
    expect(k.knob('size').value).toBe(1);
    expect(k.values()).toEqual({ size: 1, tone: 'none' });
    expect(k.knob('tone').value).toBe(0);
  });
  it('giá trị hỏng thì giữ mặc định kèm cảnh báo tiếng Việt', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const k = createKnobs('lop', knobs, env, { tone: 'la' });
    expect(k.get('tone')).toBe('agx');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('lop.tone');
    warn.mockRestore();
  });
});
