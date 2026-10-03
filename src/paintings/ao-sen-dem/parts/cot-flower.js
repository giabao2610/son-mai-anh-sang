// paintings/ao-sen-dem/parts/cot-flower.js — của lớp Cốt: cánh sen instanced (nở theo uniform), gương sen + nhị, vị trí hoa và nụ.
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Object3D,
} from 'three/webgpu';
import { Fn, attribute, cos, cross, dot, normalLocal, oneMinus, positionLocal, sin, vec3 } from 'three/tsl';
import { randRange } from '../../../lib/random.js';
import { inMoonPath } from './cot-leaf.js';

// Ba vòng cánh: vòng trong đứng thẳng, vòng ngoài ngả gần nằm. Góc tính từ phương thẳng đứng (rad).
const RINGS = [
  { count: 6, radius: 0.08, closed: 0.08, open: 0.35, scale: 0.8 },
  { count: 8, radius: 0.13, closed: 0.14, open: 0.75, scale: 0.95 },
  { count: 10, radius: 0.18, closed: 0.2, open: 1.1, scale: 1 },
];
const BUD = { count: 5, radius: 0.05, tilt: 0.08, scale: 0.75 };
/** Số hoa và nụ của ao (kể cả hai bông chủ đề). Sức chứa của các InstancedMesh tính từ đây. */
export const FLOWERS = 12;
export const BUDS = 20;
export const PETALS_PER_FLOWER = RINGS.reduce((n, ring) => n + ring.count, 0); // 24
export const PETAL_CAPACITY = FLOWERS * PETALS_PER_FLOWER + BUDS * BUD.count;
// Hai bông "chủ đề" đặt tay ở tiền cảnh, hai bên lối trăng (như bông sen giữa poster): bố cục không phó mặc cho số ngẫu nhiên.
const HERO = [
  { x: -7, z: 13, y: 1.9, scale: 2, open: 1, twist: 0.3 },
  { x: 7, z: 8, y: 1.4, scale: 1.7, open: 0.8, twist: 1.1 },
];

/**
 * Hình học MỘT cánh sen (dài 1): gốc ở (0, 0, 0), mũi chỉ +Y, lòng cánh hướng +Z.
 * Rộng nhất ở giữa, nhọn ở mũi; hai mép cong vào (lòng thìa), mũi hơi ngả ra ngoài.
 */
