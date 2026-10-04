// tests/helpers/nodes.js — soi đồ thị node của three ngay trong Node (không GPU): duyệt mọi node, và dịch material ra WGSL/GLSL bằng node builder thật.
import { HalfFloatType, RenderTarget, WebGPURenderer } from 'three/webgpu';
import { makeMRT } from '../../src/engine/gpu/pipeline.js';

/**
 * Mọi node trong đồ thị của `root`, mỗi node một lần (đồ thị dùng chung nhánh). Node của TSL hay đi qua Proxy (nodeObject),
 * nên gộp theo `id` chứ không theo tham chiếu; test cũng so node theo `id`. getChildren() KHÔNG đi vào thân của một Fn
 * (thân chỉ chạy lúc dịch): muốn thấy vòng lặp hay phép so bên trong Fn thì dịch ra mã bằng compileMaterial.
 * @param {any} root
 * @returns {any[]}
 */
export function nodesOf(root) {
  const seen = new Map();
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node?.isNode || seen.has(node.id)) continue;
    seen.set(node.id, node);
    stack.push(...node.getChildren());
  }
  return [...seen.values()];
}

/** Tên (setName) của mọi uniform trong đồ thị của `root`. */
export const uniformNames = (root) => nodesOf(root).filter((n) => n.isUniformNode).map((n) => n.name);

/** Tên của mọi thuộc tính đỉnh (attribute) mà đồ thị của `root` đọc. */
export const attributeNames = (root) => nodesOf(root).filter((n) => n.type === 'AttributeNode').map((n) => n.getAttributeName());

// Giới hạn uniform buffer nhỏ nhất mà chuẩn bảo đảm: máy thật chỉ có thể lớn hơn.
const UNIFORM_BUFFER_LIMIT = { webgpu: 64 * 1024, webgl2: 16 * 1024 };

/**
 * Hai lượt vẽ cảnh: render target (ảnh HalfFloat như PassNode và ReflectorNode của r186 tạo) và MRT của renderer.
 * - scene: scene pass, hai ảnh tên 'output' và 'emissive' như pipeline.js xin kênh. MRTNode xếp đầu ra vào ảnh theo TÊN
 *   ảnh, nên tên phải khớp đầu ra của makeMRT. mrtNode của material gộp vào MRT đó (đè đầu ra cùng tên).
 * - reflector: ảnh phản chiếu, một ảnh, MRT null (ReflectorNode gọi setMRT(null) trước khi vẽ). Mọi vật đều vào ảnh này
 *   trừ chính mặt nước (reflector ẩn nó). Material có mrtNode mà vẽ ở đây thì mrtNode thay cả đầu ra, mà ảnh này không
 *   mang tên đầu ra nào: WGSL ra struct đầu ra rỗng.
 * View Normal (views.js) thêm ảnh thứ ba vào scene pass: biến thể đó chưa có ở đây.
 */
const PASSES = {
  scene() {
    const target = new RenderTarget(1, 1, { count: 2, type: HalfFloatType });
    target.textures[0].name = 'output';
    target.textures[1].name = 'emissive';
    return { target, mrt: makeMRT() };
  },
  reflector: () => ({ target: new RenderTarget(1, 1, { type: HalfFloatType }), mrt: null }),
};

/**
 * Dịch material của `object` ra mã shader như renderer làm ở lần vẽ đầu (NodeManager._createNodeBuilder của r186), nhưng
 * không cần GPU: renderer chưa init() vẫn có thư viện node, lighting, và backend để chọn node builder (WGSL cho WebGPU,
 * GLSL cho WebGL2). `pass` là lượt vẽ (PASSES): 'scene' (mặc định) ra đúng biến thể mà scene pass vẽ, có MRT của xưởng
 * và mrtNode của material; 'reflector' ra biến thể của ảnh phản chiếu, không MRT. Không có đèn: chỉ kiểm node của bức,
 * không kiểm mô hình chiếu sáng. Lỗi và cảnh báo của TSL đi ra console (three không ném), nên gom vào `problems` để test
 * so với []; `outputs` là số ảnh fragment shader ghi ra (countOutputs).
 * `problems` chỉ gom những gì three in ra TRONG lúc dịch, nên không đủ hết: cảnh báo in lúc dựng đồ thị (như API đã bỏ)
 * đã qua trước đó, và warnOnce của three (utils.js) chỉ in mỗi câu một lần cho cả lần nạp three (với Vitest: cả file
 * test), nên câu đã in một lần, lúc dựng đồ thị hay ở lần dịch trước, không bao giờ tới `problems`. Cảnh báo bằng warn
 * thường thì lần dịch nào cũng in, nên bắt được, vd "Return statement used in an inline 'Fn()'" (nhánh If trả giá trị
 * trong một Fn gọi ngay).
 * Ra được mã mới là qua bước của three: trình dịch WGSL/GLSL của GPU thật (e2e) có nhận hay không là chuyện khác.
 * @param {any} object  Mesh, InstancedMesh hay Sprite (đã dựng trong ctx.scene)
 * @param {{ scene: any, camera: any }} ctx
 * @param {'webgpu' | 'webgl2'} backend
 * @param {{ pass?: 'scene' | 'reflector', shadows?: boolean, lights?: boolean }} [options]
 *   shadows (GĐ 6): bật renderer.shadowMap như bức bật lúc dựng. AnalyticLightNode.setupShadow thoát ngay khi cờ đó tắt: không bật
 *   thì đèn có node bóng tự viết dịch như không có bóng.
 *   lights (GĐ 6, mặc định = shadows): nạp các đèn đang hiện của scene vào LightsNode, như RenderList làm lúc vẽ
 *   (`lightsNode.setLights`). Không nạp thì shader không có đèn nào: chỉ kiểm node của bức, không kiểm mô hình chiếu sáng.
 * @returns {{ vertexShader: string, fragmentShader: string, outputs: number, problems: string[] }}
 */
