// paintings/den-keo-quan/layers/l1-cot.js — Lớp 1 · Cốt của Bức 2: gian nhà và chiếc đèn bằng đất sét dưới đèn xưởng; công bố số đo của đèn và hai hàm giao tia cho các lớp sau.
import { FrontSide, HemisphereLight, MeshPhysicalNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import { color, uniform, vec2, vec3 } from 'three/tsl';
import { ROOM, createRoom } from '../parts/cot-phong.js';
import { LANTERN, createLantern, cylinderExit, planeCross } from '../parts/cot-den.js';

export const id = 'cot';

/** Số đỉnh tự đếm (renderer.info không có bộ đếm đỉnh): position.count × số bản của InstancedMesh. */
const vertexCount = (objects) => objects.reduce(
  (total, o) => total + (o.geometry.getAttribute('position')?.count ?? 0) * (o.isInstancedMesh ? o.count : 1), 0,
);

export const knobs = [
  // Số cạnh của đèn: dựng lại hình giấy và đế (vài ms), ghi lại nan tre; gobo và màu giấy đọc uniform lanternSides.
  { id: 'sides', via: 'rebuild', min: 4, max: 8, step: 2, value: 6 },
  { id: 'wireframe', kind: 'bool', via: 'rebuild', value: false },
];

// Đèn xưởng: trời trắng, đất xám; đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0 (luật 1, luật 3).
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const clay = color(ctx.palette.hex.datSet);
  // Mỗi nhóm bề mặt một material riêng (lớp Gian nhà sơn từng nhóm một kiểu). Đất sét nhám, emissiveNode tường minh (luật 8).
  const make = (Material, options = {}) => {
    const m = new Material({ roughness: 0.9, metalness: 0, ...options });
    m.colorNode = clay;
    m.emissiveNode = vec3(0);
    return m;
  };
  const materials = {
    san: make(MeshStandardNodeMaterial),
    vach: make(MeshStandardNodeMaterial),
    tran: make(MeshStandardNodeMaterial),
    go: make(MeshStandardNodeMaterial),
    // Cột dùng Physical ngay từ đầu: lớp Gian nhà thêm clearcoat (sơn son), mà đổi loại material sau đó là biên dịch lại.
    cot: make(MeshPhysicalNodeMaterial),
    tre: make(MeshStandardNodeMaterial),
    nen: make(MeshStandardNodeMaterial),
    giay: make(MeshStandardNodeMaterial, { side: FrontSide }),
  };
  const room = createRoom(materials);
  const lantern = createLantern(materials, ctx.knobValue('sides'));
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
  const objects = [...room.objects, ...lantern.objects];
  ctx.scene.add(...objects, hemi);

  const sides = uniform(ctx.knobValue('sides')).setName('lanternSides');
  let version = 0; // tăng mỗi lần hình đổi (như Bức 1): lớp sau biết khi nào phải tính lại
  shared.cot = {
    hemi,
    hemiIntensity: STUDIO.intensity,
    // Số giữ là số (JS dùng); TSL dùng axisNode. Lớp sau nhận hai hàm giao tia qua đây: lớp không import part của lớp khác.
    lantern: { ...LANTERN, axisNode: vec2(...LANTERN.axis), sides, cylinderExit, planeCross },
    room: ROOM,
    paper: lantern.paper,
    materials,
    receivers: room.objects,
    casters: objects.filter((o) => o.castShadow),
    get version() { return version; },
  };

  // wireframe và flatShading nằm trong cache key: đổi là biên dịch lại một lần (vì vậy là núm 'rebuild' và thí nghiệm).
  const setAll = (prop, v) => {
    for (const m of Object.values(materials)) {
      m[prop] = v;
      m.needsUpdate = true;
    }
    version += 1;
  };

  let disposed = false;
  return {
    objects,
    onKnob: {
      sides: (v) => { // @knob sides
        lantern.rebuild(v);
        sides.value = v;
        version += 1;
      },
      wireframe: (v) => setAll('wireframe', v), // @knob wireframe
    },
    experiments: [{ id: 'flatNormals', toggle: (on) => setAll('flatShading', on) }],
    readouts: [{ id: 'vertices', get: () => vertexCount(objects) }],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects, hemi);
      for (const o of objects) o.geometry.dispose();
      for (const m of Object.values(materials)) m.dispose();
      hemi.dispose();
    },
  };
}
