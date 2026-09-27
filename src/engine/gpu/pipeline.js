// engine/gpu/pipeline.js — scene pass + MRT (output, emissive); nối post của các lớp: build → renderOutput → display; alpha luôn 1.
import { RenderPipeline, BlendMode, MaterialBlending, NoToneMapping } from 'three/webgpu';
import { pass, mrt, output, emissive, vec4, renderOutput } from 'three/tsl';

/**
 * Nối post của các lớp thành MỘT đồ thị node. Gọi một lần khi dựng pipeline:
 *
 *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → vec4(rgb, 1)
 *
 * - build nhận HDR tuyến tính (bloom, tone mapping). Tone mapping là việc của lớp Phủ bóng, viết bằng node,
 *   nên renderOutput chỉ đổi không gian màu tuyến tính → sRGB (NoToneMapping), không tone map lần nữa.
 * - display nhận màu hiển thị sRGB (LUT, grain, vignette, FXAA: GĐ 4).
 * - Kết quả luôn có alpha = 1: canvas mặc định có alpha, và renderOutput "bỏ nhân trước" alpha;
 *   chỗ nào alpha 0 sẽ ra vec4(0), tức trong suốt, và poster phía sau lộ ra (luật 3: không bao giờ trong suốt).
 *
 * @param {{ color: any, channel: (name: string) => any, layers: { id: string, layer: object }[], weight: (id: string) => any }} input
 */
export function buildOutputNode({ color, channel, layers, weight }) {
  let c = color;
  for (const { id, layer } of layers) {
    if (layer.post?.build) c = layer.post.build({ color: c, channel, weight: weight(id) });
  }
  c = renderOutput(c, NoToneMapping);
  for (const { id, layer } of layers) {
    if (layer.post?.display) c = layer.post.display({ color: c, channel, weight: weight(id) });
  }
  return vec4(c.rgb, 1);
}

/**
 * Dựng pipeline hậu kỳ của cảnh.
 * @param {{ renderer: any, scene: any, camera: any, layers: { id: string, layer: object }[], weight: (id: string) => any }} options
 * @returns {{ scenePass: any, renderPipeline: any, render: () => void, compile: () => Promise<void>, views: () => { id: string, label: string, ready: boolean }[], dispose: () => void }}
 */
export function createPipeline({ renderer, scene, camera, layers, weight }) {
  const scenePass = pass(scene, camera);

  // MRT: một lần vẽ scene ghi HAI ảnh: màu đã chiếu sáng (output) và riêng phần tự phát sáng (emissive).
  // Bloom chỉ đọc ảnh emissive, nên chỉ thứ có emissive mới tỏa sáng (bloom chọn lọc).
  const passMRT = mrt({ output, emissive: vec4(emissive, output.a) });
  // Target MRT khác 'output' mặc định KHÔNG blend: các sprite cộng dồn (AdditiveBlending) sẽ đè lên nhau
  // trong ảnh emissive. MaterialBlending cho target này dùng đúng blend của material.
  passMRT.setBlendMode('emissive', new BlendMode(MaterialBlending));
  scenePass.setMRT(passMRT);

  const channel = (name) => {
    if (name === 'output' || name === 'emissive') return scenePass.getTextureNode(name);
    if (name === 'depth') return scenePass.getLinearDepthNode();
    throw new Error(`Pipeline không có kênh "${name}"`);
  };

  const renderPipeline = new RenderPipeline(renderer);
  // renderOutput đã nằm sẵn trong đồ thị (buildOutputNode), nên tắt bước three tự thêm ở cuối.
  renderPipeline.outputColorTransform = false;
  renderPipeline.outputNode = buildOutputNode({ color: channel('output'), channel, layers, weight });

  return {
    scenePass,
    // Lộ renderPipeline ra ngoài để test canh giữ outputColorTransform === false: nếu dòng đó
    // bị xóa, RenderPipeline sẽ tự renderOutput() thêm một lần nữa bằng renderer.toneMapping/
    // outputColorSpace lúc render() thật, tô màu tuyến tính → sRGB hai lần trên outputNode đã sRGB.
    renderPipeline,
    render: () => renderPipeline.render(),
    // Biên dịch trước với ĐÚNG render target + MRT của pass. renderer.compileAsync(scene, camera)
    // thì biên dịch cho canvas, không có MRT, nên khung đầu vẫn phải biên dịch lại.
    compile: () => scenePass.compileAsync(renderer),
    views: () => [{ id: 'final', label: 'final', ready: true }],
    dispose: () => {
      renderPipeline.dispose();
      scenePass.dispose();
    },
  };
}
