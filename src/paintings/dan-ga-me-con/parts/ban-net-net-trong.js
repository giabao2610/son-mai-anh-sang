// paintings/dan-ga-me-con/parts/ban-net-net-trong.js — của lớp Bản nét: nét trong vẽ ngay trên vật (vảy lông, mắt, nét và viền cánh, nét đuôi, vằn ong) bằng hàm khoảng cách 2D trên UV của từng phần.
import { Matrix3 } from 'three/webgpu';
import {
  abs, cos, dot, float, fract, fwidth, length, mat3, mat4, max, mix, positionGeometry, sin, smoothstep, sqrt, step, vec2, vec4,
} from 'three/tsl';

/**
 * Một nét: đậm hẳn quanh đường giữa, nhạt dần qua mép mềm rộng `soft` đặt quanh 0,85 nửa bề dày `half` (bản đầu: đậm tới 0,7·half, hết ở
 * half). d và half cùng đơn vị (ô UV, radian hay đơn vị cảnh), nên nét to ra khi zoom, như mực in. Mép mềm là 0,3·half nhưng không mỏng
 * hơn một điểm ảnh (fwidth(d): d đổi bao nhiêu giữa hai điểm ảnh kề nhau): ở DPR 1 hay trên điện thoại, nét mảnh hơn một điểm ảnh thành
 * nét mềm liền, không đứt thành vạch nhấp nháy khi gà chạy; ở DPR 2 nét vẫn dày như bản đầu (GĐ 8 Task 8, chụp trên GPU thật). soft > 0.
 */
const stroke = (d, half) => {
  const soft = max(float(half).mul(0.3), fwidth(d)).mul(0.5);
  const mid = float(half).mul(0.85);
  return float(1).sub(smoothstep(mid.sub(soft), mid.add(soft), d));
};
/** Giữ phần t trong [lo, hi], mép mềm 0,05 mỗi bên. */
const band = (t, lo, hi) => smoothstep(lo - 0.05, lo + 0.05, t).mul(float(1).sub(smoothstep(hi - 0.05, hi + 0.05, t)));

/**
 * Điểm trên cầu đơn vị (trước khi kéo dãn, xoay) có UV này, theo cách SphereGeometry của three trải UV: u quanh trục y (u = 0 ở −x,
 * 0,25 ở +z, 0,5 ở +x), uv.y từ đáy (0) lên đỉnh (1).
 */
function onSphere(uv) {
  const phi = uv.x.mul(2 * Math.PI);
  const ring = sin(uv.y.mul(Math.PI)); // bán kính của vòng vĩ tuyến
  return { x: cos(phi).mul(ring).negate(), y: cos(uv.y.mul(Math.PI)).negate(), z: sin(phi).mul(ring) };
}

/**
 * Vảy lông: hàng cung võng xuống (mép tự do của lông quay xuống, như vảy cá, như ngói lợp), hàng trên lệch nửa ô so với hàng dưới. Số ô
 * chọn cho giữa sườn (chỗ quay ra người xem) mỗi hàng cao chừng nửa bề rộng một cột. Đo theo bề rộng cột (y nhân 0,5), mỗi cung là nửa
 * dưới của vòng tròn bán kính 0,5 tâm ở giữa cạnh trên của ô: hai đầu cung ở hai góc trên, đáy cung chạm cạnh dưới, đúng chỗ hai cung của
 * hàng dưới gặp nhau. Chỉ ở nửa trên của mình (lưng, vai).
 * @param {any} uv  UV của cầu mình
 * @param {[any, any]} cells  số cột quanh mình, số hàng từ chân lên đỉnh
 * @param {any} half  nửa bề dày nét, đơn vị bề rộng cột
 */
export function scallops(uv, [cu, cv], half) {
  const row = uv.y.mul(cv).floor();
  const f = vec2(fract(uv.x.mul(cu).add(row.mul(0.5))).sub(0.5), fract(uv.y.mul(cv)).sub(1).mul(0.5));
  return stroke(abs(length(f).sub(0.5)), half).mul(band(uv.y, 0.55, 0.88));
}

/**
 * Mắt: con ngươi ở giữa và vòng mực sát mép của chỏm mắt ló ra khỏi đầu (chỏm rộng chừng 55° ở gà con, 60° ở gà mẹ). Cực trên của cầu mắt
 * nằm đúng giữa chỏm (parts/cot-hinh-ga.js), nên góc tính từ giữa chỏm là π · (1 − uv.y): con ngươi dưới chừng 22°, vòng từ chừng 40° ra
 * tới mép chỏm, giữa hai thứ là lòng trắng. Vòng và con ngươi nằm trên chính mắt, không theo hướng nhìn: con gà quay đi đâu, mắt cũng là
 * một vòng có chấm, chỉ nghiêng đi như hình tròn vẽ trên một mặt nghiêng.
 */
function eyeInk(uv) {
  const angle = float(1).sub(uv.y).mul(Math.PI);
  return max(smoothstep(0.67, 0.73, angle), float(1).sub(smoothstep(0.36, 0.42, angle)));
}

/**
 * Khoảng cách (đơn vị cảnh, xấp xỉ bậc một) từ điểm p tới mặt một khối bầu dục, cho bởi ma trận `frame` đưa p về khung mà mặt khối là cầu
 * đơn vị (shared.cot.hen.bodyFrame): F = |q|² − 1 với q = frame·p, chia |∇F| = 2·|Mᵀq| (M: phần tuyến tính của frame).
 * @param {import('three/webgpu').Matrix4} frame
 */
