// paintings/dan-ga-me-con/parts/dan-ga-pha.js — số của đàn gà (FLOCK) và các pha dạng đóng của một gà con (đứng chờ, chạy, mổ, nghỉ ở nhà, núp, đậu) nối thành kế hoạch; evaluate đọc trạng thái của kế hoạch lúc t; không import three.

/** Số của spec §20.5 (đơn vị cảnh 10 cm, giây, radian). */
export const FLOCK = Object.freeze({
  run: 9, // chạy tới chỗ rắc, chạy về chỗ núp (0,9 m/s)
  walk: 5, // đi bộ về nhà
  react: [0.1, 0.4], // phản xạ trước khi chạy
  peck: 8, // mổ quanh chỗ rắc chừng này giây
  spots: 3, // nhảy giữa ba chỗ gần nhau
  spread: 1, // các con chạy tới một nắm đứng trên vòng bán kính này quanh điểm rắc, cách đều nhau theo góc, nhìn vào tâm vòng: không chồng lên nhau, mỏ chạm sàn gần điểm rắc (cúi hẳn thì mỏ ở trước chân chừng 0,75)
  hopRadius: [0.1, 0.25], // ba chỗ mổ cách chỗ đứng chừng này: nhảy ngắn, nên hai con kề nhau trên vòng (4 con: cách 1,41) vẫn cách ≥ 0,9
  hop: 0.25, // nhảy sang chỗ mới mất chừng này giây
  bob: 2.5, // nhịp cúi đầu khi mổ (lần mỗi giây)
  turn: 0.3, // quay sang hướng mới mất chừng này giây
  wander: 0.3, // lượn quanh nhà khi rảnh: biên độ mỗi trục (bán kính tối đa wander · √2)
  peek: 0.5, // gà núp ngó nghiêng: hướng lắc ± chừng này quanh hướng ra ngoài (chỗ núp của bố cục chừa đủ chỗ cho cả biên độ này)
  perchSway: 0.3, // con trèo lưng và con nấp bụng lắc hướng ± chừng này
  responders: [3, 4], // số con chạy tới một nắm rắc tay
  henResponders: [2, 3], // số con xúm lại nhúm gà mẹ bới, và nhúm lúc mở trang
  recent: 20, // thả tay: nắm rắc mới nhất chưa tới chừng này giây thì các con tới đó
  auto: 25, // không ai chạm chừng này giây (kể từ mốc cuối) thì gà mẹ bới
  henHandful: 24,
  pileHandful: 40,
  scratch: 0.6, // gà mẹ cào chân 0,6 giây; thóc văng ở giữa nhịp
  wing: Math.PI / 3, // gà mẹ xòe cánh 60° khi giữ
  wingTau: 0.15, // lò xo tắt dần tới hạn của cánh
  cluck: 2, // gà mẹ gật đầu "cục cục" 2 lần mỗi giây khi giữ
  near: 2.2, // bán kính "quanh mẹ" (số đo quanhMe)
});

const TAU = Math.PI * 2;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const smoother = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * k * (k * (k * 6 - 15) + 10));
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** Hướng (như rotation.y của three: phía trước là (sin h, 0, cos h)) để từ a nhìn về b. */
export const facing = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
/** Quay từ hướng a sang hướng b theo đường ngắn nhất, phần k. */
const turn = (a, b, k) => a + (((((b - a) % TAU) + TAU + Math.PI) % TAU) - Math.PI) * k;

