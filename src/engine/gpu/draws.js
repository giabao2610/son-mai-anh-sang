// engine/gpu/draws.js — móc lần vẽ cho Từng sợi: đặt renderer.setRenderObjectFunction chỉ khi công cụ bật, ghi lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu.

/** list() khi chưa có khung nào được ghi: đông cứng như list của một khung đã ghi. */
const NONE = Object.freeze([]);

/** Loại vật như Từng sợi ghi (DrawInfo.kind). */
const kindOf = (o) => (o.isInstancedMesh ? 'InstancedMesh' : o.isSprite ? 'Sprite' : o.isPoints ? 'Points' : o.isLine ? 'Line' : 'Mesh');

/**
 * Số bản của một lần vẽ, như three tính (RenderObject.getDrawParameters): instanceCount của InstancedBufferGeometry, không thì
 * object.count. Ở r186 Mesh, InstancedMesh và Sprite đều có count (Mesh mặc định 1); Points, Line không có: một bản.
 */
const instancesOf = (object, geometry) => (geometry?.isInstancedBufferGeometry ? geometry.instanceCount : Math.max(0, object.count ?? 1));

/**
 * Số tam giác, như three đếm đỉnh của lần vẽ (RenderObject.getDrawParameters): khúc drawRange của hình, cắt theo nhóm (group: Mesh
 * nhiều material vẽ mỗi nhóm một lần) và theo số chỉ số (hay số đỉnh, khi không có index); / 3 × số bản. Sprite là một quad;
 * Points, Line không vẽ tam giác.
 */
function trianglesOf(object, geometry, group, instances) {
  if (object.isSprite) return 2 * instances;
  if (object.isPoints || object.isLine) return 0;
  const range = geometry?.drawRange ?? { start: 0, count: Infinity };
  const first = Math.max(range.start, group?.start ?? 0, 0);
  const last = Math.min(range.start + range.count, group ? group.start + group.count : Infinity);
  const items = geometry?.index ? geometry.index.count : (geometry?.attributes?.position?.count ?? 0);
  return Math.floor(Math.max(0, Math.min(last, items) - first) / 3) * instances;
}

/**
 * Móc lần vẽ (spec §7 Từng sợi, Phụ lục A.53). Trong mỗi render(), three gọi hàm vẽ hiện tại cho từng mục của render list theo
 * đúng thứ tự đã sắp (đục trước, trong suốt sau): renderObject gốc, hay hàm đặt bằng setRenderObjectFunction. Giữa start() và
 * stop(), móc đứng vào chỗ đó, rồi gọi tiếp hàm vẽ trước nó cho lần vẽ được phép:
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
 * Chỗ DrawInfo chưa khớp three:
 * - móc ghi cả lần vẽ mà three rồi tự bỏ bên trong renderObject (count 0, pipeline chưa biên dịch xong), nên scene có thể lớn hơn
 *   số lần vẽ thật và other dừng ở 0;
 * - vật wireframe vẽ đoạn thẳng mà vẫn báo số tam giác của hình (Bức 1 gặp chỗ này khi người xem bật núm wireframe của Cốt);
 * - hai nhóm của một Mesh dùng chung một material thì chung một khóa: limit(k) giữ hay bỏ cả hai (Bức 1 không có Mesh nhiều material);
 * - vật trong suốt DoubleSide (forceSinglePass false, không có transmission; Bức 1 không có material như thế): renderObject của three
 *   tự vẽ hai lần ('backSide' rồi mặt trước) ngay trong MỘT lần gọi móc, nên đó là một sợi cho hai draw call (lần thừa vào other),
 *   và limit(k) giữ hay bỏ cả hai. Vật có transmission thì khác: three vẽ hai lượt, mỗi lượt một lần gọi móc (passId, ở dưới).
 *
 * @param {object} p
 * @param {any} p.renderer       WebGPURenderer
 * @param {any} p.camera         camera chính (camera của scene pass)
 * @param {{ id: string, layer: { objects?: any[] } }[]} p.layers   lớp đã dựng; objects là mảng SỐNG (thí nghiệm thêm, bớt vật)
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta   tên lớp: meta.layers[i].name
 * @param {import('../contracts/painting.js').PaintingContent | null} [p.content]   nhãn vật: content.layers[id].objects[name]
 * @returns {import('../contracts/runtime.js').DrawProbe & { begin: () => void, end: () => void }}
 */
