// tests/helpers/final-pass.js — dựng ảnh cuối của RenderPipeline như three dựng lượt cuối (chặng setup, WGSLNodeBuilder thật, không GPU).
import { HalfFloatType, NodeMaterial, QuadMesh, WGSLNodeBuilder, WebGPUCoordinateSystem } from 'three/webgpu';

/** Renderer giả: chỉ những gì chặng setup đọc (kiểu buffer, số mẫu, hệ tọa độ, chẩn đoán); không vẽ gì. */
function setupRenderer() {
  return {
    backend: { compatibilityMode: false, hasFeature: () => false, utils: { getTextureSampleData: () => ({ primarySamples: 1 }) } },
    debug: { diagnostics: { keywords: false } },
    coordinateSystem: WebGPUCoordinateSystem,
    samples: 0,
    hasFeature: () => false,
    getOutputBufferType: () => HalfFloatType,
    getColorBufferType: () => HalfFloatType,
  };
}

/**
 * Dựng outputNode ở chặng setup, như NodeBuilder.build() dựng fragment của quad cuối, rồi lập danh sách updateBefore đúng cách
 * three lập (buildUpdateNodes). Mỗi khung three gọi updateBefore theo đúng thứ tự của danh sách này.
 * @param {any} outputNode   renderPipeline.outputNode
 * @returns {{ updateBefore: any[], stack: any }}   stack: thân Fn của ảnh cuối (views.js) sau khi dựng; null nếu không phải Fn
 */
export function buildFinalPass(outputNode) {
  const quad = new QuadMesh(new NodeMaterial());
  quad.material.fragmentNode = outputNode;
  const builder = new WGSLNodeBuilder(quad, setupRenderer());
  builder.setBuildStage('setup');
  builder.setShaderStage('fragment');
  builder.addStack(); // addStack đặt stack hiện tại của TSL (biến toàn cục): finally ở dưới trả lại, không rò sang test sau
  try {
    outputNode.build(builder);
    builder.buildUpdateNodes();
    // three r186: Fn(…)() trả VarNode "intent" bọc ShaderCallNodeInternal. Thân Fn chỉ chạy lúc dựng; stack của nó được giữ lại
    // (getOutputNode trả bản đã dựng).
    const call = outputNode.isVarNode && outputNode.intent ? outputNode.node : outputNode;
    const stack = call.isShaderCallNodeInternal ? call.getOutputNode(builder) : null;
    return { updateBefore: [...builder.updateBeforeNodes], stack };
  } finally {
    // Dựng hỏng (ném lỗi) cũng phải trả. Một removeStack chưa đủ: Fn ném lỗi giữa chừng thì addStack của chính nó (setupOutput)
    // chưa được trả, nên trả hết mọi stack của builder này, về đúng stack trước khi dựng.
    while (builder.stacks.length > 0) builder.removeStack();
  }
}
