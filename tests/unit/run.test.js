// @vitest-environment jsdom
// tests/unit/run.test.js — vòng đời một bức ở tầng 3D (engine/gpu/run.js) trên sân khấu và cảnh giả: live, mất GPU rồi "Dựng lại cảnh", trang về tĩnh giữa chừng.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../src/engine/gpu/run.js';
import { DeadlineError } from '../../src/engine/deadline.js';
import { readFlags } from '../../src/engine/flags.js';
import { createStage } from '../../src/engine/gpu/stage.js';
import { buildScene } from '../../src/engine/gpu/scene.js';
import { mountWorkshop } from '../../src/ui/workshop.js';

// Phần nặng (three, GPU, DOM của Sổ tay) là đồ giả; deadline, disposer, guards, clock, palette là thật, cả studioApi của
// engine/sma.js. Còn __sma thì giả: harness() đưa vào một bản ghi lời gọi, như vỏ trang.
// createStage và buildScene là vi.fn(): harness() đặt lại cách chúng dựng cho từng test.
vi.mock('../../src/engine/gpu/stage.js', () => ({ createStage: vi.fn() }));
vi.mock('../../src/engine/gpu/scene.js', () => ({ buildScene: vi.fn() }));
vi.mock('../../src/engine/tools/index.js', () => ({ tools: [] }));
vi.mock('../../src/engine/gpu/debug.js', () => ({ openDebug: async () => null }));
vi.mock('../../src/ui/workshop.js', () => ({ mountWorkshop: vi.fn(() => ({ open() {}, dispose() {}, isOpen: false })) }));

const entry = { meta: { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'lop-hai' }] }, load: async () => ({}) };
const LOST = { api: 'WebGL', message: 'mất context' }; // như renderer.onDeviceLost báo
const GPU_ERROR = { type: 'validation', message: 'lỗi thử' }; // như renderer.onError báo
// Lời gọi tới vỏ trang của một lần dựng tới 'live' (mở trang, hay dựng lại sau 'setState loading').
const OPENED = ['setState compiling', 'setState fading', 'crossfade', 'setState live', 'showBadge'];

/** Promise điều khiển bằng tay: gọi resolve lúc nào tùy test. */
function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

/** Sân khấu giả: canvas thật của jsdom; lose(info), fault(info) báo cho mọi người nghe, như renderer.onDeviceLost, onError. */
function fakeStage(record) {
  const lost = [];
  const errors = [];
  return {
    backend: 'webgl2',
    renderer: { domElement: document.createElement('canvas'), setAnimationLoop: vi.fn() },
    onLost: record('stage.onLost', (cb) => lost.push(cb)),
    onError: record('stage.onError', (cb) => errors.push(cb)),
    dispose: vi.fn(), // việc tự dọn của run.js: đếm riêng, không vào log
    lose: (info) => lost.forEach((cb) => cb(info)),
    fault: (info) => errors.forEach((cb) => cb(info)),
  };
}

/** Cảnh giả: chỉ những gì run.js đọc. restore() và compile() đi qua `pass`, nên test giữ lại được (xem hold). */
function fakeScene(record, pass) {
  return {
    level: 'vua',
    studio: {
      snapshot: vi.fn(() => ({})),
      restore: record('scene.restore', () => pass('restore')),
      // GĐ 9: công thức của cảnh (test đặt text); onChange trả hàm bỏ nghe
      text: '',
      recipe() { return { text: this.text }; },
      onChange: vi.fn(() => () => {}),
      applyRecipe: vi.fn(async () => ({ counts: {}, problems: [] })),
      reset: vi.fn(async () => {}),
    },
    compile: record('scene.compile', () => pass('compile')),
    step: vi.fn(),
    freeze: vi.fn(),
    quality: { start: vi.fn(), guard: vi.fn(), onChange: vi.fn(() => () => {}) },
    input: { onFirst: vi.fn() },
  };
}

