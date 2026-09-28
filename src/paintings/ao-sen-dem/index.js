// paintings/ao-sen-dem/index.js — cửa vào nhẹ của Bức 1: meta có ngay, phần nặng (three) chỉ tải khi gọi load().
import meta from './meta.js';

/**
 * import() động: bundler tách painting.js (và three) ra chunk riêng,
 * nên trang tĩnh (tầng C) không bao giờ tải three.
 * @type {import('../../engine/contracts/painting.js').PaintingEntry}
 */
export default {
  meta,
  load: () => import('./painting.js'),
  content: { vi: () => import('./content.vi.js') },
};
