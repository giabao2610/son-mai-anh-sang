// paintings/ao-sen-dem/layers/l2-anh-trang.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + một shadow map, chất liệu, đèn hoa đăng.
import {
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Object3D,
  PointLight,
} from 'three/webgpu';
import { color, cos, mix, oneMinus, uniform, uv, vec3 } from 'three/tsl';
import { moonPhase } from '../../../lib/astro/moon.js';
import { createMoon } from '../parts/anh-trang-moon.js';
import { paintCot } from '../parts/anh-trang-paint.js';
import { LIGHT_DISTANCE, createShadowWatch } from '../parts/anh-trang-shadow.js';

export const id = 'anh-trang';

const SHADOW = { cao: 1024, vua: 512, thap: 0 }; // cỡ shadow map theo mức; 0 = tắt bóng
const SHADOW_FLOOR = 256; // nấc 'bong' chia đôi cỡ map nhưng không xuống dưới số này
const BIAS = { bias: -0.0005, normal: 0.03 };

export const knobs = [
  // Mặc định là pha trăng của ĐÊM NAY (ctx.now): value là hàm của env.
  { id: 'moonPhase', min: 0, max: Math.PI * 2, step: 0.01, value: (env) => moonPhase(env.now).phase },
  { id: 'rimPower', min: 0.5, max: 8, step: 0.1, value: 3 },
  { id: 'rimColor', kind: 'color', value: '#F2D48A' },
  { id: 'translucency', min: 0, max: 2, step: 0.01, value: 0.8 },
  { id: 'clearcoat', min: 0, max: 1, step: 0.01, value: 0 },
  { id: 'candleColor', kind: 'color', value: '#F2D48A' },
  { id: 'candleIntensity', via: 'js', min: 0, max: 30, step: 0.5, value: 7 },
  // Ở mức thấp bóng tắt hẳn (castShadow nằm trong cache key, bật một lần lúc dựng): núm vẫn có nhưng không làm gì.
  { id: 'shadowMapSize', via: 'js', min: 256, max: 2048, step: 256, value: (env) => (env.budget.shadow ?? SHADOW[env.level]) || 512 },
  { id: 'shadowBias', via: 'js', min: -0.005, max: 0.005, step: 0.0001, value: BIAS.bias },
];

const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1
const SKY_FILL = 4; // trời chàm hắt xuống, nước đen hắt lên
const CANDLE = { distance: 14, position: [-5, 0.08, 13] };

/**
 * Đèn hoa đăng: 8 cánh quây một ngọn nến là PointLight ấm. Cánh dùng lại HÌNH cánh sen của Cốt (shared.cot.petalGeometry)
 * nhưng mesh và material là của lớp này: tắt lớp Ánh trăng thì đèn cũng về đất sét, không kéo theo hoa của Cốt.
 */
