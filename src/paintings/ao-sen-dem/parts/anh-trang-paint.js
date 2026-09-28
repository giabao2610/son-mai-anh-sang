// paintings/ao-sen-dem/parts/anh-trang-paint.js — của lớp Ánh trăng: sơn màu ca dao lên đất sét của Cốt (lá xanh, bông trắng, nhị vàng).
import {
  abs,
  atan,
  attribute,
  cameraPosition,
  color,
  dot,
  float,
  length,
  mix,
  normalWorld,
  normalize,
  oneMinus,
  positionWorld,
  pow,
  saturate,
  sin,
  smoothstep,
  uv,
} from 'three/tsl';

/**
 * Mọi màu bắt đầu từ đất sét và đi qua mix(datSet, màu, w): trọng số 0 là về lại Cốt (luật 3).
 * Material vẫn là của Cốt; lớp này chỉ gán node MỘT lần lúc dựng (trước khi biên dịch).
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} cot  shared.cot
 * @param {any} w  trọng số của lớp
 * @param {any} moonDir  uniform vec3: hướng tới trăng (world)
 */
export function paintCot(ctx, cot, w, moonDir) {
  const hex = ctx.palette.hex;
  const clay = color(hex.datSet);
  const paint = (material, node) => {
    material.colorNode = mix(clay, node, w);
  };

  // Lá: xanh lục, gân tỏa từ rốn lá (atan(y, x) — TSL không có atan2), mép sẫm hơn giữa.
  const d = uv().sub(0.5);
  const r = length(d).mul(2);
  // Gân "dát vàng" như tranh sơn mài: mảnh, tỏa từ rốn lá ra mép.
  const veins = pow(abs(sin(atan(d.y, d.x).mul(11))), 40).mul(smoothstep(0.1, 0.45, r)).toVar();
  const leaf = mix(mix(color(hex.xanhLuc).mul(1.9), color(hex.xanhLuc).mul(1.2), r), color(hex.vangLa), veins);
  for (const material of [cot.leafMaterial, cot.standingMaterial]) {
    paint(material, leaf);
    // Gân là vàng thật (kim loại, bóng hơn) nên lóe lên khi ánh trăng lướt qua.
    material.metalnessNode = veins.mul(w);
    material.roughnessNode = mix(float(0.9), mix(float(0.8), float(0.35), veins), w);
    // Clearcoat: lớp bóng như sáp phủ trên lá; uniform của núm nhân trọng số, không biên dịch lại.
    material.clearcoatNode = ctx.knob('clearcoat').mul(w); // @knob clearcoat
    material.clearcoatRoughnessNode = float(0.5);
  }

  // Cánh: trắng ngà, ửng hồng nhạt ở đầu cánh (pha chút đỏ son vào ngà).
  const tip = smoothstep(0.55, 1, uv().y);
  paint(cot.petalMaterial, mix(color(hex.nga), mix(color(hex.nga), color(hex.doSon), 0.35), tip));
  cot.petalMaterial.sheenNode = color(hex.nga).mul(0.5).mul(w); // ánh nhung của cánh
  // Viền fresnel: mép cánh (nơi pháp tuyến gần vuông góc với hướng nhìn) sáng lên.
  // Ngược sáng: nhìn xuyên cánh về phía trăng thì cánh sáng như giấy dó trước đèn.
  const view = normalize(cameraPosition.sub(positionWorld));
  const edge = oneMinus(abs(dot(normalWorld, view)));
  const rimPower = ctx.knob('rimPower'); // @knob rimPower
  const rim = pow(edge, rimPower).mul(ctx.knob('rimColor')); // @knob rimColor
  const back = pow(saturate(dot(view.negate(), moonDir)), 4).mul(ctx.knob('translucency')); // @knob translucency
  cot.petalMaterial.emissiveNode = rim.mul(0.5).add(color(hex.nga).mul(back).mul(0.35)).mul(w);

  // Gương sen xanh vàng, nhị vàng lá (thuộc tính 'part' của Cốt: 0 gương, 1 nhị).
  paint(cot.coreMaterial, mix(mix(color(hex.xanhLuc), color(hex.vangLa), 0.45), color(hex.vangLa), attribute('part', 'float')));
  paint(cot.stemMaterial, color(hex.xanhLuc).mul(0.7));
  paint(cot.reedMaterial, mix(color(hex.canhGian), color(hex.xanhLuc), uv().y.mul(0.6)));
}
