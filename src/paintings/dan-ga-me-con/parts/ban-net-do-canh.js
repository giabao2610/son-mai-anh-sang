// paintings/dan-ga-me-con/parts/ban-net-do-canh.js — của lớp Bản nét: nét viền dò trên ảnh độ sâu của camera trực giao (độ lệch khỏi mặt phẳng theo bốn hướng); lấy mẫu thẳng texture độ sâu ở tâm điểm ảnh, không thêm lượt vẽ.
import { abs, float, floor, max, screenUV, smoothstep, textureSize, vec2 } from 'three/tsl';

/** Bốn hướng lấy mẫu: ngang, dọc, hai chéo. Mỗi hướng một cặp điểm đối xứng quanh điểm giữa: lưới 3×3, chín lần đọc texture. */
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/** Độ gãy (độ đổi độ dốc, không đơn vị) từ đó nếp gấp thành nét đậm hẳn. */
const KINK = 1;

/**
 * Độ phủ của nét viền (0–1) tại điểm ảnh này.
 * - Độ sâu D (đơn vị cảnh) = texture × span: với camera trực giao, texture độ sâu đã tuyến tính (Phụ lục A.90). Chỉ hiệu số đáng kể, nên
 *   bỏ near.
 * - Mỗi hướng: e = D(+) + D(−) − 2·D(giữa), độ lệch khỏi mặt phẳng. Mặt phẳng nghiêng: e = 0. Bậc cao H: |e| ≈ H.
 * - Bậc: e > 0 nghĩa là điểm giữa gần hơn trung bình hai bên, tức nằm trên vật ở trước. Nét chỉ vẽ phía đó, như nét viền của vật.
 *   e ≥ threshold thì đậm hẳn.
 * - Nếp gấp, hay bậc nhỏ hơn ngưỡng: |e| chia độ dài một bước (đơn vị cảnh) là độ gãy; đủ KINK thì thành nét, độ đậm nhân `crease`. Bậc
 *   lớn đã là viền thì không tính lại ở đây, để phía sau của bậc không dày thêm.
 * - Mọi mẫu nằm đúng TÂM một điểm ảnh, cách điểm giữa một số NGUYÊN điểm ảnh. Texture độ sâu không lọc được: three đọc điểm ảnh gần nhất
 *   (Phụ lục A.96). Bước 1,5 điểm ảnh rơi đúng mép giữa hai điểm ảnh, một bên làm tròn lên, bên kia xuống, nên hai mẫu không còn đối
 *   xứng và mặt sàn nghiêng ra e ≠ 0: cả sàn thành sọc mực. Vì vậy núm lineWidth chỉ có số nguyên (1–3), bước vẫn làm tròn (giá trị
 *   nào tới đây cũng rơi đúng tâm điểm ảnh), và tâm tính theo cỡ của chính texture độ sâu.
 * @param {object} p
 * @param {any} p.depth      texture độ sâu (channel('depth') của camera trực giao)
 * @param {any} p.span       uniform: far − near của camera cảnh. Không đọc cameraFar của TSL: trong post đó là camera vẽ quad (A.93)
 * @param {any} p.px         bước lấy mẫu, điểm ảnh thiết bị (núm lineWidth, số nguyên 1–3); vẫn làm tròn, tối thiểu 1
 * @param {any} p.offset     vec2, điểm ảnh: lệch bản (Task 5; khung truyền vec2(0)); làm tròn như px
 * @param {any} p.threshold  bậc độ sâu tối thiểu thành viền, đơn vị cảnh (núm; min 0,05 nên threshold · 0,6 < threshold)
 * @param {any} p.crease     độ đậm của nét nếp gấp, 0–1 (núm)
 * @param {any} p.pixel      uniform: đơn vị cảnh của một điểm ảnh (shared.cot.pixel)
 */
export function depthEdges({ depth, span, px, offset, threshold, crease, pixel }) {
  const size = vec2(textureSize(depth));
  const stride = max(floor(px.add(0.5)), 1);
  const center = floor(screenUV.mul(size)).add(floor(offset.add(0.5))).add(0.5); // tâm điểm ảnh (đơn vị điểm ảnh), đã dời theo lệch bản
  const at = (x, y) => depth.sample(center.add(vec2(x, y).mul(stride)).div(size)).mul(span);
  const d0 = at(0, 0);
  let rise = float(0); // bậc lớn nhất về phía điểm giữa (điểm giữa nằm trên vật ở trước)
  let bend = float(0); // |e| lớn nhất, theo hướng nào cũng được
  for (const [x, y] of DIRS) {
    const e = at(x, y).add(at(-x, -y)).sub(d0.mul(2));
    rise = max(rise, e);
    bend = max(bend, abs(e));
  }
  const edge = smoothstep(threshold.mul(0.6), threshold, rise);
  const kink = bend.div(stride.mul(pixel).max(1e-5));
  const fold = smoothstep(KINK * 0.6, KINK, kink).mul(crease).mul(float(1).sub(smoothstep(threshold.mul(0.6), threshold, bend)));
  return max(edge, fold);
}