/**
 * Một trang giả quanh run(), nối như boot.js. Một log ghi theo thứ tự lời gọi của run.js tới vỏ trang ('setState live'…),
 * tới __sma ('sma.set'…) và các bước dựng ('stage.onLost', 'scene.build', 'scene.compile'…); về tĩnh ghi mốc 'static <lý do>'.
 * Vỏ trang KHÔNG bị khóa như vỏ boot đưa cho run (boot chỉ khóa khi lần mở trang quá hạn hay hỏng; hạn 10 s của "Dựng lại
 * cảnh" là của run.js): test giữ chính run.js tự dừng. Mỗi lần createStage / buildScene: stages[i], scenes[i] mới.
 */
function harness() {
  const log = [];
  const stages = [];
  const scenes = [];
  let onRebuild = null; // nút "Dựng lại cảnh" mà showLost dựng
  const gates = new Map(); // bước chờ → cổng mà lần gọi KẾ TIẾP của bước đó phải qua (xem hold)
  const pass = async (step) => {
    const gate = gates.get(step);
    gates.delete(step);
    gate?.reached.resolve();
    await gate?.open.promise;
  };
  /** Hàm giả: ghi `name` vào log rồi làm phần việc riêng (nếu có). */
  const record = (name, then = () => {}) => vi.fn((...args) => {
    log.push(name);
    return then(...args);
  });

  createStage.mockImplementation(async () => {
    const stage = fakeStage(record);
    stages.push(stage); // test cầm được sân khấu ngay, cả khi lời hứa còn bị giữ
    await pass('createStage');
    return stage;
  });
  buildScene.mockImplementation(() => {
    log.push('scene.build');
    const scene = fakeScene(record, pass);
    scenes.push(scene);
    return scene;
  });

  const sma = {
    state: 'loading', // boot đặt 'loading' trước khi gọi run()
    frames: 0,
    set: record('sma.set', (patch) => Object.assign(sma, patch)),
    frame: record('sma.frame', () => { sma.frames += 1; }),
    expose: record('sma.expose', () => () => {}),
  };
  const shell = {
    stageEl: document.createElement('div'),
    setState: vi.fn((state) => {
      log.push(`setState ${state}`);
      sma.state = state; // như boot: onState của vỏ trang giữ __sma.state bằng data-state
    }),
    crossfade: record('crossfade', () => pass('crossfade')), // hòa xong ngay, trừ khi test giữ lại
    showBadge: record('showBadge'),
    showHint: record('showHint'),
    clearHint: record('clearHint'),
    invite: record('invite'),
    showLost: record('showLost', (cb) => {
      sma.state = 'lost'; // vỏ thật: showLost gọi setState('lost')
      onRebuild = cb;
    }),
  };
  // showStatic của boot: qua onFail của run, hay do chính boot khi lần mở trang hết hạn 10 s.
  const toStatic = (reason) => {
    log.push(`static ${reason}`);
    Object.assign(sma, { state: 'static', reason });
  };
  const onFail = vi.fn(toStatic);

  return {
    stages, scenes, shell, sma, onFail,
    /** Gọi run() như boot gọi; resolve { dispose } khi cảnh đã live. */
    start: (extra = {}) => run(entry, shell, {
      tier: 'webgl2', flags: readFlags(''), now: new Date('2026-09-28T14:00:00Z'), lang: 'vi', t: {}, sma, onFail, win: window, ...extra,
    }),
    rebuild: () => onRebuild(), // người xem bấm "Dựng lại cảnh"; trả lời hứa của lần dựng lại
    bootTimeout: () => toStatic('timeout'), // boot hết hạn 10 s của lần mở trang: showStatic thẳng, không qua onFail của run
    /** Lần gọi kế tiếp của `step` ('createStage', 'restore', 'compile', 'crossfade') chỉ xong khi test gọi resolve(). */
    hold(step) {
      const gate = { reached: deferred(), open: deferred() };
      gates.set(step, gate);
      return { reached: gate.reached.promise, resolve: gate.open.resolve }; // reached: run.js đã bắt đầu chờ bước này
    },
    shellLog: () => log.filter((e) => !e.includes('.')), // các mục của vỏ trang (bỏ mục có chủ: 'sma.', 'stage.', 'scene.')
    afterStatic: () => log.slice(log.findIndex((e) => e.startsWith('static ')) + 1), // mọi mục SAU lần về tĩnh đầu tiên
  };
}

