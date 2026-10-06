// tests/paintings/dan-ga-me-con/cot-hinh-ga.test.js — hình gà đủ phần (spec §20.3) và chỗ của chúng: phần nào của gà mẹ, gà con có trong geometry; đầu mỏ khớp CHICK; khớp của gà mẹ ở tọa độ thế giới; cực của cầu mắt ở giữa chỏm mắt; con trèo lưng, con nấp bụng sát mẹ mà không lún vào mọi khối của mẹ (đọc chỗ thật qua placement()); tám chỗ núp (quay ra ngoài, ngó nghiêng) không lún vào mẹ, không chồng lên nhau hay lên con nấp bụng; cả chuyến đi của đàn gà (giữ, thả, chạm ngay vào mẹ, mẹ bới), không chỉ lúc đã núp, không khung nào có gà con lún vào mẹ; ở góc nhìn của tranh thấy được cả mười con.
import { describe, it, expect } from 'vitest';
import { ConeGeometry, CylinderGeometry, Matrix4, Mesh, MeshBasicMaterial, Raycaster, SphereGeometry, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import { CAMERA, CHICK, FLOOR, HEN, HOMES, LAYOUT, SLOTS } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import {
  CHICK_SHAPE, HEN_JOINTS, HEN_SHAPE, PART, chickGeometry, henGeometry, placement,
} from '../../../src/paintings/dan-ga-me-con/parts/cot-hinh-ga.js';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { nearestOnSegment } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-duong.js';
import { mulberry32 } from '../../../src/lib/random.js';

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
/** Mọi khối của gà mẹ (mình, đuôi, chân, bàn chân, đầu, mỏ, mào, mắt, ong, hai cánh), trong khung của mẹ. */
const henSolids = [...HEN_SHAPE.body, HEN_SHAPE.wingL, HEN_SHAPE.wingR];
/** Phần có tên của một khối, cho lời báo lỗi. */
const nameOf = (shape) => `${shape.part} ${shape.kind} ở ${shape.at}`;
/** Nghịch đảo của placement() của một khối, nhớ lại: mỗi khối bị thử hàng chục nghìn lần. */
const inverses = new WeakMap();
const inverseOf = (shape) => {
  if (!inverses.has(shape)) inverses.set(shape, new Matrix4().copy(placement(shape)).invert());
  return inverses.get(shape);
};
/**
 * Điểm p (khung của khối) có nằm trong khối lý tưởng không: đưa p về dạng chuẩn bằng nghịch đảo của placement() (đúng phép đặt mà hình
 * dùng, kể cả kéo dãn, xoay, dẹt), rồi so với cầu, nón, trụ chuẩn của three (dọc +y, tâm ở gốc). Lưới đa diện nằm trong khối lý tưởng, nên
 * phép thử này chặt hơn lưới thật.
 */
const inside = (shape, p) => {
  const q = new Vector3(...p).applyMatrix4(inverseOf(shape));
  if (shape.kind === 'ball') return q.length() < shape.r;
  if (Math.abs(q.y) > shape.h / 2) return false;
  const radius = shape.kind === 'cone' ? (shape.r * (shape.h / 2 - q.y)) / shape.h : shape.r;
  return Math.hypot(q.x, q.z) < radius;
};
/** Tâm (trong khung của gà con) của khối đầu tiên mang phần `part`. */
const centerOf = (part) => CHICK_SHAPE.find((s) => s.part === part).at;
/** Bàn chân của gà con: đáy của mỗi trụ chân (dời xuống nửa chiều cao từ tâm). */
const chickFeet = () => CHICK_SHAPE.filter((s) => s.part === 'LEG').map((s) => [s.at[0], s.at[1] - s.h / 2, s.at[2]]);

// ── Chỗ núp: gà con ở dáng pose [x, y, z, hướng] đọc chỗ thật của khối, hai chiều (đỉnh của con này trong khối của con kia).
/** Điểm thế giới về khung của gà con ở dáng pose (ngược của place). */
const toChick = ([x, y, z], [px, py, pz, h]) => {
  const [dx, dz] = [x - px, z - pz];
  return [dx * Math.cos(h) - dz * Math.sin(h), y - py, dx * Math.sin(h) + dz * Math.cos(h)];
};
/** Điểm thế giới p có nằm trong một khối nào của gà con ở dáng pose không. */
const insideChick = (pose, p) => CHICK_SHAPE.some((s) => inside(s, toChick(p, pose)));
/** Quanh gốc của gà con, mọi khối nằm trong 0,85 (đầu mỏ ở 0,8): đỉnh xa hơn 1 thì khỏi thử. */
const nearChick = (pose, w) => Math.hypot(w[0] - pose[0], w[2] - pose[2]) < 1;
/** Số đỉnh của gà con ở dáng `a` nằm trong khối của gà con ở dáng `b`. */
const sunkInChick = (verts, a, b) => verts.filter((v) => { const w = place(v, a); return nearChick(b, w) && insideChick(b, w); }).length;
/** Số đỉnh của gà con ở dáng pose nằm trong khối nào đó của mẹ (mình, đuôi, chân, đầu, cánh). */
const sunkInHen = (verts, pose) => verts.filter((v) => { const p = toHen(place(v, pose)); return henSolids.some((s) => inside(s, p)); }).length;
/** Số đỉnh của mẹ (`henVerts`: tọa độ thế giới) nằm trong khối của gà con ở dáng pose. */
const henSunkInChick = (henVerts, pose) => henVerts.filter((w) => nearChick(pose, w) && insideChick(pose, w)).length;
/** Dáng gà con núp ở chỗ slot: quay ra ngoài (từ mẹ tới chỗ núp), lệch `sway` rad vì ngó nghiêng (FLOCK.peek). */
const hidePose = (slot, sway) => [slot[0], 0, slot[1], Math.atan2(slot[0] - HEN.at[0], slot[1] - HEN.at[1]) + sway];
const SWAYS = [-FLOCK.peek, 0, FLOCK.peek];
/** Lưới thưa (12 vòng) cho nhanh: đỉnh nằm đúng trên mặt khối lý tưởng nên đủ để thử "lún vào". */
const COARSE = 12;
/**
 * Điểm thấp nhất của một cánh mẹ (cầu) khi mở `angle` rad quanh trục trước qua vai, như henWingPosition (cánh trái +angle, cánh phải −angle):
 * y của tâm trừ bán kính nhân độ dài hàng y của phần tuyến tính của ma trận đặt (cầu kéo dãn, xoay, dời).
 */
function lowestOfOpenWing(shape, sign, angle) {
  const [sx, sy, sz] = toHen(sign > 0 ? HEN_JOINTS.shoulderL : HEN_JOINTS.shoulderR);
  const m = new Matrix4().makeTranslation(sx, sy, sz)
    .multiply(new Matrix4().makeRotationAxis(new Vector3(0, 0, 1), sign * angle))
    .multiply(new Matrix4().makeTranslation(-sx, -sy, -sz))
    .multiply(placement(shape));
  const e = m.elements;
  return e[13] - shape.r * Math.hypot(e[1], e[5], e[9]);
}

describe('cot-hinh-ga', () => {
  it('gà con đủ phần: mình, đuôi, chân, cánh, đầu, mỏ, mắt; gà mẹ: mình có cả mào và con ong (thân, cánh ong), hai cánh là hai geometry riêng', () => {
    expect(named(partsOf(chickGeometry({ segments: SEGMENTS })))).toEqual(['BEAK', 'BODY', 'EYE', 'HEAD', 'LEG', 'TAIL', 'WING']);
    const hen = henGeometry({ segments: SEGMENTS });
    expect(named(partsOf(hen.body))).toEqual(['BEAK', 'BEE', 'BEE_WING', 'BODY', 'COMB', 'EYE', 'HEAD', 'LEG', 'TAIL']);
    // Cánh ong là phần riêng: vằn của Bản nét chỉ ở thân ong. Mọi phần của ong đi theo đầu (từ HEAD trở lên).
    expect(Math.min(PART.BEE, PART.BEE_WING)).toBeGreaterThan(PART.HEAD);
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

  it('mắt (gà con, gà mẹ, cả hai bên): đỉnh có uv.y = 1 (cực trên của cầu mắt) nằm đúng hướng từ tâm đầu ra tâm mắt; Bản nét vẽ vòng mắt và con ngươi quanh cực ấy', () => {
    // Gà mẹ dựng sẵn ở tọa độ thế giới: đưa đỉnh về khung của mẹ trước khi so với bảng khối.
    for (const [shapes, geometry, back] of [
      [CHICK_SHAPE, chickGeometry({ segments: SEGMENTS }), (v) => v],
      [HEN_SHAPE.body, henGeometry({ segments: SEGMENTS }).body, toHen],
    ]) {
      const head = shapes.find((s) => s.part === 'HEAD');
      const { position, part, uv } = geometry.attributes;
      for (const eye of shapes.filter((s) => s.part === 'EYE')) {
        const out = new Vector3(...eye.at).sub(new Vector3(...head.at)).normalize();
        const poles = [];
        for (let i = 0; i < position.count; i += 1) {
          if (part.getX(i) !== PART.EYE || uv.getY(i) < 0.9999) continue;
          const p = new Vector3(...back([position.getX(i), position.getY(i), position.getZ(i)]));
          if (Math.sign(p.x) === Math.sign(eye.at[0])) poles.push(p);
        }
        expect(poles.length, `mắt ở ${eye.at}`).toBeGreaterThan(0);
        for (const p of poles) expect(p.sub(new Vector3(...eye.at)).normalize().dot(out), `mắt ở ${eye.at}`).toBeCloseTo(1, 6);
      }
    }
  });

  it('phép thử "nằm trong khối" khớp hình thật của three: mọi đỉnh của từng khối gà mẹ (cầu xoay, nón dẹt, trụ) co 1% về tâm thì trong, nở 1% thì ngoài', () => {
    // Đỉnh của SphereGeometry, ConeGeometry, CylinderGeometry nằm đúng trên mặt khối lý tưởng; khối nào cũng lồi, tâm ở trong. Sai hướng nón
    // (đỉnh ở −y), quên phép xoay hay phép dẹt thì đỉnh co vào vẫn bị coi là ngoài, hay đỉnh nở ra vẫn bị coi là trong.
    const canonical = (s) => {
      if (s.kind === 'ball') return new SphereGeometry(s.r, 24, 14);
      if (s.kind === 'cone') return new ConeGeometry(s.r, s.h, 24);
      return new CylinderGeometry(s.r, s.r, s.h, 24);
    };
    for (const shape of henSolids) {
      const m = placement(shape);
      const center = new Vector3().setFromMatrixPosition(m);
      const { position } = canonical(shape).applyMatrix4(m).attributes;
      for (let i = 0; i < position.count; i += 1) {
        const v = new Vector3().fromBufferAttribute(position, i);
        expect(inside(shape, v.clone().lerp(center, 0.01).toArray()), `${nameOf(shape)}: đỉnh ${i} co vào`).toBe(true);
        expect(inside(shape, v.clone().sub(center).multiplyScalar(1.01).add(center).toArray()), `${nameOf(shape)}: đỉnh ${i} nở ra`).toBe(false);
      }
    }
  });

  it('con trèo lưng và con nấp bụng sát mẹ mà không lún vào mẹ: mọi đỉnh (trừ chân con trèo lưng) ở ngoài mọi khối của mẹ', () => {
    const chick = chickGeometry({ segments: SEGMENTS });
    for (const kind of ['back', 'belly']) {
      const home = HOMES.find((h) => h.kind === kind);
      const keep = kind === 'back' ? (p) => p !== PART.LEG : () => true;
      for (const v of vertices(chick, keep)) {
        const p = toHen(place(v, restPose(home)));
        for (const s of henSolids) expect(inside(s, p), `con ${kind}: đỉnh ${p.map((c) => c.toFixed(2))} lún vào ${nameOf(s)}`).toBe(false);
      }
    }
  }, 60000); // nặng (mọi đỉnh của gà con × mọi khối của mẹ, hàng trăm nghìn lần so): 3,6 s khi máy bận, sát trần mặc định 5 s

  it('con trèo lưng đứng ĐÚNG trên lưng mẹ: đáy mỗi chân (đọc từ CHICK_SHAPE) chạm mặt lưng (lệch dưới 0,05), không lơ lửng', () => {
    const home = HOMES.find((h) => h.kind === 'back');
    const body = HEN_SHAPE.body.find((s) => s.part === 'BODY');
    for (const foot of chickFeet().map((f) => toHen(place(f, restPose(home))))) {
      // Mặt lưng ngay dưới (hay trên) bàn chân: tìm đôi y, một trong một ngoài khối mình, rồi chia đôi.
      let [lo, hi] = [body.at[1], body.at[1] + 2 * body.r * body.scale[1]];
      for (let i = 0; i < 50; i += 1) {
        const mid = (lo + hi) / 2;
        if (inside(body, [foot[0], mid, foot[2]])) lo = mid;
        else hi = mid;
      }
      expect(Math.abs(foot[1] - lo), `chân ở ${foot.map((c) => c.toFixed(2))}`).toBeLessThan(0.05);
    }
  });

  it('bộ thử chồng nhau cắn thật: hai gà con cùng chỗ hay cách nửa đơn vị thì chồng, cách hai thì không; gà con đặt giữa thân mẹ thì lún', () => {
    const verts = vertices(chickGeometry({ segments: COARSE }));
    const here = [1, 0, 1, 0.4];
    expect(sunkInChick(verts, here, here), 'cùng chỗ').toBeGreaterThan(0);
    expect(sunkInChick(verts, here, [1.5, 0, 1, 0.4]), 'cách nửa đơn vị').toBeGreaterThan(0);
    expect(sunkInChick(verts, here, [3, 0, 1, 0.4]), 'cách hai đơn vị').toBe(0);
    expect(sunkInHen(verts, [HEN.at[0], 0, HEN.at[1], 0]), 'giữa thân mẹ').toBeGreaterThan(0);
    expect(sunkInHen(verts, [HEN.at[0] + 6, 0, HEN.at[1], 0]), 'xa mẹ').toBe(0);
    // Chiều ngược lại (đỉnh của mẹ trong khối gà con): gà con đặt đúng dưới hông chân mẹ thì chân mẹ đâm vào mình nó.
    const hen = henGeometry({ segments: COARSE });
    const henVerts = [hen.body, hen.wingL, hen.wingR].flatMap((g) => vertices(g));
    expect(henSunkInChick(henVerts, [HEN_JOINTS.hip[0], 0, HEN_JOINTS.hip[2], 0]), 'chân mẹ trong gà con').toBeGreaterThan(0);
    expect(henSunkInChick(henVerts, [HEN.at[0] + 6, 0, HEN.at[1], 0]), 'xa mẹ').toBe(0);
  });

  it('tám chỗ núp (quay ra ngoài, ngó nghiêng tới ±FLOCK.peek): gà con không lún vào mẹ, mẹ không lún vào gà con; cánh mở hết cỡ (FLOCK.wing) nằm trên đầu gà con', () => {
    const chick = vertices(chickGeometry({ segments: COARSE }));
    const hen = henGeometry({ segments: COARSE });
    const henVerts = [hen.body, hen.wingL, hen.wingR].flatMap((g) => vertices(g));
    for (const slot of SLOTS) {
      for (const sway of SWAYS) {
        const pose = hidePose(slot, sway);
        expect(sunkInHen(chick, pose), `chỗ ${slot}, ngó nghiêng ${sway}: đỉnh gà con lún vào mẹ`).toBe(0);
        expect(henSunkInChick(henVerts, pose), `chỗ ${slot}, ngó nghiêng ${sway}: đỉnh mẹ lún vào gà con`).toBe(0);
      }
    }
    const top = Math.max(...chick.map((v) => v[1]));
    for (const [shape, sign] of [[HEN_SHAPE.wingL, 1], [HEN_SHAPE.wingR, -1]]) {
      expect(lowestOfOpenWing(shape, sign, FLOCK.wing), 'điểm thấp nhất của cánh mở, so với đỉnh đầu gà con').toBeGreaterThan(top);
    }
  });

  it('gà mẹ gọi con: gật đầu hết cỡ (đỉnh của nhịp "cục cục") và ngoảnh tới ±0,25 thì đầu, mỏ, mào, con ong không lún vào gà con núp ở tám chỗ, và ngược lại', () => {
    // Gật quanh trục ngang qua cổ (góc dương cúi xuống), rồi ngoảnh quanh trục đứng qua cổ, như henPosition; làm trong khung của mẹ.
    const neck = toHen(HEN_JOINTS.neck);
    const turn = ([x, y, z], nod, look) => {
      let [py, pz] = [y - neck[1], z - neck[2]];
      [py, pz] = [py * Math.cos(nod) - pz * Math.sin(nod), py * Math.sin(nod) + pz * Math.cos(nod)];
      const px = x - neck[0];
      return [px * Math.cos(look) + pz * Math.sin(look) + neck[0], py + neck[1], pz * Math.cos(look) - px * Math.sin(look) + neck[2]];
    };
    const unturn = ([x, y, z], nod, look) => {
      const [px, qz] = [x - neck[0], z - neck[2]];
      const [rx, rz] = [px * Math.cos(look) - qz * Math.sin(look), qz * Math.cos(look) + px * Math.sin(look)];
      const py = y - neck[1];
      return [rx + neck[0], py * Math.cos(nod) + rz * Math.sin(nod) + neck[1], rz * Math.cos(nod) - py * Math.sin(nod) + neck[2]];
    };
    expect(unturn(turn([0.3, 2.9, 2.2], 0.4, 0.2), 0.4, 0.2).map((v) => v.toFixed(9))).toEqual(['0.300000000', '2.900000000', '2.200000000']);
    const fromHen = ([x, y, z]) => [HEN.at[0] + x * Math.cos(HEN.heading) + z * Math.sin(HEN.heading), y, HEN.at[1] + z * Math.cos(HEN.heading) - x * Math.sin(HEN.heading)];
    const headSolids = HEN_SHAPE.body.filter((s) => PART[s.part] >= PART.HEAD);
    const henHead = vertices(henGeometry({ segments: COARSE }).body, (part) => part >= PART.HEAD).map(toHen);
    const chick = vertices(chickGeometry({ segments: COARSE }));
    expect(FLOCK.nod, 'gật thấy được (rad)').toBeGreaterThan(0.2);
    expect(createFlock(LAYOUT).state(0).hen.nod, 'không giữ: không gật').toBe(0);
    for (const look of [-0.25, 0, 0.25]) {
      for (const slot of SLOTS) {
        for (const sway of SWAYS) {
          const pose = hidePose(slot, sway);
          const tag = `gật ${FLOCK.nod}, ngoảnh ${look}, chỗ ${slot}, ngó ${sway}`;
          expect(henHead.filter((v) => { const w = fromHen(turn(v, FLOCK.nod, look)); return nearChick(pose, w) && insideChick(pose, w); }).length, `${tag}: đầu mẹ lún vào gà con`).toBe(0);
          expect(chick.filter((v) => { const p = unturn(toHen(place(v, pose)), FLOCK.nod, look); return headSolids.some((s) => inside(s, p)); }).length, `${tag}: gà con lún vào đầu mẹ`).toBe(0);
        }
      }
    }
  }, 60000);

  it('tám chỗ núp: gà con ở hai chỗ kề nhau, hay kề con nấp bụng, không chồng lên nhau, kể cả lúc ngó nghiêng hết cỡ (con nấp bụng lắc ±FLOCK.perchSway)', () => {
    const verts = vertices(chickGeometry({ segments: COARSE }));
    const belly = HOMES.find((h) => h.kind === 'belly');
    const group = [
      ...SLOTS.map((slot) => ({ name: `chỗ ${slot}`, at: slot, poses: SWAYS.map((d) => hidePose(slot, d)) })),
      { name: 'con nấp bụng', at: belly.at, poses: [-FLOCK.perchSway, 0, FLOCK.perchSway].map((d) => [belly.at[0], 0, belly.at[1], belly.heading + d]) },
    ];
    let pairs = 0;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        const [a, b] = [group[i], group[j]];
        if (Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) > 2.5) continue; // xa hơn thì không thể chạm
        pairs += 1;
        for (const pa of a.poses) {
          for (const pb of b.poses) expect(sunkInChick(verts, pa, pb) + sunkInChick(verts, pb, pa), `${a.name} (hướng ${pa[3].toFixed(2)}) và ${b.name} (hướng ${pb[3].toFixed(2)}) chồng nhau`).toBe(0);
        }
      }
    }
    expect(pairs, 'số cặp kề nhau đã thử').toBeGreaterThanOrEqual(9); // vòng 8 chỗ có 7 cặp kề (con nấp bụng ngắt vòng), cộng 2 cặp kề con nấp bụng
  });

  it('cả chuyến đi của đàn gà, không chỉ lúc đã núp (giữ từ lúc nghỉ, giữ giữa các cú chạm và lúc đang chờ, chạy, mổ; chạm ngay vào mẹ, sau lưng mẹ, ở hai đầu; thả rồi giữ lại; mẹ bới): không khung nào có đỉnh gà con nằm trong khối của mẹ', () => {
    const chick = vertices(chickGeometry({ segments: COARSE })).filter((_, i) => i % 2 === 0);
    const { a, b } = LAYOUT.body;
    const sunk = [];
    let checked = 0;
    /** Chạy một cảnh 30 Hz (drift trước cử chỉ như update); mỗi khung thử các con rảnh ở gần mẹ. Gà con đã núp (kind hide) chỉ ngó nghiêng quanh dáng đã thử ở trên, nên bỏ qua. */
    const play = (tag, events, seconds, layout = LAYOUT) => {
      const flock = createFlock(layout);
      let e = 0;
      for (let k = 0; k <= seconds * 30; k += 1) {
        const t = k / 30;
        flock.drift(t);
        while (e < events.length && events[e][0] <= t) {
          const [when, kind, at, seed] = events[e];
          e += 1;
          if (kind === 'scatter') flock.scatter(when, at, seed);
          else if (kind === 'grip') flock.grip(when);
          else flock.release(when);
        }
        flock.state(t).chicks.forEach((c, i) => {
          if (HOMES[i].kind !== 'free' || c.kind === 'hide') return;
          const q = nearestOnSegment([c.x, c.z], a, b);
          if (Math.hypot(c.x - q[0], c.z - q[1]) > 2.1) return; // xa hơn thì không thể chạm: khối của mẹ ở độ cao gà con nằm trong viên thuốc bán kính 1,2, gà con rộng chưa tới 0,85
          checked += 1;
          const n = sunkInHen(chick, [c.x, 0, c.z, c.heading]);
          if (n > 0) sunk.push(`${tag}, lúc ${t.toFixed(2)}, con ${i} ${c.kind} ở [${c.x.toFixed(2)}, ${c.z.toFixed(2)}]: ${n} đỉnh`);
        });
      }
    };
    play('giữ từ lúc nghỉ, thả', [[2, 'grip'], [6, 'release']], 14);
    play('thả rồi giữ lại', [[2, 'grip'], [6, 'release'], [6.2, 'grip'], [9, 'release']], 16);
    for (const at of [1.2, 1.5, 3]) play(`giữ lúc ${at} (chờ, chạy, mổ)`, [[1, 'scatter', [-4.5, 2.5], 7], [at, 'grip'], [at + 4, 'release']], at + 9);
    for (const [k, tap] of [[0, 0], [0.4, -2.7], [-2.5, 0.2], [2.5, 0], [0.2, 2.6], [-3, -2.7]].entries()) play(`chạm vào mẹ ${tap}`, [[1, 'scatter', tap, k]], 13);
    const rand = mulberry32(4);
    for (let n = 0; n < 6; n += 1) {
      const events = [];
      for (let k = 0; k < 4; k += 1) events.push([1 + k * 1.5, 'scatter', [FLOOR.x[0] + rand() * 13.4, FLOOR.z[0] + rand() * 7.4], n * 10 + k]);
      const tg = 5.6 + rand() * 8;
      events.push([tg, 'grip'], [tg + 3, 'release']);
      play(`giữ sau bốn cú chạm, lần ${n}`, events, tg + 8);
    }
    play('mở trang và mẹ bới', [], 40);
    expect(checked, 'số tư thế đã thử').toBeGreaterThan(300);
    expect(sunk).toEqual([]);
  }, 60000); // nặng (nhiều cảnh, từng khung, đỉnh thật của khối): chừa thời gian cho máy chạy chậm hay đang bận

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
      for (const local of [centerOf('HEAD'), centerOf('BODY')]) {
        const ndc = new Vector3(...local).applyMatrix4(mesh.matrixWorld).project(cam);
        raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
        const [hit] = raycaster.intersectObjects([...henMeshes, ...chicks], false);
        const who = chicks.indexOf(hit?.object);
        expect(who, `con ${i} (${HOMES[i].kind}) bị ${who < 0 ? 'gà mẹ' : `con ${who}`} che ở ${local}`).toBe(i);
      }
    });
  });
});