// ── Pha của một kế hoạch. Mọi pha có t0, t1 (Infinity: mở), h0 (hướng lúc vào pha), h1 (hướng muốn quay tới) và goal:
// 'home' (đi về nhà, ở nhà), 'food' (tới nắm thóc, mổ), 'hide' (núp mẹ), 'perch' (con trèo lưng, con nấp bụng: không bao giờ đổi).
export const stay = (at, t0, t1, h0, goal) => ({ kind: 'stay', at, t0, t1, h0, h1: h0, goal });
export const move = (from, to, t0, speed, h0, goal) => ({ kind: 'move', from, to, t0, t1: t0 + dist(from, to) / speed, h0, h1: facing(from, to), goal });
export const rest = (home, t0, h0, h1) => ({ kind: 'idle', at: home, t0, t1: Infinity, h0, h1, goal: 'home' });
export const hide = (slot, t0, h0, h1) => ({ kind: 'hide', at: slot, t0, t1: Infinity, h0, h1, goal: 'hide' });
export const perch = (home) => ({ kind: 'perch', at: home.at, t0: 0, t1: Infinity, h0: home.heading, h1: home.heading, goal: 'perch' });
/** Mổ quanh `center` (chỗ đứng): nhảy giữa ba chỗ gần đó, luôn nhìn về `look` (tâm nắm thóc), nên mỏ chạm sàn ở gần nắm thóc. */
export function peck(center, t0, h0, rand, look) {
  const spots = Array.from({ length: FLOCK.spots }, () => {
    const a = rand() * TAU;
    const r = FLOCK.hopRadius[0] + rand() * (FLOCK.hopRadius[1] - FLOCK.hopRadius[0]);
    return [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
  });
  return { kind: 'peck', at: center, spots, t0, t1: t0 + FLOCK.peck, h0, h1: facing(center, look), goal: 'food' };
}
/** Hướng lúc đứng ở chỗ mổ thứ j: về phía nắm thóc; j < 0 là hướng lúc vào pha (quay dần sang hướng ấy trong FLOCK.turn giây). */
const peckDir = (p, j) => (j < 0 ? p.h0 : p.h1);
/** Chỗ và hướng ở cuối một pha có hạn (để nối pha sau cho liền). */
export function endOf(p) {
  if (p.kind === 'move') return { at: p.to, h: p.h1 };
  if (p.kind === 'peck') return { at: p.spots[FLOCK.spots - 1], h: peckDir(p, FLOCK.spots - 1) };
  return { at: p.at, h: p.h1 };
}

/**
 * Trạng thái của một con theo kế hoạch lúc t: { at: [x, z], h, head (0 ngẩng … 1 mổ), pecking, goal, kind }. Mỗi pha bắt đầu đúng chỗ
 * pha trước dừng, nên vị trí liên tục; hướng vào pha mới quay dần trong FLOCK.turn giây. `index` là chỉ số của con (lệch pha lượn, rỉa).
 * @param {object[]} plan  các pha, t0 tăng dần
 * @param {number} t
 * @param {number} index
 */
export function evaluate(plan, t, index) {
  let p = plan[0];
  for (const q of plan) {
    if (q.t0 > t) break;
    p = q;
  }
  const s = Math.max(t - p.t0, 0);
  const ease = smooth(s / FLOCK.turn);
  const base = { goal: p.goal, kind: p.kind, head: 0, pecking: false };
  if (p.kind === 'move') {
    return { ...base, at: lerp2(p.from, p.to, smoother(s / Math.max(p.t1 - p.t0, 1e-6))), h: turn(p.h0, p.h1, ease) };
  }
  if (p.kind === 'peck') {
    const slot = (p.t1 - p.t0) / FLOCK.spots;
    const j = Math.min(Math.floor(s / slot), FLOCK.spots - 1);
    const u = s - j * slot;
    const at = lerp2(j === 0 ? p.at : p.spots[j - 1], p.spots[j], smooth(u / FLOCK.hop));
    const bob = u > FLOCK.hop ? 0.5 - 0.5 * Math.cos(TAU * FLOCK.bob * (u - FLOCK.hop)) : 0;
    return { ...base, at, h: turn(peckDir(p, j - 1), peckDir(p, j), smooth(u / FLOCK.turn)), head: bob, pecking: bob > 0.85 };
  }
  if (p.kind === 'idle') {
    // Lượn quanh nhà, ngó nghiêng, thỉnh thoảng cúi rỉa lông; tăng dần từ lúc tới nhà (ramp), nên vị trí liên tục.
    const ramp = smooth(s);
    const ph = index * 1.7;
    const at = [p.at[0] + FLOCK.wander * Math.sin(0.31 * t + ph) * ramp, p.at[1] + FLOCK.wander * Math.sin(0.23 * t + 2 * ph) * ramp];
    const head = 0.7 * Math.max(0, Math.sin((TAU * t) / (4 + (index % 3)) + ph)) ** 6 * ramp;
    return { ...base, at, h: turn(p.h0, p.h1, ease) + 0.4 * Math.sin(0.5 * t + ph) * ramp, head };
  }
  // Núp: quay ra ngoài (lưng về phía mẹ) rồi ngó nghiêng quanh hướng đó; đậu: lắc nhẹ; đứng chờ: giữ hướng.
  if (p.kind === 'hide') return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + FLOCK.peek * Math.sin(1.7 * t + index) * smooth(s / 0.5) };
  const sway = p.kind === 'perch' ? FLOCK.perchSway * Math.sin(0.4 * t + index) : 0;
  return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + sway };
}
