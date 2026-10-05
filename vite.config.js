// vite.config.js — cấu hình Vite: base cho GitHub Pages, mỗi dòng registry là một trang HTML, tách chunk three, plugin code sống.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { paintings } from './src/paintings/registry.js';
import { GALLERY_PAGE } from './scripts/pages.js';
import { codeView } from './plugins/vite-plugin-code-view.js';

const root = import.meta.dirname;

export default defineConfig({
  base: '/son-mai-anh-sang/',
  // import '…?code' → HTML đã tô màu bằng Shiki lúc build (Sổ tay, tab Chỉnh).
  plugins: [codeView()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      // Registry chỉ import meta.js (dữ liệu thuần) nên Node đọc được ở đây. Khóa = slug của bức; cộng Phòng tranh (GĐ 7).
      input: {
        ...Object.fromEntries(paintings.map((p) => [p.meta.slug, resolve(root, p.page)])),
        'phong-tranh': resolve(root, GALLERY_PAGE),
      },
      output: {
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]build[\\/]/ }],
        },
      },
    },
  },
});
