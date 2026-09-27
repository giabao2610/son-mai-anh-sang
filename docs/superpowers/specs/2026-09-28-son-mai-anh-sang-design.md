# Sơn Mài Ánh Sáng: thiết kế

> Một ao sen đêm, sơn từ sáu lớp ánh sáng. Mài từng lớp để thấy một khung hình 3D được làm ra như thế nào.

- **Ngày:** 2026-09-28
- **Chủ dự án:** Bao Nguyen (GitHub `giabao2610`)
- **Trạng thái:** đã duyệt thiết kế trong hội thoại, đang chờ duyệt bản spec này

---

## 1. Bối cảnh và mục tiêu

### Bạn đã nói
- Muốn làm một trang web 3D lấy cảm hứng từ project "Trung Thu 3D" (của devpan.vercel.app). Project này chỉ để **tham khảo**.
- **Không thương mại.** Mục đích là **khám phá và học về vẻ đẹp của 3D**.
- Cách gắn bó: **"vừa ngắm vừa học"**. Mỗi cảnh phải đẹp trọn vẹn, ghi rõ nó dùng kỹ thuật gì và có núm chỉnh trực tiếp trên trang.
- Chọn hướng **1 · Sơn Mài Ánh Sáng** trong 3 hướng đề xuất.
- Làm phần lõi (giai đoạn 0 đến 4) trong đợt này.
- Repo **public** trên GitHub cá nhân, deploy bằng GitHub Pages.

### Giả định (bạn đã xem, không phản đối)
- Project nằm ở `~/Documents/Projects/son-mai-anh-sang`.
- Git dùng `Bao Nguyen <giabao261096@gmail.com>`, chỉ cấu hình trong repo này. Cấu hình git global (email công ty) giữ nguyên.
- Phong cách mang chất Việt và nên thơ, nhưng không gắn với một lễ hội cụ thể nào.

### Bản tham khảo làm gì, và mình làm khác thế nào
| Bản tham khảo (Trung Thu 3D) | Sơn Mài Ánh Sáng |
|---|---|
| three.js 2021, `WebGLRenderer` | three.js **0.186.1**, `WebGPURenderer`, TSL (tự lùi về WebGL2) |
| Không có shader tự viết, glow giả bằng sprite | Shader TSL, bloom chọn lọc thật qua MRT |
| Hạt cập nhật bằng CPU | Đom đóm chạy bằng GPU compute, có công tắc so với CPU |
| Một file `script.js` 23KB, không có chú thích | Mỗi lớp một file, code hiển thị ngay trên trang |
| Máy không có WebGL thì báo lỗi rồi dừng | 3 tầng dự phòng, không bao giờ để trống màn hình |
| Code bị làm rối, chặn DevTools (devpan) | Mã nguồn mở MIT, khuyến khích mở DevTools |

## 2. Tiêu chí thành công

1. Mở link là thấy **poster trong dưới 1 giây**. Cảnh 3D hòa dần lên, trên laptop mạng tốt mất khoảng 3 giây.
2. **Chạm vào mặt nước** thì gợn sóng lan ra và **xẻ đôi bóng trăng** một cách rõ ràng.
3. Cả **6 lớp** bật/tắt được mà không khựng hình. Lớp nào cũng có đủ 3 tab **Hiểu / Chỉnh / Phá**, và kéo núm thì **dòng code thật sáng lên**.
4. Đạt **60fps trên laptop** và **từ 45fps trở lên trên điện thoại tầm trung**. Không bao giờ hiện màn hình lỗi rồi dừng.
5. Bao đọc được từng file lớp: mỗi file khoảng 250 dòng trở xuống, các điểm cần học có chú thích tiếng Việt.
6. Trang deploy công khai trên GitHub Pages của tài khoản cá nhân, mọi commit mang email cá nhân.

## 3. Không làm (non-goals)

- Không có backend, tài khoản, analytics hay tracking.
- Không tự phát nhạc. Không dùng modal lời chúc kèm ảnh kiểu thiệp.
- Không dùng lại ảnh, nhạc hay lời chúc của bản tham khảo thương mại. Mọi hình ảnh đều sinh bằng code.
- Không dùng React/R3F, `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` hay `EffectComposer`.
- Không dùng định vị, micro hay dữ liệu thời tiết.

## 4. Trải nghiệm người xem

