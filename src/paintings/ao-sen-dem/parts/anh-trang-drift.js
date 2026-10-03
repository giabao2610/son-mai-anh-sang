// paintings/ao-sen-dem/parts/anh-trang-drift.js — đường trôi của hoa đăng: vòng đệm các lần thả, vị trí/độ nở/độ sáng tính thẳng theo thời gian, thứ tự thơ theo đêm.
import { mulberry32 } from '../../../lib/random.js';

// Điểm học: đường trôi tính THẲNG theo thời gian (dạng đóng: vị trí = f(t − lúc thả)), không cộng dồn từng khung
// (x += v·dt). Nhờ vậy:
// - `?freeze=N` và `update(0, t)` vẽ lại đúng khung N: vị trí chỉ phụ thuộc t, không phụ thuộc đã chạy bao nhiêu khung;
// - máy chậm (dt lớn) hay máy nhanh (dt nhỏ) đều ra đúng một đường, không lệch dần vì sai số cộng dồn;
// - test kiểm bằng số, không phải chạy vòng lặp.
// File này không import three, nên test và e2e gọi thẳng được (đoán trước thứ tự thơ theo ?at).

/** Luật trôi của hoa đăng: đơn vị cảnh, giây theo đồng hồ của cảnh (ctx.u.time). */
export const DRIFT = Object.freeze({
  speed: 0.6, // đơn vị/giây khi đã trôi đều: đèn thả trước mặt đi được nửa đường tới lối trăng trong một đời đèn
  ease: 4, // giây để đạt tốc độ đều (khởi đầu mềm)
  sway: 0.6, // biên độ lượn ngang
  swayRate: 0.35, // rad/giây
  spin: 0.12, // rad/giây, đèn xoay chậm
  open: 1.5, // giây để búp nở đủ
  glowIn: 0.5, // giây để ngọn nến sáng đủ
  life: 90, // giây tối đa trên mặt nước
  sink: 3, // giây chìm dần
  margin: 4, // chìm khi còn cách mép ao bấy nhiêu
});

// Góc vàng π(3 − √5) ≈ 137,5°: pha của các lần thả liên tiếp cách nhau góc này thì không bao giờ trùng nhau, cũng không
// dồn về vài góc (như cách hạt hướng dương xếp vòng). Hai đèn thả liền nhau quay mặt khác nhau và lượn lệch nhịp.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DAY_MS = 24 * 3600 * 1000;
const VN_OFFSET_MS = 7 * 3600 * 1000; // giờ Việt Nam là UTC+7, không có giờ mùa hè
const NOON_MS = 12 * 3600 * 1000; // một "đêm" tính từ 12 giờ trưa tới 12 giờ trưa hôm sau

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/** smoothstep như GLSL: 0 trước e0, 1 sau e1, ở giữa cong chữ S (bắt đầu và dừng đều mềm). */
function smoothstep(e0, e1, v) {
  const k = clamp01((v - e0) / (e1 - e0));
  return k * k * (3 - 2 * k);
}

/** Vector đơn vị theo (x, z); dài 0 thì trả (fx, fz), để không chia cho 0. */
function unit(x, z, fx, fz) {
  const length = Math.hypot(x, z);
  return length > 1e-9 ? [x / length, z / length] : [fx, fz];
}

/**
 * Hướng trôi (vector đơn vị trên mặt nước) từ (x, z) tới một điểm xa trên lối trăng: điểm cách chỗ đứng của camera `reach`
 * đơn vị theo phương vị của trăng. Tính MỘT lần lúc thả: kéo thanh giờ sau đó không làm đèn đổi đường.
 * Lối trăng là dải nước nối mắt người xem với bóng trăng, nên nhắm tới một điểm trên dải đó (chứ không đi song song với
 * phương vị trăng) thì đèn thả ở đâu cũng dần đi vào lối trăng. reach 100 đặt điểm đó NGOÀI ao (cách tâm ít nhất
 * 100 − 32 = 68 > 60, trăng ở hướng nào cũng vậy): đích mà nằm trong ao thì đèn thả xa hơn đích sẽ quay đầu về phía camera.
 * @param {number} x @param {number} z
 * @param {{ x: number, z: number }} moon  hướng tới trăng (chỉ dùng x, z), như shared.moon.dir.value
 * @param {{ origin?: [number, number], reach?: number }} [opts]
 *   origin = (x, z) của camera trên mặt nước (Bức 1: [0, 32], painting.js); reach mặc định 100
 * @returns {[number, number]}
 */
export function driftDirection(x, z, moon, { origin = [0, 32], reach = 100 } = {}) {
  const [ax, az] = unit(moon.x, moon.z, 0, -1); // trăng ở đỉnh đầu thì coi như ở phía trước camera (−z)
  return unit(origin[0] + ax * reach - x, origin[1] + az * reach - z, ax, az); // đứng đúng điểm đích: trôi theo phương vị
}

/** Quãng đã trôi sau `age` giây: vận tốc tăng mềm từ 0 lên speed theo (1 − e^(−age/ease)); quãng là tích phân của nó. */
function distanceAt(age) {
  return DRIFT.speed * (age - DRIFT.ease * (1 - Math.exp(-age / DRIFT.ease)));
}

