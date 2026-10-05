// paintings/cung-que/meta.js — căn cước Bức 3 · Cung Quế: tên, thơ, poster, màu thêm, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'cung-que',
  no: 3,
  title: 'Cung Quế',
  tagline: 'Chú Cuội ngồi gốc cây đa trên một mặt trăng nhỏ, sơn từ sáu lớp ánh sáng.',
  // Ca dao về chú Cuội. Dị bản "Để trâu ăn lúa" / "Bỏ trâu ăn lúa": đối chiếu nguồn trước khi merge (spec §19.2).
  poem: { lines: ['Thằng Cuội ngồi gốc cây đa', 'Để trâu ăn lúa gọi cha ời ời'], source: 'Ca dao' },
  poster: {
    src: '/paintings/cung-que/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài cung trăng: chú Cuội ngồi gốc cây đa trên một hành tinh nhỏ, con trâu gặm cỏ, Trái Đất treo trên trời.',
    // scripts/poster.js chụp từ chính cảnh. at quyết định pha trăng (Dial mặc định theo ngày giờ); chốt ở lượt màu (spec §19.3).
    capture: { at: '2026-10-21T21:00', freeze: 120 },
  },
  og: 'paintings/cung-que/og.jpg',
  // Một màu thêm vào bảng sơn mài (spec §19.3): xanh ánh đất, cho ánh đất và viền khí quyển của Trái Đất.
  palette: { anhDat: '#7E9CC8' },
  // THỨ TỰ PHỦ: lớp đầu là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/cung-que/layers/l1-cot.js',
        'paintings/cung-que/parts/cot-the-gioi.js',
        'paintings/cung-que/parts/cot-sdf.js',
        'paintings/cung-que/parts/cot-do-tia.js',
        'paintings/cung-que/parts/cot-cay-bay.js',
      ],
    },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới. Không rào sdf, raymarch: đó là tên kỹ thuật.
  fence: ['banyan', 'buffalo', 'earthshine', 'regolith', 'chú cuội', 'cuội', 'cây đa', 'trâu', 'ánh đất', 'bụi trăng'],
};
