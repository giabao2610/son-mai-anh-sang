// tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
import { describe, it, expect } from 'vitest';
import { DynamicDrawUsage, Matrix4, Object3D, OrthographicCamera, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
import { moonStrength } from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
import { LIGHT_DISTANCE, SHADOW_BOX, fitShadowCamera } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-shadow.js';
import { DRIFT, lanternAt } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { moonDirection } from '../../../src/paintings/ao-sen-dem/shared.js';
import { moonPhase } from '../../../src/lib/astro/moon.js';
import { knobValue } from '../../../src/engine/gpu/knob-set.js';
import { NOW, buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
const lights = (scene, flag) => scene.children.filter((o) => o[flag]);

// ─── Hoa đăng (GĐ 5) ───
const PETALS = 8; // cánh của một đèn: mesh có (1 + budget.lanterns + 1) × 8 bản (spec §6 Lớp 2; vòng đệm có thêm một ô)
/** InstancedMesh của mọi đèn, tìm theo tên vật. */
const lanternMesh = (layers) => layers['anh-trang'].objects.find((o) => o.name === 'hoa-dang');
const matrixAt = (mesh, i) => new Matrix4().fromArray(mesh.instanceMatrix.array, i * 16);
/** Thả một đèn trôi về phía −z (trăng ở chính nam); trả số ô của nó trong vòng đệm. Ô i của vòng đệm là ô i + 1 của mesh. */
const release = (shared, { x, z, t }) => shared.lanterns.release({ x, z, t, dir: [0, -1], key: null });
const expectMatrix = (actual, expected) => actual.elements.forEach((v, j) => expect(v).toBeCloseTo(expected.elements[j], 6));

/** Ma trận 8 cánh của đèn ở bờ, tính đúng như createLantern trước GĐ 5: đèn ở bờ không được xê dịch (poster giữ nguyên). */
function shoreMatrices() {
  const dummy = new Object3D();
  dummy.rotation.order = 'YXZ';
  return Array.from({ length: PETALS }, (_, k) => {
    const yaw = (k / PETALS) * Math.PI * 2;
    dummy.position.set(-5 + Math.cos(yaw) * 0.12, 0.08, 13 + Math.sin(yaw) * 0.12);
    dummy.rotation.set(-0.45, -yaw - Math.PI / 2, 0);
    dummy.scale.setScalar(0.55);
    dummy.updateMatrix();
    return dummy.matrix.clone();
  });
}

/** Mũi cánh ngả ra ngoài bao nhiêu: trục của cánh (+Y cục bộ, gốc → mũi) chiếu lên hướng từ tâm đèn ra gốc cánh. */
function lean(mesh, i, center) {
  const m = matrixAt(mesh, i);
  const base = new Vector3().setFromMatrixPosition(m);
  const out = new Vector3(base.x - center.x, 0, base.z - center.z).normalize();
  return new Vector3().setFromMatrixColumn(m, 1).normalize().dot(out);
}

/** Mọi node trong đồ thị của root, mỗi node một lần (đồ thị dùng chung nhánh). */
function nodesOf(root) {
  const seen = new Set();
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node?.isNode || seen.has(node)) continue;
    seen.add(node);
    stack.push(...node.getChildren());
  }
  return [...seen];
}
const uniformIn = (root, name) => nodesOf(root).find((n) => n.isUniformNode && n.name === name);

