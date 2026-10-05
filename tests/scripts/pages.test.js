// tests/scripts/pages.test.js — trình sinh trang (spec §19.7): trang trên đĩa đúng từng byte với trang sinh ra (lệch thì chạy npm run pages); đường dẫn tương đối; báo lỗi với thứ khuôn chưa in.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { allPages, relative, renderGallery, renderPainting } from '../../scripts/pages.js';
import { SITE, paintings } from '../../src/paintings/registry.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('scripts/pages.js', () => {
  it.each(allPages())('%s: file trên đĩa khớp từng byte với trang sinh ra (lệch thì chạy `npm run pages` rồi commit)', (page, html) => {
    expect(readFileSync(ROOT + page, 'utf8')).toBe(html);
  });

  it('đường dẫn tương đối giữa thư mục các trang', () => {
    expect(relative('index.html', 'tranh/den-keo-quan/index.html')).toBe('tranh/den-keo-quan/');
    expect(relative('tranh/den-keo-quan/index.html', 'index.html')).toBe('../../');
    expect(relative('tranh/den-keo-quan/index.html', 'tranh/cung-que/index.html')).toBe('../cung-que/');
    expect(relative('tranh/cung-que/index.html', 'tranh/index.html')).toBe('../');
    expect(relative('index.html', 'index.html')).toBe('./');
  });

  it('thơ có tác giả thì báo lỗi: khuôn chưa in tác giả', () => {
    const [first] = paintings;
    const entry = { ...first, meta: { ...first.meta, poem: { ...first.meta.poem, author: 'Nguyễn Du' } } };
    expect(() => renderPainting(entry)).toThrow(/tác giả/);
  });

  it('bức trước, bức sau tìm theo slug: bản chép của một dòng registry ra đúng trang đó; bức không có trong danh sách thì báo lỗi', () => {
    const [, second] = paintings;
    expect(renderPainting({ ...second, meta: { ...second.meta } })).toBe(renderPainting(second));
    const stray = { ...second, meta: { ...second.meta, slug: 'khong-co' } };
    expect(() => renderPainting(stray)).toThrow(/khong-co/);
  });

  it('meta thiếu trường mà khuôn in ra thì báo lỗi nêu tên trường, không in chữ "undefined" vào trang', () => {
    const [first] = paintings;
    const { tagline, ...noTagline } = first.meta;
    expect(() => renderPainting({ ...first, meta: noTagline })).toThrow(/meta\.tagline/);
    const noAlt = { ...first, meta: { ...first.meta, poster: { ...first.meta.poster, alt: undefined } } };
    expect(() => renderPainting(noAlt)).toThrow(/meta\.poster\.alt/);
    expect(() => renderGallery([noAlt])).toThrow(/meta\.poster\.alt/);
  });

  it('og là trường tùy chọn: bức chưa có ảnh og thì trang bỏ thẻ og:image; Phòng tranh lấy ảnh og của bức đầu tiên có nó', () => {
    const [first, ...others] = paintings;
    const { og, ...noOg } = first.meta;
    const entry = { ...first, meta: noOg };
    const list = [entry, ...others];
    const html = renderPainting(entry, list);
    expect(html).not.toMatch(/undefined/);
    expect(html).not.toMatch(/og:image/);
    expect(html).toMatch(/<meta name="twitter:card" content="summary" \/>/);
    const gallery = renderGallery(list);
    expect(gallery).not.toMatch(/undefined/);
    expect(gallery).toContain(`<meta property="og:image" content="${SITE}${others[0].meta.og}" />`);
  });

  it('Phòng tranh không có bức nào thì báo lỗi rõ', () => {
    expect(() => renderGallery([])).toThrow(/ít nhất một bức/);
  });
});
