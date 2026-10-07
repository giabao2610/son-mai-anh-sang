// tests/unit/home.test.js — tranh tự khép lại (GĐ 8): đứng yên đủ after thì về trong duration; chạm giữa chừng thì thôi; đường ngắn nhất qua ±π; giảm chuyển động về một bước; camera trực giao về zoom, phối cảnh về khoảng cách; đổi cỡ khung giữa đường vẫn về đủ; quán tính của OrbitControls tắt theo giây của cảnh, không theo số khung; dt hỏng (NaN, vô cực, âm) thì bỏ khung.
import { describe, it, expect } from 'vitest';
import { EventDispatcher, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createHome, homeAt, shortestAngle } from '../../src/engine/gpu/home.js';
import { fitCamera } from '../../src/engine/gpu/camera.js';

const SPEC = { kind: 'ortho', position: [0, 4, 10], target: [0, 1, 0], height: 12, home: { after: 3, duration: 1.2 } };
const TARGET = new Vector3(...SPEC.target);
/**
 * OrbitControls giả: phát 'start', 'end' như thật; update() nhìn về điểm nhìn, như OrbitControls làm mỗi khung. Có enableDamping và
 * dampingFactor (0,05 như mặc định của OrbitControls) để thử việc home đặt quán tính theo dt; bản giả không có quán tính thật (phần ấy
 * thử với OrbitControls thật ở cuối file).
 */
function rig(camera, { damping = false, ...options } = {}) {
  camera.position.set(...SPEC.position);
  const controls = Object.assign(new EventDispatcher(), { target: TARGET.clone(), enableDamping: damping, dampingFactor: 0.05 });
  controls.update = () => camera.lookAt(controls.target);
  const home = createHome({ camera, controls, spec: SPEC, ...options });
  return { controls, home };
}
/** Góc (độ) giữa hướng từ điểm nhìn tới camera và hướng của bức: góc 3D giữa hai hướng nhìn, như số đo `goc` của Bức 4. */
function off(camera) {
  const a = camera.position.clone().sub(TARGET).normalize();
  const b = new Vector3(...SPEC.position).sub(TARGET).normalize();
  return (Math.acos(Math.min(1, a.dot(b))) * 180) / Math.PI;
}
const run = (home, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) home.step(dt);
};
/** Kéo xoay như người xem: 'start', xoay quanh trục y `deg` độ (và đặt zoom), 'end'. */
function drag(controls, camera, deg, zoom = null) {
  controls.dispatchEvent({ type: 'start' });
  camera.position.sub(TARGET).applyAxisAngle(new Vector3(0, 1, 0), (deg * Math.PI) / 180).add(TARGET);
  if (zoom !== null) camera.zoom = zoom;
  controls.dispatchEvent({ type: 'end' });
}

