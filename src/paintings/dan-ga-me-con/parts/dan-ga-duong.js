// paintings/dan-ga-me-con/parts/dan-ga-duong.js — hình học đường đi của gà con quanh thân gà mẹ (hình viên thuốc quanh một đoạn xương sống): đường thẳng cắt vòng cấm thì vòng qua đầu hay đuôi mẹ; chỗ đến sát mẹ (chỗ núp) có điểm dừng ở xa để quay hẳn ra ngoài rồi lùi vào; không import three.

const EPS = 1e-9;
const len = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);

/** Điểm gần nhất của p trên đoạn a–b. */
export function nearestOnSegment(p, a, b) {
  const ab = [b[0] - a[0], b[1] - a[1]];
  const l2 = ab[0] * ab[0] + ab[1] * ab[1];
  const k = l2 < EPS ? 0 : Math.min(Math.max(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1]) / l2, 0), 1);
  return [a[0] + ab[0] * k, a[1] + ab[1] * k];
}
/** Khoảng cách từ điểm (px, pz) tới đoạn (ax, az)–(bx, bz), tính bằng số (không cấp phát: được gọi hàng nghìn lần mỗi lần giữ). */
function pointToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const k = l2 < EPS ? 0 : Math.min(Math.max(((px - ax) * dx + (pz - az) * dz) / l2, 0), 1);
  return Math.hypot(px - ax - dx * k, pz - az - dz * k);
}
/** Khoảng cách nhỏ nhất giữa đoạn p–q và đoạn a–b: 0 nếu cắt nhau; không thì đạt ở một đầu mút của một trong hai đoạn. */
export function segmentGap(p, q, a, b) {
  if (cross(p, q, a) * cross(p, q, b) < 0 && cross(a, b, p) * cross(a, b, q) < 0) return 0;
  return Math.min(
    pointToSegment(p[0], p[1], a[0], a[1], b[0], b[1]), pointToSegment(q[0], q[1], a[0], a[1], b[0], b[1]),
    pointToSegment(a[0], a[1], p[0], p[1], q[0], q[1]), pointToSegment(b[0], b[1], p[0], p[1], q[0], q[1]),
  );
}
/** Độ dài đường gấp khúc. */
export const pathLength = (pts) => pts.reduce((sum, p, k) => (k === 0 ? 0 : sum + len(pts[k - 1], p)), 0);

/**
 * @param {{ a: [number, number], b: [number, number], r: number }} body  thân mẹ: đoạn xương sống a–b và nửa bề ngang r (viên thuốc)
 * @param {number} keep     vòng cấm: gà con ở hướng nào cũng không lún vào mẹ khi cách xương sống từ chừng này (đo bằng chỗ thật của khối)
 * @param {number} standOff chỗ dừng trước chỗ núp cách vòng cấm chừng này
 */
