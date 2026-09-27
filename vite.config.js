// vite.config.js — cấu hình Vite: base cho GitHub Pages, mỗi dòng registry là một trang HTML, tách riêng chunk three.
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { paintings } from './src/paintings/registry.js';

const root = import.meta.dirname;

export default defineConfig({
  base: '/son-mai-anh-sang/',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      // Registry chỉ import meta.js (dữ liệu thuần) nên Node đọc được ở đây. Khóa = slug của bức.
      input: Object.fromEntries(paintings.map((p) => [p.meta.slug, resolve(root, p.page)])),
      output: {
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/]three[\\/]build[\\/]/ }],
        },
      },
    },
  },
});
