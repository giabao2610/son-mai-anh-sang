// engine/gpu/pipeline.js — scene pass + MRT (output, emissive; normal khi cần); nối post của các lớp: build → renderOutput → display → overlay; alpha luôn 1; GĐ 8: độ sâu tuyến tính theo loại camera.
import { RenderPipeline, BlendMode, MaterialBlending, NoToneMapping } from 'three/webgpu';
import { pass, mrt, output, emissive, normalView, packNormalToRGB, vec4, renderOutput } from 'three/tsl';
import { createViews } from './views.js';
import { createHold } from './hold.js';

/**
 * Nối post của các lớp thành MỘT đồ thị node. Gọi một lần khi dựng pipeline:
 *
 *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp   (= ảnh cuối)
 *
 * - build nhận HDR tuyến tính (bloom, tone mapping). Tone mapping là việc của lớp Phủ bóng, viết bằng node,
 *   nên renderOutput chỉ đổi không gian màu tuyến tính → sRGB (NoToneMapping), không tone map lần nữa.
 * - display nhận màu hiển thị sRGB (LUT, grain, vignette, FXAA: GĐ 4).
 * - tap(tapId, node) (GĐ 4): lớp chụp một bước giữa chừng thành view '<layerId>:<tapId>' cho công cụ học. Ghi vào `taps`
 *   theo thứ tự gặp; `linear` cho biết node còn tuyến tính (chụp ở build) hay đã là màu hiển thị (chụp ở display).
 *
 * @param {{ color: any, channel: (name: string) => any, layers: { id: string, layer: object }[], weight: (id: string) => any,
 *   taps?: { layerId: string, tapId: string, node: any, linear: boolean }[] }} input
 * @returns {any} ảnh cuối ở không gian hiển thị, CHƯA có overlay của công cụ (views.js ghép, rồi vec4(rgb, 1))
 */
export function buildFinalNode({ color, channel, layers, weight, taps = [] }) {
  const tapFor = (layerId, linear) => (tapId, node) => taps.push({ layerId, tapId, node, linear });
  let c = color;
  for (const { id, layer } of layers) {
    if (layer.post?.build) c = layer.post.build({ color: c, channel, weight: weight(id), tap: tapFor(id, true) });
  }
  c = renderOutput(c, NoToneMapping);
  for (const { id, layer } of layers) {
    if (layer.post?.display) c = layer.post.display({ color: c, channel, weight: weight(id), tap: tapFor(id, false) });
  }
  return c;
}

/**
 * MRT của scene pass: một lần vẽ scene ghi nhiều ảnh. `output`: màu đã chiếu sáng; `emissive`: riêng phần tự phát sáng
 * (bloom chỉ đọc ảnh này, nên chỉ thứ có emissive mới tỏa: bloom chọn lọc); `normal` (GĐ 4, chỉ khi công cụ cần):
 * pháp tuyến trong không gian camera, nén về [0, 1] bằng packNormalToRGB để ghi được vào ảnh.
 * Target MRT khác 'output' mặc định KHÔNG blend: các sprite cộng dồn (AdditiveBlending) sẽ đè lên nhau trong ảnh
 * emissive. MaterialBlending cho target này dùng đúng blend của material. Dựng MRT mới thì phải đặt lại blend.
 * @param {{ normal?: boolean }} [options]
 */
export function makeMRT({ normal = false } = {}) {
  const outputs = { output, emissive: vec4(emissive, output.a) };
  if (normal) outputs.normal = vec4(packNormalToRGB(normalView), 1);
  const passMRT = mrt(outputs);
  passMRT.setBlendMode('emissive', new BlendMode(MaterialBlending));
  return passMRT;
}

/**
 * Độ sâu tuyến tính [0, 1] (0 ở near, 1 ở far) của scene pass, đúng cho loại camera của sân khấu.
 * - Camera phối cảnh: getLinearDepthNode() như cũ (ba bức đầu không đổi node nào).
 * - Camera trực giao: three luôn đổi texture độ sâu bằng công thức phối cảnh (PassNode.getViewZNode, Phụ lục A.89), nên mọi điểm dồn
 *   về sát 0 và view Depth thành một bóng trắng. Texture độ sâu của camera trực giao đã tuyến tính ở cả hai backend (A.90): dùng thẳng.
 * Chọn bằng JS lúc dựng pipeline: trong post, camera của TSL là camera vẽ quad, không phải camera của cảnh (A.93).
 * @param {any} scenePass
 * @param {any} camera   camera của sân khấu
 */
export function linearDepth(scenePass, camera) {
  return camera.isOrthographicCamera ? scenePass.getTextureNode('depth') : scenePass.getLinearDepthNode();
}

/**
 * Dựng pipeline hậu kỳ của cảnh.
 * @param {{ renderer: any, scene: any, camera: any, layers: { id: string, layer: object }[], weight: (id: string) => any,
 *   hold?: ReturnType<typeof createHold> }} options   hold: bộ giữ khung của cảnh (GĐ 9); thiếu thì pipeline tự giữ riêng
 * @returns {{ scenePass: any, renderPipeline: any, views: ReturnType<typeof createViews>, render: () => void,
 *   compile: () => Promise<void>, dispose: () => void }}
 */
export function createPipeline({ renderer, scene, camera, layers, weight, hold = createHold() }) {
  const scenePass = pass(scene, camera);
  scenePass.setMRT(makeMRT());
  const depth = linearDepth(scenePass, camera); // channel('depth') và view Depth cùng dùng node này

  const channel = (name) => {
    if (name === 'output' || name === 'emissive') return scenePass.getTextureNode(name);
    if (name === 'depth') return depth;
    throw new Error(`Pipeline không có kênh "${name}"`);
  };

  const renderPipeline = new RenderPipeline(renderer);
  // renderOutput đã nằm sẵn trong đồ thị (buildFinalNode), nên tắt bước three tự thêm ở cuối.
  renderPipeline.outputColorTransform = false;
  // Biên dịch trước với ĐÚNG render target + MRT của pass. renderer.compileAsync(scene, camera)
  // thì biên dịch cho canvas, không có MRT, nên khung đầu vẫn phải biên dịch lại.
  // GĐ 9: `scenePass.compileAsync` giữ target + MRT của pass suốt lần chờ, mà vòng lặp vẫn vẽ trong lúc đó (view Normal lúc cảnh đang chạy,
  // Phụ lục A.105): biên dịch trong lúc giữ khung.
  const compile = () => hold.run(() => scenePass.compileAsync(renderer));
  const taps = [];
  const final = buildFinalNode({ color: channel('output'), channel, layers, weight, taps });
  const views = createViews({ scenePass, renderPipeline, mrtFor: makeMRT, final, taps, compile, depth });
  views.setOverlays([]); // chưa có công cụ: ảnh cuối → vec4(rgb, 1)

  return {
    scenePass,
    // Lộ renderPipeline ra ngoài để test canh giữ outputColorTransform === false: nếu dòng đó
    // bị xóa, RenderPipeline sẽ tự renderOutput() thêm một lần nữa bằng renderer.toneMapping/
    // outputColorSpace lúc render() thật, tô màu tuyến tính → sRGB hai lần trên outputNode đã sRGB.
    renderPipeline,
    views,
    render: () => renderPipeline.render(),
    compile,
    dispose: () => {
      renderPipeline.dispose();
      scenePass.dispose();
    },
  };
}
