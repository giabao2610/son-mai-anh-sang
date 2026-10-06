// paintings/dan-ga-me-con/layers/l3-ban-net.js — Lớp 3 · Bản nét: nét mực đen in sau cùng, như bản nét của tranh Đông Hồ; viền dò trên ảnh độ sâu (post), không thêm lượt vẽ nào.
import { color, mix, uniform, vec2, vec4 } from 'three/tsl';
import { depthEdges } from '../parts/ban-net-do-canh.js';

export const id = 'ban-net';

export const knobs = [
  { id: 'lineWidth', min: 0.5, max: 3, step: 0.1, value: 1.5 },
  { id: 'threshold', min: 0.05, max: 2, step: 0.05, value: 0.3 },
  { id: 'crease', min: 0, max: 1, step: 0.05, value: 0.6 },
];

/**
 * Bản khung (Task 1): chỉ có viền. Task 5 thêm lệch bản, mực không đều, nét trong (recipe.ink) và hai thí nghiệm.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.cot.pixel (Cốt đặt mỗi khung)
 */
export function createLayer(ctx, shared) {
  // Texture độ sâu chỉ tuyến tính với camera trực giao (Phụ lục A.89–A.90): camera phối cảnh thì nét sẽ sai ở mọi chỗ, nên báo ngay.
  if (!ctx.camera.isOrthographicCamera) {
    throw new Error('Bản nét dò cạnh trên texture độ sâu tuyến tính: chỉ chạy với camera trực giao (spec §20.4 lớp 3).');
  }
  const muc = color(ctx.palette.color('muc'));
  const span = uniform(ctx.camera.far - ctx.camera.near).setName('banNetSpan');
  return {
    objects: [],
    post: {
      build({ color: c, channel, weight, tap }) {
        tap('truoc-net', c);
        const ink = depthEdges({
          depth: channel('depth'),
          span,
          px: ctx.knob('lineWidth'), // @knob lineWidth
          offset: vec2(0),
          threshold: ctx.knob('threshold'), // @knob threshold
          crease: ctx.knob('crease'), // @knob crease
          pixel: shared.cot.pixel,
        });
        return vec4(mix(c.rgb, muc, ink.mul(weight)), c.a);
      },
    },
    dispose() {},
  };
}
