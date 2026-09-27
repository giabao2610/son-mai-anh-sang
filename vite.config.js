// vite.config.js — Cấu hình Vite: base cho GitHub Pages, target es2022, tách three.js thành một chunk dùng chung.
import { defineConfig } from 'vite';

export default defineConfig({
  // Trang nằm ở https://giabao2610.github.io/son-mai-anh-sang/: Vite thêm base này vào mọi đường dẫn tuyệt đối.
  base: '/son-mai-anh-sang/',
  build: {
    // Trình duyệt nào có WebGPU/WebGL2 cũng hiểu ES2022; ghim lại để kích thước bundle không đổi khi nâng Vite.
    target: 'es2022',
    // Riêng three/webgpu đã khoảng 890 KB (chưa nén): nâng ngưỡng cảnh báo mặc định 500 KB, nhưng vẫn giữ một trần.
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Vite 8 đóng gói bằng Rolldown: codeSplitting.groups thay cho manualChunks (đã deprecated).
        codeSplitting: {
          groups: [
            // Chỉ khớp three/build/* (core + webgpu + tsl). Không khớp cả node_modules/three, vì như vậy
            // các addon tải lười (ví dụ inspector/Inspector.js) sẽ bị kéo vào chunk tải ngay.
            { name: 'three', test: /node_modules[\\/]three[\\/]build[\\/]/ },
          ],
        },
      },
    },
  },
});
