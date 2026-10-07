// paintings/dan-ga-me-con/layers/l1-cot.js — Lớp 1 · Cốt của Bức 4: tờ giấy cong, gà mẹ (mình, hai cánh), mười gà con bằng đất sét dưới đèn xưởng viết trong shader; dáng đi qua positionNode, lớp Đàn gà áp dáng mỗi khung qua shared.cot.pose; công bố "công thức tô" (recipe) cho các lớp sau.
import { Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, NodeMaterial } from 'three/webgpu';
import {
  Fn, attribute, color, dot, float, instancedBufferAttribute, instancedDynamicBufferAttribute, max, mix, normalWorld, positionWorld, uniform,
  uv, vec3,
} from 'three/tsl';
import { CAMERA, FLOOR, HEN, HOMES, PAPER, SUN, viewAngle } from '../parts/cot-bo-cuc.js';
import { PAPER_LENGTH, paperGeometry } from '../parts/cot-giay.js';
import {
  HEN_SHAPE, PART, chickGeometry, chickPosition, henGeometry, henPosition, henWingPosition, placement, ringsOf,
} from '../parts/cot-hinh-ga.js';

export const id = 'cot';

export const knobs = [
  // Số vòng quanh của mỗi khối: ít thì gà thành khối nhiều mặt. Dựng lại hình, không biên dịch lại. Mặc định và trần theo mức (bảng
  // quality.js: segments, segmentsMax). Ở 32 (mức cao) hai mặt kề nhau của mọi khối gãy dưới 20° (mình gà mẹ, cầu kéo dãn, tới 18,6°;
  // khối dẹt như cánh, bàn chân có nhiều vòng hơn: `detail` ở parts/cot-hinh-ga.js), dưới góc mà Bản nét bắt đầu coi là nếp gấp (chừng
  // 21°); 28 (mức vừa) tới 21,3°; 24 (mức thấp) tới 24,6°, chỉ còn vệt mực rất nhạt. Riêng cánh ong mỏng 0,09 lần gãy gắt ở số vòng nào
  // cũng vậy: vành của nó là nét viền.
  { id: 'segments', via: 'rebuild', min: 8, max: (env) => env.budget.segmentsMax ?? 48, step: 4, value: (env) => env.budget.segments ?? 32 },
  { id: 'wireframe', kind: 'bool', via: 'rebuild', value: false },
];

const TAU = Math.PI * 2;
/** Góc d (rad) về [−π, π): quay từ hướng này sang hướng kia theo đường ngắn nhất. */
const shortest = (d) => ((((d % TAU) + TAU + Math.PI) % TAU) - Math.PI);

/** Hướng nhìn của tranh (đơn vị, từ điểm nhìn về camera): Tấm bìa phẳng dẹt gà theo hướng này. */
const VIEW = (() => {
  const d = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
  return d.map((v) => v / Math.hypot(...d));
})();

/** Khối mình gà mẹ (cầu kéo dãn) trong bảng khối của gà mẹ. */
const HEN_BODY_SHAPE = HEN_SHAPE.body.find((s) => s.part === 'BODY');

/**
 * Ma trận đưa điểm thế giới về khung của khối mình gà mẹ ở dáng nghỉ, nơi mặt khối là cầu đơn vị: cùng phép đặt với henGeometry (khối đặt
 * bằng placement(), xoay theo HEN.heading, dời tới HEN.at). Bản nét đo chỗ cánh áp vào sườn bằng nó.
 */
function henBodyFrame() {
  const body = HEN_BODY_SHAPE;
  const place = new Matrix4().makeTranslation(HEN.at[0], 0, HEN.at[1]).multiply(new Matrix4().makeRotationY(HEN.heading));
  return place.multiply(placement(body)).multiply(new Matrix4().makeScale(body.r, body.r, body.r)).invert();
}

