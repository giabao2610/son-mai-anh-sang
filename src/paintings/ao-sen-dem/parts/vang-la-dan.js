// paintings/ao-sen-dem/parts/vang-la-dan.js — của lớp Vàng lá: luật chung của đàn đom đóm (GPU và CPU cùng dùng) và Sprite vẽ cả đàn.
import { AdditiveBlending, NormalBlending, Sprite, SpriteNodeMaterial } from 'three/webgpu';
import { color, float, fract, oneMinus, shapeCircle, sin, smoothstep, vec3 } from 'three/tsl';

/**
 * Luật bay, dùng chung cho kernel GPU (l5-vang-la.js) và bản JS (vang-la-cpu.js): hai bên tính CÙNG một việc,
 * nên "CPU vs GPU" so đúng cái giá của việc tính, không phải hai cách bay khác nhau.
 */
export const FLOCK = Object.freeze({
  radius: 40, // đàn lượn trong đĩa bán kính này
  low: 0.3, // và trong khoảng độ cao [low, high] trên mặt nước
  high: 4,
  maxSpeed: 6, // bung ra nhanh cỡ nào cũng không văng khỏi ao
  flow: 0.4, // curl noise (độ lớn vài đơn vị) nhân hệ số này thành vận tốc muốn bay
  lift: 0.35, // dòng xoáy theo phương đứng yếu hơn: đom đóm trôi ngang là chính
  drift: 0.05, // trường curl trôi lên theo thời gian (đơn vị noise mỗi giây): dòng bay đổi dần
  swirl: 0.012, // xoáy chậm quanh tâm ao
  turn: 1.5, // quán tính: mỗi giây vận tốc ngả chừng này phần về hướng muốn bay
  reach: 10, // lực của tay giảm theo exp(−khoảng cách / reach)
  orbit: 0.8, // thành phần bay vòng quanh tay
  pull: 8, // hệ số của lực hút/đẩy
});

/**
 * MỘT Sprite vẽ cả đàn (instancing): mỗi bản sao đọc vị trí và pha từ `cell` (vec4: xyz vị trí, w pha nháy),
 * tức một bộ đệm GPU (compute) hay một thuộc tính instance do CPU ghi. Mỗi con nháy theo nhịp riêng, chỉ phát sáng,
 * cộng dồn (additive), và tắt dần trong sương.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ cell: any, w: any, fogFactor: any, count: number }} p
 */
export function createFireflySprite(ctx, { cell, w, fogFactor, count }) {
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  // fog của three trộn MÀU ĐẦU RA về màu sương (Phụ lục A.34): với additive, mỗi con sẽ cộng thêm một đĩa màu sương.
  // Nên tắt fog và tự nhân (1 − hệ số sương): trong sương dày, đom đóm mờ đi thay vì hóa đốm sương.
  material.fog = false;
  material.positionNode = cell.xyz;
  const phase = cell.w;
  const rate = float(1.2).add(fract(phase.mul(7.31)).mul(1.8)).mul(ctx.knob('blinkRate')); // @knob blinkRate
  // Chỉ lóe khi sin > 0.75 (khoảng 1/4 chu kỳ): cả nghìn con cùng sáng thì bloom phủ vàng kín khung.
  const blink = smoothstep(0.75, 1, sin(ctx.u.time.mul(rate).add(phase.mul(Math.PI * 2))));
  const shape = shapeCircle(); // đĩa tròn trên ô vuông của sprite
  const gold = color(ctx.palette.hex.vangLaSang);
  material.colorNode = vec3(0); // chỉ phát sáng: không cộng thêm màu trắng mặc định của sprite
  material.emissiveNode = gold.mul(ctx.knob('glow')).mul(blink).mul(shape).mul(w).mul(oneMinus(fogFactor)); // @knob glow
  material.opacityNode = shape.mul(w); // trọng số 0 → tắt hẳn
  material.scaleNode = ctx.knob('size'); // @knob size

  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false; // bounding của sprite không biết vị trí nằm trong bộ đệm
  return sprite;
}

/**
 * Thí nghiệm "Tắt additive": blending thường thì con vẽ sau che con vẽ trước (bất kể xa gần, vì không ghi độ sâu),
 * và con đang tắt thành đốm tối. Blending nằm trong cache key: đổi là biên dịch lại một lần.
 * @param {import('three/webgpu').Sprite} sprite
 * @param {boolean} additive
 */
export function setAdditive(sprite, additive) {
  sprite.material.blending = additive ? AdditiveBlending : NormalBlending;
  sprite.material.needsUpdate = true;
}
