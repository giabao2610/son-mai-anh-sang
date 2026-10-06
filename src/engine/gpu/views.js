// engine/gpu/views.js — các view mà công cụ học nhìn được (ảnh cuối, tap của lớp, emissive, normal lười, depth), ghép overlay của công cụ, requireView.
import { NoToneMapping } from 'three/webgpu';
import { Fn, oneMinus, pow, renderOutput, vec3, vec4 } from 'three/tsl';

/** View của xưởng, bức nào cũng có (nhãn ở t.views). Tap của lớp có id '<layerId>:<tapId>'. */
export const BUILTIN_VIEWS = Object.freeze(['final', 'emissive', 'normal', 'depth']);
/** Normal chưa có trong MRT: một màu phẳng "mặt quay về camera" giữ chỗ, không đụng tới texture chưa tồn tại. */
const NORMAL_PLACEHOLDER = vec4(0.5, 0.5, 1, 1);
/** Độ sâu tuyến tính (0 ở mắt, 1 ở far = 500) nén lại cho dễ nhìn: gần sáng, xa tối, trời gần như đen. */
const DEPTH_CURVE = 8;

/**
 * Danh sách view của MỘT pipeline, và nơi ghép overlay của công cụ lên ảnh cuối (spec §7).
 * Mọi view trả node ở KHÔNG GIAN HIỂN THỊ: view tuyến tính (tap của chặng build, emissive) đi qua
 * renderOutput(…, NoToneMapping) như ảnh cuối, nên công cụ trộn thẳng với ảnh cuối được.
 *
 * Overlay chạy ở lượt vẽ CUỐI (sau FXAA của Phủ bóng), nên mỗi view phải là biểu thức tính lại được tại điểm ảnh ấy:
 * texture của scene pass, texture của bloom, uniform. Vì vậy tap là biểu thức thuần, không phải biến .toVar() trong Fn.
 *
 * @param {object} p
 * @param {any} p.scenePass
 * @param {any} p.renderPipeline
 * @param {(options: { normal: boolean }) => any} p.mrtFor   MRT mới của scene pass (pipeline.js), có blend của emissive
 * @param {any} p.final   ảnh cuối (không gian hiển thị), chưa có overlay; KHÔNG bao giờ dựng lại
 * @param {{ layerId: string, tapId: string, node: any, linear: boolean }[]} p.taps   theo thứ tự trong pipeline
 * @param {() => Promise<void>} p.compile   biên dịch trước (scenePass.compileAsync)
 * @param {any} [p.depth]   (GĐ 8) độ sâu tuyến tính của pipeline (pipeline.js#linearDepth); thiếu thì như camera phối cảnh
 */
