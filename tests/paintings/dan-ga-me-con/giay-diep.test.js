// tests/paintings/dan-ga-me-con/giay-diep.test.js — Lớp 4 · Giấy điệp của Bức 4: bọc recipe.paper và recipe.glint, trộn theo w_giay_diep (mọi trọng số 0 thì về đất sét); tờ giấy có hạt điệp (emissive) còn gà thì không; hạt với tới được góc nhìn của tranh trên cả sàn lẫn vách; núm ở hai đầu dịch được; nấc chi-tiet bớt một tầng noise của sợi dó; Giấy dó trơn chỉ đổi uniform.
import { describe, it, expect } from 'vitest';
import { float, vec2, vec3 } from 'three/tsl';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { TILT } from '../../../src/paintings/dan-ga-me-con/parts/giay-diep-mat.js';
import { CAMERA, PAPER, SUN } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { PAPER_LENGTH, profile } from '../../../src/paintings/dan-ga-me-con/parts/cot-giay.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'giay-diep', ...options });
/** Mesh của gà: ba mesh của gà mẹ và InstancedMesh của gà con (tờ giấy là việc của Giấy điệp). */
const birds = ({ shared }) => [shared.cot.hen.body, shared.cot.hen.wingL, shared.cot.hen.wingR, shared.cot.chicks.mesh];
/** Một điểm tô giả của tờ giấy (Cốt dựng điểm thật trong colorNode): đủ để gọi hàm của recipe và soi đồ thị chúng trả về. */
const paperPoint = () => ({ kind: 'giay', part: float(0), n: vec3(0, 1, 0), uv: vec2(3, 4), pos: vec3(0), pigment: float(-1) });
const uniformsOf = (node) => nodesOf(node).filter((n) => n.isUniformNode).map((n) => n.name);

