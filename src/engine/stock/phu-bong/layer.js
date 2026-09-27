// engine/stock/phu-bong/layer.js — lớp dùng chung "Phủ bóng" v0: bloom chọn lọc trên kênh emissive + tone mapping AgX, trộn theo trọng số.
import { Fn, vec4, mix, agxToneMapping } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export const id = 'phu-bong';

/** Núm TĨNH: test đọc được mà không cần GPU. Cả hai là uniform, kéo núm không biên dịch lại. */
export const knobs = [
  { id: 'bloomStrength', min: 0, max: 3, step: 0.01, value: 1 },
  { id: 'exposure', min: 0.1, max: 3, step: 0.01, value: 1 },
];

/**
 * @param {import('../../contracts/runtime.js').LayerCtx} ctx
 * @returns {import('../../contracts/runtime.js').Layer}
 */
export function createLayer(ctx) {
  let glow = null;

  return {
    post: {
      /** HDR tuyến tính vào → ra. Xưởng gọi MỘT lần khi dựng pipeline. */
      build({ color, channel, weight }) {
        // Bloom CHỌN LỌC: chỉ làm nhòe ảnh emissive của MRT, không nhòe cả khung hình.
        glow = bloom(channel('emissive'), ctx.knob('bloomStrength'), 0.4, 0); // @knob bloomStrength
        // BloomNode mặc định chạy ở nửa độ phân giải (0.5); mức 'vừa'/'thấp' của bức có thể hạ xuống 0.25.
        glow.setResolutionScale(ctx.budget.bloom ?? 0.5);
        const exposure = ctx.knob('exposure');

        // Viết trong Fn + .toVar(): hdr được tính MỘT lần vào một biến rồi dùng lại (hdr.rgb lẫn hdr.a).
        // Không dùng select(): trong r186 nó sinh if/else, node dựng lần đầu trong một nhánh rồi dùng lại
        // bên ngoài sẽ đọc biến chưa gán → alpha 0, khung đen hoặc trong suốt (Phụ lục A.6).
        return Fn(() => {
          const hdr = color.add(glow.mul(weight)).toVar();
          const lin = hdr.rgb.mul(exposure).toVar(); // @knob exposure
          const toned = agxToneMapping(hdr.rgb, exposure); // @knob exposure
          // weight = 0: không bloom, không tone map (ảnh HDR cháy trắng, đó chính là bài học).
          return vec4(mix(lin, toned, weight), hdr.a);
        })();
      },
    },
    dispose() {
      glow?.dispose();
      glow = null;
    },
  };
}
