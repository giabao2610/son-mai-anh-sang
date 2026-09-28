# Sơn Mài Ánh Sáng

> Vẽ tranh 3D bằng những lớp ánh sáng; mài từng lớp để thấy bức tranh được làm ra thế nào.

**Xem trực tuyến:** https://giabao2610.github.io/son-mai-anh-sang/

## Đây là gì

Trong mỹ thuật Việt, sơn mài là một kỹ thuật: người thợ phủ nhiều lớp sơn, rồi mài cho lớp dưới lộ ra.
Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:

- Mỗi **lớp** là một kỹ thuật dựng hình (instancing, phản chiếu, hạt tính trên GPU, hậu kỳ…), có trọng số từ 0 đến 1.
- **"Mài"** là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt** đất sét.
- Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang: vừa ngắm vừa học.

**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng. Bản hiện tại (giai đoạn 1) có 5 lớp:
Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
chất liệu), Mặt nước (phản chiếu, gợn sóng), Vàng lá (đom đóm tính trên GPU) và Phủ bóng (bloom chọn lọc,
tone mapping AgX). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại.
Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".

Dựng bằng three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) và Vite 8.
Máy không dùng được GPU vẫn thấy poster, thơ và con dấu ngày âm lịch (tầng tranh tĩnh).
Không có backend, tài khoản hay tracking.

Thiết kế đầy đủ: [docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md](docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md).

## Chạy trên máy

Cần **Node 24** (Vite 8 và Vitest 5 không chạy trên Node 20). Cách cài theo thư mục, không đổi Node của project khác:

```bash
brew install fnm
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc   # rồi mở một terminal mới
fnm install 24
```

Chưa cài được fnm? Tải Node 24 bản portable từ nodejs.org/dist, giải nén vào một thư mục tạm và đặt thư mục `bin`
của nó lên đầu `PATH` trong terminal đang dùng.

Trong thư mục repo (fnm tự đọc `.nvmrc`):

```bash
node -v                            # v24.x
npm install
npm run dev                        # mở http://localhost:5173/son-mai-anh-sang/
npm test                           # unit, luật ranh giới, hợp đồng
npx playwright install chromium    # chỉ cần lần đầu, trước khi chạy e2e
npm run e2e                        # build rồi chạy e2e (tranh tĩnh, WebGL2, WebGPU)
```

**WebGPU e2e trên CI (ubuntu):** với headless shell của Playwright, mọi test WebGPU rơi về tranh tĩnh vì
`device-lost: "A valid external Instance reference no longer exists"`. Project `webgpu-swiftshader` vì vậy dùng Chromium
đầy đủ (`channel: 'chromium'`) và, chỉ khi chạy trên CI, thêm cờ Vulkan của SwiftShader
(`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Chỉ đổi Chromium thì chưa đủ; thêm cờ
Vulkan thì WebGPU e2e xanh trên ubuntu. Bước này vẫn không chặn deploy cho tới khi chạy ổn qua nhiều lần.

## Cờ URL

Thêm vào sau địa chỉ trang, ví dụ `…/son-mai-anh-sang/?webgl&freeze=40`. Cờ bật khi có mặt; `=0` hoặc `=false` thì tắt.

| Cờ | Nghĩa |
|---|---|
| `?static` | Tranh tĩnh (tầng C): chỉ poster, thơ và con dấu, không tải three.js |
| `?webgl` | Ép dùng WebGL2 (tầng B) dù máy có WebGPU |
| `?force3d` | Bỏ qua kiểm tra GPU phần mềm (để e2e chạy được trên SwiftShader) |
| `?debug` | In chi tiết lỗi và mở three.js Inspector. `?debug=stats` mở stats-gl (FPS, CPU, GPU). Cả hai chỉ tải khi có cờ |
| `?at=2026-09-28T21:00` | "Bây giờ" giả lập. Không ghi múi giờ thì hiểu là giờ Việt Nam; muốn ghi thì dùng `Z` hoặc `%2B07:00` |
| `?freeze`, `?freeze=N` | Đồng hồ tất định: mỗi khung đúng 1/60 giây. `?freeze=N` dừng sau khung N |
| `?poster` | (Giai đoạn 4) ẩn mọi giao diện trừ canvas, để chụp poster |

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `src/engine/`, `src/ui/` | **Xưởng**: đồ nghề dùng chung (khởi động, dò tầng, pipeline, lớp dùng chung). Không biết có bức nào |
| `src/lib/` | **Hộp màu**: hàm thuần (âm lịch, pha trăng, PRNG có hạt giống) |
| `src/paintings/<slug>/` | **Các bức**: mỗi bức một thư mục; `src/paintings/registry.js` liệt kê các bức |
| `tests/` | Unit, luật ranh giới (`tests/rules/`), hợp đồng của các bức |
| `e2e/` | Playwright: tranh tĩnh, WebGL2 và WebGPU trên SwiftShader |

Luật làm việc với code (cho người và cho AI) nằm trong [CLAUDE.md](CLAUDE.md).

## Kích thước bundle

Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-09-28 ở commit `f895a71`. Tên file đã bỏ phần hash.

| File | Kích thước | gzip |
|---|---:|---:|
| `assets/ao-sen-dem-*.css` | 23.56 kB | 10.19 kB |
| `assets/ao-sen-dem-*.js` (chunk vào) | 15.27 kB | 7.42 kB |
| `assets/run-*.js` | 32.32 kB | 9.91 kB |
| `assets/painting-*.js` | 23.98 kB | 9.30 kB |
| `assets/content.vi-*.js` | 0.06 kB | 0.08 kB |
| `assets/three-*.js` | 897.45 kB | 245.46 kB |
| **Tổng đường 3D** (chunk vào + run + painting + content + three) | | **272.17 kB** |
| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.83 kB | 38.65 kB |
| `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |

Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang. Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.
Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip.

## Giấy phép

MIT, xem [LICENSE](LICENSE). Mọi hình ảnh đều sinh bằng code. Thơ: ca dao; Truyện Kiều (Nguyễn Du).
