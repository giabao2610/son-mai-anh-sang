// tests/paintings/den-keo-quan/chu.test.js — chữ của Sổ tay Bức 2: lớp riêng nào cũng có sơ đồ, đoạn Hiểu nói đúng điều lớp đó dạy (spec §18.4), gợi ý đúng §18.2.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import content from '../../../src/paintings/den-keo-quan/content.vi.js';

const own = meta.layers.map((l) => l.id).filter((id) => id !== 'phu-bong');
const understand = (id) => content.layers[id].understand.normalize('NFC');

describe('chữ của Bức 2', () => {
  it('gợi ý đúng chuỗi của spec §18.2', () => {
    expect(content.hint).toBe('Chạm để thổi nến · vuốt để gạt đèn · giữ để dừng');
  });

  it.each(own)('lớp %s có sơ đồ (bức này cam kết sơ đồ cho mọi lớp riêng), 2–3 dòng "Bạn vừa học", 1–3 link Đọc thêm', (id) => {
    const text = content.layers[id];
    expect(text.diagram?.trimStart().startsWith('<svg'), `sơ đồ của "${id}"`).toBe(true);
    expect(text.learned.length).toBeGreaterThanOrEqual(2);
    expect(text.learned.length).toBeLessThanOrEqual(3);
    expect(text.readMore.length).toBeGreaterThanOrEqual(1);
    expect(text.readMore.length).toBeLessThanOrEqual(3);
  });

  it('Kéo quân dạy atan và nửa tối; Giấy dạy ánh sáng tính ở mặt trong; Ngọn nến dạy luật nghịch đảo bình phương; Gian nhà dạy fract và fbm', () => {
    expect(understand('keo-quan')).toMatch(/atan/);
    expect(understand('keo-quan')).toMatch(/nửa tối/);
    expect(understand('giay')).toMatch(/mặt trong/);
    expect(understand('ngon-nen')).toMatch(/bình phương/);
    expect(understand('gian-nha')).toMatch(/fract/);
    expect(understand('gian-nha')).toMatch(/fbm/);
    expect(understand('cot')).toMatch(/mặt nạ/);
  });
});
