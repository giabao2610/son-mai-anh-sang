import { describe, it, expect } from 'vitest';
import { MAX_FPS, createClock, createFrameCap } from '../../src/engine/gpu/clock.js';

describe('createClock — chế độ freeze (tất định)', () => {
  it('khung 1 có t = 1/60; dt luôn 1/60; ms bị bỏ qua', () => {
    const clock = createClock({ freeze: true });
    expect(clock.tick(123456)).toEqual({ t: 1 / 60, dt: 1 / 60 });
    clock.tick(0);
    const third = clock.tick(99999999);
    expect(clock.frames).toBe(3);
    expect(third.t).toBeCloseTo(3 / 60, 12);
    expect(third.dt).toBe(1 / 60);
  });

  it('t = frames / 60 bất kể ms, nên hai lần chạy cho cùng một dãy', () => {
    const a = createClock({ freeze: 10 }); // ?freeze=10 cũng là freeze
    const b = createClock({ freeze: true });
    for (let i = 0; i < 40; i++) {
      expect(a.tick(i * 16.7)).toEqual(b.tick(i * 1000 + 5));
    }
    expect(a.frames).toBe(40);
    expect(a.tick(0).t).toBeCloseTo(41 / 60, 12);
  });
});

describe('createClock — đồng hồ thật', () => {
  it('tick đầu tiên: dt = 0, t = 0', () => {
    const clock = createClock();
    expect(clock.tick(5000)).toEqual({ t: 0, dt: 0 });
    expect(clock.frames).toBe(1);
  });

  it('dt = (ms − lần trước) / 1000; t cộng dồn dt', () => {
    const clock = createClock();
    clock.tick(1000);
    expect(clock.tick(1016).dt).toBeCloseTo(0.016, 12);
    const r = clock.tick(1032);
    expect(r.dt).toBeCloseTo(0.016, 12);
    expect(r.t).toBeCloseTo(0.032, 12);
  });

  it('tab bị ẩn lâu rồi hiện lại: dt bị kẹp ở 0.1 s', () => {
    const clock = createClock();
    clock.tick(1000);
    clock.tick(1016);
    const r = clock.tick(61016); // 60 giây không có khung nào
    expect(r.dt).toBe(0.1);
    expect(r.t).toBeCloseTo(0.116, 12);
  });

  it('ms lùi lại thì dt = 0, không bao giờ âm', () => {
    const clock = createClock();
    clock.tick(5000);
    const back = clock.tick(4000);
    expect(back.dt).toBe(0);
    expect(back.t).toBe(0);
    expect(clock.tick(4016).dt).toBeCloseTo(0.016, 12);
  });

  it('ms không phải số (khung đầu của renderer có thể là undefined): dt = 0, không ra NaN', () => {
    const clock = createClock();
    expect(clock.tick(undefined)).toEqual({ t: 0, dt: 0 });
    expect(clock.tick(1000)).toEqual({ t: 0, dt: 0 });
    expect(clock.tick(1010).dt).toBeCloseTo(0.01, 12);
    expect(clock.frames).toBe(3);
  });
});

describe('createFrameCap — tối đa 60 khung/giây', () => {
  /** Chạy bộ chặn trong `seconds` giây ở nhịp màn hình `hz` (có dao động `jitter` ms); trả số khung được vẽ. */
  const drawn = (hz, { seconds = 10, jitter = 0 } = {}) => {
    const cap = createFrameCap();
    let n = 0;
    for (let i = 0; i < hz * seconds; i++) {
      const wobble = jitter * Math.sin(i * 1.7);
      if (cap.ready((i * 1000) / hz + wobble)) n += 1;
    }
    return n / seconds;
  };

  it('màn 60 Hz (kể cả dao động ±1 ms) và máy chậm: không bỏ khung nào', () => {
    expect(MAX_FPS).toBe(60);
    expect(drawn(60, { jitter: 1 })).toBe(60);
    expect(drawn(45)).toBe(45);
    expect(drawn(30)).toBe(30);
  });

  it('màn 90, 120, 144 Hz: vẽ khoảng 60 khung mỗi giây', () => {
    for (const hz of [90, 120, 144]) {
      expect(drawn(hz), `${hz} Hz`).toBeGreaterThanOrEqual(59);
      expect(drawn(hz), `${hz} Hz`).toBeLessThanOrEqual(61);
    }
  });

  it('tab vừa hiện lại sau lâu: vẽ ngay rồi đi tiếp, không vẽ dồn; ms không phải số thì vẽ', () => {
    const cap = createFrameCap();
    expect(cap.ready(0)).toBe(true);
    expect(cap.ready(5000)).toBe(true);
    expect(cap.ready(5008)).toBe(false);
    expect(cap.ready(5017)).toBe(true);
    expect(cap.ready(undefined)).toBe(true);
  });
});
