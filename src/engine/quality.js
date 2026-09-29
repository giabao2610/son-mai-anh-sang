// engine/quality.js — chọn mức chất lượng lúc khởi động, ghép ngân sách của bức, và bộ điều chỉnh có trễ (hàm thuần, không three).

export const LEVELS = Object.freeze(['cao', 'vua', 'thap']);

// Mức mặc định của xưởng chỉ biết DPR tối đa. Mọi con số khác (số lá, độ phân giải phản chiếu…) là của từng bức.
export const DEFAULT_LEVELS = Object.freeze({
  cao: Object.freeze({ dpr: 2 }),
  vua: Object.freeze({ dpr: 1.5 }),
  thap: Object.freeze({ dpr: 1.25 }),
});

/** Ngân sách một khung (ms): 60 khung/giây trên máy tính, 45 khung/giây trên điện thoại (spec §10). */
export const FRAME_BUDGET_MS = Object.freeze({ desktop: 1000 / 60, mobile: 1000 / 45 });

/** Các hằng số của bộ điều chỉnh (spec §10). Test ghi đè được. */
export const TUNER = Object.freeze({
  windowMs: 2000, // một cửa sổ đo
  warmupMs: 2000, // bỏ qua lúc mới live hay mới chạy lại (còn biên dịch dở)
  hiccupMs: 250, // khoảng giữa hai khung dài hơn thế (tab ẩn, debugger) thì bỏ cả cửa sổ
  over: 1.2, // "quá tải": trung bình > ngân sách × 1,2
  severe: 2.2, // "quá tải nặng": trung bình > ngân sách × 2,2 (khi Sổ tay mở, chỉ phản ứng với mức này)
  spare: 0.7, // "dư nhiều": trung bình < ngân sách × 0,7
  near: 1.05, // "dư vừa": trung bình ≤ ngân sách × 1,05 VÀ không rớt khung nào
  frameMs: 1000 / 60, // nhịp của bộ chặn khung (MAX_FPS của gpu/clock.js): cửa sổ thiếu ≥ 0,75 nhịp là rớt khung
  downAfter: 2, // số cửa sổ quá tải liền nhau thì hạ một nấc
  upAfter: 5, // số cửa sổ dư liền nhau thì nâng một nấc
  lockWithin: 3, // nâng một nấc mà trong chừng này cửa sổ phải hạ lại đúng nấc đó thì khóa nó
  gain: 0.9, // hạ hết thang mà trung bình vẫn ≥ 90% lúc bắt đầu hạ: nhịp bị khóa, không phải GPU yếu
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

/**
 * Bộ điều chỉnh có trễ: đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây,
 * rồi trả lời nên hạ một nấc ('down'), nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null).
 * Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js. Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
 *
 * Nhịp rAF không phải thời gian GPU: trình duyệt khóa nó theo màn hình (60 Hz: không bao giờ dưới 16,7 ms) và theo
 * chế độ tiết kiệm pin (30 fps). Ba luật ngoài spec gốc sinh ra từ đó (spec §10, GĐ 3):
 * 1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
 *    Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại.
 * 2. Hạ hết thang mà không nhanh hơn lúc bắt đầu hạ thì nhịp đang bị khóa: trả lại hết ('reset') rồi thôi hạ,
 *    cho tới khi trung bình về dưới ngân sách.
 * 3. guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên chậm vừa phải
 *    thì để yên cho số đo trung thực; nhưng quá tải NẶNG (> ngân sách × 2,2) thì vẫn hạ, để máy không bị ép quá sức.
 *    Lúc canh không bao giờ nâng.
 *
 * @param {{ budgetMs: number } & Partial<typeof TUNER>} options
 */
export function createTuner({ budgetMs, ...options }) {
  const o = { ...TUNER, ...options };
  let guarding = false; // Sổ tay đang mở: chỉ canh quá tải nặng
  let since = null; // thời điểm bắt đầu đo (sau khi live, hay sau khi chạy lại)
  let last = null; // thời điểm của khung trước
  let gaps = []; // các khoảng giữa hai khung của cửa sổ đang đo
  let total = 0;
  let windowNo = 0;
  let overRun = 0;
  let spareRun = 0;
  let descentStart = null; // trung bình của cửa sổ khiến hạ nấc đầu tiên (từ lúc chưa hạ gì)
  let capped = false; // nhịp đang bị khóa: không hạ nữa
  let lastUp = null; // { index, windowNo } của lần nâng gần nhất
  const locked = new Set();

  const clear = () => {
    gaps = [];
    total = 0;
  };

  /** Quyết định ở cuối mỗi cửa sổ. */
  function decide(avg, drops, applied, steps) {
    const over = avg > budgetMs * (guarding ? o.severe : o.over);
    const spare = !guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped) {
      if (avg > budgetMs) return null;
      capped = false; // nhịp hết bị khóa (cắm sạc, tắt tiết kiệm pin): chạy lại như thường
    }
    if (overRun >= o.downAfter) {
      overRun = 0;
      spareRun = 0;
      if (applied < steps) {
        if (applied === 0 && !guarding) descentStart = avg;
        if (lastUp && lastUp.index === applied && windowNo - lastUp.windowNo <= o.lockWithin) locked.add(applied);
        return 'down';
      }
      if (!guarding && descentStart !== null && avg >= descentStart * o.gain) {
        capped = true;
        descentStart = null;
        return 'reset';
      }
      return null;
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      lastUp = { index: applied - 1, windowNo };
      return 'up';
    }
    return null;
  }

  return {
    /**
     * Gọi MỘT lần mỗi khung, trước khi vẽ.
     * @param {number} ms  thời điểm của khung (timestamp của requestAnimationFrame)
     * @param {{ applied: number, steps: number }} ladder  số nấc đang áp và tổng số nấc của thang
     * @returns {'down' | 'up' | 'reset' | null}
     */
    sample(ms, { applied, steps }) {
      since ??= ms;
      const gap = last === null ? null : ms - last;
      last = ms;
      if (gap === null) return null;
      if (gap <= 0 || gap > o.hiccupMs) {
        clear();
        return null;
      }
      if (ms - since < o.warmupMs) return null;
      gaps.push(gap);
      total += gap;
      if (total < o.windowMs) return null;
      const avg = total / gaps.length;
      // Rớt khung = số nhịp 60 khung/giây trôi qua mà không có khung nào, đếm trên cả cửa sổ. Không so từng khoảng:
      // sau bộ chặn khung, màn 75 Hz hay 144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không
      // rớt khung nào; phần lẻ dưới 0,75 nhịp là lệch pha ở hai đầu cửa sổ.
      const missed = total / o.frameMs - gaps.length;
      const drops = missed < 0.75 ? 0 : Math.round(missed);
      clear();
      windowNo += 1;
      return decide(avg, drops, applied, steps);
    },
    /** Chuyển sang chế độ canh (Sổ tay mở) hay về như thường; đổi chế độ thì đo lại từ đầu, có khởi động. */
    guard(on) {
      guarding = on;
      since = null;
      last = null;
      overRun = 0;
      spareRun = 0;
      clear();
    },
    /** @returns {{ guarding: boolean, capped: boolean, locked: number[] }} */
    state: () => ({ guarding, capped, locked: [...locked] }),
  };
}
