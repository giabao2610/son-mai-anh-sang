// paintings/cung-que/parts/cot-cay-bay.js — cây đa bay (giữ) và rơi về (thả): độ cao tính thẳng từ thời gian theo các mốc giữ/thả, liên tục cả độ cao lẫn vận tốc; không import three.

/** Số của spec §19.5: lên tới 0,45; lò xo τ 0,3 s; g của trăng 0,162 đơn vị/s² (1,62 m/s²); nảy còn 0,3 lần vận tốc. */
export const LIFT = Object.freeze({ height: 0.45, tau: 0.3, gravity: 0.162, bounce: 0.3 });
/** Giữ tối đa chừng này mốc: độ cao chỉ phụ thuộc mốc cuối trước t, nên mốc rất cũ bỏ được. */
const KEEP = 32;

/**
 * @param {{ reduced?: boolean }} [o]  giảm chuyển động: τ gấp đôi, thời gian rơi gấp đôi (g chia 4)
 */
export function createLift({ reduced = false } = {}) {
  const slow = reduced ? 2 : 1;
  const tau = LIFT.tau * slow;
  const g = LIFT.gravity / (slow * slow);
  /** @type {{ t: number, kind: 'grip' | 'release', y: number, v: number }[]} */
  const marks = [];

  /**
   * Đang giữ: lò xo tắt dần tới hạn kéo về H. y = H + (A + B·s)·e^(−s/τ), với A = y0 − H, B = v0 + A/τ, nên y(0) = y0, y'(0) = v0:
   * không nhảy vận tốc ở mốc.
   */
  function rise(m, s) {
    const A = m.y - LIFT.height;
    const B = m.v + A / tau;
    const e = Math.exp(-s / tau);
    return { y: LIFT.height + (A + B * s) * e, v: (B - (A + B * s) / tau) * e };
  }

  /** Đã thả: rơi tự do từ (y0, v0); chạm 0 thì nảy một lần với vận tốc còn LIFT.bounce lần; rồi đứng yên. */
  function fall(m, s) {
    const hit = (m.v + Math.sqrt(m.v * m.v + 2 * g * Math.max(m.y, 0))) / g; // lúc chạm đất lần đầu
    if (s < hit) return { y: m.y + m.v * s - 0.5 * g * s * s, v: m.v - g * s };
    const up = LIFT.bounce * (g * hit - m.v); // tốc độ chạm đất × bounce
    const s2 = s - hit;
    if (s2 < (2 * up) / g) return { y: up * s2 - 0.5 * g * s2 * s2, v: up - g * s2 };
    return { y: 0, v: 0 };
  }

  function at(t) {
    let m = null;
    for (const k of marks) {
      if (k.t > t) break;
      m = k;
    }
    if (!m) return { y: 0, v: 0 };
    return m.kind === 'grip' ? rise(m, t - m.t) : fall(m, t - m.t);
  }

  const last = () => marks[marks.length - 1];
  function push(kind, t) {
    const tt = Math.max(t, last()?.t ?? t); // mốc không lùi
    marks.push({ t: tt, kind, ...at(tt) });
    if (marks.length > KEEP) marks.splice(0, marks.length - KEEP);
  }
  return {
    grip(t) {
      if (last()?.kind !== 'grip') push('grip', t); // đang giữ thì bỏ qua
    },
    release(t) {
      if (last()?.kind === 'grip') push('release', t); // chưa giữ thì bỏ qua
    },
    height: (t) => Math.max(at(t).y, 0),
    velocity: (t) => at(t).v,
  };
}
