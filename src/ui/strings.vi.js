// ui/strings.vi.js — Chữ tiếng Việt của xưởng: tầng, tầng tĩnh, lời mời, thanh lớp, Sổ tay, mất GPU, tháng/can/chi, con dấu.
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
  if (!Number.isInteger(can) || can < 0 || can > 9 || !Number.isInteger(chi) || chi < 0 || chi > 11) {
    throw new RangeError(`Can chi không hợp lệ: can ${can}, chi ${chi}`);
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
    timeout: 'Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.',
    error: 'Cảnh 3D gặp lỗi trên máy này.',
    debugHint: 'Thêm ?debug vào địa chỉ để xem chi tiết.',
    reload: 'Tải lại',
  },
  /** Lời mời sau lần chạm đầu tiên (là một nút: bấm để vào chế độ mài); n = số lớp của bức. */
  invite: (n) => `Bức tranh này có ${n} lớp — mài thử?`,
  /** Mất GPU lần đầu (GĐ 2): poster hiện lại kèm nút dựng lại. */
  lost: {
    text: 'Trình duyệt vừa dừng GPU của trang (máy ngủ, đổi card đồ họa, hoặc thiếu bộ nhớ). Cảnh có thể dựng lại như cũ.',
    rebuild: 'Dựng lại cảnh',
  },
  /** Thanh lớp: tên từng lớp theo thứ tự phủ, công tắc (trừ Cốt), nút phủ lớp kế tiếp. */
  rail: {
    label: 'Các lớp của bức tranh',
    toggle: (name) => `Bật hoặc tắt lớp ${name}`,
    next: (name) => `Phủ lớp tiếp theo · ${name}`,
    close: 'Đóng thanh lớp, xem lại bức tranh',
  },
  /** Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá. */
  notebook: {
    label: 'Sổ tay',
    layerNo: (i, n) => `Lớp ${i} / ${n}`,
    close: 'Đóng Sổ tay',
    tabs: { hieu: 'Hiểu', chinh: 'Chỉnh', pha: 'Phá' },
    learned: 'Bạn vừa học',
    readMore: 'Đọc thêm',
    code: 'Code thật của lớp',
    loading: 'Đang tải…',
    knobsFailed: 'Chưa tải được núm. Mở lại tab này để thử lại, hoặc tải lại trang.',
    building: 'đang dựng…',
    changeFailed: 'Thay đổi vừa rồi không áp được; chi tiết ở console của trình duyệt.',
    codeMissing: 'Chưa tải được code của file này.',
    contentMissing: 'Chưa tải được chữ của lớp này.',
    noKnobs: 'Lớp này không có núm.',
    noExperiments: 'Lớp này chưa có thí nghiệm.',
    knobsStatic: 'Núm chỉ chạy khi có cảnh 3D. Code thì đọc được ngay.',
    experimentsStatic: 'Thử phá cần cảnh 3D.',
    measure: 'Số đo trực tiếp',
    readouts: { drawCalls: 'Draw call mỗi khung', triangles: 'Tam giác mỗi khung', ms: 'Mili giây mỗi khung' },
    /** Nút mở Sổ tay ở tầng tĩnh (chỉ đọc). */
    openStatic: (n) => `Xem ${n} lớp của bức tranh`,
  },
  formatSeal,
};

export default t;
