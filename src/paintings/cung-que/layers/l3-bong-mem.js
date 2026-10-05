// paintings/cung-que/layers/l3-bong-mem.js — Lớp 3 · Bóng mềm của Bức 3: bóng có nửa tối và AO, dò bằng chính trường khoảng cách của Cốt; không shadow map, không đèn.
import { float, int, mix, uniform } from 'three/tsl';
import { ambientOcclusion, softShadow } from '../parts/bong-mem-tia.js';

export const id = 'bong-mem';

export const knobs = [
  // k của bóng mềm (Quilez): nhỏ thì nửa tối rộng, lớn thì bóng sắc (spec §19.4 lớp 3).
  { id: 'softness', min: 2, max: 32, step: 0.5, value: 8 },
  // Độ đậm của AO: 0 là không che, 1 là che đủ.
  { id: 'ao', min: 0, max: 1, step: 0.01, value: 0.8 },
];

/** k của thí nghiệm "Bóng cứng": nửa tối gần như biến mất. */
const HARD_K = 128;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  Cốt có shared.cot (scene, recipe); Mặt trời có shared.matTroi (sunDir)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const softness = ctx.knob('softness'); // @knob softness
  const aoKnob = ctx.knob('ao'); // @knob ao
  const hard = uniform(0).setName('bongMemHard');
  // Số bước dò bóng và số mẫu AO theo mức; nấc chi-tiet hạ trần (uniform), không ghi vào núm
  const fullShadow = ctx.budget.shadowSteps ?? 32;
  const fullAo = ctx.budget.ao ?? 5;
  const shadowCap = uniform(fullShadow).setName('bongMemShadowCap');
  const aoCap = uniform(fullAo).setName('bongMemAoCap');
  const { recipe, scene, bounds } = shared.cot;
  const { sunDir } = shared.matTroi;
  const k = mix(softness, float(HARD_K), hard);

  const shadow = softShadow(scene, bounds);
  const occlusion = ambientOcclusion(scene);
  // Bọc recipe (spec §19.4): bóng nhân vào phần nắng không bị che, AO nhân vào ánh nền. w = 0 thì như chưa có lớp này.
  const prevVisibility = recipe.visibility;
  recipe.visibility = (h) => prevVisibility(h).mul(mix(float(1), shadow(h.p, h.n, sunDir, k, int(shadowCap)), w));
  const prevOcclusion = recipe.occlusion;
  recipe.occlusion = (h) => prevOcclusion(h).mul(mix(float(1), mix(float(1), occlusion(h.p, h.n, int(aoCap)), aoKnob), w));

  return {
    objects: [],
    experiments: [{ id: 'bongCung', toggle: (on) => { hard.value = on ? 1 : 0; } }],
    readouts: [
      { id: 'buocBong', get: () => shadowCap.value },
      { id: 'mauAo', get: () => aoCap.value },
    ],
    degrade: [
      {
        id: 'chi-tiet',
        apply() {
          shadowCap.value = Math.round(fullShadow / 2);
          aoCap.value = Math.max(2, Math.ceil(fullAo / 2));
        },
        revert() {
          shadowCap.value = fullShadow;
          aoCap.value = fullAo;
        },
      },
    ],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
