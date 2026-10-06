// tests/paintings/dan-ga-me-con/cot-hinh-ga.test.js — hình gà đủ phần (spec §20.3) và chỗ của chúng: phần nào của gà mẹ, gà con có trong geometry; đầu mỏ khớp CHICK; khớp của gà mẹ ở tọa độ thế giới; con trèo lưng, con nấp bụng sát mẹ mà không lún vào mẹ; ở góc nhìn của tranh thấy được cả mười con.
import { describe, it, expect } from 'vitest';
import { Mesh, MeshBasicMaterial, Raycaster, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import { CAMERA, CHICK, HEN, HOMES } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import {
  HEN_JOINTS, HEN_SHAPE, PART, chickGeometry, henGeometry,
} from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';

const SEGMENTS = 24;
const partsOf = (geometry) => new Set(geometry.attributes.part.array);
const named = (set) => Object.keys(PART).filter((name) => set.has(PART[name])).sort();
/** Đỉnh (x, y, z) của các phần thỏa `keep` trong một geometry. */
const vertices = (geometry, keep = () => true) => {
  const { position, part } = geometry.attributes;
  const out = [];
  for (let i = 0; i < position.count; i += 1) if (keep(part.getX(i))) out.push([position.getX(i), position.getY(i), position.getZ(i)]);
  return out;
};
/** Chỗ thật của một đỉnh gà con ở dáng nghỉ: quay theo hướng (như rotation.y của three) rồi dời tới chỗ (x, y, z). */
const place = ([x, y, z], [px, py, pz, h]) => [px + x * Math.cos(h) + z * Math.sin(h), py + y, pz + z * Math.cos(h) - x * Math.sin(h)];
const restPose = (home) => [home.at[0], home.kind === 'back' ? HEN.back : 0, home.at[1], home.heading];
/** Điểm thế giới về khung của gà mẹ (ngược của xoay HEN.heading rồi dời HEN.at). */
const toHen = ([x, y, z]) => {
  const [dx, dz] = [x - HEN.at[0], z - HEN.at[1]];
  const h = -HEN.heading;
  return [dx * Math.cos(h) + dz * Math.sin(h), y, dz * Math.cos(h) - dx * Math.sin(h)];
};
/** Các khối cầu kéo dãn của gà mẹ (mình, đầu, hai cánh…), trong khung của mẹ. */
const henBalls = [...HEN_SHAPE.body, HEN_SHAPE.wingL, HEN_SHAPE.wingR].filter((s) => s.kind === 'ball');
/** > 1 là ngoài khối cầu kéo dãn s (bán kính r, tỉ lệ scale, tâm at). */
const outside = (s, [x, y, z]) => ((x - s.at[0]) / (s.r * s.scale[0])) ** 2 + ((y - s.at[1]) / (s.r * s.scale[1])) ** 2
  + ((z - s.at[2]) / (s.r * s.scale[2])) ** 2;

describe('cot-hinh-ga', () => {
  it('gà con đủ phần: mình, đuôi, chân, cánh, đầu, mỏ, mắt; gà mẹ: mình có cả mào và con ong, hai cánh là hai geometry riêng', () => {
    expect(named(partsOf(chickGeometry({ segments: SEGMENTS })))).toEqual(['BEAK', 'BODY', 'EYE', 'HEAD', 'LEG', 'TAIL', 'WING']);
    const hen = henGeometry({ segments: SEGMENTS });
    expect(named(partsOf(hen.body))).toEqual(['BEAK', 'BEE', 'BODY', 'COMB', 'EYE', 'HEAD', 'LEG', 'TAIL']);
    expect(named(partsOf(hen.wingL))).toEqual(['WING']);
    expect(named(partsOf(hen.wingR))).toEqual(['WING']);
    // Mỗi geometry có đủ thuộc tính cho các lớp sau: pháp tuyến (nấc sáng), UV (nét trong của Task 5), part.
    for (const g of [chickGeometry({ segments: SEGMENTS }), hen.body, hen.wingL]) {
      expect(Object.keys(g.attributes).sort()).toEqual(['normal', 'part', 'position', 'uv']);
    }
  });

  it('đầu mỏ của gà con lúc ngẩng là CHICK.beak; tâm mình ở chừng CHICK.center (tấm bìa dẹt quanh đó)', () => {
    const beak = vertices(chickGeometry({ segments: SEGMENTS }), (p) => p === PART.BEAK);
    const tip = beak.reduce((a, b) => (b[2] > a[2] ? b : a));
    expect(tip[2]).toBeCloseTo(CHICK.beak[1], 6);
    expect(tip[1]).toBeCloseTo(CHICK.beak[0], 6);
    const body = vertices(chickGeometry({ segments: SEGMENTS }), (p) => p === PART.BODY).map((v) => v[1]);
    expect((Math.min(...body) + Math.max(...body)) / 2).toBeCloseTo(CHICK.center, 1);
  });

  it('gà mẹ dựng sẵn ở tọa độ thế giới: quay sang trái (−x), mắt và mỏ ở phía trước; khớp (cổ, hông, vai) đã đổi sang thế giới', () => {
    const hen = henGeometry({ segments: SEGMENTS });
    const beak = vertices(hen.body, (p) => p === PART.BEAK);
    const tail = vertices(hen.body, (p) => p === PART.TAIL);
    expect(Math.min(...beak.map((v) => v[0])), 'mỏ ở bên trái').toBeLessThan(-2);
    expect(Math.max(...tail.map((v) => v[0])), 'đuôi ở bên phải').toBeGreaterThan(2);
    expect(HEN_JOINTS.forward.map((v) => Math.round(v * 1e9) / 1e9)).toEqual([-1, 0, 0]);
    // Bên trái của gà mẹ hướng về người xem (+z): cánh trái ở phía +z, cánh phải ở phía −z.
    expect(HEN_JOINTS.left[2]).toBeCloseTo(1, 9);
    const zOf = (g) => vertices(g).reduce((s, v) => s + v[2], 0) / g.attributes.position.count;
    expect(zOf(hen.wingL)).toBeGreaterThan(0.8);
    expect(zOf(hen.wingR)).toBeLessThan(-0.8);
    expect(HEN_JOINTS.shoulderL[2]).toBeGreaterThan(0);
    expect(HEN_JOINTS.shoulderR[2]).toBeLessThan(0);
    expect(HEN_JOINTS.center).toEqual([HEN.at[0], HEN.height / 2, HEN.at[1]]);
    expect(HEN_JOINTS.neck[0], 'cổ ở phía trước tâm mình').toBeLessThan(HEN.at[0] - 0.5);
  });

  it('con trèo lưng và con nấp bụng sát mẹ mà không lún vào mẹ: mọi đỉnh (trừ chân con trèo lưng) ở ngoài mình, đầu, cánh của mẹ', () => {
    const chick = chickGeometry({ segments: SEGMENTS });
    for (const kind of ['back', 'belly']) {
      const home = HOMES.find((h) => h.kind === kind);
      const keep = kind === 'back' ? (p) => p !== PART.LEG : () => true;
      for (const v of vertices(chick, keep)) {
        const p = toHen(place(v, restPose(home)));
        for (const s of henBalls) expect(outside(s, p), `con ${kind}: đỉnh ${p.map((c) => c.toFixed(2))} lún vào ${s.part}`).toBeGreaterThan(1);
      }
    }
  });

  it('con trèo lưng đứng ĐÚNG trên lưng mẹ: chân chạm mặt lưng (lệch dưới 0,05), không lơ lửng', () => {
    const home = HOMES.find((h) => h.kind === 'back');
    const body = HEN_SHAPE.body.find((s) => s.part === 'BODY');
    const [sx, sy, sz] = body.scale.map((k) => k * body.r);
    for (const side of [-1, 1]) {
      const foot = toHen(place([0.14 * side, 0, 0], restPose(home)));
      const surface = body.at[1] + sy * Math.sqrt(1 - ((foot[0] - body.at[0]) / sx) ** 2 - ((foot[2] - body.at[2]) / sz) ** 2);
      expect(Math.abs(foot[1] - surface), `chân ${side}`).toBeLessThan(0.05);
    }
  });

  it.each([1.6, 390 / 844])('ở góc nhìn của tranh (khung tỉ lệ %s), thấy được cả mười con: tia qua đầu và mình mỗi con trúng chính nó trước', (aspect) => {
    const cam = createCamera(CAMERA, aspect);
    const material = new MeshBasicMaterial();
    const hen = henGeometry({ segments: SEGMENTS });
    const henMeshes = [hen.body, hen.wingL, hen.wingR].map((g) => new Mesh(g, material));
    const chicks = HOMES.map((home) => {
      const [x, y, z, h] = restPose(home);
      const mesh = new Mesh(chickGeometry({ segments: SEGMENTS }), material);
      mesh.position.set(x, y, z);
      mesh.rotation.y = h;
      mesh.updateMatrixWorld();
      return mesh;
    });
    const raycaster = new Raycaster();
    chicks.forEach((mesh, i) => {
      for (const local of [[0, 0.9, 0.38], [0, 0.5, -0.05]]) { // tâm đầu, tâm mình
        const ndc = new Vector3(...local).applyMatrix4(mesh.matrixWorld).project(cam);
        raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
        const [hit] = raycaster.intersectObjects([...henMeshes, ...chicks], false);
        const who = chicks.indexOf(hit?.object);
        expect(who, `con ${i} (${HOMES[i].kind}) bị ${who < 0 ? 'gà mẹ' : `con ${who}`} che ở ${local}`).toBe(i);
      }
    });
  });
});
