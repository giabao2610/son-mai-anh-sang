// paintings/dan-ga-me-con/layers/l2-ban-mau.js — Lớp 2 · Bản màu của Bức 4: gà từ đất sét thành mảng màu in theo phần và theo con (năm màu tự nhiên của Đông Hồ), ánh sáng chia vài nấc phẳng; thí nghiệm Tô mịn.
import { color, dot, float, int, max, mix, step, uniform, uniformArray } from 'three/tsl';
import { CHICK_TOKENS, HEN_TOKENS, PLUMAGE, bandOf } from '../parts/ban-mau-bang.js';

export const id = 'ban-mau';

export const knobs = [
  { id: 'bands', min: 1, max: 4, step: 1, value: 2 },
  { id: 'edge', min: 0, max: 0.5, step: 0.01, value: 0.04 },
  { id: 'shade', min: 0, max: 0.6, step: 0.01, value: 0.18 },
];

/**
 * Bọc recipe.fill của Cốt (spec §20.4): thân hàm chạy lúc biên dịch, sau khi mọi lớp đã bọc. Không có vật riêng.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.cot (recipe, PART, sun) của Cốt
 */
export function createLayer(ctx, shared) {
  const cot = shared.cot;
  const w = ctx.weight(id);
  const pal = (token) => ctx.palette.color(token);
  // Bảng màu là hai mảng uniform tra theo chỉ số: theo phần (PART: màu của gà mẹ, và phần không phải lông của gà con) và theo con (pigment).
  // Mọi gà dùng chung một công thức: mỗi phần, mỗi con có màu riêng mà không cần material riêng.
  const parts = Object.keys(cot.PART).sort((a, b) => cot.PART[a] - cot.PART[b]); // vị trí trong mảng = giá trị của PART
  const partColors = uniformArray(parts.map((p) => pal(HEN_TOKENS[p])), 'color').setName('banMauPhan');
  const plumage = uniformArray(parts.map((p) => (PLUMAGE.includes(p) ? 1 : 0)), 'float').setName('banMauLong');
  const pigmentColors = uniformArray(CHICK_TOKENS.map(pal), 'color').setName('banMauCon');
  const hoe = color(pal('hoe'));
  const smoothLight = uniform(0).setName('banMauToMin'); // thí nghiệm Tô mịn: ánh sáng liền thay cho chia nấc
  // part, pigment tới fragment shader qua nội suy, có thể lệch một chút khỏi số nguyên (3,9999…): làm tròn rồi mới đổi sang int.
  const index = (x) => int(x.add(0.5));

  const bands = ctx.knob('bands'); // @knob bands
  const edge = ctx.knob('edge'); // @knob edge
  const shade = ctx.knob('shade'); // @knob shade
  const prev = cot.recipe.fill;
  cot.recipe.fill = (s) => {
    if (s.kind === 'giay') return prev(s); // tờ giấy là việc của Giấy điệp
    // Thóc (lớp Đàn gà) có s.part = −1, nên nhánh 'thoc' không đọc bảng. Gà mẹ có pigment −1: chỉ theo phần.
    const tint = s.kind === 'thoc' ? hoe : mix(
      partColors.element(index(s.part)),
      pigmentColors.element(index(max(s.pigment, 0))),
      plumage.element(index(s.part)).mul(step(0, s.pigment)),
    );
    const l = max(dot(s.n, cot.sun), 0);
    const q = mix(bandOf(l, bands, edge), l, smoothLight);
    const printed = tint.mul(mix(float(1).sub(shade), float(1), q)); // nấc tối sáng bằng 1 − shade lần nấc sáng
    return mix(prev(s), printed, w);
  };

  return {
    objects: [],
    experiments: [
      // Kiểu so: bàn thợ đo ms lúc tắt (chia nấc) và lúc bật (liền), Sổ tay vẽ hai cột: chia nấc gần như không tốn gì.
      { id: 'toMin', kind: 'compare', toggle: (on) => { smoothLight.value = on ? 1 : 0; } },
    ],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
