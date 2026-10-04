// paintings/den-keo-quan/layers/l3-gian-nha.js — Lớp 3 · Gian nhà: sơn gian nhà và chiếc đèn bằng texture thủ tục (gạch bát, vôi loang, vân gỗ, tre, sơn son).
import { min, uniform } from 'three/tsl';
import { MAX_OCTAVES } from '../../../lib/tsl/noise.js';
import { paintRoom } from '../parts/gian-nha-vat-lieu.js';

export const id = 'gian-nha';

export const knobs = [
  { id: 'tileSize', min: 0.2, max: 0.6, step: 0.01, value: 0.3 },
  { id: 'stain', min: 0, max: 1, step: 0.01, value: 0.5 },
  { id: 'grain', min: 0, max: 1, step: 0.01, value: 0.6 },
  { id: 'clearcoat', min: 0, max: 1, step: 0.01, value: 0.8 },
  // Số tầng noise là UNIFORM: fbm chạy vòng lặp thật trong shader, nên đổi số tầng không biên dịch lại (như sương của Bức 1).
  // Mức thấp kéo tối đa 3 tầng: vôi phủ gần hết khung hình.
  { id: 'octaves', min: 1, max: (env) => (env.level === 'thap' ? 3 : MAX_OCTAVES), step: 1, value: (env) => env.budget.octaves ?? 3 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot.materials (Cốt); lớp không thêm vật nào, chỉ sơn material của Cốt
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  // Số octave chạy thật = min(núm, trần). Trần do nấc 'chi-tiet' đặt: nấc chỉ hạ TRẦN, không ghi vào núm (ý người xem).
  const octaveCap = uniform(MAX_OCTAVES).setName('gian_nha_octaveCap');
  const u = {
    tileSize: ctx.knob('tileSize'), // @knob tileSize
    stain: ctx.knob('stain'), // @knob stain
    grain: ctx.knob('grain'), // @knob grain
    clearcoat: ctx.knob('clearcoat'), // @knob clearcoat
    octaves: min(ctx.knob('octaves'), octaveCap), // @knob octaves
  };
  const { flat, raw } = paintRoom(ctx, shared.cot.materials, { w, u });

  return {
    objects: [],
    experiments: [
      { id: 'flat', toggle: (on) => { flat.value = on ? 1 : 0; } },
      { id: 'rawTiles', toggle: (on) => { raw.value = on ? 1 : 0; } },
    ],
    readouts: [{ id: 'octaves', get: () => Math.min(ctx.knob('octaves').value, octaveCap.value) }],
    // Chỉ có khi mức này chạy hơn 1 octave: lớp chỉ đưa nấc có tác dụng ở mức hiện tại.
    degrade: (ctx.budget.octaves ?? 3) > 1 ? [
      {
        id: 'chi-tiet',
        apply() { octaveCap.value = 1; },
        revert() { octaveCap.value = MAX_OCTAVES; },
      },
    ] : [],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
