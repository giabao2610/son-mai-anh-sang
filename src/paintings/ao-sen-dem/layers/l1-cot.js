// paintings/ao-sen-dem/layers/l1-cot.js — Lớp 1 · Cốt: lá, hoa, nụ, cuống, lau sậy bằng đất sét (instancing) + đèn xưởng.
import {
  DoubleSide,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
} from 'three/webgpu';
import { color, vec3 } from 'three/tsl';
import { mulberry32, randRange } from '../../../lib/random.js';
import { fillLeaves, makeLeafGeometry, placeLeaves } from '../parts/cot-leaf.js';
import { BUDS, FLOWERS, fillCores, fillPetals, makeCores, makePetalGeometry, makePetals, placeFlowers } from '../parts/cot-flower.js';
import { fillReeds, fillStems, makeReeds, makeStems } from '../parts/cot-reeds.js';
import { LOOSE_MAX, createLooseLeaves, vertexCount } from '../parts/cot-lab.js';

export const id = 'cot';

const LEAVES = { cao: 1200, vua: 800, thap: 500 }; // số lá mặc định theo mức (spec §6)
const LEAF_MAX = 2400; // trần của núm leafCount: InstancedMesh cấp phát đủ chừng này MỘT lần
const STANDING = 0.1; // khoảng 10% lá đứng trên cuống
const STANDING_MAX = Math.ceil(LEAF_MAX * 0.2);
const STANDING_CUP = 1.8; // lá đứng lõm sâu hơn lá nổi
const REEDS = 300;
const SEED = 20260928; // hạt giống của ao: seed = 0 là đúng một ao sen ấy, lần nào mở cũng vậy
// Đèn xưởng: trời trắng, đất xám. Lambert chia cho π nên cường độ ≈ π cho lại gần đúng màu datSet.
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };

export const knobs = [
  { id: 'leafCount', via: 'rebuild', min: 0, max: LEAF_MAX, step: 50, value: (env) => env.budget.leaves ?? LEAVES[env.level] },
  { id: 'seed', via: 'rebuild', min: 0, max: 99, step: 1, value: 0 },
  { id: 'sizeVariance', via: 'rebuild', min: 0, max: 1, step: 0.05, value: 1 },
  { id: 'cupAmount', via: 'rebuild', min: 0.4, max: 2.5, step: 0.05, value: 1 },
  { id: 'openness', min: 0, max: 1, step: 0.01, value: 0.85 },
  { id: 'wireframe', kind: 'bool', via: 'rebuild', value: false },
];

/** Đất sét: màu datSet, nhám, không phát sáng. emissiveNode gán tường minh (luật 8 của kỹ thuật). */
function clay(ctx, Material, options = {}) {
  const material = new Material({ roughness: 0.9, metalness: 0, ...options });
  material.colorNode = color(ctx.palette.hex.datSet);
  material.emissiveNode = vec3(0);
  return material;
}

/**
 * Bố cục cả ao từ núm: lá nổi, lá đứng, hoa, nụ. Mỗi việc một dòng số ngẫu nhiên riêng, nên đổi số lá
 * không làm hoa đổi chỗ (cụm lá được bốc trước mọi lá); còn đổi seed thì cả ao đổi.
 */
