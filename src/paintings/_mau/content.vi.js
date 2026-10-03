// paintings/_mau/content.vi.js — chữ tiếng Việt của tranh mẫu: gợi ý, và Hiểu/Chỉnh/Phá của hai lớp.

/** @type {import('../../engine/contracts/painting.js').PaintingContent} */
export default {
  hint: 'Kéo để xoay quanh nút thắt',
  layers: {
    cot: {
      understand: 'Cốt là hình khối bằng đất sét, dưới một ngọn đèn xưởng trung tính. Mọi bức đều bắt đầu từ đây, '
        + 'và mài hết các lớp khác thì bức trở về đây.',
      learned: ['Mọi bức bắt đầu từ cốt đất sét.'],
      readMore: [{ title: 'three.js · TorusKnotGeometry', url: 'https://threejs.org/docs/#api/en/geometries/TorusKnotGeometry' }],
      knobs: { detail: 'Độ chi tiết của nút thắt' },
      experiments: { flat: { label: 'Normal phẳng', explain: 'Mỗi tam giác sáng một màu: thấy rõ hình được ghép từ mặt phẳng.' } },
      readouts: { triangles: 'Số tam giác' },
      objects: { khoi: 'Nút thắt', be: 'Bệ' },
    },
    'to-mau': {
      understand: 'Lớp này sơn màu lên đất sét và thắp một ngọn đèn. Màu đi qua mix(đất sét, màu, trọng số), '
        + 'nên kéo trọng số về 0 là thấy lại cốt.',
      learned: ['Màu nào cũng trộn từ đất sét theo trọng số của lớp.'],
      readMore: [],
      knobs: { tint: 'Màu sơn', shine: 'Độ bóng' },
    },
  },
};
