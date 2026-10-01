// engine/gpu/knob-set.js — bộ núm của MỘT lớp: uniform cho núm 'uniform', giá trị hiện tại của mọi núm, và đường tới onKnob.
import { Color } from 'three/webgpu';
import { uniform } from 'three/tsl';

/**
 * Tên uniform của một núm. setName() đưa tên này THẲNG vào mã WGSL/GLSL sinh ra,
 * nên không được có '-': ('phu-bong', 'exposure') → 'phu_bong_exposure'.
 * @param {string} layerId
 * @param {string} knobId
 */
export function uniformName(layerId, knobId) {
  return `${layerId.replaceAll('-', '_')}_${knobId}`;
}

/**
 * Giá trị mặc định của núm. `value` có thể là hàm của env (tầng, mức, đêm nay…).
 * @param {{ value: any }} knob
 * @param {import('../contracts/runtime.js').KnobEnv} env
 */
export function knobValue(knob, env) {
  return typeof knob.value === 'function' ? knob.value(env) : knob.value;
}

/**
 * Trần của núm: `max` là một số, `{ webgpu, webgl2 }` (theo tầng), hoặc (GĐ 3) một hàm của env, như `value`:
 * trần theo mức chất lượng, để người xem không kéo được máy yếu quá sức (spec §10).
 * @param {{ max?: number | { webgpu: number, webgl2: number } | ((env: import('../contracts/runtime.js').KnobEnv) => number) }} knob
 * @param {import('../contracts/runtime.js').KnobEnv} env
 */
export function knobMax(knob, env) {
  if (typeof knob.max === 'function') return knob.max(env);
  return knob.max !== null && typeof knob.max === 'object' ? knob.max[env.tier] : knob.max;
}

const viaOf = (knob) => knob.via ?? 'uniform';

/**
 * Kiểm trần của một núm số ngay lúc dựng (GĐ 4): max() trả NaN hay undefined thì Math.min lặng lẽ bỏ trần (hay ra NaN),
 * và trần nhỏ hơn min thì núm không có giá trị nào hợp lệ. Cả hai là lỗi của khai báo: báo ngay, đừng để người xem gặp.
 */
function checkMax(layerId, knob, env) {
  if ((knob.kind ?? 'number') !== 'number' || knob.max === undefined) return;
  const max = knobMax(knob, env);
  if (Number.isFinite(max) && (knob.min === undefined || max >= knob.min)) return;
  throw new Error(`Lớp "${layerId}": trần của núm "${knob.id}" là ${max} ở tầng ${env.tier}, mức ${env.level}; `
    + `phải là số hữu hạn và không nhỏ hơn min (${knob.min})`);
}

/**
 * Đưa một giá trị về đúng kiểu của núm. Số bị kẹp trong [min, trần]; màu là '#rrggbb' chữ thường;
 * 'select' phải là một id trong options. Nhờ vậy snapshot() luôn là JSON gọn, và Sổ tay không đưa được số lạ vào.
 * @param {string} layerId
 * @param {import('../contracts/runtime.js').Knob} knob
 * @param {any} raw
 * @param {import('../contracts/runtime.js').KnobEnv} env  tầng, mức… của máy này (trần của núm có thể tính từ đây)
 */
export function normalizeKnob(layerId, knob, raw, env) {
  const kind = knob.kind ?? 'number';
  const name = `Núm "${layerId}.${knob.id}"`;
  if (kind === 'number') {
    let v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`${name}: "${raw}" không phải số`);
    const max = knobMax(knob, env);
    if (knob.min !== undefined) v = Math.max(v, knob.min);
    if (max !== undefined) v = Math.min(v, max);
    return v;
  }
  if (kind === 'bool') return Boolean(raw);
  if (kind === 'select') {
    if (!(knob.options ?? []).includes(raw)) throw new Error(`${name}: "${raw}" không có trong options`);
    return raw;
  }
  if (kind === 'color') {
    if (!/^#[0-9a-f]{6}$/i.test(String(raw))) throw new Error(`${name}: màu phải có dạng #rrggbb, nhận "${raw}"`);
    return String(raw).toLowerCase();
  }
  throw new Error(`${name} có kind lạ: "${kind}"`);
}

