import { describe, it, expect } from 'vitest';
import { moonPhase, lunationIndex, sunDirection, tonight, hourOfNight } from '../../src/lib/astro/moon.js';
import { jdFromInstant, jdNewMoon } from '../../src/lib/astro/lunar.js';

// Quy ước thời điểm: "đêm" = 21:00 giờ VN, "ngày" = 12:00 giờ VN (ghi rõ +07:00).
const night = (ymd) => new Date(`${ymd}T21:00:00+07:00`);
const day = (ymd) => new Date(`${ymd}T12:00:00+07:00`);
const vn = (s) => new Date(`${s}+07:00`); // '2026-09-28T19:30:00' → thời điểm lúc đó ở giờ VN
const minutes = (jdA, jdB) => Math.abs(jdA - jdB) * 1440;

describe('độ sáng (dữ liệu spec)', () => {
  it.each(['2026-03-03', '2026-08-28', '2026-09-26'])('đêm trăng tròn %s: > 0,97', (d) => {
    expect(moonPhase(night(d)).illumination).toBeGreaterThan(0.97);
  });

  it('ngày trăng mới 2026-09-11: < 0,05 (cả buổi trưa lẫn buổi tối)', () => {
    expect(moonPhase(day('2026-09-11')).illumination).toBeLessThan(0.05);
    expect(moonPhase(night('2026-09-11')).illumination).toBeLessThan(0.05);
  });

  it('đêm 2026-09-28 (18 tháng Tám): trăng đã qua rằm, đang khuyết dần', () => {
    const m = moonPhase(night('2026-09-28'));
    expect(m.waxing).toBe(false);
    expect(m.illumination).toBeGreaterThan(0.9);
    expect(m.illumination).toBeLessThan(0.99);
  });
});

describe('tuổi trăng theo trăng mới chính xác', () => {
  it('trăng mới 2026-09-11 lúc 03:27 UT (Meeus ch.49, tính độc lập) — lệch dưới 5 phút', () => {
    const m = moonPhase(day('2026-09-11'));
    expect(minutes(m.jdNewMoon, jdFromInstant(new Date('2026-09-11T03:27:00Z')))).toBeLessThan(5);
    expect(m.age).toBeGreaterThan(0);
    expect(m.age).toBeLessThan(0.1); // 12:00 giờ VN = 05:00 UT, chưa tới 2 giờ sau trăng mới
  });

  it.each([
    ['2026-03-03T11:38:00Z', '2026-03-03'], // có nguyệt thực toàn phần
    ['2026-09-26T16:49:00Z', '2026-09-26'],
  ])('trăng tròn %s: jdNewMoon(k + 0,5) lệch dưới 5 phút', (iso, d) => {
    const m = moonPhase(night(d));
    expect(minutes(m.jdFullMoon, jdFromInstant(new Date(iso)))).toBeLessThan(5);
  });

  it('trăng mới vừa qua luôn <= thời điểm đang xét < trăng mới kế tiếp', () => {
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 7 * 3600e3) {
      const m = moonPhase(new Date(t));
      expect(m.jdNewMoon).toBeLessThanOrEqual(m.jd);
      expect(m.jdNextNewMoon).toBeGreaterThan(m.jd);
      expect(m.lunation).toBeGreaterThan(29.2);
      expect(m.lunation).toBeLessThan(29.9);
      expect(m.illumination).toBeCloseTo((1 - Math.cos(m.phase)) / 2, 12);
      expect(m.waxing).toBe(m.phase < Math.PI);
    }
  });

  it('qua thời điểm trăng mới: phase nhảy 2π → 0 nhưng độ sáng liền mạch; tại trăng tròn phase = π', () => {
    const k = lunationIndex(jdFromInstant(night('2026-09-26')));
    const at = (jd, sec = 0) => new Date((jd - 2440587.5) * 86400000 + sec * 1000);
    const before = moonPhase(at(jdNewMoon(k), -60));
    const after = moonPhase(at(jdNewMoon(k), 60));
    expect(before.k).toBe(k - 1);
    expect(after.k).toBe(k);
    expect(before.phase).toBeCloseTo(2 * Math.PI, 3);
    expect(after.phase).toBeCloseTo(0, 3);
    expect(before.illumination).toBeLessThan(1e-6);
    expect(after.illumination).toBeLessThan(1e-6);
    expect(moonPhase(at(jdNewMoon(k + 0.5))).phase).toBeCloseTo(Math.PI, 6);
  });
});

// Tham chiếu độc lập: Meeus ch.47–48, góc pha i tính từ vị trí thật của Mặt Trời/Mặt Trăng.
function meeusIllumination(jd) {
  const r = Math.PI / 180;
  const T = (jd + 69 / 86400 - 2451545) / 36525;
  const D = 297.8501921 + 445267.1114034 * T;
  const M = 357.5291092 + 35999.0502909 * T;
  const Mp = 134.9633964 + 477198.8675055 * T;
  const i = 180 - D - 6.289 * Math.sin(Mp * r) + 2.1 * Math.sin(M * r) - 1.274 * Math.sin((2 * D - Mp) * r)
    - 0.658 * Math.sin(2 * D * r) - 0.214 * Math.sin(2 * Mp * r) - 0.11 * Math.sin(D * r);
  return (1 + Math.cos(i * r)) / 2;
}

describe('so với tham chiếu độc lập Meeus ch.48', () => {
  it('sai số độ sáng < 0,08 suốt năm 2026 (lớn nhất quanh bán nguyệt, ~0 ở rằm và sóc)', () => {
    let worst = 0;
    for (let t = Date.UTC(2026, 0, 1); t < Date.UTC(2027, 0, 1); t += 6 * 3600e3) {
      const m = moonPhase(new Date(t));
      worst = Math.max(worst, Math.abs(m.illumination - meeusIllumination(m.jd)));
    }
    expect(worst).toBeLessThan(0.08);
  });
});

