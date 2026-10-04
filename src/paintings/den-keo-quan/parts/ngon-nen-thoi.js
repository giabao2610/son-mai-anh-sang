// paintings/den-keo-quan/parts/ngon-nen-thoi.js — của lớp Ngọn nến, hàm thuần: ngọn lửa nhấp nháy và bị thổi, tính thẳng từ thời gian (vị trí lệch, độ sáng).

/**
 * blows: số lần thổi nhớ cùng lúc. lean: độ ngả lớn nhất của một lần thổi (m). rise, tau, wobble: lửa ngả lên trong ~0,1 s, tắt dần
 * với hằng số tau, dao động wobble rad/s. dim, dimTau: một lần thổi làm tối đi bao nhiêu và trong bao lâu. minGlow: không tối hơn mức này.
 * waves: ba sóng nhấp nháy [tần số Hz, biên độ dời (m), biên độ sáng]; tần số không chia hết cho nhau nên không lặp lại sớm.
 */
export const FLAME = Object.freeze({
  blows: 4, lean: 0.012, rise: 0.06, tau: 0.7, wobble: 9, dim: 0.35, dimTau: 0.6, minGlow: 0.4,
  waves: Object.freeze([[1.7, 0.0012, 0.03], [2.9, 0.0008, 0.02], [5.3, 0.0005, 0.01]]),
});

/** @param {{ reduced?: boolean }} [p]  reduced: người xem xin giảm chuyển động (ngả và nhấp nháy ít hơn) */
export function createFlame({ reduced = false } = {}) {
  const ring = []; // { t, dir: [x, z], amp }
  const scale = reduced ? 0.4 : 1;
  const flame = {
    /** Hệ số nhấp nháy (núm flicker; 0 = "Tắt nhấp nháy"). */
    flicker: 1,
    /** Thổi lúc t theo hướng dir (vec2 đơn vị trên mặt sàn). */
    blow(t, dir) {
      ring.push({ t, dir, amp: scale });
      if (ring.length > FLAME.blows) ring.shift();
    },
    /** Trạng thái lửa lúc t: offset (m) so với chỗ đứng yên, glow (hệ số sáng), lean (độ ngả do thổi, m). */
    at(t) {
      let [x, z, dim] = [0, 0, 0];
      for (const b of ring) {
        const s = t - b.t;
        if (s < 0) continue;
        // ngả lên êm (không giật), rồi tắt dần và dao động
        const g = (1 - Math.exp(-s / FLAME.rise)) * Math.exp(-s / FLAME.tau) * Math.cos(FLAME.wobble * s);
        x += b.amp * b.dir[0] * FLAME.lean * g;
        z += b.amp * b.dir[1] * FLAME.lean * g;
        dim += b.amp * FLAME.dim * Math.exp(-s / FLAME.dimTau);
      }
      const lean = Math.hypot(x, z);
      const k = flame.flicker * scale;
      let [fx, fz, fg] = [0, 0, 0];
      FLAME.waves.forEach(([hz, move, light], i) => {
        const ph = 2 * Math.PI * hz * t;
        fx += move * Math.sin(ph + i);
        fz += move * Math.cos(ph * 1.3 + 2 * i);
        fg += light * Math.sin(ph * 0.9 + 3 * i);
      });
      const glow = Math.max(FLAME.minGlow, 1 - dim + fg * k);
      return { offset: [x + fx * k, 0, z + fz * k], glow: k === 0 && dim === 0 ? 1 : glow, lean };
    },
  };
  return flame;
}
