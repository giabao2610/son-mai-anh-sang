// paintings/ao-sen-dem/parts/cot-leaf.js — của lớp Cốt: hình một chiếc lá sen và cách rải lá theo hạt giống, chừa lối trăng.
import { BufferGeometry, Float32BufferAttribute } from 'three/webgpu';
import { randRange } from '../../../lib/random.js';

export const POND_RADIUS = 50; // lá chỉ mọc trong bán kính này (mặt nước của lớp 4 rộng 60)
// "Lối trăng": hình nêm có đỉnh ở chỗ camera mặc định (painting.js, z ≈ 32), mở về phía xa.
const MOON_PATH = { apexZ: 32, halfAngle: 0.12 };

/**
 * Hình học MỘT chiếc lá (bán kính 1): đĩa có khe hình nêm, lõm lòng chảo, mép lượn sóng.
 * Lưới cực: 1 đỉnh tâm + 3 vòng × 19 đỉnh = 58 đỉnh, 90 tam giác. Mọi lá dùng chung hình này.
 */
export function makeLeafGeometry({ segments = 18, rings = 3, notch = 0.35, cup = 0.22, wave = 0.05 } = {}) {
  const position = [0, 0, 0];
  const uv = [0.5, 0.5];
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s <= segments; s++) {
      // Góc chạy từ mép khe bên này sang mép khe bên kia: phần "notch" bị bỏ trống thành cái khe.
      const a = notch / 2 + (s / segments) * (Math.PI * 2 - notch);
      const radius = t * (1 + 0.05 * Math.sin(a * 5)); // mép hơi méo cho đỡ tròn vành vạnh
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const y = cup * t * t + wave * t ** 3 * Math.sin(a * 7); // lòng chảo + mép gợn sóng
      position.push(x, y, z);
      uv.push(x * 0.5 + 0.5, z * 0.5 + 0.5);
    }
  }
  const row = segments + 1;
  const index = [];
  for (let s = 0; s < segments; s++) index.push(0, 2 + s, 1 + s); // quạt tam giác quanh tâm
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = 1 + (r - 1) * row + s; // đỉnh ở vòng trong
      const b = a + row; // đỉnh cùng góc ở vòng ngoài
      index.push(a, b + 1, b, a, a + 1, b + 1); // thứ tự ngược kim đồng hồ nhìn từ trên → mặt trên hướng lên
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals(); // pháp tuyến trơn từ chính các tam giác
  return geometry;
}

/** Điểm (x, z) có nằm trong "lối trăng" không (để bóng trăng phản chiếu không bị lá che). */
export function inMoonPath(x, z) {
  return Math.abs(Math.atan2(x, MOON_PATH.apexZ - z)) < MOON_PATH.halfAngle;
}

/** Một điểm đều theo DIỆN TÍCH trong đĩa: r = R·√u (lấy u thẳng thì tâm đĩa dày hơn mép). */
export function randomInDisc(rng, radius) {
  const r = radius * Math.sqrt(rng());
  const a = rng() * Math.PI * 2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

/**
 * Rải lá: vài cụm dày, nước trống giữa các cụm, chừa lối trăng; lá không chồng quá nhiều lên nhau.
 * Cùng rng (cùng hạt giống) thì cùng kết quả. Có trần số lần thử nên luôn dừng (ao đầy thì trả ít lá hơn).
 * @returns {{ leaves: object[], clumps: { x: number, z: number, r: number }[] }}
 */
export function placeLeaves(count, rng) {
  const clumps = [];
  while (clumps.length < 16) {
    const c = randomInDisc(rng, POND_RADIUS);
    if (!inMoonPath(c.x, c.z)) clumps.push({ ...c, r: randRange(rng, 4, 9) });
  }
  const cell = 2.2; // lưới băm để chỉ so với lá ở 9 ô lân cận
  const grid = new Map();
  const key = (ix, iz) => `${ix},${iz}`;
  const leaves = [];
  for (let tries = 0; leaves.length < count && tries < count * 60; tries++) {
    const { x, z } = randomInDisc(rng, POND_RADIUS);
    const scale = randRange(rng, 0.5, 1.2);
    if (inMoonPath(x, z)) continue;
    let density = 0.04; // nền thưa để thỉnh thoảng có lá lẻ giữa nước
    for (const c of clumps) density = Math.max(density, Math.exp(-((x - c.x) ** 2 + (z - c.z) ** 2) / (c.r * c.r)));
    if (rng() > density) continue;
    const ix = Math.floor(x / cell);
    const iz = Math.floor(z / cell);
    let crowded = false;
    for (let dx = -1; dx <= 1 && !crowded; dx++) {
      for (let dz = -1; dz <= 1 && !crowded; dz++) {
        for (const o of grid.get(key(ix + dx, iz + dz)) ?? []) {
          if (Math.hypot(o.x - x, o.z - z) < 0.6 * (o.scale + scale)) crowded = true;
        }
      }
    }
    if (crowded) continue;
    const leaf = {
      x,
      z,
      scale,
      y: randRange(rng, 0.03, 0.08), // mỗi lá cao thấp một chút: bớt nhấp nháy khi hai lá chạm nhau
      yaw: rng() * Math.PI * 2,
      tiltX: randRange(rng, -0.1, 0.1),
      tiltZ: randRange(rng, -0.1, 0.1),
    };
    leaves.push(leaf);
    const k = key(ix, iz);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(leaf);
  }
  return { leaves, clumps };
}
