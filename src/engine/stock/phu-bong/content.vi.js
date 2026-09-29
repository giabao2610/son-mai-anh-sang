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
        'Phủ bóng là bước cuối của nghề sơn mài, và cũng là bước cuối của mỗi khung hình. Cảnh được vẽ '
        + 'một lần ra hai ảnh cùng lúc (MRT): ảnh màu, và ảnh chỉ có phần tự phát sáng. Bloom làm nhòe riêng '
        + 'ảnh phát sáng rồi cộng lại, nên chỉ vật phát sáng mới tỏa hào quang: đó là bloom chọn lọc. Cảnh được '
        + 'tính trong dải sáng rộng (HDR), có chỗ sáng gấp nhiều lần mức màn hình hiển thị được. Tone mapping '
        + 'nén dải ấy về màn hình mà vẫn giữ chi tiết vùng sáng: AgX nhẹ và trung thực, ACES đậm và tương '
        + 'phản hơn. Tắt lớp này thì mọi vùng sáng cháy trắng.',
      diagram,
      learned: [
        'MRT: một lần vẽ ghi ra nhiều ảnh.',
        'Bloom chọn lọc: chỉ phần tự phát sáng mới tỏa.',
        'Tone mapping: nén dải sáng HDR về dải của màn hình.',
      ],
      readMore: [
        { title: 'LearnOpenGL · Bloom', url: 'https://learnopengl.com/Advanced-Lighting/Bloom' },
        { title: 'LearnOpenGL · HDR', url: 'https://learnopengl.com/Advanced-Lighting/HDR' },
        { title: 'Ví dụ three.js: bloom chọn lọc qua emissive', url: 'https://threejs.org/examples/#webgpu_postprocessing_bloom_emissive' },
      ],
      knobs: {
        bloomStrength: 'Độ tỏa',
        bloomRadius: 'Bán kính tỏa',
        bloomThreshold: 'Ngưỡng tỏa',
        toneMapping: { label: 'Tone mapping', options: { none: 'Không', agx: 'AgX', aces: 'ACES' } },
        exposure: 'Phơi sáng',
      },
      experiments: {
        wholeFrame: {
          label: 'Bloom cả khung',
          explain: 'Cho cả ảnh màu vào bloom thay vì chỉ phần tự phát sáng: mọi thứ nhòe bết như sương '
            + 'đọng trên ống kính. Vì vậy bloom cần chọn lọc.',
        },
      },
      readouts: { bloomScale: 'Độ phân giải bloom (so với màn hình)' },
    },
  },
};
