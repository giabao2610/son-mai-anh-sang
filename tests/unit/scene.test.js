// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze.
import { describe, it, expect, vi } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
import { color, mix, uniform, vec3 } from 'three/tsl';
import { buildScene } from '../../src/engine/gpu/scene.js';
import { createDisposer } from '../../src/engine/gpu/disposer.js';
import { fakeRenderer } from '../helpers/fake-ctx.js';

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
        return { dispose() {} };
      },
    },
  ],
};

/** Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). */
function fakeStage(backend) {
  const renderer = fakeRenderer();
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
    setDpr: vi.fn(),
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

function build({ backend = 'webgpu', reducedMotion = false } = {}) {
  const stage = fakeStage(backend);
  const disposer = createDisposer();
  const { win, frames, flush } = fakeWin();
  const scene = buildScene({ stage, disposer, painting, meta, flags: {}, now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win });
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
