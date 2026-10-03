// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze, chữ đi theo vật, móc lần vẽ.
import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
import { color, mix, uniform, vec3 } from 'three/tsl';
import { buildScene } from '../../src/engine/gpu/scene.js';
import { createDisposer } from '../../src/engine/gpu/disposer.js';
import { CAPTION_SECONDS } from '../../src/ui/captions.js';
import { fakeRenderer } from '../helpers/fake-ctx.js';

/** Test gắn hàm vào đây để nghe update() của lớp tô màu. */
const hooks = { update: null };
/** Bức giả hai lớp: Cốt (một khối đất sét) và một lớp tô màu theo trọng số. */
const meta = { layers: [{ id: 'cot', name: 'Cốt', files: [] }, { id: 'to-mau', name: 'Tô màu', files: [] }] };
const painting = {
  camera: { position: [0, 2, 6], target: [0, 1, 0], fov: 40, azimuth: [-1, 1], polar: [0.6, 1.5], distance: [4, 10] },
  layers: [
    {
      id: 'cot',
      knobs: [],
      createLayer(ctx, shared) {
        const material = new MeshStandardNodeMaterial();
        material.colorNode = color(ctx.palette.hex.datSet);
        material.emissiveNode = vec3(0);
        const mesh = Object.assign(new Mesh(new BoxGeometry(), material), { name: 'khoi' });
        ctx.scene.add(mesh);
        shared.cot = { material };
        return { objects: [mesh], dispose: () => ctx.scene.remove(mesh) };
      },
    },
    {
      id: 'to-mau',
      knobs: [],
      createLayer(ctx, shared) {
        shared.cot.material.colorNode = mix(color(ctx.palette.hex.datSet), color(ctx.palette.hex.doSon), ctx.weight('to-mau'));
        return { update: (dt, t) => hooks.update?.(dt, t), dispose() {} };
      },
    },
  ],
};

/**
 * Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). Máy có DPR 2.
 * Canvas 640 × 400 nằm trong [data-stage] của trang (vùng chữ đi theo vật gắn cạnh nó).
 */
function fakeStage(backend, doc) {
  const renderer = fakeRenderer();
  let dprMax = Infinity;
  const canvas = Object.assign(new EventTarget(), {
    parentElement: doc.querySelector('[data-stage]'),
    clientWidth: 640,
    clientHeight: 400,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }),
  });
  Object.assign(renderer, { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace, domElement: canvas });
  return {
    backend,
    renderer,
    scene: new Scene(),
    camera: new PerspectiveCamera(),
    u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
    controls: { enabled: true, update: vi.fn() },
    useCamera: vi.fn(),
    setDpr: vi.fn((v) => {
      dprMax = v;
    }),
    dpr: () => Math.min(2, dprMax),
    tick: vi.fn(() => ({ t: 0.5, dt: 1 / 60 })),
    breathe: vi.fn(),
  };
}

/** Cửa sổ giả: requestAnimationFrame xếp hàng, flush() chạy như một nhịp của trình duyệt. */
function fakeWin(doc) {
  const frames = [];
  const win = Object.assign(new EventTarget(), {
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 0 },
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => frames.push(cb),
    setTimeout,
    clearTimeout,
    document: doc,
  });
  return { win, frames, flush: () => frames.splice(0).forEach((cb) => cb(16)) };
}

function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, tools = [], content = null } = {}) {
  // Trang là DOM thật: [data-stage] chứa canvas và vùng chữ đi theo vật; thanh công cụ gắn vào body.
  const doc = new JSDOM('<div data-stage></div>').window.document;
  const stage = fakeStage(backend, doc);
  const disposer = createDisposer();
  const { win, frames, flush } = fakeWin(doc);
  const scene = buildScene({
    stage, disposer, painting: setup ? { ...painting, setup } : painting, meta, flags,
    now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools, content,
  });
  const renders = () => stage.renderer.render.mock.calls.length;
  return { stage, disposer, scene, frames, flush, renders, win, doc };
}

/**
 * Máy giả chậm vì chính nó: vẽ một khung mất `gap` ms. Khung bị bỏ (bộ điều chỉnh đang thử ngừng vẽ, tuner.js) thì máy rảnh, và
 * trình duyệt gọi rAF theo màn hình 60 Hz. Trả hàm chạy n khung, nhớ thời điểm giữa các lần gọi.
 */