function layout({ leafCount, seed, sizeVariance }, azimuth) {
  const base = SEED + seed * 7919; // 7919 là số nguyên tố: các seed liền nhau cho ao khác hẳn nhau
  const { leaves, clumps } = placeLeaves(leafCount, mulberry32(base), { azimuth, sizeVariance });
  const rng = mulberry32(base + 1);
  const floating = [];
  const standing = [];
  for (const leaf of leaves) {
    if (rng() < STANDING && standing.length < STANDING_MAX) {
      standing.push({ ...leaf, y: randRange(rng, 1.2, 3.2), tiltX: randRange(rng, -0.5, 0.5), tiltZ: randRange(rng, -0.5, 0.5) });
    } else floating.push(leaf);
  }
  return { floating, standing, ...placeFlowers(mulberry32(base + 2), clumps, { azimuth }) };
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  object dùng chung của bức: Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const params = Object.fromEntries(['leafCount', 'seed', 'sizeVariance', 'cupAmount'].map((k) => [k, ctx.knobValue(k)]));
  // Phương vị của trăng lúc dựng (setup của bức): lối trăng chừa đúng về phía bóng trăng in xuống nước.
  const dir = shared.moon?.dir?.value;
  const azimuth = dir ? Math.atan2(dir.x, -dir.z) : 0;

  // Lá và cánh dùng MeshPhysical để lớp Ánh trăng thêm clearcoat (lá) và sheen (cánh) mà không đổi loại material.
  const leafMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const standingMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const petalMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const coreMaterial = clay(ctx, MeshStandardNodeMaterial);
  const stemMaterial = clay(ctx, MeshStandardNodeMaterial);
  const reedMaterial = clay(ctx, MeshStandardNodeMaterial);
  const materials = [leafMaterial, standingMaterial, petalMaterial, coreMaterial, stemMaterial, reedMaterial];

  // InstancedMesh: MỘT draw call cho cả nghìn lá; mỗi lá chỉ khác nhau ở ma trận instance.
  // Cấp phát theo trần của núm một lần; đổi số lá chỉ ghi lại ma trận và `count`, không tạo mesh mới.
  const leafGeometry = makeLeafGeometry();
  // Tâm (x, z) của từng lá nổi: positionNode chạy SAU instancing, nên lớp Mặt nước cần tâm này
  // để cả chiếc lá nhấp nhô cùng nhịp sóng thay vì từng đỉnh lệch nhau.
  leafGeometry.setAttribute('instanceCenter', new InstancedBufferAttribute(new Float32Array(LEAF_MAX * 2), 2));
  const leaves = new InstancedMesh(leafGeometry, leafMaterial, LEAF_MAX);
  leaves.name = 'la-noi'; // tên vật: Từng sợi tra nhãn ở content.layers.cot.objects; Inspector của ?debug hiện tên này
  // Lá đứng dùng hình riêng: thuộc tính instance gắn với geometry, không chia được với lá nổi.
  const standingLeaves = new InstancedMesh(makeLeafGeometry(), standingMaterial, STANDING_MAX);
  standingLeaves.name = 'la-dung';
  const petalGeometry = makePetalGeometry(); // hình cánh để lớp sau dùng lại (đèn hoa đăng)
  const petals = makePetals({ geometry: makePetalGeometry(), material: petalMaterial, openness: ctx.knob('openness') }); // @knob openness
  const cores = makeCores(coreMaterial);
  const stems = makeStems(FLOWERS + BUDS + STANDING_MAX, stemMaterial);
  const reeds = makeReeds(REEDS, reedMaterial);

  // Đèn xưởng: đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0.
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
  hemi.position.set(-1, 2, 0.5); // trời hơi lệch trái: một bên lòng lá sáng hơn bên kia, đọc ra hình lõm

  const objects = [leaves, standingLeaves, petals, cores, stems, reeds]; // mảng SỐNG: thí nghiệm thêm/bớt tại chỗ
  let version = 0; // tăng mỗi lần hình đổi: lớp Ánh trăng thấy số này đổi thì vẽ lại shadow map (bóng tĩnh, GĐ 3)
  let loose = null; // các Mesh rời của "Tắt instancing": tạo lần đầu bật, giữ tới khi gỡ lớp (bật/tắt chỉ hiện/giấu)
  let looseOn = false;
  const setLoose = (on) => {
    if (on) loose ??= createLooseLeaves(ctx.scene, leaves, LOOSE_MAX[ctx.level]);
    if (!loose || on === looseOn) return;
    looseOn = on;
    loose.show(on);
    if (on) objects.push(loose.group);
    else objects.splice(objects.indexOf(loose.group), 1);
  };
  /** Ghi bố cục theo núm vào các InstancedMesh sẵn có (vài ms), không biên dịch lại shader. */
  const apply = () => {
    const pond = layout(params, azimuth);
    fillLeaves(leaves, pond.floating, params.cupAmount);
    fillLeaves(standingLeaves, pond.standing, STANDING_CUP * params.cupAmount);
    fillPetals(petals, pond.flowers, pond.buds);
    fillCores(cores, pond.flowers);
    fillStems(stems, [...pond.flowers, ...pond.buds, ...pond.standing]);
    fillReeds(reeds, mulberry32(SEED + params.seed * 7919 + 3));
    if (looseOn) loose.sync();
    version += 1;
  };
  const rebuild = (key) => (v) => {
    params[key] = v;
    apply();
  };
  // wireframe và flatShading nằm trong cache key: đổi là biên dịch lại (vì vậy là núm 'rebuild' và thí nghiệm).
  const setAll = (prop, v) => {
    for (const m of materials) {
      m[prop] = v;
      m.needsUpdate = true;
    }
    version += 1;
  };
  apply();

  ctx.scene.add(...objects, hemi);
  shared.cot = {
    leafMaterial,
    standingMaterial,
    petalMaterial,
    coreMaterial,
    stemMaterial,
    reedMaterial,
    petalGeometry,
    openness: ctx.knob('openness'), // độ nở của hoa: hình cánh đổi thì bóng của hoa đổi
    get version() {
      return version;
    },
    hemi,
    hemiIntensity: STUDIO.intensity,
    casters: [standingLeaves, petals, cores, stems], // thứ đứng trên mặt nước: đổ bóng lên lá nổi
    receivers: [leaves],
  };

  let disposed = false;
  return {
    objects,
    onKnob: {
      leafCount: rebuild('leafCount'), // @knob leafCount
      seed: rebuild('seed'), // @knob seed
      sizeVariance: rebuild('sizeVariance'), // @knob sizeVariance
      cupAmount: rebuild('cupAmount'), // @knob cupAmount
      wireframe: (v) => setAll('wireframe', v), // @knob wireframe
    },
    experiments: [
      { id: 'noInstancing', toggle: (on) => setLoose(on) },
      { id: 'flatNormals', toggle: (on) => setAll('flatShading', on) },
    ],
    readouts: [
      { id: 'leaves', get: () => leaves.count + standingLeaves.count },
      { id: 'vertices', get: () => vertexCount(objects) },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      setLoose(false); // rút Group khỏi objects: vòng dưới gỡ hình và material, mà Group thì không có
      loose?.dispose();
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
