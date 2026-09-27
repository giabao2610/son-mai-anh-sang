// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá v0: đom đóm tính vị trí trên GPU (compute), vẽ bằng một Sprite.
import { AdditiveBlending, Sprite, SpriteNodeMaterial } from 'three/webgpu';
import {
  Fn,
  clamp,
  color,
  cos,
  float,
  fract,
  hash,
  instanceIndex,
  instancedArray,
  length,
  max,
  min,
  mix,
  shapeCircle,
  sin,
  smoothstep,
  sqrt,
  vec3,
  vec4,
} from 'three/tsl';

export const id = 'vang-la';
export const knobs = [
  { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
  { id: 'glow', min: 0, max: 10, step: 0.1, value: 3 },
];

const RADIUS = 40; // đom đóm lượn trong đĩa bán kính này
const LOW = 0.3; // và trong khoảng độ cao [LOW, HIGH] trên mặt nước
const HIGH = 4;

/** @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx */
export function createLayer(ctx) {
  const count = ctx.budget.fireflies ?? { cao: 3000, vua: 1500, thap: 600 }[ctx.level];
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một đàn đom đóm
  const dt = ctx.u.delta;

  // Hai bộ đệm nằm trên GPU, mỗi con một ô vec4. Mỗi kernel chỉ đụng 2 bộ đệm:
  // WebGL2 chạy compute bằng transform feedback và chỉ cho tối đa 4 bộ đệm mỗi kernel.
  const posPhase = instancedArray(count, 'vec4'); // xyz = vị trí, w = pha nhấp nháy [0, 1)
  const velSeed = instancedArray(count, 'vec4'); // xyz = vận tốc, w = hạt giống riêng [0, 1)

  // Kernel khởi tạo: mỗi luồng GPU lo MỘT con. hash(instanceIndex) là ngẫu nhiên tất định,
  // √u cho mật độ đều theo diện tích đĩa. Chạy một lần ngay lúc dựng lớp.
  const init = Fn(() => {
    const i = instanceIndex;
    const r = sqrt(hash(i)).mul(RADIUS);
    const a = hash(i.add(1)).mul(Math.PI * 2);
    const y = mix(LOW, HIGH, hash(i.add(2)));
    posPhase.element(i).assign(vec4(cos(a).mul(r), y, sin(a).mul(r), hash(i.add(3))));
    velSeed.element(i).assign(vec4(0, 0, 0, hash(i.add(4))));
  })().compute(count);
  ctx.renderer.compute(init);

  // Kernel bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình — trên WebGL2,
  // element(i) luôn trả ô của chính luồng đang chạy, nên không đọc được hàng xóm.
  const step = Fn(() => {
    const cell = posPhase.element(instanceIndex);
    const vs = velSeed.element(instanceIndex);
    const p = cell.xyz.toVar();
    const seed = vs.w;
    // Hướng muốn bay: mỗi con lượn theo nhịp sin/cos riêng, cộng một dòng xoáy chậm quanh tâm ao.
    const wander = vec3(
      sin(t.mul(0.31).add(seed.mul(61))),
      sin(t.mul(0.47).add(seed.mul(23))).mul(0.3),
      cos(t.mul(0.23).add(seed.mul(37))),
    ).mul(0.5);
    const swirl = vec3(p.z.negate(), 0, p.x).mul(0.012);
    // Quán tính: vận tốc chỉ ngả dần về hướng muốn bay, nên đường bay mềm, không giật.
    const v = mix(vs.xyz, wander.add(swirl), min(dt.mul(1.5), 1)).toVar();
    p.addAssign(v.mul(dt));
    // Giữ đàn trong đĩa bán kính RADIUS và trong khoảng độ cao.
    const k = min(float(1), float(RADIUS).div(max(length(p.xz), 0.001)));
    cell.assign(vec4(p.x.mul(k), clamp(p.y, LOW, HIGH), p.z.mul(k), cell.w));
    vs.assign(vec4(v, seed));
  })().compute(count);

  // Hiển thị: MỘT Sprite vẽ `count` bản sao (instancing); vị trí đọc thẳng bộ đệm compute
  // qua toAttribute() (thành vertex attribute, không cần storage buffer ở vertex stage).
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  const attr = posPhase.toAttribute();
  material.positionNode = attr.xyz;
  const phase = attr.w;
  const rate = float(1.2).add(fract(phase.mul(7.31)).mul(1.8)); // mỗi con một nhịp nháy riêng
  // Chỉ lóe khi sin > 0.75 (khoảng 1/4 chu kỳ): cả nghìn con cùng sáng thì bloom phủ vàng kín khung.
  const blink = smoothstep(0.75, 1, sin(t.mul(rate).add(phase.mul(Math.PI * 2))));
  const shape = shapeCircle(); // đĩa tròn trên ô vuông của sprite
  const gold = color(ctx.palette.hex.vangLaSang);
  material.colorNode = vec3(0); // chỉ phát sáng: không cộng thêm màu trắng mặc định của sprite
  material.emissiveNode = gold.mul(ctx.knob('glow')).mul(blink).mul(shape).mul(w); // @knob glow
  material.opacityNode = shape.mul(w); // trọng số 0 → tắt hẳn
  material.scaleNode = ctx.knob('size'); // @knob size

  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false; // bounding của sprite không biết vị trí nằm trong bộ đệm GPU
  ctx.scene.add(sprite);

  let disposed = false;
  return {
    objects: [sprite],
    update() {
      ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(sprite);
      material.dispose();
      init.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      step.dispose();
    },
  };
}
