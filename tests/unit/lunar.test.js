import { describe, it, expect } from 'vitest';
import {
  TZ_VN, SYNODIC_MONTH,
  jdFromDate, jdToDate, jdFromInstant, jdNewMoon, getNewMoonDay, newMoon,
  getSunLongitude, getLunarMonth11, getLeapMonthOffset,
  convertSolar2Lunar, convertLunar2Solar, lunarFromDate, canChiIndex,
} from '../../src/lib/astro/lunar.js';

// Quy ước thời điểm trong test: luôn ghi rõ múi giờ +07:00 để kết quả
// không phụ thuộc múi giờ của máy chạy test (CI thường là UTC).
const night = (ymd) => new Date(`${ymd}T21:00:00+07:00`); // "đêm" = 21:00 giờ VN
const ymd = (s) => s.split('-').map(Number); // '2026-09-28' → [2026, 9, 28]
const dmy = (s) => ymd(s).reverse(); // '2026-09-28' → [28, 9, 2026], cùng thứ tự với jdFromDate
const solar2lunar = (s) => convertSolar2Lunar(...dmy(s));
const lunar = (day, month, year, leap = false) => ({ day, month, year, leap });

describe('ngày Julius', () => {
  it('mốc J2000: 2000-01-01 là JDN 2451545', () => {
    expect(jdFromDate(1, 1, 2000)).toBe(2451545);
    expect(jdFromInstant(new Date('2000-01-01T12:00:00Z'))).toBe(2451545);
  });

  it('jdToDate là nghịch đảo của jdFromDate (cả lịch Julius lẫn Gregory)', () => {
    for (const [d, m, y] of [[4, 10, 1582], [15, 10, 1582], [29, 2, 2024], [31, 12, 2099], [1, 3, 1900]]) {
      expect(jdToDate(jdFromDate(d, m, y))).toEqual([d, m, y]);
    }
    expect(jdFromDate(15, 10, 1582) - jdFromDate(4, 10, 1582)).toBe(1); // cải lịch Gregory
  });
});

describe('trăng mới và Mặt Trời', () => {
  // Mốc tham chiếu tính độc lập bằng Meeus "Astronomical Algorithms" ch.49 (2026-09-11 03:27 UT).
  it('jdNewMoon: trăng mới 2026-09-11 (mở đầu tháng Tám âm) lệch dưới 5 phút', () => {
    const ref = jdFromInstant(new Date('2026-09-11T03:27:00Z'));
    const k = Math.round((ref - jdNewMoon(0)) / SYNODIC_MONTH);
    expect(Math.abs(jdNewMoon(k) - ref) * 1440).toBeLessThan(5);
    expect(getNewMoonDay(k)).toBe(jdFromDate(11, 9, 2026)); // 10:27 giờ VN → ngày 11
    expect(newMoon(k)).toEqual({ k, jd: jdNewMoon(k), day: jdFromDate(11, 9, 2026) });
  });

  it('getSunLongitude: Đông chí 2025 (21/12) rơi vào cung 9', () => {
    expect(getSunLongitude(jdFromDate(20, 12, 2025))).toBe(8);
    expect(getSunLongitude(jdFromDate(22, 12, 2025))).toBe(9);
  });

  it('tháng 11 âm của năm 2025 bắt đầu 2025-12-20', () => {
    expect(getLunarMonth11(2025)).toBe(jdFromDate(20, 12, 2025));
  });
});

describe('Tết — mùng 1 tháng Giêng (dữ liệu spec)', () => {
  it.each([
    ['2024-02-10', 2024],
    ['2025-01-29', 2025],
    ['2026-02-17', 2026],
  ])('%s là Tết năm %i', (date, year) => {
    expect(solar2lunar(date)).toEqual(lunar(1, 1, year));
    expect(convertLunar2Solar(1, 1, year)).toEqual(dmy(date));
  });

  it('ngày trước Tết 2026 là 29 tháng Chạp năm 2025 (Ất Tỵ)', () => {
    expect(solar2lunar('2026-02-16')).toEqual(lunar(29, 12, 2025));
  });
});

