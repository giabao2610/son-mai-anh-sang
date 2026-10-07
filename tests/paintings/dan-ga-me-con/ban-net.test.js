// tests/paintings/dan-ga-me-con/ban-net.test.js — Lớp 3 · Bản nét: viền đọc thẳng texture độ sâu của camera trực giao (không qua công thức phối cảnh), lấy mẫu đúng tâm điểm ảnh; có tap truoc-net; chỉ chạy với camera trực giao; nét trong trên gà theo trọng số của Bản nét, mép mềm tối thiểu một điểm ảnh; lệch bản; hai thí nghiệm chỉ đổi uniform.
import { describe, it, expect } from 'vitest';
import { NodeMaterial, NoToneMapping, PerspectiveCamera, QuadMesh, SRGBColorSpace, Scene } from 'three/webgpu';
import { float, vec2, vec3 } from 'three/tsl';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { HEN_TOKENS } from '../../../src/paintings/dan-ga-me-con/parts/ban-mau-bang.js';
import { PART } from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';
import { createPipeline } from '../../../src/engine/gpu/pipeline.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf } from '../../helpers/nodes.js';

const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
const pipelineOf = ({ ctx, built }) => createPipeline({ renderer: fakeRenderer, scene: ctx.scene, camera: ctx.camera, layers: built, weight: ctx.weight });
/**
 * Dựng tới Bản nét (bỏ Phủ bóng): Phủ bóng bọc màu trong một Fn và FXAA vẽ chuỗi phía trước ra một RTT, nên cả nodesOf lẫn
 * buildFinalPass đều không thấy bên trong. Không có Phủ bóng thì ảnh cuối là renderOutput(màu của Bản nét).
 */
const upToInk = (options) => buildPainting(painting, meta, { until: 'ban-net', ...options });
/** Mesh của gà: ba mesh của gà mẹ (mình kèm con ong, hai cánh) và InstancedMesh của gà con. */
const birds = ({ shared }) => [shared.cot.hen.body, shared.cot.hen.wingL, shared.cot.hen.wingR, shared.cot.chicks.mesh];
/** Dịch lượt cuối (quad của RenderPipeline) như three dịch lúc vẽ khung đầu: bắt lỗi của đồ thị post (Phụ lục A.95). */
const compilePost = (built, backend) => {
  const p = pipelineOf(built);
  const quad = new QuadMesh(new NodeMaterial());
  quad.material.fragmentNode = p.renderPipeline.outputNode;
  const out = compileMaterial(quad, { scene: new Scene(), camera: new PerspectiveCamera() }, backend, { pass: 'reflector' });
  p.dispose();
  return out;
};
/** Một điểm tô giả của gà mẹ (Cốt dựng điểm thật trong colorNode): đủ để gọi các hàm của recipe và soi đồ thị chúng trả về. */
const henPoint = (part) => ({ kind: 'ga', part: float(part), n: vec3(0, 0, 1), uv: vec2(0.5), pos: vec3(0), pigment: float(-1) });
const uniformsOf = (node) => nodesOf(node).filter((n) => n.isUniformNode);

