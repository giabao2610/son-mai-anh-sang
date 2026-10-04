// paintings/den-keo-quan/layers/l2-ngon-nen.js — Lớp 2 · Ngọn nến: đèn thật đặt ở ngọn lửa (suy giảm theo bình phương khoảng cách), mang node bóng mà lớp Giấy và Kéo quân góp vào.
import { PointLight, Vector3 } from 'three/webgpu';
import { float, uniform } from 'three/tsl';

export const id = 'ngon-nen';

export const knobs = [
  // Cường độ đèn là thuộc tính JS của PointLight (three đọc mỗi khung), nên đổi không biên dịch lại: núm 'js'.
  { id: 'intensity', via: 'js', min: 0, max: 20, step: 0.1, value: 4 },
];

/** Đèn xưởng còn lại bao nhiêu khi nến sáng hẳn: một chút ánh đêm để chỗ bóng không đen kịt (luật 3). */
const NIGHT = 0.1;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (lớp trước), shared.flame (setup); ghi shared.ngonNen
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { lantern, hemi, hemiIntensity } = shared.cot;
  const rest = new Vector3(...lantern.flame);
  const candle = uniform(rest.clone()).setName('candlePos');
  const power = uniform(0).setName('candlePower');
  const size = uniform(0.01).setName('flameSize'); // cỡ ngọn lửa (m) = cỡ nguồn sáng của gobo
  // decay 2: ánh sáng giảm theo bình phương khoảng cách (vật lý). distance 0: không cắt ở tầm nào.
  const light = new PointLight(ctx.palette.hex.vangLaSang, 0, 0, 2);
  light.position.copy(rest);
  // Bật MỘT lần lúc dựng (castShadow và shadowMap.enabled nằm trong cache key). Có node bóng tự viết thì three dùng node đó thay
  // cho shadow map: không có render target, không lượt vẽ bóng nào (spec Phụ lục A.77). Giữ chỗ bằng 1; lớp Giấy và Kéo quân
  // nhân thêm vào trước khi biên dịch.
  ctx.renderer.shadowMap.enabled = true;
  light.castShadow = true;
  light.shadow.shadowNode = float(1);
  ctx.scene.add(light);
  shared.ngonNen = { light, candle, rest, power, size };
  let intensity = ctx.knobValue('intensity');
  const backWall = lantern.axis[1] + shared.cot.room.half; // từ trục tới vách sau z = −half (m)

  let disposed = false;
  return {
    objects: [],
    update(dt, t) {
      const k = w.value;
      const f = shared.flame.at(t);
      candle.value.set(rest.x + f.offset[0], rest.y + f.offset[1], rest.z + f.offset[2]);
      light.position.copy(candle.value);
      power.value = intensity * f.glow * k;
      light.intensity = power.value;
      hemi.intensity = hemiIntensity * (1 - k * (1 - NIGHT));
    },
    onKnob: {
      intensity: (v) => { intensity = v; }, // @knob intensity
    },
    experiments: [
      // decay là uniform của three (PointLightNode đọc mỗi khung): đổi không biên dịch lại (Phụ lục A.78).
      { id: 'noDecay', toggle: (on) => { light.decay = on ? 0 : 2; } },
    ],
    readouts: [
      { id: 'backWall', get: () => Math.round(100 / backWall ** 2), unit: '%' },
      // Lửa ngả bao nhiêu vì bị thổi (mm), tính thẳng từ thời gian như vị trí của đèn.
      { id: 'lean', get: () => Math.round(shared.flame.at(ctx.u.time.value).lean * 1000), unit: 'mm' },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(light);
      light.dispose();
    },
  };
}
