// engine/gpu/studio.js — bàn thợ: gom trọng số, núm, thí nghiệm, số đo và nấc chất lượng thành MỘT API cho Sổ tay và __sma.
import { knobMax } from './knob-set.js';
import { TWEEN_SECONDS } from './layers.js';
import { createMeter } from './meter.js';
import { createDialSet } from './dial-set.js';
import { createListeners, recipeMethods, recipesFromState } from './recipe-set.js';

/** Cảnh không có hộp đồ nghề (test): không có công cụ nào. */
const NO_TOOLS = Object.freeze({
  list: () => [],
  set: (id) => {
    if (id !== null) throw new Error(`Không có công cụ "${id}"`);
  },
});
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
 * @param {{ list: () => { id: string, on: boolean }[], set: (id: string | null) => void }} [p.toolbox]  công cụ học (toolbox.js)
 * @param {ReturnType<typeof createDialSet>} [p.dials]   núm của cả bức (dial-set.js)
 * @param {ReturnType<import('./translate.js').createTranslator> | null} [p.translator]   Bản dịch (GĐ 9); test không có
 * @param {ReturnType<import('./recipe-set.js').createRecipeSet> | null} [p.recipes]   công thức (GĐ 9, scene.js đưa vào); thiếu thì dựng từ trạng thái hiện tại
 * @returns {ReturnType<typeof createMeter> & object}  measure() và gpu() của bộ đo: scene.js đưa số vào mỗi khung
 */
export function createStudio({
  meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY, toolbox = NO_TOOLS,
  dials = createDialSet(), translator = null, recipes = null,
}) {
  const listeners = createListeners();
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

  const studio = {
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
    weight: (id) => ({ value: weights.weight(layerOf(id).id).value, target: weights.target(id) }),
    /** tween: true cho thanh lớp ("phủ" dần); false (mặc định) đặt ngay rồi vẽ lại: __sma và e2e dùng. */
    async setWeight(id, v, { tween = false } = {}) {
      layerOf(id);
      if (tween) {
        weights.tween(id, v, tweenSeconds);
      } else {
        weights.set(id, v);
        await redraw();
      }
      listeners.fire(); // cả hai nhánh
    },

    /** Giá trị hiện tại của mọi núm của một lớp: { knobId: value }. */
    knobs: (layerId) => layerOf(layerId).knobs.values(),
    /** Đổi một núm; xong khi lớp đã áp giá trị (núm 'rebuild' có thể mất vài chục ms). */
    setKnob(layerId, knobId, value) {
      return settle(() => layerOf(layerId).knobs.set(knobId, value)).finally(listeners.fire);
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
    /** Báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu); trả hàm bỏ nghe. */
    onQuality: (cb) => quality.onChange(cb),

    /** Công cụ học (GĐ 4): [{ id, on }] theo thứ tự tools/index.js (nút "Đồ nghề" của thanh lớp). */
    tools: () => toolbox.list(),
    /** Bật một công cụ (tắt cái đang bật), hay null để tắt hết; xong khi khung đã vẽ lại. */
    setTool(id) {
      return settle(() => toolbox.set(id));
    },

    /** Núm của cả bức (GĐ 4): [{ id, min, max, step, value, text, note }] (text cũng là aria-valuetext của thanh trượt). */
    dials: () => dials.list(),
    /** Đổi một Dial (kẹp theo min/max/step); xong khi khung đã vẽ lại. */
    setDial(id, v) {
      return settle(() => dials.set(id, v)).finally(listeners.fire);
    },

    /**
     * Bản dịch của một lớp (GĐ 9, spec §21.3): Promise<Translation>, bắt từ khung vẽ kế tiếp; cảnh không có bộ dịch (test) thì Promise hỏng.
     */
    translation(layerId) {
      layerOf(layerId);
      return translator ? translator.translation(layerId) : Promise.reject(new Error('Cảnh này không có bản dịch'));
    },

    /**
     * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }, và (GĐ 4)
     * dials: { dialId: số } khi bức có Dial. Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
     */
    snapshot() {
      const knobs = {};
      for (const { id, knobs: set } of layers) {
        for (const [knobId, value] of Object.entries(set.values())) knobs[`${id}.${knobId}`] = value;
      }
      const snap = { weights: Object.fromEntries(weights.ids.map((id) => [id, weights.target(id)])), knobs };
      if (dials.size > 0) snap.dials = dials.snapshot();
      return snap;
    },
    /**
     * Áp lại một snapshot: trọng số đặt ngay; núm nào khác giá trị hiện tại thì set (chờ lần lượt, vì núm
     * 'rebuild' có thể dựng lại hình). Id lạ (lớp hay núm không còn) hay núm áp không được thì bỏ qua kèm cảnh báo:
     * "Dựng lại cảnh" gọi hàm này, và một núm hỏng không được kéo cả cảnh về tầng tĩnh (spec §9).
     */
    async restore({ weights: w = {}, knobs = {}, dials: dialValues = {} } = {}) {
      try {
        dials.restore(dialValues, { exact: true }); // giá trị của chính Dial (mặc định có thể lệch nấc): không làm tròn lại
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
        listeners.fire();
      }
    },
    /** GĐ 9: onChange(cb) báo sau mỗi thay đổi của người xem (không báo thí nghiệm, công cụ, nấc), trả hàm bỏ nghe; recipe/applyRecipe/reset: recipe-set.js. */
    onChange: listeners.add,
    ...recipeMethods(recipes ?? recipesFromState(layers, env, dials), {
      snapshot: () => studio.snapshot(), restore: (s) => studio.restore(s),
      tweenAll: () => weights.ids.forEach((id) => weights.tween(id, 1, tweenSeconds)),
    }),
  };
  return studio;
}