describe('l3-ban-net (Bức 4)', () => {
  it('post đọc texture độ sâu của scene pass (camera trực giao), không có node độ sâu kiểu phối cảnh; tap truoc-net là màu trước khi có nét', () => {
    const built = upToInk();
    const p = pipelineOf(built);
    const ids = new Set(nodesOf(p.views.node('final')).map((n) => n.id));
    expect(ids.has(p.scenePass.getTextureNode('depth').id)).toBe(true);
    expect(ids.has(p.scenePass.getLinearDepthNode().id)).toBe(false);
    expect(p.views.list().map((v) => v.id)).toContain('ban-net:truoc-net');
    p.dispose();
  });

  it('đọc texture độ sâu đúng chín lần mỗi điểm ảnh (lưới 3×3, ngân sách §20.8): điểm giữa đọc một lần, dùng chung cho bốn hướng', () => {
    const built = upToInk();
    const p = pipelineOf(built);
    const depth = p.scenePass.getTextureNode('depth');
    const samples = nodesOf(p.views.node('final')).filter((n) => n.isTextureNode && n.uvNode && n.getBase?.() === depth);
    expect(samples).toHaveLength(9);
    p.dispose();
  });

  it('núm lineWidth và misregister chỉ có số nguyên điểm ảnh (lineWidth 1–3, mặc định 2; misregister 0–6, mặc định 2): mẫu độ sâu cách nhau số nguyên điểm ảnh, nên mỗi nấc của thanh trượt là một ảnh khác', () => {
    const knobs = painting.layers.find((m) => m.id === 'ban-net').knobs;
    expect(knobs.find((k) => k.id === 'lineWidth')).toMatchObject({ min: 1, max: 3, step: 1, value: 2 });
    expect(knobs.find((k) => k.id === 'misregister')).toMatchObject({ min: 0, max: 6, step: 1, value: 2 });
    const built = upToInk();
    expect(built.knobs['ban-net'].get('lineWidth')).toBe(2);
    expect(built.knobs['ban-net'].get('misregister')).toBe(2);
  });

  it('camera phối cảnh: báo lỗi tiếng Việt lúc dựng, không vẽ nét sai', () => {
    expect(() => buildPainting(painting, meta, { camera: new PerspectiveCamera() })).toThrow(/camera trực giao/);
  });

  it.each(['webgpu', 'webgl2'])('%s: nét trong là việc của Bản nét: mọi mesh gà dịch được và đồ thị màu đọc w_ban_net (mài Bản nét thì nét trong tắt theo); tờ giấy không đọc', (backend) => {
    const built = upToInk();
    for (const mesh of birds(built)) {
      const { problems, uniforms } = compileMaterial(mesh, built.ctx, backend);
      expect(problems).toEqual([]);
      expect(uniforms).toEqual(expect.arrayContaining(['w_ban_net', 'banNetChiNet']));
    }
    expect(compileMaterial(built.shared.cot.paper, built.ctx, backend).uniforms).not.toContain('w_ban_net');
  });

  it.each(['webgpu', 'webgl2'])('%s: viền cánh gà mẹ chỗ áp sườn đo tới khối mình co lại theo số vòng (uniform henBodyRadius của Cốt, không phải hằng): đổi segments thì nét theo, không biên dịch lại', (backend) => {
    const built = upToInk();
    for (const mesh of birds(built)) expect(compileMaterial(mesh, built.ctx, backend).uniforms).toContain('henBodyRadius');
  });

  it.each(['webgpu', 'webgl2'])('%s: nét trong có mép mềm tối thiểu một điểm ảnh (fwidth của khoảng cách tới nét): nét mảnh hơn một điểm ảnh (DPR 1, điện thoại) mờ đi chứ không đứt thành vạch nhấp nháy khi gà chạy', (backend) => {
    // Tám nét dài (vảy lông; viền, chỗ lún vào sườn và ba nét lông của cánh; đuôi; vằn ong) mỗi nét một fwidth; Bản màu có một (mép nấc).
    const built = upToInk({ tier: backend });
    const { fragmentShader } = compileMaterial(built.shared.cot.chicks.mesh, built.ctx, backend);
    expect((fragmentShader.match(/fwidth\(/g) ?? []).length).toBeGreaterThanOrEqual(1 + 8);
  });

  it.each(['webgpu', 'webgl2'])('%s: núm ở hai đầu (lineWidth 1 và 3, threshold 0,05 và 2, crease 0 và 1, misregister 0 và 6): lượt cuối và mọi mesh gà dịch được, không lỗi', async (backend) => {
    for (const values of [{ lineWidth: 1, threshold: 0.05, crease: 0, misregister: 0 }, { lineWidth: 3, threshold: 2, crease: 1, misregister: 6 }]) {
      const built = upToInk();
      for (const [knob, v] of Object.entries(values)) {
        await built.knobs['ban-net'].set(knob, v);
        expect(built.knobs['ban-net'].get(knob)).toBe(v);
      }
      expect(compilePost(built, backend).problems, JSON.stringify(values)).toEqual([]);
      for (const mesh of birds(built)) expect(compileMaterial(mesh, built.ctx, backend).problems, JSON.stringify(values)).toEqual([]);
    }
  });

  it('mắt trắng điệp (Bản màu tô), vòng và con ngươi là nét trong; recipe.ink và recipe.fill của gà nhân trọng số của Bản nét: mọi trọng số 0 thì về đất sét', () => {
    expect(HEN_TOKENS.EYE).toBe('diep');
    const { shared } = upToInk();
    const names = (node) => uniformsOf(node).map((u) => u.name);
    expect(names(shared.cot.recipe.ink(henPoint(PART.EYE)))).toContain('w_ban_net');
    // "Chỉ bản nét" đổi màu in thành trắng giấy, cũng nhân w: Bản nét về 0 thì màu in trở lại dù thí nghiệm còn bật.
    expect(names(shared.cot.recipe.fill(henPoint(PART.BODY)))).toEqual(expect.arrayContaining(['banNetChiNet', 'w_ban_net']));
  });

  it('hai thí nghiệm chiNet (Chỉ bản nét) và netTheoMau (Dò cạnh theo màu): bật thì uniform của nó về 1, tắt về 0; không material nào biên dịch lại', async () => {
    const built = upToInk();
    const exps = built.layers['ban-net'].experiments;
    expect(exps.map((e) => e.id)).toEqual(['chiNet', 'netTheoMau']);
    const p = pipelineOf(built);
    const find = (nodes, name) => uniformsOf(nodes).find((u) => u.name === name);
    const chiNet = find(built.shared.cot.recipe.fill(henPoint(PART.BODY)), 'banNetChiNet');
    const byColor = find(p.views.node('final'), 'banNetTheoMau');
    const versions = birds(built).map((m) => m.material.version);
    for (const [exp, u] of [[exps[0], chiNet], [exps[1], byColor]]) {
      expect(u.value, `${exp.id} lúc dựng`).toBe(0);
      await exp.toggle(true);
      expect(u.value, `${exp.id} bật`).toBe(1);
      await exp.toggle(false);
      expect(u.value, `${exp.id} tắt`).toBe(0);
    }
    expect(birds(built).map((m) => m.material.version)).toEqual(versions);
    p.dispose();
  });

  it.each(['webgpu', 'webgl2'])('%s: Dò cạnh theo màu tắt thì không đọc thêm texture màu nào: tám mẫu Sobel nằm trong nhánh If của uniform banNetTheoMau, độ sáng mỗi mẫu kẹp ở 1', (backend) => {
    const { fragmentShader: code, problems } = compilePost(upToInk(), backend);
    expect(problems).toEqual([]);
    const start = code.search(/if \( \( (?:object\.)?banNetTheoMau > 0\.5 \) \) \{/);
    expect(start, 'có nhánh If theo banNetTheoMau').toBeGreaterThan(0);
    // Thân nhánh (đếm ngoặc). Texture màu đọc bằng textureSample (WGSL) hay texture() (GLSL); texture độ sâu bằng textureLoad (WGSL)
    // hay texture(…).x (GLSL): sampler nào được đọc kèm .x là texture độ sâu.
    let i = code.indexOf('{', start) + 1;
    const from = i;
    for (let depth = 1; depth > 0; i += 1) depth += code[i] === '{' ? 1 : code[i] === '}' ? -1 : 0;
    const depthSamplers = new Set([...code.matchAll(/texture\( (nodeUniform\d+), [^;]*\)\.x;/g)].map((m) => m[1]));
    const colorSamples = (text) => (backend === 'webgpu'
      ? (text.match(/textureSample\(/g) ?? []).length
      : [...text.matchAll(/texture\( (nodeUniform\d+), /g)].filter((m) => !depthSamplers.has(m[1])).length);
    const body = code.slice(from, i - 1);
    expect(colorSamples(body), 'tám mẫu Sobel trong nhánh').toBe(8);
    // Độ sáng của mỗi mẫu kẹp ở 1: ảnh của scene pass là HDR, hạt điệp lóe sáng chừng 15 lần giấy, không kẹp thì thành vòng mực.
    expect((body.match(/min\( dot\(/g) ?? []).length, 'tám độ sáng kẹp ở 1').toBe(8);
    // Ngoài nhánh chỉ còn một lần đọc màu: màu của chính điểm ảnh, như khi chưa có thí nghiệm.
    expect(colorSamples(code.slice(0, from) + code.slice(i)), 'ngoài nhánh').toBe(1);
  });
});
