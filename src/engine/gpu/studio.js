// engine/gpu/studio.js — bàn thợ: gom trọng số, núm, thí nghiệm, số đo và nấc chất lượng thành MỘT API cho Sổ tay và __sma.
import { knobMax } from './knob-set.js';
import { TWEEN_SECONDS } from './layers.js';
import { createMeter } from './meter.js';

/** Cảnh không có bộ điều chỉnh (test, bức cũ): nấc không có gì để hạ. */
const NO_QUALITY = Object.freeze({
  state: () => ({ level: null, steps: [], guarding: false, capped: false, gpu: false, locked: [] }),
  degrade: () => false,
  upgrade: () => false,
  onChange: () => () => {},
});

/**
 * Sổ tay (ui/) không được import engine/ hay three: nó chỉ thấy object này. Mọi thay đổi đi qua đây:
 * trọng số (tween hoặc đặt ngay), núm (uniform hoặc onKnob), thí nghiệm (toggle).
 *
 * Khi vòng lặp đã dừng (?freeze=N đã tới khung N), mỗi thay đổi gọi redraw() để vẽ lại ĐÚNG khung đó
 * với giá trị mới mà không tiến đồng hồ: e2e so được ảnh trước và sau ở cùng một khung. Mọi hàm đổi trạng thái
 * trả Promise, xong khi khung đã được vẽ lại (hoặc ngay, nếu vòng lặp đang chạy).
 *
 * @param {object} p
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ id: string, module: object, layer: object, knobs: object }[]} p.layers  kết quả của buildLayers
 * @param {ReturnType<import('./layers.js').createWeights>} p.weights
 * @param {import('../contracts/runtime.js').KnobEnv} p.env   tầng, mức… của máy: trần của núm (có thể theo mức)
 * @param {() => (void | Promise<void>)} [p.redraw]    vẽ lại khung hiện tại nếu vòng lặp đã dừng
 * @param {number} [p.tweenSeconds]                    0 khi người xem xin giảm chuyển động
 * @param {{ state: () => object, degrade: () => boolean, upgrade: () => boolean, onChange: (cb: Function) => Function }} [p.quality]
 *   bộ điều chỉnh của cảnh (scene.js): mức, nấc đang hạ, hạ/nâng tay một nấc
 * @returns {ReturnType<typeof createMeter> & object}  measure() và gpu() của bộ đo: scene.js đưa số vào mỗi khung
 */
