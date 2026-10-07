// tests/paintings/dan-ga-me-con/dan-ga-thoc.test.js — số của thóc (GRAIN) và hình học đàn gà cùng nhau, đo bằng bản JS của luật thóc (parts/dan-ga-thoc.js: Node không chạy được compute; e2e chạy luật thật trên GPU), khóa với mã WGSL và GLSL thật của bước compute bằng bản ghi: nắm gọn, nảy một hai lần rồi nằm yên ở mọi nhịp khung; gà con ăn được thóc của nhúm lúc mở trang, của nắm giữa sàn hay sát mép, và trong cảnh bận rộn.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { BEAKS, GRAIN, GRAVITY } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-thoc.js';
import { FLOOR, LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { mulberry32 } from '../../../src/lib/random.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileCompute, normalizeIds } from '../../helpers/nodes.js';

/** Test nặng (nhiều cảnh, từng khung, hàng nghìn hạt): chừa thời gian cho máy chạy chậm hay đang bận. */
const SLOW = 60000;
const BOUNCE = 0.3; // mặc định của núm bounce

/** hash của TSL (three r186, nodes/math/Hash.js: PCG) trên số nguyên 32 bit, ra [0, 1). */
function hash(seed) {
  const state = (Math.imul(seed >>> 0, 747796405) + 2891336453) >>> 0;
  const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
  return (((word >>> 22) ^ word) >>> 0) / 2 ** 32;
}
/** Bản JS của makeSpawn: phần tử thứ k của một nắm. */
function spawn(k, { origin, seed, still }) {
  const base = (k * 3 + Math.imul(seed >>> 0, 7919)) >>> 0;
  const [r1, r2, r3] = [0, 1, 2].map((j) => hash(base + j));
  const s = Math.sqrt(r2);
  const disc = [Math.cos(r1 * Math.PI * 2) * s, Math.sin(r1 * Math.PI * 2) * s];
  if (still) return { p: [origin[0] + disc[0] * GRAIN.pile, GRAIN.radius, origin[2] + disc[1] * GRAIN.pile], v: [0, 0, 0], born: 0 };
  return {
    p: [origin[0] + disc[0] * GRAIN.hand, origin[1], origin[2] + disc[1] * GRAIN.hand],
    v: [disc[0] * GRAIN.spread, r3 * GRAIN.lift, disc[1] * GRAIN.spread],
    born: 0,
  };
}
/** Bản JS của makeLaw: một bước của một hạt. beaks: [x, y, z, đang mổ]. */
function step(gr, dt, g, beaks) {
  if (gr.born < 0) return;
  const { p, v } = gr;
  const r = GRAIN.radius;
  const air = p[1] > r + 1e-3;
  if (Math.hypot(...v) > 0 || air) {
    v[1] -= g * dt;
    for (let i = 0; i < 3; i += 1) p[i] += v[i] * dt;
    if (p[1] < r) {
      p[1] = r;
      if (air) {
        v[1] = Math.abs(v[1]) * BOUNCE;
        v[0] *= GRAIN.scuff;
        v[2] *= GRAIN.scuff;
        if (v[1] < GRAIN.settle) v[1] = 0;
      } else v[1] = 0;
    }
    if (p[1] <= r + 1e-3) {
      const keep = Math.exp(-GRAIN.friction * dt);
      v[0] *= keep;
      v[2] *= keep;
      if (v[1] === 0 && Math.hypot(v[0], v[2]) < GRAIN.rest) v.fill(0);
    }
    for (const [i, [lo, hi]] of [[0, FLOOR.x], [2, FLOOR.z]]) {
      if (p[i] < lo || p[i] > hi) {
        p[i] = Math.min(Math.max(p[i], lo), hi);
        v[i] = -v[i] * BOUNCE;
      }
    }
  }
  for (const m of beaks) {
    if (m[3] > 0.5 && m[1] < GRAIN.reach && p[1] < GRAIN.reach && Math.hypot(m[0] - p[0], m[2] - p[2]) < GRAIN.eat) gr.born = -1;
  }
}

/**
 * Chạy đàn gà và thóc như lớp Đàn gà, mỗi khung: drift, cử chỉ, state, mảng mỏ, rắc các nắm tới lúc văng, rồi một bước của mọi hạt.
 * events: [{ t, kind: 'tap' | 'grip' | 'release', at }]. Trả mỗi nắm: điểm rắc, có con mổ trúng chỗ ấy không, phần bị ăn.
 */
function play({ fps = 60, events = [], until = 20, layout = LAYOUT }) {
  const flock = createFlock(layout);
  const dt = 1 / fps;
  const handfuls = [];
  let e = 0;
  for (let f = 1; f * dt <= until; f += 1) {
    const t = f * dt;
    flock.drift(t);
    for (; e < events.length && events[e].t <= t; e += 1) {
      const ev = events[e];
      if (ev.kind === 'tap') flock.scatter(t, ev.at, Math.round(t * 60));
      else if (ev.kind === 'grip') flock.grip(t);
      else flock.release(t);
    }
    const st = flock.state(t);
    const beaks = st.chicks.map((c) => [...c.beak, c.pecking ? 1 : 0]);
    for (const s of flock.takeScatters(t)) {
      const origin = [s.at[0], s.auto ? GRAIN.kick : GRAIN.drop, s.at[1]];
      handfuls.push({ s, pecked: false, grains: Array.from({ length: s.count ?? 120 }, (_, k) => spawn(k, { origin, seed: s.seed, still: s.still })) });
    }
    for (const h of handfuls) {
      h.pecked ||= st.chicks.some((c) => c.pecking && Math.hypot(c.beak[0] - h.s.at[0], c.beak[2] - h.s.at[1]) < 0.6);
      for (const gr of h.grains) step(gr, dt, GRAVITY.traiDat, beaks);
    }
  }
  return handfuls.map((h) => ({ ...h.s, pecked: h.pecked, eaten: h.grains.filter((g) => g.born < 0).length / h.grains.length }));
}

/** Một nắm thả từ tầm tay ở (0; 1), không gà: bán kính chỗ nằm (trung vị, phân vị 95), lúc nằm yên hết, số lần nảy mỗi hạt. */
function pile(fps, { g = GRAVITY.traiDat, y = GRAIN.drop } = {}) {
  const dt = 1 / fps;
  const radii = [];
  let still = 0;
  let bounces = 0;
  let restAt = 0;
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const grains = Array.from({ length: 120 }, (_, k) => spawn(k, { origin: [0, y, 1], seed, still: false }));
    for (let f = 1; f * dt <= 4; f += 1) {
      for (const gr of grains) {
        const falling = gr.v[1] <= 0;
        step(gr, dt, g, []);
        if (falling && gr.v[1] > 0) bounces += 1;
      }
      if (grains.some((gr) => gr.v.some((c) => c !== 0))) restAt = f * dt;
    }
    radii.push(...grains.map((gr) => Math.hypot(gr.p[0], gr.p[2] - 1)));
    still += grains.filter((gr) => gr.v.every((c) => c === 0) && gr.p[1] === GRAIN.radius).length;
  }
  radii.sort((a, b) => a - b);
  return { median: radii[radii.length >> 1], p95: radii[Math.floor(radii.length * 0.95)], still, restAt, bounces: bounces / radii.length };
}

