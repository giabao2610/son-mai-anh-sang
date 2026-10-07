// tests/paintings/dan-ga-me-con/cu-chi.test.js — cử chỉ của Bức 4 (shared.js, spec §20.2), dựng cả bức: chạm rắc thóc ở đúng điểm trên sàn (tia của camera trực giao), chạm lên vách, ra ván, tia song song mặt sàn hay tia hỏng (khung cỡ 0) vẫn rơi trong sàn mà không ném lỗi; giữ thì gà mẹ gọi con, thả thì tản; vuốt, chạm đúp không thêm mốc; hai mươi lần chạm trong một giây; lớp Đàn gà mài về 0 thì chạm, giữ không làm gì; drift chạy trước cử chỉ.
import { describe, it, expect } from 'vitest';
import { Ray, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { FLOOR, LAYOUT, floorPoint } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = () => buildPainting(painting, meta);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const inFloor = ([x, z]) => x >= FLOOR.x[0] && x <= FLOOR.x[1] && z >= FLOOR.z[0] && z <= FLOOR.z[1];
/** Tia của cú chạm vào điểm thế giới p: từ camera của sân khấu qua NDC của p, như input.js dựng. */
function rayTo(camera, p) {
  const ndc = new Vector3(...p).project(camera);
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), camera);
  return raycaster.ray.clone();
}
/** Tia từ NDC (kể cả NaN, ±Infinity của khung cỡ 0), như input.js. */
function rayAt(camera, x, y) {
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(x, y), camera);
  return raycaster.ray.clone();
}
/** Một khung như scene.step: đồng hồ, cử chỉ, rồi setup.update (drift). */
function frame(built, t, gestures = []) {
  built.ctx.u.time.value = t;
  for (const g of gestures) built.setup.onGesture(g);
  built.setup.update(1 / 60, t);
}
const finite = (st) => st.chicks.every((c) => [c.x, c.y, c.z, c.heading, c.head, ...c.beak].every(Number.isFinite))
  && Object.values(st.hen).every(Number.isFinite);
/** Nắm của cú chạm (count null: lớp dùng núm handful), bỏ nhúm lúc mở trang và nắm gà mẹ bới. */
const tapsOf = (handfuls) => handfuls.filter((h) => h.count === null);