describe('l2-anh-trang', () => {
  it('núm tĩnh; pha trăng mặc định là pha của đêm nay', () => {
    expect(anhTrang.id).toBe('anh-trang');
    expect(anhTrang.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['moonPhase', 'uniform'], ['rimPower', 'uniform'], ['rimColor', 'uniform'], ['translucency', 'uniform'],
      ['clearcoat', 'uniform'], ['candleColor', 'uniform'],
      ['candleIntensity', 'js'], ['shadowMapSize', 'js'], ['shadowBias', 'js'],
    ]);
    const phase = anhTrang.knobs.find((k) => k.id === 'moonPhase');
    expect(knobValue(phase, { now: NOW })).toBe(moonPhase(NOW).phase);
  });

  it('trăng và đèn hoa đăng là objects của lớp; trăng có emissiveNode và không nhận sương', () => {
    const { ctx, layers } = build();
    const [moon, lantern] = layers['anh-trang'].objects;
    expect(moon.geometry.parameters.radius).toBe(MOON.radius);
    expect(moon.material.emissiveNode).toBeTruthy();
    expect(moon.material.fog).toBe(false);
    expect(lantern.isInstancedMesh).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([moon, lantern]));
    expect(lights(ctx.scene, 'isDirectionalLight')).toHaveLength(1);
    expect(lights(ctx.scene, 'isPointLight')).toHaveLength(1);
  });

  it('sơn lên material của Cốt: màu mới, clearcoat cho lá, sheen + emissive cho cánh', () => {
    const { shared } = build();
    const { leafMaterial, standingMaterial, petalMaterial } = shared.cot;
    for (const m of [leafMaterial, standingMaterial]) expect(m.clearcoatNode).toBeTruthy();
    expect(petalMaterial.sheenNode).toBeTruthy();
    expect(petalMaterial.emissiveNode.isNode).toBe(true);
  });

  it('bóng bật MỘT lần lúc dựng theo mức: cao 1024, vừa 512, thấp tắt', () => {
    for (const [level, size] of [['cao', 1024], ['vua', 512], ['thap', 0]]) {
      const { ctx, shared } = build({ level });
      const [sun] = lights(ctx.scene, 'isDirectionalLight');
      expect(ctx.renderer.shadowMap.enabled, level).toBe(size > 0);
      expect(sun.castShadow, level).toBe(size > 0);
      if (size) expect(sun.shadow.mapSize.x).toBe(size);
      for (const o of shared.cot.casters) expect(o.castShadow, level).toBe(size > 0);
      for (const o of shared.cot.receivers) expect(o.receiveShadow, level).toBe(size > 0);
    }
  });

  it('update: trọng số 1 → ánh trăng sáng, đèn xưởng tắt; trọng số 0 → ngược lại; trăng theo hướng của bức', () => {
    const { ctx, shared, layers } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    layers['anh-trang'].update(1 / 60, 1);
    expect(sun.intensity).toBeGreaterThan(0);
    expect(shared.cot.hemi.intensity).toBe(0);
    const [moon] = layers['anh-trang'].objects;
    expect(moon.position.clone().normalize().distanceTo(shared.moon.dir.value)).toBeLessThan(1e-9);
    ctx.weights.set('anh-trang', 0);
    layers['anh-trang'].update(1 / 60, 2);
    expect(sun.intensity).toBe(0);
    expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
  });

  it('theo thanh giờ (GĐ 4): trăng càng thấp ánh trăng càng yếu; ở 21:00 và khi trăng cao hơn thì giữ nguyên như GĐ 3', () => {
    const at = (hour) => moonStrength(moonDirection(hour)[1]);
    expect(at(21)).toBe(1);
    expect(at(23.75)).toBe(1); // trăng cao nhất
    expect(at(18)).toBeCloseTo(0.35, 6);
    expect(at(29.5)).toBeCloseTo(0.35, 6);
    expect(at(19)).toBeGreaterThan(0.35);
    expect(at(19)).toBeLessThan(at(20));
    const { ctx, setup, shared, layers } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    shared.hour.value = 18.5;
    setup.update(0, 1);
    layers['anh-trang'].update(0, 1);
    expect(sun.intensity).toBeCloseTo(3 * at(18.5), 6);
  });

  it('vẽ lại khung đứng yên (update(0, t), ?freeze): kéo thanh giờ thì hướng trăng đổi và bóng vẽ lại đúng một lần', () => {
    const { ctx, setup, shared, layers } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [moon] = layers['anh-trang'].objects;
    const still = () => {
      sun.shadow.needsUpdate = false;
      setup.update(0, 1); // xưởng gọi setup trước, rồi các lớp, với dt = 0
      layers['anh-trang'].update(0, 1);
      return sun.shadow.needsUpdate;
    };
    expect(still()).toBe(true);
    expect(still()).toBe(false);
    shared.hour.value = 27;
    expect(still()).toBe(true);
    expect(moon.position.clone().normalize().distanceTo(new Vector3(...moonDirection(27)))).toBeLessThan(1e-6);
  });

  it('dispose gỡ trăng, đèn, hoa đăng (2 lần vẫn an toàn); đèn xưởng của Cốt thì ở lại', () => {
    const { ctx, shared, layers } = build();
    const before = ctx.scene.children.length;
    layers['anh-trang'].dispose();
    layers['anh-trang'].dispose();
    // Lớp này thêm 6 thứ: trăng, ánh trăng + target của nó, đèn trời chàm, hoa đăng, ngọn nến.
    expect(ctx.scene.children).toHaveLength(before - 6);
    expect(ctx.scene.children.filter((o) => o.isLight)).toEqual([shared.cot.hemi]);
    for (const o of layers['anh-trang'].objects) expect(o.parent).toBeNull();
  });

  it('núm js: cường độ nến (update đọc), cỡ shadow map và bias (ShadowNode đọc mỗi khung, không biên dịch lại)', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['anh-trang'];
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [candle] = lights(ctx.scene, 'isPointLight');
    knobs['anh-trang'].set('candleIntensity', 0);
    layer.update(1 / 60, 1);
    expect(candle.intensity).toBe(0);
    knobs['anh-trang'].set('candleIntensity', 20);
    layer.update(1 / 60, 1);
    expect(candle.intensity).toBeGreaterThan(10);
    knobs['anh-trang'].set('shadowMapSize', 2048);
    expect(sun.shadow.mapSize.toArray()).toEqual([2048, 2048]);
    knobs['anh-trang'].set('shadowBias', -0.002);
    expect(sun.shadow.bias).toBe(-0.002);
    expect(layer.readouts.find((r) => r.id === 'shadowMap').get()).toBe(2048);
    expect(build({ level: 'thap' }).layers['anh-trang'].readouts[0].get()).toBe(0); // mức thấp: tắt bóng
  });

  it('khung bóng ôm sát vùng lá theo hướng trăng (thay ±55, tức 110 đơn vị): cả đêm, chiều dọc chỉ còn dưới 32', () => {
    for (let hour = 18; hour <= 29.5; hour += 0.5) {
      const camera = new OrthographicCamera();
      const dir = new Vector3(...moonDirection(hour));
      const { width, height } = fitShadowCamera(camera, dir);
      expect(width, `${hour}h`).toBeLessThanOrEqual(2 * SHADOW_BOX.radius + 1e-6);
      expect(height, `${hour}h`).toBeLessThan(32);
      // Các điểm trên vành đáy và vành đỉnh của vùng lá nằm trong khung (camera nhìn từ trăng về tâm ao, như three làm).
      camera.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      for (const [x, y, z] of [[-54, 0, 0], [54, 6, 0], [0, 6, 54], [0, 0, -54], [38, 6, -38], [-38, 0, 38]]) {
        const p = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
        expect(p.x).toBeGreaterThanOrEqual(camera.left);
        expect(p.x).toBeLessThanOrEqual(camera.right);
        expect(p.y).toBeGreaterThanOrEqual(camera.bottom);
        expect(p.y).toBeLessThanOrEqual(camera.top);
        expect(-p.z).toBeGreaterThanOrEqual(camera.near);
        expect(-p.z).toBeLessThanOrEqual(camera.far);
      }
    }
  });

  it('shadow map tĩnh: chỉ vẽ lại khi hướng trăng, độ nở hoa hay bố cục của Cốt đổi', () => {
    const { ctx, shared, layers, knobs } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const layer = layers['anh-trang'];
    expect(sun.shadow.autoUpdate).toBe(false);
    const frame = () => {
      sun.shadow.needsUpdate = false; // như ShadowNode sau khi vẽ xong
      layer.update(1 / 60, 1);
      return sun.shadow.needsUpdate;
    };
    expect(frame()).toBe(true); // khung đầu: khớp khung bóng, vẽ một lần
    expect(sun.shadow.camera.top - sun.shadow.camera.bottom).toBeLessThan(34);
    expect(frame()).toBe(false); // không gì đổi: không vẽ lại
    shared.cot.openness.value = 0.2;
    expect(frame()).toBe(true);
    knobs.cot.set('seed', 5);
    expect(frame()).toBe(true);
    shared.moon.dir.value.set(...moonDirection(26));
    expect(frame()).toBe(true);
    knobs['anh-trang'].set('shadowBias', -0.001); // bias chỉ dùng lúc tra bóng: không cần vẽ lại map
    expect(frame()).toBe(false);
    knobs['anh-trang'].set('shadowMapSize', 512);
    expect(sun.shadow.needsUpdate).toBe(true);
  });

  it("nấc 'bong': trần cỡ map chia đôi (không dưới 256) rồi trả lại; hiệu lực = min(núm, trần); mức thấp không có nấc", () => {
    const { ctx, layers, knobs } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [step] = layers['anh-trang'].degrade;
    expect(step.id).toBe('bong');
    step.apply();
    expect(sun.shadow.mapSize.x).toBe(512);
    knobs['anh-trang'].set('shadowMapSize', 2048); // người xem kéo núm lên: trần vẫn giữ
    expect(sun.shadow.mapSize.x).toBe(512);
    knobs['anh-trang'].set('shadowMapSize', 256); // núm dưới trần: theo núm
    expect(sun.shadow.mapSize.x).toBe(256);
    step.revert();
    knobs['anh-trang'].set('shadowMapSize', 2048);
    expect(sun.shadow.mapSize.x).toBe(2048);
    expect(build({ level: 'thap' }).layers['anh-trang'].degrade).toEqual([]);
  });

  it('Phá: "Bias = 0" rồi trả lại đúng bias của núm; "Tắt fresnel", "Đổi màu đèn" chỉ đổi uniform', () => {
    const { ctx, layers, knobs } = build();
    const layer = layers['anh-trang'];
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    const [candle] = lights(ctx.scene, 'isPointLight');
    const exp = (id) => layer.experiments.find((e) => e.id === id);
    exp('biasZero').toggle(true);
    expect([sun.shadow.bias, sun.shadow.normalBias]).toEqual([0, 0]);
    knobs['anh-trang'].set('shadowBias', -0.001); // đang phá: nhớ ý người xem, chưa áp
    expect(sun.shadow.bias).toBe(0);
    exp('biasZero').toggle(false);
    expect(sun.shadow.bias).toBe(-0.001);
    expect(sun.shadow.normalBias).toBeGreaterThan(0);
    exp('redCandle').toggle(true);
    layer.update(1 / 60, 1);
    expect(candle.color.getHexString()).toBe(ctx.palette.color('doSon').getHexString());
    exp('redCandle').toggle(false);
    layer.update(1 / 60, 1);
    expect(candle.color.getHexString()).toBe(ctx.palette.color('vangLaSang').getHexString());
    expect(() => { exp('noRim').toggle(true); exp('noRim').toggle(false); }).not.toThrow();
  });
});

