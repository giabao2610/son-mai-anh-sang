// engine/gpu/recipe-set.js — công thức của MỘT cảnh (GĐ 9): mặc định của máy đang xem, phân loại mục của #r= thành trọng số/núm/Dial, khác biệt, tóm tắt, và ba hàm của bàn thợ.
import { RECIPE_PREFIX, formatValue, readRecipe, stepDecimals, writeRecipe } from '../recipe.js';
import { knobValue, normalizeKnob } from './knob-set.js';

const WEIGHT_DECIMALS = 2;
const kindOf = (knob) => knob.kind ?? 'number';
const MAX_PROBLEM = 60;

/** Mục hỏng của link có thể mang chữ dài do người dùng gõ: cắt mỗi mục trước khi đưa vào console. */
export const showProblems = (problems) => problems.map((p) => (p.length > MAX_PROBLEM ? `${p.slice(0, MAX_PROBLEM)}…` : p)).join(', ');

/** Người nghe thay đổi của bàn thợ (studio.onChange): add(cb) trả hàm bỏ nghe, fire() báo tất cả. */
export function createListeners() {
  const set = new Set();
  return {
    add(cb) {
      set.add(cb);
      return () => set.delete(cb);
    },
    fire() {
      for (const cb of [...set]) cb();
    },
  };
}

/** Chữ của công thức thành giá trị của núm (chưa kẹp: normalizeKnob làm); không đổi được thì ném lỗi. */
function parseKnob(knob, raw) {
  const kind = kindOf(knob);
  if (kind === 'number') {
    const v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`"${raw}" không phải số`);
    return v;
  }
  if (kind === 'bool') {
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    throw new Error(`"${raw}" không phải 1 hay 0`);
  }
  if (kind === 'color') {
    if (!/^[0-9a-f]{6}$/i.test(raw)) throw new Error(`"${raw}" không phải màu rrggbb`);
    return `#${raw.toLowerCase()}`;
  }
  return raw; // select: normalizeKnob kiểm có trong options
}

/**
 * @param {object} p
 * @param {{ id: string, knobs?: object[] }[]} p.modules   painting.layers (khai báo tĩnh), đúng thứ tự phủ
 * @param {import('../contracts/runtime.js').KnobEnv} p.env   tầng, mức của máy này: mặc định và trần của núm theo đó
 * @param {{ id: string, step?: number }[]} [p.dials]   setup().dials
 * @param {Record<string, number>} [p.dialDefaults]     giá trị Dial ngay sau setup(), TRƯỚC khi áp công thức
 */