1. **Mở trang:** HTML tĩnh hiện ngay poster ao sen, tên tranh, câu ca dao và con dấu ngày âm lịch. JS 3D tải ngầm, dò tầng, biên dịch trước shader (`compileAsync`), rồi **hòa dần** từ poster sang cảnh 3D. Không có spinner.
2. **Ngắm (mặc định):**
   - Không có UI, chỉ có câu thơ ở góc và camera chuyển động chậm như đang thở.
   - Gợi ý duy nhất: *"Chạm vào mặt nước"*.
   - Chạm thì tạo gợn sóng, đom đóm tản ra. Giữ thì đom đóm tụ lại quanh ngón tay, thả ra thì chúng bung ra.
   - Kéo để xoay camera trong một hình nón có giới hạn.
3. **Lời mời:** sau lần tương tác đầu tiên, hiện nhẹ *"Bức tranh này có 6 lớp — mài thử?"*.
4. **Chế độ mài có hướng dẫn:**
   - Mọi lớp mờ dần về 0, ao trở về **đất sét xám**.
   - Nút *"Phủ lớp tiếp theo"* sơn lại lần lượt từ lớp 1 đến lớp 6, mỗi lần mở Sổ tay của lớp vừa phủ.
   - Người xem cũng có thể bật/tắt tự do trên **thanh lớp**.
5. **Sổ tay:** panel bên phải trên desktop, bottom sheet trên điện thoại. Có 3 tab:
   - **Hiểu:** tối đa 150 chữ, 1 sơ đồ SVG, mục "Bạn vừa học", mục "Đọc thêm".
   - **Chỉnh:** núm Tweakpane cộng với code thật của lớp. Đưa chuột vào hoặc kéo một núm thì dòng code tương ứng sáng lên.
   - **Phá:** các thí nghiệm "Thử phá", kèm số đo trực tiếp (draw calls, số tam giác, ms).
6. **Công cụ:**
   - **Kính mài:** xoa một vòng tròn trên ảnh để nhìn thấy buffer bên dưới.
   - **Lột lớp:** thanh trượt đi ngược pipeline, tiện hơn khi dùng điện thoại.
   - **Thanh "giờ":** kéo từ 18:00 đến 05:30.
   - **Huy hiệu tầng:** hiện WebGPU / WebGL2 / Tranh tĩnh cùng mức chất lượng. Chạm vào để đọc giải thích.
7. **Chế độ thợ `?debug`:** mở three.js Inspector và stats-gl.

## 5. Chỉ đạo nghệ thuật

### Bảng màu sơn mài (token dùng chung cho CSS và TSL)
| Token | Tên | Hex |
|---|---|---|
| `denThen` | đen then (nền sơn) | `#0E0A08` |
| `canhGian` | nâu cánh gián | `#3B1F14` |
| `doSon` | đỏ son | `#B3261E` |
| `vangLa` | vàng lá | `#D4A94A` (sáng: `#F2D48A`) |
| `bacLa` | bạc lá | `#C9C6BD` |
| `nga` | ngà vỏ trứng | `#EDE3CF` |
| `cham` | chàm | `#1B2A4A` |
| `laSen` | xanh lá sen | `#2E4A3A` |

Không dùng neon hồng tím. Màu của sen lấy **đúng từ câu ca dao**: *lá xanh, bông trắng, nhị vàng*.

### Chữ
Font tự host qua `@fontsource`, không gọi Google Fonts lúc chạy:
- **Cormorant Garamond** (có tiếng Việt) cho thơ và tiêu đề.
- **Be Vietnam Pro** cho giao diện.
- **JetBrains Mono** cho code.

### Thơ (có ghi nguồn, không in số câu)
- Cả bức tranh: *"Trong đầm gì đẹp bằng sen / Lá xanh bông trắng lại chen nhị vàng / Nhị vàng bông trắng lá xanh / Gần bùn mà chẳng hôi tanh mùi bùn"* (ca dao).
- Lớp 4 · Mặt nước: *"Vầng trăng ai xẻ làm đôi / Nửa in gối chiếc, nửa soi dặm trường"* (Truyện Kiều, Nguyễn Du).
- Mỗi lớp có thể thêm một câu ngắn khác, nhưng phải là văn học dân gian hoặc cổ điển đã hết bản quyền và phải ghi nguồn.

