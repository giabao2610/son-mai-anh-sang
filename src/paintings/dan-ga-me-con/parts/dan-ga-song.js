// paintings/dan-ga-me-con/parts/dan-ga-song.js — đàn gà tính thẳng từ thời gian (dạng đóng) theo các mốc rắc, giữ, thả, bới: mười gà con (chỗ, hướng, cúi đầu, mỏ) và dáng gà mẹ (cánh, gật, ngoảnh, cào); gà con tránh thân mẹ, không chồng nhau; không import three.
import { mulberry32 } from '../../../lib/random.js';
import { FLOCK, dist, evaluate, facing, perch, rest } from './dan-ga-pha.js';
import { createRouter } from './dan-ga-duong.js';
import { assign, createPlacer } from './dan-ga-cho.js';
import { createPlanner } from './dan-ga-ke.js';

export { FLOCK };
/**
 * @typedef {{ x: number, y: number, z: number, heading: number, head: number, pecking: boolean, beak: [number, number, number],
 *   goal: 'home' | 'food' | 'hide' | 'perch', kind: string }} ChickState
 *   chỗ đứng, hướng (rad, như rotation.y của three), góc cúi đầu 0 (ngẩng) … 1 (mổ), "đang mổ" (mỏ ở đáy nhịp), đầu mỏ ở tọa độ thế
 *   giới, việc đang làm, và pha ('idle', 'stay', 'move', 'peck', 'hide', 'perch')
 * @typedef {{ chicks: ChickState[], hen: { wing: number, nod: number, look: number, scratch: number }, near: number, eating: number }} FlockState
 *   hen: cánh (rad), gật (0–1), ngoảnh (rad), cào chân (rad); near: số con cách tâm mẹ dưới FLOCK.near; eating: số con đang ở pha mổ
 */
/**
 * Giữ tối đa chừng này mốc: mỗi mốc mang sẵn kế hoạch của từng con lúc đó, nên mốc cũ bỏ được (như cây bay của Bức 3). Sau khi bỏ, state(t)
 * với t sớm hơn mốc cũ nhất (marks[0].t) đọc kế hoạch của chính mốc ấy ở thời điểm t: mỗi pha còn ở trạng thái đầu của nó, đàn đứng yên
 * như lúc mốc ấy bắt đầu. Chỉ gặp khi hỏi một thời điểm đã cách quá 32 mốc.
 */
const KEEP = 32;
const TAU = Math.PI * 2;

/** Ném lỗi (tiếng Việt, cho lập trình viên) nếu thời điểm hay điểm không hữu hạn: NaN lọt vào mốc thì hỏng mọi trạng thái sau đó. */
function need(label, ...values) {
  if (!values.every(Number.isFinite)) throw new RangeError(`dan-ga-song: ${label} phải là số hữu hạn, nhận ${values.join(', ')}`);
}

/**
 * @param {{ homes: { at: [number, number], heading: number, kind: 'free'|'back'|'belly' }[], hen: [number, number],
 *   slots: [number, number][], pile: [number, number] | null, henFront: [number, number], beakTip: (k: number) => [number, number],
 *   back: number, floor: { x: [number, number], z: [number, number] },
 *   body: { a: [number, number], b: [number, number], r: number } }} layout   bố cục (cot-bo-cuc.js#LAYOUT)
 * @param {{ reduced?: boolean }} [o]   giảm chuyển động: chạy và đi chậm còn một nửa, cánh mở chậm gấp đôi, gà mẹ không bới
 */