export function createStudio({ meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY }) {
  const byId = new Map(layers.map((b) => [b.id, b]));
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  const experimentsOn = new Set(); // 'layerId.expId' đang bật
  // Thí nghiệm 'compare': bộ đo ghi số riêng cho lúc tắt (off) và lúc bật (on).
  const meter = createMeter(layers.flatMap(({ id, layer }) => (layer.experiments ?? [])
    .filter((e) => e.kind === 'compare')
    .map((e) => `${id}.${e.id}`)));

  const layerOf = (id) => {
    const built = byId.get(id);
    if (!built) throw new Error(`Không có lớp "${id}"`);
    return built;
  };
  const experimentOf = (layerId, expId) => {
    const exp = (layerOf(layerId).layer.experiments ?? []).find((e) => e.id === expId);
    if (!exp) throw new Error(`Lớp "${layerId}" không có thí nghiệm "${expId}"`);
    return exp;
  };
  // Thay đổi có thể trả Promise (núm 'rebuild', thí nghiệm dựng lại hình): chờ xong rồi mới vẽ lại.
  const settle = async (change) => {
    try {
      await change();
    } finally {
      await redraw();
    }
  };

  return {
    /** Khai báo tĩnh cho Sổ tay, theo thứ tự phủ: núm (trần đã tính theo tầng), thí nghiệm, số đo. */
    layers() {
      return layers.map(({ id, module, layer }) => ({
        id,
        name: names.get(id) ?? id,
        knobs: (module.knobs ?? []).map((k) => ({
          id: k.id,
          kind: k.kind ?? 'number',
          via: k.via ?? 'uniform',
          min: k.min,
          max: knobMax(k, env),
          step: k.step,
          options: k.options,
        })),
        experiments: (layer.experiments ?? []).map((e) => ({ id: e.id, kind: e.kind ?? 'toggle' })),
        readouts: (layer.readouts ?? []).map((r) => ({ id: r.id, unit: r.unit ?? '' })),
      }));
    },

    /** Trọng số hiện tại và đích đang hướng tới (thanh lớp vẽ cả hai khi đang tween). */
    weight(id) {
      layerOf(id);
      return { value: weights.weight(id).value, target: weights.target(id) };
    },
    /** tween: true cho thanh lớp (lớp "phủ" dần); false (mặc định) đặt ngay rồi vẽ lại: __sma và e2e dùng. */
    async setWeight(id, v, { tween = false } = {}) {
      layerOf(id);
      if (tween) {
        weights.tween(id, v, tweenSeconds);
        return;
      }
      weights.set(id, v);
      await redraw();
    },

    /** Giá trị hiện tại của mọi núm của một lớp: { knobId: value }. */
    knobs: (layerId) => layerOf(layerId).knobs.values(),
    /** Đổi một núm; Promise xong khi lớp đã áp giá trị (núm 'rebuild' có thể mất vài chục ms). */
    setKnob(layerId, knobId, value) {
      return settle(() => layerOf(layerId).knobs.set(knobId, value));
    },

    experiment(layerId, expId) {
      experimentOf(layerId, expId);
      return experimentsOn.has(`${layerId}.${expId}`);
    },
    async toggleExperiment(layerId, expId, on) {
      const exp = experimentOf(layerId, expId);
      await settle(() => exp.toggle(on));
      if (on) experimentsOn.add(`${layerId}.${expId}`);
      else experimentsOn.delete(`${layerId}.${expId}`);
      meter.toggled(`${layerId}.${expId}`, on);
    },
    /**
     * Số đo của một thí nghiệm 'compare': { off, on }, mỗi bên { ms, cpuMs, gpuMs } (trung bình trượt; gpuMs null khi máy
     * không đo được), hay null khi chưa đo. Thí nghiệm kiểu khác thì cả hai là null.
     */
    compare(layerId, expId) {
      experimentOf(layerId, expId);
      return meter.compare(`${layerId}.${expId}`);
    },

    /** Số đo riêng của lớp, đọc ngay lúc gọi. */
    readouts(layerId) {
      return (layerOf(layerId).layer.readouts ?? []).map((r) => ({ id: r.id, value: r.get(), unit: r.unit ?? '' }));
    },
    /** Số đo của xưởng, của khung vừa vẽ: draw call, tam giác, ms giữa hai khung, ms CPU, ms GPU (null: máy không đo được). */
    stats: meter.stats,
    /** scene.js gọi cuối mỗi khung (xem meter.js). */
    measure: meter.measure,
    /** scene.js gọi mỗi khi gpu-timer có một mẫu ms GPU. */
    gpu: meter.gpu,

    /**
     * Bộ điều chỉnh: { level, steps: id các nấc đang hạ, guarding (Sổ tay mở: chỉ canh quá tải nặng), capped (nhịp bị khóa),
     * gpu (máy đo được ms GPU: chẩn đoán theo tải), locked: id các nấc bị khóa chống dao động }.
     */
    quality: () => quality.state(),
    /** Hạ tay MỘT nấc (DevTools, e2e); false khi hết thang. Xong khi khung đã vẽ lại (nếu ?freeze đã dừng). */
    async degrade() {
      let done = false;
      await settle(() => {
        done = quality.degrade();
      });
      return done;
    },
    /** Nâng tay MỘT nấc (gỡ nấc hạ gần nhất); false khi không còn nấc nào. */
    async upgrade() {
      let done = false;
      await settle(() => {
        done = quality.upgrade();
      });
      return done;
    },
    /** Báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu). Trả hàm bỏ nghe. */
    onQuality: (cb) => quality.onChange(cb),

    /**
     * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }.
     * Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
     */
    snapshot() {
      const knobs = {};
      for (const { id, knobs: set } of layers) {
        for (const [knobId, value] of Object.entries(set.values())) knobs[`${id}.${knobId}`] = value;
      }
      return { weights: Object.fromEntries(weights.ids.map((id) => [id, weights.target(id)])), knobs };
    },
    /**
     * Áp lại một snapshot: trọng số đặt ngay; núm nào khác giá trị hiện tại thì set (chờ lần lượt, vì núm
     * 'rebuild' có thể dựng lại hình). Id lạ (lớp hay núm không còn) hay núm áp không được thì bỏ qua kèm cảnh báo:
     * "Dựng lại cảnh" gọi hàm này, và một núm hỏng không được kéo cả cảnh về tầng tĩnh (spec §9).
     */
    async restore({ weights: w = {}, knobs = {} } = {}) {
      try {
        for (const [id, v] of Object.entries(w)) {
          if (byId.has(id)) weights.set(id, v);
          else console.warn(`restore: bỏ qua trọng số của lớp lạ "${id}"`);
        }
        for (const [key, v] of Object.entries(knobs)) {
          const dot = key.indexOf('.');
          const built = byId.get(key.slice(0, dot));
          const knobId = key.slice(dot + 1);
          if (!built || !Object.hasOwn(built.knobs.values(), knobId)) {
            console.warn(`restore: bỏ qua núm lạ "${key}"`);
            continue;
          }
          if (built.knobs.get(knobId) === v) continue;
          try {
            await built.knobs.set(knobId, v);
          } catch (err) {
            console.warn(`restore: núm "${key}" áp không được, giữ giá trị cũ:`, err);
          }
        }
      } finally {
        await redraw();
      }
    },
  };
}
