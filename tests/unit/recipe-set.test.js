// tests/unit/recipe-set.test.js — công thức của một cảnh (GĐ 9): mặc định theo máy, phân loại, khác biệt, tóm tắt, ba hàm của bàn thợ.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRecipeSet, recipeMethods, showProblems } from '../../src/engine/gpu/recipe-set.js';
import { createDialSet } from '../../src/engine/gpu/dial-set.js';
import { writeRecipe } from '../../src/engine/recipe.js';
import { uniform } from 'three/tsl';

const vua = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
const thap = { ...vua, level: 'thap' };
const modules = [
  { id: 'cot', knobs: [] },
  {
    id: 'to-mau',
    knobs: [
      { id: 'density', min: 0, max: (e) => (e.level === 'thap' ? 0.05 : 0.2), step: 0.01, value: (e) => (e.level === 'thap' ? 0.02 : 0.05) },
      { id: 'tone', kind: 'select', options: ['none', 'agx'], value: 'agx' },
      { id: 'tint', kind: 'color', value: '#ff8800' },
      { id: 'glow', kind: 'bool', value: true },
    ],
  },
  { id: 'phu-bong', knobs: [{ id: 'exposure', min: 0, max: 4, step: 0.1, value: 1 }] },
];
const dials = [{ id: 'gio', min: 0, max: 24, step: 0.25 }];
const make = (env = vua) => createRecipeSet({ modules, env, dials, dialDefaults: { gio: 21 } });
const pairs = (...kv) => kv.map(([key, value]) => ({ key, value }));
afterEach(() => vi.restoreAllMocks());

describe('createRecipeSet.defaults', () => {
  it('theo env: giá trị và trần của núm là hàm của mức', () => {
    expect(make().defaults.knobs['to-mau.density']).toBe(0.05);
    expect(make(thap).defaults.knobs['to-mau.density']).toBe(0.02);
    expect(make().defaults.weights).toEqual({ cot: 1, 'to-mau': 1, 'phu-bong': 1 });
    expect(make().defaults.dials).toEqual({ gio: 21 });
    expect(make().defaults.knobs['to-mau.tint']).toBe('#ff8800');
  });
});

describe('classify', () => {
  it('số kẹp theo trần của máy này; 1/0/true/false; lựa chọn lạ vào problems', () => {
    const c = make(thap).classify(pairs(['to-mau.density', '0.2'], ['to-mau.glow', '0'], ['to-mau.tone', 'xyz']));
    expect(c.knobs['to-mau.density']).toBe(0.05);
    expect(c.knobs['to-mau.glow']).toBe(false);
    expect(make().classify(pairs(['to-mau.glow', 'true'])).knobs['to-mau.glow']).toBe(true);
    expect(c.problems).toHaveLength(1);
    expect(c.problems[0]).toContain('to-mau.tone:xyz');
  });
  it('màu rrggbb thành #rrggbb, rút gọn 3 chữ số vào problems', () => {
    const c = make().classify(pairs(['to-mau.tint', 'ffcc66'], ['to-mau.tone', 'none']));
    expect(c.knobs['to-mau.tint']).toBe('#ffcc66');
    expect(make().classify(pairs(['to-mau.tint', 'fc6'])).problems).toHaveLength(1);
  });
  it('trọng số: Cốt luôn là 1 (problems), 1.5 kẹp về 1, Dial, khóa lạ', () => {
    const c = make().classify(pairs(['cot', '0'], ['to-mau', '1.5'], ['phu-bong', '0.3'], ['gio', '23'], ['khong-co', '1']));
    expect(c.weights).toEqual({ 'to-mau': 1, 'phu-bong': 0.3 });
    expect(c.dials).toEqual({ gio: 23 });
    expect(c.problems).toHaveLength(2);
    expect(c.problems[0]).toContain('Cốt luôn là 1');
    expect(c.problems[1]).toContain('khong-co');
  });
});

describe('diff / countsOf', () => {
  const orig = () => ({
    weights: { cot: 1, 'to-mau': 1, 'phu-bong': 1 },
    knobs: { 'to-mau.density': 0.05, 'to-mau.tone': 'agx', 'to-mau.tint': '#ff8800', 'to-mau.glow': true, 'phu-bong.exposure': 1 },
    dials: { gio: 21 },
  });
  it('nguyên bản ra []; sai số dấu phẩy động không tính là đã đổi', () => {
    const r = make();
    expect(r.diff(orig())).toEqual([]);
    const s = orig();
    s.knobs['to-mau.density'] = 0.020000000000000004 + 0.03;
    s.weights['to-mau'] = 0.9999;
    expect(r.diff(s)).toEqual([]);
    expect(make(thap).diff({ ...orig(), knobs: { ...orig().knobs, 'to-mau.density': 0.020000000000000004 } })).toEqual([]);
  });
  it('thứ tự: trọng số theo thứ tự phủ, núm theo lớp và khai báo, rồi Dial', () => {
    const s = orig();
    s.dials.gio = 23;
    s.knobs['phu-bong.exposure'] = 2;
    s.knobs['to-mau.glow'] = false;
    s.knobs['to-mau.tint'] = '#FFCC66';
    s.knobs['to-mau.density'] = 0.1;
    s.weights['phu-bong'] = 0;
    s.weights['to-mau'] = 0.5;
    const d = make().diff(s);
    expect(d.map((e) => `${e.key}:${e.value}`)).toEqual([
      'to-mau:0.5', 'phu-bong:0', 'to-mau.density:0.1', 'to-mau.tint:ffcc66', 'to-mau.glow:0', 'phu-bong.exposure:2', 'gio:23',
    ]);
    expect(make().countsOf(d)).toEqual({ layers: 2, knobs: 4, dials: ['gio'] });
  });
  it('Dial bằng giá trị lúc dựng thì không ghi', () => {
    expect(make().diff({ ...orig(), dials: { gio: 21.001 } })).toEqual([]);
  });
});

