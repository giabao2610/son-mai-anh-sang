// paintings/cung-que/parts/la-da-roi.js — lá đa rơi trên tiểu hành tinh: đường rơi dạng đóng theo thời gian (trọng lực về tâm, không có không khí), nằm yên rồi biến mất; vòng ô theo trần; không import three.
import { mulberry32, randRange } from '../../../lib/random.js';

/** Nằm yên trên đất bao lâu (s), rồi nhỏ dần trong bao lâu (s). */
export const FALL = Object.freeze({ rest: 3, fade: 1 });
/** Trọng lực theo đơn vị cảnh (1 đơn vị = 10 m): trăng 1,62 m/s², Trái Đất 9,81 m/s² (§19.5). */
export const GRAVITY = Object.freeze({ trang: 0.162, traiDat: 0.981 });
/**
 * Lá tự rụng khi không ai chạm: mỗi `every` giây một lá. Cảnh mở ra giữa chừng: lá đầu rụng từ `lead` giây trước, nên khung đầu tiên đã
 * có lá đang rơi và lá nằm trên đất (lớp Lá đa thấy được ngay, kể cả khi mài).
 */
export const AUTO = Object.freeze({ every: 2.5, lead: 5 });

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
  // Ô trống: lúc rơi rất xa trong quá khứ, nằm ở nửa bán kính trong lòng hành tinh (không ở tâm: normalize(0) là NaN), cỡ 0
  const slots = Array.from({ length: cap }, () => ({
    t0: -1e4, g: GRAVITY.trang, p0: [0, radius * 0.5, 0], v0: [0, 0, 0], axis: [0, 1, 0], spin: 0,
  }));
  let taps = 0;
  let version = 0;
  let auto = 0; // số lá đã tự rụng
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
      const rand = mulberry32(seed * 7919 + taps);
      taps += 1;
      for (let k = 0; k < n; k += 1) {
        const slot = slots.reduce((a, b) => (b.t0 < a.t0 ? b : a));
        const jitter = [randRange(rand, -0.06, 0.06), randRange(rand, -0.03, 0.03), randRange(rand, -0.06, 0.06)];
        slot.t0 = t;
        slot.g = api.g;
        slot.p0 = add(origin, jitter);
        slot.v0 = [randRange(rand, -0.04, 0.04), randRange(rand, 0, 0.03), randRange(rand, -0.04, 0.04)];
        slot.axis = unit([randRange(rand, -1, 1), randRange(rand, -1, 1), randRange(rand, -1, 1)]);
        slot.spin = randRange(rand, 1.5, 4);
      }
      version += 1;
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
      const tau = t - slot.t0;
      const tf = Math.min(Math.max(tau, 0), landAt);
      const pos = add(add(slot.p0, slot.v0, tf), u, -0.5 * slot.g * tf * tf);
      const after = tau - landAt - FALL.rest;
      const scale = tau < 0 ? 0 : 1 - Math.min(Math.max(after / FALL.fade, 0), 1);
      return { pos, scale, landAt, falling: tau >= 0 && tau < landAt };
    },
    /** Số lá đang rơi (số đo "Lá đang rơi"). */
    falling: (t) => slots.filter((s) => api.state(s, t).falling).length,
  };
  return api;
}
