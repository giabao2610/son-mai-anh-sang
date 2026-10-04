// paintings/den-keo-quan/parts/gian-nha-vat-lieu.js — của lớp Gian nhà: texture thủ tục bằng TSL (gạch bát, vôi loang, vân gỗ, tre có đốt, sơn son), không dùng ảnh nào.
import { color, float, floor, fract, hash, min, mix, positionWorld, sin, smoothstep, uniform, vec3 } from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

/** Ván trần rộng bao nhiêu (m, theo z); tre có đốt cách nhau bao nhiêu (m). */
const PLANK = 0.2;
const KNOT = 1 / 6;
/** "Một màu cho tất cả": màu trung bình của căn phòng (tuyến tính). */
const GRAY = 0.45;

/** 1 ở giữa ô `f` (fract), về 0 ở mép ô trong bề rộng `width`: mạch vữa, khe ván, đốt tre. */
const awayFromEdge = (f, width) => smoothstep(0, width, min(f, f.oneMinus()));

/**
 * Sơn các material của Cốt (lớp không thêm vật nào). Mọi màu là mix(đất sét, màu, w): mài Gian nhà về 0 là về Cốt.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {Record<string, any>} materials  shared.cot.materials: san, vach, tran, go (xà, đế đèn, dây), cot (Physical), tre, nen
 * @param {{ w: any, u: { tileSize: any, stain: any, grain: any, clearcoat: any, octaves: any } }} p
 *   u.octaves là NODE (min(núm, trần)): fbm chạy vòng lặp thật trong shader, đổi số tầng không biên dịch lại
 * @returns {{ flat: any, raw: any }}  uniform của hai thí nghiệm ("Một màu cho tất cả", "Xem lưới gạch")
 */
export function paintRoom(ctx, materials, { w, u }) {
  const paint = (token) => color(ctx.palette.hex[token]);
  const clay = paint('datSet');
  const flat = uniform(0).setName('roomFlat');
  const raw = uniform(0).setName('roomRawTiles');
  const noise = (p) => fbm(p, { octaves: u.octaves }).mul(0.5).add(0.5); // về [0, 1]
  /** Màu cuối: "Một màu cho tất cả" thay màu sơn; trọng số trộn với đất sét (Cốt luôn là đất sét). */
  const finish = (c) => mix(clay, mix(c, vec3(GRAY), flat), w);
  const rough = (r) => mix(float(0.9), r, w); // đất sét của Cốt nhám 0,9

  // Gạch bát: lưới ô theo tọa độ sàn; mỗi viên một màu theo hash của chỉ số viên, mòn không đều theo fbm, mạch vữa ở mép ô.
  const q = positionWorld.xz.div(u.tileSize);
  const cell = floor(q);
  // hash của three đổi seed sang uint: cộng 64 cho chỉ số luôn dương (sàn rộng 5 m, ô nhỏ nhất 0,2 m: |chỉ số| ≤ 13).
  const seed = hash(cell.x.add(64).add(cell.y.add(64).mul(128)));
  const f = fract(q);
  const tile = min(awayFromEdge(f.x, 0.04), awayFromEdge(f.y, 0.04)); // 0 trong mạch, 1 trong viên
  const wear = noise(vec3(q.x, 0, q.y).mul(3));
  // Đất nung: đỏ son ngả vàng lá; mỗi viên lệch về cánh gián một chút (lệch nhiều thì sàn thành bàn cờ).
  const terracotta = mix(paint('doSon'), paint('vangLa'), 0.25).mul(0.7);
  const brick = mix(terracotta, paint('canhGian').mul(1.5), seed.mul(0.5)).mul(mix(float(0.8), float(1.05), wear));
  const joints = mix(paint('datSet').mul(0.5), brick, tile);
  // "Xem lưới gạch": màu giả (vẫn trong bảng sơn mài): mạch vàng lá, viên chàm hay xanh lục theo hash.
  const tiles = mix(paint('vangLa'), mix(paint('cham'), paint('xanhLuc'), seed), tile);
  materials.san.colorNode = finish(mix(joints, tiles, raw));
  materials.san.roughnessNode = rough(mix(float(0.95), float(0.75).add(seed.sub(0.5).mul(0.3)), tile));

  // Vôi: ngà loang bạc theo fbm, chân vách thẫm dần (ẩm, bụi).
  const p = positionWorld;
  const lime = mix(paint('nga').mul(0.85), paint('bacLa'), noise(p.mul(1.5)).mul(u.stain));
  materials.vach.colorNode = finish(lime.mul(mix(float(0.7), float(1), smoothstep(0, 0.6, p.y))));
  materials.vach.roughnessNode = rough(float(0.9));

  // Gỗ: vân chạy dọc theo x (xà và ván nằm dọc trục x), nên vân đổi theo y + z, bị fbm làm cong. Vân cách nhau ~5 cm: mịn
  // hơn thì răng cưa ở khoảng cách của camera. Nâu vừa (không tối hẳn), để vầng sáng của chong chóng trên trần còn thấy.
  const rings = sin(p.y.add(p.z).add(noise(p.mul(2)).mul(u.grain).mul(0.1)).mul(120)).mul(0.5).add(0.5);
  const wood = mix(paint('canhGian').mul(2.5), mix(paint('canhGian'), paint('vangLa'), 0.35), rings);
  materials.go.colorNode = finish(wood);
  materials.go.roughnessNode = rough(float(0.7));
  // Trần: ván gỗ ghép, khe ván tối.
  materials.tran.colorNode = finish(wood.mul(mix(float(0.4), float(1), awayFromEdge(fract(p.z.div(PLANK)), 0.03))));
  materials.tran.roughnessNode = rough(float(0.75));

  // Tre (khung đèn, tua): vàng lá ngả nâu, có đốt.
  const knots = awayFromEdge(fract(p.y.div(KNOT)), 0.05);
  materials.tre.colorNode = finish(paint('vangLa').mul(0.6).mul(mix(float(0.55), float(1), knots)));
  materials.tre.roughnessNode = rough(float(0.6));
  // Sáp nến.
  materials.nen.colorNode = finish(paint('nga').mul(0.95));
  materials.nen.roughnessNode = rough(float(0.5));

  // Sơn son: đỏ son, lớp phủ bóng (clearcoat) soi vệt sáng của ngọn đèn. Material là Physical từ Cốt (đổi loại là biên dịch lại).
  materials.cot.colorNode = finish(paint('doSon'));
  materials.cot.roughnessNode = rough(float(0.4));
  materials.cot.clearcoatNode = u.clearcoat.mul(w);
  materials.cot.clearcoatRoughnessNode = float(0.15);

  return { flat, raw };
}
