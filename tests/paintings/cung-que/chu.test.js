// tests/paintings/cung-que/chu.test.js — chữ của Sổ tay Bức 3: lớp riêng nào cũng có sơ đồ, đoạn Hiểu nói đúng điều lớp đó dạy (spec §19.4), gợi ý đúng §19.2, Đọc thêm chỉ https.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/cung-que/meta.js';
import content from '../../../src/paintings/cung-que/content.vi.js';

const own = meta.layers.map((l) => l.id).filter((id) => id !== 'phu-bong');
const understand = (id) => content.layers[id].understand.normalize('NFC');

describe('chữ của Bức 3', () => {
  it('gợi ý đúng chuỗi của spec §19.2', () => {
    expect(content.hint).toBe('Chạm vào tán đa · giữ để cây bay lên · kéo để xoay');
  });

  it.each(own)('lớp %s có sơ đồ, 2–4 dòng "Bạn vừa học", 1–3 link Đọc thêm (chỉ https)', (id) => {
    const text = content.layers[id];
    expect(text.diagram?.trimStart().startsWith('<svg'), `sơ đồ của "${id}"`).toBe(true);
    expect(text.learned.length).toBeGreaterThanOrEqual(2);
    expect(text.learned.length).toBeLessThanOrEqual(4);
    expect(text.readMore.length).toBeGreaterThanOrEqual(1);
    expect(text.readMore.length).toBeLessThanOrEqual(3);
    for (const { url } of text.readMore) expect(url, url).toMatch(/^https:\/\//);
  });

  it('Cốt dạy khoảng cách và dò tia; Mặt trời dạy pha và Lambert; Bóng mềm dạy nửa tối và AO; Ánh đất nói về Trái Đất; Lá đa dạy độ sâu', () => {
    expect(understand('cot')).toMatch(/khoảng cách/);
    expect(understand('cot')).toMatch(/dò tia/);
    expect(understand('mat-troi')).toMatch(/pha/);
    expect(understand('mat-troi')).toMatch(/Lambert/);
    expect(understand('bong-mem')).toMatch(/nửa tối/);
    expect(understand('bong-mem')).toMatch(/AO/);
    expect(understand('anh-dat')).toMatch(/Trái Đất/);
    expect(understand('la-da')).toMatch(/độ sâu/);
  });

  it('id trong các sơ đồ không trùng nhau (Sổ tay chèn sơ đồ vào cùng một trang)', () => {
    const ids = own.flatMap((id) => [...content.layers[id].diagram.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
