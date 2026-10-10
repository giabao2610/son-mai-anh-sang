// engine/gpu/draws.js — móc lần vẽ: đặt renderer.setRenderObjectFunction chỉ khi cần; Từng sợi (ghi lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu) và Bản dịch (GĐ 9: mã shader của RenderObject đang vẽ).
import { NONE, kindOf, instancesOf, trianglesOf } from './draw-info.js';

/**
 * Móc lần vẽ (spec §7 Từng sợi, Phụ lục A.53). Trong mỗi render(), three gọi hàm vẽ hiện tại cho từng mục của render list theo
 * đúng thứ tự đã sắp (đục trước, trong suốt sau): renderObject gốc, hay hàm đặt bằng setRenderObjectFunction. Lúc có người cần
 * (Từng sợi bật, hay một lần bắt của Bản dịch đang chờ), móc đứng vào chỗ đó, rồi gọi tiếp hàm vẽ trước nó cho lần vẽ được phép:
 * - lần vẽ của CAMERA CHÍNH (lượt vẽ cảnh) được ghi lại, và bị bỏ qua nếu không nằm trong k lần đầu của limit(k). Không gọi hàm
 *   vẽ là vật không được vẽ và renderer.info không đếm nó. Móc không đụng visible hay thứ gì trong cache key: không biên dịch lại;
 * - lần vẽ của camera khác LỒNG trong lần vẽ của một vật là phản chiếu: reflector vẽ lại cảnh bằng camera ảo ngay lúc vẽ mặt soi;
 * - lần vẽ của camera khác ở ngoài cùng là hậu kỳ: RenderPipeline vẽ quad cuối mà không gỡ móc, và scene pass lại được vẽ từ BÊN
 *   TRONG lần vẽ quad ấy (updateBefore của node). Quad không phải phản chiếu: nó vào "các lượt khác".
 * Bóng đổ, bloom và RTT tự cất móc rồi trả lại (ShadowNode, resetRendererState), nên móc không thấy lần vẽ của chúng. Cũng vì
 * vậy, scene pass nào lần đầu được vẽ từ bên trong một RTT thì móc không thấy lượt vẽ cảnh: views.js (compose) đặt scene pass
 * đứng đầu lượt cuối, trước RTT của FXAA. Mọi thứ móc không thấy nằm trong "các lượt khác" = draw call của cả khung
 * (renderer.info) trừ cảnh và phản chiếu.
 *
 * scene.js bọc mỗi pipeline.render() bằng begin()/end(); công cụ không có hai hàm này (toolbox.js chỉ đưa năm hàm của DrawProbe).
 * Khung vẽ đủ (không limit) thì được ghi; đang limit thì list() đứng yên, để thanh của Từng sợi không nhảy khi người xem đang dừng
 * ở một sợi. limit(k) so theo vật + material + lượt (khóa object.id:material.id:passId, không theo thứ tự): camera dời làm three
 * sắp lại vật đục theo độ sâu, mà sợi đang xem vẫn là những vật ấy.
 *
 * Bản dịch (GĐ 9, spec §21.3, "bắt lúc vẽ"): capture() cho mã shader của khung vẽ kế tiếp. Ngay sau mỗi lần vẽ, móc tìm lại
 * RenderObject mà three vừa vẽ, đúng như Renderer._renderObjectDirect tìm (Phụ lục A.102, test ghim), rồi đọc chuỗi mã đã dịch của nó
 * (getNodeBuilderState): mã trùng từng ký tự với mã GPU đang chạy, không dựng hay biên dịch gì thêm. Chỉ file này đọc hai trường
 * riêng của renderer (_objects, _currentRenderContext; luật ở tests/rules/files.test.js). Chỗ DrawInfo chưa khớp three: draw-info.js.
 *
 * @param {object} p
 * @param {any} p.renderer       WebGPURenderer
 * @param {any} p.camera         camera chính (camera của scene pass)
 * @param {{ id: string, layer: { objects?: any[] } }[]} p.layers   lớp đã dựng; objects là mảng SỐNG (thí nghiệm thêm, bớt vật)
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta   tên lớp: meta.layers[i].name
 * @param {import('../contracts/painting.js').PaintingContent | null} [p.content]   nhãn vật: content.layers[id].objects[name]
 * @returns {import('../contracts/runtime.js').DrawProbe & { begin: () => void, end: () => void,
 *   capture: () => Promise<{ scene: object[], post: object[] }>, dispose: () => void }}
 */