export function createRouter(body, keep, standOff) {
  const { a, b } = body;
  const gap = (p) => pointToSegment(p[0], p[1], a[0], a[1], b[0], b[1]);
  const inside = (p) => gap(p) < keep - EPS;
  const visible = (p, q) => segmentGap(p, q, a, b) >= keep - EPS;

  // Vòng nút quanh vòng cấm (cách 0,15 ra ngoài): nút k nằm ở điểm tựa của hướng k, hai nắp tròn và hai cạnh bên.
  const NODES = 32;
  const ring = Array.from({ length: NODES }, (_, k) => {
    const d = [Math.cos((k * 2 * Math.PI) / NODES), Math.sin((k * 2 * Math.PI) / NODES)];
    const e = d[0] * a[0] + d[1] * a[1] > d[0] * b[0] + d[1] * b[1] ? a : b;
    return [e[0] + (keep + 0.15) * d[0], e[1] + (keep + 0.15) * d[1]];
  });
  const along = [0]; // quãng đường dọc vòng tới nút k (theo chiều tăng)
  for (let k = 1; k <= NODES; k += 1) along.push(along[k - 1] + len(ring[k - 1], ring[k % NODES]));
  const around = along[NODES];

  /** Kéo căng đường gấp khúc: từ mỗi điểm nhảy thẳng tới điểm xa nhất còn nhìn thấy được. */
  function pull(pts) {
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = pts.length - 1;
      while (j > i + 1 && !visible(pts[i], pts[j])) j -= 1;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }
  /**
   * Quãng đường từ p tới từng nút của vòng, Infinity nếu không nhìn thấy nút. Nhớ lại theo toạ độ: khi giữ, mỗi con đi tới tám chỗ và mỗi
   * chỗ đón tám con, nên cùng một điểm được hỏi nhiều lần (hàm thuần của p, nên nhớ lại không đổi kết quả).
   */
  const views = new Map();
  function view(p) {
    const key = `${p[0]},${p[1]}`;
    let v = views.get(key);
    if (!v) {
      if (views.size > 256) views.clear();
      v = ring.map((n) => (visible(p, n) ? len(p, n) : Infinity));
      views.set(key, v);
    }
    return v;
  }
  /** Các đỉnh trung gian để đi từ s tới e (cả hai ngoài vòng cấm) mà không cắt vòng cấm: ngắn nhất qua vòng nút rồi kéo căng. */
  function detour(s, e) {
    if (visible(s, e)) return [];
    const fromS = view(s); // tới nút k, Infinity nếu không nhìn thấy
    const toE = view(e);
    let best = Infinity;
    let pick = null;
    for (let i = 0; i < NODES; i += 1) {
      if (fromS[i] === Infinity) continue;
      for (let j = 0; j < NODES; j += 1) {
        if (toE[j] === Infinity) continue;
        const forward = (along[j] - along[i] + around) % around;
        for (const dir of [1, -1]) {
          const cost = fromS[i] + (i === j ? 0 : dir === 1 ? forward : around - forward) + toE[j];
          if (cost < best - 1e-12) {
            best = cost;
            pick = [i, j, dir];
          }
        }
      }
    }
    if (!pick) return [];
    const [i, j, dir] = pick;
    const via = [];
    for (let k = i; ; k = (k + dir + NODES) % NODES) {
      via.push(ring[k]);
      if (k === j) break;
    }
    return pull([s, ...via, e]).slice(1, -1);
  }
  /** Điểm dừng ngoài vòng cấm, thẳng ra ngoài từ chỗ p (p sát mẹ): gà con quay hẳn ra ngoài ở đây trước khi lùi vào. */
  function standPoint(p) {
    const q = nearestOnSegment(p, a, b);
    const g = len(p, q);
    const n = g > EPS ? [(p[0] - q[0]) / g, (p[1] - q[1]) / g] : [0, 1];
    return [q[0] + n[0] * (keep + standOff), q[1] + n[1] * (keep + standOff)];
  }
  /**
   * Hành trình từ A tới B: `lead` (A sát mẹ: đi thẳng ra ngoài tới điểm dừng, mặt hướng ra), `run` (đường chạy, vòng qua đầu hay đuôi mẹ nếu
   * đường thẳng cắt vòng cấm) và `tuck` (B sát mẹ: từ điểm dừng lùi vào B). Không chỗ nào của `run` nằm trong vòng cấm.
   * @returns {{ lead: [number, number][] | null, run: [number, number][], tuck: [number, number][] | null }}
   */
  function journey(A, B) {
    if (len(A, B) < 1e-6) return { lead: null, run: [A], tuck: null };
    const lead = inside(A) ? [A, standPoint(A)] : null;
    const tuck = inside(B) ? [standPoint(B), B] : null;
    const s = lead ? lead[1] : A;
    const e = tuck ? tuck[0] : B;
    return { lead, run: [s, ...detour(s, e), e], tuck };
  }
  const length = (jy) => pathLength(jy.lead ?? []) + pathLength(jy.run) + pathLength(jy.tuck ?? []);
  return { keep, gap, inside, visible, journey, length };
}
