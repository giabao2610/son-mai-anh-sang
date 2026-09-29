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
    src: '/paintings/ao-sen-dem/poster.svg',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá.',
  },
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
    { id: 'vang-la', name: 'Vàng lá', files: ['paintings/ao-sen-dem/layers/l5-vang-la.js'] },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
  fence: ['ripple', 'lotus', 'firefl', 'uhour', 'moondir', 'lantern', 'milky', 'mặt nước', 'đom đóm', 'hoa sen', 'hoa đăng', 'ngân hà'],
};
