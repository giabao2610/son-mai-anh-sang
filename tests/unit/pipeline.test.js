// tests/unit/pipeline.test.js — nối post của các lớp (build → renderOutput → display), MRT, tap, view Normal lười; không cần GPU.
import { describe, it, expect, vi } from 'vitest';
import {
  NoToneMapping, MaterialBlending, SRGBColorSpace, Scene, PerspectiveCamera, Vector4,
} from 'three/webgpu';
import { uniform } from 'three/tsl';
import { buildFinalNode, createPipeline } from '../../src/engine/gpu/pipeline.js';

// three r186: vec4(a, b) trả về VarNode "intent" bọc một JoinNode. Bóc lớp vỏ để xem các thành phần.
const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);
// Node đánh dấu: mỗi chặng giả trả một node mới để lần theo đường đi của màu.
const marker = () => uniform(new Vector4());

function recordingLayer(id, calls, { build = false, display = false } = {}) {
  const post = {};
  if (build) post.build = (input) => { const out = marker(); calls.push({ stage: 'build', id, input, out }); return out; };
  if (display) post.display = (input) => { const out = marker(); calls.push({ stage: 'display', id, input, out }); return out; };
  return { id, layer: { post, dispose() {} } };
}

describe('buildFinalNode', () => {
  it('mọi build theo thứ tự → renderOutput(…, NoToneMapping) → mọi display theo thứ tự; trả ảnh cuối (chưa overlay)', () => {
    const calls = [];
    const color = marker();
    const channel = () => null;
    const weights = { cot: uniform(1), a: uniform(0.5), b: uniform(0.25) };
    const layers = [
      { id: 'cot', layer: { dispose() {} } }, // lớp không có post: bỏ qua
      recordingLayer('a', calls, { build: true, display: true }),
      recordingLayer('b', calls, { build: true, display: true }),
    ];

    const result = buildFinalNode({ color, channel, layers, weight: (id) => weights[id] });

    expect(calls.map((c) => `${c.stage}:${c.id}`)).toEqual(['build:a', 'build:b', 'display:a', 'display:b']);
    expect(calls[0].input.color).toBe(color);
    expect(calls[1].input.color).toBe(calls[0].out);
    const ro = calls[2].input.color;
    expect(ro.isRenderOutputNode).toBe(true);
    expect(ro.colorNode).toBe(calls[1].out);
    expect(ro.getToneMapping()).toBe(NoToneMapping);
    expect(calls[3].input.color).toBe(calls[2].out);
    for (const c of calls) {
      expect(c.input.channel).toBe(channel);
      expect(c.input.weight).toBe(weights[c.id]);
      expect(typeof c.input.tap).toBe('function');
    }
    expect(result).toBe(calls[3].out);
  });

  it('không lớp nào có post: ảnh cuối là màu scene pass qua renderOutput', () => {
    const color = marker();
    const layers = [{ id: 'cot', layer: { dispose() {} } }];
    const ro = buildFinalNode({ color, channel: () => null, layers, weight: () => uniform(1) });
    expect(ro.isRenderOutputNode).toBe(true);
    expect(ro.colorNode).toBe(color);
  });

  it('tap (GĐ 4): ghi theo thứ tự gặp, kèm id lớp; chụp ở build là tuyến tính, ở display là màu hiển thị', () => {
    const a = marker();
    const b = marker();
    const layers = [{
      id: 'phu-bong',
      layer: {
        post: {
          build: ({ color, tap }) => { tap('truoc-bloom', a); return color; },
          display: ({ color, tap }) => { tap('truoc-fxaa', b); return color; },
        },
        dispose() {},
      },
    }];
    const taps = [];
    buildFinalNode({ color: marker(), channel: () => null, layers, weight: () => uniform(1), taps });
    expect(taps).toEqual([
      { layerId: 'phu-bong', tapId: 'truoc-bloom', node: a, linear: true },
      { layerId: 'phu-bong', tapId: 'truoc-fxaa', node: b, linear: false },
    ]);
  });
});

