// paintings/den-keo-quan/meta.js — căn cước Bức 2 · Đèn Kéo Quân: tên, thơ, poster, màu thêm, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'den-keo-quan',
  no: 2,
  title: 'Đèn Kéo Quân',
  tagline: 'Một ngọn đèn kéo quân trong gian nhà tối, sơn từ sáu lớp ánh sáng.',
  // Dân ca "Đèn cù" (đèn cù là tên khác của đèn kéo quân), bỏ tiếng đệm lúc hát. Chữ đối chiếu lại trước khi merge.
  poem: { lines: ['Khen ai khéo kết đèn cù', 'Voi giấy, ngựa giấy tít mù vòng quanh'], source: 'Ca dao' },
  poster: {
    src: '/paintings/den-keo-quan/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài đèn kéo quân: ngọn đèn giấy treo giữa gian nhà tối, bóng voi ngựa chạy quanh vách.',
    // scripts/poster.js chụp từ chính cảnh. Bức không có giờ hay trăng trong cảnh: at chỉ để con dấu và trăng SVG giống Bức 1.
    // freeze là khung mà đoàn quân đứng đẹp trên vách sau: khung 200 có con ngựa phi và lá cờ ngay giữa vách (lượt màu GĐ 6).
    capture: { at: '2026-10-25T21:00', freeze: 200 },
  },
  og: 'paintings/den-keo-quan/og.jpg',
  // Hai màu thêm vào bảng sơn mài (spec §18.3): lửa cam, giấy dó.
  palette: { lua: '#E0782E', giayDo: '#D9C7A0' },
  // THỨ TỰ PHỦ: lớp đầu là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/den-keo-quan/layers/l1-cot.js',
        'paintings/den-keo-quan/parts/cot-phong.js',
        'paintings/den-keo-quan/parts/cot-den.js',
        'paintings/den-keo-quan/parts/cot-trong.js',
        'paintings/den-keo-quan/parts/cot-hinh-nhan.js',
        'paintings/den-keo-quan/parts/cot-doan-quan.js',
      ],
    },
    {
      id: 'ngon-nen',
      name: 'Ngọn nến',
      files: [
        'paintings/den-keo-quan/layers/l2-ngon-nen.js',
        'paintings/den-keo-quan/parts/ngon-nen-thoi.js',
        'paintings/den-keo-quan/parts/ngon-nen-lua.js',
      ],
    },
    {
      id: 'gian-nha',
      name: 'Gian nhà',
      files: ['paintings/den-keo-quan/layers/l3-gian-nha.js', 'paintings/den-keo-quan/parts/gian-nha-vat-lieu.js'],
    },
    {
      id: 'giay',
      name: 'Giấy',
      files: ['paintings/den-keo-quan/layers/l4-giay.js'],
    },
    {
      id: 'keo-quan',
      name: 'Kéo quân',
      files: [
        'paintings/den-keo-quan/layers/l5-keo-quan.js',
        'paintings/den-keo-quan/parts/keo-quan-gobo.js',
        'paintings/den-keo-quan/parts/keo-quan-quay.js',
        'paintings/den-keo-quan/parts/keo-quan-that.js',
      ],
    },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
  fence: ['drum', 'gobo', 'candle', 'flame', 'turbine', 'silhouet', 'wick', 'kéo quân', 'hình nhân', 'ngọn nến', 'đèn cù', 'chong chóng'],
};
