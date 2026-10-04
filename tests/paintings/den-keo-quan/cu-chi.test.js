// tests/paintings/den-keo-quan/cu-chi.test.js — ba cử chỉ của Bức 2 đi qua setup().onGesture: chạm thổi nến, giữ dừng trống, vuốt gạt trống; chạm hai lần không làm gì thêm.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, options);
const at = (ctx, t) => { ctx.u.time.value = t; };

describe('cử chỉ của Bức 2', () => {
  it('chạm: lửa ngả theo hướng nhìn của camera (chiếu xuống sàn)', () => {
    const { ctx, setup, shared } = build();
    ctx.camera.position.set(0, 1.45, 2.1);
    ctx.camera.lookAt(0, 1.55, -0.6);
    at(ctx, 1);
    setup.onGesture({ kind: 'tap', ndc: { x: 0, y: 0 } });
    expect(shared.flame.at(1.15).offset[2]).toBeLessThan(0); // camera nhìn về −z: lửa ngả ra xa người xem
  });

  it('giữ rồi thả: trống dừng rồi quay lại; số đo rpm đi theo', () => {
    const { ctx, setup, layers, shared } = build();
    const rpm = () => layers['keo-quan'].readouts.find((r) => r.id === 'rpm').get();
    at(ctx, 2);
    setup.onGesture({ kind: 'hold-start', ndc: { x: 0, y: 0 } });
    at(ctx, 3);
    expect(rpm()).toBeLessThan(0.3);
    setup.onGesture({ kind: 'hold-end', ndc: { x: 0, y: 0 } });
    at(ctx, 20);
    expect(rpm()).toBeCloseTo(6, 0);
    expect(shared.spin.speed(20)).toBeGreaterThan(0);
  });

  it('vuốt: trống quay nhanh hơn tốc độ thường', () => {
    const { ctx, setup, layers } = build();
    at(ctx, 1);
    setup.onGesture({ kind: 'swipe', ndc: { x: 0, y: 0 }, velocity: { x: 9, y: 0 } }); // NDC/s, như input.js
    expect(layers['keo-quan'].readouts.find((r) => r.id === 'rpm').get()).toBeGreaterThan(10);
  });

  it('chạm hai lần: không làm gì thêm ngoài hai lần chạm đã tới trước nó', () => {
    const { ctx, setup, shared } = build();
    at(ctx, 1);
    const before = JSON.stringify(shared.flame.at(1.5));
    setup.onGesture({ kind: 'double-tap', ndc: { x: 0, y: 0 } });
    expect(JSON.stringify(shared.flame.at(1.5))).toBe(before);
  });

  it('giảm chuyển động: trống quay chậm còn một nửa', () => {
    const fast = build();
    const slow = build({ reducedMotion: true });
    expect(slow.shared.spin.speed(5)).toBeCloseTo(fast.shared.spin.speed(5) / 2, 9);
  });

  it('?freeze: update(0, t) vẽ lại đúng góc (Review Focus 5): cùng chuỗi cử chỉ thì cùng góc', () => {
    const run = () => {
      const { ctx, setup, shared } = build();
      at(ctx, 1);
      setup.onGesture({ kind: 'swipe', ndc: { x: 0, y: 0 }, velocity: { x: 6, y: 0 } });
      at(ctx, 2);
      setup.onGesture({ kind: 'hold-start', ndc: { x: 0, y: 0 } });
      setup.update(0, 4);
      return shared.theta.value;
    };
    expect(run()).toBe(run());
  });
});
