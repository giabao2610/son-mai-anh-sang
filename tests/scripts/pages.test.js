// tests/scripts/pages.test.js — trình sinh trang (spec §19.7): trang trên đĩa đúng từng byte với trang sinh ra (lệch thì chạy npm run pages); đường dẫn tương đối; báo lỗi với thứ khuôn chưa in.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { allPages, relative, renderPainting } from '../../scripts/pages.js';
import { paintings } from '../../src/paintings/registry.js';

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
});
