// tests/paintings/den-keo-quan/ngon-nen.test.js — Lớp 2 · Ngọn nến: ngọn lửa tự phát sáng, cỡ lửa là núm (cũng là cỡ nguồn sáng của gobo), nhấp nháy, sắc nến, ánh đêm.
import { describe, it, expect } from 'vitest';
import { AdditiveBlending } from 'three/webgpu';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { knobs } from '../../../src/paintings/den-keo-quan/layers/l2-ngon-nen.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'ngon-nen', ...options });
const flameOf = ({ layers }) => layers['ngon-nen'].objects.find((o) => o.name === 'ngon-lua');
const experiment = ({ layers }, id) => layers['ngon-nen'].experiments.find((e) => e.id === id);
const luminance = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
/** Sắc của một màu: chia cho độ sáng, để so hai màu khác độ sáng mà cùng sắc. */
const hue = (c) => [c.r, c.g, c.b].map((v) => v / luminance(c));

describe('l2-ngon-nen', () => {
  it('núm: intensity, cỡ lửa (uniform), nhấp nháy và sắc nến (js: đi qua đèn thật trên CPU)', () => {
    expect(knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['intensity', 'js'], ['flameSize', 'uniform'], ['flicker', 'js'], ['warmth', 'js'],
    ]);
  });

  it('ngọn lửa: vật ngon-lua cộng dồn, không ghi độ sâu, không sương, vẽ trước giấy', () => {
    const built = build();
    const flame = flameOf(built);
    expect(flame, 'thiếu vật ngon-lua').toBeDefined();
    expect(flame.material.blending).toBe(AdditiveBlending);
    expect(flame.material.transparent).toBe(true);
    expect(flame.material.depthWrite).toBe(false);
    expect(flame.material.fog).toBe(false);
    const paper = built.layers.cot.objects.find((o) => o.name === 'giay');
    expect(flame.renderOrder).toBeLessThan(paper.renderOrder);
  });

  it.each(['webgpu', 'webgl2'])('%s: ngọn lửa dịch được, không lỗi', (backend) => {
    const built = build();
    expect(compileMaterial(flameOf(built), built.ctx, backend).problems).toEqual([]);
  });

  it.each(['webgpu', 'webgl2'])('%s: cỡ lửa là uniform của núm flameSize, và shader của vách đọc nó (gobo dùng làm cỡ nguồn sáng); mặc định 4 mm', (backend) => {
    const built = buildPainting(painting, meta, { until: 'keo-quan' });
    const size = built.knobs['ngon-nen'].knob('flameSize');
    expect(built.shared.ngonNen.size).toBe(size);
    expect(size.value).toBeCloseTo(0.004, 6);
    // Gobo nằm trong thân một Fn, nên nodesOf không thấy uniform này: dịch vách ra shader rồi đọc uniform mà builder đã gom.
    const wall = built.layers.cot.objects.find((o) => o.name === 'vach');
    expect(compileMaterial(wall, built.ctx, backend, { shadows: true }).uniforms).toContain('ngon_nen_flameSize');
  });

  it('"Tắt nhấp nháy": flicker về 0; tắt thì về đúng giá trị của núm', async () => {
    const built = build();
    await built.knobs['ngon-nen'].set('flicker', 1.5);
    expect(built.shared.flame.flicker).toBe(1.5);
    experiment(built, 'steady').toggle(true);
    expect(built.shared.flame.flicker).toBe(0);
    await built.knobs['ngon-nen'].set('flicker', 0.5); // kéo núm khi đang tắt nhấp nháy: vẫn đứng yên
    expect(built.shared.flame.flicker).toBe(0);
    experiment(built, 'steady').toggle(false);
    expect(built.shared.flame.flicker).toBe(0.5);
  });

  it('sắc nến: warmth 0 là lửa cam, 1 là vàng lá sáng; đèn thật và uniform candleColor cùng một màu', async () => {
    const built = build();
    const { light, color } = built.shared.ngonNen;
    expect(color.name).toBe('candleColor');
    const near = (a, b) => a.toArray().forEach((v, i) => expect(v).toBeCloseTo(b.toArray()[i], 6));
    await built.knobs['ngon-nen'].set('warmth', 0);
    near(light.color, built.ctx.palette.color('lua'));
    await built.knobs['ngon-nen'].set('warmth', 1);
    near(light.color, built.ctx.palette.color('vangLaSang'));
    expect(color.value.equals(light.color)).toBe(true);
  });

  it('"Ánh sáng không suy giảm": số đo độ rọi ở vách sau thành 100% (vách xa sáng như cách đèn 1 m), tắt thì về 28%', () => {
    const built = build();
    const read = () => built.layers['ngon-nen'].readouts.find((r) => r.id === 'backWall').get();
    expect(read()).toBe(28);
    experiment(built, 'noDecay').toggle(true);
    expect(read()).toBe(100);
    experiment(built, 'noDecay').toggle(false);
    expect(read()).toBe(28);
  });

  it('Ngọn nến bằng 0: đèn tắt hẳn (cường độ và candlePower bằng 0)', () => {
    const built = build();
    built.ctx.weights.set('ngon-nen', 0);
    built.layers['ngon-nen'].update(0, 1);
    expect(built.shared.ngonNen.light.intensity).toBe(0);
    expect(built.shared.ngonNen.power.value).toBe(0);
  });

  it('đèn xưởng lui về ánh đêm: còn 7% cường độ (NIGHT), trên ngả chàm, dưới ngả cánh gián (một phần), độ sáng giữ nguyên (chỗ bóng không đen kịt)', () => {
    const built = build();
    const { hemi, hemiIntensity } = built.shared.cot;
    const studio = { sky: hemi.color.clone(), ground: hemi.groundColor.clone() };
    built.layers['ngon-nen'].update(0, 1); // trọng số mặc định 1
    expect(hemi.intensity).toBeCloseTo(hemiIntensity * 0.07, 6);
    const { color: paint } = built.ctx.palette;
    // Ngả về sắc của sơn (lam hơn đỏ ở trên, đỏ hơn lam ở dưới) nhưng không ngả hết: ngả hết thì bóng thành xanh tím.
    const blueOverRed = (c) => hue(c)[2] / hue(c)[0];
    expect(blueOverRed(hemi.color)).toBeGreaterThan(1.3);
    expect(blueOverRed(hemi.color)).toBeLessThan(blueOverRed(paint('cham')) * 0.5);
    expect(1 / blueOverRed(hemi.groundColor)).toBeGreaterThan(1.3);
    expect(1 / blueOverRed(hemi.groundColor)).toBeLessThan((1 / blueOverRed(paint('canhGian'))) * 0.5);
    expect(luminance(hemi.color)).toBeCloseTo(luminance(studio.sky), 6);
    expect(luminance(hemi.groundColor)).toBeCloseTo(luminance(studio.ground), 6);
    // Mài về 0 thì đèn xưởng về đúng màu trung tính (lerp từ màu gốc, không cộng dồn qua các khung).
    built.ctx.weights.set('ngon-nen', 0);
    built.layers['ngon-nen'].update(0, 2);
    expect(hemi.color.equals(studio.sky)).toBe(true);
    expect(hemi.groundColor.equals(studio.ground)).toBe(true);
    expect(hemi.intensity).toBeCloseTo(hemiIntensity, 6);
  });

  it('lửa uốn theo hướng thổi: uniform flameLean của ngọn lửa nhận độ lệch của shared.flame', () => {
    const built = build();
    const lean = nodesOf(flameOf(built).material.positionNode).find((n) => n.isUniformNode && n.name === 'flameLean');
    expect(lean, 'thiếu uniform flameLean trong positionNode').toBeDefined();
    built.shared.flame.blow(0, [1, 0]);
    built.layers['ngon-nen'].update(0, 0.08); // lửa đang ngả mạnh (ngả lên trong ~0,1 s rồi dao động)
    expect(lean.value.x).toBeGreaterThan(0.003);
    expect(Math.abs(lean.value.y)).toBeLessThan(0.002);
  });

  it('ngọn lửa đứng trên bấc: chân lửa ngay trên đỉnh nến, đèn thật nằm trong thân lửa', () => {
    const built = build();
    const flame = flameOf(built);
    flame.geometry.computeBoundingBox();
    const { min, max } = flame.geometry.boundingBox;
    const [base, tip] = [flame.position.y + min.y, flame.position.y + max.y];
    const top = built.shared.cot.lantern.candle.y1;
    expect(base - top, 'chân lửa cách đỉnh nến (m)').toBeGreaterThan(0);
    expect(base - top).toBeLessThan(0.006);
    const y = built.shared.cot.lantern.flame[1];
    expect(y).toBeGreaterThan(base + 0.3 * (tip - base));
    expect(y).toBeLessThan(base + 0.7 * (tip - base));
  });
});