beforeEach(() => {
  mountWorkshop.mockClear();
  vi.spyOn(console, 'warn').mockImplementation(() => {}); // "Mất GPU lần đầu…" là cảnh báo có chủ ý
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('run', () => {
  it('mở trang: vỏ trang đi compiling → fading → live, huy hiệu sau live, bộ điều chỉnh bắt đầu đo', async () => {
    const page = harness();
    const handle = await page.start();
    expect(page.shellLog()).toEqual(OPENED);
    expect(page.shell.crossfade).toHaveBeenCalledWith(page.stages[0].renderer.domElement);
    expect(page.sma).toMatchObject({ state: 'live', backend: 'webgl2', level: 'vua', frames: 1 }); // khung ẩn là khung 1
    expect(page.scenes[0].compile).toHaveBeenCalledTimes(1);
    expect(page.scenes[0].quality.start).toHaveBeenCalledTimes(1);
    expect(page.stages[0].renderer.setAnimationLoop).toHaveBeenCalledWith(expect.any(Function));
    expect(page.onFail).not.toHaveBeenCalled();
    handle.dispose();
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1);
  });

  it('mất GPU sau khi live: "Dựng lại cảnh" dựng trên sân khấu MỚI, restore(snapshot) rồi live lại; mất lần hai thì về tĩnh', async () => {
    const page = harness();
    await page.start();
    const snapshot = { weights: { 'lop-hai': 0 } }; // trạng thái lúc mất GPU mà restore() phải đem về
    page.scenes[0].studio.snapshot.mockReturnValue(snapshot);
    page.stages[0].lose(LOST);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1); // lần dựng cũ gỡ ngay, poster chờ người xem bấm
    expect(page.sma.state).toBe('lost');

    await page.rebuild();
    expect(page.stages).toHaveLength(2); // renderer và canvas MỚI: WebGPURenderer không tự khôi phục được
    expect(page.scenes[1].studio.restore).toHaveBeenCalledWith(snapshot);
    expect(page.shellLog()).toEqual([...OPENED, 'showLost', 'setState loading', ...OPENED]);
    expect(page.shell.crossfade).toHaveBeenLastCalledWith(page.stages[1].renderer.domElement);
    expect(page.scenes[1].quality.start).toHaveBeenCalledTimes(1);
    expect(page.sma.state).toBe('live');
    expect(page.onFail).not.toHaveBeenCalled();

    page.stages[1].lose(LOST); // lần hai: không mời dựng lại nữa
    expect(page.onFail).toHaveBeenCalledTimes(1);
    expect(page.onFail).toHaveBeenCalledWith('device-lost', expect.any(Error));
    expect(page.stages[1].dispose).toHaveBeenCalledTimes(1);
    expect(page.shell.showLost).toHaveBeenCalledTimes(1);
  });
});

describe('run · "Dựng lại cảnh" quá hạn 10 s (GĐ 5)', () => {
  // createStage là lần chờ của rebuild ngay trước bringUp; restore, compile, crossfade là các lần chờ trong bringUp.
  it.each(['createStage', 'restore', 'compile', 'crossfade'])(
    'hạn tới khi %s còn dở → tĩnh "timeout" một lần; phần xong muộn không đụng gì ngoài việc tự dọn',
    async (step) => {
      vi.useFakeTimers();
      const page = harness();
      await page.start();
      page.stages[0].lose(LOST);
      const held = page.hold(step); // lần gọi của lần dựng lại (lần mở trang đã xong)
      const rebuilt = page.rebuild();
      await vi.advanceTimersByTimeAsync(9_999);
      expect(page.onFail).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await rebuilt;
      expect(page.onFail).toHaveBeenCalledTimes(1);
      expect(page.onFail).toHaveBeenCalledWith('timeout', expect.any(DeadlineError));
      // Gỡ ngay lúc quá hạn, không chờ bước còn dở (createStage còn dở thì run.js chưa có sân khấu nào để gỡ).
      expect(page.stages[1].dispose).toHaveBeenCalledTimes(step === 'createStage' ? 0 : 1);

      held.resolve(); // bước đó xong sau hạn: lần dựng phải dừng êm
      await vi.advanceTimersByTimeAsync(0);
      expect(page.afterStatic()).toEqual([]); // không vỏ trang, không __sma, không gắn nghe, không dựng tiếp
      expect(page.stages[1].dispose).toHaveBeenCalledTimes(1); // sân khấu đến muộn: disposer đã đóng, add() gỡ ngay
    },
  );
});

