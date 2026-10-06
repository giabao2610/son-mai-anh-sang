// tests/paintings/dan-ga-me-con/chu.test.js — chữ của Sổ tay Bức 4: lớp riêng nào cũng có sơ đồ, đoạn Hiểu nói đúng điều lớp đó dạy (spec §20.4), gợi ý đúng §20.2, Đọc thêm chỉ https; số trong chữ khớp với code.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import content from '../../../src/paintings/dan-ga-me-con/content.vi.js';
import { CAMERA } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { knobs as banMauKnobs } from '../../../src/paintings/dan-ga-me-con/layers/l2-ban-mau.js';
import { GRAIN } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-thoc.js';

const own = meta.layers.map((l) => l.id).filter((id) => id !== 'phu-bong');
const understand = (id) => content.layers[id].understand.normalize('NFC');
const WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

describe('chữ của Bức 4', () => {
  it('gợi ý đúng chuỗi của spec §20.2', () => {
    expect(content.hint).toBe('Chạm để rắc thóc · giữ để gà mẹ gọi con · kéo để bước vào tranh');
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

  it('Cốt dạy camera trực giao; Bản màu dạy chia nấc; Bản nét dạy độ lệch khỏi mặt phẳng trên ảnh độ sâu; Giấy điệp dạy phản xạ; Đàn gà dạy vòng đệm', () => {
    expect(understand('cot')).toMatch(/trực giao/);
    expect(understand('ban-mau')).toMatch(/nấc/);
    expect(understand('ban-net')).toMatch(/độ sâu/);
    expect(understand('ban-net')).toMatch(/mặt phẳng/);
    expect(understand('giay-diep')).toMatch(/phản xạ/);
    expect(understand('dan-ga')).toMatch(/vòng đệm/);
  });

  it('số trong chữ khớp với code: góc nhìn xuống và lúc tranh tự khép lại, số nấc và độ đậm nấc tối mặc định (cả công thức màu của sơ đồ chia-nac), tầm mỏ ăn thóc', () => {
    const [, dy, dz] = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
    expect(understand('cot')).toContain(`${Math.round((Math.atan2(dy, dz) * 180) / Math.PI)}°`);
    expect(understand('cot')).toContain(`${WORDS[CAMERA.home.after]} giây`);
    const knob = (k) => banMauKnobs.find((x) => x.id === k).value;
    expect(understand('ban-mau')).toContain(`${WORDS[knob('bands')]} nấc`);
    expect(understand('ban-mau')).toContain(`${Math.round(knob('shade') * 100)}%`);
    // l2-ban-mau.js: màu ra = màu in × mix(1 − shade, 1, nấc) = màu in × (1 − shade + shade × nấc).
    const comma = (x) => String(Math.round(x * 100) / 100).replace('.', ',');
    expect(content.layers['ban-mau'].diagram).toContain(`× (${comma(1 - knob('shade'))} + ${comma(knob('shade'))} × nấc)`);
    // Một đơn vị cảnh là 10 cm (spec §20).
    expect(understand('dan-ga')).toContain(`${String(Math.round(GRAIN.eat * 100) / 10).replace('.', ',')} cm`);
  });

  it('sơ đồ đọc được bằng trình đọc màn hình: role="img", aria-labelledby trỏ đúng <title> của chính nó', () => {
    for (const id of own) {
      const svg = content.layers[id].diagram;
      const label = svg.match(/<svg[^>]*\saria-labelledby="([^"]+)"/)?.[1];
      expect(svg, `sơ đồ của "${id}"`).toMatch(/<svg[^>]*\srole="img"/);
      expect(svg, `<title> của sơ đồ "${id}"`).toContain(`<title id="${label}">`);
    }
  });

  it('id trong các sơ đồ không trùng nhau (Sổ tay chèn sơ đồ vào cùng một trang)', () => {
    const ids = own.flatMap((id) => [...content.layers[id].diagram.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
