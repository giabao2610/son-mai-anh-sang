// tests/helpers/paintings.js — các bức mà test hợp đồng lặp qua: mọi dòng registry (đã deploy) và tranh mẫu _mau, kèm cửa vào đã nạp.
import { paintings } from '../../src/paintings/registry.js';
import mau from '../../src/paintings/_mau/meta.js';

/** Bức đã deploy (registry) và tranh mẫu. Tranh mẫu không có trang HTML và không bị kiểm HTML (spec §12). */
const ROWS = [...paintings.map((p) => ({ ...p, deployed: true })), { meta: mau, page: null, lang: 'vi', deployed: false }];

/**
 * Nạp trước cửa vào của mọi bức (top-level await): danh sách ngôn ngữ của content phải có trước khi khai báo test.
 * @type {{ meta: object, page: string | null, lang: string, deployed: boolean, entry: object, langs: string[] }[]}
 */
export const ALL = await Promise.all(ROWS.map(async (row) => {
  const { default: entry } = await import(`../../src/paintings/${row.meta.slug}/index.js`);
  return { ...row, entry, langs: Object.keys(entry.content ?? {}) };
}));
