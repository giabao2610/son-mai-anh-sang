// engine/tuner.js — bộ điều chỉnh có trễ (hàm thuần, không three): đọc nhịp khung, và ms GPU/CPU khi đo được, rồi quyết hạ hay nâng một nấc.
import { byLoad } from './tuner-load.js';
import { byRhythm } from './tuner-rhythm.js';

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
  beyond: 1.25, // đang bị khóa nhịp: chậm hơn nhịp ấy × 1,25 là quá tải thật (hạ); nhanh hơn ÷ 1,25 là hết khóa
  probeTicks: 6, // sau GĐ 5 · thử ngừng vẽ (đường nhịp, trước lần hạ đầu của một đợt hạ): chừng ấy khung không vẽ gì
  probeDrain: 2, // bỏ chừng ấy khoảng đầu của lần thử (GPU còn làm nốt các khung đã gửi), lấy trung vị phần còn lại
  // GĐ 4 · chẩn đoán theo máy khi đo được thời gian GPU. Tải = max(trung vị ms GPU, trung bình ms CPU) của cửa sổ.
  gpuSamples: 3, // cửa sổ có từ chừng này mẫu GPU trở lên mới chẩn đoán theo tải
  busy: 0.85, // tải > ngân sách × 0,85 mà nhịp chậm hơn ngân sách × 1,05: máy là nút cổ chai (quá tải)
  idle: 0.5, // nhịp > ngân sách × 1,2 mà tải < ngân sách × 0,5: trình duyệt đang khóa nhịp, máy thì nhàn
  light: 0.6, // tải < ngân sách × 0,6: máy dư sức (dù màn 60,1 Hz, 75 Hz hay đang bị khóa nhịp)
});

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * Trạng thái và các bước dùng chung của hai đường (`tuner-load.js`, `tuner-rhythm.js`). Mỗi đường đọc, ghi qua object này;
 * trạng thái của cửa sổ đang đo và của lần thử ngừng vẽ thì ở lại trong createTuner.
 * @typedef {ReturnType<typeof createCore>} TunerCore
 */
function createCore(o, budgetMs) {
  const t = {
    o,
    budgetMs,
    guarding: false, // Sổ tay đang mở: chỉ canh quá tải nặng
    windowNo: 0,
    overRun: 0,
    spareRun: 0,
    descentStart: null, // trung bình của cửa sổ khiến hạ nấc đầu tiên sau lần nâng gần nhất
    remeasure: true, // lần hạ tới đo lại mốc descentStart (mới dựng, hay vừa nâng)
    capped: false, // nhịp đang bị khóa (tiết kiệm pin): đường nhịp không hạ nữa, trừ khi chậm hẳn hơn nhịp bị khóa
    capAvg: null, // trung bình lúc nhận ra nhịp bị khóa
    beyondRun: 0, // số cửa sổ liền nhau chậm hẳn hơn nhịp bị khóa
    calmRun: 0, // số cửa sổ liền nhau đúng nhịp bị khóa (lúc đang bị khóa)
    lastUp: null, // { index, windowNo } của lần nâng gần nhất
    locked: new Set(),
    cappedLocks: new Set(), // nấc khóa trong lúc bị khóa nhịp: hết khóa thì quên, cắm sạc luôn trả lại được
    /** Hạ lại đúng nấc vừa nâng, ngay trong vài cửa sổ: khóa nấc ấy (chống dao động). Nấc khóa lúc bị khóa nhịp thì nhớ riêng. */
    lockIfBounced(applied) {
      const bounced = t.lastUp !== null && t.lastUp.index === applied && t.windowNo - t.lastUp.windowNo <= o.lockWithin;
      if (bounced) {
        t.locked.add(applied);
        if (t.capped) t.cappedLocks.add(applied);
      }
    },
    down(applied, avg) {
      if (t.remeasure) {
        t.descentStart = avg; // mốc của đợt hạ này, ghi cả khi đang canh (Sổ tay mở)
        t.remeasure = false;
      }
      t.lockIfBounced(applied);
      return 'down';
    },
    up(applied) {
      t.lastUp = { index: applied - 1, windowNo: t.windowNo };
      t.remeasure = true; // lần hạ sau đo mốc mới, không dùng lại mốc cũ
      return 'up';
    },
    /** Vào "bị khóa nhịp" (lần thử ngừng vẽ, hay lưới an toàn của luật 2): nhịp ấy là của trình duyệt, không phải của máy. */
    enterCap(avg) {
      t.capped = true;
      t.capAvg = avg;
      t.beyondRun = 0;
      t.calmRun = 0;
      t.descentStart = null;
      t.remeasure = true;
    },
    uncap() {
      t.capped = false; // hết khóa (cắm sạc, tắt tiết kiệm pin; màn 59,94 Hz hay rớt lẻ một khung vẫn tính): chạy lại
      t.beyondRun = 0;
      t.calmRun = 0;
      t.overRun = 0; // các cửa sổ lúc bị khóa là nhịp của trình duyệt, không phải máy quá tải: đếm lại từ đầu
      for (const index of t.cappedLocks) t.locked.delete(index);
      t.cappedLocks.clear();
    },
  };
  return t;
}