/**
 * Tuổi (giây) lúc đèn đi được quãng s, tức nghiệm của distanceAt(a) = s. Phương trình này không giải ra công thức được,
 * nên dùng Newton: a ← a − (distanceAt(a) − s) / vận tốc(a). distanceAt tăng và lồi, nên đi từ một điểm bên phải nghiệm
 * thì mỗi bước tiến về nghiệm mà không vượt qua. Chỉ chạy MỘT lần lúc thả.
 */
function ageAt(s) {
  let a = s / DRIFT.speed + DRIFT.ease; // trôi đều lâu rồi thì s ≈ speed·(a − ease): điểm này luôn ở bên phải nghiệm
  for (let i = 0; i < 32; i++) {
    const step = (distanceAt(a) - s) / (DRIFT.speed * (1 - Math.exp(-a / DRIFT.ease)));
    a -= step;
    if (step < 1e-6) break;
  }
  return a;
}

/**
 * Tuổi lúc đèn tới vùng mép (cách tâm ao `radius`) khi đi thẳng theo (dx, dz) từ (x, z). Chỗ ra khỏi vòng tròn là nghiệm
 * lớn của |p + s·d|² = radius², một phương trình bậc hai theo quãng s. Bỏ qua lượn ngang: biên độ lượn cộng quãng trôi
 * trong lúc chìm (sway + speed × sink = 0,6 + 0,6 × 3; test giữ) vẫn nhỏ hơn DRIFT.margin, nên đèn thả trong vòng chìm hẳn
 * trước khi chạm bờ. Thả ngoài vòng (dải sát bờ) mà không hướng vào trong thì trả 0: chìm ngay.
 */
function edgeAge(x, z, dx, dz, radius) {
  const b = x * dx + z * dz;
  const disc = b * b - (x * x + z * z) + radius * radius;
  const s = disc > 0 ? Math.sqrt(disc) - b : 0;
  return s > 0 ? ageAt(s) : 0;
}

/**
 * @typedef {{ x: number, z: number, t0: number, dx: number, dz: number, phase: number, key: string | null,
 *   sinkAt: number, edgeAt: number, seq: number }} LanternSlot
 *  t0 = -Infinity khi ô trống; sinkAt = Infinity khi chưa bị ép chìm; edgeAt = lúc chạm vùng mép (tính lúc thả);
 *  seq = thứ tự của lần thả (-1 khi ô trống).
 */

/** Ô trống: t0 = −∞ nên lúc bắt đầu chìm cũng là −∞, không bao giờ sống. */
const emptySlot = () => ({
  x: 0, z: 0, t0: -Infinity, dx: 0, dz: -1, phase: 0, key: null, sinkAt: Infinity, edgeAt: Infinity, seq: -1,
});

/** Lúc đèn bắt đầu chìm: hết đời, tới vùng mép, hay bị ép chìm vì thả quá số đèn; cái nào tới trước. */
const sinkStart = (slot) => Math.min(slot.t0 + DRIFT.life, slot.edgeAt, slot.sinkAt);
/** Đã thả và chưa chìm hẳn: đang nổi hay đang chìm. */
const isAlive = (slot, t) => slot.t0 <= t && t < sinkStart(slot) + DRIFT.sink;
/** Đang nổi: đã thả, chưa bắt đầu chìm. */
const isAfloat = (slot, t) => slot.t0 <= t && t < sinkStart(slot);

/**
 * Ô có đèn chìm lâu nhất (bắt đầu chìm sớm nhất; cùng lúc thì thả trước). Chỉ gọi khi mọi ô đều có đèn sống. Lúc đó luôn
 * có đèn đang chìm (capacity + 1 ô mà tối đa capacity − 1 đèn nổi), và đèn đang chìm bắt đầu chìm trước mọi đèn đang nổi.
 */
function longestSinking(slots) {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    const [a, b] = [sinkStart(slots[i]), sinkStart(slots[best])];
    if (a < b || (a === b && slots[i].seq < slots[best].seq)) best = i;
  }
  return best;
}

/**
 * Vòng đệm các lần thả: capacity + 1 ô. Ao giữ tối đa `capacity` đèn đang nổi; thả thêm thì đèn thả sớm nhất chìm sớm.
 * Ô thừa là chỗ cho đèn đang chìm đó: đèn cũ chìm dần trong DRIFT.sink giây chứ không biến mất ngay.
 * @param {number} capacity  số đèn trôi tối đa (budget.lanterns)
 * @param {{ pond?: number }} [opts]  pond = bán kính ao (Bức 1: POND_RADIUS 60 ở shared.js; file này không import shared.js
 *   vì shared.js kéo theo three). Dùng lúc thả để tính edgeAt.
 * @returns {{ capacity: number, slots: LanternSlot[],
 *   release: (r: { x: number, z: number, t: number, dir: [number, number], key?: string | null, phase?: number }) => number,
 *   alive: (t: number) => number }}
 */
