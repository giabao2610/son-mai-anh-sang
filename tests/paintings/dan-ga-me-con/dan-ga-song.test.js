// tests/paintings/dan-ga-me-con/dan-ga-song.test.js — đàn gà dạng đóng (spec §20.5): rắc thì 3–4 con rảnh gần nhất chạy tới, mỗi con một chỗ trên vòng quanh nắm (không chồng nhau, không ra khỏi giấy), tới đúng lúc, mổ rồi cả nhóm cùng về; con về nhà không đứng sát con đang mổ; chạm sát mép thì thóc rơi ở tâm vòng; giữ thì núp (quay ra ngoài, không hai con một chỗ), thả thì tản; liên tục ở mỗi mốc kể cả giữ lúc gà đang chờ, chạy hay mổ; thứ tự gọi không đổi kết quả; tối đa 32 mốc; bão chạm, giữ, thả với nhiều hạt giống; chạm dồn; giảm chuyển động; gà mẹ bới (drift); nhúm thóc lúc mở trang; đầu vào hỏng thì ném lỗi.
import { describe, it, expect } from 'vitest';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { FLOOR, LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { nearestOnSegment } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-duong.js';
import { mulberry32 } from '../../../src/lib/random.js';

const NO_PILE = { ...LAYOUT, pile: null };
/** Test nặng (nhiều cảnh, từng khung): chừa thời gian cho máy chạy chậm hay đang bận (CI chạy cả trăm file song song). */
const SLOW = 60000;
const HOMES_KIND = LAYOUT.homes.map((h) => h.kind);
const FREE = LAYOUT.homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
const AT_HOME = FLOCK.wander * Math.SQRT2 + 1e-9; // lượn quanh nhà: mỗi trục tối đa FLOCK.wander
/** Xa nhất mà một con đang mổ cách điểm rắc: bán kính vòng đứng cộng bước nhảy. */
const REACH = FLOCK.spread + FLOCK.hopRadius[1];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const randomIn = (rand, [x0, x1], [z0, z1]) => [x0 + rand() * (x1 - x0), z0 + rand() * (z1 - z0)];
const xz = (c) => [c.x, c.z];
/** Hiệu hai góc, về [−π, π). */
const angleDiff = (a, b) => ((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
const finite = (st) => st.chicks.every((c) => [c.x, c.y, c.z, c.heading, c.head, ...c.beak].every(Number.isFinite))
  && Object.values(st.hen).every(Number.isFinite) && Number.isFinite(st.near) && Number.isFinite(st.eating);
/** Chỗ núp (chỉ số trong LAYOUT.slots) mà con c đang đứng đúng, −1 nếu chưa ở chỗ nào. */
const slotOf = (c) => LAYOUT.slots.findIndex((s) => dist(s, xz(c)) < 0.05);
/** Mọi con ở quanh nhà (con trèo lưng và con nấp bụng đứng yên tại nhà). */
const allHome = (st) => st.chicks.every((c, i) => dist(xz(c), LAYOUT.homes[i].at) <= AT_HOME);
/** Con c còn trên sàn (chừa 0,01 cho sai số): gà con đứng ngoài sàn là đứng ngoài tờ giấy. */
const onFloor = (c) => c.x >= FLOOR.x[0] - 0.01 && c.x <= FLOOR.x[1] + 0.01 && c.z >= FLOOR.z[0] - 0.01 && c.z <= FLOOR.z[1] + 0.01;
/** Cách xương sống của mẹ; vòng cấm là nửa bề ngang của mẹ cộng FLOCK.clear. */
const spineGap = (c) => dist(xz(c), nearestOnSegment(xz(c), LAYOUT.body.a, LAYOUT.body.b));
const KEEP = LAYOUT.body.r + FLOCK.clear;
const slotDist = (c) => Math.min(...LAYOUT.slots.map((s) => dist(xz(c), s)));
/** Gà con rảnh có đang ở chỗ cấm không: vào thân mẹ là không bao giờ được; vào vòng cấm chỉ được khi đang vào ra chỗ núp (cách chỗ núp ≤ 1,1). */
const hereOk = (c) => spineGap(c) >= LAYOUT.body.r - 1e-6 && (spineGap(c) >= KEEP - 1e-6 || slotDist(c) <= 1.1);
/** Khoảng cách nhỏ nhất giữa hai con đang mổ ở một khung; Infinity nếu chưa đủ hai con. */
function closestEaters(st) {
  const e = st.chicks.filter((c) => c.kind === 'peck');
  let m = Infinity;
  for (let i = 0; i < e.length; i += 1) for (let j = i + 1; j < e.length; j += 1) m = Math.min(m, dist(xz(e[i]), xz(e[j])));
  return m;
}

describe('dan-ga-song', () => {
  it('không ai chạm, không có nhúm thóc: mọi con quanh nhà; chỉ con trèo lưng và con nấp bụng ở quanh mẹ; không ai mổ', () => {
    const flock = createFlock(NO_PILE);
    for (const t of [0, 3, 10, 24]) {
      const st = flock.state(t);
      st.chicks.forEach((c, i) => expect(dist(xz(c), LAYOUT.homes[i].at), `con ${i} lúc ${t}`).toBeLessThanOrEqual(AT_HOME));
      expect([st.near, st.eating]).toEqual([2, 0]);
    }
  });

  it('chạm: 3–4 con rảnh GẦN NHẤT chạy tới; tới chậm nhất lúc phản xạ 0,4 s + quãng / 9; mổ (mỏ chạm sàn); rồi về nhà', () => {
    const flock = createFlock(NO_PILE);
    const at = [-4.5, 2.5];
    flock.scatter(5, at, 7);
    const before = flock.state(5);
    const went = FREE.filter((i) => dist(xz(flock.state(9).chicks[i]), at) < REACH + 0.05);
    expect(went.length).toBeGreaterThanOrEqual(3);
    expect(went.length).toBeLessThanOrEqual(4);
    const byDistance = [...FREE].sort((a, b) => dist(xz(before.chicks[a]), at) - dist(xz(before.chicks[b]), at));
    expect([...went].sort()).toEqual(byDistance.slice(0, went.length).sort());
    for (const i of went) {
      const latest = 5 + FLOCK.react[1] + (dist(xz(before.chicks[i]), at) + FLOCK.spread) / FLOCK.run;
      expect(dist(xz(flock.state(latest + 0.05).chicks[i]), at), `con ${i} tới nơi`).toBeLessThanOrEqual(REACH + 1e-9);
    }
    expect(flock.state(10).eating).toBe(went.length);
    let pecks = 0;
    for (let t = 7; t < 13; t += 1 / 60) pecks += flock.state(t).chicks.filter((c) => c.pecking && c.beak[1] < 0.1).length;
    expect(pecks).toBeGreaterThan(0);
    const later = flock.state(30);
    for (const i of went) expect(dist(xz(later.chicks[i]), LAYOUT.homes[i].at)).toBeLessThanOrEqual(AT_HOME);
  });

  it('con đã chạy tới hay đang mổ một nắm thì không bị nắm khác gọi đi: nắm sau chỉ gọi các con còn rảnh, kế hoạch của con kia không đổi', () => {
    const onlyFirst = createFlock(NO_PILE);
    const both = createFlock(NO_PILE);
    for (const f of [onlyFirst, both]) f.scatter(5, [-4.5, 2.5], 1);
    both.scatter(5.5, [-4, 3], 2); // sát nắm đầu (cách 0,71): các con của nắm đầu vẫn là gần nhất, nhưng đang bận
    const busy = FREE.filter((i) => onlyFirst.state(5.45).chicks[i].goal === 'food');
    expect(busy.length).toBeGreaterThanOrEqual(3);
    const busyNow = FREE.filter((i) => both.state(5.55).chicks[i].goal === 'food');
    expect(busyNow.length, 'nắm sau gọi thêm con rảnh').toBeGreaterThan(busy.length);
    for (const t of [6, 9, 12, 20]) {
      for (const i of busy) expect(both.state(t).chicks[i], `con ${i} lúc ${t}`).toEqual(onlyFirst.state(t).chicks[i]);
    }
  });

  it('các con tới cùng một nắm đứng trên vòng quanh điểm rắc, mỗi con một chỗ: suốt lúc mổ hai con bất kỳ cách nhau ≥ chặn dưới (không chồng lên nhau)', () => {
    // Bốn con cách đều trên vòng bán kính spread: hai con kề nhau cách 2·spread·sin(π/4); mỗi con nhảy tối đa hopRadius[1] khỏi chỗ đứng.
    const bound = 2 * FLOCK.spread * Math.sin(Math.PI / FLOCK.responders[1]) - 2 * FLOCK.hopRadius[1];
    expect(bound).toBeGreaterThan(0.7); // gà con rộng chừng 1: cách dưới 0,7 là chồng lên nhau rõ rệt
    const rand = mulberry32(5);
    let worst = Infinity;
    let samples = 0;
    for (let n = 0; n < 60; n += 1) {
      const flock = createFlock(NO_PILE);
      flock.scatter(5, [rand() * 11 - 5.5, rand() * 6 - 1.5], n);
      for (let t = 7; t < 12.5; t += 0.1) {
        const m = closestEaters(flock.state(t));
        if (m < Infinity) samples += 1;
        worst = Math.min(worst, m);
      }
    }
    expect(samples).toBeGreaterThan(1000);
    expect(worst).toBeGreaterThanOrEqual(bound - 1e-6);
  }, SLOW);

  it('đang mổ thì nhìn về nắm thóc, nên mỏ chạm sàn gần điểm rắc (trong 0,55) và có cú mổ ngay sát điểm rắc (trong 0,3)', () => {
    const rand = mulberry32(12);
    let worst = 0;
    let closest = Infinity;
    for (let n = 0; n < 30; n += 1) {
      const flock = createFlock(NO_PILE);
      flock.scatter(5, [rand() * 10.8 - 5.4, rand() * 4.8 - 1.4], n); // cách mép hơn spread + hopRadius[1]: vòng đứng không bị kéo vào trong
      const [{ at }] = flock.takeScatters(5); // điểm rắc thật: gần mẹ thì đã dời ra bên cạnh
      for (let t = 8; t < 13; t += 1 / 30) {
        for (const c of flock.state(t).chicks) {
          if (c.kind !== 'peck') continue;
          // Nhìn về tâm vòng từ chỗ đứng; con nhảy ngang tới hopRadius[1] so với chỗ đứng nên lệch tối đa atan(0,25 / 0,75) ≈ 0,32.
          expect(Math.abs(angleDiff(c.heading, Math.atan2(at[0] - c.x, at[1] - c.z))), `hạt ${n}, lúc ${t.toFixed(2)}: hướng so với nắm`).toBeLessThan(0.35);
          if (!c.pecking || c.beak[1] > 0.1) continue;
          const d = dist([c.beak[0], c.beak[2]], at);
          worst = Math.max(worst, d);
          closest = Math.min(closest, d);
        }
      }
    }
    // Chỗ đứng cách điểm rắc spread, đầu mỏ lúc "đang mổ" (cúi ≥ 85%) trước chân 0,73–0,8, chỗ mổ lệch tối đa hopRadius[1]:
    // mỏ cách điểm rắc tối đa max(spread − 0,73; 0,8 − spread) + hopRadius[1].
    expect(worst).toBeLessThanOrEqual(Math.max(FLOCK.spread - 0.73, 0.8 - FLOCK.spread) + FLOCK.hopRadius[1] + 0.02);
    expect(worst).toBeLessThan(0.55);
    expect(closest).toBeLessThan(0.3);
  }, SLOW);

  it('các nắm cùng lúc không dồn các con vào nhau: hai nắm cách 0,6 thì mọi cặp con đang mổ cách ≥ gap − hai bước nhảy; nắm cạnh con nấp bụng thì con mổ gần nhất cách nó ≥ gap − bước nhảy', () => {
    const near = FLOCK.gap - 2 * FLOCK.hopRadius[1]; // chỗ đứng cách nhau gap, mỗi con nhảy tối đa hopRadius[1]
    const rand = mulberry32(21);
    let worst = Infinity;
    for (let n = 0; n < 120; n += 1) {
      const flock = createFlock(NO_PILE);
      const at = randomIn(rand, [-4, 4], [-1.2, 3.2]);
      flock.scatter(5, at, n);
      flock.scatter(5.3, [at[0] + 0.6, at[1]], n + 500);
      for (let t = 8; t < 13; t += 0.1) worst = Math.min(worst, closestEaters(flock.state(t)));
    }
    expect(worst, 'hai nắm cách 0,6: hai con mổ gần nhất').toBeGreaterThanOrEqual(near - 1e-6);
    const flock = createFlock(NO_PILE);
    flock.scatter(5, [0.2, 2.6], 1);
    const belly = LAYOUT.homes.find((h) => h.kind === 'belly').at;
    let closest = Infinity;
    for (let t = 6; t < 13; t += 0.05) for (const c of flock.state(t).chicks.filter((x) => x.kind === 'peck')) closest = Math.min(closest, dist(xz(c), belly));
    expect(closest, 'con mổ gần con nấp bụng nhất').toBeGreaterThanOrEqual(FLOCK.gap - FLOCK.hopRadius[1] - 1e-6);
  }, SLOW);

  it('con về nhà không đứng sát con đang mổ (200 cảnh, bốn cú chạm khắp sàn): nhà của con đang đi vắng là chỗ đã có người, và các con cùng một nắm thôi mổ cùng lúc', () => {
    // Con đứng ở nhà lượn tối đa wander·√2 quanh nhà; chỗ đứng của con mổ cách nhà ấy từ gap, nhảy tối đa hopRadius[1].
    const bound = FLOCK.gap - FLOCK.wander * Math.SQRT2 - FLOCK.hopRadius[1];
    expect(bound).toBeGreaterThan(0.7);
    let worst = Infinity;
    let where = '';
    for (let n = 0; n < 200; n += 1) {
      const rand = mulberry32(1000 + n);
      const flock = createFlock(NO_PILE);
      const taps = [];
      let at = 1;
      for (let k = 0; k < 4; k += 1) {
        at += rand() * 4;
        taps.push([at, randomIn(rand, FLOOR.x, FLOOR.z)]);
      }
      let e = 0;
      for (let f = 0; f <= 40 * 20; f += 1) {
        const t = f / 20;
        flock.drift(t);
        while (e < taps.length && taps[e][0] <= t) {
          flock.scatter(t, taps[e][1], n * 10 + e);
          e += 1;
        }
        const { chicks } = flock.state(t);
        for (const p of chicks.filter((c) => c.kind === 'peck')) {
          for (const q of chicks.filter((c) => c.kind === 'idle' || c.kind === 'perch')) {
            const d = dist(xz(p), xz(q));
            if (d < worst) [worst, where] = [d, `cảnh ${n}, lúc ${t.toFixed(2)}`];
          }
        }
      }
    }
    expect(worst, `con mổ sát con đứng ở nhà (${where})`).toBeGreaterThanOrEqual(bound);
  }, SLOW);

  it('các con cùng một nắm thôi mổ cùng lúc: con tới trước mổ lâu hơn một chút, không ai về trước để đứng nghỉ sát chỗ con kia còn mổ', () => {
    const flock = createFlock(NO_PILE);
    flock.scatter(5, [-4.5, 2.5], 7);
    let last = 0;
    let stopped = null;
    for (let t = 5; t < 20; t += 0.01) {
      const n = flock.state(t).eating;
      if (last >= 3 && n < last) {
        stopped = n;
        break;
      }
      last = n;
    }
    expect(last).toBeGreaterThanOrEqual(3);
    expect(stopped, 'cả nhóm thôi mổ cùng một lúc').toBe(0);
  });

  it('chạm sát mép sàn hay góc: nắm rơi ở tâm vòng của các con (kéo vào trong sàn, chừa vòng và bước nhảy), nên mỏ đang mổ vẫn chạm sàn trong 0,55 quanh chỗ thóc rơi', () => {
    const pad = FLOCK.spread + FLOCK.hopRadius[1];
    for (const tap of [[-6.7, -2.7], [6.7, 4.7], [0, 4.7], [-6.7, 1.5], [5, -2.7], [-4.6, 4.5]]) {
      const flock = createFlock(NO_PILE);
      flock.scatter(5, tap, 3);
      const [{ at }] = flock.takeScatters(5);
      const inner = at[0] >= FLOOR.x[0] + pad - 1e-9 && at[0] <= FLOOR.x[1] - pad + 1e-9 && at[1] >= FLOOR.z[0] + pad - 1e-9 && at[1] <= FLOOR.z[1] - pad + 1e-9;
      expect(inner, `chạm ${tap} → ${at}`).toBe(true);
      let pecks = 0;
      for (let t = 6; t < 14; t += 1 / 30) {
        for (const c of flock.state(t).chicks.filter((x) => x.pecking)) {
          pecks += 1;
          expect(dist([c.beak[0], c.beak[2]], at), `chạm ${tap}, lúc ${t.toFixed(2)}`).toBeLessThan(0.55);
        }
      }
      expect(pecks, `chạm ${tap}: có con tới mổ`).toBeGreaterThan(0);
    }
  }, SLOW);

  it('mốc lùi (cử chỉ mang thời điểm cũ) xếp vào "bây giờ", là thời điểm lớn nhất các hàm ghi đã nhận (drift chạy mỗi khung): đàn không nhảy ở bây giờ, khung đã vẽ không bị viết lại', () => {
    const rand = mulberry32(99);
    let worstJump = 0;
    for (let k = 0; k < 150; k += 1) {
      const flock = createFlock(NO_PILE);
      const last = 2 + rand() * 3;
      flock.drift(last);
      flock.scatter(last, randomIn(rand, FLOOR.x, FLOOR.z), k);
      if (k % 3 === 2) { flock.drift(last + 0.05); flock.grip(last + 0.05); } // lần này thử thả lùi
      const now = last + 0.2 + rand() * 1.3;
      flock.drift(now); // khung hiện tại
      const shown = flock.state(now - 0.1); // khung đã vẽ trước đó
      const before = flock.state(now);
      const marks = flock.marks();
      if (k % 3 === 0) flock.scatter(now - 3, randomIn(rand, FLOOR.x, FLOOR.z), k + 1000);
      else if (k % 3 === 1) flock.grip(now - 3);
      else flock.release(now - 3);
      expect(flock.marks(), `lần ${k}: mốc lùi vẫn thành mốc`).toBe(marks + 1);
      const after = flock.state(now);
      worstJump = Math.max(worstJump, ...after.chicks.map((c, i) => dist(xz(c), xz(before.chicks[i]))));
      expect(flock.state(now - 0.1), `lần ${k}: khung đã vẽ bị viết lại`).toEqual(shown);
      expect(Math.abs(after.hen.wing - before.hen.wing)).toBeLessThan(1e-3);
    }
    expect(worstJump).toBeLessThan(1e-3);
    // Nắm của mốc lùi rơi ngay bây giờ (không rơi ở quá khứ), và chạm ngược dòng cũng giao đúng một lần.
    const flock = createFlock(NO_PILE);
    flock.drift(10);
    flock.scatter(7, [4, 3], 1);
    expect(flock.takeScatters(9.9)).toEqual([]);
    expect(flock.takeScatters(10)).toHaveLength(1);
  }, SLOW);

  it('drift xếp mốc bới của mình sau lần gọi trước: lần bới đã đến hạn lúc mẹ chưa được gọi tới (hàm ghi khác đã nhận thời điểm muộn hơn) rơi vào "bây giờ", không rơi vào quá khứ', () => {
    const flock = createFlock(NO_PILE);
    flock.drift(10);
    flock.release(40); // chưa giữ: bỏ qua, nhưng "bây giờ" đã là 40
    flock.drift(41); // đáng lẽ bới lúc 25
    expect(flock.marks()).toBe(2);
    expect(flock.state(39.9).hen.scratch).toBe(0);
    expect(flock.state(40.3).hen.scratch).toBeGreaterThan(0.5);
    expect(flock.takeScatters(40.2)).toEqual([]);
    expect(flock.takeScatters(40.31)).toHaveLength(1);
  });

  it('chạm sát mép sàn hay ở góc: không con nào ra khỏi giấy, lúc chạy lẫn lúc mổ (vòng đứng kéo vào trong sàn)', () => {
    const corners = [[-6.7, -2.7], [6.7, -2.7], [-6.7, 4.7], [6.7, 4.7], [0, 4.7], [6.7, 1], [-6.7, 1], [0, -2.7]];
    for (const at of corners) {
      const flock = createFlock(NO_PILE);
      flock.scatter(5, at, 3);
      const out = [];
      for (let t = 5; t < 25; t += 0.1) flock.state(t).chicks.forEach((c, i) => { if (!onFloor(c)) out.push(`con ${i} lúc ${t.toFixed(1)}: [${c.x.toFixed(2)}, ${c.z.toFixed(2)}]`); });
      expect(out, `chạm ở ${at}`).toEqual([]);
    }
  }, SLOW);

  it('giữ: tám con chạy về tám chỗ núp, không hai con một chỗ; quanhMe = 10 sau 3 giây; cánh mẹ mở 60°; thả thì tản dần rồi về nhà', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(2);
    const st = flock.state(5);
    const slots = FREE.map((i) => slotOf(st.chicks[i]));
    expect(slots.every((k) => k >= 0)).toBe(true);
    expect(new Set(slots).size).toBe(8);
    expect(st.near).toBe(10);
    expect(st.hen.wing).toBeCloseTo(FLOCK.wing, 2);
    flock.release(5);
    expect(flock.state(5.05).near).toBeGreaterThanOrEqual(8); // tản dần: vừa thả thì còn quanh mẹ
    const end = flock.state(20);
    expect(end.near).toBe(2);
    expect(end.hen.wing).toBeLessThan(1e-3);
  });

  it('núp: quay ra ngoài (lưng về phía mẹ) rồi ngó nghiêng không quá FLOCK.peek: chỗ núp của bố cục chừa đủ chỗ cho đúng dáng này', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(2);
    for (let t = 4; t < 12; t += 0.05) {
      const st = flock.state(t);
      for (const i of FREE) {
        const slot = LAYOUT.slots[slotOf(st.chicks[i])];
        const outward = Math.atan2(slot[0] - LAYOUT.hen[0], slot[1] - LAYOUT.hen[1]);
        expect(Math.abs(angleDiff(st.chicks[i].heading, outward)), `con ${i} lúc ${t.toFixed(2)}`).toBeLessThanOrEqual(FLOCK.peek + 1e-9);
      }
    }
  }, SLOW);

  it('rắc trong lúc giữ: thóc vẫn rơi (takeScatters) mà các con ở lại với mẹ; thả trong 20 giây thì 3–4 con tới nắm đó', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(1);
    flock.scatter(3, [4, 3], 2);
    expect(flock.takeScatters(3)).toHaveLength(1);
    expect(flock.state(4).near).toBe(10);
    flock.release(6);
    const went = FREE.filter((i) => dist(xz(flock.state(9).chicks[i]), [4, 3]) < REACH + 0.05).length;
    expect(went).toBeGreaterThanOrEqual(3);
    expect(went).toBeLessThanOrEqual(4);
  });

  it('thả sau hơn 20 giây kể từ nắm cuối: không con nào tới nắm cũ; mọi con về nhà', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(1);
    flock.scatter(2, [4, 3], 9);
    flock.release(30);
    for (let t = 30; t < 45; t += 0.1) expect(flock.state(t).eating, `lúc ${t.toFixed(1)}`).toBe(0);
    expect(allHome(flock.state(45))).toBe(true);
  });

  it('giữ hai lần liền hay thả khi chưa giữ: bỏ qua, không thêm mốc', () => {
    const flock = createFlock(NO_PILE);
    flock.release(1);
    expect(flock.marks()).toBe(1);
    flock.grip(2);
    flock.grip(3);
    expect(flock.marks()).toBe(2);
    flock.release(4);
    flock.release(5);
    expect(flock.marks()).toBe(3);
  });

  it.each(['stay', 'move', 'peck'])('giữ lúc một con rảnh đang ở pha %s của nắm thóc: vị trí liên tục, rồi cả tám con về chỗ núp, không ai còn mổ', (kind) => {
    const make = () => {
      const f = createFlock(NO_PILE);
      f.scatter(5, [-4.5, 2.5], 7);
      return f;
    };
    const probe = make();
    let gripAt = null;
    for (let t = 5.01; t < 14 && gripAt === null; t += 0.01) if (probe.state(t).chicks.some((c) => c.goal === 'food' && c.kind === kind)) gripAt = t;
    expect(gripAt, `không có con nào ở pha ${kind}`).not.toBeNull();
    const flock = make();
    const before = flock.state(gripAt - 1e-6);
    flock.grip(gripAt);
    const after = flock.state(gripAt + 1e-6);
    after.chicks.forEach((c, i) => expect(dist(xz(c), xz(before.chicks[i])), `con ${i}`).toBeLessThan(1e-3));
    const settled = flock.state(gripAt + 4);
    expect([settled.near, settled.eating]).toEqual([10, 0]);
    expect(new Set(FREE.map((i) => slotOf(settled.chicks[i]))).size).toBe(8);
  });

  it('bão chạm, giữ, thả (20 hạt giống PRNG × 100 bước, một phần ba ở chế độ giảm chuyển động, cả mốc lùi và khoảng lặng cho gà mẹ bới): vị trí và cánh liên tục ở mọi mốc kể cả mốc lùi; mọi số hữu hạn; luôn trên sàn; không con nào vào thân mẹ; không hai con một chỗ núp; tối đa 32 mốc; cuối cùng ai về nhà nấy', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const rand = mulberry32(seed * 2026);
      const flock = createFlock(LAYOUT, { reduced: seed % 3 === 0 });
      let t = 0.5;
      for (let n = 0; n < 100; n += 1) {
        t += rand() < 0.08 ? 20 + rand() * 30 : rand() * 1.5; // thỉnh thoảng lặng lâu: gà mẹ bới
        flock.drift(t); // như update mỗi khung: gọi trước cử chỉ
        const r = rand();
        const before = flock.state(t - 1e-6);
        if (r < 0.4) flock.scatter(t, [rand() * 12 - 6, rand() * 7 - 2.5], n);
        else if (r < 0.65) flock.grip(t);
        else if (r < 0.85) flock.release(t);
        else flock.scatter(t - 3, [rand() * 12 - 6, rand() * 7 - 2.5], n); // mốc lùi: xếp vào "bây giờ" (drift vừa gọi lúc t)
        flock.drift(t);
        const after = flock.state(t + 1e-6);
        const tag = `hạt ${seed}, bước ${n}, t = ${t.toFixed(2)}`;
        expect(finite(before) && finite(after), tag).toBe(true);
        // Liên tục ở mọi mốc, kể cả mốc lùi: mốc không viết lại các khung đã vẽ.
        after.chicks.forEach((c, i) => expect(dist(xz(c), xz(before.chicks[i])), `${tag}, con ${i}`).toBeLessThan(1e-3));
        expect(Math.abs(after.hen.wing - before.hen.wing), `${tag}: cánh`).toBeLessThan(1e-3);
        expect(after.chicks.every(onFloor), `${tag}: có con ngoài sàn`).toBe(true);
        after.chicks.forEach((c, i) => expect(HOMES_KIND[i] !== 'free' || hereOk(c), `${tag}: con ${i} (${c.kind}) vào thân mẹ [${c.x.toFixed(2)}, ${c.z.toFixed(2)}]`).toBe(true));
        const settled = after.chicks.filter((c) => c.kind === 'hide').map(xz);
        settled.forEach((p, i) => settled.slice(i + 1).forEach((q) => expect(dist(p, q), `${tag}: hai con một chỗ núp`).toBeGreaterThan(1)));
        expect(after.eating, tag).toBeLessThanOrEqual(8);
        expect(flock.marks(), tag).toBeLessThanOrEqual(32);
      }
      flock.release(t + 0.1);
      expect(allHome(flock.state(t + 200)), `hạt ${seed}: cuối cùng ai về nhà nấy`).toBe(true);
    }
  }, SLOW);

  it('hai mươi lần chạm trong một giây: mọi nắm giao đúng một lần, theo thứ tự; mọi số hữu hạn, trên sàn; không quá tám con mổ; rồi ai về nhà nấy', () => {
    const rand = mulberry32(8);
    const flock = createFlock(NO_PILE);
    for (let n = 0; n < 20; n += 1) flock.scatter(1 + n * 0.05, [rand() * 12 - 6, rand() * 7 - 2.5], n);
    const got = flock.takeScatters(5);
    expect(got.map((g) => g.seed)).toEqual(Array.from({ length: 20 }, (_, n) => n));
    expect(flock.takeScatters(5)).toEqual([]);
    expect(flock.marks()).toBe(21);
    for (let t = 0; t < 60; t += 0.25) {
      const st = flock.state(t);
      expect(finite(st) && st.chicks.every(onFloor), `lúc ${t}`).toBe(true);
      expect(st.eating).toBeLessThanOrEqual(8);
    }
    expect(allHome(flock.state(60))).toBe(true);
  });

  it('gọi state theo thứ tự nào cũng ra cùng số (dạng đóng: update(0, t) của ?freeze ra đúng khung N)', () => {
    const make = () => {
      const f = createFlock(LAYOUT);
      f.scatter(2, [-4, 2], 1);
      f.grip(6);
      f.release(9);
      f.drift(60);
      return f;
    };
    const times = Array.from({ length: 70 }, (_, k) => k * 0.85);
    const a = make();
    const b = make();
    const forward = times.map((t) => a.state(t));
    const backward = [...times].reverse().map((t) => b.state(t)).reverse();
    expect(backward).toEqual(forward);
  });

  it('giảm chuyển động: chạy chậm còn một nửa (tới muộn hơn hẳn), cánh mở chậm hơn; gà mẹ không bới', () => {
    const fast = createFlock(NO_PILE);
    const slow = createFlock(NO_PILE, { reduced: true });
    for (const f of [fast, slow]) f.scatter(1, [-6, 4.5], 3);
    const firstEat = (f) => {
      for (let t = 1; t < 20; t += 0.01) if (f.state(t).eating > 0) return t;
      return Infinity;
    };
    expect(firstEat(slow) - 1).toBeGreaterThan((firstEat(fast) - 1) * 1.4);
    slow.drift(200);
    expect(slow.marks()).toBe(2); // mốc đầu và cú chạm
    const [quick, calm] = [createFlock(NO_PILE), createFlock(NO_PILE, { reduced: true })];
    for (const f of [quick, calm]) f.grip(1);
    expect(calm.state(1.3).hen.wing).toBeLessThan(quick.state(1.3).hen.wing);
    expect(calm.state(10).hen.wing).toBeCloseTo(FLOCK.wing, 2); // rồi cũng mở hết cỡ
  });

  it('gà mẹ bới: không ai chạm 25 giây thì một nhúm 24 hạt trước mặt mẹ, văng ở giữa nhịp cào (0,3 s sau), 2–3 con xúm lại', () => {
    const flock = createFlock(NO_PILE);
    flock.drift(24.9);
    expect(flock.takeScatters(24.9)).toEqual([]);
    flock.drift(26);
    expect(flock.takeScatters(25.2)).toEqual([]);
    const [handful] = flock.takeScatters(25.4);
    expect(handful.count).toBe(FLOCK.henHandful);
    expect(dist(handful.at, LAYOUT.henFront)).toBeLessThan(0.5);
    expect(flock.takeScatters(30)).toEqual([]); // mỗi nắm giao đúng một lần
    expect(flock.state(25.3).hen.scratch).toBeGreaterThan(0.5);
    expect(flock.state(26).hen.scratch).toBe(0);
    const pecking = flock.state(29).eating;
    expect(pecking).toBeGreaterThanOrEqual(2);
    expect(pecking).toBeLessThanOrEqual(3);
  });

  it('gà mẹ bới (drift): gọi từng khung hay một lần đều ra cùng dãy mốc; chạm hay thả thì đồng hồ 25 giây tính lại; đang giữ thì không bới', () => {
    const [stepwise, jump] = [createFlock(LAYOUT), createFlock(LAYOUT)];
    for (const f of [stepwise, jump]) f.scatter(10, [1, 1], 3);
    jump.drift(130);
    for (let t = 0; t <= 130; t += 1 / 60) stepwise.drift(t);
    stepwise.drift(130);
    expect(stepwise.marks()).toBe(jump.marks());
    expect(jump.marks()).toBe(6); // mốc đầu (nhúm), cú chạm lúc 10, rồi bới lúc 35, 60, 85, 110
    for (const t of [20, 36, 60.2, 61, 75.4, 100, 130]) expect(stepwise.state(t)).toEqual(jump.state(t));
    jump.drift(130); // gọi lại cùng t không thêm gì
    expect(jump.marks()).toBe(6);
    jump.scatter(131, [2, 2], 4); // chạm lúc 131 (sau "bây giờ" là 130): đồng hồ tính lại từ đây, lần bới kế tiếp ở 156
    jump.drift(155.9);
    expect(jump.marks()).toBe(7);
    jump.drift(156.1);
    expect(jump.marks()).toBe(8);
    const gripped = createFlock(NO_PILE);
    gripped.grip(5);
    gripped.drift(500);
    expect(gripped.marks()).toBe(2); // đang giữ: không bới
    gripped.release(500);
    gripped.drift(524.9);
    expect(gripped.marks()).toBe(3);
    gripped.drift(525.1);
    expect(gripped.marks()).toBe(4);
  });

  it('mở trang: nhúm 40 hạt nằm yên trước mặt mẹ; hai ba con đang mổ ngay từ đầu, lệch nhịp nhau, đứng cách nhau (poster chụp ở 2 giây có gà mổ)', () => {
    const flock = createFlock(LAYOUT);
    const [pile] = flock.takeScatters(0);
    expect(pile).toMatchObject({ count: FLOCK.pileHandful, still: true });
    expect(pile.at).toEqual(LAYOUT.pile);
    const eating = flock.state(0.5).eating;
    expect(eating).toBeGreaterThanOrEqual(2);
    expect(eating).toBeLessThanOrEqual(3);
    expect(flock.state(2).eating).toBe(eating);
    const eaters = flock.state(2).chicks.filter((c) => c.kind === 'peck');
    expect(new Set(eaters.map((c) => c.head.toFixed(2))).size, 'các con cúi đầu cùng lúc như máy').toBeGreaterThan(1);
    for (let t = 1; t < 7.5; t += 0.1) expect(closestEaters(flock.state(t)), `lúc ${t.toFixed(1)}`).toBeGreaterThanOrEqual(2 * FLOCK.spread * Math.sin(Math.PI / FLOCK.henResponders[1]) - 2 * FLOCK.hopRadius[1] - 1e-6);
  });

  it('đầu vào hỏng (thời điểm hay điểm rắc không hữu hạn, bố cục thiếu chỗ núp hay thiếu trường) thì ném lỗi tiếng Việt và không làm hỏng các mốc', () => {
    const flock = createFlock(NO_PILE);
    expect(() => flock.scatter(NaN, [0, 0], 1)).toThrow(/hữu hạn/);
    expect(() => flock.scatter(1, [Infinity, 0], 1)).toThrow(/hữu hạn/);
    expect(() => flock.scatter(1, [0], 1)).toThrow(/hữu hạn/);
    expect(() => flock.grip(Infinity)).toThrow(/hữu hạn/);
    expect(() => flock.release(NaN)).toThrow(/hữu hạn/);
    expect(() => flock.drift(NaN)).toThrow(/hữu hạn/);
    expect(flock.marks()).toBe(1);
    expect(finite(flock.state(3))).toBe(true);
    expect(() => createFlock({ ...LAYOUT, slots: LAYOUT.slots.slice(1) })).toThrow(/chỗ núp/);
    expect(() => createFlock({ ...LAYOUT, floor: undefined })).toThrow(/thiếu `floor`/);
    expect(() => createFlock({ ...LAYOUT, pile: undefined })).not.toThrow(); // không có nhúm lúc mở trang cũng được
  });
});
