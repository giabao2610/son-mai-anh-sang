// paintings/den-keo-quan/content.vi.js — chữ tiếng Việt của Bức 2: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';
import cotDiagram from './diagrams/cot.svg?raw';
import ngonNenDiagram from './diagrams/ngon-nen.svg?raw';
import gianNhaDiagram from './diagrams/gian-nha.svg?raw';
import giayDiagram from './diagrams/giay.svg?raw';
import keoQuanDiagram from './diagrams/keo-quan.svg?raw';

/**
 * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm để thổi nến · vuốt để gạt đèn · giữ để dừng',
  layers: {
    cot: {
      understand: 'Cốt là gian nhà và chiếc đèn bằng đất sét, dưới một ngọn đèn xưởng trung tính: sàn, ba vách, trần, xà, hai cột, '
        + 'và chiếc đèn lục giác treo ở xà giữa. Trong đèn là trống hình nhân: một ống trụ hở, cắt hình theo một mặt nạ. Mặt nạ là '
        + 'một dải ảnh vẽ bằng code: mỗi hình nhân ghép từ vài hình cơ bản; mỗi điểm ảnh đo khoảng cách có dấu tới mép hình, nên mép '
        + 'mịn đúng một texel; chuỗi mip cũng tự tính, để hai backend ra cùng một ảnh. Mài hết các lớp thì bức trở về đây.',
      diagram: cotDiagram,
      learned: [
        'Hình khối của cả căn phòng chỉ là vài mặt phẳng, hộp và ống trụ tự sinh bằng code.',
        'Một dải mặt nạ cuộn quanh ống trụ: mỗi cột ảnh ứng với một góc quanh trục.',
        'Khoảng cách có dấu tới mép hình cho mép mịn mà không cần lấy mẫu dày.',
      ],
      readMore: [
        { title: 'three.js · CylinderGeometry', url: 'https://threejs.org/docs/#api/en/geometries/CylinderGeometry' },
        { title: 'Đèn kéo quân (Wikipedia tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/%C4%90%C3%A8n_k%C3%A9o_qu%C3%A2n' },
      ],
      knobs: { sides: 'Số cạnh của đèn', wireframe: 'Khung dây', figures: 'Số hình nhân' },
      experiments: {
        flatNormals: { label: 'Normal phẳng', explain: 'Mỗi tam giác sáng một màu: thấy rõ mọi hình được ghép từ mặt phẳng.' },
        solidDrum: {
          label: 'Trống không cắt',
          explain: 'Cả dải hình nhân thành giấy đặc: bóng trên vách thành một vành tối liền. Bóng là do những chỗ cắt.',
        },
      },
      readouts: { vertices: 'Số đỉnh', mask: 'Mặt nạ (texel)' },
      objects: {
        san: 'Sàn',
        vach: 'Ba vách',
        tran: 'Trần',
        xa: 'Xà ngang',
        'cot-go': 'Cột',
        giay: 'Giấy của đèn',
        'khung-tre': 'Nan tre',
        'de-chop': 'Đế và vành chóp',
        'cay-nen': 'Cây nến',
        'day-treo': 'Dây treo',
        tua: 'Tua',
        trong: 'Trống hình nhân',
        'chong-chong': 'Chong chóng',
      },
    },
    'ngon-nen': {
      understand: 'Ngọn nến là một đèn điểm thật đặt ở chỗ ngọn lửa. Ánh sáng của nó yếu đi theo bình phương khoảng cách: vách '
        + 'cách xa gấp đôi chỉ nhận một phần tư ánh sáng. Vì vậy căn phòng có chiều sâu, gần đèn thì sáng, góc xa thì tối. Ngọn lửa '
        + 'mà mắt thấy lại là chuyện khác: một hình tự phát sáng (emissive), không soi sáng gì cả, như hoa đăng của Bức 1. Lửa và đèn '
        + 'dùng chung vị trí và độ sáng, nên khi bạn thổi, lửa ngả và bóng trên vách chao cùng một nhịp.',
      diagram: ngonNenDiagram,
      learned: [
        'Đèn điểm chiếu sáng mọi bề mặt quanh nó, mạnh yếu theo luật nghịch đảo bình phương.',
        'Vật tự phát sáng chỉ sáng chính nó; muốn soi sáng căn phòng phải có đèn thật.',
      ],
      readMore: [
        { title: 'three.js · PointLight', url: 'https://threejs.org/docs/#api/en/lights/PointLight' },
        { title: 'Inverse-square law (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Inverse-square_law' },
      ],
      knobs: {
        intensity: 'Độ sáng của nến',
        flameSize: 'Cỡ ngọn lửa (m)',
        flicker: 'Nhấp nháy',
        warmth: 'Sắc nến (đỏ cam → vàng ngà)',
      },
      experiments: {
        noDecay: {
          label: 'Ánh sáng không suy giảm',
          explain: 'Bỏ luật nghịch đảo bình phương: vách xa sáng như vách gần, căn phòng mất chiều sâu.',
        },
        steady: {
          label: 'Tắt nhấp nháy',
          explain: 'Ngọn lửa đứng yên: ánh sáng và bóng trên vách thôi run. Chỉ một chút run nhỏ đã làm căn phòng như đang sống.',
        },
      },
      readouts: { backWall: 'Độ rọi ở vách sau', lean: 'Lửa lệch' },
      objects: { 'ngon-lua': 'Ngọn lửa' },
    },
    'gian-nha': {
      understand: 'Gian nhà sơn mọi bề mặt bằng texture thủ tục, không dùng ảnh nào. Lưới gạch bát lấy từ tọa độ sàn: phần nguyên '
        + '(floor) là số thứ tự viên, phần lẻ (fract) là vị trí trong viên, gần mép phần lẻ là mạch vữa; hash của số thứ tự cho mỗi '
        + 'viên một màu. Vôi loang và vân gỗ là noise cộng nhiều tầng (fbm); số tầng là một uniform, nên shader có vòng lặp thật và '
        + 'đổi số tầng không phải biên dịch lại. Hai cột sơn son có thêm một lớp phủ bóng (clearcoat) soi vệt sáng của ngọn đèn.',
      diagram: gianNhaDiagram,
      learned: [
        'Một hàm toán của tọa độ có thể thay cả một tấm ảnh texture: gạch, vôi, gỗ đều tính ngay khi tô.',
        'fract chia không gian thành ô; hash cho mỗi ô một số ngẫu nhiên cố định.',
        'fbm cộng nhiều tầng noise để có cả mảng lớn lẫn chi tiết nhỏ.',
      ],
      readMore: [
        { title: 'The Book of Shaders · Patterns', url: 'https://thebookofshaders.com/09/' },
        { title: 'The Book of Shaders · Noise', url: 'https://thebookofshaders.com/11/' },
      ],
      knobs: {
        tileSize: 'Cỡ viên gạch (m)',
        stain: 'Vôi loang',
        grain: 'Vân gỗ cong',
        clearcoat: 'Lớp phủ bóng của cột',
        octaves: 'Số tầng noise',
      },
      experiments: {
        flat: {
          label: 'Một màu cho tất cả',
          explain: 'Mọi bề mặt về một màu trung bình: thấy texture thủ tục làm được bao nhiêu cho căn phòng.',
        },
        rawTiles: {
          label: 'Xem lưới gạch',
          explain: 'Sàn hiện số thứ tự của từng viên (màu giả) và mạch vữa: lưới chỉ là phần nguyên và phần lẻ của tọa độ.',
        },
      },
      readouts: { octaves: 'Số tầng noise đang chạy' },
    },
    giay: {
      understand: 'Giấy sáng lên từ bên trong: shader tô mặt ngoài nhưng tính ánh nến chiếu vào mặt trong (theo pháp tuyến ngược '
        + 'lại), nhân với phần ánh sáng lọt qua bề dày của giấy. Ra khỏi đèn, ánh sáng mang màu tấm giấy nó vừa đi qua: với mỗi điểm '
        + 'trên vách, shader tìm tia từ ngọn lửa tới điểm đó ra khỏi đèn ở tấm nào, rồi nhuộm ánh sáng bằng màu tấm đó. Vì vậy trên '
        + 'vách có những mảng đỏ, vàng, xanh, chàm; còn ánh nến lên trần qua miệng đèn thì giữ nguyên màu.',
      diagram: giayDiagram,
      learned: [
        'Một mặt mỏng sáng lên nhờ ánh sáng đi xuyên qua nó: tính ở mặt trong, thấy ở mặt ngoài.',
        'Ánh sáng qua một lớp vật liệu yếu đi theo hàm mũ của bề dày.',
        'Lọc màu là nhân màu của tấm giấy vào ánh sáng của đèn.',
      ],
      readMore: [
        { title: 'Transparency and translucency (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Transparency_and_translucency' },
        { title: 'Định luật Beer–Lambert', url: 'https://vi.wikipedia.org/wiki/%C4%90%E1%BB%8Bnh_lu%E1%BA%ADt_Beer%E2%80%93Lambert' },
      ],
      knobs: { thickness: 'Độ dày của giấy', dye: 'Độ đậm của màu nhuộm', fiber: 'Sợi giấy' },
      experiments: {
        clear: {
          label: 'Giấy trong suốt',
          explain: 'Giấy gần như trong: thấy trống hình nhân quay bên trong và ngọn lửa. Bí mật của đèn lộ ra.',
        },
        noFiber: { label: 'Tắt sợi giấy', explain: 'Giấy phẳng lì như nhựa: chính những sợi dó làm ánh sáng trên giấy có hồn.' },
      },
      readouts: { transmit: 'Ánh sáng qua giấy' },
    },
    'keo-quan': {
      understand: 'Kéo quân là bóng của đoàn quân trên trống, chiếu lên vách. Không có shadow map nào: với mỗi điểm đang tô, shader '
        + 'dựng tia từ ngọn lửa tới điểm đó, tìm chỗ tia cắt ống trụ của trống, đổi chỗ cắt ra góc bằng atan(y, x) rồi tra mặt nạ hình '
        + 'nhân ở góc ấy. Kết quả là node bóng của chính đèn nến: không thêm lượt vẽ nào. Ngọn lửa có kích thước nên bóng có nửa tối, '
        + 'và vùng nửa tối rộng dần theo khoảng cách: gần đèn thì nét, trên vách xa thì nhòe.',
      diagram: keoQuanDiagram,
      learned: [
        'Một bóng chiếu đúng hình có thể tính thẳng bằng hình học (gobo), không cần vẽ thêm lượt nào.',
        'atan(y, x) đổi một điểm ra góc quanh trục, để tra một ảnh cuộn quanh ống trụ.',
        'Nguồn sáng có kích thước cho nửa tối, rộng theo khoảng cách từ vật che tới chỗ hứng bóng.',
      ],
      readMore: [
        { title: 'Gobo (lighting)', url: 'https://en.wikipedia.org/wiki/Gobo_(lighting)' },
        { title: 'Umbra, penumbra and antumbra (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Umbra,_penumbra_and_antumbra' },
        { title: 'three.js · LightShadow', url: 'https://threejs.org/docs/#api/en/lights/shadows/LightShadow' },
      ],
      knobs: { speed: 'Tốc độ quay (vòng/phút)', penumbra: 'Độ nhòe của bóng', strength: 'Độ đậm của bóng' },
      readouts: { rpm: 'Vòng mỗi phút', magnify: 'Bóng phóng to ở vách sau', penumbra: 'Nửa tối ở vách sau' },
      experiments: {
        pointLight: {
          label: 'Nguồn sáng là một điểm',
          explain: 'Ngọn lửa coi như không có kích thước: mép bóng gắt ở mọi khoảng cách, không còn nửa tối.',
        },
        shadowMap: {
          label: 'Shadow map thật',
          explain: 'Cách thường làm: một đèn thứ hai vẽ cảnh từ chỗ ngọn lửa ra sáu mặt của một khối lập phương (cube shadow map). '
            + 'Mỗi khung thêm sáu lượt vẽ bóng, vì trống quay nên không vẽ một lần rồi giữ được; so ms ở hai cột Tắt và Bật. Mép bóng '
            + 'cứng như nhau ở mọi khoảng cách (không có nửa tối theo cỡ lửa) và lộ răng cưa theo cỡ map; ánh sáng cũng mất màu giấy. '
            + 'Lần bật đầu cảnh khựng một nhịp vì mọi material phải biên dịch lại.',
        },
        naive: {
          label: 'Công thức gọn',
          explain: 'Lấy góc của chính điểm trên vách thay cho giao tia: đúng khi lửa đứng yên trên trục, nhưng thổi nến thì bóng thôi chao.',
        },
      },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
