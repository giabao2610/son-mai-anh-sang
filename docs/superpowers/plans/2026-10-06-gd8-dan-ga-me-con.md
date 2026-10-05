# GĐ 8 · Bức 4 · Đàn Gà Mẹ Con: kế hoạch thực thi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng Bức 4 · Đàn Gà Mẹ Con đúng spec §20 trên nhánh `gd8-dan-ga-me-con`, tới mức sẵn sàng merge. Gồm:
- bốn thay đổi của xưởng: camera trực giao, độ sâu đúng cho camera trực giao, tranh tự khép lại, Sổ tay hiện code của hộp màu;
- bể hạt `lib/tsl/particles.js`; Bức 1 chuyển sang mà mã shader của đom đóm không đổi;
- tờ tranh Đông Hồ sáu lớp vẽ phi hiện thực, hai cử chỉ, gà mẹ bới;
- trang, lật tranh, Phòng tranh bốn mục, poster chụp từ cảnh; mọi test và e2e xanh.

**Architecture:**
- **Luật 7.** Thư mục `src/paintings/dan-ga-me-con/`, trang do `npm run pages` sinh, một dòng registry. Xưởng chỉ thêm trường tùy chọn của
  hợp đồng, không đổi nghĩa trường cũ.
- **Camera trực giao.**
  - Phần tính của camera tách ra file mới `engine/gpu/camera.js`: dựng đúng loại camera, khớp khung, giới hạn OrbitControls. Đây là hàm
    thuần, có unit test; `stage.js` cần GPU nên không test được.
  - `stage.camera` thành getter.
  - Độ sâu tuyến tính chọn theo loại camera ở MỘT chỗ: `pipeline.js#linearDepth`.
- **Không có đèn của three.** Mọi vật tô bằng một `recipe` như Bức 3: Cốt công bố, các lớp sau bọc từng hàm TRƯỚC lần biên dịch đầu.
- **Bản nét** đọc thẳng texture độ sâu trong post, nên không thêm lượt vẽ.
  - Bậc và nếp gấp dò bằng **độ lệch khỏi mặt phẳng**: đạo hàm bậc hai theo bốn hướng, tức Laplace tách hướng.
  - Không dùng Sobel trên độ sâu. Lý do ở Task 1, Step 13.
- **Tất định.**
  - Đàn gà là hàm thuần dạng đóng theo các mốc rắc, giữ, thả, bới.
  - Thóc là mô phỏng GPU trong bể hạt, chạy lại từ khung 0 khi có `?freeze`.

**Tech Stack:** three@0.186.1 (WebGPURenderer + TSL), Vite 8, Vitest 5, Playwright 1.63, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:
- §20 (Bức 4, xưởng, bể hạt);
- cùng §0, §1, §8.1–§8.4, §12, §14–§16 và Phụ lục A.89–A.94.

Người thực thi đọc cả spec lẫn plan.

## Cách dùng plan này (đọc trước)
- **Plan gọn, theo ý Bao** (§20.10: làm thẳng trên nhánh, vừa làm vừa sửa, như GĐ 6 và GĐ 7).
  - Code đầy đủ chỉ có ở chỗ khó và ở các test. Chỗ khó gồm: camera trực giao, độ sâu, tự khép lại, dò cạnh, bể hạt và việc chuyển
    Bức 1, luật của thóc, dạng đóng của đàn gà.
  - Phần còn lại plan ghi cần dựng gì, số nào, theo mẫu nào (Bức 3, `_mau`), và kiểm ra sao.
- **Code trong plan CHƯA chạy thật.**
  - Sai thì sửa ngay trong task, và ghi một dòng `Lệch plan: …` vào thân commit.
  - Làm khác spec thì sửa spec (§20 hay Phụ lục A) trong cùng commit.
- **Ba điểm dừng:**
  - **Task 1** (luật dừng 4 điều): một điều không đạt thì DỪNG, báo Bao, kèm đường lùi của §20.11.
  - **Task 2** (luật dừng của fixture): sau khi rút bể hạt, mã của đom đóm khác fixture thì DỪNG và báo Bao. Đường lùi: Bức 1 giữ code cũ,
    chỉ Bức 4 dùng bể chung.
  - **Task 4** (duyệt ảnh): DỪNG, gửi Bao trang ảnh. Chờ Bao duyệt rồi mới làm Task 5.
- **Task nào cũng đi đủ năm bước:**
  1. viết test trước, chạy cho thấy đỏ;
  2. làm cho xanh;
  3. chạy thật (lệnh e2e ghi trong task);
  4. chạy `npm test` cả bộ, phải xanh;
  5. commit, với email cá nhân và dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Trước khi bắt đầu
- **Node 24.** `node -v` phải ra `v24.x`. Máy của Bao chỉ có Node 20 (`/usr/local/bin/node`) và không có fnm. Dùng bản portable trong
  scratchpad, không sửa `~/.zshrc`:

  ```bash
  SP=<scratchpad của phiên>
  test -x "$SP/node-v24.21.0-darwin-arm64/bin/node" || curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz | tar -xz -C "$SP"
  export PATH="$SP/node-v24.21.0-darwin-arm64/bin:$PATH"   # đặt ở đầu MỌI lệnh npm/npx/node
  node -v                                                  # v24.21.0
  ```
- **Nhánh.** Làm trên `gd8-dan-ga-me-con`, đã có spec ở commit `13ded8a`. Trước mỗi task, `git status` phải sạch.
- **Mốc ban đầu.** Chạy `npm test` một lần trên `13ded8a`. Phải xanh; ghi số test vào sổ.
- **E2E local:**
  - SwiftShader rất nặng CPU: chạy một mình, đừng chạy cùng reviewer hay `npm test`.
  - Trước khi tin một lần hỏng vì `timeout`, xem `ps -Ao pcpu,comm -r | head`. Không tắt process của Bao.
  - Không để `vite preview --port 4273` cũ còn chạy: Playwright dùng lại server đang mở, và sẽ test nhầm `dist/` cũ.
  - GPU thật: `E2E_REAL_GPU=1 npx playwright test … --project=webgpu-real-gpu`.
- **Không push.** Push hay mở PR chỉ ở Task 13, sau khi Bao đồng ý. Merge (là deploy) thì hỏi lại Bao lần nữa.

## Global Constraints
Mọi task ngầm gồm các luật dưới đây, chép từ `CLAUDE.md` và spec. Số và tên giữ đúng như ghi.
- **Nguồn tham chiếu:**
  - Chỉ TSL, `three@0.186.1`.
  - Không dùng `ShaderMaterial`, `RawShaderMaterial`, `EffectComposer`, `onBeforeCompile`, và các API deprecated (`PostProcessing`,
    `renderAsync`, `label()`, `PCFSoftShadowMap`…).
- **Viết TSL:**
  - Không dùng `select()` cho nhánh có node dùng chung: dùng `Fn` + `.toVar()` + `If`.
  - TSL không có `atan2`: dùng `atan(y, x)`, cộng `EPS` vào x khi cả hai có thể bằng 0.
  - Nhánh của `If` trong một `Fn` gọi ngay không trả giá trị: viết `() => { x.assign(…); }`.
- **Hàm có miền xác định hẹp:**
  - `smoothstep(a, b, x)` luôn có **a < b hẳn**. Ngưỡng do núm đặt thì núm có `min` > 0, hay cộng `EPS`.
  - `pow` chỉ dùng với cơ số chắc chắn ≥ 0; lũy thừa 2, 3, 4 viết bằng `pow2`, `pow3`, `pow4`.
  - `sqrt` chỉ nhận `max(x, 0)`.
- **Tên uniform** (`setName`) là định danh hợp lệ: `/^[A-Za-z_][A-Za-z0-9_]*$/`. File trong `lib/` không đặt tên uniform: một bức có thể
  dựng hai bể.
- **Material lúc chạy:**
  - Không đặt số lên material lúc chạy: mọi thứ đổi theo trọng số, núm, thí nghiệm hay nấc đi qua uniform.
  - Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled` lúc chạy. Bức 4 KHÔNG bật `shadowMap` và không có đèn nào của three.
  - Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`.
  - Mọi phần màu trộn theo trọng số của lớp sở hữu nó, nên mọi trọng số bằng 0 thì về đất sét (`datSet`).
- **Material của mesh** là lớp gốc `NodeMaterial` (`lights = false` mặc định: màu ra là `colorNode` cộng emissive). Thóc dùng
  `SpriteNodeMaterial`.
- **Camera trực giao** (Phụ lục A.89–A.94):
  - Hướng nhìn trong shader lấy từ `positionViewDirection`, không tự tính `cameraPosition − positionWorld`.
  - Trong post, `cameraNear`, `cameraFar` của TSL là của camera vẽ quad: số của camera cảnh đi qua uniform đặt từ JS.
  - Thứ gì tính theo loại camera thì chọn bằng JS lúc dựng.
- **Ngẫu nhiên và thời gian:**
  - Không dùng `Math.random`: dùng `src/lib/random.js` (`mulberry32`).
  - Không dùng `time`/`deltaTime` của TSL: dùng `ctx.u.time`, `ctx.u.delta`.
  - Chuyển động theo cử chỉ tính thẳng từ thời gian (dạng đóng), để `update(0, t)` ra đúng khung N. `update(0, t)` không tiến mô phỏng:
    không compute, không rắc.
- **Thuộc tính và số lượng:**
  - Thuộc tính ghi MỖI khung (dáng gà con) dùng `instancedDynamicBufferAttribute`. Thuộc tính chỉ ghi lúc có việc thì để usage mặc định và
    đặt `needsUpdate`.
  - Số lượng đổi lúc chạy (thóc): cấp phát theo trần MỘT lần, rồi chỉ đổi `count`. Sàn là 100: sprite không bao giờ về `count` 0 hay 1.
  - Vị trí tính trong `positionNode` thì `frustumCulled = false`.
  - Mọi nhánh của `init`, `law`, `spawn` của bể hạt gán CẢ `a` lẫn `b`: WebGL2 chạy compute bằng transform feedback, ghi mọi phần tử mỗi lần
    chạy, nên nhánh không gán là ghi rác.
- **Quy ước file:**
  - Dòng 1 của mọi file `src/**/*.js` và `scripts/*.js`: `// <đường dẫn từ src/, hay từ gốc với scripts/> — <một câu tiếng Việt>`.
  - Mỗi file khoảng 250 dòng trở xuống; quá 300 là test hỏng.
  - ESM + JSDoc, tên biến tiếng Anh. Import tương đối ghi đuôi `.js`.
  - Chú thích, thông báo lỗi và chữ cho người xem viết tiếng Việt. Chữ người xem thấy chỉ nằm trong `strings.*.js`, `content.*.js` và
    các trường chữ của `meta.js`.
- **Ranh giới:**
  - Bức không import bức khác. Lớp không import `parts/` của lớp khác: cần gì thì nhận qua `shared`.
  - `meta.layers[].files` kê mọi file `parts/` mà lớp import, thẳng hay qua part khác. Từ GĐ 8, kê cả file `lib/tsl/*.js` mà lớp import.
  - `lib/` chỉ import `three` (riêng `lib/tsl`) và `lib/`. Hộp màu không biết núm, nên không có marker `// @knob`.
- **Hàng rào từ vựng** của Bức 4 (`meta.fence`): `chick`, `poultry`, `rooster`, `gà mẹ`, `gà con`, `thóc`, `con ong`, `đông hồ`, `điệp`,
  `bản nét`, `bản màu`, `lá tre`. Xưởng (`src/engine/`, `src/ui/`, `src/lib/tsl/`) không được chứa từ nào trong số này.
  - Không rào `hen` (chuỗi con của `denThen`), `grain` (núm của Phủ bóng).
  - Không rào tên kỹ thuật: `ink`, `paper`, `outline`, `toon`, `cel`, `sobel`, `ortho`.
- **Id là API công khai từ lúc deploy:**
  - Slug `dan-ga-me-con`.
  - Lớp: `cot`, `ban-mau`, `ban-net`, `giay-diep`, `dan-ga`, `phu-bong`.
  - Tên vật: `giay`, `ga-me`, `ga-con`, `thoc`.
  - Núm, thí nghiệm, số đo, nấc: như các task ghi.
- **Chữ của Sổ tay:**
  - `understand` ≤ 150 chữ (đếm theo khoảng trắng); `readMore` chỉ https.
  - Có nhãn cho MỌI núm, thí nghiệm, số đo, vật và tap.
  - Sơ đồ SVG có `<title>` và chỉ dùng màu của bảng đã ghép.
- **Commit:** `Bao Nguyen <giabao261096@gmail.com>` (đã cấu hình trong repo). Không sửa git config global.

## Review Focus
Năm nhóm đầu vào mà spec ngụ ý nhưng test của từng task dễ bỏ sót, xếp từ dễ gặp nhất. Mỗi dòng đã có test ở task sở hữu nó.
1. **Chạm dồn và chạm lúc khung đứng:**
   - hai mươi lần chạm trong một giây;
   - chạm khi `?freeze` đã dừng vòng lặp;
   - chạm lên vách, ra ván, sát mép sàn;
   - `handful` 300 khi `count` chỉ 100.

   Kỳ vọng: mọi hạt nằm trong sàn và có vị trí hữu hạn; vòng đệm quấn đúng; hàng đợi có trần; `rac` không vượt số hạt đang tính. Test:
   Task 2 (unit `particles`: quấn, trần hàng đợi, nắm lớn hơn bể), Task 8 (unit cử chỉ: điểm ngoài sàn), Task 7 (unit "bão chạm").
2. **Giữ và thả lệch nhau:**
   - giữ hai lần liền; thả khi chưa giữ;
   - rắc trong lúc giữ; giữ khi gà đang chạy tới hay đang mổ;
   - mốc có thời điểm lùi.

   Kỳ vọng: vị trí liên tục; không hai con một chỗ núp; mọi số hữu hạn; cuối cùng ai về nhà nấy. Test: Task 7 (unit "bão giữ thả" bằng
   PRNG có hạt giống).
3. **Khung hẹp và zoom ở hai đầu:**
   - 390×844 (nới theo `minWidth`), khung 100×800 (chạm trần 4 lần);
   - zoom 1 và 2,5 khi tranh tự khép lại;
   - đổi cỡ cửa sổ trong lúc camera đang quay về.

   Kỳ vọng: tờ tranh vừa bề ngang; camera về đủ góc và zoom; không nhảy khung. Test: Task 1 (unit `fitOrtho`, `fitCamera` giữ zoom), Task 3
   (unit `home` về zoom, resize giữa chừng), Task 4 (ảnh điện thoại dọc ở điểm duyệt ảnh).
4. **Núm ở hai đầu:**
   - Bản nét: `lineWidth` 0,5 và 3; `threshold` 0,05 và 2; `crease` 0 và 1; `misregister` 0 và 6.
   - Bản màu: `bands` 1 và 4; `edge` 0.
   - Giấy điệp: `density`, `sparkle` ở min và max.
   - Đàn gà: `gravity` cả hai lựa chọn.

   Kỳ vọng: biên dịch được ở hai backend, không NaN, không khung đen. Test: unit "biên dịch ở núm biên" của Task 4, 5, 6, 8; e2e
   `misregister` 6 ở Task 5.
5. **Trọng số lệch nhau:**
   - Bản màu 0 mà Bản nét 1 (nét trên đất sét);
   - Giấy điệp 1 mà Bản màu 0;
   - Đàn gà về 0 khi thóc đang rơi, và chạm lúc Đàn gà bằng 0;
   - Phủ bóng 0 với giấy sáng.

   Kỳ vọng: ảnh hợp lý, mọi trọng số 0 thì về đất sét, không lỗi console. Test: e2e chung "mài từng lớp", e2e Task 5, 6, 8; unit Task 8
   (chạm lúc trọng số 0 thì không rắc, không dồn hàng đợi).

## Bản đồ file
| File | Task | Việc |
|---|---|---|
| `src/engine/gpu/camera.js` | 1 | dựng camera theo `CameraSpec` (phối cảnh hay trực giao), khớp khung, giới hạn OrbitControls |
| `src/engine/gpu/fov.js` | 1 | thêm `fitOrtho` |
| `src/engine/gpu/stage.js` | 1 → 3 | `useCamera` dùng `camera.js`; `stage.camera` là getter; Task 3: `returnHome(dt)` |
| `src/engine/gpu/pipeline.js`, `views.js` | 1 | `linearDepth(scenePass, camera)`; view Depth dùng chung chỗ đó |
| `src/engine/gpu/home.js` | 3 | tranh tự khép lại: hàm thuần + bộ đếm giờ trên OrbitControls |
| `src/engine/gpu/scene.js` | 3 | gọi `stage.returnHome(dt)` trước `controls.update()` |
| `src/engine/contracts/runtime.js`, `painting.js` | 1, 2 | JSDoc: `CameraSpec` mới (§8.4); `LayerMeta.files` kê được `lib/tsl` (§8.3) |
| `src/lib/tsl/particles.js` | 2 | bể hạt compute dùng chung |
| `src/ui/code-view.js` | 2 | glob thêm `../lib/tsl/*.js` |
| `src/paintings/ao-sen-dem/layers/l5-vang-la.js`, `meta.js` | 2 | đom đóm dùng bể chung; Vàng lá kê `lib/tsl/particles.js` |
| `src/paintings/dan-ga-me-con/{meta,index,painting,quality,content.vi}.js` | 1 (sửa ở 3–11) | căn cước, lớp, camera, bảng chất lượng, chữ |
| `src/paintings/dan-ga-me-con/shared.js` | 8 | `setup()`: đàn gà (mốc), cử chỉ, gà mẹ bới |
| `parts/cot-bo-cuc.js` | 1 → 7 | bố cục, góc nhìn của tranh, `floorPoint`, `viewAngle` (hàm thuần) |
| `parts/cot-giay.js` | 1 | tờ giấy cong: lưới, UV theo chiều dài cung |
| `parts/cot-hinh-ga.js` | 1 → 4 | hình gà ghép từ khối, thuộc tính `part`, `positionNode` (đầu, cánh, chân, tấm bìa) |
| `layers/l1-cot.js` | 1 → 4 | lớp Cốt, `recipe`, số đo `goc` (Task 3), thí nghiệm `biaPhang` (Task 4) |
| `layers/l2-ban-mau.js` + `parts/ban-mau-bang.js` | 4 | màu in, chia nấc |
| `layers/l3-ban-net.js` + `parts/ban-net-do-canh.js` | 1 → 5 | viền dò trên độ sâu; Task 5: lệch bản, mực không đều, hai thí nghiệm |
| `parts/ban-net-net-trong.js` | 5 | nét trong (vảy lông, mắt, cánh) |
| `layers/l4-giay-diep.js` + `parts/giay-diep-mat.js` | 6 | sợi dó, vệt chổi, hạt điệp |
| `parts/dan-ga-song.js` | 7 | đàn gà dạng đóng (hàm thuần) |
| `layers/l5-dan-ga.js` + `parts/dan-ga-thoc.js` | 8 | thóc trên bể hạt, áp dáng đàn gà, mảng mỏ |
| `diagrams/*.svg` | 10 | năm sơ đồ tab Hiểu |
| `src/paintings/registry.js` | 1 | dòng Bức 4 |
| `tranh/dan-ga-me-con/index.html`, `tranh/cung-que/index.html`, `tranh/index.html` | 1 | sinh bằng `npm run pages` |
| `public/paintings/dan-ga-me-con/poster.webp`, `og.jpg` | 1 (chụp lại ở 11) | poster và ảnh og, chụp từ cảnh |
| `tests/unit/{camera,home,particles}.test.js` | 1, 3, 2 | unit mới của xưởng và hộp màu |
| `tests/unit/{fov,pipeline,views,input,caption-set,scene}.test.js` | 1, 3 | thêm trường hợp camera trực giao, tự khép lại |
| `tests/helpers/{nodes,fake-ctx}.js` | 2, 1 | `compileCompute`; camera dựng theo `painting.camera` |
| `tests/paintings/contract.test.js`, `tests/rules/imports.test.js` | 1, 2 | camera đúng hình dạng; file `lib` được kê thì phải được import; tự kiểm hàng rào |
| `tests/paintings/ao-sen-dem/vang-la-ma.test.js` + `__fixtures__/` | 2 | mã shader của đom đóm giống bản ghi trước khi rút |
| `tests/paintings/dan-ga-me-con/*.test.js` | 1 → 9 | unit của Bức 4 |
| `e2e/dan-ga-me-con.spec.js` | 1 → 9 | e2e riêng của Bức 4 |
| `e2e/lat-tranh.spec.js` | 1 | Bức 3 ⇄ Bức 4 |
| `README.md`, `CLAUDE.md`, spec | 12 | tài liệu khớp code |

---

### Task 1: Camera trực giao, độ sâu đúng, Bản nét dò cạnh trên một Bức 4 khung (task rủi ro nhất, LUẬT DỪNG)

**Mục tiêu:**
- Xưởng dựng được camera trực giao từ `CameraSpec` (`kind: 'ortho'`, `height`, `minWidth`, `zoom`), với độ sâu tuyến tính đúng cho nó ở
  `channel('depth')` và view Depth.
- Bức 4 vào registry với ba lớp:
  - Cốt: tờ giấy cong, gà mẹ và mười gà con bằng khối thô (mình, đầu);
  - Bản nét: chỉ có viền dò trên độ sâu;
  - Phủ bóng.
- Chứng minh bốn điều của luật dừng (§20.10).

**Files:**
- Create:
  - `src/engine/gpu/camera.js`, `tests/unit/camera.test.js`;
  - `src/paintings/dan-ga-me-con/{meta,index,painting,quality,content.vi}.js`;
  - `src/paintings/dan-ga-me-con/layers/{l1-cot,l3-ban-net}.js`;
  - `src/paintings/dan-ga-me-con/parts/{cot-bo-cuc,cot-giay,cot-hinh-ga,ban-net-do-canh}.js`;
  - `tests/paintings/dan-ga-me-con/{cot-bo-cuc,cot,ban-net}.test.js`;
  - `e2e/dan-ga-me-con.spec.js`.
- Modify:
  - `src/engine/gpu/{fov,stage,pipeline,views}.js`, `src/engine/contracts/runtime.js` (khối `CameraSpec` chép từ spec §8.4);
  - `src/paintings/registry.js` (dòng Bức 4);
  - `tests/unit/{fov,pipeline,views,input,caption-set}.test.js`;
  - `tests/paintings/contract.test.js`, `tests/helpers/fake-ctx.js`, `tests/rules/imports.test.js`;
  - `e2e/lat-tranh.spec.js`.
- Sinh lại bằng `npm run pages`: `tranh/dan-ga-me-con/index.html` (mới), `tranh/cung-que/index.html` (link "Bức 4 · …"), `tranh/index.html`
  (bốn mục).
- Create (chụp): `public/paintings/dan-ga-me-con/poster.webp`, `og.jpg` (poster tạm, chụp lại ở Task 11).

**Interfaces:**
- Produces:
  - `engine/gpu/fov.js#fitOrtho(spec, aspect) → number`: bề cao khung nhìn ở zoom 1.
  - `engine/gpu/camera.js`:
    - `NEAR = 0.1`, `FAR = 500`, `isOrtho(spec) → boolean`;
    - `createCamera(spec, aspect) → PerspectiveCamera | OrthographicCamera`: đặt ở `spec.position`, nhìn `spec.target`;
    - `fitCamera(camera, spec, aspect)`;
    - `limitControls(controls, spec, reducedMotion)`.
  - `engine/gpu/pipeline.js#linearDepth(scenePass, camera) → node`. `createViews({ …, depth })` nhận node đó.
  - `stage.camera` là getter: đọc SAU `stage.useCamera(spec)`.
  - `parts/cot-bo-cuc.js` (JS thuần, không import three):
    - hằng số: `PAPER`, `FLOOR`, `SUN`, `HEN`, `HOMES`, `CAMERA`;
    - `floorPoint(ray) → [x, z]`.
  - `parts/cot-giay.js`: `PAPER_LENGTH`, `profile(s) → { y, z, ny, nz }`, `paperGeometry() → BufferGeometry` (UV theo đơn vị cảnh:
    `u = x + 7`, `v = s`).
  - `parts/cot-hinh-ga.js`: `PART`, `henGeometry({ segments })`, `chickGeometry({ segments })`, `piece(geometry, part)`.
  - `shared.cot`, lớp sau đọc:

    ```js
    shared.cot = {
      recipe,          // công thức tô, các lớp sau bọc từng hàm (dưới đây)
      muc,             // node màu mực (bản nét)
      sun,             // vec3 node: hướng nắng (đơn vị)
      floor: FLOOR,    // sàn phẳng mà thóc nằm được
      pixel,           // uniform: đơn vị cảnh của một điểm ảnh thiết bị; Cốt đặt mỗi khung (khung nhìn / zoom / số điểm ảnh dọc)
      paper,           // Mesh tờ giấy
      hen,             // { group, body } (Task 4 thêm wingL, wingR và các uniform dáng)
      chicks,          // { mesh, pose, head } (Task 4: pose, head là InstancedBufferAttribute ghi mỗi khung)
    };
    ```

    `recipe` (spec §20.4). `s = { kind, part, n, uv, pos, pigment }`: `kind` là chuỗi JS chọn lúc dựng (`'giay' | 'ga' | 'thoc'`); còn lại là
    node (`part` float, `n` pháp tuyến thế giới, `uv`, `pos` vị trí thế giới, `pigment` float, −1 nếu không có):

    ```js
    recipe = {
      base: (s) => vec3,   // Cốt: đất sét dưới đèn xưởng
      fill: (s) => vec3,   // Cốt: recipe.base(s). Bản màu bọc: mix(trước, màu in × nấc sáng, w_ban_mau)
      ink: (s) => float,   // Cốt: float(0). Bản nét bọc: max(trước, nét trong × w_ban_net)
      paper: (s) => vec3,  // Cốt: recipe.base(s). Giấy điệp bọc: mix(trước, giấy điệp, w_giay_diep)
      glint: (s) => vec3,  // Cốt: vec3(0). Giấy điệp bọc: hạt điệp × w_giay_diep (emissive)
    };
    // Cốt ghép: tờ giấy → paper(s); gà, thóc → mix(fill(s), muc, ink(s)). Emissive: tờ giấy → glint(s); còn lại vec3(0).
    ```

    Mỗi lớp tự trộn theo trọng số của nó khi bọc. Vì vậy mọi trọng số bằng 0 thì về `base` (đất sét).
  - `parts/ban-net-do-canh.js#depthEdges({ depth, span, px, offset, threshold, crease, pixel }) → float` (độ phủ của nét, 0–1).

- [ ] **Step 1: Test `fitOrtho` (đỏ trước)** — thêm vào `tests/unit/fov.test.js`:

```js
import { fitFov, fitOrtho } from '../../src/engine/gpu/fov.js';

describe('fitOrtho (GĐ 8)', () => {
  const spec = { height: 12, minWidth: 15.5 };
  it('bức không khai báo minWidth: luôn là height', () => {
    for (const aspect of [0.3, 390 / 844, 1, 1.6, 3]) expect(fitOrtho({ height: 12 }, aspect)).toBe(12);
  });

  it('khung đủ rộng: giữ height (máy tính 16:10 thấy 19,2 ≥ 15,5)', () => {
    expect(fitOrtho(spec, 1.6)).toBe(12);
    expect(fitOrtho(spec, 15.5 / 12)).toBe(12);
  });

  it('khung hẹp (điện thoại dọc): nới bề cao để bề ngang thấy đúng minWidth', () => {
    const aspect = 390 / 844;
    expect(fitOrtho(spec, aspect) * aspect).toBeCloseTo(15.5, 9);
  });

  it('khung hẹp bất thường thì có trần 4 lần height; tỉ lệ khung không hợp lệ thì giữ height', () => {
    expect(fitOrtho(spec, 0.05)).toBe(48);
    for (const aspect of [0, -1, NaN, Infinity]) expect(fitOrtho(spec, aspect)).toBe(12);
  });
});
```

- [ ] **Step 2: Test `camera.js` (đỏ trước)** — `tests/unit/camera.test.js`:

```js
// tests/unit/camera.test.js — camera của sân khấu theo CameraSpec (GĐ 8): phối cảnh như cũ khi thiếu kind; trực giao có khung nhìn đúng tỉ lệ, giữ zoom khi khớp khung; giới hạn OrbitControls theo loại camera.
import { describe, it, expect } from 'vitest';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three/webgpu';
import { FAR, NEAR, createCamera, fitCamera, isOrtho, limitControls } from '../../src/engine/gpu/camera.js';

const PERSPECTIVE = {
  position: [0, 1, 5], target: [0, 1, 0], fov: 48, minHorizontalFov: 30,
  azimuth: [-1, 1], polar: [1, 2], distance: [3, 7],
};
const ORTHO = {
  kind: 'ortho', position: [0, 7.2, 11.55], target: [0, 2.8, -0.45], height: 12, minWidth: 15.5, zoom: [1, 2.5],
  azimuth: [-1.3, 1.3], polar: [0.35, 1.4],
};
/** OrbitControls giả: chỉ các trường limitControls ghi. */
const fakeControls = () => ({ target: new Vector3(), minZoom: 0, maxZoom: Infinity, minDistance: 0, maxDistance: Infinity, enableZoom: true });

describe('createCamera', () => {
  it('thiếu kind: PerspectiveCamera như ba bức trước (fov theo khung, near 0,1, far 500), đặt ở position, nhìn target', () => {
    const cam = createCamera(PERSPECTIVE, 1.6);
    expect(cam).toBeInstanceOf(PerspectiveCamera);
    expect([cam.fov, cam.aspect, cam.near, cam.far]).toEqual([48, 1.6, NEAR, FAR]);
    expect(cam.position.toArray()).toEqual(PERSPECTIVE.position);
    const forward = cam.getWorldDirection(new Vector3());
    expect(forward.dot(new Vector3(0, 0, -1))).toBeCloseTo(1, 6);
    expect(isOrtho(PERSPECTIVE)).toBe(false);
  });

  it("kind 'ortho': OrthographicCamera, khung nhìn cao height, rộng height × tỉ lệ khung, zoom 1, near 0,1, far 500", () => {
    const cam = createCamera(ORTHO, 1.6);
    expect(cam).toBeInstanceOf(OrthographicCamera);
    expect([cam.top, cam.bottom, cam.near, cam.far, cam.zoom]).toEqual([6, -6, NEAR, FAR, 1]);
    expect(cam.right).toBeCloseTo(9.6, 9);
    expect(cam.left).toBeCloseTo(-9.6, 9);
    expect(isOrtho(ORTHO)).toBe(true);
  });
});

describe('fitCamera', () => {
  it('camera trực giao ở khung hẹp: nới theo minWidth (fitOrtho); zoom người xem chọn giữ nguyên', () => {
    const cam = createCamera(ORTHO, 1.6);
    cam.zoom = 2;
    const aspect = 390 / 844;
    fitCamera(cam, ORTHO, aspect);
    expect(cam.right - cam.left).toBeCloseTo(15.5, 6);
    expect(cam.zoom).toBe(2);
  });

  it('camera phối cảnh: fov theo minHorizontalFov như fitFov', () => {
    const cam = createCamera(PERSPECTIVE, 1.6);
    fitCamera(cam, PERSPECTIVE, 390 / 844);
    expect(cam.fov).toBeGreaterThan(48);
    expect(cam.aspect).toBeCloseTo(390 / 844, 9);
  });
});

describe('limitControls', () => {
  it('camera trực giao: zoom kẹp trong spec.zoom, khoảng cách không đụng tới (Phụ lục A.92); không xoay ngang quá azimuth', () => {
    const c = fakeControls();
    limitControls(c, ORTHO, false);
    expect([c.minZoom, c.maxZoom, c.enableZoom]).toEqual([1, 2.5, true]);
    expect([c.minDistance, c.maxDistance]).toEqual([0, Infinity]);
    expect([c.minAzimuthAngle, c.maxAzimuthAngle, c.minPolarAngle, c.maxPolarAngle]).toEqual([-1.3, 1.3, 0.35, 1.4]);
    expect(c.target.toArray()).toEqual(ORTHO.target);
    expect([c.enablePan, c.enableDamping]).toEqual([false, true]);
  });

  it('camera trực giao không khai báo zoom: tắt zoom; giảm chuyển động: tắt quán tính', () => {
    const c = fakeControls();
    const { zoom, ...noZoom } = ORTHO;
    limitControls(c, noZoom, true);
    expect([c.enableZoom, c.enableDamping]).toEqual([false, false]);
  });

  it('camera phối cảnh: như cũ (distance kẹp khoảng cách)', () => {
    const c = fakeControls();
    limitControls(c, PERSPECTIVE, false);
    expect([c.minDistance, c.maxDistance, c.enableZoom]).toEqual([3, 7, true]);
  });
});
```

