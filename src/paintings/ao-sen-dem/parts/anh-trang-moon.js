// paintings/ao-sen-dem/parts/anh-trang-moon.js — của lớp Ánh trăng: quả cầu trăng đúng pha, có vết biển tối, phát sáng quá 1 để bloom.
import { Mesh, MeshStandardNodeMaterial, SphereGeometry, Vector3 } from 'three/webgpu';
import { color, dot, mix, normalView, positionLocal, smoothstep, uniform, vec3 } from 'three/tsl';
import { sunDirection } from '../../../lib/astro/moon.js';
import { fbm } from '../../../lib/tsl/noise.js';

export const MOON = { radius: 5.5, distance: 160, glow: 1.2 };
// Ở vĩ độ thấp như Việt Nam, trăng non nằm ngửa như con thuyền: nghiêng phần sáng xuống dưới.
const CRESCENT_TILT = 0.9;

/**
 * Trăng thuộc lớp Ánh trăng: trọng số 0 → quả cầu đất sét dưới đèn xưởng (luật 3);
 * trọng số 1 → trăng tự sáng (emissive > 1 nên Phủ bóng làm nó tỏa).
 * Đường ranh sáng/tối: dot(normalView, hướng Mặt Trời giả) trong không gian nhìn,
 * với hướng lấy từ lib/astro/moon.js#sunDirection(pha) — cùng hệ trục view space của three.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {any} w  trọng số của lớp
 * @param {any} phase  uniform của núm moonPhase
 */
export function createMoon(ctx, w, phase) {
  const hex = ctx.palette.hex;
  const sun = uniform(new Vector3(0, 0, 1)).setName('moonSun');
  const setSun = () => {
    const tilt = -CRESCENT_TILT * Math.sign(Math.sin(phase.value));
    sun.value.set(...sunDirection(phase.value, { tilt }));
  };
  setSun();

  // Vết biển tối (maria): fbm trên tọa độ của chính quả cầu nên các vết dính vào trăng, không trôi.
  const maria = smoothstep(0.05, 0.45, fbm(positionLocal.div(MOON.radius).mul(1.6), { octaves: 4 }));
  const albedo = mix(1, 0.6, maria);
  const lit = smoothstep(-0.03, 0.12, dot(normalView, sun)); // mềm ở đường ranh
  const tint = mix(color(hex.nga), color(hex.vangLaSang), 0.6); // trăng sơn mài: ngà ngả vàng
  const light = tint.mul(albedo).mul(lit.mul(MOON.glow).add(0.02)); // 0.02: ánh đất mờ trên phần tối

  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0 });
  material.colorNode = mix(color(hex.datSet), vec3(0), w);
  material.emissiveNode = light.mul(w);
  const moon = new Mesh(new SphereGeometry(MOON.radius, 48, 24), material);
  return {
    moon,
    /** Mỗi khung: đặt trăng theo hướng của bức (giờ đêm), cập nhật pha từ núm. */
    update(dir) {
      moon.position.copy(dir).multiplyScalar(MOON.distance);
      setSun();
    },
    dispose() {
      moon.geometry.dispose();
      material.dispose();
    },
  };
}
