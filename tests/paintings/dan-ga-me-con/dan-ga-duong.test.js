// tests/paintings/dan-ga-me-con/dan-ga-duong.test.js — hình học đường đi và chỗ đứng quanh thân gà mẹ (parts/dan-ga-duong.js, parts/dan-ga-cho.js): đoạn gần nhất, khoảng cách giữa hai đoạn; hành trình vòng qua đầu hay đuôi mẹ khi đường thẳng cắt vòng cấm; điểm dừng và lùi vào chỗ núp; gán chỗ tổng ngắn nhất; điểm rắc dời ra bên cạnh mẹ; chỗ đứng quanh nắm thóc (chỉ trên vòng bán kính spread) tránh mẹ, sàn và các con khác.
import { describe, it, expect } from 'vitest';
import { FLOCK } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-pha.js';
import { createRouter, nearestOnSegment, pathLength, segmentGap } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-duong.js';
import { assign, createPlacer } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-cho.js';
import { FLOOR, LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { mulberry32 } from '../../../src/lib/random.js';

const { a, b, r } = LAYOUT.body;
const KEEP = r + FLOCK.clear;
const HOP = FLOCK.hopRadius[1];
const router = createRouter(LAYOUT.body, KEEP, FLOCK.standOff);
const placer = createPlacer(LAYOUT, router);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const spineGap = (p) => dist(p, nearestOnSegment(p, a, b));
/** Tâm vòng cách xương sống từ keep + spread + bước nhảy thì vòng và bước nhảy đều ngoài vòng cấm (đúng nghĩa "đứng quanh được"). */
const standable = (g) => spineGap(placer.ringCenter(g)) >= KEEP + FLOCK.spread + HOP - 1e-9;
const randomIn = (rand, [x0, x1], [z0, z1]) => [x0 + rand() * (x1 - x0), z0 + rand() * (z1 - z0)];

describe('dan-ga-duong · hình học', () => {
  it('nearestOnSegment kẹp vào đầu mút; segmentGap: cắt nhau thì 0, song song, và đạt ở đầu mút', () => {
    expect(nearestOnSegment([0.3, 5], a, b)[0]).toBeCloseTo(0.3, 12);
    expect(nearestOnSegment([0.3, 5], a, b)[1]).toBe(0);
    expect(nearestOnSegment([-3, 1], a, b)).toEqual(a);
    expect(nearestOnSegment([3, -1], a, b)).toEqual(b);
    expect(segmentGap([0, -1], [0, 1], a, b)).toBe(0); // cắt thẳng góc
    expect(segmentGap([-2, 2], [2, 2], a, b)).toBeCloseTo(2, 12); // song song, cách 2
    expect(segmentGap([3, 0], [3, 5], a, b)).toBeCloseTo(2.2, 12); // tới đầu b: 3 − 0,8
    expect(segmentGap([0.8, 0], [4, 4], a, b)).toBe(0); // chạm đúng đầu mút
    expect(pathLength([[0, 0], [3, 4], [3, 10]])).toBe(11);
  });

  it('đường thẳng không cắt vòng cấm thì chạy thẳng, không đỉnh trung gian, không điểm dừng', () => {
    const jy = router.journey([-5, 3.5], [5, 3.5]);
    expect(jy).toEqual({ lead: null, run: [[-5, 3.5], [5, 3.5]], tuck: null });
    expect(router.length(jy)).toBe(10);
    expect(router.journey([1, 1], [1, 1])).toEqual({ lead: null, run: [[1, 1]], tuck: null }); // đứng yên: không ra rồi vào lại
  });

  it('đường thẳng cắt vòng cấm thì vòng qua đầu hay đuôi mẹ, bên nào gần: mọi đoạn ngoài vòng cấm, đối xứng, dài hơn đường thẳng', () => {
    const through = router.journey([0, 3.5], [0, -3.5]);
    const way = through.run.slice(1, -1);
    expect(way.length).toBeGreaterThanOrEqual(1);
    for (const p of way) expect(spineGap(p), `đỉnh ${p}`).toBeGreaterThanOrEqual(KEEP);
    through.run.slice(1).forEach((p, k) => expect(router.visible(through.run[k], p), `đoạn ${k}`).toBe(true));
    expect(router.length(through)).toBeGreaterThan(7);
    expect(router.length(router.journey([0, -3.5], [0, 3.5]))).toBeCloseTo(router.length(through), 9);
    // Lệch về phía đầu mẹ (x < 0) thì vòng qua đầu; lệch về phía đuôi thì vòng qua đuôi.
    expect(router.journey([-1, 3.5], [-1, -3.5]).run.slice(1, -1).every((p) => p[0] < 0)).toBe(true);
    expect(router.journey([1, 3.5], [1, -3.5]).run.slice(1, -1).every((p) => p[0] > 0)).toBe(true);
  });

  it('300 cặp điểm ngẫu nhiên ngoài vòng cấm: mọi đoạn ngoài vòng cấm, mọi đỉnh ngoài vòng cấm, không ngắn hơn đường thẳng, không dài quá 2,2 lần cộng 3', () => {
    const rand = mulberry32(3);
    let detours = 0;
    for (let k = 0; k < 300; k += 1) {
      let p; let q;
      do p = randomIn(rand, FLOOR.x, FLOOR.z); while (spineGap(p) < KEEP);
      do q = randomIn(rand, FLOOR.x, FLOOR.z); while (spineGap(q) < KEEP);
      const jy = router.journey(p, q);
      expect(jy.lead === null && jy.tuck === null, `${p} → ${q}`).toBe(true);
      jy.run.slice(1).forEach((v, i) => expect(router.visible(jy.run[i], v), `${p} → ${q}: đoạn ${i}`).toBe(true));
      for (const v of jy.run) expect(spineGap(v)).toBeGreaterThanOrEqual(KEEP - 1e-9);
      expect(router.length(jy)).toBeGreaterThanOrEqual(dist(p, q) - 1e-9);
      expect(router.length(jy)).toBeLessThanOrEqual(2.2 * dist(p, q) + 3);
      if (jy.run.length > 2) detours += 1;
    }
    expect(detours, 'số đường phải vòng').toBeGreaterThan(20);
  });

  it('chỗ đến sát mẹ (chỗ núp trong vòng cấm): điểm dừng ngoài vòng cấm, thẳng ra ngoài từ chỗ núp; đường chạy kết thúc ở điểm dừng rồi lùi vào; đi ra thì ngược lại; chỗ ngoài vòng cấm thì chạy thẳng tới', () => {
    let near = 0;
    for (const slot of LAYOUT.slots) {
      const into = router.journey([-6, 3.5], slot);
      expect(into.lead).toBeNull();
      if (!router.inside(slot)) { // hai chỗ giữa lưng mẹ: đã ngoài vòng cấm, gà con ở hướng nào cũng không lún
        expect(into.tuck, `${slot}`).toBeNull();
        expect(into.run[into.run.length - 1]).toBe(slot);
        continue;
      }
      near += 1;
      const [stand, end] = into.tuck;
      expect(end).toBe(slot);
      expect(spineGap(stand)).toBeCloseTo(KEEP + FLOCK.standOff, 9);
      // điểm dừng nằm trên tia từ điểm gần nhất của xương sống qua chỗ núp
      const q = nearestOnSegment(slot, a, b);
      const cross = (stand[0] - q[0]) * (slot[1] - q[1]) - (stand[1] - q[1]) * (slot[0] - q[0]);
      expect(Math.abs(cross), `${slot}: điểm dừng lệch tia`).toBeLessThan(1e-9);
      expect(into.run[into.run.length - 1]).toEqual(stand);
      expect(into.run.every((p) => spineGap(p) >= KEEP - 1e-9), `${slot}: đường chạy vào vòng cấm`).toBe(true);
      const out = router.journey(slot, [6, -3]);
      expect(out.tuck).toBeNull();
      expect(out.lead[0]).toBe(slot);
      expect(out.lead[1]).toEqual(stand);
      expect(out.run[0]).toEqual(stand);
    }
    expect(near, 'số chỗ núp trong vòng cấm').toBe(6);
    const both = router.journey(LAYOUT.slots[0], LAYOUT.slots[4]); // từ chỗ núp này sang chỗ núp kia: ra, vòng, vào
    expect(both.lead).not.toBeNull();
    expect(both.tuck).not.toBeNull();
    expect(both.run.every((p) => spineGap(p) >= KEEP - 1e-9)).toBe(true);
  });
});

describe('dan-ga-cho · gán chỗ và chỗ đứng', () => {
  it('assign: tổng chi phí nhỏ nhất so với vét cạn, hòa thì lấy phương án đầu, hàng ít hơn cột được, tất định', () => {
    const rand = mulberry32(8);
    const best = (cost) => {
      let min = Infinity;
      const used = [];
      (function go(i, sum) {
        if (i === cost.length) { min = Math.min(min, sum); return; }
        for (let k = 0; k < cost[0].length; k += 1) if (!used[k]) { used[k] = true; go(i + 1, sum + cost[i][k]); used[k] = false; }
      })(0, 0);
      return min;
    };
    for (const [rows, cols] of [[6, 6], [5, 7], [4, 4], [1, 3], [7, 7]]) {
      const cost = Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(rand() * 20)));
      const pick = assign(cost);
      expect(new Set(pick).size, 'mỗi hàng một cột khác nhau').toBe(rows);
      expect(pick.reduce((s, k, i) => s + cost[i][k], 0)).toBe(best(cost));
      expect(assign(cost)).toEqual(pick);
    }
    expect(assign([[1, 1, 1], [1, 1, 1]])).toEqual([0, 1]); // hòa hết: phương án đầu theo thứ tự
    expect(assign([])).toEqual([]);
  });

  it('tâm vòng đứng được kéo vào trong sàn, chừa spread + bước nhảy', () => {
    const pad = FLOCK.spread + HOP;
    expect(placer.ringCenter([-6.7, -2.7])).toEqual([FLOOR.x[0] + pad, FLOOR.z[0] + pad]);
    expect(placer.ringCenter([6.7, 4.7])).toEqual([FLOOR.x[1] - pad, FLOOR.z[1] - pad]);
    expect(placer.ringCenter([2, 3])).toEqual([2, 3]);
  });

  it('awayFromHen: điểm đứng được giữ nguyên; điểm trúng, sau lưng hay sát mẹ dời tới điểm gần nhất mà gà con đứng quanh được, trong sàn', () => {
    const rand = mulberry32(5);
    let moved = 0;
    for (let k = 0; k < 120; k += 1) {
      const g = randomIn(rand, FLOOR.x, FLOOR.z);
      const m = placer.awayFromHen(g);
      expect(m[0] >= FLOOR.x[0] - 1e-9 && m[0] <= FLOOR.x[1] + 1e-9 && m[1] >= FLOOR.z[0] - 1e-9 && m[1] <= FLOOR.z[1] + 1e-9, `${g} → ${m} ngoài sàn`).toBe(true);
      expect(standable(m), `${g} → ${m} chưa đứng được`).toBe(true);
      if (standable(g)) { expect(m).toEqual(g); continue; }
      moved += 1;
      // Gần nhất: lùi 0,03 về phía điểm chạm là không đứng được nữa (lưới mịn 0,01).
      const d = dist(m, g);
      const back = [m[0] + ((g[0] - m[0]) / d) * 0.03, m[1] + ((g[1] - m[1]) / d) * 0.03];
      expect(standable(back), `${g} → ${m}: còn dời được gần hơn`).toBe(false);
    }
    expect(moved, 'số điểm phải dời').toBeGreaterThan(20);
    for (const g of [[0, 0], [0, -2.7], [-2.5, 0.2], [2.5, 0]]) expect(standable(placer.awayFromHen(g))).toBe(true);
  });

  it('ringSpots: chỗ trống thì đủ n chỗ cách đều trên vòng bán kính spread; bị chiếm thì bỏ chỗ vướng; không bao giờ phạm sàn hay vòng cấm quanh mẹ (300 trường hợp)', () => {
    const open = placer.ringSpots([-5, 2], 4, mulberry32(1), []);
    expect(open).toHaveLength(4);
    for (const p of open) expect(dist(p, [-5, 2])).toBeCloseTo(FLOCK.spread, 9);
    for (let i = 0; i < 4; i += 1) expect(dist(open[i], open[(i + 1) % 4])).toBeCloseTo(2 * FLOCK.spread * Math.sin(Math.PI / 4), 9);
    // Con khác đứng sát một chỗ của vòng: vòng xoay (hay nở) để tránh, nên mọi chỗ trả về vẫn cách nó từ FLOCK.gap.
    const blocked = placer.ringSpots([-5, 2], 4, mulberry32(1), [[open[0][0], open[0][1]]]);
    expect(blocked.length).toBeGreaterThanOrEqual(3);
    for (const p of blocked) expect(dist(p, open[0])).toBeGreaterThanOrEqual(FLOCK.gap - 1e-9);
    const rand = mulberry32(6);
    let blockedRings = 0;
    for (let k = 0; k < 300; k += 1) {
      const c = placer.ringCenter(randomIn(rand, FLOOR.x, FLOOR.z));
      const occupied = Array.from({ length: Math.floor(rand() * 10) }, () => randomIn(rand, FLOOR.x, FLOOR.z));
      const n = 2 + Math.floor(rand() * 3);
      const spots = placer.ringSpots(c, n, rand, occupied);
      if (spots.length < n) blockedRings += 1;
      for (const p of spots) {
        expect(p[0] >= FLOOR.x[0] + HOP - 1e-9 && p[0] <= FLOOR.x[1] - HOP + 1e-9 && p[1] >= FLOOR.z[0] + HOP - 1e-9 && p[1] <= FLOOR.z[1] - HOP + 1e-9, `${p} ngoài sàn`).toBe(true);
        expect(spineGap(p), `${p} trong vòng cấm`).toBeGreaterThanOrEqual(KEEP + HOP - 1e-9);
        // Vòng không bao giờ nở: mỏ lúc mổ chỉ với tới trước chân chừng 0,75, nên đứng xa hơn bán kính spread là mổ cạnh nắm thóc.
        expect(dist(p, c), `${p}: ngoài vòng bán kính ${FLOCK.spread}`).toBeCloseTo(FLOCK.spread, 9);
        for (const o of occupied) expect(dist(p, o), `${p} sát con khác ở ${o}`).toBeGreaterThanOrEqual(FLOCK.gap - 1e-9);
      }
    }
    expect(blockedRings, 'phải có vòng bị vướng để thử').toBeGreaterThan(20);
  });
});