export function compileMaterial(object, { scene, camera }, backend, { pass = 'scene', shadows = false, lights = shadows } = {}) {
  if (!PASSES[pass]) throw new Error(`compileMaterial: không có lượt vẽ "${pass}" (chỉ có ${Object.keys(PASSES).join(', ')})`);
  const renderer = new WebGPURenderer({ forceWebGL: backend === 'webgl2', canvas: { style: {} } });
  // Chưa init() thì hỏi tính năng là three ném lỗi, còn capabilities của WebGL2 chưa có. Dịch thử không cần tính năng nào;
  // InstancedMesh chỉ hỏi giới hạn uniform buffer để chọn chỗ đặt ma trận (uniform buffer hay thuộc tính).
  renderer.hasFeature = () => false;
  renderer.shadowMap.enabled = shadows;
  const capabilities = renderer.backend.capabilities ?? (renderer.backend.capabilities = {});
  capabilities.getUniformBufferLimit = () => UNIFORM_BUFFER_LIMIT[backend];
  // three chỉ áp MRT của renderer (và mrtNode của material) khi đang vẽ vào một render target (NodeMaterial.setup của
  // r186). Không đặt target là dịch biến thể vẽ thẳng ra canvas: một đầu ra, bỏ qua mrtNode, mà cảnh không bao giờ vẽ
  // như thế. setRenderTarget chỉ ghi lại target (chưa cấp phát gì trên GPU), nên chưa init() vẫn dùng được.
  const { target, mrt } = PASSES[pass]();
  renderer.setRenderTarget(target);
  renderer.setMRT(mrt);
  const builder = renderer.backend.createNodeBuilder(object, renderer);
  Object.assign(builder, {
    scene,
    camera,
    material: object.material,
    lightsNode: renderer.lighting.getNode(scene).setLights(lights ? lightsOf(scene) : []),
    environmentNode: null,
    fogNode: scene.fogNode ?? null,
    clippingContext: null,
  });
  builder.context.material = object.material;
  const problems = [];
  const saved = { error: console.error, warn: console.warn };
  console.error = (...args) => problems.push(args.map(String).join(' '));
  console.warn = console.error;
  try {
    builder.build();
  } finally {
    Object.assign(console, saved);
  }
  const { vertexShader, fragmentShader } = builder;
  return { vertexShader, fragmentShader, outputs: countOutputs(fragmentShader), problems };
}

/** Các đèn đang hiện trong scene, như RenderList gom lúc vẽ. */
function lightsOf(scene) {
  const found = [];
  scene.traverseVisible((o) => { if (o.isLight) found.push(o); });
  return found;
}

/**
 * Số ảnh mà fragment shader ghi ra: số thành viên @location của struct đầu ra (WGSL), hay số `layout( location = N ) out`
 * (GLSL). Scene pass ghi 2 ảnh (output, emissive); ảnh phản chiếu 1. WGSL ra 0 là shader hỏng: struct rỗng
 * ("structures must have at least one member"), còn GLSL vẫn khai một đầu ra mà không ghi gì vào đó.
 * @param {string} fragmentShader
 */
function countOutputs(fragmentShader) {
  const struct = /struct Output\w* \{([^}]*)\}/.exec(fragmentShader);
  if (struct) return (struct[1].match(/@location\(/g) ?? []).length;
  return (fragmentShader.match(/layout\( location = \d+ \) out /g) ?? []).length;
}
