// paintings/cung-que/shared.js — setup() của Bức 3: cây đa bay khi giữ (hàm thuần, tính thẳng từ thời gian), độ cao bay dùng chung, và Dial "Ngày âm lịch" (pha trăng).
import { uniform } from 'three/tsl';
import { createLift } from './parts/cot-cay-bay.js';
import { defaultDay, formatDay, phaseNote } from './parts/mat-troi-pha.js';

/** Bước của Dial Ngày âm lịch (ngày). */
const DAY_STEP = 0.25;
const snap = (day) => 1 + Math.round((day - 1) / DAY_STEP) * DAY_STEP;

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const lift = uniform(0).setName('treeLift');
  const flight = createLift({ reduced: ctx.reducedMotion }); // giảm chuyển động: bay lên và hạ xuống chậm còn một nửa
  // Ngày âm lịch (1–30, có phần lẻ): mặc định là tuổi trăng của ctx.now (?at hay giờ thật), nên hành tinh sáng như trăng đêm nay.
  // Làm tròn về lưới bước của Dial (lệch tối đa 0,125 ngày, chừng 1,5° góc pha): ô trượt HTML làm tròn về lưới khi bấm phím, nên
  // mặc định lệch lưới thì một lần bấm mũi tên không cộng đúng một bước.
  const day = uniform(snap(defaultDay(ctx.now))).setName('lunarDay');
  return {
    shared: { lift, flight, day },
    // Nhãn của Dial chỉ là số ngày; tên pha (trăng mới, thượng huyền, rằm, hạ huyền) là ghi chú, chữ ở content.dials.ngay.notes.
    dials: [{ id: 'ngay', uniform: day, min: 1, max: 30, step: DAY_STEP, format: formatDay, note: () => phaseNote(day.value) }],
    // Thời điểm là đồng hồ của cảnh (tất định với ?freeze). Vuốt và chạm đúp không làm gì riêng (spec §19.2).
    onGesture(g) {
      const t = ctx.u.time.value;
      if (g.kind === 'hold-start') flight.grip(t);
      else if (g.kind === 'hold-end') flight.release(t);
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại.
    update(dt, t) {
      lift.value = flight.height(t);
    },
  };
}
