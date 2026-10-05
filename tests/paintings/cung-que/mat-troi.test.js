// tests/paintings/cung-que/mat-troi.test.js — pha trăng của Bức 3: ngày âm lịch → hướng nắng; phần sáng khớp moonPhase; mặc định kẹp trong [1; 30]; nhãn và ghi chú của Dial; lớp Mặt trời dịch được.
import { describe, it, expect } from 'vitest';
import { SYNODIC_MONTH } from '../../../src/lib/astro/lunar.js';
import { moonPhase } from '../../../src/lib/astro/moon.js';
import { mulberry32 } from '../../../src/lib/random.js';
import {
  defaultDay, earthLit, formatDay, litFraction, phaseNote, phaseOfDay, sunDirection,
} from '../../../src/paintings/cung-que/parts/mat-troi-pha.js';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import content from '../../../src/paintings/cung-que/content.vi.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial } from '../../helpers/nodes.js';

const close = (a, b) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
const marchDecls = (code) => (code.match(/\b(?:var(?:<\w+>)?|float)\s+sdfT\w*/g) ?? []).length;

describe('mat-troi-pha', () => {
  it('ngày 1: nắng từ dưới (trăng mới); giữa tháng: từ trên (rằm); một phần tư tháng: từ bên phải (thượng huyền)', () => {
    close(sunDirection(phaseOfDay(1)), [0, -1, 0]);
    close(sunDirection(phaseOfDay(1 + SYNODIC_MONTH / 2)), [0, 1, 0]);
    close(sunDirection(phaseOfDay(1 + SYNODIC_MONTH / 4)), [1, 0, 0]);
  });

  it('phần sáng nhìn từ Trái Đất = illumination của moonPhase ở ngày mặc định; Trái Đất sáng phần bù', () => {
    const date = new Date('2026-10-21T14:00:00Z');
    const phi = phaseOfDay(defaultDay(date));
    expect(litFraction(phi)).toBeCloseTo(moonPhase(date).illumination, 6);
    expect(litFraction(phi) + earthLit(phi)).toBeCloseTo(1, 9);
  });

  it('mặc định luôn trong [1; 30], kể cả cuối tháng âm dài (Review Focus 3)', () => {
    const rand = mulberry32(3);
    for (let i = 0; i < 400; i += 1) {
      const d = defaultDay(new Date(Date.UTC(2026, 0, 1) + rand() * 3 * 365 * 864e5));
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(30);
    }
  });

  it('Dial: nhãn là số ngày; ghi chú ở bốn pha chính, null ở giữa; S hữu hạn ở hai đầu', () => {
    expect(formatDay(15.2)).toBe('15');
    expect(phaseNote(1)).toBe('trangMoi');
    expect(phaseNote(30)).toBe('trangMoi');
    expect(phaseNote(8.4)).toBe('thuongHuyen');
    expect(phaseNote(15)).toBe('ram');
    expect(phaseNote(23)).toBe('haHuyen');
    expect(phaseNote(12)).toBeNull();
    for (const d of [1, 1.25, 29.75, 30]) expect(sunDirection(phaseOfDay(d)).every(Number.isFinite)).toBe(true);
  });
});

describe('l2-mat-troi', () => {
  const build = (options) => buildPainting(painting, meta, { until: 'mat-troi', ...options });
  const volume = ({ layers }) => layers.cot.objects.find((o) => o.name === 'khoi-bao');

  it.each(['webgpu', 'webgl2'])('%s: khối bao vẫn dịch được, một vòng dò chính; shader đọc ngày âm lịch và độ bừng của bụi trăng', (backend) => {
    const built = build();
    const { fragmentShader, problems, uniforms } = compileMaterial(volume(built), built.ctx, backend);
    expect(problems).toEqual([]);
    expect(marchDecls(fragmentShader)).toBe(1);
    expect(uniforms).toEqual(expect.arrayContaining(['lunarDay', 'mat_troi_surge', 'mat_troi_intensity', 'w_mat_troi']));
  });

  it('Dial "ngay": 1–30, bước 0,25; mặc định theo ctx.now, NẰM TRÊN LƯỚI BƯỚC (phím mũi tên tăng đúng một bước); content có nhãn và đủ bốn ghi chú', () => {
    // Ô trượt HTML làm tròn về lưới min + k·step khi bấm phím: mặc định lệch lưới thì một lần bấm không cộng đúng một bước
    // (test a11y chung đã bắt: 17,7563 + 0,25 thành 18).
    for (const now of [new Date('2026-10-21T14:00:00Z'), new Date('2026-10-05T03:00:00Z'), new Date('2027-02-01T12:00:00Z')]) {
      const { setup } = build({ now });
      const dial = setup.dials.find((d) => d.id === 'ngay');
      expect([dial.min, dial.max, dial.step]).toEqual([1, 30, 0.25]);
      const k = (dial.uniform.value - dial.min) / dial.step;
      expect(Math.abs(k - Math.round(k)), `lệch lưới ở ${now.toISOString()}`).toBeLessThan(1e-9);
      expect(Math.abs(dial.uniform.value - defaultDay(now))).toBeLessThanOrEqual(dial.step / 2 + 1e-9);
    }
    expect(content.dials.ngay.label).toBeTruthy();
    for (const k of ['trangMoi', 'thuongHuyen', 'ram', 'haHuyen']) expect(content.dials.ngay.notes[k], k).toBeTruthy();
  });

  it('thí nghiệm "Bề mặt Lambert" và ba số đo có nhãn', () => {
    const { layers } = build();
    expect(layers['mat-troi'].experiments.map((e) => e.id)).toEqual(['lambert']);
    expect(layers['mat-troi'].readouts.map((r) => r.id)).toEqual(['tuoi', 'sang', 'goc']);
    for (const r of layers['mat-troi'].readouts) expect(Number.isFinite(Number(r.get())), r.id).toBe(true);
  });
});
