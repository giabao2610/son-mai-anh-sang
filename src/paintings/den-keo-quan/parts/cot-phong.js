// paintings/den-keo-quan/parts/cot-phong.js — của lớp Cốt: gian nhà (sàn, ba vách, trần, xà, cột), mọi bề mặt nhận bóng của đèn.
import { BoxGeometry, CylinderGeometry, InstancedMesh, Mesh, Object3D, PlaneGeometry } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Gian nhà (mét; spec §18.1): rộng 2 × half, cao `height`; phía camera (z = +half) để trống. Ba xà ngang dọc trục x ở các z của
 * `beams` (đèn treo ở xà giữa, z = −0,6), cỡ xà `beam` = [dài, cao, dày]; hai cột ở hai góc sau, bán kính `post`.
 */
export const ROOM = Object.freeze({
  half: 2.5,
  height: 3.2,
  beams: Object.freeze([-1.8, -0.6, 0.6]),
  beam: Object.freeze([5, 0.2, 0.16]),
  beamY: 3.05,
  posts: Object.freeze([Object.freeze([-2.3, -2.3]), Object.freeze([2.3, -2.3])]),
  post: 0.11,
});

/**
 * Ba vách (sau, trái, phải) gộp làm MỘT hình (một lần vẽ), mặt quay vào trong gian. PlaneGeometry mặc định nhìn về +z.
 */
function wallGeometry() {
  const { half, height } = ROOM;
  const back = new PlaneGeometry(2 * half, height).translate(0, height / 2, -half);
  const left = new PlaneGeometry(2 * half, height).rotateY(Math.PI / 2).translate(-half, height / 2, 0);
  const right = new PlaneGeometry(2 * half, height).rotateY(-Math.PI / 2).translate(half, height / 2, 0);
  const merged = mergeGeometries([back, left, right]);
  for (const g of [back, left, right]) g.dispose();
  return merged;
}

/**
 * Các vật của gian nhà, mỗi vật có `name`. Mọi bề mặt NHẬN bóng (receiveShadow nằm trong cache key: đặt một lần lúc dựng): node bóng
 * tự viết của đèn nến chỉ chạy trên vật có cờ này (spec Phụ lục A.77).
 * @param {{ san: any, vach: any, tran: any, go: any, cot: any }} materials
 */
export function createRoom(materials) {
  const { half, height } = ROOM;
  const floor = new Mesh(new PlaneGeometry(2 * half, 2 * half).rotateX(-Math.PI / 2), materials.san);
  floor.name = 'san';
  const walls = new Mesh(wallGeometry(), materials.vach);
  walls.name = 'vach';
  const ceiling = new Mesh(new PlaneGeometry(2 * half, 2 * half).rotateX(Math.PI / 2).translate(0, height, 0), materials.tran);
  ceiling.name = 'tran';

  const dummy = new Object3D();
  const beams = new InstancedMesh(new BoxGeometry(...ROOM.beam), materials.go, ROOM.beams.length);
  beams.name = 'xa';
  ROOM.beams.forEach((z, i) => {
    dummy.position.set(0, ROOM.beamY, z);
    dummy.updateMatrix();
    beams.setMatrixAt(i, dummy.matrix);
  });
  beams.computeBoundingSphere();
  const posts = new InstancedMesh(new CylinderGeometry(ROOM.post, ROOM.post, height, 20), materials.cot, ROOM.posts.length);
  posts.name = 'cot-go';
  ROOM.posts.forEach(([x, z], i) => {
    dummy.position.set(x, height / 2, z);
    dummy.updateMatrix();
    posts.setMatrixAt(i, dummy.matrix);
  });
  posts.computeBoundingSphere();

  const objects = [floor, walls, ceiling, beams, posts];
  for (const o of objects) o.receiveShadow = true;
  return { objects };
}