describe('recipeMethods', () => {
  function rig() {
    const state = {
      weights: { cot: 1, 'to-mau': 1, 'phu-bong': 1 },
      knobs: { 'to-mau.density': 0.05, 'to-mau.tone': 'agx', 'to-mau.tint': '#ff8800', 'to-mau.glow': true, 'phu-bong.exposure': 1 },
      dials: { gio: 21 },
    };
    const restore = vi.fn(async (s) => {
      Object.assign(state.weights, s.weights ?? {});
      Object.assign(state.knobs, s.knobs ?? {});
      Object.assign(state.dials, s.dials ?? {});
    });
    const tweenAll = vi.fn(() => Object.keys(state.weights).forEach((id) => { state.weights[id] = 1; }));
    const m = recipeMethods(make(), { snapshot: () => JSON.parse(JSON.stringify(state)), restore, tweenAll });
    return { m, state, restore, tweenAll };
  }
  it('applyRecipe là trạng thái ĐỦ: núm đã đổi trước đó mà công thức không nói thì về mặc định', async () => {
    const { m, state } = rig();
    state.knobs['phu-bong.exposure'] = 3;
    const res = await m.applyRecipe('to-mau:0,gio:23');
    expect(state.knobs['phu-bong.exposure']).toBe(1);
    expect(state.weights['to-mau']).toBe(0);
    expect(m.recipe()).toEqual({ text: 'to-mau:0,gio:23', counts: { layers: 1, knobs: 0, dials: ['gio'] } });
    expect(res.problems).toEqual([]);
    await m.applyRecipe('');
    expect(m.recipe().text).toBe('');
  });
  it('problems cảnh báo MỘT dòng', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { m } = rig();
    const res = await m.applyRecipe('khong-co:1,cot:0,to-mau:0.5');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(res.problems).toHaveLength(2);
  });
  it('reset: tween trọng số, núm và Dial về mặc định', async () => {
    const { m, state, restore, tweenAll } = rig();
    state.knobs['to-mau.density'] = 0.1;
    state.dials.gio = 3;
    await m.reset();
    expect(tweenAll).toHaveBeenCalledTimes(1);
    expect(restore).toHaveBeenCalledWith({ knobs: make().defaults.knobs, dials: { gio: 21 } });
    expect(m.recipe().text).toBe('');
  });
});

describe('Dial mặc định không nằm trên nấc (GĐ 9, giờ thật của Bức 1)', () => {
  const rigOff = () => {
    const hour = uniform(21.6167);
    const dialDef = { id: 'gio', uniform: hour, min: 18, max: 29.5, step: 0.25 };
    const dialSet = createDialSet([dialDef]);
    const recipes = createRecipeSet({ modules, env: vua, dials: [dialDef], dialDefaults: dialSet.snapshot() });
    const state = { weights: { cot: 1, 'to-mau': 1, 'phu-bong': 1 }, knobs: recipes.defaults.knobs };
    const restore = async (snap) => {
      Object.assign(state.weights, snap.weights ?? {});
      dialSet.restore(snap.dials ?? {}, { exact: true });
    };
    const m = recipeMethods(recipes, {
      snapshot: () => ({ ...state, dials: dialSet.snapshot() }), restore, tweenAll: () => Object.keys(state.weights).forEach((id) => { state.weights[id] = 1; }),
    });
    return { m, hour, recipes };
  };
  it('applyRecipe("") và reset() cho text rỗng và giữ nguyên giá trị Dial', async () => {
    const { m, hour } = rigOff();
    expect(m.recipe().text).toBe('');
    await m.applyRecipe('');
    expect([m.recipe().text, hour.value]).toEqual(['', 21.6167]);
    await m.applyRecipe('to-mau:0');
    expect(m.recipe().text).toBe('to-mau:0');
    await m.reset();
    expect([m.recipe().text, hour.value]).toEqual(['', 21.6167]);
  });
  it('applyRecipe("gio:23.1") ra 23; classify làm tròn một lần', async () => {
    const { m, hour, recipes } = rigOff();
    expect(recipes.classify(pairs(['gio', '23.1'])).dials).toEqual({ gio: 23 });
    await m.applyRecipe('gio:23.1');
    expect([hour.value, m.recipe().text]).toEqual([23, 'gio:23']);
  });
});