- [ ] **Step 3: Chạy, thấy đỏ.** Run: `npx vitest run tests/unit/fov.test.js tests/unit/camera.test.js`. Expected: FAIL ("fitOrtho is not a
  function", "Failed to load …/camera.js").

- [ ] **Step 4: `fov.js#fitOrtho` và `camera.js`.**

Thêm vào `src/engine/gpu/fov.js` (sửa dòng 1 thành `… fov dọc theo khung (minHorizontalFov); GĐ 8: bề cao khung nhìn của camera trực giao
(minWidth).`):

```js
/** Trần bề cao khung nhìn trực giao: chừng này lần `height` của bức (khung hẹp bất thường không thu tờ tranh thành một dải). */
const MAX_ORTHO = 4;

/**
 * Bề cao khung nhìn (đơn vị cảnh, ở zoom 1) của camera trực giao ở khung tỉ lệ `aspect`. Camera trực giao không có góc: bề ngang thấy
 * được là bề cao × aspect. Khung rộng giữ `height` của bức; khung hẹp hơn thì nới bề cao vừa đủ để bề ngang thấy `minWidth`, có trần.
 * @param {{ height: number, minWidth?: number }} spec   CameraSpec của bức
 * @param {number} aspect
 * @returns {number}
 */
export function fitOrtho(spec, aspect) {
  if (!spec.minWidth || !(aspect > 0) || !Number.isFinite(aspect)) return spec.height;
  return Math.max(spec.height, Math.min(spec.minWidth / aspect, spec.height * MAX_ORTHO));
}
```

`src/engine/gpu/camera.js`:

```js
// engine/gpu/camera.js — camera của sân khấu theo CameraSpec: phối cảnh (mặc định) hay trực giao (GĐ 8); khớp khung khi đổi cỡ; giới hạn OrbitControls theo loại camera.
import { OrthographicCamera, PerspectiveCamera } from 'three/webgpu';
import { fitFov, fitOrtho } from './fov.js';

/** Near và far của mọi camera sân khấu (đơn vị cảnh). Bản nét của Bức 4 đổi độ sâu ra đơn vị cảnh bằng hai số này. */
export const NEAR = 0.1;
export const FAR = 500;

/** Bức nhìn bằng camera trực giao? Thiếu `kind` là phối cảnh, như ba bức đầu. */
export const isOrtho = (spec) => spec?.kind === 'ortho';

/**
 * Camera đúng loại cho `spec`, đặt ở `spec.position`, nhìn `spec.target` (OrbitControls.update() cũng làm vậy lúc chạy; làm sẵn ở đây
 * để test và tia chạm có camera đúng hướng ngay). Khung nhìn tính theo tỉ lệ khung `aspect`.
 * @param {import('../contracts/runtime.js').CameraSpec} spec
 * @param {number} aspect   rộng / cao của canvas
 */
export function createCamera(spec, aspect) {
  const camera = isOrtho(spec) ? new OrthographicCamera(-1, 1, 1, -1, NEAR, FAR) : new PerspectiveCamera(45, 1, NEAR, FAR);
  camera.position.set(...spec.position);
  camera.lookAt(...spec.target);
  fitCamera(camera, spec, aspect);
  camera.updateMatrixWorld();
  return camera;
}

/**
 * Khớp khung (gọi mỗi lần đổi cỡ). Camera phối cảnh: aspect và fov (fitFov). Camera trực giao: bốn cạnh của khung nhìn ở zoom 1
 * (fitOrtho); zoom do OrbitControls đổi thì giữ nguyên, three chia cho zoom lúc dựng ma trận chiếu.
 */
export function fitCamera(camera, spec, aspect) {
  const ratio = aspect > 0 && Number.isFinite(aspect) ? aspect : 1;
  if (camera.isOrthographicCamera) {
    const half = fitOrtho(spec, ratio) / 2;
    camera.top = half;
    camera.bottom = -half;
    camera.right = half * ratio;
    camera.left = -half * ratio;
  } else {
    camera.aspect = ratio;
    camera.fov = fitFov(spec, ratio);
  }
  camera.updateProjectionMatrix();
}

/**
 * OrbitControls bị chặn trong giới hạn bức khai báo. Camera trực giao: lăn chuột, chụm hai ngón đổi `zoom` trong [min, max] của
 * spec.zoom, khoảng cách tới điểm nhìn đứng yên (Phụ lục A.92); thiếu spec.zoom thì không zoom. Camera phối cảnh: kẹp khoảng cách.
 * Damping là quán tính khi thả tay: cần gọi controls.update() mỗi khung (scene.js làm); giảm chuyển động thì tắt.
 */
export function limitControls(controls, spec, reducedMotion) {
  controls.target.set(...spec.target);
  [controls.minAzimuthAngle, controls.maxAzimuthAngle] = spec.azimuth;
  [controls.minPolarAngle, controls.maxPolarAngle] = spec.polar;
  if (isOrtho(spec)) {
    controls.enableZoom = Boolean(spec.zoom);
    if (spec.zoom) [controls.minZoom, controls.maxZoom] = spec.zoom;
  } else {
    [controls.minDistance, controls.maxDistance] = spec.distance;
  }
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion;
}
```

- [ ] **Step 5: `stage.js` dùng `camera.js`.** Sửa `src/engine/gpu/stage.js` (bỏ import `PerspectiveCamera` và `fitFov`, thêm
  `import { createCamera, fitCamera, limitControls } from './camera.js';`):

```js
  const scene = new Scene();
  // Camera giữ chỗ tới khi bức khai báo CameraSpec: useCamera() dựng camera ĐÚNG LOẠI (phối cảnh hay trực giao) thay cho nó. Mọi chỗ
  // dùng (scene, pipeline, input, chữ đi theo vật, móc lần vẽ) đọc stage.camera SAU useCamera.
  let camera = createCamera(PLACEHOLDER, 1);
```

```js
/** CameraSpec giữ chỗ của sân khấu trước khi bức khai báo camera của nó. */
const PLACEHOLDER = Object.freeze({ position: [0, 0, 5], target: [0, 0, 0], fov: 45 });
```

Trong `resize` (thay hai dòng `camera.aspect = …`, `if (cameraSpec) camera.fov = …` và `camera.updateProjectionMatrix()`):

```js
    aspect = width / height;
    fitCamera(camera, cameraSpec ?? PLACEHOLDER, aspect);
```

(`let aspect = 1;` khai báo cạnh `let cameraSpec`.) Trong object trả về, thay `camera,` bằng getter và viết lại `useCamera`:

```js
    /** Camera của bức (getter): useCamera() thay camera, nên đừng giữ tham chiếu từ trước lúc đó. */
    get camera() {
      return camera;
    },

    /** Áp CameraSpec của bức: dựng camera đúng loại ở vị trí của bức, khớp khung, rồi OrbitControls bị chặn trong giới hạn bức khai báo. */
    useCamera(spec) {
      controls?.dispose();
      cameraSpec = spec;
      camera = createCamera(spec, aspect);
      controls = new OrbitControls(camera, renderer.domElement);
      limitControls(controls, spec, reducedMotion);
      base.set(...spec.target);
      breathAmp = breathAmplitude(spec, reducedMotion);
      controls.update();
      return controls;
    },
```

Sửa JSDoc `CameraSpec` trong `src/engine/contracts/runtime.js`: chép đúng khối của spec §8.4 (các trường `[8]`: `kind`, `fov` tùy chọn,
`height`, `minWidth`, `zoom`, `distance` tùy chọn, `home`). Câu đầu: "xưởng dựng camera phối cảnh ([8] hay trực giao) + OrbitControls có
giới hạn".

- [ ] **Step 6: Test độ sâu theo loại camera (đỏ trước).** Thêm vào `tests/unit/pipeline.test.js` (import `OrthographicCamera`, `linearDepth`,
  `nodesOf` từ `../helpers/nodes.js`):

```js
describe('linearDepth (GĐ 8): độ sâu tuyến tính đúng cho loại camera của sân khấu', () => {
  const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
  const probe = (seen) => ({ id: 'x', layer: { post: { build({ color, channel }) { seen.depth = channel('depth'); return color; } }, dispose() {} } });
  const idsOf = (node) => new Set(nodesOf(node).map((n) => n.id));

  it('camera trực giao: channel("depth") và view Depth là CHÍNH texture độ sâu (đã tuyến tính, Phụ lục A.90), không qua công thức phối cảnh', () => {
    const seen = {};
    const camera = new OrthographicCamera();
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera, layers: [probe(seen)], weight: () => uniform(1) });
    const depthTexture = p.scenePass.getTextureNode('depth');
    expect(seen.depth).toBe(depthTexture);
    expect(linearDepth(p.scenePass, camera)).toBe(depthTexture);
    const ids = idsOf(p.views.node('depth'));
    expect(ids.has(depthTexture.id)).toBe(true);
    expect(ids.has(p.scenePass.getLinearDepthNode().id)).toBe(false);
  });

  it('camera phối cảnh: node giữ nguyên như ba bức trước (getLinearDepthNode) ở channel và ở view Depth', () => {
    const seen = {};
    const camera = new PerspectiveCamera();
    const p = createPipeline({ renderer: fakeRenderer, scene: new Scene(), camera, layers: [probe(seen)], weight: () => uniform(1) });
    expect(seen.depth).toBe(p.scenePass.getLinearDepthNode());
    expect(idsOf(p.views.node('depth')).has(p.scenePass.getLinearDepthNode().id)).toBe(true);
  });
});
```

Test cũ của `views.test.js` gọi `createViews` không có `depth`: giữ nguyên (mặc định là `getLinearDepthNode()`), để chứng minh hành vi cũ
không đổi.

- [ ] **Step 7: Chạy, thấy đỏ** (`linearDepth` chưa có). Rồi sửa `src/engine/gpu/pipeline.js`:

```js
/**
 * Độ sâu tuyến tính [0, 1] (0 ở near, 1 ở far) của scene pass, đúng cho loại camera của sân khấu.
 * - Camera phối cảnh: getLinearDepthNode() như cũ (ba bức đầu không đổi node nào).
 * - Camera trực giao: three luôn đổi texture độ sâu bằng công thức phối cảnh (PassNode.getViewZNode, Phụ lục A.89), nên mọi điểm dồn
 *   về sát 0 và view Depth thành một bóng trắng. Texture độ sâu của camera trực giao đã tuyến tính ở cả hai backend (A.90): dùng thẳng.
 * Chọn bằng JS lúc dựng pipeline: trong post, camera của TSL là camera vẽ quad, không phải camera của cảnh (A.93).
 * @param {any} scenePass
 * @param {any} camera   camera của sân khấu
 */
export function linearDepth(scenePass, camera) {
  return camera.isOrthographicCamera ? scenePass.getTextureNode('depth') : scenePass.getLinearDepthNode();
}
```

Trong `createPipeline`: `const depth = linearDepth(scenePass, camera);`, nhánh `'depth'` của `channel` trả `depth`, và
`createViews({ …, compile, depth })`. Trong `views.js`: tham số `depth = scenePass.getLinearDepthNode()` (JSDoc: "độ sâu tuyến tính của
pipeline (pipeline.js#linearDepth)"), và view `'depth'` dùng `depth` thay cho `scenePass.getLinearDepthNode()`. Sửa dòng 1 của
`pipeline.js`: thêm "; GĐ 8: độ sâu tuyến tính theo loại camera".

- [ ] **Step 8: Test tia chạm và chữ đi theo vật với camera trực giao.** Những chỗ này đã đúng sẵn (Phụ lục A.92); chỉ thêm test.

`tests/unit/input.test.js` (import thêm `OrthographicCamera`, `Vector3`):

```js
  it('GĐ 8: camera trực giao → mọi tia song song hướng nhìn; gốc tia dời trên mặt phẳng camera theo chỗ chạm (Phụ lục A.92)', () => {
    const ortho = new OrthographicCamera(-10, 10, 5, -5, 0.1, 100);
    ortho.position.set(0, 5, 10);
    ortho.lookAt(0, 0, 0);
    ortho.updateMatrixWorld();
    const own = createInput({ canvas, camera: ortho, controls, pointer: u, win });
    canvas.dispatchEvent(pointer('pointerdown', 150, 25)); // NDC (0,5; 0,5)
    clock = 80;
    canvas.dispatchEvent(pointer('pointerup', 150, 25));
    const g = own.drain().find((x) => x.kind === 'tap');
    own.dispose();
    const forward = ortho.getWorldDirection(new Vector3());
    expect(g.ray.direction.dot(forward)).toBeCloseTo(1, 6);
    const right = new Vector3(1, 0, 0).applyQuaternion(ortho.quaternion);
    const up = new Vector3(0, 1, 0).applyQuaternion(ortho.quaternion);
    const local = g.ray.origin.clone().sub(ortho.position);
    expect(local.dot(right)).toBeCloseTo(5, 6); // nửa bề ngang 10 × 0,5
    expect(local.dot(up)).toBeCloseTo(2.5, 6); // nửa bề cao 5 × 0,5
  });
```

`tests/unit/caption-set.test.js` (import thêm `OrthographicCamera`):

```js
  it('GĐ 8: camera trực giao: neo ở điểm nhìn hiện giữa khung; neo sau lưng camera thì ẩn', () => {
    const ui = fakeUi();
    const camera = new OrthographicCamera(-4, 4, 3, -3, 0.1, 100);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const set = createCaptionSet({ captions: CAPTIONS, ui, camera, time: { value: 2 }, size: () => ({ width: 800, height: 600 }) });
    const point = { x: 0, y: 0, z: 0 };
    set.api.show('tram-nam', () => point);
    set.step();
    const [, x, y, visible] = lastPlace(ui);
    expect(visible).toBe(true);
    expect(x).toBeCloseTo(400, 6);
    expect(y).toBeCloseTo(300, 6);
    point.z = 20;
    set.step();
    expect(lastPlace(ui)[3]).toBe(false);
  });
```

  Run: `npx vitest run tests/unit/pipeline.test.js tests/unit/views.test.js tests/unit/input.test.js tests/unit/caption-set.test.js
  tests/unit/fov.test.js tests/unit/camera.test.js`. Expected: xanh.

- [ ] **Step 9: Hợp đồng, ctx giả, hàng rào (đỏ trước).**
  - `tests/paintings/contract.test.js`, test "painting.js: … camera đúng hình dạng": thay ba dòng kiểm `fov`, `distance` bằng:

```js
    const cam = painting.camera;
    expect(cam.position).toHaveLength(3);
    expect(cam.target).toHaveLength(3);
    expect(['perspective', 'ortho'], `CameraSpec.kind "${cam.kind}"`).toContain(cam.kind ?? 'perspective');
    if (cam.kind === 'ortho') {
      expect(cam.height, 'camera trực giao cần height > 0').toBeGreaterThan(0);
      if (cam.minWidth !== undefined) expect(cam.minWidth).toBeGreaterThan(0);
      if (cam.zoom) expect(0 < cam.zoom[0] && cam.zoom[0] <= cam.zoom[1], `zoom ${cam.zoom}`).toBe(true);
    } else {
      expect(cam.fov, 'camera phối cảnh cần fov > 0').toBeGreaterThan(0);
      expect(cam.distance[0]).toBeLessThanOrEqual(cam.distance[1]);
    }
    for (const [lo, hi] of [cam.azimuth, cam.polar]) expect(lo).toBeLessThanOrEqual(hi);
    if (cam.home) expect(cam.home.after > 0 && cam.home.duration > 0, 'home: after, duration > 0').toBe(true);
```

  - Cùng file, test tap: `channel` dựng độ sâu bằng `linearDepth(scenePass, ctx.camera)` (import từ `pipeline.js`), không gọi thẳng
    `getLinearDepthNode()`. Bản nét lấy mẫu texture độ sâu bằng `.sample()`, mà node của công thức phối cảnh không phải texture.
  - `tests/helpers/fake-ctx.js`: `makeEngineCtx` nhận thêm tùy chọn `camera` (mặc định giữ `new PerspectiveCamera(40, 1.6, 0.1, 500)`).
    `buildPainting` truyền `camera: createCamera(painting.camera, 1.6)` (import từ `engine/gpu/camera.js`), như sân khấu dựng ở khung
    640 × 400. Sửa dòng 1: "… sân khấu giả (camera dựng theo painting.camera, GĐ 8) …".
  - `tests/rules/imports.test.js`, test tự kiểm của hàng rào: thêm

```js
    // GĐ 8: bắt được từ của Bức 4; không bắt token của xưởng (denThen chứa "hen") hay núm grain của Phủ bóng.
    expect(fenceHits('chickPeck')).not.toEqual([]);
    expect(fenceHits('const s = "Gà mẹ";').map((h) => h.term)).toContain('gà mẹ');
    for (const word of ['denThen', 'grainAmount']) expect(fenceHits(word), word).toEqual([]);
```

  - Run: `npm test`. Expected: đỏ ở test tự kiểm (chưa có meta của Bức 4). Test cũ của Bức 1–3 phải xanh với camera mới của ctx giả.
    Test nào đỏ vì camera giờ đứng đúng chỗ của bức thì sửa test cho khớp camera thật, không sửa code bức, và ghi vào commit.

- [ ] **Step 10: Bố cục (đỏ trước)** — `tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js`. Phần "chạm trúng đúng điểm trên sàn" là bằng
  chứng của luật dừng điều 1: nó dùng đúng Raycaster và camera mà `input.js` dùng.

```js
// tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js — bố cục của tờ tranh: góc nhìn của tranh đúng số §20.2; chỗ nhà của gà con trên sàn, không chồng nhau; cú chạm của camera trực giao trúng đúng điểm trên sàn.
import { describe, it, expect } from 'vitest';
import { Raycaster, Vector2, Vector3 } from 'three/webgpu';
import { createCamera } from '../../../src/engine/gpu/camera.js';
import { CAMERA, FLOOR, HEN, HOMES, PAPER, floorPoint } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const DEG = 180 / Math.PI;
const inFloor = ([x, z]) => x >= FLOOR.x[0] && x <= FLOOR.x[1] && z >= FLOOR.z[0] && z <= FLOOR.z[1];

describe('cot-bo-cuc', () => {
  it('góc nhìn của tranh: camera trực giao, nhìn chếch xuống chừng 20°, xoay ngang ±75°, xoay dọc 10°–70° trên mặt sàn', () => {
    expect(CAMERA.kind).toBe('ortho');
    const [dx, dy, dz] = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
    expect(Math.atan2(dy, Math.hypot(dx, dz)) * DEG).toBeCloseTo(20, 0);
    expect(CAMERA.azimuth.map((a) => a * DEG)).toEqual([-75, 75].map((a) => expect.closeTo(a, 6)));
    expect(CAMERA.polar.map((a) => 90 - a * DEG)).toEqual([70, 10].map((a) => expect.closeTo(a, 6))); // polar đo từ trục y
    expect([CAMERA.height, CAMERA.minWidth, CAMERA.zoom, CAMERA.breathe]).toEqual([12, 15.5, [1, 2.5], 0]);
  });

  it('mười gà con: hai con trèo lưng và nấp bụng sát mẹ; tám con kia ở trên sàn, cách tâm mẹ hơn 2,2, không chồng nhau', () => {
    expect(HOMES).toHaveLength(10);
    expect(HOMES.filter((h) => h.kind === 'back')).toHaveLength(1);
    expect(HOMES.filter((h) => h.kind === 'belly')).toHaveLength(1);
    const free = HOMES.filter((h) => h.kind === 'free');
    expect(free).toHaveLength(8);
    for (const h of free) {
      expect(inFloor(h.at), `nhà ${h.at} ngoài sàn`).toBe(true);
      expect(dist(h.at, HEN.at), `nhà ${h.at} sát mẹ`).toBeGreaterThan(2.2);
    }
    for (let i = 0; i < free.length; i += 1) {
      for (let j = i + 1; j < free.length; j += 1) expect(dist(free[i].at, free[j].at)).toBeGreaterThan(1.3);
    }
  });

  it.each([1.6, 390 / 844])('chạm vào một điểm trên sàn (khung tỉ lệ %s) thì ra đúng điểm đó: tia của camera trực giao qua NDC của nó', (aspect) => {
    const cam = createCamera(CAMERA, aspect);
    const raycaster = new Raycaster();
    for (const [x, z] of [[0, 0], [-4, 3], [5, -2], [6, 4.5]]) {
      const ndc = new Vector3(x, 0, z).project(cam);
      raycaster.setFromCamera(new Vector2(ndc.x, ndc.y), cam);
      const [hx, hz] = floorPoint(raycaster.ray);
      expect(hx).toBeCloseTo(x, 6);
      expect(hz).toBeCloseTo(z, 6);
    }
  });

  it('chạm lên vách, ra ván, hay tia không đi xuống: điểm gần nhất trên sàn, luôn hữu hạn và trong FLOOR', () => {
    const rays = [
      { origin: new Vector3(0, 7, 12), direction: new Vector3(0, 0.1, -1).normalize() }, // lên vách, ra khỏi giấy
      { origin: new Vector3(30, 7, 12), direction: new Vector3(0, -0.34, -0.94) }, // ra ván bên phải
      { origin: new Vector3(0, 7, 12), direction: new Vector3(1, 0, 0) }, // song song mặt sàn
      { origin: new Vector3(0, -2, 0), direction: new Vector3(0, -1, 0) }, // gốc dưới sàn
    ];
    for (const ray of rays) {
      const p = floorPoint(ray);
      expect(p.every(Number.isFinite) && inFloor(p), `${p}`).toBe(true);
    }
    expect(PAPER.front - PAPER.back).toBe(8); // sàn phẳng sâu 8, cộng chỗ uốn (bán kính 2) là 10 như §20.1
  });
});
```

- [ ] **Step 11: `parts/cot-bo-cuc.js`.** Số thiết kế; chốt ở điểm duyệt ảnh (Task 4).

```js
// paintings/dan-ga-me-con/parts/cot-bo-cuc.js — bố cục của tờ tranh (dữ liệu thuần): tờ giấy cong, gà mẹ, chỗ "nhà" của mười gà con, hướng nắng, góc nhìn của tranh; điểm chạm trên sàn; không import three.

const RAD = Math.PI / 180;
const unit = (v) => v.map((c) => c / Math.hypot(...v));
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Tờ giấy cong như phông chụp ảnh (spec §20.1), đơn vị cảnh 10 cm: sàn phẳng rộng 14 từ mép trước z = 5 tới z = −3; chỗ uốn là cung tròn
 * bán kính 2; vách đứng ở z = −5, mép trên ở y = 6. Sàn sâu 8 + chỗ uốn 2 = 10.
 */
export const PAPER = Object.freeze({ width: 14, front: 5, back: -3, bend: 2, top: 6 });
/** Phần sàn phẳng mà gà đứng và thóc nằm được, chừa mép 0,3. */
export const FLOOR = Object.freeze({ x: Object.freeze([-6.7, 6.7]), z: Object.freeze([-2.7, 4.7]) });
/** Hướng nắng (đơn vị, chỉ VỀ phía nắng): từ trên, bên trái, phía trước (§20.1). */
export const SUN = Object.freeze(unit([-0.45, 0.75, 0.5]));
/** Gà mẹ đứng giữa sàn, quay sang trái (−x): hướng h nghĩa là phía trước là (sin h, 0, cos h), như rotation.y của three. */
export const HEN = Object.freeze({ at: Object.freeze([0, 0]), heading: -Math.PI / 2, length: 4, height: 3.2, back: 2.3 });

/**
 * Chỗ "nhà" của mười gà con (x, z), hướng lúc nghỉ, và màu (chỉ số trong bảng màu của Bản màu, Task 4), theo tinh thần tranh gốc (§20.1).
 * kind 'free': đi lại được. 'back': trèo trên lưng mẹ (y = HEN.back). 'belly': nấp dưới bụng mẹ. Hai con sau luôn ở yên.
 */
export const HOMES = Object.freeze([
  { at: [-3.2, 0.9], heading: 1.9, pigment: 0, kind: 'free' }, // trước mặt mẹ, ngước nhìn mồi
  { at: [-3.0, -0.6], heading: 1.2, pigment: 1, kind: 'free' },
  { at: [3.0, 1.2], heading: -1.4, pigment: 2, kind: 'free' }, // sau lưng mẹ, rỉa lông
  { at: [3.3, -0.4], heading: -2.2, pigment: 3, kind: 'free' },
  { at: [-1.0, -2.4], heading: 0.4, pigment: 4, kind: 'free' }, // ở xa: nằm cao hơn trong khung
  { at: [1.6, -2.5], heading: -0.5, pigment: 0, kind: 'free' },
  { at: [-1.4, 3.0], heading: 2.8, pigment: 2, kind: 'free' }, // ở gần: nằm thấp hơn
  { at: [1.8, 3.4], heading: -2.7, pigment: 1, kind: 'free' },
  { at: [0.3, 0.0], heading: -Math.PI / 2, pigment: 4, kind: 'belly' },
  { at: [0.6, 0.0], heading: -Math.PI / 2, pigment: 3, kind: 'back' },
].map((h) => Object.freeze({ ...h, at: Object.freeze(h.at) })));

/**
 * Góc nhìn của tranh (CameraSpec, §20.2). Nhìn chếch xuống 20°; điểm nhìn đặt sao cho tờ giấy nằm giữa khung theo chiều dọc: mép trước
 * và mép trên của giấy cách tâm khung chừng 4,5 đơn vị, trong khung cao 12, nên giấy chiếm chừng 75% bề cao và chữ nằm trên ván tối.
 * (Số §20.2 cũ, target [0; 1,6; 0], để giấy lệch hẳn lên trên: mép trên chỉ cách mép khung 0,15. Đã sửa §20.2 cùng task.)
 * polar đo từ trục y: xoay dọc 10°–70° trên mặt sàn là polar 80°–20°. Task 3 thêm home.
 */
export const CAMERA = Object.freeze({
  kind: 'ortho',
  position: [0, 7.2, 11.55],
  target: [0, 2.8, -0.45],
  height: 12,
  minWidth: 15.5,
  zoom: [1, 2.5],
  azimuth: [-75 * RAD, 75 * RAD],
  polar: [20 * RAD, 80 * RAD],
  breathe: 0,
});

/**
 * Điểm trên sàn cho một cú chạm (§20.2): tia cắt mặt y = 0; tia không đi xuống (song song, hướng lên, gốc dưới sàn) thì lấy chân của gốc
 * tia. Rồi kẹp vào FLOOR, nên chạm lên vách hay ra ván vẫn có điểm gần nhất trên sàn.
 * @param {{ origin: { x: number, y: number, z: number }, direction: { x: number, y: number, z: number } }} ray
 * @returns {[number, number]} x, z
 */
export function floorPoint({ origin: o, direction: d }) {
  const s = d.y < -1e-6 && o.y > 0 ? -o.y / d.y : 0;
  return [clamp(o.x + d.x * s, ...FLOOR.x), clamp(o.z + d.z * s, ...FLOOR.z)];
}
```

  Run: `npx vitest run tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js`. Expected: xanh. Sửa §20.2 (target, position mới, lý do) trong
  cùng commit.

- [ ] **Step 12: Tờ giấy, hình gà khung, lớp Cốt.**
  - `parts/cot-giay.js`: mặt cắt và lưới.

```js
// paintings/dan-ga-me-con/parts/cot-giay.js — của lớp Cốt: tờ giấy cong như phông chụp ảnh (sàn, chỗ uốn, vách) thành một lưới; UV theo đơn vị cảnh, chạy theo chiều dài cung nên thớ giấy không giãn ở chỗ uốn.
import { BufferGeometry, Float32BufferAttribute } from 'three/webgpu';
import { PAPER } from './cot-bo-cuc.js';

const FLAT = PAPER.front - PAPER.back; // 8
const ARC = (Math.PI / 2) * PAPER.bend; // ≈ 3,14
const WALL = PAPER.top - PAPER.bend; // 4
/** Chiều dài mặt cắt, từ mép trước tới mép trên (đơn vị cảnh). Giấy điệp đặt noise theo UV này. */
export const PAPER_LENGTH = FLAT + ARC + WALL;

/**
 * Điểm trên mặt cắt ở chiều dài cung s (0 ở mép trước): y, z và pháp tuyến (ny, nz).
 * Sàn: y = 0, pháp tuyến lên. Chỗ uốn: cung tròn tâm (y = bend, z = back), pháp tuyến quay dần từ lên sang ra phía trước. Vách: z = back − bend.
 */
export function profile(s) {
  if (s <= FLAT) return { y: 0, z: PAPER.front - s, ny: 1, nz: 0 };
  if (s <= FLAT + ARC) {
    const a = (s - FLAT) / PAPER.bend;
    return { y: PAPER.bend * (1 - Math.cos(a)), z: PAPER.back - PAPER.bend * Math.sin(a), ny: Math.cos(a), nz: Math.sin(a) };
  }
  return { y: PAPER.bend + (s - FLAT - ARC), z: PAPER.back - PAPER.bend, ny: 0, nz: 1 };
}

const range = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / n);

/** Lưới của tờ giấy: 8 cột theo x; hàng thưa trên sàn và vách, dày ở chỗ uốn (để cung tròn mịn). UV = (x + 7, s), theo đơn vị cảnh. */
export function paperGeometry() {
  const rows = [...range(0, FLAT, 8), ...range(FLAT, FLAT + ARC, 16), ...range(FLAT + ARC, PAPER_LENGTH, 6), PAPER_LENGTH];
  const cols = 8;
  const pos = [];
  const nor = [];
  const uv = [];
  for (const s of rows) {
    const p = profile(s);
    for (let c = 0; c <= cols; c += 1) {
      const x = -PAPER.width / 2 + (PAPER.width * c) / cols;
      pos.push(x, p.y, p.z);
      nor.push(0, p.ny, p.nz);
      uv.push(x + PAPER.width / 2, s);
    }
  }
  const index = [];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const a = r * (cols + 1) + c;
      const d = a + cols + 1;
      index.push(a, a + 1, d, a + 1, d + 1, d); // ngược chiều kim đồng hồ khi nhìn từ phía pháp tuyến
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}
```

  - `parts/cot-hinh-ga.js`, bản khung: `PART` và hàm `piece` (dưới đây). `henGeometry` và `chickGeometry` ở bản này chỉ có mình và đầu.
    Task 4 thêm đủ phần.
    - Gà con dựng trong khung của chính nó: chân ở gốc tọa độ, phía trước +z, lên +y. Mình là cầu kéo dãn, bán kính 0,45, tỉ lệ
      (1; 0,9; 1,25), tâm ở y 0,45. Đầu là cầu bán kính 0,3 ở (0; 0,85; 0,4).
    - Gà mẹ dựng như gà con rồi xoay sẵn sang `HEN.heading` và dời tới `HEN.at` lúc dựng, nên tọa độ của mesh là tọa độ thế giới.
      Mình là cầu bán kính 1, tỉ lệ (1,2; 1,1; 2), tâm ở y 1,6. Đầu là cầu bán kính 0,6 ở (0; 2,7; 1,6).

```js
// paintings/dan-ga-me-con/parts/cot-hinh-ga.js — của lớp Cốt: hình gà ghép từ khối cơ bản thành một BufferGeometry, mỗi đỉnh mang thuộc tính `part` (mình, đầu, mỏ…); positionNode cho đầu, cánh, chân và tấm bìa phẳng (Task 4).
import { BufferAttribute, SphereGeometry } from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Phần của hình gà (thuộc tính `part`, số thực). Mọi phần từ HEAD trở lên đi theo đầu khi cúi, gật, ngoảnh. */
export const PART = Object.freeze({ BODY: 0, TAIL: 1, LEG: 2, WING: 3, HEAD: 4, BEAK: 5, COMB: 6, EYE: 7, BEE: 8 });

/** Một khối đã đặt chỗ, mọi đỉnh mang `part`. Bỏ index: mergeGeometries cần mọi geometry cùng có hay cùng không có index. */
export function piece(geometry, part) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.setAttribute('part', new BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
  return g;
}

/** Cầu kéo dãn: bán kính r, tỉ lệ [sx, sy, sz], tâm [x, y, z]; `segments` vòng quanh (núm Cốt). */
export const blob = (r, scale, center, segments) =>
  new SphereGeometry(r, segments, Math.max(6, Math.round(segments * 0.6))).scale(...scale).translate(...center);
```

    `chickGeometry({ segments })` trả `mergeGeometries([piece(blob(…mình…), PART.BODY), piece(blob(…đầu…), PART.HEAD)])`.
    `henGeometry({ segments })` trả `{ body }` (Task 4 thêm `wingL`, `wingR`): ghép như gà con, rồi `.rotateY(HEN.heading)` và
    `.translate(HEN.at[0], 0, HEN.at[1])`. Hai hàm lấy `HEN` từ `./cot-bo-cuc.js`.

  - `layers/l1-cot.js`, theo mẫu `cung-que/layers/l1-cot.js`:
    - `knobs`:
      - `{ id: 'segments', via: 'rebuild', min: 8, max: 48, step: 4, value: 24 }`;
      - `{ id: 'wireframe', kind: 'bool', via: 'rebuild', value: false }`, xử lý như Bức 1 (`setAll('wireframe', v)`).
    - Đèn xưởng (`base`) là `datSet × (0,35 + 0,65 · max(dot(n, nắng), 0))`, như Bức 3, với hướng nắng `SUN`.
    - Ba vật, mỗi vật một `NodeMaterial` gốc dựng bằng hàm `make(kind, pigment)`:
      - `giay`: Mesh của `paperGeometry()`;
      - `ga-me`: Group chứa Mesh `body` (Task 4 thêm hai cánh);
      - `ga-con`: InstancedMesh của `chickGeometry`, `count` 10.
    - Màu và emissive dựng trong `Fn` gọi ngay, nên thân hàm chỉ chạy lúc biên dịch, sau khi mọi lớp đã bọc `recipe` (như
      `cung-que/parts/la-da-mesh.js`):

```js
  const clay = color(ctx.palette.color('datSet'));
  const muc = color(ctx.palette.color('muc'));
  const sun = vec3(...SUN);
  const recipe = {
    base: (s) => clay.mul(float(0.35).add(max(dot(s.n, sun), 0).mul(0.65))),
    fill: (s) => recipe.base(s),
    ink: () => float(0),
    paper: (s) => recipe.base(s),
    glint: () => vec3(0),
  };
  /** Màu cuối của một điểm tô: tờ giấy theo paper; gà và thóc theo fill rồi phủ mực của nét trong (§20.4). */
  const paint = (s) => (s.kind === 'giay' ? recipe.paper(s) : mix(recipe.fill(s), muc, recipe.ink(s)));
  const pointOf = (kind, pigment) => ({
    kind, part: kind === 'giay' ? float(0) : attribute('part', 'float'), n: normalWorld, uv: uv(), pos: positionWorld, pigment,
  });
  const make = (kind, pigment = float(-1)) => {
    const m = new NodeMaterial();
    m.colorNode = Fn(() => paint(pointOf(kind, pigment)))();
    m.emissiveNode = kind === 'giay' ? Fn(() => recipe.glint(pointOf(kind, pigment)))() : vec3(0);
    return m;
  };
```

    - Tờ giấy không có thuộc tính `part`, nên `pointOf('giay')` đặt `part: float(0)` thay cho `attribute('part')`.
    - Gà con:
      - `InstancedMesh(chickGeometry(…), make('ga', pigment), 10)`, ma trận instance giữ đơn vị (không bao giờ ghi);
      - thuộc tính `pose` (vec4: x, y, z, hướng) và `head` (float), là `InstancedBufferAttribute` ghi từ `HOMES` lúc dựng;
      - `pigment` là thuộc tính instance chỉ số màu, ghi một lần;
      - `positionNode` xoay đỉnh quanh trục y theo `pose.w` rồi dời tới `pose.xyz`, và gán `normalLocal` xoay theo (Task 4 thêm đầu cúi
        và tấm bìa). Vị trí tính trong shader, nên `frustumCulled = false`.
    - Mỗi khung, `update()` đặt
      `pixel.value = (camera.top − camera.bottom) / camera.zoom / max(ctx.u.resolution.value.y, 1)` (camera là `ctx.camera`; Cốt là lớp
      đầu nên các lớp sau đọc số của chính khung này).
    - Ghi `shared.cot` như phần Interfaces. `objects: [paper, henGroup, chicks]`, tên `giay`, `ga-me`, `ga-con`.

- [ ] **Step 13: Bản nét dò cạnh: chỗ khó nhất của GĐ 8.**

  **Vì sao không dùng Sobel trên độ sâu** (spec §20.4 ghi Sobel cho bậc; sửa §20.4 trong commit này):
  - Ở góc nhìn của tranh, mỗi điểm ảnh (khung cao 12 trên 1600 điểm ảnh thiết bị) dời 0,0075 đơn vị trên màn hình. Nhìn chếch 20°, độ
    sâu của mặt sàn đổi 2,73 đơn vị cho mỗi đơn vị màn hình, tức chừng 0,02 mỗi điểm ảnh.
  - Kéo xuống góc thấp nhất (10°), con số đó gấp đôi; ở DPR 1 thì gấp đôi lần nữa. Độ dốc của Sobel trên mặt sàn khi ấy vượt ngưỡng của
    một bậc thật, và cả mặt sàn thành nét đen.
  - Độ lệch khỏi mặt phẳng `e = D(+) + D(−) − 2·D(giữa)` bằng 0 trên MỌI mặt phẳng, dù nghiêng tới đâu. Ở bậc độ sâu cao H, |e| ≈ H.
    Ở nếp gấp, |e| ≈ độ đổi độ dốc × độ dài một bước. Vì vậy một phép đo cho cả bậc lẫn nếp gấp, không bị mặt nghiêng đánh lừa.

  `parts/ban-net-do-canh.js`:

```js
// paintings/dan-ga-me-con/parts/ban-net-do-canh.js — của lớp Bản nét: nét viền dò trên ảnh độ sâu của camera trực giao (độ lệch khỏi mặt phẳng theo bốn hướng); lấy mẫu thẳng texture độ sâu, không thêm lượt vẽ.
import { abs, float, max, screenSize, screenUV, smoothstep, vec2 } from 'three/tsl';

/** Bốn hướng lấy mẫu: ngang, dọc, hai chéo. Mỗi hướng một cặp điểm đối xứng quanh điểm giữa: lưới 3×3, chín lần đọc texture. */
const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
/** Độ gãy (độ đổi độ dốc, không đơn vị) từ đó nếp gấp thành nét đậm hẳn. */
const KINK = 1;

/**
 * Độ phủ của nét viền (0–1) tại điểm ảnh này.
 * - Độ sâu D (đơn vị cảnh) = texture × span: với camera trực giao, texture độ sâu đã tuyến tính (Phụ lục A.90). Chỉ hiệu số đáng kể, nên
 *   bỏ near.
 * - Mỗi hướng: e = D(+) + D(−) − 2·D(giữa), độ lệch khỏi mặt phẳng. Mặt phẳng nghiêng: e = 0. Bậc cao H: |e| ≈ H.
 * - Bậc: e > 0 nghĩa là điểm giữa gần hơn trung bình hai bên, tức nằm trên vật ở trước. Nét chỉ vẽ phía đó, như nét viền của vật.
 *   e ≥ threshold thì đậm hẳn.
 * - Nếp gấp, hay bậc nhỏ hơn ngưỡng: |e| chia độ dài một bước (đơn vị cảnh) là độ gãy; đủ KINK thì thành nét, độ đậm nhân `crease`. Bậc
 *   lớn đã là viền thì không tính lại ở đây, để phía sau của bậc không dày thêm.
 * @param {object} p
 * @param {any} p.depth      texture độ sâu (channel('depth') của camera trực giao)
 * @param {any} p.span       uniform: far − near của camera cảnh. Không đọc cameraFar của TSL: trong post đó là camera vẽ quad (A.93)
 * @param {any} p.px         bước lấy mẫu, điểm ảnh (núm lineWidth)
 * @param {any} p.offset     vec2, điểm ảnh: lệch bản (Task 5; khung truyền vec2(0))
 * @param {any} p.threshold  bậc độ sâu tối thiểu thành viền, đơn vị cảnh (núm; min 0,05 nên threshold · 0,6 < threshold)
 * @param {any} p.crease     độ đậm của nét nếp gấp, 0–1 (núm)
 * @param {any} p.pixel      uniform: đơn vị cảnh của một điểm ảnh (shared.cot.pixel)
 */
export function depthEdges({ depth, span, px, offset, threshold, crease, pixel }) {
  const texel = vec2(1).div(screenSize);
  const center = screenUV.add(offset.mul(texel));
  const at = (x, y) => depth.sample(center.add(vec2(x, y).mul(px).mul(texel))).mul(span);
  const d0 = at(0, 0);
  let step = float(0);
  let bend = float(0);
  for (const [x, y] of DIRS) {
    const e = at(x, y).add(at(-x, -y)).sub(d0.mul(2));
    step = max(step, e);
    bend = max(bend, abs(e));
  }
  const edge = smoothstep(threshold.mul(0.6), threshold, step);
  const kink = bend.div(px.mul(pixel).max(1e-5));
  const fold = smoothstep(KINK * 0.6, KINK, kink).mul(crease).mul(float(1).sub(smoothstep(threshold.mul(0.6), threshold, bend)));
  return max(edge, fold);
}
```

  `layers/l3-ban-net.js` (bản khung; Task 5 thêm lệch bản, mực không đều, nét trong, hai thí nghiệm):

```js
// paintings/dan-ga-me-con/layers/l3-ban-net.js — Lớp 3 · Bản nét: nét mực đen in sau cùng, như bản nét của tranh Đông Hồ; viền dò trên ảnh độ sâu (post), nét trong vẽ trên vật (recipe.ink).
import { color, mix, uniform, vec2, vec4 } from 'three/tsl';
import { depthEdges } from '../parts/ban-net-do-canh.js';

export const id = 'ban-net';

export const knobs = [
  { id: 'lineWidth', min: 0.5, max: 3, step: 0.1, value: 1.5 },
  { id: 'threshold', min: 0.05, max: 2, step: 0.05, value: 0.3 },
  { id: 'crease', min: 0, max: 1, step: 0.05, value: 0.6 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.cot.pixel (Cốt đặt mỗi khung)
 */
export function createLayer(ctx, shared) {
  if (!ctx.camera.isOrthographicCamera) {
    throw new Error('Bản nét dò cạnh trên texture độ sâu tuyến tính: chỉ chạy với camera trực giao (spec §20.4 lớp 3).');
  }
  const muc = color(ctx.palette.color('muc'));
  const span = uniform(ctx.camera.far - ctx.camera.near).setName('banNetSpan');
  return {
    objects: [],
    post: {
      build({ color: c, channel, weight, tap }) {
        tap('truoc-net', c);
        const ink = depthEdges({
          depth: channel('depth'),
          span,
          px: ctx.knob('lineWidth'), // @knob lineWidth
          offset: vec2(0),
          threshold: ctx.knob('threshold'), // @knob threshold
          crease: ctx.knob('crease'), // @knob crease
          pixel: shared.cot.pixel,
        });
        return vec4(mix(c.rgb, muc, ink.mul(weight)), c.a);
      },
    },
    dispose() {},
  };
}
```

  Test (đỏ trước) — `tests/paintings/dan-ga-me-con/ban-net.test.js`:

```js
// tests/paintings/dan-ga-me-con/ban-net.test.js — Lớp 3 · Bản nét: viền đọc thẳng texture độ sâu của camera trực giao (không qua công thức phối cảnh), có tap truoc-net, chỉ chạy với camera trực giao.
import { describe, it, expect } from 'vitest';
import { NoToneMapping, PerspectiveCamera, SRGBColorSpace } from 'three/webgpu';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { createPipeline } from '../../../src/engine/gpu/pipeline.js';
import { buildPainting, makeEngineCtx } from '../../helpers/fake-ctx.js';
import { nodesOf } from '../../helpers/nodes.js';

const fakeRenderer = { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace };
const pipelineOf = ({ ctx, built }) => createPipeline({ renderer: fakeRenderer, scene: ctx.scene, camera: ctx.camera, layers: built, weight: ctx.weight });

describe('l3-ban-net (Bức 4)', () => {
  it('post đọc texture độ sâu của scene pass (camera trực giao), không có node độ sâu kiểu phối cảnh; tap truoc-net là màu trước khi có nét', () => {
    const built = buildPainting(painting, meta);
    const p = pipelineOf(built);
    const ids = new Set(nodesOf(p.views.node('final')).map((n) => n.id));
    expect(ids.has(p.scenePass.getTextureNode('depth').id)).toBe(true);
    expect(ids.has(p.scenePass.getLinearDepthNode().id)).toBe(false);
    expect(p.views.list().map((v) => v.id)).toContain('ban-net:truoc-net');
  });

  it('camera phối cảnh: báo lỗi tiếng Việt lúc dựng, không vẽ nét sai', () => {
    const ctx = makeEngineCtx(meta, { camera: new PerspectiveCamera() });
    const layer = painting.layers.find((m) => m.id === 'ban-net');
    expect(() => layer.createLayer({ ...ctx, knob: () => null }, { cot: {} })).toThrow(/camera trực giao/);
  });
});
```

  Nếu `nodesOf` không thấy texture độ sâu (nó nằm trong thân một `Fn` của post), đổi test thứ nhất sang `buildFinalPass` của
  `tests/helpers/final-pass.js` như `views.test.js`, và ghi `Lệch plan`.

- [ ] **Step 14: Phần còn lại của khung** (theo mẫu Bức 3, đổi số):
  - `meta.js`:
    - `slug: 'dan-ga-me-con'`, `no: 4`, `title: 'Đàn Gà Mẹ Con'`;
    - `tagline: 'Một tờ tranh Đông Hồ bước vào được: gà mẹ ngậm con ong, mười gà con quây quần, sơn từ sáu lớp ánh sáng.'`;
    - `poem: { lines: ['Khôn ngoan đối đáp người ngoài', 'Gà cùng một mẹ chớ hoài đá nhau'], source: 'Ca dao' }`;
    - `poster`: `src: '/paintings/dan-ga-me-con/poster.webp'`, 1600 × 1000, `alt` đúng câu của §20.3,
      `capture: { at: '2026-10-05T21:00', freeze: 120 }`;
    - `og: 'paintings/dan-ga-me-con/og.jpg'`;
    - `palette: { diep: '#EFE6D2', hoe: '#E0AC3A', sonSoi: '#B9472E', xanhDong: '#41705F', muc: '#221E1A' }`;
    - `layers`: `cot` (files: `l1-cot.js`, `cot-bo-cuc.js`, `cot-giay.js`, `cot-hinh-ga.js`), `ban-net` (files: `l3-ban-net.js`,
      `ban-net-do-canh.js`), `phuBong`;
    - `fence` như Global Constraints.
  - `index.js`: như Bức 3.
  - `painting.js`: `layers = [cot, banNet, phuBong]`; `export const camera = CAMERA` (từ `cot-bo-cuc.js`); `export { quality }`.
  - `quality.js`: bảng §20.8 (`cao: { dpr: 2, grains: 4096, paper: 3, bloom: 0.5 }`, `vua: { dpr: 1.5, grains: 2048, paper: 2,
    bloom: 0.25 }`, `thap: { dpr: 1.25, grains: 1024, paper: 2, bloom: 0.25 }`). Thang lúc này là `['dpr', 'phu-bong.bloom']`; Task 6
    và Task 8 thêm nấc.
  - `content.vi.js`:
    - `hint` đúng câu §20.2;
    - `cot` và `ban-net`: Hiểu ngắn (dưới 150 chữ), "Bạn vừa học", "Đọc thêm", nhãn núm, nhãn vật (`giay`: 'Tờ giấy',
      `ga-me`: 'Gà mẹ', `ga-con`: 'Mười gà con'), nhãn tap `truoc-net` ('Trước khi in bản nét');
    - `phu-bong`: spread từ lớp dùng chung.

    Chữ đủ ý thật, không phải chữ giữ chỗ. Task 10 viết lại cho đủ và thêm sơ đồ.
  - `registry.js`: `{ meta: danGaMeCon, page: 'tranh/dan-ga-me-con/index.html', lang: 'vi' }`. Chưa đặt `ciWebgpuSmoke`: Task 13 đo CI
    rồi mới quyết.
  - Run: `npm run pages`. Rồi `git status`: phải có `tranh/dan-ga-me-con/index.html` mới, `tranh/cung-que/index.html` và
    `tranh/index.html` đổi.
  - `tests/paintings/dan-ga-me-con/cot.test.js`: dựng `until: 'cot'`. Kiểm:
    - ba vật đúng tên; mọi material là `NodeMaterial` gốc, có `colorNode` và `emissiveNode`;
    - cảnh không có đèn nào của three, `shadowMap` tắt;
    - `ctx.camera` là `OrthographicCamera`;
    - tờ giấy và gà dịch được ra WGSL (`compileMaterial`), không lỗi; đất sét khi mọi trọng số bằng 0 thì e2e chung "mài về Cốt" kiểm;
    - `shared.cot.recipe` đủ năm hàm.

    Rồi `it.each(['webgpu', 'webgl2'])` dịch cả ba vật, `problems` rỗng.
  - `e2e/lat-tranh.spec.js`: thêm test "từ Bức 3 bấm 'Bức 4 · …' thì tới trang Bức 4; bấm '← Bức 3 · …' thì về", theo mẫu test Bức 2 ⇄
    Bức 3. Phòng tranh (`e2e/phong-tranh.spec.js`) lặp qua registry nên tự đếm bốn mục.

- [ ] **Step 15: Chạy unit, thấy xanh** (`npx vitest run tests/paintings/dan-ga-me-con tests/unit`), rồi poster tạm và test chung:
  - Run: `npm run build && node scripts/poster.js dan-ga-me-con`. Cần GPU thật; script ghi `public/paintings/dan-ga-me-con/poster.webp` và
    `og.jpg`.
  - Rồi run: `npm test`. Expected: xanh cả bộ. Test hợp đồng, tên vật, HTML, trang sinh ra và lật tranh tự chạy cho Bức 4; sửa theo
    từng lỗi tiếng Việt.

- [ ] **Step 16: E2e riêng tối thiểu** — `e2e/dan-ga-me-con.spec.js`. Mọi `describe` bắt đầu bằng `'Đàn Gà Mẹ Con · '` (CI gom theo
  tên). Các vùng là số thiết kế cho canvas 640 × 400 (khung nhìn 19,2 × 12); chốt lại theo ảnh thật, ghi số vào chú thích.

```js
// e2e/dan-ga-me-con.spec.js — Bức 4 · Đàn Gà Mẹ Con: camera trực giao vẽ tờ tranh giữa ván tối; độ sâu của camera trực giao; bản nét dò cạnh không thêm lượt vẽ; (Task 3–9) tự khép lại, các lớp, cử chỉ, chất lượng.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, twoFrames } from './helpers.js';

/** Tag của test khói: nếu CI bật ciWebgpuSmoke cho Bức 4 (Task 13), job WebGPU chỉ chạy các test này. */
const SMOKE = { tag: '@khoi' };
/**
 * Vùng (phần của canvas 640 × 400). Khung nhìn 19,2 × 12 đơn vị; tờ giấy từ y 0,12 tới 0,88, x từ 0,135 tới 0,865.
 * BOARD_TOP, BOARD_BOTTOM: ván tối trên và dưới tờ giấy. WALL: vách giấy, không có gà. HEN: mình gà mẹ. LEFT_EDGE: mép trái tờ giấy
 * (nửa ván, nửa giấy): viền của Bản nét nằm ở đây.
 */
const BOARD_TOP = { x0: 0.25, y0: 0.01, x1: 0.75, y1: 0.08 };
const BOARD_BOTTOM = { x0: 0.25, y0: 0.93, x1: 0.75, y1: 0.99 };
const WALL = { x0: 0.25, y0: 0.18, x1: 0.4, y1: 0.3 };
const HEN = { x0: 0.46, y0: 0.57, x1: 0.54, y1: 0.63 };
const LEFT_EDGE = { x0: 0.12, y0: 0.3, x1: 0.15, y1: 0.7 };

async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  const freeze = frames ? `&freeze=${frames}` : '';
  await page.goto(`./tranh/dan-ga-me-con/?${query.replace(/^\?/, '')}${freeze}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  if (frames) await waitForFrames(page, frames, { timeout: 120_000 });
}

/** Lột lớp về nấc "Depth" (nấc đầu bên trái), như e2e của Bức 3. */
async function depthView(page) {
  await page.evaluate(() => window.__sma.setTool('lot-lop'));
  const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]');
  await range.evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(range).toHaveAttribute('aria-valuetext', 'Depth');
  await twoFrames(page);
}

test.beforeEach(async ({ page }, testInfo) => {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/dan-ga-me-con/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
});

test.describe('Đàn Gà Mẹ Con · khung', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('góc nhìn của tranh: camera trực giao vẽ tờ giấy giữa khung, hai dải ván tối ở trên và dưới', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const r = await canvasRegions(page, { top: BOARD_TOP, bottom: BOARD_BOTTOM, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('khung.png') });
    expect(r.top.mean, 'ván trên tối').toBeLessThan(0.08);
    expect(r.bottom.mean, 'ván dưới tối').toBeLessThan(0.08);
    expect(r.wall.mean, 'tờ giấy sáng hơn hẳn ván').toBeGreaterThan(r.top.mean + 0.15);
    expect(log.errors).toEqual([]);
  });

  test('độ sâu của camera trực giao: view Depth có độ dốc; gà (gần) sáng hơn vách (xa), không phải một bóng trắng', SMOKE, async ({ page }, testInfo) => {
    // Lỗi cũ (công thức phối cảnh trên độ sâu trực giao, Phụ lục A.89): mọi vật trắng như nhau, gà và vách bằng nhau.
    await open(page, testInfo, 30);
    await depthView(page);
    const r = await canvasRegions(page, { hen: HEN, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('depth.png') });
    expect(r.hen.mean, 'gà gần hơn vách').toBeGreaterThan(r.wall.mean + 0.02);
    expect(r.wall.mean, 'vách không trắng tinh').toBeLessThan(0.97);
  });

  test('Bản nét: viền đen ở mép tờ giấy; tắt Bản nét thì mất viền, mà số draw call không đổi', async ({ page }, testInfo) => {
    await open(page, testInfo, 0);
    await waitForFrames(page, 30, { timeout: 120_000 });
    const calls = () => page.evaluate(() => window.__sma.stats().drawCalls);
    const withInk = await canvasRegions(page, { edge: LEFT_EDGE });
    const before = await calls();
    await page.evaluate(() => window.__sma.setWeight('ban-net', 0));
    await twoFrames(page);
    await twoFrames(page);
    const without = await canvasRegions(page, { edge: LEFT_EDGE });
    expect(withInk.edge.mean, 'có viền thì mép giấy tối hơn').toBeLessThan(without.edge.mean - 0.01);
    expect(await calls(), 'Bản nét đọc thẳng texture độ sâu: không thêm lượt vẽ').toBe(before);
    expect(before).toBeLessThanOrEqual(30);
  });
});
```

- [ ] **Step 17: Chạy e2e, cả hai backend.**
  - Run: `npm run build && npx playwright test e2e/dan-ga-me-con.spec.js e2e/painting.spec.js e2e/lat-tranh.spec.js
    e2e/phong-tranh.spec.js --project=webgl2-swiftshader --project=static --grep "Đàn Gà Mẹ Con|lật tranh|Phòng tranh|Bức 3"`
  - Rồi run: `E2E_REAL_GPU=1 npx playwright test e2e/dan-ga-me-con.spec.js e2e/painting.spec.js --project=webgpu-real-gpu
    --grep "Đàn Gà Mẹ Con"`
  - Expected: xanh cả hai. Đỏ ở test "góc nhìn" là luật dừng điều 1; ở test "độ sâu" là điều 2; ở test "Bản nét" là điều 3.
  - E2e chung (`painting.spec.js`) cũng phải xanh cho Bức 4: tĩnh, mài về Cốt (giấy về đất sét: độ sáng trung bình dưới 0,8), Kính mài,
    Lột lớp, `?poster`, quầng trăng.

- [ ] **Step 18: Đo hiệu năng** (luật dừng điều 4): Mac M2, GPU thật, 1280×800, DPR 2, `?level=cao`. Dùng script `perf-cung-que.mjs` của
  GĐ 7 (Task 1, Step 15), đổi tên thành `perf-dan-ga.mjs`, đổi slug thành `dan-ga-me-con` và cổng thành 4291. Đặt trong scratchpad, không
  commit.
  - Expected: ở mức cao, `ms` ≤ 16,7 (60 khung/giây), và `__sma.quality().steps` rỗng (bộ điều chỉnh không hạ nấc nào).
  - Không đạt thì đo lại với Bản nét về 0, để biết chín lần đọc texture có phải thủ phạm không. Bản nét là thủ phạm thì thử hai cách, theo
    thứ tự:
    1. bỏ hai hướng chéo (năm lần đọc);
    2. hạ DPR mặc định của mức cao về 1,75.

    Vẫn dưới 50 khung/giây thì DỪNG, báo Bao.

- [ ] **Step 19: Luật dừng.** Bốn điều đạt thì đi tiếp. Một điều không đạt thì DỪNG, báo Bao: điều nào, số đo, ảnh chụp, và đường lùi của
  §20.11:
  - điều 1 hay 2: soát lại xưởng (chỗ nào ngầm coi camera là phối cảnh), không thì quay về camera phối cảnh và bỏ "Tấm bìa phẳng";
  - điều 3: bọc độ sâu bằng `convertToTexture` (thêm một lượt vẽ như FXAA);
  - điều 4: như Step 18.

- [ ] **Step 20: Sửa spec.**
  - §20.2: `position`, `target` mới, kèm lý do (tờ giấy nằm giữa khung theo chiều dọc).
  - §20.4 lớp 3: bậc và nếp gấp dò bằng độ lệch khỏi mặt phẳng theo bốn hướng, lý do của Step 13. Định nghĩa lại `crease` là độ đậm của
    nét nếp gấp.
  - §8.1: thêm `camera.js [8]`, "dựng camera theo CameraSpec (phối cảnh hay trực giao), khớp khung, giới hạn OrbitControls; phần tính
    của stage.js tách ra để unit test".
  - §20.6 mục 1: "stage.js dùng camera.js". Câu "chỉ thêm test": bỏ "camera thở", vì `breath.js` là hàm thuần không biết loại camera, và
    Bức 4 có `breathe` 0.

- [ ] **Step 21: `npm test` cả bộ xanh, rồi commit** (hai commit: xưởng trước, bức sau).

```bash
git add src/engine tests/unit tests/helpers/fake-ctx.js tests/paintings/contract.test.js tests/rules/imports.test.js
git commit -m "feat(xuong): camera trực giao (CameraSpec.kind 'ortho', height, minWidth, zoom; engine/gpu/camera.js), độ sâu tuyến tính theo loại camera (pipeline.js#linearDepth)" -m "<ghi: test Bức 1–3 nào phải sửa vì camera của ctx giả, và vì sao>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git add src/paintings/dan-ga-me-con src/paintings/registry.js tranh public/paintings/dan-ga-me-con tests/paintings/dan-ga-me-con e2e docs
git commit -m "feat(dan-ga-me-con): khung Bức 4: tờ giấy cong dưới camera trực giao, gà bằng khối thô, Bản nét dò cạnh trên độ sâu (độ lệch khỏi mặt phẳng), chạy trên WebGPU và WebGL2" -m "<ghi số đo luật dừng: bốn điều, e2e hai backend, ms ở ba mức>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Bể hạt dùng chung `lib/tsl/particles.js`; Bức 1 chuyển sang mà mã shader không đổi; Sổ tay hiện code của hộp màu (LUẬT DỪNG)

