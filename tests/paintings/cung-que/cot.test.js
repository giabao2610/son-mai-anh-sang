// tests/paintings/cung-que/cot.test.js — Lớp 1 · Cốt: khối bao là NodeMaterial gốc dò tia; dịch ra WGSL và GLSL có đúng một vòng dò chính; cảnh không có đèn của three.
import { describe, it, expect } from 'vitest';
import { NodeMaterial, MeshBasicNodeMaterial, BackSide } from 'three/webgpu';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, compileRenderer } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'cot', ...options });
const volume = ({ layers }) => layers.cot.objects.find((o) => o.name === 'khoi-bao');
/**
 * Số lần khai báo biến của vòng dò chính: WGSL `var<private> sdfT : f32;`, GLSL `float sdfT;`. three đổi tên bản sao thành sdfT_1…,
 * nên vòng dò sinh hai lần thì đếm ra 2.
 */
const marchDecls = (code) => (code.match(/\b(?:var(?:<\w+>)?|float)\s+sdfT\w*/g) ?? []).length;

describe('l1-cot (Bức 3)', () => {
  it('khối bao: NodeMaterial gốc (không phải MeshBasic), có colorNode, normalNode, depthNode, emissiveNode; vẽ mặt trong', () => {
    const m = volume(build()).material;
    expect(m).toBeInstanceOf(NodeMaterial);
    expect(m).not.toBeInstanceOf(MeshBasicNodeMaterial);
    for (const k of ['colorNode', 'normalNode', 'depthNode', 'emissiveNode']) expect(m[k], k).toBeTruthy();
    expect(m.side).toBe(BackSide);
  });

  it('cảnh không có đèn nào của three, shadowMap không bật', () => {
    const { ctx } = build();
    const lights = [];
    ctx.scene.traverse((o) => { if (o.isLight) lights.push(o.type); });
    expect(lights).toEqual([]);
    expect(ctx.renderer.shadowMap?.enabled ?? false).toBe(false);
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch được, không lỗi, ĐÚNG MỘT vòng dò chính dù màu, pháp tuyến, độ sâu cùng dùng nó', (backend) => {
    const built = build();
    const { fragmentShader, problems } = compileMaterial(volume(built), built.ctx, backend);
    expect(problems).toEqual([]);
    expect(marchDecls(fragmentShader), 'số vòng dò chính').toBe(1);
    expect(fragmentShader).toMatch(backend === 'webgpu' ? /frag_depth/ : /gl_FragDepth/);
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch lại trên CÙNG renderer (như xưởng biên dịch lại khi đổi MRT) vẫn đăng ký đủ uniform (Phụ lục A.87)', (backend) => {
    // three giữ mã hàm có layout theo backend: uniform đọc thẳng trong thân hàm chỉ được đăng ký ở lần dịch đầu. Lần sau thiếu thì
    // WGSL báo "struct member … not found" và cảnh về tĩnh (lỗi đã gặp trên GPU thật, Task 1).
    const built = build();
    const renderer = compileRenderer(backend);
    const first = compileMaterial(volume(built), built.ctx, backend, { renderer });
    const second = compileMaterial(volume(built), built.ctx, backend, { renderer });
    expect(new Set(second.uniforms)).toEqual(new Set(first.uniforms));
    expect(second.uniforms).toEqual(expect.arrayContaining(['treeLift', 'cot_smooth']));
  });

  it.each([16, 128])('núm steps mặc định = %s (theo budget): dịch được ở cả hai backend', (steps) => {
    const built = build({ budget: { steps } });
    expect(built.ctx.knobValue?.('steps') ?? steps).toBe(steps);
    for (const backend of ['webgpu', 'webgl2']) {
      expect(compileMaterial(volume(built), built.ctx, backend).problems, backend).toEqual([]);
    }
  });
});
