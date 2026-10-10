// engine/tuner-rhythm.js — đường nhịp của bộ điều chỉnh (GĐ 3): máy không đo được GPU thì quyết hạ/nâng chỉ từ nhịp khung.

/**
 * ĐƯỜNG NHỊP, lúc đang bị khóa nhịp: chậm hẳn hơn nhịp ấy (× 1,25, 2 cửa sổ liền) thì là quá tải thật: vẫn hạ, để về lại nhịp
 * ấy; về lại đúng nhịp bị khóa 5 cửa sổ liền thì trả dần các nấc đó, Sổ tay mở thì chờ.
 * @param {import('./tuner.js').TunerCore} t
 */
function whileCapped(t, applied, steps) {
  const { o } = t;
  if (t.beyondRun >= o.downAfter && applied < steps) {
    t.beyondRun = 0;
    t.calmRun = 0;
    t.lockIfBounced(applied);
    return 'down';
  }
  if (!t.guarding && t.calmRun >= o.upAfter && applied > 0 && !t.locked.has(applied - 1)) {
    t.calmRun = 0;
    return t.up(applied);
  }
  return null;
}

/**
 * ĐƯỜNG NHỊP: máy không đo được GPU, hay cửa sổ chưa đủ mẫu. Ba luật sinh từ nhịp bị khóa.
 * 1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
 * 2. Nhịp bị khóa (tiết kiệm pin) thì hạ nấc nào cũng không nhanh hơn. Sau GĐ 5: lần hạ đầu của một đợt hạ (lúc mới live, sau
 *    một lần nâng, sau khi hết khóa nhịp) thì trả 'skip': tuner.js THỬ NGỪNG VẼ trước (probeStep). Lưới an toàn (GĐ 3): hạ hết
 *    thang mà không nhanh hơn lúc bắt đầu hạ thì cũng là nhịp bị khóa: trả lại hết ('reset') rồi thôi hạ. Mốc "lúc bắt đầu hạ"
 *    đo ở lần hạ đầu tiên sau mỗi lần nâng (GĐ 4; GĐ 3 chỉ đo lại khi đã nâng về hết), ghi cả khi đang canh. Hết khóa khi nhịp
 *    nhanh hẳn lên (≤ 1,05 × ngân sách, hay nhanh hơn nhịp bị khóa ÷ 1,25); còn khóa thì whileCapped quyết.
 * 3. Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại (cả hai đường, `t.lockIfBounced`).
 * @param {import('./tuner.js').TunerCore} t
 * @param {number} avg    trung bình khoảng giữa hai khung của cửa sổ (ms)
 * @param {number} drops  số khung rớt trong cửa sổ
 * @param {number} applied
 * @param {number} steps
 * @returns {'down' | 'up' | 'reset' | 'skip' | null}
 */
export function byRhythm(t, avg, drops, applied, steps) {
  const { o, budgetMs } = t;
  const over = avg > budgetMs * (t.guarding ? o.severe : o.over);
  const spare = !t.guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
  t.overRun = over ? t.overRun + 1 : 0;
  t.spareRun = spare ? t.spareRun + 1 : 0;
  if (t.capped) {
    t.beyondRun = avg > t.capAvg * o.beyond ? t.beyondRun + 1 : 0;
    t.calmRun = avg <= t.capAvg * o.near ? t.calmRun + 1 : 0;
    if (avg > budgetMs * o.near && avg >= t.capAvg / o.beyond) return whileCapped(t, applied, steps);
    t.uncap();
  }
  if (t.overRun >= o.downAfter) {
    t.overRun = 0;
    t.spareRun = 0;
    if (applied < steps) {
      if (!t.remeasure || t.guarding) return t.down(applied, avg);
      return 'skip'; // lần hạ đầu của đợt hạ: thử ngừng vẽ trước (luật 2)
    }
    if (!t.guarding && t.descentStart !== null && avg >= t.descentStart * o.gain) {
      t.enterCap(avg);
      return 'reset';
    }
    return null;
  }
  if (t.spareRun >= o.upAfter && applied > 0 && !t.locked.has(applied - 1)) {
    t.spareRun = 0;
    return t.up(applied);
  }
  return null;
}