/**
 * Đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây, rồi trả lời nên hạ một nấc ('down'),
 * nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null). Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js.
 * Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
 *
 * Hai đường, chọn theo từng cửa sổ: ĐƯỜNG TẢI (GĐ 4, `tuner-load.js`) khi cửa sổ có từ 3 mẫu ms GPU trở lên; ĐƯỜNG NHỊP (GĐ 3,
 * `tuner-rhythm.js`) khi máy không đo được GPU. Đường nhịp có thể trả 'skip': THỬ NGỪNG VẼ (probeStep, ngay dưới). Không vẽ gì
 * mà nhịp rAF vẫn chậm hơn ngân sách × 1,2 thì trình duyệt khóa nhịp: vào "bị khóa nhịp" ngay; nhanh lên thì máy là nút cổ
 * chai: hạ như cũ.
 * guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học, nên chậm vừa phải thì để yên cho số đo trung thực; quá tải
 * NẶNG (> ngân sách × 2,2, theo tải nếu đo được) thì vẫn hạ, để máy không bị ép quá sức. Lúc canh không bao giờ nâng.
 *
 * @param {{ budgetMs: number } & Partial<typeof TUNER>} options
 */
export function createTuner({ budgetMs, ...options }) {
  const o = { ...TUNER, ...options };
  const t = createCore(o, budgetMs);
  let since = null; // thời điểm bắt đầu đo (sau khi live, hay sau khi chạy lại)
  let last = null; // thời điểm của khung trước
  let gaps = []; // các khoảng giữa hai khung của cửa sổ đang đo
  let total = 0;
  let cpus = []; // ms CPU của từng khung trong cửa sổ
  let gpus = []; // mẫu ms GPU về trong cửa sổ (đến trễ vài khung, không đều)
  let open = false; // cửa sổ đang đo (đã qua khởi động): chỉ khi đó mới ghi ms CPU/GPU
  let measured = false; // đã có ít nhất một mẫu ms GPU hữu hạn, lớn hơn 0: máy "đo được"
  let probe = null; // lần thử ngừng vẽ đang chạy: { avg của cửa sổ khiến thử, gaps: khoảng rAF của các khung không vẽ }

  const clear = () => {
    gaps = [];
    total = 0;
    cpus = [];
    gpus = [];
    open = false;
  };

  /**
   * Một khung của lần thử ngừng vẽ ('skip': xưởng không vẽ gì, ảnh cũ ở lại). Đủ probeTicks khoảng thì kết luận, khung ấy vẽ
   * như thường. Sổ tay mở thì không thử (người xem đang nhìn cảnh). Khoảng lạ (tab ẩn, debugger) thì bỏ lần thử, đo lại từ đầu.
   */
  function probeStep(gap, applied, steps) {
    if (gap <= 0 || gap > o.hiccupMs) {
      probe = null;
      clear();
      return null;
    }
    probe.gaps.push(gap);
    if (probe.gaps.length < o.probeTicks) return 'skip';
    const { avg, gaps } = probe;
    probe = null;
    clear();
    const idle = median(gaps.slice(o.probeDrain));
    if (idle > budgetMs * o.over) {
      // Không vẽ gì mà vẫn chậm: trình duyệt khóa nhịp. Mốc là chính nhịp ấy (đo lúc không vẽ), không phải nhịp lúc vẽ: máy còn
      // chậm hơn nhịp bị khóa (tiết kiệm pin cũng hạ xung nhịp GPU) thì luật "quá tải thật" vẫn hạ về lại nhịp ấy.
      t.enterCap(idle);
      return null;
    }
    return applied < steps ? t.down(applied, avg) : null;
  }

  return {
    /**
     * Gọi MỘT lần mỗi khung, trước khi vẽ. 'skip': đang thử ngừng vẽ, khung này không vẽ gì (scene.js bỏ qua cả khung).
     * @param {number} ms  thời điểm của khung (timestamp của requestAnimationFrame)
     * @param {{ applied: number, steps: number }} ladder  số nấc đang áp và tổng số nấc của thang
     * @returns {'down' | 'up' | 'reset' | 'skip' | null}
     */
    sample(ms, { applied, steps }) {
      since ??= ms;
      const gap = last === null ? null : ms - last;
      last = ms;
      if (probe) return probeStep(gap, applied, steps);
      if (gap === null) return null;
      if (gap <= 0 || gap > o.hiccupMs) {
        clear();
        return null;
      }
      if (ms - since < o.warmupMs) return null;
      open = true;
      gaps.push(gap);
      total += gap;
      if (total < o.windowMs) return null;
      const avg = total / gaps.length;
      // Rớt khung = số nhịp 60 khung/giây trôi qua mà không có khung nào, đếm trên cả cửa sổ. Không so từng khoảng:
      // sau bộ chặn khung, màn 75 Hz hay 144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không
      // rớt khung nào; phần lẻ dưới 0,75 nhịp là lệch pha ở hai đầu cửa sổ.
      const missed = total / o.frameMs - gaps.length;
      const drops = missed < 0.75 ? 0 : Math.round(missed);
      const load = gpus.length >= o.gpuSamples
        ? Math.max(median(gpus), cpus.length ? cpus.reduce((a, b) => a + b, 0) / cpus.length : 0)
        : null;
      clear();
      t.windowNo += 1;
      if (load !== null) return byLoad(t, avg, load, applied, steps);
      const verdict = byRhythm(t, avg, drops, applied, steps);
      if (verdict === 'skip') probe = { avg, gaps: [] }; // lần hạ đầu của đợt hạ: thử ngừng vẽ trước (luật 2)
      return verdict;
    },
    /** ms CPU của khung vừa vẽ (luồng chính bận bao lâu): một nửa của "tải". */
    cpu(ms) {
      if (open && Number.isFinite(ms) && ms >= 0) cpus.push(ms);
    },
    /** Một mẫu ms GPU (gpu-timer): đến trễ vài khung và không đều; cửa sổ nào đủ 3 mẫu thì đi đường tải. */
    gpu(ms) {
      if (!Number.isFinite(ms) || ms <= 0) return;
      measured = true;
      if (open) gpus.push(ms);
    },
    /** Chuyển sang chế độ canh (Sổ tay mở) hay về như thường; đổi chế độ thì đo lại từ đầu, có khởi động. */
    guard(on) {
      t.guarding = on;
      since = null;
      last = null;
      probe = null; // Sổ tay mở giữa lần thử: người xem đang nhìn cảnh, vẽ lại ngay
      t.overRun = 0;
      t.spareRun = 0;
      t.beyondRun = 0;
      t.calmRun = 0;
      clear();
    },
    /** @returns {{ guarding: boolean, capped: boolean, locked: number[], gpu: boolean }}  locked: chỉ số nấc trong thang */
    state: () => ({ guarding: t.guarding, capped: t.capped, locked: [...t.locked], gpu: measured }),
  };
}
