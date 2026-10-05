// paintings/cung-que/layers/l5-la-da.js — Lớp 5 · Lá đa của Bức 3: chạm thì lá rơi theo trọng lực trăng, đường rơi tính trên GPU; lá xếp lớp với thế giới SDF nhờ độ sâu.
import { color } from 'three/tsl';
import { GRAVITY } from '../parts/la-da-roi.js';
import { createLeafMesh } from '../parts/la-da-mesh.js';

export const id = 'la-da';

export const knobs = [
  // Số lá mỗi lần chạm. Số lá đang rơi đã có trần theo mức (budget.leaves), nên núm này không cần trần theo mức.
  { id: 'burst', via: 'js', min: 1, max: 8, step: 1, value: 4 },
  // Trọng lực: trăng (1,62 m/s²) hay Trái Đất (9,81 m/s²). Chỉ áp cho lá rơi từ lúc đổi: lá đang rơi giữ g của nó.
  { id: 'gravity', kind: 'select', via: 'js', options: ['trang', 'traiDat'], value: 'trang' },
];

/** Độ cao từ tán xuống đất mà số đo "Thời gian rơi" lấy làm mốc (0,6 đơn vị = 6 m). */
const DROP = 0.6;
/** Độ tỏa của lá (phần của màu vàng lá): đủ thấy trên nền trời đen, không át nắng. */
const GLOW = 0.35;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  setup() có shared.leafFall (ô lá, chạm ghi vào); Cốt có shared.cot (shade, depthOff, world, ID)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const fall = shared.leafFall;
  fall.count = ctx.knobValue('burst');
  fall.g = GRAVITY[ctx.knobValue('gravity')];
  const { shade, depthOff, world, ID } = shared.cot;
  const glow = color(ctx.palette.color('vangLa')).mul(GLOW);
  const leaf = createLeafMesh({ fall, time: ctx.u.time, w, shade, radius: world.PLANET.radius, leafId: ID.LEAF, glow });
  ctx.scene.add(leaf.mesh);

  return {
    objects: [leaf.mesh],
    onKnob: {
      burst: (v) => { fall.count = v; }, // @knob burst
      gravity: (v) => { fall.g = GRAVITY[v]; }, // @knob gravity
    },
    // Khối bao thôi ghi độ sâu của điểm chạm: lá sau thân cây cũng hiện đè lên thân cây
    experiments: [{ id: 'doSau', toggle: (on) => { depthOff.value = on ? 1 : 0; } }],
    readouts: [
      { id: 'la', get: () => fall.falling(ctx.u.time.value) },
      { id: 'roi', get: () => Math.sqrt((2 * DROP) / fall.g).toFixed(1), unit: 's' },
    ],
    // Mỗi khung (cả update(0, t) lúc ?freeze vẽ lại): chỉ ghi thuộc tính khi có cú chạm mới; vị trí do shader tính
    update() {
      leaf.sync();
    },
    dispose() {
      ctx.scene.remove(leaf.mesh);
      leaf.mesh.geometry.dispose();
      leaf.mesh.material.dispose();
    },
  };
}
