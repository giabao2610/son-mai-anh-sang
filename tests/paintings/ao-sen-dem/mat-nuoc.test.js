// tests/paintings/ao-sen-dem/mat-nuoc.test.js — Lớp 4 · Mặt nước: đĩa nước có chiếu sáng, reflector nằm ngang, MRT riêng, lá và hoa đăng nhấp nhô, vũng sáng quanh hoa đăng (soi cả mã WGSL/GLSL).
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as matNuoc from '../../../src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { attributeNames, compileMaterial, nodesOf, uniformNames } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'mat-nuoc', ...options });
const LEVELS = [{ level: 'cao' }, { level: 'thap', budget: { reflection: 0 } }]; // reflector / phản chiếu giả
const BACKENDS = ['webgpu', 'webgl2'];
/** Bỏ lớp VarNode mà TSL tự bọc quanh oneMinus(), mul()… (biến "intent", r186): giá trị y như node bên trong. */
const unwrap = (n) => (n?.isVarNode && n.intent ? unwrap(n.node) : n);
const isAttribute = (name) => (n) => n?.type === 'AttributeNode' && n.getAttributeName() === name;
const isUniform = (name) => (n) => n?.isUniformNode && n.name === name;
const isOneMinus = (name) => (n) => n?.isMathNode && n.method === 'oneMinus' && isUniform(name)(unwrap(n.aNode));
/** Đồ thị của `root` có phép nhân mà một vế thỏa `factor`, vế kia chứa uniform `marker` (để nhận ra nhánh) không? */
const scaledBy = (root, factor, marker) => nodesOf(root).some((n) => n.isOperatorNode && n.op === '*'
  && [[n.aNode, n.bNode], [n.bNode, n.aNode]].some(([a, b]) => factor(unwrap(a)) && uniformNames(b).includes(marker)));

/**
 * Mã của vòng vũng sáng (lanternPool trong l4-mat-nuoc.js), từ biến tổng tới hết vòng: tổng = 0; lặp `size` vòng; câu đầu so
 * i với số đèn đang trôi rồi Break; d = điểm đang vẽ − tâm đèn; tổng += exp(d·d / −r²) × độ sáng (ô .z). Số chia phải ÂM:
 * exp(+d²/r²) thì vũng sáng lớn dần ra xa thay vì tắt dần. fbm của sương cũng có một vòng `i < 5` mở đầu bằng phép so rồi
 * Break, mà mức thấp có pool.size 5: chỉ phép so với lanternCount mới chọn đúng vòng này.
 * @param {number} size  pool.size
 * @param {string} array  mảng ô trong mã (đã thoát cho regex)
 */
const poolLoop = (size, array) => new RegExp([
  String.raw`(\w+) = 0\.0;\s*for \( [^;]+ = 0; i < ${size}; i \+\+ \) \{`,
  String.raw`\s*if \( \( (?:f32|float)\( i \) >= [\w.]*lanternCount \) \) \{\s*break;\s*\}`,
  String.raw`\s*(\w+) = \( v_positionWorld\.xz - ${array}\[ i \]\.xy \);`,
  String.raw`\s*\1 = \( \1 \+ \( exp\( \( dot\( \2, \2 \) / -[\d.]+ \) \) \* ${array}\[ i \]\.z \) \);\s*\}`,
].join(''));

