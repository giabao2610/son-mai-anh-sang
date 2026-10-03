# Sơn Mài Ánh Sáng

> Vẽ tranh 3D bằng những lớp ánh sáng; mài từng lớp để thấy bức tranh được làm ra thế nào.

**Xem trực tuyến:** https://giabao2610.github.io/son-mai-anh-sang/

## Đây là gì

Trong mỹ thuật Việt, sơn mài là một kỹ thuật: người thợ phủ nhiều lớp sơn, rồi mài cho lớp dưới lộ ra.
Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:

- Mỗi **lớp** là một kỹ thuật dựng hình (instancing, phản chiếu, hạt tính trên GPU, hậu kỳ…), có trọng số từ 0 đến 1.
- **"Mài"** là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt** đất sét.
- Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang: vừa ngắm vừa học.

**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng (đủ sáu lớp từ giai đoạn 3):
Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
chất liệu), Sương (vòm trời có sao, quầng trăng, Ngân Hà; sương là là trên mặt nước), Mặt nước (phản chiếu, gợn sóng),
Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES, LUT "sơn mài"
sinh từ bảng màu, hạt, tối góc, FXAA). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; chạm hai lần để thả một ngọn hoa đăng
mang một cặp câu thơ; giữ tay để đom đóm tụ lại; vuốt để sương xoáy; kéo thanh giờ để trăng đi qua đêm.
Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".

Trong lúc tải cảnh 3D, trăng cạnh con dấu có một vòng quầng mảnh vẽ dần theo từng bước tải (tải code, dựng cảnh, hòa dần), nên
mạng chậm vẫn thấy trang đang nhích (giai đoạn 5).

## Thả hoa đăng

Chạm hai lần lên mặt nước (giai đoạn 5): hai lần chạm vẫn tạo hai vòng gợn, và giữa vòng gợn hiện một búp hoa đăng, nở đủ 8 cánh
trong khoảng 1,5 giây. Một cặp câu thơ (ca dao hay thơ cổ điển, có ghi nguồn) hiện phía trên ngọn đèn và đi theo nó.

- Đèn trôi chậm về phía lối trăng, nhấp nhô khi gợn đi qua, hắt một vũng sáng ấm trên nước, hiện trong ảnh phản chiếu và mờ dần
  trong sương. Tới gần bờ, hoặc sau 90 giây, đèn chìm dần rồi tắt.
- Ao giữ tối đa 8 đèn trôi ở mức cao (6 ở mức vừa, 4 ở mức thấp); thả thêm thì đèn cũ nhất chìm sớm.
- Mười hai cặp câu, mỗi đêm một thứ tự khác (cùng `?at` thì cùng thứ tự).
- Mọi đèn chung một InstancedMesh với đèn ở bờ, nên thả bao nhiêu đèn cũng không thêm draw call nào. Đèn thả ra chỉ tự phát sáng
  (thêm đèn thật lúc chạy là mọi chất liệu biên dịch lại). Đường trôi tính thẳng từ thời gian, nên `?freeze=N` vẫn cho đúng khung N.

## Sổ tay: mài từng lớp

Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng bàn phím), trang mời *"Bức tranh này có 6 lớp — mài thử?"*. Bấm vào là vào **chế độ mài**:

- Mọi lớp trừ Cốt mờ dần về 0, bức trở về đất sét xám. Nút **"Phủ lớp tiếp theo"** sơn lại từng lớp một và mở
  **Sổ tay** của lớp vừa phủ. Trên **thanh lớp** có thể bật/tắt tự do từng lớp (Cốt thì không). Đóng thanh lớp là về lại
  bức tranh đầy đủ.
- Sổ tay của mỗi lớp có ba tab. **Hiểu**: lớp làm gì, một sơ đồ, "Bạn vừa học", "Đọc thêm". **Chỉnh**: núm (Tweakpane)
  và code thật của lớp; rê chuột lên một núm thì dòng code dùng núm đó sáng lên. **Phá**: thí nghiệm "Thử phá" (tắt
  instancing, bias = 0, độ phân giải phản chiếu 0.1, CPU vs GPU…) kèm số đo trực tiếp (draw call, tam giác, mili giây
  mỗi khung, mili giây CPU). Thí nghiệm so sánh (như "CPU vs GPU", "Chỉ 1 octave") vẽ hai cột "Tắt / Bật".
