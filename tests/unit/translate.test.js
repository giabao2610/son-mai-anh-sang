// tests/unit/translate.test.js — Bản dịch (GĐ 9, "bắt lúc vẽ"): bắt một khung qua móc lần vẽ rồi vẽ lại; nơi lớp có mặt theo thứ tự cố định, nhãn, vật không vẽ, vật không lớp nào giữ, quad cuối; tên uniform.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicNodeMaterial } from 'three/webgpu';
import { createTranslator, countLines, drawablesOf, layerUniforms, weightUniform } from '../../src/engine/gpu/translate.js';

const mesh = (name) => Object.assign(new Mesh(new BoxGeometry(), new MeshBasicNodeMaterial()), { name });

/**
 * Ba lớp: Cốt có một khối và một cột; lớp hai không có vật (góp vào material của Cốt); lớp ba có một Group hai khối. `frame` là khung mà
 * móc lần vẽ giả bắt được: { scene, post } như draws.js#capture trả.
 */
function setup({ webgpu = true, frame } = {}) {
  const khoi = mesh('khoi');
  const cot = mesh('cot-da');
  const nhom = Object.assign(new Group(), { name: 'nhom' });
  nhom.add(mesh(''), mesh(''));
  const layers = [
    { id: 'cot', module: { knobs: [{ id: 'size', min: 0, max: 1, value: 0.5 }] }, layer: { objects: [khoi, cot] } },
    { id: 'lop-hai', module: { knobs: [{ id: 'glow', value: 1 }, { id: 'count', via: 'rebuild', value: 3 }] }, layer: { objects: [] } },
    { id: 'lop-ba', module: { knobs: [] }, layer: { objects: [nhom] } },
  ];
  const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }, { id: 'lop-ba', name: 'Lớp ba' }] };
  const content = { layers: { cot: { objects: { khoi: 'Khối đất' } } } };
  const calls = [];
  const draws = {
    capture: vi.fn(() => {
      calls.push('capture');
      return Promise.resolve(typeof frame === 'function' ? frame({ khoi, cot, nhom }) : (frame ?? { scene: [], post: [] }));
    }),
  };
  const redraw = vi.fn(async () => {
    calls.push('redraw');
  });
  const translator = createTranslator({
    renderer: { backend: { isWebGPUBackend: webgpu } }, draws, redraw, layers, meta, content, postLabel: 'Lượt cuối · hậu kỳ',
  });
  return { translator, draws, redraw, calls, khoi, cot, nhom, layers };
}

/**
 * Khung giả: thứ tự vẽ KHÁC thứ tự phủ (three sắp vật đục theo độ sâu): nhóm của lớp ba, rồi khối của Cốt, một vật không lớp nào giữ,
 * rồi quad cuối. Khối có trọng số và núm của lớp hai; vật lạ có trọng số của lớp hai; quad có trọng số của lớp hai. Cột của Cốt không vẽ.
 */
const fakeFrame = ({ khoi, nhom }) => {
  const stray = mesh('la');
  const plain = { vertex: 'v', fragment: 'f' };
  return {
    scene: [
      { object: nhom.children[0], material: nhom.children[0].material, passId: null, ...plain },
      { object: nhom.children[1], material: nhom.children[1].material, passId: null, ...plain },
      { object: khoi, material: khoi.material, passId: null, vertex: 'v', fragment: 'a = object.w_lop_hai;\nb = object.lop_hai_glow;\nc = object.w_lop_hai_2;' },
      { object: stray, material: stray.material, passId: null, vertex: 'v', fragment: 'x = w_lop_hai;' },
      { object: new Mesh(), material: null, passId: null, ...plain }, // vật lạ không có uniform của lớp: không thành một nơi
    ],
    post: [{ object: { isQuadMesh: true }, vertex: 'v quad', fragment: 'f object.w_lop_hai' }],
  };
};

describe('weightUniform, layerUniforms, drawablesOf, countLines', () => {
  it('Cốt không có trọng số (luật 1); núm js/rebuild không có uniform; tên như layers.js và knob-set.js đặt', () => {
    expect(weightUniform('phu-bong')).toBe('w_phu_bong');
    expect(layerUniforms({ id: 'cot', module: { knobs: [{ id: 'size' }] } })).toEqual({ weight: null, knobs: { size: 'cot_size' } });
    expect(layerUniforms({ id: 'lop-hai', module: { knobs: [{ id: 'glow' }, { id: 'count', via: 'rebuild' }] } }))
      .toEqual({ weight: 'w_lop_hai', knobs: { glow: 'lop_hai_glow' } });
  });
  it('mọi vật vẽ được, kể cả con của Group, kèm lớp chủ và thứ tự trong vật gốc', () => {
    const { layers } = setup();
    expect(drawablesOf(layers).map((d) => [d.owner, d.name, d.index, d.of])).toEqual([
      ['cot', 'khoi', 1, 1], ['cot', 'cot-da', 1, 1], ['lop-ba', 'nhom', 1, 2], ['lop-ba', 'nhom', 2, 2],
    ]);
  });
  it('so cả tên: w_lop_hai không khớp w_lop_hai_2', () => {
    expect(countLines('x = w_lop_hai;\ny = w_lop_hai_2;\nz = aw_lop_hai;', ['w_lop_hai'])).toBe(1);
    expect(countLines(null, ['w_lop_hai'])).toBe(0);
  });
});

