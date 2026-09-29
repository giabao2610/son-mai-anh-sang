// tests/unit/layers.test.js — trọng số (đặt ngay và tween), ctx của một lần dựng, dựng lớp theo thứ tự, lưới an toàn emissive.
import { describe, it, expect, vi } from 'vitest';
import {
  Scene, Mesh, Sprite, BoxGeometry, PerspectiveCamera,
  MeshBasicNodeMaterial, MeshStandardNodeMaterial, SpriteNodeMaterial,
} from 'three/webgpu';
import { vec3 } from 'three/tsl';
import { TWEEN_SECONDS, createWeights, createCtx, buildLayers, ensureEmissive } from '../../src/engine/gpu/layers.js';

// Tên uniform đi thẳng vào WGSL/GLSL: phải là định danh hợp lệ.
const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const env = { tier: 'webgl2', level: 'vua', budget: { bloom: 0.25 }, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
const metas = [{ id: 'cot' }, { id: 'mat-nuoc' }, { id: 'phu-bong' }];

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

describe('createWeights · tween', () => {
  it('tween() chuyển dần theo dt, êm ở hai đầu (smoothstep), tới đúng đích rồi dừng', () => {
    const w = createWeights(metas);
    const u = w.weight('mat-nuoc');
    w.tween('mat-nuoc', 0, 1);
    expect(w.target('mat-nuoc')).toBe(0);
    expect(u.value).toBe(1); // chưa chạy khung nào
    expect(w.step(0.25)).toBe(true);
    expect(u.value).toBeCloseTo(1 - 0.15625, 6); // smoothstep(0.25) = 0.15625
    w.step(0.25);
    expect(u.value).toBeCloseTo(0.5, 6);
    expect(w.step(0.6)).toBe(false); // quá đích: kẹp đúng 0 và hết tween
    expect(u.value).toBe(0);
    expect(w.target('mat-nuoc')).toBe(0);
  });

  it('mặc định TWEEN_SECONDS; duration ≤ 0 thì đặt ngay; set() hủy tween đang chạy', () => {
    const w = createWeights(metas);
    w.tween('phu-bong', 0);
    w.step(TWEEN_SECONDS / 2);
    expect(w.weight('phu-bong').value).toBeCloseTo(0.5, 6);
    w.set('phu-bong', 1);
    expect(w.step(1)).toBe(false);
    expect(w.weight('phu-bong').value).toBe(1);
    w.tween('mat-nuoc', 0.25, 0);
    expect(w.weight('mat-nuoc').value).toBe(0.25);
  });

  it("tween 'cot' bị bỏ qua; đích bị kẹp trong [0, 1]; id lạ thì ném lỗi", () => {
    const w = createWeights(metas);
    w.tween('cot', 0);
    expect(w.step(1)).toBe(false);
    expect(w.weight('cot').value).toBe(1);
    w.tween('mat-nuoc', 5);
    expect(w.target('mat-nuoc')).toBe(1);
    expect(() => w.tween('khong-co', 1)).toThrow('Không có lớp "khong-co"');
    expect(() => w.target('khong-co')).toThrow('Không có lớp "khong-co"');
  });

  it('?freeze: cùng chuỗi dt (1/60) cho cùng một chuỗi giá trị', () => {
    const run = () => {
      const w = createWeights(metas);
      w.tween('mat-nuoc', 0);
      return Array.from({ length: 60 }, () => (w.step(1 / 60), w.weight('mat-nuoc').value));
    };
    expect(run()).toEqual(run());
  });
});

describe('createCtx', () => {
  const meta = { layers: metas, palette: { datSet: '#010203' } };
  const stage = { backend: 'webgl2', renderer: {}, scene: new Scene(), camera: new PerspectiveCamera(), u: {} };

  it('EngineCtx đủ trường của hợp đồng: backend thật, bảng màu đã ghép, weight(); env cho núm', () => {
    const now = new Date('2026-09-28T14:00:00Z');
    const { ctx, weights, env: e } = createCtx({ meta, stage, level: 'vua', budget: { dpr: 1.5 }, mobile: true, reducedMotion: false, now });
    expect(ctx.tier).toBe('webgl2');
    expect(Object.keys(ctx).sort()).toEqual([
      'budget', 'camera', 'debug', 'level', 'mobile', 'now', 'palette', 'reducedMotion', 'renderer', 'scene', 'tier', 'u', 'weight',
    ]);
    expect(ctx.palette.hex.datSet).toBe('#010203'); // bức ghi đè token
    expect(ctx.palette.hex.denThen).toBe('#0E0A08');
    expect(ctx.palette.color('datSet').getHexString()).toBe('010203');
    expect(ctx.weight('mat-nuoc')).toBe(weights.weight('mat-nuoc'));
    expect(ctx.debug).toBe(false);
    expect(e).toEqual({ tier: 'webgl2', level: 'vua', budget: { dpr: 1.5 }, now, mobile: true });
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
    expect(layerCtx.knobValue('exposure')).toBe(1.5);
    expect(sharedArg).toBe(shared);
    expect(cot.createLayer.mock.calls[0][1]).toBe(shared);
    expect(ctx.knob).toBeUndefined(); // ctx gốc không bị sửa
  });

  it("nối layer.onKnob vào bộ núm; thiếu hàm cho núm 'js'/'rebuild' thì gỡ lớp đã dựng rồi ném lỗi", async () => {
    const log = [];
    const onCount = vi.fn();
    const good = { id: 'cot', knobs: [{ id: 'count', via: 'js', value: 10 }], createLayer: () => ({ onKnob: { count: onCount }, dispose: () => log.push('cot') }) };
    const [built] = buildLayers([good], {}, {}, env);
    built.knobs.set('count', 20);
    expect(onCount).toHaveBeenCalledWith(20);
    const bad = { id: 'mat-nuoc', knobs: [{ id: 'size', via: 'rebuild', value: 1 }], createLayer: () => ({ dispose: () => log.push('mat-nuoc') }) };
    expect(() => buildLayers([good, bad], {}, {}, env)).toThrow(`Lớp "mat-nuoc": núm 'rebuild' "size" chưa có hàm onKnob.size`);
    expect(log).toEqual(['mat-nuoc', 'cot']);
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
