// paintings/dan-ga-me-con/meta.js — căn cước Bức 4 · Đàn Gà Mẹ Con: tên, thơ, poster, năm màu Đông Hồ, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'dan-ga-me-con',
  no: 4,
  title: 'Đàn Gà Mẹ Con',
  tagline: 'Một tờ tranh Đông Hồ bước vào được: gà mẹ ngậm con ong, mười gà con quây quần, sơn từ sáu lớp ánh sáng.',
  // Ca dao: mười gà con cùng một mẹ (spec §20.2). Câu chữ đối chiếu lại trước khi merge.
  poem: { lines: ['Khôn ngoan đối đáp người ngoài', 'Gà cùng một mẹ chớ hoài đá nhau'], source: 'Ca dao' },
  poster: {
    src: '/paintings/dan-ga-me-con/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh Đông Hồ đàn gà mẹ con trên giấy điệp, đặt trên ván sơn đen: gà mẹ ngậm con ong, mười gà con quây quần.',
    // scripts/poster.js chụp từ chính cảnh, ở góc nhìn của tranh. Poster tạm của bản khung; lượt màu (Task 11) chốt khung có gà con
    // đang mổ nhúm thóc.
    capture: { at: '2026-10-05T21:00', freeze: 120 },
  },
  og: 'paintings/dan-ga-me-con/og.jpg',
  // Năm màu tự nhiên của tranh Đông Hồ (spec §20.3): trắng điệp, vàng hoa hòe, đỏ sỏi son, xanh lá chàm, đen than lá tre.
  palette: { diep: '#EFE6D2', hoe: '#E0AC3A', sonSoi: '#B9472E', xanhDong: '#41705F', muc: '#221E1A' },
  // THỨ TỰ PHỦ: lớp đầu là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng. Thứ tự in của làng: màu trước (Bản màu), nét đen sau cùng
  // (Bản nét). Task 6 và Task 8 thêm Giấy điệp và Đàn gà.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/dan-ga-me-con/layers/l1-cot.js',
        'paintings/dan-ga-me-con/parts/cot-bo-cuc.js',
        'paintings/dan-ga-me-con/parts/cot-giay.js',
        'paintings/dan-ga-me-con/parts/cot-hinh-ga.js',
      ],
    },
    {
      id: 'ban-mau',
      name: 'Bản màu',
      files: ['paintings/dan-ga-me-con/layers/l2-ban-mau.js', 'paintings/dan-ga-me-con/parts/ban-mau-bang.js'],
    },
    {
      id: 'ban-net',
      name: 'Bản nét',
      files: ['paintings/dan-ga-me-con/layers/l3-ban-net.js', 'paintings/dan-ga-me-con/parts/ban-net-do-canh.js'],
    },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới. Không rào hen (chuỗi con của denThen, token của xưởng)
  // hay grain (núm của Phủ bóng); không rào tên kỹ thuật (ink, paper, outline, toon, cel, sobel, ortho): bức sau có thể cần rút chúng lên.
  fence: ['chick', 'poultry', 'rooster', 'gà mẹ', 'gà con', 'thóc', 'con ong', 'đông hồ', 'điệp', 'bản nét', 'bản màu', 'lá tre'],
};
