// tests/paintings/den-keo-quan/keo-quan.test.js — Lớp 5 · Kéo quân: gobo là node bóng của đèn nến, dịch được ra WGSL và GLSL; quy ước góc giữa trống và gobo.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'keo-quan', ...options });
const wall = ({ layers }) => layers.cot.objects.find((o) => o.name === 'vach');

describe('l5-keo-quan', () => {
  it('node bóng của đèn chứa gobo: uniform drumAngle và texture mặt nạ nằm trong đồ thị', () => {
    const { shared } = build();
    const nodes = nodesOf(shared.ngonNen.light.shadow.shadowNode);
    expect(nodes.some((n) => n.isUniformNode && n.name === 'w_keo_quan'), 'trộn theo trọng số của lớp').toBe(true);
  });

  it.each(['webgpu', 'webgl2'])('%s: vách nhận bóng dịch được, có atan và tra texture, không lỗi', (backend) => {
    const built = build();
    const { fragmentShader, problems } = compileMaterial(wall(built), built.ctx, backend, { shadows: true });
    expect(problems).toEqual([]);
    expect(fragmentShader).toMatch(/atan/);
    expect(fragmentShader).toMatch(backend === 'webgpu' ? /textureSampleLevel/ : /textureLod/);
  });

  it('có đèn mà tắt shadowMap thì shader của vách không có gobo (khẳng định ngược: test trên không qua oan)', () => {
    const built = build();
    const { fragmentShader } = compileMaterial(wall(built), built.ctx, 'webgpu', { lights: true });
    // Dấu vết của đèn điểm: suy giảm theo khoảng cách, 1 / max(pow(length(L), decay), 0.01) (getDistanceAttenuation của three).
    expect(fragmentShader, 'phải có chiếu sáng của đèn điểm').toMatch(/pow\(\s*length\(/);
    expect(fragmentShader).not.toMatch(/textureSampleLevel/);
  });

  it('quy ước góc: điểm ở góc cục bộ φ của trống, sau khi trống quay θ, nằm ở góc thế giới φ − θ; gobo tra u = (φ_thế giới + θ) / 2π', () => {
    const theta = 0.7;
    for (const phiLocal of [0, 1, 2.5, -2]) {
      const [x, z] = [Math.cos(phiLocal), Math.sin(phiLocal)];
      // rotation.y = θ của three: x' = x cos θ + z sin θ, z' = −x sin θ + z cos θ
      const [xw, zw] = [x * Math.cos(theta) + z * Math.sin(theta), -x * Math.sin(theta) + z * Math.cos(theta)];
      const u = (((Math.atan2(zw, xw) + theta) / (2 * Math.PI)) % 1 + 1) % 1;
      expect(u).toBeCloseTo((((phiLocal / (2 * Math.PI)) % 1) + 1) % 1, 9);
    }
  });
});
