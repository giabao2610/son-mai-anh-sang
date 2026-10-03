// engine/tuner.js — bộ điều chỉnh có trễ (hàm thuần, không three): đọc nhịp khung, và ms GPU/CPU khi đo được, rồi quyết hạ hay nâng một nấc.

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
 * Đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây, rồi trả lời nên hạ một nấc ('down'),
 * nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null). Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js.
 * Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
 *
 * Hai đường, chọn theo từng cửa sổ:
 * - ĐƯỜNG TẢI (GĐ 4): cửa sổ có từ 3 mẫu ms GPU trở lên. Nhịp rAF bị khóa theo màn hình và theo chế độ tiết kiệm pin,
 *   nên một laptop yếu (GPU 20 ms, nhịp 33 ms) và một máy khóa 30 fps (GPU 5 ms, nhịp 33 ms) trông y hệt nhau. Thời gian
 *   GPU thật tách được hai trường hợp: máy là nút cổ chai thì hạ; trình duyệt khóa nhịp thì vào "bị khóa nhịp" ngay mà
 *   không hạ gì; máy dư sức thì nâng lại, kể cả khi nhịp đang bị khóa.
 * - ĐƯỜNG NHỊP (GĐ 3, máy không đo được GPU): ba luật sinh từ nhịp bị khóa.
 *   1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
 *   2. Nhịp bị khóa (tiết kiệm pin) thì hạ nấc nào cũng không nhanh hơn. Sau GĐ 5: lần hạ đầu của một đợt hạ (lúc mới live,
 *      sau một lần nâng, sau khi hết khóa nhịp) thì THỬ NGỪNG VẼ trước (probeStep). Không vẽ gì mà nhịp rAF vẫn chậm hơn ngân
 *      sách × 1,2 thì trình duyệt khóa nhịp: vào "bị khóa nhịp" ngay; nhanh lên thì máy là nút cổ chai: hạ như cũ. Lưới an toàn
 *      (GĐ 3): hạ hết thang mà không nhanh hơn lúc bắt đầu hạ thì cũng là nhịp bị khóa: trả lại hết ('reset') rồi thôi hạ.
 *      Mốc "lúc bắt đầu hạ" đo ở lần hạ đầu tiên sau mỗi lần nâng (GĐ 4; GĐ 3 chỉ đo lại khi đã nâng về hết), ghi cả khi
 *      đang canh. Hết khóa khi nhịp nhanh hẳn lên (≤ 1,05 × ngân sách, hay nhanh hơn nhịp bị khóa ÷ 1,25). Còn khóa mà
 *      chậm hẳn hơn nhịp bị khóa (× 1,25, 2 cửa sổ liền) thì là quá tải thật: vẫn hạ, để về lại nhịp ấy; về lại đúng
 *      nhịp bị khóa 5 cửa sổ liền thì trả dần các nấc đó, Sổ tay mở thì chờ.
 *   3. Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại (cả hai đường).
 * guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học, nên chậm vừa phải thì để yên cho số đo trung thực; quá tải
 * NẶNG (> ngân sách × 2,2, theo tải nếu đo được) thì vẫn hạ, để máy không bị ép quá sức. Lúc canh không bao giờ nâng.
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
  let cpus = []; // ms CPU của từng khung trong cửa sổ
  let gpus = []; // mẫu ms GPU về trong cửa sổ (đến trễ vài khung, không đều)
  let open = false; // cửa sổ đang đo (đã qua khởi động): chỉ khi đó mới ghi ms CPU/GPU
  let measured = false; // đã có ít nhất một mẫu ms GPU hữu hạn, lớn hơn 0: máy "đo được"
  let windowNo = 0;
  let overRun = 0;
  let spareRun = 0;
  let descentStart = null; // trung bình của cửa sổ khiến hạ nấc đầu tiên sau lần nâng gần nhất
  let remeasure = true; // lần hạ tới đo lại mốc descentStart (mới dựng, hay vừa nâng)
  let capped = false; // nhịp đang bị khóa (tiết kiệm pin): đường nhịp không hạ nữa, trừ khi chậm hẳn hơn nhịp bị khóa
  let capAvg = null; // trung bình lúc nhận ra nhịp bị khóa
  let beyondRun = 0; // số cửa sổ liền nhau chậm hẳn hơn nhịp bị khóa
  let calmRun = 0; // số cửa sổ liền nhau đúng nhịp bị khóa (lúc đang bị khóa)
  let lastUp = null; // { index, windowNo } của lần nâng gần nhất
  let probe = null; // lần thử ngừng vẽ đang chạy: { avg của cửa sổ khiến thử, gaps: khoảng rAF của các khung không vẽ }
  const locked = new Set();
  const cappedLocks = new Set(); // nấc khóa trong lúc bị khóa nhịp: hết khóa thì quên, cắm sạc luôn trả lại được

  const clear = () => {
    gaps = [];
    total = 0;
    cpus = [];
    gpus = [];
    open = false;
  };
  /** Hạ lại đúng nấc vừa nâng, ngay trong vài cửa sổ: khóa nấc ấy (chống dao động). Nấc khóa lúc bị khóa nhịp thì nhớ riêng. */
  const lockIfBounced = (applied) => {
    const bounced = lastUp !== null && lastUp.index === applied && windowNo - lastUp.windowNo <= o.lockWithin;
    if (bounced) {
      locked.add(applied);
      if (capped) cappedLocks.add(applied);
    }
  };
  const down = (applied, avg) => {
    if (remeasure) {
      descentStart = avg; // mốc của đợt hạ này, ghi cả khi đang canh (Sổ tay mở)
      remeasure = false;
    }
    lockIfBounced(applied);
    return 'down';
  };
  const up = (applied) => {
    lastUp = { index: applied - 1, windowNo };
    remeasure = true; // lần hạ sau đo mốc mới, không dùng lại mốc cũ
    return 'up';
  };
  /** Vào "bị khóa nhịp" (lần thử ngừng vẽ, hay lưới an toàn của luật 2): nhịp ấy là của trình duyệt, không phải của máy. */
  const enterCap = (avg) => {
    capped = true;
    capAvg = avg;
    beyondRun = 0;
    calmRun = 0;
    descentStart = null;
    remeasure = true;
  };
  const uncap = () => {
    capped = false; // hết khóa (cắm sạc, tắt tiết kiệm pin; màn 59,94 Hz hay rớt lẻ một khung vẫn tính): chạy lại
    beyondRun = 0;
    calmRun = 0;
    overRun = 0; // các cửa sổ lúc bị khóa là nhịp của trình duyệt, không phải máy quá tải: đếm lại từ đầu
    for (const index of cappedLocks) locked.delete(index);
    cappedLocks.clear();
  };

  /** ĐƯỜNG TẢI: cửa sổ đủ mẫu GPU. Tải là thời gian máy thật sự bận cho một khung, không bị khóa theo màn hình. */
  function byLoad(avg, load, applied, steps) {
    const over = guarding ? load > budgetMs * o.severe : avg > budgetMs * o.near && load > budgetMs * o.busy;
    const spare = !guarding && load < budgetMs * o.light;
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped && avg <= budgetMs * o.near) uncap();
    else if (!capped && avg > budgetMs * o.over && load < budgetMs * o.idle) {
      capped = true; // nhịp chậm mà máy nhàn: trình duyệt đang khóa nhịp. Không hạ gì, không phải hạ hết thang rồi trả lại
      capAvg = avg;
    }
    if (overRun >= o.downAfter && applied < steps) {
      overRun = 0;
      spareRun = 0;
      return down(applied, avg);
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      return up(applied);
    }
    return null;
  }

  /** ĐƯỜNG NHỊP, lúc đang bị khóa nhịp: chậm hẳn hơn nhịp ấy thì hạ; về lại đúng nhịp ấy đủ lâu thì trả dần. */
  function whileCapped(applied, steps) {
    if (beyondRun >= o.downAfter && applied < steps) {
      beyondRun = 0;
      calmRun = 0;
      lockIfBounced(applied);
      return 'down';
    }
    if (!guarding && calmRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      calmRun = 0;
      return up(applied);
    }
    return null;
  }

  /** ĐƯỜNG NHỊP (GĐ 3): máy không đo được GPU, hay cửa sổ chưa đủ mẫu. */
  function byRhythm(avg, drops, applied, steps) {
    const over = avg > budgetMs * (guarding ? o.severe : o.over);
    const spare = !guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped) {
      beyondRun = avg > capAvg * o.beyond ? beyondRun + 1 : 0;
      calmRun = avg <= capAvg * o.near ? calmRun + 1 : 0;
      if (avg > budgetMs * o.near && avg >= capAvg / o.beyond) return whileCapped(applied, steps);
      uncap();
    }
    if (overRun >= o.downAfter) {
      overRun = 0;
      spareRun = 0;
      if (applied < steps) {
        if (!remeasure || guarding) return down(applied, avg);
        probe = { avg, gaps: [] }; // lần hạ đầu của đợt hạ: thử ngừng vẽ trước (luật 2)
        return 'skip';
      }
      if (!guarding && descentStart !== null && avg >= descentStart * o.gain) {
        enterCap(avg);
        return 'reset';
      }
      return null;
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      return up(applied);
    }
    return null;
  }

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
      enterCap(idle);
      return null;
    }
    return applied < steps ? down(applied, avg) : null;
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
      windowNo += 1;
      return load === null ? byRhythm(avg, drops, applied, steps) : byLoad(avg, load, applied, steps);
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
      guarding = on;
      since = null;
      last = null;
      probe = null; // Sổ tay mở giữa lần thử: người xem đang nhìn cảnh, vẽ lại ngay
      overRun = 0;
      spareRun = 0;
      beyondRun = 0;
      calmRun = 0;
      clear();
    },
    /** @returns {{ guarding: boolean, capped: boolean, locked: number[], gpu: boolean }}  locked: chỉ số nấc trong thang */
    state: () => ({ guarding, capped, locked: [...locked], gpu: measured }),
  };
}
