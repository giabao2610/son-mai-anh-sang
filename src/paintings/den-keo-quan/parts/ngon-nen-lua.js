// paintings/den-keo-quan/parts/ngon-nen-lua.js — của lớp Ngọn nến: ngọn lửa hình giọt nước, chỉ phát sáng (cộng dồn), uốn theo hướng thổi và dài ra theo độ sáng.
import { AdditiveBlending, LatheGeometry, Mesh, MeshBasicNodeMaterial, Vector2 } from 'three/webgpu';
import {
  abs, cameraPosition, color, dot, float, mix, normalWorld, normalize, positionGeometry, positionWorld, saturate, smoothstep, vec3,
} from 'three/tsl';

/**
 * Ngọn lửa (m): chiều cao, bán kính chỗ phình, khe giữa đỉnh nến và chân lửa (chỗ bấc). Lớp đặt chân lửa ngay trên đỉnh nến; đèn thật
 * (tâm ngọn lửa của đèn, giữa dải hình nhân) rơi vào quãng giữa thân lửa (test giữ).
 */
export const FLAME_SHAPE = Object.freeze({ height: 0.055, radius: 0.0065, gap: 0.003, points: 14, segments: 12 });

/** Mặt cắt giọt nước cho LatheGeometry: chân tròn, phình ở khoảng 0,4 chiều cao, nhọn ở đỉnh; hai đầu khép về trục. */
const profile = () => Array.from({ length: FLAME_SHAPE.points }, (_, i) => {
  const h = i / (FLAME_SHAPE.points - 1);
  return new Vector2(FLAME_SHAPE.radius * Math.sin(Math.PI * h ** 0.75), h * FLAME_SHAPE.height);
});

/**
 * Ngọn lửa chỉ thấy được khi giấy trong suốt hay qua công cụ học: như với đèn thật, người xem chỉ thấy ánh sáng của nó.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} p
 * @param {any} p.w      trọng số của lớp Ngọn nến
 * @param {any} p.color  uniform candleColor: sắc nến (núm warmth)
 * @param {any} p.lean   uniform vec2: độ lệch (x, z) của đèn thật so với chỗ đứng yên (m), do nhấp nháy và thổi
 * @param {any} p.glow   uniform: hệ số sáng của lửa lúc này
 * @param {[number, number, number]} p.base  chân lửa (m)
 */
export function createFlameMesh(ctx, { w, color: candleColor, lean, glow, base }) {
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  material.fog = false; // cộng dồn: fog của three trộn màu đầu ra về màu sương (luật của hạt cộng dồn)
  // Độ cao chuẩn hóa theo hình gốc (trước khi uốn): 0 ở chân, 1 ở đỉnh.
  const h = saturate(positionGeometry.y.div(FLAME_SHAPE.height));
  // Uốn: chân đứng yên trên bấc, càng cao càng lệch theo h²; ở giữa thân (h = 0,5, chỗ đèn thật) lệch đúng bằng đèn.
  const bend = h.mul(h).mul(4);
  material.positionNode = vec3(
    positionGeometry.x.add(lean.x.mul(bend)),
    positionGeometry.y.mul(float(0.7).add(glow.mul(0.3))), // sáng hơn thì lửa dài ra
    positionGeometry.z.add(lean.y.mul(bend)),
  );
  // Rìa (fresnel): 0 ở chỗ mặt lửa nhìn thẳng vào camera, 1 ở viền.
  const edge = float(1).sub(abs(dot(normalWorld, normalize(cameraPosition.sub(positionWorld)))));
  const core = mix(candleColor, vec3(1), 0.35).mul(4); // lõi vàng trắng, lớn hơn 1 để bloom tỏa
  const rim = color(ctx.palette.hex.lua).mul(2); // rìa cam
  const blue = color(ctx.palette.hex.cham).mul(8); // chân xanh lam: chỗ lửa cháy đủ khí
  const body = mix(core, rim, smoothstep(0.25, 0.85, edge));
  const lit = mix(blue, body, smoothstep(0.06, 0.22, h));
  // Mờ dần ở viền và ở đỉnh: lửa không có mép cứng.
  const fade = float(1).sub(smoothstep(0.7, 1, edge)).mul(float(1).sub(smoothstep(0.75, 1, h)));
  material.colorNode = vec3(0); // chỉ phát sáng: mọi màu nằm ở emissive, nên bloom (đọc ảnh emissive) thấy đủ cả ngọn lửa
  material.emissiveNode = lit.mul(fade).mul(glow).mul(w);

  const mesh = new Mesh(new LatheGeometry(profile(), FLAME_SHAPE.segments), material);
  mesh.name = 'ngon-lua';
  mesh.position.set(...base);
  // Lửa vẽ trước giấy: giấy đục che lửa, giấy trong (thí nghiệm của lớp Giấy) thì thấy lửa (spec §18.4).
  mesh.renderOrder = -1;
  return {
    mesh,
    dispose() {
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
