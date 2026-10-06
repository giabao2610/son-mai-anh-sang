// paintings/dan-ga-me-con/shared.js — setup() của Bức 4: đàn gà tính thẳng từ thời gian (mốc rắc, giữ, thả, bới); chạm rắc thóc, giữ gọi con.
import { LAYOUT, floorPoint } from './parts/cot-bo-cuc.js';
import { createFlock } from './parts/dan-ga-song.js';

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  // Giảm chuyển động: chạy, đi chậm còn một nửa; gà mẹ không bới. Nhúm thóc lúc mở trang vẫn có.
  const flock = createFlock(LAYOUT, { reduced: ctx.reducedMotion });
  const danGa = ctx.weight('dan-ga'); // trọng số của lớp Đàn gà
  return {
    shared: { flock },
    // Thời điểm là đồng hồ của cảnh (tất định với ?freeze). Hợp đồng của đàn gà (dan-ga-song.js#drift): drift(t) chạy TRƯỚC mọi cử chỉ
    // của khung, mà xưởng giao cử chỉ trước setup.update, nên gọi ở đây (cùng t, gọi lại không thêm gì). Không thì cú chạm đầu sau 25 giây
    // lặng xóa lần gà mẹ bới đã tới hạn, và cử chỉ mang thời điểm cũ viết lại các khung đã vẽ.
    // Điểm chạm luôn hữu hạn và trong sàn (floorPoint kẹp mọi tia, kể cả tia hỏng): đàn gà ném lỗi với điểm không hữu hạn, mà lỗi trong
    // khung thì dừng cảnh. Vuốt và chạm đúp không làm gì riêng: chạm đúp là hai 'tap', hai nắm thóc.
    // Lớp Đàn gà mài về 0 (gà đứng như tượng, thóc bị bỏ): chạm và giữ không làm gì; không thì đàn gà vẫn chạy, mổ nền trống mà không ai
    // thấy, phủ lại lớp là thấy gà mổ đất, và số đo dangAn, quanhMe báo việc không ai thấy. Thả thì luôn tới đàn gà: thả mà chưa giữ thì đàn
    // gà bỏ qua, còn cái giữ bắt đầu lúc lớp còn phủ phải được thả, không thì gà mẹ xòe cánh mãi. Gà mẹ bới (drift) vẫn theo đồng hồ.
    onGesture(g) {
      const t = ctx.u.time.value;
      flock.drift(t);
      const on = danGa.value > 0;
      if (g.kind === 'tap' && on) flock.scatter(t, floorPoint(g.ray), Math.round(t * 60));
      else if (g.kind === 'hold-start' && on) flock.grip(t);
      else if (g.kind === 'hold-end') flock.release(t);
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại (drift dạng đóng: gọi lại cùng t không thêm gì).
    update(dt, t) {
      flock.drift(t);
    },
  };
}
