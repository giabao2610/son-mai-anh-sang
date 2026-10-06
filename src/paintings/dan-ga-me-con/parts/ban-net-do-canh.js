// paintings/dan-ga-me-con/parts/ban-net-do-canh.js — của lớp Bản nét: nét viền dò trên ảnh độ sâu của camera trực giao (độ lệch khỏi mặt phẳng và góc gãy của mặt, theo bốn hướng); lấy mẫu thẳng texture độ sâu ở tâm điểm ảnh, không thêm lượt vẽ.
import { abs, atan, float, floor, max, screenUV, smoothstep, textureSize, vec2 } from 'three/tsl';

/** Bốn hướng lấy mẫu: ngang, dọc, hai chéo. Mỗi hướng một cặp điểm đối xứng quanh điểm giữa: lưới 3×3, chín lần đọc texture. */
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/**
 * Góc gãy của mặt (radian, chừng 34°) từ đó nếp gấp thành nét đậm hẳn; bắt đầu hiện từ 0,6 lần góc này (chừng 21°). Khối của gà là đa
 * diện: ở mặc định, hai mặt kề nhau của mọi khối gãy dưới 20° (khối dẹt có nhiều vòng hơn: spec §20.4 lớp 1), nên dưới ngưỡng. Chỗ nối thật
 * gãy nhiều hơn (đầu vào mình 92–123°, mỏ 42–60°, đuôi 34–69°), trừ đoạn cánh gà mẹ áp sát sườn (13–20°): ở đó chỉ còn ranh màu.
 */
const KINK = 0.6;

/**
 * Độ phủ của nét viền (0–1) tại điểm ảnh này.
 * - Độ sâu D (đơn vị cảnh) = texture × span: với camera trực giao, texture độ sâu đã tuyến tính (Phụ lục A.90). Chỉ hiệu số đáng kể, nên
 *   bỏ near.
 * - Mỗi hướng: e = D(+) + D(−) − 2·D(giữa), độ lệch khỏi mặt phẳng. Mặt phẳng nghiêng: e = 0. Bậc cao H: |e| ≈ H.
 * - Bậc: e > 0 nghĩa là điểm giữa gần hơn trung bình hai bên, tức nằm trên vật ở trước. Nét chỉ vẽ phía đó, như nét viền của vật.
 *   e ≥ threshold thì đậm hẳn.
 * - Nếp gấp, hay bậc nhỏ hơn ngưỡng: góc gãy của mặt. Độ dốc hai bên điểm giữa là s− = (D0 − D−) / h, s+ = (D+ − D0) / h (h: độ dài một
 *   bước, đơn vị cảnh; hướng chéo dài hơn √2 lần), tức tan của góc nghiêng mỗi bên; góc gãy là atan(s+ − s−, 1 + s+·s−). Đủ KINK thì
 *   thành nét, độ đậm nhân `crease`. Đo GÓC chứ không đo hiệu độ dốc |e| / h (cách cũ): gần mép khối, mặt nghiêng gần 90° so với
 *   màn, độ dốc rất lớn, nên hai mặt đa diện kề nhau dù chỉ lệch 15° cũng chênh độ dốc quá ngưỡng, và vòng mặt đa diện thành nét (GĐ 8
 *   Task 4). Hai đối số của atan không cùng bằng 0: s+ = s− thì 1 + s+·s− ≥ 1. Bậc lớn đã là viền thì không tính lại ở đây, để phía sau
 *   của bậc không dày thêm.
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
  let turn = float(0); // góc gãy lớn nhất của mặt (radian)
  const stepLen = stride.mul(pixel).max(1e-5); // một bước ngang hay dọc, đơn vị cảnh
  for (const [x, y] of DIRS) {
    const plus = at(x, y);
    const minus = at(-x, -y);
    const e = plus.add(minus).sub(d0.mul(2));
    rise = max(rise, e);
    bend = max(bend, abs(e));
    const h = stepLen.mul(Math.hypot(x, y));
    const sMinus = d0.sub(minus).div(h);
    const sPlus = plus.sub(d0).div(h);
    turn = max(turn, abs(atan(sPlus.sub(sMinus), float(1).add(sPlus.mul(sMinus)))));
  }
  const edge = smoothstep(threshold.mul(0.6), threshold, rise);
  const fold = smoothstep(KINK * 0.6, KINK, turn).mul(crease).mul(float(1).sub(smoothstep(threshold.mul(0.6), threshold, bend)));
  return max(edge, fold);
}
