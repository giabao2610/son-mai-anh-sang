// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước v0: đĩa nước đen bóng soi cả cảnh bằng reflector.
import { CircleGeometry, Mesh, MeshBasicNodeMaterial } from 'three/webgpu';
import {
  color,
  dot,
  max,
  mix,
  mx_noise_vec3,
  normalView,
  oneMinus,
  positionViewDirection,
  positionWorld,
  pow,
  reflector,
  saturate,
  vec2,
  vec3,
} from 'three/tsl';

export const id = 'mat-nuoc';
export const knobs = [
  { id: 'distortion', min: 0, max: 0.1, step: 0.001, value: 0.02 },
  { id: 'fresnelPower', min: 1, max: 10, step: 0.1, value: 5 },
];

const WATER_RADIUS = 60; // đĩa nước thuộc lớp này; ở trọng số 0 nó là đất sét

/** @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx */
export function createLayer(ctx) {
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng (tất định với ?freeze), KHÔNG dùng time của TSL

  // Reflector: mỗi khung render lại cả cảnh từ một camera ảo lật qua mặt nước, vào một texture
  // nhỏ hơn màn hình (resolutionScale). Ảnh đó không có MRT, tức là không có kênh emissive.
  const refl = reflector({ resolutionScale: ctx.budget.reflection ?? (ctx.level === 'cao' ? 0.5 : 0.35) });
  // Pháp tuyến của gương là trục +Z cục bộ của target: xoay −π/2 để +Z chỉ lên trời.
  // Reflector đọc target.matrixWorld mà KHÔNG tự cập nhật: target phải nằm trong scene,
  // nếu không matrixWorld giữ nguyên ma trận đơn vị và ta được một tấm gương dựng đứng.
  refl.target.rotateX(-Math.PI / 2);
  ctx.scene.add(refl.target);

  // Mặt nước "thở": hai lớp noise trôi ngược chiều nhau làm lệch UV lúc đọc ảnh phản chiếu.
  const p = positionWorld.xz;
  const slow = mx_noise_vec3(vec3(p.mul(0.18).add(vec2(t.mul(0.05), 0)), t.mul(0.1)));
  const fast = mx_noise_vec3(vec3(p.mul(0.55).sub(vec2(0, t.mul(0.08))), t.mul(0.17)));
  const wobble = slow.xy.add(fast.xy.mul(0.5));
  refl.uvNode = refl.uvNode.add(wobble.mul(ctx.knob('distortion'))); // @knob distortion

  // Fresnel: nhìn càng xiên (về phía chân trời) nước càng soi rõ; nhìn thẳng xuống thì thấy nước sâu.
  const facing = saturate(dot(normalView, positionViewDirection));
  const fresnel = pow(oneMinus(facing), ctx.knob('fresnelPower')); // @knob fresnelPower

  const clay = color(ctx.palette.hex.datSet);
  const deep = color(ctx.palette.hex.denThen);
  const material = new MeshBasicNodeMaterial();
  // Trọng số 0 → đĩa đất sét; trọng số 1 → nước đen như sơn then, soi trăng, lá và đom đóm.
  material.colorNode = mix(clay, mix(deep, refl.rgb, fresnel), w);
  // Phần sáng VƯỢT 1 của ảnh phản chiếu đi vào kênh emissive → bóng sáng trên nước cũng bloom nhẹ.
  material.emissiveNode = max(refl.rgb.sub(1), 0).mul(w);

  const geometry = new CircleGeometry(WATER_RADIUS, 96).rotateX(-Math.PI / 2);
  const water = new Mesh(geometry, material);
  ctx.scene.add(water);

  let disposed = false;
  return {
    objects: [water],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(water, refl.target);
      geometry.dispose();
      material.dispose();
      refl.dispose(); // giải phóng render target của ảnh phản chiếu
    },
  };
}