**Mục tiêu:**
- Ghi mã WGSL và GLSL của đom đóm (compute khởi tạo, compute bước, material của Sprite) thành fixture, TRƯỚC khi đụng code của Bức 1.
- Rút phần chung lên `lib/tsl/particles.js`: cấp phát một lần, khởi tạo (WebGL2 hai lần), bước, đổi số lượng, rắc theo vòng đệm.
- Bức 1 dùng bể chung; mã shader giống fixture từng ký tự, chỉ khác số id của node.
- Sổ tay hiện được file `lib/tsl/*.js` mà lớp kê (§20.6 mục 4).

**Files:**
- Create:
  - `src/lib/tsl/particles.js`, `tests/unit/particles.test.js`;
  - `tests/paintings/ao-sen-dem/vang-la-ma.test.js`, `tests/paintings/ao-sen-dem/__fixtures__/vang-la/{webgpu,webgl2}-{init,step,sprite}.txt`.
- Modify:
  - `tests/helpers/nodes.js` (`compileCompute`);
  - `src/paintings/ao-sen-dem/layers/l5-vang-la.js`, `src/paintings/ao-sen-dem/meta.js` (Vàng lá kê `lib/tsl/particles.js`);
  - `src/ui/code-view.js` (glob), `src/engine/contracts/painting.js` (JSDoc `LayerMeta.files`);
  - `tests/paintings/contract.test.js` (file `lib` được kê thì phải được import);
  - spec §20.7.

**Interfaces:**
- Produces:
  - `tests/helpers/nodes.js#compileCompute(computeNode, backend, { renderer }?) → { code, problems, uniforms }`.
  - `lib/tsl/particles.js`:
    - `COUNT_FLOOR = 100`;
    - `createPool({ capacity, count?, init, law, spawn?, tier, renderer })` trả
      `{ a, b, initNode, stepNode, batch, count (getter), setCount(n, ...objects) → n, emit({ origin: [x, y, z], count, seed, still? }) →
      { start, size } | null, step(dt, w) → boolean, emitted() → number, dispose() }`;
    - `init`, `law` nhận `{ a, b, index }`; `spawn` nhận `{ a, b, index, k, batch }`;
    - `batch = { start: uint, count: uint, origin: vec3, seed: float, still: float }` (uniform).
  - Lệch spec (sửa §20.7 trong task này): `createPool` nhận `renderer` và `tier` lúc dựng, vì khởi tạo chạy ngay lúc đó; nên
    `step(dt, w)` không nhận lại `renderer`. Vòng đệm của nắm quấn theo số phần tử đang tính (`count`), không theo `capacity`: nắm rơi vào
    phần không được tính thì không ai thấy.

