// paintings/_mau/layers/l1-cot.js — Lớp 1 · Cốt của tranh mẫu: một nút thắt đất sét trên bệ, dưới đèn xưởng.
import { CylinderGeometry, HemisphereLight, Mesh, MeshStandardNodeMaterial, TorusKnotGeometry } from 'three/webgpu';
import { color, vec3 } from 'three/tsl';

export const id = 'cot';

/** Núm TĨNH: 'rebuild' vì đổi độ chi tiết là dựng lại hình (xưởng gọi onKnob.detail). */
export const knobs = [{ id: 'detail', via: 'rebuild', min: 16, max: 256, step: 16, value: 128 }];

// Đèn xưởng: trời trắng, đất xám; đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0 (luật 1, luật 3).
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };
const knot = (detail) => new TorusKnotGeometry(0.7, 0.22, detail, 16).translate(0, 1.3, 0);

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  Cốt ghi shared.cot cho lớp sau
 */
export function createLayer(ctx, shared) {
  // Đất sét: màu datSet, nhám; emissiveNode gán tường minh kể cả khi là vec3(0) (luật 8).
  const material = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0 });
  material.colorNode = color(ctx.palette.hex.datSet);
  material.emissiveNode = vec3(0);
  const shape = new Mesh(knot(ctx.knobValue('detail')), material);
  shape.name = 'khoi'; // mọi vật trong objects có name kebab-case; nhãn ở content.layers.cot.objects (Từng sợi hiện nhãn)
  const plinth = new Mesh(new CylinderGeometry(1.2, 1.3, 0.3, 48).translate(0, 0.15, 0), material);
  plinth.name = 'be';
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);

  const objects = [shape, plinth];
  ctx.scene.add(...objects, hemi);
  shared.cot = { material, hemi, hemiIntensity: STUDIO.intensity };

  let disposed = false;
  return {
    objects,
    onKnob: {
      detail: (v) => { // @knob detail
        shape.geometry.dispose();
        shape.geometry = knot(v);
      },
    },
    experiments: [
      {
        id: 'flat',
        toggle(on) {
          material.flatShading = on; // nằm trong cache key: biên dịch lại một lần
          material.needsUpdate = true;
        },
      },
    ],
    readouts: [{ id: 'triangles', get: () => shape.geometry.index.count / 3 + plinth.geometry.index.count / 3 }],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects, hemi);
      for (const o of objects) o.geometry.dispose();
      material.dispose();
      hemi.dispose();
    },
  };
}
