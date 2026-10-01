// engine/gpu/meter.js — số đo của xưởng cho Sổ tay và __sma: draw call, tam giác, ms khung, ms CPU, ms GPU; tách theo trạng thái của thí nghiệm 'compare'.

/** Sau mỗi lần bật/tắt thí nghiệm 'compare', bỏ chừng này ms đầu (còn biên dịch, còn dựng) rồi mới ghi số đo. */
export const COMPARE_SKIP_MS = 250;
const ema = (prev, v) => prev * 0.9 + v * 0.1; // trung bình trượt: số mới góp 10%

/**
 * Bàn thợ (studio.js) giữ một bộ đo. scene.js đưa số vào: measure() cuối mỗi khung, gpu() mỗi khi gpu-timer có mẫu
 * (mẫu GPU về trễ vài khung). Thí nghiệm 'compare' có hai bên "Tắt / Bật": số đo ghi vào bên đang bật, bỏ 0,25 s đầu sau
 * mỗi lần đổi. Một mẫu GPU về trong khoảng bỏ qua đó có thể là của khung trước lúc đổi, nên cũng bị bỏ.
 * @param {string[]} [compareKeys]  'layerId.expId' của mọi thí nghiệm 'compare'
 */
export function createMeter(compareKeys = []) {
  const stats = { drawCalls: 0, triangles: 0, ms: 0, cpuMs: 0, gpuMs: null };
  let lastWall = null;
  // side: bên đang đo; fresh: vừa đổi, lần đo tới đặt mốc bỏ qua.
  const compares = new Map(compareKeys.map((key) => [key, { side: 'off', off: null, on: null, fresh: true, skipUntil: 0 }]));
  const settled = (c) => !c.fresh && lastWall !== null && lastWall >= c.skipUntil;

  return {
    /** Số đo của khung vừa vẽ: draw call, tam giác, ms giữa hai khung, ms CPU, ms GPU (trung bình trượt; null: chưa đo được). */
    stats: () => ({ ...stats }),
    /**
     * Cuối mỗi khung. `info` là renderer.info (three tự reset đầu mỗi khung của vòng lặp), `wallMs` là đồng hồ tường:
     * ms đo khung thật, kể cả khi ?freeze giữ đồng hồ của cảnh ở 1/60 s. `cpuMs`: luồng chính bận bao lâu cho khung đó;
     * ms giữa hai khung bị khóa theo nhịp màn hình, còn ms CPU lộ ngay phần việc của JS.
     */
    measure(info, wallMs, cpuMs = 0) {
      stats.drawCalls = info.render.drawCalls;
      stats.triangles = info.render.triangles;
      stats.cpuMs = stats.cpuMs === 0 ? cpuMs : ema(stats.cpuMs, cpuMs);
      if (lastWall !== null) {
        const dt = wallMs - lastWall;
        stats.ms = stats.ms === 0 ? dt : ema(stats.ms, dt);
        for (const c of compares.values()) {
          if (c.fresh) {
            c.fresh = false;
            c.skipUntil = wallMs + COMPARE_SKIP_MS;
          }
          if (wallMs < c.skipUntil) continue;
          const prev = c[c.side];
          c[c.side] = prev ? { ...prev, ms: ema(prev.ms, dt), cpuMs: ema(prev.cpuMs, cpuMs) } : { ms: dt, cpuMs, gpuMs: null };
        }
      }
      lastWall = wallMs;
    },
    /** Một mẫu ms GPU (gpu-timer.js); null khi máy thôi đo được giữa phiên: Sổ tay về "—" (cột so sánh giữ số đã đo). */
    gpu(ms) {
      if (ms === null) {
        stats.gpuMs = null;
        return;
      }
      stats.gpuMs = stats.gpuMs === null ? ms : ema(stats.gpuMs, ms);
      for (const c of compares.values()) {
        const side = c[c.side];
        if (side && settled(c)) side.gpuMs = side.gpuMs === null ? ms : ema(side.gpuMs, ms);
      }
    },
    /** Thí nghiệm 'compare' vừa đổi trạng thái: số đo sau đây ghi vào bên mới, bỏ 0,25 s đầu. */
    toggled(key, on) {
      const c = compares.get(key);
      if (!c) return;
      c.side = on ? 'on' : 'off';
      c.fresh = true;
    },
    /** { off, on }, mỗi bên { ms, cpuMs, gpuMs } hay null khi chưa đo. Thí nghiệm không phải 'compare' thì cả hai là null. */
    compare(key) {
      const c = compares.get(key);
      return { off: c?.off ? { ...c.off } : null, on: c?.on ? { ...c.on } : null };
    },
  };
}
