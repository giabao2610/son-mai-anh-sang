// engine/stock/phu-bong/content.vi.js — chữ tiếng Việt của lớp dùng chung "Phủ bóng" (Hiểu/Chỉnh/Phá), viết trung tính cho mọi bức.
import diagram from './diagram.svg?raw';

/**
 * Bức nào lắp Phủ bóng thì import file này trong content của bức, và ghi đè bằng spread nếu muốn ví dụ riêng:
 * `layers: { 'phu-bong': { ...phuBong.layers['phu-bong'], understand: '…' } }` (spec §8.6).
 * @type {{ layers: Record<string, import('../../contracts/painting.js').LayerContent> }}
 */
export default {
  layers: {
    'phu-bong': {
      understand:
        'Phủ bóng là bước cuối của nghề sơn mài, và cũng là bước cuối của mỗi khung hình. Nó có hai chặng. Chặng '
        + 'build làm việc trên ảnh HDR, dải sáng rộng hơn màn hình: cảnh được vẽ một lần ra hai ảnh (MRT), ảnh màu '
        + 'và ảnh chỉ có phần tự phát sáng; bloom làm nhòe riêng ảnh phát sáng rồi cộng lại, nên chỉ vật phát sáng '
        + 'mới tỏa. Tone mapping nén dải sáng ấy về màn hình mà vẫn giữ chi tiết vùng sáng. Chặng display làm việc '
        + 'trên màu của màn hình: LUT sơn mài nhuộm vùng tối nâu cánh gián, vùng sáng vàng lá; grain rắc hạt mịn '
        + 'như mặt sơn; vignette tối dần về góc; FXAA làm mềm mép răng cưa. Tắt lớp này thì vùng sáng cháy trắng '
        + 'và mép hình lộ bậc thang.',
      diagram,
      learned: [
        'MRT: một lần vẽ ghi ra nhiều ảnh.',
        'Bloom chọn lọc: chỉ phần tự phát sáng mới tỏa.',
        'Tone mapping: nén dải sáng HDR về dải của màn hình.',
        'LUT 3D: tra mỗi màu trong một khối màu sinh sẵn để đổi tông cả ảnh.',
        'FXAA: khử răng cưa trên ảnh đã vẽ xong, không phải vẽ lại cảnh.',
      ],
      readMore: [
        { title: 'LearnOpenGL · Bloom', url: 'https://learnopengl.com/Advanced-Lighting/Bloom' },
        { title: 'LearnOpenGL · HDR', url: 'https://learnopengl.com/Advanced-Lighting/HDR' },
        { title: 'Ví dụ three.js: bloom chọn lọc qua emissive', url: 'https://threejs.org/examples/#webgpu_postprocessing_bloom_emissive' },
        { title: 'Ví dụ three.js: LUT 3D', url: 'https://threejs.org/examples/#webgpu_postprocessing_3dlut' },
        { title: 'Ví dụ three.js: FXAA', url: 'https://threejs.org/examples/#webgpu_postprocessing_fxaa' },
      ],
      knobs: {
        bloomStrength: 'Độ tỏa',
        bloomRadius: 'Bán kính tỏa',
        bloomThreshold: 'Ngưỡng tỏa',
        toneMapping: { label: 'Tone mapping', options: { none: 'Không', agx: 'AgX', aces: 'ACES' } },
        exposure: 'Phơi sáng',
        lutIntensity: 'Độ nhuộm LUT sơn mài',
        grain: 'Hạt (grain)',
        vignette: 'Tối góc (vignette)',
      },
      experiments: {
        wholeFrame: {
          label: 'Bloom cả khung',
          explain: 'Cho cả ảnh màu vào bloom thay vì chỉ phần tự phát sáng: mọi thứ nhòe bết như sương '
            + 'đọng trên ống kính. Vì vậy bloom cần chọn lọc.',
        },
        noFxaa: {
          label: 'Tắt FXAA',
          explain: 'Bỏ bước khử răng cưa: mép hình và những đường mảnh lộ ra bậc thang của từng điểm ảnh. FXAA không '
            + 'vẽ lại cảnh: nó đọc các điểm quanh mỗi điểm ảnh rồi làm mềm chỗ có mép.',
        },
      },
      // Ảnh chụp giữa chừng của pipeline (tap), cho Kính mài và Lột lớp soi.
      taps: { 'truoc-bloom': 'Trước bloom', 'truoc-tone': 'Trước tone' },
      readouts: { bloomScale: 'Độ phân giải bloom (so với màn hình)' },
    },
  },
};
