// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze.
import { describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
import { color, mix, uniform, vec3 } from 'three/tsl';
import { buildScene } from '../../src/engine/gpu/scene.js';
import { createDisposer } from '../../src/engine/gpu/disposer.js';
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
        const mesh = new Mesh(new BoxGeometry(), material);
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

/** Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). Máy có DPR 2. */
function fakeStage(backend) {
  const renderer = fakeRenderer();
  let dprMax = Infinity;
  const canvas = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }) });
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
function fakeWin() {
  const frames = [];
  const win = Object.assign(new EventTarget(), {
    navigator: { userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 0 },
    performance: { now: () => 0 },
    requestAnimationFrame: (cb) => frames.push(cb),
    setTimeout,
    clearTimeout,
    document: Object.assign(new EventTarget(), { hidden: false }),
  });
  return { win, frames, flush: () => frames.splice(0).forEach((cb) => cb(16)) };
}

function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, tools = [] } = {}) {
  const stage = fakeStage(backend);
  const disposer = createDisposer();
  const { win, frames, flush } = fakeWin();
  if (tools.length > 0) win.document = new JSDOM('').window.document; // thanh công cụ là DOM thật
  const scene = buildScene({
    stage, disposer, painting: setup ? { ...painting, setup } : painting, meta, flags,
    now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools,
  });
  const renders = () => stage.renderer.render.mock.calls.length;
  return { stage, disposer, scene, frames, flush, renders };
}

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
    const { scene, stage } = build();
    scene.quality.start();
    const seen = [];
    scene.quality.onChange((q) => seen.push(q.steps.length));
    let ms = 0;
    for (let i = 0; i < 280; i++) scene.step((ms += 25)); // 7 giây ở 40 fps
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([2, 1.75]);
    expect(scene.studio.quality()).toMatchObject({ level: 'cao', steps: ['dpr=1.75'], guarding: false });
    expect(seen).toEqual([1]);
    scene.quality.guard(true);
    for (let i = 0; i < 400; i++) scene.step((ms += 25));
    expect(scene.studio.quality()).toMatchObject({ steps: ['dpr=1.75'], guarding: true });
    for (let i = 0; i < 160; i++) scene.step((ms += 50)); // 20 fps: quá tải nặng, vẫn hạ
    expect(scene.studio.quality().steps.slice(0, 2)).toEqual(['dpr=1.75', 'dpr=1.5']);
  });

  it('bộ điều chỉnh chỉ đo từ lúc live (run.js gọi start() sau hòa dần): trước đó 40 fps cũng không hạ', () => {
    const { scene, stage } = build();
    let ms = 0;
    for (let i = 0; i < 400; i++) scene.step((ms += 25)); // 10 giây chưa live (khung ẩn, hòa dần)
    expect(stage.setDpr.mock.calls).toEqual([[2]]);
    scene.quality.start();
    for (let i = 0; i < 280; i++) scene.step((ms += 25));
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
    const { stage, scene } = build({ setup: () => ({ onGesture }), tools: [lens] });
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