### Chi tiết sống
- **Trăng đúng pha của đêm hôm đó**, tính từ ngày hiện tại. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
- **Con dấu đỏ ghi ngày âm lịch** ở góc tranh, ví dụ *"18 tháng Tám · Bính Ngọ"*.

## 6. Sáu lớp

Mỗi lớp có một uniform **trọng số `wN` (0 → 1)**. Bật/tắt một lớp là tween trọng số này, **không đổi node** nên không phải biên dịch lại shader. Khi `w2`–`w6` bằng 0, ao trở về đất sét xám `#8a8580`.

### Lớp 1 · Cốt: hình khối và instancing (`world/l1-cot.js`)
- **Thấy gì:**
  - Mặt nước là một đĩa phẳng bán kính khoảng 60.
  - **Lá sen:** 1.200 lá trên desktop, 500 trên điện thoại. Hình học tự sinh: đĩa tròn có khe hình nêm, lõm lòng chảo, mép lượn sóng, khoảng 40–80 đỉnh. Khoảng 10% là lá đứng trên cuống.
  - **Hoa:** khoảng 12 bông và 20 nụ, dựng từ **một cánh hoa được instance**, mỗi bông 3 vòng cánh, có tham số độ nở. Mỗi bông có gương sen, nhị vàng và cuống.
  - Khoảng 300 ngọn lau sậy ở rìa ao.
  - Lá được rải theo hạt giống cố định (jittered Poisson), chừa một **"lối trăng"** trống để thấy bóng trăng phản chiếu.
- **Kỹ thuật:** `BufferGeometry` tự sinh; `InstancedMesh`, cả ao chỉ khoảng 5 draw call; biến thể theo từng instance; `computeVertexNormals`; ma trận instance.
- **Núm:** `leafCount`, `seed`, `sizeVariance`, `cupAmount`, `openness`, `wireframe`, `flatShading`.
- **Phá:**
  - *"Tắt instancing"*: dựng lại bằng từng `Mesh` riêng (tối đa 1.200 trên desktop, 300 trên điện thoại) để thấy draw call tăng vọt và FPS tụt.
  - *"Normal phẳng"*: chuyển sang normal phẳng.
- **Số đo:** đỉnh, tam giác, draw calls (`renderer.info`).

### Lớp 2 · Ánh trăng: ánh sáng và chất liệu (`world/l2-anh-trang.js`)
- **Thấy gì:**
  - Trăng đúng pha, có vùng biển tối (worley/fbm), cường độ phát sáng lớn hơn 1 để bloom.
  - Ánh trăng bạc-ngà là `DirectionalLight` hướng từ trăng, cộng `HemisphereLight` (trời chàm, nước đen).
  - Cánh sen trắng ngà, ửng hồng nhạt ở đầu cánh, có **viền fresnel** và **sáng lên khi ngược sáng**. Lá có **clearcoat** bóng như sáp, gân lá vẽ bằng TSL.
  - Một **ngọn đèn hoa đăng** nhỏ (dùng lại hình cánh hoa) chứa `PointLight` ấm, **đổi màu được**. Đây là thí nghiệm "cùng một ánh sáng, khác chất liệu".
- **Kỹ thuật:** đèn và **một** shadow map (hoa và lá đứng đổ bóng lên lá nổi: 1024 trên desktop, 512 trên điện thoại, tắt ở tầng thấp); `MeshPhysicalNodeMaterial` (`colorNode`, `emissiveNode`, clearcoat, sheen); fresnel `pow(1 − N·V, p)`; wrap lighting.
- **Núm:** `moonPhase` (mặc định là đêm nay), `rimPower`, `rimColor`, `translucency`, `clearcoat`, `candleColor`, `candleIntensity`, `shadowMapSize`, `shadowBias`.
- **Phá:** *"Bias = 0"* (xem shadow acne), *"Tắt fresnel"*, *"Đổi màu đèn"*.

### Lớp 3 · Sương: bầu trời, noise, sương mù (`world/l3-suong.js`)
- **Thấy gì:**
  - Vòm trời đổi dần từ chàm xuống đen then.
  - Sao sinh bằng hash, không dùng texture. Quầng trăng. Dải Ngân Hà mờ bằng fbm.
  - **Sương là là**: dày sát mặt nước, mỏng dần lên cao, trôi theo gió. Vuốt tay thì sương xoáy rồi lắng lại.
