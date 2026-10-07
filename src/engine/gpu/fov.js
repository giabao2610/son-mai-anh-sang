// engine/gpu/fov.js — fov dọc theo khung (minHorizontalFov); GĐ 8: bề cao khung nhìn của camera trực giao (minWidth; shortFrame ở canvas thấp).

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
 * Hệ số nới khung nhìn trực giao ở canvas thấp (CameraSpec.shortFrame, sau điểm duyệt ảnh GĐ 8). Chữ của trang (tên tranh, gợi ý, thơ)
 * có cỡ CSS cố định, nên ở canvas thấp nó chiếm phần lớn hơn của bề cao, còn tờ tranh vẫn chiếm phần cũ: chữ đè lên tranh. Dưới `below`
 * điểm ảnh CSS, bề cao khung nhìn nhân với below / bề cao canvas: phần bề cao mà tờ tranh chiếm co lại theo bề cao canvas, nên dải ván
 * trên và dưới tranh còn gần bằng số điểm ảnh của chúng ở `below` (tranh chiếm chừng nửa khung). Hệ số có trần `maxGrow`: điện thoại
 * xoay ngang (cao chừng 390) giữ được tranh đủ lớn, chịu chữ đè một phần như ba bức đầu.
 * @param {{ below: number, maxGrow: number } | undefined} shortFrame
 * @param {number} [cssHeight]   bề cao canvas (điểm ảnh CSS); thiếu hay không hợp lệ thì không nới
 * @returns {number} 1 khi không nới
 */
export function shortGrow(shortFrame, cssHeight) {
  if (!shortFrame || !(cssHeight > 0) || !Number.isFinite(cssHeight) || cssHeight >= shortFrame.below) return 1;
  return Math.min(shortFrame.below / cssHeight, shortFrame.maxGrow);
}

/**
 * Bề cao khung nhìn (đơn vị cảnh, ở zoom 1) của camera trực giao ở khung tỉ lệ `aspect`. Camera trực giao không có góc: bề ngang thấy
 * được là bề cao × aspect. Khung rộng giữ `height` của bức; khung hẹp hơn thì nới bề cao vừa đủ để bề ngang thấy `minWidth`, có trần.
 * Canvas thấp hơn `shortFrame.below` thì nới theo shortGrow. Hai cách nới đều là cận dưới của bề cao: lấy số lớn hơn, không nhân dồn.
 * @param {{ height: number, minWidth?: number, shortFrame?: { below: number, maxGrow: number } }} spec   CameraSpec của bức
 * @param {number} aspect
 * @param {number} [cssHeight]   bề cao canvas (điểm ảnh CSS), stage.js truyền mỗi lần đổi cỡ
 * @returns {number}
 */
export function fitOrtho(spec, aspect, cssHeight) {
  const narrow = spec.minWidth && aspect > 0 && Number.isFinite(aspect) ? Math.min(spec.minWidth / aspect, spec.height * MAX_ORTHO) : 0;
  return Math.max(spec.height, narrow, spec.height * shortGrow(spec.shortFrame, cssHeight));
}
