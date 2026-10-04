// paintings/den-keo-quan/content.vi.js — chữ tiếng Việt của Bức 2: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';

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
        + 'và chiếc đèn lục giác treo ở xà giữa. Mọi lớp sau đều sơn lên những hình khối này; mài hết các lớp thì bức trở về đây.',
      learned: ['Hình khối của cả căn phòng chỉ là vài mặt phẳng, hộp và ống trụ tự sinh bằng code.'],
      readMore: [{ title: 'three.js · CylinderGeometry', url: 'https://threejs.org/docs/#api/en/geometries/CylinderGeometry' }],
      knobs: { sides: 'Số cạnh của đèn', wireframe: 'Khung dây' },
      experiments: {
        flatNormals: { label: 'Normal phẳng', explain: 'Mỗi tam giác sáng một màu: thấy rõ mọi hình được ghép từ mặt phẳng.' },
        solidDrum: {
          label: 'Trống không cắt',
          explain: 'Cả dải hình nhân thành giấy đặc: bóng trên vách thành một vành tối liền. Bóng là do những chỗ cắt.',
        },
      },
      readouts: { vertices: 'Số đỉnh' },
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
        trong: 'Trống hình nhân',
        'chong-chong': 'Chong chóng',
      },
    },
    'ngon-nen': {
      understand: 'Ngọn nến là một đèn điểm thật đặt ở chỗ ngọn lửa. Ánh sáng của nó yếu đi theo bình phương khoảng cách: vách '
        + 'cách xa gấp đôi chỉ nhận một phần tư ánh sáng. Vì vậy căn phòng có chiều sâu, gần đèn thì sáng, góc xa thì tối.',
      learned: ['Đèn điểm thật chiếu sáng mọi bề mặt quanh nó, mạnh yếu theo luật nghịch đảo bình phương.'],
      readMore: [{ title: 'three.js · PointLight', url: 'https://threejs.org/docs/#api/en/lights/PointLight' }],
      knobs: { intensity: 'Độ sáng của nến' },
      experiments: {
        noDecay: {
          label: 'Ánh sáng không suy giảm',
          explain: 'Bỏ luật nghịch đảo bình phương: vách xa sáng như vách gần, căn phòng mất chiều sâu.',
        },
      },
      readouts: { backWall: 'Độ rọi ở vách sau' },
    },
    'keo-quan': {
      understand: 'Kéo quân là bóng của đoàn quân trên trống, chiếu lên vách. Không có shadow map nào: với mỗi điểm đang tô, shader '
        + 'dựng tia từ ngọn lửa tới điểm đó, tìm chỗ tia cắt ống trụ của trống, đổi chỗ cắt ra góc bằng atan(y, x) rồi tra mặt nạ hình '
        + 'nhân ở góc ấy. Nguồn sáng có kích thước nên bóng có nửa tối: gần đèn thì nét, trên vách xa thì nhòe.',
      learned: ['Một bóng chiếu đúng hình có thể tính thẳng bằng hình học (gobo), không cần vẽ thêm lượt nào.'],
      readMore: [{ title: 'Gobo (lighting)', url: 'https://en.wikipedia.org/wiki/Gobo_(lighting)' }],
      knobs: { speed: 'Tốc độ quay (vòng/phút)', penumbra: 'Độ nhòe của bóng', strength: 'Độ đậm của bóng' },
      experiments: {
        pointLight: {
          label: 'Nguồn sáng là một điểm',
          explain: 'Ngọn lửa coi như không có kích thước: mép bóng gắt ở mọi khoảng cách, không còn nửa tối.',
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
