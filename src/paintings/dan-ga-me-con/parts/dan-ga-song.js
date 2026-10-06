// paintings/dan-ga-me-con/parts/dan-ga-song.js — đàn gà tính thẳng từ thời gian (dạng đóng) theo các mốc rắc, giữ, thả, bới: mười gà con (chỗ, hướng, cúi đầu, mỏ) và dáng gà mẹ (cánh, gật, ngoảnh, cào); không import three.
import { mulberry32 } from '../../../lib/random.js';
import { FLOCK, dist, endOf, evaluate, facing, hide, move, peck, perch, rest, stay } from './dan-ga-pha.js';

export { FLOCK };
/**
 * @typedef {{ x: number, y: number, z: number, heading: number, head: number, pecking: boolean, beak: [number, number, number],
 *   goal: 'home' | 'food' | 'hide' | 'perch', kind: string }} ChickState
 *   chỗ đứng, hướng (rad, như rotation.y của three), góc cúi đầu 0 (ngẩng) … 1 (mổ), "đang mổ" (mỏ ở đáy nhịp), đầu mỏ ở tọa độ thế
 *   giới, việc đang làm, và pha ('idle', 'stay', 'move', 'peck', 'hide', 'perch')
 * @typedef {{ chicks: ChickState[], hen: { wing: number, nod: number, look: number, scratch: number }, near: number, eating: number }} FlockState
 *   hen: cánh (rad), gật (0–1), ngoảnh (rad), cào chân (rad); near: số con cách tâm mẹ dưới FLOCK.near; eating: số con đang ở pha mổ
 */
/** Giữ tối đa chừng này mốc: mỗi mốc mang sẵn kế hoạch của từng con lúc đó, nên mốc cũ bỏ được (như cây bay của Bức 3). */
const KEEP = 32;
const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** Ném lỗi (tiếng Việt, cho lập trình viên) nếu thời điểm hay điểm không hữu hạn: NaN lọt vào mốc thì hỏng mọi trạng thái sau đó. */
function need(label, ...values) {
  if (!values.every(Number.isFinite)) throw new RangeError(`dan-ga-song: ${label} phải là số hữu hạn, nhận ${values.join(', ')}`);
}

/**
 * @param {{ homes: { at: [number, number], heading: number, kind: 'free'|'back'|'belly' }[], hen: [number, number],
 *   slots: [number, number][], pile: [number, number] | null, henFront: [number, number], beakTip: (k: number) => [number, number],
 *   back: number, floor: { x: [number, number], z: [number, number] } }} layout   bố cục (cot-bo-cuc.js#LAYOUT)
 * @param {{ reduced?: boolean }} [o]   giảm chuyển động: chạy và đi chậm còn một nửa, cánh mở chậm gấp đôi, gà mẹ không bới
 */
