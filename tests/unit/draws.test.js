// tests/unit/draws.test.js — móc lần vẽ trên renderer giả: start/stop trả đúng hàm cũ, ghi lần vẽ của camera chính, phản chiếu lồng, limit(k) theo vật + material + lượt, chủ và nhãn của vật.
import { describe, it, expect, vi } from 'vitest';
import {
  BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, InstancedBufferGeometry, InstancedMesh, Line, LineBasicNodeMaterial, Mesh,
  MeshStandardNodeMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Points, PointsNodeMaterial, Scene, Sprite,
  SpriteNodeMaterial,
} from 'three/webgpu';
import { createDrawProbe } from '../../src/engine/gpu/draws.js';

const SCENE = new Scene();
const camera = new PerspectiveCamera(); // camera chính: camera của scene pass
const mirror = camera.clone(); // camera ảo của reflector (clone của camera chính, như ReflectorNode)
const mat = () => new MeshStandardNodeMaterial();

/**
 * Renderer giả như three r186: setRenderObjectFunction chỉ ghi lại hàm; renderObject đếm một draw call rồi gọi o.onDraw(cam).
 * Vật có onDraw vẽ thêm ngay trong lần vẽ của nó, như node có updateBefore (reflector của mặt gương, scene pass của quad cuối).
 */
function fakeRenderer() {
  return {
    info: { render: { drawCalls: 0 } },
    _fn: null,
    getRenderObjectFunction() {
      return this._fn;
    },
    setRenderObjectFunction(f) {
      this._fn = f;
    },
    renderObject: vi.fn(function (o, s, cam) {
      this.info.render.drawCalls += 1;
      o.onDraw?.(cam);
    }),
  };
}

/**
 * Một lượt render() của three (_renderObjects): mỗi mục gọi hàm vẽ hiện tại, là móc nếu đã gắn, không thì renderObject. Mesh nhiều
 * material thành một mục cho mỗi nhóm (group) của hình, như projectObject của three; passId như lượt 'backSide' của vật trong suốt.
 */
function render(r, items, cam, passId = null) {
  for (const o of items) {
    const parts = Array.isArray(o.material) ? o.geometry.groups.map((g) => [o.material[g.materialIndex], g]) : [[o.material, null]];
    for (const [material, group] of parts) (r._fn ?? r.renderObject).call(r, o, SCENE, cam, o.geometry, material, group, null, null, passId);
  }
}

/** Tên lớp ở meta, nhãn vật ở content.layers[id].objects: đúng hình của hợp đồng (painting.js). */
const META = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'guong', name: 'Gương' }] };
const CONTENT = { layers: { cot: { objects: { khoi: 'Khối đất', hat: 'Hạt', bo: 'Bó cành' } }, guong: { objects: { guong: 'Mặt gương' } } } };

/**
 * Cảnh giả hai lớp: khối đất và hạt (lớp 'cot'), mặt gương (lớp 'guong') vẽ lại khối và hạt bằng camera ảo ngay trong lần vẽ
 * của nó. frame(items) là một khung của scene.js: begin → render → end.
 */
function pond() {
  const r = fakeRenderer();
  const clay = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'khoi' });
  const grains = Object.assign(new InstancedMesh(new PlaneGeometry(), mat(), 50), { name: 'hat' });
  const glass = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'guong' });
  glass.onDraw = (cam) => cam === camera && render(r, [clay, grains], mirror);
  const layers = [{ id: 'cot', layer: { objects: [clay, grains] } }, { id: 'guong', layer: { objects: [glass] } }];
  const probe = createDrawProbe({ renderer: r, camera, layers, meta: META, content: CONTENT });
  const frame = (items = [clay, glass, grains]) => {
    probe.begin();
    render(r, items, camera);
    probe.end();
  };
  return { r, probe, clay, grains, glass, frame };
}

