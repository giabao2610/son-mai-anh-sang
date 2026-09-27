import { describe, expect, it, vi } from 'vitest';
import {
  SOFTWARE_RENDERER, detectTier, envFromWindow, isSoftwareAdapterInfo, probeWebGL2, probeWebGPU,
} from '../../src/engine/tier.js';

// Chuỗi thật đo trên Chromium 153 headless (xem Phụ lục A.13 của spec).
const SWIFTSHADER_GL = 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)';
const APPLE_GL = 'ANGLE (Apple, ANGLE Metal Renderer: Apple M2, Unspecified Version)';
const HARDWARE_ADAPTER = { info: { vendor: 'apple', architecture: 'metal-3', device: '', description: '', isFallbackAdapter: false } };
const SWIFTSHADER_ADAPTER = { info: { vendor: 'google', architecture: 'swiftshader', device: '', description: '', isFallbackAdapter: true } };
const UNMASKED_RENDERER_WEBGL = 0x9246;

/** WebGL2 context giả: renderer = chuỗi tên GPU; debugExt = false khi trình duyệt giấu tên GPU. */
function fakeGl(renderer, { debugExt = true, throwOnParameter = false } = {}) {
  const lose = { loseContext: vi.fn() };
  return {
    lose,
    getExtension: vi.fn((name) => {
      if (name === 'WEBGL_debug_renderer_info') return debugExt ? { UNMASKED_RENDERER_WEBGL } : null;
      if (name === 'WEBGL_lose_context') return lose;
      return null;
    }),
    getParameter: vi.fn((p) => {
      if (throwOnParameter) throw new Error('context lost');
      return p === UNMASKED_RENDERER_WEBGL ? renderer : null;
    }),
  };
}

/** env giả thay cho window: adapter = kết quả requestAdapter; gl = kết quả getContext('webgl2'). */
function fakeEnv({ secure = true, gpu = true, adapter = null, adapterError = null, gl = null, canvasError = null } = {}) {
  const canvas = { getContext: vi.fn(() => gl) };
  return {
    canvas,
    isSecureContext: secure,
    gpu: gpu ? { requestAdapter: vi.fn(async () => { if (adapterError) throw adapterError; return adapter; }) } : undefined,
    createCanvas: vi.fn(() => { if (canvasError) throw canvasError; return canvas; }),
  };
}

const NO_FLAGS = { static: false, webgl: false, force3d: false };

describe('nhận dạng GPU phần mềm', () => {
  it('adapter fallback hoặc kiến trúc swiftshader là phần mềm', () => {
    expect(isSoftwareAdapterInfo(SWIFTSHADER_ADAPTER.info)).toBe(true);
    expect(isSoftwareAdapterInfo({ isFallbackAdapter: true })).toBe(true);
    expect(isSoftwareAdapterInfo({ architecture: 'swiftshader' })).toBe(true);
    expect(isSoftwareAdapterInfo({ vendor: 'Google', description: 'SwiftShader Device' })).toBe(true);
    expect(isSoftwareAdapterInfo(HARDWARE_ADAPTER.info)).toBe(false);
    expect(isSoftwareAdapterInfo()).toBe(false);
  });

  it('tên renderer WebGL2 của máy ảo/phần mềm khớp SOFTWARE_RENDERER', () => {
    for (const name of [SWIFTSHADER_GL, 'llvmpipe (LLVM 15.0.7, 256 bits)', 'Microsoft Basic Render Driver', 'Software Rasterizer']) {
      expect(SOFTWARE_RENDERER.test(name), name).toBe(true);
    }
    expect(SOFTWARE_RENDERER.test(APPLE_GL)).toBe(false);
  });
});

describe('probeWebGPU', () => {
  it('adapter phần cứng → hardware; xin adapter giống three ({ featureLevel: "compatibility" })', async () => {
    const env = fakeEnv({ adapter: HARDWARE_ADAPTER });
    expect(await probeWebGPU(env)).toBe('hardware');
    expect(env.gpu.requestAdapter).toHaveBeenCalledWith({ featureLevel: 'compatibility' });
  });

  it('adapter SwiftShader (fallback) → software', async () => {
    expect(await probeWebGPU(fakeEnv({ adapter: SWIFTSHADER_ADAPTER }))).toBe('software');
  });

  it('không có navigator.gpu, adapter null, không phải secure context → none', async () => {
    expect(await probeWebGPU(fakeEnv({ gpu: false }))).toBe('none');
    expect(await probeWebGPU(fakeEnv({ adapter: null }))).toBe('none');
    const insecure = fakeEnv({ secure: false, adapter: HARDWARE_ADAPTER });
    expect(await probeWebGPU(insecure)).toBe('none');
    expect(insecure.gpu.requestAdapter).not.toHaveBeenCalled();
  });

  it('requestAdapter ném lỗi → none (không ném ra ngoài)', async () => {
    expect(await probeWebGPU(fakeEnv({ adapterError: new Error('GPU process crashed') }))).toBe('none');
  });
});

