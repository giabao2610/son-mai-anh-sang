// lib/astro/lunar.js — Âm lịch Việt Nam theo thuật toán Hồ Ngọc Đức; chỉ trả về số, không có chữ.
// Công thức thiên văn rút gọn từ Jean Meeus, "Astronomical Formulae for Calculators".
//
// Toàn bộ là HÀM THUẦN: không đọc đồng hồ, không đọc múi giờ của máy.
// Mọi hàm nhận `tz` (giờ lệch so với UTC); mặc định +7 là giờ Việt Nam.
// Nhờ vậy module dùng lại được cho tranh khác (ví dụ lịch Trung Hoa: tz = 8).
// Tên tháng, can, chi nằm ở ui/strings.vi.js: hộp màu chỉ trả số, mỗi ngôn ngữ tự đặt tên.

const PI = Math.PI;
const INT = Math.floor;

/** Múi giờ Việt Nam (UTC+7), múi giờ mà âm lịch Việt hiện nay dùng. */
export const TZ_VN = 7;

/** Độ dài trung bình một tháng âm (tháng giao hội), tính bằng ngày. */
export const SYNODIC_MONTH = 29.530588853;

const K0 = 2415021.076998695; // JD trăng mới k = 0 (1900-01-01 13:51 UT), dùng để đoán k

// ─── Ngày Julius ──────────────────────────────────────────────────────────
// Điểm học: "số ngày Julius" (JDN) đếm liên tục các ngày từ năm −4712.
// Đổi mọi ngày về một con số nguyên thì cộng/trừ ngày trở nên hiển nhiên.

/** Ngày dương (dd/mm/yy) → số ngày Julius (số nguyên, ứng với trưa ngày đó). */
export function jdFromDate(dd, mm, yy) {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    // Trước 15/10/1582 là lịch Julius (chưa có quy tắc bỏ năm nhuận thế kỷ).
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
}

/** Số ngày Julius → [dd, mm, yy] dương lịch (cùng thứ tự tham số với jdFromDate). */
export function jdToDate(jd) {
  let b, c;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
}

/** Một thời điểm tuyệt đối (JS Date) → JD thực (có phần lẻ), theo UT. */
export function jdFromInstant(date) {
  return date.getTime() / 86400000 + 2440587.5; // 2440587.5 = 1970-01-01 00:00 UT
}

// ─── Trăng mới ────────────────────────────────────────────────────────────

/**
 * Thời điểm CHÍNH XÁC của trăng mới thứ k (JD thực, giờ UT).
 * k = 0 là trăng mới 1900-01-01; k tăng 1 mỗi tháng âm.
 * Điểm học: trăng mới trung bình cách nhau 29,53 ngày, nhưng quỹ đạo elip
 * làm lệch tới ±14 giờ; các số hạng sin bên dưới là phần hiệu chỉnh đó.
 */
export function jdNewMoon(k) {
  const T = k / 1236.85; // thế kỷ Julius kể từ 1900-01-00.5
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr); // trăng mới trung bình
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3; // dị thường TB của Mặt Trời
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3; // dị thường TB của Mặt Trăng
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3; // đối số vĩ độ Mặt Trăng
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  // ΔT: đổi từ Giờ Thiên văn (TT) sang giờ UT.
  const deltaT = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return jd1 + C1 - deltaT;
}

/** Số ngày Julius (nguyên) của NGÀY chứa trăng mới thứ k, theo giờ địa phương tz. */
export function getNewMoonDay(k, tz = TZ_VN) {
  return INT(jdNewMoon(k) + 0.5 + tz / 24);
}

/** Cả hai dạng cùng lúc: { k, jd (thời điểm chính xác, UT), day (JDN theo tz) }. */
export function newMoon(k, tz = TZ_VN) {
  const jd = jdNewMoon(k);
  return { k, jd, day: INT(jd + 0.5 + tz / 24) };
}

// ─── Mặt Trời ─────────────────────────────────────────────────────────────

/** Kinh độ hoàng đạo thật của Mặt Trời tại JD (UT), đơn vị radian, trong [0, 2π). */
export function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525, T2 = T * T; // thế kỷ Julius kể từ J2000
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2; // dị thường TB
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2; // kinh độ TB
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const L = (L0 + DL) * dr;
  return L - 2 * PI * INT(L / (2 * PI));
}

/**
 * Mặt Trời đang ở cung 30° nào (0..11) lúc 0 giờ địa phương của ngày dayNumber.
 * Điểm học: 12 "trung khí" chia hoàng đạo thành 12 cung. Cung 9 bắt đầu ở
 * Đông chí (270°); tháng âm KHÔNG chứa trung khí nào là tháng nhuận.
 */
