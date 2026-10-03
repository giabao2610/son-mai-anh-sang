// tests/unit/views.test.js — danh sách view (thứ tự, sẵn sàng), node ở không gian hiển thị, ghép overlay của công cụ.
import { describe, it, expect, vi } from 'vitest';
import { NoToneMapping, PerspectiveCamera, Scene, Vector4 } from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import { BUILTIN_VIEWS, createViews } from '../../src/engine/gpu/views.js';
import { makeMRT } from '../../src/engine/gpu/pipeline.js';
import { buildFinalPass } from '../helpers/final-pass.js';

const marker = () => uniform(new Vector4());
const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);
/** Ảnh cuối đã ghép là một Fn: thân của nó (dựng như three dựng lượt cuối) mở đầu bằng scenePass.toVar(), trả vec4(rgb, 1). */
const composed = (outputNode) => {
  const { stack } = buildFinalPass(outputNode);
  return { first: stack.nodes[0], join: unwrap(stack.outputNode) };
};

function setup({ taps = [] } = {}) {
  const scenePass = pass(new Scene(), new PerspectiveCamera());
  scenePass.setMRT(makeMRT());
  const renderPipeline = { outputNode: null, needsUpdate: false };
  const final = marker();
  const compile = vi.fn(async () => {});
  const views = createViews({ scenePass, renderPipeline, mrtFor: makeMRT, final, taps, compile });
  return { scenePass, renderPipeline, final, compile, views };
}

describe('createViews', () => {
  it('thứ tự như Lột lớp: ảnh cuối, tap theo thứ tự NGƯỢC pipeline, emissive, normal (chưa sẵn sàng), depth', () => {
    expect(BUILTIN_VIEWS).toEqual(['final', 'emissive', 'normal', 'depth']);
    const taps = [
      { layerId: 'phu-bong', tapId: 'truoc-bloom', node: marker(), linear: true },
      { layerId: 'phu-bong', tapId: 'truoc-tone', node: marker(), linear: true },
    ];
    const { views } = setup({ taps });
    expect(views.list()).toEqual([
      { id: 'final', ready: true },
      { id: 'phu-bong:truoc-tone', ready: true, layerId: 'phu-bong', tapId: 'truoc-tone' },
      { id: 'phu-bong:truoc-bloom', ready: true, layerId: 'phu-bong', tapId: 'truoc-bloom' },
      { id: 'emissive', ready: true },
      { id: 'normal', ready: false },
      { id: 'depth', ready: true },
    ]);
  });

  it('node(): mọi view ở không gian hiển thị (tap tuyến tính và emissive qua renderOutput); id lạ thì ném lỗi', () => {
    const lin = marker();
    const shown = marker();
    const { views, final, scenePass } = setup({
      taps: [{ layerId: 'a', tapId: 'x', node: lin, linear: true }, { layerId: 'a', tapId: 'y', node: shown, linear: false }],
    });
    expect(views.node('final')).toBe(final);
    const x = views.node('a:x');
    expect([x.isRenderOutputNode, x.colorNode, x.getToneMapping()]).toEqual([true, lin, NoToneMapping]);
    expect(views.node('a:y')).toBe(shown);
    const e = views.node('emissive');
    expect([e.isRenderOutputNode, e.colorNode]).toEqual([true, scenePass.getTextureNode('emissive')]);
    expect(views.node('depth').isNode).toBe(true);
    expect(views.node('normal').isNode).toBe(true); // giữ chỗ: chưa đụng tới texture 'normal'
    expect(scenePass.renderTarget.textures.map((t) => t.name)).not.toContain('normal');
    expect(() => views.node('khong-co')).toThrow('Không có view "khong-co"');
  });

  it('require("normal") còn đang biên dịch: Normal chưa báo sẵn sàng, lần gọi thứ hai chờ cùng lần biên dịch đó (không đổi view sớm)', async () => {
    const { views, compile, scenePass } = setup();
    let done;
    compile.mockImplementationOnce(() => new Promise((resolve) => { done = resolve; }));
    const setMRT = vi.spyOn(scenePass, 'setMRT');
    const ready = () => views.list().find((v) => v.id === 'normal').ready;
    let settled = 0;
    const calls = [views.require('normal'), views.require('normal')].map((p) => p.then(() => { settled += 1; }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect([ready(), settled]).toEqual([false, 0]);
    done();
    await Promise.all(calls);
    expect([ready(), settled, setMRT.mock.calls.length, compile.mock.calls.length]).toEqual([true, 2, 1, 1]);
  });

  it('biên dịch Normal hỏng: require ném lỗi và Normal vẫn chưa sẵn sàng; gọi lại thì biên dịch lại, MRT không đổi lần nữa', async () => {
    const { views, compile, scenePass } = setup();
    compile.mockRejectedValueOnce(new Error('pipeline hỏng'));
    const setMRT = vi.spyOn(scenePass, 'setMRT');
    const ready = () => views.list().find((v) => v.id === 'normal').ready;
    await expect(views.require('normal')).rejects.toThrow('pipeline hỏng');
    expect(ready()).toBe(false);
    await views.require('normal');
    expect([ready(), setMRT.mock.calls.length, compile.mock.calls.length]).toEqual([true, 1, 2]);
  });

  it('setOverlays: ảnh cuối → overlay theo thứ tự → vec4(rgb, 1), scene pass đứng đầu; pipeline dựng lại đồ thị', () => {
    const { views, final, renderPipeline, scenePass } = setup();
    const a = marker();
    const b = marker();
    const order = [];
    views.setOverlays([
      { id: 'mot', fn: (c, view) => { order.push(['mot', c, view('depth').isNode]); return a; } },
      { id: 'hai', fn: (c) => { order.push(['hai', c]); return b; } },
    ]);
    expect(order).toEqual([['mot', final, true], ['hai', a]]);
    const { first, join } = composed(renderPipeline.outputNode);
    expect(first.isVarNode).toBe(true);
    expect(first.node).toBe(scenePass); // scene pass dựng trước mọi thứ của lượt cuối (Phụ lục A.53)
    expect(join.nodes[0].node).toBe(b);
    expect(join.nodes[1].value).toBe(1);
    expect(renderPipeline.needsUpdate).toBe(true);
  });

  it('một overlay ném lỗi: cảnh báo và bỏ đúng công cụ đó, công cụ còn lại vẫn ghép', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { views, renderPipeline } = setup();
    const ok = marker();
    const broken = views.setOverlays([
      { id: 'hong', fn: () => { throw new Error('node sai'); } },
      { id: 'tot', fn: () => ok },
    ]);
    expect(broken).toEqual(['hong']);
    expect(composed(renderPipeline.outputNode).join.nodes[0].node).toBe(ok);
    expect(warn.mock.calls[0][0]).toBe('Công cụ "hong" ghép overlay không được, bỏ công cụ này:');
    warn.mockRestore();
  });
});