- **Kỹ thuật:**
  - Vòm trời là sphere `BackSide` với `colorNode`.
  - `scene.fogNode` tự viết: `density × exp(−y·falloff) × (0.6 + 0.4·noise3D(p·scale + wind·t))`.
  - `Fn()` dùng lại được. Hàm noise này cũng được lớp 5 dùng.
- **Núm:** `density`, `heightFalloff`, `noiseScale`, `octaves` (1–5), `windStrength`, `starDensity`, `haloSize`.
- **Phá:** *"Xem noise thô"* (hiện fog factor dạng ảnh xám), *"Octave 1 vs 5"* (so chi tiết với số ms).

### Lớp 4 · Mặt nước: phản chiếu và gợn sóng (`world/l4-mat-nuoc.js`)
- **Thấy gì:** nước đen bóng như sơn, soi trăng, sen và trời. Chạm vào thì gợn sóng lan ra, bóng trăng **bị xẻ đôi**, lá sen nhấp nhô khi sóng đi qua.
- **Kỹ thuật:**
  - Phản chiếu bằng `reflector()`: độ phân giải 0.5 trên desktop, 0.25 trên điện thoại.
  - UV phản chiếu bị lệch theo normal, normal lấy từ 2 lớp noise trôi cộng trường gợn sóng.
  - Pha giữa phản chiếu và màu nước sâu bằng Schlick fresnel.
  - **Gợn sóng:** `uniformArray` 8 phần tử `vec4(x, z, startTime, amp)` dùng như ring buffer. **Một hàm TSL `rippleHeight(xz)` dùng chung** cho normal của nước lẫn độ nhấp nhô của lá (lá dịch `positionNode` theo gợn tại vị trí instance của nó).
  - `emissiveNode` của nước lấy phần sáng vượt ngưỡng trong ảnh phản chiếu, nên bóng đom đóm và bóng trăng trên nước cũng bloom nhẹ. Đây là lựa chọn có chủ đích.
- **Tầng thấp:** "phản chiếu giả" bằng màu trời cộng vệt trăng tính theo công thức, không render cảnh lần thứ hai.
- **Núm:** `amplitude`, `speed`, `decay`, `wavelength`, `distortion`, `fresnelPower`, `reflectionResolution` (0.1–1).
- **Phá:** *"Độ phân giải 0.1"* (phản chiếu vỡ hạt), *"Tắt fresnel"*, *"Xem heightfield"*.

### Lớp 5 · Vàng lá: đom đóm tính trên GPU (`world/l5-vang-la.js`)
- **Thấy gì:** đom đóm vàng lá trôi lững lờ theo dòng curl-noise, mỗi con nhấp nháy theo nhịp riêng và có bóng phản chiếu run run trên nước. Giữ tay thì chúng tụ lại và bay vòng quanh, thả ra thì chúng bung ra như tia lửa lò rèn.
- **Kỹ thuật:**
  - Bộ đệm `instancedArray` lưu vị trí, vận tốc và pha. Mỗi frame chạy `Fn().compute(N)`.
  - Curl noise tính bằng sai phân của noise 3D (dùng lại hàm của lớp 3).
  - Điểm hút là giao điểm của tia từ con trỏ với mặt phẳng, có độ giảm mềm.
  - Nhấp nháy: `smoothstep(sin(t·rate + phase))`.
  - Hiển thị: `SpriteNodeMaterial` instanced, blending additive, ghi vào kênh MRT `emissive`.
- **Số lượng:** mặc định 3.000 ở mức cao, 1.500 ở mức vừa, 600 ở mức thấp. Núm cho tăng tới 200k trên WebGPU desktop và 20k trên WebGL2.
- **Biến thể CPU:** cùng luật đó chạy trên JS, ghi vào `InstancedBufferAttribute` (tối đa 5k), dùng cho thí nghiệm *"CPU vs GPU"* có biểu đồ ms.
- **WebGL2:** compute chạy qua transform feedback. Nếu bản thử ở giai đoạn 0 cho thấy cách này không ổn thì tầng B dùng biến thể CPU với N ≤ 1.500.
- **Núm:** `count`, `flowScale`, `speed`, `attraction`, `blinkRate`, `size`, `glow`.
- **Phá:** *"CPU vs GPU"*, *"Tắt additive"* (thấy lỗi thứ tự vẽ).