describe('createDrawProbe', () => {
  it('chưa start thì begin/end không làm gì và không đặt móc', () => {
    const { r, probe, frame } = pond();
    frame();
    expect(r._fn).toBeNull();
    expect(r.renderObject).toHaveBeenCalledTimes(5); // 3 vật + 2 lần vẽ phản chiếu
    expect(probe.list()).toEqual([]);
    expect(Object.isFrozen(probe.list())).toBe(true); // như list của một khung đã ghi: công cụ không sửa được
    expect(probe.counts()).toEqual({ scene: 0, reflection: 0, other: 0 });
  });

  it('start đặt móc, stop trả đúng hàm cũ (null, hay một hàm khác đã đặt trước); hàm cũ vẫn vẽ các lần vẽ được phép', () => {
    const { r, probe, frame } = pond();
    probe.start();
    probe.start(); // gọi hai lần vẫn là một móc
    expect(typeof r._fn).toBe('function');
    probe.stop();
    probe.stop();
    expect(r._fn).toBeNull();
    // Một hàm khác đã đặt trước (như ToonOutlinePassNode của three): móc vẽ qua nó, stop trả lại đúng nó.
    const other = vi.fn(function (...args) {
      this.renderObject(...args);
    });
    r._fn = other;
    probe.start();
    expect(r._fn).not.toBe(other);
    frame();
    expect(other.mock.calls.map(([o, , cam]) => [o.name, cam === camera])).toEqual([
      ['khoi', true], ['guong', true], ['khoi', false], ['hat', false], ['hat', true],
    ]);
    expect(other.mock.contexts.every((c) => c === r)).toBe(true); // gọi như three gọi: this là renderer
    probe.stop();
    probe.stop(); // công cụ tự stop() khi tắt, disposer của cảnh stop() thêm lần nữa: lần hai không được đè hàm cũ bằng null
    expect(r._fn).toBe(other);
  });

  it('list theo đúng thứ tự vẽ của camera chính, đông cứng cả từng mục; lần vẽ của camera khác không vào list mà vào counts.reflection', () => {
    const { probe, frame } = pond();
    probe.start();
    frame();
    expect(probe.list().map((d) => [d.name, d.label, d.layerId, d.layer])).toEqual([
      ['khoi', 'Khối đất', 'cot', 'Cốt'],
      ['guong', 'Mặt gương', 'guong', 'Gương'],
      ['hat', 'Hạt', 'cot', 'Cốt'],
    ]);
    expect(Object.isFrozen(probe.list())).toBe(true); // công cụ không sửa được danh sách đã ghi, hay một mục của nó
    expect(Object.isFrozen(probe.list()[0])).toBe(true);
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 0 });
    probe.counts().scene = 99; // mỗi lần một bản sao: công cụ sửa cũng không đổi số của móc
    expect(probe.counts().scene).toBe(3);
  });

  it('lần vẽ lồng (camera khác, trong lúc vẽ một vật) cộng vào nested của vật đó', () => {
    const { probe, frame } = pond();
    probe.start();
    frame();
    expect(probe.list().map((d) => d.nested)).toEqual([0, 2, 0]);
  });

  it('lần vẽ của camera chính lồng trong lần vẽ của camera chính: lần vẽ lồng bên trong nó cộng vào nó (sợi trong cùng), rồi về sợi ngoài', () => {
    const r = fakeRenderer();
    const leaf = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'la' });
    // Sợi trong: ngay trong lần vẽ của nó, camera ảo vẽ lại lá (như reflector).
    const inner = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'trong' });
    inner.onDraw = (cam) => cam === camera && render(r, [leaf], mirror);
    // Sợi ngoài: lần vẽ của nó vẽ sợi trong bằng CHÍNH camera chính (như một pass của camera ấy, vẽ từ updateBefore), rồi thêm
    // một lần vẽ phản chiếu của riêng nó.
    const outer = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'ngoai' });
    outer.onDraw = (cam) => {
      if (cam !== camera) return;
      render(r, [inner], camera);
      render(r, [leaf], mirror);
    };
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [outer], camera);
    probe.end();
    expect(probe.list().map((d) => [d.name, d.nested])).toEqual([['ngoai', 1], ['trong', 1]]);
    expect(probe.counts()).toEqual({ scene: 2, reflection: 2, other: 0 });
  });

  it('counts.other = tổng draw call của khung trừ cảnh và phản chiếu: lượt tự gỡ móc (bóng, bloom), quad của lượt cuối', () => {
    const { r, probe, clay, glass, grains } = pond();
    // Quad của RenderPipeline: camera trực giao, móc thấy nó ở ngoài cùng; scene pass vẽ cảnh ngay trong lần vẽ của nó.
    const quad = new Mesh(new PlaneGeometry(), mat());
    quad.onDraw = () => render(r, [clay, glass, grains], camera);
    // Một lượt hậu kỳ khác vẽ quad SAU lượt vẽ cảnh mà không gỡ móc: vẫn ở ngoài cùng, không phải phản chiếu của vật nào.
    const after = new Mesh(new PlaneGeometry(), mat());
    probe.start();
    probe.begin();
    r.info.render.drawCalls += 4; // bóng đổ, bloom, RTT: các lượt đó tự cất móc rồi trả lại, móc không thấy
    render(r, [quad], new OrthographicCamera());
    render(r, [after], new OrthographicCamera());
    probe.end();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 6 });
    expect(probe.list().map((d) => [d.name, d.nested])).toEqual([['khoi', 0], ['guong', 2], ['hat', 0]]);
  });

  it('khung sau không mang số của khung trước: drawCalls của renderer không về 0 giữa hai khung, counts vẫn chỉ của từng khung', () => {
    const { r, probe, clay, glass, grains } = pond();
    // renderer.info của three chỉ về 0 mỗi nhịp rAF (Animation, khi autoReset), không phải mỗi render(): móc lấy hiệu số từ
    // begin() tới end(), và mỗi khung đếm phản chiếu lại từ 0.
    const frame = () => {
      probe.begin();
      r.info.render.drawCalls += 4; // bóng đổ, bloom: các lượt đó tự cất móc, móc không thấy
      render(r, [clay, glass, grains], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 4 });
    frame();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 4 });
    expect(r.info.render.drawCalls).toBe(18); // renderer giả đếm dồn: 2 × (4 + 3 vật + 2 lần vẽ phản chiếu)
  });

  it('khung vẽ đủ chỉ cất bản ghi thô: không ai hỏi list() thì không duyệt layer.objects; hỏi lại cùng khung thì không dựng lại', () => {
    // Từng sợi xem đủ khung thì mọi khung đều được ghi (60 lần/giây), mà công cụ chỉ hỏi list() 4 lần/giây. Duyệt mọi vật để tìm
    // chủ (ownerMap) và đông cứng một DrawInfo cho từng lần vẽ chỉ đáng làm khi có người hỏi.
    const r = fakeRenderer();
    const clay = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'khoi' });
    const objects = [clay];
    let reads = 0;
    const layer = {
      get objects() {
        reads += 1;
        return objects;
      },
    };
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer }], meta: META, content: CONTENT });
    const frame = () => {
      probe.begin();
      render(r, [clay], camera);
      probe.end();
    };
    probe.start();
    for (let i = 0; i < 60; i++) frame();
    expect(reads).toBe(0);
    const first = probe.list();
    expect(first.map((d) => d.label)).toEqual(['Khối đất']);
    expect(reads).toBe(1);
    expect(probe.list()).toBe(first); // cùng khung: cùng một danh sách đông cứng
    expect(reads).toBe(1);
    frame();
    expect(probe.list()).not.toBe(first); // khung mới: dựng lại, nhận vật mà thí nghiệm vừa thêm hay bớt
    expect(reads).toBe(2);
  });

  it('limit(k) chỉ vẽ k lần đầu của list (so theo vật + material + lượt, không theo thứ tự), list giữ nguyên; limit(null) vẽ đủ và ghi lại', () => {
    const { r, probe, clay, glass, grains, frame } = pond();
    probe.start();
    frame();
    const recorded = probe.list();
    const drawn = () => r.renderObject.mock.calls.map(([o, , cam]) => [o.name, cam === camera]);
    probe.limit(1);
    r.renderObject.mockClear();
    frame([grains, glass, clay]); // camera dời: three sắp lại thứ tự, vẫn chỉ sợi đầu đã ghi (khối) được vẽ
    expect(drawn()).toEqual([['khoi', true]]);
    expect(probe.list()).toBe(recorded); // đang limit thì không ghi: thanh của Từng sợi không nhảy
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 0 });
    probe.limit(2);
    r.renderObject.mockClear();
    frame();
    expect(drawn()).toEqual([['khoi', true], ['guong', true], ['khoi', false], ['hat', false]]); // gương soi cả hạt chưa vẽ
    probe.limit(0);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).not.toHaveBeenCalled(); // nấc 0: chưa vẽ gì
    probe.limit(3); // k ≥ số sợi: vẽ đủ như limit(null)
    r.renderObject.mockClear();
    frame([grains, clay]);
    expect(r.renderObject).toHaveBeenCalledTimes(2);
    expect(probe.list().map((d) => d.name)).toEqual(['hat', 'khoi']);
    probe.limit(1);
    probe.limit(null);
    frame([clay, glass]);
    expect(probe.list().map((d) => d.name)).toEqual(['khoi', 'guong']);
  });

  it('Mesh nhiều material: mỗi nhóm (group) là một sợi, tam giác theo nhóm; khóa có material nên limit(1) chỉ vẽ nhóm đầu', () => {
    const r = fakeRenderer();
    const box = new BoxGeometry(); // 36 chỉ số
    box.clearGroups();
    box.addGroup(0, 12, 0); // 4 tam giác
    box.addGroup(12, 24, 1); // 8 tam giác
    const top = mat();
    const block = Object.assign(new Mesh(box, [top, mat()]), { name: 'khoi' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects: [block] } }], meta: META, content: CONTENT });
    const frame = () => {
      probe.begin();
      render(r, [block], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.list().map((d) => [d.label, d.triangles])).toEqual([['Khối đất', 4], ['Khối đất', 8]]);
    probe.limit(1);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).toHaveBeenCalledTimes(1);
    expect(r.renderObject.mock.calls[0][4]).toBe(top);
  });

  it('passId: vật trong suốt vẽ hai lượt (mặt sau "backSide", rồi mặt trước), mỗi lượt một sợi; limit(1) chỉ vẽ lượt mặt sau', () => {
    const r = fakeRenderer();
    const bubble = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'bot' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    const frame = () => {
      probe.begin();
      render(r, [bubble], camera, 'backSide'); // _renderTransparents của three: danh sách hai lượt, mặt sau trước
      render(r, [bubble], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.list()).toHaveLength(2);
    probe.limit(1);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject.mock.calls.map((c) => c[8])).toEqual(['backSide']);
  });

  it('limit(k) nhận số nguyên ≥ 0 hay null; giá trị khác (chuỗi của input range…) thì ném lỗi', () => {
    const { probe } = pond();
    for (const bad of ['2', -1, 1.5, Number.NaN, undefined]) expect(() => probe.limit(bad)).toThrow('draws.limit');
  });

  it('vật là con của một Group nằm trong layer.objects nhận lớp, tên và nhãn của Group; vật không thuộc lớp nào có layerId null', () => {
    const r = fakeRenderer();
    const stem = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'than' });
    const bunch = Object.assign(new Group(), { name: 'bo' });
    bunch.add(stem);
    const stray = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'lac' });
    const nameless = new Mesh(new BoxGeometry(), mat());
    const later = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'them' });
    const objects = [bunch];
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects } }], meta: META, content: CONTENT });
    probe.start();
    objects.push(later); // objects là mảng SỐNG: thí nghiệm thêm vật lúc chạy, khung sau nhận ra
    probe.begin();
    render(r, [stem, stray, nameless, later], camera);
    probe.end();
    expect(probe.list().map(({ layerId, layer, name, label }) => ({ layerId, layer, name, label }))).toEqual([
      { layerId: 'cot', layer: 'Cốt', name: 'bo', label: 'Bó cành' },
      { layerId: null, layer: null, name: 'lac', label: 'lac' },
      { layerId: null, layer: null, name: null, label: 'Mesh' },
      { layerId: 'cot', layer: 'Cốt', name: 'them', label: 'them' }, // content không có nhãn cho nó: rơi về tên
    ]);
  });

  it('chữ của bức tải hỏng (content = null): nhãn rơi về tên vật, vật không tên thì về loại; lớp vẫn có tên (meta)', () => {
    const r = fakeRenderer();
    const clay = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'khoi' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects: [clay] } }], meta: META, content: null });
    probe.start();
    probe.begin();
    render(r, [clay, new Mesh(new BoxGeometry(), mat())], camera);
    probe.end();
    expect(probe.list().map((d) => [d.layer, d.label])).toEqual([['Cốt', 'khoi'], [null, 'Mesh']]);
  });

  it('kind, instances, triangles, material đúng cho Mesh có index, InstancedMesh có count, Sprite có count, hình không có index, drawRange', () => {
    const r = fakeRenderer();
    const box = new Mesh(new BoxGeometry(), mat()); // 36 chỉ số: 12 tam giác
    const grains = new InstancedMesh(new PlaneGeometry(), mat(), 50);
    grains.count = 30; // cấp phát 50, vẽ 30 bản
    const sparks = new Sprite(new SpriteNodeMaterial());
    sparks.count = 40; // Sprite của three r186 có count: một quad (2 tam giác) mỗi bản
    const soup = new BufferGeometry();
    soup.setAttribute('position', new Float32BufferAttribute(new Float32Array(27), 3)); // 9 đỉnh: 3 tam giác
    const loose = new Mesh(soup, mat());
    const half = new Mesh(new BoxGeometry(), mat());
    half.geometry.setDrawRange(24, 100); // chỉ số 24 → 36 (three cắt phần vượt quá số chỉ số): 4 tam giác
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [box, grains, sparks, loose, half], camera);
    probe.end();
    expect(probe.list().map(({ kind, instances, triangles, material }) => ({ kind, instances, triangles, material }))).toEqual([
      { kind: 'Mesh', instances: 1, triangles: 12, material: 'MeshStandardNodeMaterial' },
      { kind: 'InstancedMesh', instances: 30, triangles: 60, material: 'MeshStandardNodeMaterial' },
      { kind: 'Sprite', instances: 40, triangles: 80, material: 'SpriteNodeMaterial' },
      { kind: 'Mesh', instances: 1, triangles: 3, material: 'MeshStandardNodeMaterial' },
      { kind: 'Mesh', instances: 1, triangles: 4, material: 'MeshStandardNodeMaterial' },
    ]);
  });

  it('Points và Line: loại riêng, một bản, không vẽ tam giác; hình InstancedBufferGeometry: số bản là instanceCount', () => {
    const r = fakeRenderer();
    const soup = new BufferGeometry();
    soup.setAttribute('position', new Float32BufferAttribute(new Float32Array(27), 3)); // 9 đỉnh: Mesh trên hình này có 3 tam giác
    const dots = new Points(soup, new PointsNodeMaterial());
    const strand = new Line(soup, new LineBasicNodeMaterial());
    const copies = new InstancedBufferGeometry().copy(new BoxGeometry()); // 36 chỉ số: 12 tam giác mỗi bản
    copies.instanceCount = 7; // three vẽ instanceCount bản, không đọc object.count (Mesh mặc định 1)
    const crowd = new Mesh(copies, mat());
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [dots, strand, crowd], camera);
    probe.end();
    expect(probe.list().map(({ kind, instances, triangles, material }) => ({ kind, instances, triangles, material }))).toEqual([
      { kind: 'Points', instances: 1, triangles: 0, material: 'PointsNodeMaterial' },
      { kind: 'Line', instances: 1, triangles: 0, material: 'LineBasicNodeMaterial' },
      { kind: 'Mesh', instances: 7, triangles: 84, material: 'MeshStandardNodeMaterial' },
    ]);
  });

  it('stop sau khi đang limit thì vẽ đủ như chưa có gì; start lại là phiên mới (chưa có list, không còn limit cũ)', () => {
    const { r, probe, frame } = pond();
    probe.start();
    frame();
    probe.limit(0);
    probe.stop();
    expect(r._fn).toBeNull();
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).toHaveBeenCalledTimes(5);
    probe.start();
    expect(probe.list()).toEqual([]);
    frame();
    expect(probe.list()).toHaveLength(3);
  });

  it('lần vẽ ném lỗi: lỗi đi lên render (khung lỗi), list giữ khung đủ trước đó; khung sau ghi đúng lần vẽ lồng; stop vẫn trả hàm cũ', () => {
    const { r, probe, glass, frame } = pond();
    probe.start();
    frame();
    const draw = r.renderObject.getMockImplementation();
    r.renderObject.mockImplementation(function (o, ...rest) {
      if (o === glass) throw new Error('GPU hỏng');
      draw.call(this, o, ...rest);
    });
    expect(() => frame()).toThrow('GPU hỏng');
    expect(probe.list()).toHaveLength(3);
    r.renderObject.mockImplementation(draw);
    frame();
    expect(probe.list().map((d) => d.nested)).toEqual([0, 2, 0]);
    probe.stop();
    expect(r._fn).toBeNull();
  });
});
