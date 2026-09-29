// paintings/ao-sen-dem/parts/anh-trang-shadow.js — của lớp Ánh trăng: khung chiếu bóng ôm sát ao theo hướng trăng; shadow map chỉ vẽ lại khi cần.
import { Matrix4, Vector3 } from 'three/webgpu';

/** Đèn trăng đứng cách tâm ao chừng này, theo hướng trăng. */
export const LIGHT_DISTANCE = 150;
/** Khối trụ chứa mọi thứ đổ bóng và nhận bóng: lá, hoa, cuống trong bán kính của vùng lá (có lề), cao tới đỉnh hoa, lá đứng. */
export const SHADOW_BOX = Object.freeze({ radius: 54, height: 6 });
const MARGIN = 1; // lề quanh khung (đơn vị cảnh): mép bóng không bị cắt, và bù phần đa giác 16 cạnh hụt so với vòng tròn
const RIM = 16; // số điểm lấy trên mỗi vành (đáy, đỉnh) của khối trụ

const _look = new Matrix4();
const _eye = new Vector3();
const _origin = new Vector3();
const _up = new Vector3(0, 1, 0);
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _d = new Vector3();

/**
 * Khung (orthographic) của camera bóng vừa khít khối trụ, nhìn từ `dir × LIGHT_DISTANCE` về tâm ao. Cùng phép nhìn mà three
 * dùng trong LightShadow.updateMatrices: camera ở vị trí đèn, lookAt target của đèn (tâm ao), up = +y.
 * Khung cố định ±55 của GĐ 2 phí phần lớn chiều dọc: trăng thấp (4°–13°) nên nhìn từ trăng, cả ao dẹt lại thành một dải.
 * Cùng cỡ shadow map, khung càng nhỏ thì mỗi điểm ảnh của bóng càng mịn.
 * @param {import('three/webgpu').OrthographicCamera} camera  moonlight.shadow.camera
 * @param {import('three/webgpu').Vector3} dir  hướng (đơn vị) từ tâm ao tới trăng
 * @param {{ radius: number, height: number }} [box]
 * @returns {{ width: number, height: number }}  cỡ khung (đơn vị cảnh), để test đọc
 */
export function fitShadowCamera(camera, dir, box = SHADOW_BOX) {
  _eye.copy(dir).multiplyScalar(LIGHT_DISTANCE);
  _look.lookAt(_eye, _origin, _up).extractBasis(_x, _y, _z); // ba trục của camera, trong không gian thế giới
  let [left, right, bottom, top, near, far] = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < RIM; i++) {
    const a = (i / RIM) * Math.PI * 2;
    for (const y of [0, box.height]) {
      _d.set(Math.cos(a) * box.radius, y, Math.sin(a) * box.radius).sub(_eye);
      const u = _d.dot(_x);
      const v = _d.dot(_y);
      const depth = -_d.dot(_z); // camera nhìn về −z của chính nó
      [left, right, bottom, top] = [Math.min(left, u), Math.max(right, u), Math.min(bottom, v), Math.max(top, v)];
      [near, far] = [Math.min(near, depth), Math.max(far, depth)];
    }
  }
  Object.assign(camera, {
    left: left - MARGIN,
    right: right + MARGIN,
    bottom: bottom - MARGIN,
    top: top + MARGIN,
    near: Math.max(0.5, near - MARGIN),
    far: far + MARGIN,
  });
  camera.updateProjectionMatrix(); // three không tự tính lại ma trận chiếu của camera bóng
  return { width: right - left, height: top - bottom };
}

/**
 * Shadow map TĨNH: `autoUpdate = false`, chỉ vẽ lại khi có thứ đổi. check() chạy mỗi khung (rẻ: vài phép so sánh);
 * có gì khác lần trước thì khớp lại khung bóng và đặt `needsUpdate = true`, ShadowNode vẽ lại MỘT lần rồi tự tắt cờ.
 * Thứ nhận bóng (lá nổi nhấp nhô theo sóng) không cần vẽ lại: nó tự tra shadow map theo vị trí của mình.
 * @param {{ shadow: any, dir: any, cot: { openness: any, version: number } }} p
 *   shadow: moonlight.shadow; dir: uniform hướng trăng; cot: shared.cot (độ nở hoa, số lần Cốt ghi lại hình)
 */
export function createShadowWatch({ shadow, dir, cot }) {
  shadow.autoUpdate = false;
  const seen = { dir: new Vector3(Number.NaN, 0, 0), open: Number.NaN, version: -1 };
  return {
    check() {
      const d = dir.value;
      if (seen.dir.equals(d) && seen.open === cot.openness.value && seen.version === cot.version) return false;
      seen.dir.copy(d);
      seen.open = cot.openness.value;
      seen.version = cot.version;
      fitShadowCamera(shadow.camera, d);
      shadow.needsUpdate = true;
      return true;
    },
  };
}