### Lớp 6 · Phủ bóng: hậu kỳ (`world/l6-phu-bong.js` + `core/pipeline.js`)
- **Thấy gì:** chỉ đom đóm, viền cánh sen, trăng và quầng trăng là bloom. Tone mapping AgX giữ lại chi tiết vùng sáng. **LUT "sơn mài"** làm vùng tối ấm về nâu cánh gián và vùng sáng ánh vàng lá, chàm hơi ngả. Thêm grain nhẹ, vignette và FXAA.
- **Kỹ thuật:**
  - `RenderPipeline` với `pass(scene, camera)` và `setMRT(mrt({ output, emissive }))`.
  - `bloom(emissive)` cộng vào output (bloom chọn lọc, theo `webgpu_postprocessing_bloom_selective`).
  - Tone mapping làm bằng node trong pipeline để đổi được giữa AgX, ACES và none.
  - `lut3D` với LUT 32³ **sinh bằng code** (`Data3DTexture`), grain, vignette, FXAA.
- **Khi `w6` = 0:** không bloom, không LUT, không grain, tone mapping `none`. Người xem thấy ảnh HDR bị cháy trắng, và đó chính là bài học.
- **Núm:** `bloomStrength`, `bloomRadius`, `bloomThreshold`, `toneMapping` (chọn), `exposure`, `lutIntensity`, `grain`, `vignette`.
- **Phá:** *"Bloom cả khung vs chọn lọc"* (bloom lên cả output thì ảnh bết), *"Tắt tone mapping"*, thanh trượt so sánh trước/sau.

## 7. Công cụ học

### Kính mài
- **Uniform:** `uLensPos` (tọa độ màn hình), `uLensRadius`, `uLensMode`.
- **Chế độ:** trước hậu kỳ / emissive / normal / depth.
- **Ghép ảnh cuối:** `mix(final, debugView, 1 − smoothstep(r − feather, r, dist))` cộng một viền vàng lá.
- **Buffer:** MRT mặc định chỉ có `{output, emissive}`. Lần đầu chọn chế độ normal mới thêm `normal` (biên dịch lại một lần, hiện chữ "đang mài…"). Depth lấy từ `scenePass`.
- **Trên điện thoại:** khi bật công cụ kính thì chạm dùng cho kính, lúc khác chạm dùng cho mặt nước.

### Lột lớp
Thanh trượt có các nấc: *Ảnh cuối → Bỏ tone mapping → Bỏ bloom → Chỉ emissive → Normal → Depth*.

### Thanh "giờ" (`uHour`, 18.0 → 29.5, tức 05:30)
- **Điều khiển:** độ cao và phương vị của trăng (mọc phía đông lúc chạng vạng, cao nhất lúc nửa đêm, lặn phía tây trước khi sáng), dải màu trời (chạng vạng còn ấm ở chân trời, gần sáng thì chàm nhạt dần), màu sương, hướng và cường độ ánh trăng.
- **Mặc định:** giờ hiện tại nếu đang là đêm. Nếu đang ban ngày thì đặt 21:00, kèm dòng chú thích nhỏ.

### Code sống
- Vite plugin `vite-plugin-code-view` (tự viết, nằm trong repo) biến import `?code` thành HTML đã highlight bằng **Shiki lúc build**. Mỗi dòng mang `data-line`, và plugin kèm bảng tra `knobId → [dòng]`.
- **Marker:** `// @knob <id>` ghi ở dòng dùng uniform đó.
- **Test lúc build** (Vitest) kiểm tra mọi marker đều có núm tương ứng, và ngược lại.

### Huy hiệu và chế độ thợ
- **Huy hiệu:** hiện tầng và mức chất lượng. Chạm vào để xem giải thích bằng tiếng Việt.
- **`?debug`:** mở three.js `Inspector` và `stats-gl`.

## 8. Kiến trúc

