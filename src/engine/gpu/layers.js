// engine/gpu/layers.js — trọng số từng lớp, uniform của núm dựng từ khai báo tĩnh, và dựng các lớp theo thứ tự.
import { Color } from 'three/webgpu';
import { uniform, vec3 } from 'three/tsl';

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
 * Trọng số 0 → 1 của từng lớp (luật 2): mỗi lớp MỘT uniform float.
 * Bật/tắt lớp chỉ đổi `.value` của uniform, nên shader KHÔNG biên dịch lại.
 * Riêng 'cot' luôn là 1 và không tắt được (luật 1).
 * @param {{ id: string }[]} layerMetas  meta.layers của bức, đúng thứ tự phủ
 * @param {number} [initial]             trọng số ban đầu của các lớp khác Cốt
 */
export function createWeights(layerMetas, initial = 1) {
  const byId = new Map();
  for (const { id } of layerMetas) {
    byId.set(id, uniform(id === 'cot' ? 1 : initial).setName(`w_${id.replaceAll('-', '_')}`));
  }

  const weight = (id) => {
    const u = byId.get(id);
    if (!u) throw new Error(`Không có lớp "${id}"`);
    return u;
  };

  return {
    weight,
    set(id, v) {
      const u = weight(id);
      if (id === 'cot') return;
      u.value = Math.min(Math.max(v, 0), 1);
    },
    ids: [...byId.keys()],
  };
}

/**
 * Giá trị mặc định của núm. `value` có thể là hàm của env (tầng, mức, đêm nay…).
 * @param {{ value: any }} knob
 * @param {{ tier: string, level: string, budget: Record<string, number>, now: Date, mobile: boolean }} env
 */
export function knobValue(knob, env) {
  return typeof knob.value === 'function' ? knob.value(env) : knob.value;
}

/**
 * Trần của núm theo tầng: `max` là một số, hoặc `{ webgpu, webgl2 }`.
 * @param {{ max?: number | { webgpu: number, webgl2: number } }} knob
 * @param {'webgpu' | 'webgl2'} tier
 */
export function knobMax(knob, tier) {
  return knob.max !== null && typeof knob.max === 'object' ? knob.max[tier] : knob.max;
}

/** Đổi giá trị JS của một núm thành uniform. 'select' giữ CHỈ SỐ lựa chọn, 'color' giữ THREE.Color. */
function knobUniform(layerId, knob, value) {
  const kind = knob.kind ?? 'number';
  if (kind === 'number' || kind === 'bool') return uniform(Number(value));
  if (kind === 'select') {
    const index = (knob.options ?? []).indexOf(value);
    if (index < 0) throw new Error(`Núm "${layerId}.${knob.id}": "${value}" không có trong options`);
    return uniform(index);
  }
  if (kind === 'color') return uniform(new Color(value));
  throw new Error(`Núm "${layerId}.${knob.id}" có kind lạ: "${kind}"`);
}

/**
 * Uniform cho mọi núm 'uniform' của MỘT lớp, dựng từ khai báo tĩnh `export const knobs`.
 * Xưởng tạo uniform, lớp chỉ đọc qua ctx.knob(id). Kéo núm = đổi `.value`, không biên dịch lại.
 * Núm 'js' / 'rebuild' không có uniform: lớp xử lý chúng qua onKnob (GĐ 2).
 * @param {string} layerId
 * @param {object[]} knobs
 * @param {object} env
 */
export function createKnobs(layerId, knobs, env) {
  const uniforms = {};
  for (const knob of knobs) {
    if ((knob.via ?? 'uniform') !== 'uniform') continue;
    uniforms[knob.id] = knobUniform(layerId, knob, knobValue(knob, env)).setName(uniformName(layerId, knob.id));
  }
  return {
    knob(id) {
      // Object.hasOwn: để knob('constructor') cũng báo lỗi thay vì trả hàm của Object.
      if (!Object.hasOwn(uniforms, id)) throw new Error(`Lớp "${layerId}" không có núm uniform "${id}"`);
      return uniforms[id];
    },
    uniforms,
  };
}

/**
 * Dựng các lớp theo ĐÚNG thứ tự của painting.layers. Mỗi lớp nhận ctx cộng knob() của riêng nó,
 * và CÙNG một object shared (lớp trước ghi shared.<id>, lớp sau đọc).
 * Nếu một lớp ném lỗi: gỡ các lớp đã dựng theo thứ tự ngược rồi ném lại lỗi gốc,
 * để run.js về tầng tĩnh mà không để sót object nào trong scene.
 * @returns {{ id: string, module: object, layer: object, knobs: ReturnType<typeof createKnobs> }[]}
 */
export function buildLayers(modules, ctx, shared, env) {
  const built = [];
  try {
    for (const module of modules) {
      const knobs = createKnobs(module.id, module.knobs ?? [], env);
      const layer = module.createLayer({ ...ctx, knob: knobs.knob }, shared);
      built.push({ id: module.id, module, layer, knobs });
    }
  } catch (err) {
    for (const { id, layer } of [...built].reverse()) {
      try {
        layer?.dispose?.();
      } catch (disposeErr) {
        console.error(`Gỡ lớp "${id}" bị lỗi:`, disposeErr);
      }
    }
    throw err;
  }
  return built;
}

/**
 * Lưới an toàn của luật 8. Kênh MRT 'emissive' đọc emissive của MỌI material trong scene pass.
 * Material node không có emissiveNode, cũng không có màu `.emissive` (MeshBasic, Sprite…), sinh ra
 * GLSL khai báo biến emissive mà không gán giá trị đầu: SwiftShader đọc ra 0, GPU thật có thể ra rác.
 * Gán vec3(0) TRƯỚC khi biên dịch. MeshStandard/Physical đã có `.emissive` (đen) nên để yên.
 * @param {import('three/webgpu').Scene} scene
 * @param {{ warn?: (name: string) => void }} [options]
 * @returns {number} số material đã sửa
 */
export function ensureEmissive(scene, { warn } = {}) {
  let fixed = 0;
  scene.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material?.isNodeMaterial || material.emissiveNode != null || material.emissive?.isColor) continue;
      material.emissiveNode = vec3(0);
      fixed += 1;
      warn?.(material.name || material.type);
    }
  });
  return fixed;
}