/**
 * Khóa đồng bộ của bản JS ở trên: mã WGSL và GLSL của bước compute thật (nhánh rắc của makeSpawn, nhánh luật của makeLaw), so từng ký tự với
 * bản ghi (số id của node bỏ như fixture của đom đóm, Bức 1). GRAIN dùng chung nên đổi một số thì bản JS theo luôn; còn đổi CẤU TRÚC của luật
 * (điều kiện ăn, tách bay và lăn, hãm khi rơi, dội ở mép), hay three dịch khác đi, thì mã khác bản ghi và test này đỏ.
 */
const STALE = 'Mã bước compute của thóc (parts/dan-ga-thoc.js, hay do three) khác bản ghi: sửa bản JS của luật (spawn, step) ở đầu '
  + 'tests/paintings/dan-ga-me-con/dan-ga-thoc.test.js cho khớp, chạy lại các test đo nắm và phần bị ăn, rồi mới ghi lại bản ghi: '
  + 'npx vitest run tests/paintings/dan-ga-me-con/dan-ga-thoc.test.js -u';

describe('dan-ga-thoc: mã của bước compute giống bản ghi (bản JS ở trên là bản chép của đúng mã này)', () => {
  it.each(['webgpu', 'webgl2'])('%s', async (backend) => {
    const built = buildPainting(painting, meta, { tier: backend });
    built.ctx.u.time.value = 1 / 60;
    built.setup.update(1 / 60, 1 / 60);
    for (const { layer } of built.built) layer.update?.(1 / 60, 1 / 60);
    const step = built.ctx.renderer.compute.mock.calls.at(-1)[0]; // lần compute cuối của khung đầu là bước của bể thóc
    const { code, problems } = compileCompute(step, backend);
    expect(problems).toEqual([]);
    await expect(normalizeIds(code), STALE).toMatchFileSnapshot(`./__fixtures__/thoc/${backend}-step.txt`);
  });
});

