// tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js — bố cục của tờ tranh: góc nhìn của tranh đúng số §20.2; chỗ nhà của gà con trên sàn, không chồng nhau; cú chạm của camera trực giao trúng đúng điểm trên sàn.
import { describe, it, expect } from 'vitest';
import { Raycaster, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import { CAMERA, FLOOR, HEN, HOMES, PAPER, floorPoint } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const DEG = 180 / Math.PI;
const inFloor = ([x, z]) => x >= FLOOR.x[0] && x <= FLOOR.x[1] && z >= FLOOR.z[0] && z <= FLOOR.z[1];

describe('cot-bo-cuc', () => {
  it('góc nhìn của tranh: camera trực giao, nhìn chếch xuống chừng 20°, xoay ngang ±75°, xoay dọc 10°–70° trên mặt sàn', () => {
    expect(CAMERA.kind).toBe('ortho');
    const [dx, dy, dz] = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
    expect(Math.atan2(dy, Math.hypot(dx, dz)) * DEG).toBeCloseTo(20, 0);
    expect(CAMERA.azimuth.map((a) => a * DEG)).toEqual([-75, 75].map((a) => expect.closeTo(a, 6)));
    expect(CAMERA.polar.map((a) => 90 - a * DEG)).toEqual([70, 10].map((a) => expect.closeTo(a, 6))); // polar đo từ trục y
    expect([CAMERA.height, CAMERA.minWidth, CAMERA.zoom, CAMERA.breathe]).toEqual([12, 15.5, [1, 2.5], 0]);
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
  });
});
