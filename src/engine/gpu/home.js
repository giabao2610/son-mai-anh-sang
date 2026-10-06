// engine/gpu/home.js — tranh tự khép lại (CameraSpec.home, GĐ 8): buông tay đủ `after` giây thì camera êm êm quay về góc của bức trong `duration` giây; phần tính là hàm thuần.
import { Spherical, Vector3 } from 'three/webgpu';

const TAU = Math.PI * 2;
/** dampingFactor mặc định của OrbitControls (0,05) là phần quán tính áp mỗi lần update(); số ấy chỉnh cho 60 khung/giây. */
const DAMPING_FPS = 60;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

/** Hiệu góc a → b theo đường ngắn nhất, trong (−π, π]. */
export function shortestAngle(a, b) {
  const d = (((b - a) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
}

/**
 * Dáng camera ở phần k ∈ [0, 1] của đường về: góc ngang theo đường ngắn nhất, góc dọc, zoom và khoảng cách, nội suy theo smoothstep
 * (êm ở hai đầu).
 * @param {{ theta: number, phi: number, zoom: number, radius: number }} from
 * @param {{ theta: number, phi: number, zoom: number, radius: number }} to
 * @param {number} k
 */
export function homeAt(from, to, k) {
  const s = smooth(k);
  return {
    theta: from.theta + shortestAngle(from.theta, to.theta) * s,
    phi: from.phi + (to.phi - from.phi) * s,
    zoom: from.zoom + (to.zoom - from.zoom) * s,
    radius: from.radius + (to.radius - from.radius) * s,
  };
}

/** Tọa độ cầu của điểm p quanh điểm nhìn, như OrbitControls (trục y lên): theta quanh trục y, phi đo từ trục y. */
function sphericalOf(p, target) {
  const s = new Spherical().setFromVector3(p.clone().sub(target));
  return { theta: s.theta, phi: s.phi, radius: s.radius };
}

/**
 * Bộ đếm giờ trên OrbitControls. Sự kiện 'start' (chạm, kéo) thì thôi đếm và thôi về; 'end' (buông) thì đếm giờ đứng yên; đủ `after` giây
 * thì quay về. scene.js gọi step(dt) mỗi khung, TRƯỚC controls.update(): khi đang về, step đặt thẳng vị trí (và zoom) của camera, rồi
 * controls.update() nhìn về điểm nhìn như mọi khung.
 *
 * Quán tính của OrbitControls (enableDamping) tắt theo SỐ LẦN update(): mỗi lần, phần xoay dở của lần kéo còn lại (1 − dampingFactor).
 * Ở 60 khung/giây, sau `after` giây còn chừng 1/10 000; nhưng scene.js kẹp dt ≤ 0,1 s, nên ở 10 khung/giây (máy vẽ chậm) sau
 * `after` + `duration` giây còn hơn 10%, và phần dở ấy xoay camera ra khỏi nhà sau khi đã về tới nơi (Phụ lục A.98). Vì vậy step đặt
 * dampingFactor theo dt của khung: 1 − (1 − mặc định)^(dt × 60). Quán tính tắt theo giây của cảnh ở mọi nhịp khung, và đúng bằng mặc
 * định ở 60 khung/giây. Chỉ bức có CameraSpec.home chịu thay đổi này; giảm chuyển động thì không có quán tính (enableDamping = false),
 * step không đụng tới.
 * Với ?freeze, vòng lặp dừng nên camera không tự về.
 * @param {{ camera: any, controls: any, spec: import('../contracts/runtime.js').CameraSpec, reduced?: boolean }} p
 */
export function createHome({ camera, controls, spec, reduced = false }) {
  const { after, duration } = spec.home;
  const goal = { ...sphericalOf(new Vector3(...spec.position), new Vector3(...spec.target)), zoom: 1 };
  const baseDamping = controls.dampingFactor;
  let idle = null; // giây đứng yên kể từ lần buông tay; null: đang tương tác, hay đã về
  let trip = null; // { from, t }: đang trên đường về
  let disposed = false;
  const onStart = () => {
    idle = null;
    trip = null;
  };
  const onEnd = () => {
    idle = 0;
    trip = null;
  };
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  const place = (pose) => {
    camera.position.copy(controls.target).add(new Vector3().setFromSphericalCoords(pose.radius, pose.phi, pose.theta));
    if (camera.isOrthographicCamera) {
      camera.zoom = pose.zoom;
      camera.updateProjectionMatrix();
    }
  };
  /** Bộ đếm của một khung (đệ quy với dt = 0 khi vừa bắt đầu về). Trả true khi vừa đặt lại camera. */
  function advance(dt) {
    if (trip) {
      trip.t += dt;
      const k = reduced ? 1 : trip.t / duration;
      place(homeAt(trip.from, goal, k));
      if (k >= 1) trip = null;
      return true;
    }
    if (idle === null) return false;
    idle += dt;
    if (idle < after) return false;
    idle = null;
    trip = { from: { ...sphericalOf(camera.position, controls.target), zoom: camera.zoom ?? 1 }, t: 0 };
    return advance(0);
  }
  return {
    /** Một khung, dt giây của cảnh. Đặt dampingFactor ở đây chứ không trong advance: advance gọi lại chính nó với dt = 0 lúc bắt đầu về, và khung ấy sẽ mất quán tính. */
    step(dt) {
      if (disposed) return false;
      if (controls.enableDamping) controls.dampingFactor = 1 - Math.pow(1 - baseDamping, dt * DAMPING_FPS);
      return advance(dt);
    },
    /** Gỡ listener, trả quán tính về như cũ; step sau đó không làm gì. */
    dispose() {
      disposed = true;
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dampingFactor = baseDamping;
    },
  };
}
