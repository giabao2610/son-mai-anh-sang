// paintings/dan-ga-me-con/content.vi.js — chữ tiếng Việt của Bức 4: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay (Task 10 viết đủ và thêm sơ đồ).
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
        'InstancedMesh vẽ mười gà con bằng một lần vẽ; mỗi con chỉ khác nhau ở vài thuộc tính (chỗ đứng, hướng, góc cúi đầu, màu).',
        'positionNode dời đỉnh ngay trong shader: đầu gà con cúi, cánh mẹ xòe chỉ nhờ một thuộc tính hay một uniform; gán cả normalLocal thì '
          + 'pháp tuyến xoay theo, nên ánh sáng vẫn đúng.',
      ],
      readMore: [
        { title: 'three.js · OrthographicCamera', url: 'https://threejs.org/docs/#api/en/cameras/OrthographicCamera' },
        { title: 'Phép chiếu trực giao (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Orthographic_projection' },
        { title: 'Tranh Đông Hồ (Wikipedia tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/Tranh_%C4%90%C3%B4ng_H%E1%BB%93' },
      ],
      knobs: { segments: 'Độ mịn của khối', wireframe: 'Chỉ vẽ khung dây' },
      experiments: {
        biaPhang: {
          label: 'Tấm bìa phẳng',
          explain: 'Dẹt từng con gà theo hướng nhìn của tranh, còn 5% bề dày. Ở góc của tranh, ảnh gần như không đổi: camera trực giao '
            + 'bỏ hẳn chiều theo hướng nhìn, nên nhìn thẳng không phân biệt được tượng tròn với tấm bìa. Kéo xoay mới thấy gà chỉ là '
            + 'tấm bìa. Pháp tuyến giữ nguyên, nên nấc sáng không đổi.',
        },
      },
      readouts: { goc: 'Lệch khỏi góc của tranh' },
      objects: { giay: 'Tờ giấy', 'ga-me': 'Gà mẹ', 'ga-con': 'Mười gà con' },
    },
    'ban-mau': {
      understand: 'Bản màu là các lần in màu của tranh Đông Hồ: mỗi màu một ván khắc, in lần lượt lên giấy, rồi bản nét đen in sau '
        + 'cùng. Ở đây mỗi phần của con gà (mình, cánh, đuôi, mào, mỏ, chân) tra màu trong bảng năm màu tự nhiên, và mỗi gà con một '
        + 'màu riêng; có con để trắng, chỉ có nét. Ánh sáng không đổi liền như trên đất sét: độ sáng (pháp tuyến nhân hướng nắng) làm '
        + 'tròn xuống thành vài nấc phẳng, gọi là chia nấc. Mép nấc mềm vừa đúng một điểm ảnh nhờ fwidth, nên không răng cưa. Nấc tối '
        + 'chỉ đậm hơn một chút: nhìn thẳng thì gà phẳng như bản in, xoay đi mới thấy khối.',
      learned: [
        'Chia nấc (cel shading): lấy độ sáng Lambert rồi làm tròn xuống thành vài bậc, thay cho độ sáng đổi liền.',
        'fwidth(x) cho biết x đổi bao nhiêu giữa hai điểm ảnh kề nhau: làm mềm mép bậc đúng chừng đó thì hết răng cưa ở mọi mức zoom.',
        'Bảng màu là mảng uniform (uniformArray) tra theo chỉ số: mười gà con dùng chung một material mà mỗi con, mỗi phần một màu.',
      ],
      readMore: [
        { title: 'Cel shading (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Cel_shading' },
        { title: 'Roystan · Toon shader', url: 'https://roystan.net/articles/toon-shader/' },
      ],
      knobs: { bands: 'Số nấc sáng', edge: 'Độ mềm của mép nấc', shade: 'Độ đậm của nấc tối' },
      experiments: {
        toMin: {
          label: 'Tô mịn',
          explain: 'Ánh sáng liền (Lambert) thay cho chia nấc: gà thành tượng đất tô màu, mất vẻ bản in. Hai cột Tắt / Bật cho thấy chia '
            + 'nấc gần như không tốn thêm gì: chỉ vài phép tính trên cùng một độ sáng.',
        },
      },
    },
    'ban-net': {
      understand: 'Bản nét là nét mực đen in sau cùng, như ván khắc nét của tranh Đông Hồ. Viền không vẽ sẵn: cảnh vẽ xong, mỗi điểm '
        + 'ảnh đọc ảnh độ sâu ở tám điểm quanh nó. Trên một mặt phẳng, độ sâu hai bên cộng lại bằng hai lần độ sâu ở giữa, dù mặt '
        + 'nghiêng tới đâu; lệch hẳn là có mép vật, và điểm ảnh ấy thành mực. Nếp gấp, như chỗ đầu nối mình, đo bằng góc gãy của mặt. '
        + 'Nét trong (vảy lông, mắt, cánh, đuôi, vằn ong) thì vẽ ngay trên vật, bằng hàm khoảng cách trên UV của từng phần. Mực không '
        + 'đều như mực quét trên ván, và bản nét in lệch một chút so với bản màu, như tranh in tay. Với camera trực giao, ảnh độ sâu đã '
        + 'tuyến tính nên đọc thẳng được, không tốn thêm lượt vẽ nào.',
      learned: [
        'Dò cạnh là một bước hậu kỳ: đọc ảnh độ sâu ở các điểm lân cận, không cần biết vật nào là vật nào; mép tờ giấy cũng là một bậc '
          + 'độ sâu, nên khung tranh tự có nét.',
        'Độ lệch khỏi mặt phẳng (đạo hàm bậc hai) bằng 0 trên mọi mặt phẳng, nên mặt sàn nghiêng không thành nét; nếp gấp thì đo bằng góc '
          + 'gãy của mặt.',
        'Nét trong là hàm khoảng cách trên UV của từng phần: điểm nào cách đường nét dưới nửa bề dày thì thành mực, nên nét đi theo vật '
          + 'và to ra khi phóng to.',
        'Dò cạnh trên ảnh màu (Sobel) chỉ thấy ranh màu: hai mảng cùng màu chồng nhau thì mất nét, còn ảnh độ sâu thì vẫn thấy.',
      ],
      readMore: [
        { title: 'Roystan · Outline shader', url: 'https://roystan.net/articles/outline-shader/' },
        { title: 'Dò cạnh (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Edge_detection' },
      ],
      knobs: {
        lineWidth: 'Độ dày nét (điểm ảnh)',
        threshold: 'Bậc độ sâu thành viền',
        crease: 'Độ đậm của nét nếp gấp',
        misregister: 'Lệch bản (điểm ảnh)',
      },
      experiments: {
        chiNet: {
          label: 'Chỉ bản nét',
          explain: 'Màu in thành trắng giấy, chỉ còn nét đen, như bản nét in thử riêng trước khi in màu. Thấy rõ đâu là viền dò trên ảnh '
            + 'độ sâu (quanh mọi vật, ở chỗ đầu nối mình), đâu là nét trong vẽ ngay trên vật (vảy lông, mắt, cánh, đuôi).',
        },
        netTheoMau: {
          label: 'Dò cạnh theo màu',
          explain: 'Dò cạnh trên độ sáng của ảnh màu (Sobel) thay cho ảnh độ sâu. Nét mọc ở ranh của nấc sáng và hai bên nét trong; còn '
            + 'chỗ hai mảng cùng màu chồng nhau, như đầu gà mẹ trước mình cùng màu vàng hòe, thì mất nét: ảnh màu không biết vật nào ở trước.',
        },
      },
      taps: { 'truoc-net': 'Trước khi in bản nét' },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
