// engine/gpu/run.js — Vòng đời một bức ở tầng 3D: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ.
import { Color } from 'three/webgpu';
import { mergePalette } from '../palette.js';
import { isMobile, pickLevel, budgetFor } from '../quality.js';
import { createStage } from './stage.js';
import { createDisposer } from './disposer.js';
import { createWeights, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createFailCounter, createBurstCounter } from './guards.js';

/**
 * Chạy một bức ở tầng A/B (spec §8.5). boot.js gọi hàm này qua import() động, trong hạn 10 giây.
 * Resolve { dispose } khi cảnh đã "live". Ném lỗi (sau khi tự gỡ sạch) nếu hỏng TRƯỚC khi live;
 * hỏng SAU khi live thì gọi onFail(reason, error) đúng một lần.
 * @param {import('../contracts/painting.js').PaintingEntry} entry
 * @param {object} shell   vỏ trang (ui/shell.js): setState, stageEl, crossfade, showBadge
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier   tầng boot dò được (backend thật có thể khác: xem stage.backend)
 * @param {object} opts.flags             kết quả readFlags()
 * @param {Date} opts.now                 flags.at ?? giờ thật, cố định lúc khởi động
 * @param {string} opts.lang              ngôn ngữ trang (GĐ 1 dùng để tải content)
 * @param {object} opts.t                 chữ giao diện (GĐ 1+ dùng cho gợi ý, Sổ tay)
 * @param {object} opts.sma               window.__sma (engine/sma.js)
 * @param {(reason: string, error?: unknown) => void} opts.onFail   về tầng tĩnh
 * @param {Window} [opts.win]
 * @returns {Promise<{ dispose: () => void }>}
 */
export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail, win = window }) {
  const disposer = createDisposer();
  const handle = { dispose: () => disposer.closeAll() };
  let failed = false;

  // fail() chạy MỘT lần: gỡ mọi thứ theo thứ tự ngược, rồi báo boot về tầng tĩnh với lý do.
  const fail = (reason, error) => {
    if (failed) return;
    failed = true;
    disposer.closeAll();
    onFail(reason, error);
  };
  // Sau mỗi await, trang có thể đã về tầng tĩnh: do fail(), hoặc do boot hết hạn 10 s (showStatic đặt
  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa.
  const stopped = () => failed || sma.state === 'static';
  const quit = () => {
    disposer.closeAll();
    return handle;
  };

  const hex = mergePalette(entry.meta.palette);
  const reducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  try {
    // Song song: tải module nặng của bức và dựng renderer. Sân khấu vào disposer NGAY khi dựng xong,
    // nên dù load() hỏng trước, renderer vẫn được gỡ (add() sau closeAll() chạy fn ngay).
    const [painting, stage] = await Promise.all([
      entry.load(),
      createStage({ tier, flags, parent: shell.stageEl, clearColor: hex.denThen, reducedMotion, win }).then((s) => {
        disposer.add(() => s.dispose());
        return s;
      }),
    ]);
    if (stopped()) return quit();

    stage.onLost((info) => {
      fail('device-lost', new Error(`Mất thiết bị ${info?.api ?? 'GPU'}: ${info?.message ?? ''}`));
    });
    const gpuErrors = createBurstCounter({ limit: 3, windowMs: 1000 });
    stage.onError((info) => {
      console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
      if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
    });

    stage.useCamera(painting.camera);
    const mobile = isMobile(win.navigator);
    // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2).
    const level = pickLevel({ tier: stage.backend, mobile });
    const budget = budgetFor(level, painting.quality);
    stage.setDpr(budget.dpr);
    sma.set({ backend: stage.backend, level });

    const weights = createWeights(entry.meta.layers);
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
      debug: Boolean(flags.debug),
    };

    // setup() của bức (GĐ 1) chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
    const setup = painting.setup?.(ctx);
    if (setup?.dispose) disposer.add(() => setup.dispose());
    const shared = setup?.shared ?? {};
    // Thứ tự đăng ký = stage → setup → lớp → pipeline → vòng lặp; closeAll() gỡ NGƯỢC lại.
    const layers = buildLayers(painting.layers, ctx, shared, { tier: ctx.tier, level, budget, now, mobile });
    for (const { layer } of layers) disposer.add(() => layer.dispose());
    // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
    ensureEmissive(stage.scene, {
      warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
    });
    const pipeline = createPipeline({
      renderer: stage.renderer,
      scene: stage.scene,
      camera: stage.camera,
      layers,
      weight: ctx.weight,
    });
    disposer.add(() => pipeline.dispose());

    // Biên dịch trước bằng scenePass.compileAsync (có MRT + render target của pass), trong lúc poster còn hiện.
    shell.setState('compiling');
    await pipeline.compile();
    if (stopped()) return quit();

    const limit = typeof flags.freeze === 'number' ? flags.freeze : Infinity;
    let frames = 0;
    // Một khung: đồng hồ → setup.update → layer.update theo thứ tự → camera → render → đếm khung.
    const step = (ms) => {
      const { t: time, dt } = stage.tick(ms);
      setup?.update?.(dt, time);
      for (const { layer } of layers) layer.update?.(dt, time);
      stage.controls?.update();
      pipeline.render();
      frames += 1;
      sma.frame();
    };

    // Khung ẩn (là khung 1): canvas còn opacity 0 sau poster. Reflector, bóng, bloom, quad… chưa được
    // compileAsync biên dịch, nên chúng biên dịch nốt ở khung này thay vì làm khựng lúc đã hiện.
    step(win.performance.now());
    shell.setState('fading');
    await shell.crossfade(stage.renderer.domElement);
    if (stopped()) return quit();
    shell.setState('live');
    shell.showBadge({ tier: stage.backend, level });

    const frameErrors = createFailCounter({ limit: 3 });
    const loop = (ms) => {
      if (failed) return;
      try {
        step(ms);
        frameErrors.ok();
      } catch (err) {
        // Lỗi JS trong một khung: ghi log, bỏ qua khung đó; 3 khung lỗi LIÊN TIẾP → tầng tĩnh.
        console.error('Lỗi trong một khung:', err);
        if (frameErrors.fail()) fail('frame-errors', err);
        return;
      }
      // ?freeze=N: dừng vòng lặp sau khung N; canvas giữ nguyên khung N, __sma.frames === N.
      if (frames >= limit) stage.renderer.setAnimationLoop(null);
    };
    disposer.add(() => stage.renderer.setAnimationLoop(null));
    if (frames < limit) stage.renderer.setAnimationLoop(loop);
    return handle;
  } catch (err) {
    disposer.closeAll();
    // fail() đã báo tầng tĩnh với lý do đúng (vd. 'device-lost'); đừng để boot ghi đè thành 'error'.
    if (failed) return handle;
    throw err;
  }
}
