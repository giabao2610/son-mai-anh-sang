// paintings/dan-ga-me-con/content.vi.js — chữ tiếng Việt của Bức 4: gợi ý tương tác; Hiểu/Chỉnh của từng lớp trong Sổ tay (bản khung, Task 10 viết đủ và thêm sơ đồ).
import phuBong from '../../engine/stock/phu-bong/content.vi.js';

/**
 * Mọi nhãn tra theo id (lớp, núm, tap, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm để rắc thóc · giữ để gà mẹ gọi con · kéo để bước vào tranh',
  layers: {
    cot: {
      understand: 'Cốt là tờ tranh bằng đất sét: một tờ giấy cong như phông chụp ảnh, nằm phẳng ở phía trước rồi uốn lên thành vách, '
        + 'gà mẹ đứng giữa, mười gà con quây quần. Camera ở đây là camera trực giao: không có điểm tụ, vật ở xa không nhỏ đi mà chỉ '
        + 'nằm cao hơn trong khung, đúng lối vẽ của tranh dân gian. Kéo xoay thì thấy tờ giấy cong và gà là khối tròn. Mài hết các '
        + 'lớp thì bức trở về đây.',
      learned: [
        'Camera trực giao chiếu mọi điểm theo cùng một hướng: không có điểm tụ, nên cỡ của vật không đổi theo khoảng cách.',
        'Phóng to camera trực giao là đổi zoom (thu nhỏ khung nhìn), không phải đưa camera lại gần.',
        'InstancedMesh vẽ mười gà con bằng một lần vẽ; mỗi con chỉ khác nhau ở vài thuộc tính (chỗ đứng, hướng, màu).',
      ],
      readMore: [
        { title: 'three.js · OrthographicCamera', url: 'https://threejs.org/docs/#api/en/cameras/OrthographicCamera' },
        { title: 'Phép chiếu trực giao (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Orthographic_projection' },
        { title: 'Tranh Đông Hồ (Wikipedia tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/Tranh_%C4%90%C3%B4ng_H%E1%BB%93' },
      ],
      knobs: { segments: 'Độ mịn của khối', wireframe: 'Chỉ vẽ khung dây' },
      objects: { giay: 'Tờ giấy', 'ga-me': 'Gà mẹ', 'ga-con': 'Mười gà con' },
    },
    'ban-net': {
      understand: 'Bản nét là nét mực đen in sau cùng, như ván khắc nét của tranh Đông Hồ. Không nét nào được vẽ sẵn: cảnh vẽ xong thì '
        + 'mỗi điểm ảnh đọc ảnh độ sâu ở tám điểm quanh nó. Trên một mặt phẳng, độ sâu hai bên cộng lại bằng hai lần độ sâu ở giữa, '
        + 'dù mặt nghiêng tới đâu; lệch hẳn là có mép vật hay nếp gấp, và điểm ảnh ấy thành mực. Với camera trực giao, ảnh độ sâu đã '
        + 'tuyến tính nên đọc thẳng được, không tốn thêm lượt vẽ nào.',
      learned: [
        'Dò cạnh là một bước hậu kỳ: đọc ảnh độ sâu ở các điểm lân cận, không cần biết vật nào là vật nào.',
        'Độ lệch khỏi mặt phẳng (đạo hàm bậc hai) bằng 0 trên mọi mặt phẳng, nên mặt sàn nghiêng không thành nét.',
        'Mép tờ giấy cũng là một bậc độ sâu (giấy đứng trước khoảng trống), nên khung tranh tự có nét.',
      ],
      readMore: [
        { title: 'Roystan · Outline shader', url: 'https://roystan.net/articles/outline-shader/' },
        { title: 'Dò cạnh (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Edge_detection' },
      ],
      knobs: { lineWidth: 'Độ dày nét (điểm ảnh)', threshold: 'Bậc độ sâu thành viền', crease: 'Độ đậm của nét nếp gấp' },
      taps: { 'truoc-net': 'Trước khi in bản nét' },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
