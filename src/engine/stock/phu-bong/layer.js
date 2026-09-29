// engine/stock/phu-bong/layer.js — lớp dùng chung "Phủ bóng": bloom chọn lọc trên kênh emissive + tone mapping chọn bằng uniform, trộn theo trọng số.
import { Fn, If, acesFilmicToneMapping, agxToneMapping, mix, uniform, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export const id = 'phu-bong';

/** Chỉ số của từng lựa chọn tone mapping trong uniform (núm 'select' giữ CHỈ SỐ của options). */
const TONE = { none: 0, agx: 1, aces: 2 };

/** Núm TĨNH: test đọc được mà không cần GPU. Tất cả là uniform: kéo núm, đổi tone, không biên dịch lại. */
export const knobs = [
  { id: 'bloomStrength', min: 0, max: 3, step: 0.01, value: 1 },
  { id: 'bloomRadius', min: 0, max: 1, step: 0.01, value: 0.4 },
  { id: 'bloomThreshold', min: 0, max: 2, step: 0.01, value: 0 },
  { id: 'toneMapping', kind: 'select', options: Object.keys(TONE), value: 'agx' },
  { id: 'exposure', min: 0.1, max: 3, step: 0.01, value: 1 },
];

/**
 * @param {import('../../contracts/runtime.js').LayerCtx} ctx
 * @returns {import('../../contracts/runtime.js').Layer}
 */
export function createLayer(ctx) {
  let glow = null;
  // Thí nghiệm "Bloom cả khung": 0 = chỉ ảnh emissive tỏa (chọn lọc), 1 = cả ảnh màu tỏa.
  const whole = uniform(0).setName('phu_bong_whole');

  return {
    post: {
      /** HDR tuyến tính vào → ra. Xưởng gọi MỘT lần khi dựng pipeline. */
      build({ color, channel, weight }) {
        // Bloom CHỌN LỌC: làm nhòe ảnh emissive của MRT, không nhòe cả khung hình.
        glow = bloom(
          mix(channel('emissive'), channel('output'), whole),
          ctx.knob('bloomStrength'), // @knob bloomStrength
          ctx.knob('bloomRadius'), // @knob bloomRadius
          ctx.knob('bloomThreshold'), // @knob bloomThreshold
        );
        // BloomNode mặc định chạy ở nửa độ phân giải (0.5); mức 'vừa'/'thấp' của bức có thể hạ xuống 0.25.
        glow.setResolutionScale(ctx.budget.bloom ?? 0.5);
        const exposure = ctx.knob('exposure');
        const tone = ctx.knob('toneMapping');

        // Chọn tone bằng If trong Fn, KHÔNG dùng select(): trong r186 select() sinh if/else, node dựng lần đầu
        // trong một nhánh rồi dùng lại bên ngoài (hdr.a) sẽ đọc biến chưa gán → alpha 0 (Phụ lục A.6).
        // hdr được vật chất hóa (.toVar()) TRƯỚC mọi nhánh. Đổi tone chỉ đổi uniform: +0 program.
        return Fn(() => {
          const hdr = color.add(glow.mul(weight)).toVar();
          const lin = hdr.rgb.mul(exposure).toVar(); // @knob exposure
          const toned = lin.toVar(); // 'none': chỉ nhân phơi sáng, vùng sáng cháy trắng
          If(tone.equal(TONE.agx), () => { // @knob toneMapping
            toned.assign(agxToneMapping(hdr.rgb, exposure));
          }).ElseIf(tone.equal(TONE.aces), () => {
            toned.assign(acesFilmicToneMapping(hdr.rgb, exposure));
          });
          // weight = 0: không bloom, không tone map (ảnh HDR cháy trắng, đó chính là bài học).
          return vec4(mix(lin, toned, weight), hdr.a);
        })();
      },
    },
    experiments: [
      {
        id: 'wholeFrame',
        toggle(on) {
          whole.value = on ? 1 : 0;
        },
      },
    ],
    dispose() {
      glow?.dispose();
      glow = null;
    },
  };
}
