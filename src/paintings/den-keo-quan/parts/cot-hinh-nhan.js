// paintings/den-keo-quan/parts/cot-hinh-nhan.js — của lớp Cốt, hàm thuần (không import three): hình nhân của trống bằng dữ liệu, vẽ ra mặt nạ độ phủ quấn vòng cùng chuỗi mip.

/** Bề rộng : chiều cao của dải. Texel vuông trên mặt trụ: chu vi 2π × 0,09 ≈ 0,565 m, dải cao 0,14 m (spec §18.4). */
export const ASPECT = 4;
/** Lề để trống ở trên và dưới dải (phần của chiều cao): tra ngoài dải (ClampToEdge) ra 0, không kéo vệt chân hình. */
export const MARGIN = 1 / 32;
/** Vạch đất (giấy liền) chạy quanh chân dải; đoàn quân đứng trên vạch này. */
export const GROUND = 0.035;
/**
 * Chiều mặt của hình trên dải: 1 giữ nguyên, −1 lật ngang khi vẽ. Trống quay θ tăng thì mọi điểm trượt về phía góc atan(z, x) GIẢM
 * (góc thế giới = góc cục bộ − θ). Bóng chiếu từ trục giữ nguyên góc, nên trên vách sau (góc quanh −π/2) đoàn quân chạy sang trái,
 * trên giấy phía trước (góc quanh +π/2) chạy sang phải: cả hai đều là chiều góc giảm. Hình vẽ quay mặt về +x (góc tăng), nên lật
 * ngang để đoàn quân đi tới chứ không đi giật lùi (đã xem trên ảnh hai khung cách nhau 30).
 */
export const FACING = -1;

/** Tám hình nhân của đoàn quân (dữ liệu ở cot-doan-quan.js). */
export { FIGURES } from './cot-doan-quan.js';

