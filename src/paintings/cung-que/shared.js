// paintings/cung-que/shared.js — setup() của Bức 3: cây đa bay khi giữ (hàm thuần, tính thẳng từ thời gian) và độ cao bay dùng chung cho hình SDF và số đo.
import { uniform } from 'three/tsl';
import { createLift } from './parts/cot-cay-bay.js';

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const lift = uniform(0).setName('treeLift');
  const flight = createLift({ reduced: ctx.reducedMotion }); // giảm chuyển động: bay lên và hạ xuống chậm còn một nửa
  return {
    shared: { lift, flight },
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
