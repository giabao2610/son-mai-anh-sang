// paintings/ao-sen-dem/layers/l1-cot.js — Lớp 1 · Cốt: lá, hoa, nụ, cuống, lau sậy bằng đất sét (instancing) + đèn xưởng.
import {
  DoubleSide,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  Object3D,
} from 'three/webgpu';
import { color, vec3 } from 'three/tsl';
import { mulberry32, randRange } from '../../../lib/random.js';
import { makeLeafGeometry, placeLeaves } from '../parts/cot-leaf.js';
import { makeCores, makePetalGeometry, makePetals, placeFlowers } from '../parts/cot-flower.js';
import { makeReeds, makeStems } from '../parts/cot-reeds.js';

export const id = 'cot';
export const knobs = [{ id: 'openness', min: 0, max: 1, step: 0.01, value: 0.85 }];

const SEED = 20260928; // hạt giống cố định: lần nào mở cũng đúng một ao sen ấy
const STANDING = 0.1; // khoảng 10% lá đứng trên cuống
const REEDS = 300;
// Đèn xưởng: trời trắng, đất xám. Lambert chia cho π nên cường độ ≈ π cho lại gần đúng màu datSet.
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };

/** Đất sét: màu datSet, nhám, không phát sáng. emissiveNode gán tường minh (luật 8 của kỹ thuật). */
function clay(ctx, Material, options = {}) {
  const material = new Material({ roughness: 0.9, metalness: 0, ...options });
  material.colorNode = color(ctx.palette.hex.datSet);
  material.emissiveNode = vec3(0);
  return material;
}

/** Đặt ma trận instance cho từng lá: vị trí, nghiêng, xoay, cỡ. */
function fillLeaves(mesh, list, cup = 1) {
  const dummy = new Object3D();
  list.forEach((leaf, i) => {
    dummy.position.set(leaf.x, leaf.y, leaf.z);
    dummy.rotation.set(leaf.tiltX, leaf.yaw, leaf.tiltZ);
    dummy.scale.set(leaf.scale, leaf.scale * cup, leaf.scale); // cup > 1: lá lõm sâu như cái phễu
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  object dùng chung của bức: Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const total = ctx.budget.leaves ?? { cao: 1200, vua: 800, thap: 500 }[ctx.level];
  // Mỗi việc một dòng số ngẫu nhiên riêng: số lá đổi theo mức nhưng hoa và lau thì mức nào cũng như nhau.
  const { leaves: placed, clumps } = placeLeaves(total, mulberry32(SEED));
  const rng = mulberry32(SEED + 1);

  // Tách ~10% thành lá đứng: nhô cao trên cuống, lõm sâu hơn, nghiêng nhiều hơn.
  const floating = [];
  const standing = [];
  for (const leaf of placed) {
    if (rng() < STANDING) standing.push({ ...leaf, y: randRange(rng, 1.2, 3.2), tiltX: randRange(rng, -0.5, 0.5), tiltZ: randRange(rng, -0.5, 0.5) });
    else floating.push(leaf);
  }
  const { flowers, buds } = placeFlowers(mulberry32(SEED + 2), clumps);

  // Lá và cánh dùng MeshPhysical để lớp Ánh trăng thêm clearcoat (lá) và sheen (cánh) mà không đổi loại material.
  const leafMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const standingMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const petalMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const coreMaterial = clay(ctx, MeshStandardNodeMaterial);
  const stemMaterial = clay(ctx, MeshStandardNodeMaterial);
  const reedMaterial = clay(ctx, MeshStandardNodeMaterial);

  // InstancedMesh: MỘT draw call cho cả nghìn lá; mỗi lá chỉ khác nhau ở ma trận instance.
  const leafGeometry = makeLeafGeometry();
  const leaves = new InstancedMesh(leafGeometry, leafMaterial, floating.length);
  fillLeaves(leaves, floating);
  // Tâm (x, z) của từng lá nổi: positionNode chạy SAU instancing, nên lớp Mặt nước cần tâm này
  // để cả chiếc lá nhấp nhô cùng nhịp sóng thay vì từng đỉnh lệch nhau.
  const centers = new Float32Array(floating.flatMap((l) => [l.x, l.z]));
  leafGeometry.setAttribute('instanceCenter', new InstancedBufferAttribute(centers, 2));
  // Lá đứng dùng hình riêng: thuộc tính instance gắn với geometry, không chia được với lá nổi.
  const standingGeometry = makeLeafGeometry();
  const standingLeaves = new InstancedMesh(standingGeometry, standingMaterial, standing.length);
  fillLeaves(standingLeaves, standing, 1.8);

  const petalGeometry = makePetalGeometry();
  const openness = ctx.knob('openness'); // @knob openness
  const petals = makePetals({ flowers, buds, geometry: makePetalGeometry(), material: petalMaterial, openness });
  const cores = makeCores(flowers, coreMaterial);
  const stems = makeStems([...flowers, ...buds, ...standing], stemMaterial);
  const reeds = makeReeds(REEDS, mulberry32(SEED + 3), reedMaterial);

  // Đèn xưởng: đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0.
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
  hemi.position.set(-1, 2, 0.5); // trời hơi lệch trái: một bên lòng lá sáng hơn bên kia, đọc ra hình lõm

  const objects = [leaves, standingLeaves, petals, cores, stems, reeds];
  ctx.scene.add(...objects, hemi);
  shared.cot = {
    leafMaterial,
    standingMaterial,
    petalMaterial,
    coreMaterial,
    stemMaterial,
    reedMaterial,
    petalGeometry, // hình cánh để lớp sau dùng lại (đèn hoa đăng)
    hemi,
    hemiIntensity: STUDIO.intensity,
    casters: [standingLeaves, petals, cores, stems], // thứ đứng trên mặt nước: đổ bóng lên lá nổi
    receivers: [leaves],
  };

  let disposed = false;
  return {
    objects,
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects, hemi);
      for (const o of objects) {
        o.dispose();
        o.geometry.dispose();
        o.material.dispose();
      }
      petalGeometry.dispose();
      hemi.dispose();
    },
  };
}
