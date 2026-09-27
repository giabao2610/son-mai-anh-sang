import { describe, it, expect } from 'vitest';
import {
  NoToneMapping, MaterialBlending, SRGBColorSpace, Scene, PerspectiveCamera, Vector4,
} from 'three/webgpu';
import { uniform } from 'three/tsl';
import { buildOutputNode, createPipeline } from '../../src/engine/gpu/pipeline.js';

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

describe('buildOutputNode', () => {
  it('mọi build theo thứ tự → renderOutput(…, NoToneMapping) → mọi display theo thứ tự → vec4(rgb, 1)', () => {
    const calls = [];
    const color = marker();
    const channel = () => null;
    const weights = { cot: uniform(1), a: uniform(0.5), b: uniform(0.25) };
    const layers = [
      { id: 'cot', layer: { dispose() {} } }, // lớp không có post: bỏ qua
      recordingLayer('a', calls, { build: true, display: true }),
      recordingLayer('b', calls, { build: true, display: true }),
    ];

    const result = buildOutputNode({ color, channel, layers, weight: (id) => weights[id] });

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
    }

    expect(result.isNode).toBe(true);
    const join = unwrap(result);
    expect(join.nodeType).toBe('vec4');
    expect(join.nodes[0].node).toBe(calls[3].out);
    expect(join.nodes[0].components).toBe('xyz');
    expect(join.nodes[1].value).toBe(1);
  });

  it('không lớp nào có post: màu scene pass vẫn qua renderOutput và alpha = 1', () => {
    const color = marker();
    const layers = [{ id: 'cot', layer: { dispose() {} } }];
    const join = unwrap(buildOutputNode({ color, channel: () => null, layers, weight: () => uniform(1) }));
    const ro = join.nodes[0].node;
    expect(ro.isRenderOutputNode).toBe(true);
    expect(ro.colorNode).toBe(color);
    expect(join.nodes[1].value).toBe(1);
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
    expect(p.views()).toEqual([{ id: 'final', label: 'final', ready: true }]);
    expect(typeof p.render).toBe('function');
    expect(typeof p.compile).toBe('function');
    expect(() => { p.dispose(); p.dispose(); }).not.toThrow();
  });
});
