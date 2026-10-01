// engine/gpu/ladder.js — thang nấc cụ thể của MỘT cảnh: 'dpr' nở thành nhiều nấc −0,25; '<lớp>.<nấc>' lấy từ layer.degrade. Áp như ngăn xếp.

/** Mỗi nấc 'dpr' bớt chừng này, và không xuống dưới sàn (dưới 1 thì ảnh nhòe thấy rõ). */
export const DPR_STEP = 0.25;
export const DPR_FLOOR = 1;

/** Các trần DPR của nấc 'dpr', từ DPR thật lúc dựng xuống sàn: 2 → [1.75, 1.5, 1.25, 1]; 1 → []. */
export function dprSteps(start) {
  const out = [];
  for (let d = start - DPR_STEP; d >= DPR_FLOOR - 1e-9; d -= DPR_STEP) out.push(Math.round(d * 100) / 100);
  return out;
}

/**
 * Dựng thang nấc từ `painting.quality.ladder` (thiếu thì chỉ có 'dpr'). Mục nào không có lớp nào đưa ra ở mức hiện tại
 * (ví dụ nấc bóng ở mức thấp đã tắt bóng) thì bỏ qua: thang chỉ gồm những nấc có tác dụng.
 *
 * Nấc được áp theo kiểu ngăn xếp: down() áp nấc kế tiếp, up() gỡ nấc vừa áp gần nhất, reset() gỡ hết theo thứ tự ngược.
 * Nấc chỉ hạ TRẦN (spec §8.4): lớp tự tính hiệu lực = min(núm, trần), nên ý của người xem vẫn còn nguyên.
 *
 * @param {object} p
 * @param {string[]} [p.ladder]   ['dpr', 'mat-nuoc.phan-chieu', …]
 * @param {{ id: string, layer: { degrade?: { id: string, apply: () => void, revert: () => void }[] } }[]} p.layers  kết quả buildLayers
 * @param {{ dpr: () => number, setDpr: (max: number) => void }} p.stage
 * @param {number} p.dpr          trần DPR của mức (budget.dpr): nấc dpr đầu tiên gỡ ra thì trả về đúng số này
 */
export function createLadder({ ladder = ['dpr'], layers, stage, dpr }) {
  const steps = [];
  for (const entry of ladder) {
    if (entry === 'dpr') {
      let previous = dpr;
      for (const d of dprSteps(stage.dpr())) {
        const back = previous;
        steps.push({ id: `dpr=${d}`, apply: () => stage.setDpr(d), revert: () => stage.setDpr(back) });
        previous = d;
      }
      continue;
    }
    const dot = entry.indexOf('.');
    const layerId = entry.slice(0, dot);
    const stepId = entry.slice(dot + 1);
    const step = layers.find((b) => b.id === layerId)?.layer.degrade?.find((s) => s.id === stepId);
    if (step) steps.push({ id: entry, apply: () => step.apply(), revert: () => step.revert() });
  }

  let applied = 0;
  const ladderApi = {
    /** Tổng số nấc có trong thang. */
    get steps() {
      return steps.length;
    },
    /** Số nấc đang áp (luôn là những nấc ĐẦU của thang). */
    get applied() {
      return applied;
    },
    /** Id các nấc đang áp, theo thứ tự đã áp: __sma.quality() và huy hiệu đọc. */
    ids: () => steps.slice(0, applied).map((s) => s.id),
    /** Id của nấc thứ `index` trong thang (bộ điều chỉnh nói nấc bị khóa bằng chỉ số). */
    idAt: (index) => steps[index]?.id ?? null,
    /** Áp nấc kế tiếp. false khi đã hết thang. */
    down() {
      if (applied >= steps.length) return false;
      steps[applied].apply();
      applied += 1;
      return true;
    },
    /** Gỡ nấc vừa áp gần nhất. false khi không còn nấc nào. */
    up() {
      if (applied === 0) return false;
      applied -= 1;
      steps[applied].revert();
      return true;
    },
    /** Gỡ mọi nấc, theo thứ tự ngược lúc áp. */
    reset() {
      while (ladderApi.up());
    },
  };
  return ladderApi;
}