- [ ] **Step 1: `compileCompute`** — thêm vào `tests/helpers/nodes.js` (sửa dòng 1: "… dịch material và compute node ra WGSL/GLSL …"):

```js
/**
 * Dịch một compute node ra mã như renderer làm ở lần compute đầu (NodeManager.getForCompute của r186): WGSL cho WebGPU; GLSL cho WebGL2
 * (vertex shader của transform feedback). Lỗi và cảnh báo của TSL gom vào `problems` như compileMaterial.
 * @param {any} computeNode
 * @param {'webgpu' | 'webgl2'} backend
 * @param {{ renderer?: any }} [options]
 * @returns {{ code: string, problems: string[], uniforms: string[] }}
 */
export function compileCompute(computeNode, backend, { renderer = compileRenderer(backend) } = {}) {
  const builder = renderer.backend.createNodeBuilder(null, renderer);
  builder.compute = computeNode;
  const problems = [];
  const saved = { error: console.error, warn: console.warn };
  console.error = (...args) => problems.push(args.map(String).join(' '));
  console.warn = console.error;
  try {
    builder.build();
  } finally {
    Object.assign(console, saved);
  }
  return { code: builder.computeShader, problems, uniforms: builder.uniforms.compute.map((u) => u.name) };
}
```

- [ ] **Step 2: Test so mã của đom đóm** — `tests/paintings/ao-sen-dem/vang-la-ma.test.js`. Test lấy compute node qua lời gọi của renderer
  giả, nên không cần sửa code Bức 1 để test được, trước cũng như sau khi rút.

```js
// tests/paintings/ao-sen-dem/vang-la-ma.test.js — mã shader của đom đóm (compute khởi tạo, compute bước, material của Sprite) giống từng ký tự bản ghi TRƯỚC khi rút bể hạt lên lib/tsl/particles.js (spec §20.7); số id của node trong tên được thay bằng '#'.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileCompute, compileMaterial } from '../../helpers/nodes.js';

/**
 * Tên mang số id của node. id tăng theo thứ tự node được tạo trong cả lần chạy test, nên đổi khi code dựng node theo thứ tự khác mà mã
 * không đổi. GLSL: NodeBuffer_<id>, buffer<id> (GLSLNodeBuilder); WGSL: NodeBuffer_<id> (WGSLNodeBuilder). Chỉ thêm tên vào đây khi đã
 * đọc trong mã nguồn của three rằng số trong tên là id của node.
 */
const normalize = (code) => code.replace(/\b(NodeBuffer_|buffer)\d+\b/g, '$1#');
const fixture = (backend, name) => `./__fixtures__/vang-la/${backend}-${name}.txt`;

describe.each(['webgpu', 'webgl2'])('Vàng lá: mã shader của đom đóm không đổi khi rút bể hạt (%s)', (backend) => {
  const built = buildPainting(painting, meta, { tier: backend });
  const calls = built.ctx.renderer.compute.mock.calls;
  const init = calls[0][0]; // lần compute đầu là khởi tạo, chạy ngay lúc dựng lớp
  built.layers['vang-la'].update(1 / 60, 1); // một bước: lần compute cuối là kernel bước
  const step = calls.at(-1)[0];
  const sprite = built.layers['vang-la'].objects.find((o) => o.name === 'dom-dom');

  it.each([['init', init], ['step', step]])('compute %s', async (name, node) => {
    const { code, problems } = compileCompute(node, backend);
    expect(problems).toEqual([]);
    expect(code.length).toBeGreaterThan(200);
    await expect(normalize(code)).toMatchFileSnapshot(fixture(backend, name));
  });

  it('material của Sprite (vertex và fragment)', async () => {
    const { vertexShader, fragmentShader, problems } = compileMaterial(sprite, built.ctx, backend);
    expect(problems).toEqual([]);
    await expect(normalize(`${vertexShader}\n// ---- fragment ----\n${fragmentShader}`)).toMatchFileSnapshot(fixture(backend, 'sprite'));
  });
});
```

- [ ] **Step 3: Ghi fixture, rồi commit RIÊNG trước khi rút** (luật dừng: fixture phải có trong git trước khi code đổi).
  - Run: `npx vitest run tests/paintings/ao-sen-dem/vang-la-ma.test.js`. Lần đầu Vitest ghi sáu file fixture.
  - Mở một file. Mã phải thật: WGSL có `@compute`, GLSL có `NodeBuffer_#`.
  - `compileCompute` ném lỗi trong Node thì tìm nguyên nhân (systematic-debugging) và sửa helper. Không ghi được fixture thì DỪNG, báo Bao.
  - Chạy lại lần hai: phải xanh, và `git status` không có fixture nào đổi (mã tất định).

```bash
git add tests/helpers/nodes.js tests/paintings/ao-sen-dem/vang-la-ma.test.js tests/paintings/ao-sen-dem/__fixtures__
git commit -m "test(ao-sen-dem): ghi mã WGSL và GLSL của đom đóm thành fixture trước khi rút bể hạt (spec §20.7); helper compileCompute" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 4: Test bể hạt (đỏ trước)** — `tests/unit/particles.test.js`:

```js
// tests/unit/particles.test.js — bể hạt dùng chung (lib/tsl/particles.js, GĐ 8): cấp phát một lần; sàn của count; không bước khi dt = 0 hay trọng số 0; WebGL2 khởi tạo hai lần; vòng đệm của emit; hàng đợi có trần; dịch được ở hai backend.
import { describe, it, expect, vi } from 'vitest';
import { float, vec3, vec4 } from 'three/tsl';
import { COUNT_FLOOR, createPool } from '../../src/lib/tsl/particles.js';
import { compileCompute } from '../helpers/nodes.js';

const init = ({ a, b }) => {
  a.assign(vec4(0));
  b.assign(vec4(0));
};
const law = ({ a, b }) => {
  a.assign(vec4(a.xyz.add(b.xyz), a.w));
  b.assign(b);
};
const spawn = ({ a, b, k, batch }) => {
  a.assign(vec4(batch.origin, float(k)));
  b.assign(vec4(vec3(0, 1, 0), batch.seed));
};
const make = (options = {}) => {
  const renderer = { compute: vi.fn() };
  const pool = createPool({ capacity: 1000, count: 300, init, law, spawn, tier: 'webgpu', renderer, ...options });
  return { renderer, pool };
};
const ORIGIN = [0, 0, 0];

describe('createPool', () => {
  it('cấp phát MỘT lần theo capacity: hai bộ đệm vec4; đổi count không tạo bộ đệm mới', () => {
    const { pool } = make();
    const a = pool.a.value;
    expect([a.count, pool.b.value.count, a.itemSize]).toEqual([1000, 1000, 4]);
    pool.setCount(900);
    expect(pool.a.value).toBe(a);
  });

  it('setCount: sàn COUNT_FLOOR (100), trần capacity; đổi count của compute bước và của mọi vật vẽ truyền vào', () => {
    const { pool } = make();
    const sprite = { count: 0 };
    expect(pool.setCount(5, sprite)).toBe(COUNT_FLOOR);
    expect(sprite.count).toBe(100);
    expect(pool.setCount(5000, sprite)).toBe(1000);
    expect([pool.count, pool.stepNode.count, sprite.count]).toEqual([1000, 1000, 1000]);
  });

  it('khởi tạo ngay lúc dựng: WebGPU một lần, WebGL2 hai lần (cả hai bản ping-pong có dữ liệu, Phụ lục A.29)', () => {
    expect(make().renderer.compute).toHaveBeenCalledTimes(1);
    expect(make({ tier: 'webgl2' }).renderer.compute).toHaveBeenCalledTimes(2);
  });

  it('step: không chạy khi dt = 0 (update(0, t) của ?freeze) hay trọng số ≤ 0; có thì chạy đúng một compute bước', () => {
    const { pool, renderer } = make();
    renderer.compute.mockClear();
    expect(pool.step(0, 1)).toBe(false);
    expect(pool.step(1 / 60, 0)).toBe(false);
    expect(renderer.compute).not.toHaveBeenCalled();
    expect(pool.step(1 / 60, 1)).toBe(true);
    expect(renderer.compute).toHaveBeenCalledExactlyOnceWith(pool.stepNode);
  });

  it('emit: nắm nối tiếp trên vòng đệm của số phần tử đang tính, quấn qua cuối; nắm lớn hơn bể thì cắt; mỗi bước một nắm', () => {
    const { pool } = make();
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 1 })).toEqual({ start: 0, size: 120 });
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 2 })).toEqual({ start: 120, size: 120 });
    expect(pool.emit({ origin: ORIGIN, count: 120, seed: 3 })).toEqual({ start: 240, size: 120 }); // 240 + 120 quấn về 60
    expect(pool.emit({ origin: ORIGIN, count: 999, seed: 4 })).toEqual({ start: 60, size: 300 });
    pool.step(1 / 60, 1);
    expect([pool.batch.start.value, pool.batch.count.value, pool.batch.seed.value]).toEqual([0, 120, 1]);
    pool.step(1 / 60, 1);
    expect([pool.batch.start.value, pool.batch.seed.value]).toEqual([120, 2]);
    for (let i = 0; i < 3; i += 1) pool.step(1 / 60, 1);
    expect(pool.batch.count.value).toBe(0); // hết hàng đợi: không phần tử nào khởi tạo lại
    expect(pool.emitted()).toBe(300); // số phần tử đã rắc còn trong vòng đệm: không quá số đang tính
  });

  it('chạm dồn lúc khung đứng: hàng đợi giữ tối đa 16 nắm (bỏ nắm cũ nhất); đổi count giữa chừng thì đầu nắm vẫn trong vòng', () => {
    const { pool } = make();
    for (let i = 0; i < 40; i += 1) pool.emit({ origin: ORIGIN, count: 10, seed: i });
    pool.setCount(100);
    pool.step(1 / 60, 1);
    expect(pool.batch.seed.value).toBe(24); // 40 − 16
    expect(pool.batch.start.value).toBeLessThan(100);
  });

  it('bể không có spawn thì không rắc được (lỗi tiếng Việt); nắm 0 hạt không vào hàng đợi', () => {
    expect(() => make({ spawn: null }).pool.emit({ origin: ORIGIN, count: 10, seed: 1 })).toThrow(/spawn/);
    expect(make().pool.emit({ origin: ORIGIN, count: 0, seed: 1 })).toBeNull();
  });

  it.each(['webgpu', 'webgl2'])('%s: compute bước dịch được, có nhánh rắc (phép chia lấy dư trên chỉ số)', (backend) => {
    const { pool } = make({ tier: backend });
    const { code, problems } = compileCompute(pool.stepNode, backend);
    expect(problems).toEqual([]);
    expect(code).toMatch(/%/);
  });
});
```

  Run: `npx vitest run tests/unit/particles.test.js`. Expected: FAIL ("Failed to load …/particles.js").

- [ ] **Step 5: `src/lib/tsl/particles.js`:**

```js
// lib/tsl/particles.js — bể hạt compute dùng chung (luật hai lần: đom đóm của Bức 1, thóc của Bức 4): cấp phát một lần, khởi tạo, bước, đổi số lượng, rắc theo vòng đệm.
import { Vector3 } from 'three/webgpu';
import { Fn, If, instanceIndex, instancedArray, uniform } from 'three/tsl';

/** Sàn của số phần tử được tính và vẽ: sprite có count > 1 mới có cache key riêng; về 0 hay 1 là biên dịch lại. */
export const COUNT_FLOOR = 100;
/** Hàng đợi rắc giữ tối đa chừng này nắm (bỏ nắm cũ nhất): chạm dồn lúc khung đứng không làm hàng đợi phình mãi. */
const QUEUE_MAX = 16;

/**
 * Một bể hạt trên GPU. Mỗi phần tử có hai ô vec4 `a`, `b` trong hai bộ đệm; bể không biết ý nghĩa của chúng (bức quyết).
 * - Mỗi kernel chỉ đụng hai bộ đệm: WebGL2 chạy compute bằng transform feedback, tối đa bốn bộ đệm mỗi kernel.
 * - Luật chỉ đọc và ghi CHÍNH phần tử của nó: trên WebGL2, element(i) bỏ qua i (Phụ lục A.10). Thứ cần đi giữa các phần tử, hay từ JS
 *   vào, đi qua uniform.
 * - Mọi nhánh của init, law, spawn phải gán CẢ a lẫn b: transform feedback ghi mọi phần tử mỗi lần chạy, nhánh không gán là ghi rác.
 * - Rắc: emit() xếp một nắm vào hàng đợi; mỗi bước lấy một nắm ra, ghi vào uniform `batch`. Phần tử nào thuộc nắm thì gọi spawn để tự
 *   khởi tạo lại, phần tử khác gọi law. Nắm nối tiếp nhau trên vòng đệm của số phần tử đang tính, nên nắm mới đè lên hạt cũ nhất.
 * - File này không đặt tên uniform: một bức có thể dựng hai bể.
 *
 * @param {object} p
 * @param {number} p.capacity   số phần tử tối đa, cấp phát MỘT lần (trần của núm số lượng)
 * @param {number} [p.count]    số phần tử được tính và vẽ lúc đầu (mặc định capacity)
 * @param {(e: { a: any, b: any, index: any }) => void} p.init   TSL: gán giá trị đầu cho a, b
 * @param {(e: { a: any, b: any, index: any }) => void} p.law    TSL: một bước của một phần tử
 * @param {((e: { a: any, b: any, index: any, k: any, batch: object }) => void) | null} [p.spawn]
 *   TSL: phần tử thứ k (uint, 0 … số hạt − 1) của nắm vừa rắc tự khởi tạo lại; thiếu thì bể không rắc được
 * @param {'webgpu'|'webgl2'} p.tier
 * @param {{ compute: (node: any) => void }} p.renderer
 */
export function createPool({ capacity, count = capacity, init, law, spawn = null, tier, renderer }) {
  const a = instancedArray(capacity, 'vec4');
  const b = instancedArray(capacity, 'vec4');
  const element = () => ({ a: a.element(instanceIndex), b: b.element(instanceIndex), index: instanceIndex });
  const clampCount = (n) => Math.max(COUNT_FLOOR, Math.min(Math.round(n), capacity));
  let active = clampCount(count);
  const ring = uniform(active, 'uint'); // vòng đệm của nắm quấn theo số phần tử đang tính
  const batch = {
    start: uniform(0, 'uint'),
    count: uniform(0, 'uint'),
    origin: uniform(new Vector3()),
    seed: uniform(0),
    still: uniform(0),
  };

  // Khởi tạo CẢ bộ đệm (theo capacity): tăng count lúc chạy thì phần tử mới đã có giá trị.
  const initNode = Fn(() => {
    init(element());
  })().compute(capacity);
  renderer.compute(initNode);
  // WebGL2: mỗi bộ đệm có HAI bản (một để đọc, một để ghi, đổi vai sau mỗi lần chạy), và kernel bước chỉ ghi [0, count). Khởi tạo lần
  // nữa để bản kia cũng đầy (Phụ lục A.29); không thì tăng count lúc chạy, phần tử mới đọc bản chưa từng được ghi.
  if (tier === 'webgl2') renderer.compute(initNode);

  const stepNode = Fn(() => {
    const e = element();
    if (!spawn) {
      law(e);
      return;
    }
    // Thứ tự trong nắm: (chỉ số − đầu nắm + vòng) mod vòng. Cộng vòng trước khi trừ để số không âm (uint).
    const k = instanceIndex.add(ring).sub(batch.start).mod(ring).toVar();
    If(k.lessThan(batch.count), () => {
      spawn({ ...e, k, batch });
    }).Else(() => {
      law(e);
    });
  })().compute(active);

  const queue = [];
  let head = 0;
  let emitted = 0;
  return {
    a,
    b,
    initNode,
    stepNode,
    batch,
    /** Số phần tử đang được tính và vẽ. */
    get count() {
      return active;
    },
    /** Đổi số phần tử được tính, và `count` của mọi vật vẽ truyền vào. Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
    setCount(n, ...objects) {
      active = clampCount(n);
      stepNode.count = active; // WebGPU tính lại số nhóm dispatch, WebGL2 vẽ ít hay nhiều đỉnh hơn
      ring.value = active;
      head %= active;
      for (const o of objects) o.count = active;
      return active;
    },
    /** Xếp một nắm vào hàng đợi; bước kế tiếp còn trống thì nó khởi tạo lại các phần tử của nắm. Trả chỗ của nắm trên vòng đệm. */
    emit({ origin, count: n, seed, still = false }) {
      if (!spawn) throw new Error('Bể hạt này không có spawn: không rắc được.');
      const size = Math.min(Math.max(Math.round(n), 0), active);
      if (size === 0) return null;
      const start = head % active;
      head = (start + size) % active;
      emitted += size;
      queue.push({ start, size, origin, seed, still });
      if (queue.length > QUEUE_MAX) queue.shift();
      return { start, size };
    },
    /**
     * Một bước của cả bể. dt = 0 (xưởng vẽ lại khung đứng yên của ?freeze) hay trọng số ≤ 0: không làm gì, nắm đang chờ vẫn chờ.
     * Mỗi bước tối đa một nắm; không có nắm thì batch.count = 0 và mọi phần tử theo law.
     */
    step(dt, w) {
      if (dt === 0 || !(w > 0)) return false;
      const next = queue.shift();
      batch.count.value = next ? next.size : 0;
      if (next) {
        batch.start.value = next.start % active; // count có thể đã giảm từ lúc emit
        batch.origin.value.set(...next.origin);
        batch.seed.value = next.seed;
        batch.still.value = next.still ? 1 : 0;
      }
      renderer.compute(stepNode);
      return true;
    },
    /** Số phần tử đã rắc còn trong vòng đệm (chưa bị nắm sau đè): không quá số đang tính. */
    emitted: () => Math.min(emitted, active),
    dispose() {
      initNode.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      stepNode.dispose();
    },
  };
}
```

  Run: `npx vitest run tests/unit/particles.test.js`. Expected: xanh. Rồi `npx vitest run tests/rules`: `lib/tsl` không chứa từ vựng của
  bức nào, chỉ import `three`.

- [ ] **Step 6: Bức 1 dùng bể chung.** Sửa `src/paintings/ao-sen-dem/layers/l5-vang-la.js`:
  - Import: bỏ `instanceIndex`, `instancedArray`; thêm `import { COUNT_FLOOR, createPool } from '../../../lib/tsl/particles.js';`. Bỏ
    hằng `COUNT_FLOOR` của file (dùng hằng của bể; cùng số 100).
  - Thay đoạn từ "Hai bộ đệm nằm trên GPU…" tới hết kernel bước (dòng 59–107) bằng đoạn dưới. Thân `law` chép NGUYÊN VĂN thân kernel bước
    cũ, kể cả marker `// @knob`; chỉ đổi tên hai biến đầu (`cell`, `vs` là tham số). Thân `init` chép nguyên văn; biến góc `a` cũ đổi tên
    thành `ang`, vì `a` giờ là tham số.

```js
  // Bể hạt dùng chung (lib/tsl/particles.js): hai bộ đệm trên GPU, mỗi con một ô vec4 ở mỗi bộ đệm, cấp theo TRẦN của núm một lần.
  // a = xyz vị trí, w pha nhấp nháy [0, 1); b = xyz vận tốc, w hạt giống riêng [0, 1).
  const pool = createPool({
    capacity,
    count: wanted,
    tier: ctx.tier,
    renderer: ctx.renderer,
    // Khởi tạo: mỗi luồng GPU lo MỘT con. hash(index) là ngẫu nhiên tất định, √u cho mật độ đều theo diện tích đĩa.
    init: ({ a, b, index: i }) => {
      const r = sqrt(hash(i)).mul(FLOCK.radius);
      const ang = hash(i.add(1)).mul(Math.PI * 2);
      const y = mix(FLOCK.low, FLOCK.high, hash(i.add(2)));
      a.assign(vec4(cos(ang).mul(r), y, sin(ang).mul(r), hash(i.add(3))));
      b.assign(vec4(0, 0, 0, hash(i.add(4))));
    },
    // Một bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình.
    law: ({ a: cell, b: vs }) => {
      const p = cell.xyz.toVar();
      // … (chép nguyên văn phần còn lại của kernel bước cũ, tới `vs.assign(vec4(v, vs.w));`)
    },
  });
```

  - Sprite: `cell: pool.a.toAttribute()`, `count: pool.count`.
  - `applyCount`: `const n = pool.setCount(Math.min(wanted, cap), sprite); cpu?.setCount(n);`.
  - `update`: giữ nguyên dòng chặn `if (w.value <= 0 || dt === 0) return;`; nhánh GPU gọi `pool.step(dt, w.value)`.
  - `dispose`: `pool.dispose()` thay cho `init.dispose(); step.dispose();`.
  - Chú thích về WebGL2 chạy khởi tạo hai lần chuyển vào bể (đã có ở Step 5), không lặp lại ở đây.

- [ ] **Step 7: LUẬT DỪNG: so với fixture.**
  - Run: `npx vitest run tests/paintings/ao-sen-dem`. Expected: xanh, kể cả `vang-la-ma.test.js` (sáu fixture không đổi) và
    `vang-la.test.js`.
  - Fixture khác:
    - Đọc diff. Nếu khác chỉ ở một tên mang số id khác (đã đọc trong mã nguồn three), thêm tên đó vào `normalize`. KHÔNG cập nhật fixture
      (`-u`).
    - Khác thật (thứ tự câu lệnh, biến, phép tính) thì thử đưa thứ tự dựng node trong bể về như cũ. Không được thì DỪNG, báo Bao: gửi diff.
      Đường lùi (§20.11): `git checkout` l5-vang-la.js về như cũ, giữ `lib/tsl/particles.js` cho riêng Bức 4, ghi việc chuyển Bức 1 vào
      §16.

- [ ] **Step 8: Sổ tay hiện code của hộp màu (test đỏ trước).** Thêm vào `tests/paintings/contract.test.js`, cạnh test "files của lớp
  (GĐ 5) …":

```js
  it('files của lớp (GĐ 8) chỉ kê file lib/tsl/ mà lớp thật sự import (thẳng hay qua part): Sổ tay không hiện code lớp không dùng', () => {
    const parts = `src/paintings/${slug}/parts/`;
    for (const layer of meta.layers) {
      const libs = layer.files.filter((f) => f.startsWith('lib/'));
      if (libs.length === 0) continue;
      const reached = new Set(layer.files.filter((f) => f.startsWith(`paintings/${slug}/layers/`)).flatMap((file) => {
        const start = `src/${file}`;
        return staticClosure(start, (rel) => (rel === start || rel.startsWith(parts) ? read(rel) : null));
      }));
      for (const lib of libs) {
        expect(lib, `lớp "${layer.id}": chỉ kê được file trong lib/tsl/`).toMatch(/^lib\/tsl\/[\w-]+\.js$/);
        expect(reached.has(`src/${lib}`), `lớp "${layer.id}" kê src/${lib} mà không import nó`).toBe(true);
      }
    }
  });
```

  Rồi trong `src/paintings/ao-sen-dem/meta.js`, lớp `vang-la` kê thêm `'lib/tsl/particles.js'` trong `files`. Run `npm test`: test "Sổ tay
  hiện được (glob ?code)" đỏ (`src/lib/tsl/particles.js nằm ngoài glob ?code`).

- [ ] **Step 9: Glob của Sổ tay.** `src/ui/code-view.js`: thêm `'../lib/tsl/*.js'` vào mảng glob, và một dòng chú thích: "Hộp màu (GĐ 8):
  file `lib/tsl` mà lớp kê trong files, như bể hạt của Vàng lá." `src/engine/contracts/painting.js`, JSDoc `LayerMeta.files`: "[8] kê
  được file `lib/tsl/*.js` mà lớp import (test hợp đồng giữ); hộp màu không có marker `// @knob`". Run `npm test`. Expected: xanh.

- [ ] **Step 10: Chạy thật Bức 1, cả hai backend.**
  - Run: `npm run build && npx playwright test e2e/ao-sen-dem.spec.js e2e/painting.spec.js --project=webgl2-swiftshader --grep "Ao Sen Đêm"`
  - Rồi run: `E2E_REAL_GPU=1 npx playwright test e2e/ao-sen-dem.spec.js e2e/painting.spec.js --project=webgpu-real-gpu --grep "Ao Sen Đêm"`
  - Expected: xanh cả hai, kể cả "CPU vs GPU" và đếm draw call.
  - Mở `npm run dev`, vào Bức 1, mở Sổ tay của Vàng lá, tab Chỉnh: thấy file `particles.js` trong hàng nút file.

- [ ] **Step 11: Sửa spec §20.7** (chữ ký `createPool`, `step(dt, w)`, vòng đệm theo `count`, mọi nhánh gán cả a lẫn b, trần hàng đợi 16).
  `npm test` xanh. Commit:

```bash
git add src/lib/tsl/particles.js tests/unit/particles.test.js src/paintings/ao-sen-dem src/ui/code-view.js src/engine/contracts/painting.js tests/paintings/contract.test.js docs
git commit -m "feat(lib): bể hạt compute dùng chung lib/tsl/particles.js (luật hai lần); đom đóm của Bức 1 chuyển sang, mã shader giống fixture; Sổ tay hiện code của hộp màu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tranh tự khép lại

**Mục tiêu:**
- `CameraSpec.home: { after, duration }`: buông tay `after` giây thì camera quay về góc ngang, góc dọc và zoom (camera phối cảnh: khoảng
  cách) của bức trong `duration` giây, theo smoothstep, đường ngắn nhất.
- Chạm hay kéo lại giữa chừng thì thôi. Giảm chuyển động: đủ `after` thì về một bước.
- Bức 4 khai báo `home: { after: 3, duration: 1.2 }`. Số đo `goc` của Cốt cho e2e.

**Files:**
- Create: `src/engine/gpu/home.js`, `tests/unit/home.test.js`.
- Modify:
  - `src/engine/gpu/stage.js` (`returnHome(dt)`), `src/engine/gpu/scene.js` (gọi trước `controls.update()`), `tests/unit/scene.test.js`;
  - `parts/cot-bo-cuc.js` (`CAMERA.home`, `viewAngle`), `layers/l1-cot.js` (số đo `goc`), `content.vi.js` (nhãn số đo);
  - `tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js`, `e2e/dan-ga-me-con.spec.js`.

**Interfaces:**
- Produces:
  - `engine/gpu/home.js`: `shortestAngle(a, b)`, `homeAt(from, to, k)`, `createHome({ camera, controls, spec, reduced }) → { step(dt) →
    boolean, dispose() }`. Dáng camera là `{ theta, phi, zoom, radius }`.
  - `stage.returnHome(dt)`.
  - `cot-bo-cuc.js#viewAngle(position: [x, y, z]) → độ`.

- [ ] **Step 1: Test (đỏ trước)** — `tests/unit/home.test.js`:

```js
// tests/unit/home.test.js — tranh tự khép lại (GĐ 8): đứng yên đủ after thì về trong duration; chạm giữa chừng thì thôi; đường ngắn nhất qua ±π; giảm chuyển động về một bước; camera trực giao về zoom, phối cảnh về khoảng cách; đổi cỡ khung giữa đường vẫn về đủ.
import { describe, it, expect } from 'vitest';
import { EventDispatcher, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three/webgpu';
import { createHome, homeAt, shortestAngle } from '../../src/engine/gpu/home.js';
import { fitCamera } from '../../src/engine/gpu/camera.js';

const SPEC = { kind: 'ortho', position: [0, 4, 10], target: [0, 1, 0], height: 12, home: { after: 3, duration: 1.2 } };
const TARGET = new Vector3(...SPEC.target);
/** OrbitControls giả: phát 'start', 'end' như thật; update() nhìn về điểm nhìn, như OrbitControls làm mỗi khung. */
function rig(camera, options = {}) {
  camera.position.set(...SPEC.position);
  const controls = Object.assign(new EventDispatcher(), { target: TARGET.clone() });
  controls.update = () => camera.lookAt(controls.target);
  const home = createHome({ camera, controls, spec: SPEC, ...options });
  return { controls, home };
}
/** Góc (độ) giữa hướng từ điểm nhìn tới camera và hướng của bức. */
function off(camera) {
  const a = camera.position.clone().sub(TARGET).normalize();
  const b = new Vector3(...SPEC.position).sub(TARGET).normalize();
  return (Math.acos(Math.min(1, a.dot(b))) * 180) / Math.PI;
}
const run = (home, seconds, dt = 1 / 60) => {
  for (let t = 0; t < seconds - 1e-9; t += dt) home.step(dt);
};
/** Kéo xoay như người xem: 'start', xoay quanh trục y `deg` độ (và đặt zoom), 'end'. */
function drag(controls, camera, deg, zoom = null) {
  controls.dispatchEvent({ type: 'start' });
  camera.position.sub(TARGET).applyAxisAngle(new Vector3(0, 1, 0), (deg * Math.PI) / 180).add(TARGET);
  if (zoom !== null) camera.zoom = zoom;
  controls.dispatchEvent({ type: 'end' });
}

describe('home', () => {
  it('shortestAngle và homeAt: đường ngắn nhất kể cả qua ±π; k = 0 là điểm đi, k = 1 là đích; êm ở đầu', () => {
    expect(shortestAngle(3, -3)).toBeCloseTo(2 * Math.PI - 6, 9);
    expect(shortestAngle(-3, 3)).toBeCloseTo(6 - 2 * Math.PI, 9);
    const from = { theta: 3, phi: 1, zoom: 2, radius: 5 };
    const to = { theta: -3, phi: 1.2, zoom: 1, radius: 7 };
    expect(homeAt(from, to, 0)).toEqual(from);
    const end = homeAt(from, to, 1);
    expect(Math.cos(end.theta)).toBeCloseTo(Math.cos(-3), 9);
    expect(end.theta).toBeGreaterThan(3); // đi qua π, không quay ngược gần một vòng
    expect([end.phi, end.zoom, end.radius]).toEqual([1.2, 1, 7]);
    expect(homeAt(from, to, 0.01).zoom).toBeCloseTo(2, 3);
  });

  it('camera trực giao: buông tay chưa đủ after thì đứng yên; đủ after thì về trong duration, cả góc lẫn zoom', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, 40, 2);
    run(home, 2.9);
    expect(off(camera)).toBeCloseTo(40, 3);
    run(home, 0.1 + 0.6);
    expect(off(camera)).toBeGreaterThan(1);
    expect(off(camera)).toBeLessThan(39);
    run(home, 0.7);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('chạm lại giữa đường về: thôi về ngay, camera ở yên chỗ đang dở', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, 40);
    run(home, 3.5);
    controls.dispatchEvent({ type: 'start' });
    const mid = off(camera);
    expect(mid).toBeGreaterThan(1);
    run(home, 5);
    expect(off(camera)).toBeCloseTo(mid, 9);
  });

  it('giảm chuyển động: đủ after thì về một bước, không lượn', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera, { reduced: true });
    drag(controls, camera, 40, 2);
    run(home, 2.98);
    expect(off(camera)).toBeCloseTo(40, 3);
    home.step(0.05);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('camera phối cảnh: về khoảng cách của bức (dolly đổi khoảng cách, không đổi zoom)', () => {
    const camera = new PerspectiveCamera();
    const { controls, home } = rig(camera);
    controls.dispatchEvent({ type: 'start' });
    camera.position.sub(TARGET).multiplyScalar(1.5).add(TARGET);
    controls.dispatchEvent({ type: 'end' });
    run(home, 4.3);
    expect(camera.position.distanceTo(TARGET)).toBeCloseTo(new Vector3(...SPEC.position).distanceTo(TARGET), 6);
  });

  it('đổi cỡ khung giữa đường về (fitCamera): vẫn về đủ góc và zoom', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    drag(controls, camera, -60, 2.5);
    run(home, 3.6);
    fitCamera(camera, SPEC, 390 / 844);
    run(home, 1);
    expect(off(camera)).toBeLessThan(1e-6);
    expect(camera.zoom).toBe(1);
  });

  it('chưa ai chạm thì không làm gì; dispose gỡ listener (buông tay sau đó không làm camera về)', () => {
    const camera = new OrthographicCamera();
    const { controls, home } = rig(camera);
    run(home, 10);
    expect(off(camera)).toBeLessThan(1e-9);
    home.dispose();
    drag(controls, camera, 30);
    run(home, 10);
    expect(off(camera)).toBeCloseTo(30, 6);
  });
});
```

  Thêm vào `tests/unit/scene.test.js`: `fakeStage` có `returnHome: vi.fn()`, và