export function makePetalGeometry({ across = 6, along = 10, width = 0.5, cup = 0.1, bend = 0.12 } = {}) {
  const position = [];
  const uv = [];
  for (let j = 0; j <= along; j++) {
    const v = j / along;
    const half = (width / 2) * Math.sin(Math.PI * v ** 0.8) ** 0.7 + 0.004;
    for (let i = 0; i <= across; i++) {
      const u = (i / across) * 2 - 1;
      position.push(u * half, v, cup * u * u * (half / (width / 2)) - bend * v * v);
      uv.push(i / across, v);
    }
  }
  const index = [];
  const row = across + 1;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * row + i;
      index.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Chọn chỗ cho hoa và nụ: gần tâm các cụm lá, ngoài lối trăng. Cùng rng thì cùng kết quả.
 * @returns {{ flowers: object[], buds: object[] }}
 */
export function placeFlowers(rng, clumps, { flowers = FLOWERS, buds = BUDS, azimuth = 0 } = {}) {
  // Một nửa số hoa dồn về 5 cụm gần camera (z lớn) để tiền cảnh luôn có hoa.
  const near = [...clumps].sort((a, b) => b.z - a.z).slice(0, 5);
  const pick = (n, make) => {
    const out = [];
    for (let tries = 0; out.length < n && tries < n * 50; tries++) {
      const pool = out.length % 2 === 0 ? near : clumps;
      const c = pool[Math.floor(rng() * pool.length)];
      const a = rng() * Math.PI * 2;
      const r = c.r * 0.7 * Math.sqrt(rng());
      const x = c.x + Math.cos(a) * r;
      const z = c.z + Math.sin(a) * r;
      if (!inMoonPath(x, z, azimuth)) out.push({ x, z, ...make() });
    }
    return out;
  };
  return {
    flowers: [...HERO, ...pick(flowers - HERO.length, () => ({
      y: randRange(rng, 1.2, 2.6),
      scale: randRange(rng, 1.6, 2.2),
      open: randRange(rng, 0.7, 1), // mỗi bông nở một độ
      twist: rng() * Math.PI,
    }))],
    buds: pick(buds, () => ({ y: randRange(rng, 0.9, 2.2), scale: randRange(rng, 1.1, 1.5), twist: rng() * Math.PI })),
  };
}

/** Xoay vector v quanh trục đơn vị k một góc a (công thức Rodrigues), viết bằng TSL. */
const rotateAxis = (v, k, a) => v.mul(cos(a)).add(cross(k, v).mul(sin(a))).add(k.mul(dot(k, v)).mul(oneMinus(cos(a))));

/** Danh sách cánh của mọi bông (3 vòng) và nụ (khép), theo thứ tự: mỗi cánh một instance. */
function petalItems(flowers, buds) {
  const items = [];
  for (const f of flowers) {
    RINGS.forEach((ring, r) => {
      for (let k = 0; k < ring.count; k++) {
        const yaw = ((k + r * 0.5) / ring.count) * Math.PI * 2 + f.twist;
        items.push({ f, yaw, radius: ring.radius, tilt: ring.closed, range: (ring.open - ring.closed) * f.open, scale: ring.scale });
      }
    });
  }
  for (const b of buds) {
    for (let k = 0; k < BUD.count; k++) {
      items.push({ f: b, yaw: (k / BUD.count) * Math.PI * 2 + b.twist, radius: BUD.radius, tilt: BUD.tilt, range: 0, scale: BUD.scale });
    }
  }
  return items;
}

/**
 * Mọi cánh của mọi bông và nụ trong MỘT InstancedMesh (một draw call), cấp phát theo PETAL_CAPACITY.
 * Ma trận instance đặt cánh ở dáng KHÉP; positionNode ngả cánh ra quanh bản lề của nó thêm
 * `range × openness`. positionNode chạy SAU instancing (r186), nên bản lề và trục xoay tính theo
 * tọa độ của ao; normalLocal cũng xoay theo để ánh sáng đúng với cánh đã ngả.
 * @param {{ geometry: any, material: any, openness: any }} p
 */
export function makePetals({ geometry, material, openness }) {
  const mesh = new InstancedMesh(geometry, material, PETAL_CAPACITY);
  mesh.name = 'canh-sen';
  geometry.setAttribute('petalHinge', new InstancedBufferAttribute(new Float32Array(PETAL_CAPACITY * 4), 4));
  geometry.setAttribute('petalYaw', new InstancedBufferAttribute(new Float32Array(PETAL_CAPACITY), 1));
  const h = attribute('petalHinge', 'vec4');
  const yaw = attribute('petalYaw', 'float');
  const axis = vec3(sin(yaw), 0, cos(yaw).negate()); // trục nằm ngang, vuông góc với hướng cánh
  const angle = h.w.mul(openness);
  material.positionNode = Fn(() => {
    normalLocal.assign(rotateAxis(normalLocal, axis, angle));
    return rotateAxis(positionLocal.sub(h.xyz), axis, angle).add(h.xyz);
  })();
  return mesh;
}

/** Ghi cánh của `flowers` và `buds` vào mesh của makePetals: ma trận, bản lề (xyz + góc mở), hướng cánh. */
export function fillPetals(mesh, flowers, buds) {
  const items = petalItems(flowers, buds);
  const hinge = mesh.geometry.getAttribute('petalHinge');
  const yaws = mesh.geometry.getAttribute('petalYaw');
  const dummy = new Object3D();
  // Thứ tự 'YXZ': ma trận = Ry · Rx · Rz, nên cánh ngả quanh X trước, rồi mới quay theo hướng Y.
  dummy.rotation.order = 'YXZ';
  items.forEach(({ f, yaw, radius, tilt, range, scale }, i) => {
    const s = f.scale;
    const x = f.x + Math.cos(yaw) * radius * s;
    const z = f.z + Math.sin(yaw) * radius * s;
    dummy.position.set(x, f.y, z);
    dummy.rotation.set(-tilt, -yaw - Math.PI / 2, 0); // −Z cục bộ chỉ ra ngoài, lòng cánh (+Z) hướng vào tâm
    dummy.scale.setScalar(scale * s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    hinge.setXYZW(i, x, f.y, z, range);
    yaws.setX(i, yaw);
  });
  mesh.count = items.length;
  mesh.instanceMatrix.needsUpdate = true;
  hinge.needsUpdate = true;
  yaws.needsUpdate = true;
  mesh.computeBoundingSphere();
}

/** Ghép nhiều BufferGeometry có index thành một, kèm thuộc tính 'part' cho biết mảnh nào (0, 1…). */
function mergeParts(parts) {
  const out = { position: [], normal: [], uv: [], part: [] };
  const index = [];
  let offset = 0;
  parts.forEach(({ geometry, part }) => {
    for (const name of ['position', 'normal', 'uv']) out[name].push(...geometry.getAttribute(name).array);
    const n = geometry.getAttribute('position').count;
    for (let i = 0; i < n; i++) out.part.push(part);
    for (const i of geometry.getIndex().array) index.push(i + offset);
    offset += n;
    geometry.dispose();
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(out.position, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(out.normal, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(out.uv, 2));
  geometry.setAttribute('part', new Float32BufferAttribute(out.part, 1));
  geometry.setIndex(index);
  return geometry;
}

/** Gương sen (part 0) + 20 sợi nhị ngả ra (part 1), ghép thành MỘT hình để cả ao chỉ tốn một draw call. */
export function makeCoreGeometry() {
  const parts = [{ geometry: new CylinderGeometry(0.16, 0.1, 0.16, 14).translate(0, 0.08, 0), part: 0 }];
  const m = new Matrix4();
  const dummy = new Object3D();
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19);
    dummy.rotation.set(0, -a, -0.35, 'YXZ'); // ngả ra ngoài
    dummy.updateMatrix();
    m.copy(dummy.matrix);
    parts.push({ geometry: new BoxGeometry(0.018, 0.2, 0.018).translate(0, 0.1, 0).applyMatrix4(m), part: 1 });
  }
  return mergeParts(parts);
}

/** Gương sen: một instance cho mỗi bông đã nở (nụ không có), cấp phát cho FLOWERS bông. */
export function makeCores(material) {
  const mesh = new InstancedMesh(makeCoreGeometry(), material, FLOWERS);
  mesh.name = 'guong-sen';
  return mesh;
}

/** Ghi vị trí và cỡ của từng gương sen. */
export function fillCores(mesh, flowers) {
  const dummy = new Object3D();
  flowers.forEach((f, i) => {
    dummy.position.set(f.x, f.y, f.z);
    dummy.scale.setScalar(f.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.count = flowers.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
}
