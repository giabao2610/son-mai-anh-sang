// paintings/cung-que/parts/la-da-roi.js — lá đa rơi trên tiểu hành tinh: đường rơi dạng đóng theo thời gian (trọng lực về tâm, không có không khí), nằm yên rồi biến mất; vòng ô theo trần; không import three.
import { mulberry32, randRange } from '../../../lib/random.js';

/** Nằm yên trên đất bao lâu (s), rồi nhỏ dần trong bao lâu (s). */
export const FALL = Object.freeze({ rest: 3, fade: 1 });
/** Trọng lực theo đơn vị cảnh (1 đơn vị = 10 m): trăng 1,62 m/s², Trái Đất 9,81 m/s² (§19.5). */
export const GRAVITY = Object.freeze({ trang: 0.162, traiDat: 0.981 });
/**
 * Lá tự rụng khi không ai chạm: mỗi `every` giây một lá. Cảnh mở ra giữa chừng: lá đầu rụng từ `lead` giây trước, nên khung đầu tiên đã
 * có lá đang rơi và lá nằm trên đất (lớp Lá đa thấy được ngay, kể cả khi mài).
 * Giảm chuyển động thì không lá nào tự rụng (xem STILL).
 */
export const AUTO = Object.freeze({ every: 2.5, lead: 5 });
/**
 * Giảm chuyển động: thay cho lá tự rụng, mỗi số ở đây là một lá dừng giữa lúc rơi, ở chừng ấy phần THỜI GIAN rơi của nó (như lá trong
 * một bức tranh): rơi nhanh dần, nên lá ở chừng 9%, 30% và 64% quãng từ tán xuống đất. Lớp Lá đa vẫn có vật để mài mà không có gì chuyển động. Nằm trên đất thì gần như khuất: camera thấp hơn đỉnh hành tinh,
 * nhìn mặt đất quanh gốc cây gần như song song.
 */
export const STILL = Object.freeze([0.3, 0.55, 0.8]);
/** Lúc rụng ghi cho lá dừng: sau ô trống (−1e4). Vị trí của lá dừng không đọc số này. */
const PAUSED = -1e3;
/** Ô có pause từ số này trở lên là lá dừng: một ngưỡng cho cả state() lẫn positionNode (la-da-mesh.js), để hai bên không lệch nhau. */
export const PAUSE_MIN = 1e-6;

