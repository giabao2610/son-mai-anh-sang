// engine/gpu/gpu-timer.js — ms GPU mỗi khung: hỏi renderer.resolveTimestampsAsync (render + compute) sau khi vẽ, không chờ, không hỏi chồng.

/** Hỏng chừng này lần liền (bị reject, hay số vô lý) thì thôi đo GPU cho phiên này. */
export const GPU_FAIL_LIMIT = 3;
/**
 * Một khung không thể bận GPU lâu hơn chừng này lần nhịp khung của chính mẻ đo: số lớn hơn là số vô lý. GPU Apple (Chrome)
 * báo thời lượng các pass chồng lên nhau, và three cộng chúng lại: khoảng 160 ms cho một khung 16,7 ms (Phụ lục A.48).
 */
export const GPU_PLAUSIBLE = 1.5;

/**
 * Thời gian GPU thật của một khung, để bộ điều chỉnh (tuner.js) phân biệt "GPU không kịp" với "trình duyệt khóa nhịp",
 * và để Sổ tay có ms GPU (spec §10, GĐ 4).
 *
 * three đo bằng timestamp query: stage.js tạo renderer với `trackTimestamp: true`. WebGPU tự tắt cờ lúc init nếu adapter
 * không có 'timestamp-query'; WebGL2 chỉ đo khi có EXT_disjoint_timer_query_webgl2 (Phụ lục A.40).
 * `resolveTimestampsAsync(type)` đọc các truy vấn đã ghi và trả TỔNG ms GPU của khung mới nhất trong mẻ đó. Kết quả về
 * trễ vài khung (GPU phải chạy xong rồi mới đọc được), nên poll() không bao giờ chờ: nó hỏi rồi đi tiếp, và chỉ hỏi
 * lần mới khi lần trước đã về. Mẫu vì vậy thưa và không đều, bộ điều chỉnh gom theo cửa sổ 2 giây.
 *
 * Mỗi lần hỏi, three gom rồi xóa các truy vấn của những khung vẽ từ lần hỏi trước (một "mẻ"). Trần cho số trả về là nhịp khung
 * trung bình của mẻ đó × GPU_PLAUSIBLE: GPU vẽ lần lượt từng pass thì không thể bận lâu hơn nhịp khung. Máy nặng lên đột ngột
 * (bật thí nghiệm nặng) chỉ lệch một mẫu, vì mẻ sau đã đo theo nhịp mới.
 *
 * @param {any} renderer  WebGPURenderer ĐÃ init()
 * @param {{ onSample?: (ms: number) => void, onStop?: () => void }} [options]
 *   onSample: mỗi mẫu hợp lệ (render + compute, ms); onStop: máy thôi đo được (hỏng 3 lần liền), gọi một lần
 */
export function createGpuTimer(renderer, { onSample = () => {}, onStop = () => {} } = {}) {
  let pending = false;
  let failures = 0;
  let dead = false; // hỏng 3 lần liền, hay đã gỡ
  let computes = 0; // số lần compute từ lần hỏi trước
  let frames = 0; // số khung đã vẽ từ lần hỏi trước
  let askedAt = null; // mốc của lần hỏi trước
  let last = null;

  // Máy vẫn đo được không: WebGPU tắt cờ lúc init nếu thiếu tính năng; ?debug cũng có thể tắt nó (engine/gpu/debug.js).
  const tracking = () => !dead && renderer.backend?.trackTimestamp === true;
  const fail = () => {
    failures += 1;
    if (failures >= GPU_FAIL_LIMIT && !dead) {
      dead = true;
      last = null;
      onStop(); // Sổ tay về "—", bộ điều chỉnh về đường nhịp (hết mẫu GPU)
    }
  };

  return {
    /** Gọi sau mỗi render() của vòng lặp, với mốc của khung vừa vẽ (ms). Không chờ kết quả. */
    poll(now) {
      if (!tracking()) return;
      // Không có compute nào từ lần hỏi trước thì three trả lại số CŨ của pool compute: đừng cộng số đó.
      computes += renderer.info.compute.frameCalls;
      frames += 1;
      if (pending) return;
      pending = true;
      const frameMs = askedAt === null ? 0 : (now - askedAt) / frames; // nhịp khung trung bình của mẻ này
      const limit = frameMs > 0 ? frameMs * GPU_PLAUSIBLE : Infinity; // lần hỏi đầu (hay không có mốc): chưa có trần
      askedAt = now;
      frames = 0;
      const withCompute = computes > 0;
      computes = 0;
      Promise.all([
        renderer.resolveTimestampsAsync('render'),
        withCompute ? renderer.resolveTimestampsAsync('compute') : 0,
      ])
        .then(([render, compute]) => {
          if (dead) return;
          const ms = render + (compute ?? 0);
          // Số vô lý (0, âm, NaN, vô cực, undefined khi pool chưa có, hay lâu hơn hẳn nhịp khung): bỏ mẫu đó.
          if (!(render > 0) || !Number.isFinite(ms) || ms > limit) {
            fail();
            return;
          }
          failures = 0;
          last = ms;
          onSample(ms);
        }, fail)
        .finally(() => {
          pending = false;
        });
    },
    /** ms GPU của mẫu gần nhất (null khi chưa có, hay khi đã thôi đo). */
    get ms() {
      return last;
    },
    /** Máy này đo được ms GPU: đã có ít nhất một mẫu hợp lệ, và chưa phải thôi đo. */
    get available() {
      return tracking() && last !== null;
    },
    dispose() {
      dead = true;
    },
  };
}
