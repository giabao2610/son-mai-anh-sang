// vitest.config.js — Cấu hình Vitest: dùng lại vite.config.js, chạy test trong Node, chỉ gom tests/**/*.test.js.
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Hàm thuần (âm lịch, bảng màu, dò tầng…) chạy trong Node cho nhanh.
      // File nào cần DOM thì ghi `// @vitest-environment jsdom` ở dòng 1.
      environment: 'node',
      // Thiếu dòng này, Vitest 5 gom luôn cả e2e/*.spec.js của Playwright.
      include: ['tests/**/*.test.js'],
    },
  }),
);
