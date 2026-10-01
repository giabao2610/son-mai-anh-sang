// tests/unit/poster.test.js — scripts/poster.js: URL chụp theo meta.poster.capture, vùng cắt og ở giữa, chọn chất lượng WebP; đọc cỡ ảnh.
import { describe, it, expect } from 'vitest';
import { LIMITS, OG, QUALITIES, captureUrl, centerCrop, pickQuality } from '../../scripts/poster.js';
import { jpegSize, webpSize } from '../helpers/image.js';

const meta = { slug: 'thu', poster: { width: 1600, height: 1000, capture: { at: '2026-10-25T21:00', freeze: 300 } } };

describe('scripts/poster.js', () => {
  it('captureUrl: đúng thời điểm và khung của meta.poster.capture, ẩn UI (?poster), ép mức cao; thiếu capture thì báo', () => {
    expect(captureUrl({ meta, page: 'index.html' })).toBe('?at=2026-10-25T21:00&freeze=300&poster&level=cao');
    expect(captureUrl({ meta, page: 'tranh/den/index.html' })).toBe('tranh/den/?at=2026-10-25T21:00&freeze=300&poster&level=cao');
    expect(() => captureUrl({ meta: { slug: 'x', poster: {} }, page: 'index.html' })).toThrow('Bức "x" chưa có meta.poster.capture');
  });

  it('centerCrop: vùng giữa lớn nhất đúng tỉ lệ og (1200×630) trong poster 1600×1000', () => {
    expect(OG).toMatchObject({ width: 1200, height: 630 });
    expect(centerCrop(1600, 1000, 1200, 630)).toEqual({ x: 0, y: 80, width: 1600, height: 840 });
    expect(centerCrop(1000, 1000, 1200, 630)).toEqual({ x: 0, y: 238, width: 1000, height: 525 });
  });

  it('pickQuality: chất lượng cao nhất mà file vẫn ≤ giới hạn; thấp nhất vẫn quá thì báo', async () => {
    expect(LIMITS).toEqual({ poster: 150 * 1024, og: 200 * 1024 });
    const size = async (q) => Math.round(q * 200_000); // file giả: càng nét càng nặng
    const q = await pickQuality(size, LIMITS.poster);
    expect(q).toBe(QUALITIES.find((x) => x * 200_000 <= LIMITS.poster));
    await expect(pickQuality(async () => 1e9, LIMITS.poster)).rejects.toThrow('vẫn quá 150 KB');
  });
});

describe('tests/helpers/image.js (tự kiểm)', () => {
  it('webpSize đọc khung VP8 (canvas.toBlob sinh dạng này) và VP8X; jpegSize đi tới khung SOF', () => {
    const vp8 = Buffer.alloc(30);
    vp8.write('RIFF', 0);
    vp8.write('WEBP', 8);
    vp8.write('VP8 ', 12);
    vp8.writeUInt16LE(1600, 26);
    vp8.writeUInt16LE(1000, 28);
    expect(webpSize(vp8)).toEqual({ width: 1600, height: 1000 });
    const vp8x = Buffer.alloc(30);
    vp8x.write('RIFF', 0);
    vp8x.write('WEBP', 8);
    vp8x.write('VP8X', 12);
    vp8x.writeUIntLE(1599, 24, 3);
    vp8x.writeUIntLE(999, 27, 3);
    expect(webpSize(vp8x)).toEqual({ width: 1600, height: 1000 });
    // SOI, rồi một đoạn APP0 dài 16 byte, rồi SOF0: cao 630, rộng 1200.
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Array(14).fill(0), 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0, 0, 0]);
    expect(jpegSize(jpeg)).toEqual({ width: 1200, height: 630 });
    expect(() => webpSize(Buffer.from('không phải ảnh'))).toThrow('không phải file WebP');
  });
});
