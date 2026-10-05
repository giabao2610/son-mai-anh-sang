// paintings/cung-que/parts/anh-dat-troi.js — Trái Đất (biển, đất, mây sinh bằng noise; pha theo cùng hướng nắng; viền khí quyển tỏa) và bầu trời sao (sao băm theo hướng nhìn, lấp lánh).
import { BackSide, Mesh, NodeMaterial, SphereGeometry } from 'three/webgpu';
import {
  cameraPosition, clamp, color, cos, dot, float, floor, fract, length, max, mix, normalWorld, normalize, positionLocal, positionWorld,
  pow3, sin, smoothstep, step, vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

const TAU = Math.PI * 2;
/** Bầu trời: cầu lớn quanh cả cảnh (camera xa nhất 6,5), trong tầm far của camera (500). */
const SKY_RADIUS = 40;
/** Số ô sao trên mỗi đơn vị hướng: mỗi ô có thể có một sao; chừng 0,26° một ô. */
const STAR_CELLS = 220;

/**
 * Trái Đất treo trên đỉnh cây (spec §19.4 lớp 4). Tô bằng CÙNG hướng nắng với hành tinh, nên pha của nó ngược pha trăng: trăng mới
 * thì mặt sáng của Trái Đất quay về phía trăng. Biển, đất, mây sinh theo hướng trên mặt cầu, quay quanh trục Y theo đồng hồ của cảnh.
 * @param {{ ctx: object, earth: { center: number[], radius: number, spinPeriod: number }, sunDir: any, w: any }} p
 *   sunDir: hướng tới Mặt Trời (node vec3, Mặt trời công bố); w: trọng số của lớp
 * @returns {Mesh}  tên 'trai-dat'
 */
export function createEarth({ ctx, earth, sunDir, w }) {
  const pal = (token) => color(ctx.palette.color(token));
  const [sea, land, cloud, rim] = ['cham', 'xanhLuc', 'bacLa', 'anhDat'].map(pal); // mây bạc: ngà qua LUT thành cam (lượt màu)
  const spin = ctx.u.time.mul(TAU / earth.spinPeriod);
  const d0 = normalize(positionLocal);
  // Xoay hướng mẫu quanh Y: lục địa và mây trôi qua mặt sáng
  const d = vec3(d0.x.mul(cos(spin)).sub(d0.z.mul(sin(spin))), d0.y, d0.x.mul(sin(spin)).add(d0.z.mul(cos(spin))));
  const isLand = smoothstep(0.02, 0.12, fbm(d.mul(2.2), { octaves: 3 }));
  // Mây mỏng, trải rộng: ngưỡng thấp và mép mềm (lượt màu: ngưỡng cao cho vài đốm nhỏ mép gắt, trông như vết bẩn)
  const clouds = smoothstep(0.1, 0.45, fbm(d.mul(4).add(vec3(ctx.u.time.mul(0.01))), { octaves: 2 }));
  const lit = max(dot(normalWorld, sunDir), 0);
  const albedo = mix(mix(sea, land, isLand), cloud, clouds.mul(0.6));

  const material = new NodeMaterial();
  material.fog = false;
  material.colorNode = albedo.mul(lit).mul(w);
  // Viền khí quyển (fresnel): sáng ở mép đĩa, mạnh hơn ở phía có nắng; ghi vào emissive nên Phủ bóng làm nó tỏa nhẹ
  const facing = max(dot(normalWorld, normalize(cameraPosition.sub(positionWorld))), 0);
  const dayside = clamp(dot(normalWorld, sunDir).add(0.2), 0, 1);
  material.emissiveNode = pow3(float(1).sub(facing)).mul(rim).mul(float(0.3).add(dayside.mul(0.7))).mul(w);

  const mesh = new Mesh(new SphereGeometry(earth.radius, 48, 24), material);
  mesh.position.set(...earth.center);
  mesh.name = 'trai-dat';
  return mesh;
}

/**
 * Bầu trời sao: cầu lớn vẽ mặt trong, TRƯỚC mọi vật (renderOrder −2), không ghi độ sâu. Nền đen; sao nằm trong emissive để Phủ bóng
 * làm chúng tỏa. Mỗi ô của lưới hướng có một số băm: số băm vượt ngưỡng (theo mật độ) thì ô có sao, sáng ở giữa ô, lấp lánh theo
 * nhịp riêng của số băm.
 * @param {{ ctx: object, w: any, density: any }} p  density: núm mật độ sao 0–1
 * @returns {Mesh}  tên 'bau-troi'
 */
export function createSky({ ctx, w, density }) {
  const d = normalize(positionLocal).mul(STAR_CELLS);
  const cell = floor(d);
  const h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));
  const spot = float(1).sub(smoothstep(0.05, 0.3, length(fract(d).sub(0.5))));
  const on = step(float(1).sub(density.mul(0.02)), h);
  const twinkle = float(0.75).add(sin(ctx.u.time.mul(h.mul(3).add(2)).add(h.mul(40))).mul(0.25));

  const material = new NodeMaterial();
  material.side = BackSide;
  material.depthWrite = false;
  material.fog = false;
  material.colorNode = vec3(0);
  material.emissiveNode = color(ctx.palette.color('vangLaSang')).mul(spot).mul(on).mul(twinkle).mul(w);

  const mesh = new Mesh(new SphereGeometry(SKY_RADIUS, 64, 32), material);
  mesh.renderOrder = -2;
  mesh.name = 'bau-troi';
  return mesh;
}
