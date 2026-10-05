// paintings/cung-que/layers/l1-cot.js — Lớp 1 · Cốt của Bức 3: thế giới SDF (hành tinh, cây đa) bằng đất sét, vẽ bằng một khối bao dò tia; công bố hàm khoảng cách và "công thức tô" cho các lớp sau.
import { color, dot, float, int, max, min, mix, normalize, uniform, vec3 } from 'three/tsl';
import { BOUNDS, CUOI, EARTH, PLANET, TREE } from '../parts/cot-the-gioi.js';
import { ID, PRIMITIVES, createScene } from '../parts/cot-sdf.js';
import { createSdfVolume, makeShade } from '../parts/cot-do-tia.js';

export const id = 'cot';

export const knobs = [
  // Số bước dò tối đa của mỗi tia: ít bước thì mép hình và chỗ tia đi sát mặt bị thủng. Trần theo mức (budget.steps).
  { id: 'steps', min: 16, max: (env) => env.budget.steps ?? 128, step: 1, value: (env) => env.budget.steps ?? 128 },
  // Độ hòa khối: giữa chân rễ và đất, giữa các khối của tán (spec §19.4 lớp 1).
  { id: 'smooth', min: 0, max: 0.15, step: 0.005, value: 0.06 },
];

/** Đèn xưởng viết trong shader: một hướng sáng cố định cộng một phần sáng đều, như HemisphereLight của hai bức trước. */
const STUDIO = [0.4, 0.8, 0.45];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  setup() đã có shared.lift (độ cao bay của cây); Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const steps = ctx.knob('steps'); // @knob steps
  const smoothKnob = ctx.knob('smooth'); // @knob smooth
  const fullSteps = ctx.budget.steps ?? 128;
  const stepsCap = uniform(fullSteps).setName('cotStepsCap'); // nấc 'buoc' hạ trần, không ghi vào núm
  const hard = uniform(0).setName('cotHardUnion');
  const showBounds = uniform(0).setName('cotShowBounds');
  const showSteps = uniform(0).setName('cotShowSteps');
  const depthOff = uniform(0).setName('cotDepthOff');
  const smooth = smoothKnob.mul(float(1).sub(hard));
  const scene = createScene({ lift: shared.lift, smooth });

  // Công thức tô (spec §19.4): Cốt điền phần đất sét; các lớp sau thay hay bọc từng hàm trước khi biên dịch
  const clayColor = color(ctx.palette.color('datSet'));
  const studio = normalize(vec3(...STUDIO));
  const recipe = {
    clay: (h) => clayColor.mul(float(0.35).add(max(dot(h.n, studio), 0).mul(0.65))),
    albedo: () => clayColor,
    sun: () => vec3(0),
    sunWeight: float(0),
    visibility: () => float(1),
    ambient: () => vec3(0),
    occlusion: () => float(1),
  };
  const shade = makeShade(recipe);
  const cham = color(ctx.palette.color('cham'));
  const vangLa = color(ctx.palette.color('vangLa'));
  const volume = createSdfVolume({
    scene,
    bounds: BOUNDS,
    steps: int(min(steps, stepsCap)),
    shade,
    showBounds,
    showSteps,
    stepsColor: (k) => mix(cham, vangLa, k),
    depthOff,
  });
  ctx.scene.add(volume.mesh);

  shared.cot = {
    mesh: volume.mesh, material: volume.material, scene, recipe, shade, bounds: BOUNDS, lift: shared.lift, smooth, depthOff,
    world: { PLANET, TREE, EARTH, CUOI }, ID,
  };

  return {
    objects: [volume.mesh],
    experiments: [
      { id: 'soBuoc', toggle: (on) => { showSteps.value = on ? 1 : 0; } },
      { id: 'khoiBao', toggle: (on) => { showBounds.value = on ? 1 : 0; } },
      { id: 'hoaCung', toggle: (on) => { hard.value = on ? 1 : 0; } },
    ],
    readouts: [
      // Một đơn vị của cảnh coi như 10 m (spec §19.5)
      { id: 'bay', get: () => (shared.lift.value * 10).toFixed(1), unit: 'm' },
      { id: 'buoc', get: () => Math.round(Math.min(steps.value, stepsCap.value)) },
      { id: 'hinh', get: () => PRIMITIVES },
    ],
    degrade: [
      {
        id: 'buoc',
        apply() { stepsCap.value = Math.round(fullSteps * 0.75); },
        revert() { stepsCap.value = fullSteps; },
      },
    ],
    dispose() {
      ctx.scene.remove(volume.mesh);
      volume.mesh.geometry.dispose();
      volume.material.dispose();
    },
  };
}
