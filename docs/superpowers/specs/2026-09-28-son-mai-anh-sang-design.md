# Sơn Mài Ánh Sáng: thiết kế

> Vẽ tranh 3D bằng những lớp ánh sáng; mài từng lớp để thấy bức tranh được làm ra thế nào.
>
> **Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng.

- **Ngày:** 2026-09-28
- **Chủ dự án:** Bao Nguyen (GitHub `giabao2610`)
- **Trạng thái:** bản 2. Bản 1 đã được duyệt trong hội thoại. Bản 2 thêm định nghĩa kỹ thuật và kiến trúc để mở rộng, sau đó qua 4 vòng phản biện: nhất quán, thử mở rộng, đối chiếu bằng chứng API, và tải của GĐ 0. Các chi tiết API đã được kiểm bằng code chạy thật trên three@0.186.1 (Phụ lục A).

### Bản 2 đổi gì so với bản 1
- **§0 (mới):** "Sơn Mài Ánh Sáng" là **một kỹ thuật**. Ao Sen Đêm là **Bức 1** làm bằng kỹ thuật đó. Có bảng từ vựng và 8 luật của kỹ thuật.
- **§8:** kiến trúc gồm ba vùng: **xưởng** (`src/engine/`, `src/ui/`), **hộp màu** (`src/lib/`) và **các bức** (`src/paintings/<slug>/`). Có hợp đồng JSDoc, luật phụ thuộc do test giữ, và vòng đời của một bức.
- **§6, §7, §9, §10:** sửa theo những gì đã kiểm trên r186:
  - `resolutionScale`, blend mode của kênh `emissive`;
  - tone mapping chọn bằng `Fn` + `If` (không dùng `select()`, vì cách đó làm alpha bằng 0);
  - tên uniform phải là định danh hợp lệ;
  - target của reflector phải nằm trong scene;
  - nền canvas đặc;
  - sương và bóng không bật/tắt lúc chạy;
  - lỗi GPU đến không đồng bộ;
  - bloom 0.5/0.25;
  - cách đếm draw call.
- **§8.7:** định nghĩa đủ các cờ URL: `?at` (giờ Việt Nam), `?freeze` (đồng hồ tất định), `?poster`, `?debug`.
- **§12, §13:** thêm test luật ranh giới (phân tích bằng `parseSync` của Vite), test hợp đồng, e2e đã chạy thử, cách cài Node 24 theo thư mục, và thứ tự deploy lần đầu.
- **§14:** GĐ 0 dựng **Ao Sen Đêm v0** đi qua đúng hợp đồng lớp.
- **§15, §16 (mới):** công thức mở rộng từng bước, và danh sách việc để sau (đã có đường đi).
- **Phụ lục A (mới):** các sự thật API đã kiểm.

---

## 0. Sơn Mài Ánh Sáng là một kỹ thuật

Trong mỹ thuật Việt, **sơn mài là một kỹ thuật**, không phải một loại tranh. Người thợ phủ nhiều lớp sơn, có khi dát vàng, dát bạc hay cẩn vỏ trứng. Sau đó họ mài cho lớp dưới lộ ra, rồi phủ bóng.

Dự án dùng lại đúng ý đó. **Sơn Mài Ánh Sáng là cách dựng tranh 3D bằng nhiều lớp ánh sáng:**
- Mỗi lớp là một kỹ thuật dựng hình, có trọng số từ 0 đến 1.
- "Mài" là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt đất sét**.

Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau sẽ là Bức 2, 3, 4, làm bằng cùng kỹ thuật và dùng chung một xưởng.

### Từ vựng (dùng giống nhau trong tài liệu và trong code)

| Từ | Nghĩa | Trong code |
|---|---|---|
| **kỹ thuật** | cả dự án cùng các luật của nó (mục dưới) | repo này |
| **xưởng** | đồ nghề dùng chung: khung vẽ, pipeline, bộ điều chỉnh chất lượng, Sổ tay, công cụ học, lớp Phủ bóng. **Xưởng không biết có bức nào tồn tại.** | `src/engine/`, `src/ui/` |
| **hộp màu** | hàm "lá", không biết gì về xưởng hay tranh: âm lịch, pha trăng, PRNG, hàm TSL dùng chung | `src/lib/` |
| **bức tranh** | một tác phẩm: một thư mục, một trang HTML, một dòng registry | `src/paintings/<slug>/` |
| **lớp** | một kỹ thuật dựng hình trong một bức, có trọng số 0 → 1. Lớp đầu luôn là **Cốt** | `layers/lN-<id>.js` |
| **lớp dùng chung** | lớp thuộc về kỹ thuật, bức nào cũng lắp được (hiện có Phủ bóng) | `src/engine/stock/<id>/` |
| **núm** | tham số người xem chỉnh được của một lớp | `export const knobs` |
| **núm của bức** (Dial) | tham số của cả bức, ví dụ thanh giờ của Bức 1 | `setup().dials` |
| **nấc** | một bước hạ chất lượng khi máy yếu | `Layer.degrade` |
| **công cụ** | công cụ học chạy được trên mọi bức: Kính mài, Lột lớp | `src/engine/tools/` |
| **view** | một ảnh trung gian mà công cụ nhìn được: `final`, `emissive`, `normal`, `depth`, hoặc ảnh chụp giữa chừng (tap) của một lớp | `pipeline.views()` |
| **con dấu** | dấu đỏ ghi ngày âm lịch, chữ ký của kỹ thuật, bức nào cũng có | `[data-seal]` |

**Cách phân biệt:** thứ gì mang tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thì thuộc về xưởng. Thứ gì mang tên chủ đề (sen, trăng, gợn nước, đom đóm, giờ đêm) thì thuộc về bức.

### Luật của kỹ thuật (mọi bức phải theo)
1. Bức nào cũng là một chồng lớp có thứ tự. Lớp đầu tiên luôn là **Cốt**:
   - id là `'cot'`, trọng số cố định bằng 1, không tắt được;
   - Cốt dựng hình khối và **đèn xưởng** (đèn trung tính để đất sét đọc được hình).

   Số lớp là `N`, không cố định ở 6.
2. Mỗi lớp khác Cốt có **trọng số** `0 → 1` do xưởng tạo. Bật/tắt là tween uniform, **không biên dịch lại shader**.
3. **Khi mọi trọng số (trừ Cốt) bằng 0, bức trở về cốt đất sét:**
   - hình khối có màu `datSet #8A8580` dưới đèn xưởng;
   - ánh sáng, hạt và hậu kỳ đều tắt;
   - nền là `denThen`.

   Màn hình không bao giờ đen kịt, trống hay trong suốt.
4. Lớp nào cũng có đủ 3 tab **Hiểu / Chỉnh / Phá** trong Sổ tay.
5. Bức nào cũng có **con dấu âm lịch** và **thơ có ghi nguồn**. Màu đi ra từ **bảng màu sơn mài** (§5).
6. Bức nào cũng có **3 tầng dự phòng** (§9), và poster hiện ra từ HTML tĩnh.
7. Thêm một bức = **một thư mục + một trang HTML + một thư mục poster trong `public/` + một dòng registry**.
   - Không phải sửa xưởng, trừ khi bức cần một khả năng mới. Khi đó chỉ **thêm trường tùy chọn** vào hợp đồng và xưởng làm một lần, mọi bức sau dùng được.
   - Không bao giờ viết code rẽ nhánh theo `slug`.
8. Mọi material trong scene pass **gán `emissiveNode` tường minh** (kể cả `vec3(0)`), vì xưởng đọc kênh `emissive` của mọi bức. Trước khi biên dịch, xưởng tự gán `vec3(0)` cho material nào còn thiếu, như một lưới an toàn.

---

## 1. Bối cảnh và mục tiêu

### Bạn đã nói
- Muốn làm một trang web 3D lấy cảm hứng từ project "Trung Thu 3D" (của devpan.vercel.app). Project đó chỉ để **tham khảo**.
- **Không thương mại.** Mục đích là **khám phá và học về vẻ đẹp của 3D**.
- Cách gắn bó: **"vừa ngắm vừa học"**. Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang.
- Chọn hướng **1 · Sơn Mài Ánh Sáng** trong 3 hướng đã đề xuất.
- Đợt này làm phần lõi, từ giai đoạn 0 đến 4.
- Repo **public** trên GitHub cá nhân, deploy bằng GitHub Pages.
- **(Bản 2)** Muốn về sau **dễ phát triển thêm** (§0).
- **(Bản 2)** Muốn viết xong kế hoạch là **thực thi luôn** cho tới khi ra sản phẩm.
- **(GĐ 3)** Muốn sản phẩm **hợp với nhiều loại phần cứng**, không ép phần cứng quá sức (các biện pháp ở §10).

### Giả định (bạn đã xem và không phản đối)
- Project nằm ở `~/Documents/Projects/son-mai-anh-sang`.
- Git dùng `Bao Nguyen <giabao261096@gmail.com>`, chỉ cấu hình trong repo này. Cấu hình git global (email công ty) giữ nguyên.
- Phong cách mang chất Việt và nên thơ, không gắn với một lễ hội cụ thể nào.
- **(Bản 2)** Máy đang có Node 20.15. Bản này đã hết hỗ trợ từ 04/2026 và không chạy được Vite 8 hay Vitest 5. Dự án yêu cầu **Node 24 LTS**, cài theo thư mục để không ảnh hưởng các project công việc (§13).

### Bản tham khảo làm gì, và mình làm khác thế nào
| Bản tham khảo (Trung Thu 3D) | Sơn Mài Ánh Sáng |
|---|---|
| three.js 2021, `WebGLRenderer` | three.js **0.186.1**, `WebGPURenderer`, TSL (tự lùi về WebGL2) |
| Không có shader tự viết, glow giả bằng sprite | Shader TSL, bloom chọn lọc thật qua MRT |
| Hạt cập nhật bằng CPU | Đom đóm chạy bằng GPU compute, có công tắc để so với CPU |
| Một file `script.js` 23KB, không có chú thích | Mỗi lớp một file, code hiện ngay trên trang |
| Một cảnh duy nhất, viết cứng | Một kỹ thuật với một xưởng dùng chung; mỗi bức là một thư mục |
| Máy không có WebGL thì báo lỗi rồi dừng | 3 tầng dự phòng, không bao giờ để trống màn hình |
| Code bị làm rối, chặn DevTools (devpan) | Mã nguồn mở MIT, khuyến khích mở DevTools |

## 2. Tiêu chí thành công

1. Mở link là thấy **poster trong dưới 1 giây**. Cảnh 3D hòa dần lên; trên laptop mạng tốt mất khoảng 3 giây.
2. **Chạm vào mặt nước** thì gợn sóng lan ra và **xẻ đôi bóng trăng** rõ ràng.
3. Cả **6 lớp của Bức 1** bật/tắt được mà không khựng hình. Lớp nào cũng có đủ 3 tab **Hiểu / Chỉnh / Phá**, và kéo núm thì **dòng code thật sáng lên**.
4. Đạt **60fps trên laptop** và **từ 45fps trở lên trên điện thoại tầm trung**. Không bao giờ hiện màn hình lỗi rồi dừng.
5. Bao đọc được từng file: mỗi file khoảng 250 dòng trở xuống, các điểm cần học có chú thích tiếng Việt.
6. Trang deploy công khai trên GitHub Pages của tài khoản cá nhân. Mọi commit mang email cá nhân.
7. **(Bản 2)** Code của xưởng không chứa từ vựng của bức nào. Thêm một bức theo đúng luật 7 ở §0. `npm test` giữ các luật này và báo lỗi bằng tiếng Việt.

## 3. Không làm (non-goals)

- Không có backend, tài khoản, analytics hay tracking.
- Không tự phát nhạc. Không dùng modal lời chúc kèm ảnh kiểu thiệp.
- Không dùng lại ảnh, nhạc hay lời chúc của bản tham khảo thương mại. Mọi hình ảnh đều sinh bằng code.
- Không dùng React/R3F, `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` hay `EffectComposer`. `three/webgpu` vẫn export `ShaderMaterial` và `RawShaderMaterial`, nên việc cấm do test quét mã giữ (§12).
- Không dùng API đã deprecated trong r186:
  - `PostProcessing` (dùng `RenderPipeline`);
  - `renderAsync`, các `clear*Async`, `hasFeatureAsync`, `initTextureAsync`;
  - `setResolution` của PassNode (dùng `setResolutionScale`);
  - tùy chọn `resolution` của `reflector` (dùng `resolutionScale`);
  - `label()` (dùng `setName()`);
  - `directionToColor` (dùng `packNormalToRGB`);
  - `PCFSoftShadowMap`.

  E2e bắt các cảnh báo deprecated lúc chạy (§12).
- Không dùng định vị, micro hay dữ liệu thời tiết.
- **(Bản 2)** Không dùng npm workspaces, plugin loader, SPA router, scene DSL, ECS, class kế thừa cho lớp, thư viện i18n, event bus hay state store trung tâm, và không chuyển sang TypeScript. Lý do nằm ở §16.

## 4. Trải nghiệm người xem

### 4.1 Trải nghiệm của kỹ thuật (bức nào cũng có)
1. **Mở trang (GĐ 0):**
   - HTML tĩnh hiện ngay poster của bức, tên bức, thơ và con dấu ngày âm lịch.
   - JS 3D tải ngầm, dò tầng, biên dịch trước (`scenePass.compileAsync(renderer)`), rồi vẽ một khung ẩn sau poster để các pipeline còn lại kịp biên dịch.
   - Sau đó **hòa dần** từ poster sang cảnh 3D. Poster được ẩn khi hòa xong. Không có spinner.
2. **Ngắm (mặc định):** không có UI.
   - Chỉ có câu thơ ở góc và camera chuyển động chậm như đang thở (GĐ 1).
   - Kéo để xoay camera trong giới hạn do bức khai báo (`CameraSpec`).
3. **Lời mời (GĐ 1):** sau lần tương tác đầu tiên, hiện nhẹ *"Bức tranh này có {n} lớp — mài thử?"*, với `n = meta.layers.length`.
   Từ GĐ 2 lời mời là **một nút**: bấm thì vào chế độ mài. Đóng thanh lớp thì lời mời quay lại, để mở lại lúc nào cũng được.
   "Lần tương tác đầu tiên" là chạm canvas, hoặc phím đầu tiên (người chỉ dùng bàn phím không chạm được canvas). Dựng lại
   cảnh sau khi mất GPU mà thanh lớp đang đóng thì lời mời hiện lại ngay (poster lúc mất GPU đã xóa nó).
4. **Chế độ mài có hướng dẫn (GĐ 2):**
   - Mọi lớp trừ Cốt mờ dần về 0 (tween 0,8 giây theo đồng hồ của cảnh); bức trở về **đất sét xám**. Sổ tay mở trang Cốt.
   - Nút *"Phủ lớp tiếp theo · {tên}"* sơn lại lớp đầu tiên (sau Cốt) đang hướng về 0, rồi mở Sổ tay của lớp vừa phủ
     (tab Hiểu). Vì luôn tính lại từ trọng số, bật/tắt tự do không làm lệch thứ tự.
   - Người xem cũng có thể bật/tắt tự do trên **thanh lớp** (công tắc `role="switch"`, vạch trọng số chạy theo tween).
     Cốt không có công tắc. Đóng thanh lớp thì mọi lớp phủ lại: về chế độ ngắm.
   - Người xem xin giảm chuyển động thì bật/tắt lớp là ngay, không mờ dần.
5. **Sổ tay (GĐ 2):** panel bên phải trên desktop, tấm trượt dưới đáy (ngay trên dải thanh lớp) trên điện thoại. Có 3 tab
   theo mẫu tab của ARIA (mũi tên đổi tab; Escape đóng Sổ tay):
   - **Hiểu:** thơ riêng của lớp (nếu có), tối đa 150 chữ (đếm theo khoảng trắng), 1 sơ đồ SVG, mục "Bạn vừa học", mục "Đọc thêm".
   - **Chỉnh:** núm Tweakpane cộng với code thật của lớp (mọi file trong `LayerMeta.files`, mỗi file một nút). Đưa chuột vào,
     focus bằng bàn phím, hoặc kéo một núm thì Sổ tay mở đúng file có marker của núm đó và dòng code tương ứng sáng lên.
     Núm `rebuild` chỉ áp khi thả tay (dựng lại hình ở mỗi nấc kéo thì khựng); trong lúc dựng hiện "đang dựng…".
   - **Phá:** các thí nghiệm "Thử phá" (nút bật/tắt `aria-pressed` kèm lời giải thích), rồi số đo trực tiếp: số đo riêng
     của lớp, và của xưởng (draw call, tam giác, mili giây mỗi khung), đổi 4 lần mỗi giây.
     (GĐ 3) Xưởng đo thêm **mili giây CPU mỗi khung**: thời gian luồng chính làm xong một khung. Mili giây mỗi khung bị khóa
     theo nhịp màn hình (máy mạnh với màn 60 Hz luôn thấy 16,7), còn ms CPU lộ ngay phần việc của JS. Thí nghiệm kiểu
     `compare` có thêm hai cột ngang nhỏ "Tắt / Bật" dưới nút: ms mỗi khung và ms CPU của từng trạng thái.
   - Tầng tĩnh có **Sổ tay chỉ đọc** (nút "Xem {n} lớp của bức tranh" trong ô ghi chú): thanh lớp chỉ có tên, Hiểu và code
     đọc được, núm và thí nghiệm cần cảnh 3D.
6. **Công cụ học (GĐ 4):** Kính mài và Lột lớp (§7). Cả hai chạy trên mọi bức, vì chỉ nhìn các view mà xưởng liệt kê.
7. **Núm của bức (Dial, GĐ 4):** xưởng vẽ thanh trượt cho mọi Dial mà bức khai báo.
8. **Huy hiệu tầng (GĐ 0):**
   - Hiện WebGPU / WebGL2 / Tranh tĩnh cùng mức chất lượng. Chạm vào để đọc giải thích.
   - Ghi **backend thật**, đọc sau `renderer.init()`, vì three có thể lặng lẽ lùi về WebGL2.
   - Có thuộc tính `data-backend` để test đọc.
   - (GĐ 3) Khi bộ điều chỉnh đang hạ nấc (§10), huy hiệu ghi thêm "hạ {n} nấc" (`data-steps`); chạm vào thì lời giải thích
     nói máy đang bớt chi tiết để giữ nhịp khung hình.
9. **Chế độ thợ:**
   - `?debug` ở GĐ 0: in chi tiết lỗi. Từ GĐ 1: mở thêm three.js Inspector.
   - `?debug=stats` (GĐ 1): mở stats-gl. Không bật cùng lúc với Inspector.

### 4.2 Trải nghiệm riêng của Bức 1 · Ao Sen Đêm
- Gợi ý duy nhất: *"Chạm vào mặt nước"*, lấy từ `content.hint` (GĐ 1).
- Chạm thì tạo gợn sóng, đom đóm tản ra. Giữ thì đom đóm tụ lại quanh ngón tay, thả ra thì chúng bung ra (GĐ 1).
- Vuốt trên mặt nước thì sương xoáy quanh chỗ vuốt rồi lắng lại (GĐ 3).
- **Thanh "giờ"** là Dial của Bức 1: kéo từ 18:00 đến 05:30 (§7, GĐ 4). Từ GĐ 1, giờ mặc định đã điều khiển vị trí trăng.
- Thơ của cả bức, và câu Truyện Kiều ở lớp Mặt nước (§5).

## 5. Chỉ đạo nghệ thuật

### Bảng màu sơn mài: 10 token của chất liệu (thuộc xưởng)
Bảng nằm ở `src/engine/palette.js`, dùng chung cho CSS và TSL. `src/styles/tokens.css` được unit test giữ cho khớp với bảng này.

| Token | Tên | Hex |
|---|---|---|
| `denThen` | đen then (nền sơn) | `#0E0A08` |
| `canhGian` | nâu cánh gián | `#3B1F14` |
| `doSon` | đỏ son | `#B3261E` |
| `vangLa` | vàng lá | `#D4A94A` |
| `vangLaSang` | vàng lá sáng | `#F2D48A` |
| `bacLa` | bạc lá | `#C9C6BD` |
| `nga` | ngà vỏ trứng | `#EDE3CF` |
| `cham` | chàm | `#1B2A4A` |
| `xanhLuc` | xanh lục (màu lá) | `#2E4A3A` |
| `datSet` | đất sét, màu của cốt khi mài hết | `#8A8580` |

- Một bức có thể **thêm hoặc ghi đè** token qua `meta.palette`. Ví dụ, Đông Hồ sau này có thể thêm `diep`. Lớp đọc bảng đã ghép qua `ctx.palette`.
- LUT "sơn mài" sinh từ bảng đã ghép (GĐ 4), nên bức đổi màu thì LUT tự đổi theo.
- Không dùng neon hồng tím. Màu sen của Bức 1 lấy **đúng từ câu ca dao**: *lá xanh, bông trắng, nhị vàng*.

### Chữ
- Font tự host qua `@fontsource` 5.3, không gọi Google Fonts lúc chạy:
  - **Cormorant Garamond** (có tiếng Việt) cho thơ và tiêu đề: `500.css`, `500-italic.css`.
  - **Be Vietnam Pro** cho giao diện: `400.css`, `600.css`.
  - **JetBrains Mono** cho code: `400.css`.
- Các file này được import ở đầu `src/styles/shell.css`. **Không import `vietnamese-*.css` riêng lẻ**: các file đó không có `unicode-range` và thiếu phần Latin cơ bản. Trình duyệt chỉ tải subset `latin`, `latin-ext` và `vietnamese`.

### Thơ (có ghi nguồn, không in số câu)
Nguồn là trường bắt buộc `poem.source` trong meta.
- Cả Bức 1: *"Trong đầm gì đẹp bằng sen / Lá xanh bông trắng lại chen nhị vàng / Nhị vàng bông trắng lá xanh / Gần bùn mà chẳng hôi tanh mùi bùn"* (ca dao).
- Lớp Mặt nước: *"Vầng trăng ai xẻ làm đôi / Nửa in gối chiếc, nửa soi dặm trường"* (Truyện Kiều, Nguyễn Du).
- Lớp nào cũng có thể thêm một câu ngắn khác, nhưng phải là văn học dân gian hoặc cổ điển đã hết bản quyền, và phải ghi nguồn.

