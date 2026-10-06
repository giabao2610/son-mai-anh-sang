// paintings/dan-ga-me-con/parts/dan-ga-pha.js — số của đàn gà (FLOCK) và các pha dạng đóng của một gà con (đứng chờ hay quay tại chỗ, chạy theo đường gấp khúc, mổ, nghỉ ở nhà, núp, đậu) nối thành kế hoạch; phaseState đọc một pha lúc t, evaluate đọc cả kế hoạch; vị trí, hướng và độ cúi đầu liên tục ở mọi mối nối; không import three.

/** Số của spec §20.5 (đơn vị cảnh 10 cm, giây, radian). */
export const FLOCK = Object.freeze({
  run: 9, // chạy tới chỗ rắc, chạy về chỗ núp (0,9 m/s)
  walk: 5, // đi bộ về nhà, ra vào chỗ núp
  react: [0.1, 0.4], // phản xạ trước khi chạy
  peck: 8, // mổ quanh chỗ rắc chừng này giây
  spots: 3, // nhảy giữa ba chỗ gần nhau
  spread: 1, // các con chạy tới một nắm đứng trên vòng bán kính này quanh điểm rắc, cách đều nhau theo góc, nhìn vào tâm vòng: không chồng lên nhau, mỏ chạm sàn gần điểm rắc (cúi hẳn thì mỏ ở trước chân chừng 0,75)
  hopRadius: [0.1, 0.25], // ba chỗ mổ cách chỗ đứng chừng này: nhảy ngắn, nên hai con kề nhau trên vòng (4 con: cách 1,41) vẫn cách ≥ 0,9
  hopCone: Math.PI / 3, // và lệch tối đa chừng này khỏi hướng từ tâm nắm ra chỗ đứng: nhảy vào trong thì đầu hai con cạnh nhau đâm vào nhau
  gap: 1.4, // chỗ đứng của hai con khác nhau (nắm khác nhau, con đang nghỉ, con nấp bụng) cách nhau từ chừng này: cộng hai bước nhảy thì mình không chồng nhau
  hop: 0.25, // nhảy sang chỗ mới mất chừng này giây
  bob: 2.5, // nhịp cúi đầu khi mổ (lần mỗi giây)
  turn: 0.3, // quay sang hướng mới mất chừng này giây (mọi lần quay, kể cả ở góc đường)
  headEase: 0.25, // độ cúi đầu của pha trước tắt dần trong chừng này giây: đầu không giật ở mối nối
  wander: 0.3, // lượn quanh nhà khi rảnh: biên độ mỗi trục (bán kính tối đa wander · √2)
  peek: 0.5, // gà núp ngó nghiêng: hướng lắc ± chừng này quanh hướng ra ngoài (chỗ núp của bố cục chừa đủ chỗ cho cả biên độ này)
  perchSway: 0.3, // con trèo lưng và con nấp bụng lắc hướng ± chừng này
  clear: 0.65, // gà con đứng thẳng, hướng nào, cách xương sống của mẹ từ 1,2 (nửa bề ngang) + chừng này thì không lún vào mẹ (đo bằng chỗ thật của khối)
  standOff: 0.35, // chỗ dừng trước chỗ núp: cách vòng cấm chừng này; tới đó quay hẳn ra ngoài rồi lùi vào
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
  nod: 0.4, // gật sâu nhất chừng này (rad, 23°): gật 1 rad thì đầu và con ong của mẹ chạm xuống gà con núp trước ngực (đo bằng chỗ thật của khối)
  near: 2.2, // bán kính "quanh mẹ" (số đo quanhMe)
});

const TAU = Math.PI * 2;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const smoother = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * k * (k * (k * 6 - 15) + 10));
/** Nghịch đảo của smoother trên [0, 1] (chia đôi): lúc nào con đi hết quãng đường f, để đường gấp khúc biết lúc nào tới mỗi góc. */
const unsmoother = (f) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (smoother(mid) < f) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** Hướng (như rotation.y của three: phía trước là (sin h, 0, cos h)) để từ a nhìn về b. */
export const facing = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
/** Quay từ hướng a sang hướng b theo đường ngắn nhất, phần k. */
const turn = (a, b, k) => a + (((((b - a) % TAU) + TAU + Math.PI) % TAU) - Math.PI) * k;

