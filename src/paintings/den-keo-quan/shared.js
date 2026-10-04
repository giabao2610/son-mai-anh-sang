// paintings/den-keo-quan/shared.js — setup() của Bức 2: góc trống và trạng thái ngọn lửa (tạm: trống quay đều, lửa đứng yên; Task 5 thay bằng createSpin/createFlame và cử chỉ).
import { uniform } from 'three/tsl';

/**
 * setup() chạy TRƯỚC mọi createLayer; `shared` đi vào tham số thứ 2 của từng lớp.
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const theta = uniform(0).setName('drumAngle');
  // Tạm: lửa đứng yên (không nhấp nháy, không thổi). Task 5 thay bằng createFlame (parts/ngon-nen-thoi.js).
  const flame = { at: () => ({ offset: [0, 0, 0], glow: 1, lean: 0 }) };
  return {
    shared: { theta, flame },
    // Tạm: trống quay đều 0,6 rad/s, tính thẳng từ t (tất định với ?freeze). Task 5 thay bằng createSpin.
    update(dt, t) {
      theta.value = 0.6 * t;
    },
  };
}
