// tests/unit/pipeline.test.js — nối post của các lớp (build → renderOutput → display), MRT, tap, view Normal lười, scene pass đứng đầu lượt cuối; GĐ 8: độ sâu tuyến tính theo loại camera, nhánh chọn view của công cụ học tự gán biến texture; không cần GPU.
import { describe, it, expect, vi } from 'vitest';
import {
  NoToneMapping, MaterialBlending, NodeMaterial, QuadMesh, SRGBColorSpace, Scene, OrthographicCamera, PerspectiveCamera, Vector2, Vector4,
} from 'three/webgpu';
import { rtt, uniform, vec4 } from 'three/tsl';
import { buildFinalNode, createPipeline, linearDepth } from '../../src/engine/gpu/pipeline.js';
import { lensNode } from '../../src/engine/tools/kinh-mai.js';
import { peelNode } from '../../src/engine/tools/lot-lop.js';
import { buildFinalPass } from '../helpers/final-pass.js';
import { compileMaterial, nodesOf } from '../helpers/nodes.js';

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

    // outputNode là Fn của views.js (scene pass đứng đầu): dựng như three dựng lượt cuối để lấy vec4(rgb, 1) mà nó trả.
    const join = unwrap(buildFinalPass(p.renderPipeline.outputNode).stack.outputNode);
    expect(join.nodeType).toBe('vec4');
    expect(join.nodes[1].value).toBe(1);
    const ro = join.nodes[0].node;
    expect(ro.isRenderOutputNode).toBe(true);
    expect(ro.colorNode).toBe(p.scenePass.getTextureNode('output'));
    expect(ro.getToneMapping()).toBe(NoToneMapping);

    p.dispose();
  });

  it('lượt cuối: scene pass chạy updateBefore ĐẦU TIÊN, cả khi display vẽ ra RTT (như FXAA) và overlay đọc texture của scene pass', () => {
    // display như Phủ bóng: fxaa(node) vẽ chuỗi phía trước ra một RTT (Phụ lục A.42). three gọi updateBefore theo thứ tự node dựng
    // xong (con trước cha): không có Fn của views.js thì RTT chạy trước, gỡ móc lần vẽ rồi vẽ scene pass từ bên trong nó (A.53).
    let rttNode = null;
    const display = ({ color }) => {
      rttNode = rtt(color);
      return rttNode;
    };
    const p = createPipeline({
      renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(),
      layers: [{ id: 'phu-bong', layer: { post: { display }, dispose() {} } }], weight: () => uniform(1),
    });
    const order = () => buildFinalPass(p.renderPipeline.outputNode).updateBefore
      .map((n) => (n === p.scenePass ? 'scenePass' : n === rttNode ? 'rtt' : n.constructor.name));
    expect(order()).toEqual(['scenePass', 'rtt']);
    p.views.setOverlays([{ id: 'kinh', fn: (final, view) => final.add(view('emissive')) }]);
    expect(order()).toEqual(['scenePass', 'rtt']);
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
    const second = p.views.require('normal'); // lần hai chờ cùng lần biên dịch, không xong trước nó
    done();
    await Promise.all([first, second]);
    expect([setMRT.mock.calls.length, p.scenePass.compileAsync.mock.calls.length, overlay.mock.calls.length]).toEqual([1, 1, 2]);
    p.dispose();
  });
});

describe('linearDepth (GĐ 8): độ sâu tuyến tính đúng cho loại camera của sân khấu', () => {
  const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
  const probe = (seen) => ({ id: 'x', layer: { post: { build({ color, channel }) { seen.depth = channel('depth'); return color; } }, dispose() {} } });
  const idsOf = (node) => new Set(nodesOf(node).map((n) => n.id));

  it('camera trực giao: channel("depth") và view Depth là CHÍNH texture độ sâu (đã tuyến tính, Phụ lục A.90), không qua công thức phối cảnh', () => {
    const seen = {};
    const camera = new OrthographicCamera();
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera, layers: [probe(seen)], weight: () => uniform(1) });
    const depthTexture = p.scenePass.getTextureNode('depth');
    expect(seen.depth).toBe(depthTexture);
    expect(linearDepth(p.scenePass, camera)).toBe(depthTexture);
    const ids = idsOf(p.views.node('depth'));
    expect(ids.has(depthTexture.id)).toBe(true);
    expect(ids.has(p.scenePass.getLinearDepthNode().id)).toBe(false);
  });

  it('camera phối cảnh: linearDepth và view Depth giữ nguyên node như ba bức trước (getLinearDepthNode; channel("depth") có test ở trên)', () => {
    const camera = new PerspectiveCamera();
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera, layers: [], weight: () => uniform(1) });
    expect(linearDepth(p.scenePass, camera)).toBe(p.scenePass.getLinearDepthNode());
    expect(idsOf(p.views.node('depth')).has(p.scenePass.getLinearDepthNode().id)).toBe(true);
  });
});

