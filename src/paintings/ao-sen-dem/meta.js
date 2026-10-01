// paintings/ao-sen-dem/meta.js — căn cước Bức 1 · Ao Sen Đêm: tên, thơ, poster, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'ao-sen-dem',
  no: 1,
  title: 'Ao Sen Đêm',
  tagline: 'Một ao sen đêm, sơn từ sáu lớp ánh sáng.',
  poem: {
    lines: [
      'Trong đầm gì đẹp bằng sen',
      'Lá xanh bông trắng lại chen nhị vàng',
      'Nhị vàng bông trắng lá xanh',
      'Gần bùn mà chẳng hôi tanh mùi bùn',
    ],
    source: 'Ca dao',
  },
  poster: {
    src: '/paintings/ao-sen-dem/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá.',
    // scripts/poster.js chụp poster từ chính cảnh (GĐ 4): đêm 16 tháng Chín, trăng tròn, 21:00; khung 300 (5 giây) để
    // đom đóm kịp tản đều. Muốn đổi thời điểm thì sửa dòng này rồi chạy lại script (cần GPU thật).
    capture: { at: '2026-10-25T21:00', freeze: 300 },
  },
  // Ảnh chia sẻ lên mạng xã hội (og:image), 1200×630, JPEG: cắt phần giữa của poster.
  og: 'paintings/ao-sen-dem/og.jpg',
  // THỨ TỰ PHỦ: lớp đầu luôn là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/ao-sen-dem/layers/l1-cot.js',
        'paintings/ao-sen-dem/parts/cot-leaf.js',
        'paintings/ao-sen-dem/parts/cot-flower.js',
        'paintings/ao-sen-dem/parts/cot-reeds.js',
        'paintings/ao-sen-dem/parts/cot-lab.js',
      ],
    },
    {
      id: 'anh-trang',
      name: 'Ánh trăng',
      files: [
        'paintings/ao-sen-dem/layers/l2-anh-trang.js',
        'paintings/ao-sen-dem/parts/anh-trang-moon.js',
        'paintings/ao-sen-dem/parts/anh-trang-paint.js',
        'paintings/ao-sen-dem/parts/anh-trang-shadow.js',
      ],
    },
    {
      id: 'suong',
      name: 'Sương',
      files: [
        'paintings/ao-sen-dem/layers/l3-suong.js',
        'paintings/ao-sen-dem/parts/suong-troi.js',
        'paintings/ao-sen-dem/parts/suong-mu.js',
      ],
      poem: { lines: ['Đêm qua ra đứng bờ ao', 'Trông cá cá lặn, trông sao sao mờ'], source: 'Ca dao' },
    },
    {
      id: 'mat-nuoc',
      name: 'Mặt nước',
      files: ['paintings/ao-sen-dem/layers/l4-mat-nuoc.js', 'paintings/ao-sen-dem/parts/mat-nuoc-gia.js'],
      poem: {
        lines: ['Vầng trăng ai xẻ làm đôi', 'Nửa in gối chiếc, nửa soi dặm trường'],
        source: 'Truyện Kiều',
        author: 'Nguyễn Du',
      },
    },
    {
      id: 'vang-la',
      name: 'Vàng lá',
      files: [
        'paintings/ao-sen-dem/layers/l5-vang-la.js',
        'paintings/ao-sen-dem/parts/vang-la-dan.js',
        'paintings/ao-sen-dem/parts/vang-la-cpu.js',
      ],
    },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
  fence: ['ripple', 'lotus', 'firefl', 'uhour', 'moondir', 'lantern', 'milky', 'mặt nước', 'đom đóm', 'hoa sen', 'hoa đăng', 'ngân hà'],
};
