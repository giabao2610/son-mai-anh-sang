// paintings/dan-ga-me-con/content.vi.js — chữ tiếng Việt của Bức 4: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay, kèm năm sơ đồ.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';
import trucGiaoDiagram from './diagrams/truc-giao.svg?raw';
import chiaNacDiagram from './diagrams/chia-nac.svg?raw';
import lechMatPhangDiagram from './diagrams/lech-mat-phang.svg?raw';
import hatDiepDiagram from './diagrams/hat-diep.svg?raw';
import vongDemDiagram from './diagrams/vong-dem.svg?raw';

/**
 * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tap, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này; số nêu trong đoạn Hiểu
 * khớp với code (tests/paintings/dan-ga-me-con/chu.test.js).
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm để rắc thóc · giữ để gà mẹ gọi con · kéo để bước vào tranh',
  layers: {
    cot: {
      understand: 'Cốt là tờ tranh bằng đất sét: một tờ giấy cong như phông chụp ảnh, phẳng ở phía trước rồi uốn lên thành vách; gà '
        + 'mẹ đứng giữa, mười gà con quây quần. Điều mới ở đây là camera trực giao. Mắt người và camera phối cảnh nhìn theo những tia hội '
        + 'tụ về một điểm, nên vật ở xa nhỏ đi. Camera trực giao nhìn theo những tia song song: gà con ở xa to bằng con ở gần, chỉ nằm '
        + 'cao hơn trong khung (camera nhìn chếch xuống 20°), đúng lối vẽ của tranh dân gian. Cái giá là mất chiều sâu: nhìn thẳng thì '
        + 'tượng tròn và tấm bìa phẳng cho gần như cùng một ảnh (thử "Tấm bìa phẳng"). Kéo xoay mới thấy gà là khối tròn; buông tay ba '
        + 'giây thì tranh tự khép lại. Mài hết các lớp thì bức trở về đây.',
      diagram: trucGiaoDiagram,
      learned: [
        'Camera trực giao chiếu theo các tia song song: không có điểm tụ, nên cỡ của vật không đổi theo khoảng cách.',
        'Phép chiếu trực giao bỏ hẳn chiều theo hướng nhìn: nhìn thẳng, tượng tròn và tấm bìa phẳng cho gần như cùng một ảnh; phải xoay '
          + 'mới biết vật dày bao nhiêu.',
        'Phóng to camera trực giao là đổi zoom (thu nhỏ khung nhìn), không phải đưa camera lại gần: gần hay xa, ảnh vẫn như nhau.',
        'InstancedMesh vẽ mười gà con bằng một lần vẽ; mỗi con chỉ khác nhau ở vài thuộc tính (chỗ đứng, hướng, góc cúi đầu, màu).',
      ],
      readMore: [
        { title: 'three.js · OrthographicCamera', url: 'https://threejs.org/docs/#api/en/cameras/OrthographicCamera' },
        { title: 'Orthographic projection · phép chiếu trực giao (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Orthographic_projection' },
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
      understand: 'Tranh Đông Hồ in bằng nhiều ván khắc, mỗi ván một màu tự nhiên: trắng từ vỏ điệp, vàng từ hoa hòe, đỏ từ sỏi son, '
        + 'xanh từ lá chàm, đen từ than lá tre. Ở đây mỗi phần của con gà (mình, cánh, đuôi, mào, mỏ, chân) lấy màu trong bảng năm màu '
        + 'ấy; mỗi gà con một màu lông, có con để trắng màu giấy. Ánh sáng thì chia nấc: vẫn phép tính Lambert như trên đất sét (pháp '
        + 'tuyến nhân hướng nắng), chỉ làm tròn xuống thành vài nấc phẳng. Mặc định có hai nấc, nấc tối chỉ đậm hơn 18%, nên nhìn thẳng '
        + 'thì gà phẳng như bản in, xoay đi mới thấy khối. Bật "Tô mịn" để so: chia nấc gần như không tốn thêm gì.',
      diagram: chiaNacDiagram,
      learned: [
        'Chia nấc (cel shading): lấy độ sáng Lambert rồi làm tròn xuống thành vài bậc, thay cho độ sáng đổi liền.',
        'fwidth(x) cho biết x đổi bao nhiêu giữa hai điểm ảnh kề nhau: làm mềm mép nấc ít nhất chừng đó thì hết răng cưa ở mọi mức zoom.',
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
      understand: 'Bản nét là ván in nét đen, in sau cùng. Viền không vẽ sẵn: cảnh vẽ xong, mỗi điểm ảnh đọc ảnh độ sâu ở hai bên nó, '
        + 'theo bốn hướng. Trên một mặt phẳng, dù nghiêng tới đâu, độ sâu hai bên cộng lại đúng bằng hai lần độ sâu ở giữa. Lệch hẳn khỏi '
        + 'mặt phẳng là có bậc: mép của một vật đứng trước vật khác, và điểm ảnh ấy thành mực. Nhờ vậy mặt sàn nghiêng không bị bôi đen, '
        + 'còn mép tờ giấy tự có khung. Nếp gấp, như chỗ đầu nối mình, đo riêng bằng góc gãy của mặt. Nét trong (vảy lông, mắt, cánh) vẽ '
        + 'ngay trên vật. Như tranh in tay, mực không đều, và viền in lệch một chút so với màu.',
      diagram: lechMatPhangDiagram,
      learned: [
        'Độ lệch khỏi mặt phẳng, D(+) + D(−) − 2·D(giữa), là đạo hàm bậc hai rời rạc (Laplace theo từng hướng): bằng 0 trên mọi mặt '
          + 'phẳng, gần bằng độ cao của bậc ở mép vật. Nếp gấp thì đo bằng góc gãy.',
        'Mẫu độ sâu phải nằm đúng tâm điểm ảnh, cách nhau số nguyên điểm ảnh: lệch nửa điểm ảnh là hai bên không còn đối xứng, và mặt sàn '
          + 'nghiêng thành sọc mực. Vì vậy độ dày nét và lệch bản chỉ nhận số nguyên.',
        'Nét trong là hàm khoảng cách trên UV của từng phần: điểm nào đủ gần đường nét thì thành mực, nên nét đi theo vật và to ra khi '
          + 'phóng to.',
        'Dò cạnh trên ảnh màu (Sobel) chỉ thấy ranh màu: hai mảng cùng màu chồng nhau thì mất nét, còn ảnh độ sâu thì vẫn thấy.',
      ],
      readMore: [
        { title: 'Discrete Laplace operator · toán tử Laplace rời rạc (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Discrete_Laplace_operator' },
        { title: 'Sobel operator · dò cạnh Sobel (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Sobel_operator' },
        { title: 'Roystan · Outline shader', url: 'https://roystan.net/articles/outline-shader/' },
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
    'giay-diep': {
      understand: 'Giấy điệp là giấy dó quét một lớp bột vỏ sò điệp, nền quen thuộc của tranh Đông Hồ. Ở đây tờ giấy có màu ngà, thớ sợi dó '
        + 'chạy dọc và vệt chổi quét điệp chạy xiên. Phần đáng xem là hạt điệp: mặt giấy chia thành ô nhỏ, mỗi ô có một mảnh vỏ sò '
        + 'nghiêng ngẫu nhiên, như một tấm gương bé xíu. Mảnh chỉ lóe khi tia nắng phản xạ trên nó đi đúng vào mắt người xem. Camera '
        + 'trực giao nhìn mọi điểm theo cùng một hướng, nên khắp tờ giấy chỉ những mảnh quay mặt về đúng một hướng mới lóe. Kéo xoay là '
        + 'đổi hướng ấy cho cả tờ giấy cùng lúc: hạt này tắt, hạt khác lóe. Chỗ lóe sáng gấp nhiều lần giấy, để tone mapping không nén '
        + 'mất. Nó là emissive, nên Phủ bóng làm nó tỏa.',
      diagram: hatDiepDiagram,
      learned: [
        'Phản xạ gương: reflect(−nắng, pháp tuyến) cho hướng tia ra. Hạt lóe khi hướng ấy trùng hướng nhìn; số mũ càng lớn thì càng phải '
          + 'trùng đúng mới lóe.',
        'Hạt nghiêng trong mặt phẳng của tờ giấy (theo hai trục tiếp tuyến), chứ không theo trục của thế giới: vách đứng cần nghiêng lên '
          + 'xuống mới bắt được tia nắng ở góc nhìn của tranh.',
        'Hạt ngẫu nhiên mà tất định: băm số của ô (hash) cho chỗ đứng và độ nghiêng của hạt, nên cùng một khung luôn ra cùng một ảnh.',
        'Tone mapping nén vùng sáng: một chấm chỉ sáng gấp đôi giấy thì gần như mất hút. Phần phát sáng trên nền sáng phải có độ sáng HDR '
          + 'cỡ hàng chục.',
      ],
      readMore: [
        { title: 'Specular reflection · phản xạ gương (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Specular_reflection' },
        { title: 'Giấy dó (Wikipedia tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/Gi%E1%BA%A5y_d%C3%B3' },
      ],
      knobs: {
        sparkle: 'Độ sáng của hạt điệp',
        density: 'Mật độ hạt (ô mỗi 10 cm)',
        fiber: 'Độ đậm của sợi dó',
        brush: 'Độ dày của vệt chổi điệp',
      },
      experiments: {
        giayTron: {
          label: 'Giấy dó trơn',
          explain: 'Bỏ lớp điệp: tờ giấy chỉ còn nền dó và sợi dó, phẳng và sẫm hơn một chút. Mất vệt chổi sáng chạy xiên, và mất cả hạt '
            + 'lóe: kéo xoay thì giấy trơn không lấp lánh, mọi ánh lóe của tranh đều đến từ lớp điệp.',
        },
      },
    },
    'dan-ga': {
      understand: 'Đàn gà là phần chuyển động của tờ tranh. Thóc tính trên GPU: mỗi hạt là một luồng, mỗi khung chạy cùng một luật '
        + '(rơi, nảy, lăn rồi nằm yên) và chỉ đọc, ghi hạt của chính nó. Các hạt nằm trong một vòng đệm cấp sẵn một lần: mỗi nắm rắc ra '
        + 'khởi tạo lại một đoạn liền của vòng, đè lên những hạt cũ nhất ("Tô theo luồng"). Mỏ của mười gà con đến với hạt qua uniform: mỏ '
        + 'đang mổ cách hạt dưới 2 cm thì hạt biến mất. Gà mẹ, gà con thì không mô phỏng: chỗ đứng, hướng, độ cúi đầu tính thẳng từ thời '
        + 'gian và các mốc chạm, giữ, thả, bới, nên dừng hình ở khung nào cũng ra đúng khung ấy. Mài lớp này thì thóc biến mất, gà đứng '
        + 'yên như tượng, và chạm, giữ không làm gì.',
      diagram: vongDemDiagram,
      learned: [
        'Compute chạy một luồng cho mỗi hạt, cùng một luật trên dữ liệu của riêng nó: hàng nghìn hạt tính song song cùng lúc.',
        'Vòng đệm: bể hạt cấp phát một lần theo trần; rắc thêm chỉ khởi tạo lại một đoạn liền rồi con trỏ đi tiếp, nên nắm mới đè lên hạt '
          + 'cũ nhất; đổi số lượng chỉ đổi count.',
        'Hạt không đọc được hạt khác, nhưng đọc được uniform: mảng mười mỏ mà JS ghi mỗi khung là đường đi từ đàn gà tới thóc.',
        'Dạng đóng: vị trí là một hàm của thời gian và các mốc, không cộng dồn từng khung, nên dừng hình ở khung nào cũng ra đúng khung ấy.',
      ],
      readMore: [
        { title: 'Ví dụ three.js: hạt tính bằng compute (WebGPU)', url: 'https://threejs.org/examples/#webgpu_compute_particles' },
        { title: 'Circular buffer · vòng đệm (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Circular_buffer' },
      ],
      knobs: {
        handful: 'Số hạt mỗi nắm',
        bounce: 'Độ nảy',
        gravity: { label: 'Trọng lực', options: { traiDat: 'Trái Đất (9,81 m/s²)', trang: 'Trăng (1,62 m/s²)' } },
        count: 'Số hạt tối đa',
      },
      experiments: {
        toTheoLuong: {
          label: 'Tô theo luồng',
          explain: 'Mỗi hạt tô một màu theo số của luồng GPU giữ nó. Hai luồng kề nhau lệch nhau một góc vàng (chừng 137,5°) trên vòng '
            + 'màu, nên hạt nào cũng khác hẳn màu hạt ở luồng kề bên. Hạt giữ nguyên màu từ lúc văng ra tới lúc nằm yên: suốt đời nó chỉ '
            + 'một luồng tính nó. Hạ "Số hạt tối đa" rồi rắc liền tay: hết vòng đệm, nắm mới lấy lại luồng của những hạt cũ nhất, và '
            + 'hạt ở nắm cũ biến mất.',
        },
      },
      readouts: { rac: 'Số hạt đã rắc', dangAn: 'Gà con đang mổ', quanhMe: 'Gà con quanh mẹ' },
      objects: { thoc: 'Thóc' },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