describe('dan-ga-thoc: số của thóc với đàn gà (bản JS của luật)', () => {
  it('mười mỏ (BEAKS) cho mười gà con', () => {
    expect(BEAKS).toBe(LAYOUT.homes.length);
  });

  it.each([60, 30, 10])('%s khung/giây: nắm rơi, nảy, lăn rồi nằm yên trên sàn trong chừng một giây; nắm gọn (nửa số hạt trong 0,45, gần hết trong 0,65)', (fps) => {
    const r = pile(fps);
    expect(r.still, 'mọi hạt nằm yên trên sàn').toBe(720);
    expect(r.restAt, 'nằm yên hết sau').toBeLessThan(1.2);
    expect(r.median).toBeLessThan(0.45);
    expect(r.p95).toBeLessThan(0.65);
    expect(r.median, 'vẫn tỏa ra, không rơi thành một chấm').toBeGreaterThan(0.25);
    if (fps >= 30) expect(r.bounces, 'nảy một hai lần').toBeGreaterThan(1);
  });

  it('trọng lực của trăng: rơi lâu hơn nên tỏa rộng hơn; gà mẹ bới thì thóc văng thấp (GRAIN.kick), nhúm gọn hơn nắm rắc tay', () => {
    expect(pile(60, { g: GRAVITY.trang }).median).toBeGreaterThan(pile(60).median * 1.5);
    expect(pile(60, { y: GRAIN.kick }).median).toBeLessThan(pile(60).median);
  });

  // Mỏ "đang mổ" chừng 0,1 giây mỗi nhịp cúi: 10 khung/giây thì mỗi nhịp chỉ một khung, có nhịp không khung nào, nên ăn ít hơn một chút.
  it.each([60, 10])('%s khung/giây: gà con ăn được nhúm lúc mở trang (≥ 40%), nắm gà mẹ bới, và nắm rắc giữa sàn hay sát mép, góc (mỗi nắm ≥ 30%)', (fps) => {
    const taps = [[-4.5, 2.5], [4.5, 2.5], [-4.5, -1.5], [0, 3.8], [6.6, 4.6], [-6.6, -2.6], [0.5, -2.7]];
    const opening = play({ fps, until: 12 }).find((h) => h.still);
    expect(opening.eaten, 'nhúm lúc mở trang').toBeGreaterThanOrEqual(0.4);
    const scratch = play({ fps, until: 36 }).find((h) => h.auto);
    expect(scratch.eaten, 'nhúm gà mẹ bới').toBeGreaterThanOrEqual(0.3);
    for (const at of taps) {
      const mine = play({ fps, events: [{ t: 12, kind: 'tap', at }], until: 26 }).find((h) => h.count === null);
      expect(mine.eaten, `chạm ${at} → thóc ở ${mine.at.map((v) => v.toFixed(2))}`).toBeGreaterThanOrEqual(0.3);
    }
  }, SLOW);

  it('cảnh bận (12 cảnh × 40 giây: chạm khắp sàn kể cả sát mép, giữ, thả): nắm có con tới thì bị ăn trung bình ≥ 30%; nắm có con mổ mà bị ăn dưới 10% chỉ lác đác (≤ 6%)', () => {
    const all = [];
    for (let n = 0; n < 12; n += 1) {
      const rand = mulberry32(500 + n);
      const events = [];
      for (let t = 1.5; t < 36; t += 0.5 + rand() * 3) {
        if (rand() < 0.12) {
          events.push({ t, kind: 'grip' });
          t += 1 + rand() * 3;
          events.push({ t, kind: 'release' });
        } else {
          events.push({ t, kind: 'tap', at: [FLOOR.x[0] + rand() * (FLOOR.x[1] - FLOOR.x[0]), FLOOR.z[0] + rand() * (FLOOR.z[1] - FLOOR.z[0])] });
        }
      }
      all.push(...play({ fps: 30, events, until: 48 }).filter((h) => h.count === null && h.pecked));
    }
    expect(all.length).toBeGreaterThan(80);
    const mean = all.reduce((sum, h) => sum + h.eaten, 0) / all.length;
    expect(mean).toBeGreaterThanOrEqual(0.3);
    expect(all.filter((h) => h.eaten < 0.1).length / all.length).toBeLessThanOrEqual(0.06);
  }, SLOW);
});
