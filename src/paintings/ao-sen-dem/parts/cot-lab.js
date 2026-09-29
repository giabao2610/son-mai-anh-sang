// paintings/ao-sen-dem/parts/cot-lab.js — của lớp Cốt: thí nghiệm "Tắt instancing" (mỗi lá một Mesh), và đếm số đỉnh cho tab Phá.
import { Group, Mesh } from 'three/webgpu';

/** Trần số Mesh rời theo mức: vài trăm tới nghìn draw call là đủ thấy FPS tụt, mà không làm treo máy yếu. */
export const LOOSE_MAX = { cao: 1200, vua: 600, thap: 300 };

/**
 * "Tắt instancing": vẽ lá nổi bằng từng Mesh riêng, cùng hình và cùng material, nên mỗi lá thành MỘT draw call
 * (instancing gom cả nghìn lá vào một). Giấu InstancedMesh, thêm một Group vào scene và trả Group đó.
 * receiveShadow chép từ lá instanced: nó nằm trong cache key của material, lệch là phải biên dịch thêm.
 * @param {import('three/webgpu').Scene} scene
 * @param {import('three/webgpu').InstancedMesh} leaves
 * @param {number} max
 */
export function looseLeaves(scene, leaves, max) {
  const group = new Group();
  const n = Math.min(leaves.count, max);
  for (let i = 0; i < n; i++) {
    const mesh = new Mesh(leaves.geometry, leaves.material);
    leaves.getMatrixAt(i, mesh.matrix);
    mesh.matrixAutoUpdate = false; // ma trận chép sẵn từ instance, không tính lại từ position/rotation/scale
    mesh.receiveShadow = leaves.receiveShadow;
    group.add(mesh);
  }
  leaves.visible = false;
  scene.add(group);
  return group;
}

/**
 * Gỡ Group của looseLeaves và hiện lại lá instanced. Hình và material dùng chung nên không dispose, nhưng từng Mesh
 * thì phải: renderer giữ một RenderObject (kèm bộ đệm uniform) cho mỗi Mesh ở mỗi pass, chỉ gỡ khi Mesh bắn 'dispose'.
 */
export function tightenLeaves(scene, leaves, group) {
  scene.remove(group);
  for (const mesh of group.children) mesh.dispose();
  group.clear();
  leaves.visible = true;
}

/**
 * Số đỉnh mà GPU xử lý mỗi lần vẽ cảnh cho các object này: đỉnh của một hình × số bản sao.
 * renderer.info không có bộ đếm đỉnh (Phụ lục A.11), nên lớp tự tính.
 * @param {import('three/webgpu').Object3D[]} objects
 */
export function vertexCount(objects) {
  let total = 0;
  for (const object of objects) {
    object.traverseVisible((o) => {
      const n = o.geometry?.getAttribute('position')?.count ?? 0;
      total += n * (o.isInstancedMesh ? o.count : 1);
    });
  }
  return total;
}