### Lượt màu (GĐ 3)
Đo trên GPU thật, cùng khung 1280×800 (độ sáng trung bình / độ bão hòa / tỉ lệ điểm tối): poster 33 / 0,42 / 30%; bản GĐ 2 là
48 / 0,54 / 30%; bản GĐ 3 trước lượt màu là 64 / 0,31 / 10%. Thứ làm ảnh bệch nhất là **quầng bloom của 3.000 con đom đóm**
(tắt Vàng lá: độ sáng 63 → 47, điểm tối 8% → 28%), không phải sương hay đèn. Lượt màu: đom đóm dịu lại (`glow` 3 → 1,8), sương
mỏng và tối hơn, đỉnh trời chàm đậm hơn, đèn trời chàm yếu đi (7 → 4), thân lá bớt bóng (`specularIntensity` 0,3), nước sâu
ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc định của núm hay hằng số, nằm trong một commit riêng.

### Chi tiết sống
- **Trăng đúng pha của đêm hôm đó**, tính từ `ctx.now`. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
- **Con dấu đỏ ghi ngày âm lịch** ở góc tranh, ví dụ *"18 tháng Tám · Bính Ngọ"*. Bức nào cũng có (luật 5).

## 6. Bức 1 · Ao Sen Đêm: sáu lớp

**Nơi ở:** `src/paintings/ao-sen-dem/`. Lớp 6 là lớp dùng chung `src/engine/stock/phu-bong/`. Số trong tên file (`lN`) là **vị trí cuối cùng** của lớp trong Bức 1 và không đổi. Ở v0, `l4` đứng ở vị trí thứ 2 vì các lớp 2 và 3 chưa có.

**Trọng số:**
- Lớp đọc trọng số của chính mình qua `ctx.weight(id)`.
- Màu nào cũng bắt đầu từ `datSet` và đi qua `mix(datSet, màu, w)`.
- **Không đặt số trực tiếp lên material lúc chạy** (`material.clearcoat = 0`, `emissiveIntensity`…). Trong r186, một số vượt qua 0 sẽ đổi cache key và gây biên dịch lại. Mọi thứ thay đổi theo trọng số hay núm phải đi qua `uniform` bên trong node, ví dụ `clearcoatNode = uClearcoat.mul(w2)`.

**Liên kết giữa các lớp:** lớp trước công bố những gì lớp sau cần vào `shared.<layerId>`. Ví dụ, Cốt ghi `shared.cot = { leafMaterial, petalMaterial, hemi }`, rồi Ánh trăng trộn màu vào các material đó và giảm đèn xưởng theo `w2`. Lớp chỉ đọc `shared` của lớp **đứng trước** nó. Nếu bức không có `setup`, xưởng vẫn truyền một object `shared = {}` dùng chung cho mọi lớp.

**Số theo mức:** các con số phụ thuộc máy lấy từ bảng §10 qua `ctx.budget`, không viết cứng trong lớp.

**Kiểu núm** (`Knob.via`):
- `uniform` (mặc định): không biên dịch lại.
- `js`: đổi một thuộc tính JS qua `onKnob`, ví dụ `computeNode.count`, cường độ đèn, `resolutionScale`.
- `rebuild`: dựng lại hình hoặc biên dịch lại. UI debounce và hiện "đang dựng…".

### Lớp 1 · Cốt: hình khối và instancing (`layers/l1-cot.js`)
- **Thấy gì:**
  - **Lá sen:** cao 1.200 / vừa 800 / thấp 500 lá. Hình học tự sinh: đĩa tròn có khe hình nêm, lõm lòng chảo, mép lượn sóng, khoảng 40–80 đỉnh. Khoảng 10% là lá đứng trên cuống.
  - **Hoa:** khoảng 12 bông và 20 nụ, dựng từ **một cánh hoa được instance**. Mỗi bông 3 vòng cánh, có tham số độ nở, có gương sen, nhị vàng và cuống.
  - Khoảng 300 ngọn lau sậy ở rìa ao.
  - Lá được rải theo hạt giống cố định (jittered Poisson, `lib/random.js`), chừa một **"lối trăng"** trống để thấy bóng trăng phản chiếu.
  - (GĐ 1) Hai bông "chủ đề" đặt tay ở tiền cảnh, hai bên lối trăng (bố cục của poster); mỗi việc ngẫu nhiên (lá, lá đứng, hoa, lau) một hạt giống riêng, nên hoa và lau không đổi theo mức.
- **Đèn xưởng:** một `HemisphereLight` xám trung tính, để đất sét đọc được hình khối khi mọi lớp khác bằng 0. Cốt công bố đèn này qua `shared.cot.hemi`, và lớp Ánh trăng giảm nó theo `w2`. Cường độ đèn là uniform, nên không gây biên dịch lại.
- **Kỹ thuật:**
  - `BufferGeometry` tự sinh; `InstancedMesh`, cảnh chính của cả ao chỉ khoảng 5 draw call.
  - Biến thể theo từng instance; `computeVertexNormals`; ma trận instance.
  - Attribute **tâm instance** (`InstancedBufferAttribute`), để lớp 4 làm lá nhấp nhô theo cả chiếc lá.
- **Núm:** `leafCount` (rebuild, 0–2400), `seed` (rebuild, 0–99; 0 là đúng ao của poster), `sizeVariance` (rebuild), `cupAmount` (rebuild), `openness` (uniform), `wireframe` (rebuild).
  - (GĐ 2) Các InstancedMesh được cấp phát theo trần của núm MỘT lần; núm `rebuild` chỉ ghi lại ma trận, thuộc tính instance và `count` (vài ms), không tạo mesh mới, không biên dịch lại. `wireframe` và `flatShading` nằm trong cache key nên đổi là biên dịch lại một lần.
  - (GĐ 2) `flatShading` không làm núm riêng: đã có thí nghiệm *"Normal phẳng"*.
- **Phá:**
  - *"Tắt instancing"* (`noInstancing`): vẽ lá nổi bằng từng `Mesh` riêng (tối đa 1.200 ở mức cao, 600 ở mức vừa, 300 ở mức thấp) để thấy draw call tăng vọt và FPS tụt.
  - *"Normal phẳng"* (`flatNormals`): `flatShading` trên mọi material của Cốt.
- **Số đo:**
  - `leaves` (số lá) và `vertices`: số đỉnh tự tính (`position.count × số instance`), vì `renderer.info` không có bộ đếm đỉnh.
  - Số tam giác và draw calls lấy từ `renderer.info.render`, đọc ở cuối khung (xưởng thêm cho mọi lớp).

### Lớp 2 · Ánh trăng: ánh sáng và chất liệu (`layers/l2-anh-trang.js`)
- **Thấy gì:**
  - Trăng đúng pha, có vùng biển tối (worley/fbm). Cường độ phát sáng lớn hơn 1 để bloom.
  - Ánh trăng bạc-ngà là `DirectionalLight` hướng từ trăng, cộng `HemisphereLight` (trời chàm, nước đen).
  - Cánh sen trắng ngà, ửng hồng nhạt ở đầu cánh, có **viền fresnel** và **sáng lên khi ngược sáng**. Lá có **clearcoat** bóng như sáp, gân lá vẽ bằng TSL.
  - Một **ngọn đèn hoa đăng** nhỏ (dùng lại hình cánh hoa) chứa `PointLight` ấm, **đổi màu được**. Đây là thí nghiệm "cùng một ánh sáng, khác chất liệu".
- **Kỹ thuật:**
  - Đèn và **một** shadow map (hoa và lá đứng đổ bóng lên lá nổi). Kích thước theo mức (cao 1024 / vừa 512 / thấp tắt), dùng PCF. Bóng được bật **một lần lúc dựng**, theo mức ban đầu; `castShadow`, `receiveShadow` và `shadowMap.enabled` không bao giờ đổi lúc chạy (§10).
  - `MeshPhysicalNodeMaterial` với `colorNode`, `emissiveNode`, `clearcoatNode`, `sheenNode`.
  - Fresnel `pow(1 − N·V, p)`; wrap lighting.
  - Hướng mặt trời giả cho đường phân sáng của trăng lấy từ `lib/astro/moon.js#sunDirection`.
- **Núm:** `moonPhase` (uniform, mặc định là đêm nay), `rimPower`, `rimColor`, `translucency`, `clearcoat` (uniform), `candleColor` (uniform), `candleIntensity` (js), `shadowMapSize` (js, 256–2048; mức thấp tắt bóng nên núm không làm gì), `shadowBias` (js).
  - (GĐ 2) ShadowNode đọc `mapSize` (setSize) và `bias`/`normalBias` (reference) mỗi khung, nên ba núm js này không biên dịch lại.
- **Phá:** *"Bias = 0"* (`biasZero`, xem shadow acne), *"Tắt fresnel"* (`noRim`), *"Đổi màu đèn"* (`redCandle`: đèn hoa đăng sang đỏ son). Số đo: `shadowMap` (cỡ shadow map).
- (GĐ 2) Wrap lighting để sau (§16): viền fresnel và ánh xuyên cánh (`translucency`) đã cho cánh cảm giác mỏng; wrap thật cần một lighting model riêng.
- (GĐ 3) Trăng đặt `material.fog = false`: sương không phủ lên trăng. Quầng trăng nằm trên vòm trời của lớp Sương.
- (GĐ 3) **Shadow map tĩnh:** `moonlight.shadow.autoUpdate = false`. Lớp đặt `shadow.needsUpdate = true` khi có thứ đổi: hướng trăng,
  độ nở hoa (`shared.cot.openness`), bố cục của Cốt (`shared.cot.version`: Cốt tăng số này mỗi lần ghi lại hình, hay đổi thứ nằm trong
  cache key như wireframe, normal phẳng, tắt instancing), cùng núm và thí nghiệm của chính lớp (cỡ map, bias). Trước GĐ 3, bóng được vẽ
  lại mỗi khung và vẽ HAI lần (camera chính và camera ảo của reflector, Phụ lục A.17); giờ chỉ vẽ khi cần (Phụ lục A.35). Lá nổi nhấp
  nhô theo sóng là thứ NHẬN bóng: nó tự tra shadow map theo vị trí của mình, không cần vẽ lại bóng.
- (GĐ 3) **Khung chiếu bóng ôm sát ao:** thay khung ±55 cố định bằng hộp bao của vùng có lá và hoa (bán kính vùng lá, cao vài đơn vị)
  chiếu vào không gian của đèn; tính lại khi hướng trăng đổi. Trăng thấp (4°–13°) nên chiều dọc của khung giảm từ 110 đơn vị còn
  khoảng 11–27: cùng cỡ map, bóng nét hơn 4–10 lần theo chiều đó.
- (GĐ 3) **Nấc `bong`:** trần `mapSize` chia đôi (tối thiểu 256) rồi vẽ lại bóng một lần; hiệu lực = min(núm `shadowMapSize`, trần).
  Mức thấp tắt bóng nên không đưa nấc này.

### Lớp 3 · Sương: bầu trời, noise, sương mù (`layers/l3-suong.js`)
- **Thấy gì:**
  - Vòm trời đổi dần từ chàm xuống đen then.
  - Sao sinh bằng hash, không dùng texture. Có quầng trăng và dải Ngân Hà mờ vẽ bằng fbm.
  - **Sương là là:** dày sát mặt nước, mỏng dần lên cao, trôi theo gió. Vuốt tay thì sương xoáy rồi lắng lại.
- **Kỹ thuật:**
  - Vòm trời là sphere `BackSide` có `colorNode`. Sương ở chân trời vẽ luôn trong `colorNode` đó.
  - **`scene.fogNode = fog(màuSương, hệSốSương)` được gán một lần** và không bao giờ gán lại hay đặt `null`, vì fogNode nằm trong cache key của mọi material.
  - Hệ số sương: `w3 × (1 − exp(−d × density × exp(−positionWorld.y × falloff) × (0.6 + 0.4 × noise3D(p × scale + wind × t))))`, với `d = positionView.z.negate()`.
  - Vòm trời, trăng và quầng trăng đặt `material.fog = false`.
  - Hàm hệ số sương được công bố qua `shared.suong.fogFactor`. Lớp 5 nhân `emissiveNode` của đom đóm với `(1 − hệSốSương)`, vì sương không tác động lên kênh MRT `emissive`.
  - `Fn()` noise/fbm dùng chung nằm ở `lib/tsl/noise.js`, lớp 5 cũng dùng.
- **Núm:** `density`, `heightFalloff`, `noiseScale` (uniform), `octaves` (uniform, 1–5; GĐ 3 đổi từ rebuild, xem dưới), `windStrength`, `starDensity`, `haloSize` (uniform).
- **Phá:** *"Xem noise thô"* (`rawNoise`: hiện hệ số sương dạng ảnh xám), *"Chỉ 1 octave"* (`oneOctave`, kiểu compare: so chi tiết và số ms với số octave của núm; GĐ 3 thay cho "Octave 1 vs 5").
- (GĐ 3) **File:** `layers/l3-suong.js` (dựng lớp, núm, thí nghiệm, nấc), `parts/suong-troi.js` (màu vòm trời: hàm `sky(dir)`),
  `parts/suong-mu.js` (hệ số sương, xoáy khi vuốt, màu sương).
- (GĐ 3) **Vòm trời:** `SphereGeometry` bán kính 300 (trăng ở 160 nằm bên trong; camera far 500), `BackSide`, `MeshBasicNodeMaterial`,
  `fog = false`, `depthWrite = false`, `renderOrder = −1`, `emissiveNode = vec3(0)` (trời không bloom).
  `colorNode = mix(denThen, sky(hướng), w3)`: trọng số 0 là nền đen then (luật 3). Hàm `sky(dir)`:
  - dải màu theo poster: chàm ở đỉnh, xuống đen then ở chân trời; dưới chân trời là màu sương, nên mép ao tan vào trời;
  - chạng vạng còn ấm ở chân trời, gần sáng chàm nhạt dần: đọc `shared.hour` (GĐ 4 gắn thanh giờ vào đúng uniform này);
  - sao: chia hướng nhìn thành lưới ô, mỗi ô có một sao khi `hash(ô) > 1 − starDensity`; sao nhấp nháy theo `ctx.u.time`, mờ dần
    về chân trời và khi gần trăng;
  - quầng trăng vàng lá quanh `shared.moon.dir`, rộng theo `haloSize`;
  - dải Ngân Hà: một vành quanh một đường tròn lớn của bầu trời, độ sáng theo fbm 2 octave, rất mờ.
- (GĐ 3) **Màu sương:** bạc lá pha chàm, tối; sáng lên và ngả vàng lá khi hướng nhìn gần hướng trăng (sương tán xạ ánh trăng về phía trước).
- (GĐ 3) **`octaves` là uniform, không phải rebuild.** `NodeManager.getCacheKey` gộp `fogNode.getCacheKey()` vào cache key của mọi
  render object (Phụ lục A.33): đổi đồ thị của sương là biên dịch lại MỌI material. Vì vậy `fbm(p, { octaves })` của `lib/tsl/noise.js`
  nhận thêm một node làm số octave: khi đó shader có vòng lặp thật (`Loop` tối đa 5 lần, `Break` khi đủ), và đổi số octave không
  biên dịch lại. Nhờ vậy "Chỉ 1 octave" đo ms không dính cú khựng biên dịch, và lớp có được nấc hạ chất lượng `chi-tiet`.
  Truyền số JS thì `fbm` vẫn khai triển lúc dựng như trước (trăng của lớp Ánh trăng dùng cách này).
- (GĐ 3) **Vuốt tay:** `shared.js` giữ một "xoáy" (`shared.swirl`: tâm trên mặt nước, lúc bắt đầu, chiều và độ mạnh theo vận tốc vuốt).
  Hệ số sương xoay miền noise quanh tâm đó một góc giảm dần theo `exp` của thời gian và của khoảng cách: sương xoáy rồi lắng lại.
  Vuốt vẫn không dời điểm hút của đom đóm.
- (GĐ 3) **Công bố:** `shared.suong = { fogFactor, sky }`. Vàng lá dùng `fogFactor`. Mặt nước dùng `sky` cho phản chiếu giả ở mức thấp,
  và `fogFactor` để làm mờ ánh lóe trên nước.
- (GĐ 3) **"Xem noise thô":** sương thành `fog(mix(màu, vec3(noise), raw), mix(hệ số, 1, raw))`: mọi bề mặt có sương hiện noise xám.
  Công tắc là uniform, không biên dịch lại. Vòm trời, trăng, đom đóm không có sương nên vẫn như cũ.
- (GĐ 3) **Số đo:** `octaves` (số octave đang chạy = min(núm, trần)).
- (GĐ 3) **Nấc `chi-tiet`:** trần số octave về 1.
- (GĐ 3) **Trần núm theo mức** (§10): ở mức thấp, `octaves` kéo tối đa 3.
- (GĐ 3) **Thơ của lớp:** *"Đêm qua ra đứng bờ ao / Trông cá cá lặn, trông sao sao mờ"* (ca dao).

### Lớp 4 · Mặt nước: phản chiếu và gợn sóng (`layers/l4-mat-nuoc.js`)
- **Thấy gì:**
  - **Mặt nước là một đĩa phẳng bán kính khoảng 60, thuộc lớp này.** Ở trọng số 0, đĩa là đất sét.
  - Nước đen bóng như sơn, soi trăng, sen và trời.
  - Chạm vào thì gợn sóng lan ra, bóng trăng **bị xẻ đôi**, lá sen nhấp nhô khi sóng đi qua.
- **Kỹ thuật:**
  - Phản chiếu bằng `reflector({ resolutionScale })`: cao 0.5 / vừa 0.35.
    - Gọi `refl.target.rotateX(−π/2)` rồi **`scene.add(refl.target)`**, và gỡ nó ra trong `dispose`. Reflector đọc `target.matrixWorld` mà không tự cập nhật, nên target nằm ngoài scene sẽ cho một gương dựng đứng.
    - Đổi `refl.reflector.resolutionScale` lúc chạy có hiệu lực ngay.
    - Reflector tự ẩn material của chính nó và render cảnh **không có MRT**.
  - UV phản chiếu lệch theo normal: `refl.uvNode = refl.uvNode.add(normal.xz × distortion)`. Normal lấy từ 2 lớp noise trôi cộng trường gợn sóng.
  - Pha giữa phản chiếu và màu nước sâu bằng Schlick fresnel.
  - **Gợn sóng (GĐ 1):**
    - `uniformArray` 8 phần tử `vec4(x, z, startTime, amp)` dùng như ring buffer. Chỉ cần sửa `array[i]`, three tự tải lại mỗi khung.
    - **Một hàm TSL `rippleHeight(xz)` dùng chung**, nằm trong `shared.js` của bức, cho normal của nước lẫn độ nhấp nhô của lá.
    - Lá đọc attribute tâm instance của lớp 1. Trong r186, `positionNode` chạy **sau** instancing.
  - `emissiveNode` của nước lấy phần sáng vượt ngưỡng trong ảnh phản chiếu, nên bóng đom đóm và bóng trăng trên nước cũng bloom nhẹ. Đây là cách duy nhất, vì ảnh phản chiếu không có kênh emissive.
  - (GĐ 1) Nước là `MeshStandardNodeMaterial` (có chiếu sáng, nên trọng số 0 là đất sét như mọi hình khác). Ảnh phản chiếu cộng
    vào qua `emissiveNode`; `mrtNode` ghi kênh `emissive` riêng (chỉ phần vượt ngưỡng). Độ nhám rất thấp trên pháp tuyến gợn làm
    specular của ánh trăng (lớp 2) thành lối trăng lấp lánh, tự tắt khi lớp Ánh trăng tắt.
- **Mức thấp:** "phản chiếu giả" bằng màu trời cộng vệt trăng tính theo công thức, không render cảnh lần thứ hai.
  - (GĐ 3) Mức thấp (`budget.reflection === 0`) không tạo reflector. Phản chiếu giả = `shared.suong.sky(hướng phản xạ)` cộng đĩa trăng
    phản xạ: `pow(saturate(dot(hướng phản xạ, hướng trăng)), độ gắt)` nhân màu trăng và trọng số của lớp Ánh trăng. Pháp tuyến gợn và
    noise làm đĩa trăng vỡ thành lối trăng lấp lánh, đúng cách lối trăng thật hình thành. Ở mức này, núm `reflectionResolution` và
    thí nghiệm "Độ phân giải 0.1" không làm gì; số đo `reflectionScale` là 0. Không có sen, lá hay đom đóm trong nước: đó là cái giá.
- (GĐ 3) Ánh lóe trong kênh `emissive` (`mrtNode`) nhân `(1 − shared.suong.fogFactor)`: bóng trăng ở xa trong sương không bloom xuyên sương.
- (GĐ 3) **Nấc `phan-chieu`:** trần độ phân giải phản chiếu nhân 0,5 (tối thiểu 0,15); hiệu lực = min(núm, trần). Mức thấp không có nấc này.
- (GĐ 3) **Trần núm theo mức** (§10): `reflectionResolution` tối đa 1 ở mức cao, 0,6 ở mức khác (vẽ cả cảnh lần hai ở độ phân giải đầy đủ là quá sức máy yếu).
- **Núm:** `amplitude`, `speed`, `decay`, `wavelength`, `distortion`, `fresnelPower` (uniform), `reflectionResolution` (js, 0.1–1).
- **Phá:** *"Độ phân giải 0.1"* (`lowRes`, phản chiếu vỡ hạt), *"Tắt fresnel"* (`noFresnel`), *"Xem heightfield"* (`heightfield`: ảnh xám của độ cao gợn). Hai thí nghiệm sau là uniform bên trong node, không biên dịch lại. Số đo: `reflectionScale`.

### Lớp 5 · Vàng lá: đom đóm tính trên GPU (`layers/l5-vang-la.js`)
- **Thấy gì:**
  - Đom đóm vàng lá trôi lững lờ theo dòng curl-noise. Mỗi con nhấp nháy theo nhịp riêng và có bóng phản chiếu run run trên nước.
  - Giữ tay thì chúng tụ lại và bay vòng quanh, thả ra thì chúng bung ra như tia lửa lò rèn.
  - Ở trọng số 0 đom đóm tắt hẳn.
