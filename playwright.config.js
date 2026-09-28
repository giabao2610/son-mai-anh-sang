// playwright.config.js — E2E trên bản build (vite preview): tĩnh, WebGL2 SwiftShader (cổng chặn), WebGPU SwiftShader.
import { defineConfig } from '@playwright/test';

const PORT = 4273;
// Phải khớp `base` của vite.config.js và kết thúc bằng '/': spec dùng page.goto('./?…') tương đối với URL này.
const BASE = `http://127.0.0.1:${PORT}/son-mai-anh-sang/`;
// SwiftShader = GPU phần mềm, giống nhau trên macOS và trên ubuntu-latest không có GPU.
const SWIFTSHADER = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  fullyParallel: false, // vẽ bằng CPU rất nặng: chạy tuần tự
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 60_000,
  use: {
    baseURL: BASE,
    viewport: { width: 640, height: 400 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Phục vụ dist/ đã build sẵn (`npm run e2e` build trước; CI chạy `npm run build` trước).
    command: `npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      // Không cờ GPU: WebGPU không có adapter, WebGL2 là SwiftShader → trang phải về tranh tĩnh.
      name: 'static',
      use: { browserName: 'chromium' },
      metadata: { kind: 'static' },
    },
    {
      // Tầng B trên SwiftShader. Đây là cổng chặn của CI.
      name: 'webgl2-swiftshader',
      use: { browserName: 'chromium', launchOptions: { args: SWIFTSHADER } },
      metadata: { kind: '3d', query: '?webgl&force3d', backend: 'webgl2' },
    },
    {
      // Tầng A trên adapter WebGPU phần mềm. Không chặn; spec tự bỏ qua nếu không có adapter.
      // Thiếu --use-angle=swiftshader thì canvas WebGPU hỏng ("Invalid Texture … CreateView").
      name: 'webgpu-swiftshader',
      // channel 'chromium' = trình duyệt Chromium đầy đủ ở chế độ headless mới, thay cho headless shell.
      // Trên ubuntu, headless shell làm mất device WebGPU ("A valid external Instance reference no longer exists").
      use: {
        browserName: 'chromium',
        channel: 'chromium',
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            ...SWIFTSHADER,
            // Chỉ trên CI (ubuntu): cho Dawn dùng SwiftShader qua Vulkan.
            ...(process.env.CI ? ['--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader'] : []),
          ],
        },
      },
      metadata: { kind: '3d', query: '?force3d', backend: 'webgpu' },
    },
    // Tùy chọn, chỉ chạy ở máy local: Chromium đầy đủ dùng GPU thật. Bật bằng E2E_REAL_GPU=1.
    ...(process.env.E2E_REAL_GPU
      ? [{
          name: 'webgpu-real-gpu',
          use: { browserName: 'chromium', channel: 'chromium' },
          metadata: { kind: '3d', query: '', backend: 'webgpu' },
        }]
      : []),
  ],
});
