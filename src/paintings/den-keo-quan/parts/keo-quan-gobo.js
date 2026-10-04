// paintings/den-keo-quan/parts/keo-quan-gobo.js — của lớp Kéo quân: gobo tính ngay khi tô từng điểm: tia từ ngọn lửa cắt ống trụ của trống, tra mặt nạ hình nhân theo góc, nhòe theo cỡ ngọn lửa.
import { Fn, float, fract, log2, max, mix, smoothstep, texture, vec2 } from 'three/tsl';

const TAU = Math.PI * 2;
/** Sàn của cỡ nguồn sáng (m): nửa tối luôn > 0, nên smoothstep(a, b, x) luôn có a < b (GLSL không định nghĩa a ≥ b). */
export const EPS = 1e-4;

/**
 * @param {object} p
 * @param {object} p.lantern  shared.cot.lantern: số đo của đèn, `axisNode` (node vec2), `cylinderExit`, `planeCross`, `sides`
 * @param {{ texture: any, width: number, solid: any }} p.mask  shared.cot.mask
 * @param {any} p.candle  uniform vec3: vị trí lửa lúc này (chao theo nhấp nháy và thổi)
 * @param {any} p.rest    node vec3: vị trí lửa lúc đứng yên, trên trục
 * @param {any} p.size    node: cỡ ngọn lửa (m) = cỡ nguồn sáng
 * @param {any} p.theta   uniform: góc trống (rad)
 * @param {{ naive: any, point: any, penumbra: any, strength: any }} p.u  uniform của núm và thí nghiệm của lớp
 * @returns {{ all: any, figures: any }}  hai Fn TSL của P (vị trí thế giới): độ sáng lọt qua, 0 → 1
 */
export function createGobo({ lantern, mask, candle, rest, size, theta, u }) {
  const { axisNode: axis, drum, cylinderExit } = lantern;
  const texelsPerMeter = mask.width / (TAU * drum.r);
  /** Mức mip: log2 của số texel mà nửa tối (quy về mặt trống, mét) trải qua; không âm, nên LOD không bao giờ là −∞. */
  const lodOf = (meters) => log2(max(meters.mul(texelsPerMeter), 1));

  /** Độ phủ của hình nhân dọc tia C → P (0: lọt, 1: bị che). s: cỡ nguồn sáng hiệu lực (m). */
  const cover = Fn(([P, C, s]) => {
    const hit = cylinderExit(P, C, axis, float(drum.r)).toVar(); // vec3(góc, độ cao, t)
    // Trống quay θ thì điểm ở góc cục bộ φ nằm ở góc thế giới φ − θ: tra ngược lại ở φ_thế giới + θ (test quy ước góc).
    const uu = fract(hit.x.add(theta).div(TAU));
    const vv = hit.y.sub(drum.y0).div(drum.y1 - drum.y0);
    // Nửa tối quy về mặt trống: s × (1 − t) (tam giác đồng dạng: lửa cỡ s, điểm cắt ở phần t của đoạn C → P).
    const pen = s.mul(float(1).sub(hit.z));
    const figure = texture(mask.texture, vec2(uu, vv)).level(lodOf(pen)).r;
    // "Trống không cắt" (thí nghiệm của Cốt): cả dải hình thành giấy đặc.
    const band = smoothstep(-0.02, 0.0, vv).mul(float(1).sub(smoothstep(1.0, 1.02, vv)));
    return mix(figure, band, mask.solid).mul(u.strength);
  });

  /** Cỡ nguồn sáng hiệu lực: núm × penumbra, về EPS khi "Nguồn sáng là một điểm". */
  const sizeNode = () => size.mul(u.penumbra).mul(float(1).sub(u.point)).add(EPS);

  /** Ánh sáng ra phòng. Lúc này chỉ có hình nhân; đế, miệng, chong chóng, nan tre nhân thêm sau. */
  const all = Fn(([P]) => {
    const C = mix(candle, rest, u.naive).toVar(); // "Công thức gọn": coi như lửa đứng yên trên trục
    return float(1).sub(cover(P, C, sizeNode()));
  });
  /** Ánh sáng xuyên giấy (lớp Giấy nhân vào): chỉ hình nhân, nan tre ở ngoài giấy nên không che giấy. */
  const figures = Fn(([P]) => float(1).sub(cover(P, candle, sizeNode())));
  return { all, figures };
}