/**
 * Bán kính (trong khung trên) của mặt mà Bản nét đo viền cánh tới, ở `segments` của núm: cos(π/n), n là số vòng quanh của khối mình. Khối
 * là đa diện: đỉnh nằm trên mặt bầu dục thật, mặt phẳng giữa các đỉnh lõm vào trong, sâu nhất 1 − cos(π/n)·cos(π/2m) ở tâm mặt (m vòng
 * từ chân lên đỉnh); cos(π/n) là tâm cạnh của một vòng, chỗ mặt đa diện nằm ở giữa. Đo tới mặt thật thì chỗ cánh chui vào mình đa diện
 * nằm trong mặt thật, nét viền ra ngoài cánh, để lại một dải màu cánh giữa nét và sườn: chừng 3–5 điểm ảnh ở 24 vòng khi phóng to (GĐ 8
 * Task 9, chụp trên GPU thật).
 */
const bodyRadiusAt = (segments) => Math.cos(Math.PI / ringsOf(HEN_BODY_SHAPE, segments));

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
   * sau khi mọi lớp đã bọc recipe. `position`: positionNode (dáng của gà).
   */
  const make = (kind, { pigment = float(-1), position = null } = {}) => {
    const m = new NodeMaterial();
    m.wireframe = wire;
    m.colorNode = Fn(() => paint(pointOf(kind, pigment)))();
    m.emissiveNode = kind === 'giay' ? Fn(() => recipe.glint(pointOf(kind, pigment)))() : vec3(0);
    m.positionNode = position;
    return m;
  };

  const paper = new Mesh(paperGeometry(), make('giay'));
  paper.name = 'giay';

  // Tấm bìa phẳng (thí nghiệm biaPhang): mọi con gà dẹt theo hướng nhìn của tranh, còn 5% bề dày. Chỉ đổi uniform, không biên dịch lại.
  const view = vec3(...VIEW);
  const biaPhang = uniform(0).setName('cotBiaPhang');
  const keep = mix(float(1), float(0.05), biaPhang);

  // Gà mẹ: Group gồm mình và hai cánh. Bốn góc dáng (radian) là uniform: lớp Đàn gà ghi mỗi khung (Task 8); lúc dựng là dáng nghỉ.
  const henWing = uniform(0).setName('henWing');
  const henNod = uniform(0).setName('henNod');
  const henLook = uniform(0).setName('henLook');
  const henScratch = uniform(0).setName('henScratch');
  const segments = ctx.knobValue('segments');
  const bodyRadius = uniform(bodyRadiusAt(segments)).setName('henBodyRadius'); // núm segments đổi số này, không biên dịch lại
  const henShape = henGeometry({ segments });
  const henBody = new Mesh(henShape.body, make('ga', { position: henPosition({ nod: henNod, look: henLook, scratch: henScratch, view, keep }) }));
  const wingL = new Mesh(henShape.wingL, make('ga', { position: henWingPosition({ sign: 1, wing: henWing, view, keep }) }));
  const wingR = new Mesh(henShape.wingR, make('ga', { position: henWingPosition({ sign: -1, wing: henWing, view, keep }) }));
  const hen = new Group();
  hen.name = 'ga-me'; // Group: các mesh con (mình, hai cánh) không cần tên riêng
  for (const mesh of [henBody, wingL, wingR]) {
    mesh.frustumCulled = false; // đỉnh dời trong shader (cánh xòe, đầu gật): khung bao trên CPU không còn đúng
    hen.add(mesh);
  }

  // Mười gà con: MỘT InstancedMesh, ma trận instance giữ đơn vị. Chỗ đứng và hướng (pose: x, y, z, hướng) và góc cúi đầu (head, 0–1) là
  // thuộc tính instance mà lớp Đàn gà ghi MỖI khung (qua shared.cot.pose), nên dùng instancedDynamicBufferAttribute; chỉ số màu (pigment,
  // Bản màu đọc) chỉ ghi lúc dựng. Lúc dựng: dáng nghỉ ở nhà (HOMES), đầu ngẩng.
  const rest = HOMES.map((home) => [home.at[0], home.kind === 'back' ? HEN.back : 0, home.at[1], home.heading]);
  const poseAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length * 4), 4);
  const headAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length), 1);
  const pigmentAttr = new InstancedBufferAttribute(new Float32Array(HOMES.length), 1);
  HOMES.forEach((home, i) => {
    poseAttr.setXYZW(i, ...rest[i]);
    pigmentAttr.setX(i, home.pigment);
  });
  const chickMaterial = make('ga', {
    pigment: instancedBufferAttribute(pigmentAttr),
    position: chickPosition({
      pose: instancedDynamicBufferAttribute(poseAttr), head: instancedDynamicBufferAttribute(headAttr), view, keep,
    }),
  });
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

  /**
   * Dáng của đàn gà lúc này (dan-ga-song.js#state), hòa từ dáng nghỉ theo k (trọng số của lớp Đàn gà: 0 là dáng nghỉ, như tượng). Hướng
   * đi đường ngắn nhất. Lớp Đàn gà gọi mỗi khung; chưa có lớp ấy thì gà đứng ở dáng nghỉ ghi lúc dựng. Chỉ ghi thuộc tính và uniform: ma
   * trận instance giữ đơn vị, không computeBoundingSphere (frustumCulled = false).
   * @param {{ chicks: { x: number, y: number, z: number, heading: number, head: number }[], hen: { wing: number, nod: number, look: number,
   *   scratch: number } }} state
   * @param {number} k
   */
  const pose = (state, k) => {
    state.chicks.forEach((c, i) => {
      const [x, y, z, h] = rest[i];
      poseAttr.setXYZW(i, x + (c.x - x) * k, y + (c.y - y) * k, z + (c.z - z) * k, h + shortest(c.heading - h) * k);
      headAttr.setX(i, c.head * k);
    });
    poseAttr.needsUpdate = true;
    headAttr.needsUpdate = true;
    henWing.value = state.hen.wing * k;
    henNod.value = state.hen.nod * k;
    henLook.value = state.hen.look * k;
    henScratch.value = state.hen.scratch * k;
  };

  const objects = [paper, hen, chicks];
  const meshes = [paper, henBody, wingL, wingR, chicks];
  ctx.scene.add(...objects);
  shared.cot = {
    recipe,
    muc,
    sun,
    floor: FLOOR,
    pixel,
    paper,
    sheet: [PAPER.width, PAPER_LENGTH], // UV của tờ giấy chạy từ (0, 0) tới đây (đơn vị cảnh): Giấy điệp đo khoảng cách tới mép giấy
    PART,
    // bodyFrame: điểm thế giới → khung của khối mình (mặt khối là cầu đơn vị), ở dáng nghỉ; bodyRadius: bán kính trong khung ấy của mặt
    // mà viền đo tới (bodyRadiusAt). Bản nét vẽ viền cánh chỗ cánh áp sườn bằng hai thứ này.
    hen: {
      group: hen, body: henBody, wingL, wingR, wing: henWing, nod: henNod, look: henLook, scratch: henScratch, bodyFrame: henBodyFrame(),
      bodyRadius,
    },
    chicks: { mesh: chicks, pose: poseAttr, head: headAttr },
    pose,
  };

  let disposed = false;
  return {
    objects,
    update() {
      syncPixel(); // khung nhìn (đổi cỡ) và zoom (OrbitControls) đổi lúc chạy
    },
    // Góc lệch của camera khỏi góc của tranh: ctx.camera là camera của sân khấu (xưởng kéo nó về nhà khi buông tay, CameraSpec.home).
    readouts: [{ id: 'goc', get: () => viewAngle(ctx.camera.position.toArray()).toFixed(1), unit: '°' }],
    experiments: [{ id: 'biaPhang', toggle: (on) => { biaPhang.value = on ? 1 : 0; } }],
    onKnob: {
      segments: (v) => { // @knob segments
        const next = henGeometry({ segments: v });
        for (const [mesh, geometry] of [[henBody, next.body], [wingL, next.wingL], [wingR, next.wingR], [chicks, chickGeometry({ segments: v })]]) {
          mesh.geometry.dispose();
          mesh.geometry = geometry;
        }
        bodyRadius.value = bodyRadiusAt(v);
      },
      // wireframe nằm trong cache key: đổi là biên dịch lại (vì vậy là núm 'rebuild'), như Bức 1.
      wireframe: (v) => { // @knob wireframe
        for (const { material } of meshes) {
          material.wireframe = v;
          material.needsUpdate = true;
        }
      },
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects);
      for (const mesh of meshes) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      chicks.dispose();
    },
  };
}
