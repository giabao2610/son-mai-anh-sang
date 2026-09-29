// paintings/ao-sen-dem/parts/cot-lab.js — của lớp Cốt: thí nghiệm "Tắt instancing" (mỗi lá một Mesh), và đếm số đỉnh cho tab Phá.
import { Group, Mesh } from 'three/webgpu';

/** Trần số Mesh rời theo mức: vài trăm tới nghìn draw call là đủ thấy FPS tụt, mà không làm treo máy yếu. */
export const LOOSE_MAX = { cao: 1200, vua: 600, thap: 300 };

/**
 * "Tắt instancing": vẽ lá nổi bằng từng Mesh riêng, cùng hình và cùng material, nên mỗi lá thành MỘT draw call
 * (instancing gom cả nghìn lá vào một). Các Mesh rời được tạo MỘT lần (tới trần của mức) và giữ tới khi gỡ lớp;
 * bật/tắt chỉ hiện/giấu Group. Tạo mới mỗi lần bật thì renderer phải dựng lại shader và pipeline (khựng), còn bỏ đi
 * mà không dispose thì rò RenderObject (mỗi Mesh một cái ở mỗi pass, chỉ gỡ khi Mesh bắn 'dispose').
 * receiveShadow chép từ lá instanced: nó nằm trong cache key của material, lệch là phải biên dịch thêm.
 * @param {import('three/webgpu').Scene} scene
 * @param {import('three/webgpu').InstancedMesh} leaves
 * @param {number} max
 */
export function createLooseLeaves(scene, leaves, max) {
  const group = new Group();
  for (let i = 0; i < max; i++) {
    const mesh = new Mesh(leaves.geometry, leaves.material);
    mesh.matrixAutoUpdate = false; // ma trận chép sẵn từ instance, không tính lại từ position/rotation/scale
    mesh.receiveShadow = leaves.receiveShadow;
    group.add(mesh);
  }
  group.visible = false;
  scene.add(group);

  /** Chép ma trận của lá instanced sang các Mesh rời: đủ số lá hiện có (tới trần), phần dư giấu đi. */
  const sync = () => {
    const n = Math.min(leaves.count, max);
    group.children.forEach((mesh, i) => {
      mesh.visible = i < n;
      if (i < n) leaves.getMatrixAt(i, mesh.matrix);
    });
  };
  return {
    group,
    sync,
    /** Bật: hiện các Mesh rời (ma trận mới nhất), giấu InstancedMesh. Tắt: ngược lại. */
    show(on) {
      if (on) sync();
      group.visible = on;
      leaves.visible = !on;
    },
    /** Gỡ lớp: dispose từng Mesh rời. Hình và material dùng chung với lá instanced nên lớp tự gỡ chúng. */
    dispose() {
      scene.remove(group);
      for (const mesh of group.children) mesh.dispose();
      group.clear();
      leaves.visible = true;
    },
  };
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
