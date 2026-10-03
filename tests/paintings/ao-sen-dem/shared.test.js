// tests/paintings/ao-sen-dem/shared.test.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, cử chỉ.
import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three/webgpu';
import { vec2 } from 'three/tsl';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import {
  RIPPLE_SLOTS,
  createRipples,
  defaultHour,
  formatHour,
  makeRippleHeight,
  moonDirection,
  setup,
} from '../../../src/paintings/ao-sen-dem/shared.js';
import { NOW, makeEngineCtx } from '../../helpers/fake-ctx.js';
import { down } from '../../helpers/rays.js';

const vn = (s) => new Date(`${s}+07:00`);

describe('defaultHour: chính sách giờ của Bức 1', () => {
  it('đêm dùng giờ thật trên thang 18 → 29,5', () => {
    expect(defaultHour(vn('2026-09-28T21:00'))).toEqual({ hour: 21, note: null });
    expect(defaultHour(vn('2026-09-29T02:00'))).toEqual({ hour: 26, note: null });
    expect(defaultHour(vn('2026-09-29T05:00')).hour).toBeCloseTo(29, 6);
  });

  it('ban ngày mượn 21:00, ghi chú daytime', () => {
    expect(defaultHour(vn('2026-09-28T12:00'))).toEqual({ hour: 21, note: 'daytime' });
    expect(defaultHour(vn('2026-09-29T05:30'))).toEqual({ hour: 21, note: 'daytime' });
  });
});

describe('moonDirection: trăng mọc trái, cao nhất nửa đêm, lặn phải', () => {
  it('vector đơn vị, luôn ở trên mặt nước và phía trước camera (z < 0)', () => {
    for (let h = 18; h <= 29.5; h += 0.5) {
      const [x, y, z] = moonDirection(h);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
      expect(y).toBeGreaterThan(0);
      expect(z).toBeLessThan(0);
    }
  });

  it('18:00 bên trái, 23:45 chính giữa và cao nhất, 05:30 bên phải', () => {
    expect(moonDirection(18)[0]).toBeLessThan(-0.3);
    expect(moonDirection(23.75)[0]).toBeCloseTo(0, 6);
    expect(moonDirection(29.5)[0]).toBeGreaterThan(0.3);
    const highest = moonDirection(23.75)[1];
    for (const h of [18, 21, 26, 29.5]) expect(moonDirection(h)[1]).toBeLessThan(highest);
  });

  it('giờ ngoài thang bị kẹp về 18 hoặc 29,5', () => {
    expect(moonDirection(10)).toEqual(moonDirection(18));
    expect(moonDirection(40)).toEqual(moonDirection(29.5));
  });
});

describe('createRipples: bộ đệm vòng 8 gợn', () => {
  it('ghi lần lượt; gợn thứ 9 đè lên gợn đầu tiên', () => {
    const r = createRipples();
    expect(r.slots).toHaveLength(RIPPLE_SLOTS);
    expect(r.node.array).toBe(r.slots); // uniformArray đọc thẳng mảng này mỗi khung
    for (let i = 0; i < 9; i++) r.add(i, -i, i * 0.1, 1);
    expect(r.slots[0].toArray()).toEqual([8, -8, 0.8, 1]);
    expect(r.slots[1].toArray()).toEqual([1, -1, 0.1, 1]);
  });

  it('makeRippleHeight dựng được node trong Node (không GPU)', () => {
    const r = createRipples();
    const height = makeRippleHeight({ ripples: r.node, time: 0, amplitude: 1, speed: 3, decay: 0.5, wavelength: 1.4 });
    expect(height(vec2(0, 0)).isNode).toBe(true);
  });
});

