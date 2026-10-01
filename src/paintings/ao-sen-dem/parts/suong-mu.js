// paintings/ao-sen-dem/parts/suong-mu.js — của lớp Sương: hệ số sương là là (dày sát nước, trôi theo gió, xoáy khi vuốt) và màu sương.
import {
  Fn,
  cameraPosition,
  color,
  cos,
  dot,
  exp,
  fog,
  max,
  mix,
  normalize,
  oneMinus,
  positionView,
  positionWorld,
  pow,
  saturate,
  sin,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';
import { duskOf } from './suong-troi.js';

const WIND = [0.92, 0, 0.4]; // hướng gió trên mặt ao (gần như từ trái sang phải khung hình)
const WIND_SPEED = 0.1; // miền noise trôi chừng này đơn vị mỗi giây khi sức gió = 1
const SWIRL = { radius: 9, settle: 0.6 }; // xoáy: bán kính ảnh hưởng (đơn vị cảnh), tốc độ lắng (mỗi giây)

/**
 * Màu sương theo hướng nhìn (đơn vị): bạc lá pha chàm, tối như đêm; ngả vàng lá khi nhìn về phía trăng, vì sương tán xạ
 * ánh trăng về phía trước (nhìn ngược sáng thì sương sáng nhất). `moonLight`: độ sáng của trăng (lớp Ánh trăng công bố).
 * GĐ 4: lúc chạng vạng và gần sáng (`hour`, cùng hệ số dusk với vòm trời) nền sương ấm về nâu cánh gián.
 * @returns {(dir: any) => any}  gọi được trong TSL
 */
export function makeFogColor(ctx, { moonDir, moonLight, hour }) {
  const hex = ctx.palette.hex;
  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.2).add(color(hex.canhGian).mul(duskOf(hour).mul(0.6)));
  const glow = color(hex.vangLaSang).mul(0.12).mul(moonLight);
  // saturate trước pow: pow của số âm là NaN trên GPU thật.
  return Fn(([dir]) => base.add(glow.mul(pow(saturate(dot(dir, moonDir)), 16))));
}

/**
 * Sương của cả cảnh: node cho `scene.fogNode`, cùng hệ số sương để các lớp sau dùng lại.
 * Hệ số (spec §6): w × (1 − exp(−d × density × exp(−y × heightFalloff) × (0.6 + 0.4 × noise))), d = khoảng cách theo trục nhìn.
 * Mọi thứ đổi lúc chạy (trọng số, núm, xoáy, "Xem noise thô") là uniform bên trong: fogNode nằm trong cache key của MỌI
 * material, nên node này dựng MỘT lần và không bao giờ gán lại.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ w: any, swirl: any, moonDir: any, moonLight: any, hour: any, density: any, heightFalloff: any, noiseScale: any,
 *   windStrength: any, octaves: any }} p  node hoặc uniform
 */
export function createFog(ctx, { w, swirl, moonDir, moonLight, hour, density, heightFalloff, noiseScale, windStrength, octaves }) {
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một làn sương
  const raw = uniform(0).setName('suong_raw'); // thí nghiệm "Xem noise thô": 1 → mọi bề mặt hiện noise xám
  const wind = vec3(...WIND).normalize().mul(windStrength).mul(WIND_SPEED);

  // noise ∈ [−1, 1] tại điểm đang vẽ. Miền noise xoay quanh tâm xoáy một góc tắt dần theo thời gian và khoảng cách
  // (vuốt tay → sương xoáy rồi lắng), rồi trôi theo gió.
  const noise = Fn(() => {
    const p = positionWorld;
    const d = p.xz.sub(swirl.center).toVar();
    const age = max(t.sub(swirl.start), 0);
    const angle = swirl.spin.mul(exp(age.mul(-SWIRL.settle))).mul(exp(dot(d, d).div(-(SWIRL.radius ** 2))));
    const c = cos(angle);
    const s = sin(angle);
    const xz = vec2(d.x.mul(c).sub(d.y.mul(s)), d.x.mul(s).add(d.y.mul(c))).add(swirl.center);
    return fbm(vec3(xz.x, p.y, xz.y).mul(noiseScale).add(wind.mul(t)), { octaves });
  })();

  const distance = positionView.z.negate();
  const thick = exp(positionWorld.y.mul(heightFalloff).negate()); // sát mặt nước (y = 0) đặc nhất, lên cao mỏng dần
  const amount = distance.mul(density).mul(thick).mul(noise.mul(0.4).add(0.6));
  const factor = oneMinus(exp(amount.negate())).mul(w);

  const fogColor = makeFogColor(ctx, { moonDir, moonLight, hour });
  const view = normalize(positionWorld.sub(cameraPosition));
  // "Xem noise thô": màu sương thành noise xám, hệ số thành 1 (mọi bề mặt thay hẳn bằng noise). Chỉ đổi uniform.
  const node = fog(mix(fogColor(view), vec3(noise.mul(0.5).add(0.5)), raw), mix(factor, 1, raw));
  return { node, factor, color: fogColor, raw };
}
