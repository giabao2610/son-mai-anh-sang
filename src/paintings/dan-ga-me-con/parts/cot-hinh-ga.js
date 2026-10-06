// paintings/dan-ga-me-con/parts/cot-hinh-ga.js — của lớp Cốt: hình gà ghép từ khối cơ bản thành một BufferGeometry, mỗi đỉnh mang thuộc tính `part` (mình, đầu, mỏ…); bản khung chỉ có mình và đầu (Task 4 thêm đủ phần và positionNode).
import { BufferAttribute, SphereGeometry } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { HEN } from './cot-bo-cuc.js';

/** Phần của hình gà (thuộc tính `part`, số thực). Mọi phần từ HEAD trở lên đi theo đầu khi cúi, gật, ngoảnh. */
export const PART = Object.freeze({ BODY: 0, TAIL: 1, LEG: 2, WING: 3, HEAD: 4, BEAK: 5, COMB: 6, EYE: 7, BEE: 8 });

/** Một khối đã đặt chỗ, mọi đỉnh mang `part`. Bỏ index: mergeGeometries cần mọi geometry cùng có hay cùng không có index. */
export function piece(geometry, part) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.setAttribute('part', new BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
  return g;
}

/** Cầu kéo dãn: bán kính r, tỉ lệ [sx, sy, sz], tâm [x, y, z]; `segments` vòng quanh (núm Cốt). */
export const blob = (r, scale, center, segments) =>
  new SphereGeometry(r, segments, Math.max(6, Math.round(segments * 0.6))).scale(...scale).translate(...center);

/**
 * Gà con trong khung của chính nó: chân ở gốc tọa độ, phía trước +z, lên +y. Mình là cầu kéo dãn bán kính 0,45, tâm ở y 0,45; đầu là
 * cầu bán kính 0,3 ở phía trước, trên mình.
 * @param {{ segments: number }} p
 */
export function chickGeometry({ segments }) {
  return mergeGeometries([
    piece(blob(0.45, [1, 0.9, 1.25], [0, 0.45, 0], segments), PART.BODY),
    piece(blob(0.3, [1, 1, 1], [0, 0.85, 0.4], segments), PART.HEAD),
  ]);
}

/**
 * Gà mẹ dựng như gà con rồi xoay sẵn sang HEN.heading và dời tới HEN.at, nên tọa độ của mesh là tọa độ thế giới. Mình là cầu kéo dãn bán
 * kính 1, tâm ở y 1,6; đầu là cầu bán kính 0,6. Task 4 thêm hai cánh (wingL, wingR).
 * @param {{ segments: number }} p
 * @returns {{ body: import('three/webgpu').BufferGeometry }}
 */
export function henGeometry({ segments }) {
  const body = mergeGeometries([
    piece(blob(1, [1.2, 1.1, 2], [0, 1.6, 0], segments), PART.BODY),
    piece(blob(0.6, [1, 1, 1], [0, 2.7, 1.6], segments), PART.HEAD),
  ]);
  return { body: body.rotateY(HEN.heading).translate(HEN.at[0], 0, HEN.at[1]) };
}
