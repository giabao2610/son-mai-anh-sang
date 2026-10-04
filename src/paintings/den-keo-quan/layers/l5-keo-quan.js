// paintings/den-keo-quan/layers/l5-keo-quan.js — Lớp 5 · Kéo quân: gobo atan(y, x) làm node bóng của đèn nến: bóng đoàn quân chạy trên vách, trần, sàn mà không thêm lượt vẽ nào.
import { float, mix, positionWorld, uniform, vec3 } from 'three/tsl';
import { createGobo } from '../parts/keo-quan-gobo.js';
import { rpmToOmega } from '../parts/keo-quan-quay.js';
import { createRealShadow } from '../parts/keo-quan-that.js';

export const id = 'keo-quan';

export const knobs = [
  // Tốc độ thường của trống (vòng/phút): trống quay trên CPU, tính thẳng từ thời gian (setup của bức), nên là núm 'js'.
  { id: 'speed', via: 'js', min: 0, max: 30, step: 0.5, value: 6 },
  { id: 'penumbra', min: 0, max: 2, step: 0.01, value: 1 },
  { id: 'strength', min: 0, max: 1, step: 0.01, value: 1 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (đèn, mặt nạ, material giấy), shared.ngonNen (đèn, vị trí và cỡ lửa), shared.theta,
 *   shared.spin (setup); ghi shared.keoQuan
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { lantern, mask, room } = shared.cot;
  const { light, candle, size } = shared.ngonNen;
  const u = {
    naive: uniform(0).setName('goboNaive'),
    point: uniform(0).setName('goboPoint'),
    penumbra: ctx.knob('penumbra'), // @knob penumbra
    strength: ctx.knob('strength'), // @knob strength
  };
  const gobo = createGobo({ lantern, mask, candle, rest: vec3(...lantern.flame), size, theta: shared.theta, u });
  // Bật "Shadow map thật" thì đèn nến thôi mang bóng gobo: bóng hình nhân do đèn thật lo (xem update()).
  const goboReal = uniform(0).setName('goboReal');
  // Node bóng của đèn nến (Ngọn nến dựng, giữ chỗ bằng 1): ánh sáng tới mỗi điểm nhân với phần lọt qua đoàn quân. Trộn theo
  // trọng số, nên mài lớp về 0 là hết bóng mà không biên dịch lại. Gán TRƯỚC lần biên dịch đầu: node bóng dựng một lần rồi giữ.
  light.shadow.shadowNode = light.shadow.shadowNode.mul(mix(float(1), gobo.all(positionWorld), w.mul(float(1).sub(goboReal))));
  // Ánh sáng xuyên giấy (lớp Giấy, đứng trước lớp này nên node đã có) cũng bị hình nhân che: đoàn quân chạy cả trên giấy.
  const paper = shared.cot.materials.giay;
  paper.emissiveNode = paper.emissiveNode.mul(mix(float(1), gobo.figures(positionWorld), w));
  shared.keoQuan = { gobo, u };
  // Tốc độ thường của trống theo núm (setup dựng trống ở tốc độ mặc định; giảm chuyển động thì chậm còn shared.slow).
  const { spin, slow } = shared;
  spin.setBase(0, rpmToOmega(ctx.knobValue('speed')) * slow);
  // Vách sau cách trục D (m): bóng to gấp D / r; nửa tối trên vách = cỡ lửa × (D − r) / r (tam giác đồng dạng).
  const D = lantern.axis[1] + room.half;
  const r = lantern.drum.r;
  // "Shadow map thật": đèn thứ hai dựng lười; mức thấp (budget.shadowMap = 0) không có thí nghiệm này.
  const mapSize = ctx.budget.shadowMap ?? 0;
  const real = mapSize > 0 ? createRealShadow(ctx, { source: light, size: mapSize }) : null;
  let realOn = false;

  return {
    objects: [],
    update() {
      // Chạy sau Ngọn nến (thứ tự lớp), nên cường độ của đèn nến trong khung này vừa được ghi (không cộng dồn qua các khung). Bật
      // bóng thật thì hai đèn hòa theo trọng số: đèn nến (mang màu giấy, không còn gobo) giữ 1 − w, đèn thật (bóng thật) nhận w.
      // Mài Kéo quân về 0 là về đúng bốn lớp dưới: còn đèn nến với màu giấy, không bóng hình nhân.
      const k = w.value;
      if (realOn) light.intensity *= 1 - k;
      real?.sync({ power: shared.ngonNen.power.value * k, on: realOn, strength: u.strength.value });
    },
    onKnob: {
      speed: (v) => spin.setBase(ctx.u.time.value, rpmToOmega(v) * slow), // @knob speed
    },
    experiments: [
      // Bóng cứng ở mọi khoảng cách: cỡ nguồn sáng về gần 0.
      { id: 'pointLight', toggle: (on) => { u.point.value = on ? 1 : 0; } },
      // Lấy góc của chính P thay cho giao tia: đúng khi lửa đứng yên trên trục, sai khi lửa chao.
      { id: 'naive', toggle: (on) => { u.naive.value = on ? 1 : 0; } },
      // So với cách thường làm: cube shadow map (6 lượt vẽ bóng mỗi khung). Lần bật đầu khựng một nhịp vì biên dịch lại.
      ...(real ? [{
        id: 'shadowMap',
        kind: 'compare',
        toggle(on) {
          real.toggle(on); // dựng đèn trước: lỗi lúc dựng thì trạng thái vẫn là tắt, đèn nến không bị tắt oan
          realOn = on;
          goboReal.value = on ? 1 : 0;
        },
      }] : []),
    ],
    readouts: [
      // Tốc độ lúc này (vòng/phút, một chữ số thập phân): đọc thẳng từ công thức của trống, không đếm theo khung.
      { id: 'rpm', get: () => Math.round((spin.speed(ctx.u.time.value) * 600) / (2 * Math.PI)) / 10 },
      { id: 'magnify', get: () => Math.round((D / r) * 10) / 10, unit: '×' },
      {
        id: 'penumbra',
        get: () => Math.round(size.value * u.penumbra.value * (1 - u.point.value) * ((D - r) / r) * 100),
        unit: 'cm',
      },
    ],
    dispose() {
      real?.dispose();
    },
  };
}
