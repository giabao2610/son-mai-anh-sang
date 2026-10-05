// engine/gpu/stage.js — Sân khấu 3D: renderer nền đặc, camera + OrbitControls, đồng hồ, resize + DPR, lỗi GPU.
import { WebGPURenderer, Scene, PerspectiveCamera, Vector2, Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createClock } from './clock.js';
import { createLatch } from './guards.js';
import { breathAmplitude, breathOffset } from './breath.js';
import { fitFov } from './fov.js';

/**
 * Dựng sân khấu cho một bức. Chỉ chạy trong trình duyệt có GPU (e2e kiểm, không có unit test).
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier     tầng boot dò được; 'webgl2' ép forceWebGL
 * @param {{ freeze: boolean|number }} opts.flags   cờ URL (engine/flags.js)
 * @param {HTMLElement} opts.parent        phần tử [data-stage]; canvas được gắn vào đây
 * @param {string} opts.clearColor         màu nền đặc, ví dụ palette.denThen
 * @param {boolean} [opts.reducedMotion]   prefers-reduced-motion: tắt quán tính của camera
 * @param {Window} [opts.win]
 */
export async function createStage({ tier, flags, parent, clearColor, reducedMotion = false, win = window }) {
  // WebGPURenderer chỉ quyết định lùi về WebGL2 BÊN TRONG init(); forceWebGL ép tầng B ngay từ đầu.
  // trackTimestamp: đo thời gian GPU (gpu-timer.js). Bật từ lúc tạo, vì WebGPU chỉ kiểm tính năng 'timestamp-query' lúc
  // init: máy không có thì three tự tắt cờ, không báo lỗi validation mỗi khung (Phụ lục A.40, khác A.21).
  const renderer = new WebGPURenderer({ antialias: false, forceWebGL: tier === 'webgl2', trackTimestamp: true });
  await renderer.init();
  // Backend THẬT, chỉ đáng tin sau init(): three có thể lặng lẽ lùi về WebGL2. Huy hiệu dùng giá trị này.
  const backend = renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl2';
  // alpha mặc định là true: thiếu dòng này thì chỗ trống trong suốt và lộ trang phía sau canvas.
  renderer.setClearColor(clearColor, 1);
  // renderer.toneMapping giữ NoToneMapping (mặc định): tone mapping nằm trong pipeline (Phủ bóng + renderOutput).

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 500);
  // Uniform dùng chung cho mọi lớp. Tên đặt bằng setName phải là định danh hợp lệ (không có '-').
  const u = {
    time: uniform(0).setName('u_time'),
    delta: uniform(1 / 60).setName('u_delta'),
    resolution: uniform(new Vector2()).setName('u_resolution'),
    pointer: uniform(new Vector2()).setName('u_pointer'), // NDC của con trỏ (input.js cập nhật)
  };
  // ?freeze → đồng hồ tất định (khung × 1/60 s); không dùng time/deltaTime của TSL vì chúng chạy theo đồng hồ riêng.
  const clock = createClock({ freeze: flags.freeze });

  // Ghi đè hai callback của renderer. Lỗi GPU đến KHÔNG đồng bộ (không ném từ render()), nên phải nghe ở đây.
  // Mất thiết bị đi qua một chốt: nếu nó xảy ra trước khi run.js kịp gắn onLost(), run.js vẫn được báo bù.
  const lost = createLatch();
  const errorCallbacks = [];
  renderer.onDeviceLost = (info) => lost.fire(info);
  renderer.onError = (info) => errorCallbacks.forEach((cb) => cb(info));

  let controls = null;
  let cameraSpec = null; // CameraSpec của bức: fov tính lại theo tỉ lệ khung mỗi lần resize (minHorizontalFov)
  let breathAmp = 0; // biên độ "thở" của camera (CameraSpec.breathe; 0 khi giảm chuyển động)
  const base = new Vector3(); // điểm nhìn gốc của bức; thở = lệch quanh điểm này
  let dprMax = 1;
  let lastSize = '';
  const resize = () => {
    const width = parent.clientWidth || win.innerWidth;
    const height = parent.clientHeight || win.innerHeight;
    const ratio = Math.min(win.devicePixelRatio || 1, dprMax);
    // Gán lại canvas.width (dù cùng giá trị) sẽ XÓA khung đang hiện; bỏ qua lần gọi không đổi gì,
    // để khung N của ?freeze=N còn nguyên.
    const size = `${width}x${height}@${ratio}`;
    if (size === lastSize) return;
    lastSize = size;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    if (cameraSpec) camera.fov = fitFov(cameraSpec, camera.aspect);
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(u.resolution.value);
  };
  const observer = new win.ResizeObserver(resize);
  observer.observe(parent);
  // Canvas vào [data-stage] ngay; CSS giữ nó ở opacity 0 cho tới khi shell.crossfade() gắn data-visible.
  parent.appendChild(renderer.domElement);
  resize();

  let disposed = false;
  return {
    renderer,
    scene,
    camera,
    backend,
    u,
    get controls() {
      return controls;
    },

    /** Áp CameraSpec của bức: vị trí, điểm nhìn, fov (nới theo khung, fov.js), rồi OrbitControls bị chặn trong giới hạn bức khai báo. */
    useCamera(spec) {
      controls?.dispose();
      cameraSpec = spec;
      camera.fov = fitFov(spec, camera.aspect);
      camera.position.set(...spec.position);
      camera.updateProjectionMatrix();
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...spec.target);
      base.set(...spec.target);
      breathAmp = breathAmplitude(spec, reducedMotion);
      controls.minAzimuthAngle = spec.azimuth[0];
      controls.maxAzimuthAngle = spec.azimuth[1];
      controls.minPolarAngle = spec.polar[0];
      controls.maxPolarAngle = spec.polar[1];
      controls.minDistance = spec.distance[0];
      controls.maxDistance = spec.distance[1];
      controls.enablePan = false;
      // Damping = quán tính khi thả tay; cần gọi controls.update() mỗi khung (run.js làm).
      controls.enableDamping = !reducedMotion;
      controls.update();
      return controls;
    },

    /**
     * Camera "thở": dời điểm nhìn theo breathOffset(t), luôn quanh điểm gốc của bức nên không trôi dần.
     * OrbitControls.update() giữ nguyên VỊ TRÍ camera và chỉ quay camera về điểm nhìn mới (lookAt), nên "thở"
     * là một cái nhìn đảo rất chậm, cỡ breathe / khoảng cách radian (0,4 ở 46 đơn vị ≈ 0,5°), không có thị sai.
     * Gọi TRƯỚC controls.update() mỗi khung.
     */
    breathe(t) {
      if (!controls || !breathAmp) return;
      const [x, y, z] = breathOffset(t, breathAmp);
      controls.target.set(base.x + x, base.y + y, base.z + z);
    },

    /** Đặt trần DPR theo mức chất lượng (budget.dpr), hay theo nấc hạ của bộ điều chỉnh, rồi tính lại kích thước. */
    setDpr(max) {
      dprMax = max;
      resize();
    },

    /** DPR đang dùng: devicePixelRatio của máy, kẹp dưới trần hiện tại. Thang nấc 'dpr' bắt đầu từ số này. */
    dpr() {
      return Math.min(win.devicePixelRatio || 1, dprMax);
    },

    /** Một nhịp đồng hồ: cập nhật u.time / u.delta. Khung đầu của vòng lặp three có thể không có ms. */
    tick(ms = win.performance.now()) {
      const { t, dt } = clock.tick(ms);
      u.time.value = t;
      u.delta.value = dt;
      return { t, dt };
    },

    onLost(cb) {
      lost.on(cb);
    },
    onError(cb) {
      errorCallbacks.push(cb);
    },

    /** Gỡ sân khấu; gọi 2 lần vẫn an toàn. */
    dispose() {
      if (disposed) return;
      disposed = true;
      // Bỏ callback TRƯỚC: WebGLBackend.dispose() tự gọi loseContext(), không được để nó báo "mất thiết bị".
      lost.clear();
      errorCallbacks.length = 0;
      observer.disconnect();
      controls?.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose().catch((err) => console.error('Gỡ renderer lỗi:', err));
      renderer.domElement.remove();
    },
  };
}