describe('run · lần mở trang quá hạn: boot đã về tĩnh (GĐ 5)', () => {
  it('boot hết hạn khi createStage còn dở → sân khấu đến muộn bị gỡ, không dựng cảnh, không đụng tới trang', async () => {
    const page = harness();
    const init = page.hold('createStage'); // renderer.init() của lần mở trang
    const started = page.start();
    page.bootTimeout();
    init.resolve(); // xong sau hạn
    await started;
    expect(page.afterStatic()).toEqual([]);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1);
    expect(page.onFail).not.toHaveBeenCalled();
  });

  it.each([
    ['mất GPU', (stage) => stage.lose(LOST)],
    ['3 lỗi GPU trong 1 giây', (stage) => [1, 2, 3].forEach(() => stage.fault(GPU_ERROR))],
  ])('boot hết hạn khi compile còn dở, rồi %s → bỏ qua: không về tĩnh lần hai, lý do vẫn là "timeout"', async (_event, fire) => {
    const page = harness();
    const compile = page.hold('compile');
    const started = page.start();
    await compile.reached; // run.js đang chờ compile(): onLost, onError đã gắn
    page.bootTimeout();
    fire(page.stages[0]);
    expect(page.onFail).not.toHaveBeenCalled();
    expect(page.sma.reason).toBe('timeout');

    compile.resolve();
    await started;
    expect(page.afterStatic()).toEqual([]);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1); // gone() sau compile() dọn lần dựng
  });
});