describe('probeWebGL2', () => {
  it('GPU thật → hardware; mặc định xin failIfMajorPerformanceCaveat: true; luôn trả context dò', () => {
    const gl = fakeGl(APPLE_GL);
    const env = fakeEnv({ gl });
    expect(probeWebGL2(env)).toBe('hardware');
    expect(env.canvas.getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: true });
    expect(gl.lose.loseContext).toHaveBeenCalledTimes(1);
  });

  it('renderer SwiftShader → software (failIfMajorPerformanceCaveat không chặn được SwiftShader)', () => {
    expect(probeWebGL2(fakeEnv({ gl: fakeGl(SWIFTSHADER_GL) }))).toBe('software');
  });

  it('allowSoftware = true thì bỏ failIfMajorPerformanceCaveat', () => {
    const env = fakeEnv({ gl: fakeGl(SWIFTSHADER_GL) });
    probeWebGL2(env, true);
    expect(env.canvas.getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: false });
  });

  it('trình duyệt giấu tên GPU (không có WEBGL_debug_renderer_info) → hardware', () => {
    expect(probeWebGL2(fakeEnv({ gl: fakeGl('', { debugExt: false }) }))).toBe('hardware');
  });

  it('không có context, createCanvas ném lỗi, getParameter ném lỗi → none', () => {
    expect(probeWebGL2(fakeEnv({ gl: null }))).toBe('none');
    expect(probeWebGL2(fakeEnv({ canvasError: new Error('no document') }))).toBe('none');
    const gl = fakeGl(APPLE_GL, { throwOnParameter: true });
    expect(probeWebGL2(fakeEnv({ gl }))).toBe('none');
    expect(gl.lose.loseContext).toHaveBeenCalledTimes(1);
  });
});

describe('detectTier', () => {
  it('WebGPU phần cứng → webgpu', async () => {
    expect(await detectTier(NO_FLAGS, fakeEnv({ adapter: HARDWARE_ADAPTER, gl: fakeGl(APPLE_GL) }))).toBe('webgpu');
  });

  it('không có WebGPU, WebGL2 phần cứng → webgl2', async () => {
    expect(await detectTier(NO_FLAGS, fakeEnv({ gpu: false, gl: fakeGl(APPLE_GL) }))).toBe('webgl2');
    expect(await detectTier(NO_FLAGS, fakeEnv({ adapter: null, gl: fakeGl(APPLE_GL) }))).toBe('webgl2');
  });

  it('adapter fallback + WebGL2 SwiftShader (máy không có GPU) → static', async () => {
    expect(await detectTier(NO_FLAGS, fakeEnv({ adapter: SWIFTSHADER_ADAPTER, gl: fakeGl(SWIFTSHADER_GL) }))).toBe('static');
  });

  it('không phải secure context: bỏ WebGPU, vẫn thử WebGL2', async () => {
    expect(await detectTier(NO_FLAGS, fakeEnv({ secure: false, adapter: HARDWARE_ADAPTER, gl: fakeGl(APPLE_GL) }))).toBe('webgl2');
  });

  it('một phép dò ném lỗi thì chỉ phép dò đó thất bại', async () => {
    expect(await detectTier(NO_FLAGS, fakeEnv({ adapterError: new Error('boom'), gl: fakeGl(APPLE_GL) }))).toBe('webgl2');
    expect(await detectTier(NO_FLAGS, fakeEnv({ adapterError: new Error('boom'), canvasError: new Error('boom') }))).toBe('static');
  });

  it('không bao giờ ném lỗi, kể cả khi env hỏng', async () => {
    await expect(detectTier(NO_FLAGS, {})).resolves.toBe('static');
    await expect(detectTier(undefined, undefined)).resolves.toBe('static');
  });

  it('?static → static, không dò gì cả', async () => {
    const env = fakeEnv({ adapter: HARDWARE_ADAPTER, gl: fakeGl(APPLE_GL) });
    expect(await detectTier({ ...NO_FLAGS, static: true }, env)).toBe('static');
    expect(env.gpu.requestAdapter).not.toHaveBeenCalled();
    expect(env.createCanvas).not.toHaveBeenCalled();
  });

  it('?webgl → bỏ qua WebGPU dù có adapter phần cứng', async () => {
    const env = fakeEnv({ adapter: HARDWARE_ADAPTER, gl: fakeGl(APPLE_GL) });
    expect(await detectTier({ ...NO_FLAGS, webgl: true }, env)).toBe('webgl2');
    expect(env.gpu.requestAdapter).not.toHaveBeenCalled();
  });

  it('?force3d nhận GPU phần mềm (để e2e chạy trên SwiftShader)', async () => {
    const force3d = { ...NO_FLAGS, force3d: true };
    expect(await detectTier(force3d, fakeEnv({ adapter: SWIFTSHADER_ADAPTER, gl: fakeGl(SWIFTSHADER_GL) }))).toBe('webgpu');
    const env = fakeEnv({ adapter: null, gl: fakeGl(SWIFTSHADER_GL) });
    expect(await detectTier(force3d, env)).toBe('webgl2');
    expect(env.canvas.getContext).toHaveBeenCalledWith('webgl2', { failIfMajorPerformanceCaveat: false });
    expect(await detectTier({ ...force3d, webgl: true }, fakeEnv({ adapter: SWIFTSHADER_ADAPTER, gl: fakeGl(SWIFTSHADER_GL) }))).toBe('webgl2');
  });
});

describe('envFromWindow', () => {
  it('lấy isSecureContext, navigator.gpu và một hàm tạo canvas từ window', () => {
    const canvas = {};
    const win = {
      isSecureContext: true,
      navigator: { gpu: { requestAdapter() {} } },
      document: { createElement: vi.fn(() => canvas) },
    };
    const env = envFromWindow(win);
    expect(env.isSecureContext).toBe(true);
    expect(env.gpu).toBe(win.navigator.gpu);
    expect(env.createCanvas()).toBe(canvas);
    expect(win.document.createElement).toHaveBeenCalledWith('canvas');
  });
});