- **Kỹ thuật:**
  - Hai bộ đệm `instancedArray(MAX, 'vec4')`: `posPhase` (xyz + pha) và `velSeed` (vận tốc + hạt giống).
    - Mỗi kernel dùng **tối đa 4 bộ đệm**, vì WebGL2 chạy compute qua transform feedback, và SwiftShader đo được giới hạn là 4.
    - Cấp phát theo mức tối đa một lần. Lúc chạy chỉ đổi `computeNode.count` và `sprite.count`.
  - Mỗi khung chạy `renderer.compute(stepNode)`. Kernel chỉ đọc và ghi phần tử của chính nó, vì trên WebGL2 `element(i)` luôn trả phần tử của chính invocation.
  - Curl noise tính bằng sai phân của noise 3D (`lib/tsl/noise.js`).
  - Điểm hút là giao điểm của tia từ con trỏ với mặt phẳng nước, có độ giảm mềm. Tia lấy từ `Gesture.ray`; phép giao do bức tự làm.
  - Nhấp nháy: `smoothstep(sin(t·rate + phase))`, với `t` là `ctx.u.time`.
  - **Hiển thị:**
    - `Sprite` với `SpriteNodeMaterial`, `positionNode = posPhase.toAttribute().xyz`, `sprite.count = N`, `frustumCulled = false`.
    - `AdditiveBlending`, `depthWrite = false`.
    - `emissiveNode` nhân với trọng số và với `(1 − hệSốSương)`.
    - Pipeline của xưởng đặt `setBlendMode('emissive', new BlendMode(MaterialBlending))`, để các con cộng dồn thay vì đè lên nhau.
- **Số lượng:**
  - Mặc định cao 3.000 / vừa 1.500 / thấp 600.
  - Núm cho tăng tới 200k trên WebGPU và 20k trên WebGL2 (`max` theo tầng của núm).
- **Biến thể CPU (GĐ 3):** cùng luật đó chạy trên JS, ghi vào `InstancedBufferAttribute` (tối đa 5k) qua `instancedDynamicBufferAttribute(attr)`. Dùng cho thí nghiệm *"CPU vs GPU"* (`kind: 'compare'`), có biểu đồ ms. Đây cũng là đường lùi chính thức nếu compute trên WebGL2 của máy thật gặp lỗi.
- **Núm:** `count` (js), `flowScale`, `speed`, `attraction`, `blinkRate`, `size`, `glow` (uniform).
  - (GĐ 2) Đã có `size`, `glow`, `attraction` và `count`. Bộ đệm cấp phát theo trần của tầng (200k / 20k) một lần; `count` chỉ đổi `computeNode.count` và `sprite.count`. `count` tối thiểu 100: sprite có `count > 1` nằm trong cache key của three.
- **Phá:** *"CPU vs GPU"*, *"Tắt additive"* (thấy lỗi thứ tự vẽ).
- (GĐ 3) **Dòng bay:** hướng muốn bay = `curl(p × flowScale + trôi theo t) × speed`, cộng xoáy chậm quanh tâm ao; lực hút của tay giữ như
  GĐ 1. `curl(p)` (`lib/tsl/noise.js`) là curl của trường `mx_noise_vec3`, tính bằng sai phân trung tâm: trường không phân kỳ, nên đàn trôi
  thành những dòng xoáy mà không dồn về một chỗ. Núm mới `flowScale`, `speed`, `blinkRate` (uniform).
- (GĐ 3) **Trong sương:** sprite đặt `fog = false` và nhân emissive với `(1 − fogFactor)`. `fog` của three trộn MÀU ĐẦU RA về màu sương
  (Phụ lục A.34); với `AdditiveBlending`, mỗi con sẽ cộng thêm một đĩa màu sương lên cảnh.
- (GĐ 3) **Trọng số 0:** không chạy compute và giấu sprite (`visible = false`, không nằm trong cache key): không tốn draw call.
- (GĐ 3) **Biến thể CPU** (`parts/vang-la-cpu.js`): cùng luật bay viết bằng JS (noise gradient 3D, curl bằng sai phân), tối đa 5.000 con,
  ghi vào một `InstancedBufferAttribute` mà material đọc qua `instancedDynamicBufferAttribute`. Một Sprite thứ hai (material cùng
  công thức) được dựng khi thí nghiệm bật lần đầu (Promise → "đang dựng…"); từ đó bật/tắt chỉ đổi sprite nào hiện và phía nào tính.
  Đàn CPU xuất phát từ hạt giống riêng (`lib/random.js`), không đọc ngược bộ đệm GPU.
- (GĐ 3) **Thí nghiệm:** *"CPU vs GPU"* (`cpu`, kiểu compare: ms CPU lộ ngay phần việc của JS) và *"Tắt additive"* (`noAdditive`: blending
  Normal + `needsUpdate`, biên dịch lại một lần như "Normal phẳng"; con đang tắt thành đốm tối, con vẽ sau đè con vẽ trước).
- (GĐ 3) **Số đo:** `count` (số con đang vẽ = min(núm, trần); ở chế độ CPU còn kẹp ở 5.000).
- (GĐ 3) **Nấc `dom-dom`:** trần số con = nửa số mặc định của mức (tối thiểu 100).
- (GĐ 3) **Trần núm theo mức** (§10): `count` tối đa = min(trần của tầng, trần của mức): cao 200.000, vừa 50.000, thấp 10.000;
  WebGL2 không quá 20.000. Bộ đệm cấp phát theo đúng trần đó.
- (GĐ 3) **Đường lùi:** biến thể CPU hiện chỉ bật tay qua thí nghiệm. Tự phát hiện compute WebGL2 hỏng trên máy thật để sau (§16).

### Lớp 6 · Phủ bóng: hậu kỳ (lớp dùng chung `src/engine/stock/phu-bong/`)
Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về kỹ thuật. Bức nào cũng lắp được, qua `post` của hợp đồng lớp (§8.4). Xưởng lo phần chuyển màu cuối: `renderer.toneMapping` luôn là `NoToneMapping`, `renderPipeline.outputColorTransform = false`, và `renderOutput` được chèn giữa hai chặng `build` và `display`.

- **Thấy gì:**
  - Chỉ những thứ có emissive mới bloom.
  - Tone mapping AgX giữ lại chi tiết vùng sáng.
  - **LUT "sơn mài"** làm vùng tối ấm về nâu cánh gián, vùng sáng ánh vàng lá, chàm hơi ngả.
  - Thêm grain nhẹ, vignette và FXAA.
- **`build`** (HDR tuyến tính vào, ra):
  1. `hdr = color + bloom(channel('emissive'), bloomStrength, bloomRadius, bloomThreshold) × w`. Bloom (`three/addons/tsl/display/BloomNode.js`) nhận uniform của núm làm tham số và tốn 12 draw call mỗi khung. Cách làm theo example `webgpu_postprocessing_bloom_emissive`.
  2. **Tone mapping chọn bằng uniform, viết bằng `Fn` + `.toVar()` + `If`, không dùng `select()`.** Trong r186, `select()` sinh `if/else`: node nào dựng lần đầu trong một nhánh rồi dùng lại bên ngoài (ví dụ `hdr.a`) sẽ đọc biến chưa gán, và alpha bằng 0.
     ```js
     const toned = Fn(() => {
       const h = hdr.toVar();                              // vật chất hóa TRƯỚC mọi nhánh
       const c = h.rgb.mul(uExposure).toVar();             // 'none'
       If(uTone.equal(1), () => { c.assign(agxToneMapping(h.rgb, uExposure)); })
       .ElseIf(uTone.equal(2), () => { c.assign(acesFilmicToneMapping(h.rgb, uExposure)); });
       return vec4(mix(h.rgb.mul(uExposure), c, w), h.a);
     })();
     ```
     Đã kiểm: +0 program khi đổi `uTone`, ảnh đúng trên cả hai backend. GĐ 0 chỉ có AgX, trộn theo `w`, cũng viết trong `Fn` với `.toVar()`.
- **`display`** (màu sRGB vào, ra; GĐ 4): `lut3D` với LUT 32³ **sinh bằng code** từ bảng màu đã ghép (`Data3DTexture` phải đặt `LinearFilter`), rồi grain tự viết (trung bình bằng 0, không dùng `film()`), rồi vignette bằng TSL, rồi `fxaa()` cuối cùng (FXAA cần đầu vào sRGB, tốn thêm 1 draw call). Mọi hiệu ứng đều trộn theo `w`.
- **Khi `w6` = 0:** không bloom, không LUT, không grain, tone `none`. Tất cả là phép trộn trong cùng một đồ thị. Người xem thấy ảnh HDR bị cháy trắng, và đó chính là bài học.
- **Tap cho công cụ (GĐ 4):** `tap('truoc-tone', hdr)` và `tap('truoc-bloom', color)` sinh ra các view `phu-bong:truoc-tone` và `phu-bong:truoc-bloom`.
- **Núm:** `bloomStrength`, `bloomRadius`, `bloomThreshold`, `toneMapping` (uniform chọn: none/AgX/ACES), `exposure`, `lutIntensity`, `grain`, `vignette`, tất cả là uniform. GĐ 0 có `bloomStrength` và `exposure`; GĐ 2 có đủ núm của chặng `build`; ba núm cuối đi cùng chặng `display` ở GĐ 4.
  - (GĐ 2) `bloom()` giữ nguyên node được truyền vào làm strength/radius/threshold, nên ba núm bloom là uniform thật.
- **Nấc:** `bloom` nhân `resolutionScale` hiện tại với 0.5 (mặc định lấy `ctx.budget.bloom ?? 0.5`).
  (GĐ 3) `BloomNode` đọc `resolutionScale` và đặt lại cỡ render target mỗi khung (Phụ lục A.36), nên nấc này không biên dịch lại.
- **Phá:** *"Bloom cả khung vs chọn lọc"* (bloom lên cả output thì ảnh bết), *"Tắt tone mapping"*, thanh trượt so sánh trước/sau.
  - (GĐ 2) Có *"Bloom cả khung"* (`wholeFrame`: đầu vào của bloom là `mix(emissive, output, uniform)`). "Tắt tone mapping" là núm `toneMapping = none`; thanh trượt trước/sau đi cùng Kính mài (GĐ 4).
- **Nội dung (Hiểu/Phá) của lớp dùng chung viết trung tính** với mọi bức. Ví dụ riêng của một bức thì bức đó ghi đè khi import (§8.6).

## 7. Công cụ học

### Kính mài (công cụ của xưởng, `engine/tools/kinh-mai.js`, GĐ 4)
- **Uniform:** `uLensPos` (tọa độ màn hình), `uLensRadius`, `uLensMode`.
- **Chế độ:** lấy từ `pipeline.views()`, không liệt kê cứng. Có `final`, `emissive`, `normal`, `depth`, cộng các tap của lớp.
- **Ghép:** `mix(final, view, 1 − smoothstep(r − feather, r, dist))`, cộng một viền vàng lá.
  - Overlay đặt **sau** chặng `display` (sau FXAA) và được ghép **một lần** khi dựng pipeline.
  - Chọn chế độ bằng `If` bên trong `Fn`, không dùng `select()`.
  - View tuyến tính đi qua `renderOutput(…, NoToneMapping)` trước khi trộn, nên `views()` luôn trả node ở không gian hiển thị.
- **View chưa sẵn sàng:** `view(id)` trả một node giữ chỗ. `requireView('normal')` làm theo thứ tự: thêm `normal: packNormalToRGB(normalView)` vào MRT, rồi `getTextureNode('normal')`, rồi dựng lại `outputNode`, rồi `needsUpdate = true`. Việc này biên dịch lại một lần, trong lúc đó hiện chữ "đang mài…". Depth lấy từ `scenePass.getLinearDepthNode()`.
- **Cử chỉ:** công cụ đang bật nhận cử chỉ trước. Nếu công cụ trả `true` thì cử chỉ dừng ở đó, không chuyển cho bức. Nhờ vậy, trên điện thoại, khi bật kính thì chạm dùng cho kính; lúc khác chạm dùng cho mặt nước.

### Lột lớp (`engine/tools/lot-lop.js`, GĐ 4)
- Thanh trượt đi ngược danh sách view.
- Thứ tự view: `final`, các tap theo thứ tự ngược pipeline, rồi `emissive`, `normal`, `depth`. Với Bức 1 là *Ảnh cuối → Trước tone → Trước bloom → Chỉ emissive → Normal → Depth*.
- Nhãn lấy từ `content.layers[id].taps` và `t` (§8.2).

### Núm của bức: thanh "giờ" của Bức 1 (`uHour`, 18.0 → 29.5, tức 05:30)
Đây là **Dial** do `paintings/ao-sen-dem/shared.js` khai báo. Xưởng chỉ vẽ thanh trượt (`ui/dials.js`, GĐ 4).
- **Điều khiển:**
  - Độ cao và phương vị của trăng: mọc phía đông lúc chạng vạng, cao nhất lúc nửa đêm, lặn phía tây trước khi sáng.
  - Dải màu trời: chạng vạng còn ấm ở chân trời, gần sáng thì chàm nhạt dần.
  - Màu sương, hướng và cường độ ánh trăng.
- **Mặc định:** `shared.js` gọi `tonight(ctx.now)` của `lib/astro/moon.js`, nhận `{ instant, isNight, evening }`.
  - Nếu là đêm: `uHour = hourOfNight(instant, evening)` (ví dụ 21 hoặc 26).
  - Nếu là ngày: `uHour = 21`, kèm ghi chú `daytime`.

  Cách quy đổi sang thang 18–29,5 và mặc định 21:00 là chính sách của Bức 1, không nằm trong hộp màu.

### Code sống (GĐ 2)
- Vite plugin `plugins/vite-plugin-code-view.js` (tự viết, nằm trong repo) biến import `?code` thành HTML đã highlight bằng **Shiki 4 lúc build**. Mỗi dòng mang `data-line`, và plugin kèm bảng tra `knobId → [dòng]`.
  - Module `?code` là `{ html, knobs }`. Theme Shiki làm từ bảng màu sơn mài (nền đen then, chữ ngà, từ khóa vàng lá…); mọi màu chữ đạt tương phản ≥ 4.5:1, test giữ.
  - `ui/code-view.js` là nơi DUY NHẤT dùng `import.meta.glob`: `paintings/*/layers/*.js`, `paintings/*/parts/*.js`, `engine/stock/*/layer.js`, trừ `_mau`. Glob không eager: mỗi file một chunk nhỏ, chỉ tải khi tab Chỉnh mở. Test hợp đồng kiểm mọi file trong `LayerMeta.files` của bức đã deploy đều nằm trong glob (`hasCode`).
  - Rê một núm: khung code chuyển sang file có marker của núm, làm sáng các dòng đó và chỉ cuộn RIÊNG khung code (cuộn cả Sổ tay sẽ kéo núm ra khỏi con trỏ).
- **Núm khai báo tĩnh (từ GĐ 0):** mỗi file lớp có `export const knobs = [...]`. Test đọc được danh sách này mà không cần GPU.
- **Marker (từ GĐ 0):**
  - Núm `uniform`: `// @knob <id>` ở dòng dùng uniform đó.
  - Núm `js`/`rebuild`: marker ở dòng xử lý `onKnob[id]`.

  Marker chỉ hợp lệ trong các file mà lớp sở hữu (`LayerMeta.files`). Id núm có phạm vi trong lớp. Địa chỉ đầy đủ `layerId.knobId` là API công khai.
- **Test (tĩnh):** trong các file của một lớp, tập marker phải bằng đúng tập `knobs.map(k => k.id)`.

### Huy hiệu và chế độ thợ
- **Huy hiệu:** hiện tầng thật và mức chất lượng, có `data-backend`. Chạm vào để xem giải thích bằng tiếng Việt.
- **`?debug` (GĐ 1):** `engine/gpu/debug.js` gọi `import()` động `three/addons/inspector/Inspector.js`. Không import tĩnh được, vì Inspector dùng `localStorage`.
- **`?debug=stats` (GĐ 1):** `import()` động `stats-gl`, `await stats.init(renderer)`, và mỗi khung gọi `renderer.resolveTimestampsAsync()`. Không bật cùng lúc với Inspector.

## 8. Kiến trúc

### 8.1 Ba vùng và cây thư mục
**Ba vùng:**
- **Xưởng** (`src/engine/` + `src/ui/`) không biết có bức nào.
- **Hộp màu** (`src/lib/`) là "lá": không import xưởng, không import tranh.
- **Các bức** (`src/paintings/<slug>/`) độc lập với nhau.

**Ký hiệu trong cây:** `[0]` là file có từ GĐ 0. `[0→4]` là file có từ GĐ 0 ở dạng thô và hoàn chỉnh ở GĐ 4. `[2]` là file xuất hiện từ GĐ 2.

```
son-mai-anh-sang/
  index.html                         [0] trang Bức 1: poster, tên, thơ, [data-seal], [data-badge], [data-static]; [1]: [data-moon]
  vite.config.js                     [0] base '/son-mai-anh-sang/'; input = các trang trong registry; tách chunk 'three'
  vitest.config.js playwright.config.js   [0]
  package.json .nvmrc .gitignore CLAUDE.md LICENSE   [0]
  README.md                          [0→4] GĐ 4 thêm mục "Thêm một bức tranh mới"
  .github/workflows/deploy.yml       [0] test → build → e2e → deploy Pages
  public/
    favicon.svg                      [0]
    paintings/ao-sen-dem/poster.svg  [0] poster tạm: SVG viết tay trong repo, ≤ 10 KB
    paintings/ao-sen-dem/poster.webp [4] poster thật ≤ 150 KB, chụp từ cảnh
    paintings/ao-sen-dem/og.png      [4]
  plugins/
    vite-plugin-code-view.js         [2] import '?code' → HTML Shiki có data-line + bảng knobId → dòng
  scripts/
    poster.js                        [4] Playwright chụp ?at&freeze=N&poster cho một slug
  src/
    engine/                          XƯỞNG: không biết bức nào tồn tại
      boot.js                        [0] khởi động một bức: cờ URL → tầng → tĩnh | import('./gpu/run.js')
      flags.js                       [0→3] đọc cờ URL (§8.7), hàm thuần; GĐ 3: ?level
      tier.js                        [0] dò tầng A/B/C, hàm thuần nhận env
      quality.js                     [0→3] GĐ 0: chọn mức, mức mặc định, isMobile; GĐ 3: bộ điều chỉnh có trễ (hàm thuần, không three)
      palette.js                     [0] 10 token; ghép phần ghi đè của bức (hàm thuần, không three)
      deadline.js                    [0] withDeadline(): hạn 10 s cho khởi động (hàm thuần)
      sma.js                         [0→2] window.__sma: state, tier, backend, level, frames, reason; GĐ 2: expose()
      static.js                      [0→2] tầng C theo lý do; GĐ 2: Sổ tay chỉ đọc (import() động ui/workshop.js)
      contracts/painting.js          [0] JSDoc hợp đồng NHẸ
      contracts/runtime.js           [0→2] JSDoc hợp đồng NẶNG
      gpu/                           PHẦN NẶNG: chỉ tải ở tầng A/B
        run.js                       [0→2] vòng đời: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ; GĐ 2: mất GPU lần đầu → dựng lại
        scene.js                     [2] dựng MỘT cảnh trên một sân khấu (ctx → setup → lớp → pipeline → input → bàn thợ) + một khung
        ladder.js                    [3] thang nấc cụ thể: 'dpr' nở thành nhiều nấc −0,25; '<lớp>.<nấc>' lấy từ layer.degrade
        stage.js                     [0] renderer, nền đặc, camera + OrbitControls theo CameraSpec, đồng hồ, resize, DPR, lỗi GPU
        disposer.js                  [0] đăng ký mọi thứ đã tạo, gỡ theo thứ tự ngược
        pipeline.js                  [0→4] scene pass + MRT; build → renderOutput → display; alpha 1; views(); overlay
        layers.js                    [0→2] trọng số (GĐ 2: tween), createCtx, dựng lớp theo thứ tự + nối onKnob, lưới an toàn emissive
        knob-set.js                  [2] bộ núm của một lớp: uniform có tên hợp lệ, giá trị đã chuẩn hóa, get/set/values, onKnob
        studio.js                    [2→3] bàn thợ: API duy nhất cho Sổ tay và __sma (trọng số, núm, thí nghiệm, số đo, snapshot); GĐ 3: compare, ms CPU, nấc
        input.js                     [1] pointer → cử chỉ + tia; công cụ trước, bức sau; 'drag' cho camera
        debug.js                     [1→2] ?debug → Inspector; ?debug=stats → stats-gl (import động); GĐ 2: openDebug không bao giờ ném
        gesture.js                   [1] phân loại cử chỉ (hàm thuần): tap / hold-* / swipe; kéo là của camera
        breath.js                    [1] camera "thở": breathAmplitude, breathOffset (hàm thuần)
      stock/phu-bong/                LỚP DÙNG CHUNG "Phủ bóng"
        meta.js                      [0] { id: 'phu-bong', name: 'Phủ bóng', files } (dữ liệu thuần)
        layer.js                     [0→4] build: bloom chọn lọc + tone (GĐ 2: chọn bằng If, đủ núm); GĐ 4: display (LUT, grain, vignette, FXAA) + tap
        lut.js                       [4] LUT 32³ sinh từ bảng màu đã ghép
        content.vi.js diagram.svg    [2] Hiểu/Phá/nhãn, viết trung tính; sơ đồ import '?raw'
      tools/
        index.js                     [4] [kinhMai, lotLop]; thêm công cụ = thêm 1 dòng
        kinh-mai.js lot-lop.js       [4]
    lib/                             HỘP MÀU: hàm "lá", chỉ trả SỐ
      random.js                      [0] PRNG có hạt giống (mulberry32)
      astro/lunar.js                 [0] âm lịch Hồ Ngọc Đức (tz tham số, mặc định +7); canChiIndex
      astro/moon.js                  [0] tuổi trăng, độ sáng, tonight(), hourOfNight(), sunDirection()
      tsl/noise.js                   [1] fbm; [3] thêm curl, và fbm nhận số octave là node (vòng lặp thật trong shader)
    ui/                              DOM thuần: không three, không import engine/; nhận t qua tham số
      strings.vi.js                  [0] export default t: chữ của xưởng, bảng tên tháng/can/chi, formatSeal()
      shell.js                       [0] poster ↔ canvas, data-state, con dấu, hòa dần; [1]: gợi ý, lời mời "{n} lớp"
      badge.js                       [0→3] huy hiệu tầng + mức, data-backend; GĐ 3: "hạ {n} nấc", data-steps
      moon-svg.js                    [1] vẽ trăng đúng pha vào [data-moon] nếu trang có ô đó
      workshop.js                    [2] thanh lớp + Sổ tay + chế độ mài; nhận studio() (null ở tầng tĩnh: chỉ đọc)
      layer-rail.js notebook.js notebook-pages.js code-view.js dom.js   [2]; GĐ 3: notebook-pages.js vẽ hai cột "Tắt / Bật" của compare
      knobs.js                       [2] Tweakpane; chỉ được import() động khi tab Chỉnh mở lần đầu
      dials.js                       [4] thanh trượt cho các Dial của bức
    styles/ tokens.css shell.css     [0]   notebook.css [2] (shell.css @import)
    paintings/
      registry.js                    [0] SITE + [{ meta, page, lang }]. Node đọc được; trình duyệt KHÔNG import
      _mau/                          [2] tranh mẫu 2 lớp (Cốt + Tô màu), KHÔNG deploy: fixture cho test + khuôn để copy
      ao-sen-dem/                    BỨC 1
        meta.js                      [0] căn cước + fence (từ vựng của bức)
        index.js                     [0] cửa vào nhẹ: export default { meta, load, content }
        painting.js                  [0→4] layers[], camera, quality, setup()
        shared.js                    [1→3] giờ (Dial 'gio'), ripples[8], rippleHeight(), moonDir, wind, onGesture; GĐ 3: swirl (vuốt → sương xoáy)
        quality.js                   [3] bảng cao/vừa/thấp của bức + ladder
        content.vi.js                [1→2] gợi ý (GĐ 1); Hiểu/Phá/Đọc thêm, nhãn tra theo id (GĐ 2)
        layers/l1-cot.js             [0→1] GĐ 0: lá instanced thô + đèn xưởng
        layers/l2-anh-trang.js       [1]
        layers/l3-suong.js           [3] vòm trời + sương là là; parts/suong-{troi,mu}.js [3]
        layers/l4-mat-nuoc.js        [0→3] GĐ 0: đĩa nước + reflector thô; GĐ 3: phản chiếu giả ở mức thấp
        layers/l5-vang-la.js         [0→3] GĐ 0: sprite compute thô; GĐ 3: curl, biến thể CPU (parts/vang-la-cpu.js)
        parts/cot-{leaf,flower,reeds}.js       [1→2] của lớp Cốt (lá, hoa nở bằng uniform, cuống + lau); GĐ 2: cấp phát theo trần, ghi lại
        parts/cot-lab.js             [2] của lớp Cốt: thí nghiệm "Tắt instancing", đếm đỉnh
        parts/anh-trang-{moon,paint}.js        [1] của lớp Ánh trăng (trăng, chất liệu)
        diagrams/*.svg               [2] sơ đồ của tab Hiểu (content.vi.js import '?raw')
  tests/
    unit/                            [0] flags tier quality palette tokens-css random lunar moon strings deadline disposer layers source
    rules/imports.test.js            [0] luật ranh giới, đường nhẹ, hàng rào từ vựng
    rules/files.test.js              [0] dòng 1 là chú thích, số dòng, API cấm
    paintings/contract.test.js       [0→2] lặp qua registry (+ _mau từ GĐ 2)
    helpers/source.js                [0] phân tích mã bằng parseSync của vite
    helpers/fake-ctx.js              [1→2] Scene/Camera/uniform thật, renderer giả (Proxy ghi lời gọi); dựng ctx bằng createCtx của xưởng
    helpers/svg.js                   [2] đọc mã màu trong SVG (poster, sơ đồ)
  e2e/
    helpers.js                       [0] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU
    painting.spec.js                 [0→4] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại
    ao-sen-dem.spec.js               [1→3] chạm mặt nước thì ảnh đổi (so ở cùng ?freeze=N); GĐ 3: vuốt, draw call, ?level=thap, CPU vs GPU
```

