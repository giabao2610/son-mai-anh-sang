// tests/helpers/fake-ctx.js — dựng một bức trong Node (không GPU) giống run.js: EngineCtx giả, setup(), rồi các lớp theo thứ tự.
import { vi } from 'vitest';
import { Color, PerspectiveCamera, Scene, Vector2 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { mergePalette } from '../../src/engine/palette.js';
import { buildLayers, createWeights } from '../../src/engine/gpu/layers.js';

/** "Bây giờ" mặc định của test: 21:00 giờ Việt Nam, ngày 18 tháng Tám năm Bính Ngọ. */
export const NOW = new Date('2026-09-28T21:00:00+07:00');

/**
 * EngineCtx giả, cùng hình dạng với ctx của run.js. Scene, camera, uniform là đồ thật của three
 * (dựng được node graph trong Node); renderer chỉ ghi lời gọi compute và giữ cờ shadowMap.
 * @param {object} meta  PaintingMeta
 */
export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, reducedMotion = false, tier = 'webgpu' } = {}) {
  const hex = mergePalette(meta.palette);
  const weights = createWeights(meta.layers);
  return {
    tier,
    level,
    budget,
    mobile: false,
    reducedMotion,
    now,
    renderer: { compute: vi.fn(), shadowMap: { enabled: false } },
    scene: new Scene(),
    camera: new PerspectiveCamera(40, 1.6, 0.1, 500),
    palette: { hex, color: (token) => new Color(hex[token]) },
    u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
    weight: weights.weight,
    weights, // chỉ test dùng: đặt trọng số bằng weights.set(id, v)
    debug: false,
  };
}

/**
 * Dựng bức như run.js: setup(ctx) rồi buildLayers (cùng hàm của xưởng). `until` = id lớp cuối cần dựng.
 * @returns {{ ctx: object, setup: object | undefined, shared: object, layers: Record<string, object> }}
 */
export function buildPainting(painting, meta, { until, ...options } = {}) {
  const ctx = makeEngineCtx(meta, options);
  const setup = painting.setup?.(ctx);
  const shared = setup?.shared ?? {};
  const end = until ? painting.layers.findIndex((m) => m.id === until) + 1 : painting.layers.length;
  const env = { tier: ctx.tier, level: ctx.level, budget: ctx.budget, now: ctx.now, mobile: ctx.mobile };
  const built = buildLayers(painting.layers.slice(0, end), ctx, shared, env);
  return { ctx, setup, shared, layers: Object.fromEntries(built.map((b) => [b.id, b.layer])) };
}
