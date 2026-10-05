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

/**
 * Cây đa, tọa độ tính từ gốc cây (0, R, 0); cả cây (và Cuội) dời lên theo độ cao bay `lift` (spec §19.5). Tán rộng chừng 1,1, thấp
 * và xòe như cây đa đầu làng; thân to, năm chân rễ bạnh; rễ phụ buông từ cành.
 */
export const TREE = Object.freeze({
  trunk: Object.freeze({ height: 0.42, r0: 0.11, r1: 0.06 }),
  // Bảy khối bầu dục của tán: [x, y, z, rx, ry, rz]
  lobes: Object.freeze([
    [0, 0.6, 0, 0.34, 0.17, 0.34],
    [0.32, 0.52, 0.05, 0.24, 0.13, 0.22],
    [-0.31, 0.53, -0.04, 0.25, 0.14, 0.23],
    [0.06, 0.52, 0.32, 0.22, 0.12, 0.22],
    [-0.08, 0.54, -0.33, 0.24, 0.13, 0.22],
    [0.22, 0.66, -0.2, 0.2, 0.11, 0.19],
    [-0.2, 0.67, 0.2, 0.2, 0.11, 0.19],
  ]),
  /** Hình bầu dục BAO tán: hình cho cú chạm. */
  canopy: Object.freeze({ center: [0, 0.585, 0], radii: [0.6, 0.22, 0.6] }),
  /** Năm chân rễ bạnh: viên thuốc từ gốc thân tỏa ra sát đất. Góc đầu 54°, nên khe ở +Z (90°) để trống chỗ Cuội ngồi. */
  buttress: Object.freeze({ count: 5, offset: 0.94, length: 0.17, radius: 0.032 }),
  /** Bốn cành chính: [ax, ay, az, bx, by, bz, bán kính]. */
  branches: Object.freeze([
    [0, 0.36, 0, 0.26, 0.5, 0.06, 0.03],
    [0, 0.37, 0, -0.25, 0.51, -0.05, 0.03],
    [0, 0.38, 0, 0.05, 0.5, 0.26, 0.028],
    [0, 0.38, 0, -0.06, 0.52, -0.27, 0.028],
  ]),
  /** Rễ phụ: một viên thuốc mảnh, lặp quanh trục bằng phép chia góc (count bản); không chạm đất. */
  roots: Object.freeze({ count: 10, ring: 0.34, top: 0.44, bottom: 0.14, radius: 0.012 }),
  /** Hình cầu bao cả cây (thân, tán, cành, rễ) trong khung của cây: shader tính cây chỉ khi điểm ở gần hơn cầu này. */
  bound: Object.freeze({ center: [0, 0.42, 0], radius: 0.66 }),
  maxLift: 0.45,
});

/**
 * Chú Cuội ngồi tựa gốc đa, quay về +Z (camera mặc định), ôm gối. Tọa độ trong khung của cây (dời theo lift như cây: Cuội níu rễ).
 * Mỗi phần: hình cầu (a, r), viên thuốc (a, b, r), bầu dục (a, r = [rx, ry, rz]).
 */
export const CUOI = Object.freeze({
  height: 0.17,
  bound: Object.freeze({ center: [0, 0.09, 0.19], radius: 0.13 }),
  parts: Object.freeze([
    { kind: 'sphere', a: [0, 0.03, 0.16], r: 0.032 }, // hông
    { kind: 'capsule', a: [0, 0.045, 0.155], b: [0, 0.1, 0.148], r: 0.03 }, // mình
    { kind: 'sphere', a: [0, 0.143, 0.155], r: 0.027 }, // đầu
    { kind: 'capsule', a: [0.022, 0.03, 0.17], b: [0.024, 0.075, 0.23], r: 0.015 }, // đùi
    { kind: 'capsule', a: [-0.022, 0.03, 0.17], b: [-0.024, 0.075, 0.23], r: 0.015 },
    { kind: 'capsule', a: [0.024, 0.075, 0.23], b: [0.024, 0.012, 0.25], r: 0.012 }, // cẳng chân
    { kind: 'capsule', a: [-0.024, 0.075, 0.23], b: [-0.024, 0.012, 0.25], r: 0.012 },
    { kind: 'capsule', a: [0.034, 0.1, 0.155], b: [0.016, 0.078, 0.236], r: 0.01 }, // tay ôm gối
    { kind: 'capsule', a: [-0.034, 0.1, 0.155], b: [-0.016, 0.078, 0.236], r: 0.01 },
  ]),
});

