// tests/paintings/den-keo-quan/giay.test.js — Lớp 4 · Giấy: ánh sáng xuyên mặt mỏng theo ánh nến, lọc màu ánh sáng ra phòng, màu từng tấm theo số cạnh, giấy trong suốt chỉ đổi uniform, nấc soi.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { PANEL_ORDER, panelTints } from '../../../src/paintings/den-keo-quan/layers/l4-giay.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, uniformNames } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'giay', ...options });
const named = ({ layers }, name) => layers.cot.objects.find((o) => o.name === name);
const readouts = (layer) => layer.readouts.map((r) => r.get());

describe('l4-giay', () => {
  it('lớp nằm giữa Gian nhà và Kéo quân', () => {
    expect(meta.layers.map((l) => l.id)).toEqual(['cot', 'ngon-nen', 'gian-nha', 'giay', 'keo-quan', 'phu-bong']);
  });

  it.each(['webgpu', 'webgl2'])('%s: giấy sáng theo ánh nến (candlePower, sắc nến) và theo trọng số; dịch được, không lỗi', (backend) => {
    const built = build();
    const { problems, uniforms } = compileMaterial(named(built, 'giay'), built.ctx, backend, { shadows: true });
    expect(problems).toEqual([]);
    // Ngọn nến = 0 thì candlePower = 0: giấy không sáng, kể cả khi "Giấy trong suốt" (Review Focus 2).
    expect(uniforms).toEqual(expect.arrayContaining(['candlePower', 'candleColor', 'w_giay', 'paperOpacity']));
  });

  it('ánh sáng ra phòng mang màu giấy: node bóng của đèn trộn theo w_giay; vách dịch được trên hai backend', () => {
    const built = buildPainting(painting, meta, { until: 'keo-quan' });
    expect(uniformNames(built.shared.ngonNen.light.shadow.shadowNode)).toContain('w_giay');
    const id = built.shared.giay.tints.id;
    const gpu = compileMaterial(named(built, 'vach'), built.ctx, 'webgpu', { shadows: true });
    expect(gpu.problems).toEqual([]);
    expect(gpu.uniforms).toContain('paperTints');
    // GLSL đặt mảng màu vào một khối buffer mang id của node (và đổi tên node), nên tìm theo id.
    const gl = compileMaterial(named(built, 'vach'), built.ctx, 'webgl2', { shadows: true });
    expect(gl.problems).toEqual([]);
    expect(gl.fragmentShader).toContain(`NodeBuffer_${id}`);
  });

  it('màu từng tấm: sáu màu của spec theo thứ tự quanh đèn; 4, 6 hay 8 cạnh đều đủ 8 ô và tấm phía vách sau luôn là vàng lá', () => {
    expect(PANEL_ORDER).toEqual(['vangLa', 'xanhLuc', 'doSon', 'vangLa', 'cham', 'doSon']);
    expect(panelTints(6).slice(0, 6)).toEqual(PANEL_ORDER);
    for (const sides of [4, 6, 8]) {
      const tints = panelTints(sides);
      expect(tints, `${sides} cạnh`).toHaveLength(8); // shader tra tấm k < sides ≤ 8: không bao giờ quá mảng (Review Focus 4)
      expect(tints.every((t) => PANEL_ORDER.includes(t))).toBe(true);
      expect(tints[sides / 2], `${sides} cạnh: tấm k = sides/2 nhìn ra vách sau`).toBe('vangLa');
    }
  });

  it('đổi số cạnh thì màu các tấm đổi theo (ghi lại mảng màu, không biên dịch lại)', async () => {
    const built = build();
    const versions = Object.values(built.shared.cot.materials).map((m) => m.version);
    await built.knobs.cot.set('sides', 4);
    built.layers.giay.update(0, 0);
    const color = (token) => built.ctx.palette.color(token);
    expect(built.shared.giay.tints.array[2].equals(color('vangLa'))).toBe(true);
    expect(built.shared.giay.tints.array[3].equals(color('cham'))).toBe(true);
    await built.knobs.cot.set('sides', 6);
    built.layers.giay.update(0, 0);
    expect(built.shared.giay.tints.array[2].equals(color('doSon'))).toBe(true);
    expect(Object.values(built.shared.cot.materials).map((m) => m.version)).toEqual(versions);
  });

  it('giấy dựng transparent ngay từ đầu; "Giấy trong suốt" và "Tắt sợi giấy" chỉ đổi uniform', () => {
    const built = build();
    const paper = named(built, 'giay');
    expect(paper.material.transparent).toBe(true);
    const version = paper.material.version;
    for (const exp of built.layers.giay.experiments) {
      exp.toggle(true);
      exp.toggle(false);
    }
    expect(paper.material.version).toBe(version);
    expect(built.layers.giay.experiments.map((e) => e.id)).toEqual(['clear', 'noFiber']);
  });

  it("nấc 'soi' có ở mức cao và mức thấp; gỡ ra thì số đo như cũ; số đo transmit theo độ dày", async () => {
    for (const level of ['cao', 'thap']) {
      const built = build({ level });
      const layer = built.layers.giay;
      expect(layer.degrade.map((d) => d.id), level).toEqual(['soi']);
      const before = readouts(layer);
      layer.degrade[0].apply();
      layer.degrade[0].revert();
      expect(readouts(layer)).toEqual(before);
    }
    const built = build();
    const transmit = () => built.layers.giay.readouts.find((r) => r.id === 'transmit').get();
    const thick = transmit();
    built.knobs.giay.set('thickness', 0);
    expect(transmit()).toBe(100);
    expect(thick).toBeLessThan(100);
  });
});
