// paintings/cung-que/parts/cot-the-gioi.js — số của thế giới Bức 3 (hành tinh, hố, cây đa, Cuội, trâu, Trái Đất, khối bao) và vài phép hình học bằng JS cho cú chạm và test; không import three.

/** Hành tinh: quả cầu bán kính 1, tâm ở gốc; +Y hướng về Trái Đất, nơi cây đứng. Một đơn vị coi như 10 m (spec §19.5). */
export const PLANET = Object.freeze({ radius: 1 });

/**
 * Hố va chạm: hướng tâm hố (chuẩn hóa lúc dùng), bán kính tính theo dây cung trên mặt cầu bán kính 1, độ sâu, độ cao gờ.
 * Không hố nào ở chỏm trên (y < 0,7): lá rơi chạm đất tính như chạm mặt cầu (spec §19.4 lớp 5).
 */
export const CRATERS = Object.freeze([
  { dir: [0.78, 0.45, 0.43], radius: 0.24, depth: 0.05, rim: 0.012 },
  { dir: [-0.7, 0.3, 0.65], radius: 0.18, depth: 0.04, rim: 0.01 },
  { dir: [0.15, -0.2, 0.97], radius: 0.3, depth: 0.06, rim: 0.015 },
  { dir: [-0.55, -0.55, -0.62], radius: 0.22, depth: 0.05, rim: 0.012 },
  { dir: [0.6, -0.7, -0.38], radius: 0.12, depth: 0.03, rim: 0.008 },
  { dir: [-0.2, 0.6, -0.77], radius: 0.16, depth: 0.035, rim: 0.01 },
]);

/** Cây đa, tọa độ tính từ gốc cây (0, R, 0). Cả cây (và Cuội) dời lên theo độ cao bay `lift` (spec §19.5). */
export const TREE = Object.freeze({
  trunk: Object.freeze({ height: 0.45, r0: 0.085, r1: 0.05 }),
  // Bảy khối bầu dục của tán: [x, y, z, rx, ry, rz]
  lobes: Object.freeze([
    [0, 0.66, 0, 0.26, 0.15, 0.26],
    [0.24, 0.6, 0.06, 0.18, 0.11, 0.17],
    [-0.23, 0.61, -0.04, 0.19, 0.12, 0.18],
    [0.05, 0.6, 0.24, 0.17, 0.1, 0.17],
    [-0.06, 0.62, -0.25, 0.18, 0.11, 0.17],
    [0.17, 0.72, -0.15, 0.15, 0.09, 0.15],
    [-0.15, 0.73, 0.16, 0.15, 0.09, 0.15],
  ]),
  /** Hình bầu dục BAO tán: hình bao rẻ trong shader và hình cho cú chạm. */
  canopy: Object.freeze({ center: [0, 0.64, 0], radii: [0.46, 0.2, 0.46] }),
  maxLift: 0.45,
});

/** Chú Cuội ngồi tựa gốc, quay về +Z (camera mặc định). Task 2 điền hình. */
export const CUOI = Object.freeze({ base: [0.02, 0, 0.115], height: 0.11 });
/** Con trâu trên mặt đất, lệch về +X (góc tính từ đỉnh, rad). Task 2 điền hình. */
export const TRAU = Object.freeze({ angle: 0.36, length: 0.15 });
/** Trái Đất treo thẳng trên đỉnh cây (spec §19.1). */
export const EARTH = Object.freeze({ center: [0, 3.1, 0], radius: 0.28, spinPeriod: 120 });
/**
 * Khối bao: chứa hành tinh, Cuội, trâu, và cây khi bay cao nhất. Gần như quả cầu nhỏ nhất chứa hai cầu: hành tinh (bán kính 1,02 kể
 * cả gờ hố) và tán đang bay cao nhất (tâm y 2,09, bán kính 0,46, cộng lề 0,04 cho chỗ phình của hòa khối).
 */
export const BOUNDS = Object.freeze({ center: [0, 0.8, 0], radius: 1.82 });

const R = PLANET.radius;

/** Hình bầu dục bao tán, dời theo độ cao bay. */
export function canopyEllipsoid(lift = 0) {
  const [x, y, z] = TREE.canopy.center;
  return { center: [x, R + y + lift, z], radii: [...TREE.canopy.radii] };
}

/**
 * Điểm trên tán cho cú chạm (spec §19.2): giao tia với hình bầu dục (đổi về không gian mà hình bầu dục là cầu đơn vị); tia trượt thì
 * lấy điểm trên hình bầu dục gần tia nhất (điểm gần tâm nhất của tia, kéo ra mặt).
 * @param {number[]} origin
 * @param {number[]} dir   đã chuẩn hóa
 * @param {number} lift
 */
export function canopyHit(origin, dir, lift = 0) {
  const { center, radii } = canopyEllipsoid(lift);
  const o = origin.map((v, i) => (v - center[i]) / radii[i]);
  const d = dir.map((v, i) => v / radii[i]);
  const a = d[0] ** 2 + d[1] ** 2 + d[2] ** 2;
  const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2];
  const c = o[0] ** 2 + o[1] ** 2 + o[2] ** 2 - 1;
  const disc = b * b - a * c;
  let q;
  if (disc >= 0) {
    const t = Math.max((-b - Math.sqrt(disc)) / a, 0);
    q = o.map((v, i) => v + d[i] * t);
  } else {
    const t = Math.max(-b / a, 0);
    const m = o.map((v, i) => v + d[i] * t);
    const len = Math.hypot(...m) || 1;
    q = m.map((v) => v / len);
  }
  return q.map((v, i) => center[i] + v * radii[i]);
}

/** Hình bao (cầu) của từng vật, cho test "khối bao chứa mọi thứ". */
export function partBounds(lift = 0) {
  const { center, radii } = canopyEllipsoid(lift);
  return [
    { name: 'hành tinh (cả gờ hố)', center: [0, 0, 0], radius: R + 0.02 },
    { name: 'tán', center, radius: Math.max(...radii) },
    { name: 'thân', center: [0, R + lift + TREE.trunk.height / 2, 0], radius: TREE.trunk.height / 2 + TREE.trunk.r0 },
    { name: 'Cuội', center: [CUOI.base[0], R + lift + CUOI.height / 2, CUOI.base[2]], radius: CUOI.height },
    { name: 'trâu', center: [Math.sin(TRAU.angle) * R, Math.cos(TRAU.angle) * R, 0], radius: TRAU.length },
  ];
}
