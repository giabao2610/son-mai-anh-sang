// paintings/dan-ga-me-con/layers/l5-dan-ga.js — Lớp 5 · Đàn gà của Bức 4: thóc là bể hạt compute dùng chung (rắc, rơi, nảy, lăn, bị mổ), đàn gà theo mốc áp vào Cốt mỗi khung, mảng mỏ cho thóc; thí nghiệm Tô theo luồng; nấc thoc.
import { float, mix, uniform } from 'three/tsl';
import { COUNT_FLOOR, createPool } from '../../../lib/tsl/particles.js';
import { GRAIN, GRAVITY, createBeaks, createGrainSprite, initGrain, makeLaw, makeSpawn } from '../parts/dan-ga-thoc.js';

export const id = 'dan-ga';

/** Trần số hạt theo mức (bảng quality.js của bức): cấp phát một lần theo số này. */
const countMax = (env) => env.budget.grains ?? 4096;

export const knobs = [
  // Số hạt mỗi nắm. Số hạt đang tính đã có trần theo mức (count), nên núm này không cần trần theo mức; nắm lớn hơn bể thì bị cắt.
  { id: 'handful', via: 'js', min: 10, max: 300, step: 10, value: 120 },
  { id: 'bounce', min: 0, max: 0.8, step: 0.05, value: 0.3 },
  // Trọng lực của Trái Đất hay của trăng (để so với lá rơi của Bức 3). Uniform giữ chỉ số lựa chọn: 0 Trái Đất, 1 trăng.
  { id: 'gravity', kind: 'select', options: Object.keys(GRAVITY), value: 'traiDat' },
  { id: 'count', via: 'js', min: COUNT_FLOOR, max: countMax, step: 100, value: countMax },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.flock (setup của bức: đàn gà dạng đóng); shared.cot (recipe, floor, pixel, pose) của Cốt
 */
export function createLayer(ctx, shared) {
  const { flock, cot } = shared;
  const w = ctx.weight(id);
  let handful = ctx.knobValue('handful');
  let wanted = ctx.knobValue('count'); // ý người xem (núm)
  const levelCount = wanted; // số mặc định của mức: nấc 'thoc' hạ trần về một nửa số này
  let cap = Infinity; // trần của máy (nấc); số hạt được tính và vẽ = min(núm, trần)
  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  const beaks = createBeaks();
  const lane = uniform(0).setName('danGaLane'); // thí nghiệm Tô theo luồng
  const gravity = mix(float(GRAVITY.traiDat), float(GRAVITY.trang), ctx.knob('gravity')); // @knob gravity
  // Bể hạt dùng chung (lib/tsl/particles.js): hai bộ đệm vec4 cấp MỘT lần theo trần của mức; a = (vị trí, lúc sinh), b = (vận tốc, hạt giống).
  const pool = createPool({
    capacity: countMax(ctx),
    count: wanted,
    tier: ctx.tier,
    renderer: ctx.renderer,
    init: initGrain,
    law: makeLaw({
      dt: ctx.u.delta,
      gravity,
      bounce: ctx.knob('bounce'), // @knob bounce
      beaks,
      floor: cot.floor,
    }),
    spawn: makeSpawn({ time: ctx.u.time }),
  });
  const sprite = createGrainSprite({ pool, recipe: cot.recipe, time: ctx.u.time, pixel: cot.pixel, lane, w });
  sprite.name = 'thoc';
  pool.setCount(wanted, sprite);
  ctx.scene.add(sprite);
  /** Số hạt được tính và vẽ = min(núm, trần). Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
  const applyCount = () => pool.setCount(Math.min(wanted, cap), sprite);
  let now = flock.state(ctx.u.time.value);
  let disposed = false;

  return {
    objects: [sprite],
    /**
     * Mỗi khung, sau setup.update (drift của đàn gà đã chạy): áp dáng của đàn gà vào Cốt, ghi mảng mỏ, rắc các nắm tới lúc văng, rồi một bước
     * của bể. update(0, t) (khung đứng yên của ?freeze) chỉ áp dáng: không rắc, không compute (bể tự bỏ qua khi dt = 0).
     */
    update(dt, t) {
      const on = w.value > 0;
      sprite.visible = on; // visible không nằm trong cache key
      now = flock.state(t);
      cot.pose(now, w.value); // trọng số 0: đàn gà đứng yên ở dáng nghỉ, như tượng
      now.chicks.forEach((c, i) => beaks.array[i].set(c.beak[0], c.beak[1], c.beak[2], c.pecking && on ? 1 : 0));
      if (!on) {
        // Tắt hẳn: nắm rắc lúc này bị bỏ, nắm đang chờ cũng bỏ; phủ lại lớp thì không có nắm cũ nào bung ra cùng lúc.
        flock.takeScatters(t);
        pool.clear();
        return;
      }
      if (dt > 0) {
        for (const s of flock.takeScatters(t)) {
          // Rắc tay thì văng từ tầm tay; gà mẹ bới thì văng thấp (chân cào hất lên). Nắm của cú chạm (count null) theo núm handful.
          pool.emit({ origin: [s.at[0], s.auto ? GRAIN.kick : GRAIN.drop, s.at[1]], count: s.count ?? handful, seed: s.seed, still: s.still });
        }
      }
      pool.step(dt, w.value); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
    },
    onKnob: {
      handful: (v) => { // @knob handful
        handful = v;
      },
      count: (v) => { // @knob count
        wanted = v;
        applyCount();
      },
    },
    // Chỉ đổi uniform: mỗi hạt một màu theo chỉ số luồng GPU giữ nó (xoay góc vàng): thấy mỗi luồng giữ một hạt suốt đời.
    experiments: [{ id: 'toTheoLuong', toggle: (on) => { lane.value = on ? 1 : 0; } }],
    readouts: [
      { id: 'rac', get: () => pool.emitted() }, // số hạt đã rắc thật còn trong vòng đệm (bể đếm lúc rắc)
      { id: 'dangAn', get: () => now.eating },
      { id: 'quanhMe', get: () => now.near },
    ],
    // Nấc của bộ điều chỉnh: trần số hạt = nửa số mặc định của mức (không dưới 100), như đom đóm của Bức 1.
    degrade: [
      {
        id: 'thoc',
        apply() {
          before = cap;
          cap = Math.max(COUNT_FLOOR, Math.round(levelCount / 2));
          applyCount();
        },
        revert() {
          cap = before;
          applyCount();
        },
      },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(sprite);
      sprite.material.dispose();
      pool.dispose();
    },
  };
}
