// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, hoa đăng, cử chỉ.
import { Plane, Vector2, Vector3, Vector4 } from 'three/webgpu';
import { Fn, Loop, exp, float, length, pow2, sin, step, uniform, uniformArray } from 'three/tsl';
import { hourOfNight, tonight } from '../../lib/astro/moon.js';
import { createLanternSlots } from './parts/anh-trang-drift.js';

export const POND_RADIUS = 60; // bán kính mặt nước: đĩa nước của lớp 4 dùng đúng số này; chạm ngoài đĩa thì không gợn
export const RIPPLE_SLOTS = 8;
const NIGHT = { start: 18, end: 29.5, fallback: 21 }; // thang giờ của Bức 1: 18:00 → 05:30 sáng hôm sau
const FLY_HEIGHT = 1.2; // điểm hút đom đóm nằm trên mặt nước một chút
// Vuốt → sương xoáy: góc xoay (radian) ở tâm xoáy tăng theo tốc độ vuốt (NDC mỗi giây), kẹp trong [min, max].
const SWIRL_SPIN = { min: 0.6, max: 2.4, perSpeed: 0.35 };

/**
 * Chính sách giờ của Bức 1 (§7): đang là đêm thì dùng giờ thật (21:00 → 21, 02:00 → 26);
 * ban ngày thì mượn 21:00 và ghi chú 'daytime'. Hộp màu chỉ trả số, chính sách nằm ở đây.
 * @param {Date} now
 * @returns {{ hour: number, note: 'daytime' | null }}
 */