/** Hộp bao của một hình cơ bản (đơn vị chiều cao dải). */
export function bounds(s) {
  if (s.kind === 'circle') return { x0: s.cx - s.r, x1: s.cx + s.r, y0: s.cy - s.r, y1: s.cy + s.r };
  if (s.kind === 'ellipse') {
    const m = Math.max(s.rx, s.ry);
    return { x0: s.cx - m, x1: s.cx + m, y0: s.cy - m, y1: s.cy + m };
  }
  if (s.kind === 'capsule') {
    return {
      x0: Math.min(s.ax, s.bx) - s.r, x1: Math.max(s.ax, s.bx) + s.r,
      y0: Math.min(s.ay, s.by) - s.r, y1: Math.max(s.ay, s.by) + s.r,
    };
  }
  const xs = s.points.map((p) => p[0]);
  const ys = s.points.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/**
 * Chuẩn bị một hình cơ bản: trả hàm (x, y) → khoảng cách có dấu (âm ở trong), với mọi hằng số (cos/sin của elip, vector cạnh của
 * đa giác) tính MỘT lần. Hàm này chạy cho từng texel trong hộp bao, nên dùng Math.sqrt (Math.hypot chậm hơn nhiều trong V8).
 * Elip là gần đúng: đủ cho mép mịn một texel.
 */
export function prepare(s) {
  if (s.kind === 'circle') {
    return (x, y) => Math.sqrt((x - s.cx) ** 2 + (y - s.cy) ** 2) - s.r;
  }
  if (s.kind === 'ellipse') {
    const [c, n, k] = [Math.cos(s.rot ?? 0), Math.sin(s.rot ?? 0), Math.min(s.rx, s.ry)];
    return (x, y) => {
      const [dx, dy] = [x - s.cx, y - s.cy];
      const u = (dx * c + dy * n) / s.rx;
      const v = (-dx * n + dy * c) / s.ry;
      return (Math.sqrt(u * u + v * v) - 1) * k;
    };
  }
  if (s.kind === 'capsule') {
    const [ex, ey] = [s.bx - s.ax, s.by - s.ay];
    const len2 = ex * ex + ey * ey || 1;
    return (x, y) => {
      const h = Math.min(Math.max(((x - s.ax) * ex + (y - s.ay) * ey) / len2, 0), 1);
      const [qx, qy] = [x - s.ax - ex * h, y - s.ay - ey * h];
      return Math.sqrt(qx * qx + qy * qy) - s.r;
    };
  }
  // Đa giác: khoảng cách tới cạnh gần nhất; dấu theo luật chẵn-lẻ (tia ngang cắt bao nhiêu cạnh).
  const edges = s.points.map(([xi, yi], i) => {
    const [xj, yj] = s.points[(i + s.points.length - 1) % s.points.length];
    const [ex, ey] = [xj - xi, yj - yi];
    return { xi, yi, yj, ex, ey, len2: ex * ex + ey * ey || 1 };
  });
  return (x, y) => {
    let d2 = Infinity;
    let inside = false;
    for (const { xi, yi, yj, ex, ey, len2 } of edges) {
      const h = Math.min(Math.max(((x - xi) * ex + (y - yi) * ey) / len2, 0), 1);
      const [qx, qy] = [x - xi - ex * h, y - yi - ey * h];
      d2 = Math.min(d2, qx * qx + qy * qy);
      if ((yi > y) !== (yj > y) && x < (ex * (y - yi)) / ey + xi) inside = !inside;
    }
    return inside ? -Math.sqrt(d2) : Math.sqrt(d2);
  };
}

/** Khoảng cách có dấu (âm ở trong) từ (x, y) tới hình s. Đơn vị chiều cao dải. */
export const shapeDistance = (s, x, y) => prepare(s)(x, y);

/** Hộp bao ngang [trái, phải] của cả hình, tính từ gốc tọa độ của hình (đơn vị chiều cao dải), đã lật theo FACING. */
export function figureExtent(fig) {
  const boxes = fig.shapes.map(bounds);
  const [x0, x1] = [Math.min(...boxes.map((b) => b.x0)), Math.max(...boxes.map((b) => b.x1))];
  return FACING === 1 ? [x0, x1] : [-x1, -x0];
}

/**
 * Gốc tọa độ của `count` hình quanh dải, theo phần của chu vi. Xếp theo bề rộng THẬT của từng hình, khe giữa hai hình kề nhau bằng
 * nhau (cả khe quấn vòng): chia đều theo ô thì hai hình rộng đứng cạnh nhau sẽ chồng lên nhau (9 hình: hai người cưỡi ngựa).
 * Hình đầu giữ đúng chỗ cũ (giữa ô đầu, 0,5 / count), để bố cục của poster không đổi.
 */
export function layout(figures, count) {
  const spans = Array.from({ length: count }, (_, k) => figureExtent(figures[k % figures.length]));
  const gap = (ASPECT - spans.reduce((sum, [a, b]) => sum + b - a, 0)) / count;
  let edge = 0;
  const origins = spans.map(([a, b]) => {
    const origin = edge - a;
    edge += b - a + gap;
    return origin;
  });
  return origins.map((o) => (o - origins[0]) / ASPECT + 0.5 / count);
}

/**
 * Vẽ `count` hình (lặp theo thứ tự của `figures`) xếp quanh dải theo `layout`, ra độ phủ 8 bit rộng `width`, cao `width / ASPECT`, kèm
 * chuỗi mip.
 * Mỗi texel MỘT mẫu: độ phủ = clamp(0,5 − khoảng cách / cỡ texel), tức mép mịn đúng một texel mà không phải lấy nhiều mẫu. Mỗi hình
 * cơ bản chỉ xét các texel trong hộp bao của nó, nên 2048 × 512 vẽ trong vài chục ms. Hợp của các hình: lấy độ phủ lớn nhất.
 * offset: dời cả đoàn theo vòng (phần của chu vi), test quấn vòng dùng.
 */
export function rasterize(figures, width, { count = figures.length, ground = GROUND, offset = 0 } = {}) {
  const height = width / ASPECT;
  const data = new Uint8Array(width * height);
  const texel = 1 / height;
  // Vạch đất: các hàng từ MARGIN tới MARGIN + ground, phủ kín cả vòng.
  for (let j = Math.floor(MARGIN * height); j < Math.round((MARGIN + ground) * height); j += 1) data.fill(255, j * width, (j + 1) * width);
  const origins = layout(figures, count);
  for (let k = 0; k < count; k += 1) {
    const fig = figures[k % figures.length];
    const cx = (origins[k] + offset) * width; // gốc tọa độ của hình, theo texel
    for (const s of fig.shapes) {
      const distance = prepare(s);
      const box = bounds(s);
      // Lật ngang (FACING = −1) thì hộp bao cũng lật.
      const b = FACING === 1 ? box : { ...box, x0: -box.x1, x1: -box.x0 };
      const i0 = Math.floor(cx + (b.x0 - texel) * height);
      const i1 = Math.ceil(cx + (b.x1 + texel) * height);
      const j0 = Math.max(0, Math.floor((b.y0 - texel) * height));
      const j1 = Math.min(height - 1, Math.ceil((b.y1 + texel) * height));
      for (let j = j0; j <= j1; j += 1) {
        const y = (j + 0.5) / height;
        for (let i = i0; i <= i1; i += 1) {
          const at = j * width + (((i % width) + width) % width); // quấn vòng theo chiều ngang
          if (data[at] === 255) continue; // đã phủ kín (hình khác, hay vạch đất): khỏi tính
          const cover = Math.min(Math.max(0.5 - distance((FACING * (i + 0.5 - cx)) / height, y) / texel, 0), 1);
          if (cover > 0) data[at] = Math.max(data[at], Math.round(cover * 255));
        }
      }
    }
  }
  return { width, height, levels: mipChain(width, height, data) };
}

/** Chuỗi mip (mức 0 là ảnh gốc): mỗi mức là trung bình 2 × 2 của mức trước, cạnh nào đã bằng 1 thì giữ 1. Dừng ở 1 × 1. */
export function mipChain(width, height, data) {
  const levels = [{ width, height, data }];
  let [w, h, src] = [width, height, data];
  while (w > 1 || h > 1) {
    const nw = Math.max(1, w >> 1);
    const nh = Math.max(1, h >> 1);
    const out = new Uint8Array(nw * nh);
    for (let j = 0; j < nh; j += 1) {
      const [y0, y1] = [Math.min(j * 2, h - 1), Math.min(j * 2 + 1, h - 1)];
      for (let i = 0; i < nw; i += 1) {
        const [x0, x1] = [Math.min(i * 2, w - 1), Math.min(i * 2 + 1, w - 1)];
        out[j * nw + i] = Math.round((src[y0 * w + x0] + src[y0 * w + x1] + src[y1 * w + x0] + src[y1 * w + x1]) / 4);
      }
    }
    levels.push({ width: nw, height: nh, data: out });
    [w, h, src] = [nw, nh, out];
  }
  return levels;
}
