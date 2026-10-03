// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector; mức thấp soi giả), gợn sóng xẻ bóng trăng, lá nhấp nhô.
import { CircleGeometry, Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
import {
  Fn,
  attribute,
  cameraPosition,
  color,
  dot,
  float,
  max,
  mix,
  mrt,
  mx_noise_vec3,
  normalize,
  oneMinus,
  positionLocal,
  positionWorld,
  pow,
  reflector,
  saturate,
  transformNormalToView,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { POND_RADIUS, makeRippleHeight } from '../shared.js';
import { fakeReflection } from '../parts/mat-nuoc-gia.js';

export const id = 'mat-nuoc';
export const knobs = [
  { id: 'amplitude', min: 0, max: 1, step: 0.01, value: 0.35 },
  { id: 'speed', min: 0.5, max: 8, step: 0.1, value: 3 },
  { id: 'decay', min: 0.1, max: 2, step: 0.01, value: 0.55 },
  { id: 'wavelength', min: 0.3, max: 4, step: 0.05, value: 1.4 },
  { id: 'distortion', min: 0, max: 0.15, step: 0.001, value: 0.04 },
  { id: 'fresnelPower', min: 1, max: 10, step: 0.1, value: 5 },
  // Độ phân giải ảnh phản chiếu so với màn hình (cao 0.5 / vừa 0.35). Reflector đọc số này mỗi khung.
  // Trần theo mức: ngoài mức cao, kéo tối đa 0.6 (vẽ cả cảnh lần hai ở độ phân giải đầy đủ là quá sức máy yếu).
  {
    id: 'reflectionResolution',
    via: 'js',
    min: 0.1,
    max: (env) => (env.level === 'cao' ? 1 : 0.6),
    step: 0.05,
    value: (env) => env.budget.reflection ?? (env.level === 'cao' ? 0.5 : 0.35),
  },
];

const F0 = 0.03; // phản xạ khi nhìn thẳng xuống (Schlick): nước và sơn bóng đều khoảng 2–4%
const RES_FLOOR = 0.15; // nấc 'phan-chieu' chia đôi độ phân giải phản chiếu nhưng không xuống dưới số này
const BOB = 0.6; // lá nhô lên bằng 60% độ cao sóng
const GLINT = 0.8; // phần phản chiếu sáng hơn mức này mới vào kênh emissive (bloom)

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.ripples, shared.moon (setup của bức); shared.cot, shared.anhTrang, shared.suong (lớp trước)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng (tất định với ?freeze), KHÔNG dùng time của TSL
  const hex = ctx.palette.hex;

  const ripple = makeRippleHeight({
    ripples: shared.ripples.node,
    time: t,
    amplitude: ctx.knob('amplitude'), // @knob amplitude
    speed: ctx.knob('speed'), // @knob speed
    decay: ctx.knob('decay'), // @knob decay
    wavelength: ctx.knob('wavelength'), // @knob wavelength
  });

  // Pháp tuyến của nước: sai phân của độ cao gợn sóng, cộng hai lớp noise trôi ngược chiều ("nước thở").
  const normal = Fn(() => {
    const p = positionWorld.xz;
    const e = 0.05;
    const h = ripple(p);
    const slope = vec2(h.sub(ripple(p.add(vec2(e, 0)))), h.sub(ripple(p.add(vec2(0, e))))).div(e);
    const slow = mx_noise_vec3(vec3(p.mul(0.18).add(vec2(t.mul(0.05), 0)), t.mul(0.1)));
    const fast = mx_noise_vec3(vec3(p.mul(vec2(1.4, 3.2)).sub(vec2(0, t.mul(0.3))), t.mul(0.4)));
    const breath = slow.xy.mul(0.15).add(fast.xy.mul(0.35));
    return normalize(vec3(slope.x.add(breath.x), 1, slope.y.add(breath.y)));
  })();

  // Reflector: mỗi khung render lại cả cảnh từ camera lật qua mặt nước, vào texture nhỏ hơn màn hình.
  // Mức thấp (budget.reflection = 0) không có reflector: phản chiếu giả, tính theo công thức (parts/mat-nuoc-gia.js).
  const fake = ctx.budget.reflection === 0;
  let scale = ctx.knobValue('reflectionResolution'); // ý người xem (núm)
  let cap = Infinity; // trần của máy (nấc 'phan-chieu'); hiệu lực = min(núm, trần)
  let lowRes = false; // thí nghiệm "Độ phân giải 0.1" đang bật
  const refl = fake ? null : reflector({ resolutionScale: scale });
  const applyScale = () => {
    if (refl) refl.reflector.resolutionScale = lowRes ? 0.1 : Math.min(scale, cap); // reflector đọc số này ở khung sau
  };
  if (refl) {
    // Pháp tuyến của gương là +Z cục bộ của target: xoay −π/2 để +Z chỉ lên trời. Reflector đọc
    // target.matrixWorld mà KHÔNG tự cập nhật: target phải nằm trong scene, nếu không ta có gương dựng đứng.
    refl.target.rotateX(-Math.PI / 2);
    ctx.scene.add(refl.target);
    // Sóng làm lệch chỗ đọc ảnh phản chiếu: vòng gợn đi qua là bóng trăng bị xẻ đôi.
    refl.uvNode = refl.uvNode.add(normal.xz.mul(ctx.knob('distortion'))); // @knob distortion
  }
  const reflection = refl ? refl.rgb : fakeReflection(ctx, shared, normal);

  // Hai công tắc của tab Phá (uniform, bật/tắt không biên dịch lại).
  const fresnelOn = uniform(1).setName('mat_nuoc_fresnelOn'); // "Tắt fresnel": 0 → soi như gương phẳng
  const showHeight = uniform(0).setName('mat_nuoc_showHeight'); // "Xem heightfield": 1 → mặt nước là ảnh xám của h(xz)

  // Schlick fresnel: nhìn càng xiên (về chân trời) nước càng soi rõ; nhìn thẳng xuống thì thấy nước sâu.
  const view = normalize(cameraPosition.sub(positionWorld));
  const schlick = float(F0).add(oneMinus(saturate(dot(normal, view))).pow(ctx.knob('fresnelPower')).mul(1 - F0)); // @knob fresnelPower
  const fresnel = mix(float(1), schlick, fresnelOn);
  const mirror = reflection.mul(fresnel).mul(w).mul(oneMinus(showHeight));
  // Độ cao gợn sóng (khoảng ±0.5) đổi thành xám quanh 0.5: sáng là đỉnh sóng, tối là đáy sóng.
  const height = vec3(ripple(positionWorld.xz).mul(2).add(0.5)).mul(showHeight);

  // Có chiếu sáng: ở trọng số 0 đĩa là đất sét dưới đèn xưởng như mọi hình khác (luật 3).
  const material = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0 });
  // Nước sâu: đen then ngả nâu cánh gián như đáy poster (lượt màu GĐ 3); trọng số 0 là đất sét.
  material.colorNode = mix(mix(color(hex.datSet), mix(color(hex.denThen), color(hex.canhGian), 0.5), w), vec3(0), showHeight);
  material.roughnessNode = mix(float(0.9), float(0.06), w);
  material.normalNode = transformNormalToView(mix(vec3(0, 1, 0), normal, w)); // đĩa đặt ở gốc: local = world
  // Ảnh phản chiếu cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
  material.emissiveNode = mirror.add(height);
  // ...nhưng kênh MRT 'emissive' của nước CHỈ nhận phần sáng vượt GLINT: bóng trăng và bóng đom đóm
  // tỏa nhẹ, còn cả mặt nước thì không. Sương không chạm tới kênh emissive, nên tự nhân (1 − hệ số sương):
  // bóng trăng ở xa trong sương không bloom xuyên sương. mrtNode chỉ an toàn vì reflector tự ẩn chính mặt nước
  // khi chụp (mức thấp thì không có reflector): material có mrtNode mà vẽ vào target KHÔNG có MRT sẽ hỏng shader.
  material.mrtNode = mrt({ emissive: vec4(max(mirror.sub(GLINT), 0).mul(oneMinus(shared.suong.fogFactor)), 1) });

  const geometry = new CircleGeometry(POND_RADIUS, 96).rotateX(-Math.PI / 2); // đĩa nước thuộc lớp này
  const water = new Mesh(geometry, material);
  water.name = 'mat-nuoc';
  ctx.scene.add(water);

  // Lá nổi của Cốt nhấp nhô theo cùng hàm sóng, đọc TÂM lá (positionNode chạy sau instancing).
  const center = attribute('instanceCenter', 'vec2');
  shared.cot.leafMaterial.positionNode = positionLocal.add(vec3(0, ripple(center).mul(BOB).mul(w), 0));

  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  let disposed = false;
  return {
    objects: [water],
    onKnob: {
      reflectionResolution: (v) => { // @knob reflectionResolution
        scale = v;
        applyScale();
      },
    },
    experiments: [
      // Ảnh phản chiếu chỉ còn 1/10 độ phân giải màn hình: bóng trăng vỡ thành khối, nhưng rẻ hơn nhiều.
      // Phản chiếu giả (mức thấp) không có ảnh nào để hạ: không đưa ra nút bấm mà ảnh không đổi.
      ...(refl ? [{ id: 'lowRes', toggle: (on) => { lowRes = on; applyScale(); } }] : []),
      { id: 'noFresnel', toggle: (on) => { fresnelOn.value = on ? 0 : 1; } },
      { id: 'heightfield', toggle: (on) => { showHeight.value = on ? 1 : 0; } },
    ],
    readouts: [{ id: 'reflectionScale', get: () => (refl ? refl.reflector.resolutionScale : 0) }],
    // Nấc của bộ điều chỉnh: chia đôi độ phân giải phản chiếu (không dưới 0,15). Phản chiếu giả thì không có gì để hạ.
    degrade: refl
      ? [{
        id: 'phan-chieu',
        apply() {
          before = cap;
          cap = Math.max(RES_FLOOR, Math.min(scale, cap) * 0.5);
          applyScale();
        },
        revert() {
          cap = before;
          applyScale();
        },
      }]
      : [],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(water);
      geometry.dispose();
      material.dispose();
      if (refl) {
        ctx.scene.remove(refl.target);
        refl.dispose(); // giải phóng render target của ảnh phản chiếu
      }
    },
  };
}
