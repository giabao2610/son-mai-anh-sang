// paintings/dan-ga-me-con/layers/l3-ban-net.js — Lớp 3 · Bản nét: nét mực đen in sau cùng, như bản nét của tranh Đông Hồ: viền dò trên ảnh độ sâu (post, không thêm lượt vẽ), nét trong vẽ ngay trên gà, mực không đều, lệch bản; thí nghiệm Chỉ bản nét và Dò cạnh theo màu.
import {
  Fn, If, color, float, max, mix, mx_noise_float, positionGeometry, screenCoordinate, smoothstep, uniform, vec2, vec4,
} from 'three/tsl';
import { colorEdges, depthEdges } from '../parts/ban-net-do-canh.js';
import { innerInk, shellDistance } from '../parts/ban-net-net-trong.js';

export const id = 'ban-net';

export const knobs = [
  // Độ dày nét và lệch bản, điểm ảnh thiết bị: chỉ số nguyên, vì mẫu độ sâu phải cách nhau số nguyên điểm ảnh (parts/ban-net-do-canh.js).
  { id: 'lineWidth', min: 1, max: 3, step: 1, value: 2 },
  { id: 'threshold', min: 0.05, max: 2, step: 0.05, value: 0.3 },
  { id: 'crease', min: 0, max: 1, step: 0.05, value: 0.6 },
  { id: 'misregister', min: 0, max: 6, step: 1, value: 2 },
];

/**
 * Hướng lệch bản trên màn (x sang phải, y xuống dưới, như screenUV): bản nét in lệch xuống phải so với bản màu, như tờ giấy trượt khi in
 * tay. Nhân với núm misregister (điểm ảnh) rồi làm tròn: 2 điểm ảnh là (2, 1), 6 là (5, 3).
 */
const MISREGISTER_DIR = [0.82, 0.57];
/**
 * Mực không đều (spec §20.4 lớp 3): độ đậm của nét theo một noise thưa n (chừng −1…1). Phần lớn nét đậm hẳn; chỗ n cao mực mỏng đi, còn
 * 70%, như chỗ ván in ăn ít mực. Nét vẫn đen, chỉ không đều.
 */
const uneven = (n) => float(1).sub(smoothstep(0, 0.6, n).mul(0.3));

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.cot (recipe, PART, pixel) của Cốt
 */
export function createLayer(ctx, shared) {
  // Texture độ sâu chỉ tuyến tính với camera trực giao (Phụ lục A.89–A.90): camera phối cảnh thì nét sẽ sai ở mọi chỗ, nên báo ngay.
  if (!ctx.camera.isOrthographicCamera) {
    throw new Error('Bản nét dò cạnh trên texture độ sâu tuyến tính: chỉ chạy với camera trực giao (spec §20.4 lớp 3).');
  }
  const { recipe, PART } = shared.cot;
  const w = ctx.weight(id);
  const muc = color(ctx.palette.color('muc'));
  const diep = color(ctx.palette.color('diep'));
  const span = uniform(ctx.camera.far - ctx.camera.near).setName('banNetSpan');
  const chiNet = uniform(0).setName('banNetChiNet'); // thí nghiệm Chỉ bản nét
  const byColor = uniform(0).setName('banNetTheoMau'); // thí nghiệm Dò cạnh theo màu

  // Nét trong (spec §20.4): bọc recipe.ink của Cốt TRƯỚC lần biên dịch đầu; Cốt phủ mực lên màu in của gà theo độ phủ này. Mực ăn giấy
  // không đều: độ đậm nhân một noise thưa đặt theo hình gốc của gà (positionGeometry, trước dáng), nên vết mực đi theo con gà khi nó cúi,
  // chạy, không trôi trên mình nó. Gà con dùng chung một hình: cộng chỉ số màu để mỗi màu một kiểu vết.
  const shell = shellDistance(shared.cot.hen.bodyFrame, shared.cot.hen.bodyRadius);
  const prevInk = recipe.ink;
  recipe.ink = (s) => {
    if (s.kind !== 'ga') return prevInk(s); // tờ giấy, thóc: không có nét trong
    const blot = uneven(mx_noise_float(positionGeometry.mul(3.1).add(s.pigment.mul(5.3))));
    return max(prevInk(s), innerInk(s, { PART, blot, shell }).mul(w));
  };
  // Chỉ bản nét: màu in thành trắng giấy, chỉ còn nét, như bản nét in thử trước khi in màu. Nhân w: mọi trọng số 0 thì về đất sét.
  const prevFill = recipe.fill;
  recipe.fill = (s) => mix(prevFill(s), diep, chiNet.mul(w));

  return {
    objects: [],
    post: {
      build({ color: c, channel, weight, tap }) {
        tap('truoc-net', c);
        const px = ctx.knob('lineWidth'); // @knob lineWidth
        // Điểm ảnh này đọc ảnh ở phía ngược với hướng lệch: viền ở chỗ Q của ảnh độ sâu hiện ra ở Q + lệch.
        const offset = vec2(...MISREGISTER_DIR).mul(ctx.knob('misregister')).negate(); // @knob misregister
        const byDepth = depthEdges({
          depth: channel('depth'),
          span,
          px,
          offset,
          threshold: ctx.knob('threshold'), // @knob threshold
          crease: ctx.knob('crease'), // @knob crease
          pixel: shared.cot.pixel,
        });
        // Dò cạnh theo màu chỉ đọc tám mẫu màu khi thí nghiệm bật: nhánh If theo uniform, không biên dịch lại.
        const sobel = Fn(() => {
          const e = float(0).toVar();
          If(byColor.greaterThan(0.5), () => {
            e.assign(colorEdges({ color: channel('output'), px, offset }));
          });
          return e;
        })();
        const edges = mix(byDepth, sobel, byColor).mul(weight);
        // Mực của viền không đều theo điểm ảnh của màn: hậu kỳ không biết điểm ảnh thuộc vật nào (nét trong thì theo hình của gà, ở trên).
        // Noise chỉ tính ở điểm ảnh có mực: tính cho mọi điểm ảnh thì tốn chừng 3 ms mỗi khung ở 2560 × 1600, DPR 2 (GPU Mac M2).
        const blot = Fn(() => {
          const b = float(1).toVar();
          If(edges.greaterThan(0), () => {
            b.assign(uneven(mx_noise_float(screenCoordinate.xy.mul(0.06))));
          });
          return b;
        })();
        return vec4(mix(c.rgb, muc, edges.mul(blot)), c.a);
      },
    },
    experiments: [
      { id: 'chiNet', toggle: (on) => { chiNet.value = on ? 1 : 0; } },
      { id: 'netTheoMau', toggle: (on) => { byColor.value = on ? 1 : 0; } },
    ],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