```
son-mai-anh-sang/
  index.html                 khung DOM: poster, tiêu đề, thơ, con dấu, gợi ý, huy hiệu
  public/                    poster.webp, og.png, favicon
  src/
    main.js                  khởi động: detectTier → bootStage | showStatic
    core/
      tier.js                dò tầng (hàm thuần, nhận env qua tham số để test được)
      stage.js               renderer, camera, OrbitControls có giới hạn, Timer, resize, DPR, mất context
      quality.js             mức cao/vừa/thấp và bộ điều chỉnh tự động có trễ (hàm thuần)
      pipeline.js            RenderPipeline: MRT, bloom, tone, LUT, grain, vignette, FXAA, kính mài, lột lớp
      input.js               pointer → điểm trên mặt nước; chạm / giữ / kéo / vuốt
      layers.js              sổ đăng ký lớp, tween trọng số, chế độ mài
    world/
      palette.js             token màu sơn mài
      shared.js              uniform dùng chung: uTime, uHour, ripples[8], moonDir, wind, pointer
      noise.js               Fn noise/fbm/curl dùng chung
      l1-cot.js … l6-phu-bong.js
    astro/
      lunar.js               âm lịch Việt (Hồ Ngọc Đức, UTC+7), can chi
      moon.js                pha trăng, độ sáng (theo thời điểm trăng mới của lunar.js)
    ui/
      shell.js               poster ↔ canvas, gợi ý, lời mời, con dấu
      layer-rail.js  notebook.js  knobs.js  lens.js  hour.js  badge.js
    content/layers.vi.js     nội dung tiếng Việt của từng lớp (Hiểu / Phá / Đọc thêm)
    styles/                  tokens.css, shell.css, notebook.css
  plugins/vite-plugin-code-view.js
  tests/                     unit (Vitest)
  e2e/                       Playwright
  .github/workflows/deploy.yml
  CLAUDE.md  README.md  LICENSE (MIT)
```

### Hợp đồng của một lớp
```js
// world/lN-*.js
export function createLayer(ctx) {
  // ctx = { scene, camera, renderer, shared, quality, tier }
  return {
    id: 'mat-nuoc',
    weight,            // uniform(0..1), tween khi bật/tắt
    update(dt, t) {},  // mỗi frame
    knobs: [ { id, label, uniform | get/set, min, max, step, options? } ],
    experiments: [ { id, label, toggle(on) } ],
    readouts: [ { label, get() } ],
    dispose() {},
  };
}
```
- `content/layers.vi.js` lấy `id` làm khóa để tra nội dung Hiểu / Phá / Đọc thêm.
- Lớp 6 xuất thêm các tham số để `pipeline.js` dùng.

### Luồng mỗi frame
1. `Timer.update()`
2. `input` cập nhật các uniform `pointer` và `ripples`.
3. Lần lượt gọi `layer.update()`. Lớp 5 gọi `renderer.compute()`.
4. `quality.sample(dt)`
5. `pipeline.render()`

## 9. Tầng dự phòng (`core/tier.js`)

**Thứ tự quyết định:**
1. **Tham số URL:** `?static` chuyển sang C. `?webgl` chuyển sang B (`forceWebGL: true`). `?force3d` bỏ qua mọi bước kiểm tra phần mềm, kể cả cờ `failIfMajorPerformanceCaveat` và tên renderer (để e2e chạy được trên SwiftShader).
2. **A · WebGPU:** có `navigator.gpu`, `requestAdapter()` trả về adapter, và adapter không phải fallback/phần mềm (`adapter.info.isFallbackAdapter`, tên có `swiftshader`).
3. **B · WebGL2:** gọi `getContext('webgl2', { failIfMajorPerformanceCaveat: true })` thành công, và `WEBGL_debug_renderer_info` không khớp `/SwiftShader|llvmpipe|Software|Basic Render/i`.
4. **Còn lại là C · Tranh tĩnh.**

**Trong lúc chạy:**
- Khởi động quá 10 giây hoặc lỗi thì chuyển sang C.
- Mất context lần 1 thì hiện poster và nút "Dựng lại cảnh". Lần 2 thì chuyển sang C.

**Tranh tĩnh:**
- Poster, trăng SVG đúng pha, con dấu, thơ.
- Sổ tay đọc được đầy đủ (Hiểu và code, không có núm).
- Lời giải thích tiếng Việt: kiểm tra `chrome://gpu`, bật "Use hardware acceleration when available".

## 10. Hiệu năng và chất lượng

| Mức | Khi nào | DPR tối đa | Phản chiếu | Đom đóm | Lá | Bóng | Bloom |
|---|---|---|---|---|---|---|---|
| **cao** | WebGPU desktop | 2 | 0.5 | 3.000 | 1.200 | 1024 | độ phân giải đầy đủ |
| **vừa** | WebGPU điện thoại, WebGL2 desktop | 1.5 | 0.35 | 1.500 | 800 | 512 | ½ |
| **thấp** | WebGL2 điện thoại | 1.25 | giả | 600 | 500 | tắt | ½ |

