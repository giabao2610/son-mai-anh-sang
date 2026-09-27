// engine/tier.js — dò tầng A (WebGPU) / B (WebGL2) / C (tranh tĩnh); hàm thuần nhận env nên test được mà không cần GPU.

// Tên renderer WebGL của GPU phần mềm. failIfMajorPerformanceCaveat vẫn cho SwiftShader đi qua,
// nên chỉ phép so tên này mới bắt được máy không có GPU thật.
export const SOFTWARE_RENDERER = /SwiftShader|llvmpipe|Software|Basic Render/i;

/**
 * Adapter WebGPU có phải GPU phần mềm không. Trên Chromium, description và device thường là chuỗi rỗng,
 * nên phải nhìn isFallbackAdapter và architecture ('swiftshader').
 * @param {{ isFallbackAdapter?: boolean, architecture?: string, vendor?: string, description?: string }} [info]
 */
export function isSoftwareAdapterInfo(info = {}) {
  return info.isFallbackAdapter === true
    || /swiftshader/i.test([info.architecture, info.vendor, info.description].join(' '));
}

/**
 * Dò WebGPU. navigator.gpu chỉ có trong secure context (https, hoặc localhost).
 * @param {{ isSecureContext?: boolean, gpu?: any }} env
 * @returns {Promise<'hardware' | 'software' | 'none'>}
 */
export async function probeWebGPU(env) {
  try {
    if (!env.isSecureContext || !env.gpu) return 'none';
    // Xin adapter đúng như three xin (WebGPUBackend dùng featureLevel 'compatibility'), để kết quả dò khớp lúc chạy thật.
    const adapter = await env.gpu.requestAdapter({ featureLevel: 'compatibility' });
    if (!adapter) return 'none';
    return isSoftwareAdapterInfo(adapter.info ?? {}) ? 'software' : 'hardware';
  } catch {
    return 'none'; // phép dò ném lỗi = phép dò thất bại
  }
}

/**
 * Dò WebGL2 bằng một canvas tạm; dò xong thì trả context ngay (WEBGL_lose_context) để không giữ tài nguyên GPU.
 * @param {{ createCanvas: () => any }} env
 * @param {boolean} [allowSoftware]  true khi có ?force3d
 * @returns {'hardware' | 'software' | 'none'}
 */
export function probeWebGL2(env, allowSoftware = false) {
  let gl = null;
  try {
    gl = env.createCanvas().getContext('webgl2', { failIfMajorPerformanceCaveat: !allowSoftware });
    if (!gl) return 'none';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return 'hardware'; // trình duyệt giấu tên GPU: tin là GPU thật
    return SOFTWARE_RENDERER.test(String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))) ? 'software' : 'hardware';
  } catch {
    return 'none';
  } finally {
    try {
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // context đã mất sẵn: không còn gì để trả
    }
  }
}

/**
 * Chọn tầng theo thứ tự của spec §9. Không bao giờ ném lỗi: hỏng ở đâu thì tầng tĩnh.
 * @param {{ static?: boolean, webgl?: boolean, force3d?: boolean }} [flags]
 * @param {{ isSecureContext?: boolean, gpu?: any, createCanvas?: () => any }} [env]
 * @returns {Promise<'webgpu' | 'webgl2' | 'static'>}
 */
export async function detectTier(flags = {}, env = {}) {
  try {
    if (flags.static) return 'static';
    // ?force3d nhận cả GPU phần mềm, để e2e chạy được trên SwiftShader của CI.
    const usable = (probe) => probe === 'hardware' || (Boolean(flags.force3d) && probe === 'software');
    if (!flags.webgl && usable(await probeWebGPU(env))) return 'webgpu';
    if (usable(probeWebGL2(env, Boolean(flags.force3d)))) return 'webgl2';
  } catch {
    // rơi xuống tầng tĩnh
  }
  return 'static';
}

/**
 * env thật lấy từ window. Tách riêng để detectTier là hàm thuần.
 * @param {Window} win
 */
export function envFromWindow(win) {
  return {
    isSecureContext: win.isSecureContext,
    gpu: win.navigator.gpu,
    createCanvas: () => win.document.createElement('canvas'),
  };
}
