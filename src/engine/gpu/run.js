// engine/gpu/run.js — Vòng đời một bức ở tầng 3D: dựng → compileAsync → khung ẩn → hòa dần → chạy; mất GPU lần đầu thì dựng lại.
import { mergePalette } from '../palette.js';
import { studioApi } from '../sma.js';
import { withDeadline, DeadlineError } from '../deadline.js';
import { createStage } from './stage.js';
import { createDisposer } from './disposer.js';
import { buildScene } from './scene.js';
import { createFailCounter, createBurstCounter } from './guards.js';
import { openDebug } from './debug.js';
import { tools } from '../tools/index.js';
import { createFrameCap } from './clock.js';
import { createWorkshopDoor } from './workshop-door.js';
import { syncRecipeUrl } from './recipe-url.js';

/** Hạn cho một lần "Dựng lại cảnh" (lần mở trang đã có hạn 10 s của boot.js). */
const REBUILD_DEADLINE_MS = 10_000;

/** content.<lang>.js của bức, hoặc null nếu bức không có hay tải hỏng (3D không phụ thuộc chữ). */
function loadContent(entry, lang) {
  const load = entry.content?.[lang];
  if (!load) return Promise.resolve(null);
  return load().then((m) => m.default, (err) => {
    console.warn(`Không tải được chữ của bức (${lang}):`, err);
    return null;
  });
}

/**
 * Chạy một bức ở tầng A/B (spec §8.5). boot.js gọi hàm này qua import() động, trong hạn 10 giây.
 * Resolve { dispose } khi cảnh đã "live". Ném lỗi (sau khi tự gỡ sạch) nếu hỏng TRƯỚC khi live;
 * hỏng SAU khi live thì gọi onFail(reason, error) đúng một lần.
 * Mất GPU sau khi live: lần đầu hiện poster và nút "Dựng lại cảnh"; lần hai thì về tầng tĩnh (spec §9).
 * @param {import('../contracts/painting.js').PaintingEntry} entry
 * @param {object} shell   vỏ trang (ui/shell.js): setState, stageEl, crossfade, showBadge, showHint, invite, showLost
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier   tầng boot dò được (backend thật có thể khác: xem stage.backend)
 * @param {object} opts.flags             kết quả readFlags()
 * @param {Date} opts.now                 flags.at ?? giờ thật, cố định lúc khởi động
 * @param {string} opts.lang              ngôn ngữ trang (tải content)
 * @param {object} opts.t                 chữ giao diện (thanh lớp, Sổ tay)
 * @param {object} opts.sma               window.__sma (engine/sma.js)
 * @param {(reason: string, error?: unknown) => void} opts.onFail   về tầng tĩnh
 * @param {Window} [opts.win]
 * @returns {Promise<{ dispose: () => void }>}
 */