```js
  it('GĐ 8: mỗi khung gọi stage.returnHome(dt) (tranh tự khép lại) TRƯỚC controls.update()', () => {
    const { stage, scene } = build();
    scene.step(16);
    expect(stage.returnHome).toHaveBeenCalledWith(1 / 60);
    expect(stage.returnHome.mock.invocationCallOrder[0]).toBeLessThan(stage.controls.update.mock.invocationCallOrder[0]);
  });
```

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `src/engine/gpu/home.js`:**

```js
// engine/gpu/home.js — tranh tự khép lại (CameraSpec.home, GĐ 8): buông tay đủ `after` giây thì camera êm êm quay về góc của bức trong `duration` giây; phần tính là hàm thuần.
import { Spherical, Vector3 } from 'three/webgpu';

const TAU = Math.PI * 2;
const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));

/** Hiệu góc a → b theo đường ngắn nhất, trong (−π, π]. */
export function shortestAngle(a, b) {
  const d = (((b - a) % TAU) + TAU) % TAU;
  return d > Math.PI ? d - TAU : d;
}

/**
 * Dáng camera ở phần k ∈ [0, 1] của đường về: góc ngang theo đường ngắn nhất, góc dọc, zoom và khoảng cách, nội suy theo smoothstep
 * (êm ở hai đầu).
 * @param {{ theta: number, phi: number, zoom: number, radius: number }} from
 * @param {{ theta: number, phi: number, zoom: number, radius: number }} to
 * @param {number} k
 */
export function homeAt(from, to, k) {
  const s = smooth(k);
  return {
    theta: from.theta + shortestAngle(from.theta, to.theta) * s,
    phi: from.phi + (to.phi - from.phi) * s,
    zoom: from.zoom + (to.zoom - from.zoom) * s,
    radius: from.radius + (to.radius - from.radius) * s,
  };
}

/** Tọa độ cầu của điểm p quanh điểm nhìn, như OrbitControls (trục y lên): theta quanh trục y, phi đo từ trục y. */
function sphericalOf(p, target) {
  const s = new Spherical().setFromVector3(p.clone().sub(target));
  return { theta: s.theta, phi: s.phi, radius: s.radius };
}

/**
 * Bộ đếm giờ trên OrbitControls. Sự kiện 'start' (chạm, kéo) thì thôi đếm và thôi về; 'end' (buông) thì đếm giờ đứng yên; đủ `after` giây
 * thì quay về. scene.js gọi step(dt) mỗi khung, TRƯỚC controls.update(): khi đang về, step đặt thẳng vị trí (và zoom) của camera, rồi
 * controls.update() nhìn về điểm nhìn như mọi khung. Quán tính của OrbitControls (dampingFactor 0,05 mỗi khung) đã tắt hẳn sau `after`
 * giây (sau 3 giây còn chừng 1/10 000), nên hai bên không giằng nhau.
 * Với ?freeze, vòng lặp dừng nên camera không tự về.
 * @param {{ camera: any, controls: any, spec: import('../contracts/runtime.js').CameraSpec, reduced?: boolean }} p
 */
export function createHome({ camera, controls, spec, reduced = false }) {
  const { after, duration } = spec.home;
  const goal = { ...sphericalOf(new Vector3(...spec.position), new Vector3(...spec.target)), zoom: 1 };
  let idle = null; // giây đứng yên kể từ lần buông tay; null: đang tương tác, hay đã về
  let trip = null; // { from, t }: đang trên đường về
  const onStart = () => {
    idle = null;
    trip = null;
  };
  const onEnd = () => {
    idle = 0;
    trip = null;
  };
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  const place = (pose) => {
    camera.position.copy(controls.target).add(new Vector3().setFromSphericalCoords(pose.radius, pose.phi, pose.theta));
    if (camera.isOrthographicCamera) {
      camera.zoom = pose.zoom;
      camera.updateProjectionMatrix();
    }
  };
  /** Một khung. Trả true khi vừa đặt lại camera. */
  function step(dt) {
    if (trip) {
      trip.t += dt;
      const k = reduced ? 1 : trip.t / duration;
      place(homeAt(trip.from, goal, k));
      if (k >= 1) trip = null;
      return true;
    }
    if (idle === null) return false;
    idle += dt;
    if (idle < after) return false;
    idle = null;
    trip = { from: { ...sphericalOf(camera.position, controls.target), zoom: camera.zoom ?? 1 }, t: 0 };
    return step(0);
  }
  return {
    step,
    dispose() {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    },
  };
}
```

- [ ] **Step 4: Nối vào sân khấu và cảnh.**
  - `stage.js`:
    - `import { createHome } from './home.js';`, `let home = null;`;
    - trong `useCamera`: `home?.dispose();` đầu hàm, và
      `home = spec.home ? createHome({ camera, controls, spec, reduced: reducedMotion }) : null;` trước `controls.update()`;
    - thêm `returnHome(dt) { home?.step(dt); }`, JSDoc: "Tranh tự khép lại (CameraSpec.home): một khung của bộ đếm. Gọi TRƯỚC
      controls.update()";
    - `dispose` gỡ `home`.
  - `scene.js#step`: `stage.returnHome(dt);` ngay sau `stage.breathe(t);`. Sửa chú thích một khung: "… → camera (thở, tự khép lại) → …".
  - Run: `npx vitest run tests/unit/home.test.js tests/unit/scene.test.js`. Expected: xanh.

- [ ] **Step 5: Bức 4: `home` và số đo `goc`.**
  - `cot-bo-cuc.js`: `CAMERA.home = { after: 3, duration: 1.2 }`, và

```js
/** Góc lệch (độ) của camera ở `position` khỏi góc nhìn của tranh, quanh điểm nhìn của tranh (số đo `goc` của Cốt). */
export function viewAngle(position) {
  const a = position.map((v, i) => v - CAMERA.target[i]);
  const b = CAMERA.position.map((v, i) => v - CAMERA.target[i]);
  const cos = a.reduce((s, v, i) => s + v * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
}
```

  - Test thêm vào `cot-bo-cuc.test.js`: `viewAngle(CAMERA.position)` là 0; xoay vị trí 30° quanh trục y qua điểm nhìn thì ra 30 (sai số
    1e-6).
  - `l1-cot.js`: `readouts: [{ id: 'goc', get: () => viewAngle(ctx.camera.position.toArray()).toFixed(1), unit: '°' }]`.
  - `content.vi.js`: `readouts.goc: 'Lệch khỏi góc của tranh'`.

- [ ] **Step 6: E2e** — thêm vào `e2e/dan-ga-me-con.spec.js` (import thêm `test.use` nếu cần):

```js
test.describe('Đàn Gà Mẹ Con · tranh tự khép lại', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });
  const goc = (page) => page.evaluate(() => Number(window.__sma.readouts('cot').find((r) => r.id === 'goc')?.value));
  /** Kéo ngang trên vách giấy (không chạm gà): OrbitControls xoay camera. */
  async function dragCamera(page) {
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 + 220, box.y + box.height * 0.25, { steps: 6 });
    await page.mouse.up();
  }

  test('kéo xoay thì góc lệch hơn 15°; buông tay rồi chờ thì camera về góc của tranh (dưới 1°)', SMOKE, async ({ page }, testInfo) => {
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    await dragCamera(page);
    await expect.poll(() => goc(page), { timeout: 15_000 }).toBeGreaterThan(15);
    await expect.poll(() => goc(page), { timeout: 90_000 }).toBeLessThan(1);
  });

  test('giảm chuyển động: buông tay thì camera đứng yên, đủ 3 giây cảnh thì về', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    await dragCamera(page);
    await expect.poll(() => goc(page), { timeout: 15_000 }).toBeGreaterThan(15);
    await expect.poll(() => goc(page), { timeout: 90_000 }).toBeLessThan(1);
  });
});
```

  Run e2e hai backend (lệnh của Task 1, Step 17, chỉ file `dan-ga-me-con.spec.js`). Expected: xanh.

- [ ] **Step 7: Sửa spec** §20.6 mục 3 (camera đặt thẳng vị trí rồi `controls.update()`; đọc `controls.target` lúc chạy). `npm test` xanh.
  Commit:

```bash
git commit -am "feat(xuong): tranh tự khép lại (CameraSpec.home, engine/gpu/home.js); Bức 4 về góc của tranh sau 3 giây, số đo goc" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`git add` thêm `src/engine/gpu/home.js tests/unit/home.test.js` trước: `-a` không thêm file mới.)

---

### Task 4: Hình gà, bố cục, Bản màu → ĐIỂM DUYỆT ẢNH (DỪNG)

**Mục tiêu:**
- Hình gà đủ phần, tròn mập như tượng đất (§20.3): gà mẹ (mình, đuôi, chân, mào, mỏ, mắt, con ong; hai cánh là hai mesh riêng) và gà con
  (mình, đuôi, chân, cánh, đầu, mỏ, mắt).
- Đầu gà con cúi được theo thuộc tính instance; thí nghiệm "Tấm bìa phẳng" (`biaPhang`).
- Lớp Bản màu: màu in theo phần và chỉ số màu, ánh sáng chia nấc; thí nghiệm "Tô mịn".
- Chụp ảnh, dựng trang ảnh riêng tư, DỪNG chờ Bao duyệt.

**Files:**
- Create: `layers/l2-ban-mau.js`, `parts/ban-mau-bang.js`, `tests/paintings/dan-ga-me-con/ban-mau.test.js`.
- Modify: `parts/cot-hinh-ga.js`, `parts/cot-bo-cuc.js` (`CHICK`, `beakTip`), `layers/l1-cot.js`, `meta.js`, `painting.js`, `content.vi.js`,
  `tests/paintings/dan-ga-me-con/{cot,cot-bo-cuc}.test.js`, `e2e/dan-ga-me-con.spec.js`.

**Interfaces:**
- Consumes: `shared.cot.recipe`, `PART` (qua `shared.cot.PART`), `HOMES`, `HEN`.
- Produces:
  - `cot-bo-cuc.js`:
    - `CHICK = { neck: [y, z], headDown, beak: [y, z], center }`: trục cổ trong khung của gà con, góc cúi tối đa (60°), đầu mỏ lúc
      ngẩng, độ cao tâm (cho tấm bìa);
    - `beakTip(k) → [ra trước, lên trên]`: đầu mỏ khi cúi phần k, đúng phép xoay của `positionNode`.
  - `cot-hinh-ga.js`:
    - `rotateAround(p, pivot, axis, angle)` (TSL, Rodrigues);
    - `flatten(p, center, view, keep)` (TSL);
    - `henGeometry({ segments }) → { body, wingL, wingR }`, `chickGeometry({ segments })`.
  - `shared.cot` thêm:
    - `PART`;
    - `view`: vec3 node đơn vị `normalize(CAMERA.position − CAMERA.target)`, hướng nhìn của tranh (tấm bìa phẳng; con ngươi của Bản nét);
    - `hen = { group, body, wingL, wingR, wing, nod, look, scratch }`: bốn uniform dáng, radian;
    - `chicks = { mesh, pose, head }`: `pose` là InstancedBufferAttribute vec4 (x, y, z, hướng), `head` là float 0–1, cả hai ghi mỗi khung;
    - Task 8 thêm `pose(state, k)`: Cốt ghi dáng của đàn gà vào `pose`, `head` và bốn uniform của gà mẹ, hòa về dáng nghỉ của `HOMES` theo k.
  - Bản màu bọc `recipe.fill` (§20.4).

- [ ] **Step 1: Test (đỏ trước).**
  - `cot-bo-cuc.test.js`: `beakTip(0)` là `CHICK.beak` (đảo thứ tự [z, y]); `beakTip(1)[1]` (độ cao đầu mỏ khi cúi hẳn) trong [−0,05; 0,1],
    tức mỏ chạm sàn.
  - `cot.test.js`, thêm:
    - gà mẹ là Group `ga-me` có đúng ba Mesh (mình, hai cánh), mọi material có `positionNode`;
    - gà con: `count` 10, `frustumCulled = false`; thuộc tính `pose`, `head` là `instancedDynamicBufferAttribute`, tìm bằng
      `compileMaterial(...).bufferAttributes`;
    - thí nghiệm `biaPhang` đổi một uniform, không biên dịch lại: `material.version` không đổi khi bật;
    - `it.each(['webgpu', 'webgl2'])`: ba vật dịch được ở `segments` 8 và 48, `problems` rỗng.
  - `ban-mau.test.js` (dựng `until: 'ban-mau'`):
    - mọi núm (`bands` 1 và 4, `edge` 0, `shade` 0 và 0,5) dịch được ở hai backend;
    - đồ thị màu của gà có uniform `w_ban_mau` (`compileMaterial(...).uniforms`);
    - thí nghiệm `toMin` là kiểu `'compare'`;
    - không đèn của three.

- [ ] **Step 2: Hình gà** (`cot-hinh-ga.js`). Mọi số là số thiết kế; chốt ở điểm duyệt ảnh.
  - Gà con, trong khung của nó (chân ở gốc, trước +z, lên +y):

    | Phần | Khối | Bán kính / cỡ | Tỉ lệ | Tâm |
    |---|---|---|---|---|
    | BODY | cầu | 0,45 | (1; 0,9; 1,25) | (0; 0,48; −0,05) |
    | TAIL | nón (đỉnh chĩa ra sau, ngóc lên 35°) | r 0,14, cao 0,3 | | (0; 0,62; −0,6) |
    | LEG ×2 | trụ | r 0,04, cao 0,22 | | (±0,14; 0,11; 0) |
    | WING ×2 | cầu dẹt | 0,3 | (0,35; 0,6; 1) | (±0,4; 0,5; −0,05) |
    | HEAD | cầu | 0,3 | | (0; 0,88; 0,38) |
    | BEAK | nón chĩa +z | r 0,07, cao 0,16 | | (0; 0,86; 0,72) |
    | EYE ×2 | cầu | 0,045 | | (±0,2; 0,95; 0,55) |

    `CHICK = { neck: [0.48, 0], headDown: 60°, beak: [0.86, 0.8], center: 0.45 }`: đầu xoay quanh tâm mình (y 0,48, z 0) chứ không quanh cổ,
    để mỏ chạm được sàn. Ở 60°, đầu mỏ hạ từ y 0,86 xuống chừng −0,02.
  - Gà mẹ: mình và đầu như bản khung của Task 1; các phần nhỏ (đuôi, chân, cánh, mỏ, mắt) lấy số của gà con nhân chừng 2,7. Thêm:
    - COMB: ba cầu nhỏ trên đỉnh đầu;
    - BEE ngậm ở mỏ: cầu dẹt r 0,12, tỉ lệ (1; 0,8; 1,4), cùng hai cánh ong là cầu dẹt mỏng; mọi phần của ong mang `PART.BEE`, nên đi
      theo đầu;
    - hai cánh là hai geometry riêng (`wingL`, `wingR`), mỗi cánh một Mesh. Cả ba Mesh nằm trong Group `ga-me`.

    Ba geometry xoay sẵn sang `HEN.heading` và dời tới `HEN.at` lúc dựng, nên `positionLocal` là tọa độ thế giới. Trục vai, trục cổ, khớp
    hông cũng đổi sang thế giới bằng JS lúc dựng.
  - `positionNode`, viết một lần trong `cot-hinh-ga.js`, dùng cho mọi mesh gà:

```js
/** Xoay điểm (hay pháp tuyến, khi pivot là vec3(0)) quanh trục đơn vị `axis` qua `pivot` một góc `angle` (công thức Rodrigues). */
export const rotateAround = (p, pivot, axis, angle) => {
  const v = p.sub(pivot);
  const c = cos(angle);
  return pivot.add(v.mul(c)).add(cross(axis, v).mul(sin(angle))).add(axis.mul(dot(axis, v).mul(float(1).sub(c))));
};

/** Tấm bìa phẳng: dẹt điểm p (thế giới) về mặt phẳng qua `center`, vuông góc với hướng nhìn `view` của tranh, còn `keep` phần (1: nguyên). */
export const flatten = (p, center, view, keep) => p.sub(view.mul(dot(p.sub(center), view).mul(float(1).sub(keep))));

/**
 * positionNode của mười gà con (InstancedMesh, ma trận instance là đơn vị: vị trí thật chỉ có trong shader, nên frustumCulled = false):
 * đầu (mọi phần từ HEAD trở lên) cúi quanh trục ngang qua CHICK.neck theo thuộc tính `head`; cả con quay theo hướng rồi dời tới chỗ
 * trong `pose`; rồi tấm bìa phẳng. normalLocal xoay theo, để nấc sáng đúng với đầu đã cúi.
 */
export function chickPosition({ pose, head, view, keep }) {
  return Fn(() => {
    const isHead = step(PART.HEAD - 0.5, attribute('part', 'float'));
    const a = head.mul(CHICK.headDown).mul(isHead);
    const neck = vec3(0, CHICK.neck[0], CHICK.neck[1]);
    const right = vec3(1, 0, 0);
    const up = vec3(0, 1, 0);
    const p = rotateAround(rotateAround(positionLocal, neck, right, a), vec3(0), up, pose.w);
    normalLocal.assign(rotateAround(rotateAround(normalLocal, vec3(0), right, a), vec3(0), up, pose.w));
    return flatten(p.add(pose.xyz), pose.xyz.add(vec3(0, CHICK.center, 0)), view, keep);
  })();
}
```

    Gà mẹ theo cùng cách, trong tọa độ thế giới:
    - đầu (mọi phần ≥ HEAD) xoay `nod` quanh trục ngang của gà mẹ qua cổ, rồi `look` quanh trục đứng qua cổ;
    - một chân (phần LEG, phía +z của gà mẹ: `step(HEN.at[1], positionLocal.z)`) xoay `scratch` quanh khớp hông;
    - mỗi cánh xoay `±wing` quanh trục vai (hướng phía trước của gà mẹ);
    - rồi `flatten` quanh tâm gà mẹ (y = `HEN.height / 2`).

    Bốn uniform đặt tên `henWing`, `henNod`, `henLook`, `henScratch`. `view` là vec3 đơn vị
    `normalize(CAMERA.position − CAMERA.target)`; `keep = mix(1, 0.05, biaPhang)` với `biaPhang` là uniform của thí nghiệm.
  - Lớp Cốt:
    - gà con: `material.positionNode = chickPosition({ pose, head, view, keep })`, với
      `pose = instancedDynamicBufferAttribute(poseAttr)` và `head = instancedDynamicBufferAttribute(headAttr)`: hai thuộc tính này ghi
      mỗi khung;
    - `pigment` dùng `instancedBufferAttribute`, ghi một lần từ `HOMES[i].pigment`;
    - `make('ga', pigment)` cho gà con; gà mẹ dùng `pigment = float(-1)`.
  - Núm `segments` dựng lại cả ba geometry (dispose cái cũ), như núm `sides` của Bức 2.
  - Thí nghiệm `biaPhang`: `toggle(on) { biaPhang.value = on ? 1 : 0; }`.

- [ ] **Step 3: Bản màu.** `parts/ban-mau-bang.js` (không import part của Cốt; `PART` nhận qua tham số):

```js
// paintings/dan-ga-me-con/parts/ban-mau-bang.js — của lớp Bản màu: bảng màu in theo phần của hình gà (năm màu tự nhiên của Đông Hồ), và ánh sáng chia nấc mềm mép.
import { floor, fract, fwidth, max, min, mix, smoothstep, step, float } from 'three/tsl';

/** Gà mẹ (spec §20.3): mình vàng hòe; cánh đỏ son; đuôi xanh; mào đỏ son; mỏ, chân vàng hòe; mắt mực; con ong vàng hòe (vằn mực ở nét trong). */
export const HEN_TOKENS = { BODY: 'hoe', TAIL: 'xanhDong', LEG: 'hoe', WING: 'sonSoi', HEAD: 'hoe', BEAK: 'hoe', COMB: 'sonSoi', EYE: 'muc', BEE: 'hoe' };
/** Gà con: mỗi con một màu theo chỉ số trong HOMES; 'diep' là gà "trắng": để màu giấy, chỉ có nét. */
export const CHICK_TOKENS = ['hoe', 'sonSoi', 'xanhDong', 'muc', 'diep'];
/** Phần mang màu lông (theo màu riêng của gà con); phần khác theo bảng của gà mẹ. */
export const PLUMAGE = ['BODY', 'TAIL', 'WING', 'HEAD'];

/**
 * Nấc sáng: l (0–1) chia `bands` nấc; mép nấc mềm trong fwidth(l·bands) + edge (chống răng cưa, rồi mềm thêm theo núm). Trả 0 (nấc tối)
 * … 1 (nấc sáng). bands = 1: phẳng hẳn (luôn 1). smoothstep(1 − soft, 1, …) có 1 − soft < 1 vì soft ≥ 1e-3.
 */
export function bandOf(l, bands, edge) {
  const x = l.mul(bands);
  const soft = max(fwidth(x).add(edge), 1e-3);
  const k = floor(x).add(smoothstep(float(1).sub(soft), float(1), fract(x)));
  const stair = min(k, bands.sub(1)).div(max(bands.sub(1), 1));
  return mix(float(1), stair, step(1.5, bands));
}
```

  `layers/l2-ban-mau.js`:
  - `knobs`:
    - `{ id: 'bands', min: 1, max: 4, step: 1, value: 2 }`;
    - `{ id: 'edge', min: 0, max: 0.5, step: 0.01, value: 0.04 }`;
    - `{ id: 'shade', min: 0, max: 0.6, step: 0.01, value: 0.18 }`.
  - Bảng màu là hai `uniformArray` Color, dựng từ `ctx.palette.color(token)`:
    - một mảng chỉ số theo `PART`: màu của gà mẹ, và phần không phải lông của gà con;
    - một mảng chỉ số theo `pigment`.

    Cùng một `uniformArray` cờ "lông" theo `PART`.
  - Bọc `recipe.fill` (thân chạy lúc biên dịch):

```js
  const bands = ctx.knob('bands'); // @knob bands
  const edge = ctx.knob('edge'); // @knob edge
  const shade = ctx.knob('shade'); // @knob shade
  const prev = cot.recipe.fill;
  cot.recipe.fill = (s) => {
    if (s.kind === 'giay') return prev(s); // tờ giấy là việc của Giấy điệp
    const tint = s.kind === 'thoc' ? hoe : mix(partColors.element(int(s.part)), pigmentColors.element(int(max(s.pigment, 0))),
      plumage.element(int(s.part)).mul(step(0, s.pigment)));
    const l = max(dot(s.n, cot.sun), 0);
    const q = mix(bandOf(l, bands, edge), l, smoothLight);
    const printed = tint.mul(mix(float(1).sub(shade), float(1), q));
    return mix(prev(s), printed, w);
  };
```

    Mỗi núm một dòng có marker, như mẫu Task 1. `smoothLight` là uniform của thí nghiệm "Tô mịn" (`toMin`, `kind: 'compare'`). Thóc có
    `s.part` = −1, nên nhánh `'thoc'` không đọc bảng.
  - `objects: []`.
  - `meta.js`, `painting.js`: chèn `ban-mau` giữa `cot` và `ban-net`.
  - `content.vi.js`: nhãn ba núm và thí nghiệm, Hiểu ngắn.

- [ ] **Step 4: Chạy unit, thấy xanh; `npm test` xanh; e2e hai backend** (lệnh của Task 1). Ảnh khung phải có màu: thêm vào e2e test "góc
  nhìn của tranh" một vùng `HEN` có `chroma` > 0,15, tức vàng hòe.
- [ ] **Step 5: Commit** trước điểm duyệt ảnh (Bao có thể chạy thử):

```bash
git commit -m "feat(dan-ga-me-con): hình gà đủ phần (đầu cúi, cánh, chân, tấm bìa phẳng), bố cục mười gà con, lớp Bản màu (chia nấc)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: ĐIỂM DUYỆT ẢNH (DỪNG).**
  - Chụp bằng Playwright headless, `channel: 'chromium'` (GPU thật), `?level=cao&freeze=120`:
    - góc nhìn của tranh ở 1280×800 DPR 2, và 390×844 DPR 3 (`devices['iPhone 13']`, isMobile);
    - ba góc xoay: kéo chuột ngang +200 px, −200 px, và dọc −150 px. Chụp trong lúc live, ngay sau khi buông tay, trước khi tranh tự khép
      lại;
    - từng lớp bằng `__sma.setWeight`: chỉ Cốt; Cốt + Bản màu; Cốt + Bản màu + Bản nét; đủ;
    - "Tấm bìa phẳng" bật, ở góc của tranh và ở một góc xoay.
  - Dựng một trang ảnh riêng tư (Artifact), như GĐ 6 và GĐ 7. Câu hỏi cho Bao:
    1. hình gà mẹ, gà con, con ong được chưa;
    2. bố cục: tờ giấy, chỗ của mười gà con, phần ván tối cho chữ;
    3. camera: góc chếch 20°, giới hạn xoay, ảnh trên điện thoại dọc;
    4. bản màu: màu từng con, độ đậm của nấc tối;
    5. muốn đổi gì.
  - Ghi vào sổ: `Task 4: STOPPED at gate`. Chờ Bao trả lời. Sửa theo ý Bao: số trong `cot-hinh-ga.js`, `cot-bo-cuc.js`,
    `ban-mau-bang.js`. Sửa §20.1 và §20.2 theo số đã chốt, và §20.4 lớp 1: gà con mang thuộc tính instance riêng (`pose`, `head`,
    `pigment`), ma trận instance giữ đơn vị, `frustumCulled = false`, như lá của Bức 3. Rồi mới sang Task 5.

---

### Task 5: Bản nét đủ: nét trong, lệch bản, mực không đều, hai thí nghiệm

**Mục tiêu:**
- Nét trong vẽ ngay trên vật (`recipe.ink`): vảy lông, con ngươi, nét cánh, nét đuôi, vằn ong.
- Mực không đều; lệch bản (`misregister`) cho viền.
- Thí nghiệm "Chỉ bản nét" (`chiNet`) và "Dò cạnh theo màu" (`netTheoMau`).

**Files:**
- Create: `parts/ban-net-net-trong.js`.
- Modify: `parts/ban-net-do-canh.js` (thêm `colorEdges`), `layers/l3-ban-net.js`, `meta.js` (files của `ban-net`), `content.vi.js`,
  `tests/paintings/dan-ga-me-con/ban-net.test.js`, `e2e/dan-ga-me-con.spec.js`.

**Interfaces:**
- Consumes: `shared.cot.recipe`, `shared.cot.PART`, `shared.cot.pixel`, `depthEdges` (Task 1).
- Produces:
  - `ban-net-net-trong.js`: `innerInk(s, { PART, view, width }) → float` (0–1), `scallops(uv, cells, width) → float`;
  - `ban-net-do-canh.js#colorEdges({ color, px, offset }) → float`.
  - Núm mới `misregister` (0–6, mặc định 1,5, điểm ảnh). Hai thí nghiệm như trên.

- [ ] **Step 1: Test (đỏ trước)** — thêm vào `ban-net.test.js` (dựng `until: 'ban-net'`):
  - `it.each(['webgpu', 'webgl2'])`: gà mẹ, gà con dịch được, `problems` rỗng, và đồ thị màu của chúng đọc uniform `w_ban_net`
    (`compileMaterial(...).uniforms`). Nét trong là việc của Bản nét, nên nó tắt theo trọng số của Bản nét.
  - Núm ở hai đầu dịch được (post: `nodesOf` dựng được đồ thị không ném; material: `compileMaterial`): `lineWidth` 0,5 và 3, `threshold`
    0,05 và 2, `crease` 0 và 1, `misregister` 0 và 6.
  - Hai thí nghiệm có trong `layer.experiments`, bật rồi tắt không ném; bật không đổi `material.version` (chỉ đổi uniform).
  - Bản nét kê đủ `files`: test hợp đồng tự kiểm.

- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: `parts/ban-net-net-trong.js`.** Mỗi nét là hàm khoảng cách 2D trên UV của phần (SphereGeometry: u quanh khối, v từ dưới
  lên; nón và trụ: u quanh trục). Nét dày theo ô của UV, mà ô to theo cỡ vật, nên nét to ra khi zoom.

```js
// paintings/dan-ga-me-con/parts/ban-net-net-trong.js — của lớp Bản nét: nét trong vẽ ngay trên vật (vảy lông, con ngươi, nét cánh, nét đuôi, vằn ong) bằng hàm khoảng cách 2D trên UV của từng phần.
import { abs, dot, float, fract, length, max, smoothstep, step, vec2 } from 'three/tsl';

/** Một nét: khoảng cách d (đơn vị ô UV) dưới nửa bề dày thì đậm, mép mềm. width > 0 nên width · 0,5 < width. */
const stroke = (d, width) => float(1).sub(smoothstep(width.mul(0.5), width, d));
/** Giữ phần v trong [lo, hi] (mép mềm). */
const band = (v, lo, hi) => smoothstep(lo - 0.05, lo + 0.05, v).mul(float(1).sub(smoothstep(hi - 0.05, hi + 0.05, v)));

/**
 * Vảy lông: hàng cung (nửa vòng tròn úp) xếp lệch nửa ô, trên nửa trên của mình (lưng, vai). `cells` = [số ô quanh mình, số ô từ chân lên
 * đỉnh]. Trong mỗi ô, tâm vòng ở giữa cạnh dưới, bán kính 0,45 ô: chỉ nửa trên của vòng nằm trong ô.
 */
export function scallops(uv, [cu, cv], width) {
  const row = uv.y.mul(cv).floor();
  const f = fract(vec2(uv.x.mul(cu).add(row.mul(0.5)), uv.y.mul(cv))).sub(vec2(0.5, 0));
  return stroke(abs(length(f).sub(0.45)), width).mul(band(uv.y, 0.55, 0.88));
}

/**
 * Độ phủ của nét trong (0–1) tại điểm tô s. Gà mẹ có s.pigment < 0; gà con có chỉ số màu ≥ 0.
 * - BODY: vảy lông (gà mẹ ô dày hơn, vì mình to gấp chừng 2,7 lần);
 * - WING: ba nét lông song song;
 * - TAIL: bốn nét dọc theo đuôi;
 * - EYE: con ngươi, phía mắt nhìn về người xem (pháp tuyến gần hướng nhìn của tranh `view`);
 * - BEE: ba vằn ngang.
 */
export function innerInk(s, { PART, view, width }) {
  const is = (part) => float(1).sub(step(0.5, abs(s.part.sub(part))));
  const hen = step(s.pigment, -0.5); // pigment −1: gà mẹ
  const body = scallops(s.uv, [14, 8], width).mul(hen).add(scallops(s.uv, [8, 5], width).mul(float(1).sub(hen)));
  const wing = stroke(abs(fract(s.uv.y.mul(3)).sub(0.5)).div(3), width.mul(0.35)).mul(band(s.uv.y, 0.1, 0.7));
  const tail = stroke(abs(fract(s.uv.x.mul(4)).sub(0.5)).div(4), width.mul(0.25));
  const pupil = smoothstep(0.78, 0.9, dot(s.n, view));
  const bee = stroke(abs(fract(s.uv.y.mul(6)).sub(0.5)).div(6), width.mul(0.2)).mul(band(s.uv.y, 0.25, 0.75));
  return max(max(body.mul(is(PART.BODY)), wing.mul(is(PART.WING))), max(max(tail.mul(is(PART.TAIL)), pupil.mul(is(PART.EYE))), bee.mul(is(PART.BEE))));
}
```