describe('hướng Mặt Trời giả (view space: +x phải, +y lên, +z về phía người xem)', () => {
  const close = (a, b) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 12));

  it('bốn pha chính', () => {
    close(sunDirection(0), [0, 0, -1]); // trăng mới: Mặt Trời sau lưng trăng
    close(sunDirection(Math.PI / 2), [1, 0, 0]); // thượng huyền: sáng nửa phải
    close(sunDirection(Math.PI), [0, 0, 1]); // trăng tròn
    close(sunDirection((3 * Math.PI) / 2), [-1, 0, 0]); // hạ huyền: sáng nửa trái
  });

  it('luôn là vector đơn vị và khớp độ sáng: (1 + L·V)/2 = illumination', () => {
    for (let t = Date.UTC(2026, 8, 1); t < Date.UTC(2026, 9, 1); t += 5 * 3600e3) {
      const m = moonPhase(new Date(t));
      const L = sunDirection(m.phase, { tilt: 0.7 });
      expect(Math.hypot(...L)).toBeCloseTo(1, 12);
      expect((1 + L[2]) / 2).toBeCloseTo(m.illumination, 12);
    }
  });

  it('tilt xoay quanh trục nhìn (ngược chiều kim đồng hồ), không đổi z', () => {
    close(sunDirection(Math.PI / 2, { tilt: Math.PI / 2 }), [0, 1, 0]);
    close(sunDirection(Math.PI / 2, { tilt: -Math.PI / 2 }), [0, -1, 0]); // liềm "nằm ngửa"
  });
});

describe('"đêm nay" (giờ VN)', () => {
  it('ban ngày → isNight false; instant vẫn là chính thời điểm đó; evening là 00:00 hôm đó', () => {
    const now = vn('2026-09-28T10:00:00');
    expect(tonight(now)).toEqual({ instant: now, isNight: false, evening: vn('2026-09-28T00:00:00') });
    expect(tonight(now).instant).toBe(now); // đúng object đã truyền vào; chọn giờ thay thế là việc của bức
  });

  it('buổi tối → đêm của chính ngày đó', () => {
    const now = vn('2026-09-28T19:30:00');
    const n = tonight(now);
    expect(n).toEqual({ instant: now, isNight: true, evening: vn('2026-09-28T00:00:00') });
    expect(hourOfNight(n.instant, n.evening)).toBe(19.5);
  });

  it('sau nửa đêm → vẫn là đêm hôm trước, số giờ tính tiếp quá 24', () => {
    const now = vn('2026-09-29T02:00:00');
    const n = tonight(now);
    expect(n).toMatchObject({ instant: now, isNight: true });
    expect(n.evening.toISOString()).toBe('2026-09-27T17:00:00.000Z'); // 00:00 ngày 28 giờ VN
    expect(hourOfNight(n.instant, n.evening)).toBe(26);
  });

  it('ranh giới: 18:00 và 05:29 là đêm; 17:59 và 05:30 là ngày', () => {
    expect(tonight(vn('2026-09-28T18:00:00')).isNight).toBe(true);
    expect(tonight(vn('2026-09-29T05:29:00')).isNight).toBe(true);
    expect(tonight(vn('2026-09-28T17:59:00')).isNight).toBe(false);
    expect(tonight(vn('2026-09-29T05:30:00')).isNight).toBe(false);
  });

  it('hourOfNight đổi thời điểm thành số giờ kể từ evening (18:00 → 18, 05:30 hôm sau → 29,5)', () => {
    const { evening } = tonight(vn('2026-09-28T21:00:00'));
    expect(hourOfNight(vn('2026-09-28T18:00:00'), evening)).toBe(18);
    expect(hourOfNight(vn('2026-09-28T21:00:00'), evening)).toBe(21);
    expect(hourOfNight(vn('2026-09-29T05:30:00'), evening)).toBe(29.5);
  });

  it('tz là tham số: cùng một thời điểm, ở UTC là 20:00 tối 28, ở VN là 03:00 sáng 29 (vẫn thuộc đêm 28)', () => {
    const at = new Date('2026-09-28T20:00:00Z');
    expect(tonight(at, 0)).toEqual({ instant: at, isNight: true, evening: new Date('2026-09-28T00:00:00Z') });
    expect(hourOfNight(at, tonight(at, 0).evening)).toBe(20);
    expect(tonight(at)).toEqual({ instant: at, isNight: true, evening: vn('2026-09-28T00:00:00') });
    expect(hourOfNight(at, tonight(at).evening)).toBe(27);
  });

  it.each([
    ['UTC', 0], ['America/Los_Angeles', 480], ['Pacific/Kiritimati', -840],
  ])('máy đặt TZ=%s vẫn cho cùng kết quả', (tz, offset) => {
    const saved = process.env.TZ;
    process.env.TZ = tz; // pool 'forks' mặc định của Vitest: có hiệu lực ngay cho Date
    try {
      expect(new Date('2026-01-01T00:00:00Z').getTimezoneOffset(), 'TZ không đổi được: pool phải là forks').toBe(offset);
      const n = tonight(vn('2026-09-29T02:00:00'));
      expect(n.evening.toISOString()).toBe('2026-09-27T17:00:00.000Z');
      expect(hourOfNight(n.instant, n.evening)).toBe(26);
      expect(tonight(vn('2026-09-28T17:59:00')).isNight).toBe(false);
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});
