// paintings/ao-sen-dem/layers/l3-suong.js — Lớp 3 · Sương: vòm trời (sao, quầng trăng, Ngân Hà) và sương là là trên mặt nước (scene.fogNode).
import { color, min, mix, uniform } from 'three/tsl';
import { MAX_OCTAVES } from '../../../lib/tsl/noise.js';
import { createFog } from '../parts/suong-mu.js';
import { createSkyDome, makeSky } from '../parts/suong-troi.js';

export const id = 'suong';

export const knobs = [
  { id: 'density', min: 0, max: 0.12, step: 0.001, value: 0.008 },
  { id: 'heightFalloff', min: 0.05, max: 2, step: 0.01, value: 1 },
  { id: 'noiseScale', min: 0.01, max: 0.4, step: 0.005, value: 0.07 },
  // Số tầng noise là UNIFORM (không phải rebuild): fbm chạy vòng lặp thật trong shader nên đổi số tầng không biên dịch lại.
  // Đồ thị của sương nằm trong cache key của MỌI material: dựng lại nó là mọi material biên dịch lại (spec §6, GĐ 3).
  // Mức thấp (máy yếu) kéo tối đa 3 tầng: noise sương chạy trên gần như mọi điểm ảnh.
  { id: 'octaves', min: 1, max: (env) => (env.level === 'thap' ? 3 : MAX_OCTAVES), step: 1, value: (env) => env.budget.fogOctaves ?? 3 },
  { id: 'windStrength', min: 0, max: 3, step: 0.05, value: 0.6 },
  { id: 'starDensity', min: 0, max: 1, step: 0.01, value: 0.3 },
  { id: 'haloSize', min: 0.2, max: 2, step: 0.01, value: 1 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.moon, shared.hour, shared.swirl (setup của bức); shared.anhTrang.glow (lớp trước)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const moonLight = shared.anhTrang.glow;
  // Số octave chạy thật = min(núm, trần). Trần do nấc 'chi-tiet' của bộ điều chỉnh và thí nghiệm "Chỉ 1 octave" đặt:
  // nấc chỉ hạ TRẦN, không bao giờ ghi vào núm (ý người xem).
  const octaveCap = uniform(MAX_OCTAVES).setName('suong_octaveCap');
  let degradeCap = MAX_OCTAVES;
  let oneOctave = false;
  const syncCap = () => {
    octaveCap.value = oneOctave ? 1 : degradeCap;
  };

  const fog = createFog(ctx, {
    w,
    swirl: shared.swirl,
    moonDir: shared.moon.dir,
    moonLight,
    density: ctx.knob('density'), // @knob density
    heightFalloff: ctx.knob('heightFalloff'), // @knob heightFalloff
    noiseScale: ctx.knob('noiseScale'), // @knob noiseScale
    windStrength: ctx.knob('windStrength'), // @knob windStrength
    octaves: min(ctx.knob('octaves'), octaveCap), // @knob octaves
  });
  const sky = makeSky(ctx, {
    moonDir: shared.moon.dir,
    moonLight,
    hour: shared.hour,
    fogColor: fog.color,
    density: ctx.knob('density'), // @knob density
    starDensity: ctx.knob('starDensity'), // @knob starDensity
    haloSize: ctx.knob('haloSize'), // @knob haloSize
  });
  // Trời theo trọng số: 0 là nền đen then, đúng màu nền của canvas (luật 3: mài hết thì không còn trời).
  const skyW = (dir) => mix(color(ctx.palette.hex.denThen), sky(dir), w);
  const dome = createSkyDome(skyW);
  ctx.scene.add(dome);
  // Gán MỘT lần, không bao giờ gán lại hay đặt null lúc chạy: fogNode nằm trong cache key của mọi material.
  const previousFog = ctx.scene.fogNode;
  ctx.scene.fogNode = fog.node;
  // Sương không tác động lên kênh MRT emissive: lớp sau tự nhân (1 − fogFactor). Mặt nước dùng sky cho phản chiếu giả.
  shared.suong = { fogFactor: fog.factor, sky: skyW };

  let disposed = false;
  return {
    objects: [dome],
    experiments: [
      { id: 'rawNoise', toggle: (on) => { fog.raw.value = on ? 1 : 0; } },
      {
        // So chi tiết và số ms: 1 tầng noise so với số tầng của núm. Chỉ đổi trần (uniform): không biên dịch lại.
        id: 'oneOctave',
        kind: 'compare',
        toggle(on) {
          oneOctave = on;
          syncCap();
        },
      },
    ],
    readouts: [{ id: 'octaves', get: () => Math.min(ctx.knob('octaves').value, octaveCap.value) }],
    degrade: [
      {
        id: 'chi-tiet',
        apply() {
          degradeCap = 1;
          syncCap();
        },
        revert() {
          degradeCap = MAX_OCTAVES;
          syncCap();
        },
      },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(dome);
      dome.geometry.dispose();
      dome.material.dispose();
      if (ctx.scene.fogNode === fog.node) ctx.scene.fogNode = previousFog; // gỡ cảnh: trả scene về như trước khi dựng
    },
  };
}
