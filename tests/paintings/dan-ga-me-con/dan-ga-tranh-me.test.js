// tests/paintings/dan-ga-me-con/dan-ga-tranh-me.test.js — gà mẹ là vật cản của đàn gà dạng đóng (spec §20.5): nắm ném vào hay sát mẹ rơi bên cạnh mẹ (takeScatters trả điểm đã dời); không con nào vào thân mẹ, và chỉ vào vòng cấm khi ra vào chỗ núp, mặt quay ra ngoài; đường chạy vòng qua đầu hay đuôi mẹ; giữ thì gán chỗ núp sao cho tổng quãng đường ngắn nhất.
import { describe, it, expect } from 'vitest';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { createRouter, nearestOnSegment } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-duong.js';
import { FLOOR, LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { mulberry32 } from '../../../src/lib/random.js';

const NO_PILE = { ...LAYOUT, pile: null };
/** Test nặng (nhiều cảnh, từng khung): chừa thời gian cho máy chạy chậm hay đang bận (CI chạy cả trăm file song song). */
const SLOW = 60000;
const FREE = LAYOUT.homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
const { a, b } = LAYOUT.body;
const KEEP = LAYOUT.body.r + FLOCK.clear;
const router = createRouter(LAYOUT.body, KEEP, FLOCK.standOff);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const xz = (c) => [c.x, c.z];
const spineGap = (c) => dist(xz(c), nearestOnSegment(xz(c), a, b));
const slotDist = (c) => Math.min(...LAYOUT.slots.map((s) => dist(xz(c), s)));
const randomIn = (rand, [x0, x1], [z0, z1]) => [x0 + rand() * (x1 - x0), z0 + rand() * (z1 - z0)];
/** Một cảnh theo vòng khung (drift trước cử chỉ, như update): các sự kiện [thời điểm, loại, điểm, hạt giống], mỗi khung gọi visit(flock, t). */
function play(events, { reduced = false, seconds = 30, fps = 30 } = {}, visit) {
  const flock = createFlock(LAYOUT, { reduced });
  let e = 0;
  for (let k = 0; k <= seconds * fps; k += 1) {
    const t = k / fps;
    flock.drift(t);
    while (e < events.length && events[e][0] <= t) {
      const [, kind, at, seed] = events[e];
      e += 1;
      if (kind === 'scatter') flock.scatter(t, at, seed);
      else if (kind === 'grip') flock.grip(t);
      else flock.release(t);
    }
    visit(flock, t);
  }
}
/** Cảnh ngẫu nhiên: sáu bảy sự kiện trong vài giây đầu, chạm khắp sàn (kể cả trúng mẹ và lên vách). */
function randomEvents(rand, n) {
  let t = 0;
  return Array.from({ length: 7 }, (_, k) => {
    t += rand() * 3;
    const r = rand();
    return [t, r < 0.45 ? 'scatter' : r < 0.75 ? 'grip' : 'release', randomIn(rand, FLOOR.x, FLOOR.z), n * 10 + k];
  });
}

describe('dan-ga-tranh-me', () => {
  it('nắm ném vào mẹ, sau lưng mẹ (chạm lên vách), ở hai đầu hay sát mẹ: rơi bên cạnh mẹ, trong sàn, và các con mổ ngoài vòng cấm; nắm xa mẹ giữ nguyên chỗ', () => {
    const cases = [[0, 0], [0.4, -2.7], [-3, -2.7], [-2.5, 0.2], [2.5, 0], [0, 2], [0.2, 2.6]];
    for (const tap of cases) {
      const flock = createFlock(NO_PILE);
      flock.scatter(1, tap, 1);
      const [{ at }] = flock.takeScatters(1);
      expect(dist(at, tap), `chạm ${tap}: phải dời`).toBeGreaterThan(0.05);
      expect(at[0] >= FLOOR.x[0] && at[0] <= FLOOR.x[1] && at[1] >= FLOOR.z[0] && at[1] <= FLOOR.z[1], `${tap} → ${at} ngoài sàn`).toBe(true);
      expect(dist(at, nearestOnSegment(at, a, b)), `${tap} → ${at}: còn quá gần mẹ`).toBeGreaterThan(KEEP + FLOCK.spread - 0.35);
      for (let t = 2; t < 11; t += 0.1) {
        for (const c of flock.state(t).chicks.filter((x) => x.kind === 'peck')) expect(spineGap(c), `chạm ${tap}, lúc ${t.toFixed(1)}`).toBeGreaterThanOrEqual(KEEP - 1e-9);
      }
    }
    // Xa mẹ, trong sàn: giữ nguyên. Sát mép: kéo vào tâm vòng (dan-ga-song.test.js kiểm), không dời ra bên cạnh mẹ.
    for (const [tap, want] of [[[-4, 0.4], [-4, 0.4]], [[3, 3.4], [3, 3.4]], [[-5.5, 2], [-5.45, 2]], [[6.5, 4.6], [5.45, 3.45]]]) {
      const flock = createFlock(NO_PILE);
      flock.scatter(1, tap, 1);
      const [x, z] = flock.takeScatters(1)[0].at;
      expect([x, z], `chạm ${tap} xa mẹ`).toEqual(want.map((v) => expect.closeTo(v, 12)));
    }
  }, SLOW);

  it('nhúm lúc mở trang và nhúm gà mẹ bới nằm ngoài vòng cấm: không bị dời, các con mổ ngoài vòng cấm', () => {
    const flock = createFlock(LAYOUT);
    expect(flock.takeScatters(0)[0].at).toEqual(LAYOUT.pile);
    flock.drift(26);
    for (let t = 0; t < 40; t += 0.1) for (const c of flock.state(t).chicks.filter((x) => x.kind === 'peck')) expect(spineGap(c), `lúc ${t.toFixed(1)}`).toBeGreaterThanOrEqual(KEEP - 1e-9);
    const [handful] = flock.takeScatters(30);
    expect(dist(handful.at, LAYOUT.henFront)).toBeLessThan(0.5); // dời nhẹ (nếu có) vẫn ở trước mặt mẹ
  }, SLOW);

  it('đường đi thật, mọi khung (24 cảnh ngẫu nhiên × 24 giây, cả giảm chuyển động): không con nào vào thân mẹ; vào vòng cấm chỉ khi ra vào chỗ núp (cách chỗ núp ≤ 1,1); trong vòng cấm thì mặt quay ra ngoài (trong 60°)', () => {
    let inside = 0;
    for (let n = 0; n < 24; n += 1) {
      const rand = mulberry32(n + 100);
      play(randomEvents(rand, n), { reduced: n % 4 === 3, fps: 20, seconds: 24 }, (flock, t) => {
        flock.state(t).chicks.forEach((c, i) => {
          if (LAYOUT.homes[i].kind !== 'free') return;
          const g = spineGap(c);
          const tag = `cảnh ${n}, lúc ${t.toFixed(2)}, con ${i} (${c.kind}) ở [${c.x.toFixed(2)}, ${c.z.toFixed(2)}]`;
          expect(g, `${tag}: vào thân mẹ`).toBeGreaterThanOrEqual(LAYOUT.body.r - 1e-6);
          if (g >= KEEP - 1e-6) return;
          inside += 1;
          expect(slotDist(c), `${tag}: trong vòng cấm mà xa chỗ núp`).toBeLessThanOrEqual(1.1);
          const q = nearestOnSegment(xz(c), a, b);
          const cos = ((c.x - q[0]) / g) * Math.sin(c.heading) + ((c.z - q[1]) / g) * Math.cos(c.heading);
          expect(cos, `${tag}: quay mặt vào mẹ`).toBeGreaterThanOrEqual(0.5);
        });
      });
    }
    expect(inside, 'số khung trong vòng cấm (đang núp)').toBeGreaterThan(2000);
  }, SLOW);

  it('giữ: tám con vào tám chỗ núp sao cho tổng quãng đường (cả đoạn vòng qua mẹ) ngắn nhất trong mọi cách gán (vét cạn 8!), kể cả lúc các con đang chạy khắp nơi', () => {
    for (let n = 0; n < 10; n += 1) {
      const rand = mulberry32(n + 500);
      const flock = createFlock(NO_PILE);
      for (let k = 0; k < 4; k += 1) flock.scatter(1 + k * 1.5, randomIn(rand, FLOOR.x, FLOOR.z), n * 10 + k);
      const tg = 5.6 + rand() * 8; // sau cú chạm cuối (5,5): giữ không phải mốc lùi, nên chỗ đứng lúc giữ là chỗ đọc được ở tg
      const starts = flock.state(tg).chicks.map(xz);
      flock.grip(tg);
      const settled = flock.state(tg + 10).chicks;
      const pick = FREE.map((i) => LAYOUT.slots.findIndex((s) => dist(s, xz(settled[i])) < 1e-6));
      expect(new Set(pick).size, `cảnh ${n}: không hai con một chỗ`).toBe(8);
      const cost = FREE.map((i) => LAYOUT.slots.map((s) => router.length(router.journey(starts[i], s))));
      const chosen = pick.reduce((sum, k, row) => sum + cost[row][k], 0);
      let best = Infinity;
      const used = [];
      (function go(row, sum) {
        if (sum >= best) return;
        if (row === 8) { best = sum; return; }
        for (let k = 0; k < 8; k += 1) if (!used[k]) { used[k] = true; go(row + 1, sum + cost[row][k]); used[k] = false; }
      })(0, 0);
      expect(chosen, `cảnh ${n}`).toBeLessThanOrEqual(best + 1e-6);
    }
  }, SLOW);

  it('gà con ở phía bên kia mẹ vòng qua đầu hay đuôi mẹ, không xuyên qua: chạy từ trước mặt mẹ ra sau lưng mẹ, mọi khung cách xương sống ≥ vòng cấm', () => {
    const flock = createFlock(NO_PILE);
    flock.scatter(1, [4, -2.6], 1); // sau đuôi mẹ, bên kia: các con ở phía trước phải vòng qua đuôi
    let crossed = 0;
    for (let t = 1; t < 9; t += 1 / 60) {
      for (const c of flock.state(t).chicks.filter((x) => x.goal === 'food')) {
        expect(spineGap(c), `lúc ${t.toFixed(2)}`).toBeGreaterThanOrEqual(KEEP - 1e-9);
        crossed += 1;
      }
    }
    expect(crossed).toBeGreaterThan(100);
  }, SLOW);
});