/**
 * Con trâu gặm cỏ, đứng trên mặt đất ở góc `angle` (rad, tính từ đỉnh, lệch về +X). Khung riêng: x về phía trước (dọc mặt đất, ra
 * xa gốc cây), y hướng ra ngoài hành tinh, z sang bên (+Z, về phía camera mặc định): camera thấy trâu đứng nghiêng.
 */
export const TRAU = Object.freeze({
  angle: 0.42,
  length: 0.2,
  bound: Object.freeze({ center: [0, 0.06, 0], radius: 0.15 }),
  parts: Object.freeze([
    { kind: 'ellipsoid', a: [0, 0.075, 0], r: [0.085, 0.045, 0.042] }, // mình
    { kind: 'ellipsoid', a: [0.098, 0.04, 0], r: [0.036, 0.022, 0.022] }, // đầu cúi gặm cỏ
    { kind: 'capsule', a: [0.085, 0.058, 0.018], b: [0.07, 0.075, 0.05], r: 0.006 }, // sừng cong: hai đoạn mỗi bên
    { kind: 'capsule', a: [0.07, 0.075, 0.05], b: [0.045, 0.08, 0.036], r: 0.005 },
    { kind: 'capsule', a: [0.085, 0.058, -0.018], b: [0.07, 0.075, -0.05], r: 0.006 },
    { kind: 'capsule', a: [0.07, 0.075, -0.05], b: [0.045, 0.08, -0.036], r: 0.005 },
    { kind: 'capsule', a: [0.05, 0.06, 0.026], b: [0.05, 0, 0.026], r: 0.012 }, // bốn chân
    { kind: 'capsule', a: [0.05, 0.06, -0.026], b: [0.05, 0, -0.026], r: 0.012 },
    { kind: 'capsule', a: [-0.05, 0.06, 0.026], b: [-0.05, 0, 0.026], r: 0.012 },
    { kind: 'capsule', a: [-0.05, 0.06, -0.026], b: [-0.05, 0, -0.026], r: 0.012 },
    { kind: 'capsule', a: [-0.082, 0.09, 0], b: [-0.098, 0.04, 0], r: 0.004 }, // đuôi
  ]),
});

/** Trái Đất treo thẳng trên đỉnh cây (spec §19.1). */
export const EARTH = Object.freeze({ center: [0, 3.1, 0], radius: 0.28, spinPeriod: 120 });

/**
 * Khối bao: chứa hành tinh, Cuội, trâu, và cây khi bay cao nhất. Gần như quả cầu nhỏ nhất chứa hai cầu: hành tinh (bán kính 1,02 kể
 * cả gờ hố) và tán đang bay cao nhất (tâm y 2,035, bán kính 0,6), cộng lề cho chỗ phình của hòa khối.
 */
export const BOUNDS = Object.freeze({ center: [0, 0.82, 0], radius: 1.86 });

const R = PLANET.radius;

/** Khung của trâu: gốc trên mặt đất, các trục (x trước, y lên, z bên) trong không gian thế giới. */
export function trauFrame() {
  const a = TRAU.angle;
  return {
    origin: [Math.sin(a) * R, Math.cos(a) * R, 0],
    forward: [Math.cos(a), -Math.sin(a), 0],
    up: [Math.sin(a), Math.cos(a), 0],
    side: [0, 0, 1],
  };
}

/** Điểm trong khung của trâu → thế giới. */
export function trauToWorld([x, y, z]) {
  const { origin, forward, up, side } = trauFrame();
  return origin.map((o, i) => o + forward[i] * x + up[i] * y + side[i] * z);
}

/** Điểm trong khung của cây (Cuội) → thế giới, với độ cao bay lift. */
export const cuoiToWorld = ([x, y, z], lift = 0) => [x, R + lift + y, z];

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

/** Hình bao (cầu) của từng vật, cho test "khối bao chứa mọi thứ" và test "mọi phần nằm trong hình bao của vật". */
export function partBounds(lift = 0) {
  const { center, radii } = canopyEllipsoid(lift);
  return [
    { name: 'hành tinh (cả gờ hố)', center: [0, 0, 0], radius: R + 0.02 },
    { name: 'tán', center, radius: Math.max(...radii) },
    { name: 'cây', center: cuoiToWorld(TREE.bound.center, lift), radius: TREE.bound.radius },
    { name: 'Cuội', center: cuoiToWorld(CUOI.bound.center, lift), radius: CUOI.bound.radius },
    { name: 'trâu', center: trauToWorld(TRAU.bound.center), radius: TRAU.bound.radius },
  ];
}
