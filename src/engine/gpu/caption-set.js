// engine/gpu/caption-set.js — chữ đi theo vật (GĐ 5): ctx.captions của bức (khóa → chữ), chiếu điểm neo ra màn hình mỗi khung, giờ theo đồng hồ cảnh.
import { Vector3 } from 'three/webgpu';
import { CAPTION_FADE, CAPTION_SECONDS } from '../../ui/captions.js';

/**
 * Bức chỉ cầm KHÓA, không cầm chữ (code của bức không chứa chữ nào cho người xem): `ctx.captions.show(khóa, anchor)`
 * lấy câu ở content.captions[khóa], và anchor() trả vị trí 3D (toạ độ thế giới) của điểm neo ở mỗi khung, hay null khi
 * khung đó không có điểm neo. Mỗi lúc một dòng: show mới thay dòng đang hiện.
 *
 * scene.js gọi step() mỗi khung, SAU controls.update() (camera đã đứng yên cho khung này) và TRƯỚC render(), và cả khi vẽ
 * lại khung đứng yên (?freeze: camera có thể vừa bị kéo). Không có chữ thì step() trả về ngay, không chiếu gì.
 * anchor() hỏng (ném lỗi, trả undefined hay số không hữu hạn) là lỗi của bức: chữ ẩn ở khung đó, cảnh báo một lần cho mỗi
 * dòng chữ, không tính là khung lỗi (spec §9).
 *
 * @param {object} p
 * @param {Record<string, { lines: string[], source: string, author?: string }>} [p.captions]  content.captions của bức;
 *                                       thiếu (bức không có, hay chữ tải hỏng) thì keys rỗng
 * @param {ReturnType<import('../../ui/captions.js').mountCaptions>} p.ui   vùng chữ trong [data-stage]
 * @param {import('three/webgpu').PerspectiveCamera} p.camera   camera của cảnh (đọc near, far)
 * @param {{ value: number }} p.time      đồng hồ của cảnh (stage.u.time)
 * @param {() => { width: number, height: number }} p.size   cỡ canvas (px CSS), cũng là cỡ của vùng chữ
 * @param {boolean} [p.debug]             ?debug: cảnh báo khi bức gọi một khóa không có chữ
 * @returns {{ api: { keys: string[], show: (key: string, anchor: () => ({ x: number, y: number, z: number } | null)) => void },
 *   step: () => void, dispose: () => void }}
 */
export function createCaptionSet({ captions = {}, ui, camera, time, size, debug = false }) {
  const keys = Object.freeze(Object.keys(captions));
  const point = new Vector3(); // dùng lại mỗi khung, không cấp phát: toạ độ thế giới → toạ độ camera → NDC
  let current = null; // { key, anchor, until, fading, warned } của dòng đang hiện; null khi không có chữ
  let disposed = false;

  // Ẩn chữ ở khung này: ui/captions.js gắn data-away (opacity 0), chữ vẫn nằm trong vùng live, transform cũ để nguyên.
  const hide = () => ui.place(0, 0, false);
  const warnOnce = (message, detail) => {
    if (current.warned) return;
    current.warned = true;
    console.warn(message, detail);
  };

  /** Một khung: hết giờ thì gỡ, gần hết thì tan, rồi đặt chữ theo điểm neo (hay ẩn khi điểm neo ra ngoài khung). */
  function step() {
    if (!current) return;
    const t = time.value;
    if (t >= current.until) {
      ui.clear();
      current = null;
      return;
    }
    if (!current.fading && t >= current.until - CAPTION_FADE) {
      current.fading = true;
      ui.fade();
    }
    let at;
    try {
      at = current.anchor();
    } catch (err) {
      warnOnce(`Chữ "${current.key}": anchor() ném lỗi, chữ ẩn ở khung đó (chỉ báo một lần):`, err);
      hide();
      return;
    }
    if (at === null) {
      hide(); // bức nói khung này không có điểm neo: không phải lỗi
      return;
    }
    // undefined (bức quên return), thiếu trục, số không hữu hạn: lỗi của bức.
    if (!(Number.isFinite(at?.x) && Number.isFinite(at?.y) && Number.isFinite(at?.z))) {
      warnOnce(`Chữ "${current.key}": anchor() phải trả { x, y, z } hữu hạn hay null; chữ ẩn ở khung đó (chỉ báo một lần):`, at);
      hide();
      return;
    }
    // OrbitControls.update() chỉ gọi camera.lookAt(): hướng mới nằm trong quaternion, còn ma trận thế giới (và
    // matrixWorldInverse dùng ngay dưới đây) tới lúc render() mới được tính lại. Tính ngay ở đây, như render() sẽ làm,
    // để chữ không chạy trễ camera một khung khi người xem kéo.
    camera.updateMatrixWorld();
    // Xét độ sâu trong toạ độ của camera (camera nhìn về −z): điểm neo phải ở trước mặt, giữa near và far, như chính vật
    // được vẽ. Không xét bằng z của NDC: khoảng đó tuỳ quy ước độ sâu mà renderer đặt cho camera ([−1, 1] với WebGL,
    // [0, 1] với WebGPU, đảo chiều khi bật reversedDepthBuffer). Với [0, 1], điểm sát camera hơn near vẫn có z trong (−1, 1).
    point.set(at.x, at.y, at.z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -point.z;
    if (!(depth >= camera.near && depth <= camera.far)) {
      hide(); // sau lưng camera, sát hơn near hay xa hơn far
      return;
    }
    // Rồi mới chiếu ra NDC (Vector3.project() là đúng hai phép nhân này): x, y trong [−1, 1] là trong khung, ở mọi quy ước.
    point.applyMatrix4(camera.projectionMatrix);
    if (!(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1)) {
      hide(); // ngoài khung thì vị trí không còn nghĩa gì: chữ chỉ trong suốt (data-away), không bị gỡ
      return;
    }
    // NDC → px trong canvas: y của NDC hướng lên, y của trang hướng xuống.
    const { width, height } = size();
    ui.place(((point.x + 1) / 2) * width, ((1 - point.y) / 2) * height, true);
  }

  return {
    api: Object.freeze({
      keys,
      show(key, anchor) {
        if (disposed) return;
        // hasOwn: khóa như 'toString' không được lấy nhầm hàm của Object.prototype.
        const poem = Object.hasOwn(captions, key) ? captions[key] : null;
        if (!poem) {
          if (debug) console.warn(`ctx.captions.show: không có chữ "${key}" trong content.captions; không hiện gì.`);
          return;
        }
        ui.show(poem);
        current = { key, anchor, until: time.value + CAPTION_SECONDS, fading: false, warned: false };
        // Đặt chữ ngay: show() có thể đến ngoài vòng lặp (lúc ?freeze đã dừng), và chữ chưa đặt thì nằm ở góc trái trên.
        step();
      },
    }),
    step,
    /** Gỡ vùng chữ khỏi trang; gọi 2 lần vẫn an toàn. Sau đó show() không làm gì. */
    dispose() {
      if (disposed) return;
      disposed = true;
      current = null;
      ui.dispose();
    },
  };
}
