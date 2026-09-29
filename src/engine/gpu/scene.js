// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: ctx → setup → lớp → pipeline → input → bàn thợ; và hàm vẽ một khung.
import { isMobile, pickLevel, budgetFor } from '../quality.js';
import { createCtx, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createStudio } from './studio.js';
import { createInput } from './input.js';

/**
 * run.js gọi hàm này một lần khi mở trang, và thêm một lần nữa nếu người xem bấm "Dựng lại cảnh" sau khi mất GPU.
 * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (setup → lớp → pipeline → input), nên gỡ được ngược lại.
 * Nếu setup/createLayer ném lỗi, buildLayers đã gỡ các lớp dựng dở; lỗi đi tiếp lên run.js.
 *
 * @param {object} p
 * @param {Awaited<ReturnType<import('./stage.js').createStage>>} p.stage
 * @param {ReturnType<import('./disposer.js').createDisposer>} p.disposer
 * @param {import('../contracts/runtime.js').Painting} p.painting
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ debug?: any }} p.flags
 * @param {Date} p.now
 * @param {boolean} p.reducedMotion
 * @param {Window} p.win
 */
export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win }) {
  stage.useCamera(painting.camera);
  const mobile = isMobile(win.navigator);
  // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2).
  const level = pickLevel({ tier: stage.backend, mobile });
  const budget = budgetFor(level, painting.quality);
  stage.setDpr(budget.dpr);

  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug: Boolean(flags.debug) });
  // setup() của bức chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
  const setup = painting.setup?.(ctx);
  if (setup?.dispose) disposer.add(() => setup.dispose());
  const shared = setup?.shared ?? {};
  const layers = buildLayers(painting.layers, ctx, shared, env);
  for (const { layer } of layers) disposer.add(() => layer.dispose());
  // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
  ensureEmissive(stage.scene, {
    warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
  });
  const pipeline = createPipeline({ renderer: stage.renderer, scene: stage.scene, camera: stage.camera, layers, weight: ctx.weight });
  disposer.add(() => pipeline.dispose());

  // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
  const input = createInput({ canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win });
  disposer.add(() => input.dispose());

  // Vòng lặp đã dừng ở khung N của ?freeze=N: thay đổi từ Sổ tay hay __sma thì vẽ lại đúng khung đó (không tiến đồng hồ).
  // Vẽ lại ở nhịp requestAnimationFrame KẾ TIẾP, gộp mọi thay đổi trong cùng nhịp làm một: scene pass và reflector
  // của three chỉ vẽ lại cảnh một lần mỗi frameId, mà frameId chỉ tăng ở mỗi nhịp rAF của renderer. Vẽ lại hai lần
  // trong cùng một nhịp thì lần sau dùng lại ảnh cảnh cũ. Vẽ hỏng thì Promise hỏng theo (không treo mãi):
  // Sổ tay báo lỗi và mở khóa nút, __sma.setWeight trả lỗi cho người gọi.
  let frozen = false;
  let pending = null;
  const redraw = () => {
    if (!frozen || disposer.closed) return Promise.resolve();
    pending ??= new Promise((resolve, reject) => {
      win.requestAnimationFrame(() => {
        pending = null;
        try {
          if (!disposer.closed) pipeline.render();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
    return pending;
  };
  const studio = createStudio({
    meta,
    layers,
    weights,
    env, // trần của núm theo tầng và theo mức (knob-set.js#knobMax)
    tweenSeconds: reducedMotion ? 0 : undefined, // giảm chuyển động: lớp bật/tắt ngay, không mờ dần
    redraw,
  });

  return {
    level,
    studio,
    input,
    /** Biên dịch trước với đúng render target + MRT của pass, trong lúc poster còn hiện. */
    compile: () => pipeline.compile(),
    /** Một khung: đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → render → số đo. */
    step(ms) {
      const { t, dt } = stage.tick(ms);
      for (const g of input.drain()) setup?.onGesture?.(g);
      setup?.update?.(dt, t);
      for (const { layer } of layers) layer.update?.(dt, t);
      weights.step(dt);
      stage.breathe(t);
      stage.controls?.update();
      pipeline.render();
      studio.measure(stage.renderer.info, win.performance.now());
    },
    /** run.js gọi khi vòng lặp dừng ở khung N của ?freeze=N. */
    freeze() {
      frozen = true;
    },
  };
}
