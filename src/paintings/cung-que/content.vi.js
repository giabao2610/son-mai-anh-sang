// paintings/cung-que/content.vi.js — chữ tiếng Việt của Bức 3: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';

/**
 * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm vào tán đa · giữ để cây bay lên · kéo để xoay',
  layers: {
    cot: {
      understand: 'Cốt là cả thế giới bằng đất sét: một hành tinh nhỏ có hố, cây đa ở đỉnh. Ở đây không có một tam giác nào. Thế giới '
        + 'là một hàm khoảng cách: đưa vào một điểm, hàm trả về khoảng cách tới bề mặt gần nhất. Một quả cầu bao quanh mọi thứ; mỗi '
        + 'điểm ảnh của nó dò tia vào trong, mỗi bước tiến đúng bằng khoảng cách hàm cho, tới khi chạm mặt. Mài hết các lớp thì bức '
        + 'trở về đây.',
      learned: [
        'Một hàm khoảng cách có dấu (SDF) tả được cả một thế giới mà không cần lưới tam giác.',
        'Dò tia (sphere tracing): mỗi bước tiến đúng bằng khoảng cách tới mặt gần nhất, nên không bao giờ đi xuyên qua mặt.',
        'Hòa mềm (smooth union) làm hai hình liền nhau như đất nặn.',
      ],
      readMore: [
        { title: 'Inigo Quilez · distance functions', url: 'https://iquilezles.org/articles/distfunctions/' },
        { title: 'Inigo Quilez · smooth minimum', url: 'https://iquilezles.org/articles/smin/' },
      ],
      knobs: { steps: 'Số bước dò tối đa', smooth: 'Độ hòa khối' },
      experiments: {
        soBuoc: {
          label: 'Tô theo số bước',
          explain: 'Mỗi điểm ảnh tô theo số bước nó đã dò: mép hình, nơi tia đi sát mặt, sáng rực. Đó là chỗ shader làm việc nhiều nhất.',
        },
        khoiBao: {
          label: 'Hiện khối bao',
          explain: 'Chỗ tia trượt mọi hình được tô mờ thay vì bỏ đi: hiện ra quả cầu chứa cả thế giới. Ngoài quả cầu, không điểm ảnh nào phải dò.',
        },
        hoaCung: {
          label: 'Hòa khối cứng',
          explain: 'Hòa mềm thành ghép cứng: lộ đường nối giữa rễ và đất, giữa các khối của tán.',
        },
      },
      readouts: { bay: 'Cây bay lên', buoc: 'Bước dò tối đa', hinh: 'Số hình SDF' },
      objects: { 'khoi-bao': 'Khối bao (cả thế giới SDF)' },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