### 8.2 Luật hướng phụ thuộc (test giữ)

| Từ ↓ được import → | `three*` | npm khác | `lib/` | `engine/*.js` (nhẹ) | `engine/stock/` | `engine/gpu`, `tools` | `ui/` | `paintings/` |
|---|---|---|---|---|---|---|---|---|
| `lib/` | chỉ `lib/tsl` | ✘ | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ |
| `engine/*.js`, `contracts/` | ✘ | ✘ | `astro`, `random` | ✔ | ✘ | chỉ `import()` động (boot.js) | ✔ | ✘ |
| `engine/gpu/`, `engine/tools/` | ✔ | chỉ `import()` động: `stats-gl`, inspector | ✔ | ✔ | ✘ | ✔ | ✔ (`knobs.js` chỉ `import()` động) | ✘ |
| `engine/stock/<id>/` | ✔ | ✘ | ✔ | ✘ (màu qua `ctx.palette`, kiểu qua JSDoc `import()`) | chỉ thư mục mình | ✘ | ✘ | ✘ |
| `ui/` | ✘ | chỉ `ui/knobs.js` → `tweakpane` | `astro` | ✘ | ✘ | ✘ | ✔ | ✘ |
| `paintings/<slug>/` | ✔ | ✘ | ✔ | ✘ (kiểu qua JSDoc `import()`) | ✔ | ✘ | ✘ | **chỉ thư mục mình** |
| `paintings/registry.js` | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | chỉ `*/meta.js` |

**Các luật kèm theo** (`tests/rules/imports.test.js`):
- **Ngoại lệ glob:** `ui/code-view.js` (GĐ 2) được glob `?code` trên `paintings/*/` (trừ `_mau`) và `engine/stock/`. `import.meta.glob` chỉ được dùng ở đó, và luôn kèm `?code`.
- **`@fontsource/*`** chỉ được import từ file `.css`.
- **Chữ giao diện:** không file nào trong `src/` import `ui/strings.*.js`.
  - Chỉ trang HTML import file đó, rồi truyền `{ lang, t }` vào `boot`.
  - `engine/`, `ui/` và `tools/` nhận `t` qua tham số.
- **Đường nhẹ (danh sách cho phép):**
  - Bao đóng import **tĩnh** bắt đầu từ `engine/boot.js` và từng `paintings/*/index.js` chỉ được chứa file thuộc `engine/*.js`, `engine/contracts/`, `engine/stock/*/meta.js`, `ui/` (trừ `knobs.js`), `lib/astro/`, `lib/random.js`, và `paintings/<slug>/{index,meta}.js`.
  - Mọi specifier trần (gói npm) là lỗi.
  - Đây là bằng chứng cho yêu cầu poster dưới 1 giây.
- **Hàng rào từ vựng:**
  - Quét trong `engine/`, `ui/` và `lib/tsl/`, sau khi bỏ chú thích.
  - Không được có: `slug` của mọi bức; id của mọi lớp riêng của bức (trừ `cot` và id lớp dùng chung); các từ trong `meta.fence` của mọi bức.
  - Từ ASCII khớp **chuỗi con, không phân biệt hoa thường**. Cụm tiếng Việt khớp theo ranh giới `\p{L}` sau khi chuẩn hóa NFC.
  - Test tự kiểm chính nó: phải bắt được `rippleHeight`, `addRipple`, `uHourNode`; không được bắt `vangLa`, `tripleBuffer`, `Firefox`.
- **Chữ tiếng Việt trong xưởng:**
  - Chữ **người xem** thấy nằm trong `strings.*.js`, `content.*.js` và trường `name` của `meta.js`.
  - Thông báo lỗi cho lập trình viên (`throw`, `console`) được viết tiếng Việt.
  - Luật này ghi trong `CLAUDE.md`. Test tự động cho luật này chỉ được bật khi có ngôn ngữ thứ hai (§15 d).

### 8.3 Hợp đồng nhẹ (`src/engine/contracts/painting.js`, chỉ JSDoc, không three)
```js
/**
 * Căn cước một bức: src/paintings/<slug>/meta.js. Dữ liệu thuần, JSON.stringify được.
 * @typedef {Object} PaintingMeta
 * @property {string} slug        'ao-sen-dem' = tên thư mục = khóa test. Đã deploy thì KHÔNG đổi.
 * @property {number} no          số thứ tự trong bộ tranh (Bức 1)
 * @property {string} title       'Ao Sen Đêm'
 * @property {string} tagline     một câu cho <meta name="description"> và og:description
 * @property {Poem} poem          thơ của cả bức; phải in sẵn trong HTML tĩnh (test so khớp)
 * @property {Poster} poster
 * @property {string} [og]        đường dẫn trong public/, KHÔNG có '/' đầu: 'paintings/ao-sen-dem/og.png' (GĐ 4)
 * @property {LayerMeta[]} layers THỨ TỰ PHỦ. [0].id === 'cot'. Số lớp = layers.length.
 * @property {Record<string, string>} [palette]  thêm/ghi đè token của chất liệu
 * @property {string[]} [fence]   từ vựng riêng của bức mà xưởng không được dùng (chỉ test đọc)
 */
/** @typedef {Object} Poem
 * @property {string[]} lines
 * @property {string} source      'Ca dao' | 'Truyện Kiều'… BẮT BUỘC
 * @property {string} [author]    'Nguyễn Du'
 */
/** @typedef {Object} Poster
 * @property {string} src         ĐÚNG giá trị src trong HTML nguồn: '/paintings/ao-sen-dem/poster.svg'
 * @property {number} width       để bố cục không nhảy khi ảnh về
 * @property {number} height
 * @property {string} alt
 */
/** @typedef {Object} LayerMeta
 * @property {string} id          kebab-case không dấu, duy nhất trong bức: 'mat-nuoc'
 * @property {string} name        'Mặt nước': hiện trên thanh lớp, kể cả ở tầng tĩnh
 * @property {string[]} files     file mà lớp SỞ HỮU, tính từ src/; file đầu hiện trong Sổ tay.
 *                                Marker '// @knob' chỉ hợp lệ trong các file này; mỗi file thuộc tối đa MỘT lớp.
 * @property {Poem} [poem]        câu thơ riêng của lớp
 */
/** Cửa vào NHẸ: src/paintings/<slug>/index.js. Trang HTML import thẳng file này: `export default { meta, load, content }`.
 * @typedef {Object} PaintingEntry
 * @property {PaintingMeta} meta
 * @property {() => Promise<import('./runtime.js').Painting>} load   chỉ tầng A/B gọi (kéo theo three)
 * @property {Record<string, () => Promise<{ default: PaintingContent }>>} [content]   [1] { vi: () => import('./content.vi.js') }
 */
/** Một dòng registry: { meta, page: 'index.html', lang: 'vi' }. Mỗi trang một ngôn ngữ. */
/** Chữ của một bức trong MỘT ngôn ngữ: content.<lang>.js. Mọi nhãn tra theo id.
 * @typedef {Object} PaintingContent
 * @property {string} hint                              'Chạm vào mặt nước'
 * @property {Record<string, DialText>} [dials]         khóa = Dial.id
 * @property {Record<string, LayerContent>} [layers]    khóa = LayerMeta.id (bắt buộc từ GĐ 2)
 */
/** @typedef {{ label: string, notes?: Record<string, string> }} DialText */
/** @typedef {Object} LayerContent
 * @property {string} understand     tab Hiểu, ≤ 150 chữ (đếm theo khoảng trắng)
 * @property {string} [diagram]      [2] nội dung SVG: import './diagrams/<tên>.svg?raw'; có <title>, chỉ màu của bảng
 * @property {string[]} learned      "Bạn vừa học" (≥ 1 mục)
 * @property {{ title: string, url: string }[]} readMore   chỉ https
 * @property {Record<string, string | { label: string, options: Record<string, string> }>} knobs
 * @property {Record<string, { label: string, explain: string }>} [experiments]
 * @property {Record<string, string>} [readouts]
 * @property {Record<string, string>} [taps]    nhãn các bước chụp của post (Lột lớp, Kính mài)
 */
```

### 8.4 Hợp đồng nặng (`src/engine/contracts/runtime.js`, chỉ JSDoc)
**Quy tắc đánh dấu giai đoạn:**
- Một typedef được một trường `[N]` tham chiếu tới thì có từ GĐ N.
- Trường không đánh dấu thừa hưởng giai đoạn của typedef chứa nó.
- Hợp đồng **chỉ thêm trường tùy chọn**, không đổi nghĩa trường cũ.

```js
/** Module nặng: src/paintings/<slug>/painting.js
 * @typedef {Object} Painting
 * @property {LayerModule[]} layers     [0] cùng id, cùng thứ tự với meta.layers (test so khớp)
 * @property {CameraSpec} camera        [0]
 * @property {QualitySpec} [quality]    [3] ngân sách của bức; thiếu thì dùng mặc định của xưởng
 * @property {(ctx: EngineCtx) => PaintingSetup} [setup]   [1] chạy TRƯỚC mọi createLayer
 */
/** @typedef {Object} PaintingSetup
 * @property {object} [shared]          object dùng chung trong bức (thiếu thì xưởng tạo {}) → tham số thứ 2 của createLayer
 * @property {Dial[]} [dials]           [4] núm của CẢ BỨC (Bức 1: 'gio'); xưởng vẽ thanh trượt
 * @property {(g: Gesture) => void} [onGesture]   cử chỉ mà không công cụ nào dùng
 * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp
 * @property {() => void} [dispose]     gọi 2 lần vẫn an toàn
 */
/** Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn.
 * @typedef {Object} CameraSpec
 * @property {[number, number, number]} position
 * @property {[number, number, number]} target
 * @property {number} fov
 * @property {[number, number]} azimuth     giới hạn xoay ngang (rad)
 * @property {[number, number]} polar       giới hạn xoay dọc (rad)
 * @property {[number, number]} distance
 * @property {number} [breathe]             [1] biên độ "thở"; xưởng ép về 0 khi prefers-reduced-motion
 */
/** @typedef {Object} QualitySpec
 * @property {Record<'cao'|'vua'|'thap', Record<string, number>>} levels   ghép lên mức mặc định của xưởng; lớp đọc qua ctx.budget
 * @property {string[]} ladder     thứ tự hạ nấc: 'dpr' | '<layerId>.<stepId>'
 */
/** Một lớp = một module: layers/lN-<id>.js (hoặc engine/stock/<id>/layer.js). Là object thuần:
 * bức có thể ghi đè mặc định của lớp dùng chung bằng spread (§15 a).
 * @typedef {Object} LayerModule
 * @property {string} id           [0] export const id
 * @property {Knob[]} knobs        [0] export const knobs: TĨNH (có thể là [])
 * @property {(ctx: LayerCtx, shared: object) => Layer} createLayer   [0]
 */
/** Khai báo TĨNH của một núm. Xưởng tạo uniform cho núm 'uniform', tên đặt bằng
 * setName(`${layerId.replaceAll('-', '_')}_${knobId}`): tên phải là định danh WGSL/GLSL hợp lệ.
 * @typedef {Object} Knob
 * @property {string} id           camelCase, duy nhất TRONG LỚP
 * @property {'number'|'select'|'color'|'bool'} [kind]      mặc định 'number'
 * @property {'uniform'|'js'|'rebuild'} [via]   [0] mặc định 'uniform'; 'js'/'rebuild' xử lý ở Layer.onKnob [2]
 * @property {number|string|boolean|((env: KnobEnv) => any)} value   mặc định; hàm khi phụ thuộc mức/tầng/đêm nay
 * @property {number} [min]
 * @property {number | { webgpu: number, webgl2: number } | ((env: KnobEnv) => number)} [max]   trần theo tầng;
 *                                 [3] hoặc hàm của env (như value): trần theo mức, núm không kéo được máy yếu quá sức
 * @property {number} [step]
 * @property {string[]} [options]  kind 'select': id các lựa chọn; uniform giữ chỉ số
 */
/** @typedef {{ tier: 'webgpu'|'webgl2', level: 'cao'|'vua'|'thap', budget: Record<string, number>, now: Date, mobile: boolean }} KnobEnv */
/** Thứ createLayer trả về. Trọng số và núm KHÔNG nằm ở đây: xưởng tạo sẵn, lớp chỉ đọc.
 * @typedef {Object} Layer
 * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
 * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
 * @property {PostStage} [post]           [0] xử lý ẢNH sau scene pass
 * @property {() => void} dispose         [0] gọi 2 lần vẫn an toàn; tự gỡ object khỏi scene
 * @property {Record<string, (v: any) => void | Promise<void>>} [onKnob]   [2] cho núm 'js' | 'rebuild'
 * @property {Experiment[]} [experiments] [2] tab Phá
 * @property {Readout[]} [readouts]       [2] xưởng luôn thêm draw calls / tam giác / ms
 * @property {DegradeStep[]} [degrade]    [3] nấc hạ chất lượng mà lớp đưa ra
 */
/** @typedef {Object} Experiment
 * @property {string} id
 * @property {(on: boolean) => void | Promise<void>} toggle   trả Promise → UI hiện "đang dựng…"
 * @property {'toggle'|'compare'} [kind]  'compare': xưởng đo ms lúc tắt/bật và vẽ biểu đồ nhỏ
 *   [3] toggle(true) là biến thể, toggle(false) là trạng thái thường. Bàn thợ ghi ms mỗi khung và ms CPU riêng cho
 *   từng trạng thái (trung bình trượt, bỏ 0,25 s đầu sau mỗi lần đổi); Sổ tay vẽ hai cột "Tắt / Bật".
 */
/** @typedef {{ id: string, get: () => number | string, unit?: string }} Readout */
/** Nấc chỉ hạ TRẦN của lớp, KHÔNG BAO GIỜ ghi vào uniform của núm.
 * Núm = ý người xem, nấc = trần của máy, hiệu lực = min(núm, trần).
 * Nấc không được đổi thứ nằm trong cache key (castShadow, receiveShadow, shadowMap.enabled, fogNode…).
 * [3] Lớp chỉ đưa những nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng). Xưởng gọi apply và
 * revert theo kiểu ngăn xếp: revert luôn gỡ nấc được apply gần nhất; mỗi nấc apply tối đa một lần trước khi revert.
 * @typedef {{ id: string, apply: () => void, revert: () => void }} DegradeStep */
/** Xưởng nối post của các lớp theo thứ tự:
 *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → overlay công cụ → vec4(rgb, 1)
 * Node dùng lại nhiều lần hoặc trước một nhánh If phải .toVar() bên trong Fn.
 * @typedef {Object} PostStage
 * @property {(i: PostInput) => any} [build]     [0] HDR tuyến tính vào → ra (bloom, tone). Gọi MỘT lần khi dựng pipeline.
 * @property {(i: PostInput) => any} [display]   [4] màu hiển thị (sRGB) vào → ra (LUT, grain, vignette, FXAA)
 */
/** @typedef {Object} PostInput
 * @property {any} color                                   màu hiện tại (từ scene pass hoặc stage trước)
 * @property {(name: 'output'|'emissive'|'normal'|'depth') => any} channel   'normal' chỉ có sau requireView [4]
 * @property {any} weight                                  uniform trọng số của chính lớp này
 * @property {(tapId: string, node: any) => void} [tap]    [4] chụp một bước giữa chừng → view '<layerId>:<tapId>'
 */
/** Núm của cả bức. Nhãn ở content.dials[id]. Dial.id đã deploy là API công khai.
 * @typedef {Object} Dial
 * @property {string} id
 * @property {any} uniform
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {(v: number) => string} [format]   29.5 → '05:30'
 * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
 */
/** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
 * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'} kind
 * @property {{ x: number, y: number }} ndc
 * @property {any} ray                          THREE.Ray; bức tự giao với mặt phẳng của nó
 * @property {{ x: number, y: number }} [velocity]   chỉ có ở 'swipe'
 */
/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js
 * @typedef {{ id: string, mount: (api: ToolApi) => ToolInstance }} Tool */
/** @typedef {Object} ToolApi
 * @property {() => ViewInfo[]} views              view ở không gian hiển thị, thứ tự như §7 Lột lớp
 * @property {(id: string) => Promise<void>} requireView   bảo đảm view sẵn sàng (có thể biên dịch lại MỘT lần)
 * @property {HTMLElement} el
 * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
 */
/** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
/** @typedef {Object} ToolInstance
 * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép MỘT LẦN sau display; đổi chế độ = đổi uniform
 * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức
 * @property {() => void} dispose
 */
/** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
 * @typedef {Object} EngineCtx
 * @property {'webgpu'|'webgl2'} tier          [0] backend THẬT sau renderer.init()
 * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động ([3] hoặc mức ép bằng ?level); nấc hạ KHÔNG đổi số này
 * @property {Record<string, number>} budget   [0] mức mặc định của xưởng ghép với quality.levels[level] của bức
 * @property {boolean} mobile                  [0]
 * @property {boolean} reducedMotion           [0]
 * @property {Date} now                        [0] flags.at ?? giờ thật, cố định lúc khởi động
 * @property {any} renderer                    [0] WebGPURenderer (compute, info)
 * @property {any} scene                       [0] lớp tự add/remove đối tượng của mình
 * @property {any} camera                      [0]
 * @property {{ hex: Record<string, string>, color: (token: string) => any }} palette   [0] bảng đã ghép; color() trả THREE.Color
 * @property {{ time: any, delta: any, resolution: any, pointer?: any }} u              [0] uniform chung (pointer: [1])
 * @property {(layerId: string) => any} weight [0] uniform trọng số; 'cot' luôn là 1; id lạ → ném lỗi
 * @property {boolean} debug                   [0]
 */
/** @typedef {EngineCtx & { knob: (knobId: string) => any, knobValue: (knobId: string) => any }} LayerCtx
 *   [0] knob(): uniform của núm 'uniform' của CHÍNH lớp đang dựng
 *   [2] knobValue(): giá trị ban đầu (đã chuẩn hóa) của MỌI núm của lớp, kể cả 'js'/'rebuild'
 */
/** [2] { weights: { layerId: số }, knobs: { 'layerId.knobId': giá trị } } — dạng JSON của trạng thái tác phẩm
 * @typedef {{ weights: Record<string, number>, knobs: Record<string, any> }} Snapshot */
/** [2] Bàn thợ (engine/gpu/studio.js): API DUY NHẤT mà Sổ tay (ui/) và __sma thấy; không có ở tầng tĩnh.
 * layers() · weight(id) → { value, target } · setWeight(id, v, { tween }) · knobs(layerId) · setKnob(layerId, knobId, v)
 * experiment(layerId, id) · toggleExperiment(layerId, id, on) · readouts(layerId) · stats() · snapshot() · restore(s)
 * [3] stats() thêm cpuMs · compare(layerId, id) → { off, on }, mỗi bên { ms, cpuMs } hoặc null khi chưa đo
 * [3] quality() → { level, steps: string[], guarding, capped } · degrade() / upgrade() → Promise<boolean> (hạ/nâng tay MỘT nấc;
 *     false khi không còn nấc) · onQuality(cb) báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu)
 * Mọi hàm đổi trạng thái trả Promise, xong khi khung đã được vẽ lại (khi ?freeze đã dừng vòng lặp).
 * @typedef {Object} Studio */
```

