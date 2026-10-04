// paintings/den-keo-quan/layers/l4-giay.js — Lớp 4 · Giấy: giấy dó nhuộm sáng lên từ bên trong (ánh sáng xuyên mặt mỏng), và nhuộm màu ánh sáng đi ra phòng.
import {
  Fn, atan, color, dot, exp, float, floor, fract, max, min, mix, normalWorld, positionLocal, positionWorld, smoothstep, uniform,
  uniformArray, vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

export const id = 'giay';

export const knobs = [
  { id: 'thickness', min: 0, max: 1, step: 0.01, value: 0.4 },
  { id: 'dye', min: 0, max: 1, step: 0.01, value: 0.9 },
  { id: 'fiber', min: 0, max: 1, step: 0.01, value: 0.5 },
];

const TAU = Math.PI * 2;
/** Độ đục của giấy dó: độ thấu = exp(−SIGMA × độ dày). */
const SIGMA = 2.2;
/**
 * Giấy sáng bao nhiêu so với phép tính vật lý. Thật ra giấy cách lửa 15 cm sáng gấp vài trăm lần vách cách 1,9 m; màn hình không chứa
 * nổi khoảng đó: AgX nén giấy về trắng và mất màu nhuộm. Như người vẽ, ta hạ riêng độ sáng của giấy cho màu còn đọc được (lõi chừng 1–2).
 */
const EXPOSURE = 0.04;
/** "Giấy trong suốt": còn lại bao nhiêu độ đục. */
const CLEAR = 0.15;

/**
 * Sáu màu giấy theo thứ tự quanh đèn (spec §18.3), bắt đầu từ tấm quay về camera và đi theo chiều góc atan(z, x) giảm (tấm k nằm
 * giữa góc π/2 − k·2π/sides, xem cornerAngles): tấm nhìn ra vách sau là vàng lá, góc sau bên trái là chàm (góc phòng tối và lạnh).
 */
export const PANEL_ORDER = Object.freeze(['vangLa', 'xanhLuc', 'doSon', 'vangLa', 'cham', 'doSon']);

/**
 * Màu của 8 ô (đủ cho núm sides tối đa 8): rải sáu màu đều quanh đèn theo số cạnh, nên tấm nhìn ra vách sau (k = sides / 2) luôn là
 * vàng lá. Ô k ≥ sides không dùng tới.
 * @param {number} sides
 */
export function panelTints(sides) {
  const n = PANEL_ORDER.length;
  return Array.from({ length: 8 }, (_, k) => PANEL_ORDER[Math.min(Math.floor((k * n) / sides + 1e-9), n - 1)]);
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (đèn, giấy, material), shared.ngonNen (đèn, vị trí, công suất, sắc nến); ghi shared.giay
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { lantern, materials } = shared.cot;
  const { light, candle, power, color: candleColor } = shared.ngonNen;
  const paper = lantern.paper; // số đo: r, y0, y1
  // Màu từng tấm: mảng uniform 8 ô, three đọc lại mỗi lần vẽ. Đổi số cạnh chỉ ghi lại mảng (update), không biên dịch lại.
  const colors = panelTints(lantern.sides.value).map((t) => ctx.palette.color(t));
  const tints = uniformArray(colors, 'color').setName('paperTints');
  const dye = ctx.knob('dye'); // @knob dye
  const thickness = ctx.knob('thickness'); // @knob thickness
  const fiberKnob = ctx.knob('fiber'); // @knob fiber
  const fiberCap = uniform(1).setName('paperFiberCap'); // nấc 'soi' hạ trần này về 0; hiệu lực = min(núm, trần)
  const noFiber = uniform(0).setName('paperNoFiber');
  const opacity = uniform(1).setName('paperOpacity');
  const plain = color(ctx.palette.hex.giayDo);

  /** Tấm giấy chứa góc phi (atan(z, x)); kẹp về sides − 1 (fract làm tròn lên 1 thì không tra quá mảng). */
  const panelAt = (phi) => min(
    floor(fract(float(Math.PI / 2).sub(phi).div(TAU).add(float(0.5).div(lantern.sides))).mul(lantern.sides)),
    lantern.sides.sub(1),
  ).toInt();
  const tintOf = (phi) => mix(plain, tints.element(panelAt(phi)), dye);
  /** Màu mà tia từ lửa tới P mang theo khi ra khỏi đèn: màu tấm giấy nó đi qua; qua miệng trên (lên trần) thì giữ màu nến. */
  const tintAt = Fn(([P]) => {
    const out = lantern.cylinderExit(P, candle, lantern.axisNode, float(paper.r)).toVar(); // lăng trụ coi như ống tròn
    const through = smoothstep(paper.y0 - 0.005, paper.y0 + 0.005, out.y)
      .mul(float(1).sub(smoothstep(paper.y1 - 0.005, paper.y1 + 0.005, out.y)));
    return mix(vec3(1), tintOf(out.x), through);
  });
  shared.giay = { tintAt, tints };

  // Sợi giấy: noise kéo dài theo chiều đứng (tọa độ đã giãn); số tầng theo mức (số JS: đồ thị cố định cho mỗi mức).
  const fiber = fbm(positionLocal.mul(vec3(40, 4, 40)), { octaves: ctx.budget.fiber ?? 2 });
  const fiberK = min(fiberKnob, fiberCap).mul(float(1).sub(noFiber));

  // Ánh sáng xuyên mặt mỏng: nhìn mặt ngoài, nhưng tính ánh nến chiếu vào MẶT TRONG (pháp tuyến ngược lại). Bức xạ ra = độ rọi ở mặt
  // trong × độ thấu / π (giấy tán xạ đều như mặt Lambert). Giấy không xoay và tâm mesh nằm trên trục: góc cục bộ là góc quanh trục.
  const glow = Fn(() => {
    const L = candle.sub(positionWorld).toVar();
    const r2 = max(dot(L, L), 1e-4);
    const cosIn = max(dot(normalWorld.negate(), L.normalize()), 0);
    const T = exp(thickness.mul(-SIGMA));
    const own = tintOf(atan(positionLocal.z, positionLocal.x));
    const fibers = mix(float(1), fiber.mul(0.5).add(0.75), fiberK);
    return candleColor.mul(power).mul(cosIn).div(r2).mul(T).mul(own).mul(fibers).mul(EXPOSURE / Math.PI);
  })();
  const mat = materials.giay; // của Cốt
  mat.transparent = true; // đặt TRƯỚC lần biên dịch đầu (nằm trong cache key): "Giấy trong suốt" chỉ đổi uniform opacity
  mat.opacityNode = mix(float(1), opacity, w); // mài Giấy về 0 thì giấy đặc lại như đất sét, dù "Giấy trong suốt" đang bật
  mat.colorNode = mix(color(ctx.palette.hex.datSet), plain.mul(0.35), w); // mặt ngoài dưới ánh đêm: giấy hơi ngà
  mat.emissiveNode = glow.mul(w);
  // Trống và chong chóng cũng là giấy (chỉ thấy khi giấy trong suốt): giấy dó sẫm.
  for (const key of ['trong', 'canh']) materials[key].colorNode = mix(color(ctx.palette.hex.datSet), plain.mul(0.25), w);
  // Ánh sáng ra phòng mang màu tấm giấy nó vừa đi qua (vec3: đèn có màu). Lớp Kéo quân nhân tiếp bóng hình nhân vào node này.
  light.shadow.shadowNode = light.shadow.shadowNode.mul(mix(vec3(1), tintAt(positionWorld), w));

  let seen = shared.cot.version;
  return {
    objects: [],
    update() {
      if (shared.cot.version === seen) return;
      seen = shared.cot.version; // Cốt đổi hình (số cạnh): rải lại màu cho đủ tấm
      panelTints(lantern.sides.value).forEach((t, k) => colors[k].copy(ctx.palette.color(t)));
    },
    experiments: [
      { id: 'clear', toggle: (on) => { opacity.value = on ? CLEAR : 1; } },
      { id: 'noFiber', toggle: (on) => { noFiber.value = on ? 1 : 0; } },
    ],
    readouts: [{ id: 'transmit', get: () => Math.round(Math.exp(-SIGMA * thickness.value) * 100), unit: '%' }],
    // Sợi giấy chạy ở mọi mức (số tầng theo mức), nên nấc 'soi' luôn có tác dụng.
    degrade: [
      {
        id: 'soi',
        apply() { fiberCap.value = 0; },
        revert() { fiberCap.value = 1; },
      },
    ],
    dispose() {}, // material thuộc Cốt: Cốt gỡ
  };
}
