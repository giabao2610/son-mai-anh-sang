// engine/tuner-load.js — đường tải của bộ điều chỉnh (GĐ 4): cửa sổ đủ mẫu ms GPU thì quyết hạ/nâng theo tải thật của máy, không theo nhịp.

/**
 * ĐƯỜNG TẢI: cửa sổ có từ 3 mẫu ms GPU trở lên. Nhịp rAF bị khóa theo màn hình và theo chế độ tiết kiệm pin, nên một laptop
 * yếu (GPU 20 ms, nhịp 33 ms) và một máy khóa 30 fps (GPU 5 ms, nhịp 33 ms) trông y hệt nhau. Thời gian GPU thật tách được
 * hai trường hợp: máy là nút cổ chai thì hạ; trình duyệt khóa nhịp thì vào "bị khóa nhịp" ngay mà không hạ gì; máy dư sức
 * thì nâng lại, kể cả khi nhịp đang bị khóa. Tải là thời gian máy thật sự bận cho một khung, không bị khóa theo màn hình.
 * @param {import('./tuner.js').TunerCore} t  trạng thái và các bước dùng chung của hai đường (tuner.js)
 * @param {number} avg   trung bình khoảng giữa hai khung của cửa sổ (ms)
 * @param {number} load  max(trung vị ms GPU, trung bình ms CPU) của cửa sổ
 * @param {number} applied
 * @param {number} steps
 * @returns {'down' | 'up' | null}
 */
export function byLoad(t, avg, load, applied, steps) {
  const { o, budgetMs } = t;
  const over = t.guarding ? load > budgetMs * o.severe : avg > budgetMs * o.near && load > budgetMs * o.busy;
  const spare = !t.guarding && load < budgetMs * o.light;
  t.overRun = over ? t.overRun + 1 : 0;
  t.spareRun = spare ? t.spareRun + 1 : 0;
  if (t.capped && avg <= budgetMs * o.near) t.uncap();
  else if (!t.capped && avg > budgetMs * o.over && load < budgetMs * o.idle) {
    t.capped = true; // nhịp chậm mà máy nhàn: trình duyệt đang khóa nhịp. Không hạ gì, không phải hạ hết thang rồi trả lại
    t.capAvg = avg;
  }
  if (t.overRun >= o.downAfter && applied < steps) {
    t.overRun = 0;
    t.spareRun = 0;
    return t.down(applied, avg);
  }
  if (t.spareRun >= o.upAfter && applied > 0 && !t.locked.has(applied - 1)) {
    t.spareRun = 0;
    return t.up(applied);
  }
  return null;
}
