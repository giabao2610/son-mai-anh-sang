// tests/unit/recipe.test.js — công thức của tác phẩm trong hash (GĐ 9, spec §21.2, §21.4): đọc, ghi, định dạng giá trị.
import { describe, it, expect } from 'vitest';
import { MAX_RECIPE, formatValue, readRecipe, stepDecimals, writeRecipe } from '../../src/engine/recipe.js';

describe('readRecipe', () => {
  it('không phải công thức: null (hash trống, #, #khac)', () => {
    for (const hash of ['', '#', '#khac', '#r', 'r=suong:0', undefined]) expect(readRecipe(hash)).toBeNull();
  });
  it('đọc trọng số, núm, Dial theo thứ tự; mục rỗng bỏ qua', () => {
    expect(readRecipe('#r=suong:0,,suong.density:0.02,gio:23,')).toEqual({
      entries: [{ key: 'suong', value: '0' }, { key: 'suong.density', value: '0.02' }, { key: 'gio', value: '23' }],
      problems: [],
    });
  });
  it('giải mã phần trăm; giải mã hỏng thì bỏ cả công thức kèm một problem', () => {
    expect(readRecipe('#r=suong%3A0').entries).toEqual([{ key: 'suong', value: '0' }]);
    const bad = readRecipe('#r=suong:%E0%A4%A');
    expect([bad.entries, bad.problems.length]).toEqual([[], 1]);
  });
  it('khóa hay giá trị sai dạng vào problems, mục khác vẫn đọc', () => {
    const r = readRecipe('#r=Suong:0,suong:,x.y.z:1,a.b-c:1,suong:0.5,anh-trang.rimColor:ffcc66,gio:2#3');
    expect(r.entries).toEqual([{ key: 'suong', value: '0.5' }, { key: 'anh-trang.rimColor', value: 'ffcc66' }]);
    expect(r.problems).toEqual(['Suong:0', 'suong:', 'x.y.z:1', 'a.b-c:1', 'gio:2#3']);
  });
  it('khóa lặp: mục sau thắng, đứng ở chỗ của mục sau', () => {
    expect(readRecipe('#r=a:1,b:2,a:3').entries).toEqual([{ key: 'b', value: '2' }, { key: 'a', value: '3' }]);
  });
  it('mục sai dạng dài (người dùng gõ): problem cắt ở 60 ký tự kèm "…" (C7)', () => {
    const r = readRecipe(`#r=suong:0,Bad${'x'.repeat(300)}:1`);
    expect(r.problems).toEqual([`Bad${'x'.repeat(57)}…`]);
  });
  it(`dài quá ${MAX_RECIPE} ký tự: bỏ cả công thức kèm một problem`, () => {
    const r = readRecipe(`#r=${'a:1,'.repeat(600)}`);
    expect([r.entries, r.problems.length]).toEqual([[], 1]);
  });
});

describe('writeRecipe, formatValue, stepDecimals', () => {
  it('ghi theo đúng thứ tự đưa vào; đọc lại ra chính nó', () => {
    const entries = [{ key: 'suong', value: '0' }, { key: 'phu-bong.toneMapping', value: 'aces' }, { key: 'gio', value: '23.25' }];
    const text = writeRecipe(entries);
    expect(text).toBe('suong:0,phu-bong.toneMapping:aces,gio:23.25');
    expect(readRecipe(`#r=${text}`).entries).toEqual(entries);
  });
  it('số: làm tròn theo số chữ số của step, bỏ số 0 thừa, -0 là 0', () => {
    expect(formatValue('number', 0.020000000000000004, 3)).toBe('0.02');
    expect(formatValue('number', 23, 2)).toBe('23');
    expect(formatValue('number', -1.5, 2)).toBe('-1.5');
    expect(formatValue('number', -0.0001, 2)).toBe('0');
    expect(formatValue('number', 1 / 3)).toBe('0.3333');
  });
  it('bool 1/0, select giữ id, màu bỏ # và về chữ thường', () => {
    expect([formatValue('bool', true), formatValue('bool', false)]).toEqual(['1', '0']);
    expect(formatValue('select', 'aces')).toBe('aces');
    expect(formatValue('color', '#FFCC66')).toBe('ffcc66');
  });
  it('stepDecimals: 0.001 → 3, 0.25 → 2, 1 → 0, 0.005 → 3; thiếu step → 4', () => {
    expect([0.001, 0.25, 1, 0.005, undefined, 0].map(stepDecimals)).toEqual([3, 2, 0, 3, 4, 4]);
  });
});
