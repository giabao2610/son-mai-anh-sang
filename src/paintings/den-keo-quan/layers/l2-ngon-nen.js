// paintings/den-keo-quan/layers/l2-ngon-nen.js — Lớp 2 · Ngọn nến: đèn thật đặt ở ngọn lửa (suy giảm theo bình phương khoảng cách), ngọn lửa tự phát sáng, mang node bóng mà lớp Giấy và Kéo quân góp vào.
import { Color, PointLight, Vector2, Vector3 } from 'three/webgpu';
import { float, uniform } from 'three/tsl';
import { FLAME_SHAPE, createFlameMesh } from '../parts/ngon-nen-lua.js';

export const id = 'ngon-nen';

export const knobs = [
  // Cường độ đèn là thuộc tính JS của PointLight (three đọc mỗi khung), nên đổi không biên dịch lại: núm 'js'.
  { id: 'intensity', via: 'js', min: 0, max: 20, step: 0.1, value: 6.3 },
  // Cỡ ngọn lửa (m) cũng là cỡ nguồn sáng: lớp Kéo quân tính nửa tối theo nó. 4 mm: chân tay hình nhân còn đọc được trên vách.
  { id: 'flameSize', min: 0, max: 0.04, step: 0.001, value: 0.004 },
  // Nhấp nháy và sắc nến đi qua đèn thật (thuộc tính JS của PointLight) và createFlame trên CPU; shader của lửa (và của giấy) chỉ
  // đọc kết quả qua uniform. Vì vậy hai núm này là 'js'.
  { id: 'flicker', via: 'js', min: 0, max: 2, step: 0.05, value: 1 },
  { id: 'warmth', via: 'js', min: 0, max: 1, step: 0.01, value: 0.5 },
];

/** Đèn xưởng còn lại bao nhiêu khi nến sáng hẳn: một chút ánh đêm để chỗ bóng không đen kịt (luật 3). */
const NIGHT = 0.07;
/** Ánh đêm ngả về chàm (trên) và cánh gián (dưới) bao nhiêu: ngả hết thì bóng thành xanh tím và át mất ánh nến ấm. */
const TINT = 0.3;
const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
/** Cùng sắc với `c`, độ sáng bằng `y`. */
const withLuminance = (c, y) => c.clone().multiplyScalar(y / luminance(c));
/** Ngả màu `base` về sắc của `paint` một phần TINT, giữ nguyên độ sáng của `base` (độ sáng do NIGHT giữ). */
const tint = (base, paint) => withLuminance(base, 1).lerp(withLuminance(paint, 1), TINT).multiplyScalar(luminance(base));

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
  const size = ctx.knob('flameSize'); // @knob flameSize
  const color = uniform(new Color()).setName('candleColor');
  const lean = uniform(new Vector2()).setName('flameLean');
  const glow = uniform(1).setName('flameGlow');
  // decay 2: ánh sáng giảm theo bình phương khoảng cách (vật lý). distance 0: không cắt ở tầm nào.
  const light = new PointLight(0xffffff, 0, 0, 2);
  light.position.copy(rest);
  // Bật MỘT lần lúc dựng (castShadow và shadowMap.enabled nằm trong cache key). Có node bóng tự viết thì three dùng node đó thay
  // cho shadow map: không có render target, không lượt vẽ bóng nào (spec Phụ lục A.77). Giữ chỗ bằng 1; lớp Giấy và Kéo quân
  // nhân thêm vào trước khi biên dịch.
  ctx.renderer.shadowMap.enabled = true;
  light.castShadow = true;
  light.shadow.shadowNode = float(1);
  const flame = createFlameMesh(ctx, { w, color, lean, glow, base: [rest.x, lantern.candle.y1 + FLAME_SHAPE.gap, rest.z] });
  ctx.scene.add(light, flame.mesh);
  shared.ngonNen = { light, candle, rest, power, size, color };

  let intensity = ctx.knobValue('intensity');
  // Sắc nến: từ lửa cam tới vàng lá sáng. Đèn thật đổi màu bằng thuộc tính JS; lửa và giấy đọc cùng màu qua uniform candleColor.
  const [orange, gold] = [ctx.palette.color('lua'), ctx.palette.color('vangLaSang')];
  const paint = (warmth) => {
    light.color.lerpColors(orange, gold, warmth);
    color.value.copy(light.color);
  };
  paint(ctx.knobValue('warmth'));
  let flicker = ctx.knobValue('flicker');
  let steady = false;
  const applyFlicker = () => { shared.flame.flicker = steady ? 0 : flicker; };
  applyFlicker();
  // Đèn xưởng lui về ánh đêm: chàm ở trên, cánh gián ở dưới, độ sáng như đèn xưởng (luật 3: chỗ bóng không đen kịt).
  const studio = { sky: hemi.color.clone(), ground: hemi.groundColor.clone() };
  const night = { sky: tint(studio.sky, ctx.palette.color('cham')), ground: tint(studio.ground, ctx.palette.color('canhGian')) };
  const backWall = lantern.axis[1] + shared.cot.room.half; // từ trục tới vách sau z = −half (m)

  let disposed = false;
  return {
    objects: [flame.mesh],
    update(dt, t) {
      const k = w.value;
      const f = shared.flame.at(t);
      candle.value.set(rest.x + f.offset[0], rest.y + f.offset[1], rest.z + f.offset[2]);
      light.position.copy(candle.value);
      lean.value.set(f.offset[0], f.offset[2]);
      glow.value = f.glow;
      power.value = intensity * f.glow * k;
      light.intensity = power.value;
      // Chỉ đổi thuộc tính JS của đèn (three đọc mỗi khung), không đụng cache key. lerp từ màu gốc: không cộng dồn qua các khung.
      hemi.intensity = hemiIntensity * (1 - k * (1 - NIGHT));
      hemi.color.lerpColors(studio.sky, night.sky, k);
      hemi.groundColor.lerpColors(studio.ground, night.ground, k);
    },
    onKnob: {
      intensity: (v) => { intensity = v; }, // @knob intensity
      flicker: (v) => { flicker = v; applyFlicker(); }, // @knob flicker
      warmth: (v) => paint(v), // @knob warmth
    },
    experiments: [
      // decay là uniform của three (PointLightNode đọc mỗi khung): đổi không biên dịch lại (Phụ lục A.78).
      { id: 'noDecay', toggle: (on) => { light.decay = on ? 0 : 2; } },
      // Lửa đứng yên: không nhấp nháy (lần thổi vẫn có). Bật lại thì về đúng giá trị của núm.
      { id: 'steady', toggle: (on) => { steady = on; applyFlicker(); } },
    ],
    readouts: [
      // "Ánh sáng không suy giảm" (decay 0): vách xa sáng như một điểm cách đèn 1 m.
      { id: 'backWall', get: () => (light.decay === 0 ? 100 : Math.round(100 / backWall ** 2)), unit: '%' },
      // Lửa ngả bao nhiêu vì bị thổi (mm), tính thẳng từ thời gian như vị trí của đèn.
      { id: 'lean', get: () => Math.round(shared.flame.at(ctx.u.time.value).lean * 1000), unit: 'mm' },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(light, flame.mesh);
      light.dispose();
      flame.dispose();
    },
  };
}
