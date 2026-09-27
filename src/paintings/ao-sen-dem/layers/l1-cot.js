// paintings/ao-sen-dem/layers/l1-cot.js — Lớp 1 · Cốt v0: lá sen đất sét rải bằng instancing + đèn xưởng.
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Object3D,
} from 'three/webgpu';
import { color, vec3 } from 'three/tsl';
import { mulberry32, randRange } from '../../../lib/random.js';

export const id = 'cot';
export const knobs = [];

const SEED = 20260928; // hạt giống cố định: lần nào mở cũng đúng một ao sen ấy
const POND_RADIUS = 50; // lá chỉ mọc trong bán kính này (mặt nước của lớp 4 rộng 60)
// "Lối trăng": hình nêm có đỉnh ở chỗ camera mặc định (painting.js, z = 30), mở về phía xa.
const MOON_PATH = { apexZ: 30, halfAngle: 0.1 };
// Đèn xưởng: trời trắng, đất xám. Lambert chia cho π nên cường độ ≈ π cho lại gần đúng màu datSet.
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };

/**
 * Hình học MỘT chiếc lá (bán kính 1): đĩa có khe hình nêm, lõm lòng chảo, mép lượn sóng.
 * Lưới cực: 1 đỉnh tâm + 3 vòng × 19 đỉnh = 58 đỉnh, 90 tam giác. Mọi lá dùng chung hình này.
 */
function makeLeafGeometry({ segments = 18, rings = 3, notch = 0.35, cup = 0.22, wave = 0.05 } = {}) {
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
function inMoonPath(x, z) {
  return Math.abs(Math.atan2(x, MOON_PATH.apexZ - z)) < MOON_PATH.halfAngle;
}

/** Một điểm đều theo DIỆN TÍCH trong đĩa: r = R·√u (lấy u thẳng thì tâm đĩa dày hơn mép). */
function randomInDisc(rng, radius) {
  const r = radius * Math.sqrt(rng());
  const a = rng() * Math.PI * 2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

/**
 * Rải lá: vài cụm dày, nước trống giữa các cụm, chừa lối trăng; lá không chồng quá nhiều lên nhau.
 * Cùng rng (cùng hạt giống) thì cùng kết quả. Có trần số lần thử nên luôn dừng (ao đầy thì trả ít lá hơn).
 */
function placeLeaves(count, rng) {
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
  return leaves;
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  object dùng chung của bức: Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const count = ctx.budget.leaves ?? { cao: 1200, vua: 800, thap: 500 }[ctx.level];
  const geometry = makeLeafGeometry();

  // Đất sét: màu datSet, nhám, không phát sáng. emissiveNode gán tường minh (luật 8 của kỹ thuật).
  const leafMaterial = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0, side: DoubleSide });
  leafMaterial.colorNode = color(ctx.palette.hex.datSet);
  leafMaterial.emissiveNode = vec3(0);

  // InstancedMesh: MỘT draw call cho cả nghìn lá; mỗi lá chỉ khác nhau ở ma trận instance.
  const placed = placeLeaves(count, mulberry32(SEED));
  const leaves = new InstancedMesh(geometry, leafMaterial, placed.length);
  const centers = new Float32Array(placed.length * 2);
  const dummy = new Object3D();
  placed.forEach((leaf, i) => {
    dummy.position.set(leaf.x, leaf.y, leaf.z);
    dummy.rotation.set(leaf.tiltX, leaf.yaw, leaf.tiltZ);
    dummy.scale.setScalar(leaf.scale);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
    centers[i * 2] = leaf.x;
    centers[i * 2 + 1] = leaf.z;
  });
  // Tâm (x, z) của từng lá: positionNode chạy SAU instancing, nên lớp 4 (GĐ 1) cần tâm này
  // để cả chiếc lá nhấp nhô cùng nhịp sóng thay vì từng đỉnh lệch nhau.
  geometry.setAttribute('instanceCenter', new InstancedBufferAttribute(centers, 2));

  // Đèn xưởng: đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0.
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
  hemi.position.set(-1, 2, 0.5); // trời hơi lệch trái: một bên lòng lá sáng hơn bên kia, đọc ra hình lõm

  ctx.scene.add(leaves, hemi);
  shared.cot = { leafMaterial, hemi };

  let disposed = false;
  return {
    objects: [leaves],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(leaves, hemi);
      leaves.dispose();
      geometry.dispose();
      leafMaterial.dispose();
      hemi.dispose();
    },
  };
}
