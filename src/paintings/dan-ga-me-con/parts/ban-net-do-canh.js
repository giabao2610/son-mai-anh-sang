// paintings/dan-ga-me-con/parts/ban-net-do-canh.js — của lớp Bản nét: nét viền dò trên ảnh độ sâu của camera trực giao (độ lệch khỏi mặt phẳng và góc gãy của mặt, theo bốn hướng), và dò cạnh theo màu (Sobel, thí nghiệm); lấy mẫu thẳng texture ở tâm điểm ảnh, không thêm lượt vẽ.
import { abs, atan, float, floor, length, luminance, max, min, screenUV, smoothstep, step, textureSize, vec2 } from 'three/tsl';

/** Bốn hướng lấy mẫu: ngang, dọc, hai chéo. Mỗi hướng một cặp điểm đối xứng quanh điểm giữa: lưới 3×3, chín lần đọc texture. */
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/** Nhân Sobel trên ô 3×3, bỏ điểm giữa: (x, y, hệ số của gx, hệ số của gy). */
const SOBEL = [[-1, -1, -1, -1], [0, -1, 0, -2], [1, -1, 1, -1], [-1, 0, -2, 0], [1, 0, 2, 0], [-1, 1, -1, 1], [0, 1, 0, 2], [1, 1, 1, 1]];
/**
 * Góc gãy của mặt (radian, chừng 34°) từ đó nếp gấp thành nét đậm hẳn; bắt đầu hiện từ 0,6 lần góc này (chừng 21°). Khối của gà là đa
 * diện: ở mặc định, hai mặt kề nhau của mọi khối gãy dưới 20° (khối dẹt có nhiều vòng hơn: spec §20.4 lớp 1; riêng cánh ong mỏng gãy
 * 95°, nên vành của nó là nét viền), nên dưới ngưỡng. Chỗ nối thật gãy nhiều hơn (đầu vào mình 92–123°, mỏ 42–60°, đuôi 34–69°), trừ đoạn
 * cánh gà mẹ áp sát sườn (13–20°): ở đó nét trong vẽ viền cánh (parts/ban-net-net-trong.js).
 */
const KINK = 0.6;

/**
 * Lưới lấy mẫu chung của hai cách dò: tâm điểm ảnh này (đơn vị điểm ảnh của texture), đã dời theo lệch bản, và bước giữa hai mẫu. Mọi mẫu
 * nằm đúng TÂM một điểm ảnh, cách nhau số NGUYÊN điểm ảnh: texture độ sâu không lọc được, three đọc điểm ảnh gần nhất (Phụ lục A.96),
 * nên bước 1,5 rơi đúng mép giữa hai điểm ảnh, một bên làm tròn lên, bên kia xuống, và mặt sàn nghiêng ra e ≠ 0: cả sàn thành sọc mực.
 * Vì vậy núm lineWidth và misregister chỉ có số nguyên, mà ở đây vẫn làm tròn (giá trị nào tới đây cũng rơi đúng tâm điểm ảnh).
 */
function grid(texture, px, offset) {
  const size = vec2(textureSize(texture));
  const stride = max(floor(px.add(0.5)), 1);
  const center = floor(screenUV.mul(size)).add(floor(offset.add(0.5))).add(0.5);
  return { size, stride, center, at: (x, y) => center.add(vec2(x, y).mul(stride)) };
}

/**
 * 1 nếu cả hai tâm điểm ảnh a, b (đơn vị điểm ảnh) nằm trong texture, 0 nếu không: min của hai điểm từ 0 trở lên, max tới size là cùng.
 * Điểm giữa nằm giữa a và b, nên cũng ở trong. Mẫu ngoài khung không có thật: cả hai backend đọc điểm ảnh ở mép (three kẹp tọa độ,
 * Phụ lục A.99), nên D(ngoài) = D(mép), mặt sàn nghiêng ở sát khung ra e ≠ 0 và góc gãy lớn: một vệt mực giả chạy dọc khung khi phóng to
 * tới mức tờ giấy chạm khung, hay khi xoay tranh.
 */