**Bức 1 đi qua hợp đồng:**
- `index.js`: `export default { meta, load: () => import('./painting.js') }`. Từ GĐ 1 thêm `content: { vi: () => import('./content.vi.js') }`.
- `painting.js` export:
  - `layers`: v0 là `[cot, matNuoc, vangLa, phuBong]`; bản cuối là `[cot, anhTrang, suong, matNuoc, vangLa, phuBong]`;
  - `camera`;
  - từ GĐ 1 có `setup(ctx)`; từ GĐ 3 có `quality`.

### 8.5 Vòng đời một bức và luồng mỗi khung
```
t=0  HTML tĩnh: poster + tên + thơ + [data-seal]                           data-state="poster"
     entry chunk (KHÔNG three): boot(entry, { lang, t })
 ├─ flags = readFlags(location.search); now = flags.at ?? new Date()
 ├─ sma = createSma(window); shell = mountShell(document, meta, { now, t }) → con dấu
 ├─ tier = await detectTier(flags, envFromWindow(window))                   "detecting"
 ├─ 'static' → showStatic(entry, shell, { reason: 'flag' | 'no-gpu' }) ──── "static" ■
 └─ withDeadline(10 s): import('./gpu/run.js') → run(entry, shell, { tier, flags, now, t, sma })   "loading"
      ├─ song song: entry.load() · entry.content?.[lang]?.() · createStage({ tier, flags })   (GĐ 2: phần dưới ở scene.js)
      │             (renderer + init + nền denThen đặc; backend THẬT)
      ├─ stage.useCamera(painting.camera); level = pickLevel(...); budget = budgetFor(level, painting.quality)
      ├─ ctx = makeCtx(...)                          ← trọng số cho từng meta.layers[i].id ('cot' = 1)
      ├─ setup = painting.setup?.(ctx); shared = setup?.shared ?? {}
      ├─ với mỗi module: uniform núm từ khai báo tĩnh → createLayer(ctx + knob, shared)
      ├─ lưới an toàn emissive (luật 8)
      ├─ pipeline = createPipeline(...)              ← build → renderOutput → display → overlay, ghép MỘT lần   "compiling"
      ├─ await scenePass.compileAsync(renderer); render 1 khung ẩn (canvas opacity 0)
      ├─ shell.crossfade(canvas) → poster hidden                                   "fading"
      ├─ huy hiệu (backend thật, data-backend); GĐ 1–4: gợi ý, thanh lớp, Sổ tay, dials
      ├─ GĐ 2: __sma.expose(bàn thợ); lời mời (nút) → ui/workshop.js; công cụ ?debug tải SAU khi live
      └─ loop: đồng hồ (thật, hoặc tất định nếu ?freeze) → cử chỉ (công cụ → bức; drag → camera)
               → setup.update → layer.update theo thứ tự → tween trọng số → quality.sample
               → (apply/revert một nấc) → render → đọc renderer.info → sma.frames++          "live"
               ?freeze=N: dừng loop sau khung N (canvas giữ khung N); đổi trọng số/núm lúc đó thì vẽ lại
               ĐÚNG khung N ở nhịp rAF kế tiếp (không tiến đồng hồ)
     mất GPU sau khi live, lần đầu: snapshot() → gỡ → poster + "Dựng lại cảnh"                   "lost"
               → bấm: renderer + canvas MỚI → dựng lại (scene.js) → restore(snapshot) → hòa dần → "live"
               lần hai (hoặc mất trước khi live): tầng tĩnh ('device-lost')
Gỡ: disposer.closeAll() theo thứ tự NGƯỢC (loop → UI → tools → pipeline → lớp ngược → setup → stage)
```

**(GĐ 3) Bộ điều chỉnh trong vòng lặp:** mỗi khung, `quality.sample(thời điểm rAF)` có thể trả lời "hạ một nấc" hay "nâng một nấc";
`ladder.js` áp nấc đó rồi mới vẽ. Khi thanh lớp mở, bộ điều chỉnh chuyển sang chế độ canh (run.js báo: chỉ hạ khi quá tải nặng),
tắt hẳn khi có `?freeze` (ảnh phải
tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (nấc là trạng thái của máy, không nằm trong snapshot).

### 8.6 Mỗi mối quan tâm chung nằm ở đâu
| Mối quan tâm | Nơi ở | Quy tắc |
|---|---|---|
| Token màu | `engine/palette.js` (tầng chất liệu) + `meta.palette` (bức) | `ctx.palette` là bản đã ghép. `styles/tokens.css` khớp `palette.js` (unit test) |
| Thư viện TSL | `lib/tsl/noise.js` (có từ GĐ 1) | Fresnel, wrap lighting, `rippleHeight` **ở lại trong bức**. Chỉ rút lên `lib/tsl/` khi bức thứ hai cần (**luật hai lần**) |
| Âm lịch, pha trăng | `lib/astro/`, chỉ trả về số | Tên tháng/can/chi và `formatSeal` nằm ở `ui/strings.vi.js` |
| Con dấu | `<span data-seal>` trong HTML của mọi bức; `ui/shell.js` điền vào | Chữ ký của kỹ thuật |
| Trăng SVG ở tầng tĩnh | `ui/moon-svg.js` điền vào `<svg data-moon>` **nếu trang có ô đó** (GĐ 1) | Bức nào không có trăng thì bỏ ô đó đi |
| Thanh giờ | Dial của Bức 1 trong `paintings/ao-sen-dem/shared.js`; `ui/dials.js` vẽ | Xưởng không biết "giờ" là gì |
| Pointer, gợn sóng | Xưởng: `ctx.u.pointer`, `Gesture{kind, ndc, ray}` (GĐ 1). Bức: `ripples[8]`, `rippleHeight`, giao tia với mặt nước, điểm hút | Công cụ nhận cử chỉ trước, sau đó tới bức; `drag` dành cho camera |
| Liên kết lớp | `shared.<layerId>` do lớp trước ghi | Lớp chỉ đọc `shared` của lớp đứng trước nó |
| Content và chữ giao diện | Bức: `content.vi.js`. Lớp dùng chung: `engine/stock/<id>/content.vi.js`, viết trung tính; bức **import tường minh** và ghi đè bằng spread: `layers: { 'phu-bong': { ...phuBong.layers['phu-bong'], understand: '…' } }`. Xưởng: `ui/strings.vi.js`, truyền vào dưới dạng `t` | Sẵn sàng đa ngôn ngữ mà không cần framework |
| Code-view, marker | Plugin chung; `ui/code-view.js` glob file lớp của các bức (trừ `_mau`) và của `engine/stock/` | Marker chỉ hợp lệ trong `LayerMeta.files`; id núm có phạm vi trong lớp |
| Bảng chất lượng | Xưởng: chọn mức, mức mặc định (`dpr`), ngân sách khung, độ trễ, nấc `dpr`. Bức: số theo mức và `ladder`. Lớp dùng chung: mặc định của riêng nó (`ctx.budget.bloom ?? 0.5`) | Lớp đọc số qua `ctx.budget` và đưa ra `degrade` |
| Bộ điều chỉnh (GĐ 3) | `engine/quality.js` (quyết định, hàm thuần không three, test bằng chuỗi khung giả) + `engine/gpu/ladder.js` (áp nấc) | Quyết định tách khỏi việc áp: logic trễ test được trong Node, việc áp nấc chạm GPU thì e2e giữ |

### 8.7 Cờ URL, HTML, poster và chunk trên GitHub Pages
**Cờ URL** (`engine/flags.js`). Query string là môi trường; hash là trạng thái tác phẩm (giữ chỗ `#r=…` cho link công thức ở GĐ 5).

| Cờ | Nghĩa |
|---|---|
| `?static` | tầng C |
| `?webgl` | tầng B (`forceWebGL: true`) |
| `?force3d` | bỏ qua mọi kiểm tra phần mềm (để e2e chạy trên SwiftShader) |
| `?debug`, `?debug=stats` | GĐ 0: in chi tiết lỗi. GĐ 1: Inspector hoặc stats-gl (§7) |
| `?at=2026-09-28T21:00` | "bây giờ" giả lập |
| `?freeze`, `?freeze=N` | đồng hồ tất định |
| `?poster` | (GĐ 4) ẩn mọi UI trừ canvas, để chụp poster |
| `?level=cao\|vua\|thap` | (GĐ 3) ép mức chất lượng thay cho `pickLevel` (xem mức thấp ngay trên laptop; e2e phủ đường phản chiếu giả). Giá trị lạ thì bỏ qua (`?debug` in cảnh báo) |

- **`?at`:** giá trị không ghi offset được hiểu là **giờ Việt Nam (+07:00)**, bất kể múi giờ của máy.
  - Muốn ghi offset thì viết `Z` hoặc `%2B07:00`. Dấu `+` trong query string bị giải mã thành khoảng trắng, nên `flags.js` đổi khoảng trắng về `+` trước khi parse.
  - Giá trị hỏng thì bỏ qua (dùng giờ thật; `?debug` in cảnh báo).
- **`?freeze`:** đồng hồ tất định.
  - `u.time = số khung đã vẽ × 1/60` giây, `u.delta = 1/60`. Không đọc đồng hồ tường.
  - Mọi ngẫu nhiên đi qua `lib/random.js` có hạt giống.
  - `?freeze=N` còn **dừng loop sau khung N**; canvas giữ khung N, `__sma.frames === N`.
  - Trên cùng máy và cùng backend, hai lần chạy cùng `?at&freeze=N` cho cùng một ảnh.
  - Vì vậy **không dùng `time`/`deltaTime` của TSL** (chúng chạy theo đồng hồ riêng của renderer). Mọi chuyển động đọc `ctx.u.time` / `ctx.u.delta`.

**HTML (hiện tại có một bức):**
- Chỉ có `index.html` ở gốc, viết tay: `<body data-painting="ao-sen-dem" data-state="poster">`. URL: `https://giabao2610.github.io/son-mai-anh-sang/`.
- Poster là `<img src="/paintings/ao-sen-dem/poster.svg" width height alt fetchpriority="high">`, có sẵn trong HTML.
- CSS: `<link rel="stylesheet" href="/src/styles/shell.css">`.
  - `shell.css` mở đầu bằng `@import './tokens.css'` và 5 file `@fontsource/…/<weight>.css`.
  - Vite gộp tất cả thành một file CSS có hash (khoảng 3 KB, không kể font). Font dùng `font-display: swap`.
- Script duy nhất là một `<script type="module">` inline, vốn đã được hoãn nên không chặn vẽ:
  `import { boot } from '/src/engine/boot.js'; import entry from '/src/paintings/ao-sen-dem/index.js'; import t from '/src/ui/strings.vi.js'; boot(entry, { lang: 'vi', t });`
  Vite 8 chuyển script này thành một entry chunk có hash và thêm base cho mọi đường dẫn tuyệt đối (đã kiểm).
- `<title>`: `Ao Sen Đêm · Sơn Mài Ánh Sáng`, tên bức trước, tên kỹ thuật sau. Poster in sẵn dòng `Sơn Mài Ánh Sáng · Bức 1`.
- **OG (GĐ 4):** `og:image` là URL tuyệt đối, viết tay; test so sánh với `SITE + meta.og`. `SITE = 'https://giabao2610.github.io/son-mai-anh-sang/'` (có `/` cuối), nằm trong `registry.js`.

**Chunk:**
- Một entry nhỏ gồm boot, shell, meta và lunar (khoảng 1–3 KB gzip).
- Một chunk `three` dùng chung, khoảng 243 KB gzip:
  - tách bằng `build.rolldownOptions.output.codeSplitting.groups`;
  - chỉ khớp `node_modules/three/build/`, để Inspector không bị kéo vào.
- Một chunk cho từng bức. Một chunk `tweakpane`, tải khi tab Chỉnh mở lần đầu (GĐ 2).
- (GĐ 2) Một chunk `workshop` (thanh lớp + Sổ tay) dùng chung cho tầng 3D và Sổ tay chỉ đọc của tầng tĩnh; mỗi file lớp có một chunk `?code` nhỏ, tải khi tab Chỉnh mở lớp đó.

**Về sau (N bức):**
- Bức thứ n nằm ở `tranh/<slug>/index.html`. GH Pages phục vụ index của thư mục. **URL gốc là Bức 1 mãi mãi.**
- `vite.config.js` lấy `input` từ `registry.js`. Registry chỉ import các `meta.js` (dữ liệu thuần), nên Node đọc được.
- Build nhiều trang đã được thử: các trang dùng chung đúng một chunk `three` (cùng hash).

## 9. Tầng dự phòng (của từng bức)

### Thứ tự quyết định (`engine/tier.js`, hàm thuần nhận `env`)
1. **Cờ URL:** `?static` → C. `?webgl` → B. `?force3d` bỏ qua mọi kiểm tra phần mềm.
2. **A · WebGPU:** cần đủ ba điều kiện.
   - Có `navigator.gpu`, chỉ có trong secure context. GitHub Pages dùng https; `localhost` cũng được tính là secure.
   - `requestAdapter({ featureLevel: 'compatibility' })` (giống cách three xin adapter) trả về adapter.
   - Adapter không phải phần mềm: `adapter.info.isFallbackAdapter !== true`, và `info.architecture`, `info.vendor`, `info.description` gộp lại không khớp `/swiftshader/i`.
3. **B · WebGL2:**
   - `getContext('webgl2', { failIfMajorPerformanceCaveat: true })` phải thành công.
   - `WEBGL_debug_renderer_info` không được khớp `/SwiftShader|llvmpipe|Software|Basic Render/i`. Cờ `failIfMajorPerformanceCaveat` vẫn cho SwiftShader đi qua, nên chỉ phép kiểm tên renderer này mới bắt được.
4. **Còn lại là C · Tranh tĩnh.**
5. Bất kỳ ngoại lệ nào trong một phép dò đều tính là phép dò đó thất bại. `detectTier` không bao giờ ném lỗi.

**Sau `renderer.init()`:** tầng trên huy hiệu và trong `ctx.tier` là backend thật (`renderer.backend.isWebGPUBackend`).

### `window.__sma` (từ GĐ 0, có cả ở tầng tĩnh)
- `boot.js` tạo `window.__sma = { state, tier, backend: null, level: null, frames: 0, reason: null, error: null }`. `state` luôn bằng `body[data-state]`.
- `run.js` cập nhật `backend`, `level` và `frames`.
- Mỗi lần về tầng tĩnh, `reason` được ghi một trong các giá trị `'flag' | 'no-gpu' | 'chunk-load' | 'timeout' | 'frame-errors' | 'gpu-error' | 'device-lost' | 'error'`.
- GĐ 2 thêm `layers()`, `setWeight(id, v)`, `snapshot()` và `restore()` qua `sma.expose()`, khi cảnh đã live. `expose()` trả hàm gỡ đúng các hàm đó (dựng lại cảnh thì gắn hàm mới). `setWeight` đặt ngay (không tween) và trả Promise xong khi khung đã được vẽ lại.
- GĐ 2 thêm trạng thái `'lost'` (mất GPU lần đầu, đang chờ "Dựng lại cảnh"): e2e chờ `live`/`static` nên không coi `lost` là ổn định.
- GĐ 3 thêm `quality()` (mức, các nấc đang hạ, đang canh hay không, có đang coi là bị khóa nhịp không), `degrade()` và
  `upgrade()` (hạ/nâng tay một nấc; Promise xong khi khung đã vẽ lại, trả `false` khi không còn nấc), và `stats()` (draw call,
  tam giác, ms mỗi khung, ms CPU của khung vừa vẽ). Cả bốn đi qua bàn thợ, như các hàm của GĐ 2.

### Tranh tĩnh (tầng C) của một bức: `showStatic(entry, shell, { reason, error })`, gọi nhiều lần vẫn an toàn
- Luôn có: poster, thơ và con dấu lấy từ HTML của chính bức đó. GĐ 1 thêm trăng SVG vào `[data-moon]` nếu trang có ô này. GĐ 2 thêm Sổ tay chỉ đọc: nút "Xem {n} lớp của bức tranh" trong ô ghi chú (trừ lý do `chunk-load`), tải `ui/workshop.js` và chữ của bức bằng `import()` động; vẫn không tải three.
- Thêm theo lý do:
  - `'flag'`: không thêm gì.
  - `'no-gpu'`: hướng dẫn kiểm tra `chrome://gpu` và bật "Use hardware acceleration when available".
  - `'chunk-load'`: "Trang vừa được cập nhật, tải lại nhé", kèm nút tải lại.
  - `'timeout'` (GĐ 1): "Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.", kèm nút tải lại. Không gợi ý `?debug`, vì quá hạn thường không phải lỗi.
  - Các lý do khác: "Cảnh 3D gặp lỗi trên máy này", kèm gợi ý `?debug`.
- Có `?debug` thì in thêm `error.message`.

### Bảng lỗi (không bao giờ có màn hình trắng)
| Chỗ hỏng | Hệ quả |
|---|---|
| `detectTier` gặp ngoại lệ | Phép dò đó thất bại; nếu không còn gì thì tầng tĩnh (`no-gpu`) |
| `import()` chunk lỗi: do mạng, hoặc do HTML cũ trỏ tới chunk đã bị xóa sau lần deploy mới (`vite:preloadError`) | Tầng tĩnh (`chunk-load`) |
| Tải content lỗi (GĐ 1+) | 3D vẫn chạy; Sổ tay báo không tải được chữ |
| `setup`/`createLayer` ném lỗi | Gỡ những gì đã tạo, rồi tầng tĩnh (`error`) |
| `compileAsync` bị reject, hoặc khởi động quá 10 giây | Tầng tĩnh (`timeout`/`error`). Phần khởi động xong trễ tự dọn qua disposer đã đóng |
| Lỗi JS trong một khung | Ghi log, bỏ qua khung đó; **3 khung lỗi liên tiếp** thì tầng tĩnh (`frame-errors`) |
| **Lỗi GPU không đồng bộ** (`renderer.onError`: lỗi validation, hết bộ nhớ, lỗi nội bộ; không ném từ `render()`) | Mỗi lần gọi tính là một lỗi; 3 lần trong 1 giây thì tầng tĩnh (`gpu-error`) |
| Mất context/device (`renderer.onDeviceLost`) | GĐ 0–1: tầng tĩnh (`device-lost`). GĐ 2: lần đầu hiện poster và nút "Dựng lại cảnh"; bấm thì tạo **renderer và canvas mới** (WebGPURenderer không tự khôi phục được) rồi `restore(snapshot)`; lần 2 thì tầng tĩnh |
| `dispose()` của một lớp ném lỗi | Ghi log, vẫn gỡ tiếp phần còn lại |
| (GĐ 2) Công cụ `?debug` tải hỏng, hay `update()` của nó ném lỗi | Cảnh báo, tắt công cụ; cảnh vẫn chạy (không tính là khung lỗi, không tính vào hạn 10 giây) |
| (GĐ 2) Núm hay thí nghiệm áp không được (onKnob ném lỗi) | Ghi log, báo một dòng ở đáy Sổ tay; núm và nút đọc lại trạng thái thật (giá trị hỏng không vào snapshot); cảnh vẫn chạy. `restore` bỏ qua núm hỏng, nên "Dựng lại cảnh" không vì thế mà về tĩnh |
| (GĐ 2) Chunk Tweakpane (tab Chỉnh) tải hỏng | Ô núm báo lỗi thay cho "Đang tải…"; mở lại tab thì tải lại |
| (GĐ 2) Chunk Sổ tay chỉ đọc (tầng tĩnh) tải hỏng | Ghi chú thành lời nhắc tải lại, như lý do `chunk-load` |
| (GĐ 2) Vẽ lại khung đứng yên (`?freeze`) ném lỗi | Promise của thay đổi hỏng theo (không treo); Sổ tay báo, `__sma.setWeight` trả lỗi |

## 10. Hiệu năng và chất lượng

### Mức chất lượng
**Xưởng chọn mức** (`engine/quality.js#pickLevel`):

| | desktop | điện thoại |
|---|---|---|
| WebGPU | cao | vừa |
| WebGL2 | vừa | thấp |

- "Điện thoại" do `isMobile({ userAgent, maxTouchPoints })` xác định: UA khớp `/Android|iPhone|iPad|Mobile/i`, hoặc `maxTouchPoints > 1` trên UA `Macintosh` (iPadOS).
- Mức mặc định của xưởng chỉ có `dpr` (cao 2 / vừa 1.5 / thấp 1.25). Bức ghép thêm các khóa của nó.
- (GĐ 3) Cờ `?level=cao|vua|thap` ép mức, bỏ qua bảng trên (§8.7).

**Bảng của Bức 1** (`paintings/ao-sen-dem/quality.js`, GĐ 3; trước đó các lớp v0 dùng số ở cột mặc định):

| Mức | DPR tối đa | Phản chiếu | Đom đóm | Lá | Bóng | Bloom (`resolutionScale`) | Octave sương (GĐ 3) |
|---|---|---|---|---|---|---|---|
| **cao** | 2 | 0.5 | 3.000 | 1.200 | 1024 | 0.5 (mặc định của BloomNode) | 3 |
| **vừa** | 1.5 | 0.35 | 1.500 | 800 | 512 | 0.25 | 2 |
| **thấp** | 1.25 | giả | 600 | 500 | tắt | 0.25 | 1 |

(GĐ 3) Khóa trong `quality.js`: `dpr`, `reflection` (0 = phản chiếu giả), `fireflies`, `leaves`, `shadow` (0 = tắt), `bloom`, `fogOctaves`.

### Bộ điều chỉnh tự động (xưởng, GĐ 3)
- **Ngân sách khung:** 16,7 ms (60fps) trên desktop, 22,2 ms (45fps) trên điện thoại.
- Đo frame time trung bình theo cửa sổ 2 giây.
- Hai cửa sổ liên tiếp vượt ngân sách × 1,2 thì hạ một nấc theo `ladder` của bức. Với Bức 1: `dpr` (−0,25 mỗi nấc) → `suong.chi-tiet` → `mat-nuoc.phan-chieu` → `phu-bong.bloom` → `vang-la.dom-dom` → `anh-trang.bong`. (GĐ 3 chen `suong.chi-tiet` lên sớm: noise của sương chạy trên gần như mọi điểm ảnh, bớt octave ít thấy nhất; vị trí chốt lại sau khi đo trên máy thật.)
- Năm cửa sổ liên tiếp "dư" thì nâng một nấc, nhưng không vượt mức ban đầu.
- **Nấc chỉ hạ trần, không ghi vào núm.** Hiệu lực = min(núm, trần).
- **Nấc không đổi thứ nằm trong cache key.** (GĐ 3) Shadow map đã tĩnh sẵn (§6 Lớp 2), nên nấc `anh-trang.bong` chỉ hạ `mapSize` rồi vẽ lại bóng một lần. Không bao giờ đổi `castShadow`, `receiveShadow` hay `shadowMap.enabled`, vì đổi các thứ đó sẽ biên dịch lại mọi material có ánh sáng.

**(GĐ 3) Ba cái bẫy khi đo bằng nhịp `requestAnimationFrame`, và cách tránh:**
1. **Màn 60 Hz không bao giờ "dư".** Trình duyệt khóa nhịp rAF theo màn hình: khung 16,7 ms không bao giờ dưới 0,7 × 16,7 = 11,7 ms.
   Chỉ một lần giật tạm (mở app khác) là hạ nấc mãi mãi. Vì vậy một cửa sổ là "dư" khi trung bình dưới 0,7 × ngân sách, **hoặc**
   trung bình không quá 1,05 × ngân sách và không rớt khung nào. Rớt khung đếm trên cả cửa sổ: số nhịp 60 khung/giây đã trôi qua
   trừ số khung đã vẽ, thiếu từ 0,75 nhịp trở lên mới tính. Không so từng khoảng với trung vị: sau bộ chặn 60 khung/giây, màn
   72/75/85/144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không rớt khung nào; so với trung vị thì khoảng
   dài ấy thành "rớt khung" ở mọi cửa sổ và các màn đó không bao giờ nâng lại được (review GĐ 3 tìm ra).
   Chống dao động: nâng một nấc mà trong 3 cửa sổ sau lại phải hạ đúng nấc đó thì khóa nấc ấy, không nâng nó nữa trong phiên.
2. **Trình duyệt khóa ở 30 fps** (Energy Saver của Chrome khi chạy pin, Low Power Mode của iPhone): hạ nấc nào cũng không nhanh hơn.
   Vì vậy khi đã hạ hết thang (từ lúc chưa hạ nấc nào) mà trung bình vẫn không nhanh hơn 10% so với lúc bắt đầu hạ, thì đó là nhịp
   bị khóa, không phải GPU yếu: trả lại mọi nấc và thôi hạ ("bị khóa nhịp"). Hết khóa khi trung bình về dưới ngân sách.
3. **Sổ tay cố ý làm chậm** (tắt instancing, nhiều đom đóm, CPU vs GPU): hạ nấc vì chậm vừa phải thì số đo sai, bài học hỏng;
   nhưng để máy bị ép quá sức thì trái mục tiêu hợp nhiều phần cứng. Vì vậy khi thanh lớp mở, bộ điều chỉnh chuyển sang chế độ
   **canh**: chậm vừa phải thì để yên, chỉ hạ khi quá tải NẶNG (trung bình > 2,2 × ngân sách trong 2 cửa sổ), không bao giờ nâng.
   Đóng thanh lớp thì về như thường (cửa sổ mới, có khởi động).

**(GĐ 3) Không ép phần cứng quá sức** (Bao, GĐ 3: sản phẩm phải hợp nhiều loại máy):
- **Trần 60 khung/giây** (`engine/gpu/clock.js#createFrameCap`, run.js): màn 90/120/144 Hz không bắt GPU vẽ gấp đôi. Mốc "đã vẽ"
  tiến đều từng bước 1/60 s nên màn 90 Hz vẽ xen kẽ, trung bình vẫn 60; màn 60 Hz và máy chậm không bỏ khung nào. `?freeze`
  vẫn tất định (đồng hồ đếm khung đã vẽ).
- **Trần núm theo mức:** `Knob.max` có thể là hàm của env (hợp đồng thêm dạng tùy chọn, §8.4), như `value`. Bức 1 đặt trần theo
  mức cho ba núm nặng nhất: số đom đóm, độ phân giải phản chiếu, số octave của sương (§6).
- **Bộ điều chỉnh canh cả khi Sổ tay mở** (bẫy 3 ở trên), và **thí nghiệm có trần**: "CPU vs GPU" tối đa 5.000 con, "Tắt instancing"
  tối đa 1.200/600/300 Mesh theo mức (GĐ 2).
- **Mặc định nhẹ theo mức** (bảng trên): phản chiếu giả và không bóng ở mức thấp, octave sương 3/2/1, bóng tĩnh ở mọi mức.

**(GĐ 3) Chi tiết:**
- Khoảng giữa hai khung dài hơn 250 ms (tab bị ẩn, dừng ở debugger, biên dịch) thì bỏ cả cửa sổ đang đo. 2 giây đầu sau khi live
  hay sau khi chạy lại cũng bỏ (còn biên dịch dở).
- Có `?freeze` thì không có bộ điều chỉnh: ảnh phải tất định. `__sma.degrade()` / `upgrade()` vẫn hạ/nâng tay được (e2e dùng).
- Nấc `dpr` nở thành nhiều nấc, mỗi nấc −0,25, tính từ DPR thật lúc dựng (`min(devicePixelRatio, budget.dpr)`) xuống tới 1.
  Màn DPR 1 thì không có nấc `dpr` nào.
- Mục nào của `ladder` không có lớp nào đưa ra ở mức hiện tại thì bỏ qua (ví dụ `anh-trang.bong` ở mức thấp). Test hợp đồng giữ
  mọi mục của `ladder` trỏ tới một lớp có thật, và ở mức cao lớp đó có nấc ấy.

**(GĐ 3) Các nấc của Bức 1:**

| Nấc | Làm gì (hiệu lực = min(núm, trần)) | Sàn |
|---|---|---|
| `dpr` | trần DPR −0,25 | 1 |
| `suong.chi-tiet` | trần số octave của sương về 1 | 1 |
| `mat-nuoc.phan-chieu` | trần độ phân giải phản chiếu × 0,5 | 0,15 |
| `phu-bong.bloom` | `resolutionScale` của bloom × 0,5 | — |
| `vang-la.dom-dom` | trần số đom đóm = nửa số mặc định của mức | 100 |
| `anh-trang.bong` | trần `mapSize` ÷ 2, rồi vẽ lại bóng một lần | 256 |

### Ngân sách
- **Draw call:** `renderer.info.render.drawCalls` đếm mọi pass.
  - Tổng mỗi khung = `cảnh + (cảnh − 1) [phản chiếu] + 2 × bóng [bóng vẽ lại cho camera của reflector] + 12 [bloom] + 1 [FXAA] + 1 [quad]`.
  - "Cảnh" là số đối tượng renderable trong scene; riêng ao sen khoảng 5.
  - Mục tiêu ở mức cao: cảnh ≤ 10 và tổng ≤ 45. Cảnh thử 4 đối tượng đã đo được 21.
  - (GĐ 3) Bóng tĩnh chỉ vẽ khi có thay đổi, nên khung thường không có phần `2 × bóng`. Bức 1 đủ sáu lớp có 11 đối tượng (Cốt 6,
    trăng, đèn hoa đăng, vòm trời, mặt nước, đom đóm): `11 + 10 + 12 + 1 = 34` ở mức cao, **đo được đúng 34** trên cả WebGPU lẫn
    WebGL2; mức thấp không có phản chiếu nên đo được 24. Mục tiêu chính là **tổng ≤ 45** (e2e đo ở mức cao).
- **Poster:** WebP 150 KB trở xuống (GĐ 4).
- **JS:**
  - Chunk `three` đo được khoảng 243 KB gzip. Con số này gần như cố định, vì `three/tsl` kéo cả namespace nên không tree-shake được.
  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,6 KB; cộng Tweakpane 328,5 KB.)
  - Mục tiêu cho cả đường 3D: **450 KB gzip trở xuống**. Số đo ghi vào README.
  - Inspector (39 KB) và stats-gl (10 KB) chỉ tải khi có `?debug`.
