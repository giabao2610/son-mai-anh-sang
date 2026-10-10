// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: chữ → ctx → setup → lớp → pipeline → móc lần vẽ → thang nấc → đồ nghề → bản dịch → input → bàn thợ; và hàm vẽ một khung.
import { budgetFor, isMobile, pickLevel } from '../quality.js';
import { FRAME_BUDGET_MS, createTuner } from '../tuner.js';
import { createGpuTimer } from './gpu-timer.js';
import { createCtx, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createHold } from './hold.js';
import { createLadder } from './ladder.js';
import { createQuality } from './scene-quality.js';
import { createStudio } from './studio.js';
import { createInput } from './input.js';
import { createToolbox } from './toolbox.js';
import { createDialSet } from './dial-set.js';
import { createRecipeSet, showProblems } from './recipe-set.js';
import { createCaptionSet } from './caption-set.js';
import { createDrawProbe } from './draws.js';
import { createTranslator } from './translate.js';
import { mountCaptions } from '../../ui/captions.js';

/**
 * run.js gọi hàm này một lần khi mở trang, và thêm một lần nữa nếu người xem bấm "Dựng lại cảnh" sau khi mất GPU.
 * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (chữ → setup → lớp → pipeline → móc lần vẽ → bộ đo GPU → đồ nghề →
 * bản dịch → input), nên gỡ được ngược lại.
 * Nếu setup/createLayer ném lỗi, buildLayers đã gỡ các lớp dựng dở; lỗi đi tiếp lên run.js.
 *
 * @param {object} p
 * @param {Awaited<ReturnType<import('./stage.js').createStage>>} p.stage
 * @param {ReturnType<import('./disposer.js').createDisposer>} p.disposer
 * @param {import('../contracts/runtime.js').Painting} p.painting
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ debug?: any, freeze?: boolean | number, level?: 'cao'|'vua'|'thap'|null }} p.flags
 * @param {Date} p.now
 * @param {boolean} p.reducedMotion
 * @param {Window} p.win
 * @param {import('../contracts/runtime.js').Tool[]} [p.tools]   công cụ học (engine/tools/index.js)
 * @param {Record<string, any>} [p.t]        chữ giao diện (nhãn view của công cụ; GĐ 9: nhãn quad cuối của Bản dịch)
 * @param {object | null} [p.content]        chữ của bức (nhãn tap của lớp, chữ đi theo vật)
 * @param {{ entries: { key: string, value: string }[], problems: string[] } | null} [p.recipe]   GĐ 9: kết quả readRecipe (#r=), áp lúc dựng
 */
