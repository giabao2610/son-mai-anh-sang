// engine/gpu/draw-info.js — hàm thuần của DrawInfo (Từng sợi): loại vật, số bản và số tam giác của một lần vẽ, như three tính (tách từ draws.js).

/*
 * Chỗ DrawInfo chưa khớp three:
 * - móc ghi cả lần vẽ mà three rồi tự bỏ bên trong renderObject (count 0, pipeline chưa biên dịch xong), nên scene có thể lớn hơn
 *   số lần vẽ thật và other dừng ở 0;
 * - vật wireframe vẽ đoạn thẳng mà vẫn báo số tam giác của hình (Bức 1 gặp chỗ này khi người xem bật núm wireframe của Cốt);
 * - hai nhóm của một Mesh dùng chung một material thì chung một khóa: limit(k) giữ hay bỏ cả hai (Bức 1 không có Mesh nhiều material);
 * - vật trong suốt DoubleSide (forceSinglePass false, không có transmission; Bức 1 không có material như thế): renderObject của three
 *   tự vẽ hai lần ('backSide' rồi mặt trước) ngay trong MỘT lần gọi móc, nên đó là một sợi cho hai draw call (lần thừa vào other),
 *   và limit(k) giữ hay bỏ cả hai; Bản dịch (GĐ 9) chỉ đọc lượt mặt trước. Vật có transmission thì khác: three vẽ hai lượt, mỗi lượt
 *   một lần gọi móc (passId: 'backSide', rồi lượt thường).
 */

/** list() khi chưa có khung nào được ghi: đông cứng như list của một khung đã ghi. */
export const NONE = Object.freeze([]);

/** Loại vật như Từng sợi ghi (DrawInfo.kind). */
export const kindOf = (o) => (o.isInstancedMesh ? 'InstancedMesh' : o.isSprite ? 'Sprite' : o.isPoints ? 'Points' : o.isLine ? 'Line' : 'Mesh');

/**
 * Số bản của một lần vẽ, như three tính (RenderObject.getDrawParameters): instanceCount của InstancedBufferGeometry, không thì
 * object.count. Ở r186 Mesh, InstancedMesh và Sprite đều có count (Mesh mặc định 1); Points, Line không có: một bản.
 */
export const instancesOf = (object, geometry) => (geometry?.isInstancedBufferGeometry ? geometry.instanceCount : Math.max(0, object.count ?? 1));

/**
 * Số tam giác, như three đếm đỉnh của lần vẽ (RenderObject.getDrawParameters): khúc drawRange của hình, cắt theo nhóm (group: Mesh
 * nhiều material vẽ mỗi nhóm một lần) và theo số chỉ số (hay số đỉnh, khi không có index); / 3 × số bản. Sprite là một quad;
 * Points, Line không vẽ tam giác.
 */
export function trianglesOf(object, geometry, group, instances) {
  if (object.isSprite) return 2 * instances;
  if (object.isPoints || object.isLine) return 0;
  const range = geometry?.drawRange ?? { start: 0, count: Infinity };
  const first = Math.max(range.start, group?.start ?? 0, 0);
  const last = Math.min(range.start + range.count, group ? group.start + group.count : Infinity);
  const items = geometry?.index ? geometry.index.count : (geometry?.attributes?.position?.count ?? 0);
  return Math.floor(Math.max(0, Math.min(last, items) - first) / 3) * instances;
}