- **Bộ điều chỉnh tự động:** đo frame time trung bình theo cửa sổ 2 giây.
  - Hai cửa sổ liên tiếp vượt ngân sách × 1,2 thì hạ một nấc, theo thứ tự: DPR −0,25 → phản chiếu → bloom → đom đóm → bóng.
  - Năm cửa sổ liên tiếp dưới ngân sách × 0,7 thì nâng một nấc, nhưng không vượt mức ban đầu.
- **Ngân sách:**
  - Khoảng 30 draw call trở xuống.
  - Poster WebP 150 KB trở xuống.
  - JS 3D đo và ghi vào README, mục tiêu 450 KB gzip trở xuống, tải sau khi poster đã hiện.
- **Máy yếu:** biên dịch trước bằng `compileAsync` trong lúc poster đang hiện.
- **`prefers-reduced-motion`:** tắt chuyển động "thở" của camera, gợn sóng nhẹ hơn.

## 11. Âm lịch và pha trăng

- **`lunar.js`:** thuật toán Hồ Ngọc Đức với múi giờ +7. Tính ngày, tháng, năm âm lịch, tháng nhuận, can chi của năm, và thời điểm trăng mới (`jdNewMoon`).
- **`moon.js`:** tuổi trăng tính từ trăng mới gần nhất. Độ sáng `(1 − cos(phase))/2`. Hướng mặt trời giả lập (dùng cho terminator trong shader) suy từ góc pha.
- **Nhãn con dấu:** `"{ngày} tháng {Tên tháng}{ nhuận?} · {Can Chi}"`. Tên tháng dùng chữ: Giêng, Hai, …, Chạp.

## 12. Kiểm thử

### Unit (Vitest)
- **`lunar`:**
  - Tết 2024 = 2024-02-10, Tết 2025 = 2025-01-29, Tết 2026 = 2026-02-17.
  - Trung Thu 2025 = 2025-10-06, Trung Thu 2026 = 2026-09-25.
  - 2026-09-28 = ngày 18 tháng Tám Bính Ngọ.
  - Can chi: 2025 Ất Tỵ, 2026 Bính Ngọ.
- **`moon`:**
  - Độ sáng lớn hơn 0,97 vào các đêm trăng tròn 2026-03-03, 2026-08-28, 2026-09-26.
  - Độ sáng nhỏ hơn 0,05 vào ngày trăng mới 2026-09-11.
- **`tier`:** bảng tình huống env giả lập, gồm: có WebGPU / không có / adapter fallback / renderer SwiftShader / có `?webgl`, `?static`, `?force3d`.
- **`quality`:** kiểm tra độ trễ (không dao động qua lại), đúng thứ tự hạ nấc, không nâng vượt mức ban đầu.
- **`knob-markers`:** tập marker `@knob` trong `world/*.js` phải bằng tập id núm của các lớp.
- **`content`:** lớp nào cũng có đủ Hiểu / Phá / Đọc thêm, và phần Hiểu không quá 150 chữ.

### E2E (Playwright, Chromium)
- Chạy với `?webgl&force3d`, vì headless dùng SwiftShader. Kiểm tra:
  - Canvas có pixel không đen.
  - Không có lỗi console.
  - Chạm vào mặt nước thì ảnh thay đổi (so pixel).
  - Tắt lớp 6 thì ảnh thay đổi.
  - Sổ tay mở ra được, và di chuột lên núm thì dòng code sáng lên.
- Chạy với `?static`: thấy poster và Sổ tay, không có canvas.
- Chụp ảnh màn hình từng giai đoạn vào `e2e/__screens__/` để xem bằng mắt.

### Kiểm tra thủ công
- `chrome://gpu` trên máy của Bao.
- Điện thoại thật của Bao, cả Android lẫn iOS nếu có.
- Safari 26 (WebGPU).

## 13. Repo, CI, deploy