describe('run · công thức trong link (GĐ 9)', () => {
  // buildScene giả đặt công thức của cảnh vừa dựng (như scene.js áp xong `recipe` lúc dựng).
  const withRecipe = (page, text) => {
    const build = buildScene.getMockImplementation();
    buildScene.mockImplementation((...args) => {
      const scene = build(...args);
      scene.studio.text = text;
      return scene;
    });
  };
  const workshopMock = () => {
    const open = vi.fn();
    mountWorkshop.mockReturnValue({ open, dispose() {}, isOpen: false });
    return open;
  };

  it('trang mở với công thức khác rỗng sau khi áp: lúc live mở xưởng { grind: false, recipe: true }, không gợi ý, không lời mời', async () => {
    const page = harness();
    withRecipe(page, 'lop-hai:0');
    const open = workshopMock();
    await page.start({ recipe: 'lop-hai:0' });
    expect(buildScene).toHaveBeenLastCalledWith(expect.objectContaining({ recipe: 'lop-hai:0' }));
    expect(open).toHaveBeenCalledWith({ grind: false, recipe: true });
    expect(page.shell.showHint).not.toHaveBeenCalled();
    expect(page.shell.invite).not.toHaveBeenCalled();
    expect(page.scenes[0].input.onFirst).not.toHaveBeenCalled();
    expect(page.scenes[0].quality.guard).toHaveBeenCalledWith(true);
  });

  it('công thức áp xong thành rỗng (link toàn mục hỏng): như cũ, chờ cái chạm đầu tiên', async () => {
    const page = harness();
    const open = workshopMock();
    await page.start({ recipe: 'khong-co:1' });
    expect(open).not.toHaveBeenCalled();
    expect(page.scenes[0].input.onFirst).toHaveBeenCalledTimes(1);
  });

  it('không có công thức: như cũ (lời mời vào chế độ mài)', async () => {
    const page = harness();
    const open = workshopMock();
    await page.start();
    expect(open).not.toHaveBeenCalled();
    page.scenes[0].input.onFirst.mock.calls[0][0]();
    expect(page.shell.invite).toHaveBeenCalledTimes(1);
    page.shell.invite.mock.calls[0][0](); // bấm lời mời: gọi không tham số
    expect(open).toHaveBeenCalledWith({ grind: true });
  });

  it('"Dựng lại cảnh" không áp lại công thức của link và không mở xưởng lần nữa', async () => {
    const page = harness();
    withRecipe(page, 'lop-hai:0');
    const open = workshopMock();
    await page.start({ recipe: 'lop-hai:0' });
    open.mockClear();
    page.stages[0].lose(LOST);
    await page.rebuild();
    expect(buildScene).toHaveBeenLastCalledWith(expect.objectContaining({ recipe: null }));
    expect(open).not.toHaveBeenCalled();
  });

  it('trang mở theo công thức: xóa gợi ý/lời mời (clearHint) và cái chạm đầu tiên không mời nữa vì thanh lớp đã mở', async () => {
    const page = harness();
    withRecipe(page, 'lop-hai:0');
    const open = workshopMock();
    let isOpen = false;
    open.mockImplementation(() => { isOpen = true; });
    mountWorkshop.mockReturnValue({ open, dispose() {}, get isOpen() { return isOpen; } });
    await page.start({ recipe: 'lop-hai:0' });
    expect(page.shell.clearHint).toHaveBeenCalledTimes(1);
    // mở xưởng bằng đường khác trước cái chạm đầu: không có onFirst nào được gắn ở nhánh công thức
    expect(page.scenes[0].input.onFirst).not.toHaveBeenCalled();
  });

  it('chạm đầu tiên sau khi người xem đã mở thanh lớp bằng link dán: không mời mài (mời chỉ khi thanh lớp đóng)', async () => {
    const page = harness();
    let isOpen = false;
    const open = vi.fn(() => { isOpen = true; });
    mountWorkshop.mockReturnValue({ open, dispose() {}, get isOpen() { return isOpen; } });
    const handle = await page.start();
    window.history.replaceState(null, '', '#r=lop-hai:0');
    window.dispatchEvent(new Event('hashchange'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(open).toHaveBeenCalledWith({ grind: false, recipe: true });
    expect(page.shell.clearHint).toHaveBeenCalledTimes(1); // gợi ý đang hiện bị xóa
    page.scenes[0].input.onFirst.mock.calls[0][0](); // cái chạm đầu tiên
    expect(page.shell.invite).not.toHaveBeenCalled();
    handle.dispose();
    window.history.replaceState(null, '', window.location.pathname);
  });

  it('syncRecipeUrl gắn lúc live (nghe hashchange) và gỡ cùng disposer', async () => {
    const page = harness();
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const handle = await page.start();
    const added = add.mock.calls.filter(([type]) => type === 'hashchange');
    expect(added).toHaveLength(1);
    expect(page.scenes[0].studio.onChange).toHaveBeenCalledTimes(1);
    handle.dispose();
    expect(remove.mock.calls.filter(([type]) => type === 'hashchange').map(([, fn]) => fn)).toEqual([added[0][1]]);
  });

  it('người xem dán link khác khi cảnh live: áp công thức rồi mở xưởng theo công thức', async () => {
    const page = harness();
    const open = workshopMock();
    const handle = await page.start();
    window.history.replaceState(null, '', '#r=lop-hai:0');
    window.dispatchEvent(new Event('hashchange'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(page.scenes[0].studio.applyRecipe).toHaveBeenCalledWith('lop-hai:0');
    expect(open).toHaveBeenCalledWith({ grind: false, recipe: true });
    handle.dispose();
    window.history.replaceState(null, '', window.location.pathname);
  });
});
