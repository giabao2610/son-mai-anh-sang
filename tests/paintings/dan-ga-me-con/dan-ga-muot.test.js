// tests/paintings/dan-ga-me-con/dan-ga-muot.test.js — đàn gà chuyển động mượt ở mọi mối nối (spec §20.5), đo từng khung 60 Hz qua cử chỉ rắc, giữ, thả, giữ lại: hướng, độ cúi đầu và vị trí không nhảy; chuyến ngắn hơn FLOCK.turn không làm hướng giật lúc tới nơi; đầu đang cúi tắt dần chứ không rơi về 0 ở mốc.
import { describe, it, expect } from 'vitest';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { FLOOR, LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { mulberry32 } from '../../../src/lib/random.js';

const DT = 1 / 60;
/** Test nặng (từng khung 60 Hz, nhiều cảnh): chừa thời gian cho máy chạy chậm hay đang bận (CI chạy cả trăm file song song). */
const SLOW = 60000;
/** Hướng quay nhanh nhất hợp lệ: quay nửa vòng trong FLOCK.turn giây theo smoothstep (đạo hàm lớn nhất 1,5 π / turn), cộng chút lắc ngó nghiêng. */
const MAX_TURN = (1.5 * Math.PI * DT) / FLOCK.turn + 0.03;
/** Đầu đổi nhanh nhất hợp lệ: nhịp cúi khi mổ (biên độ 1/2, tần số bob) là 0,5 · 2π · bob mỗi giây. */
const MAX_HEAD = Math.PI * FLOCK.bob * DT + 0.02;
/** Bước nhanh nhất mỗi khung: tốc độ đỉnh của smootherstep là 1,875 lần tốc độ trung bình. */
const MAX_STEP = 1.875 * FLOCK.run * DT * 1.05;
const angleDiff = (a, b) => ((((a - b) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
const randomIn = (rand, [x0, x1], [z0, z1]) => [x0 + rand() * (x1 - x0), z0 + rand() * (z1 - z0)];

/** Chạy một cảnh 60 Hz (drift trước cử chỉ như update), trả mức nhảy lớn nhất mỗi khung của hướng, đầu, vị trí và nơi xảy ra. */
function worst(events, { reduced = false, seconds = 30, layout = LAYOUT } = {}) {
  const flock = createFlock(layout, { reduced });
  const out = { heading: { v: 0, at: '' }, head: { v: 0, at: '' }, step: { v: 0, at: '' } };
  let prev = flock.state(0);
  let e = 0;
  const note = (key, v, tag) => { if (v > out[key].v) out[key] = { v, at: tag }; };
  for (let k = 1; k <= seconds * 60; k += 1) {
    const t = k * DT;
    flock.drift(t);
    while (e < events.length && events[e][0] <= t) {
      const [when, kind, at] = events[e]; // when có thể cũ hơn khung hiện tại (mốc lùi): xếp vào "bây giờ", không viết lại khung đã vẽ
      e += 1;
      if (kind === 'scatter') flock.scatter(when, at, k);
      else if (kind === 'grip') flock.grip(when);
      else flock.release(when);
    }
    const st = flock.state(t);
    st.chicks.forEach((c, i) => {
      const p = prev.chicks[i];
      const tag = `con ${i} ${p.kind}→${c.kind} lúc ${t.toFixed(3)}`;
      note('heading', Math.abs(angleDiff(c.heading, p.heading)), tag);
      note('head', Math.abs(c.head - p.head), tag);
      note('step', Math.hypot(c.x - p.x, c.z - p.z), tag);
    });
    prev = st;
  }
  return out;
}
const expectSmooth = (w, label) => {
  expect(w.heading.v, `${label}: hướng nhảy (${w.heading.at})`).toBeLessThanOrEqual(MAX_TURN);
  expect(w.head.v, `${label}: đầu nhảy (${w.head.at})`).toBeLessThanOrEqual(MAX_HEAD);
  expect(w.step.v, `${label}: vị trí nhảy (${w.step.at})`).toBeLessThanOrEqual(MAX_STEP);
};

describe('dan-ga-muot', () => {
  it('rắc: các con chạy tới vòng quanh nắm (cả nắm sau lưng mẹ, nắm sát mẹ) không nhảy hướng, đầu, vị trí ở mối nối nào, kể cả lúc về nhà', () => {
    expectSmooth(worst([[1, 'scatter', [-4.5, 2.5]], [2.5, 'scatter', [4, -1]], [3, 'scatter', [0, -2.7]], [4, 'scatter', [-2.5, 0.2]]]), 'rắc');
  }, SLOW);

  it('chuyến chạy ngắn hơn FLOCK.turn (chạm ngay cạnh nhà một con, chạm sát chỗ đang đứng): hướng vẫn không giật khi tới vòng', () => {
    const near = LAYOUT.homes.filter((h) => h.kind === 'free').map((h) => [1, 'scatter', [h.at[0] + 0.3, h.at[1] + 0.3]]);
    for (const [k, ev] of near.entries()) expectSmooth(worst([ev], { seconds: 14 }), `chạm cạnh nhà ${k}`);
  }, SLOW);

  it('giữ, thả, giữ lại ngay (sau 0,05 / 0,2 / 0,4 / 0,8 giây), kể cả giảm chuyển động: hướng không giật (lỗi cũ: 162° trong một khung)', () => {
    for (const gap of [0.05, 0.2, 0.4, 0.8]) {
      const events = [[2, 'grip'], [6, 'release'], [6 + gap, 'grip'], [9 + gap, 'release']];
      expectSmooth(worst(events), `giữ lại sau ${gap} s`);
      expectSmooth(worst(events, { reduced: true, seconds: 45 }), `giữ lại sau ${gap} s, giảm chuyển động`);
    }
  }, SLOW);

  it('giữ lúc con đang chờ phản xạ, chạy, mổ; thả rồi rắc trong lúc giữ: không nhảy; rắc rồi thả lúc các con đang về', () => {
    const tap = [-4.5, 2.5];
    for (const at of [1.2, 1.5, 3, 6]) expectSmooth(worst([[1, 'scatter', tap], [at, 'grip'], [at + 4, 'release']]), `giữ lúc ${at}`);
    expectSmooth(worst([[2, 'grip'], [3, 'scatter', [5, 3]], [5, 'release']]), 'rắc trong lúc giữ rồi thả (con tới nắm mới nhất)');
  }, SLOW);

  it('mở trang (nhúm có gà mổ sẵn) và gà mẹ bới: không nhảy', () => {
    expectSmooth(worst([], { seconds: 70 }), 'mở trang và hai lần mẹ bới');
  }, SLOW);

  it('bão ngẫu nhiên (8 cảnh × 50 giây, cả mốc lùi): không nhảy hướng, đầu, vị trí ở bất kỳ khung nào', () => {
    for (let n = 0; n < 8; n += 1) {
      const rand = mulberry32(n + 40);
      let t = 0;
      const events = Array.from({ length: 24 }, () => {
        t += rand() * 2;
        const r = rand();
        return [r < 0.1 ? Math.max(t - 3, 0) : t, r < 0.55 ? 'scatter' : r < 0.8 ? 'grip' : 'release', randomIn(rand, FLOOR.x, FLOOR.z)];
      }).sort((x, y) => x[0] - y[0]);
      expectSmooth(worst(events, { seconds: 50, reduced: n % 3 === 2 }), `bão ${n}`);
    }
  }, SLOW);

  it('đầu đang cúi tắt dần ở mốc, không rơi về 0 trong một khung: giữ lúc con đang mổ thì sau một khung đầu còn gần như nguyên, sau nửa giây thì ngẩng', () => {
    const flock = createFlock({ ...LAYOUT, pile: null });
    flock.scatter(5, [-4.5, 2.5], 7);
    let tg = 0;
    let who = -1;
    for (let t = 8; t < 10 && who < 0; t += 1 / 240) {
      const c = flock.state(t).chicks.findIndex((x) => x.head > 0.9);
      if (c >= 0) { who = c; tg = t; }
    }
    expect(who, 'không con nào đang cúi hẳn').toBeGreaterThanOrEqual(0);
    const before = flock.state(tg).chicks[who].head;
    flock.drift(tg);
    flock.grip(tg);
    expect(flock.state(tg + DT).chicks[who].head).toBeGreaterThan(before - MAX_HEAD);
    expect(flock.state(tg + 0.5).chicks[who].head).toBeLessThan(0.02);
  }, SLOW);
});
