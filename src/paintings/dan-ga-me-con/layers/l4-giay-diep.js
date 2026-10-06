// paintings/dan-ga-me-con/layers/l4-giay-diep.js — Lớp 4 · Giấy điệp của Bức 4: tờ giấy từ đất sét thành giấy dó quét điệp (sợi dó, vệt chổi xiên) và hạt điệp lóe lên theo góc nhìn (emissive); thí nghiệm Giấy dó trơn; nấc chi-tiet.
import { color, float, mix, uniform } from 'three/tsl';
import { glints, paperColor } from '../parts/giay-diep-mat.js';

export const id = 'giay-diep';

export const knobs = [
  { id: 'sparkle', min: 0, max: 4, step: 0.05, value: 1.2 },
  // Số ô mỗi đơn vị cảnh (một đơn vị là 10 cm), mỗi ô một hạt. Số hạt không đổi chi phí: không có vòng lặp nào theo số ô.
  { id: 'density', min: 4, max: 40, step: 1, value: 14 },
  { id: 'fiber', min: 0, max: 1, step: 0.05, value: 0.5 },
  { id: 'brush', min: 0, max: 1, step: 0.05, value: 0.6 },
];

/**
 * Bọc recipe.paper và recipe.glint của Cốt (spec §20.4): thân hàm chạy lúc biên dịch, sau khi mọi lớp đã bọc. Chỉ tờ giấy đi qua hai hàm
 * này, nên gà không đổi. Không có vật riêng.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.cot (recipe, sun) của Cốt
 */
export function createLayer(ctx, shared) {
  const { recipe, sun } = shared.cot;
  const w = ctx.weight(id);
  const diep = color(ctx.palette.color('diep'));
  // Số tầng noise của sợi dó theo mức (bảng quality.js); nấc chi-tiet bớt một tầng. Là uniform: fbm chạy vòng lặp thật trong shader, nên đổi
  // số tầng không biên dịch lại.
  const full = ctx.budget.paper ?? 3;
  const octaves = uniform(full).setName('giayDiepOctaves');
  const plain = uniform(0).setName('giayDiepTron'); // thí nghiệm Giấy dó trơn
  const sparkle = ctx.knob('sparkle'); // @knob sparkle
  const density = ctx.knob('density'); // @knob density
  const fiber = ctx.knob('fiber'); // @knob fiber
  const brush = ctx.knob('brush'); // @knob brush

  // Mỗi màu trộn theo w: w = 0 thì về đúng hàm của lớp trước (đất sét), và hạt điệp tắt hẳn.
  const prevPaper = recipe.paper;
  recipe.paper = (s) => mix(prevPaper(s), paperColor(s, { diep, octaves, fiber, brush, plain }), w);
  const prevGlint = recipe.glint;
  recipe.glint = (s) => prevGlint(s).add(glints(s, { sun, density, sparkle, tint: diep }).mul(w).mul(float(1).sub(plain)));

  return {
    objects: [],
    experiments: [{ id: 'giayTron', toggle: (on) => { plain.value = on ? 1 : 0; } }],
    // Chỉ có khi mức này chạy hơn một tầng: lớp chỉ đưa nấc có tác dụng ở mức hiện tại.
    degrade: full > 1 ? [
      {
        id: 'chi-tiet',
        apply() { octaves.value = full - 1; },
        revert() { octaves.value = full; },
      },
    ] : [],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
