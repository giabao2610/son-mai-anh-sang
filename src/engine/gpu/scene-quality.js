// engine/gpu/scene-quality.js — bộ điều chỉnh chất lượng của một cảnh (tách từ scene.js): nối bộ quyết định, thang nấc và bộ đo GPU; run.js và bàn thợ (__sma.quality()) dùng nó.

/**
 * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU) + bộ đo GPU (gpu-timer).
 * tuner = null khi ?freeze: ảnh phải tất định, chỉ hạ/nâng tay (__sma) được.
 */
export function createQuality({ level, ladder, tuner, timer }) {
  const listeners = new Set();
  let guarding = false;
  let live = false; // chỉ đo từ lúc live: khung ẩn và 0,9 giây hòa dần không phải nhịp thật của cảnh
  const state = () => {
    const t = tuner?.state();
    return {
      level,
      steps: ladder.ids(),
      guarding,
      capped: t?.capped ?? false,
      gpu: timer.available, // máy đo được ms GPU: bộ điều chỉnh chẩn đoán theo tải
      locked: (t?.locked ?? []).map((i) => ladder.idAt(i)), // nấc bị khóa chống dao động: giữ tới khi tải lại trang
    };
  };
  const changed = () => {
    for (const cb of listeners) cb(state());
  };
  const act = (action) => {
    let done = true;
    if (action === 'down') done = ladder.down();
    else if (action === 'up') done = ladder.up();
    else ladder.reset();
    if (done) changed();
    return done;
  };
  return {
    state,
    degrade: () => act('down'),
    upgrade: () => act('up'),
    /** run.js gọi khi cảnh vừa live (sau hòa dần): từ đây bộ điều chỉnh mới đo. */
    start() {
      live = true;
    },
    /** Mỗi khung, trước khi vẽ: bộ quyết định nói hạ / nâng / trả lại hết thì áp ngay. true = đang thử ngừng vẽ: bỏ khung này. */
    sample(ms) {
      if (!live) return false;
      const action = tuner?.sample(ms, ladder);
      if (action === 'skip') return true;
      if (action) act(action);
      return false;
    },
    /** ms CPU của khung vừa vẽ, và mỗi mẫu ms GPU: "tải" của máy (tuner.js, đường tải). */
    cpu: (ms) => tuner?.cpu(ms),
    gpu: (ms) => tuner?.gpu(ms),
    /**
     * Thanh lớp mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên bộ điều chỉnh chỉ CANH:
     * chậm vừa phải thì để yên cho số đo trung thực, quá tải nặng thì vẫn hạ để máy không bị ép quá sức.
     */
    guard(on) {
      guarding = on;
      tuner?.guard(on);
      changed();
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
