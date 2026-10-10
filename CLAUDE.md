# CLAUDE.md · Sơn Mài Ánh Sáng

Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec (nguồn sự thật cho CÁI GÌ):
`docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch từng giai đoạn: `docs/superpowers/plans/`.

## Bản đồ dự án

- **Kỹ thuật** "Sơn Mài Ánh Sáng": dựng tranh 3D bằng nhiều **lớp** ánh sáng, mỗi lớp có trọng số 0 → 1.
  "Mài" là gỡ dần từng lớp, xuống tận **Cốt** (đất sét). Lớp đầu của mọi bức luôn là Cốt (`id: 'cot'`).
- **Bức tranh**: một tác phẩm làm bằng kỹ thuật đó. Bức 1 là Ao Sen Đêm (`src/paintings/ao-sen-dem/`, trang `index.html`); Bức 2 là
  Đèn Kéo Quân (`src/paintings/den-keo-quan/`, trang `tranh/den-keo-quan/index.html`); Bức 3 là Cung Quế (`src/paintings/cung-que/`,
  trang `tranh/cung-que/index.html`, thế giới SDF dò tia); Bức 4 là Đàn Gà Mẹ Con (`src/paintings/dan-ga-me-con/`, trang
  `tranh/dan-ga-me-con/index.html`, tranh Đông Hồ vẽ phi hiện thực dưới camera trực giao). Phòng tranh: `tranh/index.html`, trang tĩnh
  liệt kê mọi bức.
- **Ba vùng:**

  | Vùng | Thư mục | Quy tắc |
  |---|---|---|
  | Xưởng | `src/engine/`, `src/ui/` | đồ nghề dùng chung; **không biết có bức nào** |
  | Hộp màu | `src/lib/` | hàm "lá" (âm lịch, pha trăng, PRNG, TSL dùng chung: noise, bể hạt compute); không import xưởng, không import bức |
  | Các bức | `src/paintings/<slug>/` | mỗi bức một thư mục, độc lập với nhau |

- Phần nhẹ của xưởng (`src/engine/*.js`: boot, flags, tier, quality, palette, deadline, sma, static) chạy khi poster
  đang hiện và **không kéo theo three**. Phần nặng (`src/engine/gpu/`) chỉ được tải bằng `import()` động ở tầng 3D.
- Chất lượng: `engine/quality.js` chọn mức; `engine/tuner.js` QUYẾT định hạ/nâng nấc (hàm thuần, test bằng chuỗi khung giả;
  GĐ 4: máy đo được ms GPU thì chẩn đoán theo tải; sau GĐ 5: đường nhịp thử ngừng vẽ 6 khung trước lần hạ đầu, để tách trình duyệt
  khóa nhịp khỏi máy không kịp); `engine/gpu/ladder.js` ÁP nấc (`'dpr'` và `layer.degrade`);
  `engine/gpu/gpu-timer.js` đo ms GPU. Bảng số và thứ tự nấc của mỗi bức: `paintings/<slug>/quality.js`.
- Lớp dùng chung (thuộc kỹ thuật, bức nào cũng lắp được): `src/engine/stock/<id>/`, hiện có Phủ bóng.
- Camera (GĐ 8): `engine/gpu/camera.js` dựng camera theo `CameraSpec` (phối cảnh, hay trực giao với `kind: 'ortho'`), khớp khung, giới hạn
  OrbitControls; `engine/gpu/home.js` cho tranh tự khép lại (`CameraSpec.home`). Bể hạt compute dùng chung: `lib/tsl/particles.js`
  (đom đóm của Bức 1, thóc của Bức 4).
- `src/paintings/registry.js`: danh sách các bức. Node đọc (vite.config, test, e2e); trình duyệt không import.
- `src/paintings/_mau/`: tranh mẫu 2 lớp, KHÔNG deploy (không có trong registry). Là fixture của test hợp đồng và là
  khuôn để copy khi làm bức mới.
- Sổ tay (GĐ 2): `ui/workshop.js` (thanh lớp + Sổ tay + chế độ mài) chỉ thấy **bàn thợ** `engine/gpu/studio.js`
  (trọng số, núm, thí nghiệm, số đo, snapshot; GĐ 4: công cụ, Dial). `ui/` không import engine hay three.
- Công cụ học (GĐ 4): `engine/tools/<id>.js` (Kính mài, Lột lớp) chỉ nhìn các view của `engine/gpu/views.js`;
  `engine/gpu/toolbox.js` gắn công cụ, mỗi lúc một công cụ; `ui/rail-tools.js` vẽ mục "Đồ nghề" trong thanh lớp.
  Dial (núm của cả bức, như thanh giờ): bức khai báo ở `setup().dials`, `engine/gpu/dial-set.js` đọc/ghi, `ui/dials.js` vẽ.
  GĐ 5: Từng sợi (`engine/tools/tung-soi.js`) chỉ nhìn `api.draws`, năm hàm của móc lần vẽ `engine/gpu/draws.js`.
- Chữ đi theo vật (GĐ 5): bức gọi `ctx.captions.show(khóa, anchor)`; `engine/gpu/caption-set.js` tra `content.captions` và chiếu
  điểm neo mỗi khung, `ui/captions.js` vẽ vùng aria-live phủ lên canvas. Quầng trăng tiến độ: `ui/moon-progress.js` (trong
  `[data-moon]`, theo `setState` và mốc `'chunk'` của boot).
- Bản dịch và Link công thức (GĐ 9, đều thuộc xưởng): Sổ tay › Chỉnh hiện mã shader (WGSL/GLSL) mà GPU chạy cho các nơi lớp có mặt
  (`engine/gpu/translate.js`, đọc từ MỘT khung vẽ qua `draws.js#capture`; `ui/translation-view.js`). Hash `#r=…` mang trọng số, núm,
  Dial khác mặc định (`engine/recipe.js`, `engine/gpu/recipe-set.js`, `recipe-url.js`; `ui/recipe-panel.js`).
- Cách phân biệt: tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thuộc xưởng; tên chủ đề (sen, trăng,
  gợn nước, đom đóm) thuộc bức.

## Lệnh

| Việc | Lệnh |
|---|---|
| Chạy dev | `npm run dev`, mở http://localhost:5173/son-mai-anh-sang/ (Bức 2: `…/tranh/den-keo-quan/`, Bức 3: `…/tranh/cung-que/`, Bức 4: `…/tranh/dan-ga-me-con/`) |
| Sinh trang HTML | `npm run pages` (mọi trang của các bức và Phòng tranh, từ registry; rồi commit các file đổi) |
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
- Theo **luật hai lần**: chỉ rút code của một bức lên `src/lib/` hoặc `src/engine/stock/` khi bức thứ hai thật sự cần. Rút code TSL
  thì ghi mã shader của bức cũ thành bản ghi TRƯỚC, rút xong mã phải giống từng ký tự, trừ số id của node (GĐ 8: bể hạt của đom đóm).
- Hợp đồng (`src/engine/contracts/`) chỉ **thêm trường tùy chọn**, không đổi nghĩa trường cũ.
- Id đã deploy (slug, layerId, knobId, dialId) là **API công khai**: không đổi.
- `meta.layers[].files` liệt kê mọi file `parts/` mà lớp import (trực tiếp hay qua part khác); dữ liệu dùng chung giữa các lớp đi
  qua `shared`, lớp không import part của lớp khác (test hợp đồng giữ).

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
- `DynamicDrawUsage` chỉ dùng cho thuộc tính ghi lại MỖI khung: three r186 tải lại thuộc tính đó ở mọi lần render, bất kể version
  (`renderers/common/Attributes.js`). Thuộc tính chỉ đổi lúc có việc thì để usage mặc định và đặt `needsUpdate` khi ghi.
  `instancedBufferAttribute(a)` của TSL tự ghi `StaticDrawUsage` lên chính `a` (setUsage trước đó mất tác dụng); thuộc tính ghi mỗi
  khung thì dùng `instancedDynamicBufferAttribute`. Thuộc tính đọc qua node không nằm trong `geometry.attributes`: test tìm chúng bằng
  `compileMaterial(...).bufferAttributes`.
- InstancedMesh: `setMatrixAt` không cập nhật `boundingSphere` (frustum culling dùng nó): ghi ma trận xong thì
  `computeBoundingSphere()`; ô trống (ma trận cỡ 0) đặt ở chỗ không làm phình hình cầu.
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
- `tuner.sample()` trả `'skip'` (thử ngừng vẽ, sau GĐ 5) thì `scene.step()` bỏ hết phần sau `quality.sample()`: không vẽ, không tiến
  đồng hồ, ảnh cũ ở lại. Việc thêm vào `step()` đặt sau dòng đó. Sổ tay mở thì không thử (`tests/unit/tuner.test.js` giữ luật thử,
  `scene.test.js` giữ chuyện bỏ khung).
- Phần nhẹ (bao đóng import tĩnh của `engine/boot.js` và `paintings/*/index.js`: `engine/*.js`, các file `ui/` mà boot kéo theo,
  `lib/astro/`, `lib/random.js`) chạy cả trên trình duyệt cũ của tầng tĩnh (Safari 14): không dùng built-in ES2022 trở lên (như
  `Object.hasOwn`, `Array.prototype.at`) và `structuredClone` ở đó (phần nặng thì được; `tests/rules/imports.test.js` giữ).

### Công cụ học, Dial, poster (GĐ 4)
- Công cụ chỉ nhìn `api.views()` (Từng sợi: `api.draws`), không biết bức nào. `overlay()` chỉ dựng node, không giữ trạng thái:
  views.js ghép lại overlay khi `requireView` đổi MRT. Đổi chế độ (hình, view, vạch gạt) = đổi uniform; chọn view bằng `If` trong
  `Fn` (`tools/pick.js`).
- Tap (`post.build/display({ tap })`) là biểu thức THUẦN (texture của pass, texture của bloom, uniform), không phải biến
  `.toVar()` trong Fn: overlay tính lại nó ở lượt vẽ cuối, sau FXAA. Nhãn ở `content.layers[id].taps` (test hợp đồng giữ).
- Màu hằng trong overlay là số sRGB, vì overlay trộn với ảnh cuối đã ở không gian hiển thị. `color('#hex')` của three tự đổi sang
  tuyến tính (ra màu đậm và ngả cam), nên viết `new Color('#hex').convertLinearToSRGB()` (spec Phụ lục A.52).
- Cử chỉ `'hover'` (chuột di mà không bấm) chỉ tới công cụ, bức không bao giờ nhận; `g.pointer` là `'mouse'|'touch'|'pen'`.
- `update(0, t)`: xưởng vẽ lại khung đứng yên của `?freeze` (thanh giờ, núm) bằng `setup.update(0, t)` rồi `layer.update(0, t)`.
  Lớp đồng bộ theo uniform (hướng trăng, bóng) nhưng KHÔNG tiến mô phỏng: không compute, không bước hạt CPU.
- Phần tử có con `position: fixed` (tay nắm gạt, ô trượt Dial trên điện thoại) không được có `transform`, `filter` hay
  `backdrop-filter`: các thuộc tính đó biến nó thành khối chứa của con fixed, và con bị cắt hay đặt sai chỗ.
- Poster chụp từ chính cảnh bằng `scripts/poster.js` (GPU thật); đổi thời điểm thì sửa `meta.poster.capture` rồi chạy lại.
  `img[data-poster]` là ảnh poster; `body[data-poster]` là cờ `?poster` (CSS ẩn mọi UI trừ canvas).

### Tên vật, chữ đi theo vật, móc lần vẽ (GĐ 5)
- Mọi vật trong `layer.objects` có `name` kebab-case không dấu, không trùng trong lớp, và nhãn ở `content.layers[id].objects[name]`,
  kể cả vật mà thí nghiệm thêm vào (`tests/paintings/objects.test.js` giữ, ở mức cao, thấp và lúc bật từng thí nghiệm). Con của
  một vật như thế (Mesh trong Group) không cần tên riêng: Từng sợi gán nó cho vật cha.
- Chữ đi theo vật: chữ chỉ ở `content.captions` (dạng `Poem`: 1–2 dòng ≤ 60 ký tự, có `source`); bức gọi
  `ctx.captions.show(khóa, anchor)` và không viết chữ nào trong code. `anchor()` trả `null` khi khung đó không có điểm neo (chữ ẩn,
  không cảnh báo); `undefined` hay số không hữu hạn là lỗi (cảnh báo một lần).
- Công cụ cần móc lần vẽ mà `api.draws` là `null` thì ném lỗi trong `mount()`: `toolbox.js` bỏ riêng công cụ đó kèm cảnh báo, không
  gắn một bảng trống.
- Chỉ `engine/gpu/draws.js` được gọi `setRenderObjectFunction`, và (GĐ 9) đọc RenderObject của lần vẽ (`renderer._objects`, `_currentRenderContext`) (`tests/rules/files.test.js` giữ). Scene pass phải là `updateBefore`
  ĐẦU TIÊN của lượt cuối (`views.js`: `Fn(() => { scenePass.toVar(); … })`), vì three chạy `updateBefore` theo hậu thứ tự (con trước
  cha) và RTT/bloom gọi `resetRendererState` (gỡ móc) trong lúc vẽ: scene pass vẽ lần đầu từ bên trong RTT thì móc không thấy lượt
  vẽ cảnh (`tests/unit/pipeline.test.js` giữ).
- Cử chỉ `'double-tap'` đến ngay sau `'tap'` thứ hai (hai `'tap'` vẫn tới như thường); công cụ giữ `'tap'` thì giữ cả `'double-tap'`
  (Kính mài ở hình tròn giữ cả hai khi là ngón tay hay bút; hình gạt không giữ cử chỉ nào trên canvas, nên chạm hai lần vẫn tới
  bức), không thì bức nhận `'double-tap'` mà không có hai `'tap'` làm nên nó (`tests/unit/tools.test.js` giữ cho mọi công cụ).
- E2e cần chạm hai lần thì phát sự kiện con trỏ ngay trong trang (`e2e/helpers.js#doubleTapAt`: pointerId 1, `pointerType` mặc định
  `'mouse'`, `{ pointerType: 'touch' }` cho đường của ngón tay),
  không dùng chuột của Playwright (mỗi sự kiện của nó đợi một nhịp khung); id khác thì `setPointerCapture` của OrbitControls ném lỗi.

### Bố cục và vòng đời (GĐ 5)
- Thứ tự DOM của các tấm cố định: thanh lớp → thanh công cụ → Sổ tay (Tab đi theo thứ tự DOM, WCAG 2.4.3): `toolbox.js` gắn thanh
  công cụ ngay sau `[data-rail]`, `workshop.js` đặt thanh lớp ngay trước và Sổ tay ngay sau `[data-toolbar]`. Đừng chèn tấm nào khác
  vào giữa, đừng chuyển focus khi bật công cụ. z-index (thanh công cụ 1 < thanh lớp, Sổ tay 2), không phải thứ tự DOM, giữ thanh công
  cụ ở dưới.
- Bề rộng thanh lớp và Sổ tay ở `--rail-w` / `--notebook-w` (`notebook.css`); đổi một số thì tính lại ngưỡng 1240px / 1239.98px của
  `tools.css` (`tests/unit/shell-css.test.js` tính lại). Không có phần trăm trong `max-width` máy tính của `.tool-panel`: ô của bảng
  là phần tử flex, phần trăm ở đó "vòng" và Chromium bỏ cả `max-width`.
- Cặp `@media` phải bù nhau: một luật mặc định cộng một luật đè, hay quy ước `.98` (`max-width: 1239.98px` cạnh `min-width: 1240px`);
  không bao giờ `max-width: Npx` cạnh `min-width: (N+1)px`: bề rộng CSS lẻ khi zoom (cửa sổ 1549px ở 125% là 1239,2px) lọt giữa
  hai ngưỡng và không luật nào khớp.
- `engine/gpu/run.js#bringUp` gọi `gone()` trước việc đầu tiên và ngay sau MỌI `await` (thêm một lần chờ thì thêm
  `if (gone()) return false;` ngay sau nó, và thêm tên bước đó vào bảng `it.each` của `tests/unit/run.test.js`). Trang đã về tĩnh
  (`fail()`, hay boot hết hạn 10 s) hoặc lần dựng đã bị gỡ thì phần còn lại chỉ tự dọn (`d.closeAll()`), không gọi gì khác tới vỏ
  trang, `__sma`, sân khấu hay cảnh: boot chỉ khóa vỏ trang khi lần mở trang quá hạn hay hỏng, còn hạn 10 s của "Dựng lại cảnh"
  là của run.js. Sự kiện GPU đến khi `stopped()` (`onLost`, `onError`) thì bỏ qua: không về tĩnh lần hai, lý do đã báo giữ nguyên.

### Đèn có node bóng tự viết, lật tranh, CI chia phần (GĐ 6)
- Đèn có node bóng tự viết (`light.shadow.shadowNode`, spec Phụ lục A.77): `light.castShadow` và `renderer.shadowMap.enabled` bật lúc
  dựng (thiếu một trong hai thì three bỏ qua node), vật nhận bóng có `receiveShadow`. Có node thì three không dựng shadow map nào;
  không có thì đèn điểm dựng cube shadow map, 6 lượt vẽ mỗi khung. Three đọc node MỘT lần ở lần biên dịch đầu: các lớp góp vào bằng
  phép nhân lúc dựng (`shadowNode = node trước × mix(1, phần của lớp, w)`); node là vec3 được (ánh sáng có màu).
- Thêm hay bớt đèn lúc chạy là đổi bộ đèn trong cache key: mọi material biên dịch lại. Thí nghiệm "Shadow map thật" của Bức 2 chấp nhận
  một lần ở lần bật đầu (đèn dựng lười), từ đó tắt bằng `intensity` 0 và `shadow.autoUpdate = false`. Camera bóng của đèn điểm mặc
  định thấy từ 0,5 m: vật đổ bóng gần đèn hơn thì hạ `shadow.camera.near`.
- `smoothstep(a, b, x)` luôn a < b (GLSL không định nghĩa a ≥ b): cạnh mềm có bề rộng có thể về 0 thì cộng một `EPS` (như cỡ nguồn sáng
  của gobo). `atan(y, x)` với cả hai bằng 0 không định nghĩa: cộng `EPS` vào x.
- Test dịch shader cần biết uniform nào thật sự được đọc (kể cả trong thân một `Fn`, nơi `nodesOf` không thấy) thì dùng
  `compileMaterial(...).uniforms`. Mảng uniform (`uniformArray`) chỉ giữ tên ở WGSL; GLSL đặt nó vào khối buffer và đổi tên node thành
  `NodeBuffer_<id>`.
- Lật tranh: `<nav class="series">` ngay dưới `<h1>` của mỗi trang: bức trước, Phòng tranh, bức sau; link tương đối (chạy cả ở tầng
  tĩnh), registry xếp theo `meta.no` (`tests/paintings/html.test.js` so link với registry). GĐ 7: trang do `npm run pages` sinh, không
  sửa tay. Chỗ bấm được trong `.frame` phải bật lại `pointer-events: auto` (khung tắt nó cho canvas).
- CI (GĐ 6, GĐ 7 đã thay, xem mục dưới): e2e từng chia hai phần bằng `--shard`. `--shard` chia theo SỐ test và theo thứ tự file, nên
  phần 1 nhận mọi spec riêng của các bức.

### Hình tự dò tia, trình sinh trang, CI theo bức (GĐ 7)
- Hình tự dò tia (khối bao của Bức 3) dùng `NodeMaterial` gốc: `MeshBasicNodeMaterial` bỏ qua `normalNode`. Ghi `depthNode` bằng
  `viewZToPerspectiveDepth` (renderer không dùng depth logarit, không reversed) và `normalNode` ở view space, nên mesh thường (lá, Trái
  Đất) xếp lớp đúng với nó và view Normal thấy pháp tuyến SDF.
- Vòng dò chính bọc `Fn().once()`: màu, pháp tuyến, độ sâu dùng chung MỘT lần dò. Test đếm biến `sdfT` trong mã sinh ra.
- `scene` là hàm có layout (`setLayout`): mỗi chỗ gọi là một lời gọi hàm, không chép thân. Hàm có layout KHÔNG đọc uniform trực tiếp
  trong thân: three giữ mã của hàm theo backend, lần biên dịch sau thiếu uniform, WGSL báo "struct member … not found" (spec Phụ lục
  A.87). Truyền uniform vào làm tham số; hàm nào gọi hàm như thế mà đọc uniform thì không có layout. Test dịch lại trên CÙNG renderer
  (`tests/helpers/nodes.js#compileRenderer`). Tên tham số tránh từ khóa của WGSL và GLSL (`smooth` là từ khóa).
- Vòng lặp có cận là uniform (`Loop(uniform, …)`) chỉ dùng khi cần thoát sớm (dò tia, dò bóng). Bọc một hàm SDF lớn, nó làm cả khung
  chậm gấp đôi trên GPU Apple kể cả khi chỉ chạy một vòng (spec Phụ lục A.88). Số mẫu cố định (AO) thì trải thẳng bằng vòng `for` của
  JS; số đó cố định theo mức lúc dựng, không có nấc nào đổi nó. Test đếm `for (` trong mã sinh ra.
- Cảnh SDF không có đèn của three: các lớp góp vào `shared.cot.recipe` (clay, albedo, sun, sunWeight, visibility, ambient, occlusion)
  lúc dựng, trước lần biên dịch đầu.
- `CameraSpec.minHorizontalFov` (tùy chọn, độ): khung hẹp (điện thoại dọc) thì xưởng nới fov dọc vừa đủ để góc ngang bằng số này
  (`engine/gpu/fov.js`, tính lại mỗi lần resize); khung đủ rộng giữ nguyên fov.
- Trang HTML do `npm run pages` (`scripts/pages.js`) sinh từ registry, `meta` và `strings.vi.js`; không sửa tay. Test so từng byte
  trang trên đĩa với trang sinh ra (`tests/scripts/pages.test.js`): lệch thì chạy `npm run pages` rồi commit.
- E2e của một bức nằm trong `describe` bắt đầu bằng `"{tên bức} · "` (`tests/rules/e2e.test.js` giữ): CI gom test theo đó. Nhóm e2e
  sinh từ registry (`scripts/e2e-groups.js`): mỗi bức một job, cộng nhóm `chung`; thêm bức không sửa workflow. Không dùng
  `--pass-with-no-tests`: nhóm không khớp test nào thì job đỏ.
- Bức vẽ quá chậm trên SwiftShader WebGPU của runner (Bức 3: chừng 0,2 khung/giây; Bức 4: cả bộ mất 28 phút) thì đặt
  `ciWebgpuSmoke: true` ở dòng registry: job e2e WebGPU (không chặn) chỉ chạy các test mang tag `@khoi` (`{ tag: '@khoi' }`,
  `scripts/e2e-groups.js#SMOKE_TAG`) của bức đó; test luật đòi spec của bức có ít nhất một test như thế. Job chặn (WebGL2) vẫn chạy đủ.
  Spec e2e của bức nặng đặt trần chung bằng `test.describe.configure({ timeout })`; một test không lặp qua nhiều khung nhìn: mỗi khung một
  test, và trang đứng yên lúc chụp (mở với `?freeze`, đổi cỡ, đợi bộ đệm vẽ đổi theo, rồi `__sma.restore({})` vẽ lại khung đứng yên).
- E2e chờ một trạng thái của cảnh (cây bay đủ cao, lá chạm đất) thì poll theo số đo (`expect.poll`), không chờ một quãng thời gian thật
  cố định: đồng hồ của cảnh theo khung vẽ, mỗi khung tối đa 0,1 s, nên máy vẽ chậm (SwiftShader trên runner CI) cần lâu hơn. Giữ tới
  khi đạt thì dùng `e2e/helpers.js#pressAt` (nhấn, trả hàm nhấc). Kéo camera cũng phát sự kiện con trỏ ngay trong trang
  (`e2e/dan-ga-me-con.helpers.js#dragCamera`): với chuột của Playwright, lần dời đầu tới sau lần xuống một nhịp khung, nên runner vẽ một
  khung lâu hơn `GESTURE.holdMs` (350 ms) thì cú kéo thành cú giữ và camera bị khóa (GĐ 8, WebGPU trên CI: `goc` đứng ở 0).

### Camera trực giao, tự khép lại, bể hạt dùng chung, vẽ phi hiện thực (GĐ 8)
- Camera trực giao: `CameraSpec.kind: 'ortho'` cùng `height` (bắt buộc: bề cao khung nhìn ở zoom 1, thay cho `fov`), `minWidth` (khung
  hẹp thì nới `height`, trần 4 lần: `fov.js#fitOrtho`), `shortFrame: { below, maxGrow }` (canvas thấp hơn `below` điểm ảnh CSS thì nới
  `height` theo below / bề cao canvas, trần `maxGrow`: `fov.js#shortGrow`; lấy max với phần nới theo `minWidth`, không nhân dồn) và `zoom`
  ([min, max] của OrbitControls; thiếu thì không zoom); `fov`, `distance` không dùng. Phần tính ở `engine/gpu/camera.js` (`createCamera`,
  `fitCamera`, `limitControls`), tách khỏi `stage.js` để unit test được. Canvas mặc định của e2e (640 × 400) thấp hơn `shortFrame.below`
  của Bức 4 (800): vùng trên tờ giấy, điểm chạm và điểm kéo chốt ở khung chưa nới rồi đi qua `at640` của `e2e/dan-ga-me-con.helpers.js`
  (vùng ván thì không), không thì vùng trượt ra ván tối và kiểm trôi qua mà không kiểm gì.
- `stage.camera` là getter: `useCamera()` dựng camera mới đúng loại, nên mọi chỗ đọc `stage.camera` SAU `useCamera` và không giữ tham
  chiếu từ trước đó.
- Độ sâu tuyến tính lấy qua `channel('depth')`; chỉ `pipeline.js#linearDepth` chọn công thức theo loại camera (lúc dựng). Ngoài chỗ đó
  không gọi `getLinearDepthNode()`/`getViewZNode()` của PassNode: chúng luôn dùng công thức phối cảnh, camera trực giao ra một bóng trắng
  (spec Phụ lục A.89). Với camera trực giao, `channel('depth')` là chính texture độ sâu, đã tuyến tính (A.90): `getTextureNode('depth')` có sẵn
  trong pass, không thêm ảnh nào vào render target.
- Trong post, `cameraNear`, `cameraFar` của TSL là của camera vẽ quad (A.93): số của camera cảnh (`ctx.camera.near`, `far`) đi vào uniform
  đặt từ JS; công thức theo loại camera thì chọn bằng JS lúc dựng.
- Hướng nhìn trong shader dùng `positionViewDirection` (three tự xử lý camera trực giao, A.91); `cameraPosition − positionWorld` chỉ đúng
  với camera phối cảnh.
- Tranh tự khép lại (`CameraSpec.home: { after, duration }`, `engine/gpu/home.js`): `scene.step()` gọi `stage.returnHome(dt)` sau
  `stage.breathe(t)` và TRƯỚC `controls.update()` (bộ đếm đặt thẳng vị trí và zoom, `update()` nhìn về điểm nhìn và kẹp giới hạn); khung
  bị bỏ (thử ngừng vẽ) thì không gọi.
- Quán tính của OrbitControls tắt theo số lần `update()`, không theo giây (A.98): bức có `CameraSpec.home` thì `home.js` đặt
  `dampingFactor = 1 − (1 − mặc định)^(60·dt)` mỗi khung, trước `update()`; không thì máy vẽ chậm (dt kẹp 0,1 s) còn phần xoay dở, kéo
  camera khỏi góc vừa về.
- `scene.js#route`: bức đã nhận `'hold-start'` thì luôn nhận `'hold-end'` của cái giữ đó, kể cả khi công cụ bật giữa chừng (ngón khác,
  bàn phím, `__sma`) và giữ nó (Kính mài hình tròn giữ mọi cử chỉ chạm và giữ của ngón tay); không thì bức kẹt ở "đang giữ" mà không báo gì.
  Bộ điều chỉnh của cảnh (`createQuality`) ở `engine/gpu/scene-quality.js`, tách khỏi `scene.js` cho file này dưới 250 dòng.
- Bể hạt `lib/tsl/particles.js` (`createPool`) lo cấp phát một lần, khởi tạo, bước, `count` và vòng đệm; luật chuyển động viết trong bức.
  Hộp màu không đặt tên uniform: một bức có thể dựng hai bể.
- Mọi nhánh của `init`, `law`, `spawn` gán CẢ `a` lẫn `b`, để mỗi nhánh nói đủ trạng thái mới của phần tử. Đó là quy ước, không phải để
  tránh rác: nhánh không gán thì ô giữ giá trị cũ ở cả hai backend (WebGL2 chép bản đọc sang bản ghi trước khi chạy luật, A.97).
- Vòng đệm của `emit` quấn theo số phần tử đang tính (`count`), không theo `capacity`; nắm lớn hơn thì bị cắt; mỗi bước một nắm, hàng đợi
  tối đa 16 nắm. `emit` chép `origin` ngay; `emitted()` đếm lúc nắm ra khỏi hàng đợi (rắc thật), không lúc `emit`.
- `step(dt, w)` không làm gì khi `dt = 0` (`update(0, t)`) hay `w ≤ 0`, mà nắm đang chờ vẫn chờ: lớp tắt hẳn thì gọi `clear()` mỗi khung,
  không thì phủ lại là các nắm cũ bung ra cùng lúc.
- `meta.layers[].files` kê được file `lib/tsl/*.js` mà lớp import, thẳng hay qua part (glob của `ui/code-view.js` có `lib/tsl`): tùy chọn,
  kê thì phải import thật, và như mọi file trong `files`, mỗi file thuộc tối đa một lớp của bức (test hợp đồng giữ hai điều này). Quy ước:
  file mà nhiều lớp cùng dùng thì không lớp nào kê, như `noise.js` mà ba lớp của Bức 1 cùng dùng (Sương, Vàng lá, và Ánh trăng qua
  `parts/anh-trang-moon.js`).
- Bản ghi mã shader (`toMatchFileSnapshot`, số id thay bằng `tests/helpers/nodes.js#normalizeIds`): bản ghi đom đóm của Bức 1
  (`tests/paintings/ao-sen-dem/__fixtures__/vang-la/`) không bao giờ ghi lại, vì nó chứng minh việc rút bể hạt không đổi gì. Bản ghi thóc
  của Bức 4 (`tests/paintings/dan-ga-me-con/__fixtures__/thoc/`) khóa bản JS của luật trong `dan-ga-thoc.test.js`: đỏ thì sửa bản JS
  cho khớp trước, chạy lại các test đo phần bị ăn, rồi mới ghi lại bằng `-u`.
- Vẽ phi hiện thực (Bức 4): không đèn của three, không `shadowMap`; material là `NodeMaterial` gốc (`lights = false`, màu ra là
  `colorNode` cộng `emissiveNode`); các lớp bọc hàm của công thức tô `shared.cot.recipe` (`base`, `fill`, `ink`, `paper`, `glint`)
  trước lần biên dịch đầu.
- Dò cạnh trên độ sâu đo độ lệch khỏi mặt phẳng `D(+) + D(−) − 2·D(giữa)` (bằng 0 trên mọi mặt phẳng), không dùng Sobel: Sobel biến mặt
  nhìn chếch thành nét. Nếp gấp đo bằng góc gãy của mặt, không bằng hiệu độ dốc: gần mép khối, mặt đa diện kề nhau cũng vượt ngưỡng.
- Texture độ sâu đọc kiểu nearest (A.96): mẫu lân cận đặt ở TÂM điểm ảnh (`textureSize`), cách nhau số NGUYÊN điểm ảnh, nên núm dời mẫu
  (`lineWidth`, `misregister` của Bản nét) chỉ có số nguyên điểm ảnh thiết bị; lệch nửa điểm ảnh thì mặt sàn nghiêng thành sọc mực.
- Mẫu ngoài khung của texture đọc điểm ảnh ở mép, ở cả hai backend (A.99): cặp mẫu có một điểm ngoài khung thì bỏ cả cặp (nhân 0), không
  thì sát khung có vệt mực giả.
- Các nhánh anh em của một chuỗi `If`/`ElseIf` cùng đọc một texture (hay dùng chung node đã dựng ở nhánh khác) thì bọc node của mỗi nhánh
  trong `isolate(…).setParent(false)` (A.95), như `tools/pick.js` làm với view của Kính mài, Lột lớp. Luật cho mọi chuỗi `If`, không riêng
  `pick.js`: three r186 dùng chung biến texture giữa các nhánh anh em, nên nhánh sau đọc biến chưa gán và ra đen.
- Bức đổi mặc định của lớp dùng chung bằng spread trong `painting.js`, chỉ thay `value` (hay `min`, `max`), không đổi `id`, như Phủ bóng
  của Bức 4 (ACES, lộ sáng 1,2, bloom 0,5; `tests/paintings/dan-ga-me-con/phu-bong.test.js` giữ). Không sửa module dùng chung: các bức
  khác lắp chính nó.
- Bức ghi đè tone hay lộ sáng của Phủ bóng thì hex in trong `meta.palette` là màu VÀO tone mapping, chốt cho màu hiện ra đúng màu thiết kế
  (ACES làm vàng thành vàng chanh). Sơ đồ của Sổ tay dùng cùng các token ấy (test hợp đồng chỉ cho màu của bảng đã ghép).
- Một bức có thể có nhiều spec e2e (`e2e/<slug>.spec.js`, `e2e/<slug>-<phần>.spec.js`): mọi `describe` vẫn bắt đầu bằng `"{tên bức} · "`;
  tiện ích dùng chung (vùng của canvas, tag khói `SMOKE`) ở `e2e/<slug>.helpers.js`, các spec import. `tests/rules/e2e.test.js` gom file
  theo slug dài nhất và đếm test mang tag khói trên mọi file của bức.

### Bản dịch, giữ khung, link công thức (GĐ 9)
- Việc async để target (hay MRT) của lượt khác qua một lần chờ chạy trong `hold.run()` (`engine/gpu/hold.js`, một bộ giữ cho mỗi cảnh).
  `NodeMaterial` đọc target + MRT HIỆN TẠI lúc dựng (spec Phụ lục A.105), nên vòng lặp vẽ giữa chừng là vẽ vào target sai. Lúc giữ,
  `quality.sample()` trả `true` và `scene.step()` bỏ khung; `redraw()` của `?freeze` chờ `hold.idle()`. Người dùng duy nhất:
  `pipeline.compile()` (`scenePass.compileAsync`), nó sửa view Normal của Kính mài lúc cảnh đang chạy (lỗi từ GĐ 4). Bản dịch KHÔNG giữ khung.
- Bản dịch là "bắt lúc vẽ": `draws.js#capture()` bắt MỘT khung, và trong móc đọc `renderer._objects.get(object, material, scene, camera,
  lightsNode, renderer._currentRenderContext, clippingContext, passId).getNodeBuilderState()` đúng như `Renderer._renderObjectDirect`.
  Quad cuối = lần vẽ ngoài cùng của camera khác mà `isQuadMesh` (công khai). Chỉ `draws.js` đọc `_objects`, `_currentRenderContext`;
  không file nào trong `src/` gọi `debug.getShaderAsync` (nó trả RenderObject khác: chain map `'default'` thay cho passId `null`, tạo
  program mới, dựng quad không có `_vertexNode`; A.102). Test ghim ở `draws.test.js` giữ lời gọi với three 0.186.1.
- Không đổi `renderer.toneMapping` ở đâu cả, kể cả Bản dịch. `translate.js` dựng các nơi theo thứ tự cố định (`drawablesOf`, rồi quad cuối):
  `post`, `drawn: false`, không `ms`, không `onProgress`.
- Công thức `#r=` (`engine/recipe.js`, `engine/gpu/recipe-set.js`): khóa `layerId` (trọng số), `layerId.knobId`, `dialId`; chỉ ghi giá
  trị KHÁC mặc định của máy đang xem, theo thứ tự cố định. Id Dial không trùng id lớp; id lựa chọn của núm `select` khớp
  `^[A-Za-z0-9-]+$`; id núm khớp `^[A-Za-z][A-Za-z0-9]*$` (test hợp đồng giữ). `recipe.js` thuộc đường nhẹ (không ES2022, không three).
- Công thức áp lúc dựng, trước `scene.compile()`: `createKnobs` nhận giá trị ban đầu (núm `rebuild` dựng MỘT lần), trọng số và Dial đặt
  trước lần biên dịch đầu. Giá trị Dial của link làm tròn về nấc MỘT lần, ở `classify` (`snapDial`); `studio.restore` khôi phục Dial
  CHÍNH XÁC (`dials.restore(v, { exact: true })`), không thì mặc định lệch nấc (giờ thật của Bức 1) thành công thức ma.
- `studio.onChange(cb)` báo một lần sau mỗi `setWeight`/`setKnob`/`setDial`/`restore`; không báo thí nghiệm, công cụ, nấc chất lượng.
- Thanh địa chỉ (`engine/gpu/recipe-url.js`): `replaceState` gộp 500 ms (WebKit ném lỗi sau 100 lần trong 30 giây; `SecurityError` thì
  cảnh báo một lần rồi thôi ghi); ghi nốt khi `pagehide` và khi trang ẩn. `hashchange` áp trạng thái ĐỦ (hash trống = về mặc định). Cờ
  `applying` chặn ghi cho tới khi áp xong, không thì lần ghi cũ đè hash vừa dán.
- Mở link có công thức: thanh lớp mở không mài, xóa gợi ý và lời mời bằng `shell.clearHint()`, Sổ tay đóng. `engine/boot.js#runShell` liệt kê
  TỪNG hàm của vỏ trang: thêm lời gọi mới trong `run.js` hay `workshop-door.js` thì thêm hàm vào đó (thiếu thì trang có link công thức
  về tĩnh `'error'`; boot test giữ).
- Thanh lớp ở máy tính đứng dưới đầu trang (`--rail-top`, `ui/workshop.js` đo; không `transform`) và cuộn trong thanh. Vùng `aria-live` của
  Bản dịch và Công thức thu lại bằng `:empty`, không `display: none` hay `hidden` (test CSS giữ).
- E2e: test Normal lúc cảnh đang chạy mở KHÔNG `?freeze` (có `?freeze` thì vòng lặp đã dừng, không thấy lỗi). Lỗi GPU và `GL_INVALID_*` ở
  WebGL2 chỉ là `console.warning` thường: quét `log.all` (`e2e/helpers.js#gpuErrors`), vì `log.warnings` chỉ giữ cảnh báo DEPRECATION.
  Dữ liệu GĐ 9 dùng chung ở `GD9` của `e2e/helpers.js`.

### Chuyển động và ngẫu nhiên
- Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
- Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).
- Thứ chuyển động theo cử chỉ mà phải tất định với `?freeze` (hoa đăng) thì tính thẳng từ thời gian (dạng đóng: vị trí = f(t − lúc
  bắt đầu)), không cộng dồn từng khung: `update(0, t)` phải ra đúng khung N.

### Chữ và chú thích
- Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`.
- Chữ người xem thấy nằm trong `strings.*.js`, `content.*.js` và các trường chữ của `meta.js`: tên lớp (`meta.name`), cùng `title`, `tagline`, thơ (`poem`) và `poster.alt`.
  Không file nào trong `src/` import `strings.*.js`: trang HTML import rồi truyền `t` vào `boot`.
- Chữ của Sổ tay nằm trong `content.<lang>.js › layers[id]`: `understand` (≤ 150 chữ), `learned`, `readMore` (chỉ https),
  nhãn cho MỌI núm, thí nghiệm và số đo. Sơ đồ là SVG trong `diagrams/`, import bằng `?raw`, có `<title>`, chỉ dùng màu
  của bảng sơn mài. Test hợp đồng giữ các luật này.
- Vùng `aria-live` (`[data-hint]`, `[data-static]`, `[data-badge-note]`) không bao giờ dùng `hidden`: để trống khi không có
  gì để nói (CSS thu lại khi `:empty`). Vừa bỏ `hidden` vừa điền chữ trong cùng một nhịp thì VoiceOver bỏ qua.
- Chữ trong vùng aria-live ẩn bằng opacity (thuộc tính `data-*`, như `data-away` của chữ đi theo vật), không bằng `hidden`:
  `hidden` gỡ chữ khỏi cây trợ năng (hiện lại là đọc lại) và bỏ transition.
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
- Code trong plan chưa từng chạy: plan sai thì làm khác, và ghi mỗi chỗ khác thành một dòng `Lệch plan: …` trong thân commit.

## Gỡ lỗi nhanh
- Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?debug=stats`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`,
  `?level=cao|vua|thap` (ép mức chất lượng: xem mức thấp ngay trên máy tính), `?poster` (chỉ còn canvas).
- `?debug` mở three.js Inspector (draw call, thời gian GPU, cây node); `?debug=stats` mở stats-gl.
- `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`. Khi cảnh live còn có
  `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`, `__sma.stats()`
  (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (nấc đang hạ, `gpu`, nấc bị khóa `locked`), `__sma.degrade()` /
  `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` / `__sma.setTool('kinh-mai')` (công cụ học, `null` tắt hết;
  `__sma.setTool('tung-soi')` bật Từng sợi), `__sma.dials()` / `__sma.setDial('gio', 27)` (núm của cả bức), `__sma.readouts(id)`
  (số đo riêng của một lớp, như Sổ tay đọc: `__sma.readouts('anh-trang')` có số hoa đăng đang trôi, `__sma.readouts('keo-quan')` có
  số vòng mỗi phút của trống; `__sma.readouts('cot')` của Bức 3 có độ cao cây đang bay; `__sma.readouts('cot')` của Bức 4 có `goc`, độ
  lệch của camera khỏi góc của tranh; `__sma.readouts('dan-ga')` có `rac` (số hạt đã rắc), `dangAn`, `quanhMe` (gà con đang mổ, quanh
  mẹ)). Bức 3: `__sma.setDial('ngay', 15)` đặt ngày âm lịch (rằm).
- GĐ 9: `__sma.translate(id)` (Promise của Bản dịch: mã WGSL/GLSL của các nơi lớp `id` có mặt), `__sma.recipe()` (công thức hiện tại, không
  có `#r=`; chuỗi rỗng là nguyên bản), `__sma.applyRecipe(text)`. Hash `#r=suong:0,gio:23` mở bức theo công thức (spec §21.2); query và hash
  độc lập, nên `?freeze=10#r=…` hợp lệ.
