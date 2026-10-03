// paintings/ao-sen-dem/content.captions.vi.js — thơ của hoa đăng (chữ đi theo vật): mỗi mục một cặp câu và nguồn; content.vi.js gộp vào captions.

/**
 * Mười hai cặp câu, đều là ca dao hay thơ cổ điển đã hết bản quyền (spec §5). Ca dao thì source là 'Ca dao'; thơ có tác giả
 * thì source là tên bài, author là nhà thơ. Mỗi lần thả hoa đăng hiện một cặp, theo thứ tự shared.js xáo theo đêm.
 * Code của bức chỉ cầm KHÓA (kebab-case không dấu); mỗi dòng tối đa 60 ký tự để vừa một hàng trên điện thoại (test hợp đồng giữ).
 * File không import gì, nên e2e (Node của Playwright) import thẳng được để đoán câu sẽ hiện.
 * @type {Record<string, import('../../engine/contracts/painting.js').Poem>}
 */
export default {
  'den-khoe': { lines: ['Đèn khoe đèn tỏ hơn trăng', 'Đèn ra trước gió còn chăng, hỡi đèn?'], source: 'Ca dao' },
  'trang-khoe': { lines: ['Trăng khoe trăng tỏ hơn đèn', 'Cớ sao trăng phải chịu luồn đám mây?'], source: 'Ca dao' },
  'thuyen-ve': { lines: ['Thuyền về có nhớ bến chăng?', 'Bến thì một dạ khăng khăng đợi thuyền'], source: 'Ca dao' },
  'gio-dua': { lines: ['Gió đưa cành trúc la đà', 'Tiếng chuông Trấn Vũ, canh gà Thọ Xương'], source: 'Ca dao' },
  'mit-mu': { lines: ['Mịt mù khói tỏa ngàn sương', 'Nhịp chày Yên Thái, mặt gương Tây Hồ'], source: 'Ca dao' },
  'trang-bao-nhieu': { lines: ['Trăng bao nhiêu tuổi trăng già', 'Núi bao nhiêu tuổi gọi là núi non'], source: 'Ca dao' },
  'thach-luu': { lines: ['Thạch lựu hiên còn phun thức đỏ', 'Hồng liên trì đã tiễn mùi hương'], source: 'Bảo kính cảnh giới', author: 'Nguyễn Trãi' },
  'chen-ruou': { lines: ['Chén rượu hương đưa say lại tỉnh', 'Vầng trăng bóng xế khuyết chưa tròn'], source: 'Tự tình II', author: 'Hồ Xuân Hương' },
  'guong-nga': { lines: ['Gương nga chênh chếch dòm song', 'Vàng gieo ngấn nước, cây lồng bóng sân'], source: 'Truyện Kiều', author: 'Nguyễn Du' },
  'ao-thu': { lines: ['Ao thu lạnh lẽo nước trong veo', 'Một chiếc thuyền câu bé tẻo teo'], source: 'Thu điếu', author: 'Nguyễn Khuyến' },
  'lung-giau': { lines: ['Lưng giậu phất phơ màu khói nhạt', 'Làn ao lóng lánh bóng trăng loe'], source: 'Thu ẩm', author: 'Nguyễn Khuyến' },
  'nuoc-biec': { lines: ['Nước biếc trông như tầng khói phủ', 'Song thưa để mặc bóng trăng vào'], source: 'Thu vịnh', author: 'Nguyễn Khuyến' },
};
