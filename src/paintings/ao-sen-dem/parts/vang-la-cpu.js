// paintings/ao-sen-dem/parts/vang-la-cpu.js — của lớp Vàng lá: cùng luật bay nhưng tính bằng JS trên CPU (thí nghiệm "CPU vs GPU", đường lùi).
import { DynamicDrawUsage, InstancedBufferAttribute } from 'three/webgpu';
import { instancedDynamicBufferAttribute } from 'three/tsl';
import { mulberry32 } from '../../../lib/random.js';
import { FLOCK, createFireflySprite } from './vang-la-dan.js';

/**
 * CPU tính tối đa chừng này con. Đo trên máy tính (GĐ 3): 3.000 con tốn chừng 2 ms JS mỗi khung (bản GPU: gần 0),
 * 20.000 con chừng 10 ms; điện thoại chậm hơn vài lần. Trần thấp để thí nghiệm không ép máy yếu quá sức.
 */
export const CPU_MAX = 5000;
const SEED = 20260930;
const EPS = 0.1; // bước sai phân của curl (cùng số với lib/tsl/noise.js#curl)
const OFFSETS = [[0, 0, 0], [31.4, 17.3, 47.9], [73.1, 59.2, 11.7]]; // ba kênh noise lệch nhau: một trường vec3

/**
 * Noise gradient 3D ("improved noise" của Ken Perlin, 2002) viết bằng JS: bảng hoán vị xáo theo hạt giống, mỗi góc
 * của ô lưới một gradient, nội suy bằng đường cong mềm 6t⁵ − 15t⁴ + 10t³. Trả số trong khoảng [−1, 1].
 * Cùng họ với mx_noise_float của GPU (Perlin), không cần trùng từng số: hai bên chỉ cần tốn công như nhau.
 * @param {number} seed
 * @returns {(x: number, y: number, z: number) => number}
 */
export function makeNoise(seed) {
  const rng = mulberry32(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t, a, b) => a + t * (b - a);
  const grad = (h, x, y, z) => {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
  };
  return (x, y, z) => {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const Z = Math.floor(z);
    const fx = x - X;
    const fy = y - Y;
    const fz = z - Z;
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const A = p[X & 255] + (Y & 255);
    const B = p[(X + 1) & 255] + (Y & 255);
    const AA = p[A] + (Z & 255);
    const AB = p[A + 1] + (Z & 255);
    const BA = p[B] + (Z & 255);
    const BB = p[B + 1] + (Z & 255);
    const near = lerp(v, lerp(u, grad(p[AA] & 15, fx, fy, fz), grad(p[BA] & 15, fx - 1, fy, fz)),
      lerp(u, grad(p[AB] & 15, fx, fy - 1, fz), grad(p[BB] & 15, fx - 1, fy - 1, fz)));
    const far = lerp(v, lerp(u, grad(p[AA + 1] & 15, fx, fy, fz - 1), grad(p[BA + 1] & 15, fx - 1, fy, fz - 1)),
      lerp(u, grad(p[AB + 1] & 15, fx, fy - 1, fz - 1), grad(p[BB + 1] & 15, fx - 1, fy - 1, fz - 1)));
    return lerp(w, near, far);
  };
}

/**
 * Curl của trường vec3 F = (noise, noise lệch, noise lệch) bằng sai phân trung tâm: đúng công thức của
 * lib/tsl/noise.js#curl (18 lần gọi noise mỗi con mỗi khung: đó là phần việc mà GPU làm song song).
 * @param {(x: number, y: number, z: number) => number} noise
 * @returns {(x: number, y: number, z: number, out: Float64Array) => Float64Array}
 */
export function makeCurl(noise) {
  const F = (k, x, y, z) => noise(x + OFFSETS[k][0], y + OFFSETS[k][1], z + OFFSETS[k][2]);
  return (x, y, z, out) => {
    const dFz_dy = F(2, x, y + EPS, z) - F(2, x, y - EPS, z);
    const dFy_dz = F(1, x, y, z + EPS) - F(1, x, y, z - EPS);
    const dFx_dz = F(0, x, y, z + EPS) - F(0, x, y, z - EPS);
    const dFz_dx = F(2, x + EPS, y, z) - F(2, x - EPS, y, z);
    const dFy_dx = F(1, x + EPS, y, z) - F(1, x - EPS, y, z);
    const dFx_dy = F(0, x, y + EPS, z) - F(0, x, y - EPS, z);
    out[0] = (dFz_dy - dFy_dz) / (2 * EPS);
    out[1] = (dFx_dz - dFz_dx) / (2 * EPS);
    out[2] = (dFy_dx - dFx_dy) / (2 * EPS);
    return out;
  };
}

