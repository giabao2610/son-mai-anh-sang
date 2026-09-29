// engine/gpu/guards.js — Bộ đếm lỗi thuần của vòng lặp (3 khung lỗi liên tiếp, 3 lỗi GPU trong 1 giây) và chốt báo bù sự kiện một lần.

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

/**
 * Chốt cho sự kiện chỉ xảy ra một lần (mất thiết bị). Ai nghe TRƯỚC thì được báo ngay lúc sự kiện tới;
 * ai nghe SAU khi sự kiện đã xảy ra thì được báo bù (ở microtask kế tiếp), để sự kiện không bao giờ rơi mất.
 * Ví dụ: GPU mất giữa renderer.init() và lúc run.js gắn stage.onLost(): không có chốt thì trang treo ở "loading".
 * @template T
 * @returns {{ fire: (info: T) => void, on: (cb: (info: T) => void) => void, clear: () => void, readonly fired: boolean }}
 */
export function createLatch() {
  const listeners = [];
  let event = null;
  return {
    fire(info) {
      event = { info };
      for (const cb of [...listeners]) cb(info);
    },
    on(cb) {
      listeners.push(cb);
      if (event) queueMicrotask(() => cb(event.info));
    },
    /** Bỏ mọi người nghe (stage.dispose() gọi trước khi gỡ renderer, vì gỡ WebGL cũng phát "mất context"). */
    clear() {
      listeners.length = 0;
    },
    get fired() {
      return event !== null;
    },
  };
}