describe('createTranslator', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it('bắt MỘT khung: gắn lần bắt TRƯỚC khi vẽ lại; mã của nơi là mã của lần vẽ đã bắt', async () => {
    const ctx = setup({ frame: fakeFrame });
    const tr = await ctx.translator.translation('lop-hai');
    expect(ctx.calls).toEqual(['capture', 'redraw']);
    expect(tr.places.find((p) => p.label === 'Khối đất · Cốt')).toMatchObject({ vertex: 'v', drawn: true, post: false });
  });

  it('nơi lớp có mặt theo thứ tự phủ (không theo thứ tự vẽ): vật của lớp khác, vật không lớp nào giữ có uniform, rồi quad cuối', async () => {
    const ctx = setup({ frame: fakeFrame });
    const tr = await ctx.translator.translation('lop-hai');
    expect(tr.language).toBe('wgsl');
    expect(tr.uniforms).toEqual({ weight: 'w_lop_hai', knobs: { glow: 'lop_hai_glow' } });
    expect(tr.places.map((p) => [p.label, p.owner, p.own, p.post, p.hits.fragment])).toEqual([
      ['Khối đất · Cốt', 'cot', false, false, 2],
      ['la', null, false, false, 1],
      ['Lượt cuối · hậu kỳ', null, false, true, 1],
    ]);
    expect(tr.places.map((p) => p.key)).toEqual([`${ctx.khoi.id}:`, expect.stringMatching(/^\d+:$/), 'post:0']);
    expect(tr.jsOnly).toBe(false);
  });

  it('lớp không có uniform nào trong mã: vật của chính nó, jsOnly; nhóm nhiều khối ghi (1/2), (2/2)', async () => {
    const ctx = setup({ frame: fakeFrame });
    const tr = await ctx.translator.translation('lop-ba');
    expect(tr.jsOnly).toBe(true);
    expect(tr.places.map((p) => [p.label, p.own, p.drawn])).toEqual([['nhom (1/2) · Lớp ba', true, true], ['nhom (2/2) · Lớp ba', true, true]]);
  });

  it('vật của chính lớp mà khung không vẽ: drawn false, không có mã, giữ chỗ của nó trong thứ tự; vật vẽ trước nó vẫn đứng trước', async () => {
    const ctx = setup({ frame: fakeFrame });
    const tr = await ctx.translator.translation('cot'); // cot_size không có trong mã nào: jsOnly, mọi vật của Cốt
    expect(tr.jsOnly).toBe(true);
    expect(tr.places.map((p) => [p.label, p.drawn, p.vertex, p.fragment, p.key])).toEqual([
      ['Khối đất · Cốt', true, 'v', expect.any(String), `${ctx.khoi.id}:`],
      ['cot-da · Cốt', false, null, null, `${ctx.cot.id}:`],
    ]);
  });

  it('một lần vẽ hai lượt (passId): hai nơi, khóa khác nhau; nhiều quad cuối thì (1/2), (2/2)', async () => {
    const ctx = setup({
      frame: ({ khoi }) => ({
        scene: [
          { object: khoi, material: khoi.material, passId: 'backSide', vertex: 'v', fragment: 'w_lop_hai' },
          { object: khoi, material: khoi.material, passId: null, vertex: 'v', fragment: 'w_lop_hai' },
        ],
        post: [{ object: {}, vertex: 'v', fragment: 'w_lop_hai' }, { object: {}, vertex: 'v', fragment: 'w_lop_hai' }],
      }),
    });
    const tr = await ctx.translator.translation('lop-hai');
    expect(tr.places.map((p) => [p.key, p.label])).toEqual([
      [`${ctx.khoi.id}:backSide`, 'Khối đất · Cốt'], [`${ctx.khoi.id}:`, 'Khối đất · Cốt'],
      ['post:0', 'Lượt cuối · hậu kỳ (1/2)'], ['post:1', 'Lượt cuối · hậu kỳ (2/2)'],
    ]);
  });

  it('một vật đọc hỏng: nơi đó có error và không có mã, vẫn hiện; vật khác vẫn có mã', async () => {
    const ctx = setup({
      frame: ({ khoi, nhom }) => ({
        scene: [
          { object: khoi, material: khoi.material, passId: null, error: 'hỏng' },
          { object: nhom.children[0], material: nhom.children[0].material, passId: null, vertex: 'v', fragment: 'f object.cot_size' },
        ],
        post: [],
      }),
    });
    const tr = await ctx.translator.translation('cot');
    expect(tr.places.map((p) => [p.label, p.error ?? null, p.vertex, p.hits.fragment])).toEqual([
      ['Khối đất · Cốt', 'hỏng', null, 0], ['nhom (1/2) · Lớp ba', null, 'v', 1],
    ]);
  });

  it('vẽ lại hỏng: bản dịch hỏng theo; lần bắt hỏng về sau (gỡ cảnh) không thành lỗi không ai bắt', async () => {
    const ctx = setup();
    ctx.draws.capture.mockImplementation(() => new Promise((resolve, reject) => setTimeout(() => reject(new Error('cảnh đã gỡ')), 0)));
    ctx.redraw.mockRejectedValueOnce(new Error('vẽ hỏng'));
    await expect(ctx.translator.translation('cot')).rejects.toThrow('vẽ hỏng');
    await new Promise((resolve) => setTimeout(resolve, 5)); // lần bắt hỏng lúc này: Promise.all đã nghe nó
  });

  it('WebGL2: ngôn ngữ glsl, backend webgl2; lớp lạ thì báo lỗi; gỡ cảnh rồi thì hỏng ngay, không bắt gì', async () => {
    const ctx = setup({ webgpu: false });
    const tr = await ctx.translator.translation('cot');
    expect([tr.language, tr.backend]).toEqual(['glsl', 'webgl2']);
    await expect(ctx.translator.translation('khong-co')).rejects.toThrow('Không có lớp "khong-co"');
    ctx.translator.dispose();
    ctx.draws.capture.mockClear();
    await expect(ctx.translator.translation('cot')).rejects.toThrow('Cảnh đã gỡ');
    expect(ctx.draws.capture).not.toHaveBeenCalled();
  });

  it('nơi đọc hỏng: ĐÚNG MỘT console.warn cho cả bản dịch, liệt kê nhãn và lỗi của từng nơi; vật không lớp nào giữ mà đọc hỏng vẫn có mặt (H1)', async () => {
    const stray = mesh('la-roi');
    const ctx = setup({
      frame: ({ khoi }) => ({
        scene: [
          { object: khoi, material: khoi.material, passId: null, error: 'hỏng một' },
          { object: stray, material: stray.material, passId: null, error: 'hỏng hai' },
        ],
        post: [{ object: { isQuadMesh: true }, error: 'hỏng ba' }],
      }),
    });
    const tr = await ctx.translator.translation('lop-hai');
    expect(tr.places.map((p) => [p.label, p.error])).toEqual([
      ['Khối đất · Cốt', 'hỏng một'], ['la-roi', 'hỏng hai'], ['Lượt cuối · hậu kỳ', 'hỏng ba'],
    ]);
    expect(console.warn).toHaveBeenCalledTimes(1);
    const [text] = console.warn.mock.calls[0];
    for (const part of ['Khối đất · Cốt: hỏng một', 'la-roi: hỏng hai', 'Lượt cuối · hậu kỳ: hỏng ba']) expect(text).toContain(part);
  });

  it('không nơi nào hỏng: không cảnh báo', async () => {
    const ctx = setup({ frame: fakeFrame });
    await ctx.translator.translation('lop-hai');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('vật của chính lớp đều KHÔNG được vẽ ở khung bắt (trọng số 0 ẩn vật): không phải jsOnly, các nơi là vật của lớp với drawn false (H2)', async () => {
    const ctx = setup({ frame: ({ khoi }) => ({ scene: [{ object: khoi, material: khoi.material, passId: null, vertex: 'v', fragment: 'f' }], post: [] }) });
    const tr = await ctx.translator.translation('lop-ba');
    expect(tr.jsOnly).toBe(false);
    expect(tr.places.map((p) => [p.label, p.own, p.drawn])).toEqual([['nhom (1/2) · Lớp ba', true, false], ['nhom (2/2) · Lớp ba', true, false]]);
  });

  it('một vật của lớp được vẽ mà mã không có uniform nào của lớp: jsOnly (H2)', async () => {
    const ctx = setup({
      frame: ({ nhom }) => ({ scene: [{ object: nhom.children[0], material: nhom.children[0].material, passId: null, vertex: 'v', fragment: 'f' }], post: [] }),
    });
    const tr = await ctx.translator.translation('lop-ba');
    expect(tr.jsOnly).toBe(true);
    expect(tr.places.map((p) => p.drawn)).toEqual([true, false]);
  });

  it('khung bắt không có lần vẽ nào của camera chính: một console.warn tiếng Việt (H2)', async () => {
    const ctx = setup({ frame: { scene: [], post: [{ object: { isQuadMesh: true }, vertex: 'v', fragment: 'f' }] } });
    await ctx.translator.translation('cot');
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn.mock.calls[0][0]).toContain('không thấy lần vẽ nào của camera chính');
  });
});
