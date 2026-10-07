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
    // scripts/poster.js chụp từ chính cảnh, ở góc nhìn của tranh. Khung 240 (4 giây, chốt ở lượt màu GĐ 8 Task 11): gà con đỏ và vàng cúi
    // mổ nhúm thóc lúc mở trang, gà con đen bên phải quay nghiêng thấy mắt (khung 120 thì nó quay lưng: một khối đen). Chụp lại ở cùng
    // khung sau khi đổi hướng hai gà con xanh (vòng sau điểm duyệt ảnh, spec §20.1), để poster hòa sang cảnh không thấy chúng quay đầu.
    capture: { at: '2026-10-05T21:00', freeze: 240 },
  },
  og: 'paintings/dan-ga-me-con/og.jpg',
  // Năm màu tự nhiên của tranh Đông Hồ (spec §20.3): trắng điệp, vàng hoa hòe, đỏ sỏi son, xanh lá chàm, đen than lá tre. Số chốt ở lượt
  // màu (GĐ 8 Task 11): Phủ bóng của bức dùng ACES, làm màu đậm và sáng lên, nên bốn màu in là màu VÀO để màu hiện ra đúng màu thiết kế
  // (#E0AC3A, #B9472E, #41705F, #221E1A); mực lạnh hơn để LUT nhuộm nâu xong vẫn là đen than. Giấy giữ hex thiết kế.
  palette: { diep: '#EFE6D2', hoe: '#D08E2A', sonSoi: '#994533', xanhDong: '#3F6358', muc: '#272C2C' },
  // THỨ TỰ PHỦ: lớp đầu là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng. Thứ tự in của làng: màu trước (Bản màu), nét đen sau cùng
  // (Bản nét); giấy điệp là việc của tờ giấy, độc lập với gà; Đàn gà là chuyển động (gà, thóc) phủ lên tờ tranh in sẵn.
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
      files: [
        'paintings/dan-ga-me-con/layers/l3-ban-net.js',
        'paintings/dan-ga-me-con/parts/ban-net-do-canh.js',
        'paintings/dan-ga-me-con/parts/ban-net-net-trong.js',
      ],
    },
    {
      id: 'giay-diep',
      name: 'Giấy điệp',
      // lib/tsl/noise.js (GĐ 8): fbm của sợi dó và vệt chổi; Sổ tay hiện cả code của nó.
      files: ['paintings/dan-ga-me-con/layers/l4-giay-diep.js', 'paintings/dan-ga-me-con/parts/giay-diep-mat.js', 'lib/tsl/noise.js'],
    },
    {
      id: 'dan-ga',
      name: 'Đàn gà',
      // Đàn gà dạng đóng (dan-ga-song.js và các part nó import) do shared.js dựng, lớp chỉ đọc shared.flock; kê ở đây vì đó là chuyển động
      // của đàn gà: Sổ tay của lớp hiện đủ code. lib/tsl/particles.js: bể hạt của thóc (cùng bể với đom đóm của Bức 1).
      files: [
        'paintings/dan-ga-me-con/layers/l5-dan-ga.js',
        'paintings/dan-ga-me-con/parts/dan-ga-thoc.js',
        'paintings/dan-ga-me-con/parts/dan-ga-song.js',
        'paintings/dan-ga-me-con/parts/dan-ga-pha.js',
        'paintings/dan-ga-me-con/parts/dan-ga-duong.js',
        'paintings/dan-ga-me-con/parts/dan-ga-cho.js',
        'paintings/dan-ga-me-con/parts/dan-ga-ke.js',
        'lib/tsl/particles.js',
      ],
    },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới. Không rào hen (chuỗi con của denThen, token của xưởng)
  // hay grain (núm của Phủ bóng); không rào tên kỹ thuật (ink, paper, outline, toon, cel, sobel, ortho): bức sau có thể cần rút chúng lên.
  fence: ['chick', 'poultry', 'rooster', 'gà mẹ', 'gà con', 'thóc', 'con ong', 'đông hồ', 'điệp', 'bản nét', 'bản màu', 'lá tre'],
};
