// paintings/dan-ga-me-con/layers/l1-cot.js — Lớp 1 · Cốt của Bức 4: tờ giấy cong, gà mẹ, mười gà con bằng đất sét dưới đèn xưởng viết trong shader; công bố "công thức tô" (recipe) cho các lớp sau.
import { Group, InstancedBufferAttribute, InstancedMesh, Mesh, NodeMaterial } from 'three/webgpu';
import {
  Fn, attribute, color, cos, dot, float, instancedBufferAttribute, max, mix, normalLocal, normalWorld, positionLocal, positionWorld, sin,
  uniform, uv, vec3,
} from 'three/tsl';
import { FLOOR, HEN, HOMES, SUN } from '../parts/cot-bo-cuc.js';
import { paperGeometry } from '../parts/cot-giay.js';
import { chickGeometry, henGeometry } from '../parts/cot-hinh-ga.js';

export const id = 'cot';

export const knobs = [
  // Số vòng quanh của mỗi khối cầu: ít thì gà thành khối nhiều mặt. Dựng lại hình, không biên dịch lại.
  { id: 'segments', via: 'rebuild', min: 8, max: 48, step: 4, value: 24 },
  { id: 'wireframe', kind: 'bool', via: 'rebuild', value: false },
];

/** Xoay v quanh trục y (cos, sin của góc h), như rotation.y của three: x' = x cos h + z sin h, z' = z cos h − x sin h. */
const turnY = (v, c, s) => vec3(v.x.mul(c).add(v.z.mul(s)), v.y, v.z.mul(c).sub(v.x.mul(s)));

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  // Công thức tô (spec §20.4): Cốt điền phần đất sét; các lớp sau bọc từng hàm TRƯỚC lần biên dịch đầu, mỗi lớp tự trộn theo trọng
  // số của nó, nên mọi trọng số bằng 0 thì về đất sét. Đèn xưởng: một hướng nắng cộng một phần sáng đều, như Bức 3.
  const clay = color(ctx.palette.color('datSet'));
  const muc = color(ctx.palette.color('muc'));
  const sun = vec3(...SUN);
  const recipe = {
    base: (s) => clay.mul(float(0.35).add(max(dot(s.n, sun), 0).mul(0.65))),
    fill: (s) => recipe.base(s),
    ink: () => float(0),
    paper: (s) => recipe.base(s),
    glint: () => vec3(0),
  };
  /** Màu cuối của một điểm tô: tờ giấy theo paper; gà và thóc theo fill rồi phủ mực của nét trong (§20.4). */
  const paint = (s) => (s.kind === 'giay' ? recipe.paper(s) : mix(recipe.fill(s), muc, recipe.ink(s)));
  const pointOf = (kind, pigment) => ({
    kind, part: kind === 'giay' ? float(0) : attribute('part', 'float'), n: normalWorld, uv: uv(), pos: positionWorld, pigment,
  });
  const wire = ctx.knobValue('wireframe');
  /**
   * NodeMaterial gốc (lights = false: màu ra là colorNode cộng emissive). Màu dựng trong Fn gọi ngay: thân hàm chỉ chạy lúc biên dịch,
   * sau khi mọi lớp đã bọc recipe.
   */
  const make = (kind, pigment = float(-1)) => {
    const m = new NodeMaterial();
    m.wireframe = wire;
    m.colorNode = Fn(() => paint(pointOf(kind, pigment)))();
    m.emissiveNode = kind === 'giay' ? Fn(() => recipe.glint(pointOf(kind, pigment)))() : vec3(0);
    return m;
  };

  const paper = new Mesh(paperGeometry(), make('giay'));
  paper.name = 'giay';

  const segments = ctx.knobValue('segments');
  const henBody = new Mesh(henGeometry({ segments }).body, make('ga'));
  const hen = new Group();
  hen.name = 'ga-me'; // Group: các mesh con (mình; Task 4 thêm hai cánh) không cần tên riêng
  hen.add(henBody);

  // Mười gà con: MỘT InstancedMesh, ma trận instance giữ đơn vị. Chỗ đứng và hướng (pose: x, y, z, hướng) là thuộc tính instance, áp
  // trong positionNode. Góc cúi đầu (head; positionNode đọc từ Task 4) và chỉ số màu (pigment; Bản màu đọc) cũng là thuộc tính instance.
  // Bản khung ghi một lần lúc dựng; Task 4 ghi pose, head mỗi khung.
  const poseAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length * 4), 4);
  const headAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length), 1);
  const pigmentAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length), 1);
  HOMES.forEach((home, i) => {
    poseAttr.setXYZW(i, home.at[0], home.kind === 'back' ? HEN.back : 0, home.at[1], home.heading);
    pigmentAttr.setX(i, home.pigment);
  });
  const pose = instancedBufferAttribute(poseAttr);
  const chickMaterial = make('ga', instancedBufferAttribute(pigmentAttr));
  chickMaterial.positionNode = Fn(() => {
    const c = cos(pose.w).toVar();
    const s = sin(pose.w).toVar();
    normalLocal.assign(turnY(normalLocal, c, s));
    return turnY(positionLocal, c, s).add(pose.xyz);
  })();
  const chicks = new InstancedMesh(chickGeometry({ segments }), chickMaterial, HOMES.length);
  chicks.name = 'ga-con';
  chicks.frustumCulled = false; // vị trí thật chỉ có trong shader

  // Đơn vị cảnh của một điểm ảnh thiết bị, cho các lớp đo nét theo điểm ảnh (Bản nét). Cốt là lớp đầu, nên lớp sau đọc số của chính khung.
  const pixel = uniform(0).setName('cotPixel');
  const syncPixel = () => {
    const cam = ctx.camera;
    pixel.value = (cam.top - cam.bottom) / cam.zoom / Math.max(ctx.u.resolution.value.y, 1);
  };
  syncPixel();

  const objects = [paper, hen, chicks];
  const materials = [paper.material, henBody.material, chickMaterial];
  ctx.scene.add(...objects);
  shared.cot = {
    recipe, muc, sun, floor: FLOOR, pixel, paper, hen: { group: hen, body: henBody }, chicks: { mesh: chicks, pose: poseAttr, head: headAttr },
  };

  let disposed = false;
  return {
    objects,
    update() {
      syncPixel(); // khung nhìn (đổi cỡ) và zoom (OrbitControls) đổi lúc chạy
    },
    onKnob: {
      segments: (v) => { // @knob segments
        henBody.geometry.dispose();
        henBody.geometry = henGeometry({ segments: v }).body;
        chicks.geometry.dispose();
        chicks.geometry = chickGeometry({ segments: v });
      },
      // wireframe nằm trong cache key: đổi là biên dịch lại (vì vậy là núm 'rebuild'), như Bức 1.
      wireframe: (v) => { // @knob wireframe
        for (const m of materials) {
          m.wireframe = v;
          m.needsUpdate = true;
        }
      },
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects);
      for (const mesh of [paper, henBody, chicks]) mesh.geometry.dispose();
      chicks.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
