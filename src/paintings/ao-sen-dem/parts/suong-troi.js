// paintings/ao-sen-dem/parts/suong-troi.js — của lớp Sương: màu vòm trời theo hướng nhìn (chàm → đen then, sao, quầng trăng, Ngân Hà, sương chân trời).
import { BackSide, Mesh, MeshBasicNodeMaterial, SphereGeometry } from 'three/webgpu';
import {
  Fn,
  cameraPosition,
  color,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  mix,
  mx_cell_noise_float,
  normalize,
  oneMinus,
  positionWorld,
  pow2,
  pow3,
  saturate,
  sin,
  smoothstep,
  step,
  vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

export const SKY_RADIUS = 300; // lớn hơn quỹ đạo trăng (160), nhỏ hơn tầm nhìn xa của camera (500)
const STARS = { scale: 220, maxShare: 0.035 }; // ô sao: 220 ô mỗi đơn vị hướng; mật độ 1 = 3,5% số ô có sao
const GALAXY = [0.42, 0.55, 0.72]; // pháp tuyến của mặt phẳng dải Ngân Hà (một đường tròn lớn nghiêng qua trời)

/**
 * Chạng vạng (18h–19h30) và gần sáng (28h30–29h30) → 1, giữa đêm → 0. Trời và sương cùng dùng hàm này (GĐ 4), nên chân
 * trời và sương ấm lên cùng nhau khi kéo thanh giờ.
 * @param {any} hour  uniform giờ của bức (18 → 29,5)
 */
export const duskOf = (hour) => oneMinus(smoothstep(18, 19.5, hour)).add(smoothstep(28.5, 29.5, hour));

/**
 * Hàm màu trời theo hướng nhìn (vector đơn vị, từ mắt ra trời). Không cần ảnh nào: mọi thứ tính từ hướng.
 * Trả màu TUYẾN TÍNH, chưa trộn trọng số (lớp tự trộn với đen then).
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ moonDir: any, moonLight: any, hour: any, fogColor: (dir: any) => any, density: any, starDensity: any,
 *   haloSize: any }} p  moonLight: độ sáng của trăng (trọng số Ánh trăng × phần được chiếu); hour: 18 → 29,5
 * @returns {(dir: any) => any}
 */
export function makeSky(ctx, { moonDir, moonLight, hour, fogColor, density, starDensity, haloSize }) {
  const hex = ctx.palette.hex;
  const t = ctx.u.time;
  return Fn(([dir]) => {
    const e = dir.y; // độ cao của hướng nhìn: 0 là chân trời, 1 là đỉnh đầu
    // Dải màu theo poster: đen then ở chân trời, chàm ở đỉnh. Chạng vạng (18h–19h30) và gần sáng (28h30–29h30)
    // chân trời ấm lên màu nâu cánh gián. Giờ là uniform của bức: thanh giờ (GĐ 4) chỉ việc đổi nó.
    const dusk = duskOf(hour);
    const base = mix(color(hex.denThen), color(hex.cham).mul(2), smoothstep(0, 0.6, e))
      .add(color(hex.canhGian).mul(dusk.mul(0.6)).mul(oneMinus(smoothstep(0, 0.25, e))));

    // Sao: chia hướng nhìn thành lưới ô 3D. Mỗi ô một số ngẫu nhiên cố định (mx_cell_noise_float = hash của ô);
    // số đó vượt ngưỡng thì ô có sao, đặt lệch trong ô cho khỏi thẳng hàng. Mờ dần về chân trời và gần trăng.
    const cellPos = dir.mul(STARS.scale);
    const cell = floor(cellPos);
    const pick = mx_cell_noise_float(cell);
    const jitter = vec3(mx_cell_noise_float(cell.add(17)), mx_cell_noise_float(cell.add(31)), mx_cell_noise_float(cell.add(47)));
    const offset = fract(cellPos).sub(0.5).sub(jitter.sub(0.5).mul(0.6));
    const dot1 = oneMinus(smoothstep(0, 0.2, length(offset))); // chấm tròn nhỏ giữa ô
    const lit = step(float(1).sub(starDensity.mul(STARS.maxShare)), pick);
    const twinkle = sin(t.mul(pick.mul(3).add(1)).add(pick.mul(40))).mul(0.25).add(0.75);
    const moonCos = dot(dir, moonDir);
    const clear = smoothstep(0.02, 0.2, e).mul(oneMinus(smoothstep(0.97, 0.995, moonCos)));
    const stars = color(hex.nga).mul(dot1.mul(lit).mul(twinkle).mul(pow3(fract(pick.mul(13.7)))).mul(clear).mul(1.6));

    // Quầng trăng: sáng quanh hướng trăng, tắt dần theo góc. 1 − cos(góc) ≈ góc²/2, nên exp(−k(1 − cos)) là một chuông.
    const off = oneMinus(moonCos);
    const halo = exp(off.mul(-60).div(pow2(haloSize).add(0.01))).mul(0.1).add(exp(off.mul(-1500)).mul(0.3));
    const moonHalo = color(hex.vangLaSang).mul(halo.mul(moonLight));

    // Ngân Hà: một vành rất mờ quanh một đường tròn lớn, lốm đốm theo fbm 2 tầng.
    const band = exp(pow2(dot(dir, normalize(vec3(...GALAXY)))).div(-0.012));
    const dust = pow2(fbm(dir.mul(4.2), { octaves: 2 }).mul(0.5).add(0.5));
    const milky = color(hex.bacLa).mul(band.mul(dust).mul(0.035).mul(smoothstep(0.05, 0.35, e)));

    // Sương ở chân trời: dưới chân trời là màu sương, nên mép ao đặc sương tan liền vào trời.
    const horizon = oneMinus(smoothstep(-0.02, 0.12, e)).mul(saturate(density.mul(20)));
    return mix(base.add(stars).add(moonHalo).add(milky), fogColor(dir), horizon);
  });
}

/**
 * Vòm trời: quả cầu lớn nhìn từ BÊN TRONG (BackSide), vẽ trước mọi thứ và không ghi độ sâu, nên luôn nằm sau cùng.
 * Không nhận sương (sương chân trời đã vẽ trong màu trời), không phát sáng (trời không bloom).
 * @param {(dir: any) => any} skyColor  màu trời đã trộn trọng số
 */
export function createSkyDome(skyColor) {
  const material = new MeshBasicNodeMaterial({ side: BackSide, depthWrite: false, fog: false });
  // Hướng từ mắt tới điểm trên vòm: sao đứng yên so với người xem, và camera lật của reflector soi đúng trời.
  material.colorNode = skyColor(normalize(positionWorld.sub(cameraPosition)));
  material.emissiveNode = vec3(0);
  const dome = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), material);
  dome.name = 'vom-troi';
  dome.renderOrder = -1;
  return dome;
}