describe('l4-mat-nuoc', () => {
  it('núm tĩnh: 4 núm gợn sóng + distortion + fresnelPower (uniform) + reflectionResolution (js)', () => {
    expect(matNuoc.id).toBe('mat-nuoc');
    expect(matNuoc.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['amplitude', 'uniform'], ['speed', 'uniform'], ['decay', 'uniform'], ['wavelength', 'uniform'],
      ['distortion', 'uniform'], ['fresnelPower', 'uniform'], ['reflectionResolution', 'js'],
    ]);
  });

  it('độ phân giải phản chiếu: mặc định theo mức (cao 0.5, vừa 0.35); núm đổi ngay; "Độ phân giải 0.1" rồi trả lại', () => {
    const scale = (layer) => layer.readouts.find((r) => r.id === 'reflectionScale').get();
    expect(scale(build({ level: 'vua' }).layers['mat-nuoc'])).toBe(0.35);
    const { layers, knobs } = build();
    const water = layers['mat-nuoc'];
    expect(scale(water)).toBe(0.5);
    knobs['mat-nuoc'].set('reflectionResolution', 0.8);
    expect(scale(water)).toBe(0.8);
    const low = water.experiments.find((e) => e.id === 'lowRes');
    low.toggle(true);
    expect(scale(water)).toBe(0.1);
    knobs['mat-nuoc'].set('reflectionResolution', 0.6); // đang bật thí nghiệm: nhớ ý người xem, chưa áp
    expect(scale(water)).toBe(0.1);
    low.toggle(false);
    expect(scale(water)).toBe(0.6);
    const vua = build({ level: 'vua' });
    vua.knobs['mat-nuoc'].set('reflectionResolution', 1); // mức vừa: trần 0.6, máy yếu không bị kéo quá sức
    expect(scale(vua.layers['mat-nuoc'])).toBe(0.6);
  });

  it('thí nghiệm "Tắt fresnel" và "Xem heightfield" chỉ đổi uniform (material giữ nguyên node)', () => {
    const { layers } = build();
    const water = layers['mat-nuoc'];
    const [mesh] = water.objects;
    const nodes = ['colorNode', 'emissiveNode', 'mrtNode'].map((k) => mesh.material[k]);
    for (const id of ['noFresnel', 'heightfield']) {
      const exp = water.experiments.find((e) => e.id === id);
      exp.toggle(true);
      exp.toggle(false);
    }
    expect(['colorNode', 'emissiveNode', 'mrtNode'].map((k) => mesh.material[k])).toEqual(nodes);
  });

  it('đĩa nước nằm ngang bán kính 60; material CÓ chiếu sáng (luật 3: trọng số 0 là đất sét dưới đèn)', () => {
    const [water] = build().layers['mat-nuoc'].objects;
    expect(water.material.isMeshStandardNodeMaterial).toBe(true);
    for (const key of ['colorNode', 'normalNode', 'emissiveNode', 'mrtNode']) expect(water.material[key], key).toBeTruthy();
    water.geometry.computeBoundingSphere();
    expect(water.geometry.boundingSphere.radius).toBeCloseTo(60, 5);
    expect(water.geometry.getAttribute('normal').getY(0)).toBeCloseTo(1, 5);
  });

  it('target của reflector nằm TRONG scene và trục +Z của nó chỉ lên trời (gương nằm ngang)', () => {
    const { ctx, layers } = build();
    const [water] = layers['mat-nuoc'].objects;
    // Lớp Ánh trăng cũng thêm một Object3D (target của đèn trăng); lớp này thêm target NGAY TRƯỚC mặt nước.
    const target = ctx.scene.children[ctx.scene.children.indexOf(water) - 1];
    expect(target.type).toBe('Object3D');
    expect(target?.parent).toBe(ctx.scene);
    ctx.scene.updateMatrixWorld();
    expect(new Vector3(0, 0, 1).transformDirection(target.matrixWorld).y).toBeCloseTo(1, 5);
  });

  it('lá nổi của Cốt nhấp nhô: lớp này gán positionNode cho leafMaterial (lá đứng thì không)', () => {
    const { shared } = build();
    expect(shared.cot.leafMaterial.positionNode).toBeTruthy();
    expect(shared.cot.standingMaterial.positionNode).toBeNull();
  });

  it('hoa đăng nhấp nhô (GĐ 5): positionNode của đèn cộng độ cao gợn tại lanternCenter, nhân trọng số của lớp và lanternGlow (đèn chìm thì thôi nhấp nhô)', () => {
    const still = buildPainting(painting, meta, { until: 'suong' }).shared.anhTrang.lantern.material;
    expect(still.positionNode).toBeNull(); // chưa có lớp Mặt nước thì đèn đứng yên
    const { positionNode } = build().shared.anhTrang.lantern.material;
    expect(positionNode?.isNode).toBe(true);
    expect(attributeNames(positionNode)).toEqual(expect.arrayContaining(['lanternCenter', 'lanternGlow']));
    // lanternGlow là THỪA SỐ của độ nhấp nhô: đèn chìm hẳn (glow 0) thì sóng không nâng mũi cánh lên khỏi mặt nước
    // ngay trước khi ô bị giấu. Đèn ở bờ luôn có glow 1 nên nhấp nhô đủ.
    const factor = (n) => n.isOperatorNode && n.op === '*' && [n.aNode, n.bNode].some(isAttribute('lanternGlow'));
    expect(nodesOf(positionNode).some(factor)).toBe(true);
    // Mài (luật 3): lớp này ở trọng số 0 là nước đất sét phẳng lặng, đèn cũng thôi nhấp nhô. Hàm sóng không đọc trọng số,
    // nên chỉ thừa số trọng số đưa được w_mat_nuoc vào positionNode.
    expect(uniformNames(positionNode)).toContain('w_mat_nuoc');
  });

  it('vũng sáng (GĐ 5): cộng vào emissiveNode của nước (màu nến của đèn, nhân trọng số của lớp Ánh trăng và lớp này, tắt khi "Xem heightfield"), KHÔNG vào mrtNode (mặt nước quanh đèn không bloom)', () => {
    for (const options of LEVELS) {
      const [water] = build(options).layers['mat-nuoc'].objects;
      const emissive = water.material.emissiveNode;
      // anh_trang_swap ("Đổi màu đèn") nằm trong màu nến flame: chỉ vũng sáng đưa nó vào nước.
      expect(uniformNames(emissive), options.level).toContain('anh_trang_swap');
      expect(uniformNames(water.material.mrtNode), options.level).not.toContain('anh_trang_swap');
      // Mài (luật 3): mài lớp Ánh trăng (đèn thành đất sét) hay lớp này (nước thành đất sét) đều tắt vũng sáng. Đếm tên
      // uniform không đủ: ảnh phản chiếu đã nhân w_mat_nuoc, và phản chiếu giả (mức thấp) đã có w_anh_trang.
      for (const weight of ['w_anh_trang', 'w_mat_nuoc']) {
        expect(scaledBy(emissive, isUniform(weight), 'anh_trang_swap'), `${options.level} · ${weight}`).toBe(true);
      }
      // "Xem heightfield" chỉ còn ảnh xám của độ cao sóng: vũng sáng nhân (1 − showHeight) như ảnh phản chiếu. Ảnh phản
      // chiếu cũng có thừa số đó, nên lại nhận ra vế của vũng sáng qua anh_trang_swap.
      expect(scaledBy(emissive, isOneMinus('mat_nuoc_showHeight'), 'anh_trang_swap'), `${options.level} · 1 − showHeight`).toBe(true);
    }
  });

  it('nước dịch được ra WGSL và GLSL ở mức cao và thấp, như scene pass vẽ nó (có MRT): vòng vũng sáng chạy pool.size vòng, Break ngay khi i chạm lanternCount, mỗi vòng cộng exp(−d²/r²) × độ sáng của một đèn', () => {
    for (const options of LEVELS) {
      const { ctx, layers, shared } = build(options);
      const { pool } = shared.anhTrang.lantern; // pool.size = budget.lanterns + 1: cao 9, thấp 5
      const [water] = layers['mat-nuoc'].objects;
      // Thân của Fn không có trong đồ thị (nodesOf không thấy), nên soi mã: câu đầu của thân vòng là phép so với số đèn
      // đang trôi (ao không có đèn trôi thì vòng đầu đã Break, spec §10), rồi tới vũng sáng của từng đèn.
      for (const backend of BACKENDS) {
        // Mảng ô: WGSL gọi theo tên đã đặt (lanternPool); GLSLNodeBuilder của r186 luôn gọi là buffer<id của node>, và đổi
        // luôn tên node thành NodeBuffer_<id>. Vì thế WebGPU dịch trước WebGL2 (BACKENDS): ngược lại thì WGSL mang tên đó.
        const array = backend === 'webgpu' ? String.raw`lanternPool\.value` : `buffer${pool.node.id}`;
        const { fragmentShader, outputs, problems } = compileMaterial(water, ctx, backend);
        expect(problems, `${options.level} · ${backend}`).toEqual([]);
        // Hai ảnh của scene pass (output, emissive): mrtNode của nước (phần sáng vượt GLINT) cũng được dịch và kiểm.
        expect(outputs, `${options.level} · ${backend}`).toBe(2);
        expect(fragmentShader, `${options.level} · ${backend}`).toMatch(poolLoop(pool.size, array));
      }
    }
  });

  it('material hoa đăng dịch được ra WGSL và GLSL ở cả hai lượt vẽ đèn: scene pass (MRT) và ảnh phản chiếu (không MRT)', () => {
    const { ctx, layers } = build();
    const mesh = layers['anh-trang'].objects.find((o) => o.name === 'hoa-dang');
    // Reflector vẽ cả đèn vào ảnh của nó (một ảnh, không MRT), nên đèn không được có mrtNode: muốn bloom của đèn mờ trong
    // sương thì nhân thẳng vào emissiveNode (lớp Sương). Có mrtNode thì biến thể của ảnh phản chiếu ra struct đầu ra rỗng
    // (outputs 0: WGSL hỏng).
    expect(mesh.material.mrtNode).toBeNull();
    for (const backend of BACKENDS) {
      for (const [pass, outputs] of [['scene', 2], ['reflector', 1]]) {
        const shader = compileMaterial(mesh, ctx, backend, { pass });
        expect(shader.problems, `${pass} · ${backend}`).toEqual([]);
        expect(shader.outputs, `${pass} · ${backend}`).toBe(outputs);
        expect(shader.vertexShader, `${pass} · ${backend}`).toContain('lanternCenter'); // độ nhấp nhô đọc tâm đèn
      }
    }
  });

  it("nấc 'phan-chieu': trần độ phân giải chia đôi (không dưới 0,15) rồi trả lại; hiệu lực = min(núm, trần)", () => {
    const scale = (layer) => layer.readouts.find((r) => r.id === 'reflectionScale').get();
    const { layers, knobs } = build();
    const water = layers['mat-nuoc'];
    const [step] = water.degrade;
    expect(step.id).toBe('phan-chieu');
    step.apply();
    expect(scale(water)).toBe(0.25);
    knobs['mat-nuoc'].set('reflectionResolution', 0.8); // người xem kéo núm lên: trần vẫn giữ
    expect(scale(water)).toBe(0.25);
    knobs['mat-nuoc'].set('reflectionResolution', 0.2); // núm dưới trần: theo núm
    expect(scale(water)).toBe(0.2);
    step.revert();
    knobs['mat-nuoc'].set('reflectionResolution', 0.8);
    expect(scale(water)).toBe(0.8);
    knobs['mat-nuoc'].set('reflectionResolution', 0.2);
    step.apply(); // min(0.2, ∞) × 0.5 = 0.1 → sàn 0.15; núm 0.2 → hiệu lực 0.15
    expect(scale(water)).toBe(0.15);
  });

  it('mức thấp (budget.reflection = 0): phản chiếu GIẢ, không có reflector, không nấc, không có "Độ phân giải 0.1"', () => {
    const { ctx, layers } = build({ level: 'thap', budget: { reflection: 0 } });
    const water = layers['mat-nuoc'];
    const [mesh] = water.objects;
    expect(ctx.scene.children.filter((o) => o.type === 'Object3D' && o !== mesh)).toHaveLength(1); // chỉ target của đèn trăng
    expect(water.readouts[0].get()).toBe(0);
    expect(water.degrade).toEqual([]);
    // Không có ảnh phản chiếu thì không có gì để hạ độ phân giải: nút bấm mà ảnh không đổi là dạy sai.
    expect(water.experiments.map((e) => e.id)).toEqual(['noFresnel', 'heightfield']);
    expect(build({ level: 'cao' }).layers['mat-nuoc'].experiments.map((e) => e.id)).toEqual(['lowRes', 'noFresnel', 'heightfield']);
    for (const key of ['colorNode', 'normalNode', 'emissiveNode', 'mrtNode']) expect(mesh.material[key], key).toBeTruthy();
    for (const exp of water.experiments) {
      exp.toggle(true);
      exp.toggle(false);
    }
    const before = ctx.scene.children.length;
    water.dispose();
    expect(ctx.scene.children).toHaveLength(before - 1);
  });

  it('dispose gỡ nước và target (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const before = ctx.scene.children.length;
    layers['mat-nuoc'].dispose();
    layers['mat-nuoc'].dispose();
    expect(ctx.scene.children).toHaveLength(before - 2);
  });
});