describe('setup(ctx)', () => {
  it('shared: giờ, hướng trăng theo giờ, gợn sóng, điểm hút, xoáy sương (chưa xoáy)', () => {
    const { shared } = setup(makeEngineCtx(meta));
    expect(shared.hour.value).toBe(21);
    expect(shared.hourNote).toBeNull();
    expect(shared.moon.dir.value.toArray()).toEqual(moonDirection(21));
    expect(shared.ripples.slots).toHaveLength(RIPPLE_SLOTS);
    expect(shared.attract.strength.value).toBe(0);
    expect(shared.swirl.spin.value).toBe(0);
  });

  it('chạm lên mặt nước: một gợn tại điểm chạm, lúc ctx.u.time; đom đóm quanh đó tản ra', () => {
    const ctx = makeEngineCtx(meta);
    const s = setup(ctx);
    ctx.u.time.value = 2.5;
    s.onGesture({ kind: 'tap', ray: down(3, 4) });
    expect(s.shared.ripples.slots[0].toArray()).toEqual([3, 4, 2.5, 1]);
    expect(s.shared.attract.point.value.toArray()).toEqual([3, 1.2, 4]);
    expect(s.shared.attract.strength.value).toBeLessThan(0);
  });

  it('vuốt trên mặt nước: sương xoáy quanh chỗ vuốt, lúc ctx.u.time; chiều theo hướng vuốt; độ mạnh theo tốc độ (có kẹp)', () => {
    const ctx = makeEngineCtx(meta);
    const s = setup(ctx);
    ctx.u.time.value = 3;
    s.onGesture({ kind: 'swipe', ray: down(5, -4), velocity: { x: 4, y: 0.5 } });
    expect(s.shared.swirl.center.value.toArray()).toEqual([5, -4]);
    expect(s.shared.swirl.start.value).toBe(3);
    expect(s.shared.swirl.spin.value).toBeCloseTo(Math.hypot(4, 0.5) * 0.35, 6);
    s.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: -40, y: 0 } }); // vuốt rất nhanh sang trái
    expect(s.shared.swirl.spin.value).toBe(-2.4);
    s.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: 0, y: 0.1 } }); // rất chậm: vẫn xoáy nhẹ
    expect(Math.abs(s.shared.swirl.spin.value)).toBe(0.6);
    s.onGesture({ kind: 'swipe', ray: down(100, 0), velocity: { x: 4, y: 0 } }); // ngoài ao: bỏ qua
    expect(s.shared.swirl.center.value.toArray()).toEqual([0, 0]);
    const calm = setup(makeEngineCtx(meta, { reducedMotion: true }));
    calm.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: 40, y: 0 } });
    expect(calm.shared.swirl.spin.value).toBe(1.2); // giảm chuyển động: nửa góc
  });

  it('vuốt trên mặt nước: không dời điểm hút, không tạo gợn', () => {
    const s = setup(makeEngineCtx(meta));
    const before = s.shared.attract.point.value.toArray();
    s.onGesture({ kind: 'swipe', ray: down(5, 5), velocity: { x: 1, y: 0 } });
    expect(s.shared.attract.point.value.toArray()).toEqual(before);
    expect(s.shared.ripples.slots.every((v) => v.w === 0)).toBe(true);
    expect(s.shared.attract.strength.value).toBe(0);
  });

  it('chạm ngoài ao hoặc tia không cắt mặt nước thì bỏ qua', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'tap', ray: down(100, 0) });
    s.onGesture({ kind: 'tap', ray: new Ray(new Vector3(0, 5, 0), new Vector3(1, 0, 0)) });
    expect(s.shared.ripples.slots.every((v) => v.w === 0)).toBe(true);
  });

  it('giữ tay: lực hút lên dần tới 1; thả tay: đẩy ra rồi tắt dần', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'hold-start', ray: down(0, 10) });
    s.update(0.25, 0.25);
    expect(s.shared.attract.strength.value).toBeCloseTo(0.5, 6);
    s.update(1, 1.25);
    expect(s.shared.attract.strength.value).toBe(1);
    s.onGesture({ kind: 'hold-end', ray: down(0, 10) });
    expect(s.shared.attract.strength.value).toBe(-1.5);
    s.update(1, 2.25);
    expect(s.shared.attract.strength.value).toBeCloseTo(-1.5 * Math.exp(-2.5), 6);
  });

  it('thả tay ngoài ao vẫn là thả: đom đóm bung rồi tắt dần, không bị hút mãi', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'hold-start', ray: down(0, 10) });
    s.update(1, 1);
    expect(s.shared.attract.strength.value).toBe(1);
    s.onGesture({ kind: 'hold-end', ray: down(100, 0) }); // ngón tay trượt ra ngoài ao rồi mới thả
    s.update(1, 2);
    expect(s.shared.attract.strength.value).toBeCloseTo(-1.5 * Math.exp(-2.5), 6);
    expect(s.shared.attract.point.value.toArray()).toEqual([0, s.shared.attract.point.value.y, 10]);
  });

  it('giữ rồi thả hoàn toàn ngoài ao thì không có gì bung ra', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'hold-start', ray: down(100, 0) });
    s.onGesture({ kind: 'hold-end', ray: down(100, 0) });
    expect(s.shared.attract.strength.value).toBe(0);
  });

  it('giảm chuyển động: gợn sóng nửa biên độ (§10)', () => {
    const s = setup(makeEngineCtx(meta, { reducedMotion: true }));
    s.onGesture({ kind: 'tap', ray: down(0, 0) });
    expect(s.shared.ripples.slots[0].w).toBe(0.5);
  });

  it('update: trăng đi theo uniform giờ (Dial của GĐ 4 chỉ cần đổi uniform này)', () => {
    const s = setup(makeEngineCtx(meta, { now: NOW }));
    s.shared.hour.value = 26;
    s.update(1 / 60, 0);
    expect(s.shared.moon.dir.value.toArray()).toEqual(moonDirection(26));
  });
});

describe('thanh giờ (Dial "gio", GĐ 4)', () => {
  it('formatHour: thang 18 → 29,5 ra "hh:mm"; quá 24 giờ là sáng hôm sau', () => {
    expect([formatHour(18), formatHour(21), formatHour(23.75), formatHour(26.25), formatHour(29.5)])
      .toEqual(['18:00', '21:00', '23:45', '02:15', '05:30']);
  });

  it('setup().dials: một Dial trên đúng uniform giờ; 18 → 29,5, bước 15 phút', () => {
    const s = setup(makeEngineCtx(meta));
    const [gio] = s.dials;
    expect(gio).toMatchObject({ id: 'gio', min: 18, max: 29.5, step: 0.25 });
    expect(gio.uniform).toBe(s.shared.hour);
    expect([gio.format(gio.min), gio.format(gio.max)]).toEqual(['18:00', '05:30']);
  });

  it('ghi chú "daytime" chỉ khi đang là ban ngày VÀ thanh còn ở giá trị mặc định; đêm thì không bao giờ', () => {
    const day = setup(makeEngineCtx(meta, { now: vn('2026-09-28T12:00') }));
    const [gio] = day.dials;
    expect(gio.note()).toBe('daytime');
    gio.uniform.value = 27; // người xem kéo thanh
    expect(gio.note()).toBeNull();
    gio.uniform.value = 21; // kéo về đúng 21:00 thì lời nhắc quay lại (vẫn là giờ mượn)
    expect(gio.note()).toBe('daytime');
    const night = setup(makeEngineCtx(meta, { now: NOW }));
    expect(night.dials[0].note()).toBeNull();
  });
});
