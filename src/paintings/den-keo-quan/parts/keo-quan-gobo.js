// paintings/den-keo-quan/parts/keo-quan-gobo.js — của lớp Kéo quân: gobo tính ngay khi tô từng điểm: tia từ ngọn lửa cắt ống trụ của trống, tra mặt nạ hình nhân theo góc, nhòe theo cỡ ngọn lửa.
import { Fn, abs, atan, float, fract, length, log2, max, mix, smoothstep, texture, vec2 } from 'three/tsl';

const TAU = Math.PI * 2;
/** Sàn của cỡ nguồn sáng (m): nửa tối luôn > 0, nên smoothstep(a, b, x) luôn có a < b (GLSL không định nghĩa a ≥ b). */
export const EPS = 1e-4;
/** Nan tre ở các góc lăng trụ giấy: nửa bề rộng (m). */
export const RIB = 0.004;
/** Chong chóng: phần chu kỳ mà một cánh che (cánh nằm giữa chu kỳ). */
export const BLADE = 0.4;

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
  const { axisNode: axis, drum, paper, mouth, fan, cylinderExit, planeCross, sides } = lantern;
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
    // Ngoài dải hình không có hình nhân. Ở mức mip cao (lửa to, núm penumbra lớn), hàng mép bị kẹp (ClampToEdge) đã lẫn vạch đất: nhân
    // một cửa sổ mềm đúng bằng nửa tối (đổi ra đơn vị v), để vòng sàn dưới dải và vòng trần trên dải không tối oan.
    const penV = max(pen.div(drum.y1 - drum.y0), EPS);
    const inBand = smoothstep(penV.negate(), 0, vv).mul(float(1).sub(smoothstep(1, penV.add(1), vv)));
    // "Trống không cắt" (thí nghiệm của Cốt): cả dải hình thành giấy đặc.
    const band = smoothstep(-0.02, 0.0, vv).mul(float(1).sub(smoothstep(1.0, 1.02, vv)));
    return mix(figure.mul(inBand), band, mask.solid).mul(u.strength);
  });

  /** Cỡ nguồn sáng hiệu lực: núm × penumbra, về EPS khi "Nguồn sáng là một điểm". */
  const sizeNode = () => size.mul(u.penumbra).mul(float(1).sub(u.point)).add(EPS);

  /** Ánh sáng ra phòng theo tia C → P: hình nhân × nan tre × đế × (vành miệng, chong chóng). 1 là lọt hết. */
  const all = Fn(([P]) => {
    const C = mix(candle, rest, u.naive).toVar(); // "Công thức gọn": coi như lửa đứng yên trên trục
    const s = sizeNode().toVar();
    const out = cylinderExit(P, C, axis, float(paper.r)).toVar(); // tia ra khỏi giấy ở đâu (lăng trụ coi như ống tròn)
    const pen = s.mul(float(1).sub(out.z)).max(EPS).toVar(); // nửa tối ở bán kính của giấy
    // Đế gỗ: tia ra dưới đáy giấy là vướng đế. 0 dưới đáy, 1 trên đáy.
    const base = smoothstep(float(paper.y0).sub(pen), float(paper.y0).add(pen), out.y);
    // Trên đỉnh giấy: hoặc lọt qua miệng, hoặc vướng vành chóp. top: 0 dưới đỉnh, 1 trên đỉnh.
    const top = smoothstep(float(paper.y1).sub(pen), float(paper.y1).add(pen), out.y).toVar();
    const lip = planeCross(P, C, axis, float(paper.y1)).toVar();
    const open = float(1).sub(smoothstep(float(mouth).sub(pen), float(mouth).add(pen), length(lip.xy)));
    // Chong chóng: điểm cắt mặt phẳng của cánh ở bán kính rho, góc tính như trống (quay cùng θ).
    const vane = planeCross(P, C, axis, float(fan.y)).toVar();
    const rho = length(vane.xy).toVar();
    const f = fract(atan(vane.y, vane.x.add(EPS)).add(theta).mul(fan.blades / TAU)); // EPS: atan(0, 0) không định nghĩa
    const pw = pen.mul(fan.blades / TAU).div(rho.max(1e-3)); // nửa tối, đổi ra phần của một chu kỳ cánh
    const onBlade = float(1).sub(smoothstep(float(BLADE / 2).sub(pw), float(BLADE / 2).add(pw), abs(f.sub(0.5))));
    const inFan = float(1).sub(smoothstep(float(fan.r).sub(pen), float(fan.r).add(pen), rho));
    const above = mix(float(1), open.mul(float(1).sub(onBlade.mul(inFan))), top);
    // Nan tre: cung từ chỗ tia ra tới góc gần nhất của lăng trụ. Góc ở π/2 − π/sides − m·2π/sides (cornerAngles), tức k = −½ − m:
    // fract(k) = ½ ở đúng góc, 0 ở giữa tấm.
    const k = out.x.sub(Math.PI / 2).div(TAU).mul(sides);
    const arc = abs(fract(k).sub(0.5)).mul(TAU).div(sides).mul(paper.r);
    const rib = mix(smoothstep(float(RIB).sub(pen), float(RIB).add(pen), arc), float(1), top); // nan chỉ chạy dọc thân
    return base.mul(above).mul(rib).mul(float(1).sub(cover(P, C, s)));
  });
  /** Ánh sáng xuyên giấy (lớp Giấy nhân vào): chỉ hình nhân, nan tre ở ngoài giấy nên không che giấy. */
  const figures = Fn(([P]) => float(1).sub(cover(P, candle, sizeNode())));
  return { all, figures };
}
