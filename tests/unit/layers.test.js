import { describe, it, expect, vi } from 'vitest';
import {
  Scene, Mesh, Sprite, BoxGeometry,
  MeshBasicNodeMaterial, MeshStandardNodeMaterial, SpriteNodeMaterial,
} from 'three/webgpu';
import { vec3 } from 'three/tsl';
import {
  uniformName, createWeights, knobValue, knobMax, createKnobs, buildLayers, ensureEmissive,
} from '../../src/engine/gpu/layers.js';

// Tên uniform đi thẳng vào WGSL/GLSL: phải là định danh hợp lệ.
const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const env = { tier: 'webgl2', level: 'vua', budget: { bloom: 0.25 }, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
const metas = [{ id: 'cot' }, { id: 'mat-nuoc' }, { id: 'phu-bong' }];

describe('uniformName', () => {
  it('đổi "-" thành "_"', () => {
    expect(uniformName('mat-nuoc', 'fresnelPower')).toBe('mat_nuoc_fresnelPower');
    expect(uniformName('phu-bong', 'bloomStrength')).toBe('phu_bong_bloomStrength');
  });
});

describe('createWeights', () => {
  it('mỗi lớp một uniform tên w_<id> hợp lệ, theo thứ tự meta', () => {
    const w = createWeights(metas);
    expect(w.ids).toEqual(['cot', 'mat-nuoc', 'phu-bong']);
    expect(w.weight('mat-nuoc').name).toBe('w_mat_nuoc');
    expect(w.weight('phu-bong').name).toBe('w_phu_bong');
    for (const id of w.ids) {
      expect(w.weight(id).isUniformNode).toBe(true);
      expect(w.weight(id).name).toMatch(VALID_NAME);
    }
  });

  it("'cot' luôn là 1 (kể cả khi initial = 0) và set('cot', 0) bị bỏ qua", () => {
    const w = createWeights(metas, 0);
    expect(w.weight('cot').value).toBe(1);
    expect(w.weight('mat-nuoc').value).toBe(0);
    w.set('cot', 0);
    expect(w.weight('cot').value).toBe(1);
  });

  it('set() chỉ đổi .value của CÙNG uniform (không tạo node mới), kẹp trong [0, 1]', () => {
    const w = createWeights(metas);
    const u = w.weight('phu-bong');
    w.set('phu-bong', 0.25);
    expect(w.weight('phu-bong')).toBe(u);
    expect(u.value).toBe(0.25);
    w.set('phu-bong', 7);
    expect(u.value).toBe(1);
    w.set('phu-bong', -1);
    expect(u.value).toBe(0);
  });

  it('id lạ thì ném lỗi tiếng Việt', () => {
    const w = createWeights(metas);
    expect(() => w.weight('khong-co')).toThrow('Không có lớp "khong-co"');
    expect(() => w.set('khong-co', 1)).toThrow('Không có lớp "khong-co"');
  });
});

describe('knobValue / knobMax', () => {
  it('value là hàm thì được gọi với env', () => {
    const value = vi.fn((e) => (e.level === 'vua' ? 800 : 1200));
    expect(knobValue({ id: 'leafCount', value }, env)).toBe(800);
    expect(value).toHaveBeenCalledWith(env);
    expect(knobValue({ id: 'size', value: 0.5 }, env)).toBe(0.5);
  });

  it('max theo tầng hoặc một số', () => {
    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, 'webgl2')).toBe(20000);
    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, 'webgpu')).toBe(200000);
    expect(knobMax({ id: 'size', max: 0.5 }, 'webgpu')).toBe(0.5);
    expect(knobMax({ id: 'size' }, 'webgpu')).toBeUndefined();
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

  it('number: giá trị mặc định; value là hàm thì nhận env', () => {
    const k = createKnobs('mat-nuoc', knobs, env);
    expect(k.knob('distortion').value).toBe(0.02);
    expect(k.knob('fresnelPower').value).toBe(3);
    expect(createKnobs('mat-nuoc', knobs, { ...env, tier: 'webgpu' }).knob('fresnelPower').value).toBe(5);
  });

  it('select giữ CHỈ SỐ lựa chọn; color là THREE.Color; bool thành 1/0', () => {
    const k = createKnobs('phu-bong', knobs, env);
    expect(k.knob('toneMapping').value).toBe(1);
    const c = k.knob('rimColor').value;
    expect(c.isColor).toBe(true);
    expect(c.getHexString()).toBe('f2d48a');
    expect(k.knob('wireframe').value).toBe(1);
    const off = createKnobs('phu-bong', [{ id: 'flat', kind: 'bool', value: false }], env);
    expect(off.knob('flat').value).toBe(0);
  });

  it("knob() của núm 'js'/'rebuild' hoặc id lạ thì ném lỗi", () => {
    const k = createKnobs('mat-nuoc', knobs, env);
    expect(() => k.knob('count')).toThrow('Lớp "mat-nuoc" không có núm uniform "count"');
    expect(() => k.knob('octaves')).toThrow('không có núm uniform "octaves"');
    expect(() => k.knob('constructor')).toThrow('không có núm uniform "constructor"');
  });

  it('select với giá trị không có trong options, hoặc kind lạ, thì ném lỗi', () => {
    expect(() => createKnobs('phu-bong', [{ id: 'tone', kind: 'select', options: ['none'], value: 'agx' }], env))
      .toThrow('Núm "phu-bong.tone": "agx" không có trong options');
    expect(() => createKnobs('phu-bong', [{ id: 'x', kind: 'vector', value: 1 }], env))
      .toThrow('Núm "phu-bong.x" có kind lạ: "vector"');
  });
});