describe('l2-anh-trang · hoa đăng (GĐ 5)', () => {
  it('InstancedMesh hoa-dang có (1 + lanterns + 1) × 8 bản ở cả ba mức, count không đổi sau khi thả', () => {
    for (const [level, lanterns] of [['cao', 8], ['vua', 6], ['thap', 4]]) {
      const { ctx, shared, layers } = build({ level });
      expect(ctx.budget.lanterns, level).toBe(lanterns);
      expect(shared.lanterns.slots, level).toHaveLength(lanterns + 1);
      const mesh = lanternMesh(layers);
      const size = (1 + lanterns + 1) * PETALS;
      expect([mesh.count, mesh.instanceMatrix.count], level).toEqual([size, size]);
      for (const name of ['lanternCenter', 'lanternGlow']) expect(mesh.geometry.getAttribute(name).count, `${level} ${name}`).toBe(size);
      for (let i = 0; i < 3 * lanterns; i++) release(shared, { x: i - lanterns, z: 0, t: i }); // thả quá sức chứa
      layers['anh-trang'].update(1 / 60, 3 * lanterns);
      expect(mesh.count, level).toBe(size);
    }
  });

  it('số đo lanterns là 0; thả một đèn (shared.lanterns.release ở t hiện tại) rồi update → 1', () => {
    const { ctx, shared, layers } = build();
    const layer = layers['anh-trang'];
    const lanterns = () => layer.readouts.find((r) => r.id === 'lanterns').get();
    expect(lanterns()).toBe(0);
    ctx.u.time.value = 4;
    release(shared, { x: 2, z: 8, t: ctx.u.time.value });
    layer.update(1 / 60, ctx.u.time.value);
    expect(lanterns()).toBe(1);
  });

  it('pool cho lớp Mặt nước: đèn đang trôi dồn lên đầu, mỗi ô (x, z, độ sáng, 0); count là số đèn đang trôi', () => {
    const { shared, layers } = build();
    const { pool } = shared.anhTrang.lantern;
    expect(pool.size).toBe(shared.lanterns.slots.length);
    expect(pool.node.array).toHaveLength(pool.size);
    // Tên mà mã WGSL và Inspector hiện (mảng không đặt tên thì three gọi là NodeBuffer_<số>).
    expect([pool.node.name, pool.count.name]).toEqual(['lanternPool', 'lanternCount']);
    const first = release(shared, { x: 0, z: 20, t: 0 }); // ô 0 của vòng đệm: tắt hẳn chậm nhất ở giây 93 (đời đèn + lúc chìm)
    // Đèn đang sáng dần: ô mang đúng độ sáng của đèn đó (vũng sáng trên nước sáng dần theo), không phải 1.
    layers['anh-trang'].update(1 / 60, DRIFT.glowIn / 2);
    const fading = lanternAt(shared.lanterns.slots[first], DRIFT.glowIn / 2);
    expect(fading.glow).toBeCloseTo(0.5, 6);
    expect(pool.node.array[0].toArray()).toEqual([fading.x, fading.z, fading.glow, 0]);
    const second = release(shared, { x: 3, z: 30, t: 50 }); // ô 1: còn xa mép ao, giây 95 vẫn đang trôi
    layers['anh-trang'].update(1 / 60, 60);
    expect(pool.count.value).toBe(2);
    layers['anh-trang'].update(1 / 60, 95);
    expect(lanternAt(shared.lanterns.slots[first], 95).alive).toBe(false);
    const s = lanternAt(shared.lanterns.slots[second], 95);
    expect(pool.count.value).toBe(1);
    expect(pool.node.array[0].toArray()).toEqual([s.x, s.z, s.glow, 0]); // ô 1 dồn lên đầu, không để lỗ ở ô 0
    for (const v of pool.node.array.slice(1)) expect(v.toArray()).toEqual([0, 0, 0, 0]);
  });

  it('ma trận cánh của đèn vừa thả có cỡ khác 0 và ở gần chỗ thả; ô trống có cỡ 0', () => {
    const { shared, layers } = build();
    const mesh = lanternMesh(layers);
    const ring = release(shared, { x: -3, z: 6, t: 2 });
    layers['anh-trang'].update(1 / 60, 2.25);
    const now = lanternAt(shared.lanterns.slots[ring], 2.25); // đang sáng dần: độ sáng 0,5
    const centers = mesh.geometry.getAttribute('lanternCenter');
    const glows = mesh.geometry.getAttribute('lanternGlow');
    for (let k = 0; k < PETALS; k++) {
      const i = (ring + 1) * PETALS + k;
      const m = matrixAt(mesh, i);
      const p = new Vector3().setFromMatrixPosition(m);
      expect(m.getMaxScaleOnAxis()).toBeGreaterThan(0);
      expect(Math.hypot(p.x + 3, p.z - 6)).toBeLessThan(0.5);
      expect(centers.getX(i)).toBeCloseTo(now.x, 5); // tâm đèn cho lớp Mặt nước (độ cao gợn tại đó)
      expect(centers.getY(i)).toBeCloseTo(now.z, 5);
      expect(glows.getX(i)).toBeCloseTo(now.glow, 6);
    }
    for (let slot = 1; slot <= shared.lanterns.slots.length; slot++) {
      if (slot === ring + 1) continue;
      for (let k = 0; k < PETALS; k++) {
        expect(matrixAt(mesh, slot * PETALS + k).getMaxScaleOnAxis(), `ô ${slot}`).toBe(0);
        expect(glows.getX(slot * PETALS + k), `ô ${slot}`).toBe(0);
      }
    }
  });

  it('khung bao (frustum culling) chứa mọi đèn đang trôi; ao trống thì chỉ quanh đèn ở bờ: ô trống không làm nó phình ra', () => {
    const { shared, layers } = build();
    const layer = layers['anh-trang'];
    const mesh = lanternMesh(layers);
    mesh.computeBoundingSphere(); // như renderer làm ở lần culling đầu (khung bao còn null)
    const idle = mesh.boundingSphere.clone();
    // Đèn ở bờ nằm ngoài khung hình của điện thoại dọc: khung bao mà gồm cả ô trống thì mesh bị vẽ thừa ở đó.
    expect(idle.center.distanceTo(new Vector3(-5, 0.08, 13))).toBeLessThan(1);
    expect(idle.radius).toBeLessThan(1);
    const ring = release(shared, { x: 20, z: -30, t: 1 }); // xa đèn ở bờ
    layer.update(1 / 60, 5);
    const s = lanternAt(shared.lanterns.slots[ring], 5);
    expect(mesh.boundingSphere.containsPoint(new Vector3(s.x, 0.08, s.z))).toBe(true);
    layer.update(1 / 60, 1 + DRIFT.life + DRIFT.sink + 1); // đèn đã tắt hẳn
    expect(mesh.boundingSphere.equals(idle)).toBe(true);
  });

  it('búp khép lúc thả, nở đủ sau DRIFT.open giây: lúc đó cánh ngả ra đúng như đèn ở bờ', () => {
    const { shared, layers } = build();
    const mesh = lanternMesh(layers);
    const ring = release(shared, { x: 2, z: 4, t: 1 });
    const leanAt = (t) => {
      layers['anh-trang'].update(0, t);
      return lean(mesh, (ring + 1) * PETALS, lanternAt(shared.lanterns.slots[ring], t));
    };
    const shore = lean(mesh, 0, { x: -5, z: 13 });
    expect(shore).toBeGreaterThan(0.3); // đèn ở bờ nở: cánh ngả ra ngoài
    expect(leanAt(1)).toBeLessThan(0.1); // búp: cánh gần như dựng đứng hay chụm vào trên ngọn nến
    expect(leanAt(1 + DRIFT.open)).toBeCloseTo(shore, 5);
  });

  it('đèn thả ra quay mặt theo yaw của đường trôi: gốc cánh k nằm ở góc yaw + k·45° quanh tâm đèn', () => {
    const { shared, layers } = build();
    const mesh = lanternMesh(layers);
    // Lần thả đầu có pha 0, lần sau lệch một góc vàng (≈ 2,4 rad); tới t = 12 mỗi đèn còn xoay thêm DRIFT.spin × tuổi.
    // Không đèn nào quay mặt về góc 0, nên ghi nhầm yaw 0 (mọi đèn cùng một hướng) là lộ ngay.
    const rings = [release(shared, { x: -3, z: 6, t: 2 }), release(shared, { x: 4, z: 1, t: 3 })];
    layers['anh-trang'].update(1 / 60, 12);
    for (const ring of rings) {
      const s = lanternAt(shared.lanterns.slots[ring], 12);
      for (let k = 0; k < PETALS; k++) {
        const p = new Vector3().setFromMatrixPosition(matrixAt(mesh, (ring + 1) * PETALS + k));
        const off = Math.atan2(p.z - s.z, p.x - s.x) - (s.yaw + (k / PETALS) * Math.PI * 2);
        // Độ lệch theo mod 2π, về (−π, π]. Ma trận lưu float32 trên vòng bán kính 0,12: sai số cỡ 1e-6 rad.
        expect(Math.atan2(Math.sin(off), Math.cos(off)), `ô ${ring}, cánh ${k}`).toBeCloseTo(0, 4);
      }
    }
  });

  it('chìm: đèn tắt dần và xuống hẳn dưới mặt nước (y = 0) trước khi ô bị giấu, nên không biến mất đột ngột', () => {
    const { shared, layers } = build();
    const mesh = lanternMesh(layers);
    const ring = release(shared, { x: 0, z: 10, t: 0 });
    const slot = shared.lanterns.slots[ring];
    const last = Math.min(slot.t0 + DRIFT.life, slot.edgeAt) + DRIFT.sink - 0.01; // khung cuối trước khi tắt hẳn
    layers['anh-trang'].update(1 / 60, last);
    const s = lanternAt(slot, last);
    expect(s.alive).toBe(true);
    expect(s.sink).toBeGreaterThan(0.99);
    expect(mesh.geometry.getAttribute('lanternGlow').getX((ring + 1) * PETALS)).toBeLessThan(0.01);
    const position = mesh.geometry.getAttribute('position');
    const p = new Vector3();
    let top = -Infinity; // đỉnh cao nhất của 8 cánh
    for (let k = 0; k < PETALS; k++) {
      const m = matrixAt(mesh, (ring + 1) * PETALS + k);
      for (let v = 0; v < position.count; v++) top = Math.max(top, p.fromBufferAttribute(position, v).applyMatrix4(m).y);
    }
    expect(top).toBeLessThan(0);
  });

  it('update(0, t) hai lần cho đúng cùng ma trận (tất định, không phụ thuộc các khung trước); đèn ở bờ đứng yên đúng chỗ cũ', () => {
    const { shared, layers } = build();
    const layer = layers['anh-trang'];
    const mesh = lanternMesh(layers);
    const { pool } = shared.anhTrang.lantern;
    const attrs = [mesh.instanceMatrix, mesh.geometry.getAttribute('lanternCenter'), mesh.geometry.getAttribute('lanternGlow')];
    const state = () => [...attrs.map((a) => Array.from(a.array)), pool.node.array.map((v) => v.toArray()), pool.count.value];
    const untouched = state(); // lúc mới dựng: mọi ô của vòng đệm trống
    release(shared, { x: -3, z: 6, t: 2 });
    release(shared, { x: 4, z: 1, t: 3 });
    layer.update(0, 10);
    const first = state();
    layer.update(1 / 60, 25); // đồng hồ chạy tiếp…
    expect(state()).not.toEqual(first);
    layer.update(0, 10); // …rồi vẽ lại đúng khung cũ (như ?freeze)
    expect(state()).toEqual(first);
    // Cả hai đèn đã chìm hẳn: ao trống y như lúc mới dựng. Ô vừa giấu không giữ dấu gì của đèn cũ (kể cả tâm), nên
    // trạng thái chỉ phụ thuộc t, không phụ thuộc trước đó đã vẽ những khung nào.
    layer.update(0, 3 + DRIFT.life + DRIFT.sink + 1);
    expect(state()).toEqual(untouched);
    shoreMatrices().forEach((expected, k) => expectMatrix(matrixAt(mesh, k), expected));
    for (let k = 0; k < PETALS; k++) {
      expect([attrs[1].getX(k), attrs[1].getY(k), attrs[2].getX(k)]).toEqual([-5, 13, 1]); // tâm của đèn ở bờ, luôn sáng đủ
    }
  });

  it('thí nghiệm "Đổi màu đèn" đổi flame của mọi đèn (cùng uniform swap); emissive theo độ sáng riêng của từng đèn; shared.anhTrang.lantern có material, pool, flame', () => {
    const { ctx, shared, layers } = build();
    const layer = layers['anh-trang'];
    const mesh = lanternMesh(layers);
    const { material, pool, flame } = shared.anhTrang.lantern;
    expect(material).toBe(mesh.material); // mọi đèn chung MỘT material: lớp Sương, Mặt nước sửa node của nó
    expect(material.emissiveNode.isNode).toBe(true);
    // Mỗi đèn sáng dần lúc thả, tắt dần khi chìm: emissive nhân với thuộc tính instance lanternGlow. AttributeNode không
    // có cờ isAttributeNode, nên nhận ra nó qua getAttributeName().
    expect(nodesOf(material.emissiveNode).some((n) => n.getAttributeName?.() === 'lanternGlow')).toBe(true);
    // Mài lớp Ánh trăng (luật 3) thì đèn thôi sáng: emissive còn nhân trọng số của lớp, đúng uniform mà ctx.weight trả.
    expect(uniformIn(material.emissiveNode, 'w_anh_trang')).toBe(ctx.weight('anh-trang'));
    expect([pool.node.isNode, pool.count.isNode, flame.isNode]).toEqual([true, true, true]);
    expect(shared.anhTrang.glow.isNode).toBe(true); // độ sáng trăng vẫn ở đó cho các lớp sau
    const swap = uniformIn(flame, 'anh_trang_swap');
    expect(swap).toBeTruthy();
    expect(uniformIn(material.emissiveNode, 'anh_trang_swap')).toBe(swap); // giấy của mọi đèn và màu nến của vũng sáng
    const exp = layer.experiments.find((e) => e.id === 'redCandle');
    const [candle] = lights(ctx.scene, 'isPointLight');
    exp.toggle(true);
    expect(swap.value).toBe(1);
    layer.update(1 / 60, 1);
    expect(candle.color.getHexString()).toBe(ctx.palette.color('doSon').getHexString()); // đèn thật của đèn ở bờ theo cùng
    exp.toggle(false);
    expect(swap.value).toBe(0);
  });

  it('không có đèn trôi thì không đánh dấu needsUpdate (version đứng yên); không thuộc tính instance nào dùng DynamicDrawUsage', () => {
    const { shared, layers } = build();
    const layer = layers['anh-trang'];
    const mesh = lanternMesh(layers);
    // Renderer của three r186 (renderers/common/Attributes.js, chung cho WebGPU và WebGL2) chép một thuộc tính lên GPU
    // khi version của nó tăng (needsUpdate = true), hoặc ở MỌI lần render, bất kể version, nếu nó dùng DynamicDrawUsage.
    // Test này giữ hai điều kiện đó, không đo chính việc chép. Ma trận (tối đa 80 bản, 5 KB) thì nằm trong uniform buffer
    // mà three chép lại ở mỗi lượt vẽ dù version đứng yên (parts/anh-trang-lantern.js): với ma trận, test chỉ giữ rằng
    // CPU không ghi lại.
    const attrs = [mesh.instanceMatrix, mesh.geometry.getAttribute('lanternCenter'), mesh.geometry.getAttribute('lanternGlow')];
    for (const a of attrs) expect(a.usage).not.toBe(DynamicDrawUsage);
    const versions = () => attrs.map((a) => a.version);
    const idle = versions();
    layer.update(1 / 60, 1);
    layer.update(0, 1);
    layer.update(1 / 60, 2);
    expect(versions()).toEqual(idle);
    const ring = release(shared, { x: 0, z: 10, t: 3 });
    layer.update(1 / 60, 3);
    const floating = versions();
    floating.forEach((v, i) => expect(v).toBeGreaterThan(idle[i]));
    // Đèn tắt hẳn (sau đời đèn và lúc chìm): ghi thêm MỘT lần để giấu cánh của nó, rồi thôi.
    const gone = 3 + DRIFT.life + DRIFT.sink + 1;
    layer.update(1 / 60, gone);
    const hidden = versions();
    hidden.forEach((v, i) => expect(v).toBeGreaterThan(floating[i]));
    expect(matrixAt(mesh, (ring + 1) * PETALS).getMaxScaleOnAxis()).toBe(0);
    layer.update(1 / 60, gone + 1);
    expect(versions()).toEqual(hidden);
  });
});
