// engine/stock/phu-bong/layer.js — lớp dùng chung "Phủ bóng": build (bloom chọn lọc + tone) và display (LUT, grain, vignette, FXAA), trộn theo trọng số.
import { Fn, If, acesFilmicToneMapping, agxToneMapping, mix, uniform, vec4 } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { displayStage } from './display.js';
import { lutTexture } from './lut.js';

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
  // Chặng display (GĐ 4). Số mặc định chốt ở lượt màu GĐ 4 (spec §5): LUT 0,45 để sương chân trời ấm mà không ngả cam.
  { id: 'lutIntensity', min: 0, max: 1, step: 0.01, value: 0.45 },
  { id: 'grain', min: 0, max: 0.15, step: 0.005, value: 0.03 },
  { id: 'vignette', min: 0, max: 1, step: 0.01, value: 0.45 },
];

/**
 * @param {import('../../contracts/runtime.js').LayerCtx} ctx
 * @returns {import('../../contracts/runtime.js').Layer}
 */
export function createLayer(ctx) {
  let glow = null;
  // BloomNode mặc định chạy ở nửa độ phân giải (0.5); mức 'vừa'/'thấp' của bức có thể hạ xuống 0.25.
  // Nấc 'bloom' của bộ điều chỉnh chia đôi tiếp. BloomNode đọc số này mỗi khung: không biên dịch lại.
  let scale = ctx.budget.bloom ?? 0.5;
  const setScale = (v) => {
    scale = v;
    glow?.setResolutionScale(v);
  };
  // Thí nghiệm "Bloom cả khung": 0 = chỉ ảnh emissive tỏa (chọn lọc), 1 = cả ảnh màu tỏa.
  const whole = uniform(0).setName('phu_bong_whole');
  // Thí nghiệm "Tắt FXAA" (GĐ 4): 1 = bỏ bước khử răng cưa, mép lá và cuống sen lộ bậc thang.
  const fxaaOff = uniform(0).setName('phu_bong_fxaaOff');
  // LUT sinh từ bảng màu ĐÃ GHÉP của bức: bức đổi màu thì LUT tự đổi theo (spec §5).
  const lut = lutTexture(ctx.palette.hex);

  return {
    post: {
      /** HDR tuyến tính vào → ra. Xưởng gọi MỘT lần khi dựng pipeline. */
      build({ color, channel, weight, tap }) {
        // Bloom CHỌN LỌC: làm nhòe ảnh emissive của MRT, không nhòe cả khung hình.
        glow = bloom(
          mix(channel('emissive'), channel('output'), whole),
          ctx.knob('bloomStrength'), // @knob bloomStrength
          ctx.knob('bloomRadius'), // @knob bloomRadius
          ctx.knob('bloomThreshold'), // @knob bloomThreshold
        );
        glow.setResolutionScale(scale);
        const exposure = ctx.knob('exposure');
        const tone = ctx.knob('toneMapping');
        // Ảnh chụp giữa chừng cho công cụ học (GĐ 4), theo thứ tự trong pipeline. Phải là biểu thức THUẦN (texture của
        // scene pass, texture của bloom, uniform), không phải biến .toVar() trong Fn: Kính mài tính lại nó ở lượt vẽ cuối.
        tap?.('truoc-bloom', color);
        tap?.('truoc-tone', color.add(glow.mul(weight)));

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
      /** Màu hiển thị vào → ra (GĐ 4): LUT sơn mài, grain, vignette, FXAA (display.js). */
      display({ color, weight }) {
        return displayStage({
          color,
          weight,
          time: ctx.u.time, // đồng hồ của xưởng: ?freeze cho ra đúng cùng một lớp hạt
          lut,
          lutIntensity: ctx.knob('lutIntensity'), // @knob lutIntensity
          grain: ctx.knob('grain'), // @knob grain
          vignette: ctx.knob('vignette'), // @knob vignette
          fxaaOff,
        });
      },
    },
    experiments: [
      {
        id: 'wholeFrame',
        toggle(on) {
          whole.value = on ? 1 : 0;
        },
      },
      { id: 'noFxaa', toggle: (on) => { fxaaOff.value = on ? 1 : 0; } },
    ],
    readouts: [{ id: 'bloomScale', get: () => scale }],
    // Nấc của bộ điều chỉnh (spec §10): ảnh bloom còn một nửa mỗi chiều, tức một phần tư số điểm ảnh phải làm nhòe.
    degrade: [{ id: 'bloom', apply: () => setScale(scale * 0.5), revert: () => setScale(scale * 2) }],
    dispose() {
      glow?.dispose();
      glow = null;
      lut.dispose();
    },
  };
}