describe('home', () => {
  it('shortestAngle và homeAt: đường ngắn nhất kể cả qua ±π; k = 0 là điểm đi, k = 1 là đích; êm ở đầu', () => {
    expect(shortestAngle(3, -3)).toBeCloseTo(2 * Math.PI - 6, 9);
    expect(shortestAngle(-3, 3)).toBeCloseTo(6 - 2 * Math.PI, 9);
    const from = { theta: 3, phi: 1, zoom: 2, radius: 5 };
    const to = { theta: -3, phi: 1.2, zoom: 1, radius: 7 };
    expect(homeAt(from, to, 0)).toEqual(from);
    const end = homeAt(from, to, 1);
    expect(Math.cos(end.theta)).toBeCloseTo(Math.cos(-3), 9);
    expect(end.theta).toBeGreaterThan(3); // đi qua π, không quay ngược gần một vòng
    expect([end.phi, end.zoom, end.radius]).toEqual([1.2, 1, 7]);
    expect(homeAt(from, to, 0.01).zoom).toBeCloseTo(2, 3);
  });

  it('camera trực giao: buông tay chưa đủ after thì đứng yên; đủ after thì về trong duration, cả góc lẫn zoom', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, 40, 2);
    const start = off(camera);
    expect(start).toBeGreaterThan(30); // quay quanh trục đứng nên góc 3D lệch nhỏ hơn 40° một chút (camera nhìn chếch xuống)
    run(home, 2.9);
    expect(off(camera)).toBeCloseTo(start, 3);
    run(home, 0.1 + 0.6);
    expect(off(camera)).toBeGreaterThan(1);
    expect(off(camera)).toBeLessThan(start - 1);
    run(home, 0.7);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('step trả true đúng những khung đặt lại camera (đang về), false lúc chờ và sau khi về', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    expect(home.step(1 / 60)).toBe(false); // chưa ai chạm
    drag(controls, camera, 40);
    const moved = [];
    for (let i = 0; i < 300; i += 1) moved.push(home.step(1 / 60));
    // 3 giây chờ (khung thứ 180 đã đủ after), rồi 1,2 giây về (72 khung), rồi thôi.
    expect(moved.slice(0, 179).every((m) => m === false)).toBe(true);
    expect(moved.slice(180, 250).every((m) => m === true)).toBe(true);
    expect(moved.slice(260).every((m) => m === false)).toBe(true);
  });

  it('êm, không nhảy khung: khung đầu của đường về giữ nguyên camera, mỗi khung sau đổi góc và zoom ít, hai đầu êm hơn giữa đường', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, 40, 2.5);
    const start = off(camera);
    run(home, 2.9);
    const angle = [off(camera)];
    const zoom = [camera.zoom];
    for (let i = 0; i < 120; i += 1) {
      if (home.step(1 / 60)) { // chỉ các khung đang về
        angle.push(off(camera));
        zoom.push(camera.zoom);
      }
    }
    const steps = angle.slice(1).map((a, i) => Math.abs(a - angle[i]));
    expect(angle.length, 'đã về hết trong chừng 72 khung').toBeGreaterThan(60);
    expect(steps[0], 'khung đầu đặt camera đúng chỗ đang đứng').toBeLessThan(1e-6);
    expect(steps[1]).toBeLessThan(0.1); // êm ở đầu
    expect(steps.at(-1)).toBeLessThan(0.1); // êm ở cuối
    expect(Math.max(...steps), 'không khung nào nhảy: smoothstep dốc nhất 1,5 lần trung bình').toBeLessThan((1.6 * start) / 72);
    expect(Math.max(...steps)).toBeGreaterThan(start / 72); // giữa đường nhanh hơn trung bình: smoothstep, không đều
    expect(zoom.every((z, i) => i === 0 || z <= zoom[i - 1] + 1e-12), 'zoom giảm đều về 1').toBe(true);
    expect([zoom[0], zoom.at(-1)]).toEqual([2.5, 1]);
  });

  it('chạm lại giữa đường về: thôi về ngay, camera ở yên chỗ đang dở; buông lần nữa thì đếm lại từ đầu rồi về nốt từ chỗ đó', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, 40);
    const start = off(camera);
    run(home, 3.5);
    controls.dispatchEvent({ type: 'start' });
    const mid = off(camera);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(start - 1); // đang dở: đã đi một đoạn, chưa tới nơi
    run(home, 5);
    expect(off(camera)).toBeCloseTo(mid, 9);
    controls.dispatchEvent({ type: 'end' });
    run(home, 2.9);
    expect(off(camera)).toBeCloseTo(mid, 9); // đếm lại đủ 3 giây
    run(home, 0.1 + 1.3);
    expect(off(camera)).toBeLessThan(1e-6);
  });

  it('giảm chuyển động: đủ after thì về một bước, không lượn', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { reduced: true });
    drag(controls, camera, 40, 2);
    const start = off(camera);
    run(home, 2.98);
    expect(off(camera)).toBeCloseTo(start, 3);
    home.step(0.05);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('camera phối cảnh: về góc và khoảng cách của bức (dolly đổi khoảng cách, không đổi zoom)', () => {
    const camera = new PerspectiveCamera();
    const { controls, home } = rig(camera);
    controls.dispatchEvent({ type: 'start' });
    camera.position.sub(TARGET).applyAxisAngle(new Vector3(0, 1, 0), 0.5).multiplyScalar(1.5).add(TARGET);
    controls.dispatchEvent({ type: 'end' });
    run(home, 4.3);
    expect(camera.position.distanceTo(TARGET)).toBeCloseTo(new Vector3(...SPEC.position).distanceTo(TARGET), 6);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('đổi cỡ khung giữa đường về (fitCamera): vẫn về đủ góc và zoom', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, -60, 2.5);
    run(home, 3.6);
    expect(camera.zoom).toBeGreaterThan(1); // giữa đường: chưa tới zoom của bức
    fitCamera(camera, SPEC, 390 / 844);
    run(home, 1);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('chưa ai chạm thì không làm gì; dispose gỡ listener (buông tay sau đó không làm camera về) và trả quán tính về như cũ', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { damping: true });
    run(home, 10);
    expect(off(camera)).toBeLessThan(1e-9);
    expect(controls.dampingFactor).toBeCloseTo(0.05, 9);
    home.step(0.1);
    expect(controls.dampingFactor).toBeGreaterThan(0.2); // khung dài: quán tính theo giây cảnh (ruling I3)
    home.dispose();
    expect(controls.dampingFactor).toBe(0.05);
    drag(controls, camera, 30);
    const start = off(camera);
    run(home, 10);
    expect(off(camera)).toBeCloseTo(start, 6);
  });
});