export function shellDistance(frame) {
  const m = mat4(frame);
  const mt = mat3(new Matrix3().setFromMatrix4(frame).transpose());
  return (p) => {
    const q = m.mul(vec4(p, 1)).xyz;
    return abs(dot(q, q).sub(1)).div(length(mt.mul(q)).mul(2).max(1e-4));
  };
}

/**
 * Cánh (cầu dẹt theo x): viền và các nét lông ở nửa dưới phía sau, chạy song song mép. Nhìn từ bên, cánh là hình bầu dục bán trục a (nửa
 * bề cao) và b (nửa bề dài), đơn vị cảnh; điểm (y, z) của cầu đơn vị nằm trên bầu dục "bán kính" ρ² = y² + z² = 1 − x². Khoảng cách (đơn
 * vị cảnh) tới đường ρ = k xấp xỉ |ρ² − k²| / |∇ρ²|, với |∇ρ²| = 2·√(y²/a² + z²/b²) (chặn dưới để giữa cánh không chia cho 0).
 * Viền (chỉ khi rim = 1): mép riêng của cánh (ρ = 1) cộng chỗ cánh lún vào sườn (`seam`: khoảng cách tới mặt khối mình). Gà mẹ áp cánh sát
 * sườn: dọc lưng và phía sau, mép riêng của cánh nằm trong mình, mép thấy được là chỗ mặt cánh chui vào sườn (ρ chừng 0,88–0,94), mà ở
 * đó hai mặt gặp nhau chỉ 13–20°, nên ảnh độ sâu không có nét. Đo bằng hình ở dáng nghỉ (positionGeometry): cánh xòe ra thì nét vẫn ở
 * trên cánh, như vẽ sẵn.
 */
function wingInk(uv, { a, b, rim, seam, line, rings }) {
  const { x, y, z } = onSphere(uv);
  const grad = sqrt(y.mul(y).div(a.mul(a)).add(z.mul(z).div(b.mul(b)))).mul(2).max(1e-4);
  const r2 = float(1).sub(x.mul(x));
  const edge = max(stroke(x.mul(x).div(grad), 0.03), stroke(seam, 0.008)).mul(rim);
  const feathers = rings.map((k) => stroke(abs(r2.sub(k * k)).div(grad), line)).reduce((m, v) => max(m, v));
  const back = float(1).sub(smoothstep(-0.05, 0.3, z)).mul(float(1).sub(smoothstep(0.05, 0.4, y))); // nửa sau, nửa dưới
  return max(edge, feathers.mul(back));
}

/**
 * Độ phủ của nét trong (0–1) tại điểm tô s của một con gà (spec §20.4 lớp 3). Gà mẹ có s.pigment = −1; gà con có chỉ số màu ≥ 0. Nét dài
 * nhân `blot` (mực không đều); mắt thì luôn đậm, vì mắt nhỏ, nhạt đi là không đọc ra.
 * - BODY: vảy lông (scallops);
 * - WING: viền (chỉ gà mẹ: cánh gà con đứng ra khỏi mình, đã có viền dò trên độ sâu) và nét lông (wingInk);
 * - TAIL: các nét dọc nón đuôi, chụm lại ở chóp (gà mẹ năm nét ở mặt quay ra người xem, gà con hai);
 * - EYE: vòng có chấm (eyeInk);
 * - BEE: ba vằn ngang thân ong (vòng quanh trục dài z của cầu ong); cánh ong (BEE_WING) không có vằn.
 * @param {object} s  điểm tô (recipe của Cốt): part, uv, pigment
 * @param {{ PART: Record<string, number>, blot: any, shell: (p: any) => any }} p   shell: khoảng cách tới mặt khối mình gà mẹ (shellDistance)
 */
export function innerInk(s, { PART, blot, shell }) {
  const is = (part) => float(1).sub(step(0.5, abs(s.part.sub(part))));
  const hen = step(s.pigment, -0.5);
  const pick = (chick, henValue) => mix(float(chick), float(henValue), hen);
  // Số cột, số hàng: giữa sườn gà mẹ một cột rộng chừng 0,9, một hàng cao 0,45 (đơn vị cảnh); gà con 0,44 và 0,23. Nét dày chừng 0,025.
  const body = scallops(s.uv, [pick(8, 14), pick(6, 8)], pick(0.03, 0.016));
  const wing = wingInk(s.uv, {
    a: pick(0.18, 0.55), b: pick(0.3, 1.1), rim: hen, seam: shell(positionGeometry), line: pick(0.009, 0.013), rings: [0.55, 0.72, 0.88],
  });
  // Nón đuôi: u quanh trục nón (u = 0,25 ở mặt quay ra người xem), uv.y từ đáy (0) lên chóp (1). Nét dày theo phần của một cột, nên
  // thon dần về chóp.
  const tail = stroke(abs(fract(s.uv.x.mul(pick(4, 10))).sub(0.5)), 0.07).mul(smoothstep(0.1, 0.25, s.uv.y));
  const { z } = onSphere(s.uv);
  const bee = stroke(abs(fract(z.mul(2.2).add(0.5)).sub(0.5)), 0.24).mul(float(1).sub(smoothstep(0.6, 0.75, abs(z))));
  const strokes = max(max(body.mul(is(PART.BODY)), wing.mul(is(PART.WING))), max(tail.mul(is(PART.TAIL)), bee.mul(is(PART.BEE))));
  return max(strokes.mul(blot), eyeInk(s.uv).mul(is(PART.EYE)));
}
