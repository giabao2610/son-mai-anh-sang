// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá: đom đóm tính trên GPU (compute; bản CPU để so), trôi theo curl noise, tụ quanh tay.
import {
  Fn,
  clamp,
  cos,
  exp,
  float,
  hash,
  instanceIndex,
  instancedArray,
  length,
  max,
  min,
  mix,
  sin,
  sqrt,
  vec3,
  vec4,
} from 'three/tsl';
import { curl } from '../../../lib/tsl/noise.js';
import { FLOCK, createFireflySprite, setAdditive } from '../parts/vang-la-dan.js';
import { CPU_MAX, createCpuFlock } from '../parts/vang-la-cpu.js';

export const id = 'vang-la';

const COUNT = { cao: 3000, vua: 1500, thap: 600 }; // số con mặc định theo mức (spec §6)
/** Trần theo tầng: WebGPU compute chạy hàng trăm nghìn con; WebGL2 (transform feedback) thì ít hơn nhiều. */
const TIER_MAX = { webgpu: 200000, webgl2: 20000 };
/** Trần theo mức: máy yếu (điện thoại) không bị kéo quá sức, dù người xem kéo núm tới đâu. */
const LEVEL_MAX = { cao: 200000, vua: 50000, thap: 10000 };
const countMax = (env) => Math.min(TIER_MAX[env.tier], LEVEL_MAX[env.level]);
const COUNT_FLOOR = 100; // sprite có count > 1 nằm trong cache key của three: không bao giờ xuống 0 hay 1