/**
 * Đàn đom đóm tính trên CPU: mỗi khung, một vòng lặp JS đi qua TỪNG con (tuần tự, một luồng), rồi chép cả mảng
 * vị trí lên GPU. So với compute shader (hàng nghìn luồng song song, dữ liệu không rời GPU): ms CPU tăng thấy rõ.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ w: any, fogFactor: any, attract: { point: any, strength: any }, knobs: { flowScale: any, speed: any, attraction: any }, count: number }} p
 */
export function createCpuFlock(ctx, { w, fogFactor, attract, knobs, count }) {
  const noise = makeNoise(SEED);
  const curl = makeCurl(noise);
  const rng = mulberry32(SEED + 1);
  const cells = new Float32Array(CPU_MAX * 4); // xyz vị trí, w pha nháy: đúng hình dạng của bộ đệm GPU
  const velocity = new Float32Array(CPU_MAX * 3);
  for (let i = 0; i < CPU_MAX; i++) {
    const r = Math.sqrt(rng()) * FLOCK.radius;
    const a = rng() * Math.PI * 2;
    cells.set([Math.cos(a) * r, FLOCK.low + (FLOCK.high - FLOCK.low) * rng(), Math.sin(a) * r, rng()], i * 4);
  }
  const attr = new InstancedBufferAttribute(cells, 4).setUsage(DynamicDrawUsage);
  const sprite = createFireflySprite(ctx, { cell: instancedDynamicBufferAttribute(attr), w, fogFactor, count: Math.min(count, CPU_MAX) });
  const flow = new Float64Array(3);

  return {
    sprite,
    cells, // mảng vị trí (xyz) + pha của từng con: Sprite đọc, test đọc
    /** Số con được tính và vẽ (kẹp ở CPU_MAX). */
    setCount(n) {
      sprite.count = Math.min(n, CPU_MAX);
    },
    /** Một bước của cả đàn, cùng luật với kernel GPU (l5-vang-la.js). */
    step(dt, t) {
      const scale = knobs.flowScale.value;
      const k = FLOCK.flow * knobs.speed.value;
      const hand = attract.point.value;
      // Lực của tay đã gồm mọi hệ số trừ khoảng cách: pull = lực × núm hút × hệ số × dt (như kernel GPU).
      const force = attract.strength.value * knobs.attraction.value * FLOCK.pull * dt;
      const turn = Math.min(dt * FLOCK.turn, 1);
      for (let i = 0; i < sprite.count; i++) {
        const o = i * 4;
        const q = i * 3;
        let x = cells[o];
        let y = cells[o + 1];
        let z = cells[o + 2];
        curl(x * scale, y * scale + t * FLOCK.drift, z * scale, flow);
        // Quán tính: vận tốc ngả dần về hướng muốn bay (dòng curl + xoáy chậm quanh tâm ao).
        let vx = velocity[q] + (flow[0] * k - z * FLOCK.swirl - velocity[q]) * turn;
        let vy = velocity[q + 1] + (flow[1] * k * FLOCK.lift - velocity[q + 1]) * turn;
        let vz = velocity[q + 2] + (flow[2] * k + x * FLOCK.swirl - velocity[q + 2]) * turn;
        // Tay người xem: hút về (lực > 0) hay đẩy ra (lực < 0), kèm bay vòng quanh; giảm theo khoảng cách.
        const tx = hand.x - x;
        const ty = hand.y - y;
        const tz = hand.z - z;
        const dist = Math.max(Math.hypot(tx, ty, tz), 0.001);
        const pull = (force * Math.exp(-dist / FLOCK.reach)) / dist; // chia dist: (tx, ty, tz) / dist là hướng đơn vị
        vx += (tx - tz * FLOCK.orbit) * pull;
        vy += ty * pull;
        vz += (tz + tx * FLOCK.orbit) * pull;
        const limit = Math.min(1, FLOCK.maxSpeed / Math.max(Math.hypot(vx, vy, vz), 0.001));
        vx *= limit;
        vy *= limit;
        vz *= limit;
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        const keep = Math.min(1, FLOCK.radius / Math.max(Math.hypot(x, z), 0.001));
        cells[o] = x * keep;
        cells[o + 1] = Math.min(Math.max(y, FLOCK.low), FLOCK.high);
        cells[o + 2] = z * keep;
        velocity[q] = vx;
        velocity[q + 1] = vy;
        velocity[q + 2] = vz;
      }
      attr.needsUpdate = true; // chép mảng vị trí lên GPU: việc mà bản compute không bao giờ phải làm
    },
    dispose() {
      sprite.material.dispose();
    },
  };
}
