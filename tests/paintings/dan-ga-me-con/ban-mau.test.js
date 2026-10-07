// tests/paintings/dan-ga-me-con/ban-mau.test.js — Lớp 2 · Bản màu của Bức 4: bọc recipe.fill (màu in theo phần và chỉ số màu, ánh sáng chia nấc), trộn theo trọng số w_ban_mau; núm ở hai đầu dịch được ở hai backend; thí nghiệm Tô mịn là kiểu so; không đèn của three.
import { describe, it, expect } from 'vitest';
import { StaticDrawUsage } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { CHICK_TOKENS, HEN_TOKENS, PLUMAGE } from '../../../src/paintings/dan-ga-me-con/parts/ban-mau-bang.js';
import { PART } from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';
import { HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'ban-mau', ...options });
/** Mesh của gà: ba mesh của gà mẹ và InstancedMesh của gà con (giấy không đi qua recipe.fill). */
const birds = ({ shared }) => [shared.cot.hen.body, shared.cot.hen.wingL, shared.cot.hen.wingR, shared.cot.chicks.mesh];

describe('l2-ban-mau (Bức 4)', () => {
  it('nằm giữa Cốt và Bản nét (thứ tự in của làng: màu trước, nét đen sau cùng)', () => {
    expect(meta.layers.map((l) => l.id).slice(0, 3)).toEqual(['cot', 'ban-mau', 'ban-net']);
    expect(painting.layers.map((m) => m.id).slice(0, 3)).toEqual(['cot', 'ban-mau', 'ban-net']);
  });

  it('bảng màu: mọi phần có token trong bảng của bức; mỗi con một chỉ số màu có thật; phần lông là mình, đuôi, cánh, đầu', () => {
    const tokens = Object.keys(meta.palette);
    expect(Object.keys(HEN_TOKENS).sort()).toEqual(Object.keys(PART).sort());
    for (const token of [...Object.values(HEN_TOKENS), ...CHICK_TOKENS]) expect(tokens, token).toContain(token);
    for (const home of HOMES) expect(CHICK_TOKENS[home.pigment], `pigment ${home.pigment}`).toBeTruthy();
    expect(new Set(HOMES.map((h) => CHICK_TOKENS[h.pigment])), 'đủ năm màu, có cả con "trắng" (màu giấy)').toEqual(new Set(CHICK_TOKENS));
    expect([...PLUMAGE].sort()).toEqual(['BODY', 'HEAD', 'TAIL', 'WING']);
    // Gà mẹ (spec §20.3): mào, cánh và mảng cổ (Task 11, Bao chọn ở điểm duyệt ảnh) đỏ son.
    expect([HEN_TOKENS.COMB, HEN_TOKENS.WING, HEN_TOKENS.NECK]).toEqual(['sonSoi', 'sonSoi', 'sonSoi']);
  });

  it.each(['webgpu', 'webgl2'])('%s: đồ thị màu của mọi mesh gà đọc w_ban_mau và ba núm (recipe.fill được bọc trước lần biên dịch đầu)', (backend) => {
    const built = build();
    for (const mesh of birds(built)) {
      const { problems, uniforms } = compileMaterial(mesh, built.ctx, backend);
      expect(problems).toEqual([]);
      expect(uniforms).toEqual(expect.arrayContaining(['w_ban_mau', 'ban_mau_bands', 'ban_mau_edge', 'ban_mau_shade', 'banMauToMin']));
    }
    // Tờ giấy là việc của Giấy điệp: không đọc bảng màu.
    expect(compileMaterial(built.shared.cot.paper, built.ctx, backend).uniforms).not.toContain('w_ban_mau');
  });

  it.each(['webgpu', 'webgl2'])('%s: núm ở hai đầu (bands 1 và 4, edge 0, shade 0 và 0,5) dịch được, không lỗi', async (backend) => {
    for (const values of [{ bands: 1, edge: 0, shade: 0 }, { bands: 4, edge: 0, shade: 0.5 }]) {
      const built = build();
      for (const [knob, v] of Object.entries(values)) {
        await built.knobs['ban-mau'].set(knob, v);
        expect(built.knobs['ban-mau'].get(knob)).toBe(v);
      }
      for (const mesh of birds(built)) expect(compileMaterial(mesh, built.ctx, backend).problems, JSON.stringify(values)).toEqual([]);
    }
  });

  it('màu của gà con theo thuộc tính instance pigment: ghi một lần lúc dựng (Static, không tải lại mỗi khung), giá trị từ HOMES', () => {
    const built = build();
    const { chicks } = built.shared.cot;
    const attrs = compileMaterial(chicks.mesh, built.ctx, 'webgpu').bufferAttributes
      .filter((a) => a.isInstancedBufferAttribute && a !== chicks.mesh.instanceMatrix && a !== chicks.pose && a !== chicks.head);
    expect(attrs).toHaveLength(1);
    expect(attrs[0].usage).toBe(StaticDrawUsage);
    expect([...attrs[0].array]).toEqual(HOMES.map((h) => h.pigment));
  });

  it('thí nghiệm toMin (Tô mịn) là kiểu so (compare); bật rồi tắt chỉ đổi uniform, không biên dịch lại', async () => {
    const built = build();
    const exp = built.layers['ban-mau'].experiments.find((e) => e.id === 'toMin');
    expect(exp.kind).toBe('compare');
    const versions = birds(built).map((m) => m.material.version);
    await exp.toggle(true);
    await exp.toggle(false);
    expect(birds(built).map((m) => m.material.version)).toEqual(versions);
  });

  it('không có vật riêng; cảnh vẫn không có đèn nào của three', () => {
    const { layers, ctx } = build();
    expect(layers['ban-mau'].objects).toEqual([]);
    const lights = [];
    ctx.scene.traverse((o) => { if (o.isLight) lights.push(o.type); });
    expect(lights).toEqual([]);
  });
});
