// paintings/cung-que/shared.js — setup() của Bức 3: cây đa bay khi giữ, lá rơi khi chạm (hàm thuần, tính thẳng từ thời gian), và Dial "Ngày âm lịch" (pha trăng).
import { uniform } from 'three/tsl';
import { mulberry32 } from '../../lib/random.js';
import { createLift } from './parts/cot-cay-bay.js';
import { PLANET, canopyHit, canopyRim } from './parts/cot-the-gioi.js';
import { createLeafFall } from './parts/la-da-roi.js';
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
  // Ô lá rơi: cấp theo trần của mức một lần; chạm ghi vào, lớp Lá đa đọc ra (spec §19.4 lớp 5)
  const leafFall = createLeafFall({ cap: ctx.budget.leaves ?? 64, radius: PLANET.radius });
  // Lá tự rụng khi không ai chạm: từ mép dưới của tán, chỗ tất định theo số thứ tự; tán ở độ cao bay của lúc rụng.
  // Giảm chuyển động thì thôi: chỉ còn lá do người xem chạm.
  const autoOrigin = (k, t0) => {
    const rand = mulberry32(911 + k);
    return canopyRim(rand(), rand(), flight.height(t0));
  };
  return {
    shared: { lift, flight, day, leafFall },
    // Nhãn của Dial chỉ là số ngày; tên pha (trăng mới, thượng huyền, rằm, hạ huyền) là ghi chú, chữ ở content.dials.ngay.notes.
    dials: [{ id: 'ngay', uniform: day, min: 1, max: 30, step: DAY_STEP, format: formatDay, note: () => phaseNote(day.value) }],
    // Thời điểm là đồng hồ của cảnh (tất định với ?freeze). Vuốt và chạm đúp không làm gì riêng (spec §19.2).
    onGesture(g) {
      const t = ctx.u.time.value;
      if (g.kind === 'hold-start') flight.grip(t);
      else if (g.kind === 'hold-end') flight.release(t);
      else if (g.kind === 'tap') {
        // Lá rơi từ điểm trên tán gần tia chạm nhất; tán đang ở độ cao bay của lúc chạm (spec §19.2)
        const { origin: o, direction: d } = g.ray;
        leafFall.burst(t, canopyHit([o.x, o.y, o.z], [d.x, d.y, d.z], flight.height(t)));
      }
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại.
    update(dt, t) {
      lift.value = flight.height(t);
      if (!ctx.reducedMotion) leafFall.drift(t, autoOrigin);
    },
  };
}