/** Uniform của núm 'uniform'. 'select' giữ CHỈ SỐ lựa chọn, 'color' giữ THREE.Color, 'bool' giữ 1/0. */
function knobUniform(knob, value) {
  const kind = knob.kind ?? 'number';
  if (kind === 'select') return uniform(knob.options.indexOf(value));
  if (kind === 'color') return uniform(new Color(value));
  return uniform(Number(value));
}

/** Đổi `.value` của uniform sẵn có: không tạo node mới, nên không biên dịch lại. */
function assignUniform(u, knob, value) {
  const kind = knob.kind ?? 'number';
  if (kind === 'select') u.value = knob.options.indexOf(value);
  else if (kind === 'color') u.value.set(value);
  else u.value = Number(value);
}

/**
 * Bộ núm của MỘT lớp, dựng từ khai báo tĩnh `export const knobs`.
 * - Núm 'uniform': xưởng tạo uniform, lớp đọc qua ctx.knob(id). Đổi núm = đổi `.value`, không biên dịch lại.
 * - Núm 'js' / 'rebuild': không có uniform; set() gọi `layer.onKnob[id](v)` (có thể trả Promise khi phải dựng lại).
 * Mọi núm đều có giá trị hiện tại (values()): Sổ tay đọc để vẽ, snapshot() đọc để lưu.
 * @param {string} layerId
 * @param {import('../contracts/runtime.js').Knob[]} knobs
 * @param {import('../contracts/runtime.js').KnobEnv} env
 */
export function createKnobs(layerId, knobs, env) {
  const specs = new Map();
  const uniforms = {};
  const values = {};
  for (const knob of knobs) {
    if (specs.has(knob.id)) throw new Error(`Lớp "${layerId}" khai báo núm "${knob.id}" hai lần`);
    checkMax(layerId, knob, env);
    specs.set(knob.id, knob);
    const value = normalizeKnob(layerId, knob, knobValue(knob, env), env);
    values[knob.id] = value;
    if (viaOf(knob) === 'uniform') uniforms[knob.id] = knobUniform(knob, value).setName(uniformName(layerId, knob.id));
  }
  let handlers = {};

  const spec = (id) => {
    // Object.hasOwn/Map: để id như 'constructor' cũng báo lỗi thay vì trả thứ của Object.
    if (!specs.has(id)) throw new Error(`Lớp "${layerId}" không có núm "${id}"`);
    return specs.get(id);
  };

  return {
    knob(id) {
      if (!Object.hasOwn(uniforms, id)) throw new Error(`Lớp "${layerId}" không có núm uniform "${id}"`);
      return uniforms[id];
    },
    uniforms,
    /** Nối onKnob của lớp (buildLayers gọi ngay sau createLayer). Thiếu hàm cho núm 'js'/'rebuild' thì ném lỗi. */
    bind(onKnob = {}) {
      for (const knob of specs.values()) {
        const via = viaOf(knob);
        if (via !== 'uniform' && typeof onKnob[knob.id] !== 'function') {
          throw new Error(`Lớp "${layerId}": núm '${via}' "${knob.id}" chưa có hàm onKnob.${knob.id}`);
        }
      }
      handlers = onKnob;
    },
    /** Giá trị hiện tại của một núm (kiểu JS: số, chuỗi, '#rrggbb', true/false). */
    get(id) {
      spec(id);
      return values[id];
    },
    /**
     * Đổi một núm. Trả về thứ onKnob trả về (Promise khi lớp phải dựng lại), hoặc undefined với núm 'uniform'.
     * @param {string} id
     * @param {any} raw
     */
    set(id, raw) {
      const knob = spec(id);
      const value = normalizeKnob(layerId, knob, raw, env);
      if (viaOf(knob) === 'uniform') {
        assignUniform(uniforms[id], knob, value);
        values[id] = value;
        return undefined;
      }
      // Chỉ ghi giá trị khi lớp đã áp xong: onKnob ném lỗi thì snapshot() không mang một giá trị cảnh chưa từng có
      // (nếu không, "Dựng lại cảnh" sẽ restore đúng giá trị hỏng đó).
      const result = handlers[id](value);
      if (typeof result?.then !== 'function') {
        values[id] = value;
        return result;
      }
      return result.then((done) => {
        values[id] = value;
        return done;
      });
    },
    /** Bản sao giá trị hiện tại của mọi núm: { knobId: value }. */
    values: () => ({ ...values }),
  };
}