describe('cử chỉ (Bức 4)', () => {
  it('chạm vào sàn ở (−3; 2): nắm rơi ở đúng điểm ấy (tia của camera trực giao), đàn gà dời nó như dời mọi điểm chạm sát mẹ', () => {
    const built = build();
    const ray = rayTo(built.ctx.camera, [-3, 0, 2]);
    expect(floorPoint(ray).map((v) => v.toFixed(6))).toEqual(['-3.000000', '2.000000']);
    frame(built, 4, [{ kind: 'tap', ray, ndc: { x: 0, y: 0 }, pointer: 'mouse' }]);
    const [mine] = tapsOf(built.shared.flock.takeScatters(4));
    // Đàn riêng nhận đúng (−3; 2) cùng lúc: điểm (đã dời ra khỏi vòng cấm quanh mẹ) phải như nhau.
    const ref = createFlock(LAYOUT);
    ref.drift(4);
    ref.scatter(4, [-3, 2], 0);
    const [want] = tapsOf(ref.takeScatters(4));
    expect(mine.at.map((v) => v.toFixed(9))).toEqual(want.at.map((v) => v.toFixed(9)));
    expect(dist(mine.at, [-3, 2]), 'chỉ dời chút ít ra khỏi vòng cấm').toBeLessThan(0.2);
  });

  it('chạm lên vách, ra ván, tia song song mặt sàn, khung cỡ 0 (NDC NaN, vô cực), cử chỉ thiếu tia: không ném lỗi; nắm hữu hạn, trong sàn', () => {
    const built = build();
    const cam = built.ctx.camera;
    const rays = {
      'lên vách': rayTo(cam, [2, 3, -5]),
      'ra ván bên phải': rayTo(cam, [12, 0, 2]),
      'ra ván phía trước': rayTo(cam, [-2, 0, 9]),
      'song song mặt sàn': new Ray(new Vector3(0, 7, 12), new Vector3(1, 0, 0)),
      'khung cỡ 0 (NaN)': rayAt(cam, NaN, NaN),
      'khung cỡ 0 (vô cực)': rayAt(cam, Infinity, -Infinity),
      'tia NaN': new Ray(new Vector3(NaN, NaN, NaN), new Vector3(NaN, NaN, NaN)),
      'thiếu tia': undefined,
    };
    let t = 2;
    for (const [name, ray] of Object.entries(rays)) {
      t += 0.5;
      expect(() => frame(built, t, [{ kind: 'tap', ray, pointer: 'touch' }]), name).not.toThrow();
      const handfuls = tapsOf(built.shared.flock.takeScatters(t));
      expect(handfuls, name).toHaveLength(1);
      const { at } = handfuls[0];
      expect(at.every(Number.isFinite) && inFloor(at), `${name}: ${at}`).toBe(true);
      expect(finite(built.shared.flock.state(t + 1)), name).toBe(true);
    }
  });

  it('giữ thì gà mẹ gọi con: 3 giây sau quanhMe ≥ 8; thả thì tản, rồi chỉ còn con trèo lưng và con nấp bụng quanh mẹ', () => {
    const built = build();
    const { flock } = built.shared;
    frame(built, 1);
    expect(flock.state(1).near).toBeLessThanOrEqual(4);
    frame(built, 2, [{ kind: 'hold-start', ray: rayTo(built.ctx.camera, [0, 3, -5]) }]);
    expect(flock.state(5).near).toBeGreaterThanOrEqual(8);
    frame(built, 5, [{ kind: 'hold-move', ray: rayTo(built.ctx.camera, [0, 3, -5]) }, { kind: 'hold-end', ray: rayTo(built.ctx.camera, [0, 3, -5]) }]);
    expect(flock.state(5.05).near, 'vừa thả: còn quanh mẹ').toBeGreaterThanOrEqual(8);
    expect(flock.state(25).near).toBe(2);
  });

  it("'swipe', 'double-tap', 'hold-move', 'hover' không thêm mốc (chạm đúp là hai 'tap' đi trước nó)", () => {
    const built = build();
    const { flock } = built.shared;
    frame(built, 1);
    const before = flock.marks();
    frame(built, 2, [
      { kind: 'swipe', velocity: { x: 3, y: 0 }, ray: rayTo(built.ctx.camera, [-3, 0, 2]) },
      { kind: 'double-tap', ray: rayTo(built.ctx.camera, [-3, 0, 2]) },
      { kind: 'hold-move', ray: rayTo(built.ctx.camera, [-3, 0, 2]) },
      { kind: 'hover', ray: rayTo(built.ctx.camera, [-3, 0, 2]) },
    ]);
    expect(flock.marks()).toBe(before);
  });

  it('chạm hai mươi lần trong một giây cảnh (sàn, vách, ván): tối đa 32 mốc, mọi nắm trong sàn, đàn gà hữu hạn', () => {
    const built = build();
    const { flock } = built.shared;
    const targets = [[-4, 0, 2], [3, 0, 3], [0, 3, -5], [9, 0, 1], [0, 0, 0]];
    for (let n = 0; n < 20; n += 1) {
      frame(built, 1 + n * 0.05, [{ kind: 'tap', ray: rayTo(built.ctx.camera, targets[n % targets.length]) }]);
    }
    expect(flock.marks()).toBeLessThanOrEqual(32);
    const handfuls = flock.takeScatters(3);
    expect(tapsOf(handfuls)).toHaveLength(20);
    for (const { at } of handfuls) expect(inFloor(at), `${at}`).toBe(true);
    for (let t = 1; t < 30; t += 0.25) expect(finite(flock.state(t)), `lúc ${t}`).toBe(true);
  });

  it('lớp Đàn gà mài về 0 (gà đứng như tượng, không có thóc): chạm và giữ không làm gì, không con nào chạy hay mổ; gà mẹ vẫn bới theo đồng hồ; cái giữ bắt đầu lúc lớp còn phủ vẫn được thả', () => {
    const built = build();
    const { flock } = built.shared;
    const ray = rayTo(built.ctx.camera, [-4.5, 0, 2.5]);
    built.ctx.weights.set('dan-ga', 0);
    frame(built, 10); // nhúm lúc mở trang đã ăn xong, các con đã về
    const before = flock.marks();
    frame(built, 11, [{ kind: 'tap', ray }, { kind: 'hold-start', ray }]);
    frame(built, 12, [{ kind: 'hold-end', ray }]);
    expect(flock.marks(), 'không thêm mốc nào').toBe(before);
    for (const t of [12, 14, 16]) expect([flock.state(t).eating, flock.state(t).near], `lúc ${t}`).toEqual([0, 2]);
    frame(built, FLOCK.auto + 1);
    expect(flock.marks(), 'gà mẹ vẫn bới (drift chạy mỗi khung)').toBe(before + 1);
    // Giữ lúc lớp còn phủ, mài về 0 rồi mới thả: đàn gà vẫn nhận cái thả, gà mẹ không xòe cánh mãi.
    const other = build();
    frame(other, 2, [{ kind: 'hold-start', ray }]);
    other.ctx.weights.set('dan-ga', 0);
    frame(other, 5, [{ kind: 'hold-end', ray }]);
    const later = other.shared.flock.state(20);
    expect(later.hen.wing).toBeLessThan(1e-3);
    expect(later.near).toBe(2);
  });

  it('drift chạy trước cử chỉ của khung: cú chạm đầu tiên sau 25 giây lặng không xóa lần gà mẹ bới đã tới hạn', () => {
    const built = build();
    const { flock } = built.shared;
    frame(built, 1);
    const t = FLOCK.auto + 1; // nhúm lúc mở trang là mốc lúc 0: lần bới tới hạn lúc 25
    frame(built, t, [{ kind: 'tap', ray: rayTo(built.ctx.camera, [-4, 0, 3]) }]);
    const handfuls = flock.takeScatters(t + 1);
    expect(handfuls.some((h) => h.auto), 'gà mẹ vẫn bới').toBe(true);
    expect(tapsOf(handfuls)).toHaveLength(1);
  });
});
