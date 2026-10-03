// tests/paintings/captions-rule.test.js — luật chữ đi theo vật (GĐ 5) tự kiểm: captionErrors nhận mục đúng, bắt được mục sai.
import { describe, it, expect } from 'vitest';
import { CAPTION_MAX_CHARS, captionErrors } from '../helpers/caption-rules.js';

describe('luật chữ đi theo vật (GĐ 5) tự kiểm', () => {
  const ok = { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' };

  it('nhận mục đúng: 1 hay 2 dòng, có hay không có tác giả; dòng đúng 60 ký tự vẫn đạt, kể cả chữ Nôm (ngoài BMP)', () => {
    const nom = '\u{21A38}'.repeat(CAPTION_MAX_CHARS); // chữ "chữ" viết bằng chữ Nôm: 60 ký tự nhưng .length là 120
    expect(nom.length).toBe(2 * CAPTION_MAX_CHARS);
    expect(captionErrors(undefined)).toEqual([]);
    expect(captionErrors({})).toEqual([]);
    expect(captionErrors({ 'tram-nam': ok, 'mot-dong': { lines: [nom], source: 'Ca dao' }, 'a1-b2': { lines: ['x'], source: 'y' } })).toEqual([]);
  });

  it('bắt được: khóa có dấu, hoa hay gạch dưới; 0 hoặc 3 dòng; dòng rỗng; dòng quá 60 ký tự; thiếu nguồn; tác giả rỗng', () => {
    const cases = {
      'Tram-nam': ok,
      'trăm-năm': ok,
      tram_nam: ok,
      'khong-dong': { ...ok, lines: [] },
      'ba-dong': { ...ok, lines: ['a', 'b', 'c'] },
      'dong-rong': { ...ok, lines: ['a', '  '] },
      'qua-dai': { ...ok, lines: ['Ỷ'.repeat(CAPTION_MAX_CHARS + 1)] },
      'thieu-nguon': { lines: ['a'] },
      'tac-gia-rong': { ...ok, author: '' },
    };
    const errors = captionErrors(cases);
    for (const key of Object.keys(cases)) expect(errors.some((e) => e.includes(`"${key}"`)), `phải bắt được "${key}"`).toBe(true);
    expect(captionErrors(['tram-nam'])).toHaveLength(1);
  });
});
