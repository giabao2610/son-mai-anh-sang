// engine/gpu/layers.js — trọng số từng lớp (có tween), ctx của một lần dựng, và dựng các lớp theo thứ tự.
import { Color } from 'three/webgpu';
import { uniform, vec3 } from 'three/tsl';
import { mergePalette } from '../palette.js';
import { createKnobs } from './knob-set.js';

/** Mặc định của một lần tween trọng số (giây). Đủ chậm để thấy lớp "phủ" lên, đủ nhanh để không phải chờ. */
export const TWEEN_SECONDS = 0.8;

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
// smoothstep: bắt đầu và kết thúc êm, không giật ở hai đầu.
const ease = (s) => s * s * (3 - 2 * s);

/**
 * Trọng số 0 → 1 của từng lớp (luật 2): mỗi lớp MỘT uniform float.
 * Bật/tắt lớp chỉ đổi `.value` của uniform, nên shader KHÔNG biên dịch lại.
 * Riêng 'cot' luôn là 1 và không tắt được (luật 1).
 *
 * Tween chạy theo `dt` của đồng hồ xưởng (step mỗi khung), không theo đồng hồ tường: với ?freeze
 * mỗi khung là đúng 1/60 s, nên tween cũng tất định.
 * @param {{ id: string }[]} layerMetas  meta.layers của bức, đúng thứ tự phủ
 * @param {number} [initial]             trọng số ban đầu của các lớp khác Cốt
 */
export function createWeights(layerMetas, initial = 1) {
  const byId = new Map();
  for (const { id } of layerMetas) {
    byId.set(id, uniform(id === 'cot' ? 1 : initial).setName(`w_${id.replaceAll('-', '_')}`));
  }
  const tweens = new Map(); // id → { from, to, t, duration }

  const weight = (id) => {
    const u = byId.get(id);
    if (!u) throw new Error(`Không có lớp "${id}"`);
    return u;
  };

  return {
    weight,
    ids: [...byId.keys()],
    /** Đặt NGAY (bỏ tween đang chạy): e2e, restore(), và test dùng. */
    set(id, v) {
      const u = weight(id);
      if (id === 'cot') return;
      tweens.delete(id);
      u.value = clamp01(v);
    },
    /** Chuyển dần tới v trong `duration` giây; duration ≤ 0 thì đặt ngay. */
    tween(id, v, duration = TWEEN_SECONDS) {
      const u = weight(id);
      if (id === 'cot') return;
      if (duration <= 0) {
        tweens.delete(id);
        u.value = clamp01(v);
        return;
      }
      tweens.set(id, { from: u.value, to: clamp01(v), t: 0, duration });
    },
    /** Giá trị lớp đang hướng tới: đích của tween đang chạy, hoặc giá trị hiện tại. */
    target(id) {
      const u = weight(id);
      return tweens.get(id)?.to ?? u.value;
    },
    /** Mỗi khung: tiến mọi tween thêm dt giây. Trả true nếu còn tween đang chạy. */
    step(dt) {
      for (const [id, tw] of tweens) {
        tw.t = Math.min(tw.t + dt, tw.duration);
        byId.get(id).value = tw.from + (tw.to - tw.from) * ease(tw.t / tw.duration);
        if (tw.t >= tw.duration) tweens.delete(id);
      }
      return tweens.size > 0;
    },
  };
}

/**
 * EngineCtx của MỘT lần dựng (spec §8.4), cùng trọng số và env của núm. run.js và bộ dựng bức trong test
 * (tests/helpers/fake-ctx.js) cùng gọi hàm này, nên test dựng bức đúng như trình duyệt.
 * @param {object} p
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ backend: 'webgpu'|'webgl2', renderer: any, scene: any, camera: any, u: object }} p.stage
 * @param {'cao'|'vua'|'thap'} p.level
 * @param {Record<string, number>} p.budget
 * @param {boolean} p.mobile
 * @param {boolean} p.reducedMotion
 * @param {Date} p.now
 * @param {boolean} [p.debug]
 */
export function createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug = false }) {
  const hex = mergePalette(meta.palette);
  const weights = createWeights(meta.layers);
  /** @type {import('../contracts/runtime.js').EngineCtx} */
  const ctx = {
    tier: stage.backend,
    level,
    budget,
    mobile,
    reducedMotion,
    now,
    renderer: stage.renderer,
    scene: stage.scene,
    camera: stage.camera,
    palette: { hex, color: (token) => new Color(hex[token]) },
    u: stage.u,
    weight: (id) => weights.weight(id),
    debug,
  };
  /** @type {import('../contracts/runtime.js').KnobEnv} */
  const env = { tier: ctx.tier, level, budget, now, mobile };
  return { ctx, weights, env };
}

/**
 * Dựng các lớp theo ĐÚNG thứ tự của painting.layers. Mỗi lớp nhận ctx cộng knob()/knobValue() của riêng nó,
 * và CÙNG một object shared (lớp trước ghi shared.<id>, lớp sau đọc). Ngay sau createLayer, onKnob
 * của lớp được nối vào bộ núm: núm 'js'/'rebuild' nào thiếu hàm xử lý thì báo lỗi ngay lúc dựng.
 * Nếu một lớp ném lỗi: gỡ các lớp đã dựng theo thứ tự ngược rồi ném lại lỗi gốc,
 * để run.js về tầng tĩnh mà không để sót object nào trong scene.
 * @returns {{ id: string, module: object, layer: object, knobs: ReturnType<typeof createKnobs> }[]}
 */
export function buildLayers(modules, ctx, shared, env) {
  const built = [];
  try {
    for (const module of modules) {
      const knobs = createKnobs(module.id, module.knobs ?? [], env);
      // knob(id): uniform của núm 'uniform'; knobValue(id): giá trị ban đầu của MỌI núm (kể cả 'js'/'rebuild').
      const layer = module.createLayer({ ...ctx, knob: knobs.knob, knobValue: knobs.get }, shared);
      built.push({ id: module.id, module, layer, knobs });
      knobs.bind(layer.onKnob);
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
