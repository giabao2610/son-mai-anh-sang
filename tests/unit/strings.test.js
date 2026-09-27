import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import t, { THANG, CAN, CHI, formatSeal } from '../../src/ui/strings.vi.js';
import { lunarFromDate, canChiIndex } from '../../src/lib/astro/lunar.js';

const night = (ymd) => new Date(`${ymd}T21:00:00+07:00`); // "đêm" = 21:00 giờ VN
// Ghép đúng như ui/shell.js: ngày âm (số) + chỉ số can chi của NĂM ÂM → chữ trên con dấu.
const seal = (date, opts) => {
  const l = lunarFromDate(date);
  return formatSeal({ ...l, ...canChiIndex(l.year) }, opts);
};

describe('bảng tên tháng, can, chi', () => {
  it('tháng: chỉ số 1..12, tháng 11 là "Mười Một", tháng 12 là "Chạp"', () => {
    expect(THANG).toEqual(['', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp']);
  });

  it('10 can, 12 chi, đúng thứ tự', () => {
    expect(CAN).toEqual(['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']);
    expect(CHI).toEqual(['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']);
  });

  it.each([
    [2025, 'Ất Tỵ'], [2026, 'Bính Ngọ'], // dữ liệu spec
    [1984, 'Giáp Tý'], [2023, 'Quý Mão'], [2024, 'Giáp Thìn'], [2027, 'Đinh Mùi'],
  ])('năm %i là %s (canChiIndex + bảng tên)', (year, name) => {
    const { can, chi } = canChiIndex(year);
    expect(`${CAN[can]} ${CHI[chi]}`).toBe(name);
  });
});

describe('formatSeal: chữ trên con dấu', () => {
  it('ghép "{ngày} tháng {Tên tháng} · {Can Chi}"', () => {
    expect(formatSeal({ day: 18, month: 8, leap: false, can: 2, chi: 6 })).toBe('18 tháng Tám · Bính Ngọ');
  });

  it('2026-09-28 → "18 tháng Tám · Bính Ngọ" (e2e cũng kiểm câu này)', () => {
    expect(seal(night('2026-09-28'))).toBe('18 tháng Tám · Bính Ngọ');
  });

  it('tháng nhuận có chữ "nhuận"', () => {
    expect(seal(night('2023-03-22'))).toBe('1 tháng Hai nhuận · Quý Mão');
    expect(seal(night('2025-08-01'))).toBe('8 tháng Sáu nhuận · Ất Tỵ');
  });

  it('ngày cuối tháng Giêng dương trước Tết mang can chi của năm âm cũ', () => {
    expect(seal(night('2026-01-20'))).toBe('2 tháng Chạp · Ất Tỵ');
  });

  it('giao thừa: 29 Chạp Ất Tỵ → mùng 1 Giêng Bính Ngọ', () => {
    expect(seal(night('2026-02-16'))).toBe('29 tháng Chạp · Ất Tỵ');
    expect(seal(night('2026-02-17'))).toBe('1 tháng Giêng · Bính Ngọ');
  });

  it('tháng 11 mặc định "Mười Một", cách gọi cổ "Một"; tháng 12 luôn là "Chạp"', () => {
    expect(seal(night('2025-12-20'))).toBe('1 tháng Mười Một · Ất Tỵ');
    expect(seal(night('2025-12-20'), { traditional: true })).toBe('1 tháng Một · Ất Tỵ');
    expect(seal(night('2026-01-19'))).toBe('1 tháng Chạp · Ất Tỵ');
    expect(seal(night('2026-01-19'), { traditional: true })).toBe('1 tháng Chạp · Ất Tỵ');
  });

  it('con dấu đổi ngày lúc 00:00 giờ VN, bất kể múi giờ của máy', () => {
    expect(seal(new Date('2026-09-28T16:59:00Z'))).toBe('18 tháng Tám · Bính Ngọ'); // 23:59 +07
    expect(seal(new Date('2026-09-28T17:00:00Z'))).toBe('19 tháng Tám · Bính Ngọ'); // 00:00 +07
  });

  it('tháng ngoài 1..12 thì ném RangeError (lỗi của lập trình viên, không in chữ lạ lên con dấu)', () => {
    expect(() => formatSeal({ day: 1, month: 0, leap: false, can: 0, chi: 0 })).toThrow(RangeError);
    expect(() => formatSeal({ day: 1, month: 13, leap: false, can: 0, chi: 0 })).toThrow(RangeError);
  });
});

describe('t: chữ của xưởng', () => {
  it('tên tầng và tên mức', () => {
    expect(t.lang).toBe('vi');
    expect(t.tierName).toEqual({ webgpu: 'WebGPU', webgl2: 'WebGL2', static: 'Tranh tĩnh' });
    expect(t.levelName).toEqual({ cao: 'cao', vua: 'vừa', thap: 'thấp' });
  });

  it('huy hiệu có lời giải thích cho cả 3 tầng', () => {
    for (const tier of ['webgpu', 'webgl2', 'static']) {
      expect(typeof t.badge.explain[tier]).toBe('string');
      expect(t.badge.explain[tier].length).toBeGreaterThan(20);
    }
  });

  it('chữ của tầng tĩnh theo từng lý do', () => {
    expect(t.static.noGpu).toContain('chrome://gpu');
    expect(t.static.noGpu).toContain('Use hardware acceleration when available');
    expect(t.static.chunkLoad).toBe('Trang vừa được cập nhật, tải lại nhé.');
    expect(t.static.error).toBe('Cảnh 3D gặp lỗi trên máy này.');
    expect(t.static.debugHint).toBe('Thêm ?debug vào địa chỉ để xem chi tiết.');
    expect(t.static.reload).toBe('Tải lại');
  });

  it('t.formatSeal chính là formatSeal', () => {
    expect(t.formatSeal).toBe(formatSeal);
  });

  it('strings.vi.js không import gì (trang HTML import nó rồi truyền t vào boot)', () => {
    const src = readFileSync(new URL('../../src/ui/strings.vi.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/^\s*import\b/m);
  });
});
