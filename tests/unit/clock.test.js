import { describe, it, expect } from 'vitest';
import { createClock } from '../../src/engine/gpu/clock.js';

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
