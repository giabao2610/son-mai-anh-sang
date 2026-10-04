// tests/paintings/den-keo-quan/cot-hinh-nhan.test.js — mặt nạ hình nhân: khoảng cách có dấu, độ phủ có mép mịn, quấn vòng, chuỗi mip, tám hình đặt đều trong dải.
import { describe, it, expect } from 'vitest';
import {
  ASPECT, FIGURES, GROUND, MARGIN, bounds, mipChain, rasterize, shapeDistance,
} from '../../../src/paintings/den-keo-quan/parts/cot-hinh-nhan.js';

const coverage = ({ data }) => data.reduce((s, v) => s + v, 0) / 255;

describe('cot-hinh-nhan', () => {
  it('khoảng cách có dấu: âm ở trong, dương ở ngoài, 0 trên mép (bốn loại hình)', () => {
    expect(shapeDistance({ kind: 'circle', cx: 0, cy: 0.5, r: 0.2 }, 0, 0.5)).toBeCloseTo(-0.2, 9);
    expect(shapeDistance({ kind: 'circle', cx: 0, cy: 0.5, r: 0.2 }, 0.3, 0.5)).toBeCloseTo(0.1, 9);
    expect(shapeDistance({ kind: 'capsule', ax: 0, ay: 0.2, bx: 0, by: 0.8, r: 0.05 }, 0.05, 0.5)).toBeCloseTo(0, 9);
    const square = { kind: 'poly', points: [[-0.1, 0.4], [0.1, 0.4], [0.1, 0.6], [-0.1, 0.6]] };
    expect(shapeDistance(square, 0, 0.5)).toBeCloseTo(-0.1, 9);
    expect(shapeDistance(square, 0.3, 0.5)).toBeCloseTo(0.2, 9);
    expect(shapeDistance({ kind: 'ellipse', cx: 0, cy: 0.5, rx: 0.2, ry: 0.1 }, 0, 0.5)).toBeLessThan(0);
  });

  it('một hình tròn ra đúng diện tích (sai số < 1%) và có mép trung gian', () => {
    const r = 0.3;
    const raster = rasterize([{ id: 'tron', width: 1, shapes: [{ kind: 'circle', cx: 0, cy: 0.5, r }] }], 512, { count: 1, ground: 0 });
    const area = coverage(raster.levels[0]) / raster.height ** 2; // đơn vị chiều cao dải
    expect(Math.abs(area / (Math.PI * r * r) - 1)).toBeLessThan(0.01);
    expect(raster.levels[0].data.some((v) => v > 0 && v < 255)).toBe(true);
  });

  it('tất định: hai lần vẽ cho cùng byte', () => {
    const a = rasterize(FIGURES, 512, { count: 8 });
    const b = rasterize(FIGURES, 512, { count: 8 });
    expect(Buffer.from(a.levels[0].data).equals(Buffer.from(b.levels[0].data))).toBe(true);
  });

  it('cỡ: cao = rộng / 4 (texel vuông trên mặt trụ); mip tới 1 × 1, mỗi mức là trung bình 2 × 2 của mức trước', () => {
    const { width, height, levels } = rasterize(FIGURES, 256, { count: 8 });
    expect(height).toBe(width / ASPECT);
    expect(levels.at(-1)).toMatchObject({ width: 1, height: 1 });
    expect(levels[1]).toMatchObject({ width: 128, height: 32 });
    const [l0, l1] = levels;
    const avg = (l0.data[0] + l0.data[1] + l0.data[l0.width] + l0.data[l0.width + 1]) / 4;
    expect(l1.data[0]).toBe(Math.round(avg));
  });

  it('quấn vòng: hình đặt sát mép phải tràn sang mép trái, không bị cắt', () => {
    const fig = { id: 'ngang', width: 0.6, shapes: [{ kind: 'capsule', ax: -0.3, ay: 0.5, bx: 0.3, by: 0.5, r: 0.1 }] };
    const { levels: [l0], width, height } = rasterize([fig], 256, { count: 1, ground: 0, offset: 0.5 }); // tâm hình ở u = 1
    const row = Math.round(0.5 * height) * width;
    expect(l0.data[row]).toBeGreaterThan(200);
    expect(l0.data[row + width - 1]).toBeGreaterThan(200);
  });

  it('dải để trống MARGIN ở trên và dưới (tra ngoài dải ra 0); vạch đất GROUND phủ kín cả vòng', () => {
    const { levels: [l0], width, height } = rasterize(FIGURES, 512, { count: 8 });
    const rowSum = (j) => l0.data.subarray(j * width, (j + 1) * width).reduce((s, v) => s + v, 0);
    expect(rowSum(0)).toBe(0);
    expect(rowSum(height - 1)).toBe(0);
    expect(rowSum(Math.floor((MARGIN + GROUND / 2) * height))).toBe(255 * width);
  });

  it('mọi hình nằm trong dải [MARGIN, 1 − MARGIN] và trong bề rộng của chính nó', () => {
    for (const fig of FIGURES) {
      for (const s of fig.shapes) {
        const b = bounds(s);
        expect(b.y0, `${fig.id}`).toBeGreaterThanOrEqual(MARGIN - 1e-9);
        expect(b.y1, `${fig.id}`).toBeLessThanOrEqual(1 - MARGIN + 1e-9);
        expect(Math.max(-b.x0, b.x1), `${fig.id}`).toBeLessThanOrEqual(fig.width / 2 + 1e-9);
      }
    }
  });

  it('vẽ ở 2048 đủ nhanh: lần nhanh nhất trong ba lần dưới 150 ms trong Node (chặn chậm đi hàng bậc)', () => {
    // Mục tiêu thật (≤ 50 ms trên trình duyệt) đo ở spec §18.7. Ở đây chỉ chặn hồi quy lớn: một lần đo đơn lẻ với ngưỡng sát hỏng oan
    // khi máy đang bận (e2e chạy song song) hay khi máy CI chậm hơn máy của Bao; lần nhanh nhất trong ba lần thì ổn định.
    const times = [0, 1, 2].map(() => {
      const t0 = performance.now();
      rasterize(FIGURES, 2048, { count: 8 });
      return performance.now() - t0;
    });
    expect(Math.min(...times)).toBeLessThan(150);
  });

  it('đủ tám hình theo thứ tự của spec §18.3', () => {
    expect(FIGURES.map((f) => f.id)).toEqual(['cuoi-ngua', 'linh-co', 'voi', 'danh-trong', 'linh-giao', 'ngua', 'cam-long', 'thoi-tu-va']);
  });

  it('6 tới 10 hình (núm figures): tổng bề rộng không quá chu vi dải', () => {
    for (const count of [6, 8, 10]) {
      const total = Array.from({ length: count }, (_, k) => FIGURES[k % FIGURES.length].width).reduce((s, v) => s + v, 0);
      expect(total, `${count} hình`).toBeLessThanOrEqual(ASPECT);
    }
  });

  it('chân của mọi hình chạm vạch đất (có hình cơ bản xuống tới mép trên của vạch)', () => {
    for (const fig of FIGURES) {
      const lowest = Math.min(...fig.shapes.map((s) => bounds(s).y0));
      expect(lowest, fig.id).toBeLessThanOrEqual(MARGIN + GROUND + 0.01);
    }
  });
});
