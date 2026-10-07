// engine/gpu/camera.js — camera của sân khấu theo CameraSpec: phối cảnh (mặc định) hay trực giao (GĐ 8); khớp khung khi đổi cỡ; giới hạn OrbitControls theo loại camera.
import { OrthographicCamera, PerspectiveCamera } from 'three/webgpu';
import { fitFov, fitOrtho } from './fov.js';

/** Near và far của mọi camera sân khấu (đơn vị cảnh). Lớp đọc độ sâu trong post đổi nó ra đơn vị cảnh bằng hai số này (ctx.camera). */
export const NEAR = 0.1;
export const FAR = 500;

/** Bức nhìn bằng camera trực giao? Thiếu `kind` là phối cảnh, như ba bức đầu. */
export const isOrtho = (spec) => spec?.kind === 'ortho';

/**
 * Camera đúng loại cho `spec`, đặt ở `spec.position`, nhìn `spec.target` (OrbitControls.update() cũng làm vậy lúc chạy; làm sẵn ở đây
 * để test và tia chạm có camera đúng hướng ngay). Khung nhìn tính theo tỉ lệ khung `aspect` (và bề cao canvas, xem fitCamera).
 * @param {import('../contracts/runtime.js').CameraSpec} spec
 * @param {number} aspect   rộng / cao của canvas
 * @param {number} [cssHeight]   bề cao canvas (điểm ảnh CSS)
 */
export function createCamera(spec, aspect, cssHeight) {
  const camera = isOrtho(spec) ? new OrthographicCamera(-1, 1, 1, -1, NEAR, FAR) : new PerspectiveCamera(45, 1, NEAR, FAR);
  camera.position.set(...spec.position);
  camera.lookAt(...spec.target);
  fitCamera(camera, spec, aspect, cssHeight);
  camera.updateMatrixWorld();
  return camera;
}

/**
 * Khớp khung (gọi mỗi lần đổi cỡ). Camera phối cảnh: aspect và fov (fitFov); bề cao canvas không dùng. Camera trực giao: bốn cạnh của
 * khung nhìn ở zoom 1 (fitOrtho, kể cả shortFrame theo bề cao canvas); zoom do OrbitControls đổi thì giữ nguyên, three chia cho zoom lúc
 * dựng ma trận chiếu.
 * @param {any} camera
 * @param {import('../contracts/runtime.js').CameraSpec} spec
 * @param {number} aspect
 * @param {number} [cssHeight]   bề cao canvas (điểm ảnh CSS); thiếu thì không nới theo shortFrame
 */
export function fitCamera(camera, spec, aspect, cssHeight) {
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  if (camera.isOrthographicCamera) {
    const half = fitOrtho(spec, ratio, cssHeight) / 2;
    camera.top = half;
    camera.bottom = -half;
    camera.right = half * ratio;
    camera.left = -half * ratio;
  } else {
    camera.aspect = ratio;
    camera.fov = fitFov(spec, ratio);
  }
  camera.updateProjectionMatrix();
}

/**
 * OrbitControls bị chặn trong giới hạn bức khai báo. Camera trực giao: lăn chuột, chụm hai ngón đổi `zoom` trong [min, max] của
 * spec.zoom, khoảng cách tới điểm nhìn đứng yên (Phụ lục A.92); thiếu spec.zoom thì không zoom. Camera phối cảnh: kẹp khoảng cách.
 * Damping là quán tính khi thả tay: cần gọi controls.update() mỗi khung (scene.js làm); giảm chuyển động thì tắt.
 * @param {any} controls   OrbitControls
 * @param {import('../contracts/runtime.js').CameraSpec} spec
 * @param {boolean} reducedMotion
 */
export function limitControls(controls, spec, reducedMotion) {
  controls.target.set(...spec.target);
  [controls.minAzimuthAngle, controls.maxAzimuthAngle] = spec.azimuth;
  [controls.minPolarAngle, controls.maxPolarAngle] = spec.polar;
  if (isOrtho(spec)) {
    controls.enableZoom = Boolean(spec.zoom);
    if (spec.zoom) [controls.minZoom, controls.maxZoom] = spec.zoom;
  } else {
    [controls.minDistance, controls.maxDistance] = spec.distance;
  }
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion;
}