export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win, tools = [], t = {}, content = null, recipe = null }) {
  stage.useCamera(painting.camera);
  const mobile = isMobile(win.navigator);
  // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2); ?level ép một mức khác (xem mức thấp trên máy tính).
  const level = flags.level ?? pickLevel({ tier: stage.backend, mobile });
  const budget = budgetFor(level, painting.quality);
  stage.setDpr(budget.dpr);

  // Chữ đi theo vật (GĐ 5): vùng aria-live trong [data-stage], phủ lên canvas và cùng cỡ với nó. Bức chỉ cầm khóa
  // (ctx.captions); chữ ở content.captions, chữ tải hỏng thì không có khóa nào.
  const canvas = stage.renderer.domElement;
  const captionSet = createCaptionSet({
    captions: content?.captions ?? {},
    ui: mountCaptions(win.document, canvas.parentElement),
    camera: stage.camera,
    time: stage.u.time,
    size: () => ({ width: canvas.clientWidth, height: canvas.clientHeight }),
    debug: Boolean(flags.debug),
  });
  disposer.add(() => captionSet.dispose());

  const { ctx, weights, env } = createCtx({
    meta, stage, level, budget, mobile, reducedMotion, now, debug: Boolean(flags.debug), captions: captionSet.api,
  });
  // setup() của bức chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
  const setup = painting.setup?.(ctx);
  if (setup?.dispose) disposer.add(() => setup.dispose());
  const shared = setup?.shared ?? {};
  // Dial dựng ngay sau setup: giá trị lúc này là mặc định của máy đang xem (Bức 1: giờ của "bây giờ"). GĐ 9: công thức của link (#r=)
  // phân loại theo id của bức rồi áp TRƯỚC khi dựng lớp: Dial và trọng số đặt ngay, núm đi vào createKnobs, nên núm 'rebuild' dựng
  // MỘT lần với giá trị của công thức, và lần biên dịch đầu đã là cảnh của công thức (spec §21.4).
  const dials = createDialSet(setup?.dials ?? []);
  const recipes = createRecipeSet({ modules: painting.layers, env, dials: setup?.dials ?? [], dialDefaults: dials.snapshot() });
  const applied = recipe ? recipes.classify(recipe.entries) : null;
  const problems = [...(recipe?.problems ?? []), ...(applied?.problems ?? [])];
  if (problems.length > 0) console.warn(`Công thức trong link: bỏ ${problems.length} mục không áp được: ${showProblems(problems)}`);
  if (applied) {
    dials.restore(applied.dials);
    for (const [id, v] of Object.entries(applied.weights)) weights.set(id, v);
  }
  const layers = buildLayers(painting.layers, ctx, shared, env, applied?.knobs ?? {});
  for (const { layer } of layers) disposer.add(() => layer.dispose());
  // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
  ensureEmissive(stage.scene, {
    warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
  });
  const hold = createHold(); // GĐ 9: giữ khung khi biên dịch lại giữa chừng (view Normal: spec §21.3)
  const pipeline = createPipeline({ renderer: stage.renderer, scene: stage.scene, camera: stage.camera, layers, weight: ctx.weight, hold });
  disposer.add(() => pipeline.dispose());
  // Móc lần vẽ (GĐ 5): chỉ gắn khi Từng sợi bật (start/stop) hay Bản dịch đang chờ bắt khung (GĐ 9, capture); lúc khác cảnh không tốn gì.
  // Tên lớp ở meta, nhãn vật ở content.
  const draws = createDrawProbe({ renderer: stage.renderer, camera: stage.camera, layers, meta, content });
  // Gỡ sau hộp đồ nghề và bản dịch (thứ tự ngược): công cụ hỏng không tự stop() thì móc vẫn được gỡ; lần bắt của Bản dịch còn chờ thì hỏng.
  disposer.add(() => draws.dispose());
  // Thang nấc dựng SAU pipeline: nấc của lớp dùng chung (bloom) chạm vào node mà pipeline vừa dựng.
  const ladder = createLadder({ ladder: painting.quality?.ladder, layers, stage, dpr: budget.dpr });
  const tuner = flags.freeze ? null : createTuner({ budgetMs: mobile ? FRAME_BUDGET_MS.mobile : FRAME_BUDGET_MS.desktop });
  // ms GPU thật (máy nào đo được): cho bộ điều chỉnh chẩn đoán theo tải, và cho số đo của Sổ tay.
  const timer = createGpuTimer(stage.renderer, {
    onSample: (ms) => {
      quality.gpu(ms);
      studio.gpu(ms);
    },
    onStop: () => studio.gpu(null), // đo hỏng giữa phiên: Sổ tay về "—", bộ điều chỉnh tự về đường nhịp
  });
  disposer.add(() => timer.dispose());
  const quality = createQuality({ level, ladder, tuner, timer, hold });

  // Vòng lặp đã dừng ở khung N của ?freeze=N: thay đổi từ Sổ tay hay __sma thì vẽ lại đúng khung đó (không tiến đồng hồ).
  // Vẽ lại ở nhịp requestAnimationFrame KẾ TIẾP, gộp mọi thay đổi trong cùng nhịp làm một: scene pass và reflector
  // của three chỉ vẽ lại cảnh một lần mỗi frameId, mà frameId chỉ tăng ở mỗi nhịp rAF của renderer. Vẽ lại hai lần
  // trong cùng một nhịp thì lần sau dùng lại ảnh cảnh cũ. Vẽ hỏng thì Promise hỏng theo (không treo mãi):
  // Sổ tay báo lỗi và mở khóa nút, __sma.setWeight trả lỗi cho người gọi.
  // GĐ 9: đang giữ khung (biên dịch lại với target + MRT của scene pass đang đặt) thì chờ thả; nhịp tới mà một lần giữ khác vừa bắt
  // đầu thì chờ tiếp, không vẽ giữa chừng (spec §21.3).
  let frozen = false;
  let pending = null;
  const drawStill = () => new Promise((resolve, reject) => {
    win.requestAnimationFrame(() => {
      if (hold.active) {
        hold.idle().then(drawStill).then(resolve, reject);
        return;
      }
      pending = null;
      try {
        if (!disposer.closed) {
          route(); // cử chỉ tới lúc đứng yên (rê Kính mài) cũng có tác dụng
          // update(0, t) (GĐ 4): lớp và bức đồng bộ theo uniform vừa đổi (thanh giờ → trăng, bóng) mà KHÔNG tiến mô phỏng
          // (compute, hạt CPU): ảnh vẫn là khung N.
          const t = stage.u.time.value;
          setup?.update?.(0, t);
          for (const { layer } of layers) layer.update?.(0, t);
          captionSet.step(); // đồng hồ đứng nên chữ ở lại; camera có thể vừa bị kéo: chiếu lại
          draws.begin(); // Từng sợi đổi sợi rồi vẽ lại, hay Bản dịch bắt khung: khung N đi qua móc như mọi khung
          pipeline.render();
          draws.end();
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
  const redraw = () => {
    if (!frozen || disposer.closed) return Promise.resolve();
    pending ??= hold.active ? hold.idle().then(drawStill) : drawStill();
    return pending;
  };

  // Công cụ học (GĐ 4): gắn vào pipeline, overlay ghép MỘT lần; mỗi lúc một công cụ (toolbox.js).
  const toolbox = createToolbox({ tools, views: pipeline.views, doc: win.document, t, content, redraw, draws });
  disposer.add(() => toolbox.dispose());
  // Bản dịch (GĐ 9, spec §21.3): mã shader thật của từng vật và của quad cuối, bắt từ một khung vẽ thật qua móc lần vẽ.
  const translator = createTranslator({
    renderer: stage.renderer, draws, redraw, layers, meta, content, postLabel: t.translation?.post ?? '',
  });
  disposer.add(() => translator.dispose());

  // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học nhận trước bức.
  // Khung đứng yên: cử chỉ tới thì vẽ lại cho nó có tác dụng. Rê chuột chỉ công cụ nhận, nên chỉ vẽ lại khi có công cụ bật.
  const input = createInput({
    canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win,
    onQueue: (kind) => frozen && (kind !== 'hover' || toolbox.list().some((x) => x.on)) && redraw(),
  });
  disposer.add(() => input.dispose());
  /**
   * Cử chỉ tới công cụ đang bật trước; công cụ không dùng thì tới bức. 'hover' không bao giờ tới bức.
   * Bức đã nhận 'hold-start' thì luôn nhận 'hold-end' của cái giữ đó, kể cả khi công cụ bật giữa chừng (ngón khác, bàn phím, __sma) và
   * giữ nó: không thì bức kẹt ở "đang giữ" mãi mà không báo gì. 'hold-move' sau khi công cụ bật thì là của công cụ.
   */
  let held = false; // bức đã nhận 'hold-start' của cái giữ đang diễn ra
  const route = () => {
    for (const g of input.drain()) {
      const used = toolbox.gesture(g);
      const owed = g.kind === 'hold-end' && held;
      if (g.kind === 'hold-start' || g.kind === 'hold-end') held = g.kind === 'hold-start' && !used;
      if ((used && !owed) || g.kind === 'hover') continue;
      setup?.onGesture?.(g);
    }
  };

  const studio = createStudio({
    meta,
    layers,
    weights,
    env, // trần của núm theo tầng và theo mức (knob-set.js#knobMax)
    tweenSeconds: reducedMotion ? 0 : undefined, // giảm chuyển động: lớp bật/tắt ngay, không mờ dần
    redraw,
    quality,
    toolbox,
    dials, // núm của cả bức (Bức 1: thanh giờ), dựng cạnh setup để công thức áp được
    recipes, // GĐ 9: mặc định của máy này, cho recipe()/applyRecipe()/reset()
    translator, // Bản dịch (GĐ 9)
  });

  return {
    level,
    studio,
    input,
    quality,
    hold,
    /** Biên dịch trước với đúng render target + MRT của pass, trong lúc poster còn hiện. */
    compile: () => pipeline.compile(),
    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera (thở, tự khép lại) → chữ → render → ms GPU → số đo. */
    step(ms) {
      const start = win.performance.now();
      if (quality.sample(ms ?? start)) return; // thử ngừng vẽ (tuner.js, luật 2): không vẽ, không tiến đồng hồ; ảnh cũ ở lại
      const { t, dt } = stage.tick(ms);
      route();
      setup?.update?.(dt, t);
      for (const { layer } of layers) layer.update?.(dt, t);
      weights.step(dt);
      stage.breathe(t);
      stage.returnHome(dt); // tranh tự khép lại: sau breathe (điểm nhìn của khung này), trước controls.update()
      stage.controls?.update();
      captionSet.step(); // chữ đi theo điểm neo, theo camera của chính khung này
      draws.begin(); // móc (Từng sợi bật, hay Bản dịch đang chờ bắt) ghi lần vẽ của đúng khung này
      pipeline.render();
      draws.end();
      timer.poll(ms ?? start); // hỏi ms GPU của các khung trước, không chờ
      const end = win.performance.now();
      studio.measure(stage.renderer.info, end, end - start); // ms CPU: luồng chính bận bao lâu cho khung này
      quality.cpu(end - start);
    },
    /** run.js gọi khi vòng lặp dừng ở khung N của ?freeze=N. */
    freeze() {
      frozen = true;
    },
  };
}
