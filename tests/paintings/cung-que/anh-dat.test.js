// tests/paintings/cung-que/anh-dat.test.js — Lớp 4 · Ánh đất của Bức 3: Trái Đất và bầu trời sao là hai vật có tên; Trái Đất nằm trọn trong khung mặc định; dịch được ở hai backend; khối bao đọc ánh đất.
import { describe, it, expect } from 'vitest';
import { NodeMaterial, MeshBasicNodeMaterial, BackSide } from 'three/webgpu';
import meta from '../../../src/paintings/cung-que/meta.js';
import * as painting from '../../../src/paintings/cung-que/painting.js';
import content from '../../../src/paintings/cung-que/content.vi.js';
import { EARTH, TREE, canopyEllipsoid } from '../../../src/paintings/cung-que/parts/cot-the-gioi.js';
import { fitFov } from '../../../src/engine/gpu/fov.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'anh-dat', ...options });
const object = ({ layers }, layer, name) => layers[layer].objects.find((o) => o.name === name);
const marchDecls = (code) => (code.match(/\b(?:var(?:<\w+>)?|float)\s+sdfT\w*/g) ?? []).length;
const DEG = Math.PI / 180;

describe('l4-anh-dat', () => {
  it('hai vật trai-dat và bau-troi: NodeMaterial gốc có emissiveNode, có nhãn trong content', () => {
    const built = build();
    for (const name of ['trai-dat', 'bau-troi']) {
      const mesh = object(built, 'anh-dat', name);
      expect(mesh, name).toBeTruthy();
      expect(mesh.material).toBeInstanceOf(NodeMaterial);
      expect(mesh.material).not.toBeInstanceOf(MeshBasicNodeMaterial);
      expect(mesh.material.emissiveNode, name).toBeTruthy();
      expect(content.layers['anh-dat'].objects[name], name).toBeTruthy();
    }
  });

  it('bầu trời vẽ trước mọi vật, không ghi độ sâu, vẽ mặt trong', () => {
    const built = build();
    const sky = object(built, 'anh-dat', 'bau-troi');
    expect(sky.material.depthWrite).toBe(false);
    expect(sky.material.side).toBe(BackSide);
    const others = [];
    built.ctx.scene.traverse((o) => { if (o.isMesh && o !== sky) others.push(o.renderOrder); });
    expect(sky.renderOrder).toBeLessThan(Math.min(...others));
  });

  it('Trái Đất nằm trọn trong khung mặc định (16:10 và 390×844), có lề ở mép trên; không chạm tán khi cây bay cao nhất', () => {
    const { camera } = painting;
    const sub = (a, b) => a.map((v, i) => v - b[i]);
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const norm = (a) => a.map((v) => v / Math.hypot(...a));
    const forward = norm(sub(camera.target, camera.position));
    const up = norm(sub([0, 1, 0], forward.map((v) => v * forward[1]))); // trục dọc của khung
    const c = sub(EARTH.center, camera.position);
    const center = Math.atan2(dot(c, up), dot(c, forward));
    const top = center + Math.asin(EARTH.radius / Math.hypot(...c));
    for (const aspect of [1280 / 800, 390 / 844]) {
      const half = (fitFov(camera, aspect) / 2) * DEG;
      expect(Math.tan(top) / Math.tan(half), `mép trên Trái Đất ở ${aspect.toFixed(2)}`).toBeLessThan(0.9);
    }
    const { center: canopy, radii } = canopyEllipsoid(TREE.maxLift);
    expect(EARTH.center[1] - EARTH.radius - (canopy[1] + radii[1]), 'khe giữa Trái Đất và tán đang bay').toBeGreaterThan(0.1);
  });

  it.each(['webgpu', 'webgl2'])('%s: dịch được khối bao (vẫn một vòng dò chính, đọc ánh đất), Trái Đất và bầu trời', (backend) => {
    const built = build();
    const volume = compileMaterial(object(built, 'cot', 'khoi-bao'), built.ctx, backend);
    expect(volume.problems).toEqual([]);
    expect(marchDecls(volume.fragmentShader)).toBe(1);
    expect(volume.uniforms).toEqual(expect.arrayContaining(['anh_dat_earthshine', 'w_anh_dat']));
    for (const name of ['trai-dat', 'bau-troi']) {
      expect(compileMaterial(object(built, 'anh-dat', name), built.ctx, backend).problems, name).toEqual([]);
    }
  });

  it('thí nghiệm "Không có Trái Đất": giấu Trái Đất rồi hiện lại; số đo "Trái Đất sáng" theo ngày (trăng mới: 100%, rằm: 0%)', () => {
    const built = build();
    const layer = built.layers['anh-dat'];
    const earth = object(built, 'anh-dat', 'trai-dat');
    expect(layer.experiments.map((e) => e.id)).toEqual(['khongTraiDat']);
    layer.experiments[0].toggle(true);
    expect(earth.visible).toBe(false);
    layer.experiments[0].toggle(false);
    expect(earth.visible).toBe(true);
    const lit = () => Number(layer.readouts.find((r) => r.id === 'traiDat').get());
    built.shared.day.value = 1;
    expect(lit()).toBe(100);
    built.shared.day.value = 1 + 29.530588 / 2;
    expect(lit()).toBe(0);
    expect(content.layers['anh-dat'].experiments.khongTraiDat.label).toBeTruthy();
    expect(content.layers['anh-dat'].readouts.traiDat).toBeTruthy();
  });
});
