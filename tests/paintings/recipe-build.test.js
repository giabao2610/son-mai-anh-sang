// tests/paintings/recipe-build.test.js — công thức của link (GĐ 9) không làm hỏng lúc dựng: mọi bức dựng được với từng núm ở hai đầu (min, trần của máy), từng lựa chọn, cả hai bool, ở mọi mức.
import { describe, it, expect } from 'vitest';
import { buildPainting, NOW } from '../helpers/fake-ctx.js';
import { ALL } from '../helpers/paintings.js';
import { createRecipeSet } from '../../src/engine/gpu/recipe-set.js';
import { knobMax } from '../../src/engine/gpu/knob-set.js';
import { budgetFor, LEVELS } from '../../src/engine/quality.js';

/**
 * Chữ của công thức cho các giá trị đầu mút của một núm: số ở min và ở trần của máy này (trần có thể là hàm của mức); bool 1 và 0; mọi
 * lựa chọn của núm select; màu đen và trắng. Đi qua classify như link thật (đổi kiểu, kẹp, về nấc), rồi vào createKnobs lúc dựng.
 */
function extremes(knob, env) {
  const kind = knob.kind ?? 'number';
  if (kind === 'number') return [knob.min, knobMax(knob, env)].filter((v) => v !== undefined).map(String);
  if (kind === 'bool') return ['1', '0'];
  if (kind === 'select') return knob.options;
  if (kind === 'color') return ['000000', 'ffffff'];
  throw new Error(`núm có kind lạ "${kind}"`);
}

/** Gỡ một lần dựng (như disposer của scene.js): lớp theo thứ tự ngược, rồi setup. */
function teardown({ built, setup }) {
  for (const { layer } of [...built].reverse()) layer.dispose?.();
  setup?.dispose?.();
}

describe.each(ALL.filter((p) => p.deployed).map((p) => [p.meta.slug, p]))('Bức "%s": dựng với công thức ở hai đầu của mọi núm', (slug, { meta, entry }) => {
  it.each(LEVELS)('mức %s', async (level) => {
    const painting = await entry.load();
    // Cùng env với buildPainting (tầng webgpu, máy tính, NOW): trần của núm theo mức là trần mà createKnobs dùng.
    const env = { tier: 'webgpu', level, budget: budgetFor(level, painting.quality), now: NOW, mobile: false };
    const recipes = createRecipeSet({ modules: painting.layers, env });
    const errors = [];
    let builds = 0;
    for (const module of painting.layers) {
      for (const knob of module.knobs ?? []) {
        for (const value of extremes(knob, env)) {
          const key = `${module.id}.${knob.id}`;
          const at = `${key}:${value}`;
          const { knobs, problems } = recipes.classify([{ key, value }]);
          if (problems.length > 0) {
            errors.push(`${at}: classify bỏ mục (${problems.join('; ')})`);
            continue;
          }
          try {
            const scene = buildPainting(painting, meta, { level, initial: knobs });
            builds += 1;
            const landed = scene.knobs[module.id].get(knob.id);
            if (landed !== knobs[key]) errors.push(`${at}: núm dựng với ${landed}, công thức nói ${knobs[key]}`);
            teardown(scene);
          } catch (err) {
            errors.push(`${at}: dựng hỏng: ${err.message}`);
          }
        }
      }
    }
    expect(builds, 'bức không có núm nào để thử?').toBeGreaterThan(10);
    expect(errors).toEqual([]);
  }, 120_000);
});