export function createLanternSlots(capacity, { pond = 60 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error(`createLanternSlots: capacity phải là số nguyên ≥ 1 (budget.lanterns), nhận được ${capacity}`);
  }
  const slots = Array.from({ length: capacity + 1 }, emptySlot);
  let released = 0; // số lần đã thả: thứ tự thả (seq) và pha mặc định
  return {
    capacity,
    slots,
    /**
     * Thả một đèn lúc t (giây của ctx.u.time), trả số ô. dir là vector đơn vị (driftDirection), key là khóa của câu thơ.
     * Thứ tự thả (seq) tách được cả những lần thả cùng một t (đồng hồ đứng khi ?freeze).
     */
    release({ x, z, t, dir, key = null, phase }) {
      // Chuẩn hóa lại dir cho chắc: tốc độ trôi và phương trình mép đều giả sử |dir| = 1.
      const [dx, dz] = unit(dir[0], dir[1], 0, -1);
      const edgeAt = t + edgeAge(x, z, dx, dz, pond - DRIFT.margin);
      // (1) Đã đủ capacity đèn đang nổi: đèn thả sớm nhất chìm sớm, ngay từ lúc này. Đèn mới mà chìm ngay (thả ở dải sát
      //     bờ, hướng ra ngoài) thì không phải một đèn nổi: không bắt đèn nào chìm theo.
      const afloat = slots.filter((s) => isAfloat(s, t));
      if (edgeAt > t && afloat.length >= capacity) afloat.reduce((a, b) => (b.seq < a.seq ? b : a)).sinkAt = t;
      // (2) Ô trống hay đèn đã chìm hẳn; không còn thì lấy ô có đèn chìm lâu nhất (chỉ khi thả dồn dập).
      let i = slots.findIndex((s) => !isAlive(s, t));
      if (i < 0) i = longestSinking(slots);
      // (3) Ghi lần thả vào ô đó.
      Object.assign(slots[i], {
        x,
        z,
        t0: t,
        dx,
        dz,
        phase: phase ?? (released * GOLDEN_ANGLE) % (Math.PI * 2),
        key,
        sinkAt: Infinity,
        edgeAt,
        seq: released++,
      });
      return i;
    },
    /** Số đèn còn sống lúc t (đang nổi + đang chìm): số đo "Hoa đăng đang trôi". */
    alive: (t) => slots.reduce((n, s) => n + (isAlive(s, t) ? 1 : 0), 0),
  };
}

/**
 * Trạng thái của một đèn ở thời điểm t (giây của đồng hồ cảnh), tính thẳng từ công thức: gọi lại với cùng t luôn ra cùng
 * kết quả. Đèn đi theo dir một quãng distanceAt(tuổi), lượn ngang theo hình sin, xoay chậm.
 * @param {LanternSlot} slot
 * @param {number} t
 * @returns {{ alive: boolean, x: number, z: number, yaw: number, open: number, glow: number, sink: number }}
 *   open 0 → 1 (búp → nở), glow 0 → 1 (sáng dần lúc đầu, tắt dần khi chìm), sink 0 → 1 (đang chìm)
 */
export function lanternAt(slot, t) {
  const sink = clamp01((t - sinkStart(slot)) / DRIFT.sink);
  if (!isAlive(slot, t)) return { alive: false, x: slot.x, z: slot.z, yaw: slot.phase, open: 0, glow: 0, sink };
  const age = t - slot.t0;
  const along = distanceAt(age);
  // Lượn ngang lớn dần theo đà (cùng thừa số 1 − e^(−age/ease) với vận tốc): lúc thả, đèn nằm đúng chỗ ngón tay chạm.
  const side = DRIFT.sway * Math.sin(DRIFT.swayRate * age + slot.phase) * (1 - Math.exp(-age / DRIFT.ease));
  return {
    alive: true,
    x: slot.x + slot.dx * along - slot.dz * side, // (−dz, dx) vuông góc với hướng trôi
    z: slot.z + slot.dz * along + slot.dx * side,
    yaw: slot.phase + DRIFT.spin * age,
    open: smoothstep(0, DRIFT.open, age),
    glow: smoothstep(0, DRIFT.glowIn, age) * (1 - sink),
    sink,
  };
}

/**
 * Thứ tự thơ của một đêm: hoán vị của `keys`, xáo bằng mulberry32 với hạt giống là số thứ tự của đêm (giờ Việt Nam).
 * Một đêm tính từ 12 giờ trưa tới 12 giờ trưa hôm sau, nên cả đêm của bức (18:00 → 05:30) chỉ có một thứ tự, không đổi
 * lúc nửa đêm; cùng ?at thì cùng thứ tự. Xáo Fisher–Yates: đi từ cuối mảng về đầu, đổi phần tử i với một phần tử
 * bốc ngẫu nhiên trong [0, i]; mọi hoán vị có cùng xác suất (sort theo số ngẫu nhiên thì không).
 * @param {string[]} keys
 * @param {Date} now
 * @returns {string[]}  mảng mới; keys giữ nguyên
 */
export function verseOrder(keys, now) {
  const rng = mulberry32(Math.floor((now.getTime() + VN_OFFSET_MS - NOON_MS) / DAY_MS));
  const order = [...keys];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