- [ ] **Step 4: `colorEdges`** — thêm vào `ban-net-do-canh.js`. Trên màu, Sobel là đúng: mảng màu phẳng, ranh mảng là bậc.

```js
/**
 * Dò cạnh theo màu (thí nghiệm "Dò cạnh theo màu"): Sobel trên độ sáng của ảnh màu (scene pass). Nét mọc ở ranh của nấc sáng, và mất ở
 * chỗ hai mảng cùng màu chồng nhau: điều mà độ sâu thấy, còn màu thì không.
 * @param {{ color: any, px: any, offset: any }} p   color: texture màu của scene pass (channel('output'))
 */
export function colorEdges({ color, px, offset }) {
  const texel = vec2(1).div(screenSize);
  const center = screenUV.add(offset.mul(texel));
  const lum = (x, y) => luminance(color.sample(center.add(vec2(x, y).mul(px).mul(texel))).rgb);
  const gx = lum(1, -1).add(lum(1, 0).mul(2)).add(lum(1, 1)).sub(lum(-1, -1)).sub(lum(-1, 0).mul(2)).sub(lum(-1, 1));
  const gy = lum(-1, 1).add(lum(0, 1).mul(2)).add(lum(1, 1)).sub(lum(-1, -1)).sub(lum(0, -1).mul(2)).sub(lum(1, -1));
  return smoothstep(0.08, 0.2, length(vec2(gx, gy)).div(4));
}
```

  (import thêm `length`, `luminance` từ `three/tsl`.)

- [ ] **Step 5: Lớp Bản nét đủ.** `l3-ban-net.js`:
  - Núm thêm `{ id: 'misregister', min: 0, max: 6, step: 0.1, value: 1.5 }`.
  - Uniform `chiNet`, `byColor` (hai thí nghiệm, tên `banNetChiNet`, `banNetTheoMau`).
  - Hằng `MISREGISTER_DIR = [0.82, -0.57]`: bản nét lệch xuống phải, như tờ giấy trượt khi in tay.
  - Bọc ba hàm của recipe:

```js
  const { recipe, PART, view } = shared.cot; // view: hướng nhìn của tranh (Cốt công bố ở Task 4)
  const diep = color(ctx.palette.color('diep'));
  const blotWorld = (s) => float(0.7).add(mx_noise_float(s.pos.mul(3.1)).mul(0.3)); // mực ăn giấy không đều
  const prevInk = recipe.ink;
  recipe.ink = (s) => max(prevInk(s), innerInk(s, { PART, view, width: float(0.09) }).mul(blotWorld(s)).mul(w));
  const prevFill = recipe.fill;
  recipe.fill = (s) => mix(prevFill(s), diep, chiNet); // "Chỉ bản nét": màu in thành trắng giấy, chỉ còn nét
```

  - Post:

```js
      build({ color: c, channel, weight, tap }) {
        tap('truoc-net', c);
        const px = ctx.knob('lineWidth'); // @knob lineWidth
        const offset = vec2(...MISREGISTER_DIR).mul(ctx.knob('misregister')); // @knob misregister
        const byDepth = depthEdges({
          depth: channel('depth'), span, px, offset,
          threshold: ctx.knob('threshold'), // @knob threshold
          crease: ctx.knob('crease'), // @knob crease
          pixel: shared.cot.pixel,
        });
        const edges = mix(byDepth, colorEdges({ color: channel('output'), px, offset }), byColor);
        const blot = float(0.75).add(mx_noise_float(vec3(screenCoordinate.xy.mul(0.06), 1.7)).mul(0.25)); // mực quét không đều
        return vec4(mix(c.rgb, muc, edges.mul(blot).mul(weight)), c.a);
      },
```

  - `experiments`: `chiNet` (toggle `chiNet.value`), `netTheoMau` (toggle `byColor.value`).
  - `meta.js`: `ban-net` kê thêm `parts/ban-net-net-trong.js`.
  - `content.vi.js`: nhãn núm, thí nghiệm (label + explain), Hiểu.

- [ ] **Step 6: Chạy unit, thấy xanh; `npm test` xanh.**
- [ ] **Step 7: E2e** — thêm `describe('Đàn Gà Mẹ Con · bản nét')`:
  - Mở `?freeze=60`. Đo vùng `PAPER_MID` (giữa tờ giấy, có gà; số chốt theo ảnh thật). Rồi `__sma.setWeight('ban-net', 0)`, `twoFrames`,
    đo lại. Expected: lúc có Bản nét, `mean` thấp hơn hẳn (≥ 0,02): điểm tối giảm hẳn khi tắt.
  - `__sma.restore({ knobs: { 'ban-net.misregister': 0 } })`, chụp checksum vùng `LEFT_EDGE`; rồi `misregister` 6, chụp lại. Expected:
    checksum khác.
  - Bật lần lượt `chiNet`, `netTheoMau` bằng `toggleExperiment` (helper có sẵn); `collectConsole` không có lỗi.
  - Run e2e hai backend.
- [ ] **Step 8: Sửa spec** §20.4 lớp 3 (số của nét trong, hướng lệch bản). Commit:

