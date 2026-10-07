// tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js — bố cục của tờ tranh: góc nhìn của tranh đúng số §20.2 (cả số của tranh tự khép lại và của canvas thấp); chỗ nhà của gà con trên sàn, không chồng nhau; tám chỗ núp quanh mẹ (dưới 2,2 để quanhMe đếm đủ mười, ngoài thân mẹ, cách nhau và cách con nấp bụng) và nhúm thóc trước mặt mẹ; đầu mỏ của gà con khi cúi (beakTip); cú chạm của camera trực giao trúng đúng điểm trên sàn; số đo `goc` (viewAngle).
import { describe, it, expect } from 'vitest';
import { Raycaster, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import {
  CAMERA, CHICK, FLOOR, HEN, HEN_BODY, HEN_FRONT, HOMES, LAYOUT, PAPER, PILE, SLOTS, beakTip, floorPoint, viewAngle,
} from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
/** Bốn góc ngoài cùng của tờ giấy: hai góc mép trước (trên sàn) và hai góc mép trên (đỉnh vách). */
const sheetCorners = () => [-1, 1].flatMap((side) => [
  [side * PAPER.width / 2, 0, PAPER.front],
  [side * PAPER.width / 2, PAPER.top, PAPER.back - PAPER.bend],
]);
const DEG = 180 / Math.PI;
const inFloor = ([x, z]) => x >= FLOOR.x[0] && x <= FLOOR.x[1] && z >= FLOOR.z[0] && z <= FLOOR.z[1];

describe('cot-bo-cuc', () => {
  it('góc nhìn của tranh: camera trực giao, nhìn chếch xuống chừng 20°, xoay ngang ±75°, xoay dọc 10°–70° trên mặt sàn', () => {
    expect(CAMERA.kind).toBe('ortho');
    const [dx, dy, dz] = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
    expect(Math.atan2(dy, Math.hypot(dx, dz)) * DEG).toBeCloseTo(20, 0);
    expect(CAMERA.azimuth.map((a) => a * DEG)).toEqual([-75, 75].map((a) => expect.closeTo(a, 6)));
    expect(CAMERA.polar.map((a) => 90 - a * DEG)).toEqual([70, 10].map((a) => expect.closeTo(a, 6))); // polar đo từ trục y
    expect([CAMERA.height, CAMERA.minWidth, CAMERA.zoom, CAMERA.breathe]).toEqual([13.2, 15.5, [1, 2.5], 0]);
    expect(CAMERA.shortFrame).toEqual({ below: 800, maxGrow: 1.3 }); // canvas thấp (vòng sau điểm duyệt ảnh, §20.2)
    expect(CAMERA.home).toEqual({ after: 3, duration: 1.2 }); // tranh tự khép lại (§20.2, §20.6 mục 3)
  });

  it.each([['16 : 10', 1.6], ['16 : 9', 16 / 9]])('khung máy tính %s: tờ giấy chiếm chừng 58% bề cao, nằm cao hơn tâm khung một chút, đủ bề ngang; còn ván tối trên và dưới cho chữ (điểm duyệt ảnh)', (_, aspect) => {
    const cam = createCamera(CAMERA, aspect);
    const ys = sheetCorners().map((p) => new Vector3(...p).project(cam));
    const top = Math.max(...ys.map((p) => p.y));
    const bottom = Math.min(...ys.map((p) => p.y));
    expect((top - bottom) / 2, 'phần bề cao khung').toBeGreaterThan(0.55);
    expect((top - bottom) / 2).toBeLessThan(0.61);
    expect((top + bottom) / 2, 'tâm giấy cao hơn tâm khung').toBeGreaterThan(0.02);
    expect((top + bottom) / 2).toBeLessThan(0.08);
    for (const p of ys) expect(Math.abs(p.x), 'giấy trong khung').toBeLessThan(0.8);
  });

  it('canvas thấp (laptop 1366 × 650, 1280 × 720, tới 800 / 1,3 ≈ 615): dải ván trên và dưới tờ giấy còn ít nhất 95% số điểm ảnh của chúng ở 1280 × 800, chỗ của chữ; điện thoại xoay ngang (cao 390): tờ giấy vẫn chiếm hơn 40% bề cao', () => {
    /** Điểm ảnh CSS của dải ván trên và dưới tờ giấy, và phần bề cao khung mà tờ giấy chiếm, ở canvas w × h. */
    const bands = (w, h) => {
      const ys = sheetCorners().map((p) => new Vector3(...p).project(createCamera(CAMERA, w / h, h)).y);
      return { above: (h / 2) * (1 - Math.max(...ys)), below: (h / 2) * (1 + Math.min(...ys)), share: (Math.max(...ys) - Math.min(...ys)) / 2 };
    };
    const desk = bands(1280, 800);
    for (const [w, h] of [[1366, 650], [1280, 720], [1280, 615], [1366, 780]]) {
      const b = bands(w, h);
      expect(b.above, `${w}×${h}: ván trên (ở 1280×800: ${desk.above.toFixed(1)})`).toBeGreaterThan(0.95 * desk.above);
      expect(b.below, `${w}×${h}: ván dưới (ở 1280×800: ${desk.below.toFixed(1)})`).toBeGreaterThan(0.95 * desk.below);
    }
    expect(bands(844, 390).share, 'điện thoại xoay ngang').toBeGreaterThan(0.4);
  });

  it('điện thoại dọc 390 × 844: khung nới theo minWidth, cả tờ giấy nằm trong khung', () => {
    const cam = createCamera(CAMERA, 390 / 844);
    for (const p of sheetCorners().map((c) => new Vector3(...c).project(cam))) {
      expect(Math.abs(p.x)).toBeLessThan(1);
      expect(Math.abs(p.y)).toBeLessThan(1);
    }
  });

  it('viewAngle (số đo goc): 0 ở góc của tranh; xoay ngang 30° quanh trục đứng qua điểm nhìn ra acos(cos²e·cos30° + sin²e), nhỏ hơn 30° vì camera nhìn chếch xuống; đổi riêng độ cao 10° ra đúng 10°', () => {
    const target = new Vector3(...CAMERA.target);
    const offset = new Vector3(...CAMERA.position).sub(target);
    const at = (v) => v.clone().add(target).toArray();
    expect(viewAngle(CAMERA.position)).toBeCloseTo(0, 5);
    const e = Math.atan2(offset.y, Math.hypot(offset.x, offset.z)); // độ cao của camera so với điểm nhìn
    const around = viewAngle(at(offset.clone().applyAxisAngle(new Vector3(0, 1, 0), 30 / DEG)));
    expect(around).toBeCloseTo(Math.acos(Math.cos(e) ** 2 * Math.cos(30 / DEG) + Math.sin(e) ** 2) * DEG, 6);
    expect(around).toBeGreaterThan(28);
    expect(around).toBeLessThan(30);
    // Trục nằm ngang, vuông góc với hướng ngang của camera: quay quanh nó chỉ đổi độ cao.
    const tilt = new Vector3(0, 1, 0).cross(new Vector3(offset.x, 0, offset.z)).normalize();
    expect(viewAngle(at(offset.clone().applyAxisAngle(tilt, 10 / DEG)))).toBeCloseTo(10, 6);
    expect(viewAngle(at(offset.clone().multiplyScalar(0.5)))).toBeCloseTo(0, 5); // lại gần điểm nhìn không đổi hướng nhìn
  });

  it('mười gà con: hai con trèo lưng và nấp bụng sát mẹ; tám con kia ở trên sàn, cách tâm mẹ hơn 2,2, không chồng nhau', () => {
    expect(HOMES).toHaveLength(10);
    expect(HOMES.filter((h) => h.kind === 'back')).toHaveLength(1);
    expect(HOMES.filter((h) => h.kind === 'belly')).toHaveLength(1);
    const free = HOMES.filter((h) => h.kind === 'free');
    expect(free).toHaveLength(8);
    for (const h of free) {
      expect(inFloor(h.at), `nhà ${h.at} ngoài sàn`).toBe(true);
      expect(dist(h.at, HEN.at), `nhà ${h.at} sát mẹ`).toBeGreaterThan(2.2);
    }
    for (let i = 0; i < free.length; i += 1) {
      for (let j = i + 1; j < free.length; j += 1) expect(dist(free[i].at, free[j].at)).toBeGreaterThan(1.3);
    }
  });

  it('tám chỗ núp: trên sàn, cách tâm mẹ dưới 2,2 (quanhMe đếm đủ mười), ngoài bầu dục thân mẹ; đôi một cách nhau hơn 1,3, cách con nấp bụng hơn 1,4 và con trèo lưng hơn 1 (chỗ gà con núp không chồng nhau)', () => {
    expect(SLOTS).toHaveLength(8);
    const belly = HOMES.find((h) => h.kind === 'belly').at;
    const back = HOMES.find((h) => h.kind === 'back').at;
    for (const s of SLOTS) {
      expect(inFloor(s), `chỗ núp ${s} ngoài sàn`).toBe(true);
      expect(dist(s, HEN.at), `chỗ núp ${s} xa tâm mẹ`).toBeLessThan(2.2);
      expect(((s[0] - HEN.at[0]) / 2) ** 2 + ((s[1] - HEN.at[1]) / 1.2) ** 2, `chỗ núp ${s} nằm trong thân mẹ`).toBeGreaterThan(1);
      expect(dist(s, belly), `chỗ núp ${s} sát con nấp bụng`).toBeGreaterThan(1.4);
      expect(dist(s, back), `chỗ núp ${s} sát con trèo lưng`).toBeGreaterThan(1);
    }
    for (let i = 0; i < SLOTS.length; i += 1) {
      for (let j = i + 1; j < SLOTS.length; j += 1) expect(dist(SLOTS[i], SLOTS[j]), `chỗ núp ${SLOTS[i]} và ${SLOTS[j]}`).toBeGreaterThan(1.3);
    }
  });

  it('thân mẹ (HEN_BODY): xương sống dọc trục dài của mẹ, nửa bề ngang HEN.width / 2; bầu dục thân mẹ nằm trọn trong viên thuốc; chỗ núp và nhà của con nấp bụng nằm ngoài thân', () => {
    const { a, b, r } = HEN_BODY;
    expect(r).toBe(HEN.width / 2);
    expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(HEN.length - HEN.width, 12); // hai nắp tròn bán kính r khép lại đúng chiều dài mẹ
    expect([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]).toEqual(HEN.at);
    expect(a[1]).toBe(b[1]); // mẹ quay sang −x: xương sống nằm ngang theo x
    const gap = ([x, z]) => Math.hypot(x - Math.min(Math.max(x, a[0]), b[0]), z - a[1]); // tới đoạn a–b (nằm ngang)
    for (let k = 0; k < 360; k += 1) {
      const th = (k * Math.PI) / 180; // bầu dục nửa trục (length / 2, width / 2)
      expect(gap([HEN.at[0] + (HEN.length / 2) * Math.cos(th), HEN.at[1] + (HEN.width / 2) * Math.sin(th)]), `góc ${k}`).toBeLessThanOrEqual(r + 1e-9);
    }
    for (const s of [...SLOTS, HOMES.find((h) => h.kind === 'belly').at]) expect(gap(s), `${s} nằm trong thân mẹ`).toBeGreaterThanOrEqual(r);
  });

  it('LAYOUT gom đủ bố cục cho đàn gà dạng đóng (nhà, tâm mẹ, chỗ núp, nhúm thóc, chỗ bới, đầu mỏ, lưng mẹ, sàn, thân mẹ; đóng băng); nhúm thóc và chỗ gà mẹ bới nằm trên sàn, trước mặt mẹ, ngoài đầu mẹ', () => {
    expect(LAYOUT).toEqual({ homes: HOMES, hen: HEN.at, slots: SLOTS, pile: PILE, henFront: HEN_FRONT, beakTip, back: HEN.back, floor: FLOOR, body: HEN_BODY });
    expect([LAYOUT, SLOTS, ...SLOTS, PILE, HEN_FRONT, HEN_BODY, HEN_BODY.a, HEN_BODY.b].every(Object.isFrozen)).toBe(true);
    for (const p of [PILE, HEN_FRONT]) {
      expect(inFloor(p), `${p} ngoài sàn`).toBe(true);
      expect(p[0], `${p} không ở trước mặt mẹ`).toBeLessThan(HEN.at[0] - HEN.length / 2); // mẹ quay sang −x: trước mặt là phía x nhỏ, ngoài thân mẹ
    }
  });

  it('beakTip: lúc ngẩng là đầu mỏ CHICK.beak (đảo thành [ra trước, lên trên]); cúi hẳn (60°) thì mỏ chạm sàn; cúi dần thì mỏ hạ dần', () => {
    expect(CHICK.headDown).toBeCloseTo(Math.PI / 3, 12); // radian
    expect(beakTip(0)).toEqual([CHICK.beak[1], CHICK.beak[0]].map((v) => expect.closeTo(v, 12)));
    const [forward, up] = beakTip(1);
    expect(up, 'đầu mỏ khi cúi hẳn').toBeGreaterThanOrEqual(-0.05);
    expect(up).toBeLessThanOrEqual(0.1);
    expect(forward, 'mỏ vẫn ở phía trước chân').toBeGreaterThan(0.3);
    const heights = [0, 0.25, 0.5, 0.75, 1].map((k) => beakTip(k)[1]);
    for (let i = 1; i < heights.length; i += 1) expect(heights[i]).toBeLessThan(heights[i - 1]);
    // Đầu xoay quanh CHICK.pivot: khoảng cách từ trục tới đầu mỏ giữ nguyên ở mọi góc cúi.
    const reach = (k) => Math.hypot(beakTip(k)[0] - CHICK.pivot[1], beakTip(k)[1] - CHICK.pivot[0]);
    expect(reach(1)).toBeCloseTo(reach(0), 12);
  });

  it.each([1.6, 390 / 844])('chạm vào một điểm trên sàn (khung tỉ lệ %s) thì ra đúng điểm đó: tia của camera trực giao qua NDC của nó', (aspect) => {
    const cam = createCamera(CAMERA, aspect);
    const raycaster = new Raycaster();
    for (const [x, z] of [[0, 0], [-4, 3], [5, -2], [6, 4.5]]) {
      const ndc = new Vector3(x, 0, z).project(cam);
      raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
      const [hx, hz] = floorPoint(raycaster.ray);
      expect(hx).toBeCloseTo(x, 6);
      expect(hz).toBeCloseTo(z, 6);
    }
  });

  it('chạm lên vách, ra ván, hay tia không đi xuống: điểm gần nhất trên sàn, luôn hữu hạn và trong FLOOR', () => {
    const rays = [
      { origin: new Vector3(0, 7, 12), direction: new Vector3(0, 0.1, -1).normalize() }, // lên vách, ra khỏi giấy
      { origin: new Vector3(30, 7, 12), direction: new Vector3(0, -0.34, -0.94) }, // ra ván bên phải
      { origin: new Vector3(0, 7, 12), direction: new Vector3(1, 0, 0) }, // song song mặt sàn
      { origin: new Vector3(0, -2, 0), direction: new Vector3(0, -1, 0) }, // gốc dưới sàn
    ];
    for (const ray of rays) {
      const p = floorPoint(ray);
      expect(p.every(Number.isFinite) && inFloor(p), `${p}`).toBe(true);
    }
    expect(PAPER.front - PAPER.back).toBe(8); // sàn phẳng sâu 8, cộng chỗ uốn (bán kính 2) là 10 như §20.1
    expect(PAPER.top).toBe(4.5); // vách thấp (điểm duyệt ảnh): không còn nửa tờ giấy trống phía trên đàn gà
  });
});
