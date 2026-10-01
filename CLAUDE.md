# CLAUDE.md · Sơn Mài Ánh Sáng

Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec (nguồn sự thật cho CÁI GÌ):
`docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch từng giai đoạn: `docs/superpowers/plans/`.

## Bản đồ dự án

- **Kỹ thuật** "Sơn Mài Ánh Sáng": dựng tranh 3D bằng nhiều **lớp** ánh sáng, mỗi lớp có trọng số 0 → 1.
  "Mài" là gỡ dần từng lớp, xuống tận **Cốt** (đất sét). Lớp đầu của mọi bức luôn là Cốt (`id: 'cot'`).
- **Bức tranh**: một tác phẩm làm bằng kỹ thuật đó. Bức 1 là Ao Sen Đêm (`src/paintings/ao-sen-dem/`).
- **Ba vùng:**

  | Vùng | Thư mục | Quy tắc |
  |---|---|---|
  | Xưởng | `src/engine/`, `src/ui/` | đồ nghề dùng chung; **không biết có bức nào** |
  | Hộp màu | `src/lib/` | hàm "lá" (âm lịch, pha trăng, PRNG, TSL dùng chung); không import xưởng, không import bức |
  | Các bức | `src/paintings/<slug>/` | mỗi bức một thư mục, độc lập với nhau |

- Phần nhẹ của xưởng (`src/engine/*.js`: boot, flags, tier, quality, palette, deadline, sma, static) chạy khi poster
  đang hiện và **không kéo theo three**. Phần nặng (`src/engine/gpu/`) chỉ được tải bằng `import()` động ở tầng 3D.
- Chất lượng: `engine/quality.js` chọn mức; `engine/tuner.js` QUYẾT định hạ/nâng nấc (hàm thuần, test bằng chuỗi khung giả;
  GĐ 4: máy đo được ms GPU thì chẩn đoán theo tải); `engine/gpu/ladder.js` ÁP nấc (`'dpr'` và `layer.degrade`);
  `engine/gpu/gpu-timer.js` đo ms GPU. Bảng số và thứ tự nấc của Bức 1: `paintings/ao-sen-dem/quality.js`.
- Lớp dùng chung (thuộc kỹ thuật, bức nào cũng lắp được): `src/engine/stock/<id>/`, hiện có Phủ bóng.
- `src/paintings/registry.js`: danh sách các bức. Node đọc (vite.config, test, e2e); trình duyệt không import.
- `src/paintings/_mau/`: tranh mẫu 2 lớp, KHÔNG deploy (không có trong registry). Là fixture của test hợp đồng và là
  khuôn để copy khi làm bức mới.
- Sổ tay (GĐ 2): `ui/workshop.js` (thanh lớp + Sổ tay + chế độ mài) chỉ thấy **bàn thợ** `engine/gpu/studio.js`
  (trọng số, núm, thí nghiệm, số đo, snapshot; GĐ 4: công cụ, Dial). `ui/` không import engine hay three.
- Công cụ học (GĐ 4): `engine/tools/<id>.js` (Kính mài, Lột lớp) chỉ nhìn các view của `engine/gpu/views.js`;
  `engine/gpu/toolbox.js` gắn công cụ, mỗi lúc một công cụ; `ui/rail-tools.js` vẽ mục "Đồ nghề" trong thanh lớp.
  Dial (núm của cả bức, như thanh giờ): bức khai báo ở `setup().dials`, `engine/gpu/dial-set.js` đọc/ghi, `ui/dials.js` vẽ.
- Cách phân biệt: tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thuộc xưởng; tên chủ đề (sen, trăng,
  gợn nước, đom đóm) thuộc bức.

## Lệnh

| Việc | Lệnh |
|---|---|
| Chạy dev | `npm run dev`, mở http://localhost:5173/son-mai-anh-sang/ |
| Unit + luật + hợp đồng | `npm test` (một file: `npx vitest run tests/unit/flags.test.js`) |
| Build | `npm run build` (ra `dist/`) |
| E2E | `npm run e2e` (build rồi chạy Playwright); một project: `npm run build && npx playwright test --project=webgl2-swiftshader` |
| E2E trên GPU thật | `npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu` |
| Lần đầu chạy e2e | `npx playwright install chromium` |
| Chụp poster + og | `npm run build && node scripts/poster.js <slug>` (máy có GPU thật; theo `meta.poster.capture`) |

**Node 24.** Vite 8 và Vitest 5 không chạy trên Node 20. Cài theo thư mục bằng fnm để không đổi Node của các project khác:
`brew install fnm`, thêm `eval "$(fnm env --use-on-cd --shell zsh)"` vào `~/.zshrc`, rồi `fnm install 24`.
Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.

## Luật

`npm test` giữ phần lớn các luật dưới đây và báo lỗi bằng tiếng Việt kèm `file:dòng`. Gặp lỗi thì sửa code, không nới luật.

### Nguồn tham chiếu
- Chỉ dùng TSL. Ghim `three@0.186.1`.
- Đối chiếu API với `node_modules/three/src` và `node_modules/three/examples/jsm`. Example HTML **không có trong gói npm**:
  xem tại https://github.com/mrdoob/three.js/tree/r186/examples.
- Không dùng `ShaderMaterial`, `RawShaderMaterial`, `EffectComposer`, `onBeforeCompile`, và các API đã deprecated trong r186:
  `PostProcessing` (dùng `RenderPipeline`); `renderAsync`, các `clear*Async`, `hasFeatureAsync`, `initTextureAsync`;
  `setResolution` của PassNode (dùng `setResolutionScale`); tùy chọn `resolution` của `reflector` (dùng `resolutionScale`);
  `label()` (dùng `setName()`); `directionToColor` (dùng `packNormalToRGB`); `PCFSoftShadowMap`.

### Ranh giới
- Xưởng không import bức; các bức không import lẫn nhau. Bảng đầy đủ ở spec §8.2, do `tests/rules/imports.test.js` giữ.
- Code xưởng không chứa từ vựng của bức nào (slug, id lớp riêng, các từ trong `meta.fence`). Bức mới khai báo từ vựng
  riêng trong `meta.fence`. Không bao giờ viết code rẽ nhánh theo `slug`.
- Theo **luật hai lần**: chỉ rút code của một bức lên `src/lib/` hoặc `src/engine/stock/` khi bức thứ hai thật sự cần.
- Hợp đồng (`src/engine/contracts/`) chỉ **thêm trường tùy chọn**, không đổi nghĩa trường cũ.
- Id đã deploy (slug, layerId, knobId, dialId) là **API công khai**: không đổi.

### Shader và TSL
- Không đổi `renderer.toneMapping` lúc chạy.
- Không đặt số lên material lúc chạy (`material.clearcoat = 0`, `emissiveIntensity`…); mọi thứ đổi theo trọng số hay núm
  đi qua `uniform` trong node.
- Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled` hay `scene.fogNode` lúc chạy: chúng nằm trong cache key,
  đổi là biên dịch lại mọi material.
- **Không dùng `select()` cho nhánh có node dùng chung.** Dùng `Fn` + `.toVar()` + `If`:
  `Fn(() => { const h = node.toVar(); If(cond, () => { … }); … })()`.
- Tên uniform (`setName`) phải là định danh hợp lệ (`/^[A-Za-z_][A-Za-z0-9_]*$/`), không có `-`.
- TSL không có `atan2`: dùng `atan(y, x)`. Dùng `setName` thay cho `label()`.
- Núm `js`/`rebuild` xử lý ở `layer.onKnob[id]` (thiếu thì `buildLayers` báo lỗi lúc dựng); marker `// @knob <id>` đặt ở
  dòng xử lý đó. Giá trị ban đầu của mọi núm đọc bằng `ctx.knobValue(id)`, không chép lại logic mặc định.
- Số lượng đổi được lúc chạy (lá, đom đóm…): cấp phát theo trần MỘT lần, lúc chạy chỉ ghi lại dữ liệu và đổi `count`.
  InstancedMesh và object có `count > 1` có cache key riêng theo uuid, nên đổi `count` không biên dịch lại; đừng để
  sprite về `count` 0 hay 1.
- Vẽ lại ngoài vòng lặp (khi `?freeze=N` đã dừng) phải đợi nhịp `requestAnimationFrame` kế tiếp: scene pass và
  reflector chỉ vẽ lại cảnh một lần mỗi `frameId`, mà `frameId` chỉ tăng ở mỗi nhịp rAF của renderer.
- `scene.fogNode` nằm trong cache key của MỌI material: gán một lần; mọi thứ đổi lúc chạy trong sương là uniform. `fbm` cần
  số tầng đổi được thì truyền node (vòng lặp thật trong shader), đừng dựng lại đồ thị.
- Hạt cộng dồn (Sprite `AdditiveBlending`) đặt `fog = false` và tự nhân emissive với `(1 − hệ số sương)`: fog của three trộn
  màu đầu ra về màu sương, với additive thì mỗi hạt thành một đĩa màu sương.
- Shadow map tĩnh (`shadow.autoUpdate = false`): thứ làm bóng đổi (hướng đèn, hình của vật đổ bóng, cỡ map) thì đặt
  `shadow.needsUpdate = true`. Bias và normalBias chỉ dùng lúc tra bóng: đổi không cần vẽ lại map.
- `material.mrtNode` chỉ dùng cho material KHÔNG BAO GIỜ bị vẽ vào target không có MRT (ảnh của reflector): nếu lọt vào đó,
  WGSL hỏng ("structures must have at least one member"). Mặt nước của Bức 1 dùng được vì reflector ẩn chính nó.
- Trong `positionNode` (chạy sau instancing) được gán `normalLocal.assign(…)` để xoay cả pháp tuyến (cánh hoa nở theo uniform).
- Lũy thừa 2, 3, 4 viết bằng `pow2`/`pow3`/`pow4`; `pow` với số mũ khác thì cơ số phải chắc chắn ≥ 0 (`saturate`, `abs`).
  GLSL/WGSL không định nghĩa `pow` của số âm: SwiftShader vẫn ra số, GPU thật có thể ra NaN.
- Nhánh của `If` trong một `Fn` gọi ngay không được trả giá trị: viết `() => { x.assign(…); }`, không viết `() => x.assign(…)`
  (three cảnh báo "Return statement used in an inline 'Fn()'").
- Không gọi `scenePass.getTextureNode(name)` cho kênh chưa có trong MRT: nó thêm một ảnh vào render target, và target nhiều ảnh
  hơn số đầu ra của shader thì vỡ. View Normal dùng node giữ chỗ tới khi `requireView` đổi MRT (`engine/gpu/views.js`).

### Chất lượng và phần cứng (GĐ 3: sản phẩm phải hợp nhiều loại máy)
- Nấc (`Layer.degrade`) chỉ hạ TRẦN, không ghi vào núm; hiệu lực = min(núm, trần); không đổi thứ nằm trong cache key.
  Lớp chỉ đưa nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng).
- Núm nào kéo lên được quá sức máy yếu thì đặt trần theo mức: `max: (env) => …` (như `value`). Thí nghiệm nặng có trần.
- Cảnh vẽ tối đa 60 khung/giây (`engine/gpu/clock.js#createFrameCap`; GĐ 4: màn ≤ ~63 Hz không bị chặn): đừng thêm vòng
  `requestAnimationFrame` riêng để vẽ cảnh.
- Bộ điều chỉnh chỉ đo từ lúc live (khung ẩn và lúc hòa dần không tính). Số đo GPU vô lý thì bỏ, kể cả số lớn hơn 1,5 lần nhịp
  khung (GPU Apple báo các pass chồng lên nhau, three cộng lại); hỏng 3 lần liền thì thôi đo cho phiên đó: mọi thứ chạy như máy
  không đo được (Sổ tay ghi "—"). Mẻ không có nhịp để so (lần hỏi đầu, mẻ dài hơn một lần nghẽn) thì bỏ mẫu mà không tính là hỏng:
  số chưa kiểm được không bao giờ vào Sổ tay.
- Số lượng theo máy (số lá, số hạt, độ phân giải…) đọc từ `ctx.budget` (bảng `quality.js` của bức), không viết cứng.

### Công cụ học, Dial, poster (GĐ 4)
- Công cụ chỉ nhìn `api.views()`, không biết bức nào. `overlay()` chỉ dựng node, không giữ trạng thái: views.js ghép lại overlay
  khi `requireView` đổi MRT. Đổi chế độ (hình, view, vạch gạt) = đổi uniform; chọn view bằng `If` trong `Fn` (`tools/pick.js`).
- Tap (`post.build/display({ tap })`) là biểu thức THUẦN (texture của pass, texture của bloom, uniform), không phải biến
  `.toVar()` trong Fn: overlay tính lại nó ở lượt vẽ cuối, sau FXAA. Nhãn ở `content.layers[id].taps` (test hợp đồng giữ).
- Cử chỉ `'hover'` (chuột di mà không bấm) chỉ tới công cụ, bức không bao giờ nhận; `g.pointer` là `'mouse'|'touch'|'pen'`.
- `update(0, t)`: xưởng vẽ lại khung đứng yên của `?freeze` (thanh giờ, núm) bằng `setup.update(0, t)` rồi `layer.update(0, t)`.
  Lớp đồng bộ theo uniform (hướng trăng, bóng) nhưng KHÔNG tiến mô phỏng: không compute, không bước hạt CPU.
- Phần tử có con `position: fixed` (tay nắm gạt, ô trượt Dial trên điện thoại) không được có `transform`, `filter` hay
  `backdrop-filter`: các thuộc tính đó biến nó thành khối chứa của con fixed, và con bị cắt hay đặt sai chỗ.
- Poster chụp từ chính cảnh bằng `scripts/poster.js` (GPU thật); đổi thời điểm thì sửa `meta.poster.capture` rồi chạy lại.
  `img[data-poster]` là ảnh poster; `body[data-poster]` là cờ `?poster` (CSS ẩn mọi UI trừ canvas).

### Chuyển động và ngẫu nhiên
- Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
- Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).

### Chữ và chú thích
- Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`.
- Chữ người xem thấy nằm trong `strings.*.js`, `content.*.js` và các trường chữ của `meta.js`: tên lớp (`meta.name`), cùng `title`, `tagline`, thơ (`poem`) và `poster.alt`.
  Không file nào trong `src/` import `strings.*.js`: trang HTML import rồi truyền `t` vào `boot`.
- Chữ của Sổ tay nằm trong `content.<lang>.js › layers[id]`: `understand` (≤ 150 chữ), `learned`, `readMore` (chỉ https),
  nhãn cho MỌI núm, thí nghiệm và số đo. Sơ đồ là SVG trong `diagrams/`, import bằng `?raw`, có `<title>`, chỉ dùng màu
  của bảng sơn mài. Test hợp đồng giữ các luật này.
- Vùng `aria-live` (`[data-hint]`, `[data-static]`, `[data-badge-note]`) không bao giờ dùng `hidden`: để trống khi không có
  gì để nói (CSS thu lại khi `:empty`). Vừa bỏ `hidden` vừa điền chữ trong cùng một nhịp thì VoiceOver bỏ qua.
- Thông báo lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.
- Chú thích tiếng Việt ở những điểm cần học (làm gì, vì sao), không chú thích dòng hiển nhiên.

### Quy ước file
- Dòng 1 của mọi `src/**/*.js` và `plugins/*.js`: `// <đường dẫn> — <một câu tiếng Việt nói file làm gì>`.
- Mỗi file khoảng 250 dòng trở xuống (quá 300 là test hỏng); lớp dài thì tách helper sang `parts/` của bức.
- JavaScript ESM thuần + JSDoc, không TypeScript. Tên biến tiếng Anh, ASCII, camelCase.
- Import tương đối luôn ghi đuôi (`./x.js`).
- Test: Vitest, `tests/**/*.test.js`, môi trường node; test cần DOM ghi `// @vitest-environment jsdom` ở dòng 1.
- Không thêm: npm workspaces, plugin loader, SPA router, scene DSL, ECS, class kế thừa cho lớp, thư viện i18n,
  event bus hay state store trung tâm (lý do ở spec §16).
- Test một lớp của bức: dựng cả bức trong Node bằng `tests/helpers/fake-ctx.js#buildPainting(painting, meta, { until })`
  (giống `run.js`), không tự dựng ctx riêng.

### Commit
- Dùng email cá nhân: mọi commit mang `Bao Nguyen <giabao261096@gmail.com>`, đã cấu hình local trong repo.
  Không sửa git config global.

## Gỡ lỗi nhanh
- Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?debug=stats`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`,
  `?level=cao|vua|thap` (ép mức chất lượng: xem mức thấp ngay trên máy tính), `?poster` (chỉ còn canvas).
- `?debug` mở three.js Inspector (draw call, thời gian GPU, cây node); `?debug=stats` mở stats-gl.
- `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`. Khi cảnh live còn có
  `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`, `__sma.stats()`
  (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (nấc đang hạ, `gpu`, nấc bị khóa `locked`), `__sma.degrade()` /
  `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` / `__sma.setTool('kinh-mai')` (công cụ học, `null` tắt hết),
  `__sma.dials()` / `__sma.setDial('gio', 27)` (núm của cả bức).
