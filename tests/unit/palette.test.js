import { describe, it, expect } from 'vitest';
import { PALETTE, mergePalette, cssVarName } from '../../src/engine/palette.js';

describe('PALETTE: 10 token của chất liệu sơn mài (spec §5)', () => {
  it('đủ 10 token, đúng mã màu', () => {
    expect(PALETTE).toEqual({
      denThen: '#0E0A08', canhGian: '#3B1F14', doSon: '#B3261E', vangLa: '#D4A94A', vangLaSang: '#F2D48A',
      bacLa: '#C9C6BD', nga: '#EDE3CF', cham: '#1B2A4A', xanhLuc: '#2E4A3A', datSet: '#8A8580',
    });
  });

  it('bị đóng băng: không module nào sửa nhầm được bảng chung', () => {
    expect(Object.isFrozen(PALETTE)).toBe(true);
    expect(() => { PALETTE.doSon = '#FF0000'; }).toThrow(TypeError); // ES module luôn chạy ở strict mode
  });
});

describe('mergePalette: ghép meta.palette của một bức lên bảng chung', () => {
  it('không có phần ghi đè → bản sao đóng băng của PALETTE', () => {
    expect(mergePalette()).toEqual(PALETTE);
    expect(mergePalette(undefined)).toEqual(PALETTE);
    expect(Object.isFrozen(mergePalette())).toBe(true);
  });

  it('thêm token mới và ghi đè token cũ, không đụng tới PALETTE', () => {
    const merged = mergePalette({ diep: '#EFE6D2', doSon: '#a01f18' });
    expect(merged.diep).toBe('#EFE6D2'); // token riêng của bức (ví dụ điệp của tranh Đông Hồ)
    expect(merged.doSon).toBe('#a01f18'); // chữ thường cũng hợp lệ
    expect(merged.denThen).toBe(PALETTE.denThen);
    expect(PALETTE.doSon).toBe('#B3261E');
    expect(Object.isFrozen(merged)).toBe(true);
  });

  it.each([
    ['doSon', 'red'], ['doSon', '#FFF'], ['cham', '#GGGGGG'], ['nga', '#EDE3CF80'], ['diep', 0xefe6d2], ['diep', undefined],
  ])('màu không hợp lệ thì ném lỗi tiếng Việt: %s = %s', (key, value) => {
    expect(() => mergePalette({ [key]: value })).toThrow(`Màu "${key}" không hợp lệ: ${value}`);
  });
});

describe('cssVarName: tên token (camelCase) → biến CSS (kebab-case)', () => {
  it.each([
    ['denThen', '--den-then'], ['vangLaSang', '--vang-la-sang'], ['xanhLuc', '--xanh-luc'], ['nga', '--nga'],
  ])('%s → %s', (token, name) => {
    expect(cssVarName(token)).toBe(name);
  });
});