const add = (a, b, k = 1) => a.map((v, i) => v + b[i] * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (a) => {
  const l = Math.hypot(...a) || 1;
  return a.map((v) => v / l);
};

/**
 * Bộ ô của lá đang rơi. Mỗi ô là một lá: lúc rơi, g lúc rơi, điểm và vận tốc xuất phát, trục và tốc độ quay. Đường rơi tính thẳng từ
 * thời gian (dạng đóng), nên ?freeze cho đúng khung N và shader tính được cùng đường đó (la-da-mesh.js).
 * @param {{ cap: number, radius: number, seed?: number }} p  cap: trần số lá (budget.leaves); radius: bán kính hành tinh
 */
export function createLeafFall({ cap, radius, seed = 7 }) {
  // Không có ô nào thì cú chạm đầu tiên mới hỏng (burst không có ô để ghi): báo ngay lúc dựng, kèm tên số trong bảng chất lượng.
  if (!Number.isInteger(cap) || cap < 1) throw new Error(`createLeafFall: trần số lá (budget.leaves) phải là số nguyên ≥ 1, nhận ${cap}`);
  // Ô trống: lúc rơi rất xa trong quá khứ, nằm ở nửa bán kính trong lòng hành tinh (không ở tâm: normalize(0) là NaN), cỡ 0
  const slots = Array.from({ length: cap }, () => ({
    t0: -1e4, g: GRAVITY.trang, p0: [0, radius * 0.5, 0], v0: [0, 0, 0], axis: [0, 1, 0], spin: 0, pause: 0,
  }));
  let taps = 0;
  let version = 0;
  let auto = 0; // số lá đã tự rụng

  /**
   * Ô nhường chỗ: ô trống hay lá đã tan trước, rồi lá đang hiện, lá dừng sau cùng (lúc giảm chuyển động, lá dừng là vật duy nhất của
   * lớp Lá đa khi chưa chạm); cùng hạng thì ô có lúc rơi cũ nhất.
   */
  const rank = (s, t) => (s.pause >= PAUSE_MIN ? 2 : api.state(s, t).scale > 0 ? 1 : 0);

  /** `n` lá rụng lúc t quanh `origin`, mỗi lá chiếm ô nhường chỗ trước nhất (rank); trả các ô đã ghi. */
  function fill(t, origin, n) {
    const rand = mulberry32(seed * 7919 + taps);
    taps += 1;
    const filled = [];
    for (let k = 0; k < n; k += 1) {
      const slot = slots.reduce((a, b) => {
        const [ra, rb] = [rank(a, t), rank(b, t)];
        return rb < ra || (rb === ra && b.t0 < a.t0) ? b : a;
      });
      const jitter = [randRange(rand, -0.06, 0.06), randRange(rand, -0.03, 0.03), randRange(rand, -0.06, 0.06)];
      slot.t0 = t;
      slot.g = api.g;
      slot.p0 = add(origin, jitter);
      slot.v0 = [randRange(rand, -0.04, 0.04), randRange(rand, 0, 0.03), randRange(rand, -0.04, 0.04)];
      slot.axis = unit([randRange(rand, -1, 1), randRange(rand, -1, 1), randRange(rand, -1, 1)]);
      slot.spin = randRange(rand, 1.5, 4);
      slot.pause = 0;
      filled.push(slot);
    }
    version += 1;
    return filled;
  }

  const api = {
    slots,
    count: 4, // núm burst
    g: GRAVITY.trang, // núm gravity: chỉ áp cho lá rơi từ đây về sau
    get version() {
      return version;
    },
    /**
     * Một lần chạm: `n` lá (mặc định núm burst) xuất phát quanh `origin`; mỗi lá chiếm ô có lúc rơi cũ nhất. Hạt giống theo số lần
     * rụng: tất định.
     */
    burst(t, origin, n = api.count) {
      fill(t, origin, n);
    },
    /**
     * Giảm chuyển động (thay cho drift): lá thứ k rụng từ `origin(k)` rồi dừng mãi ở STILL[k] thời gian rơi của nó. Chạm thì lá mới
     * lấy ô trống, ô của lá đã tan, rồi ô của lá đang hiện; lá dừng nhường ô sau cùng.
     */
    still(origin) {
      STILL.forEach((part, k) => {
        const [slot] = fill(PAUSED, origin(k), 1);
        const pause = part * api.state(slot, 0).landAt;
        // Thời gian rơi bằng 0 (xuất phát dưới mặt đất) thì pause 0: lá dừng sẽ lặng lẽ thành lá thường đã tan từ lâu
        if (!(pause >= PAUSE_MIN)) throw new Error(`createLeafFall.still: lá dừng thứ ${k} không lơ lửng (thời gian rơi ${pause / part} s)`);
        slot.pause = pause;
      });
    },
    /**
     * Lá tự rụng tới thời điểm t: lá thứ k rụng lúc k·every − lead, mỗi lần một lá, từ `origin(k, t0)`. Gọi mỗi khung; gọi lại với cùng
     * t (khung ?freeze vẽ lại) không thêm gì. Lúc rụng tính từ số thứ tự, không từ nhịp khung, nên tất định.
     */
    drift(t, origin) {
      for (let t0 = auto * AUTO.every - AUTO.lead; t0 <= t; t0 = auto * AUTO.every - AUTO.lead) {
        api.burst(t0, origin(auto, t0), 1);
        auto += 1;
      }
    },
    /**
     * Trạng thái của một lá ở thời điểm t (bản JS của positionNode, để test). Trọng lực hướng về tâm, lấy tại điểm xuất phát:
     * p(τ) = p0 + v0·τ − ½·g·τ²·u, với u = p0/|p0|; chạm đất khi độ cao theo u về 0 (nghiệm bậc hai).
     */
    state(slot, t) {
      const u = unit(slot.p0);
      const vu = dot(slot.v0, u);
      const h0 = Math.max(Math.hypot(...slot.p0) - radius, 0);
      const landAt = (vu + Math.sqrt(Math.max(vu * vu + 2 * slot.g * h0, 0))) / slot.g;
      const paused = slot.pause >= PAUSE_MIN;
      const tau = paused ? slot.pause : t - slot.t0; // lá dừng (still) giữ mãi một khoảnh khắc của đường rơi
      const tf = Math.min(Math.max(tau, 0), landAt);
      const pos = add(add(slot.p0, slot.v0, tf), u, -0.5 * slot.g * tf * tf);
      const after = tau - landAt - FALL.rest;
      const scale = tau < 0 ? 0 : 1 - Math.min(Math.max(after / FALL.fade, 0), 1);
      return { pos, scale, landAt, falling: !paused && tau >= 0 && tau < landAt };
    },
    /** Số lá đang rơi (số đo "Lá đang rơi"). */
    falling: (t) => slots.filter((s) => api.state(s, t).falling).length,
  };
  return api;
}