// ── Pha của một kế hoạch. Mọi pha có t0, t1 (Infinity: mở), h0 (hướng lúc vào pha), head0 (độ cúi đầu lúc vào pha, tắt dần) và goal:
// 'home' (đi về nhà, ở nhà), 'food' (tới nắm thóc, mổ), 'hide' (núp mẹ), 'perch' (con trèo lưng, con nấp bụng: không bao giờ đổi).
// `from` là trạng thái lúc vào pha { at, h, head } (kết quả của evaluate hay endOf), nên hướng và đầu nối liền với pha trước.
/** Đứng chờ; h1 khác from.h thì quay tại chỗ trong FLOCK.turn giây. */
export const stay = (from, t0, t1, goal, h1 = from.h) => ({ kind: 'stay', at: from.at, t0, t1, h0: from.h, h1, goal, head0: from.head ?? 0 });
/**
 * Chạy theo đường gấp khúc pts (đầu pts là chỗ đang đứng), tốc độ trung bình `speed`, tăng giảm tốc (smootherstep) trên cả đường: một đoạn
 * thì dừng ở góc không xảy ra. Hướng theo đoạn đang đi, quay dần FLOCK.turn giây sau mỗi góc; `face` khác null thì giữ hướng ấy suốt chuyến
 * (lùi vào chỗ núp, mặt vẫn ra ngoài).
 */
export function move(pts, t0, speed, from, goal, face = null) {
  const way = [pts[0]];
  for (let k = 1; k < pts.length; k += 1) if (dist(pts[k], way[way.length - 1]) > 1e-6) way.push(pts[k]);
  const cum = [0];
  for (let k = 1; k < way.length; k += 1) cum.push(cum[k - 1] + dist(way[k - 1], way[k]));
  const len = cum[cum.length - 1];
  const t1 = t0 + len / speed;
  const dirs = way.slice(1).map((p, k) => facing(way[k], p));
  const crossings = cum.map((c) => t0 + (t1 - t0) * unsmoother(len > 0 ? c / len : 0)); // lúc tới mỗi đỉnh
  return { kind: 'move', pts: way, cum, len, dirs, crossings, face, t0, t1, h0: from.h, goal, head0: from.head ?? 0 };
}
export const rest = (home, t0, from, h1) => ({ kind: 'idle', at: home, t0, t1: Infinity, h0: from.h, h1, goal: 'home', head0: from.head ?? 0 });
export const hide = (slot, t0, from, h1) => ({ kind: 'hide', at: slot, t0, t1: Infinity, h0: from.h, h1, goal: 'hide', head0: from.head ?? 0 });
export const perch = (home) => ({ kind: 'perch', at: home.at, t0: 0, t1: Infinity, h0: home.heading, h1: home.heading, goal: 'perch', head0: 0 });
/**
 * Mổ quanh `center` (chỗ đứng) từ t0 tới t1: nhảy giữa ba chỗ gần đó, luôn nhìn về `look` (tâm nắm thóc), nên mỏ chạm sàn ở gần nắm thóc.
 * Chỗ nhảy ở phía ngoài vòng (trong ±FLOCK.hopCone quanh hướng từ tâm nắm ra chỗ đứng): mỏ các con cùng chụm về tâm nắm, nên nhảy vào
 * trong thì đầu hai con cạnh nhau (bán kính 0,3) đâm vào nhau. t1 mặc định FLOCK.peck giây sau t0; các con cùng một nắm thì chung một t1
 * (dan-ga-ke.js#forage).
 */