describe('l4-giay-diep (Bức 4)', () => {
  it('nằm sau Bản nét, trước Phủ bóng; thang hạ nấc có chi-tiet của giấy ngay trước bloom', () => {
    expect(meta.layers.map((l) => l.id).slice(0, 4)).toEqual(['cot', 'ban-mau', 'ban-net', 'giay-diep']);
    expect(painting.layers.map((m) => m.id)).toEqual(meta.layers.map((l) => l.id));
    const { ladder } = painting.quality;
    expect(ladder.indexOf('giay-diep.chi-tiet'), ladder.join(', ')).toBe(ladder.indexOf('phu-bong.bloom') - 1);
    expect(ladder[0]).toBe('dpr');
  });

  it.each(['webgpu', 'webgl2'])('%s: tờ giấy dịch được; đồ thị màu đọc w_giay_diep, bốn núm, số tầng noise và Giấy dó trơn; cỡ chấm điệp theo đạo hàm màn hình (dFdx, dFdy)', (backend) => {
    const built = build();
    const { problems, uniforms, fragmentShader } = compileMaterial(built.shared.cot.paper, built.ctx, backend);
    expect(problems).toEqual([]);
    expect(uniforms).toEqual(expect.arrayContaining([
      'w_giay_diep', 'giay_diep_sparkle', 'giay_diep_density', 'giay_diep_fiber', 'giay_diep_brush', 'giayDiepOctaves', 'giayDiepTron',
    ]));
    // Chấm không nhỏ hơn một điểm ảnh trên màn hình, kể cả trên sàn bị co dọc: bề rộng điểm ảnh đo bằng đạo hàm của lưới ô, theo từng trục.
    expect(fragmentShader).toMatch(backend === 'webgpu' ? /dpdx\s*\(/ : /dFdx\s*\(/);
  });

  it.each(['webgpu', 'webgl2'])('%s: emissive của tờ giấy là hạt điệp (shader có reflect; chưa có Giấy điệp thì không), còn gà không đọc w_giay_diep và không phát sáng', (backend) => {
    const before = buildPainting(painting, meta, { until: 'ban-net' });
    expect(compileMaterial(before.shared.cot.paper, before.ctx, backend).fragmentShader).not.toMatch(/\breflect\s*\(/);
    const built = build();
    expect(compileMaterial(built.shared.cot.paper, built.ctx, backend).fragmentShader).toMatch(/\breflect\s*\(/);
    for (const mesh of birds(built)) {
      const { fragmentShader, uniforms, problems } = compileMaterial(mesh, built.ctx, backend);
      expect(problems).toEqual([]);
      expect(uniforms).not.toContain('w_giay_diep');
      expect(fragmentShader).not.toMatch(/\breflect\s*\(/);
    }
  });

  it('mọi trọng số 0 thì về đất sét: recipe.paper và recipe.glint trộn theo w_giay_diep; Giấy dó trơn tắt cả lớp điệp lẫn hạt', () => {
    const { shared } = build();
    expect(uniformsOf(shared.cot.recipe.paper(paperPoint()))).toEqual(expect.arrayContaining(['w_giay_diep', 'giay_diep_fiber', 'giay_diep_brush', 'giayDiepTron']));
    expect(uniformsOf(shared.cot.recipe.glint(paperPoint()))).toEqual(expect.arrayContaining(['w_giay_diep', 'giay_diep_sparkle', 'giay_diep_density', 'giayDiepTron']));
  });

  it('núm: sparkle 0–4, density 4–40 (ô mỗi đơn vị; min > 0 để chia cho density luôn xác định), fiber và brush 0–1; đều là uniform', () => {
    const knobs = painting.layers.find((m) => m.id === 'giay-diep').knobs;
    expect(knobs.map((k) => [k.id, k.min, k.max, k.via ?? 'uniform'])).toEqual([
      ['sparkle', 0, 4, 'uniform'], ['density', 4, 40, 'uniform'], ['fiber', 0, 1, 'uniform'], ['brush', 0, 1, 'uniform'],
    ]);
  });

  it.each(['webgpu', 'webgl2'])('%s: núm ở hai đầu (density 4 và 40, sparkle 0 và 4, fiber 0 và 1, brush 0 và 1): tờ giấy dịch được, không lỗi', async (backend) => {
    for (const values of [{ density: 4, sparkle: 0, fiber: 0, brush: 0 }, { density: 40, sparkle: 4, fiber: 1, brush: 1 }]) {
      const built = build();
      for (const [knob, v] of Object.entries(values)) {
        await built.knobs['giay-diep'].set(knob, v);
        expect(built.knobs['giay-diep'].get(knob)).toBe(v);
      }
      expect(compileMaterial(built.shared.cot.paper, built.ctx, backend).problems, JSON.stringify(values)).toEqual([]);
    }
  });

  it.each(['cao', 'vua', 'thap'])('mức %s: nấc chi-tiet bớt một tầng noise của sợi dó (uniform, shader đọc nó); gỡ ra thì về như cũ', (level) => {
    const built = build({ level });
    const layer = built.layers['giay-diep'];
    expect(layer.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    const octaves = compileMaterial(built.shared.cot.paper, built.ctx, 'webgpu').uniformNodes.giayDiepOctaves;
    const full = built.ctx.budget.paper;
    expect(octaves.value, 'số tầng lúc dựng theo budget.paper').toBe(full);
    layer.degrade[0].apply();
    expect(octaves.value).toBe(full - 1);
    layer.degrade[0].revert();
    expect(octaves.value).toBe(full);
  });

  it('nấc chi-tiet chỉ có khi budget.paper > 1: một tầng thì không còn gì để bớt; vẫn dịch được ở hai backend', () => {
    expect(build({ budget: { paper: 1 } }).layers['giay-diep'].degrade ?? []).toEqual([]);
    expect(build({ budget: { paper: 2 } }).layers['giay-diep'].degrade.map((d) => d.id)).toEqual(['chi-tiet']);
    for (const backend of ['webgpu', 'webgl2']) {
      const built = build({ budget: { paper: 1 } });
      expect(compileMaterial(built.shared.cot.paper, built.ctx, backend).problems).toEqual([]);
    }
  });

  it('thí nghiệm giayTron (Giấy dó trơn) chỉ đổi một uniform: bật thì về 1, tắt về 0; không material nào biên dịch lại', async () => {
    const built = build();
    const experiments = built.layers['giay-diep'].experiments;
    expect(experiments.map((e) => e.id)).toEqual(['giayTron']);
    const plain = compileMaterial(built.shared.cot.paper, built.ctx, 'webgpu').uniformNodes.giayDiepTron;
    const materials = [built.shared.cot.paper, ...birds(built)].map((m) => m.material);
    const versions = materials.map((m) => m.version);
    expect(plain.value, 'lúc dựng').toBe(0);
    await experiments[0].toggle(true);
    expect(plain.value, 'bật').toBe(1);
    await experiments[0].toggle(false);
    expect(plain.value, 'tắt').toBe(0);
    expect(materials.map((m) => m.version)).toEqual(versions);
  });

  it('không có vật riêng; cảnh vẫn không có đèn nào của three', () => {
    const { layers, ctx } = build();
    expect(layers['giay-diep'].objects).toEqual([]);
    const lights = [];
    ctx.scene.traverse((o) => { if (o.isLight) lights.push(o.type); });
    expect(lights).toEqual([]);
  });
});

describe('hạt điệp: tầm nghiêng của hạt với tới góc nhìn của tranh', () => {
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const unit = (v) => v.map((c) => c / Math.hypot(...v));
  /** Camera của tranh xoay `deg` độ quanh trục đứng qua điểm nhìn: như kéo chuột ngang. */
  const orbit = (deg) => {
    const a = (deg * Math.PI) / 180;
    const [x, y, z] = CAMERA.position.map((c, i) => c - CAMERA.target[i]);
    return [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
  };
  /**
   * Hạt sáng khi pháp tuyến của nó trùng nửa vector H của hướng nắng và hướng nhìn. Pháp tuyến hạt = pháp tuyến tờ giấy + dx·T + dy·B
   * (T, B là hai tiếp tuyến của tờ giấy tại chiều dài cung s), nên cần dx = H·T / H·n, dy = H·B / H·n. Trả max(|dx|, |dy|).
   */
  const needed = (s, fromTarget) => {
    const { ny, nz } = profile(s);
    const n = [0, ny, nz];
    const h = unit(SUN.map((c, i) => c + unit(fromTarget)[i]));
    return Math.max(Math.abs(dot(h, [1, 0, 0])), Math.abs(dot(h, [0, nz, -ny]))) / dot(h, n);
  };
  const flat = PAPER.front - PAPER.back;
  const arc = (Math.PI / 2) * PAPER.bend;
  const samples = { 'sàn': flat / 2, 'chỗ uốn (giữa cung)': flat + arc / 2, 'vách': (flat + arc + PAPER_LENGTH) / 2 };

  it.each(Object.entries(samples))('%s: ở góc của tranh và khi xoay ±30°, nửa vector nằm trong tầm nghiêng của hạt (TILT)', (name, s) => {
    for (const deg of [0, 30, -30]) {
      expect(needed(s, orbit(deg)), `${name}, xoay ${deg}°`).toBeLessThanOrEqual(TILT);
    }
  });
});
