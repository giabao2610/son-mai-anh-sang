// paintings/cung-que/layers/l4-anh-dat.js — Lớp 4 · Ánh đất của Bức 3: Trái Đất treo trên trời, bầu trời sao, và ánh Trái Đất hắt xuống phần đêm của hành tinh (earthshine).
import { color, cos, dot, float, max, uniform, vec3 } from 'three/tsl';
import { createEarth, createSky } from '../parts/anh-dat-troi.js';

export const id = 'anh-dat';

export const knobs = [
  // Cường độ ánh đất: ánh Trái Đất hắt xuống hành tinh, rõ nhất ở phần đêm lúc trăng non.
  { id: 'earthshine', min: 0, max: 1, step: 0.01, value: 0.25 },
  // Mật độ sao: phần ô của lưới hướng có sao (×2%).
  { id: 'stars', min: 0, max: 1, step: 0.01, value: 0.6 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  Cốt có shared.cot (recipe, world.EARTH); Mặt trời có shared.matTroi (sunDir, phi, earthLit); setup có shared.day
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const earthshine = ctx.knob('earthshine'); // @knob earthshine
  const stars = ctx.knob('stars'); // @knob stars
  const hide = uniform(0).setName('anhDatHide');
  const { recipe, world } = shared.cot;
  const { sunDir, phi, earthLit } = shared.matTroi;

  const earth = createEarth({ ctx, earth: world.EARTH, sunDir, w });
  const sky = createSky({ ctx, w, density: stars });
  ctx.scene.add(sky, earth);

  // Ánh đất (spec §19.4 lớp 4): Trái Đất ở hướng +Y hắt nắng xuống; mạnh theo phần sáng của Trái Đất nhìn từ trăng, (1 + cos φ)/2,
  // nên rõ nhất lúc trăng non, khi phía Trái Đất của hành tinh chìm trong đêm. AO của Bóng mềm nhân vào phần này.
  const anhDat = color(ctx.palette.color('anhDat'));
  const earthLitNode = float(1).add(cos(phi)).mul(0.5);
  const prevAmbient = recipe.ambient;
  recipe.ambient = (h) => prevAmbient(h).add(
    anhDat.mul(earthshine).mul(earthLitNode).mul(max(dot(h.n, vec3(0, 1, 0)), 0)).mul(w).mul(float(1).sub(hide)),
  );

  return {
    objects: [earth, sky],
    experiments: [
      {
        id: 'khongTraiDat',
        // Giấu cả Trái Đất (không để lại một đĩa đen che sao) lẫn ánh của nó
        toggle: (on) => {
          hide.value = on ? 1 : 0;
          earth.visible = !on;
        },
      },
    ],
    readouts: [{ id: 'traiDat', get: () => Math.round(earthLit(shared.day.value) * 100), unit: '%' }],
    dispose() {
      ctx.scene.remove(sky, earth);
      for (const mesh of [earth, sky]) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    },
  };
}