function slowMachine({ scene, renders }) {
  let ms = 0;
  let idle = false;
  return (n, gap) => {
    for (let i = 0; i < n; i++) {
      const before = renders();
      scene.step((ms += idle ? 1000 / 60 : gap));
      idle = renders() === before;
    }
  };
}

/** Cảnh có một dòng chữ trong content.captions; setup của bức giữ ctx.captions lại cho test. */
function buildWithCaptions() {
  let captions = null;
  const content = { hint: '', captions: { 'tram-nam': { lines: ['Trăm năm trong cõi người ta'], source: 'Truyện Kiều', author: 'Nguyễn Du' } } };
  const built = build({ content, setup: (ctx) => {
    captions = ctx.captions;
    return {};
  } });
  // jsdom không tính bố cục: vùng chữ phủ kín [data-stage] nên rộng bằng canvas giả (ui/captions.js đọc để giữ chữ trong vùng).
  Object.defineProperty(built.doc.querySelector('[data-captions]'), 'clientWidth', { value: 640 });
  return { ...built, captions };
}
/** x (px trong canvas) mà chữ đang đứng, đọc từ transform của nó. */
const captionX = (caption) => Number(/translate\(([-+\d.e]+)px/.exec(caption.style.transform)[1]);

describe('buildScene', () => {
  it('mức theo backend THẬT: WebGPU máy tính → cao (dpr 2), WebGL2 → vừa (dpr 1.5); camera theo CameraSpec của bức', () => {
    const a = build();
    expect(a.scene.level).toBe('cao');
    expect(a.stage.setDpr).toHaveBeenCalledWith(2);
    expect(a.stage.useCamera).toHaveBeenCalledWith(painting.camera);
    const b = build({ backend: 'webgl2' });
    expect(b.scene.level).toBe('vua');
    expect(b.stage.setDpr).toHaveBeenCalledWith(1.5);
  });

  it('một khung: đồng hồ → lớp → camera thở → controls → render → số đo', () => {
    const { stage, scene, renders } = build();
    stage.renderer.info.render.drawCalls = 7;
    scene.step(1000);
    expect(stage.tick).toHaveBeenCalledWith(1000);
    expect(stage.breathe).toHaveBeenCalledWith(0.5);
    expect(stage.controls.update).toHaveBeenCalled();
    expect(renders()).toBe(1);
    expect(scene.studio.stats().drawCalls).toBe(7);
  });

  it('vòng lặp đang chạy: đổi trọng số không vẽ thêm; sau freeze(): vẽ lại ở nhịp rAF kế tiếp, gộp nhiều thay đổi làm một', async () => {
    const { scene, frames, flush, renders } = build();
    await scene.studio.setWeight('to-mau', 0);
    expect(frames).toHaveLength(0);
    scene.freeze();
    const a = scene.studio.setWeight('to-mau', 1);
    const b = scene.studio.setWeight('to-mau', 0.5);
    expect(frames).toHaveLength(1); // hai thay đổi trong cùng một nhịp: một lần vẽ
    expect(renders()).toBe(0);
    flush();
    await Promise.all([a, b]);
    expect(renders()).toBe(1);
    expect(scene.studio.weight('to-mau').value).toBe(0.5);
  });

  it('vẽ lại khung đứng yên (GĐ 4): setup.update(0, t) → layer.update(0, t) → render, với t của khung đang giữ', async () => {
    const order = [];
    hooks.update = (dt, t) => order.push(['lop', dt, t]);
    const { stage, scene, flush, renders } = build({ setup: () => ({ update: (dt, t) => order.push(['bức', dt, t]) }) });
    stage.u.time.value = 1.5;
    stage.renderer.render.mockImplementation(() => order.push(['render']));
    scene.freeze();
    const done = scene.studio.setWeight('to-mau', 0);
    flush();
    await done;
    hooks.update = null;
    expect(order).toEqual([['bức', 0, 1.5], ['lop', 0, 1.5], ['render']]);
    expect(renders()).toBe(1);
  });

  it('vẽ lại khung đứng yên mà render ném lỗi: Promise hỏng (không treo mãi), lần sau vẽ lại được', async () => {
    const { stage, scene, flush, renders } = build();
    scene.freeze();
    stage.renderer.render.mockImplementationOnce(() => {
      throw new Error('GPU hỏng');
    });
    const a = scene.studio.setWeight('to-mau', 0);
    flush();
    await expect(a).rejects.toThrow('GPU hỏng');
    const b = scene.studio.setWeight('to-mau', 1);
    flush();
    await expect(b).resolves.toBeUndefined();
    expect(renders()).toBe(2);
  });

  it('?level ép mức: WebGPU máy tính mà ?level=thap thì mức thấp (dpr 1.25)', () => {
    const { scene, stage } = build({ flags: { level: 'thap' } });
    expect(scene.level).toBe('thap');
    expect(stage.setDpr).toHaveBeenCalledWith(1.25);
  });

  it('bộ điều chỉnh: 40 fps thì hạ nấc dpr, huy hiệu được báo; thanh lớp mở (guard) thì chậm vừa phải không hạ nữa', () => {
    const built = build();
    const { scene, stage } = built;
    const run = slowMachine(built);
    scene.quality.start();
    const seen = [];
    scene.quality.onChange((q) => seen.push(q.steps.length));
    run(280, 25); // 7 giây ở 40 fps
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([2, 1.75]);
    expect(scene.studio.quality()).toMatchObject({ level: 'cao', steps: ['dpr=1.75'], guarding: false });
    expect(seen).toEqual([1]);
    scene.quality.guard(true);
    run(400, 25);
    expect(scene.studio.quality()).toMatchObject({ steps: ['dpr=1.75'], guarding: true });
    run(160, 50); // 20 fps: quá tải nặng, vẫn hạ
    expect(scene.studio.quality().steps.slice(0, 2)).toEqual(['dpr=1.75', 'dpr=1.5']);
  });

  it('khóa 30 fps mà không đo được GPU (tiết kiệm pin trên GPU Apple): thử ngừng vẽ 6 khung (không vẽ, đồng hồ đứng), rồi "bị khóa nhịp", không hạ nấc nào', () => {
    const { scene, stage, renders } = build();
    scene.quality.start();
    let ms = 0;
    for (let i = 0; i < 240; i++) scene.step((ms += 1000 / 30)); // 8 giây; trình duyệt gọi rAF mỗi 33 ms, vẽ hay không cũng vậy
    expect([renders(), stage.tick.mock.calls.length]).toEqual([234, 234]); // 6 khung không vẽ, không tiến đồng hồ
    expect(scene.studio.quality()).toMatchObject({ capped: true, steps: [] });
    expect(stage.setDpr.mock.calls).toEqual([[2]]);
  });

  it('bộ điều chỉnh chỉ đo từ lúc live (run.js gọi start() sau hòa dần): trước đó 40 fps cũng không hạ', () => {
    const built = build();
    const { scene, stage } = built;
    const run = slowMachine(built);
    run(400, 25); // 10 giây chưa live (khung ẩn, hòa dần)
    expect(stage.setDpr.mock.calls).toEqual([[2]]);
    scene.quality.start();
    run(280, 25);
    expect(scene.studio.quality().steps).toEqual(['dpr=1.75']);
  });

  it('ms GPU (GĐ 4): mẫu của gpu-timer vào số đo và bộ điều chỉnh (khóa 30 fps mà GPU nhàn: không hạ); quality() có gpu', async () => {
    const { scene, stage } = build();
    stage.renderer.backend = { trackTimestamp: true };
    stage.renderer.info.compute = { frameCalls: 0 };
    stage.renderer.resolveTimestampsAsync.mockImplementation(async () => 5); // GPU chỉ bận 5 ms mỗi khung
    scene.quality.start();
    expect(scene.studio.quality()).toMatchObject({ gpu: false, locked: [] });
    let ms = 0;
    for (let i = 0; i < 240; i++) {
      scene.step((ms += 2 * 1000 / 60)); // nhịp 33 ms như bị khóa 30 fps
      await Promise.resolve(); // để kết quả của gpu-timer về
      await Promise.resolve();
    }
    expect(scene.studio.stats().gpuMs).toBe(5);
    // Nhịp 33 ms mà máy nhàn: trình duyệt khóa nhịp. Đường nhịp (GĐ 3) sẽ hạ nấc ở giây thứ 6; đường tải thì không.
    expect(scene.studio.quality()).toMatchObject({ gpu: true, capped: true, steps: [] });
    expect(stage.renderer.resolveTimestampsAsync).toHaveBeenCalledWith('render');
  });

  it('GPU báo số chồng nhau (160 ms mỗi khung ở 60 khung/giây, GPU Apple): thôi đo, Sổ tay "—", bộ điều chỉnh theo nhịp', async () => {
    const { scene, stage } = build();
    stage.renderer.backend = { trackTimestamp: true };
    stage.renderer.info.compute = { frameCalls: 0 };
    stage.renderer.resolveTimestampsAsync.mockImplementation(async () => 160);
    scene.quality.start();
    let ms = 0;
    const shown = new Set(); // ms GPU mà Sổ tay đọc được ở từng khung
    for (let i = 0; i < 20; i++) {
      scene.step((ms += 1000 / 60));
      await Promise.resolve();
      await Promise.resolve();
      shown.add(scene.studio.stats().gpuMs);
    }
    expect([...shown]).toEqual([null]); // không khung nào hiện 160 ms, kể cả mẫu của lần hỏi đầu
    expect(scene.studio.quality()).toMatchObject({ gpu: false, steps: [] });
    expect(stage.renderer.resolveTimestampsAsync.mock.calls.length).toBeLessThanOrEqual(4); // lần đầu (bỏ: chưa có trần) + 3 lần vô lý
  });

  it('?freeze: không có bộ điều chỉnh (ảnh tất định); hạ/nâng tay vẫn được, rồi vẽ lại', async () => {
    const { scene, stage, flush, renders } = build({ flags: { freeze: 10 } });
    let ms = 0;
    for (let i = 0; i < 400; i++) scene.step((ms += 40));
    expect(stage.setDpr.mock.calls).toEqual([[2]]);
    scene.freeze();
    // degrade() áp nấc rồi mới xin nhịp vẽ lại (sau một microtask): chờ một vòng rồi mới chạy nhịp rAF giả.
    const tick = () => new Promise((resolve) => setTimeout(resolve, 0)).then(flush);
    const down = scene.studio.degrade();
    await tick();
    expect(await down).toBe(true);
    expect(stage.setDpr).toHaveBeenLastCalledWith(1.75);
    const up = scene.studio.upgrade();
    await tick();
    expect(await up).toBe(true);
    expect(stage.setDpr).toHaveBeenLastCalledWith(2);
    expect(renders()).toBe(402);
  });

  it("cử chỉ (GĐ 4): công cụ đang bật nhận trước, dùng rồi thì bức không nhận; 'hover' không bao giờ tới bức", async () => {
    const onGesture = vi.fn();
    const seen = [];
    const lens = {
      id: 'kinh',
      mount: () => ({ onGesture: (g) => { seen.push(g.kind); return g.kind === 'tap'; }, dispose() {} }),
    };
    const { stage, scene, win } = build({ setup: () => ({ onGesture }), tools: [lens] });
    const canvas = stage.renderer.domElement;
    const event = (type, extra) => Object.assign(new Event(type), { clientX: 320, clientY: 200, pointerId: 1, button: 0, ...extra });
    const tap = () => {
      canvas.dispatchEvent(event('pointerdown', { pointerType: 'mouse' }));
      canvas.dispatchEvent(event('pointerup', { pointerType: 'mouse' }));
    };
    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
    tap();
    scene.step(1000);
    expect(onGesture.mock.calls.map(([g]) => g.kind)).toEqual(['tap']); // chưa bật công cụ: bức nhận chạm, không nhận hover
    await scene.studio.setTool('kinh');
    expect(scene.studio.tools()).toEqual([{ id: 'kinh', on: true }]);
    // Người xem bật công cụ mất vài giây: lần chạm sau không ghép với lần trước thành chạm hai lần (GĐ 5).
    win.performance.now = () => 5000;
    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
    tap();
    scene.step(1016);
    expect(seen).toEqual(['hover', 'tap']);
    expect(onGesture).toHaveBeenCalledTimes(1);
  });

  it('đứng yên ở ?freeze, chưa bật công cụ nào: rê chuột không vẽ lại (chỉ công cụ nhận hover); chạm thì vẽ lại cho bức', async () => {
    const onGesture = vi.fn();
    const { stage, scene, frames, flush } = build({ setup: () => ({ onGesture }), tools: [{ id: 'kinh', mount: () => ({ dispose() {} }) }] });
    scene.freeze();
    const canvas = stage.renderer.domElement;
    const event = (type, extra) => Object.assign(new Event(type), { clientX: 320, clientY: 200, pointerId: 1, button: 0, ...extra });
    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
    expect(frames).toHaveLength(0);
    canvas.dispatchEvent(event('pointerdown', { pointerType: 'mouse' }));
    canvas.dispatchEvent(event('pointerup', { pointerType: 'mouse' }));
    expect(frames).toHaveLength(1);
    flush();
    expect(onGesture.mock.calls.map(([g]) => g.kind)).toEqual(['tap']);
  });

  it('đứng yên ở ?freeze: cử chỉ tới thì vẽ lại ở nhịp rAF kế tiếp, và công cụ nhận cử chỉ đó (rê Kính mài)', async () => {
    const seen = [];
    const lens = { id: 'kinh', mount: () => ({ onGesture: (g) => seen.push(g.kind) > 0, dispose() {} }) };
    const { stage, scene, frames, flush, renders } = build({ tools: [lens] });
    scene.freeze();
    const on = scene.studio.setTool('kinh'); // vẽ lại ở nhịp rAF sau khi công cụ đã bật (sau một microtask)
    await new Promise((resolve) => setTimeout(resolve, 0));
    flush();
    await on;
    const before = renders();
    stage.renderer.domElement.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 10, clientY: 10, pointerType: 'mouse', buttons: 0 }));
    expect(frames).toHaveLength(1);
    flush();
    expect(seen).toEqual(['hover']);
    expect(renders()).toBe(before + 1);
  });

  it('chữ đi theo vật (GĐ 5): setup nhận ctx.captions (keys từ content.captions); mỗi khung chữ theo camera của CHÍNH khung đó; hết giờ thì gỡ', () => {
    const { stage, scene, doc, captions } = buildWithCaptions();
    expect(captions.keys).toEqual(['tram-nam']);
    captions.show('tram-nam', () => ({ x: 0, y: 0, z: -5 })); // trước camera (camera giả ở gốc, nhìn về −z)
    const region = doc.querySelector('[data-stage] > [data-captions]');
    expect(region.getAttribute('aria-live')).toBe('polite');
    const caption = region.querySelector('.caption');
    expect(caption.textContent).toBe('Trăm năm trong cõi người taTruyện Kiều · Nguyễn Du');
    expect(caption.hasAttribute('data-away')).toBe(false); // điểm neo trong khung
    expect(caption.style.transform).toBe('translate(320px, 200px) translate(-50%, -100%)'); // giữa canvas 640 × 400
    // Người xem kéo: controls.update() của khung này mới dời camera sang phải. Chữ được chiếu SAU nó, nên trôi về bên trái
    // ngay trong khung này, không trễ một khung.
    stage.controls.update.mockImplementation(() => {
      stage.camera.position.x = 1;
    });
    scene.step(1000);
    expect(captionX(caption)).toBeLessThan(320);
    // Hết CAPTION_SECONDS theo đồng hồ của cảnh (stage.tick giả không ghi uniform, nên test ghi thẳng): khung sau gỡ chữ.
    stage.u.time.value = CAPTION_SECONDS;
    scene.step(1016);
    expect(region.childElementCount).toBe(0);
    expect(region.isConnected).toBe(true); // vùng live vẫn còn, chỉ rỗng
  });

  it('chữ đi theo vật, đứng yên ở ?freeze: vẽ lại khung đang giữ thì chiếu lại chữ (camera vừa bị kéo); disposer gỡ vùng chữ', async () => {
    const { stage, scene, flush, disposer, doc, captions } = buildWithCaptions();
    scene.freeze();
    captions.show('tram-nam', () => ({ x: 0, y: 0, z: -5 })); // vòng lặp đã dừng: show() tự đặt chữ ngay
    const caption = doc.querySelector('[data-captions] .caption');
    expect(captionX(caption)).toBe(320);
    stage.camera.position.x = 1; // camera dời sang phải: điểm neo trôi về bên trái
    const done = scene.studio.setWeight('to-mau', 0);
    flush();
    await done;
    expect(captionX(caption)).toBeLessThan(320);
    disposer.closeAll();
    expect(doc.querySelector('[data-captions]')).toBeNull();
  });

  it('móc lần vẽ (GĐ 5): công cụ nhận api.draws; begin/end bọc render ở cả step() lẫn vẽ lại khung đứng yên; disposer gỡ móc', async () => {
    let api = null;
    const soi = { id: 'soi', mount: (a) => ((api = a), { dispose() {} }) };
    const content = { layers: { cot: { objects: { khoi: 'Khối đất' } } } };
    const { stage, scene, disposer, flush } = build({ tools: [soi], content });
    // Renderer giả có hàm vẽ như three: setRenderObjectFunction ghi lại hàm; mỗi render() của pipeline vẽ các vật của cảnh bằng
    // camera chính qua hàm vẽ hiện tại (_renderObjects), mỗi lần vẽ một draw call.
    const r = stage.renderer;
    let fn = null;
    r.setRenderObjectFunction.mockImplementation((f) => {
      fn = f;
    });
    r.getRenderObjectFunction.mockImplementation(() => fn);
    r.renderObject.mockImplementation(() => {
      r.info.render.drawCalls += 1;
    });
    r.render.mockImplementation(() => {
      for (const o of stage.scene.children.filter((c) => c.isMesh)) {
        (fn ?? r.renderObject).call(r, o, stage.scene, stage.camera, o.geometry, o.material, null, null, null, null);
      }
    });
    api.draws.start();
    expect(fn).not.toBeNull();
    scene.step(1000);
    // Tên lớp từ meta, nhãn vật từ content.layers[id].objects: scene.js đưa cả hai cho móc.
    expect(api.draws.list().map((d) => [d.layerId, d.layer, d.label])).toEqual([['cot', 'Cốt', 'Khối đất']]);
    // Đứng yên ở ?freeze: Từng sợi đổi sợi rồi gọi api.redraw(); khung N vẽ lại cũng được ghi (vật mới không thuộc lớp nào).
    scene.freeze();
    stage.scene.add(new Mesh(new BoxGeometry(), new MeshStandardNodeMaterial()));
    const done = api.redraw();
    flush();
    await done;
    expect(api.draws.list().map((d) => d.layerId)).toEqual(['cot', null]);
    disposer.closeAll();
    expect(fn).toBeNull(); // gỡ cảnh thì trả hàm vẽ cũ, kể cả khi công cụ không tự stop()
  });

  it('ms CPU của khung đi vào số đo của bàn thợ', () => {
    const { scene } = build();
    scene.step(1000);
    expect(scene.studio.stats()).toHaveProperty('cpuMs');
  });

  it('giảm chuyển động: bật/tắt lớp trên thanh lớp là ngay, không mờ dần', () => {
    const { scene } = build({ reducedMotion: true });
    scene.studio.setWeight('to-mau', 0, { tween: true });
    expect(scene.studio.weight('to-mau')).toEqual({ value: 0, target: 0 });
    const normal = build().scene;
    normal.studio.setWeight('to-mau', 0, { tween: true });
    expect(normal.studio.weight('to-mau')).toEqual({ value: 1, target: 0 });
  });

  it('disposer gỡ sạch: lớp rời scene; đã gỡ thì freeze + đổi trọng số không vẽ gì nữa', async () => {
    const { stage, disposer, scene, frames, renders } = build();
    expect(stage.scene.children.length).toBeGreaterThan(0);
    disposer.closeAll();
    expect(stage.scene.children).toHaveLength(0);
    scene.freeze();
    await scene.studio.setWeight('to-mau', 0);
    expect(frames).toHaveLength(0);
    expect(renders()).toBe(0);
  });
});
