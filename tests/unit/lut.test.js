// tests/unit/lut.test.js — LUT "sơn mài": khóa TÍNH CHẤT (đen vẫn đen, trắng gần trắng, độ sáng lệch ít, tối ấm, sáng ngả vàng), không khóa công thức.
import { describe, it, expect } from 'vitest';
import { ClampToEdgeWrapping, LinearFilter } from 'three/webgpu';
import { LUT_SIZE, lacquerLut, luma, lutTexture } from '../../src/engine/stock/phu-bong/lut.js';
import { PALETTE, mergePalette } from '../../src/engine/palette.js';

const N = LUT_SIZE;
const lut = lacquerLut(PALETTE);
/** Màu ra (0–1) của ô gần màu vào (r, g, b) nhất. */
function at(data, r, g, b) {
  const [x, y, z] = [r, g, b].map((v) => Math.round(v * (N - 1)));
  const i = ((z * N + y) * N + x) * 4;
  return [data[i], data[i + 1], data[i + 2]].map((v) => v / 255);
}

describe('lacquerLut', () => {
  it('mảng RGBA8 dài 32³ × 4; alpha luôn 255', () => {
    expect(LUT_SIZE).toBe(32);
    expect(lut).toBeInstanceOf(Uint8Array);
    expect(lut.length).toBe(32 ** 3 * 4);
    for (let i = 3; i < lut.length; i += 4) if (lut[i] !== 255) throw new Error(`alpha ở ô ${i / 4} là ${lut[i]}`);
  });

  it('đen vẫn đen, trắng vẫn (gần) trắng', () => {
    expect(at(lut, 0, 0, 0)).toEqual([0, 0, 0]);
    for (const v of at(lut, 1, 1, 1)) expect(v).toBeGreaterThan(0.97);
  });

  it('độ sáng lệch ít: trung bình dưới 0,01, xấu nhất dưới 0,08 (chỉ lệch khi màu chạm biên 0 hay 1)', () => {
    let sum = 0;
    let worst = 0;
    for (let z = 0; z < N; z++) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const i = ((z * N + y) * N + x) * 4;
          const d = Math.abs(luma(lut[i] / 255, lut[i + 1] / 255, lut[i + 2] / 255) - luma(x / (N - 1), y / (N - 1), z / (N - 1)));
          sum += d;
          worst = Math.max(worst, d);
        }
      }
    }
    expect(sum / N ** 3).toBeLessThan(0.01);
    expect(worst).toBeLessThan(0.08);
  });

  it('xám tối ấm lên (đỏ > lam); xám sáng ngả vàng (đỏ, lục > lam); xanh trời ngả chàm (lam trội hơn)', () => {
    const [r, , b] = at(lut, 0.2, 0.2, 0.2);
    expect(r).toBeGreaterThan(b);
    const [lr, lg, lb] = at(lut, 0.75, 0.75, 0.75);
    expect(lr).toBeGreaterThan(lb);
    expect(lg).toBeGreaterThan(lb);
    const sky = [0.2, 0.3, 0.6];
    const [sr, , sb] = at(lut, ...sky);
    expect(sb - sr).toBeGreaterThan(sky[2] - sky[0]);
  });

  it('bảng màu của bức đổi thì LUT đổi theo: ghi đè canhGian thì vùng tối đổi, vùng sáng thì không', () => {
    const green = lacquerLut(mergePalette({ canhGian: '#1F5A2A' }));
    const [r, g] = at(green, 0.2, 0.2, 0.2);
    expect(g).toBeGreaterThan(r);
    expect(at(green, 0.75, 0.75, 0.75)).toEqual(at(lut, 0.75, 0.75, 0.75));
  });
});

describe('lutTexture', () => {
  it('Data3DTexture 32³, LinearFilter (mặc định là Nearest: màu vỡ bậc), ClampToEdge ba chiều', () => {
    const texture = lutTexture(PALETTE);
    expect(texture.isData3DTexture).toBe(true);
    expect([texture.image.width, texture.image.height, texture.image.depth]).toEqual([32, 32, 32]);
    expect([texture.minFilter, texture.magFilter]).toEqual([LinearFilter, LinearFilter]);
    expect([texture.wrapS, texture.wrapT, texture.wrapR]).toEqual([ClampToEdgeWrapping, ClampToEdgeWrapping, ClampToEdgeWrapping]);
    expect(texture.image.data).toEqual(lut);
  });
});