- **Remote:** `github.com/giabao2610/son-mai-anh-sang`, **public**, giấy phép MIT.
- **Commit:** mọi commit mang `Bao Nguyen <giabao261096@gmail.com>`, cấu hình local trong repo.
- **Vite:** `base: '/son-mai-anh-sang/'`.
- **GitHub Actions (`deploy.yml`):** `npm ci` → `npm test` → `npm run build` → `npx playwright install chromium` → `npm run e2e` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Chỉ deploy khi mọi bước đều qua.
- **URL:** `https://giabao2610.github.io/son-mai-anh-sang/`.
- **`CLAUDE.md` gồm các luật:**
  - Chỉ dùng TSL.
  - Ghim `three@0.186.1`.
  - Đối chiếu API với `node_modules/three` và examples `webgpu_*` trước khi dùng.
  - Không dùng `ShaderMaterial` / `EffectComposer` / `onBeforeCompile`.
  - Chú thích tiếng Việt ở những điểm cần học.
  - Commit bằng email cá nhân.

## 14. Lộ trình

| Giai đoạn | Nội dung | Điều kiện xong |
|---|---|---|
| **0 · Nền móng** | Vite + repo + CI + deploy; `tier`, `stage`, `quality` (bản khung), trang Tranh tĩnh; **bản thử nhanh** chạy cùng lúc `reflector()` + sprite compute + MRT bloom chọn lọc, trên cả WebGPU và `?webgl` | URL công khai chạy bản thử trên cả 2 backend; `?static` hoạt động; unit test qua |
| **1 · Ao sen đầu tiên ✨** | Lớp 1, 2, 4 (gợn sóng xẻ trăng), đom đóm bản đơn giản, bloom chọn lọc + AgX, thơ, con dấu âm lịch, poster hòa dần | "Phép màu" hiện rõ trên laptop và điện thoại; đã deploy |
| **2 · Sổ tay** | Hợp đồng lớp + trọng số, thanh lớp, chế độ mài, Sổ tay 3 tab, Tweakpane, code sống + marker, Phá cho lớp 1/2/4 | Bật/tắt lớp không khựng; test marker qua |
| **3 · Sương + Vàng lá GPU** | Lớp 3 hoàn chỉnh, lớp 5 compute + biến thể CPU, bộ điều chỉnh chất lượng chạy thật | Điện thoại từ 45fps trở lên |
| **4 · Phủ bóng + Kính mài** | Lớp 6 hoàn chỉnh (LUT, grain, chọn tone, trước/sau), kính mài + lột lớp, thanh giờ, poster thật, kiểm tra a11y, README | Mọi e2e qua; đã deploy; README đầy đủ |
| 5 · *(tùy chọn)* | Thả hoa đăng mang một dòng thơ; link "công thức" (URL hash); "Từng sợi"; "Xem bản dịch" (WGSL/GLSL); tiếng đàn bầu tổng hợp; trăng làm thanh tiến độ | tùy |
| 6 · *(mở rộng)* | Bức tranh mới dùng lại khung 6 lớp: Đèn kéo quân (shadow map vs gobo `atan2`), Đông Hồ (hạt compute), Cung Quế (SDF raymarch) | tùy |

## 15. Rủi ro và cách tránh

- **API TSL thay đổi nhanh, AI hay bịa API.** Ghim phiên bản; đối chiếu với `node_modules/three/src` và `examples/jsm`; ghi luật trong `CLAUDE.md`; bản thử ở giai đoạn 0 dùng đúng các API mà cảnh sẽ dùng.
- **WebGL2 qua WebGPURenderer trên Android yếu.** Mức "thấp" mặc định dùng phản chiếu giả; `compileAsync` chạy sau poster; bộ điều chỉnh tự động; chấp nhận mục tiêu 45fps.
- **Compute trên WebGL2 không ổn.** Biến thể CPU của lớp 5 là đường lùi chính thức, không phải phương án tạm.
- **Trông na ná "ao đêm có đom đóm" của các trang khác.** Chất liệu sơn mài thật (clearcoat, LUT sơn mài), màu sen lấy đúng từ ca dao, không neon, bloom chọn lọc thay cho bloom cả khung.
- **Phạm vi phình to.** Chưa đạt ngân sách FPS thì không thêm lớp; mỗi giai đoạn xong phải deploy; giai đoạn 5 và 6 là tùy chọn.
- **Máy của Bao đang tắt WebGL.** Kiểm tra `chrome://gpu` ở giai đoạn 0; tầng C giải thích cách bật lại.