export function createFlock(layout, { reduced = false } = {}) {
  const speed = { run: FLOCK.run * (reduced ? 0.5 : 1), walk: FLOCK.walk * (reduced ? 0.5 : 1) };
  const { homes, hen } = layout;
  for (const key of ['homes', 'hen', 'slots', 'henFront', 'floor', 'beakTip', 'back']) {
    if (layout[key] === undefined) throw new Error(`dan-ga-song: bố cục thiếu \`${key}\` (cot-bo-cuc.js#LAYOUT)`);
  }
  const free = homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
  if (layout.slots.length < free.length) throw new Error(`dan-ga-song: ${free.length} gà con rảnh mà chỉ có ${layout.slots.length} chỗ núp`);
  /** Mốc theo thời gian: { t, kind, plans, wing: { y, v }, open, underGrip, …rắc: at, seed, count, still, fly, auto, taken }. */
  const marks = [];

  function homeward(i, from, t) {
    const home = homes[i].at;
    if (dist(from.at, home) < 1e-6) return [rest(home, t, from.h, homes[i].heading)];
    const go = move(from.at, home, t, speed.walk, from.h, 'home');
    return [go, rest(home, go.t1, go.h1, homes[i].heading)];
  }
  /**
   * Chạy tới chỗ đứng `target` quanh nắm thóc `look` (sau phản xạ), mổ FLOCK.peck giây nhìn về nắm, rồi về nhà. `already`: đang đứng ở
   * chỗ đó (nhúm lúc mở trang): vẫn chờ phản xạ, để các con bắt đầu mổ lệch nhịp nhau, không cúi đầu cùng lúc như máy.
   */
  function forage(i, from, t, target, look, rand, already = false) {
    const react = FLOCK.react[0] + rand() * (FLOCK.react[1] - FLOCK.react[0]);
    const phases = [stay(from.at, t, t + react, from.h, 'food')];
    let now = from;
    let t0 = t + react;
    if (!already) {
      const go = move(from.at, target, t0, speed.run, from.h, 'food');
      phases.push(go);
      now = endOf(go);
      t0 = go.t1;
    }
    const eat = peck(target, t0, now.h, rand, look);
    return [...phases, eat, ...homeward(i, endOf(eat), eat.t1)];
  }
  /** Chạy về chỗ núp (sau 0,1 s), rồi đứng quay ra ngoài, lưng về phía mẹ, đầu ngó nghiêng (FLOCK.peek). */
  function shelter(from, t, slot) {
    const wait = stay(from.at, t, t + 0.1, from.h, 'hide');
    const go = move(from.at, slot, wait.t1, speed.run, from.h, 'hide');
    return [wait, go, hide(slot, go.t1, go.h1, facing(hen, slot))];
  }
  /**
   * Tâm vòng đứng quanh một nắm thóc: điểm rắc kéo vào trong sàn (chừa cả vòng và bước nhảy), nên chạm sát mép thì gà con vẫn đứng trên
   * giấy, không con nào ra ngoài.
   */
  const ringCenter = (at) => {
    const pad = FLOCK.spread + FLOCK.hopRadius[1];
    return [clamp(at[0], layout.floor.x[0] + pad, layout.floor.x[1] - pad), clamp(at[1], layout.floor.z[0] + pad, layout.floor.z[1] - pad)];
  };
  /** Chỗ đứng quanh tâm `c` cho n con: trên vòng bán kính FLOCK.spread, cách đều nhau theo góc (hạt giống xoay cả vòng). */
  const ring = (c, n, rand) => {
    const base = rand() * TAU;
    return Array.from({ length: n }, (_, k) => [c[0] + Math.cos(base + (k * TAU) / n) * FLOCK.spread, c[1] + Math.sin(base + (k * TAU) / n) * FLOCK.spread]);
  };
  /** Mỗi con của `who` (theo thứ tự) lấy chỗ trống gần nó nhất trong `spots`; không hai con một chỗ. Trả chỗ của từng con, cùng thứ tự với `who`. */
  function claim(who, states, spots) {
    const taken = new Set();
    return who.map((i) => {
      let best = -1;
      spots.forEach((spot, k) => {
        if (!taken.has(k) && (best < 0 || dist(states[i].at, spot) < dist(states[i].at, spots[best]))) best = k;
      });
      taken.add(best);
      return spots[best];
    });
  }
  /** Các con `who` chạy tới nắm thóc `at`, mỗi con một chỗ trên vòng quanh nắm (nên không chồng lên nhau), thay kế hoạch trong `plans`. */
  function converge(plans, who, states, at, t, rand, already = false) {
    const c = ringCenter(at);
    const spots = claim(who, states, ring(c, who.length, rand));
    who.forEach((i, k) => {
      plans[i] = forage(i, already ? { at: spots[k], h: facing(spots[k], c) } : states[i], t, spots[k], c, rand, already);
    });
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

  /** Thêm một mốc lúc t (không lùi: mốc lùi xếp vào ngay sau mốc cuối); mỗi con nhận kế hoạch mới theo thứ tự ưu tiên của §20.5. */
  function push(kind, t, extra = {}) {
    need('thời điểm của mốc', t);
    const tt = Math.max(t, last().t);
    const prev = markAt(tt);
    const states = prev.plans.map((plan, i) => evaluate(plan, tt, i));
    const plans = [...prev.plans];
    const rand = mulberry32(Math.round(tt * 1000) * 31 + (extra.seed ?? 0) + 1);
    if (kind === 'grip') {
      // Núp (ưu tiên cao nhất): con gần mẹ chọn trước, mỗi con lấy chỗ trống gần nó nhất; không hai con một chỗ.
      const who = [...free].sort((a, b) => dist(states[a].at, hen) - dist(states[b].at, hen) || a - b);
      const spots = claim(who, states, layout.slots);
      who.forEach((i, k) => {
        plans[i] = shelter(states[i], tt, spots[k]);
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
    marks.push({ ...extra, t: tt, kind, plans, wing: wingAt(prev, tt), open, underGrip, taken: false });
    if (marks.length > KEEP) marks.splice(0, marks.length - KEEP);
  }

  // Mốc đầu, lúc 0: mọi con ở nhà. Có nhúm thóc lúc mở trang thì hai ba con gần nó đang đứng mổ sẵn (§20.2), và nhúm ấy là một nắm
  // nằm yên mà lớp Đàn gà rắc ở khung đầu.
  const plans0 = homes.map((h, i) => [h.kind === 'free' ? rest(h.at, 0, h.heading, h.heading) : perch(h)]);
  const first = { t: 0, kind: 'start', plans: plans0, wing: { y: 0, v: 0 }, open: 0, underGrip: false, taken: true };
  if (layout.pile) {
    const rand = mulberry32(17);
    const states = plans0.map((plan, i) => evaluate(plan, 0, i));
    converge(plans0, nearest(states, layout.pile, FLOCK.henResponders, rand), states, layout.pile, 0, rand, true);
    Object.assign(first, { kind: 'scatter', at: layout.pile, seed: 17, count: FLOCK.pileHandful, still: true, fly: 0, auto: false, taken: false });
  }
  marks.push(first);

  return {
    /** Chạm: một nắm thóc rơi ở `at` (x, z). count null: lớp dùng núm handful. */
    scatter(t, at, seed) {
      need('điểm rắc', at[0], at[1]);
      push('scatter', t, { at: [at[0], at[1]], seed, count: null, still: false, fly: t, auto: false });
    },
    grip(t) {
      need('thời điểm giữ', t);
      if (!last().underGrip) push('grip', t); // đang giữ thì bỏ qua
    },
    release(t) {
      need('thời điểm thả', t);
      if (last().underGrip) push('release', t); // chưa giữ thì bỏ qua
    },
    /** Gà mẹ bới: không ai chạm FLOCK.auto giây kể từ mốc cuối thì một nhúm trước mặt mẹ. Gọi mỗi khung; gọi lại cùng t không thêm gì. */
    drift(t) {
      need('thời điểm', t);
      if (reduced) return;
      for (;;) {
        const due = last().t + FLOCK.auto;
        if (last().underGrip || due > t) return;
        const seed = Math.round(due * 10);
        const jitter = mulberry32(seed);
        const at = [layout.henFront[0] + (jitter() - 0.5) * 0.6, layout.henFront[1] + (jitter() - 0.5) * 0.6];
        push('scatter', due, { at, seed, count: FLOCK.henHandful, still: false, fly: due + FLOCK.scratch / 2, auto: true });
      }
    },
    /**
     * Các nắm đã tới lúc văng (fly ≤ t) mà lớp chưa nhận, theo thứ tự; mỗi nắm giao đúng một lần. Lớp nhận mỗi khung: nắm chưa nhận mà
     * đã bị đẩy ra khỏi KEEP mốc gần nhất (hơn 31 cú chạm giữa hai lần nhận) thì mất.
     */
    takeScatters(t) {
      const out = marks.filter((m) => m.kind === 'scatter' && !m.taken && m.fly <= t);
      for (const m of out) m.taken = true;
      return out.map(({ at, seed, count, still }) => ({ at: [at[0], at[1]], seed, count, still }));
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