describe('buildLayers', () => {
  const layerModule = (id, knobs, log) => ({
    id,
    knobs,
    createLayer: vi.fn(() => ({ dispose: () => log.push(id) })),
  });

  it('dựng theo thứ tự; mỗi lớp nhận ctx + knob() của CHÍNH nó và cùng một shared', () => {
    const log = [];
    const cot = layerModule('cot', undefined, log); // module không khai báo knobs vẫn dựng được
    const phu = layerModule('phu-bong', [{ id: 'exposure', value: 1.5 }], log);
    const ctx = { level: 'vua' };
    const shared = {};
    const built = buildLayers([cot, phu], ctx, shared, env);

    expect(built.map((b) => b.id)).toEqual(['cot', 'phu-bong']);
    expect(built[1].module).toBe(phu);
    expect(built[1].layer).toBe(phu.createLayer.mock.results[0].value);
    const [layerCtx, sharedArg] = phu.createLayer.mock.calls[0];
    expect(layerCtx.level).toBe('vua');
    expect(layerCtx.knob('exposure')).toBe(built[1].knobs.uniforms.exposure);
    expect(layerCtx.knob('exposure').name).toBe('phu_bong_exposure');
    expect(sharedArg).toBe(shared);
    expect(cot.createLayer.mock.calls[0][1]).toBe(shared);
    expect(ctx.knob).toBeUndefined(); // ctx gốc không bị sửa
  });

  it('một createLayer ném lỗi: gỡ các lớp đã dựng theo thứ tự NGƯỢC rồi ném lại', () => {
    const log = [];
    const boom = { id: 'phu-bong', knobs: [], createLayer: () => { throw new Error('createLayer hỏng'); } };
    const modules = [layerModule('cot', [], log), layerModule('mat-nuoc', [], log), boom];
    expect(() => buildLayers(modules, {}, {}, env)).toThrow('createLayer hỏng');
    expect(log).toEqual(['mat-nuoc', 'cot']);
  });

  it('dispose của một lớp cũng ném lỗi: vẫn gỡ tiếp và vẫn ném lỗi GỐC', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = [];
    const bad = { id: 'mat-nuoc', knobs: [], createLayer: () => ({ dispose: () => { throw new Error('gỡ hỏng'); } }) };
    const boom = { id: 'phu-bong', knobs: [], createLayer: () => { throw new Error('createLayer hỏng'); } };
    expect(() => buildLayers([layerModule('cot', [], log), bad, boom], {}, {}, env)).toThrow('createLayer hỏng');
    expect(log).toEqual(['cot']);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});

describe('ensureEmissive', () => {
  function sceneWith(materials) {
    const scene = new Scene();
    const geometry = new BoxGeometry();
    for (const m of materials) scene.add(m.isSpriteNodeMaterial ? new Sprite(m) : new Mesh(geometry, m));
    return scene;
  }

  it('gán vec3(0) cho MeshBasic và Sprite còn thiếu; để yên Standard (có .emissive) và material đã có emissiveNode', () => {
    const basic = new MeshBasicNodeMaterial();
    basic.name = 'nen';
    const sprite = new SpriteNodeMaterial();
    const standard = new MeshStandardNodeMaterial();
    const glowing = new MeshBasicNodeMaterial();
    const own = vec3(2, 1, 0);
    glowing.emissiveNode = own;
    const warn = vi.fn();

    expect(ensureEmissive(sceneWith([basic, sprite, standard, glowing]), { warn })).toBe(2);
    expect(basic.emissiveNode.isNode).toBe(true);
    expect(sprite.emissiveNode.isNode).toBe(true);
    expect(standard.emissiveNode).toBeNull();
    expect(glowing.emissiveNode).toBe(own);
    expect(warn.mock.calls.map((c) => c[0])).toEqual(['nen', 'SpriteNodeMaterial']);
  });

  it('material dùng chung chỉ sửa một lần; gọi lại thì trả 0; không có warn vẫn chạy', () => {
    const shared = new MeshBasicNodeMaterial();
    const scene = sceneWith([shared, shared]);
    expect(ensureEmissive(scene)).toBe(1);
    expect(ensureEmissive(scene)).toBe(0);
  });

  it('duyệt cả mesh có mảng material', () => {
    const a = new MeshBasicNodeMaterial();
    const b = new MeshStandardNodeMaterial();
    const scene = new Scene();
    scene.add(new Mesh(new BoxGeometry(), [a, b]));
    expect(ensureEmissive(scene)).toBe(1);
    expect(a.emissiveNode.isNode).toBe(true);
  });
});