export function createDrawProbe({ renderer, camera, layers, meta, content = null }) {
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  // Chữ của bức tải hỏng (content null) thì không vật nào có nhãn: Từng sợi dùng tên vật.
  const labelOf = (layerId, name) => content?.layers?.[layerId]?.objects?.[name];
  let started = false; // Từng sợi đang bật
  let installed = false; // móc đang gắn: Từng sợi bật, hay còn lần bắt đang chờ
  let prev = null; // hàm vẽ lúc gắn móc: null (renderObject của three) hay hàm ai đó đã đặt trước
  let allowed = null; // limit(k): khóa của k lần vẽ đầu; null = vẽ đủ
  let recording = false; // khung đang vẽ có được ghi không: chỉ khung vẽ đủ, giữa begin() và end()
  let records = [];
  let reflection = 0;
  let callsAtBegin = 0;
  let current = null; // lần vẽ của camera chính đang chạy: lần vẽ lồng bên trong cộng vào nested của nó
  let last = null; // khung vẽ đủ gần nhất: { records, draws (null tới lần list() đầu), counts }
  let waiting = []; // lần bắt chưa xong của Bản dịch: { resolve, reject }
  let shot = null; // khung đang bắt: { scene, post }
  let disposed = false;

  /** Vật → id lớp, dựng lại cho mỗi khung được hỏi từ các mảng objects SỐNG. */
  const ownerMap = () => {
    const owners = new Map();
    for (const { id, layer } of layers) for (const o of layer.objects ?? []) owners.set(o, id);
    return owners;
  };

  /** Một mục của list(). Chủ của vật là chính nó, hay tổ tiên gần nhất nằm trong layer.objects (con của một Group). */
  const toInfo = ({ object, geometry, material, group, nested }, owners) => {
    let owner = object;
    while (owner && !owners.has(owner)) owner = owner.parent;
    const layerId = owner ? owners.get(owner) : null;
    const name = owner?.name || object.name || null;
    const kind = kindOf(object);
    const instances = instancesOf(object, geometry);
    return Object.freeze({
      layerId,
      layer: layerId === null ? null : (names.get(layerId) ?? null),
      name,
      label: (layerId !== null && name !== null ? labelOf(layerId, name) : undefined) ?? name ?? kind,
      kind,
      instances,
      triangles: trianglesOf(object, geometry, group, instances),
      material: material.type,
      nested,
    });
  };

  /**
   * Mã của RenderObject mà three dùng cho lần vẽ này, tìm như Renderer._renderObjectDirect: cùng vật, material, render context (lấy LÚC
   * VÀO móc: lần vẽ lồng bên trong, như phản chiếu hay scene pass trong quad cuối, đổi rồi trả nó) và passId. Lỗi thì ghi vào `error`:
   * khung và móc vẫn chạy tiếp.
   */
  const shaderOf = (object, material, scene, cam, lightsNode, context, clippingContext, passId) => {
    try {
      const state = renderer._objects.get(object, material, scene, cam, lightsNode, context, clippingContext, passId).getNodeBuilderState();
      return { vertex: state.vertexShader ?? null, fragment: state.fragmentShader ?? null };
    } catch (err) {
      return { error: String(err?.message ?? err) };
    }
  };

  /** Hàm vẽ thay chỗ của three (cùng tham số với renderer.renderObject). */
  function hook(object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId) {
    const context = renderer._currentRenderContext;
    const draw = () => (prev ?? renderer.renderObject).call(renderer, object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId);
    const read = () => shaderOf(object, material, scene, cam, lightsNode, context, clippingContext, passId);
    if (cam !== camera) {
      if (current) {
        reflection += 1;
        current.nested += 1;
        draw(); // phản chiếu: Bản dịch không bắt
        return;
      }
      draw();
      if (shot && object.isQuadMesh) shot.post.push({ object, ...read() }); // ngoài cùng: quad của lượt cuối
      return;
    }
    // passId: three vẽ vật trong suốt có transmission hai lượt ('backSide' rồi mặt trước), mỗi lượt là một sợi.
    const key = `${object.id}:${material.id}:${passId ?? ''}`;
    if (allowed && !allowed.has(key)) {
      // Từng sợi bỏ lần vẽ này; RenderObject của nó có từ những khung vẽ đủ trước, nên Bản dịch vẫn đọc được.
      if (shot) shot.scene.push({ object, material, passId, ...read() });
      return;
    }
    if (!recording && !shot) {
      draw();
      return;
    }
    const record = { object, geometry, material, group, key, nested: 0 };
    if (recording) records.push(record);
    const outer = current;
    current = record;
    try {
      draw();
    } finally {
      current = outer; // lỗi đi tiếp lên render() như mọi lỗi trong khung
    }
    if (shot) shot.scene.push({ object, material, passId, ...read() });
  }

  /** Gắn móc nếu chưa gắn. Gắn một lần cho cả Từng sợi lẫn Bản dịch: không ai đè hay mất `prev` của ai. */
  const install = () => {
    if (installed) return;
    installed = true;
    prev = renderer.getRenderObjectFunction();
    renderer.setRenderObjectFunction(hook);
  };
  /** Gỡ móc khi không còn ai cần: Từng sợi đã tắt và không còn lần bắt nào chờ. */
  const release = () => {
    if (!installed || started || waiting.length > 0) return;
    installed = false;
    renderer.setRenderObjectFunction(prev);
    prev = null;
  };

  /**
   * Tắt Từng sợi: bỏ limit (vẽ đủ như chưa có gì), thả khung đã ghi (bản ghi thô giữ vật, hình và material của nó), gỡ móc nếu không còn
   * lần bắt nào chờ (công cụ bị gỡ vì lỗi cũng vậy). Gọi hai lần vẫn an toàn.
   */
  const stop = () => {
    if (!started) return;
    started = false;
    allowed = null;
    recording = false;
    current = null;
    last = null;
    release();
  };

  return {
    /** Gắn móc (công cụ bật). Phiên mới: chưa có list, không limit; khung vẽ kế tiếp được ghi. Gọi hai lần vẫn an toàn. */
    start() {
      if (started) return;
      started = true;
      allowed = null;
      last = null;
      install();
    },
    stop,
    /** scene.js gọi ngay trước pipeline.render(). Còn lần bắt chờ thì khung này được bắt (render() ném lỗi thì khung sau bắt lại). */
    begin() {
      shot = waiting.length > 0 ? { scene: [], post: [] } : null;
      current = null;
      if (!started) return;
      recording = allowed === null;
      records = [];
      reflection = 0;
      callsAtBegin = renderer.info.render.drawCalls;
    },
    /**
     * scene.js gọi ngay sau pipeline.render(). render() ném lỗi thì không tới đây: list() giữ khung đủ trước đó. Chỉ cất bản
     * ghi thô: xem đủ khung thì khung nào cũng được ghi, mà Từng sợi chỉ hỏi list() mỗi 250 ms. Khung bắt xong thì trả mọi lần bắt
     * đang chờ, rồi gỡ móc nếu Từng sợi không bật.
     */
    end() {
      if (started && recording) {
        recording = false;
        const scene = records.length;
        const total = renderer.info.render.drawCalls - callsAtBegin;
        last = { records, draws: null, counts: { scene, reflection, other: Math.max(0, total - scene - reflection) } };
        records = [];
      }
      if (!shot) return;
      const frame = shot;
      const done = waiting;
      shot = null;
      waiting = [];
      for (const { resolve } of done) resolve(frame);
      release();
    },
    /**
     * DrawInfo dựng lúc được hỏi lần đầu, rồi giữ tới khung ghi kế tiếp. Chủ, tên và số bản của vật đọc lúc hỏi, không phải lúc
     * vẽ: Từng sợi luôn hỏi khung mới nhất, nên hai lúc chênh nhau chừng một khung.
     */
    list() {
      if (!last) return NONE;
      if (!last.draws) {
        const owners = ownerMap();
        last.draws = Object.freeze(last.records.map((r) => toInfo(r, owners)));
      }
      return last.draws;
    },
    limit(k) {
      if (k !== null && !(Number.isInteger(k) && k >= 0)) {
        throw new Error(`draws.limit(k): k phải là số nguyên ≥ 0 hoặc null, nhận ${String(k)} (${typeof k})`);
      }
      const keys = last ? last.records.map((r) => r.key) : [];
      allowed = k === null || k >= keys.length ? null : new Set(keys.slice(0, k));
    },
    counts: () => ({ ...(last?.counts ?? { scene: 0, reflection: 0, other: 0 }) }),
    /**
     * Bản dịch (GĐ 9): Promise mã shader của khung vẽ KẾ TIẾP giữa begin() và end(): { scene: [{ object, material, passId, vertex,
     * fragment }] (lần vẽ của camera chính, kể cả lần Từng sợi bỏ), post: [{ object, vertex, fragment }] (quad của lượt cuối) }; mục đọc
     * hỏng có `error` thay cho mã. Gắn móc ngay, để khung kế tiếp đi qua nó.
     */
    capture() {
      if (disposed) return Promise.reject(new Error('Cảnh đã gỡ: không còn khung nào để đọc mã shader'));
      return new Promise((resolve, reject) => {
        waiting.push({ resolve, reject });
        install();
      });
    },
    /** Gỡ cảnh (disposer của scene.js): tắt Từng sợi, lần bắt còn chờ thì hỏng (không khung nào tới nữa), gỡ móc. */
    dispose() {
      disposed = true;
      stop();
      const done = waiting;
      waiting = [];
      shot = null;
      for (const { reject } of done) reject(new Error('Cảnh đã gỡ trước khi vẽ khung để đọc mã shader (Bản dịch)'));
      release();
    },
  };
}
