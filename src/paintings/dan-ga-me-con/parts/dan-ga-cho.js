// paintings/dan-ga-me-con/parts/dan-ga-cho.js — chỗ đứng của gà con: kéo điểm rắc ra khỏi thân mẹ (nắm ném vào mẹ thì rơi bên cạnh), xếp các con tới một nắm thành vòng quanh nắm mà tránh các con khác, và gán con nào chỗ nào sao cho tổng quãng đường ngắn nhất; không import three.
import { FLOCK, dist } from './dan-ga-pha.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
/** Vòng thử khi chỗ quanh nắm bị các con khác hay mẹ chiếm: bán kính nhân với các số này, mỗi vòng thử TURNS góc xoay. */
const SCALES = [1, 1.4, 1.8];
const TURNS = 12;
/** Lưới ô đứng quanh được của từng bố cục (xem createPlacer). */
const GRIDS = new WeakMap();

/**
 * Gán mỗi hàng một cột khác nhau sao cho tổng chi phí nhỏ nhất (vét cạn có cắt tỉa). Hòa thì lấy phương án đầu tiên tìm thấy
 * (hàng theo thứ tự, cột theo thứ tự), nên kết quả tất định.
 * @param {number[][]} cost  cost[hàng][cột], số hàng ≤ số cột
 * @returns {number[]} cột của từng hàng
 */
export function assign(cost) {
  const rows = cost.length;
  const cols = rows ? cost[0].length : 0;
  const floorSum = new Array(rows + 1).fill(0); // cận dưới: tổng chi phí nhỏ nhất của các hàng còn lại, bỏ qua trùng cột
  for (let i = rows - 1; i >= 0; i -= 1) floorSum[i] = floorSum[i + 1] + Math.min(...cost[i]);
  let best = Infinity;
  let bestPick = [];
  const pick = [];
  const used = new Array(cols).fill(false);
  (function go(i, sum) {
    if (sum + floorSum[i] >= best) return;
    if (i === rows) {
      best = sum;
      bestPick = [...pick];
      return;
    }
    for (let k = 0; k < cols; k += 1) {
      if (used[k]) continue;
      used[k] = true;
      pick[i] = k;
      go(i + 1, sum + cost[i][k]);
      used[k] = false;
    }
  })(0, 0);
  return bestPick;
}

/** Các giá trị từ lo tới hi cách nhau step (hi gồm cả), tính theo số nguyên để không cộng dồn sai số. */
const sweep = (lo, hi, step) => Array.from({ length: Math.floor((hi - lo) / step + 1e-9) + 1 }, (_, k) => lo + k * step);

/**
 * @param {{ floor: { x: number[], z: number[] } }} layout
 * @param {ReturnType<import('./dan-ga-duong.js').createRouter>} router  vòng cấm quanh mẹ (router.keep, router.gap)
 */
export function createPlacer(layout, router) {
  const { floor } = layout;
  const hop = FLOCK.hopRadius[1];
  const pad = FLOCK.spread + hop;
  /** Tâm vòng đứng của một nắm: điểm rắc kéo vào trong sàn (chừa cả vòng và bước nhảy), nên chạm sát mép thì gà con vẫn đứng trên giấy. */
  const ringCenter = (g) => [clamp(g[0], floor.x[0] + pad, floor.x[1] - pad), clamp(g[1], floor.z[0] + pad, floor.z[1] - pad)];
  /** Tâm vòng cách xương sống của mẹ từ keep + spread + bước nhảy thì mọi chỗ đứng và chỗ nhảy của vòng đều ngoài vòng cấm. */
  const standable = (g) => router.gap(ringCenter(g)) >= router.keep + pad - 1e-9;

  /** Lưới 0,1 trên sàn: ô nào đứng quanh được. Hàm thuần của bố cục, nên dựng một lần cho mỗi bố cục (mọi đàn dùng chung): dời điểm rắc chỉ còn quét số học rẻ. */
  const cells = () => {
    if (!GRIDS.has(layout)) {
      const zs = sweep(floor.z[0], floor.z[1], 0.1);
      GRIDS.set(layout, sweep(floor.x[0], floor.x[1], 0.1).flatMap((x) => zs.filter((z) => standable([x, z])).map((z) => [x, z])));
    }
    return GRIDS.get(layout);
  };
  /**
   * Điểm rắc gần g nhất mà gà con đứng quanh được (g đã đứng được thì giữ nguyên): nắm ném vào mẹ, hay sát mẹ tới mức vòng gà con phải đè lên
   * mẹ, thì rơi bên cạnh mẹ. Tìm trên lưới 0,1 rồi mịn lại tới 0,005 quanh kết quả.
   */
  function awayFromHen(g) {
    if (standable(g)) return g;
    let best = null;
    let bestDist = Infinity;
    for (const p of cells()) {
      const d = dist(p, g);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    if (!best) return g;
    for (const [radius, step] of [[0.1, 0.01], [0.01, 0.0025]]) {
      const [cx, cz] = best;
      for (const x of sweep(Math.max(cx - radius, floor.x[0]), Math.min(cx + radius, floor.x[1]), step)) {
        for (const z of sweep(Math.max(cz - radius, floor.z[0]), Math.min(cz + radius, floor.z[1]), step)) {
          const d = dist([x, z], g);
          if (d < bestDist && standable([x, z])) {
            bestDist = d;
            best = [x, z];
          }
        }
      }
    }
    return [best[0], best[1]]; // bản sao: ô của lưới dùng chung không bao giờ lọt ra ngoài
  }

  /** Chỗ đứng p có hợp lệ không: trên sàn, ngoài vòng cấm quanh mẹ (cả khi nhảy), và cách chỗ của các con khác từ FLOCK.gap. */
  const valid = (p, occupied) => p[0] >= floor.x[0] + hop && p[0] <= floor.x[1] - hop && p[1] >= floor.z[0] + hop && p[1] <= floor.z[1] - hop
    && router.gap(p) >= router.keep + hop && occupied.every((o) => dist(p, o) >= FLOCK.gap);
  /**
   * Chỗ đứng cho tối đa n con quanh tâm c, cách đều nhau trên một vòng (hạt giống xoay vòng). Lấy phương án có nhiều chỗ hợp lệ nhất, rồi vòng
   * nhỏ nhất, rồi góc xoay gần hạt giống nhất, và chỉ trả các chỗ hợp lệ: chỗ nào đè lên con khác thì bỏ, con ấy ở yên; đông tới mức không
   * còn chỗ nào thì không con nào tới (các con khác đang vây quanh nắm rồi), chứ không bao giờ nới cho chồng lên nhau.
   * @param {[number, number]} c
   * @param {number} n
   * @param {() => number} rand
   * @param {[number, number][]} occupied  chỗ đứng của các con khác (đang mổ nắm khác, đang nghỉ, con nấp bụng)
   */
  function ringSpots(c, n, rand, occupied) {
    const base = rand() * TAU;
    let best = [];
    for (const scale of SCALES) {
      for (let j = 0; j < TURNS; j += 1) {
        const phase = base + (j * TAU) / (n * TURNS);
        const spots = Array.from({ length: n }, (_, k) => [c[0] + Math.cos(phase + (k * TAU) / n) * FLOCK.spread * scale, c[1] + Math.sin(phase + (k * TAU) / n) * FLOCK.spread * scale]);
        const ok = spots.filter((p) => valid(p, occupied));
        if (ok.length > best.length) best = ok;
      }
    }
    return best;
  }
  return { ringCenter, awayFromHen, ringSpots };
}
