// engine/quality.js — chọn mức chất lượng lúc khởi động và ghép ngân sách của bức (hàm thuần, không three; bộ điều chỉnh ở tuner.js).

export const LEVELS = Object.freeze(['cao', 'vua', 'thap']);

// Mức mặc định của xưởng chỉ biết DPR tối đa. Mọi con số khác (số lá, độ phân giải phản chiếu…) là của từng bức.
export const DEFAULT_LEVELS = Object.freeze({
  cao: Object.freeze({ dpr: 2 }),
  vua: Object.freeze({ dpr: 1.5 }),
  thap: Object.freeze({ dpr: 1.25 }),
});

/**
 * Máy này có phải điện thoại/máy tính bảng không.
 * iPadOS 13+ gửi UA giống hệt Mac, nên "Macintosh + màn hình cảm ứng nhiều điểm" cũng tính là máy cầm tay.
 * @param {{ userAgent?: string, maxTouchPoints?: number }} [nav]  thường là window.navigator
 */
export function isMobile({ userAgent = '', maxTouchPoints = 0 } = {}) {
  return /Android|iPhone|iPad|Mobile/i.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

/**
 * Bảng §10: WebGPU → cao (desktop) / vừa (điện thoại); WebGL2 → vừa / thấp.
 * @param {{ tier: 'webgpu' | 'webgl2', mobile: boolean }} opts  tier là backend THẬT sau renderer.init()
 * @returns {'cao' | 'vua' | 'thap'}
 */
export function pickLevel({ tier, mobile }) {
  if (tier === 'webgpu') return mobile ? 'vua' : 'cao';
  if (tier === 'webgl2') return mobile ? 'thap' : 'vua';
  throw new Error(`pickLevel: tầng "${tier}" không có mức chất lượng`);
}

/**
 * Ngân sách của một mức = mức mặc định của xưởng, ghép với quality.levels[level] của bức. Lớp đọc qua ctx.budget.
 * @param {'cao' | 'vua' | 'thap'} level
 * @param {{ levels?: Record<string, Record<string, number>> }} [qualitySpec]  Painting.quality (có từ GĐ 3)
 * @returns {Record<string, number>}  object mới, sửa thoải mái
 */
export function budgetFor(level, qualitySpec) {
  if (!LEVELS.includes(level)) throw new Error(`budgetFor: không có mức "${level}"`);
  return { ...DEFAULT_LEVELS[level], ...(qualitySpec?.levels?.[level] ?? {}) };
}
