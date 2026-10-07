// tests/helpers/fake-ctx.js — dựng một bức trong Node (không GPU) giống run.js: sân khấu giả (camera dựng theo painting.camera, GĐ 8), createCtx, setup(), rồi các lớp theo thứ tự.
import { vi } from 'vitest';
import { PerspectiveCamera, Scene, Vector2 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { buildLayers, createCtx } from '../../src/engine/gpu/layers.js';
import { createCamera } from '../../src/engine/gpu/camera.js';
import { budgetFor } from '../../src/engine/quality.js';

/** "Bây giờ" mặc định của test: 21:00 giờ Việt Nam, ngày 18 tháng Tám năm Bính Ngọ. */
export const NOW = new Date('2026-09-28T21:00:00+07:00');

/**
 * Renderer giả: một Proxy không vẽ gì. Hàm nào được đọc lần đầu (compute, render…) thành một vi.fn
 * và được giữ lại, nên test đọc được `renderer.compute.mock.calls`. Giữ sẵn vài thuộc tính mà lớp đọc/ghi.
 * 'then' trả undefined để Proxy không bị coi là Promise khi đi qua await.
 */
export function fakeRenderer() {
  const target = { shadowMap: { enabled: false }, info: { render: { drawCalls: 0, triangles: 0 } } };
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === 'symbol' || prop === 'then' || prop === 'toJSON') return undefined;
      t[prop] = vi.fn();
      return t[prop];
    },
  });
}

/**
 * ctx.captions giả (GĐ 5): `keys` như các khóa của content.captions, đông cứng như keys của api thật (một bản sao), nên bức
 * nào xáo khóa tại chỗ thì test hỏng ngay; `show` là vi.fn ghi lời gọi: test đọc `show.mock.calls` (khóa, anchor) rồi tự gọi
 * anchor() để xem điểm neo.
 * @param {string[]} [keys]
 */
export function fakeCaptions(keys = []) {
  return { keys: Object.freeze([...keys]), show: vi.fn() };
}

/**
 * EngineCtx giả, dựng bằng CHÍNH createCtx của xưởng. Scene, camera, uniform là đồ thật của three
 * (dựng được node graph trong Node); renderer là fakeRenderer(); captions là fakeCaptions() nếu test không đưa.
 * `ctx.weights` và `ctx.env` chỉ test dùng: chúng không liệt kê được (non-enumerable), nên ctx mà lớp nhận qua
 * `{ ...ctx }` không có hai thứ này.
 * `camera` (GĐ 8): camera của sân khấu giả; thiếu thì một PerspectiveCamera chung chung (test không dựng bức nào).
 * @param {object} meta  PaintingMeta
 */
export function makeEngineCtx(meta, {
  level = 'cao', budget = {}, now = NOW, reducedMotion = false, tier = 'webgpu', mobile = false, captions = fakeCaptions(),
  camera = new PerspectiveCamera(40, 1.6, 0.1, 500),
} = {}) {
  const stage = {
    backend: tier,
    renderer: fakeRenderer(),
    scene: new Scene(),
    camera,
    u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
  };
  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, captions });
  Object.defineProperty(ctx, 'weights', { value: weights, enumerable: false });
  Object.defineProperty(ctx, 'env', { value: env, enumerable: false });
  return ctx;
}

/**
 * Dựng bức như run.js: ngân sách của mức (budgetFor, ghép bảng của bức), setup(ctx) rồi buildLayers (cùng hàm của xưởng).
 * `until` = id lớp cuối cần dựng; `budget` ghi đè vài số của mức; `captions` = ctx.captions giả (fakeCaptions(keys))
 * khi test cần xem bức gọi chữ đi theo vật. `camera` (GĐ 8): mặc định là camera mà sân khấu dựng từ painting.camera (đúng loại,
 * đúng chỗ, khung 640 × 400 của e2e); test đưa camera khác để xem lớp làm gì với loại camera đó. Các tùy chọn khác đi tiếp vào
 * makeEngineCtx (level, now, tier…).
 * @returns {{ ctx: object, setup: object | undefined, shared: object, built: object[], layers: Record<string, object>, knobs: Record<string, object> }}
 */
export function buildPainting(painting, meta, { until, budget = {}, camera = createCamera(painting.camera, 1.6), ...options } = {}) {
  const ctx = makeEngineCtx(meta, {
    ...options, camera, budget: { ...budgetFor(options.level ?? 'cao', painting.quality), ...budget },
  });
  const setup = painting.setup?.(ctx);
  const shared = setup?.shared ?? {};
  const end = until ? painting.layers.findIndex((m) => m.id === until) + 1 : painting.layers.length;
  const built = buildLayers(painting.layers.slice(0, end), ctx, shared, ctx.env);
  return {
    ctx,
    setup,
    shared,
    built,
    layers: Object.fromEntries(built.map((b) => [b.id, b.layer])),
    knobs: Object.fromEntries(built.map((b) => [b.id, b.knobs])),
  };
}
