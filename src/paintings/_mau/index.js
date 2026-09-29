// paintings/_mau/index.js — cửa vào nhẹ của tranh mẫu: meta có ngay, phần nặng (three) và chữ chỉ tải khi gọi.
import meta from './meta.js';

/** @type {import('../../engine/contracts/painting.js').PaintingEntry} */
export default {
  meta,
  load: () => import('./painting.js'),
  content: { vi: () => import('./content.vi.js') },
};
