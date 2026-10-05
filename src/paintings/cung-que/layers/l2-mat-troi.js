// paintings/cung-que/layers/l2-mat-troi.js — Lớp 2 · Mặt trời của Bức 3: nắng theo pha trăng thật (Dial Ngày âm lịch), màu thật của từng vật, BRDF của bụi trăng.
import { Fn, If, abs, color, cos, dot, float, mix, normalize, sin, smoothstep, uniform, vec3 } from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';
import { SYNODIC_MONTH } from '../../../lib/astro/lunar.js';
import { earthLit, litFraction, phaseOfDay } from '../parts/mat-troi-pha.js';
import { lambert, regolith } from '../parts/mat-troi-brdf.js';

export const id = 'mat-troi';

export const knobs = [
  { id: 'intensity', min: 0, max: 3, step: 0.05, value: 1.6 },
  // Độ bừng B0 của bụi trăng khi nắng ở sau lưng người nhìn (opposition surge).
  { id: 'surge', min: 0, max: 1, step: 0.01, value: 0.5 },
];

const TAU = Math.PI * 2;
/** Gồ ghề của mặt đất: chỉ ở pháp tuyến lúc tô (bump), không ở hình dò tia (spec §19.1). Tần số và độ cao của mấp mô. */
const BUMP_FREQ = 18;
const BUMP_HEIGHT = 0.0025;
const BUMP_EPS = 0.002;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  setup() có shared.day (uniform của Dial); Cốt có shared.cot (recipe, ID, world, lift)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const intensity = ctx.knob('intensity'); // @knob intensity
  const surge = ctx.knob('surge'); // @knob surge
  const lambertOn = uniform(0).setName('matTroiLambert');
  const { recipe, ID, world, lift } = shared.cot;

  // Hướng nắng theo pha (spec §19.2): S = −E·cos φ + A·sin φ, E = +Y, A = +X. φ tính trong shader từ uniform của Dial.
  const phi = shared.day.sub(1).mul(TAU / SYNODIC_MONTH);
  const sunDir = vec3(sin(phi), cos(phi).negate(), 0);
  shared.matTroi = { sunDir, phi, earthLit: (day) => earthLit(phaseOfDay(day)) };

  const pal = (token) => color(ctx.palette.color(token));
  const [clay, bacLa, bark, leaf, nga, denThen] = ['datSet', 'bacLa', 'canhGian', 'xanhLuc', 'nga', 'denThen'].map(pal);
  const sunColor = nga;
  const isId = (h, k) => abs(h.id.sub(k)).lessThan(0.5);

  /** Màu thật theo vật. Độ cao tính từ gốc cây (đã dời theo độ cao bay): thân, rễ màu cánh gián; tán xanh lục có cụm lá. */
  const trueColor = (h) => Fn(() => {
    const c = bacLa.mul(float(0.82).add(fbm(h.p.mul(7), { octaves: 2 }).mul(0.18))).toVar(); // bụi trăng lốm đốm
    const above = h.p.y.sub(lift.add(world.PLANET.radius));
    If(isId(h, ID.TREE), () => {
      const foliage = leaf.mul(float(0.78).add(fbm(h.p.mul(16), { octaves: 2 }).mul(0.3)));
      c.assign(mix(bark, foliage, smoothstep(0.34, 0.4, above)));
    });
    If(isId(h, ID.CUOI), () => {
      c.assign(mix(bark.mul(0.75), mix(nga, bark, 0.3), smoothstep(0.11, 0.12, above))); // áo nâu; đầu da ngà
    });
    If(isId(h, ID.TRAU), () => {
      c.assign(mix(denThen, clay, 0.25));
    });
    If(isId(h, ID.LEAF), () => {
      c.assign(leaf);
    });
    return c;
  })();

  /** Pháp tuyến có gồ ghề cho mặt đất: nghiêng theo gradient (sai phân) của một noise nhỏ; vật khác giữ nguyên. */
  const bumped = (h) => Fn(() => {
    const n = h.n.toVar();
    If(isId(h, ID.GROUND), () => {
      const f = (q) => fbm(q.mul(BUMP_FREQ), { octaves: 2 });
      const f0 = f(h.p);
      const g = vec3(
        f(h.p.add(vec3(BUMP_EPS, 0, 0))).sub(f0),
        f(h.p.add(vec3(0, BUMP_EPS, 0))).sub(f0),
        f(h.p.add(vec3(0, 0, BUMP_EPS))).sub(f0),
      ).div(BUMP_EPS);
      const slope = g.sub(h.n.mul(dot(h.n, g))).mul(BUMP_HEIGHT); // phần gradient nằm trên mặt phẳng tiếp tuyến
      n.assign(normalize(h.n.sub(slope)));
    });
    return n;
  })();

  recipe.albedo = (h) => mix(clay, trueColor(h), w);
  recipe.sunWeight = w;
  recipe.sun = (h) => {
    const brdf = Fn(() => {
      const n = bumped(h);
      const f = lambert(n, sunDir).toVar();
      If(isId(h, ID.GROUND), () => {
        f.assign(mix(regolith(n, sunDir, h.v, surge), lambert(n, sunDir), lambertOn)); // bụi trăng chỉ ở mặt đất
      });
      return f;
    })();
    return sunColor.mul(intensity).mul(brdf);
  };

  const day = () => shared.day.value;
  return {
    objects: [],
    experiments: [{ id: 'lambert', toggle: (on) => { lambertOn.value = on ? 1 : 0; } }],
    readouts: [
      { id: 'tuoi', get: () => (day() - 1).toFixed(1) },
      { id: 'sang', get: () => Math.round(litFraction(phaseOfDay(day())) * 100), unit: '%' },
      { id: 'goc', get: () => Math.round((phaseOfDay(day()) * 180) / Math.PI) % 360, unit: '°' },
    ],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