describe('lượt cuối có công cụ học (GĐ 8): view dùng chung texture của scene pass ở nhiều nhánh If của Kính mài và Lột lớp', () => {
  const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
  /** Đầu một nhánh của chuỗi If/ElseIf chọn view (pick.js): `if ( ( peel_view == 2.0 ) ) {`; WGSL có thêm `object.`. */
  const BRANCH = /if \( \( (?:object\.)?(?:peel_view|lens_mode) == \d+\.0 \) \) \{/g;
  const reads = (code) => new Set(code.match(/\bnodeVar\d+\b/g) ?? []);
  const assigned = (code) => new Set([...code.matchAll(/\b(nodeVar\d+) = /g)].map((m) => m[1]));
  /** Thân của nhánh mở ở `start` (đếm ngoặc): gồm khối lồng bên trong, không gồm nhánh else của nó. Trả [đầu, cuối] trong code. */
  const bodyAt = (code, start) => {
    let i = code.indexOf('{', start) + 1;
    const from = i;
    for (let depth = 1; depth > 0; i += 1) depth += code[i] === '{' ? 1 : code[i] === '}' ? -1 : 0;
    return [from, i - 1];
  };

  it.each(['webgpu', 'webgl2'])('%s: nhánh nào đọc biến cũng tự gán nó (hay biến gán ngoài mọi nhánh), không đọc biến chỉ gán ở nhánh khác (Phụ lục A.95)', (backend) => {
    // Hai tap cùng chứa màu của scene pass, như truoc-tone và truoc-bloom của Phủ bóng, hay truoc-net của Bản nét (Bức 4); display vẽ
    // chuỗi ra RTT như FXAA của Phủ bóng, nên luồng chính của lượt cuối không tự đọc màu ấy. Hai công cụ gắn theo thứ tự của hộp đồ nghề.
    // Lỗi cũ: nhánh sau dùng lại biến texture chỉ được gán ở nhánh trước, nên Lột lớp ra ảnh đen ở nấc đó.
    const build = ({ color, tap }) => { tap('a', color); tap('b', color.add(vec4(0.1))); return color; };
    const layer = { post: { build, display: ({ color }) => rtt(color) }, dispose() {} };
    const p = createPipeline({
      renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [{ id: 'x', layer }], weight: () => uniform(1),
    });
    const ids = p.views.list().slice(1).map((v) => v.id);
    const u = { mode: uniform(0).setName('lens_mode'), radius: uniform(0.2), pos: uniform(new Vector2()), split: uniform(0.5), shape: uniform(0) };
    p.views.setOverlays([
      { id: 'kinh-mai', fn: (final, view) => lensNode(final, view, { ids, u }) },
      { id: 'lot-lop', fn: (final, view) => peelNode(final, view, { ids, peel: uniform(0).setName('peel_view') }) },
    ]);
    const quad = new QuadMesh(new NodeMaterial());
    quad.material.fragmentNode = p.renderPipeline.outputNode;
    const { fragmentShader: code, problems } = compileMaterial(quad, { scene: new Scene(), camera: new PerspectiveCamera() }, backend, { pass: 'reflector' });
    expect(problems).toEqual([]);
    const spans = [...code.matchAll(BRANCH)].map((m) => bodyAt(code, m.index));
    expect(spans).toHaveLength(ids.length * 2);
    // Biến gán ngoài mọi nhánh chọn view (luồng chính, khối của Kính mài trước chuỗi If…): nhánh nào cũng đọc được.
    let outside = code.slice(code.lastIndexOf('main'));
    for (const [from, to] of spans) outside = outside.replace(code.slice(from, to), '');
    const shared = assigned(outside);
    spans.forEach(([from, to], k) => {
      const body = code.slice(from, to);
      const own = assigned(body);
      const stray = [...reads(body)].filter((v) => !own.has(v) && !shared.has(v));
      expect(stray, `nhánh ${k + 1} (${ids[k % ids.length]}) đọc biến chỉ gán ở nhánh khác`).toEqual([]);
    });
    p.dispose();
  });
});
