// paintings/_mau/layers/l2-to-mau.js — Lớp 2 · Tô màu của tranh mẫu: sơn màu lên đất sét và thắp một ngọn đèn, trộn theo trọng số.
import { DirectionalLight } from 'three/webgpu';
import { color, float, mix, oneMinus } from 'three/tsl';

export const id = 'to-mau';

/** Hai núm 'uniform': kéo núm chỉ đổi .value của uniform, không biên dịch lại. */
export const knobs = [
  { id: 'tint', kind: 'color', value: '#B3261E' },
  { id: 'shine', min: 0, max: 1, step: 0.01, value: 0.6 },
];

const LIGHT = 2.5;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (lớp trước)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { cot } = shared;
  // Màu nào cũng đi từ đất sét: trọng số 0 là về lại Cốt (luật 3).
  cot.material.colorNode = mix(color(ctx.palette.hex.datSet), ctx.knob('tint'), w); // @knob tint
  cot.material.roughnessNode = mix(float(0.9), oneMinus(ctx.knob('shine')), w); // @knob shine

  // Cường độ đèn là uniform bên trong node đèn: đổi mỗi khung theo trọng số mà không biên dịch lại.
  const sun = new DirectionalLight(ctx.palette.hex.nga, 0);
  sun.position.set(3, 5, 4);
  ctx.scene.add(sun);

  let disposed = false;
  return {
    objects: [],
    update() {
      const k = w.value;
      sun.intensity = LIGHT * k;
      cot.hemi.intensity = cot.hemiIntensity * (1 - k * 0.7); // đèn xưởng lui bớt khi đèn của bức sáng lên
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(sun);
      sun.dispose();
    },
  };
}
