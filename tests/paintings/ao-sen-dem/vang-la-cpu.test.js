// tests/paintings/ao-sen-dem/vang-la-cpu.test.js — bản CPU của đàn đom đóm: noise JS, curl không phân kỳ, luật bay giữ đàn trong ao.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three/webgpu';
import { float, uniform } from 'three/tsl';
import { CPU_MAX, createCpuFlock, makeCurl, makeNoise } from '../../../src/paintings/ao-sen-dem/parts/vang-la-cpu.js';
import { FLOCK } from '../../../src/paintings/ao-sen-dem/parts/vang-la-dan.js';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import { makeEngineCtx } from '../../helpers/fake-ctx.js';
import { createKnobs } from '../../../src/engine/gpu/knob-set.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';

describe('makeNoise (noise gradient 3D bằng JS)', () => {
  it('tất định theo hạt giống, trong [−1, 1], bằng 0 ở mọi điểm lưới nguyên, liền mạch', () => {
    const a = makeNoise(7);
    const b = makeNoise(7);
    for (let i = 0; i < 200; i++) {
      const [x, y, z] = [i * 0.37, i * 0.11 - 5, 3 - i * 0.23];
      expect(a(x, y, z)).toBe(b(x, y, z));
      expect(Math.abs(a(x, y, z))).toBeLessThanOrEqual(1);
      expect(Math.abs(a(x, y, z) - a(x + 1e-4, y, z))).toBeLessThan(1e-3);
    }
    expect(a(3, -2, 5)).toBe(0);
    expect(makeNoise(8)(0.5, 0.5, 0.5)).not.toBe(a(0.5, 0.5, 0.5));
  });
});

describe('makeCurl', () => {
  it('trường curl không phân kỳ: div ≈ 0 (sai phân của sai phân), trong khi bản thân noise thì không', () => {
    const noise = makeNoise(3);
    const curl = makeCurl(noise);
    const at = (x, y, z) => curl(x, y, z, new Float64Array(3));
    const h = 0.05;
    for (const [x, y, z] of [[0.3, 1.7, -2.2], [4.1, 0.2, 0.9], [-3.3, 2.5, 1.1]]) {
      const div = (at(x + h, y, z)[0] - at(x - h, y, z)[0] + at(x, y + h, z)[1] - at(x, y - h, z)[1]
        + at(x, y, z + h)[2] - at(x, y, z - h)[2]) / (2 * h);
      expect(Math.abs(div)).toBeLessThan(0.05);
    }
  });
});

describe('createCpuFlock', () => {
  const setupFlock = (count = 2000) => {
    const ctx = makeEngineCtx(meta);
    const attract = { point: uniform(new Vector3(5, 1.2, 5)), strength: uniform(0) };
    const knobs = createKnobs(vangLa.id, vangLa.knobs, ctx.env);
    Object.assign(ctx, { knob: knobs.knob });
    const flock = createCpuFlock(ctx, { w: float(1), fogFactor: float(0), attract, knobs: knobs.uniforms, count });
    return { flock, attract };
  };
  const cells = (flock) => flock.cells;

  it('một Sprite đọc thuộc tính instance do CPU ghi; số con kẹp ở 5.000 (thí nghiệm không ép máy yếu quá sức)', () => {
    const { flock } = setupFlock(50000);
    expect(CPU_MAX).toBe(5000);
    expect(flock.sprite.count).toBe(5000);
    flock.setCount(300);
    expect(flock.sprite.count).toBe(300);
  });

  // Hai test dưới chạy vòng JS thật (2.000 con × 180–240 bước, ~1,4 s trên Mac): máy bận hay máy CI yếu có thể
  // vượt hạn 5 s mặc định của Vitest, nên nới hạn cho riêng chúng.
  it('mỗi bước: số hữu hạn, đàn ở trong đĩa bán kính 40 và trong khoảng cao [0,3; 4], kể cả khi tay đẩy mạnh', { timeout: 20_000 }, () => {
    const { flock, attract } = setupFlock();
    attract.strength.value = -1.5;
    for (let f = 0; f < 240; f++) flock.step(1 / 60, f / 60);
    const a = cells(flock);
    for (let i = 0; i < 2000; i++) {
      const [x, y, z] = [a[i * 4], a[i * 4 + 1], a[i * 4 + 2]];
      expect(Number.isFinite(x + y + z)).toBe(true);
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(FLOCK.radius + 1e-3);
      expect(y).toBeGreaterThanOrEqual(FLOCK.low);
      expect(y).toBeLessThanOrEqual(FLOCK.high);
    }
  });

  it('giữ tay (lực > 0) thì đàn quanh tay dồn lại gần hơn', { timeout: 20_000 }, () => {
    const { flock, attract } = setupFlock();
    const near = () => {
      const a = cells(flock);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (Math.hypot(a[i * 4] - 5, a[i * 4 + 2] - 5) < 6) n += 1;
      return n;
    };
    const before = near();
    attract.strength.value = 1;
    for (let f = 0; f < 180; f++) flock.step(1 / 60, f / 60);
    expect(near()).toBeGreaterThan(before);
  });
});
