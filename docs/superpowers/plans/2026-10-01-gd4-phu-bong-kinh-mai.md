# GĐ 4 · Phủ bóng hoàn chỉnh + Kính mài + đo GPU thật: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kỹ thuật Sơn Mài Ánh Sáng có đủ đồ nghề để HỌC. Phủ bóng hoàn chỉnh (LUT "sơn mài" sinh từ bảng màu, hạt, tối góc, FXAA). Kính mài và Lột lớp cho nhìn vào giữa một khung hình. Thanh giờ đưa trăng đi qua đêm. Poster và ảnh chia sẻ chụp từ chính cảnh. Bộ điều chỉnh chất lượng đo thời gian GPU thật, để không hạ nấc oan khi trình duyệt khóa nhịp. Trợ năng được kiểm bằng axe-core. Nợ còn lại của GĐ 3 được trả. Deploy công khai.

**Architecture:** Giữ ba vùng của GĐ 0–3.
- **Xưởng:**
  - bộ điều chỉnh tách sang `engine/tuner.js` (hàm thuần), có đường tải: tải = max(ms GPU, ms CPU);
  - `engine/gpu/gpu-timer.js` đo ms GPU (`trackTimestamp`), bỏ số vô lý;
  - `engine/gpu/meter.js` giữ số đo của bàn thợ;
  - `engine/gpu/views.js` liệt kê các "view" của một khung (ảnh cuối, tap của lớp, emissive, normal lười, depth) và ghép overlay;
  - `engine/gpu/toolbox.js` gắn công cụ: `engine/tools/` có Kính mài, Lột lớp; cả hai chỉ nhìn view, không biết bức nào;
  - `engine/gpu/dial-set.js` giữ Dial (núm của cả bức);
  - `ui/rail-tools.js` và `ui/dials.js` vẽ mục "Đồ nghề" và thanh giờ trong thanh lớp;
  - cờ `?poster`.
- **Lớp dùng chung Phủ bóng:** chặng `display` (`stock/phu-bong/display.js`, `lut.js`), hai tap.
- **Bức 1:** Dial `gio`, ánh trăng theo độ cao, sương ấm lúc chạng vạng, poster WebP và og JPEG.
- **Công cụ và CI:** `scripts/poster.js`; e2e của GĐ 4 và `e2e/a11y.spec.js`; e2e WebGPU thành job riêng.

**Tech Stack:** Node 24 LTS · three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) · Vite 8 · Vitest 5 (+ jsdom) · Playwright 1.63 · Tweakpane 4.0.5 · Shiki 4.4.3 · stats-gl 4.2.3 · **@axe-core/playwright 4.13.0** (gói dev duy nhất GĐ 4 thêm, không vào bundle) · GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch lập luận từ spec; người thực thi đọc cả hai. Các mục hay dùng (tìm nhãn "(GĐ 4)"):
- §4.1: huy hiệu nói thật về nấc bị khóa, Sổ tay có ms GPU;
- §5: lượt màu của chặng display;
- §6 Lớp 6: chặng `display`, LUT, `tap`;
- §7: Kính mài (hai hình), Lột lớp, `requireView`;
- §8.4: `Tool`, `ToolApi`, `Dial`, cử chỉ `hover`;
- §8.7: `?poster`;
- §9: `__sma`;
- §10: bộ điều chỉnh đo GPU, sửa nợ GĐ 3, ngân sách;
- §12: test GĐ 4, kiểm tra thủ công;
- §13: CI;
- Phụ lục A: mục 40 trở đi.

**Code trong kế hoạch này đã chạy thật.** Trước khi viết kế hoạch, toàn bộ GĐ 4 đã được dựng thử trong một bản sao của repo (worktree `gd4-proto`), mỗi task một commit:
- Vitest xanh ở MỌI task. Số test sau từng task ghi ở bước "Toàn bộ test"; cuối cùng là 678 test.
- E2E xanh ở bản cuối:
  - `static` + `webgl2-swiftshader`: 33 test;
  - `webgpu-swiftshader`: 26 test;
  - GPU thật (`E2E_REAL_GPU=1`, WebGPU/Metal): 26 test.

  Playwright ghi các test còn lại là "skipped" vì chúng thuộc project khác.
- Đo trên GPU thật (Apple, Chrome):
  - 35 draw call ở mức cao (1280×800), 33 ở 390×844;
  - đủ 60 khung/giây ở cả ba mức, ms CPU mỗi khung 1,2–1,8 ms;
  - đường 3D 306,57 kB gzip (kể cả Tweakpane: 337,53 kB).
- **GPU Apple báo thời lượng các pass chồng lên nhau** (Phụ lục A.48). three cộng chúng lại thành khoảng 160 ms cho một khung
  16,7 ms. Vì vậy gpu-timer coi số lớn hơn 1,5 lần nhịp khung là vô lý, và trên máy đó bộ điều chỉnh đi đường nhịp như GĐ 3.
  Đường tải được test kỹ bằng chuỗi khung giả, nhưng chưa được kiểm trên một GPU mà số đo dùng được (Windows hay Linux).
  Việc đó nằm trong mục kiểm tay của Task 22.
- Ảnh lượt màu (trước và sau chặng display, 1280×800 và 390×844) và poster đã chụp trên GPU thật. Bao duyệt cùng lúc với kế
  hoạch này.
- Mọi khối code dưới đây sinh tự động từ đúng các commit đó:
  - file mới là nội dung cả file;
  - file sửa là một patch `git diff` hợp lệ. Lưu khối diff ra file rồi `git apply <file>`, hoặc sửa tay theo từng khối `@@`.
- Dòng "Kết quả mong đợi: FAIL" ở mỗi task là lỗi THẬT: nó ghi lại lúc chỉ áp phần test của task lên task trước.

## Global Constraints

Mọi task đều ngầm bao gồm các ràng buộc dưới đây (phần lớn là luật của `CLAUDE.md`; `npm test` giữ nhiều luật và báo lỗi tiếng Việt kèm `file:dòng`: gặp lỗi thì sửa code, không nới luật).

**Công cụ**
- Node **24** (`node -v` ra `v24.x`). Máy của Bao chưa có fnm: nếu `node -v` không ra v24, làm theo Task 1 · Step 1 (Node 24 bản portable trong thư mục tạm, không sửa `~/.zshrc`), và đặt `PATH` đó ở đầu mọi lệnh `node`/`npm`/`npx`.
- `three@0.186.1`, `@playwright/test@1.63.0` ghim đúng phiên bản. GĐ 4 chỉ thêm `@axe-core/playwright@4.13.0` (devDependency, Task 17).
- Chạy e2e trên SwiftShader khi máy rảnh. SwiftShader ăn CPU, nên khi máy đang bận, cảnh 3D quá hạn 10 giây và về tĩnh với lý do `timeout`. Đó không phải lỗi code: chạy lại khi máy rảnh.
- `vite preview` phục vụ đúng thứ đang có trong `dist/`: dừng lượt e2e đang chạy trước khi build lại. Playwright dùng lại server nào đang nghe cổng 4273, nên tắt `vite preview` mồ côi trước khi chạy e2e.

**Quy ước file**
- Dòng 1 của mọi `src/**/*.js`, `plugins/*.js` và `scripts/*.js`: `// <đường dẫn> — <một câu tiếng Việt nói file làm gì>`. Test giữ phần `src/` và `plugins/`.
- Mỗi file ≤ 250 dòng (quá 300 là test hỏng). JavaScript ESM thuần + JSDoc. Tên biến tiếng Anh, camelCase. Import tương đối ghi đuôi `.js`.
- Chú thích tiếng Việt ở chỗ cần học; lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.

**Ranh giới** (spec §8.2, `tests/rules/imports.test.js` giữ)
- Xưởng (`engine/`, `ui/`) không import bức; `ui/` không import `engine/` hay three; `lib/` là lá.
- `engine/tools/` là xưởng: công cụ chỉ nhìn view mà `views.js` liệt kê (ảnh cuối, tap, kênh), không biết có bức nào. Thêm một công cụ = thêm một file và một dòng trong `engine/tools/index.js`.
- Hàng rào từ vựng: code xưởng không chứa slug, id lớp riêng của bức hay từ trong `meta.fence`. Dial `gio` và chữ của nó nằm ở Bức 1 (`shared.js`, `content.vi.js`); xưởng chỉ biết "Dial".
- Đường nhẹ: `engine/flags.js` chỉ import `LEVELS` từ `engine/quality.js`, file này giờ chỉ còn mức và ngân sách. Bộ điều chỉnh (`engine/tuner.js`) chỉ tầng 3D dùng.

**TSL và three r186** (spec Phụ lục A)
- Chỉ TSL; không `select()` khi có node dùng chung giữa các nhánh (dùng `Fn` + `If`). Trong một `Fn` gọi ngay, thân nhánh của `If` viết trong ngoặc nhọn, không trả giá trị (A.46).
- Đổi MRT lúc chạy: `scenePass.setMRT(…)` TRƯỚC, rồi mới `getTextureNode(kênh mới)`. Không bao giờ gọi `getTextureNode` cho kênh chưa có trong MRT (A.44).
- `screenCoordinate` có gốc ở góc trên trái trên cả hai backend (A.45). FXAA và phép trộn cùng đọc một `convertToTexture` (A.47). `Lut3DNode` cần `Data3DTexture` với `LinearFilter`.
- Không đặt số lên material lúc chạy; mọi thứ đổi theo trọng số/núm/thí nghiệm/nấc/công cụ/Dial đi qua uniform trong node. Không đổi `renderer.toneMapping`, `castShadow`, `receiveShadow`, `shadowMap.enabled`, `scene.fogNode` lúc chạy. Alpha của ảnh cuối luôn là 1.
- Mọi material gán `emissiveNode` tường minh. `pow` với số mũ khác 2/3/4 thì cơ số phải `saturate`/`abs` trước.

**Phần cứng** (spec §1, §10: Bao muốn hợp nhiều loại máy, không ép phần cứng quá sức)
- Bộ điều chỉnh là hàm thuần, test bằng chuỗi khung giả. Số GPU vô lý thì bỏ; hỏng 3 lần liền thì thôi đo cho phiên đó, và mọi thứ chạy như máy không đo được.
- Nấc chỉ hạ TRẦN, không ghi vào núm; không đổi thứ nằm trong cache key. Cảnh vẽ tối đa 60 khung/giây; `?freeze` không có bộ điều chỉnh (ảnh tất định).
- Vẽ lại lúc `?freeze` gọi `update(0, t)`: lớp đồng bộ theo uniform vừa đổi mà KHÔNG tiến mô phỏng (compute, hạt CPU).

**Chuyển động và ngẫu nhiên**
- Không dùng `time`/`deltaTime` của TSL (dùng `ctx.u.time`, `ctx.u.delta`); không dùng `Math.random` (dùng `lib/random.js`).

**Chữ và trợ năng**
- Chữ người xem thấy nằm trong `ui/strings.vi.js`, `content.vi.js` hay các trường chữ của `meta.js`. Không file nào trong `src/` import `strings.*.js`.
- Vùng `aria-live` (`[data-hint]`, `[data-static]`, `[data-badge-note]`, dòng trạng thái của công cụ, ghi chú của Dial) không dùng `hidden` hay `display: none`: để trống, CSS thu lại khi `:empty`. Chỉ ghi lại khi chữ đổi.
- Nút bật/tắt có `aria-pressed`; tay nắm gạt là `role="slider"` đi được bằng bàn phím; ô nhập nào cũng có nhãn (axe-core giữ, Task 17).

**Git**
- Làm trên nhánh `gd4-phu-bong-kinh-mai`. Nhánh này dựng trên đầu nhánh GĐ 3 (PR #3 còn mở lúc viết kế hoạch), rồi thêm commit spec GĐ 4 và chính file kế hoạch này. Commit bằng danh tính local của repo: `Bao Nguyen <giabao261096@gmail.com>` (kiểm `git config user.email` trước commit đầu). Không sửa git config global.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Thông điệp commit của từng task ghi sẵn ở bước cuối của task.
- Chỉ push ở Task 22 (việc ra bên ngoài, đã nằm trong kế hoạch Bao duyệt). Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

## Review Focus

Năm tình huống người dùng thật dễ gặp mà spec không nói thẳng. Mỗi tình huống có test ở task sở hữu code:
1. **Máy báo số GPU không dùng được, hoặc thôi báo giữa phiên** (GPU Apple trên Chrome cộng các pass chồng nhau thành ~10 lần thời gian thật; driver lỗi; `?debug` tắt timestamp). Mong đợi: bỏ số vô lý, ba lần liền thì thôi đo; Sổ tay ghi "—" kèm lời giải thích; bộ điều chỉnh về đường nhịp mà không hạ nấc oan. Test: `gpu-timer.test.js` "số lâu hơn hẳn nhịp khung…", "hỏng 3 lần liền…" (Task 4); `scene.test.js` "GPU báo số chồng nhau…", `studio.test.js` "ms GPU (GĐ 4)…" (Task 5).
2. **Chữ của bức (`content.vi.js`) tải hỏng** (mạng chập chờn, chunk lỗi). Mong đợi: công cụ vẫn gắn và dùng được, nhãn tap rơi về id; thanh giờ vẫn kéo được, không có ghi chú. Test: `toolbox.test.js` "chữ của bức tải hỏng…" (Task 9), `rail-tools.test.js` "chữ của bức tải hỏng…" (Task 13).
3. **Điện thoại: bật công cụ khi Sổ tay đang mở.** Sổ tay che gần hết cảnh, người xem không thấy kính. Mong đợi: ở khung ≤ 640px, Sổ tay thu lại khi một công cụ bật và hiện lại khi tắt. Test: `painting.spec.js` "khung hẹp như điện thoại…" (Task 17).
4. **Mất GPU rồi dựng lại cảnh** (tab nền lâu trên điện thoại, driver reset). Mong đợi: thanh giờ giữ giờ đang chọn; công cụ về tắt, và nút Đồ nghề đọc lại trạng thái thật chứ không kẹt ở "đang bật". Test: `studio.test.js` "Dial (GĐ 4)…snapshot có dials…" (Task 11), `rail-tools.test.js` "dựng lại cảnh sau khi mất GPU…" (Task 13).
5. **Bấm Normal hai lần liền khi đang mài** (biên dịch lại mất vài giây trên máy yếu, người xem tưởng chưa ăn). Mong đợi: MRT đổi một lần, biên dịch một lần, overlay ghép lại một lần. Test: `pipeline.test.js` "bấm Normal hai lần liền…" (Task 8).

## Bản đồ file sau GĐ 4

| File | Trách nhiệm | Task |
|---|---|---|
| `src/engine/tuner.js` (mới), `src/engine/quality.js`, `src/engine/flags.js` | bộ điều chỉnh (đường nhịp + đường tải); quality.js chỉ còn mức và ngân sách | 2 |
| `src/engine/gpu/clock.js` | bộ chặn 60 khung/giây đo nhịp màn hình | 3 |
| `src/engine/gpu/gpu-timer.js` (mới), `src/engine/gpu/stage.js` | ms GPU mỗi khung, bỏ số vô lý; `trackTimestamp` | 4 |
| `src/engine/gpu/meter.js` (mới), `scene.js`, `studio.js`, `ladder.js`, `run.js`, `src/engine/sma.js`, `contracts/runtime.js` | nối đo GPU vào cảnh; số đo của bàn thợ; `quality()` có `gpu`, `locked` | 5 |
| `src/ui/{badge,notebook,notebook-pages,strings.vi}.js`, `src/styles/notebook.css` | ms GPU trong Sổ tay, cột GPU, huy hiệu nói về nấc bị khóa | 6 |
| `src/engine/gpu/knob-set.js` | trần do `max()` trả được kiểm lúc dựng | 7 |
| `src/engine/gpu/views.js` (mới), `pipeline.js` | view, tap, overlay, `requireView` | 8 |
| `src/engine/gpu/toolbox.js` (mới), `input.js`, `scene.js`, `studio.js`, `sma.js` | hộp đồ nghề, cử chỉ `hover`, `g.pointer` | 9 |
| `src/engine/tools/{index,kinh-mai,lot-lop,pick}.js` (mới), `src/styles/tools.css` (mới) | Kính mài, Lột lớp | 10 |
| `src/engine/gpu/dial-set.js` (mới), `src/paintings/ao-sen-dem/{shared,content.vi}.js` | Dial; thanh giờ của Bức 1 | 11 |
| `scene.js`, `src/paintings/ao-sen-dem/layers/l{2-anh-trang,3-suong,5-vang-la}.js`, `parts/suong-{mu,troi}.js` | vẽ lại lúc `?freeze` gọi `update(0, t)`; trăng theo độ cao; sương ấm lúc chạng vạng | 12 |
| `src/ui/{rail-tools,dials}.js` (mới), `layer-rail.js`, `workshop.js` | mục Đồ nghề và thanh giờ trong thanh lớp | 13 |
| `src/engine/stock/phu-bong/lut.js` (mới) | LUT "sơn mài" 32³ sinh từ bảng màu | 14 |
| `src/engine/stock/phu-bong/{display,layer,meta,content.vi}.js`, `diagram.svg`, `src/ui/code-view.js` | chặng display, tap, núm mới, "Tắt FXAA" | 15 |
| `src/ui/shell.js`, `src/engine/boot.js`, `src/styles/shell.css` | cờ `?poster` | 16 |
| `e2e/{a11y,painting,ao-sen-dem}.spec.js`, `e2e/helpers.js`, `src/ui/knobs.js`, `package.json` | e2e GĐ 4, a11y bằng axe-core | 17 |
| `.github/workflows/deploy.yml` | e2e WebGPU thành job riêng, không chặn | 18 |
| `src/engine/stock/phu-bong/layer.js` | lượt màu của chặng display (Bao duyệt bằng ảnh) | 19 |
| `scripts/poster.js` (mới), `public/paintings/ao-sen-dem/{poster.webp,og.jpg}`, `index.html`, `meta.js` của các bức | poster và og chụp từ cảnh | 20 |
| `README.md`, `CLAUDE.md`, spec | ghi lại GĐ 4 | 21 |
| (GitHub) | review toàn nhánh, push, PR, CI, kiểm trên máy thật | 22 |

**Không làm trong GĐ 4** (spec §14, §16 xếp vào giai đoạn sau; ghi ở đây để khỏi làm lố):
- Link công thức `#r=`, "Từng sợi", "Xem bản dịch", đàn bầu, thả hoa đăng: GĐ 5 (tùy chọn).
- Đo GPU bằng khoảng thời gian của cả khung (span) cho GPU kiểu tile: chờ three trả thời điểm đầu/cuối của từng pass (§16).
- Đổi bán kính kính tròn bằng lăn chuột hay chụm hai ngón: uniform đã có, cử chỉ để sau.
- Các mục nhỏ còn lại từ PR #3 (Inspector ném lỗi trong hook khi `?debug`, `onKnob` hỏng giữa chừng, vẽ lại bóng một lần thừa khi đổi cỡ khung), tự lùi về đom đóm CPU khi compute WebGL2 hỏng: vẫn để ngỏ.
- Bản tiếng Anh, trình sinh HTML, phòng tranh `/tranh/`: khi có bức thứ hai hay bản dịch.

---

### Task 1: Chuẩn bị: máy, nhánh, mốc test

**Mục tiêu:** Có Node 24 và Chromium của Playwright; đứng trên nhánh `gd4-phu-bong-kinh-mai` (đã có spec GĐ 4 và file kế hoạch này); mốc ban đầu là 576 test xanh.

**Files:** không sửa file nào.

**Interfaces:**
- Consumes: —
- Produces: môi trường chạy được `npm test`, `npm run build`, Playwright.

- [ ] **Step 1: Node 24**

```bash
node -v
```
Kết quả mong đợi: `v24.x.y`. Nếu không phải (máy của Bao đang có Node 20 và chưa có fnm), dùng Node 24 portable trong thư mục tạm, KHÔNG sửa `~/.zshrc`. Thay `<tmp>` bằng thư mục tạm của phiên, ví dụ scratchpad:

```bash
curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz | tar -xz -C <tmp>
export PATH=<tmp>/node-v24.21.0-darwin-arm64/bin:$PATH
node -v   # v24.21.0
```
Từ đây, mọi lệnh `node`/`npm`/`npx` trong kế hoạch chạy với `PATH` này.

- [ ] **Step 2: Nhánh và mốc test**

```bash
git switch gd4-phu-bong-kinh-mai
git log --oneline -3   # file kế hoạch, docs(spec) GĐ 4 3e01a7f, rồi commit cuối của nhánh GĐ 3 (36719a2)
git config user.email  # phải ra giabao261096@gmail.com
npm ci
npx playwright install chromium
npm test
```
Kết quả mong đợi: `npm test` xanh, `Tests  576 passed (576)` (con số của GĐ 3).

Nếu lúc bắt đầu Bao đã merge PR #3 vào `main`, cứ làm tiếp trên nhánh này: nhánh đã chứa đúng các commit của GĐ 3. Base của PR GĐ 4 chọn ở Task 22.

---

### Task 2: Bộ điều chỉnh đọc ms GPU (`engine/tuner.js`)

**Mục tiêu:** Spec §10 "(GĐ 4) Bộ điều chỉnh đo được thời gian GPU". Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" với "trình duyệt khóa nhịp": một laptop yếu cần 20 ms mỗi khung và một máy khóa 30 fps vì tiết kiệm pin cho ra cùng một nhịp, 33 ms. Task này:
- tách bộ điều chỉnh khỏi `engine/quality.js` sang `engine/tuner.js` (vẫn là hàm thuần, không three). `quality.js` chỉ còn chọn mức và ghép ngân sách; `flags.js` lấy `LEVELS` từ đó thay cho danh sách riêng;
- thêm **đường tải**. Cửa sổ nào có từ 3 mẫu ms GPU trở lên thì tải = max(trung vị ms GPU, trung bình ms CPU):
  - **quá tải:** nhịp > ngân sách × 1,05 và tải > ngân sách × 0,85, tức máy là nút cổ chai. Hạ sau 2 cửa sổ liền, kể cả khi nhịp trông như bị khóa 30 fps;
  - **bị khóa nhịp:** nhịp > ngân sách × 1,2 mà tải < ngân sách × 0,5. Vào "bị khóa nhịp" ngay, không phải hạ hết thang rồi trả lại;
  - **dư:** tải < ngân sách × 0,6. Nâng sau 5 cửa sổ liền, dù màn 60,1 Hz, 75 Hz hay đang bị khóa nhịp;
  - **chế độ canh** (Sổ tay mở): chỉ hạ khi tải > ngân sách × 2,2, không bao giờ nâng;
- trả nợ GĐ 3 trên **đường nhịp** (máy không đo được GPU): mốc "lúc bắt đầu hạ" đo lại ở lần hạ đầu tiên sau MỖI lần nâng (cờ `remeasure`), không chỉ khi đã nâng về hết.

Test cũ của bộ điều chỉnh chuyển nguyên sang `tuner.test.js`: đường nhịp giữ đúng hành vi GĐ 3. Test mới chạy đường tải trên chuỗi khung giả có kèm ms GPU; với bộ điều chỉnh GĐ 3 chúng hỏng, vì nó không đọc ms GPU.

**Files:**
- Create: `src/engine/tuner.js`
- Modify: `src/engine/quality.js` (bỏ bộ điều chỉnh), `src/engine/flags.js`, `src/engine/gpu/scene.js` (đổi import)
- Test: Create `tests/unit/tuner.test.js`; Modify `tests/unit/quality.test.js` (bỏ phần bộ điều chỉnh)

**Interfaces:**
- Consumes: —
- Produces:
  - `engine/tuner.js`: `FRAME_BUDGET_MS = { desktop: 1000/60, mobile: 1000/45 }`; `TUNER` (các số của GĐ 3 cộng `gpuSamples: 3`, `busy: 0.85`, `idle: 0.5`, `light: 0.6`);
  - `createTuner({ budgetMs, ...ghiĐèTUNER })` trả về:
    - `sample(ms, { applied, steps }) → 'down' | 'up' | 'reset' | null` (mỗi khung, trước khi vẽ);
    - `cpu(ms)`: ms CPU của khung vừa vẽ;
    - `gpu(ms)`: một mẫu ms GPU (bỏ qua số ≤ 0 hay không hữu hạn);
    - `guard(on)`;
    - `state() → { guarding, capped, locked: number[], gpu: boolean }`;
  - `engine/quality.js`: `LEVELS`, `DEFAULT_LEVELS`, `isMobile`, `pickLevel`, `budgetFor` (như GĐ 3).

- [ ] **Step 1: Test (hỏng: chưa có `engine/tuner.js`)**

Tạo `tests/unit/tuner.test.js`:

```js
// tests/unit/tuner.test.js — bộ điều chỉnh có trễ chạy trên chuỗi khung giả: đường nhịp (GĐ 3) và đường tải khi đo được ms GPU (GĐ 4).
import { describe, expect, it } from 'vitest';
import { FRAME_BUDGET_MS, TUNER, createTuner } from '../../src/engine/tuner.js';
import { MAX_FPS, createFrameCap } from '../../src/engine/gpu/clock.js';
import { mulberry32 } from '../../src/lib/random.js';

const DESKTOP = FRAME_BUDGET_MS.desktop;

/**
 * Cho bộ điều chỉnh "chạy" `seconds` giây. Khoảng giữa hai khung lấy từ gapFor(số nấc đang áp, i): như máy thật,
 * hạ nấc thì khung nhanh lên. Thang giả có `steps` nấc; 'down' / 'up' / 'reset' đổi `applied` như ladder.js.
 * GĐ 4: gpuFor(k, i) là ms GPU của khung i, nhưng cứ `gpuEvery` khung mới có một mẫu về (gpu-timer không chờ, mẫu đến
 * trễ và thưa); cpuFor(k, i) là ms CPU của khung i. Thiếu thì máy "không đo được": đường nhịp như GĐ 3.
 * Trả mọi quyết định kèm thời điểm (giây).
 */
function run(tuner, { seconds, gapFor, ladder, from = 0, gpuFor = null, cpuFor = null, gpuEvery = 4 }) {
  const actions = [];
  let t = from;
  for (let i = 0; t < from + seconds * 1000; i++) {
    t += gapFor(ladder.applied, i);
    const action = tuner.sample(t, ladder);
    if (action) {
      actions.push({ at: +(t / 1000).toFixed(2), action });
      if (action === 'down') ladder.applied += 1;
      else if (action === 'up') ladder.applied -= 1;
      else ladder.applied = 0;
    }
    // Như scene.js: vẽ xong khung mới biết ms CPU của nó; mẫu GPU về sau vài khung.
    if (cpuFor) tuner.cpu(cpuFor(ladder.applied, i));
    if (gpuFor && i % gpuEvery === 0) tuner.gpu(gpuFor(ladder.applied, i));
  }
  return { actions, end: t };
}
const kinds = (actions) => actions.map((a) => a.action);

describe('createTuner (bộ điều chỉnh có trễ)', () => {
  it('ngân sách: 60 khung/giây trên máy tính, 45 trên điện thoại', () => {
    expect(FRAME_BUDGET_MS.desktop).toBeCloseTo(16.667, 3);
    expect(FRAME_BUDGET_MS.mobile).toBeCloseTo(22.222, 3);
  });

  it('60 fps đều: không làm gì; không bao giờ nâng quá mức ban đầu (chưa hạ nấc nào)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    expect(run(tuner, { seconds: 60, gapFor: () => DESKTOP, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
    const fast = createTuner({ budgetMs: DESKTOP });
    expect(run(fast, { seconds: 60, gapFor: () => 1000 / 120, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
  });

  it('40 fps: 2 giây khởi động + 2 cửa sổ quá tải thì hạ; đủ nhanh thì thử nâng MỘT lần, chậm lại thì hạ và khóa', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    // Máy giả: mỗi nấc bớt 4,5 ms; 2 nấc là về 16 ms (đủ 60 fps, không rớt khung nên trông như còn dư).
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => Math.max(25 - k * 4.5, 16), ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'up', 'down']);
    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
    expect(actions[0].at).toBeLessThan(6.2);
    expect(ladder.applied).toBe(2);
    expect(tuner.state().locked).toEqual([1]);
  });

  it('màn 60 Hz không rớt khung thì nâng lại sau 5 cửa sổ (0,7 × ngân sách không bao giờ tới được ở 60 Hz)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 2, steps: 4 };
    const { actions } = run(tuner, { seconds: 24, gapFor: () => DESKTOP, ladder });
    expect(kinds(actions)).toEqual(['up', 'up']);
    expect(actions[0].at).toBeGreaterThanOrEqual(11.9);
    expect(actions[0].at).toBeLessThan(12.2);
  });

  it('có rớt khung (mỗi cửa sổ một khung 33 ms) thì không nâng, dù trung bình vẫn gần 16,7 ms', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 100 === 50 ? 2 * DESKTOP : DESKTOP), ladder });
    expect(actions).toEqual([]);
  });

  it('nâng một nấc rồi phải hạ lại ngay đúng nấc đó: khóa, không nâng nấc ấy nữa (không dao động)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    // Máy giả chỉ chạy nổi 60 fps khi đã hạ 1 nấc.
    const { actions } = run(tuner, { seconds: 90, gapFor: (k) => (k >= 1 ? DESKTOP : 25), ladder });
    expect(kinds(actions)).toEqual(['up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
  });

  it('khóa nhịp 30 fps (tiết kiệm pin): hạ hết thang, không nhanh hơn → trả lại hết, thôi hạ; hết khóa thì chạy lại', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    let gap = 1000 / 30;
    const first = run(tuner, { seconds: 60, gapFor: () => gap, ladder });
    expect(kinds(first.actions)).toEqual(['down', 'down', 'down', 'reset']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state().capped).toBe(true);
    // Cắm sạc: về 60 fps, hết khóa (không còn nấc nào để nâng). Rồi máy thật sự chậm (40 fps): lại hạ được.
    gap = DESKTOP;
    expect(run(tuner, { seconds: 10, gapFor: () => gap, ladder, from: first.end }).actions).toEqual([]);
    expect(tuner.state().capped).toBe(false);
    const again = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: first.end + 10_000 });
    expect(kinds(again.actions)).toEqual(['down']);
  });

  it('hết khóa nhịp trên màn 59,94 Hz, hay khi mỗi cửa sổ rớt một khung: thoát "bị khóa nhịp", rồi chậm thật thì lại hạ', () => {
    const idles = { '59,94 Hz': () => 1000 / 59.94, '60 Hz rớt 1 khung / 2 s': (k, i) => (i % 120 === 60 ? 2 * DESKTOP : DESKTOP) };
    for (const [name, idle] of Object.entries(idles)) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 0, steps: 3 };
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
      expect(kinds(locked.actions), name).toEqual(['down', 'down', 'down', 'reset']);
      const unlocked = run(tuner, { seconds: 10, gapFor: idle, ladder, from: locked.end });
      expect(unlocked.actions, name).toEqual([]);
      expect(tuner.state().capped, name).toBe(false);
      const slow = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: unlocked.end });
      expect(kinds(slow.actions), name).toEqual(['down']);
    }
  });

  it('đang "bị khóa nhịp" mà quá tải thật (chậm hẳn hơn nhịp bị khóa) thì vẫn hạ về lại nhịp ấy, kể cả khi Sổ tay mở', () => {
    for (const guarding of [false, true]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 0, steps: 3 };
      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
      expect(tuner.state().capped).toBe(true);
      tuner.guard(guarding);
      // Người xem kéo 200.000 đom đóm: khung 50 ms (20 fps). Hạ một nấc là về lại nhịp bị khóa 33 ms: dừng ở đó.
      // (Phản ứng đầu tiên; trả lại nấc sau đó do hai test dưới giữ.)
      const heavy = run(tuner, { seconds: 12, gapFor: (k) => (k === 0 ? 50 : 1000 / 30), ladder, from: locked.end });
      expect(kinds(heavy.actions), `canh: ${guarding}`).toEqual(['down']);
      expect(tuner.state().capped).toBe(true);
    }
  });

  it('đang "bị khóa nhịp": hạ vì quá tải thật, người xem trả núm về thì trả lại nấc (vẫn khóa); Sổ tay còn mở thì chờ', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
    expect(tuner.state().capped).toBe(true);
    tuner.guard(true);
    const heavy = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
    expect(kinds(heavy.actions)).toEqual(['down']);
    // Người xem trả số đom đóm về: nấc vừa hạ không còn cần nữa.
    const open = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: heavy.end });
    expect(open.actions).toEqual([]);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: open.end });
    expect(kinds(closed.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state().capped).toBe(true);
  });

  it('đang "bị khóa nhịp": trả lại nấc mà quá tải lại ngay thì hạ lại và khóa nấc ấy (không dao động)', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
    const heavy = run(tuner, { seconds: 60, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
    expect(kinds(heavy.actions)).toEqual(['down', 'up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
    // Cắm sạc, núm đã trả về: hết khóa nhịp thì quên các nấc khóa trong lúc bị khóa, trả lại được như trước.
    const unplugged = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: heavy.end });
    expect(kinds(unplugged.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(0);
    expect(tuner.state()).toMatchObject({ capped: false, locked: [] });
  });

  it('mốc "lúc bắt đầu hạ" không dùng lại mốc cũ: hạ ở 25 ms rồi nâng về hết; sau đó Sổ tay mở hạ từ 50 ms còn 38 ms → đóng Sổ tay vẫn giữ nấc', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const first = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 25 : DESKTOP), ladder });
    expect(kinds(first.actions)).toEqual(['down']);
    const idle = run(tuner, { seconds: 14, gapFor: () => DESKTOP, ladder, from: first.end });
    expect(kinds(idle.actions)).toEqual(['up']);
    tuner.guard(true);
    const heavy = (k) => 50 - k * 3; // thí nghiệm nặng: mỗi nấc bớt 3 ms, hạ hết còn 38 ms
    const open = run(tuner, { seconds: 20, gapFor: heavy, ladder, from: idle.end });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down', 'down']);
    tuner.guard(false); // đóng Sổ tay, thí nghiệm vẫn bật: hạ đã giúp (50 → 38 ms), không được trả lại
    const closed = run(tuner, { seconds: 30, gapFor: heavy, ladder, from: open.end });
    expect(closed.actions).toEqual([]);
    expect(ladder.applied).toBe(4);
    expect(tuner.state().capped).toBe(false);
  });

  it('bắt đầu hạ lúc Sổ tay mở (quá tải nặng), hạ hết mà không nhanh hơn: đóng Sổ tay thì trả lại hết như luật khóa nhịp', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    tuner.guard(true);
    const open = run(tuner, { seconds: 16, gapFor: () => 50, ladder });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down']);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 10, gapFor: () => 50, ladder, from: open.end });
    expect(kinds(closed.actions)).toEqual(['reset']);
    expect(tuner.state().capped).toBe(true);
  });

  it('khoảng giữa hai khung > 250 ms (tab ẩn, debugger) thì bỏ cả cửa sổ đang đo', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    // 40 fps nhưng cứ 1,5 giây lại có một khoảng 400 ms: không cửa sổ nào đo xong, nên không quyết gì.
    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 60 === 59 ? 400 : 25), ladder: { applied: 0, steps: 4 } });
    expect(actions).toEqual([]);
  });

  it('canh (Sổ tay mở): chậm vừa phải thì để yên (số đo trung thực), quá tải nặng thì vẫn hạ, không bao giờ nâng', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    tuner.guard(true);
    expect(tuner.state().guarding).toBe(true);
    const slow = run(tuner, { seconds: 20, gapFor: () => 25, ladder }); // 40 fps: người xem đang thử, để yên
    expect(slow.actions).toEqual([]);
    const idle = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: slow.end }); // dư mà không nâng
    expect(idle.actions).toEqual([]);
    const heavy = run(tuner, { seconds: 7, gapFor: () => 50, ladder, from: idle.end }); // 20 fps: máy bị ép quá sức
    expect(kinds(heavy.actions)).toEqual(['down']);
    tuner.guard(false);
    const normal = run(tuner, { seconds: 7, gapFor: () => 25, ladder, from: heavy.end });
    expect(kinds(normal.actions)).toEqual(['down']);
    expect(normal.actions[0].at - heavy.end / 1000).toBeGreaterThanOrEqual(5.9); // đổi chế độ: khởi động lại
  });

  it('điện thoại 45 fps (ngân sách 22,2 ms): không quá tải, cũng không dư (có rớt khung) → để yên', () => {
    const tuner = createTuner({ budgetMs: FRAME_BUDGET_MS.mobile });
    const pattern = [1000 / 60, 1000 / 60, 1000 / 30]; // trung bình 22,2 ms
    const { actions } = run(tuner, { seconds: 60, gapFor: (k, i) => pattern[i % 3], ladder: { applied: 1, steps: 4 } });
    expect(actions).toEqual([]);
  });

  it('màn 120 Hz dư nhiều (< 0,7 × ngân sách): nâng lần lượt từng nấc', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 2, steps: 4 };
    const { actions } = run(tuner, { seconds: 30, gapFor: () => 1000 / 120, ladder });
    expect(kinds(actions)).toEqual(['up', 'up']);
    expect(ladder.applied).toBe(0);
  });

  it('sau bộ chặn 60 khung/giây (như run.js): màn 72/75/85/144 Hz, nhịp lệch ±0,3 ms, máy rảnh thì nâng lại hết', () => {
    // Nhịp sau bộ chặn không đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không rớt khung nào.
    for (const hz of [60, 72, 75, 85, 90, 120, 144, 165]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const cap = createFrameCap();
      const jitter = mulberry32(hz);
      const ladder = { applied: 3, steps: 4 };
      for (let i = 1; i < hz * 60; i++) {
        const ms = (i * 1000) / hz + (jitter() - 0.5) * 0.6;
        if (!cap.ready(ms)) continue;
        const action = tuner.sample(ms, ladder);
        if (action === 'up') ladder.applied -= 1;
        else if (action) ladder.applied = action === 'down' ? ladder.applied + 1 : 0;
      }
      expect(ladder.applied, `${hz} Hz`).toBe(0);
    }
  });

  it('nhịp của bộ chặn khung là nhịp mà bộ điều chỉnh dùng để đếm khung rớt', () => {
    expect(TUNER.frameMs).toBeCloseTo(1000 / MAX_FPS, 9);
  });
});

/** Nhịp rAF của một máy có GPU bận `gpuMs` mỗi khung, trên màn 60 Hz có vsync: kịp 16,7 ms thì 60 fps, không thì 30 fps. */
const vsync = (gpuMs) => (gpuMs <= DESKTOP ? DESKTOP : 2 * DESKTOP);

describe('createTuner · đường tải (GĐ 4: đo được ms GPU)', () => {
  it('máy chưa có mẫu GPU nào: state().gpu = false; có mẫu hữu hạn > 0 thì true; mẫu vô lý bị bỏ', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    expect(tuner.state()).toEqual({ guarding: false, capped: false, locked: [], gpu: false });
    for (const bad of [0, -1, Number.NaN, Infinity, undefined]) tuner.gpu(bad);
    expect(tuner.state().gpu).toBe(false);
    tuner.gpu(4.2);
    expect(tuner.state().gpu).toBe(true);
  });

  it('laptop yếu (GPU 20 ms, nhịp 33 ms như bị khóa 30 fps): hạ nấc tới khi kịp 60 fps; không bao giờ "reset"', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const gpu = (k) => 20 - k * 3; // mỗi nấc bớt 3 ms GPU: 20 → 17 → 14
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => vsync(gpu(k)), gpuFor: gpu, ladder });
    expect(kinds(actions)).toEqual(['down', 'down']);
    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
    expect(actions[0].at).toBeLessThan(6.2);
    expect(ladder.applied).toBe(2);
    expect(tuner.state()).toMatchObject({ capped: false, gpu: true });
    // Cùng nhịp 33 ms mà KHÔNG đo được GPU (đường nhịp của GĐ 3): hạ hết thang, không nhanh hơn thì trả lại hết.
    const blind = createTuner({ budgetMs: DESKTOP });
    const rhythm = run(blind, { seconds: 60, gapFor: () => 2 * DESKTOP, ladder: { applied: 0, steps: 4 } });
    expect(kinds(rhythm.actions)).toEqual(['down', 'down', 'down', 'down', 'reset']);
  });

  it('khóa 30 fps mà GPU chỉ 5 ms (tiết kiệm pin): vào "bị khóa nhịp" ngay ở cửa sổ đầu, không hạ nấc nào; cắm sạc thì hết khóa', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const first = run(tuner, { seconds: 4.2, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, ladder });
    expect(first.actions).toEqual([]);
    expect(tuner.state().capped).toBe(true);
    const later = run(tuner, { seconds: 60, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, ladder, from: first.end });
    expect(later.actions).toEqual([]);
    const plugged = run(tuner, { seconds: 4, gapFor: () => DESKTOP, gpuFor: () => 5, ladder, from: later.end });
    expect(plugged.actions).toEqual([]);
    expect(tuner.state().capped).toBe(false);
  });

  it('GPU 6 ms trên màn 75 Hz, 60,1 Hz, hay lúc đang bị khóa 30 fps: nâng lại hết các nấc', () => {
    // 75 Hz qua bộ chặn 60 khung/giây (như run.js): nhịp lệch đều 26,7 + 13,3 + 13,3 + 13,3 ms.
    const at75 = createTuner({ budgetMs: DESKTOP });
    const cap = createFrameCap();
    const ladder75 = { applied: 2, steps: 4 };
    let n = 0;
    for (let i = 1; i < 75 * 40; i++) {
      const ms = (i * 1000) / 75;
      if (!cap.ready(ms)) continue;
      const action = at75.sample(ms, ladder75);
      if (action === 'up') ladder75.applied -= 1;
      else if (action) ladder75.applied += action === 'down' ? 1 : -ladder75.applied;
      if (n++ % 4 === 0) at75.gpu(6);
    }
    expect(ladder75.applied, '75 Hz').toBe(0);
    for (const [name, gap] of [['60,1 Hz', 1000 / 60.1], ['khóa 30 fps', 2 * DESKTOP]]) {
      const tuner = createTuner({ budgetMs: DESKTOP });
      const ladder = { applied: 2, steps: 4 };
      const { actions } = run(tuner, { seconds: 30, gapFor: () => gap, gpuFor: () => 6, ladder });
      expect(kinds(actions), name).toEqual(['up', 'up']);
    }
  });

  it('tải = max(trung vị ms GPU, trung bình ms CPU): JS bận 20 ms thì vẫn là quá tải dù GPU nhàn', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const { actions } = run(tuner, { seconds: 7, gapFor: () => 25, gpuFor: () => 4, cpuFor: () => 20, ladder });
    expect(kinds(actions)).toEqual(['down']);
    expect(tuner.state().capped).toBe(false);
  });

  it('cửa sổ dưới 3 mẫu GPU (mẫu về thưa): đi đường nhịp như GĐ 3', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 3 };
    // 30 fps: 60 khung mỗi cửa sổ 2 giây, mỗi 60 khung một mẫu GPU → 1 mẫu mỗi cửa sổ.
    const { actions } = run(tuner, { seconds: 60, gapFor: () => 2 * DESKTOP, gpuFor: () => 5, gpuEvery: 60, ladder });
    expect(kinds(actions)).toEqual(['down', 'down', 'down', 'reset']);
    expect(tuner.state()).toMatchObject({ capped: true, gpu: true });
  });

  it('chế độ canh dùng tải: nhịp 50 ms mà máy nhàn thì để yên; tải > 2,2 × ngân sách thì hạ; không bao giờ nâng', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 1, steps: 4 };
    tuner.guard(true);
    const idle = run(tuner, { seconds: 20, gapFor: () => 50, gpuFor: () => 10, ladder });
    expect(idle.actions, 'đường nhịp sẽ hạ ở đây (50 ms > 2,2 × ngân sách)').toEqual([]);
    const heavy = run(tuner, { seconds: 5, gapFor: () => 50, gpuFor: () => 40, ladder, from: idle.end });
    expect(kinds(heavy.actions)).toEqual(['down']);
    const spare = run(tuner, { seconds: 20, gapFor: () => DESKTOP, gpuFor: () => 3, ladder, from: heavy.end });
    expect(spare.actions).toEqual([]);
    expect(ladder.applied).toBe(2);
  });

  it('nâng một nấc mà quá tải lại ngay (đường tải): hạ lại và khóa nấc ấy, không dao động', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const gpu = (k) => (k === 0 ? 18 : 9); // chỉ nấc đầu là nặng
    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => vsync(gpu(k)), gpuFor: gpu, ladder });
    expect(kinds(actions)).toEqual(['down', 'up', 'down']);
    expect(tuner.state().locked).toEqual([0]);
    expect(ladder.applied).toBe(1);
  });
});

describe('createTuner · đường nhịp: mốc "lúc bắt đầu hạ" đo lại sau mỗi lần nâng (GĐ 4)', () => {
  it('hạ 2 nấc ở 25 ms, nâng 1 nấc (chưa về hết); Sổ tay mở hạ từ 47 ms còn 38 ms → đóng Sổ tay vẫn giữ nấc, không "reset"', () => {
    const tuner = createTuner({ budgetMs: DESKTOP });
    const ladder = { applied: 0, steps: 4 };
    const slow = run(tuner, { seconds: 12, gapFor: (k) => (k < 2 ? 25 : DESKTOP), ladder });
    expect(kinds(slow.actions)).toEqual(['down', 'down']);
    const idle = run(tuner, { seconds: 16, gapFor: () => DESKTOP, ladder, from: slow.end });
    expect(kinds(idle.actions)).toEqual(['up']);
    expect(ladder.applied).toBe(1);
    tuner.guard(true);
    const heavy = (k) => 50 - k * 3; // thí nghiệm nặng: 47 ms ở nấc 1, hạ hết còn 38 ms
    const open = run(tuner, { seconds: 20, gapFor: heavy, ladder, from: idle.end });
    expect(kinds(open.actions)).toEqual(['down', 'down', 'down']);
    tuner.guard(false);
    const closed = run(tuner, { seconds: 30, gapFor: heavy, ladder, from: open.end });
    expect(closed.actions, 'GĐ 3 so với mốc cũ 25 ms nên tưởng nhịp bị khóa và trả lại hết').toEqual([]);
    expect(ladder.applied).toBe(4);
    expect(tuner.state()).toMatchObject({ capped: false, locked: [] });
  });
});
```

Áp vào `tests/unit/quality.test.js`:

```diff
diff --git a/tests/unit/quality.test.js b/tests/unit/quality.test.js
index b4834de..2b04430 100644
--- a/tests/unit/quality.test.js
+++ b/tests/unit/quality.test.js
@@ -1,8 +1,6 @@
-// tests/unit/quality.test.js — chọn mức, ngân sách của bức, và bộ điều chỉnh có trễ chạy trên chuỗi khung giả.
+// tests/unit/quality.test.js — chọn mức theo tầng và máy, và ngân sách của bức (bộ điều chỉnh có test riêng: tuner.test.js).
 import { describe, expect, it } from 'vitest';
-import { DEFAULT_LEVELS, FRAME_BUDGET_MS, LEVELS, TUNER, budgetFor, createTuner, isMobile, pickLevel } from '../../src/engine/quality.js';
-import { MAX_FPS, createFrameCap } from '../../src/engine/gpu/clock.js';
-import { mulberry32 } from '../../src/lib/random.js';
+import { DEFAULT_LEVELS, LEVELS, budgetFor, isMobile, pickLevel } from '../../src/engine/quality.js';
 
 const UA = {
   android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
@@ -72,248 +70,3 @@ describe('budgetFor', () => {
     expect(() => budgetFor('sieu')).toThrow('sieu');
   });
 });
-
-const DESKTOP = FRAME_BUDGET_MS.desktop;
-
-/**
- * Cho bộ điều chỉnh "chạy" `seconds` giây. Khoảng giữa hai khung lấy từ gapFor(số nấc đang áp, i): như máy thật,
- * hạ nấc thì khung nhanh lên. Thang giả có `steps` nấc; 'down' / 'up' / 'reset' đổi `applied` như ladder.js.
- * Trả mọi quyết định kèm thời điểm (giây).
- */
-function run(tuner, { seconds, gapFor, ladder, from = 0 }) {
-  const actions = [];
-  let t = from;
-  for (let i = 0; t < from + seconds * 1000; i++) {
-    t += gapFor(ladder.applied, i);
-    const action = tuner.sample(t, ladder);
-    if (!action) continue;
-    actions.push({ at: +(t / 1000).toFixed(2), action });
-    if (action === 'down') ladder.applied += 1;
-    else if (action === 'up') ladder.applied -= 1;
-    else ladder.applied = 0;
-  }
-  return { actions, end: t };
-}
-const kinds = (actions) => actions.map((a) => a.action);
-
-describe('createTuner (bộ điều chỉnh có trễ)', () => {
-  it('ngân sách: 60 khung/giây trên máy tính, 45 trên điện thoại', () => {
-    expect(FRAME_BUDGET_MS.desktop).toBeCloseTo(16.667, 3);
-    expect(FRAME_BUDGET_MS.mobile).toBeCloseTo(22.222, 3);
-  });
-
-  it('60 fps đều: không làm gì; không bao giờ nâng quá mức ban đầu (chưa hạ nấc nào)', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    expect(run(tuner, { seconds: 60, gapFor: () => DESKTOP, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
-    const fast = createTuner({ budgetMs: DESKTOP });
-    expect(run(fast, { seconds: 60, gapFor: () => 1000 / 120, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
-  });
-
-  it('40 fps: 2 giây khởi động + 2 cửa sổ quá tải thì hạ; đủ nhanh thì thử nâng MỘT lần, chậm lại thì hạ và khóa', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 4 };
-    // Máy giả: mỗi nấc bớt 4,5 ms; 2 nấc là về 16 ms (đủ 60 fps, không rớt khung nên trông như còn dư).
-    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => Math.max(25 - k * 4.5, 16), ladder });
-    expect(kinds(actions)).toEqual(['down', 'down', 'up', 'down']);
-    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
-    expect(actions[0].at).toBeLessThan(6.2);
-    expect(ladder.applied).toBe(2);
-    expect(tuner.state().locked).toEqual([1]);
-  });
-
-  it('màn 60 Hz không rớt khung thì nâng lại sau 5 cửa sổ (0,7 × ngân sách không bao giờ tới được ở 60 Hz)', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 2, steps: 4 };
-    const { actions } = run(tuner, { seconds: 24, gapFor: () => DESKTOP, ladder });
-    expect(kinds(actions)).toEqual(['up', 'up']);
-    expect(actions[0].at).toBeGreaterThanOrEqual(11.9);
-    expect(actions[0].at).toBeLessThan(12.2);
-  });
-
-  it('có rớt khung (mỗi cửa sổ một khung 33 ms) thì không nâng, dù trung bình vẫn gần 16,7 ms', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 1, steps: 4 };
-    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 100 === 50 ? 2 * DESKTOP : DESKTOP), ladder });
-    expect(actions).toEqual([]);
-  });
-
-  it('nâng một nấc rồi phải hạ lại ngay đúng nấc đó: khóa, không nâng nấc ấy nữa (không dao động)', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 1, steps: 4 };
-    // Máy giả chỉ chạy nổi 60 fps khi đã hạ 1 nấc.
-    const { actions } = run(tuner, { seconds: 90, gapFor: (k) => (k >= 1 ? DESKTOP : 25), ladder });
-    expect(kinds(actions)).toEqual(['up', 'down']);
-    expect(tuner.state().locked).toEqual([0]);
-    expect(ladder.applied).toBe(1);
-  });
-
-  it('khóa nhịp 30 fps (tiết kiệm pin): hạ hết thang, không nhanh hơn → trả lại hết, thôi hạ; hết khóa thì chạy lại', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 3 };
-    let gap = 1000 / 30;
-    const first = run(tuner, { seconds: 60, gapFor: () => gap, ladder });
-    expect(kinds(first.actions)).toEqual(['down', 'down', 'down', 'reset']);
-    expect(ladder.applied).toBe(0);
-    expect(tuner.state().capped).toBe(true);
-    // Cắm sạc: về 60 fps, hết khóa (không còn nấc nào để nâng). Rồi máy thật sự chậm (40 fps): lại hạ được.
-    gap = DESKTOP;
-    expect(run(tuner, { seconds: 10, gapFor: () => gap, ladder, from: first.end }).actions).toEqual([]);
-    expect(tuner.state().capped).toBe(false);
-    const again = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: first.end + 10_000 });
-    expect(kinds(again.actions)).toEqual(['down']);
-  });
-
-  it('hết khóa nhịp trên màn 59,94 Hz, hay khi mỗi cửa sổ rớt một khung: thoát "bị khóa nhịp", rồi chậm thật thì lại hạ', () => {
-    const idles = { '59,94 Hz': () => 1000 / 59.94, '60 Hz rớt 1 khung / 2 s': (k, i) => (i % 120 === 60 ? 2 * DESKTOP : DESKTOP) };
-    for (const [name, idle] of Object.entries(idles)) {
-      const tuner = createTuner({ budgetMs: DESKTOP });
-      const ladder = { applied: 0, steps: 3 };
-      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
-      expect(kinds(locked.actions), name).toEqual(['down', 'down', 'down', 'reset']);
-      const unlocked = run(tuner, { seconds: 10, gapFor: idle, ladder, from: locked.end });
-      expect(unlocked.actions, name).toEqual([]);
-      expect(tuner.state().capped, name).toBe(false);
-      const slow = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: unlocked.end });
-      expect(kinds(slow.actions), name).toEqual(['down']);
-    }
-  });
-
-  it('đang "bị khóa nhịp" mà quá tải thật (chậm hẳn hơn nhịp bị khóa) thì vẫn hạ về lại nhịp ấy, kể cả khi Sổ tay mở', () => {
-    for (const guarding of [false, true]) {
-      const tuner = createTuner({ budgetMs: DESKTOP });
-      const ladder = { applied: 0, steps: 3 };
-      const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
-      expect(tuner.state().capped).toBe(true);
-      tuner.guard(guarding);
-      // Người xem kéo 200.000 đom đóm: khung 50 ms (20 fps). Hạ một nấc là về lại nhịp bị khóa 33 ms: dừng ở đó.
-      // (Phản ứng đầu tiên; trả lại nấc sau đó do hai test dưới giữ.)
-      const heavy = run(tuner, { seconds: 12, gapFor: (k) => (k === 0 ? 50 : 1000 / 30), ladder, from: locked.end });
-      expect(kinds(heavy.actions), `canh: ${guarding}`).toEqual(['down']);
-      expect(tuner.state().capped).toBe(true);
-    }
-  });
-
-  it('đang "bị khóa nhịp": hạ vì quá tải thật, người xem trả núm về thì trả lại nấc (vẫn khóa); Sổ tay còn mở thì chờ', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 3 };
-    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
-    expect(tuner.state().capped).toBe(true);
-    tuner.guard(true);
-    const heavy = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
-    expect(kinds(heavy.actions)).toEqual(['down']);
-    // Người xem trả số đom đóm về: nấc vừa hạ không còn cần nữa.
-    const open = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: heavy.end });
-    expect(open.actions).toEqual([]);
-    tuner.guard(false);
-    const closed = run(tuner, { seconds: 20, gapFor: () => 1000 / 30, ladder, from: open.end });
-    expect(kinds(closed.actions)).toEqual(['up']);
-    expect(ladder.applied).toBe(0);
-    expect(tuner.state().capped).toBe(true);
-  });
-
-  it('đang "bị khóa nhịp": trả lại nấc mà quá tải lại ngay thì hạ lại và khóa nấc ấy (không dao động)', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 3 };
-    const locked = run(tuner, { seconds: 60, gapFor: () => 1000 / 30, ladder });
-    const heavy = run(tuner, { seconds: 60, gapFor: (k) => (k === 0 ? 100 : 1000 / 30), ladder, from: locked.end });
-    expect(kinds(heavy.actions)).toEqual(['down', 'up', 'down']);
-    expect(tuner.state().locked).toEqual([0]);
-    expect(ladder.applied).toBe(1);
-    // Cắm sạc, núm đã trả về: hết khóa nhịp thì quên các nấc khóa trong lúc bị khóa, trả lại được như trước.
-    const unplugged = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: heavy.end });
-    expect(kinds(unplugged.actions)).toEqual(['up']);
-    expect(ladder.applied).toBe(0);
-    expect(tuner.state()).toMatchObject({ capped: false, locked: [] });
-  });
-
-  it('mốc "lúc bắt đầu hạ" không dùng lại mốc cũ: hạ ở 25 ms rồi nâng về hết; sau đó Sổ tay mở hạ từ 50 ms còn 38 ms → đóng Sổ tay vẫn giữ nấc', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 4 };
-    const first = run(tuner, { seconds: 8, gapFor: (k) => (k === 0 ? 25 : DESKTOP), ladder });
-    expect(kinds(first.actions)).toEqual(['down']);
-    const idle = run(tuner, { seconds: 14, gapFor: () => DESKTOP, ladder, from: first.end });
-    expect(kinds(idle.actions)).toEqual(['up']);
-    tuner.guard(true);
-    const heavy = (k) => 50 - k * 3; // thí nghiệm nặng: mỗi nấc bớt 3 ms, hạ hết còn 38 ms
-    const open = run(tuner, { seconds: 20, gapFor: heavy, ladder, from: idle.end });
-    expect(kinds(open.actions)).toEqual(['down', 'down', 'down', 'down']);
-    tuner.guard(false); // đóng Sổ tay, thí nghiệm vẫn bật: hạ đã giúp (50 → 38 ms), không được trả lại
-    const closed = run(tuner, { seconds: 30, gapFor: heavy, ladder, from: open.end });
-    expect(closed.actions).toEqual([]);
-    expect(ladder.applied).toBe(4);
-    expect(tuner.state().capped).toBe(false);
-  });
-
-  it('bắt đầu hạ lúc Sổ tay mở (quá tải nặng), hạ hết mà không nhanh hơn: đóng Sổ tay thì trả lại hết như luật khóa nhịp', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 0, steps: 3 };
-    tuner.guard(true);
-    const open = run(tuner, { seconds: 16, gapFor: () => 50, ladder });
-    expect(kinds(open.actions)).toEqual(['down', 'down', 'down']);
-    tuner.guard(false);
-    const closed = run(tuner, { seconds: 10, gapFor: () => 50, ladder, from: open.end });
-    expect(kinds(closed.actions)).toEqual(['reset']);
-    expect(tuner.state().capped).toBe(true);
-  });
-
-  it('khoảng giữa hai khung > 250 ms (tab ẩn, debugger) thì bỏ cả cửa sổ đang đo', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    // 40 fps nhưng cứ 1,5 giây lại có một khoảng 400 ms: không cửa sổ nào đo xong, nên không quyết gì.
-    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 60 === 59 ? 400 : 25), ladder: { applied: 0, steps: 4 } });
-    expect(actions).toEqual([]);
-  });
-
-  it('canh (Sổ tay mở): chậm vừa phải thì để yên (số đo trung thực), quá tải nặng thì vẫn hạ, không bao giờ nâng', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 1, steps: 4 };
-    tuner.guard(true);
-    expect(tuner.state().guarding).toBe(true);
-    const slow = run(tuner, { seconds: 20, gapFor: () => 25, ladder }); // 40 fps: người xem đang thử, để yên
-    expect(slow.actions).toEqual([]);
-    const idle = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: slow.end }); // dư mà không nâng
-    expect(idle.actions).toEqual([]);
-    const heavy = run(tuner, { seconds: 7, gapFor: () => 50, ladder, from: idle.end }); // 20 fps: máy bị ép quá sức
-    expect(kinds(heavy.actions)).toEqual(['down']);
-    tuner.guard(false);
-    const normal = run(tuner, { seconds: 7, gapFor: () => 25, ladder, from: heavy.end });
-    expect(kinds(normal.actions)).toEqual(['down']);
-    expect(normal.actions[0].at - heavy.end / 1000).toBeGreaterThanOrEqual(5.9); // đổi chế độ: khởi động lại
-  });
-
-  it('điện thoại 45 fps (ngân sách 22,2 ms): không quá tải, cũng không dư (có rớt khung) → để yên', () => {
-    const tuner = createTuner({ budgetMs: FRAME_BUDGET_MS.mobile });
-    const pattern = [1000 / 60, 1000 / 60, 1000 / 30]; // trung bình 22,2 ms
-    const { actions } = run(tuner, { seconds: 60, gapFor: (k, i) => pattern[i % 3], ladder: { applied: 1, steps: 4 } });
-    expect(actions).toEqual([]);
-  });
-
-  it('màn 120 Hz dư nhiều (< 0,7 × ngân sách): nâng lần lượt từng nấc', () => {
-    const tuner = createTuner({ budgetMs: DESKTOP });
-    const ladder = { applied: 2, steps: 4 };
-    const { actions } = run(tuner, { seconds: 30, gapFor: () => 1000 / 120, ladder });
-    expect(kinds(actions)).toEqual(['up', 'up']);
-    expect(ladder.applied).toBe(0);
-  });
-
-  it('sau bộ chặn 60 khung/giây (như run.js): màn 72/75/85/144 Hz, nhịp lệch ±0,3 ms, máy rảnh thì nâng lại hết', () => {
-    // Nhịp sau bộ chặn không đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không rớt khung nào.
-    for (const hz of [60, 72, 75, 85, 90, 120, 144, 165]) {
-      const tuner = createTuner({ budgetMs: DESKTOP });
-      const cap = createFrameCap();
-      const jitter = mulberry32(hz);
-      const ladder = { applied: 3, steps: 4 };
-      for (let i = 1; i < hz * 60; i++) {
-        const ms = (i * 1000) / hz + (jitter() - 0.5) * 0.6;
-        if (!cap.ready(ms)) continue;
-        const action = tuner.sample(ms, ladder);
-        if (action === 'up') ladder.applied -= 1;
-        else if (action) ladder.applied = action === 'down' ? ladder.applied + 1 : 0;
-      }
-      expect(ladder.applied, `${hz} Hz`).toBe(0);
-    }
-  });
-
-  it('nhịp của bộ chặn khung là nhịp mà bộ điều chỉnh dùng để đếm khung rớt', () => {
-    expect(TUNER.frameMs).toBeCloseTo(1000 / MAX_FPS, 9);
-  });
-});
```

Run: `npx vitest run tests/unit/tuner.test.js tests/unit/quality.test.js`
Kết quả mong đợi: FAIL, 1 file test không chạy được; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/tuner.js' imported from tests/unit/tuner.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/tuner.js`:

```js
// engine/tuner.js — bộ điều chỉnh có trễ (hàm thuần, không three): đọc nhịp khung, và ms GPU/CPU khi đo được, rồi quyết hạ hay nâng một nấc.

/** Ngân sách một khung (ms): 60 khung/giây trên máy tính, 45 khung/giây trên điện thoại (spec §10). */
export const FRAME_BUDGET_MS = Object.freeze({ desktop: 1000 / 60, mobile: 1000 / 45 });

/** Các hằng số của bộ điều chỉnh (spec §10). Test ghi đè được. */
export const TUNER = Object.freeze({
  windowMs: 2000, // một cửa sổ đo
  warmupMs: 2000, // bỏ qua lúc mới live hay mới chạy lại (còn biên dịch dở)
  hiccupMs: 250, // khoảng giữa hai khung dài hơn thế (tab ẩn, debugger) thì bỏ cả cửa sổ
  over: 1.2, // "quá tải": trung bình > ngân sách × 1,2
  severe: 2.2, // "quá tải nặng": trung bình > ngân sách × 2,2 (khi Sổ tay mở, chỉ phản ứng với mức này)
  spare: 0.7, // "dư nhiều": trung bình < ngân sách × 0,7
  near: 1.05, // "dư vừa": trung bình ≤ ngân sách × 1,05 VÀ không rớt khung nào
  frameMs: 1000 / 60, // nhịp của bộ chặn khung (MAX_FPS của gpu/clock.js): cửa sổ thiếu ≥ 0,75 nhịp là rớt khung
  downAfter: 2, // số cửa sổ quá tải liền nhau thì hạ một nấc
  upAfter: 5, // số cửa sổ dư liền nhau thì nâng một nấc
  lockWithin: 3, // nâng một nấc mà trong chừng này cửa sổ phải hạ lại đúng nấc đó thì khóa nó
  gain: 0.9, // hạ hết thang mà trung bình vẫn ≥ 90% lúc bắt đầu hạ: nhịp bị khóa, không phải GPU yếu
  beyond: 1.25, // đang bị khóa nhịp: chậm hơn nhịp ấy × 1,25 là quá tải thật (hạ); nhanh hơn ÷ 1,25 là hết khóa
  // GĐ 4 · chẩn đoán theo máy khi đo được thời gian GPU. Tải = max(trung vị ms GPU, trung bình ms CPU) của cửa sổ.
  gpuSamples: 3, // cửa sổ có từ chừng này mẫu GPU trở lên mới chẩn đoán theo tải
  busy: 0.85, // tải > ngân sách × 0,85 mà nhịp chậm hơn ngân sách × 1,05: máy là nút cổ chai (quá tải)
  idle: 0.5, // nhịp > ngân sách × 1,2 mà tải < ngân sách × 0,5: trình duyệt đang khóa nhịp, máy thì nhàn
  light: 0.6, // tải < ngân sách × 0,6: máy dư sức (dù màn 60,1 Hz, 75 Hz hay đang bị khóa nhịp)
});

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * Đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây, rồi trả lời nên hạ một nấc ('down'),
 * nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null). Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js.
 * Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
 *
 * Hai đường, chọn theo từng cửa sổ:
 * - ĐƯỜNG TẢI (GĐ 4): cửa sổ có từ 3 mẫu ms GPU trở lên. Nhịp rAF bị khóa theo màn hình và theo chế độ tiết kiệm pin,
 *   nên một laptop yếu (GPU 20 ms, nhịp 33 ms) và một máy khóa 30 fps (GPU 5 ms, nhịp 33 ms) trông y hệt nhau. Thời gian
 *   GPU thật tách được hai trường hợp: máy là nút cổ chai thì hạ; trình duyệt khóa nhịp thì vào "bị khóa nhịp" ngay mà
 *   không hạ gì; máy dư sức thì nâng lại, kể cả khi nhịp đang bị khóa.
 * - ĐƯỜNG NHỊP (GĐ 3, máy không đo được GPU): ba luật sinh từ nhịp bị khóa.
 *   1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
 *   2. Hạ hết thang mà không nhanh hơn lúc bắt đầu hạ thì nhịp đang bị khóa: trả lại hết ('reset') rồi thôi hạ.
 *      Mốc "lúc bắt đầu hạ" đo ở lần hạ đầu tiên sau mỗi lần nâng (GĐ 4; GĐ 3 chỉ đo lại khi đã nâng về hết), ghi cả khi
 *      đang canh. Hết khóa khi nhịp nhanh hẳn lên (≤ 1,05 × ngân sách, hay nhanh hơn nhịp bị khóa ÷ 1,25). Còn khóa mà
 *      chậm hẳn hơn nhịp bị khóa (× 1,25, 2 cửa sổ liền) thì là quá tải thật: vẫn hạ, để về lại nhịp ấy; về lại đúng
 *      nhịp bị khóa 5 cửa sổ liền thì trả dần các nấc đó, Sổ tay mở thì chờ.
 *   3. Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại (cả hai đường).
 * guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học, nên chậm vừa phải thì để yên cho số đo trung thực; quá tải
 * NẶNG (> ngân sách × 2,2, theo tải nếu đo được) thì vẫn hạ, để máy không bị ép quá sức. Lúc canh không bao giờ nâng.
 *
 * @param {{ budgetMs: number } & Partial<typeof TUNER>} options
 */
export function createTuner({ budgetMs, ...options }) {
  const o = { ...TUNER, ...options };
  let guarding = false; // Sổ tay đang mở: chỉ canh quá tải nặng
  let since = null; // thời điểm bắt đầu đo (sau khi live, hay sau khi chạy lại)
  let last = null; // thời điểm của khung trước
  let gaps = []; // các khoảng giữa hai khung của cửa sổ đang đo
  let total = 0;
  let cpus = []; // ms CPU của từng khung trong cửa sổ
  let gpus = []; // mẫu ms GPU về trong cửa sổ (đến trễ vài khung, không đều)
  let open = false; // cửa sổ đang đo (đã qua khởi động): chỉ khi đó mới ghi ms CPU/GPU
  let measured = false; // đã có ít nhất một mẫu ms GPU hữu hạn, lớn hơn 0: máy "đo được"
  let windowNo = 0;
  let overRun = 0;
  let spareRun = 0;
  let descentStart = null; // trung bình của cửa sổ khiến hạ nấc đầu tiên sau lần nâng gần nhất
  let remeasure = true; // lần hạ tới đo lại mốc descentStart (mới dựng, hay vừa nâng)
  let capped = false; // nhịp đang bị khóa (tiết kiệm pin): đường nhịp không hạ nữa, trừ khi chậm hẳn hơn nhịp bị khóa
  let capAvg = null; // trung bình lúc nhận ra nhịp bị khóa
  let beyondRun = 0; // số cửa sổ liền nhau chậm hẳn hơn nhịp bị khóa
  let calmRun = 0; // số cửa sổ liền nhau đúng nhịp bị khóa (lúc đang bị khóa)
  let lastUp = null; // { index, windowNo } của lần nâng gần nhất
  const locked = new Set();
  const cappedLocks = new Set(); // nấc khóa trong lúc bị khóa nhịp: hết khóa thì quên, cắm sạc luôn trả lại được

  const clear = () => {
    gaps = [];
    total = 0;
    cpus = [];
    gpus = [];
    open = false;
  };
  /** Hạ lại đúng nấc vừa nâng, ngay trong vài cửa sổ: khóa nấc ấy (chống dao động). Nấc khóa lúc bị khóa nhịp thì nhớ riêng. */
  const lockIfBounced = (applied) => {
    const bounced = lastUp !== null && lastUp.index === applied && windowNo - lastUp.windowNo <= o.lockWithin;
    if (bounced) {
      locked.add(applied);
      if (capped) cappedLocks.add(applied);
    }
  };
  const down = (applied, avg) => {
    if (remeasure) {
      descentStart = avg; // mốc của đợt hạ này, ghi cả khi đang canh (Sổ tay mở)
      remeasure = false;
    }
    lockIfBounced(applied);
    return 'down';
  };
  const up = (applied) => {
    lastUp = { index: applied - 1, windowNo };
    remeasure = true; // lần hạ sau đo mốc mới, không dùng lại mốc cũ
    return 'up';
  };
  const uncap = () => {
    capped = false; // hết khóa (cắm sạc, tắt tiết kiệm pin; màn 59,94 Hz hay rớt lẻ một khung vẫn tính): chạy lại
    beyondRun = 0;
    calmRun = 0;
    overRun = 0; // các cửa sổ lúc bị khóa là nhịp của trình duyệt, không phải máy quá tải: đếm lại từ đầu
    for (const index of cappedLocks) locked.delete(index);
    cappedLocks.clear();
  };

  /** ĐƯỜNG TẢI: cửa sổ đủ mẫu GPU. Tải là thời gian máy thật sự bận cho một khung, không bị khóa theo màn hình. */
  function byLoad(avg, load, applied, steps) {
    const over = guarding ? load > budgetMs * o.severe : avg > budgetMs * o.near && load > budgetMs * o.busy;
    const spare = !guarding && load < budgetMs * o.light;
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped && avg <= budgetMs * o.near) uncap();
    else if (!capped && avg > budgetMs * o.over && load < budgetMs * o.idle) {
      capped = true; // nhịp chậm mà máy nhàn: trình duyệt đang khóa nhịp. Không hạ gì, không phải hạ hết thang rồi trả lại
      capAvg = avg;
    }
    if (overRun >= o.downAfter && applied < steps) {
      overRun = 0;
      spareRun = 0;
      return down(applied, avg);
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      return up(applied);
    }
    return null;
  }

  /** ĐƯỜNG NHỊP, lúc đang bị khóa nhịp: chậm hẳn hơn nhịp ấy thì hạ; về lại đúng nhịp ấy đủ lâu thì trả dần. */
  function whileCapped(applied, steps) {
    if (beyondRun >= o.downAfter && applied < steps) {
      beyondRun = 0;
      calmRun = 0;
      lockIfBounced(applied);
      return 'down';
    }
    if (!guarding && calmRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      calmRun = 0;
      return up(applied);
    }
    return null;
  }

  /** ĐƯỜNG NHỊP (GĐ 3): máy không đo được GPU, hay cửa sổ chưa đủ mẫu. */
  function byRhythm(avg, drops, applied, steps) {
    const over = avg > budgetMs * (guarding ? o.severe : o.over);
    const spare = !guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped) {
      beyondRun = avg > capAvg * o.beyond ? beyondRun + 1 : 0;
      calmRun = avg <= capAvg * o.near ? calmRun + 1 : 0;
      if (avg > budgetMs * o.near && avg >= capAvg / o.beyond) return whileCapped(applied, steps);
      uncap();
    }
    if (overRun >= o.downAfter) {
      overRun = 0;
      spareRun = 0;
      if (applied < steps) return down(applied, avg);
      if (!guarding && descentStart !== null && avg >= descentStart * o.gain) {
        capped = true;
        capAvg = avg;
        beyondRun = 0;
        calmRun = 0;
        descentStart = null;
        remeasure = true;
        return 'reset';
      }
      return null;
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      return up(applied);
    }
    return null;
  }

  return {
    /**
     * Gọi MỘT lần mỗi khung, trước khi vẽ.
     * @param {number} ms  thời điểm của khung (timestamp của requestAnimationFrame)
     * @param {{ applied: number, steps: number }} ladder  số nấc đang áp và tổng số nấc của thang
     * @returns {'down' | 'up' | 'reset' | null}
     */
    sample(ms, { applied, steps }) {
      since ??= ms;
      const gap = last === null ? null : ms - last;
      last = ms;
      if (gap === null) return null;
      if (gap <= 0 || gap > o.hiccupMs) {
        clear();
        return null;
      }
      if (ms - since < o.warmupMs) return null;
      open = true;
      gaps.push(gap);
      total += gap;
      if (total < o.windowMs) return null;
      const avg = total / gaps.length;
      // Rớt khung = số nhịp 60 khung/giây trôi qua mà không có khung nào, đếm trên cả cửa sổ. Không so từng khoảng:
      // sau bộ chặn khung, màn 75 Hz hay 144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không
      // rớt khung nào; phần lẻ dưới 0,75 nhịp là lệch pha ở hai đầu cửa sổ.
      const missed = total / o.frameMs - gaps.length;
      const drops = missed < 0.75 ? 0 : Math.round(missed);
      const load = gpus.length >= o.gpuSamples
        ? Math.max(median(gpus), cpus.length ? cpus.reduce((a, b) => a + b, 0) / cpus.length : 0)
        : null;
      clear();
      windowNo += 1;
      return load === null ? byRhythm(avg, drops, applied, steps) : byLoad(avg, load, applied, steps);
    },
    /** ms CPU của khung vừa vẽ (luồng chính bận bao lâu): một nửa của "tải". */
    cpu(ms) {
      if (open && Number.isFinite(ms) && ms >= 0) cpus.push(ms);
    },
    /** Một mẫu ms GPU (gpu-timer): đến trễ vài khung và không đều; cửa sổ nào đủ 3 mẫu thì đi đường tải. */
    gpu(ms) {
      if (!Number.isFinite(ms) || ms <= 0) return;
      measured = true;
      if (open) gpus.push(ms);
    },
    /** Chuyển sang chế độ canh (Sổ tay mở) hay về như thường; đổi chế độ thì đo lại từ đầu, có khởi động. */
    guard(on) {
      guarding = on;
      since = null;
      last = null;
      overRun = 0;
      spareRun = 0;
      beyondRun = 0;
      calmRun = 0;
      clear();
    },
    /** @returns {{ guarding: boolean, capped: boolean, locked: number[], gpu: boolean }}  locked: chỉ số nấc trong thang */
    state: () => ({ guarding, capped, locked: [...locked], gpu: measured }),
  };
}
```

Áp vào `src/engine/quality.js`:

```diff
diff --git a/src/engine/quality.js b/src/engine/quality.js
index 5d54c96..24d07a2 100644
--- a/src/engine/quality.js
+++ b/src/engine/quality.js
@@ -1,4 +1,4 @@
-// engine/quality.js — chọn mức chất lượng lúc khởi động, ghép ngân sách của bức, và bộ điều chỉnh có trễ (hàm thuần, không three).
+// engine/quality.js — chọn mức chất lượng lúc khởi động và ghép ngân sách của bức (hàm thuần, không three; bộ điều chỉnh ở tuner.js).
 
 export const LEVELS = Object.freeze(['cao', 'vua', 'thap']);
 
@@ -9,26 +9,6 @@ export const DEFAULT_LEVELS = Object.freeze({
   thap: Object.freeze({ dpr: 1.25 }),
 });
 
-/** Ngân sách một khung (ms): 60 khung/giây trên máy tính, 45 khung/giây trên điện thoại (spec §10). */
-export const FRAME_BUDGET_MS = Object.freeze({ desktop: 1000 / 60, mobile: 1000 / 45 });
-
-/** Các hằng số của bộ điều chỉnh (spec §10). Test ghi đè được. */
-export const TUNER = Object.freeze({
-  windowMs: 2000, // một cửa sổ đo
-  warmupMs: 2000, // bỏ qua lúc mới live hay mới chạy lại (còn biên dịch dở)
-  hiccupMs: 250, // khoảng giữa hai khung dài hơn thế (tab ẩn, debugger) thì bỏ cả cửa sổ
-  over: 1.2, // "quá tải": trung bình > ngân sách × 1,2
-  severe: 2.2, // "quá tải nặng": trung bình > ngân sách × 2,2 (khi Sổ tay mở, chỉ phản ứng với mức này)
-  spare: 0.7, // "dư nhiều": trung bình < ngân sách × 0,7
-  near: 1.05, // "dư vừa": trung bình ≤ ngân sách × 1,05 VÀ không rớt khung nào
-  frameMs: 1000 / 60, // nhịp của bộ chặn khung (MAX_FPS của gpu/clock.js): cửa sổ thiếu ≥ 0,75 nhịp là rớt khung
-  downAfter: 2, // số cửa sổ quá tải liền nhau thì hạ một nấc
-  upAfter: 5, // số cửa sổ dư liền nhau thì nâng một nấc
-  lockWithin: 3, // nâng một nấc mà trong chừng này cửa sổ phải hạ lại đúng nấc đó thì khóa nó
-  gain: 0.9, // hạ hết thang mà trung bình vẫn ≥ 90% lúc bắt đầu hạ: nhịp bị khóa, không phải GPU yếu
-  beyond: 1.25, // đang bị khóa nhịp: chậm hơn nhịp ấy × 1,25 là quá tải thật (hạ); nhanh hơn ÷ 1,25 là hết khóa
-});
-
 /**
  * Máy này có phải điện thoại/máy tính bảng không.
  * iPadOS 13+ gửi UA giống hệt Mac, nên "Macintosh + màn hình cảm ứng nhiều điểm" cũng tính là máy cầm tay.
@@ -59,162 +39,3 @@ export function budgetFor(level, qualitySpec) {
   if (!LEVELS.includes(level)) throw new Error(`budgetFor: không có mức "${level}"`);
   return { ...DEFAULT_LEVELS[level], ...(qualitySpec?.levels?.[level] ?? {}) };
 }
-
-/**
- * Bộ điều chỉnh có trễ: đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây,
- * rồi trả lời nên hạ một nấc ('down'), nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null).
- * Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js. Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
- *
- * Nhịp rAF không phải thời gian GPU: trình duyệt khóa nó theo màn hình (60 Hz: không bao giờ dưới 16,7 ms) và theo
- * chế độ tiết kiệm pin (30 fps). Ba luật ngoài spec gốc sinh ra từ đó (spec §10, GĐ 3):
- * 1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
- *    Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại.
- * 2. Hạ hết thang mà không nhanh hơn lúc bắt đầu hạ thì nhịp đang bị khóa: trả lại hết ('reset') rồi thôi hạ.
- *    Mốc "lúc bắt đầu hạ" ghi ở nấc đầu tiên (cả khi đang canh) và bỏ khi đã nâng về hết.
- *    Hết khóa khi nhịp nhanh hẳn lên (≤ 1,05 × ngân sách như "dư vừa", hay nhanh hơn nhịp bị khóa ÷ 1,25). Còn khóa
- *    mà chậm hẳn hơn nhịp bị khóa (× 1,25, 2 cửa sổ liền) thì là quá tải thật: vẫn hạ, để về lại nhịp ấy; về lại
- *    đúng nhịp bị khóa 5 cửa sổ liền (người xem trả núm về) thì trả dần các nấc đó, Sổ tay mở thì chờ.
- * 3. guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên chậm vừa phải
- *    thì để yên cho số đo trung thực; nhưng quá tải NẶNG (> ngân sách × 2,2) thì vẫn hạ, để máy không bị ép quá sức.
- *    Lúc canh không bao giờ nâng.
- *
- * @param {{ budgetMs: number } & Partial<typeof TUNER>} options
- */
-export function createTuner({ budgetMs, ...options }) {
-  const o = { ...TUNER, ...options };
-  let guarding = false; // Sổ tay đang mở: chỉ canh quá tải nặng
-  let since = null; // thời điểm bắt đầu đo (sau khi live, hay sau khi chạy lại)
-  let last = null; // thời điểm của khung trước
-  let gaps = []; // các khoảng giữa hai khung của cửa sổ đang đo
-  let total = 0;
-  let windowNo = 0;
-  let overRun = 0;
-  let spareRun = 0;
-  let descentStart = null; // trung bình của cửa sổ khiến hạ nấc đầu tiên (từ lúc chưa hạ gì)
-  let capped = false; // nhịp đang bị khóa: không hạ nữa, trừ khi chậm hẳn hơn nhịp bị khóa
-  let capAvg = null; // trung bình lúc nhận ra nhịp bị khóa
-  let beyondRun = 0; // số cửa sổ liền nhau chậm hẳn hơn nhịp bị khóa
-  let calmRun = 0; // số cửa sổ liền nhau đúng nhịp bị khóa (lúc đang bị khóa)
-  let lastUp = null; // { index, windowNo } của lần nâng gần nhất
-  const locked = new Set();
-  const cappedLocks = new Set(); // nấc khóa trong lúc bị khóa nhịp: hết khóa thì quên, cắm sạc luôn trả lại được
-
-  const clear = () => {
-    gaps = [];
-    total = 0;
-  };
-  /** Hạ lại đúng nấc vừa nâng, ngay trong vài cửa sổ: khóa nấc ấy (chống dao động). Trả true nếu vừa khóa. */
-  const lockIfBounced = (applied) => {
-    const bounced = lastUp !== null && lastUp.index === applied && windowNo - lastUp.windowNo <= o.lockWithin;
-    if (bounced) locked.add(applied);
-    return bounced;
-  };
-
-  /**
-   * Còn bị khóa nhịp. Chậm hẳn hơn nhịp bị khóa (người xem kéo núm nặng) là quá tải thật: hạ để về lại nhịp ấy.
-   * Về lại đúng nhịp bị khóa đủ lâu (người xem trả núm về): trả dần các nấc đã hạ lúc khóa; Sổ tay mở thì chờ.
-   */
-  function whileCapped(applied, steps) {
-    if (beyondRun >= o.downAfter && applied < steps) {
-      beyondRun = 0;
-      calmRun = 0;
-      if (lockIfBounced(applied)) cappedLocks.add(applied);
-      return 'down';
-    }
-    if (!guarding && calmRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
-      calmRun = 0;
-      lastUp = { index: applied - 1, windowNo };
-      return 'up';
-    }
-    return null;
-  }
-
-  /** Quyết định ở cuối mỗi cửa sổ. */
-  function decide(avg, drops, applied, steps) {
-    const over = avg > budgetMs * (guarding ? o.severe : o.over);
-    const spare = !guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
-    overRun = over ? overRun + 1 : 0;
-    spareRun = spare ? spareRun + 1 : 0;
-    if (capped) {
-      beyondRun = avg > capAvg * o.beyond ? beyondRun + 1 : 0;
-      calmRun = avg <= capAvg * o.near ? calmRun + 1 : 0;
-      if (avg > budgetMs * o.near && avg >= capAvg / o.beyond) return whileCapped(applied, steps);
-      capped = false; // hết khóa (cắm sạc, tắt tiết kiệm pin; màn 59,94 Hz hay rớt lẻ một khung vẫn tính): chạy lại
-      beyondRun = 0;
-      calmRun = 0;
-      overRun = 0; // các cửa sổ lúc bị khóa là nhịp của trình duyệt, không phải máy quá tải: đếm lại từ đầu
-      for (const index of cappedLocks) locked.delete(index);
-      cappedLocks.clear();
-    }
-    if (overRun >= o.downAfter) {
-      overRun = 0;
-      spareRun = 0;
-      if (applied < steps) {
-        if (applied === 0) descentStart = avg; // mốc của lần hạ này, ghi cả khi đang canh (Sổ tay mở)
-        lockIfBounced(applied);
-        return 'down';
-      }
-      if (!guarding && descentStart !== null && avg >= descentStart * o.gain) {
-        capped = true;
-        capAvg = avg;
-        beyondRun = 0;
-        calmRun = 0;
-        descentStart = null;
-        return 'reset';
-      }
-      return null;
-    }
-    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
-      spareRun = 0;
-      lastUp = { index: applied - 1, windowNo };
-      if (applied === 1) descentStart = null; // nâng về hết: lần hạ sau đo mốc mới, không dùng lại mốc cũ
-      return 'up';
-    }
-    return null;
-  }
-
-  return {
-    /**
-     * Gọi MỘT lần mỗi khung, trước khi vẽ.
-     * @param {number} ms  thời điểm của khung (timestamp của requestAnimationFrame)
-     * @param {{ applied: number, steps: number }} ladder  số nấc đang áp và tổng số nấc của thang
-     * @returns {'down' | 'up' | 'reset' | null}
-     */
-    sample(ms, { applied, steps }) {
-      since ??= ms;
-      const gap = last === null ? null : ms - last;
-      last = ms;
-      if (gap === null) return null;
-      if (gap <= 0 || gap > o.hiccupMs) {
-        clear();
-        return null;
-      }
-      if (ms - since < o.warmupMs) return null;
-      gaps.push(gap);
-      total += gap;
-      if (total < o.windowMs) return null;
-      const avg = total / gaps.length;
-      // Rớt khung = số nhịp 60 khung/giây trôi qua mà không có khung nào, đếm trên cả cửa sổ. Không so từng khoảng:
-      // sau bộ chặn khung, màn 75 Hz hay 144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không
-      // rớt khung nào; phần lẻ dưới 0,75 nhịp là lệch pha ở hai đầu cửa sổ.
-      const missed = total / o.frameMs - gaps.length;
-      const drops = missed < 0.75 ? 0 : Math.round(missed);
-      clear();
-      windowNo += 1;
-      return decide(avg, drops, applied, steps);
-    },
-    /** Chuyển sang chế độ canh (Sổ tay mở) hay về như thường; đổi chế độ thì đo lại từ đầu, có khởi động. */
-    guard(on) {
-      guarding = on;
-      since = null;
-      last = null;
-      overRun = 0;
-      spareRun = 0;
-      beyondRun = 0;
-      calmRun = 0;
-      clear();
-    },
-    /** @returns {{ guarding: boolean, capped: boolean, locked: number[] }} */
-    state: () => ({ guarding, capped, locked: [...locked] }),
-  };
-}
```

Áp vào `src/engine/flags.js`:

```diff
diff --git a/src/engine/flags.js b/src/engine/flags.js
index a01b950..e55a9df 100644
--- a/src/engine/flags.js
+++ b/src/engine/flags.js
@@ -1,12 +1,11 @@
 // engine/flags.js — đọc cờ URL (?static, ?webgl, ?force3d, ?debug, ?at, ?freeze, ?poster, ?level) thành một object thuần.
+// Ba mức lấy từ quality.js: từ GĐ 4 file đó chỉ còn chọn mức (bộ điều chỉnh ở tuner.js), nên đường nhẹ import được.
+import { LEVELS } from './quality.js';
 
 // ?at chỉ nhận dạng ISO 8601: "2026-09-28T21:00", có thể thêm ":ss" và một offset ("Z", "+07:00", "-05:00").
 // Dạng khác (ví dụ "09/28/2026") bị V8 đọc theo múi giờ của MÁY, nên bị loại: ?at phải cho cùng kết quả ở mọi nơi.
 const AT = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})?$/;
 const OFF = ['0', 'false'];
-// Cùng ba mức với engine/quality.js#LEVELS (test giữ cho khớp). Không import từ đó: file này nằm trên đường nhẹ
-// của poster, còn quality.js mang cả bộ điều chỉnh mà chỉ tầng 3D mới cần.
-const LEVELS = ['cao', 'vua', 'thap'];
 
 /**
  * Đọc giá trị của ?at thành Date.
```

Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index 338b84c..4bb1b60 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -1,5 +1,6 @@
 // engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
-import { FRAME_BUDGET_MS, budgetFor, createTuner, isMobile, pickLevel } from '../quality.js';
+import { budgetFor, isMobile, pickLevel } from '../quality.js';
+import { FRAME_BUDGET_MS, createTuner } from '../tuner.js';
 import { createCtx, buildLayers, ensureEmissive } from './layers.js';
 import { createPipeline } from './pipeline.js';
 import { createLadder } from './ladder.js';
```

Run: `npx vitest run tests/unit/tuner.test.js tests/unit/quality.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  585 passed`.

```bash
git add src/engine/flags.js src/engine/gpu/scene.js src/engine/quality.js src/engine/tuner.js tests/unit/quality.test.js tests/unit/tuner.test.js
git commit -F - <<'EOF'
feat(engine): tách bộ điều chỉnh sang tuner.js; chẩn đoán theo tải khi đo được ms GPU; mốc lúc bắt đầu hạ đo lại sau mỗi lần nâng

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Bộ chặn 60 khung/giây đo nhịp màn hình (`engine/gpu/clock.js`)

**Mục tiêu:** Spec §10 "(GĐ 4) Sửa các lỗi còn lại". Trên các màn "60 Hz" thật ra chạy 60,02–60,1 Hz, bộ chặn của GĐ 3 bỏ 2–15 khung mỗi phút, tức hình giật một nhịp vài giây một lần. Nguyên nhân: mốc "đã vẽ" tiến đúng 16,67 ms mỗi bước, còn nhịp màn hình ngắn hơn một chút; độ lệch dồn tới quá 1,5 ms thì một khung bị bỏ.

`createFrameCap` giờ đo nhịp màn hình: trung bình trượt của mọi khoảng rAF, kể cả khung bị bỏ; khoảng từ 100 ms trở lên (tab ẩn, máy khựng) không tính. Màn có nhịp từ `SLOW_DISPLAY_MS` = 1000/63 ms trở lên (≤ ~63 Hz) thì không bỏ khung nào. Màn nhanh hơn thì chặn như GĐ 3: 90 Hz vẽ xen kẽ, 120/144 Hz trung bình 60.

**Files:**
- Modify: `src/engine/gpu/clock.js`
- Test: `tests/unit/clock.test.js`

**Interfaces:**
- Consumes: —
- Produces: `SLOW_DISPLAY_MS = 1000 / 63`; `createFrameCap(fps = 60) → { ready(ms) → boolean }` (chữ ký như GĐ 3).

- [ ] **Step 1: Test (hỏng: màn 60,05 Hz vẫn bị bỏ khung)**

Áp vào `tests/unit/clock.test.js`:

```diff
diff --git a/tests/unit/clock.test.js b/tests/unit/clock.test.js
index 1df5034..a1b7ea0 100644
--- a/tests/unit/clock.test.js
+++ b/tests/unit/clock.test.js
@@ -1,5 +1,6 @@
+// tests/unit/clock.test.js — đồng hồ của cảnh (thật, tất định) và bộ chặn 60 khung/giây trên nhiều loại màn hình.
 import { describe, it, expect } from 'vitest';
-import { MAX_FPS, createClock, createFrameCap } from '../../src/engine/gpu/clock.js';
+import { MAX_FPS, SLOW_DISPLAY_MS, createClock, createFrameCap } from '../../src/engine/gpu/clock.js';
 
 describe('createClock — chế độ freeze (tất định)', () => {
   it('khung 1 có t = 1/60; dt luôn 1/60; ms bị bỏ qua', () => {
@@ -92,6 +93,40 @@ describe('createFrameCap — tối đa 60 khung/giây', () => {
     }
   });
 
+  it('màn "60 Hz" thật ra chạy 60,02 / 60,05 / 60,1 Hz (dao động tới ±1 ms): không bỏ khung nào trong 60 giây', () => {
+    // GĐ 3 bỏ 2–15 khung mỗi phút trên các màn này: mỗi khung bỏ là hình giật một nhịp.
+    expect(SLOW_DISPLAY_MS).toBeCloseTo(1000 / 63, 6);
+    for (const hz of [59.94, 60.02, 60.05, 60.1]) {
+      for (const jitter of [0, 1]) {
+        const cap = createFrameCap();
+        const total = Math.round(hz * 60);
+        let skipped = 0;
+        for (let i = 0; i < total; i++) if (!cap.ready((i * 1000) / hz + jitter * Math.sin(i * 1.7))) skipped += 1;
+        expect(skipped, `${hz} Hz, dao động ±${jitter} ms`).toBe(0);
+      }
+    }
+  });
+
+  it('màn 72, 75, 90, 120, 144 Hz (nhanh hơn ~63 Hz): vẫn chặn, khoảng 60 khung mỗi giây', () => {
+    for (const hz of [72, 75, 90, 120, 144]) {
+      const fps = drawn(hz, { seconds: 20, jitter: 0.3 });
+      expect(fps, `${hz} Hz`).toBeGreaterThanOrEqual(59);
+      expect(fps, `${hz} Hz`).toBeLessThanOrEqual(61);
+    }
+  });
+
+  it('nhịp màn hình đo cả những nhịp bị bỏ: đổi từ màn 120 Hz sang màn 60 Hz (kéo cửa sổ) thì thôi chặn', () => {
+    const cap = createFrameCap();
+    let t = 0;
+    let n = 0;
+    for (let i = 0; i < 240; i++) if (cap.ready((t += 1000 / 120))) n += 1;
+    expect(n).toBeGreaterThanOrEqual(118);
+    expect(n).toBeLessThanOrEqual(122);
+    n = 0;
+    for (let i = 0; i < 3606; i++) if (cap.ready((t += 1000 / 60.1))) n += 1;
+    expect(n).toBeGreaterThanOrEqual(3605); // một phút ở 60,1 Hz; chỉ vài nhịp đầu còn đo lại nhịp màn hình
+  });
+
   it('tab vừa hiện lại sau lâu: vẽ ngay rồi đi tiếp, không vẽ dồn; ms không phải số thì vẽ', () => {
     const cap = createFrameCap();
     expect(cap.ready(0)).toBe(true);
```

Run: `npx vitest run tests/unit/clock.test.js`
Kết quả mong đợi: FAIL, 2 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be close to 15.873015873015873, received difference is NaN, but expected 5e-7`.

- [ ] **Step 2: Code**

Áp vào `src/engine/gpu/clock.js`:

```diff
diff --git a/src/engine/gpu/clock.js b/src/engine/gpu/clock.js
index 39bc187..2bf3336 100644
--- a/src/engine/gpu/clock.js
+++ b/src/engine/gpu/clock.js
@@ -44,21 +44,42 @@ export function createClock({ freeze = false } = {}) {
   };
 }
 
+/**
+ * Màn có nhịp từ chừng này trở lên (tức ≤ ~63 Hz) thì không bị chặn: mọi khung đều vẽ. Nhiều màn "60 Hz" thật ra chạy
+ * 60,02–60,1 Hz, nhịp ngắn hơn 1/60 s một chút (GĐ 4).
+ */
+export const SLOW_DISPLAY_MS = 1000 / 63;
+const HICCUP_MS = 100; // khoảng rAF dài hơn thế (tab ẩn, debugger, máy khựng) không tính vào nhịp màn hình
+
 /**
  * Bộ chặn khung (hàm thuần): trình duyệt gọi requestAnimationFrame theo nhịp màn hình (60, 90, 120, 144 Hz…), mà một
  * bức tranh ngắm chậm chỉ cần 60 khung/giây. Nhịp nào tới sớm quá thì bỏ: màn 120 Hz không bắt GPU vẽ gấp đôi, máy mát
  * hơn, pin lâu hơn. Mốc "đã vẽ" tiến đều từng bước 1/60 s (không bám nhịp màn hình), nên màn 90 Hz vẽ xen kẽ, trung bình
- * vẫn 60 khung/giây. Màn 60 Hz, hay máy chậm hơn 60 khung, thì không khung nào bị bỏ.
+ * vẫn 60 khung/giây. Máy chậm hơn 60 khung thì không khung nào bị bỏ.
+ *
+ * GĐ 4: bộ chặn đo NHỊP MÀN HÌNH (trung bình trượt của mọi khoảng rAF, kể cả nhịp bị bỏ). Màn ≤ ~63 Hz thì không chặn
+ * gì. Lý do: màn 60,1 Hz có nhịp 16,64 ms, ngắn hơn bước 16,67 ms của mốc "đã vẽ"; độ lệch dồn dần tới lúc quá dung sai
+ * 1,5 ms thì một khung bị bỏ, tức hình giật một nhịp (GĐ 3 đo được 2–15 lần mỗi phút trên các màn 60,02–60,1 Hz).
  * @param {number} [fps]
  * @returns {{ ready: (ms: number) => boolean }}  ready(ms) = true: vẽ khung này
  */
 export function createFrameCap(fps = MAX_FPS) {
   const step = 1000 / fps;
   const slack = 1.5; // ms: nhịp 60 Hz thật dao động nhẹ, đừng bỏ nhầm khung của màn 60 Hz
-  let last = -Infinity;
+  let last = -Infinity; // mốc "đã vẽ"
+  let prev = null; // thời điểm của nhịp rAF trước, dù nhịp đó vẽ hay bị bỏ
+  let period = null; // nhịp màn hình (ms), trung bình trượt; null = chưa đo được
   return {
     ready(ms) {
       if (!Number.isFinite(ms)) return true;
+      const raw = prev === null ? null : ms - prev;
+      prev = ms;
+      if (raw > 0 && raw < HICCUP_MS) period = period === null ? raw : period * 0.9 + raw * 0.1;
+      // Màn chậm (hay chưa đo được nhịp): vẽ mọi khung, mốc "đã vẽ" bám theo thời điểm thật.
+      if (period === null || period >= SLOW_DISPLAY_MS) {
+        last = ms;
+        return true;
+      }
       const gap = ms - last;
       if (gap < step - slack) return false;
       // Tụt lại xa (tab vừa hiện lại, máy chậm): bám lại thời điểm hiện tại, không vẽ dồn để đuổi kịp.
```

Run: `npx vitest run tests/unit/clock.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  588 passed`.

```bash
git add src/engine/gpu/clock.js tests/unit/clock.test.js
git commit -F - <<'EOF'
fix(engine): bộ chặn 60 khung/giây đo nhịp màn hình; màn ≤ ~63 Hz (kể cả 60,02–60,1 Hz) không bị bỏ khung nào

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Đo ms GPU mỗi khung (`engine/gpu/gpu-timer.js`)

**Mục tiêu:** Spec §10 "Lấy số", Phụ lục A.40 và A.48.
- `stage.js` tạo renderer với `trackTimestamp: true`. WebGPU tự tắt cờ lúc `init` nếu adapter không có `timestamp-query`; WebGL2 chỉ đo khi có `EXT_disjoint_timer_query_webgl2`.
- `createGpuTimer(renderer, { onSample, onStop })`:
  - `poll(now)` được gọi sau mỗi `render()`, kèm mốc của khung vừa vẽ. Nó hỏi `resolveTimestampsAsync('render')`, và hỏi `'compute'` chỉ khi có compute từ lần hỏi trước: không có thì three trả lại số CŨ của pool compute. Không chờ kết quả, không hỏi chồng;
  - một mẫu = render + compute. Bỏ mẫu vô lý: ≤ 0, không hữu hạn, bị reject, hoặc **lớn hơn 1,5 lần nhịp khung trung bình của mẻ đo** (`GPU_PLAUSIBLE`). Mỗi lần hỏi, three gom các khung vẽ từ lần hỏi trước thành một mẻ và trả tổng các pass của khung cuối mẻ. GPU vẽ lần lượt từng pass thì không thể bận lâu hơn nhịp khung. Riêng GPU Apple trên Chrome báo các pass chồng lên nhau (16 pass, mỗi pass ~10 ms), nên three trả khoảng 160 ms cho khung 16,7 ms (đo lúc dựng thử);
  - máy nặng lên đột ngột (bật thí nghiệm nặng) chỉ lệch một mẫu, vì mẻ sau đã đo theo nhịp mới;
  - hỏng 3 lần liền (`GPU_FAIL_LIMIT`) thì thôi đo cho phiên đó, gọi `onStop` đúng một lần;
  - `?debug` có thể tắt `trackTimestamp` giữa chừng (máy không có timestamp-query): thôi hỏi.

**Files:**
- Create: `src/engine/gpu/gpu-timer.js`
- Modify: `src/engine/gpu/stage.js`
- Test: Create `tests/unit/gpu-timer.test.js`

**Interfaces:**
- Consumes: —
- Produces: `GPU_FAIL_LIMIT = 3`; `GPU_PLAUSIBLE = 1.5`; `createGpuTimer(renderer, { onSample?: (ms) => void, onStop?: () => void }) → { poll(now), ms: number | null, available: boolean, dispose() }`. `available` là true khi đã có ít nhất một mẫu hợp lệ và chưa phải thôi đo.

- [ ] **Step 1: Test (hỏng: chưa có `gpu-timer.js`)**

Tạo `tests/unit/gpu-timer.test.js`:

```js
// tests/unit/gpu-timer.test.js — ms GPU mỗi khung trên renderer giả: không hỏi chồng, cộng render + compute, bỏ số vô lý (kể cả lâu hơn nhịp khung), hỏng 3 lần thì tắt.
import { describe, it, expect, vi } from 'vitest';
import { createGpuTimer } from '../../src/engine/gpu/gpu-timer.js';

/** Renderer giả: resolveTimestampsAsync trả Promise do test giữ, để quyết lúc nào kết quả về và về số gì. */
function fakeRenderer({ track = true } = {}) {
  const calls = [];
  const renderer = {
    backend: { trackTimestamp: track },
    info: { compute: { frameCalls: 0 } },
    resolveTimestampsAsync: vi.fn((type) => new Promise((resolve, reject) => calls.push({ type, resolve, reject }))),
  };
  /** Trả kết quả cho mọi lời hỏi đang chờ: { render, compute } (số, hoặc Error để reject). */
  const answer = async ({ render, compute = 0 }) => {
    for (const c of calls.splice(0)) {
      const v = c.type === 'render' ? render : compute;
      if (v instanceof Error) c.reject(v);
      else c.resolve(v);
    }
    await new Promise((r) => setTimeout(r, 0)); // để then/finally của timer chạy xong
  };
  return { renderer, calls, answer };
}

describe('createGpuTimer', () => {
  it('máy không đo được (trackTimestamp tắt sau init): không bao giờ hỏi, không có số', () => {
    const { renderer } = fakeRenderer({ track: false });
    const timer = createGpuTimer(renderer);
    timer.poll();
    timer.poll();
    expect(renderer.resolveTimestampsAsync).not.toHaveBeenCalled();
    expect(timer.ms).toBeNull();
    expect(timer.available).toBe(false);
  });

  it('hỏi sau mỗi khung nhưng KHÔNG hỏi chồng: lần hỏi trước chưa về thì bỏ qua', async () => {
    const { renderer, answer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    timer.poll();
    timer.poll();
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(1);
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledWith('render');
    await answer({ render: 4.5 });
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(2);
  });

  it('cộng render + compute; chỉ hỏi compute khi có compute từ lần hỏi trước (không cộng số cũ của three)', async () => {
    const { renderer, answer } = fakeRenderer();
    const seen = [];
    const timer = createGpuTimer(renderer, { onSample: (ms) => seen.push(ms) });
    renderer.info.compute.frameCalls = 1; // khung này có chạy compute
    timer.poll();
    expect(renderer.resolveTimestampsAsync.mock.calls.map((c) => c[0])).toEqual(['render', 'compute']);
    await answer({ render: 4, compute: 0.5 });
    expect(seen).toEqual([4.5]);
    expect(timer.ms).toBe(4.5);
    expect(timer.available).toBe(true);
    renderer.info.compute.frameCalls = 0; // lớp dùng compute đã tắt: three sẽ trả lại số cũ nếu hỏi
    timer.poll();
    await answer({ render: 3, compute: 0.5 });
    expect(seen).toEqual([4.5, 3]);
    expect(renderer.resolveTimestampsAsync.mock.calls.map((c) => c[0])).toEqual(['render', 'compute', 'render']);
  });

  it('compute chạy ở khung đang chờ kết quả cũng được tính vào lần hỏi sau', async () => {
    const { renderer, answer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    timer.poll(); // khung 1: không compute
    renderer.info.compute.frameCalls = 1;
    timer.poll(); // khung 2: có compute, nhưng lần hỏi của khung 1 chưa về
    renderer.info.compute.frameCalls = 0;
    await answer({ render: 4 });
    timer.poll(); // khung 3: không compute, nhưng khung 2 có
    expect(renderer.resolveTimestampsAsync.mock.calls.map((c) => c[0])).toEqual(['render', 'render', 'compute']);
  });

  it('số vô lý (≤ 0, không hữu hạn, không phải số) hay bị reject: bỏ mẫu đó; một mẫu tốt thì đếm lại từ đầu', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    for (const bad of [{ render: 0 }, { render: Number.NaN }]) {
      timer.poll();
      await answer(bad);
    }
    timer.poll();
    await answer({ render: 5 });
    for (const bad of [{ render: undefined }, { render: new Error('mapAsync hỏng') }]) {
      timer.poll();
      await answer(bad);
    }
    expect(onSample.mock.calls).toEqual([[5]]);
    expect(timer.available).toBe(true); // hai lần hỏng liền sau mẫu tốt: chưa đủ ba
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(6);
  });

  it('hỏng 3 lần liền: tắt đo GPU cho phiên này (bộ điều chỉnh và Sổ tay chạy như GĐ 3), báo onStop đúng một lần', async () => {
    const { renderer, answer } = fakeRenderer();
    const onStop = vi.fn();
    const timer = createGpuTimer(renderer, { onStop });
    for (const bad of [{ render: -1 }, { render: Infinity }, { render: new Error('x') }]) {
      timer.poll();
      await answer(bad);
    }
    timer.poll();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(3);
    expect(timer.available).toBe(false);
    expect(timer.ms).toBeNull();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('số lâu hơn hẳn nhịp khung của mẻ (GPU Apple báo các pass chồng nhau, three cộng lại): số vô lý; 3 lần liền thì thôi đo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const onStop = vi.fn();
    const timer = createGpuTimer(renderer, { onSample, onStop });
    let t = 0;
    timer.poll((t += 1000 / 60)); // lần hỏi đầu: chưa có nhịp để so
    await answer({ render: 12 });
    expect(onSample.mock.calls).toEqual([[12]]);
    for (let i = 0; i < 3; i++) {
      timer.poll((t += 1000 / 60));
      await answer({ render: 160 }); // 16 pass × 10 ms trong một khung 16,7 ms
    }
    expect(onSample).toHaveBeenCalledTimes(1);
    expect(onStop).toHaveBeenCalledTimes(1);
    expect(timer.available).toBe(false);
  });

  it('máy nặng lên đột ngột chỉ lệch một mẫu: mẻ sau đã đo theo nhịp mới, không thôi đo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    let t = 0;
    timer.poll((t += 1000 / 60));
    await answer({ render: 10 });
    timer.poll((t += 1000 / 60)); // khung đầu sau khi bật thí nghiệm nặng: GPU bận 30 ms, nhịp cũ 16,7 ms → vô lý
    await answer({ render: 30 });
    for (let i = 0; i < 2; i++) {
      timer.poll((t += 1000 / 30)); // trình duyệt đã đợi GPU: nhịp 33 ms
      await answer({ render: 30 });
    }
    expect(onSample.mock.calls).toEqual([[10], [30], [30]]);
    expect(timer.available).toBe(true);
  });

  it('mẻ gồm nhiều khung (lần hỏi trước về chậm): trần theo nhịp trung bình của cả mẻ', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    let t = 0;
    timer.poll((t += 10));
    for (let i = 0; i < 3; i++) timer.poll((t += 10)); // lần hỏi đầu chưa về: ba khung 10 ms dồn vào mẻ sau
    await answer({ render: 8 });
    timer.poll((t += 50)); // mẻ: 4 khung trong 80 ms, trung bình 20 ms, trần 30 ms
    await answer({ render: 25 });
    expect(onSample.mock.calls).toEqual([[8], [25]]);
  });

  it('?debug tắt trackTimestamp giữa chừng (máy không có timestamp-query): thôi hỏi, không để three cảnh báo', () => {
    const { renderer } = fakeRenderer();
    const timer = createGpuTimer(renderer);
    renderer.backend.trackTimestamp = false;
    timer.poll();
    expect(renderer.resolveTimestampsAsync).not.toHaveBeenCalled();
  });

  it('dispose: kết quả về muộn không còn được báo', async () => {
    const { renderer, answer } = fakeRenderer();
    const onSample = vi.fn();
    const timer = createGpuTimer(renderer, { onSample });
    timer.poll();
    timer.dispose();
    await answer({ render: 4 });
    timer.poll();
    expect(onSample).not.toHaveBeenCalled();
    expect(renderer.resolveTimestampsAsync).toHaveBeenCalledTimes(1);
  });
});
```

Run: `npx vitest run tests/unit/gpu-timer.test.js`
Kết quả mong đợi: FAIL, 1 file test không chạy được; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/gpu/gpu-timer.js' imported from tests/unit/gpu-timer.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/gpu-timer.js`:

```js
// engine/gpu/gpu-timer.js — ms GPU mỗi khung: hỏi renderer.resolveTimestampsAsync (render + compute) sau khi vẽ, không chờ, không hỏi chồng.

/** Hỏng chừng này lần liền (bị reject, hay số vô lý) thì thôi đo GPU cho phiên này. */
export const GPU_FAIL_LIMIT = 3;
/**
 * Một khung không thể bận GPU lâu hơn chừng này lần nhịp khung của chính mẻ đo: số lớn hơn là số vô lý. GPU Apple (Chrome)
 * báo thời lượng các pass chồng lên nhau, và three cộng chúng lại: khoảng 160 ms cho một khung 16,7 ms (Phụ lục A.48).
 */
export const GPU_PLAUSIBLE = 1.5;

/**
 * Thời gian GPU thật của một khung, để bộ điều chỉnh (tuner.js) phân biệt "GPU không kịp" với "trình duyệt khóa nhịp",
 * và để Sổ tay có ms GPU (spec §10, GĐ 4).
 *
 * three đo bằng timestamp query: stage.js tạo renderer với `trackTimestamp: true`. WebGPU tự tắt cờ lúc init nếu adapter
 * không có 'timestamp-query'; WebGL2 chỉ đo khi có EXT_disjoint_timer_query_webgl2 (Phụ lục A.40).
 * `resolveTimestampsAsync(type)` đọc các truy vấn đã ghi và trả TỔNG ms GPU của khung mới nhất trong mẻ đó. Kết quả về
 * trễ vài khung (GPU phải chạy xong rồi mới đọc được), nên poll() không bao giờ chờ: nó hỏi rồi đi tiếp, và chỉ hỏi
 * lần mới khi lần trước đã về. Mẫu vì vậy thưa và không đều, bộ điều chỉnh gom theo cửa sổ 2 giây.
 *
 * Mỗi lần hỏi, three gom rồi xóa các truy vấn của những khung vẽ từ lần hỏi trước (một "mẻ"). Trần cho số trả về là nhịp khung
 * trung bình của mẻ đó × GPU_PLAUSIBLE: GPU vẽ lần lượt từng pass thì không thể bận lâu hơn nhịp khung. Máy nặng lên đột ngột
 * (bật thí nghiệm nặng) chỉ lệch một mẫu, vì mẻ sau đã đo theo nhịp mới.
 *
 * @param {any} renderer  WebGPURenderer ĐÃ init()
 * @param {{ onSample?: (ms: number) => void, onStop?: () => void }} [options]
 *   onSample: mỗi mẫu hợp lệ (render + compute, ms); onStop: máy thôi đo được (hỏng 3 lần liền), gọi một lần
 */
export function createGpuTimer(renderer, { onSample = () => {}, onStop = () => {} } = {}) {
  let pending = false;
  let failures = 0;
  let dead = false; // hỏng 3 lần liền, hay đã gỡ
  let computes = 0; // số lần compute từ lần hỏi trước
  let frames = 0; // số khung đã vẽ từ lần hỏi trước
  let askedAt = null; // mốc của lần hỏi trước
  let last = null;

  // Máy vẫn đo được không: WebGPU tắt cờ lúc init nếu thiếu tính năng; ?debug cũng có thể tắt nó (engine/gpu/debug.js).
  const tracking = () => !dead && renderer.backend?.trackTimestamp === true;
  const fail = () => {
    failures += 1;
    if (failures >= GPU_FAIL_LIMIT && !dead) {
      dead = true;
      last = null;
      onStop(); // Sổ tay về "—", bộ điều chỉnh về đường nhịp (hết mẫu GPU)
    }
  };

  return {
    /** Gọi sau mỗi render() của vòng lặp, với mốc của khung vừa vẽ (ms). Không chờ kết quả. */
    poll(now) {
      if (!tracking()) return;
      // Không có compute nào từ lần hỏi trước thì three trả lại số CŨ của pool compute: đừng cộng số đó.
      computes += renderer.info.compute.frameCalls;
      frames += 1;
      if (pending) return;
      pending = true;
      const frameMs = askedAt === null ? 0 : (now - askedAt) / frames; // nhịp khung trung bình của mẻ này
      const limit = frameMs > 0 ? frameMs * GPU_PLAUSIBLE : Infinity; // lần hỏi đầu (hay không có mốc): chưa có trần
      askedAt = now;
      frames = 0;
      const withCompute = computes > 0;
      computes = 0;
      Promise.all([
        renderer.resolveTimestampsAsync('render'),
        withCompute ? renderer.resolveTimestampsAsync('compute') : 0,
      ])
        .then(([render, compute]) => {
          if (dead) return;
          const ms = render + (compute ?? 0);
          // Số vô lý (0, âm, NaN, vô cực, undefined khi pool chưa có, hay lâu hơn hẳn nhịp khung): bỏ mẫu đó.
          if (!(render > 0) || !Number.isFinite(ms) || ms > limit) {
            fail();
            return;
          }
          failures = 0;
          last = ms;
          onSample(ms);
        }, fail)
        .finally(() => {
          pending = false;
        });
    },
    /** ms GPU của mẫu gần nhất (null khi chưa có, hay khi đã thôi đo). */
    get ms() {
      return last;
    },
    /** Máy này đo được ms GPU: đã có ít nhất một mẫu hợp lệ, và chưa phải thôi đo. */
    get available() {
      return tracking() && last !== null;
    },
    dispose() {
      dead = true;
    },
  };
}
```

Áp vào `src/engine/gpu/stage.js`:

```diff
diff --git a/src/engine/gpu/stage.js b/src/engine/gpu/stage.js
index 94a75a8..66357a1 100644
--- a/src/engine/gpu/stage.js
+++ b/src/engine/gpu/stage.js
@@ -18,7 +18,9 @@ import { breathAmplitude, breathOffset } from './breath.js';
  */
 export async function createStage({ tier, flags, parent, clearColor, reducedMotion = false, win = window }) {
   // WebGPURenderer chỉ quyết định lùi về WebGL2 BÊN TRONG init(); forceWebGL ép tầng B ngay từ đầu.
-  const renderer = new WebGPURenderer({ antialias: false, forceWebGL: tier === 'webgl2' });
+  // trackTimestamp: đo thời gian GPU (gpu-timer.js). Bật từ lúc tạo, vì WebGPU chỉ kiểm tính năng 'timestamp-query' lúc
+  // init: máy không có thì three tự tắt cờ, không báo lỗi validation mỗi khung (Phụ lục A.40, khác A.21).
+  const renderer = new WebGPURenderer({ antialias: false, forceWebGL: tier === 'webgl2', trackTimestamp: true });
   await renderer.init();
   // Backend THẬT, chỉ đáng tin sau init(): three có thể lặng lẽ lùi về WebGL2. Huy hiệu dùng giá trị này.
   const backend = renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl2';
```

Run: `npx vitest run tests/unit/gpu-timer.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  599 passed`.

```bash
git add src/engine/gpu/gpu-timer.js src/engine/gpu/stage.js tests/unit/gpu-timer.test.js
git commit -F - <<'EOF'
feat(engine): đo ms GPU mỗi khung (gpu-timer.js: render + compute, không hỏi chồng, hỏng 3 lần thì thôi); renderer bật trackTimestamp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Nối đo GPU vào cảnh; số đo của bàn thợ (`engine/gpu/meter.js`)

**Mục tiêu:** Spec §10, §8.4 (`Studio.stats`, `quality()`), §9.
- **Cảnh** (`scene.js`):
  - dựng gpu-timer; mỗi mẫu vào bộ điều chỉnh (`quality.gpu`) và bàn thợ (`studio.gpu`); `onStop` gọi `studio.gpu(null)`, để Sổ tay về "—";
  - `step` gọi `timer.poll(ms)` sau `render()`, rồi đưa ms CPU của khung cho bộ điều chỉnh (`quality.cpu`);
  - `createQuality` gom tuner, thang nấc và timer: `state()` có `gpu` (máy đo được) và `locked` (id các nấc bị khóa, đọc qua `ladder.idAt`);
  - bộ điều chỉnh chỉ bắt đầu đo từ lúc `live` (`quality.start()` trong `run.js`), không tính khung ẩn và lúc hòa dần.
- **Số đo của bàn thợ** tách sang `gpu/meter.js` (studio.js đã gần trần 250 dòng): draw call, tam giác, ms, ms CPU, và **ms GPU** (null tới khi có mẫu). Hai bên "Tắt / Bật" của thí nghiệm `compare` có thêm `gpuMs`. Mẫu GPU về trong 0,25 s sau mỗi lần đổi bị bỏ, vì có thể là mẫu của khung trước lúc đổi.
- **`__sma`**: `sma.js#studioApi(getStudio)` dựng các hàm của bàn thợ, để `run.js` gọn.

**Files:**
- Create: `src/engine/gpu/meter.js`
- Modify: `src/engine/contracts/runtime.js`, `src/engine/gpu/ladder.js`, `src/engine/gpu/run.js`, `src/engine/gpu/scene.js`, `src/engine/gpu/studio.js`, `src/engine/sma.js`
- Test: `tests/unit/ladder.test.js`, `tests/unit/scene.test.js`, `tests/unit/sma.test.js`, `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: `createTuner` (Task 2), `createGpuTimer` (Task 4).
- Produces:
  - `COMPARE_SKIP_MS = 250`; `createMeter(compareKeys) → { stats(), measure(info, wallMs, cpuMs), gpu(ms | null), toggled(key, on), compare(key) }`;
  - `stats() → { drawCalls, triangles, ms, cpuMs, gpuMs: number | null }`; `compare(key) → { off, on }`, mỗi bên `{ ms, cpuMs, gpuMs }` hay `null`;
  - `ladder.idAt(index) → string`;
  - `studio.gpu(ms | null)`; `studio.quality() → { level, steps, guarding, capped, gpu, locked: string[] }`;
  - `studioApi(getStudio)` trong `sma.js`: layers, setWeight, snapshot, restore, quality, degrade, upgrade, stats.

- [ ] **Step 1: Test (hỏng: chưa có `meter.js`, cảnh chưa nối gpu-timer)**

Áp vào `tests/unit/ladder.test.js`:

```diff
diff --git a/tests/unit/ladder.test.js b/tests/unit/ladder.test.js
index c4ed8bc..c4a1159 100644
--- a/tests/unit/ladder.test.js
+++ b/tests/unit/ladder.test.js
@@ -61,6 +61,8 @@ describe('createLadder', () => {
     while (ladder.down());
     expect(log).toEqual(['+phu-bong.bloom', '+mat-nuoc.phan-chieu']);
     expect(ladder.ids()).toEqual(['phu-bong.bloom', 'mat-nuoc.phan-chieu']);
+    // Bộ điều chỉnh nói nấc bị khóa bằng chỉ số trong thang: đổi ra id cho __sma.quality().locked.
+    expect([ladder.idAt(1), ladder.idAt(5)]).toEqual(['mat-nuoc.phan-chieu', null]);
   });
 
   it('áp và gỡ như ngăn xếp; hết thang hay hết nấc thì trả false; reset gỡ hết theo thứ tự ngược', () => {
```

Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 39cd946..72b4ffa 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -141,6 +141,7 @@ describe('buildScene', () => {
 
   it('bộ điều chỉnh: 40 fps thì hạ nấc dpr, huy hiệu được báo; thanh lớp mở (guard) thì chậm vừa phải không hạ nữa', () => {
     const { scene, stage } = build();
+    scene.quality.start();
     const seen = [];
     scene.quality.onChange((q) => seen.push(q.steps.length));
     let ms = 0;
@@ -155,6 +156,52 @@ describe('buildScene', () => {
     expect(scene.studio.quality().steps.slice(0, 2)).toEqual(['dpr=1.75', 'dpr=1.5']);
   });
 
+  it('bộ điều chỉnh chỉ đo từ lúc live (run.js gọi start() sau hòa dần): trước đó 40 fps cũng không hạ', () => {
+    const { scene, stage } = build();
+    let ms = 0;
+    for (let i = 0; i < 400; i++) scene.step((ms += 25)); // 10 giây chưa live (khung ẩn, hòa dần)
+    expect(stage.setDpr.mock.calls).toEqual([[2]]);
+    scene.quality.start();
+    for (let i = 0; i < 280; i++) scene.step((ms += 25));
+    expect(scene.studio.quality().steps).toEqual(['dpr=1.75']);
+  });
+
+  it('ms GPU (GĐ 4): mẫu của gpu-timer vào số đo và bộ điều chỉnh (khóa 30 fps mà GPU nhàn: không hạ); quality() có gpu', async () => {
+    const { scene, stage } = build();
+    stage.renderer.backend = { trackTimestamp: true };
+    stage.renderer.info.compute = { frameCalls: 0 };
+    stage.renderer.resolveTimestampsAsync.mockImplementation(async () => 5); // GPU chỉ bận 5 ms mỗi khung
+    scene.quality.start();
+    expect(scene.studio.quality()).toMatchObject({ gpu: false, locked: [] });
+    let ms = 0;
+    for (let i = 0; i < 240; i++) {
+      scene.step((ms += 2 * 1000 / 60)); // nhịp 33 ms như bị khóa 30 fps
+      await Promise.resolve(); // để kết quả của gpu-timer về
+      await Promise.resolve();
+    }
+    expect(scene.studio.stats().gpuMs).toBe(5);
+    // Nhịp 33 ms mà máy nhàn: trình duyệt khóa nhịp. Đường nhịp (GĐ 3) sẽ hạ nấc ở giây thứ 6; đường tải thì không.
+    expect(scene.studio.quality()).toMatchObject({ gpu: true, capped: true, steps: [] });
+    expect(stage.renderer.resolveTimestampsAsync).toHaveBeenCalledWith('render');
+  });
+
+  it('GPU báo số chồng nhau (160 ms mỗi khung ở 60 khung/giây, GPU Apple): thôi đo, Sổ tay "—", bộ điều chỉnh theo nhịp', async () => {
+    const { scene, stage } = build();
+    stage.renderer.backend = { trackTimestamp: true };
+    stage.renderer.info.compute = { frameCalls: 0 };
+    stage.renderer.resolveTimestampsAsync.mockImplementation(async () => 160);
+    scene.quality.start();
+    let ms = 0;
+    for (let i = 0; i < 20; i++) {
+      scene.step((ms += 1000 / 60));
+      await Promise.resolve();
+      await Promise.resolve();
+    }
+    expect(scene.studio.stats().gpuMs).toBeNull();
+    expect(scene.studio.quality()).toMatchObject({ gpu: false, steps: [] });
+    expect(stage.renderer.resolveTimestampsAsync.mock.calls.length).toBeLessThanOrEqual(4); // lần đầu + 3 lần vô lý
+  });
+
   it('?freeze: không có bộ điều chỉnh (ảnh tất định); hạ/nâng tay vẫn được, rồi vẽ lại', async () => {
     const { scene, stage, flush, renders } = build({ flags: { freeze: 10 } });
     let ms = 0;
```

Áp vào `tests/unit/sma.test.js`:

```diff
diff --git a/tests/unit/sma.test.js b/tests/unit/sma.test.js
index c1030e8..8ecb574 100644
--- a/tests/unit/sma.test.js
+++ b/tests/unit/sma.test.js
@@ -1,6 +1,6 @@
 // tests/unit/sma.test.js — window.__sma: bảng trạng thái công khai của trang
 import { describe, it, expect } from 'vitest';
-import { createSma } from '../../src/engine/sma.js';
+import { createSma, studioApi } from '../../src/engine/sma.js';
 
 const INITIAL = { state: 'poster', tier: null, backend: null, level: null, frames: 0, reason: null, error: null };
 
@@ -49,3 +49,20 @@ describe('sma.expose (GĐ 2)', () => {
     expect(sma.snapshot).toBeUndefined();
   });
 });
+
+describe('studioApi (GĐ 4): các hàm của bàn thợ mà __sma lộ ra', () => {
+  it('luôn đọc bàn thợ HIỆN TẠI; chưa có bàn thợ (mất GPU) thì trả null hay mảng rỗng, không ném', async () => {
+    let studio = null;
+    const api = studioApi(() => studio);
+    expect([api.layers(), api.snapshot(), api.quality(), api.stats(), api.setWeight('x', 0)]).toEqual([[], null, null, null, undefined]);
+    studio = {
+      layers: () => [{ id: 'cot', name: 'Cốt', knobs: [] }],
+      weight: () => ({ value: 1, target: 1 }),
+      stats: () => ({ gpuMs: 4 }),
+      quality: () => ({ gpu: true, locked: ['dpr=1.5'] }),
+    };
+    expect(api.layers()).toEqual([{ id: 'cot', name: 'Cốt', weight: 1 }]);
+    expect(api.stats().gpuMs).toBe(4);
+    expect(api.quality().locked).toEqual(['dpr=1.5']);
+  });
+});
```

Áp vào `tests/unit/studio.test.js`:

```diff
diff --git a/tests/unit/studio.test.js b/tests/unit/studio.test.js
index 8b743f5..63abb40 100644
--- a/tests/unit/studio.test.js
+++ b/tests/unit/studio.test.js
@@ -96,7 +96,7 @@ describe('createStudio', () => {
     expect(studio.readouts('lop-hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }, { id: 'ten', value: 'x', unit: '' }]);
     const info = { render: { drawCalls: 21, triangles: 90000 } };
     studio.measure(info, 1000, 4);
-    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0, cpuMs: 4 });
+    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0, cpuMs: 4, gpuMs: null });
     studio.measure(info, 1016, 4);
     expect(studio.stats().ms).toBe(16);
     studio.measure(info, 1052, 14);
@@ -115,16 +115,43 @@ describe('createStudio', () => {
     frames(10, 16, 2); // 160 ms đầu: còn trong khoảng bỏ qua
     expect(studio.compare('lop-hai', 'so').off).toBeNull();
     frames(20, 16, 2);
-    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 2 });
+    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 2, gpuMs: null });
     await studio.toggleExperiment('lop-hai', 'so', true);
     frames(7, 33, 9); // vừa bật: 231 ms đầu vẫn bị bỏ qua
     expect(studio.compare('lop-hai', 'so').on).toBeNull();
     frames(20, 33, 9);
-    expect(studio.compare('lop-hai', 'so')).toEqual({ off: { ms: 16, cpuMs: 2 }, on: { ms: 33, cpuMs: 9 } });
+    expect(studio.compare('lop-hai', 'so')).toEqual({ off: { ms: 16, cpuMs: 2, gpuMs: null }, on: { ms: 33, cpuMs: 9, gpuMs: null } });
     expect(studio.compare('lop-hai', 'pha')).toEqual({ off: null, on: null });
     expect(() => studio.compare('lop-hai', 'khac')).toThrow('Lớp "lop-hai" không có thí nghiệm "khac"');
   });
 
+  it('ms GPU (GĐ 4): null tới khi có mẫu; compare ghi vào bên đang đo, bỏ mẫu về trong 0,25 s sau lần đổi', async () => {
+    const { studio } = setup();
+    const info = { render: { drawCalls: 1, triangles: 1 } };
+    let t = 0;
+    const frames = (n, gap, gpu) => {
+      for (let i = 0; i < n; i++) {
+        studio.measure(info, (t += gap), 1);
+        if (gpu !== undefined && i % 4 === 0) studio.gpu(gpu); // mẫu GPU về thưa hơn khung
+      }
+    };
+    expect(studio.stats().gpuMs).toBeNull();
+    frames(30, 16, 5);
+    expect(studio.stats().gpuMs).toBe(5);
+    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 1, gpuMs: 5 });
+    await studio.toggleExperiment('lop-hai', 'so', true);
+    studio.measure(info, (t += 16), 1); // khung đầu sau lần đổi đặt mốc bỏ qua
+    studio.gpu(40); // mẫu của khung TRƯỚC lúc đổi, về muộn: không ghi vào bên "Bật"
+    frames(20, 16, 12);
+    const { off, on } = studio.compare('lop-hai', 'so');
+    expect(off.gpuMs).toBe(5);
+    expect(on.gpuMs).toBeCloseTo(12, 6);
+    expect(studio.stats().gpuMs).toBeGreaterThan(5);
+    studio.gpu(null); // đo GPU hỏng giữa phiên (gpu-timer thôi đo): Sổ tay về "—", cột so sánh giữ số đã đo
+    expect(studio.stats().gpuMs).toBeNull();
+    expect(studio.compare('lop-hai', 'so').on.gpuMs).toBeCloseTo(12, 6);
+  });
+
   it('nấc: quality() đọc bộ điều chỉnh; degrade()/upgrade() hạ/nâng tay một nấc rồi vẽ lại; thiếu bộ điều chỉnh thì không có gì', async () => {
     const steps = [];
     const listeners = [];
@@ -149,7 +176,7 @@ describe('createStudio', () => {
     studio.onQuality(cb);
     expect(listeners).toEqual([cb]);
     const bare = setup().studio;
-    expect(bare.quality()).toEqual({ level: null, steps: [], guarding: false, capped: false });
+    expect(bare.quality()).toEqual({ level: null, steps: [], guarding: false, capped: false, gpu: false, locked: [] });
     expect(await bare.degrade()).toBe(false);
   });
```

Run: `npx vitest run tests/unit/ladder.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js`
Kết quả mong đợi: FAIL, 10 test hỏng; lỗi đầu tiên: `TypeError: ladder.idAt is not a function`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/meter.js`:

```js
// engine/gpu/meter.js — số đo của xưởng cho Sổ tay và __sma: draw call, tam giác, ms khung, ms CPU, ms GPU; tách theo trạng thái của thí nghiệm 'compare'.

/** Sau mỗi lần bật/tắt thí nghiệm 'compare', bỏ chừng này ms đầu (còn biên dịch, còn dựng) rồi mới ghi số đo. */
export const COMPARE_SKIP_MS = 250;
const ema = (prev, v) => prev * 0.9 + v * 0.1; // trung bình trượt: số mới góp 10%

/**
 * Bàn thợ (studio.js) giữ một bộ đo. scene.js đưa số vào: measure() cuối mỗi khung, gpu() mỗi khi gpu-timer có mẫu
 * (mẫu GPU về trễ vài khung). Thí nghiệm 'compare' có hai bên "Tắt / Bật": số đo ghi vào bên đang bật, bỏ 0,25 s đầu sau
 * mỗi lần đổi. Một mẫu GPU về trong khoảng bỏ qua đó có thể là của khung trước lúc đổi, nên cũng bị bỏ.
 * @param {string[]} [compareKeys]  'layerId.expId' của mọi thí nghiệm 'compare'
 */
export function createMeter(compareKeys = []) {
  const stats = { drawCalls: 0, triangles: 0, ms: 0, cpuMs: 0, gpuMs: null };
  let lastWall = null;
  // side: bên đang đo; fresh: vừa đổi, lần đo tới đặt mốc bỏ qua.
  const compares = new Map(compareKeys.map((key) => [key, { side: 'off', off: null, on: null, fresh: true, skipUntil: 0 }]));
  const settled = (c) => !c.fresh && lastWall !== null && lastWall >= c.skipUntil;

  return {
    /** Số đo của khung vừa vẽ: draw call, tam giác, ms giữa hai khung, ms CPU, ms GPU (trung bình trượt; null: chưa đo được). */
    stats: () => ({ ...stats }),
    /**
     * Cuối mỗi khung. `info` là renderer.info (three tự reset đầu mỗi khung của vòng lặp), `wallMs` là đồng hồ tường:
     * ms đo khung thật, kể cả khi ?freeze giữ đồng hồ của cảnh ở 1/60 s. `cpuMs`: luồng chính bận bao lâu cho khung đó;
     * ms giữa hai khung bị khóa theo nhịp màn hình, còn ms CPU lộ ngay phần việc của JS.
     */
    measure(info, wallMs, cpuMs = 0) {
      stats.drawCalls = info.render.drawCalls;
      stats.triangles = info.render.triangles;
      stats.cpuMs = stats.cpuMs === 0 ? cpuMs : ema(stats.cpuMs, cpuMs);
      if (lastWall !== null) {
        const dt = wallMs - lastWall;
        stats.ms = stats.ms === 0 ? dt : ema(stats.ms, dt);
        for (const c of compares.values()) {
          if (c.fresh) {
            c.fresh = false;
            c.skipUntil = wallMs + COMPARE_SKIP_MS;
          }
          if (wallMs < c.skipUntil) continue;
          const prev = c[c.side];
          c[c.side] = prev ? { ...prev, ms: ema(prev.ms, dt), cpuMs: ema(prev.cpuMs, cpuMs) } : { ms: dt, cpuMs, gpuMs: null };
        }
      }
      lastWall = wallMs;
    },
    /** Một mẫu ms GPU (gpu-timer.js); null khi máy thôi đo được giữa phiên: Sổ tay về "—" (cột so sánh giữ số đã đo). */
    gpu(ms) {
      if (ms === null) {
        stats.gpuMs = null;
        return;
      }
      stats.gpuMs = stats.gpuMs === null ? ms : ema(stats.gpuMs, ms);
      for (const c of compares.values()) {
        const side = c[c.side];
        if (side && settled(c)) side.gpuMs = side.gpuMs === null ? ms : ema(side.gpuMs, ms);
      }
    },
    /** Thí nghiệm 'compare' vừa đổi trạng thái: số đo sau đây ghi vào bên mới, bỏ 0,25 s đầu. */
    toggled(key, on) {
      const c = compares.get(key);
      if (!c) return;
      c.side = on ? 'on' : 'off';
      c.fresh = true;
    },
    /** { off, on }, mỗi bên { ms, cpuMs, gpuMs } hay null khi chưa đo. Thí nghiệm không phải 'compare' thì cả hai là null. */
    compare(key) {
      const c = compares.get(key);
      return { off: c?.off ? { ...c.off } : null, on: c?.on ? { ...c.on } : null };
    },
  };
}
```

Áp vào `src/engine/gpu/studio.js`:

```diff
diff --git a/src/engine/gpu/studio.js b/src/engine/gpu/studio.js
index 95673f9..f9e6b78 100644
--- a/src/engine/gpu/studio.js
+++ b/src/engine/gpu/studio.js
@@ -1,18 +1,15 @@
 // engine/gpu/studio.js — bàn thợ: gom trọng số, núm, thí nghiệm, số đo và nấc chất lượng thành MỘT API cho Sổ tay và __sma.
 import { knobMax } from './knob-set.js';
 import { TWEEN_SECONDS } from './layers.js';
-
-/** Sau mỗi lần bật/tắt thí nghiệm 'compare', bỏ chừng này ms đầu (còn biên dịch, còn dựng) rồi mới ghi số đo. */
-export const COMPARE_SKIP_MS = 250;
+import { createMeter } from './meter.js';
 
 /** Cảnh không có bộ điều chỉnh (test, bức cũ): nấc không có gì để hạ. */
 const NO_QUALITY = Object.freeze({
-  state: () => ({ level: null, steps: [], guarding: false, capped: false }),
+  state: () => ({ level: null, steps: [], guarding: false, capped: false, gpu: false, locked: [] }),
   degrade: () => false,
   upgrade: () => false,
   onChange: () => () => {},
 });
-const ema = (prev, v) => prev * 0.9 + v * 0.1; // trung bình trượt: khung mới góp 10%
 
 /**
  * Sổ tay (ui/) không được import engine/ hay three: nó chỉ thấy object này. Mọi thay đổi đi qua đây:
@@ -31,20 +28,16 @@ const ema = (prev, v) => prev * 0.9 + v * 0.1; // trung bình trượt: khung m
  * @param {number} [p.tweenSeconds]                    0 khi người xem xin giảm chuyển động
  * @param {{ state: () => object, degrade: () => boolean, upgrade: () => boolean, onChange: (cb: Function) => Function }} [p.quality]
  *   bộ điều chỉnh của cảnh (scene.js): mức, nấc đang hạ, hạ/nâng tay một nấc
+ * @returns {ReturnType<typeof createMeter> & object}  measure() và gpu() của bộ đo: scene.js đưa số vào mỗi khung
  */
 export function createStudio({ meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY }) {
   const byId = new Map(layers.map((b) => [b.id, b]));
   const names = new Map(meta.layers.map((l) => [l.id, l.name]));
   const experimentsOn = new Set(); // 'layerId.expId' đang bật
-  const stats = { drawCalls: 0, triangles: 0, ms: 0, cpuMs: 0 };
-  let lastWall = null;
-  // Thí nghiệm 'compare': số đo riêng cho lúc tắt (off) và lúc bật (on). fresh = vừa đổi, lần đo tới đặt mốc bỏ qua.
-  const compares = new Map();
-  for (const { id, layer } of layers) {
-    for (const e of layer.experiments ?? []) {
-      if (e.kind === 'compare') compares.set(`${id}.${e.id}`, { off: null, on: null, fresh: true, skipUntil: 0 });
-    }
-  }
+  // Thí nghiệm 'compare': bộ đo ghi số riêng cho lúc tắt (off) và lúc bật (on).
+  const meter = createMeter(layers.flatMap(({ id, layer }) => (layer.experiments ?? [])
+    .filter((e) => e.kind === 'compare')
+    .map((e) => `${id}.${e.id}`)));
 
   const layerOf = (id) => {
     const built = byId.get(id);
@@ -117,53 +110,32 @@ export function createStudio({ meta, layers, weights, env, redraw = () => {}, tw
       await settle(() => exp.toggle(on));
       if (on) experimentsOn.add(`${layerId}.${expId}`);
       else experimentsOn.delete(`${layerId}.${expId}`);
-      const c = compares.get(`${layerId}.${expId}`);
-      if (c) c.fresh = true;
+      meter.toggled(`${layerId}.${expId}`, on);
     },
     /**
-     * Số đo của một thí nghiệm 'compare': { off, on }, mỗi bên { ms, cpuMs } (trung bình trượt), hay null khi chưa đo.
-     * Thí nghiệm kiểu khác thì cả hai là null.
+     * Số đo của một thí nghiệm 'compare': { off, on }, mỗi bên { ms, cpuMs, gpuMs } (trung bình trượt; gpuMs null khi máy
+     * không đo được), hay null khi chưa đo. Thí nghiệm kiểu khác thì cả hai là null.
      */
     compare(layerId, expId) {
       experimentOf(layerId, expId);
-      const c = compares.get(`${layerId}.${expId}`);
-      return { off: c?.off ? { ...c.off } : null, on: c?.on ? { ...c.on } : null };
+      return meter.compare(`${layerId}.${expId}`);
     },
 
     /** Số đo riêng của lớp, đọc ngay lúc gọi. */
     readouts(layerId) {
       return (layerOf(layerId).layer.readouts ?? []).map((r) => ({ id: r.id, value: r.get(), unit: r.unit ?? '' }));
     },
-    /** Số đo của xưởng, của khung vừa vẽ: draw call, tam giác, ms giữa hai khung và ms CPU (trung bình trượt). */
-    stats: () => ({ ...stats }),
+    /** Số đo của xưởng, của khung vừa vẽ: draw call, tam giác, ms giữa hai khung, ms CPU, ms GPU (null: máy không đo được). */
+    stats: meter.stats,
+    /** scene.js gọi cuối mỗi khung (xem meter.js). */
+    measure: meter.measure,
+    /** scene.js gọi mỗi khi gpu-timer có một mẫu ms GPU. */
+    gpu: meter.gpu,
+
     /**
-     * scene.js gọi cuối mỗi khung. `info` là renderer.info (three tự reset đầu mỗi khung của vòng lặp),
-     * `wallMs` là đồng hồ tường: ms đo khung thật, kể cả khi ?freeze giữ đồng hồ của cảnh ở 1/60 s.
-     * `cpuMs` là thời gian luồng chính làm khung đó (từ đầu step tới sau render): ms giữa hai khung bị khóa theo
-     * nhịp màn hình, còn ms CPU lộ ngay phần việc của JS.
+     * Bộ điều chỉnh: { level, steps: id các nấc đang hạ, guarding (Sổ tay mở: chỉ canh quá tải nặng), capped (nhịp bị khóa),
+     * gpu (máy đo được ms GPU: chẩn đoán theo tải), locked: id các nấc bị khóa chống dao động }.
      */
-    measure(info, wallMs, cpuMs = 0) {
-      stats.drawCalls = info.render.drawCalls;
-      stats.triangles = info.render.triangles;
-      stats.cpuMs = stats.cpuMs === 0 ? cpuMs : ema(stats.cpuMs, cpuMs);
-      if (lastWall !== null) {
-        const dt = wallMs - lastWall;
-        stats.ms = stats.ms === 0 ? dt : ema(stats.ms, dt);
-        for (const [key, c] of compares) {
-          if (c.fresh) {
-            c.fresh = false;
-            c.skipUntil = wallMs + COMPARE_SKIP_MS;
-          }
-          if (wallMs < c.skipUntil) continue;
-          const side = experimentsOn.has(key) ? 'on' : 'off';
-          const prev = c[side];
-          c[side] = prev ? { ms: ema(prev.ms, dt), cpuMs: ema(prev.cpuMs, cpuMs) } : { ms: dt, cpuMs };
-        }
-      }
-      lastWall = wallMs;
-    },
-
-    /** Bộ điều chỉnh: { level, steps: id các nấc đang hạ, guarding (Sổ tay mở: chỉ canh quá tải nặng), capped }. */
     quality: () => quality.state(),
     /** Hạ tay MỘT nấc (DevTools, e2e); false khi hết thang. Xong khi khung đã vẽ lại (nếu ?freeze đã dừng). */
     async degrade() {
```

Áp vào `src/engine/gpu/ladder.js`:

```diff
diff --git a/src/engine/gpu/ladder.js b/src/engine/gpu/ladder.js
index 9bbd540..bf929b1 100644
--- a/src/engine/gpu/ladder.js
+++ b/src/engine/gpu/ladder.js
@@ -55,6 +55,8 @@ export function createLadder({ ladder = ['dpr'], layers, stage, dpr }) {
     },
     /** Id các nấc đang áp, theo thứ tự đã áp: __sma.quality() và huy hiệu đọc. */
     ids: () => steps.slice(0, applied).map((s) => s.id),
+    /** Id của nấc thứ `index` trong thang (bộ điều chỉnh nói nấc bị khóa bằng chỉ số). */
+    idAt: (index) => steps[index]?.id ?? null,
     /** Áp nấc kế tiếp. false khi đã hết thang. */
     down() {
       if (applied >= steps.length) return false;
```

Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index 4bb1b60..c5f1e5e 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -1,6 +1,7 @@
 // engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
 import { budgetFor, isMobile, pickLevel } from '../quality.js';
 import { FRAME_BUDGET_MS, createTuner } from '../tuner.js';
+import { createGpuTimer } from './gpu-timer.js';
 import { createCtx, buildLayers, ensureEmissive } from './layers.js';
 import { createPipeline } from './pipeline.js';
 import { createLadder } from './ladder.js';
@@ -8,13 +9,24 @@ import { createStudio } from './studio.js';
 import { createInput } from './input.js';
 
 /**
- * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU).
+ * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU) + bộ đo GPU (gpu-timer).
  * tuner = null khi ?freeze: ảnh phải tất định, chỉ hạ/nâng tay (__sma) được.
  */
-function createQuality({ level, ladder, tuner }) {
+function createQuality({ level, ladder, tuner, timer }) {
   const listeners = new Set();
   let guarding = false;
-  const state = () => ({ level, steps: ladder.ids(), guarding, capped: tuner?.state().capped ?? false });
+  let live = false; // chỉ đo từ lúc live: khung ẩn và 0,9 giây hòa dần không phải nhịp thật của cảnh
+  const state = () => {
+    const t = tuner?.state();
+    return {
+      level,
+      steps: ladder.ids(),
+      guarding,
+      capped: t?.capped ?? false,
+      gpu: timer.available, // máy đo được ms GPU: bộ điều chỉnh chẩn đoán theo tải
+      locked: (t?.locked ?? []).map((i) => ladder.idAt(i)), // nấc bị khóa chống dao động: giữ tới khi tải lại trang
+    };
+  };
   const changed = () => {
     for (const cb of listeners) cb(state());
   };
@@ -30,11 +42,19 @@ function createQuality({ level, ladder, tuner }) {
     state,
     degrade: () => act('down'),
     upgrade: () => act('up'),
+    /** run.js gọi khi cảnh vừa live (sau hòa dần): từ đây bộ điều chỉnh mới đo. */
+    start() {
+      live = true;
+    },
     /** Mỗi khung, trước khi vẽ: bộ quyết định nói hạ / nâng / trả lại hết thì áp ngay. */
     sample(ms) {
+      if (!live) return;
       const action = tuner?.sample(ms, ladder);
       if (action) act(action);
     },
+    /** ms CPU của khung vừa vẽ, và mỗi mẫu ms GPU: "tải" của máy (tuner.js, đường tải). */
+    cpu: (ms) => tuner?.cpu(ms),
+    gpu: (ms) => tuner?.gpu(ms),
     /**
      * Thanh lớp mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên bộ điều chỉnh chỉ CANH:
      * chậm vừa phải thì để yên cho số đo trung thực, quá tải nặng thì vẫn hạ để máy không bị ép quá sức.
@@ -90,7 +110,16 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
   // Thang nấc dựng SAU pipeline: nấc của lớp dùng chung (bloom) chạm vào node mà pipeline vừa dựng.
   const ladder = createLadder({ ladder: painting.quality?.ladder, layers, stage, dpr: budget.dpr });
   const tuner = flags.freeze ? null : createTuner({ budgetMs: mobile ? FRAME_BUDGET_MS.mobile : FRAME_BUDGET_MS.desktop });
-  const quality = createQuality({ level, ladder, tuner });
+  // ms GPU thật (máy nào đo được): cho bộ điều chỉnh chẩn đoán theo tải, và cho số đo của Sổ tay.
+  const timer = createGpuTimer(stage.renderer, {
+    onSample: (ms) => {
+      quality.gpu(ms);
+      studio.gpu(ms);
+    },
+    onStop: () => studio.gpu(null), // đo hỏng giữa phiên: Sổ tay về "—", bộ điều chỉnh tự về đường nhịp
+  });
+  disposer.add(() => timer.dispose());
+  const quality = createQuality({ level, ladder, tuner, timer });
 
   // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
   const input = createInput({ canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win });
@@ -135,7 +164,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     quality,
     /** Biên dịch trước với đúng render target + MRT của pass, trong lúc poster còn hiện. */
     compile: () => pipeline.compile(),
-    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → render → số đo. */
+    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → render → ms GPU → số đo. */
     step(ms) {
       const start = win.performance.now();
       quality.sample(ms ?? start);
@@ -147,8 +176,10 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
       stage.breathe(t);
       stage.controls?.update();
       pipeline.render();
+      timer.poll(ms ?? start); // hỏi ms GPU của các khung trước, không chờ
       const end = win.performance.now();
       studio.measure(stage.renderer.info, end, end - start); // ms CPU: luồng chính bận bao lâu cho khung này
+      quality.cpu(end - start);
     },
     /** run.js gọi khi vòng lặp dừng ở khung N của ?freeze=N. */
     freeze() {
```

Áp vào `src/engine/gpu/run.js`:

```diff
diff --git a/src/engine/gpu/run.js b/src/engine/gpu/run.js
index 8ee254a..7aee607 100644
--- a/src/engine/gpu/run.js
+++ b/src/engine/gpu/run.js
@@ -1,5 +1,6 @@
 // engine/gpu/run.js — Vòng đời một bức ở tầng 3D: dựng → compileAsync → khung ẩn → hòa dần → chạy; mất GPU lần đầu thì dựng lại.
 import { mergePalette } from '../palette.js';
+import { studioApi } from '../sma.js';
 import { withDeadline, DeadlineError } from '../deadline.js';
 import { createStage } from './stage.js';
 import { createDisposer } from './disposer.js';
@@ -156,6 +157,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     shell.showBadge({ tier: stage.backend, level: scene.level });
     studio = scene.studio;
     quality = scene.quality;
+    quality.start(); // bộ điều chỉnh đo từ lúc live: khung ẩn và lúc hòa dần không tính
     d.add(() => {
       studio = null;
       quality = null;
@@ -164,16 +166,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     d.add(scene.quality.onChange((q) => shell.showBadge({ tier: stage.backend, level: q.level, steps: q.steps.length })));
     if (workshop?.isOpen) scene.quality.guard(true);
     // DevTools: __sma.setWeight('<id lớp>', 0) mài một lớp, __sma.degrade() hạ một nấc; e2e so ảnh ở cùng một khung.
-    d.add(sma.expose({
-      layers: () => studio?.layers().map(({ id, name }) => ({ id, name, weight: studio.weight(id).value })) ?? [],
-      setWeight: (id, v) => studio?.setWeight(id, v),
-      snapshot: () => studio?.snapshot() ?? null,
-      restore: (s) => studio?.restore(s),
-      quality: () => studio?.quality() ?? null,
-      degrade: () => studio?.degrade(),
-      upgrade: () => studio?.upgrade(),
-      stats: () => studio?.stats() ?? null,
-    }));
+    d.add(sma.expose(studioApi(() => studio)));
     // Gợi ý của bức ("Chạm vào…") chỉ lúc mở trang; lần chạm đầu tiên đổi thành lời mời mài lớp.
     if (!snapshot && content?.hint) shell.showHint(content.hint);
     if (!workshop) scene.input.onFirst(() => shell.invite(openWorkshop));
```

Áp vào `src/engine/sma.js`:

```diff
diff --git a/src/engine/sma.js b/src/engine/sma.js
index eaca1ab..5fc2efb 100644
--- a/src/engine/sma.js
+++ b/src/engine/sma.js
@@ -8,7 +8,7 @@
  * GĐ 2: khi cảnh đã live, `expose()` gắn thêm các hàm của bàn thợ: `layers()`, `setWeight(id, v)`,
  * `snapshot()`, `restore(s)`. Mở DevTools gõ `__sma.setWeight('<id lớp>', 0)` là mài được một lớp.
  * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
- * (draw call, tam giác, ms mỗi khung, ms CPU).
+ * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu` và `quality().locked`.
  *
  * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
  * @param {Window | Record<string, any>} win
@@ -46,3 +46,23 @@ export function createSma(win) {
   win.__sma = sma;
   return sma;
 }
+
+/**
+ * Các hàm của bàn thợ mà window.__sma lộ ra (DevTools, e2e). Luôn đọc bàn thợ HIỆN TẠI qua getStudio(): "Dựng lại cảnh"
+ * thay bàn thợ mới, và lúc mất GPU thì chưa có bàn thợ nào (hàm trả null, hay không làm gì).
+ * @param {() => any} getStudio  bàn thợ của cảnh đang live (engine/gpu/studio.js), hay null
+ * @returns {Record<string, Function>}  truyền thẳng vào sma.expose()
+ */
+export function studioApi(getStudio) {
+  const s = getStudio;
+  return {
+    layers: () => s()?.layers().map(({ id, name }) => ({ id, name, weight: s().weight(id).value })) ?? [],
+    setWeight: (id, v) => s()?.setWeight(id, v),
+    snapshot: () => s()?.snapshot() ?? null,
+    restore: (snap) => s()?.restore(snap),
+    quality: () => s()?.quality() ?? null,
+    degrade: () => s()?.degrade(),
+    upgrade: () => s()?.upgrade(),
+    stats: () => s()?.stats() ?? null,
+  };
+}
```

Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 17cc2e2..0a9a097 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -150,6 +150,8 @@
 /** Trạng thái tác phẩm dạng JSON (spec §16): trọng số và núm khác mặc định; GĐ 4 thêm dials.
  * @typedef {{ weights: Record<string, number>, knobs: Record<string, any> }} Snapshot   [2] khóa núm là 'layerId.knobId'
  */
+/** Một bên của thí nghiệm 'compare' [3]: trung bình trượt. [4] gpuMs: null khi máy không đo được thời gian GPU.
+ * @typedef {{ ms: number, cpuMs: number, gpuMs: number | null }} CompareSide */
 /** Bàn thợ [2] (engine/gpu/studio.js): API DUY NHẤT mà Sổ tay (ui/) và __sma thấy. Không có ở tầng tĩnh.
  * @typedef {Object} Studio
  * @property {() => { id: string, name: string, knobs: object[], experiments: { id: string, kind: string }[], readouts: { id: string, unit: string }[] }[]} layers
@@ -160,13 +162,15 @@
  * @property {(layerId: string, expId: string) => boolean} experiment
  * @property {(layerId: string, expId: string, on: boolean) => Promise<void>} toggleExperiment
  * @property {(layerId: string) => { id: string, value: number | string, unit: string }[]} readouts
- * @property {() => { drawCalls: number, triangles: number, ms: number, cpuMs: number }} stats   số của khung vừa vẽ ([3] cpuMs)
+ * @property {() => { drawCalls: number, triangles: number, ms: number, cpuMs: number, gpuMs: number | null }} stats
+ *   số của khung vừa vẽ ([3] cpuMs; [4] gpuMs: null khi máy không đo được thời gian GPU)
  * @property {() => Snapshot} snapshot
  * @property {(s: Snapshot) => Promise<void>} restore
- * @property {(layerId: string, expId: string) => { off: { ms: number, cpuMs: number } | null, on: { ms: number, cpuMs: number } | null }} compare
+ * @property {(layerId: string, expId: string) => { off: CompareSide | null, on: CompareSide | null }} compare
  *   [3] số đo của một thí nghiệm 'compare' theo từng trạng thái (null: chưa đo; thí nghiệm kiểu khác thì luôn null)
- * @property {() => { level: string | null, steps: string[], guarding: boolean, capped: boolean }} quality
- *   [3] bộ điều chỉnh: mức, id các nấc đang hạ, đang canh (Sổ tay mở: chỉ hạ khi quá tải nặng), có đang coi là nhịp bị khóa
+ * @property {() => { level: string | null, steps: string[], guarding: boolean, capped: boolean, gpu: boolean, locked: string[] }} quality
+ *   [3] bộ điều chỉnh: mức, id các nấc đang hạ, đang canh (Sổ tay mở: chỉ hạ khi quá tải nặng), có đang coi là nhịp bị khóa;
+ *   [4] gpu: máy đo được ms GPU (chẩn đoán theo tải); locked: id các nấc bị khóa chống dao động (giữ tới khi tải lại trang)
  * @property {() => Promise<boolean>} degrade   [3] hạ tay MỘT nấc (DevTools, e2e); false khi hết thang
  * @property {() => Promise<boolean>} upgrade   [3] nâng tay MỘT nấc; false khi không còn nấc nào
  * @property {(cb: (q: object) => void) => () => void} onQuality   [3] báo mỗi lần nấc đổi; trả hàm bỏ nghe
```

Run: `npx vitest run tests/unit/ladder.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  604 passed`.

```bash
git add src/engine/contracts/runtime.js src/engine/gpu/ladder.js src/engine/gpu/meter.js src/engine/gpu/run.js src/engine/gpu/scene.js src/engine/gpu/studio.js src/engine/sma.js tests/unit/ladder.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js
git commit -F - <<'EOF'
feat(engine): nối đo GPU vào cảnh (bộ điều chỉnh đo từ lúc live, tải = ms GPU/CPU), bàn thợ có ms GPU (meter.js), quality() có gpu và locked

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Sổ tay và huy hiệu: ms GPU, cột GPU, nấc bị khóa

**Mục tiêu:** Spec §4.1.
- **Sổ tay:**
  - có dòng "Mili giây GPU mỗi khung". Máy không đo được (`gpuMs` null) thì dòng đó ghi "—" kèm câu `t.notebook.gpuMissing`, nói cả trường hợp GPU Apple;
  - "Tắt / Bật" có ba thanh: ms, ms CPU, ms GPU.
  - `notebook-pages.js#measureList` dùng chung cho mọi trang.
- **Huy hiệu:** có nấc bị khóa chống dao động thì lời giải thích nói đúng như vậy (`t.badge.lockedExplain`, `data-locked`): nấc đó giữ tới khi tải lại trang. Không hứa điều bộ điều chỉnh không làm.

**Files:**
- Modify: `src/engine/gpu/run.js`, `src/styles/notebook.css`, `src/ui/badge.js`, `src/ui/notebook-pages.js`, `src/ui/notebook.js`, `src/ui/strings.vi.js`
- Test: `tests/unit/badge.test.js`, `tests/unit/workshop.test.js`

**Interfaces:**
- Consumes: `studio.stats().gpuMs`, `studio.compare(…).{off,on}.gpuMs`, `studio.quality().locked` (Task 5).
- Produces: `shell.showBadge({ …, locked })`; `t.notebook.readouts.gpuMs`, `t.notebook.gpuMissing`, `t.notebook.compare.value(ms, cpu, gpu)`, `t.badge.lockedExplain`.

- [ ] **Step 1: Test (hỏng: chưa có dòng ms GPU, huy hiệu chưa biết nấc bị khóa)**

Áp vào `tests/unit/badge.test.js`:

```diff
diff --git a/tests/unit/badge.test.js b/tests/unit/badge.test.js
index 4368ac8..9b42b4f 100644
--- a/tests/unit/badge.test.js
+++ b/tests/unit/badge.test.js
@@ -39,6 +39,18 @@ describe('renderBadge', () => {
     expect(el.title).toBe(t.badge.explain.webgpu);
   });
 
+  it('có nấc bị khóa chống dao động (GĐ 4): lời giải thích nói thật là nấc đó giữ tới khi tải lại trang, không hứa chi tiết trở lại', () => {
+    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 3, locked: 1 }, t);
+    expect(el.textContent).toBe('WebGPU · cao · hạ 3 nấc');
+    expect(el.dataset.locked).toBe('1');
+    expect(el.title).toBe(`${t.badge.explain.webgpu} ${t.badge.lockedExplain(3, 1)}`);
+    expect(el.title).not.toContain(t.badge.stepsExplain(3));
+    // Hết nấc đang hạ (trả lại hết khi nhịp bị khóa) thì không còn gì để nói về khóa.
+    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 0, locked: 1 }, t);
+    expect(el.title).toBe(t.badge.explain.webgpu);
+    expect(el.dataset.locked).toBe('0');
+  });
+
   it('vẽ lại thì thay hẳn chữ cũ, không cộng dồn', () => {
     renderBadge(el, { tier: 'webgpu', level: 'cao' }, t);
     expect(el.textContent).toBe('WebGPU · cao');
```

Áp vào `tests/unit/workshop.test.js`:

```diff
diff --git a/tests/unit/workshop.test.js b/tests/unit/workshop.test.js
index 7178044..07ea409 100644
--- a/tests/unit/workshop.test.js
+++ b/tests/unit/workshop.test.js
@@ -51,8 +51,13 @@ function fakeStudio() {
     experiment: (layerId, id) => on.has(`${layerId}.${id}`),
     toggleExperiment: vi.fn(async (layerId, id, value) => (value ? on.add(`${layerId}.${id}`) : on.delete(`${layerId}.${id}`))),
     readouts: () => [{ id: 'dinh', value: 1234, unit: '' }],
-    stats: () => ({ drawCalls: 21, triangles: 90000, ms: 16.66, cpuMs: 3.21 }),
-    compare: (layerId, id) => (id === 'so' ? { off: { ms: 16.7, cpuMs: 2 }, on: { ms: 33.4, cpuMs: 9.5 } } : { off: null, on: null }),
+    gpuMs: 4.56,
+    stats() {
+      return { drawCalls: 21, triangles: 90000, ms: 16.66, cpuMs: 3.21, gpuMs: this.gpuMs };
+    },
+    compare: (layerId, id) => (id === 'so'
+      ? { off: { ms: 16.7, cpuMs: 2, gpuMs: 4 }, on: { ms: 33.4, cpuMs: 9.5, gpuMs: null } }
+      : { off: null, on: null }),
   };
 }
 
@@ -270,6 +275,27 @@ describe('Sổ tay', () => {
     expect(read('drawCalls')).toBe('21');
     expect(read('ms')).toBe('16,7');
     expect(read('cpuMs')).toBe('3,2');
+    expect(read('gpuMs')).toBe('4,6');
+    expect(notebook.querySelector('.nb-gpu-missing').hidden).toBe(true);
+    workshop.dispose();
+  });
+
+  it('Phá: máy không đo được ms GPU thì dòng đó ghi "—", kèm một câu giải thích (GĐ 4)', () => {
+    vi.useFakeTimers();
+    const studio = fakeStudio();
+    studio.gpuMs = null;
+    const { workshop, rail, notebook } = mount(studio);
+    workshop.open();
+    rail.querySelector('[data-layer="hai"] .rail-name').click();
+    notebook.querySelector('[data-tab="pha"]').click();
+    expect(notebook.querySelector('[data-readout="gpuMs"]').textContent).toBe('—');
+    const note = notebook.querySelector('.nb-gpu-missing');
+    expect(note.hidden).toBe(false);
+    expect(note.textContent).toBe(t.notebook.gpuMissing);
+    studio.gpuMs = 3; // mẫu GPU đầu tiên về muộn: số hiện ra, câu giải thích ẩn đi
+    vi.advanceTimersByTime(300);
+    expect(notebook.querySelector('[data-readout="gpuMs"]').textContent).toBe('3');
+    expect(note.hidden).toBe(true);
     workshop.dispose();
   });
 
@@ -321,10 +347,12 @@ describe('Sổ tay', () => {
     expect(bars).toHaveLength(1);
     expect(bars[0].previousElementSibling.dataset.experiment).toBe('so');
     const row = (side) => bars[0].querySelector(`[data-side="${side}"]`);
-    expect(row('off').textContent).toBe(`${t.notebook.compare.off}khung 16,7 ms · CPU 2 ms`);
+    expect(row('off').textContent).toBe(`${t.notebook.compare.off}khung 16,7 ms · CPU 2 ms · GPU 4 ms`);
+    // Bên "Bật" chưa có mẫu GPU (hay máy không đo được): không bịa số GPU.
     expect(row('on').querySelector('.nb-compare-value').textContent).toBe('khung 33,4 ms · CPU 9,5 ms');
-    const [frame, cpu] = row('off').querySelectorAll('.nb-bars i');
-    expect([frame.style.width, cpu.style.width]).toEqual(['50%', `${(2 / 9.5) * 100}%`]);
+    const [frame, cpu, gpu] = row('off').querySelectorAll('.nb-bars i');
+    expect([frame.style.width, cpu.style.width, gpu.style.width]).toEqual(['50%', `${(2 / 9.5) * 100}%`, '100%']);
+    expect(row('on').querySelectorAll('.nb-bars i')[2].style.width).toBe('0%');
     expect(row('on').querySelector('.nb-bars').getAttribute('aria-hidden')).toBe('true');
     workshop.dispose();
   });
```

Run: `npx vitest run tests/unit/badge.test.js tests/unit/workshop.test.js`
Kết quả mong đợi: FAIL, 4 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be '1' // Object.is equality`.

- [ ] **Step 2: Code**

Áp vào `src/ui/strings.vi.js`:

```diff
diff --git a/src/ui/strings.vi.js b/src/ui/strings.vi.js
index b294d14..c779831 100644
--- a/src/ui/strings.vi.js
+++ b/src/ui/strings.vi.js
@@ -51,6 +51,9 @@ const t = {
     steps: (n) => `hạ ${n} nấc`,
     stepsExplain: (n) => `Máy đang bớt ${n} nấc chi tiết (độ nét, phản chiếu, bloom…) để hình không giật; `
       + 'khi máy rảnh hơn, chi tiết tự trở lại.',
+    /** Có nấc bị khóa chống dao động (GĐ 4): nói thật là nấc đó giữ tới khi tải lại trang. */
+    lockedExplain: (n, k) => `Máy đang bớt ${n} nấc chi tiết (độ nét, phản chiếu, bloom…) để hình không giật. `
+      + `${k} nấc trong số đó giữ nguyên tới khi tải lại trang, vì trả lại là máy chậm ngay.`,
   },
   static: {
     noGpu: 'Máy này chưa vẽ được cảnh 3D, thường là vì trình duyệt đang tắt tăng tốc phần cứng. '
@@ -103,13 +106,17 @@ const t = {
       triangles: 'Tam giác mỗi khung',
       ms: 'Mili giây mỗi khung',
       cpuMs: 'Mili giây CPU mỗi khung',
+      gpuMs: 'Mili giây GPU mỗi khung',
     },
+    /** Máy không đo được thời gian GPU (GĐ 4): dòng ms GPU ghi "—" kèm câu này. */
+    gpuMissing:
+      'Máy này chưa đo được thời gian GPU: Safari và nhiều điện thoại chưa cho đo, còn GPU Apple trên Chrome báo các lượt vẽ chồng lên nhau nên số không dùng được.',
     /** Hai cột "Tắt / Bật" của thí nghiệm so sánh (GĐ 3). */
     compare: {
       off: 'Tắt',
       on: 'Bật',
       empty: 'chưa đo',
-      value: (ms, cpu) => `khung ${ms} ms · CPU ${cpu} ms`,
+      value: (ms, cpu, gpu) => `khung ${ms} ms · CPU ${cpu} ms${gpu === null ? '' : ` · GPU ${gpu} ms`}`,
     },
     /** Nút mở Sổ tay ở tầng tĩnh (chỉ đọc). */
     openStatic: (n) => `Xem ${n} lớp của bức tranh`,
```

Áp vào `src/ui/badge.js`:

```diff
diff --git a/src/ui/badge.js b/src/ui/badge.js
index e633400..1bace4d 100644
--- a/src/ui/badge.js
+++ b/src/ui/badge.js
@@ -1,19 +1,24 @@
-// ui/badge.js — huy hiệu tầng: WebGPU / WebGL2 / Tranh tĩnh kèm mức chất lượng và số nấc đang hạ; data-backend, data-steps cho test đọc
+// ui/badge.js — huy hiệu tầng: WebGPU / WebGL2 / Tranh tĩnh kèm mức chất lượng và số nấc đang hạ; data-backend, data-steps, data-locked cho test đọc
 
 /**
  * Vẽ huy hiệu vào nút [data-badge]. Huy hiệu ghi backend THẬT (run.js đọc sau renderer.init()),
  * vì three có thể lặng lẽ lùi từ WebGPU về WebGL2. `data-backend` là thứ e2e kiểm; chữ hiển thị
  * thì có thể đổi theo ngôn ngữ nên test không dựa vào chữ.
  * Bộ điều chỉnh đang hạ nấc (GĐ 3) thì ghi thêm "hạ {n} nấc", và lời giải thích nói máy đang bớt chi tiết để giữ nhịp.
+ * GĐ 4: có nấc bị khóa chống dao động thì lời giải thích nói thật là nấc đó giữ tới khi tải lại trang (không hứa trở lại).
  * @param {HTMLElement} el
- * @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: 'cao' | 'vua' | 'thap' | null, steps?: number }} info
+ * @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: 'cao' | 'vua' | 'thap' | null, steps?: number, locked?: number }} info
  * @param {Record<string, any>} t  chữ giao diện của trang (strings.<lang>.js)
  */
-export function renderBadge(el, { tier, level, steps = 0 }, t) {
+export function renderBadge(el, { tier, level, steps = 0, locked = 0 }, t) {
+  const held = steps > 0 ? Math.min(locked, steps) : 0; // nấc bị khóa mà đang hạ
   const text = t.tierName[tier] + (level ? ` · ${t.levelName[level]}` : '') + (steps > 0 ? ` · ${t.badge.steps(steps)}` : '');
-  const explain = t.badge.explain[tier] + (steps > 0 ? ` ${t.badge.stepsExplain(steps)}` : '');
+  let explain = t.badge.explain[tier];
+  if (held > 0) explain += ` ${t.badge.lockedExplain(steps, held)}`;
+  else if (steps > 0) explain += ` ${t.badge.stepsExplain(steps)}`;
   el.dataset.backend = tier;
   el.dataset.steps = String(steps);
+  el.dataset.locked = String(held);
   el.textContent = text;
   el.title = explain; // chuột: rê vào là thấy; chạm: shell.js mở ô giải thích
   el.setAttribute('aria-label', `${text}. ${explain}`);
```

Áp vào `src/ui/notebook-pages.js`:

```diff
diff --git a/src/ui/notebook-pages.js b/src/ui/notebook-pages.js
index e7496fa..50ea83d 100644
--- a/src/ui/notebook-pages.js
+++ b/src/ui/notebook-pages.js
@@ -90,6 +90,10 @@ export function readoutList(doc, { rows, lang }) {
       for (const [id, dd] of cells) {
         const v = values[id];
         if (v === undefined) continue;
+        if (v === null) {
+          dd.textContent = '—'; // máy không đo được số này (ms GPU trên Safari, nhiều điện thoại, GPU Apple)
+          continue;
+        }
         const shown = typeof v === 'number' ? format.format(v) : String(v);
         dd.textContent = units.get(id) ? `${shown} ${units.get(id)}` : shown;
       }
@@ -97,37 +101,66 @@ export function readoutList(doc, { rows, lang }) {
   };
 }
 
+/** Số đo của xưởng, cho mọi lớp, theo thứ tự hiện trong tab Phá. */
+const STUDIO_READOUTS = ['drawCalls', 'triangles', 'ms', 'cpuMs', 'gpuMs'];
+
+/**
+ * Số đo trực tiếp của tab Phá: của lớp (nhãn trong content), rồi của xưởng. Máy không đo được ms GPU thì dòng đó ghi "—"
+ * và có thêm một câu giải thích (GĐ 4); mẫu GPU đầu tiên về thì câu ấy ẩn đi.
+ * @param {Document} doc
+ * @param {{ readouts: { id: string, unit?: string }[], labels?: Record<string, string>, t: Record<string, any> }} p
+ */
+export function measureList(doc, { readouts, labels, t }) {
+  const rows = [
+    ...readouts.map((r) => ({ id: `lop:${r.id}`, label: labels?.[r.id] ?? r.id, unit: r.unit })),
+    ...STUDIO_READOUTS.map((id) => ({ id, label: t.notebook.readouts[id] })),
+  ];
+  const list = readoutList(doc, { rows, lang: t.lang });
+  const missing = h(doc, 'p', { class: 'nb-gpu-missing', text: t.notebook.gpuMissing });
+  return {
+    el: h(doc, 'div', { class: 'nb-measure' }, list.el, missing),
+    /** @param {Record<string, number | string | null>} values  'lop:<id>' cho số của lớp, còn lại là stats() của bàn thợ */
+    update(values) {
+      list.update(values);
+      missing.hidden = values.gpuMs !== null;
+    },
+  };
+}
+
 /**
- * Hai cột "Tắt / Bật" của một thí nghiệm 'compare' (GĐ 3). Mỗi hàng có hai vạch: ms mỗi khung (vàng lá) và ms CPU
- * (bạc lá), dài theo số lớn hơn của hai hàng; kèm số viết ra. Vạch chỉ để nhìn (aria-hidden), số là chữ để đọc.
- * Máy mạnh thường thấy hai vạch ms khung bằng nhau: trình duyệt khóa ở nhịp màn hình. ms CPU thì không bị khóa.
+ * Hai cột "Tắt / Bật" của một thí nghiệm 'compare' (GĐ 3). Mỗi hàng có ba vạch: ms mỗi khung (vàng lá), ms CPU (bạc lá)
+ * và (GĐ 4) ms GPU (chàm sáng), mỗi loại dài theo số lớn hơn của hai hàng; kèm số viết ra. Vạch chỉ để nhìn
+ * (aria-hidden), số là chữ để đọc. Máy mạnh thường thấy hai vạch ms khung bằng nhau: trình duyệt khóa ở nhịp màn hình.
+ * ms CPU và ms GPU thì không bị khóa. Bên nào chưa có mẫu GPU (hay máy không đo được) thì không ghi số GPU.
  * @param {Document} doc
  * @param {{ t: Record<string, any> }} p
  */
 export function compareBars(doc, { t }) {
   const format = new Intl.NumberFormat(t.lang, { maximumFractionDigits: 1 });
+  const KEYS = ['ms', 'cpuMs', 'gpuMs'];
   const row = (side) => {
-    const frame = h(doc, 'i');
-    const cpu = h(doc, 'i');
+    const bars = KEYS.map(() => h(doc, 'i'));
     const value = h(doc, 'span', { class: 'nb-compare-value', text: t.notebook.compare.empty });
     const el = h(doc, 'div', { class: 'nb-compare-row', 'data-side': side },
       h(doc, 'span', { text: t.notebook.compare[side] }),
-      h(doc, 'span', { class: 'nb-bars', 'aria-hidden': 'true' }, frame, cpu),
+      h(doc, 'span', { class: 'nb-bars', 'aria-hidden': 'true' }, bars),
       value);
-    return { el, frame, cpu, value };
+    return { el, bars, value };
   };
   const rows = { off: row('off'), on: row('on') };
   return {
     el: h(doc, 'div', { class: 'nb-compare', 'data-compare': '' }, rows.off.el, rows.on.el),
-    /** @param {{ off: { ms: number, cpuMs: number } | null, on: { ms: number, cpuMs: number } | null }} data */
+    /** @param {{ off: { ms: number, cpuMs: number, gpuMs?: number | null } | null, on: object | null }} data */
     update(data) {
       const top = (key) => Math.max(data.off?.[key] ?? 0, data.on?.[key] ?? 0) || 1;
       for (const side of ['off', 'on']) {
-        const { frame, cpu, value } = rows[side];
+        const { bars, value } = rows[side];
         const v = data[side];
-        frame.style.width = v ? `${(v.ms / top('ms')) * 100}%` : '0%';
-        cpu.style.width = v ? `${(v.cpuMs / top('cpuMs')) * 100}%` : '0%';
-        value.textContent = v ? t.notebook.compare.value(format.format(v.ms), format.format(v.cpuMs)) : t.notebook.compare.empty;
+        KEYS.forEach((key, i) => {
+          bars[i].style.width = v?.[key] != null ? `${(v[key] / top(key)) * 100}%` : '0%';
+        });
+        const gpu = v?.gpuMs != null ? format.format(v.gpuMs) : null;
+        value.textContent = v ? t.notebook.compare.value(format.format(v.ms), format.format(v.cpuMs), gpu) : t.notebook.compare.empty;
       }
     },
   };
```

Áp vào `src/ui/notebook.js`:

```diff
diff --git a/src/ui/notebook.js b/src/ui/notebook.js
index bccd695..5a7c809 100644
--- a/src/ui/notebook.js
+++ b/src/ui/notebook.js
@@ -1,7 +1,7 @@
 // ui/notebook.js — Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá (panel bên phải trên máy tính, tấm trượt dưới trên điện thoại).
 import { h } from './dom.js';
 import { createCodeView } from './code-view.js';
-import { understandPage, experimentList, readoutList, compareBars } from './notebook-pages.js';
+import { understandPage, experimentList, measureList, compareBars } from './notebook-pages.js';
 
 const TABS = ['hieu', 'chinh', 'pha'];
 const READOUT_MS = 250; // số đo đổi 4 lần mỗi giây: đủ đọc được, không làm nặng khung hình
@@ -168,11 +168,7 @@ export function createNotebook(doc, { meta, content, t, studio, loadKnobs = () =
       list.querySelector(`[data-experiment="${expId}"]`).after(bars.el);
       compares.set(expId, bars);
     }
-    const rows = [
-      ...spec.readouts.map((r) => ({ id: `lop:${r.id}`, label: text?.readouts?.[r.id] ?? r.id, unit: r.unit })),
-      ...['drawCalls', 'triangles', 'ms', 'cpuMs'].map((id) => ({ id, label: t.notebook.readouts[id] })),
-    ];
-    readouts = readoutList(doc, { rows, lang: t.lang });
+    readouts = measureList(doc, { readouts: spec.readouts, labels: text?.readouts, t });
     panels.pha.replaceChildren(off, list, h(doc, 'h3', { text: t.notebook.measure }), readouts.el);
   };
```

Áp vào `src/styles/notebook.css`:

```diff
diff --git a/src/styles/notebook.css b/src/styles/notebook.css
index 97387a8..3020eb9 100644
--- a/src/styles/notebook.css
+++ b/src/styles/notebook.css
@@ -263,7 +263,9 @@ body:is([data-state='lost'], [data-state='loading'], [data-state='compiling'], [
 .nb-compare-row { display: grid; grid-template-columns: 2.5em minmax(40px, 1fr) auto; align-items: center; gap: 8px; color: var(--bac-la); }
 .nb-bars { display: grid; gap: 2px; }
 .nb-bars i { display: block; height: 4px; width: 0; border-radius: 2px; background: var(--vang-la); }
-.nb-bars i + i { background: var(--bac-la); }
+.nb-bars i:nth-child(2) { background: var(--bac-la); }
+.nb-bars i:nth-child(3) { background: color-mix(in srgb, var(--cham) 40%, var(--nga)); } /* ms GPU (GĐ 4) */
+.nb-gpu-missing { margin: 6px 0 0; font-size: 12px; line-height: 1.5; color: var(--bac-la); }
 .nb-compare-value { color: var(--vang-la-sang); white-space: nowrap; }
 .nb-off { margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: var(--vang-la); }
 .nb-off:empty { margin: 0; }
```

Áp vào `src/engine/gpu/run.js`:

```diff
diff --git a/src/engine/gpu/run.js b/src/engine/gpu/run.js
index 7aee607..8dfa4ae 100644
--- a/src/engine/gpu/run.js
+++ b/src/engine/gpu/run.js
@@ -162,8 +162,10 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
       studio = null;
       quality = null;
     });
-    // Nấc đổi → huy hiệu ghi "hạ {n} nấc". Dựng lại cảnh lúc thanh lớp đang mở thì bộ điều chỉnh mới cũng chỉ canh.
-    d.add(scene.quality.onChange((q) => shell.showBadge({ tier: stage.backend, level: q.level, steps: q.steps.length })));
+    // Nấc đổi → huy hiệu ghi "hạ {n} nấc", nói thật về nấc bị khóa. Dựng lại cảnh lúc thanh lớp mở: bộ điều chỉnh mới cũng chỉ canh.
+    d.add(scene.quality.onChange((q) => shell.showBadge({
+      tier: stage.backend, level: q.level, steps: q.steps.length, locked: q.locked.length,
+    })));
     if (workshop?.isOpen) scene.quality.guard(true);
     // DevTools: __sma.setWeight('<id lớp>', 0) mài một lớp, __sma.degrade() hạ một nấc; e2e so ảnh ở cùng một khung.
     d.add(sma.expose(studioApi(() => studio)));
```

Run: `npx vitest run tests/unit/badge.test.js tests/unit/workshop.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  606 passed`.

```bash
git add src/engine/gpu/run.js src/styles/notebook.css src/ui/badge.js src/ui/notebook-pages.js src/ui/notebook.js src/ui/strings.vi.js tests/unit/badge.test.js tests/unit/workshop.test.js
git commit -F - <<'EOF'
feat(ui): Sổ tay có ms GPU ("—" kèm lời giải thích khi máy không đo được), cột GPU trong "Tắt / Bật"; huy hiệu nói thật về nấc bị khóa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Trần núm kiểm ngay lúc dựng; ba mức cùng bộ khóa (nợ GĐ 3)

**Mục tiêu:** Spec §8.4 `Knob.max`, §10 "Trần núm theo mức". Hai lỗi âm thầm mà review GĐ 3 để lại:
- `max: (env) => …` trả `undefined` (quên một mức) hay số nhỏ hơn `min` thì thanh trượt hỏng mà không ai báo. `knob-set.js#checkMax()` kiểm ngay lúc dựng: trần phải hữu hạn và không nhỏ hơn `min`. Sai thì ném `Lớp "<id>": trần của núm "<knob>" là …`;
- `quality.levels` của một bức thiếu khóa ở một mức thì `ctx.budget.x` là `undefined` ở đúng mức đó. Test hợp đồng giữ: ba mức cùng một bộ khóa.

**Files:**
- Modify: `src/engine/gpu/knob-set.js`
- Test: `tests/unit/knob-set.test.js`, `tests/paintings/contract.test.js`

**Interfaces:**
- Consumes: —
- Produces: — (chỉ thêm kiểm tra lúc dựng)

- [ ] **Step 1: Test (hỏng: trần sai chưa bị bắt)**

Áp vào `tests/unit/knob-set.test.js`:

```diff
diff --git a/tests/unit/knob-set.test.js b/tests/unit/knob-set.test.js
index f6f63a7..1fb1cdb 100644
--- a/tests/unit/knob-set.test.js
+++ b/tests/unit/knob-set.test.js
@@ -34,6 +34,21 @@ describe('knobValue / knobMax', () => {
   });
 });
 
+describe('createKnobs: trần do max() trả (GĐ 4)', () => {
+  it('max() trả số không hữu hạn, nhỏ hơn min, hay thiếu tầng: ném lỗi tiếng Việt ngay lúc dựng (không lặng lẽ bỏ trần)', () => {
+    const bad = [
+      { id: 'count', min: 100, max: () => Number.NaN },
+      { id: 'count', min: 100, max: () => undefined },
+      { id: 'count', min: 100, max: (e) => (e.level === 'vua' ? 50 : 500) },
+      { id: 'count', min: 100, max: { webgpu: 200000 } },
+    ];
+    for (const knob of bad) {
+      expect(() => createKnobs('vang-la', [{ ...knob, value: 100 }], env), String(knob.max)).toThrow(/Lớp "vang-la": trần của núm "count"/);
+    }
+    expect(() => createKnobs('vang-la', [{ id: 'count', min: 100, max: (e) => (e.level === 'vua' ? 100 : 500), value: 100 }], env)).not.toThrow();
+  });
+});
+
 describe('normalizeKnob', () => {
   it('số: kẹp trong [min, trần của tầng]; chuỗi số cũng nhận; không phải số thì ném lỗi', () => {
     const count = { id: 'count', min: 100, max: { webgpu: 200000, webgl2: 20000 } };
```

Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index 8380341..d1c3f67 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -142,6 +142,10 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
     const { painting } = await loadPainting();
     if (!painting.quality) return;
     expect(Object.keys(painting.quality.levels).sort(), 'quality.levels phải có cao, vua, thap').toEqual(['cao', 'thap', 'vua']);
+    // Ba mức cùng bộ khóa (GĐ 4): thiếu một khóa ở một mức thì lớp lặng lẽ lấy số mặc định của nó, không ai hay.
+    const keys = Object.fromEntries(Object.entries(painting.quality.levels).map(([level, l]) => [level, Object.keys(l).sort()]));
+    expect(keys.vua, 'quality.levels.vua phải có cùng khóa với cao').toEqual(keys.cao);
+    expect(keys.thap, 'quality.levels.thap phải có cùng khóa với cao').toEqual(keys.cao);
     const { ladder } = painting.quality;
     expect(new Set(ladder).size, `ladder có mục trùng: ${ladder.join(', ')}`).toBe(ladder.length);
     const { built } = buildPainting(painting, meta, { level: 'cao' });
```

Run: `npx vitest run tests/unit/knob-set.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `AssertionError: () => Number.NaN: expected [Function] to throw an error`.

- [ ] **Step 2: Code**

Áp vào `src/engine/gpu/knob-set.js`:

```diff
diff --git a/src/engine/gpu/knob-set.js b/src/engine/gpu/knob-set.js
index 0dcdb5e..e4c377d 100644
--- a/src/engine/gpu/knob-set.js
+++ b/src/engine/gpu/knob-set.js
@@ -34,6 +34,18 @@ export function knobMax(knob, env) {
 
 const viaOf = (knob) => knob.via ?? 'uniform';
 
+/**
+ * Kiểm trần của một núm số ngay lúc dựng (GĐ 4): max() trả NaN hay undefined thì Math.min lặng lẽ bỏ trần (hay ra NaN),
+ * và trần nhỏ hơn min thì núm không có giá trị nào hợp lệ. Cả hai là lỗi của khai báo: báo ngay, đừng để người xem gặp.
+ */
+function checkMax(layerId, knob, env) {
+  if ((knob.kind ?? 'number') !== 'number' || knob.max === undefined) return;
+  const max = knobMax(knob, env);
+  if (Number.isFinite(max) && (knob.min === undefined || max >= knob.min)) return;
+  throw new Error(`Lớp "${layerId}": trần của núm "${knob.id}" là ${max} ở tầng ${env.tier}, mức ${env.level}; `
+    + `phải là số hữu hạn và không nhỏ hơn min (${knob.min})`);
+}
+
 /**
  * Đưa một giá trị về đúng kiểu của núm. Số bị kẹp trong [min, trần]; màu là '#rrggbb' chữ thường;
  * 'select' phải là một id trong options. Nhờ vậy snapshot() luôn là JSON gọn, và Sổ tay không đưa được số lạ vào.
@@ -96,6 +108,7 @@ export function createKnobs(layerId, knobs, env) {
   const values = {};
   for (const knob of knobs) {
     if (specs.has(knob.id)) throw new Error(`Lớp "${layerId}" khai báo núm "${knob.id}" hai lần`);
+    checkMax(layerId, knob, env);
     specs.set(knob.id, knob);
     const value = normalizeKnob(layerId, knob, knobValue(knob, env), env);
     values[knob.id] = value;
```

Run: `npx vitest run tests/unit/knob-set.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  607 passed`.

```bash
git add src/engine/gpu/knob-set.js tests/paintings/contract.test.js tests/unit/knob-set.test.js
git commit -F - <<'EOF'
fix(engine): trần do max() trả được kiểm ngay lúc dựng (số hữu hạn, không nhỏ hơn min); hợp đồng: ba mức cùng bộ khóa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: View và overlay của công cụ (`engine/gpu/views.js`); tap; `requireView`

**Mục tiêu:** Spec §7, §8.4 (`views()`, `tap`), Phụ lục A.42–A.44.
- `pipeline.js#buildFinalNode` nhận `tap(tapId, node)` của lớp: chụp ở chặng `build` là màu tuyến tính, ở `display` là màu hiển thị.
- `createViews` liệt kê view theo thứ tự của Lột lớp: ảnh cuối, tap theo thứ tự NGƯỢC pipeline, emissive, normal (lười), depth.
  - `node(id)` trả node ở KHÔNG GIAN HIỂN THỊ: view tuyến tính đi qua `renderOutput(…, NoToneMapping)`, nên công cụ trộn thẳng với ảnh cuối được.
  - `setOverlays(entries)` ghép overlay của các công cụ lên ảnh cuối, rồi `vec4(rgb, 1)`. Overlay nào ném lỗi thì bỏ đúng công cụ đó (spec §9).
  - Overlay chạy ở lượt vẽ CUỐI (sau FXAA của Phủ bóng), nên mỗi view phải tính lại được ở điểm ảnh đó: texture của scene pass, uniform. Tap vì vậy là biểu thức thuần.
- `require('normal')`: `setMRT(makeMRT({ normal: true }))` TRƯỚC, rồi ghép lại overlay trên chuỗi post CŨ (không dựng lại bloom), rồi biên dịch trước. Chưa có kênh normal thì `node('normal')` là một màu phẳng giữ chỗ: gọi `getTextureNode` cho kênh chưa có trong MRT là vỡ (A.44). Bấm Normal hai lần liền khi đang mài chỉ đổi MRT, ghép và biên dịch một lần.

**Files:**
- Create: `src/engine/gpu/views.js`
- Modify: `src/engine/gpu/pipeline.js`
- Test: Create `tests/unit/views.test.js`; Modify `tests/unit/pipeline.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - `BUILTIN_VIEWS = ['final', 'emissive', 'normal', 'depth']`;
  - `createViews({ scenePass, renderPipeline, mrtFor, final, taps, compile }) → { list(), node(id), setOverlays(entries), require(id) }`:
    - `list() → { id, ready, layerId?, tapId? }[]`; tap có id `'<layerId>:<tapId>'`;
    - `setOverlays(entries: { id, fn: (final, view) => node }[]) → string[]` (id các công cụ ghép hỏng);
    - `require(id) → Promise<void>`;
  - `pipeline.js`: `buildFinalNode({ color, channel, layers, weight, taps })`; `makeMRT({ normal })`; `createPipeline(…) → { scenePass, renderPipeline, views, render, compile, dispose }`.

- [ ] **Step 1: Test (hỏng: chưa có `views.js`)**

Tạo `tests/unit/views.test.js`:

```js
// tests/unit/views.test.js — danh sách view (thứ tự, sẵn sàng), node ở không gian hiển thị, ghép overlay của công cụ.
import { describe, it, expect, vi } from 'vitest';
import { NoToneMapping, PerspectiveCamera, Scene, Vector4 } from 'three/webgpu';
import { pass, uniform } from 'three/tsl';
import { BUILTIN_VIEWS, createViews } from '../../src/engine/gpu/views.js';
import { makeMRT } from '../../src/engine/gpu/pipeline.js';

const marker = () => uniform(new Vector4());
const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);

function setup({ taps = [] } = {}) {
  const scenePass = pass(new Scene(), new PerspectiveCamera());
  scenePass.setMRT(makeMRT());
  const renderPipeline = { outputNode: null, needsUpdate: false };
  const final = marker();
  const compile = vi.fn(async () => {});
  const views = createViews({ scenePass, renderPipeline, mrtFor: makeMRT, final, taps, compile });
  return { scenePass, renderPipeline, final, compile, views };
}

describe('createViews', () => {
  it('thứ tự như Lột lớp: ảnh cuối, tap theo thứ tự NGƯỢC pipeline, emissive, normal (chưa sẵn sàng), depth', () => {
    expect(BUILTIN_VIEWS).toEqual(['final', 'emissive', 'normal', 'depth']);
    const taps = [
      { layerId: 'phu-bong', tapId: 'truoc-bloom', node: marker(), linear: true },
      { layerId: 'phu-bong', tapId: 'truoc-tone', node: marker(), linear: true },
    ];
    const { views } = setup({ taps });
    expect(views.list()).toEqual([
      { id: 'final', ready: true },
      { id: 'phu-bong:truoc-tone', ready: true, layerId: 'phu-bong', tapId: 'truoc-tone' },
      { id: 'phu-bong:truoc-bloom', ready: true, layerId: 'phu-bong', tapId: 'truoc-bloom' },
      { id: 'emissive', ready: true },
      { id: 'normal', ready: false },
      { id: 'depth', ready: true },
    ]);
  });

  it('node(): mọi view ở không gian hiển thị (tap tuyến tính và emissive qua renderOutput); id lạ thì ném lỗi', () => {
    const lin = marker();
    const shown = marker();
    const { views, final, scenePass } = setup({
      taps: [{ layerId: 'a', tapId: 'x', node: lin, linear: true }, { layerId: 'a', tapId: 'y', node: shown, linear: false }],
    });
    expect(views.node('final')).toBe(final);
    const x = views.node('a:x');
    expect([x.isRenderOutputNode, x.colorNode, x.getToneMapping()]).toEqual([true, lin, NoToneMapping]);
    expect(views.node('a:y')).toBe(shown);
    const e = views.node('emissive');
    expect([e.isRenderOutputNode, e.colorNode]).toEqual([true, scenePass.getTextureNode('emissive')]);
    expect(views.node('depth').isNode).toBe(true);
    expect(views.node('normal').isNode).toBe(true); // giữ chỗ: chưa đụng tới texture 'normal'
    expect(scenePass.renderTarget.textures.map((t) => t.name)).not.toContain('normal');
    expect(() => views.node('khong-co')).toThrow('Không có view "khong-co"');
  });

  it('setOverlays: ảnh cuối → overlay theo thứ tự → vec4(rgb, 1); pipeline dựng lại đồ thị', () => {
    const { views, final, renderPipeline } = setup();
    const a = marker();
    const b = marker();
    const order = [];
    views.setOverlays([
      { id: 'mot', fn: (c, view) => { order.push(['mot', c, view('depth').isNode]); return a; } },
      { id: 'hai', fn: (c) => { order.push(['hai', c]); return b; } },
    ]);
    expect(order).toEqual([['mot', final, true], ['hai', a]]);
    const join = unwrap(renderPipeline.outputNode);
    expect(join.nodes[0].node).toBe(b);
    expect(join.nodes[1].value).toBe(1);
    expect(renderPipeline.needsUpdate).toBe(true);
  });

  it('một overlay ném lỗi: cảnh báo và bỏ đúng công cụ đó, công cụ còn lại vẫn ghép', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { views, renderPipeline } = setup();
    const ok = marker();
    const broken = views.setOverlays([
      { id: 'hong', fn: () => { throw new Error('node sai'); } },
      { id: 'tot', fn: () => ok },
    ]);
    expect(broken).toEqual(['hong']);
    expect(unwrap(renderPipeline.outputNode).nodes[0].node).toBe(ok);
    expect(warn.mock.calls[0][0]).toBe('Công cụ "hong" ghép overlay không được, bỏ công cụ này:');
    warn.mockRestore();
  });
});
```

Áp vào `tests/unit/pipeline.test.js`:

```diff
diff --git a/tests/unit/pipeline.test.js b/tests/unit/pipeline.test.js
index d64cc19..63fd044 100644
--- a/tests/unit/pipeline.test.js
+++ b/tests/unit/pipeline.test.js
@@ -1,9 +1,10 @@
-import { describe, it, expect } from 'vitest';
+// tests/unit/pipeline.test.js — nối post của các lớp (build → renderOutput → display), MRT, tap, view Normal lười; không cần GPU.
+import { describe, it, expect, vi } from 'vitest';
 import {
   NoToneMapping, MaterialBlending, SRGBColorSpace, Scene, PerspectiveCamera, Vector4,
 } from 'three/webgpu';
 import { uniform } from 'three/tsl';
-import { buildOutputNode, createPipeline } from '../../src/engine/gpu/pipeline.js';
+import { buildFinalNode, createPipeline } from '../../src/engine/gpu/pipeline.js';
 
 // three r186: vec4(a, b) trả về VarNode "intent" bọc một JoinNode. Bóc lớp vỏ để xem các thành phần.
 const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);
@@ -17,8 +18,8 @@ function recordingLayer(id, calls, { build = false, display = false } = {}) {
   return { id, layer: { post, dispose() {} } };
 }
 
-describe('buildOutputNode', () => {
-  it('mọi build theo thứ tự → renderOutput(…, NoToneMapping) → mọi display theo thứ tự → vec4(rgb, 1)', () => {
+describe('buildFinalNode', () => {
+  it('mọi build theo thứ tự → renderOutput(…, NoToneMapping) → mọi display theo thứ tự; trả ảnh cuối (chưa overlay)', () => {
     const calls = [];
     const color = marker();
     const channel = () => null;
@@ -29,7 +30,7 @@ describe('buildOutputNode', () => {
       recordingLayer('b', calls, { build: true, display: true }),
     ];
 
-    const result = buildOutputNode({ color, channel, layers, weight: (id) => weights[id] });
+    const result = buildFinalNode({ color, channel, layers, weight: (id) => weights[id] });
 
     expect(calls.map((c) => `${c.stage}:${c.id}`)).toEqual(['build:a', 'build:b', 'display:a', 'display:b']);
     expect(calls[0].input.color).toBe(color);
@@ -42,24 +43,38 @@ describe('buildOutputNode', () => {
     for (const c of calls) {
       expect(c.input.channel).toBe(channel);
       expect(c.input.weight).toBe(weights[c.id]);
+      expect(typeof c.input.tap).toBe('function');
     }
-
-    expect(result.isNode).toBe(true);
-    const join = unwrap(result);
-    expect(join.nodeType).toBe('vec4');
-    expect(join.nodes[0].node).toBe(calls[3].out);
-    expect(join.nodes[0].components).toBe('xyz');
-    expect(join.nodes[1].value).toBe(1);
+    expect(result).toBe(calls[3].out);
   });
 
-  it('không lớp nào có post: màu scene pass vẫn qua renderOutput và alpha = 1', () => {
+  it('không lớp nào có post: ảnh cuối là màu scene pass qua renderOutput', () => {
     const color = marker();
     const layers = [{ id: 'cot', layer: { dispose() {} } }];
-    const join = unwrap(buildOutputNode({ color, channel: () => null, layers, weight: () => uniform(1) }));
-    const ro = join.nodes[0].node;
+    const ro = buildFinalNode({ color, channel: () => null, layers, weight: () => uniform(1) });
     expect(ro.isRenderOutputNode).toBe(true);
     expect(ro.colorNode).toBe(color);
-    expect(join.nodes[1].value).toBe(1);
+  });
+
+  it('tap (GĐ 4): ghi theo thứ tự gặp, kèm id lớp; chụp ở build là tuyến tính, ở display là màu hiển thị', () => {
+    const a = marker();
+    const b = marker();
+    const layers = [{
+      id: 'phu-bong',
+      layer: {
+        post: {
+          build: ({ color, tap }) => { tap('truoc-bloom', a); return color; },
+          display: ({ color, tap }) => { tap('truoc-fxaa', b); return color; },
+        },
+        dispose() {},
+      },
+    }];
+    const taps = [];
+    buildFinalNode({ color: marker(), channel: () => null, layers, weight: () => uniform(1), taps });
+    expect(taps).toEqual([
+      { layerId: 'phu-bong', tapId: 'truoc-bloom', node: a, linear: true },
+      { layerId: 'phu-bong', tapId: 'truoc-fxaa', node: b, linear: false },
+    ]);
   });
 });
 
@@ -97,13 +112,13 @@ describe('createPipeline (dựng đồ thị, không cần GPU)', () => {
     const passMRT = p.scenePass.getMRT();
     expect(Object.keys(passMRT.outputNodes)).toEqual(['output', 'emissive']);
     expect(passMRT.getBlendMode('emissive').blending).toBe(MaterialBlending);
-    expect(p.views()).toEqual([{ id: 'final', label: 'final', ready: true }]);
+    expect(p.views.list().map((v) => v.id)).toEqual(['final', 'emissive', 'normal', 'depth']);
     expect(typeof p.render).toBe('function');
     expect(typeof p.compile).toBe('function');
     expect(() => { p.dispose(); p.dispose(); }).not.toThrow();
   });
 
-  it('renderPipeline.outputColorTransform = false: renderOutput chỉ chạy một lần, trong outputNode do buildOutputNode dựng', () => {
+  it('renderPipeline.outputColorTransform = false: renderOutput chỉ chạy một lần, trong outputNode do buildFinalNode dựng', () => {
     const p = createPipeline({
       renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [], weight: () => uniform(1),
     });
@@ -123,4 +138,45 @@ describe('createPipeline (dựng đồ thị, không cần GPU)', () => {
 
     p.dispose();
   });
+
+  it('requireView("normal") (GĐ 4): MRT thêm kênh normal (emissive vẫn blend theo material), ghép lại overlay trên chuỗi post CŨ, biên dịch trước', async () => {
+    const calls = [];
+    const layer = recordingLayer('phu-bong', calls, { build: true, display: true });
+    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [layer], weight: () => uniform(1) });
+    p.scenePass.compileAsync = vi.fn(async () => {});
+    const seen = [];
+    p.views.setOverlays([{ id: 'kinh', fn: (final, view) => { seen.push(view('normal')); return final; } }]);
+    expect(p.views.list().find((v) => v.id === 'normal').ready).toBe(false);
+    const placeholder = seen[0];
+    await p.views.require('normal');
+    const passMRT = p.scenePass.getMRT();
+    expect(Object.keys(passMRT.outputNodes)).toEqual(['output', 'emissive', 'normal']);
+    expect(passMRT.getBlendMode('emissive').blending).toBe(MaterialBlending);
+    expect(p.views.list().find((v) => v.id === 'normal').ready).toBe(true);
+    expect(seen).toHaveLength(2); // overlay được ghép lại
+    expect(seen[1]).not.toBe(placeholder);
+    expect(seen[1]).toBe(p.scenePass.getTextureNode('normal'));
+    expect(calls.map((c) => c.stage)).toEqual(['build', 'display']); // bloom, FXAA… KHÔNG dựng lại
+    expect(p.scenePass.compileAsync).toHaveBeenCalledTimes(1);
+    await p.views.require('normal'); // lần hai: không làm gì
+    await p.views.require('depth');
+    expect(p.scenePass.compileAsync).toHaveBeenCalledTimes(1);
+    p.dispose();
+  });
+
+  it('bấm Normal hai lần liền khi đang mài (chưa biên dịch xong): MRT chỉ đổi một lần, biên dịch một lần, overlay ghép lại một lần', async () => {
+    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(), layers: [], weight: () => uniform(1) });
+    let done;
+    p.scenePass.compileAsync = vi.fn(() => new Promise((resolve) => { done = resolve; }));
+    const overlay = vi.fn((final) => final);
+    p.views.setOverlays([{ id: 'kinh', fn: overlay }]);
+    const setMRT = vi.spyOn(p.scenePass, 'setMRT');
+    const first = p.views.require('normal');
+    const second = p.views.require('normal');
+    await second;
+    done();
+    await first;
+    expect([setMRT.mock.calls.length, p.scenePass.compileAsync.mock.calls.length, overlay.mock.calls.length]).toEqual([1, 1, 2]);
+    p.dispose();
+  });
 });
```

Run: `npx vitest run tests/unit/views.test.js tests/unit/pipeline.test.js`
Kết quả mong đợi: FAIL, 6 test hỏng; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/gpu/views.js' imported from tests/unit/views.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/views.js`:

```js
// engine/gpu/views.js — các view mà công cụ học nhìn được (ảnh cuối, tap của lớp, emissive, normal lười, depth), ghép overlay của công cụ, requireView.
import { NoToneMapping } from 'three/webgpu';
import { oneMinus, pow, renderOutput, vec3, vec4 } from 'three/tsl';

/** View của xưởng, bức nào cũng có (nhãn ở t.views). Tap của lớp có id '<layerId>:<tapId>'. */
export const BUILTIN_VIEWS = Object.freeze(['final', 'emissive', 'normal', 'depth']);
/** Normal chưa có trong MRT: một màu phẳng "mặt quay về camera" giữ chỗ, không đụng tới texture chưa tồn tại. */
const NORMAL_PLACEHOLDER = vec4(0.5, 0.5, 1, 1);
/** Độ sâu tuyến tính (0 ở mắt, 1 ở far = 500) nén lại cho dễ nhìn: gần sáng, xa tối, trời gần như đen. */
const DEPTH_CURVE = 8;

/**
 * Danh sách view của MỘT pipeline, và nơi ghép overlay của công cụ lên ảnh cuối (spec §7).
 * Mọi view trả node ở KHÔNG GIAN HIỂN THỊ: view tuyến tính (tap của chặng build, emissive) đi qua
 * renderOutput(…, NoToneMapping) như ảnh cuối, nên công cụ trộn thẳng với ảnh cuối được.
 *
 * Overlay chạy ở lượt vẽ CUỐI (sau FXAA của Phủ bóng), nên mỗi view phải là biểu thức tính lại được tại điểm ảnh ấy:
 * texture của scene pass, texture của bloom, uniform. Vì vậy tap là biểu thức thuần, không phải biến .toVar() trong Fn.
 *
 * @param {object} p
 * @param {any} p.scenePass
 * @param {any} p.renderPipeline
 * @param {(options: { normal: boolean }) => any} p.mrtFor   MRT mới của scene pass (pipeline.js), có blend của emissive
 * @param {any} p.final   ảnh cuối (không gian hiển thị), chưa có overlay; KHÔNG bao giờ dựng lại
 * @param {{ layerId: string, tapId: string, node: any, linear: boolean }[]} p.taps   theo thứ tự trong pipeline
 * @param {() => Promise<void>} p.compile   biên dịch trước (scenePass.compileAsync)
 */
export function createViews({ scenePass, renderPipeline, mrtFor, final, taps, compile }) {
  let normal = false; // MRT đã có kênh normal chưa
  let overlays = []; // [{ id, fn }] của các công cụ, theo thứ tự ghép

  const tapOf = new Map(taps.map((tap) => [`${tap.layerId}:${tap.tapId}`, tap]));

  /** Node ở không gian hiển thị của một view. Id lạ thì ném lỗi (công cụ viết sai id). */
  const node = (id) => {
    if (id === 'final') return final;
    if (id === 'emissive') return renderOutput(scenePass.getTextureNode('emissive'), NoToneMapping);
    if (id === 'normal') return normal ? scenePass.getTextureNode('normal') : NORMAL_PLACEHOLDER;
    if (id === 'depth') return vec4(vec3(pow(oneMinus(scenePass.getLinearDepthNode()), DEPTH_CURVE)), 1);
    const tap = tapOf.get(id);
    if (!tap) throw new Error(`Không có view "${id}"`);
    return tap.linear ? renderOutput(tap.node, NoToneMapping) : tap.node;
  };

  /**
   * Ảnh cuối → overlay của từng công cụ → vec4(rgb, 1), rồi báo pipeline dựng lại đồ thị. Không gọi lại build/display
   * của lớp nào: bloom và FXAA giữ nguyên. Overlay ném lỗi thì bỏ đúng công cụ đó (spec §9); trả id các công cụ bị bỏ.
   */
  const compose = () => {
    let c = final;
    const broken = [];
    for (const o of overlays) {
      try {
        c = o.fn(c, node);
      } catch (err) {
        console.warn(`Công cụ "${o.id}" ghép overlay không được, bỏ công cụ này:`, err);
        broken.push(o.id);
      }
    }
    overlays = overlays.filter((o) => !broken.includes(o.id));
    // Alpha luôn 1: canvas có alpha, và renderOutput "bỏ nhân trước" alpha; chỗ nào alpha 0 sẽ trong suốt (luật 3).
    renderPipeline.outputNode = vec4(c.rgb, 1);
    renderPipeline.needsUpdate = true;
    return broken;
  };

  return {
    /** Thứ tự như Lột lớp (spec §7): ảnh cuối, tap theo thứ tự NGƯỢC pipeline, emissive, normal, depth. */
    list: () => [
      { id: 'final', ready: true },
      ...[...taps].reverse().map(({ layerId, tapId }) => ({ id: `${layerId}:${tapId}`, ready: true, layerId, tapId })),
      { id: 'emissive', ready: true },
      { id: 'normal', ready: normal },
      { id: 'depth', ready: true },
    ],
    node,
    /** Ghép overlay của các công cụ (toolbox.js gọi một lần sau khi gắn công cụ). Trả id các công cụ ghép hỏng. */
    setOverlays(entries) {
      overlays = [...entries];
      return compose();
    },
    /**
     * Bảo đảm một view sẵn sàng. Chỉ Normal cần việc: thêm kênh normal vào MRT của scene pass (MRT nằm trong cache key
     * của material, nên mọi material biên dịch lại MỘT lần), ghép lại overlay trên chuỗi post cũ, rồi biên dịch trước.
     */
    async require(id) {
      if (id !== 'normal' || normal) return;
      scenePass.setMRT(mrtFor({ normal: true }));
      normal = true;
      compose();
      await compile();
    },
  };
}
```

Áp vào `src/engine/gpu/pipeline.js`:

```diff
diff --git a/src/engine/gpu/pipeline.js b/src/engine/gpu/pipeline.js
index 97b1de7..9e7130c 100644
--- a/src/engine/gpu/pipeline.js
+++ b/src/engine/gpu/pipeline.js
@@ -1,47 +1,61 @@
-// engine/gpu/pipeline.js — scene pass + MRT (output, emissive); nối post của các lớp: build → renderOutput → display; alpha luôn 1.
+// engine/gpu/pipeline.js — scene pass + MRT (output, emissive; normal khi cần); nối post của các lớp: build → renderOutput → display → overlay; alpha luôn 1.
 import { RenderPipeline, BlendMode, MaterialBlending, NoToneMapping } from 'three/webgpu';
-import { pass, mrt, output, emissive, vec4, renderOutput } from 'three/tsl';
+import { pass, mrt, output, emissive, normalView, packNormalToRGB, vec4, renderOutput } from 'three/tsl';
+import { createViews } from './views.js';
 
 /**
  * Nối post của các lớp thành MỘT đồ thị node. Gọi một lần khi dựng pipeline:
  *
- *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → vec4(rgb, 1)
+ *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp   (= ảnh cuối)
  *
  * - build nhận HDR tuyến tính (bloom, tone mapping). Tone mapping là việc của lớp Phủ bóng, viết bằng node,
  *   nên renderOutput chỉ đổi không gian màu tuyến tính → sRGB (NoToneMapping), không tone map lần nữa.
  * - display nhận màu hiển thị sRGB (LUT, grain, vignette, FXAA: GĐ 4).
- * - Kết quả luôn có alpha = 1: canvas mặc định có alpha, và renderOutput "bỏ nhân trước" alpha;
- *   chỗ nào alpha 0 sẽ ra vec4(0), tức trong suốt, và poster phía sau lộ ra (luật 3: không bao giờ trong suốt).
+ * - tap(tapId, node) (GĐ 4): lớp chụp một bước giữa chừng thành view '<layerId>:<tapId>' cho công cụ học. Ghi vào `taps`
+ *   theo thứ tự gặp; `linear` cho biết node còn tuyến tính (chụp ở build) hay đã là màu hiển thị (chụp ở display).
  *
- * @param {{ color: any, channel: (name: string) => any, layers: { id: string, layer: object }[], weight: (id: string) => any }} input
+ * @param {{ color: any, channel: (name: string) => any, layers: { id: string, layer: object }[], weight: (id: string) => any,
+ *   taps?: { layerId: string, tapId: string, node: any, linear: boolean }[] }} input
+ * @returns {any} ảnh cuối ở không gian hiển thị, CHƯA có overlay của công cụ (views.js ghép, rồi vec4(rgb, 1))
  */
-export function buildOutputNode({ color, channel, layers, weight }) {
+export function buildFinalNode({ color, channel, layers, weight, taps = [] }) {
+  const tapFor = (layerId, linear) => (tapId, node) => taps.push({ layerId, tapId, node, linear });
   let c = color;
   for (const { id, layer } of layers) {
-    if (layer.post?.build) c = layer.post.build({ color: c, channel, weight: weight(id) });
+    if (layer.post?.build) c = layer.post.build({ color: c, channel, weight: weight(id), tap: tapFor(id, true) });
   }
   c = renderOutput(c, NoToneMapping);
   for (const { id, layer } of layers) {
-    if (layer.post?.display) c = layer.post.display({ color: c, channel, weight: weight(id) });
+    if (layer.post?.display) c = layer.post.display({ color: c, channel, weight: weight(id), tap: tapFor(id, false) });
   }
-  return vec4(c.rgb, 1);
+  return c;
+}
+
+/**
+ * MRT của scene pass: một lần vẽ scene ghi nhiều ảnh. `output`: màu đã chiếu sáng; `emissive`: riêng phần tự phát sáng
+ * (bloom chỉ đọc ảnh này, nên chỉ thứ có emissive mới tỏa: bloom chọn lọc); `normal` (GĐ 4, chỉ khi công cụ cần):
+ * pháp tuyến trong không gian camera, nén về [0, 1] bằng packNormalToRGB để ghi được vào ảnh.
+ * Target MRT khác 'output' mặc định KHÔNG blend: các sprite cộng dồn (AdditiveBlending) sẽ đè lên nhau trong ảnh
+ * emissive. MaterialBlending cho target này dùng đúng blend của material. Dựng MRT mới thì phải đặt lại blend.
+ * @param {{ normal?: boolean }} [options]
+ */
+export function makeMRT({ normal = false } = {}) {
+  const outputs = { output, emissive: vec4(emissive, output.a) };
+  if (normal) outputs.normal = vec4(packNormalToRGB(normalView), 1);
+  const passMRT = mrt(outputs);
+  passMRT.setBlendMode('emissive', new BlendMode(MaterialBlending));
+  return passMRT;
 }
 
 /**
  * Dựng pipeline hậu kỳ của cảnh.
  * @param {{ renderer: any, scene: any, camera: any, layers: { id: string, layer: object }[], weight: (id: string) => any }} options
- * @returns {{ scenePass: any, renderPipeline: any, render: () => void, compile: () => Promise<void>, views: () => { id: string, label: string, ready: boolean }[], dispose: () => void }}
+ * @returns {{ scenePass: any, renderPipeline: any, views: ReturnType<typeof createViews>, render: () => void,
+ *   compile: () => Promise<void>, dispose: () => void }}
  */
 export function createPipeline({ renderer, scene, camera, layers, weight }) {
   const scenePass = pass(scene, camera);
-
-  // MRT: một lần vẽ scene ghi HAI ảnh: màu đã chiếu sáng (output) và riêng phần tự phát sáng (emissive).
-  // Bloom chỉ đọc ảnh emissive, nên chỉ thứ có emissive mới tỏa sáng (bloom chọn lọc).
-  const passMRT = mrt({ output, emissive: vec4(emissive, output.a) });
-  // Target MRT khác 'output' mặc định KHÔNG blend: các sprite cộng dồn (AdditiveBlending) sẽ đè lên nhau
-  // trong ảnh emissive. MaterialBlending cho target này dùng đúng blend của material.
-  passMRT.setBlendMode('emissive', new BlendMode(MaterialBlending));
-  scenePass.setMRT(passMRT);
+  scenePass.setMRT(makeMRT());
 
   const channel = (name) => {
     if (name === 'output' || name === 'emissive') return scenePass.getTextureNode(name);
@@ -50,9 +64,15 @@ export function createPipeline({ renderer, scene, camera, layers, weight }) {
   };
 
   const renderPipeline = new RenderPipeline(renderer);
-  // renderOutput đã nằm sẵn trong đồ thị (buildOutputNode), nên tắt bước three tự thêm ở cuối.
+  // renderOutput đã nằm sẵn trong đồ thị (buildFinalNode), nên tắt bước three tự thêm ở cuối.
   renderPipeline.outputColorTransform = false;
-  renderPipeline.outputNode = buildOutputNode({ color: channel('output'), channel, layers, weight });
+  // Biên dịch trước với ĐÚNG render target + MRT của pass. renderer.compileAsync(scene, camera)
+  // thì biên dịch cho canvas, không có MRT, nên khung đầu vẫn phải biên dịch lại.
+  const compile = () => scenePass.compileAsync(renderer);
+  const taps = [];
+  const final = buildFinalNode({ color: channel('output'), channel, layers, weight, taps });
+  const views = createViews({ scenePass, renderPipeline, mrtFor: makeMRT, final, taps, compile });
+  views.setOverlays([]); // chưa có công cụ: ảnh cuối → vec4(rgb, 1)
 
   return {
     scenePass,
@@ -60,11 +80,9 @@ export function createPipeline({ renderer, scene, camera, layers, weight }) {
     // bị xóa, RenderPipeline sẽ tự renderOutput() thêm một lần nữa bằng renderer.toneMapping/
     // outputColorSpace lúc render() thật, tô màu tuyến tính → sRGB hai lần trên outputNode đã sRGB.
     renderPipeline,
+    views,
     render: () => renderPipeline.render(),
-    // Biên dịch trước với ĐÚNG render target + MRT của pass. renderer.compileAsync(scene, camera)
-    // thì biên dịch cho canvas, không có MRT, nên khung đầu vẫn phải biên dịch lại.
-    compile: () => scenePass.compileAsync(renderer),
-    views: () => [{ id: 'final', label: 'final', ready: true }],
+    compile,
     dispose: () => {
       renderPipeline.dispose();
       scenePass.dispose();
```

Run: `npx vitest run tests/unit/views.test.js tests/unit/pipeline.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  614 passed`.

```bash
git add src/engine/gpu/pipeline.js src/engine/gpu/views.js tests/unit/pipeline.test.js tests/unit/views.test.js
git commit -F - <<'EOF'
feat(engine): views.js (ảnh cuối, tap của lớp, emissive, normal lười, depth) và overlay của công cụ; pipeline có tap và requireView

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Hộp đồ nghề (`engine/gpu/toolbox.js`); cử chỉ `hover` và `g.pointer`

**Mục tiêu:** Spec §7 "Cử chỉ", §8.4 (`Tool`, `ToolApi`, `ToolInstance`, `Gesture`).
- **Hộp đồ nghề** `createToolbox({ tools, views, doc, t, content, redraw })`:
  - gắn mọi công cụ một lần: mỗi công cụ một ô `[data-tool-slot]` trong `[data-toolbar]`;
  - ghép overlay của chúng MỘT lần (`views.setOverlays`);
  - mỗi lúc một công cụ bật, đánh dấu bằng `body[data-tool]`;
  - công cụ ném lỗi khi gắn hay khi ghép thì bị bỏ kèm cảnh báo, các công cụ khác vẫn chạy;
  - nhãn view lấy ở `t.views[id]`, nhãn tap ở `content.layers[layerId].taps[tapId]`; thiếu thì dùng id.
- **Cử chỉ** tới công cụ đang bật trước; công cụ trả `true` thì bức không nhận.
  - Rê chuột mà không bấm sinh cử chỉ `hover`. Chỉ công cụ nhận `hover`, và hàng đợi chỉ giữ cái mới nhất.
  - Mỗi cử chỉ mang `pointer` (`pointerType` của lần nhấn: `'mouse' | 'touch' | 'pen'`).
- **Khung đứng yên** (`?freeze` đã dừng): cử chỉ tới thì vẽ lại (`onQueue(kind)`), để kính đi theo tay. Rê chuột chỉ vẽ lại khi có công cụ đang bật: lúc khác vẽ lại chỉ tốn công, và trên GPU phần mềm còn làm cú vuốt ngay sau đó bị giãn thành cú kéo.
- **Bàn thợ và `__sma`:** `tools()`, `setTool(id)` (vẽ lại sau khi đổi).

**Files:**
- Create: `src/engine/gpu/toolbox.js`
- Modify: `src/engine/contracts/runtime.js`, `src/engine/gpu/input.js`, `src/engine/gpu/scene.js`, `src/engine/gpu/studio.js`, `src/engine/sma.js`
- Test: Create `tests/unit/toolbox.test.js`; Modify `tests/unit/input.test.js`, `tests/unit/scene.test.js`, `tests/unit/sma.test.js`, `tests/unit/studio.test.js`

**Interfaces:**
- Consumes: `createViews` (Task 8).
- Produces:
  - `createToolbox(…) → { list() → { id, on }[], set(id | null), gesture(g) → boolean, dispose() }`;
  - `ToolApi = { views() → { id, label, ready }[], requireView(id) → Promise<void>, el, t, redraw() → Promise<void> }`; `ToolInstance = { overlay?(final, view), onGesture?(g) → boolean, activate?(on), dispose() }`;
  - `Gesture.kind` có thêm `'hover'`, `Gesture.pointer`; `createInput({ …, onQueue(kind) })`;
  - `studio.tools() → { id, on }[]`, `studio.setTool(id | null) → Promise<void>`; `__sma.tools()`, `__sma.setTool(id)`;
  - `buildScene({ …, tools = [], t = {}, content = null })`.

- [ ] **Step 1: Test (hỏng: chưa có `toolbox.js`, chưa có `hover`)**

Tạo `tests/unit/toolbox.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createToolbox } from '../../src/engine/gpu/toolbox.js';

/** views.js giả: một tap của lớp 'phu-bong', normal chưa sẵn sàng; setOverlays ghi lại các overlay được ghép. */
function fakeViews() {
  return {
    list: () => [
      { id: 'final', ready: true },
      { id: 'phu-bong:truoc-tone', ready: true, layerId: 'phu-bong', tapId: 'truoc-tone' },
      { id: 'emissive', ready: true },
      { id: 'normal', ready: false },
    ],
    require: vi.fn(async () => {}),
    setOverlays: vi.fn((entries) => {
      const broken = [];
      for (const e of entries) {
        try {
          e.fn('final', () => 'view');
        } catch {
          broken.push(e.id);
        }
      }
      return broken;
    }),
  };
}

/** Công cụ giả: ghi lại api nhận được, lời gọi activate, và trả `grab` cho cử chỉ. */
function fakeTool(id, { grab = false, overlay = true, mountError = null, overlayError = null } = {}) {
  const tool = { id, api: null, activate: vi.fn(), dispose: vi.fn(), gestures: [] };
  tool.mount = (api) => {
    if (mountError) throw mountError;
    tool.api = api;
    api.el.append(document.createElement('button'));
    return {
      overlay: overlay ? (c) => { if (overlayError) throw overlayError; return c; } : undefined,
      onGesture: (g) => { tool.gestures.push(g.kind); return grab; },
      activate: tool.activate,
      dispose: tool.dispose,
    };
  };
  return tool;
}

const t = { views: { final: 'Ảnh cuối', emissive: 'Chỉ emissive', normal: 'Normal' } };
const content = { layers: { 'phu-bong': { taps: { 'truoc-tone': 'Trước tone' } } } };

beforeEach(() => {
  document.body.replaceChildren();
  delete document.body.dataset.tool;
});

describe('createToolbox', () => {
  it('gắn mọi công cụ: mỗi công cụ một ô trong [data-toolbar]; api có views (kèm nhãn), requireView, el, t, redraw', async () => {
    const views = fakeViews();
    const redraw = vi.fn(async () => {});
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh, fakeTool('lot')], views, doc: document, t, content, redraw });
    const bar = document.querySelector('[data-toolbar]');
    expect(bar.hidden).toBe(true);
    expect([...bar.querySelectorAll('[data-tool-slot]')].map((el) => el.dataset.toolSlot)).toEqual(['kinh', 'lot']);
    expect(kinh.api.el).toBe(bar.querySelector('[data-tool-slot="kinh"]'));
    expect(kinh.api.views()).toEqual([
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: false },
    ]);
    await kinh.api.requireView('normal');
    expect(views.require).toHaveBeenCalledWith('normal');
    expect([kinh.api.t, kinh.api.redraw]).toEqual([t, redraw]);
    expect(views.setOverlays.mock.calls[0][0].map((e) => e.id)).toEqual(['kinh', 'lot']);
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: false }, { id: 'lot', on: false }]);
  });

  it('chữ của bức tải hỏng (content = null): nhãn tap rơi về id của tap, công cụ vẫn gắn và dùng được', () => {
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content: null });
    expect(kinh.api.views().map((v) => v.label)).toEqual(['Ảnh cuối', 'truoc-tone', 'Chỉ emissive', 'Normal']);
    toolbox.set('kinh');
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: true }]);
  });

  it('mỗi lúc MỘT công cụ: bật cái này thì cái kia tắt; body[data-tool]; null tắt hết; id lạ thì ném lỗi', () => {
    const kinh = fakeTool('kinh');
    const lot = fakeTool('lot');
    const toolbox = createToolbox({ tools: [kinh, lot], views: fakeViews(), doc: document, t, content });
    const bar = document.querySelector('[data-toolbar]');
    toolbox.set('kinh');
    expect([bar.hidden, document.body.dataset.tool]).toEqual([false, 'kinh']);
    expect(bar.querySelector('[data-tool-slot="kinh"]').hidden).toBe(false);
    toolbox.set('lot');
    expect(kinh.activate.mock.calls).toEqual([[true], [false]]);
    expect(lot.activate.mock.calls).toEqual([[true]]);
    expect(bar.querySelector('[data-tool-slot="kinh"]').hidden).toBe(true);
    expect(toolbox.list()).toEqual([{ id: 'kinh', on: false }, { id: 'lot', on: true }]);
    toolbox.set(null);
    expect([bar.hidden, document.body.dataset.tool]).toEqual([true, undefined]);
    expect(lot.activate.mock.calls).toEqual([[true], [false]]);
    expect(() => toolbox.set('khong-co')).toThrow('Không có công cụ "khong-co"');
  });

  it('cử chỉ: chỉ công cụ ĐANG BẬT nhận; nó trả true thì dừng ở đó (bức không nhận)', () => {
    const kinh = fakeTool('kinh', { grab: true });
    const lot = fakeTool('lot', { grab: false });
    const toolbox = createToolbox({ tools: [kinh, lot], views: fakeViews(), doc: document, t, content });
    expect(toolbox.gesture({ kind: 'tap' })).toBe(false); // chưa bật công cụ nào
    toolbox.set('kinh');
    expect(toolbox.gesture({ kind: 'tap' })).toBe(true);
    toolbox.set('lot');
    expect(toolbox.gesture({ kind: 'hold-start' })).toBe(false);
    expect([kinh.gestures, lot.gestures]).toEqual([['tap'], ['hold-start']]);
  });

  it('công cụ ném lỗi khi gắn hay khi ghép overlay: cảnh báo, bỏ công cụ đó (không có ô, không có trong list), còn lại vẫn chạy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const bad = fakeTool('hong', { mountError: new Error('gắn hỏng') });
    const ugly = fakeTool('xau', { overlayError: new Error('node sai') });
    const toolbox = createToolbox({ tools: [bad, ugly, fakeTool('tot')], views: fakeViews(), doc: document, t, content });
    expect(toolbox.list().map((x) => x.id)).toEqual(['tot']);
    expect(document.querySelectorAll('[data-tool-slot]')).toHaveLength(1);
    expect(ugly.dispose).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toBe('Công cụ "hong" gắn không được, bỏ công cụ này:');
    warn.mockRestore();
  });

  it('không có công cụ nào: không đụng tới DOM; dispose gỡ công cụ, thanh công cụ và body[data-tool]', () => {
    const empty = createToolbox({ tools: [], views: fakeViews() });
    expect(empty.list()).toEqual([]);
    empty.dispose();
    const kinh = fakeTool('kinh');
    const toolbox = createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content });
    toolbox.set('kinh');
    toolbox.dispose();
    expect(kinh.dispose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-toolbar]')).toBeNull();
    expect(document.body.dataset.tool).toBeUndefined();
  });
});
```

Áp vào `tests/unit/input.test.js`:

```diff
diff --git a/tests/unit/input.test.js b/tests/unit/input.test.js
index 8c66d00..381ffa2 100644
--- a/tests/unit/input.test.js
+++ b/tests/unit/input.test.js
@@ -64,6 +64,34 @@ describe('createInput', () => {
     expect(u.value.toArray()).toEqual([1, 1]);
   });
 
+  it("rê chuột không bấm → 'hover' (GĐ 4); hàng đợi chỉ giữ hover mới nhất; kéo chuột hay rê ngón tay thì không", () => {
+    const onQueue = vi.fn();
+    const own = createInput({ canvas, camera, controls, pointer: u, win, onQueue });
+    const mouse = { pointerType: 'mouse', buttons: 0 };
+    canvas.dispatchEvent(pointer('pointermove', 20, 10, mouse));
+    canvas.dispatchEvent(pointer('pointermove', 100, 50, mouse));
+    canvas.dispatchEvent(pointer('pointermove', 60, 50, { pointerType: 'mouse', buttons: 1 })); // đang bấm: kéo camera
+    canvas.dispatchEvent(pointer('pointermove', 60, 50, { pointerType: 'touch', buttons: 1 }));
+    const queued = own.drain();
+    expect(queued.map((g) => [g.kind, g.pointer, g.ndc])).toEqual([['hover', 'mouse', { x: 0, y: 0 }]]);
+    expect(queued[0].ray.origin.toArray()).toEqual([0, 5, 10]);
+    expect(onQueue.mock.calls).toEqual([['hover'], ['hover']]);
+    own.dispose();
+  });
+
+  it("mỗi cử chỉ mang loại con trỏ (g.pointer): 'touch' của ngón tay, 'pen' của bút; thiếu thì coi là 'mouse'", () => {
+    canvas.dispatchEvent(pointer('pointerdown', 100, 50, { pointerType: 'touch' }));
+    clock = 50;
+    canvas.dispatchEvent(pointer('pointerup', 100, 50, { pointerType: 'touch' }));
+    canvas.dispatchEvent(pointer('pointerdown', 100, 50, { pointerType: 'pen' }));
+    clock = GESTURE.holdMs + 100;
+    vi.advanceTimersByTime(GESTURE.holdMs);
+    canvas.dispatchEvent(pointer('pointerup', 100, 50, { pointerType: 'pen' }));
+    canvas.dispatchEvent(pointer('pointerdown', 10, 10));
+    canvas.dispatchEvent(pointer('pointerup', 10, 10));
+    expect(input.drain().map((g) => `${g.kind}:${g.pointer}`)).toEqual(['tap:touch', 'hold-start:pen', 'hold-end:pen', 'tap:mouse']);
+  });
+
   it('giữ yên holdMs → hold-start và camera đứng yên; thả → hold-end, camera chạy lại', () => {
     canvas.dispatchEvent(pointer('pointerdown', 50, 50));
     clock = GESTURE.holdMs;
```

Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 72b4ffa..25a2dde 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -1,5 +1,6 @@
 // tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze.
 import { describe, it, expect, vi } from 'vitest';
+import { JSDOM } from 'jsdom';
 import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
 import { color, mix, uniform, vec3 } from 'three/tsl';
 import { buildScene } from '../../src/engine/gpu/scene.js';
@@ -72,11 +73,15 @@ function fakeWin() {
   return { win, frames, flush: () => frames.splice(0).forEach((cb) => cb(16)) };
 }
 
-function build({ backend = 'webgpu', reducedMotion = false, flags = {} } = {}) {
+function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, tools = [] } = {}) {
   const stage = fakeStage(backend);
   const disposer = createDisposer();
   const { win, frames, flush } = fakeWin();
-  const scene = buildScene({ stage, disposer, painting, meta, flags, now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win });
+  if (tools.length > 0) win.document = new JSDOM('').window.document; // thanh công cụ là DOM thật
+  const scene = buildScene({
+    stage, disposer, painting: setup ? { ...painting, setup } : painting, meta, flags,
+    now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools,
+  });
   const renders = () => stage.renderer.render.mock.calls.length;
   return { stage, disposer, scene, frames, flush, renders };
 }
@@ -221,6 +226,65 @@ describe('buildScene', () => {
     expect(renders()).toBe(402);
   });
 
+  it("cử chỉ (GĐ 4): công cụ đang bật nhận trước, dùng rồi thì bức không nhận; 'hover' không bao giờ tới bức", async () => {
+    const onGesture = vi.fn();
+    const seen = [];
+    const lens = {
+      id: 'kinh',
+      mount: () => ({ onGesture: (g) => { seen.push(g.kind); return g.kind === 'tap'; }, dispose() {} }),
+    };
+    const { stage, scene } = build({ setup: () => ({ onGesture }), tools: [lens] });
+    const canvas = stage.renderer.domElement;
+    const event = (type, extra) => Object.assign(new Event(type), { clientX: 320, clientY: 200, pointerId: 1, button: 0, ...extra });
+    const tap = () => {
+      canvas.dispatchEvent(event('pointerdown', { pointerType: 'mouse' }));
+      canvas.dispatchEvent(event('pointerup', { pointerType: 'mouse' }));
+    };
+    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
+    tap();
+    scene.step(1000);
+    expect(onGesture.mock.calls.map(([g]) => g.kind)).toEqual(['tap']); // chưa bật công cụ: bức nhận chạm, không nhận hover
+    await scene.studio.setTool('kinh');
+    expect(scene.studio.tools()).toEqual([{ id: 'kinh', on: true }]);
+    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
+    tap();
+    scene.step(1016);
+    expect(seen).toEqual(['hover', 'tap']);
+    expect(onGesture).toHaveBeenCalledTimes(1);
+  });
+
+  it('đứng yên ở ?freeze, chưa bật công cụ nào: rê chuột không vẽ lại (chỉ công cụ nhận hover); chạm thì vẽ lại cho bức', async () => {
+    const onGesture = vi.fn();
+    const { stage, scene, frames, flush } = build({ setup: () => ({ onGesture }), tools: [{ id: 'kinh', mount: () => ({ dispose() {} }) }] });
+    scene.freeze();
+    const canvas = stage.renderer.domElement;
+    const event = (type, extra) => Object.assign(new Event(type), { clientX: 320, clientY: 200, pointerId: 1, button: 0, ...extra });
+    canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
+    expect(frames).toHaveLength(0);
+    canvas.dispatchEvent(event('pointerdown', { pointerType: 'mouse' }));
+    canvas.dispatchEvent(event('pointerup', { pointerType: 'mouse' }));
+    expect(frames).toHaveLength(1);
+    flush();
+    expect(onGesture.mock.calls.map(([g]) => g.kind)).toEqual(['tap']);
+  });
+
+  it('đứng yên ở ?freeze: cử chỉ tới thì vẽ lại ở nhịp rAF kế tiếp, và công cụ nhận cử chỉ đó (rê Kính mài)', async () => {
+    const seen = [];
+    const lens = { id: 'kinh', mount: () => ({ onGesture: (g) => seen.push(g.kind) > 0, dispose() {} }) };
+    const { stage, scene, frames, flush, renders } = build({ tools: [lens] });
+    scene.freeze();
+    const on = scene.studio.setTool('kinh'); // vẽ lại ở nhịp rAF sau khi công cụ đã bật (sau một microtask)
+    await new Promise((resolve) => setTimeout(resolve, 0));
+    flush();
+    await on;
+    const before = renders();
+    stage.renderer.domElement.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: 10, clientY: 10, pointerType: 'mouse', buttons: 0 }));
+    expect(frames).toHaveLength(1);
+    flush();
+    expect(seen).toEqual(['hover']);
+    expect(renders()).toBe(before + 1);
+  });
+
   it('ms CPU của khung đi vào số đo của bàn thợ', () => {
     const { scene } = build();
     scene.step(1000);
```

Áp vào `tests/unit/sma.test.js`:

```diff
diff --git a/tests/unit/sma.test.js b/tests/unit/sma.test.js
index 8ecb574..88161b3 100644
--- a/tests/unit/sma.test.js
+++ b/tests/unit/sma.test.js
@@ -55,14 +55,17 @@ describe('studioApi (GĐ 4): các hàm của bàn thợ mà __sma lộ ra', () =
     let studio = null;
     const api = studioApi(() => studio);
     expect([api.layers(), api.snapshot(), api.quality(), api.stats(), api.setWeight('x', 0)]).toEqual([[], null, null, null, undefined]);
+    expect([api.tools(), api.setTool('kinh')]).toEqual([[], undefined]);
     studio = {
       layers: () => [{ id: 'cot', name: 'Cốt', knobs: [] }],
       weight: () => ({ value: 1, target: 1 }),
       stats: () => ({ gpuMs: 4 }),
       quality: () => ({ gpu: true, locked: ['dpr=1.5'] }),
+      tools: () => [{ id: 'kinh', on: false }],
     };
     expect(api.layers()).toEqual([{ id: 'cot', name: 'Cốt', weight: 1 }]);
     expect(api.stats().gpuMs).toBe(4);
     expect(api.quality().locked).toEqual(['dpr=1.5']);
+    expect(api.tools()).toEqual([{ id: 'kinh', on: false }]);
   });
 });
```

Áp vào `tests/unit/studio.test.js`:

```diff
diff --git a/tests/unit/studio.test.js b/tests/unit/studio.test.js
index 63abb40..e4b1497 100644
--- a/tests/unit/studio.test.js
+++ b/tests/unit/studio.test.js
@@ -7,7 +7,7 @@ const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-2
 const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }] };
 
 /** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm (một kiểu compare) và số đo. */
-function setup({ tier = 'webgl2', quality } = {}) {
+function setup({ tier = 'webgl2', quality, toolbox } = {}) {
   const log = [];
   const cot = {
     id: 'cot',
@@ -35,7 +35,7 @@ function setup({ tier = 'webgl2', quality } = {}) {
   const weights = createWeights(meta.layers);
   const layers = buildLayers([cot, two], {}, {}, { ...env, tier });
   const redraw = vi.fn();
-  const studio = createStudio({ meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality });
+  const studio = createStudio({ meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality, toolbox });
   return { studio, weights, layers, redraw, log };
 }
 
@@ -180,6 +180,21 @@ describe('createStudio', () => {
     expect(await bare.degrade()).toBe(false);
   });
 
+  it('công cụ học (GĐ 4): tools() đọc hộp đồ nghề; setTool() bật/tắt rồi vẽ lại; không có hộp đồ nghề thì không có công cụ', async () => {
+    let on = null;
+    const toolbox = { list: () => [{ id: 'kinh', on: on === 'kinh' }], set: vi.fn((id) => { on = id; }) };
+    const { studio, redraw } = setup({ toolbox });
+    await studio.setTool('kinh');
+    expect(studio.tools()).toEqual([{ id: 'kinh', on: true }]);
+    await studio.setTool(null);
+    expect(toolbox.set.mock.calls).toEqual([['kinh'], [null]]);
+    expect(redraw).toHaveBeenCalledTimes(2);
+    const bare = setup().studio;
+    expect(bare.tools()).toEqual([]);
+    await expect(bare.setTool('kinh')).rejects.toThrow('Không có công cụ "kinh"');
+    await expect(bare.setTool(null)).resolves.toBeUndefined();
+  });
+
   it('snapshot → JSON gọn: trọng số lấy ĐÍCH của tween, núm theo địa chỉ "layerId.knobId"', () => {
     const { studio } = setup();
     studio.setWeight('lop-hai', 0, { tween: true });
```

Run: `npx vitest run tests/unit/toolbox.test.js tests/unit/input.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js`
Kết quả mong đợi: FAIL, 7 test hỏng; lỗi đầu tiên: `Error: Failed to resolve import "../../src/engine/gpu/toolbox.js" from "tests/unit/toolbox.test.js". Does the file exist?`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/toolbox.js`:

```js
// engine/gpu/toolbox.js — hộp đồ nghề: gắn các công cụ học vào pipeline, cử chỉ tới công cụ đang bật trước bức, mỗi lúc một công cụ.
import { h } from '../../ui/dom.js';

/**
 * Công cụ học (spec §7) chạy trên MỌI bức, vì chỉ nhìn các view mà xưởng liệt kê (views.js). Hộp đồ nghề:
 * - gắn từng công cụ (`mount(api)`), cho nó một ô trong thanh công cụ ([data-toolbar]) để dựng thanh điều khiển;
 * - ghép overlay của mọi công cụ lên ảnh cuối MỘT lần; công cụ nào gắn hay ghép hỏng thì bỏ nó, cảnh vẫn chạy (spec §9);
 * - bật MỘT công cụ mỗi lúc: bật cái này thì cái kia tắt; body[data-tool] cho CSS (điện thoại: Sổ tay thu lại);
 * - cử chỉ tới công cụ đang bật TRƯỚC bức; công cụ trả true thì cử chỉ dừng ở đó.
 * Bức không biết có công cụ nào: nó chỉ nhận những cử chỉ không công cụ nào dùng.
 *
 * @param {object} p
 * @param {import('../contracts/runtime.js').Tool[]} p.tools
 * @param {ReturnType<import('./views.js').createViews>} p.views
 * @param {Document} [p.doc]
 * @param {Record<string, any>} [p.t]        chữ giao diện: nhãn view ở t.views
 * @param {object | null} [p.content]        chữ của bức: nhãn tap ở content.layers[layerId].taps[tapId]
 * @param {() => Promise<void>} [p.redraw]   vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
 */
export function createToolbox({ tools, views, doc, t = {}, content = null, redraw = async () => {} }) {
  const mounted = []; // { id, instance, slot }
  const bar = tools.length > 0 ? h(doc, 'div', { class: 'toolbar', 'data-toolbar': '', hidden: true }) : null;
  // Chữ của bức tải hỏng (mạng chập chờn) thì nhãn của tap rơi về id của nó: công cụ vẫn dùng được.
  const labelOf = (v) => t.views?.[v.id] ?? content?.layers?.[v.layerId]?.taps?.[v.tapId] ?? v.tapId ?? v.id;
  const viewInfos = () => views.list().map((v) => ({ id: v.id, label: labelOf(v), ready: v.ready }));
  let active = null;

  const remove = (id) => {
    const i = mounted.findIndex((m) => m.id === id);
    if (i < 0) return;
    const [m] = mounted.splice(i, 1);
    m.slot.remove();
    try {
      m.instance.dispose();
    } catch (err) {
      console.warn(`Gỡ công cụ "${id}" bị lỗi:`, err);
    }
  };

  for (const tool of tools) {
    const slot = h(doc, 'div', { class: 'tool', 'data-tool-slot': tool.id, hidden: true });
    try {
      const instance = tool.mount({ views: viewInfos, requireView: (id) => views.require(id), el: slot, t, redraw });
      mounted.push({ id: tool.id, instance, slot });
      bar.append(slot);
    } catch (err) {
      console.warn(`Công cụ "${tool.id}" gắn không được, bỏ công cụ này:`, err);
    }
  }
  const overlays = mounted.filter((m) => m.instance.overlay).map((m) => ({ id: m.id, fn: (c, view) => m.instance.overlay(c, view) }));
  for (const id of views.setOverlays(overlays)) remove(id);
  if (bar && mounted.length > 0) doc.body.append(bar);

  const find = (id) => mounted.find((m) => m.id === id) ?? null;

  return {
    /** Công cụ đã gắn được, theo thứ tự tools/index.js: [{ id, on }]. */
    list: () => mounted.map(({ id }) => ({ id, on: id === active })),
    /** Bật một công cụ (tắt công cụ đang bật), hay null để tắt hết. Id lạ thì ném lỗi. */
    set(id) {
      if (id !== null && !find(id)) throw new Error(`Không có công cụ "${id}"`);
      if (id === active) return;
      const prev = find(active);
      if (prev) {
        prev.instance.activate?.(false);
        prev.slot.hidden = true;
      }
      active = id;
      const next = find(id);
      if (next) {
        next.slot.hidden = false;
        next.instance.activate?.(true);
        doc.body.dataset.tool = id;
      } else delete doc.body.dataset.tool;
      bar.hidden = !next;
    },
    /** Cử chỉ tới công cụ đang bật trước; true = công cụ đã dùng, không chuyển cho bức. */
    gesture(g) {
      return Boolean(find(active)?.instance.onGesture?.(g));
    },
    dispose() {
      for (const { id } of [...mounted]) remove(id);
      bar?.remove();
      if (doc?.body) delete doc.body.dataset.tool;
      active = null;
    },
  };
}
```

Áp vào `src/engine/gpu/input.js`:

```diff
diff --git a/src/engine/gpu/input.js b/src/engine/gpu/input.js
index 8a4c331..bb44ec4 100644
--- a/src/engine/gpu/input.js
+++ b/src/engine/gpu/input.js
@@ -1,4 +1,4 @@
-// engine/gpu/input.js — con trỏ trên canvas → cử chỉ có NDC và tia (Raycaster), cập nhật ctx.u.pointer; kéo để dành cho camera.
+// engine/gpu/input.js — con trỏ trên canvas → cử chỉ có NDC, tia (Raycaster) và loại con trỏ; rê chuột → 'hover'; kéo để dành cho camera.
 import { Raycaster, Vector2 } from 'three/webgpu';
 import { GESTURE, createGestureTracker } from './gesture.js';
 
@@ -9,29 +9,36 @@ const MODIFIER_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'OS'
  * Nghe pointer events trên canvas, phân loại bằng gesture.js, rồi xếp cử chỉ vào HÀNG ĐỢI.
  * run.js lấy hàng đợi ra ở đầu mỗi khung (drain), nên cử chỉ được xử lý TRONG khung:
  * có lưới bắt lỗi của khung, và thứ bức ghi lại theo cử chỉ (lúc bắt đầu, vị trí) khớp đồng hồ (kể cả ?freeze).
- * @param {{ canvas: any, camera: any, controls?: any, pointer: any, win?: any }} opts
+ * GĐ 4: mỗi cử chỉ mang `pointer` ('mouse' | 'touch' | 'pen'); rê chuột mà không bấm sinh cử chỉ 'hover' (hàng đợi giữ
+ * tối đa MỘT, cái mới nhất), chỉ công cụ học nhận (Kính mài đi theo chuột).
+ * @param {{ canvas: any, camera: any, controls?: any, pointer: any, win?: any, onQueue?: (kind: string) => void }} opts
  *   pointer: uniform vec2 (ctx.u.pointer), NDC của con trỏ, cho shader nào cần.
+ *   onQueue(kind): gọi mỗi khi hàng đợi có cử chỉ mới, kèm loại của cử chỉ mới nhất (cảnh đứng yên ở ?freeze thì vẽ lại).
  * @returns {{ drain: () => object[], onFirst: (fn: () => void) => void, dispose: () => void }}
  */
-export function createInput({ canvas, camera, controls = null, pointer, win = window }) {
+export function createInput({ canvas, camera, controls = null, pointer, win = window, onQueue = () => {} }) {
   const tracker = createGestureTracker();
   const raycaster = new Raycaster();
   const queue = [];
   let first = null; // hàm gọi một lần ở lần tương tác đầu tiên: chạm canvas, hay phím đầu tiên (shell hiện lời mời)
   let holdTimer = null;
   let holdingCamera = false; // input.js đã khóa camera (đang giữ tay): chỉ khi đó mới được trả camera lại
+  let kind = 'mouse'; // pointerType của lần chạm gần nhất: chạm, giữ, vuốt đều của con trỏ đó
 
   const ndcOf = (x, y) => {
     const r = canvas.getBoundingClientRect();
     return new Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
   };
+  /** Cử chỉ ở (x, y) px: NDC và một tia từ camera qua điểm đó; bức tự giao tia với mặt phẳng của nó. */
+  const gestureAt = (name, x, y, type) => {
+    const ndc = ndcOf(x, y);
+    raycaster.setFromCamera(ndc, camera);
+    return { kind: name, ndc: { x: ndc.x, y: ndc.y }, ray: raycaster.ray.clone(), pointer: type };
+  };
 
-  /** Mỗi cử chỉ kèm NDC và một tia từ camera qua điểm chạm; bức tự giao tia với mặt phẳng của nó. */
   const emit = (events) => {
     for (const e of events) {
-      const ndc = ndcOf(e.x, e.y);
-      raycaster.setFromCamera(ndc, camera);
-      const g = { kind: e.kind, ndc: { x: ndc.x, y: ndc.y }, ray: raycaster.ray.clone() };
+      const g = gestureAt(e.kind, e.x, e.y, kind);
       if (e.velocity) {
         const r = canvas.getBoundingClientRect();
         g.velocity = { x: (e.velocity.x / r.width) * 2, y: -(e.velocity.y / r.height) * 2 }; // NDC mỗi giây
@@ -47,6 +54,14 @@ export function createInput({ canvas, camera, controls = null, pointer, win = wi
       }
       queue.push(g);
     }
+    if (events.length > 0) onQueue(events.at(-1).kind);
+  };
+  /** Rê chuột mà không bấm: 'hover', và hàng đợi chỉ giữ cái mới nhất (mỗi khung tối đa một). */
+  const hover = (x, y) => {
+    const g = gestureAt('hover', x, y, 'mouse');
+    if (queue.at(-1)?.kind === 'hover') queue[queue.length - 1] = g;
+    else queue.push(g);
+    onQueue('hover');
   };
 
   const point = (e) => ({ id: e.pointerId ?? 1, x: e.clientX, y: e.clientY, t: win.performance.now(), primary: e.isPrimary });
@@ -58,6 +73,7 @@ export function createInput({ canvas, camera, controls = null, pointer, win = wi
   };
   const onDown = (e) => {
     if (e.button > 0) return; // chỉ nút chính của chuột; chạm và bút luôn là 0
+    kind = e.pointerType || 'mouse';
     fireFirst();
     emit(tracker.down(point(e)));
     clearHold();
@@ -69,6 +85,7 @@ export function createInput({ canvas, camera, controls = null, pointer, win = wi
     pointer.value.set(ndc.x, ndc.y);
     emit(tracker.poll(p.t));
     emit(tracker.move(p));
+    if (e.pointerType === 'mouse' && e.buttons === 0) hover(p.x, p.y);
   };
   const onUp = (e) => {
     if (e.button > 0) return; // nhả nút phụ (chuột phải) không kết thúc cái giữ của nút chính
```

Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index c5f1e5e..e8b2649 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -7,6 +7,7 @@ import { createPipeline } from './pipeline.js';
 import { createLadder } from './ladder.js';
 import { createStudio } from './studio.js';
 import { createInput } from './input.js';
+import { createToolbox } from './toolbox.js';
 
 /**
  * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU) + bộ đo GPU (gpu-timer).
@@ -85,8 +86,11 @@ function createQuality({ level, ladder, tuner, timer }) {
  * @param {Date} p.now
  * @param {boolean} p.reducedMotion
  * @param {Window} p.win
+ * @param {import('../contracts/runtime.js').Tool[]} [p.tools]   công cụ học (engine/tools/index.js)
+ * @param {Record<string, any>} [p.t]        chữ giao diện (nhãn view của công cụ)
+ * @param {object | null} [p.content]        chữ của bức (nhãn tap của lớp)
  */
-export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win }) {
+export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win, tools = [], t = {}, content = null }) {
   stage.useCamera(painting.camera);
   const mobile = isMobile(win.navigator);
   // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2); ?level ép một mức khác (xem mức thấp trên máy tính).
@@ -121,10 +125,6 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
   disposer.add(() => timer.dispose());
   const quality = createQuality({ level, ladder, tuner, timer });
 
-  // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
-  const input = createInput({ canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win });
-  disposer.add(() => input.dispose());
-
   // Vòng lặp đã dừng ở khung N của ?freeze=N: thay đổi từ Sổ tay hay __sma thì vẽ lại đúng khung đó (không tiến đồng hồ).
   // Vẽ lại ở nhịp requestAnimationFrame KẾ TIẾP, gộp mọi thay đổi trong cùng nhịp làm một: scene pass và reflector
   // của three chỉ vẽ lại cảnh một lần mỗi frameId, mà frameId chỉ tăng ở mỗi nhịp rAF của renderer. Vẽ lại hai lần
@@ -138,7 +138,10 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
       win.requestAnimationFrame(() => {
         pending = null;
         try {
-          if (!disposer.closed) pipeline.render();
+          if (!disposer.closed) {
+            route(); // cử chỉ tới lúc đứng yên (rê Kính mài) cũng có tác dụng
+            pipeline.render();
+          }
           resolve();
         } catch (err) {
           reject(err);
@@ -147,6 +150,26 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     });
     return pending;
   };
+
+  // Công cụ học (GĐ 4): gắn vào pipeline, overlay ghép MỘT lần; mỗi lúc một công cụ (toolbox.js).
+  const toolbox = createToolbox({ tools, views: pipeline.views, doc: win.document, t, content, redraw });
+  disposer.add(() => toolbox.dispose());
+
+  // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học nhận trước bức.
+  // Khung đứng yên: cử chỉ tới thì vẽ lại cho nó có tác dụng. Rê chuột chỉ công cụ nhận, nên chỉ vẽ lại khi có công cụ bật.
+  const input = createInput({
+    canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win,
+    onQueue: (kind) => frozen && (kind !== 'hover' || toolbox.list().some((x) => x.on)) && redraw(),
+  });
+  disposer.add(() => input.dispose());
+  /** Cử chỉ tới công cụ đang bật trước; công cụ không dùng thì tới bức. 'hover' không bao giờ tới bức. */
+  const route = () => {
+    for (const g of input.drain()) {
+      if (toolbox.gesture(g) || g.kind === 'hover') continue;
+      setup?.onGesture?.(g);
+    }
+  };
+
   const studio = createStudio({
     meta,
     layers,
@@ -155,6 +178,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     tweenSeconds: reducedMotion ? 0 : undefined, // giảm chuyển động: lớp bật/tắt ngay, không mờ dần
     redraw,
     quality,
+    toolbox,
   });
 
   return {
@@ -169,7 +193,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
       const start = win.performance.now();
       quality.sample(ms ?? start);
       const { t, dt } = stage.tick(ms);
-      for (const g of input.drain()) setup?.onGesture?.(g);
+      route();
       setup?.update?.(dt, t);
       for (const { layer } of layers) layer.update?.(dt, t);
       weights.step(dt);
```

Áp vào `src/engine/gpu/studio.js`:

```diff
diff --git a/src/engine/gpu/studio.js b/src/engine/gpu/studio.js
index f9e6b78..835aff3 100644
--- a/src/engine/gpu/studio.js
+++ b/src/engine/gpu/studio.js
@@ -3,6 +3,13 @@ import { knobMax } from './knob-set.js';
 import { TWEEN_SECONDS } from './layers.js';
 import { createMeter } from './meter.js';
 
+/** Cảnh không có hộp đồ nghề (test): không có công cụ nào. */
+const NO_TOOLS = Object.freeze({
+  list: () => [],
+  set: (id) => {
+    if (id !== null) throw new Error(`Không có công cụ "${id}"`);
+  },
+});
 /** Cảnh không có bộ điều chỉnh (test, bức cũ): nấc không có gì để hạ. */
 const NO_QUALITY = Object.freeze({
   state: () => ({ level: null, steps: [], guarding: false, capped: false, gpu: false, locked: [] }),
@@ -28,9 +35,12 @@ const NO_QUALITY = Object.freeze({
  * @param {number} [p.tweenSeconds]                    0 khi người xem xin giảm chuyển động
  * @param {{ state: () => object, degrade: () => boolean, upgrade: () => boolean, onChange: (cb: Function) => Function }} [p.quality]
  *   bộ điều chỉnh của cảnh (scene.js): mức, nấc đang hạ, hạ/nâng tay một nấc
+ * @param {{ list: () => { id: string, on: boolean }[], set: (id: string | null) => void }} [p.toolbox]  công cụ học (toolbox.js)
  * @returns {ReturnType<typeof createMeter> & object}  measure() và gpu() của bộ đo: scene.js đưa số vào mỗi khung
  */
-export function createStudio({ meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY }) {
+export function createStudio({
+  meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY, toolbox = NO_TOOLS,
+}) {
   const byId = new Map(layers.map((b) => [b.id, b]));
   const names = new Map(meta.layers.map((l) => [l.id, l.name]));
   const experimentsOn = new Set(); // 'layerId.expId' đang bật
@@ -156,6 +166,13 @@ export function createStudio({ meta, layers, weights, env, redraw = () => {}, tw
     /** Báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu). Trả hàm bỏ nghe. */
     onQuality: (cb) => quality.onChange(cb),
 
+    /** Công cụ học (GĐ 4): [{ id, on }] theo thứ tự tools/index.js (nút "Đồ nghề" của thanh lớp). */
+    tools: () => toolbox.list(),
+    /** Bật một công cụ (tắt cái đang bật), hay null để tắt hết; xong khi khung đã vẽ lại. */
+    setTool(id) {
+      return settle(() => toolbox.set(id));
+    },
+
     /**
      * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }.
      * Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
```

Áp vào `src/engine/sma.js`:

```diff
diff --git a/src/engine/sma.js b/src/engine/sma.js
index 5fc2efb..98a1b1a 100644
--- a/src/engine/sma.js
+++ b/src/engine/sma.js
@@ -8,7 +8,8 @@
  * GĐ 2: khi cảnh đã live, `expose()` gắn thêm các hàm của bàn thợ: `layers()`, `setWeight(id, v)`,
  * `snapshot()`, `restore(s)`. Mở DevTools gõ `__sma.setWeight('<id lớp>', 0)` là mài được một lớp.
  * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
- * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu` và `quality().locked`.
+ * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu`, `quality().locked`, `tools()` và
+ * `setTool(id | null)` (bật một công cụ học, hay tắt hết).
  *
  * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
  * @param {Window | Record<string, any>} win
@@ -64,5 +65,7 @@ export function studioApi(getStudio) {
     degrade: () => s()?.degrade(),
     upgrade: () => s()?.upgrade(),
     stats: () => s()?.stats() ?? null,
+    tools: () => s()?.tools() ?? [],
+    setTool: (id) => s()?.setTool(id),
   };
 }
```

Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 0a9a097..f685d02 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -104,23 +104,29 @@
  * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
  */
 /** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
- * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'} kind
+ * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'|'hover'} kind
+ *                                 [4] 'hover': chuột di mà không bấm, mỗi khung tối đa một. CHỈ công cụ nhận; bức không bao giờ
+ *                                 nhận 'hover' (onGesture của bức giữ nguyên nghĩa)
  * @property {{ x: number, y: number }} ndc
  * @property {any} ray                          THREE.Ray; bức tự giao với mặt phẳng của nó
  * @property {{ x: number, y: number }} [velocity]   chỉ có ở 'swipe'
+ * @property {'mouse'|'touch'|'pen'} [pointer]  [4] pointerType của sự kiện gốc (kính chỉ giữ chạm của ngón tay, bút)
  */
-/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js
+/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js; tên trên nút "Đồ nghề" ở t.tools[id].name
  * @typedef {{ id: string, mount: (api: ToolApi) => ToolInstance }} Tool */
 /** @typedef {Object} ToolApi
  * @property {() => ViewInfo[]} views              view ở không gian hiển thị, thứ tự như §7 Lột lớp
  * @property {(id: string) => Promise<void>} requireView   bảo đảm view sẵn sàng (có thể biên dịch lại MỘT lần)
- * @property {HTMLElement} el
+ * @property {HTMLElement} el                      ô của công cụ trong thanh công cụ; công cụ dựng thanh điều khiển ở đây
  * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
+ * @property {() => Promise<void>} redraw          vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
  */
 /** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
 /** @typedef {Object} ToolInstance
- * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép MỘT LẦN sau display; đổi chế độ = đổi uniform
+ * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép sau display khi dựng pipeline; ghép LẠI khi
+ *                                 requireView đổi MRT, nên chỉ dựng node, không giữ trạng thái; đổi chế độ = đổi uniform
  * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức
+ * @property {(on: boolean) => void} [activate]     bật/tắt: đổi uniform, hiện/giấu thanh điều khiển
  * @property {() => void} dispose
  */
 /** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
@@ -174,6 +180,8 @@
  * @property {() => Promise<boolean>} degrade   [3] hạ tay MỘT nấc (DevTools, e2e); false khi hết thang
  * @property {() => Promise<boolean>} upgrade   [3] nâng tay MỘT nấc; false khi không còn nấc nào
  * @property {(cb: (q: object) => void) => () => void} onQuality   [3] báo mỗi lần nấc đổi; trả hàm bỏ nghe
+ * @property {() => { id: string, on: boolean }[]} tools   [4] công cụ học, theo thứ tự engine/tools/index.js
+ * @property {(id: string | null) => Promise<void>} setTool   [4] bật một công cụ (tắt các cái khác), null tắt hết
  */
 
 export {};
```

Run: `npx vitest run tests/unit/toolbox.test.js tests/unit/input.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  626 passed`.

```bash
git add src/engine/contracts/runtime.js src/engine/gpu/input.js src/engine/gpu/scene.js src/engine/gpu/studio.js src/engine/gpu/toolbox.js src/engine/sma.js tests/unit/input.test.js tests/unit/scene.test.js tests/unit/sma.test.js tests/unit/studio.test.js tests/unit/toolbox.test.js
git commit -F - <<'EOF'
feat(engine): hộp đồ nghề (toolbox.js: gắn công cụ, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức); cử chỉ 'hover' và g.pointer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 10: Kính mài và Lột lớp (`engine/tools/`)

**Mục tiêu:** Spec §7 "Kính mài", "Lột lớp", Phụ lục A.45–A.46. Hai công cụ của xưởng, chỉ nhìn view:
- **Kính mài** (`kinh-mai.js`):
  - overlay `lensNode(final, view, { ids, u })` dùng `If` trong `Fn` (không `select()`) để chọn view theo uniform `lens_mode`;
  - hai hình theo uniform `lens_shape`:
    - **tròn** bán kính 18% cạnh ngắn (`LENS_RADIUS`), có viền vàng lá. Máy tính: đi theo chuột (`hover`). Điện thoại và bút: chạm để đặt, giữ rồi kéo để dời. Bấm chuột và vuốt vẫn là của bức (gợn sóng, xoay camera);
    - **gạt**: vạch vàng lá ở `lens_split`; bên trái là view đang soi, bên phải là ảnh cuối. Tay nắm là DOM `role="slider"`: kéo bằng chuột hay ngón tay, mũi tên ±2%, Home/End. Ở hình gạt, canvas không giữ cử chỉ nào;
  - thanh điều khiển: hai nút hình, và nhóm nút view (`aria-pressed`) lấy từ `views()`, bỏ `final`. Chọn view chưa sẵn sàng (Normal) thì hiện "đang mài…" trong vùng `aria-live`, gọi `requireView`, xong mới đổi. Hỏng thì báo và giữ view cũ;
  - NDC của con trỏ (y hướng lên) đổi sang `screenCoordinate` (gốc trên trái, A.45): `(x/2 + 0,5, 0,5 − y/2)`.
- **Lột lớp** (`lot-lop.js`): một `input type="range"`, mỗi nấc một view; nấc phải cùng là ảnh cuối, kéo sang trái thì lột dần về depth. Nhãn và `aria-valuetext` là tên view. Nấc Normal cũng qua "đang mài…". Bật hay tắt công cụ đều về ảnh cuối.
- **`pick.js`**: `pickView(index, ids, view, into)` là chuỗi `If`/`ElseIf` mà hai công cụ dùng chung. Thân nhánh viết trong ngoặc nhọn (A.46).
- `engine/tools/index.js`: `tools = [kinhMai, lotLop]`; `run.js` truyền danh sách này cho cảnh. Chữ ở `t.tools`, `t.views`, `t.toolStatus`; CSS ở `styles/tools.css`, nạp từ `shell.css`.

**Files:**
- Create: `src/engine/tools/index.js`, `src/engine/tools/kinh-mai.js`, `src/engine/tools/lot-lop.js`, `src/engine/tools/pick.js`, `src/styles/tools.css`
- Modify: `src/engine/gpu/run.js`, `src/styles/shell.css`, `src/ui/strings.vi.js`
- Test: Create `tests/unit/kinh-mai.test.js`, `tests/unit/lot-lop.test.js`; Modify `tests/paintings/html.test.js` (tools.css nằm trong danh sách CSS)

**Interfaces:**
- Consumes: `ToolApi`, `ToolInstance`, cử chỉ `hover` (Task 9).
- Produces:
  - `kinh-mai.js`: `id = 'kinh-mai'`, `LENS_RADIUS = 0.18`, `lensNode(final, view, { ids, u })`, `mount(api) → ToolInstance`;
  - `lot-lop.js`: `id = 'lot-lop'`, `peelNode(final, view, { ids, peel })`, `mount(api)`;
  - `pick.js`: `pickView(index, ids, view, into)`; `tools/index.js`: `tools`;
  - chữ: `t.tools['kinh-mai' | 'lot-lop']`, `t.views`, `t.toolStatus.{grinding, failed}`.

- [ ] **Step 1: Test (hỏng: chưa có công cụ)**

Tạo `tests/unit/kinh-mai.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/kinh-mai.test.js — Kính mài: thanh điều khiển (hình, view, tay nắm gạt), mài Normal khi cần, cử chỉ, overlay dựng được.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vec4 } from 'three/tsl';
import * as kinhMai from '../../src/engine/tools/kinh-mai.js';
import t from '../../src/ui/strings.vi.js';

/** ToolApi giả: bốn view (normal chưa sẵn sàng tới khi requireView), ô DOM thật, redraw ghi lại. */
function fakeApi({ requireFails = false } = {}) {
  let normalReady = false;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: normalReady },
    ],
    requireView: vi.fn(async () => {
      if (requireFails) throw new Error('biên dịch hỏng');
      normalReady = true;
    }),
    redraw: vi.fn(async () => {}),
  };
}
const gesture = (kind, pointer, x = 0.5, y = -0.5) => ({ kind, pointer, ndc: { x, y } });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => document.body.replaceChildren());

describe('Kính mài', () => {
  it('thanh điều khiển: hai nút hình (Tròn đang chọn), nút view lấy từ views() bỏ ảnh cuối; tay nắm gạt ẩn khi kính tròn', () => {
    const api = fakeApi();
    kinhMai.mount(api);
    const shapes = [...api.el.querySelectorAll('[data-shape]')];
    expect(shapes.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Tròn', 'true'], ['Gạt', 'false']]);
    expect([...api.el.querySelectorAll('[data-view]')].map((b) => b.dataset.view)).toEqual(['phu-bong:truoc-tone', 'emissive', 'normal']);
    const handle = api.el.querySelector('[role="slider"]');
    expect(handle.hidden).toBe(true);
    expect(handle.getAttribute('aria-label')).toBe(t.tools['kinh-mai'].handle);
    expect(api.el.querySelector('.tool-status').getAttribute('aria-live')).toBe('polite');
  });

  it('overlay dựng được node (If trong Fn; thân Fn chỉ chạy lúc three biên dịch shader)', () => {
    const lens = kinhMai.mount(fakeApi());
    expect(lens.overlay(vec4(0, 0, 0, 1), () => vec4(1, 1, 1, 1)).isNode).toBe(true);
    expect(kinhMai.LENS_RADIUS).toBe(0.18);
  });

  it('cử chỉ: tắt thì không giữ gì; kính tròn đi theo chuột (hover), ngón tay và bút chạm/giữ để đặt kính; chuột bấm, vuốt thì để cho bức', () => {
    const lens = kinhMai.mount(fakeApi());
    expect(lens.onGesture(gesture('hover', 'mouse'))).toBe(false);
    lens.activate(true);
    expect(lens.onGesture(gesture('hover', 'mouse'))).toBe(true);
    expect(lens.onGesture(gesture('tap', 'mouse'))).toBe(false); // gợn sóng như thường
    for (const kind of ['tap', 'hold-start', 'hold-move', 'hold-end']) {
      expect(lens.onGesture(gesture(kind, 'touch')), kind).toBe(true);
    }
    expect(lens.onGesture(gesture('tap', 'pen'))).toBe(true);
    expect(lens.onGesture(gesture('swipe', 'touch'))).toBe(false); // sương xoáy vẫn là của bức
  });

  it('hình gạt: tay nắm hiện; mũi tên ±2%, Home/End; mỗi lần đổi thì vẽ lại; canvas không giữ cử chỉ nào', async () => {
    const api = fakeApi();
    const lens = kinhMai.mount(api);
    lens.activate(true);
    api.el.querySelector('[data-shape="gat"]').click();
    const handle = api.el.querySelector('[role="slider"]');
    expect(handle.hidden).toBe(false);
    expect([handle.getAttribute('aria-valuenow'), handle.getAttribute('aria-valuetext')]).toEqual(['50', '50%']);
    const key = (k) => handle.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    key('ArrowRight');
    expect(handle.getAttribute('aria-valuenow')).toBe('52');
    key('ArrowLeft');
    key('ArrowLeft');
    expect(handle.getAttribute('aria-valuenow')).toBe('48');
    key('Home');
    expect(handle.getAttribute('aria-valuenow')).toBe('0');
    key('End');
    expect(handle.style.getPropertyValue('--split')).toBe('1');
    expect(api.redraw).toHaveBeenCalledTimes(6); // đổi hình + 5 phím
    expect(lens.onGesture(gesture('tap', 'touch'))).toBe(false);
  });

  it('chọn view Normal (chưa sẵn sàng): "đang mài…" trong vùng aria-live, requireView, xong mới đổi; hỏng thì báo và giữ view cũ', async () => {
    const api = fakeApi();
    kinhMai.mount(api).activate(true);
    const status = api.el.querySelector('.tool-status');
    const normal = api.el.querySelector('[data-view="normal"]');
    normal.click();
    expect(status.textContent).toBe(t.toolStatus.grinding);
    expect(normal.getAttribute('aria-pressed')).toBe('false');
    await flush();
    expect(api.requireView).toHaveBeenCalledWith('normal');
    expect(status.textContent).toBe('');
    expect(normal.getAttribute('aria-pressed')).toBe('true');
    const broken = fakeApi({ requireFails: true });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    kinhMai.mount(broken).activate(true);
    broken.el.querySelector('[data-view="normal"]').click();
    await flush();
    expect(broken.el.querySelector('.tool-status').textContent).toBe(t.toolStatus.failed);
    expect(broken.el.querySelector('[data-view="phu-bong:truoc-tone"]').getAttribute('aria-pressed')).toBe('true');
    warn.mockRestore();
  });
});
```

Tạo `tests/unit/lot-lop.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/lot-lop.test.js — Lột lớp: input range đi ngược danh sách view, aria-valuetext là tên view, mài Normal khi cần.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { vec4 } from 'three/tsl';
import * as lotLop from '../../src/engine/tools/lot-lop.js';
import t from '../../src/ui/strings.vi.js';

function fakeApi({ requireFails = false } = {}) {
  let normalReady = false;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [
      { id: 'final', label: 'Ảnh cuối', ready: true },
      { id: 'phu-bong:truoc-tone', label: 'Trước tone', ready: true },
      { id: 'phu-bong:truoc-bloom', label: 'Trước bloom', ready: true },
      { id: 'emissive', label: 'Chỉ emissive', ready: true },
      { id: 'normal', label: 'Normal', ready: normalReady },
      { id: 'depth', label: 'Depth', ready: true },
    ],
    requireView: vi.fn(async () => {
      if (requireFails) throw new Error('biên dịch hỏng');
      normalReady = true;
    }),
    redraw: vi.fn(async () => {}),
  };
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const slide = (range, v) => {
  range.value = String(v);
  range.dispatchEvent(new Event('input', { bubbles: true }));
};

beforeEach(() => document.body.replaceChildren());

describe('Lột lớp', () => {
  it('một input range: sáu nấc cho sáu view, nấc phải cùng là ảnh cuối; nhãn và aria-valuetext là tên view', () => {
    const api = fakeApi();
    const tool = lotLop.mount(api);
    const range = api.el.querySelector('input[type="range"]');
    expect([range.min, range.max, range.step, range.value]).toEqual(['0', '5', '1', '5']);
    expect(range.getAttribute('aria-valuetext')).toBe('Ảnh cuối');
    expect(api.el.querySelector(`label[for="${range.id}"]`).textContent).toBe(t.tools['lot-lop'].label);
    expect(tool.onGesture).toBeUndefined(); // chạm vẫn tạo gợn sóng
    expect(tool.overlay(vec4(0, 0, 0, 1), () => vec4(1)).isNode).toBe(true);
  });

  it('kéo sang trái thì lột dần: mỗi nấc một view, vẽ lại; về nấc phải cùng là ảnh cuối', async () => {
    const api = fakeApi();
    lotLop.mount(api).activate(true);
    const range = api.el.querySelector('input[type="range"]');
    slide(range, 4);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Trước tone');
    expect(api.el.querySelector('output').textContent).toBe('Trước tone');
    slide(range, 0);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Depth');
    slide(range, 5);
    await flush();
    expect(range.getAttribute('aria-valuetext')).toBe('Ảnh cuối');
    expect(api.redraw).toHaveBeenCalledTimes(3);
  });

  it('nấc Normal (chưa sẵn sàng): "đang mài…", requireView rồi mới hiện; hỏng thì báo và quay về view cũ', async () => {
    const api = fakeApi();
    lotLop.mount(api).activate(true);
    const range = api.el.querySelector('input[type="range"]');
    const status = api.el.querySelector('.tool-status');
    slide(range, 1);
    expect(status.textContent).toBe(t.toolStatus.grinding);
    await flush();
    expect(api.requireView).toHaveBeenCalledWith('normal');
    expect([status.textContent, range.getAttribute('aria-valuetext')]).toEqual(['', 'Normal']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const broken = fakeApi({ requireFails: true });
    lotLop.mount(broken).activate(true);
    const r2 = broken.el.querySelector('input[type="range"]');
    slide(r2, 1);
    await flush();
    expect(broken.el.querySelector('.tool-status').textContent).toBe(t.toolStatus.failed);
    expect([r2.value, r2.getAttribute('aria-valuetext')]).toEqual(['5', 'Ảnh cuối']);
    warn.mockRestore();
  });

  it('bật hay tắt công cụ đều về ảnh cuối', async () => {
    const api = fakeApi();
    const tool = lotLop.mount(api);
    tool.activate(true);
    const range = api.el.querySelector('input[type="range"]');
    slide(range, 2);
    await flush();
    tool.activate(false);
    expect([range.value, range.getAttribute('aria-valuetext')]).toEqual(['5', 'Ảnh cuối']);
  });
});
```

Áp vào `tests/paintings/html.test.js`:

```diff
diff --git a/tests/paintings/html.test.js b/tests/paintings/html.test.js
index fa753c9..811ca6d 100644
--- a/tests/paintings/html.test.js
+++ b/tests/paintings/html.test.js
@@ -115,12 +115,13 @@ for (const { meta, page, lang } of paintings) {
 }
 
 describe('styles/shell.css (trang nào cũng dùng)', () => {
-  it('@import tokens.css, notebook.css (GĐ 2) rồi đúng 5 file font theo trọng lượng (spec §5), tất cả trước luật đầu tiên', () => {
+  it('@import tokens.css, notebook.css (GĐ 2), tools.css (GĐ 4) rồi đúng 5 file font theo trọng lượng (spec §5), trước luật đầu tiên', () => {
     const css = readFileSync(ROOT + 'src/styles/shell.css', 'utf8');
     const imports = [...css.matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
     expect(imports).toEqual([
       './tokens.css',
       './notebook.css',
+      './tools.css',
       '@fontsource/cormorant-garamond/500.css',
       '@fontsource/cormorant-garamond/500-italic.css',
       '@fontsource/be-vietnam-pro/400.css',
```

Run: `npx vitest run tests/unit/kinh-mai.test.js tests/unit/lot-lop.test.js tests/paintings/html.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `Error: Failed to resolve import "../../src/engine/tools/kinh-mai.js" from "tests/unit/kinh-mai.test.js". Does the file exist?`.

- [ ] **Step 2: Code**

Tạo `src/engine/tools/pick.js`:

```js
// engine/tools/pick.js — chọn một view theo chỉ số bằng chuỗi If/ElseIf trong Fn (hai công cụ học dùng chung).
import { If } from 'three/tsl';

/**
 * Gán `into` = view thứ `index` (1 → ids[0], 2 → ids[1]…); `index` là uniform, nên đổi view chỉ đổi số, không biên dịch
 * lại. Viết bằng If/ElseIf (không dùng select()): mỗi điểm ảnh chỉ đọc texture của đúng một nhánh (spec Phụ lục A.6).
 * Gọi BÊN TRONG một Fn; `into` là biến đã .toVar().
 * @param {any} index   uniform số (0 thì không gán gì)
 * @param {string[]} ids
 * @param {(id: string) => any} view   node ở không gian hiển thị của một view (views.js)
 * @param {any} into
 */
export function pickView(index, ids, view, into) {
  ids.reduce((chain, id, i) => {
    // Thân nhánh không được trả giá trị: If trong một Fn gọi ngay (inline) mà có return thì three cảnh báo.
    const take = () => {
      into.assign(view(id).rgb);
    };
    return chain ? chain.ElseIf(index.equal(i + 1), take) : If(index.equal(i + 1), take);
  }, null);
}
```

Tạo `src/engine/tools/kinh-mai.js`:

```js
// engine/tools/kinh-mai.js — công cụ Kính mài: soi một view (trước tone, emissive, normal…) qua kính tròn đi theo tay, hay gạt trước/sau.
import { Vector2 } from 'three/webgpu';
import { Fn, If, abs, color, length, min, mix, oneMinus, screenCoordinate, screenSize, smoothstep, step, uniform, vec3, vec4 } from 'three/tsl';
import { h } from '../../ui/dom.js';
import { pickView } from './pick.js';

export const id = 'kinh-mai';

/** Bán kính mặc định của kính tròn: 18% cạnh ngắn của khung (spec §7). */
export const LENS_RADIUS = 0.18;
const SHAPES = ['tron', 'gat']; // chỉ số trong uniform lens_shape
const RIM = '#D4A94A'; // viền vàng lá của bảng sơn mài
const STEP = 0.02; // một lần bấm mũi tên trên tay nắm gạt: 2% chiều ngang
const HOLD = ['tap', 'hold-start', 'hold-move', 'hold-end'];
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/**
 * Overlay của kính: ảnh cuối; trong kính tròn (hay bên TRÁI vạch gạt) là view đang chọn; viền vàng lá.
 * Tính theo điểm ảnh (screenCoordinate: gốc ở góc trên trái trên cả hai backend), nên kính luôn tròn dù khung dẹt.
 * Chọn hình bằng mix theo uniform (0/1), chọn view bằng If: mọi thay đổi chỉ là đổi uniform.
 * @param {any} final
 * @param {(id: string) => any} view
 * @param {{ ids: string[], u: Record<string, any> }} p
 */
export function lensNode(final, view, { ids, u }) {
  return Fn(() => {
    const out = vec3(final.rgb).toVar();
    If(u.mode.greaterThan(0), () => {
      const seen = vec3(out).toVar();
      pickView(u.mode, ids, view, seen);
      const px = screenCoordinate.xy;
      const r = min(screenSize.x, screenSize.y).mul(u.radius);
      const d = length(px.sub(u.pos.mul(screenSize))); // khoảng cách (điểm ảnh) tới tâm kính
      const inCircle = oneMinus(smoothstep(r.sub(1.5), r, d));
      const ringCircle = oneMinus(smoothstep(1, 2.5, abs(d.sub(r))));
      const edge = u.split.mul(screenSize.x);
      const inLeft = oneMinus(step(edge, px.x));
      const ringLine = oneMinus(smoothstep(0.5, 1.5, abs(px.x.sub(edge))));
      const inside = mix(inCircle, inLeft, u.shape);
      const rim = mix(ringCircle, ringLine, u.shape);
      out.assign(mix(mix(out, seen, inside), color(RIM), rim.mul(0.9)));
    });
    return vec4(out, 1);
  })();
}

/**
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const views = api.views().filter((v) => v.id !== 'final'); // view soi được, cố định từ lúc gắn
  const ids = views.map((v) => v.id);
  const u = {
    mode: uniform(0).setName('lens_mode'), // 0: không soi; k: soi ids[k − 1]
    shape: uniform(0).setName('lens_shape'), // 0: tròn, 1: gạt
    pos: uniform(new Vector2(0.5, 0.5)).setName('lens_pos'), // tâm kính, theo khung (0–1, gốc trên trái)
    radius: uniform(LENS_RADIUS).setName('lens_radius'),
    split: uniform(0.5).setName('lens_split'), // vạch gạt, 0–1 theo chiều ngang
  };
  let chosen = 0; // chỉ số (trong ids) của view đang soi; giữ lại qua các lần tắt/bật
  let on = false;

  const status = h(doc, 'p', { class: 'tool-status', 'aria-live': 'polite' });
  const shapeButtons = SHAPES.map((shape, i) => h(doc, 'button', {
    type: 'button', 'data-shape': shape, text: text.shapes[shape], onclick: () => setShape(i),
  }));
  const viewButtons = views.map((v, i) => h(doc, 'button', { type: 'button', 'data-view': v.id, text: v.label, onclick: () => choose(i) }));
  // Tay nắm của hình gạt: phần tử DOM role="slider", nên kéo bằng chuột, ngón tay, bàn phím, và trình đọc màn hình đọc được.
  const handle = h(doc, 'div', {
    class: 'lens-handle', role: 'slider', tabindex: '0', 'aria-label': text.handle, 'aria-valuemin': '0', 'aria-valuemax': '100',
  });
  api.el.append(
    h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
      h(doc, 'div', { class: 'tool-row', role: 'group', 'aria-label': text.shapeLabel }, shapeButtons),
      h(doc, 'div', { class: 'tool-row', role: 'group', 'aria-label': text.viewLabel }, viewButtons),
      status),
    handle,
  );

  const sync = () => {
    shapeButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(u.shape.value === i)));
    viewButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(chosen === i)));
    const pct = Math.round(u.split.value * 100);
    handle.setAttribute('aria-valuenow', String(pct));
    handle.setAttribute('aria-valuetext', `${pct}%`);
    handle.style.setProperty('--split', String(u.split.value));
    handle.hidden = u.shape.value !== 1;
  };
  const setShape = (i) => {
    u.shape.value = i;
    sync();
    return api.redraw();
  };
  const setSplit = (v) => {
    u.split.value = clamp01(v);
    sync();
    return api.redraw();
  };
  /** Chọn view. View chưa sẵn sàng (Normal) thì mài trước: "đang mài…", rồi mới đổi; hỏng thì báo và giữ view cũ. */
  const choose = async (i) => {
    if (!api.views().find((v) => v.id === ids[i])?.ready) {
      status.textContent = t.toolStatus.grinding;
      try {
        await api.requireView(ids[i]);
      } catch (err) {
        console.warn(`Kính mài: không mài được view "${ids[i]}":`, err);
        status.textContent = t.toolStatus.failed;
        return;
      }
      status.textContent = '';
    }
    chosen = i;
    if (on) u.mode.value = i + 1;
    sync();
    await api.redraw();
  };
  const move = (ndc) => u.pos.value.set(ndc.x * 0.5 + 0.5, 0.5 - ndc.y * 0.5); // NDC (y lên) → khung (y xuống)

  handle.addEventListener('keydown', (e) => {
    const keys = { ArrowLeft: -STEP, ArrowDown: -STEP, ArrowRight: STEP, ArrowUp: STEP };
    if (e.key in keys) setSplit(u.split.value + keys[e.key]);
    else if (e.key === 'Home') setSplit(0);
    else if (e.key === 'End') setSplit(1);
    else return;
    e.preventDefault();
  });
  handle.addEventListener('pointerdown', (e) => {
    handle.setPointerCapture?.(e.pointerId);
    setSplit(e.clientX / doc.defaultView.innerWidth);
  });
  handle.addEventListener('pointermove', (e) => {
    if (handle.hasPointerCapture?.(e.pointerId)) setSplit(e.clientX / doc.defaultView.innerWidth);
  });
  sync();

  return {
    overlay: (final, view) => lensNode(final, view, { ids, u }),
    onGesture(g) {
      if (!on || u.shape.value !== 0) return false; // gạt: tay nắm DOM lo, canvas không giữ cử chỉ nào
      if (g.kind === 'hover') {
        move(g.ndc); // máy tính: kính đi theo chuột
        return true;
      }
      // Chạm và giữ của ngón tay, bút: đặt và dời kính. Bấm chuột thì vẫn là của bức (gợn sóng); vuốt, kéo cũng vậy.
      if (g.pointer === 'mouse' || !HOLD.includes(g.kind)) return false;
      move(g.ndc);
      return true;
    },
    activate(value) {
      on = value;
      u.mode.value = on ? chosen + 1 : 0;
      sync();
    },
    dispose() {
      handle.remove();
    },
  };
}
```

Tạo `src/engine/tools/lot-lop.js`:

```js
// engine/tools/lot-lop.js — công cụ Lột lớp: một thanh trượt đi ngược danh sách view, lột dần ảnh cuối về từng bước của pipeline.
import { Fn, uniform, vec3, vec4 } from 'three/tsl';
import { h } from '../../ui/dom.js';
import { pickView } from './pick.js';

export const id = 'lot-lop';

/** Overlay: cả khung là view thứ `peel` (0 là ảnh cuối, tức không đổi gì). */
export function peelNode(final, view, { ids, peel }) {
  return Fn(() => {
    const out = vec3(final.rgb).toVar();
    pickView(peel, ids, view, out);
    return vec4(out, 1);
  })();
}

/**
 * Thanh là một input type="range": số nấc bằng số view (Bức 1 có sáu), nấc bên PHẢI cùng là ảnh cuối, kéo sang trái
 * là lột dần về trước; aria-valuetext là tên view, phím mũi tên đi từng nấc. Lột lớp không giữ cử chỉ nào trên canvas:
 * chạm vẫn tạo gợn sóng, để người xem thấy gợn sóng hiện ra trong ảnh Normal hay Depth.
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const views = api.views(); // views[0] là ảnh cuối
  const last = views.length - 1;
  const ids = views.slice(1).map((v) => v.id);
  const peel = uniform(0).setName('peel_view');
  let at = 0; // view đang hiện (chỉ số trong views)

  const range = h(doc, 'input', {
    type: 'range', id: 'lot-lop-range', min: '0', max: String(last), step: '1', value: String(last),
  });
  const shown = h(doc, 'output', { for: 'lot-lop-range', class: 'tool-value' });
  const status = h(doc, 'p', { class: 'tool-status', 'aria-live': 'polite' });
  api.el.append(h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
    h(doc, 'div', { class: 'tool-row' }, h(doc, 'label', { for: 'lot-lop-range', text: text.label }), range, shown),
    status));

  const sync = () => {
    range.value = String(last - at);
    range.setAttribute('aria-valuetext', views[at].label);
    shown.textContent = views[at].label;
  };
  /** Hiện view thứ k. View chưa sẵn sàng (Normal) thì mài trước; hỏng thì báo và quay về view cũ. */
  const show = async (k) => {
    if (!api.views()[k].ready) {
      status.textContent = t.toolStatus.grinding;
      try {
        await api.requireView(views[k].id);
      } catch (err) {
        console.warn(`Lột lớp: không mài được view "${views[k].id}":`, err);
        status.textContent = t.toolStatus.failed;
        sync();
        return;
      }
      status.textContent = '';
    }
    at = k;
    peel.value = k;
    sync();
    await api.redraw();
  };
  range.addEventListener('input', () => show(last - Number(range.value)));
  sync();

  return {
    overlay: (final, view) => peelNode(final, view, { ids, peel }),
    /** Bật hay tắt đều bắt đầu lại từ ảnh cuối: tắt thì không còn gì phủ lên tranh. */
    activate() {
      at = 0;
      peel.value = 0;
      sync();
    },
    dispose() {},
  };
}
```

Tạo `src/engine/tools/index.js`:

```js
// engine/tools/index.js — các công cụ học của xưởng, theo thứ tự trên mục "Đồ nghề". Thêm một công cụ = thêm một dòng.
import * as kinhMai from './kinh-mai.js';
import * as lotLop from './lot-lop.js';

/** @type {import('../contracts/runtime.js').Tool[]} */
export const tools = [kinhMai, lotLop];
```

Tạo `src/styles/tools.css`:

```css
/* styles/tools.css — thanh điều khiển của công cụ học (Kính mài, Lột lớp) và tay nắm của hình gạt; màu từ bảng sơn mài. */

/* Thanh công cụ: máy tính ở giữa đáy tranh, điện thoại ngay trên dải thanh lớp.
   KHÔNG đặt transform hay backdrop-filter lên .toolbar và .tool: cả hai tạo containing block cho con position: fixed,
   và tay nắm gạt (con của .tool) phải đo theo cả khung nhìn. Nền mờ đặt ở .tool-panel. */
.toolbar {
  position: fixed;
  z-index: 2;
  left: 0;
  right: 0;
  bottom: calc(var(--gutter) + 8px);
  display: flex;
  justify-content: center;
  pointer-events: none; /* chỗ trống hai bên thanh vẫn là của canvas */
}
.tool-panel {
  max-width: min(560px, calc(100vw - 2 * var(--gutter)));
  padding: 10px 12px;
  color: var(--nga);
  background: var(--veil-strong);
  border: 1px solid color-mix(in srgb, var(--vang-la) 35%, transparent);
  border-radius: 14px;
  box-shadow: 0 8px 32px color-mix(in srgb, var(--den-then) 70%, transparent);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  pointer-events: auto;
}
.tool-panel > * + * { margin-top: 8px; }
.tool-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.tool-panel button {
  padding: 5px 12px;
  font: 600 12px/1.3 var(--sans);
  color: var(--bac-la);
  background: none;
  border: 1px solid color-mix(in srgb, var(--bac-la) 35%, transparent);
  border-radius: 999px;
  cursor: pointer;
}
.tool-panel button[aria-pressed='true'] { color: var(--den-then); background: var(--vang-la); border-color: var(--vang-la); }
.tool-panel :focus-visible,
.lens-handle:focus-visible { outline: 2px solid var(--vang-la-sang); outline-offset: 2px; }
.tool-panel label { font: 600 12px/1.3 var(--sans); color: var(--vang-la); }
.tool-panel input[type='range'] { width: min(260px, 50vw); accent-color: var(--vang-la); }
.tool-value { min-width: 7em; font: 400 12px/1.3 var(--mono); color: var(--vang-la-sang); }
/* Vùng aria-live: luôn có mặt, trống thì thu lại (không dùng hidden hay display: none). */
.tool-status { margin: 0; font-size: 12px; color: var(--vang-la-sang); }
.tool-panel > .tool-status:empty { margin-top: 0; }

/* Tay nắm của hình gạt: một dải dọc cả khung ở vị trí --split (0–1); vạch vàng lá ở giữa, núm tròn ở giữa chiều cao.
   Kéo bằng chuột hay ngón tay (touch-action: none để trình duyệt không cuộn trang thay vì kéo). */
.lens-handle {
  position: fixed;
  top: 0;
  bottom: 0;
  left: calc(var(--split, 0.5) * 100%);
  width: 32px;
  margin-left: -16px;
  cursor: ew-resize;
  touch-action: none;
  pointer-events: auto;
}
.lens-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 22px;
  height: 22px;
  margin: -11px 0 0 -11px;
  background: var(--vang-la);
  border: 2px solid var(--den-then);
  border-radius: 50%;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--den-then) 60%, transparent);
}

/* Công cụ đang bật: thơ và con dấu ở chân tranh nhường chỗ cho thanh điều khiển (tắt công cụ thì hiện lại). */
body[data-tool] .foot { visibility: hidden; }

/* Điện thoại: thanh công cụ ngay trên dải thanh lớp (68px); Sổ tay thu lại khi một công cụ bật, để chừa chỗ nhìn cảnh. */
@media (max-width: 640px) {
  .toolbar { bottom: 76px; padding: 0 8px; }
  .tool-panel { max-width: 100%; }
  body[data-tool] .notebook { display: none; }
}
```

Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index bf57b88..d3dc9d4 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -6,6 +6,7 @@
    và thiếu phần Latin cơ bản. */
 @import './tokens.css';
 @import './notebook.css';
+@import './tools.css';
 @import '@fontsource/cormorant-garamond/500.css';
 @import '@fontsource/cormorant-garamond/500-italic.css';
 @import '@fontsource/be-vietnam-pro/400.css';
```

Áp vào `src/ui/strings.vi.js`:

```diff
diff --git a/src/ui/strings.vi.js b/src/ui/strings.vi.js
index c779831..d469d60 100644
--- a/src/ui/strings.vi.js
+++ b/src/ui/strings.vi.js
@@ -1,4 +1,4 @@
-// ui/strings.vi.js — Chữ tiếng Việt của xưởng: tầng, tầng tĩnh, lời mời, thanh lớp, Sổ tay, mất GPU, tháng/can/chi, con dấu.
+// ui/strings.vi.js — Chữ tiếng Việt của xưởng: tầng, tầng tĩnh, lời mời, thanh lớp, công cụ học, Sổ tay, mất GPU, tháng/can/chi, con dấu.
 //
 // Quy ước: file này KHÔNG import gì và không file nào trong src/ import nó. Chỉ trang HTML import rồi
 // truyền `t` vào boot(); engine/ và ui/ nhận `t` qua tham số. Thêm ngôn ngữ = thêm strings.<lang>.js cùng bộ khóa.
@@ -80,6 +80,24 @@ const t = {
     next: (name) => `Phủ lớp tiếp theo · ${name}`,
     close: 'Đóng thanh lớp, xem lại bức tranh',
   },
+  /** Công cụ học (GĐ 4): tên trên nút "Đồ nghề" của thanh lớp, và chữ trên thanh điều khiển của từng công cụ. */
+  tools: {
+    'kinh-mai': {
+      name: 'Kính mài',
+      shapeLabel: 'Hình kính',
+      shapes: { tron: 'Tròn', gat: 'Gạt' },
+      viewLabel: 'Soi qua kính',
+      handle: 'Vạch gạt: bên trái là ảnh đang soi, bên phải là ảnh cuối',
+    },
+    'lot-lop': {
+      name: 'Lột lớp',
+      label: 'Lột dần ảnh',
+    },
+  },
+  /** Các view của xưởng mà công cụ nhìn được; tap của lớp lấy nhãn ở content của lớp. */
+  views: { final: 'Ảnh cuối', emissive: 'Chỉ emissive', normal: 'Normal', depth: 'Depth' },
+  /** Dòng trạng thái (aria-live) trên thanh công cụ: view Normal phải biên dịch lại một lần. */
+  toolStatus: { grinding: 'đang mài…', failed: 'Không mài được view này; vẫn giữ view cũ.' },
   /** Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá. */
   notebook: {
     label: 'Sổ tay',
```

Áp vào `src/engine/gpu/run.js`:

```diff
diff --git a/src/engine/gpu/run.js b/src/engine/gpu/run.js
index 8dfa4ae..f25af10 100644
--- a/src/engine/gpu/run.js
+++ b/src/engine/gpu/run.js
@@ -7,6 +7,7 @@ import { createDisposer } from './disposer.js';
 import { buildScene } from './scene.js';
 import { createFailCounter, createBurstCounter } from './guards.js';
 import { openDebug } from './debug.js';
+import { tools } from '../tools/index.js';
 import { createFrameCap } from './clock.js';
 import { mountWorkshop } from '../../ui/workshop.js';
 
@@ -117,7 +118,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
       console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
       if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
     });
-    const scene = buildScene({ stage, disposer: d, painting, meta, flags, now, reducedMotion, win });
+    const scene = buildScene({ stage, disposer: d, painting, meta, flags, now, reducedMotion, win, tools, t, content });
     sma.set({ backend: stage.backend, level: scene.level });
     if (snapshot) await scene.studio.restore(snapshot);
```

Run: `npx vitest run tests/unit/kinh-mai.test.js tests/unit/lot-lop.test.js tests/paintings/html.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  635 passed`.

```bash
git add src/engine/gpu/run.js src/engine/tools/index.js src/engine/tools/kinh-mai.js src/engine/tools/lot-lop.js src/engine/tools/pick.js src/styles/shell.css src/styles/tools.css src/ui/strings.vi.js tests/paintings/html.test.js tests/unit/kinh-mai.test.js tests/unit/lot-lop.test.js
git commit -F - <<'EOF'
feat(engine): công cụ học Kính mài (tròn đi theo tay, gạt trước/sau có tay nắm role="slider") và Lột lớp (input range sáu nấc)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 11: Dial, núm của cả bức (`engine/gpu/dial-set.js`); thanh giờ của Bức 1

**Mục tiêu:** Spec §8.4 `Dial`, §6 (giờ của đêm).
- `createDialSet(setup().dials)`: đọc/ghi Dial. `set` kẹp theo min/max rồi làm tròn về `step`, và đổi `.value` của CHÍNH uniform đó. `list()` cho khoảng giá trị, giá trị, chữ (`format`, cũng là `aria-valuetext`) và khóa ghi chú (`note()`). `snapshot()`/`restore()` là `{ dialId: số }`; Dial lạ hay giá trị hỏng thì bỏ qua kèm cảnh báo. Khai báo trùng id thì ném lỗi.
- Bàn thợ: `dials()`, `setDial(id, v)` (vẽ lại sau khi đổi). `snapshot()` có `dials` khi bức có Dial, nên dựng lại cảnh sau khi mất GPU vẫn giữ giờ đang chọn.
- **Bức 1:** `shared.js` khai báo Dial `gio` (uniform `hour`, 18 → 29,5, bước 0,25, `format` ra "21:00"). Trang mở lúc ban ngày thì cảnh lấy giờ mặc định, và ghi chú `'daytime'` nói điều đó cho tới khi người xem kéo thanh. Chữ ở `content.vi.js › dials.gio`. Test hợp đồng: id kebab-case không trùng, min < max, `format` ra chuỗi, có nhãn, mọi khóa mà `note()` trả ra đều có chữ.

**Files:**
- Create: `src/engine/gpu/dial-set.js`
- Modify: `src/engine/contracts/runtime.js`, `src/engine/gpu/scene.js`, `src/engine/gpu/studio.js`, `src/engine/sma.js`, `src/paintings/ao-sen-dem/shared.js`, `src/paintings/ao-sen-dem/content.vi.js`
- Test: Create `tests/unit/dial-set.test.js`; Modify `tests/unit/studio.test.js`, `tests/unit/sma.test.js`, `tests/paintings/contract.test.js`, `tests/paintings/ao-sen-dem/shared.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - `createDialSet(dials) → { list(), set(id, v), snapshot(), restore(values), size }`; `list() → { id, min, max, step, value, text, note: string | null }[]`;
  - `studio.dials()`, `studio.setDial(id, v) → Promise<void>`; `Snapshot.dials`; `__sma.dials()`, `__sma.setDial(id, v)`;
  - Bức 1: `formatHour(h)` và `dials` trong `setup()` của `shared.js`.

- [ ] **Step 1: Test (hỏng: chưa có `dial-set.js`, Bức 1 chưa khai báo Dial)**

Tạo `tests/unit/dial-set.test.js`:

```js
// tests/unit/dial-set.test.js — Dial của bức: kẹp theo min/max, làm tròn theo step, chữ giá trị, ghi chú, snapshot/restore.
import { describe, it, expect, vi } from 'vitest';
import { uniform } from 'three/tsl';
import { createDialSet } from '../../src/engine/gpu/dial-set.js';

const pad = (n) => String(n).padStart(2, '0');
/** Một Dial giống thanh giờ: 18 → 29,5, bước 15 phút, ghi "hh:mm", có ghi chú khi còn ở giá trị đầu. */
function gio() {
  const u = uniform(21);
  return {
    u,
    dial: {
      id: 'gio', uniform: u, min: 18, max: 29.5, step: 0.25,
      format: (v) => `${pad(Math.floor(v) % 24)}:${pad(Math.round((v % 1) * 60))}`,
      note: () => (u.value === 21 ? 'daytime' : null),
    },
  };
}

describe('createDialSet', () => {
  it('list(): khoảng giá trị, giá trị hiện tại, chữ (format), khóa ghi chú', () => {
    const { dial } = gio();
    const dials = createDialSet([dial]);
    expect(dials.size).toBe(1);
    expect(dials.list()).toEqual([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }]);
  });

  it('set(): đổi .value của CHÍNH uniform đó; kẹp theo min/max; làm tròn về bước 0,25; ghi chú theo note()', () => {
    const { u, dial } = gio();
    const dials = createDialSet([dial]);
    dials.set('gio', 26.1);
    expect(u.value).toBe(26);
    expect(dials.list()[0]).toMatchObject({ text: '02:00', note: null });
    dials.set('gio', 99);
    expect([u.value, dials.list()[0].text]).toEqual([29.5, '05:30']);
    dials.set('gio', '18.4');
    expect(u.value).toBe(18.5);
    expect(() => dials.set('gio', 'abc')).toThrow('Dial "gio": "abc" không phải số');
    expect(() => dials.set('mua', 1)).toThrow('Bức không có Dial "mua"');
  });

  it('không có format thì chữ là số; khai báo trùng id thì ném lỗi; bức không có Dial thì rỗng', () => {
    const plain = createDialSet([{ id: 'a', uniform: uniform(0.5), min: 0, max: 1, step: 0 }]);
    expect(plain.list()[0]).toMatchObject({ text: '0.5', note: null });
    expect(() => createDialSet([gio().dial, gio().dial])).toThrow('Bức khai báo Dial "gio" hai lần');
    const none = createDialSet();
    expect([none.size, none.list(), none.snapshot()]).toEqual([0, [], {}]);
  });

  it('snapshot/restore: { dialId: số }; Dial lạ hay giá trị hỏng thì bỏ qua kèm cảnh báo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = gio();
    const dials = createDialSet([a.dial]);
    dials.set('gio', 27);
    expect(dials.snapshot()).toEqual({ gio: 27 });
    const b = gio();
    const again = createDialSet([b.dial]);
    again.restore({ gio: 27, mua: 3 });
    again.restore({ gio: 'hỏng' });
    expect(b.u.value).toBe(27);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
```

Áp vào `tests/unit/studio.test.js`:

```diff
diff --git a/tests/unit/studio.test.js b/tests/unit/studio.test.js
index e4b1497..25e53fe 100644
--- a/tests/unit/studio.test.js
+++ b/tests/unit/studio.test.js
@@ -2,12 +2,14 @@
 import { describe, it, expect, vi } from 'vitest';
 import { buildLayers, createWeights } from '../../src/engine/gpu/layers.js';
 import { createStudio } from '../../src/engine/gpu/studio.js';
+import { createDialSet } from '../../src/engine/gpu/dial-set.js';
+import { uniform } from 'three/tsl';
 
 const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
 const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }] };
 
 /** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm (một kiểu compare) và số đo. */
-function setup({ tier = 'webgl2', quality, toolbox } = {}) {
+function setup({ tier = 'webgl2', quality, toolbox, dials } = {}) {
   const log = [];
   const cot = {
     id: 'cot',
@@ -35,7 +37,7 @@ function setup({ tier = 'webgl2', quality, toolbox } = {}) {
   const weights = createWeights(meta.layers);
   const layers = buildLayers([cot, two], {}, {}, { ...env, tier });
   const redraw = vi.fn();
-  const studio = createStudio({ meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality, toolbox });
+  const studio = createStudio({ meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality, toolbox, dials });
   return { studio, weights, layers, redraw, log };
 }
 
@@ -195,6 +197,23 @@ describe('createStudio', () => {
     await expect(bare.setTool(null)).resolves.toBeUndefined();
   });
 
+  it('Dial (GĐ 4): dials() đọc, setDial() kẹp rồi vẽ lại; snapshot có dials (bức không có Dial thì không có khóa này); restore đem về', async () => {
+    const hour = uniform(21);
+    const dials = createDialSet([{ id: 'gio', uniform: hour, min: 18, max: 29.5, step: 0.25, format: (v) => `${v}h` }]);
+    const { studio, redraw } = setup({ dials });
+    expect(studio.dials()).toEqual([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21h', note: null }]);
+    await studio.setDial('gio', 40);
+    expect(hour.value).toBe(29.5);
+    expect(redraw).toHaveBeenCalledTimes(1);
+    const snap = studio.snapshot();
+    expect(snap.dials).toEqual({ gio: 29.5 });
+    hour.value = 18;
+    await studio.restore(snap);
+    expect(hour.value).toBe(29.5);
+    expect(setup().studio.snapshot()).not.toHaveProperty('dials');
+    await expect(setup().studio.setDial('gio', 20)).rejects.toThrow('Bức không có Dial "gio"');
+  });
+
   it('snapshot → JSON gọn: trọng số lấy ĐÍCH của tween, núm theo địa chỉ "layerId.knobId"', () => {
     const { studio } = setup();
     studio.setWeight('lop-hai', 0, { tween: true });
```

Áp vào `tests/unit/sma.test.js`:

```diff
diff --git a/tests/unit/sma.test.js b/tests/unit/sma.test.js
index 88161b3..88c88fd 100644
--- a/tests/unit/sma.test.js
+++ b/tests/unit/sma.test.js
@@ -55,7 +55,7 @@ describe('studioApi (GĐ 4): các hàm của bàn thợ mà __sma lộ ra', () =
     let studio = null;
     const api = studioApi(() => studio);
     expect([api.layers(), api.snapshot(), api.quality(), api.stats(), api.setWeight('x', 0)]).toEqual([[], null, null, null, undefined]);
-    expect([api.tools(), api.setTool('kinh')]).toEqual([[], undefined]);
+    expect([api.tools(), api.setTool('kinh'), api.dials(), api.setDial('gio', 27)]).toEqual([[], undefined, [], undefined]);
     studio = {
       layers: () => [{ id: 'cot', name: 'Cốt', knobs: [] }],
       weight: () => ({ value: 1, target: 1 }),
```

Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index d1c3f67..749eb1d 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -6,7 +6,7 @@ import { paintings } from '../../src/paintings/registry.js';
 import mau from '../../src/paintings/_mau/meta.js';
 import { mergePalette } from '../../src/engine/palette.js';
 import { hasCode } from '../../src/ui/code-view.js';
-import { buildPainting } from '../helpers/fake-ctx.js';
+import { NOW, buildPainting } from '../helpers/fake-ctx.js';
 import { svgColors } from '../helpers/svg.js';
 
 const SRC = resolve(import.meta.dirname, '../../src');
@@ -163,6 +163,35 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
     }
   });
 
+  it('Dial (nếu có): id kebab-case, không trùng; min < max; format ra chuỗi; có nhãn; mọi khóa note() trả ra đều có chữ', async () => {
+    const { painting } = await loadPainting();
+    // Ban đêm và ban ngày: note() có thể khác nhau (Bức 1 ghi chú 'daytime' khi mượn giờ).
+    for (const now of [NOW, new Date('2026-09-28T12:00:00+07:00')]) {
+      const { setup } = buildPainting(painting, meta, { now });
+      const dials = setup?.dials ?? [];
+      const ids = dials.map((d) => d.id);
+      expect(new Set(ids).size, `Dial trùng id: ${ids.join(', ')}`).toBe(ids.length);
+      for (const dial of dials) {
+        expect(dial.id, `id Dial "${dial.id}"`).toMatch(KEBAB);
+        expect(dial.min, `Dial "${dial.id}": min < max`).toBeLessThan(dial.max);
+        expect(dial.uniform?.isNode, `Dial "${dial.id}" thiếu uniform`).toBe(true);
+        if (dial.format) for (const v of [dial.min, dial.max]) expect(typeof dial.format(v), `format(${v})`).toBe('string');
+        for (const lang of langs) {
+          const { default: content } = await entry.content[lang]();
+          const text = content.dials?.[dial.id];
+          expect(text?.label, `${lang}: thiếu content.dials["${dial.id}"].label`).toBeTruthy();
+          for (const v of [dial.uniform.value, dial.min, dial.max]) {
+            const before = dial.uniform.value;
+            dial.uniform.value = v;
+            const key = dial.note?.() ?? null;
+            dial.uniform.value = before;
+            if (key !== null) expect(text.notes?.[key], `${lang}: thiếu chữ ghi chú "${dial.id}.${key}"`).toBeTruthy();
+          }
+        }
+      }
+    }
+  });
+
   describe('chữ (content) theo từng ngôn ngữ', () => {
     const palette = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));
```

Áp vào `tests/paintings/ao-sen-dem/shared.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/shared.test.js b/tests/paintings/ao-sen-dem/shared.test.js
index 5ed99af..f90df8e 100644
--- a/tests/paintings/ao-sen-dem/shared.test.js
+++ b/tests/paintings/ao-sen-dem/shared.test.js
@@ -7,6 +7,7 @@ import {
   RIPPLE_SLOTS,
   createRipples,
   defaultHour,
+  formatHour,
   makeRippleHeight,
   moonDirection,
   setup,
@@ -171,3 +172,30 @@ describe('setup(ctx)', () => {
     expect(s.shared.moon.dir.value.toArray()).toEqual(moonDirection(26));
   });
 });
+
+describe('thanh giờ (Dial "gio", GĐ 4)', () => {
+  it('formatHour: thang 18 → 29,5 ra "hh:mm"; quá 24 giờ là sáng hôm sau', () => {
+    expect([formatHour(18), formatHour(21), formatHour(23.75), formatHour(26.25), formatHour(29.5)])
+      .toEqual(['18:00', '21:00', '23:45', '02:15', '05:30']);
+  });
+
+  it('setup().dials: một Dial trên đúng uniform giờ; 18 → 29,5, bước 15 phút', () => {
+    const s = setup(makeEngineCtx(meta));
+    const [gio] = s.dials;
+    expect(gio).toMatchObject({ id: 'gio', min: 18, max: 29.5, step: 0.25 });
+    expect(gio.uniform).toBe(s.shared.hour);
+    expect([gio.format(gio.min), gio.format(gio.max)]).toEqual(['18:00', '05:30']);
+  });
+
+  it('ghi chú "daytime" chỉ khi đang là ban ngày VÀ thanh còn ở giá trị mặc định; đêm thì không bao giờ', () => {
+    const day = setup(makeEngineCtx(meta, { now: vn('2026-09-28T12:00') }));
+    const [gio] = day.dials;
+    expect(gio.note()).toBe('daytime');
+    gio.uniform.value = 27; // người xem kéo thanh
+    expect(gio.note()).toBeNull();
+    gio.uniform.value = 21; // kéo về đúng 21:00 thì lời nhắc quay lại (vẫn là giờ mượn)
+    expect(gio.note()).toBe('daytime');
+    const night = setup(makeEngineCtx(meta, { now: NOW }));
+    expect(night.dials[0].note()).toBeNull();
+  });
+});
```

Run: `npx vitest run tests/unit/dial-set.test.js tests/unit/studio.test.js tests/unit/sma.test.js tests/paintings/contract.test.js tests/paintings/ao-sen-dem/shared.test.js`
Kết quả mong đợi: FAIL, 4 test hỏng; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/gpu/dial-set.js' imported from tests/unit/dial-set.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/dial-set.js`:

```js
// engine/gpu/dial-set.js — núm của cả bức (Dial): đọc/ghi uniform (kẹp min/max, làm tròn theo step), chữ giá trị, ghi chú, snapshot.

/**
 * Xưởng không biết Dial nghĩa là gì (giờ của Bức 1, mùa của một bức khác…): nó chỉ biết một uniform, khoảng giá trị,
 * cách ghi chữ (`format`) và khóa ghi chú (`note`). Đổi Dial chỉ đổi `.value` của uniform: không biên dịch lại.
 * @param {import('../contracts/runtime.js').Dial[]} [dials]  setup().dials của bức
 */
export function createDialSet(dials = []) {
  const byId = new Map();
  for (const dial of dials) {
    if (byId.has(dial.id)) throw new Error(`Bức khai báo Dial "${dial.id}" hai lần`);
    byId.set(dial.id, dial);
  }
  const dialOf = (id) => {
    const dial = byId.get(id);
    if (!dial) throw new Error(`Bức không có Dial "${id}"`);
    return dial;
  };
  /** Kẹp trong [min, max], rồi về nấc gần nhất tính từ min (0,25 giờ là 15 phút). */
  const snap = (dial, raw) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`Dial "${dial.id}": "${raw}" không phải số`);
    const clamped = Math.min(Math.max(v, dial.min), dial.max);
    if (!dial.step) return clamped;
    const stepped = dial.min + Math.round((clamped - dial.min) / dial.step) * dial.step;
    return Math.min(Number(stepped.toFixed(6)), dial.max);
  };
  const set = (id, v) => {
    const dial = dialOf(id);
    dial.uniform.value = snap(dial, v);
  };

  return {
    /** Mỗi Dial: khoảng giá trị, giá trị hiện tại, chữ của nó (cũng là aria-valuetext) và khóa ghi chú (null: không có). */
    list: () => [...byId.values()].map((d) => ({
      id: d.id,
      min: d.min,
      max: d.max,
      step: d.step,
      value: d.uniform.value,
      text: d.format ? d.format(d.uniform.value) : String(d.uniform.value),
      note: d.note?.() ?? null,
    })),
    set,
    /** { dialId: số } cho snapshot của tác phẩm. */
    snapshot: () => Object.fromEntries([...byId.values()].map((d) => [d.id, d.uniform.value])),
    /** Áp lại snapshot; Dial lạ hay giá trị hỏng thì bỏ qua kèm cảnh báo ("Dựng lại cảnh" không vì thế mà về tĩnh). */
    restore(values = {}) {
      for (const [id, v] of Object.entries(values)) {
        try {
          set(id, v);
        } catch (err) {
          console.warn(`restore: bỏ qua Dial "${id}":`, err.message);
        }
      }
    },
    get size() {
      return byId.size;
    },
  };
}
```

Áp vào `src/engine/gpu/studio.js`:

```diff
diff --git a/src/engine/gpu/studio.js b/src/engine/gpu/studio.js
index 835aff3..0b5c0b3 100644
--- a/src/engine/gpu/studio.js
+++ b/src/engine/gpu/studio.js
@@ -2,6 +2,7 @@
 import { knobMax } from './knob-set.js';
 import { TWEEN_SECONDS } from './layers.js';
 import { createMeter } from './meter.js';
+import { createDialSet } from './dial-set.js';
 
 /** Cảnh không có hộp đồ nghề (test): không có công cụ nào. */
 const NO_TOOLS = Object.freeze({
@@ -36,10 +37,12 @@ const NO_QUALITY = Object.freeze({
  * @param {{ state: () => object, degrade: () => boolean, upgrade: () => boolean, onChange: (cb: Function) => Function }} [p.quality]
  *   bộ điều chỉnh của cảnh (scene.js): mức, nấc đang hạ, hạ/nâng tay một nấc
  * @param {{ list: () => { id: string, on: boolean }[], set: (id: string | null) => void }} [p.toolbox]  công cụ học (toolbox.js)
+ * @param {ReturnType<typeof createDialSet>} [p.dials]   núm của cả bức (dial-set.js)
  * @returns {ReturnType<typeof createMeter> & object}  measure() và gpu() của bộ đo: scene.js đưa số vào mỗi khung
  */
 export function createStudio({
   meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY, toolbox = NO_TOOLS,
+  dials = createDialSet(),
 }) {
   const byId = new Map(layers.map((b) => [b.id, b]));
   const names = new Map(meta.layers.map((l) => [l.id, l.name]));
@@ -173,24 +176,34 @@ export function createStudio({
       return settle(() => toolbox.set(id));
     },
 
+    /** Núm của cả bức (GĐ 4): [{ id, min, max, step, value, text, note }] (text cũng là aria-valuetext của thanh trượt). */
+    dials: () => dials.list(),
+    /** Đổi một Dial (kẹp theo min/max/step); xong khi khung đã vẽ lại. */
+    setDial(id, v) {
+      return settle(() => dials.set(id, v));
+    },
+
     /**
-     * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }.
-     * Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
+     * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }, và (GĐ 4)
+     * dials: { dialId: số } khi bức có Dial. Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
      */
     snapshot() {
       const knobs = {};
       for (const { id, knobs: set } of layers) {
         for (const [knobId, value] of Object.entries(set.values())) knobs[`${id}.${knobId}`] = value;
       }
-      return { weights: Object.fromEntries(weights.ids.map((id) => [id, weights.target(id)])), knobs };
+      const snap = { weights: Object.fromEntries(weights.ids.map((id) => [id, weights.target(id)])), knobs };
+      if (dials.size > 0) snap.dials = dials.snapshot();
+      return snap;
     },
     /**
      * Áp lại một snapshot: trọng số đặt ngay; núm nào khác giá trị hiện tại thì set (chờ lần lượt, vì núm
      * 'rebuild' có thể dựng lại hình). Id lạ (lớp hay núm không còn) hay núm áp không được thì bỏ qua kèm cảnh báo:
      * "Dựng lại cảnh" gọi hàm này, và một núm hỏng không được kéo cả cảnh về tầng tĩnh (spec §9).
      */
-    async restore({ weights: w = {}, knobs = {} } = {}) {
+    async restore({ weights: w = {}, knobs = {}, dials: dialValues = {} } = {}) {
       try {
+        dials.restore(dialValues);
         for (const [id, v] of Object.entries(w)) {
           if (byId.has(id)) weights.set(id, v);
           else console.warn(`restore: bỏ qua trọng số của lớp lạ "${id}"`);
```

Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index e8b2649..3007dd5 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -8,6 +8,7 @@ import { createLadder } from './ladder.js';
 import { createStudio } from './studio.js';
 import { createInput } from './input.js';
 import { createToolbox } from './toolbox.js';
+import { createDialSet } from './dial-set.js';
 
 /**
  * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU) + bộ đo GPU (gpu-timer).
@@ -179,6 +180,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     redraw,
     quality,
     toolbox,
+    dials: createDialSet(setup?.dials ?? []), // núm của cả bức (Bức 1: thanh giờ)
   });
 
   return {
```

Áp vào `src/engine/sma.js`:

```diff
diff --git a/src/engine/sma.js b/src/engine/sma.js
index 98a1b1a..5784fde 100644
--- a/src/engine/sma.js
+++ b/src/engine/sma.js
@@ -9,7 +9,7 @@
  * `snapshot()`, `restore(s)`. Mở DevTools gõ `__sma.setWeight('<id lớp>', 0)` là mài được một lớp.
  * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
  * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu`, `quality().locked`, `tools()` và
- * `setTool(id | null)` (bật một công cụ học, hay tắt hết).
+ * `setTool(id | null)` (bật một công cụ học, hay tắt hết), `dials()` và `setDial(id, v)` (núm của cả bức, ví dụ giờ).
  *
  * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
  * @param {Window | Record<string, any>} win
@@ -67,5 +67,7 @@ export function studioApi(getStudio) {
     stats: () => s()?.stats() ?? null,
     tools: () => s()?.tools() ?? [],
     setTool: (id) => s()?.setTool(id),
+    dials: () => s()?.dials() ?? [],
+    setDial: (id, v) => s()?.setDial(id, v),
   };
 }
```

Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index f685d02..4c206e7 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -10,7 +10,7 @@
  * @property {object} [shared]          object dùng chung trong bức (thiếu thì xưởng tạo {}) → tham số thứ 2 của createLayer
  * @property {Dial[]} [dials]           [4] núm của CẢ BỨC (Bức 1: 'gio'); xưởng vẽ thanh trượt
  * @property {(g: Gesture) => void} [onGesture]   cử chỉ mà không công cụ nào dùng
- * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp
+ * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp. [4] update(0, t) như Layer.update
  * @property {() => void} [dispose]     gọi 2 lần vẫn an toàn
  */
 /** Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn.
@@ -100,7 +100,7 @@
  * @property {number} min
  * @property {number} max
  * @property {number} step
- * @property {(v: number) => string} [format]   29.5 → '05:30'
+ * @property {(v: number) => string} [format]   29.5 → '05:30'; [4] cũng là aria-valuetext của thanh trượt
  * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
  */
 /** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
@@ -153,8 +153,9 @@
  */
 /** @typedef {EngineCtx & LayerCtxExtra} LayerCtx   [0] */
 
-/** Trạng thái tác phẩm dạng JSON (spec §16): trọng số và núm khác mặc định; GĐ 4 thêm dials.
- * @typedef {{ weights: Record<string, number>, knobs: Record<string, any> }} Snapshot   [2] khóa núm là 'layerId.knobId'
+/** Trạng thái tác phẩm dạng JSON (spec §16): trọng số và núm; [4] dials: { dialId: số } (bức không có Dial thì bỏ trống).
+ * @typedef {{ weights: Record<string, number>, knobs: Record<string, any>, dials?: Record<string, number> }} Snapshot
+ *   [2] khóa núm là 'layerId.knobId'
  */
 /** Một bên của thí nghiệm 'compare' [3]: trung bình trượt. [4] gpuMs: null khi máy không đo được thời gian GPU.
  * @typedef {{ ms: number, cpuMs: number, gpuMs: number | null }} CompareSide */
@@ -182,6 +183,9 @@
  * @property {(cb: (q: object) => void) => () => void} onQuality   [3] báo mỗi lần nấc đổi; trả hàm bỏ nghe
  * @property {() => { id: string, on: boolean }[]} tools   [4] công cụ học, theo thứ tự engine/tools/index.js
  * @property {(id: string | null) => Promise<void>} setTool   [4] bật một công cụ (tắt các cái khác), null tắt hết
+ * @property {() => { id: string, min: number, max: number, step: number, value: number, text: string, note: string | null }[]} dials
+ *   [4] núm của cả bức: text là chữ của format (cũng là aria-valuetext), note là khóa ghi chú
+ * @property {(id: string, v: number) => Promise<void>} setDial   [4] kẹp theo min/max/step
  */
 
 export {};
```

Áp vào `src/paintings/ao-sen-dem/shared.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/shared.js b/src/paintings/ao-sen-dem/shared.js
index 6dbe354..2721c72 100644
--- a/src/paintings/ao-sen-dem/shared.js
+++ b/src/paintings/ao-sen-dem/shared.js
@@ -1,4 +1,4 @@
-// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, điểm hút đom đóm, xoáy sương, cử chỉ.
+// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, cử chỉ.
 import { Plane, Vector2, Vector3, Vector4 } from 'three/webgpu';
 import { Fn, Loop, exp, float, length, pow2, sin, step, uniform, uniformArray } from 'three/tsl';
 import { hourOfNight, tonight } from '../../lib/astro/moon.js';
@@ -21,6 +21,17 @@ export function defaultHour(now) {
   return isNight ? { hour: hourOfNight(instant, evening), note: null } : { hour: NIGHT.fallback, note: 'daytime' };
 }
 
+const pad = (n) => String(n).padStart(2, '0');
+
+/**
+ * Chữ của thanh giờ: giờ trên thang của Bức 1 (18 → 29,5; quá 24 là sáng hôm sau) ra "hh:mm". 29,5 → '05:30'.
+ * @param {number} v
+ */
+export function formatHour(v) {
+  const minutes = Math.round(v * 60);
+  return `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
+}
+
 /**
  * Hướng (vector đơn vị, world) từ tâm ao tới trăng theo giờ. Tính nghệ thuật, không theo thiên văn:
  * camera nhìn về −z (phía nam), nên trăng mọc bên TRÁI (đông), cao nhất lúc nửa đêm, lặn bên PHẢI (tây).
@@ -103,6 +114,17 @@ export function setup(ctx) {
 
   return {
     shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract, swirl },
+    // Thanh giờ (GĐ 4): xưởng vẽ thanh trượt, kéo thì chỉ đổi uHour.value. Ban ngày mượn 21:00 và ghi chú, nhưng chỉ
+    // tới khi người xem kéo thanh đi: lúc đó họ đã chọn giờ của mình. Nhãn và chữ ghi chú ở content.dials.gio.
+    dials: [{
+      id: 'gio',
+      uniform: uHour,
+      min: NIGHT.start,
+      max: NIGHT.end,
+      step: 0.25,
+      format: formatHour,
+      note: () => (note === 'daytime' && uHour.value === hour ? 'daytime' : null),
+    }],
 
     // Cử chỉ mà không công cụ nào dùng. Tia đi từ camera qua ngón tay; bức tự giao với mặt nước y = 0.
     onGesture(g) {
```

Áp vào `src/paintings/ao-sen-dem/content.vi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index a4cbebf..a7ea430 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -13,6 +13,13 @@ import vangLaDiagram from './diagrams/vang-la.svg?raw';
  */
 export default {
   hint: 'Chạm vào mặt nước',
+  // Thanh giờ (Dial 'gio' của shared.js). Ghi chú 'daytime' chỉ hiện khi đang là ban ngày và thanh chưa bị kéo đi.
+  dials: {
+    gio: {
+      label: 'Giờ',
+      notes: { daytime: 'Bây giờ đang là ban ngày, nên ao sen mượn 21:00 tối nay. Kéo thanh để xem các giờ khác của đêm.' },
+    },
+  },
   layers: {
     cot: {
       understand:
```

Run: `npx vitest run tests/unit/dial-set.test.js tests/unit/studio.test.js tests/unit/sma.test.js tests/paintings/contract.test.js tests/paintings/ao-sen-dem/shared.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  645 passed`.

```bash
git add src/engine/contracts/runtime.js src/engine/gpu/dial-set.js src/engine/gpu/scene.js src/engine/gpu/studio.js src/engine/sma.js src/paintings/ao-sen-dem/content.vi.js src/paintings/ao-sen-dem/shared.js tests/paintings/ao-sen-dem/shared.test.js tests/paintings/contract.test.js tests/unit/dial-set.test.js tests/unit/sma.test.js tests/unit/studio.test.js
git commit -F - <<'EOF'
feat: núm của cả bức (dial-set.js: kẹp theo min/max/step, chữ, ghi chú, snapshot); Bức 1 có Dial 'gio' 18:00 → 05:30

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 12: Vẽ lại lúc `?freeze` gọi `update(0, t)`; trăng theo độ cao, sương ấm lúc chạng vạng

**Mục tiêu:** Spec §8.5, §6 Lớp 2 và Lớp 3; hai mục nợ của GĐ 3.
- **Vẽ lại lúc đứng yên** (`scene.js#redraw`): trước khi vẽ, gọi `setup.update(0, t)` rồi `layer.update(0, t)` của mọi lớp, với `t` là đồng hồ đang đứng. Lớp và bức đồng bộ theo uniform vừa đổi (kéo thanh giờ thì trăng, bóng, màu trời đi theo) mà KHÔNG tiến mô phỏng: ảnh vẫn là khung N. Hợp đồng ghi rõ: `update(dt = 0)` phải an toàn và không tiến gì.
- **Ánh trăng** (`l2-anh-trang.js`): cường độ nhân `moonStrength(y)` theo độ cao của trăng. Trăng sát chân trời thì ánh trăng yếu, dưới chân trời thì tắt.
- **Sương** (`l3-suong.js`, `parts/suong-{mu,troi}.js`):
  - lúc chạng vạng và gần sáng, màu nền sương ấm lên (cộng `canhGian × dusk × 0,6`, `duskOf(hour)` dùng chung với trời);
  - nấc `chi-tiet` chỉ có khi mức hiện tại có hơn 1 octave (`budget.fogOctaves > 1`). Mức thấp đã là 1 octave, nên nấc đó không có tác dụng (nợ GĐ 3).
- **Vàng lá** (`l5-vang-la.js`): `update` với `dt === 0` không tiến đàn đom đóm (compute và bản CPU).

**Files:**
- Modify: `src/engine/contracts/runtime.js`, `src/engine/gpu/scene.js`, `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `src/paintings/ao-sen-dem/layers/l3-suong.js`, `src/paintings/ao-sen-dem/layers/l5-vang-la.js`, `src/paintings/ao-sen-dem/parts/suong-mu.js`, `src/paintings/ao-sen-dem/parts/suong-troi.js`
- Test: `tests/unit/scene.test.js`, `tests/paintings/ao-sen-dem/anh-trang.test.js`, `tests/paintings/ao-sen-dem/suong.test.js`, `tests/paintings/ao-sen-dem/vang-la.test.js`, `tests/paintings/ao-sen-dem/quality.test.js`

**Interfaces:**
- Consumes: Dial `gio` (Task 11).
- Produces: `moonStrength(y)` (trong `l2-anh-trang.js`); `duskOf(hour)` (trong `parts/suong-troi.js`); hợp đồng `Layer.update(0, t)` / `Setup.update(0, t)`.

- [ ] **Step 1: Test (hỏng: vẽ lại lúc đứng yên chưa gọi update, trăng chưa theo độ cao)**

Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 25a2dde..8ee9097 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -7,6 +7,8 @@ import { buildScene } from '../../src/engine/gpu/scene.js';
 import { createDisposer } from '../../src/engine/gpu/disposer.js';
 import { fakeRenderer } from '../helpers/fake-ctx.js';
 
+/** Test gắn hàm vào đây để nghe update() của lớp tô màu. */
+const hooks = { update: null };
 /** Bức giả hai lớp: Cốt (một khối đất sét) và một lớp tô màu theo trọng số. */
 const meta = { layers: [{ id: 'cot', name: 'Cốt', files: [] }, { id: 'to-mau', name: 'Tô màu', files: [] }] };
 const painting = {
@@ -30,7 +32,7 @@ const painting = {
       knobs: [],
       createLayer(ctx, shared) {
         shared.cot.material.colorNode = mix(color(ctx.palette.hex.datSet), color(ctx.palette.hex.doSon), ctx.weight('to-mau'));
-        return { dispose() {} };
+        return { update: (dt, t) => hooks.update?.(dt, t), dispose() {} };
       },
     },
   ],
@@ -123,6 +125,21 @@ describe('buildScene', () => {
     expect(scene.studio.weight('to-mau').value).toBe(0.5);
   });
 
+  it('vẽ lại khung đứng yên (GĐ 4): setup.update(0, t) → layer.update(0, t) → render, với t của khung đang giữ', async () => {
+    const order = [];
+    hooks.update = (dt, t) => order.push(['lop', dt, t]);
+    const { stage, scene, flush, renders } = build({ setup: () => ({ update: (dt, t) => order.push(['bức', dt, t]) }) });
+    stage.u.time.value = 1.5;
+    stage.renderer.render.mockImplementation(() => order.push(['render']));
+    scene.freeze();
+    const done = scene.studio.setWeight('to-mau', 0);
+    flush();
+    await done;
+    hooks.update = null;
+    expect(order).toEqual([['bức', 0, 1.5], ['lop', 0, 1.5], ['render']]);
+    expect(renders()).toBe(1);
+  });
+
   it('vẽ lại khung đứng yên mà render ném lỗi: Promise hỏng (không treo mãi), lần sau vẽ lại được', async () => {
     const { stage, scene, flush, renders } = build();
     scene.freeze();
```

Áp vào `tests/paintings/ao-sen-dem/anh-trang.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/anh-trang.test.js b/tests/paintings/ao-sen-dem/anh-trang.test.js
index a18b893..f16b179 100644
--- a/tests/paintings/ao-sen-dem/anh-trang.test.js
+++ b/tests/paintings/ao-sen-dem/anh-trang.test.js
@@ -4,6 +4,7 @@ import { OrthographicCamera, Vector3 } from 'three/webgpu';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
+import { moonStrength } from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
 import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
 import { LIGHT_DISTANCE, SHADOW_BOX, fitShadowCamera } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-shadow.js';
 import { moonDirection } from '../../../src/paintings/ao-sen-dem/shared.js';
@@ -72,6 +73,39 @@ describe('l2-anh-trang', () => {
     expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
   });
 
+  it('theo thanh giờ (GĐ 4): trăng càng thấp ánh trăng càng yếu; ở 21:00 và khi trăng cao hơn thì giữ nguyên như GĐ 3', () => {
+    const at = (hour) => moonStrength(moonDirection(hour)[1]);
+    expect(at(21)).toBe(1);
+    expect(at(23.75)).toBe(1); // trăng cao nhất
+    expect(at(18)).toBeCloseTo(0.35, 6);
+    expect(at(29.5)).toBeCloseTo(0.35, 6);
+    expect(at(19)).toBeGreaterThan(0.35);
+    expect(at(19)).toBeLessThan(at(20));
+    const { ctx, setup, shared, layers } = build();
+    const [sun] = lights(ctx.scene, 'isDirectionalLight');
+    shared.hour.value = 18.5;
+    setup.update(0, 1);
+    layers['anh-trang'].update(0, 1);
+    expect(sun.intensity).toBeCloseTo(3 * at(18.5), 6);
+  });
+
+  it('vẽ lại khung đứng yên (update(0, t), ?freeze): kéo thanh giờ thì hướng trăng đổi và bóng vẽ lại đúng một lần', () => {
+    const { ctx, setup, shared, layers } = build();
+    const [sun] = lights(ctx.scene, 'isDirectionalLight');
+    const [moon] = layers['anh-trang'].objects;
+    const still = () => {
+      sun.shadow.needsUpdate = false;
+      setup.update(0, 1); // xưởng gọi setup trước, rồi các lớp, với dt = 0
+      layers['anh-trang'].update(0, 1);
+      return sun.shadow.needsUpdate;
+    };
+    expect(still()).toBe(true);
+    expect(still()).toBe(false);
+    shared.hour.value = 27;
+    expect(still()).toBe(true);
+    expect(moon.position.clone().normalize().distanceTo(new Vector3(...moonDirection(27)))).toBeLessThan(1e-6);
+  });
+
   it('dispose gỡ trăng, đèn, hoa đăng (2 lần vẫn an toàn); đèn xưởng của Cốt thì ở lại', () => {
     const { ctx, shared, layers } = build();
     const before = ctx.scene.children.length;
```

Áp vào `tests/paintings/ao-sen-dem/suong.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/suong.test.js b/tests/paintings/ao-sen-dem/suong.test.js
index 56a5a9a..b6a93cd 100644
--- a/tests/paintings/ao-sen-dem/suong.test.js
+++ b/tests/paintings/ao-sen-dem/suong.test.js
@@ -74,6 +74,12 @@ describe('l3-suong', () => {
     expect(octaves(build({ level: 'thap', budget: { fogOctaves: 1 } }).layers.suong)).toBe(1);
   });
 
+  it("nấc 'chi-tiet' chỉ có khi mức chạy hơn 1 octave (GĐ 4): mức thấp vốn 1 octave thì không đưa nấc không tác dụng", () => {
+    expect(build({ level: 'cao' }).layers.suong.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
+    expect(build({ level: 'vua' }).layers.suong.degrade.map((d) => d.id)).toEqual(['chi-tiet']);
+    expect(build({ level: 'thap' }).layers.suong.degrade).toEqual([]);
+  });
+
   it('dispose gỡ vòm trời và trả fogNode về như cũ (2 lần vẫn an toàn)', () => {
     const { ctx, layers } = build();
     const [dome] = layers.suong.objects;
```

Áp vào `tests/paintings/ao-sen-dem/vang-la.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/vang-la.test.js b/tests/paintings/ao-sen-dem/vang-la.test.js
index 42bfc56..f2b5e0f 100644
--- a/tests/paintings/ao-sen-dem/vang-la.test.js
+++ b/tests/paintings/ao-sen-dem/vang-la.test.js
@@ -79,6 +79,31 @@ describe('l5-vang-la', () => {
     expect([calls.length, sprite.visible]).toEqual([2, true]);
   });
 
+  it('vẽ lại khung đứng yên (update(0, t), GĐ 4): không chạy compute, không bước đàn CPU; sprite vẫn theo trọng số', async () => {
+    const { ctx, layers } = build();
+    const layer = layers['vang-la'];
+    const [sprite] = layer.objects;
+    const computes = () => ctx.renderer.compute.mock.calls.length;
+    const before = computes();
+    layer.update(0, 1);
+    expect(computes()).toBe(before);
+    ctx.weights.set('vang-la', 0);
+    layer.update(0, 1);
+    expect(sprite.visible).toBe(false);
+    ctx.weights.set('vang-la', 1);
+    const cpu = layer.experiments.find((e) => e.id === 'cpu');
+    await cpu.toggle(true);
+    const [, cpuSprite] = layer.objects;
+    // Đàn CPU ghi vị trí vào một thuộc tính instance (material.positionNode = cell.xyz): mỗi bước tăng version của nó.
+    const attr = cpuSprite.material.positionNode.node.value;
+    const version = attr.version;
+    layer.update(0, 1);
+    expect([attr.version, computes()]).toEqual([version, before]);
+    expect([sprite.visible, cpuSprite.visible]).toEqual([false, true]);
+    layer.update(1 / 60, 1);
+    expect(attr.version).toBeGreaterThan(version);
+  });
+
   it("nấc 'dom-dom': trần = nửa số mặc định của mức; hiệu lực = min(núm, trần); số đo đọc theo", () => {
     const { ctx, layers, knobs } = build();
     const layer = layers['vang-la'];
```

Áp vào `tests/paintings/ao-sen-dem/quality.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/quality.test.js b/tests/paintings/ao-sen-dem/quality.test.js
index 24b0a9e..b412069 100644
--- a/tests/paintings/ao-sen-dem/quality.test.js
+++ b/tests/paintings/ao-sen-dem/quality.test.js
@@ -29,9 +29,9 @@ describe('quality.js của Bức 1', () => {
     ]);
   });
 
-  it('mức thấp: phản chiếu giả và không bóng nên không có hai nấc đó; màn DPR 1 thì không có nấc dpr', () => {
+  it('mức thấp: phản chiếu giả, không bóng, sương vốn 1 octave nên không có ba nấc đó (GĐ 4); màn DPR 1 thì không có nấc dpr', () => {
     const ladder = ladderAt('thap', 1);
     while (ladder.down());
-    expect(ladder.ids()).toEqual(['suong.chi-tiet', 'phu-bong.bloom', 'vang-la.dom-dom']);
+    expect(ladder.ids()).toEqual(['phu-bong.bloom', 'vang-la.dom-dom']);
   });
 });
```

Run: `npx vitest run tests/unit/scene.test.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/vang-la.test.js tests/paintings/ao-sen-dem/quality.test.js`
Kết quả mong đợi: FAIL, 5 test hỏng; lỗi đầu tiên: `AssertionError: expected [ [ 'render' ] ] to deeply equal [ [ 'bức', +0, 1.5 ], …(2) ]`.

- [ ] **Step 2: Code**

Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index 3007dd5..f893234 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -141,6 +141,11 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
         try {
           if (!disposer.closed) {
             route(); // cử chỉ tới lúc đứng yên (rê Kính mài) cũng có tác dụng
+            // update(0, t) (GĐ 4): lớp và bức đồng bộ theo uniform vừa đổi (thanh giờ → trăng, bóng) mà KHÔNG tiến mô phỏng
+            // (compute, hạt CPU): ảnh vẫn là khung N.
+            const t = stage.u.time.value;
+            setup?.update?.(0, t);
+            for (const { layer } of layers) layer.update?.(0, t);
             pipeline.render();
           }
           resolve();
```

Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 4c206e7..e684265 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -55,6 +55,8 @@
  * @typedef {Object} Layer
  * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
  * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
+ *                                 [4] update(0, t): xưởng vẽ lại khung đứng yên (?freeze): đồng bộ theo uniform (hướng trăng, bóng),
+ *                                 KHÔNG tiến mô phỏng (compute, hạt CPU)
  * @property {PostStage} [post]           [0] xử lý ẢNH sau scene pass
  * @property {() => void} dispose         [0] gọi 2 lần vẫn an toàn; tự gỡ object khỏi scene
  * @property {Record<string, (v: any) => void | Promise<void>>} [onKnob]   [2] cho núm 'js' | 'rebuild'. Thiếu hàm cho
```

Áp vào `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index 6e6d475..e3d7b5f 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -13,6 +13,7 @@ import { moonPhase } from '../../../lib/astro/moon.js';
 import { createMoon } from '../parts/anh-trang-moon.js';
 import { paintCot } from '../parts/anh-trang-paint.js';
 import { LIGHT_DISTANCE, createShadowWatch } from '../parts/anh-trang-shadow.js';
+import { moonDirection } from '../shared.js';
 
 export const id = 'anh-trang';
 
@@ -34,7 +35,19 @@ export const knobs = [
   { id: 'shadowBias', via: 'js', min: -0.005, max: 0.005, step: 0.0001, value: BIAS.bias },
 ];
 
-const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1
+const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1, khi trăng cao từ độ cao của 21:00 trở lên
+const LOW = moonDirection(18)[1]; // độ cao (thành phần y của hướng) lúc trăng sát chân trời
+const FULL = moonDirection(21)[1];
+
+/**
+ * Trăng càng thấp thì ánh trăng càng yếu (GĐ 4, theo thanh giờ): 35% khi trăng sát chân trời (chạng vạng, gần sáng), đủ
+ * 100% từ độ cao của 21:00 trở lên. Nhờ vậy ảnh ở giờ mặc định giữ nguyên như GĐ 3.
+ * @param {number} y  thành phần y của hướng trăng (đơn vị)
+ */
+export function moonStrength(y) {
+  const s = Math.min(Math.max((y - LOW) / (FULL - LOW), 0), 1);
+  return 0.35 + 0.65 * s * s * (3 - 2 * s);
+}
 const SKY_FILL = 4; // trời chàm hắt xuống, nước đen hắt lên
 const CANDLE = { distance: 14, position: [-5, 0.08, 13] };
 
@@ -144,7 +157,7 @@ export function createLayer(ctx, shared) {
       moon.update(dir);
       moonlight.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);
       watch?.check(); // có gì đổi thì khớp lại khung bóng và vẽ lại shadow map MỘT lần
-      moonlight.intensity = MOONLIGHT * k;
+      moonlight.intensity = MOONLIGHT * k * moonStrength(dir.y);
       fill.intensity = SKY_FILL * k;
       // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
       cot.hemi.intensity = cot.hemiIntensity * (1 - k);
```

Áp vào `src/paintings/ao-sen-dem/parts/suong-troi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/suong-troi.js b/src/paintings/ao-sen-dem/parts/suong-troi.js
index 09801d2..be36ce0 100644
--- a/src/paintings/ao-sen-dem/parts/suong-troi.js
+++ b/src/paintings/ao-sen-dem/parts/suong-troi.js
@@ -29,6 +29,13 @@ export const SKY_RADIUS = 300; // lớn hơn quỹ đạo trăng (160), nhỏ h
 const STARS = { scale: 220, maxShare: 0.035 }; // ô sao: 220 ô mỗi đơn vị hướng; mật độ 1 = 3,5% số ô có sao
 const GALAXY = [0.42, 0.55, 0.72]; // pháp tuyến của mặt phẳng dải Ngân Hà (một đường tròn lớn nghiêng qua trời)
 
+/**
+ * Chạng vạng (18h–19h30) và gần sáng (28h30–29h30) → 1, giữa đêm → 0. Trời và sương cùng dùng hàm này (GĐ 4), nên chân
+ * trời và sương ấm lên cùng nhau khi kéo thanh giờ.
+ * @param {any} hour  uniform giờ của bức (18 → 29,5)
+ */
+export const duskOf = (hour) => oneMinus(smoothstep(18, 19.5, hour)).add(smoothstep(28.5, 29.5, hour));
+
 /**
  * Hàm màu trời theo hướng nhìn (vector đơn vị, từ mắt ra trời). Không cần ảnh nào: mọi thứ tính từ hướng.
  * Trả màu TUYẾN TÍNH, chưa trộn trọng số (lớp tự trộn với đen then).
@@ -44,7 +51,7 @@ export function makeSky(ctx, { moonDir, moonLight, hour, fogColor, density, star
     const e = dir.y; // độ cao của hướng nhìn: 0 là chân trời, 1 là đỉnh đầu
     // Dải màu theo poster: đen then ở chân trời, chàm ở đỉnh. Chạng vạng (18h–19h30) và gần sáng (28h30–29h30)
     // chân trời ấm lên màu nâu cánh gián. Giờ là uniform của bức: thanh giờ (GĐ 4) chỉ việc đổi nó.
-    const dusk = oneMinus(smoothstep(18, 19.5, hour)).add(smoothstep(28.5, 29.5, hour));
+    const dusk = duskOf(hour);
     const base = mix(color(hex.denThen), color(hex.cham).mul(2), smoothstep(0, 0.6, e))
       .add(color(hex.canhGian).mul(dusk.mul(0.6)).mul(oneMinus(smoothstep(0, 0.25, e))));
```

Áp vào `src/paintings/ao-sen-dem/parts/suong-mu.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/suong-mu.js b/src/paintings/ao-sen-dem/parts/suong-mu.js
index 75555dc..b70c757 100644
--- a/src/paintings/ao-sen-dem/parts/suong-mu.js
+++ b/src/paintings/ao-sen-dem/parts/suong-mu.js
@@ -21,6 +21,7 @@ import {
   vec3,
 } from 'three/tsl';
 import { fbm } from '../../../lib/tsl/noise.js';
+import { duskOf } from './suong-troi.js';
 
 const WIND = [0.92, 0, 0.4]; // hướng gió trên mặt ao (gần như từ trái sang phải khung hình)
 const WIND_SPEED = 0.1; // miền noise trôi chừng này đơn vị mỗi giây khi sức gió = 1
@@ -29,11 +30,12 @@ const SWIRL = { radius: 9, settle: 0.6 }; // xoáy: bán kính ảnh hưởng (
 /**
  * Màu sương theo hướng nhìn (đơn vị): bạc lá pha chàm, tối như đêm; ngả vàng lá khi nhìn về phía trăng, vì sương tán xạ
  * ánh trăng về phía trước (nhìn ngược sáng thì sương sáng nhất). `moonLight`: độ sáng của trăng (lớp Ánh trăng công bố).
+ * GĐ 4: lúc chạng vạng và gần sáng (`hour`, cùng hệ số dusk với vòm trời) nền sương ấm về nâu cánh gián.
  * @returns {(dir: any) => any}  gọi được trong TSL
  */
-export function makeFogColor(ctx, { moonDir, moonLight }) {
+export function makeFogColor(ctx, { moonDir, moonLight, hour }) {
   const hex = ctx.palette.hex;
-  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.2);
+  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.2).add(color(hex.canhGian).mul(duskOf(hour).mul(0.6)));
   const glow = color(hex.vangLaSang).mul(0.12).mul(moonLight);
   // saturate trước pow: pow của số âm là NaN trên GPU thật.
   return Fn(([dir]) => base.add(glow.mul(pow(saturate(dot(dir, moonDir)), 16))));
@@ -45,10 +47,10 @@ export function makeFogColor(ctx, { moonDir, moonLight }) {
  * Mọi thứ đổi lúc chạy (trọng số, núm, xoáy, "Xem noise thô") là uniform bên trong: fogNode nằm trong cache key của MỌI
  * material, nên node này dựng MỘT lần và không bao giờ gán lại.
  * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
- * @param {{ w: any, swirl: any, moonDir: any, moonLight: any, density: any, heightFalloff: any, noiseScale: any,
+ * @param {{ w: any, swirl: any, moonDir: any, moonLight: any, hour: any, density: any, heightFalloff: any, noiseScale: any,
  *   windStrength: any, octaves: any }} p  node hoặc uniform
  */
-export function createFog(ctx, { w, swirl, moonDir, moonLight, density, heightFalloff, noiseScale, windStrength, octaves }) {
+export function createFog(ctx, { w, swirl, moonDir, moonLight, hour, density, heightFalloff, noiseScale, windStrength, octaves }) {
   const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một làn sương
   const raw = uniform(0).setName('suong_raw'); // thí nghiệm "Xem noise thô": 1 → mọi bề mặt hiện noise xám
   const wind = vec3(...WIND).normalize().mul(windStrength).mul(WIND_SPEED);
@@ -71,7 +73,7 @@ export function createFog(ctx, { w, swirl, moonDir, moonLight, density, heightFa
   const amount = distance.mul(density).mul(thick).mul(noise.mul(0.4).add(0.6));
   const factor = oneMinus(exp(amount.negate())).mul(w);
 
-  const fogColor = makeFogColor(ctx, { moonDir, moonLight });
+  const fogColor = makeFogColor(ctx, { moonDir, moonLight, hour });
   const view = normalize(positionWorld.sub(cameraPosition));
   // "Xem noise thô": màu sương thành noise xám, hệ số thành 1 (mọi bề mặt thay hẳn bằng noise). Chỉ đổi uniform.
   const node = fog(mix(fogColor(view), vec3(noise.mul(0.5).add(0.5)), raw), mix(factor, 1, raw));
```

Áp vào `src/paintings/ao-sen-dem/layers/l3-suong.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l3-suong.js b/src/paintings/ao-sen-dem/layers/l3-suong.js
index dea44ea..93e54ae 100644
--- a/src/paintings/ao-sen-dem/layers/l3-suong.js
+++ b/src/paintings/ao-sen-dem/layers/l3-suong.js
@@ -40,6 +40,7 @@ export function createLayer(ctx, shared) {
     swirl: shared.swirl,
     moonDir: shared.moon.dir,
     moonLight,
+    hour: shared.hour,
     density: ctx.knob('density'), // @knob density
     heightFalloff: ctx.knob('heightFalloff'), // @knob heightFalloff
     noiseScale: ctx.knob('noiseScale'), // @knob noiseScale
@@ -81,7 +82,9 @@ export function createLayer(ctx, shared) {
       },
     ],
     readouts: [{ id: 'octaves', get: () => Math.min(ctx.knob('octaves').value, octaveCap.value) }],
-    degrade: [
+    // Nấc 'chi-tiet' chỉ có khi mức này chạy hơn 1 octave (GĐ 4): mức thấp vốn chạy 1 octave, đưa ra một nấc không tác
+    // dụng là trái luật "lớp chỉ đưa nấc có tác dụng ở mức hiện tại".
+    degrade: (ctx.budget.fogOctaves ?? 3) > 1 ? [
       {
         id: 'chi-tiet',
         apply() {
@@ -93,7 +96,7 @@ export function createLayer(ctx, shared) {
           syncCap();
         },
       },
-    ],
+    ] : [],
     dispose() {
       if (disposed) return;
       disposed = true;
```

Áp vào `src/paintings/ao-sen-dem/layers/l5-vang-la.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l5-vang-la.js b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
index 08e63c7..39cd1c9 100644
--- a/src/paintings/ao-sen-dem/layers/l5-vang-la.js
+++ b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
@@ -136,7 +136,8 @@ export function createLayer(ctx, shared) {
     objects,
     update(dt, t) {
       show();
-      if (w.value <= 0) return; // tắt hẳn: không tính gì
+      // Tắt hẳn: không tính gì. dt = 0 (xưởng vẽ lại khung đứng yên của ?freeze): đồng bộ, KHÔNG tiến đàn thêm một bước.
+      if (w.value <= 0 || dt === 0) return;
       if (onCpu) cpu.step(dt, t);
       else ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
     },
```

Run: `npx vitest run tests/unit/scene.test.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/vang-la.test.js tests/paintings/ao-sen-dem/quality.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  650 passed`.

```bash
git add src/engine/contracts/runtime.js src/engine/gpu/scene.js src/paintings/ao-sen-dem/layers/l2-anh-trang.js src/paintings/ao-sen-dem/layers/l3-suong.js src/paintings/ao-sen-dem/layers/l5-vang-la.js src/paintings/ao-sen-dem/parts/suong-mu.js src/paintings/ao-sen-dem/parts/suong-troi.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/quality.test.js tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/vang-la.test.js tests/unit/scene.test.js
git commit -F - <<'EOF'
feat: vẽ lại lúc ?freeze gọi update(0, t) (đồng bộ, không tiến mô phỏng); ánh trăng theo độ cao, sương ấm lúc chạng vạng, nấc chi-tiet chỉ khi hơn 1 octave

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 13: Mục Đồ nghề trong thanh lớp; thanh giờ (`ui/rail-tools.js`, `ui/dials.js`)

**Mục tiêu:** Spec §4.1, §7 (bố cục A: đồ nghề và thanh giờ nằm trong thanh lớp).
- `createRailTools(doc, { t, content, studio })`:
  - vẽ mục "Đồ nghề" dưới danh sách lớp: mỗi công cụ một nút `aria-pressed` mang tên ở `t.tools[id].name`, bấm thì bật, bấm lại thì tắt;
  - vẽ thanh giờ (`ui/dials.js`): `input type="range"` có nhãn, `aria-valuetext` là chữ của `format`, ghi chú từ `content.dials`;
  - trên điện thoại, thanh giờ thu thành một nút nhỏ "◷ 21:00" (`aria-expanded`) mở ô trượt;
  - `sync()` đọc lại trạng thái thật của bàn thợ. Sau khi dựng lại cảnh (bàn thợ mới, công cụ về tắt), nút không kẹt ở "đang bật".
- Ghi chú của Dial là vùng `aria-live`: chỉ ghi lại khi chữ đổi, vì ghi lại cùng câu thì trình đọc màn hình đọc lại.
- `workshop.js` dựng mục này khi có cảnh 3D; đóng thanh lớp thì công cụ tắt (`setTool(null)`). Ở màn ≤ 640px, `body[data-tool]` thu Sổ tay lại để chừa chỗ nhìn cảnh (`styles/tools.css`).

**Files:**
- Create: `src/ui/rail-tools.js`, `src/ui/dials.js`
- Modify: `src/ui/layer-rail.js`, `src/ui/workshop.js`, `src/ui/strings.vi.js`, `src/styles/tools.css`
- Test: Create `tests/unit/rail-tools.test.js`; Modify `tests/unit/workshop.test.js`

**Interfaces:**
- Consumes: `studio.tools()`, `studio.setTool()` (Task 9); `studio.dials()`, `studio.setDial()` (Task 11).
- Produces: `createRailTools(doc, { t, content, studio }) → { el, sync() }`; `createDials(doc, { dials, content, onChange }) → { el, update(dials) }`; `createRail(doc, { …, tools })` (layer-rail.js); `t.rail.tools`.

- [ ] **Step 1: Test (hỏng: chưa có `rail-tools.js`)**

Tạo `tests/unit/rail-tools.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/rail-tools.test.js — mục Đồ nghề + thanh trượt Dial: nút aria-pressed, mỗi lúc một công cụ, input range có aria-valuetext, ghi chú.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRailTools } from '../../src/ui/rail-tools.js';
import { createDials } from '../../src/ui/dials.js';
import t from '../../src/ui/strings.vi.js';

const content = { dials: { gio: { label: 'Giờ', notes: { daytime: 'Ban ngày: mượn 21:00.' } } } };

/** Bàn thợ giả: hai công cụ, một Dial giờ (giá trị, chữ, ghi chú theo trạng thái). */
function fakeStudio() {
  const state = { tool: null, hour: 21, note: 'daytime' };
  const fmt = (v) => `${String(Math.floor(v) % 24).padStart(2, '0')}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`;
  return {
    state,
    tools: () => [{ id: 'kinh-mai', on: state.tool === 'kinh-mai' }, { id: 'lot-lop', on: state.tool === 'lot-lop' }],
    setTool: vi.fn(async (id) => { state.tool = id; }),
    dials: () => [{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: state.hour, text: fmt(state.hour), note: state.note }],
    setDial: vi.fn(async (id, v) => { state.hour = v; state.note = null; }),
  };
}

beforeEach(() => document.body.replaceChildren());

describe('createRailTools', () => {
  it('Đồ nghề: tiêu đề, mỗi công cụ một nút aria-pressed mang tên ở t.tools; bấm thì bật, bấm lại thì tắt', async () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    expect(tools.el.querySelector('#rail-tools-title').textContent).toBe(t.rail.tools);
    expect(tools.el.getAttribute('aria-labelledby')).toBe('rail-tools-title');
    const buttons = [...tools.el.querySelectorAll('[data-tool]')];
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Kính mài', 'false'], ['Lột lớp', 'false']]);
    buttons[0].click();
    expect(studio.setTool).toHaveBeenLastCalledWith('kinh-mai');
    await Promise.resolve();
    tools.sync();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    buttons[0].click(); // bấm lại nút đang bật: tắt
    expect(studio.setTool).toHaveBeenLastCalledWith(null);
  });

  it('thanh giờ: input range có nhãn, aria-valuetext là chữ của format, ghi chú từ content; kéo thì setDial', async () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const input = tools.el.querySelector('input[type="range"]');
    expect([input.min, input.max, input.step, input.value]).toEqual(['18', '29.5', '0.25', '21']);
    expect(tools.el.querySelector(`label[for="${input.id}"]`).textContent).toBe('Giờ');
    expect(input.getAttribute('aria-valuetext')).toBe('21:00');
    expect(tools.el.querySelector('output').textContent).toBe('21:00');
    const note = tools.el.querySelector('.dial-note');
    expect([note.textContent, note.getAttribute('aria-live'), note.hidden]).toEqual(['Ban ngày: mượn 21:00.', 'polite', false]);
    input.value = '26.5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(studio.setDial).toHaveBeenCalledWith('gio', 26.5);
    await Promise.resolve();
    tools.sync();
    expect(input.getAttribute('aria-valuetext')).toBe('02:30');
    expect(note.textContent).toBe(''); // kéo thanh đi rồi thì thôi ghi chú
  });

  it('điện thoại: nút nhỏ "◷ 21:00" (aria-expanded) mở ô trượt; aria-label đọc được tên và giá trị', () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const chip = tools.el.querySelector('.dial-chip');
    expect([chip.textContent, chip.getAttribute('aria-label'), chip.getAttribute('aria-controls')]).toEqual(['◷ 21:00', 'Giờ: 21:00', 'rail-dials']);
    const panel = tools.el.querySelector('#rail-dials');
    expect(panel.hasAttribute('data-open')).toBe(false);
    chip.click();
    expect([chip.getAttribute('aria-expanded'), panel.hasAttribute('data-open')]).toEqual(['true', true]);
    chip.click();
    expect(panel.hasAttribute('data-open')).toBe(false);
  });

  it('chữ của bức tải hỏng (content = null): thanh giờ vẫn chạy, nhãn là id, không có ghi chú', () => {
    const studio = fakeStudio();
    const tools = createRailTools(document, { t, content: null, studio: () => studio });
    document.body.append(tools.el);
    tools.sync();
    const input = tools.el.querySelector('input[type="range"]');
    expect(tools.el.querySelector(`label[for="${input.id}"]`).textContent).toBe('gio');
    expect(tools.el.querySelector('.dial-note').textContent).toBe('');
    expect(tools.el.querySelector('.dial-chip').getAttribute('aria-label')).toBe('gio: 21:00');
  });

  it('dựng lại cảnh sau khi mất GPU (bàn thợ mới, công cụ về tắt): nút Đồ nghề đọc lại trạng thái thật', async () => {
    let current = fakeStudio();
    const tools = createRailTools(document, { t, content, studio: () => current });
    document.body.append(tools.el);
    tools.el.querySelector('[data-tool="kinh-mai"]').click();
    await Promise.resolve();
    tools.sync();
    expect(tools.el.querySelector('[data-tool="kinh-mai"]').getAttribute('aria-pressed')).toBe('true');
    current = fakeStudio(); // cảnh mới: chưa bật công cụ nào
    tools.sync();
    expect(tools.el.querySelector('[data-tool="kinh-mai"]').getAttribute('aria-pressed')).toBe('false');
  });

  it('bức không có Dial: không có thanh trượt, không có nút nhỏ; mất GPU (studio() = null) thì sync không làm gì', () => {
    const studio = { ...fakeStudio(), dials: () => [] };
    let current = studio;
    const tools = createRailTools(document, { t, content: null, studio: () => current });
    expect(tools.el.querySelector('.dial-chip')).toBeNull();
    expect(tools.el.querySelector('input')).toBeNull();
    current = null;
    expect(() => tools.sync()).not.toThrow();
  });
});

describe('createDials', () => {
  it('ghi chú chỉ ghi lại khi chữ đổi (vùng aria-live: ghi lại cùng câu thì trình đọc màn hình đọc lại)', () => {
    const dials = createDials(document, {
      dials: [{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }],
      content,
      onChange: () => {},
    });
    document.body.append(dials.el);
    const note = dials.el.querySelector('.dial-note');
    const seen = new MutationObserver(() => {});
    seen.observe(note, { childList: true, characterData: true, subtree: true });
    dials.update([{ id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: 'daytime' }]);
    expect(seen.takeRecords()).toHaveLength(0);
    seen.disconnect();
  });
});
```

Áp vào `tests/unit/workshop.test.js`:

```diff
diff --git a/tests/unit/workshop.test.js b/tests/unit/workshop.test.js
index 07ea409..d84f223 100644
--- a/tests/unit/workshop.test.js
+++ b/tests/unit/workshop.test.js
@@ -51,6 +51,10 @@ function fakeStudio() {
     experiment: (layerId, id) => on.has(`${layerId}.${id}`),
     toggleExperiment: vi.fn(async (layerId, id, value) => (value ? on.add(`${layerId}.${id}`) : on.delete(`${layerId}.${id}`))),
     readouts: () => [{ id: 'dinh', value: 1234, unit: '' }],
+    tools: () => [{ id: 'kinh-mai', on: false }],
+    setTool: vi.fn(async () => {}),
+    dials: () => [],
+    setDial: vi.fn(async () => {}),
     gpuMs: 4.56,
     stats() {
       return { drawCalls: 21, triangles: 90000, ms: 16.66, cpuMs: 3.21, gpuMs: this.gpuMs };
@@ -114,6 +118,16 @@ describe('chế độ mài', () => {
     workshop.dispose();
   });
 
+  it('Đồ nghề (GĐ 4): nằm trong thanh lớp, ngay dưới danh sách lớp, trước nút "Phủ lớp tiếp theo"', () => {
+    const { workshop, rail } = mount(fakeStudio());
+    workshop.open();
+    const section = rail.querySelector('.rail-tools');
+    expect(section.previousElementSibling.tagName).toBe('OL');
+    expect(section.nextElementSibling.classList.contains('rail-next')).toBe(true);
+    expect(section.querySelector('[data-tool="kinh-mai"]').textContent).toBe(t.tools['kinh-mai'].name);
+    workshop.dispose();
+  });
+
   it('công tắc bật/tắt tự do (tween); Cốt không có công tắc; vạch trọng số theo giá trị', () => {
     const studio = fakeStudio();
     const { workshop, rail } = mount(studio);
@@ -141,6 +155,7 @@ describe('chế độ mài', () => {
     expect(rail.hidden).toBe(true);
     expect(notebook.hidden).toBe(true);
     expect(studio.calls.slice(-2)).toEqual([['setWeight', 'hai', 1, { tween: true }], ['setWeight', 'ba', 1, { tween: true }]]);
+    expect(studio.setTool).toHaveBeenCalledWith(null); // đóng thanh lớp thì công cụ học tắt, tranh về ảnh cuối
     expect(onClose).toHaveBeenCalledTimes(1);
     workshop.dispose();
     expect(document.querySelector('[data-rail]')).toBeNull();
@@ -357,10 +372,11 @@ describe('Sổ tay', () => {
     workshop.dispose();
   });
 
-  it('tầng tĩnh (studio() = null): không công tắc, không nút tiếp theo, Chỉnh không tải Tweakpane, Phá chỉ đọc', () => {
+  it('tầng tĩnh (studio() = null): không công tắc, không Đồ nghề, không nút tiếp theo, Chỉnh không tải Tweakpane, Phá chỉ đọc', () => {
     const { workshop, rail, notebook } = mount(null);
     workshop.open({ grind: true });
     expect(rail.querySelector('[role="switch"]')).toBeNull();
+    expect(rail.querySelector('.rail-tools')).toBeNull();
     expect(rail.querySelector('.rail-next').hidden).toBe(true);
     notebook.querySelector('[data-tab="chinh"]').click();
     expect(notebook.querySelector('[data-knobs]').textContent).toBe(t.notebook.knobsStatic);
```

Run: `npx vitest run tests/unit/rail-tools.test.js tests/unit/workshop.test.js`
Kết quả mong đợi: FAIL, 2 test hỏng; lỗi đầu tiên: `Error: Failed to resolve import "../../src/ui/rail-tools.js" from "tests/unit/rail-tools.test.js". Does the file exist?`.

- [ ] **Step 2: Code**

Tạo `src/ui/dials.js`:

```js
// ui/dials.js — thanh trượt cho các Dial (núm của cả bức): input type="range", chữ giá trị (cũng là aria-valuetext), ghi chú.
import { h } from './dom.js';

/**
 * Xưởng vẽ thanh trượt cho mọi Dial mà bức khai báo (spec §4.1). Không biết Dial nghĩa là gì: nhãn và chữ ghi chú lấy từ
 * content của bức (content.dials[id]), chữ giá trị lấy từ Dial.format (bàn thợ đưa sẵn ở `text`).
 * Ghi chú là vùng aria-live: luôn có mặt, trống khi không có gì để nói (CSS thu lại), chỉ ghi khi chữ đổi.
 * @param {Document} doc
 * @param {{ dials: { id: string, min: number, max: number, step: number, value: number, text: string, note: string | null }[],
 *   content?: object | null, onChange: (id: string, v: number) => Promise<void> | void }} p
 */
export function createDials(doc, { dials, content = null, onChange }) {
  const rows = new Map();
  const el = h(doc, 'div', { class: 'dials' }, dials.map((d) => {
    const inputId = `dial-${d.id}`;
    const text = content?.dials?.[d.id];
    const input = h(doc, 'input', {
      type: 'range', id: inputId, min: String(d.min), max: String(d.max), step: String(d.step || 'any'), value: String(d.value),
    });
    const shown = h(doc, 'output', { for: inputId });
    const note = h(doc, 'p', { class: 'dial-note', 'aria-live': 'polite' });
    input.addEventListener('input', () => onChange(d.id, Number(input.value)));
    rows.set(d.id, { input, shown, note, notes: text?.notes ?? {} });
    return h(doc, 'div', { class: 'dial', 'data-dial': d.id },
      h(doc, 'label', { for: inputId, text: text?.label ?? d.id }), shown, input, note);
  }));

  const update = (list) => {
    for (const d of list) {
      const row = rows.get(d.id);
      if (!row) continue;
      if (Number(row.input.value) !== d.value) row.input.value = String(d.value);
      row.input.setAttribute('aria-valuetext', d.text);
      if (row.shown.textContent !== d.text) row.shown.textContent = d.text;
      const note = d.note ? row.notes[d.note] ?? '' : '';
      if (row.note.textContent !== note) row.note.textContent = note; // vùng live: chỉ ghi khi chữ đổi
    }
  };
  update(dials);
  return { el, update };
}
```

Tạo `src/ui/rail-tools.js`:

```js
// ui/rail-tools.js — mục "Đồ nghề" trong thanh lớp: nút aria-pressed của từng công cụ học, và thanh trượt của các Dial.
import { h } from './dom.js';
import { createDials } from './dials.js';

/**
 * Chỉ có khi cảnh 3D đang chạy (tầng tĩnh không có Đồ nghề hay thanh giờ: cả hai cần cảnh). Mọi thay đổi đi qua bàn thợ:
 * studio().setTool(id | null), studio().setDial(id, v). Mỗi lúc chỉ một công cụ bật: bấm lại nút đang bật thì tắt.
 * Điện thoại: dải thanh lớp chỉ có nút công cụ và một nút nhỏ ghi giá trị của Dial ("◷ 21:00"); chạm vào thì ô trượt
 * mở ra ngay trên dải (CSS đặt ô đó theo khung nhìn).
 * @param {Document} doc
 * @param {{ t: Record<string, any>, content?: object | null, studio: () => any }} p
 */
export function createRailTools(doc, { t, content = null, studio }) {
  const s = studio();
  const buttons = s.tools().map(({ id }) => {
    const button = h(doc, 'button', { type: 'button', 'data-tool': id, 'aria-pressed': 'false', text: t.tools[id]?.name ?? id });
    button.addEventListener('click', () => {
      const on = button.getAttribute('aria-pressed') === 'true';
      studio()?.setTool(on ? null : id);
    });
    return button;
  });
  const dialList = s.dials();
  const dials = createDials(doc, { dials: dialList, content, onChange: (id, v) => studio()?.setDial(id, v) });
  const panel = h(doc, 'div', { class: 'rail-dials', id: 'rail-dials' }, dials.el);
  const chip = dialList.length > 0
    ? h(doc, 'button', { type: 'button', class: 'dial-chip', 'aria-expanded': 'false', 'aria-controls': 'rail-dials' })
    : null;
  chip?.addEventListener('click', () => {
    const open = chip.getAttribute('aria-expanded') !== 'true';
    chip.setAttribute('aria-expanded', String(open));
    panel.toggleAttribute('data-open', open);
  });
  const el = h(doc, 'section', { class: 'rail-tools', 'aria-labelledby': 'rail-tools-title' },
    h(doc, 'h2', { id: 'rail-tools-title', class: 'rail-title', text: t.rail.tools }),
    h(doc, 'div', { class: 'rail-tool-list' }, buttons),
    chip,
    dialList.length > 0 ? panel : null);

  return {
    el,
    /** Vẽ lại theo bàn thợ (workshop gọi mỗi nhịp khi thanh lớp mở): nút công cụ, giá trị và ghi chú của Dial. */
    sync() {
      const now = studio();
      if (!now) return;
      const on = new Map(now.tools().map((x) => [x.id, x.on]));
      for (const b of buttons) b.setAttribute('aria-pressed', String(Boolean(on.get(b.dataset.tool))));
      const list = now.dials();
      dials.update(list);
      if (chip && list[0]) {
        const label = content?.dials?.[list[0].id]?.label ?? list[0].id;
        chip.textContent = `◷ ${list[0].text}`;
        chip.setAttribute('aria-label', `${label}: ${list[0].text}`);
      }
    },
  };
}
```

Áp vào `src/ui/layer-rail.js`:

```diff
diff --git a/src/ui/layer-rail.js b/src/ui/layer-rail.js
index fe9ef27..7e332ca 100644
--- a/src/ui/layer-rail.js
+++ b/src/ui/layer-rail.js
@@ -1,4 +1,4 @@
-// ui/layer-rail.js — thanh lớp: tên từng lớp theo thứ tự phủ, công tắc (trừ Cốt), vạch trọng số, nút "Phủ lớp tiếp theo".
+// ui/layer-rail.js — thanh lớp: tên từng lớp theo thứ tự phủ, công tắc (trừ Cốt), vạch trọng số, Đồ nghề, nút "Phủ lớp tiếp theo".
 import { h } from './dom.js';
 
 /**
@@ -11,8 +11,9 @@ import { h } from './dom.js';
  * @param {Record<string, any>} opts.t
  * @param {boolean} opts.interactive
  * @param {{ open: (id: string) => void, toggle: (id: string, on: boolean) => void, next: () => void, close: () => void }} opts.on
+ * @param {HTMLElement | null} [opts.tools]  mục "Đồ nghề" (ui/rail-tools.js, GĐ 4), ngay dưới danh sách lớp
  */
-export function createRail(doc, { layers, t, interactive, on }) {
+export function createRail(doc, { layers, t, interactive, on, tools = null }) {
   const items = new Map();
   const list = h(doc, 'ol', {}, layers.map(({ id, name }, i) => {
     const open = h(doc, 'button', { type: 'button', class: 'rail-name', onclick: () => on.open(id) },
@@ -35,7 +36,7 @@ export function createRail(doc, { layers, t, interactive, on }) {
   }));
   const next = h(doc, 'button', { type: 'button', class: 'rail-next', hidden: true, onclick: () => on.next() });
   const close = h(doc, 'button', { type: 'button', class: 'rail-close', 'aria-label': t.rail.close, text: '×', onclick: () => on.close() });
-  const el = h(doc, 'nav', { class: 'rail', 'data-rail': '', 'aria-label': t.rail.label, hidden: true }, list, next, close);
+  const el = h(doc, 'nav', { class: 'rail', 'data-rail': '', 'aria-label': t.rail.label, hidden: true }, list, tools, next, close);
 
   return {
     el,
```

Áp vào `src/ui/workshop.js`:

```diff
diff --git a/src/ui/workshop.js b/src/ui/workshop.js
index 8585d85..451a92e 100644
--- a/src/ui/workshop.js
+++ b/src/ui/workshop.js
@@ -1,6 +1,7 @@
 // ui/workshop.js — xưởng trên trang: thanh lớp + Sổ tay + chế độ mài có hướng dẫn. Nhận studio() (null ở tầng tĩnh: chỉ đọc).
 import { createRail } from './layer-rail.js';
 import { createNotebook } from './notebook.js';
+import { createRailTools } from './rail-tools.js';
 
 /**
  * Chế độ mài (spec §4.1): mọi lớp trừ Cốt mờ dần về 0, bức trở về đất sét; "Phủ lớp tiếp theo" sơn lại lần lượt
@@ -26,6 +27,8 @@ export function mountWorkshop(doc, { meta, content, t, studio = () => null, onCl
   let bound = studio(); // bàn thợ đang vẽ Sổ tay; "Dựng lại cảnh" tạo bàn thợ mới
 
   const notebook = createNotebook(doc, { meta, content, t, studio, ...notebookOptions });
+  // Đồ nghề (công cụ học) và thanh trượt của các Dial: chỉ khi có cảnh 3D.
+  const tools = interactive ? createRailTools(doc, { t, content, studio }) : null;
   const openLayer = (id, options) => {
     notebook.show(id, options);
     rail.setActive(id);
@@ -49,6 +52,7 @@ export function mountWorkshop(doc, { meta, content, t, studio = () => null, onCl
       },
       close: () => close(),
     },
+    tools: tools?.el ?? null,
   });
   doc.body.append(rail.el, notebook.el);
 
@@ -57,6 +61,7 @@ export function mountWorkshop(doc, { meta, content, t, studio = () => null, onCl
     const s = studio();
     if (s) for (const { id } of meta.layers) rail.setWeight(id, s.weight(id));
     rail.setNext(nextLayer()?.name ?? null);
+    tools?.sync();
     // Cảnh vừa được dựng lại (bàn thợ mới, thí nghiệm về tắt hết): vẽ lại Sổ tay đang mở theo bàn thợ mới.
     if (s && s !== bound) {
       bound = s;
@@ -73,11 +78,12 @@ export function mountWorkshop(doc, { meta, content, t, studio = () => null, onCl
     frame = 0;
   };
 
-  /** Đóng thanh lớp và Sổ tay, phủ lại mọi lớp: về chế độ ngắm, thấy bức tranh hoàn chỉnh. */
+  /** Đóng thanh lớp và Sổ tay, tắt công cụ học, phủ lại mọi lớp: về chế độ ngắm, thấy bức tranh hoàn chỉnh. */
   function close() {
     stop();
     rail.el.hidden = true;
     notebook.hide();
+    if (interactive) studio()?.setTool(null);
     for (const { id } of rest) studio()?.setWeight(id, 1, { tween: true });
     onClose();
   }
```

Áp vào `src/ui/strings.vi.js`:

```diff
diff --git a/src/ui/strings.vi.js b/src/ui/strings.vi.js
index d469d60..465442b 100644
--- a/src/ui/strings.vi.js
+++ b/src/ui/strings.vi.js
@@ -79,6 +79,8 @@ const t = {
     toggle: (name) => `Bật hoặc tắt lớp ${name}`,
     next: (name) => `Phủ lớp tiếp theo · ${name}`,
     close: 'Đóng thanh lớp, xem lại bức tranh',
+    /** Mục dưới danh sách lớp (GĐ 4): công cụ học và thanh trượt của bức (Dial). */
+    tools: 'Đồ nghề',
   },
   /** Công cụ học (GĐ 4): tên trên nút "Đồ nghề" của thanh lớp, và chữ trên thanh điều khiển của từng công cụ. */
   tools: {
```

Áp vào `src/styles/tools.css`:

```diff
diff --git a/src/styles/tools.css b/src/styles/tools.css
index 246bc01..cac4a26 100644
--- a/src/styles/tools.css
+++ b/src/styles/tools.css
@@ -1,4 +1,4 @@
-/* styles/tools.css — thanh điều khiển của công cụ học (Kính mài, Lột lớp) và tay nắm của hình gạt; màu từ bảng sơn mài. */
+/* styles/tools.css — mục Đồ nghề và thanh giờ trong thanh lớp; thanh điều khiển của công cụ học và tay nắm gạt; màu từ bảng sơn mài. */
 
 /* Thanh công cụ: máy tính ở giữa đáy tranh, điện thoại ngay trên dải thanh lớp.
    KHÔNG đặt transform hay backdrop-filter lên .toolbar và .tool: cả hai tạo containing block cho con position: fixed,
@@ -73,6 +73,33 @@
   box-shadow: 0 2px 8px color-mix(in srgb, var(--den-then) 60%, transparent);
 }
 
+/* ── Mục "Đồ nghề" trong thanh lớp (ui/rail-tools.js): nút của từng công cụ, rồi thanh trượt của các Dial ─────────── */
+.rail-tools {
+  display: grid;
+  gap: 8px;
+  padding-top: 10px;
+  border-top: 1px solid color-mix(in srgb, var(--vang-la) 25%, transparent);
+}
+.rail-title { margin: 0; font: 600 11px/1.4 var(--sans); letter-spacing: 0.14em; text-transform: uppercase; color: var(--vang-la); }
+.rail-tool-list { display: flex; flex-wrap: wrap; gap: 6px; }
+.rail-tool-list button {
+  padding: 5px 12px;
+  font-size: 12px;
+  font-weight: 600;
+  background: none;
+  border: 1px solid var(--vang-la);
+  border-radius: 999px;
+}
+.rail-tool-list button[aria-pressed='true'] { color: var(--den-then); background: var(--vang-la); }
+.dial { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 2px 8px; }
+.dial label { font: 600 12px/1.4 var(--sans); color: var(--bac-la); }
+.dial output { font: 400 13px/1.4 var(--mono); color: var(--vang-la-sang); }
+.dial input { grid-column: 1 / -1; width: 100%; margin: 0; accent-color: var(--vang-la); }
+.dial input:focus-visible { outline: 2px solid var(--vang-la-sang); outline-offset: 2px; }
+/* Ghi chú là vùng aria-live: luôn có mặt, trống thì không chiếm chỗ. */
+.dial-note { grid-column: 1 / -1; margin: 0; font-size: 12px; line-height: 1.5; color: var(--bac-la); }
+.dial-chip { display: none; }
+
 /* Công cụ đang bật: thơ và con dấu ở chân tranh nhường chỗ cho thanh điều khiển (tắt công cụ thì hiện lại). */
 body[data-tool] .foot { visibility: hidden; }
 
@@ -81,4 +108,33 @@ body[data-tool] .foot { visibility: hidden; }
   .toolbar { bottom: 76px; padding: 0 8px; }
   .tool-panel { max-width: 100%; }
   body[data-tool] .notebook { display: none; }
+  /* Dải thanh lớp: Đồ nghề nằm cùng hàng, chỉ còn nút công cụ và nút nhỏ "◷ 21:00". Ô trượt mở ra ngay trên dải: nó đặt
+     theo khung nhìn (position: fixed), nên dải thanh lớp không được có backdrop-filter (thuộc tính đó biến dải thành khối
+     chứa của con fixed, và dải cuộn ngang thì cắt mất ô trượt). */
+  .rail { -webkit-backdrop-filter: none; backdrop-filter: none; }
+  .rail-tools { display: flex; align-items: center; flex-shrink: 0; gap: 6px; padding: 0 0 0 10px; border-top: 0; border-left: 1px solid color-mix(in srgb, var(--vang-la) 25%, transparent); }
+  .rail-title { display: none; }
+  .rail-tool-list { flex-wrap: nowrap; }
+  .rail-tool-list button,
+  .dial-chip { white-space: nowrap; }
+  .dial-chip {
+    display: inline-block;
+    padding: 5px 10px;
+    font: 400 12px/1.3 var(--mono);
+    color: var(--vang-la-sang);
+    background: none;
+    border: 1px solid color-mix(in srgb, var(--vang-la) 55%, transparent);
+    border-radius: 999px;
+  }
+  .rail-dials {
+    position: fixed;
+    left: 0;
+    right: 0;
+    bottom: 68px;
+    z-index: 3;
+    padding: 12px 16px;
+    background: var(--veil-strong);
+    border-top: 1px solid color-mix(in srgb, var(--vang-la) 35%, transparent);
+  }
+  .rail-dials:not([data-open]) { display: none; }
 }
```

Run: `npx vitest run tests/unit/rail-tools.test.js tests/unit/workshop.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  658 passed`.

```bash
git add src/styles/tools.css src/ui/dials.js src/ui/layer-rail.js src/ui/rail-tools.js src/ui/strings.vi.js src/ui/workshop.js tests/unit/rail-tools.test.js tests/unit/workshop.test.js
git commit -F - <<'EOF'
feat(ui): mục Đồ nghề trong thanh lớp (nút aria-pressed, mỗi lúc một công cụ) và thanh trượt Dial (ui/dials.js); đóng thanh lớp thì công cụ tắt

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 14: LUT "sơn mài" sinh từ bảng màu (`engine/stock/phu-bong/lut.js`)

**Mục tiêu:** Spec §6 Lớp 6 "chặng display", §5. LUT 32³ sinh bằng code từ bảng màu đã ghép của bức, không phải file ảnh:
- tách tông theo độ sáng: vùng tối kéo về `canhGian`, vùng sáng về `vangLa`, màu ngả xanh kéo về `cham`; độ sáng từng điểm gần như giữ nguyên;
- màu càng gần xám thì nhuộm càng mạnh, màu đậm (lá xanh, nhị vàng) chỉ nhuộm nhẹ; màu tối mà ngả lam (trời đêm) nhuộm chàm thay cho cánh gián, để trời không ngả nâu;
- `lutTexture(hex)` trả `Data3DTexture` với `LinearFilter` và `ClampToEdge` (`Lut3DNode` cần như vậy).

Test khóa **tính chất**, không khóa công thức: đen vẫn đen, trắng vẫn gần trắng; độ sáng lệch ít; xám tối ấm lên, xám sáng ngả vàng, xanh trời ngả chàm; bảng màu của bức đổi thì LUT đổi theo.

**Files:**
- Create: `src/engine/stock/phu-bong/lut.js`
- Test: Create `tests/unit/lut.test.js`

**Interfaces:**
- Consumes: bảng màu đã ghép (`ctx.palette.hex`).
- Produces: `LUT_SIZE = 32`; `luma(r, g, b)`; `lacquerLut(hex, size) → Uint8Array` (size³ × 4 byte); `lutTexture(hex, size) → Data3DTexture`.

- [ ] **Step 1: Test (hỏng: chưa có `lut.js`)**

Tạo `tests/unit/lut.test.js`:

```js
// tests/unit/lut.test.js — LUT "sơn mài": khóa TÍNH CHẤT (đen vẫn đen, trắng gần trắng, độ sáng lệch ít, tối ấm, sáng ngả vàng), không khóa công thức.
import { describe, it, expect } from 'vitest';
import { ClampToEdgeWrapping, LinearFilter } from 'three/webgpu';
import { LUT_SIZE, lacquerLut, luma, lutTexture } from '../../src/engine/stock/phu-bong/lut.js';
import { PALETTE, mergePalette } from '../../src/engine/palette.js';

const N = LUT_SIZE;
const lut = lacquerLut(PALETTE);
/** Màu ra (0–1) của ô gần màu vào (r, g, b) nhất. */
function at(data, r, g, b) {
  const [x, y, z] = [r, g, b].map((v) => Math.round(v * (N - 1)));
  const i = ((z * N + y) * N + x) * 4;
  return [data[i], data[i + 1], data[i + 2]].map((v) => v / 255);
}

describe('lacquerLut', () => {
  it('mảng RGBA8 dài 32³ × 4; alpha luôn 255', () => {
    expect(LUT_SIZE).toBe(32);
    expect(lut).toBeInstanceOf(Uint8Array);
    expect(lut.length).toBe(32 ** 3 * 4);
    for (let i = 3; i < lut.length; i += 4) if (lut[i] !== 255) throw new Error(`alpha ở ô ${i / 4} là ${lut[i]}`);
  });

  it('đen vẫn đen, trắng vẫn (gần) trắng', () => {
    expect(at(lut, 0, 0, 0)).toEqual([0, 0, 0]);
    for (const v of at(lut, 1, 1, 1)) expect(v).toBeGreaterThan(0.97);
  });

  it('độ sáng lệch ít: trung bình dưới 0,01, xấu nhất dưới 0,08 (chỉ lệch khi màu chạm biên 0 hay 1)', () => {
    let sum = 0;
    let worst = 0;
    for (let z = 0; z < N; z++) {
      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const i = ((z * N + y) * N + x) * 4;
          const d = Math.abs(luma(lut[i] / 255, lut[i + 1] / 255, lut[i + 2] / 255) - luma(x / (N - 1), y / (N - 1), z / (N - 1)));
          sum += d;
          worst = Math.max(worst, d);
        }
      }
    }
    expect(sum / N ** 3).toBeLessThan(0.01);
    expect(worst).toBeLessThan(0.08);
  });

  it('xám tối ấm lên (đỏ > lam); xám sáng ngả vàng (đỏ, lục > lam); xanh trời ngả chàm (lam trội hơn)', () => {
    const [r, , b] = at(lut, 0.2, 0.2, 0.2);
    expect(r).toBeGreaterThan(b);
    const [lr, lg, lb] = at(lut, 0.75, 0.75, 0.75);
    expect(lr).toBeGreaterThan(lb);
    expect(lg).toBeGreaterThan(lb);
    const sky = [0.2, 0.3, 0.6];
    const [sr, , sb] = at(lut, ...sky);
    expect(sb - sr).toBeGreaterThan(sky[2] - sky[0]);
  });

  it('bảng màu của bức đổi thì LUT đổi theo: ghi đè canhGian thì vùng tối đổi, vùng sáng thì không', () => {
    const green = lacquerLut(mergePalette({ canhGian: '#1F5A2A' }));
    const [r, g] = at(green, 0.2, 0.2, 0.2);
    expect(g).toBeGreaterThan(r);
    expect(at(green, 0.75, 0.75, 0.75)).toEqual(at(lut, 0.75, 0.75, 0.75));
  });
});

describe('lutTexture', () => {
  it('Data3DTexture 32³, LinearFilter (mặc định là Nearest: màu vỡ bậc), ClampToEdge ba chiều', () => {
    const texture = lutTexture(PALETTE);
    expect(texture.isData3DTexture).toBe(true);
    expect([texture.image.width, texture.image.height, texture.image.depth]).toEqual([32, 32, 32]);
    expect([texture.minFilter, texture.magFilter]).toEqual([LinearFilter, LinearFilter]);
    expect([texture.wrapS, texture.wrapT, texture.wrapR]).toEqual([ClampToEdgeWrapping, ClampToEdgeWrapping, ClampToEdgeWrapping]);
    expect(texture.image.data).toEqual(lut);
  });
});
```

Run: `npx vitest run tests/unit/lut.test.js`
Kết quả mong đợi: FAIL, 1 file test không chạy được; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/stock/phu-bong/lut.js' imported from tests/unit/lut.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/stock/phu-bong/lut.js`:

```js
// engine/stock/phu-bong/lut.js — LUT "sơn mài" 32³ sinh từ bảng màu đã ghép: tối ấm về cánh gián, sáng ánh vàng lá, xanh ngả chàm.
import { ClampToEdgeWrapping, Data3DTexture, LinearFilter } from 'three/webgpu';

/** Cạnh của khối LUT: 32 ô mỗi chiều (32³ = 32.768 màu mẫu); card đồ họa nội suy giữa các ô. */
export const LUT_SIZE = 32;

/** Độ mạnh của ba lần tách tông (0–1 theo sắc độ của màu đích). Núm lutIntensity của lớp trộn thêm một lần nữa. */
const STRENGTH = { shadow: 0.9, light: 0.35, blue: 0.7 };

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Độ sáng cảm nhận (hệ số Rec. 709), tính trên màu hiển thị. */
export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
/** Sắc độ của một màu: màu trừ đi độ sáng của nó. Cộng sắc độ vào một màu khác là "nhuộm" mà không đổi sáng. */
const chromaOf = (hex) => {
  const [r, g, b] = rgbOf(hex);
  const l = luma(r, g, b);
  return [r - l, g - l, b - l];
};

/**
 * Hàm thuần: mảng RGBA8 của LUT "sơn mài", ô (x, y, z) = màu vào (đỏ, lục, lam) như Lut3DNode tra (uvw = màu).
 * Tách tông theo độ sáng, rồi đặt lại độ sáng cũ: LUT đổi SẮC, gần như không đổi SÁNG.
 * - Vùng tối nhuộm sắc nâu cánh gián; tắt dần về 0 ở đen tuyệt đối, nên đen vẫn đen.
 * - Vùng sáng nhuộm sắc vàng lá; tắt dần ở trắng tuyệt đối, nên trắng vẫn trắng.
 * - Màu ngả lam (lam hơn cả đỏ lẫn lục) nhuộm thêm sắc chàm.
 * - Màu gần xám nhuộm mạnh, màu đậm nhuộm nhẹ: lá vẫn xanh, nhị vẫn vàng (màu của ca dao).
 * Màu lấy từ bảng đã ghép (ctx.palette.hex): bức ghi đè canhGian thì vùng tối của LUT đổi theo.
 * Đã loại hai cách: kéo mỗi màu về token gần nhất (ảnh thành tranh cắt dán), và gradient map theo độ sáng (mất hết lá xanh
 * và trời chàm).
 * @param {Record<string, string>} hex
 * @param {number} [size]
 * @returns {Uint8Array}  size³ × 4 byte
 */
export function lacquerLut(hex, size = LUT_SIZE) {
  const shadow = chromaOf(hex.canhGian);
  const light = chromaOf(hex.vangLa);
  const blue = chromaOf(hex.cham);
  const data = new Uint8Array(size ** 3 * 4);
  let i = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = [x / (size - 1), y / (size - 1), z / (size - 1)];
        const l = luma(...c);
        const bluish = clamp01((c[2] - Math.max(c[0], c[1])) * 2); // 0: không ngả lam; 1: lam hẳn
        // Màu càng gần xám thì nhuộm càng mạnh; màu đậm (lá xanh, nhị vàng) chỉ nhuộm nhẹ, để vẫn đúng màu của nó.
        const top = Math.max(...c);
        const soft = 0.4 + 0.6 * (top > 0 ? Math.min(...c) / top : 1);
        // Màu tối mà ngả lam (trời đêm) nhuộm chàm thay cho cánh gián: không để trời chàm ngả nâu.
        const ks = smooth(0, 0.12, l) * (1 - smooth(0.25, 0.6, l)) * (1 - bluish) * soft * STRENGTH.shadow;
        const kl = smooth(0.45, 0.85, l) * (1 - smooth(0.9, 1, l)) * soft * STRENGTH.light;
        const kb = bluish * STRENGTH.blue;
        const out = c.map((v, k) => v + shadow[k] * ks + light[k] * kl + blue[k] * kb);
        const drift = l - luma(...out); // đặt lại độ sáng: nhuộm là đổi sắc, không đổi sáng
        for (let k = 0; k < 3; k++) data[i++] = Math.round(clamp01(out[k] + drift) * 255);
        data[i++] = 255;
      }
    }
  }
  return data;
}

/**
 * Bọc LUT thành texture 3D cho lut3D(). Data3DTexture mặc định lọc NearestFilter (Phụ lục A.14): phải đặt LinearFilter để
 * card đồ họa nội suy giữa 32 ô, không thì màu vỡ thành bậc. Màu trong LUT đã là màu hiển thị: giữ NoColorSpace (mặc định).
 * @param {Record<string, string>} hex
 * @param {number} [size]
 */
export function lutTexture(hex, size = LUT_SIZE) {
  const texture = new Data3DTexture(lacquerLut(hex, size), size, size, size);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.wrapR = ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
```

Run: `npx vitest run tests/unit/lut.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  664 passed`.

```bash
git add src/engine/stock/phu-bong/lut.js tests/unit/lut.test.js
git commit -F - <<'EOF'
feat(phu-bong): LUT "sơn mài" 32³ sinh từ bảng màu đã ghép (lut.js: tách tông, giữ độ sáng); test khóa tính chất

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 15: Chặng display của Phủ bóng (LUT, hạt, tối góc, FXAA); hai tap

**Mục tiêu:** Spec §6 Lớp 6, Phụ lục A.47.
- `display.js#displayStage` nối, trên màu hiển thị: `lut3D` (theo `lutIntensity`) → hạt (hash của điểm ảnh và số khung, trừ 0,5 nên trung bình bằng 0; số khung tính từ `ctx.u.time`, nên `?freeze` cho đúng một lớp hạt) → tối góc đo theo tỉ lệ khung → `convertToTexture` → `mix(flat, fxaa(flat), weight × (1 − fxaaOff))`. FXAA và phép trộn cùng đọc MỘT RTT: lượt cuối không tính lại cả chuỗi display (A.47). Chặng display thêm đúng 1 lượt vẽ (mức cao: 35 draw call).
- Mọi thứ trộn theo trọng số của lớp: trọng số 0 là ảnh chưa phủ bóng.
- Núm mới: `lutIntensity` 0–1, `grain` 0–0,15, `vignette` 0–1, đều là uniform. Số mặc định tạm ở task này; Task 19 chốt bằng lượt màu. Thí nghiệm mới: "Tắt FXAA" (`noFxaa`).
- Hai tap: `tap('truoc-bloom', color)` và `tap('truoc-tone', color + glow × w)`; nhãn ở `content.layers['phu-bong'].taps`.
- `content.vi.js` viết lại phần Hiểu (≤ 150 chữ) theo hai chặng; `diagram.svg` vẽ hai chặng; `meta.js` liệt kê `layer.js`, `display.js`, `lut.js` cho khung code. `code-view.js` glob cả `engine/stock/*/*.js` (trừ `meta.js`, `content.*.js`).

**Files:**
- Create: `src/engine/stock/phu-bong/display.js`
- Modify: `src/engine/stock/phu-bong/layer.js`, `src/engine/stock/phu-bong/meta.js`, `src/engine/stock/phu-bong/content.vi.js`, `src/engine/stock/phu-bong/diagram.svg`, `src/ui/code-view.js`
- Test: `tests/unit/phu-bong.test.js`, `tests/paintings/contract.test.js`

**Interfaces:**
- Consumes: `lutTexture` (Task 14); `tap` của pipeline (Task 8).
- Produces: `displayStage({ color, weight, time, lut, lutIntensity, grain, vignette, fxaaOff }) → node`; knob `lutIntensity`, `grain`, `vignette`; thí nghiệm `noFxaa`; view `phu-bong:truoc-bloom`, `phu-bong:truoc-tone`.

- [ ] **Step 1: Test (hỏng: chưa có chặng display)**

Áp vào `tests/unit/phu-bong.test.js`:

```diff
diff --git a/tests/unit/phu-bong.test.js b/tests/unit/phu-bong.test.js
index e924f6a..d776df4 100644
--- a/tests/unit/phu-bong.test.js
+++ b/tests/unit/phu-bong.test.js
@@ -1,3 +1,4 @@
+// tests/unit/phu-bong.test.js — lớp dùng chung Phủ bóng: chặng build (bloom, tone, tap), chặng display (LUT, grain, vignette, FXAA), nấc.
 import { describe, it, expect, vi } from 'vitest';
 import { readFileSync } from 'node:fs';
 import { Scene, PerspectiveCamera } from 'three/webgpu';
@@ -5,6 +6,7 @@ import { pass, uniform } from 'three/tsl';
 import * as phuBong from '../../src/engine/stock/phu-bong/layer.js';
 import phuBongMeta from '../../src/engine/stock/phu-bong/meta.js';
 import { createKnobs } from '../../src/engine/gpu/knob-set.js';
+import { PALETTE } from '../../src/engine/palette.js';
 
 // Bọc bloom() thật để xem lớp gọi nó với tham số nào (vẫn dựng BloomNode thật).
 const created = vi.hoisted(() => []);
@@ -24,38 +26,58 @@ const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-2
 
 function makeCtx(budget = {}) {
   const knobs = createKnobs(phuBong.id, phuBong.knobs, env);
-  return { budget, knob: vi.fn(knobs.knob), knobs };
+  return { budget, knob: vi.fn(knobs.knob), knobs, palette: { hex: PALETTE }, u: { time: uniform(0) } };
 }
 
 function buildOnce(ctx) {
   const layer = phuBong.createLayer(ctx);
   const scenePass = pass(new Scene(), new PerspectiveCamera());
   const channel = vi.fn((name) => scenePass.getTextureNode(name));
-  const out = layer.post.build({ color: scenePass.getTextureNode('output'), channel, weight: uniform(1) });
-  return { layer, channel, out, glow: created.at(-1) };
+  const taps = [];
+  const out = layer.post.build({
+    color: scenePass.getTextureNode('output'), channel, weight: uniform(1), tap: (id, node) => taps.push([id, node]),
+  });
+  return { layer, channel, out, taps, scenePass, glow: created.at(-1) };
 }
 
 describe('engine/stock/phu-bong/meta.js', () => {
-  it('căn cước của lớp dùng chung', () => {
-    expect(phuBongMeta).toEqual({ id: 'phu-bong', name: 'Phủ bóng', files: ['engine/stock/phu-bong/layer.js'] });
+  it('căn cước của lớp dùng chung: file đầu là layer.js (hiện trước trong Sổ tay), rồi hai file của chặng display', () => {
+    expect(phuBongMeta).toEqual({
+      id: 'phu-bong',
+      name: 'Phủ bóng',
+      files: ['engine/stock/phu-bong/layer.js', 'engine/stock/phu-bong/display.js', 'engine/stock/phu-bong/lut.js'],
+    });
     expect(phuBongMeta.id).toBe(phuBong.id);
   });
 });
 
 describe('engine/stock/phu-bong/layer.js', () => {
-  it('knobs tĩnh: đủ núm của chặng build, tất cả là uniform; tone mapping là select none/agx/aces', () => {
+  it('knobs tĩnh: núm của chặng build và (GĐ 4) chặng display, tất cả là uniform; tone mapping là select none/agx/aces', () => {
     expect(phuBong.id).toBe('phu-bong');
-    expect(phuBong.knobs.map((k) => k.id)).toEqual(['bloomStrength', 'bloomRadius', 'bloomThreshold', 'toneMapping', 'exposure']);
+    expect(phuBong.knobs.map((k) => k.id)).toEqual([
+      'bloomStrength', 'bloomRadius', 'bloomThreshold', 'toneMapping', 'exposure', 'lutIntensity', 'grain', 'vignette',
+    ]);
+    const range = (id) => { const k = phuBong.knobs.find((x) => x.id === id); return [k.min, k.max]; };
+    expect([range('lutIntensity'), range('grain'), range('vignette')]).toEqual([[0, 1], [0, 0.15], [0, 1]]);
     for (const k of phuBong.knobs) expect(k.via ?? 'uniform').toBe('uniform');
     const tone = phuBong.knobs.find((k) => k.id === 'toneMapping');
     expect([tone.kind, tone.options, tone.value]).toEqual(['select', ['none', 'agx', 'aces'], 'agx']);
   });
 
-  it('chỉ có post.build (chặng display là GĐ 4)', () => {
-    const layer = phuBong.createLayer(makeCtx());
-    expect(typeof layer.post.build).toBe('function');
-    expect(layer.post.display).toBeUndefined();
-    expect(typeof layer.dispose).toBe('function');
+  it('có đủ hai chặng: build (HDR) và display (màu hiển thị: LUT, grain, vignette, FXAA)', () => {
+    const ctx = makeCtx();
+    const { layer, scenePass } = buildOnce(ctx);
+    const shown = layer.post.display({ color: scenePass.getTextureNode('output'), channel: () => null, weight: uniform(1) });
+    expect(shown.isNode).toBe(true);
+    for (const id of ['lutIntensity', 'grain', 'vignette']) expect(ctx.knob).toHaveBeenCalledWith(id);
+    layer.dispose();
+  });
+
+  it('tap (GĐ 4): chụp "truoc-bloom" (màu cảnh) rồi "truoc-tone" (màu + bloom), là biểu thức thuần, theo thứ tự pipeline', () => {
+    const { taps, scenePass } = buildOnce(makeCtx());
+    expect(taps.map(([id]) => id)).toEqual(['truoc-bloom', 'truoc-tone']);
+    expect(taps[0][1]).toBe(scenePass.getTextureNode('output'));
+    expect(taps[1][1].isNode).toBe(true);
   });
 
   it('build dựng node từ texture của một pass thật; bloom nhận ĐÚNG uniform của ba núm bloom', () => {
@@ -81,9 +103,11 @@ describe('engine/stock/phu-bong/layer.js', () => {
     const ctx = makeCtx();
     const { channel, layer } = buildOnce(ctx);
     expect(channel).toHaveBeenCalledWith('output');
-    const [exp] = layer.experiments;
+    const [exp, noFxaa] = layer.experiments;
     expect(exp.id).toBe('wholeFrame');
     expect(() => { exp.toggle(true); exp.toggle(false); }).not.toThrow();
+    expect(noFxaa.id).toBe('noFxaa'); // GĐ 4: "Tắt FXAA", một uniform
+    expect(() => { noFxaa.toggle(true); noFxaa.toggle(false); }).not.toThrow();
     layer.dispose();
   });
```

Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index 749eb1d..ea11468 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -8,6 +8,8 @@ import { mergePalette } from '../../src/engine/palette.js';
 import { hasCode } from '../../src/ui/code-view.js';
 import { NOW, buildPainting } from '../helpers/fake-ctx.js';
 import { svgColors } from '../helpers/svg.js';
+import { pass } from 'three/tsl';
+import { buildFinalNode, makeMRT } from '../../src/engine/gpu/pipeline.js';
 
 const SRC = resolve(import.meta.dirname, '../../src');
 const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
@@ -228,6 +230,19 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
       }
     });
 
+    it.each(langs)('%s: mọi tap mà các lớp ghi trong build/display có nhãn ở content.layers[id].taps (GĐ 4)', async (lang) => {
+      const { default: content } = await entry.content[lang]();
+      const { ctx, built } = buildPainting(await entry.load(), meta);
+      const scenePass = pass(ctx.scene, ctx.camera);
+      scenePass.setMRT(makeMRT());
+      const channel = (name) => (name === 'depth' ? scenePass.getLinearDepthNode() : scenePass.getTextureNode(name));
+      const taps = [];
+      buildFinalNode({ color: channel('output'), channel, layers: built, weight: ctx.weight, taps });
+      for (const { layerId, tapId } of taps) {
+        expect(content.layers?.[layerId]?.taps?.[tapId], `nhãn tap "${layerId}:${tapId}"`).toBeTruthy();
+      }
+    });
+
     it.each(langs)('%s: sơ đồ (nếu có) là SVG có <title>, chỉ dùng màu của bảng sơn mài', async (lang) => {
       const { default: content } = await entry.content[lang]();
       for (const [id, text] of Object.entries(content.layers ?? {})) {
```

Run: `npx vitest run tests/unit/phu-bong.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: FAIL, 5 test hỏng; lỗi đầu tiên: `AssertionError: expected { id: 'phu-bong', …(2) } to deeply equal { id: 'phu-bong', …(2) }`.

- [ ] **Step 2: Code**

Tạo `src/engine/stock/phu-bong/display.js`:

```js
// engine/stock/phu-bong/display.js — chặng display của Phủ bóng (màu hiển thị vào → ra): LUT sơn mài, grain, vignette, FXAA; trộn theo trọng số.
import { convertToTexture, floor, length, mix, mx_cell_noise_float, oneMinus, screenCoordinate, screenSize, screenUV, smoothstep, texture3D, vec2, vec3, vec4 } from 'three/tsl';
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { LUT_SIZE } from './lut.js';

/**
 * Bốn bước, trên MÀU HIỂN THỊ (sRGB, sau renderOutput): LUT và FXAA cần đúng không gian này (Phụ lục A.41, A.6).
 * 1. LUT "sơn mài" (lut3D): tra màu trong khối 32³ sinh từ bảng màu (lut.js).
 * 2. Grain: nhiễu (hash của điểm ảnh và số khung) trừ 0,5, nên trung bình bằng 0: ảnh không sáng hay tối đi. Số khung tính
 *    từ ctx.u.time, nên ?freeze cho ra đúng cùng một lớp hạt. Không dùng film() của three: nó không có trung bình 0.
 * 3. Vignette: tối dần theo khoảng cách tới tâm khung, đo theo tỉ lệ khung nên góc khung dẹt cũng tối như góc khung vuông.
 * 4. FXAA đứng cuối: chuỗi phía trước được vẽ ra một ảnh riêng (RTT, +1 lượt vẽ mỗi khung), rồi FXAA đọc các điểm quanh
 *    từng điểm ảnh để làm mềm mép răng cưa (Phụ lục A.42).
 * Mọi bước trộn theo trọng số `weight` của lớp: 0 là ảnh chưa phủ bóng (không LUT, không hạt, không tối góc, không FXAA).
 * @param {{ color: any, weight: any, time: any, lut: any, lutIntensity: any, grain: any, vignette: any, fxaaOff: any }} p
 *   lut: Data3DTexture (lutTexture); fxaaOff: uniform 0/1 của thí nghiệm "Tắt FXAA"; còn lại là uniform của núm
 */
export function displayStage({ color, weight, time, lut, lutIntensity, grain, vignette, fxaaOff }) {
  const graded = lut3D(color, texture3D(lut), LUT_SIZE, lutIntensity.mul(weight));
  const frame = floor(time.mul(60));
  const noise = mx_cell_noise_float(vec3(floor(screenCoordinate.xy), frame)); // [0, 1), đổi theo điểm ảnh và theo khung
  const grained = graded.rgb.add(noise.sub(0.5).mul(grain).mul(weight));
  const aspect = screenSize.x.div(screenSize.y);
  const corner = length(vec2(aspect, 1).mul(0.5)); // khoảng cách từ tâm tới góc, để góc khung luôn là 1
  const edge = length(screenUV.sub(0.5).mul(vec2(aspect, 1))).div(corner);
  const shaded = grained.mul(oneMinus(smoothstep(0.45, 1.1, edge).mul(vignette).mul(weight)));
  const flat = convertToTexture(vec4(shaded, 1)); // chuỗi phía trước → một RTT; FXAA và phép trộn đều đọc ảnh này
  return mix(flat, fxaa(flat), weight.mul(oneMinus(fxaaOff)));
}
```

Áp vào `src/engine/stock/phu-bong/layer.js`:

```diff
diff --git a/src/engine/stock/phu-bong/layer.js b/src/engine/stock/phu-bong/layer.js
index 4e32362..8960546 100644
--- a/src/engine/stock/phu-bong/layer.js
+++ b/src/engine/stock/phu-bong/layer.js
@@ -1,6 +1,8 @@
-// engine/stock/phu-bong/layer.js — lớp dùng chung "Phủ bóng": bloom chọn lọc trên kênh emissive + tone mapping chọn bằng uniform, trộn theo trọng số.
+// engine/stock/phu-bong/layer.js — lớp dùng chung "Phủ bóng": build (bloom chọn lọc + tone) và display (LUT, grain, vignette, FXAA), trộn theo trọng số.
 import { Fn, If, acesFilmicToneMapping, agxToneMapping, mix, uniform, vec4 } from 'three/tsl';
 import { bloom } from 'three/addons/tsl/display/BloomNode.js';
+import { displayStage } from './display.js';
+import { lutTexture } from './lut.js';
 
 export const id = 'phu-bong';
 
@@ -14,6 +16,10 @@ export const knobs = [
   { id: 'bloomThreshold', min: 0, max: 2, step: 0.01, value: 0 },
   { id: 'toneMapping', kind: 'select', options: Object.keys(TONE), value: 'agx' },
   { id: 'exposure', min: 0.1, max: 3, step: 0.01, value: 1 },
+  // Chặng display (GĐ 4). Số mặc định chốt ở lượt màu GĐ 4 (spec §5).
+  { id: 'lutIntensity', min: 0, max: 1, step: 0.01, value: 0.6 },
+  { id: 'grain', min: 0, max: 0.15, step: 0.005, value: 0.03 },
+  { id: 'vignette', min: 0, max: 1, step: 0.01, value: 0.35 },
 ];
 
 /**
@@ -31,11 +37,15 @@ export function createLayer(ctx) {
   };
   // Thí nghiệm "Bloom cả khung": 0 = chỉ ảnh emissive tỏa (chọn lọc), 1 = cả ảnh màu tỏa.
   const whole = uniform(0).setName('phu_bong_whole');
+  // Thí nghiệm "Tắt FXAA" (GĐ 4): 1 = bỏ bước khử răng cưa, mép lá và cuống sen lộ bậc thang.
+  const fxaaOff = uniform(0).setName('phu_bong_fxaaOff');
+  // LUT sinh từ bảng màu ĐÃ GHÉP của bức: bức đổi màu thì LUT tự đổi theo (spec §5).
+  const lut = lutTexture(ctx.palette.hex);
 
   return {
     post: {
       /** HDR tuyến tính vào → ra. Xưởng gọi MỘT lần khi dựng pipeline. */
-      build({ color, channel, weight }) {
+      build({ color, channel, weight, tap }) {
         // Bloom CHỌN LỌC: làm nhòe ảnh emissive của MRT, không nhòe cả khung hình.
         glow = bloom(
           mix(channel('emissive'), channel('output'), whole),
@@ -46,6 +56,10 @@ export function createLayer(ctx) {
         glow.setResolutionScale(scale);
         const exposure = ctx.knob('exposure');
         const tone = ctx.knob('toneMapping');
+        // Ảnh chụp giữa chừng cho công cụ học (GĐ 4), theo thứ tự trong pipeline. Phải là biểu thức THUẦN (texture của
+        // scene pass, texture của bloom, uniform), không phải biến .toVar() trong Fn: Kính mài tính lại nó ở lượt vẽ cuối.
+        tap?.('truoc-bloom', color);
+        tap?.('truoc-tone', color.add(glow.mul(weight)));
 
         // Chọn tone bằng If trong Fn, KHÔNG dùng select(): trong r186 select() sinh if/else, node dựng lần đầu
         // trong một nhánh rồi dùng lại bên ngoài (hdr.a) sẽ đọc biến chưa gán → alpha 0 (Phụ lục A.6).
@@ -63,6 +77,19 @@ export function createLayer(ctx) {
           return vec4(mix(lin, toned, weight), hdr.a);
         })();
       },
+      /** Màu hiển thị vào → ra (GĐ 4): LUT sơn mài, grain, vignette, FXAA (display.js). */
+      display({ color, weight }) {
+        return displayStage({
+          color,
+          weight,
+          time: ctx.u.time, // đồng hồ của xưởng: ?freeze cho ra đúng cùng một lớp hạt
+          lut,
+          lutIntensity: ctx.knob('lutIntensity'), // @knob lutIntensity
+          grain: ctx.knob('grain'), // @knob grain
+          vignette: ctx.knob('vignette'), // @knob vignette
+          fxaaOff,
+        });
+      },
     },
     experiments: [
       {
@@ -71,6 +98,7 @@ export function createLayer(ctx) {
           whole.value = on ? 1 : 0;
         },
       },
+      { id: 'noFxaa', toggle: (on) => { fxaaOff.value = on ? 1 : 0; } },
     ],
     readouts: [{ id: 'bloomScale', get: () => scale }],
     // Nấc của bộ điều chỉnh (spec §10): ảnh bloom còn một nửa mỗi chiều, tức một phần tư số điểm ảnh phải làm nhòe.
@@ -78,6 +106,7 @@ export function createLayer(ctx) {
     dispose() {
       glow?.dispose();
       glow = null;
+      lut.dispose();
     },
   };
 }
```

Áp vào `src/engine/stock/phu-bong/meta.js`:

```diff
diff --git a/src/engine/stock/phu-bong/meta.js b/src/engine/stock/phu-bong/meta.js
index ac2587f..3c617aa 100644
--- a/src/engine/stock/phu-bong/meta.js
+++ b/src/engine/stock/phu-bong/meta.js
@@ -1,2 +1,6 @@
 // engine/stock/phu-bong/meta.js — căn cước của lớp dùng chung "Phủ bóng" (dữ liệu thuần, đường nhẹ import được).
-export default { id: 'phu-bong', name: 'Phủ bóng', files: ['engine/stock/phu-bong/layer.js'] };
+export default {
+  id: 'phu-bong',
+  name: 'Phủ bóng',
+  files: ['engine/stock/phu-bong/layer.js', 'engine/stock/phu-bong/display.js', 'engine/stock/phu-bong/lut.js'],
+};
```

Áp vào `src/engine/stock/phu-bong/content.vi.js`:

```diff
diff --git a/src/engine/stock/phu-bong/content.vi.js b/src/engine/stock/phu-bong/content.vi.js
index f810c7b..c280ba7 100644
--- a/src/engine/stock/phu-bong/content.vi.js
+++ b/src/engine/stock/phu-bong/content.vi.js
@@ -10,22 +10,27 @@ export default {
   layers: {
     'phu-bong': {
       understand:
-        'Phủ bóng là bước cuối của nghề sơn mài, và cũng là bước cuối của mỗi khung hình. Cảnh được vẽ '
-        + 'một lần ra hai ảnh cùng lúc (MRT): ảnh màu, và ảnh chỉ có phần tự phát sáng. Bloom làm nhòe riêng '
-        + 'ảnh phát sáng rồi cộng lại, nên chỉ vật phát sáng mới tỏa hào quang: đó là bloom chọn lọc. Cảnh được '
-        + 'tính trong dải sáng rộng (HDR), có chỗ sáng gấp nhiều lần mức màn hình hiển thị được. Tone mapping '
-        + 'nén dải ấy về màn hình mà vẫn giữ chi tiết vùng sáng: AgX nhẹ và trung thực, ACES đậm và tương '
-        + 'phản hơn. Tắt lớp này thì mọi vùng sáng cháy trắng.',
+        'Phủ bóng là bước cuối của nghề sơn mài, và cũng là bước cuối của mỗi khung hình. Nó có hai chặng. Chặng '
+        + 'build làm việc trên ảnh HDR, dải sáng rộng hơn màn hình: cảnh được vẽ một lần ra hai ảnh (MRT), ảnh màu '
+        + 'và ảnh chỉ có phần tự phát sáng; bloom làm nhòe riêng ảnh phát sáng rồi cộng lại, nên chỉ vật phát sáng '
+        + 'mới tỏa. Tone mapping nén dải sáng ấy về màn hình mà vẫn giữ chi tiết vùng sáng. Chặng display làm việc '
+        + 'trên màu của màn hình: LUT sơn mài nhuộm vùng tối nâu cánh gián, vùng sáng vàng lá; grain rắc hạt mịn '
+        + 'như mặt sơn; vignette tối dần về góc; FXAA làm mềm mép răng cưa. Tắt lớp này thì vùng sáng cháy trắng '
+        + 'và mép hình lộ bậc thang.',
       diagram,
       learned: [
         'MRT: một lần vẽ ghi ra nhiều ảnh.',
         'Bloom chọn lọc: chỉ phần tự phát sáng mới tỏa.',
         'Tone mapping: nén dải sáng HDR về dải của màn hình.',
+        'LUT 3D: tra mỗi màu trong một khối màu sinh sẵn để đổi tông cả ảnh.',
+        'FXAA: khử răng cưa trên ảnh đã vẽ xong, không phải vẽ lại cảnh.',
       ],
       readMore: [
         { title: 'LearnOpenGL · Bloom', url: 'https://learnopengl.com/Advanced-Lighting/Bloom' },
         { title: 'LearnOpenGL · HDR', url: 'https://learnopengl.com/Advanced-Lighting/HDR' },
         { title: 'Ví dụ three.js: bloom chọn lọc qua emissive', url: 'https://threejs.org/examples/#webgpu_postprocessing_bloom_emissive' },
+        { title: 'Ví dụ three.js: LUT 3D', url: 'https://threejs.org/examples/#webgpu_postprocessing_3dlut' },
+        { title: 'Ví dụ three.js: FXAA', url: 'https://threejs.org/examples/#webgpu_postprocessing_fxaa' },
       ],
       knobs: {
         bloomStrength: 'Độ tỏa',
@@ -33,6 +38,9 @@ export default {
         bloomThreshold: 'Ngưỡng tỏa',
         toneMapping: { label: 'Tone mapping', options: { none: 'Không', agx: 'AgX', aces: 'ACES' } },
         exposure: 'Phơi sáng',
+        lutIntensity: 'Độ nhuộm LUT sơn mài',
+        grain: 'Hạt (grain)',
+        vignette: 'Tối góc (vignette)',
       },
       experiments: {
         wholeFrame: {
@@ -40,7 +48,14 @@ export default {
           explain: 'Cho cả ảnh màu vào bloom thay vì chỉ phần tự phát sáng: mọi thứ nhòe bết như sương '
             + 'đọng trên ống kính. Vì vậy bloom cần chọn lọc.',
         },
+        noFxaa: {
+          label: 'Tắt FXAA',
+          explain: 'Bỏ bước khử răng cưa: mép hình và những đường mảnh lộ ra bậc thang của từng điểm ảnh. FXAA không '
+            + 'vẽ lại cảnh: nó đọc các điểm quanh mỗi điểm ảnh rồi làm mềm chỗ có mép.',
+        },
       },
+      // Ảnh chụp giữa chừng của pipeline (tap), cho Kính mài và Lột lớp soi.
+      taps: { 'truoc-bloom': 'Trước bloom', 'truoc-tone': 'Trước tone' },
       readouts: { bloomScale: 'Độ phân giải bloom (so với màn hình)' },
     },
   },
```

Áp vào `src/engine/stock/phu-bong/diagram.svg`:

```diff
diff --git a/src/engine/stock/phu-bong/diagram.svg b/src/engine/stock/phu-bong/diagram.svg
index 902c63b..8968042 100644
--- a/src/engine/stock/phu-bong/diagram.svg
+++ b/src/engine/stock/phu-bong/diagram.svg
@@ -1,5 +1,5 @@
-<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" role="img" aria-labelledby="dg-pb-title" font-family="'Be Vietnam Pro', system-ui, sans-serif" font-size="12">
-  <title id="dg-pb-title">Hậu kỳ: cảnh được vẽ một lần ra hai ảnh (MRT): ảnh màu và ảnh chỉ có phần tự phát sáng. Bloom làm nhòe ảnh phát sáng rồi cộng vào ảnh màu. Tone mapping nén dải sáng HDR về màn hình.</title>
+<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 240" role="img" aria-labelledby="dg-pb-title" font-family="'Be Vietnam Pro', system-ui, sans-serif" font-size="12">
+  <title id="dg-pb-title">Hậu kỳ hai chặng. Chặng build: cảnh được vẽ một lần ra hai ảnh (MRT), ảnh màu và ảnh chỉ có phần tự phát sáng; bloom làm nhòe ảnh phát sáng rồi cộng vào ảnh màu; tone mapping nén dải sáng HDR về màn hình. Chặng display: LUT sơn mài, hạt, tối góc, rồi FXAA khử răng cưa.</title>
   <defs>
     <marker id="dg-pb-mui" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
       <path d="M0 0 L10 5 L0 10 Z" fill="#D4A94A"/>
@@ -12,6 +12,12 @@
     <rect x="200" y="104" width="54" height="36" rx="6"/>
     <rect x="280" y="60" width="70" height="44" rx="6"/>
   </g>
+  <g fill="#3B1F14" stroke="#D4A94A" stroke-width="1">
+    <rect x="10" y="182" width="70" height="36" rx="6"/>
+    <rect x="100" y="182" width="70" height="36" rx="6"/>
+    <rect x="190" y="182" width="70" height="36" rx="6"/>
+    <rect x="280" y="182" width="70" height="36" rx="6"/>
+  </g>
   <g fill="#EDE3CF" text-anchor="middle">
     <text x="41" y="86">cảnh</text>
     <text x="140" y="48">màu</text>
@@ -19,6 +25,10 @@
     <text x="227" y="126">bloom</text>
     <text x="315" y="80">tone</text>
     <text x="315" y="95">mapping</text>
+    <text x="45" y="204">LUT</text>
+    <text x="135" y="204">hạt</text>
+    <text x="225" y="204">tối góc</text>
+    <text x="315" y="204">FXAA</text>
   </g>
   <g stroke="#D4A94A" stroke-width="1.6" fill="none">
     <path d="M72 76 L102 50" marker-end="url(#dg-pb-mui)"/>
@@ -26,9 +36,13 @@
     <path d="M176 122 H198" marker-end="url(#dg-pb-mui)"/>
     <path d="M176 44 H246 L278 72" marker-end="url(#dg-pb-mui)"/>
     <path d="M254 116 L278 92" marker-end="url(#dg-pb-mui)"/>
+    <path d="M315 104 V150 H45 V180" marker-end="url(#dg-pb-mui)"/>
+    <path d="M80 200 H98" marker-end="url(#dg-pb-mui)"/>
+    <path d="M170 200 H188" marker-end="url(#dg-pb-mui)"/>
+    <path d="M260 200 H278" marker-end="url(#dg-pb-mui)"/>
   </g>
-  <text x="88" y="16" fill="#8A8580" text-anchor="middle">MRT: 1 lần vẽ, 2 ảnh</text>
+  <text x="88" y="16" fill="#8A8580" text-anchor="middle">build · HDR: 1 lần vẽ, 2 ảnh (MRT)</text>
   <text x="262" y="92" fill="#F2D48A" text-anchor="middle">+</text>
-  <text x="315" y="126" fill="#8A8580" text-anchor="middle">HDR → màn hình</text>
-  <text x="180" y="162" fill="#F2D48A" text-anchor="middle">chỉ thứ phát sáng mới tỏa (bloom chọn lọc)</text>
+  <text x="180" y="164" fill="#8A8580" text-anchor="middle">display · màu màn hình</text>
+  <text x="180" y="234" fill="#F2D48A" text-anchor="middle">chỉ thứ phát sáng mới tỏa; FXAA đứng cuối</text>
 </svg>
```

Áp vào `src/ui/code-view.js`:

```diff
diff --git a/src/ui/code-view.js b/src/ui/code-view.js
index 09318f7..603cd7c 100644
--- a/src/ui/code-view.js
+++ b/src/ui/code-view.js
@@ -2,8 +2,12 @@
 
 // import.meta.glob chỉ được dùng ở file này, và luôn kèm ?code (tests/rules/imports.test.js giữ). Glob KHÔNG eager:
 // mỗi file thành một chunk riêng, chỉ tải khi Sổ tay mở tab Chỉnh của lớp đó. _mau là tranh mẫu, không deploy.
+// Lớp dùng chung: mọi file code của nó (GĐ 4: Phủ bóng có layer, display, lut), trừ meta và chữ.
 const FILES = import.meta.glob(
-  ['../paintings/*/layers/*.js', '../paintings/*/parts/*.js', '../engine/stock/*/layer.js', '!../paintings/_mau/**'],
+  [
+    '../paintings/*/layers/*.js', '../paintings/*/parts/*.js', '../engine/stock/*/*.js',
+    '!../paintings/_mau/**', '!../engine/stock/*/meta.js', '!../engine/stock/*/content.*.js',
+  ],
   { query: '?code', import: 'default' },
 );
```

Run: `npx vitest run tests/unit/phu-bong.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  667 passed`.

```bash
git add src/engine/stock/phu-bong/content.vi.js src/engine/stock/phu-bong/diagram.svg src/engine/stock/phu-bong/display.js src/engine/stock/phu-bong/layer.js src/engine/stock/phu-bong/meta.js src/ui/code-view.js tests/paintings/contract.test.js tests/unit/phu-bong.test.js
git commit -F - <<'EOF'
feat(phu-bong): chặng display (LUT sơn mài, grain, vignette, FXAA, trộn theo trọng số), núm lutIntensity/grain/vignette, "Tắt FXAA", tap Trước bloom/Trước tone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 16: Cờ `?poster`

**Mục tiêu:** Spec §8.7 `?poster`. `flags.js` đã đọc cờ này từ GĐ 0; GĐ 4 cho nó tác dụng, để chụp poster từ chính cảnh (Task 20):
- `mountShell(doc, meta, { …, poster })` đặt `body[data-poster]`; CSS ẩn mọi UI trừ canvas (tên, thơ, con dấu, huy hiệu, thanh lớp, Sổ tay, thanh công cụ);
- không gợi ý "Chạm vào mặt nước", không lời mời mài lớp;
- `boot.js` truyền `flags.poster`. Ảnh poster trong trang đổi selector thành `img[data-poster]`, vì `body` cũng có thể mang `data-poster`.
- `tests/helpers/page.js` gỡ `data-poster` và `data-tool` giữa các test.

**Files:**
- Modify: `src/ui/shell.js`, `src/engine/boot.js`, `src/styles/shell.css`
- Test: `tests/unit/shell.test.js`, `tests/unit/boot.test.js`, `tests/helpers/page.js`

**Interfaces:**
- Consumes: `flags.poster` (có từ GĐ 0).
- Produces: `mountShell(doc, meta, { now, t, onState, poster })`; `body[data-poster]`.

- [ ] **Step 1: Test (hỏng: `?poster` chưa có tác dụng)**

Áp vào `tests/helpers/page.js`:

```diff
diff --git a/tests/helpers/page.js b/tests/helpers/page.js
index 78c612b..ca65378 100644
--- a/tests/helpers/page.js
+++ b/tests/helpers/page.js
@@ -16,9 +16,11 @@ export const PAGE_BODY = `
 export function mountPage(doc = document) {
   doc.body.innerHTML = PAGE_BODY;
   doc.body.dataset.state = 'poster';
+  delete doc.body.dataset.poster; // cờ ?poster của test trước (GĐ 4)
+  delete doc.body.dataset.tool;
   const $ = (sel) => doc.querySelector(sel);
   return {
-    poster: $('[data-poster]'),
+    poster: $('img[data-poster]'),
     stage: $('[data-stage]'),
     badge: $('[data-badge]'),
     badgeNote: $('[data-badge-note]'),
```

Áp vào `tests/unit/shell.test.js`:

```diff
diff --git a/tests/unit/shell.test.js b/tests/unit/shell.test.js
index 2d9b205..3e9c260 100644
--- a/tests/unit/shell.test.js
+++ b/tests/unit/shell.test.js
@@ -213,6 +213,25 @@ describe('trăng SVG', () => {
 });
 
 
+describe('?poster (GĐ 4): chỉ còn canvas để chụp poster', () => {
+  it('body[data-poster]; không gợi ý, không lời mời; poster (img) vẫn là ảnh poster, không phải body', () => {
+    const shell = mountShell(document, meta, { now: NOW, t, poster: true });
+    expect(document.body.hasAttribute('data-poster')).toBe(true);
+    shell.setState('live');
+    shell.showHint('Chạm vào mặt nước');
+    shell.invite(() => {});
+    expect(page.hint.childNodes).toHaveLength(0);
+    shell.setState('static');
+    expect(page.poster.hidden).toBe(false); // vẫn đúng ảnh poster: shell không nhầm body là poster
+    expect(document.body.hidden).toBe(false);
+  });
+
+  it('không có cờ thì không gắn data-poster', () => {
+    mountShell(document, meta, { now: NOW, t });
+    expect(document.body.hasAttribute('data-poster')).toBe(false);
+  });
+});
+
 describe('gợi ý và lời mời', () => {
   it('showHint hiện chữ của bức; invite đổi thành NÚT mời có số lớp; bấm thì lời mời biến mất và gọi onOpen', () => {
     const shell = mountShell(document, meta, { now: NOW, t });
```

Áp vào `tests/unit/boot.test.js`:

```diff
diff --git a/tests/unit/boot.test.js b/tests/unit/boot.test.js
index cf71fb9..c51b44d 100644
--- a/tests/unit/boot.test.js
+++ b/tests/unit/boot.test.js
@@ -140,6 +140,11 @@ describe('boot', () => {
     expect(page.note.textContent).not.toContain(t.lost.rebuild);
   });
 
+  it('?poster (GĐ 4): vỏ trang gắn body[data-poster] (CSS ẩn mọi UI trừ canvas)', async () => {
+    await boot(entry, { t, win: fakeWin({ search: '?static&poster' }), doc });
+    expect(doc.body.hasAttribute('data-poster')).toBe(true);
+  });
+
   it('(f) onFail sau khi đã live → tầng tĩnh với đúng lý do đó', async () => {
     const win = webglWin();
     let onFail;
```

Run: `npx vitest run tests/unit/shell.test.js tests/unit/boot.test.js`
Kết quả mong đợi: FAIL, 2 test hỏng; lỗi đầu tiên: `AssertionError: expected false to be true // Object.is equality`.

- [ ] **Step 2: Code**

Áp vào `src/ui/shell.js`:

```diff
diff --git a/src/ui/shell.js b/src/ui/shell.js
index ed946d9..bfbe8a1 100644
--- a/src/ui/shell.js
+++ b/src/ui/shell.js
@@ -1,4 +1,4 @@
-// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, hòa dần poster → canvas, huy hiệu, ghi chú, gợi ý và lời mời
+// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, hòa dần poster → canvas, huy hiệu, ghi chú, gợi ý, lời mời, ?poster
 import { lunarFromDate, canChiIndex } from '../lib/astro/lunar.js';
 import { moonPhase } from '../lib/astro/moon.js';
 import { renderBadge } from './badge.js';
@@ -18,11 +18,14 @@ const POSTER_STATES = ['static', 'lost'];
  * được bỏ `hidden` vừa được điền chữ trong cùng một nhịp thường bị VoiceOver bỏ qua, không đọc.
  * @param {Document} doc
  * @param {object} meta  PaintingMeta của bức (lời mời "{n} lớp")
- * @param {{ now: Date, t: Record<string, any>, onState?: (state: string) => void }} opts
+ * @param {{ now: Date, t: Record<string, any>, onState?: (state: string) => void, poster?: boolean }} opts
+ *   poster: cờ ?poster (GĐ 4): body[data-poster], CSS ẩn mọi UI trừ canvas; không gợi ý, không lời mời
  */
-export function mountShell(doc, meta, { now, t, onState = () => {} }) {
+export function mountShell(doc, meta, { now, t, onState = () => {}, poster: posterMode = false }) {
   const $ = (sel) => doc.querySelector(sel);
-  const poster = $('[data-poster]');
+  // img: từ GĐ 4, body cũng có thể mang data-poster (cờ ?poster), nên chỉ rõ là ảnh.
+  const poster = $('img[data-poster]');
+  if (posterMode) doc.body.dataset.poster = '';
   const stageEl = $('[data-stage]');
   const badge = $('[data-badge]');
   const badgeNote = $('[data-badge-note]');
@@ -126,7 +129,7 @@ export function mountShell(doc, meta, { now, t, onState = () => {} }) {
 
   /** Gợi ý của bức (content.hint), hiện khi cảnh đã live. Tầng tĩnh thì thôi. */
   function showHint(text) {
-    if (!hint || !text || showingPoster()) return;
+    if (!hint || !text || showingPoster() || posterMode) return;
     hint.dataset.kind = 'hint';
     hint.textContent = text;
   }
@@ -137,7 +140,7 @@ export function mountShell(doc, meta, { now, t, onState = () => {} }) {
    * @param {() => void} [onOpen]
    */
   function invite(onOpen) {
-    if (!hint || showingPoster()) return;
+    if (!hint || showingPoster() || posterMode) return;
     hint.dataset.kind = 'invite';
     hint.replaceChildren(button(t.invite(meta.layers.length), () => {
       clearHint();
```

Áp vào `src/engine/boot.js`:

```diff
diff --git a/src/engine/boot.js b/src/engine/boot.js
index 3bd429c..7ea1fc8 100644
--- a/src/engine/boot.js
+++ b/src/engine/boot.js
@@ -22,7 +22,7 @@ export async function boot(entry, { lang = 'vi', t, win = window, doc = document
   const flags = readFlags(win.location.search);
   const now = flags.at ?? new Date(); // cố định lúc khởi động: con dấu và pha trăng cùng một "bây giờ"
   const sma = createSma(win);
-  const shell = mountShell(doc, entry.meta, { now, t, onState: (state) => sma.set({ state }) });
+  const shell = mountShell(doc, entry.meta, { now, t, onState: (state) => sma.set({ state }), poster: flags.poster });
   shell.setState('detecting');
 
   // Dò tầng không bao giờ được làm trắng trang: lỗi bất ngờ, kể cả lúc đọc window, đều về tầng tĩnh.
```

Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index d3dc9d4..3c26d5a 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -45,7 +45,7 @@ body {
 /* ── Lớp 0: poster ─────────────────────────────────────────────────────────────────────── */
 /* Ảnh tĩnh phủ kín màn hình. object-fit: cover cắt bớt mép thay vì bóp méo ảnh;
    object-position lệch phải để điện thoại dọc vẫn thấy trăng. */
-[data-poster] {
+img[data-poster] {
   position: fixed;
   inset: 0;
   width: 100%;
@@ -301,5 +301,8 @@ header h1 {
 .moon-dark { fill: color-mix(in srgb, var(--cham) 80%, var(--den-then)); }
 .moon-lit { fill: var(--nga); }
 
+/* ── ?poster (GĐ 4): chỉ còn canvas, để scripts/poster.js chụp poster từ chính cảnh (không chữ, không huy hiệu, không UI) ── */
+body[data-poster] :is(.frame, .rail, .notebook, .toolbar) { display: none !important; }
+
 /* ── Chế độ thợ (?debug=stats): stats-gl tự đặt ở góc trái trên, đè lên tên bức. Dời ra giữa mép trên ── */
 [data-debug='stats'] { left: 50% !important; transform: translateX(-50%); }
```

Run: `npx vitest run tests/unit/shell.test.js tests/unit/boot.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  670 passed`.

```bash
git add src/engine/boot.js src/styles/shell.css src/ui/shell.js tests/helpers/page.js tests/unit/boot.test.js tests/unit/shell.test.js
git commit -F - <<'EOF'
feat: cờ ?poster (body[data-poster]: chỉ còn canvas, không gợi ý, không lời mời) để chụp poster từ chính cảnh

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 17: E2E của GĐ 4; trợ năng bằng axe-core

**Mục tiêu:** Spec §12 "E2E (GĐ 4)", "Trợ năng".
- `painting.spec.js` (chạy cho mọi bức trong registry):
  - **mài về cốt:** mọi lớp trừ Cốt về 0 thì còn đất sét: ít màu (chroma < 0,06), thấy hình khối, không điểm trong suốt; phủ lại thì như cũ;
  - **Kính mài:** kính tròn giữa khung soi một view (trong kính khác, ngoài như cũ); gạt 50% thì nửa trái khác, nửa phải như cũ; tắt thì như cũ;
  - **khung hẹp như điện thoại (≤ 640px):** bật công cụ khi Sổ tay đang mở thì Sổ tay thu lại; tắt thì hiện lại;
  - **Lột lớp:** mỗi nấc cho ảnh khác nấc kề bên; về nấc cuối thì đúng ảnh cũ;
  - **Normal:** thấy "đang mài…", rồi ảnh đổi, không lỗi console;
  - **`?poster`:** ngoài canvas không phần tử UI nào hiện.
- `ao-sen-dem.spec.js`:
  - **vuốt làm sương xoáy** (nợ GĐ 3): cảnh đứng yên ở khung 30, chỉ Cốt + Sương, giảm chuyển động (camera không trôi quán tính). Hai cú kéo chậm cùng đường đi cho cùng một ảnh; cú vuốt thì khác. Các lớp khác về 0 trong CÙNG một nhịp, rồi đợi GPU vẽ xong mới vuốt: Chromium giao `pointermove` theo nhịp khung, nên GPU phần mềm còn dồn việc thì cú vuốt bị giãn quá 300 ms và thành cú kéo (Phụ lục A.51);
  - **thanh giờ:** `__sma.setDial('gio', 27)` ở cùng khung thì ảnh khác (trăng, bóng, trời); về 21:00 thì đúng ảnh cũ.
- `helpers.js`: `FULL`, `canvasRegions` (nền magenta để bắt điểm trong suốt; trả checksum, trung bình, độ lệch, chroma, số điểm trong suốt theo vùng), `twoFrames`.
- `a11y.spec.js` (mới): axe-core với các nhãn `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, không được có lỗi mức serious hay critical:
  - trang tĩnh và Sổ tay chỉ đọc;
  - trang 3D: thanh lớp, ba tab của Sổ tay, và lúc một công cụ bật;
  - một lượt bàn phím: Tab tới lời mời, Enter vào chế độ mài, đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay.

  Ô nhập của Tweakpane chưa có nhãn: `ui/knobs.js` gắn `aria-label` (test unit giữ).

**Files:**
- Create: `e2e/a11y.spec.js`
- Modify: `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`, `e2e/helpers.js`, `src/ui/knobs.js`, `package.json`, `package-lock.json` (npm sinh)
- Test: `tests/unit/knobs.test.js`

**Interfaces:**
- Consumes: mọi task trước.
- Produces: `canvasRegions(page, regions, selector)`, `FULL`, `twoFrames(page)` trong `e2e/helpers.js`.

- [ ] **Step 1: Gói dev axe-core**

```bash
npm install --save-dev @axe-core/playwright@4.13.0
```

Áp vào `package.json`:

```diff
diff --git a/package.json b/package.json
index 11f7bda..140c6c0 100644
--- a/package.json
+++ b/package.json
@@ -26,6 +26,7 @@
     "tweakpane": "^4.0.5"
   },
   "devDependencies": {
+    "@axe-core/playwright": "^4.13.0",
     "@playwright/test": "1.63.0",
     "jsdom": "^30.1.1",
     "shiki": "^4.4.3",
```

- [ ] **Step 2: Test unit (hỏng: ô nhập của Tweakpane chưa có nhãn)**

Áp vào `tests/unit/knobs.test.js`:

```diff
diff --git a/tests/unit/knobs.test.js b/tests/unit/knobs.test.js
index 895083d..46bee18 100644
--- a/tests/unit/knobs.test.js
+++ b/tests/unit/knobs.test.js
@@ -33,6 +33,14 @@ describe('appliesNow', () => {
 });
 
 describe('mountKnobs', () => {
+  it('mọi ô nhập của Tweakpane (ô số, ô chọn, ô màu, ô đánh dấu) có aria-label là nhãn của núm (axe: luật label, GĐ 4)', () => {
+    const { container } = mount();
+    const inputs = [...container.querySelectorAll('[data-knob] input, [data-knob] select')];
+    expect(inputs.length).toBeGreaterThanOrEqual(knobs.length);
+    for (const input of inputs) expect(input.getAttribute('aria-label'), input.outerHTML.slice(0, 60)).toBeTruthy();
+    expect(container.querySelector('[data-knob="size"] input').getAttribute('aria-label')).toBe('Cỡ');
+  });
+
   it('mỗi núm một blade có data-knob; nhãn từ content, thiếu thì dùng id', () => {
     const { blade, pane } = mount();
     for (const { id } of knobs) expect(blade(id), id).not.toBeNull();
```

Run: `npx vitest run tests/unit/knobs.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `AssertionError: <input class="tp-txtv_i" type="text">: expected null to be truthy`.

- [ ] **Step 3: Code**

Áp vào `src/ui/knobs.js`:

```diff
diff --git a/src/ui/knobs.js b/src/ui/knobs.js
index f7e1d3a..eb2e675 100644
--- a/src/ui/knobs.js
+++ b/src/ui/knobs.js
@@ -57,6 +57,9 @@ export function mountKnobs(container, { knobs, values, labels = {}, onChange, on
     });
     const el = binding.element;
     el.dataset.knob = knob.id;
+    // Tweakpane ghi nhãn vào một <div>, không phải <label>: ô số cạnh thanh trượt, ô chọn, ô màu không có tên nào cho
+    // trình đọc màn hình (axe-core bắt luật 'label', GĐ 4). Gắn tên của núm vào từng ô nhập.
+    for (const input of el.querySelectorAll('input, select')) input.setAttribute('aria-label', opts.label);
     el.addEventListener('pointerenter', () => onHover(knob.id));
     el.addEventListener('focusin', () => onHover(knob.id));
     el.addEventListener('pointerleave', () => onHover(null));
```

Run: `npx vitest run tests/unit/knobs.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 4: E2E**

Áp vào `e2e/helpers.js`:

```diff
diff --git a/e2e/helpers.js b/e2e/helpers.js
index 9a43dbe..d450215 100644
--- a/e2e/helpers.js
+++ b/e2e/helpers.js
@@ -1,4 +1,4 @@
-// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas, báo GPU, gom lỗi console.
+// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas (cả khung và từng vùng), báo GPU, gom lỗi console.
 
 /** Cảnh báo API cũ mà three in ra lúc chạy (spec §3: e2e bắt các cảnh báo này). */
 export const DEPRECATION = /deprecated|renamed|has been removed/i;
@@ -72,6 +72,67 @@ export async function canvasStats(page, selector = '[data-stage] canvas') {
   }, png.toString('base64'));
 }
 
+/** Cả khung (tọa độ 0–1): vùng mặc định của canvasRegions. */
+export const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
+
+/**
+ * Số đo của từng VÙNG canvas (GĐ 4, công cụ học): vùng là hình chữ nhật { x0, y0, x1, y1 } theo tỉ lệ khung (0–1), có thể
+ * kèm `ring: { r, inside }` để chỉ lấy điểm trong (inside: true) hay ngoài một vòng tròn giữa khung bán kính r × cạnh ngắn.
+ * Mỗi vùng: checksum, độ sáng trung bình (0–1), độ lệch chuẩn độ sáng, sắc độ trung bình (chroma = (max − min) / 255: đo
+ * theo tuyệt đối, vì độ bão hòa (max − min) / max thổi phồng những điểm gần đen như nền đen then), và `transparent`: số
+ * điểm canvas trong suốt. Lúc chụp, nền trang tô màu hồng sen (#ff00ff): điểm trong suốt để lộ nền ấy ra.
+ * @param {import('@playwright/test').Page} page
+ * @param {Record<string, { x0: number, y0: number, x1: number, y1: number, ring?: { r: number, inside: boolean } }>} regions
+ */
+export async function canvasRegions(page, regions = { all: FULL }, selector = '[data-stage] canvas') {
+  const style = `${STAGE_ONLY} html, body { background: #ff00ff !important; }`;
+  const png = await page.locator(selector).screenshot({ style });
+  return page.evaluate(async ({ b64, regions: wanted }) => {
+    const img = new Image();
+    img.src = `data:image/png;base64,${b64}`;
+    await img.decode();
+    const { width: w, height: h } = img;
+    const c = new OffscreenCanvas(w, h);
+    const g = c.getContext('2d');
+    g.drawImage(img, 0, 0);
+    const d = g.getImageData(0, 0, w, h).data;
+    const out = {};
+    for (const [name, r] of Object.entries(wanted)) {
+      let n = 0;
+      let sum = 0;
+      let sumL = 0;
+      let sumL2 = 0;
+      let sumS = 0;
+      let transparent = 0;
+      const radius = r.ring ? r.ring.r * Math.min(w, h) : 0;
+      for (let y = Math.floor(r.y0 * h); y < Math.floor(r.y1 * h); y++) {
+        for (let x = Math.floor(r.x0 * w); x < Math.floor(r.x1 * w); x++) {
+          if (r.ring && (Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) < radius) !== r.ring.inside) continue;
+          const i = (y * w + x) * 4;
+          const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
+          const max = Math.max(R, G, B);
+          const min = Math.min(R, G, B);
+          const l = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
+          n += 1;
+          sum += (R * 3 + G * 5 + B * 7) * ((x % 13) + 1);
+          sumL += l;
+          sumL2 += l * l;
+          sumS += (max - min) / 255;
+          if (R > 240 && G < 20 && B > 240) transparent += 1;
+        }
+      }
+      const mean = sumL / n;
+      out[name] = { checksum: sum, mean, std: Math.sqrt(Math.max(sumL2 / n - mean * mean, 0)), chroma: sumS / n, transparent };
+    }
+    return out;
+  }, { b64: png.toString('base64'), regions });
+}
+
+/** Chờ hai nhịp requestAnimationFrame: vẽ lại khung đứng yên (?freeze) xảy ra ở nhịp kế tiếp sau thay đổi. */
+export function twoFrames(page) {
+  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
+}
+
 /** Hỏi thẳng trình duyệt nó có GPU gì (để bỏ qua test WebGPU khi không có adapter). */
 export async function gpuReport(page) {
   return page.evaluate(async () => {
```

Áp vào `e2e/painting.spec.js`:

```diff
diff --git a/e2e/painting.spec.js b/e2e/painting.spec.js
index b4bcd92..8d2b9ce 100644
--- a/e2e/painting.spec.js
+++ b/e2e/painting.spec.js
@@ -1,8 +1,11 @@
-// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh, và cảnh 3D trên WebGL2 / WebGPU.
+// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh; cảnh 3D trên WebGL2 / WebGPU; công cụ học, ?poster (GĐ 4).
 import { readdirSync } from 'node:fs';
 import { test, expect } from '@playwright/test';
 import { paintings } from '../src/paintings/registry.js';
-import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
+import t from '../src/ui/strings.vi.js';
+import {
+  DARK, FULL, waitForSettled, waitForFrames, canvasStats, canvasRegions, twoFrames, gpuReport, collectConsole, readSma,
+} from './helpers.js';
 
 /**
  * URL tương đối (không có '/' đầu) để giữ base '/son-mai-anh-sang/' của baseURL.
@@ -301,6 +304,153 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       });
     }
 
+    /** Mở cảnh đứng yên ở khung 10 (?freeze), đúng một "bây giờ": mọi ảnh sau đó so được với nhau. */
+    async function still(page, testInfo, ...extra) {
+      const { query } = testInfo.project.metadata;
+      await page.goto(urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00', ...extra));
+      const settled = await waitForSettled(page);
+      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+      await waitForFrames(page, 10);
+    }
+    // Kính tròn mặc định ở giữa khung, bán kính 18% cạnh ngắn (spec §7). Chừa lề quanh viền vàng lá của kính và vạch gạt.
+    const LENS = {
+      inside: { ...FULL, ring: { r: 0.18 * 0.8, inside: true } },
+      outside: { ...FULL, ring: { r: 0.18 * 1.25, inside: false } },
+      left: { x0: 0, y0: 0, x1: 0.48, y1: 1 },
+      right: { x0: 0.52, y0: 0, x1: 1, y1: 1 },
+      all: FULL,
+    };
+
+    test('mài về cốt (GĐ 4): mọi lớp trừ Cốt về 0 thì còn đất sét (ít màu, thấy hình khối, không điểm trong suốt); phủ lại thì như cũ', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(120_000);
+      await still(page, testInfo);
+      const base = (await canvasRegions(page)).all;
+      const rest = meta.layers.slice(1).map((l) => l.id);
+      for (const id of rest) await page.evaluate((layerId) => window.__sma.setWeight(layerId, 0), id);
+      const clay = (await canvasRegions(page)).all;
+      await page.screenshot({ path: testInfo.outputPath('mai-ve-cot.png') });
+      expect(clay.chroma, 'đất sét phải gần như không màu').toBeLessThan(0.06);
+      expect(clay.std, 'phải thấy hình khối (độ sáng thay đổi theo mặt khối)').toBeGreaterThan(0.04);
+      expect(clay.mean, 'không đen kịt, không cháy trắng').toBeGreaterThan(0.03);
+      expect(clay.mean).toBeLessThan(0.8);
+      expect(clay.transparent, 'luật 3: không bao giờ trong suốt').toBe(0);
+      for (const id of rest) await page.evaluate((layerId) => window.__sma.setWeight(layerId, 1), id);
+      expect((await canvasRegions(page)).all.checksum, 'phủ lại mọi lớp thì phải về đúng ảnh cũ').toBe(base.checksum);
+      expect(log.errors).toEqual([]);
+    });
+
+    test('Kính mài (GĐ 4): kính tròn giữa khung soi một view (trong kính khác, ngoài như cũ); gạt 50% (nửa trái khác, nửa phải như cũ); tắt thì như cũ', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(120_000);
+      await still(page, testInfo);
+      const base = await canvasRegions(page, LENS);
+      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
+      await expect(page.locator('body')).toHaveAttribute('data-tool', 'kinh-mai');
+      const lens = await canvasRegions(page, LENS);
+      await page.screenshot({ path: testInfo.outputPath('kinh-tron.png') });
+      expect(lens.inside.checksum, 'trong kính phải là view khác ảnh cuối').not.toBe(base.inside.checksum);
+      expect(lens.outside.checksum, 'ngoài kính phải giữ nguyên ảnh cuối').toBe(base.outside.checksum);
+      await page.locator('[data-toolbar] [data-shape="gat"]').click();
+      await twoFrames(page);
+      const wipe = await canvasRegions(page, LENS);
+      await page.screenshot({ path: testInfo.outputPath('kinh-gat.png') });
+      expect(wipe.left.checksum, 'bên trái vạch gạt là view').not.toBe(base.left.checksum);
+      expect(wipe.right.checksum, 'bên phải vạch gạt là ảnh cuối').toBe(base.right.checksum);
+      await page.evaluate(() => window.__sma.setTool(null));
+      expect((await canvasRegions(page, LENS)).all.checksum, 'tắt công cụ thì về đúng ảnh cũ').toBe(base.all.checksum);
+      expect(log.errors).toEqual([]);
+      expect(log.warnings).toEqual([]);
+    });
+
+    test('khung hẹp như điện thoại (≤ 640px, GĐ 4): bật công cụ khi Sổ tay đang mở thì Sổ tay thu lại; tắt thì hiện lại', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(120_000);
+      await still(page, testInfo);
+      expect(page.viewportSize().width, 'viewport của e2e phải là khung hẹp').toBeLessThanOrEqual(640);
+      const box = await page.locator('[data-stage] canvas').boundingBox();
+      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
+      await page.locator('[data-hint] button').click();
+      const notebook = page.locator('[data-notebook]');
+      await expect(notebook).toBeVisible();
+      const tool = page.locator('[data-rail] [data-tool="kinh-mai"]');
+      await tool.click();
+      await expect(page.locator('[data-toolbar]')).toBeVisible();
+      await expect(notebook, 'Sổ tay phải thu lại để chừa chỗ nhìn cảnh').toBeHidden();
+      await tool.click();
+      await expect(notebook).toBeVisible();
+      await expect(page.locator('[data-toolbar]')).toBeHidden();
+      expect(log.errors).toEqual([]);
+    });
+
+    test('Lột lớp (GĐ 4): mỗi nấc cho ảnh khác nấc kề bên; về nấc cuối (bên phải) thì đúng ảnh cũ', async ({ page }, testInfo) => {
+      test.setTimeout(180_000);
+      await still(page, testInfo);
+      const base = (await canvasRegions(page)).all;
+      await page.evaluate(() => window.__sma.setTool('lot-lop'));
+      const range = page.locator('[data-toolbar] input[type="range"]');
+      const last = Number(await range.getAttribute('max'));
+      const slide = async (v) => {
+        const before = await range.getAttribute('aria-valuetext');
+        await range.evaluate((el, value) => {
+          el.value = String(value);
+          el.dispatchEvent(new Event('input', { bubbles: true }));
+        }, v);
+        // View Normal phải mài (biên dịch lại) trước khi hiện: chờ tên view đổi, rồi chờ khung vẽ lại.
+        await expect.poll(() => range.getAttribute('aria-valuetext'), { timeout: 60_000 }).not.toBe(before);
+        await twoFrames(page);
+        return (await canvasRegions(page)).all.checksum;
+      };
+      let previous = base.checksum;
+      for (let v = last - 1; v >= 0; v -= 1) {
+        const shot = await slide(v);
+        const name = await range.getAttribute('aria-valuetext');
+        expect(shot, `nấc ${v} (${name}) giống nấc kề bên`).not.toBe(previous);
+        previous = shot;
+      }
+      await page.screenshot({ path: testInfo.outputPath('lot-lop-cuoi.png') });
+      expect(await slide(last), 'về nấc cuối thì phải đúng ảnh cũ').toBe(base.checksum);
+      expect(log.errors).toEqual([]);
+    });
+
+    test('Normal (GĐ 4): chọn Normal trong Kính mài thì thấy "đang mài…", rồi ảnh đổi; không lỗi console', async ({ page }, testInfo) => {
+      test.setTimeout(120_000);
+      await still(page, testInfo);
+      const base = await canvasRegions(page, LENS);
+      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
+      // Ghi mọi chữ từng hiện trong dòng trạng thái (vùng aria-live): "đang mài…" có thể chỉ hiện vài trăm ms.
+      await page.evaluate(() => {
+        window.__statusLog = [];
+        const status = document.querySelector('[data-tool-slot="kinh-mai"] .tool-status');
+        new MutationObserver(() => window.__statusLog.push(status.textContent)).observe(status, { childList: true, characterData: true, subtree: true });
+      });
+      const normal = page.locator('[data-toolbar] [data-view="normal"]');
+      await normal.click();
+      await expect(normal).toHaveAttribute('aria-pressed', 'true', { timeout: 60_000 });
+      await twoFrames(page);
+      expect(await page.evaluate(() => window.__statusLog)).toContain(t.toolStatus.grinding);
+      const shot = await canvasRegions(page, LENS);
+      await page.screenshot({ path: testInfo.outputPath('normal.png') });
+      expect(shot.inside.checksum).not.toBe(base.inside.checksum);
+      expect(shot.outside.checksum).toBe(base.outside.checksum);
+      expect(log.errors).toEqual([]);
+      expect(log.warnings).toEqual([]);
+    });
+
+    test('?poster (GĐ 4): ngoài canvas không có phần tử UI nào hiện (chữ, huy hiệu, thanh lớp, thanh công cụ)', async ({ page }, testInfo) => {
+      await still(page, testInfo, 'poster');
+      await expect(page.locator('[data-stage] canvas')).toBeVisible();
+      const shown = await page.evaluate(() => [...document.body.querySelectorAll('*')]
+        .filter((el) => !el.closest('[data-stage]') && el.tagName !== 'SCRIPT')
+        .filter((el) => el.checkVisibility({ visibilityProperty: true, opacityProperty: true }))
+        .map((el) => el.outerHTML.slice(0, 80)));
+      expect(shown).toEqual([]);
+      expect(log.errors).toEqual([]);
+    });
+
     // Review Focus #5 · giảm chuyển động: CSS bỏ transition nên không có transitionend để chờ, và crossfade
     // phải xong ngay. Chỉ kiểm "tới live" thì chưa đủ, vì lưới an toàn 1200 ms của shell cũng đưa tới live.
     // Nên đo lúc body[data-state] đổi: fading → live dưới 600 ms (đường ngay ≈ 0 ms, lưới an toàn ≈ 1200 ms).
```

Áp vào `e2e/ao-sen-dem.spec.js`:

```diff
diff --git a/e2e/ao-sen-dem.spec.js b/e2e/ao-sen-dem.spec.js
index daca8a7..813cbac 100644
--- a/e2e/ao-sen-dem.spec.js
+++ b/e2e/ao-sen-dem.spec.js
@@ -1,6 +1,7 @@
-// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt mặt nước; chế độ mài; chất lượng (draw call, mức thấp); CPU vs GPU; trăng SVG.
+// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt (sương xoáy) mặt nước; thanh giờ; chế độ mài; chất lượng; CPU vs GPU; trăng SVG.
 import { test, expect } from '@playwright/test';
-import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
+import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma, twoFrames } from './helpers.js';
+import meta from '../src/paintings/ao-sen-dem/meta.js';
 
 const AT = 'at=2026-09-28T21:00';
 const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
@@ -30,24 +31,18 @@ test.afterEach(async ({ page }, testInfo) => {
  * Mở cảnh ở ?freeze=N, (tùy chọn) chạm hoặc GIỮ tay trên mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas.
  * Giữ = nhấn xuống, đợi thêm HOLD_FRAMES khung (dài hơn 350 ms giữ của gesture.js), rồi mới thả.
  */
-async function run(page, testInfo, { tap = false, hold = false, swipe = false }) {
+async function run(page, testInfo, { tap = false, hold = false }) {
   const { query } = testInfo.project.metadata;
   await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
   const settled = await waitForSettled(page, { timeout: 60_000 });
   expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
   let tappedAt = null;
-  if (tap || hold || swipe) {
+  if (tap || hold) {
     await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
     const box = await page.locator('[data-stage] canvas').boundingBox();
     const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
     if (tap) await page.mouse.click(x, y);
-    else if (swipe) {
-      // Vuốt = kéo nhanh (dưới 300 ms) và xa (trên 40 px) rồi thả (gesture.js). Kéo cũng xoay camera một chút.
-      await page.mouse.move(x - 60, y);
-      await page.mouse.down();
-      await page.mouse.move(x + 60, y, { steps: 3 });
-      await page.mouse.up();
-    } else {
+    else {
       await page.mouse.move(x, y);
       await page.mouse.down();
       const from = (await readSma(page)).frames;
@@ -88,13 +83,53 @@ test.describe('Ao Sen Đêm · chạm mặt nước', () => {
     expect(log.errors).toEqual([]);
   });
 
-  test('vuốt trên mặt nước: cảnh vẫn chạy, không lỗi, ảnh khác lần không vuốt (cùng ?at&freeze)', async ({ page }, testInfo) => {
-    // Kéo cũng xoay camera, nên ảnh khác chưa chứng minh sương xoáy: luật xoáy có unit test (shared.test.js). Ở đây giữ
-    // đường đi thật: vuốt → shared.swirl → sương (shader có xoáy) biên dịch và vẽ được trên cả hai backend.
-    test.setTimeout(300_000);
-    const a = await run(page, testInfo, {});
-    const swiped = await run(page, testInfo, { swipe: true });
-    expect(swiped.stats.checksum, 'vuốt mà ảnh không đổi').not.toBe(a.stats.checksum);
+  /**
+   * Cảnh đứng yên ở khung 30, chỉ bật Cốt + Sương, rồi vuốt (nhanh) hoặc kéo CHẬM cùng một đường đi trên mặt nước.
+   * Đứng yên thì máy không bận vẽ, nên cú vuốt được nhận đúng nhịp (dưới 300 ms) cả trên GPU phần mềm chậm. Kéo nào cũng xoay
+   * camera (OrbitControls tự cập nhật khi rê), nên ép vẽ lại một lần rồi mới chụp: hai ảnh cùng một camera đã xoay.
+   */
+  async function stillStroke(page, testInfo, kind) {
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=30`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    await waitForFrames(page, 30);
+    // Các lớp khác về 0 trong CÙNG một nhịp: một lần vẽ lại chứ không phải năm. Rồi đợi GPU vẽ xong: Chromium giao pointermove
+    // theo nhịp khung, nên GPU phần mềm còn dồn việc vẽ thì cú vuốt bị giãn quá 300 ms và thành một cú kéo.
+    const others = meta.layers.map((l) => l.id).filter((id) => !['cot', 'suong'].includes(id));
+    await page.evaluate((ids) => Promise.all(ids.map((id) => window.__sma.setWeight(id, 0))), others);
+    await twoFrames(page);
+    await twoFrames(page);
+    const box = await page.locator('[data-stage] canvas').boundingBox();
+    const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
+    await page.mouse.move(x - 60, y);
+    await page.mouse.down();
+    if (kind === 'swipe') await page.mouse.move(x + 60, y, { steps: 3 });
+    else {
+      for (let i = 1; i <= 20; i += 1) {
+        await page.mouse.move(x - 60 + i * 6, y);
+        await page.waitForTimeout(40); // cả cú kéo dài hơn 300 ms: không phải vuốt
+      }
+    }
+    await page.mouse.up();
+    await page.evaluate(() => window.__sma.setWeight('suong', 1)); // ép vẽ lại khung 30 (trọng số không đổi)
+    return canvasStats(page);
+  }
+
+  test('vuốt trên mặt nước làm sương xoáy (GĐ 4): chỉ Cốt + Sương, cảnh đứng yên; vuốt khác một cú kéo chậm cùng đường đi', async ({
+    page,
+  }, testInfo) => {
+    // Giảm chuyển động tắt quán tính (damping) của camera: kéo chậm và vuốt cùng đường đi thì xoay camera y hệt nhau. Chỉ cú vuốt
+    // sinh cử chỉ 'swipe' → shared.swirl → sương xoáy (ở khung đứng yên, góc xoáy lớn nhất). Hai cú kéo chậm phải cho cùng một
+    // ảnh (phép so công bằng), cú vuốt thì khác.
+    test.setTimeout(180_000);
+    await page.emulateMedia({ reducedMotion: 'reduce' });
+    const a = await stillStroke(page, testInfo, 'drag');
+    const b = await stillStroke(page, testInfo, 'drag');
+    expect(b.checksum, 'hai cú kéo chậm như nhau phải cho cùng một ảnh').toBe(a.checksum);
+    const swiped = await stillStroke(page, testInfo, 'swipe');
+    await page.screenshot({ path: testInfo.outputPath('suong-xoay.png') });
+    expect(swiped.checksum, 'vuốt mà sương không xoáy (ảnh giống cú kéo chậm)').not.toBe(a.checksum);
     expect(log.errors).toEqual([]);
   });
 
@@ -110,6 +145,34 @@ test.describe('Ao Sen Đêm · chạm mặt nước', () => {
   });
 });
 
+test.describe('Ao Sen Đêm · thanh giờ (GĐ 4)', () => {
+  test.beforeEach(({}, testInfo) => {
+    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
+  });
+
+  test('__sma.setDial("gio", 27) ở cùng khung thì ảnh khác (trăng, bóng, trời); về 21:00 thì đúng ảnh cũ', async ({ page }, testInfo) => {
+    test.setTimeout(120_000);
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=20`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    await waitForFrames(page, 20);
+    expect(await page.evaluate(() => window.__sma.dials())).toEqual([
+      { id: 'gio', min: 18, max: 29.5, step: 0.25, value: 21, text: '21:00', note: null },
+    ]);
+    const base = await canvasStats(page);
+    await page.evaluate(() => window.__sma.setDial('gio', 27));
+    const late = await canvasStats(page);
+    await page.screenshot({ path: testInfo.outputPath('gio-03h00.png') });
+    expect(late.checksum, 'kéo sang 03:00 mà ảnh không đổi').not.toBe(base.checksum);
+    expect((await page.evaluate(() => window.__sma.dials()))[0].text).toBe('03:00');
+    await page.evaluate(() => window.__sma.setDial('gio', 21));
+    expect((await canvasStats(page)).checksum, 'về 21:00 thì phải đúng ảnh cũ').toBe(base.checksum);
+    expect((await readSma(page)).frames, 'kéo thanh giờ không được tiến đồng hồ').toBe(20);
+    expect(log.errors).toEqual([]);
+  });
+});
+
 test.describe('Ao Sen Đêm · chế độ mài', () => {
   test.beforeEach(({}, testInfo) => {
     test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
```

Tạo `e2e/a11y.spec.js`:

```js
// e2e/a11y.spec.js — trợ năng (axe-core, WCAG 2 A/AA): tranh tĩnh; cảnh 3D có thanh lớp + Sổ tay (ba tab); khi một công cụ bật; đi hết bằng bàn phím.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { paintings } from '../src/paintings/registry.js';
import { waitForSettled, gpuReport, collectConsole, readSma } from './helpers.js';

/** Luật WCAG 2.0 và 2.1, mức A và AA (spec §12). */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Quét trang bằng axe-core; chỉ lỗi mức serious hay critical làm hỏng test (spec §12). Trả danh sách lỗi đọc được:
 * luật, mức, lời giải thích và vài phần tử bị bắt, để biết sửa ở đâu.
 */
async function audit(page, where) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${where} · ${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`);
}

/** URL tương đối của trang một bức (xem painting.spec.js). */
function urlOf(htmlPage, ...parts) {
  const dir = htmlPage.replace(/index\.html$/, '');
  const query = parts.map((p) => p.replace(/^\?/, '')).filter(Boolean).join('&');
  return `./${dir}${query ? `?${query}` : ''}`;
}

let log;
test.beforeEach(({ page }) => {
  log = collectConsole(page);
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

for (const { meta, page: htmlPage } of paintings) {
  test.describe(`${meta.title} · a11y`, () => {
    test('tranh tĩnh (?static) và Sổ tay chỉ đọc: không lỗi serious/critical', async ({ page }, testInfo) => {
      test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
      await page.goto(urlOf(htmlPage, 'static'));
      expect((await waitForSettled(page)).state).toBe('static');
      const errors = await audit(page, 'tĩnh');
      await page.locator('[data-static] button').click();
      await expect(page.locator('[data-rail]')).toBeVisible();
      errors.push(...await audit(page, 'Sổ tay chỉ đọc'));
      expect(errors).toEqual([]);
    });

    test.describe('cảnh 3D', () => {
      test.beforeEach(async ({ page }, testInfo) => {
        const { kind, backend } = testInfo.project.metadata;
        test.skip(kind !== '3d', 'chỉ chạy ở project 3D');
        if (backend === 'webgpu') {
          await page.goto(urlOf(htmlPage, 'static'));
          test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
        }
      });

      /** Mở cảnh, chạm canvas (lần tương tác đầu), bấm lời mời: thanh lớp và Sổ tay mở ở chế độ mài. */
      async function openWorkshop(page, testInfo) {
        await page.goto(urlOf(htmlPage, testInfo.project.metadata.query, 'at=2026-09-28T21:00'));
        const settled = await waitForSettled(page, { timeout: 60_000 });
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        const box = await page.locator('[data-stage] canvas').boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8);
        await page.locator('[data-hint] button').click();
        await expect(page.locator('[data-notebook]')).toBeVisible();
      }

      test('thanh lớp + Sổ tay (Hiểu, Chỉnh, Phá) và khi một công cụ bật: không lỗi serious/critical', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await openWorkshop(page, testInfo);
        const notebook = page.locator('[data-notebook]');
        const errors = await audit(page, 'Hiểu');
        await notebook.locator('[data-tab="chinh"]').click();
        await expect(notebook.locator('[data-knobs]')).toHaveAttribute('data-state', /^(ready|empty)$/);
        errors.push(...await audit(page, 'Chỉnh'));
        await notebook.locator('[data-tab="pha"]').click();
        errors.push(...await audit(page, 'Phá'));
        for (const { id } of await page.evaluate(() => window.__sma.tools())) {
          await page.locator(`[data-rail] [data-tool="${id}"]`).click();
          await expect(page.locator('body')).toHaveAttribute('data-tool', id);
          errors.push(...await audit(page, `công cụ ${id}`));
        }
        const wipe = page.locator('[data-toolbar] [data-shape="gat"]');
        await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
        await wipe.click();
        errors.push(...await audit(page, 'Kính mài · gạt'));
        expect(errors).toEqual([]);
        expect(log.errors).toEqual([]);
      });

      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay', async ({
        page,
      }, testInfo) => {
        test.setTimeout(120_000);
        await page.goto(urlOf(htmlPage, testInfo.project.metadata.query, 'at=2026-09-28T21:00'));
        expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
        const focused = () => page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName.toLowerCase()}${el.closest('[data-rail]') ? '@rail' : ''}${el.closest('[data-notebook]') ? '@nb' : ''}`
            + `${el.closest('[data-hint]') ? '@hint' : ''}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}`
            + `${el.dataset.tool ? `:${el.dataset.tool}` : ''}${el.type === 'range' ? ':range' : ''}`
            + `${el.classList.contains('dial-chip') ? ':chip' : ''}` : 'none';
        });
        // Người chỉ dùng bàn phím: phím đầu tiên là lần tương tác đầu, lời mời (một nút) hiện ra và Tab tới được.
        let reached = false;
        for (let i = 0; i < 8 && !reached; i += 1) {
          await page.keyboard.press('Tab');
          reached = (await focused()).includes('@hint');
        }
        expect(reached, 'Tab không tới được lời mời').toBe(true);
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-rail]')).toBeVisible();
        const seen = new Set();
        for (let i = 0; i < 40; i += 1) {
          await page.keyboard.press('Tab');
          const at = await focused();
          seen.add(at);
          // Khung hẹp (điện thoại): thanh giờ nằm sau nút nhỏ "◷ 21:00"; Enter mở ô trượt, Tab đi tiếp vào đó.
          if (at.endsWith(':chip') && (await page.locator('[data-rail] .dial-chip').getAttribute('aria-expanded')) !== 'true') {
            await page.keyboard.press('Enter');
          }
        }
        const walk = [...seen].join(', ');
        expect(walk, 'tên lớp trên thanh lớp').toContain('button@rail');
        expect(walk, 'công tắc lớp').toContain('button@rail[switch]');
        for (const { id } of await page.evaluate(() => window.__sma.tools())) expect(walk, `nút Đồ nghề "${id}"`).toContain(`@rail:${id}`);
        const dials = await page.evaluate(() => window.__sma.dials());
        if (dials.length > 0) {
          expect(walk, 'thanh trượt của Dial').toContain('input@rail:range');
          await page.locator(`[data-rail] #dial-${dials[0].id}`).focus();
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => page.evaluate(() => window.__sma.dials()[0].value)).toBe(dials[0].value + dials[0].step);
        }
        expect(walk, 'các tab của Sổ tay').toContain('button@nb[tab]');
        // Mũi tên đổi tab (mẫu tab của ARIA), Escape đóng Sổ tay mà thanh lớp vẫn mở.
        await page.locator('[data-notebook] [role="tab"][aria-selected="true"]').focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('[data-notebook] [data-tab="chinh"]')).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-notebook]')).toBeHidden();
        await expect(page.locator('[data-rail]')).toBeVisible();
        expect(log.errors).toEqual([]);
      });
    });
  });
}
```

```bash
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu   # máy có GPU thật
```
Kết quả mong đợi: `static` + `webgl2-swiftshader` 33 passed; `webgpu-swiftshader` 26 passed; GPU thật 26 passed (các test "skipped" thuộc project khác). Máy bận thì test 3D trên SwiftShader có thể về tĩnh với lý do `timeout`: chạy lại khi máy rảnh.

- [ ] **Step 5: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  671 passed`.

```bash
git add e2e/a11y.spec.js e2e/ao-sen-dem.spec.js e2e/helpers.js e2e/painting.spec.js package-lock.json package.json src/ui/knobs.js tests/unit/knobs.test.js
git commit -F - <<'EOF'
test(e2e): GĐ 4 · mài về cốt, Kính mài, Lột lớp, Normal, ?poster, thanh giờ, vuốt chứng minh sương xoáy; a11y bằng axe-core (ô nhập của Tweakpane có nhãn)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 18: CI: e2e WebGPU thành job riêng, không chặn

**Mục tiêu:** Spec §13 (nợ GĐ 3). E2E của GĐ 4 dài hơn, và bước WebGPU trên ubuntu vẫn chưa ổn định:
- job `build` (chặn deploy, trần 40 phút): `npm test`, build, e2e `static` + `webgl2-swiftshader` (kèm a11y). Chỉ cài headless shell (`--only-shell`);
- job `e2e-webgpu` (mới, `continue-on-error`, trần 25 phút): chạy song song, cài Chromium đầy đủ (`--no-shell`), e2e `webgpu-swiftshader`;
- job `deploy` chỉ cần `build`.

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: —
- Produces: job `e2e-webgpu`.

- [ ] **Step 1: Sửa workflow**

Áp vào `.github/workflows/deploy.yml`:

```diff
diff --git a/.github/workflows/deploy.yml b/.github/workflows/deploy.yml
index baab7b7..2a51029 100644
--- a/.github/workflows/deploy.yml
+++ b/.github/workflows/deploy.yml
@@ -19,7 +19,7 @@ concurrency:
 jobs:
   build:
     runs-on: ubuntu-latest
-    # GĐ 3 trên ubuntu-latest: e2e chặn khoảng 12 phút, e2e WebGPU không chặn khoảng 10 phút (SwiftShader vẽ bằng CPU).
+    # Cổng chặn: unit, build, e2e tĩnh + WebGL2 trên SwiftShader (gồm cả a11y). GĐ 3 đo được khoảng 12 phút e2e.
     timeout-minutes: 40
     steps:
       - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
@@ -39,18 +39,12 @@ jobs:
       - name: Build (Vite, base /son-mai-anh-sang/)
         run: npm run build
 
-      - name: Cài Chromium (đầy đủ + headless shell) và thư viện hệ thống
-        run: npx playwright install --with-deps chromium
+      - name: Cài Chromium headless shell và thư viện hệ thống
+        run: npx playwright install --with-deps --only-shell chromium
 
-      - name: E2E chặn · tranh tĩnh + WebGL2 trên SwiftShader
+      - name: E2E chặn · tranh tĩnh + WebGL2 trên SwiftShader (kèm a11y)
         run: npx playwright test --project=static --project=webgl2-swiftshader
 
-      # Playwright xóa thư mục output ở đầu mỗi lần chạy, nên lần này ghi vào thư mục con riêng.
-      - name: E2E không chặn · WebGPU trên SwiftShader (Chromium đầy đủ)
-        continue-on-error: true
-        timeout-minutes: 15 # treo thì chỉ bước này hỏng, job vẫn xong
-        run: npx playwright test --project=webgpu-swiftshader --output=e2e/.results/webgpu-swiftshader
-
       - name: Giữ ảnh chụp và trace của e2e
         if: ${{ !cancelled() }}
         uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
@@ -66,8 +60,44 @@ jobs:
         with:
           path: dist
 
+  # WebGPU trên SwiftShader (Chromium đầy đủ): KHÔNG chặn, chạy song song với build. GĐ 3 để bước này chung job build với
+  # trần 15 phút, và ở PR #3 nó chạy mất 14,9 phút; tách ra job riêng thì hỏng hay treo cũng không kéo build theo.
+  e2e-webgpu:
+    runs-on: ubuntu-latest
+    continue-on-error: true
+    timeout-minutes: 25
+    steps:
+      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
+        with:
+          persist-credentials: false
+
+      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
+        with:
+          node-version-file: .nvmrc
+          cache: npm
+
+      - run: npm ci
+
+      - name: Build (Vite, base /son-mai-anh-sang/)
+        run: npm run build
+
+      - name: Cài Chromium đầy đủ và thư viện hệ thống
+        run: npx playwright install --with-deps --no-shell chromium
+
+      - name: E2E không chặn · WebGPU trên SwiftShader
+        run: npx playwright test --project=webgpu-swiftshader
+
+      - name: Giữ ảnh chụp và trace của e2e WebGPU
+        if: ${{ !cancelled() }}
+        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
+        with:
+          name: e2e-results-webgpu
+          path: e2e/.results/
+          if-no-files-found: ignore
+          retention-days: 7
+
   deploy:
-    # Chỉ deploy từ main, và chỉ khi mọi bước chặn của job build đều qua.
+    # Chỉ deploy từ main, và chỉ khi mọi bước chặn của job build đều qua (không chờ job e2e-webgpu).
     if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
     needs: build
     runs-on: ubuntu-latest
```

Kiểm bằng mắt: ba job `build`, `e2e-webgpu`, `deploy`; `deploy.needs` chỉ có `build`. CI chạy thật ở Task 22.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -F - <<'EOF'
ci: tách e2e WebGPU ra job riêng không chặn (25 phút); job build (chặn) chạy e2e tĩnh + WebGL2 kèm a11y; deploy chỉ cần build

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 19: Lượt màu của chặng display

**Mục tiêu:** Spec §5 "Lượt màu (GĐ 4)". Chặng display làm ảnh đổi màu, nên số mặc định của ba núm mới chốt bằng ảnh chụp trên GPU thật, ở cả 1280×800 và 390×844 (`?at=2026-09-28T21:00&freeze=300&poster&level=cao`). Số đo lúc dựng thử (độ sáng trung bình 0–255 / độ bão hòa / tỉ lệ điểm tối):

| Cấu hình | 1280×800 | 390×844 |
|---|---|---|
| Trước chặng display | 57,7 / 0,32 / 10,1% | 68,2 / 0,28 / 6,4% |
| Số tạm của Task 15: LUT 0,6, vignette 0,35 (sương chân trời ngả cam) | 55,0 / 0,46 / 9,8% | 63,8 / 0,42 / 5,8% |
| **Chọn:** LUT 0,45, vignette 0,45, grain 0,03 | 54,3 / 0,43 / 12,2% | 62,5 / 0,39 / 7,1% |

Ảnh nhích về phía poster cũ (33 / 0,42 / 30%) mà không bệt. Bao đã xem ảnh trước và sau lúc duyệt kế hoạch. Ba số nằm trong MỘT commit riêng: bỏ commit này là về lại số tạm.

**Files:**
- Modify: `src/engine/stock/phu-bong/layer.js`

**Interfaces:**
- Consumes: chặng display (Task 15).
- Produces: — (chỉ đổi số mặc định)

- [ ] **Step 1: Áp các giá trị mới**

Áp vào `src/engine/stock/phu-bong/layer.js`:

```diff
diff --git a/src/engine/stock/phu-bong/layer.js b/src/engine/stock/phu-bong/layer.js
index 8960546..7e4dbd9 100644
--- a/src/engine/stock/phu-bong/layer.js
+++ b/src/engine/stock/phu-bong/layer.js
@@ -16,10 +16,10 @@ export const knobs = [
   { id: 'bloomThreshold', min: 0, max: 2, step: 0.01, value: 0 },
   { id: 'toneMapping', kind: 'select', options: Object.keys(TONE), value: 'agx' },
   { id: 'exposure', min: 0.1, max: 3, step: 0.01, value: 1 },
-  // Chặng display (GĐ 4). Số mặc định chốt ở lượt màu GĐ 4 (spec §5).
-  { id: 'lutIntensity', min: 0, max: 1, step: 0.01, value: 0.6 },
+  // Chặng display (GĐ 4). Số mặc định chốt ở lượt màu GĐ 4 (spec §5): LUT 0,45 để sương chân trời ấm mà không ngả cam.
+  { id: 'lutIntensity', min: 0, max: 1, step: 0.01, value: 0.45 },
   { id: 'grain', min: 0, max: 0.15, step: 0.005, value: 0.03 },
-  { id: 'vignette', min: 0, max: 1, step: 0.01, value: 0.35 },
+  { id: 'vignette', min: 0, max: 1, step: 0.01, value: 0.45 },
 ];
 
 /**
```

- [ ] **Step 2: Test và e2e vẫn xanh**

Run: `npm test` rồi `npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu` (máy không có GPU thật thì chạy `--project=webgl2-swiftshader`).
Kết quả mong đợi: `Tests  671 passed`; e2e xanh.

- [ ] **Step 3: Chụp và đo (GPU thật, headless, không mở cửa sổ)**

Script nằm ngoài repo (ví dụ thư mục tạm), chạy khi `npx vite preview --port 4291 --strictPort --host 127.0.0.1` đang phục vụ `dist/`:

```js
// measure.mjs: node measure.mjs <tên>. Chụp hai cỡ, in độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối.
import { chromium } from '@playwright/test';
const [name = 'sau'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chromium' });
for (const [width, height] of [[1280, 800], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4291/son-mai-anh-sang/?at=2026-09-28T21:00&freeze=300&poster&level=cao');
  await page.waitForFunction(() => window.__sma?.frames >= 300 || window.__sma?.state === 'static', null, { timeout: 120000 });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ path: `${name}-${width}x${height}.png` });
  const m = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height).getContext('2d');
    c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, img.width, img.height).data;
    let L = 0, S = 0, dark = 0;
    for (let i = 0; i < d.length; i += 4) {
      const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2]);
      L += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      S += max ? (max - min) / max : 0;
      if (max < 30) dark += 1;
    }
    const n = d.length / 4;
    return { brightness: +(L / n).toFixed(1), saturation: +(S / n).toFixed(3), darkPct: +((dark / n) * 100).toFixed(1) };
  }, png.toString('base64'));
  console.log(`${width}x${height}`, JSON.stringify(m), await page.evaluate(() => window.__sma.stats().drawCalls));
  await page.close();
}
await browser.close();
```
Kết quả mong đợi: số gần bảng trên (lệch vài phần trăm theo máy), 35 draw call ở 1280×800. Ảnh đính kèm PR (Task 22).

- [ ] **Step 4: Commit (riêng, để bỏ được nếu Bao muốn màu khác)**

```bash
git add src/engine/stock/phu-bong/layer.js
git commit -F - <<'EOF'
style(phu-bong): lượt màu chặng display (lutIntensity 0,45, vignette 0,45, grain 0,03; đo trên GPU thật ở 1280×800 và 390×844)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 20: Poster thật chụp từ cảnh (`scripts/poster.js`); ảnh chia sẻ og

**Mục tiêu:** Spec §8.7, §10 "Poster", Phụ lục A.50. Từ GĐ 4, poster và cảnh 3D là cùng một ảnh: poster hiện ngay lúc mở trang, rồi cảnh 3D hòa lên trên mà không lệch khung.
- `meta.poster.capture = { at, freeze }` của từng bức nói chụp lúc nào (Bức 1: `2026-10-25T21:00`, khung 300); `meta.og` là đường dẫn ảnh chia sẻ.
- `scripts/poster.js <slug>`:
  - tự mở `vite preview` (cổng 4274) và Chromium có GPU thật (`channel: 'chromium'`); không có WebGPU thì dừng kèm lời giải thích;
  - mở `?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao` ở cỡ của poster (`meta.poster.width × height`, Bức 1 là 1600×1000), chờ đúng khung đó rồi chụp;
  - mã hóa ngay trong trang bằng `canvas.toBlob`, không thêm gói npm: poster WebP, chất lượng cao nhất mà vẫn ≤ 150 KB (`pickQuality` thử dần từ 0,92); og JPEG 1200×630 cắt giữa (`centerCrop`), q 0,85, ≤ 200 KB.
- Poster cũ `poster.svg` bỏ đi. `index.html` trỏ `poster.webp` và có thẻ `og:*`, `twitter:*`. Ảnh poster trong trang cắt ở GIỮA như canvas.
- Test: hợp đồng kiểm poster và og tồn tại, đúng cỡ, dưới giới hạn (đọc cỡ từ phần đầu file bằng `tests/helpers/image.js`); test HTML kiểm các thẻ og; `poster.test.js` kiểm các hàm thuần của script.

**Files:**
- Create: `scripts/poster.js`, `tests/helpers/image.js`, `tests/unit/poster.test.js`, `public/paintings/ao-sen-dem/poster.webp`, `public/paintings/ao-sen-dem/og.jpg` (hai ảnh do script sinh)
- Modify: `index.html`, `src/paintings/ao-sen-dem/meta.js`, `src/paintings/_mau/meta.js`, `src/styles/shell.css`
- Delete: `public/paintings/ao-sen-dem/poster.svg`
- Test: `tests/paintings/contract.test.js`, `tests/paintings/html.test.js`

**Interfaces:**
- Consumes: `?poster` (Task 16); màu đã chốt (Task 19).
- Produces: `LIMITS = { poster: 150 KB, og: 200 KB }`, `OG = { width: 1200, height: 630, quality: 0.85 }`, `QUALITIES`, `captureUrl({ meta, page })`, `centerCrop(w, h, tw, th)`, `pickQuality(sizeAt, limit, qualities)`; `webpSize(buf)`, `jpegSize(buf)` trong `tests/helpers/image.js`; `PaintingMeta.poster.capture`, `PaintingMeta.og`.

- [ ] **Step 1: Test (hỏng: chưa có script, chưa có poster.webp và og.jpg)**

Tạo `tests/helpers/image.js`:

```js
// tests/helpers/image.js — đọc cỡ ảnh từ phần đầu file (WebP, JPEG) mà không cần thư viện ảnh: test hợp đồng kiểm poster và og.

/**
 * Cỡ của một ảnh WebP. Ba dạng khung đầu: 'VP8 ' (nén mất dữ liệu, canvas.toBlob sinh dạng này), 'VP8L' (không mất),
 * 'VP8X' (mở rộng: có alpha, metadata).
 * @param {Buffer} buf
 * @returns {{ width: number, height: number }}
 */
export function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('không phải file WebP');
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  throw new Error(`WebP có khung đầu lạ: "${chunk}"`);
}

/**
 * Cỡ của một ảnh JPEG: đi qua các đoạn (marker) tới khung SOF (baseline hay progressive), nơi ghi cao và rộng.
 * @param {Buffer} buf
 * @returns {{ width: number, height: number }}
 */
export function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('không phải file JPEG');
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`JPEG hỏng ở byte ${i}`);
    const marker = buf[i + 1];
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('JPEG không có khung SOF');
}
```

Tạo `tests/unit/poster.test.js`:

```js
// tests/unit/poster.test.js — scripts/poster.js: URL chụp theo meta.poster.capture, vùng cắt og ở giữa, chọn chất lượng WebP; đọc cỡ ảnh.
import { describe, it, expect } from 'vitest';
import { LIMITS, OG, QUALITIES, captureUrl, centerCrop, pickQuality } from '../../scripts/poster.js';
import { jpegSize, webpSize } from '../helpers/image.js';

const meta = { slug: 'thu', poster: { width: 1600, height: 1000, capture: { at: '2026-10-25T21:00', freeze: 300 } } };

describe('scripts/poster.js', () => {
  it('captureUrl: đúng thời điểm và khung của meta.poster.capture, ẩn UI (?poster), ép mức cao; thiếu capture thì báo', () => {
    expect(captureUrl({ meta, page: 'index.html' })).toBe('?at=2026-10-25T21:00&freeze=300&poster&level=cao');
    expect(captureUrl({ meta, page: 'tranh/den/index.html' })).toBe('tranh/den/?at=2026-10-25T21:00&freeze=300&poster&level=cao');
    expect(() => captureUrl({ meta: { slug: 'x', poster: {} }, page: 'index.html' })).toThrow('Bức "x" chưa có meta.poster.capture');
  });

  it('centerCrop: vùng giữa lớn nhất đúng tỉ lệ og (1200×630) trong poster 1600×1000', () => {
    expect(OG).toMatchObject({ width: 1200, height: 630 });
    expect(centerCrop(1600, 1000, 1200, 630)).toEqual({ x: 0, y: 80, width: 1600, height: 840 });
    expect(centerCrop(1000, 1000, 1200, 630)).toEqual({ x: 0, y: 238, width: 1000, height: 525 });
  });

  it('pickQuality: chất lượng cao nhất mà file vẫn ≤ giới hạn; thấp nhất vẫn quá thì báo', async () => {
    expect(LIMITS).toEqual({ poster: 150 * 1024, og: 200 * 1024 });
    const size = async (q) => Math.round(q * 200_000); // file giả: càng nét càng nặng
    const q = await pickQuality(size, LIMITS.poster);
    expect(q).toBe(QUALITIES.find((x) => x * 200_000 <= LIMITS.poster));
    await expect(pickQuality(async () => 1e9, LIMITS.poster)).rejects.toThrow('vẫn quá 150 KB');
  });
});

describe('tests/helpers/image.js (tự kiểm)', () => {
  it('webpSize đọc khung VP8 (canvas.toBlob sinh dạng này) và VP8X; jpegSize đi tới khung SOF', () => {
    const vp8 = Buffer.alloc(30);
    vp8.write('RIFF', 0);
    vp8.write('WEBP', 8);
    vp8.write('VP8 ', 12);
    vp8.writeUInt16LE(1600, 26);
    vp8.writeUInt16LE(1000, 28);
    expect(webpSize(vp8)).toEqual({ width: 1600, height: 1000 });
    const vp8x = Buffer.alloc(30);
    vp8x.write('RIFF', 0);
    vp8x.write('WEBP', 8);
    vp8x.write('VP8X', 12);
    vp8x.writeUIntLE(1599, 24, 3);
    vp8x.writeUIntLE(999, 27, 3);
    expect(webpSize(vp8x)).toEqual({ width: 1600, height: 1000 });
    // SOI, rồi một đoạn APP0 dài 16 byte, rồi SOF0: cao 630, rộng 1200.
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, ...Array(14).fill(0), 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x76, 0x04, 0xb0, 0, 0, 0]);
    expect(jpegSize(jpeg)).toEqual({ width: 1200, height: 630 });
    expect(() => webpSize(Buffer.from('không phải ảnh'))).toThrow('không phải file WebP');
  });
});
```

Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index ea11468..56233f4 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -1,6 +1,6 @@
 // tests/paintings/contract.test.js — hợp đồng của mọi bức (registry + tranh mẫu _mau): meta, thứ tự lớp, marker, chữ, runtime.
 import { describe, it, expect } from 'vitest';
-import { existsSync, readFileSync } from 'node:fs';
+import { existsSync, readFileSync, statSync } from 'node:fs';
 import { resolve } from 'node:path';
 import { paintings } from '../../src/paintings/registry.js';
 import mau from '../../src/paintings/_mau/meta.js';
@@ -8,6 +8,8 @@ import { mergePalette } from '../../src/engine/palette.js';
 import { hasCode } from '../../src/ui/code-view.js';
 import { NOW, buildPainting } from '../helpers/fake-ctx.js';
 import { svgColors } from '../helpers/svg.js';
+import { jpegSize, webpSize } from '../helpers/image.js';
+import { parseAt } from '../../src/engine/flags.js';
 import { pass } from 'three/tsl';
 import { buildFinalNode, makeMRT } from '../../src/engine/gpu/pipeline.js';
 
@@ -76,6 +78,26 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
     }
   });
 
+  it('poster (GĐ 4): capture đọc được (at theo ?at, freeze nguyên dương); file WebP đúng cỡ và ≤ 150 KB; og 1200×630, ≤ 200 KB', () => {
+    const { capture } = meta.poster;
+    if (capture) {
+      expect(parseAt(capture.at), `poster.capture.at "${capture.at}" không đọc được như ?at`).not.toBeNull();
+      expect(Number.isInteger(capture.freeze) && capture.freeze > 0, 'poster.capture.freeze phải là số nguyên dương').toBe(true);
+    }
+    if (!row.deployed) return; // tranh mẫu không có file trong public/
+    const PUBLIC = resolve(SRC, '../public');
+    if (meta.poster.src.endsWith('.webp')) {
+      const file = readFileSync(PUBLIC + meta.poster.src);
+      expect(webpSize(file), 'cỡ poster phải đúng meta.poster').toEqual({ width: meta.poster.width, height: meta.poster.height });
+      expect(file.length, 'poster ≤ 150 KB').toBeLessThanOrEqual(150 * 1024);
+    }
+    if (meta.og) {
+      expect(existsSync(resolve(PUBLIC, meta.og)), `thiếu public/${meta.og}`).toBe(true);
+      expect(jpegSize(readFileSync(resolve(PUBLIC, meta.og)))).toEqual({ width: 1200, height: 630 });
+      expect(statSync(resolve(PUBLIC, meta.og)).size, 'og ≤ 200 KB').toBeLessThanOrEqual(200 * 1024);
+    }
+  });
+
   it('painting.js: cùng id lớp, cùng thứ tự với meta; module lớp và camera đúng hình dạng', async () => {
     const { entry, painting } = await loadPainting();
     expect(entry.meta, 'index.js phải export meta của chính bức').toBe(meta);
```

Áp vào `tests/paintings/html.test.js`:

```diff
diff --git a/tests/paintings/html.test.js b/tests/paintings/html.test.js
index 811ca6d..3c5f452 100644
--- a/tests/paintings/html.test.js
+++ b/tests/paintings/html.test.js
@@ -3,7 +3,7 @@ import { describe, it, expect, beforeAll } from 'vitest';
 import { readFileSync, existsSync, statSync } from 'node:fs';
 import { fileURLToPath } from 'node:url';
 import { JSDOM } from 'jsdom';
-import { paintings } from '../../src/paintings/registry.js';
+import { SITE, paintings } from '../../src/paintings/registry.js';
 import { mergePalette } from '../../src/engine/palette.js';
 import { svgColors } from '../helpers/svg.js';
 
@@ -56,6 +56,18 @@ for (const { meta, page, lang } of paintings) {
       expect(statSync(file).size).toBeLessThanOrEqual(limit);
     });
 
+    it('thẻ chia sẻ (GĐ 4): og:title = <title>, og:description = tagline, og:url = SITE, og:image = SITE + meta.og (1200×630), twitter summary_large_image', () => {
+      const prop = (name) => $(`meta[property="${name}"]`)?.getAttribute('content');
+      expect(prop('og:title')).toBe(doc.title);
+      expect(prop('og:description')).toBe(meta.tagline);
+      expect(prop('og:type')).toBe('website');
+      expect(prop('og:url')).toBe(SITE + page.replace(/index\.html$/, ''));
+      expect(meta.og, 'meta.og là đường dẫn trong public/, không có "/" đầu').toMatch(/^[^/].*\.jpg$/);
+      expect(prop('og:image')).toBe(SITE + meta.og);
+      expect([prop('og:image:width'), prop('og:image:height')]).toEqual(['1200', '630']);
+      expect($('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary_large_image');
+    });
+
     it('poster SVG chỉ dùng màu của bảng sơn mài (đã ghép meta.palette)', () => {
       if (!meta.poster.src.endsWith('.svg')) return;
       const svg = readFileSync(ROOT + 'public' + meta.poster.src, 'utf8');
```

Run: `npx vitest run tests/unit/poster.test.js tests/paintings/contract.test.js tests/paintings/html.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `Error: Cannot find module '../../scripts/poster.js' imported from tests/unit/poster.test.js`.

- [ ] **Step 2: Code**

Tạo `scripts/poster.js`:

```js
// scripts/poster.js — chụp poster (WebP ≤ 150 KB) và ảnh og (JPEG 1200×630) của một bức từ chính cảnh 3D, trên GPU thật.
//
// Chạy trên máy có GPU thật (WebGPU), sau khi build:  npm run build && node scripts/poster.js <slug>
// Script tự mở `vite preview`, mở trang ở ?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao, chờ đúng khung đó,
// chụp khung hình, rồi mã hóa NGAY TRONG TRANG (canvas 2D → toBlob), nên không cần thêm gói npm nào (không sharp).
// Ảnh ghi vào public/ theo meta.poster.src và meta.og. CI không chạy script này: ảnh được commit vào repo (spec §8.7).
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const PORT = 4274;
const BASE = `http://127.0.0.1:${PORT}/son-mai-anh-sang/`;
/** Giới hạn cỡ file (spec §10): poster WebP ≤ 150 KB, og JPEG ≤ 200 KB. */
export const LIMITS = Object.freeze({ poster: 150 * 1024, og: 200 * 1024 });
export const OG = Object.freeze({ width: 1200, height: 630, quality: 0.85 });
/** Chất lượng WebP thử lần lượt, từ cao xuống: lấy mức cao nhất mà file vẫn ≤ giới hạn. */
export const QUALITIES = Object.freeze([0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.55, 0.5, 0.45, 0.4]);

/**
 * URL chụp poster của một dòng registry (tương đối với BASE): đúng thời điểm và khung của meta.poster.capture, ẩn mọi UI,
 * ép mức cao (ảnh đẹp nhất, không phụ thuộc máy chụp là điện thoại hay máy yếu).
 * @param {{ meta: import('../src/engine/contracts/painting.js').PaintingMeta, page: string }} row
 */
export function captureUrl({ meta, page }) {
  const capture = meta.poster.capture;
  if (!capture) throw new Error(`Bức "${meta.slug}" chưa có meta.poster.capture: không biết chụp lúc nào`);
  const dir = page.replace(/index\.html$/, '');
  return `${dir}?at=${capture.at}&freeze=${capture.freeze}&poster&level=cao`;
}

/**
 * Vùng cắt ở GIỮA ảnh, đúng tỉ lệ của khung đích, lớn nhất có thể (rồi mới thu về cỡ đích): og 1200×630 từ poster 1600×1000.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function centerCrop(width, height, targetWidth, targetHeight) {
  const scale = Math.min(width / targetWidth, height / targetHeight);
  const w = Math.round(targetWidth * scale);
  const h = Math.round(targetHeight * scale);
  return { x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), width: w, height: h };
}

/**
 * Chọn chất lượng cao nhất mà file vẫn ≤ giới hạn. `sizeAt(q)` mã hóa thử và trả số byte.
 * @param {(q: number) => Promise<number>} sizeAt
 * @param {number} limit
 * @returns {Promise<number>}  chất lượng đã chọn
 */
export async function pickQuality(sizeAt, limit, qualities = QUALITIES) {
  for (const q of qualities) if ((await sizeAt(q)) <= limit) return q;
  throw new Error(`Ở chất lượng thấp nhất (${qualities.at(-1)}) ảnh vẫn quá ${Math.round(limit / 1024)} KB`);
}

/** Chờ `vite preview` trả lời (tối đa 30 giây). */
async function waitForServer(url) {
  for (let i = 0; i < 60; i += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // chưa mở cổng
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`vite preview không trả lời ở ${url}`);
}

async function main(slug) {
  const row = paintings.find((p) => p.meta.slug === slug);
  if (!row) throw new Error(`Không có bức "${slug}" trong registry. Có: ${paintings.map((p) => p.meta.slug).join(', ')}`);
  const { poster, og } = row.meta;
  if (!og) throw new Error(`Bức "${slug}" chưa có meta.og (đường dẫn ảnh og trong public/)`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  let browser = null;
  try {
    browser = await chromium.launch({ channel: 'chromium' }); // Chromium đầy đủ: dùng GPU thật của máy
    await waitForServer(BASE);
    const page = await browser.newPage({ viewport: { width: poster.width, height: poster.height }, deviceScaleFactor: 1 });
    await page.goto(BASE + captureUrl(row));
    const freeze = poster.capture.freeze;
    await page.waitForFunction((n) => window.__sma?.state === 'static' || window.__sma?.frames >= n, freeze, { timeout: 120_000 });
    const sma = await page.evaluate(() => ({ state: window.__sma.state, backend: window.__sma.backend, frames: window.__sma.frames }));
    if (sma.state !== 'live' || sma.backend !== 'webgpu') {
      throw new Error(`Cần WebGPU trên GPU thật để chụp poster; trang đang ở ${sma.state} / ${sma.backend}`);
    }
    // Chụp khung hình (?poster đã ẩn mọi UI), rồi mã hóa trong trang bằng canvas 2D: WebP cho poster, JPEG cho og.
    const b64 = (await page.screenshot({ type: 'png' })).toString('base64');
    /** Cắt vùng `area` của ảnh chụp, thu về `size`, mã hóa `type` ở chất lượng `quality`; trả các byte của file. */
    const encode = async (type, quality, area, size) => Buffer.from(await page.evaluate(async (p) => {
      const img = new Image();
      img.src = `data:image/png;base64,${p.b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = p.size;
      canvas.getContext('2d').drawImage(img, p.area.x, p.area.y, p.area.width, p.area.height, 0, 0, p.size[0], p.size[1]);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, p.type, p.quality));
      return [...new Uint8Array(await blob.arrayBuffer())];
    }, { b64, type, quality, area, size }));
    const full = { x: 0, y: 0, width: poster.width, height: poster.height };
    const posterSize = [poster.width, poster.height];
    const q = await pickQuality(async (quality) => (await encode('image/webp', quality, full, posterSize)).length, LIMITS.poster);
    const webp = await encode('image/webp', q, full, posterSize);
    const jpeg = await encode('image/jpeg', OG.quality, centerCrop(poster.width, poster.height, OG.width, OG.height), [OG.width, OG.height]);
    if (jpeg.length > LIMITS.og) throw new Error(`og.jpg ${Math.round(jpeg.length / 1024)} KB, quá ${LIMITS.og / 1024} KB`);
    for (const [file, bytes] of [[`${ROOT}public${poster.src}`, webp], [`${ROOT}public/${og}`, jpeg]]) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, bytes);
    }
    console.log(`Đã chụp ở khung ${sma.frames} (${sma.backend}): public${poster.src} (${Math.round(webp.length / 1024)} KB, WebP q ${q}), `
      + `public/${og} (${Math.round(jpeg.length / 1024)} KB)`);
  } finally {
    await browser?.close();
    server.kill();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv[2]).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
```

Áp vào `src/paintings/ao-sen-dem/meta.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index 8d2fed9..abc2e3c 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -20,11 +20,16 @@ export default {
     source: 'Ca dao',
   },
   poster: {
-    src: '/paintings/ao-sen-dem/poster.svg',
+    src: '/paintings/ao-sen-dem/poster.webp',
     width: 1600,
     height: 1000,
     alt: 'Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá.',
+    // scripts/poster.js chụp poster từ chính cảnh (GĐ 4): đêm 16 tháng Chín, trăng tròn, 21:00; khung 300 (5 giây) để
+    // đom đóm kịp tản đều. Muốn đổi thời điểm thì sửa dòng này rồi chạy lại script (cần GPU thật).
+    capture: { at: '2026-10-25T21:00', freeze: 300 },
   },
+  // Ảnh chia sẻ lên mạng xã hội (og:image), 1200×630, JPEG: cắt phần giữa của poster.
+  og: 'paintings/ao-sen-dem/og.jpg',
   // THỨ TỰ PHỦ: lớp đầu luôn là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng.
   layers: [
     {
```

Áp vào `src/paintings/_mau/meta.js`:

```diff
diff --git a/src/paintings/_mau/meta.js b/src/paintings/_mau/meta.js
index 05b5427..b1ff9f5 100644
--- a/src/paintings/_mau/meta.js
+++ b/src/paintings/_mau/meta.js
@@ -15,8 +15,15 @@ export default {
     lines: ['Ai ơi bưng bát cơm đầy', 'Dẻo thơm một hạt đắng cay muôn phần'],
     source: 'Ca dao',
   },
-  // Bức thật đặt poster ở public/paintings/<slug>/ (hoặc chạy scripts/poster.js ở GĐ 4).
-  poster: { src: '/paintings/_mau/poster.svg', width: 1600, height: 1000, alt: 'Tranh mẫu: một nút thắt đất sét trên bệ.' },
+  // Bức thật đặt poster ở public/paintings/<slug>/: chạy `node scripts/poster.js <slug>` (GPU thật) để chụp poster.webp
+  // và og.jpg từ chính cảnh, theo `capture` (thời điểm ?at và khung ?freeze). Tranh mẫu không deploy nên không có file ảnh.
+  poster: {
+    src: '/paintings/_mau/poster.webp',
+    width: 1600,
+    height: 1000,
+    alt: 'Tranh mẫu: một nút thắt đất sét trên bệ.',
+    capture: { at: '2026-09-28T21:00', freeze: 120 },
+  },
   // THỨ TỰ PHỦ: lớp đầu luôn là Cốt. Bức thật thường kết thúc bằng lớp dùng chung Phủ bóng (engine/stock/phu-bong).
   layers: [
     { id: 'cot', name: 'Cốt', files: ['paintings/_mau/layers/l1-cot.js'] },
```

Áp vào `index.html`:

```diff
diff --git a/index.html b/index.html
index b240f31..5e02764 100644
--- a/index.html
+++ b/index.html
@@ -6,6 +6,14 @@
     <title>Ao Sen Đêm · Sơn Mài Ánh Sáng</title>
     <meta name="description" content="Một ao sen đêm, sơn từ sáu lớp ánh sáng." />
     <meta name="theme-color" content="#0E0A08" />
+    <meta property="og:title" content="Ao Sen Đêm · Sơn Mài Ánh Sáng" />
+    <meta property="og:description" content="Một ao sen đêm, sơn từ sáu lớp ánh sáng." />
+    <meta property="og:type" content="website" />
+    <meta property="og:url" content="https://giabao2610.github.io/son-mai-anh-sang/" />
+    <meta property="og:image" content="https://giabao2610.github.io/son-mai-anh-sang/paintings/ao-sen-dem/og.jpg" />
+    <meta property="og:image:width" content="1200" />
+    <meta property="og:image:height" content="630" />
+    <meta name="twitter:card" content="summary_large_image" />
     <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
     <link rel="stylesheet" href="/src/styles/shell.css" />
   </head>
@@ -13,7 +21,7 @@
     <img
       class="poster"
       data-poster
-      src="/paintings/ao-sen-dem/poster.svg"
+      src="/paintings/ao-sen-dem/poster.webp"
       width="1600"
       height="1000"
       alt="Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá."
```

Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 3c26d5a..357c949 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -43,15 +43,14 @@ body {
 ::selection { background: var(--vang-la); color: var(--den-then); }
 
 /* ── Lớp 0: poster ─────────────────────────────────────────────────────────────────────── */
-/* Ảnh tĩnh phủ kín màn hình. object-fit: cover cắt bớt mép thay vì bóp méo ảnh;
-   object-position lệch phải để điện thoại dọc vẫn thấy trăng. */
+/* Ảnh tĩnh phủ kín màn hình. object-fit: cover cắt bớt mép thay vì bóp méo ảnh. Từ GĐ 4 poster được chụp từ chính camera
+   của cảnh (scripts/poster.js): cắt ở GIỮA như canvas cắt khung hình, nên lúc hòa dần poster → cảnh không bị lệch khung. */
 img[data-poster] {
   position: fixed;
   inset: 0;
   width: 100%;
   height: 100%;
   object-fit: cover;
-  object-position: 62% 50%;
 }
 
 /* ── Lớp 1: sân khấu 3D ───────────────────────────────────────────────────────────────── */
```

Xóa `public/paintings/ao-sen-dem/poster.svg`:

```bash
git rm public/paintings/ao-sen-dem/poster.svg
```

- [ ] **Step 3: Chụp poster và og (máy có GPU thật)**

```bash
npm run build
node scripts/poster.js ao-sen-dem
ls -l public/paintings/ao-sen-dem/   # poster.webp ≤ 150 KB, og.jpg ≤ 200 KB
```
Kết quả mong đợi: script in chất lượng đã chọn và cỡ file. Lúc dựng thử: poster 1600×1000 nặng 142 KB ở q 0,88; og 86 KB. Mở hai ảnh xem bằng mắt: ảnh phải giống ảnh Bao đã duyệt cùng kế hoạch.

Run: `npx vitest run tests/unit/poster.test.js tests/paintings/contract.test.js tests/paintings/html.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 4: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  678 passed`.

```bash
git add index.html public/paintings/ao-sen-dem/og.jpg public/paintings/ao-sen-dem/poster.webp scripts/poster.js src/paintings/_mau/meta.js src/paintings/ao-sen-dem/meta.js src/styles/shell.css tests/helpers/image.js tests/paintings/contract.test.js tests/paintings/html.test.js tests/unit/poster.test.js
git commit -F - <<'EOF'
feat: poster thật chụp từ cảnh (scripts/poster.js: WebP ≤ 150 KB, og.jpg 1200×630), thẻ og/twitter; poster.svg bỏ đi

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 21: Ghi lại GĐ 4: README, CLAUDE.md, spec

**Mục tiêu:**
- **README:** Phủ bóng hoàn chỉnh; mục "Công cụ học"; đo GPU thật (kể cả GPU Apple); "Thêm một bức tranh mới"; "Poster và ảnh chia sẻ"; `__sma` mới; bảng bundle đo lại; ghi chú CI.
- **CLAUDE.md:** bản đồ dự án (tuner, gpu-timer, views, toolbox, tools, Dial), lệnh chụp poster và e2e GPU thật, luật TSL mới (A.44–A.47), luật đo GPU, nhóm luật "Công cụ học, Dial, poster (GĐ 4)", cờ `?poster`, `__sma` mới.
- **Spec:**
  - §5 số đo của lượt màu;
  - §6 chi tiết LUT, số mặc định 0,45 / 0,03 / 0,45;
  - §7 thơ và con dấu nhường chỗ khi một công cụ bật;
  - §8.1 cây thư mục thêm `meter.js`, `pick.js`, `tests/helpers/image.js`;
  - §10: luật 1,5 lần nhịp khung và trường hợp GPU Apple, draw call và JS đo được, số đo trên máy dựng thử, ba ngưỡng vẫn là số khởi đầu;
  - §12 mục kiểm tay mới; §16 đo GPU cho GPU kiểu tile; §17 rủi ro số GPU;
  - Phụ lục A.44–A.51.

Đo lại bundle từ bản build của bạn (`npm run build` in cỡ gzip): số trong README là của bản dựng thử; lệch vài trăm byte thì ghi số của bạn.

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

**Interfaces:**
- Consumes: số đo của Task 17, 19, 20.
- Produces: —

- [ ] **Step 1: README**

Áp vào `README.md`:

````diff
diff --git a/README.md b/README.md
index 97a39b4..5ac5b07 100644
--- a/README.md
+++ b/README.md
@@ -16,8 +16,9 @@ Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:
 **Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng (đủ sáu lớp từ giai đoạn 3):
 Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
 chất liệu), Sương (vòm trời có sao, quầng trăng, Ngân Hà; sương là là trên mặt nước), Mặt nước (phản chiếu, gợn sóng),
-Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES).
-Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại; vuốt để sương xoáy.
+Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES, LUT "sơn mài"
+sinh từ bảng màu, hạt, tối góc, FXAA). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại; vuốt để
+sương xoáy; kéo thanh giờ để trăng đi qua đêm.
 Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".
 
 ## Sổ tay: mài từng lớp
@@ -33,20 +34,39 @@ Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng b
   mỗi khung, mili giây CPU). Thí nghiệm so sánh (như "CPU vs GPU", "Chỉ 1 octave") vẽ hai cột "Tắt / Bật".
 - Ở tầng tranh tĩnh vẫn đọc được Sổ tay (nút "Xem 6 lớp của bức tranh"): chữ, sơ đồ và code; núm cần cảnh 3D.
 - Trong DevTools: `__sma.layers()`, `__sma.setWeight('mat-nuoc', 0)` (mài một lớp ngay), `__sma.snapshot()`,
-  `__sma.restore(s)`, `__sma.stats()` (draw call, ms), `__sma.quality()` (mức và nấc đang hạ), `__sma.degrade()` /
-  `__sma.upgrade()` (hạ/nâng tay một nấc).
+  `__sma.restore(s)`, `__sma.stats()` (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (mức, nấc đang hạ, máy có đo được
+  GPU không, nấc bị khóa), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` /
+  `__sma.setTool('kinh-mai')` (công cụ học), `__sma.dials()` / `__sma.setDial('gio', 27)` (thanh giờ).
 - Mất GPU (máy ngủ, đổi card đồ họa): lần đầu trang hiện poster và nút "Dựng lại cảnh", dựng lại đúng trạng thái cũ;
   lần hai thì về tranh tĩnh.
 
+## Công cụ học: nhìn vào bên trong một khung hình
+
+Trong thanh lớp có mục **Đồ nghề** (mỗi lúc bật một công cụ; đóng thanh lớp thì công cụ tắt):
+
+- **Kính mài:** soi một bước giữa chừng của khung hình (*Trước tone*, *Trước bloom*, *Chỉ emissive*, *Normal*, *Depth*).
+  Hình **tròn** đi theo chuột (điện thoại: chạm để đặt, giữ rồi kéo để dời); hình **gạt** chia khung bằng một vạch kéo được
+  (cả bằng bàn phím): bên trái là ảnh đang soi, bên phải là ảnh cuối. Chọn *Normal* lần đầu thì xưởng phải biên dịch lại một lần
+  ("đang mài…").
+- **Lột lớp:** một thanh trượt lột dần ảnh cuối về từng bước, từ ảnh cuối tới depth.
+- **Thanh giờ:** kéo từ 18:00 tới 05:30; trăng, lối trăng, bóng, màu trời và sương đi theo; trăng thấp thì ánh trăng yếu.
+
+Công cụ chạy trên mọi bức: chúng chỉ nhìn các "view" mà xưởng liệt kê, bức không biết có công cụ nào.
+
 ## Chất lượng: hợp với nhiều loại máy
 
 Trang tự chọn mức theo máy: WebGPU trên máy tính là **cao**, WebGPU trên điện thoại hay WebGL2 trên máy tính là **vừa**,
 WebGL2 trên điện thoại là **thấp** (phản chiếu giả, không bóng, ít đom đóm hơn). Sau đó, không ép máy quá sức:
 
-- **Tối đa 60 khung/giây**, kể cả trên màn 90/120/144 Hz: GPU không phải vẽ gấp đôi.
+- **Tối đa 60 khung/giây**, kể cả trên màn 90/120/144 Hz: GPU không phải vẽ gấp đôi. Màn "60 Hz" thật ra chạy 60,02–60,1 Hz
+  không bị bỏ khung nào.
 - **Bộ điều chỉnh tự động** đo nhịp khung theo cửa sổ 2 giây. Chậm (dưới 50 khung/giây trên máy tính, 37 trên điện thoại)
   thì hạ từng nấc: độ nét (DPR), chi tiết sương, độ nét phản chiếu, bloom, số đom đóm, cỡ bóng. Rảnh lại thì nâng lên.
   Đang hạ thì huy hiệu ghi *"hạ n nấc"*. Khi Sổ tay mở (bạn đang thử phá), nó chỉ ra tay nếu máy quá tải nặng.
+- **Đo thời gian GPU thật** khi máy cho phép (Chrome, Edge trên máy tính): bộ điều chỉnh phân biệt được máy yếu (hạ nấc) với
+  trình duyệt đang khóa 30 khung/giây để tiết kiệm pin (không hạ gì). Sổ tay có thêm dòng mili giây GPU. Safari và nhiều
+  điện thoại chưa đo được; GPU Apple trên Chrome báo các lượt vẽ chồng lên nhau (số lớn hơn cả nhịp khung) nên cũng bị coi là
+  không đo được. Khi đó dòng ms GPU ghi "—", bộ điều chỉnh đoán theo nhịp khung như trước.
 - **Núm có trần theo mức:** trên máy yếu, núm không kéo được số đom đóm, độ phân giải phản chiếu hay số tầng noise của
   sương lên quá sức máy.
 - Xem trước mức khác ngay trên máy tính: thêm `?level=thap` (hoặc `vua`, `cao`) vào địa chỉ.
@@ -84,8 +104,11 @@ npm run e2e                        # build rồi chạy e2e (tranh tĩnh, WebGL2
 **WebGPU e2e trên CI (ubuntu):** với headless shell của Playwright, mọi test WebGPU rơi về tranh tĩnh vì
 `device-lost: "A valid external Instance reference no longer exists"`. Project `webgpu-swiftshader` vì vậy dùng Chromium
 đầy đủ (`channel: 'chromium'`) và, chỉ khi chạy trên CI, thêm cờ Vulkan của SwiftShader
-(`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Chỉ đổi Chromium thì chưa đủ; thêm cờ
-Vulkan thì WebGPU e2e xanh trên ubuntu. Bước này vẫn không chặn deploy cho tới khi chạy ổn qua nhiều lần.
+(`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Từ giai đoạn 4, e2e WebGPU chạy ở một job
+riêng (`e2e-webgpu`, không chặn deploy, trần 25 phút), song song với job `build` (chặn: unit, build, e2e tĩnh + WebGL2 kèm a11y).
+
+**E2E trên GPU thật của máy mình** (nhanh, bắt được lỗi của driver mà SwiftShader che mất):
+`npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`.
 
 ## Cờ URL
 
@@ -99,7 +122,7 @@ Thêm vào sau địa chỉ trang, ví dụ `…/son-mai-anh-sang/?webgl&freeze=
 | `?debug` | In chi tiết lỗi và mở three.js Inspector. `?debug=stats` mở stats-gl (FPS, CPU, GPU). Cả hai chỉ tải khi có cờ |
 | `?at=2026-09-28T21:00` | "Bây giờ" giả lập. Không ghi múi giờ thì hiểu là giờ Việt Nam; muốn ghi thì dùng `Z` hoặc `%2B07:00` |
 | `?freeze`, `?freeze=N` | Đồng hồ tất định: mỗi khung đúng 1/60 giây. `?freeze=N` dừng sau khung N |
-| `?poster` | (Giai đoạn 4) ẩn mọi giao diện trừ canvas, để chụp poster |
+| `?poster` | Ẩn mọi giao diện trừ canvas, để chụp poster (dùng cùng `?at` và `?freeze=N`) |
 | `?level=cao\|vua\|thap` | Ép mức chất lượng (bỏ qua cách tự chọn theo máy); giá trị lạ thì bỏ qua |
 
 ## Cấu trúc
@@ -111,33 +134,67 @@ Thêm vào sau địa chỉ trang, ví dụ `…/son-mai-anh-sang/?webgl&freeze=
 | `src/paintings/<slug>/` | **Các bức**: mỗi bức một thư mục; `src/paintings/registry.js` liệt kê các bức |
 | `src/paintings/_mau/` | **Tranh mẫu** hai lớp, không deploy: khuôn để copy khi làm bức mới, và là fixture của test hợp đồng |
 | `plugins/` | Plugin Vite `?code`: tô màu code của lớp bằng Shiki lúc build cho tab Chỉnh của Sổ tay |
+| `scripts/poster.js` | Chụp poster (WebP) và ảnh chia sẻ (og, JPEG) từ chính cảnh 3D, trên GPU thật |
 | `tests/` | Unit, luật ranh giới (`tests/rules/`), hợp đồng của các bức |
-| `e2e/` | Playwright: tranh tĩnh, WebGL2 và WebGPU trên SwiftShader |
+| `e2e/` | Playwright: tranh tĩnh, WebGL2 và WebGPU trên SwiftShader, trợ năng (axe-core) |
 
 Luật làm việc với code (cho người và cho AI) nằm trong [CLAUDE.md](CLAUDE.md).
 
+## Thêm một bức tranh mới
+
+Mỗi bức là một thư mục, một trang HTML, một thư mục ảnh trong `public/` và một dòng registry (luật 7 của spec §0).
+Không phải sửa xưởng, trừ khi bức cần một khả năng mới.
+
+1. `cp -r src/paintings/_mau src/paintings/<slug>`, rồi sửa trong `meta.js`: `slug` (trùng tên thư mục, kebab-case không dấu),
+   `no`, `title`, `tagline`, `poem` (có `source`), `poster` (kèm `capture`: thời điểm và khung để chụp), `og`, và `fence`
+   (từ vựng riêng của bức, để test cấm xưởng nhắc tới).
+2. Viết các lớp `layers/lN-<id>.js` (mỗi file `export const id`, `knobs`, `createLayer`); lớp đầu luôn là Cốt, lớp cuối thường
+   là Phủ bóng dùng chung. Thêm `painting.js` (lớp, camera, `quality`, `setup`) và `content.vi.js` (chữ của Sổ tay).
+3. Copy `index.html` thành `tranh/<slug>/index.html`, sửa `data-painting`, tiêu đề, thơ, poster, thẻ og và dòng import.
+4. Thêm `{ meta, page: 'tranh/<slug>/index.html', lang: 'vi' }` vào `src/paintings/registry.js`.
+5. Chụp poster từ chính cảnh: `npm run build && node scripts/poster.js <slug>` (máy có GPU thật). Ảnh ghi vào
+   `public/paintings/<slug>/`.
+6. `npm test` rồi sửa theo từng lỗi tiếng Việt; `npm run e2e`. E2e chung (mài lớp, hạ nấc, Kính mài, Lột lớp, a11y…) tự chạy
+   trên bức mới.
+
+Công thức đầy đủ (thêm lớp, thêm công cụ học, thêm ngôn ngữ): spec §15.
+
+## Poster và ảnh chia sẻ
+
+Poster (`poster.webp`, ≤ 150 KB) và ảnh og (`og.jpg`, 1200×630) được chụp từ chính cảnh 3D, nên poster hiện ngay lúc mở trang
+và cảnh 3D hòa lên trên là cùng một ảnh:
+
+```bash
+npm run build
+node scripts/poster.js ao-sen-dem   # cần GPU thật (WebGPU); tự mở vite preview
+```
+
+Script mở `?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao` ở cỡ của poster, chờ đúng khung đó, rồi mã hóa WebP và
+JPEG ngay trong trang (không thêm gói npm nào). Muốn đổi thời điểm thì sửa `poster.capture` trong `meta.js` rồi chạy lại.
+CI không chạy script này: ảnh được commit vào repo.
+
 ## Kích thước bundle
 
-Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-09-30 (giai đoạn 3). Tên file đã bỏ phần hash.
+Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-10-01 (giai đoạn 4). Tên file đã bỏ phần hash.
 
 | File | Kích thước | gzip |
 |---|---:|---:|
-| `assets/ao-sen-dem-*.css` | 32.75 kB | 12.30 kB |
-| `assets/ao-sen-dem-*.js` (chunk vào) | 19.00 kB | 8.92 kB |
-| `assets/run-*.js` | 43.18 kB | 14.26 kB |
-| `assets/workshop-*.js` (thanh lớp + Sổ tay) | 12.98 kB | 5.00 kB |
-| `assets/painting-*.js` | 39.74 kB | 15.40 kB |
-| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay) | 28.50 kB | 8.71 kB |
-| `assets/three-*.js` | 897.63 kB | 245.55 kB |
-| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **297.84 kB** |
-| `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.22 kB | 30.91 kB |
-| 18 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–6.1 kB mỗi file |
-| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.84 kB | 38.66 kB |
+| `assets/ao-sen-dem-*.css` | 36.73 kB | 13.03 kB |
+| `assets/ao-sen-dem-*.js` (chunk vào) | 21.38 kB | 9.91 kB |
+| `assets/run-*.js` (kèm đồ nghề, view, bộ điều chỉnh) | 54.05 kB | 18.31 kB |
+| `assets/workshop-*.js` (thanh lớp + Sổ tay + Đồ nghề) | 15.73 kB | 5.86 kB |
+| `assets/painting-*.js` (kèm LUT, FXAA của Phủ bóng) | 45.66 kB | 17.59 kB |
+| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay) | 30.42 kB | 9.25 kB |
+| `assets/three-*.js` | 898.07 kB | 245.65 kB |
+| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **306.57 kB** |
+| `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.30 kB | 30.96 kB |
+| 20 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–6.2 kB mỗi file |
+| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.83 kB | 38.67 kB |
 | `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |
 
 Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang; mở Sổ tay chỉ đọc thì tải thêm `workshop` và `content`.
 Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.
-Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 328.75 kB).
+Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 337.53 kB).
 
 ## Giấy phép
````

- [ ] **Step 2: CLAUDE.md**

Áp vào `CLAUDE.md`:

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index e80fc51..e41f564 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -18,14 +18,18 @@ Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec
 
 - Phần nhẹ của xưởng (`src/engine/*.js`: boot, flags, tier, quality, palette, deadline, sma, static) chạy khi poster
   đang hiện và **không kéo theo three**. Phần nặng (`src/engine/gpu/`) chỉ được tải bằng `import()` động ở tầng 3D.
-- Chất lượng (GĐ 3): `engine/quality.js` chọn mức và QUYẾT định hạ/nâng nấc (hàm thuần, test bằng chuỗi khung giả);
-  `engine/gpu/ladder.js` ÁP nấc (`'dpr'` và `layer.degrade`). Bảng số và thứ tự nấc của Bức 1: `paintings/ao-sen-dem/quality.js`.
+- Chất lượng: `engine/quality.js` chọn mức; `engine/tuner.js` QUYẾT định hạ/nâng nấc (hàm thuần, test bằng chuỗi khung giả;
+  GĐ 4: máy đo được ms GPU thì chẩn đoán theo tải); `engine/gpu/ladder.js` ÁP nấc (`'dpr'` và `layer.degrade`);
+  `engine/gpu/gpu-timer.js` đo ms GPU. Bảng số và thứ tự nấc của Bức 1: `paintings/ao-sen-dem/quality.js`.
 - Lớp dùng chung (thuộc kỹ thuật, bức nào cũng lắp được): `src/engine/stock/<id>/`, hiện có Phủ bóng.
 - `src/paintings/registry.js`: danh sách các bức. Node đọc (vite.config, test, e2e); trình duyệt không import.
 - `src/paintings/_mau/`: tranh mẫu 2 lớp, KHÔNG deploy (không có trong registry). Là fixture của test hợp đồng và là
   khuôn để copy khi làm bức mới.
 - Sổ tay (GĐ 2): `ui/workshop.js` (thanh lớp + Sổ tay + chế độ mài) chỉ thấy **bàn thợ** `engine/gpu/studio.js`
-  (trọng số, núm, thí nghiệm, số đo, snapshot). `ui/` không import engine hay three.
+  (trọng số, núm, thí nghiệm, số đo, snapshot; GĐ 4: công cụ, Dial). `ui/` không import engine hay three.
+- Công cụ học (GĐ 4): `engine/tools/<id>.js` (Kính mài, Lột lớp) chỉ nhìn các view của `engine/gpu/views.js`;
+  `engine/gpu/toolbox.js` gắn công cụ, mỗi lúc một công cụ; `ui/rail-tools.js` vẽ mục "Đồ nghề" trong thanh lớp.
+  Dial (núm của cả bức, như thanh giờ): bức khai báo ở `setup().dials`, `engine/gpu/dial-set.js` đọc/ghi, `ui/dials.js` vẽ.
 - Cách phân biệt: tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thuộc xưởng; tên chủ đề (sen, trăng,
   gợn nước, đom đóm) thuộc bức.
 
@@ -37,7 +41,9 @@ Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec
 | Unit + luật + hợp đồng | `npm test` (một file: `npx vitest run tests/unit/flags.test.js`) |
 | Build | `npm run build` (ra `dist/`) |
 | E2E | `npm run e2e` (build rồi chạy Playwright); một project: `npm run build && npx playwright test --project=webgl2-swiftshader` |
+| E2E trên GPU thật | `npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu` |
 | Lần đầu chạy e2e | `npx playwright install chromium` |
+| Chụp poster + og | `npm run build && node scripts/poster.js <slug>` (máy có GPU thật; theo `meta.poster.capture`) |
 
 **Node 24.** Vite 8 và Vitest 5 không chạy trên Node 20. Cài theo thư mục bằng fnm để không đổi Node của các project khác:
 `brew install fnm`, thêm `eval "$(fnm env --use-on-cd --shell zsh)"` vào `~/.zshrc`, rồi `fnm install 24`.
@@ -92,14 +98,35 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 - Trong `positionNode` (chạy sau instancing) được gán `normalLocal.assign(…)` để xoay cả pháp tuyến (cánh hoa nở theo uniform).
 - Lũy thừa 2, 3, 4 viết bằng `pow2`/`pow3`/`pow4`; `pow` với số mũ khác thì cơ số phải chắc chắn ≥ 0 (`saturate`, `abs`).
   GLSL/WGSL không định nghĩa `pow` của số âm: SwiftShader vẫn ra số, GPU thật có thể ra NaN.
+- Nhánh của `If` trong một `Fn` gọi ngay không được trả giá trị: viết `() => { x.assign(…); }`, không viết `() => x.assign(…)`
+  (three cảnh báo "Return statement used in an inline 'Fn()'").
+- Không gọi `scenePass.getTextureNode(name)` cho kênh chưa có trong MRT: nó thêm một ảnh vào render target, và target nhiều ảnh
+  hơn số đầu ra của shader thì vỡ. View Normal dùng node giữ chỗ tới khi `requireView` đổi MRT (`engine/gpu/views.js`).
 
 ### Chất lượng và phần cứng (GĐ 3: sản phẩm phải hợp nhiều loại máy)
 - Nấc (`Layer.degrade`) chỉ hạ TRẦN, không ghi vào núm; hiệu lực = min(núm, trần); không đổi thứ nằm trong cache key.
   Lớp chỉ đưa nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng).
 - Núm nào kéo lên được quá sức máy yếu thì đặt trần theo mức: `max: (env) => …` (như `value`). Thí nghiệm nặng có trần.
-- Cảnh vẽ tối đa 60 khung/giây (`createFrameCap` trong run.js): đừng thêm vòng `requestAnimationFrame` riêng để vẽ cảnh.
+- Cảnh vẽ tối đa 60 khung/giây (`engine/gpu/clock.js#createFrameCap`; GĐ 4: màn ≤ ~63 Hz không bị chặn): đừng thêm vòng
+  `requestAnimationFrame` riêng để vẽ cảnh.
+- Bộ điều chỉnh chỉ đo từ lúc live (khung ẩn và lúc hòa dần không tính). Số đo GPU vô lý thì bỏ, kể cả số lớn hơn 1,5 lần nhịp
+  khung (GPU Apple báo các pass chồng lên nhau, three cộng lại); hỏng 3 lần liền thì thôi đo cho phiên đó: mọi thứ chạy như máy
+  không đo được (Sổ tay ghi "—").
 - Số lượng theo máy (số lá, số hạt, độ phân giải…) đọc từ `ctx.budget` (bảng `quality.js` của bức), không viết cứng.
 
+### Công cụ học, Dial, poster (GĐ 4)
+- Công cụ chỉ nhìn `api.views()`, không biết bức nào. `overlay()` chỉ dựng node, không giữ trạng thái: views.js ghép lại overlay
+  khi `requireView` đổi MRT. Đổi chế độ (hình, view, vạch gạt) = đổi uniform; chọn view bằng `If` trong `Fn` (`tools/pick.js`).
+- Tap (`post.build/display({ tap })`) là biểu thức THUẦN (texture của pass, texture của bloom, uniform), không phải biến
+  `.toVar()` trong Fn: overlay tính lại nó ở lượt vẽ cuối, sau FXAA. Nhãn ở `content.layers[id].taps` (test hợp đồng giữ).
+- Cử chỉ `'hover'` (chuột di mà không bấm) chỉ tới công cụ, bức không bao giờ nhận; `g.pointer` là `'mouse'|'touch'|'pen'`.
+- `update(0, t)`: xưởng vẽ lại khung đứng yên của `?freeze` (thanh giờ, núm) bằng `setup.update(0, t)` rồi `layer.update(0, t)`.
+  Lớp đồng bộ theo uniform (hướng trăng, bóng) nhưng KHÔNG tiến mô phỏng: không compute, không bước hạt CPU.
+- Phần tử có con `position: fixed` (tay nắm gạt, ô trượt Dial trên điện thoại) không được có `transform`, `filter` hay
+  `backdrop-filter`: các thuộc tính đó biến nó thành khối chứa của con fixed, và con bị cắt hay đặt sai chỗ.
+- Poster chụp từ chính cảnh bằng `scripts/poster.js` (GPU thật); đổi thời điểm thì sửa `meta.poster.capture` rồi chạy lại.
+  `img[data-poster]` là ảnh poster; `body[data-poster]` là cờ `?poster` (CSS ẩn mọi UI trừ canvas).
+
 ### Chuyển động và ngẫu nhiên
 - Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
 - Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).
@@ -133,8 +160,10 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 
 ## Gỡ lỗi nhanh
 - Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?debug=stats`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`,
-  `?level=cao|vua|thap` (ép mức chất lượng: xem mức thấp ngay trên máy tính).
+  `?level=cao|vua|thap` (ép mức chất lượng: xem mức thấp ngay trên máy tính), `?poster` (chỉ còn canvas).
 - `?debug` mở three.js Inspector (draw call, thời gian GPU, cây node); `?debug=stats` mở stats-gl.
 - `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`. Khi cảnh live còn có
   `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`, `__sma.stats()`
-  (draw call, ms, ms CPU), `__sma.quality()` (nấc đang hạ), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc).
+  (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (nấc đang hạ, `gpu`, nấc bị khóa `locked`), `__sma.degrade()` /
+  `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` / `__sma.setTool('kinh-mai')` (công cụ học, `null` tắt hết),
+  `__sma.dials()` / `__sma.setDial('gio', 27)` (núm của cả bức).
```

- [ ] **Step 3: Spec**

Áp vào `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:

```diff
diff --git a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
index 514ea4b..1713373 100644
--- a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
+++ b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
@@ -268,6 +268,9 @@ ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc địn
   GPU thật, ở cả 1280×800 và 390×844.
 - Bao duyệt ảnh trước và sau khi thêm chặng display.
 - Poster mới được chụp từ chính cảnh đã duyệt (§8.7). Từ GĐ 4, poster và cảnh 3D là cùng một ảnh.
+- (Dựng thử GĐ 4, `?at=2026-09-28T21:00&freeze=300`, mức cao) Trước chặng display: 57,7 / 0,32 / 10,1% ở 1280×800, 68,2 / 0,28 / 6,4% ở
+  390×844. LUT 0,6 làm sương chân trời ngả cam. Chọn `lutIntensity` 0,45, `vignette` 0,45, `grain` 0,03: 54,3 / 0,43 / 12,2% và
+  62,5 / 0,39 / 7,1%, tức nhích về phía poster cũ (33 / 0,42 / 30%) mà không bệt. Ba số nằm trong một commit riêng.
 
 ### Chi tiết sống
 - **Trăng đúng pha của đêm hôm đó**, tính từ `ctx.now`. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
@@ -497,6 +500,8 @@ Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về k
       thành `Data3DTexture` với `LinearFilter` và `ClampToEdge`.
     - Cách tính là tách tông theo độ sáng: vùng tối kéo về `canhGian`, vùng sáng về `vangLa`, màu ngả xanh kéo về `cham`. Độ sáng của
       từng điểm gần như giữ nguyên.
+    - (Dựng thử GĐ 4) Màu càng gần xám thì nhuộm càng mạnh, màu đậm (lá xanh, nhị vàng) chỉ nhuộm nhẹ; màu tối mà ngả lam (trời
+      đêm) nhuộm chàm thay cho cánh gián, để trời chàm không ngả nâu.
     - Test khóa **tính chất**, không khóa công thức:
       - đen vẫn đen, trắng vẫn gần trắng;
       - độ sáng lệch ít;
@@ -518,8 +523,8 @@ Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về k
   - (GĐ 4) Nhãn của tap nằm ở `content.layers['phu-bong'].taps`: 'Trước tone', 'Trước bloom'.
 - **Núm:** `bloomStrength`, `bloomRadius`, `bloomThreshold`, `toneMapping` (uniform chọn: none/AgX/ACES), `exposure`, `lutIntensity`, `grain`, `vignette`, tất cả là uniform. GĐ 0 có `bloomStrength` và `exposure`; GĐ 2 có đủ núm của chặng `build`; ba núm cuối đi cùng chặng `display` ở GĐ 4.
   - (GĐ 2) `bloom()` giữ nguyên node được truyền vào làm strength/radius/threshold, nên ba núm bloom là uniform thật.
-  - (GĐ 4) Khoảng giá trị: `lutIntensity` 0–1, `grain` 0–0,15, `vignette` 0–1. Số mặc định chốt ở lượt màu GĐ 4 (§5). Nhãn thêm vào
-    content của lớp dùng chung.
+  - (GĐ 4) Khoảng giá trị: `lutIntensity` 0–1, `grain` 0–0,15, `vignette` 0–1. Số mặc định chốt ở lượt màu GĐ 4 (§5): 0,45 / 0,03 /
+    0,45. Nhãn thêm vào content của lớp dùng chung.
 - **Nấc:** `bloom` nhân `resolutionScale` hiện tại với 0.5 (mặc định lấy `ctx.budget.bloom ?? 0.5`).
   (GĐ 3) `BloomNode` đọc `resolutionScale` và đặt lại cỡ render target mỗi khung (Phụ lục A.36), nên nấc này không biên dịch lại.
 - **Phá:** *"Bloom cả khung vs chọn lọc"* (bloom lên cả output thì ảnh bết), *"Tắt tone mapping"*, thanh trượt so sánh trước/sau.
@@ -554,6 +559,9 @@ Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về k
   1. gọi `requireView` trước;
   2. hiện "đang mài…" trong một vùng `aria-live`;
   3. xong rồi mới đổi `uLensMode`.
+
+  Khi một công cụ đang bật, thơ và con dấu ở chân tranh ẩn đi (`visibility: hidden`, vẫn giữ chỗ) để nhường chỗ cho thanh điều
+  khiển; tắt công cụ thì hiện lại.
 - (GĐ 4) **Cử chỉ:** kính chỉ giữ cú chạm và cú giữ của ngón tay hay bút (`g.pointer !== 'mouse'`). Trên máy tính, bấm chuột dưới kính
   vẫn tạo gợn sóng như thường.
 - (GĐ 4) **`requireView('normal')`**, theo thứ tự:
@@ -663,6 +671,7 @@ son-mai-anh-sang/
         pipeline.js                  [0→4] scene pass + MRT; build → renderOutput → display; alpha 1; views(); overlay
         views.js                     [4] danh sách view (kênh, tap, Normal lười), ghép overlay của công cụ, requireView
         gpu-timer.js                 [4] ms GPU mỗi khung: resolveTimestampsAsync (render + compute), không chờ, không gọi chồng
+        meter.js                     [4] số đo của bàn thợ: draw call, tam giác, ms, ms CPU, ms GPU; hai bên "Tắt / Bật" của compare
         toolbox.js                   [4] hộp đồ nghề: gắn công cụ, cử chỉ tới công cụ trước bức, mỗi lúc một công cụ, body[data-tool]
         dial-set.js                  [4] Dial của bức: đọc/ghi (kẹp min/max/step), chữ giá trị, ghi chú, snapshot
         clock.js                     [3→4] đồng hồ + trần 60 khung/giây; GĐ 4: màn ≤ ~63 Hz không bị bỏ khung nào
@@ -682,6 +691,7 @@ son-mai-anh-sang/
       tools/
         index.js                     [4] [kinhMai, lotLop]; thêm công cụ = thêm 1 dòng
         kinh-mai.js lot-lop.js       [4] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ
+        pick.js                      [4] chọn một view theo chỉ số bằng If/ElseIf (hai công cụ dùng chung)
     lib/                             HỘP MÀU: hàm "lá", chỉ trả SỐ
       random.js                      [0] PRNG có hạt giống (mulberry32)
       astro/lunar.js                 [0] âm lịch Hồ Ngọc Đức (tz tham số, mặc định +7); canChiIndex
@@ -726,6 +736,7 @@ son-mai-anh-sang/
     helpers/source.js                [0] phân tích mã bằng parseSync của vite
     helpers/fake-ctx.js              [1→2] Scene/Camera/uniform thật, renderer giả (Proxy ghi lời gọi); dựng ctx bằng createCtx của xưởng
     helpers/svg.js                   [2] đọc mã màu trong SVG (poster, sơ đồ)
+    helpers/image.js                 [4] đọc cỡ ảnh WebP, JPEG từ phần đầu file (poster, og)
   e2e/
     helpers.js                       [0] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU
     painting.spec.js                 [0→4] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại; GĐ 4: mài về cốt, Kính mài, Lột lớp, ?poster
@@ -1299,7 +1310,14 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
 - Sau mỗi `render()`, nếu không có lần resolve nào đang dở thì gọi `resolveTimestampsAsync('render')` và `('compute')`, không chờ kết
   quả. Hai số cộng lại thành ms GPU của một khung.
 - Mẫu đến trễ vài khung và không đều. Cửa sổ 2 giây vẫn đủ mẫu.
-- Máy được coi là "đo được" khi đã có ít nhất một mẫu hữu hạn và lớn hơn 0.
+- Máy được coi là "đo được" khi đã có ít nhất một mẫu hợp lệ: hữu hạn, lớn hơn 0, và không lớn hơn 1,5 lần nhịp khung trung bình
+  của mẻ đó (`GPU_PLAUSIBLE`).
+  - Mỗi lần hỏi, three gom các khung đã vẽ từ lần hỏi trước thành một mẻ, rồi trả tổng thời gian các pass của khung cuối mẻ. GPU
+    vẽ lần lượt từng pass thì không thể bận lâu hơn nhịp khung.
+  - (Dựng thử GĐ 4) GPU Apple trên Chrome báo thời lượng các pass chồng lên nhau: 16 pass, mỗi pass khoảng 10 ms, kể cả các lượt
+    bloom rất nhỏ. three cộng lại thành khoảng 160 ms cho một khung 16,7 ms (Phụ lục A.48). Luật 1,5 lần loại các số đó, nên trên
+    GPU Apple việc đo thôi sau 3 mẫu, và bộ điều chỉnh đi đường nhịp.
+  - Máy nặng lên đột ngột (bật một thí nghiệm nặng) chỉ lệch một mẫu, vì mẻ sau đã đo theo nhịp mới.
 
 **Phân loại một cửa sổ** (`engine/tuner.js`), khi cửa sổ có từ 3 mẫu GPU trở lên. Tải = max(trung vị ms GPU, trung bình ms CPU):
 - **Quá tải:** trung bình nhịp > ngân sách × 1,05 **và** tải > ngân sách × 0,85, tức máy là nút cổ chai.
@@ -1313,9 +1331,11 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   theo tải. Vì vậy các nấc đã hạ trước đó được trả lại dần khi máy dư, không phải chờ hết khóa.
 - **Chế độ canh** (Sổ tay mở) giữ như GĐ 3: chỉ hạ khi tải > ngân sách × 2,2, không bao giờ nâng.
 - **Dùng chung với đường nhịp của GĐ 3:** cửa sổ, khởi động, bỏ cửa sổ khi giật, chống dao động, khóa nấc.
-- Các ngưỡng 0,5 / 0,6 / 0,85 chỉ là số khởi đầu. Chúng được chốt khi đo trên GPU thật lúc dựng thử.
+- Các ngưỡng 0,5 / 0,6 / 0,85 vẫn là số khởi đầu. Máy dựng thử (GPU Apple) không cho số dùng được. Trên SwiftShader mọi phép vẽ
+  chạy trên CPU, nên ms GPU gần bằng nhịp khung (khoảng 300 ms). Việc kiểm các ngưỡng trên một máy Windows hay Linux có GPU thật
+  nằm trong mục kiểm tra thủ công (§12). Nếu lệch nhiều thì sửa số trong `TUNER` (`engine/tuner.js`), test sửa theo.
 
-**Không đo được** (Safari, nhiều điện thoại, WebGL2 không có extension): chạy y hệt GĐ 3.
+**Không đo được** (Safari, nhiều điện thoại, WebGL2 không có extension, GPU Apple trên Chrome vì số chồng nhau): chạy y hệt GĐ 3.
 
 **Kèm theo:**
 - `quality()` có thêm `gpu` (đo được hay không) và `locked`.
@@ -1323,7 +1343,8 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
 - `quality.js` chỉ còn chọn mức và ghép ngân sách. Bộ điều chỉnh tách sang `engine/tuner.js`, vẫn là hàm thuần, không three.
 
 **(GĐ 4) Sửa các lỗi còn lại của bộ điều chỉnh GĐ 3:**
-- **Trần 60 khung/giây bỏ nhầm khung.** Trên các màn "60 Hz" thật ra chạy 60,02–60,1 Hz, cứ 1–5 giây lại bỏ một khung.
+- **Trần 60 khung/giây bỏ nhầm khung.** Trên các màn "60 Hz" thật ra chạy 60,02–60,1 Hz, mỗi phút bỏ 2–15 khung (đo khi dựng thử
+  GĐ 4, nhịp dao động 0–1 ms), tức hình giật một nhịp vài giây một lần.
   - Nguyên nhân: mốc "đã vẽ" tiến đúng 16,67 ms mỗi bước, còn nhịp màn hình ngắn hơn một chút. Độ lệch dồn dần, tới lúc quá 1,5 ms
     thì một khung bị bỏ.
   - Sửa: `createFrameCap` đo nhịp màn hình, bằng trung bình trượt của mọi khoảng rAF (kể cả khung bị bỏ).
@@ -1344,16 +1365,18 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - (GĐ 3) Bóng tĩnh chỉ vẽ khi có thay đổi, nên khung thường không có phần `2 × bóng`. Bức 1 đủ sáu lớp có 11 đối tượng (Cốt 6,
     trăng, đèn hoa đăng, vòm trời, mặt nước, đom đóm): `11 + 10 + 12 + 1 = 34` ở mức cao, **đo được đúng 34** trên cả WebGPU lẫn
     WebGL2; mức thấp không có phản chiếu nên đo được 24. Mục tiêu chính là **tổng ≤ 45** (e2e đo ở mức cao).
-  - (GĐ 4) FXAA vẽ chuỗi display ra một RTT, thêm 1 lượt vẽ: mức cao dự kiến 35, e2e vẫn giữ ≤ 45. Overlay của công cụ nằm trong
+  - (GĐ 4) FXAA vẽ chuỗi display ra một RTT, thêm 1 lượt vẽ: mức cao đo được 35 ở 1280×800 và 33 ở 390×844; e2e vẫn giữ ≤ 45. Overlay của công cụ nằm trong
     lượt cuối nên không thêm lượt vẽ. View Normal (`requireView`) thêm một target MRT, cũng không thêm lượt vẽ.
 - **Poster:** WebP 150 KB trở xuống (GĐ 4). `og.jpg` 1200×630, 200 KB trở xuống.
 - **JS:**
   - Chunk `three` đo được khoảng 243 KB gzip. Con số này gần như cố định, vì `three/tsl` kéo cả namespace nên không tree-shake được.
-  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,8 KB; cộng Tweakpane 328,8 KB.)
+  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,8 KB; cộng Tweakpane 328,8 KB. GĐ 4 đo được: đường 3D 306,6 KB; cộng Tweakpane 337,5 KB.)
   - Mục tiêu cho cả đường 3D: **450 KB gzip trở xuống**. Số đo ghi vào README.
   - (GĐ 4) Đồ nghề, Dial, LUT và chặng display đi cùng đường 3D; `@axe-core/playwright` chỉ là gói dev, không vào bundle.
   - Inspector (39 KB) và stats-gl (10 KB) chỉ tải khi có `?debug`.
 - **Máy yếu:** biên dịch trước bằng `scenePass.compileAsync(renderer)`, rồi vẽ một khung ẩn trong lúc poster còn hiện.
+- (GĐ 4) **Đo trên máy dựng thử** (GPU Apple, Chrome, cảnh live): đủ 60 khung/giây ở cả ba mức, ở 1280×800 (DPR 2) và 390×844
+  (DPR 3). ms CPU mỗi khung khoảng 1,2–1,8 ms.
 - **`prefers-reduced-motion`:** `CameraSpec.breathe` bị ép về 0, gợn sóng nhẹ hơn.
 
 ## 11. Âm lịch và pha trăng (`src/lib/astro/`, chỉ trả về số)
@@ -1580,7 +1603,10 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - laptop yếu (hoặc `?level=cao` trên máy yếu) không kẹt ở 30 fps;
   - Energy Saver / Low Power Mode vẫn vào "bị khóa nhịp" mà không hạ nấc;
   - màn 60,0x Hz không giật định kỳ;
-  - `__sma.quality().gpu` đúng với máy.
+  - `__sma.quality().gpu` đúng với máy;
+  - máy Windows hay Linux có GPU thật (NVIDIA, AMD, Intel) trên Chrome: ms GPU trong Sổ tay nhỏ hơn ms mỗi khung và đổi theo mức;
+    từ đó chốt ba ngưỡng 0,5 / 0,6 / 0,85 (§10);
+  - GPU Apple trên Chrome: vài giây sau khi live, `__sma.quality().gpu` là `false` và Sổ tay ghi "—" kèm lời giải thích.
 
 ## 13. Repo, CI, deploy
 
@@ -1744,6 +1770,7 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
 | ~~Đo ms GPU thật cho thí nghiệm `compare`~~ | Làm ở GĐ 4 | §10 "Bộ điều chỉnh đo được thời gian GPU": `gpu-timer.js`, cột ms GPU trong "Tắt / Bật" |
 | Trả nấc đã hạ lúc canh, khi đóng thanh lớp mà đang bị khóa nhịp (máy không đo được GPU) | Khi gặp trên máy thật | Trả dần các nấc đó khi về lại đúng nhịp bị khóa, như luật "dư" |
 | Khóa nấc chống dao động kéo dài cả phiên | Khi số đo GPU cho thấy khóa quá chặt | Mở khóa sau vài phút, hoặc khi tải GPU dư nhiều |
+| Đo GPU trên GPU kiểu tile (Apple, điện thoại) | Khi three trả thời điểm đầu/cuối của từng pass, hay khi cần đường tải trên Mac | Lấy khoảng từ lúc pass đầu bắt đầu tới lúc pass cuối xong (span của khung) thay cho tổng các pass (Phụ lục A.48). Hiện luật 1,5 lần nhịp khung tắt việc đo trên các máy này |
 | Đổi bán kính kính tròn (lăn chuột, chụm hai ngón) | Khi người xem cần | Uniform `uLensRadius` đã có, chỉ còn thiếu cử chỉ |
 | Các mục nhỏ còn lại từ PR #3: đổi cỡ khung vẽ lại bóng một lần thừa; Inspector ném lỗi trong hook khi có `?debug`; `onKnob` ném lỗi giữa chừng để lại trạng thái dở | Khi gặp | Ghi trong PR #3, phần "Để sau" |
 | Tự lùi về đom đóm CPU khi compute WebGL2 hỏng | Khi gặp máy thật lỗi | Đếm lỗi của `renderer.onError` trong vài khung đầu; quá ngưỡng thì bật biến thể CPU làm mặc định cho lần dựng đó |
@@ -1780,8 +1807,9 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
   - Logic nằm trong một hàm thuần, test bằng chuỗi khung giả cho từng tình huống; chỉ canh quá tải nặng khi Sổ tay mở; tắt khi `?freeze`.
   - Huy hiệu và `__sma.quality()` cho thấy máy đang hạ gì, nên người xem và Bao biết khi nó hạ.
 - **Máy của Bao đang tắt WebGL và dùng Node 20.** Kiểm tra `chrome://gpu`; cài Node 24 bằng fnm (§13). Tầng C giải thích cách bật lại tăng tốc phần cứng.
-- **(GĐ 4) Số đo GPU không đáng tin như nhau trên mọi máy.** Chrome làm tròn timestamp tới 0,1 ms; WebGL2 có thể báo "disjoint"; GPU
-  kiểu tile của điện thoại đo theo từng pass kém chính xác.
+- **(GĐ 4) Số đo GPU không đáng tin như nhau trên mọi máy.** Chrome làm tròn timestamp (bước 0,066 ms trên máy dựng thử); WebGL2 có
+  thể báo "disjoint"; GPU kiểu tile (Apple, điện thoại) báo thời lượng các pass chồng lên nhau, và three cộng chúng lại (Phụ lục A.48).
+  - Số lớn hơn 1,5 lần nhịp khung của mẻ là số vô lý. Trên GPU Apple, luật này làm việc đo thôi sau 3 mẫu.
   - Chỉ dùng số GPU khi một cửa sổ có từ 3 mẫu hữu hạn trở lên, và lấy trung vị. Số vô lý thì bỏ; hỏng liền thì tắt đo cho phiên đó.
   - Máy không đo được thì đi đường nhịp của GĐ 3, vốn đã test kỹ.
   - E2e trên SwiftShader không kiểm được số GPU thật. Bù lại có project GPU thật ở máy local, và mục kiểm tra thủ công.
@@ -1938,3 +1966,30 @@ Các mục dưới đây đã được kiểm bằng ba cách:
     - Vì vậy node đứng SAU `fxaa` (overlay của công cụ) chạy ở lượt cuối, và phải tự lấy mẫu các view từ texture của chúng.
 43. **`packNormalToRGB(n) = n × 0,5 + 0,5`** (đọc mã nguồn r186, GĐ 4): hàm này thay `directionToColor` (deprecated từ r185; gọi hàm cũ thì
     có cảnh báo "renamed").
+44. **Đổi MRT lúc chạy** (`requireView('normal')`; kiểm bằng e2e trên WebGL2 và WebGPU SwiftShader, và GPU thật, GĐ 4):
+    `scenePass.setMRT(mrt có thêm 'normal')` TRƯỚC, rồi mới `getTextureNode('normal')`. Render target nhận thêm ảnh ở lần vẽ
+    sau, và mọi material biên dịch lại một lần: khoảng 0,17 giây trên GPU Apple, 0,4 giây trên WebGL2 SwiftShader. Gọi
+    `getTextureNode` cho kênh chưa có trong MRT thì `getTexture()` đã thêm ảnh vào target; target có nhiều ảnh hơn số đầu ra của
+    shader là vỡ. Vì vậy view Normal dùng node giữ chỗ tới lúc đó.
+45. **`screenCoordinate` có gốc ở góc trên trái trên cả hai backend** (đọc mã nguồn `ScreenNode`, kiểm bằng ảnh, GĐ 4): WebGL lật
+    trục y theo `screenSize`. Kính mài đổi NDC của con trỏ (y hướng lên) thành `(x/2 + 0,5, 0,5 − y/2)`.
+46. **`If` trong một `Fn` gọi ngay** (kiểm khi dựng thử GĐ 4): nhánh trả giá trị (`() => x.assign(…)`) làm three cảnh báo
+    "Return statement used in an inline 'Fn()'". Viết thân nhánh trong ngoặc nhọn.
+47. **FXAA và phép trộn cùng đọc một RTT** (đo bằng e2e, GĐ 4): `convertToTexture(node)`, rồi `mix(rtt, fxaa(rtt), k)`. Lượt cuối
+    không tính lại cả chuỗi display. Mức cao đo được 35 draw call (34 + 1 lượt vẽ RTT).
+48. **Đo GPU trên máy thử** (đo bằng Playwright trên GPU thật và SwiftShader, dựng thử GĐ 4): WebGPU trên GPU Apple có
+    `timestamp-query`, nhưng thời lượng các pass chồng lên nhau. Một khung ở 1280×800 (DPR 2, mức cao) có 16 pass; pass nào cũng báo
+    10–12 ms, kể cả các lượt bloom rất nhỏ, trong khi cảnh vẫn chạy đủ 60 khung/giây. `resolveTimestampsAsync('render')` trả
+    **tổng các pass của khung cuối** (`framesDuration` của `WebGPUTimestampQueryPool`), nên ra khoảng 160 ms. Timestamp được làm tròn
+    theo bước 0,066 ms. WebGL2 và WebGPU trên SwiftShader cũng báo số, khoảng 300 ms mỗi khung, gần bằng nhịp khung, vì mọi phép vẽ
+    chạy trên CPU. Mẫu đầu tiên sau live lớn hơn nhiều (khung đầu còn biên dịch pipeline); ms GPU của Sổ tay là trung bình trượt, nên
+    giảm dần về số thật trong vài chục mẫu, như ms mỗi khung.
+49. **OrbitControls tự gọi `update()` khi rê** (đọc mã nguồn, kiểm bằng e2e, GĐ 4): camera đổi ngay cả khi vòng lặp đã dừng ở
+    `?freeze`, nhưng canvas chỉ đổi ở lần vẽ lại kế tiếp. E2e sương xoáy ép vẽ lại, để so hai cú kéo có cùng một camera.
+50. **Mã hóa ảnh ngay trong trang** (`scripts/poster.js`, GĐ 4): `canvas.toBlob('image/webp', q)` của Chromium ra WebP dạng
+    `VP8 ` (nén mất dữ liệu). Poster 1600×1000 của Bức 1 nặng 142 KB ở q 0,88; og JPEG q 0,85 nặng 86 KB.
+51. **Chromium giao `pointermove` theo nhịp khung** (đo bằng Playwright trên WebGL2 SwiftShader, dựng thử GĐ 4): các sự kiện rê
+    được gộp lại và giao ngay trước `requestAnimationFrame`, còn `pointerdown`/`pointerup` giao ngay. GPU phần mềm còn dồn việc vẽ
+    lại (năm lần `setWeight`, mỗi lần một lần vẽ) thì khung chậm: một cú vuốt 3 bước bị giãn từ khoảng 140 ms lên hơn 500 ms, thành
+    cú kéo. E2e sương xoáy vì vậy gộp các `setWeight` vào một nhịp, rồi đợi 4 khung trước khi vuốt. `gesture.js` đo bằng
+    `performance.now()` lúc xử lý sự kiện; trên máy thật, nhịp khung do bộ điều chỉnh giữ, nên độ giãn chỉ chừng một khung.
```

- [ ] **Step 4: Commit**

Run: `npm test` (xanh, `Tests  678 passed`).

```bash
git add CLAUDE.md README.md docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -F - <<'EOF'
docs: README, CLAUDE.md và spec theo GĐ 4 (đồ nghề, thanh giờ, poster; đo GPU và trường hợp GPU Apple; số đo thật; Phụ lục A.44–51)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 22: Nghiệm thu: review toàn nhánh, PR, CI; kiểm trên máy thật

**Mục tiêu:** Nhánh sẵn sàng merge. Hai reviewer độc lập đã đọc toàn nhánh, CI xanh, ảnh lượt màu và poster nằm trong PR. Việc kiểm trên máy thật được giao rõ cho Bao.

**Files:** những file mà review yêu cầu sửa (mỗi sửa một commit, kèm test).

**Interfaces:**
- Consumes: toàn bộ nhánh.
- Produces: PR `gd4-phu-bong-kinh-mai`.

- [ ] **Step 1: Hai reviewer độc lập (chạy nền, song song)**

Gửi cho `pr-review-toolkit:code-reviewer` và `pr-review-toolkit:silent-failure-hunter` cùng một phạm vi: các commit của GĐ 4 (`git diff 3e01a7f...gd4-phu-bong-kinh-mai`), kèm spec và kế hoạch này. Nhắc hai reviewer những chỗ dễ sai:
- bộ điều chỉnh: đường tải và đường nhịp chọn theo từng cửa sổ; chế độ canh; `?freeze`;
- gpu-timer: không hỏi chồng, số vô lý, thôi đo đúng một lần, kết quả về sau `dispose`;
- `requireView`: thứ tự `setMRT` → ghép lại → biên dịch; không `getTextureNode` cho kênh chưa có;
- overlay chỉ ghép một lần (và một lần nữa khi đổi MRT); công cụ hỏng không kéo cả cảnh;
- cử chỉ: công cụ trước bức, `hover`, khung đứng yên;
- vùng `aria-live` của công cụ và Dial; `aria-pressed`, `role="slider"`;
- chặng display trộn theo trọng số (trọng số 0 là ảnh chưa phủ bóng);
- `scripts/poster.js` luôn tắt `vite preview` nó mở, kể cả khi lỗi.

- [ ] **Step 2: Sửa theo review (mỗi lỗi thật một test hỏng trước, rồi một commit), và cho reviewer đọc lại MỌI commit sửa**

Ở GĐ 2 và GĐ 3, reviewer tìm ra lỗi thật, và tìm ra cả lỗi trong lần sửa đầu tiên. Đừng push một commit sửa chưa được đọc lại. Góp ý nào không đúng thì ghi rõ lý do vào PR, không sửa cho có.

- [ ] **Step 3: Kiểm toàn bộ lần cuối**

```bash
npm test
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
```
Kết quả mong đợi: tất cả xanh (số test như Task 17, cộng test mới của các lần sửa).

- [ ] **Step 4: Push và mở PR**

```bash
git push -u origin gd4-phu-bong-kinh-mai
gh pr view 3 --json state   # PR của GĐ 3
```
- PR #3 đã merge: `gh pr create --base main --head gd4-phu-bong-kinh-mai …`.
- PR #3 còn mở: `--base gd3-suong-vang-la` (PR chồng lên PR #3). Khi Bao merge PR #3, GitHub tự đổi base của PR này về `main`.

Tiêu đề: "GĐ 4 · Phủ bóng hoàn chỉnh + Kính mài + đo GPU thật". Thân PR (tiếng Việt), gồm:
- tóm tắt GĐ 4 theo spec §14;
- chuyện GPU Apple (Phụ lục A.48) và việc kiểm đường tải trên máy khác;
- số test, e2e và kích thước bundle;
- ảnh lượt màu trước và sau (Task 19), poster và og (Task 20);
- danh sách kiểm tay của Bao (Step 6).

Dòng cuối: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: CI**

```bash
gh run watch
```
Kết quả mong đợi:
- job `build` xanh (unit, build, e2e `static` + `webgl2-swiftshader` kèm a11y): job chặn;
- job `e2e-webgpu` không chặn, nhưng mong là cũng xanh.

Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

- [ ] **Step 6: Kiểm tay (Bao, sau khi deploy; spec §12)**

- Máy Windows hay Linux có GPU thật (NVIDIA, AMD, Intel) trên Chrome: Sổ tay có ms GPU nhỏ hơn ms mỗi khung, và đổi khi đổi mức (`?level=thap`). Từ đó chốt ba ngưỡng 0,5 / 0,6 / 0,85 (`TUNER` trong `engine/tuner.js`).
- Mac (GPU Apple) trên Chrome: vài giây sau khi live, `__sma.quality().gpu` là `false`, Sổ tay ghi "—" kèm lời giải thích.
- Energy Saver (Chrome chạy pin) hay Low Power Mode (iPhone): cảnh không bị hạ dần tới mờ. Máy đo được GPU thì vào "bị khóa nhịp" mà không hạ nấc nào.
- Màn 60 Hz: không giật một nhịp định kỳ vài giây một lần.
- Điện thoại: bật Kính mài, chạm để đặt kính, giữ rồi kéo để dời; hình gạt kéo được bằng ngón tay; chạm lúc tắt kính vẫn tạo gợn sóng.
- VoiceOver (Safari trên macOS và iOS): lời mời, thanh lớp, Đồ nghề, thanh giờ và Sổ tay được đọc đúng tên và trạng thái.
- Dán link trang vào một ứng dụng chat: thẻ xem trước hiện ảnh og.
