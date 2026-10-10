// engine/gpu/translate.js — Bản dịch (GĐ 9): mã shader thật mà GPU đang chạy cho từng vật và cho quad cuối, đọc từ một khung vẽ thật (draws.js), và những nơi một lớp có mặt.
import { uniformName } from './knob-set.js';

/** Tên uniform trọng số của một lớp, như layers.js#createWeights đặt. */
export const weightUniform = (layerId) => `w_${layerId.replaceAll('-', '_')}`;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Số dòng của `code` có ít nhất một tên trong `names`, so cả tên: `w_suong` không khớp `w_suong_2` hay `aw_suong`.
 * @param {string | null} code
 * @param {string[]} names
 */
export function countLines(code, names) {
  if (!code || names.length === 0) return 0;
  const re = new RegExp(`\\b(?:${names.map(escapeRe).join('|')})\\b`);
  return code.split('\n').filter((line) => re.test(line)).length;
}

/**
 * Uniform mà người xem điều khiển được của một lớp: trọng số (Cốt không có: luật 1) và núm 'uniform' (núm 'js', 'rebuild' không có).
 * @param {{ id: string, module: { knobs?: { id: string, via?: string }[] } }} built
 * @returns {{ weight: string | null, knobs: Record<string, string> }}
 */
export function layerUniforms({ id, module }) {
  const knobs = {};
  for (const k of module.knobs ?? []) if ((k.via ?? 'uniform') === 'uniform') knobs[k.id] = uniformName(id, k.id);
  return { weight: id === 'cot' ? null : weightUniform(id), knobs };
}

/**
 * Mọi vật vẽ được của các lớp, theo thứ tự phủ: Mesh, InstancedMesh, Sprite, Points, Line có MỘT material, kể cả con của một Group nằm
 * trong layer.objects. Mesh nhiều material bị bỏ (chưa bức nào có): khóa của một nơi là vật + lượt, không có material.
 * @param {{ id: string, layer: { objects?: any[] } }[]} layers
 * @returns {{ object: any, owner: string, name: string | null, index: number, of: number }[]}  index/of: thứ tự trong vật gốc
 */
export function drawablesOf(layers) {
  const out = [];
  for (const { id, layer } of layers) {
    for (const root of layer.objects ?? []) {
      const found = [];
      root.traverse((o) => {
        if ((o.isMesh || o.isSprite || o.isPoints || o.isLine) && o.material && !Array.isArray(o.material)) found.push(o);
      });
      found.forEach((object, i) => out.push({ object, owner: id, name: root.name || null, index: i + 1, of: found.length }));
    }
  }
  return out;
}

/**
 * Bộ dịch của MỘT cảnh (spec §21.3, "bắt lúc vẽ"). Mỗi bản dịch bắt MỘT khung vẽ thật qua móc lần vẽ (draws.capture()): mã của một
 * nơi là chuỗi mà three đã dịch cho chính RenderObject đang vẽ, nên trùng từng ký tự với mã GPU chạy; không giữ khung, không dựng hay
 * biên dịch gì. Dưới ?freeze, redraw() vẽ lại khung đứng yên và khung ấy được bắt; lúc cảnh chạy, redraw() xong ngay và khung kế tiếp
 * của vòng lặp được bắt.
 * @param {object} p
 * @param {any} p.renderer
 * @param {{ capture: () => Promise<{ scene: object[], post: object[] }> }} p.draws   móc lần vẽ của cảnh (draws.js)
 * @param {() => Promise<void>} p.redraw   vẽ lại khung đứng yên của ?freeze (scene.js); lúc cảnh chạy thì xong ngay
 * @param {{ id: string, module: object, layer: object }[]} p.layers   lớp đã dựng (objects là mảng SỐNG: thí nghiệm thêm, bớt vật)
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {object | null} [p.content]   nhãn vật: content.layers[id].objects[name]
 * @param {string} p.postLabel          nhãn của quad cuối (t.translation.post)
 */