- **Máy yếu:** biên dịch trước bằng `scenePass.compileAsync(renderer)`, rồi vẽ một khung ẩn trong lúc poster còn hiện.
- **`prefers-reduced-motion`:** `CameraSpec.breathe` bị ép về 0, gợn sóng nhẹ hơn.

## 11. Âm lịch và pha trăng (`src/lib/astro/`, chỉ trả về số)

**`lunar.js`:**
- Thuật toán Hồ Ngọc Đức, múi giờ là tham số (mặc định +7).
- Hàm chính:
  - `convertSolar2Lunar(d, m, y, tz)` trả `{ day, month, year, leap }`.
  - `convertLunar2Solar`, trả `null` với tháng nhuận không tồn tại.
  - `newMoon(k)` trả `{ k, jd, day }`: JD chính xác và ngày nguyên.
  - `lunarFromDate(date, tz)` đọc ngày theo UTC+tz, nên kết quả không phụ thuộc múi giờ của máy.
  - `canChiIndex(year)` trả `{ can: 0–9, chi: 0–11 }`.
- **Không có chữ:** bảng tên tháng, can và chi nằm ở `ui/strings.vi.js`.

**`moon.js`:**
- `moonPhase(date)` trả `{ phase, age, illumination, waxing }`.
  - Tuổi trăng tính từ trăng mới **đã xảy ra** gần nhất (dùng JD chính xác của `lunar.js`), nên không bao giờ âm.
  - `phase` đi từ 0 đến 2π: 0 là trăng mới, π là trăng tròn. Độ sáng `(1 − cos(phase))/2`.
  - Pha được nội suy thẳng theo từng đoạn trăng mới → trăng tròn → trăng mới. Kết quả đúng tại trăng mới và trăng tròn; sai số lớn nhất so với Meeus ch.48 là 0,074, ở gần trăng bán nguyệt. Có test khóa sai số dưới 0,08 cho năm 2026.
- `sunDirection(phase)` trả vector đơn vị trong view space của three (+x phải, +y lên, +z hướng về người xem). Vector thỏa `(1 + L·V)/2 = độ sáng`.
- `tonight(date, tz)` trả `{ instant, isNight, evening }`:
  - `isNight` đúng khi giờ địa phương từ 18:00 đến trước 05:30.
  - `evening` là 00:00 địa phương của ngày mà đêm bắt đầu.
- `hourOfNight(instant, evening)` trả số giờ tính từ `evening` (21:00 → 21, 02:00 hôm sau → 26).

**Nhãn con dấu:** `t.formatSeal({ day, month, leap, can, chi })` trong `ui/strings.vi.js` trả `"{ngày} tháng {Tên tháng}{ nhuận?} · {Can Chi}"`.
- Tên tháng: Giêng, Hai, Ba, Tư, Năm, Sáu, Bảy, Tám, Chín, Mười, **Mười Một**, Chạp. Tháng 11 mặc định là "Mười Một", vì ngày nay "tháng Một" dễ bị hiểu là tháng 1 dương lịch. Cách gọi cổ "Một" có qua `{ traditional: true }`.
- Can chi lấy theo **năm âm lịch**: một ngày cuối tháng Giêng dương lịch trước Tết vẫn mang can chi của năm cũ.
- `ui/shell.js` ghép `lunarFromDate(now)` với `canChiIndex(year)` rồi gọi `t.formatSeal`.

## 12. Kiểm thử

### Unit (Vitest 5, môi trường `node`; file nào cần DOM thì ghi `// @vitest-environment jsdom` ở dòng 1)
- **`lunar`:**
  - Tết 2024 = 2024-02-10, Tết 2025 = 2025-01-29, Tết 2026 = 2026-02-17.
  - Trung Thu 2025 = 2025-10-06, Trung Thu 2026 = 2026-09-25.
  - 2026-09-28 = ngày 18 tháng 8, năm 2026, `canChiIndex(2026)` là Bính Ngọ.
  - Tháng nhuận: 2023 nhuận tháng 2; các năm nhuận 2017–2033 khớp lịch.
  - Múi giờ: Tết 1985 là 21/1 ở +7 nhưng 20/2 ở +8.
  - Chạy đúng với mọi `TZ` của máy.
  - Mọi dữ liệu đã được đối chiếu độc lập bằng thuật toán Meeus.
- **`moon`:**
  - Độ sáng lớn hơn 0,97 lúc 21:00 +07:00 các đêm trăng tròn 2026-03-03, 2026-08-28, 2026-09-26.
  - Độ sáng nhỏ hơn 0,05 lúc 12:00 +07:00 ngày trăng mới 2026-09-11.
  - Có test cho `tonight()`, `hourOfNight()` và `sunDirection()`.
- **`strings`:** các assert chuỗi con dấu của bản kiểm cũ chuyển sang đây (`formatSeal`): tháng nhuận, can chi của năm âm lịch ở giáp Tết, tên tháng 11 và 12.
- **`flags`:**
  - `?webgl`, `?webgl=1` và `?webgl=0`.
  - `at`: có `+`, `%2B`, `Z`, không offset (hiểu là +07:00), chuỗi hỏng.
  - `freeze`: không có giá trị, và `freeze=N`.
- **`tier`:** bảng tình huống env giả lập:
  - WebGPU: có / không có / adapter fallback / `architecture: 'swiftshader'`.
  - WebGL2: renderer SwiftShader.
  - Cờ `?webgl`, `?static`, `?force3d`.
  - Không phải secure context; một phép dò ném lỗi.
- **`quality` (GĐ 0):** bảng `pickLevel`, `isMobile`, `budgetFor`. **GĐ 3:** độ trễ không dao động qua lại, đúng thứ tự `ladder`, không nâng vượt mức ban đầu.
  - (GĐ 3) Bộ điều chỉnh chạy trên chuỗi thời điểm khung giả: 60 fps đều thì không làm gì; 40 fps thì hạ sau đúng 2 cửa sổ; màn
    60 Hz không rớt khung thì nâng lại sau 5 cửa sổ; nâng rồi phải hạ ngay thì khóa; khóa nhịp 30 fps thì hạ hết rồi trả lại hết
    và thôi hạ; khoảng > 250 ms bỏ cửa sổ; chế độ canh để yên khi chậm vừa phải nhưng vẫn hạ khi quá tải nặng, không nâng;
    2 giây khởi động bị bỏ.
  - (GĐ 3) Trần 60 khung/giây (`createFrameCap`): màn 60 Hz dao động nhẹ và máy chậm không bỏ khung; màn 90/120/144 Hz vẽ
    khoảng 60 khung mỗi giây; tab hiện lại sau lâu thì vẽ ngay, không vẽ dồn.
- (GĐ 3) **`knob-set`:** `max` là hàm của env (trần theo mức) kẹp giá trị như `max` thường.
- (GĐ 3) **`ladder`:** `'dpr'` nở đúng số nấc theo DPR thật (DPR 1 thì không có); mục không có lớp nào đưa ra thì bỏ qua; apply/revert
  theo kiểu ngăn xếp; `degrade()` hết nấc thì trả `false`.
- (GĐ 3) **`studio`:** `compare()` tách số đo theo trạng thái của thí nghiệm, bỏ 0,25 s đầu sau mỗi lần đổi; `stats().cpuMs`.
- (GĐ 3) **`flags`:** `?level` đúng, sai, thiếu. **`badge`:** "hạ {n} nấc" và `data-steps`.
- (GĐ 3) **`noise`:** `fbm` với số octave là số (khai triển) và là node (vòng lặp); `curl` dựng được node vec3.
- (GĐ 3) **Lớp của Bức 1:** Sương (gán `fogNode` một lần; vòm trời `fog = false`; núm, thí nghiệm, nấc), Vàng lá (sprite `fog = false`;
  bỏ compute khi trọng số 0; CPU vs GPU dựng sprite thứ hai một lần; luật bay JS ra số hữu hạn và ở trong ao), Mặt nước (mức thấp
  không có reflector), Ánh trăng (bóng tĩnh chỉ vẽ lại khi có thứ đổi; khung bóng ôm hộp của ao).
- **`palette`, `tokens-css`, `random`, `deadline`, `disposer`.**
- **`layers`:** mọi tên uniform khớp `/^[A-Za-z_][A-Za-z0-9_]*$/`; `weight('cot')` bằng 1; id lạ thì ném lỗi.
- **`source`:** các helper chạy trên chuỗi mẫu.

### Luật (Vitest, tĩnh)
- **`tests/helpers/source.js`** dùng `parseSync` của `vite`, không thêm dependency:
  - `listSrc(re?)` trả `src/**/*.js` và `plugins/*.js`, đường dẫn tính từ gốc repo.
  - `stripComments(code)` thay chú thích bằng khoảng trắng và **giữ dấu xuống dòng**.
  - `importsOf(f) → {spec, target, dynamic, line}[]` bắt cả 5 dạng: `import … from`, `import '…'`, `export … from`, `export * from`, và `import()`.
    - Bỏ hậu tố `?…` trước khi phân giải; import có `?code|?raw|?url` không tính vào luật.
    - `import()` có tham số không phải chuỗi hằng là **lỗi luật**.
    - Import tương đối phải ghi đuôi `.js` hoặc `.css`.
  - `staticClosure(f)` chỉ đi theo import tĩnh tới file `.js` trong repo. Specifier trần và file `.css` là lá; không đi vào `node_modules`.