function createLantern(ctx, cot, w) {
  const hex = ctx.palette.hex;
  const candle = ctx.knob('candleColor'); // @knob candleColor
  // Thí nghiệm "Đổi màu đèn": 0 = màu nến của núm, 1 = đỏ son. Cùng một ánh sáng, mỗi chất liệu đáp lại một kiểu.
  const swap = uniform(0).setName('anh_trang_swap');
  const flame = mix(candle, color(hex.doSon), swap);
  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép.
  material.emissiveNode = flame.mul(mix(1.6, 0.3, uv().y)).mul(w);
  const mesh = new InstancedMesh(cot.petalGeometry, material, 8);
  const dummy = new Object3D();
  dummy.rotation.order = 'YXZ';
  for (let k = 0; k < 8; k++) {
    const yaw = (k / 8) * Math.PI * 2;
    dummy.position.set(CANDLE.position[0] + Math.cos(yaw) * 0.12, CANDLE.position[1], CANDLE.position[2] + Math.sin(yaw) * 0.12);
    dummy.rotation.set(-0.45, -yaw - Math.PI / 2, 0);
    dummy.scale.setScalar(0.55);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
  }
  const light = new PointLight(candle.value, 0, CANDLE.distance, 2);
  light.position.set(CANDLE.position[0], CANDLE.position[1] + 0.3, CANDLE.position[2]);
  const red = ctx.palette.color('doSon');
  // Màu của đèn thật (CPU) đi theo cùng công thức với màu của giấy (GPU).
  const sync = () => light.color.copy(candle.value).lerp(red, swap.value);
  return { mesh, light, swap, sync };
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (lớp trước) và shared.moon (setup của bức)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const hex = ctx.palette.hex;
  const { cot } = shared;

  const moon = createMoon(ctx, w, ctx.knob('moonPhase')); // @knob moonPhase
  const paint = paintCot(ctx, cot, w, shared.moon.dir);
  // Độ sáng của trăng cho các lớp sau (quầng trăng, sương sáng về phía trăng, phản chiếu giả): trọng số × phần mặt trăng
  // được chiếu, (1 − cos pha) / 2: rằm là 1, trăng mới là 0.
  shared.anhTrang = { glow: w.mul(oneMinus(cos(ctx.knob('moonPhase'))).mul(0.5)) };

  // Ánh trăng bạc-ngà: DirectionalLight chiếu từ phía trăng. Cường độ là uniform bên trong
  // node đèn, nên đổi mỗi khung theo trọng số mà không biên dịch lại.
  const moonlight = new DirectionalLight(hex.nga, 0);
  const fill = new HemisphereLight(hex.cham, hex.denThen, 0);

  // MỘT shadow map, bật một lần lúc dựng theo mức (cao 1024 / vừa 512 / thấp tắt).
  // castShadow, receiveShadow, shadowMap.enabled nằm trong cache key: không bao giờ đổi lúc chạy.
  // Bias đổi được bất cứ lúc nào (ShadowNode đọc bằng reference() khi tra bóng). Shadow map thì TĨNH (GĐ 3): chỉ vẽ lại
  // khi hướng trăng, độ nở hoa hay bố cục của Cốt đổi, hoặc khi cỡ map đổi (ShadowNode gọi setSize lúc vẽ lại).
  const shadowOn = (ctx.budget.shadow ?? SHADOW[ctx.level]) > 0;
  let bias = ctx.knobValue('shadowBias');
  let acne = false; // thí nghiệm "Bias = 0" đang bật
  let size = ctx.knobValue('shadowMapSize'); // ý người xem (núm)
  let cap = Infinity; // trần của máy (nấc 'bong' của bộ điều chỉnh); hiệu lực = min(núm, trần)
  const applySize = () => {
    const s = Math.min(size, cap);
    moonlight.shadow.mapSize.set(s, s);
    moonlight.shadow.needsUpdate = true;
  };
  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  const halveShadow = {
    id: 'bong',
    apply() {
      before = cap;
      cap = Math.max(SHADOW_FLOOR, Math.min(size, cap) / 2);
      applySize();
    },
    revert() {
      cap = before;
      applySize();
    },
  };
  let watch = null;
  if (shadowOn) {
    ctx.renderer.shadowMap.enabled = true;
    moonlight.castShadow = true;
    applySize();
    moonlight.shadow.bias = bias;
    moonlight.shadow.normalBias = BIAS.normal;
    for (const o of cot.casters) o.castShadow = true;
    for (const o of cot.receivers) o.receiveShadow = true;
    watch = createShadowWatch({ shadow: moonlight.shadow, dir: shared.moon.dir, cot });
  }

  const lantern = createLantern(ctx, cot, w);
  let candleIntensity = ctx.knobValue('candleIntensity');
  const added = [moon.moon, moonlight, moonlight.target, fill, lantern.mesh, lantern.light];
  ctx.scene.add(...added);

  let disposed = false;
  return {
    objects: [moon.moon, lantern.mesh],
    update(dt, t) {
      const k = w.value;
      const dir = shared.moon.dir.value;
      moon.update(dir);
      moonlight.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);
      watch?.check(); // có gì đổi thì khớp lại khung bóng và vẽ lại shadow map MỘT lần
      moonlight.intensity = MOONLIGHT * k;
      fill.intensity = SKY_FILL * k;
      // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
      cot.hemi.intensity = cot.hemiIntensity * (1 - k);
      // Nến lung linh: hai sóng sin lệch nhịp, theo đồng hồ của xưởng (tất định với ?freeze).
      lantern.sync();
      lantern.light.intensity = candleIntensity * k * (0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 7)));
    },
    onKnob: {
      candleIntensity: (v) => { candleIntensity = v; }, // @knob candleIntensity
      shadowMapSize: (v) => { // @knob shadowMapSize
        size = v;
        applySize();
      },
      shadowBias: (v) => { // @knob shadowBias
        bias = v;
        if (!acne) moonlight.shadow.bias = v;
      },
    },
    experiments: [
      {
        // Không có bias, mặt nhận bóng tự che chính nó: sọc "shadow acne" hiện trên lá.
        id: 'biasZero',
        toggle(on) {
          acne = on;
          moonlight.shadow.bias = on ? 0 : bias;
          moonlight.shadow.normalBias = on ? 0 : BIAS.normal;
        },
      },
      { id: 'noRim', toggle: (on) => { paint.rimOn.value = on ? 0 : 1; } },
      { id: 'redCandle', toggle: (on) => { lantern.swap.value = on ? 1 : 0; } },
    ],
    readouts: [{ id: 'shadowMap', get: () => (shadowOn ? moonlight.shadow.mapSize.x : 0), unit: 'px' }],
    // Nấc của bộ điều chỉnh: chia đôi cỡ shadow map (không dưới 256). Mức thấp tắt bóng nên không có nấc này.
    degrade: shadowOn ? [halveShadow] : [],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...added);
      moon.dispose();
      lantern.mesh.dispose();
      lantern.mesh.material.dispose();
      moonlight.dispose();
      fill.dispose();
      lantern.light.dispose();
    },
  };
}