const bothInside = (a, b, size) => {
  const ok = step(vec2(0), min(a, b)).mul(step(max(a, b), size));
  return ok.x.mul(ok.y);
};

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
 * - Cặp nào có một mẫu ngoài khung thì bỏ cả cặp (`bothInside`): vẫn chín lần đọc, chỉ nhân 0.
 * @param {object} p
 * @param {any} p.depth      texture độ sâu (channel('depth') của camera trực giao)
 * @param {any} p.span       uniform: far − near của camera cảnh. Không đọc cameraFar của TSL: trong post đó là camera vẽ quad (A.93)
 * @param {any} p.px         bước lấy mẫu, điểm ảnh thiết bị (núm lineWidth, số nguyên 1–3); vẫn làm tròn, tối thiểu 1
 * @param {any} p.offset     vec2, điểm ảnh: chỗ đọc dời đi so với điểm ảnh này (lệch bản); làm tròn như px
 * @param {any} p.threshold  bậc độ sâu tối thiểu thành viền, đơn vị cảnh (núm; min 0,05 nên threshold · 0,6 < threshold)
 * @param {any} p.crease     độ đậm của nét nếp gấp, 0–1 (núm)
 * @param {any} p.pixel      uniform: đơn vị cảnh của một điểm ảnh (shared.cot.pixel)
 */
export function depthEdges({ depth, span, px, offset, threshold, crease, pixel }) {
  const { size, stride, center, at } = grid(depth, px, offset);
  const read = (p) => depth.sample(p.div(size)).mul(span);
  const d0 = read(center);
  let rise = float(0); // bậc lớn nhất về phía điểm giữa (điểm giữa nằm trên vật ở trước)
  let bend = float(0); // |e| lớn nhất, theo hướng nào cũng được
  let turn = float(0); // góc gãy lớn nhất của mặt (radian)
  const stepLen = stride.mul(pixel).max(1e-5); // một bước ngang hay dọc, đơn vị cảnh
  for (const [x, y] of DIRS) {
    const [p, m] = [at(x, y), at(-x, -y)];
    const keep = bothInside(p, m, size);
    const plus = read(p);
    const minus = read(m);
    const e = plus.add(minus).sub(d0.mul(2)).mul(keep);
    rise = max(rise, e);
    bend = max(bend, abs(e));
    const h = stepLen.mul(Math.hypot(x, y));
    const sMinus = d0.sub(minus).div(h);
    const sPlus = plus.sub(d0).div(h);
    turn = max(turn, abs(atan(sPlus.sub(sMinus), float(1).add(sPlus.mul(sMinus)))).mul(keep));
  }
  const edge = smoothstep(threshold.mul(0.6), threshold, rise);
  const fold = smoothstep(KINK * 0.6, KINK, turn).mul(crease).mul(float(1).sub(smoothstep(threshold.mul(0.6), threshold, bend)));
  return max(edge, fold);
}

/**
 * Dò cạnh theo màu (thí nghiệm "Dò cạnh theo màu"): Sobel trên độ sáng của ảnh màu (scene pass), cùng lưới, cùng bước và cùng lệch bản như
 * dò trên độ sâu. Trên ảnh màu, Sobel là đúng: mảng màu phẳng cho độ dốc 0, ranh mảng là bậc. Nét mọc ở ranh của nấc sáng và quanh nét
 * trong, và mất ở chỗ hai mảng cùng màu chồng nhau: điều mà độ sâu thấy, còn màu thì không. Tám lần đọc (Sobel bỏ điểm giữa).
 * Độ sáng kẹp ở 1: ảnh của scene pass là HDR, hạt điệp lóe sáng chừng 15 lần giấy, nên không kẹp thì mỗi hạt lóe thành một vòng mực.
 * @param {{ color: any, px: any, offset: any }} p   color: texture màu của scene pass (channel('output')); px, offset như depthEdges
 */
export function colorEdges({ color, px, offset }) {
  const { size, at } = grid(color, px, offset);
  const g = vec2(0).toVar(); // (gx, gy): mỗi mẫu cộng ngay vào, không giữ cả tám mẫu cùng lúc
  for (const [x, y, wx, wy] of SOBEL) g.addAssign(vec2(wx, wy).mul(min(luminance(color.sample(at(x, y).div(size)).rgb), 1)));
  return smoothstep(0.08, 0.2, length(g).div(4));
}
