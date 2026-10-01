// engine/gpu/dial-set.js — núm của cả bức (Dial): đọc/ghi uniform (kẹp min/max, làm tròn theo step), chữ giá trị, ghi chú, snapshot.

/**
 * Xưởng không biết Dial nghĩa là gì (giờ của Bức 1, mùa của một bức khác…): nó chỉ biết một uniform, khoảng giá trị,
 * cách ghi chữ (`format`) và khóa ghi chú (`note`). Đổi Dial chỉ đổi `.value` của uniform: không biên dịch lại.
 * @param {import('../contracts/runtime.js').Dial[]} [dials]  setup().dials của bức
 */
export function createDialSet(dials = []) {
  const byId = new Map();
  for (const dial of dials) {
    if (byId.has(dial.id)) throw new Error(`Bức khai báo Dial "${dial.id}" hai lần`);
    byId.set(dial.id, dial);
  }
  const dialOf = (id) => {
    const dial = byId.get(id);
    if (!dial) throw new Error(`Bức không có Dial "${id}"`);
    return dial;
  };
  /** Kẹp trong [min, max], rồi về nấc gần nhất tính từ min (0,25 giờ là 15 phút). */
  const snap = (dial, raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`Dial "${dial.id}": "${raw}" không phải số`);
    const clamped = Math.min(Math.max(v, dial.min), dial.max);
    if (!dial.step) return clamped;
    const stepped = dial.min + Math.round((clamped - dial.min) / dial.step) * dial.step;
    return Math.min(Number(stepped.toFixed(6)), dial.max);
  };
  const set = (id, v) => {
    const dial = dialOf(id);
    dial.uniform.value = snap(dial, v);
  };

  return {
    /** Mỗi Dial: khoảng giá trị, giá trị hiện tại, chữ của nó (cũng là aria-valuetext) và khóa ghi chú (null: không có). */
    list: () => [...byId.values()].map((d) => ({
      id: d.id,
      min: d.min,
      max: d.max,
      step: d.step,
      value: d.uniform.value,
      text: d.format ? d.format(d.uniform.value) : String(d.uniform.value),
      note: d.note?.() ?? null,
    })),
    set,
    /** { dialId: số } cho snapshot của tác phẩm. */
    snapshot: () => Object.fromEntries([...byId.values()].map((d) => [d.id, d.uniform.value])),
    /** Áp lại snapshot; Dial lạ hay giá trị hỏng thì bỏ qua kèm cảnh báo ("Dựng lại cảnh" không vì thế mà về tĩnh). */
    restore(values = {}) {
      for (const [id, v] of Object.entries(values)) {
        try {
          set(id, v);
        } catch (err) {
          console.warn(`restore: bỏ qua Dial "${id}":`, err.message);
        }
      }
    },
    get size() {
      return byId.size;
    },
  };
}