export function defaultHour(now) {
  const { instant, isNight, evening } = tonight(now);
  return isNight ? { hour: hourOfNight(instant, evening), note: null } : { hour: NIGHT.fallback, note: 'daytime' };
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * Chữ của thanh giờ: giờ trên thang của Bức 1 (18 → 29,5; quá 24 là sáng hôm sau) ra "hh:mm". 29,5 → '05:30'.
 * @param {number} v
 */
export function formatHour(v) {
  const minutes = Math.round(v * 60);
  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
}

/**
 * Hướng (vector đơn vị, world) từ tâm ao tới trăng theo giờ. Tính nghệ thuật, không theo thiên văn:
 * camera nhìn về −z (phía nam), nên trăng mọc bên TRÁI (đông), cao nhất lúc nửa đêm, lặn bên PHẢI (tây).
 * Góc giữ nhỏ (±20° ngang, 4°–13° cao) để trăng và bóng trăng luôn nằm trong khung.
 * @param {number} hour  18 → 29.5
 * @returns {[number, number, number]}
 */
export function moonDirection(hour) {
  const s = Math.min(Math.max((hour - NIGHT.start) / (NIGHT.end - NIGHT.start), 0), 1);
  const azimuth = (s - 0.5) * 0.7;
  const altitude = 0.07 + 0.16 * Math.sin(Math.PI * s);
  return [Math.sin(azimuth) * Math.cos(altitude), Math.sin(altitude), -Math.cos(azimuth) * Math.cos(altitude)];
}

/**
 * Bộ đệm vòng 8 gợn sóng: mỗi ô vec4(x, z, lúc bắt đầu, biên độ). Chạm lần thứ 9 ghi đè gợn cũ nhất.
 * uniformArray tự tải lại cả mảng lên GPU mỗi khung (updateType RENDER), nên chỉ cần sửa slots[i].
 */
export function createRipples() {
  const slots = Array.from({ length: RIPPLE_SLOTS }, () => new Vector4(0, 0, -1e4, 0));
  let next = 0;
  return {
    slots,
    node: uniformArray(slots, 'vec4'),
    /** Thêm một gợn tại (x, z), bắt đầu lúc t (giây của ctx.u.time). */
    add(x, z, t, amplitude = 1) {
      slots[next].set(x, z, t, amplitude);
      next = (next + 1) % RIPPLE_SLOTS;
    },
  };
}

/**
 * Hàm TSL độ cao gợn sóng h(xz): cộng 8 vòng sóng đang lan. MỘT hàm dùng chung cho pháp tuyến
 * của nước và độ nhấp nhô của lá (lớp 4 dựng hàm này bằng núm của chính nó).
 * Mỗi vòng: sóng sin quanh bán kính age × speed, chỉ nhô gần đỉnh vòng (hình chuông),
 * tắt dần theo exp(−age × decay). step(0, age) = 0 khi gợn chưa bắt đầu.
 * @param {{ ripples: any, time: any, amplitude: any, speed: any, decay: any, wavelength: any }} p  node hoặc uniform
 * @returns {(xz: any) => any}  gọi được trong TSL: height(positionWorld.xz)
 */
export function makeRippleHeight({ ripples, time, amplitude, speed, decay, wavelength }) {
  return Fn(([xz]) => {
    const h = float(0).toVar();
    Loop(RIPPLE_SLOTS, ({ i }) => {
      const r = ripples.element(i);
      const age = time.sub(r.z);
      const x = length(xz.sub(r.xy)).sub(age.mul(speed)); // khoảng cách tới đỉnh vòng đang lan
      // pow2(q) = q·q. Không viết q.pow(2): x âm ở phía trong vòng gợn (và ở mọi ô trống), mà GLSL/WGSL không định
      // nghĩa pow của số âm: SwiftShader vẫn ra số, còn GPU thật thường ra NaN (nước đen, lá biến mất).
      const ring = exp(pow2(x.div(wavelength)).negate());
      const fade = exp(age.mul(decay).negate()).mul(step(0, age));
      h.addAssign(sin(x.mul(Math.PI * 2).div(wavelength)).mul(ring).mul(fade).mul(r.w));
    });
    return h.mul(amplitude);
  });
}

/**
 * setup() của Bức 1: xưởng gọi TRƯỚC mọi createLayer; `shared` đi vào tham số thứ 2 của từng lớp.
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const { hour, note } = defaultHour(ctx.now);
  const uHour = uniform(hour).setName('uHour');
  const moonDir = uniform(new Vector3(...moonDirection(hour))).setName('moonDir');
  const ripples = createRipples();
  const attract = { point: uniform(new Vector3(0, FLY_HEIGHT, 0)), strength: uniform(0) };
  // Xoáy sương (lớp Sương đọc): tâm trên mặt nước (x, z), lúc bắt đầu, góc xoay có dấu (chiều vuốt).
  const swirl = {
    center: uniform(new Vector2()).setName('swirlCenter'),
    start: uniform(-1e4).setName('swirlStart'),
    spin: uniform(0).setName('swirlSpin'),
  };
  const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng (và xoáy sương) nhẹ hơn
  // Vòng đệm hoa đăng (GĐ 5): lớp Ánh trăng vẽ mọi ô, mỗi khung tính lại từ đồng hồ của cảnh. Sức chứa theo mức.
  const lanterns = createLanternSlots(ctx.budget.lanterns ?? 8, { pond: POND_RADIUS });

  const water = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  let holding = false;

  return {
    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract, swirl, lanterns },
    // Thanh giờ (GĐ 4): xưởng vẽ thanh trượt, kéo thì chỉ đổi uHour.value. Ban ngày mượn 21:00 và ghi chú, nhưng chỉ
    // tới khi người xem kéo thanh đi: lúc đó họ đã chọn giờ của mình. Nhãn và chữ ghi chú ở content.dials.gio.
    dials: [{
      id: 'gio',
      uniform: uHour,
      min: NIGHT.start,
      max: NIGHT.end,
      step: 0.25,
      format: formatHour,
      note: () => (note === 'daytime' && uHour.value === hour ? 'daytime' : null),
    }],

    // Cử chỉ mà không công cụ nào dùng. Tia đi từ camera qua ngón tay; bức tự giao với mặt nước y = 0.
    onGesture(g) {
      const onPond = Boolean(g.ray?.intersectPlane(water, hit)) && Math.hypot(hit.x, hit.z) <= POND_RADIUS;
      // Thả tay luôn là thả, kể cả khi ngón tay đã trượt ra ngoài ao: không thì đom đóm bị hút mãi.
      if (g.kind === 'hold-end') {
        if (onPond) attract.point.value.set(hit.x, FLY_HEIGHT, hit.z);
        if (holding) attract.strength.value = -1.5; // thả tay: bung ra như tia lửa lò rèn
        holding = false;
        return;
      }
      // Vuốt trên mặt nước: sương xoáy quanh chỗ vuốt, chiều theo hướng vuốt; không dời điểm hút, không tạo gợn.
      if (g.kind === 'swipe') {
        if (!onPond) return;
        const v = g.velocity ?? { x: 0, y: 0 };
        const along = Math.abs(v.x) >= Math.abs(v.y) ? v.x : -v.y;
        const spin = Math.min(SWIRL_SPIN.max, Math.max(SWIRL_SPIN.min, Math.hypot(v.x, v.y) * SWIRL_SPIN.perSpeed));
        swirl.center.value.set(hit.x, hit.z);
        swirl.start.value = ctx.u.time.value;
        swirl.spin.value = (along < 0 ? -1 : 1) * spin * rippleAmp;
        return;
      }
      // Chỉ chạm và giữ mới dời điểm hút.
      if (!onPond || !['tap', 'hold-start', 'hold-move'].includes(g.kind)) return;
      attract.point.value.set(hit.x, FLY_HEIGHT, hit.z);
      if (g.kind === 'tap') {
        ripples.add(hit.x, hit.z, ctx.u.time.value, rippleAmp);
        attract.strength.value = -0.6; // chạm: đom đóm quanh đó tản ra
      } else if (g.kind === 'hold-start' || g.kind === 'hold-move') {
        holding = true;
      }
    },

    // Mỗi khung, TRƯỚC các lớp: trăng theo giờ; lực hút tiến dần về 1 khi giữ, tắt dần khi thả.
    update(dt) {
      moonDir.value.set(...moonDirection(uHour.value));
      const s = attract.strength;
      s.value = holding ? Math.min(s.value + dt * 2, 1) : s.value * Math.exp(-dt * 2.5);
    },
  };
}
