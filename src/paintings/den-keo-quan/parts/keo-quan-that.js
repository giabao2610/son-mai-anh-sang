// paintings/den-keo-quan/parts/keo-quan-that.js — của lớp Kéo quân: thí nghiệm "Shadow map thật": một đèn điểm thứ hai có cube shadow map, dựng ở lần bật đầu.
import { PointLight } from 'three/webgpu';

/** Camera của cube shadow map: trống chỉ cách lửa 9 cm (three mặc định thấy từ 0,5 m), vách xa nhất cách chừng 4 m. */
const NEAR = 0.02;
const FAR = 8;

/**
 * Đèn thứ hai chỉ được dựng khi người xem bật thí nghiệm lần đầu. Thêm một đèn là đổi bộ đèn nằm trong cache key của mọi material
 * (spec Phụ lục A.77), nên lần bật đầu biên dịch lại MỘT lần (khựng một nhịp). Từ đó tắt chỉ là intensity 0 và autoUpdate = false:
 * shadow map không được vẽ nữa, và không có gì phải biên dịch lại.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ source: any, size: number }} p  source: đèn nến (vị trí, màu); size: cỡ cube shadow map (budget.shadowMap)
 */
export function createRealShadow(ctx, { source, size }) {
  let real = null;
  return {
    get light() { return real; },
    toggle(on) {
      if (on && !real) {
        real = new PointLight(source.color, 0, 0, 2);
        real.castShadow = true; // PointShadowNode: cube shadow map, 6 lượt vẽ mỗi khung (trống quay nên không vẽ một lần rồi giữ)
        real.shadow.mapSize.set(size, size);
        real.shadow.camera.near = NEAR;
        real.shadow.camera.far = FAR;
        real.shadow.bias = -0.002;
        real.position.copy(source.position);
        ctx.scene.add(real);
      }
      if (real) real.shadow.autoUpdate = on;
    },
    /** Mỗi khung (kể cả update(0, t)): theo vị trí, màu, cường độ của đèn nến; bóng mờ theo trọng số của lớp. */
    sync({ power, weight, on }) {
      if (!real) return;
      real.position.copy(source.position);
      real.color.copy(source.color);
      real.intensity = on ? power : 0;
      real.shadow.intensity = weight; // reference() trong ShadowNode: đổi lúc chạy không biên dịch lại
    },
    dispose() {
      if (!real) return;
      ctx.scene.remove(real);
      real.dispose();
      real = null;
    },
  };
}