```bash
git commit -m "feat(dan-ga-me-con): Bản nét đủ: nét trong (vảy lông, con ngươi, cánh, đuôi, vằn ong), mực không đều, lệch bản, thí nghiệm Chỉ bản nét và Dò cạnh theo màu" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lớp Giấy điệp

**Mục tiêu:**
- Tờ giấy từ đất sét thành giấy dó quét điệp: màu ngà, sợi dó, vệt chổi xiên.
- Hạt điệp lấp lánh khi xoay tranh (emissive, Phủ bóng làm tỏa).
- Thí nghiệm "Giấy dó trơn" (`giayTron`); nấc `chi-tiet`.

**Files:**
- Create: `layers/l4-giay-diep.js`, `parts/giay-diep-mat.js`, `tests/paintings/dan-ga-me-con/giay-diep.test.js`.
- Modify: `meta.js` (thêm lớp `giay-diep` sau `ban-net`; files có `lib/tsl/noise.js`), `painting.js`, `quality.js` (thang:
  `'giay-diep.chi-tiet'` trước `'phu-bong.bloom'`), `content.vi.js`, `e2e/dan-ga-me-con.spec.js`.

**Interfaces:**
- Consumes: `shared.cot.recipe`, `shared.cot.sun`, `ctx.budget.paper`.
- Produces: `paperColor(s, opts) → vec3`, `glints(s, opts) → vec3`.

- [ ] **Step 1: Test (đỏ trước)** — `giay-diep.test.js` (dựng đủ tới `giay-diep`):
  - tờ giấy dịch được ở hai backend; đồ thị có `w_giay_diep`;
  - emissive của tờ giấy không còn là `vec3(0)` khi có lớp này: `compileMaterial(...).fragmentShader` có phép `reflect`;
  - nấc `chi-tiet` chỉ có khi `budget.paper > 1` (dựng với `budget: { paper: 1 }` thì không có), áp rồi gỡ thì số tầng về như cũ;
  - núm ở hai đầu (`density` 4 và 40, `sparkle` 0 và 4, `fiber` 0 và 1, `brush` 0 và 1) dịch được;
  - lớp kê `lib/tsl/noise.js` trong `files` và import nó (test hợp đồng tự kiểm).
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: `parts/giay-diep-mat.js`:**

```js
// paintings/dan-ga-me-con/parts/giay-diep-mat.js — của lớp Giấy điệp: giấy dó quét điệp trên UV của tờ giấy (đơn vị cảnh): sợi dó, vệt chổi xiên, hạt điệp lóe lên khi tia nắng phản xạ vào mắt.
import {
  cameraViewMatrix, cos, dot, float, floor, fract, hash, length, mix, normalize, pow, positionViewDirection, reflect, saturate, sin,
  smoothstep, vec2, vec3, vec4,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

/** Hướng của vệt chổi lá thông, so với trục u của tờ giấy (radian). */
const BRUSH_ANGLE = 0.5;
/** Mũ của tia phản xạ: lớn thì hạt chỉ lóe khi góc rất đúng. */
const SHINE = 80;

/**
 * Màu giấy dó quét điệp tại điểm tô s (s.uv theo đơn vị cảnh: u = x + 7, v = chiều dài cung).
 * - Sợi dó: fbm kéo dài theo v (tần số u cao, v thấp), những sợi mảnh chạy dọc tờ giấy; số tầng là node (theo mức, nấc chi-tiet).
 * - Vệt chổi: fbm kéo dài theo hướng xiên; lớp điệp dày mỏng theo đường chổi. Điệp sáng và ngà hơn nền dó.
 * - plain (thí nghiệm "Giấy dó trơn") bỏ hẳn lớp điệp.
 */
export function paperColor(s, { diep, octaves, fiber, brush, plain }) {
  const fibers = fbm(vec3(s.uv.x.mul(9), s.uv.y.mul(0.9), 0.5), { octaves });
  const along = s.uv.x.mul(cos(BRUSH_ANGLE)).add(s.uv.y.mul(sin(BRUSH_ANGLE)));
  const across = s.uv.y.mul(cos(BRUSH_ANGLE)).sub(s.uv.x.mul(sin(BRUSH_ANGLE)));
  const strokes = fbm(vec3(along.mul(0.35), across.mul(3), 2.3), { octaves: 2 });
  const coat = smoothstep(-0.2, 0.4, strokes).mul(brush).mul(float(1).sub(plain));
  const paper = mix(diep.mul(0.82), diep, coat); // nền dó sẫm hơn lớp điệp
  return paper.mul(float(1).sub(fibers.mul(0.06).mul(fiber)));
}

/**
 * Hạt điệp (emissive). Mặt giấy chia ô (`density` ô mỗi đơn vị); mỗi ô có MỘT hạt: một chấm nhỏ ở chỗ lệch ngẫu nhiên, với pháp tuyến
 * nghiêng ngẫu nhiên (băm theo ô). Hạt sáng khi tia nắng phản xạ trên nó đi vào mắt: pow(saturate(dot(reflect(−nắng, n_hạt), V)), mũ).
 * Tính trong không gian camera: V là positionViewDirection, three tự cho vec3(0, 0, 1) với camera trực giao (Phụ lục A.91), nên đứng
 * yên thì hạt đứng yên, xoay camera thì hạt khác lóe lên.
 */
export function glints(s, { sun, density, sparkle, tint }) {
  const grid = s.uv.mul(density);
  const cell = floor(grid);
  const seed = cell.x.mul(157).add(cell.y.mul(113)); // ô ≥ 0 vì UV của tờ giấy ≥ 0: số nguyên cho hash
  const r = [0, 1, 2, 3].map((k) => hash(seed.add(k)));
  const spot = float(1).sub(smoothstep(0.08, 0.14, length(fract(grid).sub(vec2(r[0], r[1]).mul(0.6).add(0.2)))));
  const tilted = normalize(s.n.add(vec3(r[2].sub(0.5), 0, r[3].sub(0.5)).mul(1.2)));
  const n = normalize(cameraViewMatrix.mul(vec4(tilted, 0)).xyz);
  const l = normalize(cameraViewMatrix.mul(vec4(sun, 0)).xyz);
  const shine = pow(saturate(dot(reflect(l.negate(), n), positionViewDirection)), SHINE);
  return tint.mul(shine.mul(spot).mul(sparkle));
}
```

- [ ] **Step 4: `layers/l4-giay-diep.js`:**
  - `knobs`:
    - `{ id: 'sparkle', min: 0, max: 4, step: 0.05, value: 1.2 }`;
    - `{ id: 'density', min: 4, max: 40, step: 1, value: 14 }`;
    - `{ id: 'fiber', min: 0, max: 1, step: 0.05, value: 0.5 }`;
    - `{ id: 'brush', min: 0, max: 1, step: 0.05, value: 0.6 }`.
  - `octaves = uniform(ctx.budget.paper ?? 3).setName('giayDiepOctaves')`, `plain = uniform(0).setName('giayDiepTron')`.
  - Bọc hai hàm (mỗi núm một dòng có marker):

```js
  const prevPaper = recipe.paper;
  recipe.paper = (s) => mix(prevPaper(s), paperColor(s, { diep, octaves, fiber, brush, plain }), w);
  const prevGlint = recipe.glint;
  recipe.glint = (s) => prevGlint(s).add(glints(s, { sun: shared.cot.sun, density, sparkle, tint: diep }).mul(w).mul(float(1).sub(plain)));
```

  - `experiments: [{ id: 'giayTron', toggle: (on) => { plain.value = on ? 1 : 0; } }]`.
  - `degrade`: chỉ khi `budget.paper > 1`:
    `[{ id: 'chi-tiet', apply() { octaves.value = full - 1; }, revert() { octaves.value = full; } }]`.
  - `objects: []`.
  - `meta.js`: thêm `{ id: 'giay-diep', name: 'Giấy điệp', files: ['…/l4-giay-diep.js', '…/giay-diep-mat.js', 'lib/tsl/noise.js'] }` sau
    `ban-net`. Kiểm: không lớp nào khác của Bức 4 kê `lib/tsl/noise.js` (mỗi file thuộc tối đa một lớp).
- [ ] **Step 5: Chạy unit, thấy xanh; `npm test` xanh.**
- [ ] **Step 6: E2e** — `describe('Đàn Gà Mẹ Con · giấy điệp')`:
  - `?freeze=60`: vùng `WALL` lúc có Giấy điệp có `chroma` lớn hơn lúc `giay-diep` về 0 ít nhất 0,03 (ngà so với xám đất sét), và
    `rgb[0] > rgb[2]` (kênh đỏ hơn kênh lam).
  - Hạt điệp đổi theo góc nhìn (live, không freeze):
    - Lột lớp về view Emissive: `value '2'`, `aria-valuetext` là `'Emissive'`. Viết helper `layerView(page, value, label)` từ `depthView`.
    - Checksum vùng `WALL` hai lần cách nhau hai khung: bằng nhau (camera đứng yên thì hạt đứng yên).
    - Kéo chuột 30 px; checksum lần ba khác.
  - Run e2e hai backend.
- [ ] **Step 7: Commit.**

```bash
git commit -m "feat(dan-ga-me-con): lớp Giấy điệp: sợi dó, vệt chổi xiên, hạt điệp lóe theo góc nhìn (emissive), thí nghiệm Giấy dó trơn, nấc chi-tiet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Đàn gà dạng đóng (`parts/dan-ga-song.js`)

**Mục tiêu:**
- Mười gà con và dáng gà mẹ tính thẳng từ thời gian theo các mốc rắc, giữ, thả, bới (§20.5); hàm thuần, chỉ import `lib/random.js`.
- Không có lớp nào dùng nó trong task này: Task 8 nối vào.

**Files:**
- Create: `parts/dan-ga-song.js`, `tests/paintings/dan-ga-me-con/dan-ga-song.test.js`.
- Modify: `parts/cot-bo-cuc.js` (`SLOTS`, `PILE`, `HEN_FRONT`, `LAYOUT`), `tests/paintings/dan-ga-me-con/cot-bo-cuc.test.js`.

**Interfaces:**
- Consumes: `HOMES`, `HEN`, `beakTip` (Task 4).
- Produces:
  - `cot-bo-cuc.js#LAYOUT = { homes, hen: [x, z], slots: [x, z][8], pile: [x, z] | null, henFront: [x, z], beakTip, back }`.
  - `dan-ga-song.js`:
    - `FLOCK` (số của §20.5);
    - `createFlock(layout, { reduced })` trả `{ scatter(t, at, seed), grip(t), release(t), drift(t), takeScatters(t) → { at, seed, count,
      still }[], state(t), marks() → number }`.
  - `state(t)` trả:
    - `chicks`: mười phần tử `{ x, y, z, heading, head, pecking, beak: [x, y, z], goal, kind }`;
    - `hen`: `{ wing, nod, look, scratch }`;
    - `near`: số con cách tâm mẹ dưới 2,2 (số đo `quanhMe`);
    - `eating`: số con đang ở pha mổ (số đo `dangAn`).

- [ ] **Step 1: Bố cục thêm** (`cot-bo-cuc.js`). Tám chỗ núp đều cách tâm mẹ dưới 2,2 và ở ngoài hình bầu dục của mình mẹ:

```js
/** Tám chỗ núp quanh và dưới cánh mẹ khi gà mẹ gọi con (§20.2): hai bên dưới cánh, phía đuôi, phía ngực. Đều cách tâm mẹ dưới 2,2. */
export const SLOTS = Object.freeze([[-0.9, 1.35], [0.5, 1.45], [-0.9, -1.35], [0.5, -1.45], [1.9, 0.7], [1.9, -0.7], [-2.0, 0.8], [-2.0, -0.8]]
  .map((s) => Object.freeze(s)));
/** Nhúm thóc nằm sẵn lúc mở trang, và chỗ gà mẹ bới: trước mặt mẹ (mẹ quay sang −x). */
export const PILE = Object.freeze([-2.6, 0.4]);
export const HEN_FRONT = Object.freeze([-2.6, 0]);
/** Bố cục mà đàn gà dạng đóng cần (shared.js truyền vào dan-ga-song.js, vì lớp Đàn gà không import part của Cốt). */
export const LAYOUT = Object.freeze({ homes: HOMES, hen: HEN.at, slots: SLOTS, pile: PILE, henFront: HEN_FRONT, beakTip, back: HEN.back });
```

  Test thêm: tám chỗ núp cách tâm mẹ dưới 2,2, đôi một cách nhau hơn 1,2, nằm ngoài bầu dục `(x / 2)² + (z / 1,2)² > 1`.

- [ ] **Step 2: Test (đỏ trước)** — `tests/paintings/dan-ga-me-con/dan-ga-song.test.js`:

```js
// tests/paintings/dan-ga-me-con/dan-ga-song.test.js — đàn gà dạng đóng (spec §20.5): rắc thì 3–4 con rảnh gần nhất chạy tới, tới đúng lúc, mổ rồi về; giữ thì núp, không hai con một chỗ; thả thì tản; liên tục ở mỗi mốc; thứ tự gọi không đổi kết quả; tối đa 32 mốc; giảm chuyển động; gà mẹ bới; nhúm thóc lúc mở trang.
import { describe, it, expect } from 'vitest';
import { FLOCK, createFlock } from '../../../src/paintings/dan-ga-me-con/parts/dan-ga-song.js';
import { LAYOUT } from '../../../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';
import { mulberry32 } from '../../../src/lib/random.js';

const NO_PILE = { ...LAYOUT, pile: null };
const FREE = LAYOUT.homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
const AT_HOME = FLOCK.wander * Math.SQRT2 + 1e-9; // lượn quanh nhà: mỗi trục tối đa FLOCK.wander
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const xz = (c) => [c.x, c.z];
const finite = (st) => st.chicks.every((c) => [c.x, c.y, c.z, c.heading, c.head, ...c.beak].every(Number.isFinite));

describe('dan-ga-song', () => {
  it('không ai chạm, không có nhúm thóc: mọi con quanh nhà; chỉ con trèo lưng và con nấp bụng ở quanh mẹ; không ai mổ', () => {
    const flock = createFlock(NO_PILE);
    for (const t of [0, 3, 10, 24]) {
      const st = flock.state(t);
      st.chicks.forEach((c, i) => expect(dist(xz(c), LAYOUT.homes[i].at), `con ${i} lúc ${t}`).toBeLessThanOrEqual(AT_HOME));
      expect([st.near, st.eating]).toEqual([2, 0]);
    }
  });

  it('chạm: 3–4 con rảnh GẦN NHẤT chạy tới; tới chậm nhất lúc phản xạ 0,4 s + quãng / 9; mổ (mỏ chạm sàn); rồi về nhà', () => {
    const flock = createFlock(NO_PILE);
    const at = [-4.5, 2.5];
    flock.scatter(5, at, 7);
    const before = flock.state(5);
    const went = FREE.filter((i) => dist(xz(flock.state(9).chicks[i]), at) < 1);
    expect(went.length).toBeGreaterThanOrEqual(3);
    expect(went.length).toBeLessThanOrEqual(4);
    const byDistance = [...FREE].sort((a, b) => dist(xz(before.chicks[a]), at) - dist(xz(before.chicks[b]), at));
    expect([...went].sort()).toEqual(byDistance.slice(0, went.length).sort());
    for (const i of went) {
      const latest = 5 + FLOCK.react[1] + (dist(xz(before.chicks[i]), at) + FLOCK.spread) / FLOCK.run;
      expect(dist(xz(flock.state(latest + 0.05).chicks[i]), at), `con ${i} tới nơi`).toBeLessThanOrEqual(FLOCK.spread + 0.4);
    }
    expect(flock.state(10).eating).toBe(went.length);
    let pecks = 0;
    for (let t = 7; t < 13; t += 1 / 60) pecks += flock.state(t).chicks.filter((c) => c.pecking && c.beak[1] < 0.1).length;
    expect(pecks).toBeGreaterThan(0);
    const later = flock.state(30);
    for (const i of went) expect(dist(xz(later.chicks[i]), LAYOUT.homes[i].at)).toBeLessThanOrEqual(AT_HOME);
  });

  it('giữ: tám con chạy về tám chỗ núp, không hai con một chỗ; quanhMe = 10 sau 3 giây; cánh mẹ mở 60°; thả thì tản dần rồi về nhà', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(2);
    const st = flock.state(5);
    const slots = FREE.map((i) => LAYOUT.slots.findIndex((s) => dist(s, xz(st.chicks[i])) < 0.05));
    expect(slots.every((k) => k >= 0)).toBe(true);
    expect(new Set(slots).size).toBe(8);
    expect(st.near).toBe(10);
    expect(st.hen.wing).toBeCloseTo(FLOCK.wing, 2);
    flock.release(5);
    expect(flock.state(5.05).near).toBeGreaterThanOrEqual(8); // tản dần: vừa thả thì còn quanh mẹ
    const end = flock.state(20);
    expect(end.near).toBe(2);
    expect(end.hen.wing).toBeLessThan(1e-3);
  });

  it('rắc trong lúc giữ: thóc vẫn rơi (takeScatters) mà các con ở lại với mẹ; thả trong 20 giây thì 3–4 con tới nắm đó', () => {
    const flock = createFlock(NO_PILE);
    flock.grip(1);
    flock.scatter(3, [4, 3], 2);
    expect(flock.takeScatters(3)).toHaveLength(1);
    expect(flock.state(4).near).toBe(10);
    flock.release(6);
    const went = FREE.filter((i) => dist(xz(flock.state(9).chicks[i]), [4, 3]) < 1).length;
    expect(went).toBeGreaterThanOrEqual(3);
    expect(went).toBeLessThanOrEqual(4);
  });

  it('bão chạm, giữ, thả (PRNG có hạt giống, cả mốc lùi): vị trí liên tục ở mỗi mốc; mọi số hữu hạn; tối đa 32 mốc; cuối cùng ai về nhà nấy', () => {
    const rand = mulberry32(2026);
    const flock = createFlock(LAYOUT);
    let t = 0.5;
    for (let n = 0; n < 150; n += 1) {
      t += rand() * 1.5;
      const r = rand();
      const before = flock.state(t - 1e-6);
      if (r < 0.4) flock.scatter(t, [rand() * 12 - 6, rand() * 7 - 2.5], n);
      else if (r < 0.65) flock.grip(t);
      else if (r < 0.85) flock.release(t);
      else flock.scatter(t - 3, [0, 0], n); // mốc lùi: xếp vào sau mốc cuối
      flock.drift(t);
      const after = flock.state(t + 1e-6);
      expect(finite(before) && finite(after)).toBe(true);
      if (r < 0.85) after.chicks.forEach((c, i) => expect(dist(xz(c), xz(before.chicks[i])), `con ${i} lúc ${t}`).toBeLessThan(1e-3));
      expect(flock.marks()).toBeLessThanOrEqual(32);
    }
    flock.release(t + 0.1);
    flock.state(t + 200).chicks.forEach((c, i) => expect(dist(xz(c), LAYOUT.homes[i].at)).toBeLessThanOrEqual(AT_HOME));
  });

  it('gọi state theo thứ tự nào cũng ra cùng số (dạng đóng: update(0, t) của ?freeze ra đúng khung N)', () => {
    const make = () => {
      const f = createFlock(LAYOUT);
      f.scatter(2, [-4, 2], 1);
      f.grip(6);
      f.release(9);
      f.drift(60);
      return f;
    };
    const times = Array.from({ length: 70 }, (_, k) => k * 0.85);
    const a = make();
    const b = make();
    const forward = times.map((t) => a.state(t));
    const backward = [...times].reverse().map((t) => b.state(t)).reverse();
    expect(backward).toEqual(forward);
  });

  it('giảm chuyển động: chạy chậm còn một nửa (tới muộn hơn hẳn); gà mẹ không bới', () => {
    const fast = createFlock(NO_PILE);
    const slow = createFlock(NO_PILE, { reduced: true });
    for (const f of [fast, slow]) f.scatter(1, [-6, 4.5], 3);
    const firstEat = (f) => {
      for (let t = 1; t < 20; t += 0.01) if (f.state(t).eating > 0) return t;
      return Infinity;
    };
    expect(firstEat(slow) - 1).toBeGreaterThan((firstEat(fast) - 1) * 1.4);
    slow.drift(200);
    expect(slow.marks()).toBe(2); // mốc đầu và cú chạm
  });

  it('gà mẹ bới: không ai chạm 25 giây thì một nhúm 24 hạt trước mặt mẹ, văng ở giữa nhịp cào (0,3 s sau), 2–3 con xúm lại', () => {
    const flock = createFlock(NO_PILE);
    flock.drift(24.9);
    expect(flock.takeScatters(24.9)).toEqual([]);
    flock.drift(26);
    expect(flock.takeScatters(25.2)).toEqual([]);
    const [handful] = flock.takeScatters(25.4);
    expect(handful.count).toBe(FLOCK.henHandful);
    expect(dist(handful.at, LAYOUT.henFront)).toBeLessThan(0.5);
    expect(flock.takeScatters(30)).toEqual([]); // mỗi nắm giao đúng một lần
    expect(flock.state(25.3).hen.scratch).toBeGreaterThan(0.5);
    expect(flock.state(26).hen.scratch).toBe(0);
    const pecking = flock.state(29).eating;
    expect(pecking).toBeGreaterThanOrEqual(2);
    expect(pecking).toBeLessThanOrEqual(3);
  });

  it('mở trang: nhúm 40 hạt nằm yên trước mặt mẹ; hai ba con đang mổ ngay từ đầu (poster chụp ở 2 giây có gà mổ)', () => {
    const flock = createFlock(LAYOUT);
    const [pile] = flock.takeScatters(0);
    expect(pile).toMatchObject({ count: FLOCK.pileHandful, still: true });
    const eating = flock.state(0.5).eating;
    expect(eating).toBeGreaterThanOrEqual(2);
    expect(eating).toBeLessThanOrEqual(3);
    expect(flock.state(2).eating).toBe(eating);
  });
});
```

- [ ] **Step 3: Chạy, thấy đỏ.**
- [ ] **Step 4: `parts/dan-ga-song.js`:**

```js
// paintings/dan-ga-me-con/parts/dan-ga-song.js — đàn gà tính thẳng từ thời gian (dạng đóng) theo các mốc rắc, giữ, thả, bới: mười gà con (chỗ, hướng, cúi đầu, mỏ) và dáng gà mẹ (cánh, gật, ngoảnh, cào); không import three.
import { mulberry32 } from '../../../lib/random.js';

/** Số của spec §20.5 (đơn vị cảnh 10 cm, giây, radian). */
export const FLOCK = Object.freeze({
  run: 9, // chạy tới chỗ rắc, chạy về chỗ núp (0,9 m/s)
  walk: 5, // đi bộ về nhà
  react: [0.1, 0.4], // phản xạ trước khi chạy
  peck: 8, // mổ quanh chỗ rắc chừng này giây
  spots: 3, // nhảy giữa ba chỗ gần nhau
  spread: 0.4, // điểm đích lệch khỏi điểm rắc tối đa chừng này, để các con không chồng lên nhau
  hop: 0.25, // nhảy sang chỗ mới mất chừng này giây
  bob: 2.5, // nhịp cúi đầu khi mổ (lần mỗi giây)
  turn: 0.3, // quay sang hướng mới mất chừng này giây
  wander: 0.3, // lượn quanh nhà khi rảnh, mỗi trục tối đa chừng này
  responders: [3, 4], // số con chạy tới một nắm rắc tay
  henResponders: [2, 3], // số con xúm lại nhúm gà mẹ bới, và nhúm lúc mở trang
  recent: 20, // thả tay: nắm rắc chưa tới chừng này giây thì các con tới đó
  auto: 25, // không ai chạm chừng này giây (kể từ mốc cuối) thì gà mẹ bới
  henHandful: 24,
  pileHandful: 40,
  scratch: 0.6, // gà mẹ cào chân 0,6 giây; thóc văng ở giữa nhịp
  wing: Math.PI / 3, // gà mẹ xòe cánh 60° khi giữ
  wingTau: 0.15, // lò xo tắt dần tới hạn của cánh
  cluck: 2, // gà mẹ gật đầu "cục cục" 2 lần mỗi giây khi giữ
  near: 2.2, // bán kính "quanh mẹ" (số đo quanhMe)
});
/** Giữ tối đa chừng này mốc: mỗi mốc mang sẵn kế hoạch của từng con lúc đó, nên mốc cũ bỏ được (như cây bay của Bức 3). */
const KEEP = 32;
const TAU = Math.PI * 2;

const smooth = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k));
const smoother = (k) => (k <= 0 ? 0 : k >= 1 ? 1 : k * k * k * (k * (k * 6 - 15) + 10));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const lerp2 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** Hướng (như rotation.y của three: phía trước là (sin h, 0, cos h)) để từ a nhìn về b. */
const facing = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
/** Quay từ hướng a sang hướng b theo đường ngắn nhất, phần k. */
const turn = (a, b, k) => a + (((((b - a) % TAU) + TAU + Math.PI) % TAU) - Math.PI) * k;

// ── Pha của một kế hoạch. Mọi pha có t0, t1 (Infinity: mở), h0 (hướng lúc vào pha), h1 (hướng muốn quay tới) và goal:
// 'home' (đi về nhà, ở nhà), 'food' (tới nắm thóc, mổ), 'hide' (núp mẹ), 'perch' (con trèo lưng, con nấp bụng: không bao giờ đổi).
const stay = (at, t0, t1, h0, goal) => ({ kind: 'stay', at, t0, t1, h0, h1: h0, goal });
const move = (from, to, t0, speed, h0, goal) => ({ kind: 'move', from, to, t0, t1: t0 + dist(from, to) / speed, h0, h1: facing(from, to), goal });
const rest = (home, t0, h0, h1, seed) => ({ kind: 'idle', at: home, t0, t1: Infinity, h0, h1, seed, goal: 'home' });
const hide = (slot, t0, h0, h1, seed) => ({ kind: 'hide', at: slot, t0, t1: Infinity, h0, h1, seed, goal: 'hide' });
function peck(center, t0, h0, rand) {
  const spots = Array.from({ length: FLOCK.spots }, () => {
    const a = rand() * TAU;
    const r = 0.15 + rand() * 0.2;
    return [center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r];
  });
  return { kind: 'peck', at: center, spots, t0, t1: t0 + FLOCK.peck, h0, goal: 'food' };
}
/** Hướng lúc đứng ở chỗ mổ thứ j: nhìn theo bước nhảy vừa rồi; j < 0 là hướng lúc vào pha. */
const peckDir = (p, j) => (j < 0 ? p.h0 : facing(j === 0 ? p.at : p.spots[j - 1], p.spots[j]));
/** Chỗ và hướng ở cuối một pha có hạn (để nối pha sau cho liền). */
function endOf(p) {
  if (p.kind === 'move') return { at: p.to, h: p.h1 };
  if (p.kind === 'peck') return { at: p.spots[FLOCK.spots - 1], h: peckDir(p, FLOCK.spots - 1) };
  return { at: p.at, h: p.h1 };
}

/**
 * Trạng thái của một con theo kế hoạch lúc t: { at: [x, z], h, head (0 ngẩng … 1 mổ), pecking, goal, kind }. Mỗi pha bắt đầu đúng chỗ
 * pha trước dừng, nên vị trí liên tục; hướng vào pha mới quay dần trong FLOCK.turn giây.
 */
function evaluate(plan, t, seed) {
  let p = plan[0];
  for (const q of plan) {
    if (q.t0 > t) break;
    p = q;
  }
  const s = Math.max(t - p.t0, 0);
  const ease = smooth(s / FLOCK.turn);
  const base = { goal: p.goal, kind: p.kind, head: 0, pecking: false };
  if (p.kind === 'move') {
    return { ...base, at: lerp2(p.from, p.to, smoother(s / Math.max(p.t1 - p.t0, 1e-6))), h: turn(p.h0, p.h1, ease) };
  }
  if (p.kind === 'peck') {
    const slot = (p.t1 - p.t0) / FLOCK.spots;
    const j = Math.min(Math.floor(s / slot), FLOCK.spots - 1);
    const u = s - j * slot;
    const at = lerp2(j === 0 ? p.at : p.spots[j - 1], p.spots[j], smooth(u / FLOCK.hop));
    const bob = u > FLOCK.hop ? 0.5 - 0.5 * Math.cos(TAU * FLOCK.bob * (u - FLOCK.hop)) : 0;
    return { ...base, at, h: turn(peckDir(p, j - 1), peckDir(p, j), smooth(u / FLOCK.turn)), head: bob, pecking: bob > 0.85 };
  }
  if (p.kind === 'idle') {
    // Lượn quanh nhà, ngó nghiêng, thỉnh thoảng cúi rỉa lông; tăng dần từ lúc tới nhà (ramp), nên vị trí liên tục.
    const ramp = smooth(s);
    const ph = seed * 1.7;
    const at = [p.at[0] + FLOCK.wander * Math.sin(0.31 * t + ph) * ramp, p.at[1] + FLOCK.wander * Math.sin(0.23 * t + 2 * ph) * ramp];
    const head = 0.7 * Math.max(0, Math.sin((TAU * t) / (4 + (seed % 3)) + ph)) ** 6 * ramp;
    return { ...base, at, h: turn(p.h0, p.h1, ease) + 0.4 * Math.sin(0.5 * t + ph) * ramp, head };
  }
  if (p.kind === 'hide') return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + 0.5 * Math.sin(1.7 * t + p.seed) * smooth(s / 0.5) };
  const sway = p.kind === 'perch' ? 0.3 * Math.sin(0.4 * t + seed) : 0;
  return { ...base, at: p.at, h: turn(p.h0, p.h1, ease) + sway };
}

/**
 * @param {{ homes: { at: [number, number], heading: number, kind: 'free'|'back'|'belly' }[], hen: [number, number],
 *   slots: [number, number][], pile: [number, number] | null, henFront: [number, number], beakTip: (k: number) => [number, number],
 *   back: number }} layout   bố cục (cot-bo-cuc.js#LAYOUT)
 * @param {{ reduced?: boolean }} [o]   giảm chuyển động: chạy và đi chậm còn một nửa, cánh mở chậm gấp đôi, gà mẹ không bới
 */
export function createFlock(layout, { reduced = false } = {}) {
  const speed = { run: FLOCK.run * (reduced ? 0.5 : 1), walk: FLOCK.walk * (reduced ? 0.5 : 1) };
  const { homes, hen } = layout;
  const free = homes.flatMap((h, i) => (h.kind === 'free' ? [i] : []));
  /** Mốc theo thời gian: { id, t, kind, plans, wing: { y, v }, open, taken, …rắc: at, seed, count, still, fly, auto }. */
  const marks = [];
  let ids = 0;

  function homeward(i, from, t) {
    const home = homes[i].at;
    if (dist(from.at, home) < 1e-3) return [rest(home, t, from.h, homes[i].heading, i)];
    const go = move(from.at, home, t, speed.walk, from.h, 'home');
    return [go, rest(home, go.t1, go.h1, homes[i].heading, i)];
  }
  /** Chạy tới nắm thóc (sau phản xạ), mổ FLOCK.peck giây, rồi về nhà. `already`: đang đứng ở nắm (nhúm lúc mở trang). */
  function forage(i, from, t, target, rand, already = false) {
    const phases = [];
    let now = from;
    let t0 = t;
    if (!already) {
      const react = FLOCK.react[0] + rand() * (FLOCK.react[1] - FLOCK.react[0]);
      phases.push(stay(from.at, t, t + react, from.h, 'food'));
      const go = move(from.at, target, t + react, speed.run, from.h, 'food');
      phases.push(go);
      now = endOf(go);
      t0 = go.t1;
    }
    const eat = peck(target, t0, now.h, rand);
    return [...phases, eat, ...homeward(i, endOf(eat), eat.t1)];
  }
  function shelter(from, t, slot, i) {
    const wait = stay(from.at, t, t + 0.1, from.h, 'hide');
    const go = move(from.at, slot, wait.t1, speed.run, from.h, 'hide');
    return [wait, go, hide(slot, go.t1, go.h1, facing(hen, slot), i)];
  }
  /** Điểm đích của một con: điểm rắc lệch một khoảng theo hạt giống. */
  const aim = (at, rand) => {
    const a = rand() * TAU;
    const r = rand() * FLOCK.spread;
    return [at[0] + Math.cos(a) * r, at[1] + Math.sin(a) * r];
  };
  /** Các con rảnh hay đang về nhà, gần `at` nhất; số con theo hạt giống trong [lo, hi]. */
  function nearest(states, at, [lo, hi], rand) {
    const n = lo + Math.floor(rand() * (hi - lo + 1));
    return free.filter((i) => states[i].goal === 'home')
      .sort((a, b) => dist(states[a].at, at) - dist(states[b].at, at) || a - b)
      .slice(0, n);
  }

  const last = () => marks[marks.length - 1];
  function markAt(t) {
    let m = marks[0];
    for (const k of marks) {
      if (k.t > t) break;
      m = k;
    }
    return m;
  }
  /** Cánh mẹ: lò xo tắt dần tới hạn từ (y, v) lúc mốc về đích `open`, như cây bay của Bức 3: không nhảy vận tốc ở mốc. */
  function wingAt(m, t) {
    const tau = FLOCK.wingTau * (reduced ? 2 : 1);
    const s = Math.max(t - m.t, 0);
    const A = m.wing.y - m.open;
    const B = m.wing.v + A / tau;
    const e = Math.exp(-s / tau);
    return { y: m.open + (A + B * s) * e, v: (B - (A + B * s) / tau) * e };
  }

  /** Thêm một mốc lúc t (không lùi: mốc lùi xếp vào ngay sau mốc cuối); mỗi con nhận kế hoạch mới theo thứ tự ưu tiên của §20.5. */
  function push(kind, t, extra = {}) {
    const tt = Math.max(t, last().t);
    const prev = markAt(tt);
    const states = prev.plans.map((plan, i) => evaluate(plan, tt, i));
    const plans = [...prev.plans];
    const rand = mulberry32(Math.round(tt * 1000) * 31 + (extra.seed ?? 0) + 1);
    if (kind === 'grip') {
      // Núp (ưu tiên cao nhất): con gần mẹ chọn trước, mỗi con lấy chỗ trống gần nó nhất; không hai con một chỗ.
      const taken = new Set();
      for (const i of [...free].sort((a, b) => dist(states[a].at, hen) - dist(states[b].at, hen) || a - b)) {
        let best = -1;
        layout.slots.forEach((slot, k) => {
          if (!taken.has(k) && (best < 0 || dist(states[i].at, slot) < dist(states[i].at, layout.slots[best]))) best = k;
        });
        taken.add(best);
        plans[i] = shelter(states[i], tt, layout.slots[best], i);
      }
    } else if (kind === 'release') {
      for (const i of free) plans[i] = homeward(i, states[i], tt);
      const recent = [...marks].reverse().find((m) => m.kind === 'scatter' && tt - m.t < FLOCK.recent);
      if (recent) {
        const now = plans.map((plan, i) => evaluate(plan, tt, i));
        for (const i of nearest(now, recent.at, FLOCK.responders, rand)) plans[i] = forage(i, now[i], tt, aim(recent.at, rand), rand);
      }
    } else if (kind === 'scatter' && !prev.underGrip) {
      const group = extra.auto ? FLOCK.henResponders : FLOCK.responders;
      for (const i of nearest(states, extra.at, group, rand)) plans[i] = forage(i, states[i], tt, aim(extra.at, rand), rand);
    }
    const open = kind === 'grip' ? FLOCK.wing : kind === 'release' ? 0 : prev.open;
    const underGrip = kind === 'grip' || (kind === 'scatter' && prev.underGrip);
    marks.push({ ...extra, id: (ids += 1), t: tt, kind, plans, wing: wingAt(prev, tt), open, underGrip, taken: false });
    if (marks.length > KEEP) marks.splice(0, marks.length - KEEP);
  }

  // Mốc đầu, lúc 0: mọi con ở nhà. Có nhúm thóc lúc mở trang thì hai ba con gần nó đang đứng mổ sẵn (§20.2), và nhúm ấy là một nắm
  // nằm yên mà lớp Đàn gà rắc ở khung đầu.
  const plans0 = homes.map((h, i) => [h.kind === 'free'
    ? rest(h.at, 0, h.heading, h.heading, i)
    : { kind: 'perch', at: h.at, t0: 0, t1: Infinity, h0: h.heading, h1: h.heading, goal: 'perch' }]);
  const first = { id: (ids += 1), t: 0, kind: 'start', plans: plans0, wing: { y: 0, v: 0 }, open: 0, underGrip: false, taken: true };
  if (layout.pile) {
    const rand = mulberry32(17);
    const states = plans0.map((plan, i) => evaluate(plan, 0, i));
    for (const i of nearest(states, layout.pile, FLOCK.henResponders, rand)) {
      const target = aim(layout.pile, rand);
      plans0[i] = forage(i, { at: target, h: facing(target, layout.pile) }, 0, target, rand, true);
    }
    Object.assign(first, { kind: 'scatter', at: layout.pile, seed: 17, count: FLOCK.pileHandful, still: true, fly: 0, taken: false });
  }
  marks.push(first);

  return {
    /** Chạm: một nắm thóc rơi ở `at` (x, z). count null: lớp dùng núm handful. */
    scatter(t, at, seed) {
      push('scatter', t, { at: [at[0], at[1]], seed, count: null, still: false, fly: t, auto: false });
    },
    grip(t) {
      if (!last().underGrip) push('grip', t); // đang giữ thì bỏ qua
    },
    release(t) {
      if (last().underGrip) push('release', t); // chưa giữ thì bỏ qua
    },
    /** Gà mẹ bới: không ai chạm FLOCK.auto giây kể từ mốc cuối thì một nhúm trước mặt mẹ. Gọi mỗi khung; gọi lại cùng t không thêm gì. */
    drift(t) {
      if (reduced) return;
      for (;;) {
        const due = last().t + FLOCK.auto;
        if (last().underGrip || due > t) return;
        const seed = Math.round(due * 10);
        const jitter = mulberry32(seed);
        const at = [layout.henFront[0] + (jitter() - 0.5) * 0.6, layout.henFront[1] + (jitter() - 0.5) * 0.6];
        push('scatter', due, { at, seed, count: FLOCK.henHandful, still: false, fly: due + FLOCK.scratch / 2, auto: true });
      }
    },
    /** Các nắm đã tới lúc văng (fly ≤ t) mà lớp chưa nhận, theo thứ tự; mỗi nắm giao đúng một lần. */
    takeScatters(t) {
      const out = marks.filter((m) => m.kind === 'scatter' && !m.taken && m.fly <= t);
      for (const m of out) m.taken = true;
      return out.map(({ at, seed, count, still }) => ({ at, seed, count, still }));
    },
    /** Cả đàn lúc t: gọi bao nhiêu lần, theo thứ tự nào, cũng ra cùng một số (chỉ đọc các mốc). */
    state(t) {
      const m = markAt(t);
      const chicks = m.plans.map((plan, i) => {
        const s = evaluate(plan, t, i);
        const y = homes[i].kind === 'back' ? layout.back : 0;
        const [forward, up] = layout.beakTip(s.head);
        const beak = [s.at[0] + Math.sin(s.h) * forward, y + up, s.at[1] + Math.cos(s.h) * forward];
        return { x: s.at[0], y, z: s.at[1], heading: s.h, head: s.head, pecking: s.pecking, beak, goal: s.goal, kind: s.kind };
      });
      const wing = Math.max(wingAt(m, t).y, 0);
      const scratch = marks.reduce((sum, k) => sum + (k.auto && t >= k.t && t <= k.t + FLOCK.scratch
        ? Math.sin((Math.PI * (t - k.t)) / FLOCK.scratch) : 0), 0);
      return {
        chicks,
        hen: {
          wing,
          nod: (wing / FLOCK.wing) * (0.5 - 0.5 * Math.cos(TAU * FLOCK.cluck * t)), // gật khi cánh mở: thả là thôi gật, không giật
          look: 0.25 * Math.sin((TAU * t) / 7), // ngoảnh chậm
          scratch: 0.7 * scratch,
        },
        near: chicks.filter((c) => dist([c.x, c.z], hen) < FLOCK.near).length,
        eating: chicks.filter((c) => c.kind === 'peck').length,
      };
    },
    /** Số mốc đang giữ (tối đa KEEP). */
    marks: () => marks.length,
  };
}
```

  Ghi chú cho người thực thi:
  - `underGrip`: mốc rắc trong lúc giữ không làm mất trạng thái "đang giữ". Vì vậy `grip`, `release`, `drift` hỏi `last().underGrip`, không
    hỏi `last().kind`.
  - Dáng nghỉ ở nhà là hướng của bố cục (`homes[i].heading`), không phải hướng về mẹ, để giữ bố cục của tranh gốc. Sửa câu "đứng yên thì
    quay về phía mẹ" của §20.5 thành "đứng yên ở nhà thì theo dáng của bố cục; đứng mổ thì nhìn theo bước nhảy".
  - File phải dưới 300 dòng; quá thì tách `evaluate` và các pha sang `parts/dan-ga-pha.js` (Đàn gà kê thêm file đó).

- [ ] **Step 5: Chạy, thấy xanh; `npm test` xanh.** Sửa §20.5 (dáng nghỉ, `underGrip`, nhúm lúc mở trang có 2–3 con mổ sẵn). Commit:

```bash
git add src/paintings/dan-ga-me-con/parts tests/paintings/dan-ga-me-con docs
git commit -m "feat(dan-ga-me-con): đàn gà dạng đóng (dan-ga-song.js): rắc, giữ, thả, gà mẹ bới; vị trí liên tục ở mỗi mốc, tất định theo thời gian" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Lớp Đàn gà: thóc trên bể hạt, áp dáng đàn gà, cử chỉ

**Mục tiêu:**
- Thóc là một bể hạt của `lib/tsl/particles.js`: rắc, rơi, nảy, lăn, nằm yên, bị mổ thì biến mất, nằm 30 giây thì nhỏ dần.
- `shared.js` giữ đàn gà; cử chỉ chạm, giữ, thả; gà mẹ bới khi không ai chạm.
- Lớp áp dáng đàn gà vào Cốt mỗi khung, hòa về dáng nghỉ theo trọng số; mảng mỏ cho thóc.
- Số đo `rac`, `dangAn`, `quanhMe`; thí nghiệm "Tô theo luồng"; nấc `thoc`.

**Files:**
- Create: `shared.js`, `layers/l5-dan-ga.js`, `parts/dan-ga-thoc.js`, `tests/paintings/dan-ga-me-con/{dan-ga,cu-chi}.test.js`.
- Modify:
  - `layers/l1-cot.js` (`shared.cot.pose`), `painting.js` (`setup`, lớp `dan-ga` trước `phu-bong`);
  - `meta.js`: `dan-ga` kê `l5-dan-ga.js`, `dan-ga-thoc.js`, `dan-ga-song.js`, `lib/tsl/particles.js`. `shared.js` import
    `dan-ga-song.js`, nhưng lớp chỉ đọc `shared.flock`; part đó kê ở lớp Đàn gà vì nó là chuyển động của đàn gà. Test "files kê đủ parts"
    chỉ kiểm chiều lớp → part, nên kê thêm là được.
  - `quality.js`: thang `['dpr', 'dan-ga.thoc', 'giay-diep.chi-tiet', 'phu-bong.bloom']`;
  - `content.vi.js`, `e2e/dan-ga-me-con.spec.js`.

**Interfaces:**
- Consumes: `createPool`, `COUNT_FLOOR` (Task 2); `createFlock`, `LAYOUT`, `floorPoint` (Task 1, 7); `shared.cot.{recipe, floor, pixel,
  hen, chicks, view}` (Task 4).
- Produces:
  - `dan-ga-thoc.js`: `GRAIN`, `GRAVITY`, `BEAKS`, `createBeaks()`, `initGrain`, `makeSpawn({ time })`, `makeLaw({ dt, gravity, bounce,
    beaks, floor })`, `createGrainSprite({ pool, recipe, time, pixel, lane, w })`.
  - `shared.flock`.
  - `shared.cot.pose(state, k)`: Cốt ghi dáng (k = trọng số của Đàn gà: 0 là dáng nghỉ).
  - Lệch spec: mỏ ăn hạt trong bán kính 0,15 (spec ghi 0,06), đo trên mặt sàn, khi đầu mỏ thấp hơn 0,3. Ở 0,06, mỗi lần mổ chỉ trúng
    chừng một hạt: một nắm 120 hạt gần như không vơi. Sửa §20.4 lớp 5.

- [ ] **Step 1: Test (đỏ trước).**
  - `cu-chi.test.js` (dựng cả bức), theo mẫu `cung-que/cot.test.js`:
    - chạm với tia trúng sàn ở (−3; 2) thì `shared.flock` có mốc rắc ở đó: `takeScatters` trả nắm có `at` ≈ (−3; 2). Tia dựng bằng
      Raycaster từ `ctx.camera` qua NDC của điểm đó, như Task 1;
    - chạm lên vách thì nắm nằm trong `FLOOR`;
    - giữ rồi thả: `state(t + 3).near` ≥ 8, rồi về 2;
    - `'swipe'` và `'double-tap'` không thêm mốc (`marks()` không đổi);
    - chạm hai mươi lần trong một giây cảnh: `marks()` ≤ 32, `state` hữu hạn.
  - `dan-ga.test.js` (dựng đủ):
    - `dan-ga-thoc`: compute bước của bể (lấy qua `renderer.compute.mock.calls`, như `vang-la-ma.test.js`) dịch được ở hai backend, có
      mảng mỏ 10 phần tử. WGSL có `array<vec4<f32>, 10>`; GLSL có khối `NodeBuffer_`;
    - Sprite `thoc`: `depthWrite` false, `transparent` true, `frustumCulled` false, `count` = `budget.grains`; dịch được ở hai backend;
    - `update(1/60, t)` sau một cú chạm thì `renderer.compute` được gọi; `update(0, t)` thì không (không tiến mô phỏng, không rắc);
    - chạm lúc trọng số Đàn gà bằng 0: không `emit` (hàng đợi của bể không dồn); trọng số về 1 thì không có nắm cũ bung ra;
    - số đo `rac`, `dangAn`, `quanhMe` trả số; thí nghiệm `toTheoLuong` bật, tắt không ném; nấc `thoc` hạ trần về nửa rồi gỡ;
    - núm `gravity` cả hai lựa chọn, `bounce` 0 và 0,8, `handful` 300 khi `count` 100: dịch được, nắm bị cắt còn 100.
- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: `parts/dan-ga-thoc.js`** (luật của thóc: code đầy đủ):

```js
// paintings/dan-ga-me-con/parts/dan-ga-thoc.js — của lớp Đàn gà: luật của hạt thóc cho bể hạt lib/tsl/particles.js (khởi tạo, rắc, rơi nảy lăn, bị mổ), mảng mỏ của mười gà con, và Sprite vẽ thóc.
import { Sprite, SpriteNodeMaterial, Vector4 } from 'three/webgpu';
import {
  Fn, If, clamp, color, cos, exp, float, hash, hue, instanceIndex, length, max, mix, sin, smoothstep, sqrt, step, uint, uniformArray, uv,
  vec2, vec3, vec4, vertexStage,
} from 'three/tsl';

/** Số của thóc (spec §20.4 lớp 5, §20.5), đơn vị cảnh 10 cm. */
export const GRAIN = Object.freeze({
  size: [0.08, 0.04], // dài, rộng
  radius: 0.02, // tâm hạt nằm cao chừng này khi nằm trên sàn
  drop: 3, // văng ra từ tầm tay
  spread: 2.4, // tốc độ ngang tối đa khi văng: nắm tỏa chừng 0,6 đơn vị khi chạm sàn (0,25 giây sau)
  settle: 1, // nảy lên chậm hơn chừng này (đơn vị/s) thì thôi nảy
  friction: 3, // vận tốc ngang khi lăn giảm theo e^(−friction · dt)
  rest: 0.05, // trên sàn mà chậm hơn chừng này thì nằm yên
  life: 30, // nằm chừng này giây không ai ăn thì nhỏ dần
  fade: 2,
  eat: 0.15, // mỏ đang mổ cách hạt dưới chừng này (đo trên mặt sàn) thì hạt bị ăn
  reach: 0.3, // và đầu mỏ thấp hơn chừng này
  pile: 0.35, // bán kính nhúm nằm yên
});
/** Trọng lực (đơn vị/s²): Trái Đất 9,81 m/s²; trăng 1,62 m/s², như lá rơi của Bức 3. Núm 'gravity' chọn. */
export const GRAVITY = Object.freeze({ traiDat: 98.1, trang: 16.2 });
export const BEAKS = 10;

/** Mảng mỏ (uniformArray vec4): xyz = đầu mỏ, w = 1 khi đang mổ (đáy nhịp). Lớp ghi mỗi khung; three tải lại mỗi lần compute. */
export const createBeaks = () => uniformArray(Array.from({ length: BEAKS }, () => new Vector4(0, -10, 0, 0)), 'vec4');

/** Khởi tạo cả bể: lúc sinh −1 là ô trống. Gán cả a lẫn b (WebGL2 ghi mọi phần tử). */
export const initGrain = ({ a, b, index }) => {
  a.assign(vec4(0, -10, 0, -1));
  b.assign(vec4(0, 0, 0, hash(index)));
};

/**
 * Phần tử thứ k của nắm vừa rắc tự khởi tạo lại. Nắm thường: văng từ tầm tay trên điểm rắc, tỏa hình nón. Nắm nằm yên (`still`): nằm
 * sẵn trên sàn trong một đĩa quanh điểm rắc. hash nhận số nguyên (đổi sang uint), nên ba số ngẫu nhiên lấy ở ba chỉ số liền nhau.
 */
export function makeSpawn({ time }) {
  return ({ a, b, k, batch }) => {
    const base = k.mul(3).add(uint(batch.seed).mul(7919));
    const [r1, r2, r3] = [0, 1, 2].map((j) => hash(base.add(j)));
    const ang = r1.mul(Math.PI * 2);
    const disc = vec3(cos(ang), 0, sin(ang)).mul(sqrt(r2)); // điểm đều trong đĩa đơn vị
    const thrown = batch.origin.add(vec3(0, GRAIN.drop, 0)).add(disc.mul(0.15));
    const lying = batch.origin.add(disc.mul(GRAIN.pile)).add(vec3(0, GRAIN.radius, 0));
    const velocity = disc.mul(GRAIN.spread).add(vec3(0, r3.mul(1.5), 0));
    a.assign(vec4(mix(thrown, lying, batch.still), time));
    b.assign(vec4(mix(velocity, vec3(0), batch.still), r3));
  };
}

/**
 * Một bước của một hạt. a = (vị trí, lúc sinh), b = (vận tốc, hạt giống); lúc sinh âm là ô trống hay hạt đã bị ăn. Mỗi hạt chỉ đọc và
 * ghi chính nó; mỏ gà đến qua uniform (spec §20.7). Hạt nằm yên thì thôi tích phân, nhưng vẫn kiểm mỏ. Luôn gán cả a lẫn b.
 */
export function makeLaw({ dt, gravity, bounce, beaks, floor }) {
  const [x0, x1] = floor.x;
  const [z0, z1] = floor.z;
  return ({ a, b }) => {
    const p = a.xyz.toVar();
    const v = b.xyz.toVar();
    const born = a.w.toVar();
    If(born.greaterThanEqual(0), () => {
      If(length(v).greaterThan(0).or(p.y.greaterThan(GRAIN.radius + 1e-3)), () => {
        v.y.subAssign(gravity.mul(dt));
        p.addAssign(v.mul(dt));
        If(p.y.lessThan(GRAIN.radius), () => {
          p.y.assign(GRAIN.radius);
          v.y.assign(v.y.abs().mul(bounce)); // nảy
          If(v.y.lessThan(GRAIN.settle), () => {
            v.y.assign(0);
          });
        });
        If(p.y.lessThanEqual(GRAIN.radius + 1e-3), () => {
          const keep = exp(dt.mul(-GRAIN.friction)); // lăn chậm dần
          v.x.mulAssign(keep);
          v.z.mulAssign(keep);
          If(v.y.equal(0).and(length(v.xz).lessThan(GRAIN.rest)), () => {
            v.assign(vec3(0));
          });
        });
        // Mép sàn: dội lại
        If(p.x.lessThan(x0).or(p.x.greaterThan(x1)), () => {
          p.x.assign(clamp(p.x, x0, x1));
          v.x.assign(v.x.negate().mul(bounce));
        });
        If(p.z.lessThan(z0).or(p.z.greaterThan(z1)), () => {
          p.z.assign(clamp(p.z, z0, z1));
          v.z.assign(v.z.negate().mul(bounce));
        });
      });
      // Mỏ đang mổ trúng thì hạt bị ăn: lúc sinh về −1 (Sprite thu hạt về 0; ô thành trống, nắm sau dùng lại).
      for (let i = 0; i < BEAKS; i += 1) {
        const m = beaks.element(i);
        If(m.w.greaterThan(0.5).and(m.y.lessThan(GRAIN.reach)).and(length(m.xz.sub(p.xz)).lessThan(GRAIN.eat)), () => {
          born.assign(-1);
        });
      }
    });
    a.assign(vec4(p, born));
    b.assign(vec4(v, b.w));
  };
}

/**
 * Sprite vẽ cả bể: vị trí đọc thẳng bộ đệm (toAttribute). Hạt dẹt 0,08 × 0,04, có sàn theo điểm ảnh (`pixel`: đơn vị cảnh của một điểm
 * ảnh, Cốt đặt mỗi khung), nên trên điện thoại vẫn thấy (§20.11). Xoay theo hạt giống. Hạt bị ăn hay ô trống thu về 0; nằm quá 30 giây
 * thì nhỏ dần. Không ghi độ sâu (Bản nét không vẽ viền quanh hạt), vẫn bị gà che; transparent để vẽ sau mọi vật đục.
 * Màu qua recipe.fill (thóc là vàng hòe khi có Bản màu, đất sét khi không). `lane` (thí nghiệm "Tô theo luồng"): mỗi hạt một màu theo
 * luồng GPU giữ nó, tính ở vertex.
 */
export function createGrainSprite({ pool, recipe, time, pixel, lane, w }) {
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false });
  const a = pool.a.toAttribute();
  const b = pool.b.toAttribute();
  const alive = step(0, a.w).mul(float(1).sub(smoothstep(GRAIN.life, GRAIN.life + GRAIN.fade, time.sub(a.w))));
  material.positionNode = a.xyz;
  material.scaleNode = vec2(max(GRAIN.size[0], pixel.mul(2.5)), max(GRAIN.size[1], pixel.mul(1.5))).mul(alive);
  material.rotationNode = b.w.mul(Math.PI * 2);
  const s = { kind: 'thoc', part: float(-1), n: vec3(0, 1, 0), uv: uv(), pos: a.xyz, pigment: float(-1) };
  const laneColor = vertexStage(hue(color(1, 0.35, 0.1), float(instanceIndex).mul(2.39996)));
  material.colorNode = Fn(() => mix(recipe.fill(s), laneColor, lane))();
  material.opacityNode = float(1).sub(smoothstep(0.38, 0.5, uv().sub(0.5).length())).mul(w);
  material.emissiveNode = vec3(0);
  const sprite = new Sprite(material);
  sprite.frustumCulled = false; // vị trí nằm trong bộ đệm
  return sprite;
}
```

- [ ] **Step 4: `shared.js`:**

```js
// paintings/dan-ga-me-con/shared.js — setup() của Bức 4: đàn gà tính thẳng từ thời gian (mốc rắc, giữ, thả, bới); chạm rắc thóc, giữ gọi con.
import { LAYOUT, floorPoint } from './parts/cot-bo-cuc.js';
import { createFlock } from './parts/dan-ga-song.js';

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  // Giảm chuyển động: chạy, đi chậm còn một nửa; gà mẹ không bới. Nhúm thóc lúc mở trang vẫn có.
  const flock = createFlock(LAYOUT, { reduced: ctx.reducedMotion });
  return {
    shared: { flock },
    // Thời điểm là đồng hồ của cảnh (tất định với ?freeze). Vuốt và chạm đúp không làm gì riêng: chạm đúp là hai 'tap', hai nắm thóc.
    onGesture(g) {
      const t = ctx.u.time.value;
      if (g.kind === 'tap') flock.scatter(t, floorPoint(g.ray), Math.round(t * 60));
      else if (g.kind === 'hold-start') flock.grip(t);
      else if (g.kind === 'hold-end') flock.release(t);
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại (drift dạng đóng: gọi lại cùng t không thêm gì).
    update(dt, t) {
      flock.drift(t);
    },
  };
}
```

- [ ] **Step 5: Cốt áp dáng** (`l1-cot.js`): `shared.cot.pose(state, k)`:
  - Mỗi gà con i: hòa từ dáng nghỉ (`HOMES[i]`: chỗ, hướng, đầu 0) tới `state.chicks[i]` theo k. Hướng hòa theo đường ngắn nhất. Ghi vào
    `pose` (x, y, z, hướng) và `head`, rồi đặt `needsUpdate` cho hai thuộc tính.
  - Gà mẹ: `henWing`, `henNod`, `henLook`, `henScratch` = số trong `state.hen` × k.
  - Chưa có lớp Đàn gà (test dựng `until: 'cot'`) thì không ai gọi `pose`: gà ở dáng nghỉ ghi lúc dựng.

- [ ] **Step 6: `layers/l5-dan-ga.js`** (theo mẫu `ao-sen-dem/layers/l5-vang-la.js`):

```js
export const id = 'dan-ga';
const countMax = (env) => env.budget.grains ?? 4096;
export const knobs = [
  { id: 'handful', via: 'js', min: 10, max: 300, step: 10, value: 120 },
  { id: 'bounce', min: 0, max: 0.8, step: 0.05, value: 0.3 },
  { id: 'gravity', kind: 'select', options: ['traiDat', 'trang'], value: 'traiDat' },
  { id: 'count', via: 'js', min: COUNT_FLOOR, max: countMax, step: 100, value: countMax },
];