export function createTranslator({ renderer, draws, redraw, layers, meta, content = null, postLabel }) {
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  const language = renderer.backend?.isWebGPUBackend ? 'wgsl' : 'glsl';
  let gone = false;

  const labelOf = ({ object, owner, name, index, of }) => {
    const base = (name ? content?.layers?.[owner]?.objects?.[name] : undefined) ?? name ?? object.type;
    return `${base}${of > 1 ? ` (${index}/${of})` : ''} · ${names.get(owner) ?? owner}`;
  };
  /** Mã của một lần vẽ đã bắt: mục đọc hỏng không có mã, có `error`. */
  const codeOf = (r) => ({ drawn: true, vertex: r.vertex ?? null, fragment: r.fragment ?? null, ...(r.error ? { error: r.error } : {}) });

  return {
    language,
    /**
     * Bản dịch của một lớp (spec §21.1): những nơi uniform của lớp có mặt, cộng những nơi đọc hỏng (cả vật không lớp nào giữ). Thứ tự cố
     * định: vật của chính lớp trước, rồi vật của lớp khác theo thứ tự phủ (drawablesOf), rồi vật không lớp nào giữ, rồi quad cuối. Không
     * nơi nào có thì trả vật của chính lớp (vật mà khung ấy không vẽ có `drawn: false`), và `jsOnly` chỉ true khi chắc: có ít nhất một vật
     * của lớp ĐƯỢC VẼ mà mã không mang uniform nào của lớp (hay lớp không có vật nào). Mọi vật của lớp đều không được vẽ (trọng số 0 ẩn
     * vật) thì chưa biết gì: `jsOnly` false, các nơi đều `drawn: false` (Sổ tay nói "khung vừa rồi không vẽ vật nào của lớp").
     * Nơi đọc hỏng ghi MỘT console.warn cho cả bản dịch (Sổ tay nói "chi tiết ở console").
     * @param {string} layerId
     * @returns {Promise<import('../contracts/runtime.js').Translation>}
     */
    async translation(layerId) {
      if (gone) throw new Error('Cảnh đã gỡ: không còn bản dịch');
      const built = layers.find((b) => b.id === layerId);
      if (!built) throw new Error(`Không có lớp "${layerId}"`);
      const uniforms = layerUniforms(built);
      const wanted = [uniforms.weight, ...Object.values(uniforms.knobs)].filter(Boolean);
      // Gắn lần bắt TRƯỚC khi vẽ lại. Promise.all: redraw() hỏng thì lần bắt vẫn có người nghe, gỡ cảnh sau đó không thành lỗi lơ lửng.
      const [{ scene, post }] = await Promise.all([draws.capture(), redraw()]);
      if (scene.length === 0) console.warn(`Bản dịch lớp "${layerId}": móc lần vẽ không thấy lần vẽ nào của camera chính trong khung vừa bắt.`);
      const hitsOf = (p) => ({ vertex: countLines(p.vertex, wanted), fragment: countLines(p.fragment, wanted) });
      const placeOf = (fields) => ({ ...fields, hits: hitsOf(fields) });
      const all = [];
      const byObject = new Map();
      for (const r of scene) byObject.set(r.object, [...(byObject.get(r.object) ?? []), r]);
      for (const d of drawablesOf(layers)) {
        const records = byObject.get(d.object);
        byObject.delete(d.object);
        const base = { label: labelOf(d), owner: d.owner, own: d.owner === layerId, post: false };
        if (records) for (const r of records) all.push(placeOf({ key: `${d.object.id}:${r.passId ?? ''}`, ...base, ...codeOf(r) }));
        else if (base.own) all.push(placeOf({ key: `${d.object.id}:`, ...base, drawn: false, vertex: null, fragment: null }));
      }
      // Vật không lớp nào giữ (vật của setup, con không tên…): chỉ thành một nơi khi mã có uniform của lớp.
      for (const [object, records] of byObject) {
        for (const r of records) {
          const key = `${object.id}:${r.passId ?? ''}`;
          const p = placeOf({ key, label: object.name || object.type, owner: null, own: false, post: false, ...codeOf(r) });
          if (p.error || p.hits.vertex + p.hits.fragment > 0) all.push(p); // đọc hỏng: không biết lớp có mặt ở đó không, vẫn hiện
        }
      }
      post.forEach((r, i) => {
        const label = post.length > 1 ? `${postLabel} (${i + 1}/${post.length})` : postLabel;
        all.push(placeOf({ key: `post:${i}`, label, owner: null, own: false, post: true, ...codeOf(r) }));
      });
      // Nơi đọc hỏng vẫn hiện (không biết lớp có mặt ở đó hay không: người xem thấy dòng "chưa dịch được"); console có chi tiết. Ghi SAU
      // lần bắt (ngoài móc lần vẽ), một dòng cho cả bản dịch.
      const broken = all.filter((p) => p.error);
      if (broken.length > 0) {
        console.warn(`Bản dịch lớp "${layerId}": ${broken.length} nơi chưa đọc được mã: ${broken.map((p) => `${p.label}: ${p.error}`).join('; ')}`);
      }
      const shown = all.filter((p) => p.error || p.hits.vertex + p.hits.fragment > 0);
      const own = all.filter((p) => p.own);
      const jsOnly = shown.length === 0 && (own.length === 0 || own.some((p) => p.drawn));
      const chosen = shown.length === 0 ? own : shown;
      const places = [...chosen.filter((p) => p.own), ...chosen.filter((p) => !p.own)];
      return { language, backend: language === 'wgsl' ? 'webgpu' : 'webgl2', uniforms, places, jsOnly };
    },
    /** Gỡ cảnh: lần dịch sau đó hỏng ngay. Lần bắt đang chờ thì draws.js làm hỏng (nó giữ chúng). */
    dispose() {
      gone = true;
    },
  };
}