export function getSunLongitude(dayNumber, tz = TZ_VN) {
  return INT((sunLongitude(dayNumber - 0.5 - tz / 24) / PI) * 6);
}

// ─── Tháng 11 và tháng nhuận ──────────────────────────────────────────────

/** JDN ngày đầu tháng 11 âm (tháng chứa Đông chí) của năm dương yy. */
export function getLunarMonth11(yy, tz = TZ_VN) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / SYNODIC_MONTH);
  let nm = getNewMoonDay(k, tz);
  // Nếu trăng mới cuối năm đã qua Đông chí thì tháng 11 là tháng trước đó.
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

/**
 * Năm âm có 13 tháng: tìm vị trí tháng nhuận, tính từ tháng 11 (a11).
 * Trả về i: tháng thứ i sau tháng 11 là tháng nhuận (tháng đầu tiên không
 * có trung khí — Mặt Trời không đổi cung giữa đầu tháng và đầu tháng sau).
 */
export function getLeapMonthOffset(a11, tz = TZ_VN) {
  const k = INT((a11 - K0) / SYNODIC_MONTH + 0.5);
  let last, i = 1; // bắt đầu từ tháng liền sau tháng 11
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  } while (arc !== last && i < 14);
  return i - 1;
}

// ─── Đổi lịch ─────────────────────────────────────────────────────────────

/** Dương → âm. Trả về { day, month, year, leap } (leap: true nếu tháng nhuận). */
export function convertSolar2Lunar(dd, mm, yy, tz = TZ_VN) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - K0) / SYNODIC_MONTH);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);

  let a11 = getLunarMonth11(yy, tz);
  let b11 = a11, year;
  if (a11 >= monthStart) {
    year = yy;
    a11 = getLunarMonth11(yy - 1, tz);
  } else {
    year = yy + 1;
    b11 = getLunarMonth11(yy + 1, tz);
  }

  const day = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29); // số tháng đã qua kể từ tháng 11
  let leap = false, month = diff + 11;
  if (b11 - a11 > 365) {
    // Giữa hai tháng 11 có 13 lần trăng mới → năm này có tháng nhuận.
    const leapDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapDiff) {
      month = diff + 10;
      if (diff === leapDiff) leap = true;
    }
  }
  if (month > 12) month -= 12;
  // Tháng 11, 12 nằm đầu khoảng [a11, b11) vẫn thuộc năm âm trước.
  if (month >= 11 && diff < 4) year -= 1;
  return { day, month, year, leap };
}

/** Âm → dương. Trả về [dd, mm, yy], hoặc null nếu tháng nhuận đó không tồn tại. */
export function convertLunar2Solar(day, month, year, leap = false, tz = TZ_VN) {
  const [a11, b11] = month < 11
    ? [getLunarMonth11(year - 1, tz), getLunarMonth11(year, tz)]
    : [getLunarMonth11(year, tz), getLunarMonth11(year + 1, tz)];
  const k = INT(0.5 + (a11 - K0) / SYNODIC_MONTH);
  let off = month - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (leap && month !== leapMonth) return null;
    if (leap || off >= leapOff) off += 1;
  } else if (leap) {
    return null;
  }
  return jdToDate(getNewMoonDay(k + off, tz) + day - 1);
}

/** Một thời điểm tuyệt đối → ngày âm theo giờ địa phương tz (không phụ thuộc múi giờ máy). */
export function lunarFromDate(date, tz = TZ_VN) {
  const local = new Date(date.getTime() + tz * 3600000); // dịch sang giờ tz rồi đọc bằng getUTC*
  return convertSolar2Lunar(local.getUTCDate(), local.getUTCMonth() + 1, local.getUTCFullYear(), tz);
}

// ─── Can chi ──────────────────────────────────────────────────────────────

/**
 * Chỉ số Can Chi của một năm ÂM lịch: { can: 0..9, chi: 0..11 }.
 * Điểm học: 10 can và 12 chi cùng xoay, bội chung nhỏ nhất là 60 nên cứ 60 năm lặp lại
 * (lục thập hoa giáp). Năm 4 (và 1984) là Giáp Tý (can 0, chi 0), nên
 * can = (năm + 6) mod 10, chi = (năm + 8) mod 12.
 * Nhớ truyền năm ÂM (lunarFromDate(d).year): ngày trước Tết vẫn mang can chi của năm cũ.
 */
export function canChiIndex(year) {
  return { can: (year + 6) % 10, chi: (year + 8) % 12 };
}