export function peck(center, t0, from, rand, look, t1 = t0 + FLOCK.peck) {
  const out = Math.atan2(center[1] - look[1], center[0] - look[0]); // góc của hướng từ tâm nắm ra chỗ đứng (trên mặt sàn x, z)
  const spots = Array.from({ length: FLOCK.spots }, () => {
    const a = out + (rand() * 2 - 1) * FLOCK.hopCone;
    const r = FLOCK.hopRadius[0] + rand() * (FLOCK.hopRadius[1] - FLOCK.hopRadius[0]);
    return [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
  });
  return { kind: 'peck', at: center, spots, t0, t1, h0: from.h, h1: facing(center, look), goal: 'food', head0: from.head ?? 0 };
}
/** Hướng lúc đứng ở chỗ mổ thứ j: về phía nắm thóc; j < 0 là hướng lúc vào pha (quay dần sang hướng ấy trong FLOCK.turn giây). */
const peckDir = (p, j) => (j < 0 ? p.h0 : p.h1);

/** Hướng lúc t khi đang ở đoạn k của đường gấp khúc: quay dần tới hướng đoạn từ hướng lúc tới đỉnh k (đệ quy, tối đa vài đoạn). */
function legHeading(p, k, t) {
  const start = k === 0 ? p.t0 : p.crossings[k];
  const before = k === 0 ? p.h0 : legHeading(p, k - 1, start);
  return turn(before, p.dirs[k], smooth((t - start) / FLOCK.turn));
}

/**
 * Trạng thái của một con ở pha p lúc t: { at: [x, z], h, head (0 ngẩng … 1 mổ), pecking, goal, kind }. `index` là chỉ số của con (lệch pha
 * lượn, rỉa). Vị trí, hướng, đầu đều bắt đầu đúng giá trị lúc vào pha (from của constructor), nên nối pha nào cũng liền.
 */
export function phaseState(p, t, index) {
  const s = Math.max(t - p.t0, 0);
  const ease = smooth(s / FLOCK.turn);
  const carry = p.head0 * (1 - smooth(s / FLOCK.headEase));
  const base = { goal: p.goal, kind: p.kind, pecking: false };
  if (p.kind === 'move') {
    if (p.dirs.length === 0) return { ...base, at: p.pts[0], h: p.h0, head: carry };
    const d = smoother(s / Math.max(p.t1 - p.t0, 1e-6)) * p.len;
    let k = 0;
    while (k + 1 < p.dirs.length && d >= p.cum[k + 1]) k += 1;
    const leg = p.cum[k + 1] - p.cum[k];
    const at = lerp2(p.pts[k], p.pts[k + 1], leg > 0 ? (d - p.cum[k]) / leg : 1);
    return { ...base, at, h: p.face === null ? legHeading(p, k, t) : turn(p.h0, p.face, ease), head: carry };
  }
  if (p.kind === 'peck') {
    // Mỗi chỗ mổ FLOCK.peck / spots giây, nhịp cúi gần 0 ở cuối mỗi chỗ, nên nhảy sang chỗ mới không giật đầu. Mổ lâu hơn FLOCK.peck
    // (con tới trước, chờ cả nhóm) thì chỗ cuối dài ra: nhịp cúi vẫn liền.
    const slot = FLOCK.peck / FLOCK.spots;
    const j = Math.min(Math.floor(s / slot), FLOCK.spots - 1);
    const u = s - j * slot;
    const at = lerp2(j === 0 ? p.at : p.spots[j - 1], p.spots[j], smooth(u / FLOCK.hop));
    const bob = u > FLOCK.hop ? 0.5 - 0.5 * Math.cos(TAU * FLOCK.bob * (u - FLOCK.hop)) : 0;
    return { ...base, at, h: turn(peckDir(p, j - 1), peckDir(p, j), smooth(u / FLOCK.turn)), head: bob + carry, pecking: bob > 0.85 };
  }
  if (p.kind === 'idle') {
    // Lượn quanh nhà, ngó nghiêng, thỉnh thoảng cúi rỉa lông; tăng dần từ lúc tới nhà (ramp), nên vị trí liên tục.
    const ramp = smooth(s);
    const ph = index * 1.7;
    const at = [p.at[0] + FLOCK.wander * Math.sin(0.31 * t + ph) * ramp, p.at[1] + FLOCK.wander * Math.sin(0.23 * t + 2 * ph) * ramp];
    const bow = 0.7 * Math.max(0, Math.sin((TAU * t) / (4 + (index % 3)) + ph)) ** 6 * ramp;
    return { ...base, at, h: turn(p.h0, p.h1, ease) + 0.4 * Math.sin(0.5 * t + ph) * ramp, head: bow + carry };
  }
  // Núp: quay ra ngoài (lưng về phía mẹ) rồi ngó nghiêng quanh hướng đó; đậu: lắc nhẹ; đứng chờ: giữ hướng hay quay tại chỗ.
  if (p.kind === 'hide') {
    return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + FLOCK.peek * Math.sin(1.7 * t + index) * smooth(s / 0.5), head: carry };
  }
  const sway = p.kind === 'perch' ? FLOCK.perchSway * Math.sin(0.4 * t + index) : 0;
  return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + sway, head: carry };
}
/** Trạng thái ở cuối một pha có hạn (để nối pha sau cho liền: chỗ, hướng đang có chứ không phải hướng muốn tới, độ cúi đầu). */
export const endOf = (p) => phaseState(p, p.t1, 0);

/**
 * Trạng thái của một con theo kế hoạch lúc t.
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
  return phaseState(p, t, index);
}