export function createViews({ scenePass, renderPipeline, mrtFor, final, taps, compile, depth = scenePass.getLinearDepthNode() }) {
  let normal = false; // MRT đã có kênh normal chưa
  let normalReady = false; // đã biên dịch xong biến thể có normal: list() chỉ báo Normal sẵn sàng từ lúc này
  let compiling = null; // lần biên dịch đang chạy: mọi lần require('normal') trong lúc đó cùng chờ nó
  let overlays = []; // [{ id, fn }] của các công cụ, theo thứ tự ghép

  const tapOf = new Map(taps.map((tap) => [`${tap.layerId}:${tap.tapId}`, tap]));

  /** Node ở không gian hiển thị của một view. Id lạ thì ném lỗi (công cụ viết sai id). */
  const node = (id) => {
    if (id === 'final') return final;
    if (id === 'emissive') return renderOutput(scenePass.getTextureNode('emissive'), NoToneMapping);
    if (id === 'normal') return normal ? scenePass.getTextureNode('normal') : NORMAL_PLACEHOLDER;
    if (id === 'depth') return vec4(vec3(pow(oneMinus(depth), DEPTH_CURVE)), 1);
    const tap = tapOf.get(id);
    if (!tap) throw new Error(`Không có view "${id}"`);
    return tap.linear ? renderOutput(tap.node, NoToneMapping) : tap.node;
  };

  /**
   * Ảnh cuối → overlay của từng công cụ → vec4(rgb, 1), scene pass đứng đầu, rồi báo pipeline dựng lại đồ thị. Không gọi lại build/display
   * của lớp nào: bloom và FXAA giữ nguyên. Overlay ném lỗi thì bỏ đúng công cụ đó (spec §9); trả id các công cụ bị bỏ.
   */
  const compose = () => {
    let c = final;
    const broken = [];
    for (const o of overlays) {
      try {
        c = o.fn(c, node);
      } catch (err) {
        console.warn(`Công cụ "${o.id}" ghép overlay không được, bỏ công cụ này:`, err);
        broken.push(o.id);
      }
    }
    overlays = overlays.filter((o) => !broken.includes(o.id));
    // Scene pass vẽ ĐẦU TIÊN trong lượt cuối (Phụ lục A.53), để móc lần vẽ của Từng sợi (draws.js) thấy lượt vẽ cảnh. three gọi
    // updateBefore theo thứ tự node dựng xong, con trước cha; RTT của FXAA nằm sâu trong c nên tới lượt trước, mà RTT gỡ móc
    // (resetRendererState) rồi vẽ quad của nó, và chính quad ấy vẽ scene pass lần đầu trong khung. scenePass.toVar() ở đầu Fn
    // được dựng trước c. Không ai đọc biến này nên shader không có thêm dòng nào: lúc sinh code, StackNode bỏ qua biến chỉ có
    // chính stack làm cha (WGSL và GLSL y hệt khi không có biến; Phụ lục A.60).
    // Alpha luôn 1: canvas có alpha, và renderOutput "bỏ nhân trước" alpha; chỗ nào alpha 0 sẽ trong suốt (luật 3).
    renderPipeline.outputNode = Fn(() => {
      scenePass.toVar();
      return vec4(c.rgb, 1);
    })();
    renderPipeline.needsUpdate = true;
    return broken;
  };

  return {
    /** Thứ tự như Lột lớp (spec §7): ảnh cuối, tap theo thứ tự NGƯỢC pipeline, emissive, normal, depth. */
    list: () => [
      { id: 'final', ready: true },
      ...[...taps].reverse().map(({ layerId, tapId }) => ({ id: `${layerId}:${tapId}`, ready: true, layerId, tapId })),
      { id: 'emissive', ready: true },
      { id: 'normal', ready: normalReady },
      { id: 'depth', ready: true },
    ],
    node,
    /** Ghép overlay của các công cụ (toolbox.js gọi một lần sau khi gắn công cụ). Trả id các công cụ ghép hỏng. */
    setOverlays(entries) {
      overlays = [...entries];
      return compose();
    },
    /**
     * Bảo đảm một view sẵn sàng. Chỉ Normal cần việc: thêm kênh normal vào MRT của scene pass (MRT nằm trong cache key
     * của material, nên mọi material biên dịch lại MỘT lần), ghép lại overlay trên chuỗi post cũ, rồi biên dịch trước.
     * Gọi lại trong lúc đang biên dịch thì chờ cùng lần đó. Biên dịch hỏng thì MRT giữ nguyên (render target đã có texture
     * thứ ba, gỡ kênh ra là vỡ: Phụ lục A.44), Normal chưa sẵn sàng, và lần gọi sau biên dịch lại.
     */
    require(id) {
      if (id !== 'normal' || normalReady) return Promise.resolve();
      if (!normal) {
        scenePass.setMRT(mrtFor({ normal: true }));
        normal = true;
        compose();
      }
      compiling ??= compile()
        .then(() => {
          normalReady = true;
        })
        .finally(() => {
          compiling = null;
        });
      return compiling;
    },
  };
}
