// paintings/den-keo-quan/parts/cot-hinh-nhan.js — của lớp Cốt, hàm thuần (không import three): hình nhân của trống bằng dữ liệu, vẽ ra mặt nạ độ phủ quấn vòng cùng chuỗi mip.

/** Bề rộng : chiều cao của dải. Texel vuông trên mặt trụ: chu vi 2π × 0,09 ≈ 0,565 m, dải cao 0,14 m (spec §18.4). */
export const ASPECT = 4;
/** Lề để trống ở trên và dưới dải (phần của chiều cao): tra ngoài dải (ClampToEdge) ra 0, không kéo vệt chân hình. */
export const MARGIN = 1 / 32;
/** Vạch đất (giấy liền) chạy quanh chân dải; đoàn quân đứng trên vạch này. */
export const GROUND = 0.035;

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

/** Khoảng cách có dấu (âm ở trong) từ (x, y) tới hình s. Elip là gần đúng: đủ cho mép mịn một texel. */
export function shapeDistance(s, x, y) {
  if (s.kind === 'circle') return Math.hypot(x - s.cx, y - s.cy) - s.r;
  if (s.kind === 'ellipse') {
    const c = Math.cos(s.rot ?? 0);
    const n = Math.sin(s.rot ?? 0);
    const dx = x - s.cx;
    const dy = y - s.cy;
    const u = (dx * c + dy * n) / s.rx;
    const v = (-dx * n + dy * c) / s.ry;
    return (Math.hypot(u, v) - 1) * Math.min(s.rx, s.ry);
  }
  if (s.kind === 'capsule') {
    const ex = s.bx - s.ax;
    const ey = s.by - s.ay;
    const h = Math.min(Math.max(((x - s.ax) * ex + (y - s.ay) * ey) / (ex * ex + ey * ey || 1), 0), 1);
    return Math.hypot(x - s.ax - ex * h, y - s.ay - ey * h) - s.r;
  }
  // Đa giác: khoảng cách tới cạnh gần nhất; dấu theo luật chẵn-lẻ (tia ngang cắt bao nhiêu cạnh).
  const p = s.points;
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i, i += 1) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    const ex = xj - xi;
    const ey = yj - yi;
    const h = Math.min(Math.max(((x - xi) * ex + (y - yi) * ey) / (ex * ex + ey * ey || 1), 0), 1);
    d = Math.min(d, Math.hypot(x - xi - ex * h, y - yi - ey * h));
    if ((yi > y) !== (yj > y) && x < (ex * (y - yi)) / ey + xi) inside = !inside;
  }
  return inside ? -d : d;
}

/**
 * Vẽ `count` hình (lặp theo thứ tự của `figures`) đặt đều quanh dải, ra độ phủ 8 bit rộng `width`, cao `width / ASPECT`, kèm chuỗi mip.
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
  for (let k = 0; k < count; k += 1) {
    const fig = figures[k % figures.length];
    const cx = ((k + 0.5) / count + offset) * width; // tâm hình, theo texel
    for (const s of fig.shapes) {
      const b = bounds(s);
      const i0 = Math.floor(cx + (b.x0 - texel) * height);
      const i1 = Math.ceil(cx + (b.x1 + texel) * height);
      const j0 = Math.max(0, Math.floor((b.y0 - texel) * height));
      const j1 = Math.min(height - 1, Math.ceil((b.y1 + texel) * height));
      for (let j = j0; j <= j1; j += 1) {
        const y = (j + 0.5) / height;
        for (let i = i0; i <= i1; i += 1) {
          const cover = Math.min(Math.max(0.5 - shapeDistance(s, (i + 0.5 - cx) / height, y) / texel, 0), 1);
          if (cover <= 0) continue;
          const at = j * width + (((i % width) + width) % width); // quấn vòng theo chiều ngang
          data[at] = Math.max(data[at], Math.round(cover * 255));
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

/**
 * Hình nhân: id, bề rộng (đơn vị chiều cao dải; tổng bề rộng của tối đa 10 hình ≤ ASPECT), các hình cơ bản. x tính từ tâm hình,
 * y từ mép dưới dải. Dáng cắt giấy: khối phẳng, mép gọn; chân ngựa và cờ so le để bóng chạy có nhịp (spec §18.3).
 */
export const FIGURES = [
  {
    id: 'cuoi-ngua', // người cưỡi ngựa phất cờ
    width: 0.62,
    shapes: [
      { kind: 'ellipse', cx: 0, cy: 0.36, rx: 0.17, ry: 0.08 }, // mình ngựa
      { kind: 'capsule', ax: 0.12, ay: 0.4, bx: 0.2, by: 0.52, r: 0.035 }, // cổ
      { kind: 'ellipse', cx: 0.235, cy: 0.52, rx: 0.06, ry: 0.03, rot: -0.5 }, // đầu
      { kind: 'capsule', ax: 0.12, ay: 0.31, bx: 0.22, by: 0.17, r: 0.02 }, // chân trước, đang phi
      { kind: 'capsule', ax: 0.09, ay: 0.3, bx: 0.12, by: 0.07, r: 0.02 },
      { kind: 'capsule', ax: -0.13, ay: 0.31, bx: -0.22, by: 0.17, r: 0.02 }, // chân sau
      { kind: 'capsule', ax: -0.1, ay: 0.3, bx: -0.07, by: 0.07, r: 0.02 },
      { kind: 'poly', points: [[-0.16, 0.38], [-0.27, 0.41], [-0.28, 0.3], [-0.18, 0.34]] }, // đuôi
      { kind: 'capsule', ax: 0, ay: 0.42, bx: 0.02, by: 0.58, r: 0.04 }, // người
      { kind: 'circle', cx: 0.03, cy: 0.64, r: 0.035 }, // đầu người
      { kind: 'poly', points: [[-0.03, 0.66], [0.09, 0.66], [0.03, 0.71]] }, // nón chóp
      { kind: 'capsule', ax: 0.02, ay: 0.55, bx: -0.06, by: 0.9, r: 0.008 }, // cán cờ
      { kind: 'poly', points: [[-0.06, 0.9], [-0.22, 0.86], [-0.06, 0.8]] }, // cờ
    ],
  },
  {
    id: 'linh-co', // lính vác cờ đuôi nheo
    width: 0.3,
    shapes: [
      { kind: 'capsule', ax: -0.03, ay: 0.07, bx: -0.01, by: 0.3, r: 0.025 }, // chân sau
      { kind: 'capsule', ax: 0.05, ay: 0.07, bx: 0.02, by: 0.3, r: 0.025 }, // chân trước (đang bước)
      { kind: 'capsule', ax: 0, ay: 0.32, bx: 0.01, by: 0.52, r: 0.05 }, // mình
      { kind: 'circle', cx: 0.015, cy: 0.59, r: 0.04 }, // đầu
      { kind: 'poly', points: [[-0.04, 0.61], [0.07, 0.61], [0.015, 0.68]] }, // nón chóp
      { kind: 'capsule', ax: 0.06, ay: 0.4, bx: 0.03, by: 0.92, r: 0.008 }, // cán cờ
      { kind: 'poly', points: [[0.03, 0.92], [-0.12, 0.88], [-0.06, 0.85], [-0.12, 0.81], [0.03, 0.8]] }, // cờ đuôi nheo
    ],
  },
];