describe('classify làm tròn như cảnh dùng (F2): thanh địa chỉ = cảnh', () => {
  const net = () => createRecipeSet({
    modules: [{ id: 'cot', knobs: [] }, { id: 'ban-net', knobs: [{ id: 'lineWidth', min: 1, max: 3, step: 1, value: 1 }] }], env: vua,
  });
  it('núm số có step về nấc gần nhất tính từ min (Math.round: nửa nấc làm tròn lên): lineWidth 2.5 → 3, 2.4 → 2; hash ghi đúng số đó', () => {
    const r = net();
    expect(r.classify(pairs(['ban-net.lineWidth', '2.5'])).knobs['ban-net.lineWidth']).toBe(3);
    const two = r.classify(pairs(['ban-net.lineWidth', '2.4'])).knobs['ban-net.lineWidth'];
    expect(two).toBe(2);
    expect(writeRecipe(r.diff({ weights: {}, knobs: { 'ban-net.lineWidth': two } }))).toBe('ban-net.lineWidth:2');
    expect(r.classify(pairs(['ban-net.lineWidth', '1.4'])).knobs['ban-net.lineWidth'], '1 là mặc định: hash rỗng').toBe(1);
    expect(r.diff({ weights: {}, knobs: { 'ban-net.lineWidth': 1 } })).toEqual([]);
  });
  it('kẹp trong [min, trần của máy này] sau khi về nấc; số không còn sai số dấu phẩy động', () => {
    expect(make(thap).classify(pairs(['to-mau.density', '0.047'])).knobs['to-mau.density']).toBe(0.05); // trần của mức thấp
    expect(make().classify(pairs(['to-mau.density', '0.0449'])).knobs['to-mau.density']).toBe(0.04);
    expect(make().classify(pairs(['to-mau.density', '-3'])).knobs['to-mau.density']).toBe(0);
    expect(make().classify(pairs(['phu-bong.exposure', '1.26'])).knobs['phu-bong.exposure']).toBe(1.3);
  });
  it('trọng số làm tròn 0,01 (diff cũng ghi 2 chữ số): 0.333 → 0.33', () => {
    const r = make();
    const { weights } = r.classify(pairs(['to-mau', '0.333'], ['phu-bong', '0.005']));
    expect(weights).toEqual({ 'to-mau': 0.33, 'phu-bong': 0.01 });
    expect(writeRecipe(r.diff({ weights }))).toBe('to-mau:0.33,phu-bong:0.01');
  });
});

describe('link hỏng hoàn toàn giữ nguyên cảnh (C6)', () => {
  const rig = () => {
    const state = { weights: { cot: 1, 'to-mau': 0, 'phu-bong': 1 }, knobs: { ...make().defaults.knobs, 'phu-bong.exposure': 3 }, dials: { gio: 21 } };
    const restore = vi.fn(async (s) => Object.assign(state, s));
    return { state, restore, m: recipeMethods(make(), { snapshot: () => JSON.parse(JSON.stringify(state)), restore, tweenAll: vi.fn() }) };
  };
  it.each([
    ['mọi mục đều hỏng', 'khong-co:1,cot:0,to-mau.tone:xyz'],
    ['không giải mã được', 'to-mau:%E0%A4%A'],
    ['dài quá 2.048 ký tự', `to-mau:0,${'x:1,'.repeat(600)}`],
  ])('%s: không restore, MỘT cảnh báo nói cảnh giữ nguyên, applied false', async (_name, text) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { m, restore, state } = rig();
    const res = await m.applyRecipe(text);
    expect(restore).not.toHaveBeenCalled();
    expect(state.weights['to-mau']).toBe(0);
    expect(res.applied).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('giữ nguyên');
  });
  it('chuỗi rỗng vẫn là "về mặc định"; một mục hợp lệ giữa các mục hỏng vẫn áp thành trạng thái đủ', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { m, restore, state } = rig();
    expect((await m.applyRecipe('')).applied).toBe(true);
    expect(state.knobs['phu-bong.exposure']).toBe(1);
    expect((await m.applyRecipe('khong-co:1,to-mau:0.5')).applied).toBe(true);
    expect(restore).toHaveBeenCalledTimes(2);
    expect(state.weights['to-mau']).toBe(0.5);
  });
});

describe('cảnh báo mục hỏng (C7)', () => {
  it('chỉ cắt phần khóa:giá trị người dùng gõ (60 ký tự), không bao giờ cắt lý do', () => {
    const long = 'x'.repeat(200);
    const { problems } = make().classify(pairs(['to-mau.tone', long], ['to-mau.density', `9${'e'.repeat(80)}`], ['gio', long]));
    const text = showProblems(problems);
    expect(text).toContain(`${`to-mau.tone:${long}`.slice(0, 60)}… (không có trong options)`);
    expect(text).toContain('(không phải số)');
    expect(problems).toHaveLength(3);
    for (const p of problems) expect(p.length, p).toBeLessThan(100);
  });
});