export const knobs = [
  { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
  { id: 'glow', min: 0, max: 10, step: 0.1, value: 3 },
  { id: 'attraction', min: 0, max: 3, step: 0.01, value: 1 },
  { id: 'flowScale', min: 0.02, max: 0.6, step: 0.01, value: 0.12 },
  { id: 'speed', min: 0, max: 3, step: 0.05, value: 1 },
  { id: 'blinkRate', min: 0.1, max: 4, step: 0.05, value: 1 },
  { id: 'count', via: 'js', min: COUNT_FLOOR, max: countMax, step: 100, value: (env) => env.budget.fireflies ?? COUNT[env.level] },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.attract (setup của bức): điểm hút và lực hút theo cử chỉ; shared.suong.fogFactor (lớp Sương)
 */
export function createLayer(ctx, shared) {
  let wanted = ctx.knobValue('count'); // ý người xem (núm)
  const levelCount = wanted; // số mặc định của mức: nấc 'dom-dom' hạ trần về một nửa số này
  let cap = Infinity; // trần của máy (nấc); số con được tính và vẽ = min(núm, trần)
  // Cấp phát theo TRẦN của núm một lần (200k con × 2 ô vec4 = 6,4 MB ở mức cao): lúc chạy, núm count chỉ đổi
  // số con được tính và được vẽ, không tạo bộ đệm mới, nên kéo núm không khựng.
  const capacity = countMax(ctx);
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một đàn đom đóm
  const dt = ctx.u.delta;

  // Hai bộ đệm nằm trên GPU, mỗi con một ô vec4. Mỗi kernel chỉ đụng 2 bộ đệm:
  // WebGL2 chạy compute bằng transform feedback và chỉ cho tối đa 4 bộ đệm mỗi kernel.
  const posPhase = instancedArray(capacity, 'vec4'); // xyz = vị trí, w = pha nhấp nháy [0, 1)
  const velSeed = instancedArray(capacity, 'vec4'); // xyz = vận tốc, w = hạt giống riêng [0, 1)

  // Kernel khởi tạo: mỗi luồng GPU lo MỘT con. hash(instanceIndex) là ngẫu nhiên tất định,
  // √u cho mật độ đều theo diện tích đĩa. Chạy một lần ngay lúc dựng lớp.
  const init = Fn(() => {
    const i = instanceIndex;
    const r = sqrt(hash(i)).mul(FLOCK.radius);
    const a = hash(i.add(1)).mul(Math.PI * 2);
    const y = mix(FLOCK.low, FLOCK.high, hash(i.add(2)));
    posPhase.element(i).assign(vec4(cos(a).mul(r), y, sin(a).mul(r), hash(i.add(3))));
    velSeed.element(i).assign(vec4(0, 0, 0, hash(i.add(4))));
  })().compute(capacity); // khởi tạo CẢ bộ đệm: tăng count lúc chạy thì con mới đã có chỗ đứng
  ctx.renderer.compute(init);
  // WebGL2 chạy compute bằng transform feedback: mỗi bộ đệm có HAI bản (một để đọc, một để ghi, đổi vai sau mỗi lần
  // chạy), và kernel bước chỉ ghi [0, count). Chạy init lần nữa để bản kia cũng đầy (Phụ lục A.29): nếu không, tăng
  // count lúc chạy thì con mới đọc từ bản chưa từng được ghi, cả đám cùng xuất phát ở (0, 0, 0).
  if (ctx.tier === 'webgl2') ctx.renderer.compute(init);

  // Kernel bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình — trên WebGL2,
  // element(i) luôn trả ô của chính luồng đang chạy, nên không đọc được hàng xóm.
  const step = Fn(() => {
    const cell = posPhase.element(instanceIndex);
    const vs = velSeed.element(instanceIndex);
    const p = cell.xyz.toVar();
    // Hướng muốn bay: dòng curl noise (không phân kỳ: đàn trôi thành dòng xoáy mềm, không dồn một chỗ), trôi dần theo
    // thời gian, cộng một vòng xoáy chậm quanh tâm ao.
    const field = p.mul(ctx.knob('flowScale')).add(vec3(0, t.mul(FLOCK.drift), 0)); // @knob flowScale
    const flow = curl(field).mul(vec3(1, FLOCK.lift, 1)).mul(ctx.knob('speed')).mul(FLOCK.flow); // @knob speed
    const swirl = vec3(p.z.negate(), 0, p.x).mul(FLOCK.swirl);
    // Quán tính: vận tốc chỉ ngả dần về hướng muốn bay, nên đường bay mềm, không giật.
    const v = mix(vs.xyz, flow.add(swirl), min(dt.mul(FLOCK.turn), 1)).toVar();
    // Tay người xem: lực > 0 hút về điểm chạm và kéo bay vòng quanh; lực < 0 đẩy ra (tản, bung).
    // Chỉ con ở gần mới chịu lực (giảm theo exp của khoảng cách). Lực là gia tốc: cộng thẳng vào vận tốc.
    const toward = shared.attract.point.sub(p);
    const dist = max(length(toward), 0.001);
    const dir = toward.div(dist);
    const orbit = vec3(dir.z.negate(), 0, dir.x).mul(FLOCK.orbit);
    const pull = dir.add(orbit).mul(shared.attract.strength).mul(exp(dist.div(FLOCK.reach).negate()));
    v.addAssign(pull.mul(ctx.knob('attraction')).mul(FLOCK.pull).mul(dt)); // @knob attraction
    v.assign(v.mul(min(float(1), float(FLOCK.maxSpeed).div(max(length(v), 0.001)))));
    p.addAssign(v.mul(dt));
    // Giữ đàn trong đĩa bán kính FLOCK.radius và trong khoảng độ cao.
    const k = min(float(1), float(FLOCK.radius).div(max(length(p.xz), 0.001)));
    cell.assign(vec4(p.x.mul(k), clamp(p.y, FLOCK.low, FLOCK.high), p.z.mul(k), cell.w));
    vs.assign(vec4(v, vs.w));
  })().compute(wanted);

  // Hiển thị: MỘT Sprite vẽ `count` bản sao; vị trí đọc thẳng bộ đệm compute qua toAttribute()
  // (thành vertex attribute, không cần storage buffer ở vertex stage).
  const sprite = createFireflySprite(ctx, { cell: posPhase.toAttribute(), w, fogFactor: shared.suong.fogFactor, count: wanted });
  ctx.scene.add(sprite);
  const objects = [sprite]; // mảng SỐNG: đàn CPU thêm vào khi được dựng

  // "CPU vs GPU": đàn CPU (parts/vang-la-cpu.js) dựng lần đầu bật thí nghiệm, rồi giữ lại; bật/tắt chỉ đổi đàn nào
  // được tính và đàn nào hiện. Cũng là đường lùi nếu compute trên máy thật hỏng (bật tay, spec §16).
  let cpu = null;
  let onCpu = false;
  let additive = true;
  const show = () => {
    const on = w.value > 0; // trọng số 0: không vẽ (visible không nằm trong cache key, không biên dịch lại)
    sprite.visible = on && !onCpu;
    if (cpu) cpu.sprite.visible = on && onCpu;
  };

  /** Số con được tính và được vẽ = min(núm, trần). Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
  const applyCount = () => {
    const n = Math.min(wanted, cap);
    step.count = n; // WebGPU tính lại số nhóm dispatch, WebGL2 vẽ ít/nhiều đỉnh hơn
    sprite.count = n;
    cpu?.setCount(n);
  };
  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  let disposed = false;
  return {
    objects,
    update(dt, t) {
      show();
      if (w.value <= 0) return; // tắt hẳn: không tính gì
      if (onCpu) cpu.step(dt, t);
      else ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
    },
    onKnob: {
      count: (v) => { // @knob count
        wanted = v;
        applyCount();
      },
    },
    experiments: [
      {
        id: 'cpu',
        kind: 'compare', // bàn thợ đo ms khung và ms CPU lúc tắt (GPU) và lúc bật (CPU)
        toggle(on) {
          if (on && !cpu) {
            const uniforms = { flowScale: ctx.knob('flowScale'), speed: ctx.knob('speed'), attraction: ctx.knob('attraction') };
            cpu = createCpuFlock(ctx, { w, fogFactor: shared.suong.fogFactor, attract: shared.attract, knobs: uniforms, count: Math.min(wanted, cap) });
            if (!additive) setAdditive(cpu.sprite, false);
            ctx.scene.add(cpu.sprite);
            objects.push(cpu.sprite);
          }
          onCpu = on;
          show();
        },
      },
      {
        id: 'noAdditive',
        toggle(on) {
          additive = !on;
          setAdditive(sprite, additive);
          if (cpu) setAdditive(cpu.sprite, additive);
        },
      },
    ],
    readouts: [{ id: 'count', get: () => (onCpu ? cpu.sprite.count : sprite.count) }],
    // Nấc của bộ điều chỉnh: trần số con = nửa số mặc định của mức (không dưới 100).
    degrade: [
      {
        id: 'dom-dom',
        apply() {
          before = cap;
          cap = Math.max(COUNT_FLOOR, Math.round(levelCount / 2));
          applyCount();
        },
        revert() {
          cap = before;
          applyCount();
        },
      },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects);
      sprite.material.dispose();
      cpu?.dispose();
      init.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      step.dispose();
    },
  };
}
