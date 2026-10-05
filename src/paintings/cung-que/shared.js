// paintings/cung-que/shared.js — setup() của Bức 3: độ cao bay của cây đa (uniform dùng chung cho hình SDF và số đo).
import { uniform } from 'three/tsl';

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const lift = uniform(0).setName('treeLift');
  return { shared: { lift } };
}
