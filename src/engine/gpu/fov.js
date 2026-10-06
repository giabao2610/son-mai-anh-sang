// engine/gpu/fov.js — fov dọc theo khung (minHorizontalFov); GĐ 8: bề cao khung nhìn của camera trực giao (minWidth).

/** Trần của fov dọc (độ): khung hẹp bất thường (cửa sổ kéo thành một dải) không biến camera thành mắt cá. */
const MAX_FOV = 100;
const RAD = Math.PI / 180;

/**
 * fov dọc (độ) cho camera ở khung tỉ lệ `aspect` (rộng / cao). fov của three là góc DỌC, nên khung càng hẹp thì góc ngang càng nhỏ:
 * ở điện thoại dọc, vật vừa khung máy tính bị cắt hai bên. Bức không khai báo minHorizontalFov, hay khung đã đủ góc ngang, thì giữ fov
 * của bức; khung hẹp hơn thì nới fov dọc vừa đủ để góc ngang bằng minHorizontalFov. Camera không dời: khoảng cách vẫn do người xem chọn.
 * @param {{ fov: number, minHorizontalFov?: number }} spec   CameraSpec của bức
 * @param {number} aspect
 * @returns {number}
 */
export function fitFov(spec, aspect) {
  if (!spec.minHorizontalFov || !(aspect > 0) || !Number.isFinite(aspect)) return spec.fov;
  const needed = (2 * Math.atan(Math.tan((spec.minHorizontalFov * RAD) / 2) / aspect)) / RAD;
  return Math.max(spec.fov, Math.min(needed, MAX_FOV));
}

/** Trần bề cao khung nhìn trực giao: chừng này lần `height` của bức (khung hẹp bất thường không thu tờ tranh thành một dải). */
const MAX_ORTHO = 4;

/**
 * Bề cao khung nhìn (đơn vị cảnh, ở zoom 1) của camera trực giao ở khung tỉ lệ `aspect`. Camera trực giao không có góc: bề ngang thấy
 * được là bề cao × aspect. Khung rộng giữ `height` của bức; khung hẹp hơn thì nới bề cao vừa đủ để bề ngang thấy `minWidth`, có trần.
 * @param {{ height: number, minWidth?: number }} spec   CameraSpec của bức
 * @param {number} aspect
 * @returns {number}
 */
export function fitOrtho(spec, aspect) {
  if (!spec.minWidth || !(aspect > 0) || !Number.isFinite(aspect)) return spec.height;
  return Math.max(spec.height, Math.min(spec.minWidth / aspect, spec.height * MAX_ORTHO));
}