describe('home và quán tính của OrbitControls (ruling I3)', () => {
  it('dampingFactor theo giây của cảnh: khung 0,1 s ra 1 − 0,95^6, khung 1/60 s ra 0,05 như mặc định; không có quán tính (giảm chuyển động) thì không đụng tới', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { damping: true });
    home.step(0.1);
    expect(controls.dampingFactor).toBeCloseTo(1 - 0.95 ** 6, 9);
    home.step(1 / 60);
    expect(controls.dampingFactor).toBeCloseTo(0.05, 9);
    home.step(0.05);
    expect(controls.dampingFactor).toBeCloseTo(1 - 0.95 ** 3, 9);
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    home.step(0.1);
    expect(controls.dampingFactor).toBe(0.3);
  });

  it('dt không hữu hạn (NaN, vô cực, thiếu) hay âm: step không làm gì; camera, zoom và dampingFactor giữ nguyên, rồi về tiếp như thường', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { damping: true });
    drag(controls, camera, 40, 2);
    run(home, 3.5); // đang trên đường về
    const pos = camera.position.clone();
    const { zoom } = camera;
    const damping = controls.dampingFactor;
    for (const dt of [NaN, Infinity, -Infinity, undefined, -0.1]) {
      expect(home.step(dt), `dt ${dt}`).toBe(false);
      expect([controls.dampingFactor, camera.zoom], `dt ${dt}`).toEqual([damping, zoom]);
      expect(camera.position.equals(pos), `dt ${dt}`).toBe(true);
    }
    run(home, 1);
    expect(off(camera)).toBeLessThan(1e-6);
    expect([camera.zoom, controls.dampingFactor]).toEqual([1, expect.closeTo(0.05, 9)]);
  });

  it('khung đầu tiên của đường về cũng đặt dampingFactor theo dt của khung, không về 0 vì lời gọi nội bộ step(0)', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { damping: true });
    drag(controls, camera, 40);
    run(home, 2.95);
    home.step(0.1); // khung này đủ after: bắt đầu về
    expect(controls.dampingFactor).toBeCloseTo(1 - 0.95 ** 6, 9);
  });

  it.each([10, 30, 60])('OrbitControls thật ở %s khung/giây: buông tay rồi, quán tính còn dở đã tắt hẳn khi camera tới nơi, camera không trôi đi nữa', (fps) => {
    const camera = new OrthographicCamera();
    camera.position.set(...SPEC.position);
    const controls = new OrbitControls(camera); // không có phần tử DOM: không nghe con trỏ, chỉ có update() và quán tính
    controls.target.copy(TARGET);
    controls.enableDamping = true;
    controls.update();
    const home = createHome({ camera, controls, spec: SPEC });
    // Như một lần kéo: OrbitControls cộng góc vào phần còn dở rồi dần dần áp (5% mỗi lần update ở dampingFactor mặc định).
    controls.dispatchEvent({ type: 'start' });
    controls.rotateLeft(1);
    controls.dispatchEvent({ type: 'end' });
    expect(off(camera)).toBeGreaterThan(1);
    const dt = Math.min(1 / fps, 0.1); // scene.js: dt của khung tối đa 0,1 s
    for (let t = 0; t < 8; t += dt) {
      home.step(dt); // như scene.step: bộ đếm trước, controls.update() sau
      controls.update();
    }
    expect(off(camera)).toBeLessThan(0.01);
  });
});
