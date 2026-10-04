// paintings/den-keo-quan/layers/l5-keo-quan.js — Lớp 5 · Kéo quân: gobo atan(y, x) làm node bóng của đèn nến: bóng đoàn quân chạy trên vách, trần, sàn mà không thêm lượt vẽ nào.
import { float, mix, positionWorld, uniform, vec3 } from 'three/tsl';
import { createGobo } from '../parts/keo-quan-gobo.js';

export const id = 'keo-quan';

export const knobs = [
  // Tốc độ thường của trống (vòng/phút): trống quay trên CPU, tính thẳng từ thời gian (setup của bức), nên là núm 'js'.
  { id: 'speed', via: 'js', min: 0, max: 30, step: 0.5, value: 6 },
  { id: 'penumbra', min: 0, max: 2, step: 0.01, value: 1 },
  { id: 'strength', min: 0, max: 1, step: 0.01, value: 1 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (đèn, mặt nạ), shared.ngonNen (đèn, vị trí và cỡ lửa), shared.theta (setup); ghi shared.keoQuan
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
  // Node bóng của đèn nến (Ngọn nến dựng, giữ chỗ bằng 1): ánh sáng tới mỗi điểm nhân với phần lọt qua đoàn quân. Trộn theo
  // trọng số, nên mài lớp về 0 là hết bóng mà không biên dịch lại. Gán TRƯỚC lần biên dịch đầu: node bóng dựng một lần rồi giữ.
  light.shadow.shadowNode = light.shadow.shadowNode.mul(mix(float(1), gobo.all(positionWorld), w));
  shared.keoQuan = { gobo, u };
  // Tốc độ thường: lớp nối vào trống của setup khi trống quay theo cử chỉ; lúc này trống quay đều (shared.js).
  let speed = ctx.knobValue('speed');
  // Vách sau cách trục D (m): bóng to gấp D / r; nửa tối trên vách = cỡ lửa × (D − r) / r (tam giác đồng dạng).
  const D = lantern.axis[1] + room.half;
  const r = lantern.drum.r;

  return {
    objects: [],
    onKnob: {
      speed: (v) => { speed = v; }, // @knob speed
    },
    experiments: [
      // Bóng cứng ở mọi khoảng cách: cỡ nguồn sáng về gần 0.
      { id: 'pointLight', toggle: (on) => { u.point.value = on ? 1 : 0; } },
      // Lấy góc của chính P thay cho giao tia: đúng khi lửa đứng yên trên trục, sai khi lửa chao.
      { id: 'naive', toggle: (on) => { u.naive.value = on ? 1 : 0; } },
    ],
    readouts: [
      { id: 'magnify', get: () => Math.round((D / r) * 10) / 10, unit: '×' },
      {
        id: 'penumbra',
        get: () => Math.round(size.value * u.penumbra.value * (1 - u.point.value) * ((D - r) / r) * 100),
        unit: 'cm',
      },
    ],
    dispose() {},
  };
}
