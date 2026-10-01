// paintings/_mau/meta.js — căn cước của tranh mẫu (KHÔNG deploy): copy cả thư mục _mau để bắt đầu một bức mới.

/**
 * Tranh mẫu hai lớp: Cốt (đất sét) và Tô màu. Không có trong registry, không có trang HTML: chỉ test hợp đồng
 * đọc nó (tests/paintings/contract.test.js), và người làm bức mới copy nó (spec §15 a).
 * Khi copy: đổi slug (= tên thư mục mới, kebab-case không dấu), no, title, tagline, poem, poster, và fence.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: '_mau',
  no: 0,
  title: 'Tranh mẫu',
  tagline: 'Hai lớp: cốt đất sét và một lớp tô màu. Copy thư mục này để bắt đầu một bức mới.',
  poem: {
    lines: ['Ai ơi bưng bát cơm đầy', 'Dẻo thơm một hạt đắng cay muôn phần'],
    source: 'Ca dao',
  },
  // Bức thật đặt poster ở public/paintings/<slug>/: chạy `node scripts/poster.js <slug>` (GPU thật) để chụp poster.webp
  // và og.jpg từ chính cảnh, theo `capture` (thời điểm ?at và khung ?freeze). Tranh mẫu không deploy nên không có file ảnh.
  poster: {
    src: '/paintings/_mau/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh mẫu: một nút thắt đất sét trên bệ.',
    capture: { at: '2026-09-28T21:00', freeze: 120 },
  },
  // THỨ TỰ PHỦ: lớp đầu luôn là Cốt. Bức thật thường kết thúc bằng lớp dùng chung Phủ bóng (engine/stock/phu-bong).
  layers: [
    { id: 'cot', name: 'Cốt', files: ['paintings/_mau/layers/l1-cot.js'] },
    { id: 'to-mau', name: 'Tô màu', files: ['paintings/_mau/layers/l2-to-mau.js'] },
  ],
  // Từ vựng riêng của bức mà xưởng không được nhắc tới (test hàng rào đọc). Tranh mẫu không có từ nào riêng.
  fence: [],
};
