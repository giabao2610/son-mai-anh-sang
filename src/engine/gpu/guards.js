// engine/gpu/guards.js — Hai bộ đếm lỗi thuần của vòng lặp: 3 khung lỗi liên tiếp, 3 lỗi GPU trong 1 giây.

/**
 * Đếm lỗi LIÊN TIẾP (luật "3 khung lỗi liên tiếp → tầng tĩnh", spec §9).
 * Một khung lỗi thì chỉ ghi log và bỏ qua khung đó; một khung tốt xóa chuỗi.
 * @param {{ limit?: number }} [opts]
 * @returns {{ ok: () => void, fail: () => boolean, readonly streak: number }}
 *   fail() trả true khi chuỗi lỗi chạm `limit`.
 */
export function createFailCounter({ limit = 3 } = {}) {
  let streak = 0;
  return {
    ok() {
      streak = 0;
    },
    fail() {
      streak += 1;
      return streak >= limit;
    },
    get streak() {
      return streak;
    },
  };
}

/**
 * Đếm lỗi trong một cửa sổ thời gian trượt (luật "3 lỗi GPU trong 1 giây → tầng tĩnh").
 * Lỗi GPU (validation, hết bộ nhớ…) đến KHÔNG đồng bộ qua renderer.onError và không ném từ render(),
 * nên không thể bắt bằng try/catch quanh khung: phải đếm theo thời gian.
 * @param {{ limit?: number, windowMs?: number }} [opts]
 * @returns {{ hit: (ms: number) => boolean, readonly count: number }}
 *   hit(ms) ghi một lỗi tại thời điểm ms; trả true khi trong khoảng (ms − windowMs, ms] có ≥ limit lỗi.
 */
export function createBurstCounter({ limit = 3, windowMs = 1000 } = {}) {
  const hits = [];
  return {
    hit(ms) {
      hits.push(ms);
      // Bỏ các lỗi đã cũ từ windowMs trở lên: chúng không còn "trong 1 giây" nữa.
      while (hits.length > 0 && ms - hits[0] >= windowMs) hits.shift();
      return hits.length >= limit;
    },
    get count() {
      return hits.length;
    },
  };
}
