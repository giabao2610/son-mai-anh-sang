// paintings/ao-sen-dem/parts/cot-reeds.js — của lớp Cốt: cuống (hoa, nụ, lá đứng) và lau sậy mọc thành khóm ở rìa ao.
import { CylinderGeometry, DoubleSide, InstancedMesh, Object3D, PlaneGeometry } from 'three/webgpu';
import { randRange } from '../../../lib/random.js';

const RIM = { inner: 50, outer: 58, clumps: 14 };

/**
 * Mọi cuống trong MỘT InstancedMesh cấp phát cho `capacity` cuống: một ống thon cao 1, gốc ở y = 0.
 * Cuống của lá nổi nằm dưới nước nên không vẽ.
 */
export function makeStems(capacity, material) {
  const geometry = new CylinderGeometry(0.035, 0.05, 1, 6, 1, true).translate(0, 0.5, 0);
  const mesh = new InstancedMesh(geometry, material, capacity);
  mesh.name = 'cuong';
  return mesh;
}

/**
 * Ghi cuống: mỗi instance kéo dài theo chiều cao của thứ nó đỡ.
 * @param {{ x: number, y: number, z: number }[]} heads  đỉnh cuống (tâm hoa, nụ, lá đứng)
 */
export function fillStems(mesh, heads) {
  const dummy = new Object3D();
  heads.forEach((h, i) => {
    dummy.position.set(h.x, 0, h.z);
    dummy.scale.set(1, h.y, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.count = heads.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** Một ngọn lau: dải mảnh thon dần lên ngọn, gốc ở y = 0, cao 1. */
function makeBladeGeometry() {
  const geometry = new PlaneGeometry(0.09, 1, 1, 4).translate(0, 0.5, 0);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) * 0.9)); // thon về ngọn
  geometry.computeVertexNormals();
  return geometry;
}

/** Lau sậy: `count` ngọn. Hai mặt đều vẽ (DoubleSide) vì dải lau rất mỏng. */
export function makeReeds(count, material) {
  material.side = DoubleSide;
  const mesh = new InstancedMesh(makeBladeGeometry(), material, count);
  mesh.name = 'lau-say';
  return mesh;
}

/** Rải lau thành khóm quanh rìa ao, mỗi ngọn cao thấp, nghiêng khác nhau. Cùng rng thì cùng kết quả. */
export function fillReeds(mesh, rng) {
  const centers = Array.from({ length: RIM.clumps }, () => ({
    a: rng() * Math.PI * 2,
    r: randRange(rng, RIM.inner, RIM.outer),
  }));
  const dummy = new Object3D();
  for (let i = 0; i < mesh.count; i++) {
    const c = centers[i % RIM.clumps];
    const a = c.a + randRange(rng, -0.05, 0.05);
    const r = c.r + randRange(rng, -1.5, 1.5);
    dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    dummy.rotation.set(randRange(rng, -0.15, 0.15), rng() * Math.PI, randRange(rng, -0.15, 0.15));
    dummy.scale.set(1, randRange(rng, 2, 5), 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
