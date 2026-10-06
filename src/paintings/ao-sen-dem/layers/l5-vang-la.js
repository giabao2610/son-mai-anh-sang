// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá: đom đóm tính trên GPU (compute; bản CPU để so), trôi theo curl noise, tụ quanh tay.
import {
  clamp,
  cos,
  exp,
  float,
  hash,
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
import { COUNT_FLOOR, createPool } from '../../../lib/tsl/particles.js';
import { FLOCK, createFireflySprite, setAdditive } from '../parts/vang-la-dan.js';
import { CPU_MAX, createCpuFlock } from '../parts/vang-la-cpu.js';

export const id = 'vang-la';

const COUNT = { cao: 3000, vua: 1500, thap: 600 }; // số con mặc định theo mức (spec §6)
/** Trần theo tầng: WebGPU compute chạy hàng trăm nghìn con; WebGL2 (transform feedback) thì ít hơn nhiều. */
const TIER_MAX = { webgpu: 200000, webgl2: 20000 };
/** Trần theo mức: máy yếu (điện thoại) không bị kéo quá sức, dù người xem kéo núm tới đâu. */
const LEVEL_MAX = { cao: 200000, vua: 50000, thap: 10000 };
const countMax = (env) => Math.min(TIER_MAX[env.tier], LEVEL_MAX[env.level]);

export const knobs = [
  { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
  { id: 'glow', min: 0, max: 10, step: 0.1, value: 1.8 },
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

  // Bể hạt dùng chung (lib/tsl/particles.js): hai bộ đệm trên GPU, mỗi con một ô vec4 ở mỗi bộ đệm, cấp theo TRẦN của núm một lần.
  // a = xyz vị trí, w pha nhấp nháy [0, 1); b = xyz vận tốc, w hạt giống riêng [0, 1).
  const pool = createPool({
    capacity,
    count: wanted,
    tier: ctx.tier,
    renderer: ctx.renderer,
    // Khởi tạo: mỗi luồng GPU lo MỘT con. hash(index) là ngẫu nhiên tất định, √u cho mật độ đều theo diện tích đĩa.
    init: ({ a, b, index: i }) => {
      const r = sqrt(hash(i)).mul(FLOCK.radius);
      const ang = hash(i.add(1)).mul(Math.PI * 2);
      const y = mix(FLOCK.low, FLOCK.high, hash(i.add(2)));
      a.assign(vec4(cos(ang).mul(r), y, sin(ang).mul(r), hash(i.add(3))));
      b.assign(vec4(0, 0, 0, hash(i.add(4))));
    },
    // Một bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình.
    law: ({ a: cell, b: vs }) => {
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
    },
  });

  // Hiển thị: MỘT Sprite vẽ `count` bản sao; vị trí đọc thẳng bộ đệm compute qua toAttribute()
  // (thành vertex attribute, không cần storage buffer ở vertex stage).
  const sprite = createFireflySprite(ctx, { cell: pool.a.toAttribute(), w, fogFactor: shared.suong.fogFactor, count: pool.count });
  sprite.name = 'dom-dom'; // hai đàn chung một hàm dựng: tên đặt ở đây, nơi biết đàn nào là đàn nào
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
    const n = pool.setCount(Math.min(wanted, cap), sprite);
    cpu?.setCount(n);
  };
  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  let disposed = false;
  return {
    objects,
    update(dt, t) {
      show();
      // Tắt hẳn: không tính gì. dt = 0 (xưởng vẽ lại khung đứng yên của ?freeze): đồng bộ, KHÔNG tiến đàn thêm một bước.
      if (w.value <= 0 || dt === 0) return;
      if (onCpu) cpu.step(dt, t);
      else pool.step(dt, w.value); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
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
            cpu.sprite.name = 'dom-dom-cpu';
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
      pool.dispose();
    },
  };
}