export function createFlock(layout, { reduced = false } = {}) {
  const speed = { run: FLOCK.run * (reduced ? 0.5 : 1), walk: FLOCK.walk * (reduced ? 0.5 : 1) };
  for (const key of ['homes', 'hen', 'slots', 'henFront', 'floor', 'beakTip', 'back', 'body']) {
    if (layout[key] === undefined) throw new Error(`dan-ga-song: bố cục thiếu \`${key}\` (cot-bo-cuc.js#LAYOUT)`);
  }
  const { homes, hen } = layout;
  const free = homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
  if (layout.slots.length < free.length) throw new Error(`dan-ga-song: ${free.length} gà con rảnh mà chỉ có ${layout.slots.length} chỗ núp`);
  const router = createRouter(layout.body, layout.body.r + FLOCK.clear, FLOCK.standOff);
  const placer = createPlacer(layout, router);
  const { homeward, approach, forage, shelter } = createPlanner({ homes, hen, speed }, router);
  /** Mốc theo thời gian: { t, kind, plans, wing: { y, v }, open, underGrip, …rắc: at, seed, count, still, fly, auto, taken }. */
  const marks = [];
  /** "Bây giờ": thời điểm lớn nhất mà mọi hàm ghi (scatter, grip, release, drift) đã nhận. Mốc lùi xếp vào đây, không lùi hơn (xem push). */
  let clock = 0;

  /**
   * Chỗ đứng của các con khác: con đang mổ hay sắp tới một nắm thì chỗ mổ, còn lại chỗ đang đứng (nhà, con nấp bụng…); và nhà của mọi con
   * rảnh đang đi vắng hay đang về (việc 'food', 'home'), vì xong việc nó về đứng ở đó, có khi lúc con khác còn đang mổ.
   */
  const occupiedBy = (who, states, plans) => states.flatMap((s, j) => {
    if (who.includes(j)) return [];
    const eat = s.goal === 'food' ? plans[j].find((p) => p.kind === 'peck') : null;
    const away = homes[j].kind === 'free' && (s.goal === 'food' || s.goal === 'home');
    return [eat ? eat.at : s.at, ...(away ? [homes[j].at] : [])];
  });
  /**
   * Chỗ thóc rơi của một điểm chạm: dời ra bên cạnh mẹ nếu sát mẹ, rồi kéo vào trong sàn đúng như tâm vòng các con đứng quanh. Thóc rơi
   * đúng giữa vòng, nên mỏ của các con (với tới trước chân chừng 0,75 trên vòng bán kính 1) chạm sàn ngay trên nắm thóc, kể cả khi chạm sát mép.
   */
  const dropAt = (g) => placer.ringCenter(placer.awayFromHen([g[0], g[1]]));
  /**
   * Các con `who` (gần nắm nhất trước) chạy tới nắm thóc `at`, mỗi con một chỗ trên vòng quanh nắm (không chồng nhau, không chồng các con
   * khác, ngoài vòng cấm quanh mẹ), gán sao cho tổng quãng đường ngắn nhất; thay kế hoạch trong `plans`. Có ít chỗ hợp lệ hơn con thì các
   * con xa nắm nhất ở yên.
   */
  function converge(plans, who, states, at, t, rand, already = false) {
    const c = placer.ringCenter(at);
    const spots = placer.ringSpots(c, who.length, rand, occupiedBy(who, states, plans));
    const crew = who.slice(0, spots.length);
    const jys = crew.map((i) => spots.map((s) => (already ? null : router.journey(states[i].at, s))));
    const pick = assign(crew.map((i, a) => spots.map((s, k) => (already ? dist(states[i].at, s) : router.length(jys[a][k])))));
    const goes = crew.map((i, a) => {
      const spot = spots[pick[a]];
      const from = already ? { at: spot, h: facing(spot, c), head: 0 } : states[i];
      return approach(from, t, jys[a][pick[a]], spot, c, rand, already);
    });
    // Cả nhóm thôi mổ cùng lúc: con tới sau cùng mổ đủ FLOCK.peck giây.
    const until = Math.max(...goes.map((go) => go.at)) + FLOCK.peck;
    crew.forEach((i, a) => { plans[i] = forage(i, goes[a], rand, until); });
  }
  /** Các con rảnh hay đang về, gần `at` nhất; số con theo hạt giống trong [lo, hi]. */
  function nearest(states, at, [lo, hi], rand) {
    const n = lo + Math.floor(rand() * (hi - lo + 1));
    return free.filter((i) => states[i].goal === 'home')
      .sort((a, b) => dist(states[a].at, at) - dist(states[b].at, at) || a - b)
      .slice(0, n);
  }

  const last = () => marks[marks.length - 1];
  function markAt(t) {
    let m = marks[0];
    for (const k of marks) {
      if (k.t > t) break;
      m = k;
    }
    return m;
  }
  /** Cánh mẹ: lò xo tắt dần tới hạn từ (y, v) lúc mốc về đích `open`, như cây bay của Bức 3: không nhảy vận tốc ở mốc. */
  function wingAt(m, t) {
    const tau = FLOCK.wingTau * (reduced ? 2 : 1);
    const s = Math.max(t - m.t, 0);
    const A = m.wing.y - m.open;
    const B = m.wing.v + A / tau;
    const e = Math.exp(-s / tau);
    return { y: m.open + (A + B * s) * e, v: (B - (A + B * s) / tau) * e };
  }

  /**
   * Thêm một mốc lúc t (không lùi hơn mốc cuối); mỗi con nhận kế hoạch mới theo thứ tự ưu tiên của §20.5. Người gọi đã kẹp t vào "bây giờ"
   * (clock) nên mốc lùi không viết lại các khung đã vẽ: kế hoạch mới bắt đầu từ chỗ đàn đang đứng ở t.
   */
  function push(kind, t, extra = {}) {
    need('thời điểm của mốc', t);
    const tt = Math.max(t, last().t);
    const prev = markAt(tt);
    const states = prev.plans.map((plan, i) => evaluate(plan, tt, i));
    const plans = [...prev.plans];
    const rand = mulberry32(Math.round(tt * 1000) * 31 + (extra.seed ?? 0) + 1);
    if (kind === 'grip') {
      // Núp (ưu tiên cao nhất): gán tám con vào tám chỗ sao cho tổng quãng đường ngắn nhất, nên con nào cũng về chỗ phía mình trước.
      const jys = free.map((i) => layout.slots.map((slot) => router.journey(states[i].at, slot)));
      const pick = assign(jys.map((row) => row.map(router.length)));
      free.forEach((i, a) => {
        plans[i] = shelter(states[i], tt, layout.slots[pick[a]], jys[a][pick[a]]);
      });
    } else if (kind === 'release') {
      for (const i of free) plans[i] = homeward(i, states[i], tt);
      const recent = [...marks].reverse().find((m) => m.kind === 'scatter' && tt - m.t < FLOCK.recent);
      if (recent) {
        const now = plans.map((plan, i) => evaluate(plan, tt, i));
        converge(plans, nearest(now, recent.at, FLOCK.responders, rand), now, recent.at, tt, rand);
      }
    } else if (kind === 'scatter' && !prev.underGrip) {
      const group = extra.auto ? FLOCK.henResponders : FLOCK.responders;
      converge(plans, nearest(states, extra.at, group, rand), states, extra.at, tt, rand);
    }
    const open = kind === 'grip' ? FLOCK.wing : kind === 'release' ? 0 : prev.open;
    // Rắc trong lúc giữ không làm mất trạng thái "đang giữ": grip, release, drift hỏi underGrip của mốc cuối, không hỏi loại mốc.
    const underGrip = kind === 'grip' || (kind === 'scatter' && prev.underGrip);
    const { delay = 0, ...rest0 } = extra;
    marks.push({ ...rest0, t: tt, kind, plans, wing: wingAt(prev, tt), open, underGrip, fly: tt + delay, taken: false });
    if (marks.length > KEEP) marks.splice(0, marks.length - KEEP);
  }

  // Mốc đầu, lúc 0: mọi con ở nhà. Có nhúm thóc lúc mở trang thì hai ba con gần nó đang đứng mổ sẵn (§20.2), và nhúm ấy là một nắm
  // nằm yên mà lớp Đàn gà rắc ở khung đầu.
  const plans0 = homes.map((h, i) => [h.kind === 'free' ? rest(h.at, 0, { h: h.heading, head: 0 }, h.heading) : perch(h)]);
  const first = { t: 0, kind: 'start', plans: plans0, wing: { y: 0, v: 0 }, open: 0, underGrip: false, taken: true };
  if (layout.pile) {
    const rand = mulberry32(17);
    const states = plans0.map((plan, i) => evaluate(plan, 0, i));
    const at = dropAt(layout.pile);
    converge(plans0, nearest(states, at, FLOCK.henResponders, rand), states, at, 0, rand, true);
    Object.assign(first, { kind: 'scatter', at, seed: 17, count: FLOCK.pileHandful, still: true, fly: 0, auto: false, taken: false });
  }
  marks.push(first);

  return {
    /**
     * Chạm: một nắm thóc rơi ở `at` (x, z); gần hay trúng thân mẹ thì rơi bên cạnh mẹ, sát mép sàn thì rơi vào trong một chút (dropAt;
     * takeScatters trả điểm đã dời). count null: lớp dùng núm handful.
     */
    scatter(t, at, seed) {
      need('điểm rắc', at[0], at[1]);
      need('thời điểm rắc', t);
      const since = clock;
      clock = Math.max(clock, t);
      push('scatter', Math.max(t, since), { at: dropAt(at), seed, count: null, still: false, auto: false });
    },
    grip(t) {
      need('thời điểm giữ', t);
      const since = clock;
      clock = Math.max(clock, t);
      if (!last().underGrip) push('grip', Math.max(t, since)); // đang giữ thì bỏ qua
    },
    release(t) {
      need('thời điểm thả', t);
      const since = clock;
      clock = Math.max(clock, t);
      if (last().underGrip) push('release', Math.max(t, since)); // chưa giữ thì bỏ qua
    },
    /**
     * Gà mẹ bới: không ai chạm FLOCK.auto giây kể từ mốc cuối thì một nhúm trước mặt mẹ. Hợp đồng gọi: mỗi khung, một lần, TRƯỚC cử chỉ và
     * trước state(t): lúc đó `clock` là "bây giờ", nên một mốc lùi (scatter, grip, release với t cũ) xếp vào đúng lúc này, không viết lại
     * khung đã vẽ. Gọi lại cùng t không thêm gì; gọi một lần với t lớn hay từng khung ra cùng dãy mốc.
     */
    drift(t) {
      need('thời điểm', t);
      const since = clock;
      clock = Math.max(clock, t);
      if (reduced) return;
      for (;;) {
        const due = last().t + FLOCK.auto;
        if (last().underGrip || due > t) return;
        const tt = Math.max(due, since); // mốc không xếp vào khung đã vẽ (trước lần gọi này)
        const seed = Math.round(tt * 10);
        const jitter = mulberry32(seed);
        const at = [layout.henFront[0] + (jitter() - 0.5) * 0.6, layout.henFront[1] + (jitter() - 0.5) * 0.6];
        push('scatter', tt, { at: dropAt(at), seed, count: FLOCK.henHandful, still: false, delay: FLOCK.scratch / 2, auto: true });
      }
    },
    /**
     * Các nắm đã tới lúc văng (fly ≤ t) mà lớp chưa nhận, theo thứ tự; mỗi nắm giao đúng một lần. Lớp nhận mỗi khung: nắm chưa nhận mà
     * đã bị đẩy ra khỏi KEEP mốc gần nhất (hơn 31 cú chạm giữa hai lần nhận) thì mất. `auto`: nhúm gà mẹ bới (lớp rắc thấp hơn nắm rắc tay).
     */
    takeScatters(t) {
      const out = marks.filter((m) => m.kind === 'scatter' && !m.taken && m.fly <= t);
      for (const m of out) m.taken = true;
      return out.map(({ at, seed, count, still, auto }) => ({ at: [at[0], at[1]], seed, count, still, auto }));
    },
    /**
     * Cả đàn lúc t: gọi bao nhiêu lần, theo thứ tự nào, cũng ra cùng một số (chỉ đọc các mốc).
     * @returns {FlockState}
     */
    state(t) {
      const m = markAt(t);
      const chicks = m.plans.map((plan, i) => {
        const s = evaluate(plan, t, i);
        const y = homes[i].kind === 'back' ? layout.back : 0;
        const [forward, up] = layout.beakTip(s.head);
        const beak = [s.at[0] + Math.sin(s.h) * forward, y + up, s.at[1] + Math.cos(s.h) * forward];
        return { x: s.at[0], y, z: s.at[1], heading: s.h, head: s.head, pecking: s.pecking, beak, goal: s.goal, kind: s.kind };
      });
      const wing = Math.max(wingAt(m, t).y, 0);
      const scratch = marks.reduce((sum, k) => sum + (k.auto && t >= k.t && t <= k.t + FLOCK.scratch
        ? Math.sin((Math.PI * (t - k.t)) / FLOCK.scratch) : 0), 0);
      return {
        chicks,
        hen: {
          wing,
          nod: (wing / FLOCK.wing) * (0.5 - 0.5 * Math.cos(TAU * FLOCK.cluck * t)), // gật khi cánh mở: thả là thôi gật, không giật
          look: 0.25 * Math.sin((TAU * t) / 7), // ngoảnh chậm
          scratch: 0.7 * scratch,
        },
        near: chicks.filter((c) => dist([c.x, c.z], hen) < FLOCK.near).length,
        eating: chicks.filter((c) => c.kind === 'peck').length,
      };
    },
    /** Số mốc đang giữ (tối đa KEEP). */
    marks: () => marks.length,
  };
}