describe('Trung Thu — rằm tháng Tám (dữ liệu spec)', () => {
  it.each([
    ['2025-10-06', 2025],
    ['2026-09-25', 2026],
  ])('%s là Trung Thu năm %i', (date, year) => {
    expect(solar2lunar(date)).toEqual(lunar(15, 8, year));
    expect(convertLunar2Solar(15, 8, year)).toEqual(dmy(date));
  });
});

describe('ngày 2026-09-28 (dữ liệu spec)', () => {
  it('là ngày 18 tháng 8 năm 2026, can chi Bính Ngọ', () => {
    expect(solar2lunar('2026-09-28')).toEqual(lunar(18, 8, 2026));
    expect(lunarFromDate(night('2026-09-28'))).toEqual(lunar(18, 8, 2026));
    expect(canChiIndex(2026)).toEqual({ can: 2, chi: 6 }); // CAN[2] = Bính, CHI[6] = Ngọ
  });
});

describe('can chi của năm (chỉ số; tên nằm ở ui/strings.vi.js)', () => {
  it.each([
    [2025, 'Ất Tỵ', 1, 5], [2026, 'Bính Ngọ', 2, 6], // dữ liệu spec
    [1984, 'Giáp Tý', 0, 0], [2023, 'Quý Mão', 9, 3], [2024, 'Giáp Thìn', 0, 4], [2027, 'Đinh Mùi', 3, 7],
  ])('%i (%s) → can %i, chi %i', (year, _name, can, chi) => {
    expect(canChiIndex(year)).toEqual({ can, chi });
  });

  it('vòng 60 năm lặp lại', () => {
    expect(canChiIndex(2026 + 60)).toEqual(canChiIndex(2026));
    expect(canChiIndex(2026 - 60)).toEqual({ can: 2, chi: 6 });
  });
});

describe('tháng nhuận', () => {
  it.each([
    [2020, 4, '2020-05-23'],
    [2023, 2, '2023-03-22'],
    [2025, 6, '2025-07-25'],
    [2028, 5, '2028-06-23'],
  ])('năm %i nhuận tháng %i, bắt đầu %s', (year, month, start) => {
    expect(convertLunar2Solar(1, month, year, true)).toEqual(dmy(start));
    expect(solar2lunar(start)).toEqual(lunar(1, month, year, true));
    // Chỉ đúng MỘT tháng nhuận trong năm đó.
    const leaps = [...Array(12)].map((_, i) => convertLunar2Solar(1, i + 1, year, true)).filter(Boolean);
    expect(leaps).toHaveLength(1);
  });

  it('các năm nhuận 2017–2033 khớp lịch Việt Nam', () => {
    const expected = { 2017: 6, 2020: 4, 2023: 2, 2025: 6, 2028: 5, 2031: 3, 2033: 11 };
    for (let year = 2017; year <= 2033; year++) {
      const leapMonth = [...Array(12)].map((_, i) => i + 1).find((m) => convertLunar2Solar(1, m, year, true));
      expect(leapMonth, `năm ${year}`).toBe(expected[year]);
    }
  });

  it('2023: tháng Hai thường → tháng Hai nhuận → tháng Ba', () => {
    expect(solar2lunar('2023-03-21')).toEqual(lunar(30, 2, 2023));
    expect(solar2lunar('2023-04-19')).toEqual(lunar(29, 2, 2023, true));
    expect(solar2lunar('2023-04-20')).toEqual(lunar(1, 3, 2023));
    expect(getLeapMonthOffset(getLunarMonth11(2022))).toBe(4); // 11, Chạp, Giêng, Hai, [Hai nhuận]
  });

  it('lunarFromDate đánh dấu leap cho ngày trong tháng nhuận', () => {
    expect(lunarFromDate(night('2023-03-22'))).toEqual(lunar(1, 2, 2023, true));
    expect(lunarFromDate(night('2025-08-01'))).toEqual(lunar(8, 6, 2025, true));
  });

  it('hỏi một tháng nhuận không tồn tại thì trả về null', () => {
    expect(convertLunar2Solar(1, 3, 2023, true)).toBeNull(); // 2023 nhuận tháng 2, không phải 3
    expect(convertLunar2Solar(1, 1, 2026, true)).toBeNull(); // 2026 không có tháng nhuận
  });
});