- **`rules/imports.test.js`:** bảng §8.2, đường nhẹ (danh sách cho phép), hàng rào từ vựng (kèm phần tự kiểm), và luật "không import `strings.*.js`".
- **`rules/files.test.js`**, áp cho mọi `src/**/*.js` và `plugins/*.js`:
  - Dòng 1 khớp `/^(\/\/|\/\*)/`.
  - Số dòng vật lý (như `wc -l`): trên 300 thì hỏng, kèm lời khuyên tách sang `parts/`. Từ 251 đến 300 thì in một bảng tổng hợp trong `afterAll`, không hỏng.
  - Sau khi bỏ chú thích, không còn các mẫu sau:
    - `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, `EffectComposer`;
    - `Math.random` (ngẫu nhiên phải có hạt giống);
    - import `time` hoặc `deltaTime` từ `three/tsl`.

### Hợp đồng (`tests/paintings/contract.test.js`, lặp qua registry; từ GĐ 2 lặp cả `_mau`)
- **GĐ 0:**
  - Meta hợp lệ:
    - `slug` trùng tên thư mục;
    - `poem.source` có mặt;
    - `layers[0].id === 'cot'`;
    - id duy nhất;
    - file trong `files` tồn tại, và mỗi file thuộc tối đa một lớp.
  - HTML của mỗi dòng registry khớp meta. Test đọc bằng `new JSDOM(html)` và so:
    - `data-painting`, `<title>`;
    - thơ, theo `textContent.trim()` sau NFC của từng con trong `[data-poem]`;
    - `src`, `width`, `height` của poster (`src` phải đúng bằng `meta.poster.src`).
  - `painting.js` có cùng danh sách id với `meta.layers`, đúng thứ tự. Test import module thật, vì `three/webgpu` dựng node graph được trong Node mà không cần GPU (đã kiểm).
  - Marker tĩnh khớp `knobs`.
- **GĐ 2:**
  - Content theo từng ngôn ngữ: đủ Hiểu (≤ 150 chữ), "Bạn vừa học", "Đọc thêm" (chỉ https), nhãn cho mọi núm, thí nghiệm và số đo. Sơ đồ (nếu có) là SVG có `<title>`, chỉ dùng màu của bảng đã ghép.
  - Runtime: dựng giống `run.js` (dùng chung `createCtx` và `buildLayers` với `gpu/layers.js`): `setup(fakeCtx)` rồi `createLayer` theo thứ tự, ở mức cao và mức thấp.
    - Renderer giả là một Proxy no-op ghi lại lời gọi.
    - Lớp phải trả `dispose`, `objects` hợp lệ, và mọi NodeMaterial có `emissiveNode`. Gỡ ngược (dispose hai lần) thì scene trống.
    - Mọi núm `js`/`rebuild` áp được giá trị của chính nó; thí nghiệm bật rồi tắt được; số đo trả số hoặc chuỗi.
  - Mọi file trong `LayerMeta.files` của bức đã deploy nằm trong glob `?code` (`hasCode`).
  - Chỉ kiểm HTML cho các dòng registry. Tranh mẫu `_mau` được kiểm như mọi bức, trừ HTML và glob code.
- **GĐ 3:**
  - `painting.quality` (nếu có): đủ ba mức; mọi mục của `ladder` là `'dpr'` hoặc `'<layerId>.<stepId>'` với lớp có thật, và khi dựng ở
    mức cao lớp đó có nấc ấy. Mọi nấc apply rồi revert được, và sau revert thì số đo của lớp về đúng như trước.
  - Thí nghiệm kiểu `compare` bật rồi tắt được như thí nghiệm thường.

### E2E (Playwright 1.63, Chromium headless shell, chạy trên bản build qua `vite preview`)
- **Cấu hình chung:**
  - `page.goto` dùng đường dẫn tương đối `./?…`; `baseURL` kết thúc bằng `/son-mai-anh-sang/`.
  - E2e chờ `__sma.state` là `'live'` hoặc `'static'`. Nếu gặp `static` khi không mong đợi thì hỏng và in `reason`.
- **Project `webgl2-swiftshader` (cổng chặn):**
  - Cờ khởi chạy: `--use-angle=swiftshader --enable-unsafe-swiftshader`.
  - URL `./?webgl&force3d&freeze=10` và `./?webgl&force3d&freeze=40`. Mỗi ảnh có cả điểm sáng lẫn điểm tối; hai ảnh khác nhau.
  - Đọc pixel bằng `locator('canvas').screenshot()`, không dùng `toDataURL` (cách đó trả ảnh đen trên WebGL2).
  - `data-backend="webgl2"`.
  - Không có lỗi console (cần favicon thật), và không có cảnh báo khớp `/deprecated|renamed|has been removed/i`.
- **Project `webgpu-swiftshader` (không chặn, cho tới khi chạy ổn trên ubuntu):**
  - Cờ khởi chạy: `--enable-unsafe-webgpu --use-angle=swiftshader --enable-unsafe-swiftshader`.
  - Các kiểm tra như trên với `./?force3d&freeze=N`. Tự bỏ qua nếu không có adapter.
- **`?static`:**
  - Thấy poster, thơ và con dấu; không có canvas; **không có request nào tới chunk `three`**.
  - `./?static&at=2026-09-28T21:00` cho con dấu `18 tháng Tám · Bính Ngọ`.
- **GĐ 1:** chạm mặt nước thì ảnh đổi, so hai lần chạy cùng `?at&freeze=N` khác nhau đúng một thao tác.
- **GĐ 2:**
  - Với mỗi lớp khác Cốt, `__sma.setWeight(id, 0)` thì ảnh khác (cùng `freeze`, cùng số khung); đặt lại 1 thì về đúng ảnh cũ.
  - Sổ tay: chọn lớp đầu tiên có núm, di chuột lên núm thì dòng code sáng lên; không lớp nào có núm thì bỏ qua.
  - Mất context WebGL: lần đầu → `lost` + "Dựng lại cảnh" → bấm → live với canvas mới và trọng số đã restore; lần hai → tĩnh.
  - `?static`: Sổ tay chỉ đọc mở được và vẫn không tải chunk three.
  - Bức 1: chế độ mài (lời mời → đất sét → "Phủ lớp tiếp theo" → đóng thanh lớp thì đủ lớp); giữ tay trên mặt nước thì ảnh khác.
- **GĐ 3:**
  - Mọi bức: hạ hết mọi nấc bằng `__sma.degrade()` (cùng khung `?freeze`) thì cảnh vẫn vẽ, ảnh có sáng có tối, không lỗi console;
    nâng lại hết bằng `upgrade()` thì về đúng ảnh cũ.
  - Bức 1: vuốt trên mặt nước thì ảnh khác lần không vuốt (cùng `?at&freeze`); ở mức cao (`webgpu-swiftshader`) `__sma.stats().drawCalls`
    ≤ 45; `?level=thap` lên live với `__sma.level === 'thap'`, ảnh có sáng có tối; Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU"
    thì hai cột "Tắt / Bật" đều có số.
- (GĐ 3) Ngưỡng "có sáng có tối" của e2e: điểm tối (kênh lớn nhất < 30) trên 3% (trước là 10%): trời chàm và sương làm ảnh ít
  điểm đen tuyệt đối hơn nền đen then cũ (đo được 7–8% ở khung 10); 3% vẫn đủ chứng minh ảnh không cháy trắng, không trống.
- **GĐ 4:** "mài về cốt". Mọi trọng số về 0 thì ảnh có độ bão hòa thấp, độ sáng trung bình gần `datSet`, và độ lệch chuẩn độ sáng đủ lớn (thấy hình khối).
- Ảnh chụp và trace lưu vào `e2e/.results/`.

### Kiểm tra thủ công
- `chrome://gpu` trên máy của Bao.
- Điện thoại thật của Bao, cả Android lẫn iOS nếu có.
- Safari 26 (WebGPU).
- Local có project tùy chọn `E2E_REAL_GPU=1`, dùng GPU thật qua `channel: 'chromium'`.
- (GĐ 3) Điện thoại tầm trung từ 45 fps trở lên (`?debug=stats`), cả khi bộ điều chỉnh đã chạy vài chục giây.
- (GĐ 3) Lượt màu: ảnh chụp trên GPU thật (1280×800 và 390×844) so với poster; Bao duyệt trước khi ghi giá trị mặc định mới.

## 13. Repo, CI, deploy

- **Remote:** `github.com/giabao2610/son-mai-anh-sang`, **public**, giấy phép MIT.
- **Thứ tự deploy lần đầu:**
  1. `gh repo create giabao2610/son-mai-anh-sang --public --source=. --remote=origin --push`.
  2. `gh api --method POST repos/giabao2610/son-mai-anh-sang/pages -f build_type=workflow`. Nếu nhận 409 thì dùng `PUT`.
  3. `gh workflow run deploy.yml --ref main`, rồi `gh run watch`.

  Lần chạy đầu (trước khi bật Pages) đỏ là bình thường.
- **Commit:** mọi commit mang `Bao Nguyen <giabao261096@gmail.com>`, cấu hình local trong repo.
- **Node 24 LTS**, cài theo thư mục để không đổi Node của các project công việc:
  - `brew install fnm`;
  - thêm `eval "$(fnm env --use-on-cd --shell zsh)"` vào `~/.zshrc`;
  - `fnm install 24`.

  Repo có `.nvmrc` ghi `24` và `engines.node` ghi `>=24`. CI dùng `node-version-file: .nvmrc`.
- **Phiên bản đã kiểm:** `three@0.186.1` (ghim cứng), `vite@^8.3.1`, `vitest@^5.0.2`, `jsdom@^30`, `@playwright/test@1.63.0` (ghim cứng), `@fontsource/*@^5.3.0`, `tweakpane@^4.0.5`, `stats-gl@^4.2.3`, `shiki@^4.4.3`.
- **`.gitignore`:** `node_modules/ dist/ e2e/.results/ test-results/ playwright-report/ .DS_Store`.
- **Scripts:** `dev`, `build`, `preview`, `test` (vitest run), `e2e` (`vite build && playwright test`). Chạy e2e local lần đầu cần `npx playwright install chromium`.
- **Vite:** `base: '/son-mai-anh-sang/'`, `build.target: 'es2022'`. Chunk `three` tách bằng `rolldownOptions.output.codeSplitting.groups` (`manualChunks` đã deprecated trong rolldown).
- **Vitest:** `include: ['tests/**/*.test.js']`. Nếu thiếu dòng này, Vitest 5 gom luôn cả `e2e/*.spec.js`.
- **GitHub Actions (`deploy.yml`):**
  - Các action: `actions/checkout@v7`, `setup-node@v7` (`node-version-file: .nvmrc`, cache npm), `upload-artifact@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
  - Các bước: `npm ci` → `npm test` → `npm run build` → `npx playwright install --with-deps --only-shell chromium` → `npx playwright test --project=static --project=webgl2-swiftshader` (chặn) → `npx playwright test --project=webgpu-swiftshader` (`continue-on-error`) → giữ ảnh e2e → upload → deploy.
  - Chỉ deploy từ `main`, và chỉ khi mọi bước chặn đều qua.
- **URL:** `https://giabao2610.github.io/son-mai-anh-sang/`.
- **Luật trong `CLAUDE.md`:**
  - **Nguồn tham chiếu:**
    - Chỉ dùng TSL. Ghim `three@0.186.1`.
    - Đối chiếu API với `node_modules/three/src` và `examples/jsm`. Example HTML **không có trong gói npm**: xem tại `github.com/mrdoob/three.js/tree/r186/examples`.
    - Không dùng `ShaderMaterial`, `EffectComposer`, `onBeforeCompile`, hay các API deprecated ở §3.
  - **Ranh giới:**
    - Xưởng không import bức; các bức không import lẫn nhau.
    - Theo luật hai lần. Hợp đồng chỉ thêm trường tùy chọn.
    - Id đã deploy (slug, layerId, knobId, dialId) là API công khai.
  - **Shader và TSL:**
    - Không đổi `renderer.toneMapping` lúc chạy.
    - Không đặt số lên material lúc chạy; đi qua uniform trong node.
    - Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled` hay `scene.fogNode` lúc chạy.
    - **Không dùng `select()` cho nhánh có node dùng chung.** Dùng `Fn` + `.toVar()` + `If`.
    - Tên uniform (`setName`) phải là định danh hợp lệ, không có `-`.
    - TSL không có `atan2`: dùng `atan(y, x)`. Dùng `setName` thay cho `label()`.
  - **Chuyển động và ngẫu nhiên:**
    - Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time`.
    - Không dùng `Math.random`; dùng `lib/random.js`.
  - **Chữ và chú thích:**
    - Mọi material gán `emissiveNode`.
    - Chữ người xem thấy nằm trong `strings`/`content`/`meta.name`.
    - Chú thích tiếng Việt ở những điểm cần học.
  - **Commit:** dùng email cá nhân.

## 14. Lộ trình

Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans/`). Kế hoạch của giai đoạn sau được viết khi giai đoạn trước đã xong và đã deploy.

| Giai đoạn | Nội dung | Điều kiện xong |
|---|---|---|
| **0 · Nền móng** | Xem danh sách ngay dưới bảng | URL công khai chạy Ao Sen Đêm v0 trên cả 2 backend; `?static` hoạt động; unit, luật và hợp đồng đều qua; cổng e2e qua trong CI |
| **1 · Ao sen đầu tiên ✨** | Lớp 1, 2, 4 hoàn chỉnh (gợn sóng xẻ trăng); đom đóm bản đơn giản; `setup`/`shared.js` (giờ mặc định điều khiển trăng); `input.js` + cử chỉ + tia + `ctx.u.pointer`; `CameraSpec.breathe`; `lib/tsl/noise.js`; `content.vi.js` (gợi ý) + lời mời; `ui/moon-svg.js` + `[data-moon]`; `?debug` Inspector và `?debug=stats` (`gpu/debug.js`); e2e `ao-sen-dem.spec.js` | "Phép màu" hiện rõ trên laptop và điện thoại; đã deploy |
| **2 · Sổ tay** | Hoàn thiện `contracts/runtime.js`; núm `js`/`rebuild` + `onKnob`; thanh lớp, chế độ mài; Sổ tay 3 tab; Tweakpane (import động); code sống; nhãn chuyển sang content; tween trọng số; `snapshot`/`restore` + "Dựng lại cảnh"; `sma.expose()`; Phủ bóng chọn tone bằng `If` + đủ núm; tranh mẫu `_mau`; contract test đầy đủ; Phá cho lớp 1/2/4; e2e `setWeight` và Sổ tay | Bật/tắt lớp không khựng; test marker và hợp đồng qua |
| **3 · Sương + Vàng lá GPU** | Lớp 3 hoàn chỉnh; lớp 5 compute + biến thể CPU; `degrade`, `quality.js` của bức và `ladder`; bộ điều chỉnh chất lượng chạy thật. Kèm theo (chốt khi lập kế hoạch GĐ 3): trần 60 khung/giây, trần núm theo mức, bộ điều chỉnh canh cả khi Sổ tay mở; vuốt → sương xoáy; curl noise; thí nghiệm `compare` + ms CPU; `?level`; huy hiệu "hạ {n} nấc"; `__sma.quality/degrade/upgrade/stats`; mục hoãn của GĐ 2 (phản chiếu giả ở mức thấp, bóng tĩnh + khung bóng ôm sát, bỏ compute khi `w5 = 0`, đo draw call); Phụ lục A.29+; lượt màu cả bức so với poster | Điện thoại từ 45fps trở lên; mức cao ≤ 45 draw call; đã deploy |
| **4 · Phủ bóng + Kính mài** | Phủ bóng hoàn chỉnh (chặng `display`: LUT từ bảng màu, grain, vignette, FXAA; `tap`); `Tool` + Kính mài + Lột lớp dựng từ `views()`; `Dial` + `ui/dials.js` + thanh giờ; `?poster` + poster thật + og (`scripts/poster.js`); e2e "mài về cốt"; kiểm tra a11y; README gồm mục "Thêm một bức tranh mới" | Mọi e2e qua; đã deploy; README đầy đủ |
| 5 · *(tùy chọn)* | Thả hoa đăng mang một dòng thơ; link "công thức" (`#r=`); "Từng sợi"; "Xem bản dịch" (WGSL/GLSL); tiếng đàn bầu tổng hợp (chỉ khi người xem bật); trăng làm thanh tiến độ | tùy |
| 6 · *(mở rộng)* | Bức mới theo luật 7: Đèn kéo quân (shadow map vs gobo `atan(y, x)`), Đông Hồ (hạt compute), Cung Quế (SDF raymarch) | tùy |

**GĐ 0 · Nền móng gồm:**
- **Máy và công cụ:** Node 24 (hướng dẫn fnm), Vite 8, Vitest 5, Playwright; `.gitignore`; `CLAUDE.md`; README khung.
- **Xưởng (phần nhẹ):** `flags`, `tier`, `quality` (chọn mức), `palette`, `deadline`, `sma`, `static` (theo lý do), `boot`, `contracts/`.
- **Xưởng (phần nặng):**
  - `gpu/run`: vòng đời, hòa dần, 3 khung lỗi, lỗi GPU, hạn 10 giây.
  - `gpu/stage`: renderer, nền đặc, camera và controls từ `CameraSpec`, đồng hồ tất định, resize, DPR, mất device.
  - `gpu/disposer`.
  - `gpu/pipeline`: MRT có blend cho emissive; chuỗi `build` → `renderOutput` → `display`; alpha 1.
  - `gpu/layers`: trọng số, núm tĩnh thành uniform có tên hợp lệ.
- **Lớp dùng chung:** Phủ bóng v0 (`meta` + `layer`): bloom chọn lọc, AgX trộn theo `w` (viết bằng `Fn` + `.toVar()`), núm `bloomStrength` và `exposure`.
- **Hộp màu:** `random`, `astro/lunar`, `astro/moon` (chỉ trả số; code gốc đã kiểm bằng 54 test).
- **Giao diện:** `strings.vi` (`t` + `formatSeal`), `shell` (con dấu, `data-state`, hòa dần), `badge` (`data-backend`).
- **Bức 1:**
  - `registry` (`SITE`, `lang`), `ao-sen-dem/meta` (+ `fence`), `index`, `painting` (4 lớp v0 + camera).
  - `l1` v0: lá instanced + đèn xưởng.
  - `l4` v0: đĩa nước + reflector, núm `distortion`, `fresnelPower`.
  - `l5` v0: sprite compute, núm `size`, `glow`.
- **Test:**
  - Unit.
  - Luật (imports, files).
  - Hợp đồng: meta, HTML, thứ tự lớp, marker.
  - E2e: tĩnh (kèm con dấu theo `?at` và không có request three), cổng WebGL2, WebGPU không chặn.
- **Deploy:** repo public, Pages, CI.

## 15. Công thức mở rộng

**(a) Thêm một bức (ví dụ Đèn kéo quân)**
1. `cp -r src/paintings/_mau src/paintings/den-keo-quan`, rồi sửa `slug`, `no`, `title`, `tagline`, `poem`, `poster`, `og` và **`fence`** (từ vựng riêng của bức mới) trong `meta.js`.
2. Viết `layers/lN-*.js` (mỗi file có `id`, `knobs`, `createLayer`), `shared.js` nếu cần, rồi `painting.js` (layers, camera, quality, setup) và `content.vi.js`.
   - Lớp cuối thường là Phủ bóng dùng chung: import `meta` của nó trong meta, `layer` trong painting, `content` trong content.
   - Muốn đổi mặc định của lớp dùng chung thì ghi đè trong `painting.js`: `{ ...phuBong, knobs: phuBong.knobs.map((k) => k.id === 'bloomStrength' ? { ...k, value: 0.3 } : k) }`. Chỉ đổi `value`, `min`, `max`, không đổi `id`.
3. Copy `index.html` sang `tranh/den-keo-quan/index.html`. Sửa `data-painting`, title, thơ, poster, og và dòng import. Bỏ `<svg data-moon>` nếu bức không có trăng.
4. Thêm một dòng vào `paintings/registry.js`: `{ meta, page: 'tranh/den-keo-quan/index.html', lang: 'vi' }`.
5. Đặt poster vào `public/paintings/den-keo-quan/`, hoặc chạy `node scripts/poster.js den-keo-quan`.
6. Chạy `npm test` rồi sửa theo từng lỗi tiếng Việt. Chạy `npm run e2e`: e2e chung tự chạy trên bức mới. Tương tác riêng của bức viết vào `e2e/den-keo-quan.spec.js`.
7. Cần thứ gì của Ao Sen Đêm thì **không import chéo**; rút nó lên trước theo công thức (e). Cần khả năng mới của xưởng thì thêm **trường tùy chọn** vào hợp đồng (luật 7).

**(b) Thêm một lớp**
1. Tạo `layers/lN-<id>.js` gồm `export const id`, `export const knobs` và `export function createLayer(ctx, shared)`.
   - Màu nào cũng đi qua `mix(datSet, màu, ctx.weight(id))`.
   - Mọi material gán `emissiveNode`.
   - Thứ lớp sau cần thì ghi vào `shared.<id>`.
2. Với mỗi núm `uniform`: lấy uniform bằng `ctx.knob('<id>')` và ghi `// @knob <id>` ở dòng dùng nó. Núm `js`/`rebuild` thì đặt `via` và thêm `onKnob[id]`, với marker ở dòng xử lý.
3. Thêm `{ id, name, files }` vào `meta.layers`, và thêm module vào `painting.layers`, ở cùng vị trí.
4. Thêm `content.vi.js › layers[<id>]`.
5. Nếu lớp tốn tài nguyên: thêm `degrade` (không đụng tới thứ nằm trong cache key), thêm khóa vào `quality.levels`, và đặt vị trí trong `ladder`.
6. Chạy `npm test`. Thanh lớp, lời mời "{n} lớp" và chế độ mài tự nhận lớp mới.

**(c) Thêm một công cụ học**
1. Tạo `src/engine/tools/<id>.js` export `{ id, mount(api) }`.
   - Công cụ ảnh dùng `api.views()` và `api.requireView()`.
   - `overlay()` được ghép một lần; đổi chế độ bằng uniform, dùng `If` trong `Fn`.
   - Công cụ soi (ví dụ "Từng sợi") cần các trường tùy chọn `ToolApi.layers()`/`stats()`, thêm khi làm công cụ đó (§16).
2. Thêm một dòng vào `tools/index.js`; thêm chữ vào `ui/strings.vi.js`.
3. Cần buffer mới thì có hai cách: lớp gọi `tap()` trong `post`, hoặc xưởng thêm một kênh (biên dịch lại một lần, hiện "đang mài…").
4. Thêm một kiểm tra vào `e2e/painting.spec.js`. Kiểm tra đó tự chạy trên mọi bức.

**(d) Thêm một ngôn ngữ (ví dụ `en`)**
0. Bật luật tự động "chữ tiếng Việt chỉ nằm trong `strings`/`content`/`meta.name`" trong `rules/files.test.js`.
1. Viết `content.en.js` cho mỗi bức (và cho lớp dùng chung), rồi thêm vào `index.js › content`.
2. Viết `ui/strings.en.js` với cùng bộ khóa như bản `vi`, kèm `formatSeal`.
3. Thêm các trường tùy chọn vào `PaintingContent`: `title`, `tagline`, `posterAlt`, `poemTranslation`. Thêm `LayerContent.name`; UI hiện `content.layers[id].name ?? meta.name`.
4. Tạo trang tĩnh `en/…` (chữ trên poster phải có sẵn trong HTML), rồi thêm dòng registry với `lang: 'en'`. Test HTML so với content khi `lang !== 'vi'`. Đây cũng là lúc làm trình sinh HTML (§16).
5. Thơ giữ nguyên bản gốc, kèm bản dịch nghĩa tự viết. Chú thích code vẫn viết tiếng Việt.

**(e) Rút một kỹ thuật TSL ra dùng lại**
1. Theo luật hai lần: chỉ rút khi bức thứ hai thật sự cần.
2. `git mv` phần chung sang `src/lib/tsl/<ten>.js`. Đổi đầu vào thành tham số và bỏ từ vựng của bức; hàng rào từ vựng sẽ bắt nếu còn sót.
3. Nếu dùng lại cả một lớp thì tạo `engine/stock/<id>/` gồm `meta.js`, `layer.js`, `content.vi.js` (viết trung tính).

## 16. Để sau (đã có đường đi) và không làm

