// paintings/dan-ga-me-con/parts/giay-diep-mat.js — của lớp Giấy điệp: giấy dó quét điệp trên UV của tờ giấy (đơn vị cảnh): sợi dó, vệt chổi xiên, hạt điệp lóe lên khi tia nắng phản xạ vào mắt.
import {
  abs, cameraViewMatrix, cross, dFdx, dFdy, dot, exp, float, floor, fract, hash, max, min, mix, normalize, positionViewDirection, pow, reflect,
  saturate, smoothstep, vec2, vec3, vec4,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

/** Hướng của vệt chổi lá thông, so với trục u của tờ giấy (radian): cos và sin tính một lần ở JS, shader chỉ nhận hằng. */
const BRUSH = { cos: Math.cos(0.5), sin: Math.sin(0.5) };
/** Mũ của tia phản xạ: lớn thì hạt chỉ lóe khi góc rất đúng. */
const SHINE = 80;
/**
 * Tầm nghiêng tối đa của một hạt, theo từng trục tiếp tuyến của tờ giấy: pháp tuyến hạt = pháp tuyến giấy + dx·T + dy·B, dx và dy
 * ngẫu nhiên trong [−TILT, TILT] (tan của góc nghiêng: 1,4 là chừng 54°). Hạt chỉ lóe khi pháp tuyến của nó trùng nửa vector của hướng
 * nắng và hướng nhìn. Ở góc của tranh, nửa vector lệch khỏi pháp tuyến sàn tới 1,32 (53°) và khỏi pháp tuyến vách 0,76 (37°): tầm nghiêng
 * nhỏ hơn thế thì sàn và vách không có hạt nào lóe, chỉ chỗ uốn có. Test giữ chuyện này (tests/paintings/dan-ga-me-con/giay-diep.test.js).
 */
export const TILT = 1.4;
/**
 * Độ sáng của hạt (HDR, tuyến tính) khi sparkle = 1 và tia phản xạ trúng mắt. Lớn hơn nhiều so với màu giấy (chừng 0,8), như nắng phản xạ
 * gương: tone mapping nén vùng sáng, nên một hạt chỉ sáng gấp đôi giấy thì gần như không thấy; từ chừng 10 mới ra điểm trắng, và bloom
 * của Phủ bóng mới có gì để tỏa. Đo dưới AgX (GĐ 8 Task 6, Phụ lục A.100); ACES mà Bức 4 chọn ở lượt màu cũng nén vùng sáng như vậy.
 */
const GAIN = 16;
/** Bán trục của chấm điệp, tính bằng ô: chấm là một vệt sáng mềm e^(−4·(d/r)²), lõi trắng chừng r. */
const RADIUS = 0.2;
/** Bán trục nhỏ nhất của chấm trên màn hình, tính bằng điểm ảnh: hạt nhỏ hơn thế thì rơi giữa hai điểm ảnh và chớp tắt khi xoay. */
const MIN_RADIUS_PX = 0.8;
/**
 * Lề không có hạt lóe quanh mép tờ giấy (đơn vị cảnh): hạt tắt dần từ EDGE vào tới EDGE / 2 cách mép. Quầng bloom của một hạt tỏa ra vài
 * chục điểm ảnh, mà ngoài mép là ván sơn đen: hạt sát mép để lại những đốm sáng mờ trên ván (GĐ 8 Task 11, đo trên GPU thật).
 */
export const EDGE = 0.5;

/**
 * Màu giấy dó quét điệp tại điểm tô s (s.uv theo đơn vị cảnh: u = x + 7, v = chiều dài cung).
 * - Sợi dó: fbm kéo dài theo v (tần số u cao, v thấp), những sợi mảnh chạy dọc tờ giấy; số tầng là node (theo mức, nấc chi-tiet).
 *   Nhân fbm với 0,3 · fiber: fiber = 1 là sợi rõ (độ sáng lệch chừng ±15%), mặc định 0,5 là thớ mờ.
 * - Vệt chổi: fbm kéo dài theo hướng xiên; lớp điệp dày mỏng theo đường chổi. Điệp sáng và ngà hơn nền dó.
 * - plain (thí nghiệm "Giấy dó trơn") bỏ hẳn lớp điệp.
 */
export function paperColor(s, { diep, octaves, fiber, brush, plain }) {
  const fibers = fbm(vec3(s.uv.x.mul(16), s.uv.y.mul(1.2), 0.5), { octaves });
  const along = s.uv.x.mul(BRUSH.cos).add(s.uv.y.mul(BRUSH.sin));
  const across = s.uv.y.mul(BRUSH.cos).sub(s.uv.x.mul(BRUSH.sin));
  const strokes = fbm(vec3(along.mul(0.35), across.mul(3), 2.3), { octaves: 2 });
  const coat = smoothstep(-0.2, 0.4, strokes).mul(brush).mul(float(1).sub(plain));
  const paper = mix(diep.mul(0.82), diep, coat); // nền dó sẫm hơn lớp điệp
  return paper.mul(float(1).sub(fibers.mul(0.3).mul(fiber)));
}

/**
 * Hạt điệp (emissive). Trong lề EDGE quanh mép tờ giấy (`sheet`: khổ UV, shared.cot.sheet) hạt tắt dần, để quầng bloom không ra ván tối.
 * Mặt giấy chia ô (`density` ô mỗi đơn vị); mỗi ô có MỘT hạt: một chấm nhỏ ở chỗ lệch ngẫu nhiên, với pháp tuyến
 * nghiêng ngẫu nhiên (băm theo ô) trong mặt phẳng tiếp tuyến của tờ giấy: T là trục x, B = n × T chạy theo chiều dài cung. Nghiêng theo
 * hai tiếp tuyến chứ không theo trục x và z của thế giới: vách đứng có pháp tuyến (0, 0, 1), nghiêng theo z không đổi gì, mà vách cần
 * nghiêng lên xuống mới bắt được nắng.
 * Hạt sáng khi tia nắng phản xạ trên nó đi vào mắt: pow(saturate(dot(reflect(−nắng, n_hạt), V)), mũ). Tính trong không gian camera: V là
 * positionViewDirection, three tự cho vec3(0, 0, 1) với camera trực giao (Phụ lục A.91). Hướng nhìn, và vì vậy nửa vector H của nắng và
 * hướng nhìn, như nhau ở mọi điểm của tờ giấy: khắp tờ giấy chỉ hạt có pháp tuyến quay đúng về H mới lóe. Xoay camera là đổi H cho cả tờ
 * giấy cùng lúc, nên hạt này tắt, hạt khác lóe.
 */
export function glints(s, { sun, density, sparkle, tint, sheet }) {
  const grid = s.uv.mul(density);
  const cell = floor(grid);
  const seed = cell.x.mul(157).add(cell.y.mul(113)); // ô ≥ 0 vì UV của tờ giấy ≥ 0: số nguyên cho hash
  const r = [0, 1, 2, 3].map((k) => hash(seed.add(k)));
  // Chấm: tâm lệch ngẫu nhiên trong ô (chừa lề 0,25 ô), hình elip theo hai trục của ô. Bán trục là RADIUS ô, nhưng không nhỏ hơn
  // MIN_RADIUS_PX điểm ảnh MÀN HÌNH theo từng trục (bề rộng một điểm ảnh tính bằng ô: |dFdx| + |dFdy|), và không quá 0,25 ô để chấm nằm
  // gọn trong ô. Trần 0,25 ô thắng khi một ô nhỏ hơn chừng 3,2 điểm ảnh. Trên vách, ô rộng chừng 4,3 điểm ảnh ở DPR 1 (khung 1280 × 800):
  // chấm 0,2 ô, chừng 0,9 điểm ảnh. Trên sàn, nhìn chếch 20° co chiều sâu còn 1/3, ô chỉ cao chừng 1,5 điểm ảnh ở DPR 1, 2,9 ở DPR 2, nên
  // chấm chỉ cao chừng 0,37 và 0,74 điểm ảnh: hạt trên sàn là vạch ngang mảnh, nhạt hơn hạt trên vách.
  const footprint = vec2(abs(dFdx(grid.x)).add(abs(dFdy(grid.x))), abs(dFdx(grid.y)).add(abs(dFdy(grid.y))));
  const radius = min(max(footprint.mul(MIN_RADIUS_PX), RADIUS), 0.25);
  const away = fract(grid).sub(vec2(r[0], r[1]).mul(0.5).add(0.25)).div(radius);
  const spot = exp(dot(away, away).mul(-4));
  const tangent = vec3(1, 0, 0);
  const bitangent = cross(s.n, tangent);
  const flake = normalize(s.n.add(tangent.mul(r[2].sub(0.5).mul(2 * TILT))).add(bitangent.mul(r[3].sub(0.5).mul(2 * TILT))));
  const n = normalize(cameraViewMatrix.mul(vec4(flake, 0)).xyz);
  const l = normalize(cameraViewMatrix.mul(vec4(sun, 0)).xyz);
  const shine = pow(saturate(dot(reflect(l.negate(), n), positionViewDirection)), SHINE);
  const edge = min(min(s.uv.x, s.uv.y), min(float(sheet[0]).sub(s.uv.x), float(sheet[1]).sub(s.uv.y))); // tới mép gần nhất
  return tint.mul(shine.mul(spot).mul(sparkle).mul(GAIN).mul(smoothstep(EDGE / 2, EDGE, edge)));
}
