// ui/strings.vi.js — Chữ tiếng Việt của xưởng: tên tầng, lời giải thích, chữ tầng tĩnh, tên tháng/can/chi, con dấu.
//
// Quy ước: file này KHÔNG import gì và không file nào trong src/ import nó. Chỉ trang HTML import rồi
// truyền `t` vào boot(); engine/ và ui/ nhận `t` qua tham số. Thêm ngôn ngữ = thêm strings.<lang>.js cùng bộ khóa.

/** Tên tháng âm theo chỉ số 1..12 (ô 0 để trống). Tháng 11 viết "Mười Một" cho khỏi nhầm tháng 1 dương lịch. */
export const THANG = Object.freeze([
  '', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp',
]);

/** 10 thiên can, theo chỉ số `can` của canChiIndex() (lib/astro/lunar.js). */
export const CAN = Object.freeze(['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']);

/** 12 địa chi, theo chỉ số `chi` của canChiIndex(). */
export const CHI = Object.freeze(['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']);

/**
 * Chữ trên con dấu: "{ngày} tháng {Tên tháng}{ nhuận?} · {Can Chi}", ví dụ "18 tháng Tám · Bính Ngọ".
 * Đầu vào là số: ui/shell.js ghép lunarFromDate(now) với canChiIndex(năm âm).
 * `traditional: true` gọi tháng 11 theo lối cổ là "Một"; tháng 12 vẫn là "Chạp".
 * @param {{ day: number, month: number, leap: boolean, can: number, chi: number }} lunar
 * @param {{ traditional?: boolean }} [options]
 * @returns {string}
 */
export function formatSeal({ day, month, leap, can, chi }, { traditional = false } = {}) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Tháng âm không hợp lệ: ${month}`);
  }
  const name = traditional && month === 11 ? 'Một' : THANG[month];
  return `${day} tháng ${name}${leap ? ' nhuận' : ''} · ${CAN[can]} ${CHI[chi]}`;
}

const t = {
  lang: 'vi',
  tierName: { webgpu: 'WebGPU', webgl2: 'WebGL2', static: 'Tranh tĩnh' },
  levelName: { cao: 'cao', vua: 'vừa', thap: 'thấp' },
  badge: {
    // Hiện khi chạm vào huy hiệu (title + aria-label): mỗi tầng 1–2 câu.
    explain: {
      webgpu: 'Cảnh đang được vẽ bằng WebGPU, chuẩn đồ họa mới nhất của trình duyệt. '
        + 'Mọi lớp ánh sáng chạy thẳng trên GPU của máy bạn.',
      webgl2: 'Cảnh đang được vẽ bằng WebGL2, chuẩn đồ họa cũ hơn nhưng chạy được trên hầu hết các máy. '
        + 'Vẫn là bức tranh ấy, có khi bớt vài chi tiết để hình luôn mượt.',
      static: 'Bạn đang xem bản tranh tĩnh: poster, thơ và con dấu, không cần GPU. '
        + 'Cảnh 3D chỉ chạy khi trình duyệt dùng được WebGPU hoặc WebGL2.',
    },
  },
  static: {
    noGpu: 'Máy này chưa vẽ được cảnh 3D, thường là vì trình duyệt đang tắt tăng tốc phần cứng. '
      + 'Mở chrome://gpu để kiểm tra; nếu WebGL báo “Disabled”, hãy vào Cài đặt › Hệ thống, '
      + 'bật “Use hardware acceleration when available” (có bản ghi là “Use graphics acceleration when available”) '
      + 'rồi mở lại trình duyệt.',
    chunkLoad: 'Trang vừa được cập nhật, tải lại nhé.',
    error: 'Cảnh 3D gặp lỗi trên máy này.',
    debugHint: 'Thêm ?debug vào địa chỉ để xem chi tiết.',
    reload: 'Tải lại',
  },
  formatSeal,
};

export default t;
