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
import { color, mix, uv, vec3 } from 'three/tsl';
import { moonPhase } from '../../../lib/astro/moon.js';
import { createMoon } from '../parts/anh-trang-moon.js';
import { paintCot } from '../parts/anh-trang-paint.js';

export const id = 'anh-trang';
export const knobs = [
  // Mặc định là pha trăng của ĐÊM NAY (ctx.now): value là hàm của env.
  { id: 'moonPhase', min: 0, max: Math.PI * 2, step: 0.01, value: (env) => moonPhase(env.now).phase },
  { id: 'rimPower', min: 0.5, max: 8, step: 0.1, value: 3 },
  { id: 'rimColor', kind: 'color', value: '#F2D48A' },
  { id: 'translucency', min: 0, max: 2, step: 0.01, value: 0.8 },
  { id: 'clearcoat', min: 0, max: 1, step: 0.01, value: 0 },
  { id: 'candleColor', kind: 'color', value: '#F2D48A' },
];

const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1
const SKY_FILL = 7; // trời chàm hắt xuống, nước đen hắt lên
const CANDLE = { intensity: 7, distance: 14, position: [-5, 0.08, 13] };

/** Đèn hoa đăng: 8 cánh (dùng lại hình cánh sen của Cốt) quây một ngọn nến là PointLight ấm. */
function createLantern(ctx, cot, w) {
  const hex = ctx.palette.hex;
  const candle = ctx.knob('candleColor'); // @knob candleColor
  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép.
  material.emissiveNode = candle.mul(mix(1.6, 0.3, uv().y)).mul(w);
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
  return { mesh, light, candle };
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
  paintCot(ctx, cot, w, shared.moon.dir);

  // Ánh trăng bạc-ngà: DirectionalLight chiếu từ phía trăng. Cường độ là uniform bên trong
  // node đèn, nên đổi mỗi khung theo trọng số mà không biên dịch lại.
  const moonlight = new DirectionalLight(hex.nga, 0);
  const fill = new HemisphereLight(hex.cham, hex.denThen, 0);

  // MỘT shadow map, bật một lần lúc dựng theo mức (cao 1024 / vừa 512 / thấp tắt).
  // castShadow, receiveShadow, shadowMap.enabled nằm trong cache key: không bao giờ đổi lúc chạy.
  const shadowSize = ctx.budget.shadow ?? { cao: 1024, vua: 512, thap: 0 }[ctx.level];
  if (shadowSize > 0) {
    ctx.renderer.shadowMap.enabled = true;
    moonlight.castShadow = true;
    moonlight.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(moonlight.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 320 });
    moonlight.shadow.bias = -0.0005;
    moonlight.shadow.normalBias = 0.03;
    for (const o of cot.casters) o.castShadow = true;
    for (const o of cot.receivers) o.receiveShadow = true;
  }

  const lantern = createLantern(ctx, cot, w);
  const added = [moon.moon, moonlight, moonlight.target, fill, lantern.mesh, lantern.light];
  ctx.scene.add(...added);

  let disposed = false;
  return {
    objects: [moon.moon, lantern.mesh],
    update(dt, t) {
      const k = w.value;
      const dir = shared.moon.dir.value;
      moon.update(dir);
      moonlight.position.copy(dir).multiplyScalar(150);
      moonlight.intensity = MOONLIGHT * k;
      fill.intensity = SKY_FILL * k;
      // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
      cot.hemi.intensity = cot.hemiIntensity * (1 - k);
      // Nến lung linh: hai sóng sin lệch nhịp, theo đồng hồ của xưởng (tất định với ?freeze).
      lantern.light.color.copy(lantern.candle.value);
      lantern.light.intensity = CANDLE.intensity * k * (0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 7)));
    },
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
