# GĐ 5 · Trăng tiến độ + Từng sợi + thả hoa đăng: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ba mục Bao chọn cho GĐ 5. Lúc chờ cảnh 3D, trăng cạnh con dấu có một vòng quầng nhích dần theo từng bước tải. Đồ nghề có thêm Từng sợi: dệt lại khung hình từng lần vẽ một, đúng thứ tự GPU nhận. Bức 1 cho người xem chạm hai lần lên nước để thả một ngọn hoa đăng; đèn trôi về phía lối trăng, mang theo một cặp câu thơ có ghi nguồn. Deploy công khai.

**Architecture:** Giữ ba vùng của GĐ 0–4.
- **Xưởng:**
  - `engine/gpu/gesture.js` có thêm cử chỉ `'double-tap'`; kính tròn của Kính mài giữ cả cú chạm hai lần của ngón tay;
  - `ui/moon-progress.js` vẽ quầng trăng; `ui/shell.js` có `progress(mốc)`; `boot.js` báo mốc `'chunk'`;
  - chữ đi theo vật: `engine/gpu/caption-set.js` (chiếu điểm neo, tính giờ) và `ui/captions.js` (một vùng `aria-live`; chữ dừng trên chân khung, không in chồng lên gợi ý và thơ); bức gọi `ctx.captions.show(khóa, anchor)`, chữ nằm ở `content.captions`;
  - Từng sợi: `engine/gpu/draws.js` móc `renderer.setRenderObjectFunction` khi công cụ bật; `engine/tools/tung-soi.js` vẽ thanh điều khiển; `ToolApi.draws`;
  - mọi vật trong `layer.objects` có `name` và nhãn ở `content.layers[id].objects`; `__sma.readouts(layerId)`;
  - ba lỗi có từ trước, sửa luôn trong GĐ 5: khung chữ một cột (huy hiệu và con dấu về đúng góc; lỗi từ GĐ 1, tìm ra khi gợi ý mới của GĐ 5 bị ép thành cột hẹp; Bao duyệt cùng kế hoạch này); bảng công cụ không nằm dưới Sổ tay và đứng ngay sau thanh lớp trong thứ tự Tab (GĐ 4; Bao chọn sửa); "Dựng lại cảnh" quá hạn không đụng tới trang đã về tĩnh (`run.js`, kèm bộ test đầu tiên cho `run()`; Bao chọn sửa).
- **Bức 1:** `parts/anh-trang-drift.js` (hàm thuần: vòng đệm N + 1 ô, đường trôi tính thẳng theo thời gian, thứ tự thơ theo đêm, tính từ trưa tới trưa giờ Việt Nam), `parts/anh-trang-lantern.js` (đèn ở bờ và đèn thả ra chung một InstancedMesh); lớp Sương làm đèn mờ trong sương; lớp Mặt nước cho đèn nhấp nhô và hắt vũng sáng; `shared.js` nhận `'double-tap'`; 12 cặp câu thơ ở `content.captions.vi.js`.
- **Kiểm thử:** unit, luật, hợp đồng như cũ; e2e GĐ 5 (Từng sợi, quầng trăng, thả hoa đăng bằng sự kiện con trỏ phát ngay trong trang, a11y).

**Tech Stack:** Node 24 LTS · three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) · Vite 8 · Vitest 5 (+ jsdom) · Playwright 1.63 · @axe-core/playwright 4.13.0 · Tweakpane 4.0.5 · Shiki 4.4.3 · stats-gl 4.2.3 · GitHub Actions + Pages. GĐ 5 không thêm gói nào.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch lập luận từ spec; người thực thi đọc cả hai. Các mục hay dùng (tìm nhãn "(GĐ 5)"):
- §1: ba mục Bao chọn, ba cách làm đã duyệt;
- §4.1 mục 1 (quầng trăng), mục 6 (Từng sợi), mục 10 (chữ đi theo vật); §4.2 (thả hoa đăng, gợi ý mới);
- §5: thơ của hoa đăng (12 cặp câu; mục `guong-nga` chờ Bao kiểm chữ);
- §6: tên vật; Lớp 2 (hoa đăng), Lớp 3 (đèn trong sương), Lớp 4 (đèn trên nước);
- §7: Từng sợi; §8.2: luật móc lần vẽ; §8.3–8.4: hợp đồng; §8.5: mốc của quầng, vòng lặp; §8.6; §9; §10;
- §12: test GĐ 5, kiểm tra thủ công; §16; §17; Phụ lục A.53 trở đi.

**Code trong kế hoạch này đã chạy thật.** Trước khi viết kế hoạch, toàn bộ GĐ 5 đã được dựng thử trong một bản sao của repo (worktree `gd5-proto`), mỗi task một commit. Mỗi commit được một reviewer độc lập đọc lại, chạy lại test và sửa tới khi qua:
- Vitest xanh ở MỌI task. Số test sau từng task ghi ở bước "Toàn bộ test": từ 687 (mốc `7765d36`) lên 860 (73 file).
- E2E xanh ở bản cuối:
  - `static`: 6 passed;
  - `webgl2-swiftshader` (cổng chặn của CI): 33 passed, chừng 11 phút trên M2;
  - `webgpu-swiftshader`: 33 passed, chừng 11 phút;
  - GPU thật (`webgpu-real-gpu`, Apple M2): 33 passed, chừng 2 phút.

  Lượt `webgl2-swiftshader` đầu tiên chạy lúc máy đang bận (load trung bình 22) và có một test chờ quá 30 giây cho trang về `live`, dù trang lên ngay sau đó. Chạy lại lúc máy rảnh thì xanh cả 33.

  Mỗi project liệt kê 40 test. Playwright ghi các test còn lại là "skipped" vì chúng dành cho project hay backend khác (ví dụ "mất context WebGL" chỉ chạy trên WebGL2, test draw call của hoa đăng chỉ chạy trên WebGPU).
- Đo trên GPU thật (Apple M2, Chrome):
  - 35 draw call ở mức cao (1280×800), không đổi khi có hai hoa đăng đang trôi: đèn thả ra là thêm instance của InstancedMesh đèn ở bờ, vũng sáng nằm trong shader của mặt nước;
  - đường 3D 313,97 kB gzip, hơn GĐ 4 7,40 kB (kể cả Tweakpane: 344,93 kB);
  - khung mặc định (chưa thả đèn) giống từng điểm trước và sau lượt tinh chỉnh; so với `main` chỉ đèn ở bờ tối đi chừng 1% (lớp sương), nên không phải chụp lại poster.
- Ảnh chụp trên GPU thật, từ bản dựng thử cuối: hoa đăng từ lúc còn búp tới lúc mờ trong sương, đèn cũ chìm dần khi thả quá số đèn, chữ dừng trên chân khung ở ba cỡ màn hình (kèm ảnh trước khi sửa), khung chữ trước và sau khi sửa, quầng trăng lúc trang tải chậm, bảng Từng sợi cạnh Sổ tay ở 1280 và 1440 px (ở 1024 px và trên điện thoại, Sổ tay tạm thu lại khi công cụ bật). Bao duyệt chúng cùng lúc với kế hoạch này.
- Lúc dựng thử, three r186 và trình duyệt làm khác điều spec tưởng ở nhiều chỗ. Mỗi chỗ đã sửa trong đúng task của nó và ghi ở Phụ lục A của spec (từ mục 53). Ba chỗ dễ vấp nhất:
  - móc lần vẽ lúc đầu không thấy lượt vẽ cảnh nào. three chạy các bước "trước khi vẽ" của lượt cuối từ con lên cha, và RTT của FXAA gỡ móc rồi mới vẽ scene pass. Scene pass vì vậy phải chạy đầu tiên (Task 6);
  - `DynamicDrawUsage` bắt three r186 tải lại thuộc tính ở MỌI lần render, kể cả khi không đổi gì (Task 9);
  - Chrome đo `pathLength` của một vòng tròn nhỏ quá thô: bốn cung thành bốn dây cung, nên vòng không bao giờ khép. Quầng trăng vì vậy vẽ ở tọa độ gấp 100 lần (Task 3).
- Mọi khối code dưới đây sinh tự động từ đúng các commit đó:
  - file mới là nội dung cả file;
  - file sửa là một patch `git diff` hợp lệ. Lưu khối diff ra file rồi `git apply <file>`, hoặc sửa tay theo từng khối `@@`.
- Dòng "Kết quả mong đợi: FAIL" ở mỗi task là lỗi THẬT: nó ghi lại lúc chỉ áp phần test của task lên task trước.

## Global Constraints

Mọi task đều ngầm bao gồm các ràng buộc dưới đây (phần lớn là luật của `CLAUDE.md`; `npm test` giữ nhiều luật và báo lỗi tiếng Việt kèm `file:dòng`: gặp lỗi thì sửa code, không nới luật).

**Công cụ**
- Node **24** (`node -v` ra `v24.x`). Máy của Bao chưa có fnm: nếu `node -v` không ra v24, làm theo Task 1 · Step 1 (Node 24 bản portable trong thư mục tạm, không sửa `~/.zshrc`), và đặt `PATH` đó ở đầu mọi lệnh `node`/`npm`/`npx`.
- `three@0.186.1`, `@playwright/test@1.63.0` ghim đúng phiên bản. GĐ 5 không thêm gói npm nào.
- Chạy e2e trên SwiftShader khi máy rảnh. SwiftShader ăn CPU, nên khi máy đang bận, cảnh 3D quá hạn 10 giây và về tĩnh với lý do `timeout`, hoặc một test chờ quá 30 giây cho trang về `live`. Đó không phải lỗi code: chạy lại khi máy rảnh.
- `vite preview` phục vụ đúng thứ đang có trong `dist/`: dừng lượt e2e đang chạy trước khi build lại. Playwright dùng lại server nào đang nghe cổng 4273, nên tắt `vite preview` mồ côi trước khi chạy e2e.

**Quy ước file**
- Dòng 1 của mọi `src/**/*.js`, `plugins/*.js` và `scripts/*.js`: `// <đường dẫn> — <một câu tiếng Việt nói file làm gì>`. Test giữ phần `src/` và `plugins/`.
- Mỗi file khoảng 250 dòng trở xuống (quá 300 là test hỏng). JavaScript ESM thuần + JSDoc. Tên biến tiếng Anh, camelCase. Import tương đối ghi đuôi `.js`.
- Chú thích tiếng Việt ở chỗ cần học; lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.

**Ranh giới** (spec §8.2, `tests/rules/imports.test.js` giữ)
- Xưởng (`engine/`, `ui/`) không import bức; `ui/` không import `engine/` hay three; `lib/` là lá.
- Hàng rào từ vựng: code xưởng không chứa slug, id lớp riêng của bức hay từ trong `meta.fence` (trong đó có `lantern`, `hoa đăng`). Xưởng chỉ biết "chữ đi theo vật", "cử chỉ chạm hai lần", "lần vẽ"; hoa đăng và thơ của nó nằm ở Bức 1.
- (GĐ 5) Chỉ `engine/gpu/draws.js` được gọi `setRenderObjectFunction` (`tests/rules/files.test.js` giữ, Task 6).
- Thêm một công cụ = thêm một file, một dòng trong `engine/tools/index.js` và chữ ở `t.tools[id]` của `ui/strings.vi.js` (spec §15 (c)). Công cụ chỉ nhìn `ToolApi` (view, `draws`), không biết có bức nào.

**TSL và three r186** (spec Phụ lục A)
- Chỉ TSL; không `select()` khi có node dùng chung giữa các nhánh (dùng `Fn` + `If`). Trong một `Fn` gọi ngay, thân nhánh của `If` viết trong ngoặc nhọn, không trả giá trị (A.46). Vòng lặp có số vòng đổi được: `Loop` số vòng cố định + `Break` theo uniform (như `fbm`).
- Không đặt số lên material lúc chạy; mọi thứ đổi lúc chạy đi qua uniform trong node. Không đổi `renderer.toneMapping`, `castShadow`, `receiveShadow`, `shadowMap.enabled`, `scene.fogNode` lúc chạy. Không thêm đèn lúc chạy (số đèn nằm trong cache key): hoa đăng chỉ tự phát sáng.
- Số lượng đổi được lúc chạy (hoa đăng): cấp phát theo trần một lần; `count` của InstancedMesh không đổi, ô trống có cỡ 0.
- Mọi material gán `emissiveNode` tường minh. `pow` với số mũ khác 2/3/4 thì cơ số phải `saturate`/`abs` trước.

**Chuyển động và ngẫu nhiên**
- Không dùng `time`/`deltaTime` của TSL (dùng `ctx.u.time`, `ctx.u.delta`); không dùng `Math.random` (dùng `lib/random.js`).
- (GĐ 5) Đường trôi của hoa đăng tính thẳng từ thời gian, không cộng dồn từng khung: vẽ lại lúc `?freeze` (`update(0, t)`) ra đúng khung N.

**Chữ và trợ năng**
- Chữ người xem thấy nằm trong `ui/strings.vi.js`, `content.vi.js` (và `content.captions.vi.js` của Bức 1) hay các trường chữ của `meta.js`. Không file nào trong `src/` import `strings.*.js`. Code của bức chỉ giữ khóa của chữ.
- Vùng `aria-live` (gợi ý, ghi chú, huy hiệu, trạng thái công cụ, ghi chú Dial, và GĐ 5: vùng chữ đi theo vật) không dùng `hidden` hay `display: none`: để trống khi không có gì để nói. Riêng `?poster` ẩn cả vùng chữ bằng `display: none`, vì đó là ảnh để chụp, không ai nghe vùng live.
- Nút bật/tắt có `aria-pressed`; ô nhập nào cũng có nhãn (axe-core giữ). Quầng trăng chỉ để nhìn (`aria-hidden`).

**Git**
- Làm trên nhánh `gd5-hoa-dang-tung-soi`. Nhánh này tách từ `main` (`2e96d45`), có commit spec GĐ 5 (`7765d36`) và chính file kế hoạch này. Commit bằng danh tính local của repo: `Bao Nguyen <giabao261096@gmail.com>` (kiểm `git config user.email` trước commit đầu). Không sửa git config global.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Thông điệp commit của từng task ghi sẵn ở bước cuối của task.
- Chỉ push ở task nghiệm thu (việc ra bên ngoài, đã nằm trong kế hoạch Bao duyệt). Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

## Review Focus

Năm tình huống người dùng thật dễ gặp mà spec không nói thẳng. Mỗi tình huống có test ở task sở hữu code:
1. **Chạm nhanh hai lần bằng ngón tay khi kính tròn của Kính mài đang bật.** Trên điện thoại, người xem đặt kính rồi chạm nhanh hai lần để dời kính. Mong đợi: kính dời tới chỗ chạm, bức KHÔNG thả hoa đăng; nhấp đúp bằng chuột vẫn tới bức (chuột không đặt kính). Test: `kinh-mai.test.js` "kính tròn giữ cả cú chạm hai lần của ngón tay…" (Task 2).
2. **Chạm hai lần dồn dập lên nước** (trẻ con gõ liên tục). Mong đợi: không bao giờ quá N đèn nổi (8/6/4 theo mức; số đo "Hoa đăng đang trôi" có lúc là N + 1 trong 3 giây, vì đếm cả đèn đang chìm); đèn cũ nhất bắt đầu chìm dần thay vì biến mất (gõ dồn dập tới mức cả N + 1 ô đều có đèn thì ô có đèn chìm lâu nhất được dùng lại, spec §4.2); chữ thay nhau, mỗi lúc một dòng; không có lỗi. Test: `anh-trang-drift.test.js` "thả quá sức chứa…", "chuỗi thả bất kỳ: số đèn nổi không bao giờ quá capacity…", "thả dồn dập…" (Task 8); `captions.test.js` "show lần hai thay dòng cũ: mỗi lúc một dòng" (Task 4); `tha-hoa-dang.test.js` "mỗi lần thả là câu kế tiếp của đêm nay…" (Task 11).
3. **Danh sách lần vẽ đổi giữa chừng khi Từng sợi đang bật.** Kéo camera làm vật ra khỏi khung; thí nghiệm "Tắt instancing" thêm hơn nghìn Mesh (tối đa 1.200 ở mức cao). Mong đợi: đang xem đủ khung thì thanh theo số sợi mới; đang dừng ở sợi k thì danh sách đứng yên và ảnh vẫn là đúng k sợi đầu. Test: `tung-soi.test.js` "số sợi đổi giữa chừng…" (Task 7); `draws.test.js` "limit(k) chỉ vẽ k lần đầu của list…" (Task 6).
4. **Mạng chậm, hay trang về tĩnh giữa lúc tải** (Slow 4G, quá hạn 10 giây). Mong đợi: quầng nhích dần và không bao giờ lùi; về tĩnh thì quầng biến mất ngay; một lần dựng lại đến muộn không vẽ lại quầng trên trang đã tĩnh. Test: `moon-progress.test.js` "chỉ 'loading' vẽ vòng mới…", "'static' và 'lost' gỡ quầng ngay…" (Task 3); `boot.test.js` "quá hạn (late) thì progress của vỏ trang bị khóa…" (Task 3); e2e "quầng trăng (GĐ 5)" (Task 12); `run.test.js`: "Dựng lại cảnh" quá hạn không đụng tới trang đã về tĩnh (Task 17).
5. **Người dùng trình đọc màn hình kéo camera khi chữ đang hiện.** Mong đợi: câu thơ được đọc một lần; ra ngoài khung rồi quay lại thì không bị đọc lại; vùng live không bao giờ `hidden`. Test: `captions.test.js` "place đặt transform…; ra ngoài khung thì chữ mang data-away, không bao giờ hidden", "place chạy mỗi khung: data-away chỉ được ghi khi đổi…" (Task 4); kiểm tay bằng VoiceOver (Task 19).

## Bản đồ file sau GĐ 5

| File | Trách nhiệm | Task |
|---|---|---|
| `src/engine/gpu/gesture.js`, `src/engine/tools/kinh-mai.js`, `contracts/runtime.js` | cử chỉ `'double-tap'`; kính tròn của Kính mài giữ cú chạm hai lần của ngón tay | 2 |
| `src/ui/moon-progress.js` (mới), `src/ui/shell.js`, `src/engine/boot.js`, `src/styles/shell.css` | quầng trăng tiến độ, mốc tải | 3 |
| `src/engine/gpu/caption-set.js` (mới), `src/ui/captions.js` (mới), `src/styles/captions.css` (mới), `src/styles/shell.css` (`@import`, `?poster`), `scene.js`, `layers.js`, `contracts/*`, `e2e/helpers.js` | chữ đi theo vật: `ctx.captions`, vùng `aria-live` | 4 |
| `layer.objects` của Bức 1 và `_mau`, `content.vi.js` (nhãn vật), `contracts/*` | tên vật và nhãn (cho Từng sợi) | 5 |
| `src/engine/gpu/draws.js` (mới), `views.js`, `scene.js`, `toolbox.js`, `contracts/runtime.js` | móc lần vẽ; scene pass chạy đầu tiên trong lượt cuối; `ToolApi.draws` | 6 |
| `src/engine/tools/tung-soi.js` (mới), `tools/index.js`, `src/ui/strings.vi.js`, `src/styles/tools.css`, `e2e/painting.spec.js` (bộ chọn Lột lớp) | công cụ Từng sợi | 7 |
| `src/paintings/ao-sen-dem/parts/anh-trang-drift.js` (mới) | đường trôi của hoa đăng (hàm thuần), thứ tự thơ theo đêm | 8 |
| `parts/anh-trang-lantern.js` (mới), `layers/l2-anh-trang.js`, `shared.js`, `quality.js`, `meta.js`, `content.vi.js`, `src/engine/sma.js` | hoa đăng của lớp Ánh trăng; `__sma.readouts` | 9 |
| `layers/l3-suong.js`, `layers/l4-mat-nuoc.js`; `tests/helpers/nodes.js` (mới) | đèn trong sương, nhấp nhô, vũng sáng; dịch shader trong Node | 10 |
| `content.captions.vi.js` (mới), `shared.js`, `content.vi.js`, `src/styles/shell.css`, `e2e/ao-sen-dem.spec.js` (gợi ý mới) | chạm hai lần thả đèn mang thơ; gợi ý mới | 11 |
| `e2e/helpers.js`, `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`, `e2e/a11y.spec.js` | e2e GĐ 5: Từng sợi, quầng trăng, thả hoa đăng, a11y | 12 |
| `src/styles/shell.css` (`.frame > *`) | khung chữ một cột: huy hiệu và con dấu về đúng góc (lỗi từ GĐ 1) | 13 |
| `src/ui/captions.js`, `src/styles/captions.css` | chữ đi theo vật dừng trên chân khung | 14 |
| hằng số: `parts/anh-trang-drift.js`, `layers/l4-mat-nuoc.js`, `ui/moon-progress.js`, `ui/captions.js`, `src/styles/*.css`; `src/engine/boot.js` (`BOOT_DEADLINE_MS`); `e2e/ao-sen-dem.spec.js` | tinh chỉnh trên GPU thật | 15 |
| `src/engine/gpu/toolbox.js`, `src/ui/workshop.js`, `src/styles/tools.css`, `src/styles/notebook.css` (`--rail-w`, `--notebook-w`); `e2e/painting.spec.js`, `e2e/a11y.spec.js` | bảng công cụ không nằm dưới Sổ tay; thứ tự Tab | 16 |
| `src/engine/gpu/run.js`, `tests/unit/run.test.js` (mới) | "Dựng lại cảnh" quá hạn không đụng tới trang đã về tĩnh; bộ test đầu tiên cho `run()` | 17 |
| `README.md`, `CLAUDE.md`, spec | ghi lại GĐ 5 | 18 |
| (GitHub) | review toàn nhánh, push, PR, CI, kiểm trên máy thật | 19 |

**Không làm trong GĐ 5** (ghi ở đây để khỏi làm lố):
- Link công thức `#r=`, "Xem bản dịch", đàn bầu: Bao chưa chọn, vẫn nằm ở spec §16.
- Từng sợi cho các lượt khác (bóng, ảnh phản chiếu, bloom, hậu kỳ): Bao chọn chỉ lượt vẽ cảnh. Với các lượt đó, dòng tóm tắt của Từng sợi chỉ ghi số draw call.
- Thơ tiếng Anh: khi có bản dịch.
- Đo GPU bằng khoảng thời gian của cả khung (span) cho GPU kiểu tile: vẫn chờ three (§16).

---

### Task 1: Chuẩn bị: máy, nhánh, mốc test

**Mục tiêu:** Có Node 24 và Chromium của Playwright; đứng trên nhánh `gd5-hoa-dang-tung-soi` (đã có spec GĐ 5 và file kế hoạch này); mốc ban đầu là 687 test xanh.

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
git switch gd5-hoa-dang-tung-soi
git log --oneline -3   # file kế hoạch, docs(spec) GĐ 5 7765d36, rồi merge PR #5 (2e96d45)
git config user.email  # phải ra giabao261096@gmail.com
npm ci
npx playwright install chromium
npm test
```
Kết quả mong đợi: `npm test` xanh, `Tests  687 passed (687)` (con số của GĐ 4 sau PR #5).

---

### Task 2: Cử chỉ `double-tap` (`engine/gpu/gesture.js`); kính tròn của Kính mài giữ cú chạm hai lần

**Mục tiêu:** Spec §8.4 (Gesture, mục [5]) và §4.2 "Thả hoa đăng". Bộ nhận cử chỉ có thêm `'double-tap'`: lần chạm xuống thứ hai đến trong vòng 300 ms sau lúc nhấc ngón thứ nhất, và cách chỗ chạm đầu không quá 24 px. Cú chạm thứ hai trả về `[tap, double-tap]` cùng chỗ. Hai lần chạm vẫn là hai `'tap'` phát ngay, không chờ: gợn sóng không trễ chút nào. Thứ gì không phải một tap thường (kéo, vuốt, giữ, ngón thứ hai, hủy, mất `pointerup`) đều xóa lần chạm đang chờ. Chạm ba lần liền chỉ ra một `double-tap`: cặp tính lại từ đầu.

`input.js` không phải sửa: nó chuyển mọi loại cử chỉ qua `gestureAt(kind, …)`, nên `'double-tap'` có sẵn NDC, tia và loại con trỏ, và vẫn gây vẽ lại khi `?freeze` đã dừng.

Kính mài (hình tròn, đang bật) vốn giữ `'tap'` và `'hold-*'` của ngón tay hay bút để đặt kính. Nếu không giữ cả `'double-tap'`, chạm nhanh hai lần để dời kính sẽ đưa `'double-tap'` tới bức, và Bức 1 thả một hoa đăng người xem không hề muốn. Vì vậy `HOLD` của Kính mài có thêm `'double-tap'`. Chuột không đặt kính, nên nhấp đúp bằng chuột vẫn tới bức.

Test của cảnh ở GĐ 4 chạm hai lần cùng một chỗ trong khi đồng hồ giả đứng ở 0, nên giờ hai lần chạm đó thành một `double-tap`. `build()` của `scene.test.js` trả thêm `win`, và test đặt `win.performance.now` như dòng thời gian thật.

**Files:**
- Modify: `src/engine/gpu/gesture.js`, `src/engine/contracts/runtime.js` (typedef Gesture), `src/engine/tools/kinh-mai.js`
- Test: `tests/unit/gesture.test.js`, `tests/unit/input.test.js`, `tests/unit/kinh-mai.test.js`, `tests/unit/scene.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - `GESTURE.doubleMs = 300`, `GESTURE.doublePx = 24` (vẫn `Object.freeze`; `createGestureTracker(options)` nhận ngưỡng riêng như các ngưỡng khác);
  - `up(p)` của cú chạm thứ hai trả `[{ kind: 'tap', x, y }, { kind: 'double-tap', x, y }]`;
  - typedef Gesture: `kind` có thêm `'double-tap'`;
  - kính tròn của Kính mài giữ `'double-tap'` của ngón tay và bút (Task 11 dựa vào điều này). Hình gạt không giữ cử chỉ nào trên canvas (tay nắm gạt là phần tử DOM riêng, cử chỉ trên nó không tới canvas), nên ở hình gạt chạm hai lần lên nước vẫn thả đèn;
  - `scene.test.js#build()` trả thêm `win`: đồng hồ giả đứng ở 0 cho tới khi test đặt `win.performance.now = () => T`.

- [ ] **Step 1: Test (hỏng: chưa có `double-tap`)**

Áp vào `tests/unit/gesture.test.js`:

```diff
diff --git a/tests/unit/gesture.test.js b/tests/unit/gesture.test.js
index 6556334..7ad55b5 100644
--- a/tests/unit/gesture.test.js
+++ b/tests/unit/gesture.test.js
@@ -1,4 +1,4 @@
-// tests/unit/gesture.test.js — phân loại cử chỉ: chạm, giữ, vuốt, kéo (của camera), hai ngón.
+// tests/unit/gesture.test.js — phân loại cử chỉ: chạm, chạm hai lần, giữ, vuốt, kéo (của camera), hai ngón.
 import { describe, it, expect } from 'vitest';
 import { GESTURE, createGestureTracker } from '../../src/engine/gpu/gesture.js';
 
@@ -114,3 +114,129 @@ describe('createGestureTracker', () => {
     expect(kinds(g.poll(50))).toEqual(['hold-start']);
   });
 });
+
+describe('createGestureTracker · chạm hai lần (GĐ 5)', () => {
+  /** Một lần chạm trọn: xuống ở (x, y) lúc t, nhấc ngón tại chỗ sau 50 ms. Trả loại các cử chỉ lúc nhấc ngón. */
+  const tap = (g, x, y, t, id = 1) => {
+    g.down(p(x, y, t, id));
+    return kinds(g.up(p(x, y, t + 50, id)));
+  };
+
+  it('chạm hai lần nhanh và gần → tap, tap, double-tap (double-tap ở chỗ chạm thứ hai, ngay sau tap của nó)', () => {
+    const g = createGestureTracker();
+    g.down(p(100, 100, 0));
+    expect(g.up(p(100, 100, 80))).toEqual([{ kind: 'tap', x: 100, y: 100 }]);
+    // Ngón tay chạm lần hai là một con trỏ mới (pointerId khác; chuột thì giữ id): cặp chạm không xét id.
+    g.down(p(110, 105, 200, 2));
+    expect(g.up(p(111, 106, 260, 2))).toEqual([
+      { kind: 'tap', x: 110, y: 105 },
+      { kind: 'double-tap', x: 110, y: 105 },
+    ]);
+    expect(g.state).toBe('idle');
+  });
+
+  it('lần chạm hai xuống quá doubleMs sau lúc nhấc ngón đầu → chỉ hai tap (đúng doubleMs vẫn tính)', () => {
+    const late = createGestureTracker();
+    expect(tap(late, 50, 50, 0)).toEqual(['tap']); // nhấc ngón lúc 50
+    expect(tap(late, 50, 50, 50 + GESTURE.doubleMs + 1)).toEqual(['tap']);
+
+    // Đo từ lúc nhấc ngón, không phải lúc chạm xuống: lần hai đến 350 ms sau lần chạm đầu vẫn thành cặp.
+    const edge = createGestureTracker();
+    tap(edge, 50, 50, 0);
+    expect(tap(edge, 50, 50, 50 + GESTURE.doubleMs)).toEqual(['tap', 'double-tap']);
+  });
+
+  it('lần chạm hai cách chỗ chạm đầu quá doublePx → chỉ hai tap (đo từ chỗ chạm xuống; đúng doublePx vẫn tính)', () => {
+    const far = createGestureTracker();
+    far.down(p(0, 0, 0));
+    far.move(p(6, 0, 30)); // ngón trượt nhẹ (chưa quá tapPx): lần chạm vẫn ở chỗ chạm xuống (0, 0)
+    far.up(p(6, 0, 60));
+    expect(tap(far, GESTURE.doublePx + 1, 0, 120)).toEqual(['tap']); // cách (6, 0) chưa tới doublePx, cách (0, 0) thì quá
+
+    const edge = createGestureTracker();
+    tap(edge, 0, 0, 0);
+    expect(tap(edge, 0, GESTURE.doublePx, 120)).toEqual(['tap', 'double-tap']);
+
+    // Lần hai cũng đo từ chỗ chạm XUỐNG: xuống cách đúng doublePx rồi trượt ra thêm (chưa quá tapPx) trước khi nhấc vẫn thành cặp.
+    const slide = createGestureTracker();
+    tap(slide, 0, 0, 0);
+    slide.down(p(GESTURE.doublePx, 0, 120, 2));
+    slide.move(p(GESTURE.doublePx + 6, 0, 140, 2));
+    expect(kinds(slide.up(p(GESTURE.doublePx + 6, 0, 160, 2)))).toEqual(['tap', 'double-tap']);
+  });
+
+  it('chạm ba lần liền → chỉ một double-tap: cặp tính lại từ đầu, lần ba là tap thường (lần bốn mới thành cặp)', () => {
+    const g = createGestureTracker();
+    expect([tap(g, 30, 30, 0), tap(g, 30, 30, 100), tap(g, 30, 30, 200), tap(g, 30, 30, 300)]).toEqual([
+      ['tap'],
+      ['tap', 'double-tap'],
+      ['tap'],
+      ['tap', 'double-tap'],
+    ]);
+  });
+
+  it('lần chạm hai thành giữ → không có double-tap; thành kéo → không gì, và lần chạm đầu bị quên', () => {
+    const held = createGestureTracker();
+    tap(held, 20, 20, 0);
+    held.down(p(20, 20, 100));
+    expect(kinds(held.poll(100 + GESTURE.holdMs))).toEqual(['hold-start']);
+    expect(kinds(held.up(p(20, 20, 600)))).toEqual(['hold-end']);
+
+    // Máy bận, chưa kịp poll: nhấc ngón sau holdMs vẫn là một lần giữ, không phải lần chạm hai.
+    const busy = createGestureTracker();
+    tap(busy, 20, 20, 0);
+    busy.down(p(20, 20, 100));
+    expect(kinds(busy.up(p(20, 20, 100 + GESTURE.holdMs)))).toEqual(['hold-start', 'hold-end']);
+
+    // Ngưỡng giữ ngắn hơn doubleMs: chạm ngay sau cái giữ, đúng chỗ cũ, cũng không ghép với 'tap' trước cái giữ.
+    const quick = createGestureTracker({ holdMs: 100 });
+    tap(quick, 20, 20, 0);
+    quick.down(p(20, 20, 60));
+    expect(kinds(quick.poll(160))).toEqual(['hold-start']);
+    quick.up(p(20, 20, 170));
+    expect(tap(quick, 20, 20, 200)).toEqual(['tap']);
+
+    // Như trên nhưng chưa kịp poll (máy bận): cái giữ muộn cũng xóa 'tap' lẻ.
+    const lateHold = createGestureTracker({ holdMs: 100 });
+    tap(lateHold, 20, 20, 0);
+    lateHold.down(p(20, 20, 60));
+    expect(kinds(lateHold.up(p(20, 20, 170)))).toEqual(['hold-start', 'hold-end']);
+    expect(tap(lateHold, 20, 20, 200)).toEqual(['tap']);
+
+    const dragged = createGestureTracker();
+    tap(dragged, 20, 20, 0);
+    dragged.down(p(20, 20, 100));
+    dragged.move(p(20 + GESTURE.tapPx + 1, 20, 120));
+    expect(dragged.up(p(20 + GESTURE.tapPx + 1, 20, 160))).toEqual([]);
+    // Lần chạm đầu đã bị quên: chạm ngay sau cú kéo, đúng chỗ cũ, cũng không ghép với nó.
+    expect(tap(dragged, 20, 20, 200)).toEqual(['tap']);
+  });
+
+  it('ngón thứ hai, cancel, mất pointerup giữa hai lần chạm → lần chạm đầu bị quên: lần sau chỉ là tap', () => {
+    const pinch = createGestureTracker();
+    tap(pinch, 20, 20, 0);
+    pinch.down(p(20, 20, 100, 1));
+    pinch.down(p(80, 80, 110, 2)); // chụm hai ngón để zoom
+    pinch.up(p(80, 80, 150, 2));
+    pinch.up(p(20, 20, 160, 1));
+    expect(tap(pinch, 20, 20, 200)).toEqual(['tap']);
+
+    const left = createGestureTracker();
+    tap(left, 20, 20, 0);
+    left.cancel(); // rời trang (blur, pointercancel) giữa hai lần chạm
+    expect(tap(left, 20, 20, 100)).toEqual(['tap']);
+
+    const lost = createGestureTracker();
+    tap(lost, 20, 20, 0);
+    lost.down(p(20, 20, 100)); // pointerup của lần chạm này không bao giờ tới
+    expect(tap(lost, 20, 20, 200)).toEqual(['tap']);
+  });
+
+  it('ngưỡng mặc định 300 ms, 24 px; doubleMs và doublePx tùy chỉnh được', () => {
+    expect(GESTURE).toMatchObject({ doubleMs: 300, doublePx: 24 });
+    const g = createGestureTracker({ doubleMs: 500, doublePx: 60 });
+    tap(g, 0, 0, 0);
+    // Lần hai đến 450 ms sau lúc nhấc ngón, cách 50 px: quá ngưỡng mặc định cả hai phía, vẫn trong ngưỡng riêng.
+    expect(tap(g, 50, 0, 500)).toEqual(['tap', 'double-tap']);
+  });
+});
```
Áp vào `tests/unit/input.test.js`:

```diff
diff --git a/tests/unit/input.test.js b/tests/unit/input.test.js
index 381ffa2..1d346bf 100644
--- a/tests/unit/input.test.js
+++ b/tests/unit/input.test.js
@@ -92,6 +92,28 @@ describe('createInput', () => {
     expect(input.drain().map((g) => `${g.kind}:${g.pointer}`)).toEqual(['tap:touch', 'hold-start:pen', 'hold-end:pen', 'tap:mouse']);
   });
 
+  it("chạm hai lần liền nhau (GĐ 5) → tap, tap, rồi 'double-tap' ở chỗ chạm hai, kèm NDC, tia và loại con trỏ", () => {
+    const onQueue = vi.fn();
+    const own = createInput({ canvas, camera, controls, pointer: u, win, onQueue });
+    // Mỗi lần ngón tay chạm là một con trỏ mới (pointerId khác, vẫn là con trỏ chính); lần hai cách lần đầu 10 px.
+    const touch = (type, x, id) => canvas.dispatchEvent(pointer(type, x, 50, { pointerType: 'touch', pointerId: id, isPrimary: true }));
+    touch('pointerdown', 90, 1);
+    clock = 60;
+    touch('pointerup', 90, 1);
+    clock = 160;
+    touch('pointerdown', 100, 2);
+    clock = 220;
+    touch('pointerup', 100, 2);
+    const queued = own.drain();
+    expect(queued.map((g) => `${g.kind}:${g.pointer}`)).toEqual(['tap:touch', 'tap:touch', 'double-tap:touch']);
+    const [, second, double] = queued;
+    expect(double.ndc).toEqual({ x: 0, y: 0 });
+    expect(double.ray).toEqual(second.ray); // cùng chỗ với lần chạm hai
+    expect(double.ray.origin.toArray()).toEqual([0, 5, 10]);
+    expect(onQueue).toHaveBeenLastCalledWith('double-tap'); // cảnh đứng yên (?freeze) thấy cử chỉ mới và vẽ lại
+    own.dispose();
+  });
+
   it('giữ yên holdMs → hold-start và camera đứng yên; thả → hold-end, camera chạy lại', () => {
     canvas.dispatchEvent(pointer('pointerdown', 50, 50));
     clock = GESTURE.holdMs;
```
Áp vào `tests/unit/kinh-mai.test.js`:

```diff
diff --git a/tests/unit/kinh-mai.test.js b/tests/unit/kinh-mai.test.js
index 331f291..ee7bcdd 100644
--- a/tests/unit/kinh-mai.test.js
+++ b/tests/unit/kinh-mai.test.js
@@ -72,6 +72,16 @@ describe('Kính mài', () => {
     expect(lens.onGesture(gesture('swipe', 'touch'))).toBe(false); // sương xoáy vẫn là của bức
   });
 
+  it('kính tròn giữ cả cú chạm hai lần của ngón tay (không để bức thả hoa đăng ngoài ý người xem); chuột thì không giữ', () => {
+    const lens = kinhMai.mount(fakeApi());
+    expect(lens.onGesture(gesture('double-tap', 'touch'))).toBe(false); // kính tắt: cử chỉ là của bức
+    lens.activate(true);
+    // Hai 'tap' của ngón tay đã đặt kính, nên 'double-tap' ghép từ chúng cũng là của kính.
+    expect(lens.onGesture(gesture('double-tap', 'touch'))).toBe(true);
+    expect(lens.onGesture(gesture('double-tap', 'pen'))).toBe(true);
+    expect(lens.onGesture(gesture('double-tap', 'mouse'))).toBe(false); // nhấp đúp chuột vẫn tới bức, như nhấp chuột
+  });
+
   it('hình gạt: tay nắm hiện; mũi tên ±2%, Home/End; mỗi lần đổi thì vẽ lại; canvas không giữ cử chỉ nào', async () => {
     const api = fakeApi();
     const lens = kinhMai.mount(api);
```
Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 193f844..03b5afb 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -85,7 +85,7 @@ function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, t
     now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools,
   });
   const renders = () => stage.renderer.render.mock.calls.length;
-  return { stage, disposer, scene, frames, flush, renders };
+  return { stage, disposer, scene, frames, flush, renders, win };
 }
 
 describe('buildScene', () => {
@@ -252,7 +252,7 @@ describe('buildScene', () => {
       id: 'kinh',
       mount: () => ({ onGesture: (g) => { seen.push(g.kind); return g.kind === 'tap'; }, dispose() {} }),
     };
-    const { stage, scene } = build({ setup: () => ({ onGesture }), tools: [lens] });
+    const { stage, scene, win } = build({ setup: () => ({ onGesture }), tools: [lens] });
     const canvas = stage.renderer.domElement;
     const event = (type, extra) => Object.assign(new Event(type), { clientX: 320, clientY: 200, pointerId: 1, button: 0, ...extra });
     const tap = () => {
@@ -265,6 +265,8 @@ describe('buildScene', () => {
     expect(onGesture.mock.calls.map(([g]) => g.kind)).toEqual(['tap']); // chưa bật công cụ: bức nhận chạm, không nhận hover
     await scene.studio.setTool('kinh');
     expect(scene.studio.tools()).toEqual([{ id: 'kinh', on: true }]);
+    // Người xem bật công cụ mất vài giây: lần chạm sau không ghép với lần trước thành chạm hai lần (GĐ 5).
+    win.performance.now = () => 5000;
     canvas.dispatchEvent(event('pointermove', { pointerType: 'mouse', buttons: 0 }));
     tap();
     scene.step(1016);
```

Run: `npx vitest run tests/unit/gesture.test.js tests/unit/input.test.js tests/unit/kinh-mai.test.js tests/unit/scene.test.js`
Kết quả mong đợi: FAIL, 7 test hỏng; lỗi đầu tiên: `AssertionError: expected [ { kind: 'tap', x: 110, y: 105 } ] to deeply equal [ …(2) ]`.

- [ ] **Step 2: Code**

Áp vào `src/engine/gpu/gesture.js`:

```diff
diff --git a/src/engine/gpu/gesture.js b/src/engine/gpu/gesture.js
index cbd38a2..af7f149 100644
--- a/src/engine/gpu/gesture.js
+++ b/src/engine/gpu/gesture.js
@@ -1,7 +1,10 @@
-// engine/gpu/gesture.js — phân loại thao tác con trỏ thành cử chỉ: chạm, giữ (bắt đầu / di / thả), vuốt, kéo. Hàm thuần.
+// engine/gpu/gesture.js — phân loại thao tác con trỏ thành cử chỉ: chạm, chạm hai lần, giữ (bắt đầu / di / thả), vuốt, kéo. Hàm thuần.
 
-/** Ngưỡng mặc định: lệch quá tapPx là "kéo" (camera); giữ yên quá holdMs là "giữ"; kéo nhanh và xa là "vuốt". */
-export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300 });
+/**
+ * Ngưỡng mặc định: lệch quá tapPx là "kéo" (camera); giữ yên quá holdMs là "giữ"; kéo nhanh và xa là "vuốt";
+ * chạm xuống lại trong doubleMs sau lúc nhấc ngón, cách chỗ chạm trước ≤ doublePx, là "chạm hai lần" (GĐ 5).
+ */
+export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300, doubleMs: 300, doublePx: 24 });
 
 /**
  * Máy trạng thái cho MỘT ngón (hoặc chuột). Không biết DOM hay three: nhận tọa độ màn hình (px)
@@ -10,6 +13,8 @@ export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipe
  *   idle ─down→ pending ─(lệch > tapPx)→ drag ─up→ (nhanh + xa: 'swipe') → idle
  *                 │ └─up (trước holdMs)→ 'tap' → idle
  *                 └─poll (≥ holdMs, chưa lệch)→ 'hold-start' → hold ─move→ 'hold-move' ─up→ 'hold-end'
+ * 'tap' tới ngay sau một 'tap' lẻ (xuống trong doubleMs sau lúc nhấc ngón đó, cách chỗ của nó ≤ doublePx) thì kèm 'double-tap'
+ * cùng chỗ, rồi cặp tính lại từ đầu. Hai lần chạm vẫn là hai 'tap'; cử chỉ nào khác 'tap' cũng xóa 'tap' lẻ đang chờ.
  * Ngón thứ hai chạm xuống (chụm hai ngón = zoom camera) thì hủy: đang giữ thì phát 'hold-end'.
  * 'drag' không phát ra ngoài: kéo là của camera (OrbitControls tự nghe).
  * 'hold-end' luôn ở chỗ ngón giữ đứng lần cuối, dù cái giữ kết thúc bằng cách nào.
@@ -17,14 +22,18 @@ export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipe
  * @param {Partial<typeof GESTURE>} [options]
  */
 export function createGestureTracker(options = {}) {
-  const { tapPx, holdMs, swipePx, swipeMs } = { ...GESTURE, ...options };
+  const { tapPx, holdMs, swipePx, swipeMs, doubleMs, doublePx } = { ...GESTURE, ...options };
   let state = 'idle';
   let start = null; // { id, x, y, t } lúc chạm xuống
   let last = null; // vị trí mới nhất của ngón đó
+  let lone = null; // { x, y, t }: 'tap' lẻ chờ lần chạm hai (chỗ chạm xuống, lúc nhấc ngón)
   const pointers = new Set();
 
   const moved = (p) => Math.hypot(p.x - start.x, p.y - start.y);
   const at = (kind, p, extra = {}) => ({ kind, x: p.x, y: p.y, ...extra });
+  // Lần chạm đang kết thúc là lần hai của một cặp? Đo từ lúc NHẤC ngón của 'tap' lẻ: mỗi lần chạm đè ngón lâu hay mau
+  // tùy người, còn khoảng hở giữa hai lần chạm thì luôn ngắn. Không xét id: mỗi lần ngón tay chạm là một con trỏ mới.
+  const isSecondTap = () => lone !== null && start.t - lone.t <= doubleMs && Math.hypot(start.x - lone.x, start.y - lone.y) <= doublePx;
 
   /** Bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
   function cancel() {
@@ -32,6 +41,7 @@ export function createGestureTracker(options = {}) {
     pointers.clear();
     start = null;
     last = null;
+    lone = null; // mất con trỏ giữa hai lần chạm: không ghép cặp qua chỗ đứt đó
     state = 'idle';
     return out;
   }
@@ -85,13 +95,17 @@ export function createGestureTracker(options = {}) {
       if (state === 'hold') out = [at('hold-end', p)];
       // Đã giữ đủ lâu nhưng đồng hồ hẹn giờ chưa kịp poll (máy bận, tab bị bóp nhịp): vẫn là một lần giữ, không phải chạm.
       else if (state === 'pending' && p.t - start.t >= holdMs) out = [at('hold-start', start), at('hold-end', p)];
-      else if (state === 'pending') out = [at('tap', start)];
+      // Không đợi xem có lần chạm sau: mỗi 'tap' phát ngay, không trễ. Lần hai của một cặp kèm 'double-tap' liền sau, cùng chỗ.
+      else if (state === 'pending') out = isSecondTap() ? [at('tap', start), at('double-tap', start)] : [at('tap', start)];
       else if (state === 'drag') {
         const dt = p.t - start.t;
         if (dt > 0 && dt <= swipeMs && moved(p) >= swipePx) {
           out = [at('swipe', p, { velocity: { x: ((p.x - start.x) / dt) * 1000, y: ((p.y - start.y) / dt) * 1000 } })];
         }
       }
+      // Chỉ một 'tap' lẻ được nhớ để chờ lần hai. Đã thành cặp thì quên (lần chạm thứ ba mở cặp mới); giữ, kéo, vuốt,
+      // hai ngón cũng quên: lần chạm sau không ghép với 'tap' trước chúng.
+      lone = out.length === 1 && out[0].kind === 'tap' ? { x: start.x, y: start.y, t: p.t } : null;
       start = null;
       last = null;
       state = pointers.size === 0 ? 'idle' : 'multi';
```
Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index e684265..7765d9f 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -106,7 +106,9 @@
  * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
  */
 /** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
- * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'|'hover'} kind
+ * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'|'hover'|'double-tap'} kind
+ *                                 [5] 'double-tap': phát ngay sau 'tap' thứ hai, cùng chỗ, khi lần chạm xuống thứ hai đến trong vòng
+ *                                 300 ms sau lần nhấc ngón thứ nhất và cách chỗ chạm đầu ≤ 24 px. Hai lần chạm vẫn là hai 'tap'
  *                                 [4] 'hover': chuột di mà không bấm, mỗi khung tối đa một. CHỈ công cụ nhận; bức không bao giờ
  *                                 nhận 'hover' (onGesture của bức giữ nguyên nghĩa)
  * @property {{ x: number, y: number }} ndc
```
Áp vào `src/engine/tools/kinh-mai.js`:

```diff
diff --git a/src/engine/tools/kinh-mai.js b/src/engine/tools/kinh-mai.js
index 0515a18..6585bba 100644
--- a/src/engine/tools/kinh-mai.js
+++ b/src/engine/tools/kinh-mai.js
@@ -14,7 +14,7 @@ const SHAPES = ['tron', 'gat']; // chỉ số trong uniform lens_shape
 // ra cam đất (168, 101, 17). convertLinearToSRGB() đổi ngược về đúng số của #D4A94A.
 export const RIM = new Color('#D4A94A').convertLinearToSRGB();
 const STEP = 0.02; // một lần bấm mũi tên trên tay nắm gạt: 2% chiều ngang
-const HOLD = ['tap', 'hold-start', 'hold-move', 'hold-end'];
+const HOLD = ['tap', 'double-tap', 'hold-start', 'hold-move', 'hold-end'];
 const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
 
 /**
@@ -154,7 +154,8 @@ export function mount(api) {
         move(g.ndc); // máy tính: kính đi theo chuột
         return true;
       }
-      // Chạm và giữ của ngón tay, bút: đặt và dời kính. Bấm chuột thì vẫn là của bức (gợn sóng); vuốt, kéo cũng vậy.
+      // Chạm và giữ của ngón tay, bút: đặt và dời kính. Cả 'double-tap': hai 'tap' làm nên nó đã là của kính, bức mà nhận
+      // thì làm điều người xem không định. Bấm chuột (cả nhấp đúp) thì vẫn là của bức (gợn sóng); vuốt, kéo cũng vậy.
       if (g.pointer === 'mouse' || !HOLD.includes(g.kind)) return false;
       move(g.ndc);
       return true;
```

Run: `npx vitest run tests/unit/gesture.test.js tests/unit/input.test.js tests/unit/kinh-mai.test.js tests/unit/scene.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  696 passed`.

```bash
git add src/engine/contracts/runtime.js src/engine/gpu/gesture.js src/engine/tools/kinh-mai.js tests/unit/gesture.test.js tests/unit/input.test.js tests/unit/kinh-mai.test.js tests/unit/scene.test.js
git commit -F - <<'EOF'
feat(engine): cử chỉ double-tap (lần chạm hai trong 300 ms, cách ≤ 24 px; hai lần chạm vẫn là hai tap)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Quầng trăng tiến độ (`ui/moon-progress.js`)

**Mục tiêu:** Spec §4.1 mục 1 và §8.5 (mốc của quầng). Lúc chờ cảnh 3D, trăng cạnh con dấu (`[data-moon]`) có một vòng quầng vàng lá. Vòng vẽ dần từ đỉnh, theo chiều kim đồng hồ. Mỗi mốc tải đặt một đích và một thời gian bò (`HALO_STEPS`). Vòng bò từ chỗ đang đứng tới đích bằng một CSS transition ease-out, nên không cần vòng `requestAnimationFrame` nào:

| Mốc | Ai báo | Đích | Bò trong |
|---|---|---|---|
| `'loading'` | vỏ trang (`setState`) | 0,45 | 6 s |
| `'chunk'` | `boot.js`, ngay sau `loadRun()` | 0,62 | 3 s |
| `'compiling'` | vỏ trang | 0,9 | 4 s |
| `'fading'` | vỏ trang | 1 | 0,3 s, rồi tan trong 600 ms còn lại của 900 ms canvas hòa dần |
| `'live'` | vỏ trang | gỡ vòng (đã tan hết) | |
| `'static'`, `'lost'` | vỏ trang | gỡ ngay | |

Task 15 chỉnh lại theo số đo trên máy thật: số giây (6/3/4 → 10/4/3), bán kính vòng (104 → 105) và nét (7 → 9). Luật của quầng:
- Chỉ `'loading'` bắt đầu một vòng ("Dựng lại cảnh" cũng đi qua `'loading'`). Mốc khác chỉ tác động lên vòng đang có, nên một mốc đến muộn không vẽ quầng trên trang đã về tĩnh.
- Vòng không bao giờ lùi.
- Người xem xin giảm chuyển động: vòng nhảy thẳng tới đích (`transition: none !important` thắng transition inline).
- Quầng chỉ để nhìn (`aria-hidden`); nó không phải vùng live.
- Boot quá hạn thì `progress` của vỏ trang bị khóa như các hàm khác.
- Không có mốc nào giữa lúc biên dịch xong và `'fading'`. Ngay sau đó là khung ẩn, chạy đồng bộ trên luồng chính; transition của `stroke-dashoffset` cũng chạy trên luồng chính, nên quầng đứng yên suốt khung ẩn. `run.js` đặt `'fading'` liền sau khung ẩn trong cùng một tác vụ, nên một đích đặt trước khung ẩn bị thay trước khi trình duyệt kịp vẽ (bản dựng thử đo trên GPU thật, WebGPU và WebGL2 SwiftShader). Vì vậy `run.js` không phải sửa gì cho quầng.

Hai điều học được lúc dựng thử:
- **Chrome đo `pathLength` của hình rất nhỏ quá thô.** Mỗi phần tư vòng thành một dây cung, chu vi đo được là 4·r·√2 ≈ 0,9·2πr. Vòng r = 1,04 với `pathLength="1"` vì vậy không bao giờ khép, và lúc rỗng vẫn ló một cung. Cách sửa: vẽ vòng ở toạ độ riêng lớn gấp 100 (`r="104"`, `transform="rotate(-90) scale(0.01)"`, nét 7), và đặt `stroke-dasharray: 1 2` (khoảng trống dài hơn cả vòng, nên không nét nào của chu kỳ sau ló ra). Task 18 ghi điều này vào Phụ lục A.
- **Phần nhẹ phải chạy trên trình duyệt cũ.** `Object.hasOwn` mà nằm trong `setState('detecting')` đầu tiên của boot (ngoài mọi try/catch) thì Safari < 15.4 ném lỗi trước khi tầng tĩnh kịp vẽ huy hiệu. Vì vậy phần nhẹ dùng `hasOwnProperty.call`. Một luật mới trong `tests/rules/imports.test.js` cấm built-in ES2022 trở lên trong bao đóng import tĩnh của phần nhẹ.

**Files:**
- Create: `src/ui/moon-progress.js`
- Modify:
  - `src/ui/shell.js`: `progress(name)`; `setState` báo mốc cho quầng; lưới an toàn của `crossfade()` tính từ `CROSSFADE_MS`;
  - `src/engine/boot.js`: `runShell.progress('chunk')` sau `loadRun()`; `progress` bị khóa khi quá hạn;
  - `src/styles/shell.css`: `.moon-halo`.
- Test: `tests/unit/moon-progress.test.js` (mới), `tests/unit/shell-halo.test.js` (mới), `tests/unit/boot.test.js`, `tests/unit/shell-css.test.js`, `tests/rules/imports.test.js`

**Interfaces:**
- Consumes: `drawMoon` (`ui/moon-svg.js`) vẽ trăng trong `[data-moon]` như GĐ 4.
- Produces:
  - `HALO_STEPS`: đông cứng; `{ loading, chunk, compiling, fading }`, mỗi mục `{ to, seconds }`;
  - `CROSSFADE_MS = 900`: khớp `transition: opacity 900ms` của canvas (test giữ);
  - `createMoonProgress(svg) → { step(name), dispose() }`: `dispose` gỡ quầng và thôi nhận mốc;
  - vỏ trang có `progress(name)`; `setState(state)` tự báo mốc cho quầng.

  Task 12 đọc `HALO_STEPS` trong e2e; Task 15 chỉnh số giây, bán kính và nét.

- [ ] **Step 1: Test (hỏng: chưa có `ui/moon-progress.js`)**

Tạo `tests/unit/moon-progress.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/moon-progress.test.js — quầng trăng tiến độ: vòng quầng trong <svg data-moon> nhích theo mốc tải, đầy rồi tan lúc hòa dần, gỡ khi live hay về tĩnh.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMoonProgress } from '../../src/ui/moon-progress.js';
import { drawMoon } from '../../src/ui/moon-svg.js';

let svg;
let progress;
beforeEach(() => {
  document.body.innerHTML = '<svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>';
  svg = document.querySelector('[data-moon]');
  drawMoon(svg, 2);
  progress = createMoonProgress(svg);
});
afterEach(() => {
  vi.restoreAllMocks();
});

const halo = () => svg.querySelector('.moon-halo');
/** stroke-dashoffset ĐÍCH (style inline) của quầng: 1 là vòng rỗng, 0 là vòng đầy; transition CSS bò tới đó. */
const offset = () => Number(halo().style.strokeDashoffset);

/**
 * Ghi dashoffset của quầng mỗi lần style bị buộc tính lại (getComputedStyle): đó là giá trị trình duyệt "chốt"
 * trước khi đổi. Thiếu bước chốt, tạo vòng và đặt đích rơi vào cùng một lần tính style, nên không có transition.
 */
function watchFlush() {
  const seen = [];
  const original = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
    if (el.classList?.contains('moon-halo')) seen.push(el.style.strokeDashoffset);
    return original(el, pseudo);
  });
  return seen;
}

describe('createMoonProgress', () => {
  it("chưa tới 'loading' ('poster', 'detecting') thì không có quầng", () => {
    progress.step('poster');
    progress.step('detecting');
    expect(halo()).toBeNull();
    expect(svg.childElementCount).toBe(2); // chỉ có trăng: đĩa tối + phần sáng
  });

  it("'loading' tạo vòng có pathLength 1, dashoffset đích 0,55 và transition 6s", () => {
    const flushed = watchFlush();
    progress.step('loading');
    const ring = halo();
    expect(ring.getAttribute('pathLength')).toBe('1');
    // Bán kính 1,04 trên trăng, vẽ ở toạ độ riêng gấp 100 rồi thu lại (ui/moon-progress.js nói vì sao).
    expect(ring.getAttribute('r')).toBe('104');
    expect(ring.getAttribute('transform')).toBe('rotate(-90) scale(0.01)'); // nét bắt đầu ở đỉnh, đi theo chiều kim đồng hồ
    expect(svg.lastElementChild).toBe(ring); // vẽ sau trăng, nằm trên cùng
    // Vòng mới được chốt ở trạng thái rỗng TRƯỚC khi đặt đích, nên mốc đầu tiên cũng bò chứ không nhảy.
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
    expect(ring.style.transition).toBe('stroke-dashoffset 6s cubic-bezier(0.15, 0.6, 0.25, 1)');
  });

  it('các mốc sau đi tiếp đúng đích: chunk 0,38 → compiling 0,1 → fading 0', () => {
    progress.step('loading');
    const ring = halo();
    for (const [name, target, seconds] of [['chunk', 0.38, 3], ['compiling', 0.1, 4], ['fading', 0, 0.3]]) {
      progress.step(name);
      expect(halo(), name).toBe(ring); // vẫn vòng cũ: transition mới đi tiếp từ chỗ đang đứng
      expect(offset(), name).toBeCloseTo(target, 4);
      expect(ring.style.transition, name).toMatch(new RegExp(`^stroke-dashoffset ${seconds}s `));
    }
  });

  it("mốc tới muộn không kéo vòng lùi ('chunk' sau 'compiling' giữ đích của compiling)", () => {
    progress.step('loading');
    progress.step('compiling');
    progress.step('chunk');
    expect(offset()).toBeCloseTo(0.1, 4);
    expect(halo().style.transition).toMatch(/^stroke-dashoffset 4s /); // transition của compiling không bị thay
  });

  it("'fading' làm quầng đầy rồi tan cùng lúc hòa dần; 'live' gỡ quầng; 'loading' sau đó vẽ lại từ vòng rỗng", () => {
    for (const name of ['loading', 'chunk', 'compiling']) progress.step(name);
    const ring = halo();
    progress.step('fading');
    expect(halo()).toBe(ring);
    expect(offset()).toBe(0); // vòng đầy…
    expect(ring.style.opacity).toBe('0'); // …và tan ngay trong lúc canvas hòa dần, không đợi tới 'live'
    // Đầy trong 0,3 giây rồi tan 600 ms: hết đúng 900 ms, cùng lúc canvas hòa dần xong (shell.css).
    expect(ring.style.transition).toBe('stroke-dashoffset 0.3s cubic-bezier(0.15, 0.6, 0.25, 1), opacity 600ms ease-out 300ms');

    progress.step('live'); // crossfade() chỉ xong sau 900 ms hòa dần: quầng đã tan hết, gỡ hẳn khỏi trang
    expect(halo()).toBeNull();

    const flushed = watchFlush();
    progress.step('loading');
    expect(svg.querySelectorAll('.moon-halo')).toHaveLength(1);
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
    expect(halo().style.opacity).toBe(''); // vòng mới, hiện rõ
  });

  it("'static' và 'lost' gỡ quầng ngay; 'loading' sau đó vẽ lại từ vòng rỗng", () => {
    for (const name of ['static', 'lost']) {
      progress.step('loading');
      progress.step('compiling');
      progress.step(name);
      expect(halo(), name).toBeNull();
    }
    // "Dựng lại cảnh" đi lại từ 'loading': vòng mới không còn nhớ đích 0,9 của lần dựng trước.
    const flushed = watchFlush();
    progress.step('loading');
    expect(flushed).toEqual(['1']);
    expect(offset()).toBeCloseTo(0.55, 4);
  });

  it("chỉ 'loading' vẽ vòng mới: mốc đến muộn sau khi quầng đã gỡ không vẽ lại", () => {
    progress.step('chunk'); // chưa tới 'loading'
    expect(halo()).toBeNull();
    progress.step('loading');
    progress.step('static');
    // "Dựng lại cảnh" quá hạn: trang đã về tĩnh mà phần 3D đến muộn vẫn báo tiếp. Quầng kẹt ở 90% trên tranh tĩnh là sai.
    for (const name of ['compiling', 'fading']) {
      progress.step(name);
      expect(halo(), name).toBeNull();
    }
  });

  it("svg bị thay nội dung giữa lúc tải (drawMoon vẽ lại): mốc sau không vẽ lại quầng, 'loading' vẽ vòng mới từ vòng rỗng", () => {
    progress.step('loading');
    svg.replaceChildren(); // như drawMoon vẽ lại: thay hẳn nội dung svg, gỡ luôn quầng
    expect(() => progress.step('chunk')).not.toThrow();
    expect(halo()).toBeNull(); // chỉ 'loading' vẽ vòng mới
    // 'chunk' không ghi đích vào vòng đã rời trang, nên 'loading' sau đó không bị coi là mốc tới muộn.
    const flushed = watchFlush();
    progress.step('loading');
    expect(halo()).not.toBeNull();
    expect(flushed).toEqual(['1']); // vòng mới chốt ở trạng thái rỗng rồi mới bò
    expect(offset()).toBeCloseTo(0.55, 4);
  });

  it("dispose gỡ quầng và thôi nhận mốc: kể cả 'loading' về sau cũng không vẽ lại", () => {
    progress.step('loading');
    progress.dispose();
    expect(halo()).toBeNull();
    progress.step('loading');
    expect(halo()).toBeNull();
  });
});
```
Tạo `tests/unit/shell-halo.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/shell-halo.test.js — vỏ trang nối quầng trăng tiến độ (GĐ 5): setState và progress(mốc) cho quầng trong [data-moon] nhích; trang không có trăng thì thôi.
import { describe, it, expect, beforeEach } from 'vitest';
import { mountShell } from '../../src/ui/shell.js';
import { HALO_STEPS } from '../../src/ui/moon-progress.js';
import t from '../../src/ui/strings.vi.js';
import { mountPage } from '../helpers/page.js';

const meta = { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'phu-bong' }, { id: 'lop-ba' }] };
const NOW = new Date('2026-09-28T21:00:00+07:00');

let page;
beforeEach(() => {
  page = mountPage(document);
});

const halo = () => page.moon.querySelector('.moon-halo');
const offset = () => Number(halo().style.strokeDashoffset);

describe('vỏ trang · quầng trăng tiến độ (GĐ 5)', () => {
  it("setState('loading') vẽ quầng trong [data-moon]; progress('chunk') cho quầng đi tiếp; về tĩnh thì gỡ", () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.setState('detecting');
    expect(halo()).toBeNull();
    shell.setState('loading');
    expect(offset()).toBeCloseTo(1 - HALO_STEPS.loading.to, 4);
    shell.progress('chunk');
    expect(offset()).toBeCloseTo(1 - HALO_STEPS.chunk.to, 4);
    expect(document.body.dataset.state).toBe('loading'); // mốc không phải trạng thái
    shell.setState('static');
    expect(halo()).toBeNull();
  });

  it('trang không có [data-moon] thì progress không làm gì (không ném)', () => {
    page.moon.remove();
    const shell = mountShell(document, meta, { now: NOW, t });
    expect(() => {
      shell.setState('loading');
      shell.progress('chunk');
    }).not.toThrow();
    expect(document.querySelector('.moon-halo')).toBeNull();
  });
});
```
Áp vào `tests/unit/boot.test.js`:

```diff
diff --git a/tests/unit/boot.test.js b/tests/unit/boot.test.js
index c51b44d..1d6eb28 100644
--- a/tests/unit/boot.test.js
+++ b/tests/unit/boot.test.js
@@ -4,6 +4,7 @@
 import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
 import { JSDOM } from 'jsdom';
 import { boot } from '../../src/engine/boot.js';
+import { HALO_STEPS } from '../../src/ui/moon-progress.js';
 import t from '../../src/ui/strings.vi.js';
 import { mountPage } from '../helpers/page.js';
 
@@ -185,3 +186,47 @@ describe('boot', () => {
     expect(page.note.querySelector('pre').textContent).toContain('createLayer hỏng');
   });
 });
+
+describe('boot · quầng trăng tiến độ (GĐ 5)', () => {
+  const halo = () => page.moon.querySelector('.moon-halo');
+  const offset = () => Number(halo().style.strokeDashoffset);
+
+  it("báo mốc 'chunk' sau khi loadRun xong và trước khi run chạy", async () => {
+    let whileLoading;
+    let whenRunning;
+    const run = vi.fn(async () => {
+      whenRunning = offset();
+      return { dispose() {} };
+    });
+    const loadRun = vi.fn(async () => {
+      whileLoading = offset();
+      return { run };
+    });
+    await boot(entry, { t, win: webglWin(), doc, loadRun });
+    expect(whileLoading).toBeCloseTo(1 - HALO_STEPS.loading.to, 4); // đang tải code 3D: quầng bò tới mốc loading
+    expect(whenRunning).toBeCloseTo(1 - HALO_STEPS.chunk.to, 4);
+  });
+
+  it('quá hạn (late) thì progress của vỏ trang bị khóa như các hàm khác: tầng tĩnh không có quầng', async () => {
+    vi.useFakeTimers();
+    const win = webglWin();
+    let finishLoad;
+    const loadRun = () => new Promise((resolve) => {
+      finishLoad = resolve;
+    });
+    const run = vi.fn(async (_entry, shell) => {
+      // Dò khóa: quầng đã gỡ thì chỉ 'loading' vẽ được vòng mới (ui/moon-progress.js), nên quầng còn trống là nhờ khóa của boot.
+      shell.progress('loading');
+      return { dispose() {} };
+    });
+    const booted = boot(entry, { t, win, doc, loadRun });
+    await vi.advanceTimersByTimeAsync(10_000);
+    await booted;
+    expect(win.__sma).toMatchObject({ state: 'static', reason: 'timeout' });
+    expect(halo()).toBeNull(); // về tĩnh giữa lúc tải: quầng biến mất ngay
+    finishLoad({ run }); // code 3D tải xong sau hạn: mốc 'chunk' của boot cũng bị chặn
+    await vi.advanceTimersByTimeAsync(0);
+    expect(run).toHaveBeenCalledTimes(1);
+    expect(halo()).toBeNull();
+  });
+});
```
Áp vào `tests/unit/shell-css.test.js`:

```diff
diff --git a/tests/unit/shell-css.test.js b/tests/unit/shell-css.test.js
index eb0b733..69dfd3b 100644
--- a/tests/unit/shell-css.test.js
+++ b/tests/unit/shell-css.test.js
@@ -1,6 +1,7 @@
-// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn.
+// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng.
 import { describe, it, expect } from 'vitest';
 import { readFileSync } from 'node:fs';
+import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';
 
 const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
 const css = read('shell.css');
@@ -22,6 +23,10 @@ describe('shell.css · canvas của sân khấu', () => {
     expect(canvas).toMatch(/-webkit-user-select: none/);
     expect(canvas).toMatch(/-webkit-touch-callout: none/);
   });
+
+  it('hòa dần trong đúng CROSSFADE_MS của ui/moon-progress.js: quầng trăng đầy rồi tan xong cùng lúc canvas hiện rõ', () => {
+    expect(declarations('[data-stage] canvas')).toMatch(new RegExp(`transition: opacity ${CROSSFADE_MS}ms `));
+  });
 });
 
 describe('shell.css · vùng aria-live', () => {
@@ -35,3 +40,25 @@ describe('shell.css · vùng aria-live', () => {
     }
   });
 });
+
+describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
+  /** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
+  const reducedMotion = () => [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
+    .map((m) => m[1])
+    .join('\n');
+
+  it('vòng nét không tô, dasharray 1 2: vòng có pathLength 1 nên dashoffset 1 là rỗng, 0 là đầy', () => {
+    const halo = declarations('.moon-halo');
+    expect(halo).toMatch(/fill: none/);
+    // Vì sao là `1 2`: chú thích cạnh stroke-dasharray của .moon-halo trong shell.css.
+    expect(halo).toMatch(/stroke-dasharray: 1 2(;|\s|$)/);
+  });
+
+  it('nét 7: vòng vẽ ở toạ độ riêng gấp 100 rồi scale(0.01) (ui/moon-progress.js), trên trăng nét còn 0,07', () => {
+    expect(declarations('.moon-halo')).toMatch(/stroke-width: 7(;|\s|$)/);
+  });
+
+  it('giảm chuyển động thì không có transition: !important thắng transition inline của ui/moon-progress.js', () => {
+    expect(declarations('.moon-halo', reducedMotion())).toMatch(/transition: none !important/);
+  });
+});
```
Áp vào `tests/rules/imports.test.js`:

```diff
diff --git a/tests/rules/imports.test.js b/tests/rules/imports.test.js
index b4f78c5..e1cd8e7 100644
--- a/tests/rules/imports.test.js
+++ b/tests/rules/imports.test.js
@@ -172,6 +172,23 @@ describe('đường nhẹ (§8.2)', () => {
       .map((t) => `${root} ⇒ ${t}${t.startsWith('src/') ? '' : ' (gói npm hoặc file ngoài src/)'}`));
     expect(errors, report('Đường nhẹ kéo theo thứ nặng (three chỉ được tải bằng import() động):', errors)).toEqual([]);
   });
+
+  // Tầng tĩnh là chỗ dựa của máy cũ: phần nhẹ phải chạy cả trên Safari 14 (phần nhẹ đã cần replaceChildren, có từ Safari 14).
+  // Built-in từ ES2022 trở đi (và structuredClone) thì Safari 14 chưa có: gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ huy
+  // hiệu và ghi chú. Phần nặng chỉ chạy trên trình duyệt có WebGPU/WebGL2 đời mới, nên được dùng.
+  const MODERN = /\bObject\s*\.\s*hasOwn\s*\(|\.\s*at\s*\(|\bstructuredClone\s*\(|\.\s*(?:findLast|findLastIndex|toSorted|toReversed|toSpliced)\s*\(|\b(?:Object|Map)\s*\.\s*groupBy\s*\(|\bPromise\s*\.\s*withResolvers\s*\(/g;
+  it('phần nhẹ không gọi built-in ES2022 trở lên (Object.hasOwn, .at(), findLast…): tầng tĩnh chạy cả trên Safari 14', () => {
+    const files = [...new Set(LIGHT_ROOTS.flatMap((root) => [root, ...staticClosure(root)]))]
+      .filter((f) => f.startsWith('src/') && f.endsWith('.js'));
+    const errors = [];
+    for (const file of files) {
+      const code = stripComments(read(file), file);
+      for (const m of code.matchAll(MODERN)) {
+        errors.push(`${file}:${code.slice(0, m.index).split('\n').length} — ${m[0].replace(/\s+/g, '')}`);
+      }
+    }
+    expect(errors, report('Phần nhẹ gọi built-in mà trình duyệt cũ của tầng tĩnh chưa có (dùng cách cũ, vd. hasOwnProperty.call):', errors)).toEqual([]);
+  });
 });
 
 // ─── Hàng rào từ vựng: xưởng không nói tiếng của bức ─────────────────────
```

Run: `npx vitest run tests/unit/moon-progress.test.js tests/unit/shell-halo.test.js tests/unit/boot.test.js tests/unit/shell-css.test.js tests/rules/imports.test.js`
Kết quả mong đợi: FAIL, 4 file test không chạy được; lỗi đầu tiên: `Error: Cannot find module '../../src/ui/moon-progress.js' imported from tests/unit/boot.test.js`.

- [ ] **Step 2: Code**

Tạo `src/ui/moon-progress.js`:

```js
// ui/moon-progress.js — quầng trăng tiến độ: vòng quầng mảnh quanh trăng SVG nhích theo mốc tải phần 3D; chỉ DOM + CSS transition.

const NS = 'http://www.w3.org/2000/svg';
/**
 * Ease-out dài: phần lớn quãng đi trong mấy giây đầu, phần đuôi chậm dần. Hết số giây của một mốc mà mốc sau chưa tới
 * thì quầng đứng yên ở đích của mốc đó, nên số giây phải đủ dài cho mạng chậm (kiểm bằng Slow 4G, spec §12).
 */
const EASE_OUT = 'cubic-bezier(0.15, 0.6, 0.25, 1)';
/**
 * Canvas hòa dần trong 900 ms (shell.css, `[data-stage] canvas`; tests/unit/shell-css.test.js giữ hai số khớp nhau):
 * ở 'fading' quầng đầy rồi tan hết trong đúng quãng đó. ui/shell.js tính lưới an toàn của crossfade() từ số này.
 */
export const CROSSFADE_MS = 900;

/** Mốc → phần vòng quầng đích và số giây bò tới đó (đường cong ease-out: nhanh lúc đầu, chậm dần). */
export const HALO_STEPS = Object.freeze({
  loading: Object.freeze({ to: 0.45, seconds: 6 }),
  chunk: Object.freeze({ to: 0.62, seconds: 3 }),
  compiling: Object.freeze({ to: 0.9, seconds: 4 }),
  fading: Object.freeze({ to: 1, seconds: 0.3 }),
});

/**
 * Gắn quầng tiến độ vào trăng (spec §8.5). Quầng là một <circle pathLength="1"> có stroke-dasharray `1 2` (shell.css
 * nói vì sao), nên stroke-dashoffset = 1 − phần vòng. JS chỉ đặt dashoffset đích kèm transition inline; không có vòng
 * requestAnimationFrame nào. Mốc tới giữa chừng thì trình duyệt cho transition mới đi tiếp từ chỗ đang đứng. Người xem
 * xin giảm chuyển động: shell.css bỏ transition bằng !important (thắng style inline), quầng nhảy thẳng tới từng mốc.
 *
 * `step` nhận mọi trạng thái của vỏ trang cùng mốc 'chunk' (không phải trạng thái). Chỉ 'loading' vẽ
 * vòng mới (spec §4.1: quầng hiện từ `loading`; "Dựng lại cảnh" cũng đi lại từ đó), nên phần 3D đến muộn báo mốc sau
 * khi trang đã về tĩnh thì không vẽ lại quầng. Tên khác trong HALO_STEPS cho vòng đang có bò tới đích; ở 'fading' vòng
 * đầy rồi tan cùng lúc canvas hòa dần. 'live' (lúc đó quầng đã tan hết), 'static' và 'lost' gỡ quầng; 'poster',
 * 'detecting'… thì bỏ qua.
 *
 * Gắn sau drawMoon, một lần cho mỗi svg. drawMoon vẽ lại thì thay hẳn nội dung svg, gỡ luôn quầng: `step` nhìn chính
 * vòng (còn trên trang không), nên các mốc sau bỏ qua và 'loading' kế tiếp vẽ vòng mới.
 * @param {SVGSVGElement} svg  <svg data-moon> đã có trăng (drawMoon)
 * @returns {{ step: (name: string) => void, dispose: () => void }}  dispose gỡ quầng và thôi nhận mốc (không dùng lại được)
 */
export function createMoonProgress(svg) {
  const doc = svg.ownerDocument;
  let halo = null; // <circle class="moon-halo">; null trước 'loading' và sau khi gỡ (drawMoon vẽ lại thì nó rời trang)
  let target = 0; // phần vòng mà vòng đang có bò tới; chỉ đọc khi vòng còn trên trang
  let disposed = false;

  const remove = () => {
    halo?.remove();
    halo = null;
  };

  /**
   * Vòng rỗng mới, vẽ trên trăng. Đọc style ngay sau khi gắn để trình duyệt "chốt" dashoffset 1: không có bước
   * này, tạo vòng và đặt đích rơi vào cùng một lần tính style, và mốc đầu tiên nhảy thẳng thay vì bò.
   */
  const restart = () => {
    remove();
    halo = doc.createElementNS(NS, 'circle');
    halo.setAttribute('class', 'moon-halo');
    // Trên trăng, bán kính là 1,04: ngay ngoài đĩa trăng (bán kính 1), nét vẫn nằm trong viewBox ±1,1. Chrome đo pathLength
    // của hình rất nhỏ quá thô (mỗi phần tư vòng thành một dây cung, chu vi 4·r·√2 ≈ 0,9·2πr): vòng r 1,04 không bao giờ
    // khép, lúc rỗng vẫn ló một cung. Vẽ ở toạ độ riêng lớn gấp 100 rồi thu lại thì đo đúng. Nét cũng tính theo toạ độ
    // riêng: shell.css đặt stroke-width 7, trên trăng còn 0,07.
    halo.setAttribute('r', '104');
    halo.setAttribute('pathLength', '1');
    // Vòng tròn SVG bắt đầu ở 3 giờ: xoay để nét mọc từ đỉnh, theo chiều kim đồng hồ; scale thu toạ độ riêng về lại.
    halo.setAttribute('transform', 'rotate(-90) scale(0.01)');
    halo.style.strokeDashoffset = '1';
    svg.append(halo);
    void doc.defaultView?.getComputedStyle(halo).strokeDashoffset;
  };

  /** @param {string} name  trạng thái của vỏ trang, hoặc mốc 'chunk' */
  function step(name) {
    if (disposed) return;
    // Object.hasOwn là ES2022 (Safari 15.4, Chrome 93): đường nhẹ phải chạy cả trên máy cũ hơn, chính là máy cần tầng tĩnh.
    if (Object.prototype.hasOwnProperty.call(HALO_STEPS, name)) {
      const { to, seconds } = HALO_STEPS[name];
      if (!halo?.isConnected) {
        // Không còn vòng trên trang (chưa tới 'loading', đã gỡ, hay drawMoon vẽ lại): chỉ 'loading' vẽ vòng mới.
        if (name !== 'loading') return;
        restart();
      } else if (to < target) {
        return; // mốc tới muộn: vòng không bao giờ lùi
      }
      target = to;
      let transition = `stroke-dashoffset ${seconds}s ${EASE_OUT}`;
      if (name === 'fading') {
        // Đầy trong `seconds` đầu rồi tan trong phần còn lại của lúc canvas hòa dần (run.js đặt 'fading' rồi gọi
        // crossfade() ngay): quầng và poster cùng đi hết một lúc. Chặn dưới ở 0: một thời lượng âm làm trình duyệt
        // bỏ cả khai báo transition, quầng không bò cũng không tan.
        const fill = Math.round(seconds * 1000);
        transition += `, opacity ${Math.max(0, CROSSFADE_MS - fill)}ms ease-out ${fill}ms`;
        halo.style.opacity = '0';
      }
      halo.style.transition = transition;
      halo.style.strokeDashoffset = (1 - to).toFixed(4);
    } else if (name === 'live' || name === 'static' || name === 'lost') {
      // 'live' chỉ tới khi crossfade() xong, nên quầng đã tan hết: gỡ hẳn khỏi trang (giảm chuyển động thì không có
      // transition nào để chờ). 'static', 'lost': poster phủ lại màn hình, quầng biến mất ngay, không tan.
      remove();
    }
  }

  function dispose() {
    disposed = true;
    remove();
  }

  return { step, dispose };
}
```
Áp vào `src/ui/shell.js`:

```diff
diff --git a/src/ui/shell.js b/src/ui/shell.js
index bfbe8a1..930d5cc 100644
--- a/src/ui/shell.js
+++ b/src/ui/shell.js
@@ -1,11 +1,12 @@
-// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, hòa dần poster → canvas, huy hiệu, ghi chú, gợi ý, lời mời, ?poster
+// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, quầng trăng tiến độ, hòa dần poster → canvas, huy hiệu, ghi chú, gợi ý, lời mời, ?poster
 import { lunarFromDate, canChiIndex } from '../lib/astro/lunar.js';
 import { moonPhase } from '../lib/astro/moon.js';
 import { renderBadge } from './badge.js';
 import { drawMoon } from './moon-svg.js';
+import { createMoonProgress, CROSSFADE_MS } from './moon-progress.js';
 
-/** Transition CSS dài 900 ms. Lưới an toàn: quá 1200 ms mà chưa có transitionend thì coi như đã hòa xong. */
-const FADE_TIMEOUT_MS = 1200;
+/** Lưới an toàn khi transitionend không bao giờ tới: quá chừng này mà canvas chưa báo thì coi như đã hòa xong. */
+const FADE_TIMEOUT_MS = CROSSFADE_MS + 300;
 /** Trạng thái có poster phủ màn hình: tầng tĩnh, và lúc mất GPU chờ "Dựng lại cảnh". */
 const POSTER_STATES = ['static', 'lost'];
 
@@ -37,6 +38,8 @@ export function mountShell(doc, meta, { now, t, onState = () => {}, poster: post
   const lunar = lunarFromDate(now);
   $('[data-seal]').textContent = t.formatSeal({ ...lunar, ...canChiIndex(lunar.year) });
   if (moon) drawMoon(moon, moonPhase(now).phase);
+  // Quầng tiến độ quanh trăng (GĐ 5): đi theo trạng thái và mốc tải. Bức không có trăng thì không có quầng.
+  const halo = moon ? createMoonProgress(moon) : null;
 
   // title chỉ hiện khi rê chuột; điện thoại không có chuột, nên chạm vào huy hiệu thì mở/đóng ô giải thích.
   const badgeOpen = () => badge.getAttribute('aria-expanded') === 'true';
@@ -56,6 +59,7 @@ export function mountShell(doc, meta, { now, t, onState = () => {}, poster: post
   /** Đổi body[data-state] (CSS và e2e đọc) rồi báo cho boot để __sma.state luôn khớp. */
   function setState(state) {
     doc.body.dataset.state = state;
+    halo?.step(state);
     if (POSTER_STATES.includes(state)) {
       poster.hidden = false; // tầng tĩnh (và lúc mất GPU) luôn có poster, kể cả khi rơi xuống sau lúc đã live
       clearHint(); // "chạm vào…" vô nghĩa khi không còn cảnh 3D
@@ -63,6 +67,16 @@ export function mountShell(doc, meta, { now, t, onState = () => {}, poster: post
     onState(state);
   }
 
+  /**
+   * Mốc tải cho quầng trăng (GĐ 5); data-state không đổi. Tên nào trong HALO_STEPS (ui/moon-progress.js) cũng được
+   * chuyển cho quầng. boot.js báo mốc duy nhất không phải trạng thái: 'chunk' (code 3D đã tải xong); test khóa của boot
+   * dò bằng 'loading'.
+   * @param {string} name  một tên trong HALO_STEPS
+   */
+  function progress(name) {
+    halo?.step(name);
+  }
+
   /**
    * Hòa dần từ poster sang canvas (canvas đã nằm trong stageEl với opacity 0). Xong thì ẩn poster.
    * @param {HTMLCanvasElement} canvas
@@ -167,5 +181,5 @@ export function mountShell(doc, meta, { now, t, onState = () => {}, poster: post
     });
   }
 
-  return { stageEl, setState, crossfade, showBadge, showNote, showHint, invite, showLost };
+  return { stageEl, setState, progress, crossfade, showBadge, showNote, showHint, invite, showLost };
 }
```
Áp vào `src/engine/boot.js`:

```diff
diff --git a/src/engine/boot.js b/src/engine/boot.js
index 7ea1fc8..ee61888 100644
--- a/src/engine/boot.js
+++ b/src/engine/boot.js
@@ -43,12 +43,13 @@ export async function boot(entry, { lang = 'vi', t, win = window, doc = document
   const onFail = (reason, error) => showStatic(entry, shell, { reason, error, debug, t, sma });
 
   // Quá hạn thì run() vẫn có thể chạy nốt (máy yếu biên dịch shader lâu). Vỏ trang đưa cho run bị "khóa"
-  // từ lúc đó, để phần 3D đến muộn không kéo được poster đi hay đổi data-state; onLate sẽ gỡ nó.
+  // từ lúc đó, để phần 3D đến muộn không kéo được poster đi, đổi data-state hay vẽ lại quầng trăng; onLate sẽ gỡ nó.
   let late = false;
   const unlessLate = (fn) => (...args) => (late ? undefined : fn(...args));
   const runShell = {
     stageEl: shell.stageEl,
     setState: unlessLate(shell.setState),
+    progress: unlessLate(shell.progress),
     crossfade: (canvas) => (late ? Promise.resolve() : shell.crossfade(canvas)),
     showBadge: unlessLate(shell.showBadge),
     showNote: unlessLate(shell.showNote),
@@ -59,7 +60,10 @@ export async function boot(entry, { lang = 'vi', t, win = window, doc = document
 
   try {
     await withDeadline(
-      loadRun().then(({ run }) => run(entry, runShell, { tier, flags, now, lang, t, sma, onFail })),
+      loadRun().then(({ run }) => {
+        runShell.progress('chunk'); // mốc của quầng trăng: code 3D đã tải xong
+        return run(entry, runShell, { tier, flags, now, lang, t, sma, onFail });
+      }),
       BOOT_DEADLINE_MS,
       { onLate: (handle) => handle?.dispose?.() },
     );
```
Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 357c949..0244828 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -55,7 +55,8 @@ img[data-poster] {
 
 /* ── Lớp 1: sân khấu 3D ───────────────────────────────────────────────────────────────── */
 /* Canvas được gắn vào đây với opacity 0, nên xưởng vẽ được một khung ẩn sau poster.
-   ui/shell.js thêm data-visible → opacity chuyển 0 → 1: poster "hòa" sang cảnh 3D. */
+   ui/shell.js thêm data-visible → opacity chuyển 0 → 1: poster "hòa" sang cảnh 3D. Ở JS, con số 900 ms này là
+   CROSSFADE_MS của ui/moon-progress.js: quầng trăng tan cùng lúc, lưới an toàn của ui/shell.js cũng tính từ đó. */
 [data-stage] { position: fixed; inset: 0; }
 [data-stage] canvas {
   display: block;
@@ -299,6 +300,18 @@ header h1 {
 [data-moon]:empty { display: none; }
 .moon-dark { fill: color-mix(in srgb, var(--cham) 80%, var(--den-then)); }
 .moon-lit { fill: var(--nga); }
+/* Quầng tiến độ lúc tải phần 3D (GĐ 5): ui/moon-progress.js đặt dashoffset đích và transition inline. */
+.moon-halo {
+  fill: none;
+  stroke: var(--vang-la-sang);
+  stroke-width: 7; /* toạ độ riêng của vòng lớn gấp 100 (ui/moon-progress.js nói vì sao): trên trăng là 0,07 */
+  stroke-linecap: round;
+  /* Vòng có pathLength="1": nét 1 dài đúng cả vòng, nên dashoffset 1 là vòng rỗng, 0 là vòng đầy. Khoảng trống 2 dài hơn
+     cả vòng, nên lúc rỗng không có nét nào của chu kỳ sau ló ra ở cuối, trình duyệt nào cũng vậy. */
+  stroke-dasharray: 1 2;
+}
+/* Giảm chuyển động: quầng nhảy thẳng tới từng mốc. !important thắng transition inline mà JS đặt. */
+@media (prefers-reduced-motion: reduce) { .moon-halo { transition: none !important; } }
 
 /* ── ?poster (GĐ 4): chỉ còn canvas, để scripts/poster.js chụp poster từ chính cảnh (không chữ, không huy hiệu, không UI) ── */
 body[data-poster] :is(.frame, .rail, .notebook, .toolbar) { display: none !important; }
```

Run: `npx vitest run tests/unit/moon-progress.test.js tests/unit/shell-halo.test.js tests/unit/boot.test.js tests/unit/shell-css.test.js tests/rules/imports.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  714 passed`.

```bash
git add src/engine/boot.js src/styles/shell.css src/ui/moon-progress.js src/ui/shell.js tests/rules/imports.test.js tests/unit/boot.test.js tests/unit/moon-progress.test.js tests/unit/shell-css.test.js tests/unit/shell-halo.test.js
git commit -F - <<'EOF'
feat(ui): quầng trăng tiến độ (vòng quầng trong [data-moon] theo mốc tải: loading, chunk, compiling, fading)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Chữ đi theo vật (`engine/gpu/caption-set.js`, `ui/captions.js`)

**Mục tiêu:** Spec §4.1 mục 10, §8.3–8.4 (`content.captions`, `ctx.captions`), §9. Xưởng có một cách chung để bức hiện chữ đi theo một vật 3D:
- Bức gọi `ctx.captions.show(khóa, anchor)`. Chữ nằm ở `content.captions[khóa]` (dạng Poem: `{ lines, source, author? }`), nên code của bức chỉ cầm khóa.
- Mỗi lúc một dòng: dòng mới thay dòng cũ.
- Chữ đứng `CAPTION_SECONDS` = 9 giây theo đồng hồ cảnh (`?freeze` đứng đồng hồ thì chữ ở lại), và tan trong `CAPTION_FADE` = 1,2 giây cuối.

Phần giao diện, `ui/captions.js`:
- Một vùng `aria-live="polite"` phủ lên canvas, trong `[data-stage]`. Vùng không bao giờ `hidden`, và để trống khi không có chữ.
- Chữ đứng ngay trên điểm neo. Điểm neo sát mép thì chữ dừng ở mép, không tràn ra ngoài màn hình.
- Điểm neo ra ngoài khung thì chữ mang `data-away` (opacity 0), không dùng `hidden`. Lý do: `hidden` gỡ chữ khỏi cây trợ năng (vào lại khung là trình đọc màn hình đọc lại cả câu), và bỏ luôn transition.

Phần chiếu, `engine/gpu/caption-set.js`: mỗi khung (sau `controls.update()`, trước `render()`) chiếu điểm neo ra màn hình. Hai điều của three r186:
- `OrbitControls.update()` chỉ gọi `camera.lookAt()`. Phải gọi `camera.updateMatrixWorld()` trước khi chiếu, không thì chữ trễ camera một khung.
- `Renderer.render` đổi camera sang quy ước độ sâu của WebGPU ([0, 1]). Vì vậy điểm neo được xét theo độ sâu trong toạ độ camera (giữa near và far) rồi mới xét x, y của NDC.

Khi bức đưa điểm neo hỏng:
- `anchor()` trả `null`: ẩn lặng lẽ (bức nói khung này không có điểm neo).
- Ném lỗi, trả `undefined` hay số không hữu hạn: ẩn, và cảnh báo một lần cho dòng đó; không tính là khung lỗi.

`?poster` không có chữ. Test hợp đồng giữ luật của `content.captions`: khóa kebab-case; 1–2 dòng không rỗng, ≤ 60 ký tự (đếm theo ký tự thật, kể cả chữ Nôm); có nguồn. `STAGE_ONLY` của `e2e/helpers.js` ẩn cả `[data-captions]`, để số đo ảnh của canvas không lẫn chữ.

**Files:**
- Create: `src/engine/gpu/caption-set.js`, `src/ui/captions.js`, `src/styles/captions.css`, `tests/helpers/caption-rules.js`, `tests/helpers/kebab.js`
- Modify:
  - `src/engine/gpu/scene.js`;
  - `src/engine/gpu/layers.js`: `createCtx` nhận `captions`;
  - `src/engine/contracts/painting.js`, `src/engine/contracts/runtime.js`;
  - `src/styles/shell.css`: `@import`, `?poster`;
  - `tests/helpers/fake-ctx.js`: `fakeCaptions`;
  - `e2e/helpers.js`.
- Test: `tests/unit/caption-set.test.js` (mới), `tests/unit/captions.test.js` (mới), `tests/paintings/captions-rule.test.js` (mới), `tests/paintings/contract.test.js`, `tests/paintings/html.test.js`, `tests/unit/layers.test.js`, `tests/unit/scene.test.js`, `tests/unit/shell-css.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - `ui/captions.js`: `mountCaptions(doc, parent) → { show(poem), place(x, y, visible), fade(), clear(), dispose() }`; `CAPTION_SECONDS = 9`, `CAPTION_FADE = 1.2`;
  - `engine/gpu/caption-set.js`: `createCaptionSet({ captions, ui, camera, time, size, debug }) → { api: { keys, show(key, anchor) }, step(), dispose() }`;
  - `ctx.captions`: mặc định là no-op đông cứng `{ keys: [], show() {} }`;
  - `tests/helpers/fake-ctx.js`: `fakeCaptions(keys) → { keys (đông cứng), show: vi.fn() }`;
  - `tests/helpers/caption-rules.js`: `captionErrors(captions)`; `tests/helpers/kebab.js`: `KEBAB`;
  - DOM cho e2e (Task 12): `[data-stage] > div.captions[data-captions][aria-live=polite] > p.caption`, gồm `span.caption-line` (mỗi dòng một span) rồi `span.caption-cite > cite`.

- [ ] **Step 1: Test (hỏng: chưa có `caption-set.js` và `ui/captions.js`)**

Tạo `tests/helpers/kebab.js`:

```js
// tests/helpers/kebab.js — luật đặt tên chung của các test hợp đồng: slug, id lớp, id Dial, khóa chữ đều là kebab-case không dấu.

/** kebab-case không dấu: chữ thường a–z và số, các cụm nối bằng một gạch ngang. */
export const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
```
Tạo `tests/helpers/caption-rules.js`:

```js
// tests/helpers/caption-rules.js — luật của content.captions (GĐ 5, chữ đi theo vật): test hợp đồng áp cho mọi bức, captions-rule.test.js tự kiểm.
import { KEBAB } from './kebab.js';

export const CAPTION_MAX_CHARS = 60; // một dòng chữ đi theo vật vừa một hàng trên điện thoại

const filled = (v) => typeof v === 'string' && v.trim() !== '';

/**
 * Lỗi của content.captions (GĐ 5, chữ đi theo vật), mỗi lỗi một câu; [] khi hợp lệ hay khi bức không có captions.
 * Khóa kebab-case không dấu (code của bức chỉ chứa khóa); mỗi mục 1–2 dòng không rỗng, mỗi dòng tối đa
 * CAPTION_MAX_CHARS ký tự (đếm theo ký tự, không theo đơn vị UTF-16); có nguồn; tác giả có thì không rỗng.
 * @param {unknown} captions
 * @returns {string[]}
 */
export function captionErrors(captions) {
  if (captions === undefined) return [];
  if (captions === null || typeof captions !== 'object' || Array.isArray(captions)) return ['captions phải là { khóa: { lines, source, author? } }'];
  const errors = [];
  for (const [key, poem] of Object.entries(captions)) {
    if (!KEBAB.test(key)) errors.push(`khóa "${key}" phải là kebab-case không dấu`);
    const { lines, source, author } = poem ?? {};
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 2) errors.push(`"${key}": lines phải có 1–2 dòng`);
    else {
      for (const line of lines) {
        if (!filled(line)) errors.push(`"${key}": có dòng rỗng`);
        else if ([...line].length > CAPTION_MAX_CHARS) {
          errors.push(`"${key}": dòng dài ${[...line].length} ký tự (tối đa ${CAPTION_MAX_CHARS}): "${line}"`);
        }
      }
    }
    if (!filled(source)) errors.push(`"${key}": thiếu source (nguồn là bắt buộc, như thơ của meta)`);
    if (author !== undefined && !filled(author)) errors.push(`"${key}": author có thì không được rỗng`);
  }
  return errors;
}
```
Áp vào `tests/helpers/fake-ctx.js`:

```diff
diff --git a/tests/helpers/fake-ctx.js b/tests/helpers/fake-ctx.js
index aa3bb1c..8fbd6e1 100644
--- a/tests/helpers/fake-ctx.js
+++ b/tests/helpers/fake-ctx.js
@@ -25,13 +25,26 @@ export function fakeRenderer() {
   });
 }
 
+/**
+ * ctx.captions giả (GĐ 5): `keys` như các khóa của content.captions, đông cứng như keys của api thật (một bản sao), nên bức
+ * nào xáo khóa tại chỗ thì test hỏng ngay; `show` là vi.fn ghi lời gọi: test đọc `show.mock.calls` (khóa, anchor) rồi tự gọi
+ * anchor() để xem điểm neo.
+ * @param {string[]} [keys]
+ */
+export function fakeCaptions(keys = []) {
+  return { keys: Object.freeze([...keys]), show: vi.fn() };
+}
+
 /**
  * EngineCtx giả, dựng bằng CHÍNH createCtx của xưởng. Scene, camera, uniform là đồ thật của three
- * (dựng được node graph trong Node); renderer là fakeRenderer(). `ctx.weights` và `ctx.env` chỉ test dùng:
- * chúng không liệt kê được (non-enumerable), nên ctx mà lớp nhận qua `{ ...ctx }` không có hai thứ này.
+ * (dựng được node graph trong Node); renderer là fakeRenderer(); captions là fakeCaptions() nếu test không đưa.
+ * `ctx.weights` và `ctx.env` chỉ test dùng: chúng không liệt kê được (non-enumerable), nên ctx mà lớp nhận qua
+ * `{ ...ctx }` không có hai thứ này.
  * @param {object} meta  PaintingMeta
  */
-export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, reducedMotion = false, tier = 'webgpu', mobile = false } = {}) {
+export function makeEngineCtx(meta, {
+  level = 'cao', budget = {}, now = NOW, reducedMotion = false, tier = 'webgpu', mobile = false, captions = fakeCaptions(),
+} = {}) {
   const stage = {
     backend: tier,
     renderer: fakeRenderer(),
@@ -39,7 +52,7 @@ export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, red
     camera: new PerspectiveCamera(40, 1.6, 0.1, 500),
     u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
   };
-  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now });
+  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, captions });
   Object.defineProperty(ctx, 'weights', { value: weights, enumerable: false });
   Object.defineProperty(ctx, 'env', { value: env, enumerable: false });
   return ctx;
@@ -47,7 +60,8 @@ export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, red
 
 /**
  * Dựng bức như run.js: ngân sách của mức (budgetFor, ghép bảng của bức), setup(ctx) rồi buildLayers (cùng hàm của xưởng).
- * `until` = id lớp cuối cần dựng; `budget` ghi đè vài số của mức.
+ * `until` = id lớp cuối cần dựng; `budget` ghi đè vài số của mức; `captions` = ctx.captions giả (fakeCaptions(keys))
+ * khi test cần xem bức gọi chữ đi theo vật. Các tùy chọn khác đi tiếp vào makeEngineCtx (level, now, tier…).
  * @returns {{ ctx: object, setup: object | undefined, shared: object, built: object[], layers: Record<string, object>, knobs: Record<string, object> }}
  */
 export function buildPainting(painting, meta, { until, budget = {}, ...options } = {}) {
```
Tạo `tests/unit/captions.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/captions.test.js — chữ đi theo vật (GĐ 5): một vùng aria-live phủ lên canvas, mỗi lúc một dòng thơ kèm nguồn, đặt theo điểm neo.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mountCaptions } from '../../src/ui/captions.js';

const KIEU = { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' };
const CA_DAO = { lines: ['Công cha như núi Thái Sơn', 'Nghĩa mẹ như nước trong nguồn chảy ra'], source: 'Ca dao' };

let stage;
let captions;
let layout;
beforeEach(() => {
  document.body.innerHTML = '<div data-stage><canvas></canvas></div>';
  stage = document.querySelector('[data-stage]');
  captions = mountCaptions(document, stage);
  // jsdom không tính bố cục (mọi cỡ là 0): giả vùng chữ rộng 640 px (cỡ canvas), mỗi dòng chữ 200 × 60 px.
  layout = {
    room: vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(640),
    width: vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200),
    height: vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(60),
  };
});
afterEach(() => {
  vi.restoreAllMocks();
});

const region = () => stage.querySelector('[data-captions]');
const caption = () => region().querySelector('.caption');

describe('mountCaptions', () => {
  it('vùng live có aria-live="polite", nằm trong [data-stage] sau canvas, không bao giờ hidden, rỗng lúc đầu', () => {
    const el = region();
    expect(el.classList.contains('captions')).toBe(true);
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.previousElementSibling.tagName).toBe('CANVAS');
    expect(el.hidden).toBe(false);
    expect(el.childElementCount).toBe(0);
    expect(el.textContent).toBe('');
  });

  it('show vẽ từng dòng và nguồn (kèm " · tác giả" khi có), như thơ của lớp trong Sổ tay', () => {
    captions.show(KIEU);
    const p = caption();
    expect(p.tagName).toBe('P');
    expect([...p.querySelectorAll('.caption-line')].map((s) => s.textContent)).toEqual(KIEU.lines);
    const cite = p.querySelector('.caption-cite');
    expect(cite.querySelector('cite').textContent).toBe('Truyện Kiều');
    expect(cite.textContent).toBe('Truyện Kiều · Nguyễn Du');

    captions.show(CA_DAO);
    expect(caption().querySelector('.caption-cite').textContent).toBe('Ca dao'); // không có tác giả: chỉ nguồn
  });

  it('show hiện mờ dần: chốt style khi chữ đã vào trang mà chưa có data-shown, rồi mới gắn data-shown', () => {
    const seen = [];
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el, pseudo) => {
      if (el.classList?.contains('caption')) seen.push({ attached: el.isConnected, shown: el.hasAttribute('data-shown') });
      return original(el, pseudo);
    });
    captions.show(KIEU);
    expect(seen).toEqual([{ attached: true, shown: false }]);
    expect(caption().hasAttribute('data-shown')).toBe(true);
  });

  it('show lần hai thay dòng cũ: mỗi lúc một dòng', () => {
    captions.show(KIEU);
    captions.show(CA_DAO);
    expect(region().querySelectorAll('.caption')).toHaveLength(1);
    expect(region().textContent).toContain('Công cha như núi Thái Sơn');
    expect(region().textContent).not.toContain('Trăm năm');
  });

  it('place đặt transform (chữ nằm trên điểm neo, căn giữa); ra ngoài khung thì chữ mang data-away, không bao giờ hidden', () => {
    captions.show(KIEU);
    captions.place(120, 80, true);
    expect(caption().style.transform).toBe('translate(120px, 80px) translate(-50%, -100%)');
    expect(caption().hasAttribute('data-away')).toBe(false);
    captions.place(0, 0, false);
    expect(caption().hasAttribute('data-away')).toBe(true);
    // hidden gỡ chữ khỏi cây trợ năng (vào lại khung là đọc lại cả câu) và hủy transition (chữ hiện lại không mờ dần).
    expect(caption().hidden).toBe(false);
    expect(caption().hasAttribute('data-shown')).toBe(true); // vào lại khung thì [data-shown] cho chữ mờ dần hiện ra
    expect(caption().style.transform).toBe('translate(120px, 80px) translate(-50%, -100%)'); // transform cũ để nguyên
    expect(region().hidden).toBe(false);
    expect(region().textContent).toContain('Trăm năm'); // chữ vẫn trong vùng live, chỉ không hiện
    captions.place(300.5, 200.25, true);
    expect(caption().hasAttribute('data-away')).toBe(false);
    expect(caption().hidden).toBe(false);
    expect(caption().style.transform).toBe('translate(300.5px, 200.25px) translate(-50%, -100%)');
  });

  it('place chạy mỗi khung: data-away chỉ được ghi khi đổi, và hidden thì không bao giờ', () => {
    captions.show(KIEU);
    const observer = new MutationObserver(() => {});
    observer.observe(caption(), { attributes: true, attributeFilter: ['data-away', 'hidden'] });
    for (let i = 0; i < 3; i++) captions.place(0, 0, false);
    for (let i = 0; i < 3; i++) captions.place(10, 10, true);
    expect(observer.takeRecords().map((r) => r.attributeName)).toEqual(['data-away', 'data-away']); // ra một lần, vào một lần
    observer.disconnect();
  });

  it('điểm neo sát mép thì chữ dừng ở mép, vẫn ở trên điểm neo (chữ không tràn ra ngoài màn hình); cỡ chữ chỉ đo lúc show', () => {
    captions.show(KIEU); // chữ 200 × 60 px trong vùng rộng 640 px
    const reads = layout.width.mock.calls.length + layout.height.mock.calls.length;
    captions.place(30, 200, true); // sát mép trái: tâm chữ dừng ở nửa bề ngang của chữ
    expect(caption().style.transform).toBe('translate(100px, 200px) translate(-50%, -100%)');
    captions.place(630, 200, true); // sát mép phải
    expect(caption().style.transform).toBe('translate(540px, 200px) translate(-50%, -100%)');
    captions.place(320, 20, true); // sát mép trên: đáy chữ dừng ở đúng chiều cao của chữ, đầu chữ chạm mép
    expect(caption().style.transform).toBe('translate(320px, 60px) translate(-50%, -100%)');
    expect(layout.width.mock.calls.length + layout.height.mock.calls.length).toBe(reads); // place() chạy mỗi khung: không đo chữ lại
    layout.room.mockReturnValue(150); // vùng hẹp hơn chữ (max-width 80vw nên không xảy ra): đặt chữ giữa vùng
    captions.place(30, 200, true);
    expect(caption().style.transform).toBe('translate(75px, 200px) translate(-50%, -100%)');
  });

  it('fade gắn data-fading; clear làm rỗng vùng mà vùng vẫn còn; chưa có chữ thì place, fade, clear không làm gì', () => {
    captions.place(10, 10, true);
    captions.fade();
    captions.clear();
    expect(region().childElementCount).toBe(0);
    captions.show(KIEU);
    captions.fade();
    expect(caption().hasAttribute('data-fading')).toBe(true);
    captions.clear();
    expect(region().childElementCount).toBe(0);
    expect(region().isConnected).toBe(true);
    expect(region().hidden).toBe(false);
  });

  it('dispose gỡ vùng khỏi trang', () => {
    captions.show(KIEU);
    captions.dispose();
    expect(region()).toBeNull();
    expect(stage.querySelector('canvas')).not.toBeNull();
  });
});
```
Tạo `tests/unit/caption-set.test.js`:

```js
// tests/unit/caption-set.test.js — chữ đi theo vật (GĐ 5): khóa của content.captions, chiếu điểm neo ra màn hình mỗi khung, giờ theo đồng hồ cảnh.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { PerspectiveCamera, WebGLCoordinateSystem, WebGPUCoordinateSystem } from 'three/webgpu';
import { createCaptionSet } from '../../src/engine/gpu/caption-set.js';
import { CAPTION_FADE, CAPTION_SECONDS } from '../../src/ui/captions.js';
import { fakeCaptions } from '../helpers/fake-ctx.js';

const CAPTIONS = {
  'tram-nam': { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' },
  'cong-cha': { lines: ['Công cha như núi Thái Sơn', 'Nghĩa mẹ như nước trong nguồn chảy ra'], source: 'Ca dao' },
};

/** ui giả (thay cho ui/captions.js): ghi mọi lời gọi theo thứ tự. */
function fakeUi() {
  const calls = [];
  const record = (name) => (...args) => calls.push([name, ...args]);
  return { calls, show: record('show'), place: record('place'), fade: record('fade'), clear: record('clear'), dispose: record('dispose') };
}

/** Camera thật ở (0, 0, 10) nhìn về gốc tọa độ; khung 800 × 600. */
function make({ captions = CAPTIONS, debug = false } = {}) {
  const ui = fakeUi();
  const camera = new PerspectiveCamera(50, 800 / 600, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const time = { value: 2 };
  const set = createCaptionSet({ captions, ui, camera, time, size: () => ({ width: 800, height: 600 }), debug });
  return { ui, camera, time, set };
}
const ORIGIN = () => ({ x: 0, y: 0, z: 0 });
const names = (ui) => ui.calls.map(([name]) => name);
const lastPlace = (ui) => ui.calls.filter(([name]) => name === 'place').at(-1);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createCaptionSet', () => {
  it('keys lấy từ content.captions (mảng đông cứng); không có chữ (chữ tải hỏng) thì keys rỗng', () => {
    const { set } = make();
    expect(set.api.keys).toEqual(['tram-nam', 'cong-cha']);
    expect(Object.isFrozen(set.api.keys)).toBe(true);
    expect(createCaptionSet({ ui: fakeUi(), camera: new PerspectiveCamera(), time: { value: 0 }, size: () => ({ width: 1, height: 1 }) }).api.keys)
      .toEqual([]);
  });

  it('ctx.captions giả của test (fakeCaptions) cùng dạng với api thật: keys đông cứng, nên test của bức bắt được việc xáo khóa tại chỗ', () => {
    const real = make().set.api;
    const source = ['tram-nam', 'cong-cha'];
    const fake = fakeCaptions(source);
    expect(Object.keys(fake).sort()).toEqual(Object.keys(real).sort());
    expect(fake.keys).toEqual(real.keys);
    expect(Object.isFrozen(fake.keys)).toBe(true);
    expect(() => fake.keys.reverse()).toThrow(TypeError);
    expect(Object.isFrozen(source)).toBe(false); // đông cứng một bản sao, không đụng mảng của người gọi
  });

  it('khóa lạ không hiện gì; chỉ có ?debug mới cảnh báo (tiếng Việt)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quiet = make();
    quiet.set.api.show('khong-co', ORIGIN);
    quiet.set.api.show('toString', ORIGIN); // tên trùng hàm của Object.prototype cũng là khóa lạ, không phải một bài thơ
    quiet.set.api.show('constructor', ORIGIN);
    quiet.set.step();
    expect(quiet.ui.calls).toEqual([]);
    expect(warn).not.toHaveBeenCalled();

    const loud = make({ debug: true });
    loud.set.api.show('khong-co', ORIGIN);
    expect(loud.ui.calls).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('không có chữ "khong-co"');
  });

  it('show đặt chữ ngay (chưa cần tới khung sau): điểm neo ở gốc tọa độ ra giữa khung (400, 300)', () => {
    const { ui, set } = make();
    set.api.show('tram-nam', ORIGIN);
    expect(names(ui)).toEqual(['show', 'place']);
    expect(ui.calls[0][1]).toBe(CAPTIONS['tram-nam']);
    const [, x, y, visible] = ui.calls[1];
    expect(x).toBeCloseTo(400, 6);
    expect(y).toBeCloseTo(300, 6);
    expect(visible).toBe(true);
  });

  it('điểm neo đi thì chữ đi theo: lên trên là y nhỏ đi, sang phải là x lớn hơn', () => {
    const { ui, set } = make();
    const point = { x: 0, y: 0, z: 0 };
    set.api.show('tram-nam', () => point);
    point.x = 1;
    point.y = 1;
    set.step();
    const [, x, y, visible] = lastPlace(ui);
    expect(visible).toBe(true);
    expect(x).toBeGreaterThan(400);
    expect(y).toBeLessThan(300);
  });

  it('điểm neo sau camera, ngoài khung, xa hơn far hay sát hơn near thì ẩn chữ, theo cả quy ước độ sâu của WebGL lẫn WebGPU', () => {
    const outside = {
      'sau lưng camera': { x: 0, y: 0, z: 20 }, // camera ở z = 10, nhìn về −z
      'lệch hẳn sang phải': { x: 100, y: 0, z: 0 },
      'cao hẳn lên trên': { x: 0, y: 100, z: 0 },
      'xa hơn far (100)': { x: 0, y: 0, z: -140 },
      'sát hơn near (0,1)': { x: 0, y: 0, z: 9.92 }, // trước camera 0,08: giữa camera và mặt phẳng near, vật ở đó bị cắt
    };
    // Renderer đổi camera sang quy ước của backend trước khi vẽ: z của NDC là [−1, 1] với WebGL, [0, 1] với WebGPU.
    for (const system of [WebGLCoordinateSystem, WebGPUCoordinateSystem]) {
      const { ui, camera, set } = make();
      camera.coordinateSystem = system;
      camera.updateProjectionMatrix();
      let point = ORIGIN();
      set.api.show('tram-nam', () => point);
      expect(lastPlace(ui)[3]).toBe(true);
      for (const [where, p] of Object.entries(outside)) {
        point = p;
        set.step();
        expect(lastPlace(ui)[3], `${where} (coordinateSystem ${system})`).toBe(false);
      }
      point = ORIGIN();
      set.step();
      expect(lastPlace(ui)[3]).toBe(true);
    }
  });

  it('anchor() trả null thì ẩn ở khung đó và không cảnh báo (bức nói khung này không có điểm neo); vào lại khung thì hiện', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ui, set } = make();
    let point = null;
    set.api.show('tram-nam', () => point);
    expect(lastPlace(ui)[3]).toBe(false);
    point = ORIGIN();
    set.step();
    expect(lastPlace(ui)[3]).toBe(true);
    expect(names(ui).filter((n) => n === 'clear')).toEqual([]); // ẩn không phải gỡ: chữ còn trong vùng live
    expect(warn).not.toHaveBeenCalled();
  });

  it('camera vừa xoay mà ma trận chưa cập nhật (OrbitControls.update chỉ gọi lookAt): chiếu theo hướng mới, không trễ một khung', () => {
    const { ui, camera, set } = make();
    set.api.show('tram-nam', ORIGIN);
    camera.lookAt(5, 0, 0); // quay sang phải: gốc tọa độ trôi về bên trái khung
    set.step();
    expect(lastPlace(ui)[1]).toBeLessThan(400);
  });

  it(`hết ${CAPTION_SECONDS} giây (đồng hồ cảnh) thì clear; trước đó ${CAPTION_FADE} giây thì fade, một lần`, () => {
    const { ui, time, set } = make();
    set.api.show('tram-nam', ORIGIN); // t = 2: hiện tới t = 11, bắt đầu tan ở t = 9,8
    time.value = 2 + CAPTION_SECONDS - CAPTION_FADE - 0.1;
    set.step();
    expect(names(ui)).not.toContain('fade');
    time.value = 2 + CAPTION_SECONDS - CAPTION_FADE + 0.1;
    set.step();
    time.value += 0.5;
    set.step();
    expect(names(ui).filter((n) => n === 'fade')).toHaveLength(1);
    expect(lastPlace(ui)[3]).toBe(true); // đang tan vẫn đi theo điểm neo
    time.value = 2 + CAPTION_SECONDS;
    set.step();
    expect(names(ui).at(-1)).toBe('clear');
    const count = ui.calls.length;
    time.value += 1;
    set.step(); // đã gỡ: không còn gì để làm
    expect(ui.calls).toHaveLength(count);
  });

  it('anchor() ném lỗi thì chỉ ẩn chữ và cảnh báo một lần (không ném ra ngoài: không phải khung lỗi); số không hữu hạn, undefined cũng vậy', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { ui, set } = make();
    const boom = () => {
      throw new Error('vật đã bị gỡ');
    };
    expect(() => set.api.show('tram-nam', boom)).not.toThrow();
    expect(() => set.step()).not.toThrow();
    set.step();
    expect(ui.calls.filter(([name]) => name === 'place')).toEqual([['place', 0, 0, false], ['place', 0, 0, false], ['place', 0, 0, false]]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('tram-nam');

    warn.mockClear();
    set.api.show('cong-cha', () => ({ x: Number.NaN, y: 0, z: 0 })); // chữ mới: được cảnh báo một lần nữa
    set.step();
    expect(lastPlace(ui)).toEqual(['place', 0, 0, false]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('cong-cha');

    warn.mockClear();
    set.api.show('tram-nam', () => {}); // bức quên return: undefined là lỗi, khác null (null thì ẩn mà không báo)
    set.step();
    expect(lastPlace(ui)).toEqual(['place', 0, 0, false]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('đồng hồ đứng (?freeze) thì chữ ở lại, mỗi lần vẽ lại vẫn chiếu lại', () => {
    const { ui, set } = make();
    set.api.show('tram-nam', ORIGIN);
    for (let i = 0; i < 1000; i++) set.step();
    expect(names(ui)).not.toContain('fade');
    expect(names(ui)).not.toContain('clear');
    expect(names(ui).filter((n) => n === 'place')).toHaveLength(1001);
  });

  it('show mới thay show cũ: chữ mới, điểm neo mới, giờ tính lại từ lúc thả', () => {
    const { ui, time, set } = make();
    set.api.show('tram-nam', ORIGIN);
    time.value = 8;
    set.api.show('cong-cha', () => ({ x: 1, y: 0, z: 0 }));
    expect(ui.calls.filter(([name]) => name === 'show').map(([, poem]) => poem)).toEqual([CAPTIONS['tram-nam'], CAPTIONS['cong-cha']]);
    expect(lastPlace(ui)[1]).toBeGreaterThan(400); // đi theo điểm neo của chữ mới
    time.value = 2 + CAPTION_SECONDS + 1; // chữ cũ lẽ ra đã hết giờ; chữ mới (thả lúc t = 8) thì chưa
    set.step();
    expect(names(ui)).not.toContain('clear');
    time.value = 8 + CAPTION_SECONDS;
    set.step();
    expect(names(ui).at(-1)).toBe('clear');
  });

  it('không có chữ thì step() không làm gì; dispose gỡ vùng chữ, sau đó show và step không làm gì', () => {
    const { ui, set } = make();
    set.step();
    expect(ui.calls).toEqual([]);
    set.api.show('tram-nam', ORIGIN);
    set.dispose();
    expect(names(ui).at(-1)).toBe('dispose');
    const count = ui.calls.length;
    set.step();
    set.api.show('cong-cha', ORIGIN);
    expect(ui.calls).toHaveLength(count);
  });
});
```
Tạo `tests/paintings/captions-rule.test.js`:

```js
// tests/paintings/captions-rule.test.js — luật chữ đi theo vật (GĐ 5) tự kiểm: captionErrors nhận mục đúng, bắt được mục sai.
import { describe, it, expect } from 'vitest';
import { CAPTION_MAX_CHARS, captionErrors } from '../helpers/caption-rules.js';

describe('luật chữ đi theo vật (GĐ 5) tự kiểm', () => {
  const ok = { lines: ['Trăm năm trong cõi người ta', 'Chữ tài chữ mệnh khéo là ghét nhau'], source: 'Truyện Kiều', author: 'Nguyễn Du' };

  it('nhận mục đúng: 1 hay 2 dòng, có hay không có tác giả; dòng đúng 60 ký tự vẫn đạt, kể cả chữ Nôm (ngoài BMP)', () => {
    const nom = '\u{21A38}'.repeat(CAPTION_MAX_CHARS); // chữ "chữ" viết bằng chữ Nôm: 60 ký tự nhưng .length là 120
    expect(nom.length).toBe(2 * CAPTION_MAX_CHARS);
    expect(captionErrors(undefined)).toEqual([]);
    expect(captionErrors({})).toEqual([]);
    expect(captionErrors({ 'tram-nam': ok, 'mot-dong': { lines: [nom], source: 'Ca dao' }, 'a1-b2': { lines: ['x'], source: 'y' } })).toEqual([]);
  });

  it('bắt được: khóa có dấu, hoa hay gạch dưới; 0 hoặc 3 dòng; dòng rỗng; dòng quá 60 ký tự; thiếu nguồn; tác giả rỗng', () => {
    const cases = {
      'Tram-nam': ok,
      'trăm-năm': ok,
      tram_nam: ok,
      'khong-dong': { ...ok, lines: [] },
      'ba-dong': { ...ok, lines: ['a', 'b', 'c'] },
      'dong-rong': { ...ok, lines: ['a', '  '] },
      'qua-dai': { ...ok, lines: ['Ỷ'.repeat(CAPTION_MAX_CHARS + 1)] },
      'thieu-nguon': { lines: ['a'] },
      'tac-gia-rong': { ...ok, author: '' },
    };
    const errors = captionErrors(cases);
    for (const key of Object.keys(cases)) expect(errors.some((e) => e.includes(`"${key}"`)), `phải bắt được "${key}"`).toBe(true);
    expect(captionErrors(['tram-nam'])).toHaveLength(1);
  });
});
```
Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index 56233f4..fe5ed4e 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -9,12 +9,13 @@ import { hasCode } from '../../src/ui/code-view.js';
 import { NOW, buildPainting } from '../helpers/fake-ctx.js';
 import { svgColors } from '../helpers/svg.js';
 import { jpegSize, webpSize } from '../helpers/image.js';
+import { KEBAB } from '../helpers/kebab.js';
+import { captionErrors } from '../helpers/caption-rules.js';
 import { parseAt } from '../../src/engine/flags.js';
 import { pass } from 'three/tsl';
 import { buildFinalNode, makeMRT } from '../../src/engine/gpu/pipeline.js';
 
 const SRC = resolve(import.meta.dirname, '../../src');
-const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
 const MARKER = /\/\/\s*@knob\s+([A-Za-z0-9_]+)/g;
 const MAX_WORDS = 150;
 
@@ -265,6 +266,12 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
       }
     });
 
+    it.each(langs)('%s: chữ đi theo vật (GĐ 5, nếu có): khóa kebab-case; mỗi mục 1–2 dòng không rỗng (≤ 60 ký tự), có nguồn', async (lang) => {
+      const { default: content } = await entry.content[lang]();
+      const errors = captionErrors(content.captions);
+      expect(errors, `content.captions (${lang}):\n${errors.join('\n')}`).toEqual([]);
+    });
+
     it.each(langs)('%s: sơ đồ (nếu có) là SVG có <title>, chỉ dùng màu của bảng sơn mài', async (lang) => {
       const { default: content } = await entry.content[lang]();
       for (const [id, text] of Object.entries(content.layers ?? {})) {
```
Áp vào `tests/paintings/html.test.js`:

```diff
diff --git a/tests/paintings/html.test.js b/tests/paintings/html.test.js
index 985c75b..77fcb87 100644
--- a/tests/paintings/html.test.js
+++ b/tests/paintings/html.test.js
@@ -141,13 +141,14 @@ describe('styles/tools.css (GĐ 4)', () => {
 });
 
 describe('styles/shell.css (trang nào cũng dùng)', () => {
-  it('@import tokens.css, notebook.css (GĐ 2), tools.css (GĐ 4) rồi đúng 5 file font theo trọng lượng (spec §5), trước luật đầu tiên', () => {
+  it('@import tokens.css, notebook.css (GĐ 2), tools.css (GĐ 4), captions.css (GĐ 5) rồi đúng 5 file font theo trọng lượng (spec §5), trước luật đầu tiên', () => {
     const css = readFileSync(ROOT + 'src/styles/shell.css', 'utf8');
     const imports = [...css.matchAll(/@import\s+'([^']+)'/g)].map((m) => m[1]);
     expect(imports).toEqual([
       './tokens.css',
       './notebook.css',
       './tools.css',
+      './captions.css',
       '@fontsource/cormorant-garamond/500.css',
       '@fontsource/cormorant-garamond/500-italic.css',
       '@fontsource/be-vietnam-pro/400.css',
```
Áp vào `tests/unit/layers.test.js`:

```diff
diff --git a/tests/unit/layers.test.js b/tests/unit/layers.test.js
index a0735d0..0a73acf 100644
--- a/tests/unit/layers.test.js
+++ b/tests/unit/layers.test.js
@@ -109,7 +109,8 @@ describe('createCtx', () => {
     const { ctx, weights, env: e } = createCtx({ meta, stage, level: 'vua', budget: { dpr: 1.5 }, mobile: true, reducedMotion: false, now });
     expect(ctx.tier).toBe('webgl2');
     expect(Object.keys(ctx).sort()).toEqual([
-      'budget', 'camera', 'debug', 'level', 'mobile', 'now', 'palette', 'reducedMotion', 'renderer', 'scene', 'tier', 'u', 'weight',
+      'budget', 'camera', 'captions', 'debug', 'level', 'mobile', 'now', 'palette', 'reducedMotion', 'renderer', 'scene', 'tier', 'u',
+      'weight',
     ]);
     expect(ctx.palette.hex.datSet).toBe('#010203'); // bức ghi đè token
     expect(ctx.palette.hex.denThen).toBe('#0E0A08');
@@ -118,6 +119,15 @@ describe('createCtx', () => {
     expect(ctx.debug).toBe(false);
     expect(e).toEqual({ tier: 'webgl2', level: 'vua', budget: { dpr: 1.5 }, now, mobile: true });
   });
+
+  it('ctx.captions (GĐ 5): mặc định không có chữ (keys rỗng, show không làm gì); có caption-set thì ctx giữ đúng object đó', () => {
+    const base = { meta, stage, level: 'vua', budget: {}, mobile: false, reducedMotion: false, now: new Date('2026-09-28T14:00:00Z') };
+    const { ctx } = createCtx(base);
+    expect(ctx.captions.keys).toEqual([]);
+    expect(() => ctx.captions.show('bat-ky', () => null)).not.toThrow();
+    const captions = { keys: ['tram-nam'], show: vi.fn() };
+    expect(createCtx({ ...base, captions }).ctx.captions).toBe(captions);
+  });
 });
 
 describe('buildLayers', () => {
```
Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 03b5afb..26d3468 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -1,10 +1,11 @@
-// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze.
+// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze, chữ đi theo vật.
 import { describe, it, expect, vi } from 'vitest';
 import { JSDOM } from 'jsdom';
 import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
 import { color, mix, uniform, vec3 } from 'three/tsl';
 import { buildScene } from '../../src/engine/gpu/scene.js';
 import { createDisposer } from '../../src/engine/gpu/disposer.js';
+import { CAPTION_SECONDS } from '../../src/ui/captions.js';
 import { fakeRenderer } from '../helpers/fake-ctx.js';
 
 /** Test gắn hàm vào đây để nghe update() của lớp tô màu. */
@@ -38,11 +39,19 @@ const painting = {
   ],
 };
 
-/** Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). Máy có DPR 2. */
-function fakeStage(backend) {
+/**
+ * Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). Máy có DPR 2.
+ * Canvas 640 × 400 nằm trong [data-stage] của trang (vùng chữ đi theo vật gắn cạnh nó).
+ */
+function fakeStage(backend, doc) {
   const renderer = fakeRenderer();
   let dprMax = Infinity;
-  const canvas = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }) });
+  const canvas = Object.assign(new EventTarget(), {
+    parentElement: doc.querySelector('[data-stage]'),
+    clientWidth: 640,
+    clientHeight: 400,
+    getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }),
+  });
   Object.assign(renderer, { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace, domElement: canvas });
   return {
     backend,
@@ -62,7 +71,7 @@ function fakeStage(backend) {
 }
 
 /** Cửa sổ giả: requestAnimationFrame xếp hàng, flush() chạy như một nhịp của trình duyệt. */
-function fakeWin() {
+function fakeWin(doc) {
   const frames = [];
   const win = Object.assign(new EventTarget(), {
     navigator: { userAgent: 'Mozilla/5.0 (Macintosh)', maxTouchPoints: 0 },
@@ -70,23 +79,39 @@ function fakeWin() {
     requestAnimationFrame: (cb) => frames.push(cb),
     setTimeout,
     clearTimeout,
-    document: Object.assign(new EventTarget(), { hidden: false }),
+    document: doc,
   });
   return { win, frames, flush: () => frames.splice(0).forEach((cb) => cb(16)) };
 }
 
-function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, tools = [] } = {}) {
-  const stage = fakeStage(backend);
+function build({ backend = 'webgpu', reducedMotion = false, flags = {}, setup, tools = [], content = null } = {}) {
+  // Trang là DOM thật: [data-stage] chứa canvas và vùng chữ đi theo vật; thanh công cụ gắn vào body.
+  const doc = new JSDOM('<div data-stage></div>').window.document;
+  const stage = fakeStage(backend, doc);
   const disposer = createDisposer();
-  const { win, frames, flush } = fakeWin();
-  if (tools.length > 0) win.document = new JSDOM('').window.document; // thanh công cụ là DOM thật
+  const { win, frames, flush } = fakeWin(doc);
   const scene = buildScene({
     stage, disposer, painting: setup ? { ...painting, setup } : painting, meta, flags,
-    now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools,
+    now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win, tools, content,
   });
   const renders = () => stage.renderer.render.mock.calls.length;
-  return { stage, disposer, scene, frames, flush, renders, win };
+  return { stage, disposer, scene, frames, flush, renders, win, doc };
+}
+
+/** Cảnh có một dòng chữ trong content.captions; setup của bức giữ ctx.captions lại cho test. */
+function buildWithCaptions() {
+  let captions = null;
+  const content = { hint: '', captions: { 'tram-nam': { lines: ['Trăm năm trong cõi người ta'], source: 'Truyện Kiều', author: 'Nguyễn Du' } } };
+  const built = build({ content, setup: (ctx) => {
+    captions = ctx.captions;
+    return {};
+  } });
+  // jsdom không tính bố cục: vùng chữ phủ kín [data-stage] nên rộng bằng canvas giả (ui/captions.js đọc để giữ chữ trong vùng).
+  Object.defineProperty(built.doc.querySelector('[data-captions]'), 'clientWidth', { value: 640 });
+  return { ...built, captions };
 }
+/** x (px trong canvas) mà chữ đang đứng, đọc từ transform của nó. */
+const captionX = (caption) => Number(/translate\(([-+\d.e]+)px/.exec(caption.style.transform)[1]);
 
 describe('buildScene', () => {
   it('mức theo backend THẬT: WebGPU máy tính → cao (dpr 2), WebGL2 → vừa (dpr 1.5); camera theo CameraSpec của bức', () => {
@@ -306,6 +331,45 @@ describe('buildScene', () => {
     expect(renders()).toBe(before + 1);
   });
 
+  it('chữ đi theo vật (GĐ 5): setup nhận ctx.captions (keys từ content.captions); mỗi khung chữ theo camera của CHÍNH khung đó; hết giờ thì gỡ', () => {
+    const { stage, scene, doc, captions } = buildWithCaptions();
+    expect(captions.keys).toEqual(['tram-nam']);
+    captions.show('tram-nam', () => ({ x: 0, y: 0, z: -5 })); // trước camera (camera giả ở gốc, nhìn về −z)
+    const region = doc.querySelector('[data-stage] > [data-captions]');
+    expect(region.getAttribute('aria-live')).toBe('polite');
+    const caption = region.querySelector('.caption');
+    expect(caption.textContent).toBe('Trăm năm trong cõi người taTruyện Kiều · Nguyễn Du');
+    expect(caption.hasAttribute('data-away')).toBe(false); // điểm neo trong khung
+    expect(caption.style.transform).toBe('translate(320px, 200px) translate(-50%, -100%)'); // giữa canvas 640 × 400
+    // Người xem kéo: controls.update() của khung này mới dời camera sang phải. Chữ được chiếu SAU nó, nên trôi về bên trái
+    // ngay trong khung này, không trễ một khung.
+    stage.controls.update.mockImplementation(() => {
+      stage.camera.position.x = 1;
+    });
+    scene.step(1000);
+    expect(captionX(caption)).toBeLessThan(320);
+    // Hết CAPTION_SECONDS theo đồng hồ của cảnh (stage.tick giả không ghi uniform, nên test ghi thẳng): khung sau gỡ chữ.
+    stage.u.time.value = CAPTION_SECONDS;
+    scene.step(1016);
+    expect(region.childElementCount).toBe(0);
+    expect(region.isConnected).toBe(true); // vùng live vẫn còn, chỉ rỗng
+  });
+
+  it('chữ đi theo vật, đứng yên ở ?freeze: vẽ lại khung đang giữ thì chiếu lại chữ (camera vừa bị kéo); disposer gỡ vùng chữ', async () => {
+    const { stage, scene, flush, disposer, doc, captions } = buildWithCaptions();
+    scene.freeze();
+    captions.show('tram-nam', () => ({ x: 0, y: 0, z: -5 })); // vòng lặp đã dừng: show() tự đặt chữ ngay
+    const caption = doc.querySelector('[data-captions] .caption');
+    expect(captionX(caption)).toBe(320);
+    stage.camera.position.x = 1; // camera dời sang phải: điểm neo trôi về bên trái
+    const done = scene.studio.setWeight('to-mau', 0);
+    flush();
+    await done;
+    expect(captionX(caption)).toBeLessThan(320);
+    disposer.closeAll();
+    expect(doc.querySelector('[data-captions]')).toBeNull();
+  });
+
   it('ms CPU của khung đi vào số đo của bàn thợ', () => {
     const { scene } = build();
     scene.step(1000);
```
Áp vào `tests/unit/shell-css.test.js`:

```diff
diff --git a/tests/unit/shell-css.test.js b/tests/unit/shell-css.test.js
index 69dfd3b..1d2db80 100644
--- a/tests/unit/shell-css.test.js
+++ b/tests/unit/shell-css.test.js
@@ -1,11 +1,13 @@
-// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng.
+// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng; chữ đi theo vật.
 import { describe, it, expect } from 'vitest';
 import { readFileSync } from 'node:fs';
 import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';
+import { CAPTION_FADE } from '../../src/ui/captions.js';
 
 const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
 const css = read('shell.css');
 const notebookCss = read('notebook.css');
+const captionsCss = read('captions.css');
 
 /** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
 function declarations(selector, source = css) {
@@ -16,6 +18,50 @@ function declarations(selector, source = css) {
   return out.join(';').replace(/\s+/g, ' ');
 }
 
+/** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
+const reducedMotion = (source = css) => [...source.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
+  .map((m) => m[1])
+  .join('\n');
+
+/**
+ * Khai báo thắng của một .caption mang các thuộc tính `attrs` (vd. ['data-shown', 'data-away']) trong captions.css, tính như
+ * trình duyệt: mọi bộ chọn của chữ là .caption kèm vài [thuộc tính] (file không dùng !important), nên khối khớp có nhiều thuộc
+ * tính hơn thì thắng, bằng nhau thì khối đứng sau thắng. `reduced`: người xem xin giảm chuyển động (tính cả khối @media đó).
+ * Gặp luật cho .caption mà nó không tính đúng được (bộ chọn khác dạng trên, hay một khối @media khác) thì ném lỗi: bỏ qua lặng
+ * lẽ thì một luật như `.captions .caption[data-shown]` đè lên data-away trên trình duyệt mà test vẫn xanh.
+ * @param {string[]} attrs
+ * @param {{ reduced?: boolean, source?: string }} [opts]  source: CSS đã bỏ chú thích (mặc định captions.css)
+ * @returns {Record<string, string>}  thuộc tính CSS → giá trị
+ */
+function captionStyle(attrs, { reduced = false, source = captionsCss } = {}) {
+  const won = {};
+  // Các khối theo thứ tự trong file: một khối @media (lồng một tầng ngoặc) hay một khối thường.
+  for (const [, media, inner, selectors, body] of source.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}|([^{}]+)\{([^{}]*)\}/g)) {
+    const isReduced = media !== undefined && /prefers-reduced-motion:\s*reduce/.test(media);
+    const blocks = media === undefined ? [[selectors, body]] : [...inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1], m[2]]);
+    for (const [list, decls] of blocks) {
+      for (const raw of list.split(',')) {
+        const selector = raw.trim();
+        if (!/\.caption(?![\w-])/.test(selector)) continue; // .captions, .caption-line…: không phải luật của chữ
+        const m = /^\.caption((?:\[[\w-]+\])*)$/.exec(selector);
+        if (!m) throw new Error(`captionStyle chưa hiểu bộ chọn "${selector}": mở rộng bộ giải trước khi thêm luật này`);
+        if (media !== undefined && !isReduced) throw new Error(`captionStyle chưa hiểu khối @media${media}có luật cho .caption`);
+        if (media !== undefined && !reduced) continue; // khối giảm chuyển động chỉ áp khi người xem xin
+        const need = m[1].match(/[\w-]+/g) ?? [];
+        if (!need.every((a) => attrs.includes(a))) continue;
+        for (const decl of decls.split(';')) {
+          const colon = decl.indexOf(':');
+          const prop = decl.slice(0, colon).trim();
+          // Khai báo trước chỉ giữ được chỗ khi khối của nó có nhiều thuộc tính hơn; bằng nhau thì khối này (đứng sau) thắng.
+          if (colon < 0 || (won[prop] && won[prop].specificity > need.length)) continue;
+          won[prop] = { specificity: need.length, value: decl.slice(colon + 1).trim().replace(/\s+/g, ' ') };
+        }
+      }
+    }
+  }
+  return Object.fromEntries(Object.entries(won).map(([prop, { value }]) => [prop, value]));
+}
+
 describe('shell.css · canvas của sân khấu', () => {
   it('nhấn giữ không chọn chữ, không mở kính lúp hay callout (iOS không có contextmenu để chặn)', () => {
     const canvas = declarations('[data-stage] canvas');
@@ -42,11 +88,6 @@ describe('shell.css · vùng aria-live', () => {
 });
 
 describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
-  /** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
-  const reducedMotion = () => [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
-    .map((m) => m[1])
-    .join('\n');
-
   it('vòng nét không tô, dasharray 1 2: vòng có pathLength 1 nên dashoffset 1 là rỗng, 0 là đầy', () => {
     const halo = declarations('.moon-halo');
     expect(halo).toMatch(/fill: none/);
@@ -62,3 +103,53 @@ describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
     expect(declarations('.moon-halo', reducedMotion())).toMatch(/transition: none !important/);
   });
 });
+
+describe('captions.css · chữ đi theo vật (GĐ 5)', () => {
+  it('vùng chữ phủ kín [data-stage] (cùng cỡ canvas), không nhận chạm; cả vùng live lẫn chữ không bao giờ display: none hay visibility: hidden', () => {
+    const region = declarations('.captions', captionsCss);
+    expect(region).toMatch(/position: absolute/);
+    expect(region).toMatch(/inset: 0/);
+    expect(region).toMatch(/pointer-events: none/);
+    // Chữ ra ngoài khung chỉ trong suốt (data-away): vẫn ở trong cây trợ năng, nên vào lại khung không bị đọc lại.
+    expect(captionsCss).not.toMatch(/display:\s*none|visibility:\s*hidden/);
+    expect(declarations('.caption[data-away]', captionsCss)).toMatch(/opacity: 0(;|\s|$)/);
+  });
+
+  it('điểm neo ra ngoài khung (data-away) thì chữ ẩn ngay, đè lên [data-shown] và [data-fading], cả khi giảm chuyển động', () => {
+    for (const reduced of [false, true]) {
+      for (const attrs of [['data-away'], ['data-shown', 'data-away'], ['data-shown', 'data-fading', 'data-away']]) {
+        const { opacity, transition } = captionStyle(attrs, { reduced });
+        expect({ opacity, transition }, `${attrs.join(' ')}${reduced ? ' (giảm chuyển động)' : ''}`).toEqual({ opacity: '0', transition: 'none' });
+      }
+    }
+    // Vào lại khung: gỡ data-away là về [data-shown], và chữ mờ dần hiện ra như lúc mới thả.
+    expect(captionStyle(['data-shown']).opacity).toBe('1');
+    expect(captionStyle(['data-shown']).transition).toMatch(/^opacity \d/);
+  });
+
+  it('bộ giải cascade của test (captionStyle) báo lỗi khi gặp luật cho .caption mà nó chưa hiểu, không lặng lẽ bỏ qua', () => {
+    expect(() => captionStyle(['data-shown'], { source: '.captions .caption[data-shown] { opacity: 1; }' })).toThrow(/chưa hiểu/);
+    expect(() => captionStyle(['data-shown'], { source: '@media (max-width: 40rem) { .caption[data-shown] { opacity: 0.95; } }' }))
+      .toThrow(/chưa hiểu/);
+    const plain = '.captions { inset: 0; } .caption-line { display: block; } .caption[data-shown] { opacity: 1; }';
+    expect(captionStyle(['data-shown'], { source: plain })).toEqual({ opacity: '1' });
+  });
+
+  it(`tan trong đúng CAPTION_FADE (${CAPTION_FADE} s) của ui/captions.js; giảm chuyển động thì không mờ dần và giữ dòng chữ tới khi bị gỡ`, () => {
+    expect(captionStyle(['data-shown', 'data-fading']).opacity).toBe('0');
+    expect(captionStyle(['data-shown', 'data-fading']).transition).toMatch(new RegExp(`^opacity ${CAPTION_FADE}s `));
+    const reduced = reducedMotion(captionsCss);
+    expect(declarations('.caption', reduced)).toMatch(/transition: none/);
+    expect(declarations('.caption[data-fading]', reduced)).toMatch(/transition: none/);
+    // Không tan sớm CAPTION_FADE giây: chữ đứng nguyên rồi tắt ngay khi clear() gỡ nó (hết CAPTION_SECONDS).
+    for (const attrs of [['data-shown'], ['data-shown', 'data-fading']]) {
+      const { opacity, transition } = captionStyle(attrs, { reduced: true });
+      expect({ opacity, transition }, attrs.join(' ')).toEqual({ opacity: '1', transition: 'none' });
+    }
+  });
+
+  it('?poster không có chữ: body[data-poster] ẩn cả vùng chữ (thứ tự @import do tests/paintings/html.test.js giữ)', () => {
+    const hidden = /body\[data-poster\] :is\(([^)]*)\)\s*\{\s*display: none !important;?\s*\}/.exec(css)?.[1] ?? '';
+    expect(hidden.split(',').map((s) => s.trim())).toContain('.captions');
+  });
+});
```

Run: `npx vitest run tests/unit/captions.test.js tests/unit/caption-set.test.js tests/paintings/captions-rule.test.js tests/paintings/contract.test.js tests/paintings/html.test.js tests/unit/layers.test.js tests/unit/scene.test.js tests/unit/shell-css.test.js`
Kết quả mong đợi: FAIL, 3 test hỏng; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/gpu/caption-set.js' imported from tests/unit/caption-set.test.js`.

- [ ] **Step 2: Code**

Tạo `src/ui/captions.js`:

```js
// ui/captions.js — chữ đi theo vật (GĐ 5): một vùng aria-live phủ lên canvas; mỗi lúc một dòng thơ kèm nguồn, đặt theo điểm neo.
import { h } from './dom.js';

/**
 * Chữ đứng bao lâu, tính bằng giây của đồng hồ cảnh (ctx.u.time; engine/gpu/caption-set.js đếm giờ): ?freeze đứng đồng hồ
 * thì chữ ở lại.
 */
export const CAPTION_SECONDS = 9;
/** Bắt đầu tan trước khi hết giờ bấy nhiêu giây: đúng thời gian tan của [data-fading] trong styles/captions.css. */
export const CAPTION_FADE = 1.2;

/**
 * Vùng chữ nằm trong [data-stage], ngay trên canvas và cùng cỡ với nó, nên toạ độ px tính từ góc trái trên của canvas
 * (engine/gpu/caption-set.js chiếu điểm neo ra) cũng là toạ độ trong vùng. Không biết bức nào: chỉ nhận { lines, source,
 * author? } (cùng dạng với thơ của meta) và một điểm trên màn hình.
 *
 * Vùng là aria-live="polite": trình đọc màn hình đọc câu và nguồn mỗi khi một dòng mới vào. Theo luật của vùng live, vùng
 * KHÔNG BAO GIỜ `hidden` và để trống khi không có chữ. Điểm neo ra ngoài khung thì chữ mang data-away (CSS cho nó trong
 * suốt) chứ không `hidden`: chữ vẫn ở trong cây trợ năng, nên vào lại khung không bị đọc lại, và vẫn mờ dần hiện ra.
 * Hiện mờ dần, tan dần đều là CSS transition trên opacity (styles/captions.css; giảm chuyển động thì bỏ transition).
 * @param {Document} doc
 * @param {HTMLElement} parent   [data-stage] (chứa canvas)
 * @returns {{ show: (poem: { lines: string[], source: string, author?: string }) => void,
 *   place: (x: number, y: number, visible: boolean) => void, fade: () => void, clear: () => void, dispose: () => void }}
 */
export function mountCaptions(doc, parent) {
  const region = h(doc, 'div', { class: 'captions', 'data-captions': true, 'aria-live': 'polite' });
  parent.append(region);
  let caption = null; // <p class="caption"> đang hiện; null khi vùng trống
  let box = { width: 0, height: 0 }; // cỡ (px) của chữ đang hiện, đo một lần lúc show

  return {
    /** Thay dòng đang hiện (nếu có) bằng một dòng mới: từng câu một hàng, rồi nguồn (· tác giả), như thơ trong Sổ tay. */
    show(poem) {
      caption = h(doc, 'p', { class: 'caption' },
        poem.lines.map((line) => h(doc, 'span', { class: 'caption-line', text: line })),
        h(doc, 'span', { class: 'caption-cite' }, h(doc, 'cite', { text: poem.source }), poem.author ? ` · ${poem.author}` : null));
      region.replaceChildren(caption);
      // Đọc style trước khi đổi: trình duyệt "chốt" opacity 0 của chữ vừa vào, nên data-shown chắc chắn sinh transition.
      // Thiếu bước này, gắn chữ và hiện chữ rơi vào cùng một lần tính style, và chữ hiện ngay, không mờ dần.
      void doc.defaultView?.getComputedStyle(caption).opacity;
      caption.setAttribute('data-shown', '');
      // Đo cỡ chữ một lần cho mỗi dòng (một lần tính bố cục lúc thả, không phải mỗi khung): place() cần nó để giữ chữ trong
      // vùng. Xoay máy giữa chừng thì số đo lệch chút trong vài giây còn lại của dòng đó.
      box = { width: caption.offsetWidth, height: caption.offsetHeight };
    },
    /**
     * Đặt chữ ngay TRÊN điểm (x, y) (px trong vùng), căn giữa theo chiều ngang. Điểm sát mép thì chữ dừng ở mép mà vẫn ở
     * trên điểm: chữ không tràn ra ngoài màn hình (spec §12). Trên điện thoại chữ rộng gần hết bề ngang, nên chuyện này xảy
     * ra gần như mỗi lần. Chỉ đổi transform: không đụng tới bố cục, nên gọi mỗi khung vẫn rẻ.
     * visible = false (điểm neo ngoài khung, sau camera) thì gắn data-away cho chữ (CSS đưa opacity về 0 ngay), không bao giờ
     * `hidden`, không đụng vùng live; transform cũ để nguyên. visible = true thì gỡ data-away: chữ mờ dần hiện lại.
     */
    place(x, y, visible) {
      if (!caption) return;
      if (visible) {
        // Bề ngang của vùng thì đọc mỗi lần (xoay máy là đổi). Đọc trước khi ghi transform, nên không bắt trình duyệt tính
        // lại bố cục giữa khung.
        const room = region.clientWidth;
        const half = box.width / 2;
        // Vùng hẹp hơn chữ (max-width 80vw nên không xảy ra) thì đặt chữ giữa vùng: hai bên bị cắt như nhau.
        const cx = room > box.width ? Math.min(Math.max(x, half), room - half) : room / 2;
        const cy = Math.max(y, box.height); // sát mép trên: chữ đè lên điểm neo còn hơn mất nửa câu
        caption.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`;
      }
      const away = !visible;
      if (caption.hasAttribute('data-away') !== away) caption.toggleAttribute('data-away', away); // chỉ ghi khi đổi: hàm này chạy mỗi khung
    },
    /** Chữ bắt đầu tan (CSS đưa opacity về 0); clear() gỡ hẳn khi hết giờ. */
    fade() {
      caption?.setAttribute('data-fading', '');
    },
    clear() {
      region.replaceChildren();
      caption = null;
    },
    dispose() {
      region.remove();
      caption = null;
    },
  };
}
```
Tạo `src/styles/captions.css`:

```css
/* styles/captions.css — chữ đi theo vật (GĐ 5, ui/captions.js): vùng aria-live phủ lên canvas; một dòng thơ kèm nguồn đứng trên điểm neo. */

/* Vùng chữ phủ kín [data-stage], tức cùng cỡ với canvas: px mà engine/gpu/caption-set.js chiếu ra dùng thẳng được.
   pointer-events: none để chạm, kéo vẫn rơi xuống canvas. ui/captions.js đã giữ chữ trong vùng; overflow: hidden chỉ là lưới
   an toàn (xoay máy giữa chừng): có gì lọt ra thì bị cắt chứ không làm trang cuộn.
   Vùng là aria-live: không bao giờ hidden hay display: none. Không có chữ thì nó rỗng, và không có khung nào để thu lại. */
.captions {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Góc trái trên của chữ ở (0, 0); JS dời bằng transform: translate(x, y) translate(-50%, -100%), nên chữ đứng ngay TRÊN
   điểm neo, căn giữa. transform không đụng tới bố cục, nên đổi mỗi khung vẫn rẻ. padding-bottom chừa một khoảng hở để
   chữ không đè lên chính vật. JS giữ cả khung chữ (gồm padding) trong vùng, nên padding hai bên và trên là khoảng cách tới
   mép màn hình của chữ đang bị giữ ở mép. Font và bóng chữ như thơ của chân trang (shell.css), để chữ đọc được trên cảnh tối. */
.caption {
  position: absolute;
  left: 0;
  top: 0;
  max-width: min(26rem, 80vw);
  margin: 0;
  padding: 6px 12px 10px;
  font: italic 500 clamp(18px, 0.8vw + 13px, 24px) / 1.4 var(--serif);
  text-align: center;
  text-wrap: balance;
  color: var(--nga);
  text-shadow: var(--ink-shadow);
  opacity: 0;
  transition: opacity 0.8s ease-out;
}
/* ui/captions.js đọc style rồi mới gắn data-shown, nên chữ mờ dần hiện ra. */
.caption[data-shown] { opacity: 1; }
/* Tan trong 1,2 s: đúng CAPTION_FADE của ui/captions.js, chữ bắt đầu tan trước khi hết giờ đúng bấy nhiêu. */
.caption[data-fading] { opacity: 0; transition: opacity 1.2s ease-in; }
/* Người xem xin giảm chuyển động: chữ hiện và tắt ngay, không mờ dần. Cũng không tan sớm: dòng chữ đứng nguyên tới lúc
   clear() gỡ nó (hết CAPTION_SECONDS), thay vì biến mất trước đó CAPTION_FADE giây. */
@media (prefers-reduced-motion: reduce) {
  .caption, .caption[data-fading] { transition: none; }
  .caption[data-fading] { opacity: 1; }
}
/* Điểm neo ra ngoài khung (ui/captions.js gắn data-away): ẩn bằng opacity, không bằng hidden. hidden (display: none) gỡ chữ
   khỏi cây trợ năng, nên vào lại khung là VoiceOver có thể đọc lại cả câu; nó còn hủy transition, nên chữ hiện lại đột ngột.
   Ra ngoài khung thì ẩn ngay; vào lại thì gỡ data-away, và chữ mờ dần hiện ra như lúc mới thả.
   Cùng độ ưu tiên với [data-shown] và [data-fading] (kể cả trong khối giảm chuyển động): phải đứng sau chúng để thắng. */
.caption[data-away] { opacity: 0; transition: none; }
.caption-line { display: block; }
.caption-cite {
  display: block;
  margin-top: 6px;
  font: 400 12px/1.4 var(--sans);
  letter-spacing: 0.04em;
  color: var(--bac-la);
}
.caption-cite cite { font-style: normal; }
```
Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 0244828..4b17baa 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -7,6 +7,7 @@
 @import './tokens.css';
 @import './notebook.css';
 @import './tools.css';
+@import './captions.css';
 @import '@fontsource/cormorant-garamond/500.css';
 @import '@fontsource/cormorant-garamond/500-italic.css';
 @import '@fontsource/be-vietnam-pro/400.css';
@@ -313,8 +314,9 @@ header h1 {
 /* Giảm chuyển động: quầng nhảy thẳng tới từng mốc. !important thắng transition inline mà JS đặt. */
 @media (prefers-reduced-motion: reduce) { .moon-halo { transition: none !important; } }
 
-/* ── ?poster (GĐ 4): chỉ còn canvas, để scripts/poster.js chụp poster từ chính cảnh (không chữ, không huy hiệu, không UI) ── */
-body[data-poster] :is(.frame, .rail, .notebook, .toolbar) { display: none !important; }
+/* ── ?poster (GĐ 4): chỉ còn canvas, để scripts/poster.js chụp poster từ chính cảnh (không chữ, không huy hiệu, không UI) ──
+   GĐ 5: kể cả chữ đi theo vật. Ở đây được display: none, vì ?poster là ảnh để chụp, không có người xem nào đang nghe vùng live. */
+body[data-poster] :is(.frame, .rail, .notebook, .toolbar, .captions) { display: none !important; }
 
 /* ── Chế độ thợ (?debug=stats): stats-gl tự đặt ở góc trái trên, đè lên tên bức. Dời ra giữa mép trên ── */
 [data-debug='stats'] { left: 50% !important; transform: translateX(-50%); }
```
Tạo `src/engine/gpu/caption-set.js`:

```js
// engine/gpu/caption-set.js — chữ đi theo vật (GĐ 5): ctx.captions của bức (khóa → chữ), chiếu điểm neo ra màn hình mỗi khung, giờ theo đồng hồ cảnh.
import { Vector3 } from 'three/webgpu';
import { CAPTION_FADE, CAPTION_SECONDS } from '../../ui/captions.js';

/**
 * Bức chỉ cầm KHÓA, không cầm chữ (code của bức không chứa chữ nào cho người xem): `ctx.captions.show(khóa, anchor)`
 * lấy câu ở content.captions[khóa], và anchor() trả vị trí 3D (toạ độ thế giới) của điểm neo ở mỗi khung, hay null khi
 * khung đó không có điểm neo. Mỗi lúc một dòng: show mới thay dòng đang hiện.
 *
 * scene.js gọi step() mỗi khung, SAU controls.update() (camera đã đứng yên cho khung này) và TRƯỚC render(), và cả khi vẽ
 * lại khung đứng yên (?freeze: camera có thể vừa bị kéo). Không có chữ thì step() trả về ngay, không chiếu gì.
 * anchor() hỏng (ném lỗi, trả undefined hay số không hữu hạn) là lỗi của bức: chữ ẩn ở khung đó, cảnh báo một lần cho mỗi
 * dòng chữ, không tính là khung lỗi (spec §9).
 *
 * @param {object} p
 * @param {Record<string, { lines: string[], source: string, author?: string }>} [p.captions]  content.captions của bức;
 *                                       thiếu (bức không có, hay chữ tải hỏng) thì keys rỗng
 * @param {ReturnType<import('../../ui/captions.js').mountCaptions>} p.ui   vùng chữ trong [data-stage]
 * @param {import('three/webgpu').PerspectiveCamera} p.camera   camera của cảnh (đọc near, far)
 * @param {{ value: number }} p.time      đồng hồ của cảnh (stage.u.time)
 * @param {() => { width: number, height: number }} p.size   cỡ canvas (px CSS), cũng là cỡ của vùng chữ
 * @param {boolean} [p.debug]             ?debug: cảnh báo khi bức gọi một khóa không có chữ
 * @returns {{ api: { keys: string[], show: (key: string, anchor: () => ({ x: number, y: number, z: number } | null)) => void },
 *   step: () => void, dispose: () => void }}
 */
export function createCaptionSet({ captions = {}, ui, camera, time, size, debug = false }) {
  const keys = Object.freeze(Object.keys(captions));
  const point = new Vector3(); // dùng lại mỗi khung, không cấp phát: toạ độ thế giới → toạ độ camera → NDC
  let current = null; // { key, anchor, until, fading, warned } của dòng đang hiện; null khi không có chữ
  let disposed = false;

  // Ẩn chữ ở khung này: ui/captions.js gắn data-away (opacity 0), chữ vẫn nằm trong vùng live, transform cũ để nguyên.
  const hide = () => ui.place(0, 0, false);
  const warnOnce = (message, detail) => {
    if (current.warned) return;
    current.warned = true;
    console.warn(message, detail);
  };

  /** Một khung: hết giờ thì gỡ, gần hết thì tan, rồi đặt chữ theo điểm neo (hay ẩn khi điểm neo ra ngoài khung). */
  function step() {
    if (!current) return;
    const t = time.value;
    if (t >= current.until) {
      ui.clear();
      current = null;
      return;
    }
    if (!current.fading && t >= current.until - CAPTION_FADE) {
      current.fading = true;
      ui.fade();
    }
    let at;
    try {
      at = current.anchor();
    } catch (err) {
      warnOnce(`Chữ "${current.key}": anchor() ném lỗi, chữ ẩn ở khung đó (chỉ báo một lần):`, err);
      hide();
      return;
    }
    if (at === null) {
      hide(); // bức nói khung này không có điểm neo: không phải lỗi
      return;
    }
    // undefined (bức quên return), thiếu trục, số không hữu hạn: lỗi của bức.
    if (!(Number.isFinite(at?.x) && Number.isFinite(at?.y) && Number.isFinite(at?.z))) {
      warnOnce(`Chữ "${current.key}": anchor() phải trả { x, y, z } hữu hạn hay null; chữ ẩn ở khung đó (chỉ báo một lần):`, at);
      hide();
      return;
    }
    // OrbitControls.update() chỉ gọi camera.lookAt(): hướng mới nằm trong quaternion, còn ma trận thế giới (và
    // matrixWorldInverse dùng ngay dưới đây) tới lúc render() mới được tính lại. Tính ngay ở đây, như render() sẽ làm,
    // để chữ không chạy trễ camera một khung khi người xem kéo.
    camera.updateMatrixWorld();
    // Xét độ sâu trong toạ độ của camera (camera nhìn về −z): điểm neo phải ở trước mặt, giữa near và far, như chính vật
    // được vẽ. Không xét bằng z của NDC: khoảng đó tuỳ quy ước độ sâu mà renderer đặt cho camera ([−1, 1] với WebGL,
    // [0, 1] với WebGPU, đảo chiều khi bật reversedDepthBuffer). Với [0, 1], điểm sát camera hơn near vẫn có z trong (−1, 1).
    point.set(at.x, at.y, at.z).applyMatrix4(camera.matrixWorldInverse);
    const depth = -point.z;
    if (!(depth >= camera.near && depth <= camera.far)) {
      hide(); // sau lưng camera, sát hơn near hay xa hơn far
      return;
    }
    // Rồi mới chiếu ra NDC (Vector3.project() là đúng hai phép nhân này): x, y trong [−1, 1] là trong khung, ở mọi quy ước.
    point.applyMatrix4(camera.projectionMatrix);
    if (!(Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1)) {
      hide(); // ngoài khung thì vị trí không còn nghĩa gì: chữ chỉ trong suốt (data-away), không bị gỡ
      return;
    }
    // NDC → px trong canvas: y của NDC hướng lên, y của trang hướng xuống.
    const { width, height } = size();
    ui.place(((point.x + 1) / 2) * width, ((1 - point.y) / 2) * height, true);
  }

  return {
    api: Object.freeze({
      keys,
      show(key, anchor) {
        if (disposed) return;
        // hasOwn: khóa như 'toString' không được lấy nhầm hàm của Object.prototype.
        const poem = Object.hasOwn(captions, key) ? captions[key] : null;
        if (!poem) {
          if (debug) console.warn(`ctx.captions.show: không có chữ "${key}" trong content.captions; không hiện gì.`);
          return;
        }
        ui.show(poem);
        current = { key, anchor, until: time.value + CAPTION_SECONDS, fading: false, warned: false };
        // Đặt chữ ngay: show() có thể đến ngoài vòng lặp (lúc ?freeze đã dừng), và chữ chưa đặt thì nằm ở góc trái trên.
        step();
      },
    }),
    step,
    /** Gỡ vùng chữ khỏi trang; gọi 2 lần vẫn an toàn. Sau đó show() không làm gì. */
    dispose() {
      if (disposed) return;
      disposed = true;
      current = null;
      ui.dispose();
    },
  };
}
```
Áp vào `src/engine/gpu/layers.js`:

```diff
diff --git a/src/engine/gpu/layers.js b/src/engine/gpu/layers.js
index b5372fe..b2e34b5 100644
--- a/src/engine/gpu/layers.js
+++ b/src/engine/gpu/layers.js
@@ -7,6 +7,9 @@ import { createKnobs } from './knob-set.js';
 /** Mặc định của một lần tween trọng số (giây). Đủ chậm để thấy lớp "phủ" lên, đủ nhanh để không phải chờ. */
 export const TWEEN_SECONDS = 0.8;
 
+/** ctx.captions khi người gọi không đưa caption-set (scene.js luôn đưa): không có khóa nào, show() không làm gì. */
+const NO_CAPTIONS = Object.freeze({ keys: Object.freeze([]), show() {} });
+
 const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
 // smoothstep: bắt đầu và kết thúc êm, không giật ở hai đầu.
 const ease = (s) => s * s * (3 - 2 * s);
@@ -84,8 +87,10 @@ export function createWeights(layerMetas, initial = 1) {
  * @param {boolean} p.reducedMotion
  * @param {Date} p.now
  * @param {boolean} [p.debug]
+ * @param {import('../contracts/runtime.js').EngineCtx['captions']} [p.captions]   [5] chữ đi theo vật: `api` của
+ *                                       caption-set.js (scene.js đưa vào); thiếu thì không có chữ
  */
-export function createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug = false }) {
+export function createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug = false, captions = NO_CAPTIONS }) {
   const hex = mergePalette(meta.palette);
   const weights = createWeights(meta.layers);
   /** @type {import('../contracts/runtime.js').EngineCtx} */
@@ -103,6 +108,7 @@ export function createCtx({ meta, stage, level, budget, mobile, reducedMotion, n
     u: stage.u,
     weight: (id) => weights.weight(id),
     debug,
+    captions,
   };
   /** @type {import('../contracts/runtime.js').KnobEnv} */
   const env = { tier: ctx.tier, level, budget, now, mobile };
```
Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index f893234..94fdf57 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -1,4 +1,4 @@
-// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
+// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: chữ → ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
 import { budgetFor, isMobile, pickLevel } from '../quality.js';
 import { FRAME_BUDGET_MS, createTuner } from '../tuner.js';
 import { createGpuTimer } from './gpu-timer.js';
@@ -9,6 +9,8 @@ import { createStudio } from './studio.js';
 import { createInput } from './input.js';
 import { createToolbox } from './toolbox.js';
 import { createDialSet } from './dial-set.js';
+import { createCaptionSet } from './caption-set.js';
+import { mountCaptions } from '../../ui/captions.js';
 
 /**
  * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU) + bộ đo GPU (gpu-timer).
@@ -75,7 +77,7 @@ function createQuality({ level, ladder, tuner, timer }) {
 
 /**
  * run.js gọi hàm này một lần khi mở trang, và thêm một lần nữa nếu người xem bấm "Dựng lại cảnh" sau khi mất GPU.
- * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (setup → lớp → pipeline → input), nên gỡ được ngược lại.
+ * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (chữ → setup → lớp → pipeline → input), nên gỡ được ngược lại.
  * Nếu setup/createLayer ném lỗi, buildLayers đã gỡ các lớp dựng dở; lỗi đi tiếp lên run.js.
  *
  * @param {object} p
@@ -89,7 +91,7 @@ function createQuality({ level, ladder, tuner, timer }) {
  * @param {Window} p.win
  * @param {import('../contracts/runtime.js').Tool[]} [p.tools]   công cụ học (engine/tools/index.js)
  * @param {Record<string, any>} [p.t]        chữ giao diện (nhãn view của công cụ)
- * @param {object | null} [p.content]        chữ của bức (nhãn tap của lớp)
+ * @param {object | null} [p.content]        chữ của bức (nhãn tap của lớp, chữ đi theo vật)
  */
 export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win, tools = [], t = {}, content = null }) {
   stage.useCamera(painting.camera);
@@ -99,7 +101,22 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
   const budget = budgetFor(level, painting.quality);
   stage.setDpr(budget.dpr);
 
-  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug: Boolean(flags.debug) });
+  // Chữ đi theo vật (GĐ 5): vùng aria-live trong [data-stage], phủ lên canvas và cùng cỡ với nó. Bức chỉ cầm khóa
+  // (ctx.captions); chữ ở content.captions, chữ tải hỏng thì không có khóa nào.
+  const canvas = stage.renderer.domElement;
+  const captionSet = createCaptionSet({
+    captions: content?.captions ?? {},
+    ui: mountCaptions(win.document, canvas.parentElement),
+    camera: stage.camera,
+    time: stage.u.time,
+    size: () => ({ width: canvas.clientWidth, height: canvas.clientHeight }),
+    debug: Boolean(flags.debug),
+  });
+  disposer.add(() => captionSet.dispose());
+
+  const { ctx, weights, env } = createCtx({
+    meta, stage, level, budget, mobile, reducedMotion, now, debug: Boolean(flags.debug), captions: captionSet.api,
+  });
   // setup() của bức chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
   const setup = painting.setup?.(ctx);
   if (setup?.dispose) disposer.add(() => setup.dispose());
@@ -146,6 +163,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
             const t = stage.u.time.value;
             setup?.update?.(0, t);
             for (const { layer } of layers) layer.update?.(0, t);
+            captionSet.step(); // đồng hồ đứng nên chữ ở lại; camera có thể vừa bị kéo: chiếu lại
             pipeline.render();
           }
           resolve();
@@ -195,7 +213,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     quality,
     /** Biên dịch trước với đúng render target + MRT của pass, trong lúc poster còn hiện. */
     compile: () => pipeline.compile(),
-    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → render → ms GPU → số đo. */
+    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → chữ → render → ms GPU → số đo. */
     step(ms) {
       const start = win.performance.now();
       quality.sample(ms ?? start);
@@ -206,6 +224,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
       weights.step(dt);
       stage.breathe(t);
       stage.controls?.update();
+      captionSet.step(); // chữ đi theo điểm neo, theo camera của chính khung này
       pipeline.render();
       timer.poll(ms ?? start); // hỏi ms GPU của các khung trước, không chờ
       const end = win.performance.now();
```
Áp vào `src/engine/contracts/painting.js`:

```diff
diff --git a/src/engine/contracts/painting.js b/src/engine/contracts/painting.js
index f3ac346..999095f 100644
--- a/src/engine/contracts/painting.js
+++ b/src/engine/contracts/painting.js
@@ -43,6 +43,8 @@
  * @property {string} hint                              'Chạm vào mặt nước'
  * @property {Record<string, DialText>} [dials]         khóa = Dial.id
  * @property {Record<string, LayerContent>} [layers]    khóa = LayerMeta.id (bắt buộc từ GĐ 2)
+ * @property {Record<string, Poem>} [captions]          [5] chữ đi theo vật: khóa → { lines (1–2 dòng), source, author? };
+ *                                                     bức gọi ctx.captions.show(khóa, anchor). Khóa kebab-case không dấu
  */
 /** @typedef {{ label: string, notes?: Record<string, string> }} DialText */
 /** Chữ của một lớp trong Sổ tay (GĐ 2). tests/paintings/contract.test.js giữ các luật ghi ở đây.
```
Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 7765d9f..04b840c 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -148,6 +148,9 @@
  * @property {{ time: any, delta: any, resolution: any, pointer?: any }} u              [0] uniform chung (pointer: [1])
  * @property {(layerId: string) => any} weight [0] uniform trọng số; 'cot' luôn là 1; id lạ → ném lỗi
  * @property {boolean} debug                   [0]
+ * @property {{ keys: string[], show: (key: string, anchor: () => ({ x: number, y: number, z: number } | null)) => void }} [captions]
+ *                                            [5] chữ đi theo vật: keys = các khóa có trong content.captions (rỗng khi chữ tải hỏng);
+ *                                            show() thay dòng đang hiện; anchor() trả null thì chữ ẩn ở khung đó
  */
 /** Ctx mà createLayer nhận: EngineCtx cộng hai hàm của CHÍNH lớp đang dựng.
  * @typedef {Object} LayerCtxExtra
```

`e2e/helpers.js` (Task 12 dùng; `npm test` không chạy e2e):

Áp vào `e2e/helpers.js`:

```diff
diff --git a/e2e/helpers.js b/e2e/helpers.js
index d450215..aaf561a 100644
--- a/e2e/helpers.js
+++ b/e2e/helpers.js
@@ -38,8 +38,11 @@ export async function waitForFrames(page, n, { timeout = 30_000 } = {}) {
   return readSma(page);
 }
 
-/** Stylesheet chỉ áp lúc chụp: ẩn mọi con của body trừ [data-stage] (poster, tên, thơ, huy hiệu, con dấu). */
-const STAGE_ONLY = 'body > :not([data-stage]) { visibility: hidden !important; }';
+/**
+ * Stylesheet chỉ áp lúc chụp: ẩn mọi con của body trừ [data-stage] (poster, tên, thơ, huy hiệu, con dấu), và chữ đi theo vật
+ * (GĐ 5): vùng chữ nằm TRONG [data-stage], ngay trên chỗ chạm, nên không ẩn thì ảnh quanh chỗ chạm đổi vì chữ chứ không vì cảnh.
+ */
+const STAGE_ONLY = 'body > :not([data-stage]), [data-captions] { visibility: hidden !important; }';
 
 /**
  * Chụp canvas bằng locator.screenshot() rồi giải mã PNG ngay trong trang (không cần thư viện PNG ở Node).
```

Run: `npx vitest run tests/unit/captions.test.js tests/unit/caption-set.test.js tests/paintings/captions-rule.test.js tests/paintings/contract.test.js tests/paintings/html.test.js tests/unit/layers.test.js tests/unit/scene.test.js tests/unit/shell-css.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  748 passed`.

```bash
git add e2e/helpers.js src/engine/contracts/painting.js src/engine/contracts/runtime.js src/engine/gpu/caption-set.js src/engine/gpu/layers.js src/engine/gpu/scene.js src/styles/captions.css src/styles/shell.css src/ui/captions.js tests/helpers/caption-rules.js tests/helpers/fake-ctx.js tests/helpers/kebab.js tests/paintings/captions-rule.test.js tests/paintings/contract.test.js tests/paintings/html.test.js tests/unit/caption-set.test.js tests/unit/captions.test.js tests/unit/layers.test.js tests/unit/scene.test.js tests/unit/shell-css.test.js
git commit -F - <<'EOF'
feat(engine): chữ đi theo vật (ctx.captions + content.captions; ui/captions.js là một vùng aria-live, caption-set.js chiếu điểm neo mỗi khung)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Tên vật và nhãn (cho Từng sợi)

**Mục tiêu:** Spec §6 "Tên vật (GĐ 5)", §8.3 (`LayerContent.objects`), §8.4 (`Layer.objects`, mục [5]). Từng sợi (Task 7) ghi tên từng lần vẽ, ví dụ "Cánh sen · lớp Cốt · InstancedMesh × 388 · 46.560 tam giác.". Để làm được:
- mọi vật trong `layer.objects` có `name` kebab-case, không trùng trong lớp;
- `content.layers[id].objects[name]` là nhãn người xem đọc.

| Lớp | Vật (chỗ tạo) | `name` | Nhãn |
|---|---|---|---|
| cot | lá nổi (`l1-cot.js`) | `la-noi` | Lá nổi |
| cot | lá đứng (`l1-cot.js`) | `la-dung` | Lá đứng |
| cot | cánh hoa (`parts/cot-flower.js`) | `canh-sen` | Cánh sen |
| cot | gương sen (`parts/cot-flower.js`) | `guong-sen` | Gương sen và nhị |
| cot | cuống (`parts/cot-reeds.js`) | `cuong` | Cuống hoa và lá |
| cot | lau sậy (`parts/cot-reeds.js`) | `lau-say` | Lau sậy |
| cot | Group của thí nghiệm "Tắt instancing" (`parts/cot-lab.js`) | `la-rieng` | Lá nổi, mỗi lá một Mesh |
| anh-trang | trăng (`parts/anh-trang-moon.js`) | `trang` | Trăng |
| anh-trang | đèn ở bờ (`l2-anh-trang.js`; Task 9 chuyển sang `parts/anh-trang-lantern.js`) | `hoa-dang` | Đèn hoa đăng |
| suong | vòm trời (`parts/suong-troi.js`) | `vom-troi` | Vòm trời |
| mat-nuoc | mặt nước (`l4-mat-nuoc.js`) | `mat-nuoc` | Mặt nước |
| vang-la | sprite GPU (`l5-vang-la.js`) | `dom-dom` | Đom đóm (GPU) |
| vang-la | sprite CPU (thí nghiệm "cpu") | `dom-dom-cpu` | Đom đóm (CPU) |
| `_mau` cot | khối, bệ | `khoi`, `be` | Nút thắt, Bệ |

- Hai sprite đom đóm cùng một hàm dựng: tên đặt ở chỗ gọi trong `l5-vang-la.js`, không đặt trong hàm dùng chung.
- Mesh con của Group `la-rieng` không có tên: Từng sợi lần lên Group cha để lấy lớp và nhãn.
- three r186: `InstancedMesh` không đặt `type` riêng (vẫn là `'Mesh'`), nên Task 6 nhận ra nó bằng `isInstancedMesh`.

Test mới `tests/paintings/objects.test.js` dựng mỗi bức ở mức cao và mức thấp, bật rồi tắt từng thí nghiệm, và kiểm ba điều: mọi vật có tên đúng dạng, có nhãn ở mọi ngôn ngữ của content, và không có nhãn thừa. Vòng lặp qua các bức (registry + `_mau`) chuyển sang `tests/helpers/paintings.js`, để `contract.test.js` và test mới dùng chung.

**Files:**
- Modify (Bức 1): `layers/l1-cot.js`, `parts/cot-flower.js`, `parts/cot-reeds.js`, `parts/cot-lab.js`, `layers/l2-anh-trang.js`, `parts/anh-trang-moon.js`, `parts/suong-troi.js`, `layers/l4-mat-nuoc.js`, `layers/l5-vang-la.js`, `content.vi.js`
- Modify (`_mau`): `layers/l1-cot.js`, `content.vi.js`
- Modify: `src/engine/contracts/painting.js` (`LayerContent.objects`), `src/engine/contracts/runtime.js` (`Layer.objects`, mục [5])
- Create: `tests/helpers/paintings.js`, `tests/paintings/objects.test.js`
- Test: `tests/paintings/contract.test.js`, `tests/paintings/ao-sen-dem/cot.test.js`

**Interfaces:**
- Consumes: —
- Produces:
  - tên vật như bảng trên; nhãn ở `content.layers[id].objects`;
  - `ALL` trong `tests/helpers/paintings.js`: `{ meta, page, lang, deployed, entry, langs }[]`.

  Task 6 đọc `object.name` và nhãn. Task 9 giữ tên `hoa-dang` khi chuyển đèn sang `parts/anh-trang-lantern.js`.

- [ ] **Step 1: Test (hỏng: vật chưa có tên)**

Tạo `tests/helpers/paintings.js`:

```js
// tests/helpers/paintings.js — các bức mà test hợp đồng lặp qua: mọi dòng registry (đã deploy) và tranh mẫu _mau, kèm cửa vào đã nạp.
import { paintings } from '../../src/paintings/registry.js';
import mau from '../../src/paintings/_mau/meta.js';

/** Bức đã deploy (registry) và tranh mẫu. Tranh mẫu không có trang HTML và không bị kiểm HTML (spec §12). */
const ROWS = [...paintings.map((p) => ({ ...p, deployed: true })), { meta: mau, page: null, lang: 'vi', deployed: false }];

/**
 * Nạp trước cửa vào của mọi bức (top-level await): danh sách ngôn ngữ của content phải có trước khi khai báo test.
 * @type {{ meta: object, page: string | null, lang: string, deployed: boolean, entry: object, langs: string[] }[]}
 */
export const ALL = await Promise.all(ROWS.map(async (row) => {
  const { default: entry } = await import(`../../src/paintings/${row.meta.slug}/index.js`);
  return { ...row, entry, langs: Object.keys(entry.content ?? {}) };
}));
```
Tạo `tests/paintings/objects.test.js`:

```js
// tests/paintings/objects.test.js — tên vật (GĐ 5) của mọi bức: vật trong layer.objects có name kebab-case, không trùng trong lớp, có nhãn; không nhãn thừa.
import { describe, it, expect } from 'vitest';
import { buildPainting } from '../helpers/fake-ctx.js';
import { KEBAB } from '../helpers/kebab.js';
import { ALL } from '../helpers/paintings.js';

/** RegExp.test(undefined) thử chuỗi "undefined" (khớp kebab-case), nên phải xét kiểu trước. */
const validName = (name) => typeof name === 'string' && KEBAB.test(name);
/** InstancedMesh của r186 không đặt type riêng: type vẫn là 'Mesh'. */
const kindOf = (o) => (o.isInstancedMesh ? 'InstancedMesh' : o.type);

/**
 * Dựng bức như run.js ở mức cao và mức thấp; mỗi lớp được xem lúc vừa dựng và lúc từng thí nghiệm đang bật (thí nghiệm
 * thêm được vật, như Group lá rời của "Tắt instancing"). Lần xem nào cũng vậy: vật nào cũng có name kebab-case không dấu,
 * và không hai vật nào của một lớp cùng tên. Lỗi của một vật ghi lúc nó xuất hiện lần đầu (vật có từ lúc dựng thì không
 * ghi gì, vật do thí nghiệm thêm thì ghi tên thí nghiệm ấy, kể cả khi nó còn ở lại sau khi tắt), nên dù lần xem nào cũng
 * gặp, mỗi lỗi chỉ hiện một lần. Cuối dòng lỗi ghi các mức đã gặp nó, như "(mức thap)": lỗi chỉ có ở mức thấp thì dựng
 * bức ở mức cao (mức mặc định) để xem sẽ không thấy.
 * @returns {Promise<{ names: Map<string, Set<string>>, errors: string[] }>}  names: id lớp → mọi tên hợp lệ đã gặp
 */
async function collectNames(painting, meta) {
  const names = new Map();
  const errors = new Map(); // lỗi → các mức đã gặp nó: cùng một lỗi ở cả hai mức vẫn chỉ là một dòng
  for (const level of ['cao', 'thap']) {
    const report = (error) => errors.set(error, (errors.get(error) ?? new Set()).add(level));
    for (const { id, layer } of buildPainting(painting, meta, { level }).built) {
      const own = names.get(id) ?? new Set();
      names.set(id, own);
      const born = new Map(); // vật → lúc nó xuất hiện lần đầu
      const look = (when) => {
        const byName = new Map();
        (layer.objects ?? []).forEach((o, i) => {
          if (!born.has(o)) born.set(o, when);
          if (!validName(o.name)) {
            const what = o.name ? `có name "${o.name}", phải là kebab-case không dấu` : 'chưa có name';
            report(`lớp "${id}"${born.get(o)}: vật thứ ${i} (${kindOf(o)}) ${what}`);
            return;
          }
          own.add(o.name);
          byName.set(o.name, [...(byName.get(o.name) ?? []), o]);
        });
        for (const [name, list] of byName) {
          if (list.length < 2) continue;
          const at = list.map((o) => born.get(o)).find(Boolean) ?? '';
          report(`lớp "${id}"${at}: ${list.length} vật cùng tên "${name}" (tên không được trùng trong lớp)`);
        }
      };
      look('');
      for (const exp of layer.experiments ?? []) {
        await exp.toggle(true);
        look(` (lúc bật thí nghiệm "${exp.id}")`);
        await exp.toggle(false);
      }
    }
  }
  return { names, errors: [...errors].map(([error, levels]) => `${error} (mức ${[...levels].join(', ')})`) };
}

/**
 * Lỗi nhãn trong chữ của một ngôn ngữ: tên vật nào cũng có nhãn (chuỗi không rỗng) ở content.layers[id].objects[tên],
 * và khóa nào trong đó cũng là tên của một vật có thật (không nhãn thừa).
 * @param {Map<string, Set<string>>} names  id lớp → mọi tên đã gặp (collectNames)
 */
function labelErrors(names, content, lang) {
  const errors = [];
  for (const [id, own] of names) {
    for (const name of own) {
      const label = content.layers?.[id]?.objects?.[name];
      if (typeof label !== 'string' || !label.trim()) errors.push(`${lang}: thiếu nhãn content.layers["${id}"].objects["${name}"]`);
    }
  }
  for (const [id, text] of Object.entries(content.layers ?? {})) {
    for (const name of Object.keys(text.objects ?? {})) {
      if (names.get(id)?.has(name)) continue;
      errors.push(`${lang}: nhãn thừa content.layers["${id}"].objects["${name}"]: không vật nào của lớp "${id}" mang tên này `
        + '(ở mức cao, mức thấp, lúc bật từng thí nghiệm)');
    }
  }
  return errors;
}

describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, { meta, entry, langs }) => {
  it('tên vật (GĐ 5): ở mức cao, thấp và lúc bật từng thí nghiệm, mọi vật trong layer.objects có name kebab-case, không trùng '
    + 'trong lớp, có nhãn ở content.layers[id].objects; không nhãn thừa', async () => {
    const { names, errors } = await collectNames(await entry.load(), meta);
    for (const lang of langs) {
      const { default: content } = await entry.content[lang]();
      errors.push(...labelErrors(names, content, lang));
    }
    expect(errors, `tên vật và nhãn của bức "${slug}":\n${errors.join('\n')}`).toEqual([]);
  });
});
```
Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index fe5ed4e..5ba0db9 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -3,10 +3,10 @@ import { describe, it, expect } from 'vitest';
 import { existsSync, readFileSync, statSync } from 'node:fs';
 import { resolve } from 'node:path';
 import { paintings } from '../../src/paintings/registry.js';
-import mau from '../../src/paintings/_mau/meta.js';
 import { mergePalette } from '../../src/engine/palette.js';
 import { hasCode } from '../../src/ui/code-view.js';
 import { NOW, buildPainting } from '../helpers/fake-ctx.js';
+import { ALL } from '../helpers/paintings.js';
 import { svgColors } from '../helpers/svg.js';
 import { jpegSize, webpSize } from '../helpers/image.js';
 import { KEBAB } from '../helpers/kebab.js';
@@ -19,14 +19,6 @@ const SRC = resolve(import.meta.dirname, '../../src');
 const MARKER = /\/\/\s*@knob\s+([A-Za-z0-9_]+)/g;
 const MAX_WORDS = 150;
 
-/** Bức đã deploy (registry) và tranh mẫu. Tranh mẫu không có trang HTML và không bị kiểm HTML (spec §12). */
-const ROWS = [...paintings.map((p) => ({ ...p, deployed: true })), { meta: mau, page: null, lang: 'vi', deployed: false }];
-// Nạp trước cửa vào của mọi bức (top-level await): danh sách ngôn ngữ của content phải có trước khi khai báo test.
-const ALL = await Promise.all(ROWS.map(async (row) => {
-  const { default: entry } = await import(`../../src/paintings/${row.meta.slug}/index.js`);
-  return { ...row, entry, langs: Object.keys(entry.content ?? {}) };
-}));
-
 /** Tập id núm có marker `// @knob <id>` trong các file (đường dẫn tính từ src/). */
 function markersIn(files) {
   const ids = new Set();
```
Áp vào `tests/paintings/ao-sen-dem/cot.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/cot.test.js b/tests/paintings/ao-sen-dem/cot.test.js
index 820a7ba..d293e7b 100644
--- a/tests/paintings/ao-sen-dem/cot.test.js
+++ b/tests/paintings/ao-sen-dem/cot.test.js
@@ -187,7 +187,7 @@ describe('l1-cot · núm rebuild (GĐ 2): ghi lại InstancedMesh sẵn có, kh
 describe('l1-cot · Phá (GĐ 2)', () => {
   const experiment = (layer, id) => layer.experiments.find((e) => e.id === id);
 
-  it('"Tắt instancing": lá nổi thành từng Mesh riêng (tối đa theo mức), giấu InstancedMesh; tắt thì như cũ', () => {
+  it('"Tắt instancing": lá nổi thành từng Mesh riêng (tối đa theo mức) trong Group "la-rieng", giấu InstancedMesh; tắt thì như cũ', () => {
     for (const level of ['cao', 'thap']) {
       const { ctx, layers } = build({ level });
       const [leaves] = layers.cot.objects;
@@ -195,6 +195,7 @@ describe('l1-cot · Phá (GĐ 2)', () => {
       experiment(layers.cot, 'noInstancing').toggle(true); // bật hai lần vẫn chỉ một Group
       const group = layers.cot.objects.at(-1);
       expect(group.isGroup).toBe(true);
+      expect(group.name).toBe('la-rieng'); // tên vật (GĐ 5): Từng sợi tra nhãn của mọi Mesh rời theo Group này
       expect(group.children.filter((m) => m.visible)).toHaveLength(Math.min(leaves.count, LOOSE_MAX[level]));
       expect(group.children[0].material).toBe(leaves.material);
       expect(ctx.scene.children).toContain(group);
```

Run: `npx vitest run tests/paintings/objects.test.js tests/paintings/contract.test.js tests/paintings/ao-sen-dem/cot.test.js`
Kết quả mong đợi: FAIL, 3 test hỏng; lỗi đầu tiên: `AssertionError: tên vật và nhãn của bức "ao-sen-dem":`.

- [ ] **Step 2: Code**

Áp vào `src/engine/contracts/painting.js`:

```diff
diff --git a/src/engine/contracts/painting.js b/src/engine/contracts/painting.js
index 999095f..33a4078 100644
--- a/src/engine/contracts/painting.js
+++ b/src/engine/contracts/painting.js
@@ -59,6 +59,7 @@
  * @property {Record<string, { label: string, explain: string }>} [experiments]   cho MỌI thí nghiệm của lớp
  * @property {Record<string, string>} [readouts]   nhãn cho MỌI số đo riêng của lớp
  * @property {Record<string, string>} [taps]    nhãn các bước chụp của post (Lột lớp, Kính mài)
+ * @property {Record<string, string>} [objects] [5] nhãn cho MỌI vật trong layer.objects, khóa = object.name (Từng sợi)
  */
 
 export {};
```
Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 04b840c..0788f98 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -54,6 +54,7 @@
 /** Thứ createLayer trả về. Trọng số và núm KHÔNG nằm ở đây: xưởng tạo sẵn, lớp chỉ đọc.
  * @typedef {Object} Layer
  * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
+ *                                        [5] mỗi vật có name (kebab-case, không trùng trong lớp); nhãn ở content.layers[id].objects
  * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
  *                                 [4] update(0, t): xưởng vẽ lại khung đứng yên (?freeze): đồng bộ theo uniform (hướng trăng, bóng),
  *                                 KHÔNG tiến mô phỏng (compute, hạt CPU)
```
Áp vào `src/paintings/ao-sen-dem/layers/l1-cot.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l1-cot.js b/src/paintings/ao-sen-dem/layers/l1-cot.js
index 7c204f0..7144b3c 100644
--- a/src/paintings/ao-sen-dem/layers/l1-cot.js
+++ b/src/paintings/ao-sen-dem/layers/l1-cot.js
@@ -87,8 +87,10 @@ export function createLayer(ctx, shared) {
   // để cả chiếc lá nhấp nhô cùng nhịp sóng thay vì từng đỉnh lệch nhau.
   leafGeometry.setAttribute('instanceCenter', new InstancedBufferAttribute(new Float32Array(LEAF_MAX * 2), 2));
   const leaves = new InstancedMesh(leafGeometry, leafMaterial, LEAF_MAX);
+  leaves.name = 'la-noi'; // tên vật: Từng sợi tra nhãn ở content.layers.cot.objects; Inspector của ?debug hiện tên này
   // Lá đứng dùng hình riêng: thuộc tính instance gắn với geometry, không chia được với lá nổi.
   const standingLeaves = new InstancedMesh(makeLeafGeometry(), standingMaterial, STANDING_MAX);
+  standingLeaves.name = 'la-dung';
   const petalGeometry = makePetalGeometry(); // hình cánh để lớp sau dùng lại (đèn hoa đăng)
   const petals = makePetals({ geometry: makePetalGeometry(), material: petalMaterial, openness: ctx.knob('openness') }); // @knob openness
   const cores = makeCores(coreMaterial);
```
Áp vào `src/paintings/ao-sen-dem/parts/cot-flower.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/cot-flower.js b/src/paintings/ao-sen-dem/parts/cot-flower.js
index 14d0906..98ad91f 100644
--- a/src/paintings/ao-sen-dem/parts/cot-flower.js
+++ b/src/paintings/ao-sen-dem/parts/cot-flower.js
@@ -125,6 +125,7 @@ function petalItems(flowers, buds) {
  */
 export function makePetals({ geometry, material, openness }) {
   const mesh = new InstancedMesh(geometry, material, PETAL_CAPACITY);
+  mesh.name = 'canh-sen';
   geometry.setAttribute('petalHinge', new InstancedBufferAttribute(new Float32Array(PETAL_CAPACITY * 4), 4));
   geometry.setAttribute('petalYaw', new InstancedBufferAttribute(new Float32Array(PETAL_CAPACITY), 1));
   const h = attribute('petalHinge', 'vec4');
@@ -205,7 +206,9 @@ export function makeCoreGeometry() {
 
 /** Gương sen: một instance cho mỗi bông đã nở (nụ không có), cấp phát cho FLOWERS bông. */
 export function makeCores(material) {
-  return new InstancedMesh(makeCoreGeometry(), material, FLOWERS);
+  const mesh = new InstancedMesh(makeCoreGeometry(), material, FLOWERS);
+  mesh.name = 'guong-sen';
+  return mesh;
 }
 
 /** Ghi vị trí và cỡ của từng gương sen. */
```
Áp vào `src/paintings/ao-sen-dem/parts/cot-reeds.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/cot-reeds.js b/src/paintings/ao-sen-dem/parts/cot-reeds.js
index 0193545..adff707 100644
--- a/src/paintings/ao-sen-dem/parts/cot-reeds.js
+++ b/src/paintings/ao-sen-dem/parts/cot-reeds.js
@@ -10,7 +10,9 @@ const RIM = { inner: 50, outer: 58, clumps: 14 };
  */
 export function makeStems(capacity, material) {
   const geometry = new CylinderGeometry(0.035, 0.05, 1, 6, 1, true).translate(0, 0.5, 0);
-  return new InstancedMesh(geometry, material, capacity);
+  const mesh = new InstancedMesh(geometry, material, capacity);
+  mesh.name = 'cuong';
+  return mesh;
 }
 
 /**
@@ -42,7 +44,9 @@ function makeBladeGeometry() {
 /** Lau sậy: `count` ngọn. Hai mặt đều vẽ (DoubleSide) vì dải lau rất mỏng. */
 export function makeReeds(count, material) {
   material.side = DoubleSide;
-  return new InstancedMesh(makeBladeGeometry(), material, count);
+  const mesh = new InstancedMesh(makeBladeGeometry(), material, count);
+  mesh.name = 'lau-say';
+  return mesh;
 }
 
 /** Rải lau thành khóm quanh rìa ao, mỗi ngọn cao thấp, nghiêng khác nhau. Cùng rng thì cùng kết quả. */
```
Áp vào `src/paintings/ao-sen-dem/parts/cot-lab.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/cot-lab.js b/src/paintings/ao-sen-dem/parts/cot-lab.js
index 91317cf..fccc437 100644
--- a/src/paintings/ao-sen-dem/parts/cot-lab.js
+++ b/src/paintings/ao-sen-dem/parts/cot-lab.js
@@ -16,6 +16,7 @@ export const LOOSE_MAX = { cao: 1200, vua: 600, thap: 300 };
  */
 export function createLooseLeaves(scene, leaves, max) {
   const group = new Group();
+  group.name = 'la-rieng'; // các Mesh rời không cần tên riêng: Từng sợi gán chúng cho Group này
   for (let i = 0; i < max; i++) {
     const mesh = new Mesh(leaves.geometry, leaves.material);
     mesh.matrixAutoUpdate = false; // ma trận chép sẵn từ instance, không tính lại từ position/rotation/scale
```
Áp vào `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index e3d7b5f..bf4c88d 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -66,6 +66,7 @@ function createLantern(ctx, cot, w) {
   // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép.
   material.emissiveNode = flame.mul(mix(1.6, 0.3, uv().y)).mul(w);
   const mesh = new InstancedMesh(cot.petalGeometry, material, 8);
+  mesh.name = 'hoa-dang';
   const dummy = new Object3D();
   dummy.rotation.order = 'YXZ';
   for (let k = 0; k < 8; k++) {
```
Áp vào `src/paintings/ao-sen-dem/parts/anh-trang-moon.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/anh-trang-moon.js b/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
index 409b14b..91178e9 100644
--- a/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
+++ b/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
@@ -38,6 +38,7 @@ export function createMoon(ctx, w, phase) {
   material.colorNode = mix(color(hex.datSet), vec3(0), w);
   material.emissiveNode = light.mul(w);
   const moon = new Mesh(new SphereGeometry(MOON.radius, 48, 24), material);
+  moon.name = 'trang';
   return {
     moon,
     /** Mỗi khung: đặt trăng theo hướng của bức (giờ đêm), cập nhật pha từ núm. */
```
Áp vào `src/paintings/ao-sen-dem/parts/suong-troi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/suong-troi.js b/src/paintings/ao-sen-dem/parts/suong-troi.js
index be36ce0..c4ed3dc 100644
--- a/src/paintings/ao-sen-dem/parts/suong-troi.js
+++ b/src/paintings/ao-sen-dem/parts/suong-troi.js
@@ -96,6 +96,7 @@ export function createSkyDome(skyColor) {
   material.colorNode = skyColor(normalize(positionWorld.sub(cameraPosition)));
   material.emissiveNode = vec3(0);
   const dome = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), material);
+  dome.name = 'vom-troi';
   dome.renderOrder = -1;
   return dome;
 }
```
Áp vào `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
index abe1bc7..9e9f131 100644
--- a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
+++ b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
@@ -130,6 +130,7 @@ export function createLayer(ctx, shared) {
 
   const geometry = new CircleGeometry(POND_RADIUS, 96).rotateX(-Math.PI / 2); // đĩa nước thuộc lớp này
   const water = new Mesh(geometry, material);
+  water.name = 'mat-nuoc';
   ctx.scene.add(water);
 
   // Lá nổi của Cốt nhấp nhô theo cùng hàm sóng, đọc TÂM lá (positionNode chạy sau instancing).
```
Áp vào `src/paintings/ao-sen-dem/layers/l5-vang-la.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l5-vang-la.js b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
index 39cd1c9..5f4c523 100644
--- a/src/paintings/ao-sen-dem/layers/l5-vang-la.js
+++ b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
@@ -109,6 +109,7 @@ export function createLayer(ctx, shared) {
   // Hiển thị: MỘT Sprite vẽ `count` bản sao; vị trí đọc thẳng bộ đệm compute qua toAttribute()
   // (thành vertex attribute, không cần storage buffer ở vertex stage).
   const sprite = createFireflySprite(ctx, { cell: posPhase.toAttribute(), w, fogFactor: shared.suong.fogFactor, count: wanted });
+  sprite.name = 'dom-dom'; // hai đàn chung một hàm dựng: tên đặt ở đây, nơi biết đàn nào là đàn nào
   ctx.scene.add(sprite);
   const objects = [sprite]; // mảng SỐNG: đàn CPU thêm vào khi được dựng
 
@@ -155,6 +156,7 @@ export function createLayer(ctx, shared) {
           if (on && !cpu) {
             const uniforms = { flowScale: ctx.knob('flowScale'), speed: ctx.knob('speed'), attraction: ctx.knob('attraction') };
             cpu = createCpuFlock(ctx, { w, fogFactor: shared.suong.fogFactor, attract: shared.attract, knobs: uniforms, count: Math.min(wanted, cap) });
+            cpu.sprite.name = 'dom-dom-cpu';
             if (!additive) setAdditive(cpu.sprite, false);
             ctx.scene.add(cpu.sprite);
             objects.push(cpu.sprite);
```
Áp vào `src/paintings/ao-sen-dem/content.vi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index a7ea430..48ea7d4 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -7,7 +7,7 @@ import matNuocDiagram from './diagrams/mat-nuoc.svg?raw';
 import vangLaDiagram from './diagrams/vang-la.svg?raw';
 
 /**
- * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo): đổi chữ không đụng tới code của lớp.
+ * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tên vật): đổi chữ không đụng tới code của lớp.
  * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
  * @type {import('../../engine/contracts/painting.js').PaintingContent}
  */
@@ -61,6 +61,10 @@ export default {
         },
       },
       readouts: { leaves: 'Số lá', vertices: 'Số đỉnh mỗi lần vẽ' },
+      objects: {
+        'la-noi': 'Lá nổi', 'la-dung': 'Lá đứng', 'canh-sen': 'Cánh sen', 'guong-sen': 'Gương sen và nhị',
+        cuong: 'Cuống hoa và lá', 'lau-say': 'Lau sậy', 'la-rieng': 'Lá nổi, mỗi lá một Mesh',
+      },
     },
 
     'anh-trang': {
@@ -111,6 +115,7 @@ export default {
         },
       },
       readouts: { shadowMap: 'Cỡ shadow map' },
+      objects: { trang: 'Trăng', 'hoa-dang': 'Đèn hoa đăng' },
     },
 
     suong: {
@@ -154,6 +159,7 @@ export default {
         },
       },
       readouts: { octaves: 'Số octave đang chạy' },
+      objects: { 'vom-troi': 'Vòm trời' },
     },
 
     'mat-nuoc': {
@@ -202,6 +208,7 @@ export default {
         },
       },
       readouts: { reflectionScale: 'Độ phân giải phản chiếu (so với màn hình)' },
+      objects: { 'mat-nuoc': 'Mặt nước' },
     },
 
     'vang-la': {
@@ -246,6 +253,7 @@ export default {
         },
       },
       readouts: { count: 'Số con đang vẽ' },
+      objects: { 'dom-dom': 'Đom đóm (GPU)', 'dom-dom-cpu': 'Đom đóm (CPU)' },
     },
 
     // Lớp dùng chung: chữ viết trung tính cho mọi bức. Muốn ví dụ riêng của ao sen thì ghi đè bằng spread ở đây.
```
Áp vào `src/paintings/_mau/layers/l1-cot.js`:

```diff
diff --git a/src/paintings/_mau/layers/l1-cot.js b/src/paintings/_mau/layers/l1-cot.js
index f45925f..5378fac 100644
--- a/src/paintings/_mau/layers/l1-cot.js
+++ b/src/paintings/_mau/layers/l1-cot.js
@@ -21,7 +21,9 @@ export function createLayer(ctx, shared) {
   material.colorNode = color(ctx.palette.hex.datSet);
   material.emissiveNode = vec3(0);
   const shape = new Mesh(knot(ctx.knobValue('detail')), material);
+  shape.name = 'khoi'; // mọi vật trong objects có name kebab-case; nhãn ở content.layers.cot.objects (Từng sợi hiện nhãn)
   const plinth = new Mesh(new CylinderGeometry(1.2, 1.3, 0.3, 48).translate(0, 0.15, 0), material);
+  plinth.name = 'be';
   const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
 
   const objects = [shape, plinth];
```
Áp vào `src/paintings/_mau/content.vi.js`:

```diff
diff --git a/src/paintings/_mau/content.vi.js b/src/paintings/_mau/content.vi.js
index a0bd697..9d07d05 100644
--- a/src/paintings/_mau/content.vi.js
+++ b/src/paintings/_mau/content.vi.js
@@ -12,6 +12,7 @@ export default {
       knobs: { detail: 'Độ chi tiết của nút thắt' },
       experiments: { flat: { label: 'Normal phẳng', explain: 'Mỗi tam giác sáng một màu: thấy rõ hình được ghép từ mặt phẳng.' } },
       readouts: { triangles: 'Số tam giác' },
+      objects: { khoi: 'Nút thắt', be: 'Bệ' },
     },
     'to-mau': {
       understand: 'Lớp này sơn màu lên đất sét và thắp một ngọn đèn. Màu đi qua mix(đất sét, màu, trọng số), '
```

Run: `npx vitest run tests/paintings/objects.test.js tests/paintings/contract.test.js tests/paintings/ao-sen-dem/cot.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  750 passed`.

```bash
git add src/engine/contracts/painting.js src/engine/contracts/runtime.js src/paintings/_mau/content.vi.js src/paintings/_mau/layers/l1-cot.js src/paintings/ao-sen-dem/content.vi.js src/paintings/ao-sen-dem/layers/l1-cot.js src/paintings/ao-sen-dem/layers/l2-anh-trang.js src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js src/paintings/ao-sen-dem/layers/l5-vang-la.js src/paintings/ao-sen-dem/parts/anh-trang-moon.js src/paintings/ao-sen-dem/parts/cot-flower.js src/paintings/ao-sen-dem/parts/cot-lab.js src/paintings/ao-sen-dem/parts/cot-reeds.js src/paintings/ao-sen-dem/parts/suong-troi.js tests/helpers/paintings.js tests/paintings/ao-sen-dem/cot.test.js tests/paintings/contract.test.js tests/paintings/objects.test.js
git commit -F - <<'EOF'
feat: tên vật và nhãn cho Từng sợi (mọi vật trong layer.objects có name; nhãn ở content.layers[id].objects; test hợp đồng giữ)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Móc lần vẽ (`engine/gpu/draws.js`); `ToolApi.draws`

**Mục tiêu:** Spec §7 "Từng sợi" (chặn lần vẽ), §8.2 "(GĐ 5) Móc lần vẽ", §8.4 (`ToolApi.draws`, `DrawProbe`, `DrawInfo`), §9, Phụ lục A.53. `draws.js` là file DUY NHẤT gọi `renderer.setRenderObjectFunction` (luật mới trong `tests/rules/files.test.js`). Móc chỉ được đặt khi công cụ gọi `start()`, và `stop()` luôn trả lại đúng hàm cũ, như ShadowNode vẫn cất rồi trả móc.

Mỗi khung được ghi, móc đếm thế này:
- **Lượt vẽ cảnh:** mỗi lần three gọi `renderObject` cho camera chính là một sợi (khóa `object.id:material.id:passId`). `list()` giữ đúng thứ tự vẽ.
- **Phản chiếu:** lần vẽ của camera khác LỒNG trong một lần vẽ của camera chính (ảnh phản chiếu vẽ ngay trong lúc vẽ mặt nước) tính vào `reflection`, và cộng vào `nested` của vật đó.
- **Còn lại** (bóng, bloom, FXAA, quad của lượt cuối): `other` = tổng draw call của khung trừ hai số trên.
- **`limit(k)`:** chỉ vẽ k sợi đầu; vật khác của camera chính bị bỏ qua (không vẽ, three cũng không đếm). Lần vẽ lồng bên trong một vật được phép thì luôn được vẽ, nên bóng và ảnh phản chiếu lúc nào cũng đủ. Đang có limit thì list đứng yên.
- **`DrawInfo`:** lớp và nhãn lấy từ chính vật, hay từ Group cha nằm trong `layer.objects` (Task 5). `kind` nhận ra InstancedMesh bằng `isInstancedMesh`; `instances` tính như `RenderObject.getDrawParameters` của three (instanceCount hay count); `triangles` theo `drawRange` và group.

Điều học được lúc dựng thử: trên Bức 1 (và mọi bức có Phủ bóng), móc lúc đầu không thấy lượt vẽ cảnh nào.
- three r186 chạy updateBefore của lượt cuối theo thứ tự dựng node, con trước cha. RTT của FXAA nằm sâu trong ảnh cuối nên chạy trước.
- RTT gọi `resetRendererState` (gỡ móc) rồi vẽ quad của nó, và chính quad ấy vẽ scene pass lần đầu trong khung.
- Sửa ở `views.js`: `renderPipeline.outputNode = Fn(() => { scenePass.toVar(); return vec4(c.rgb, 1); })()`. Scene pass được dựng trước nên chạy trước. Biến đó không ai đọc, nên WGSL và GLSL không thêm một dòng nào.
- Tác dụng phụ: scene pass của Bức 1 xóa nền bằng màu xóa của sân khấu (denThen) thay vì màu đen của RTT. Vòm trời che hết nên không thấy khác: Task 15 so khung mặc định với `main` trên GPU thật, chỉ khác vài điểm ở đèn bờ (lớp sương của Task 10), mắt không thấy.
- Test mới dựng lượt cuối bằng `WGSLNodeBuilder` thật (`tests/helpers/final-pass.js`) và kiểm scene pass chạy đầu tiên.

**Files:**
- Create: `src/engine/gpu/draws.js`, `tests/helpers/final-pass.js`, `tests/unit/draws.test.js`
- Modify:
  - `src/engine/gpu/scene.js`: tạo móc; `begin()`/`end()` quanh `render()` ở cả `step()` lẫn vẽ lại khung đứng yên; disposer gỡ móc; đưa móc cho hộp đồ nghề;
  - `src/engine/gpu/toolbox.js`: `ToolApi.draws`, một bản thu hẹp chỉ có `start`, `stop`, `list`, `limit`, `counts` (như bức chỉ thấy `captionSet.api`): công cụ không bao giờ tự bọc khung bằng `begin()`/`end()`;
  - `src/engine/gpu/views.js`: scene pass chạy đầu tiên;
  - `src/engine/contracts/runtime.js`: `ToolApi.draws`, `DrawProbe`, `DrawInfo`; `ToolInstance.onGesture` giữ `'tap'` thì giữ cả `'double-tap'`;
  - spec: §7, §8.4, §12, cây file, Phụ lục A.53.
- Test: `tests/rules/files.test.js`, `tests/unit/pipeline.test.js`, `tests/unit/scene.test.js`, `tests/unit/toolbox.test.js`, `tests/unit/views.test.js`

**Interfaces:**
- Consumes: tên vật và nhãn (Task 5); `meta.layers[i].name`.
- Produces:
  - `createDrawProbe({ renderer, camera, layers, meta, content }) → { start, stop, list, limit, counts, begin, end }`;
  - `ToolApi.draws: DrawProbe | null`, với `DrawProbe = { start, stop, list, limit, counts }` (đông cứng; `begin`/`end` chỉ scene.js giữ);
  - `DrawInfo { layerId, layer, name, label, kind, instances, triangles, material, nested }`; `counts() → { scene, reflection, other }`;
  - `limit(k)` nhận số nguyên ≥ 0 hay `null`; giá trị của input range là chuỗi, phải `Number()` trước.

  Task 7 dùng `api.draws`.

- [ ] **Step 1: Test (hỏng: chưa có `draws.js`)**

Tạo `tests/helpers/final-pass.js`:

```js
// tests/helpers/final-pass.js — dựng ảnh cuối của RenderPipeline như three dựng lượt cuối (chặng setup, WGSLNodeBuilder thật, không GPU).
import { HalfFloatType, NodeMaterial, QuadMesh, WGSLNodeBuilder, WebGPUCoordinateSystem } from 'three/webgpu';

/** Renderer giả: chỉ những gì chặng setup đọc (kiểu buffer, số mẫu, hệ tọa độ, chẩn đoán); không vẽ gì. */
function setupRenderer() {
  return {
    backend: { compatibilityMode: false, hasFeature: () => false, utils: { getTextureSampleData: () => ({ primarySamples: 1 }) } },
    debug: { diagnostics: { keywords: false } },
    coordinateSystem: WebGPUCoordinateSystem,
    samples: 0,
    hasFeature: () => false,
    getOutputBufferType: () => HalfFloatType,
    getColorBufferType: () => HalfFloatType,
  };
}

/**
 * Dựng outputNode ở chặng setup, như NodeBuilder.build() dựng fragment của quad cuối, rồi lập danh sách updateBefore đúng cách
 * three lập (buildUpdateNodes). Mỗi khung three gọi updateBefore theo đúng thứ tự của danh sách này.
 * @param {any} outputNode   renderPipeline.outputNode
 * @returns {{ updateBefore: any[], stack: any }}   stack: thân Fn của ảnh cuối (views.js) sau khi dựng; null nếu không phải Fn
 */
export function buildFinalPass(outputNode) {
  const quad = new QuadMesh(new NodeMaterial());
  quad.material.fragmentNode = outputNode;
  const builder = new WGSLNodeBuilder(quad, setupRenderer());
  builder.setBuildStage('setup');
  builder.setShaderStage('fragment');
  builder.addStack(); // addStack đặt stack hiện tại của TSL (biến toàn cục): finally ở dưới trả lại, không rò sang test sau
  try {
    outputNode.build(builder);
    builder.buildUpdateNodes();
    // three r186: Fn(…)() trả VarNode "intent" bọc ShaderCallNodeInternal. Thân Fn chỉ chạy lúc dựng; stack của nó được giữ lại
    // (getOutputNode trả bản đã dựng).
    const call = outputNode.isVarNode && outputNode.intent ? outputNode.node : outputNode;
    const stack = call.isShaderCallNodeInternal ? call.getOutputNode(builder) : null;
    return { updateBefore: [...builder.updateBeforeNodes], stack };
  } finally {
    // Dựng hỏng (ném lỗi) cũng phải trả. Một removeStack chưa đủ: Fn ném lỗi giữa chừng thì addStack của chính nó (setupOutput)
    // chưa được trả, nên trả hết mọi stack của builder này, về đúng stack trước khi dựng.
    while (builder.stacks.length > 0) builder.removeStack();
  }
}
```
Tạo `tests/unit/draws.test.js`:

```js
// tests/unit/draws.test.js — móc lần vẽ trên renderer giả: start/stop trả đúng hàm cũ, ghi lần vẽ của camera chính, phản chiếu lồng, limit(k) theo vật + material + lượt, chủ và nhãn của vật.
import { describe, it, expect, vi } from 'vitest';
import {
  BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, InstancedBufferGeometry, InstancedMesh, Line, LineBasicNodeMaterial, Mesh,
  MeshStandardNodeMaterial, OrthographicCamera, PerspectiveCamera, PlaneGeometry, Points, PointsNodeMaterial, Scene, Sprite,
  SpriteNodeMaterial,
} from 'three/webgpu';
import { createDrawProbe } from '../../src/engine/gpu/draws.js';

const SCENE = new Scene();
const camera = new PerspectiveCamera(); // camera chính: camera của scene pass
const mirror = camera.clone(); // camera ảo của reflector (clone của camera chính, như ReflectorNode)
const mat = () => new MeshStandardNodeMaterial();

/**
 * Renderer giả như three r186: setRenderObjectFunction chỉ ghi lại hàm; renderObject đếm một draw call rồi gọi o.onDraw(cam).
 * Vật có onDraw vẽ thêm ngay trong lần vẽ của nó, như node có updateBefore (reflector của mặt gương, scene pass của quad cuối).
 */
function fakeRenderer() {
  return {
    info: { render: { drawCalls: 0 } },
    _fn: null,
    getRenderObjectFunction() {
      return this._fn;
    },
    setRenderObjectFunction(f) {
      this._fn = f;
    },
    renderObject: vi.fn(function (o, s, cam) {
      this.info.render.drawCalls += 1;
      o.onDraw?.(cam);
    }),
  };
}

/**
 * Một lượt render() của three (_renderObjects): mỗi mục gọi hàm vẽ hiện tại, là móc nếu đã gắn, không thì renderObject. Mesh nhiều
 * material thành một mục cho mỗi nhóm (group) của hình, như projectObject của three; passId như lượt 'backSide' của vật trong suốt.
 */
function render(r, items, cam, passId = null) {
  for (const o of items) {
    const parts = Array.isArray(o.material) ? o.geometry.groups.map((g) => [o.material[g.materialIndex], g]) : [[o.material, null]];
    for (const [material, group] of parts) (r._fn ?? r.renderObject).call(r, o, SCENE, cam, o.geometry, material, group, null, null, passId);
  }
}

/** Tên lớp ở meta, nhãn vật ở content.layers[id].objects: đúng hình của hợp đồng (painting.js). */
const META = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'guong', name: 'Gương' }] };
const CONTENT = { layers: { cot: { objects: { khoi: 'Khối đất', hat: 'Hạt', bo: 'Bó cành' } }, guong: { objects: { guong: 'Mặt gương' } } } };

/**
 * Cảnh giả hai lớp: khối đất và hạt (lớp 'cot'), mặt gương (lớp 'guong') vẽ lại khối và hạt bằng camera ảo ngay trong lần vẽ
 * của nó. frame(items) là một khung của scene.js: begin → render → end.
 */
function pond() {
  const r = fakeRenderer();
  const clay = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'khoi' });
  const grains = Object.assign(new InstancedMesh(new PlaneGeometry(), mat(), 50), { name: 'hat' });
  const glass = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'guong' });
  glass.onDraw = (cam) => cam === camera && render(r, [clay, grains], mirror);
  const layers = [{ id: 'cot', layer: { objects: [clay, grains] } }, { id: 'guong', layer: { objects: [glass] } }];
  const probe = createDrawProbe({ renderer: r, camera, layers, meta: META, content: CONTENT });
  const frame = (items = [clay, glass, grains]) => {
    probe.begin();
    render(r, items, camera);
    probe.end();
  };
  return { r, probe, clay, grains, glass, frame };
}

describe('createDrawProbe', () => {
  it('chưa start thì begin/end không làm gì và không đặt móc', () => {
    const { r, probe, frame } = pond();
    frame();
    expect(r._fn).toBeNull();
    expect(r.renderObject).toHaveBeenCalledTimes(5); // 3 vật + 2 lần vẽ phản chiếu
    expect(probe.list()).toEqual([]);
    expect(Object.isFrozen(probe.list())).toBe(true); // như list của một khung đã ghi: công cụ không sửa được
    expect(probe.counts()).toEqual({ scene: 0, reflection: 0, other: 0 });
  });

  it('start đặt móc, stop trả đúng hàm cũ (null, hay một hàm khác đã đặt trước); hàm cũ vẫn vẽ các lần vẽ được phép', () => {
    const { r, probe, frame } = pond();
    probe.start();
    probe.start(); // gọi hai lần vẫn là một móc
    expect(typeof r._fn).toBe('function');
    probe.stop();
    probe.stop();
    expect(r._fn).toBeNull();
    // Một hàm khác đã đặt trước (như ToonOutlinePassNode của three): móc vẽ qua nó, stop trả lại đúng nó.
    const other = vi.fn(function (...args) {
      this.renderObject(...args);
    });
    r._fn = other;
    probe.start();
    expect(r._fn).not.toBe(other);
    frame();
    expect(other.mock.calls.map(([o, , cam]) => [o.name, cam === camera])).toEqual([
      ['khoi', true], ['guong', true], ['khoi', false], ['hat', false], ['hat', true],
    ]);
    expect(other.mock.contexts.every((c) => c === r)).toBe(true); // gọi như three gọi: this là renderer
    probe.stop();
    probe.stop(); // công cụ tự stop() khi tắt, disposer của cảnh stop() thêm lần nữa: lần hai không được đè hàm cũ bằng null
    expect(r._fn).toBe(other);
  });

  it('list theo đúng thứ tự vẽ của camera chính, đông cứng cả từng mục; lần vẽ của camera khác không vào list mà vào counts.reflection', () => {
    const { probe, frame } = pond();
    probe.start();
    frame();
    expect(probe.list().map((d) => [d.name, d.label, d.layerId, d.layer])).toEqual([
      ['khoi', 'Khối đất', 'cot', 'Cốt'],
      ['guong', 'Mặt gương', 'guong', 'Gương'],
      ['hat', 'Hạt', 'cot', 'Cốt'],
    ]);
    expect(Object.isFrozen(probe.list())).toBe(true); // công cụ không sửa được danh sách đã ghi, hay một mục của nó
    expect(Object.isFrozen(probe.list()[0])).toBe(true);
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 0 });
    probe.counts().scene = 99; // mỗi lần một bản sao: công cụ sửa cũng không đổi số của móc
    expect(probe.counts().scene).toBe(3);
  });

  it('lần vẽ lồng (camera khác, trong lúc vẽ một vật) cộng vào nested của vật đó', () => {
    const { probe, frame } = pond();
    probe.start();
    frame();
    expect(probe.list().map((d) => d.nested)).toEqual([0, 2, 0]);
  });

  it('lần vẽ của camera chính lồng trong lần vẽ của camera chính: lần vẽ lồng bên trong nó cộng vào nó (sợi trong cùng), rồi về sợi ngoài', () => {
    const r = fakeRenderer();
    const leaf = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'la' });
    // Sợi trong: ngay trong lần vẽ của nó, camera ảo vẽ lại lá (như reflector).
    const inner = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'trong' });
    inner.onDraw = (cam) => cam === camera && render(r, [leaf], mirror);
    // Sợi ngoài: lần vẽ của nó vẽ sợi trong bằng CHÍNH camera chính (như một pass của camera ấy, vẽ từ updateBefore), rồi thêm
    // một lần vẽ phản chiếu của riêng nó.
    const outer = Object.assign(new Mesh(new PlaneGeometry(), mat()), { name: 'ngoai' });
    outer.onDraw = (cam) => {
      if (cam !== camera) return;
      render(r, [inner], camera);
      render(r, [leaf], mirror);
    };
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [outer], camera);
    probe.end();
    expect(probe.list().map((d) => [d.name, d.nested])).toEqual([['ngoai', 1], ['trong', 1]]);
    expect(probe.counts()).toEqual({ scene: 2, reflection: 2, other: 0 });
  });

  it('counts.other = tổng draw call của khung trừ cảnh và phản chiếu: lượt tự gỡ móc (bóng, bloom), quad của lượt cuối', () => {
    const { r, probe, clay, glass, grains } = pond();
    // Quad của RenderPipeline: camera trực giao, móc thấy nó ở ngoài cùng; scene pass vẽ cảnh ngay trong lần vẽ của nó.
    const quad = new Mesh(new PlaneGeometry(), mat());
    quad.onDraw = () => render(r, [clay, glass, grains], camera);
    // Một lượt hậu kỳ khác vẽ quad SAU lượt vẽ cảnh mà không gỡ móc: vẫn ở ngoài cùng, không phải phản chiếu của vật nào.
    const after = new Mesh(new PlaneGeometry(), mat());
    probe.start();
    probe.begin();
    r.info.render.drawCalls += 4; // bóng đổ, bloom, RTT: các lượt đó tự cất móc rồi trả lại, móc không thấy
    render(r, [quad], new OrthographicCamera());
    render(r, [after], new OrthographicCamera());
    probe.end();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 6 });
    expect(probe.list().map((d) => [d.name, d.nested])).toEqual([['khoi', 0], ['guong', 2], ['hat', 0]]);
  });

  it('khung sau không mang số của khung trước: drawCalls của renderer không về 0 giữa hai khung, counts vẫn chỉ của từng khung', () => {
    const { r, probe, clay, glass, grains } = pond();
    // renderer.info của three chỉ về 0 mỗi nhịp rAF (Animation, khi autoReset), không phải mỗi render(): móc lấy hiệu số từ
    // begin() tới end(), và mỗi khung đếm phản chiếu lại từ 0.
    const frame = () => {
      probe.begin();
      r.info.render.drawCalls += 4; // bóng đổ, bloom: các lượt đó tự cất móc, móc không thấy
      render(r, [clay, glass, grains], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 4 });
    frame();
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 4 });
    expect(r.info.render.drawCalls).toBe(18); // renderer giả đếm dồn: 2 × (4 + 3 vật + 2 lần vẽ phản chiếu)
  });

  it('limit(k) chỉ vẽ k lần đầu của list (so theo vật + material + lượt, không theo thứ tự), list giữ nguyên; limit(null) vẽ đủ và ghi lại', () => {
    const { r, probe, clay, glass, grains, frame } = pond();
    probe.start();
    frame();
    const recorded = probe.list();
    const drawn = () => r.renderObject.mock.calls.map(([o, , cam]) => [o.name, cam === camera]);
    probe.limit(1);
    r.renderObject.mockClear();
    frame([grains, glass, clay]); // camera dời: three sắp lại thứ tự, vẫn chỉ sợi đầu đã ghi (khối) được vẽ
    expect(drawn()).toEqual([['khoi', true]]);
    expect(probe.list()).toBe(recorded); // đang limit thì không ghi: thanh của Từng sợi không nhảy
    expect(probe.counts()).toEqual({ scene: 3, reflection: 2, other: 0 });
    probe.limit(2);
    r.renderObject.mockClear();
    frame();
    expect(drawn()).toEqual([['khoi', true], ['guong', true], ['khoi', false], ['hat', false]]); // gương soi cả hạt chưa vẽ
    probe.limit(0);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).not.toHaveBeenCalled(); // nấc 0: chưa vẽ gì
    probe.limit(3); // k ≥ số sợi: vẽ đủ như limit(null)
    r.renderObject.mockClear();
    frame([grains, clay]);
    expect(r.renderObject).toHaveBeenCalledTimes(2);
    expect(probe.list().map((d) => d.name)).toEqual(['hat', 'khoi']);
    probe.limit(1);
    probe.limit(null);
    frame([clay, glass]);
    expect(probe.list().map((d) => d.name)).toEqual(['khoi', 'guong']);
  });

  it('Mesh nhiều material: mỗi nhóm (group) là một sợi, tam giác theo nhóm; khóa có material nên limit(1) chỉ vẽ nhóm đầu', () => {
    const r = fakeRenderer();
    const box = new BoxGeometry(); // 36 chỉ số
    box.clearGroups();
    box.addGroup(0, 12, 0); // 4 tam giác
    box.addGroup(12, 24, 1); // 8 tam giác
    const top = mat();
    const block = Object.assign(new Mesh(box, [top, mat()]), { name: 'khoi' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects: [block] } }], meta: META, content: CONTENT });
    const frame = () => {
      probe.begin();
      render(r, [block], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.list().map((d) => [d.label, d.triangles])).toEqual([['Khối đất', 4], ['Khối đất', 8]]);
    probe.limit(1);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).toHaveBeenCalledTimes(1);
    expect(r.renderObject.mock.calls[0][4]).toBe(top);
  });

  it('passId: vật trong suốt vẽ hai lượt (mặt sau "backSide", rồi mặt trước), mỗi lượt một sợi; limit(1) chỉ vẽ lượt mặt sau', () => {
    const r = fakeRenderer();
    const bubble = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'bot' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    const frame = () => {
      probe.begin();
      render(r, [bubble], camera, 'backSide'); // _renderTransparents của three: danh sách hai lượt, mặt sau trước
      render(r, [bubble], camera);
      probe.end();
    };
    probe.start();
    frame();
    expect(probe.list()).toHaveLength(2);
    probe.limit(1);
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject.mock.calls.map((c) => c[8])).toEqual(['backSide']);
  });

  it('limit(k) nhận số nguyên ≥ 0 hay null; giá trị khác (chuỗi của input range…) thì ném lỗi', () => {
    const { probe } = pond();
    for (const bad of ['2', -1, 1.5, Number.NaN, undefined]) expect(() => probe.limit(bad)).toThrow('draws.limit');
  });

  it('vật là con của một Group nằm trong layer.objects nhận lớp, tên và nhãn của Group; vật không thuộc lớp nào có layerId null', () => {
    const r = fakeRenderer();
    const stem = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'than' });
    const bunch = Object.assign(new Group(), { name: 'bo' });
    bunch.add(stem);
    const stray = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'lac' });
    const nameless = new Mesh(new BoxGeometry(), mat());
    const later = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'them' });
    const objects = [bunch];
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects } }], meta: META, content: CONTENT });
    probe.start();
    objects.push(later); // objects là mảng SỐNG: thí nghiệm thêm vật lúc chạy, khung sau nhận ra
    probe.begin();
    render(r, [stem, stray, nameless, later], camera);
    probe.end();
    expect(probe.list().map(({ layerId, layer, name, label }) => ({ layerId, layer, name, label }))).toEqual([
      { layerId: 'cot', layer: 'Cốt', name: 'bo', label: 'Bó cành' },
      { layerId: null, layer: null, name: 'lac', label: 'lac' },
      { layerId: null, layer: null, name: null, label: 'Mesh' },
      { layerId: 'cot', layer: 'Cốt', name: 'them', label: 'them' }, // content không có nhãn cho nó: rơi về tên
    ]);
  });

  it('chữ của bức tải hỏng (content = null): nhãn rơi về tên vật, vật không tên thì về loại; lớp vẫn có tên (meta)', () => {
    const r = fakeRenderer();
    const clay = Object.assign(new Mesh(new BoxGeometry(), mat()), { name: 'khoi' });
    const probe = createDrawProbe({ renderer: r, camera, layers: [{ id: 'cot', layer: { objects: [clay] } }], meta: META, content: null });
    probe.start();
    probe.begin();
    render(r, [clay, new Mesh(new BoxGeometry(), mat())], camera);
    probe.end();
    expect(probe.list().map((d) => [d.layer, d.label])).toEqual([['Cốt', 'khoi'], [null, 'Mesh']]);
  });

  it('kind, instances, triangles, material đúng cho Mesh có index, InstancedMesh có count, Sprite có count, hình không có index, drawRange', () => {
    const r = fakeRenderer();
    const box = new Mesh(new BoxGeometry(), mat()); // 36 chỉ số: 12 tam giác
    const grains = new InstancedMesh(new PlaneGeometry(), mat(), 50);
    grains.count = 30; // cấp phát 50, vẽ 30 bản
    const sparks = new Sprite(new SpriteNodeMaterial());
    sparks.count = 40; // Sprite của three r186 có count: một quad (2 tam giác) mỗi bản
    const soup = new BufferGeometry();
    soup.setAttribute('position', new Float32BufferAttribute(new Float32Array(27), 3)); // 9 đỉnh: 3 tam giác
    const loose = new Mesh(soup, mat());
    const half = new Mesh(new BoxGeometry(), mat());
    half.geometry.setDrawRange(24, 100); // chỉ số 24 → 36 (three cắt phần vượt quá số chỉ số): 4 tam giác
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [box, grains, sparks, loose, half], camera);
    probe.end();
    expect(probe.list().map(({ kind, instances, triangles, material }) => ({ kind, instances, triangles, material }))).toEqual([
      { kind: 'Mesh', instances: 1, triangles: 12, material: 'MeshStandardNodeMaterial' },
      { kind: 'InstancedMesh', instances: 30, triangles: 60, material: 'MeshStandardNodeMaterial' },
      { kind: 'Sprite', instances: 40, triangles: 80, material: 'SpriteNodeMaterial' },
      { kind: 'Mesh', instances: 1, triangles: 3, material: 'MeshStandardNodeMaterial' },
      { kind: 'Mesh', instances: 1, triangles: 4, material: 'MeshStandardNodeMaterial' },
    ]);
  });

  it('Points và Line: loại riêng, một bản, không vẽ tam giác; hình InstancedBufferGeometry: số bản là instanceCount', () => {
    const r = fakeRenderer();
    const soup = new BufferGeometry();
    soup.setAttribute('position', new Float32BufferAttribute(new Float32Array(27), 3)); // 9 đỉnh: Mesh trên hình này có 3 tam giác
    const dots = new Points(soup, new PointsNodeMaterial());
    const strand = new Line(soup, new LineBasicNodeMaterial());
    const copies = new InstancedBufferGeometry().copy(new BoxGeometry()); // 36 chỉ số: 12 tam giác mỗi bản
    copies.instanceCount = 7; // three vẽ instanceCount bản, không đọc object.count (Mesh mặc định 1)
    const crowd = new Mesh(copies, mat());
    const probe = createDrawProbe({ renderer: r, camera, layers: [], meta: META });
    probe.start();
    probe.begin();
    render(r, [dots, strand, crowd], camera);
    probe.end();
    expect(probe.list().map(({ kind, instances, triangles, material }) => ({ kind, instances, triangles, material }))).toEqual([
      { kind: 'Points', instances: 1, triangles: 0, material: 'PointsNodeMaterial' },
      { kind: 'Line', instances: 1, triangles: 0, material: 'LineBasicNodeMaterial' },
      { kind: 'Mesh', instances: 7, triangles: 84, material: 'MeshStandardNodeMaterial' },
    ]);
  });

  it('stop sau khi đang limit thì vẽ đủ như chưa có gì; start lại là phiên mới (chưa có list, không còn limit cũ)', () => {
    const { r, probe, frame } = pond();
    probe.start();
    frame();
    probe.limit(0);
    probe.stop();
    expect(r._fn).toBeNull();
    r.renderObject.mockClear();
    frame();
    expect(r.renderObject).toHaveBeenCalledTimes(5);
    probe.start();
    expect(probe.list()).toEqual([]);
    frame();
    expect(probe.list()).toHaveLength(3);
  });

  it('lần vẽ ném lỗi: lỗi đi lên render (khung lỗi), list giữ khung đủ trước đó; khung sau ghi đúng lần vẽ lồng; stop vẫn trả hàm cũ', () => {
    const { r, probe, glass, frame } = pond();
    probe.start();
    frame();
    const draw = r.renderObject.getMockImplementation();
    r.renderObject.mockImplementation(function (o, ...rest) {
      if (o === glass) throw new Error('GPU hỏng');
      draw.call(this, o, ...rest);
    });
    expect(() => frame()).toThrow('GPU hỏng');
    expect(probe.list()).toHaveLength(3);
    r.renderObject.mockImplementation(draw);
    frame();
    expect(probe.list().map((d) => d.nested)).toEqual([0, 2, 0]);
    probe.stop();
    expect(r._fn).toBeNull();
  });
});
```
Áp vào `tests/rules/files.test.js`:

```diff
diff --git a/tests/rules/files.test.js b/tests/rules/files.test.js
index 71a8e27..f69ea97 100644
--- a/tests/rules/files.test.js
+++ b/tests/rules/files.test.js
@@ -1,10 +1,11 @@
-// tests/rules/files.test.js — luật cho từng file nguồn (src/**/*.js, plugins/*.js): dòng 1 là chú thích, số dòng, API cấm.
+// tests/rules/files.test.js — luật cho từng file nguồn (src/**/*.js, plugins/*.js): dòng 1 là chú thích, số dòng, API cấm, chỗ đặt móc lần vẽ.
 import { afterAll, describe, expect, it } from 'vitest';
 import { importedNames, listSrc, read, stripComments } from '../helpers/source.js';
 
 const FILES = listSrc();
 const SOFT_LIMIT = 250; // mục tiêu: mỗi file đọc được trong một lần
 const HARD_LIMIT = 300; // quá mức này thì test hỏng
+const DRAW_HOOK_FILE = 'src/engine/gpu/draws.js'; // nơi DUY NHẤT đặt móc lần vẽ của renderer (GĐ 5, Từng sợi)
 const nearLimit = [];
 
 /** Số dòng vật lý, đếm như `wc -l` (số ký tự xuống dòng). */
@@ -120,4 +121,17 @@ describe('luật file', () => {
     // pow2(x) = x·x đúng với mọi dấu và nhanh hơn.
     expect(errors, report('Dùng pow2/pow3/pow4 thay cho pow(…, 2|3|4):', errors)).toEqual([]);
   });
+
+  it(`chỉ ${DRAW_HOOK_FILE} được đặt móc lần vẽ (setRenderObjectFunction, §8.2)`, () => {
+    // Tự kiểm: file được miễn phải còn đó và còn đặt móc, không thì luật này im lặng đúng với một đường dẫn cũ.
+    expect(FILES, `${DRAW_HOOK_FILE} không còn: sửa DRAW_HOOK_FILE theo chỗ móc mới`).toContain(DRAW_HOOK_FILE);
+    expect(stripComments(read(DRAW_HOOK_FILE), DRAW_HOOK_FILE)).toMatch(/\bsetRenderObjectFunction\b/);
+    const errors = [];
+    for (const file of FILES.filter((f) => f !== DRAW_HOOK_FILE)) {
+      const code = stripComments(read(file), file);
+      for (const m of code.matchAll(/\bsetRenderObjectFunction\b/g)) errors.push(`${file}:${lineOf(code, m.index)} — setRenderObjectFunction`);
+    }
+    // three chỉ giữ MỘT hàm vẽ: móc thứ hai ở chỗ khác sẽ âm thầm đè móc của Từng sợi, hay bị Từng sợi đè.
+    expect(errors, report(`Chỉ ${DRAW_HOOK_FILE} được gọi setRenderObjectFunction:`, errors)).toEqual([]);
+  });
 });
```
Áp vào `tests/unit/pipeline.test.js`:

```diff
diff --git a/tests/unit/pipeline.test.js b/tests/unit/pipeline.test.js
index fc719d2..7637bed 100644
--- a/tests/unit/pipeline.test.js
+++ b/tests/unit/pipeline.test.js
@@ -1,10 +1,11 @@
-// tests/unit/pipeline.test.js — nối post của các lớp (build → renderOutput → display), MRT, tap, view Normal lười; không cần GPU.
+// tests/unit/pipeline.test.js — nối post của các lớp (build → renderOutput → display), MRT, tap, view Normal lười, scene pass đứng đầu lượt cuối; không cần GPU.
 import { describe, it, expect, vi } from 'vitest';
 import {
   NoToneMapping, MaterialBlending, SRGBColorSpace, Scene, PerspectiveCamera, Vector4,
 } from 'three/webgpu';
-import { uniform } from 'three/tsl';
+import { rtt, uniform } from 'three/tsl';
 import { buildFinalNode, createPipeline } from '../../src/engine/gpu/pipeline.js';
+import { buildFinalPass } from '../helpers/final-pass.js';
 
 // three r186: vec4(a, b) trả về VarNode "intent" bọc một JoinNode. Bóc lớp vỏ để xem các thành phần.
 const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);
@@ -128,7 +129,8 @@ describe('createPipeline (dựng đồ thị, không cần GPU)', () => {
     // tô màu tuyến tính → sRGB hai lần. Test này canh trực tiếp cờ đó, không chỉ hình dạng đồ thị.
     expect(p.renderPipeline.outputColorTransform).toBe(false);
 
-    const join = unwrap(p.renderPipeline.outputNode);
+    // outputNode là Fn của views.js (scene pass đứng đầu): dựng như three dựng lượt cuối để lấy vec4(rgb, 1) mà nó trả.
+    const join = unwrap(buildFinalPass(p.renderPipeline.outputNode).stack.outputNode);
     expect(join.nodeType).toBe('vec4');
     expect(join.nodes[1].value).toBe(1);
     const ro = join.nodes[0].node;
@@ -139,6 +141,26 @@ describe('createPipeline (dựng đồ thị, không cần GPU)', () => {
     p.dispose();
   });
 
+  it('lượt cuối: scene pass chạy updateBefore ĐẦU TIÊN, cả khi display vẽ ra RTT (như FXAA) và overlay đọc texture của scene pass', () => {
+    // display như Phủ bóng: fxaa(node) vẽ chuỗi phía trước ra một RTT (Phụ lục A.42). three gọi updateBefore theo thứ tự node dựng
+    // xong (con trước cha): không có Fn của views.js thì RTT chạy trước, gỡ móc lần vẽ rồi vẽ scene pass từ bên trong nó (A.53).
+    let rttNode = null;
+    const display = ({ color }) => {
+      rttNode = rtt(color);
+      return rttNode;
+    };
+    const p = createPipeline({
+      renderer: fakeRenderer, scene: new Scene(), camera: new PerspectiveCamera(),
+      layers: [{ id: 'phu-bong', layer: { post: { display }, dispose() {} } }], weight: () => uniform(1),
+    });
+    const order = () => buildFinalPass(p.renderPipeline.outputNode).updateBefore
+      .map((n) => (n === p.scenePass ? 'scenePass' : n === rttNode ? 'rtt' : n.constructor.name));
+    expect(order()).toEqual(['scenePass', 'rtt']);
+    p.views.setOverlays([{ id: 'kinh', fn: (final, view) => final.add(view('emissive')) }]);
+    expect(order()).toEqual(['scenePass', 'rtt']);
+    p.dispose();
+  });
+
   it('requireView("normal") (GĐ 4): MRT thêm kênh normal (emissive vẫn blend theo material), ghép lại overlay trên chuỗi post CŨ, biên dịch trước', async () => {
     const calls = [];
     const layer = recordingLayer('phu-bong', calls, { build: true, display: true });
```
Áp vào `tests/unit/views.test.js`:

```diff
diff --git a/tests/unit/views.test.js b/tests/unit/views.test.js
index 15a8ab3..8991452 100644
--- a/tests/unit/views.test.js
+++ b/tests/unit/views.test.js
@@ -4,9 +4,15 @@ import { NoToneMapping, PerspectiveCamera, Scene, Vector4 } from 'three/webgpu';
 import { pass, uniform } from 'three/tsl';
 import { BUILTIN_VIEWS, createViews } from '../../src/engine/gpu/views.js';
 import { makeMRT } from '../../src/engine/gpu/pipeline.js';
+import { buildFinalPass } from '../helpers/final-pass.js';
 
 const marker = () => uniform(new Vector4());
 const unwrap = (node) => (node.isVarNode && node.intent ? node.node : node);
+/** Ảnh cuối đã ghép là một Fn: thân của nó (dựng như three dựng lượt cuối) mở đầu bằng scenePass.toVar(), trả vec4(rgb, 1). */
+const composed = (outputNode) => {
+  const { stack } = buildFinalPass(outputNode);
+  return { first: stack.nodes[0], join: unwrap(stack.outputNode) };
+};
 
 function setup({ taps = [] } = {}) {
   const scenePass = pass(new Scene(), new PerspectiveCamera());
@@ -80,8 +86,8 @@ describe('createViews', () => {
     expect([ready(), setMRT.mock.calls.length, compile.mock.calls.length]).toEqual([true, 1, 2]);
   });
 
-  it('setOverlays: ảnh cuối → overlay theo thứ tự → vec4(rgb, 1); pipeline dựng lại đồ thị', () => {
-    const { views, final, renderPipeline } = setup();
+  it('setOverlays: ảnh cuối → overlay theo thứ tự → vec4(rgb, 1), scene pass đứng đầu; pipeline dựng lại đồ thị', () => {
+    const { views, final, renderPipeline, scenePass } = setup();
     const a = marker();
     const b = marker();
     const order = [];
@@ -90,7 +96,9 @@ describe('createViews', () => {
       { id: 'hai', fn: (c) => { order.push(['hai', c]); return b; } },
     ]);
     expect(order).toEqual([['mot', final, true], ['hai', a]]);
-    const join = unwrap(renderPipeline.outputNode);
+    const { first, join } = composed(renderPipeline.outputNode);
+    expect(first.isVarNode).toBe(true);
+    expect(first.node).toBe(scenePass); // scene pass dựng trước mọi thứ của lượt cuối (Phụ lục A.53)
     expect(join.nodes[0].node).toBe(b);
     expect(join.nodes[1].value).toBe(1);
     expect(renderPipeline.needsUpdate).toBe(true);
@@ -105,7 +113,7 @@ describe('createViews', () => {
       { id: 'tot', fn: () => ok },
     ]);
     expect(broken).toEqual(['hong']);
-    expect(unwrap(renderPipeline.outputNode).nodes[0].node).toBe(ok);
+    expect(composed(renderPipeline.outputNode).join.nodes[0].node).toBe(ok);
     expect(warn.mock.calls[0][0]).toBe('Công cụ "hong" ghép overlay không được, bỏ công cụ này:');
     warn.mockRestore();
   });
```
Áp vào `tests/unit/scene.test.js`:

```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 26d3468..5672731 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -1,4 +1,4 @@
-// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze, chữ đi theo vật.
+// tests/unit/scene.test.js — dựng một cảnh trên sân khấu giả (không GPU): mức theo backend thật, vòng một khung, vẽ lại khi ?freeze, chữ đi theo vật, móc lần vẽ.
 import { describe, it, expect, vi } from 'vitest';
 import { JSDOM } from 'jsdom';
 import { BoxGeometry, Mesh, MeshStandardNodeMaterial, NoToneMapping, PerspectiveCamera, SRGBColorSpace, Scene, Vector2 } from 'three/webgpu';
@@ -22,7 +22,7 @@ const painting = {
         const material = new MeshStandardNodeMaterial();
         material.colorNode = color(ctx.palette.hex.datSet);
         material.emissiveNode = vec3(0);
-        const mesh = new Mesh(new BoxGeometry(), material);
+        const mesh = Object.assign(new Mesh(new BoxGeometry(), material), { name: 'khoi' });
         ctx.scene.add(mesh);
         shared.cot = { material };
         return { objects: [mesh], dispose: () => ctx.scene.remove(mesh) };
@@ -370,6 +370,43 @@ describe('buildScene', () => {
     expect(doc.querySelector('[data-captions]')).toBeNull();
   });
 
+  it('móc lần vẽ (GĐ 5): công cụ nhận api.draws; begin/end bọc render ở cả step() lẫn vẽ lại khung đứng yên; disposer gỡ móc', async () => {
+    let api = null;
+    const soi = { id: 'soi', mount: (a) => ((api = a), { dispose() {} }) };
+    const content = { layers: { cot: { objects: { khoi: 'Khối đất' } } } };
+    const { stage, scene, disposer, flush } = build({ tools: [soi], content });
+    // Renderer giả có hàm vẽ như three: setRenderObjectFunction ghi lại hàm; mỗi render() của pipeline vẽ các vật của cảnh bằng
+    // camera chính qua hàm vẽ hiện tại (_renderObjects), mỗi lần vẽ một draw call.
+    const r = stage.renderer;
+    let fn = null;
+    r.setRenderObjectFunction.mockImplementation((f) => {
+      fn = f;
+    });
+    r.getRenderObjectFunction.mockImplementation(() => fn);
+    r.renderObject.mockImplementation(() => {
+      r.info.render.drawCalls += 1;
+    });
+    r.render.mockImplementation(() => {
+      for (const o of stage.scene.children.filter((c) => c.isMesh)) {
+        (fn ?? r.renderObject).call(r, o, stage.scene, stage.camera, o.geometry, o.material, null, null, null, null);
+      }
+    });
+    api.draws.start();
+    expect(fn).not.toBeNull();
+    scene.step(1000);
+    // Tên lớp từ meta, nhãn vật từ content.layers[id].objects: scene.js đưa cả hai cho móc.
+    expect(api.draws.list().map((d) => [d.layerId, d.layer, d.label])).toEqual([['cot', 'Cốt', 'Khối đất']]);
+    // Đứng yên ở ?freeze: Từng sợi đổi sợi rồi gọi api.redraw(); khung N vẽ lại cũng được ghi (vật mới không thuộc lớp nào).
+    scene.freeze();
+    stage.scene.add(new Mesh(new BoxGeometry(), new MeshStandardNodeMaterial()));
+    const done = api.redraw();
+    flush();
+    await done;
+    expect(api.draws.list().map((d) => d.layerId)).toEqual(['cot', null]);
+    disposer.closeAll();
+    expect(fn).toBeNull(); // gỡ cảnh thì trả hàm vẽ cũ, kể cả khi công cụ không tự stop()
+  });
+
   it('ms CPU của khung đi vào số đo của bàn thợ', () => {
     const { scene } = build();
     scene.step(1000);
```
Áp vào `tests/unit/toolbox.test.js`:

```diff
diff --git a/tests/unit/toolbox.test.js b/tests/unit/toolbox.test.js
index 1dc5a77..eec24e6 100644
--- a/tests/unit/toolbox.test.js
+++ b/tests/unit/toolbox.test.js
@@ -1,5 +1,5 @@
 // @vitest-environment jsdom
-// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ.
+// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, móc lần vẽ, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ.
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { createToolbox } from '../../src/engine/gpu/toolbox.js';
 
@@ -75,6 +75,33 @@ describe('createToolbox', () => {
     expect(toolbox.list()).toEqual([{ id: 'kinh', on: false }, { id: 'lot', on: false }]);
   });
 
+  it('api.draws (GĐ 5): mount nhận đúng móc lần vẽ của cảnh, chỉ năm hàm (không có begin/end); không có móc thì api.draws là null', () => {
+    // Móc như scene.js giữ (draws.js): năm hàm của DrawProbe, cộng begin/end mà scene.js gọi quanh mỗi pipeline.render().
+    const list = [];
+    const counts = { scene: 3, reflection: 2, other: 24 };
+    const draws = {
+      start: vi.fn(), stop: vi.fn(), list: vi.fn(() => list), limit: vi.fn(), counts: vi.fn(() => counts), begin: vi.fn(), end: vi.fn(),
+    };
+    const soi = fakeTool('soi');
+    createToolbox({ tools: [soi], views: fakeViews(), doc: document, t, content, draws });
+    const probe = soi.api.draws;
+    // Công cụ không bao giờ tự mở hay đóng một khung ghi, và không thay được hàm nào của móc.
+    expect(Object.keys(probe).sort()).toEqual(['counts', 'limit', 'list', 'start', 'stop']);
+    expect(Object.isFrozen(probe)).toBe(true);
+    probe.start();
+    probe.limit(2);
+    expect(probe.list()).toBe(list);
+    expect(probe.counts()).toBe(counts);
+    probe.stop();
+    expect([draws.start, draws.stop, draws.list, draws.counts].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
+    expect(draws.limit.mock.calls).toEqual([[2]]);
+    expect(draws.begin).not.toHaveBeenCalled();
+    expect(draws.end).not.toHaveBeenCalled();
+    const kinh = fakeTool('kinh');
+    createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content });
+    expect(kinh.api.draws).toBeNull();
+  });
+
   it('chữ của bức tải hỏng (content = null): nhãn tap rơi về id của tap, công cụ vẫn gắn và dùng được', () => {
     const kinh = fakeTool('kinh');
     const toolbox = createToolbox({ tools: [kinh], views: fakeViews(), doc: document, t, content: null });
```

Run: `npx vitest run tests/unit/draws.test.js tests/rules/files.test.js tests/unit/pipeline.test.js tests/unit/views.test.js tests/unit/scene.test.js tests/unit/toolbox.test.js`
Kết quả mong đợi: FAIL, 7 test hỏng; lỗi đầu tiên: `Error: Cannot find module '../../src/engine/gpu/draws.js' imported from tests/unit/draws.test.js`.

- [ ] **Step 2: Code**

Tạo `src/engine/gpu/draws.js`:

```js
// engine/gpu/draws.js — móc lần vẽ cho Từng sợi: đặt renderer.setRenderObjectFunction chỉ khi công cụ bật, ghi lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu.

/** list() khi chưa có khung nào được ghi: đông cứng như list của một khung đã ghi. */
const NONE = Object.freeze([]);

/** Loại vật như Từng sợi ghi (DrawInfo.kind). */
const kindOf = (o) => (o.isInstancedMesh ? 'InstancedMesh' : o.isSprite ? 'Sprite' : o.isPoints ? 'Points' : o.isLine ? 'Line' : 'Mesh');

/**
 * Số bản của một lần vẽ, như three tính (RenderObject.getDrawParameters): instanceCount của InstancedBufferGeometry, không thì
 * object.count. Ở r186 Mesh, InstancedMesh và Sprite đều có count (Mesh mặc định 1); Points, Line không có: một bản.
 */
const instancesOf = (object, geometry) => (geometry?.isInstancedBufferGeometry ? geometry.instanceCount : Math.max(0, object.count ?? 1));

/**
 * Số tam giác, như three đếm đỉnh của lần vẽ (RenderObject.getDrawParameters): khúc drawRange của hình, cắt theo nhóm (group: Mesh
 * nhiều material vẽ mỗi nhóm một lần) và theo số chỉ số (hay số đỉnh, khi không có index); / 3 × số bản. Sprite là một quad;
 * Points, Line không vẽ tam giác.
 */
function trianglesOf(object, geometry, group, instances) {
  if (object.isSprite) return 2 * instances;
  if (object.isPoints || object.isLine) return 0;
  const range = geometry?.drawRange ?? { start: 0, count: Infinity };
  const first = Math.max(range.start, group?.start ?? 0, 0);
  const last = Math.min(range.start + range.count, group ? group.start + group.count : Infinity);
  const items = geometry?.index ? geometry.index.count : (geometry?.attributes?.position?.count ?? 0);
  return Math.floor(Math.max(0, Math.min(last, items) - first) / 3) * instances;
}

/**
 * Móc lần vẽ (spec §7 Từng sợi, Phụ lục A.53). Trong mỗi render(), three gọi hàm vẽ hiện tại cho từng mục của render list theo
 * đúng thứ tự đã sắp (đục trước, trong suốt sau): renderObject gốc, hay hàm đặt bằng setRenderObjectFunction. Giữa start() và
 * stop(), móc đứng vào chỗ đó, rồi gọi tiếp hàm vẽ trước nó cho lần vẽ được phép:
 * - lần vẽ của CAMERA CHÍNH (lượt vẽ cảnh) được ghi lại, và bị bỏ qua nếu không nằm trong k lần đầu của limit(k). Không gọi hàm
 *   vẽ là vật không được vẽ và renderer.info không đếm nó. Móc không đụng visible hay thứ gì trong cache key: không biên dịch lại;
 * - lần vẽ của camera khác LỒNG trong lần vẽ của một vật là phản chiếu: reflector vẽ lại cảnh bằng camera ảo ngay lúc vẽ mặt soi;
 * - lần vẽ của camera khác ở ngoài cùng là hậu kỳ: RenderPipeline vẽ quad cuối mà không gỡ móc, và scene pass lại được vẽ từ BÊN
 *   TRONG lần vẽ quad ấy (updateBefore của node). Quad không phải phản chiếu: nó vào "các lượt khác".
 * Bóng đổ, bloom và RTT tự cất móc rồi trả lại (ShadowNode, resetRendererState), nên móc không thấy lần vẽ của chúng. Cũng vì
 * vậy, scene pass nào lần đầu được vẽ từ bên trong một RTT thì móc không thấy lượt vẽ cảnh: views.js (compose) đặt scene pass
 * đứng đầu lượt cuối, trước RTT của FXAA. Mọi thứ móc không thấy nằm trong "các lượt khác" = draw call của cả khung
 * (renderer.info) trừ cảnh và phản chiếu.
 *
 * scene.js bọc mỗi pipeline.render() bằng begin()/end(); công cụ không có hai hàm này (toolbox.js chỉ đưa năm hàm của DrawProbe).
 * Khung vẽ đủ (không limit) thì được ghi; đang limit thì list() đứng yên, để thanh của Từng sợi không nhảy khi người xem đang dừng
 * ở một sợi. limit(k) so theo vật + material + lượt (khóa object.id:material.id:passId, không theo thứ tự): camera dời làm three
 * sắp lại vật đục theo độ sâu, mà sợi đang xem vẫn là những vật ấy.
 *
 * Chỗ DrawInfo chưa khớp three:
 * - móc ghi cả lần vẽ mà three rồi tự bỏ bên trong renderObject (count 0, pipeline chưa biên dịch xong), nên scene có thể lớn hơn
 *   số lần vẽ thật và other dừng ở 0;
 * - vật wireframe vẽ đoạn thẳng mà vẫn báo số tam giác của hình (Bức 1 gặp chỗ này khi người xem bật núm wireframe của Cốt);
 * - hai nhóm của một Mesh dùng chung một material thì chung một khóa: limit(k) giữ hay bỏ cả hai (Bức 1 không có Mesh nhiều material);
 * - vật trong suốt DoubleSide (forceSinglePass false, không có transmission; Bức 1 không có material như thế): renderObject của three
 *   tự vẽ hai lần ('backSide' rồi mặt trước) ngay trong MỘT lần gọi móc, nên đó là một sợi cho hai draw call (lần thừa vào other),
 *   và limit(k) giữ hay bỏ cả hai. Vật có transmission thì khác: three vẽ hai lượt, mỗi lượt một lần gọi móc (passId, ở dưới).
 *
 * @param {object} p
 * @param {any} p.renderer       WebGPURenderer
 * @param {any} p.camera         camera chính (camera của scene pass)
 * @param {{ id: string, layer: { objects?: any[] } }[]} p.layers   lớp đã dựng; objects là mảng SỐNG (thí nghiệm thêm, bớt vật)
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta   tên lớp: meta.layers[i].name
 * @param {import('../contracts/painting.js').PaintingContent | null} [p.content]   nhãn vật: content.layers[id].objects[name]
 * @returns {import('../contracts/runtime.js').DrawProbe & { begin: () => void, end: () => void }}
 */
export function createDrawProbe({ renderer, camera, layers, meta, content = null }) {
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  // Chữ của bức tải hỏng (content null) thì không vật nào có nhãn: Từng sợi dùng tên vật.
  const labelOf = (layerId, name) => content?.layers?.[layerId]?.objects?.[name];
  let started = false;
  let prev = null; // hàm vẽ lúc gắn móc: null (renderObject của three) hay hàm ai đó đã đặt trước
  let allowed = null; // limit(k): khóa của k lần vẽ đầu; null = vẽ đủ
  let recording = false; // khung đang vẽ có được ghi không: chỉ khung vẽ đủ, giữa begin() và end()
  let records = [];
  let reflection = 0;
  let callsAtBegin = 0;
  let current = null; // lần vẽ của camera chính đang chạy: lần vẽ lồng bên trong cộng vào nested của nó
  let last = null; // khung vẽ đủ gần nhất: { draws, keys, counts }

  /** Vật → id lớp, dựng lại ở mỗi khung được ghi từ các mảng objects SỐNG. */
  const ownerMap = () => {
    const owners = new Map();
    for (const { id, layer } of layers) for (const o of layer.objects ?? []) owners.set(o, id);
    return owners;
  };

  /** Một mục của list(). Chủ của vật là chính nó, hay tổ tiên gần nhất nằm trong layer.objects (con của một Group). */
  const toInfo = ({ object, geometry, material, group, nested }, owners) => {
    let owner = object;
    while (owner && !owners.has(owner)) owner = owner.parent;
    const layerId = owner ? owners.get(owner) : null;
    const name = owner?.name || object.name || null;
    const kind = kindOf(object);
    const instances = instancesOf(object, geometry);
    return Object.freeze({
      layerId,
      layer: layerId === null ? null : (names.get(layerId) ?? null),
      name,
      label: (layerId !== null && name !== null ? labelOf(layerId, name) : undefined) ?? name ?? kind,
      kind,
      instances,
      triangles: trianglesOf(object, geometry, group, instances),
      material: material.type,
      nested,
    });
  };

  /** Hàm vẽ thay chỗ của three (cùng tham số với renderer.renderObject). */
  function hook(object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId) {
    const draw = () => (prev ?? renderer.renderObject).call(renderer, object, scene, cam, geometry, material, group, lightsNode, clippingContext, passId);
    if (cam !== camera) {
      if (current) {
        reflection += 1;
        current.nested += 1;
      }
      draw();
      return;
    }
    // passId: three vẽ vật trong suốt có transmission hai lượt ('backSide' rồi mặt trước), mỗi lượt là một sợi.
    const key = `${object.id}:${material.id}:${passId ?? ''}`;
    if (allowed && !allowed.has(key)) return;
    if (!recording) {
      draw();
      return;
    }
    const record = { object, geometry, material, group, key, nested: 0 };
    records.push(record);
    const outer = current;
    current = record;
    try {
      draw();
    } finally {
      current = outer; // lỗi đi tiếp lên render() như mọi lỗi trong khung
    }
  }

  return {
    /** Gắn móc (công cụ bật). Phiên mới: chưa có list, không limit; khung vẽ kế tiếp được ghi. Gọi hai lần vẫn an toàn. */
    start() {
      if (started) return;
      started = true;
      allowed = null;
      last = null;
      prev = renderer.getRenderObjectFunction();
      renderer.setRenderObjectFunction(hook);
    },
    /** Gỡ móc, trả hàm vẽ trước đó (kể cả khi công cụ bị gỡ vì lỗi), bỏ limit: vẽ đủ như chưa có gì. Gọi hai lần vẫn an toàn. */
    stop() {
      if (!started) return;
      started = false;
      allowed = null;
      recording = false;
      current = null;
      renderer.setRenderObjectFunction(prev);
      prev = null;
    },
    /** scene.js gọi ngay trước pipeline.render(). */
    begin() {
      if (!started) return;
      recording = allowed === null;
      records = [];
      reflection = 0;
      current = null;
      callsAtBegin = renderer.info.render.drawCalls;
    },
    /** scene.js gọi ngay sau pipeline.render(). render() ném lỗi thì không tới đây: list() giữ khung đủ trước đó. */
    end() {
      if (!started || !recording) return;
      recording = false;
      const owners = ownerMap();
      const scene = records.length;
      const total = renderer.info.render.drawCalls - callsAtBegin;
      last = {
        draws: Object.freeze(records.map((r) => toInfo(r, owners))),
        keys: records.map((r) => r.key),
        counts: { scene, reflection, other: Math.max(0, total - scene - reflection) },
      };
      records = [];
    },
    list: () => last?.draws ?? NONE,
    limit(k) {
      if (k !== null && !(Number.isInteger(k) && k >= 0)) {
        throw new Error(`draws.limit(k): k phải là số nguyên ≥ 0 hoặc null, nhận ${String(k)} (${typeof k})`);
      }
      const keys = last?.keys ?? [];
      allowed = k === null || k >= keys.length ? null : new Set(keys.slice(0, k));
    },
    counts: () => ({ ...(last?.counts ?? { scene: 0, reflection: 0, other: 0 }) }),
  };
}
```
Áp vào `src/engine/gpu/views.js`:

```diff
diff --git a/src/engine/gpu/views.js b/src/engine/gpu/views.js
index 3f925ec..516eb64 100644
--- a/src/engine/gpu/views.js
+++ b/src/engine/gpu/views.js
@@ -1,6 +1,6 @@
 // engine/gpu/views.js — các view mà công cụ học nhìn được (ảnh cuối, tap của lớp, emissive, normal lười, depth), ghép overlay của công cụ, requireView.
 import { NoToneMapping } from 'three/webgpu';
-import { oneMinus, pow, renderOutput, vec3, vec4 } from 'three/tsl';
+import { Fn, oneMinus, pow, renderOutput, vec3, vec4 } from 'three/tsl';
 
 /** View của xưởng, bức nào cũng có (nhãn ở t.views). Tap của lớp có id '<layerId>:<tapId>'. */
 export const BUILTIN_VIEWS = Object.freeze(['final', 'emissive', 'normal', 'depth']);
@@ -45,7 +45,7 @@ export function createViews({ scenePass, renderPipeline, mrtFor, final, taps, co
   };
 
   /**
-   * Ảnh cuối → overlay của từng công cụ → vec4(rgb, 1), rồi báo pipeline dựng lại đồ thị. Không gọi lại build/display
+   * Ảnh cuối → overlay của từng công cụ → vec4(rgb, 1), scene pass đứng đầu, rồi báo pipeline dựng lại đồ thị. Không gọi lại build/display
    * của lớp nào: bloom và FXAA giữ nguyên. Overlay ném lỗi thì bỏ đúng công cụ đó (spec §9); trả id các công cụ bị bỏ.
    */
   const compose = () => {
@@ -60,8 +60,15 @@ export function createViews({ scenePass, renderPipeline, mrtFor, final, taps, co
       }
     }
     overlays = overlays.filter((o) => !broken.includes(o.id));
+    // Scene pass vẽ ĐẦU TIÊN trong lượt cuối (Phụ lục A.53), để móc lần vẽ của Từng sợi (draws.js) thấy lượt vẽ cảnh. three gọi
+    // updateBefore theo thứ tự node dựng xong, con trước cha; RTT của FXAA nằm sâu trong c nên tới lượt trước, mà RTT gỡ móc
+    // (resetRendererState) rồi vẽ quad của nó, và chính quad ấy vẽ scene pass lần đầu trong khung. scenePass.toVar() ở đầu Fn
+    // được dựng trước c. Không ai đọc biến này nên shader không có thêm dòng nào.
     // Alpha luôn 1: canvas có alpha, và renderOutput "bỏ nhân trước" alpha; chỗ nào alpha 0 sẽ trong suốt (luật 3).
-    renderPipeline.outputNode = vec4(c.rgb, 1);
+    renderPipeline.outputNode = Fn(() => {
+      scenePass.toVar();
+      return vec4(c.rgb, 1);
+    })();
     renderPipeline.needsUpdate = true;
     return broken;
   };
```
Áp vào `src/engine/gpu/scene.js`:

```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index 94fdf57..66b4f6f 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -1,4 +1,4 @@
-// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: chữ → ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
+// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: chữ → ctx → setup → lớp → pipeline → móc lần vẽ → thang nấc → input → bàn thợ; và hàm vẽ một khung.
 import { budgetFor, isMobile, pickLevel } from '../quality.js';
 import { FRAME_BUDGET_MS, createTuner } from '../tuner.js';
 import { createGpuTimer } from './gpu-timer.js';
@@ -10,6 +10,7 @@ import { createInput } from './input.js';
 import { createToolbox } from './toolbox.js';
 import { createDialSet } from './dial-set.js';
 import { createCaptionSet } from './caption-set.js';
+import { createDrawProbe } from './draws.js';
 import { mountCaptions } from '../../ui/captions.js';
 
 /**
@@ -77,7 +78,8 @@ function createQuality({ level, ladder, tuner, timer }) {
 
 /**
  * run.js gọi hàm này một lần khi mở trang, và thêm một lần nữa nếu người xem bấm "Dựng lại cảnh" sau khi mất GPU.
- * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (chữ → setup → lớp → pipeline → input), nên gỡ được ngược lại.
+ * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (chữ → setup → lớp → pipeline → móc lần vẽ → bộ đo GPU → đồ nghề →
+ * input), nên gỡ được ngược lại.
  * Nếu setup/createLayer ném lỗi, buildLayers đã gỡ các lớp dựng dở; lỗi đi tiếp lên run.js.
  *
  * @param {object} p
@@ -129,6 +131,9 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
   });
   const pipeline = createPipeline({ renderer: stage.renderer, scene: stage.scene, camera: stage.camera, layers, weight: ctx.weight });
   disposer.add(() => pipeline.dispose());
+  // Móc lần vẽ (GĐ 5): chỉ gắn khi Từng sợi bật (start/stop); lúc khác cảnh không tốn gì. Tên lớp ở meta, nhãn vật ở content.
+  const draws = createDrawProbe({ renderer: stage.renderer, camera: stage.camera, layers, meta, content });
+  disposer.add(() => draws.stop()); // gỡ sau hộp đồ nghề (thứ tự ngược): công cụ hỏng không tự stop() thì móc vẫn được gỡ
   // Thang nấc dựng SAU pipeline: nấc của lớp dùng chung (bloom) chạm vào node mà pipeline vừa dựng.
   const ladder = createLadder({ ladder: painting.quality?.ladder, layers, stage, dpr: budget.dpr });
   const tuner = flags.freeze ? null : createTuner({ budgetMs: mobile ? FRAME_BUDGET_MS.mobile : FRAME_BUDGET_MS.desktop });
@@ -164,7 +169,9 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
             setup?.update?.(0, t);
             for (const { layer } of layers) layer.update?.(0, t);
             captionSet.step(); // đồng hồ đứng nên chữ ở lại; camera có thể vừa bị kéo: chiếu lại
+            draws.begin(); // Từng sợi đổi sợi rồi vẽ lại: khung N đi qua móc như mọi khung
             pipeline.render();
+            draws.end();
           }
           resolve();
         } catch (err) {
@@ -176,7 +183,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
   };
 
   // Công cụ học (GĐ 4): gắn vào pipeline, overlay ghép MỘT lần; mỗi lúc một công cụ (toolbox.js).
-  const toolbox = createToolbox({ tools, views: pipeline.views, doc: win.document, t, content, redraw });
+  const toolbox = createToolbox({ tools, views: pipeline.views, doc: win.document, t, content, redraw, draws });
   disposer.add(() => toolbox.dispose());
 
   // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học nhận trước bức.
@@ -225,7 +232,9 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
       stage.breathe(t);
       stage.controls?.update();
       captionSet.step(); // chữ đi theo điểm neo, theo camera của chính khung này
+      draws.begin(); // móc (khi Từng sợi bật) ghi lần vẽ của đúng khung này
       pipeline.render();
+      draws.end();
       timer.poll(ms ?? start); // hỏi ms GPU của các khung trước, không chờ
       const end = win.performance.now();
       studio.measure(stage.renderer.info, end, end - start); // ms CPU: luồng chính bận bao lâu cho khung này
```
Áp vào `src/engine/gpu/toolbox.js`:

```diff
diff --git a/src/engine/gpu/toolbox.js b/src/engine/gpu/toolbox.js
index 58da30a..f9d4a5c 100644
--- a/src/engine/gpu/toolbox.js
+++ b/src/engine/gpu/toolbox.js
@@ -6,7 +6,9 @@ import { h } from '../../ui/dom.js';
  * - gắn từng công cụ (`mount(api)`), cho nó một ô trong thanh công cụ ([data-toolbar]) để dựng thanh điều khiển;
  * - ghép overlay của mọi công cụ lên ảnh cuối MỘT lần; công cụ nào gắn hay ghép hỏng thì bỏ nó, cảnh vẫn chạy (spec §9);
  * - bật MỘT công cụ mỗi lúc: bật cái này thì cái kia tắt; body[data-tool] cho CSS (điện thoại: Sổ tay thu lại);
- * - cử chỉ tới công cụ đang bật TRƯỚC bức; công cụ trả true thì cử chỉ dừng ở đó.
+ * - cử chỉ tới công cụ đang bật TRƯỚC bức; công cụ trả true thì cử chỉ dừng ở đó;
+ * - (GĐ 5) đưa móc lần vẽ của cảnh (draws.js) cho công cụ qua api.draws, chỉ năm hàm của DrawProbe: công cụ tự start() khi
+ *   bật, stop() khi tắt.
  * Bức không biết có công cụ nào: nó chỉ nhận những cử chỉ không công cụ nào dùng.
  *
  * @param {object} p
@@ -16,13 +18,24 @@ import { h } from '../../ui/dom.js';
  * @param {Record<string, any>} [p.t]        chữ giao diện: nhãn view ở t.views
  * @param {object | null} [p.content]        chữ của bức: nhãn tap ở content.layers[layerId].taps[tapId]
  * @param {() => Promise<void>} [p.redraw]   vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
+ * @param {import('../contracts/runtime.js').DrawProbe | null} [p.draws]   móc lần vẽ của cảnh (Từng sợi): móc mà scene.js giữ, có
+ *                                           cả begin()/end(); công cụ chỉ nhận năm hàm của DrawProbe. null: công cụ không có móc
  */
-export function createToolbox({ tools, views, doc, t = {}, content = null, redraw = async () => {} }) {
+export function createToolbox({ tools, views, doc, t = {}, content = null, redraw = async () => {}, draws = null }) {
   const mounted = []; // { id, instance, slot }
   const bar = tools.length > 0 ? h(doc, 'div', { class: 'toolbar', 'data-toolbar': '', hidden: true }) : null;
   // Chữ của bức tải hỏng (mạng chập chờn) thì nhãn của tap rơi về id của nó: công cụ vẫn dùng được.
   const labelOf = (v) => t.views?.[v.id] ?? content?.layers?.[v.layerId]?.taps?.[v.tapId] ?? v.tapId ?? v.id;
   const viewInfos = () => views.list().map((v) => ({ id: v.id, label: labelOf(v), ready: v.ready }));
+  // Công cụ thấy móc như bức thấy ctx.captions (captionSet.api): chỉ phần dành cho nó. begin()/end() là của scene.js, bọc mỗi
+  // pipeline.render(), nên công cụ không bao giờ tự mở hay đóng một khung ghi; object đông cứng: không thay được hàm nào của móc.
+  const probe = draws && Object.freeze({
+    start: () => draws.start(),
+    stop: () => draws.stop(),
+    list: () => draws.list(),
+    limit: (k) => draws.limit(k),
+    counts: () => draws.counts(),
+  });
   let active = null;
 
   const remove = (id) => {
@@ -40,7 +53,7 @@ export function createToolbox({ tools, views, doc, t = {}, content = null, redra
   for (const tool of tools) {
     const slot = h(doc, 'div', { class: 'tool', 'data-tool-slot': tool.id, hidden: true });
     try {
-      const instance = tool.mount({ views: viewInfos, requireView: (id) => views.require(id), el: slot, t, redraw });
+      const instance = tool.mount({ views: viewInfos, requireView: (id) => views.require(id), el: slot, t, redraw, draws: probe });
       mounted.push({ id: tool.id, instance, slot });
       bar.append(slot);
     } catch (err) {
```
Áp vào `src/engine/contracts/runtime.js`:

```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index 0788f98..e0d9583 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -125,12 +125,33 @@
  * @property {HTMLElement} el                      ô của công cụ trong thanh công cụ; công cụ dựng thanh điều khiển ở đây
  * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
  * @property {() => Promise<void>} redraw          vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
+ * @property {DrawProbe | null} [draws]            [5] lần vẽ của lượt vẽ cảnh (Từng sợi): engine/gpu/draws.js. Chỉ năm hàm của
+ *                                                 DrawProbe: begin()/end() ở lại scene.js, công cụ không tự mở hay đóng khung ghi.
+ *                                                 null khi hộp đồ nghề được dựng không có móc: công cụ cần móc thì kiểm trước khi dùng
  */
 /** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
+/** [5] Móc lần vẽ (renderer.setRenderObjectFunction), phần công cụ thấy (ToolApi.draws). Chỉ gắn giữa start() và stop(); lúc khác
+ * cảnh không tốn thêm gì. Móc mà scene.js giữ (createDrawProbe) còn có begin()/end(), gọi quanh mỗi pipeline.render().
+ * @typedef {Object} DrawProbe
+ * @property {() => void} start                 gắn móc (công cụ bật); khung kế tiếp được ghi lại
+ * @property {() => void} stop                  gỡ móc, trả hàm vẽ trước đó; vẽ đủ như chưa có gì
+ * @property {() => DrawInfo[]} list            lần vẽ của camera chính ở khung vẽ đủ gần nhất, theo thứ tự GPU nhận
+ * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material + lượt: khóa
+ *                                              object.id:material.id:passId); null = vẽ đủ.
+ *                                              k là số nguyên ≥ 0 (giá trị khác thì ném lỗi); đang limit thì list() đứng yên
+ * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt.
+ *                                              reflection: lần vẽ của camera khác LỒNG trong lần vẽ một vật (phản chiếu);
+ *                                              other: phần còn lại của renderer.info (bóng, bloom, quad của hậu kỳ)
+ */
+/** @typedef {{ layerId: string | null, layer: string | null, name: string | null, label: string, kind: string,
+ *   instances: number, triangles: number, material: string, nested: number }} DrawInfo
+ *   layer: tên lớp (meta) · label: nhãn vật trong content (thiếu thì name, rồi kind) · nested: lần vẽ lồng bên trong (phản chiếu) */
 /** @typedef {Object} ToolInstance
  * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép sau display khi dựng pipeline; ghép LẠI khi
  *                                 requireView đổi MRT, nên chỉ dựng node, không giữ trạng thái; đổi chế độ = đổi uniform
- * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức
+ * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức. [5] Giữ 'tap' thì giữ cả 'double-tap'
+ *                                 (kính tròn của Kính mài giữ cả hai; hình gạt không giữ cử chỉ nào): không thì bức nhận
+ *                                 'double-tap' mà không có hai 'tap' làm nên nó
  * @property {(on: boolean) => void} [activate]     bật/tắt: đổi uniform, hiện/giấu thanh điều khiển
  * @property {() => void} dispose
  */
```

Run: `npx vitest run tests/unit/draws.test.js tests/rules/files.test.js tests/unit/pipeline.test.js tests/unit/views.test.js tests/unit/scene.test.js tests/unit/toolbox.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Spec**

Spec ghi lại đúng điều móc làm: chỉ lần vẽ LỒNG mới là phản chiếu; scene pass phải chạy đầu tiên trong lượt cuối; `limit` kiểm số nguyên.

Áp vào `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:

```diff
diff --git a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
index 17ef397..171075e 100644
--- a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
+++ b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
@@ -680,18 +680,23 @@ Dệt lại khung hình từng sợi một. Mỗi sợi là một lần vẽ (dr
 cho thấy các bước SAU lượt vẽ cảnh (bloom, tone); Từng sợi cho thấy chính lượt vẽ cảnh được làm ra thế nào.
 - **Chặn lần vẽ** (`engine/gpu/draws.js`): khi công cụ bật, xưởng gắn `renderer.setRenderObjectFunction(móc)`; khi tắt thì gỡ, nên
   lúc không dùng cảnh không tốn thêm gì.
-  - Móc nhận mọi lần vẽ của `renderer.render()`. Bóng đổ, bloom và FXAA tự cất rồi trả lại móc; phản chiếu vẽ bằng camera ảo của
-    reflector (Phụ lục A.53). Móc chỉ chặn lần vẽ của **camera chính**; lần vẽ của camera khác được đếm riêng là "phản chiếu".
+  - Móc nhận mọi lần vẽ của `renderer.render()`. Bóng đổ, bloom và RTT của FXAA tự cất rồi trả lại móc; phản chiếu vẽ bằng camera ảo
+    của reflector (Phụ lục A.53). Móc chỉ chặn lần vẽ của **camera chính**. Lần vẽ của camera khác **lồng** trong lần vẽ một vật được
+    đếm riêng là "phản chiếu". Lần vẽ của camera khác ở ngoài cùng (quad của hậu kỳ) nằm trong "các lượt khác".
+  - Scene pass phải vẽ **đầu tiên** trong lượt cuối. RTT của FXAA gỡ móc trong lượt của nó: scene pass vẽ lần đầu từ bên trong RTT
+    thì móc không thấy lượt vẽ cảnh. `views.js` bọc ảnh cuối bằng một `Fn` mở đầu bằng `scenePass.toVar()` (Phụ lục A.53).
   - Lần vẽ được phép thì móc gọi hàm vẽ trước đó (hàm `renderObject` của three, hay hàm mà ai đó đã đặt trước). Lần vẽ không được phép
     thì bỏ qua. Không đụng vào `visible` hay thứ gì trong cache key, nên không biên dịch lại.
   - **Ghi danh sách** của một khung vẽ đủ. Mỗi mục gồm: vật (và lớp của nó: vật nằm trong `layer.objects`, hay là con của một vật như
     thế), nhãn, loại (`Mesh`, `InstancedMesh`, `Sprite`…), số bản (`count`), số tam giác, loại material, và số lần vẽ lồng bên trong.
-    Mặt nước kéo theo cả lượt phản chiếu, vì reflector vẽ lại cảnh ngay trước khi nước được vẽ.
+    Mặt nước kéo theo cả lượt phản chiếu, vì reflector vẽ lại cảnh ngay trước khi nước được vẽ. Mesh nhiều material vẽ mỗi nhóm một
+    lần, và vật trong suốt có transmission vẽ hai lượt: mỗi lần là một sợi.
   - **`limit(k)`:** chỉ vẽ k lần đầu của danh sách đã ghi (so theo vật và material), bỏ qua phần còn lại. `limit(null)` vẽ đủ và ghi
-    lại danh sách ở mỗi khung.
+    lại danh sách ở mỗi khung. k là số nguyên ≥ 0, giá trị khác thì ném lỗi. Đang limit thì danh sách đứng yên (không ghi lại), để
+    thanh không nhảy khi người xem dừng ở một sợi.
 - **Thanh điều khiển** (trong thanh công cụ, như Lột lớp):
   - Một `input type="range"` từ 0 tới N (N là số lần vẽ của lượt vẽ cảnh). Mở công cụ thì thanh ở N: ảnh không đổi gì. Nấc 0 là
-    chưa vẽ gì: chỉ còn màu nền xóa khung, vẫn qua hậu kỳ.
+    chưa vẽ gì: chỉ còn màu nền xóa khung (màu xóa của sân khấu, đen then), vẫn qua hậu kỳ.
   - Nút "Dệt lại" (`aria-pressed`) chạy từ 0 tới N, mỗi sợi khoảng 0,6 giây; cả lượt không quá chừng 12 giây, nên nhiều sợi thì đi
     nhanh hơn. Bấm lại thì dừng; kéo thanh cũng dừng.
   - Dòng mô tả sợi đang xem: nhãn vật (`content.layers[id].objects[name]`; thiếu thì dùng tên vật), tên lớp, loại, số bản, số tam
@@ -794,7 +799,7 @@ son-mai-anh-sang/
         stage.js                     [0→4] renderer, nền đặc, camera + OrbitControls theo CameraSpec, đồng hồ, resize, DPR, lỗi GPU; GĐ 4: trackTimestamp
         disposer.js                  [0] đăng ký mọi thứ đã tạo, gỡ theo thứ tự ngược
         pipeline.js                  [0→4] scene pass + MRT; build → renderOutput → display; alpha 1; views(); overlay
-        views.js                     [4] danh sách view (kênh, tap, Normal lười), ghép overlay của công cụ, requireView
+        views.js                     [4→5] danh sách view (kênh, tap, Normal lười), ghép overlay của công cụ, requireView; GĐ 5: scene pass đứng đầu lượt cuối (móc lần vẽ thấy lượt vẽ cảnh)
         gpu-timer.js                 [4] ms GPU mỗi khung: resolveTimestampsAsync (render + compute), không chờ, không gọi chồng
         meter.js                     [4] số đo của bàn thợ: draw call, tam giác, ms, ms CPU, ms GPU; hai bên "Tắt / Bật" của compare
         toolbox.js                   [4→5] hộp đồ nghề: gắn công cụ, cử chỉ tới công cụ trước bức, mỗi lúc một công cụ, body[data-tool]; GĐ 5: ToolApi.draws
@@ -863,12 +868,13 @@ son-mai-anh-sang/
                                      [4] tuner gpu-timer lut views toolbox kinh-mai lot-lop dial-set dials rail-tools poster
                                      [5] gesture (double-tap) captions caption-set draws tung-soi moon-progress anh-trang-drift
     rules/imports.test.js            [0] luật ranh giới, đường nhẹ, hàng rào từ vựng
-    rules/files.test.js              [0] dòng 1 là chú thích, số dòng, API cấm
+    rules/files.test.js              [0→5] dòng 1 là chú thích, số dòng, API cấm; GĐ 5: chỉ draws.js đặt móc lần vẽ
     paintings/contract.test.js       [0→5] lặp qua registry (+ _mau từ GĐ 2); GĐ 4: mức cùng bộ khóa, Dial, nhãn tap, poster/og; GĐ 5: captions, tên vật + nhãn
     helpers/source.js                [0] phân tích mã bằng parseSync của vite
     helpers/fake-ctx.js              [1→5] Scene/Camera/uniform thật, renderer giả (Proxy ghi lời gọi); dựng ctx bằng createCtx của xưởng; GĐ 5: captions giả (ghi lời gọi)
     helpers/svg.js                   [2] đọc mã màu trong SVG (poster, sơ đồ)
     helpers/image.js                 [4] đọc cỡ ảnh WebP, JPEG từ phần đầu file (poster, og)
+    helpers/final-pass.js            [5] dựng ảnh cuối như three dựng lượt cuối (WGSLNodeBuilder thật, chặng setup): thứ tự updateBefore, thân Fn của views.js
   e2e/
     helpers.js                       [0] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU
     painting.spec.js                 [0→5] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại; GĐ 4: mài về cốt, Kính mài, Lột lớp, ?poster; GĐ 5: Từng sợi, quầng trăng
@@ -1102,16 +1108,22 @@ son-mai-anh-sang/
  * @property {HTMLElement} el                      [4] ô của công cụ trong thanh công cụ; công cụ dựng thanh điều khiển ở đây
  * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
  * @property {() => Promise<void>} redraw          [4] vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
- * @property {DrawProbe} [draws]                  [5] lần vẽ của lượt vẽ cảnh (Từng sợi): engine/gpu/draws.js
+ * @property {DrawProbe | null} [draws]           [5] lần vẽ của lượt vẽ cảnh (Từng sợi): engine/gpu/draws.js. Chỉ năm hàm của
+ *                                                DrawProbe: begin()/end() ở lại scene.js, công cụ không tự mở hay đóng khung ghi.
+ *                                                null khi hộp đồ nghề được dựng không có móc: công cụ cần móc thì kiểm trước khi dùng
  */
 /** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
-/** [5] Móc lần vẽ (renderer.setRenderObjectFunction). Chỉ gắn giữa start() và stop(); lúc khác cảnh không tốn thêm gì.
+/** [5] Móc lần vẽ (renderer.setRenderObjectFunction), phần công cụ thấy (ToolApi.draws). Chỉ gắn giữa start() và stop(); lúc khác
+ * cảnh không tốn thêm gì. Móc mà scene.js giữ (createDrawProbe) còn có begin()/end(), gọi quanh mỗi pipeline.render().
  * @typedef {Object} DrawProbe
  * @property {() => void} start                 gắn móc (công cụ bật); khung kế tiếp được ghi lại
  * @property {() => void} stop                  gỡ móc, trả hàm vẽ trước đó; vẽ đủ như chưa có gì
  * @property {() => DrawInfo[]} list            lần vẽ của camera chính ở khung vẽ đủ gần nhất, theo thứ tự GPU nhận
- * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material); null = vẽ đủ
- * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt
+ * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material); null = vẽ đủ.
+ *                                              k là số nguyên ≥ 0 (giá trị khác thì ném lỗi); đang limit thì list() đứng yên
+ * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt.
+ *                                              reflection: lần vẽ của camera khác LỒNG trong lần vẽ một vật (phản chiếu);
+ *                                              other: phần còn lại của renderer.info (bóng, bloom, quad của hậu kỳ)
  */
 /** @typedef {{ layerId: string | null, layer: string | null, name: string | null, label: string, kind: string,
  *   instances: number, triangles: number, material: string, nested: number }} DrawInfo
@@ -1669,7 +1681,9 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
 - (GĐ 4) **`views`:**
   - thứ tự và nhãn: tap của lớp, `t.views`;
   - `ready` của Normal là false cho tới khi `requireView`;
-  - `requireView` không gọi lại `build`/`display`.
+  - `requireView` không gọi lại `build`/`display`;
+  - (GĐ 5) lượt cuối dựng bằng `WGSLNodeBuilder` thật (chặng setup, `tests/helpers/final-pass.js`): scene pass là `updateBefore` đầu
+    tiên, cả khi display vẽ ra RTT và overlay đọc texture của scene pass (Phụ lục A.53).
 - (GĐ 4) **`toolbox`, `kinh-mai`, `lot-lop`** (jsdom):
   - mỗi lúc một công cụ; đóng thanh lớp thì công cụ tắt;
   - `hover` không tới bức; kính chỉ giữ chạm của ngón tay;
@@ -1690,8 +1704,10 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   điểm neo ra ngoài khung thì chữ ẩn mà vùng live vẫn còn. **`caption-set`:** khóa lạ không hiện gì; hết giờ theo đồng hồ của cảnh
   (đồng hồ đứng thì chữ ở lại); `anchor()` ném lỗi thì chỉ ẩn chữ; `keys` rỗng khi không có chữ.
 - (GĐ 5) **`draws`** (renderer giả): `start()` gắn móc và `stop()` trả đúng hàm cũ (kể cả khi đã có hàm khác trước đó); chỉ ghi lần
-  vẽ của camera chính; lần vẽ lồng (camera khác, giữa lúc vẽ một vật) cộng vào `nested` của vật đó; `limit(k)` bỏ đúng các lần vẽ sau
-  k, so theo vật + material; `limit(null)` vẽ đủ; vật là con của một vật trong `layer.objects` thì nhận lớp và nhãn của vật đó.
+  vẽ của camera chính; lần vẽ lồng (camera khác, giữa lúc vẽ một vật) cộng vào `nested` của vật đó, lần vẽ của camera khác ở ngoài
+  cùng vào `other`; `limit(k)` bỏ đúng các lần vẽ sau k, so theo vật + material + lượt (nhóm của Mesh nhiều material, lượt `backSide`);
+  `limit(null)` vẽ đủ; vật là con của một vật trong `layer.objects` thì nhận lớp và nhãn của vật đó; số tam giác theo `drawRange` và
+  nhóm, như three.
 - (GĐ 5) **`tung-soi`** (jsdom): thanh từ 0 tới N, mở công cụ thì ở N; `aria-valuetext` có nhãn vật; "Dệt lại" đi hết 0 → N rồi dừng
   (đồng hồ giả); kéo thanh thì dừng; tắt công cụ thì `limit(null)` rồi `stop()`.
 - (GĐ 5) **`moon-progress`** (jsdom): không có quầng trước `loading`; mỗi mốc đặt đúng phần vòng; `static`/`lost` ẩn ngay; giảm
@@ -2283,9 +2299,23 @@ Các mục dưới đây đã được kiểm bằng ba cách:
     của render list, theo đúng thứ tự đã sắp (đục trước, trong suốt sau). Mỗi lần `render()` đặt hàm hiện tại là `fn ?? renderObject`.
     - `compileAsync` luôn dùng `renderObject` gốc, nên biên dịch trước không đi qua móc.
     - `ShadowNode` cất móc, đặt hàm riêng cho lượt vẽ bóng, rồi trả lại. `RendererUtils.resetRendererState` (BloomNode, RTTNode của
-      FXAA, và các pass có sẵn khác) đặt móc về `null` rồi trả lại. Vì vậy móc không thấy lượt vẽ bóng, bloom hay quad.
+      FXAA, và các pass có sẵn khác) đặt móc về `null` rồi trả lại. Vì vậy móc không thấy lượt vẽ bóng, bloom hay quad của RTT.
     - Reflector gọi `renderer.render(scene, camera ảo)` ngay trong lúc vẽ mặt nước (từ `updateBefore` của node), không đặt lại móc: móc
       thấy các lần vẽ đó với camera ảo, lồng bên trong lần vẽ của mặt nước. `_renderScene` cất và trả hàm hiện tại quanh lượt lồng này.
+    - `RenderPipeline` vẽ quad cuối bằng `renderer.render()` mà không gỡ móc: móc thấy quad (camera trực giao) ở ngoài cùng, và scene
+      pass được vẽ từ BÊN TRONG lần vẽ quad ấy (`updateBefore` của node). Quad không phải phản chiếu: nó vào "các lượt khác".
+    - **Thứ tự `updateBefore`** (phát hiện khi review GĐ 5, kiểm bằng `WGSLNodeBuilder` với đồ thị thật của Bức 1): three gọi
+      `updateBefore` của một material theo thứ tự node dựng xong, con trước cha (`Node.build` gọi `addSequentialNode` sau khi dựng các
+      con; `buildUpdateNodes` giữ thứ tự đó). Ảnh cuối của Bức 1 có RTT của FXAA nằm sâu bên trong, nên RTT tới lượt trước: nó gỡ móc
+      rồi vẽ quad của nó, và `updateBefore` của quad ấy vẽ scene pass lần đầu trong khung bằng `renderObject` gốc. Scene pass cập nhật
+      mỗi `frameId` một lần (FRAME), nên lượt cuối không vẽ lại nó; không có công cụ thì scene pass còn không nằm trong lượt cuối. Lượt
+      cuối thật đo được `[RTTNode, FXAANode, PassNode, BloomNode]` khi có Kính mài và Lột lớp. Vì vậy `views.js` bọc ảnh cuối bằng
+      `Fn(() => { scenePass.toVar(); return vec4(c.rgb, 1); })()`: stack của `Fn` dựng `scenePass.toVar()` trước giá trị trả về, nên
+      scene pass luôn là `updateBefore` đầu tiên của lượt cuối (`[PassNode, RTTNode, FXAANode, BloomNode]`) và chạy khi móc còn gắn.
+      Biến không ai đọc thì `StackNode` bỏ qua lúc sinh code: WGSL y hệt khi không có biến. Hệ quả: scene pass xóa ảnh `output` bằng
+      màu xóa của sân khấu (đen then, alpha 1) chứ không phải màu đen của RTT, như trước GĐ 4. Ảnh `emissive` và `normal` vẫn xóa về đen:
+      cả hai backend chỉ dùng màu xóa của renderer cho ảnh đầu của MRT. Vòm trời của Bức 1 (lớp Sương, luôn hiện) che kín nền, nên chỉ
+      các sợi trước vòm trời của Từng sợi mới thấy màu xóa.
     - Không gọi hàm vẽ cho một mục là mục đó không được vẽ, và `renderer.info` không đếm nó. Mặt nước bị bỏ qua thì reflector cũng không
       vẽ lại ở khung đó.
     - Inspector của `?debug` không dùng móc này (không file nào của inspector gọi nó).
```

- [ ] **Step 4: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  771 passed`.

```bash
git add docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md src/engine/contracts/runtime.js src/engine/gpu/draws.js src/engine/gpu/scene.js src/engine/gpu/toolbox.js src/engine/gpu/views.js tests/helpers/final-pass.js tests/rules/files.test.js tests/unit/draws.test.js tests/unit/pipeline.test.js tests/unit/scene.test.js tests/unit/toolbox.test.js tests/unit/views.test.js
git commit -F - <<'EOF'
feat(engine): móc lần vẽ (draws.js đặt setRenderObjectFunction chỉ khi công cụ bật; ghi lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu); ToolApi.draws

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Công cụ Từng sợi (`engine/tools/tung-soi.js`)

**Mục tiêu:** Spec §7 "Từng sợi", §4.1 mục 6, §15 (c). Đồ nghề có công cụ thứ ba, sau Kính mài và Lột lớp: dệt lại khung hình từng lần vẽ một, đúng thứ tự GPU nhận.

Thanh điều khiển:
- **Thanh "Sợi" (0 → N).** Ở nấc N, ảnh y như lúc chưa bật. Ở nấc 0, chỉ còn màu xóa khung (vẫn qua hậu kỳ). Ở nấc k, chỉ k sợi đầu được vẽ.
- **Dòng mô tả sợi thứ k.** Ví dụ "Cánh sen · lớp Cốt · InstancedMesh × 388 · 46.560 tam giác." Sợi của mặt nước có thêm câu về ảnh phản chiếu, vì GPU vẽ lại cả cảnh cho ảnh đó ngay trước khi vẽ mặt nước.
- **Dòng tóm tắt khung:** lượt vẽ cảnh, phản chiếu và các lượt khác. Dưới cùng là một ghi chú tĩnh: bóng và phản chiếu vẽ ở lượt riêng, nên lúc nào cũng đủ.
- **Nút "Dệt lại" (`aria-pressed`).** Đi từ 0 tới N rồi tự dừng; bấm lại hay kéo thanh thì dừng. Mỗi bước dài `playStepMs(N)` (tối đa 600 ms). Nhiều sợi thì đi nhanh hơn, và đi nhiều sợi một bước (`playStride(N)`), nên cả lượt chừng 12 giây kể cả khi "Tắt instancing" có chừng 1.200 sợi. Bước sau chỉ được hẹn giờ khi khung trước đã vẽ lại xong, để lúc `?freeze` vẽ chậm không dồn bước.

Danh sách lần vẽ được đọc lại mỗi 250 ms. Đang xem đủ khung thì thanh theo N mới. Đang dừng ở sợi k, hay đang "Dệt lại", thì công cụ giữ một bản chụp của `list()` và `counts()` lấy ngay trước lúc gọi `limit()`, nên k sợi trên thanh luôn đúng là k lần vẽ mà móc giữ lại.

Trợ năng:
- Trình đọc màn hình nghe sợi đang xem qua `aria-valuetext` của thanh ("Sợi k trên N: <nhãn vật>").
- `<output>` "k/N" có `aria-live="off"`: `<output>` vốn là một vùng live ngầm (role status), nên nếu để mặc định thì lúc "Dệt lại" ghi số ở mỗi bước (40 ms một bước khi có 300 sợi) sẽ tràn hàng đọc của trình đọc màn hình.
- Lúc đang đếm (N = 0) thì nút "Dệt lại" bị vô hiệu.

Số viết theo kiểu Việt Nam (`Intl.NumberFormat('vi')`, ví dụ 1.200), qua helper `num` của `strings.vi.js`.

Hai việc đi kèm:
- Bộ chọn của e2e Lột lớp (`[data-toolbar] input[type="range"]`) giờ khớp cả thanh của Từng sợi, nên Playwright ở strict mode sẽ báo lỗi; bộ chọn được thu về `[data-tool-slot="lot-lop"]`.
- `tools.css`: các dòng chữ trong `.tool-panel` chỉ bỏ `margin-bottom`. `margin: 0` có cùng độ ưu tiên với `.tool-panel > * + * { margin-top: 8px }` và đứng sau, nên xóa mất khoảng hở; dòng `.tool-status` của GĐ 4 cũng sửa theo. Một test cascade trong `html.test.js` giữ điều này.

**Files:**
- Create: `src/engine/tools/tung-soi.js`, `tests/unit/tung-soi.test.js`
- Modify: `src/engine/tools/index.js` (`[kinhMai, lotLop, tungSoi]`), `src/ui/strings.vi.js` (`t.tools['tung-soi']`, helper `num`), `src/styles/tools.css`, `e2e/painting.spec.js` (bộ chọn của Lột lớp)
- Test: `tests/paintings/html.test.js`

**Interfaces:**
- Consumes: `api.draws` (Task 6): `start`, `stop`, `list`, `limit`, `counts`; `api.redraw()`; `api.el`, `api.t`.
- Produces:
  - `id = 'tung-soi'`; `STEP_MS = 600`, `MAX_PLAY_MS = 12000`, `POLL_MS = 250`; `playStepMs(n)`, `playStride(n)`;
  - DOM cho e2e và a11y (Task 12): `[data-tool-slot="tung-soi"] .tool-panel[role=group]`, gồm `#tung-soi-range` (min 0, max N), `output.tool-value`, `button[aria-pressed]` "Dệt lại", rồi `p.tool-detail`, `p.tool-summary`, `p.tool-note`.

- [ ] **Step 1: Test (hỏng: chưa có `tung-soi.js`)**

Tạo `tests/unit/tung-soi.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/tung-soi.test.js — Từng sợi: thanh 0 → N lần vẽ (mở là ở N), aria-valuetext có nhãn vật, "Dệt lại", N đổi giữa chừng, tắt thì gỡ móc.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BoxGeometry, Mesh, MeshStandardNodeMaterial, PerspectiveCamera } from 'three/webgpu';
import * as tungSoi from '../../src/engine/tools/tung-soi.js';
import { tools } from '../../src/engine/tools/index.js';
import { createDrawProbe } from '../../src/engine/gpu/draws.js';
import t from '../../src/ui/strings.vi.js';

const { POLL_MS, STEP_MS, MAX_PLAY_MS, playStepMs, playStride } = tungSoi;
const text = t.tools['tung-soi'];

/** Ba lần vẽ của lượt vẽ cảnh, như draws.js ghi: mặt nước kéo theo hai lần vẽ lồng (phản chiếu); một vật không thuộc lớp nào. */
const DRAWS = [
  { layerId: 'cot', layer: 'Cốt', name: 'la-noi', label: 'Lá nổi', kind: 'InstancedMesh', instances: 1200, triangles: 9600, material: 'MeshStandardNodeMaterial', nested: 0 },
  { layerId: 'mat-nuoc', layer: 'Mặt nước', name: 'mat-nuoc', label: 'Mặt nước', kind: 'Mesh', instances: 1, triangles: 2, material: 'MeshStandardNodeMaterial', nested: 2 },
  { layerId: null, layer: null, name: null, label: 'Sprite', kind: 'Sprite', instances: 1, triangles: 2, material: 'SpriteNodeMaterial', nested: 0 },
];
/** n lần vẽ khác nhau (thí nghiệm "Tắt instancing" làm lá nổi thành hàng trăm sợi). */
const many = (n) => Array.from({ length: n }, (_, i) => ({ ...DRAWS[0], name: `v${i}`, label: `Vật ${i}` }));

/** ToolApi giả với móc lần vẽ giả. setList(): khung mới có danh sách khác (camera kéo, thí nghiệm thêm vật). */
function fakeApi() {
  let list = DRAWS;
  const el = document.createElement('div');
  document.body.append(el);
  return {
    el,
    t,
    views: () => [],
    requireView: vi.fn(async () => {}),
    redraw: vi.fn(async () => {}),
    draws: { start: vi.fn(), stop: vi.fn(), limit: vi.fn(), list: () => list, counts: () => ({ scene: 3, reflection: 2, other: 24 }) },
    setList: (next) => {
      list = next;
    },
  };
}
const parts = (el) => ({
  range: el.querySelector('input[type="range"]'),
  shown: el.querySelector('output'),
  play: el.querySelector('button'),
  detail: el.querySelector('.tool-detail'),
  summary: el.querySelector('.tool-summary'),
  note: el.querySelector('.tool-note'),
});
const slide = (range, v) => {
  range.value = String(v);
  range.dispatchEvent(new Event('input', { bubbles: true }));
};
/** Gắn và bật công cụ, rồi chờ một nhịp đọc: thanh đã có danh sách của khung. */
async function opened(api = fakeApi()) {
  const tool = tungSoi.mount(api);
  tool.activate(true);
  await vi.advanceTimersByTimeAsync(POLL_MS);
  return { api, tool, ...parts(api.el) };
}

beforeEach(() => {
  document.body.replaceChildren();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('Từng sợi', () => {
  it('Đồ nghề có Từng sợi sau Kính mài và Lột lớp (tools/index.js); công cụ nào cũng có tên trong t.tools', () => {
    expect(tools.map((x) => x.id)).toEqual(['kinh-mai', 'lot-lop', 'tung-soi']);
    for (const tool of tools) expect(typeof t.tools[tool.id]?.name, tool.id).toBe('string');
  });

  it('bật công cụ thì gọi draws.start; sau một nhịp đọc, thanh có max = số sợi và đứng ở nấc cuối (ảnh không đổi)', async () => {
    const api = fakeApi();
    const tool = tungSoi.mount(api);
    const { range, shown, detail, summary } = parts(api.el);
    expect(api.draws.start).not.toHaveBeenCalled(); // móc chỉ gắn khi công cụ bật: lúc khác cảnh không tốn gì
    expect(api.el.querySelector(`label[for="${range.id}"]`).textContent).toBe(text.label);
    expect([tool.overlay, tool.onGesture]).toEqual([undefined, undefined]); // không phủ gì lên ảnh; chạm vẫn tới bức
    tool.activate(true);
    tool.activate(true); // bật lại khi đang bật: không gắn móc lần nữa, không thêm lượt đọc
    expect(api.draws.start).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    expect(api.redraw).toHaveBeenCalledTimes(1); // ?freeze: vẽ lại khung N để móc ghi được nó
    expect([detail.textContent, summary.textContent]).toEqual([text.counting, '']); // chưa có khung nào được ghi
    await vi.advanceTimersByTimeAsync(0); // khung vẽ lại đó đã được ghi: thanh có danh sách ngay, không chờ nhịp đọc
    expect([range.max, range.value]).toEqual(['3', '3']);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.min, range.max, range.step, range.value]).toEqual(['0', '3', '1', '3']);
    expect(shown.textContent).toBe('3/3');
    expect(api.draws.limit).not.toHaveBeenCalled(); // nấc N: không giới hạn gì
  });

  it('đang đếm (móc chưa ghi khung nào): "Dệt lại" bị khóa (disabled), không làm gì; danh sách tới thì nút mở và thanh hiện ở nấc cuối', async () => {
    const api = fakeApi();
    api.setList([]);
    const { range, play, detail } = await opened(api);
    expect(play.disabled).toBe(true);
    play.click();
    expect([play.getAttribute('aria-pressed'), range.max, detail.textContent]).toEqual(['false', '0', text.counting]);
    expect(api.draws.limit).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1); // chỉ còn lượt đọc
    api.setList(DRAWS);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, range.getAttribute('aria-valuetext'), play.disabled]).toEqual(['3', '3', 'Sợi 3 trên 3: Sprite', false]);
    // Danh sách rỗng lại ngay trước khi bấm (nút còn mở vì chưa tới nhịp đọc): bấm thì chụp lại danh sách rỗng và không chạy.
    api.setList([]);
    play.click();
    expect([play.getAttribute('aria-pressed'), vi.getTimerCount()]).toEqual(['false', 1]);
    expect(api.draws.limit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([play.disabled, detail.textContent]).toEqual([true, text.counting]);
  });

  it('aria-valuetext và dòng mô tả nói về sợi đang xem (sợi k là lần vẽ thứ k); nấc 0 thì nói chưa vẽ gì; ô số k/N không tự đọc', async () => {
    const { range, shown, detail } = await opened();
    // <output> ngầm là role status (aria-live polite): "Dệt lại" 40 ms một bước sẽ làm ngập hàng đợi của trình đọc màn hình.
    // Tiến độ tới người nghe qua aria-valuetext của thanh.
    expect(shown.getAttribute('aria-live')).toBe('off');
    expect(range.getAttribute('aria-valuetext')).toBe('Sợi 3 trên 3: Sprite');
    slide(range, 1);
    expect([range.getAttribute('aria-valuetext'), shown.textContent]).toEqual(['Sợi 1 trên 3: Lá nổi', '1/3']);
    // Nhãn vật · lớp · loại × số bản · số tam giác; số viết kiểu Việt (dấu chấm ngăn hàng nghìn).
    expect(detail.textContent).toBe('Lá nổi · lớp Cốt · InstancedMesh × 1.200 · 9.600 tam giác.');
    slide(range, 0);
    expect([range.getAttribute('aria-valuetext'), shown.textContent]).toEqual(['Sợi 0 trên 3: chưa vẽ gì', '0/3']);
    expect(detail.textContent).toBe(text.empty);
  });

  it('kéo về nấc k < N gọi limit(k) và vẽ lại; về nấc N gọi limit(null)', async () => {
    const { api, range } = await opened();
    api.redraw.mockClear();
    slide(range, 2);
    expect(api.draws.limit).toHaveBeenLastCalledWith(2);
    slide(range, 0);
    expect(api.draws.limit).toHaveBeenLastCalledWith(0);
    slide(range, 3);
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect(api.redraw).toHaveBeenCalledTimes(3); // ?freeze: mỗi lần đổi sợi vẽ lại đúng khung N
  });

  it('sợi của mặt nước có câu về ảnh phản chiếu; vật không thuộc lớp nào ghi "không thuộc lớp nào"', async () => {
    const { range, detail } = await opened();
    slide(range, 2);
    expect(text.nested(2)).toBe('Trước khi vẽ vật này, GPU vẽ lại 2 lần cho ảnh phản chiếu.');
    expect(detail.textContent).toBe(`Mặt nước · lớp Mặt nước · Mesh · 2 tam giác. ${text.nested(2)}`);
    slide(range, 3);
    expect(detail.textContent).toBe('Sprite · không thuộc lớp nào · Sprite · 2 tam giác.');
  });

  it('"Dệt lại" đi từ 0 tới N theo playStepMs rồi tự dừng (aria-pressed về false); bấm lại khi đang chạy thì dừng; kéo thanh cũng dừng', async () => {
    const { api, range, play } = await opened();
    const step = playStepMs(3);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    play.click();
    expect([play.getAttribute('aria-pressed'), range.value]).toEqual(['true', '0']);
    expect(api.draws.limit).toHaveBeenLastCalledWith(0);
    await vi.advanceTimersByTimeAsync(step - 1);
    expect(range.value).toBe('0');
    await vi.advanceTimersByTimeAsync(1);
    expect(range.value).toBe('1');
    expect(api.draws.limit).toHaveBeenLastCalledWith(1);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['3', 'false']); // tới N: ảnh đủ, tự dừng
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    const limits = api.draws.limit.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(api.draws.limit).toHaveBeenCalledTimes(limits);

    play.click(); // bấm lại khi đang chạy: dừng ở sợi đang xem
    await vi.advanceTimersByTimeAsync(step);
    play.click();
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1', 'false']);
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('1');

    play.click(); // kéo thanh cũng dừng
    expect(range.value).toBe('0');
    slide(range, 2);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('2');
  });

  it('"Dệt lại" với nhiều sợi đi nhanh hơn: mỗi bước playStepMs(N), cả lượt chừng MAX_PLAY_MS', async () => {
    const api = fakeApi();
    api.setList(many(300));
    const { range, play } = await opened(api);
    const step = playStepMs(300); // 40 ms: vẫn 0,6 giây mỗi sợi thì 300 sợi mất 3 phút
    expect([range.max, playStride(300)]).toEqual(['300', 1]); // từng sợi một
    play.click();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('1');
    await vi.advanceTimersByTimeAsync(MAX_PLAY_MS - 2 * step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['299', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['300', 'false']); // tới N đúng lúc MAX_PLAY_MS
  });

  it('"Dệt lại" với hơn 750 sợi: mỗi bước đi playStride(N) sợi, bước cuối đáp đúng N, cả lượt vẫn chừng MAX_PLAY_MS', async () => {
    const api = fakeApi();
    api.setList(many(1200)); // "Tắt instancing": chừng 1 200 sợi lá
    const { range, play } = await opened(api);
    const step = playStepMs(1200);
    expect([playStride(1200), step]).toEqual([2, 20]); // từng sợi một, mỗi bước 16 ms, thì mất 19 giây
    play.click();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('2');
    await vi.advanceTimersByTimeAsync(MAX_PLAY_MS - 2 * step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1198', 'true']);
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['1200', 'false']); // tới N đúng lúc MAX_PLAY_MS

    // N không chia hết cho bước: 1 998 + 3 vượt N, nên bước cuối đi 2 sợi và đáp đúng nấc N (limit(null)).
    api.setList(many(2000));
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, playStride(2000), playStepMs(2000)]).toEqual(['2000', 3, 18]);
    api.draws.limit.mockClear();
    play.click();
    await vi.advanceTimersByTimeAsync(Math.ceil(2000 / 3) * 18); // 667 bước: 12 006 ms
    expect(api.draws.limit.mock.calls.map(([v]) => v).slice(0, 3)).toEqual([0, 3, 6]);
    expect(api.draws.limit.mock.calls.map(([v]) => v).slice(-3)).toEqual([1995, 1998, null]);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2000', 'false']);
  });

  it('?freeze: bước kế tiếp chỉ hẹn giờ khi khung trước đã vẽ lại xong (vẽ lại chậm không dồn bước); vẽ lại hỏng thì dừng', async () => {
    const { api, range, play } = await opened();
    const step = playStepMs(3);
    let finish = null;
    api.redraw.mockImplementation(() => new Promise((resolve) => {
      finish = resolve;
    }));
    play.click();
    await vi.advanceTimersByTimeAsync(10 * step);
    expect(range.value).toBe('0');
    finish();
    await vi.advanceTimersByTimeAsync(step);
    expect(range.value).toBe('1');
    await vi.advanceTimersByTimeAsync(10 * step); // khung của sợi 1 chưa vẽ xong: không có bước nào nữa
    expect(range.value).toBe('1');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    api.redraw.mockImplementation(async () => {
      throw new Error('khung hỏng');
    });
    finish(); // khung của sợi 1 vẽ xong; sợi 2 vẽ lại hỏng
    await vi.advanceTimersByTimeAsync(step);
    expect([range.value, play.getAttribute('aria-pressed')]).toEqual(['2', 'false']);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('tắt công cụ: dừng chạy, limit(null) rồi stop(); gọi hai lần vẫn an toàn; bật lại thì đếm lại từ đầu', async () => {
    const { api, tool, range, play, detail } = await opened();
    play.click();
    await vi.advanceTimersByTimeAsync(playStepMs(3));
    api.redraw.mockClear();
    tool.activate(false);
    expect(play.getAttribute('aria-pressed')).toBe('false');
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect(api.draws.stop).toHaveBeenCalledTimes(1);
    // limit(null) TRƯỚC stop(): bỏ giới hạn rồi mới gỡ móc
    expect(api.draws.limit.mock.invocationCallOrder.at(-1)).toBeLessThan(api.draws.stop.mock.invocationCallOrder[0]);
    expect(api.redraw).toHaveBeenCalledTimes(1); // ?freeze: khung N vẽ lại đủ
    expect(vi.getTimerCount()).toBe(0); // không còn lượt đọc (setInterval) hay bước "Dệt lại" nào hẹn giờ
    const limits = api.draws.limit.mock.calls.length;
    tool.activate(false);
    tool.dispose();
    await vi.advanceTimersByTimeAsync(10 * playStepMs(3)); // không còn "Dệt lại" hay lượt đọc nào chạy
    expect([api.draws.stop.mock.calls.length, api.draws.limit.mock.calls.length]).toEqual([1, limits]);
    tool.activate(true);
    expect([api.draws.start.mock.calls.length, detail.textContent]).toEqual([2, text.counting]);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect(range.value).toBe('3');
    // Gỡ khi đang bật (gỡ cảnh): gỡ móc, không vẽ lại.
    api.redraw.mockClear();
    tool.dispose();
    expect(api.draws.stop).toHaveBeenCalledTimes(2);
    expect(api.redraw).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0); // "Dựng lại cảnh": lượt đọc cũ không giữ móc và DOM cũ sống tiếp
  });

  it('playStepMs và playStride: 11 sợi → 600 ms; 300 sợi → 40 ms; quá 750 sợi thì mỗi bước đi nhiều sợi; 0 hay 1 sợi không chia cho 0', () => {
    expect([STEP_MS, playStepMs(11), playStride(11)]).toEqual([600, 600, 1]);
    expect([playStepMs(300), playStride(300)]).toEqual([40, 1]);
    expect(300 * playStepMs(300)).toBe(MAX_PLAY_MS); // nhiều sợi thì đi nhanh hơn: cả lượt chừng 12 giây
    expect([playStepMs(0), playStepMs(1), playStride(0), playStride(1)]).toEqual([600, 600, 1, 1]);
    // 750 sợi là vừa chạm đáy 16 ms (một khung) mỗi bước; thêm một sợi nữa thì mỗi bước phải đi hai sợi.
    expect([750, 751, 1200, 5000].map(playStride)).toEqual([1, 2, 2, 7]);
    for (const n of [300, 750, 751, 1200, 5000]) {
      const step = playStepMs(n);
      const whole = Math.ceil(n / playStride(n)) * step; // bước cuối có thể đi ít sợi hơn: vẫn tính một bước
      expect(step, `${n} sợi`).toBeGreaterThanOrEqual(16); // không nhanh hơn một khung
      expect(whole, `${n} sợi`).toBeGreaterThanOrEqual(MAX_PLAY_MS);
      expect(whole, `${n} sợi`).toBeLessThan(MAX_PLAY_MS + step); // chừng 12 giây: dư nhiều nhất một bước
    }
  });

  it('tóm tắt khung đọc counts(); ghi chú tĩnh nói vì sao bóng và phản chiếu luôn đủ', async () => {
    const { summary, note } = await opened();
    expect(summary.textContent).toBe('Khung này: lượt vẽ cảnh 3 · phản chiếu 2 · các lượt khác (bóng, bloom, hậu kỳ) 24 draw call.');
    expect(note.textContent).toBe(text.note);
  });

  it('số sợi đổi giữa chừng: đang xem đủ khung thì thanh theo N mới; đang dừng ở sợi k < N hay đang "Dệt lại" thì giữ nguyên k, max và dòng mô tả', async () => {
    const { api, range, play, detail } = await opened();
    const single = (i) => ({ ...DRAWS[0], name: 'la-rieng', label: `Lá riêng ${i}`, kind: 'Mesh', instances: 1, triangles: 8 });
    api.setList([...DRAWS, single(1), single(2)]); // thí nghiệm "Tắt instancing": thêm Mesh
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, range.getAttribute('aria-valuetext')]).toEqual(['5', '5', 'Sợi 5 trên 5: Lá riêng 2']);
    api.setList(DRAWS.slice(0, 2)); // camera kéo làm vật ra khỏi khung
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['2', '2']);

    // Dừng ở sợi 1: móc không ghi khi đang giới hạn, nên thanh giữ danh sách cũ dù list() có trả gì đi nữa.
    slide(range, 1);
    const held = detail.textContent;
    api.setList(DRAWS);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, detail.textContent]).toEqual(['2', '1', held]);
    slide(range, 2); // về N: lại theo khung mới
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '3']);

    play.click();
    api.setList([...DRAWS, single(1)]);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '0']);
    await vi.advanceTimersByTimeAsync(3 * playStepMs(3)); // "Dệt lại" xong ở N = 3, rồi thanh theo khung mới
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, play.getAttribute('aria-pressed')]).toEqual(['4', '4', 'false']);
  });

  it('rời khung đủ ngay sau khi khung đổi (chưa tới nhịp đọc): thanh chụp lại đúng danh sách mà limit() sắp cắt', async () => {
    const { api, range, play } = await opened();
    // Camera dời: three sắp lại vật đục theo độ sâu, và một vật mới vào khung. limit(1) giữ lần vẽ đầu của danh sách MỚI.
    api.setList([DRAWS[2], DRAWS[0], DRAWS[1], { ...DRAWS[0], name: 'la-dung', label: 'Lá đứng' }]);
    slide(range, 1);
    expect(api.draws.limit).toHaveBeenLastCalledWith(1);
    expect([range.max, range.value, range.getAttribute('aria-valuetext')]).toEqual(['4', '1', 'Sợi 1 trên 4: Sprite']);
    slide(range, 4);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    api.setList(DRAWS);
    play.click(); // "Dệt lại" cũng rời khung đủ
    expect([range.max, range.value]).toEqual(['3', '0']);
  });

  it('danh sách co lại giữa hai nhịp đọc rồi người xem kéo quá N mới: thanh kẹp về N, vẽ đủ (limit(null)), không ném lỗi', async () => {
    const api = fakeApi();
    api.setList(many(30));
    const { range, shown, detail } = await opened(api);
    api.setList(many(10)); // camera kéo: hai mươi vật ra khỏi khung, chưa tới nhịp đọc
    const errors = vi.fn((event) => event.preventDefault()); // lỗi trong trình nghe 'input' tới window, không tới slide()
    window.addEventListener('error', errors);
    slide(range, 25);
    window.removeEventListener('error', errors);
    expect(errors.mock.calls.map(([event]) => event.message)).toEqual([]);
    expect(api.draws.limit).toHaveBeenLastCalledWith(null);
    expect([range.max, range.value, shown.textContent, range.getAttribute('aria-valuetext')]).toEqual(['10', '10', '10/10', 'Sợi 10 trên 10: Vật 9']);
    expect(detail.textContent).toBe('Vật 9 · lớp Cốt · InstancedMesh × 1.200 · 9.600 tam giác.');
  });

  it('nhịp đọc mà khung không đổi thì không ghi gì vào DOM, cả lúc đang đếm: trình đọc màn hình không đọc lại thanh hay các dòng chữ', async () => {
    const api = fakeApi();
    api.setList([]);
    await opened(api);
    const seen = new MutationObserver(() => {});
    seen.observe(api.el, { subtree: true, childList: true, characterData: true, attributes: true });
    const changes = () => seen.takeRecords().map((r) => `${r.type} ${r.target.nodeName}`);
    vi.advanceTimersByTime(8 * POLL_MS); // đang đếm: móc chưa ghi khung nào
    expect(changes()).toEqual([]);
    api.setList(DRAWS); // khung đổi thì có ghi: bộ quan sát thấy được
    vi.advanceTimersByTime(POLL_MS);
    expect(changes()).toContain('childList OUTPUT');
    vi.advanceTimersByTime(8 * POLL_MS); // đang xem đủ khung, khung vẫn ba sợi đó
    expect(changes()).toEqual([]);
    seen.disconnect();
  });

  it('móc thật (draws.js, renderer giả): mở là N lần vẽ của khung; nấc k chỉ vẽ k vật đầu và danh sách đứng yên; về N thì theo khung mới', async () => {
    const renderer = {
      info: { render: { drawCalls: 0 } },
      fn: null,
      getRenderObjectFunction() {
        return this.fn;
      },
      setRenderObjectFunction(f) {
        this.fn = f;
      },
      renderObject: vi.fn(function () {
        this.info.render.drawCalls += 1;
      }),
    };
    const camera = new PerspectiveCamera();
    const box = (name) => Object.assign(new Mesh(new BoxGeometry(), new MeshStandardNodeMaterial()), { name });
    const objects = [box('a'), box('b'), box('c')];
    const draws = createDrawProbe({ renderer, camera, layers: [{ id: 'cot', layer: { objects } }], meta: { layers: [{ id: 'cot', name: 'Cốt' }] } });
    /** Một khung như scene.js: begin → mọi vật qua hàm vẽ hiện tại (móc, khi đã gắn) → end. */
    const frame = () => {
      draws.begin();
      for (const o of objects) (renderer.fn ?? renderer.renderObject).call(renderer, o, null, camera, o.geometry, o.material, null, null, null, null);
      draws.end();
    };
    const api = { ...fakeApi(), draws, redraw: vi.fn(async () => frame()) };
    const tool = tungSoi.mount(api);
    const { range, detail } = parts(api.el);
    tool.activate(true);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value, detail.textContent]).toEqual(['3', '3', 'c · lớp Cốt · Mesh · 12 tam giác.']);
    renderer.renderObject.mockClear();
    slide(range, 1);
    expect(renderer.renderObject.mock.calls.map(([o]) => o.name)).toEqual(['a']);
    objects.push(box('d'));
    frame();
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['3', '1']);
    slide(range, 3);
    await vi.advanceTimersByTimeAsync(POLL_MS);
    expect([range.max, range.value]).toEqual(['4', '4']);
    tool.activate(false);
    expect(renderer.fn).toBeNull(); // trả hàm vẽ cũ
  });

  it('xưởng chưa có móc (api.draws null): ô trống, không ném lỗi', () => {
    const api = { ...fakeApi(), draws: null };
    const tool = tungSoi.mount(api);
    expect(api.el.querySelector('input, button')).toBeNull();
    expect(() => {
      tool.activate?.(true);
      tool.dispose();
    }).not.toThrow();
  });
});
```
Áp vào `tests/paintings/html.test.js`:

```diff
diff --git a/tests/paintings/html.test.js b/tests/paintings/html.test.js
index 77fcb87..3351d5a 100644
--- a/tests/paintings/html.test.js
+++ b/tests/paintings/html.test.js
@@ -138,6 +138,18 @@ describe('styles/tools.css (GĐ 4)', () => {
     expect([toolbar, panels].every(Number.isFinite), `toolbar ${toolbar}, rail/notebook ${panels}`).toBe(true);
     expect(toolbar).toBeLessThan(panels);
   });
+
+  it('các dòng chữ dưới hàng thanh trượt giữ khoảng 8px của .tool-panel; dòng trống (aria-live, tóm tắt lúc đang đếm) thì thu lại', () => {
+    // JSDOM 30 tính cascade theo độ ưu tiên: `.tool-x { margin: 0 }` ngang hàng `.tool-panel > * + *` mà đứng sau thì xóa khoảng 8px.
+    const css = readFileSync(ROOT + 'src/styles/tools.css', 'utf8');
+    const lines = ['tool-status', 'tool-detail', 'tool-summary', 'tool-note'].map((c) => `<p class="${c}">chữ</p>`).join('');
+    const { window } = new JSDOM(`<style>${css}</style><div class="tool-panel"><div class="tool-row"></div>${lines}`
+      + '<p class="tool-status"></p><p class="tool-summary"></p></div>');
+    const [, ...rows] = window.document.querySelector('.tool-panel').children;
+    expect(rows.map((p) => `${p.className}${p.textContent ? '' : ' (trống)'} ${window.getComputedStyle(p).marginTop}`)).toEqual([
+      'tool-status 8px', 'tool-detail 8px', 'tool-summary 8px', 'tool-note 8px', 'tool-status (trống) 0px', 'tool-summary (trống) 0px',
+    ]);
+  });
 });
 
 describe('styles/shell.css (trang nào cũng dùng)', () => {
```

Run: `npx vitest run tests/unit/tung-soi.test.js tests/paintings/html.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `Error: Failed to resolve import "../../src/engine/tools/tung-soi.js" from "tests/unit/tung-soi.test.js". Does the file exist?`.

- [ ] **Step 2: Code**

Tạo `src/engine/tools/tung-soi.js`:

```js
// engine/tools/tung-soi.js — công cụ Từng sợi: dệt lại khung hình từng lần vẽ (draw call) một, theo đúng thứ tự GPU nhận; chỉ nhìn api.draws.
import { h } from '../../ui/dom.js';

export const id = 'tung-soi';
export const STEP_MS = 600; // mỗi sợi khi "Dệt lại"
export const MAX_PLAY_MS = 12000; // cả lượt không quá chừng này: nhiều sợi thì đi nhanh hơn
export const POLL_MS = 250; // đọc lại danh sách lần vẽ khi đang xem đủ khung
const FRAME_MS = 16; // một bước không nhanh hơn một khung

/**
 * Số sợi mỗi bước của "Dệt lại" cho n sợi. Spec §7: cả lượt không quá chừng 12 giây. Bước không ngắn hơn một khung, nên quá
 * 750 sợi mà vẫn đi từng sợi một thì lượt dài ra (tắt instancing có thể ra chừng 1 200 sợi: 19 giây): mỗi bước đi nhiều sợi.
 */
export function playStride(n) {
  return Math.max(1, Math.ceil((n * FRAME_MS) / MAX_PLAY_MS));
}

/** Một bước của "Dệt lại" cho n sợi (ms): 0,6 giây mỗi sợi; nhiều sợi thì các bước chia nhau chừng 12 giây, không nhanh hơn một khung. */
export function playStepMs(n) {
  return Math.min(STEP_MS, Math.max(FRAME_MS, (MAX_PLAY_MS * playStride(n)) / Math.max(1, n)));
}

/**
 * Lột lớp cho thấy các bước SAU lượt vẽ cảnh (bloom, tone); Từng sợi cho thấy chính lượt vẽ cảnh được làm ra thế nào (spec §7).
 * Sợi là một lần vẽ của lượt vẽ cảnh. Thanh ở nấc k thì móc lần vẽ (engine/gpu/draws.js) chỉ cho k lần vẽ đầu đi qua: nấc N (lúc
 * mở) là ảnh không đổi gì, nấc 0 chỉ còn màu nền xóa khung (vẫn qua hậu kỳ). Bóng đổ và phản chiếu vẽ ở lượt riêng nên luôn đủ.
 * Không overlay, không giữ cử chỉ nào (chạm và chạm hai lần vẫn tới bức), không biết có bức nào: chỉ đọc DrawInfo.
 *
 * Thanh hiện một BẢN CHỤP list() + counts() của cùng một khung vẽ đủ:
 * - đang xem đủ khung (k = N, không "Dệt lại"): mỗi POLL_MS chụp lại, thanh theo N mới (camera kéo làm vật ra khỏi khung, thí
 *   nghiệm thêm hàng trăm Mesh) mà vẫn đứng ở nấc cuối;
 * - rời khung đủ thì chụp lại ĐÚNG LÚC gọi limit(): k sợi đầu trên thanh là đúng k lần vẽ mà móc giữ lại. Từ đó móc không ghi
 *   nữa (list đứng yên), và bản chụp cũng đứng yên tới khi người xem về nấc N.
 * @param {import('../contracts/runtime.js').ToolApi} api
 * @returns {import('../contracts/runtime.js').ToolInstance}
 */
export function mount(api) {
  const { t, draws } = api;
  const text = t.tools[id];
  const doc = api.el.ownerDocument;
  const win = doc.defaultView;
  // Xưởng chưa có móc lần vẽ: một ô trống không làm gì; không ném lỗi, để các công cụ khác vẫn gắn được.
  if (!draws) {
    api.el.append(h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name }));
    return { dispose() {} };
  }

  const range = h(doc, 'input', { type: 'range', id: 'tung-soi-range', min: '0', max: '0', step: '1', value: '0' });
  // <output> ngầm là role status (aria-live polite): "Dệt lại" ghi k/N mỗi bước (40 ms với 300 sợi) sẽ làm ngập hàng đợi của
  // trình đọc màn hình. Tiến độ tới người nghe qua aria-valuetext của thanh.
  const shown = h(doc, 'output', { for: 'tung-soi-range', class: 'tool-value', 'aria-live': 'off' });
  const button = h(doc, 'button', {
    type: 'button', 'aria-pressed': 'false', disabled: true, text: text.play, onclick: () => (play ? stopPlay() : startPlay()),
  });
  const detail = h(doc, 'p', { class: 'tool-detail' });
  const summary = h(doc, 'p', { class: 'tool-summary' });
  api.el.append(h(doc, 'div', { class: 'tool-panel', role: 'group', 'aria-label': text.name },
    h(doc, 'div', { class: 'tool-row' }, h(doc, 'label', { for: 'tung-soi-range', text: text.label }), range, shown, button),
    detail, summary, h(doc, 'p', { class: 'tool-note', text: text.note })));

  let on = false;
  let poll = 0;
  let snap = { draws: [], counts: null }; // khung đang hiện trên thanh
  let k = 0; // nấc: chỉ k lần vẽ đầu của snap được vẽ
  let play = null; // lượt "Dệt lại" đang chạy ({ timer }); null là không chạy

  const total = () => snap.draws.length;
  const following = () => play === null && k >= total(); // đang xem đủ khung: thanh theo khung mới
  const take = () => {
    snap = { draws: draws.list(), counts: draws.counts() };
  };
  /** Ghi chỉ khi đổi: lượt đọc mỗi POLL_MS không làm trình đọc màn hình đọc lại thanh. */
  const put = (el, value) => {
    if (el.textContent !== value) el.textContent = value;
  };
  const describe = (info) => (info.nested > 0 ? `${text.detail(info)} ${text.nested(info.nested)}` : text.detail(info));
  const sync = () => {
    const n = total();
    const info = snap.draws[k - 1]; // sợi đang xem là lần vẽ thứ k: lần vẽ CUỐI trong k lần đầu
    if (range.max !== String(n)) range.max = String(n); // max trước value: trình duyệt kẹp value theo max
    if (range.value !== String(k)) range.value = String(k);
    const valuetext = n === 0 ? text.counting : text.valuetext(k, n, info?.label);
    if (range.getAttribute('aria-valuetext') !== valuetext) range.setAttribute('aria-valuetext', valuetext);
    if (button.disabled !== (n === 0)) button.disabled = n === 0; // đang đếm: chưa có sợi nào để dệt
    put(shown, n === 0 ? '' : text.step(k, n));
    put(detail, n === 0 ? text.counting : k === 0 ? text.empty : describe(info));
    put(summary, n === 0 ? '' : text.summary(snap.counts));
  };
  /** Xem v sợi đầu: móc chỉ vẽ v lần đầu (nấc N: vẽ đủ, móc ghi lại mỗi khung); ?freeze thì vẽ lại đúng khung N. */
  const view = (v) => {
    k = Math.min(v, total());
    draws.limit(k >= total() ? null : k);
    sync();
    return api.redraw();
  };
  const refresh = () => {
    if (following()) {
      take();
      k = total();
    }
    sync();
  };

  const stopPlay = () => {
    if (!play) return;
    win.clearTimeout(play.timer);
    play = null;
    button.setAttribute('aria-pressed', 'false');
  };
  /** Vẽ lại khung hỏng (lỗi trong khung): "Dệt lại" dừng, không kẹt ở trạng thái đang chạy. */
  const warn = (err) => {
    stopPlay();
    console.warn('Từng sợi: vẽ lại khung hỏng:', err);
  };
  /**
   * Hẹn bước kế tiếp SAU KHI khung trước đã vẽ xong: lần vẽ lại chậm của ?freeze không làm các bước dồn lại. Mỗi bước đi
   * playStride(N) sợi (bản chụp đứng yên suốt lượt nên N không đổi); bước cuối đáp đúng nấc N.
   */
  const next = (mine) => {
    if (play !== mine) return; // đã dừng (bấm lại, kéo thanh, tắt công cụ) trong lúc chờ vẽ
    mine.timer = win.setTimeout(() => {
      const n = total();
      const to = Math.min(k + playStride(n), n);
      const last = to === n;
      if (last) stopPlay(); // tới nấc N: ảnh đủ, thanh lại theo khung mới
      view(to).then(() => last || next(mine), warn);
    }, playStepMs(total()));
  };
  const startPlay = () => {
    if (following()) take(); // rời khung đủ: chụp đúng danh sách mà limit() sắp cắt
    if (total() === 0) return;
    const mine = { timer: 0 };
    play = mine;
    button.setAttribute('aria-pressed', 'true');
    view(0).then(() => next(mine), warn);
  };
  range.addEventListener('input', () => {
    if (following()) take();
    stopPlay(); // kéo thanh thì "Dệt lại" dừng
    view(Number(range.value)).catch(warn);
  });

  /** Tắt (hay gỡ): bỏ giới hạn rồi gỡ móc, cảnh vẽ đủ như chưa có gì. false nếu vốn đã tắt. */
  const off = () => {
    if (!on) return false;
    on = false;
    stopPlay();
    win.clearInterval(poll);
    draws.limit(null);
    draws.stop();
    return true;
  };

  return {
    activate(value) {
      if (!value) {
        if (off()) api.redraw().catch(warn);
        return;
      }
      if (on) return;
      on = true;
      draws.start(); // khung vẽ kế tiếp được ghi; tới lúc đó list() còn rỗng
      snap = { draws: [], counts: null };
      k = 0;
      sync(); // "Đang đếm các lần vẽ…"
      poll = win.setInterval(refresh, POLL_MS);
      // ?freeze: vòng lặp đã dừng, chỉ có khung vẽ lại này đi qua móc. Thanh hiện danh sách ngay khi khung đó được ghi.
      api.redraw().then(() => on && refresh(), warn);
    },
    dispose() {
      off();
    },
  };
}
```
Áp vào `src/engine/tools/index.js`:

```diff
diff --git a/src/engine/tools/index.js b/src/engine/tools/index.js
index c8945c1..b868b14 100644
--- a/src/engine/tools/index.js
+++ b/src/engine/tools/index.js
@@ -1,6 +1,7 @@
 // engine/tools/index.js — các công cụ học của xưởng, theo thứ tự trên mục "Đồ nghề". Thêm một công cụ = thêm một dòng.
 import * as kinhMai from './kinh-mai.js';
 import * as lotLop from './lot-lop.js';
+import * as tungSoi from './tung-soi.js';
 
 /** @type {import('../contracts/runtime.js').Tool[]} */
-export const tools = [kinhMai, lotLop];
+export const tools = [kinhMai, lotLop, tungSoi];
```
Áp vào `src/ui/strings.vi.js`:

```diff
diff --git a/src/ui/strings.vi.js b/src/ui/strings.vi.js
index 465442b..0303818 100644
--- a/src/ui/strings.vi.js
+++ b/src/ui/strings.vi.js
@@ -33,6 +33,10 @@ export function formatSeal({ day, month, leap, can, chi }, { traditional = false
   return `${day} tháng ${name}${leap ? ' nhuận' : ''} · ${CAN[can]} ${CHI[chi]}`;
 }
 
+const COUNT = new Intl.NumberFormat('vi');
+/** Số đếm kiểu Việt, dấu chấm ngăn hàng nghìn (1.200), như số đo của Sổ tay: số lần vẽ, số bản, số tam giác. */
+const num = (v) => COUNT.format(v);
+
 const t = {
   lang: 'vi',
   tierName: { webgpu: 'WebGPU', webgl2: 'WebGL2', static: 'Tranh tĩnh' },
@@ -95,6 +99,23 @@ const t = {
       name: 'Lột lớp',
       label: 'Lột dần ảnh',
     },
+    /** GĐ 5: mỗi sợi là một lần vẽ (draw call) của lượt vẽ cảnh; info là một DrawInfo của móc lần vẽ (engine/gpu/draws.js). */
+    'tung-soi': {
+      name: 'Từng sợi',
+      label: 'Sợi',
+      play: 'Dệt lại',
+      counting: 'Đang đếm các lần vẽ…',
+      empty: 'Chưa vẽ sợi nào: chỉ còn màu nền xóa khung, vẫn qua hậu kỳ.',
+      step: (k, n) => `${num(k)}/${num(n)}`,
+      valuetext: (k, n, label) => (k === 0 ? `Sợi 0 trên ${num(n)}: chưa vẽ gì` : `Sợi ${num(k)} trên ${num(n)}: ${label}`),
+      detail: ({ label, layer, kind, instances, triangles }) => `${label} · ${layer ? `lớp ${layer}` : 'không thuộc lớp nào'} · `
+        + `${kind}${instances > 1 ? ` × ${num(instances)}` : ''} · ${num(triangles)} tam giác.`,
+      /** Câu thêm sau dòng mô tả khi vật kéo theo lần vẽ lồng (mặt soi: reflector vẽ lại cảnh ngay trước khi vật được vẽ). */
+      nested: (count) => `Trước khi vẽ vật này, GPU vẽ lại ${num(count)} lần cho ảnh phản chiếu.`,
+      summary: ({ scene, reflection, other }) => `Khung này: lượt vẽ cảnh ${num(scene)} · phản chiếu ${num(reflection)} · `
+        + `các lượt khác (bóng, bloom, hậu kỳ) ${num(other)} draw call.`,
+      note: 'Bóng đổ và ảnh phản chiếu vẽ ở lượt riêng, nên lúc nào cũng đủ, kể cả khi các vật sau chưa được vẽ ở lượt chính.',
+    },
   },
   /** Các view của xưởng mà công cụ nhìn được; tap của lớp lấy nhãn ở content của lớp. */
   views: { final: 'Ảnh cuối', emissive: 'Chỉ emissive', normal: 'Normal', depth: 'Depth' },
```
Áp vào `src/styles/tools.css`:

```diff
diff --git a/src/styles/tools.css b/src/styles/tools.css
index 8a6364c..9f4959b 100644
--- a/src/styles/tools.css
+++ b/src/styles/tools.css
@@ -39,14 +39,25 @@
   cursor: pointer;
 }
 .tool-panel button[aria-pressed='true'] { color: var(--den-then); background: var(--vang-la); border-color: var(--vang-la); }
+/* "Dệt lại" khóa khi Từng sợi đang đếm lần vẽ: màu riêng ở trên đè màu xám mặc định của trình duyệt, nên tự làm nhạt. */
+.tool-panel button:disabled { cursor: default; opacity: 0.55; }
 .tool-panel :focus-visible,
 .lens-handle:focus-visible { outline: 2px solid var(--vang-la-sang); outline-offset: 2px; }
 .tool-panel label { font: 600 12px/1.3 var(--sans); color: var(--vang-la); }
 .tool-panel input[type='range'] { width: min(260px, 50vw); accent-color: var(--vang-la); }
 .tool-value { min-width: 7em; font: 400 12px/1.3 var(--mono); color: var(--vang-la-sang); }
-/* Vùng aria-live: luôn có mặt, trống thì thu lại (không dùng hidden hay display: none). */
-.tool-status { margin: 0; font-size: 12px; color: var(--vang-la-sang); }
+/* Vùng aria-live: luôn có mặt, trống thì thu lại (không dùng hidden hay display: none). Các dòng chữ dưới hàng chỉ bỏ lề
+   DƯỚI mặc định của <p>: `margin: 0` ngang độ ưu tiên với `.tool-panel > * + *` mà đứng sau sẽ xóa luôn khoảng 8px phía trên. */
+.tool-status { margin-bottom: 0; font-size: 12px; color: var(--vang-la-sang); }
 .tool-panel > .tool-status:empty { margin-top: 0; }
+/* Từng sợi (GĐ 5): dòng mô tả sợi đang xem (màu chữ của bảng), tóm tắt khung (trống khi đang đếm), ghi chú tĩnh; nhạt dần. */
+.tool-detail,
+.tool-summary,
+.tool-note { margin-bottom: 0; font-size: 12px; line-height: 1.5; }
+.tool-summary { color: var(--bac-la); }
+/* Không in nghiêng: trang không tải bản nghiêng của Be Vietnam Pro, trình duyệt sẽ tự xiên chữ (dấu tiếng Việt xấu đi). */
+.tool-note { color: color-mix(in srgb, var(--bac-la) 75%, transparent); }
+.tool-panel > .tool-summary:empty { margin-top: 0; }
 
 /* Tay nắm của hình gạt: một dải dọc cả khung ở vị trí --split (0–1); vạch vàng lá ở giữa, núm tròn ở giữa chiều cao.
    Kéo bằng chuột hay ngón tay (touch-action: none để trình duyệt không cuộn trang thay vì kéo). */
```

Bộ chọn của e2e Lột lớp (Task 12 chạy e2e):

Áp vào `e2e/painting.spec.js`:

```diff
diff --git a/e2e/painting.spec.js b/e2e/painting.spec.js
index 5228721..722173c 100644
--- a/e2e/painting.spec.js
+++ b/e2e/painting.spec.js
@@ -394,7 +394,7 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       await still(page, testInfo);
       const base = (await canvasRegions(page)).all;
       await page.evaluate(() => window.__sma.setTool('lot-lop'));
-      const range = page.locator('[data-toolbar] input[type="range"]');
+      const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]'); // Từng sợi cũng có một thanh trong [data-toolbar]
       const last = Number(await range.getAttribute('max'));
       const slide = async (v) => {
         const before = await range.getAttribute('aria-valuetext');
```

Run: `npx vitest run tests/unit/tung-soi.test.js tests/paintings/html.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  791 passed`.

```bash
git add e2e/painting.spec.js src/engine/tools/index.js src/engine/tools/tung-soi.js src/styles/tools.css src/ui/strings.vi.js tests/paintings/html.test.js tests/unit/tung-soi.test.js
git commit -F - <<'EOF'
feat(engine): công cụ Từng sợi (thanh 0 → N lần vẽ của lượt vẽ cảnh, nút "Dệt lại", dòng mô tả sợi và tóm tắt khung)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Đường trôi của hoa đăng (`parts/anh-trang-drift.js`, hàm thuần)

**Mục tiêu:** Spec §4.2 "(GĐ 5) Thả hoa đăng", §6 Lớp 2 ("đường trôi tính thẳng theo thời gian"). Mọi luật của một ngọn hoa đăng nằm trong một file hàm thuần, không import three (chỉ `lib/random.js`), nên test và e2e gọi thẳng được:
- **`DRIFT`:** tốc độ 0,6 đơn vị/giây khi đã trôi đều, khởi đầu mềm trong 4 giây, lượn ngang 0,6, xoay chậm, búp nở trong 1,5 giây, sáng dần trong 0,5 giây. Đèn sống tối đa 90 giây, chìm trong 3 giây, và chìm khi còn cách bờ 4 đơn vị. Task 15 đo lại tốc độ trên GPU thật (giữ 0,6); một test giữ bất biến "lượn + quãng trôi lúc chìm < khoảng chừa ở mép", để đèn luôn chìm hẳn trước khi chạm bờ.
- **`driftDirection(x, z, moon)`:** hướng tới một điểm cách chỗ đứng của camera (0, 32) 100 đơn vị theo phương vị trăng, chốt một lần lúc thả. Điểm đó luôn nằm NGOÀI ao (cách tâm ít nhất 100 − 32 = 68 > 60). Nếu đích nằm trong ao, đèn thả xa hơn đích sẽ quay đầu trôi về phía người xem.
- **`createLanternSlots(capacity, { pond })`:** vòng đệm N + 1 ô. Ao giữ tối đa N đèn đang nổi; thả thêm thì đèn thả sớm nhất chìm sớm, và ô thừa là chỗ cho nó chìm dần (không biến mất ngay). Đèn thả ở dải sát bờ mà hướng ra ngoài thì chìm ngay, và không bắt đèn nào khác chìm theo. Lúc chạm vùng mép (`edgeAt`) được tính một lần lúc thả (Newton trên luật khởi đầu mềm). Mỗi lần thả có số thứ tự `seq` (tách được cả nhiều lần thả cùng một t khi `?freeze`) và một pha lệch góc vàng.
- **`lanternAt(slot, t)`:** trả `{ alive, x, z, yaw, open, glow, sink }`, tính thẳng từ t.
- **`verseOrder(keys, now)`:** xáo bằng mulberry32 với hạt giống là số thứ tự của ĐÊM theo giờ Việt Nam (từ 12 giờ trưa tới 12 giờ trưa hôm sau). Nhờ vậy cả đêm của bức (18:00 → 05:30) chỉ có một thứ tự, không đổi lúc nửa đêm.

Vì sao tính thẳng theo thời gian (dạng đóng) thay vì cộng dồn `x += v·dt` mỗi khung:
- `?freeze=N` và `update(0, t)` vẽ lại đúng khung N;
- máy nhanh hay chậm đều ra cùng một đường trôi;
- test kiểm được bằng số.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/anh-trang-drift.js`
- Test: `tests/paintings/ao-sen-dem/anh-trang-drift.test.js` (mới)

**Interfaces:**
- Consumes: `mulberry32` (`lib/random.js`).
- Produces:
  - `DRIFT`; `driftDirection(x, z, moon, { origin = [0, 32], reach = 100 }) → [dx, dz]`;
  - `createLanternSlots(capacity, { pond = 60 }) → { capacity, slots, release({ x, z, t, dir, key, phase? }) → số ô, alive(t) }`;
  - `lanternAt(slot, t)`; `verseOrder(keys, now)`; typedef `LanternSlot { x, z, t0, dx, dz, phase, key, sinkAt, edgeAt, seq }`.

  Task 9 dùng vòng đệm và `lanternAt`; Task 11 dùng `driftDirection` và `verseOrder`; e2e (Task 12) import được file này trong Node.

- [ ] **Step 1: Test (hỏng: chưa có file)**

Tạo `tests/paintings/ao-sen-dem/anh-trang-drift.test.js`:

```js
// tests/paintings/ao-sen-dem/anh-trang-drift.test.js — đường trôi của hoa đăng (hàm thuần): nở, trôi về lối trăng, chìm, vòng đệm N + 1 ô, thứ tự thơ.
import { describe, it, expect } from 'vitest';
import {
  DRIFT,
  createLanternSlots,
  driftDirection,
  lanternAt,
  verseOrder,
} from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { mulberry32, randRange } from '../../../src/lib/random.js';

const POND = 60; // POND_RADIUS của shared.js: mặc định của createLanternSlots
const SOUTH = { x: 0, z: -1 }; // trăng ở chính nam: lối trăng chạy dọc trục z, từ camera (z = 32) ra xa
const vn = (s) => new Date(`${s}+07:00`);
// Khóa của mười hai cặp câu thơ (spec §5).
const KEYS = [
  'den-khoe', 'trang-khoe', 'thuyen-ve', 'gio-dua', 'mit-mu', 'trang-bao-nhieu',
  'thach-luu', 'chen-ruou', 'guong-nga', 'ao-thu', 'lung-giau', 'nuoc-biec',
];

/** Thả MỘT đèn vào một vòng đệm mới và trả ô của nó. Mặc định hướng trôi theo trăng ở chính nam. */
function releaseOne({ x = 0, z = 0, t = 0, dir = driftDirection(x, z, SOUTH), phase } = {}) {
  const ring = createLanternSlots(4);
  return ring.slots[ring.release({ x, z, t, dir, key: 'den-khoe', phase })];
}

/** Số đèn đang nổi (còn sống, chưa bắt đầu chìm) ở thời điểm t. */
const afloat = (ring, t) => ring.slots.filter((s) => {
  const l = lanternAt(s, t);
  return l.alive && l.sink === 0;
}).length;

/** Quãng đi dọc theo hướng trôi và độ lệch ngang so với chỗ thả. */
function offset(slot, l) {
  const [ox, oz] = [l.x - slot.x, l.z - slot.z];
  return { along: ox * slot.dx + oz * slot.dz, across: Math.abs(oz * slot.dx - ox * slot.dz) };
}

describe('lanternAt: một ngọn hoa đăng theo thời gian', () => {
  it('lúc thả: đúng chỗ thả, búp còn khép, chưa sáng; sáng dần rồi 1,5 giây sau nở đủ', () => {
    const slot = releaseOne({ x: -6, z: 10, t: 5, phase: 1 }); // pha khác 0: lúc thả không lệch là nhờ thừa số đà của lượn ngang
    const start = lanternAt(slot, 5);
    expect(start).toMatchObject({ alive: true, open: 0, glow: 0, sink: 0 });
    expect([start.x, start.z]).toEqual([-6, 10]);
    const kindling = lanternAt(slot, 5 + DRIFT.glowIn / 2);
    expect(kindling.glow).toBeGreaterThan(0);
    expect(kindling.glow).toBeLessThan(1);
    expect(lanternAt(slot, 5 + DRIFT.glowIn).glow).toBe(1);
    const opening = lanternAt(slot, 5 + DRIFT.open / 2).open;
    expect(opening).toBeGreaterThan(0);
    expect(opening).toBeLessThan(1);
    expect(lanternAt(slot, 5 + DRIFT.open).open).toBe(1);
    expect(lanternAt(slot, 5 + 30).open).toBe(1);
  });

  it('đi theo hướng trôi: sau 20 giây đã ra xa chỗ thả theo dir, quãng đường khớp tốc độ; lúc đầu rất chậm (khởi đầu mềm)', () => {
    const slot = releaseOne({ x: -6, z: 10 });
    const { along, across } = offset(slot, lanternAt(slot, 20));
    expect(along).toBeGreaterThan(DRIFT.speed * (20 - DRIFT.ease)); // đà lấy xong thì trôi đều
    expect(along).toBeLessThan(DRIFT.speed * 20);
    expect(across).toBeLessThanOrEqual(DRIFT.sway); // chỉ lượn nhẹ hai bên đường trôi
    expect(offset(slot, lanternAt(slot, 1)).along).toBeLessThan(DRIFT.speed * 0.25);
    const later = offset(slot, lanternAt(slot, 50)).along - offset(slot, lanternAt(slot, 40)).along;
    expect(later).toBeCloseTo(DRIFT.speed * 10, 2);
  });

  it('xoay chậm theo DRIFT.spin; mỗi lần thả một pha riêng (lệch góc vàng), truyền phase thì dùng đúng phase đó', () => {
    const slot = releaseOne({ phase: 1 });
    expect(slot.phase).toBe(1);
    expect(lanternAt(slot, 0).yaw).toBe(1);
    expect(lanternAt(slot, 10).yaw).toBeCloseTo(1 + DRIFT.spin * 10, 9);
    const ring = createLanternSlots(4);
    const phases = [0, 1, 2].map((k) => ring.slots[ring.release({ x: k, z: 0, t: k, dir: [0, -1], key: null })].phase);
    expect(new Set(phases).size).toBe(3);
    expect(phases[1] - phases[0]).toBeCloseTo(Math.PI * (3 - Math.sqrt(5)), 9);
  });

  it('tất định: cùng t thì cùng kết quả, gọi theo thứ tự nào cũng vậy; trước lúc thả hay ô trống thì không có đèn', () => {
    const slot = releaseOne({ x: 3, z: -4, t: 10 });
    const first = lanternAt(slot, 37.25);
    lanternAt(slot, 80);
    lanternAt(slot, 11);
    expect(lanternAt(slot, 37.25)).toEqual(first);
    expect(lanternAt(slot, 9.99)).toMatchObject({ alive: false, glow: 0 });
    const ring = createLanternSlots(3);
    for (const s of ring.slots) expect(lanternAt(s, 0)).toMatchObject({ alive: false, glow: 0 });
    expect(ring.alive(0)).toBe(0);
  });

  it('tới vùng mép (còn cách bờ DRIFT.margin) thì chìm dần trong DRIFT.sink giây rồi tắt; sau khi chìm độ sáng 0', () => {
    const slot = releaseOne({ x: 0, z: -40, dir: [0, -1] }); // trôi thẳng ra mép xa
    const edge = slot.edgeAt;
    expect(edge).toBeGreaterThan(DRIFT.open);
    expect(edge).toBeLessThan(DRIFT.life);
    const atEdge = lanternAt(slot, edge);
    expect(Math.hypot(atEdge.x, atEdge.z)).toBeCloseTo(POND - DRIFT.margin, 1);
    expect(lanternAt(slot, edge - 0.01)).toMatchObject({ alive: true, sink: 0, glow: 1 });
    const sinking = lanternAt(slot, edge + DRIFT.sink / 2);
    expect(sinking.alive).toBe(true);
    expect(sinking.sink).toBeCloseTo(0.5, 6);
    expect(sinking.glow).toBeCloseTo(0.5, 6); // tắt dần theo độ chìm
    expect(lanternAt(slot, edge + DRIFT.sink + 0.01)).toMatchObject({ alive: false, glow: 0, sink: 1 });
  });

  it('quá DRIFT.life giây thì chìm dù chưa tới mép', () => {
    // Thả gần bờ phía camera, trôi ngang qua cả ao: 106 đơn vị mới tới vùng mép bên kia, lâu hơn DRIFT.life với mọi tốc độ ≤ 1,1.
    const slot = releaseOne({ x: 0, z: 50, t: 10, dir: [0, -1] });
    expect(slot.edgeAt).toBeGreaterThan(10 + DRIFT.life);
    expect(lanternAt(slot, 10 + DRIFT.life - 0.01)).toMatchObject({ alive: true, sink: 0 });
    expect(lanternAt(slot, 10 + DRIFT.life + DRIFT.sink / 2).sink).toBeCloseTo(0.5, 6);
    expect(lanternAt(slot, 10 + DRIFT.life + DRIFT.sink + 0.01)).toMatchObject({ alive: false, glow: 0 });
  });

  it('thả sát bờ mà hướng ra ngoài: chìm ngay từ lúc thả', () => {
    const slot = releaseOne({ x: 0, z: -58, t: 2, dir: [0, -1] });
    expect(slot.edgeAt).toBe(2);
    expect(lanternAt(slot, 2 + DRIFT.sink / 2).sink).toBeCloseTo(0.5, 6);
    expect(lanternAt(slot, 2 + DRIFT.sink + 0.01).alive).toBe(false);
  });

  it('biên độ lượn cộng quãng trôi trong lúc chìm nhỏ hơn DRIFT.margin: chỉnh tốc độ thì đèn vẫn chìm hẳn trước khi chạm bờ', () => {
    expect(DRIFT.sway + DRIFT.speed * DRIFT.sink).toBeLessThan(DRIFT.margin);
  });

  it('ở trong ao suốt đời đèn: lúc nổi không ra quá vùng mép (cộng biên độ lượn), lúc chìm vẫn chưa chạm bờ', () => {
    let maxAfloat = 0;
    let maxAlive = 0;
    let sinkingSeen = 0;
    for (const moon of [SOUTH, { x: -0.34, z: -0.94 }, { x: 0.34, z: -0.94 }]) {
      for (let r = 0; r <= POND - DRIFT.margin; r += 14) {
        for (let a = 0; a < 6; a++) {
          const [x, z] = [r * Math.cos(a), r * Math.sin(a)];
          const slot = releaseOne({ x, z, dir: driftDirection(x, z, moon) });
          for (let t = 0; t <= DRIFT.life + DRIFT.sink; t += 0.25) {
            const l = lanternAt(slot, t);
            if (!l.alive) break;
            const d = Math.hypot(l.x, l.z);
            maxAlive = Math.max(maxAlive, d);
            if (l.sink === 0) maxAfloat = Math.max(maxAfloat, d);
            else sinkingSeen++;
          }
        }
      }
    }
    expect(sinkingSeen).toBeGreaterThan(0);
    expect(maxAfloat).toBeLessThanOrEqual(POND - DRIFT.margin + DRIFT.sway);
    expect(maxAlive).toBeLessThan(POND);
  });
});

describe('driftDirection: hướng về một điểm xa trên lối trăng', () => {
  it('là vector đơn vị, với mọi chỗ thả và mọi hướng trăng', () => {
    for (const [x, z] of [[-20, 10], [15, -5], [0, 0], [40, -30], [-50, -20]]) {
      for (const moon of [SOUTH, { x: -0.3, y: 0.2, z: -0.93 }, { x: 0.33, z: -0.94 }]) {
        const [dx, dz] = driftDirection(x, z, moon);
        expect(Math.hypot(dx, dz)).toBeCloseTo(1, 12);
      }
    }
  });

  it('trăng ở chính nam: thả bên trái lối trăng thì trôi sang phải và ra xa, bên phải thì sang trái', () => {
    const [lx, lz] = driftDirection(-20, 10, SOUTH);
    expect(lx).toBeGreaterThan(0);
    expect(lz).toBeLessThan(0);
    expect(driftDirection(20, 10, SOUTH)[0]).toBeLessThan(0);
    expect(driftDirection(0, 10, SOUTH)).toEqual([0, -1]); // đứng trên lối trăng thì trôi thẳng ra xa
  });

  it('nhắm đúng điểm cách camera (0, 32) một đoạn reach theo phương vị trăng; chỉ dùng x, z của trăng', () => {
    const azimuth = 0.3;
    const [sin, cos] = [Math.sin(azimuth), Math.cos(azimuth)];
    /** (đích − chỗ thả) song song và cùng chiều với hướng trôi. */
    const expectAims = ([dx, dz], [x, z], [tx, tz]) => {
      expect((tx - x) * dz - (tz - z) * dx).toBeCloseTo(0, 9);
      expect((tx - x) * dx + (tz - z) * dz).toBeGreaterThan(0);
    };
    const moon = { x: sin, y: 0.2, z: -cos };
    const dir = driftDirection(-10, 0, moon);
    expectAims(dir, [-10, 0], [100 * sin, 32 - 100 * cos]);
    expectAims(driftDirection(-10, 0, moon, { origin: [0, 20], reach: 30 }), [-10, 0], [30 * sin, 20 - 30 * cos]);
    const longer = driftDirection(-10, 0, { x: 2 * sin, z: -2 * cos }); // độ dài của vector trăng không đổi gì
    expect(longer[0]).toBeCloseTo(dir[0], 12);
    expect(longer[1]).toBeCloseTo(dir[1], 12);
  });

  it('đích nằm ngoài ao (reach 100): thả ở đâu trong ao cũng trôi ra xa người xem, không trôi ngược về phía camera', () => {
    // Camera đứng ở z = 32 nhìn về −z. Đích trong ao (reach 80 thì đích ở z = −48) làm đèn thả xa hơn đích quay đầu về camera.
    for (const moon of [SOUTH, { x: -0.34, z: -0.94 }, { x: 0.34, z: -0.94 }]) {
      for (let x = -POND; x <= POND; x += 6) {
        for (let z = -POND; z <= POND; z += 6) {
          if (Math.hypot(x, z) > POND) continue;
          expect(driftDirection(x, z, moon)[1], `(${x}, ${z})`).toBeLessThan(0);
        }
      }
    }
  });

  it('thả đúng điểm đích thì trôi theo phương vị trăng; trăng ở đỉnh đầu (x = z = 0) vẫn ra vector đơn vị', () => {
    expect(driftDirection(0, -68, SOUTH)).toEqual([0, -1]);
    const [dx, dz] = driftDirection(5, 5, { x: 0, y: 1, z: 0 });
    expect(Math.hypot(dx, dz)).toBeCloseTo(1, 12);
  });
});

describe('createLanternSlots: vòng đệm N + 1 ô', () => {
  it('thả quá sức chứa: đèn nổi lâu nhất chìm sớm (sinkAt = t), đèn mới vào ô thừa; alive(t) đếm cả đèn đang chìm', () => {
    const ring = createLanternSlots(2);
    expect(ring.capacity).toBe(2);
    expect(ring.slots).toHaveLength(3);
    const dir = [0, -1];
    const a = ring.release({ x: 0, z: 0, t: 0, dir, key: 'den-khoe' });
    const b = ring.release({ x: 5, z: 0, t: 1, dir, key: 'trang-khoe' });
    expect(ring.alive(1.5)).toBe(2);
    expect(ring.slots[b].key).toBe('trang-khoe');
    const c = ring.release({ x: -5, z: 0, t: 2, dir, key: 'thuyen-ve' }); // lần thả thứ capacity + 1
    expect(new Set([a, b, c]).size).toBe(3); // vào ô thừa, không đè đèn đang chìm
    expect(ring.slots[a].sinkAt).toBe(2);
    expect(ring.slots[b].sinkAt).toBe(Infinity);
    expect(afloat(ring, 2.01)).toBe(2);
    expect(ring.alive(2.01)).toBe(3);
    expect(lanternAt(ring.slots[a], 2.01).sink).toBeGreaterThan(0);
    expect(ring.alive(2 + DRIFT.sink + 0.01)).toBe(2);
    const d = ring.release({ x: 0, z: 5, t: 6, dir, key: null }); // đèn của ô a đã chìm hẳn: ô được dùng lại
    expect(d).toBe(a);
    expect(ring.slots[b].sinkAt).toBe(6); // b giờ là đèn nổi lâu nhất
    expect(ring.slots[d]).toMatchObject({ t0: 6, key: null, sinkAt: Infinity });
  });

  it('đèn thả ở vùng mép mà hướng ra ngoài (chìm ngay) không tính là đèn nổi: không bắt đèn nào chìm theo', () => {
    const ring = createLanternSlots(2);
    const a = ring.release({ x: 0, z: 0, t: 0, dir: [0, -1], key: null });
    const b = ring.release({ x: 5, z: 0, t: 1, dir: [0, -1], key: null });
    const c = ring.release({ x: 0, z: -58, t: 2, dir: [0, -1], key: null });
    expect(ring.slots[c].edgeAt).toBe(2);
    expect([ring.slots[a].sinkAt, ring.slots[b].sinkAt]).toEqual([Infinity, Infinity]);
    expect(afloat(ring, 2.01)).toBe(2);
    expect(ring.alive(2.01)).toBe(3);
  });

  it('chuỗi thả bất kỳ: số đèn nổi không bao giờ quá capacity, số đèn sống không quá capacity + 1', () => {
    const ring = createLanternSlots(4);
    const rng = mulberry32(5);
    let t = 0;
    let fullSeen = 0;
    for (let k = 0; k < 300; k++) {
      t += rng() * rng() * 6; // phần lớn thả sát nhau, thỉnh thoảng cách xa
      const [x, z] = [randRange(rng, -30, 30), randRange(rng, -30, 20)];
      ring.release({ x, z, t, dir: driftDirection(x, z, SOUTH), key: null });
      const later = t + 0.001; // lần thả vừa ép một đèn chìm: 1 ms sau đèn đó đã chìm một chút
      expect(afloat(ring, later)).toBeLessThanOrEqual(4);
      expect(ring.alive(later)).toBeLessThanOrEqual(5);
      expect(ring.alive(later)).toBe(ring.slots.filter((s) => lanternAt(s, later).alive).length);
      if (ring.alive(later) === 5) fullSeen++;
    }
    expect(fullSeen).toBeGreaterThan(0);
  });

  it('thả dồn dập (10 lần trong 1 giây): không lỗi; hết ô trống thì dùng lại ô có đèn chìm lâu nhất', () => {
    const ring = createLanternSlots(2);
    const used = [];
    for (let k = 0; k < 10; k++) {
      const t = k * 0.1;
      const states = ring.slots.map((s) => lanternAt(s, t));
      const free = states.some((l) => !l.alive);
      const longest = states.reduce((best, l, i) => (l.alive && l.sink > (states[best]?.sink ?? 0) ? i : best), -1);
      const i = ring.release({ x: k, z: 0, t, dir: [0, -1], key: null });
      if (!free) expect(i).toBe(longest);
      used.push(i);
      expect(afloat(ring, t + 0.001)).toBeLessThanOrEqual(2);
    }
    expect(used).toEqual([0, 1, 2, 0, 1, 2, 0, 1, 2, 0]);
  });

  it('đồng hồ đứng (?freeze): nhiều lần thả cùng một t vẫn xoay vòng theo thứ tự thả', () => {
    const ring = createLanternSlots(2);
    const used = Array.from({ length: 7 }, (_, k) => ring.release({ x: k, z: 0, t: 0, dir: [0, -1], key: null }));
    expect(used).toEqual([0, 1, 2, 0, 1, 2, 0]);
    expect(afloat(ring, 0.01)).toBe(2);
    expect(ring.alive(0)).toBe(3);
  });

  it('capacity phải là số nguyên ≥ 1 (budget.lanterns): sai thì báo lỗi ngay lúc dựng', () => {
    expect(() => createLanternSlots(0)).toThrow(/capacity/);
    expect(() => createLanternSlots(undefined)).toThrow(/capacity/);
    expect(() => createLanternSlots(2.5)).toThrow(/capacity/);
  });
});

describe('verseOrder: thứ tự thơ của một đêm', () => {
  it('là một hoán vị của các khóa, mảng gốc giữ nguyên; keys rỗng → []', () => {
    const order = verseOrder(KEYS, vn('2026-10-02T21:00'));
    expect([...order].sort()).toEqual([...KEYS].sort());
    expect(order).not.toBe(KEYS);
    expect(KEYS[0]).toBe('den-khoe');
    expect(verseOrder([], vn('2026-10-02T21:00'))).toEqual([]);
    expect(verseOrder(['ao-thu'], vn('2026-10-02T21:00'))).toEqual(['ao-thu']);
  });

  it('cả một đêm (từ 12 giờ trưa tới 12 giờ trưa hôm sau, giờ Việt Nam) một thứ tự: đêm của bức 18:00 → 05:30 không đổi giữa chừng', () => {
    const night = verseOrder(KEYS, vn('2026-10-02T18:00'));
    for (const at of ['2026-10-02T12:00', '2026-10-02T23:59', '2026-10-03T00:01', '2026-10-03T05:30', '2026-10-03T11:59']) {
      expect(verseOrder(KEYS, vn(at)), at).toEqual(night);
    }
    // 06:00 và 08:00 ngày 3/10 giờ Việt Nam là 23:00 ngày 2/10 và 01:00 ngày 3/10 giờ UTC: ngày UTC đổi, đêm thì không.
    expect(verseOrder(KEYS, vn('2026-10-03T06:00'))).toEqual(verseOrder(KEYS, vn('2026-10-03T08:00')));
  });

  it('khác đêm thì khác thứ tự (ở các cặp đêm đã chọn), kể cả hai phút quanh 12 giờ trưa giờ Việt Nam', () => {
    const nights = ['2026-09-28', '2026-09-29', '2026-10-02', '2026-12-31'].map((d) => verseOrder(KEYS, vn(`${d}T21:00`)));
    for (let i = 0; i < nights.length; i++) {
      for (let j = i + 1; j < nights.length; j++) expect(nights[i]).not.toEqual(nights[j]);
    }
    expect(verseOrder(KEYS, vn('2026-10-03T11:59'))).not.toEqual(verseOrder(KEYS, vn('2026-10-03T12:01')));
  });
});
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang-drift.test.js`
Kết quả mong đợi: FAIL, 1 file test không chạy được; lỗi đầu tiên: `Error: Cannot find module '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js' imported from tests/paintings/ao-sen-dem/anh-trang-drift.test.js`.

- [ ] **Step 2: Code**

Tạo `src/paintings/ao-sen-dem/parts/anh-trang-drift.js`:

```js
// paintings/ao-sen-dem/parts/anh-trang-drift.js — đường trôi của hoa đăng: vòng đệm các lần thả, vị trí/độ nở/độ sáng tính thẳng theo thời gian, thứ tự thơ theo đêm.
import { mulberry32 } from '../../../lib/random.js';

// Điểm học: đường trôi tính THẲNG theo thời gian (dạng đóng: vị trí = f(t − lúc thả)), không cộng dồn từng khung
// (x += v·dt). Nhờ vậy:
// - `?freeze=N` và `update(0, t)` vẽ lại đúng khung N: vị trí chỉ phụ thuộc t, không phụ thuộc đã chạy bao nhiêu khung;
// - máy chậm (dt lớn) hay máy nhanh (dt nhỏ) đều ra đúng một đường, không lệch dần vì sai số cộng dồn;
// - test kiểm bằng số, không phải chạy vòng lặp.
// File này không import three, nên test và e2e gọi thẳng được (đoán trước thứ tự thơ theo ?at).

/** Luật trôi của hoa đăng: đơn vị cảnh, giây theo đồng hồ của cảnh (ctx.u.time). */
export const DRIFT = Object.freeze({
  speed: 0.6, // đơn vị/giây khi đã trôi đều: đèn thả trước mặt đi được nửa đường tới lối trăng trong một đời đèn
  ease: 4, // giây để đạt tốc độ đều (khởi đầu mềm)
  sway: 0.6, // biên độ lượn ngang
  swayRate: 0.35, // rad/giây
  spin: 0.12, // rad/giây, đèn xoay chậm
  open: 1.5, // giây để búp nở đủ
  glowIn: 0.5, // giây để ngọn nến sáng đủ
  life: 90, // giây tối đa trên mặt nước
  sink: 3, // giây chìm dần
  margin: 4, // chìm khi còn cách mép ao bấy nhiêu
});

// Góc vàng π(3 − √5) ≈ 137,5°: pha của các lần thả liên tiếp cách nhau góc này thì không bao giờ trùng nhau, cũng không
// dồn về vài góc (như cách hạt hướng dương xếp vòng). Hai đèn thả liền nhau quay mặt khác nhau và lượn lệch nhịp.
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DAY_MS = 24 * 3600 * 1000;
const VN_OFFSET_MS = 7 * 3600 * 1000; // giờ Việt Nam là UTC+7, không có giờ mùa hè
const NOON_MS = 12 * 3600 * 1000; // một "đêm" tính từ 12 giờ trưa tới 12 giờ trưa hôm sau

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

/** smoothstep như GLSL: 0 trước e0, 1 sau e1, ở giữa cong chữ S (bắt đầu và dừng đều mềm). */
function smoothstep(e0, e1, v) {
  const k = clamp01((v - e0) / (e1 - e0));
  return k * k * (3 - 2 * k);
}

/** Vector đơn vị theo (x, z); dài 0 thì trả (fx, fz), để không chia cho 0. */
function unit(x, z, fx, fz) {
  const length = Math.hypot(x, z);
  return length > 1e-9 ? [x / length, z / length] : [fx, fz];
}

/**
 * Hướng trôi (vector đơn vị trên mặt nước) từ (x, z) tới một điểm xa trên lối trăng: điểm cách chỗ đứng của camera `reach`
 * đơn vị theo phương vị của trăng. Tính MỘT lần lúc thả: kéo thanh giờ sau đó không làm đèn đổi đường.
 * Lối trăng là dải nước nối mắt người xem với bóng trăng, nên nhắm tới một điểm trên dải đó (chứ không đi song song với
 * phương vị trăng) thì đèn thả ở đâu cũng dần đi vào lối trăng. reach 100 đặt điểm đó NGOÀI ao (cách tâm ít nhất
 * 100 − 32 = 68 > 60, trăng ở hướng nào cũng vậy): đích mà nằm trong ao thì đèn thả xa hơn đích sẽ quay đầu về phía camera.
 * @param {number} x @param {number} z
 * @param {{ x: number, z: number }} moon  hướng tới trăng (chỉ dùng x, z), như shared.moon.dir.value
 * @param {{ origin?: [number, number], reach?: number }} [opts]
 *   origin = (x, z) của camera trên mặt nước (Bức 1: [0, 32], painting.js); reach mặc định 100
 * @returns {[number, number]}
 */
export function driftDirection(x, z, moon, { origin = [0, 32], reach = 100 } = {}) {
  const [ax, az] = unit(moon.x, moon.z, 0, -1); // trăng ở đỉnh đầu thì coi như ở phía trước camera (−z)
  return unit(origin[0] + ax * reach - x, origin[1] + az * reach - z, ax, az); // đứng đúng điểm đích: trôi theo phương vị
}

/** Quãng đã trôi sau `age` giây: vận tốc tăng mềm từ 0 lên speed theo (1 − e^(−age/ease)); quãng là tích phân của nó. */
function distanceAt(age) {
  return DRIFT.speed * (age - DRIFT.ease * (1 - Math.exp(-age / DRIFT.ease)));
}

/**
 * Tuổi (giây) lúc đèn đi được quãng s, tức nghiệm của distanceAt(a) = s. Phương trình này không giải ra công thức được,
 * nên dùng Newton: a ← a − (distanceAt(a) − s) / vận tốc(a). distanceAt tăng và lồi, nên đi từ một điểm bên phải nghiệm
 * thì mỗi bước tiến về nghiệm mà không vượt qua. Chỉ chạy MỘT lần lúc thả.
 */
function ageAt(s) {
  let a = s / DRIFT.speed + DRIFT.ease; // trôi đều lâu rồi thì s ≈ speed·(a − ease): điểm này luôn ở bên phải nghiệm
  for (let i = 0; i < 32; i++) {
    const step = (distanceAt(a) - s) / (DRIFT.speed * (1 - Math.exp(-a / DRIFT.ease)));
    a -= step;
    if (step < 1e-6) break;
  }
  return a;
}

/**
 * Tuổi lúc đèn tới vùng mép (cách tâm ao `radius`) khi đi thẳng theo (dx, dz) từ (x, z). Chỗ ra khỏi vòng tròn là nghiệm
 * lớn của |p + s·d|² = radius², một phương trình bậc hai theo quãng s. Bỏ qua lượn ngang: biên độ lượn cộng quãng trôi
 * trong lúc chìm (sway + speed × sink = 0,6 + 0,6 × 3; test giữ) vẫn nhỏ hơn DRIFT.margin, nên đèn thả trong vòng chìm hẳn
 * trước khi chạm bờ. Thả ngoài vòng (dải sát bờ) mà không hướng vào trong thì trả 0: chìm ngay.
 */
function edgeAge(x, z, dx, dz, radius) {
  const b = x * dx + z * dz;
  const disc = b * b - (x * x + z * z) + radius * radius;
  const s = disc > 0 ? Math.sqrt(disc) - b : 0;
  return s > 0 ? ageAt(s) : 0;
}

/**
 * @typedef {{ x: number, z: number, t0: number, dx: number, dz: number, phase: number, key: string | null,
 *   sinkAt: number, edgeAt: number, seq: number }} LanternSlot
 *  t0 = -Infinity khi ô trống; sinkAt = Infinity khi chưa bị ép chìm; edgeAt = lúc chạm vùng mép (tính lúc thả);
 *  seq = thứ tự của lần thả (-1 khi ô trống).
 */

/** Ô trống: t0 = −∞ nên lúc bắt đầu chìm cũng là −∞, không bao giờ sống. */
const emptySlot = () => ({
  x: 0, z: 0, t0: -Infinity, dx: 0, dz: -1, phase: 0, key: null, sinkAt: Infinity, edgeAt: Infinity, seq: -1,
});

/** Lúc đèn bắt đầu chìm: hết đời, tới vùng mép, hay bị ép chìm vì thả quá số đèn; cái nào tới trước. */
const sinkStart = (slot) => Math.min(slot.t0 + DRIFT.life, slot.edgeAt, slot.sinkAt);
/** Đã thả và chưa chìm hẳn: đang nổi hay đang chìm. */
const isAlive = (slot, t) => slot.t0 <= t && t < sinkStart(slot) + DRIFT.sink;
/** Đang nổi: đã thả, chưa bắt đầu chìm. */
const isAfloat = (slot, t) => slot.t0 <= t && t < sinkStart(slot);

/**
 * Ô có đèn chìm lâu nhất (bắt đầu chìm sớm nhất; cùng lúc thì thả trước). Chỉ gọi khi mọi ô đều có đèn sống. Lúc đó luôn
 * có đèn đang chìm (capacity + 1 ô mà tối đa capacity − 1 đèn nổi), và đèn đang chìm bắt đầu chìm trước mọi đèn đang nổi.
 */
function longestSinking(slots) {
  let best = 0;
  for (let i = 1; i < slots.length; i++) {
    const [a, b] = [sinkStart(slots[i]), sinkStart(slots[best])];
    if (a < b || (a === b && slots[i].seq < slots[best].seq)) best = i;
  }
  return best;
}

/**
 * Vòng đệm các lần thả: capacity + 1 ô. Ao giữ tối đa `capacity` đèn đang nổi; thả thêm thì đèn thả sớm nhất chìm sớm.
 * Ô thừa là chỗ cho đèn đang chìm đó: đèn cũ chìm dần trong DRIFT.sink giây chứ không biến mất ngay.
 * @param {number} capacity  số đèn trôi tối đa (budget.lanterns)
 * @param {{ pond?: number }} [opts]  pond = bán kính ao (Bức 1: POND_RADIUS 60 ở shared.js; file này không import shared.js
 *   vì shared.js kéo theo three). Dùng lúc thả để tính edgeAt.
 * @returns {{ capacity: number, slots: LanternSlot[],
 *   release: (r: { x: number, z: number, t: number, dir: [number, number], key?: string | null, phase?: number }) => number,
 *   alive: (t: number) => number }}
 */
export function createLanternSlots(capacity, { pond = 60 } = {}) {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error(`createLanternSlots: capacity phải là số nguyên ≥ 1 (budget.lanterns), nhận được ${capacity}`);
  }
  const slots = Array.from({ length: capacity + 1 }, emptySlot);
  let released = 0; // số lần đã thả: thứ tự thả (seq) và pha mặc định
  return {
    capacity,
    slots,
    /**
     * Thả một đèn lúc t (giây của ctx.u.time), trả số ô. dir là vector đơn vị (driftDirection), key là khóa của câu thơ.
     * Thứ tự thả (seq) tách được cả những lần thả cùng một t (đồng hồ đứng khi ?freeze).
     */
    release({ x, z, t, dir, key = null, phase }) {
      // Chuẩn hóa lại dir cho chắc: tốc độ trôi và phương trình mép đều giả sử |dir| = 1.
      const [dx, dz] = unit(dir[0], dir[1], 0, -1);
      const edgeAt = t + edgeAge(x, z, dx, dz, pond - DRIFT.margin);
      // (1) Đã đủ capacity đèn đang nổi: đèn thả sớm nhất chìm sớm, ngay từ lúc này. Đèn mới mà chìm ngay (thả ở dải sát
      //     bờ, hướng ra ngoài) thì không phải một đèn nổi: không bắt đèn nào chìm theo.
      const afloat = slots.filter((s) => isAfloat(s, t));
      if (edgeAt > t && afloat.length >= capacity) afloat.reduce((a, b) => (b.seq < a.seq ? b : a)).sinkAt = t;
      // (2) Ô trống hay đèn đã chìm hẳn; không còn thì lấy ô có đèn chìm lâu nhất (chỉ khi thả dồn dập).
      let i = slots.findIndex((s) => !isAlive(s, t));
      if (i < 0) i = longestSinking(slots);
      // (3) Ghi lần thả vào ô đó.
      Object.assign(slots[i], {
        x,
        z,
        t0: t,
        dx,
        dz,
        phase: phase ?? (released * GOLDEN_ANGLE) % (Math.PI * 2),
        key,
        sinkAt: Infinity,
        edgeAt,
        seq: released++,
      });
      return i;
    },
    /** Số đèn còn sống lúc t (đang nổi + đang chìm): số đo "Hoa đăng đang trôi". */
    alive: (t) => slots.reduce((n, s) => n + (isAlive(s, t) ? 1 : 0), 0),
  };
}

/**
 * Trạng thái của một đèn ở thời điểm t (giây của đồng hồ cảnh), tính thẳng từ công thức: gọi lại với cùng t luôn ra cùng
 * kết quả. Đèn đi theo dir một quãng distanceAt(tuổi), lượn ngang theo hình sin, xoay chậm.
 * @param {LanternSlot} slot
 * @param {number} t
 * @returns {{ alive: boolean, x: number, z: number, yaw: number, open: number, glow: number, sink: number }}
 *   open 0 → 1 (búp → nở), glow 0 → 1 (sáng dần lúc đầu, tắt dần khi chìm), sink 0 → 1 (đang chìm)
 */
export function lanternAt(slot, t) {
  const sink = clamp01((t - sinkStart(slot)) / DRIFT.sink);
  if (!isAlive(slot, t)) return { alive: false, x: slot.x, z: slot.z, yaw: slot.phase, open: 0, glow: 0, sink };
  const age = t - slot.t0;
  const along = distanceAt(age);
  // Lượn ngang lớn dần theo đà (cùng thừa số 1 − e^(−age/ease) với vận tốc): lúc thả, đèn nằm đúng chỗ ngón tay chạm.
  const side = DRIFT.sway * Math.sin(DRIFT.swayRate * age + slot.phase) * (1 - Math.exp(-age / DRIFT.ease));
  return {
    alive: true,
    x: slot.x + slot.dx * along - slot.dz * side, // (−dz, dx) vuông góc với hướng trôi
    z: slot.z + slot.dz * along + slot.dx * side,
    yaw: slot.phase + DRIFT.spin * age,
    open: smoothstep(0, DRIFT.open, age),
    glow: smoothstep(0, DRIFT.glowIn, age) * (1 - sink),
    sink,
  };
}

/**
 * Thứ tự thơ của một đêm: hoán vị của `keys`, xáo bằng mulberry32 với hạt giống là số thứ tự của đêm (giờ Việt Nam).
 * Một đêm tính từ 12 giờ trưa tới 12 giờ trưa hôm sau, nên cả đêm của bức (18:00 → 05:30) chỉ có một thứ tự, không đổi
 * lúc nửa đêm; cùng ?at thì cùng thứ tự. Xáo Fisher–Yates: đi từ cuối mảng về đầu, đổi phần tử i với một phần tử
 * bốc ngẫu nhiên trong [0, i]; mọi hoán vị có cùng xác suất (sort theo số ngẫu nhiên thì không).
 * @param {string[]} keys
 * @param {Date} now
 * @returns {string[]}  mảng mới; keys giữ nguyên
 */
export function verseOrder(keys, now) {
  const rng = mulberry32(Math.floor((now.getTime() + VN_OFFSET_MS - NOON_MS) / DAY_MS));
  const order = [...keys];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang-drift.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  814 passed`.

```bash
git add src/paintings/ao-sen-dem/parts/anh-trang-drift.js tests/paintings/ao-sen-dem/anh-trang-drift.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): đường trôi của hoa đăng (hàm thuần: vòng đệm N + 1 ô, lanternAt tính thẳng theo thời gian, hướng về lối trăng, thứ tự thơ theo đêm)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Hoa đăng của lớp Ánh trăng (`parts/anh-trang-lantern.js`); `__sma.readouts`

**Mục tiêu:** Spec §6 Lớp 2 "(GĐ 5) Hoa đăng", §10 (bảng mức: 8/6/4 đèn), §9 (`__sma.readouts`). Đèn ở bờ và mọi hoa đăng thả ra dùng chung MỘT InstancedMesh `hoa-dang`, nên thả bao nhiêu đèn cũng vẫn là một draw call:
- **Cỡ cố định.** Mesh có `(1 + slots.length) × 8` cánh, tức `(2 + lanterns) × 8`. Ô 0 là đèn ở bờ, đúng chỗ và dáng cũ; ô 1 trở đi là vòng đệm của Task 8. `count` không bao giờ đổi.
- **`write(t)` mỗi khung** (cả `update(0, t)`):
  - búp khép (`CLOSED_TILT` = +0,25 rad, cánh nghiêng vào trong ngọn nến) nở ra đúng độ nghiêng của đèn ở bờ theo `s.open`;
  - lúc chìm, đèn nhỏ đi 35 % và hạ 0,45, nên đã chìm hẳn dưới mặt nước trước khi ô bị giấu;
  - ô trống là ma trận cỡ 0 đặt ở chỗ đèn ở bờ, để không làm phình khung bao.
- **Khung bao.** three r186 tính `boundingSphere` của InstancedMesh một lần, và `setMatrixAt` không cập nhật nó, mà frustum culling lại dùng nó. Vì vậy ghi xong ma trận thì gọi `computeBoundingSphere()`.
- **Không có đèn trôi thì không ghi gì**, không tăng version của thuộc tính nào.
- **Thuộc tính instance** `lanternCenter` (vec2) và `lanternGlow` (float), gắn trên `cot.petalGeometry`, để mặc định usage. Ở r186, `DynamicDrawUsage` bắt three tải lại thuộc tính đó ở MỌI lần render, bất kể version.
- **Ánh sáng.** Emissive = `flame × mix(1,6; 0,3; uv.y) × w × lanternGlow`. Đèn thật (PointLight) chỉ có ở đèn bờ: thêm đèn lúc chạy là biên dịch lại mọi material, nên đèn thả ra chỉ tự phát sáng (bloom).
- **Cho lớp Mặt nước:** `pool` là uniformArray tên `lanternPool`, mỗi ô `(x, z, độ sáng, 0)`, đèn đang trôi dồn lên đầu. `count` là uniform float `lanternCount`. Lớp Mặt nước đọc chúng qua `shared.anhTrang.lantern = { material, pool, flame }`. (three r186: `setName` của uniformArray chỉ hiện trong WGSL; GLSL luôn đặt tên `NodeBuffer_<id>`.)
- **Luật hợp đồng mới:** `meta.layers[].files` phải liệt kê mọi file `parts/` mà lớp import, trực tiếp hay qua part khác (Sổ tay hiện code theo danh sách này). Hai part mới của lớp Ánh trăng vào `files`; spec §12 thêm dòng cho luật này.
- **Số đo "Hoa đăng đang trôi"** đếm cả đèn đang chìm, nên có lúc lên N + 1 trong chừng 3 giây.
- **`__sma.readouts(layerId)`** đọc số đo của một lớp qua bàn thợ.
- **Chữ:** nhãn số đo; `understand` của lớp nói về "đèn thật và vật tự phát sáng" (đúng 150 chữ); thêm một dòng `learned`. Nhãn núm `candleIntensity` thành "Độ sáng đèn thật ở bờ" (id giữ nguyên), vì núm giờ chỉ chỉnh đèn bờ.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/anh-trang-lantern.js`
- Modify: `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `shared.js` (tạo vòng đệm), `quality.js` (`lanterns` 8/6/4), `meta.js` (`files` của lớp), `content.vi.js`, `src/engine/sma.js`
- Test: `tests/paintings/ao-sen-dem/anh-trang.test.js`, `tests/paintings/ao-sen-dem/quality.test.js`, `tests/unit/sma.test.js`, `tests/paintings/contract.test.js`
- Spec: §12 (luật `files` của lớp)

**Interfaces:**
- Consumes: `createLanternSlots`, `lanternAt`, `DRIFT` (Task 8); `cot.petalGeometry`; tên vật `hoa-dang` (Task 5).
- Produces:
  - `PETALS = 8`; `SHORE`; `createLanterns(ctx, { geometry, w, candle, slots }) → { mesh, material, flame, swap, pool: { node, count, size }, write(t), alive(t), dispose }`;
  - `shared.lanterns` (vòng đệm); `shared.anhTrang.lantern = { material, pool, flame }`;
  - `__sma.readouts(layerId) → [{ id, value, unit }]`.

  Task 10 dùng `shared.anhTrang.lantern`; Task 11 thả đèn vào `shared.lanterns`.

- [ ] **Step 1: Test (hỏng: chưa có hoa đăng)**

Áp vào `tests/paintings/ao-sen-dem/anh-trang.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/anh-trang.test.js b/tests/paintings/ao-sen-dem/anh-trang.test.js
index f16b179..32dd8ce 100644
--- a/tests/paintings/ao-sen-dem/anh-trang.test.js
+++ b/tests/paintings/ao-sen-dem/anh-trang.test.js
@@ -1,12 +1,13 @@
 // tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
 import { describe, it, expect } from 'vitest';
-import { OrthographicCamera, Vector3 } from 'three/webgpu';
+import { DynamicDrawUsage, Matrix4, Object3D, OrthographicCamera, Vector3 } from 'three/webgpu';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
 import { moonStrength } from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
 import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
 import { LIGHT_DISTANCE, SHADOW_BOX, fitShadowCamera } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-shadow.js';
+import { DRIFT, lanternAt } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
 import { moonDirection } from '../../../src/paintings/ao-sen-dem/shared.js';
 import { moonPhase } from '../../../src/lib/astro/moon.js';
 import { knobValue } from '../../../src/engine/gpu/knob-set.js';
@@ -15,6 +16,51 @@ import { NOW, buildPainting } from '../../helpers/fake-ctx.js';
 const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
 const lights = (scene, flag) => scene.children.filter((o) => o[flag]);
 
+// ─── Hoa đăng (GĐ 5) ───
+const PETALS = 8; // cánh của một đèn: mesh có (1 + budget.lanterns + 1) × 8 bản (spec §6 Lớp 2; vòng đệm có thêm một ô)
+/** InstancedMesh của mọi đèn, tìm theo tên vật. */
+const lanternMesh = (layers) => layers['anh-trang'].objects.find((o) => o.name === 'hoa-dang');
+const matrixAt = (mesh, i) => new Matrix4().fromArray(mesh.instanceMatrix.array, i * 16);
+/** Thả một đèn trôi về phía −z (trăng ở chính nam); trả số ô của nó trong vòng đệm. Ô i của vòng đệm là ô i + 1 của mesh. */
+const release = (shared, { x, z, t }) => shared.lanterns.release({ x, z, t, dir: [0, -1], key: null });
+const expectMatrix = (actual, expected) => actual.elements.forEach((v, j) => expect(v).toBeCloseTo(expected.elements[j], 6));
+
+/** Ma trận 8 cánh của đèn ở bờ, tính đúng như createLantern trước GĐ 5: đèn ở bờ không được xê dịch (poster giữ nguyên). */
+function shoreMatrices() {
+  const dummy = new Object3D();
+  dummy.rotation.order = 'YXZ';
+  return Array.from({ length: PETALS }, (_, k) => {
+    const yaw = (k / PETALS) * Math.PI * 2;
+    dummy.position.set(-5 + Math.cos(yaw) * 0.12, 0.08, 13 + Math.sin(yaw) * 0.12);
+    dummy.rotation.set(-0.45, -yaw - Math.PI / 2, 0);
+    dummy.scale.setScalar(0.55);
+    dummy.updateMatrix();
+    return dummy.matrix.clone();
+  });
+}
+
+/** Mũi cánh ngả ra ngoài bao nhiêu: trục của cánh (+Y cục bộ, gốc → mũi) chiếu lên hướng từ tâm đèn ra gốc cánh. */
+function lean(mesh, i, center) {
+  const m = matrixAt(mesh, i);
+  const base = new Vector3().setFromMatrixPosition(m);
+  const out = new Vector3(base.x - center.x, 0, base.z - center.z).normalize();
+  return new Vector3().setFromMatrixColumn(m, 1).normalize().dot(out);
+}
+
+/** Mọi node trong đồ thị của root, mỗi node một lần (đồ thị dùng chung nhánh). */
+function nodesOf(root) {
+  const seen = new Set();
+  const stack = [root];
+  while (stack.length > 0) {
+    const node = stack.pop();
+    if (!node?.isNode || seen.has(node)) continue;
+    seen.add(node);
+    stack.push(...node.getChildren());
+  }
+  return [...seen];
+}
+const uniformIn = (root, name) => nodesOf(root).find((n) => n.isUniformNode && n.name === name);
+
 describe('l2-anh-trang', () => {
   it('núm tĩnh; pha trăng mặc định là pha của đêm nay', () => {
     expect(anhTrang.id).toBe('anh-trang');
@@ -223,3 +269,236 @@ describe('l2-anh-trang', () => {
     expect(() => { exp('noRim').toggle(true); exp('noRim').toggle(false); }).not.toThrow();
   });
 });
+
+describe('l2-anh-trang · hoa đăng (GĐ 5)', () => {
+  it('InstancedMesh hoa-dang có (1 + lanterns + 1) × 8 bản ở cả ba mức, count không đổi sau khi thả', () => {
+    for (const [level, lanterns] of [['cao', 8], ['vua', 6], ['thap', 4]]) {
+      const { ctx, shared, layers } = build({ level });
+      expect(ctx.budget.lanterns, level).toBe(lanterns);
+      expect(shared.lanterns.slots, level).toHaveLength(lanterns + 1);
+      const mesh = lanternMesh(layers);
+      const size = (1 + lanterns + 1) * PETALS;
+      expect([mesh.count, mesh.instanceMatrix.count], level).toEqual([size, size]);
+      for (const name of ['lanternCenter', 'lanternGlow']) expect(mesh.geometry.getAttribute(name).count, `${level} ${name}`).toBe(size);
+      for (let i = 0; i < 3 * lanterns; i++) release(shared, { x: i - lanterns, z: 0, t: i }); // thả quá sức chứa
+      layers['anh-trang'].update(1 / 60, 3 * lanterns);
+      expect(mesh.count, level).toBe(size);
+    }
+  });
+
+  it('số đo lanterns là 0; thả một đèn (shared.lanterns.release ở t hiện tại) rồi update → 1', () => {
+    const { ctx, shared, layers } = build();
+    const layer = layers['anh-trang'];
+    const lanterns = () => layer.readouts.find((r) => r.id === 'lanterns').get();
+    expect(lanterns()).toBe(0);
+    ctx.u.time.value = 4;
+    release(shared, { x: 2, z: 8, t: ctx.u.time.value });
+    layer.update(1 / 60, ctx.u.time.value);
+    expect(lanterns()).toBe(1);
+  });
+
+  it('pool cho lớp Mặt nước: đèn đang trôi dồn lên đầu, mỗi ô (x, z, độ sáng, 0); count là số đèn đang trôi', () => {
+    const { shared, layers } = build();
+    const { pool } = shared.anhTrang.lantern;
+    expect(pool.size).toBe(shared.lanterns.slots.length);
+    expect(pool.node.array).toHaveLength(pool.size);
+    // Tên mà mã WGSL và Inspector hiện (mảng không đặt tên thì three gọi là NodeBuffer_<số>).
+    expect([pool.node.name, pool.count.name]).toEqual(['lanternPool', 'lanternCount']);
+    const first = release(shared, { x: 0, z: 20, t: 0 }); // ô 0 của vòng đệm: tắt hẳn chậm nhất ở giây 93 (đời đèn + lúc chìm)
+    // Đèn đang sáng dần: ô mang đúng độ sáng của đèn đó (vũng sáng trên nước sáng dần theo), không phải 1.
+    layers['anh-trang'].update(1 / 60, DRIFT.glowIn / 2);
+    const fading = lanternAt(shared.lanterns.slots[first], DRIFT.glowIn / 2);
+    expect(fading.glow).toBeCloseTo(0.5, 6);
+    expect(pool.node.array[0].toArray()).toEqual([fading.x, fading.z, fading.glow, 0]);
+    const second = release(shared, { x: 3, z: 30, t: 50 }); // ô 1: còn xa mép ao, giây 95 vẫn đang trôi
+    layers['anh-trang'].update(1 / 60, 60);
+    expect(pool.count.value).toBe(2);
+    layers['anh-trang'].update(1 / 60, 95);
+    expect(lanternAt(shared.lanterns.slots[first], 95).alive).toBe(false);
+    const s = lanternAt(shared.lanterns.slots[second], 95);
+    expect(pool.count.value).toBe(1);
+    expect(pool.node.array[0].toArray()).toEqual([s.x, s.z, s.glow, 0]); // ô 1 dồn lên đầu, không để lỗ ở ô 0
+    for (const v of pool.node.array.slice(1)) expect(v.toArray()).toEqual([0, 0, 0, 0]);
+  });
+
+  it('ma trận cánh của đèn vừa thả có cỡ khác 0 và ở gần chỗ thả; ô trống có cỡ 0', () => {
+    const { shared, layers } = build();
+    const mesh = lanternMesh(layers);
+    const ring = release(shared, { x: -3, z: 6, t: 2 });
+    layers['anh-trang'].update(1 / 60, 2.25);
+    const now = lanternAt(shared.lanterns.slots[ring], 2.25); // đang sáng dần: độ sáng 0,5
+    const centers = mesh.geometry.getAttribute('lanternCenter');
+    const glows = mesh.geometry.getAttribute('lanternGlow');
+    for (let k = 0; k < PETALS; k++) {
+      const i = (ring + 1) * PETALS + k;
+      const m = matrixAt(mesh, i);
+      const p = new Vector3().setFromMatrixPosition(m);
+      expect(m.getMaxScaleOnAxis()).toBeGreaterThan(0);
+      expect(Math.hypot(p.x + 3, p.z - 6)).toBeLessThan(0.5);
+      expect(centers.getX(i)).toBeCloseTo(now.x, 5); // tâm đèn cho lớp Mặt nước (độ cao gợn tại đó)
+      expect(centers.getY(i)).toBeCloseTo(now.z, 5);
+      expect(glows.getX(i)).toBeCloseTo(now.glow, 6);
+    }
+    for (let slot = 1; slot <= shared.lanterns.slots.length; slot++) {
+      if (slot === ring + 1) continue;
+      for (let k = 0; k < PETALS; k++) {
+        expect(matrixAt(mesh, slot * PETALS + k).getMaxScaleOnAxis(), `ô ${slot}`).toBe(0);
+        expect(glows.getX(slot * PETALS + k), `ô ${slot}`).toBe(0);
+      }
+    }
+  });
+
+  it('khung bao (frustum culling) chứa mọi đèn đang trôi; ao trống thì chỉ quanh đèn ở bờ: ô trống không làm nó phình ra', () => {
+    const { shared, layers } = build();
+    const layer = layers['anh-trang'];
+    const mesh = lanternMesh(layers);
+    mesh.computeBoundingSphere(); // như renderer làm ở lần culling đầu (khung bao còn null)
+    const idle = mesh.boundingSphere.clone();
+    // Đèn ở bờ nằm ngoài khung hình của điện thoại dọc: khung bao mà gồm cả ô trống thì mesh bị vẽ thừa ở đó.
+    expect(idle.center.distanceTo(new Vector3(-5, 0.08, 13))).toBeLessThan(1);
+    expect(idle.radius).toBeLessThan(1);
+    const ring = release(shared, { x: 20, z: -30, t: 1 }); // xa đèn ở bờ
+    layer.update(1 / 60, 5);
+    const s = lanternAt(shared.lanterns.slots[ring], 5);
+    expect(mesh.boundingSphere.containsPoint(new Vector3(s.x, 0.08, s.z))).toBe(true);
+    layer.update(1 / 60, 1 + DRIFT.life + DRIFT.sink + 1); // đèn đã tắt hẳn
+    expect(mesh.boundingSphere.equals(idle)).toBe(true);
+  });
+
+  it('búp khép lúc thả, nở đủ sau DRIFT.open giây: lúc đó cánh ngả ra đúng như đèn ở bờ', () => {
+    const { shared, layers } = build();
+    const mesh = lanternMesh(layers);
+    const ring = release(shared, { x: 2, z: 4, t: 1 });
+    const leanAt = (t) => {
+      layers['anh-trang'].update(0, t);
+      return lean(mesh, (ring + 1) * PETALS, lanternAt(shared.lanterns.slots[ring], t));
+    };
+    const shore = lean(mesh, 0, { x: -5, z: 13 });
+    expect(shore).toBeGreaterThan(0.3); // đèn ở bờ nở: cánh ngả ra ngoài
+    expect(leanAt(1)).toBeLessThan(0.1); // búp: cánh gần như dựng đứng hay chụm vào trên ngọn nến
+    expect(leanAt(1 + DRIFT.open)).toBeCloseTo(shore, 5);
+  });
+
+  it('đèn thả ra quay mặt theo yaw của đường trôi: gốc cánh k nằm ở góc yaw + k·45° quanh tâm đèn', () => {
+    const { shared, layers } = build();
+    const mesh = lanternMesh(layers);
+    // Lần thả đầu có pha 0, lần sau lệch một góc vàng (≈ 2,4 rad); tới t = 12 mỗi đèn còn xoay thêm DRIFT.spin × tuổi.
+    // Không đèn nào quay mặt về góc 0, nên ghi nhầm yaw 0 (mọi đèn cùng một hướng) là lộ ngay.
+    const rings = [release(shared, { x: -3, z: 6, t: 2 }), release(shared, { x: 4, z: 1, t: 3 })];
+    layers['anh-trang'].update(1 / 60, 12);
+    for (const ring of rings) {
+      const s = lanternAt(shared.lanterns.slots[ring], 12);
+      for (let k = 0; k < PETALS; k++) {
+        const p = new Vector3().setFromMatrixPosition(matrixAt(mesh, (ring + 1) * PETALS + k));
+        const off = Math.atan2(p.z - s.z, p.x - s.x) - (s.yaw + (k / PETALS) * Math.PI * 2);
+        // Độ lệch theo mod 2π, về (−π, π]. Ma trận lưu float32 trên vòng bán kính 0,12: sai số cỡ 1e-6 rad.
+        expect(Math.atan2(Math.sin(off), Math.cos(off)), `ô ${ring}, cánh ${k}`).toBeCloseTo(0, 4);
+      }
+    }
+  });
+
+  it('chìm: đèn tắt dần và xuống hẳn dưới mặt nước (y = 0) trước khi ô bị giấu, nên không biến mất đột ngột', () => {
+    const { shared, layers } = build();
+    const mesh = lanternMesh(layers);
+    const ring = release(shared, { x: 0, z: 10, t: 0 });
+    const slot = shared.lanterns.slots[ring];
+    const last = Math.min(slot.t0 + DRIFT.life, slot.edgeAt) + DRIFT.sink - 0.01; // khung cuối trước khi tắt hẳn
+    layers['anh-trang'].update(1 / 60, last);
+    const s = lanternAt(slot, last);
+    expect(s.alive).toBe(true);
+    expect(s.sink).toBeGreaterThan(0.99);
+    expect(mesh.geometry.getAttribute('lanternGlow').getX((ring + 1) * PETALS)).toBeLessThan(0.01);
+    const position = mesh.geometry.getAttribute('position');
+    const p = new Vector3();
+    let top = -Infinity; // đỉnh cao nhất của 8 cánh
+    for (let k = 0; k < PETALS; k++) {
+      const m = matrixAt(mesh, (ring + 1) * PETALS + k);
+      for (let v = 0; v < position.count; v++) top = Math.max(top, p.fromBufferAttribute(position, v).applyMatrix4(m).y);
+    }
+    expect(top).toBeLessThan(0);
+  });
+
+  it('update(0, t) hai lần cho đúng cùng ma trận (tất định, không phụ thuộc các khung trước); đèn ở bờ đứng yên đúng chỗ cũ', () => {
+    const { shared, layers } = build();
+    const layer = layers['anh-trang'];
+    const mesh = lanternMesh(layers);
+    const { pool } = shared.anhTrang.lantern;
+    const attrs = [mesh.instanceMatrix, mesh.geometry.getAttribute('lanternCenter'), mesh.geometry.getAttribute('lanternGlow')];
+    const state = () => [...attrs.map((a) => Array.from(a.array)), pool.node.array.map((v) => v.toArray()), pool.count.value];
+    const untouched = state(); // lúc mới dựng: mọi ô của vòng đệm trống
+    release(shared, { x: -3, z: 6, t: 2 });
+    release(shared, { x: 4, z: 1, t: 3 });
+    layer.update(0, 10);
+    const first = state();
+    layer.update(1 / 60, 25); // đồng hồ chạy tiếp…
+    expect(state()).not.toEqual(first);
+    layer.update(0, 10); // …rồi vẽ lại đúng khung cũ (như ?freeze)
+    expect(state()).toEqual(first);
+    // Cả hai đèn đã chìm hẳn: ao trống y như lúc mới dựng. Ô vừa giấu không giữ dấu gì của đèn cũ (kể cả tâm), nên
+    // trạng thái chỉ phụ thuộc t, không phụ thuộc trước đó đã vẽ những khung nào.
+    layer.update(0, 3 + DRIFT.life + DRIFT.sink + 1);
+    expect(state()).toEqual(untouched);
+    shoreMatrices().forEach((expected, k) => expectMatrix(matrixAt(mesh, k), expected));
+    for (let k = 0; k < PETALS; k++) {
+      expect([attrs[1].getX(k), attrs[1].getY(k), attrs[2].getX(k)]).toEqual([-5, 13, 1]); // tâm của đèn ở bờ, luôn sáng đủ
+    }
+  });
+
+  it('thí nghiệm "Đổi màu đèn" đổi flame của mọi đèn (cùng uniform swap); emissive theo độ sáng riêng của từng đèn; shared.anhTrang.lantern có material, pool, flame', () => {
+    const { ctx, shared, layers } = build();
+    const layer = layers['anh-trang'];
+    const mesh = lanternMesh(layers);
+    const { material, pool, flame } = shared.anhTrang.lantern;
+    expect(material).toBe(mesh.material); // mọi đèn chung MỘT material: lớp Sương, Mặt nước sửa node của nó
+    expect(material.emissiveNode.isNode).toBe(true);
+    // Mỗi đèn sáng dần lúc thả, tắt dần khi chìm: emissive nhân với thuộc tính instance lanternGlow. AttributeNode không
+    // có cờ isAttributeNode, nên nhận ra nó qua getAttributeName().
+    expect(nodesOf(material.emissiveNode).some((n) => n.getAttributeName?.() === 'lanternGlow')).toBe(true);
+    // Mài lớp Ánh trăng (luật 3) thì đèn thôi sáng: emissive còn nhân trọng số của lớp, đúng uniform mà ctx.weight trả.
+    expect(uniformIn(material.emissiveNode, 'w_anh_trang')).toBe(ctx.weight('anh-trang'));
+    expect([pool.node.isNode, pool.count.isNode, flame.isNode]).toEqual([true, true, true]);
+    expect(shared.anhTrang.glow.isNode).toBe(true); // độ sáng trăng vẫn ở đó cho các lớp sau
+    const swap = uniformIn(flame, 'anh_trang_swap');
+    expect(swap).toBeTruthy();
+    expect(uniformIn(material.emissiveNode, 'anh_trang_swap')).toBe(swap); // giấy của mọi đèn và màu nến của vũng sáng
+    const exp = layer.experiments.find((e) => e.id === 'redCandle');
+    const [candle] = lights(ctx.scene, 'isPointLight');
+    exp.toggle(true);
+    expect(swap.value).toBe(1);
+    layer.update(1 / 60, 1);
+    expect(candle.color.getHexString()).toBe(ctx.palette.color('doSon').getHexString()); // đèn thật của đèn ở bờ theo cùng
+    exp.toggle(false);
+    expect(swap.value).toBe(0);
+  });
+
+  it('không có đèn trôi thì không đánh dấu needsUpdate (version đứng yên); không thuộc tính instance nào dùng DynamicDrawUsage', () => {
+    const { shared, layers } = build();
+    const layer = layers['anh-trang'];
+    const mesh = lanternMesh(layers);
+    // Renderer của three r186 (renderers/common/Attributes.js, chung cho WebGPU và WebGL2) chép một thuộc tính lên GPU
+    // khi version của nó tăng (needsUpdate = true), hoặc ở MỌI lần render, bất kể version, nếu nó dùng DynamicDrawUsage.
+    // Test này giữ hai điều kiện đó, không đo chính việc chép. Ma trận (tối đa 80 bản, 5 KB) thì nằm trong uniform buffer
+    // mà three chép lại ở mỗi lượt vẽ dù version đứng yên (parts/anh-trang-lantern.js): với ma trận, test chỉ giữ rằng
+    // CPU không ghi lại.
+    const attrs = [mesh.instanceMatrix, mesh.geometry.getAttribute('lanternCenter'), mesh.geometry.getAttribute('lanternGlow')];
+    for (const a of attrs) expect(a.usage).not.toBe(DynamicDrawUsage);
+    const versions = () => attrs.map((a) => a.version);
+    const idle = versions();
+    layer.update(1 / 60, 1);
+    layer.update(0, 1);
+    layer.update(1 / 60, 2);
+    expect(versions()).toEqual(idle);
+    const ring = release(shared, { x: 0, z: 10, t: 3 });
+    layer.update(1 / 60, 3);
+    const floating = versions();
+    floating.forEach((v, i) => expect(v).toBeGreaterThan(idle[i]));
+    // Đèn tắt hẳn (sau đời đèn và lúc chìm): ghi thêm MỘT lần để giấu cánh của nó, rồi thôi.
+    const gone = 3 + DRIFT.life + DRIFT.sink + 1;
+    layer.update(1 / 60, gone);
+    const hidden = versions();
+    hidden.forEach((v, i) => expect(v).toBeGreaterThan(floating[i]));
+    expect(matrixAt(mesh, (ring + 1) * PETALS).getMaxScaleOnAxis()).toBe(0);
+    layer.update(1 / 60, gone + 1);
+    expect(versions()).toEqual(hidden);
+  });
+});
```
Áp vào `tests/paintings/ao-sen-dem/quality.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/quality.test.js b/tests/paintings/ao-sen-dem/quality.test.js
index b412069..77d7075 100644
--- a/tests/paintings/ao-sen-dem/quality.test.js
+++ b/tests/paintings/ao-sen-dem/quality.test.js
@@ -15,9 +15,12 @@ function ladderAt(level, device) {
 }
 
 describe('quality.js của Bức 1', () => {
-  it('bảng §10: DPR, phản chiếu (0 = giả), đom đóm, lá, bóng (0 = tắt), bloom, octave sương', () => {
-    expect(budgetFor('cao', painting.quality)).toEqual({ dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3 });
-    expect(budgetFor('thap', painting.quality)).toMatchObject({ reflection: 0, shadow: 0, fogOctaves: 1 });
+  it('bảng §10: DPR, phản chiếu (0 = giả), đom đóm, lá, bóng (0 = tắt), bloom, octave sương, hoa đăng (GĐ 5)', () => {
+    expect(budgetFor('cao', painting.quality)).toEqual({
+      dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3, lanterns: 8,
+    });
+    expect(budgetFor('vua', painting.quality)).toMatchObject({ lanterns: 6 });
+    expect(budgetFor('thap', painting.quality)).toMatchObject({ reflection: 0, shadow: 0, fogOctaves: 1, lanterns: 4 });
   });
 
   it('mức cao, màn DPR 2: 4 nấc dpr rồi đủ 5 nấc của các lớp, đúng thứ tự', () => {
```
Áp vào `tests/unit/sma.test.js`:

```diff
diff --git a/tests/unit/sma.test.js b/tests/unit/sma.test.js
index 88c88fd..8002f32 100644
--- a/tests/unit/sma.test.js
+++ b/tests/unit/sma.test.js
@@ -68,4 +68,19 @@ describe('studioApi (GĐ 4): các hàm của bàn thợ mà __sma lộ ra', () =
     expect(api.quality().locked).toEqual(['dpr=1.5']);
     expect(api.tools()).toEqual([{ id: 'kinh', on: false }]);
   });
+
+  it('readouts(id) (GĐ 5): số đo riêng của một lớp, đọc qua bàn thợ; chưa có bàn thợ thì mảng rỗng', () => {
+    let studio = null;
+    const api = studioApi(() => studio);
+    expect(api.readouts('hai')).toEqual([]);
+    const asked = [];
+    studio = {
+      readouts: (layerId) => {
+        asked.push(layerId);
+        return [{ id: 'dinh', value: 42, unit: 'đỉnh' }];
+      },
+    };
+    expect(api.readouts('hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }]);
+    expect(asked).toEqual(['hai']);
+  });
 });
```
Áp vào `tests/paintings/contract.test.js`:

```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index 5ba0db9..43a4bbe 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -11,6 +11,7 @@ import { svgColors } from '../helpers/svg.js';
 import { jpegSize, webpSize } from '../helpers/image.js';
 import { KEBAB } from '../helpers/kebab.js';
 import { captionErrors } from '../helpers/caption-rules.js';
+import { read, staticClosure } from '../helpers/source.js';
 import { parseAt } from '../../src/engine/flags.js';
 import { pass } from 'three/tsl';
 import { buildFinalNode, makeMRT } from '../../src/engine/gpu/pipeline.js';
@@ -71,6 +72,22 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
     }
   });
 
+  it('files của lớp (GĐ 5) kê đủ mọi file trong parts/ mà file lớp import tĩnh, thẳng hay qua part khác: Sổ tay hiện đủ code', () => {
+    const parts = `src/paintings/${slug}/parts/`;
+    for (const layer of meta.layers) {
+      for (const file of layer.files.filter((f) => f.startsWith(`paintings/${slug}/layers/`))) {
+        // Chỉ đi qua parts/: shared.js cũng import part, nhưng nó là của cả bức, không thuộc lớp nào. Cùng với luật "mỗi
+        // file thuộc tối đa một lớp", part là của riêng một lớp: lớp khác cần gì của nó thì nhận qua shared.
+        const start = `src/${file}`;
+        const reached = staticClosure(start, (rel) => (rel === start || rel.startsWith(parts) ? read(rel) : null))
+          .filter((f) => f.startsWith(parts))
+          .map((f) => f.slice('src/'.length)); // đường dẫn tính từ src/, như files
+        const missing = reached.filter((f) => !layer.files.includes(f));
+        expect(missing, `lớp "${layer.id}": ${file} import (thẳng hay qua part khác) mà files chưa kê`).toEqual([]);
+      }
+    }
+  });
+
   it('poster (GĐ 4): capture đọc được (at theo ?at, freeze nguyên dương); file WebP đúng cỡ và ≤ 150 KB; og 1200×630, ≤ 200 KB', () => {
     const { capture } = meta.poster;
     if (capture) {
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/quality.test.js tests/unit/sma.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: FAIL, 13 test hỏng; lỗi đầu tiên: `TypeError: api.readouts is not a function`.

- [ ] **Step 2: Code**

Tạo `src/paintings/ao-sen-dem/parts/anh-trang-lantern.js`:

```js
// paintings/ao-sen-dem/parts/anh-trang-lantern.js — đèn hoa đăng của lớp Ánh trăng: đèn ở bờ và mọi hoa đăng thả ra chung MỘT InstancedMesh; mỗi khung ghi ma trận, tâm, độ sáng.
import {
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardNodeMaterial,
  Object3D,
  Vector4,
} from 'three/webgpu';
import { attribute, color, mix, uniform, uniformArray, uv } from 'three/tsl';
import { lanternAt } from './anh-trang-drift.js';

export const PETALS = 8; // số cánh của một đèn
// Đèn ở bờ (số của l2 trước GĐ 5): chỗ đặt, bán kính vòng cánh, cỡ cánh, góc ngả. Góc ngả là góc xoay quanh trục X của
// cánh, như cánh sen của Cốt: âm thì mũi cánh ngả ra ngoài, dương thì chụm vào trong.
export const SHORE = { position: [-5, 0.08, 13], radius: 0.12, scale: 0.55, tilt: -0.45 };
// Búp vừa thả: cánh chụm vào trên ngọn nến (mũi cánh vốn cong ra ngoài, nên vẫn hở một chút ở đỉnh), rồi nở dần tới đúng
// góc của đèn ở bờ.
const CLOSED_TILT = 0.25;
// Chìm hẳn: đèn nhỏ đi 35% và xuống thấp 0,45 đơn vị, đủ để cả mũi cánh cũng ở dưới mặt nước (y = 0) trước khi ô bị
// giấu: đèn lặn mất chứ không biến mất đột ngột. Ở khung cuối mũi cánh chỉ còn dưới mặt nước chừng 0,06, nên thứ gì
// nâng đèn lên trong lúc chìm (nhấp nhô theo gợn) phải nhạt dần theo sink như độ sáng, kẻo mũi cánh nhô lên đúng lúc
// ô bị giấu.
const SINK = { shrink: 0.35, drop: 0.45 };

/**
 * Mọi đèn hoa đăng của lớp Ánh trăng trong MỘT InstancedMesh (một draw call), cấp phát MỘT lần theo sức chứa của vòng
 * đệm: ô 0 là đèn ở bờ (đứng yên, ghi một lần), ô i + 1 là ô i của vòng đệm (anh-trang-drift.js). Mọi đèn chung một
 * material, nên núm candleColor, thí nghiệm "Đổi màu đèn" và trọng số của lớp áp cho tất cả.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ geometry: any, w: any, candle: any, slots: ReturnType<typeof import('./anh-trang-drift.js').createLanternSlots> }} p
 *   geometry: shared.cot.petalGeometry (hình cánh Cốt dựng riêng cho đèn, chỉ đèn dùng: gắn thêm thuộc tính instance vào
 *   đây được); w: trọng số của lớp; candle: uniform màu nến (núm candleColor); slots: vòng đệm shared.lanterns
 * @returns {{ mesh: any, material: any, flame: any, swap: any, pool: { node: any, count: any, size: number },
 *   write: (t: number) => void, alive: (t: number) => number, dispose: () => void }}
 *   pool (cho lớp Mặt nước): node = uniformArray `size` ô vec4(x, z, độ sáng, 0), tên lanternPool; count = uniform FLOAT
 *   lanternCount, số đèn đang trôi: shader so nó với chỉ số vòng lặp (số nguyên) thì đổi chỉ số sang float trước.
 */
export function createLanterns(ctx, { geometry, w, candle, slots }) {
  const hex = ctx.palette.hex;
  const ring = slots.slots;
  const size = (1 + ring.length) * PETALS;
  // Thuộc tính theo từng bản (8 bản của một đèn mang cùng số): tâm đèn (x, z) để lớp Mặt nước lấy độ cao gợn tại đó, và
  // độ sáng 0 → 1. Để usage mặc định: renderer chỉ chép thuộc tính lên GPU khi version của nó tăng (needsUpdate), tức
  // lúc có đèn trôi và thêm MỘT khung để giấu đèn vừa tắt. Đừng setUsage(DynamicDrawUsage): ở r186 cờ đó nghĩa là
  // "chép lại ở MỌI lần render, bất kể version" (renderers/common/Attributes.js, chung cho WebGPU và WebGL2), nên ao
  // trống vẫn chép ở mỗi lần render có vẽ đèn: cảnh chính, rồi ảnh phản chiếu của reflector.
  const centers = new InstancedBufferAttribute(new Float32Array(size * 2), 2);
  const glows = new InstancedBufferAttribute(new Float32Array(size), 1);
  geometry.setAttribute('lanternCenter', centers);
  geometry.setAttribute('lanternGlow', glows);

  // Thí nghiệm "Đổi màu đèn": 0 = màu nến của núm, 1 = đỏ son. Cùng một ánh sáng, mỗi chất liệu đáp lại một kiểu.
  const swap = uniform(0).setName('anh_trang_swap');
  const flame = mix(candle, color(hex.doSon), swap);
  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép. lanternGlow là độ sáng riêng của từng đèn:
  // đèn ở bờ luôn 1; hoa đăng sáng dần lúc thả, tắt dần khi chìm.
  material.emissiveNode = flame.mul(mix(1.6, 0.3, uv().y)).mul(w).mul(attribute('lanternGlow', 'float'));

  const mesh = new InstancedMesh(geometry, material, size);
  mesh.name = 'hoa-dang';
  // Ma trận: (2 + lanterns) × 8 bản × 64 byte, tối đa 5 KB, dưới giới hạn uniform buffer (WebGPU ≥ 64 KB, WebGL2
  // ≥ 16 KB). Khi đó three (nodes/accessors/Instance.js) đặt instanceMatrix vào uniform buffer của từng vật và chép lại
  // nguyên bộ đệm ở MỖI lượt vẽ, dù needsUpdate có bật hay không: 5 KB thì rẻ, và không tránh được. needsUpdate chỉ có
  // tác dụng khi vượt giới hạn (three chuyển sang thuộc tính interleaved); ở đường đó DynamicDrawUsage cũng ép chép mỗi
  // lần render, nên ma trận cũng để usage mặc định.
  const [shoreX, shoreY, shoreZ] = SHORE.position;
  // Ô trống: ma trận cỡ 0 dồn mọi đỉnh về một điểm. Tam giác suy biến không phủ điểm ảnh nào, nên GPU bỏ nó ngay sau vertex
  // shader: ô trống gần như không tốn gì, và count của mesh không bao giờ phải đổi. Điểm đó đặt ngay ở đèn ở bờ để ô trống
  // không làm khung bao của mesh phình ra: ao chưa có hoa đăng thì khung bao chỉ ôm đèn ở bờ, và khi đèn ở bờ ra khỏi khung
  // hình (điện thoại dọc) thì frustum culling vẫn bỏ qua cả mesh như trước.
  const hidden = new Matrix4().makeScale(0, 0, 0).setPosition(shoreX, shoreY, shoreZ);

  const dummy = new Object3D();
  dummy.rotation.order = 'YXZ'; // ma trận = Ry · Rx: cánh ngả quanh trục X của nó trước, rồi mới quay theo hướng
  /**
   * Ghi 8 cánh của MỘT đèn vào ô `slot` (bản slot·8 … slot·8 + 7). Cánh k đứng trên vòng bán kính `radius` quanh (x, z),
   * quay mặt về góc yaw + k·45°: −Z của cánh chỉ ra ngoài, lòng cánh (+Z) hướng vào ngọn nến.
   */
  const place = (slot, { x, y, z, yaw, tilt, scale, radius }) => {
    for (let k = 0; k < PETALS; k++) {
      const a = yaw + (k / PETALS) * Math.PI * 2;
      dummy.position.set(x + Math.cos(a) * radius, y, z + Math.sin(a) * radius);
      dummy.rotation.set(tilt, -a - Math.PI / 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(slot * PETALS + k, dummy.matrix);
    }
  };
  /** Tâm và độ sáng của cả 8 bản trong ô `slot`. */
  const mark = (slot, x, z, glow) => {
    for (let i = slot * PETALS; i < (slot + 1) * PETALS; i++) {
      centers.setXY(i, x, z);
      glows.setX(i, glow);
    }
  };
  /**
   * Giấu cả 8 bản của ô `slot`. Tâm cũng về đèn ở bờ (như ma trận): ô trống không giữ dấu gì của đèn cũ, nên nội dung
   * các mảng chỉ phụ thuộc t, không phụ thuộc trước đó đã vẽ những khung nào.
   */
  const hide = (slot) => {
    for (let i = slot * PETALS; i < (slot + 1) * PETALS; i++) {
      mesh.setMatrixAt(i, hidden);
      centers.setXY(i, shoreX, shoreZ);
      glows.setX(i, 0);
    }
  };

  // Chưa vẽ lần nào: lần vẽ đầu chép nguyên các mảng lên GPU, nên ghi xong ở đây không cần needsUpdate.
  place(0, { x: shoreX, y: shoreY, z: shoreZ, yaw: 0, tilt: SHORE.tilt, scale: SHORE.scale, radius: SHORE.radius });
  mark(0, shoreX, shoreZ, 1);
  for (let slot = 1; slot <= ring.length; slot++) hide(slot);

  // Cho lớp Mặt nước (vũng sáng quanh đèn): đèn đang trôi dồn lên đầu, mỗi ô vec4(x, z, độ sáng, 0). Shader lặp tối đa
  // `size` vòng và Break khi tới `count`: ao không có đèn trôi thì không chạy vòng nào. Mảng có tên để mã WGSL và
  // Inspector gọi nó là lanternPool chứ không phải NodeBuffer_<số>. WebGL2 thì không: GLSLNodeBuilder của r186 vẫn đặt
  // tên NodeBuffer_<số> cho khối uniform, và ghi đè luôn tên của node.
  const spots = ring.map(() => new Vector4(0, 0, 0, 0)); // Vector4() mặc định w = 1; ô trống là (0, 0, 0, 0) ngay từ đầu
  const pool = {
    node: uniformArray(spots, 'vec4').setName('lanternPool'),
    count: uniform(0).setName('lanternCount'), // uniform(0) là float, không phải int
    size: ring.length,
  };
  const shown = ring.map(() => false); // ô đang có cánh hiện: đèn vừa tắt thì ghi thêm MỘT lần để giấu cánh của nó

  return {
    mesh,
    material,
    flame, // màu nến (đã tính "Đổi màu đèn"): lớp Mặt nước tô vũng sáng bằng màu này
    swap,
    pool,
    /**
     * Mỗi khung, kể cả lần vẽ lại update(0, t): chỗ, dáng và độ sáng của từng đèn tính thẳng từ t (lanternAt), nên cùng t
     * thì cùng ma trận. Chỉ ghi ô có đèn sống và ô vừa tắt; ao không có đèn trôi thì không ghi gì và không đánh dấu
     * needsUpdate: hai thuộc tính instance không phải chép lên GPU (ma trận thì three vẫn chép theo uniform buffer của
     * mỗi lượt vẽ, xem trên).
     */
    write(t) {
      let live = 0;
      let dirty = false;
      ring.forEach((slot, i) => {
        const s = lanternAt(slot, t);
        if (s.alive) {
          const k = 1 - SINK.shrink * s.sink; // chìm thì nhỏ dần, cả vòng cánh lẫn cánh
          place(i + 1, {
            x: s.x,
            y: shoreY - SINK.drop * s.sink,
            z: s.z,
            yaw: s.yaw,
            tilt: CLOSED_TILT + (SHORE.tilt - CLOSED_TILT) * s.open,
            scale: SHORE.scale * k,
            radius: SHORE.radius * k,
          });
          mark(i + 1, s.x, s.z, s.glow);
          spots[live++].set(s.x, s.z, s.glow, 0);
        } else if (shown[i]) {
          hide(i + 1);
        }
        if (s.alive || shown[i]) dirty = true;
        shown[i] = s.alive;
      });
      for (let j = live; j < spots.length; j++) spots[j].set(0, 0, 0, 0);
      pool.count.value = live;
      if (!dirty) return;
      mesh.instanceMatrix.needsUpdate = true;
      centers.needsUpdate = true;
      glows.needsUpdate = true;
      // InstancedMesh tính khung bao một lần rồi giữ nguyên (setMatrixAt không tính lại): không tính lại thì đèn trôi ra
      // ngoài khung cũ, và khi khung cũ ra khỏi màn hình thì frustum culling bỏ cả mesh, mất luôn mọi đèn.
      mesh.computeBoundingSphere();
    },
    /** Số đèn còn sống lúc t (đang nổi + đang chìm): số đo "Hoa đăng đang trôi". */
    alive: (t) => slots.alive(t),
    /** Geometry là của Cốt (Cốt gỡ): ở đây chỉ gỡ mesh và material. */
    dispose() {
      mesh.dispose();
      material.dispose();
    },
  };
}
```
Áp vào `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index bf4c88d..9c50634 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -1,15 +1,8 @@
 // paintings/ao-sen-dem/layers/l2-anh-trang.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + một shadow map, chất liệu, đèn hoa đăng.
-import {
-  DirectionalLight,
-  DoubleSide,
-  HemisphereLight,
-  InstancedMesh,
-  MeshStandardNodeMaterial,
-  Object3D,
-  PointLight,
-} from 'three/webgpu';
-import { color, cos, mix, oneMinus, uniform, uv, vec3 } from 'three/tsl';
+import { DirectionalLight, HemisphereLight, PointLight } from 'three/webgpu';
+import { cos, oneMinus } from 'three/tsl';
 import { moonPhase } from '../../../lib/astro/moon.js';
+import { SHORE, createLanterns } from '../parts/anh-trang-lantern.js';
 import { createMoon } from '../parts/anh-trang-moon.js';
 import { paintCot } from '../parts/anh-trang-paint.js';
 import { LIGHT_DISTANCE, createShadowWatch } from '../parts/anh-trang-shadow.js';
@@ -49,45 +42,11 @@ export function moonStrength(y) {
   return 0.35 + 0.65 * s * s * (3 - 2 * s);
 }
 const SKY_FILL = 4; // trời chàm hắt xuống, nước đen hắt lên
-const CANDLE = { distance: 14, position: [-5, 0.08, 13] };
-
-/**
- * Đèn hoa đăng: 8 cánh quây một ngọn nến là PointLight ấm. Cánh dùng lại HÌNH cánh sen của Cốt (shared.cot.petalGeometry)
- * nhưng mesh và material là của lớp này: tắt lớp Ánh trăng thì đèn cũng về đất sét, không kéo theo hoa của Cốt.
- */
-function createLantern(ctx, cot, w) {
-  const hex = ctx.palette.hex;
-  const candle = ctx.knob('candleColor'); // @knob candleColor
-  // Thí nghiệm "Đổi màu đèn": 0 = màu nến của núm, 1 = đỏ son. Cùng một ánh sáng, mỗi chất liệu đáp lại một kiểu.
-  const swap = uniform(0).setName('anh_trang_swap');
-  const flame = mix(candle, color(hex.doSon), swap);
-  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
-  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
-  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép.
-  material.emissiveNode = flame.mul(mix(1.6, 0.3, uv().y)).mul(w);
-  const mesh = new InstancedMesh(cot.petalGeometry, material, 8);
-  mesh.name = 'hoa-dang';
-  const dummy = new Object3D();
-  dummy.rotation.order = 'YXZ';
-  for (let k = 0; k < 8; k++) {
-    const yaw = (k / 8) * Math.PI * 2;
-    dummy.position.set(CANDLE.position[0] + Math.cos(yaw) * 0.12, CANDLE.position[1], CANDLE.position[2] + Math.sin(yaw) * 0.12);
-    dummy.rotation.set(-0.45, -yaw - Math.PI / 2, 0);
-    dummy.scale.setScalar(0.55);
-    dummy.updateMatrix();
-    mesh.setMatrixAt(k, dummy.matrix);
-  }
-  const light = new PointLight(candle.value, 0, CANDLE.distance, 2);
-  light.position.set(CANDLE.position[0], CANDLE.position[1] + 0.3, CANDLE.position[2]);
-  const red = ctx.palette.color('doSon');
-  // Màu của đèn thật (CPU) đi theo cùng công thức với màu của giấy (GPU).
-  const sync = () => light.color.copy(candle.value).lerp(red, swap.value);
-  return { mesh, light, swap, sync };
-}
+const CANDLE = { distance: 14, lift: 0.3 }; // ngọn nến của đèn ở bờ: tầm chiếu, độ cao trên đáy đèn
 
 /**
  * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
- * @param {object} shared  đọc shared.cot (lớp trước) và shared.moon (setup của bức)
+ * @param {object} shared  đọc shared.cot (lớp trước), shared.moon và shared.lanterns (setup của bức); ghi shared.anhTrang
  */
 export function createLayer(ctx, shared) {
   const w = ctx.weight(id);
@@ -144,14 +103,26 @@ export function createLayer(ctx, shared) {
     watch = createShadowWatch({ shadow: moonlight.shadow, dir: shared.moon.dir, cot });
   }
 
-  const lantern = createLantern(ctx, cot, w);
+  // Đèn hoa đăng: đèn ở bờ và mọi hoa đăng thả ra chung MỘT InstancedMesh (parts/anh-trang-lantern.js). Cánh dùng lại
+  // HÌNH cánh sen của Cốt (shared.cot.petalGeometry) nhưng mesh và material là của lớp này: tắt lớp Ánh trăng thì đèn
+  // cũng về đất sét, không kéo theo hoa của Cốt.
+  const candle = ctx.knob('candleColor'); // @knob candleColor
+  const lanterns = createLanterns(ctx, { geometry: cot.petalGeometry, w, candle, slots: shared.lanterns });
+  shared.anhTrang.lantern = { material: lanterns.material, pool: lanterns.pool, flame: lanterns.flame };
+  // Chỉ đèn ở bờ có đèn thật: PointLight ấm chiếu lên lá và cánh sen quanh nó. Số đèn nằm trong cache key của mọi material
+  // có chiếu sáng, nên thêm đèn lúc chạy là biên dịch lại tất cả: hoa đăng thả ra chỉ tự phát sáng (emissive → bloom).
+  const light = new PointLight(candle.value, 0, CANDLE.distance, 2);
+  light.position.set(SHORE.position[0], SHORE.position[1] + CANDLE.lift, SHORE.position[2]);
+  const red = ctx.palette.color('doSon');
+  // Màu của đèn thật (CPU) đi theo cùng công thức với màu của giấy (GPU).
+  const syncLight = () => light.color.copy(candle.value).lerp(red, lanterns.swap.value);
   let candleIntensity = ctx.knobValue('candleIntensity');
-  const added = [moon.moon, moonlight, moonlight.target, fill, lantern.mesh, lantern.light];
+  const added = [moon.moon, moonlight, moonlight.target, fill, lanterns.mesh, light];
   ctx.scene.add(...added);
 
   let disposed = false;
   return {
-    objects: [moon.moon, lantern.mesh],
+    objects: [moon.moon, lanterns.mesh],
     update(dt, t) {
       const k = w.value;
       const dir = shared.moon.dir.value;
@@ -162,9 +133,11 @@ export function createLayer(ctx, shared) {
       fill.intensity = SKY_FILL * k;
       // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
       cot.hemi.intensity = cot.hemiIntensity * (1 - k);
+      // Hoa đăng tính thẳng từ t: update(0, t) lúc ?freeze vẽ lại đúng khung đó.
+      lanterns.write(t);
       // Nến lung linh: hai sóng sin lệch nhịp, theo đồng hồ của xưởng (tất định với ?freeze).
-      lantern.sync();
-      lantern.light.intensity = candleIntensity * k * (0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 7)));
+      syncLight();
+      light.intensity = candleIntensity * k * (0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 7)));
     },
     onKnob: {
       candleIntensity: (v) => { candleIntensity = v; }, // @knob candleIntensity
@@ -188,9 +161,12 @@ export function createLayer(ctx, shared) {
         },
       },
       { id: 'noRim', toggle: (on) => { paint.rimOn.value = on ? 0 : 1; } },
-      { id: 'redCandle', toggle: (on) => { lantern.swap.value = on ? 1 : 0; } },
+      { id: 'redCandle', toggle: (on) => { lanterns.swap.value = on ? 1 : 0; } }, // mọi đèn chung uniform này
+    ],
+    readouts: [
+      { id: 'shadowMap', get: () => (shadowOn ? moonlight.shadow.mapSize.x : 0), unit: 'px' },
+      { id: 'lanterns', get: () => lanterns.alive(ctx.u.time.value) }, // đang nổi và đang chìm
     ],
-    readouts: [{ id: 'shadowMap', get: () => (shadowOn ? moonlight.shadow.mapSize.x : 0), unit: 'px' }],
     // Nấc của bộ điều chỉnh: chia đôi cỡ shadow map (không dưới 256). Mức thấp tắt bóng nên không có nấc này.
     degrade: shadowOn ? [halveShadow] : [],
     dispose() {
@@ -198,11 +174,10 @@ export function createLayer(ctx, shared) {
       disposed = true;
       ctx.scene.remove(...added);
       moon.dispose();
-      lantern.mesh.dispose();
-      lantern.mesh.material.dispose();
+      lanterns.dispose();
       moonlight.dispose();
       fill.dispose();
-      lantern.light.dispose();
+      light.dispose();
     },
   };
 }
```
Áp vào `src/paintings/ao-sen-dem/shared.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/shared.js b/src/paintings/ao-sen-dem/shared.js
index 2721c72..10b7f9c 100644
--- a/src/paintings/ao-sen-dem/shared.js
+++ b/src/paintings/ao-sen-dem/shared.js
@@ -1,7 +1,8 @@
-// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, cử chỉ.
+// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, hoa đăng, cử chỉ.
 import { Plane, Vector2, Vector3, Vector4 } from 'three/webgpu';
 import { Fn, Loop, exp, float, length, pow2, sin, step, uniform, uniformArray } from 'three/tsl';
 import { hourOfNight, tonight } from '../../lib/astro/moon.js';
+import { createLanternSlots } from './parts/anh-trang-drift.js';
 
 export const POND_RADIUS = 60; // bán kính mặt nước: đĩa nước của lớp 4 dùng đúng số này; chạm ngoài đĩa thì không gợn
 export const RIPPLE_SLOTS = 8;
@@ -107,13 +108,15 @@ export function setup(ctx) {
     spin: uniform(0).setName('swirlSpin'),
   };
   const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng (và xoáy sương) nhẹ hơn
+  // Vòng đệm hoa đăng (GĐ 5): lớp Ánh trăng vẽ mọi ô, mỗi khung tính lại từ đồng hồ của cảnh. Sức chứa theo mức.
+  const lanterns = createLanternSlots(ctx.budget.lanterns ?? 8, { pond: POND_RADIUS });
 
   const water = new Plane(new Vector3(0, 1, 0), 0);
   const hit = new Vector3();
   let holding = false;
 
   return {
-    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract, swirl },
+    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract, swirl, lanterns },
     // Thanh giờ (GĐ 4): xưởng vẽ thanh trượt, kéo thì chỉ đổi uHour.value. Ban ngày mượn 21:00 và ghi chú, nhưng chỉ
     // tới khi người xem kéo thanh đi: lúc đó họ đã chọn giờ của mình. Nhãn và chữ ghi chú ở content.dials.gio.
     dials: [{
```
Áp vào `src/paintings/ao-sen-dem/quality.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/quality.js b/src/paintings/ao-sen-dem/quality.js
index d3ec9d6..a604219 100644
--- a/src/paintings/ao-sen-dem/quality.js
+++ b/src/paintings/ao-sen-dem/quality.js
@@ -3,13 +3,15 @@
 /**
  * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor).
  * reflection 0 = phản chiếu giả (không vẽ cảnh lần hai); shadow 0 = tắt bóng.
+ * lanterns (GĐ 5) = số hoa đăng trôi tối đa: để ao không rối mắt hơn là để giữ nhịp khung (mọi đèn chung một draw call),
+ * nên hoa đăng không có nấc hạ chất lượng.
  * @type {import('../../engine/contracts/runtime.js').QualitySpec}
  */
 export const quality = {
   levels: {
-    cao: { dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3 },
-    vua: { dpr: 1.5, reflection: 0.35, fireflies: 1500, leaves: 800, shadow: 512, bloom: 0.25, fogOctaves: 2 },
-    thap: { dpr: 1.25, reflection: 0, fireflies: 600, leaves: 500, shadow: 0, bloom: 0.25, fogOctaves: 1 },
+    cao: { dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3, lanterns: 8 },
+    vua: { dpr: 1.5, reflection: 0.35, fireflies: 1500, leaves: 800, shadow: 512, bloom: 0.25, fogOctaves: 2, lanterns: 6 },
+    thap: { dpr: 1.25, reflection: 0, fireflies: 600, leaves: 500, shadow: 0, bloom: 0.25, fogOctaves: 1, lanterns: 4 },
   },
   // Máy chậm thì hạ theo thứ tự này: thứ ít thấy nhất trước (độ nét, chi tiết của sương, độ nét của phản chiếu và bloom),
   // thứ thấy rõ sau cùng (số đom đóm, độ nét của bóng). Mục nào lớp không đưa ra ở mức hiện tại thì xưởng bỏ qua.
```
Áp vào `src/paintings/ao-sen-dem/meta.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index abc2e3c..a31e168 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -51,6 +51,8 @@ export default {
         'paintings/ao-sen-dem/parts/anh-trang-moon.js',
         'paintings/ao-sen-dem/parts/anh-trang-paint.js',
         'paintings/ao-sen-dem/parts/anh-trang-shadow.js',
+        'paintings/ao-sen-dem/parts/anh-trang-lantern.js',
+        'paintings/ao-sen-dem/parts/anh-trang-drift.js',
       ],
     },
     {
```
Áp vào `src/paintings/ao-sen-dem/content.vi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index 48ea7d4..bbfe7f4 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -70,17 +70,21 @@ export default {
     'anh-trang': {
       understand:
         'Lớp này thắp đèn và sơn màu. Trăng là quả cầu tự phát sáng, đúng pha của đêm nay: đường ranh sáng tối '
-        + 'tính từ tuổi trăng. Ánh trăng là một DirectionalLight chiếu từ phía trăng, kèm MỘT shadow map: một '
-        + 'ảnh độ sâu nhìn từ trăng, để biết chỗ nào bị hoa và lá đứng che. Màu lấy đúng câu ca dao: lá xanh, '
-        + 'bông trắng, nhị vàng; màu nào cũng trộn từ đất sét theo trọng số của lớp. Mép cánh sen sáng lên nhờ '
-        + 'fresnel: chỗ mặt cánh gần song song với hướng nhìn thì phản quang mạnh. Lá có lớp clearcoat bóng như '
-        + 'sáp. Chiếc đèn hoa đăng là một ngọn đèn điểm ấm: cùng một ánh sáng, mỗi chất liệu đáp lại một khác.',
+        + 'tính từ tuổi trăng. Ánh trăng là một DirectionalLight chiếu từ phía trăng, kèm MỘT shadow map: ảnh độ '
+        + 'sâu nhìn từ trăng, để biết chỗ nào bị hoa và lá đứng che. Màu lấy đúng câu ca dao: lá xanh, bông '
+        + 'trắng, nhị vàng; màu nào cũng trộn từ đất sét theo trọng số. Mép cánh sen sáng lên nhờ fresnel: nhìn '
+        + 'càng xiên, bề mặt càng phản quang. Lá có lớp clearcoat bóng như sáp. Đèn hoa đăng ở bờ là đèn thật '
+        + '(PointLight): nó chiếu ấm lên lá và cánh sen quanh nó. Hoa đăng thả xuống nước chỉ tự phát sáng '
+        + '(emissive, có bloom) như trăng, không chiếu lên gì: thêm đèn thật lúc chạy là mọi chất liệu '
+        + 'phải biên dịch lại.',
       diagram: anhTrangDiagram,
       learned: [
         'DirectionalLight: ánh sáng song song từ rất xa, như trăng hay mặt trời.',
         'Shadow map: vẽ cảnh từ phía đèn để biết chỗ nào khuất sáng.',
         'Fresnel: bề mặt phản quang mạnh hơn khi nhìn xiên.',
         'Mọi màu đi từ đất sét: mix(đất sét, màu, trọng số).',
+        'Đèn thật chiếu sáng mọi thứ quanh nó nhưng thêm lúc chạy là biên dịch lại; vật tự phát sáng (emissive) rẻ hơn '
+          + 'nhiều nhưng không chiếu sáng gì.',
       ],
       readMore: [
         { title: 'LearnOpenGL · Shadow Mapping', url: 'https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping' },
@@ -94,7 +98,7 @@ export default {
         translucency: 'Cánh trong khi ngược sáng',
         clearcoat: 'Lớp bóng trên lá',
         candleColor: 'Màu đèn hoa đăng',
-        candleIntensity: 'Độ sáng đèn hoa đăng',
+        candleIntensity: 'Độ sáng đèn thật ở bờ',
         shadowMapSize: 'Cỡ shadow map (điểm ảnh)',
         shadowBias: 'Shadow bias',
       },
@@ -114,7 +118,7 @@ export default {
             + 'còn mặt nước soi nguyên ngọn đèn.',
         },
       },
-      readouts: { shadowMap: 'Cỡ shadow map' },
+      readouts: { shadowMap: 'Cỡ shadow map', lanterns: 'Hoa đăng đang trôi' },
       objects: { trang: 'Trăng', 'hoa-dang': 'Đèn hoa đăng' },
     },
```
Áp vào `src/engine/sma.js`:

```diff
diff --git a/src/engine/sma.js b/src/engine/sma.js
index 5784fde..ce89552 100644
--- a/src/engine/sma.js
+++ b/src/engine/sma.js
@@ -10,6 +10,7 @@
  * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
  * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu`, `quality().locked`, `tools()` và
  * `setTool(id | null)` (bật một công cụ học, hay tắt hết), `dials()` và `setDial(id, v)` (núm của cả bức, ví dụ giờ).
+ * GĐ 5: `readouts(layerId)`: số đo riêng của một lớp, như Sổ tay đọc, mà không phải mở Sổ tay (e2e, DevTools).
  *
  * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
  * @param {Window | Record<string, any>} win
@@ -69,5 +70,6 @@ export function studioApi(getStudio) {
     setTool: (id) => s()?.setTool(id),
     dials: () => s()?.dials() ?? [],
     setDial: (id, v) => s()?.setDial(id, v),
+    readouts: (layerId) => s()?.readouts(layerId) ?? [],
   };
 }
```

Spec §12 có thêm luật `files` của lớp:

Áp vào `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:

```diff
diff --git a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
index 171075e..99f41e6 100644
--- a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
+++ b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
@@ -1785,6 +1785,9 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - Tên vật: dựng ở mức cao và mức thấp, và trong lúc mỗi thí nghiệm đang bật, mọi vật trong `layer.objects` có `name` kebab-case
     không dấu, không trùng trong lớp, và có nhãn ở `content.layers[id].objects[name]`. Mọi khóa trong `objects` của content ứng với
     một vật có thật ở một trong các lần dựng đó (không có nhãn thừa).
+  - `LayerMeta.files` của mỗi lớp kê đủ mọi file trong `parts/` của bức mà file lớp (trong `layers/`) import tĩnh, thẳng hay qua part
+    khác (`staticClosure`, chỉ đi qua `parts/`): Sổ tay hiện đủ code của lớp. Cùng với luật "mỗi file thuộc tối đa một lớp", part là
+    của riêng một lớp: lớp khác cần gì của nó thì nhận qua `shared`.
 
 ### E2E (Playwright 1.63, Chromium headless shell, chạy trên bản build qua `vite preview`)
 - **Cấu hình chung:**
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/quality.test.js tests/unit/sma.test.js tests/paintings/contract.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  828 passed`.

```bash
git add docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md src/engine/sma.js src/paintings/ao-sen-dem/content.vi.js src/paintings/ao-sen-dem/layers/l2-anh-trang.js src/paintings/ao-sen-dem/meta.js src/paintings/ao-sen-dem/parts/anh-trang-lantern.js src/paintings/ao-sen-dem/quality.js src/paintings/ao-sen-dem/shared.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/quality.test.js tests/paintings/contract.test.js tests/unit/sma.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): hoa đăng của lớp Ánh trăng (đèn ở bờ và đèn thả ra chung một InstancedMesh, đường trôi tính theo thời gian; số đo "Hoa đăng đang trôi"); __sma.readouts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 10: Hoa đăng trong sương, nhấp nhô theo gợn, hắt vũng sáng trên nước

**Mục tiêu:** Spec §6 Lớp 3 "(GĐ 5) Hoa đăng trong sương", §6 Lớp 4 "(GĐ 5) Hoa đăng trên nước", §10 "chi phí lúc chưa dùng".
- **Lớp Sương:** emissive của đèn nhân thêm `(1 − hệ số sương)`. Sương của three chỉ trộn màu đầu ra, không chạm kênh emissive (bloom). Đèn cũng không dùng `mrtNode` được, vì ảnh phản chiếu vẽ đèn vào target không có MRT. Kết quả: ảnh chính nhân `(1 − f)²` (một lần từ hệ số này, một lần từ sương của three), bloom nhân `(1 − f)`. Hệ số sương chỉ tính một lần trong shader.
- **Lớp Mặt nước, nhấp nhô:** `positionNode` của đèn cộng `ripple(lanternCenter) × biên độ × BOB × w × lanternGlow`. Nhân `lanternGlow` thì đèn mới thả nhấp nhô dần trong 0,5 giây, và đèn đang chìm thôi nhấp nhô. Không có điều này, gợn sóng sẽ đẩy ngọn cánh lên khỏi mặt nước ngay trước khi ô bị giấu.
- **Lớp Mặt nước, vũng sáng:** một `Fn` lặp `pool.size` vòng; `If(float(i) >= lanternCount) Break`, nên ao trống chỉ tốn một phép so. Tổng `exp(−d²/r²) × độ sáng` nhân màu nến, trọng số lớp Ánh trăng, trọng số lớp này, `POOL.intensity` và `(1 − showHeight)` (thí nghiệm "Xem heightfield" giấu cả vũng sáng). Tổng này cộng vào `emissiveNode` của nước, KHÔNG vào `mrtNode`: mặt nước quanh đèn không bloom. `POOL = { radius: 1.6, intensity: 0.6 }`; Task 15 chỉnh bán kính về 1,1.
- **Test dịch shader trong Node:** `tests/helpers/nodes.js#compileMaterial(object, ctx, backend, { pass })` dịch material ra WGSL hay GLSL bằng node builder thật của three r186, không cần GPU.
  - Lượt `'scene'` có render target MRT (hai ảnh `output`/`emissive`), nên `mrtNode` cũng được dịch. Lượt `'reflector'` là một ảnh, không MRT.
  - Lý do cần target: r186 chỉ áp MRT và `mrtNode` khi `renderer.getRenderTarget() !== null`.
  - `nodesOf` lọc trùng theo `id`, vì node của r186 hay đi qua Proxy; `anh-trang.test.js` và `pow.test.js` dùng chung helper này.

**Files:**
- Modify: `src/paintings/ao-sen-dem/layers/l3-suong.js`, `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`
- Create: `tests/helpers/nodes.js`
- Test: `tests/paintings/ao-sen-dem/mat-nuoc.test.js`, `tests/paintings/ao-sen-dem/suong.test.js`, `tests/paintings/ao-sen-dem/anh-trang.test.js`, `tests/paintings/ao-sen-dem/pow.test.js`

**Interfaces:**
- Consumes: `shared.anhTrang.lantern = { material, pool: { node, count, size }, flame }` (Task 9); `ripple` và `BOB` của lớp Mặt nước.
- Produces: `compileMaterial(object, ctx, backend, { pass = 'scene' }) → { vertexShader, fragmentShader, outputs, problems }`, `nodesOf`, `uniformNames`, `attributeNames` trong `tests/helpers/nodes.js`.

- [ ] **Step 1: Test (hỏng: đèn chưa nhấp nhô, nước chưa có vũng sáng)**

Tạo `tests/helpers/nodes.js`:

```js
// tests/helpers/nodes.js — soi đồ thị node của three ngay trong Node (không GPU): duyệt mọi node, và dịch material ra WGSL/GLSL bằng node builder thật.
import { HalfFloatType, RenderTarget, WebGPURenderer } from 'three/webgpu';
import { makeMRT } from '../../src/engine/gpu/pipeline.js';

/**
 * Mọi node trong đồ thị của `root`, mỗi node một lần (đồ thị dùng chung nhánh). Node của TSL hay đi qua Proxy (nodeObject),
 * nên gộp theo `id` chứ không theo tham chiếu; test cũng so node theo `id`. getChildren() KHÔNG đi vào thân của một Fn
 * (thân chỉ chạy lúc dịch): muốn thấy vòng lặp hay phép so bên trong Fn thì dịch ra mã bằng compileMaterial.
 * @param {any} root
 * @returns {any[]}
 */
export function nodesOf(root) {
  const seen = new Map();
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node?.isNode || seen.has(node.id)) continue;
    seen.set(node.id, node);
    stack.push(...node.getChildren());
  }
  return [...seen.values()];
}

/** Tên (setName) của mọi uniform trong đồ thị của `root`. */
export const uniformNames = (root) => nodesOf(root).filter((n) => n.isUniformNode).map((n) => n.name);

/** Tên của mọi thuộc tính đỉnh (attribute) mà đồ thị của `root` đọc. */
export const attributeNames = (root) => nodesOf(root).filter((n) => n.type === 'AttributeNode').map((n) => n.getAttributeName());

// Giới hạn uniform buffer nhỏ nhất mà chuẩn bảo đảm: máy thật chỉ có thể lớn hơn.
const UNIFORM_BUFFER_LIMIT = { webgpu: 64 * 1024, webgl2: 16 * 1024 };

/**
 * Hai lượt vẽ cảnh: render target (ảnh HalfFloat như PassNode và ReflectorNode của r186 tạo) và MRT của renderer.
 * - scene: scene pass, hai ảnh tên 'output' và 'emissive' như pipeline.js xin kênh. MRTNode xếp đầu ra vào ảnh theo TÊN
 *   ảnh, nên tên phải khớp đầu ra của makeMRT. mrtNode của material gộp vào MRT đó (đè đầu ra cùng tên).
 * - reflector: ảnh phản chiếu, một ảnh, MRT null (ReflectorNode gọi setMRT(null) trước khi vẽ). Mọi vật đều vào ảnh này
 *   trừ chính mặt nước (reflector ẩn nó). Material có mrtNode mà vẽ ở đây thì mrtNode thay cả đầu ra, mà ảnh này không
 *   mang tên đầu ra nào: WGSL ra struct đầu ra rỗng.
 * View Normal (views.js) thêm ảnh thứ ba vào scene pass: biến thể đó chưa có ở đây.
 */
const PASSES = {
  scene() {
    const target = new RenderTarget(1, 1, { count: 2, type: HalfFloatType });
    target.textures[0].name = 'output';
    target.textures[1].name = 'emissive';
    return { target, mrt: makeMRT() };
  },
  reflector: () => ({ target: new RenderTarget(1, 1, { type: HalfFloatType }), mrt: null }),
};

/**
 * Dịch material của `object` ra mã shader như renderer làm ở lần vẽ đầu (NodeManager._createNodeBuilder của r186), nhưng
 * không cần GPU: renderer chưa init() vẫn có thư viện node, lighting, và backend để chọn node builder (WGSL cho WebGPU,
 * GLSL cho WebGL2). `pass` là lượt vẽ (PASSES): 'scene' (mặc định) ra đúng biến thể mà scene pass vẽ, có MRT của xưởng
 * và mrtNode của material; 'reflector' ra biến thể của ảnh phản chiếu, không MRT. Không có đèn: chỉ kiểm node của bức,
 * không kiểm mô hình chiếu sáng. Lỗi và cảnh báo của TSL đi ra console (three không ném), nên gom vào `problems` để test
 * so với []; `outputs` là số ảnh fragment shader ghi ra (countOutputs).
 * `problems` chỉ gom những gì three in ra TRONG lúc dịch, nên không đủ hết: cảnh báo in lúc dựng đồ thị (như API đã bỏ)
 * đã qua trước đó, và warnOnce của three (utils.js) chỉ in mỗi câu một lần cho cả lần nạp three (với Vitest: cả file
 * test), nên câu đã in một lần, lúc dựng đồ thị hay ở lần dịch trước, không bao giờ tới `problems`. Cảnh báo bằng warn
 * thường thì lần dịch nào cũng in, nên bắt được, vd "Return statement used in an inline 'Fn()'" (nhánh If trả giá trị
 * trong một Fn gọi ngay).
 * Ra được mã mới là qua bước của three: trình dịch WGSL/GLSL của GPU thật (e2e) có nhận hay không là chuyện khác.
 * @param {any} object  Mesh, InstancedMesh hay Sprite (đã dựng trong ctx.scene)
 * @param {{ scene: any, camera: any }} ctx
 * @param {'webgpu' | 'webgl2'} backend
 * @param {{ pass?: 'scene' | 'reflector' }} [options]
 * @returns {{ vertexShader: string, fragmentShader: string, outputs: number, problems: string[] }}
 */
export function compileMaterial(object, { scene, camera }, backend, { pass = 'scene' } = {}) {
  if (!PASSES[pass]) throw new Error(`compileMaterial: không có lượt vẽ "${pass}" (chỉ có ${Object.keys(PASSES).join(', ')})`);
  const renderer = new WebGPURenderer({ forceWebGL: backend === 'webgl2', canvas: { style: {} } });
  // Chưa init() thì hỏi tính năng là three ném lỗi, còn capabilities của WebGL2 chưa có. Dịch thử không cần tính năng nào;
  // InstancedMesh chỉ hỏi giới hạn uniform buffer để chọn chỗ đặt ma trận (uniform buffer hay thuộc tính).
  renderer.hasFeature = () => false;
  const capabilities = renderer.backend.capabilities ?? (renderer.backend.capabilities = {});
  capabilities.getUniformBufferLimit = () => UNIFORM_BUFFER_LIMIT[backend];
  // three chỉ áp MRT của renderer (và mrtNode của material) khi đang vẽ vào một render target (NodeMaterial.setup của
  // r186). Không đặt target là dịch biến thể vẽ thẳng ra canvas: một đầu ra, bỏ qua mrtNode, mà cảnh không bao giờ vẽ
  // như thế. setRenderTarget chỉ ghi lại target (chưa cấp phát gì trên GPU), nên chưa init() vẫn dùng được.
  const { target, mrt } = PASSES[pass]();
  renderer.setRenderTarget(target);
  renderer.setMRT(mrt);
  const builder = renderer.backend.createNodeBuilder(object, renderer);
  Object.assign(builder, {
    scene,
    camera,
    material: object.material,
    lightsNode: renderer.lighting.getNode(scene),
    environmentNode: null,
    fogNode: scene.fogNode ?? null,
    clippingContext: null,
  });
  builder.context.material = object.material;
  const problems = [];
  const saved = { error: console.error, warn: console.warn };
  console.error = (...args) => problems.push(args.map(String).join(' '));
  console.warn = console.error;
  try {
    builder.build();
  } finally {
    Object.assign(console, saved);
  }
  const { vertexShader, fragmentShader } = builder;
  return { vertexShader, fragmentShader, outputs: countOutputs(fragmentShader), problems };
}

/**
 * Số ảnh mà fragment shader ghi ra: số thành viên @location của struct đầu ra (WGSL), hay số `layout( location = N ) out`
 * (GLSL). Scene pass ghi 2 ảnh (output, emissive); ảnh phản chiếu 1. WGSL ra 0 là shader hỏng: struct rỗng
 * ("structures must have at least one member"), còn GLSL vẫn khai một đầu ra mà không ghi gì vào đó.
 * @param {string} fragmentShader
 */
function countOutputs(fragmentShader) {
  const struct = /struct Output\w* \{([^}]*)\}/.exec(fragmentShader);
  if (struct) return (struct[1].match(/@location\(/g) ?? []).length;
  return (fragmentShader.match(/layout\( location = \d+ \) out /g) ?? []).length;
}
```
Áp vào `tests/paintings/ao-sen-dem/mat-nuoc.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/mat-nuoc.test.js b/tests/paintings/ao-sen-dem/mat-nuoc.test.js
index c212ee2..fdcbf1e 100644
--- a/tests/paintings/ao-sen-dem/mat-nuoc.test.js
+++ b/tests/paintings/ao-sen-dem/mat-nuoc.test.js
@@ -1,12 +1,38 @@
-// tests/paintings/ao-sen-dem/mat-nuoc.test.js — Lớp 4 · Mặt nước: đĩa nước có chiếu sáng, reflector nằm ngang, MRT riêng, lá nhấp nhô.
+// tests/paintings/ao-sen-dem/mat-nuoc.test.js — Lớp 4 · Mặt nước: đĩa nước có chiếu sáng, reflector nằm ngang, MRT riêng, lá và hoa đăng nhấp nhô, vũng sáng quanh hoa đăng (soi cả mã WGSL/GLSL).
 import { describe, it, expect } from 'vitest';
 import { Vector3 } from 'three/webgpu';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import * as matNuoc from '../../../src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js';
 import { buildPainting } from '../../helpers/fake-ctx.js';
+import { attributeNames, compileMaterial, nodesOf, uniformNames } from '../../helpers/nodes.js';
 
 const build = (options) => buildPainting(painting, meta, { until: 'mat-nuoc', ...options });
+const LEVELS = [{ level: 'cao' }, { level: 'thap', budget: { reflection: 0 } }]; // reflector / phản chiếu giả
+const BACKENDS = ['webgpu', 'webgl2'];
+/** Bỏ lớp VarNode mà TSL tự bọc quanh oneMinus(), mul()… (biến "intent", r186): giá trị y như node bên trong. */
+const unwrap = (n) => (n?.isVarNode && n.intent ? unwrap(n.node) : n);
+const isAttribute = (name) => (n) => n?.type === 'AttributeNode' && n.getAttributeName() === name;
+const isUniform = (name) => (n) => n?.isUniformNode && n.name === name;
+const isOneMinus = (name) => (n) => n?.isMathNode && n.method === 'oneMinus' && isUniform(name)(unwrap(n.aNode));
+/** Đồ thị của `root` có phép nhân mà một vế thỏa `factor`, vế kia chứa uniform `marker` (để nhận ra nhánh) không? */
+const scaledBy = (root, factor, marker) => nodesOf(root).some((n) => n.isOperatorNode && n.op === '*'
+  && [[n.aNode, n.bNode], [n.bNode, n.aNode]].some(([a, b]) => factor(unwrap(a)) && uniformNames(b).includes(marker)));
+
+/**
+ * Mã của vòng vũng sáng (lanternPool trong l4-mat-nuoc.js), từ biến tổng tới hết vòng: tổng = 0; lặp `size` vòng; câu đầu so
+ * i với số đèn đang trôi rồi Break; d = điểm đang vẽ − tâm đèn; tổng += exp(d·d / −r²) × độ sáng (ô .z). Số chia phải ÂM:
+ * exp(+d²/r²) thì vũng sáng lớn dần ra xa thay vì tắt dần. fbm của sương cũng có một vòng `i < 5` mở đầu bằng phép so rồi
+ * Break, mà mức thấp có pool.size 5: chỉ phép so với lanternCount mới chọn đúng vòng này.
+ * @param {number} size  pool.size
+ * @param {string} array  mảng ô trong mã (đã thoát cho regex)
+ */
+const poolLoop = (size, array) => new RegExp([
+  String.raw`(\w+) = 0\.0;\s*for \( [^;]+ = 0; i < ${size}; i \+\+ \) \{`,
+  String.raw`\s*if \( \( (?:f32|float)\( i \) >= [\w.]*lanternCount \) \) \{\s*break;\s*\}`,
+  String.raw`\s*(\w+) = \( v_positionWorld\.xz - ${array}\[ i \]\.xy \);`,
+  String.raw`\s*\1 = \( \1 \+ \( exp\( \( dot\( \2, \2 \) / -[\d.]+ \) \) \* ${array}\[ i \]\.z \) \);\s*\}`,
+].join(''));
 
 describe('l4-mat-nuoc', () => {
   it('núm tĩnh: 4 núm gợn sóng + distortion + fresnelPower (uniform) + reflectionResolution (js)', () => {
@@ -76,6 +102,76 @@ describe('l4-mat-nuoc', () => {
     expect(shared.cot.standingMaterial.positionNode).toBeNull();
   });
 
+  it('hoa đăng nhấp nhô (GĐ 5): positionNode của đèn cộng độ cao gợn tại lanternCenter, nhân trọng số của lớp và lanternGlow (đèn chìm thì thôi nhấp nhô)', () => {
+    const still = buildPainting(painting, meta, { until: 'suong' }).shared.anhTrang.lantern.material;
+    expect(still.positionNode).toBeNull(); // chưa có lớp Mặt nước thì đèn đứng yên
+    const { positionNode } = build().shared.anhTrang.lantern.material;
+    expect(positionNode?.isNode).toBe(true);
+    expect(attributeNames(positionNode)).toEqual(expect.arrayContaining(['lanternCenter', 'lanternGlow']));
+    // lanternGlow là THỪA SỐ của độ nhấp nhô: đèn chìm hẳn (glow 0) thì sóng không nâng mũi cánh lên khỏi mặt nước
+    // ngay trước khi ô bị giấu. Đèn ở bờ luôn có glow 1 nên nhấp nhô đủ.
+    const factor = (n) => n.isOperatorNode && n.op === '*' && [n.aNode, n.bNode].some(isAttribute('lanternGlow'));
+    expect(nodesOf(positionNode).some(factor)).toBe(true);
+    // Mài (luật 3): lớp này ở trọng số 0 là nước đất sét phẳng lặng, đèn cũng thôi nhấp nhô. Hàm sóng không đọc trọng số,
+    // nên chỉ thừa số trọng số đưa được w_mat_nuoc vào positionNode.
+    expect(uniformNames(positionNode)).toContain('w_mat_nuoc');
+  });
+
+  it('vũng sáng (GĐ 5): cộng vào emissiveNode của nước (màu nến của đèn, nhân trọng số của lớp Ánh trăng và lớp này, tắt khi "Xem heightfield"), KHÔNG vào mrtNode (mặt nước quanh đèn không bloom)', () => {
+    for (const options of LEVELS) {
+      const [water] = build(options).layers['mat-nuoc'].objects;
+      const emissive = water.material.emissiveNode;
+      // anh_trang_swap ("Đổi màu đèn") nằm trong màu nến flame: chỉ vũng sáng đưa nó vào nước.
+      expect(uniformNames(emissive), options.level).toContain('anh_trang_swap');
+      expect(uniformNames(water.material.mrtNode), options.level).not.toContain('anh_trang_swap');
+      // Mài (luật 3): mài lớp Ánh trăng (đèn thành đất sét) hay lớp này (nước thành đất sét) đều tắt vũng sáng. Đếm tên
+      // uniform không đủ: ảnh phản chiếu đã nhân w_mat_nuoc, và phản chiếu giả (mức thấp) đã có w_anh_trang.
+      for (const weight of ['w_anh_trang', 'w_mat_nuoc']) {
+        expect(scaledBy(emissive, isUniform(weight), 'anh_trang_swap'), `${options.level} · ${weight}`).toBe(true);
+      }
+      // "Xem heightfield" chỉ còn ảnh xám của độ cao sóng: vũng sáng nhân (1 − showHeight) như ảnh phản chiếu. Ảnh phản
+      // chiếu cũng có thừa số đó, nên lại nhận ra vế của vũng sáng qua anh_trang_swap.
+      expect(scaledBy(emissive, isOneMinus('mat_nuoc_showHeight'), 'anh_trang_swap'), `${options.level} · 1 − showHeight`).toBe(true);
+    }
+  });
+
+  it('nước dịch được ra WGSL và GLSL ở mức cao và thấp, như scene pass vẽ nó (có MRT): vòng vũng sáng chạy pool.size vòng, Break ngay khi i chạm lanternCount, mỗi vòng cộng exp(−d²/r²) × độ sáng của một đèn', () => {
+    for (const options of LEVELS) {
+      const { ctx, layers, shared } = build(options);
+      const { pool } = shared.anhTrang.lantern; // pool.size = budget.lanterns + 1: cao 9, thấp 5
+      const [water] = layers['mat-nuoc'].objects;
+      // Thân của Fn không có trong đồ thị (nodesOf không thấy), nên soi mã: câu đầu của thân vòng là phép so với số đèn
+      // đang trôi (ao không có đèn trôi thì vòng đầu đã Break, spec §10), rồi tới vũng sáng của từng đèn.
+      for (const backend of BACKENDS) {
+        // Mảng ô: WGSL gọi theo tên đã đặt (lanternPool); GLSLNodeBuilder của r186 luôn gọi là buffer<id của node>, và đổi
+        // luôn tên node thành NodeBuffer_<id>. Vì thế WebGPU dịch trước WebGL2 (BACKENDS): ngược lại thì WGSL mang tên đó.
+        const array = backend === 'webgpu' ? String.raw`lanternPool\.value` : `buffer${pool.node.id}`;
+        const { fragmentShader, outputs, problems } = compileMaterial(water, ctx, backend);
+        expect(problems, `${options.level} · ${backend}`).toEqual([]);
+        // Hai ảnh của scene pass (output, emissive): mrtNode của nước (phần sáng vượt GLINT) cũng được dịch và kiểm.
+        expect(outputs, `${options.level} · ${backend}`).toBe(2);
+        expect(fragmentShader, `${options.level} · ${backend}`).toMatch(poolLoop(pool.size, array));
+      }
+    }
+  });
+
+  it('material hoa đăng dịch được ra WGSL và GLSL ở cả hai lượt vẽ đèn: scene pass (MRT) và ảnh phản chiếu (không MRT)', () => {
+    const { ctx, layers } = build();
+    const mesh = layers['anh-trang'].objects.find((o) => o.name === 'hoa-dang');
+    // Reflector vẽ cả đèn vào ảnh của nó (một ảnh, không MRT), nên đèn không được có mrtNode: muốn bloom của đèn mờ trong
+    // sương thì nhân thẳng vào emissiveNode (lớp Sương). Có mrtNode thì biến thể của ảnh phản chiếu ra struct đầu ra rỗng
+    // (outputs 0: WGSL hỏng).
+    expect(mesh.material.mrtNode).toBeNull();
+    for (const backend of BACKENDS) {
+      for (const [pass, outputs] of [['scene', 2], ['reflector', 1]]) {
+        const shader = compileMaterial(mesh, ctx, backend, { pass });
+        expect(shader.problems, `${pass} · ${backend}`).toEqual([]);
+        expect(shader.outputs, `${pass} · ${backend}`).toBe(outputs);
+        expect(shader.vertexShader, `${pass} · ${backend}`).toContain('lanternCenter'); // độ nhấp nhô đọc tâm đèn
+      }
+    }
+  });
+
   it("nấc 'phan-chieu': trần độ phân giải chia đôi (không dưới 0,15) rồi trả lại; hiệu lực = min(núm, trần)", () => {
     const scale = (layer) => layer.readouts.find((r) => r.id === 'reflectionScale').get();
     const { layers, knobs } = build();
```
Áp vào `tests/paintings/ao-sen-dem/suong.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/suong.test.js b/tests/paintings/ao-sen-dem/suong.test.js
index b6a93cd..3520905 100644
--- a/tests/paintings/ao-sen-dem/suong.test.js
+++ b/tests/paintings/ao-sen-dem/suong.test.js
@@ -1,4 +1,4 @@
-// tests/paintings/ao-sen-dem/suong.test.js — Lớp 3 · Sương: vòm trời, sương gán MỘT lần vào scene.fogNode, octave là uniform, nấc, thí nghiệm.
+// tests/paintings/ao-sen-dem/suong.test.js — Lớp 3 · Sương: vòm trời, sương gán MỘT lần vào scene.fogNode, hoa đăng mờ trong sương, octave là uniform, nấc, thí nghiệm.
 import { describe, it, expect } from 'vitest';
 import { BackSide } from 'three/webgpu';
 import { vec3 } from 'three/tsl';
@@ -8,6 +8,7 @@ import * as suong from '../../../src/paintings/ao-sen-dem/layers/l3-suong.js';
 import { SKY_RADIUS } from '../../../src/paintings/ao-sen-dem/parts/suong-troi.js';
 import { knobMax, knobValue } from '../../../src/engine/gpu/knob-set.js';
 import { buildPainting } from '../../helpers/fake-ctx.js';
+import { attributeNames, nodesOf, uniformNames } from '../../helpers/nodes.js';
 
 const build = (options) => buildPainting(painting, meta, { until: 'suong', ...options });
 const octaves = (layer) => layer.readouts.find((r) => r.id === 'octaves').get();
@@ -43,6 +44,18 @@ describe('l3-suong', () => {
     expect(shared.suong.sky(vec3(0, 1, 0)).isNode).toBe(true);
   });
 
+  it('hoa đăng trong sương (GĐ 5): emissiveNode của đèn được bọc thêm (1 − hệ số sương), vì sương không chạm kênh emissive', () => {
+    // Trước lớp Sương: độ sáng của đèn chưa dính gì tới sương.
+    const before = buildPainting(painting, meta, { until: 'anh-trang' }).shared.anhTrang.lantern.material.emissiveNode;
+    expect(uniformNames(before)).not.toContain('suong_density');
+    const { shared } = build();
+    const emissive = shared.anhTrang.lantern.material.emissiveNode;
+    const factorId = shared.suong.fogFactor.id;
+    // Lớp Sương sửa node của lớp trước lúc dựng: node mới có (1 − hệ số sương) và vẫn giữ độ sáng riêng của từng đèn.
+    expect(nodesOf(emissive).some((n) => n.isMathNode && n.method === 'oneMinus' && n.aNode?.id === factorId)).toBe(true);
+    expect(attributeNames(emissive)).toContain('lanternGlow');
+  });
+
   it('thí nghiệm chỉ đổi uniform: fogNode giữ nguyên (không biên dịch lại mọi material)', () => {
     const { ctx, layers } = build();
     const fogNode = ctx.scene.fogNode;
```
Áp vào `tests/paintings/ao-sen-dem/anh-trang.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/anh-trang.test.js b/tests/paintings/ao-sen-dem/anh-trang.test.js
index 32dd8ce..b2032e9 100644
--- a/tests/paintings/ao-sen-dem/anh-trang.test.js
+++ b/tests/paintings/ao-sen-dem/anh-trang.test.js
@@ -12,6 +12,7 @@ import { moonDirection } from '../../../src/paintings/ao-sen-dem/shared.js';
 import { moonPhase } from '../../../src/lib/astro/moon.js';
 import { knobValue } from '../../../src/engine/gpu/knob-set.js';
 import { NOW, buildPainting } from '../../helpers/fake-ctx.js';
+import { nodesOf } from '../../helpers/nodes.js';
 
 const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
 const lights = (scene, flag) => scene.children.filter((o) => o[flag]);
@@ -47,18 +48,6 @@ function lean(mesh, i, center) {
   return new Vector3().setFromMatrixColumn(m, 1).normalize().dot(out);
 }
 
-/** Mọi node trong đồ thị của root, mỗi node một lần (đồ thị dùng chung nhánh). */
-function nodesOf(root) {
-  const seen = new Set();
-  const stack = [root];
-  while (stack.length > 0) {
-    const node = stack.pop();
-    if (!node?.isNode || seen.has(node)) continue;
-    seen.add(node);
-    stack.push(...node.getChildren());
-  }
-  return [...seen];
-}
 const uniformIn = (root, name) => nodesOf(root).find((n) => n.isUniformNode && n.name === name);
 
 describe('l2-anh-trang', () => {
```
Áp vào `tests/paintings/ao-sen-dem/pow.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/pow.test.js b/tests/paintings/ao-sen-dem/pow.test.js
index 9dd6ed0..8ef570a 100644
--- a/tests/paintings/ao-sen-dem/pow.test.js
+++ b/tests/paintings/ao-sen-dem/pow.test.js
@@ -3,6 +3,7 @@ import { describe, it, expect } from 'vitest';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import { buildPainting } from '../../helpers/fake-ctx.js';
+import { nodesOf } from '../../helpers/nodes.js';
 
 /**
  * Bỏ lớp VarNode mà TSL tự bọc quanh abs(), oneMinus(), pow()… (biến "intent", r186) hoặc .toConst(): giá trị
@@ -32,37 +33,28 @@ function nonNegative(input) {
   return false;
 }
 
-/** Duyệt đồ thị node một lần mỗi node (đồ thị dùng chung nhánh, có thể lặp lại). */
-function* walk(root) {
-  const seen = new Set();
-  const stack = [root];
-  while (stack.length > 0) {
-    const node = stack.pop();
-    if (!node?.isNode || seen.has(node)) continue;
-    seen.add(node);
-    yield node;
-    for (const child of node.getChildren()) stack.push(child);
-  }
-}
-
 describe('pow trong vật liệu của Bức 1', () => {
-  it('cơ số của mọi pow chắc chắn không âm (saturate, abs, exp…): GLSL/WGSL không định nghĩa pow của số âm', () => {
-    const { ctx } = buildPainting(painting, meta, { until: 'vang-la' });
+  it('cơ số của mọi pow chắc chắn không âm (saturate, abs, exp…), ở mức cao và mức thấp: GLSL/WGSL không định nghĩa pow của số âm', () => {
     const errors = [];
-    let pows = 0;
-    ctx.scene.traverse((object) => {
-      for (const material of [object.material].flat().filter(Boolean)) {
-        for (const [slot, root] of Object.entries(material)) {
-          if (!slot.endsWith('Node') || !root?.isNode) continue;
-          for (const node of walk(root)) {
-            if (!node.isMathNode || node.method !== 'pow') continue;
-            pows += 1;
-            if (!nonNegative(node.aNode)) errors.push(`${object.name || object.type} · ${material.type}.${slot}: pow(${unwrap(node.aNode).method ?? unwrap(node.aNode).type}(…), …)`);
+    // Mức thấp dựng vật liệu khác mức cao: phản chiếu giả (parts/mat-nuoc-gia.js) có pow(…, SHARPNESS) của riêng nó.
+    for (const options of [{}, { level: 'thap', budget: { reflection: 0 } }]) {
+      const level = options.level ?? 'cao';
+      const { ctx } = buildPainting(painting, meta, { until: 'vang-la', ...options });
+      let pows = 0;
+      ctx.scene.traverse((object) => {
+        for (const material of [object.material].flat().filter(Boolean)) {
+          for (const [slot, root] of Object.entries(material)) {
+            if (!slot.endsWith('Node') || !root?.isNode) continue;
+            for (const node of nodesOf(root)) {
+              if (!node.isMathNode || node.method !== 'pow') continue;
+              pows += 1;
+              if (!nonNegative(node.aNode)) errors.push(`${level} · ${object.name || object.type} · ${material.type}.${slot}: pow(${unwrap(node.aNode).method ?? unwrap(node.aNode).type}(…), …)`);
+            }
           }
         }
-      }
-    });
-    expect(pows, 'không tìm thấy pow nào: test sẽ đúng rỗng').toBeGreaterThan(0);
+      });
+      expect(pows, `${level}: không tìm thấy pow nào, test sẽ đúng rỗng`).toBeGreaterThan(0);
+    }
     expect([...new Set(errors)]).toEqual([]);
   });
 });
```

Run: `npx vitest run tests/paintings/ao-sen-dem/mat-nuoc.test.js tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/pow.test.js`
Kết quả mong đợi: FAIL, 5 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be true // Object.is equality`.

- [ ] **Step 2: Code**

Áp vào `src/paintings/ao-sen-dem/layers/l3-suong.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l3-suong.js b/src/paintings/ao-sen-dem/layers/l3-suong.js
index 93e54ae..f315ce1 100644
--- a/src/paintings/ao-sen-dem/layers/l3-suong.js
+++ b/src/paintings/ao-sen-dem/layers/l3-suong.js
@@ -1,5 +1,5 @@
 // paintings/ao-sen-dem/layers/l3-suong.js — Lớp 3 · Sương: vòm trời (sao, quầng trăng, Ngân Hà) và sương là là trên mặt nước (scene.fogNode).
-import { color, min, mix, uniform } from 'three/tsl';
+import { color, min, mix, oneMinus, uniform } from 'three/tsl';
 import { MAX_OCTAVES } from '../../../lib/tsl/noise.js';
 import { createFog } from '../parts/suong-mu.js';
 import { createSkyDome, makeSky } from '../parts/suong-troi.js';
@@ -21,7 +21,8 @@ export const knobs = [
 
 /**
  * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
- * @param {object} shared  shared.moon, shared.hour, shared.swirl (setup của bức); shared.anhTrang.glow (lớp trước)
+ * @param {object} shared  shared.moon, shared.hour, shared.swirl (setup của bức); shared.anhTrang.glow và
+ *   shared.anhTrang.lantern (lớp trước)
  */
 export function createLayer(ctx, shared) {
   const w = ctx.weight(id);
@@ -65,6 +66,13 @@ export function createLayer(ctx, shared) {
   ctx.scene.fogNode = fog.node;
   // Sương không tác động lên kênh MRT emissive: lớp sau tự nhân (1 − fogFactor). Mặt nước dùng sky cho phản chiếu giả.
   shared.suong = { fogFactor: fog.factor, sky: skyW };
+  // Hoa đăng trong sương (GĐ 5): đèn của lớp Ánh trăng tự phát sáng, mà sương không chạm kênh emissive, nên đèn ở xa sẽ
+  // bloom xuyên sương. Nhân (1 − hệ số sương) vào emissiveNode như đom đóm. Đèn không dùng được mrtNode để chỉ làm mờ
+  // kênh bloom: reflector vẽ đèn vào ảnh không có MRT. Khác đom đóm (fog = false), đèn vẫn để sương trộn màu, nên trong
+  // ảnh chính phần tự phát sáng bị nhân (1 − hệ số) hai lần, kênh bloom một lần. Lớp sau sửa node của lớp trước được, vì
+  // chưa material nào biên dịch: gán node mới lúc dựng là đủ, không tốn gì lúc chạy.
+  const lantern = shared.anhTrang.lantern;
+  if (lantern) lantern.material.emissiveNode = lantern.material.emissiveNode.mul(oneMinus(fog.factor));
 
   let disposed = false;
   return {
```
Áp vào `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
index 9e9f131..d9e9256 100644
--- a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
+++ b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
@@ -1,11 +1,15 @@
-// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector; mức thấp soi giả), gợn sóng xẻ bóng trăng, lá nhấp nhô.
+// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector; mức thấp soi giả), gợn sóng xẻ bóng trăng, lá và hoa đăng nhấp nhô, vũng sáng quanh hoa đăng.
 import { CircleGeometry, Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
 import {
+  Break,
   Fn,
+  If,
+  Loop,
   attribute,
   cameraPosition,
   color,
   dot,
+  exp,
   float,
   max,
   mix,
@@ -15,7 +19,6 @@ import {
   oneMinus,
   positionLocal,
   positionWorld,
-  pow,
   reflector,
   saturate,
   transformNormalToView,
@@ -49,8 +52,38 @@ export const knobs = [
 
 const F0 = 0.03; // phản xạ khi nhìn thẳng xuống (Schlick): nước và sơn bóng đều khoảng 2–4%
 const RES_FLOOR = 0.15; // nấc 'phan-chieu' chia đôi độ phân giải phản chiếu nhưng không xuống dưới số này
-const BOB = 0.6; // lá nhô lên bằng 60% độ cao sóng
+const BOB = 0.6; // lá và hoa đăng nhô lên bằng 60% độ cao sóng
 const GLINT = 0.8; // phần phản chiếu sáng hơn mức này mới vào kênh emissive (bloom)
+// Vũng sáng quanh mỗi hoa đăng đang trôi (GĐ 5): exp(−d²/r²) còn 37% ở cách tâm đèn một bán kính, 2% ở hai bán kính.
+// Hai số này là số phỏng: dựng thử trên GPU thật sẽ chỉnh.
+const POOL = { radius: 1.6, intensity: 0.6 };
+
+/**
+ * Vũng sáng của các hoa đăng đang trôi (GĐ 5): Σ exp(−d²/r²) × độ sáng, với d là khoảng cách trên mặt nước từ điểm đang vẽ
+ * tới tâm từng đèn. Vòng lặp THẬT trong shader, như fbm có số tầng là node: lặp tối đa `size` ô, Break khi tới `count`
+ * (đèn đang trôi dồn lên đầu mảng). Ao không có đèn trôi thì vòng đầu đã Break: shader không cộng ô nào, chỉ tốn một phép
+ * so. Còn mảng ô (size × 16 byte) thì vẫn được chép lên GPU ở mỗi lần vẽ nước, như mảng gợn sóng: uniformArray là một bộ
+ * đệm riêng trong nhóm uniform của từng vật (objectGroup), và r186 chép lại bộ đệm đó ở mọi lượt vẽ. Đèn ở bờ không có
+ * trong mảng: nó có đèn thật (PointLight) chiếu xuống nước rồi.
+ * @param {{ node: any, count: any, size: number }} pool  shared.anhTrang.lantern.pool: mỗi ô vec4(x, z, độ sáng, 0)
+ * @returns {any}  node float
+ */
+function lanternPool({ node, count, size }) {
+  return Fn(() => {
+    const p = positionWorld.xz;
+    const sum = float(0).toVar();
+    Loop(size, ({ i }) => {
+      // i là số nguyên của vòng lặp; count là uniform số thực: đổi i sang float rồi mới so (như fbm).
+      If(float(i).greaterThanEqual(count), () => {
+        Break();
+      });
+      const spot = node.element(i);
+      const d = p.sub(spot.xy);
+      sum.addAssign(exp(dot(d, d).div(-(POOL.radius ** 2))).mul(spot.z));
+    });
+    return sum;
+  })();
+}
 
 /**
  * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
@@ -113,6 +146,14 @@ export function createLayer(ctx, shared) {
   const mirror = reflection.mul(fresnel).mul(w).mul(oneMinus(showHeight));
   // Độ cao gợn sóng (khoảng ±0.5) đổi thành xám quanh 0.5: sáng là đỉnh sóng, tối là đáy sóng.
   const height = vec3(ripple(positionWorld.xz).mul(2).add(0.5)).mul(showHeight);
+  // Hoa đăng (GĐ 5): lớp Ánh trăng dựng đèn; lớp này hắt vũng sáng của đèn xuống nước và cho đèn nhấp nhô (dưới kia).
+  // Vũng sáng mang màu nến (flame, có cả "Đổi màu đèn"), theo trọng số của lớp Ánh trăng và của lớp này; "Xem heightfield"
+  // tắt nó như tắt ảnh phản chiếu.
+  const lantern = shared.anhTrang.lantern;
+  const poolLight = lantern
+    ? lanternPool(lantern.pool).mul(lantern.flame).mul(POOL.intensity)
+      .mul(ctx.weight('anh-trang')).mul(w).mul(oneMinus(showHeight))
+    : vec3(0);
 
   // Có chiếu sáng: ở trọng số 0 đĩa là đất sét dưới đèn xưởng như mọi hình khác (luật 3).
   const material = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0 });
@@ -120,10 +161,11 @@ export function createLayer(ctx, shared) {
   material.colorNode = mix(mix(color(hex.datSet), mix(color(hex.denThen), color(hex.canhGian), 0.5), w), vec3(0), showHeight);
   material.roughnessNode = mix(float(0.9), float(0.06), w);
   material.normalNode = transformNormalToView(mix(vec3(0, 1, 0), normal, w)); // đĩa đặt ở gốc: local = world
-  // Ảnh phản chiếu cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
-  material.emissiveNode = mirror.add(height);
+  // Ảnh phản chiếu (và vũng sáng của hoa đăng) cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
+  material.emissiveNode = mirror.add(poolLight).add(height);
   // ...nhưng kênh MRT 'emissive' của nước CHỈ nhận phần sáng vượt GLINT: bóng trăng và bóng đom đóm
-  // tỏa nhẹ, còn cả mặt nước thì không. Sương không chạm tới kênh emissive, nên tự nhân (1 − hệ số sương):
+  // tỏa nhẹ, còn cả mặt nước thì không (vũng sáng cũng không: chỉ ngọn đèn tỏa, nước quanh nó thì không).
+  // Sương không chạm tới kênh emissive, nên tự nhân (1 − hệ số sương):
   // bóng trăng ở xa trong sương không bloom xuyên sương. mrtNode chỉ an toàn vì reflector tự ẩn chính mặt nước
   // khi chụp (mức thấp thì không có reflector): material có mrtNode mà vẽ vào target KHÔNG có MRT sẽ hỏng shader.
   material.mrtNode = mrt({ emissive: vec4(max(mirror.sub(GLINT), 0).mul(oneMinus(shared.suong.fogFactor)), 1) });
@@ -136,6 +178,15 @@ export function createLayer(ctx, shared) {
   // Lá nổi của Cốt nhấp nhô theo cùng hàm sóng, đọc TÂM lá (positionNode chạy sau instancing).
   const center = attribute('instanceCenter', 'vec2');
   shared.cot.leafMaterial.positionNode = positionLocal.add(vec3(0, ripple(center).mul(BOB).mul(w), 0));
+  if (lantern) {
+    // Hoa đăng cũng vậy, đọc tâm đèn; đèn ở bờ cũng nhấp nhô. Không có gợn thì đèn đứng yên: độ nhấp nhô không đổi poster.
+    // Như lá, đèn đọc mảng gợn sóng, nên mỗi lần vẽ đèn (cảnh chính, và ảnh của reflector nếu có) three chép mảng đó lên
+    // GPU (8 ô × 16 byte).
+    // Nhân lanternGlow (đã gồm 1 − độ chìm): đèn đang chìm thôi nhấp nhô cùng lúc với tắt dần, kẻo sóng nâng mũi cánh
+    // lên khỏi mặt nước ngay trước khi ô của nó bị giấu (anh-trang-lantern.js, SINK).
+    const bob = ripple(attribute('lanternCenter', 'vec2')).mul(BOB).mul(w).mul(attribute('lanternGlow', 'float'));
+    lantern.material.positionNode = positionLocal.add(vec3(0, bob, 0));
+  }
 
   let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
   let disposed = false;
```

Run: `npx vitest run tests/paintings/ao-sen-dem/mat-nuoc.test.js tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/pow.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  833 passed`.

```bash
git add src/paintings/ao-sen-dem/layers/l3-suong.js src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js tests/helpers/nodes.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/mat-nuoc.test.js tests/paintings/ao-sen-dem/pow.test.js tests/paintings/ao-sen-dem/suong.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): hoa đăng mờ trong sương, nhấp nhô theo gợn và hắt vũng sáng trên nước (Loop dừng ngay khi không có đèn trôi)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 11: Chạm hai lần lên nước thả hoa đăng mang một cặp câu thơ

**Mục tiêu:** Spec §4.2 (thả hoa đăng, gợi ý mới), §5 (12 cặp câu thơ), §4.1 mục 10.
- **Thơ.** `content.captions.vi.js` giữ 12 cặp câu của spec §5, đúng thứ tự và đúng chữ. Ca dao ghi `source: 'Ca dao'`; thơ có tác giả ghi `source` là tên tác phẩm và `author`. Mục `guong-nga` có chú thích "chữ chưa đối chiếu được trên mạng, Bao kiểm" (spec §5). File không import gì, nên e2e import được trong Node.
- **Thả đèn** (`shared.js`). `setup()` tính `order = verseOrder(ctx.captions.keys, ctx.now)` một lần. Nhánh `'double-tap'` đứng trước bộ lọc tap/hold cuối cùng. Chạm hai lần trên ao thì:
  - lấy câu kế tiếp `order[released % n]`;
  - thả đèn với `dir = driftDirection(x, z, moonDir.value)`, tức trăng LÚC THẢ (kéo thanh giờ sau đó không đổi đường);
  - gọi `ctx.captions.show(khóa, anchor)`, với điểm neo cao `VERSE_HEIGHT` = 0,9 (trên ngọn nến một chút), trả `null` khi đèn đã chìm hẳn.
- **Khi không thả.** Chạm lên trời hay ngoài ao thì không thả gì và không tốn câu nào. Hai lần chạm trước đó vẫn là hai `'tap'` (gợn sóng, đom đóm tản) như cũ.
- **Gợi ý** thành "Chạm vào mặt nước · chạm hai lần để thả hoa đăng". Câu dài 48 ký tự; màn hẹp (chừng 340 px trở xuống, khi đã có khung một cột của Task 13) thì xuống hai dòng, nên `.hint` có thêm `text-align: center; text-wrap: balance`.
- **e2e:** Node không import được `content.vi.js` (vì `.svg?raw`), nên `e2e/ao-sen-dem.spec.js` giữ gợi ý trong hằng `HINT`, và unit test ghim `content.hint` vào đúng chuỗi đó.

**Files:**
- Create: `src/paintings/ao-sen-dem/content.captions.vi.js`, `tests/paintings/ao-sen-dem/tha-hoa-dang.test.js`, `tests/helpers/rays.js` (tia giả chiếu xuống mặt nước, `shared.test.js` và test mới dùng chung)
- Modify: `src/paintings/ao-sen-dem/shared.js`, `src/paintings/ao-sen-dem/content.vi.js`, `src/styles/shell.css` (`.hint`), `e2e/ao-sen-dem.spec.js`
- Test: `tests/paintings/ao-sen-dem/shared.test.js`

**Interfaces:**
- Consumes: `'double-tap'` (Task 2); `ctx.captions` (Task 4); `driftDirection`, `verseOrder`, `lanternAt` (Task 8); `shared.lanterns` (Task 9).
- Produces: `content.captions` của Bức 1 (12 khóa: `den-khoe` … `nuoc-biec`); hằng `HINT` của e2e.

- [ ] **Step 1: Test (hỏng: chưa có `content.captions`, `'double-tap'` bị bộ lọc bỏ qua)**

Tạo `tests/helpers/rays.js`:

```js
// tests/helpers/rays.js — tia của cử chỉ cho test của bức: setup() của bức tự giao tia này với mặt phẳng y = 0.
import { Ray, Vector3 } from 'three/webgpu';

/** Tia thẳng đứng từ trên cao xuống điểm (x, z) của mặt nước (mặt phẳng y = 0). */
export const down = (x, z) => new Ray(new Vector3(x, 10, z), new Vector3(0, -1, 0));
```
Tạo `tests/paintings/ao-sen-dem/tha-hoa-dang.test.js`:

```js
// tests/paintings/ao-sen-dem/tha-hoa-dang.test.js — chạm hai lần lên nước thả hoa đăng (GĐ 5): đèn ở chỗ chạm, trôi về lối trăng lúc thả, mang câu thơ kế tiếp của đêm nay.
import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import content from '../../../src/paintings/ao-sen-dem/content.vi.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { DRIFT, driftDirection, lanternAt, verseOrder } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
import { POND_RADIUS, moonDirection, setup } from '../../../src/paintings/ao-sen-dem/shared.js';
import { NOW, buildPainting, fakeCaptions, makeEngineCtx } from '../../helpers/fake-ctx.js';
import { down } from '../../helpers/rays.js';

describe('chạm hai lần: thả hoa đăng mang một cặp câu thơ (GĐ 5)', () => {
  /** Ô của vòng đệm có đèn thả lúc t. */
  const releasedAt = (shared, t) => shared.lanterns.slots.find((s) => s.t0 === t);
  /** Tia từ chỗ đứng của camera ngước lên trời: không bao giờ cắt mặt nước. */
  const sky = () => new Ray(new Vector3(0, 6, 32), new Vector3(0, 0.3, -1).normalize());

  it('chạm hai lần trên ao: một hoa đăng thả đúng chỗ, lúc ctx.u.time (số đo lanterns 0 → 1); chữ là khóa đầu của verseOrder(keys, NOW) và neo theo đèn', () => {
    const keys = Object.keys(content.captions);
    const { ctx, setup: s, shared, layers } = buildPainting(painting, meta, { until: 'anh-trang', captions: fakeCaptions(keys) });
    const layer = layers['anh-trang'];
    const lanterns = () => layer.readouts.find((r) => r.id === 'lanterns').get();
    expect(lanterns()).toBe(0);
    ctx.u.time.value = 2.5;
    s.onGesture({ kind: 'double-tap', ray: down(3, 4) });
    layer.update(1 / 60, 2.5);
    const slot = releasedAt(shared, 2.5);
    expect(slot).toMatchObject({ x: 3, z: 4 });
    expect(lanterns()).toBe(1);
    expect(ctx.captions.show).toHaveBeenCalledTimes(1);
    const [key, anchor] = ctx.captions.show.mock.calls[0];
    expect(key).toBe(verseOrder(keys, NOW)[0]);
    expect(slot.key).toBe(key);
    // Lúc thả: điểm neo ở ngay trên chỗ chạm. Về sau: đi theo đèn (cùng công thức với lớp Ánh trăng), không đứng lại.
    const start = anchor();
    expect([start.x, start.z]).toEqual([3, 4]);
    expect(start.y).toBeGreaterThan(0);
    ctx.u.time.value = 12.5;
    const later = anchor();
    const drifted = lanternAt(slot, 12.5);
    expect([later.x, later.z]).toEqual([drifted.x, drifted.z]);
    expect(Math.hypot(later.x - 3, later.z - 4)).toBeGreaterThan(1);
    expect(later.y).toBe(start.y);
    // Đèn chìm hẳn: anchor() trả null, chữ ẩn đi (không phải lỗi).
    ctx.u.time.value = 2.5 + DRIFT.life + DRIFT.sink + 1;
    expect(anchor()).toBeNull();
  });

  it('đèn trôi về lối trăng nhìn từ chỗ đứng của camera, theo trăng LÚC THẢ; kéo thanh giờ sau đó không đổi đường (§4.2)', () => {
    const s = setup(makeEngineCtx(meta));
    s.shared.hour.value = 27; // kéo thanh tới 03:00 rồi mới thả: trăng đã sang phải
    s.update(1 / 60, 0);
    s.onGesture({ kind: 'double-tap', ray: down(3, 4) });
    const slot = s.shared.lanterns.slots.find((q) => q.seq === 0);
    // Gốc là chỗ đứng của camera trong painting.js (shared.js dùng gốc mặc định của driftDirection): dời camera mà quên
    // dời gốc theo thì test này hỏng.
    const [cx, , cz] = painting.camera.position;
    const [dx, dz] = driftDirection(3, 4, new Vector3(...moonDirection(27)), { origin: [cx, cz] });
    expect(slot.dx).toBeCloseTo(dx, 9);
    expect(slot.dz).toBeCloseTo(dz, 9);
    s.shared.hour.value = 19; // kéo tiếp: đèn đã thả giữ đường cũ
    s.update(1 / 60, 1);
    expect(slot.dx).toBeCloseTo(dx, 9);
    expect(slot.dz).toBeCloseTo(dz, 9);
  });

  it('mỗi lần thả là câu kế tiếp của đêm nay, neo vào đèn của chính nó; hết danh sách thì quay lại đầu', () => {
    const keys = ['mot', 'hai', 'ba'];
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(keys) });
    const s = setup(ctx);
    const spots = [[-10, 10], [-4, 12], [2, 8], [8, 14]];
    spots.forEach(([x, z], k) => {
      ctx.u.time.value = k;
      s.onGesture({ kind: 'double-tap', ray: down(x, z) });
    });
    const order = verseOrder(keys, NOW);
    const { calls } = ctx.captions.show.mock;
    expect(calls.map(([key]) => key)).toEqual([...order, order[0]]);
    spots.forEach(([x, z], k) => {
      ctx.u.time.value = k; // đúng lúc thả: điểm neo ở ngay chỗ chạm
      const at = calls[k][1]();
      expect([at.x, at.z], `lần thả ${k + 1}`).toEqual([x, z]);
    });
  });

  it('chạm hai lần lên trời hay ngoài ao: không thả đèn, không có chữ, không tốn câu nào của danh sách', () => {
    // Ba khóa cho hai lần trượt: nếu mỗi lần trượt tốn một câu thì lần thả thật ra order[2]. Với hai khóa, tốn hai câu
    // lại vòng về đúng order[0] và test không thấy gì.
    const keys = ['mot', 'hai', 'ba'];
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(keys) });
    const s = setup(ctx);
    s.onGesture({ kind: 'double-tap', ray: sky() });
    s.onGesture({ kind: 'double-tap', ray: down(POND_RADIUS + 1, 0) });
    expect(s.shared.lanterns.slots.every((slot) => slot.t0 === -Infinity)).toBe(true);
    expect(s.shared.lanterns.alive(ctx.u.time.value)).toBe(0);
    expect(ctx.captions.show).not.toHaveBeenCalled();
    s.onGesture({ kind: 'double-tap', ray: down(0, 10) });
    expect(ctx.captions.show.mock.calls.map(([key]) => key)).toEqual([verseOrder(keys, NOW)[0]]);
  });

  it('không có chữ (keys rỗng, như khi chữ tải hỏng): đèn vẫn được thả, không gọi show', () => {
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions([]) });
    const s = setup(ctx);
    ctx.u.time.value = 1;
    s.onGesture({ kind: 'double-tap', ray: down(-2, 6) });
    expect(releasedAt(s.shared, 1)).toMatchObject({ x: -2, z: 6, key: null });
    expect(s.shared.lanterns.alive(1)).toBe(1);
    expect(ctx.captions.show).not.toHaveBeenCalled();
  });

  it('hai lần chạm vẫn là hai "tap" (gợn sóng, đom đóm tản) như cũ; "double-tap" theo sau chỉ thả đèn, không thêm gợn', () => {
    const ctx = makeEngineCtx(meta, { captions: fakeCaptions(['mot']) });
    const s = setup(ctx);
    ctx.u.time.value = 2;
    s.onGesture({ kind: 'tap', ray: down(3, 4) });
    expect(s.shared.ripples.slots[0].toArray()).toEqual([3, 4, 2, 1]);
    expect(s.shared.attract.strength.value).toBeLessThan(0);
    expect(s.shared.lanterns.alive(2)).toBe(0); // một lần chạm: chưa có đèn, chưa có chữ
    expect(ctx.captions.show).not.toHaveBeenCalled();
    ctx.u.time.value = 2.25;
    // gesture.js phát lần chạm hai thành 'tap' rồi 'double-tap', cùng chỗ.
    s.onGesture({ kind: 'tap', ray: down(4, 4) });
    s.onGesture({ kind: 'double-tap', ray: down(4, 4) });
    expect(s.shared.ripples.slots.filter((v) => v.w > 0).map((v) => v.toArray())).toEqual([[3, 4, 2, 1], [4, 4, 2.25, 1]]);
    expect(releasedAt(s.shared, 2.25)).toMatchObject({ x: 4, z: 4 }); // đèn hiện giữa vòng gợn thứ hai
    expect(ctx.captions.show).toHaveBeenCalledTimes(1);
  });

  it('content.vi.js: mười hai cặp câu của spec §5 theo đúng thứ tự, mỗi mục hai dòng có nguồn; gợi ý nhắc chạm hai lần', () => {
    expect(Object.keys(content.captions)).toEqual([
      'den-khoe', 'trang-khoe', 'thuyen-ve', 'gio-dua', 'mit-mu', 'trang-bao-nhieu',
      'thach-luu', 'chen-ruou', 'guong-nga', 'ao-thu', 'lung-giau', 'nuoc-biec',
    ]);
    for (const [key, poem] of Object.entries(content.captions)) {
      expect(poem.lines, key).toHaveLength(2);
      expect(poem.source, key).toBeTruthy();
    }
    expect(content.hint).toBe('Chạm vào mặt nước · chạm hai lần để thả hoa đăng');
  });
});
```
Áp vào `tests/paintings/ao-sen-dem/shared.test.js`:

```diff
diff --git a/tests/paintings/ao-sen-dem/shared.test.js b/tests/paintings/ao-sen-dem/shared.test.js
index f90df8e..dfd6605 100644
--- a/tests/paintings/ao-sen-dem/shared.test.js
+++ b/tests/paintings/ao-sen-dem/shared.test.js
@@ -13,10 +13,9 @@ import {
   setup,
 } from '../../../src/paintings/ao-sen-dem/shared.js';
 import { NOW, makeEngineCtx } from '../../helpers/fake-ctx.js';
+import { down } from '../../helpers/rays.js';
 
 const vn = (s) => new Date(`${s}+07:00`);
-/** Tia thẳng đứng từ trên cao xuống điểm (x, z) của mặt nước. */
-const down = (x, z) => new Ray(new Vector3(x, 10, z), new Vector3(0, -1, 0));
 
 describe('defaultHour: chính sách giờ của Bức 1', () => {
   it('đêm dùng giờ thật trên thang 18 → 29,5', () => {
```

Run: `npx vitest run tests/paintings/ao-sen-dem/tha-hoa-dang.test.js tests/paintings/ao-sen-dem/shared.test.js`
Kết quả mong đợi: FAIL, 7 test hỏng; lỗi đầu tiên: `TypeError: Cannot convert undefined or null to object`.

- [ ] **Step 2: Code**

Tạo `src/paintings/ao-sen-dem/content.captions.vi.js`:

```js
// paintings/ao-sen-dem/content.captions.vi.js — thơ của hoa đăng (chữ đi theo vật): mỗi mục một cặp câu và nguồn; content.vi.js gộp vào captions.

/**
 * Mười hai cặp câu, đều là ca dao hay thơ cổ điển đã hết bản quyền (spec §5). Ca dao thì source là 'Ca dao'; thơ có tác giả
 * thì source là tên bài, author là nhà thơ. Mỗi lần thả hoa đăng hiện một cặp, theo thứ tự shared.js xáo theo đêm.
 * Code của bức chỉ cầm KHÓA (kebab-case không dấu); mỗi dòng tối đa 60 ký tự để vừa một hàng trên điện thoại (test hợp đồng giữ).
 * File không import gì, nên e2e (Node của Playwright) import thẳng được để đoán câu sẽ hiện.
 * @type {Record<string, import('../../engine/contracts/painting.js').Poem>}
 */
export default {
  'den-khoe': { lines: ['Đèn khoe đèn tỏ hơn trăng', 'Đèn ra trước gió còn chăng hỡi đèn?'], source: 'Ca dao' },
  'trang-khoe': { lines: ['Trăng khoe trăng tỏ hơn đèn', 'Cớ sao trăng lại chịu luồn đám mây?'], source: 'Ca dao' },
  'thuyen-ve': { lines: ['Thuyền về có nhớ bến chăng?', 'Bến thì một dạ khăng khăng đợi thuyền'], source: 'Ca dao' },
  'gio-dua': { lines: ['Gió đưa cành trúc la đà', 'Tiếng chuông Trấn Vũ, canh gà Thọ Xương'], source: 'Ca dao' },
  'mit-mu': { lines: ['Mịt mù khói tỏa ngàn sương', 'Nhịp chày Yên Thái, mặt gương Tây Hồ'], source: 'Ca dao' },
  'trang-bao-nhieu': { lines: ['Trăng bao nhiêu tuổi trăng già', 'Núi bao nhiêu tuổi gọi là núi non'], source: 'Ca dao' },
  'thach-luu': { lines: ['Thạch lựu hiên còn phun thức đỏ', 'Hồng liên trì đã tiễn mùi hương'], source: 'Bảo kính cảnh giới', author: 'Nguyễn Trãi' },
  'chen-ruou': { lines: ['Chén rượu hương đưa say lại tỉnh', 'Vầng trăng bóng xế khuyết chưa tròn'], source: 'Tự tình II', author: 'Hồ Xuân Hương' },
  // Chữ của mục này chưa đối chiếu được với bản nào trên mạng: Bao kiểm lại trước khi deploy, hoặc thay bằng một câu khác (spec §5).
  'guong-nga': { lines: ['Gương nga chênh chếch dòm song', 'Vàng gieo ngấn nước, cây lồng bóng sân'], source: 'Truyện Kiều', author: 'Nguyễn Du' },
  'ao-thu': { lines: ['Ao thu lạnh lẽo nước trong veo', 'Một chiếc thuyền câu bé tẻo teo'], source: 'Thu điếu', author: 'Nguyễn Khuyến' },
  'lung-giau': { lines: ['Lưng giậu phất phơ màu khói nhạt', 'Làn ao lóng lánh bóng trăng loe'], source: 'Thu ẩm', author: 'Nguyễn Khuyến' },
  'nuoc-biec': { lines: ['Nước biếc trông như tầng khói phủ', 'Song thưa để mặc bóng trăng vào'], source: 'Thu vịnh', author: 'Nguyễn Khuyến' },
};
```
Áp vào `src/paintings/ao-sen-dem/content.vi.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index bbfe7f4..41e42a2 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -1,5 +1,6 @@
-// paintings/ao-sen-dem/content.vi.js — chữ tiếng Việt của Bức 1: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
+// paintings/ao-sen-dem/content.vi.js — chữ tiếng Việt của Bức 1: gợi ý tương tác, thơ của hoa đăng; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
 import phuBong from '../../engine/stock/phu-bong/content.vi.js';
+import captions from './content.captions.vi.js';
 import cotDiagram from './diagrams/cot.svg?raw';
 import anhTrangDiagram from './diagrams/anh-trang.svg?raw';
 import suongDiagram from './diagrams/suong.svg?raw';
@@ -12,7 +13,9 @@ import vangLaDiagram from './diagrams/vang-la.svg?raw';
  * @type {import('../../engine/contracts/painting.js').PaintingContent}
  */
 export default {
-  hint: 'Chạm vào mặt nước',
+  hint: 'Chạm vào mặt nước · chạm hai lần để thả hoa đăng',
+  // Thơ của hoa đăng (chữ đi theo vật): mỗi lần thả một cặp câu; shared.js chỉ cầm khóa. Tách file riêng để file này dưới 300 dòng.
+  captions,
   // Thanh giờ (Dial 'gio' của shared.js). Ghi chú 'daytime' chỉ hiện khi đang là ban ngày và thanh chưa bị kéo đi.
   dials: {
     gio: {
```
Áp vào `src/paintings/ao-sen-dem/shared.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/shared.js b/src/paintings/ao-sen-dem/shared.js
index 10b7f9c..cfa64b8 100644
--- a/src/paintings/ao-sen-dem/shared.js
+++ b/src/paintings/ao-sen-dem/shared.js
@@ -1,13 +1,15 @@
-// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, hoa đăng, cử chỉ.
+// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay (thanh giờ), hướng trăng, gợn sóng, điểm hút đom đóm, xoáy sương, hoa đăng kèm thơ, cử chỉ.
 import { Plane, Vector2, Vector3, Vector4 } from 'three/webgpu';
 import { Fn, Loop, exp, float, length, pow2, sin, step, uniform, uniformArray } from 'three/tsl';
 import { hourOfNight, tonight } from '../../lib/astro/moon.js';
-import { createLanternSlots } from './parts/anh-trang-drift.js';
+import { createLanternSlots, driftDirection, lanternAt, verseOrder } from './parts/anh-trang-drift.js';
 
 export const POND_RADIUS = 60; // bán kính mặt nước: đĩa nước của lớp 4 dùng đúng số này; chạm ngoài đĩa thì không gợn
 export const RIPPLE_SLOTS = 8;
 const NIGHT = { start: 18, end: 29.5, fallback: 21 }; // thang giờ của Bức 1: 18:00 → 05:30 sáng hôm sau
 const FLY_HEIGHT = 1.2; // điểm hút đom đóm nằm trên mặt nước một chút
+// Điểm neo của câu thơ: trên ngọn nến một chút (mũi cánh đèn nở cao chừng 0,55). ui/captions.js đặt chữ ngay trên điểm này.
+const VERSE_HEIGHT = 0.9;
 // Vuốt → sương xoáy: góc xoay (radian) ở tâm xoáy tăng theo tốc độ vuốt (NDC mỗi giây), kẹp trong [min, max].
 const SWIRL_SPIN = { min: 0.6, max: 2.4, perSpeed: 0.35 };
 
@@ -49,7 +51,9 @@ export function moonDirection(hour) {
 
 /**
  * Bộ đệm vòng 8 gợn sóng: mỗi ô vec4(x, z, lúc bắt đầu, biên độ). Chạm lần thứ 9 ghi đè gợn cũ nhất.
- * uniformArray tự tải lại cả mảng lên GPU mỗi khung (updateType RENDER), nên chỉ cần sửa slots[i].
+ * Chỉ cần sửa slots[i]: ở mỗi lượt vẽ có dùng mảng, uniformArray tự chép slots vào bộ đệm của nó (updateType RENDER).
+ * Trong r186 bộ đệm đó là một binding riêng trong nhóm uniform của từng vật (objectGroup), nên được tải lên GPU ở MỖI lần
+ * vẽ có dùng nó (nước, lá, hoa đăng), không phải một lần mỗi khung. Mảng chỉ 8 × 16 byte nên chép vậy vẫn rẻ.
  */
 export function createRipples() {
   const slots = Array.from({ length: RIPPLE_SLOTS }, () => new Vector4(0, 0, -1e4, 0));
@@ -110,6 +114,29 @@ export function setup(ctx) {
   const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng (và xoáy sương) nhẹ hơn
   // Vòng đệm hoa đăng (GĐ 5): lớp Ánh trăng vẽ mọi ô, mỗi khung tính lại từ đồng hồ của cảnh. Sức chứa theo mức.
   const lanterns = createLanternSlots(ctx.budget.lanterns ?? 8, { pond: POND_RADIUS });
+  // Thơ của hoa đăng: bức chỉ cầm KHÓA, chữ nằm ở content.captions. Thứ tự xáo theo đêm của ctx.now (cùng ?at thì cùng thứ
+  // tự); hết danh sách thì quay lại đầu. Chữ tải hỏng thì không có khóa nào: đèn vẫn thả, chỉ không có chữ.
+  const order = verseOrder(ctx.captions?.keys ?? [], ctx.now);
+  let released = 0; // số đèn đã thả: chọn câu kế tiếp
+
+  /**
+   * Thả một hoa đăng tại (x, z) trên mặt nước, kèm câu kế tiếp của đêm nay. Hướng trôi lấy theo trăng LÚC THẢ (nhắm vào lối
+   * trăng nhìn từ chỗ đứng của camera, mặc định của driftDirection), nên kéo thanh giờ sau đó không làm đèn đổi đường.
+   * Ao đã đủ đèn thì vòng đệm tự cho đèn thả sớm nhất chìm sớm.
+   */
+  const releaseLantern = (x, z) => {
+    const key = order.length ? order[released % order.length] : null;
+    const i = lanterns.release({ x, z, t: ctx.u.time.value, dir: driftDirection(x, z, moonDir.value), key });
+    released += 1;
+    if (!key) return;
+    // Chữ đi theo đèn: điểm neo tính lại mỗi khung bằng đúng công thức mà lớp Ánh trăng dùng để vẽ đèn (lanternAt), nên chữ
+    // không bao giờ lệch khỏi đèn. Đèn chìm hẳn thì trả null: chữ ẩn đi. Ô i chỉ bị ghi đè bởi một lần thả sau, mà lần thả
+    // đó đã thay chữ này bằng câu của nó.
+    ctx.captions.show(key, () => {
+      const s = lanternAt(lanterns.slots[i], ctx.u.time.value);
+      return s.alive ? { x: s.x, y: VERSE_HEIGHT, z: s.z } : null;
+    });
+  };
 
   const water = new Plane(new Vector3(0, 1, 0), 0);
   const hit = new Vector3();
@@ -150,6 +177,12 @@ export function setup(ctx) {
         swirl.spin.value = (along < 0 ? -1 : 1) * spin * rippleAmp;
         return;
       }
+      // Chạm hai lần lên nước: thả một hoa đăng. Hai lần chạm làm nên cử chỉ này đã tới trước, là hai 'tap' (gợn sóng, đom
+      // đóm tản), nên đèn hiện giữa vòng gợn thứ hai. Ở đây không dời điểm hút, không thêm gợn.
+      if (g.kind === 'double-tap') {
+        if (onPond) releaseLantern(hit.x, hit.z);
+        return;
+      }
       // Chỉ chạm và giữ mới dời điểm hút.
       if (!onPond || !['tap', 'hold-start', 'hold-move'].includes(g.kind)) return;
       attract.point.value.set(hit.x, FLY_HEIGHT, hit.z);
```
Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 4b17baa..739e26f 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -276,6 +276,10 @@ header h1 {
   font: italic 500 clamp(16px, 0.6vw + 12px, 20px) / 1.4 var(--serif);
   color: var(--vang-la-sang);
   letter-spacing: 0.02em;
+  /* Màn hẹp (360px) thì gợi ý xuống hai dòng: justify-self chỉ đặt KHUNG vào giữa, các dòng trong khung phải tự canh
+     giữa; balance chia hai dòng dài gần bằng nhau, như một cặp câu. */
+  text-align: center;
+  text-wrap: balance;
   animation: hint-in 1.2s ease-out both;
 }
 .hint[data-kind='invite'] { color: var(--nga); pointer-events: auto; }
```

Gợi ý mới trong e2e (Task 12 chạy e2e):

Áp vào `e2e/ao-sen-dem.spec.js`:

```diff
diff --git a/e2e/ao-sen-dem.spec.js b/e2e/ao-sen-dem.spec.js
index bd36d7a..1eb0d21 100644
--- a/e2e/ao-sen-dem.spec.js
+++ b/e2e/ao-sen-dem.spec.js
@@ -10,6 +10,9 @@ const TAP_AFTER = 15; // chạm sau khung này
 const HOLD_FRAMES = 25; // giữ tay chừng này khung (rồi thêm 400 ms) trước khi thả
 // Điểm chạm: giữa ngang, 80% chiều cao khung — mặt nước ngay trước camera, trên lối trăng.
 const WATER = { x: 0.5, y: 0.8 };
+// Gợi ý của Bức 1 (content.hint, GĐ 5). Chép lại ở đây vì content.vi.js import sơ đồ bằng ?raw, mà Node của Playwright không
+// đọc được; tests/paintings/ao-sen-dem/shared.test.js giữ content.hint đúng bằng chuỗi này.
+const HINT = 'Chạm vào mặt nước · chạm hai lần để thả hoa đăng';
 
 let log;
 test.beforeEach(async ({ page }, testInfo) => {
@@ -155,12 +158,12 @@ test.describe('Ao Sen Đêm · chạm mặt nước', () => {
     expect(log.errors).toEqual([]);
   });
 
-  test('gợi ý "Chạm vào mặt nước" khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
+  test('gợi ý của bức (content.hint) khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
     const { query } = testInfo.project.metadata;
     await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
     expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
     const hint = page.locator('[data-hint]');
-    await expect(hint).toHaveText('Chạm vào mặt nước');
+    await expect(hint).toHaveText(HINT);
     const box = await page.locator('[data-stage] canvas').boundingBox();
     await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
     await expect(hint).toHaveText(/^Bức tranh này có \d+ lớp — mài thử\?$/);
```

Run: `npx vitest run tests/paintings/ao-sen-dem/tha-hoa-dang.test.js tests/paintings/ao-sen-dem/shared.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  840 passed`.

```bash
git add e2e/ao-sen-dem.spec.js src/paintings/ao-sen-dem/content.captions.vi.js src/paintings/ao-sen-dem/content.vi.js src/paintings/ao-sen-dem/shared.js src/styles/shell.css tests/helpers/rays.js tests/paintings/ao-sen-dem/shared.test.js tests/paintings/ao-sen-dem/tha-hoa-dang.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): chạm hai lần lên nước thả hoa đăng mang một cặp câu thơ (12 cặp, thứ tự xáo theo đêm); gợi ý mới

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 12: E2E của GĐ 5: Từng sợi, quầng trăng, thả hoa đăng; trợ năng

**Mục tiêu:** Spec §12 "E2E (GĐ 5)" và "Trợ năng", §17 "E2e chạm hai lần phụ thuộc thời gian", Phụ lục A.51. Task này chỉ thêm e2e cho những gì Task 2–11 đã dựng. Mọi e2e cũ vẫn phải xanh.
- **`helpers.js`:**
  - `doubleTapAt(page, fx, fy, { gapMs = 40 })` phát `pointerdown`/`pointerup` hai lần NGAY TRONG TRANG, trong một lần `page.evaluate`, lên canvas. Hai lần chạm cách nhau `gapMs` theo đồng hồ tường; hàm trả `__sma.frames` ngay sau lần chạm hai.
    - Chuột của Playwright không dùng được: mỗi sự kiện phải đợi một nhịp khung mới tới trang, và trên GPU phần mềm hai lần chạm dễ cách nhau quá 300 ms (Phụ lục A.51).
    - `pointerId` 1, `pointerType: 'mouse'`: OrbitControls gọi `setPointerCapture(pointerId)` lúc chạm xuống, mà hàm đó ném lỗi với id không phải con trỏ đang có.
    - Luồng chính kẹt quá chừng 260 ms giữa hai lần chạm thì cử chỉ thành hai `'tap'`: test hỏng (không đèn, không chữ) chứ không qua oan.
  - `canvasRegions` trả thêm `warm` cho mỗi vùng: số điểm sáng ấm (R > 150, G > 110, R − B > 40).
- **`painting.spec.js`** (mọi bức, các project 3D):
  - **Từng sợi** ở `?freeze=10`:
    - bật công cụ thì ảnh không đổi (nấc N);
    - sợi 0 gần như một màu: độ lệch chuẩn độ sáng dưới `ONE_COLOUR_STD` 0,02 (đo được 0,0073, cả khung chừng 0,13), và canvas không trong suốt;
    - mỗi nấc k ≤ 4 có `aria-valuetext` "Sợi k trên N: <nhãn vật>", dòng mô tả nói về đúng vật đó;
    - "Dệt lại" đi qua từng nấc rồi dừng ở N;
    - tắt thì như cũ.
  - **Quầng trăng:**
    - chunk three tới chậm 1,5 giây (`page.route`) để kịp thấy lúc `loading`; một MutationObserver ghi đích của từng mốc vào `window.__haloLog`;
    - lúc loading có quầng (phần vòng 0–1); live thì đã gỡ. Trang mà về tĩnh (máy CI quá tải, lý do `timeout`) thì test hỏng ngay, kèm lý do đọc từ `__sma.reason`, chứ không treo tới hết giờ;
    - các đích theo đúng thứ tự `1 − HALO_STEPS[m].to`, không lùi;
    - `?static` không có quầng.

    Đây là phép kiểm duy nhất của dây nối `progress('chunk')` trong `boot.js` trên trình duyệt thật, với `import()` thật của `run.js`. Trong jsdom, `tests/unit/boot.test.js` (Task 3) giữ nó.
- **`ao-sen-dem.spec.js`:**
  - **Thả hoa đăng** ở `?at=2026-10-25T21:00&freeze=120` (đêm của poster). Chạm hai lần lên nước sau khung 15 và chậm nhất ở khung 29 thì:
    - có một đèn (`__sma.readouts('anh-trang')`);
    - chữ là đúng cặp câu đầu của đêm, đoán trước bằng `verseOrder(keys, parseAt(at))`;
    - quanh chỗ chạm có hơn 500 điểm sáng ấm so với hai lần chạm thường cách nhau 600 ms.

    Chạm hai lần chỗ khác thì có hai đèn và câu kế. Chạm hai lần lên trời thì không có gì.
  - **Mức cao có hoa đăng** (chỉ WebGPU; test draw call cũ chạy cả hai backend): hai đèn không thêm draw call nào (35 → 35), vẫn ≤ 45.
- **`a11y.spec.js`:** axe quét lúc có chữ đi theo vật và lúc Từng sợi bật. Lượt bàn phím tới được thanh và nút "Dệt lại" của Từng sợi.

Mỗi test ghi số đo vào annotation (`quang-trang`, `tung-soi`, `hoa-dang`, `draw-call`). Trên CI, khi một test chậm hay hỏng, đọc các số này để so với số trong chú thích.

Không có lỗi đỏ tự nhiên: các test kiểm thứ đã dựng, viết đúng là qua ngay. Lúc dựng thử, các phép kiểm chính đã được thử bằng cách cố ý làm hỏng code (rồi trả lại):
- bỏ `runShell.progress('chunk')` trong `boot.js` → `Error: thiếu đích của mốc 'chunk' · __haloLog = [{"offset":0.55,…},{"offset":0.1,…},…]`;
- ngưỡng điểm ấm R − B > 60 → 0 điểm trên cả ba backend, vì ánh nến và vũng sáng màu ngà có R − B từ 41 tới 60.

**Files:**
- Modify: `e2e/helpers.js`, `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`, `e2e/a11y.spec.js`

**Interfaces:**
- Consumes:
  - `HALO_STEPS` (Task 3, `src/ui/moon-progress.js`);
  - `playStepMs`, `playStride` (Task 7, `src/engine/tools/tung-soi.js`);
  - `DRIFT`, `verseOrder` (Task 8);
  - `__sma.readouts(id)` (Task 9);
  - `content.captions` (Task 11);
  - `parseAt` (`src/engine/flags.js`), `GESTURE` (`src/engine/gpu/gesture.js`).

  Các file này không import gì nặng, nên Node của Playwright đọc được. `content.vi.js` thì không, vì nó import `.svg?raw`.
- Produces: `doubleTapAt(page, fx, fy, { gapMs = 40 }) → Promise<number | null>` (số khung ngay sau lần chạm hai); `canvasRegions(page, regions)[tên].warm`.

- [ ] **Step 1: Helper chạm hai lần trong trang**

Áp vào `e2e/helpers.js`:

```diff
diff --git a/e2e/helpers.js b/e2e/helpers.js
index aaf561a..709a6de 100644
--- a/e2e/helpers.js
+++ b/e2e/helpers.js
@@ -1,4 +1,4 @@
-// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas (cả khung và từng vùng), báo GPU, gom lỗi console.
+// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas (cả khung và từng vùng), chạm hai lần trong trang, báo GPU, gom lỗi console.
 
 /** Cảnh báo API cũ mà three in ra lúc chạy (spec §3: e2e bắt các cảnh báo này). */
 export const DEPRECATION = /deprecated|renamed|has been removed/i;
@@ -82,8 +82,9 @@ export const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
  * Số đo của từng VÙNG canvas (GĐ 4, công cụ học): vùng là hình chữ nhật { x0, y0, x1, y1 } theo tỉ lệ khung (0–1), có thể
  * kèm `ring: { r, inside }` để chỉ lấy điểm trong (inside: true) hay ngoài một vòng tròn giữa khung bán kính r × cạnh ngắn.
  * Mỗi vùng: checksum, độ sáng trung bình (0–1), độ lệch chuẩn độ sáng, sắc độ trung bình (chroma = (max − min) / 255: đo
- * theo tuyệt đối, vì độ bão hòa (max − min) / max thổi phồng những điểm gần đen như nền đen then), và `transparent`: số
- * điểm canvas trong suốt. Lúc chụp, nền trang tô màu hồng sen (#ff00ff): điểm trong suốt để lộ nền ấy ra.
+ * theo tuyệt đối, vì độ bão hòa (max − min) / max thổi phồng những điểm gần đen như nền đen then), `transparent`: số
+ * điểm canvas trong suốt (lúc chụp, nền trang tô màu hồng sen #ff00ff: điểm trong suốt để lộ nền ấy ra), và `warm` (GĐ 5): số
+ * điểm sáng màu ấm (R > 150, G > 110, R − B > 40), như ánh nến của hoa đăng và vũng sáng nó hắt xuống nước.
  * @param {import('@playwright/test').Page} page
  * @param {Record<string, { x0: number, y0: number, x1: number, y1: number, ring?: { r: number, inside: boolean } }>} regions
  */
@@ -107,6 +108,7 @@ export async function canvasRegions(page, regions = { all: FULL }, selector = '[
       let sumL2 = 0;
       let sumS = 0;
       let transparent = 0;
+      let warm = 0;
       const radius = r.ring ? r.ring.r * Math.min(w, h) : 0;
       for (let y = Math.floor(r.y0 * h); y < Math.floor(r.y1 * h); y++) {
         for (let x = Math.floor(r.x0 * w); x < Math.floor(r.x1 * w); x++) {
@@ -122,10 +124,11 @@ export async function canvasRegions(page, regions = { all: FULL }, selector = '[
           sumL2 += l * l;
           sumS += (max - min) / 255;
           if (R > 240 && G < 20 && B > 240) transparent += 1;
+          if (R > 150 && G > 110 && R - B > 40) warm += 1;
         }
       }
       const mean = sumL / n;
-      out[name] = { checksum: sum, mean, std: Math.sqrt(Math.max(sumL2 / n - mean * mean, 0)), chroma: sumS / n, transparent };
+      out[name] = { checksum: sum, mean, std: Math.sqrt(Math.max(sumL2 / n - mean * mean, 0)), chroma: sumS / n, transparent, warm };
     }
     return out;
   }, { b64: png.toString('base64'), regions });
@@ -136,6 +139,41 @@ export function twoFrames(page) {
   return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
 }
 
+/**
+ * Chạm hai lần lên canvas ở (fx, fy) (tỉ lệ 0–1 của khung canvas) bằng PointerEvent phát NGAY TRONG TRANG (spec §17, Phụ lục
+ * A.51). Mỗi sự kiện chuột của Playwright phải đợi một nhịp khung mới tới trang, mà trên GPU phần mềm một nhịp có khi vài trăm
+ * ms: hai lần chạm của page.mouse dễ cách nhau quá GESTURE.doubleMs (300 ms). Ở đây xuống/lên rồi xuống/lên đi trong một lần
+ * evaluate, hai lần chạm cách nhau `gapMs` theo đồng hồ tường; gapMs quá doubleMs thì là hai lần chạm thường (phép so).
+ * Trong lúc chờ gapMs, trang vẫn chạy tiếp: luồng chính kẹt quá doubleMs − gapMs (chừng 260 ms) giữa hai lần chạm thì cử chỉ thành
+ * hai lần chạm thường, và test hỏng (không có đèn, không có chữ) chứ không qua oan.
+ * pointerId 1, pointerType 'mouse': OrbitControls gọi setPointerCapture(pointerId) lúc chạm xuống, và hàm đó ném lỗi với id
+ * không phải con trỏ đang có; con trỏ chuột (id 1) thì Chromium luôn có.
+ * Trả `__sma.frames` ngay sau lần chạm hai: cử chỉ được xử lý ở khung kế tiếp (hay ở lần vẽ lại, khi ?freeze đã dừng).
+ * @param {import('@playwright/test').Page} page
+ * @param {number} fx
+ * @param {number} fy
+ * @param {{ gapMs?: number }} [opts]
+ * @returns {Promise<number | null>}
+ */
+export function doubleTapAt(page, fx, fy, { gapMs = 40 } = {}) {
+  return page.evaluate(async ({ x, y, gap }) => {
+    const canvas = document.querySelector('[data-stage] canvas');
+    const box = canvas.getBoundingClientRect();
+    const at = {
+      pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, bubbles: true, cancelable: true, composed: true,
+      clientX: box.left + box.width * x, clientY: box.top + box.height * y,
+    };
+    const tap = () => {
+      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...at, buttons: 1 }));
+      canvas.dispatchEvent(new PointerEvent('pointerup', { ...at, buttons: 0 }));
+    };
+    tap();
+    await new Promise((resolve) => setTimeout(resolve, gap));
+    tap();
+    return window.__sma?.frames ?? null;
+  }, { x: fx, y: fy, gap: gapMs });
+}
+
 /** Hỏi thẳng trình duyệt nó có GPU gì (để bỏ qua test WebGPU khi không có adapter). */
 export async function gpuReport(page) {
   return page.evaluate(async () => {
```

- [ ] **Step 2: Từng sợi và quầng trăng (mọi bức)**

Áp vào `e2e/painting.spec.js`:

```diff
diff --git a/e2e/painting.spec.js b/e2e/painting.spec.js
index 722173c..8a436a1 100644
--- a/e2e/painting.spec.js
+++ b/e2e/painting.spec.js
@@ -1,12 +1,22 @@
-// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh; cảnh 3D trên WebGL2 / WebGPU; công cụ học, ?poster (GĐ 4).
-import { readdirSync } from 'node:fs';
+// e2e/painting.spec.js — E2E chung cho MỌI bức trong registry: tầng tĩnh; cảnh 3D trên WebGL2 / WebGPU; công cụ học, ?poster (GĐ 4); Từng sợi, quầng trăng (GĐ 5).
+import { readdirSync, readFileSync } from 'node:fs';
 import { test, expect } from '@playwright/test';
 import { paintings } from '../src/paintings/registry.js';
 import t from '../src/ui/strings.vi.js';
+import { HALO_STEPS } from '../src/ui/moon-progress.js';
+import { playStepMs, playStride } from '../src/engine/tools/tung-soi.js';
 import {
   DARK, FULL, waitForSettled, waitForFrames, canvasStats, canvasRegions, twoFrames, gpuReport, collectConsole, readSma,
 } from './helpers.js';
 
+/**
+ * Sợi 0 của Từng sợi (chưa vẽ vật nào: chỉ còn màu nền xóa khung, vẫn qua hậu kỳ): ngưỡng độ lệch chuẩn độ sáng của "gần như
+ * một màu". Đo ở khung 10 của Bức 1, 640×400: sợi 0 có std 0,0073 trên cả WebGL2 SwiftShader, WebGPU SwiftShader và GPU thật
+ * (Apple M2); chỉ còn hạt (grain 0,03) và tối góc (vignette 0,45) của Phủ bóng làm độ sáng đổi chút ít. Khung vẽ đủ có std
+ * 0,13–0,135. Ngưỡng 0,02 gần gấp ba sợi 0 mà chưa tới một phần sáu khung đủ.
+ */
+const ONE_COLOUR_STD = 0.02;
+
 /**
  * URL tương đối (không có '/' đầu) để giữ base '/son-mai-anh-sang/' của baseURL.
  * page 'index.html' → './?a&b'; page 'tranh/x/index.html' → './tranh/x/?a&b'.
@@ -495,5 +505,143 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       expect(await canvas.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
       expect(log.errors).toEqual([]);
     });
+
+    test('Từng sợi (GĐ 5): bật thì ảnh không đổi (nấc N); sợi 0 gần như một màu; mỗi nấc có dòng mô tả; "Dệt lại" chạy tới N; tắt thì như cũ', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(180_000);
+      await still(page, testInfo);
+      const base = (await canvasRegions(page)).all;
+      await page.evaluate(() => window.__sma.setTool('tung-soi'));
+      await expect(page.locator('body')).toHaveAttribute('data-tool', 'tung-soi');
+      const slot = page.locator('[data-tool-slot="tung-soi"]');
+      const range = slot.locator('#tung-soi-range');
+      // Danh sách lần vẽ chỉ có sau khung vẽ lại đầu tiên đi qua móc; tới lúc đó thanh là 0/0 ("Đang đếm các lần vẽ…").
+      await expect.poll(async () => Number(await range.getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
+      const n = Number(await range.getAttribute('max'));
+      expect(await range.inputValue(), 'mở công cụ thì thanh đứng ở nấc cuối').toBe(String(n));
+      await twoFrames(page);
+      expect((await canvasRegions(page)).all.checksum, 'bật Từng sợi (nấc N: vẽ đủ) mà ảnh đổi').toBe(base.checksum);
+      const text = t.tools['tung-soi'];
+      /** Kéo thanh tới nấc v như người xem (sự kiện input), rồi chờ khung đứng yên vẽ lại với k = v. */
+      const slide = async (v) => {
+        await range.evaluate((el, value) => {
+          el.value = String(value);
+          el.dispatchEvent(new Event('input', { bubbles: true }));
+        }, v);
+        await twoFrames(page);
+      };
+      await slide(0);
+      const bare = (await canvasRegions(page)).all;
+      await page.screenshot({ path: testInfo.outputPath('tung-soi-0.png') });
+      testInfo.annotations.push({ type: 'tung-soi', description: `N = ${n}; sợi 0: std ${bare.std.toFixed(4)}, đủ: std ${base.std.toFixed(4)}` });
+      expect(bare.std, `sợi 0 phải gần như một màu (std độ sáng ${bare.std.toFixed(4)})`).toBeLessThan(ONE_COLOUR_STD);
+      // Một màu mà là màu nền xóa khung, không phải canvas trong suốt (lúc chụp, nền trang hồng sen cũng là "một màu").
+      expect(bare.transparent, 'sợi 0: canvas không bao giờ trong suốt').toBe(0);
+      for (let k = 1; k <= Math.min(n, 4); k += 1) {
+        await slide(k);
+        // "Sợi k trên N: <nhãn vật>": tiến độ tới trình đọc màn hình qua aria-valuetext của thanh. Dòng mô tả nói về đúng vật đó.
+        const prefix = text.valuetext(k, n, '');
+        const valuetext = await range.getAttribute('aria-valuetext');
+        expect(valuetext.startsWith(prefix) && valuetext.length > prefix.length, `nấc ${k}: aria-valuetext "${valuetext}"`).toBe(true);
+        await expect(slot.locator('.tool-detail'), `nấc ${k}: dòng mô tả sợi`).toContainText(valuetext.slice(prefix.length));
+      }
+      const play = slot.getByRole('button', { name: text.play });
+      // Ghi từng nấc "Dệt lại" đi qua (mỗi bước đổi aria-valuetext của thanh, mỗi bước một tác vụ riêng): chỉ nhìn lúc kết thúc thì
+      // một lượt nhảy thẳng tới N cũng qua.
+      await range.evaluate((el) => {
+        window.__woven = [];
+        new MutationObserver(() => window.__woven.push(Number(el.value))).observe(el, { attributeFilter: ['aria-valuetext'] });
+      });
+      await play.click();
+      await expect(play).toHaveAttribute('aria-pressed', 'true');
+      // "Dệt lại" đi 0 → N, mỗi bước playStride(N) sợi: chờ playStepMs(N) (0,6 s khi ít sợi) rồi vẽ lại khung đứng yên, mà trên
+      // GPU phần mềm một lần vẽ lại có khi hơn 100 ms, máy bận thì lâu hơn nhiều. Mỗi bước cho thêm 1 s, cả lượt thêm 30 s dư.
+      const stride = playStride(n);
+      const steps = Math.ceil(n / stride);
+      await expect.poll(async () => [await play.getAttribute('aria-pressed'), await range.inputValue()], {
+        timeout: steps * (playStepMs(n) + 1000) + 30_000,
+      }).toEqual(['false', String(n)]);
+      // Từ sợi 0 (chỉ còn màu nền), mỗi bước thêm playStride(N) sợi, bước cuối đáp đúng N.
+      const expected = [0, ...Array.from({ length: steps }, (_, i) => Math.min((i + 1) * stride, n))];
+      expect(await page.evaluate(() => window.__woven), '"Dệt lại" phải đi từng bước').toEqual(expected);
+      await page.evaluate(() => window.__sma.setTool(null));
+      expect((await canvasRegions(page)).all.checksum, 'tắt Từng sợi thì phải về đúng ảnh cũ').toBe(base.checksum);
+      expect(log.errors).toEqual([]);
+      expect(log.warnings).toEqual([]);
+    });
+
+    test('quầng trăng (GĐ 5): chunk three tới chậm thì lúc loading có quầng (phần vòng 0–1); live thì đã gỡ; đích các mốc đúng thứ tự; ?static không có quầng', async ({
+      page,
+    }, testInfo) => {
+      test.skip(!readFileSync(new URL(`../${htmlPage}`, import.meta.url), 'utf8').includes('data-moon'), 'bức không có trăng: không có quầng');
+      test.setTimeout(120_000);
+      const { query } = testInfo.project.metadata;
+      // Chunk three tới chậm 1,5 s: trang đứng ở 'loading' đủ lâu để đọc quầng. Hạn 10 s của boot vẫn tính cả 1,5 s này.
+      await page.route('**/three-*.js', async (route) => {
+        await new Promise((resolve) => setTimeout(resolve, 1500));
+        await route.continue();
+      });
+      // Ghi mọi ĐÍCH mà quầng nhận: ui/moon-progress.js đặt stroke-dashoffset inline = 1 − phần vòng của mốc (giá trị tính
+      // được lúc đó là chỗ quầng đang bò tới). Gắn trước mọi script của trang, cho từng lần mở trang.
+      await page.addInitScript(() => {
+        window.__haloLog = [];
+        const scratch = document.createElement('i'); // tách khai báo của một chuỗi style bằng CSSOM
+        const offsetOf = (css) => {
+          scratch.style.cssText = css ?? '';
+          return scratch.style.strokeDashoffset;
+        };
+        new MutationObserver((records) => {
+          records.forEach((record, i) => {
+            if (!record.target.classList?.contains('moon-halo')) return;
+            // Một lần gọi gom mọi lần đổi của một tác vụ (mỗi mốc đổi style hai, ba lần liền nhau): style mới của bản ghi i là
+            // oldValue của bản ghi kế tiếp trên cùng phần tử, hay style hiện tại nếu không còn bản ghi nào sau nó.
+            const next = records.slice(i + 1).find((r) => r.target === record.target);
+            const offset = offsetOf(next ? next.oldValue : record.target.getAttribute('style'));
+            if (offset !== '' && offset !== offsetOf(record.oldValue)) {
+              window.__haloLog.push({ offset: Number.parseFloat(offset), t: performance.now() });
+            }
+          });
+        }).observe(document, { subtree: true, attributeFilter: ['style'], attributeOldValue: true });
+      });
+      await page.goto(urlOf(htmlPage, query, 'freeze=10'));
+      // Chờ tới lúc có quầng ('loading' trở đi), hay tới lúc trang đã xong: boot về tầng tĩnh (như hết hạn 10 s trên máy CI quá
+      // tải) thì test báo ngay lý do, không đứng chờ tới hết giờ của test. Chunk three tới chậm 1,5 s, nên trang đi đúng đường
+      // thì lần chờ này vẫn gặp 'loading' trước.
+      await page.waitForFunction(() => ['loading', 'compiling', 'fading', 'live', 'static'].includes(document.body.dataset.state), null, {
+        timeout: 30_000,
+      });
+      const early = await readSma(page);
+      expect(early.state, `về tầng tĩnh: ${early.reason} · ${early.error}`).not.toBe('static');
+      const loading = await page.evaluate(() => {
+        const halo = document.querySelector('[data-moon] .moon-halo');
+        // Giá trị TÍNH ĐƯỢC giữa lúc chuyển: quầng đang ở đâu trên đường bò từ 1 (rỗng) tới đích của mốc.
+        return { state: document.body.dataset.state, crawl: halo ? Number.parseFloat(getComputedStyle(halo).strokeDashoffset) : null };
+      });
+      expect(loading.crawl, `lúc ${loading.state} phải có quầng`).not.toBeNull();
+      expect(loading.crawl).toBeGreaterThanOrEqual(0);
+      expect(loading.crawl).toBeLessThanOrEqual(1);
+      const settled = await waitForSettled(page, { timeout: 60_000 });
+      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+      await expect(page.locator('[data-moon] .moon-halo'), 'live thì quầng đã tan và bị gỡ').toHaveCount(0);
+      const haloLog = await page.evaluate(() => window.__haloLog);
+      const trace = `__haloLog = ${JSON.stringify(haloLog)}`;
+      // Đích và lúc nhận (ms từ lúc mở trang): đọc ngay được lúc khởi động mất bao lâu, so với hạn 10 s của boot.
+      testInfo.annotations.push({ type: 'quang-trang', description: haloLog.map((e) => `${e.offset} @ ${Math.round(e.t)} ms`).join(' → ') });
+      const offsets = haloLog.map((entry) => entry.offset);
+      expect(offsets.every((v, i) => i === 0 || v <= offsets[i - 1]), `quầng không bao giờ lùi · ${trace}`).toBe(true);
+      // Đích của từng mốc theo đúng thứ tự: chỉ test này kiểm dây nối progress('chunk') của boot.js trong trình duyệt thật, với
+      // lần import() thật của run.js (tests/unit/boot.test.js giữ dây nối ấy trong jsdom, với loadRun giả).
+      const milestones = ['loading', 'chunk', 'compiling', 'fading'];
+      let matched = 0;
+      for (const v of offsets) if (matched < milestones.length && Math.abs(v - (1 - HALO_STEPS[milestones[matched]].to)) <= 1e-6) matched += 1;
+      expect(matched, `thiếu đích của mốc '${milestones[matched]}' · ${trace}`).toBe(milestones.length);
+      // Tầng tĩnh không tải gì để chờ: không bao giờ có quầng.
+      await page.goto(urlOf(htmlPage, 'static'));
+      expect((await waitForSettled(page)).state).toBe('static');
+      await expect(page.locator('[data-moon] .moon-halo')).toHaveCount(0);
+      expect(await page.evaluate(() => window.__haloLog)).toEqual([]);
+      expect(log.errors).toEqual([]);
+    });
   });
 }
```

- [ ] **Step 3: Thả hoa đăng và draw call (Bức 1)**

Áp vào `e2e/ao-sen-dem.spec.js`:

```diff
diff --git a/e2e/ao-sen-dem.spec.js b/e2e/ao-sen-dem.spec.js
index 1eb0d21..9001864 100644
--- a/e2e/ao-sen-dem.spec.js
+++ b/e2e/ao-sen-dem.spec.js
@@ -1,8 +1,13 @@
-// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt (sương xoáy) mặt nước; thanh giờ; chế độ mài; chất lượng; CPU vs GPU; trăng SVG.
+// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt (sương xoáy) mặt nước; thả hoa đăng; thanh giờ; chế độ mài; chất lượng; CPU vs GPU; trăng SVG.
 import { test, expect } from '@playwright/test';
-import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma, twoFrames } from './helpers.js';
+import {
+  DARK, waitForSettled, waitForFrames, canvasStats, canvasRegions, gpuReport, collectConsole, readSma, twoFrames, doubleTapAt,
+} from './helpers.js';
 import meta from '../src/paintings/ao-sen-dem/meta.js';
+import captions from '../src/paintings/ao-sen-dem/content.captions.vi.js';
+import { DRIFT, verseOrder } from '../src/paintings/ao-sen-dem/parts/anh-trang-drift.js';
 import { GESTURE } from '../src/engine/gpu/gesture.js';
+import { parseAt } from '../src/engine/flags.js';
 
 const AT = 'at=2026-09-28T21:00';
 const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
@@ -10,8 +15,12 @@ const TAP_AFTER = 15; // chạm sau khung này
 const HOLD_FRAMES = 25; // giữ tay chừng này khung (rồi thêm 400 ms) trước khi thả
 // Điểm chạm: giữa ngang, 80% chiều cao khung — mặt nước ngay trước camera, trên lối trăng.
 const WATER = { x: 0.5, y: 0.8 };
+// Chỗ thả hoa đăng thứ hai (GĐ 5): vẫn trên mặt nước, lệch trái về phía đèn ở bờ.
+const ELSEWHERE = { x: 0.35, y: 0.78 };
+/** Số hoa đăng đang trôi (số đo 'lanterns' của lớp Ánh trăng, như Sổ tay đọc). */
+const lanternCount = (page) => page.evaluate(() => window.__sma.readouts('anh-trang').find((r) => r.id === 'lanterns')?.value);
 // Gợi ý của Bức 1 (content.hint, GĐ 5). Chép lại ở đây vì content.vi.js import sơ đồ bằng ?raw, mà Node của Playwright không
-// đọc được; tests/paintings/ao-sen-dem/shared.test.js giữ content.hint đúng bằng chuỗi này.
+// đọc được; tests/paintings/ao-sen-dem/tha-hoa-dang.test.js giữ content.hint đúng bằng chuỗi này.
 const HINT = 'Chạm vào mặt nước · chạm hai lần để thả hoa đăng';
 
 let log;
@@ -170,6 +179,98 @@ test.describe('Ao Sen Đêm · chạm mặt nước', () => {
   });
 });
 
+test.describe('Ao Sen Đêm · thả hoa đăng (GĐ 5)', () => {
+  test.beforeEach(({}, testInfo) => {
+    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
+  });
+
+  // Đêm 16 tháng Chín âm lịch, trăng gần tròn (sáng 99,6%): đêm của poster (meta.poster.capture). Dáng đèn tính thẳng theo tuổi
+  // của nó trên đồng hồ CẢNH (?freeze: khung j là giây j/60). Chạm hai lần khi đã vẽ k khung thì đèn ra đời ở khung k + 1, nên tới
+  // khung LANTERN_N nó đã (LANTERN_N − k − 1)/60 giây tuổi, mà búp cần DRIFT.open (1,5 giây) để nở đủ; nến sáng đủ sau DRIFT.glowIn
+  // (0,5 giây). Nên chạm muộn nhất ở khung LATEST_TAP. Chạm sau khi ?freeze đã dừng thì đồng hồ không chạy nữa: đèn mãi là búp khép.
+  // LANTERN_N chỉ vừa đủ, vì trên CI mỗi khung đắt (xem release()). Chạm rơi vào khung 15–16 (SwiftShader), 17–18 (GPU thật).
+  const NIGHT = '2026-10-25T21:00';
+  const LANTERN_N = 120;
+  const LATEST_TAP = LANTERN_N - 1 - DRIFT.open * 60; // 29: tới khung LANTERN_N đèn vừa đúng DRIFT.open giây tuổi
+  const SKY = { x: 0.5, y: 0.12 };
+  // Quanh chỗ thả: tới khung LANTERN_N đèn mới trôi chưa tới nửa đơn vị (vài px), vũng sáng của nó loang trên nước bên dưới.
+  const AROUND = { x0: WATER.x - 0.06, y0: WATER.y - 0.1, x1: WATER.x + 0.06, y1: WATER.y + 0.08 };
+  // Số điểm sáng ấm (canvasRegions().warm: R > 150, G > 110, R − B > 40) trong AROUND ở khung 640×400, đo lúc viết test: có đèn
+  // 1384 (WebGL2 SwiftShader, mức vừa), 1469 (WebGPU SwiftShader), 1468–1475 (GPU thật, Apple M2); hai lần chạm thường 19–44 (đom
+  // đóm, ánh trăng trên gợn). Ánh nến và vũng sáng màu ngà: R − B của các điểm có đèn từ 41 tới 60 (giữa 53–54), nên ngưỡng
+  // R − B > 60 không bắt được điểm nào. Phải hơn phép so WARM_MARGIN điểm: 500 chừa dư cả hai phía (số có đèn hạ chừng 60% vẫn
+  // qua; số không đèn phải tăng hơn hai mươi lần mới làm hỏng).
+  const WARM_MARGIN = 500;
+  // Thứ tự thơ của đêm (shared.js): lần thả đầu mang câu [0], lần hai câu [1]. Hai file này không import gì nặng, Node đọc được.
+  const verses = verseOrder(Object.keys(captions), parseAt(NIGHT));
+
+  /** Chữ một mục của content.captions sẽ hiện ra: mỗi câu một .caption-line, rồi dòng nguồn "tên bài · tác giả" (ui/captions.js). */
+  const verseOf = (key) => {
+    const { lines, source, author } = captions[key];
+    return { lines: lines.map((l) => l.normalize('NFC')), cite: (author ? `${source} · ${author}` : source).normalize('NFC') };
+  };
+  /** Chữ đang hiện trong vùng chữ; textContent của cả dòng dính các câu vào nhau, nên đọc từng phần. */
+  const shownVerse = (page) => page.evaluate(() => {
+    const caption = document.querySelector('[data-captions] .caption');
+    if (!caption) return null;
+    const lines = [...caption.querySelectorAll('.caption-line')].map((el) => el.textContent.normalize('NFC'));
+    return { lines, cite: caption.querySelector('.caption-cite').textContent.normalize('NFC') };
+  });
+
+  /**
+   * Mở cảnh đêm NIGHT ở ?freeze=LANTERN_N, chạm hai lần lên nước sau khung TAP_AFTER, chờ đủ khung rồi đo vùng quanh chỗ chạm.
+   * gapMs mặc định là hai lần chạm sát nhau (thả một hoa đăng); 600 ms (quá GESTURE.doubleMs) là hai lần chạm thường.
+   * Trần chờ tính theo máy chậm nhất: WebGPU SwiftShader trên CI vẽ một khung mất 0,75–0,82 giây (WebGL2 SwiftShader chừng 0,33),
+   * nên từ lúc chạm tới khung LANTERN_N (chừng 105 khung) mất chừng 85 giây, cả một lần release() chừng 105 giây. Trần gấp đôi.
+   */
+  async function release(page, testInfo, { gapMs } = {}) {
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&at=${NIGHT}&freeze=${LANTERN_N}`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
+    const tappedAt = await doubleTapAt(page, WATER.x, WATER.y, { gapMs });
+    const sma = await waitForFrames(page, LANTERN_N, { timeout: 180_000 });
+    expect(sma.frames).toBe(LANTERN_N);
+    return { tappedAt, around: (await canvasRegions(page, { around: AROUND })).around };
+  }
+
+  test('chạm hai lần lên nước (phát ngay trong trang): hoa đăng sáng ở chỗ chạm, câu đầu của đêm; lần hai chỗ khác: hai đèn, câu kế; trên trời: không gì', async ({
+    page,
+  }, testInfo) => {
+    test.setTimeout(420_000); // hai lần release() (chừng 105 giây mỗi lần trên CI) và ba lần vẽ lại khung đứng yên: trần gấp đôi
+    // Phép so: cùng hai lần chạm mà cách nhau 600 ms là hai lần chạm thường: có gợn, không có đèn, không có chữ.
+    const plain = await release(page, testInfo, { gapMs: 600 });
+    expect(await lanternCount(page), 'hai lần chạm cách 600 ms mà vẫn thả đèn').toBe(0);
+    await expect(page.locator('[data-captions] .caption')).toHaveCount(0);
+    const lit = await release(page, testInfo);
+    await page.screenshot({ path: testInfo.outputPath('hoa-dang.png') });
+    // Ghi trước mọi phép kiểm: hỏng ở đâu cũng còn số để so với các số đo ở WARM_MARGIN.
+    testInfo.annotations.push({
+      type: 'hoa-dang',
+      description: `chạm ở khung ${lit.tappedAt}; điểm sáng ấm quanh chỗ chạm: có đèn ${lit.around.warm}, không đèn ${plain.around.warm}`,
+    });
+    expect(lit.tappedAt, 'chạm hai lần quá muộn: tới khung cuối búp chưa kịp nở đủ').toBeLessThanOrEqual(LATEST_TAP);
+    expect(await lanternCount(page)).toBe(1);
+    const caption = page.locator('[data-captions] .caption');
+    await expect(caption).toBeVisible();
+    await expect(caption).toHaveAttribute('data-shown', '');
+    await expect(caption, 'điểm neo của chữ (ngọn đèn) phải ở trong khung').not.toHaveAttribute('data-away');
+    expect(await shownVerse(page)).toEqual(verseOf(verses[0]));
+    expect(lit.around.warm, 'quanh chỗ thả không thấy đèn sáng').toBeGreaterThan(plain.around.warm + WARM_MARGIN);
+    // Lần hai ở chỗ khác (khung đã dừng: cử chỉ tới thì vẽ lại khung LANTERN_N).
+    await doubleTapAt(page, ELSEWHERE.x, ELSEWHERE.y);
+    await expect.poll(() => lanternCount(page)).toBe(2);
+    await expect.poll(() => shownVerse(page)).toEqual(verseOf(verses[1]));
+    // Trên trời: tia từ camera không cắt mặt nước, bức bỏ qua cử chỉ.
+    await doubleTapAt(page, SKY.x, SKY.y);
+    await twoFrames(page);
+    expect(await lanternCount(page)).toBe(2);
+    expect(await shownVerse(page)).toEqual(verseOf(verses[1]));
+    expect(log.errors).toEqual([]);
+  });
+});
+
 test.describe('Ao Sen Đêm · thanh giờ (GĐ 4)', () => {
   test.beforeEach(({}, testInfo) => {
     test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
@@ -253,6 +354,34 @@ test.describe('Ao Sen Đêm · chất lượng', () => {
     expect(log.errors).toEqual([]);
   });
 
+  test('mức cao có hoa đăng (GĐ 5): hai đèn trôi không thêm draw call nào (chung InstancedMesh với đèn ở bờ), vẫn ≤ 45', async ({
+    page,
+  }, testInfo) => {
+    const { query, backend } = testInfo.project.metadata;
+    test.skip(backend !== 'webgpu', 'spec §12: draw call của mức cao đo trên WebGPU');
+    test.setTimeout(180_000); // N khung ở mức cao: chừng 85 giây trên WebGPU SwiftShader của CI
+    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&level=cao&freeze=${N}`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
+    const before = (await page.evaluate(() => window.__sma.stats())).drawCalls;
+    await doubleTapAt(page, WATER.x, WATER.y);
+    // Thả cả hai đèn khi vòng lặp còn chạy: stats() là số đo của khung vòng lặp vẽ sau cùng (vẽ lại lúc đứng yên không đo).
+    const tappedAt = await doubleTapAt(page, ELSEWHERE.x, ELSEWHERE.y);
+    expect(tappedAt, 'thả đèn sau khi ?freeze đã dừng: khung cuối không có đèn').toBeLessThan(N - 5);
+    const sma = await waitForFrames(page, N, { timeout: 120_000 });
+    expect(sma.level).toBe('cao');
+    expect(await lanternCount(page)).toBe(2);
+    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
+    testInfo.annotations.push({ type: 'draw-call', description: `trước khi thả ${before}, có hai đèn ${drawCalls}` });
+    expect(drawCalls).toBeGreaterThan(10);
+    expect(drawCalls).toBeLessThanOrEqual(45);
+    // Khung TAP_AFTER và khung N vẽ cùng những vật (bóng tĩnh chỉ vẽ ở khung đầu; ?freeze không có bộ điều chỉnh hạ nấc), chỉ khác
+    // hai đèn: mỗi đèn là một instance nữa của InstancedMesh đèn ở bờ (đổi count), vũng sáng nằm trong shader của mặt nước.
+    expect(drawCalls, 'đèn thả ra thêm draw call: đèn phải chung InstancedMesh với đèn ở bờ').toBe(before);
+    expect(log.errors).toEqual([]);
+  });
+
   test('?level=thap: phản chiếu giả, không bóng; vẫn có sáng có tối, ít draw call hơn mức cao', async ({ page }, testInfo) => {
     test.setTimeout(120_000);
     const low = await atLevel(page, testInfo, 'thap');
```

- [ ] **Step 4: Trợ năng**

Áp vào `e2e/a11y.spec.js`:

```diff
diff --git a/e2e/a11y.spec.js b/e2e/a11y.spec.js
index 16338f1..568fabd 100644
--- a/e2e/a11y.spec.js
+++ b/e2e/a11y.spec.js
@@ -1,8 +1,8 @@
-// e2e/a11y.spec.js — trợ năng (axe-core, WCAG 2 A/AA): tranh tĩnh; cảnh 3D có thanh lớp + Sổ tay (ba tab); khi một công cụ bật; đi hết bằng bàn phím.
+// e2e/a11y.spec.js — trợ năng (axe-core, WCAG 2 A/AA): tranh tĩnh; cảnh 3D có thanh lớp + Sổ tay, công cụ đang bật, chữ đi theo vật; bàn phím.
 import { test, expect } from '@playwright/test';
 import AxeBuilder from '@axe-core/playwright';
 import { paintings } from '../src/paintings/registry.js';
-import { waitForSettled, gpuReport, collectConsole, readSma } from './helpers.js';
+import { waitForSettled, waitForFrames, gpuReport, collectConsole, readSma, doubleTapAt } from './helpers.js';
 
 /** Luật WCAG 2.0 và 2.1, mức A và AA (spec §12). */
 const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
@@ -85,6 +85,11 @@ for (const { meta, page: htmlPage } of paintings) {
           await expect(page.locator('body')).toHaveAttribute('data-tool', id);
           errors.push(...await audit(page, `công cụ ${id}`));
         }
+        // Từng sợi (GĐ 5) khi đã có danh sách lần vẽ: thanh đủ N nấc, "Dệt lại" bấm được, dòng mô tả và tóm tắt đã có chữ.
+        await page.evaluate(() => window.__sma.setTool('tung-soi'));
+        await expect.poll(async () => Number(await page.locator('#tung-soi-range').getAttribute('max')), { timeout: 30_000 })
+          .toBeGreaterThan(0);
+        errors.push(...await audit(page, 'Từng sợi'));
         const wipe = page.locator('[data-toolbar] [data-shape="gat"]');
         await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
         await wipe.click();
@@ -93,7 +98,7 @@ for (const { meta, page: htmlPage } of paintings) {
         expect(log.errors).toEqual([]);
       });
 
-      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay', async ({
+      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay; thanh và nút của Từng sợi', async ({
         page,
       }, testInfo) => {
         test.setTimeout(120_000);
@@ -102,7 +107,8 @@ for (const { meta, page: htmlPage } of paintings) {
         const focused = () => page.evaluate(() => {
           const el = document.activeElement;
           return el ? `${el.tagName.toLowerCase()}${el.closest('[data-rail]') ? '@rail' : ''}${el.closest('[data-notebook]') ? '@nb' : ''}`
-            + `${el.closest('[data-hint]') ? '@hint' : ''}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}`
+            + `${el.closest('[data-hint]') ? '@hint' : ''}${el.closest('[data-toolbar]') ? '@tool' : ''}`
+            + `${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}`
             + `${el.dataset.tool ? `:${el.dataset.tool}` : ''}${el.type === 'range' ? ':range' : ''}`
             + `${el.classList.contains('dial-chip') ? ':chip' : ''}` : 'none';
         });
@@ -144,8 +150,63 @@ for (const { meta, page: htmlPage } of paintings) {
         await page.keyboard.press('Escape');
         await expect(page.locator('[data-notebook]')).toBeHidden();
         await expect(page.locator('[data-rail]')).toBeVisible();
+        // Từng sợi (GĐ 5): Enter trên nút Đồ nghề bật công cụ, rồi Tab đi tới thanh và nút "Dệt lại" của nó. Thanh công cụ đứng
+        // TRƯỚC thanh lớp trong trang, nên Tab đi hết thanh lớp, vòng về đầu trang rồi mới tới (chừng bảy lần Tab). "Dệt lại" bị
+        // khóa tới khi có danh sách lần vẽ, mà Tab bỏ qua nút bị khóa: chờ danh sách trước khi đi.
+        await page.locator('[data-rail] [data-tool="tung-soi"]').focus();
+        await page.keyboard.press('Enter');
+        await expect(page.locator('body')).toHaveAttribute('data-tool', 'tung-soi');
+        const range = page.locator('#tung-soi-range');
+        await expect.poll(async () => Number(await range.getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
+        const stops = new Set();
+        for (let i = 0; i < 40 && !(stops.has('input@tool:range') && stops.has('button@tool')); i += 1) {
+          await page.keyboard.press('Tab');
+          stops.add(await focused());
+        }
+        const toolWalk = [...stops].join(', ');
+        expect(toolWalk, 'thanh của Từng sợi').toContain('input@tool:range');
+        expect(toolWalk, 'nút "Dệt lại" của Từng sợi').toContain('button@tool');
+        // Mũi tên trên thanh đổi sợi đang xem; trình đọc màn hình nghe qua aria-valuetext.
+        await range.focus();
+        const valuetext = await range.getAttribute('aria-valuetext');
+        await page.keyboard.press('ArrowLeft');
+        await expect(range).not.toHaveAttribute('aria-valuetext', valuetext);
         expect(log.errors).toEqual([]);
       });
     });
   });
 }
+
+/**
+ * Chữ đi theo vật (GĐ 5): Bức 1 hiện một cặp câu cạnh hoa đăng khi người xem chạm hai lần lên nước. Cảnh đứng yên ở khung 10
+ * (?freeze): giờ của chữ tính theo đồng hồ cảnh, nên chữ ở lại suốt lúc axe quét.
+ */
+test.describe('Ao Sen Đêm · a11y khi có chữ đi theo vật (GĐ 5)', () => {
+  test.beforeEach(async ({ page }, testInfo) => {
+    const { kind, backend } = testInfo.project.metadata;
+    test.skip(kind !== '3d', 'chỉ chạy ở project 3D');
+    if (backend === 'webgpu') {
+      await page.goto('./?static');
+      test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
+    }
+  });
+
+  test('thả hoa đăng: vùng chữ (aria-live) có cặp câu và nguồn; không lỗi serious/critical', async ({ page }, testInfo) => {
+    test.setTimeout(120_000);
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&at=2026-09-28T21:00&freeze=10`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    await waitForFrames(page, 10, { timeout: 60_000 });
+    await doubleTapAt(page, 0.5, 0.8); // mặt nước ngay trước camera (WATER của ao-sen-dem.spec.js)
+    const caption = page.locator('[data-captions] .caption');
+    await expect(caption).toHaveAttribute('data-shown', '');
+    await expect(caption, 'điểm neo của chữ phải ở trong khung').not.toHaveAttribute('data-away');
+    // Chờ chữ hiện hẳn (mờ dần 0,8 s): axe đo độ tương phản của chữ đã hiện, không phải chữ đang mờ.
+    await expect.poll(() => caption.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
+    await expect(caption.locator('.caption-line')).not.toHaveCount(0);
+    await expect(caption.locator('.caption-cite cite')).not.toBeEmpty();
+    expect(await audit(page, 'chữ đi theo vật')).toEqual([]);
+    expect(log.errors).toEqual([]);
+  });
+});
```

- [ ] **Step 5: Chạy e2e khi máy rảnh (SwiftShader ăn CPU)**

```bash
pkill -f "vite preview --port 4273" || true
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
```
Kết quả mong đợi: `static` + `webgl2-swiftshader` 37 passed (6 + 31); `webgpu-swiftshader` 31 passed; GPU thật 31 passed (các test "skipped" thuộc project khác). Trên máy dựng thử (M2), riêng `webgl2-swiftshader` chạy chừng 12 phút, `webgpu-swiftshader` chừng 13 phút. Máy bận thì test 3D trên SwiftShader có thể về tĩnh với lý do `timeout`: chạy lại khi máy rảnh rồi mới sửa code.

Kiểm chéo (không commit): bỏ dòng `runShell.progress('chunk')` trong `src/engine/boot.js`, `npm run build`, rồi chạy riêng test quầng trăng (`npx playwright test --project=webgl2-swiftshader --grep "quầng trăng"`). Test phải hỏng với `thiếu đích của mốc 'chunk'`. Trả lại dòng đó.

- [ ] **Step 6: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  840 passed` (task này không thêm test unit).

```bash
git add e2e/a11y.spec.js e2e/ao-sen-dem.spec.js e2e/helpers.js e2e/painting.spec.js
git commit -F - <<'EOF'
test(e2e): GĐ 5 · Từng sợi, quầng trăng, thả hoa đăng (chạm hai lần phát ngay trong trang), a11y khi có chữ và khi Từng sợi bật

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 13: Khung chữ một cột (lỗi có từ GĐ 1)

**Mục tiêu:** Spec §4.1 (huy hiệu ở góc phải trên; thơ ở góc trái dưới; con dấu và trăng ở góc phải dưới), §5 ("con dấu … ở góc tranh").

`main.frame` là một lưới ba hàng: đầu trang, hàng giữa, chân trang. `[data-static]` và `.hint` cùng được ghim vào hàng 2 nhưng không ghim cột. Vì vậy CSS grid tự xếp `.hint` sang một cột ngầm thứ hai. Lỗi này có trên trang đang deploy từ GĐ 1:
- **Máy tính 1280 px:** lưới thành hai cột 768 + 432 px, mà đầu và chân trang chỉ chiếm cột 1. Huy hiệu nằm ở x 676–800 và con dấu ở x 701–803, thay vì ở góc phải.
- **Điện thoại 390 px:** gợi ý bị ép vào một cột rộng 86 px, thành 5 dòng.

Sửa bằng một luật: `.frame > * { grid-column: 1; }`. Sau đó:
- huy hiệu, con dấu và trăng về đúng góc;
- gợi ý thành một dòng ở 390 và 360 px (từ chừng 340 px trở xuống mới xuống hai dòng);
- tên bức trên điện thoại cũng gọn một dòng.

Bố cục đang deploy thay đổi: Bao duyệt ảnh trước và sau (`so-sanh-khung-desktop.png`, `so-sanh-goi-y-390.png`) cùng kế hoạch này. Trên máy tính, lời mời giờ nằm giữa, ngay trên chân trang, đúng chỗ hoa đăng trôi qua. Vì vậy Task 14 cho chữ đi theo vật dừng trên chân khung.

**Files:**
- Modify: `src/styles/shell.css`
- Test: `tests/unit/shell-css.test.js`

**Interfaces:**
- Consumes: —
- Produces: — (chỉ CSS)

- [ ] **Step 1: Test (hỏng: chưa có luật ghim cột)**

Áp vào `tests/unit/shell-css.test.js`:

```diff
diff --git a/tests/unit/shell-css.test.js b/tests/unit/shell-css.test.js
index 1d2db80..cc56756 100644
--- a/tests/unit/shell-css.test.js
+++ b/tests/unit/shell-css.test.js
@@ -75,6 +75,14 @@ describe('shell.css · canvas của sân khấu', () => {
   });
 });
 
+describe('shell.css · khung chữ', () => {
+  it('một cột: mọi khối của .frame ghim vào cột 1 ([data-static] và .hint cùng ở hàng 2 không đẻ ra cột ngầm thứ hai)', () => {
+    // Không ghim cột thì lưới tự xếp .hint sang một cột ngầm bên phải [data-static]: gợi ý bị ép vào cột hẹp (5 dòng trên
+    // điện thoại 390px), đầu và chân trang chỉ còn cột 1 nên huy hiệu và con dấu lệch vào giữa màn hình máy tính.
+    expect(declarations('.frame > *')).toMatch(/grid-column: 1(;|\s|$)/);
+  });
+});
+
 describe('shell.css · vùng aria-live', () => {
   it('khi trống chỉ thu khung (không viền, không nền), không display: none hay visibility: hidden', () => {
     const regions = [['[data-badge-note]:empty', css], ['[data-static]:empty', css], ['.hint:empty', css], ['.nb-busy:empty', notebookCss]];
```

Run: `npx vitest run tests/unit/shell-css.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `AssertionError: expected '' to match /grid-column: 1(;|\s|$)/`.

- [ ] **Step 2: CSS**

Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 739e26f..118e871 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -89,7 +89,11 @@ body[data-state='static'] [data-stage] { display: none; }
 }
 
 /* Ghim từng khối vào hàng của nó: ô ghi chú bị ẩn (display: none) thì rời khỏi lưới, và nếu không ghim,
-   chân trang sẽ trượt lên hàng 1fr ở giữa rồi bị kéo giãn. */
+   chân trang sẽ trượt lên hàng 1fr ở giữa rồi bị kéo giãn.
+   Và ghim mọi khối vào cột 1: [data-static] và .hint cùng ở hàng 2, nên không ghim cột thì lưới tự xếp .hint sang một cột
+   ngầm bên phải. Cột đó ép gợi ý thành một cột chữ hẹp (5 dòng trên điện thoại 390px), còn đầu và chân trang chỉ còn cột 1:
+   huy hiệu và con dấu lệch vào giữa màn hình máy tính thay vì nằm ở góc phải. */
+.frame > * { grid-column: 1; }
 .top {
   grid-row: 1;
   display: flex;
@@ -276,8 +280,8 @@ header h1 {
   font: italic 500 clamp(16px, 0.6vw + 12px, 20px) / 1.4 var(--serif);
   color: var(--vang-la-sang);
   letter-spacing: 0.02em;
-  /* Màn hẹp (360px) thì gợi ý xuống hai dòng: justify-self chỉ đặt KHUNG vào giữa, các dòng trong khung phải tự canh
-     giữa; balance chia hai dòng dài gần bằng nhau, như một cặp câu. */
+  /* Màn hẹp (chừng 340px trở xuống, như 320px) thì gợi ý xuống hai dòng: justify-self chỉ đặt KHUNG vào giữa, các
+     dòng trong khung phải tự canh giữa; balance chia hai dòng dài gần bằng nhau, như một cặp câu. */
   text-align: center;
   text-wrap: balance;
   animation: hint-in 1.2s ease-out both;
```

Run: `npx vitest run tests/unit/shell-css.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  841 passed`.

```bash
git add src/styles/shell.css tests/unit/shell-css.test.js
git commit -F - <<'EOF'
fix(ui): khung chữ một cột (huy hiệu và con dấu về đúng góc phải, gợi ý không còn bị ép thành cột hẹp; lỗi có từ GĐ 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 14: Chữ đi theo vật dừng trên chân khung

**Mục tiêu:** Spec §4.1 mục 10 (chữ đọc được, không tràn ra ngoài màn hình) và mục 2 (thơ luôn ở góc). `main.frame` vẽ đè lên `[data-stage]`. Chữ đi theo vật mà xuống tới gợi ý hay thơ thì hai lớp chữ in chồng lên nhau, không đọc được dòng nào. Đo trên GPU thật, với đèn thả ở chỗ e2e chạm (0,5; 0,8):
- máy tính 1280×800: dòng nguồn đè lên lời mời 29 px;
- điện thoại 390×844: câu thơ đè lên lời mời và thơ 79 px;
- điện thoại 360×740: đè 106 px.

Bao chọn cách này thay vì làm mờ thơ khi có chữ: làm mờ thơ trái spec §4.1 mục 2, và lời mời mờ đi có thể vướng luật tương phản của axe.
- `mountCaptions` đo, MỘT lần cho mỗi `show()` (cùng lúc đo cỡ chữ), mép trên cao nhất của chân khung: `[data-hint], [data-poem], [data-seal], [data-moon]`. Ô cao 0 thì bỏ qua: gợi ý đang trống vì thanh lớp mở, hay `?poster` gỡ khung khỏi bố cục. Số đo đổi từ tọa độ của trang sang tọa độ trong vùng chữ.
- `place()` đặt đáy chữ ở `cy = max(min(y, floor), box.height)`:
  - điểm neo thấp hơn chân khung thì chữ dừng ở mép trên của nó, vẫn ở trên điểm neo và đi theo sang ngang;
  - màn thấp tới mức chân khung còn cao hơn chính chữ thì giữ cả câu trong vùng (chữ đè lên chân khung còn hơn mất nửa câu).
- Giới hạn đã biết: chân khung chỉ đo lúc `show()`. Gợi ý đổi hay xoay máy giữa chừng thì số đo lệch trong vài giây còn lại của câu đó, như cỡ chữ.

**Files:**
- Modify: `src/ui/captions.js`, `src/styles/captions.css` (chú thích về khoảng hở dưới chữ)
- Test: `tests/unit/captions.test.js`

**Interfaces:**
- Consumes: `mountCaptions` (Task 4); các móc `[data-hint]`, `[data-poem]`, `[data-seal]`, `[data-moon]` của `index.html` (`tests/paintings/html.test.js` giữ).
- Produces: — (`show`/`place` giữ nguyên chữ ký).

- [ ] **Step 1: Test (hỏng: chữ đi xuống tới điểm neo, đè lên lời mời)**

Áp vào `tests/unit/captions.test.js`:

```diff
diff --git a/tests/unit/captions.test.js b/tests/unit/captions.test.js
index 81c0d93..f196910 100644
--- a/tests/unit/captions.test.js
+++ b/tests/unit/captions.test.js
@@ -115,6 +115,50 @@ describe('mountCaptions', () => {
     expect(caption().style.transform).toBe('translate(75px, 200px) translate(-50%, -100%)');
   });
 
+  it('chữ không xuống dưới chân khung (gợi ý / lời mời, rồi thơ): main.frame vẽ đè lên vùng chữ; chân khung chỉ đo lúc show', () => {
+    // Chân khung như index.html: gợi ý ở hàng giữa, rồi footer.foot với thơ, trăng và con dấu. jsdom không tính bố cục: giả khung
+    // của từng ô (toạ độ của trang); vùng chữ bắt đầu ở y 20 của trang, nên đáy chữ tính trong vùng là top − 20. Đáy các ô của
+    // chân trang thẳng hàng (align-items: flex-end): thơ hai câu thấp hơn con dấu, nên mép trên của chân trang là của con dấu.
+    document.body.insertAdjacentHTML('beforeend', '<main class="frame">'
+      + '<p class="hint" data-hint aria-live="polite">Bức tranh này có 6 lớp — mài thử?</p>'
+      + '<footer class="foot"><figure class="poem"><blockquote data-poem><p>Công cha như núi Thái Sơn</p>'
+      + '<p>Nghĩa mẹ như nước trong nguồn chảy ra</p></blockquote><figcaption><cite>Ca dao</cite></figcaption></figure>'
+      + '<div class="marks"><svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>'
+      + '<span class="dau" data-seal>18 tháng Tám · Bính Ngọ</span></div></footer></main>');
+    const rect = (top, height) => () => ({ top, height, bottom: top + height, left: 0, right: 640, width: 640, x: 0, y: top });
+    const spy = (sel, top, height) => vi.spyOn(document.querySelector(sel), 'getBoundingClientRect').mockImplementation(rect(top, height));
+    const hint = spy('[data-hint]', 520, 28);
+    const poem = spy('[data-poem]', 574, 70);
+    const moon = spy('[data-moon]', 628, 40);
+    const seal = spy('[data-seal]', 564, 104);
+    vi.spyOn(region(), 'getBoundingClientRect').mockImplementation(rect(20, 800));
+
+    captions.show(KIEU); // chữ 200 × 60 px
+    captions.place(320, 700, true); // điểm neo dưới thơ: đáy chữ dừng ở mép trên của lời mời, chữ vẫn ở trên điểm neo
+    expect(caption().style.transform).toBe('translate(320px, 500px) translate(-50%, -100%)');
+    captions.place(100, 520, true); // vẫn đi theo điểm neo sang ngang
+    expect(caption().style.transform).toBe('translate(100px, 500px) translate(-50%, -100%)');
+    captions.place(320, 300, true); // điểm neo trên chân khung: chữ đứng ngay trên nó như thường
+    expect(caption().style.transform).toBe('translate(320px, 300px) translate(-50%, -100%)');
+    // Đo cả bốn ô, mỗi ô một lần; place() chạy mỗi khung: không đo lại.
+    expect([hint, poem, moon, seal].map((s) => s.mock.calls.length)).toEqual([1, 1, 1, 1]);
+
+    // Gợi ý trống (thanh lớp đang mở) hay bị gỡ khỏi bố cục (?poster: display none) thì cao 0: không tính. Còn lại chân trang:
+    // chân khung là mép trên cao nhất (của con dấu), không phải mép trên của ô gặp đầu tiên trong trang (thơ).
+    hint.mockImplementation(rect(0, 0));
+    captions.show(CA_DAO);
+    captions.place(320, 700, true);
+    expect(caption().style.transform).toBe('translate(320px, 544px) translate(-50%, -100%)');
+
+    // Màn quá thấp (chân khung còn cao hơn chính chữ): giữ cả câu trong vùng, dù chữ phải đè lên chân khung.
+    seal.mockImplementation(rect(60, 104));
+    poem.mockImplementation(rect(70, 70));
+    moon.mockImplementation(rect(124, 40));
+    captions.show(KIEU);
+    captions.place(320, 700, true);
+    expect(caption().style.transform).toBe('translate(320px, 60px) translate(-50%, -100%)');
+  });
+
   it('fade gắn data-fading; clear làm rỗng vùng mà vùng vẫn còn; chưa có chữ thì place, fade, clear không làm gì', () => {
     captions.place(10, 10, true);
     captions.fade();
```

Run: `npx vitest run tests/unit/captions.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `AssertionError: expected 'translate(320px, 700px) translate(-50…' to be 'translate(320px, 500px) translate(-50…' // Object.is equality`.

- [ ] **Step 2: Code**

Áp vào `src/ui/captions.js`:

```diff
diff --git a/src/ui/captions.js b/src/ui/captions.js
index c05c0fc..66dfec7 100644
--- a/src/ui/captions.js
+++ b/src/ui/captions.js
@@ -8,6 +8,14 @@ import { h } from './dom.js';
 export const CAPTION_SECONDS = 9;
 /** Bắt đầu tan trước khi hết giờ bấy nhiêu giây: đúng thời gian tan của [data-fading] trong styles/captions.css. */
 export const CAPTION_FADE = 1.2;
+/**
+ * Chân khung của trang: gợi ý / lời mời, rồi thơ, trăng và con dấu. main.frame vẽ đè lên [data-stage], nên chữ đi theo vật
+ * xuống tới đó là hai lớp chữ in chồng lên nhau, không đọc được dòng nào. Điểm neo ở phần ba dưới màn hình (chỗ ngón cái chạm
+ * tới trên điện thoại) thì nằm ngay dưới thơ. Tìm bằng các ô data-* mà tests/paintings/html.test.js giữ ở mọi trang, không
+ * bằng class của CSS: thơ, trăng (nếu có) và con dấu là con của chân trang, nên mép trên cao nhất của chúng cũng là mép trên
+ * của chân trang.
+ */
+const FLOOR = '[data-hint], [data-poem], [data-seal], [data-moon]';
 
 /**
  * Vùng chữ nằm trong [data-stage], ngay trên canvas và cùng cỡ với nó, nên toạ độ px tính từ góc trái trên của canvas
@@ -28,6 +36,20 @@ export function mountCaptions(doc, parent) {
   parent.append(region);
   let caption = null; // <p class="caption"> đang hiện; null khi vùng trống
   let box = { width: 0, height: 0 }; // cỡ (px) của chữ đang hiện, đo một lần lúc show
+  let floor = Infinity; // mép trên của chân khung (px trong vùng), đo cùng lúc với box; không có chân khung thì vô cùng
+
+  /**
+   * Mép trên cao nhất của chân khung, đổi từ toạ độ của trang sang toạ độ trong vùng. Ô cao 0 thì bỏ qua: gợi ý đang trống
+   * (thanh lớp mở), hay khung bị gỡ khỏi bố cục (?poster cho nó display: none, mọi số đo về 0).
+   */
+  const measureFloor = () => {
+    let top = Infinity;
+    for (const el of doc.querySelectorAll(FLOOR)) {
+      const r = el.getBoundingClientRect();
+      if (r.height > 0) top = Math.min(top, r.top);
+    }
+    return top - region.getBoundingClientRect().top;
+  };
 
   return {
     /** Thay dòng đang hiện (nếu có) bằng một dòng mới: từng câu một hàng, rồi nguồn (· tác giả), như thơ trong Sổ tay. */
@@ -40,14 +62,17 @@ export function mountCaptions(doc, parent) {
       // Thiếu bước này, gắn chữ và hiện chữ rơi vào cùng một lần tính style, và chữ hiện ngay, không mờ dần.
       void doc.defaultView?.getComputedStyle(caption).opacity;
       caption.setAttribute('data-shown', '');
-      // Đo cỡ chữ một lần cho mỗi dòng (một lần tính bố cục lúc thả, không phải mỗi khung): place() cần nó để giữ chữ trong
-      // vùng. Xoay máy giữa chừng thì số đo lệch chút trong vài giây còn lại của dòng đó.
+      // Đo cỡ chữ và chân khung một lần cho mỗi dòng (một lần tính bố cục khi dòng vào, không phải mỗi khung): place() cần
+      // chúng để giữ chữ trong vùng và trên chân khung. Lời mời hiện từ lần chạm đầu, trước cả cử chỉ làm chữ hiện, nên đã có
+      // trong số đo. Xoay máy, hay gợi ý đổi giữa chừng, thì số đo lệch trong vài giây còn lại của dòng đó.
       box = { width: caption.offsetWidth, height: caption.offsetHeight };
+      floor = measureFloor();
     },
     /**
      * Đặt chữ ngay TRÊN điểm (x, y) (px trong vùng), căn giữa theo chiều ngang. Điểm sát mép thì chữ dừng ở mép mà vẫn ở
      * trên điểm: chữ không tràn ra ngoài màn hình (spec §12). Trên điện thoại chữ rộng gần hết bề ngang, nên chuyện này xảy
-     * ra gần như mỗi lần. Chỉ đổi transform: không đụng tới bố cục, nên gọi mỗi khung vẫn rẻ.
+     * ra gần như mỗi lần. Điểm nằm dưới mép trên của chân khung thì chữ dừng ở mép đó: vẫn ở trên điểm và đi theo nó sang
+     * ngang, nhưng không in chồng lên gợi ý hay thơ. Chỉ đổi transform: không đụng tới bố cục, nên gọi mỗi khung vẫn rẻ.
      * visible = false (điểm neo ngoài khung, sau camera) thì gắn data-away cho chữ (CSS đưa opacity về 0 ngay), không bao giờ
      * `hidden`, không đụng vùng live; transform cũ để nguyên. visible = true thì gỡ data-away: chữ mờ dần hiện lại.
      */
@@ -60,7 +85,9 @@ export function mountCaptions(doc, parent) {
         const half = box.width / 2;
         // Vùng hẹp hơn chữ (max-width 80vw nên không xảy ra) thì đặt chữ giữa vùng: hai bên bị cắt như nhau.
         const cx = room > box.width ? Math.min(Math.max(x, half), room - half) : room / 2;
-        const cy = Math.max(y, box.height); // sát mép trên: chữ đè lên điểm neo còn hơn mất nửa câu
+        // Dưới chân khung thì dừng ở chân khung; sát mép trên thì giữ cả câu, kể cả khi màn thấp tới mức chân khung còn cao
+        // hơn chính chữ: chữ đè lên điểm neo hay lên chân khung còn hơn mất nửa câu.
+        const cy = Math.max(Math.min(y, floor), box.height);
         caption.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -100%)`;
       }
       const away = !visible;
```
Áp vào `src/styles/captions.css`:

```diff
diff --git a/src/styles/captions.css b/src/styles/captions.css
index a6b4bda..e047705 100644
--- a/src/styles/captions.css
+++ b/src/styles/captions.css
@@ -13,8 +13,9 @@
 
 /* Góc trái trên của chữ ở (0, 0); JS dời bằng transform: translate(x, y) translate(-50%, -100%), nên chữ đứng ngay TRÊN
    điểm neo, căn giữa. transform không đụng tới bố cục, nên đổi mỗi khung vẫn rẻ. padding-bottom chừa một khoảng hở để
-   chữ không đè lên chính vật. JS giữ cả khung chữ (gồm padding) trong vùng, nên padding hai bên và trên là khoảng cách tới
-   mép màn hình của chữ đang bị giữ ở mép. Font và bóng chữ như thơ của chân trang (shell.css), để chữ đọc được trên cảnh tối. */
+   chữ không đè lên chính vật, và lên gợi ý hay thơ khi JS dừng chữ ở chân khung (điểm neo nằm thấp hơn mép trên của chúng).
+   JS giữ cả khung chữ (gồm padding) trong vùng, nên padding hai bên và trên là khoảng cách tới mép màn hình của chữ đang
+   bị giữ ở mép. Font và bóng chữ như thơ của chân trang (shell.css), để chữ đọc được trên cảnh tối. */
 .caption {
   position: absolute;
   left: 0;
```

Run: `npx vitest run tests/unit/captions.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  842 passed`.

```bash
git add src/styles/captions.css src/ui/captions.js tests/unit/captions.test.js
git commit -F - <<'EOF'
feat(ui): chữ đi theo vật dừng trên chân khung (điểm neo thấp hơn gợi ý hay thơ thì chữ dừng ở mép trên của chúng, không in chồng lên)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 15: Tinh chỉnh trên GPU thật

**Mục tiêu:** Spec §4.1 mục 1 ("các số trong bảng và thời gian bò chốt khi dựng thử, đo trên máy thật"), §8.5, §4.2, §6 Lớp 4 (vũng sáng), §5 (cách đo lượt màu). Commit này chỉ đổi hằng số, CSS và chú thích, cộng một `export`. Bỏ commit này là về lại số tạm của các task trước. Số đo lúc dựng thử (Apple M2, Chrome, GPU thật):

| Thứ | Trước | Chọn | Vì sao |
|---|---|---|---|
| `HALO_STEPS` (giây) | 6 / 3 / 4 / 0,3 | **10 / 4 / 3 / 0,3** | Bảng đo từng chặng nằm trong chú thích của `HALO_STEPS`. Chặng đầu bò đúng bằng hạn 10 giây của boot: trang thật lần đầu sau deploy mất 9,2 giây, gần hết ở chặng này. `chunk` và `compiling` bò lâu gấp 2 và 3,3 lần chặng chậm nhất đo được. |
| Nét quầng | `r` 104, nét 7 | **`r` 105, nét 9** | Trên trăng 40 px nét chừng 1,6 px: đọc được, mép trong vẫn ở ngoài đĩa trăng. |
| Vũng sáng (`POOL.radius`) | 1,6 | **1,1** | 1,6 trải một vệt be rộng gấp chục lần ngọn đèn, làm bạc màu đen sơn mài quanh đèn. |
| `DRIFT.speed` | 0,6 | 0,6 (giữ) | Đèn thả trước mặt đi chừng 7 px/giây lúc đầu, 3,5 px/giây ở giây 30 (đã vào lối trăng), 1 px/giây khi đã xa. Tăng tốc chỉ làm lúc mới thả vội hơn. |
| Chữ đi theo vật | padding 12 px, `80vw` | **16 px, `90vw`** | 16 px bằng lề điện thoại, nên chữ bị giữ ở mép thẳng hàng với tên bức. Với `90vw`, không câu nào trong 12 câu xuống dòng ở 360 px. |
| e2e: `WARM_MARGIN` | 500 | **300** | Vũng nhỏ lại nên số điểm sáng ấm có đèn còn 843 (WebGL2 SwiftShader), 927 (WebGPU SwiftShader), 937 (GPU thật); không đèn 18–43. |

- **Khung mặc định không đổi.** Chưa thả đèn thì ảnh trước và sau commit này giống nhau từng điểm, ở 1280×800, 390×844 và 1600×1000, cả hai đêm `2026-09-28` và `2026-10-25`. So với `main`, chỉ đèn bờ tối đi chừng 1% (lớp sương của Task 10), mắt không thấy, nên không phải chụp lại poster.
- **`BOOT_DEADLINE_MS`** của `engine/boot.js` được export. `ui/` không import được `engine/`, nên `tests/unit/boot.test.js` giữ `HALO_STEPS.loading.seconds × 1000 === BOOT_DEADLINE_MS`.
- **Chú thích của `HALO_STEPS`** ghi điều học được về quầng. Transition của `stroke-dashoffset` chạy trên luồng chính, nên quầng đứng yên trong mọi việc đồng bộ (dựng cảnh, khung ẩn). Trên WebGL2 SwiftShader, `getContext` chặn 1,25 giây ngay sau `'chunk'`, nên quầng nằm gần 0 rồi nhảy lên chừng 0,48.

**Files:**
- Modify:
  - `src/ui/moon-progress.js`, `src/engine/boot.js`;
  - `src/styles/shell.css` (nét quầng), `src/styles/captions.css`, `src/ui/captions.js` (chú thích `90vw`);
  - `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js` (`POOL`), `src/paintings/ao-sen-dem/parts/anh-trang-drift.js` (chú thích của `speed`);
  - `e2e/ao-sen-dem.spec.js` (`WARM_MARGIN`).
- Test: `tests/unit/moon-progress.test.js`, `tests/unit/boot.test.js`, `tests/unit/shell-css.test.js`, `tests/unit/captions.test.js`

**Interfaces:**
- Consumes: quầng (Task 3), chữ (Task 4 và 14), hoa đăng (Task 9–11), e2e (Task 12).
- Produces: `export const BOOT_DEADLINE_MS = 10_000` trong `src/engine/boot.js`.

- [ ] **Step 1: Test (hỏng: số giây, nét và bán kính quầng cũ; chưa export `BOOT_DEADLINE_MS`)**

Áp vào `tests/unit/moon-progress.test.js`:

```diff
diff --git a/tests/unit/moon-progress.test.js b/tests/unit/moon-progress.test.js
index efc3c87..2290c49 100644
--- a/tests/unit/moon-progress.test.js
+++ b/tests/unit/moon-progress.test.js
@@ -42,25 +42,25 @@ describe('createMoonProgress', () => {
     expect(svg.childElementCount).toBe(2); // chỉ có trăng: đĩa tối + phần sáng
   });
 
-  it("'loading' tạo vòng có pathLength 1, dashoffset đích 0,55 và transition 6s", () => {
+  it("'loading' tạo vòng có pathLength 1, dashoffset đích 0,55 và transition 10s (bằng hạn 10 giây của boot)", () => {
     const flushed = watchFlush();
     progress.step('loading');
     const ring = halo();
     expect(ring.getAttribute('pathLength')).toBe('1');
-    // Bán kính 1,04 trên trăng, vẽ ở toạ độ riêng gấp 100 rồi thu lại (ui/moon-progress.js nói vì sao).
-    expect(ring.getAttribute('r')).toBe('104');
+    // Bán kính 1,05 trên trăng, vẽ ở toạ độ riêng gấp 100 rồi thu lại (ui/moon-progress.js nói vì sao).
+    expect(ring.getAttribute('r')).toBe('105');
     expect(ring.getAttribute('transform')).toBe('rotate(-90) scale(0.01)'); // nét bắt đầu ở đỉnh, đi theo chiều kim đồng hồ
     expect(svg.lastElementChild).toBe(ring); // vẽ sau trăng, nằm trên cùng
     // Vòng mới được chốt ở trạng thái rỗng TRƯỚC khi đặt đích, nên mốc đầu tiên cũng bò chứ không nhảy.
     expect(flushed).toEqual(['1']);
     expect(offset()).toBeCloseTo(0.55, 4);
-    expect(ring.style.transition).toBe('stroke-dashoffset 6s cubic-bezier(0.15, 0.6, 0.25, 1)');
+    expect(ring.style.transition).toBe('stroke-dashoffset 10s cubic-bezier(0.15, 0.6, 0.25, 1)');
   });
 
   it('các mốc sau đi tiếp đúng đích: chunk 0,38 → compiling 0,1 → fading 0', () => {
     progress.step('loading');
     const ring = halo();
-    for (const [name, target, seconds] of [['chunk', 0.38, 3], ['compiling', 0.1, 4], ['fading', 0, 0.3]]) {
+    for (const [name, target, seconds] of [['chunk', 0.38, 4], ['compiling', 0.1, 3], ['fading', 0, 0.3]]) {
       progress.step(name);
       expect(halo(), name).toBe(ring); // vẫn vòng cũ: transition mới đi tiếp từ chỗ đang đứng
       expect(offset(), name).toBeCloseTo(target, 4);
@@ -73,7 +73,7 @@ describe('createMoonProgress', () => {
     progress.step('compiling');
     progress.step('chunk');
     expect(offset()).toBeCloseTo(0.1, 4);
-    expect(halo().style.transition).toMatch(/^stroke-dashoffset 4s /); // transition của compiling không bị thay
+    expect(halo().style.transition).toMatch(/^stroke-dashoffset 3s /); // transition của compiling không bị thay
   });
 
   it("'fading' làm quầng đầy rồi tan cùng lúc hòa dần; 'live' gỡ quầng; 'loading' sau đó vẽ lại từ vòng rỗng", () => {
```
Áp vào `tests/unit/boot.test.js`:

```diff
diff --git a/tests/unit/boot.test.js b/tests/unit/boot.test.js
index 1d6eb28..286c5ef 100644
--- a/tests/unit/boot.test.js
+++ b/tests/unit/boot.test.js
@@ -3,7 +3,7 @@
 // nên import('./gpu/run.js') trong boot.js được phép trỏ tới file chưa có (Task 15 mới tạo). DOM tự dựng bằng JSDOM.
 import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
 import { JSDOM } from 'jsdom';
-import { boot } from '../../src/engine/boot.js';
+import { boot, BOOT_DEADLINE_MS } from '../../src/engine/boot.js';
 import { HALO_STEPS } from '../../src/ui/moon-progress.js';
 import t from '../../src/ui/strings.vi.js';
 import { mountPage } from '../helpers/page.js';
@@ -191,6 +191,10 @@ describe('boot · quầng trăng tiến độ (GĐ 5)', () => {
   const halo = () => page.moon.querySelector('.moon-halo');
   const offset = () => Number(halo().style.strokeDashoffset);
 
+  it('chặng đầu của quầng bò đúng bằng hạn của boot (ui/ không import được engine/, nên test giữ hai số khớp nhau)', () => {
+    expect(HALO_STEPS.loading.seconds * 1000).toBe(BOOT_DEADLINE_MS);
+  });
+
   it("báo mốc 'chunk' sau khi loadRun xong và trước khi run chạy", async () => {
     let whileLoading;
     let whenRunning;
```
Áp vào `tests/unit/shell-css.test.js`:

```diff
diff --git a/tests/unit/shell-css.test.js b/tests/unit/shell-css.test.js
index cc56756..5587604 100644
--- a/tests/unit/shell-css.test.js
+++ b/tests/unit/shell-css.test.js
@@ -103,8 +103,8 @@ describe('shell.css · quầng trăng tiến độ (GĐ 5)', () => {
     expect(halo).toMatch(/stroke-dasharray: 1 2(;|\s|$)/);
   });
 
-  it('nét 7: vòng vẽ ở toạ độ riêng gấp 100 rồi scale(0.01) (ui/moon-progress.js), trên trăng nét còn 0,07', () => {
-    expect(declarations('.moon-halo')).toMatch(/stroke-width: 7(;|\s|$)/);
+  it('nét 9: vòng vẽ ở toạ độ riêng gấp 100 rồi scale(0.01) (ui/moon-progress.js), trên trăng nét còn 0,09', () => {
+    expect(declarations('.moon-halo')).toMatch(/stroke-width: 9(;|\s|$)/);
   });
 
   it('giảm chuyển động thì không có transition: !important thắng transition inline của ui/moon-progress.js', () => {
```
Áp vào `tests/unit/captions.test.js`:

```diff
diff --git a/tests/unit/captions.test.js b/tests/unit/captions.test.js
index f196910..6304465 100644
--- a/tests/unit/captions.test.js
+++ b/tests/unit/captions.test.js
@@ -110,7 +110,7 @@ describe('mountCaptions', () => {
     captions.place(320, 20, true); // sát mép trên: đáy chữ dừng ở đúng chiều cao của chữ, đầu chữ chạm mép
     expect(caption().style.transform).toBe('translate(320px, 60px) translate(-50%, -100%)');
     expect(layout.width.mock.calls.length + layout.height.mock.calls.length).toBe(reads); // place() chạy mỗi khung: không đo chữ lại
-    layout.room.mockReturnValue(150); // vùng hẹp hơn chữ (max-width 80vw nên không xảy ra): đặt chữ giữa vùng
+    layout.room.mockReturnValue(150); // vùng hẹp hơn chữ (max-width 90vw nên không xảy ra): đặt chữ giữa vùng
     captions.place(30, 200, true);
     expect(caption().style.transform).toBe('translate(75px, 200px) translate(-50%, -100%)');
   });
```

Run: `npx vitest run tests/unit/moon-progress.test.js tests/unit/boot.test.js tests/unit/shell-css.test.js tests/unit/captions.test.js`
Kết quả mong đợi: FAIL, 5 test hỏng; lỗi đầu tiên: `AssertionError: expected 6000 to be undefined // Object.is equality`.

- [ ] **Step 2: Hằng số**

Áp vào `src/ui/moon-progress.js`:

```diff
diff --git a/src/ui/moon-progress.js b/src/ui/moon-progress.js
index b6b7dfa..b3fd9af 100644
--- a/src/ui/moon-progress.js
+++ b/src/ui/moon-progress.js
@@ -12,11 +12,43 @@ const EASE_OUT = 'cubic-bezier(0.15, 0.6, 0.25, 1)';
  */
 export const CROSSFADE_MS = 900;
 
-/** Mốc → phần vòng quầng đích và số giây bò tới đó (đường cong ease-out: nhanh lúc đầu, chậm dần). */
+/**
+ * Mốc → phần vòng quầng đích và số giây bò tới đó (đường cong ease-out: nhanh lúc đầu, chậm dần; đi được 90% đường sau
+ * nửa số giây). Số giây chốt theo thời gian đo được của từng chặng (GĐ 5, Mac M2 có GPU thật, rồi SwiftShader thay cho máy
+ * yếu), tính từ mốc này tới mốc sau:
+ *
+ *   chặng (ms)                    M2 ấm   M2 lạnh   Fast 4G   Slow 4G   WebGPU SwiftShader   WebGL2 SwiftShader
+ *   loading → chunk             24 – 45   30 – 60       700      3390                   30              35 – 60
+ *   chunk → compiling           33 – 44        45       265       820          1840 – 1950          1320 – 1360
+ *   compiling: compileAsync   137 – 154       155       150       160            840 – 910            360 – 390
+ *   khung ẩn, rồi 'fading'    115 – 127       125       125       130                  135                  940
+ *
+ * ("ấm": trình duyệt đã có cache, mở lại trong cùng tab hay ở tab mới; "lạnh": trình duyệt mới, không cache;
+ * SwiftShader đo ở lần mở trang đầu của trình duyệt. Fast/Slow 4G: hai mức giả lập mạng của DevTools, trên M2.) Trang
+ * thật lần đầu sau deploy (CDN chưa có file) mất 9,2 giây, gần hết ở chặng đầu. Nên chặng đầu bò lâu bằng hạn 10 giây
+ * của boot (BOOT_DEADLINE_MS của engine/boot.js; tests/unit/boot.test.js giữ hai số khớp nhau), để quầng không đứng hẳn
+ * trước lúc quá hạn. Có điều ease-out dồn quãng vào nửa đầu: từ giây thứ 7 tới lúc rơi về tranh tĩnh, quầng chỉ nhích
+ * thêm chừng 0,012 vòng (1,5px trên trăng 40px), mắt gần như không thấy. 'chunk' bò 4 giây và 'compiling' bò 3 giây,
+ * gấp 2 và 3,3 lần chặng chậm nhất đo được, nên mốc sau tới khi quầng còn đang bò. Máy nhanh thì cả vòng chạy chưa tới
+ * một giây.
+ *
+ * Số giây chỉ có tác dụng khi trình duyệt còn vẽ khung. Transition của stroke-dashoffset tính trên luồng chính
+ * (compositor chỉ chạy hộ vài thuộc tính như opacity, transform): luồng chính bận thì quầng đứng yên, rảnh ra mới nhảy
+ * tới chỗ đáng lẽ đã tới. Quầng bò khi trang chỉ đang chờ: chờ mạng (loading, chunk), chờ GPU (xin adapter WebGPU,
+ * compileAsync). Nó đứng yên trong việc đồng bộ. Máy nào cũng có hai việc như vậy: dựng cảnh (40–60 ms, trên M2 cũng
+ * như SwiftShader) và khung ẩn (dòng cuối của bảng). WebGL2 còn tạo context ngay sau 'chunk': trên WebGL2
+ * SwiftShader getContext chặn 1,25 giây, quầng nằm gần 0 (0,003 – 0,012) rồi nhảy lên gần nửa vòng (0,475 – 0,486).
+ * Mốc 'chunk' được đặt trong cùng tác vụ đó, và transition của nó lấy giờ bắt đầu từ khung trước lúc chặn, nên khung đầu
+ * tiên sau đó coi như nó đã bò 1,25 trong 4 giây: 31% thời gian là 77% quãng theo đường ease-out, 0,01 + 0,61 · 0,77 ≈ 0,48.
+ * Rồi compileAsync chặn chừng 0,2 giây và khung ẩn chừng 0,95 giây: quầng đứng ở chừng 0,59 gần 1,2 giây trước 'fading'.
+ * Trên WebGPU SwiftShader, lúc xin adapter (1,8 giây) luồng chính rảnh mà khung vẫn thưa, có khi cách nhau 0,4 giây:
+ * quầng đi giật. Cũng vì vậy mà không có mốc nào giữa compileAsync và 'fading': run.js vẽ khung ẩn rồi đặt 'fading' liền
+ * trong một tác vụ, nên một đích đặt trước khung ẩn bị 'fading' thay trước khi trình duyệt kịp vẽ khung nào.
+ */
 export const HALO_STEPS = Object.freeze({
-  loading: Object.freeze({ to: 0.45, seconds: 6 }),
-  chunk: Object.freeze({ to: 0.62, seconds: 3 }),
-  compiling: Object.freeze({ to: 0.9, seconds: 4 }),
+  loading: Object.freeze({ to: 0.45, seconds: 10 }),
+  chunk: Object.freeze({ to: 0.62, seconds: 4 }),
+  compiling: Object.freeze({ to: 0.9, seconds: 3 }),
   fading: Object.freeze({ to: 1, seconds: 0.3 }),
 });
 
@@ -56,11 +88,11 @@ export function createMoonProgress(svg) {
     remove();
     halo = doc.createElementNS(NS, 'circle');
     halo.setAttribute('class', 'moon-halo');
-    // Trên trăng, bán kính là 1,04: ngay ngoài đĩa trăng (bán kính 1), nét vẫn nằm trong viewBox ±1,1. Chrome đo pathLength
-    // của hình rất nhỏ quá thô (mỗi phần tư vòng thành một dây cung, chu vi 4·r·√2 ≈ 0,9·2πr): vòng r 1,04 không bao giờ
-    // khép, lúc rỗng vẫn ló một cung. Vẽ ở toạ độ riêng lớn gấp 100 rồi thu lại thì đo đúng. Nét cũng tính theo toạ độ
-    // riêng: shell.css đặt stroke-width 7, trên trăng còn 0,07.
-    halo.setAttribute('r', '104');
+    // Trên trăng, bán kính là 1,05 và nét dày 0,09: mép trong 1,005 ngay ngoài đĩa trăng (bán kính 1), mép ngoài 1,095 vẫn
+    // trong viewBox ±1,1. Chrome đo pathLength của hình rất nhỏ quá thô (mỗi phần tư vòng thành một dây cung, chu vi
+    // 4·r·√2 ≈ 0,9·2πr): vòng r 1,05 không bao giờ khép, lúc rỗng vẫn ló một cung. Vẽ ở toạ độ riêng lớn gấp 100 rồi thu
+    // lại thì đo đúng. Nét cũng tính theo toạ độ riêng: shell.css đặt stroke-width 9, trên trăng còn 0,09.
+    halo.setAttribute('r', '105');
     halo.setAttribute('pathLength', '1');
     // Vòng tròn SVG bắt đầu ở 3 giờ: xoay để nét mọc từ đỉnh, theo chiều kim đồng hồ; scale thu toạ độ riêng về lại.
     halo.setAttribute('transform', 'rotate(-90) scale(0.01)');
```
Áp vào `src/engine/boot.js`:

```diff
diff --git a/src/engine/boot.js b/src/engine/boot.js
index ee61888..55170d3 100644
--- a/src/engine/boot.js
+++ b/src/engine/boot.js
@@ -6,8 +6,11 @@ import { createSma } from './sma.js';
 import { showStatic, isChunkError } from './static.js';
 import { mountShell } from '../ui/shell.js';
 
-/** Hạn cho cả phần 3D: tải chunk, dựng cảnh, biên dịch shader, vẽ khung ẩn. Quá hạn thì về tranh tĩnh. */
-const BOOT_DEADLINE_MS = 10_000;
+/**
+ * Hạn cho cả phần 3D: tải chunk, dựng cảnh, biên dịch shader, vẽ khung ẩn. Quá hạn thì về tranh tĩnh. Chặng đầu của quầng
+ * trăng (HALO_STEPS.loading, ui/moon-progress.js) bò đúng bằng hạn này; tests/unit/boot.test.js giữ hai số khớp nhau.
+ */
+export const BOOT_DEADLINE_MS = 10_000;
 
 /**
  * Cửa vào của mọi trang: script inline trong HTML gọi `boot(entry, { lang: 'vi', t })`.
```
Áp vào `src/styles/shell.css`:

```diff
diff --git a/src/styles/shell.css b/src/styles/shell.css
index 118e871..0f5ab85 100644
--- a/src/styles/shell.css
+++ b/src/styles/shell.css
@@ -313,7 +313,7 @@ header h1 {
 .moon-halo {
   fill: none;
   stroke: var(--vang-la-sang);
-  stroke-width: 7; /* toạ độ riêng của vòng lớn gấp 100 (ui/moon-progress.js nói vì sao): trên trăng là 0,07 */
+  stroke-width: 9; /* toạ độ riêng của vòng lớn gấp 100 (ui/moon-progress.js nói vì sao): trên trăng là 0,09, chừng 1,6px ở trăng 40px */
   stroke-linecap: round;
   /* Vòng có pathLength="1": nét 1 dài đúng cả vòng, nên dashoffset 1 là vòng rỗng, 0 là vòng đầy. Khoảng trống 2 dài hơn
      cả vòng, nên lúc rỗng không có nét nào của chu kỳ sau ló ra ở cuối, trình duyệt nào cũng vậy. */
```
Áp vào `src/styles/captions.css`:

```diff
diff --git a/src/styles/captions.css b/src/styles/captions.css
index e047705..4483b95 100644
--- a/src/styles/captions.css
+++ b/src/styles/captions.css
@@ -15,14 +15,16 @@
    điểm neo, căn giữa. transform không đụng tới bố cục, nên đổi mỗi khung vẫn rẻ. padding-bottom chừa một khoảng hở để
    chữ không đè lên chính vật, và lên gợi ý hay thơ khi JS dừng chữ ở chân khung (điểm neo nằm thấp hơn mép trên của chúng).
    JS giữ cả khung chữ (gồm padding) trong vùng, nên padding hai bên và trên là khoảng cách tới mép màn hình của chữ đang
-   bị giữ ở mép. Font và bóng chữ như thơ của chân trang (shell.css), để chữ đọc được trên cảnh tối. */
+   bị giữ ở mép: hai bên 16px, bằng lề của khung trên điện thoại (--gutter), nên chữ bị giữ ở mép thẳng hàng với tên bức
+   và thơ. 90vw: một câu lục bát tám chữ vẫn vừa một hàng trên điện thoại 360px (80vw thì xuống dòng).
+   Font và bóng chữ như thơ của chân trang (shell.css), để chữ đọc được trên cảnh tối. */
 .caption {
   position: absolute;
   left: 0;
   top: 0;
-  max-width: min(26rem, 80vw);
+  max-width: min(26rem, 90vw);
   margin: 0;
-  padding: 6px 12px 10px;
+  padding: 6px 16px 10px;
   font: italic 500 clamp(18px, 0.8vw + 13px, 24px) / 1.4 var(--serif);
   text-align: center;
   text-wrap: balance;
```
Áp vào `src/ui/captions.js`:

```diff
diff --git a/src/ui/captions.js b/src/ui/captions.js
index 66dfec7..641bd8f 100644
--- a/src/ui/captions.js
+++ b/src/ui/captions.js
@@ -83,7 +83,7 @@ export function mountCaptions(doc, parent) {
         // lại bố cục giữa khung.
         const room = region.clientWidth;
         const half = box.width / 2;
-        // Vùng hẹp hơn chữ (max-width 80vw nên không xảy ra) thì đặt chữ giữa vùng: hai bên bị cắt như nhau.
+        // Vùng hẹp hơn chữ (max-width 90vw nên không xảy ra) thì đặt chữ giữa vùng: hai bên bị cắt như nhau.
         const cx = room > box.width ? Math.min(Math.max(x, half), room - half) : room / 2;
         // Dưới chân khung thì dừng ở chân khung; sát mép trên thì giữ cả câu, kể cả khi màn thấp tới mức chân khung còn cao
         // hơn chính chữ: chữ đè lên điểm neo hay lên chân khung còn hơn mất nửa câu.
```
Áp vào `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
index d9e9256..00d48b3 100644
--- a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
+++ b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
@@ -55,8 +55,9 @@ const RES_FLOOR = 0.15; // nấc 'phan-chieu' chia đôi độ phân giải ph
 const BOB = 0.6; // lá và hoa đăng nhô lên bằng 60% độ cao sóng
 const GLINT = 0.8; // phần phản chiếu sáng hơn mức này mới vào kênh emissive (bloom)
 // Vũng sáng quanh mỗi hoa đăng đang trôi (GĐ 5): exp(−d²/r²) còn 37% ở cách tâm đèn một bán kính, 2% ở hai bán kính.
-// Hai số này là số phỏng: dựng thử trên GPU thật sẽ chỉnh.
-const POOL = { radius: 1.6, intensity: 0.6 };
+// Chốt trên GPU thật: bán kính 1,6 trải một vệt vàng rộng gấp chục lần ngọn đèn, mặt nước quanh đèn bạc thành màu be;
+// 1,1 giữ ánh nến quanh chân đèn, cách đèn chừng hai đơn vị nước lại đen như sơn mài.
+const POOL = { radius: 1.1, intensity: 0.6 };
 
 /**
  * Vũng sáng của các hoa đăng đang trôi (GĐ 5): Σ exp(−d²/r²) × độ sáng, với d là khoảng cách trên mặt nước từ điểm đang vẽ
```
Áp vào `src/paintings/ao-sen-dem/parts/anh-trang-drift.js`:

```diff
diff --git a/src/paintings/ao-sen-dem/parts/anh-trang-drift.js b/src/paintings/ao-sen-dem/parts/anh-trang-drift.js
index 8a1aa25..3e90b07 100644
--- a/src/paintings/ao-sen-dem/parts/anh-trang-drift.js
+++ b/src/paintings/ao-sen-dem/parts/anh-trang-drift.js
@@ -10,7 +10,10 @@ import { mulberry32 } from '../../../lib/random.js';
 
 /** Luật trôi của hoa đăng: đơn vị cảnh, giây theo đồng hồ của cảnh (ctx.u.time). */
 export const DRIFT = Object.freeze({
-  speed: 0.6, // đơn vị/giây khi đã trôi đều: đèn thả trước mặt đi được nửa đường tới lối trăng trong một đời đèn
+  // Đơn vị/giây khi đã trôi đều. Đo trên màn hình (1280×800 và 390×844): đèn thả trước mặt (cách camera ~19 đơn vị) đi
+  // ~7 px/giây lúc đầu, ~3,5 px/giây ở giây 30 (đã vào lối trăng), ~1 px/giây khi đã xa. Đèn càng xa càng chậm trên màn
+  // hình (phối cảnh), nên tăng tốc độ gần như không làm đèn xa nhanh thêm, chỉ làm lúc mới thả vội hơn.
+  speed: 0.6,
   ease: 4, // giây để đạt tốc độ đều (khởi đầu mềm)
   sway: 0.6, // biên độ lượn ngang
   swayRate: 0.35, // rad/giây
```
Áp vào `e2e/ao-sen-dem.spec.js`:

```diff
diff --git a/e2e/ao-sen-dem.spec.js b/e2e/ao-sen-dem.spec.js
index 9001864..277b9f5 100644
--- a/e2e/ao-sen-dem.spec.js
+++ b/e2e/ao-sen-dem.spec.js
@@ -195,12 +195,13 @@ test.describe('Ao Sen Đêm · thả hoa đăng (GĐ 5)', () => {
   const SKY = { x: 0.5, y: 0.12 };
   // Quanh chỗ thả: tới khung LANTERN_N đèn mới trôi chưa tới nửa đơn vị (vài px), vũng sáng của nó loang trên nước bên dưới.
   const AROUND = { x0: WATER.x - 0.06, y0: WATER.y - 0.1, x1: WATER.x + 0.06, y1: WATER.y + 0.08 };
-  // Số điểm sáng ấm (canvasRegions().warm: R > 150, G > 110, R − B > 40) trong AROUND ở khung 640×400, đo lúc viết test: có đèn
-  // 1384 (WebGL2 SwiftShader, mức vừa), 1469 (WebGPU SwiftShader), 1468–1475 (GPU thật, Apple M2); hai lần chạm thường 19–44 (đom
-  // đóm, ánh trăng trên gợn). Ánh nến và vũng sáng màu ngà: R − B của các điểm có đèn từ 41 tới 60 (giữa 53–54), nên ngưỡng
-  // R − B > 60 không bắt được điểm nào. Phải hơn phép so WARM_MARGIN điểm: 500 chừa dư cả hai phía (số có đèn hạ chừng 60% vẫn
-  // qua; số không đèn phải tăng hơn hai mươi lần mới làm hỏng).
-  const WARM_MARGIN = 500;
+  // Số điểm sáng ấm (canvasRegions().warm: R > 150, G > 110, R − B > 40) trong AROUND ở khung 640×400, đo sau khi chốt bán kính
+  // vũng sáng 1,1 trên GPU thật (l4-mat-nuoc.js, POOL): có đèn 843 (WebGL2 SwiftShader, mức vừa), 927 (WebGPU SwiftShader), 937
+  // (GPU thật, Apple M2); hai lần chạm thường 18–43 (đom đóm, ánh trăng trên gợn). Bán kính 1,6 cũ cho 1384–1475: phần lớn số
+  // điểm là vũng sáng, nên số này đi theo diện tích vũng. Ánh nến và vũng sáng màu ngà: R − B của các điểm có đèn từ 35 tới 60
+  // (giữa chừng 55), nên ngưỡng R − B > 60 không bắt được điểm nào. Phải hơn phép so WARM_MARGIN điểm: 300 chừa dư cả hai phía
+  // (số có đèn hạ chừng 60% vẫn qua; số không đèn phải tăng hơn mười lần mới làm hỏng).
+  const WARM_MARGIN = 300;
   // Thứ tự thơ của đêm (shared.js): lần thả đầu mang câu [0], lần hai câu [1]. Hai file này không import gì nặng, Node đọc được.
   const verses = verseOrder(Object.keys(captions), parseAt(NIGHT));
```

Run: `npx vitest run tests/unit/moon-progress.test.js tests/unit/boot.test.js tests/unit/shell-css.test.js tests/unit/captions.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: e2e vẫn xanh**

```bash
pkill -f "vite preview --port 4273" || true
npm run build
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
npx playwright test --project=webgl2-swiftshader --grep "GĐ 5"
```
Kết quả mong đợi: GPU thật 31 passed (7 skipped); `webgl2-swiftshader` 4 passed, 1 skipped (test draw call chỉ chạy trên WebGPU). Annotation `hoa-dang` ghi số điểm sáng ấm có đèn lớn hơn số không đèn ít nhất 300. Máy không có GPU thật thì bỏ dòng thứ ba.

- [ ] **Step 4: Đo khung mặc định (GPU thật; không commit script)**

Lưu đoạn dưới thành `measure.tmp.mjs` ở thư mục gốc của repo, để Node tìm thấy `@playwright/test`. Ở một terminal khác, chạy `npx vite preview --port 4291 --strictPort --host 127.0.0.1` (phục vụ `dist/` vừa build ở Step 3). Rồi chạy `node measure.tmp.mjs 2026-10-25T21:00`, tắt preview và xóa file.

```js
// measure.tmp.mjs [at] — chụp khung mặc định (chưa thả đèn) ở ?at=<at>&freeze=300&poster&level=cao, in độ sáng TB (0–255) /
// độ bão hòa / tỉ lệ điểm tối như lượt màu GĐ 4.
import { chromium } from '@playwright/test';
const [, , at = '2026-10-25T21:00'] = process.argv;
const browser = await chromium.launch({ channel: 'chromium' });
for (const [width, height] of [[1280, 800], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:4291/son-mai-anh-sang/?at=${at}&freeze=300&poster&level=cao`);
  await page.waitForFunction(() => window.__sma?.frames >= 300 || window.__sma?.state === 'static', null, { timeout: 180_000 });
  const png = await page.screenshot();
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
    return { brightness: +(L / n).toFixed(2), saturation: +(S / n).toFixed(4), darkPct: +((dark / n) * 100).toFixed(2) };
  }, png.toString('base64'));
  console.log(`${width}x${height}`, JSON.stringify(m), 'backend', await page.evaluate(() => window.__sma.backend));
  await page.close();
}
await browser.close();
```
Kết quả mong đợi (đêm `2026-10-25`): 1280×800 `54.59 / 0.4261 / 12.16`, 390×844 `63.16 / 0.3848 / 6.99`, lệch vài phần trăm là do GPU khác. Bản build của Task 14 cũng cho đúng các số này, vì commit này không đổi khung mặc định.

- [ ] **Step 5: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  843 passed`.

```bash
git add e2e/ao-sen-dem.spec.js src/engine/boot.js src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js src/paintings/ao-sen-dem/parts/anh-trang-drift.js src/styles/captions.css src/styles/shell.css src/ui/captions.js src/ui/moon-progress.js tests/unit/boot.test.js tests/unit/captions.test.js tests/unit/moon-progress.test.js tests/unit/shell-css.test.js
git commit -F - <<'EOF'
style: tinh chỉnh hoa đăng, chữ đi theo vật và quầng trăng trên GPU thật (đo ở 1280×800 và 390×844)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 16: Bảng công cụ không nằm dưới Sổ tay; thanh công cụ đứng ngay sau thanh lớp trong thứ tự Tab

**Mục tiêu:** Spec §4.1 mục 6 (thanh lớp, Sổ tay, Đồ nghề), §7 (công cụ học), §12 (trợ năng). Hai lỗi có từ GĐ 4, mà Từng sợi của GĐ 5 làm nặng thêm. Bao chọn sửa cả hai trong GĐ 5.

**Bố cục.**
- **Lỗi:** thanh công cụ căn giữa cả màn hình (bảng rộng tối đa 560 px), còn Sổ tay đứng cố định bên phải (rộng tối đa 440 px, z-index cao hơn). Ở 1280×800 khi Sổ tay mở, bảng Từng sợi trải từ x 360 tới 920, mà Sổ tay bắt đầu ở 808: 112 px của bảng bị che, mất cả nút "Dệt lại". Kính mài cũng mất nút view cuối. Chỗ chồng có ở mọi bề ngang dưới chừng 1500 px.
- **Sửa:**
  - Bề rộng của hai bảng thành biến: `:root { --rail-w: 224px; --notebook-w: min(440px, calc(100vw - 300px)) }` (`notebook.css`).
  - Thanh lớp đang mở: `.rail:not([hidden]) ~ .toolbar` dời mép trái qua thanh lớp. Đây là luật mặc định, ngoài mọi `@media`; điện thoại (`max-width: 640px`) đè lại `left: 0; right: 0`. Từ 1240 px (`min-width: 1240px`), mép phải dừng trước chỗ của Sổ tay. Bảng nằm giữa khoảng trống đó, và không nhảy khi người xem đóng hay mở Sổ tay.
  - Dưới 1240 px (`max-width: 1239.98px`), Sổ tay thu lại khi một công cụ bật, như trên điện thoại từ GĐ 4, và hiện lại khi tắt. Một ngưỡng chung cho điện thoại và màn hẹp. Trong lúc đó, bấm tên lớp hay "Phủ lớp tiếp theo" vẫn đổi trang của Sổ tay đang ẩn; tắt công cụ thì thấy.
  - 1240 = 2 × 32 (lề) + 224 (thanh lớp) + 440 (Sổ tay) + 2 × 16 (khe) + 480. 480 là bề rộng nhỏ nhất mà mỗi bảng còn dùng được, đo lúc dựng thử: Từng sợi trên một hàng 477, Kính mài 475, Lột lớp 458. Test unit tính lại tổng này từ các biến CSS.
  - Thanh lớp đóng: bảng căn giữa cả bề ngang như cũ.
  - Không dùng `:has()` (tầng WebGL2 có thể chạy trên trình duyệt chưa có nó), không thêm móc mới trên `body`. Vẫn không có `transform`, `filter` hay `backdrop-filter` trên `.toolbar` và `.tool`.
- **Bề rộng CSS có thể lẻ.** Zoom trình duyệt hay thu phóng của hệ điều hành làm bề rộng thành số lẻ: cửa sổ 1549 px ở 125% là 1239,2 px. Cặp `(max-width: 1239px)` / `(min-width: 1240px)` để hở khoảng đó, không luật nào khớp, và bảng lại nằm dưới Sổ tay (bản dựng thử đầu tiên mắc đúng lỗi này; người soát tìm ra bằng iframe zoom 1,25). Vì vậy: luật mặc định cộng một `@media` đè lên đứng SAU nó, hoặc quy ước .02 (`1239.98px`). Không dùng cú pháp khoảng `width < 1240px`: Safari 16.2–16.3 chưa có, mà `color-mix` của dự án chạy được ở đó. Test unit giữ thứ tự các khối.
- **Một điều học được:** bảng nằm trong `.toolbar > .tool > .tool-panel`, nên phần tử flex là ô `.tool`, không phải bảng. Thêm một phần trăm vào `max-width` của bảng là vòng lặp khi tính bề rộng của ô, và Chromium bỏ CẢ khai báo `max-width` (kể cả 560 px): bảng lệch 58 px khỏi tâm. Giữ `max-width: min(560px, calc(100vw - 2 * var(--gutter)))`; một test unit cấm `%` ở đó.

**Thứ tự Tab (WCAG 2.4.3).**
- **Lỗi:** hộp đồ nghề gắn thanh công cụ vào `<body>` lúc dựng cảnh, còn Sổ tay gắn thanh lớp và Sổ tay vào sau nó, ở lần mở đầu. Bật công cụ bằng Enter trên nút ở thanh lớp xong, người dùng bàn phím phải Tab qua hết thanh lớp và Sổ tay, vòng qua cả trang, chừng bảy lần mới tới bảng.
- **Sửa:** thứ tự DOM của ba bảng cố định là thanh lớp → thanh công cụ → Sổ tay. `toolbox.js` chèn thanh công cụ ngay sau `[data-rail]` nếu đã có (trường hợp "Dựng lại cảnh"), không thì gắn vào `body`. `workshop.js`, ở lần mở đầu, đặt thanh lớp ngay trước và Sổ tay ngay sau `[data-toolbar]` đã có. z-index (thanh công cụ 1, thanh lớp và Sổ tay 2) chứ không phải thứ tự DOM giữ thanh công cụ và tay nắm của Kính mài ở dưới. Không dời focus khi bật công cụ, nên người dùng chuột không bị nhảy focus.

**e2e (mọi bức, các project 3D).**
- 1280×800, thanh lớp và Sổ tay mở: với Từng sợi, Kính mài, Lột lớp, bảng không chồng lên Sổ tay hay thanh lớp và nằm giữa khoảng trống (±1 px). "Dệt lại", mọi nút view của Kính mài và thanh của Lột lớp nằm trong khung, và `elementFromPoint` ở tâm chúng trả đúng chúng. Ở 1280, thanh, số đếm và nút của Từng sợi trên một hàng. Ở 1240 bảng vẫn không chồng lên tấm nào và "Dệt lại" bấm trúng; không kiểm một hàng ở đó, vì hàng chỉ dư chừng 4 px và chữ trên Ubuntu của CI có thể rộng hơn vài px. Ở 1440 bảng căn giữa. Thanh lớp đóng thì bảng căn giữa cả bề ngang.
- 1024×768: Sổ tay ẩn khi Từng sợi bật, hiện lại khi tắt; bảng tránh thanh lớp; "Dệt lại" bấm trúng.
- Sau "Dựng lại cảnh": vẫn có `[data-rail] + [data-toolbar]`.
- Lượt bàn phím kiểm ĐÚNG chuỗi điểm dừng, dựng từ `__sma.tools()` và `__sma.dials()`. Ở 640 px: `button@rail:chip, input@rail:range, button@rail, button@rail, input@tool:range, button@tool`. Ở 1280 px với Sổ tay mở lại: `input@rail:range, button@rail, button@rail, input@tool:range, button@tool, button@nb`.

**Files:**
- Modify: `src/engine/gpu/toolbox.js`, `src/ui/workshop.js`, `src/styles/tools.css`, `src/styles/notebook.css`, `e2e/painting.spec.js`, `e2e/a11y.spec.js`
- Test: `tests/unit/shell-css.test.js`, `tests/unit/toolbox.test.js`, `tests/unit/workshop.test.js`, `tests/paintings/html.test.js`

**Interfaces:**
- Consumes: hộp đồ nghề (GĐ 4, Task 6); thanh lớp và Sổ tay (`ui/workshop.js`, GĐ 2–4); Từng sợi (Task 7).
- Produces: biến CSS `--rail-w`, `--notebook-w`; thứ tự DOM thanh lớp → thanh công cụ → Sổ tay.

- [ ] **Step 1: Test unit (hỏng: thanh công cụ đứng trước thanh lớp; chưa có biến bề rộng)**

Áp vào `tests/unit/shell-css.test.js`:

```diff
diff --git a/tests/unit/shell-css.test.js b/tests/unit/shell-css.test.js
index 5587604..4a5c42e 100644
--- a/tests/unit/shell-css.test.js
+++ b/tests/unit/shell-css.test.js
@@ -1,4 +1,4 @@
-// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng; chữ đi theo vật.
+// tests/unit/shell-css.test.js — CSS của vỏ trang và Sổ tay: nhấn giữ trên canvas là cử chỉ của bức (iOS); vùng aria-live không bao giờ bị ẩn; quầng trăng; chữ đi theo vật; chỗ của bảng công cụ.
 import { describe, it, expect } from 'vitest';
 import { readFileSync } from 'node:fs';
 import { CROSSFADE_MS } from '../../src/ui/moon-progress.js';
@@ -7,6 +7,7 @@ import { CAPTION_FADE } from '../../src/ui/captions.js';
 const read = (file) => readFileSync(new URL(`../../src/styles/${file}`, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
 const css = read('shell.css');
 const notebookCss = read('notebook.css');
+const toolsCss = read('tools.css');
 const captionsCss = read('captions.css');
 
 /** Gộp khai báo của mọi khối có đúng bộ chọn `selector` (kể cả khối nằm trong @media). */
@@ -18,6 +19,28 @@ function declarations(selector, source = css) {
   return out.join(';').replace(/\s+/g, ' ');
 }
 
+/**
+ * Mọi khối của một file theo thứ tự, kèm điều kiện của khối @media bao nó (mỗi khối @media lồng được một tầng ngoặc):
+ * { media, selectors, body }, media là '' ngoài mọi @media, không thì như '(min-width: 1240px)'.
+ */
+function blocks(source) {
+  const out = [];
+  for (const [, media, inner, selectors, body] of source.matchAll(/@media([^{]*)\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}|([^{}]+)\{([^{}]*)\}/g)) {
+    if (media === undefined) out.push({ media: '', selectors: selectors.trim(), body });
+    else for (const m of inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push({ media: media.trim().replace(/\s+/g, ' '), selectors: m[1].trim(), body: m[2] });
+  }
+  return out;
+}
+
+/** Như declarations(), nhưng chỉ trong các khối @media có đúng điều kiện `media` ('' là ngoài mọi @media). */
+function declarationsIn(media, selector, source) {
+  return blocks(source)
+    .filter((b) => b.media === media && b.selectors.split(',').some((s) => s.trim() === selector))
+    .map((b) => b.body)
+    .join(';')
+    .replace(/\s+/g, ' ');
+}
+
 /** Nội dung của mọi khối @media (prefers-reduced-motion: reduce), nối lại (mỗi khối lồng được một tầng ngoặc). */
 const reducedMotion = (source = css) => [...source.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g)]
   .map((m) => m[1])
@@ -161,3 +184,67 @@ describe('captions.css · chữ đi theo vật (GĐ 5)', () => {
     expect(hidden.split(',').map((s) => s.trim())).toContain('.captions');
   });
 });
+
+describe('tools.css · bảng công cụ không bao giờ nằm dưới thanh lớp hay Sổ tay (GĐ 5)', () => {
+  const RAIL_OPEN = '.rail:not([hidden]) ~ .toolbar';
+  // Bảng hẹp nhất còn dùng được, đo trên GPU thật ở 1280×800: hàng của Từng sợi (nhãn, thanh 260px, số đếm, "Dệt lại") một dòng là
+  // 451px, cộng 26px đệm và viền của .tool-panel là 477px; hàng view của Kính mài 475px, Lột lớp 458px.
+  const PANEL_MIN = 480;
+
+  it('thanh lớp và Sổ tay đọc bề rộng từ --rail-w và --notebook-w: chính hai biến mà tools.css dùng để đặt bảng công cụ', () => {
+    const root = declarations(':root', notebookCss);
+    expect(root).toMatch(/--rail-w: 224px/);
+    expect(root).toMatch(/--notebook-w: min\(440px, calc\(100vw - 300px\)\)/);
+    expect(declarations('.rail', notebookCss)).toMatch(/(^|[;\s])width: var\(--rail-w\)/);
+    expect(declarations('.notebook', notebookCss)).toMatch(/(^|[;\s])width: var\(--notebook-w\)/);
+  });
+
+  it('máy tính, thanh lớp mở: bảng bắt đầu sau thanh lớp; đủ chỗ thì dừng trước Sổ tay (cả khi Sổ tay đóng, bảng không nhảy), không thì Sổ tay thu lại khi công cụ bật', () => {
+    // Thanh công cụ đứng ngay sau thanh lớp trong trang (thứ tự Tab), nên "~" đọc được thanh lớp đang mở mà không cần :has().
+    // Bề rộng CSS có thể lẻ (zoom trình duyệt: cửa sổ 1549px ở 125% là 1239.2px), nên không có cặp min-width 641px / max-width
+    // 640px (640.8px lọt giữa hai ngưỡng): luật máy tính là mặc định, ngoài mọi @media, và điện thoại đè lên.
+    const desktop = declarationsIn('', RAIL_OPEN, toolsCss);
+    expect(desktop).toMatch(/left: calc\(var\(--gutter\) \+ var\(--rail-w\) \+ 16px\)/);
+    expect(desktop).toMatch(/right: var\(--gutter\)/);
+    expect(declarationsIn('(max-width: 640px)', RAIL_OPEN, toolsCss)).toMatch(/left: 0; right: 0/);
+    expect(declarationsIn('(min-width: 1240px)', RAIL_OPEN, toolsCss)).toMatch(/right: calc\(var\(--gutter\) \+ var\(--notebook-w\) \+ 16px\)/);
+    // Cùng độ ưu tiên thì khối đứng sau thắng: khối của điện thoại và khối 1240px phải đứng sau luật mặc định.
+    const at = (media) => blocks(toolsCss).findIndex((b) => b.media === media && b.selectors === RAIL_OPEN);
+    expect(at('(max-width: 640px)'), 'khối điện thoại đứng sau luật mặc định').toBeGreaterThan(at(''));
+    expect(at('(min-width: 1240px)'), 'khối 1240px đứng sau luật mặc định').toBeGreaterThan(at(''));
+    // Một ngưỡng duy nhất cho "Sổ tay thu lại khi công cụ bật", từ điện thoại tới máy tính hẹp; 1239.98px chứ không phải 1239px
+    // (quy ước .02 của Bootstrap), để 1239.2px cũng khớp.
+    const hides = blocks(toolsCss).filter((b) => b.selectors.split(',').some((s) => s.trim() === 'body[data-tool] .notebook'));
+    expect(hides.map((b) => [b.media, b.body.replace(/\s+/g, ' ').trim()])).toEqual([['(max-width: 1239.98px)', 'display: none;']]);
+    // Bảng co theo ô của nó (phần tử flex của thanh). Một phần trăm trong max-width của máy tính là phần trăm "vòng" lúc tính bề
+    // rộng nội dung của ô: trình duyệt bỏ qua cả max-width (kể cả 560px), ô rộng theo dòng chữ dài nhất và bảng lệch khỏi giữa.
+    expect(declarationsIn('', '.tool-panel', toolsCss)).toMatch(/max-width: min\(560px, [^;%]*\);/);
+  });
+
+  it(`ngưỡng 1240px = 2 lề + thanh lớp + Sổ tay + 2 khe + bảng hẹp nhất còn dùng được (${PANEL_MIN}px)`, () => {
+    const px = (re, source) => Number(re.exec(source)?.[1]);
+    const gutter = px(/--gutter: (\d+)px/, css); // lề máy tính (khối :root đầu tiên của shell.css)
+    const rail = px(/--rail-w: (\d+)px/, notebookCss);
+    const notebook = px(/--notebook-w: min\((\d+)px/, notebookCss); // từ 740px trở lên Sổ tay rộng đúng 440px
+    const gap = px(/\+ var\(--rail-w\) \+ (\d+)px/, toolsCss);
+    expect([gutter, rail, notebook, gap].every(Number.isFinite), `${gutter} ${rail} ${notebook} ${gap}`).toBe(true);
+    expect(px(/\+ var\(--notebook-w\) \+ (\d+)px/, toolsCss), 'hai khe bằng nhau: bảng ở giữa khoảng trống').toBe(gap);
+    const threshold = 2 * gutter + rail + notebook + 2 * gap + PANEL_MIN;
+    const media = (selector) => blocks(toolsCss).filter((b) => b.selectors === selector).map((b) => b.media);
+    expect(media(RAIL_OPEN)).toContain(`(min-width: ${threshold}px)`);
+    expect(media('body[data-tool] .notebook')).toEqual([`(max-width: ${threshold - 0.02}px)`]);
+  });
+
+  it('không transform, filter, backdrop-filter (hay thuộc tính nào khác tạo khối chứa) trên .toolbar và .tool: tay nắm gạt (position: fixed) đo theo khung nhìn', () => {
+    const subject = /\.(toolbar|tool)(?![\w-])[^\s>+~]*$/; // phần cuối của bộ chọn là .toolbar hay .tool (không phải .tool-panel…)
+    const errors = [];
+    for (const [file, source] of [['shell.css', css], ['notebook.css', notebookCss], ['tools.css', toolsCss], ['captions.css', captionsCss]]) {
+      for (const b of blocks(source).filter((x) => x.selectors.split(',').some((s) => subject.test(s.trim())))) {
+        for (const m of b.body.matchAll(/(?:^|[;\s])((?:-webkit-)?(?:transform|filter|backdrop-filter|perspective|will-change|contain))\s*:/g)) {
+          errors.push(`${file} › ${b.selectors} › ${m[1]}`);
+        }
+      }
+    }
+    expect(errors).toEqual([]);
+  });
+});
```
Áp vào `tests/unit/toolbox.test.js`:

```diff
diff --git a/tests/unit/toolbox.test.js b/tests/unit/toolbox.test.js
index eec24e6..2ccc17e 100644
--- a/tests/unit/toolbox.test.js
+++ b/tests/unit/toolbox.test.js
@@ -1,5 +1,5 @@
 // @vitest-environment jsdom
-// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, móc lần vẽ, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ.
+// tests/unit/toolbox.test.js — hộp đồ nghề: gắn công cụ, nhãn view, móc lần vẽ, mỗi lúc một công cụ, cử chỉ tới công cụ trước bức, công cụ hỏng thì bỏ, chỗ của thanh công cụ trong trang.
 import { describe, it, expect, vi, beforeEach } from 'vitest';
 import { createToolbox } from '../../src/engine/gpu/toolbox.js';
 
@@ -153,6 +153,23 @@ describe('createToolbox', () => {
     warn.mockRestore();
   });
 
+  it('thứ tự Tab (GĐ 5): chưa có thanh lớp thì thanh công cụ gắn cuối body; "Dựng lại cảnh" khi đã có thì gắn NGAY SAU thanh lớp, trước Sổ tay', () => {
+    const first = createToolbox({ tools: [fakeTool('kinh')], views: fakeViews(), doc: document, t, content });
+    expect(document.body.lastElementChild.hasAttribute('data-toolbar')).toBe(true);
+    // Thanh lớp và Sổ tay của ui/workshop.js sống qua các lần dựng lại (đang đóng hay mở thì thứ tự vẫn thế); cảnh cũ bị gỡ.
+    const panel = (attr) => {
+      const el = document.createElement('div');
+      el.setAttribute(attr, '');
+      el.hidden = true;
+      return el;
+    };
+    document.body.append(panel('data-rail'), panel('data-notebook'), document.createElement('aside'));
+    first.dispose();
+    createToolbox({ tools: [fakeTool('kinh')], views: fakeViews(), doc: document, t, content });
+    const names = [...document.body.children].map((el) => ['rail', 'toolbar', 'notebook'].find((a) => el.hasAttribute(`data-${a}`)) ?? el.localName);
+    expect(names).toEqual(['rail', 'toolbar', 'notebook', 'aside']);
+  });
+
   it('không có công cụ nào: không đụng tới DOM; dispose gỡ công cụ, thanh công cụ và body[data-tool]', () => {
     const empty = createToolbox({ tools: [], views: fakeViews() });
     expect(empty.list()).toEqual([]);
```
Áp vào `tests/unit/workshop.test.js`:

```diff
diff --git a/tests/unit/workshop.test.js b/tests/unit/workshop.test.js
index d84f223..1155096 100644
--- a/tests/unit/workshop.test.js
+++ b/tests/unit/workshop.test.js
@@ -1,7 +1,8 @@
 // @vitest-environment jsdom
-// tests/unit/workshop.test.js — thanh lớp + Sổ tay + chế độ mài, chạy trên một bàn thợ giả (không three).
+// tests/unit/workshop.test.js — thanh lớp + Sổ tay + chế độ mài, chạy trên một bàn thợ giả (không three); chỗ của chúng trong trang.
 import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
 import { mountWorkshop } from '../../src/ui/workshop.js';
+import { createToolbox } from '../../src/engine/gpu/toolbox.js';
 import t from '../../src/ui/strings.vi.js';
 
 const meta = {
@@ -180,6 +181,52 @@ describe('chế độ mài', () => {
   });
 });
 
+describe('thứ tự trong trang (GĐ 5, WCAG 2.4.3: Tab đi theo thứ tự DOM)', () => {
+  /** Các con của body theo thứ tự DOM: tấm cố định gọi theo tên, phần tử khác theo thẻ. */
+  const order = () => [...document.body.children].map((el) => ['rail', 'toolbar', 'notebook'].find((a) => el.hasAttribute(`data-${a}`)) ?? el.localName);
+  /** Hộp đồ nghề thật (engine/gpu/toolbox.js) với một công cụ giả: như scene.js dựng mỗi lần mở trang hay "Dựng lại cảnh". */
+  const scene = () => createToolbox({
+    tools: [{
+      id: 'kinh-mai',
+      mount: ({ el }) => {
+        el.append(document.createElement('button'));
+        return { dispose() {} };
+      },
+    }],
+    views: { list: () => [], require: async () => {}, setOverlays: () => [] },
+    doc: document,
+  });
+
+  it('Sổ tay mở lần đầu khi cảnh đã có thanh công cụ: thanh lớp ngay trước nó, Sổ tay ngay sau (đi hết thanh lớp là Tab vào bảng)', () => {
+    const bar = document.createElement('div');
+    bar.setAttribute('data-toolbar', '');
+    document.body.append(document.createElement('main'), bar, document.createElement('aside'));
+    const { workshop } = mount(fakeStudio());
+    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook', 'aside']);
+    workshop.dispose();
+  });
+
+  it('chưa có thanh công cụ (tầng tĩnh, hay bức không có công cụ nào): thanh lớp rồi Sổ tay ở cuối body', () => {
+    document.body.append(document.createElement('main'));
+    const { workshop } = mount(null);
+    expect(order()).toEqual(['main', 'rail', 'notebook']);
+    workshop.dispose();
+  });
+
+  it('cả vòng đời: mở trang (thanh công cụ) → mở Sổ tay → "Dựng lại cảnh" (thanh công cụ mới): luôn thanh lớp → thanh công cụ → Sổ tay', () => {
+    document.body.append(document.createElement('main'));
+    const first = scene();
+    const { workshop } = mount(fakeStudio());
+    workshop.open({ grind: true });
+    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook']);
+    first.dispose(); // mất GPU: cảnh cũ bị gỡ, thanh lớp và Sổ tay ở lại
+    expect(order()).toEqual(['main', 'rail', 'notebook']);
+    scene();
+    expect(order()).toEqual(['main', 'rail', 'toolbar', 'notebook']);
+    workshop.dispose();
+  });
+});
+
 describe('Sổ tay', () => {
   it('Hiểu: thơ riêng của lớp, chữ, sơ đồ SVG, bạn vừa học, đọc thêm (mở tab mới, noopener)', () => {
     const { workshop, rail, notebook } = mount(fakeStudio());
```
Áp vào `tests/paintings/html.test.js`:

```diff
diff --git a/tests/paintings/html.test.js b/tests/paintings/html.test.js
index 3351d5a..b270fa0 100644
--- a/tests/paintings/html.test.js
+++ b/tests/paintings/html.test.js
@@ -127,7 +127,7 @@ for (const { meta, page, lang } of paintings) {
 }
 
 describe('styles/tools.css (GĐ 4)', () => {
-  it('thanh công cụ nằm DƯỚI thanh lớp và Sổ tay (z-index nhỏ hơn hẳn): sau "Dựng lại cảnh", thanh công cụ mới được gắn sau chúng trong DOM, tay nắm gạt không được đè lên', () => {
+  it('thanh công cụ nằm DƯỚI thanh lớp và Sổ tay (z-index nhỏ hơn hẳn): nó đứng ngay sau thanh lớp trong DOM (thứ tự Tab, GĐ 5), bằng z-index thì nó và tay nắm gạt (cao cả khung) đè lên thanh lớp', () => {
     const zIndex = (file, selector) => {
       const css = readFileSync(ROOT + file, 'utf8');
       const rule = css.match(new RegExp(`(?:^|\\n)${selector}\\s*\\{([^}]*)\\}`));
```

Run: `npx vitest run tests/unit/shell-css.test.js tests/unit/toolbox.test.js tests/unit/workshop.test.js tests/paintings/html.test.js`
Kết quả mong đợi: FAIL, 6 test hỏng; lỗi đầu tiên: `AssertionError: expected '' to match /--rail-w: 224px/`.

- [ ] **Step 2: Code**

Áp vào `src/styles/notebook.css`:

```diff
diff --git a/src/styles/notebook.css b/src/styles/notebook.css
index 3020eb9..f64c96d 100644
--- a/src/styles/notebook.css
+++ b/src/styles/notebook.css
@@ -1,5 +1,11 @@
 /* styles/notebook.css — thanh lớp, Sổ tay (ba tab), núm Tweakpane và code sống; màu từ bảng sơn mài (tokens.css). */
 
+/* Bề rộng của thanh lớp và Sổ tay trên máy tính. tools.css đọc lại hai biến này để bảng công cụ không bao giờ nằm dưới chúng. */
+:root {
+  --rail-w: 224px;
+  --notebook-w: min(440px, calc(100vw - 300px));
+}
+
 /* ── Khung chung của thanh lớp và Sổ tay: tấm sơn đen then mờ, viền vàng lá ─────────────── */
 .rail,
 .notebook {
@@ -31,7 +37,7 @@ body:is([data-state='lost'], [data-state='loading'], [data-state='compiling'], [
   display: flex;
   flex-direction: column;
   gap: 10px;
-  width: 224px;
+  width: var(--rail-w);
   max-height: calc(100vh - 2 * var(--gutter));
   padding: 14px 14px 12px;
   overflow: auto;
@@ -136,7 +142,7 @@ body:is([data-state='lost'], [data-state='loading'], [data-state='compiling'], [
   bottom: var(--gutter);
   display: flex;
   flex-direction: column;
-  width: min(440px, calc(100vw - 300px));
+  width: var(--notebook-w);
   overflow: hidden;
 }
 .nb-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px 16px 8px 20px; }
```
Áp vào `src/styles/tools.css`:

```diff
diff --git a/src/styles/tools.css b/src/styles/tools.css
index 9f4959b..ba56c59 100644
--- a/src/styles/tools.css
+++ b/src/styles/tools.css
@@ -1,12 +1,12 @@
 /* styles/tools.css — mục Đồ nghề và thanh giờ trong thanh lớp; thanh điều khiển của công cụ học và tay nắm gạt; màu từ bảng sơn mài. */
 
-/* Thanh công cụ: máy tính ở giữa đáy tranh, điện thoại ngay trên dải thanh lớp.
-   KHÔNG đặt transform hay backdrop-filter lên .toolbar và .tool: cả hai tạo containing block cho con position: fixed,
-   và tay nắm gạt (con của .tool) phải đo theo cả khung nhìn. Nền mờ đặt ở .tool-panel. */
+/* Thanh công cụ: máy tính ở đáy tranh (xưởng mở thì giữa thanh lớp và Sổ tay, xem cuối file), điện thoại ngay trên dải thanh lớp.
+   KHÔNG đặt transform, filter hay backdrop-filter lên .toolbar và .tool: các thuộc tính đó tạo containing block cho con
+   position: fixed, và tay nắm gạt (con của .tool) phải đo theo cả khung nhìn. Nền mờ đặt ở .tool-panel. */
 .toolbar {
   position: fixed;
-  /* Dưới thanh lớp và Sổ tay (z-index 2), trên tranh và lớp chữ. Bằng nhau thì thứ tự DOM quyết định: "Dựng lại cảnh" gắn
-     thanh công cụ mới SAU thanh lớp, và tay nắm gạt (cao cả khung) sẽ đè lên thanh lớp, Sổ tay. */
+  /* Dưới thanh lớp và Sổ tay (z-index 2), trên tranh và lớp chữ. Trong trang nó đứng ngay sau thanh lớp (thứ tự Tab, GĐ 5), nên
+     bằng z-index thì nó và tay nắm gạt (cao cả khung) sẽ vẽ đè lên thanh lớp. */
   z-index: 1;
   left: 0;
   right: 0;
@@ -15,6 +15,9 @@
   justify-content: center;
   pointer-events: none; /* chỗ trống hai bên thanh vẫn là của canvas */
 }
+/* Bảng nằm trong ô của công cụ (.tool), mà ô là phần tử flex của thanh: thanh hẹp hơn bảng thì ô co lại (tới bề rộng tối thiểu
+   của nội dung) và bảng co theo. Đừng thêm phần trăm vào max-width dưới đây: lúc tính bề rộng nội dung của ô, phần trăm "vòng"
+   làm trình duyệt bỏ qua cả max-width, kể cả 560px; ô rộng theo dòng chữ dài nhất và bảng lệch khỏi giữa. */
 .tool-panel {
   max-width: min(560px, calc(100vw - 2 * var(--gutter)));
   padding: 10px 12px;
@@ -116,11 +119,10 @@
 /* Công cụ đang bật: thơ và con dấu ở chân tranh nhường chỗ cho thanh điều khiển (tắt công cụ thì hiện lại). */
 body[data-tool] .foot { visibility: hidden; }
 
-/* Điện thoại: thanh công cụ ngay trên dải thanh lớp (68px); Sổ tay thu lại khi một công cụ bật, để chừa chỗ nhìn cảnh. */
+/* Điện thoại: thanh công cụ ngay trên dải thanh lớp (68px). */
 @media (max-width: 640px) {
   .toolbar { bottom: 76px; padding: 0 8px; }
-  .tool-panel { max-width: 100%; }
-  body[data-tool] .notebook { display: none; }
+  .tool-panel { max-width: 100%; } /* chỉ phần trăm, không có trần 560px: bảng không lệch như lời dặn ở .tool-panel */
   /* Dải thanh lớp: Đồ nghề nằm cùng hàng, chỉ còn nút công cụ và nút nhỏ "◷ 21:00". Ô trượt mở ra ngay trên dải: nó đặt
      theo khung nhìn (position: fixed), nên dải thanh lớp không được có backdrop-filter (thuộc tính đó biến dải thành khối
      chứa của con fixed, và dải cuộn ngang thì cắt mất ô trượt). */
@@ -151,3 +153,23 @@ body[data-tool] .foot { visibility: hidden; }
   }
   .rail-dials:not([data-open]) { display: none; }
 }
+
+/* ── Xưởng mở (GĐ 5): bảng công cụ không bao giờ nằm dưới thanh lớp hay Sổ tay ─────────────────────────────────────────
+   Máy tính: bảng bắt đầu sau thanh lớp, cách một khe 16px. Thanh công cụ đứng ngay sau thanh lớp trong trang (thứ tự Tab), nên
+   "~" đọc được thanh lớp đang mở hay đóng mà không cần :has(), thứ trình duyệt cũ ở tầng WebGL2 có thể chưa có. Xưởng đóng
+   (thanh lớp hidden) thì bảng ở giữa cả khung như trước. Điện thoại: bảng trải cả bề ngang, ngay trên dải thanh lớp.
+   Bề rộng CSS có thể lẻ (zoom trình duyệt: cửa sổ 1549px ở 125% là 1239.2px), nên giữa hai ngưỡng không được hở: luật máy tính
+   là mặc định cho điện thoại đè lên, và Sổ tay thu lại tới 1239.98px chứ không phải 1239px. */
+.rail:not([hidden]) ~ .toolbar { left: calc(var(--gutter) + var(--rail-w) + 16px); right: var(--gutter); }
+@media (max-width: 640px) { .rail:not([hidden]) ~ .toolbar { left: 0; right: 0; } }
+/* Đủ chỗ: bảng vào khoảng trống giữa thanh lớp và Sổ tay, kể cả khi người xem đóng Sổ tay (bảng không nhảy chỗ). Ngưỡng 1240px =
+   2 lề 32px + thanh lớp 224px + Sổ tay 440px + 2 khe 16px + 480px, bề rộng hẹp nhất mà bảng còn dùng được (thanh, số đếm và
+   "Dệt lại" của Từng sợi trên một hàng). Đổi một con số thì tính lại ngưỡng: tests/unit/shell-css.test.js tính lại nó. */
+@media (min-width: 1240px) {
+  .rail:not([hidden]) ~ .toolbar { right: calc(var(--gutter) + var(--notebook-w) + 16px); }
+}
+/* Hẹp hơn (máy tính hẹp, điện thoại): Sổ tay thu lại khi một công cụ bật, để bảng có chỗ và người xem thấy cảnh; tắt công cụ
+   thì Sổ tay hiện lại. */
+@media (max-width: 1239.98px) {
+  body[data-tool] .notebook { display: none; }
+}
```
Áp vào `src/engine/gpu/toolbox.js`:

```diff
diff --git a/src/engine/gpu/toolbox.js b/src/engine/gpu/toolbox.js
index f9d4a5c..dd460ff 100644
--- a/src/engine/gpu/toolbox.js
+++ b/src/engine/gpu/toolbox.js
@@ -5,10 +5,12 @@ import { h } from '../../ui/dom.js';
  * Công cụ học (spec §7) chạy trên MỌI bức, vì chỉ nhìn các view mà xưởng liệt kê (views.js). Hộp đồ nghề:
  * - gắn từng công cụ (`mount(api)`), cho nó một ô trong thanh công cụ ([data-toolbar]) để dựng thanh điều khiển;
  * - ghép overlay của mọi công cụ lên ảnh cuối MỘT lần; công cụ nào gắn hay ghép hỏng thì bỏ nó, cảnh vẫn chạy (spec §9);
- * - bật MỘT công cụ mỗi lúc: bật cái này thì cái kia tắt; body[data-tool] cho CSS (điện thoại: Sổ tay thu lại);
+ * - bật MỘT công cụ mỗi lúc: bật cái này thì cái kia tắt; body[data-tool] cho CSS (khung hẹp: Sổ tay thu lại);
  * - cử chỉ tới công cụ đang bật TRƯỚC bức; công cụ trả true thì cử chỉ dừng ở đó;
  * - (GĐ 5) đưa móc lần vẽ của cảnh (draws.js) cho công cụ qua api.draws, chỉ năm hàm của DrawProbe: công cụ tự start() khi
- *   bật, stop() khi tắt.
+ *   bật, stop() khi tắt;
+ * - (GĐ 5) đặt thanh công cụ ngay sau thanh lớp trong trang: Tab từ nút công cụ trên thanh lớp đi qua phần còn lại của thanh
+ *   lớp rồi vào bảng của nó, không vòng về đầu trang.
  * Bức không biết có công cụ nào: nó chỉ nhận những cử chỉ không công cụ nào dùng.
  *
  * @param {object} p
@@ -62,7 +64,13 @@ export function createToolbox({ tools, views, doc, t = {}, content = null, redra
   }
   const overlays = mounted.filter((m) => m.instance.overlay).map((m) => ({ id: m.id, fn: (c, view) => m.instance.overlay(c, view) }));
   for (const id of views.setOverlays(overlays)) remove(id);
-  if (bar && mounted.length > 0) doc.body.append(bar);
+  if (bar && mounted.length > 0) {
+    // Thứ tự Tab theo thứ tự DOM (WCAG 2.4.3): thanh công cụ đứng NGAY SAU thanh lớp, nơi có nút bật nó, và trước Sổ tay.
+    // "Dựng lại cảnh" dựng thanh mới khi thanh lớp đã có; lần mở trang thì chưa: ui/workshop.js đặt thanh lớp ngay trước thanh này.
+    const rail = doc.querySelector('[data-rail]');
+    if (rail) rail.after(bar);
+    else doc.body.append(bar);
+  }
 
   const find = (id) => mounted.find((m) => m.id === id) ?? null;
```
Áp vào `src/ui/workshop.js`:

```diff
diff --git a/src/ui/workshop.js b/src/ui/workshop.js
index 451a92e..10f5b3b 100644
--- a/src/ui/workshop.js
+++ b/src/ui/workshop.js
@@ -54,7 +54,14 @@ export function mountWorkshop(doc, { meta, content, t, studio = () => null, onCl
     },
     tools: tools?.el ?? null,
   });
-  doc.body.append(rail.el, notebook.el);
+  // Thứ tự Tab theo thứ tự DOM (WCAG 2.4.3): thanh lớp → thanh công cụ → Sổ tay. Đi hết thanh lớp là Tab vào bảng công cụ.
+  // Cảnh dựng thanh công cụ trước khi xưởng mở lần đầu, nên hai tấm của xưởng đứng hai bên nó; "Dựng lại cảnh" thì
+  // engine/gpu/toolbox.js gắn thanh mới ngay sau thanh lớp. Trên màn hình, z-index giữ thanh công cụ dưới hai tấm (tools.css).
+  const toolbar = doc.querySelector('[data-toolbar]');
+  if (toolbar) {
+    toolbar.before(rail.el);
+    toolbar.after(notebook.el);
+  } else doc.body.append(rail.el, notebook.el);
 
   /** Vẽ lại thanh lớp theo bàn thợ: vạch trọng số chạy theo tween, công tắc theo đích, nút "tiếp theo". */
   const sync = () => {
```

Run: `npx vitest run tests/unit/shell-css.test.js tests/unit/toolbox.test.js tests/unit/workshop.test.js tests/paintings/html.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: e2e**

Áp vào `e2e/painting.spec.js`:

```diff
diff --git a/e2e/painting.spec.js b/e2e/painting.spec.js
index 8a436a1..6956c5b 100644
--- a/e2e/painting.spec.js
+++ b/e2e/painting.spec.js
@@ -212,6 +212,8 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       const weights = await page.evaluate(() => window.__sma.layers());
       expect(weights.find((l) => l.id === second).weight, 'restore(snapshot) phải đem trọng số cũ về').toBe(0);
       await expect(page.locator('[data-hint] button'), 'thanh lớp đang đóng thì dựng lại xong phải mời lại').toBeVisible();
+      // Thanh công cụ của cảnh mới đứng ngay sau thanh lớp (GĐ 5, thứ tự Tab): đi hết thanh lớp là Tab vào bảng của nó.
+      await expect(page.locator('[data-rail] + [data-toolbar]')).toHaveCount(1);
       await lose();
       await page.waitForFunction(() => window.__sma.state === 'static');
       sma = await readSma(page);
@@ -399,6 +401,113 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       expect(log.errors).toEqual([]);
     });
 
+    /** Khung của phần tử trên trang (px CSS). */
+    const rectOf = (locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON());
+    /** Hai khung chồng lên nhau (chỉ chạm cạnh thì không). */
+    const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
+    /** 'ok' khi nút nằm trọn trong khung nhìn và điểm giữa nó là chính nó (không tấm nào đè lên); không thì nói vì sao. */
+    const hitTest = (locator) => locator.evaluate((el) => {
+      const r = el.getBoundingClientRect();
+      if (r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight) return `ra ngoài khung nhìn: ${JSON.stringify(r)}`;
+      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
+      return hit === el || el.contains(hit) ? 'ok' : `bị đè: ${hit?.outerHTML.slice(0, 80)}`;
+    });
+    /** Bật Từng sợi bằng nút của nó trên thanh lớp và chờ danh sách lần vẽ (tới lúc đó "Dệt lại" còn khóa, dòng chữ còn trống). */
+    async function weave(page) {
+      await page.locator('[data-rail] [data-tool="tung-soi"]').click();
+      const slot = page.locator('[data-tool-slot="tung-soi"]');
+      await expect.poll(async () => Number(await slot.locator('#tung-soi-range').getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
+      return slot;
+    }
+
+    test('máy tính 1280×800 (GĐ 5): xưởng mở, bảng công cụ ở giữa khoảng trống giữa thanh lớp và Sổ tay, không chồng lên tấm nào; "Dệt lại" và các nút của Kính mài bấm trúng được', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(180_000);
+      await page.setViewportSize({ width: 1280, height: 800 });
+      await still(page, testInfo);
+      const box = await page.locator('[data-stage] canvas').boundingBox();
+      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
+      await page.locator('[data-hint] button').click();
+      const rail = page.locator('[data-rail]');
+      const notebook = page.locator('[data-notebook]');
+      await expect(notebook).toBeVisible();
+      /** Bảng của công cụ `id` ở giữa khoảng trống giữa thanh lớp và Sổ tay, không chồng lên tấm nào; Sổ tay vẫn mở (đủ chỗ). */
+      const besideBoth = async (id) => {
+        await expect(page.locator('body')).toHaveAttribute('data-tool', id);
+        await expect(notebook, `${id}: đủ chỗ thì Sổ tay vẫn mở`).toBeVisible();
+        const panel = await rectOf(page.locator(`[data-tool-slot="${id}"] .tool-panel`));
+        const [left, right] = [await rectOf(rail), await rectOf(notebook)];
+        const where = `${id}: bảng ${panel.left}–${panel.right}, thanh lớp tới ${left.right}, Sổ tay từ ${right.left}`;
+        expect(overlap(panel, right), `${where}: chồng lên Sổ tay`).toBe(false);
+        expect(overlap(panel, left), `${where}: chồng lên thanh lớp`).toBe(false);
+        expect(Math.abs((panel.left + panel.right) / 2 - (left.right + right.left) / 2), `${where}: lệch khỏi giữa`).toBeLessThanOrEqual(1);
+      };
+      /**
+       * "Dệt lại" của Từng sợi bấm trúng; `oneRow` thì thanh, số đếm và "Dệt lại" còn trên cùng một hàng. Một hàng chỉ kiểm ở
+       * 1280px: ở ngưỡng 1240px hàng chỉ dư chừng 4px (450 trong 454px, chữ của macOS), mà trên Ubuntu của CI chữ dựng khác
+       * (hinting) có thể rộng thêm vài px làm hàng xuống dòng, trong khi bảng vẫn dùng được.
+       */
+      const usable = async (slot, { oneRow = false } = {}) => {
+        if (oneRow) {
+          const middles = await slot.locator('.tool-row > :is(input, output, button)')
+            .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => r.top + r.height / 2));
+          expect(Math.max(...middles) - Math.min(...middles), `hàng của Từng sợi xuống dòng: ${middles.join(', ')}`).toBeLessThanOrEqual(2);
+        }
+        expect(await hitTest(slot.getByRole('button', { name: t.tools['tung-soi'].play })), '"Dệt lại"').toBe('ok');
+      };
+      let slot = await weave(page);
+      await besideBoth('tung-soi');
+      await usable(slot, { oneRow: true });
+      await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
+      await besideBoth('kinh-mai');
+      for (const chip of await page.locator('[data-tool-slot="kinh-mai"] .tool-panel button').all()) {
+        expect(await hitTest(chip), `nút "${await chip.textContent()}" của Kính mài`).toBe('ok');
+      }
+      await page.locator('[data-rail] [data-tool="lot-lop"]').click();
+      await besideBoth('lot-lop');
+      expect(await hitTest(page.locator('[data-tool-slot="lot-lop"] input[type="range"]')), 'thanh của Lột lớp').toBe('ok');
+      // Ngưỡng của tools.css (1240px): Sổ tay vẫn mở, bảng không chồng lên tấm nào và "Dệt lại" vẫn bấm trúng.
+      await page.setViewportSize({ width: 1240, height: 800 });
+      slot = await weave(page);
+      await besideBoth('tung-soi');
+      await usable(slot);
+      // Khoảng trống rộng hơn bảng (1440px: 680px cho bảng 560px): bảng vẫn ở giữa, dù dòng chữ của Từng sợi dài hơn 560px.
+      await page.setViewportSize({ width: 1440, height: 900 });
+      await besideBoth('tung-soi');
+      // Xưởng đóng (thanh lớp hidden): bảng về giữa cả khung như trước. Đóng thanh lớp thì công cụ tắt, nên bật lại qua __sma.
+      await rail.locator('.rail-close').click();
+      await page.evaluate(() => window.__sma.setTool('tung-soi'));
+      const alone = await rectOf(slot.locator('.tool-panel'));
+      expect(Math.abs((alone.left + alone.right) / 2 - 720), `bảng ${alone.left}–${alone.right} phải ở giữa khung 1440px`).toBeLessThanOrEqual(1);
+      expect(log.errors).toEqual([]);
+    });
+
+    test('máy tính hẹp 1024×768 (GĐ 5): không đủ chỗ giữa thanh lớp và Sổ tay, nên bật công cụ thì Sổ tay thu lại, tắt thì hiện lại; bảng không chồng lên thanh lớp', async ({
+      page,
+    }, testInfo) => {
+      test.setTimeout(120_000);
+      await page.setViewportSize({ width: 1024, height: 768 });
+      await still(page, testInfo);
+      const box = await page.locator('[data-stage] canvas').boundingBox();
+      await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8); // lần chạm đầu → lời mời
+      await page.locator('[data-hint] button').click();
+      const notebook = page.locator('[data-notebook]');
+      await expect(notebook).toBeVisible();
+      const slot = await weave(page);
+      await expect(notebook, 'Sổ tay phải thu lại để bảng có chỗ').toBeHidden();
+      const panel = await rectOf(slot.locator('.tool-panel'));
+      const bar = await rectOf(page.locator('[data-toolbar]')); // khoảng trống dành cho bảng: từ sau thanh lớp tới lề phải
+      const where = `bảng ${panel.left}–${panel.right}, thanh công cụ ${bar.left}–${bar.right}`;
+      expect(overlap(panel, await rectOf(page.locator('[data-rail]'))), `${where}: chồng lên thanh lớp`).toBe(false);
+      expect(Math.abs((panel.left + panel.right) / 2 - (bar.left + bar.right) / 2), `${where}: lệch khỏi giữa`).toBeLessThanOrEqual(1);
+      expect(await hitTest(slot.getByRole('button', { name: t.tools['tung-soi'].play })), '"Dệt lại"').toBe('ok');
+      await page.locator('[data-rail] [data-tool="tung-soi"]').click();
+      await expect(notebook).toBeVisible();
+      await expect(page.locator('[data-toolbar]')).toBeHidden();
+      expect(log.errors).toEqual([]);
+    });
+
     test('Lột lớp (GĐ 4): mỗi nấc cho ảnh khác nấc kề bên; về nấc cuối (bên phải) thì đúng ảnh cũ', async ({ page }, testInfo) => {
       test.setTimeout(180_000);
       await still(page, testInfo);
```
Áp vào `e2e/a11y.spec.js`:

```diff
diff --git a/e2e/a11y.spec.js b/e2e/a11y.spec.js
index 568fabd..babbf25 100644
--- a/e2e/a11y.spec.js
+++ b/e2e/a11y.spec.js
@@ -98,7 +98,7 @@ for (const { meta, page: htmlPage } of paintings) {
         expect(log.errors).toEqual([]);
       });
 
-      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay; thanh và nút của Từng sợi', async ({
+      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay; từ nút Từng sợi, Tab qua phần còn lại của thanh lớp rồi tới thanh và nút của nó (khung hẹp, máy tính)', async ({
         page,
       }, testInfo) => {
         test.setTimeout(120_000);
@@ -150,22 +150,42 @@ for (const { meta, page: htmlPage } of paintings) {
         await page.keyboard.press('Escape');
         await expect(page.locator('[data-notebook]')).toBeHidden();
         await expect(page.locator('[data-rail]')).toBeVisible();
-        // Từng sợi (GĐ 5): Enter trên nút Đồ nghề bật công cụ, rồi Tab đi tới thanh và nút "Dệt lại" của nó. Thanh công cụ đứng
-        // TRƯỚC thanh lớp trong trang, nên Tab đi hết thanh lớp, vòng về đầu trang rồi mới tới (chừng bảy lần Tab). "Dệt lại" bị
-        // khóa tới khi có danh sách lần vẽ, mà Tab bỏ qua nút bị khóa: chờ danh sách trước khi đi.
-        await page.locator('[data-rail] [data-tool="tung-soi"]').focus();
+        // Từng sợi (GĐ 5): Enter trên nút Đồ nghề bật công cụ. Thanh công cụ đứng ngay sau thanh lớp trong trang, nên Tab đi qua
+        // phần còn lại của thanh lớp rồi vào thẳng thanh và nút "Dệt lại" (WCAG 2.4.3): không vòng về đầu trang, không qua Sổ tay.
+        // "Dệt lại" bị khóa tới khi có danh sách lần vẽ, mà Tab bỏ qua nút bị khóa: chờ danh sách trước khi đi.
+        const weave = page.locator('[data-rail] [data-tool="tung-soi"]');
+        await weave.focus();
         await page.keyboard.press('Enter');
         await expect(page.locator('body')).toHaveAttribute('data-tool', 'tung-soi');
         const range = page.locator('#tung-soi-range');
         await expect.poll(async () => Number(await range.getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
-        const stops = new Set();
-        for (let i = 0; i < 40 && !(stops.has('input@tool:range') && stops.has('button@tool')); i += 1) {
-          await page.keyboard.press('Tab');
-          stops.add(await focused());
-        }
-        const toolWalk = [...stops].join(', ');
-        expect(toolWalk, 'thanh của Từng sợi').toContain('input@tool:range');
-        expect(toolWalk, 'nút "Dệt lại" của Từng sợi').toContain('button@tool');
+        /** Các điểm dừng của n lần Tab, tính từ nút Từng sợi trên thanh lớp. */
+        const tabsFromWeave = async (n) => {
+          await weave.focus();
+          const stops = [];
+          for (let i = 0; i < n; i += 1) {
+            await page.keyboard.press('Tab');
+            stops.push(await focused());
+          }
+          return stops;
+        };
+        // Phần còn lại của thanh lớp sau nút Từng sợi: nút Đồ nghề đứng sau nó (nếu có), thanh giờ, "Phủ lớp tiếp theo" (chế độ
+        // mài: các lớp còn ở 0), nút đóng × (đứng đầu thanh trên máy tính nhưng cuối thanh trong trang).
+        const tools = (await page.evaluate(() => window.__sma.tools())).map((x) => x.id);
+        const laterTools = tools.slice(tools.indexOf('tung-soi') + 1).map((id) => `button@rail:${id}`);
+        const next = (await page.locator('[data-rail] .rail-next').isVisible()) ? ['button@rail'] : [];
+        const toolStops = ['input@tool:range', 'button@tool'];
+        // Khung hẹp (640px, như điện thoại): thanh giờ ở sau nút nhỏ "◷ 21:00", ô trượt đã mở ở lượt đi trên; Sổ tay thu lại.
+        if (dials.length > 0) await expect(page.locator('[data-rail] .dial-chip')).toHaveAttribute('aria-expanded', 'true');
+        const narrowDials = dials.length > 0 ? ['button@rail:chip', ...dials.map(() => 'input@rail:range')] : [];
+        const narrow = [...laterTools, ...narrowDials, ...next, 'button@rail', ...toolStops];
+        expect(await tabsFromWeave(narrow.length), 'khung hẹp: từ nút Từng sợi tới bảng của nó').toEqual(narrow);
+        // Máy tính: thanh giờ nằm thẳng trong thanh lớp, và Sổ tay (mở lại, đủ chỗ ở 1280px) đứng SAU bảng công cụ.
+        await page.setViewportSize({ width: 1280, height: 800 });
+        await page.locator(`[data-rail] [data-layer="${meta.layers[0].id}"] .rail-name`).click();
+        await expect(page.locator('[data-notebook]')).toBeVisible();
+        const wide = [...laterTools, ...dials.map(() => 'input@rail:range'), ...next, 'button@rail', ...toolStops, 'button@nb'];
+        expect(await tabsFromWeave(wide.length), 'máy tính: từ nút Từng sợi tới bảng của nó, rồi Sổ tay').toEqual(wide);
         // Mũi tên trên thanh đổi sợi đang xem; trình đọc màn hình nghe qua aria-valuetext.
         await range.focus();
         const valuetext = await range.getAttribute('aria-valuetext');
```

```bash
pkill -f "vite preview --port 4273" || true
npm run build
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
npx playwright test --project=static --project=webgl2-swiftshader
```
Kết quả mong đợi: GPU thật 33 passed (7 skipped); `static` + `webgl2-swiftshader` 39 passed (6 + 33). Trên bản build của Task 15 (chưa có code của task này), hai test mới và test bàn phím đã sửa đều đỏ trên GPU thật:
- 1280: `tung-soi: bảng 360–920, thanh lớp tới 256, Sổ tay từ 808: chồng lên Sổ tay`;
- 1024: `Sổ tay phải thu lại để bảng có chỗ` (`Expected: hidden`, `Received: visible`);
- bàn phím, khung hẹp: sau bốn điểm dừng của thanh lớp, Tab tới `body:tung-soi` rồi `button`, thay vì `input@tool:range` rồi `button@tool`.

- [ ] **Step 4: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  851 passed`.

```bash
git add e2e/a11y.spec.js e2e/painting.spec.js src/engine/gpu/toolbox.js src/styles/notebook.css src/styles/tools.css src/ui/workshop.js tests/paintings/html.test.js tests/unit/shell-css.test.js tests/unit/toolbox.test.js tests/unit/workshop.test.js
git commit -F - <<'EOF'
fix(ui): bảng công cụ không còn nằm dưới Sổ tay (máy tính: vào khoảng trống giữa thanh lớp và Sổ tay; màn hẹp thì Sổ tay thu lại); thanh công cụ đứng ngay sau thanh lớp trong thứ tự Tab

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 17: "Dựng lại cảnh" quá hạn không đụng tới trang đã về tĩnh (`run.js`); bộ test đầu tiên cho `run()`

**Mục tiêu:** Spec §9 (bảng lỗi: mất GPU, quá hạn), §8.5 ("Dựng lại cảnh": renderer và canvas mới, `restore(snapshot)`). Lỗi này có từ GĐ 2 và được tìm ra lúc dựng thử GĐ 5. Bao chọn sửa luôn trong GĐ 5.

**Lỗi.** Sau lần mất GPU đầu tiên, người xem bấm "Dựng lại cảnh":
- `rebuild(snapshot)` chạy `newStage(d)` rồi `bringUp(stage, d, snapshot)` trong hạn 10 giây của `run.js`; quá hạn thì `catch` đóng disposer `d` rồi gọi `fail('timeout')`; thứ gì tới muộn mà gắn vào `d` thì bị gỡ ngay (disposer đã đóng thì `add()` chạy hàm gỡ liền), còn `onLate` gọi `d.closeAll()` lần nữa nhưng không còn gì để gỡ.
- Boot đưa trang về tầng tĩnh, nhưng chỉ khóa vỏ trang khi chính lần MỞ TRANG quá hạn hay hỏng. Hạn của "Dựng lại cảnh" là của `run.js`.
- Hạn mà tới đúng lúc `bringUp` đang chờ `scene.studio.restore(snapshot)`, thì khi `restore` xong, `bringUp` vẫn chạy tiếp: `shell.setState('compiling')` đặt `data-state` về `compiling` trên trang đã về tĩnh, rồi `compile()` chạy trên một renderer đã bị gỡ.
- Cũng vậy nếu hạn tới lúc `createStage` còn dở: `bringUp` bắt đầu với disposer đã đóng, vẫn gọi `buildScene`, `sma.set` và `setState('compiling')`.

**Sửa.**
- `gone()` (trang đã tĩnh hay disposer đã đóng thì `d.closeAll()` rồi trả `true`) được dời lên đầu `bringUp` và kiểm ở bốn chỗ:
  - trước việc đầu tiên (`stage.onLost`, `stage.onError`, `buildScene`, `sma.set`);
  - ngay sau `restore(snapshot)`;
  - sau `compile()` như cũ;
  - sau `crossfade()` như cũ.

  Ở mọi trường hợp mà phép kiểm mới thoát sớm, code cũ rốt cuộc cũng `return false`: bản sửa chỉ bỏ các việc thừa và sai. Đường bình thường không đổi.
- `run()` bỏ phép kiểm `stopped()` của riêng nó trước lần `bringUp` đầu: phép kiểm ở đầu `bringUp` làm đúng việc đó (lần mở trang mà boot đã hết hạn thì `gone()` dọn rồi `run()` trả handle).
- Cùng loại lỗi, có từ GĐ 1: `onLost` và `onError` chỉ xét `failed`. Boot hết hạn 10 giây lúc phần 3D còn dựng, rồi GPU mất hay báo lỗi, thì `fail()` chạy `showStatic` lần hai và lý do đổi từ `timeout` thành `device-lost`. Giờ cả hai bỏ qua sự kiện khi `stopped()`.
- `run.js` còn 248 dòng.

**Bộ test (`tests/unit/run.test.js`, jsdom, 9 test).** Trước GĐ 5, `run()` chỉ có e2e giữ.
- `vi.mock` thay `stage.js`, `scene.js` (mỗi test đặt `mockImplementation`), `tools/index.js` (không công cụ), `debug.js`, `ui/workshop.js`. `deadline`, `disposer`, `guards`, `clock`, `palette` và `studioApi` là thật.
- Vỏ trang giả và `__sma` giả ghi mọi lời gọi vào một nhật ký theo thứ tự, cùng các bước dựng của sân khấu và cảnh. `page.hold(bước)` giữ một bước (`createStage`, `restore`, `compile`, `crossfade`) tới khi test thả. Boot hết hạn thì đặt `sma.state = 'static'` như `showStatic`.
- Các test:
  1. mở trang qua `compiling` → `fading` → `live`, huy hiệu sau `live`;
  2. mất GPU → "Dựng lại cảnh" trên sân khấu mới, `restore` đúng snapshot, live lại; mất lần hai → tĩnh `device-lost`;
  3. `it.each` bốn bước: hạn 10 giây của lần dựng lại tới khi bước đó còn dở → `onFail('timeout')` một lần (không phải ở 9 999 ms), sân khấu (nếu đã có) gỡ ngay lúc quá hạn, còn `createStage` dở dang thì sân khấu bị gỡ ngay khi tới muộn; phần xong muộn không đụng gì ngoài việc tự dọn;
  4. lần mở trang, boot hết hạn khi `createStage` còn dở: sân khấu đến muộn bị gỡ, không dựng cảnh, không `onFail`;
  5. `it.each` "mất GPU" và "3 lỗi GPU trong 1 giây" sau khi boot hết hạn: bỏ qua, lý do vẫn `timeout`.
- Lúc dựng thử, chín bản sửa sai (bỏ hay dời từng phép kiểm, `gone()` chỉ xét disposer, `onLost`/`onError` chỉ xét `failed`…) đều làm ít nhất một test đỏ. `run.js` cũ làm đỏ ca `createStage`, ca `restore` và hai test của mục 5.

**Files:**
- Create: `tests/unit/run.test.js`
- Modify: `src/engine/gpu/run.js`

**Interfaces:**
- Consumes: —
- Produces: — (`run()` giữ nguyên chữ ký và hành vi trên đường bình thường).

- [ ] **Step 1: Test (hỏng: phần dựng xong muộn vẫn gọi tới vỏ trang)**

Tạo `tests/unit/run.test.js`:

```js
// @vitest-environment jsdom
// tests/unit/run.test.js — vòng đời một bức ở tầng 3D (engine/gpu/run.js) trên sân khấu và cảnh giả: live, mất GPU rồi "Dựng lại cảnh", trang về tĩnh giữa chừng.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../src/engine/gpu/run.js';
import { DeadlineError } from '../../src/engine/deadline.js';
import { readFlags } from '../../src/engine/flags.js';
import { createStage } from '../../src/engine/gpu/stage.js';
import { buildScene } from '../../src/engine/gpu/scene.js';

// Phần nặng (three, GPU, DOM của Sổ tay) là đồ giả; deadline, disposer, guards, clock, palette là thật, cả studioApi của
// engine/sma.js. Còn __sma thì giả: harness() đưa vào một bản ghi lời gọi, như vỏ trang.
// createStage và buildScene là vi.fn(): harness() đặt lại cách chúng dựng cho từng test.
vi.mock('../../src/engine/gpu/stage.js', () => ({ createStage: vi.fn() }));
vi.mock('../../src/engine/gpu/scene.js', () => ({ buildScene: vi.fn() }));
vi.mock('../../src/engine/tools/index.js', () => ({ tools: [] }));
vi.mock('../../src/engine/gpu/debug.js', () => ({ openDebug: async () => null }));
vi.mock('../../src/ui/workshop.js', () => ({ mountWorkshop: vi.fn(() => ({ open() {}, dispose() {}, isOpen: false })) }));

const entry = { meta: { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'lop-hai' }] }, load: async () => ({}) };
const LOST = { api: 'WebGL', message: 'mất context' }; // như renderer.onDeviceLost báo
const GPU_ERROR = { type: 'validation', message: 'lỗi thử' }; // như renderer.onError báo
// Lời gọi tới vỏ trang của một lần dựng tới 'live' (mở trang, hay dựng lại sau 'setState loading').
const OPENED = ['setState compiling', 'setState fading', 'crossfade', 'setState live', 'showBadge'];

/** Promise điều khiển bằng tay: gọi resolve lúc nào tùy test. */
function deferred() {
  let resolve;
  const promise = new Promise((res) => { resolve = res; });
  return { promise, resolve };
}

/** Sân khấu giả: canvas thật của jsdom; lose(info), fault(info) báo cho mọi người nghe, như renderer.onDeviceLost, onError. */
function fakeStage(record) {
  const lost = [];
  const errors = [];
  return {
    backend: 'webgl2',
    renderer: { domElement: document.createElement('canvas'), setAnimationLoop: vi.fn() },
    onLost: record('stage.onLost', (cb) => lost.push(cb)),
    onError: record('stage.onError', (cb) => errors.push(cb)),
    dispose: vi.fn(), // việc tự dọn của run.js: đếm riêng, không vào log
    lose: (info) => lost.forEach((cb) => cb(info)),
    fault: (info) => errors.forEach((cb) => cb(info)),
  };
}

/** Cảnh giả: chỉ những gì run.js đọc. restore() và compile() đi qua `pass`, nên test giữ lại được (xem hold). */
function fakeScene(record, pass) {
  return {
    level: 'vua',
    studio: { snapshot: vi.fn(() => ({})), restore: record('scene.restore', () => pass('restore')) },
    compile: record('scene.compile', () => pass('compile')),
    step: vi.fn(),
    freeze: vi.fn(),
    quality: { start: vi.fn(), guard: vi.fn(), onChange: vi.fn(() => () => {}) },
    input: { onFirst: vi.fn() },
  };
}

/**
 * Một trang giả quanh run(), nối như boot.js. Một log ghi theo thứ tự lời gọi của run.js tới vỏ trang ('setState live'…),
 * tới __sma ('sma.set'…) và các bước dựng ('stage.onLost', 'scene.build', 'scene.compile'…); về tĩnh ghi mốc 'static <lý do>'.
 * Vỏ trang KHÔNG bị khóa như vỏ boot đưa cho run (boot chỉ khóa khi lần mở trang quá hạn hay hỏng; hạn 10 s của "Dựng lại
 * cảnh" là của run.js): test giữ chính run.js tự dừng. Mỗi lần createStage / buildScene: stages[i], scenes[i] mới.
 */
function harness() {
  const log = [];
  const stages = [];
  const scenes = [];
  let onRebuild = null; // nút "Dựng lại cảnh" mà showLost dựng
  const gates = new Map(); // bước chờ → cổng mà lần gọi KẾ TIẾP của bước đó phải qua (xem hold)
  const pass = async (step) => {
    const gate = gates.get(step);
    gates.delete(step);
    gate?.reached.resolve();
    await gate?.open.promise;
  };
  /** Hàm giả: ghi `name` vào log rồi làm phần việc riêng (nếu có). */
  const record = (name, then = () => {}) => vi.fn((...args) => {
    log.push(name);
    return then(...args);
  });

  createStage.mockImplementation(async () => {
    const stage = fakeStage(record);
    stages.push(stage); // test cầm được sân khấu ngay, cả khi lời hứa còn bị giữ
    await pass('createStage');
    return stage;
  });
  buildScene.mockImplementation(() => {
    log.push('scene.build');
    const scene = fakeScene(record, pass);
    scenes.push(scene);
    return scene;
  });

  const sma = {
    state: 'loading', // boot đặt 'loading' trước khi gọi run()
    frames: 0,
    set: record('sma.set', (patch) => Object.assign(sma, patch)),
    frame: record('sma.frame', () => { sma.frames += 1; }),
    expose: record('sma.expose', () => () => {}),
  };
  const shell = {
    stageEl: document.createElement('div'),
    setState: vi.fn((state) => {
      log.push(`setState ${state}`);
      sma.state = state; // như boot: onState của vỏ trang giữ __sma.state bằng data-state
    }),
    crossfade: record('crossfade', () => pass('crossfade')), // hòa xong ngay, trừ khi test giữ lại
    showBadge: record('showBadge'),
    showHint: record('showHint'),
    invite: record('invite'),
    showLost: record('showLost', (cb) => {
      sma.state = 'lost'; // vỏ thật: showLost gọi setState('lost')
      onRebuild = cb;
    }),
  };
  // showStatic của boot: qua onFail của run, hay do chính boot khi lần mở trang hết hạn 10 s.
  const toStatic = (reason) => {
    log.push(`static ${reason}`);
    Object.assign(sma, { state: 'static', reason });
  };
  const onFail = vi.fn(toStatic);

  return {
    stages, scenes, shell, sma, onFail,
    /** Gọi run() như boot gọi; resolve { dispose } khi cảnh đã live. */
    start: () => run(entry, shell, {
      tier: 'webgl2', flags: readFlags(''), now: new Date('2026-09-28T14:00:00Z'), lang: 'vi', t: {}, sma, onFail, win: window,
    }),
    rebuild: () => onRebuild(), // người xem bấm "Dựng lại cảnh"; trả lời hứa của lần dựng lại
    bootTimeout: () => toStatic('timeout'), // boot hết hạn 10 s của lần mở trang: showStatic thẳng, không qua onFail của run
    /** Lần gọi kế tiếp của `step` ('createStage', 'restore', 'compile', 'crossfade') chỉ xong khi test gọi resolve(). */
    hold(step) {
      const gate = { reached: deferred(), open: deferred() };
      gates.set(step, gate);
      return { reached: gate.reached.promise, resolve: gate.open.resolve }; // reached: run.js đã bắt đầu chờ bước này
    },
    shellLog: () => log.filter((e) => !e.includes('.')), // các mục của vỏ trang (bỏ mục có chủ: 'sma.', 'stage.', 'scene.')
    afterStatic: () => log.slice(log.findIndex((e) => e.startsWith('static ')) + 1), // mọi mục SAU lần về tĩnh đầu tiên
  };
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {}); // "Mất GPU lần đầu…" là cảnh báo có chủ ý
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('run', () => {
  it('mở trang: vỏ trang đi compiling → fading → live, huy hiệu sau live, bộ điều chỉnh bắt đầu đo', async () => {
    const page = harness();
    const handle = await page.start();
    expect(page.shellLog()).toEqual(OPENED);
    expect(page.shell.crossfade).toHaveBeenCalledWith(page.stages[0].renderer.domElement);
    expect(page.sma).toMatchObject({ state: 'live', backend: 'webgl2', level: 'vua', frames: 1 }); // khung ẩn là khung 1
    expect(page.scenes[0].compile).toHaveBeenCalledTimes(1);
    expect(page.scenes[0].quality.start).toHaveBeenCalledTimes(1);
    expect(page.stages[0].renderer.setAnimationLoop).toHaveBeenCalledWith(expect.any(Function));
    expect(page.onFail).not.toHaveBeenCalled();
    handle.dispose();
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1);
  });

  it('mất GPU sau khi live: "Dựng lại cảnh" dựng trên sân khấu MỚI, restore(snapshot) rồi live lại; mất lần hai thì về tĩnh', async () => {
    const page = harness();
    await page.start();
    const snapshot = { weights: { 'lop-hai': 0 } }; // trạng thái lúc mất GPU mà restore() phải đem về
    page.scenes[0].studio.snapshot.mockReturnValue(snapshot);
    page.stages[0].lose(LOST);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1); // lần dựng cũ gỡ ngay, poster chờ người xem bấm
    expect(page.sma.state).toBe('lost');

    await page.rebuild();
    expect(page.stages).toHaveLength(2); // renderer và canvas MỚI: WebGPURenderer không tự khôi phục được
    expect(page.scenes[1].studio.restore).toHaveBeenCalledWith(snapshot);
    expect(page.shellLog()).toEqual([...OPENED, 'showLost', 'setState loading', ...OPENED]);
    expect(page.shell.crossfade).toHaveBeenLastCalledWith(page.stages[1].renderer.domElement);
    expect(page.scenes[1].quality.start).toHaveBeenCalledTimes(1);
    expect(page.sma.state).toBe('live');
    expect(page.onFail).not.toHaveBeenCalled();

    page.stages[1].lose(LOST); // lần hai: không mời dựng lại nữa
    expect(page.onFail).toHaveBeenCalledTimes(1);
    expect(page.onFail).toHaveBeenCalledWith('device-lost', expect.any(Error));
    expect(page.stages[1].dispose).toHaveBeenCalledTimes(1);
    expect(page.shell.showLost).toHaveBeenCalledTimes(1);
  });
});

describe('run · "Dựng lại cảnh" quá hạn 10 s (GĐ 5)', () => {
  // createStage là lần chờ của rebuild ngay trước bringUp; restore, compile, crossfade là các lần chờ trong bringUp.
  it.each(['createStage', 'restore', 'compile', 'crossfade'])(
    'hạn tới khi %s còn dở → tĩnh "timeout" một lần; phần xong muộn không đụng gì ngoài việc tự dọn',
    async (step) => {
      vi.useFakeTimers();
      const page = harness();
      await page.start();
      page.stages[0].lose(LOST);
      const held = page.hold(step); // lần gọi của lần dựng lại (lần mở trang đã xong)
      const rebuilt = page.rebuild();
      await vi.advanceTimersByTimeAsync(9_999);
      expect(page.onFail).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      await rebuilt;
      expect(page.onFail).toHaveBeenCalledTimes(1);
      expect(page.onFail).toHaveBeenCalledWith('timeout', expect.any(DeadlineError));
      // Gỡ ngay lúc quá hạn, không chờ bước còn dở (createStage còn dở thì run.js chưa có sân khấu nào để gỡ).
      expect(page.stages[1].dispose).toHaveBeenCalledTimes(step === 'createStage' ? 0 : 1);

      held.resolve(); // bước đó xong sau hạn: lần dựng phải dừng êm
      await vi.advanceTimersByTimeAsync(0);
      expect(page.afterStatic()).toEqual([]); // không vỏ trang, không __sma, không gắn nghe, không dựng tiếp
      expect(page.stages[1].dispose).toHaveBeenCalledTimes(1); // sân khấu đến muộn: disposer đã đóng, add() gỡ ngay
    },
  );
});

describe('run · lần mở trang quá hạn: boot đã về tĩnh (GĐ 5)', () => {
  it('boot hết hạn khi createStage còn dở → sân khấu đến muộn bị gỡ, không dựng cảnh, không đụng tới trang', async () => {
    const page = harness();
    const init = page.hold('createStage'); // renderer.init() của lần mở trang
    const started = page.start();
    page.bootTimeout();
    init.resolve(); // xong sau hạn
    await started;
    expect(page.afterStatic()).toEqual([]);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1);
    expect(page.onFail).not.toHaveBeenCalled();
  });

  it.each([
    ['mất GPU', (stage) => stage.lose(LOST)],
    ['3 lỗi GPU trong 1 giây', (stage) => [1, 2, 3].forEach(() => stage.fault(GPU_ERROR))],
  ])('boot hết hạn khi compile còn dở, rồi %s → bỏ qua: không về tĩnh lần hai, lý do vẫn là "timeout"', async (_event, fire) => {
    const page = harness();
    const compile = page.hold('compile');
    const started = page.start();
    await compile.reached; // run.js đang chờ compile(): onLost, onError đã gắn
    page.bootTimeout();
    fire(page.stages[0]);
    expect(page.onFail).not.toHaveBeenCalled();
    expect(page.sma.reason).toBe('timeout');

    compile.resolve();
    await started;
    expect(page.afterStatic()).toEqual([]);
    expect(page.stages[0].dispose).toHaveBeenCalledTimes(1); // gone() sau compile() dọn lần dựng
  });
});
```

Run: `npx vitest run tests/unit/run.test.js`
Kết quả mong đợi: FAIL, 4 test hỏng; lỗi đầu tiên: `AssertionError: expected [ 'stage.onLost', …(6) ] to deeply equal []`.

- [ ] **Step 2: Code**

Áp vào `src/engine/gpu/run.js`:

```diff
diff --git a/src/engine/gpu/run.js b/src/engine/gpu/run.js
index f25af10..7d97469 100644
--- a/src/engine/gpu/run.js
+++ b/src/engine/gpu/run.js
@@ -69,7 +69,8 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     onFail(reason, error);
   };
   // Sau mỗi await, trang có thể đã về tầng tĩnh: do fail(), hoặc do boot hết hạn 10 s (showStatic đặt
-  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa.
+  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa. Mất GPU hay lỗi GPU đến sau lúc đó cũng bỏ
+  // qua (onLost, onError): boot đã về tĩnh mà còn fail() thì showStatic chạy lần hai, đổi lý do (vd. 'timeout' → 'device-lost').
   const stopped = () => failed || sma.state === 'static';
 
   const hex = mergePalette(meta.palette);
@@ -97,7 +98,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
 
   /** Mất GPU trước khi live, hoặc lần thứ hai: tầng tĩnh. Lần đầu sau khi live: poster + nút "Dựng lại cảnh". */
   const onLost = (d, info) => {
-    if (failed || d.closed) return;
+    if (stopped() || d.closed) return;
     const error = new Error(`Mất thiết bị ${info?.api ?? 'GPU'}: ${info?.message ?? ''}`);
     losses += 1;
     if (!studio || losses > 1) {
@@ -110,26 +111,31 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     shell.showLost(() => rebuild(snapshot));
   };
 
-  /** Dựng cảnh trên `stage` rồi đưa lên 'live'. Trả false nếu trang đã về tĩnh (hoặc lần dựng bị gỡ) giữa chừng. */
+  /** Dựng cảnh trên `stage` rồi đưa lên 'live'. Trả false nếu trang đã về tĩnh (hoặc lần dựng bị gỡ) trước hay giữa chừng. */
   const bringUp = async (stage, d, snapshot) => {
+    // Trang đã về tĩnh, hoặc lần dựng này đã bị gỡ (mất GPU, quá hạn): chỉ tự dọn (d.closeAll() gỡ sân khấu và cảnh của
+    // lần dựng này) rồi thôi, không đụng gì khác. Kiểm trước việc đầu tiên (hạn 10 s, của boot hay của "Dựng lại cảnh", có
+    // thể tới lúc createStage còn dở) và sau MỖI lần chờ: vỏ trang lúc dựng lại không bị boot khóa, run.js phải tự dừng.
+    const gone = () => {
+      if (!stopped() && !d.closed) return false;
+      d.closeAll();
+      return true;
+    };
+    if (gone()) return false;
     stage.onLost((info) => onLost(d, info));
     const gpuErrors = createBurstCounter({ limit: 3, windowMs: 1000 });
     stage.onError((info) => {
+      if (stopped()) return;
       console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
       if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
     });
     const scene = buildScene({ stage, disposer: d, painting, meta, flags, now, reducedMotion, win, tools, t, content });
     sma.set({ backend: stage.backend, level: scene.level });
     if (snapshot) await scene.studio.restore(snapshot);
+    if (gone()) return false;
 
     shell.setState('compiling');
     await scene.compile();
-    // Trang đã về tĩnh, hoặc lần dựng này đã bị gỡ (mất GPU, quá hạn): dọn nốt rồi thôi.
-    const gone = () => {
-      if (!stopped() && !d.closed) return false;
-      d.closeAll();
-      return true;
-    };
     if (gone()) return false;
 
     const limit = typeof flags.freeze === 'number' ? flags.freeze : Infinity;
@@ -231,11 +237,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     // Song song: tải module nặng của bức, dựng renderer, tải chữ của bức (hỏng thì cảnh vẫn chạy, chỉ thiếu chữ).
     let stage;
     [painting, stage, content] = await Promise.all([entry.load(), newStage(disposer), loadContent(entry, lang)]);
-    if (stopped()) {
-      disposer.closeAll();
-      return handle;
-    }
-    await bringUp(stage, disposer, null);
+    await bringUp(stage, disposer, null); // boot đã hết hạn 10 s lúc đang chờ thì bringUp chỉ tự dọn
     return handle;
   } catch (err) {
     disposer.closeAll();
```

Run: `npx vitest run tests/unit/run.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 3: Toàn bộ test rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  860 passed`.

```bash
git add src/engine/gpu/run.js tests/unit/run.test.js
git commit -F - <<'EOF'
fix(engine): "Dựng lại cảnh" quá hạn không còn đụng tới trang đã về tĩnh (run.js kiểm sau mỗi lần chờ); bộ test đầu tiên cho run()

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 18: Ghi lại GĐ 5: README, CLAUDE.md, spec

**Mục tiêu:**
- **README:** ba mục của GĐ 5 (trăng tiến độ, Từng sợi, thả hoa đăng); chỗ của bảng công cụ (giữa thanh lớp và Sổ tay; dưới 1240 px thì Sổ tay thu lại khi công cụ bật) và đường Tab từ nút công cụ; số test (73 file, 860 test) và e2e (mỗi project liệt kê 40 test: `static` chạy 6, ba project 3D chạy 33); bảng bundle đo lại (đường 3D 313,97 kB gzip, hơn GĐ 4 7,40 kB; kể cả Tweakpane 344,93 kB); mục "Thêm một bức tranh mới" có tên vật và nhãn, chữ đi theo vật; trần job `e2e-webgpu` là 40 phút.
- **CLAUDE.md:**
  - bản đồ dự án: Từng sợi chỉ nhìn `api.draws` của `engine/gpu/draws.js`; chữ đi theo vật; quầng trăng tiến độ;
  - hai nhóm luật mới, "Tên vật, chữ đi theo vật, móc lần vẽ (GĐ 5)" và "Bố cục và vòng đời (GĐ 5)": tên vật và nhãn, chữ chỉ ở `content.captions`, chỉ `draws.js` đặt móc và scene pass chạy đầu tiên, `'double-tap'`, e2e chạm hai lần, thứ tự DOM của ba tấm cố định, bề rộng `--rail-w`/`--notebook-w` và ngưỡng 1240, cặp `@media` bù nhau, `run.js#bringUp` kiểm `gone()` sau mọi lần chờ;
  - các luật thêm vào nhóm cũ: `meta.layers[].files`, `DynamicDrawUsage`, khung bao của InstancedMesh, ES2022 ở phần nhẹ, chuyển động theo cử chỉ tính thẳng từ thời gian, aria-live ẩn bằng opacity;
  - gỡ lỗi nhanh: `__sma.setTool('tung-soi')`, `__sma.readouts(id)`.
- **Spec:** khớp với điều bản dựng thử thật sự làm, đánh dấu "(GĐ 5)":
  - §4.1 mục 1 và §8.5: quầng chỉ có mốc `'chunk'` ngoài các trạng thái (không có `'compiled'`, vì sao), bảng số giây và chặng đo được, vòng gấp 100;
  - §4.1 mục 6 và §7: bảng công cụ không nằm dưới Sổ tay, ngưỡng 1240, thứ tự Tab;
  - §4.1 mục 10 và §9: chữ dừng trên chân khung, `data-away`, `anchor()`; hai dòng mới về "Dựng lại cảnh" trong bảng lỗi;
  - §4.2, §5, §6 (Lớp 2, 3, 4): vòng đệm N + 1 ô, `CLOSED_TILT`, `SINK`, vũng sáng bán kính 1,1, thứ tự thơ theo đêm, lượt tinh chỉnh;
  - §7 Từng sợi như đã dựng; §8.1 cây file; §8.2, §8.4, §8.6, §8.7; §10 (draw call 35 → 35, chi phí lúc chưa dùng, JS +7,4 kB); §12 (test unit và e2e GĐ 5, kiểm tay); §13, §14, §16, §17;
  - Phụ lục A: A.51 và A.53 bổ sung; mục mới A.54–A.75 về three r186 và trình duyệt tìm ra lúc dựng thử.

Đo lại bundle từ bản build của bạn (`npm run build` in cỡ gzip). Số trong README là của bản dựng thử; lệch vài trăm byte thì ghi số của bạn ở README và ở hai dòng của spec §10: "JS: đường 3D thêm 7,4 kB gzip (306,57 → 313,97 kB, đo ngày 2026-10-03)" và "GĐ 5 đo được: đường 3D 314,0 KB; cộng Tweakpane 344,9 KB". Sửa cả mức tăng và ngày đo.

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

**Interfaces:**
- Consumes: số đo của Task 12, 15, 16, 17.
- Produces: —

- [ ] **Step 1: README**

Áp vào `README.md`:

````diff
diff --git a/README.md b/README.md
index 5ac5b07..1942925 100644
--- a/README.md
+++ b/README.md
@@ -17,10 +17,25 @@ Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:
 Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
 chất liệu), Sương (vòm trời có sao, quầng trăng, Ngân Hà; sương là là trên mặt nước), Mặt nước (phản chiếu, gợn sóng),
 Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES, LUT "sơn mài"
-sinh từ bảng màu, hạt, tối góc, FXAA). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại; vuốt để
-sương xoáy; kéo thanh giờ để trăng đi qua đêm.
+sinh từ bảng màu, hạt, tối góc, FXAA). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; chạm hai lần để thả một ngọn hoa đăng
+mang một cặp câu thơ; giữ tay để đom đóm tụ lại; vuốt để sương xoáy; kéo thanh giờ để trăng đi qua đêm.
 Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".
 
+Trong lúc tải cảnh 3D, trăng cạnh con dấu có một vòng quầng mảnh vẽ dần theo từng bước tải (tải code, dựng cảnh, hòa dần), nên
+mạng chậm vẫn thấy trang đang nhích (giai đoạn 5).
+
+## Thả hoa đăng
+
+Chạm hai lần lên mặt nước (giai đoạn 5): hai lần chạm vẫn tạo hai vòng gợn, và giữa vòng gợn hiện một búp hoa đăng, nở đủ 8 cánh
+trong khoảng 1,5 giây. Một cặp câu thơ (ca dao hay thơ cổ điển, có ghi nguồn) hiện phía trên ngọn đèn và đi theo nó.
+
+- Đèn trôi chậm về phía lối trăng, nhấp nhô khi gợn đi qua, hắt một vũng sáng ấm trên nước, hiện trong ảnh phản chiếu và mờ dần
+  trong sương. Tới gần bờ, hoặc sau 90 giây, đèn chìm dần rồi tắt.
+- Ao giữ tối đa 8 đèn trôi ở mức cao (6 ở mức vừa, 4 ở mức thấp); thả thêm thì đèn cũ nhất chìm sớm.
+- Mười hai cặp câu, mỗi đêm một thứ tự khác (cùng `?at` thì cùng thứ tự).
+- Mọi đèn chung một InstancedMesh với đèn ở bờ, nên thả bao nhiêu đèn cũng không thêm draw call nào. Đèn thả ra chỉ tự phát sáng
+  (thêm đèn thật lúc chạy là mọi chất liệu biên dịch lại). Đường trôi tính thẳng từ thời gian, nên `?freeze=N` vẫn cho đúng khung N.
+
 ## Sổ tay: mài từng lớp
 
 Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng bàn phím), trang mời *"Bức tranh này có 6 lớp — mài thử?"*. Bấm vào là vào **chế độ mài**:
@@ -36,7 +51,8 @@ Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng b
 - Trong DevTools: `__sma.layers()`, `__sma.setWeight('mat-nuoc', 0)` (mài một lớp ngay), `__sma.snapshot()`,
   `__sma.restore(s)`, `__sma.stats()` (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (mức, nấc đang hạ, máy có đo được
   GPU không, nấc bị khóa), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` /
-  `__sma.setTool('kinh-mai')` (công cụ học), `__sma.dials()` / `__sma.setDial('gio', 27)` (thanh giờ).
+  `__sma.setTool('kinh-mai')` (công cụ học; `'tung-soi'` là Từng sợi), `__sma.dials()` / `__sma.setDial('gio', 27)` (thanh giờ),
+  `__sma.readouts('anh-trang')` (số đo riêng của một lớp, như Sổ tay đọc: ở lớp Ánh trăng có số hoa đăng đang trôi).
 - Mất GPU (máy ngủ, đổi card đồ họa): lần đầu trang hiện poster và nút "Dựng lại cảnh", dựng lại đúng trạng thái cũ;
   lần hai thì về tranh tĩnh.
 
@@ -49,9 +65,17 @@ Trong thanh lớp có mục **Đồ nghề** (mỗi lúc bật một công cụ;
   (cả bằng bàn phím): bên trái là ảnh đang soi, bên phải là ảnh cuối. Chọn *Normal* lần đầu thì xưởng phải biên dịch lại một lần
   ("đang mài…").
 - **Lột lớp:** một thanh trượt lột dần ảnh cuối về từng bước, từ ảnh cuối tới depth.
+- **Từng sợi** (giai đoạn 5): dệt lại khung hình từng lần vẽ (draw call) một, theo đúng thứ tự GPU nhận. Thanh trượt đi từ 0 (chưa
+  vẽ gì, chỉ còn màu nền) tới N (ảnh đủ); nút "Dệt lại" chạy hết 0 → N, mỗi sợi chừng 0,6 giây, cả lượt không quá chừng 12 giây
+  (nhiều sợi thì đi nhanh hơn). Dòng mô tả cho biết sợi đang xem vẽ vật gì (nhãn, lớp, số bản, số tam giác), và dòng tóm tắt đếm
+  lượt vẽ cảnh, phản chiếu, các lượt khác. Bật "Tắt instancing" là thấy mỗi lá nổi thành một sợi: hơn nghìn sợi ở mức cao (tối
+  đa 1.200). Xưởng chỉ gắn móc lần vẽ (`renderer.setRenderObjectFunction`) khi công cụ bật.
 - **Thanh giờ:** kéo từ 18:00 tới 05:30; trăng, lối trăng, bóng, màu trời và sương đi theo; trăng thấp thì ánh trăng yếu.
 
-Công cụ chạy trên mọi bức: chúng chỉ nhìn các "view" mà xưởng liệt kê, bức không biết có công cụ nào.
+Công cụ chạy trên mọi bức: chúng chỉ nhìn các "view" (và Từng sợi chỉ nhìn danh sách lần vẽ) mà xưởng đưa cho, bức không biết có
+công cụ nào. Trên máy tính, bảng của công cụ nằm giữa thanh lớp và Sổ tay; màn hẹp hơn 1240 px thì Sổ tay thu lại khi một công cụ
+bật. Từ nút công cụ trên thanh lớp, phím Tab đi hết phần còn lại của thanh lớp (các nút Đồ nghề sau nó, thanh giờ, "Phủ lớp
+tiếp theo", nút đóng) rồi mới vào bảng của công cụ; sau bảng là Sổ tay.
 
 ## Chất lượng: hợp với nhiều loại máy
 
@@ -101,11 +125,15 @@ npx playwright install chromium    # chỉ cần lần đầu, trước khi ch
 npm run e2e                        # build rồi chạy e2e (tranh tĩnh, WebGL2, WebGPU)
 ```
 
+Số test (giai đoạn 5): `npm test` chạy 73 file, 860 test. E2e liệt kê 40 test cho mỗi project: `static` chạy 6, mỗi project 3D
+(`webgl2-swiftshader`, `webgpu-swiftshader`, `webgpu-real-gpu`) chạy 33; còn lại Playwright ghi "skipped" vì chúng thuộc project
+khác.
+
 **WebGPU e2e trên CI (ubuntu):** với headless shell của Playwright, mọi test WebGPU rơi về tranh tĩnh vì
 `device-lost: "A valid external Instance reference no longer exists"`. Project `webgpu-swiftshader` vì vậy dùng Chromium
 đầy đủ (`channel: 'chromium'`) và, chỉ khi chạy trên CI, thêm cờ Vulkan của SwiftShader
 (`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Từ giai đoạn 4, e2e WebGPU chạy ở một job
-riêng (`e2e-webgpu`, không chặn deploy, trần 25 phút), song song với job `build` (chặn: unit, build, e2e tĩnh + WebGL2 kèm a11y).
+riêng (`e2e-webgpu`, không chặn deploy, trần 40 phút), song song với job `build` (chặn: unit, build, e2e tĩnh + WebGL2 kèm a11y).
 
 **E2E trên GPU thật của máy mình** (nhanh, bắt được lỗi của driver mà SwiftShader che mất):
 `npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`.
@@ -150,12 +178,18 @@ Không phải sửa xưởng, trừ khi bức cần một khả năng mới.
    (từ vựng riêng của bức, để test cấm xưởng nhắc tới).
 2. Viết các lớp `layers/lN-<id>.js` (mỗi file `export const id`, `knobs`, `createLayer`); lớp đầu luôn là Cốt, lớp cuối thường
    là Phủ bóng dùng chung. Thêm `painting.js` (lớp, camera, `quality`, `setup`) và `content.vi.js` (chữ của Sổ tay).
+   - Mọi vật trong `objects` của lớp có `name` (kebab-case không dấu, không trùng trong lớp), và nhãn ở
+     `content.layers[id].objects[name]`: Từng sợi hiện nhãn này. Test tên vật kiểm cả vật mà thí nghiệm thêm vào.
+   - `meta.layers[].files` kê mọi file trong `parts/` mà lớp import (thẳng hay qua part khác); lớp khác cần gì thì nhận qua
+     `shared`, không import part của lớp khác.
+   - Tùy chọn: muốn một dòng chữ (thơ, chú thích) hiện cạnh một vật và đi theo nó thì ghi chữ vào `content.captions`
+     (`{ lines, source, author? }`, 1–2 dòng) rồi gọi `ctx.captions.show(khóa, anchor)`; code của bức chỉ cầm khóa.
 3. Copy `index.html` thành `tranh/<slug>/index.html`, sửa `data-painting`, tiêu đề, thơ, poster, thẻ og và dòng import.
 4. Thêm `{ meta, page: 'tranh/<slug>/index.html', lang: 'vi' }` vào `src/paintings/registry.js`.
 5. Chụp poster từ chính cảnh: `npm run build && node scripts/poster.js <slug>` (máy có GPU thật). Ảnh ghi vào
    `public/paintings/<slug>/`.
-6. `npm test` rồi sửa theo từng lỗi tiếng Việt; `npm run e2e`. E2e chung (mài lớp, hạ nấc, Kính mài, Lột lớp, a11y…) tự chạy
-   trên bức mới.
+6. `npm test` rồi sửa theo từng lỗi tiếng Việt; `npm run e2e`. E2e chung (mài lớp, hạ nấc, Kính mài, Lột lớp, Từng sợi, quầng
+   trăng, a11y…) tự chạy trên bức mới.
 
 Công thức đầy đủ (thêm lớp, thêm công cụ học, thêm ngôn ngữ): spec §15.
 
@@ -175,27 +209,29 @@ CI không chạy script này: ảnh được commit vào repo.
 
 ## Kích thước bundle
 
-Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-10-01 (giai đoạn 4). Tên file đã bỏ phần hash.
+Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-10-03 (giai đoạn 5). Tên file đã bỏ phần hash.
 
 | File | Kích thước | gzip |
 |---|---:|---:|
-| `assets/ao-sen-dem-*.css` | 36.73 kB | 13.03 kB |
-| `assets/ao-sen-dem-*.js` (chunk vào) | 21.38 kB | 9.91 kB |
-| `assets/run-*.js` (kèm đồ nghề, view, bộ điều chỉnh) | 54.05 kB | 18.31 kB |
-| `assets/workshop-*.js` (thanh lớp + Sổ tay + Đồ nghề) | 15.73 kB | 5.86 kB |
-| `assets/painting-*.js` (kèm LUT, FXAA của Phủ bóng) | 45.66 kB | 17.59 kB |
-| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay) | 30.42 kB | 9.25 kB |
+| `assets/ao-sen-dem-*.css` (kèm chữ đi theo vật, quầng trăng) | 38.44 kB | 13.41 kB |
+| `assets/ao-sen-dem-*.js` (chunk vào, kèm quầng trăng) | 23.71 kB | 10.86 kB |
+| `assets/run-*.js` (kèm đồ nghề, Từng sợi, móc lần vẽ, chữ đi theo vật, view, bộ điều chỉnh) | 62.35 kB | 21.53 kB |
+| `assets/workshop-*.js` (thanh lớp + Sổ tay + Đồ nghề) | 16.05 kB | 5.93 kB |
+| `assets/painting-*.js` (kèm hoa đăng, LUT, FXAA của Phủ bóng) | 50.60 kB | 19.68 kB |
+| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay, thơ của hoa đăng) | 32.95 kB | 10.32 kB |
 | `assets/three-*.js` | 898.07 kB | 245.65 kB |
-| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **306.57 kB** |
+| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **313.97 kB** |
 | `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.30 kB | 30.96 kB |
-| 20 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–6.2 kB mỗi file |
+| 22 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–8.0 kB mỗi file |
 | `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.83 kB | 38.67 kB |
 | `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |
 
 Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang; mở Sổ tay chỉ đọc thì tải thêm `workshop` và `content`.
 Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.
-Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 337.53 kB).
+Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 344.93 kB). Giai đoạn 5 thêm 7.40 kB gzip cho đường 3D
+(giai đoạn 4: 306.57 kB).
 
 ## Giấy phép
 
-MIT, xem [LICENSE](LICENSE). Mọi hình ảnh đều sinh bằng code. Thơ: ca dao; Truyện Kiều (Nguyễn Du).
+MIT, xem [LICENSE](LICENSE). Mọi hình ảnh đều sinh bằng code. Thơ: ca dao; Truyện Kiều (Nguyễn Du); thơ của hoa đăng là ca dao
+và thơ cổ điển đã hết bản quyền (Nguyễn Trãi, Hồ Xuân Hương, Nguyễn Du, Nguyễn Khuyến).
````

- [ ] **Step 2: CLAUDE.md**

Áp vào `CLAUDE.md`:

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index 65f066a..5522c5f 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -30,6 +30,10 @@ Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec
 - Công cụ học (GĐ 4): `engine/tools/<id>.js` (Kính mài, Lột lớp) chỉ nhìn các view của `engine/gpu/views.js`;
   `engine/gpu/toolbox.js` gắn công cụ, mỗi lúc một công cụ; `ui/rail-tools.js` vẽ mục "Đồ nghề" trong thanh lớp.
   Dial (núm của cả bức, như thanh giờ): bức khai báo ở `setup().dials`, `engine/gpu/dial-set.js` đọc/ghi, `ui/dials.js` vẽ.
+  GĐ 5: Từng sợi (`engine/tools/tung-soi.js`) chỉ nhìn `api.draws`, năm hàm của móc lần vẽ `engine/gpu/draws.js`.
+- Chữ đi theo vật (GĐ 5): bức gọi `ctx.captions.show(khóa, anchor)`; `engine/gpu/caption-set.js` tra `content.captions` và chiếu
+  điểm neo mỗi khung, `ui/captions.js` vẽ vùng aria-live phủ lên canvas. Quầng trăng tiến độ: `ui/moon-progress.js` (trong
+  `[data-moon]`, theo `setState` và mốc `'chunk'` của boot).
 - Cách phân biệt: tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thuộc xưởng; tên chủ đề (sen, trăng,
   gợn nước, đom đóm) thuộc bức.
 
@@ -69,6 +73,8 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 - Theo **luật hai lần**: chỉ rút code của một bức lên `src/lib/` hoặc `src/engine/stock/` khi bức thứ hai thật sự cần.
 - Hợp đồng (`src/engine/contracts/`) chỉ **thêm trường tùy chọn**, không đổi nghĩa trường cũ.
 - Id đã deploy (slug, layerId, knobId, dialId) là **API công khai**: không đổi.
+- `meta.layers[].files` liệt kê mọi file `parts/` mà lớp import (trực tiếp hay qua part khác); dữ liệu dùng chung giữa các lớp đi
+  qua `shared`, lớp không import part của lớp khác (test hợp đồng giữ).
 
 ### Shader và TSL
 - Không đổi `renderer.toneMapping` lúc chạy.
@@ -85,6 +91,10 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 - Số lượng đổi được lúc chạy (lá, đom đóm…): cấp phát theo trần MỘT lần, lúc chạy chỉ ghi lại dữ liệu và đổi `count`.
   InstancedMesh và object có `count > 1` có cache key riêng theo uuid, nên đổi `count` không biên dịch lại; đừng để
   sprite về `count` 0 hay 1.
+- `DynamicDrawUsage` chỉ dùng cho thuộc tính ghi lại MỖI khung: three r186 tải lại thuộc tính đó ở mọi lần render, bất kể version
+  (`renderers/common/Attributes.js`). Thuộc tính chỉ đổi lúc có việc thì để usage mặc định và đặt `needsUpdate` khi ghi.
+- InstancedMesh: `setMatrixAt` không cập nhật `boundingSphere` (frustum culling dùng nó): ghi ma trận xong thì
+  `computeBoundingSphere()`; ô trống (ma trận cỡ 0) đặt ở chỗ không làm phình hình cầu.
 - Vẽ lại ngoài vòng lặp (khi `?freeze=N` đã dừng) phải đợi nhịp `requestAnimationFrame` kế tiếp: scene pass và
   reflector chỉ vẽ lại cảnh một lần mỗi `frameId`, mà `frameId` chỉ tăng ở mỗi nhịp rAF của renderer.
 - `scene.fogNode` nằm trong cache key của MỌI material: gán một lần; mọi thứ đổi lúc chạy trong sương là uniform. `fbm` cần
@@ -114,10 +124,14 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
   không đo được (Sổ tay ghi "—"). Mẻ không có nhịp để so (lần hỏi đầu, mẻ dài hơn một lần nghẽn) thì bỏ mẫu mà không tính là hỏng:
   số chưa kiểm được không bao giờ vào Sổ tay.
 - Số lượng theo máy (số lá, số hạt, độ phân giải…) đọc từ `ctx.budget` (bảng `quality.js` của bức), không viết cứng.
+- Phần nhẹ (bao đóng import tĩnh của `engine/boot.js` và `paintings/*/index.js`: `engine/*.js`, các file `ui/` mà boot kéo theo,
+  `lib/astro/`, `lib/random.js`) chạy cả trên trình duyệt cũ của tầng tĩnh (Safari 14): không dùng built-in ES2022 trở lên (như
+  `Object.hasOwn`, `Array.prototype.at`) và `structuredClone` ở đó (phần nặng thì được; `tests/rules/imports.test.js` giữ).
 
 ### Công cụ học, Dial, poster (GĐ 4)
-- Công cụ chỉ nhìn `api.views()`, không biết bức nào. `overlay()` chỉ dựng node, không giữ trạng thái: views.js ghép lại overlay
-  khi `requireView` đổi MRT. Đổi chế độ (hình, view, vạch gạt) = đổi uniform; chọn view bằng `If` trong `Fn` (`tools/pick.js`).
+- Công cụ chỉ nhìn `api.views()` (Từng sợi: `api.draws`), không biết bức nào. `overlay()` chỉ dựng node, không giữ trạng thái:
+  views.js ghép lại overlay khi `requireView` đổi MRT. Đổi chế độ (hình, view, vạch gạt) = đổi uniform; chọn view bằng `If` trong
+  `Fn` (`tools/pick.js`).
 - Tap (`post.build/display({ tap })`) là biểu thức THUẦN (texture của pass, texture của bloom, uniform), không phải biến
   `.toVar()` trong Fn: overlay tính lại nó ở lượt vẽ cuối, sau FXAA. Nhãn ở `content.layers[id].taps` (test hợp đồng giữ).
 - Màu hằng trong overlay là số sRGB, vì overlay trộn với ảnh cuối đã ở không gian hiển thị. `color('#hex')` của three tự đổi sang
@@ -130,9 +144,45 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 - Poster chụp từ chính cảnh bằng `scripts/poster.js` (GPU thật); đổi thời điểm thì sửa `meta.poster.capture` rồi chạy lại.
   `img[data-poster]` là ảnh poster; `body[data-poster]` là cờ `?poster` (CSS ẩn mọi UI trừ canvas).
 
+### Tên vật, chữ đi theo vật, móc lần vẽ (GĐ 5)
+- Mọi vật trong `layer.objects` có `name` kebab-case không dấu, không trùng trong lớp, và nhãn ở `content.layers[id].objects[name]`,
+  kể cả vật mà thí nghiệm thêm vào (`tests/paintings/objects.test.js` giữ, ở mức cao, thấp và lúc bật từng thí nghiệm). Con của
+  một vật như thế (Mesh trong Group) không cần tên riêng: Từng sợi gán nó cho vật cha.
+- Chữ đi theo vật: chữ chỉ ở `content.captions` (dạng `Poem`: 1–2 dòng ≤ 60 ký tự, có `source`); bức gọi
+  `ctx.captions.show(khóa, anchor)` và không viết chữ nào trong code. `anchor()` trả `null` khi khung đó không có điểm neo (chữ ẩn,
+  không cảnh báo); `undefined` hay số không hữu hạn là lỗi (cảnh báo một lần).
+- Chỉ `engine/gpu/draws.js` được gọi `setRenderObjectFunction` (`tests/rules/files.test.js` giữ). Scene pass phải là `updateBefore`
+  ĐẦU TIÊN của lượt cuối (`views.js`: `Fn(() => { scenePass.toVar(); … })`), vì three chạy `updateBefore` theo hậu thứ tự (con trước
+  cha) và RTT/bloom gọi `resetRendererState` (gỡ móc) trong lúc vẽ: scene pass vẽ lần đầu từ bên trong RTT thì móc không thấy lượt
+  vẽ cảnh (`tests/unit/pipeline.test.js` giữ).
+- Cử chỉ `'double-tap'` đến ngay sau `'tap'` thứ hai (hai `'tap'` vẫn tới như thường); công cụ giữ `'tap'` thì giữ cả `'double-tap'`
+  (Kính mài ở hình tròn giữ cả hai khi là ngón tay hay bút; hình gạt không giữ cử chỉ nào trên canvas, nên chạm hai lần vẫn tới
+  bức), không thì bức nhận `'double-tap'` mà không có hai `'tap'` làm nên nó.
+- E2e cần chạm hai lần thì phát sự kiện con trỏ ngay trong trang (`e2e/helpers.js#doubleTapAt`: pointerId 1, `pointerType: 'mouse'`),
+  không dùng chuột của Playwright (mỗi sự kiện của nó đợi một nhịp khung); id khác thì `setPointerCapture` của OrbitControls ném lỗi.
+
+### Bố cục và vòng đời (GĐ 5)
+- Thứ tự DOM của các tấm cố định: thanh lớp → thanh công cụ → Sổ tay (Tab đi theo thứ tự DOM, WCAG 2.4.3): `toolbox.js` gắn thanh
+  công cụ ngay sau `[data-rail]`, `workshop.js` đặt thanh lớp ngay trước và Sổ tay ngay sau `[data-toolbar]`. Đừng chèn tấm nào khác
+  vào giữa, đừng chuyển focus khi bật công cụ. z-index (thanh công cụ 1 < thanh lớp, Sổ tay 2), không phải thứ tự DOM, giữ thanh công
+  cụ ở dưới.
+- Bề rộng thanh lớp và Sổ tay ở `--rail-w` / `--notebook-w` (`notebook.css`); đổi một số thì tính lại ngưỡng 1240px / 1239.98px của
+  `tools.css` (`tests/unit/shell-css.test.js` tính lại). Không có phần trăm trong `max-width` máy tính của `.tool-panel`: ô của bảng
+  là phần tử flex, phần trăm ở đó "vòng" và Chromium bỏ cả `max-width`.
+- Cặp `@media` phải bù nhau: một luật mặc định cộng một luật đè, hay quy ước `.98` (`max-width: 1239.98px` cạnh `min-width: 1240px`);
+  không bao giờ `max-width: Npx` cạnh `min-width: (N+1)px`: bề rộng CSS lẻ khi zoom (cửa sổ 1549px ở 125% là 1239,2px) lọt giữa
+  hai ngưỡng và không luật nào khớp.
+- `engine/gpu/run.js#bringUp` gọi `gone()` trước việc đầu tiên và ngay sau MỌI `await` (thêm một lần chờ thì thêm
+  `if (gone()) return false;` ngay sau nó, và thêm tên bước đó vào bảng `it.each` của `tests/unit/run.test.js`). Trang đã về tĩnh
+  (`fail()`, hay boot hết hạn 10 s) hoặc lần dựng đã bị gỡ thì phần còn lại chỉ tự dọn (`d.closeAll()`), không gọi gì khác tới vỏ
+  trang, `__sma`, sân khấu hay cảnh: boot chỉ khóa vỏ trang khi lần mở trang quá hạn hay hỏng, còn hạn 10 s của "Dựng lại cảnh"
+  là của run.js. Sự kiện GPU đến khi `stopped()` (`onLost`, `onError`) thì bỏ qua: không về tĩnh lần hai, lý do đã báo giữ nguyên.
+
 ### Chuyển động và ngẫu nhiên
 - Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
 - Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).
+- Thứ chuyển động theo cử chỉ mà phải tất định với `?freeze` (hoa đăng) thì tính thẳng từ thời gian (dạng đóng: vị trí = f(t − lúc
+  bắt đầu)), không cộng dồn từng khung: `update(0, t)` phải ra đúng khung N.
 
 ### Chữ và chú thích
 - Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`.
@@ -143,6 +193,8 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
   của bảng sơn mài. Test hợp đồng giữ các luật này.
 - Vùng `aria-live` (`[data-hint]`, `[data-static]`, `[data-badge-note]`) không bao giờ dùng `hidden`: để trống khi không có
   gì để nói (CSS thu lại khi `:empty`). Vừa bỏ `hidden` vừa điền chữ trong cùng một nhịp thì VoiceOver bỏ qua.
+- Chữ trong vùng aria-live ẩn bằng opacity (thuộc tính `data-*`, như `data-away` của chữ đi theo vật), không bằng `hidden`:
+  `hidden` gỡ chữ khỏi cây trợ năng (hiện lại là đọc lại) và bỏ transition.
 - Thông báo lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.
 - Chú thích tiếng Việt ở những điểm cần học (làm gì, vì sao), không chú thích dòng hiển nhiên.
 
@@ -168,5 +220,6 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
 - `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`. Khi cảnh live còn có
   `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`, `__sma.stats()`
   (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (nấc đang hạ, `gpu`, nấc bị khóa `locked`), `__sma.degrade()` /
-  `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` / `__sma.setTool('kinh-mai')` (công cụ học, `null` tắt hết),
-  `__sma.dials()` / `__sma.setDial('gio', 27)` (núm của cả bức).
+  `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` / `__sma.setTool('kinh-mai')` (công cụ học, `null` tắt hết;
+  `__sma.setTool('tung-soi')` bật Từng sợi), `__sma.dials()` / `__sma.setDial('gio', 27)` (núm của cả bức), `__sma.readouts(id)`
+  (số đo riêng của một lớp, như Sổ tay đọc: `__sma.readouts('anh-trang')` có số hoa đăng đang trôi).
```

- [ ] **Step 3: Spec**

Áp vào `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:

````diff
diff --git a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
index 99f41e6..ab34ca9 100644
--- a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
+++ b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
@@ -108,6 +108,12 @@ Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau
   điểm 3D; hoa đăng thuộc lớp Ánh trăng, gộp với đèn ở bờ thành một InstancedMesh. Link công thức, "Xem bản dịch" và đàn bầu để sau
   (§16). Bạn giao cho Claude tự quyết chi tiết của Từng sợi, trăng tiến độ và phần kiểm thử, rồi duyệt lại một lượt trong spec.
 
+  Lúc dựng thử GĐ 5, Bạn chọn thêm:
+  - chữ đi theo vật dừng trên chân khung, thay cho làm mờ thơ khi có chữ (§4.1 mục 10; thơ luôn hiện, mục 2);
+  - sửa luôn trong GĐ 5 hai lỗi có từ GĐ 4: bảng công cụ nằm dưới Sổ tay trên máy tính, và Tab từ nút công cụ phải vòng qua cả
+    trang mới tới bảng của nó (§4.1 mục 6, §7 "Thanh công cụ");
+  - sửa luôn lỗi có từ GĐ 2: "Dựng lại cảnh" quá hạn 10 giây vẫn đổi trang đã về tĩnh (§9, §12 `run`).
+
 ### Giả định (bạn đã xem và không phản đối)
 - Project nằm ở `~/Documents/Projects/son-mai-anh-sang`.
 - Git dùng `Bao Nguyen <giabao261096@gmail.com>`, chỉ cấu hình trong repo này. Cấu hình git global (email công ty) giữ nguyên.
@@ -161,13 +167,17 @@ Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau
    - HTML tĩnh hiện ngay poster của bức, tên bức, thơ và con dấu ngày âm lịch.
    - JS 3D tải ngầm, dò tầng, biên dịch trước (`scenePass.compileAsync(renderer)`), rồi vẽ một khung ẩn sau poster để các pipeline còn lại kịp biên dịch.
    - Sau đó **hòa dần** từ poster sang cảnh 3D. Poster được ẩn khi hòa xong. Không có spinner.
-   - (GĐ 5) **Trăng tiến độ:** trong lúc tải phần 3D, trăng SVG cạnh con dấu có thêm một **vòng quầng** mảnh màu vàng lá, vẽ dần
-     theo chiều kim đồng hồ từ đỉnh. Trăng vẫn giữ đúng pha đêm nay; chỉ quầng là tiến độ.
-     - Quầng hiện từ `loading`. Nó nhích qua từng mốc: tải xong code 3D, dựng xong renderer và bức, biên dịch xong shader, vẽ xong
-       khung ẩn. Giữa hai mốc, quầng bò chậm dần về mốc sau, nên mạng chậm vẫn thấy nó nhích chứ không đứng hẳn.
+   - (GĐ 5) **Trăng tiến độ:** trong lúc tải phần 3D, trăng SVG cạnh con dấu có thêm một **vòng quầng** mảnh màu vàng lá sáng,
+     vẽ dần theo chiều kim đồng hồ từ đỉnh. Trăng vẫn giữ đúng pha đêm nay; chỉ quầng là tiến độ.
+     - Quầng hiện từ `loading`, rồi nhích qua hai mốc: tải xong code 3D (`chunk`), dựng xong renderer và bức (`compiling`). Mỗi mốc
+       đặt một đích; quầng bò chậm dần về đích đó, nên mạng chậm vẫn thấy nó nhích chứ không đứng hẳn. Không có mốc "biên dịch
+       xong" hay "vẽ xong khung ẩn": khung ẩn chặn luồng chính, mà `fading` tới ngay sau nó trong cùng một tác vụ (§8.5).
      - Quầng đầy ở `fading` rồi tan cùng lúc hòa dần. Tầng tĩnh không có quầng; rơi về tĩnh giữa chừng thì quầng biến mất ngay.
        "Dựng lại cảnh" vẽ quầng lại từ đầu.
      - Quầng chỉ để nhìn (`aria-hidden`, như trăng). Người xem xin giảm chuyển động thì quầng nhảy thẳng tới từng mốc, không bò.
+     - Vòng vẽ ở tọa độ riêng lớn gấp 100 rồi thu lại: `<circle r="105" pathLength="1" transform="rotate(-90) scale(0.01)">`, nét 9,
+       `stroke-dasharray: 1 2`. Trên trăng (bán kính 1) là bán kính 1,05 và nét 0,09, chừng 1,6 px ở trăng 40 px. Vẽ thẳng ở tọa độ
+       nhỏ thì Chrome đo `pathLength` quá thô và vòng không bao giờ khép (Phụ lục A.54).
      - Chi tiết ở §8.5.
 2. **Ngắm (mặc định):** không có UI.
    - Chỉ có câu thơ ở góc và camera chuyển động chậm như đang thở (GĐ 1).
@@ -205,8 +215,18 @@ Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau
      hai cần cảnh 3D.
    - Mỗi lúc chỉ bật được **một** công cụ: bật cái này thì cái kia tắt. Bấm lại nút đang bật, hay đóng thanh lớp, thì công cụ tắt
      và tranh về ảnh cuối.
-   - Công cụ đang bật hiện thanh điều khiển của nó: trên máy tính ở giữa đáy tranh, trên điện thoại ngay trên dải thanh lớp.
-     Trên điện thoại, Sổ tay thu lại khi một công cụ bật, để chừa chỗ nhìn cảnh.
+   - Công cụ đang bật hiện thanh điều khiển của nó: trên máy tính ở đáy tranh, trên điện thoại ngay trên dải thanh lớp.
+   - (GĐ 5) **Bảng công cụ không bao giờ nằm dưới thanh lớp hay Sổ tay** (GĐ 4 chỉ thu Sổ tay lại trên điện thoại, nên trên máy
+     tính dưới chừng 1500 px Sổ tay che mất một phần bảng; chi tiết ở §7 "Thanh công cụ"):
+     - xưởng đóng: bảng ở giữa đáy cả khung, như GĐ 4;
+     - máy tính, thanh lớp mở: bảng ở giữa khoảng trống sau thanh lớp. Từ 1240 px trở lên, khoảng trống đó dừng trước chỗ của Sổ
+       tay, cả khi người xem đóng Sổ tay (bảng không nhảy chỗ);
+     - hẹp hơn 1240 px (máy tính hẹp và điện thoại, một ngưỡng chung): Sổ tay thu lại khi một công cụ bật, hiện lại khi tắt. Trong
+       lúc đó, bấm tên lớp hay "Phủ lớp tiếp theo" vẫn đổi trang của Sổ tay đang ẩn; tắt công cụ thì thấy trang ấy (điện thoại vốn
+       vậy từ GĐ 4);
+     - Tab: từ nút công cụ trên thanh lớp, Tab đi qua phần còn lại của thanh lớp rồi vào thẳng bảng của công cụ, sau đó mới tới Sổ
+       tay (WCAG 2.4.3). Trang làm được nhờ thứ tự DOM (thanh lớp → thanh công cụ → Sổ tay), không chuyển focus khi bật công cụ:
+       người dùng chuột không bị nhảy focus.
    - (GĐ 5) Đồ nghề có thêm **Từng sợi** (§7): dựng lại khung hình từng lần vẽ một, theo đúng thứ tự GPU nhận.
 7. **Núm của bức (Dial, GĐ 4):** xưởng vẽ thanh trượt cho mọi Dial mà bức khai báo. Thanh trượt nằm trong thanh lớp, dưới "Đồ nghề".
    - Mỗi Dial là một `input type="range"`:
@@ -229,11 +249,27 @@ Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau
 10. **Chữ đi theo vật (GĐ 5):** bức có thể cho một dòng chữ (thơ, chú thích) hiện cạnh một điểm trong cảnh và đi theo điểm đó.
     - Chữ nằm ở `content.captions[key]`, cùng dạng với thơ của meta: `{ lines, source, author? }`. Bức gọi
       `ctx.captions.show(key, anchor)`, với `anchor()` trả vị trí 3D của điểm neo ở mỗi khung (§8.4).
-    - Mỗi lúc một dòng: dòng mới thay dòng đang hiện. Chữ hiện mờ dần, đứng chừng 9 giây theo đồng hồ của cảnh, rồi tan.
+    - Mỗi lúc một dòng: dòng mới thay dòng đang hiện. Chữ hiện mờ dần (0,8 giây), đứng 9 giây theo đồng hồ của cảnh
+      (`CAPTION_SECONDS`), tan trong 1,2 giây cuối (`CAPTION_FADE`); hai số nằm ở `ui/captions.js`. `?freeze` đứng đồng hồ thì chữ ở lại.
+    - Chỗ đặt: chữ đứng ngay TRÊN điểm neo, căn giữa theo chiều ngang, cách điểm neo một khe nhỏ (padding dưới 10 px).
+      - Điểm neo sát mép thì chữ dừng ở mép mà vẫn ở trên điểm: cả khung chữ (kể cả lề 16 px hai bên, bằng lề của khung trên điện
+        thoại) luôn ở trong màn hình. Chữ rộng tối đa `min(26rem, 90vw)`: một câu lục bát vừa một hàng ở 360 px.
+      - Điểm neo thấp hơn mép trên của chân khung (gợi ý hay lời mời, thơ, trăng, con dấu: `[data-hint], [data-poem], [data-seal],
+        [data-moon]`, ô cao 0 thì bỏ qua) thì chữ dừng ở mép đó, vẫn đi theo điểm neo sang ngang. `main.frame` vẽ đè lên vùng chữ:
+        xuống thấp hơn là hai lớp chữ in chồng lên nhau. Màn thấp quá, không đủ chỗ cho cả hai, thì giữ cả câu (mép trên thắng).
+        Bao chọn cách này thay cho làm mờ thơ khi có chữ (mục 2: thơ luôn hiện).
+      - Giới hạn đã biết: cỡ chữ và chân khung chỉ đo một lần cho mỗi dòng (lúc `show`, một lần tính bố cục). Gợi ý đổi hay xoay
+        máy giữa chừng thì số đo lệch trong mấy giây còn lại của dòng đó (§16).
     - Vùng chứa chữ là một `aria-live="polite"` phủ lên canvas. Theo luật của vùng live, nó không bao giờ `hidden` và để trống khi
       không có chữ. Trình đọc màn hình đọc câu chữ và nguồn.
-    - Điểm neo ra ngoài khung hay ra sau camera thì chữ ẩn đi (vẫn nằm trong vùng live).
-    - `?poster` không có chữ. Người xem xin giảm chuyển động thì chữ không mờ dần. Tầng tĩnh không có cảnh nên không có chữ.
+    - Điểm neo ra ngoài khung hay ra sau camera thì chữ mang `data-away` (CSS đưa opacity về 0 ngay), không bao giờ `hidden`:
+      `hidden` (display: none) gỡ chữ khỏi cây trợ năng, nên vào lại khung là trình đọc màn hình đọc lại cả câu, và còn hủy
+      transition (Phụ lục A.57). Vào lại khung thì chữ mờ dần hiện ra. "Trong khung" là: độ sâu trong tọa độ camera nằm trong
+      [near, far], và x, y của NDC trong [−1, 1]; không xét z của NDC (Phụ lục A.56).
+    - `anchor()` trả `null` là khung đó không có điểm neo (Bức 1: đèn đã chìm hẳn): chữ ẩn, không cảnh báo. Trả `undefined`, số
+      không hữu hạn hay ném lỗi là lỗi của bức: chữ ẩn ở khung đó, cảnh báo một lần cho mỗi dòng (§9).
+    - `?poster` không có chữ. Người xem xin giảm chuyển động thì chữ hiện và tắt ngay, không mờ dần, cũng không tan sớm: dòng đứng
+      nguyên tới hết 9 giây. Tầng tĩnh không có cảnh nên không có chữ.
 
 ### 4.2 Trải nghiệm riêng của Bức 1 · Ao Sen Đêm
 - Gợi ý duy nhất: *"Chạm vào mặt nước"*, lấy từ `content.hint` (GĐ 1). (GĐ 5) Gợi ý thành *"Chạm vào mặt nước · chạm hai lần để
@@ -249,15 +285,31 @@ Ao Sen Đêm là **Bức 1**. Đèn kéo quân, Đông Hồ, Cung Quế về sau
 - (GĐ 5) **Thả hoa đăng:** chạm hai lần lên nước.
   - Mỗi lần chạm vẫn là một lần chạm, nên hai vòng gợn lan ra. Giữa vòng gợn hiện một búp hoa đăng, nở đủ 8 cánh trong khoảng
     1,5 giây.
-  - Một cặp câu thơ cùng nguồn hiện phía trên ngọn đèn và đi theo nó (chữ đi theo vật, §4.1 mục 10; danh sách thơ ở §5).
+  - Một cặp câu thơ cùng nguồn hiện phía trên ngọn đèn và đi theo nó (chữ đi theo vật, §4.1 mục 10; danh sách thơ ở §5). Điểm
+    neo cao 0,9 trên mặt nước, trên ngọn nến một chút; đèn chìm hẳn thì `anchor()` trả `null` và chữ ẩn.
   - Đèn trôi chậm ra xa về phía lối trăng. Hướng trôi lấy theo trăng lúc thả, nên kéo thanh giờ sau đó không làm đèn đổi đường.
     Đèn lắc nhẹ, nhấp nhô khi gợn đi qua, hắt một vũng sáng ấm trên nước, hiện trong ảnh phản chiếu, và mờ dần trong sương.
-  - Tới gần mép ao, hoặc sau 90 giây, đèn chìm dần trong 3 giây rồi tắt.
-  - Ao giữ tối đa 8 đèn trôi ở mức cao, 6 ở mức vừa, 4 ở mức thấp (`budget.lanterns`). Thả thêm thì đèn cũ nhất chìm sớm.
-  - **Thứ tự thơ:** PRNG (`lib/random.js`) xáo danh sách, hạt giống là số ngày (theo giờ Việt Nam) của `ctx.now`. Mỗi đêm một thứ
-    tự khác; cùng `?at` thì cùng thứ tự, nên e2e đoán trước được. Hết danh sách thì quay lại từ đầu.
+    - (Dựng thử) Đèn nhắm tới một điểm trên lối trăng: cách chỗ đứng của camera trên mặt nước, (0, 32), 100 đơn vị theo phương vị
+      của trăng (`driftDirection`). Điểm đó luôn ở ngoài ao (cách tâm ít nhất 100 − 32 = 68 > 60), nên đèn thả ở đâu cũng trôi ra
+      xa; đích mà nằm trong ao thì đèn thả xa hơn đích sẽ quay đầu về phía người xem.
+    - Tốc độ đều 0,6 đơn vị/giây, tăng mềm trong vài giây đầu. Đo trên màn hình (1280×800 và 390×844): đèn thả trước mặt đi chừng
+      7 px/giây lúc đầu, 3,5 px/giây ở giây 30 (đã vào lối trăng), 1 px/giây khi đã xa.
+  - Tới vùng mép (còn cách bờ 4 đơn vị), hoặc sau 90 giây, đèn chìm dần trong 3 giây rồi tắt: nhỏ đi 35% và xuống thấp 0,45 đơn vị,
+    nên cả mũi cánh lặn dưới mặt nước trước khi đèn bị giấu (lặn chứ không biến mất). Thả ở dải sát bờ mà hướng trôi ra ngoài thì
+    đèn chìm ngay từ lúc thả, và không tính là một đèn nổi: không bắt đèn nào khác chìm theo.
+  - Ao giữ tối đa N đèn trôi (N = `budget.lanterns`: 8 ở mức cao, 6 ở mức vừa, 4 ở mức thấp); thêm một ô cho đèn cũ đang chìm.
+    Thả đèn thứ N + 1 thì đèn thả sớm nhất bắt đầu chìm ngay, chìm dần trong 3 giây ở ô thừa đó. Số đo "Hoa đăng đang trôi" đếm
+    cả đèn đang chìm, nên có thể là N + 1 trong tối đa 3 giây. Thả dồn dập tới mức mọi ô đều có đèn thì ô có đèn chìm lâu nhất
+    được dùng lại.
+  - **Thứ tự thơ:** PRNG (`lib/random.js`) xáo danh sách, hạt giống là số thứ tự của ĐÊM chứa `ctx.now`: một đêm tính từ 12 giờ
+    trưa tới 12 giờ trưa hôm sau, giờ Việt Nam, nên cả đêm của bức (18:00 → 05:30) chỉ có một thứ tự, không đổi lúc nửa đêm. Mỗi
+    đêm một thứ tự khác; cùng `?at` thì cùng thứ tự, nên e2e đoán trước được (`verseOrder(keys, parseAt(at))`). Hết danh sách thì
+    quay lại từ đầu.
   - Mài lớp Ánh trăng về 0 thì đèn thành đất sét, không sáng, và vũng sáng tắt. Chữ vẫn hiện: chữ là giao diện, không thuộc lớp nào.
-  - Chạm hai lần ngoài ao (lên trời) thì không có gì, như chạm.
+  - Chạm hai lần ngoài ao (lên trời) thì không có gì, như chạm, và không tốn câu nào của danh sách.
+  - Kính mài đang bật ở hình tròn thì cú chạm hai lần của ngón tay hay bút là của kính (§7), nên không thả đèn ngoài ý người xem;
+    nhấp đúp chuột vẫn thả. Ở hình gạt, canvas không giữ cử chỉ nào (tay nắm là một phần tử riêng), nên chạm hai lần lên nước vẫn
+    thả đèn.
 
 ## 5. Chỉ đạo nghệ thuật
 
@@ -295,7 +347,8 @@ Nguồn là trường bắt buộc `poem.source` trong meta.
 - Lớp nào cũng có thể thêm một câu ngắn khác, nhưng phải là văn học dân gian hoặc cổ điển đã hết bản quyền, và phải ghi nguồn.
 - (GĐ 5) **Thơ của hoa đăng** (`content.captions`, mỗi mục một cặp câu cùng nguồn). Mười hai mục, đều là ca dao hay thơ cổ điển
   đã hết bản quyền (Nguyễn Trãi thế kỷ 15, Hồ Xuân Hương và Nguyễn Du đầu thế kỷ 19, Nguyễn Khuyến mất năm 1909). Thứ tự hiện xáo
-  theo ngày (§4.2). Khóa trong ngoặc là id của mục.
+  theo đêm (§4.2). Khóa trong ngoặc là id của mục. Chữ nằm ở `content.captions.vi.js` (`content.vi.js` gộp vào `captions`; tách
+  riêng để `content.vi.js` dưới 300 dòng): ca dao ghi `source: 'Ca dao'`, mục khác ghi tên bài ở `source` và tác giả ở `author`.
   1. *"Đèn khoe đèn tỏ hơn trăng / Đèn ra trước gió còn chăng hỡi đèn?"* (ca dao) `den-khoe`
   2. *"Trăng khoe trăng tỏ hơn đèn / Cớ sao trăng lại chịu luồn đám mây?"* (ca dao) `trang-khoe`
   3. *"Thuyền về có nhớ bến chăng? / Bến thì một dạ khăng khăng đợi thuyền"* (ca dao) `thuyen-ve`
@@ -328,6 +381,12 @@ ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc địn
   390×844. LUT 0,6 làm sương chân trời ngả cam. Chọn `lutIntensity` 0,45, `vignette` 0,45, `grain` 0,03: 54,3 / 0,43 / 12,2% và
   62,5 / 0,39 / 7,1%, tức nhích về phía poster cũ (33 / 0,42 / 30%) mà không bệt. Ba số nằm trong một commit riêng.
 
+(GĐ 5) Tinh chỉnh trên GPU thật (1280×800 và 390×844) chỉ đổi số của hoa đăng, chữ đi theo vật và quầng trăng, trong một commit
+riêng: vũng sáng `POOL` (bán kính 1,6 → 1,1), lề hai bên và bề rộng của chữ (12 → 16 px, `min(26rem, 80vw)` → `90vw`), quầng
+(bán kính 104 → 105 và nét 7 → 9 ở tọa độ riêng; số giây bò của `loading`, `chunk`, `compiling` từ 6, 3, 4 thành 10, 4, 3). Tốc độ
+trôi giữ 0,6. Cảnh mặc định (không có đèn thả) giống từng điểm ảnh trước và sau lượt chỉnh này. So với bản GĐ 4, chỉ đèn ở bờ
+khác: tối đi chừng 1% vì hệ số sương mà mọi đèn chung (§6 Lớp 3). Vì vậy không chụp lại poster.
+
 ### Chi tiết sống
 - **Trăng đúng pha của đêm hôm đó**, tính từ `ctx.now`. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
 - **Con dấu đỏ ghi ngày âm lịch** ở góc tranh, ví dụ *"18 tháng Tám · Bính Ngọ"*. Bức nào cũng có (luật 5).
@@ -347,7 +406,8 @@ ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc địn
 
 **Tên vật (GĐ 5):** mọi vật trong `layer.objects` có `name` (kebab-case không dấu, không trùng trong lớp), kể cả vật mà thí nghiệm
 thêm vào. Nhãn cho người xem nằm ở `content.layers[id].objects[name]`. Từng sợi (§7) hiện nhãn này; Inspector của `?debug` cũng
-hiện tên. Test hợp đồng giữ luật này (§12).
+hiện tên. `tests/paintings/objects.test.js` giữ luật này (§12). Vật là con của một vật trong `objects` (như các Mesh rời trong
+Group `la-rieng`) không cần tên riêng: Từng sợi gán nó cho vật cha.
 
 **Kiểu núm** (`Knob.via`):
 - `uniform` (mặc định): không biên dịch lại.
@@ -410,22 +470,40 @@ hiện tên. Test hợp đồng giữ luật này (§12).
   - Hướng trăng đổi thì bộ canh bóng sẵn có vẽ lại bóng một lần (`shadow.needsUpdate`). Việc này xảy ra cả khi vẽ lại lúc `?freeze`,
     vì xưởng gọi `update(0, t)` (§8.4).
 - (GĐ 5) **Hoa đăng** (§4.2). `parts/anh-trang-lantern.js` dựng và vẽ đèn; `parts/anh-trang-drift.js` là hàm thuần (đường trôi,
-  vòng đệm, thứ tự thơ), không import three.
-  - **Một InstancedMesh cho mọi đèn:** đèn ở bờ và mọi hoa đăng thả ra là MỘT `InstancedMesh` gồm `(1 + budget.lanterns) × 8`
-    cánh, tên `hoa-dang`, một draw call. 8 cánh đầu là đèn ở bờ: đứng yên, vẫn có `PointLight` như cũ. Ô hoa đăng trống có cỡ 0, và
-    `count` không bao giờ đổi.
+  vòng đệm, thứ tự thơ), không import three (chỉ `lib/random.js`), nên test và e2e gọi thẳng được. `files` của lớp kê cả hai.
+  - **Vòng đệm N + 1 ô:** `setup()` của bức dựng `shared.lanterns = createLanternSlots(budget.lanterns, { pond: POND_RADIUS })`:
+    N ô cho đèn nổi, một ô cho đèn cũ đang chìm (§4.2). `release({ x, z, t, dir, key })` ghi một lần thả và trả số ô (mỗi lần thả
+    tự lấy một pha lệch góc vàng, ≈ 137,5°: hai đèn liền nhau quay mặt và lượn khác nhịp); `alive(t)` đếm đèn còn sống.
+  - **Một InstancedMesh cho mọi đèn:** đèn ở bờ và mọi hoa đăng thả ra là MỘT `InstancedMesh` gồm `(1 + slots.length) × 8` =
+    `(2 + budget.lanterns) × 8` cánh (80 ở mức cao), tên `hoa-dang`, một draw call. 8 cánh đầu là đèn ở bờ: đứng yên, vẫn có
+    `PointLight` như cũ. Ô trống có ma trận cỡ 0 đặt ngay ở đèn ở bờ (không làm khung bao phình ra), và `count` không bao giờ đổi.
+  - **Dáng đèn:** búp vừa thả có cánh chụm vào trên ngọn nến (góc ngả `CLOSED_TILT` = +0,25 quanh trục X của cánh; dấu theo quy
+    ước cánh sen của Cốt: âm là mũi cánh ngả ra ngoài, dương là chụm vào), rồi nở dần trong 1,5 giây tới đúng góc của đèn ở bờ
+    (−0,45). Chìm: nhỏ đi 35% và xuống 0,45 đơn vị (`SINK`), đủ để cả mũi cánh ở dưới mặt nước (y = 0) ở khung cuối trước khi ô bị
+    giấu (test giữ).
   - **Chung material:** núm `candleColor` và thí nghiệm "Đổi màu đèn" áp cho mọi đèn. Trọng số 0 thì mọi đèn là đất sét, không sáng.
+    Độ sáng riêng của từng đèn đi qua thuộc tính instance `lanternGlow` (đèn ở bờ luôn 1; hoa đăng sáng dần lúc thả, tắt dần khi chìm).
   - **Hoa đăng không có đèn thật:** số đèn nằm trong cache key, nên thêm đèn lúc chạy là mọi material biên dịch lại; mỗi đèn thật
     còn làm mọi điểm ảnh có chiếu sáng tính thêm một lần. Hoa đăng chỉ tự phát sáng (emissive, nên có bloom). Vũng sáng trên nước do
     lớp Mặt nước vẽ.
   - **Đường trôi tính thẳng theo thời gian:** `lanternAt(ô, t)` trả vị trí, góc xoay, độ nở và độ sáng từ công thức, không cộng dồn
     từng khung. Vì vậy `update(0, t)` lúc `?freeze` cho đúng khung N, và test kiểm được bằng số.
-  - **Mỗi khung:** khi có đèn đang trôi, CPU viết lại ma trận của các cánh đang trôi (tối đa 64) và thuộc tính instance
-    `lanternCenter` (tâm đèn, vec2) cho lớp Mặt nước. Không có đèn trôi thì không ghi gì.
+  - **Mỗi khung** (`write(t)`, cả khi vẽ lại bằng `update(0, t)`): khi có đèn còn sống, CPU viết lại ma trận cánh của chúng (tối
+    đa `(lanterns + 1) × 8` = 72 ở mức cao) và hai thuộc tính instance: `lanternCenter` (tâm đèn, vec2, cho lớp Mặt nước) và
+    `lanternGlow`; đèn vừa tắt được ghi thêm MỘT khung để giấu. Rồi `computeBoundingSphere()`: `setMatrixAt` không cập nhật khung
+    bao, mà frustum culling dùng nó (Phụ lục A.63). "Không có đèn trôi thì không ghi gì" là nói việc ghi của CPU: không ghi, không
+    đánh dấu `needsUpdate`.
+    - Hai thuộc tính instance để usage mặc định, không `DynamicDrawUsage`: ở r186 cờ đó tải lại thuộc tính ở MỌI lần render, bất kể
+      version (Phụ lục A.62).
+    - Ma trận (80 × 64 byte = 5 KB, dưới giới hạn uniform buffer) đi theo uniform buffer của từng lượt vẽ, mà r186 chép lại ở MỖI
+      lượt vẽ dù có `needsUpdate` hay không (Phụ lục A.64): rẻ, và không tránh được.
   - **Công bố** `shared.anhTrang.lantern = { material, pool, flame }`: material của đèn (lớp Sương và lớp Mặt nước sửa node của nó),
-    `pool` (một `uniformArray` 8 ô `vec4(x, z, độ sáng, 0)` cùng uniform số đèn đang trôi), `flame` (node màu nến, đã tính
+    `pool = { node, count, size }` (`node`: `uniformArray` `lanterns + 1` ô `vec4(x, z, độ sáng, 0)`, tên `lanternPool`, đèn còn sống
+    dồn lên đầu; `count`: uniform SỐ THỰC `lanternCount`, số đèn còn sống; `size` = `lanterns + 1`), `flame` (node màu nến, đã tính
     "Đổi màu đèn").
-  - **Số đo:** `lanterns` (số hoa đăng đang trôi), nhãn "Hoa đăng đang trôi".
+  - **Số đo:** `lanterns`, nhãn "Hoa đăng đang trôi": số đèn còn sống (đang nổi + đang chìm), nên có thể là N + 1 trong tối đa 3
+    giây (§4.2). `__sma.readouts('anh-trang')` đọc được số này (§9).
+  - **Núm:** `candleIntensity` giờ chỉ đổi đèn thật ở bờ, nên nhãn đổi thành "Độ sáng đèn thật ở bờ" (id giữ nguyên: API công khai).
   - **Hiểu:** viết lại để thêm ý "đèn thật và vật tự phát sáng", vẫn trong 150 chữ. "Bạn vừa học" thêm một dòng: đèn thật chiếu
     sáng mọi thứ quanh nó nhưng thêm lúc chạy là biên dịch lại; vật tự phát sáng rẻ hơn nhiều nhưng không chiếu sáng gì.
   - **Tên vật:** `trang`, `hoa-dang`.
@@ -478,6 +556,11 @@ hiện tên. Test hợp đồng giữ luật này (§12).
   Đưa ra một nấc không tác dụng là trái luật "lớp chỉ đưa nấc có tác dụng ở mức hiện tại".
 - (GĐ 5) **Hoa đăng trong sương:** nhân `emissiveNode` của đèn (`shared.anhTrang.lantern.material`) với `(1 − fogFactor)`, như đom
   đóm: đèn ở xa không bloom xuyên sương. Đây đúng là cách lớp sau sửa node của lớp trước, trước khi biên dịch. Tên vật: `vom-troi`.
+  - Khác đom đóm, đèn vẫn để `fog = true` (sương trộn màu đầu ra), nên trong ảnh chính phần tự phát sáng bị nhân `(1 − hệ số)` hai
+    lần, kênh bloom một lần. Đèn không dùng `mrtNode` để chỉ làm mờ kênh bloom được: reflector vẽ đèn vào ảnh không có MRT (Phụ lục
+    A.19).
+  - Mọi đèn chung material, nên đèn ở bờ cũng mờ theo sương. Đo ở khung poster trên GPU thật: so với bản GĐ 4, cả cảnh mặc định chỉ
+    khác ở đèn ở bờ, tối đi chừng 1%. Vì vậy không chụp lại poster.
 
 ### Lớp 4 · Mặt nước: phản chiếu và gợn sóng (`layers/l4-mat-nuoc.js`)
 - **Thấy gì:**
@@ -492,7 +575,10 @@ hiện tên. Test hợp đồng giữ luật này (§12).
   - UV phản chiếu lệch theo normal: `refl.uvNode = refl.uvNode.add(normal.xz × distortion)`. Normal lấy từ 2 lớp noise trôi cộng trường gợn sóng.
   - Pha giữa phản chiếu và màu nước sâu bằng Schlick fresnel.
   - **Gợn sóng (GĐ 1):**
-    - `uniformArray` 8 phần tử `vec4(x, z, startTime, amp)` dùng như ring buffer. Chỉ cần sửa `array[i]`, three tự tải lại mỗi khung.
+    - `uniformArray` 8 phần tử `vec4(x, z, startTime, amp)` dùng như ring buffer. Chỉ cần sửa `array[i]`: ở mỗi lượt vẽ có dùng
+      mảng, three tự chép mảng vào bộ đệm của nó. (GĐ 5 sửa lời: ở r186 bộ đệm đó là một binding riêng trong nhóm uniform của từng
+      vật, `objectGroup`, nên được tải lên GPU ở MỖI lần vẽ có dùng nó (nước, lá, hoa đăng), không phải một lần mỗi khung; mảng chỉ
+      8 × 16 byte nên vẫn rẻ. Phụ lục A.64.)
     - **Một hàm TSL `rippleHeight(xz)` dùng chung**, nằm trong `shared.js` của bức, cho normal của nước lẫn độ nhấp nhô của lá.
     - Lá đọc attribute tâm instance của lớp 1. Trong r186, `positionNode` chạy **sau** instancing.
   - `emissiveNode` của nước lấy phần sáng vượt ngưỡng trong ảnh phản chiếu, nên bóng đom đóm và bóng trăng trên nước cũng bloom nhẹ. Đây là cách duy nhất, vì ảnh phản chiếu không có kênh emissive.
@@ -511,13 +597,20 @@ hiện tên. Test hợp đồng giữ luật này (§12).
 - **Núm:** `amplitude`, `speed`, `decay`, `wavelength`, `distortion`, `fresnelPower` (uniform), `reflectionResolution` (js, 0.1–1).
 - **Phá:** *"Độ phân giải 0.1"* (`lowRes`, phản chiếu vỡ hạt), *"Tắt fresnel"* (`noFresnel`), *"Xem heightfield"* (`heightfield`: ảnh xám của độ cao gợn). Hai thí nghiệm sau là uniform bên trong node, không biên dịch lại. Số đo: `reflectionScale`.
 - (GĐ 5) **Hoa đăng trên nước:**
-  - `positionNode` của đèn cộng độ cao gợn tại `lanternCenter`, nhân trọng số của lớp, giống lá. Đèn ở bờ cũng vậy; không có gợn
-    thì đèn đứng yên, nên poster không đổi.
-  - **Vũng sáng:** nước cộng vào `emissiveNode` một quầng ấm quanh mỗi đèn đang trôi: `Σ exp(−d²/r²) × độ sáng`, màu `flame`, nhân
-    trọng số của lớp Ánh trăng và của lớp này. Vòng lặp đọc `pool` bằng `Loop` 8 vòng và `Break` khi hết đèn đang trôi (như `fbm`
-    có số octave là node): không có đèn trôi thì shader không chạy vòng nào.
-  - Vũng sáng không vào kênh emissive (`mrtNode` giữ nguyên): chỉ ngọn đèn tỏa, mặt nước quanh nó thì không. Dựng thử mà thấy
-    nhạt thì cho phần vượt `GLINT` vào, như bóng trăng.
+  - `positionNode` của đèn cộng độ cao gợn tại `lanternCenter`, nhân trọng số của lớp, giống lá (`BOB` 0,6). Đèn ở bờ cũng vậy;
+    không có gợn thì đèn đứng yên, nên poster không đổi.
+    - (Dựng thử) Độ nhấp nhô còn nhân `lanternGlow` (đã gồm `1 − độ chìm`): đèn đang chìm thôi nhấp nhô cùng lúc với tắt dần. Ở
+      khung cuối, mũi cánh chỉ còn dưới mặt nước chừng 0,06; sóng mà vẫn nâng đèn thì mũi cánh nhô lên đúng lúc ô bị giấu (đèn
+      "bật" mất thay vì lặn). Đèn ở bờ có độ sáng luôn 1, nên nhấp nhô đủ.
+  - **Vũng sáng:** nước cộng vào `emissiveNode` một quầng ấm quanh mỗi đèn còn sống: `Σ exp(−d²/r²) × độ sáng`, màu `flame`, nhân
+    trọng số của lớp Ánh trăng và của lớp này; "Xem heightfield" tắt nó như tắt ảnh phản chiếu. Vòng lặp đọc `pool` bằng `Loop`
+    `pool.size` vòng (`lanterns + 1`: 9 / 7 / 5) và `Break` khi chỉ số (đổi sang float) chạm `lanternCount` (như `fbm` có số octave
+    là node): không có đèn trôi thì vòng đầu đã `Break`, shader không cộng ô nào. Đèn ở bờ không có trong mảng: nó có đèn thật
+    chiếu xuống nước rồi.
+    - `POOL = { radius: 1.1, intensity: 0.6 }`, chốt trên GPU thật: bán kính 1,6 lúc đầu trải một vệt vàng rộng gấp chục lần ngọn
+      đèn, mặt nước quanh đèn bạc thành màu be; 1,1 giữ ánh nến quanh chân đèn, cách đèn chừng hai đơn vị nước lại đen như sơn mài.
+  - Vũng sáng không vào kênh emissive (`mrtNode` giữ nguyên): chỉ ngọn đèn tỏa, mặt nước quanh nó thì không. Dựng thử trên GPU thật
+    thấy đủ, nên không cho phần vượt `GLINT` vào.
   - Tên vật: `mat-nuoc`.
 
 ### Lớp 5 · Vàng lá: đom đóm tính trên GPU (`layers/l5-vang-la.js`)
@@ -630,6 +723,35 @@ Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về k
 
 ## 7. Công cụ học
 
+**(GĐ 5) Thanh công cụ** (`[data-toolbar]`, chung cho mọi công cụ). Sửa lỗi có từ GĐ 4: ở 1280×800, khi thanh lớp và Sổ tay cùng
+mở, Sổ tay che 112 px của bảng Từng sợi, kể cả nút "Dệt lại" (Kính mài mất nút view cuối theo cùng cách).
+- Bề rộng ở `:root` của `notebook.css`: `--rail-w: 224px`, `--notebook-w: min(440px, calc(100vw - 300px))`. Thanh lớp, Sổ tay và
+  `tools.css` cùng đọc hai biến này.
+- Thanh lớp mở (`.rail:not([hidden]) ~ .toolbar`: đọc bằng bộ chọn anh em, vì thanh công cụ đứng ngay sau thanh lớp trong trang;
+  không dùng `:has()`, thứ trình duyệt cũ ở tầng WebGL2 có thể chưa có; không thêm thuộc tính nào cho `body`):
+  - mặc định, ngoài mọi `@media`: bảng bắt đầu sau thanh lớp một khe 16 px (`left: calc(var(--gutter) + var(--rail-w) + 16px)`,
+    `right: var(--gutter)`);
+  - `@media (min-width: 1240px)`: thêm `right: calc(var(--gutter) + var(--notebook-w) + 16px)`, bảng ở giữa khoảng trống giữa thanh
+    lớp và chỗ của Sổ tay;
+  - `@media (max-width: 640px)`: `left: 0; right: 0` (điện thoại: bảng trải ngang ngay trên dải thanh lớp).
+- `@media (max-width: 1239.98px)`: `body[data-tool] .notebook { display: none }`. Ngưỡng 1240 = 2 lề 32 + thanh lớp 224 + Sổ tay
+  440 + 2 khe 16 + 480, bề rộng hẹp nhất mà bảng còn dùng được (đo trên GPU thật: hàng của Từng sợi trên một dòng là 451 px, cộng
+  26 px đệm và viền là 477 px; Kính mài 475 px, Lột lớp 458 px). `tests/unit/shell-css.test.js` tính lại ngưỡng từ các biến.
+- Các cặp ngưỡng bù nhau, không hở: bề rộng CSS có thể lẻ (zoom trình duyệt hay tỉ lệ hiển thị của hệ điều hành: cửa sổ 1549 px
+  ở 125% là 1239,2 px), nên không có cặp `max-width: 1239px` / `min-width: 1240px` hay `max-width: 640px` / `min-width: 641px`
+  (Phụ lục A.74).
+- `max-width` của `.tool-panel` trên máy tính giữ `min(560px, calc(100vw - 2 * var(--gutter)))`, không có phần trăm. Bảng nằm trong
+  ô `.tool`, mà ô là phần tử flex của thanh: phần trăm ở đó "vòng" lúc tính bề rộng nội dung của ô, và Chromium bỏ cả `max-width`,
+  kể cả 560 px (Phụ lục A.73). Trên điện thoại `max-width: 100%` (chỉ phần trăm) thì không sao.
+- Thứ tự trong trang: thanh lớp → thanh công cụ → Sổ tay (Tab đi theo thứ tự DOM, WCAG 2.4.3). `toolbox.js` gắn thanh công cụ ngay
+  sau `[data-rail]` nếu đã có ("Dựng lại cảnh"), không thì cuối `body`; `workshop.js` mở lần đầu thì đặt thanh lớp ngay trước và Sổ
+  tay ngay sau `[data-toolbar]` đã có. z-index (thanh công cụ 1 < thanh lớp, Sổ tay 2), không phải thứ tự DOM, giữ thanh công cụ và
+  tay nắm gạt (cao cả khung) ở dưới hai tấm.
+- Vẫn không `transform`, `filter`, `backdrop-filter` trên `.toolbar` và `.tool` (GĐ 4: tay nắm gạt là con `position: fixed`).
+- Quét trên GPU thật (26 bề rộng từ 360 tới 2560 px ở cao 800, 8 bề rộng ở cao 400): không tấm nào chồng lên nhau, bảng nằm trong
+  khung nhìn, mọi nút bấm trúng, tay nắm của Kính mài vẫn đo theo khung nhìn. Từ 641 tới 783 px, hàng của bảng xuống 2–3 dòng mà
+  vẫn dùng được.
+
 ### Kính mài (công cụ của xưởng, `engine/tools/kinh-mai.js`, GĐ 4)
 - **Uniform:** `uLensPos` (tọa độ màn hình), `uLensRadius`, `uLensMode`.
 - **Chế độ:** lấy từ `pipeline.views()`, không liệt kê cứng. Có `final`, `emissive`, `normal`, `depth`, cộng các tap của lớp.
@@ -658,6 +780,9 @@ Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về k
   khiển; tắt công cụ thì hiện lại.
 - (GĐ 4) **Cử chỉ:** kính chỉ giữ cú chạm và cú giữ của ngón tay hay bút (`g.pointer !== 'mouse'`). Trên máy tính, bấm chuột dưới kính
   vẫn tạo gợn sóng như thường.
+  (GĐ 5) Kính tròn giữ cả cú chạm hai lần của ngón tay hay bút: hai `tap` làm nên nó đã là của kính, nên bức mà nhận `double-tap`
+  thì làm điều người xem không định (Bức 1 thả hoa đăng). Luật chung ở §8.4 `ToolInstance.onGesture`. Nhấp đúp chuột vẫn tới bức.
+  Hình gạt không giữ cử chỉ nào trên canvas (tay nắm là phần tử DOM riêng), nên mọi cú chạm, kể cả chạm hai lần, vẫn tới bức.
 - (GĐ 4) **`requireView('normal')`**, theo thứ tự:
   1. đổi MRT của scene pass: thêm `normal`, đặt lại blend của `emissive`;
   2. ghép lại overlay của các công cụ lên **chuỗi post cũ**. Không gọi lại `build`/`display`, nên bloom không bị dựng hai lần;
@@ -691,22 +816,45 @@ cho thấy các bước SAU lượt vẽ cảnh (bloom, tone); Từng sợi cho
     thế), nhãn, loại (`Mesh`, `InstancedMesh`, `Sprite`…), số bản (`count`), số tam giác, loại material, và số lần vẽ lồng bên trong.
     Mặt nước kéo theo cả lượt phản chiếu, vì reflector vẽ lại cảnh ngay trước khi nước được vẽ. Mesh nhiều material vẽ mỗi nhóm một
     lần, và vật trong suốt có transmission vẽ hai lượt: mỗi lần là một sợi.
-  - **`limit(k)`:** chỉ vẽ k lần đầu của danh sách đã ghi (so theo vật và material), bỏ qua phần còn lại. `limit(null)` vẽ đủ và ghi
-    lại danh sách ở mỗi khung. k là số nguyên ≥ 0, giá trị khác thì ném lỗi. Đang limit thì danh sách đứng yên (không ghi lại), để
-    thanh không nhảy khi người xem dừng ở một sợi.
+  - **`limit(k)`:** chỉ vẽ k lần đầu của danh sách đã ghi, bỏ qua phần còn lại. So theo vật, material và lượt (khóa
+    `object.id:material.id:passId`), không theo thứ tự: camera dời làm three sắp lại vật đục theo độ sâu, mà sợi đang xem vẫn là
+    những vật ấy. `limit(null)` vẽ đủ và ghi lại danh sách ở mỗi khung. k là số nguyên ≥ 0, giá trị khác thì ném lỗi. Đang limit
+    thì danh sách đứng yên (không ghi lại), để thanh không nhảy khi người xem dừng ở một sợi.
+  - `renderer.info` chỉ về 0 ở nhịp rAF của renderer (`autoReset`), không ở mỗi `render()`: móc lấy hiệu số draw call từ lúc
+    `begin()`. `scene.js` bọc mỗi `pipeline.render()` (cả lần vẽ lại khung đứng yên) bằng `begin()`/`end()`; công cụ không có hai
+    hàm này.
+  - **Chỗ danh sách chưa khớp three** (ghi ở đầu `draws.js`): lần vẽ mà three rồi tự bỏ bên trong `renderObject` (count 0, pipeline
+    chưa biên dịch xong) vẫn được ghi; vật wireframe vẽ đoạn thẳng mà vẫn báo số tam giác của hình (Bức 1 gặp khi bật núm
+    `wireframe` của Cốt); hai nhóm của một Mesh dùng chung một material thì chung một khóa; vật trong suốt DoubleSide không có
+    transmission (`forceSinglePass` false): `renderObject` của three tự vẽ hai lần trong MỘT lần gọi móc, nên đó là một sợi cho hai
+    draw call (lần thừa vào "các lượt khác"), và `limit(k)` giữ hay bỏ cả hai. Bức 1 không có material như thế.
 - **Thanh điều khiển** (trong thanh công cụ, như Lột lớp):
   - Một `input type="range"` từ 0 tới N (N là số lần vẽ của lượt vẽ cảnh). Mở công cụ thì thanh ở N: ảnh không đổi gì. Nấc 0 là
     chưa vẽ gì: chỉ còn màu nền xóa khung (màu xóa của sân khấu, đen then), vẫn qua hậu kỳ.
   - Nút "Dệt lại" (`aria-pressed`) chạy từ 0 tới N, mỗi sợi khoảng 0,6 giây; cả lượt không quá chừng 12 giây, nên nhiều sợi thì đi
     nhanh hơn. Bấm lại thì dừng; kéo thanh cũng dừng.
+    - (Dựng thử) Một bước không ngắn hơn 16 ms, nên quá 750 sợi thì mỗi bước đi `playStride(N) = ⌈N × 16 / 12000⌉` sợi, bước cuối
+      đáp đúng N, mỗi bước `playStepMs(N)` ms: cả lượt vẫn chừng 12 giây (như khi bật "Tắt instancing" ở mức cao: 1.200 sợi thì
+      mỗi bước 2 sợi, 20 ms).
+    - Bước kế tiếp chỉ hẹn giờ khi khung trước đã vẽ lại xong, nên lần vẽ lại chậm lúc `?freeze` không làm các bước dồn lại (ở đó cả
+      lượt dài hơn 12 giây). Vẽ lại hỏng thì "Dệt lại" dừng.
+    - Lúc mới bật, móc chưa ghi khung nào: thanh là 0/0, dòng mô tả ghi "Đang đếm các lần vẽ…", và "Dệt lại" bị khóa (`disabled`);
+      có danh sách thì nút mở và thanh đứng ở nấc N. Đang xem đủ khung thì cứ 250 ms (`POLL_MS`) đọc lại danh sách, thanh theo N mới
+      (camera kéo làm vật ra khỏi khung, thí nghiệm thêm hàng trăm Mesh); chỉ ghi vào DOM khi có gì đổi, để trình đọc màn hình không
+      đọc lại.
+  - Ô số "k/N" (`<output>`) đặt `aria-live="off"`: `<output>` ngầm là `role="status"` (vùng live polite), mà "Dệt lại" ghi số ở
+    mỗi bước (40 ms với 300 sợi) sẽ làm ngập hàng đợi của trình đọc màn hình (Phụ lục A.68). Tiến độ tới người nghe qua
+    `aria-valuetext` của thanh.
   - Dòng mô tả sợi đang xem: nhãn vật (`content.layers[id].objects[name]`; thiếu thì dùng tên vật), tên lớp, loại, số bản, số tam
-    giác. Mặt nước thêm "trước đó vẽ lại {n} lần cho ảnh phản chiếu". `aria-valuetext` = "Sợi k trên N: nhãn vật".
+    giác. Mặt nước thêm "Trước khi vẽ vật này, GPU vẽ lại {n} lần cho ảnh phản chiếu.". `aria-valuetext` = "Sợi k trên N: nhãn vật"
+    ("Sợi 0 trên N: chưa vẽ gì" ở nấc 0). Số viết kiểu Việt (1.200).
   - Dòng tóm tắt khung: lượt vẽ cảnh {a} · phản chiếu {b} · các lượt khác (bóng, bloom, hậu kỳ) {c} draw call. {c} = tổng của
     `renderer.info` trừ hai số kia.
 - **Điều Từng sợi dạy được, nói ngay trong dòng mô tả:**
   - Bóng đổ và ảnh phản chiếu là các lượt riêng, nên luôn đủ. Tới sợi của mặt nước, nước soi cả cảnh, dù các vật sau nó chưa được vẽ
     ở lượt chính.
-  - Bật "Tắt instancing" thì lá nổi thành hàng trăm sợi: thấy ngay vì sao instancing quan trọng.
+  - Bật "Tắt instancing" thì mỗi lá nổi thành một sợi (hơn nghìn sợi ở mức cao, tối đa 1.200): thấy ngay vì sao instancing quan
+    trọng.
 - **Cử chỉ:** Từng sợi không giữ cử chỉ nào; chạm và chạm hai lần vẫn tới bức.
 - **`?freeze`:** mỗi lần đổi sợi thì vẽ lại đúng khung N (`api.redraw()`).
 - **Bức không biết gì:** Từng sợi chỉ nhìn `ToolApi.draws` (§8.4), chạy trên mọi bức, kể cả `_mau`.
@@ -781,7 +929,7 @@ son-mai-anh-sang/
     poster.js                        [4] Playwright chụp ?at&freeze=N&poster cho một slug (GPU thật); mã hóa WebP/JPEG ngay trong trang
   src/
     engine/                          XƯỞNG: không biết bức nào tồn tại
-      boot.js                        [0→5] khởi động một bức: cờ URL → tầng → tĩnh | import('./gpu/run.js'); GĐ 5: báo mốc 'chunk' cho quầng trăng
+      boot.js                        [0→5] khởi động một bức: cờ URL → tầng → tĩnh | import('./gpu/run.js'); GĐ 5: báo mốc 'chunk' cho quầng trăng; export BOOT_DEADLINE_MS (chặng đầu của quầng bò đúng bằng nó)
       flags.js                       [0→3] đọc cờ URL (§8.7), hàm thuần; GĐ 3: ?level
       tier.js                        [0] dò tầng A/B/C, hàm thuần nhận env
       quality.js                     [0→4] GĐ 0: chọn mức, mức mặc định, isMobile; GĐ 3: bộ điều chỉnh có trễ; GĐ 4: bộ điều chỉnh tách ra tuner.js
@@ -793,7 +941,7 @@ son-mai-anh-sang/
       contracts/painting.js          [0→5] JSDoc hợp đồng NHẸ; GĐ 4: Poster.capture; GĐ 5: PaintingContent.captions, LayerContent.objects
       contracts/runtime.js           [0→5] JSDoc hợp đồng NẶNG; GĐ 4: update(0, t), Gesture 'hover'/pointer, ToolInstance.activate, Studio, Snapshot.dials; GĐ 5: Gesture 'double-tap', EngineCtx.captions, ToolApi.draws
       gpu/                           PHẦN NẶNG: chỉ tải ở tầng A/B
-        run.js                       [0→5] vòng đời: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ; GĐ 2: mất GPU lần đầu → dựng lại; GĐ 4: bộ điều chỉnh đo từ lúc live; GĐ 5: báo mốc 'compiled'
+        run.js                       [0→5] vòng đời: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ; GĐ 2: mất GPU lần đầu → dựng lại; GĐ 4: bộ điều chỉnh đo từ lúc live; GĐ 5: bringUp kiểm gone() trước việc đầu tiên và sau mỗi lần chờ ("Dựng lại cảnh" quá hạn không đụng trang đã về tĩnh), sự kiện GPU đến khi trang đã tĩnh thì bỏ qua (không có code nào của quầng trăng)
         scene.js                     [2→5] dựng MỘT cảnh trên một sân khấu (ctx → setup → lớp → pipeline → input → bàn thợ) + một khung; GĐ 4: đồ nghề, Dial, đo GPU, vẽ lại bằng update(0, t); GĐ 5: chữ đi theo vật, móc lần vẽ
         ladder.js                    [3] thang nấc cụ thể: 'dpr' nở thành nhiều nấc −0,25; '<lớp>.<nấc>' lấy từ layer.degrade
         stage.js                     [0→4] renderer, nền đặc, camera + OrbitControls theo CameraSpec, đồng hồ, resize, DPR, lỗi GPU; GĐ 4: trackTimestamp
@@ -802,7 +950,7 @@ son-mai-anh-sang/
         views.js                     [4→5] danh sách view (kênh, tap, Normal lười), ghép overlay của công cụ, requireView; GĐ 5: scene pass đứng đầu lượt cuối (móc lần vẽ thấy lượt vẽ cảnh)
         gpu-timer.js                 [4] ms GPU mỗi khung: resolveTimestampsAsync (render + compute), không chờ, không gọi chồng
         meter.js                     [4] số đo của bàn thợ: draw call, tam giác, ms, ms CPU, ms GPU; hai bên "Tắt / Bật" của compare
-        toolbox.js                   [4→5] hộp đồ nghề: gắn công cụ, cử chỉ tới công cụ trước bức, mỗi lúc một công cụ, body[data-tool]; GĐ 5: ToolApi.draws
+        toolbox.js                   [4→5] hộp đồ nghề: gắn công cụ, cử chỉ tới công cụ trước bức, mỗi lúc một công cụ, body[data-tool]; GĐ 5: ToolApi.draws (năm hàm của móc), thanh công cụ ngay sau thanh lớp (thứ tự Tab)
         draws.js                     [5] móc lần vẽ cho Từng sợi (setRenderObjectFunction): ghi danh sách lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu; tắt thì gỡ móc
         caption-set.js               [5] chữ đi theo vật: tra content.captions, chiếu điểm neo ra màn hình mỗi khung, hết giờ theo đồng hồ của cảnh
         dial-set.js                  [4] Dial của bức: đọc/ghi (kẹp min/max/step), chữ giá trị, ghi chú, snapshot
@@ -822,7 +970,8 @@ son-mai-anh-sang/
         content.vi.js diagram.svg    [2] Hiểu/Phá/nhãn, viết trung tính; sơ đồ import '?raw'
       tools/
         index.js                     [4→5] [kinhMai, lotLop, tungSoi]; thêm công cụ = thêm 1 dòng
-        kinh-mai.js lot-lop.js       [4] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ
+        kinh-mai.js                  [4→5] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ; GĐ 5: kính tròn giữ cả double-tap của ngón tay, bút
+        lot-lop.js                   [4] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ
         pick.js                      [4] chọn một view theo chỉ số bằng If/ElseIf (hai công cụ dùng chung)
         tung-soi.js                  [5] Từng sợi: thanh trượt 0 → N lần vẽ, nút "Dệt lại", dòng mô tả sợi và tóm tắt khung; chỉ nhìn ToolApi.draws
     lib/                             HỘP MÀU: hàm "lá", chỉ trả SỐ
@@ -835,14 +984,14 @@ son-mai-anh-sang/
       shell.js                       [0→5] poster ↔ canvas, data-state, con dấu, hòa dần; [1]: gợi ý, lời mời "{n} lớp"; [4]: ?poster (body[data-poster]); [5]: progress(mốc) → quầng trăng
       badge.js                       [0→4] huy hiệu tầng + mức, data-backend; GĐ 3: "hạ {n} nấc", data-steps; GĐ 4: nấc bị khóa
       moon-svg.js                    [1] vẽ trăng đúng pha vào [data-moon] nếu trang có ô đó
-      moon-progress.js               [5] quầng trăng tiến độ trong [data-moon]: mốc → độ dài vòng quầng (CSS transition), tan khi hòa dần
-      captions.js                    [5] DOM của chữ đi theo vật: một vùng aria-live phủ lên canvas, mỗi lúc một dòng (câu + nguồn)
-      workshop.js                    [2→4] thanh lớp + Sổ tay + chế độ mài; nhận studio() (null ở tầng tĩnh: chỉ đọc); GĐ 4: Đồ nghề + Dial, đóng thì tắt công cụ
+      moon-progress.js               [5] quầng trăng tiến độ trong [data-moon]: HALO_STEPS (mốc → đích, số giây bò), CSS transition, tan khi hòa dần (CROSSFADE_MS); vòng vẽ ở tọa độ gấp 100 (r 105, rotate(-90) scale(0.01), pathLength 1)
+      captions.js                    [5] DOM của chữ đi theo vật: một vùng aria-live phủ lên canvas, mỗi lúc một dòng (câu + nguồn); giữ chữ trong màn hình và trên chân khung; CAPTION_SECONDS, CAPTION_FADE
+      workshop.js                    [2→5] thanh lớp + Sổ tay + chế độ mài; nhận studio() (null ở tầng tĩnh: chỉ đọc); GĐ 4: Đồ nghề + Dial, đóng thì tắt công cụ; GĐ 5: thanh lớp ngay trước, Sổ tay ngay sau thanh công cụ (thứ tự Tab)
       layer-rail.js notebook.js notebook-pages.js code-view.js dom.js   [2]; GĐ 3: notebook-pages.js vẽ hai cột "Tắt / Bật" của compare; GĐ 4: ms GPU
       knobs.js                       [2] Tweakpane; chỉ được import() động khi tab Chỉnh mở lần đầu
       dials.js                       [4] thanh trượt cho các Dial của bức
       rail-tools.js                  [4] mục "Đồ nghề" (nút aria-pressed của từng công cụ) + Dial, trong thanh lớp
-    styles/ tokens.css shell.css     [0]   notebook.css [2] (shell.css @import)   tools.css [4] thanh công cụ, kính, tay nắm gạt, Đồ nghề   captions.css [5] chữ đi theo vật (quầng trăng nằm trong shell.css, cạnh trăng)
+    styles/ tokens.css shell.css     [0→5] (GĐ 5: khung chữ một cột; quầng trăng cạnh trăng)   notebook.css [2→5] (shell.css @import; GĐ 5: --rail-w, --notebook-w)   tools.css [4→5] thanh công cụ, kính, tay nắm gạt, Đồ nghề; GĐ 5: bảng công cụ không nằm dưới thanh lớp hay Sổ tay, Sổ tay thu lại dưới 1240px   captions.css [5] chữ đi theo vật
     paintings/
       registry.js                    [0] SITE + [{ meta, page, lang }]. Node đọc được; trình duyệt KHÔNG import
       _mau/                          [2→5] tranh mẫu 2 lớp (Cốt + Tô màu), KHÔNG deploy: fixture cho test + khuôn để copy; GĐ 5: tên vật + nhãn
@@ -854,32 +1003,44 @@ son-mai-anh-sang/
         quality.js                   [3→5] bảng cao/vừa/thấp của bức + ladder; GĐ 5: lanterns
         content.vi.js                [1→5] gợi ý (GĐ 1); Hiểu/Phá/Đọc thêm, nhãn tra theo id (GĐ 2); GĐ 4: dials.gio; GĐ 5: gợi ý mới, nhãn vật, captions
         content.captions.vi.js       [5] thơ của hoa đăng (content.vi.js import vào captions; tách riêng để content.vi.js dưới 300 dòng)
-        layers/l1-cot.js             [0→1] GĐ 0: lá instanced thô + đèn xưởng
+        layers/l1-cot.js             [0→5] GĐ 0: lá instanced thô + đèn xưởng; GĐ 5: tên vật
         layers/l2-anh-trang.js       [1→5] GĐ 5: hoa đăng (parts/anh-trang-lantern.js dựng và vẽ, parts/anh-trang-drift.js hàm thuần)
-        layers/l3-suong.js           [3] vòm trời + sương là là; parts/suong-{troi,mu}.js [3]
-        layers/l4-mat-nuoc.js        [0→3] GĐ 0: đĩa nước + reflector thô; GĐ 3: phản chiếu giả ở mức thấp
-        layers/l5-vang-la.js         [0→3] GĐ 0: sprite compute thô; GĐ 3: curl, biến thể CPU (parts/vang-la-cpu.js)
-        parts/cot-{leaf,flower,reeds}.js       [1→2] của lớp Cốt (lá, hoa nở bằng uniform, cuống + lau); GĐ 2: cấp phát theo trần, ghi lại
-        parts/cot-lab.js             [2] của lớp Cốt: thí nghiệm "Tắt instancing", đếm đỉnh
-        parts/anh-trang-{moon,paint}.js        [1] của lớp Ánh trăng (trăng, chất liệu)
+        layers/l3-suong.js           [3→5] vòm trời + sương là là; GĐ 5: hoa đăng mờ trong sương. parts/suong-troi.js [3→5] (GĐ 5: tên vật), parts/suong-mu.js [3]
+        layers/l4-mat-nuoc.js        [0→5] GĐ 0: đĩa nước + reflector thô; GĐ 3: phản chiếu giả ở mức thấp; GĐ 5: hoa đăng nhấp nhô, vũng sáng quanh đèn
+        layers/l5-vang-la.js         [0→5] GĐ 0: sprite compute thô; GĐ 3: curl, biến thể CPU (parts/vang-la-cpu.js); GĐ 5: tên vật
+        parts/cot-leaf.js            [1→2] của lớp Cốt (lá); GĐ 2: cấp phát theo trần, ghi lại
+        parts/cot-{flower,reeds}.js  [1→5] của lớp Cốt (hoa nở bằng uniform, cuống + lau); GĐ 2: cấp phát theo trần, ghi lại; GĐ 5: tên vật
+        parts/cot-lab.js             [2→5] của lớp Cốt: thí nghiệm "Tắt instancing", đếm đỉnh; GĐ 5: tên vật (Group của các Mesh rời)
+        parts/anh-trang-moon.js      [1→5] của lớp Ánh trăng (trăng); GĐ 5: tên vật
+        parts/anh-trang-paint.js     [1] của lớp Ánh trăng (chất liệu)
+        parts/anh-trang-lantern.js   [5] của lớp Ánh trăng: một InstancedMesh cho đèn ở bờ và mọi hoa đăng; mỗi khung ghi ma trận, tâm, độ sáng; pool cho lớp Mặt nước
+        parts/anh-trang-drift.js     [5] của lớp Ánh trăng, hàm thuần (chỉ import lib/random.js): vòng đệm N + 1 ô, lanternAt theo thời gian, driftDirection, verseOrder
         diagrams/*.svg               [2] sơ đồ của tab Hiểu (content.vi.js import '?raw')
   tests/
     unit/                            [0] flags tier quality palette tokens-css random lunar moon strings deadline disposer layers source
                                      [4] tuner gpu-timer lut views toolbox kinh-mai lot-lop dial-set dials rail-tools poster
-                                     [5] gesture (double-tap) captions caption-set draws tung-soi moon-progress anh-trang-drift
-    rules/imports.test.js            [0] luật ranh giới, đường nhẹ, hàng rào từ vựng
+                                     [5] gesture (double-tap) captions caption-set draws tung-soi moon-progress shell-halo run (vòng đời của run(), jsdom)
+    paintings/ao-sen-dem/            [1→5] test của từng lớp Bức 1 (dựng cả bức bằng buildPainting); GĐ 5: anh-trang-drift (hàm thuần), tha-hoa-dang (chạm hai lần)
+    rules/imports.test.js            [0→5] luật ranh giới, đường nhẹ, hàng rào từ vựng; GĐ 5: phần nhẹ không gọi built-in ES2022 trở lên (Safari 14)
     rules/files.test.js              [0→5] dòng 1 là chú thích, số dòng, API cấm; GĐ 5: chỉ draws.js đặt móc lần vẽ
-    paintings/contract.test.js       [0→5] lặp qua registry (+ _mau từ GĐ 2); GĐ 4: mức cùng bộ khóa, Dial, nhãn tap, poster/og; GĐ 5: captions, tên vật + nhãn
+    paintings/contract.test.js       [0→5] lặp qua registry (+ _mau từ GĐ 2); GĐ 4: mức cùng bộ khóa, Dial, nhãn tap, poster/og; GĐ 5: captions, files của lớp kê đủ parts/ mà lớp import
+    paintings/objects.test.js        [5] tên vật: mọi vật trong layer.objects có name kebab-case, không trùng trong lớp, có nhãn; không nhãn thừa (mức cao, thấp, lúc bật từng thí nghiệm)
+    paintings/captions-rule.test.js  [5] luật của content.captions tự kiểm (bắt được mục sai, nhận mục đúng)
     helpers/source.js                [0] phân tích mã bằng parseSync của vite
     helpers/fake-ctx.js              [1→5] Scene/Camera/uniform thật, renderer giả (Proxy ghi lời gọi); dựng ctx bằng createCtx của xưởng; GĐ 5: captions giả (ghi lời gọi)
     helpers/svg.js                   [2] đọc mã màu trong SVG (poster, sơ đồ)
     helpers/image.js                 [4] đọc cỡ ảnh WebP, JPEG từ phần đầu file (poster, og)
     helpers/final-pass.js            [5] dựng ảnh cuối như three dựng lượt cuối (WGSLNodeBuilder thật, chặng setup): thứ tự updateBefore, thân Fn của views.js
+    helpers/paintings.js             [5] ALL: mọi dòng registry và _mau, kèm cửa vào đã nạp (contract, objects lặp qua đây)
+    helpers/caption-rules.js         [5] captionErrors: luật của content.captions (test hợp đồng dùng, captions-rule.test.js tự kiểm)
+    helpers/kebab.js                 [5] KEBAB: kebab-case không dấu (slug, id lớp, id Dial, khóa chữ, tên vật)
+    helpers/nodes.js                 [5] nodesOf, compileMaterial: soi đồ thị node; dịch material ra WGSL/GLSL bằng builder thật, có render target + MRT như scene pass
+    helpers/rays.js                  [5] tia thẳng đứng xuống mặt nước cho test cử chỉ của bức
   e2e/
-    helpers.js                       [0] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU
-    painting.spec.js                 [0→5] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại; GĐ 4: mài về cốt, Kính mài, Lột lớp, ?poster; GĐ 5: Từng sợi, quầng trăng
-    ao-sen-dem.spec.js               [1→5] chạm mặt nước thì ảnh đổi (so ở cùng ?freeze=N); GĐ 3: vuốt, draw call, ?level=thap, CPU vs GPU; GĐ 4: thanh giờ, vuốt → sương xoáy; GĐ 5: thả hoa đăng
-    a11y.spec.js                     [4→5] axe-core (@axe-core/playwright): tĩnh, 3D có thanh lớp + Sổ tay, công cụ đang bật; đi hết bằng bàn phím; GĐ 5: chữ đi theo vật, Từng sợi
+    helpers.js                       [0→5] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU; GĐ 5: doubleTapAt (chạm hai lần phát ngay trong trang), điểm sáng ấm (warm)
+    painting.spec.js                 [0→5] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại; GĐ 4: mài về cốt, Kính mài, Lột lớp, ?poster; GĐ 5: Từng sợi, quầng trăng, chỗ của bảng công cụ (1280/1240/1440, 1024)
+    ao-sen-dem.spec.js               [1→5] chạm mặt nước thì ảnh đổi (so ở cùng ?freeze=N); GĐ 3: vuốt, draw call, ?level=thap, CPU vs GPU; GĐ 4: thanh giờ, vuốt → sương xoáy; GĐ 5: thả hoa đăng, draw call khi có đèn
+    a11y.spec.js                     [4→5] axe-core (@axe-core/playwright): tĩnh, 3D có thanh lớp + Sổ tay, công cụ đang bật; đi hết bằng bàn phím; GĐ 5: chữ đi theo vật, Từng sợi, đường Tab từ nút Từng sợi
 ```
 
 ### 8.2 Luật hướng phụ thuộc (test giữ)
@@ -906,6 +1067,13 @@ son-mai-anh-sang/
   - Bao đóng import **tĩnh** bắt đầu từ `engine/boot.js` và từng `paintings/*/index.js` chỉ được chứa file thuộc `engine/*.js`, `engine/contracts/`, `engine/stock/*/meta.js`, `ui/` (trừ `knobs.js`), `lib/astro/`, `lib/random.js`, và `paintings/<slug>/{index,meta}.js`.
   - Mọi specifier trần (gói npm) là lỗi.
   - Đây là bằng chứng cho yêu cầu poster dưới 1 giây.
+  - (GĐ 5) Đường nhẹ chạy cả trên trình duyệt cũ của tầng tĩnh: bao đóng tĩnh của các gốc ấy không được gọi built-in từ ES2022 trở
+    đi (`Object.hasOwn`, `.at()`, `findLast`/`findLastIndex`, `toSorted`/`toReversed`/`toSpliced`, `Object.groupBy`/`Map.groupBy`,
+    `Promise.withResolvers`), và cả `structuredClone` (API của trình duyệt, không thuộc ES, Safari 14 cũng chưa có); quét sau khi bỏ
+    chú thích. Phần nhẹ đã cần `replaceChildren`, có từ Safari 14, nên đó là mốc; `Object.hasOwn` và `.at()` phải tới Safari 15.4
+    (Phụ lục A.75). Gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ huy hiệu và ghi chú. Phần nặng chỉ chạy trên trình duyệt có
+    WebGPU/WebGL2 đời mới nên được dùng (`caption-set.js` dùng `Object.hasOwn`); `ui/moon-progress.js` nằm trên đường nhẹ nên viết
+    `Object.prototype.hasOwnProperty.call`.
 - **Hàng rào từ vựng:**
   - Quét trong `engine/`, `ui/` và `lib/tsl/`, sau khi bỏ chú thích.
   - Không được có: `slug` của mọi bức; id của mọi lớp riêng của bức (trừ `cot` và id lớp dùng chung); các từ trong `meta.fence` của mọi bức.
@@ -1119,7 +1287,8 @@ son-mai-anh-sang/
  * @property {() => void} start                 gắn móc (công cụ bật); khung kế tiếp được ghi lại
  * @property {() => void} stop                  gỡ móc, trả hàm vẽ trước đó; vẽ đủ như chưa có gì
  * @property {() => DrawInfo[]} list            lần vẽ của camera chính ở khung vẽ đủ gần nhất, theo thứ tự GPU nhận
- * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material); null = vẽ đủ.
+ * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material + lượt: khóa
+ *                                              object.id:material.id:passId); null = vẽ đủ.
  *                                              k là số nguyên ≥ 0 (giá trị khác thì ném lỗi); đang limit thì list() đứng yên
  * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt.
  *                                              reflection: lần vẽ của camera khác LỒNG trong lần vẽ một vật (phản chiếu);
@@ -1131,7 +1300,9 @@ son-mai-anh-sang/
 /** @typedef {Object} ToolInstance
  * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép sau display khi dựng pipeline; [4] ghép LẠI khi
  *                                 requireView đổi MRT, nên chỉ dựng node, không giữ trạng thái; đổi chế độ = đổi uniform
- * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức
+ * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức. [5] Giữ 'tap' thì giữ cả 'double-tap'
+ *                                 (kính tròn của Kính mài giữ cả hai; hình gạt không giữ cử chỉ nào): không thì bức nhận
+ *                                 'double-tap' mà không có hai 'tap' làm nên nó
  * @property {(on: boolean) => void} [activate]     [4] bật/tắt: đổi uniform, hiện/giấu thanh điều khiển
  * @property {() => void} dispose
  */
@@ -1209,6 +1380,7 @@ t=0  HTML tĩnh: poster + tên + thơ + [data-seal]                           da
                ĐÚNG khung N ở nhịp rAF kế tiếp (không tiến đồng hồ)
      mất GPU sau khi live, lần đầu: snapshot() → gỡ → poster + "Dựng lại cảnh"                   "lost"
                → bấm: renderer + canvas MỚI → dựng lại (scene.js) → restore(snapshot) → hòa dần → "live"
+                 (GĐ 5: hạn 10 s của run.js; quá hạn → tĩnh 'timeout', phần xong muộn chỉ tự dọn)
                lần hai (hoặc mất trước khi live): tầng tĩnh ('device-lost')
 Gỡ: disposer.closeAll() theo thứ tự NGƯỢC (loop → UI → tools → pipeline → lớp ngược → setup → stage)
 ```
@@ -1228,29 +1400,63 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
 - **Vẽ lại khung đứng yên** (`?freeze`), ở nhịp rAF kế tiếp: `setup.update(0, t)` → `layer.update(0, t)` → `render()`. dt = 0 nghĩa là
   đồng bộ theo uniform (hướng trăng, bóng) mà không tiến mô phỏng, nên ảnh vẫn là khung N.
 
-**(GĐ 5) Mốc của quầng trăng:** `shell.setState` đã báo mọi trạng thái; quầng thêm hai mốc không phải trạng thái, báo qua
-`shell.progress(mốc)` (đi qua vỏ trang "bị khóa" của boot như các hàm khác, nên phần 3D đến muộn không vẽ lại quầng):
+**(GĐ 5) Mốc của quầng trăng:** `shell.setState` đã báo mọi trạng thái cho quầng. Boot báo thêm MỘT mốc không phải trạng thái,
+`'chunk'`, bằng `shell.progress('chunk')` ngay khi `loadRun()` xong, trước khi gọi `run()`. `progress` đi qua vỏ trang "bị khóa"
+của boot như các hàm khác, nên phần 3D đến muộn không vẽ lại quầng. `run.js` không có code nào của quầng.
 
-| Lúc | Mốc | Quầng (phần vòng) | Rồi bò chậm dần tới |
+Mỗi mốc đặt một ĐÍCH (phần vòng) và một thời gian bò (`HALO_STEPS` của `ui/moon-progress.js`). Quầng bò từ chỗ đang đứng tới đích
+đó theo đường ease-out dài (`cubic-bezier(0.15, 0.6, 0.25, 1)`: đi được 90% quãng sau nửa thời gian):
+
+| Lúc | Mốc | Đích (phần vòng) | Bò trong |
 |---|---|---|---|
-| `setState('loading')` | trạng thái | 0,08 | 0,45 |
-| `loadRun()` xong (`boot.js`) | `'chunk'` | 0,45 | 0,62 |
-| `setState('compiling')` (`run.js`: bức, renderer, chữ đều đã có) | trạng thái | 0,65 | 0,9 |
-| `scene.compile()` xong (`run.js`) | `'compiled'` | 0,9 | 0,97 |
-| `setState('fading')` | trạng thái | 1 | (tan cùng hòa dần) |
-| `'live'` | trạng thái | ẩn | |
-| `'static'`, `'lost'` | trạng thái | ẩn ngay | |
-
-- Bò bằng CSS transition trên `stroke-dashoffset` (vòng có `pathLength="1"`), đường cong ease-out dài: nhanh lúc đầu rồi chậm dần,
-  không có vòng `requestAnimationFrame` nào. Mốc tới giữa chừng thì transition mới đi tiếp từ chỗ đang đứng.
-- Các số trong bảng và thời gian bò chốt khi dựng thử, đo trên máy thật (khởi động ấm khoảng 2 giây; lần đầu sau deploy đo được
-  9,2 giây) và trên SwiftShader.
+| `setState('loading')` (boot; "Dựng lại cảnh": run.js) | trạng thái; vẽ vòng mới, rỗng | 0,45 | 10 s, đúng bằng `BOOT_DEADLINE_MS` |
+| `loadRun()` xong (`boot.js`) | `'chunk'` | 0,62 | 4 s |
+| `setState('compiling')` (`run.js`: bức, renderer, chữ đều đã có) | trạng thái | 0,9 | 3 s |
+| `setState('fading')` | trạng thái | 1 | 0,3 s, rồi tan (opacity) trong 0,6 s còn lại của 900 ms hòa dần (`CROSSFADE_MS`) |
+| `'live'` | trạng thái | gỡ quầng (đã tan hết) | |
+| `'static'`, `'lost'` | trạng thái | gỡ ngay, không tan | |
+
+- Chỉ `'loading'` vẽ vòng mới. Mốc nào tới khi không còn vòng trên trang (chưa tới `loading`, đã gỡ, trăng vừa vẽ lại) thì bỏ qua,
+  nên phần 3D đến muộn sau khi trang đã về tĩnh không vẽ lại quầng. Vòng không bao giờ lùi: mốc tới muộn mà đích thấp hơn đích
+  đang có thì bỏ qua.
+- Bò bằng CSS transition trên `stroke-dashoffset` (vòng có `pathLength="1"` và `stroke-dasharray: 1 2`: dashoffset 1 là rỗng, 0 là
+  đầy), không có vòng `requestAnimationFrame` nào. JS chỉ đặt đích và `transition` inline; mốc tới giữa chừng thì transition mới đi
+  tiếp từ chỗ đang đứng. Vòng mới được "chốt" ở dashoffset 1 (đọc `getComputedStyle` ngay sau khi gắn), không thì mốc đầu nhảy
+  thẳng thay vì bò (Phụ lục A.58).
+- Giảm chuyển động: `shell.css` đặt `transition: none !important` (thắng transition inline), quầng nhảy thẳng tới từng mốc.
+- **Số giây** chốt theo thời gian đo được của từng chặng (dựng thử, Mac M2 có GPU thật; SwiftShader thay cho máy yếu; bảng chép ở
+  chú thích của `HALO_STEPS`). "Ấm": trình duyệt đã có cache; "lạnh": trình duyệt mới, không cache; Fast/Slow 4G: hai mức giả lập
+  mạng của DevTools, trên M2; SwiftShader đo ở lần mở trang đầu của trình duyệt.
+
+  | Chặng (ms) | M2 ấm | M2 lạnh | Fast 4G | Slow 4G | WebGPU SwiftShader | WebGL2 SwiftShader |
+  |---|---|---|---|---|---|---|
+  | `loading` → `chunk` | 24–45 | 30–60 | 700 | 3390 | 30 | 35–60 |
+  | `chunk` → `compiling` | 33–44 | 45 | 265 | 820 | 1840–1950 | 1320–1360 |
+  | `compiling`: compileAsync | 137–154 | 155 | 150 | 160 | 840–910 | 360–390 |
+  | khung ẩn, rồi `fading` | 115–127 | 125 | 125 | 130 | 135 | 940 |
+
+  Trang thật lần đầu sau deploy (CDN chưa có file) mất 9,2 giây, gần hết ở chặng đầu: chặng đầu bò 10 giây, bằng hạn của boot, để
+  quầng không đứng hẳn trước lúc quá hạn (`BOOT_DEADLINE_MS` export từ `engine/boot.js`; `ui/` không import được `engine/`, nên
+  `tests/unit/boot.test.js` giữ hai số bằng nhau). Ease-out dồn quãng vào nửa đầu: từ giây thứ 7 tới lúc rơi về tĩnh, quầng chỉ
+  nhích thêm chừng 0,012 vòng. `chunk` bò 4 giây và `compiling` bò 3 giây, gấp 2 và 3,3 lần chặng chậm nhất đo được, nên mốc sau
+  tới khi quầng còn đang bò. Máy nhanh thì cả vòng chạy chưa tới một giây.
+- **Vì sao không có mốc nào giữa compileAsync và `fading`:** transition của `stroke-dashoffset` tính trên luồng chính (Phụ lục
+  A.70). Quầng chỉ bò khi trang đang chờ (chờ mạng; chờ GPU: xin adapter, compileAsync) và đứng yên trong việc đồng bộ: dựng cảnh
+  (40–60 ms) và khung ẩn. run.js vẽ khung ẩn rồi đặt `fading` liền trong một tác vụ, nên một đích đặt trước khung ẩn bị `fading`
+  thay trước khi trình duyệt kịp vẽ khung nào. Bản thiết kế có mốc `'compiled'` ở đó; quầng không bao giờ vẽ được nó, nên đã bỏ.
+  - Trên WebGL2 SwiftShader, `getContext` chặn 1,25 giây ngay sau `chunk`, trong cùng tác vụ: quầng nằm gần 0 (0,003–0,012) rồi
+    nhảy lên chừng 0,48, vì transition của `chunk` lấy giờ bắt đầu từ khung trước lúc chặn. Rồi compileAsync chặn chừng 0,2 giây và
+    khung ẩn chừng 0,95 giây: quầng đứng ở chừng 0,59 gần 1,2 giây trước `fading`.
+  - Trên WebGPU SwiftShader, lúc xin adapter (1,8 giây) luồng chính rảnh mà khung vẫn thưa, có khi cách nhau 0,4 giây: quầng đi giật.
 - "Dựng lại cảnh" đi lại từ `loading` (không có mốc `'chunk'`, vì code 3D đã tải).
 
 **(GĐ 5) Vòng lặp có thêm:**
 - **Chữ đi theo vật:** sau `controls.update()` và trước `render()`, `caption-set.js` gọi `anchor()` của dòng đang hiện, chiếu ra
   màn hình bằng camera rồi đặt `transform` cho chữ. Hết giờ (theo `ctx.u.time`) thì gỡ chữ. Không có chữ thì không làm gì. Lúc
   `?freeze` đã dừng, đồng hồ đứng nên chữ ở lại; vẽ lại khung đứng yên cũng chiếu lại chữ (camera có thể vừa bị kéo).
+  - (Dựng thử) Trước khi chiếu, `camera.updateMatrixWorld()`: `OrbitControls.update()` chỉ gọi `camera.lookAt()`, nên tới `render()`
+    ma trận của camera mới được tính lại; không tính trước thì chữ chạy trễ camera một khung khi người xem kéo (Phụ lục A.55).
+  - `show()` đặt chữ ngay (không đợi khung sau): cử chỉ có thể tới ngoài vòng lặp, lúc `?freeze` đã dừng.
 - **Móc lần vẽ** (chỉ khi Từng sợi bật): `pipeline.render()` đi qua móc của `draws.js`. Móc ghi lại lần vẽ của khung vẽ đủ, và bỏ
   các lần vẽ sau sợi đang xem.
 - **`setup.onGesture('double-tap')`:** cử chỉ mới đi đúng đường cũ: công cụ đang bật nhận trước, không công cụ nào dùng thì tới bức.
@@ -1274,7 +1480,7 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
 | Công cụ học (GĐ 4) | `engine/tools/<id>.js` (overlay, thanh điều khiển, cử chỉ); `gpu/toolbox.js` (gắn, định tuyến, mỗi lúc một công cụ); `gpu/views.js` (danh sách view); `ui/rail-tools.js` (nút trong thanh lớp) | Công cụ chỉ nhìn `views()`, bức không biết có công cụ. Nhãn nằm ở `t.tools`, `t.views` và `content.layers[id].taps` |
 | Dial (GĐ 4) | Bức khai báo trong `setup().dials` (Bức 1: `shared.js`); `gpu/dial-set.js` đọc/ghi; `ui/dials.js` vẽ | Xưởng không biết Dial nghĩa là gì, chỉ biết uniform, khoảng giá trị và cách ghi chữ |
 | Chữ đi theo vật (GĐ 5) | Chữ ở `content.captions` của bức; bức gọi `ctx.captions.show(khóa, anchor)`; `gpu/caption-set.js` chiếu và tính giờ; `ui/captions.js` vẽ DOM | Code của bức không chứa chữ nào cho người xem, chỉ chứa khóa. Mỗi lúc một dòng |
-| Tiến độ tải (GĐ 5) | `ui/moon-progress.js` trong `[data-moon]`; `shell.js` nối với `setState` và `progress(mốc)`; `boot.js`, `run.js` báo mốc | Chỉ CSS, đường nhẹ, không three. Bức nào không có trăng thì không có quầng |
+| Tiến độ tải (GĐ 5) | `ui/moon-progress.js` trong `[data-moon]`; `shell.js` nối với `setState` và `progress(mốc)`; `boot.js` báo mốc `'chunk'`, các mốc còn lại là trạng thái | Chỉ CSS, đường nhẹ, không three. Bức nào không có trăng thì không có quầng |
 | Lần vẽ (GĐ 5) | `gpu/draws.js` (móc của renderer); `ToolApi.draws`; `tools/tung-soi.js` vẽ thanh điều khiển; nhãn vật ở `content.layers[id].objects` | Móc chỉ gắn khi Từng sợi bật; chỉ `draws.js` được đặt móc (§8.2) |
 
 ### 8.7 Cờ URL, HTML, poster và chunk trên GitHub Pages
@@ -1288,7 +1494,7 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
 | `?debug`, `?debug=stats` | GĐ 0: in chi tiết lỗi. GĐ 1: Inspector hoặc stats-gl (§7) |
 | `?at=2026-09-28T21:00` | "bây giờ" giả lập |
 | `?freeze`, `?freeze=N` | đồng hồ tất định |
-| `?poster` | (GĐ 4) ẩn mọi UI trừ canvas, để chụp poster: `body[data-poster]`, CSS ẩn chữ, huy hiệu, thanh lớp, Sổ tay, thanh công cụ; không có gợi ý hay lời mời. Dùng cùng `?at&freeze=N` |
+| `?poster` | (GĐ 4) ẩn mọi UI trừ canvas, để chụp poster: `body[data-poster]`, CSS ẩn chữ, huy hiệu, thanh lớp, Sổ tay, thanh công cụ (GĐ 5: cả vùng chữ đi theo vật); không có gợi ý hay lời mời. Dùng cùng `?at&freeze=N` |
 | `?level=cao\|vua\|thap` | (GĐ 3) ép mức chất lượng thay cho `pickLevel` (xem mức thấp ngay trên laptop; e2e phủ đường phản chiếu giả). Giá trị lạ thì bỏ qua (`?debug` in cảnh báo) |
 
 - **`?at`:** giá trị không ghi offset được hiểu là **giờ Việt Nam (+07:00)**, bất kể múi giờ của máy.
@@ -1414,8 +1620,10 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
 | (GĐ 4) `requireView` hỏng (biên dịch lại lỗi) | Thanh công cụ báo "không mài được view này" và quay về view trước; cảnh vẫn chạy |
 | (GĐ 4) `resolveTimestampsAsync` bị reject, hay trả số vô lý (≤ 0, không hữu hạn) | Bỏ mẫu đó. Hỏng 3 lần liền thì tắt đo GPU cho phiên này: bộ điều chỉnh và Sổ tay chạy như GĐ 3 |
 | (GĐ 5) `ctx.captions.show` với khóa không có trong `content.captions` (hay chữ tải hỏng) | Không hiện gì; có `?debug` thì cảnh báo. Đèn vẫn được thả |
-| (GĐ 5) `anchor()` ném lỗi hay trả số không hữu hạn | Ẩn chữ ở khung đó, cảnh báo một lần; không tính là khung lỗi |
+| (GĐ 5) `anchor()` ném lỗi, trả `undefined` hay số không hữu hạn | Ẩn chữ ở khung đó, cảnh báo một lần cho mỗi dòng chữ; không tính là khung lỗi. Trả `null` không phải lỗi: bức nói khung đó không có điểm neo, chữ ẩn mà không cảnh báo |
 | (GĐ 5) Móc lần vẽ ném lỗi | Lỗi đi lên `render()` như mọi lỗi trong khung (3 khung lỗi liên tiếp thì tầng tĩnh). `stop()` luôn trả hàm vẽ cũ, kể cả khi công cụ bị gỡ vì lỗi |
+| (GĐ 5) "Dựng lại cảnh" quá 10 giây, kể cả khi `createStage`, `restore(snapshot)`, `compile()` hay lúc hòa dần còn dở (lỗi có từ GĐ 2) | Tầng tĩnh (`timeout`), báo một lần; sân khấu và cảnh của lần dựng đó gỡ ngay lúc quá hạn; `createStage` còn dở thì chưa có sân khấu để gỡ, và sân khấu bị gỡ ngay khi tới muộn (disposer đã đóng, `add()` gỡ ngay). Phần xong muộn chỉ tự dọn, không gọi gì khác tới vỏ trang, `__sma`, sân khấu hay cảnh (`run.js#bringUp` kiểm `gone()` trước việc đầu tiên và sau mỗi lần chờ). Boot chỉ khóa vỏ trang khi LẦN MỞ TRANG quá hạn hay hỏng; hạn của "Dựng lại cảnh" là của run.js, nên run.js phải tự dừng |
+| (GĐ 5) Lần mở trang đã quá 10 giây (tầng tĩnh `timeout`) mà phần 3D còn đang dựng, rồi mất GPU hay 3 lỗi GPU trong 1 giây (lỗi có từ GĐ 1) | Bỏ qua: không về tĩnh lần hai, lý do vẫn là `timeout` (`onLost`, `onError` của run.js xét `stopped()`). Lần dựng tự dọn ở lần kiểm `gone()` kế tiếp |
 
 ## 10. Hiệu năng và chất lượng
 
@@ -1576,21 +1784,25 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
     WebGL2; mức thấp không có phản chiếu nên đo được 24. Mục tiêu chính là **tổng ≤ 45** (e2e đo ở mức cao).
   - (GĐ 4) FXAA vẽ chuỗi display ra một RTT, thêm 1 lượt vẽ: mức cao đo được 35 ở 1280×800 và 33 ở 390×844; e2e vẫn giữ ≤ 45. Overlay của công cụ nằm trong
     lượt cuối nên không thêm lượt vẽ. View Normal (`requireView`) thêm một target MRT, cũng không thêm lượt vẽ.
-  - (GĐ 5) Hoa đăng gộp vào InstancedMesh của đèn ở bờ, nên draw call không đổi: mức cao vẫn 35. Từng sợi không thêm lượt vẽ; khi
-    xem sợi k < N, khung còn ít lượt vẽ hơn.
+  - (GĐ 5) Hoa đăng gộp vào InstancedMesh của đèn ở bờ, nên draw call không đổi: mức cao vẫn 35. E2e đo trên WebGPU (SwiftShader
+    và GPU thật): 35 trước khi thả, 35 khi có hai đèn trôi. Từng sợi không thêm lượt vẽ; khi xem sợi k < N, khung còn ít lượt vẽ hơn.
 - (GĐ 5) **Chi phí lúc chưa dùng tính năng mới:**
   - Từng sợi: không có móc nào khi công cụ tắt.
   - Chữ đi theo vật: không chiếu gì khi không có chữ.
   - Quầng trăng: chỉ CSS, và chỉ trong lúc tải.
-  - Hoa đăng: không có đèn trôi thì CPU không ghi ma trận nào, và vòng lặp vũng sáng trong shader của nước `Break` ngay. Shader của
-    đèn chỉ thêm độ cao gợn (như lá) và hệ số sương; số pipeline không đổi.
-  - JS: ước thêm vài KB gzip cho đường 3D; số đo thật ghi vào README như các giai đoạn trước.
+  - Hoa đăng: không có đèn trôi thì CPU không ghi ma trận hay thuộc tính nào, và vòng lặp vũng sáng trong shader của nước `Break`
+    ngay. Ma trận của 80 cánh (5 KB) và mảng `lanternPool` vẫn được chép lên GPU ở mỗi lượt vẽ, như mọi uniform buffer của từng vật
+    ở r186 (Phụ lục A.64). Shader của đèn chỉ thêm độ cao gợn (như lá) và hệ số sương; số pipeline không đổi.
+  - JS: đường 3D thêm 7,4 kB gzip (306,57 → 313,97 kB, đo ngày 2026-10-03); chi tiết từng chunk trong README.
 - **Poster:** WebP 150 KB trở xuống (GĐ 4). `og.jpg` 1200×630, 200 KB trở xuống.
 - **JS:**
   - Chunk `three` đo được khoảng 243 KB gzip. Con số này gần như cố định, vì `three/tsl` kéo cả namespace nên không tree-shake được.
-  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,8 KB; cộng Tweakpane 328,8 KB. GĐ 4 đo được: đường 3D 306,6 KB; cộng Tweakpane 337,5 KB.)
+  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,8 KB; cộng Tweakpane 328,8 KB. GĐ 4 đo được: đường 3D 306,6 KB; cộng Tweakpane 337,5 KB. GĐ 5 đo được: đường 3D 314,0 KB; cộng Tweakpane 344,9 KB.)
   - Mục tiêu cho cả đường 3D: **450 KB gzip trở xuống**. Số đo ghi vào README.
   - (GĐ 4) Đồ nghề, Dial, LUT và chặng display đi cùng đường 3D; `@axe-core/playwright` chỉ là gói dev, không vào bundle.
+  - (GĐ 5) Quầng trăng nằm ở chunk vào (đường nhẹ, cả tầng tĩnh tải); Từng sợi, móc lần vẽ và chữ đi theo vật ở `run`; hoa đăng ở
+    `painting`; thơ ở `content`. Code của hai file mới (`anh-trang-lantern`, `anh-trang-drift`) là hai chunk `?code`, chỉ tải khi
+    mở tab Chỉnh của lớp Ánh trăng.
   - Inspector (39 KB) và stats-gl (10 KB) chỉ tải khi có `?debug`.
 - **Máy yếu:** biên dịch trước bằng `scenePass.compileAsync(renderer)`, rồi vẽ một khung ẩn trong lúc poster còn hiện.
 - (GĐ 4) **Đo trên máy dựng thử** (GPU Apple, Chrome, cảnh live): đủ 60 khung/giây ở cả ba mức, ở 1280×800 (DPR 2) và 390×844
@@ -1627,6 +1839,10 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
 
 ## 12. Kiểm thử
 
+**(GĐ 5) Số test của bản dựng thử:** Vitest 73 file, 860 test (trước GĐ 5: 62 file, 687 test). E2e: mỗi project liệt kê 40
+test; `static` chạy 6, mỗi project 3D (`webgl2-swiftshader`, `webgpu-swiftshader`, `webgpu-real-gpu`) chạy 33, còn lại Playwright
+ghi "skipped" vì chúng thuộc project khác. Cổng chặn của CI (`static` + `webgl2-swiftshader`) chạy 39 test.
+
 ### Unit (Vitest 5, môi trường `node`; file nào cần DOM thì ghi `// @vitest-environment jsdom` ở dòng 1)
 - **`lunar`:**
   - Tết 2024 = 2024-02-10, Tết 2025 = 2025-01-29, Tết 2026 = 2026-02-17.
@@ -1682,13 +1898,33 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - thứ tự và nhãn: tap của lớp, `t.views`;
   - `ready` của Normal là false cho tới khi `requireView`;
   - `requireView` không gọi lại `build`/`display`;
-  - (GĐ 5) lượt cuối dựng bằng `WGSLNodeBuilder` thật (chặng setup, `tests/helpers/final-pass.js`): scene pass là `updateBefore` đầu
-    tiên, cả khi display vẽ ra RTT và overlay đọc texture của scene pass (Phụ lục A.53).
+  - (GĐ 5) ảnh cuối đã ghép là một `Fn` mở đầu bằng `scenePass.toVar()` rồi trả `vec4(rgb, 1)` (thân Fn dựng bằng
+    `tests/helpers/final-pass.js`).
+- (GĐ 5) **`pipeline`:** lượt cuối dựng bằng `WGSLNodeBuilder` thật (chặng setup, `tests/helpers/final-pass.js`): scene pass là
+  `updateBefore` đầu tiên, cả khi display vẽ ra RTT (như FXAA) và overlay đọc texture của scene pass (Phụ lục A.53).
 - (GĐ 4) **`toolbox`, `kinh-mai`, `lot-lop`** (jsdom):
   - mỗi lúc một công cụ; đóng thanh lớp thì công cụ tắt;
   - `hover` không tới bức; kính chỉ giữ chạm của ngón tay;
   - tay nắm gạt là `role="slider"`, đổi `uLensSplit` được bằng phím;
   - Lột lớp là `input type="range"` có `aria-valuetext`.
+  - (GĐ 5) `toolbox`: `api.draws` là đúng năm hàm của móc của cảnh (không có `begin`/`end`), không có móc thì `null`; thanh công cụ
+    gắn cuối `body` khi chưa có thanh lớp, gắn NGAY SAU thanh lớp khi đã có ("Dựng lại cảnh"), trước Sổ tay. `kinh-mai`: kính tròn
+    giữ cả cú chạm hai lần của ngón tay; chuột thì không.
+  - (GĐ 5) `workshop` (thứ tự trong trang, WCAG 2.4.3): Sổ tay mở lần đầu khi cảnh đã có thanh công cụ thì thanh lớp đứng ngay trước
+    nó, Sổ tay ngay sau; chưa có thanh công cụ (tầng tĩnh, bức không có công cụ) thì thanh lớp rồi Sổ tay ở cuối `body`; cả vòng đời
+    (mở trang → mở Sổ tay → "Dựng lại cảnh", với `createToolbox` thật) luôn là thanh lớp → thanh công cụ → Sổ tay.
+- (GĐ 5) **CSS** (`tests/unit/shell-css.test.js`, đọc luật bằng bộ phân tích nhỏ của chính test):
+  - hòa dần đúng `CROSSFADE_MS` của `ui/moon-progress.js`; khung chữ một cột (mọi khối của `.frame` ghim vào cột 1);
+  - quầng: không tô, `stroke-dasharray: 1 2`, nét 9; giảm chuyển động thì `transition: none !important`;
+  - chữ đi theo vật: vùng chữ phủ kín `[data-stage]`, không nhận chạm; vùng live lẫn chữ không bao giờ `display: none` hay
+    `visibility: hidden`; `data-away` đè `[data-shown]` và `[data-fading]`, cả khi giảm chuyển động; tan đúng `CAPTION_FADE`; giảm
+    chuyển động thì không mờ dần và giữ dòng tới khi bị gỡ; `?poster` ẩn vùng chữ;
+  - bảng công cụ: thanh lớp và Sổ tay đọc bề rộng từ `--rail-w`, `--notebook-w`; luật mặc định, khối điện thoại và khối
+    `(min-width: 1240px)` đúng thứ tự; chỉ một khối thu Sổ tay, `(max-width: 1239.98px)`; ngưỡng tính lại từ các biến (2 lề + thanh
+    lớp + Sổ tay + 2 khe + 480); `max-width` máy tính của `.tool-panel` không có `%`; không thuộc tính nào tạo khối chứa (transform,
+    filter, backdrop-filter…) trên `.toolbar` và `.tool`.
+  - `tests/paintings/html.test.js`: z-index của thanh công cụ nhỏ hơn hẳn thanh lớp và Sổ tay; các dòng chữ dưới hàng của bảng giữ
+    khoảng 8 px, dòng trống thì thu lại; `shell.css` `@import` cả `captions.css`.
 - (GĐ 4) **`dial-set`, `ui/dials`, `rail-tools`:** Dial đổi uniform, kẹp theo min/max/step; `aria-valuetext` = `format`; ghi chú theo
   `note()`; snapshot/restore có `dials`.
 - (GĐ 4) **`knob-set`:** `max()` trả số không hữu hạn, hay nhỏ hơn `min`, thì ném lỗi tiếng Việt ngay lúc dựng.
@@ -1697,29 +1933,87 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - Sương không đưa nấc `chi-tiet` ở mức thấp;
   - Vàng lá không chạy compute khi `update(0, t)`;
   - Ánh trăng vẽ lại bóng khi giờ đổi lúc đứng yên.
-- (GĐ 5) **`gesture`:** hai lần chạm trong 300 ms và 24 px ra `tap`, `tap`, `double-tap` (cùng chỗ với lần chạm hai); quá 300 ms hay
-  quá 24 px thì chỉ là hai `tap`; chạm ba lần liền chỉ ra một `double-tap` (cặp tính lại từ đầu); lần chạm hai mà thành giữ hay kéo
-  thì không có `double-tap`.
-- (GĐ 5) **`ui/captions`** (jsdom): mỗi lúc một dòng; câu và nguồn đúng; vùng live không bao giờ `hidden`, rỗng khi không có chữ;
-  điểm neo ra ngoài khung thì chữ ẩn mà vùng live vẫn còn. **`caption-set`:** khóa lạ không hiện gì; hết giờ theo đồng hồ của cảnh
-  (đồng hồ đứng thì chữ ở lại); `anchor()` ném lỗi thì chỉ ẩn chữ; `keys` rỗng khi không có chữ.
+- (GĐ 5) **`gesture`:** hai lần chạm trong 300 ms và 24 px ra `tap`, `tap`, `double-tap` (cùng chỗ với lần chạm hai, ngay sau `tap`
+  của nó); 300 ms đo từ lúc NHẤC ngón đầu, 24 px đo từ chỗ chạm xuống, đúng ngưỡng vẫn tính; quá thì chỉ là hai `tap`; chạm ba lần
+  liền chỉ ra một `double-tap` (cặp tính lại từ đầu); lần chạm hai mà thành giữ hay kéo thì không có `double-tap`; ngón thứ hai,
+  `cancel` hay mất `pointerup` giữa hai lần chạm thì lần chạm đầu bị quên. **`input`:** chạm hai lần liền nhau ra `tap`, `tap`,
+  `double-tap` kèm NDC, tia và loại con trỏ. **`sma`:** `readouts(id)` đọc qua bàn thợ, chưa có bàn thợ thì mảng rỗng. **`layers`:**
+  `ctx.captions` mặc định không có chữ (`keys` rỗng, `show` không làm gì).
+- (GĐ 5) **`ui/captions`** (jsdom): vùng `aria-live="polite"` nằm trong `[data-stage]` sau canvas, không bao giờ `hidden`, rỗng lúc
+  đầu; mỗi lúc một dòng, câu và nguồn (` · tác giả` khi có) như thơ của Sổ tay; hiện mờ dần (đọc style khi chữ đã vào trang rồi mới
+  gắn `data-shown`); ra ngoài khung thì chữ mang `data-away`, chỉ ghi khi đổi; sát mép thì chữ dừng ở mép mà vẫn ở trên điểm neo;
+  không xuống dưới chân khung (mép trên cao nhất của `[data-hint], [data-poem], [data-seal], [data-moon]`, ô cao 0 bỏ qua), màn
+  quá thấp thì mép trên thắng; cỡ chữ và chân khung chỉ đo lúc `show`. **`caption-set`:** khóa lạ không hiện gì (chỉ `?debug` mới
+  cảnh báo); `show` đặt chữ ngay; chữ đi theo điểm neo; sau camera, ngoài khung, xa hơn far hay sát hơn near thì ẩn, theo cả quy ước
+  độ sâu của WebGL lẫn WebGPU; `anchor()` trả `null` thì ẩn, không cảnh báo; ném lỗi, `undefined` hay số không hữu hạn thì ẩn và
+  cảnh báo một lần; camera vừa xoay mà ma trận chưa cập nhật vẫn chiếu theo hướng mới; hết `CAPTION_SECONDS` thì gỡ, trước đó
+  `CAPTION_FADE` thì tan, một lần; đồng hồ đứng thì chữ ở lại; `keys` đông cứng, rỗng khi không có chữ; `fakeCaptions` của test cùng
+  dạng với api thật. **`scene`:** chữ theo camera của CHÍNH khung đó, vẽ lại khung đứng yên thì chiếu lại; `begin`/`end` của móc bọc
+  `render` ở cả `step()` lẫn lần vẽ lại; disposer gỡ vùng chữ và móc.
 - (GĐ 5) **`draws`** (renderer giả): `start()` gắn móc và `stop()` trả đúng hàm cũ (kể cả khi đã có hàm khác trước đó); chỉ ghi lần
-  vẽ của camera chính; lần vẽ lồng (camera khác, giữa lúc vẽ một vật) cộng vào `nested` của vật đó, lần vẽ của camera khác ở ngoài
-  cùng vào `other`; `limit(k)` bỏ đúng các lần vẽ sau k, so theo vật + material + lượt (nhóm của Mesh nhiều material, lượt `backSide`);
-  `limit(null)` vẽ đủ; vật là con của một vật trong `layer.objects` thì nhận lớp và nhãn của vật đó; số tam giác theo `drawRange` và
-  nhóm, như three.
-- (GĐ 5) **`tung-soi`** (jsdom): thanh từ 0 tới N, mở công cụ thì ở N; `aria-valuetext` có nhãn vật; "Dệt lại" đi hết 0 → N rồi dừng
-  (đồng hồ giả); kéo thanh thì dừng; tắt công cụ thì `limit(null)` rồi `stop()`.
-- (GĐ 5) **`moon-progress`** (jsdom): không có quầng trước `loading`; mỗi mốc đặt đúng phần vòng; `static`/`lost` ẩn ngay; giảm
-  chuyển động thì không có transition; trang không có `[data-moon]` thì không làm gì. **`boot`:** báo mốc `'chunk'` sau `loadRun()`.
+  vẽ của camera chính, `list()` và từng mục đông cứng; lần vẽ lồng (camera khác, giữa lúc vẽ một vật) cộng vào `nested` của vật đó
+  (lồng trong một lần vẽ của camera chính lồng nữa thì vào sợi trong cùng), lần vẽ của camera khác ở ngoài cùng vào `other`; khung
+  sau không mang số của khung trước (`drawCalls` của renderer không về 0 giữa hai khung); `limit(k)` bỏ đúng các lần vẽ sau k, so
+  theo vật + material + lượt (nhóm của Mesh nhiều material, lượt `backSide`), nhận số nguyên ≥ 0 hay `null`, giá trị khác thì ném
+  lỗi; `limit(null)` vẽ đủ; vật là con của một vật trong `layer.objects` thì nhận lớp và nhãn của vật đó; chữ của bức tải hỏng thì
+  nhãn rơi về tên vật, rồi về loại; số tam giác theo `drawRange` và nhóm, như three; Points, Line không có tam giác;
+  `InstancedBufferGeometry` lấy số bản ở `instanceCount`; lần vẽ ném lỗi thì `list()` giữ khung đủ trước đó và `stop()` vẫn trả hàm cũ.
+- (GĐ 5) **`tung-soi`** (jsdom, đồng hồ giả): Đồ nghề có Từng sợi sau Kính mài và Lột lớp; bật thì `draws.start()`, đang đếm thì
+  "Dệt lại" bị khóa, có danh sách thì thanh ở N; `aria-valuetext` và dòng mô tả nói về sợi đang xem (sợi k là lần vẽ thứ k), nấc 0
+  nói chưa vẽ gì; ô số k/N có `aria-live="off"`; kéo về k < N gọi `limit(k)`, về N gọi `limit(null)`; "Dệt lại" đi 0 → N theo
+  `playStepMs` rồi dừng, bấm lại hay kéo thanh thì dừng; quá 750 sợi thì mỗi bước `playStride(N)` sợi, bước cuối đáp đúng N, cả lượt
+  chừng `MAX_PLAY_MS`; `?freeze`: bước kế chỉ hẹn giờ khi vẽ lại xong, vẽ lại hỏng thì dừng; số sợi đổi giữa chừng: đang xem đủ khung
+  thì theo N mới, đang dừng ở k < N hay đang dệt thì giữ nguyên; danh sách co lại rồi người xem kéo quá N mới thì kẹp về N, không
+  ném; nhịp đọc mà khung không đổi thì không ghi gì vào DOM; với móc thật (`draws.js`, renderer giả) nấc k chỉ vẽ k vật đầu; tắt
+  công cụ thì `limit(null)` rồi `stop()`, gọi hai lần vẫn an toàn; `api.draws` là `null` thì ô trống, không ném.
+- (GĐ 5) **`moon-progress`** (jsdom): chưa tới `loading` thì không có quầng; `loading` tạo vòng `pathLength` 1, dashoffset đích 0,55,
+  transition 10 s (bằng hạn của boot); các mốc sau đi đúng đích (`chunk` 0,38 → `compiling` 0,1 → `fading` 0); mốc tới muộn không kéo
+  vòng lùi; `fading` đầy rồi tan cùng lúc hòa dần, `live` gỡ; `static`, `lost` gỡ ngay; chỉ `loading` vẽ vòng mới (mốc tới muộn sau
+  khi gỡ, hay sau khi trăng vẽ lại, không vẽ lại quầng); `dispose` thôi nhận mốc. **`shell-halo`** (jsdom): `setState('loading')` vẽ
+  quầng trong `[data-moon]`, `progress('chunk')` cho quầng đi tiếp, về tĩnh thì gỡ; trang không có `[data-moon]` thì `progress` không
+  làm gì. **`boot`:** báo `'chunk'` sau khi `loadRun()` xong và trước khi `run` chạy; quá hạn thì `progress` bị khóa như các hàm khác
+  của vỏ trang; chặng đầu của quầng bằng `BOOT_DEADLINE_MS`.
+- (GĐ 5) **`run`** (jsdom; `vi.mock` cho stage, scene, tools, Sổ tay, debug; deadline, disposer, guards, clock, palette và `studioApi`
+  thật; vỏ trang và `__sma` là đồ giả ghi mọi lời gọi theo thứ tự, cùng các bước dựng của sân khấu và cảnh; đồng hồ giả cho hạn
+  10 s). Trước GĐ 5, `run()` chỉ có e2e giữ.
+  - Mở trang qua `compiling` → `fading` → `live`, huy hiệu sau `live`, bộ điều chỉnh bắt đầu đo.
+  - Mất GPU sau khi live: "Dựng lại cảnh" dựng trên sân khấu mới, `restore(snapshot)`, live lại; mất lần hai thì tĩnh `device-lost`.
+  - Hạn 10 s của lần dựng lại tới khi `createStage`, `restore`, `compile` hay `crossfade` còn dở (mỗi bước một ca): `onFail('timeout')`
+    một lần, sân khấu gỡ ngay lúc quá hạn (hay ngay khi tới muộn), phần xong muộn không gọi gì tới vỏ trang, `__sma`, sân khấu hay cảnh.
+  - Lần mở trang, boot đã hết hạn: khi `createStage` còn dở thì sân khấu đến muộn bị gỡ, không dựng cảnh; khi `compile` còn dở mà mất
+    GPU hay có 3 lỗi GPU trong 1 giây thì bỏ qua (không `onFail`, lý do vẫn `timeout`).
+  - Thêm một lần chờ vào `bringUp` thì thêm `if (gone()) return false;` ngay sau nó và thêm tên bước vào bảng `it.each` của test.
 - (GĐ 5) **Lớp của Bức 1:**
-  - `anh-trang-drift` (hàm thuần): `lanternAt` ở lúc thả là đúng chỗ thả và búp còn khép; 1,5 giây sau nở đủ; đi theo hướng trôi; ở
-    trong ao tới lúc chìm; sau khi chìm thì độ sáng 0; vòng đệm thả lần thứ `lanterns + 1` thì đèn cũ nhất chìm; thứ tự thơ là một hoán
-    vị của các khóa, cùng ngày thì như nhau, khác ngày thì khác (ít nhất ở một cặp ngày đã chọn).
-  - Ánh trăng: InstancedMesh `hoa-dang` có `(1 + lanterns) × 8` bản ở cả ba mức và `count` không đổi; số đo `lanterns` là 0, rồi 1 sau
-    một cử chỉ `double-tap` trên ao (tia giả); `ctx.captions.show` được gọi với một khóa có trong `keys`, và `anchor()` trả điểm gần
-    chỗ chạm; `double-tap` ngoài ao thì không có gì.
-  - Sương và Mặt nước sửa node của material hoa đăng (emissive, positionNode); Mặt nước có vòng vũng sáng.
+  - `anh-trang-drift` (hàm thuần):
+    - `lanternAt`: lúc thả đúng chỗ thả, búp khép, chưa sáng; sáng dần rồi 1,5 giây sau nở đủ; đi theo hướng trôi, quãng khớp tốc độ,
+      lúc đầu rất chậm; xoay theo `DRIFT.spin`, mỗi lần thả một pha (lệch góc vàng); tất định; tới vùng mép thì chìm 3 giây rồi tắt;
+      quá 90 giây thì chìm; thả sát bờ hướng ra ngoài thì chìm ngay; biên độ lượn cộng quãng trôi lúc chìm nhỏ hơn `DRIFT.margin`; ở
+      trong ao suốt đời đèn;
+    - `driftDirection`: vector đơn vị với mọi chỗ thả và mọi hướng trăng; nhắm đúng điểm cách camera (0, 32) một đoạn `reach` theo
+      phương vị trăng; đích ở ngoài ao nên không đèn nào trôi ngược về phía camera;
+    - `createLanternSlots`: thả quá sức chứa thì đèn nổi lâu nhất chìm sớm, đèn mới vào ô thừa, `alive(t)` đếm cả đèn đang chìm; đèn
+      chìm ngay lúc thả không bắt đèn khác chìm theo; chuỗi thả bất kỳ: đèn nổi ≤ capacity, đèn sống ≤ capacity + 1; thả dồn dập thì
+      dùng lại ô có đèn chìm lâu nhất; nhiều lần thả cùng một t (`?freeze`) vẫn xoay vòng; capacity sai thì ném lỗi;
+    - `verseOrder`: hoán vị, mảng gốc giữ nguyên; cả một đêm (12 giờ trưa tới 12 giờ trưa hôm sau, giờ Việt Nam) một thứ tự; khác đêm
+      thì khác (ở các cặp đêm đã chọn, kể cả hai phút quanh 12 giờ trưa).
+  - Ánh trăng: InstancedMesh `hoa-dang` có `(1 + lanterns + 1) × 8` bản ở cả ba mức, `count` không đổi; số đo `lanterns` 0 → 1 sau
+    một lần thả; `pool` dồn đèn còn sống lên đầu; ma trận của đèn vừa thả ở gần chỗ thả, ô trống cỡ 0; khung bao chứa mọi đèn, ao
+    trống thì chỉ quanh đèn ở bờ; búp khép lúc thả, nở đủ sau `DRIFT.open` thì cánh ngả đúng như đèn ở bờ; gốc cánh k ở góc yaw + k·45°;
+    đèn chìm xuống hẳn dưới mặt nước trước khi ô bị giấu; `update(0, t)` hai lần ra cùng ma trận; "Đổi màu đèn" đổi mọi đèn, emissive
+    theo độ sáng riêng và trọng số của lớp; không có đèn trôi thì `version` của thuộc tính đứng yên, không thuộc tính instance nào dùng
+    `DynamicDrawUsage`.
+  - `tha-hoa-dang` (setup của bức, `ctx.captions` giả): chạm hai lần trên ao thả một đèn đúng chỗ, lúc `ctx.u.time`; chữ là khóa đầu
+    của `verseOrder(keys, NOW)` và neo theo đèn; đèn trôi theo trăng LÚC THẢ, kéo thanh giờ sau đó không đổi đường; mỗi lần thả là câu
+    kế tiếp, hết thì quay lại đầu; lên trời hay ngoài ao: không đèn, không chữ, không tốn câu; không có chữ thì vẫn thả đèn; hai lần
+    chạm vẫn là hai `tap` (gợn sóng, đom đóm tản), `double-tap` theo sau chỉ thả đèn; `content.vi.js` có đúng mười hai cặp câu của §5
+    theo thứ tự, gợi ý nhắc chạm hai lần.
+  - Sương: `emissiveNode` của đèn được bọc thêm `(1 − hệ số sương)`. Mặt nước: `positionNode` của đèn cộng độ cao gợn tại
+    `lanternCenter`, nhân trọng số của lớp và `lanternGlow`; vũng sáng vào `emissiveNode` của nước (màu nến, nhân trọng số của hai lớp,
+    tắt khi "Xem heightfield"), không vào `mrtNode`; nước dịch ra WGSL và GLSL ở mức cao và thấp như scene pass vẽ nó (có MRT): vòng
+    vũng sáng chạy `pool.size` vòng, `Break` khi chỉ số chạm `lanternCount`, mỗi vòng cộng `exp(−d²/r²) × độ sáng`; material của đèn
+    dịch được ở cả scene pass (MRT) lẫn ảnh phản chiếu (không MRT).
+  - `pow`: cơ số của mọi `pow` không âm, quét cả mức cao và mức thấp (phản chiếu giả có `pow` riêng). `quality`: bảng §10 có
+    `lanterns`. Cốt: "Tắt instancing" đặt lá rời trong Group `la-rieng`.
 - **`palette`, `tokens-css`, `random`, `deadline`, `disposer`.**
 - **`layers`:** mọi tên uniform khớp `/^[A-Za-z_][A-Za-z0-9_]*$/`; `weight('cot')` bằng 1; id lạ thì ném lỗi.
 - **`source`:** các helper chạy trên chuỗi mẫu.
@@ -1734,6 +2028,7 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
     - Import tương đối phải ghi đuôi `.js` hoặc `.css`.
   - `staticClosure(f)` chỉ đi theo import tĩnh tới file `.js` trong repo. Specifier trần và file `.css` là lá; không đi vào `node_modules`.
 - **`rules/imports.test.js`:** bảng §8.2, đường nhẹ (danh sách cho phép), hàng rào từ vựng (kèm phần tự kiểm), và luật "không import `strings.*.js`".
+  (GĐ 5) Phần nhẹ không gọi built-in từ ES2022 trở đi (§8.2: tầng tĩnh chạy cả trên Safari 14).
 - **`rules/files.test.js`**, áp cho mọi `src/**/*.js` và `plugins/*.js`:
   - Dòng 1 khớp `/^(\/\/|\/\*)/`.
   - Số dòng vật lý (như `wc -l`): trên 300 thì hỏng, kèm lời khuyên tách sang `parts/`. Từ 251 đến 300 thì in một bảng tổng hợp trong `afterAll`, không hỏng.
@@ -1780,11 +2075,15 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - File poster đúng `width × height` (đọc header WebP) và ≤ 150 KB.
   - `meta.og` trỏ tới một file có trong `public/`, kích thước 1200×630.
 - **GĐ 5:**
-  - `content.captions` (nếu có): khóa kebab-case không dấu; mỗi mục có `lines` gồm 1–2 dòng không rỗng, mỗi dòng ≤ 60 ký tự, và
-    `source` không rỗng.
-  - Tên vật: dựng ở mức cao và mức thấp, và trong lúc mỗi thí nghiệm đang bật, mọi vật trong `layer.objects` có `name` kebab-case
-    không dấu, không trùng trong lớp, và có nhãn ở `content.layers[id].objects[name]`. Mọi khóa trong `objects` của content ứng với
-    một vật có thật ở một trong các lần dựng đó (không có nhãn thừa).
+  - Danh sách các bức (mọi dòng registry và `_mau`, kèm cửa vào đã nạp) nằm ở `tests/helpers/paintings.js` (`ALL`), dùng chung cho
+    test hợp đồng và test tên vật. `KEBAB` (kebab-case không dấu) nằm ở `tests/helpers/kebab.js`.
+  - `content.captions` (nếu có): khóa kebab-case không dấu; mỗi mục có `lines` gồm 1–2 dòng không rỗng, mỗi dòng ≤ 60 ký tự (đếm
+    theo ký tự, không theo đơn vị UTF-16), `source` không rỗng, `author` có thì không rỗng. Luật nằm ở `tests/helpers/caption-rules.js`
+    (`captionErrors`); `tests/paintings/captions-rule.test.js` tự kiểm nó (bắt được mục sai, nhận mục đúng, kể cả chữ ngoài BMP).
+  - Tên vật (`tests/paintings/objects.test.js`, lặp qua `ALL`): dựng ở mức cao và mức thấp, và trong lúc mỗi thí nghiệm đang bật, mọi
+    vật trong `layer.objects` có `name` kebab-case không dấu, không trùng trong lớp, và có nhãn ở `content.layers[id].objects[name]`.
+    Mọi khóa trong `objects` của content ứng với một vật có thật ở một trong các lần dựng đó (không có nhãn thừa). Dòng lỗi ghi cả
+    mức đã gặp lỗi (`(mức thap)`): lỗi chỉ có ở mức thấp thì dựng ở mức cao sẽ không thấy.
   - `LayerMeta.files` của mỗi lớp kê đủ mọi file trong `parts/` của bức mà file lớp (trong `layers/`) import tĩnh, thẳng hay qua part
     khác (`staticClosure`, chỉ đi qua `parts/`): Sổ tay hiện đủ code của lớp. Cùng với luật "mỗi file thuộc tối đa một lớp", part là
     của riêng một lớp: lớp khác cần gì của nó thì nhận qua `shared`.
@@ -1843,18 +2142,55 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
   - **Bức 1 · vuốt:** chứng minh được sương xoáy. Chỉ bật Cốt + Sương, rồi so hai ảnh có vuốt và không vuốt (thay test GĐ 3 vốn chỉ
     so cả khung).
 - **GĐ 5:**
-  - **Mọi bức · Từng sợi** (cùng khung `?freeze`): bật công cụ thì ảnh không đổi; thanh về 0 thì ảnh gần như một màu (độ lệch chuẩn
-    độ sáng thấp); mỗi nấc có dòng mô tả không rỗng; "Dệt lại" chạy tới N; tắt công cụ thì về đúng ảnh cũ; không có lỗi console.
-  - **Mọi bức · quầng trăng:** chặn chunk `three` 1,5 giây bằng `page.route`; trong lúc `data-state` là `loading`, quầng có mặt với
-    phần vòng giữa 0 và 1; lúc `live` thì quầng đã ẩn. `?static`: không có quầng.
-  - **Bức 1 · thả hoa đăng** (`?at=…&freeze=N`): chạm hai lần lên nước bằng sự kiện con trỏ phát ngay trong trang (`page.evaluate`),
-    không dùng chuột của Playwright, vì mỗi sự kiện của nó phải đợi một nhịp khung (Phụ lục A.51); rồi:
-    - `__sma.readouts('anh-trang')` có `lanterns` = 1; vùng chữ có một cặp câu thuộc `content.captions` cùng nguồn của nó;
-    - ảnh quanh chỗ chạm khác ảnh trước khi thả;
-    - thả lần hai ở chỗ khác thì `lanterns` = 2 và chữ đổi sang cặp câu khác;
-    - chạm hai lần lên trời thì không có gì.
-  - **Mức cao:** `__sma.stats().drawCalls` vẫn ≤ 45 khi có đèn trôi.
-  - **A11y:** quét thêm hai trạng thái: lúc có chữ đi theo vật, và lúc Từng sợi đang bật. Bàn phím đi được tới thanh và nút của Từng sợi.
+  - **Mọi bức · Từng sợi** (khung 10 của `?freeze`):
+    - bật công cụ, chờ danh sách (`max` của thanh > 0): thanh đứng ở N và ảnh đúng bằng ảnh không có công cụ (checksum);
+    - thanh về 0 thì ảnh gần như một màu: độ lệch chuẩn độ sáng < 0,02 (`ONE_COLOUR_STD`; đo được 0,0073 trên WebGL2 SwiftShader,
+      WebGPU SwiftShader và GPU thật, chỉ còn hạt và tối góc của Phủ bóng; khung đủ chừng 0,13), và không điểm nào trong suốt;
+    - ở mỗi nấc k = 1…4: `aria-valuetext` bắt đầu bằng `valuetext(k, N, '')` và có thêm nhãn vật; `.tool-detail` có đúng nhãn ấy;
+    - "Dệt lại" đi từng bước (một MutationObserver ghi từng giá trị: 0, rồi mỗi bước thêm `playStride(N)` sợi, bước cuối đúng N) và
+      dừng ở N với `aria-pressed` false. Trần chờ tính từ `playStepMs`/`playStride`, mỗi bước cộng 1 giây cho lần vẽ lại trên GPU
+      phần mềm;
+    - tắt công cụ thì về đúng ảnh cũ; không lỗi, không cảnh báo console.
+  - **Mọi bức · quầng trăng** (bức có `[data-moon]`):
+    - chunk `three` tới chậm 1,5 giây (`page.route`). Một MutationObserver gắn bằng `addInitScript` ghi mọi ĐÍCH inline mà quầng nhận,
+      kèm thời điểm (giá trị mới của mỗi bản ghi đọc từ `oldValue` của bản ghi kế tiếp trên cùng phần tử: Phụ lục A.71, A.72);
+    - lúc trang ở `loading` trở đi thì quầng có mặt, giá trị tính được của `stroke-dashoffset` trong [0, 1]; trang về tĩnh thì test
+      báo ngay lý do (`__sma.reason`) chứ không chờ hết giờ;
+    - `live` thì quầng đã gỡ; các đích không bao giờ tăng (vòng không lùi) và có đủ, đúng thứ tự, đích của `loading` → `chunk` →
+      `compiling` → `fading` (đọc từ `HALO_STEPS`). Đây là kiểm tra duy nhất của dây nối `progress('chunk')` của boot trong trình
+      duyệt thật, với lần `import()` thật của run.js; `tests/unit/boot.test.js` giữ dây nối ấy trong jsdom (`loadRun` giả);
+    - `?static`: không có quầng, nhật ký rỗng.
+  - **Mọi bức · bảng công cụ** (máy tính, xưởng mở bằng lời mời):
+    - 1280×800: bật lần lượt Từng sợi, Kính mài, Lột lớp: Sổ tay vẫn mở; bảng không chồng lên thanh lớp hay Sổ tay và ở giữa khoảng
+      trống giữa hai tấm (lệch ≤ 1 px); "Dệt lại", mọi nút của Kính mài, thanh của Lột lớp bấm trúng (nằm trọn trong khung nhìn,
+      `elementFromPoint` ở tâm là chính nó); hàng của Từng sợi (thanh, số đếm, "Dệt lại") trên một dòng. Một dòng chỉ kiểm ở 1280
+      px: ở 1240 px hàng chỉ dư chừng 4 px với chữ của macOS, mà chữ trên Ubuntu của CI có thể rộng hơn;
+    - 1240 px (ngưỡng): Sổ tay vẫn mở, bảng không chồng tấm nào, "Dệt lại" bấm trúng. 1440 px: bảng 560 px vẫn ở giữa khoảng trống
+      680 px. Đóng thanh lớp: bảng về giữa cả khung;
+    - 1024×768: bật Từng sợi thì Sổ tay thu lại, bảng không chồng lên thanh lớp và ở giữa thanh công cụ, "Dệt lại" bấm trúng; tắt thì
+      Sổ tay hiện lại;
+    - "Dựng lại cảnh" (trong test mất context WebGL): cảnh mới có `[data-rail] + [data-toolbar]`.
+  - **Bức 1 · thả hoa đăng** (`?at=2026-10-25T21:00&freeze=120`, đêm 16 tháng Chín (trăng gần tròn, sáng 99,6%), đêm của poster):
+    chạm hai lần lên nước bằng sự kiện con trỏ phát ngay trong trang (`e2e/helpers.js#doubleTapAt`, §17), sau khung 15 và không muộn
+    hơn khung 29: tới khung 120 búp đã đủ 1,5 giây để nở, nến đủ 0,5 giây để sáng. Rồi:
+    - `__sma.readouts('anh-trang')` có `lanterns` = 1; chữ hiện (`data-shown`, không `data-away`) và đúng câu đoán trước,
+      `verseOrder(Object.keys(captions), parseAt(at))[0]`, từng dòng và dòng nguồn;
+    - quanh chỗ chạm có nhiều điểm sáng ấm (R > 150, G > 110, R − B > 40) hơn hẳn lần chạy có cùng hai lần chạm cách nhau 600 ms (hai
+      lần chạm thường: có gợn, không đèn, không chữ, `lanterns` = 0): hơn ít nhất 300 điểm. Đo ở 640×400: có đèn 843 (WebGL2
+      SwiftShader, mức vừa), 927 (WebGPU SwiftShader), 937 (GPU thật); hai lần chạm thường 18–43. Phần lớn số điểm là vũng sáng;
+    - thả lần hai ở chỗ khác thì `lanterns` = 2 và chữ đổi sang câu `[1]`; chạm hai lần lên trời thì vẫn 2 và chữ không đổi; không lỗi
+      console.
+  - **Bức 1 · draw call có hoa đăng** (chỉ WebGPU, `?level=cao&freeze=90`): thả hai đèn khi vòng lặp còn chạy; `__sma.stats().drawCalls`
+    đúng bằng số trước khi thả (35 → 35) và ≤ 45: đèn chung InstancedMesh với đèn ở bờ.
+  - **A11y:**
+    - axe quét thêm hai trạng thái: Từng sợi đang bật (đã có danh sách: thanh đủ N nấc, "Dệt lại" bấm được), và lúc có chữ đi theo vật
+      (Bức 1, `?at=2026-09-28T21:00&freeze=10`, chạm hai lần lên nước, chờ chữ hiện hẳn: opacity 1);
+    - bàn phím: Enter trên nút Từng sợi của thanh lớp bật công cụ; chờ danh sách ("Dệt lại" bị khóa tới lúc đó, mà Tab bỏ qua nút bị
+      khóa); rồi đường Tab từ nút ấy phải ĐÚNG như danh sách dựng từ `__sma.tools()` và `__sma.dials()`. Với Bức 1, ở 640 px:
+      `button@rail:chip, input@rail:range, button@rail, button@rail, input@tool:range, button@tool` (nút "◷ 21:00", thanh giờ, "Phủ lớp
+      tiếp theo", nút đóng, rồi thanh và nút của Từng sợi); ở 1280 px với Sổ tay mở lại:
+      `input@rail:range, button@rail, button@rail, input@tool:range, button@tool, button@nb`. Không vòng về đầu trang, Sổ tay sau bảng.
+      Phím mũi tên trên thanh đổi `aria-valuetext`.
 - Ảnh chụp và trace lưu vào `e2e/.results/`.
 
 ### Kiểm tra thủ công
@@ -1878,6 +2214,9 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
 - (GĐ 5) Điện thoại thật: chạm hai lần thả được đèn, không làm trình duyệt phóng to; chữ không tràn ra ngoài màn hình.
 - (GĐ 5) VoiceOver đọc cặp câu và nguồn khi đèn được thả, và đọc được thanh của Từng sợi.
 - (GĐ 5) Mạng chậm (DevTools › Network › Slow 4G): quầng trăng nhích đều tới lúc hòa dần, không đứng hẳn ở mốc nào.
+- (GĐ 5) Tab và VoiceOver trên Mac thật ở 1280 px và 1024 px: từ nút Từng sợi, Tab đi hết phần còn lại của thanh lớp rồi vào bảng
+  của nó, trước Sổ tay; VoiceOver đọc thanh của Từng sợi (`aria-valuetext`) mà không đọc lại ô số k/N ở mỗi bước của "Dệt lại".
+- (GĐ 5) Zoom trình duyệt (125%, 150%) ở bề rộng quanh 1240 px: bảng công cụ không nằm dưới Sổ tay.
 
 ## 13. Repo, CI, deploy
 
@@ -1911,6 +2250,9 @@ Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" vớ
     - **`e2e-webgpu`** (không chặn: `continue-on-error: true` ở cấp job, trần 25 phút): `npm ci` → `npm run build` → cài Chromium đầy
       đủ → e2e `webgpu-swiftshader` → giữ ảnh vào thư mục riêng.
     - **`deploy`** chỉ cần `build`.
+    - (Sau merge GĐ 4, PR #5) `e2e-webgpu` có trần 40 phút: bước cài Chromium có lúc mất gần 7 phút, cộng 18,5 phút e2e là quá 25.
+      `e2e/.results` là thư mục ẩn, mà `upload-artifact` (từ v4.4) mặc định bỏ file ẩn: cả hai bước giữ ảnh đặt
+      `include-hidden-files: true`.
 - **URL:** `https://giabao2610.github.io/son-mai-anh-sang/`.
 - **Luật trong `CLAUDE.md`:**
   - **Nguồn tham chiếu:**
@@ -1948,7 +2290,7 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
 | **2 · Sổ tay** | Hoàn thiện `contracts/runtime.js`; núm `js`/`rebuild` + `onKnob`; thanh lớp, chế độ mài; Sổ tay 3 tab; Tweakpane (import động); code sống; nhãn chuyển sang content; tween trọng số; `snapshot`/`restore` + "Dựng lại cảnh"; `sma.expose()`; Phủ bóng chọn tone bằng `If` + đủ núm; tranh mẫu `_mau`; contract test đầy đủ; Phá cho lớp 1/2/4; e2e `setWeight` và Sổ tay | Bật/tắt lớp không khựng; test marker và hợp đồng qua |
 | **3 · Sương + Vàng lá GPU** | Lớp 3 hoàn chỉnh; lớp 5 compute + biến thể CPU; `degrade`, `quality.js` của bức và `ladder`; bộ điều chỉnh chất lượng chạy thật. Kèm theo (chốt khi lập kế hoạch GĐ 3): trần 60 khung/giây, trần núm theo mức, bộ điều chỉnh canh cả khi Sổ tay mở; vuốt → sương xoáy; curl noise; thí nghiệm `compare` + ms CPU; `?level`; huy hiệu "hạ {n} nấc"; `__sma.quality/degrade/upgrade/stats`; mục hoãn của GĐ 2 (phản chiếu giả ở mức thấp, bóng tĩnh + khung bóng ôm sát, bỏ compute khi `w5 = 0`, đo draw call); Phụ lục A.29+; lượt màu cả bức so với poster | Điện thoại từ 45fps trở lên; mức cao ≤ 45 draw call; đã deploy |
 | **4 · Phủ bóng + Kính mài** | Phủ bóng hoàn chỉnh (chặng `display`: LUT từ bảng màu, grain, vignette, FXAA; `tap`); `Tool` + Kính mài + Lột lớp dựng từ `views()`; `Dial` + `ui/dials.js` + thanh giờ; `?poster` + poster thật + og (`scripts/poster.js`); e2e "mài về cốt"; kiểm tra a11y; README gồm mục "Thêm một bức tranh mới". Kèm theo (chốt khi lập kế hoạch GĐ 4): bộ điều chỉnh đo thời gian GPU thật (chẩn đoán theo máy, `engine/tuner.js`) và ms GPU trong Sổ tay; Kính mài có hai hình (tròn, gạt trước/sau); đồ nghề và thanh giờ nằm trong thanh lớp; a11y bằng axe-core; og dạng JPEG; các mục còn nợ của GĐ 3 (trần khung trên màn 60,0x Hz, nấc `suong.chi-tiet` ở mức thấp, `update(0, t)` khi vẽ lại lúc `?freeze`, kiểm trần do `max()` trả, ba mức cùng bộ khóa, e2e vuốt chứng minh sương xoáy, tách e2e WebGPU ra job riêng, sửa lời spec) | Mọi e2e qua; đã deploy; README đầy đủ |
-| **5 · Hoa đăng + Từng sợi** *(tùy chọn)* | Trong sáu mục dự kiến, Bao chọn ba: **trăng tiến độ** (quầng trong `[data-moon]`, mốc từ `boot`/`run`), **Từng sợi** (`engine/gpu/draws.js` + `tools/tung-soi.js`, `ToolApi.draws`, tên vật + nhãn), **thả hoa đăng** (cử chỉ `double-tap`, `ctx.captions` + `ui/captions.js`, đèn gộp InstancedMesh của lớp Ánh trăng, vũng sáng trên nước, 12 cặp câu thơ). Kèm theo: `__sma.readouts`, luật móc lần vẽ, gợi ý mới. Ba mục còn lại (link công thức, Xem bản dịch, đàn bầu) để sau (§16) | Mọi test và e2e qua; mức cao vẫn ≤ 45 draw call (đèn không thêm draw call); Bao duyệt chữ của thơ; đã deploy |
+| **5 · Hoa đăng + Từng sợi** *(tùy chọn)* | Trong sáu mục dự kiến, Bao chọn ba: **trăng tiến độ** (quầng trong `[data-moon]`, mốc từ `boot`/`run`), **Từng sợi** (`engine/gpu/draws.js` + `tools/tung-soi.js`, `ToolApi.draws`, tên vật + nhãn), **thả hoa đăng** (cử chỉ `double-tap`, `ctx.captions` + `ui/captions.js`, đèn gộp InstancedMesh của lớp Ánh trăng, vũng sáng trên nước, 12 cặp câu thơ). Kèm theo: `__sma.readouts`, luật móc lần vẽ, gợi ý mới. Chốt khi dựng thử: bảng công cụ không còn nằm dưới Sổ tay và Tab từ nút công cụ không còn vòng qua cả trang mới tới bảng (lỗi GĐ 4), "Dựng lại cảnh" quá hạn không đụng trang đã về tĩnh cùng bộ test đầu tiên cho `run()` (lỗi GĐ 2), khung chữ một cột (lỗi GĐ 1), luật đường nhẹ không dùng built-in ES2022, luật `files` của lớp kê đủ `parts/`. Ba mục còn lại (link công thức, Xem bản dịch, đàn bầu) để sau (§16) | Mọi test và e2e qua; mức cao vẫn ≤ 45 draw call (đèn không thêm draw call); Bao duyệt chữ của thơ; đã deploy |
 | 6 · *(mở rộng)* | Bức mới theo luật 7: Đèn kéo quân (shadow map vs gobo `atan(y, x)`), Đông Hồ (hạt compute), Cung Quế (SDF raymarch) | tùy |
 
 **GĐ 0 · Nền móng gồm:**
@@ -1998,6 +2340,8 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
    - (GĐ 5) Mọi vật trong `objects` có `name`; nhãn ở `content.layers[<id>].objects`.
 2. Với mỗi núm `uniform`: lấy uniform bằng `ctx.knob('<id>')` và ghi `// @knob <id>` ở dòng dùng nó. Núm `js`/`rebuild` thì đặt `via` và thêm `onKnob[id]`, với marker ở dòng xử lý.
 3. Thêm `{ id, name, files }` vào `meta.layers`, và thêm module vào `painting.layers`, ở cùng vị trí.
+   - (GĐ 5) `files` kê mọi file `parts/` mà lớp import, thẳng hay qua part khác (Sổ tay hiện đủ code); lớp khác cần gì thì nhận qua
+     `shared`, không import part của lớp này (test hợp đồng giữ).
 4. Thêm `content.vi.js › layers[<id>]`.
 5. Nếu lớp tốn tài nguyên: thêm `degrade` (không đụng tới thứ nằm trong cache key), thêm khóa vào `quality.levels`, và đặt vị trí trong `ladder`.
 6. Chạy `npm test`. Thanh lớp, lời mời "{n} lớp" và chế độ mài tự nhận lớp mới.
@@ -2051,7 +2395,9 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
 | Tự lùi về đom đóm CPU khi compute WebGL2 hỏng | Khi gặp máy thật lỗi | Đếm lỗi của `renderer.onError` trong vài khung đầu; quá ngưỡng thì bật biến thể CPU làm mặc định cho lần dựng đó |
 | Rút `curl`, noise JS sang dùng chung | Luật hai lần | `curl` đã ở `lib/tsl/noise.js` (spec đặt từ đầu); noise JS của biến thể CPU ở lại `parts/vang-la-cpu.js` tới khi bức thứ hai cần |
 | ~~Trăng làm thanh tiến độ~~ | Làm ở GĐ 5 | §4.1 mục 1, §8.5: quầng trăng |
-| Từng sợi cho mọi lượt vẽ (phản chiếu, bloom, hậu kỳ) | Khi người xem cần | `DrawProbe` đã đếm lần vẽ của camera khác; bloom và FXAA tự cất móc (Phụ lục A.53), nên phải móc ở chỗ khác hay dùng Inspector |
+| Từng sợi cho mọi lượt vẽ (phản chiếu, bloom, hậu kỳ) | Khi người xem cần | `DrawProbe` đã đếm lần vẽ của camera khác; bloom và RTT của FXAA tự cất móc (`resetRendererState`, Phụ lục A.53), nên phải móc ở chỗ khác hay dùng Inspector |
+| Từng sợi tách hai lần vẽ của vật trong suốt DoubleSide | Khi một bức có material như thế | three vẽ cả hai mặt trong MỘT lần gọi móc (§7, Phụ lục A.53): đặt `forceSinglePass`, hay chia thành hai material |
+| Chữ đi theo vật đo lại khi bố cục đổi giữa chừng | Khi thấy chữ lệch sau khi xoay máy | Hiện cỡ chữ và chân khung chỉ đo lúc `show` (§4.1 mục 10). Đo lại khi `resize`, hay `ResizeObserver` trên các ô của chân khung |
 | Tô sáng sợi vừa vẽ | Khi người xem cần | Vẽ thêm một lượt mặt nạ cho vật của sợi k, rồi overlay trộn viền vàng lá như Kính mài |
 | Hoa đăng tránh lá, hay bị gợn đẩy đi | Khi thấy cần | Đường trôi hiện tính thẳng theo thời gian (tất định với `?freeze`); bị đẩy thì phải tích phân từng khung, và `update(0, t)` phải giữ đúng khung N |
 | Hoa đăng chiếu sáng thật | Không làm | Mỗi `PointLight` thêm lúc chạy là biên dịch lại mọi material và tốn thêm ở mọi điểm ảnh; vũng sáng trên nước đã cho cảm giác đèn soi nước |
@@ -2105,9 +2451,17 @@ Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans
   - Ghim r186; Phụ lục A.53 ghi đúng chỗ three gọi, cất và trả móc. Chỉ `draws.js` đặt móc (luật §8.2), móc gọi lại hàm trước đó, và
     `stop()` luôn trả hàm cũ.
   - Unit test dùng renderer giả; e2e giữ hai đầu: sợi 0 gần như một màu, sợi N đúng bằng ảnh không có công cụ.
+  - Chỗ dễ vỡ nhất là THỨ TỰ `updateBefore` của lượt cuối (Phụ lục A.53): móc chỉ thấy lượt vẽ cảnh khi scene pass vẽ đầu tiên.
+    `tests/unit/pipeline.test.js` dựng lượt cuối bằng `WGSLNodeBuilder` thật để bắt ngay khi three đổi thứ tự đó.
 - **(GĐ 5) E2e chạm hai lần phụ thuộc thời gian.** Hai lần chạm phải trong 300 ms, mà mỗi sự kiện chuột của Playwright đợi một nhịp
-  khung (Phụ lục A.51). E2e phát `pointerdown`/`pointerup` ngay trong trang (`page.evaluate`), liền nhau trong cùng một tác vụ;
-  `gesture.js` đo bằng `performance.now()` lúc xử lý sự kiện, nên hai lần chạm cách nhau chưa tới 1 ms. Unit test giữ các ngưỡng.
+  khung (Phụ lục A.51), có khi vài trăm ms trên GPU phần mềm. E2e phát sự kiện ngay trong trang, trong một lần `page.evaluate`:
+  `e2e/helpers.js#doubleTapAt(page, fx, fy, { gapMs = 40 })` phát `pointerdown`/`pointerup`, chờ `gapMs` ngay trong trang
+  (`setTimeout`), rồi `pointerdown`/`pointerup` lần nữa, với `pointerId: 1`, `pointerType: 'mouse'`: OrbitControls gọi
+  `setPointerCapture(pointerId)` lúc chạm xuống, mà hàm đó ném lỗi với id không phải con trỏ đang có (Phụ lục A.66); con trỏ chuột
+  (id 1) thì Chromium luôn có. Hàm trả `__sma.frames` ngay sau lần chạm hai.
+  - Trong lúc chờ `gapMs`, trang vẫn chạy tiếp: luồng chính kẹt quá chừng 260 ms (300 − 40) giữa hai lần chạm thì cử chỉ thành hai
+    lần chạm thường, và test HỎNG (`lanterns` vẫn 0, không có chữ), không bao giờ qua oan.
+  - Phép so của test hoa đăng dùng `gapMs: 600` (quá 300 ms): hai lần chạm thường. Unit test của `gesture` giữ các ngưỡng.
 - **(GĐ 5) Chạm hai lần trên điện thoại có thể làm trình duyệt phóng to.** OrbitControls đặt `touch-action: none` cho canvas, nên
   trình duyệt không phóng to khi chạm vào cảnh. Kiểm trên điện thoại thật (§12).
 - **(GĐ 5) Thơ in sai chữ.** Mười một cặp câu đã đối chiếu nguồn lúc viết spec; mục `guong-nga` chưa. Bao đọc lại cả mười hai trước
@@ -2292,7 +2646,7 @@ Các mục dưới đây đã được kiểm bằng ba cách:
     tới trang, nên cú vuốt 5 sự kiện đã mất 200–250 ms trên máy Mac rảnh; máy CI chậm hơn là quá 300 ms. Còn cú kéo chậm có bước
     đầu 6 px (dưới `tapPx` 8) thì còn ở "chờ": bước kế tới trễ quá 350 ms là thành "giữ", và `input.js` tắt camera giữa chừng. E2e
     giờ cho cú kéo bước đầu 12 px, cú vuốt chỉ một bước; test đo thời lượng nét ngay trong trang và vuốt lại (tối đa ba lần) khi
-    môi trường quá chậm.
+    môi trường quá chậm. (GĐ 5) Cũng vì vậy, e2e chạm hai lần (trong 300 ms) phát sự kiện con trỏ ngay trong trang (§17).
 52. **`color('#hex')` của TSL là màu tuyến tính** (unit test và đo pixel, sửa sau GĐ 4): chuỗi hex đi qua `Color.setStyle`, và
     `ColorManagement` đổi nó từ sRGB sang không gian làm việc (tuyến tính). Màu trộn ở không gian hiển thị (overlay của công cụ, sau
     `renderOutput`) phải là số sRGB: `new Color('#D4A94A').convertLinearToSRGB()`. Viền Kính mài của GĐ 4 dùng thẳng
@@ -2322,3 +2676,112 @@ Các mục dưới đây đã được kiểm bằng ba cách:
     - Không gọi hàm vẽ cho một mục là mục đó không được vẽ, và `renderer.info` không đếm nó. Mặt nước bị bỏ qua thì reflector cũng không
       vẽ lại ở khung đó.
     - Inspector của `?debug` không dùng móc này (không file nào của inspector gọi nó).
+    - Một lần gọi hàm vẽ không luôn là một draw call: material trong suốt, `DoubleSide`, `forceSinglePass` false thì
+      `Renderer.renderObject` tự vẽ hai lần (lượt `'backSide'` rồi mặt trước) trong MỘT lần gọi. Vật có transmission thì khác: render
+      list xếp nó vào lượt riêng, và hàm vẽ được gọi hai lần, lần đầu với `passId` `'backSide'`. Vì vậy khóa của `limit(k)` có
+      `passId` (§7).
+    - `renderer.info` chỉ về 0 ở nhịp rAF của renderer (`Animation`, khi `info.autoReset`), không ở mỗi `render()`: draw call của một
+      khung là hiệu số tính từ đầu khung.
+    - Hệ quả về màu xóa (ở trên) đã kiểm trên GPU thật lúc tinh chỉnh GĐ 5: ảnh mặc định của Bức 1 không đổi.
+    - **E2e kiểm lại** (test Từng sợi, trên WebGL2 SwiftShader, WebGPU SwiftShader và GPU thật): bật công cụ là có danh sách lần vẽ
+      (N > 0); sợi 0 gần như một màu (độ lệch chuẩn độ sáng 0,0073, khung đủ chừng 0,13); sợi N đúng bằng ảnh không có công cụ. Sợi 0
+      chỉ một màu được khi móc thấy và chặn được mọi lần vẽ của lượt vẽ cảnh, tức scene pass đứng đầu lượt cuối. Thứ tự `updateBefore`
+      còn được `tests/unit/pipeline.test.js` giữ bằng `WGSLNodeBuilder` thật.
+54. **Chrome đo `pathLength` của hình rất nhỏ quá thô** (kiểm trên Chrome, dựng thử GĐ 5): với `<circle r="1.05"
+    pathLength="1">` (trăng có viewBox ±1,1), Chrome tính chu vi thô tới mức mỗi phần tư vòng thành một dây cung: chừng 4·r·√2 ≈
+    0,9·2πr. Nét `stroke-dasharray` tính theo `pathLength` vì vậy không bao giờ khép: lúc rỗng vẫn ló một cung. Vẽ ở tọa độ riêng lớn
+    gấp 100 (`r="105"`, `transform="rotate(-90) scale(0.01)"`, nét 9) thì đo đúng. Khoảng trống của `stroke-dasharray: 1 2` dài hơn cả
+    vòng, nên lúc rỗng không có nét nào của chu kỳ sau ló ra, trình duyệt nào cũng vậy.
+55. **`OrbitControls.update()` chỉ gọi `camera.lookAt()`** (đọc mã nguồn, kiểm bằng unit test, GĐ 5): hướng mới nằm trong
+    `quaternion`, còn `matrixWorld` và `matrixWorldInverse` tới lúc `render()` mới được tính lại. Chiếu một điểm 3D ra màn hình trước
+    `render()` (chữ đi theo vật) thì gọi `camera.updateMatrixWorld()` trước, không thì chữ chạy trễ camera một khung khi người xem kéo.
+56. **`render()` đặt `camera.coordinateSystem` theo backend** (đọc mã nguồn `Renderer.js`, kiểm bằng unit test, GĐ 5): với WebGPU, z
+    của NDC nằm trong [0, 1] (WebGL: [−1, 1]; `reversedDepth` thì đảo chiều), và ma trận chiếu được tính lại theo đó. Luật "trong
+    khung" mà xét z của NDC trong (−1, 1) sẽ nhận cả điểm sát camera hơn near trên WebGPU. Cách đúng ở mọi quy ước: xét độ sâu trong
+    tọa độ camera (−z trong [near, far]), rồi mới xét x, y của NDC trong [−1, 1].
+57. **`display: none` (thuộc tính `hidden`) hủy transition và gỡ phần tử khỏi cây trợ năng** (chốt khi làm chữ đi theo vật, GĐ 5):
+    phần tử bị `hidden` rồi hiện lại thì trình đọc màn hình có thể đọc lại nội dung của nó (trong vùng `aria-live`: đọc lại cả câu),
+    và CSS transition không chạy (hiện lại đột ngột). Chữ cần ẩn tạm mà vẫn ở trong vùng live thì ẩn bằng opacity qua một thuộc tính
+    (`data-away`); luật đó cùng độ ưu tiên với `[data-shown]`/`[data-fading]` nên phải đứng sau chúng để thắng.
+58. **Transition từ giá trị đầu cần chốt style sau khi gắn phần tử** (kiểm trên trình duyệt, GĐ 5): gắn phần tử với giá trị đầu
+    (dashoffset 1, opacity 0) rồi đặt đích trong cùng một lần tính style thì trình duyệt chỉ thấy giá trị đích: không có transition,
+    phần tử nhảy thẳng. Đọc `getComputedStyle(el).<thuộc tính>` ngay sau khi gắn để trình duyệt tính style một lần, rồi mới đặt đích
+    (`ui/moon-progress.js` lúc vẽ vòng mới, `ui/captions.js` trước khi gắn `data-shown`).
+59. **`InstancedMesh` của r186 không đặt `type` riêng** (đọc mã nguồn, unit test, GĐ 5): `type` vẫn là `'Mesh'`; phân biệt bằng
+    `isInstancedMesh` (`draws.js`, test tên vật).
+60. **Soi đồ thị TSL trong test** (dựng trong Node, không GPU, GĐ 5):
+    - `Fn(…)()` và `vec4(a, b)` trả một VarNode "intent" bọc node thật (`ShaderCallNodeInternal`, `JoinNode`): bóc `node.node` khi
+      `isVarNode && intent`.
+    - Thân của `Fn` chỉ chạy lúc dựng, và `getChildren()` không đi vào thân. Muốn thấy vòng lặp hay phép so bên trong `Fn` thì dịch ra
+      mã (`tests/helpers/nodes.js#compileMaterial`), hay dựng bằng builder thật rồi đọc stack của thân (`getOutputNode(builder)`,
+      `tests/helpers/final-pass.js`).
+    - Một `.toVar()` không ai đọc vẫn được dựng, theo đúng thứ tự trong thân `Fn` (A.53 dựa vào điều này), nhưng `StackNode` bỏ qua
+      nó lúc sinh code: shader y hệt khi không có biến.
+    - `NodeBuilder.addStack()` đặt stack hiện tại của TSL, một biến toàn cục: dựng xong phải `removeStack()`.
+      `ShaderCallNodeInternal.setupOutput` tự `addStack()` và chỉ `removeStack()` khi thân `Fn` không ném lỗi, nên dựng hỏng giữa
+      chừng thì trả HẾT stack của builder (`while (builder.stacks.length > 0) builder.removeStack()`), không thì stack rò sang test sau.
+61. **Dịch material trong test** (kiểm bằng `tests/helpers/nodes.js`, GĐ 5):
+    - r186 chỉ áp MRT của renderer và `mrtNode` của material khi đang vẽ vào một render target (`NodeMaterial.setup`:
+      `renderer.getRenderTarget() !== null`). Không đặt target là dịch biến thể vẽ thẳng ra canvas: một đầu ra, bỏ qua `mrtNode`,
+      biến thể mà cảnh không bao giờ vẽ. `compileMaterial` gọi `setRenderTarget` trước khi dịch (ảnh HalfFloat với MRT như scene pass,
+      hay một ảnh, MRT `null`, như reflector); hàm đó chỉ ghi lại target, nên chưa `init()` vẫn dùng được.
+    - `warnOnce` của three nhớ theo tiến trình (Vitest: theo file test): cảnh báo đã in lúc dựng đồ thị thì lúc dịch không in lại.
+      `warn` thường (như "Return statement used in an inline 'Fn()'", A.46) thì lần dịch nào cũng in.
+62. **`DynamicDrawUsage` tải lại thuộc tính ở MỌI lần render** (đọc mã nguồn `renderers/common/Attributes.js`, chung cho WebGPU và
+    WebGL2, GĐ 5): thuộc tính được chép lên GPU khi `version` của nó tăng (`needsUpdate`), HOẶC khi `usage === DynamicDrawUsage`, bất
+    kể version. Thuộc tính chỉ đổi lúc có việc (hoa đăng) thì để usage mặc định và đặt `needsUpdate` khi ghi; `DynamicDrawUsage` chỉ
+    cho thuộc tính ghi lại mỗi khung (đom đóm CPU, A.37).
+63. **`setMatrixAt` không cập nhật `InstancedMesh.boundingSphere`** (đọc mã nguồn, unit test, GĐ 5): three tính khung bao một lần (lần
+    đầu cần tới) rồi giữ. Frustum culling dùng khung bao này: ma trận mới đưa bản ra ngoài khung cũ, rồi khung cũ ra khỏi màn hình,
+    thì three bỏ cả mesh. Ghi ma trận xong thì `computeBoundingSphere()`; ô trống (ma trận cỡ 0) đặt ở chỗ không làm phình khung bao.
+64. **Uniform buffer của từng vật được chép lại ở MỖI lượt vẽ** (đọc mã nguồn r186, GĐ 5):
+    - `uniformArray` là một `BufferNode` trong nhóm `objectGroup`, một binding riêng. Nhóm đó có `updateType` OBJECT, nên
+      `NodeManager.updateGroup` luôn trả true: mảng được chép vào bộ đệm của nó ở mỗi lần render (`updateType` RENDER), và cả bộ đệm
+      được ghi lên GPU ở MỖI lượt vẽ có dùng nó (mảng gợn sóng: nước, lá, hoa đăng, cả trong ảnh phản chiếu), không phải một lần
+      mỗi khung.
+    - `InstancedMesh` có `count × 64` byte không quá giới hạn uniform buffer (WebGPU ≥ 64 KB, WebGL2 ≥ 16 KB) thì `instanceMatrix` đi
+      vào uniform buffer của vật (`nodes/accessors/Instance.js`), cũng chép lại ở mỗi lượt vẽ dù `needsUpdate` có bật hay không. Quá
+      giới hạn thì three chuyển sang thuộc tính interleaved, lúc đó `needsUpdate` (và `DynamicDrawUsage`, A.62) mới có tác dụng.
+65. **`GLSLNodeBuilder` đặt lại tên mọi `uniformArray`** (đọc mã nguồn, unit test, GĐ 5): `setName('lanternPool')` chỉ hiện trong WGSL
+    (`var<uniform> lanternPool`). Ở mỗi lần dịch GLSL, `getUniformFromNode` gán `node.name = 'NodeBuffer_<id>'` (cache của nó không
+    được giữ), ghi đè luôn tên của node: mã WebGL2 luôn là `uniform NodeBuffer_<id> { … }`, và một lần dịch WGSL SAU đó trên cùng node
+    cũng mang tên mới. Test dịch cả hai backend từ một đồ thị thì dịch WGSL trước.
+66. **`setPointerCapture` ném lỗi với pointerId không có thật** (kiểm bằng Playwright, GĐ 5): OrbitControls gọi
+    `domElement.setPointerCapture(event.pointerId)` lúc chạm xuống. Sự kiện con trỏ tự phát (`dispatchEvent`) với id không phải con trỏ
+    đang có thì hàm đó ném `NotFoundError`. Con trỏ chuột (id 1) thì Chromium luôn có, nên e2e phát `pointerId: 1, pointerType: 'mouse'`.
+67. **Trình duyệt cắt phần lẻ của thời gian `setTimeout`** (WebIDL `long`, GĐ 5): `setTimeout(fn, 16.8)` hẹn 16 ms. "Dệt lại" với 5.000
+    sợi có bước 16,8 ms nên chạy 16 ms một bước, cả lượt chừng 11,4 giây (vẫn dưới 12). Đồng hồ giả của Vitest cũng cắt (`parseInt`),
+    nên test chọn N có bước tròn (1.200 → 20 ms, 2.000 → 18 ms).
+68. **`<output>` ngầm là một vùng live** (ARIA, GĐ 5): vai trò ngầm của `<output>` là `status` (`aria-live` polite). Ô số đổi ở mỗi bước
+    của một hoạt ảnh (40 ms một bước) sẽ làm ngập hàng đợi của trình đọc màn hình: đặt `aria-live="off"`, tiến độ đi qua
+    `aria-valuetext` của thanh. Nút `disabled` bị Tab bỏ qua, nên e2e đi bằng bàn phím phải chờ tới lúc nút mở. Test (jsdom 30): lỗi
+    ném trong listener `input` không tới chỗ gọi `dispatchEvent` mà thành sự kiện `error` trên `window`.
+69. **CSS grid xếp phần tử sang một cột ngầm khi hai phần tử cùng hàng** (lỗi có từ GĐ 1, tìm ra khi tinh chỉnh GĐ 5 trên GPU thật):
+    `[data-static]` (vùng live: luôn có mặt, rỗng thì thu lại) và `.hint` đều ghim `grid-row: 2` mà không ghim cột, nên lưới tự đặt
+    `.hint` vào một cột ngầm thứ hai. Cột đó ép gợi ý thành một cột chữ hẹp (86 px, năm dòng trên điện thoại 390 px), còn đầu và chân
+    trang chỉ còn cột 1: huy hiệu và con dấu lệch vào giữa màn hình máy tính thay vì nằm ở góc phải. Sửa: `.frame > * { grid-column: 1 }`.
+70. **Transition của `stroke-dashoffset` chạy trên luồng chính** (đo bằng Playwright trên GPU thật và SwiftShader, GĐ 5): compositor
+    chỉ chạy hộ vài thuộc tính (opacity, transform). Luồng chính bận (dựng cảnh, khung ẩn đồng bộ) thì quầng đứng yên, rảnh ra mới
+    nhảy tới chỗ đáng lẽ đã tới. Transition đặt TRONG một tác vụ dài lấy giờ bắt đầu từ khung trước lúc chặn: trên WebGL2 SwiftShader,
+    mốc `chunk` được đặt trong cùng tác vụ với `getContext` (chặn 1,25 giây), nên khung đầu tiên sau đó coi như transition đã chạy
+    1,25 trong 4 giây (31% thời gian là 77% quãng theo đường ease-out): quầng nhảy từ gần 0 lên chừng 0,48.
+71. **Chromium không có accessor riêng cho từng thuộc tính của `CSSStyleDeclaration`** (kiểm bằng Playwright, GĐ 5): thay setter của
+    `strokeDashoffset` trên prototype không bắt được gì, vì gán `el.style.strokeDashoffset = …` không đi qua đó. Muốn ghi mọi giá trị
+    inline mà một phần tử nhận thì dùng `MutationObserver` trên thuộc tính `style`, có `attributeOldValue`.
+72. **`MutationObserver` gom mọi lần đổi của một tác vụ vào một lần gọi** (kiểm bằng Playwright, GĐ 5): một mốc của quầng đổi `style`
+    hai, ba lần liền nhau (opacity, transition, dashoffset), mà callback chỉ được gọi một lần với nhiều bản ghi, mỗi bản ghi chỉ có
+    `oldValue`. Giá trị MỚI của bản ghi i là `oldValue` của bản ghi kế tiếp trên cùng phần tử, hay style hiện tại nếu không còn bản
+    ghi nào sau nó.
+73. **Phần trăm trong `max-width` của con một phần tử flex có thể "vòng"** (đo trên GPU thật, GĐ 5): `.toolbar > .tool > .tool-panel`,
+    với `.tool` là phần tử flex của thanh. Lúc tính bề rộng nội dung của `.tool`, phần trăm trong `max-width` của bảng lại phụ thuộc
+    chính bề rộng đó, nên Chromium bỏ CẢ khai báo `max-width` (kể cả phần 560 px): ô rộng theo dòng chữ dài nhất và bảng lệch 58 px
+    khỏi giữa. Giữ `max-width: min(560px, calc(100vw - 2 * var(--gutter)))`, không có `%`; unit test cấm `%` ở đó.
+74. **Bề rộng CSS có thể lẻ** (đo trên GPU thật bằng iframe có `zoom: 1.25`, review GĐ 5): zoom trình duyệt hay tỉ lệ hiển thị của hệ
+    điều hành cho bề rộng như 1239,2 px (cửa sổ 1549 px ở 125%). Cặp `@media (max-width: 1239px)` / `(min-width: 1240px)` để hở khoảng
+    giữa 1239 và 1240: không luật nào khớp, và bảng công cụ lại nằm dưới Sổ tay. Viết cặp bù nhau: một luật mặc định cộng một luật đè,
+    hay quy ước `.98` của Bootstrap (`max-width: 1239.98px`). Cú pháp khoảng `width < 1240px` cũng được, nhưng Safari 16.2–16.3 (vẫn
+    có `color-mix` mà trang dùng) chưa hiểu.
+75. **Phần nhẹ chạy trên trình duyệt cũ** (GĐ 5): tầng tĩnh là chỗ dựa của máy cũ, mà phần nhẹ đã cần `replaceChildren` (có từ
+    Safari 14). Built-in từ ES2022 trở đi chưa có ở đó: `Object.hasOwn` (Safari 15.4, Chrome 93), `Array.prototype.at` (Safari 15.4),
+    `findLast`…; `structuredClone` cũng chưa có (API của trình duyệt, không thuộc ES). Gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ
+    huy hiệu và ghi chú. `tests/rules/imports.test.js` quét bao đóng tĩnh của đường nhẹ (§8.2).
````

- [ ] **Step 4: Commit**

Run: `npm test` (xanh, `Tests  860 passed`).

```bash
git add CLAUDE.md README.md docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -F - <<'EOF'
docs: README, CLAUDE.md và spec theo GĐ 5 (tên vật, chữ đi theo vật, móc lần vẽ, N + 1 ô hoa đăng; số đo thật; Phụ lục A.53+)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 19: Nghiệm thu: review toàn nhánh, PR, CI; kiểm trên máy thật

**Mục tiêu:** Nhánh sẵn sàng merge. Hai reviewer độc lập đã đọc toàn nhánh, CI xanh, thân PR nhắc tới bộ ảnh chụp trên GPU thật Bao đã duyệt. Việc kiểm trên máy thật được giao rõ cho Bao.

**Files:** những file mà review yêu cầu sửa (mỗi lần sửa một commit, kèm test).

**Interfaces:**
- Consumes: toàn bộ nhánh.
- Produces: PR `gd5-hoa-dang-tung-soi`.

- [ ] **Step 1: Hai reviewer độc lập (chạy nền, song song)**

Gửi cho `pr-review-toolkit:code-reviewer` và `pr-review-toolkit:silent-failure-hunter` cùng một phạm vi: các commit của GĐ 5 (`git diff 7765d36...gd5-hoa-dang-tung-soi -- . ':(exclude)docs/superpowers/plans'`), kèm spec và kế hoạch này. Nhắc hai reviewer những chỗ dễ sai:
- cử chỉ: `'double-tap'` sau hai `'tap'`; kính tròn của Kính mài giữ cú chạm hai lần của ngón tay hay bút (hình gạt thì không); chuột vẫn tới bức;
- quầng trăng: chỉ `'loading'` bắt đầu một vòng; không lùi; phần nhẹ không dùng built-in từ ES2022 trở lên (và `structuredClone`);
- chữ đi theo vật: vùng live không bao giờ `hidden`; chữ ra ngoài khung dùng `data-away`; giảm chuyển động; điểm neo hỏng không làm hỏng khung;
- móc lần vẽ: chỉ `draws.js` đặt móc; `stop()` luôn trả hàm cũ; scene pass chạy đầu tiên trong lượt cuối; chỉ lần vẽ lồng mới là phản chiếu;
- Từng sợi: bản chụp danh sách trước `limit()`; không để lại hẹn giờ; "Dệt lại" chừng 12 giây kể cả khi có hàng nghìn sợi;
- hoa đăng: vòng đệm N + 1 ô; đường trôi tính thẳng theo thời gian (`?freeze` tất định); không ghi gì khi ao trống; khung bao sau khi ghi ma trận; đèn chìm hẳn trước khi ô bị giấu; `Loop` + `Break` của vũng sáng;
- thơ: 12 cặp câu đúng chữ spec §5; thứ tự theo đêm;
- ba lỗi có từ trước, sửa trong GĐ 5: khung chữ một cột (đổi bố cục đang deploy: huy hiệu và con dấu về góc phải); bảng công cụ không nằm dưới Sổ tay, đứng ngay sau thanh lớp trong thứ tự Tab, kể cả sau "Dựng lại cảnh"; `run.js` không đụng tới trang đã về tĩnh sau mỗi lần chờ;
- chữ dừng trên chân khung: đo một lần mỗi câu, không đo mỗi khung.

- [ ] **Step 2: Sửa theo review (mỗi lỗi thật một test hỏng trước, rồi một commit), và cho reviewer đọc lại MỌI commit sửa**

Ở các giai đoạn trước, reviewer tìm ra lỗi thật, và tìm ra cả lỗi trong lần sửa đầu tiên. Đừng push một commit sửa chưa được đọc lại. Góp ý nào không đúng thì ghi rõ lý do vào PR, không sửa cho có.

- [ ] **Step 3: Kiểm toàn bộ lần cuối**

```bash
npm test
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
```
Kết quả mong đợi: tất cả xanh, đúng số test ghi ở đầu kế hoạch (cộng test mới của các lần sửa).

- [ ] **Step 4: Push và mở PR**

```bash
git push -u origin gd5-hoa-dang-tung-soi
gh pr create --base main --head gd5-hoa-dang-tung-soi …
```
Tiêu đề: "GĐ 5 · Trăng tiến độ + Từng sợi + thả hoa đăng". Thân PR (tiếng Việt), gồm:
- tóm tắt GĐ 5 theo spec §14;
- những điều học được về three r186 (Phụ lục A từ mục 53);
- số test, e2e, draw call và kích thước bundle;
- một dòng về ảnh: bộ ảnh chụp trên GPU thật đã được Bao duyệt cùng kế hoạch (hoa đăng, chữ dừng trên chân khung, khung chữ trước và sau khi sửa, quầng trăng, bảng Từng sợi cạnh Sổ tay ở 1280 px, Sổ tay thu lại ở 1024 px). Ảnh không nằm trong repo, và `gh` không đính được ảnh: Bao kéo ảnh vào thân PR trên github.com nếu muốn;
- danh sách kiểm tay của Bao (Step 6 và 7).

Dòng cuối: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: CI**

```bash
gh run watch
```
Kết quả mong đợi:
- job `build` xanh (unit, build, e2e `static` + `webgl2-swiftshader` kèm a11y): job chặn;
- job `e2e-webgpu` không chặn, nhưng mong là cũng xanh. GĐ 5 thêm chừng 10 phút e2e vào job này, nên nó có thể chạm trần 40 phút. Nếu job bị hủy vì hết giờ, ghi điều đó vào PR rồi nâng trần trong một commit riêng (như commit `356a60e` của GĐ 4). Cùng commit đó sửa số phút ở chú thích của `.github/workflows/deploy.yml`, ở README (đoạn về job `e2e-webgpu`) và ở spec §13.

- [ ] **Step 6: Thơ, trước khi merge (Bao; spec §5, §12)**

Merge xong là Pages deploy ngay, nên chữ của thơ phải được kiểm trước khi merge. Trên github.com, ở tab "Files changed" của PR, mở `src/paintings/ao-sen-dem/content.captions.vi.js` và đọc lại cả mười hai cặp câu: chữ, dấu, nguồn. Nhất là mục `guong-nga` ("Gương nga chênh chếch dòm song / Vàng gieo ngấn nước, cây lồng bóng sân", Truyện Kiều): đối chiếu với một bản Truyện Kiều đáng tin. Sai thì Bao báo lại: người thực thi sửa file đó trong một commit (`npm test` xanh, với Node 24 của Task 1 · Step 1), push, chờ CI xanh, rồi Bao mới merge.

Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

- [ ] **Step 7: Kiểm tay (Bao, sau khi deploy; spec §12)**

- **Thơ trên trang:** ở `?at=2026-10-25T21:00`, chạm hai lần lên nước mười hai lần (mười hai lần thả đi qua đủ mười hai cặp câu): chữ và dấu hiện đúng, nguồn ghi đúng.
- **Điện thoại:** chạm hai lần lên nước thả được hoa đăng mà trình duyệt không phóng to (spec §17); chữ hiện trên đèn, không tràn ra ngoài màn hình; thả liên tục thì đèn cũ chìm dần. Bật Kính mài (hình tròn) rồi chạm nhanh hai lần để dời kính: không có hoa đăng nào được thả.
- **Mạng chậm** (DevTools › Network › Slow 4G): quầng trăng nhích dần tới lúc hòa dần, không đứng hẳn ở mốc nào; về tĩnh thì quầng biến mất.
- **Bố cục:** trên máy tính, huy hiệu ở góc phải trên, con dấu và trăng ở góc phải dưới (trước đây lệch vào giữa). Mở Sổ tay rồi bật Từng sợi: bảng của công cụ nằm cạnh Sổ tay, thấy đủ nút "Dệt lại"; thu cửa sổ còn chừng 1024 px thì Sổ tay tạm thu lại khi công cụ bật. Zoom trình duyệt 125% và 150% ở bề rộng quanh 1240 px: bảng công cụ không nằm dưới Sổ tay.
- **Bàn phím** (Mac thật, Chrome; trong Safari dùng Option+Tab, vì Tab thường bỏ qua nút): ở 1280 px và 1024 px, Enter trên nút Từng sợi ở thanh lớp, rồi Tab: đi hết phần còn lại của thanh lớp rồi vào bảng của công cụ. Ở 1280 px, sau bảng là Sổ tay; ở 1024 px Sổ tay đang thu lại nên Tab không tới nó.
- **Từng sợi:** trên máy tính và điện thoại, kéo thanh từ 0 tới N; "Dệt lại" chạy hết rồi tự dừng; bật "Tắt instancing" rồi "Dệt lại" vẫn chừng 12 giây.
- **VoiceOver** (Safari trên macOS và iOS; trên Mac ở 1280 px và 1024 px): cặp câu và nguồn được đọc một lần khi thả đèn; kéo camera cho đèn ra khỏi khung rồi quay lại thì không bị đọc lại; thanh Từng sợi đọc "Sợi k trên N: <nhãn vật>"; lúc "Dệt lại" không đọc lại ô số k/N ở mỗi bước.
- **Máy Windows hay Linux có GPU thật:** việc còn để ngỏ từ GĐ 4 (ms GPU trong Sổ tay, ba ngưỡng của bộ điều chỉnh).