export function createRecipeSet({ modules, env, dials = [], dialDefaults = {} }) {
  const layerIds = modules.map((m) => m.id);
  const knobs = new Map(); // 'layer.knob' → { layerId, knob }, theo thứ tự lớp rồi thứ tự khai báo
  for (const m of modules) for (const k of m.knobs ?? []) knobs.set(`${m.id}.${k.id}`, { layerId: m.id, knob: k });
  const dialById = new Map(dials.map((d) => [d.id, d]));
  const defaults = Object.freeze({
    weights: Object.fromEntries(layerIds.map((id) => [id, 1])),
    knobs: Object.fromEntries([...knobs].map(([key, { layerId, knob }]) => [key, normalizeKnob(layerId, knob, knobValue(knob, env), env)])),
    dials: { ...dialDefaults },
  });
  const knobText = ({ knob }, v) => formatValue(kindOf(knob), v, stepDecimals(knob.step));
  const dialText = (dial, v) => formatValue('number', v, stepDecimals(dial.step));
  const one = formatValue('number', 1, WEIGHT_DECIMALS);

  return {
    defaults,
    /** Mục của readRecipe → { weights, knobs, dials, problems } (spec §21.4). Giá trị đã đổi kiểu và kẹp theo trần của máy này. */
    classify(entries) {
      const out = { weights: {}, knobs: {}, dials: {}, problems: [] };
      for (const { key, value } of entries) {
        try {
          const knob = knobs.get(key);
          if (knob) {
            out.knobs[key] = normalizeKnob(knob.layerId, knob.knob, parseKnob(knob.knob, value), env);
          } else if (layerIds.includes(key)) {
            if (key === 'cot') throw new Error('Cốt luôn là 1 (luật 1)');
            const w = Number(value);
            if (!Number.isFinite(w)) throw new Error(`"${value}" không phải số`);
            out.weights[key] = Math.min(Math.max(w, 0), 1);
          } else if (dialById.has(key)) {
            const v = Number(value);
            if (!Number.isFinite(v)) throw new Error(`"${value}" không phải số`);
            out.dials[key] = v; // dial-set.js kẹp và làm tròn theo step khi đặt
          } else {
            throw new Error('khóa lạ');
          }
        } catch (err) {
          out.problems.push(`${key}:${value} (${err.message})`);
        }
      }
      return out;
    },
    /**
     * Giá trị của snapshot khác mặc định, theo thứ tự cố định (spec §21.2). So bằng CHỮ đã làm tròn theo step, nên sai số dấu phẩy động
     * của thanh trượt không tính là đã đổi.
     * @returns {{ key: string, value: string, kind: 'weight' | 'knob' | 'dial' }[]}
     */
    diff(snapshot) {
      const entries = [];
      for (const id of layerIds) {
        const w = snapshot.weights?.[id];
        if (id === 'cot' || w === undefined) continue;
        const text = formatValue('number', w, WEIGHT_DECIMALS);
        if (text !== one) entries.push({ key: id, value: text, kind: 'weight' });
      }
      for (const [key, spec] of knobs) {
        if (!(key in (snapshot.knobs ?? {}))) continue;
        const text = knobText(spec, snapshot.knobs[key]);
        if (text !== knobText(spec, defaults.knobs[key])) entries.push({ key, value: text, kind: 'knob' });
      }
      for (const [id, dial] of dialById) {
        const v = snapshot.dials?.[id];
        if (v === undefined || defaults.dials[id] === undefined) continue;
        const text = dialText(dial, v);
        if (text !== dialText(dial, defaults.dials[id])) entries.push({ key: id, value: text, kind: 'dial' });
      }
      return entries;
    },
    /** Cho dòng tóm tắt: số lớp, số núm đã khác mặc định, và id các Dial đã khác. */
    countsOf(entries) {
      return {
        layers: entries.filter((e) => e.kind === 'weight').length,
        knobs: entries.filter((e) => e.kind === 'knob').length,
        dials: entries.filter((e) => e.kind === 'dial').map((e) => e.key),
      };
    },
  };
}

/**
 * Ba hàm công thức của bàn thợ (studio.js trải vào API của nó; tách ra đây cho studio.js dưới 250 dòng).
 * @param {ReturnType<typeof createRecipeSet>} recipes
 * @param {{ snapshot: () => object, restore: (s: object) => Promise<void>, tweenAll: () => void }} studio
 */
export function recipeMethods(recipes, { snapshot, restore, tweenAll }) {
  const recipe = () => {
    const entries = recipes.diff(snapshot());
    return { text: writeRecipe(entries), counts: recipes.countsOf(entries) };
  };
  return {
    /** Công thức hiện tại: text (không có '#r='; rỗng là nguyên bản) và counts cho dòng tóm tắt. */
    recipe,
    /** Áp một công thức (chuỗi sau '#r=') thành trạng thái ĐỦ: thứ gì công thức không nói thì về mặc định (spec §21.2). */
    async applyRecipe(text) {
      const read = readRecipe(RECIPE_PREFIX + text) ?? { entries: [], problems: [] };
      const { weights, knobs, dials, problems } = recipes.classify(read.entries);
      const all = [...read.problems, ...problems];
      if (all.length > 0) console.warn(`Công thức: bỏ ${all.length} mục không áp được: ${showProblems(all)}`);
      const d = recipes.defaults;
      await restore({ weights: { ...d.weights, ...weights }, knobs: { ...d.knobs, ...knobs }, dials: { ...d.dials, ...dials } });
      return { counts: recipe().counts, problems: all };
    },
    /** Về nguyên bản: trọng số phủ lại dần (như công tắc của thanh lớp), núm và Dial về mặc định ngay. */
    async reset() {
      tweenAll();
      await restore({ knobs: recipes.defaults.knobs, dials: recipes.defaults.dials });
    },
  };
}

/**
 * Bàn thợ dựng không có recipe-set của cảnh (test): dựng từ trạng thái hiện tại của lớp và Dial.
 * @param {{ module: object }[]} layers   kết quả của buildLayers
 * @param {import('../contracts/runtime.js').KnobEnv} env
 * @param {ReturnType<import('./dial-set.js').createDialSet>} dials
 */
export const recipesFromState = (layers, env, dials) => createRecipeSet({
  modules: layers.map((b) => b.module), env, dials: dials.list(), dialDefaults: dials.snapshot(),
});