export function createDrawProbe({ renderer, camera, layers, meta, content = null }) {
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  // Chữ của bức tải hỏng (content null) thì không vật nào có nhãn: Từng sợi dùng tên vật.
  const labelOf = (layerId, name) => content?.layers?.[layerId]?.objects?.[name];
  let started = false;
  let prev = null; // hàm vẽ lúc gắn móc: null (renderObject của three) hay hàm ai đó đã đặt trước
  let allowed = null; // limit(k): khóa của k lần vẽ đầu; null = vẽ đủ
  let recording = false; // khung đang vẽ có được ghi không: chỉ khung vẽ đủ, giữa begin() và end()
  let records = [];
  let reflection = 0;
  let callsAtBegin = 0;
  let current = null; // lần vẽ của camera chính đang chạy: lần vẽ lồng bên trong cộng vào nested của nó
  let last = null; // khung vẽ đủ gần nhất: { records, draws (null tới lần list() đầu), counts }

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

  /** Hàm vẽ thay chỗ của three (cùng tham số với renderer.renderObject). */
  function hook(object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId) {
    const draw = () => (prev ?? renderer.renderObject).call(renderer, object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId);
    if (cam !== camera) {
      if (current) {
        reflection += 1;
        current.nested += 1;
      }
      draw();
      return;
    }
    // passId: three vẽ vật trong suốt có transmission hai lượt ('backSide' rồi mặt trước), mỗi lượt là một sợi.
    const key = `${object.id}:${material.id}:${passId ?? ''}`;
    if (allowed && !allowed.has(key)) return;
    if (!recording) {
      draw();
      return;
    }
    const record = { object, geometry, material, group, key, nested: 0 };
    records.push(record);
    const outer = current;
    current = record;
    try {
      draw();
    } finally {
      current = outer; // lỗi đi tiếp lên render() như mọi lỗi trong khung
    }
  }

  return {
    /** Gắn móc (công cụ bật). Phiên mới: chưa có list, không limit; khung vẽ kế tiếp được ghi. Gọi hai lần vẫn an toàn. */
    start() {
      if (started) return;
      started = true;
      allowed = null;
      last = null;
      prev = renderer.getRenderObjectFunction();
      renderer.setRenderObjectFunction(hook);
    },
    /** Gỡ móc, trả hàm vẽ trước đó (kể cả khi công cụ bị gỡ vì lỗi), bỏ limit: vẽ đủ như chưa có gì. Gọi hai lần vẫn an toàn. */
    stop() {
      if (!started) return;
      started = false;
      allowed = null;
      recording = false;
      current = null;
      renderer.setRenderObjectFunction(prev);
      prev = null;
    },
    /** scene.js gọi ngay trước pipeline.render(). */
    begin() {
      if (!started) return;
      recording = allowed === null;
      records = [];
      reflection = 0;
      current = null;
      callsAtBegin = renderer.info.render.drawCalls;
    },
    /**
     * scene.js gọi ngay sau pipeline.render(). render() ném lỗi thì không tới đây: list() giữ khung đủ trước đó. Chỉ cất bản
     * ghi thô: xem đủ khung thì khung nào cũng được ghi, mà Từng sợi chỉ hỏi list() mỗi 250 ms.
     */
    end() {
      if (!started || !recording) return;
      recording = false;
      const scene = records.length;
      const total = renderer.info.render.drawCalls - callsAtBegin;
      last = { records, draws: null, counts: { scene, reflection, other: Math.max(0, total - scene - reflection) } };
      records = [];
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
  };
}
