// paintings/den-keo-quan/shared.js — setup() của Bức 2: trống quay và ngọn lửa (hàm thuần, tính thẳng từ thời gian), và ba cử chỉ: chạm thổi nến, giữ dừng trống, vuốt gạt trống.
import { Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { createSpin, flickOf, rpmToOmega } from './parts/keo-quan-quay.js';
import { createFlame } from './parts/ngon-nen-thoi.js';

/** Tốc độ thường của trống lúc dựng (vòng/phút); lớp Kéo quân đặt lại theo núm speed ngay khi dựng. */
const BASE_RPM = 6;

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const slow = ctx.reducedMotion ? 0.5 : 1; // §18.2: giảm chuyển động thì trống quay chậm còn một nửa
  const spin = createSpin({ omega: rpmToOmega(BASE_RPM) * slow });
  const flame = createFlame({ reduced: ctx.reducedMotion });
  const theta = uniform(0).setName('drumAngle');
  const forward = new Vector3();
  return {
    shared: { spin, flame, theta, slow },
    // Chạm ở đâu cũng được: cả căn phòng là của ngọn đèn. Thời điểm là đồng hồ của cảnh (tất định với ?freeze).
    onGesture(g) {
      const t = ctx.u.time.value;
      if (g.kind === 'tap') {
        ctx.camera.getWorldDirection(forward); // thổi theo hướng nhìn, chiếu xuống mặt sàn
        const len = Math.hypot(forward.x, forward.z) || 1;
        flame.blow(t, [forward.x / len, forward.z / len]);
      } else if (g.kind === 'hold-start') {
        spin.grip(t);
      } else if (g.kind === 'hold-end') {
        spin.release(t);
      } else if (g.kind === 'swipe') {
        spin.flick(t, flickOf(g.velocity) * slow);
      }
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại.
    update(dt, t) {
      theta.value = spin.angle(t);
    },
  };
}