describe('ranh giới năm: can chi lấy theo năm ÂM', () => {
  it('2026-01-20 (trước Tết) vẫn thuộc năm âm 2025 (Ất Tỵ), không phải 2026 (Bính Ngọ)', () => {
    expect(solar2lunar('2026-01-20')).toEqual(lunar(2, 12, 2025));
    expect(canChiIndex(lunarFromDate(night('2026-01-20')).year)).toEqual({ can: 1, chi: 5 });
  });

  it('giao thừa: 29 Chạp năm 2025 → mùng 1 Giêng năm 2026', () => {
    expect(lunarFromDate(night('2026-02-16'))).toEqual(lunar(29, 12, 2025));
    expect(lunarFromDate(night('2026-02-17'))).toEqual(lunar(1, 1, 2026));
  });

  it('tháng 11 và tháng Chạp nằm đầu khoảng giữa hai Đông chí vẫn thuộc năm âm trước', () => {
    expect(lunarFromDate(night('2025-12-20'))).toEqual(lunar(1, 11, 2025));
    expect(lunarFromDate(night('2026-01-19'))).toEqual(lunar(1, 12, 2025));
  });
});

describe('múi giờ', () => {
  it('ngày âm đổi lúc 00:00 giờ VN, bất kể múi giờ của máy', () => {
    expect(TZ_VN).toBe(7);
    expect(lunarFromDate(new Date('2026-09-28T16:59:00Z'))).toEqual(lunar(18, 8, 2026)); // 23:59 +07
    expect(lunarFromDate(new Date('2026-09-28T17:00:00Z'))).toEqual(lunar(19, 8, 2026)); // 00:00 +07
    expect(lunarFromDate(new Date('2026-09-28T17:00:00Z'), 0)).toEqual(lunar(18, 8, 2026)); // cùng lúc đó ở UTC
  });

  it('múi giờ quyết định lịch: Tết 1985 ở VN (+7) sớm hơn Trung Quốc (+8) một tháng', () => {
    expect(convertLunar2Solar(1, 1, 1985, false, 7)).toEqual([21, 1, 1985]);
    expect(convertLunar2Solar(1, 1, 1985, false, 8)).toEqual([20, 2, 1985]);
  });

  it('Tết 2007: VN 17/2, Trung Quốc 18/2 (trăng mới rơi sát nửa đêm)', () => {
    expect(convertLunar2Solar(1, 1, 2007, false, 7)).toEqual([17, 2, 2007]);
    expect(convertLunar2Solar(1, 1, 2007, false, 8)).toEqual([18, 2, 2007]);
  });

  // Vitest mặc định chạy mỗi file test trong một tiến trình con (pool 'forks'),
  // nên gán process.env.TZ có hiệu lực ngay với Date của tiến trình đó.
  it.each([
    ['UTC', 0], ['America/Los_Angeles', 480], ['Pacific/Kiritimati', -840],
  ])('máy đặt TZ=%s vẫn cho cùng kết quả', (tz, offset) => {
    const saved = process.env.TZ;
    process.env.TZ = tz;
    try {
      expect(new Date('2026-01-01T00:00:00Z').getTimezoneOffset(), 'TZ không đổi được: pool phải là forks').toBe(offset);
      expect(lunarFromDate(night('2026-09-28'))).toEqual(lunar(18, 8, 2026));
      expect(lunarFromDate(new Date('2026-09-28T17:00:00Z'))).toEqual(lunar(19, 8, 2026));
      expect(lunarFromDate(night('2026-01-20'))).toEqual(lunar(2, 12, 2025));
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});

describe('khứ hồi dương → âm → dương', () => {
  it('mọi ngày từ 2020 đến 2030', () => {
    for (let jd = jdFromDate(1, 1, 2020); jd <= jdFromDate(31, 12, 2030); jd++) {
      const s = jdToDate(jd);
      const l = convertSolar2Lunar(...s);
      expect(convertLunar2Solar(l.day, l.month, l.year, l.leap)).toEqual(s);
    }
  });
});
