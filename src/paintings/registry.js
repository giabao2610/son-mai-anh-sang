// paintings/registry.js — danh sách các bức: Node (vite.config, test) đọc được vì chỉ import meta.js, trình duyệt KHÔNG import.
import aoSenDem from './ao-sen-dem/meta.js';
import denKeoQuan from './den-keo-quan/meta.js';

/** Địa chỉ gốc khi deploy, có '/' cuối (og:image tuyệt đối = SITE + meta.og). */
export const SITE = 'https://giabao2610.github.io/son-mai-anh-sang/';

/**
 * Mỗi dòng là một trang: { meta, page, lang }. page tính từ gốc repo; mỗi trang một ngôn ngữ.
 * Thêm một bức = thêm một dòng ở đây (luật 7).
 * @type {{ meta: import('../engine/contracts/painting.js').PaintingMeta, page: string, lang: string }[]}
 */
export const paintings = [
  { meta: aoSenDem, page: 'index.html', lang: 'vi' },
  { meta: denKeoQuan, page: 'tranh/den-keo-quan/index.html', lang: 'vi' },
];