- Ở tầng tranh tĩnh vẫn đọc được Sổ tay (nút "Xem 6 lớp của bức tranh"): chữ, sơ đồ và code; núm cần cảnh 3D.
- Trong DevTools: `__sma.layers()`, `__sma.setWeight('mat-nuoc', 0)` (mài một lớp ngay), `__sma.snapshot()`,
  `__sma.restore(s)`, `__sma.stats()` (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (mức, nấc đang hạ, máy có đo được
  GPU không, nấc bị khóa), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` /
  `__sma.setTool('kinh-mai')` (công cụ học; `'tung-soi'` là Từng sợi), `__sma.dials()` / `__sma.setDial('gio', 27)` (thanh giờ),
  `__sma.readouts('anh-trang')` (số đo riêng của một lớp, như Sổ tay đọc: ở lớp Ánh trăng có số hoa đăng đang trôi).
- Mất GPU (máy ngủ, đổi card đồ họa): lần đầu trang hiện poster và nút "Dựng lại cảnh", dựng lại đúng trạng thái cũ;
  lần hai thì về tranh tĩnh.

## Công cụ học: nhìn vào bên trong một khung hình

Trong thanh lớp có mục **Đồ nghề** (mỗi lúc bật một công cụ; đóng thanh lớp thì công cụ tắt):

- **Kính mài:** soi một bước giữa chừng của khung hình (*Trước tone*, *Trước bloom*, *Chỉ emissive*, *Normal*, *Depth*).
  Hình **tròn** đi theo chuột (điện thoại: chạm để đặt, giữ rồi kéo để dời); hình **gạt** chia khung bằng một vạch kéo được
  (cả bằng bàn phím): bên trái là ảnh đang soi, bên phải là ảnh cuối. Chọn *Normal* lần đầu thì xưởng phải biên dịch lại một lần
  ("đang mài…").
- **Lột lớp:** một thanh trượt lột dần ảnh cuối về từng bước, từ ảnh cuối tới depth.
- **Từng sợi** (giai đoạn 5): dệt lại khung hình từng lần vẽ (draw call) một, theo đúng thứ tự GPU nhận. Thanh trượt đi từ 0 (chưa
  vẽ gì, chỉ còn màu nền) tới N (ảnh đủ); nút "Dệt lại" chạy hết 0 → N, mỗi sợi chừng 0,6 giây, cả lượt không quá chừng 12 giây
  (nhiều sợi thì đi nhanh hơn). Dòng mô tả cho biết sợi đang xem vẽ vật gì (nhãn, lớp, số bản, số tam giác), và dòng tóm tắt đếm
  lượt vẽ cảnh, phản chiếu, các lượt khác. Bật "Tắt instancing" là thấy mỗi lá nổi thành một sợi: hơn nghìn sợi ở mức cao (tối
  đa 1.200). Xưởng chỉ gắn móc lần vẽ (`renderer.setRenderObjectFunction`) khi công cụ bật.
- **Thanh giờ:** kéo từ 18:00 tới 05:30; trăng, lối trăng, bóng, màu trời và sương đi theo; trăng thấp thì ánh trăng yếu.

Công cụ chạy trên mọi bức: chúng chỉ nhìn các "view" (và Từng sợi chỉ nhìn danh sách lần vẽ) mà xưởng đưa cho, bức không biết có
công cụ nào. Trên máy tính, bảng của công cụ nằm giữa thanh lớp và Sổ tay; màn hẹp hơn 1240 px thì Sổ tay thu lại khi một công cụ
bật. Từ nút công cụ trên thanh lớp, phím Tab đi hết phần còn lại của thanh lớp (các nút Đồ nghề sau nó, thanh giờ, "Phủ lớp
tiếp theo", nút đóng) rồi mới vào bảng của công cụ; sau bảng là Sổ tay.

## Chất lượng: hợp với nhiều loại máy

Trang tự chọn mức theo máy: WebGPU trên máy tính là **cao**, WebGPU trên điện thoại hay WebGL2 trên máy tính là **vừa**,
WebGL2 trên điện thoại là **thấp** (phản chiếu giả, không bóng, ít đom đóm hơn). Sau đó, không ép máy quá sức:

- **Tối đa 60 khung/giây**, kể cả trên màn 90/120/144 Hz: GPU không phải vẽ gấp đôi. Màn "60 Hz" thật ra chạy 60,02–60,1 Hz
  không bị bỏ khung nào.
- **Bộ điều chỉnh tự động** đo nhịp khung theo cửa sổ 2 giây. Chậm (dưới 50 khung/giây trên máy tính, 37 trên điện thoại)
  thì hạ từng nấc: độ nét (DPR), chi tiết sương, độ nét phản chiếu, bloom, số đom đóm, cỡ bóng. Rảnh lại thì nâng lên.
  Đang hạ thì huy hiệu ghi *"hạ n nấc"*. Khi Sổ tay mở (bạn đang thử phá), nó chỉ ra tay nếu máy quá tải nặng.
- **Đo thời gian GPU thật** khi máy cho phép (Chrome, Edge trên máy tính): bộ điều chỉnh phân biệt được máy yếu (hạ nấc) với
  trình duyệt đang khóa 30 khung/giây để tiết kiệm pin (không hạ gì). Sổ tay có thêm dòng mili giây GPU. Safari và nhiều
  điện thoại chưa đo được; GPU Apple trên Chrome báo các lượt vẽ chồng lên nhau (số lớn hơn cả nhịp khung) nên cũng bị coi là
  không đo được. Khi đó dòng ms GPU ghi "—", bộ điều chỉnh đoán theo nhịp khung. Trước lần hạ đầu, nó ngừng vẽ chừng 0,2 giây để
  thử: không vẽ gì mà nhịp vẫn chậm thì trình duyệt đang khóa nhịp để tiết kiệm pin, và nó không hạ gì (trước đây, trên Mac để chế độ
  tiết kiệm pin, ảnh mờ dần chừng 20 giây rồi mới nét lại).
- **Núm có trần theo mức:** trên máy yếu, núm không kéo được số đom đóm, độ phân giải phản chiếu hay số tầng noise của
  sương lên quá sức máy.
- Xem trước mức khác ngay trên máy tính: thêm `?level=thap` (hoặc `vua`, `cao`) vào địa chỉ.

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

Số test (giai đoạn 5): `npm test` chạy 73 file, 860 test. E2e liệt kê 40 test cho mỗi project: `static` chạy 6, mỗi project 3D
(`webgl2-swiftshader`, `webgpu-swiftshader`, `webgpu-real-gpu`) chạy 33; còn lại Playwright ghi "skipped" vì chúng thuộc project
khác.

**WebGPU e2e trên CI (ubuntu):** với headless shell của Playwright, mọi test WebGPU rơi về tranh tĩnh vì
`device-lost: "A valid external Instance reference no longer exists"`. Project `webgpu-swiftshader` vì vậy dùng Chromium
đầy đủ (`channel: 'chromium'`) và, chỉ khi chạy trên CI, thêm cờ Vulkan của SwiftShader
(`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Từ giai đoạn 4, e2e WebGPU chạy ở một job
riêng (`e2e-webgpu`, không chặn deploy, trần 40 phút), song song với job `build` (chặn: unit, build, e2e tĩnh + WebGL2 kèm a11y).

**E2E trên GPU thật của máy mình** (nhanh, bắt được lỗi của driver mà SwiftShader che mất):
`npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`.

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
| `?poster` | Ẩn mọi giao diện trừ canvas, để chụp poster (dùng cùng `?at` và `?freeze=N`) |
| `?level=cao\|vua\|thap` | Ép mức chất lượng (bỏ qua cách tự chọn theo máy); giá trị lạ thì bỏ qua |

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `src/engine/`, `src/ui/` | **Xưởng**: đồ nghề dùng chung (khởi động, dò tầng, pipeline, lớp dùng chung). Không biết có bức nào |
| `src/lib/` | **Hộp màu**: hàm thuần (âm lịch, pha trăng, PRNG có hạt giống) |
| `src/paintings/<slug>/` | **Các bức**: mỗi bức một thư mục; `src/paintings/registry.js` liệt kê các bức |
| `src/paintings/_mau/` | **Tranh mẫu** hai lớp, không deploy: khuôn để copy khi làm bức mới, và là fixture của test hợp đồng |
| `plugins/` | Plugin Vite `?code`: tô màu code của lớp bằng Shiki lúc build cho tab Chỉnh của Sổ tay |
| `scripts/poster.js` | Chụp poster (WebP) và ảnh chia sẻ (og, JPEG) từ chính cảnh 3D, trên GPU thật |
| `tests/` | Unit, luật ranh giới (`tests/rules/`), hợp đồng của các bức |
| `e2e/` | Playwright: tranh tĩnh, WebGL2 và WebGPU trên SwiftShader, trợ năng (axe-core) |

Luật làm việc với code (cho người và cho AI) nằm trong [CLAUDE.md](CLAUDE.md).

## Thêm một bức tranh mới

Mỗi bức là một thư mục, một trang HTML, một thư mục ảnh trong `public/` và một dòng registry (luật 7 của spec §0).
Không phải sửa xưởng, trừ khi bức cần một khả năng mới.

1. `cp -r src/paintings/_mau src/paintings/<slug>`, rồi sửa trong `meta.js`: `slug` (trùng tên thư mục, kebab-case không dấu),
   `no`, `title`, `tagline`, `poem` (có `source`), `poster` (kèm `capture`: thời điểm và khung để chụp), `og`, và `fence`
   (từ vựng riêng của bức, để test cấm xưởng nhắc tới).
2. Viết các lớp `layers/lN-<id>.js` (mỗi file `export const id`, `knobs`, `createLayer`); lớp đầu luôn là Cốt, lớp cuối thường
   là Phủ bóng dùng chung. Thêm `painting.js` (lớp, camera, `quality`, `setup`) và `content.vi.js` (chữ của Sổ tay).
   - Mọi vật trong `objects` của lớp có `name` (kebab-case không dấu, không trùng trong lớp), và nhãn ở
     `content.layers[id].objects[name]`: Từng sợi hiện nhãn này. Test tên vật kiểm cả vật mà thí nghiệm thêm vào.
   - `meta.layers[].files` kê mọi file trong `parts/` mà lớp import (thẳng hay qua part khác); lớp khác cần gì thì nhận qua
     `shared`, không import part của lớp khác.
   - Tùy chọn: muốn một dòng chữ (thơ, chú thích) hiện cạnh một vật và đi theo nó thì ghi chữ vào `content.captions`
     (`{ lines, source, author? }`, 1–2 dòng) rồi gọi `ctx.captions.show(khóa, anchor)`; code của bức chỉ cầm khóa.
3. Copy `index.html` thành `tranh/<slug>/index.html`, sửa `data-painting`, tiêu đề, thơ, poster, thẻ og và dòng import.
4. Thêm `{ meta, page: 'tranh/<slug>/index.html', lang: 'vi' }` vào `src/paintings/registry.js`.
5. Chụp poster từ chính cảnh: `npm run build && node scripts/poster.js <slug>` (máy có GPU thật). Ảnh ghi vào
   `public/paintings/<slug>/`.
6. `npm test` rồi sửa theo từng lỗi tiếng Việt; `npm run e2e`. E2e chung (mài lớp, hạ nấc, Kính mài, Lột lớp, Từng sợi, quầng
   trăng, a11y…) tự chạy trên bức mới.

Công thức đầy đủ (thêm lớp, thêm công cụ học, thêm ngôn ngữ): spec §15.

## Poster và ảnh chia sẻ

Poster (`poster.webp`, ≤ 150 KB) và ảnh og (`og.jpg`, 1200×630) được chụp từ chính cảnh 3D, nên poster hiện ngay lúc mở trang
và cảnh 3D hòa lên trên là cùng một ảnh:

```bash
npm run build
node scripts/poster.js ao-sen-dem   # cần GPU thật (WebGPU); tự mở vite preview
```

Script mở `?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao` ở cỡ của poster, chờ đúng khung đó, rồi mã hóa WebP và
JPEG ngay trong trang (không thêm gói npm nào). Muốn đổi thời điểm thì sửa `poster.capture` trong `meta.js` rồi chạy lại.
CI không chạy script này: ảnh được commit vào repo.

## Kích thước bundle

Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-10-03 (giai đoạn 5). Tên file đã bỏ phần hash.

| File | Kích thước | gzip |
|---|---:|---:|
| `assets/ao-sen-dem-*.css` (kèm chữ đi theo vật, quầng trăng) | 38.44 kB | 13.41 kB |
| `assets/ao-sen-dem-*.js` (chunk vào, kèm quầng trăng) | 23.71 kB | 10.86 kB |
| `assets/run-*.js` (kèm đồ nghề, Từng sợi, móc lần vẽ, chữ đi theo vật, view, bộ điều chỉnh) | 62.35 kB | 21.53 kB |
| `assets/workshop-*.js` (thanh lớp + Sổ tay + Đồ nghề) | 16.05 kB | 5.93 kB |
| `assets/painting-*.js` (kèm hoa đăng, LUT, FXAA của Phủ bóng) | 50.60 kB | 19.68 kB |
| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay, thơ của hoa đăng) | 32.95 kB | 10.32 kB |
| `assets/three-*.js` | 898.07 kB | 245.65 kB |
| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **313.97 kB** |
| `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.30 kB | 30.96 kB |
| 22 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–8.0 kB mỗi file |
| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.83 kB | 38.67 kB |
| `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |

Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang; mở Sổ tay chỉ đọc thì tải thêm `workshop` và `content`.
Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.
Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 344.93 kB). Giai đoạn 5 thêm 7.40 kB gzip cho đường 3D
(giai đoạn 4: 306.57 kB).

## Giấy phép

MIT, xem [LICENSE](LICENSE). Mọi hình ảnh đều sinh bằng code. Thơ: ca dao; Truyện Kiều (Nguyễn Du); thơ của hoa đăng là ca dao
và thơ cổ điển đã hết bản quyền (Nguyễn Trãi, Hồ Xuân Hương, Nguyễn Du, Nguyễn Khuyến).