describe('createPipeline (dựng đồ thị, không cần GPU)', () => {
  // RenderPipeline chỉ đọc hai trường này trong constructor; render()/compile() mới cần GPU thật.
  const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };

  it('MRT output + emissive (emissive blend theo material); channel() trả đúng node; kênh lạ thì ném lỗi', () => {
    const seen = {};
    const probe = {
      id: 'phu-bong',
      layer: {
        post: {
          build({ color, channel }) {
            seen.color = color;
            seen.output = channel('output');
            seen.emissive = channel('emissive');
            seen.depth = channel('depth');
            try { channel('normal'); } catch (err) { seen.error = err.message; }
            return color;
          },
        },
        dispose() {},
      },
    };
    const p = createPipeline({
      renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [probe], weight: () => uniform(1),
    });

    expect(seen.output).toBe(p.scenePass.getTextureNode('output'));
    expect(seen.color).toBe(seen.output);
    expect(seen.emissive).toBe(p.scenePass.getTextureNode('emissive'));
    expect(seen.depth).toBe(p.scenePass.getLinearDepthNode());
    expect(seen.error).toBe('Pipeline không có kênh "normal"');
    const passMRT = p.scenePass.getMRT();
    expect(Object.keys(passMRT.outputNodes)).toEqual(['output', 'emissive']);
    expect(passMRT.getBlendMode('emissive').blending).toBe(MaterialBlending);
    expect(p.views.list().map((v) => v.id)).toEqual(['final', 'emissive', 'normal', 'depth']);
    expect(typeof p.render).toBe('function');
    expect(typeof p.compile).toBe('function');
    expect(() => { p.dispose(); p.dispose(); }).not.toThrow();
  });

  it('renderPipeline.outputColorTransform = false: renderOutput chỉ chạy một lần, trong outputNode do buildFinalNode dựng', () => {
    const p = createPipeline({
      renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [], weight: () => uniform(1),
    });

    // Nếu dòng này bị mất: RenderPipeline._updateContext() sẽ tự bọc thêm MỘT renderOutput nữa
    // quanh outputNode (đã sRGB) bằng renderer.toneMapping/outputColorSpace lúc render() thật,
    // tô màu tuyến tính → sRGB hai lần. Test này canh trực tiếp cờ đó, không chỉ hình dạng đồ thị.
    expect(p.renderPipeline.outputColorTransform).toBe(false);

    const join = unwrap(p.renderPipeline.outputNode);
    expect(join.nodeType).toBe('vec4');
    expect(join.nodes[1].value).toBe(1);
    const ro = join.nodes[0].node;
    expect(ro.isRenderOutputNode).toBe(true);
    expect(ro.colorNode).toBe(p.scenePass.getTextureNode('output'));
    expect(ro.getToneMapping()).toBe(NoToneMapping);

    p.dispose();
  });

  it('requireView("normal") (GĐ 4): MRT thêm kênh normal (emissive vẫn blend theo material), ghép lại overlay trên chuỗi post CŨ, biên dịch trước', async () => {
    const calls = [];
    const layer = recordingLayer('phu-bong', calls, { build: true, display: true });
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [layer], weight: () => uniform(1) });
    p.scenePass.compileAsync = vi.fn(async () => {});
    const seen = [];
    p.views.setOverlays([{ id: 'kinh', fn: (final, view) => { seen.push(view('normal')); return final; } }]);
    expect(p.views.list().find((v) => v.id === 'normal').ready).toBe(false);
    const placeholder = seen[0];
    await p.views.require('normal');
    const passMRT = p.scenePass.getMRT();
    expect(Object.keys(passMRT.outputNodes)).toEqual(['output', 'emissive', 'normal']);
    expect(passMRT.getBlendMode('emissive').blending).toBe(MaterialBlending);
    expect(p.views.list().find((v) => v.id === 'normal').ready).toBe(true);
    expect(seen).toHaveLength(2); // overlay được ghép lại
    expect(seen[1]).not.toBe(placeholder);
    expect(seen[1]).toBe(p.scenePass.getTextureNode('normal'));
    expect(calls.map((c) => c.stage)).toEqual(['build', 'display']); // bloom, FXAA… KHÔNG dựng lại
    expect(p.scenePass.compileAsync).toHaveBeenCalledTimes(1);
    await p.views.require('normal'); // lần hai: không làm gì
    await p.views.require('depth');
    expect(p.scenePass.compileAsync).toHaveBeenCalledTimes(1);
    p.dispose();
  });

  it('bấm Normal hai lần liền khi đang mài (chưa biên dịch xong): MRT chỉ đổi một lần, biên dịch một lần, overlay ghép lại một lần', async () => {
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [], weight: () => uniform(1) });
    let done;
    p.scenePass.compileAsync = vi.fn(() => new Promise((resolve) => { done = resolve; }));
    const overlay = vi.fn((final) => final);
    p.views.setOverlays([{ id: 'kinh', fn: overlay }]);
    const setMRT = vi.spyOn(p.scenePass, 'setMRT');
    const first = p.views.require('normal');
    const second = p.views.require('normal');
    await second;
    done();
    await first;
    expect([setMRT.mock.calls.length, p.scenePass.compileAsync.mock.calls.length, overlay.mock.calls.length]).toEqual([1, 1, 2]);
    p.dispose();
  });
});