export function createLayer(ctx, shared) {
  const { flock, cot } = shared;
  const w = ctx.weight(id);
  let handful = ctx.knobValue('handful');
  let wanted = ctx.knobValue('count');
  const levelCount = wanted;
  let cap = Infinity;
  let before = Infinity;
  const beaks = createBeaks();
  const lane = uniform(0).setName('danGaLane');
  const gravity = mix(float(GRAVITY.traiDat), float(GRAVITY.trang), ctx.knob('gravity')); // @knob gravity
  const pool = createPool({
    capacity: countMax(ctx),
    count: wanted,
    tier: ctx.tier,
    renderer: ctx.renderer,
    init: initGrain,
    law: makeLaw({
      dt: ctx.u.delta,
      gravity,
      bounce: ctx.knob('bounce'), // @knob bounce
      beaks,
      floor: cot.floor,
    }),
    spawn: makeSpawn({ time: ctx.u.time }),
  });
  const sprite = createGrainSprite({ pool, recipe: cot.recipe, time: ctx.u.time, pixel: cot.pixel, lane, w });
  sprite.name = 'thoc';
  pool.setCount(wanted, sprite);
  ctx.scene.add(sprite);
  const applyCount = () => pool.setCount(Math.min(wanted, cap), sprite);
  let now = flock.state(0);

  return {
    objects: [sprite],
    update(dt, t) {
      sprite.visible = w.value > 0; // visible không nằm trong cache key
      now = flock.state(t);
      cot.pose(now, w.value); // trọng số 0: đàn gà đứng yên ở dáng nghỉ, như tượng
      now.chicks.forEach((c, i) => beaks.array[i].set(c.beak[0], c.beak[1], c.beak[2], c.pecking && w.value > 0 ? 1 : 0));
      // Rắc chỉ khi mô phỏng tiến (dt > 0). Trọng số 0 thì nắm bị bỏ, không dồn lại để bung ra khi phủ lại lớp.
      if (dt > 0) {
        for (const s of flock.takeScatters(t)) {
          if (w.value > 0) pool.emit({ origin: [s.at[0], 0, s.at[1]], count: s.count ?? handful, seed: s.seed, still: s.still });
        }
      }
      pool.step(dt, w.value);
    },
    onKnob: {
      handful: (v) => { // @knob handful
        handful = v;
      },
      count: (v) => { // @knob count
        wanted = v;
        applyCount();
      },
    },
    experiments: [{ id: 'toTheoLuong', toggle: (on) => { lane.value = on ? 1 : 0; } }],
    readouts: [
      { id: 'rac', get: () => pool.emitted() },
      { id: 'dangAn', get: () => now.eating },
      { id: 'quanhMe', get: () => now.near },
    ],
    degrade: [
      {
        id: 'thoc',
        apply() {
          before = cap;
          cap = Math.max(COUNT_FLOOR, Math.round(levelCount / 2));
          applyCount();
        },
        revert() {
          cap = before;
          applyCount();
        },
      },
    ],
    dispose() {
      ctx.scene.remove(sprite);
      sprite.material.dispose();
      pool.dispose();
    },
  };
}
```

  `painting.js`: `export { setup } from './shared.js';`, thêm lớp `danGa` trước `phuBong`.

- [ ] **Step 7: Chạy unit, thấy xanh; `npm test` xanh.**
- [ ] **Step 8: E2e** — `describe('Đàn Gà Mẹ Con · đàn gà')`, live (không freeze), chờ rộng tay như Bức 3:

```js
test.describe('Đàn Gà Mẹ Con · đàn gà', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });
  const read = (page, id) => page.evaluate((r) => Number(window.__sma.readouts('dan-ga').find((x) => x.id === r)?.value), id);

  test('chạm vào sàn thì thóc rắc thêm (rac tăng); có gà con tới mổ', SMOKE, async ({ page }, testInfo) => {
    // Giảm chuyển động: gà mẹ không bới, nên chỉ cú chạm sinh mổ; chờ nhúm thóc lúc mở trang ăn xong (8 giây cảnh) trước khi chạm.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, testInfo, 0);
    await expect.poll(() => read(page, 'dangAn'), { timeout: 120_000 }).toBe(0);
    const before = await read(page, 'rac');
    await tapAt(page, 0.3, 0.75); // sàn phía trước, bên trái
    await expect.poll(() => read(page, 'rac'), { timeout: 30_000 }).toBeGreaterThan(before);
    await expect.poll(() => read(page, 'dangAn'), { timeout: 60_000 }).toBeGreaterThan(0);
  });

  test('giữ thì gà mẹ gọi con: quanhMe ≤ 4 trước khi giữ, ≥ 8 khi giữ đủ lâu; thả thì giảm dần', async ({ page }, testInfo) => {
    await open(page, testInfo, 0);
    await waitForFrames(page, 10, { timeout: 120_000 });
    expect(await read(page, 'quanhMe')).toBeLessThanOrEqual(4);
    const lift = await pressAt(page, 0.5, 0.25); // giữ trên vách: không kéo
    await expect.poll(() => read(page, 'quanhMe'), { timeout: 90_000 }).toBeGreaterThanOrEqual(8);
    await lift();
    await expect.poll(() => read(page, 'quanhMe'), { timeout: 90_000 }).toBeLessThanOrEqual(4);
  });

  test('mài Đàn gà về 0 khi thóc đang rơi, rồi chạm: không lỗi console; phủ lại thì không có nắm cũ bung ra', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 10, { timeout: 120_000 });
    await tapAt(page, 0.6, 0.75);
    await page.evaluate(() => window.__sma.setWeight('dan-ga', 0));
    const before = await read(page, 'rac');
    await tapAt(page, 0.4, 0.75);
    await waitForFrames(page, (await page.evaluate(() => window.__sma.frames)) + 10, { timeout: 60_000 });
    await page.evaluate(() => window.__sma.setWeight('dan-ga', 1));
    await waitForFrames(page, (await page.evaluate(() => window.__sma.frames)) + 10, { timeout: 60_000 });
    expect(await read(page, 'rac')).toBe(before);
    expect(log.errors).toEqual([]);
  });
});
```

  (import thêm `tapAt`, `pressAt`.) Run e2e hai backend.
- [ ] **Step 9: Sửa spec** §20.4 lớp 5 (bán kính ăn 0,15, đo trên sàn; Sprite transparent; Cốt áp dáng qua `shared.cot.pose`, không ghi
  ma trận instance, không `computeBoundingSphere`), §20.5 nếu số đổi. Commit:

```bash
git add src/paintings/dan-ga-me-con tests/paintings/dan-ga-me-con e2e/dan-ga-me-con.spec.js docs
git commit -m "feat(dan-ga-me-con): lớp Đàn gà: thóc trên bể hạt dùng chung (rắc, nảy, lăn, bị mổ), đàn gà theo mốc, chạm rắc thóc, giữ gọi con, gà mẹ bới" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Chất lượng và hiệu năng

**Mục tiêu:**
- Bảng §20.8 đúng ở ba mức. Thang nấc có thật ở lớp. Trần của núm theo mức.
- E2e: tối đa 30 draw call ở mức cao; `?level=thap` chạy được; bật từng thí nghiệm không có lỗi console.
- Đo hiệu năng đủ sáu lớp ở ba mức × hai khung (spec §20.8: đo lại khi đủ sáu lớp).

**Files:**
- Create: `tests/paintings/dan-ga-me-con/quality.test.js`.
- Modify: `e2e/dan-ga-me-con.spec.js`; `quality.js` và núm của các lớp nếu số đo buộc phải đổi.

- [ ] **Step 1: Test (đỏ trước)** — `tests/paintings/dan-ga-me-con/quality.test.js`:

```js
// tests/paintings/dan-ga-me-con/quality.test.js — bảng chất lượng của Bức 4 (spec §20.8): ba mức cùng bộ khóa và đúng số; thang nấc có thật ở lớp; trần của núm count theo mức; nấc chi-tiet chỉ khi paper > 1.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/dan-ga-me-con/meta.js';
import * as painting from '../../../src/paintings/dan-ga-me-con/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

/** Bảng §20.8. */
const TABLE = {
  cao: { dpr: 2, grains: 4096, paper: 3, bloom: 0.5 },
  vua: { dpr: 1.5, grains: 2048, paper: 2, bloom: 0.25 },
  thap: { dpr: 1.25, grains: 1024, paper: 2, bloom: 0.25 },
};
const LEVELS = ['cao', 'vua', 'thap'];

describe('quality (Bức 4)', () => {
  it('ba mức đúng bảng §20.8, cùng một bộ khóa; thang đúng thứ tự', () => {
    expect(painting.quality.levels).toEqual(TABLE);
    expect(painting.quality.ladder).toEqual(['dpr', 'dan-ga.thoc', 'giay-diep.chi-tiet', 'phu-bong.bloom']);
  });

  it.each(LEVELS)('mức %s: mọi nấc của thang có thật ở lớp tương ứng', (level) => {
    const { layers } = buildPainting(painting, meta, { level });
    for (const step of painting.quality.ladder.slice(1)) {
      const [layerId, stepId] = step.split('.');
      expect(layers[layerId].degrade?.map((d) => d.id) ?? [], `${level}: ${step}`).toContain(stepId);
    }
  });

  it.each(LEVELS)('mức %s: dan-ga.count mặc định và tối đa bằng budget.grains, Sprite thóc vẽ đúng số đó; handful tối đa 300', async (level) => {
    const built = buildPainting(painting, meta, { level });
    expect(built.knobs['dan-ga'].get('count')).toBe(TABLE[level].grains);
    await built.knobs['dan-ga'].set('count', 1e6);
    expect(built.knobs['dan-ga'].get('count')).toBe(TABLE[level].grains);
    expect(built.layers['dan-ga'].objects.find((o) => o.name === 'thoc').count).toBe(TABLE[level].grains);
    await built.knobs['dan-ga'].set('handful', 1000);
    expect(built.knobs['dan-ga'].get('handful')).toBe(300);
  });

  it('paper = 1: lớp Giấy điệp không đưa nấc chi-tiet (nấc chỉ có khi có tác dụng)', () => {
    const { layers } = buildPainting(painting, meta, { budget: { paper: 1 } });
    expect(layers['giay-diep'].degrade ?? []).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy, sửa cho xanh.** Phần lớn đã có từ Task 1–8. Test xanh ngay thì giữ làm lưới, và ghi điều đó vào sổ.
- [ ] **Step 3: E2e** — thêm vào `e2e/dan-ga-me-con.spec.js` (import thêm `toggleExperiment`):

```js
test.describe('Đàn Gà Mẹ Con · chất lượng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('mức cao: không quá 30 draw call (giấy, gà mẹ ba mesh, gà con, thóc, cộng bloom, FXAA, quad)', SMOKE, async ({ page }, testInfo) => {
    await open(page, testInfo, 0, '&level=cao');
    await waitForFrames(page, 30, { timeout: 120_000 });
    const calls = await page.evaluate(() => window.__sma.stats().drawCalls);
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThanOrEqual(30);
  });

  test('?level=thap chạy được: cảnh live, tờ giấy vẫn sáng giữa hai dải ván tối', async ({ page }, testInfo) => {
    await open(page, testInfo, 30, '&level=thap');
    const r = await canvasRegions(page, { top: BOARD_TOP, wall: WALL });
    expect(r.wall.mean).toBeGreaterThan(r.top.mean + 0.15);
  });

  test('bật rồi tắt từng thí nghiệm của năm lớp riêng: không lỗi console', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const all = [['cot', 'biaPhang'], ['ban-mau', 'toMin'], ['ban-net', 'chiNet'], ['ban-net', 'netTheoMau'], ['giay-diep', 'giayTron'],
      ['dan-ga', 'toTheoLuong']];
    for (const [layer, exp] of all) {
      await toggleExperiment(page, layer, exp, true);
      await twoFrames(page);
      await toggleExperiment(page, layer, exp, false);
    }
    expect(log.errors).toEqual([]);
  });
});
```

- [ ] **Step 4: Đo** bằng `perf-dan-ga.mjs` (Task 1, Step 18), ở ba mức × hai khung:
  - 1280×800 DPR 2;
  - 390×844 DPR 3 với `isMobile`, `hasTouch` (giả lập điện thoại trên GPU của Mac: chỉ để so, máy thật là việc kiểm tay của Bao).

  Ghi bảng `ms`, `gpuMs`, `drawCalls`, nấc đã hạ vào thân commit.
  - Expected: mức cao ở 1280×800 có `ms` ≤ 16,7, và bộ điều chỉnh không hạ nấc nào.
  - Không đạt thì tìm thủ phạm bằng cách mài từng lớp về 0 rồi đo lại. Sửa theo thứ tự:
    1. `giay-diep.density` mặc định thấp hơn;
    2. bỏ hai hướng chéo của Bản nét;
    3. `paper` của mức cao còn 2.

    Vẫn không đạt thì ghi vào mục Minor để báo Bao ở Task 13.
  - Kích thước bundle: `npm run build`, ghi kB gzip của chunk `painting-*` và `content.vi-*` của Bức 4, và của chunk chứa
    `lib/tsl/particles.js`. Vite có thể tách nó riêng hay gộp vào chunk của Bức 1. README ghi ở Task 12.
- [ ] **Step 5: `npm test` xanh; e2e hai backend; commit.**

```bash
git commit -am "test(dan-ga-me-con): chất lượng: bảng §20.8, thang nấc, trần núm theo mức; e2e draw call, mức thấp, mọi thí nghiệm" -m "<bảng số đo hiệu năng: ba mức × hai khung>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(`git add tests/paintings/dan-ga-me-con/quality.test.js` trước.)

---

### Task 10: Chữ của Sổ tay và năm sơ đồ

**Mục tiêu:**
- `content.vi.js` viết hay cho năm lớp riêng.
- Năm sơ đồ SVG, mỗi sơ đồ một ý chính.
- Test chữ như `cung-que/chu.test.js`.

**Files:**
- Create: `src/paintings/dan-ga-me-con/diagrams/{truc-giao,chia-nac,lech-mat-phang,hat-diep,vong-dem}.svg`,
  `tests/paintings/dan-ga-me-con/chu.test.js`.
- Modify: `content.vi.js`.

- [ ] **Step 1: Test (đỏ trước)** — `chu.test.js`, theo mẫu `tests/paintings/cung-que/chu.test.js`:
  - gợi ý đúng chuỗi §20.2: `'Chạm để rắc thóc · giữ để gà mẹ gọi con · kéo để bước vào tranh'`;
  - mỗi lớp riêng có `diagram`, 2–4 dòng `learned`, 1–3 link `readMore` (chỉ https);
  - đoạn `understand` nhắc đúng khái niệm:

    | Lớp | Phải nhắc |
    |---|---|
    | `cot` | "trực giao" |
    | `ban-mau` | "nấc" |
    | `ban-net` | "độ sâu" và "mặt phẳng" |
    | `giay-diep` | "phản xạ" |
    | `dan-ga` | "vòng đệm" |

- [ ] **Step 2: Chạy, thấy đỏ.**
- [ ] **Step 3: Viết chữ.** Mỗi `understand` ≤ 150 chữ, như ba bức trước; `learned` 2–4 mục. Ý chính và link đọc thêm:
  - **cot**, ý chính:
    - camera trực giao chiếu mọi điểm theo các tia song song, nên vật ở xa không nhỏ đi, chỉ nằm cao hơn trong khung, đúng lối vẽ của
      tranh dân gian;
    - mất chiều sâu nên nhìn thẳng không phân biệt được tượng tròn với tấm bìa ("Tấm bìa phẳng");
    - tờ giấy cong như phông chụp ảnh.

    Link đọc thêm:
    - https://threejs.org/docs/#api/en/cameras/OrthographicCamera
    - https://en.wikipedia.org/wiki/Orthographic_projection
    - https://vi.wikipedia.org/wiki/Tranh_%C4%90%C3%B4ng_H%E1%BB%93
  - **ban-mau**, ý chính:
    - mỗi bản khắc in một màu tự nhiên (điệp, hòe, sỏi son, chàm, than lá tre);
    - ánh sáng chia nấc: cùng phép tính Lambert, chỉ làm tròn xuống vài nấc;
    - "Tô mịn" cho thấy chia nấc gần như không tốn gì.

    Link đọc thêm:
    - https://en.wikipedia.org/wiki/Cel_shading
    - https://roystan.net/articles/toon-shader/
  - **ban-net**, ý chính:
    - viền dò trên ảnh độ sâu, đo độ lệch khỏi mặt phẳng: mặt nghiêng không thành nét, bậc và nếp gấp thì có;
    - nét trong vẽ ngay trên vật;
    - bản nét in sau cùng nên có thể lệch bản.

    Link đọc thêm:
    - https://en.wikipedia.org/wiki/Discrete_Laplace_operator
    - https://en.wikipedia.org/wiki/Sobel_operator
    - https://roystan.net/articles/outline-shader/
  - **giay-diep**, ý chính:
    - giấy dó quét điệp (bột vỏ sò);
    - mỗi hạt điệp là một mặt gương nhỏ nghiêng ngẫu nhiên, chỉ lóe khi tia nắng phản xạ đúng vào mắt;
    - nghiêng tranh thì hạt khác lóe; phần lóe là emissive nên Phủ bóng làm nó tỏa.

    Link đọc thêm:
    - https://en.wikipedia.org/wiki/Specular_reflection
    - https://vi.wikipedia.org/wiki/Gi%E1%BA%A5y_d%C3%B3
  - **dan-ga**, ý chính:
    - mỗi hạt thóc là một luồng GPU, chỉ đọc và ghi chính nó;
    - nắm thóc mới khởi tạo lại một đoạn của vòng đệm, đè lên hạt cũ nhất ("Tô theo luồng");
    - mỏ gà đến với hạt qua uniform;
    - đàn gà tính thẳng từ thời gian, nên `?freeze` ra đúng khung.

    Link đọc thêm:
    - https://threejs.org/examples/#webgpu_compute_particles
    - https://en.wikipedia.org/wiki/Circular_buffer

  Nhãn của mọi núm, thí nghiệm (label + explain), số đo, vật và tap phải đủ; test hợp đồng giữ. Mở thử từng link trước khi commit; link
  chết thì thay bằng link sống cùng ý.
- [ ] **Step 4: Sơ đồ.** SVG có `<title>`, chỉ dùng màu của bảng đã ghép (kể cả `diep`, `hoe`, `sonSoi`, `xanhDong`, `muc`; test hợp đồng
  giữ), import bằng `?raw`:
  1. `truc-giao`: bên trái, tia phối cảnh hội tụ về mắt, gà ở xa nhỏ đi; bên phải, tia song song, gà ở xa cùng cỡ mà nằm cao hơn;
  2. `chia-nac`: đường Lambert liền và bậc thang hai nấc trên cùng trục `dot(n, nắng)`;
  3. `lech-mat-phang`: mặt cắt độ sâu theo một hàng điểm ảnh, ba trường hợp: mặt nghiêng (ba điểm thẳng hàng, e = 0), bậc (e ≈ H), nếp
     gấp (e nhỏ);
  4. `hat-diep`: tia nắng tới vài hạt nghiêng khác nhau, chỉ một hạt phản xạ vào mắt và sáng;
  5. `vong-dem`: vòng đệm các ô, hai nắm là hai cung màu, mũi tên đầu nắm; mảng mười mỏ đi vào luật của hạt.
- [ ] **Step 5: `npm test` xanh; commit.**

```bash
git add src/paintings/dan-ga-me-con tests/paintings/dan-ga-me-con/chu.test.js
git commit -m "docs(dan-ga-me-con): chữ của Sổ tay cho năm lớp và năm sơ đồ" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Lượt màu và poster thật

**Mục tiêu:**
- Đo màu ở góc nhìn của tranh, khung 1280×800 và 390×844, trên GPU thật.
- Chỉnh số mặc định trong một commit riêng. Chụp poster và og. Bao duyệt ảnh (§20.3).

**Files:**
- Modify:
  - núm mặc định ở các lớp;
  - `meta.palette` (năm hex), `meta.poster.capture`;
  - `painting.js` (ghi đè mặc định của Phủ bóng nếu cần);
  - `public/paintings/dan-ga-me-con/{poster.webp,og.jpg}`, spec §20.3.

- [ ] **Step 1: Đo trước khi chỉnh.**
  - Script đo màu của GĐ 6 (Task 15) và GĐ 7 (Task 13): độ sáng trung bình 0–255, độ bão hòa HSV, tỉ lệ điểm tối (kênh lớn nhất < 30).
  - Đổi URL sang `tranh/dan-ga-me-con/?freeze=120&poster&level=cao`.
  - Đo thêm hai số (§20.3), trên vùng giấy không có gà:
    - tỉ lệ điểm ảnh sáng hơn 200;
    - độ ngà: kênh đỏ hơn kênh lam.
  - Ghi số "trước" vào thân commit.
- [ ] **Step 2: Chỉnh.** Mục tiêu nhìn:
  - giấy ngà sáng mà không cháy trắng, không ngả xám (AgX nén vùng sáng);
  - năm màu in đậm, phẳng, đọc rõ trên giấy;
  - nét mực đen mà không nặng;
  - hạt điệp lóe nhẹ, không phủ trắng tờ giấy.

  Núm được chỉnh:
  - `ban-mau.shade`, `giay-diep.{sparkle,brush,fiber}`;
  - năm hex của `meta.palette`;
  - Phủ bóng: `exposure`, `bloomStrength`, `toneMapping` (thử các lựa chọn có sẵn của núm).

  Ghi đè mặc định của Phủ bóng trong `painting.js` bằng spread (§15 a). Chưa bức nào làm việc này; mẫu:

```js
import * as phuBongStock from '../../engine/stock/phu-bong/layer.js';

/** Phủ bóng của Bức 4: giấy sáng, nên lộ sáng và bloom khác mặc định của lớp dùng chung (lượt màu, §20.4 lớp 6; §15 a). */
const PHU_BONG = { exposure: 0.9, bloomStrength: 0.6 }; // số thật lấy từ lượt màu
const phuBong = { ...phuBongStock, knobs: phuBongStock.knobs.map((k) => (k.id in PHU_BONG ? { ...k, value: PHU_BONG[k.id] } : k)) };
```

  Đo lại; ghi số "sau". Gom mọi số mặc định vào MỘT commit riêng.
- [ ] **Step 3: Poster.**
  - Thử hai, ba khung `capture`: `freeze` 120 (gà con đang mổ nhúm thóc lúc mở trang), 240, 360.
  - Sửa `meta.poster.capture`, rồi `npm run build && node scripts/poster.js dan-ga-me-con`.
  - Kiểm `npm test` (cỡ, ≤ 150 KB, og 1200×630 ≤ 200 KB).
- [ ] **Step 4: Trang ảnh cho Bao** (riêng tư, như GĐ 6 Task 15):
  - ảnh trước và sau lượt màu ở hai khung;
  - các khung poster;
  - hai khung thí nghiệm, "Tấm bìa phẳng" (ở một góc xoay) và "Chỉ bản nét", để Bao thấy bài học của hai lớp.

  Không chặn Task 12. Nhưng Task 13 KHÔNG hỏi push trước khi Bao duyệt ảnh.
- [ ] **Step 5: `npm test` xanh; e2e của Bức 4 trên hai backend vẫn xanh** (vùng và ngưỡng đo có thể phải chốt lại). Commit:

```bash
git commit -am "style(dan-ga-me-con): lượt màu (số trước/sau trong thân commit); poster và og chụp từ cảnh" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Tài liệu khớp code

**Files:** `README.md`, `CLAUDE.md`, spec.

- [ ] **Step 1: README:**
  - đoạn "Bức 4 · Đàn Gà Mẹ Con" như đoạn của Bức 3: sáu lớp, hai cử chỉ, tranh tự khép lại, camera trực giao;
  - mục "Thêm một bức tranh mới": camera trực giao (`CameraSpec.kind`), `home`, bể hạt dùng chung, `files` kê được `lib/tsl`;
  - bảng bundle thêm dòng Bức 4 (số của Task 9, Step 4) và tổng đường 3D cùng cách tính.
- [ ] **Step 2: CLAUDE.md:**
  - "Bản đồ dự án": thêm Bức 4 (`src/paintings/dan-ga-me-con/`, trang `tranh/dan-ga-me-con/index.html`, camera trực giao, vẽ phi hiện
    thực); "Lệnh": URL dev của Bức 4; "Gỡ lỗi nhanh": `__sma.readouts('dan-ga')` có `rac`, `dangAn`, `quanhMe`; `__sma.readouts('cot')` của
    Bức 4 có `goc`.
  - Mục mới "Camera trực giao, tự khép lại, bể hạt dùng chung, vẽ phi hiện thực (GĐ 8)", mỗi luật một dòng:
    - `CameraSpec.kind: 'ortho'` cùng `height`, `minWidth`, `zoom`. Phần tính ở `engine/gpu/camera.js` (hàm thuần, có test).
      `stage.camera` là getter, đọc SAU `useCamera`;
    - độ sâu tuyến tính chỉ lấy qua `pipeline.js#linearDepth` (hay `channel('depth')`). Với camera trực giao, đó là chính texture độ sâu,
      lấy mẫu lân cận bằng `.sample()` được;
    - trong post, `cameraNear`, `cameraFar` của TSL là của camera vẽ quad: số của camera cảnh đi qua uniform đặt từ JS;
    - hướng nhìn trong shader dùng `positionViewDirection`, không tự tính `cameraPosition − positionWorld` (sai với camera trực giao);
    - tranh tự khép lại: `engine/gpu/home.js`; `scene.step()` gọi `stage.returnHome(dt)` TRƯỚC `controls.update()`;
    - bể hạt `lib/tsl/particles.js`:
      - mọi nhánh của `init`, `law`, `spawn` gán cả `a` lẫn `b` (WebGL2 ghi mọi phần tử);
      - vòng đệm quấn theo `count`, hàng đợi tối đa 16 nắm;
      - `step(dt, w)` không làm gì khi `dt = 0`;
    - `meta.layers[].files` kê được file `lib/tsl/*.js` mà lớp import (test hợp đồng giữ); glob của `ui/code-view.js` có `lib/tsl`;
    - dò cạnh trên độ sâu dùng độ lệch khỏi mặt phẳng (đạo hàm bậc hai), không dùng Sobel: Sobel biến mặt nhìn chếch thành nét.
  - Sửa "Lớp đầu của mọi bức luôn là Cốt" và bảng ba vùng nếu cần (hộp màu có `lib/tsl/particles.js`).
- [ ] **Step 3: Spec.**
  - §20: số đo thật (hiệu năng, lượt màu, camera, hình đã chốt). §20.9: ngưỡng e2e thật.
  - Phụ lục A.89–A.94: ghi "(GĐ 8, chạy thật)" kèm điều đã thấy, như A.77.
  - §8.1: cây file đúng file thật. §15 a, e: lệnh và bước thật.
- [ ] **Step 4: `npm test` xanh; commit.**

```bash
git commit -am "docs: README, CLAUDE.md và spec theo GĐ 8 (Bức 4, camera trực giao, tự khép lại, bể hạt dùng chung)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Review cuối, đối chiếu thơ, hỏi Bao trước khi push

- [ ] **Step 1: Chạy đủ** (một mình, máy rảnh); ghi số test và thời gian:
  1. `npm test`;
  2. `npm run build`;
  3. `npx playwright test --project=static --project=webgl2-swiftshader`;
  4. `E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`;
  5. `npx playwright test --project=webgpu-swiftshader` (không chặn).

  Hỏng vì `timeout` dưới tải nặng thì kiểm CPU rồi chạy lại một lần.
- [ ] **Step 2: Review cuối.**
  - Một reviewer mới đọc cả nhánh, trên model mạnh nhất, theo skill executing-plans. Đưa cho reviewer:
    - mục Review Focus của plan này;
    - các dòng `Ruling:` của sổ.
  - Thêm một reviewer lỗi im lặng (silent-failure-hunter) cho: `lib/tsl/particles.js`, `engine/gpu/home.js`, `parts/dan-ga-song.js`, cú
    chạm (`floorPoint`, `shared.js`).
  - Xếp lại mức theo hệ quả. Critical và Important vào MỘT lượt sửa: mỗi mục có test đỏ trước rồi xanh, rồi cả bộ xanh. Minor ghi sổ.
- [ ] **Step 3: Đối chiếu thơ.**
  - "Khôn ngoan đối đáp người ngoài / Gà cùng một mẹ chớ hoài đá nhau": tìm các nguồn in (sách ca dao, báo, Wikipedia) và các dị bản
    (ví dụ "chớ hoài" và "đừng hoài").
  - Ghi kết quả vào §20.2 như §18.2 của GĐ 6.
  - Bao chốt.
- [ ] **Step 4: DỪNG, hỏi Bao.** Gửi Bao:
  - tóm tắt; số test; các mục Minor;
  - ảnh (nếu Bao chưa duyệt ở Task 11);
  - danh sách kiểm tay của Bao (§12 và §20.9): điện thoại thật (tờ tranh vừa bề ngang, ngón tay chạm rắc thóc, giữ, kéo rồi xem tranh
    tự khép lại), VoiceOver đọc dải link Bức 3 ⇄ Bức 4, Phòng tranh bốn mục;
  - mọi quyết định đã tự đưa ra (các dòng `Ruling:`), kèm cái giá nếu sai;
  - câu hỏi: push nhánh và mở PR (CI chạy thật các nhóm e2e theo bức; PR không deploy), hay giữ local.

  **Không push, không merge khi Bao chưa nói.** Merge vào `main` là deploy:
  - lệnh merge: `gh pr merge N --merge --match-head-commit <sha> --author-email giabao261096@gmail.com --subject "Merge pull request #N from giabao2610/gd8-dan-ga-me-con" --body "<tiêu đề PR>\n\nCo-Authored-By: …"`;
  - không xóa nhánh trên remote.
- [ ] **Step 5: Sau khi có PR:**
  - Ghi thời gian thật của từng nhóm e2e (CI) vào §13 và §20.9, trong một commit trên nhánh.
  - Job WebGPU (SwiftShader, không chặn) của Bức 4 quá trần: đặt `ciWebgpuSmoke: true` ở dòng registry của Bức 4. Các test `@khoi` đã có
    từ Task 1, 3, 8, 9; test luật đòi ít nhất một. Chạy `npm test`, rồi commit.
  - Hỏi lại Bao trước khi merge.