export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail, recipe = null, win = window }) {
  const { meta } = entry;
  let disposer = createDisposer(); // của lần dựng hiện tại; "Dựng lại cảnh" thay bằng một cái mới
  let studio = null; // bàn thợ của cảnh đang live (null khi chưa live, hoặc đang mất GPU)
  let quality = null; // bộ điều chỉnh của cảnh đang live: chỉ canh quá tải nặng khi thanh lớp mở
  let losses = 0;
  let failed = false;
  const handle = {
    dispose: () => {
      disposer.closeAll();
      door.dispose();
    },
  };
  // fail() chạy MỘT lần: gỡ mọi thứ theo thứ tự ngược, rồi báo boot về tầng tĩnh với lý do.
  // Gỡ có ném lỗi thì vẫn phải về tầng tĩnh: canvas có thể đã bị gỡ, trang không bao giờ được trống.
  const fail = (reason, error) => {
    if (failed) return;
    failed = true;
    try {
      handle.dispose();
    } catch (err) {
      console.error('Gỡ cảnh bị lỗi (vẫn về tranh tĩnh):', err);
    }
    onFail(reason, error);
  };
  // Sau mỗi await, trang có thể đã về tầng tĩnh: do fail(), hoặc do boot hết hạn 10 s (showStatic đặt
  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa. Mất GPU hay lỗi GPU đến sau lúc đó cũng bỏ
  // qua (onLost, onError): boot đã về tĩnh mà còn fail() thì showStatic chạy lần hai, đổi lý do (vd. 'timeout' → 'device-lost').
  const stopped = () => failed || sma.state === 'static';

  const hex = mergePalette(meta.palette);
  const reducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  // Sân khấu vào disposer NGAY khi dựng xong: dù việc song song khác hỏng trước, renderer vẫn được gỡ.
  const newStage = (d) => createStage({ tier, flags, parent: shell.stageEl, clearColor: hex.denThen, reducedMotion, win })
    .then((stage) => {
      d.add(() => stage.dispose());
      return stage;
    });
  let painting = null;
  let content = null;

  // Cửa vào xưởng (thanh lớp + Sổ tay): tạo một lần, sống qua các lần dựng lại.
  const door = createWorkshopDoor({
    win, meta, t, shell, getContent: () => content, getStudio: () => studio, getQuality: () => quality,
  });

  /** Mất GPU trước khi live, hoặc lần thứ hai: tầng tĩnh. Lần đầu sau khi live: poster + nút "Dựng lại cảnh". */
  const onLost = (d, info) => {
    if (stopped() || d.closed) return;
    const error = new Error(`Mất thiết bị ${info?.api ?? 'GPU'}: ${info?.message ?? ''}`);
    losses += 1;
    if (!studio || losses > 1) {
      fail('device-lost', error);
      return;
    }
    const snapshot = studio.snapshot(); // chỉ đọc giá trị JS, không cần GPU
    console.warn('Mất GPU lần đầu; chờ người xem bấm "Dựng lại cảnh".', error);
    d.closeAll();
    shell.showLost(() => rebuild(snapshot));
  };

  /** Dựng cảnh trên `stage` rồi đưa lên 'live'. Trả false nếu trang đã về tĩnh (hoặc lần dựng bị gỡ) trước hay giữa chừng. */
  const bringUp = async (stage, d, snapshot) => {
    // Trang đã về tĩnh, hoặc lần dựng này đã bị gỡ (mất GPU, quá hạn): chỉ tự dọn (d.closeAll() gỡ sân khấu và cảnh của
    // lần dựng này) rồi thôi, không đụng gì khác. Kiểm trước việc đầu tiên (hạn 10 s, của boot hay của "Dựng lại cảnh", có
    // thể tới lúc createStage còn dở) và sau MỖI lần chờ: vỏ trang lúc dựng lại không bị boot khóa, run.js phải tự dừng.
    const gone = () => {
      if (!stopped() && !d.closed) return false;
      d.closeAll();
      return true;
    };
    if (gone()) return false;
    stage.onLost((info) => onLost(d, info));
    const gpuErrors = createBurstCounter({ limit: 3, windowMs: 1000 });
    stage.onError((info) => {
      if (stopped()) return;
      console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
      if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
    });
    const scene = buildScene({ stage, disposer: d, painting, meta, flags, now, reducedMotion, win, tools, t, content, recipe: snapshot ? null : recipe });
    sma.set({ backend: stage.backend, level: scene.level });
    if (snapshot) await scene.studio.restore(snapshot);
    if (gone()) return false;

    shell.setState('compiling');
    await scene.compile();
    if (gone()) return false;

    const limit = typeof flags.freeze === 'number' ? flags.freeze : Infinity;
    let frames = 0;
    let debugTool = null;
    const frame = (ms) => {
      scene.step(ms);
      // Công cụ thợ hỏng thì tắt nó, không tính là khung lỗi: chế độ thợ không được làm rơi cảnh về tĩnh.
      try {
        debugTool?.update();
      } catch (err) {
        console.warn('Công cụ ?debug gặp lỗi, tắt nó đi:', err);
        debugTool = null;
      }
      frames += 1;
      sma.frame();
    };

    // Khung ẩn (là khung 1): canvas còn opacity 0 sau poster. Reflector, bóng, bloom, quad… chưa được
    // compileAsync biên dịch, nên chúng biên dịch nốt ở khung này thay vì làm khựng lúc đã hiện.
    frame(win.performance.now());
    shell.setState('fading');
    await shell.crossfade(stage.renderer.domElement);
    if (gone()) return false;
    shell.setState('live');
    shell.showBadge({ tier: stage.backend, level: scene.level });
    studio = scene.studio;
    quality = scene.quality;
    quality.start(); // bộ điều chỉnh đo từ lúc live: khung ẩn và lúc hòa dần không tính
    d.add(() => {
      studio = null;
      quality = null;
    });
    // Nấc đổi → huy hiệu ghi "hạ {n} nấc", nói thật về nấc bị khóa. Dựng lại cảnh lúc thanh lớp mở: bộ điều chỉnh mới cũng chỉ canh.
    d.add(scene.quality.onChange((q) => shell.showBadge({
      tier: stage.backend, level: q.level, steps: q.steps.length, locked: q.locked.length,
    })));
    if (door.isOpen) scene.quality.guard(true);
    // DevTools: __sma.setWeight('<id lớp>', 0) mài một lớp, __sma.degrade() hạ một nấc; e2e so ảnh ở cùng một khung.
    d.add(sma.expose(studioApi(() => studio)));
    // GĐ 9: thanh địa chỉ mang công thức; người xem đổi hash (dán link khác) thì áp rồi mở xưởng theo công thức.
    d.add(syncRecipeUrl({ win, studio: scene.studio, onApplied: () => door.open({ grind: false, recipe: true }) }));
    try {
      door.afterLive({ input: scene.input, rebuilt: Boolean(snapshot) });
    } catch (err) {
      // Xưởng (thanh lớp, Sổ tay) là phần thêm: mở hỏng (kể cả mở theo link công thức) thì ghi log, cảnh vẫn live (spec §21.2).
      console.error('Không mở được xưởng; cảnh vẫn chạy:', err);
    }

    // Công cụ ?debug tải SAU khi live (không tính vào hạn 10 s); hỏng thì null, cảnh vẫn chạy.
    openDebug(flags.debug, stage.renderer, win.document).then((tool) => {
      if (!tool) return;
      if (d.closed) tool.dispose();
      else {
        d.add(() => tool.dispose());
        debugTool = tool;
      }
    });

    const frameErrors = createFailCounter({ limit: 3 });
    const cap = createFrameCap(); // màn 90/120/144 Hz: tối đa 60 khung/giây, GPU không phải vẽ gấp đôi
    const loop = (ms) => {
      if (failed || d.closed || !cap.ready(ms)) return;
      try {
        frame(ms);
        frameErrors.ok();
      } catch (err) {
        // Lỗi JS trong một khung: ghi log, bỏ qua khung đó; 3 khung lỗi LIÊN TIẾP → tầng tĩnh.
        console.error('Lỗi trong một khung:', err);
        if (frameErrors.fail()) fail('frame-errors', err);
        return;
      }
      // ?freeze=N: dừng vòng lặp sau khung N; canvas giữ nguyên khung N, __sma.frames === N.
      if (frames >= limit) {
        stage.renderer.setAnimationLoop(null);
        scene.freeze();
      }
    };
    d.add(() => stage.renderer.setAnimationLoop(null));
    if (frames < limit) stage.renderer.setAnimationLoop(loop);
    else scene.freeze();
    return true;
  };

  /** "Dựng lại cảnh": renderer và canvas MỚI (WebGPURenderer không tự khôi phục được), rồi restore(snapshot). */
  const rebuild = async (snapshot) => {
    if (failed) return;
    shell.setState('loading');
    const d = createDisposer();
    disposer = d;
    try {
      await withDeadline(newStage(d).then((stage) => bringUp(stage, d, snapshot)), REBUILD_DEADLINE_MS, {
        onLate: () => d.closeAll(),
      });
    } catch (err) {
      d.closeAll();
      fail(err instanceof DeadlineError ? 'timeout' : 'error', err);
    }
  };

  try {
    // Song song: tải module nặng của bức, dựng renderer, tải chữ của bức (hỏng thì cảnh vẫn chạy, chỉ thiếu chữ).
    let stage;
    [painting, stage, content] = await Promise.all([entry.load(), newStage(disposer), loadContent(entry, lang)]);
    await bringUp(stage, disposer, null); // boot đã hết hạn 10 s lúc đang chờ thì bringUp chỉ tự dọn
    return handle;
  } catch (err) {
    disposer.closeAll();
    door.dispose(); // xưởng có thể đã mở (link công thức) trước khi lần dựng hỏng: không để thanh lớp mồ côi trên trang tĩnh
    // fail() đã báo tầng tĩnh với lý do đúng (vd. 'device-lost'); đừng để boot ghi đè thành 'error'.
    if (failed) return handle;
    throw err;
  }
}