| Việc | Khi nào | Đường đi |
|---|---|---|
| Trình sinh HTML | Khi có Bức 3 hoặc bản tiếng Anh | `plugins/vite-plugin-paintings.js` sinh trang từ template, meta và content; test HTML giữ nguyên vai trò |
| Phòng tranh `/tranh/` | Khi có từ 2 bức hoàn chỉnh | Trang tĩnh đọc registry, không có three. URL gốc vẫn là Bức 1 |
| Link công thức `#r=` | GĐ 5 | `engine/recipe.js` (hàm thuần) mã hóa `snapshot()` = `{ weights, knobs: {'layerId.knobId': v}, dials }`. Giải mã trước `createLayer`; chỉ ghi các giá trị khác mặc định, kẹp theo `max` của tầng |
| Xem bản dịch | GĐ 5 | `renderer.debug.getShaderAsync(scene, camera, obj)` cho từng `layer.objects`. Tên đặt bằng `setName` giúp đọc được mã sinh ra |
| Công cụ soi ("Từng sợi") | GĐ 5 | Trường tùy chọn `ToolApi.layers() → {id, objects, weight}[]` và `stats() → {drawCalls, triangles, ms}` (số của khung trước) |
| Đàn bầu | GĐ 5 | Trường tùy chọn `Painting.sound` cùng `lib/audio/`, chỉ phát khi người xem bật |
| Đông Hồ | GĐ 6 | `CameraSpec.kind: 'ortho'` (trường tùy chọn); rút hạt compute lên `lib/tsl/particles.js`; `meta.palette` |
| Cung Quế | GĐ 6 | Mesh toàn màn hình dùng `vertexNode`/`depthNode`; nấc đầu tiên là `maxSteps`; trường tùy chọn `meta.requires` (tầng tối thiểu) |
| Wrap lighting cho cánh sen | Khi làm lighting model riêng (GĐ 5+) | `LightingModel` tự viết cho cánh; hiện viền fresnel + `translucency` đã cho cảm giác cánh mỏng |
| Test số của `rippleHeight` | Khi có bộ tính TSL trên CPU | Hiện chỉ kiểm dựng được node; e2e "chạm mặt nước đổi ảnh" giữ hành vi |
| Đo ms GPU thật cho thí nghiệm `compare` | Khi máy mạnh cần thấy khác biệt (hai cột ms khung bằng nhau vì khóa 60 Hz) | `trackTimestamp` chỉ khi `hasFeature('timestamp-query')` (Phụ lục A.21: máy không có thì tắt lại cờ); `resolveTimestampsAsync` mỗi khung |
| Tự lùi về đom đóm CPU khi compute WebGL2 hỏng | Khi gặp máy thật lỗi | Đếm lỗi của `renderer.onError` trong vài khung đầu; quá ngưỡng thì bật biến thể CPU làm mặc định cho lần dựng đó |
| Rút `curl`, noise JS sang dùng chung | Luật hai lần | `curl` đã ở `lib/tsl/noise.js` (spec đặt từ đầu); noise JS của biến thể CPU ở lại `parts/vang-la-cpu.js` tới khi bức thứ hai cần |

**Không làm**, và lý do:
- **npm workspaces:** một repo, một người đọc; thư mục cộng test ranh giới là đủ.
- **plugin loader, SPA router:** mỗi bức là một trang, GH Pages phục vụ trực tiếp.
- **scene DSL / JSON, ECS, class kế thừa cho lớp:** hàm thuần `createLayer` dễ đọc hơn cho người học.
- **thư viện i18n:** đuôi `.vi.js`, map `content` và `t` truyền qua tham số là đủ.
- **event bus, state store:** trạng thái đã nằm trong uniform; `snapshot()` suy ra từ đó.
- **validator chạy ở production:** CI đã chặn trước.
- **TypeScript:** JSDoc là đủ, và không cần bước build.

## 17. Rủi ro và cách tránh

- **API TSL thay đổi nhanh, AI hay bịa API.**
  - Ghim phiên bản; đối chiếu với `node_modules/three/src`, `examples/jsm` và tag `r186`; ghi luật trong `CLAUDE.md`.
  - Bản thử GĐ 0 (Ao Sen Đêm v0) dùng đúng các API mà cảnh sẽ dùng.
  - Phụ lục A là bằng chứng đã kiểm, gồm cả những cái bẫy đã tìm ra (`select()`, target của reflector, tên uniform).
- **WebGL2 qua WebGPURenderer trên Android yếu.**
  - Mức thấp mặc định dùng phản chiếu giả.
  - `compileAsync` chạy sau khi poster đã hiện.
  - Có bộ điều chỉnh tự động; chấp nhận mục tiêu 45fps.
- **Compute trên WebGL2.** Đã chạy được, với giới hạn 4 bộ đệm mỗi kernel và chỉ đọc phần tử của chính mình. Biến thể CPU là đường lùi chính thức.
- **WebGPU trên CI ubuntu chưa rõ.** Project WebGPU e2e để không chặn cho tới khi lần chạy đầu cho thấy kết quả.
- **Pixel khác nhau giữa các máy.** So pixel chỉ trong cùng máy, cùng backend, cùng `?freeze=N`. Ngưỡng "sáng/tối" rộng, không so ảnh tuyệt đối.
- **Trông na ná "ao đêm có đom đóm" của các trang khác.** Dùng chất liệu sơn mài thật (clearcoat, LUT sơn mài), màu sen lấy từ ca dao, không neon, bloom chọn lọc.
- **Logic của bức rò vào xưởng.** Có hàng rào từ vựng lấy từ meta của mọi bức, test ranh giới và luật hai lần.
- **Mở rộng làm chậm Bức 1.** Các điểm nối tốn khoảng 1–1,5 ngày tính cả test, rải qua các giai đoạn. GĐ 0–4 chỉ làm những gì ghi ở §14.
- **Phạm vi phình to.** Chưa đạt ngân sách FPS thì không thêm lớp; giai đoạn nào xong cũng phải deploy; giai đoạn 5 và 6 là tùy chọn.
- **(GĐ 3) Bộ điều chỉnh đoán sai.** Nhịp rAF không phải thời gian GPU: nó bị khóa theo màn hình và theo chế độ tiết kiệm pin.
  - Luật "dư" tính cả trường hợp không rớt khung; nâng rồi phải hạ ngay thì khóa nấc; hạ hết mà không nhanh hơn thì trả lại hết (§10).
  - Logic nằm trong một hàm thuần, test bằng chuỗi khung giả cho từng tình huống; chỉ canh quá tải nặng khi Sổ tay mở; tắt khi `?freeze`.
  - Huy hiệu và `__sma.quality()` cho thấy máy đang hạ gì, nên người xem và Bao biết khi nó hạ.
- **Máy của Bao đang tắt WebGL và dùng Node 20.** Kiểm tra `chrome://gpu`; cài Node 24 bằng fnm (§13). Tầng C giải thích cách bật lại tăng tốc phần cứng.

---

## Phụ lục A: sự thật API đã kiểm trên three@0.186.1

Các mục dưới đây đã được kiểm bằng ba cách:
- đọc mã nguồn đã cài và các example r186;
- chạy cảnh thử headless trên Chromium 153 với cả hai backend. Cảnh gồm reflector, sprite compute, bloom chọn lọc qua MRT, AgX dạng node, LUT sinh bằng code, grain, vignette và FXAA; kết quả là không có lỗi console, 21 draw call cho 4 đối tượng, compute đọc ngược về đúng;
- các bài kiểm riêng của 4 vòng phản biện.

1. **Khởi tạo renderer:** `WebGPURenderer` chỉ quyết định việc lùi về WebGL2 bên trong `await renderer.init()`. `powerPreference` bị bỏ qua trên WebGL. `alpha` mặc định là `true`, nên nếu không có `setClearColor(màu, 1)` thì chỗ trống sẽ trong suốt.
2. **`RenderPipeline`:** thay cho `PostProcessing` (deprecated từ r183). Sau khi thay `outputNode` phải tự đặt `needsUpdate = true`. Nếu `renderer.toneMapping` hoặc `outputColorSpace` đổi, pipeline tự dựng lại. Với `outputColorTransform = false`, three **không** tự thêm `renderOutput`.
3. **Biên dịch trước:** dùng `scenePass.compileAsync(renderer)`. `renderer.compileAsync(scene, camera)` biên dịch mà không có MRT và render target của pass. Reflector, bóng, bloom và quad vẫn biên dịch ở khung đầu, nên cần vẽ một khung ẩn.
4. **Blend của MRT:** các target MRT khác `output` mặc định **không blend**. Phải dùng `mrt.setBlendMode('emissive', new BlendMode(MaterialBlending))`. Trên WebGL, việc này cần `OES_draw_buffers_indexed`. Ở WebGPU compatibility mode, mọi target dùng blend của material.
5. **`bloom`:** `bloom(node, strength, radius, threshold)` nằm ở `three/addons/tsl/display/BloomNode.js` và nhận được node làm tham số. Scale nội bộ mặc định là 0.5. Tốn 12 draw call mỗi khung.
6. **Tone mapping:**
   - Đổi loại qua `renderer.toneMapping` thì phải biên dịch lại (+2 program).
   - **`select()` sinh `if/else`:** node dựng trong nhánh rồi dùng lại bên ngoài sẽ đọc biến chưa gán, nên alpha bằng 0 và khung đen hoặc trong suốt. Cách đúng là `Fn` + `.toVar()` + `If`: +0 program, ảnh đúng.
   - FXAA cần đầu vào sRGB, nên đặt sau `renderOutput`.
7. **`reflector`:**
   - Dùng `reflector({ resolutionScale })`. Tùy chọn `resolution` đã deprecated từ r180.
   - Pháp tuyến là +Z cục bộ của `target`. Reflector đọc `target.matrixWorld` mà **không cập nhật**, nên target phải nằm trong scene (hoặc gắn vào mesh đã xoay).
   - Ảnh phản chiếu render không có MRT.
8. **`positionNode`:** trong r186 chạy sau instancing. Muốn dịch cả một instance thì cần attribute tâm instance.
9. **Sương:**
   - `scene.fogNode = fog(color, factor)` tính `mix(output.rgb, color, factor)`. Các hàm hệ số có sẵn dùng `−positionView.z`.
   - `fogNode` nằm trong cache key của mọi material: gán lại là biên dịch lại tất cả.
   - `NodeMaterial.fog` mặc định là `true`. Sương không tác động lên kênh `emissive`.
10. **Compute trên WebGL2** chạy qua transform feedback, với các giới hạn:
    - khoảng 4 bộ đệm được tham chiếu trong mỗi kernel;
    - `element(i)` bỏ qua `i`, trừ khi dùng `setPBO(true)`;
    - `count` phải là số;
    - `computeNode.count` và `sprite.count` đổi được lúc chạy.
11. **`renderer.info.render`** có `drawCalls`, `triangles`, `points`, `lines`, nhưng không có bộ đếm đỉnh. Loop của renderer reset `info` mỗi tick.
12. **Lỗi và mất device:**
    - `renderer.onDeviceLost(info)` áp dụng cho cả hai backend, nhưng WebGPURenderer không có đường khôi phục.
    - `renderer.onError(info)` nhận lỗi GPU không đồng bộ (validation, hết bộ nhớ, lỗi nội bộ); các lỗi này không ném từ `render()`.
13. **Headless Chromium:**
    - Không có cờ: có `navigator.gpu` nhưng `requestAdapter()` trả `null`.
    - Có cờ SwiftShader: `isFallbackAdapter === true` và `architecture === 'swiftshader'`.
    - `failIfMajorPerformanceCaveat` vẫn cho SwiftShader đi qua.
14. **Chi tiết nhỏ:**
    - `Data3DTexture` mặc định dùng `NearestFilter`.
    - `film()` không có trung bình bằng 0.
    - Inspector không import được ngoài trình duyệt.
    - `time`/`deltaTime` của TSL chạy theo đồng hồ riêng của renderer.
15. **Node thuần:** `three/webgpu` và `three/tsl` import được trong Node và dựng được node graph (material, reflector, instancedArray, pass + MRT + bloom). Vì vậy test hợp đồng có thể import lớp thật.
16. **Tên và hàm:**
    - `uniform().setName(name)` đưa `name` thẳng vào shader. Tên có `-` làm hỏng cả WGSL lẫn GLSL. `label()` đã deprecated từ r179.
    - TSL không có `atan2`: `atan(y, x)` với 2 tham số được biên dịch thành atan2.
17. **Bóng:**
    - `castShadow`, `receiveShadow` và `shadowMap.enabled` đều nằm trong cache key.
    - ShadowNode cập nhật một lần cho mỗi camera mỗi khung, nên camera ảo của reflector làm shadow map được vẽ hai lần.
18. **Vite 8:**
    - `parseSync(file, code)` trả `{ program, comments, module }` với vị trí chú thích đúng, kể cả khi có chữ tiếng Việt đứng trước.
    - Script module inline trong HTML, `rolldownOptions.input` nhiều trang và `codeSplitting.groups` đều build được. Entry không preload three. `vite:preloadError` có phát ra.
19. **`mrtNode` của material** (kiểm ở GĐ 1): ghép đè MRT của pass cho riêng material đó. Khi material bị vẽ vào render target
    không có MRT (ảnh của reflector), three dùng MỘT MÌNH `mrtNode` làm đầu ra: WGSL báo "structures must have at least one
    member", WebGL2 báo "Active draw buffers with missing fragment shader outputs". Chỉ dùng cho material không bao giờ lọt vào
    target như thế (mặt nước: reflector tự ẩn nó).
20. **`normalLocal` trong `positionNode`** (kiểm ở GĐ 1): `positionNode` chạy sau instancing; gán `normalLocal.assign(…)` bên
    trong nó có hiệu lực cho ánh sáng trên cả WebGPU lẫn WebGL2 (cánh xoay 90° sáng đúng như khi bật flatShading). Shadow
    map cũng dùng `positionNode` của material.
21. **Đo thời gian GPU của công cụ thợ** (kiểm ở GĐ 1, sửa lời ở GĐ 2, đọc mã nguồn): stats-gl 4.2.3 và `Inspector` của r186
    đặt `renderer.backend.trackTimestamp = true` TRƯỚC, rồi mới hỏi `hasFeature('timestamp-query')`: stats-gl chỉ bỏ biểu đồ
    GPU, Inspector chỉ ghi một dòng lỗi vào bảng của nó; không bên nào tắt lại cờ. `WebGPUBackend` chỉ tự kiểm lúc `init`. Máy
    không có tính năng này thì WebGPU báo lỗi validation mỗi khung. `engine/gpu/debug.js` tắt lại cờ sau khi gắn công cụ.
22. **OrbitControls và cử chỉ của bức** (kiểm ở GĐ 1): `onPointerDown` của OrbitControls bỏ qua sự kiện khi `enabled === false`.
    `input.js` nghe ở pha capture (chạy trước listener của OrbitControls trên cùng canvas) để thả camera kịp khi ngón thứ hai chạm
    xuống giữa lúc giữ. Dời `controls.target` rồi `update()` thì camera giữ nguyên vị trí, chỉ quay theo điểm nhìn.
23. **Đổi `count` lúc chạy** (kiểm ở GĐ 2, đọc `RenderObject.getCacheKey`): object có `isInstancedMesh` hoặc `count > 1` được
    thêm uuid vào cache key, nên đổi `InstancedMesh.count` (miễn không vượt sức chứa đã cấp phát) không biên dịch lại. Sprite
    về `count` 0 hay 1 thì đổi key. `ComputeNode.count` đổi được lúc chạy: WebGPU tính lại số nhóm dispatch khi count khác lần
    trước, WebGL2 đọc `count` mỗi lần.
24. **Vẽ lại ngoài vòng lặp** (kiểm ở GĐ 2, e2e): `Animation` của renderer chạy `requestAnimationFrame` từ lúc `init()`, kể cả
    khi `setAnimationLoop(null)`, và tăng `nodeFrame.frameId` mỗi nhịp. `PassNode`, `ReflectorBaseNode` (không bounce) và
    `ComputeNode` có `updateBeforeType = FRAME`: chỉ vẽ lại (tính lại) một lần mỗi `frameId`. Hai lần `render()` trong cùng một
    nhịp thì lần sau dùng lại ảnh cảnh cũ, chỉ hậu kỳ chạy lại. Muốn vẽ lại sau khi đổi uniform thì đợi nhịp rAF kế tiếp.
25. **Núm đổi được mà không biên dịch lại** (kiểm ở GĐ 2): `ShadowNode` gọi `shadowMap.setSize(mapSize)` mỗi lần cập nhật, đọc
    `bias` và `normalBias` bằng `reference()`; `reflector.resolutionScale` đọc mỗi khung; `bloom(node, strength, radius,
    threshold)` giữ nguyên node được truyền vào (`isNode ? node : uniform(x)`).
26. **Inspector gắn bảng vào CHA của canvas** (kiểm ở GĐ 2): `[data-stage]` là `position: fixed`, tức một stacking context nằm dưới
    lớp chữ, nên bảng bị chữ đè. `engine/gpu/debug.js` dời bảng ra `body` sau một nhịp microtask.
27. **Tweakpane 4.0.5** (kiểm ở GĐ 2, jsdom + trình duyệt): `<option>` của danh sách có `value` là chỉ số, nhãn là chữ; sự kiện
    `change` có `last` (true khi thả tay); số mặc định chỉ hiện 3 chữ số thập phân (truyền `format` theo bước của núm); màu
    dùng `view: 'color'` với chuỗi `#rrggbb`. Chạy được trong jsdom. Nén gzip khoảng 31 KB.
28. **Shiki 4.4.3** (kiểm ở GĐ 2): `createHighlighter({ themes: [themeObject], langs: ['javascript'] })` nhận thẳng một theme
    TextMate dạng object; `codeToHtml(…, { transformers: [{ line(node, n) { node.properties['data-line'] = n; } }] })` gắn số
    dòng vào từng `<span class="line">`. Chạy lúc build (và trong Vitest), trình duyệt không tải Shiki.
29. **Compute trên WebGL2 có HAI bản của mỗi bộ đệm** (tìm ra ở review GĐ 2, e2e): transform feedback đọc một bản, ghi bản kia, rồi
    đổi vai sau mỗi lần chạy; kernel có `count` nhỏ hơn sức chứa chỉ ghi `[0, count)`. Kernel khởi tạo phải chạy HAI lần trên WebGL2,
    nếu không, tăng `count` lúc chạy thì phần tử mới đọc từ bản chưa từng được ghi (cả đám xuất phát ở gốc tọa độ).
30. **Tweakpane 4 `pane.refresh()` phát sự kiện `change`** cho những giá trị khác với trên màn hình (review GĐ 2, jsdom): đọc lại
    trạng thái thật bằng `refresh()` thì phải chặn bằng một cờ, kẻo nó bị tính là người xem vừa đổi núm.
31. **Gỡ MỌI mesh đang dùng một cặp material + geometry thì three gỡ luôn pipeline** (`usedTimes` về 0; review GĐ 2): lần dùng sau
    phải biên dịch lại. Thứ bật/tắt được (như "Tắt instancing") thì giữ một bộ mesh tạo một lần, bật/tắt chỉ hiện/giấu.
32. **jsdom không giữ `scrollTop` và không có layout** (review GĐ 2): test cuộn thì gắn setter giả cho `scrollTop` để ghi lại giá trị.
33. **`fogNode` nằm trong cache key của MỌI render object** (đọc mã nguồn r186, GĐ 3): `NodeManager.getCacheKey(scene, lightsNode)`
    đẩy `fogNode.getCacheKey()` vào khóa, và khóa của một node là băm cấu trúc đồ thị của nó. Đổi đồ thị của sương (thêm một octave
    khai triển) là mọi material biên dịch lại. Số thay đổi lúc chạy phải là uniform bên trong đồ thị cố định.
34. **Sương áp lên đầu ra của MỌI NodeMaterial có `fog = true`, kể cả Sprite** (đọc mã nguồn r186, GĐ 3): `NodeMaterial.setupOutput`
    thay đầu ra bằng `fogNode`, tức `mix(output.rgb, màu sương, hệ số)`, SAU khi emissive đã cộng vào ánh sáng. Hạt vẽ bằng
    `AdditiveBlending` mà để `fog = true` thì mỗi hạt cộng thêm một đĩa màu sương: phải đặt `fog = false` và tự nhân `(1 − hệ số)`.
35. **Shadow map tĩnh** (đọc mã nguồn r186 và kiểm bằng code chạy thật, GĐ 3: e2e đo 34 draw call ở mức cao, bóng không còn
    vẽ lại mỗi khung): `ShadowNode.updateBefore` vẽ khi `shadow.needsUpdate || shadow.autoUpdate`, tối đa
    một lần cho mỗi camera mỗi `frameId`, rồi đặt `needsUpdate = false`; không vẽ trong lúc biên dịch trước (`_isPreCompiling`).
    `renderShadow` gọi `shadowMap.setSize(mapSize)` và `shadow.updateMatrices(light)` mỗi lần vẽ. Vì vậy với `autoUpdate = false`,
    đổi cỡ map, bias hay hướng đèn thì phải đặt `needsUpdate = true` thì mới có hiệu lực.
36. **`BloomNode` đọc `resolutionScale` mỗi khung** (đọc mã nguồn r186 và kiểm bằng e2e "hạ hết nấc rồi nâng lại", GĐ 3): `updateBefore` gọi `setSize(kích thước, …)` với
    `_resolutionScale` hiện tại, và `RenderTarget.setSize` chỉ cấp phát lại khi kích thước đổi. `setResolutionScale` lúc chạy
    không biên dịch lại.
37. **Vòng lặp thật và thuộc tính instance động trong TSL** (kiểm bằng code chạy thật trên WebGPU và WebGL2, cả SwiftShader lẫn
    GPU thật, GĐ 3): `Loop(5, ({ i }) => { If(float(i).greaterThanEqual(u), () => { Break(); }); … })` với `u` là uniform biên dịch
    và chạy đúng trên WGSL lẫn GLSL (sương của lớp Sương); `i` là số nguyên nên phải đổi sang float trước khi so với uniform.
    `instancedDynamicBufferAttribute(attr)` (thuộc tính instance, `DynamicDrawUsage`) làm `positionNode` của một `Sprite` có
    `count` chạy được: CPU ghi mảng rồi `attr.needsUpdate = true` mỗi khung (biến thể CPU của lớp Vàng lá).
38. **Sao không cần ảnh** (GĐ 3): `mx_cell_noise_float(floor(hướng × 220))` cho mỗi ô lưới một số ngẫu nhiên cố định; ô nào vượt
    ngưỡng thì có sao, lệch trong ô bằng ba lần `mx_cell_noise_float` nữa. Chạy trên cả hai backend, trong cả ảnh phản chiếu.
39. **Số đo chi phí** (GĐ 3, máy Mac Apple Silicon, Chromium, GPU thật): noise gradient 3D viết bằng JS tốn khoảng 30 ns một lần
    gọi (Node 24); một bước của 20.000 đom đóm trên CPU (18 lần gọi noise mỗi con) tốn khoảng 11 ms, 3.000 con khoảng 2 ms, trong
    khi bản compute chỉ tốn phần gửi lệnh. ms mỗi khung đứng yên ở 16,7 dù CPU bận thêm vài ms: trình duyệt khóa nhịp theo màn
    hình, nên thí nghiệm so sánh phải đo cả ms CPU.
