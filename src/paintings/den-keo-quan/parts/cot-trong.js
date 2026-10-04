// paintings/den-keo-quan/parts/cot-trong.js — của lớp Cốt: trống hình nhân (ống trụ cắt theo mặt nạ), chong chóng, và texture mặt nạ (DataTexture có chuỗi mip tự tính).
import {
  BoxGeometry, ClampToEdgeWrapping, CylinderGeometry, DataTexture, DoubleSide, InstancedMesh, LinearFilter,
  LinearMipmapLinearFilter, Mesh, MeshStandardNodeMaterial, Object3D, RedFormat, RepeatWrapping, UnsignedByteType,
} from 'three/webgpu';
import { atan, color, float, fract, positionLocal, texture, vec2, vec3 } from 'three/tsl';

const TAU = Math.PI * 2;

/**
 * Bọc mặt nạ (độ phủ 8 bit, một kênh) thành DataTexture. Chuỗi mip do JS tự tính (spec §18.4): không nhờ GPU sinh, để WebGPU và
 * WebGL2 ra cùng một ảnh. Lặp theo chiều ngang (quanh trống), kẹp theo chiều dọc (ngoài dải là lề trống, độ phủ 0).
 * @param {{ width: number, height: number, levels: { width: number, height: number, data: Uint8Array }[] }} raster
 */
export function createMaskTexture(raster) {
  const [base] = raster.levels;
  const tex = new DataTexture(base.data, base.width, base.height, RedFormat, UnsignedByteType);
  tex.mipmaps = raster.levels.map(({ data, width, height }) => ({ data, width, height }));
  tex.generateMipmaps = false;
  tex.minFilter = raster.levels.length > 1 ? LinearMipmapLinearFilter : LinearFilter;
  tex.magFilter = LinearFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.unpackAlignment = 1; // mip hẹp chỉ 1–2 byte một hàng, mà WebGL mặc định căn hàng theo 4 byte
  tex.needsUpdate = true;
  return tex;
}

/**
 * Trống hình nhân và chong chóng, quay quanh trục đèn theo `theta`. Trống cắt hình bằng maskNode: three dùng maskNode cho cả lượt
 * vẽ bóng khi không có maskShadowNode (spec Phụ lục A.80), nên thí nghiệm "Shadow map thật" thấy đúng hình cắt.
 * Mặt nạ tra theo vị trí CỤC BỘ của trống: u = góc atan(z, x) / 2π, v = độ cao trong dải. Trống quay θ thì điểm ở góc cục bộ φ nằm
 * ở góc thế giới φ − θ; gobo tra ngược lại ở φ_thế giới + θ, nên trống và bóng luôn khớp nhau.
 * @param {object} ctx
 * @param {{ lantern: object, mask: { texture: any, solid: any }, theta: any }} p
 */
export function createDrum(ctx, { lantern, mask, theta }) {
  const { r, y0, y1 } = lantern.drum;
  const clay = (options) => {
    const m = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0, ...options });
    m.colorNode = color(ctx.palette.hex.datSet);
    m.emissiveNode = vec3(0);
    return m;
  };
  const material = clay({ side: DoubleSide });
  const u = fract(atan(positionLocal.z, positionLocal.x).div(TAU));
  const v = positionLocal.y.sub(y0).div(y1 - y0);
  const cover = texture(mask.texture, vec2(u, v)).r;
  // Giữ điểm khi có giấy (độ phủ > 0,5) hoặc khi "Trống không cắt" bật.
  material.maskNode = cover.max(mask.solid).greaterThan(float(0.5));
  const drum = new Mesh(new CylinderGeometry(r, r, y1 - y0, 64, 1, true).translate(0, (y0 + y1) / 2, 0), material);
  drum.name = 'trong';

  // Chong chóng: tám cánh phẳng nghiêng quanh trục, cùng góc với trống (chung một trục đứng). Material riêng, không cắt theo mặt nạ.
  const { y, r: fr, blades } = lantern.fan;
  const fanMaterial = clay({ side: DoubleSide });
  const fan = new InstancedMesh(new BoxGeometry(fr * 0.75, 0.002, fr * 0.32).translate(fr * 0.5, 0, 0), fanMaterial, blades);
  fan.name = 'chong-chong';
  const dummy = new Object3D();
  for (let i = 0; i < blades; i += 1) {
    dummy.rotation.set(0, (i / blades) * TAU, 0.45, 'YXZ');
    dummy.position.set(0, y, 0);
    dummy.updateMatrix();
    fan.setMatrixAt(i, dummy.matrix);
  }
  fan.computeBoundingSphere();
  const [ax, az] = lantern.axis;
  for (const o of [drum, fan]) {
    o.position.set(ax, 0, az);
    o.castShadow = true; // cho thí nghiệm "Shadow map thật" (castShadow nằm trong cache key: bật một lần lúc dựng)
  }
  return {
    mesh: drum,
    fan,
    materials: { trong: material, canh: fanMaterial },
    /** Mỗi khung (kể cả update(0, t)): theo góc trống của setup. */
    update() {
      drum.rotation.y = theta.value;
      fan.rotation.y = theta.value;
    },
  };
}
