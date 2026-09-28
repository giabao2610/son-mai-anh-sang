# GĐ 1 · Ao sen đầu tiên: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến Ao Sen Đêm v0 thành "phép màu" đầu tiên: ao sen có hoa, trăng đúng pha theo giờ đêm nay, lối trăng lấp lánh trên mặt nước; chạm mặt nước thì gợn sóng lan ra và xẻ bóng trăng; giữ tay thì đom đóm tụ lại. Deploy công khai.

**Architecture:** Giữ nguyên ba vùng của GĐ 0.
- **Xưởng** thêm: cử chỉ (`engine/gpu/gesture.js` thuần + `input.js` nối DOM, có tia và `ctx.u.pointer`), camera "thở" (`breath.js`), chế độ thợ (`debug.js`: Inspector / stats-gl, chỉ `import()` động), gợi ý + lời mời và trăng SVG trong vỏ trang (`ui/shell.js`, `ui/moon-svg.js`), lý do tĩnh `timeout` có lời riêng.
- **Hộp màu** thêm `lib/tsl/noise.js` (fbm).
- **Bức 1** thêm `setup()` (`shared.js`: giờ, hướng trăng, 8 gợn sóng, điểm hút, cử chỉ), `content.vi.js`, lớp 2 Ánh trăng mới, và làm hoàn chỉnh lớp 1 (hoa nở bằng uniform, lá đứng, lau sậy), lớp 4 (nước có chiếu sáng, gợn sóng, MRT riêng), lớp 5 bản đơn giản (hút/đẩy theo tay).

**Tech Stack:** Node 24 LTS · three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) · Vite 8 · Vitest 5 (+ jsdom) · Playwright 1.63 (Chromium headless, SwiftShader) · stats-gl 4.2.3 (chỉ khi `?debug=stats`) · GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch lập luận từ spec; người thực thi đọc cả hai. Các mục hay dùng: §0 (luật kỹ thuật), §4 (trải nghiệm), §6 (các lớp), §7 (giờ, huy hiệu, chế độ thợ), §8 (kiến trúc, hợp đồng, cờ URL), §9 (tầng dự phòng), §10 (mức chất lượng), §12 (kiểm thử), §14 (lộ trình, dòng GĐ 1), Phụ lục A.

**Code trong kế hoạch này đã chạy thật.** Trước khi viết kế hoạch, toàn bộ GĐ 1 đã được dựng thử trong một bản sao của repo: 378 test Vitest xanh; e2e xanh trên cả `static`, `webgl2-swiftshader` và `webgpu-swiftshader` (Chromium 1243, macOS). Con số màu, cường độ đèn, góc cánh hoa… là số đã chỉnh bằng mắt trên ảnh chụp SwiftShader; bước "nhìn ảnh" của từng task cho phép chỉnh tiếp (ghi rõ khoảng được phép).

## Global Constraints

Mọi task đều ngầm bao gồm các ràng buộc dưới đây (phần lớn là luật của `CLAUDE.md`; `npm test` giữ nhiều luật và báo lỗi tiếng Việt kèm `file:dòng`: gặp lỗi thì sửa code, không nới luật).

**Công cụ**
- Node **24** (`node -v` ra `v24.x`). Máy của Bao chưa có fnm: nếu `node -v` không ra v24, làm theo Task 1 · Step 0 (Node 24 bản portable trong thư mục tạm, không sửa `~/.zshrc`), và đặt `PATH` đó ở đầu mọi lệnh `node`/`npm`/`npx`.
- `three@0.186.1`, `@playwright/test@1.63.0` ghim đúng phiên bản. Thêm đúng một gói: `stats-gl@^4.2.3` (Task 8).
- Playwright cần Chromium của bản 1.63: `npx playwright install chromium` (một lần).

**Quy ước file**
- Dòng 1 của mọi `src/**/*.js`: `// <đường dẫn> — <một câu tiếng Việt nói file làm gì>`. Test giữ.
- Mỗi file ≤ 250 dòng (quá 300 là test hỏng). Lớp dài thì tách helper sang `src/paintings/ao-sen-dem/parts/`, và thêm file đó vào `LayerMeta.files` của lớp sở hữu.
- JavaScript ESM thuần + JSDoc. Tên biến tiếng Anh, camelCase. Import tương đối ghi đuôi `.js`.
- Chú thích tiếng Việt ở chỗ cần học; lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.

**Ranh giới** (spec §8.2, `tests/rules/imports.test.js` giữ)
- Xưởng (`engine/`, `ui/`) không import bức; `ui/` không import `engine/` hay three; `lib/` là lá (chỉ `lib/tsl/` được import three).
- Hàng rào từ vựng: code trong `engine/`, `ui/`, `lib/tsl/` không được chứa slug, id lớp riêng của bức (`mat-nuoc`, `vang-la`, `anh-trang`…) hay từ trong `meta.fence` (`ripple`, `lotus`, `firefl`, `uhour`, `moondir`, `lantern`, `mặt nước`, `đom đóm`, `hoa sen`, `hoa đăng`). Không bao giờ rẽ nhánh theo `slug`.
- Đường nhẹ: bao đóng import tĩnh từ `engine/boot.js` và `paintings/*/index.js` không kéo three hay gói npm. `ui/shell.js` được import `lib/astro/moon.js`.
- `engine/gpu/` chỉ dùng gói npm `stats-gl` và `three/addons/inspector/…` qua `import()` động.

**TSL và three r186** (spec Phụ lục A)
- Chỉ TSL. Cấm `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, `EffectComposer` và API deprecated ở spec §3.
- Không `select()` khi có node dùng chung giữa các nhánh; dùng `Fn` + `.toVar()` + `If`. TSL không có `atan2`: dùng `atan(y, x)`.
- Tên uniform (`setName`) là định danh hợp lệ, không có `-`.
- Không đặt số lên material lúc chạy; mọi thứ đổi theo trọng số/núm đi qua uniform trong node. Cường độ và màu **đèn** thì đổi được mỗi khung (là uniform bên trong node đèn).
- Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled`, `renderer.toneMapping`, `scene.fogNode` lúc chạy: bật một lần lúc dựng.
- Mọi material gán `emissiveNode` tường minh. Màu nào cũng đi qua `mix(datSet, màu, w)` với `w = ctx.weight(id)` (luật 3).
- **Mới, đã kiểm (Task 16 ghi vào Phụ lục A):** `material.mrtNode` chỉ an toàn cho material **không bao giờ** được vẽ vào render target không có MRT. Ảnh của reflector render không có MRT: material có `mrtNode` mà lọt vào đó thì WGSL hỏng ("structures must have at least one member"), WebGL2 báo "Active draw buffers with missing fragment shader outputs". Mặt nước dùng được vì reflector tự ẩn chính nó.
- **Mới, đã kiểm:** trong `positionNode` (chạy SAU instancing), gán `normalLocal.assign(…)` có hiệu lực trên cả hai backend; nhờ vậy xoay được từng cánh hoa theo uniform mà ánh sáng vẫn đúng.

**Chuyển động và ngẫu nhiên**
- Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time`, `ctx.u.delta`. Không dùng `Math.random`; dùng `lib/random.js` (mỗi việc một hạt giống riêng).
- Cử chỉ được xếp hàng và xử lý ở đầu khung, nên `?at&freeze=N` vẫn tất định (e2e kiểm hai lần chạy cho cùng một ảnh).

**Chữ**
- Chữ người xem thấy nằm trong `ui/strings.vi.js` (xưởng), `content.vi.js` (bức), hoặc `name`/`title`/thơ/`poster.alt` trong `meta.js`. Không file nào trong `src/` import `strings.*.js`.

**Git**
- Làm trên nhánh `gd1-ao-sen-dau-tien` (Task 1 tạo). Commit bằng danh tính local của repo: `Bao Nguyen <giabao261096@gmail.com>` (kiểm `git config user.email` trước commit đầu). Không sửa git config global.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Không push trước Task 15. Task 15 và Task 17 push lên GitHub (nhánh, rồi main): đó là việc ra bên ngoài, đã nằm trong kế hoạch Bao duyệt.

## Review Focus

Năm tình huống người dùng thật dễ gặp mà spec không nói thẳng. Mỗi tình huống có test ở task sở hữu code:
1. **Nhấn giữ trên điện thoại mở menu ngữ cảnh** (Android: "Tải ảnh xuống…", iOS: callout), trình duyệt hủy con trỏ và cử chỉ "giữ" gãy giữa chừng. Mong đợi: canvas chặn `contextmenu`. Test: `tests/unit/input.test.js` "nhấn giữ trên điện thoại không mở menu ngữ cảnh" (Task 5).
2. **Rời trang giữa lúc giữ** (chuyển tab, có cuộc gọi): không bao giờ có `pointerup`, đom đóm bị hút mãi và camera bị khóa. Mong đợi: `blur`/`pointercancel` = thả tay (`hold-end`, camera chạy lại). Test: `tests/unit/input.test.js` "rời trang giữa lúc giữ" (Task 5).
3. **Chunk chữ của bức tải hỏng** (vừa deploy, HTML cũ trỏ tới `content.vi-<hash>.js` đã bị xóa). Mong đợi: cảnh 3D vẫn live, không có gợi ý, không về tầng tĩnh. Test: `e2e/ao-sen-dem.spec.js` "content.vi-*.js lỗi" (Task 14).
4. **Người xem xin giảm chuyển động.** Mong đợi: camera không "thở", gợn sóng nửa biên độ. Test: `tests/unit/breath.test.js` `breathAmplitude` (Task 7) và `tests/paintings/ao-sen-dem/shared.test.js` "giảm chuyển động" (Task 9).
5. **Xem ban ngày** (phần lớn lượt xem): không có "đêm nay". Mong đợi: giờ mượn 21:00 kèm ghi chú `daytime`, pha trăng vẫn là của ngày đó, không lỗi. Test: `shared.test.js` "ban ngày mượn 21:00" (Task 9).

## Bản đồ file sau GĐ 1

| File | Trách nhiệm | Task |
|---|---|---|
| `tests/paintings/html.test.js`, `e2e/painting.spec.js`, `index.html`, `tests/helpers/page.js` | vệ sinh test: màu hex không bắt nhầm id SVG, kiểm "không tải three" không đúng rỗng, `aria-live` cho ghi chú huy hiệu | 1 |
| `src/engine/static.js`, `src/ui/strings.vi.js`, `src/engine/boot.js` | lý do tĩnh `timeout` có lời riêng + nút tải lại; `formatSeal` kiểm can/chi; dò tầng không ném ra ngoài | 2 |
| `src/lib/tsl/noise.js` | fbm dùng chung (hộp màu) | 3 |
| `src/ui/moon-svg.js`, `src/ui/shell.js`, `index.html`, `src/styles/shell.css`, `e2e/ao-sen-dem.spec.js` | trăng SVG đúng pha trong `[data-moon]` | 4 |
| `src/engine/gpu/gesture.js`, `src/engine/gpu/input.js` | cử chỉ (thuần) + nối DOM, tia, `ctx.u.pointer` | 5 |
| `src/ui/shell.js`, `src/ui/strings.vi.js`, `index.html`, `src/styles/shell.css`, `src/engine/boot.js` | gợi ý `[data-hint]` và lời mời "{n} lớp" | 6 |
| `src/engine/gpu/breath.js`, `src/engine/gpu/stage.js`, `src/engine/gpu/run.js` | camera thở, `u.pointer`, tải content, hàng đợi cử chỉ → `setup.onGesture` | 7 |
| `src/engine/gpu/debug.js`, `package.json`, `src/engine/gpu/run.js`, `e2e/painting.spec.js` | `?debug` Inspector, `?debug=stats` stats-gl | 8 |
| `src/paintings/ao-sen-dem/{shared,content.vi,index,painting}.js`, `tests/helpers/fake-ctx.js` | `setup()` của Bức 1, gợi ý, bộ dựng bức trong Node cho test | 9 |
| `src/paintings/ao-sen-dem/layers/l1-cot.js`, `parts/cot-{leaf,flower,reeds}.js`, `meta.js`, `painting.js` (camera) | Cốt hoàn chỉnh: lá nổi/đứng, hoa nở bằng uniform, cuống, lau; bố cục camera | 10 |
| `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `parts/anh-trang-{moon,paint}.js` | lớp 2 Ánh trăng | 11 |
| `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js` | Mặt nước hoàn chỉnh | 12 |
| `src/paintings/ao-sen-dem/layers/l5-vang-la.js` | Vàng lá bản đơn giản | 13 |
| `e2e/ao-sen-dem.spec.js` | chạm mặt nước, gợi ý → lời mời, chữ tải hỏng | 14 |
| `.github/workflows/deploy.yml`, `playwright.config.js` | thử sửa WebGPU e2e trên ubuntu; dọn CI | 15 |
| `README.md`, `CLAUDE.md`, spec | ghi lại GĐ 1 | 16 |
| (GitHub) | merge, deploy, kiểm URL, kiểm trên máy thật | 17 |

**Không làm trong GĐ 1** (spec §14 xếp vào GĐ sau; ghi ở đây để khỏi làm lố):
- Núm `js`/`rebuild` và `onKnob` (GĐ 2). GĐ 1 chỉ khai báo núm `uniform`. Các núm `js`/`rebuild` mà spec §6 liệt kê để sang GĐ 2, cùng lúc với `onKnob`: `leafCount`, `seed`, `sizeVariance`, `cupAmount`, `wireframe`, `flatShading` (lớp 1); `candleIntensity`, `shadowMapSize`, `shadowBias` (lớp 2); `reflectionResolution` (lớp 4); `count` (lớp 5).
- Thí nghiệm "Phá", Sổ tay, thanh lớp, `sma.expose()` (GĐ 2). Wrap lighting của lớp 2 (spec §6 L2) đi cùng thí nghiệm "Tắt fresnel" ở GĐ 2. Thanh giờ (Dial) và `ui/dials.js` (GĐ 4): GĐ 1 chỉ có uniform giờ và giờ mặc định.
- Vòm trời, sương, curl-noise cho đom đóm, biến thể CPU, `quality.js` của bức, phản chiếu giả ở mức thấp, bỏ compute khi trọng số 0 (GĐ 3).

---
### Task 1: Chuẩn bị máy, nhánh, và vệ sinh test

**Mục tiêu:** Có Node 24 và Chromium của Playwright; tạo nhánh; sửa hai test có thể "đúng rỗng" mà review GĐ 0 đã ghi lại; thêm `aria-live` cho ô giải thích huy hiệu.

**Files:**
- Modify: `tests/paintings/html.test.js` (hàm `svgColors` + tự kiểm; `aria-live` của `[data-badge-note]`)
- Modify: `index.html:31`, `tests/helpers/page.js:8` (`aria-live="polite"` cho `[data-badge-note]`)
- Modify: `e2e/painting.spec.js` (hàm `threeChunk()`; kiểm "không tải chunk three" dựa trên tên file thật)

**Interfaces:**
- Consumes: —
- Produces: `tests/paintings/html.test.js` có hàm nội bộ `svgColors(svg) → Set<string>` (mã hex viết hoa). `e2e/painting.spec.js` có hàm nội bộ `threeChunk() → string | null` (đọc `dist/assets/`). Task 4 và Task 6 sửa tiếp `html.test.js`, `index.html`, `page.js`.

- [ ] **Step 0: Node 24, Chromium, nhánh (điều kiện trước)**

```bash
node -v
```
Expected: `v24.x.y`. Nếu không phải (máy của Bao đang có Node 20 và chưa có fnm), dùng Node 24 portable trong thư mục tạm, KHÔNG sửa `~/.zshrc` (thay `<tmp>` bằng thư mục tạm của phiên, ví dụ scratchpad):

```bash
curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz | tar -xz -C <tmp>
export PATH=<tmp>/node-v24.21.0-darwin-arm64/bin:$PATH
node -v   # v24.21.0
```
Từ đây, mọi lệnh `node`/`npm`/`npx` trong kế hoạch chạy với `PATH` này. Rồi:

```bash
npm ci
npx playwright install chromium
git switch main && git pull --ff-only
git switch -c gd1-ao-sen-dau-tien
git config user.email   # phải ra giabao261096@gmail.com
git add docs/superpowers/plans/2026-09-28-gd1-ao-sen-dau-tien.md
git commit -m "docs: kế hoạch GĐ 1 · Ao sen đầu tiên

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
npm test
```
Expected: `npm test` xanh, `Tests  313 passed (313)`. (Kế hoạch này là commit đầu tiên của nhánh.)

- [ ] **Step 1: Viết test tự kiểm cho `svgColors` (chưa có hàm → hỏng)**

Trong `tests/paintings/html.test.js`, ngay sau dòng `const nfc = (s) => s.normalize('NFC').trim();`, thêm:

```js

describe('svgColors (tự kiểm)', () => {
  it('bắt màu thật, bỏ qua tham chiếu id', () => {
    expect([...svgColors('<rect fill="#bed"/><use href="#bed"/><rect fill="url(#bed)"/>')]).toEqual(['#BED']);
    expect([...svgColors('<use href="#face"/><path fill="url(#cafe)"/>')]).toEqual([]);
  });
});
```

Và trong test `'có đủ các ô mà xưởng điền vào…'`, ngay sau dòng `expect($('[data-badge-note]')?.hidden).toBe(true);`, thêm:

```js
      expect($('[data-badge-note]').getAttribute('aria-live')).toBe('polite');
```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npx vitest run tests/paintings/html.test.js`
Expected: FAIL: `ReferenceError: svgColors is not defined` và `expected null to be 'polite'`.

- [ ] **Step 3: Viết `svgColors`, dùng nó trong test màu poster; thêm `aria-live`**

Trong `tests/paintings/html.test.js`, ngay trên `describe('svgColors (tự kiểm)'`, thêm:

```js
/**
 * Mã màu hex trong một SVG. Bỏ các tham chiếu id trước (url(#bed), href="#bed"): id như "bed", "face"
 * trông giống mã màu 3 chữ số hex nhưng không phải màu.
 */
function svgColors(svg) {
  const text = svg.replace(/url\(#[^)]*\)/g, '').replace(/href="#[^"]*"/g, '');
  return new Set((text.match(/#[0-9A-Fa-f]{3,8}\b/g) ?? []).map((h) => h.toUpperCase()));
}
```

Thay thân test `'poster SVG chỉ dùng màu của bảng sơn mài (đã ghép meta.palette)'` bằng:

```js
    it('poster SVG chỉ dùng màu của bảng sơn mài (đã ghép meta.palette)', () => {
      if (!meta.poster.src.endsWith('.svg')) return;
      const svg = readFileSync(ROOT + 'public' + meta.poster.src, 'utf8');
      const allowed = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));
      expect([...svgColors(svg)].filter((h) => !allowed.has(h))).toEqual([]);
    });
```

Trong `index.html` và `tests/helpers/page.js`, đổi `<p id="badge-note" data-badge-note hidden></p>` thành:

```html
<p id="badge-note" data-badge-note hidden aria-live="polite"></p>
```
(ô này đổi chữ khi chạm huy hiệu; `aria-live` để trình đọc màn hình đọc lời giải thích mới.)

- [ ] **Step 4: Chạy lại**

Run: `npm test`
Expected: PASS, `Tests  314 passed (314)`.

- [ ] **Step 5: Kiểm "không tải chunk three" không thể đúng rỗng**

Regex cũ `/\/three-[\w-]+\.js/` sẽ lặng lẽ qua nếu một ngày chunk đổi tên. Đọc tên thật từ `dist/assets/` và khẳng định nó tồn tại. Trong `e2e/painting.spec.js`:

Thêm dòng import đầu file (trên `import { test, expect } …`):

```js
import { readdirSync } from 'node:fs';
```

Ngay trên `let log;`, thêm:

```js
/**
 * Tên file chunk three trong bản build (dist/assets/three-<hash>.js). Đọc từ đĩa để kiểm "không tải three"
 * không thể đúng rỗng: nếu đổi cách đặt tên chunk mà không ai để ý, test báo ngay thay vì lặng lẽ qua.
 */
function threeChunk() {
  const files = readdirSync(new URL('../dist/assets/', import.meta.url));
  return files.find((f) => /^three-[\w-]+\.js$/.test(f)) ?? null;
}

```

Thay dòng `expect(requests.filter((url) => /\/three-[\w-]+\.js/.test(url))).toEqual([]);` bằng:

```js
      const chunk = threeChunk();
      expect(chunk, 'dist/assets không có three-*.js: kiểm này sẽ đúng rỗng').toBeTruthy();
      expect(requests.filter((url) => url.endsWith(`/${chunk}`))).toEqual([]);
```

- [ ] **Step 6: Chạy e2e tĩnh**

Run: `npm run build && npx playwright test --project=static`
Expected: PASS (các test 3D tự bỏ qua ở project này). Tự kiểm một lần rồi hoàn lại: tạm đổi regex trong `threeChunk()` thành `/^khong-co-[\w-]+\.js$/`, chạy lại, thấy test `?static → …` hỏng với thông điệp `kiểm này sẽ đúng rỗng`; hoàn lại regex đúng.

- [ ] **Step 7: Commit**

```bash
git add tests/paintings/html.test.js tests/helpers/page.js index.html e2e/painting.spec.js
git commit -m "test: màu poster bỏ qua id SVG, kiểm không tải three dựa trên tên chunk thật, aria-live cho ghi chú huy hiệu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 2: Tầng tĩnh `timeout` có lời riêng; con dấu kiểm can/chi; dò tầng không bao giờ ném ra ngoài

**Mục tiêu:** Ba mục hoãn từ review GĐ 0.
- Khởi động quá 10 giây gần như luôn do mạng chậm hoặc máy bận, không phải lỗi. Người xem cần lời riêng và nút "Tải lại", không phải "Cảnh 3D gặp lỗi". Đây là sửa đổi spec §9 (Step 5).
- `formatSeal` in `undefined` lên con dấu nếu can/chi sai.
- `envFromWindow(win)` chạy ngoài `.catch` trong `boot.js`: đọc `window` mà ném lỗi thì boot ném ra ngoài và trang kẹt ở `detecting`.

**Files:**
- Modify: `src/ui/strings.vi.js` (`static.timeout`, kiểm can/chi trong `formatSeal`)
- Modify: `src/engine/static.js` (`staticNote('timeout')`, `NAMED_REASONS`)
- Modify: `src/engine/boot.js:28` (dò tầng trong `try`)
- Modify: `tests/unit/static.test.js`, `tests/unit/strings.test.js`, `tests/unit/boot.test.js`
- Modify: `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md` (§9)

**Interfaces:**
- Consumes: —
- Produces: `t.static.timeout: string`. `staticNote('timeout', t) → { text: t.static.timeout, reload: true }`. `formatSeal` ném `RangeError` khi `can ∉ 0..9` hoặc `chi ∉ 0..11`.

- [ ] **Step 1: Viết test hỏng**

`tests/unit/static.test.js`, trong `it('chữ theo lý do; …')` thay đoạn:

```js
    expect(staticNote('chunk-load', t)).toEqual({ text: t.static.chunkLoad, reload: true });
    for (const reason of ['timeout', 'frame-errors', 'gpu-error', 'device-lost', 'error']) {
```
bằng:
```js
    expect(staticNote('chunk-load', t)).toEqual({ text: t.static.chunkLoad, reload: true });
    expect(staticNote('timeout', t)).toEqual({ text: t.static.timeout, reload: true });
    for (const reason of ['frame-errors', 'gpu-error', 'device-lost', 'error']) {
```

Thay cả test `'lỗi runtime, không ?debug: báo lỗi kèm gợi ý ?debug, không in chi tiết'` bằng hai test:

```js
  it("'timeout': mạng chậm, kèm nút tải lại, không gợi ý ?debug", () => {
    showStatic(entry, shell, { reason: 'timeout', error: new Error('quá hạn'), t, sma });
    expect(page.note.querySelector('p').textContent).toBe(t.static.timeout);
    expect(page.note.querySelector('button').textContent).toBe(t.static.reload);
    expect(sma).toMatchObject({ reason: 'timeout', error: 'quá hạn' });
  });

  it('lỗi runtime, không ?debug: báo lỗi kèm gợi ý ?debug, không in chi tiết', () => {
    showStatic(entry, shell, { reason: 'frame-errors', error: new Error('3 khung lỗi'), t, sma });
    expect(page.note.querySelector('p').textContent).toBe(`${t.static.error} ${t.static.debugHint}`);
    expect(page.note.querySelector('pre')).toBeNull();
    expect(sma).toMatchObject({ reason: 'frame-errors', error: '3 khung lỗi' });
  });
```

`tests/unit/strings.test.js`: trong `it('chữ của tầng tĩnh theo từng lý do')`, sau dòng `expect(t.static.chunkLoad)…`, thêm:
```js
    expect(t.static.timeout).toContain('Mạng chậm');
```
và sau test `'tháng ngoài 1..12 thì ném RangeError …'`, thêm:
```js

  it('can ngoài 0..9 hoặc chi ngoài 0..11 cũng ném RangeError (không in "undefined" lên con dấu)', () => {
    expect(() => formatSeal({ day: 1, month: 1, leap: false, can: 10, chi: 0 })).toThrow(RangeError);
    expect(() => formatSeal({ day: 1, month: 1, leap: false, can: 0, chi: 12 })).toThrow(RangeError);
    expect(() => formatSeal({ day: 1, month: 1, leap: false, can: -1, chi: 0 })).toThrow(RangeError);
  });
```

`tests/unit/boot.test.js`: ngay trước `it('(b) không có GPU → …'`, thêm:
```js
  it('(b2) đọc window ném lỗi (trình duyệt lạ, extension chặn) → vẫn về tầng tĩnh, không ném ra ngoài', async () => {
    const win = fakeWin();
    Object.defineProperty(win, 'navigator', { get() { throw new Error('bị chặn'); } });
    const loadRun = vi.fn();
    await boot(entry, { t, win, doc, loadRun });
    expect(loadRun).not.toHaveBeenCalled();
    expect(win.__sma).toMatchObject({ state: 'static', tier: 'static', reason: 'no-gpu' });
  });

```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npx vitest run tests/unit/static.test.js tests/unit/strings.test.js tests/unit/boot.test.js`
Expected: FAIL ở 4 chỗ: `t.static.timeout` là `undefined`; `formatSeal` không ném với can 10; `(b2)` ném `Error: bị chặn`.

- [ ] **Step 3: Sửa code**

`src/ui/strings.vi.js`, trong `formatSeal`, ngay sau khối kiểm tháng (`throw new RangeError(\`Tháng âm không hợp lệ…\`)` và dấu `}` của nó), thêm:
```js
  if (!Number.isInteger(can) || can < 0 || can > 9 || !Number.isInteger(chi) || chi < 0 || chi > 11) {
    throw new RangeError(`Can chi không hợp lệ: can ${can}, chi ${chi}`);
  }
```
và trong `static: { … }`, ngay sau dòng `chunkLoad: …`, thêm:
```js
    timeout: 'Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.',
```

`src/engine/static.js`: đổi `const NAMED_REASONS = ['flag', 'no-gpu', 'chunk-load'];` thành
```js
const NAMED_REASONS = ['flag', 'no-gpu', 'chunk-load', 'timeout'];
```
và ngay sau dòng `if (reason === 'chunk-load') …` trong `staticNote`, thêm:
```js
  // Quá hạn 10 giây thường là mạng chậm hoặc máy đang bận: tải lại hay được, nên có nút.
  if (reason === 'timeout') return { text: t.static.timeout, reload: true };
```

`src/engine/boot.js`: thay dòng
```js
  const tier = await detectTier(flags, envFromWindow(win)).catch(() => 'static');
```
bằng:
```js
  // Dò tầng không bao giờ được làm trắng trang: lỗi bất ngờ, kể cả lúc đọc window, đều về tầng tĩnh.
  let tier = 'static';
  try {
    tier = await detectTier(flags, envFromWindow(win));
  } catch {
    // giữ 'static'
  }
```

- [ ] **Step 4: Chạy lại**

Run: `npm test`
Expected: PASS, `Tests  317 passed (317)`.

- [ ] **Step 5: Sửa spec §9 (lời của tầng tĩnh)**

Trong `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`, mục "Tranh tĩnh (tầng C)…", danh sách "Thêm theo lý do", ngay sau dòng `'chunk-load'`, thêm:
```markdown
  - `'timeout'` (GĐ 1): "Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.", kèm nút tải lại. Không gợi ý `?debug`, vì quá hạn thường không phải lỗi.
```

- [ ] **Step 6: Commit**

```bash
git add src/ui/strings.vi.js src/engine/static.js src/engine/boot.js tests/unit/static.test.js tests/unit/strings.test.js tests/unit/boot.test.js docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -m "feat(static): lý do timeout có lời riêng và nút tải lại; con dấu kiểm can chi; dò tầng không ném ra ngoài

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Hộp màu `lib/tsl/noise.js` (fbm)

**Mục tiêu:** Hàm TSL dùng chung đầu tiên trong hộp màu. Lớp Ánh trăng (Task 11) dùng fbm cho vết biển tối trên trăng; GĐ 3 dùng cho sương và thêm `curl`. File nằm trong vùng hàng rào từ vựng, nên không có từ nào của bức.

**Files:**
- Create: `src/lib/tsl/noise.js`
- Test: `tests/unit/noise.test.js`

**Interfaces:**
- Consumes: `mx_noise_float`, `float` từ `three/tsl`.
- Produces: `fbm(p, { octaves = 4, lacunarity = 2, gain = 0.5 } = {}) → node float` (≈ [−1, 1]); ném `RangeError` khi `octaves` không nguyên hoặc ngoài 1–5.

- [ ] **Step 1: Viết test**

`tests/unit/noise.test.js`:
```js
// tests/unit/noise.test.js — lib/tsl/noise.js: fbm dựng được đồ thị node trong Node, kiểm số tầng.
import { describe, it, expect } from 'vitest';
import { vec3 } from 'three/tsl';
import { fbm } from '../../src/lib/tsl/noise.js';

describe('fbm', () => {
  it('trả về node float cho 1 đến 5 tầng', () => {
    for (let octaves = 1; octaves <= 5; octaves++) {
      const node = fbm(vec3(1, 2, 3), { octaves });
      expect(node.isNode).toBe(true);
    }
  });

  it('số tầng ngoài 1–5 hoặc không nguyên thì ném RangeError tiếng Việt', () => {
    for (const octaves of [0, 6, 2.5]) {
      expect(() => fbm(vec3(0), { octaves })).toThrow(/octaves phải là số nguyên từ 1 đến 5/);
    }
  });
});
```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npx vitest run tests/unit/noise.test.js`
Expected: FAIL: `Failed to load url ../../src/lib/tsl/noise.js`.

- [ ] **Step 3: Viết `src/lib/tsl/noise.js`**

```js
// lib/tsl/noise.js — hàm TSL dùng chung cho mọi bức: fbm (cộng nhiều tầng noise) dựng trên mx_noise_float của three.
import { float, mx_noise_float } from 'three/tsl';

/**
 * fbm ("fractal Brownian motion"): cộng nhiều tầng noise. Tầng sau có tần số gấp `lacunarity` lần
 * và biên độ nhân `gain`, nên có cả mảng lớn lẫn chi tiết nhỏ (vết biển trên trăng, sương, mây).
 *
 * `octaves` là số JS, không phải uniform: vòng lặp chạy lúc DỰNG đồ thị node, nên shader sinh ra
 * chỉ là một chuỗi phép cộng, không có vòng lặp. Đổi số tầng = dựng lại đồ thị (núm 'rebuild').
 *
 * @param {any} p  node vec3 (tọa độ lấy mẫu)
 * @param {{ octaves?: number, lacunarity?: number, gain?: number }} [options]
 * @returns {any}  node float, xấp xỉ trong [−1, 1]
 */
export function fbm(p, { octaves = 4, lacunarity = 2, gain = 0.5 } = {}) {
  if (!Number.isInteger(octaves) || octaves < 1 || octaves > 5) {
    throw new RangeError(`fbm: octaves phải là số nguyên từ 1 đến 5, nhận ${octaves}`);
  }
  let sum = float(0);
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    sum = sum.add(mx_noise_float(p.mul(frequency)).mul(amplitude));
    total += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return sum.div(total); // chia tổng biên độ: nhiều tầng hay ít tầng vẫn cùng khoảng giá trị
}
```

- [ ] **Step 4: Chạy lại**

Run: `npm test`
Expected: PASS, `Tests  319 passed (319)` (luật ranh giới cũng qua: `lib/tsl/` được import three).

- [ ] **Step 5: Commit**

```bash
git add src/lib/tsl/noise.js tests/unit/noise.test.js
git commit -m "feat(lib): fbm dùng chung trong lib/tsl/noise.js

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Trăng SVG đúng pha trong `[data-moon]`

**Mục tiêu:** Spec §4.1, §8.6, §9: trang nào có ô `<svg data-moon>` thì vỏ trang vẽ trăng đúng pha của "bây giờ" vào đó, ở mọi tầng (kể cả tranh tĩnh). Trăng nằm cạnh con dấu: con dấu ghi ngày âm, trăng cho thấy ngày đó trăng tròn khuyết ra sao. Bức nào không có trăng thì bỏ ô này; vỏ trang bỏ qua, không lỗi.

**Files:**
- Create: `src/ui/moon-svg.js`
- Modify: `src/ui/shell.js` (vẽ trăng lúc gắn vỏ)
- Modify: `index.html` (ô `[data-moon]` cạnh con dấu), `src/styles/shell.css`
- Modify: `tests/helpers/page.js`, `tests/unit/shell.test.js`, `tests/paintings/html.test.js`
- Create: `tests/unit/moon-svg.test.js`, `e2e/ao-sen-dem.spec.js` (phần tầng tĩnh; Task 14 viết tiếp)

**Interfaces:**
- Consumes: `moonPhase(date).phase` từ `src/lib/astro/moon.js` (0 trăng mới → π tròn → 2π).
- Produces: `moonPath(phase) → string` (thuộc tính `d`, đĩa bán kính 1, trục y hướng xuống); `drawMoon(svg, phase)` điền `<circle class="moon-dark">` + `<path class="moon-lit">`. `mountPage()` trả thêm `moon`.

- [ ] **Step 1: Test cho `moon-svg.js`**

`tests/unit/moon-svg.test.js`:
```js
// @vitest-environment jsdom
// tests/unit/moon-svg.test.js — trăng SVG đúng pha: hướng phần sáng, đường ranh sáng/tối, vẽ vào <svg data-moon>.
import { describe, it, expect } from 'vitest';
import { drawMoon, moonPath } from '../../src/ui/moon-svg.js';

/** Đọc lại hai cung của path: [sweep nửa vòng ngoài, bán trục ngang của đường ranh, sweep đường ranh]. */
function arcs(d) {
  const m = /^M0 -1A1 1 0 0 ([01]) 0 1A([\d.]+) 1 0 0 ([01]) 0 -1Z$/.exec(d);
  expect(m, d).not.toBeNull();
  return { outer: Number(m[1]), rx: Number(m[2]), inner: Number(m[3]) };
}

describe('moonPath', () => {
  it('trăng tròn (π): cả đĩa sáng; trăng mới (0): phần sáng không có diện tích', () => {
    // Cung ngoài đi từ trên xuống, đường ranh đi từ dưới lên: CÙNG cờ sweep nghĩa là hai cung ở hai phía.
    const full = arcs(moonPath(Math.PI));
    expect(full.rx).toBeCloseTo(1, 4);
    expect(full.outer).toBe(full.inner); // hai nửa vòng ở hai phía → đủ vòng tròn
    const dark = arcs(moonPath(0));
    expect(dark.rx).toBeCloseTo(1, 4);
    expect(dark.outer).not.toBe(dark.inner); // đường ranh quay về trùng nửa vòng ngoài → diện tích 0
  });

  it('thượng huyền (π/2) sáng nửa PHẢI, hạ huyền (3π/2) sáng nửa TRÁI, đường ranh thẳng', () => {
    const first = arcs(moonPath(Math.PI / 2));
    expect([first.outer, first.rx]).toEqual([1, 0]);
    const last = arcs(moonPath((3 * Math.PI) / 2));
    expect([last.outer, last.rx]).toEqual([0, 0]);
  });

  it('trăng khuyết: đường ranh lồi về phía sáng; trăng gần tròn: lồi về phía tối', () => {
    expect(arcs(moonPath(0.8)).inner).toBe(0); // lưỡi liềm đầu tháng
    expect(arcs(moonPath(2.4)).inner).toBe(1); // trăng già hơn nửa, đang lên
    expect(arcs(moonPath(4.0)).inner).toBe(0); // trăng hơn nửa, đang tàn
    expect(arcs(moonPath(5.6)).inner).toBe(1); // lưỡi liềm cuối tháng
  });

  it('pha ngoài [0, 2π) được quy về trong khoảng', () => {
    expect(moonPath(Math.PI / 2 + Math.PI * 2)).toBe(moonPath(Math.PI / 2));
    expect(moonPath(-Math.PI / 2)).toBe(moonPath((3 * Math.PI) / 2));
  });
});

describe('drawMoon', () => {
  it('vẽ một đĩa tối và phần sáng; gọi lại thì thay nội dung cũ', () => {
    document.body.innerHTML = '<svg data-moon viewBox="-1.1 -1.1 2.2 2.2"></svg>';
    const svg = document.querySelector('[data-moon]');
    drawMoon(svg, 1);
    drawMoon(svg, 2);
    expect([...svg.children].map((el) => el.getAttribute('class'))).toEqual(['moon-dark', 'moon-lit']);
    expect(svg.querySelector('path').getAttribute('d')).toBe(moonPath(2));
  });
});
```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npx vitest run tests/unit/moon-svg.test.js`
Expected: FAIL: không tải được `src/ui/moon-svg.js`.

- [ ] **Step 3: Viết `src/ui/moon-svg.js`**

```js
// ui/moon-svg.js — vẽ trăng đúng pha vào <svg data-moon> của trang (tầng nào cũng có); chỉ DOM + toán, không three.

const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;

/**
 * Đường viền phần SÁNG của đĩa trăng bán kính 1, tâm (0, 0), trục y hướng XUỐNG như SVG.
 * phase theo lib/astro/moon.js: 0 trăng mới → π trăng tròn → 2π.
 *
 * Phần sáng = nửa vòng tròn phía có nắng (trăng đang lên sáng bên PHẢI, trăng đang tàn sáng bên TRÁI)
 * ghép với đường ranh sáng/tối: nửa elip có bán trục ngang |cos(phase)|. Trăng khuyết (sáng < nửa)
 * thì đường ranh lồi về phía sáng; trăng gần tròn (sáng > nửa) thì lồi về phía tối.
 * Trong SVG, cờ sweep = 1 là đi theo chiều kim đồng hồ trên màn hình.
 * @param {number} phase
 * @returns {string}  thuộc tính d của <path>
 */
export function moonPath(phase) {
  const p = ((phase % TAU) + TAU) % TAU;
  const waxing = p < Math.PI;
  const gibbous = Math.cos(p) < 0;
  const rx = Math.abs(Math.cos(p)).toFixed(4);
  const outer = waxing ? 1 : 0; // trên → phải → dưới (1) hoặc trên → trái → dưới (0)
  const inner = waxing !== gibbous ? 0 : 1; // từ dưới quay về trên, qua phía nào
  return `M0 -1A1 1 0 0 ${outer} 0 1A${rx} 1 0 0 ${inner} 0 -1Z`;
}

/**
 * Điền <svg data-moon>: một đĩa tối (cả vầng trăng) và phần sáng đúng pha phủ lên trên.
 * Gọi lại thì thay hẳn nội dung cũ. Màu do CSS quyết (.moon-dark, .moon-lit).
 * @param {SVGSVGElement} svg
 * @param {number} phase
 */
export function drawMoon(svg, phase) {
  const doc = svg.ownerDocument;
  const disc = doc.createElementNS(NS, 'circle');
  disc.setAttribute('r', '1');
  disc.setAttribute('class', 'moon-dark');
  const lit = doc.createElementNS(NS, 'path');
  lit.setAttribute('d', moonPath(phase));
  lit.setAttribute('class', 'moon-lit');
  svg.replaceChildren(disc, lit);
}
```

Run: `npx vitest run tests/unit/moon-svg.test.js`
Expected: PASS (5 test).

- [ ] **Step 4: Test cho vỏ trang và HTML**

`tests/helpers/page.js`: trong `PAGE_BODY`, ngay sau dòng `<section data-static …></section>`, thêm:
```html
  <svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
```
và trong object trả về của `mountPage`, sau `note: $('[data-static]'),` thêm:
```js
    moon: $('[data-moon]'),
```

`tests/unit/shell.test.js`, thêm vào cuối file:
```js

describe('trăng SVG', () => {
  it('vẽ trăng đúng pha của "bây giờ" vào [data-moon] ngay lúc gắn vỏ', () => {
    mountShell(document, meta, { now: NOW, t });
    expect(page.moon.querySelector('.moon-lit')).not.toBeNull();
    expect(page.moon.querySelector('.moon-dark')).not.toBeNull();
  });

  it('trang không có [data-moon] (bức không có trăng) thì bỏ qua, không lỗi', () => {
    page.moon.remove();
    expect(() => mountShell(document, meta, { now: NOW, t })).not.toThrow();
  });
});
```

`tests/paintings/html.test.js`, ngay trước `it('favicon và stylesheet trỏ tới file có thật'`, thêm:
```js
    it('nếu có ô trăng [data-moon] thì là <svg> rỗng, viewBox bao đĩa bán kính 1, ẩn với trình đọc màn hình', () => {
      const moon = $('[data-moon]');
      if (!moon) return; // bức không có trăng thì bỏ ô này
      expect(moon.tagName.toLowerCase()).toBe('svg');
      expect(moon.getAttribute('viewBox')).toBe('-1.1 -1.1 2.2 2.2');
      expect(moon.getAttribute('aria-hidden')).toBe('true');
      expect(moon.childElementCount).toBe(0);
    });

```

Run: `npx vitest run tests/unit/shell.test.js tests/paintings/html.test.js`
Expected: FAIL ở test "vẽ trăng đúng pha…" (`.moon-lit` là `null`). Test HTML qua (tự bỏ qua) vì `index.html` chưa có ô trăng.

- [ ] **Step 5: Vẽ trăng trong vỏ trang, thêm ô vào trang**

`src/ui/shell.js`: thêm hai import (sau dòng import `lunar.js`, và sau dòng import `badge.js`):
```js
import { moonPhase } from '../lib/astro/moon.js';
```
```js
import { drawMoon } from './moon-svg.js';
```
Sau dòng `const note = $('[data-static]');`, thêm:
```js
  const moon = $('[data-moon]'); // trăng SVG đúng pha (bức nào không có trăng thì bỏ ô này đi)
```
Ngay sau dòng gán `$('[data-seal]').textContent = …`, thêm:
```js
  if (moon) drawMoon(moon, moonPhase(now).phase);
```

`index.html`: thay dòng `<span class="dau" data-seal></span>` bằng:
```html
        <div class="marks">
          <svg class="trang" data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
          <span class="dau" data-seal></span>
        </div>
```

`src/styles/shell.css`, thêm vào cuối file:
```css

/* ── Trăng đêm nay (ui/moon-svg.js vẽ) cạnh con dấu ─────────────────────────────── */
.marks { display: flex; align-items: flex-end; gap: 14px; margin-left: auto; }
.marks [data-seal] { margin-left: 0; }
[data-moon] { width: 40px; height: 40px; filter: drop-shadow(0 0 8px color-mix(in srgb, var(--vang-la-sang) 35%, transparent)); }
[data-moon]:empty { display: none; }
.moon-dark { fill: color-mix(in srgb, var(--cham) 80%, var(--den-then)); }
.moon-lit { fill: var(--nga); }
```

- [ ] **Step 6: Chạy lại toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  327 passed (327)`. (Luật đường nhẹ vẫn qua: `ui/shell.js` → `lib/astro/moon.js` nằm trong danh sách cho phép.)

- [ ] **Step 7: E2E tầng tĩnh cho trăng**

`e2e/ao-sen-dem.spec.js` (Task 14 sẽ thay bằng bản đầy đủ):
```js
// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm mặt nước thì ảnh đổi; gợi ý → lời mời; trăng SVG ở tầng tĩnh.
import { test, expect } from '@playwright/test';
import { waitForSettled } from './helpers.js';

const AT = 'at=2026-09-28T21:00';

test.describe('Ao Sen Đêm · tầng tĩnh', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
  });

  test('?static&at=… → trăng SVG đúng pha đêm 18 tháng Tám (trăng tàn, sáng bên trái)', async ({ page }) => {
    await page.goto(`./?static&${AT}`);
    await waitForSettled(page);
    const d = await page.locator('[data-moon] .moon-lit').getAttribute('d');
    // Sau rằm: nửa vòng ngoài đi qua bên TRÁI (sweep 0), phần sáng lớn hơn nửa đĩa.
    expect(d).toMatch(/^M0 -1A1 1 0 0 0 0 1A/);
    await expect(page.locator('[data-moon]')).toBeVisible();
  });
});
```

Run: `npm run build && npx playwright test --project=static`
Expected: PASS. Mở `?static` bằng `npm run dev` (http://localhost:5173/son-mai-anh-sang/?static&at=2026-09-28T21:00) và nhìn: trăng ngà nhỏ cạnh con dấu, sáng bên trái, khuyết một mảnh bên phải; trên màn hẹp 390px thơ, trăng và con dấu không đè lên nhau.

- [ ] **Step 8: Commit**

```bash
git add src/ui/moon-svg.js src/ui/shell.js index.html src/styles/shell.css tests/helpers/page.js tests/unit/moon-svg.test.js tests/unit/shell.test.js tests/paintings/html.test.js e2e/ao-sen-dem.spec.js
git commit -m "feat(ui): trăng SVG đúng pha cạnh con dấu, ở mọi tầng

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Cử chỉ: `gesture.js` (thuần) và `input.js` (DOM, tia, `ctx.u.pointer`)

**Mục tiêu:** Spec §4.2, §8.4 (`Gesture`), §8.6: con trỏ trên canvas thành cử chỉ `tap | hold-start | hold-move | hold-end | swipe`, mỗi cử chỉ có NDC và một tia (`THREE.Ray`) từ camera; kéo (`drag`) để dành cho camera (OrbitControls tự nghe). Tách hai file để phần phân loại test được như hàm thuần. Có hai sửa cho Review Focus #1 và #2.

**Files:**
- Create: `src/engine/gpu/gesture.js`, `src/engine/gpu/input.js`
- Test: `tests/unit/gesture.test.js`, `tests/unit/input.test.js`

**Interfaces:**
- Consumes: `Raycaster`, `Vector2` từ `three/webgpu`.
- Produces:
  - `GESTURE = { tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300 }`.
  - `createGestureTracker(options?)` → `{ state, down(p), move(p), poll(t), up(p), cancel() }`; `p = { id, x, y, t }` (px, ms); mỗi hàm trả mảng `{ kind, x, y, velocity? }`.
  - `createInput({ canvas, camera, controls?, pointer, win? })` → `{ drain(): Gesture[], onFirst(fn), dispose() }`. `Gesture = { kind, ndc: { x, y }, ray: THREE.Ray, velocity? }` (velocity: NDC mỗi giây). `pointer` là uniform `vec2` (sẽ là `ctx.u.pointer`, Task 7). Đang "giữ" thì `controls.enabled = false`.

- [ ] **Step 1: Test phân loại cử chỉ**

`tests/unit/gesture.test.js`:
```js
// tests/unit/gesture.test.js — phân loại cử chỉ: chạm, giữ, vuốt, kéo (của camera), hai ngón.
import { describe, it, expect } from 'vitest';
import { GESTURE, createGestureTracker } from '../../src/engine/gpu/gesture.js';

const p = (x, y, t, id = 1) => ({ id, x, y, t });
const kinds = (events) => events.map((e) => e.kind);

describe('createGestureTracker', () => {
  it('chạm: xuống rồi lên nhanh, gần như không lệch → tap tại điểm chạm xuống', () => {
    const g = createGestureTracker();
    expect(g.down(p(100, 100, 0))).toEqual([]);
    expect(g.move(p(103, 102, 50))).toEqual([]);
    expect(g.up(p(103, 102, 120))).toEqual([{ kind: 'tap', x: 100, y: 100 }]);
    expect(g.state).toBe('idle');
  });

  it('giữ: đủ holdMs mà chưa lệch → hold-start; di → hold-move; thả → hold-end', () => {
    const g = createGestureTracker();
    g.down(p(10, 10, 0));
    expect(g.poll(GESTURE.holdMs - 1)).toEqual([]);
    expect(g.poll(GESTURE.holdMs)).toEqual([{ kind: 'hold-start', x: 10, y: 10 }]);
    expect(g.poll(GESTURE.holdMs + 100)).toEqual([]); // chỉ bắt đầu một lần
    expect(g.move(p(40, 60, 500))).toEqual([{ kind: 'hold-move', x: 40, y: 60 }]);
    expect(g.up(p(40, 60, 700))).toEqual([{ kind: 'hold-end', x: 40, y: 60 }]);
  });

  it('kéo (lệch quá tapPx) là của camera: không phát cử chỉ nào, cũng không thành giữ', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0));
    expect(g.move(p(GESTURE.tapPx + 1, 0, 100))).toEqual([]);
    expect(g.state).toBe('drag');
    expect(g.poll(1000)).toEqual([]);
    expect(g.up(p(200, 0, 1500))).toEqual([]);
  });

  it('vuốt: kéo nhanh và đủ xa → swipe kèm vận tốc (px/giây)', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0));
    g.move(p(30, 0, 50));
    const [swipe] = g.up(p(100, -50, 200));
    expect(swipe).toEqual({ kind: 'swipe', x: 100, y: -50, velocity: { x: 500, y: -250 } });
  });

  it('ngón thứ hai chạm xuống (chụm để zoom) thì hủy; đang giữ thì kết thúc giữ', () => {
    const g = createGestureTracker();
    g.down(p(0, 0, 0, 1));
    expect(g.down(p(50, 50, 10, 2))).toEqual([]);
    expect(g.up(p(0, 0, 100, 1))).toEqual([]); // không thành tap
    expect(g.up(p(50, 50, 120, 2))).toEqual([]);
    expect(g.state).toBe('idle');

    g.down(p(0, 0, 1000, 1));
    g.poll(1000 + GESTURE.holdMs);
    expect(kinds(g.down(p(9, 9, 1500, 2)))).toEqual(['hold-end']);
  });

  it('cancel (mất con trỏ) giữa lúc giữ → hold-end; lúc khác → không gì', () => {
    const g = createGestureTracker();
    g.down(p(5, 5, 0));
    expect(g.cancel()).toEqual([]);
    g.down(p(5, 5, 100));
    g.poll(100 + GESTURE.holdMs);
    expect(kinds(g.cancel())).toEqual(['hold-end']);
    expect(g.state).toBe('idle');
  });

  it('ngưỡng tùy chỉnh được', () => {
    const g = createGestureTracker({ holdMs: 50 });
    g.down(p(0, 0, 0));
    expect(kinds(g.poll(50))).toEqual(['hold-start']);
  });
});
```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npx vitest run tests/unit/gesture.test.js`
Expected: FAIL: không tải được `src/engine/gpu/gesture.js`.

- [ ] **Step 3: Viết `src/engine/gpu/gesture.js`**

```js
// engine/gpu/gesture.js — phân loại thao tác con trỏ thành cử chỉ: chạm, giữ (bắt đầu / di / thả), vuốt, kéo. Hàm thuần.

/** Ngưỡng mặc định: lệch quá tapPx là "kéo" (camera); giữ yên quá holdMs là "giữ"; kéo nhanh và xa là "vuốt". */
export const GESTURE = Object.freeze({ tapPx: 8, holdMs: 350, swipePx: 40, swipeMs: 300 });

/**
 * Máy trạng thái cho MỘT ngón (hoặc chuột). Không biết DOM hay three: nhận tọa độ màn hình (px)
 * và thời điểm (ms), trả mảng cử chỉ vừa sinh ra. input.js đổi tọa độ sang NDC và thêm tia.
 *
 *   idle ─down→ pending ─(lệch > tapPx)→ drag ─up→ (nhanh + xa: 'swipe') → idle
 *                 │ └─up (trước holdMs)→ 'tap' → idle
 *                 └─poll (≥ holdMs, chưa lệch)→ 'hold-start' → hold ─move→ 'hold-move' ─up→ 'hold-end'
 * Ngón thứ hai chạm xuống (chụm hai ngón = zoom camera) thì hủy: đang giữ thì phát 'hold-end'.
 * 'drag' không phát ra ngoài: kéo là của camera (OrbitControls tự nghe).
 *
 * @param {Partial<typeof GESTURE>} [options]
 */
export function createGestureTracker(options = {}) {
  const { tapPx, holdMs, swipePx, swipeMs } = { ...GESTURE, ...options };
  let state = 'idle';
  let start = null; // { id, x, y, t } lúc chạm xuống
  const pointers = new Set();

  const moved = (p) => Math.hypot(p.x - start.x, p.y - start.y);
  const at = (kind, p, extra = {}) => ({ kind, x: p.x, y: p.y, ...extra });

  return {
    get state() {
      return state;
    },

    /** @param {{ id: number, x: number, y: number, t: number }} p */
    down(p) {
      pointers.add(p.id);
      if (pointers.size > 1) {
        const out = state === 'hold' ? [at('hold-end', p)] : [];
        state = 'multi';
        return out;
      }
      state = 'pending';
      start = p;
      return [];
    },

    move(p) {
      if (!start || p.id !== start.id) return [];
      if (state === 'pending' && moved(p) > tapPx) state = 'drag';
      if (state === 'hold') return [at('hold-move', p)];
      return [];
    },

    /** Gọi định kỳ (setTimeout sau holdMs, hoặc mỗi lần move): đủ lâu mà chưa lệch thì thành "giữ". */
    poll(t) {
      if (state === 'pending' && t - start.t >= holdMs) {
        state = 'hold';
        return [at('hold-start', start)];
      }
      return [];
    },

    up(p) {
      pointers.delete(p.id);
      if (!start || p.id !== start.id) {
        if (pointers.size === 0) state = 'idle';
        return [];
      }
      let out = [];
      if (state === 'hold') out = [at('hold-end', p)];
      else if (state === 'pending') out = [at('tap', start)];
      else if (state === 'drag') {
        const dt = p.t - start.t;
        if (dt > 0 && dt <= swipeMs && moved(p) >= swipePx) {
          out = [at('swipe', p, { velocity: { x: ((p.x - start.x) / dt) * 1000, y: ((p.y - start.y) / dt) * 1000 } })];
        }
      }
      start = null;
      state = pointers.size === 0 ? 'idle' : 'multi';
      return out;
    },

    /** Mất con trỏ (pointercancel, rời trang): bỏ cử chỉ dở dang; đang giữ thì phát 'hold-end'. */
    cancel() {
      const out = state === 'hold' && start ? [at('hold-end', start)] : [];
      pointers.clear();
      start = null;
      state = 'idle';
      return out;
    },
  };
}
```

Run: `npx vitest run tests/unit/gesture.test.js`
Expected: PASS (7 test).

- [ ] **Step 4: Test nối DOM (Node thuần: `EventTarget` + `Event` có sẵn trong Node 24)**

`tests/unit/input.test.js`:
```js
// tests/unit/input.test.js — con trỏ → hàng đợi cử chỉ có NDC + tia; ctx.u.pointer; camera đứng yên khi giữ tay.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerspectiveCamera, Vector2 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { GESTURE } from '../../src/engine/gpu/gesture.js';
import { createInput } from '../../src/engine/gpu/input.js';

/** Canvas giả 200 × 100 ở góc trang: EventTarget thật của Node + kích thước. */
function fakeCanvas() {
  const canvas = new EventTarget();
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 });
  return canvas;
}
/** PointerEvent tối thiểu: Event thật, thêm các trường input.js đọc. */
const pointer = (type, x, y, extra = {}) => Object.assign(new Event(type), { clientX: x, clientY: y, pointerId: 1, button: 0, ...extra });

let canvas;
let camera;
let controls;
let u;
let input;
let clock;
let win;
beforeEach(() => {
  vi.useFakeTimers();
  clock = 0;
  canvas = fakeCanvas();
  camera = new PerspectiveCamera(45, 2, 0.1, 100);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  controls = { enabled: true };
  u = uniform(new Vector2());
  win = Object.assign(new EventTarget(), { performance: { now: () => clock }, setTimeout, clearTimeout });
  input = createInput({ canvas, camera, controls, pointer: u, win });
});
afterEach(() => {
  input.dispose();
  vi.useRealTimers();
});

describe('createInput', () => {
  it('chạm giữa canvas → tap ở NDC (0, 0), tia đi từ camera về phía trước', () => {
    canvas.dispatchEvent(pointer('pointerdown', 100, 50));
    clock = 80;
    canvas.dispatchEvent(pointer('pointerup', 100, 50));
    const [g] = input.drain();
    expect(g.kind).toBe('tap');
    expect(g.ndc).toEqual({ x: 0, y: 0 });
    expect(g.ray.origin.toArray()).toEqual([0, 5, 10]);
    const dir = camera.getWorldDirection(g.ray.direction.clone());
    expect(g.ray.direction.dot(dir)).toBeCloseTo(1, 6);
    expect(input.drain()).toEqual([]); // hàng đợi rỗng sau khi lấy
  });

  it('pointermove cập nhật ctx.u.pointer (NDC), kể cả khi chỉ rê chuột', () => {
    canvas.dispatchEvent(pointer('pointermove', 200, 0));
    expect(u.value.toArray()).toEqual([1, 1]);
  });

  it('giữ yên holdMs → hold-start và camera đứng yên; thả → hold-end, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    expect(controls.enabled).toBe(false);
    canvas.dispatchEvent(pointer('pointermove', 60, 50));
    canvas.dispatchEvent(pointer('pointerup', 60, 50));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-move', 'hold-end']);
    expect(controls.enabled).toBe(true);
  });

  it('onFirst: gọi đúng một lần ở lần chạm đầu tiên', () => {
    const first = vi.fn();
    input.onFirst(first);
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    canvas.dispatchEvent(pointer('pointerup', 1, 1));
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    expect(first).toHaveBeenCalledTimes(1);
  });

  it('nhấn giữ trên điện thoại không mở menu ngữ cảnh', () => {
    const menu = new Event('contextmenu', { cancelable: true });
    canvas.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
  });

  it('rời trang giữa lúc giữ (blur, pointercancel) → hold-end, camera chạy lại', () => {
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock = GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    win.dispatchEvent(new Event('blur'));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end']);
    expect(controls.enabled).toBe(true);
    canvas.dispatchEvent(pointer('pointerdown', 50, 50));
    clock += GESTURE.holdMs;
    vi.advanceTimersByTime(GESTURE.holdMs);
    canvas.dispatchEvent(pointer('pointercancel', 50, 50));
    expect(input.drain().map((g) => g.kind)).toEqual(['hold-start', 'hold-end']);
  });

  it('bỏ qua nút phụ của chuột; dispose gỡ listener', () => {
    canvas.dispatchEvent(pointer('pointerdown', 1, 1, { button: 2 }));
    canvas.dispatchEvent(pointer('pointerup', 1, 1, { button: 2 }));
    expect(input.drain()).toEqual([]);
    input.dispose();
    canvas.dispatchEvent(pointer('pointerdown', 1, 1));
    canvas.dispatchEvent(pointer('pointerup', 1, 1));
    expect(input.drain()).toEqual([]);
  });
});
```

Run: `npx vitest run tests/unit/input.test.js`
Expected: FAIL: không tải được `src/engine/gpu/input.js`.

- [ ] **Step 5: Viết `src/engine/gpu/input.js`**

```js
// engine/gpu/input.js — con trỏ trên canvas → cử chỉ có NDC và tia (Raycaster), cập nhật ctx.u.pointer; kéo để dành cho camera.
import { Raycaster, Vector2 } from 'three/webgpu';
import { GESTURE, createGestureTracker } from './gesture.js';

/**
 * Nghe pointer events trên canvas, phân loại bằng gesture.js, rồi xếp cử chỉ vào HÀNG ĐỢI.
 * run.js lấy hàng đợi ra ở đầu mỗi khung (drain), nên cử chỉ được xử lý TRONG khung:
 * có lưới bắt lỗi của khung, và thời điểm của gợn sóng khớp đồng hồ (kể cả ?freeze).
 * @param {{ canvas: any, camera: any, controls?: any, pointer: any, win?: any }} opts
 *   pointer: uniform vec2 (ctx.u.pointer), NDC của con trỏ, cho shader nào cần.
 * @returns {{ drain: () => object[], onFirst: (fn: () => void) => void, dispose: () => void }}
 */
export function createInput({ canvas, camera, controls = null, pointer, win = window }) {
  const tracker = createGestureTracker();
  const raycaster = new Raycaster();
  const queue = [];
  let first = null; // hàm gọi một lần ở lần chạm đầu tiên (shell hiện lời mời)
  let holdTimer = null;

  const ndcOf = (x, y) => {
    const r = canvas.getBoundingClientRect();
    return new Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  };

  /** Mỗi cử chỉ kèm NDC và một tia từ camera qua điểm chạm; bức tự giao tia với mặt phẳng của nó. */
  const emit = (events) => {
    for (const e of events) {
      const ndc = ndcOf(e.x, e.y);
      raycaster.setFromCamera(ndc, camera);
      const g = { kind: e.kind, ndc: { x: ndc.x, y: ndc.y }, ray: raycaster.ray.clone() };
      if (e.velocity) {
        const r = canvas.getBoundingClientRect();
        g.velocity = { x: (e.velocity.x / r.width) * 2, y: -(e.velocity.y / r.height) * 2 }; // NDC mỗi giây
      }
      // Đang giữ tay thì camera đứng yên: ngón tay thuộc về bức (OrbitControls bỏ qua khi enabled = false).
      if (controls && e.kind === 'hold-start') controls.enabled = false;
      if (controls && e.kind === 'hold-end') controls.enabled = true;
      queue.push(g);
    }
  };

  const point = (e) => ({ id: e.pointerId ?? 1, x: e.clientX, y: e.clientY, t: win.performance.now() });
  const clearHold = () => win.clearTimeout(holdTimer);

  const onDown = (e) => {
    if (e.button > 0) return; // chỉ nút chính của chuột; chạm và bút luôn là 0
    first?.();
    first = null;
    emit(tracker.down(point(e)));
    clearHold();
    holdTimer = win.setTimeout(() => emit(tracker.poll(win.performance.now())), GESTURE.holdMs);
  };
  const onMove = (e) => {
    const p = point(e);
    const ndc = ndcOf(p.x, p.y);
    pointer.value.set(ndc.x, ndc.y);
    emit(tracker.poll(p.t));
    emit(tracker.move(p));
  };
  const onUp = (e) => {
    clearHold();
    emit(tracker.up(point(e)));
  };
  const onCancel = () => {
    clearHold();
    emit(tracker.cancel());
  };
  // Nhấn giữ trên điện thoại mở menu ngữ cảnh (và hủy con trỏ): chặn đi, vì "giữ" là cử chỉ của bức.
  const onMenu = (e) => e.preventDefault();

  const listeners = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onCancel],
    ['contextmenu', onMenu],
  ];
  for (const [type, fn] of listeners) canvas.addEventListener(type, fn);
  // Rời trang giữa lúc giữ (chuyển tab, có cuộc gọi) thì không bao giờ có pointerup: coi như thả tay.
  win.addEventListener('blur', onCancel);

  return {
    /** Lấy hết cử chỉ đang chờ (hàng đợi rỗng sau lần gọi). */
    drain: () => queue.splice(0),
    onFirst(fn) {
      first = fn;
    },
    dispose() {
      clearHold();
      for (const [type, fn] of listeners) canvas.removeEventListener(type, fn);
      win.removeEventListener('blur', onCancel);
      if (controls) controls.enabled = true;
      queue.length = 0;
    },
  };
}
```

- [ ] **Step 6: Chạy lại toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  341 passed (341)`. Nếu test hàng rào từ vựng báo một từ trong `gesture.js`/`input.js`: đổi tên cho trung tính (xưởng không nói "gợn sóng", "mặt nước").

- [ ] **Step 7: Commit**

```bash
git add src/engine/gpu/gesture.js src/engine/gpu/input.js tests/unit/gesture.test.js tests/unit/input.test.js
git commit -m "feat(engine): cử chỉ chạm/giữ/vuốt có NDC và tia; kéo để dành cho camera; chặn menu ngữ cảnh, thả khi rời trang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Gợi ý của bức và lời mời "{n} lớp — mài thử?"

**Mục tiêu:** Spec §4.1 mục 3, §4.2: khi cảnh live, hiện gợi ý của bức (`content.hint`, Bức 1: "Chạm vào mặt nước"); sau lần tương tác đầu tiên, đổi thành lời mời *"Bức tranh này có {n} lớp — mài thử?"* với `n = meta.layers.length`. GĐ 1 lời mời chỉ là chữ; GĐ 2 biến nó thành nút vào chế độ mài. Về tầng tĩnh thì ẩn (chạm vào… vô nghĩa khi không có cảnh 3D). Phần 3D đến muộn (quá hạn 10 giây) không được hiện gợi ý đè lên tranh tĩnh.

**Files:**
- Modify: `src/ui/shell.js` (ô `[data-hint]`, `showHint`, `invite`), `src/ui/strings.vi.js` (`t.invite`)
- Modify: `index.html`, `src/styles/shell.css`, `src/engine/boot.js` (vỏ "khóa muộn" có thêm hai hàm)
- Modify: `tests/helpers/page.js`, `tests/unit/shell.test.js`, `tests/unit/strings.test.js`, `tests/paintings/html.test.js`, `tests/unit/boot.test.js`

**Interfaces:**
- Consumes: `meta.layers.length`; `t`.
- Produces: `shell.showHint(text)`, `shell.invite()` (trả về từ `mountShell`, và có trong `runShell` của `boot.js`, bị khóa khi đến muộn). `t.invite(n) → string`. `mountPage()` trả thêm `hint`. Task 7 gọi hai hàm này trong `run.js`.

- [ ] **Step 1: Test hỏng**

`tests/unit/shell.test.js`: đổi dòng `const meta = …` thành (ba lớp, để thấy số lớp trong lời mời):
```js
const meta = { slug: 'thu', title: 'Tranh thử', layers: [{ id: 'cot' }, { id: 'phu-bong' }, { id: 'lop-ba' }] };
```
và thêm vào cuối file:
```js

describe('gợi ý và lời mời', () => {
  it('showHint hiện chữ của bức; invite đổi thành lời mời có số lớp', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    expect(page.hint.hidden).toBe(true);
    shell.showHint('Chạm vào đây');
    expect(page.hint.hidden).toBe(false);
    expect(page.hint.textContent).toBe('Chạm vào đây');
    shell.invite();
    expect(page.hint.textContent).toBe(t.invite(3));
    expect(page.hint.dataset.kind).toBe('invite');
  });

  it('về tầng tĩnh thì ẩn gợi ý; lời mời đến muộn cũng không hiện lại', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showHint('Chạm vào đây');
    shell.setState('static');
    expect(page.hint.hidden).toBe(true);
    shell.invite();
    expect(page.hint.hidden).toBe(true);
  });

  it('showHint không có chữ, hoặc trang không có [data-hint], thì bỏ qua', () => {
    const shell = mountShell(document, meta, { now: NOW, t });
    shell.showHint('');
    expect(page.hint.hidden).toBe(true);
    page.hint.remove();
    expect(() => shell.showHint('x')).not.toThrow();
    expect(() => shell.invite()).not.toThrow();
  });
});
```

`tests/unit/strings.test.js`: ngay trước `it('t.formatSeal chính là formatSeal'`, thêm:
```js
  it('lời mời có số lớp', () => {
    expect(t.invite(5)).toBe('Bức tranh này có 5 lớp — mài thử?');
  });

```

`tests/paintings/html.test.js`: đổi tên test `'có đủ các ô mà xưởng điền vào: stage, con dấu, huy hiệu (+ ghi chú), tầng tĩnh'` thành `'có đủ các ô mà xưởng điền vào: stage, con dấu, huy hiệu (+ ghi chú), tầng tĩnh, gợi ý'`, và ngay sau dòng `expect($('[data-badge-note]').getAttribute('aria-live')).toBe('polite');` thêm:
```js
      const hint = $('[data-hint]');
      expect(hint?.hidden).toBe(true);
      expect(hint.getAttribute('aria-live')).toBe('polite');
```

`tests/unit/boot.test.js`, test `(e)`: trong `finishLate`, ngay sau `shell.showBadge({ tier: 'webgl2', level: 'vua' });` thêm:
```js
          shell.showHint('Chạm vào đây');
          shell.invite();
```
và ngay sau dòng cuối của test đó (`expect(page.badge.dataset.backend).toBe('static');`) thêm:
```js
    expect(page.hint.hidden).toBe(true); // gợi ý đến muộn cũng bị chặn
```

Thay `tests/helpers/page.js` bằng:
```js
// tests/helpers/page.js — dựng khung trang tối thiểu (đủ các ô mà xưởng điền vào) trong document của jsdom

// Cùng các ô mà tests/paintings/html.test.js bắt mọi trang phải có.
export const PAGE_BODY = `
  <img class="poster" data-poster src="/poster.svg" width="16" height="10" alt="">
  <div data-stage></div>
  <button data-badge hidden type="button" aria-expanded="false" aria-controls="badge-note"></button>
  <p id="badge-note" data-badge-note hidden aria-live="polite"></p>
  <span data-seal></span>
  <section data-static hidden aria-live="polite"></section>
  <p data-hint hidden aria-live="polite"></p>
  <svg data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
`;

/** Ghi đè body bằng khung trang mới; trả các phần tử để test đọc. */
export function mountPage(doc = document) {
  doc.body.innerHTML = PAGE_BODY;
  doc.body.dataset.state = 'poster';
  const $ = (sel) => doc.querySelector(sel);
  return {
    poster: $('[data-poster]'),
    stage: $('[data-stage]'),
    badge: $('[data-badge]'),
    badgeNote: $('[data-badge-note]'),
    seal: $('[data-seal]'),
    note: $('[data-static]'),
    hint: $('[data-hint]'),
    moon: $('[data-moon]'),
  };
}
```

- [ ] **Step 2: Chạy, thấy hỏng**

Run: `npm test`
Expected: FAIL: `shell.showHint is not a function`, `t.invite is not a function`, `[data-hint]` là `null` trong `index.html`.

- [ ] **Step 3: Viết code**

Thay `src/ui/shell.js` bằng (bản này đã có phần trăng của Task 4):
```js
// ui/shell.js — vỏ trang của mọi bức: con dấu âm lịch, data-state, hòa dần poster → canvas, huy hiệu, ghi chú tầng tĩnh
import { lunarFromDate, canChiIndex } from '../lib/astro/lunar.js';
import { moonPhase } from '../lib/astro/moon.js';
import { renderBadge } from './badge.js';
import { drawMoon } from './moon-svg.js';

/** Transition CSS dài 900 ms. Lưới an toàn: quá 1200 ms mà chưa có transitionend thì coi như đã hòa xong. */
const FADE_TIMEOUT_MS = 1200;

/**
 * Gắn vỏ trang vào HTML tĩnh của một bức. Vỏ không biết bức nào: nó chỉ tìm các ô data-* mà trang nào
 * cũng có (tests/paintings/html.test.js giữ luật đó). Chữ lấy từ `t`, không import strings.
 * @param {Document} doc
 * @param {object} meta  PaintingMeta của bức (GĐ 1 dùng cho lời mời "{n} lớp")
 * @param {{ now: Date, t: Record<string, any>, onState?: (state: string) => void }} opts
 */
export function mountShell(doc, meta, { now, t, onState = () => {} }) {
  const $ = (sel) => doc.querySelector(sel);
  const poster = $('[data-poster]');
  const stageEl = $('[data-stage]');
  const badge = $('[data-badge]');
  const badgeNote = $('[data-badge-note]');
  const note = $('[data-static]');
  const hint = $('[data-hint]'); // gợi ý / lời mời (trang nào không có ô này thì bỏ qua)
  const moon = $('[data-moon]'); // trăng SVG đúng pha (bức nào không có trăng thì bỏ ô này đi)

  // Con dấu: ngày âm theo giờ Việt Nam; can chi lấy theo NĂM ÂM (trước Tết vẫn là năm cũ).
  const lunar = lunarFromDate(now);
  $('[data-seal]').textContent = t.formatSeal({ ...lunar, ...canChiIndex(lunar.year) });
  if (moon) drawMoon(moon, moonPhase(now).phase);

  // title chỉ hiện khi rê chuột; điện thoại không có chuột, nên chạm vào huy hiệu thì mở/đóng ô giải thích.
  badge.addEventListener('click', () => {
    badgeNote.textContent = badge.title;
    badgeNote.hidden = !badgeNote.hidden;
    badge.setAttribute('aria-expanded', String(!badgeNote.hidden));
  });

  /** Đổi body[data-state] (CSS và e2e đọc) rồi báo cho boot để __sma.state luôn khớp. */
  function setState(state) {
    doc.body.dataset.state = state;
    if (state === 'static') {
      poster.hidden = false; // tầng tĩnh luôn có poster, kể cả khi rơi xuống sau lúc đã live
      if (hint) hint.hidden = true; // "chạm vào…" vô nghĩa khi không còn cảnh 3D
    }
    onState(state);
  }

  /**
   * Hòa dần từ poster sang canvas (canvas đã nằm trong stageEl với opacity 0). Xong thì ẩn poster.
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<void>}
   */
  function crossfade(canvas) {
    return new Promise((resolve) => {
      let timer;
      const finish = () => {
        clearTimeout(timer);
        canvas.removeEventListener('transitionend', onEnd);
        // Cảnh có thể hỏng ngay giữa lúc hòa (đã về tầng tĩnh): khi đó poster phải ở lại.
        if (doc.body.dataset.state !== 'static') poster.hidden = true;
        resolve();
      };
      const onEnd = (event) => {
        if (event.target === canvas) finish();
      };
      // Đọc style trước khi đổi: trình duyệt "chốt" opacity 0 hiện tại, nên thêm data-visible chắc chắn sinh transition.
      void doc.defaultView?.getComputedStyle(canvas).opacity;
      canvas.setAttribute('data-visible', '');
      // Người xem xin giảm chuyển động: CSS bỏ transition, nên không có transitionend để chờ.
      if (doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        finish();
        return;
      }
      canvas.addEventListener('transitionend', onEnd);
      timer = setTimeout(finish, FADE_TIMEOUT_MS);
    });
  }

  /** @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: string | null }} info */
  function showBadge(info) {
    renderBadge(badge, info, t);
    badgeNote.textContent = badge.title; // ô giải thích đang mở thì đổi theo tầng mới
  }

  const make = (tag, text) => {
    const el = doc.createElement(tag);
    el.textContent = text;
    return el;
  };

  /**
   * Điền ô ghi chú [data-static]: đoạn chữ, nút "Tải lại" nếu cần, chi tiết lỗi (chỉ khi ?debug).
   * Gọi lại thì thay hẳn nội dung cũ. Không có gì để nói thì ô vẫn ẩn.
   * @param {{ text: string | null, reload: boolean }} content
   * @param {string | null} [detail]
   */
  function showNote({ text, reload }, detail = null) {
    const parts = [];
    if (text) parts.push(make('p', text));
    if (reload) {
      const button = make('button', t.static.reload);
      button.type = 'button';
      button.addEventListener('click', () => doc.defaultView.location.reload());
      parts.push(button);
    }
    if (detail) parts.push(make('pre', detail));
    note.replaceChildren(...parts);
    note.hidden = parts.length === 0;
  }

  /** Gợi ý của bức (content.hint), hiện khi cảnh đã live. */
  function showHint(text) {
    if (!hint || !text) return;
    hint.textContent = text;
    hint.dataset.kind = 'hint';
    hint.hidden = false;
  }

  /** Sau lần chạm đầu tiên: lời mời mài lớp, n = số lớp của bức (meta.layers.length). */
  function invite() {
    if (!hint || doc.body.dataset.state === 'static') return;
    hint.textContent = t.invite(meta.layers.length);
    hint.dataset.kind = 'invite';
    hint.hidden = false;
  }

  return { stageEl, setState, crossfade, showBadge, showNote, showHint, invite };
}
```

`src/ui/strings.vi.js`: ngay trước dòng `  formatSeal,` trong object `t`, thêm:
```js
  /** Lời mời sau lần chạm đầu tiên; n = số lớp của bức. */
  invite: (n) => `Bức tranh này có ${n} lớp — mài thử?`,
```

`src/engine/boot.js`, trong object `runShell`, ngay sau `showNote: unlessLate(shell.showNote),` thêm:
```js
    showHint: unlessLate(shell.showHint),
    invite: unlessLate(shell.invite),
```

Thay `index.html` bằng:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ao Sen Đêm · Sơn Mài Ánh Sáng</title>
    <meta name="description" content="Một ao sen đêm, sơn từ sáu lớp ánh sáng." />
    <meta name="theme-color" content="#0E0A08" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/src/styles/shell.css" />
  </head>
  <body data-painting="ao-sen-dem" data-state="poster">
    <img
      class="poster"
      data-poster
      src="/paintings/ao-sen-dem/poster.svg"
      width="1600"
      height="1000"
      alt="Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá."
      fetchpriority="high"
    />
    <div class="stage" data-stage></div>
    <main class="frame">
      <div class="top">
        <header>
          <small>Sơn Mài Ánh Sáng · Bức 1</small>
          <h1>Ao Sen Đêm</h1>
        </header>
        <div class="badge-box">
          <button data-badge hidden type="button" aria-expanded="false" aria-controls="badge-note"></button>
          <p id="badge-note" data-badge-note hidden aria-live="polite"></p>
        </div>
      </div>
      <section data-static hidden aria-live="polite"></section>
      <p class="hint" data-hint hidden aria-live="polite"></p>
      <footer class="foot">
        <figure class="poem">
          <blockquote data-poem>
            <p>Trong đầm gì đẹp bằng sen</p>
            <p>Lá xanh bông trắng lại chen nhị vàng</p>
            <p>Nhị vàng bông trắng lá xanh</p>
            <p>Gần bùn mà chẳng hôi tanh mùi bùn</p>
          </blockquote>
          <figcaption><cite>Ca dao</cite></figcaption>
        </figure>
        <div class="marks">
          <svg class="trang" data-moon viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true"></svg>
          <span class="dau" data-seal></span>
        </div>
      </footer>
    </main>
    <script type="module">
      import { boot } from '/src/engine/boot.js';
      import entry from '/src/paintings/ao-sen-dem/index.js';
      import t from '/src/ui/strings.vi.js';
      boot(entry, { lang: 'vi', t });
    </script>
  </body>
</html>
```

`src/styles/shell.css`: ngay trước khối `/* ── Trăng đêm nay …` (Task 4), thêm:
```css
/* ── Gợi ý / lời mời: một dòng thơ nhỏ giữa khung, trên chân trang ─────────────────── */
.hint {
  grid-row: 2;
  align-self: end;
  justify-self: center;
  margin: 0;
  font: italic 500 clamp(16px, 0.6vw + 12px, 20px) / 1.4 var(--serif);
  color: var(--vang-la-sang);
  letter-spacing: 0.02em;
  animation: hint-in 1.2s ease-out both;
}
.hint[data-kind='invite'] { color: var(--nga); }
@keyframes hint-in { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .hint { animation: none; } }

```
(`.frame` có `pointer-events: none`, nên dòng gợi ý không chặn cú chạm xuống canvas.)

- [ ] **Step 4: Chạy lại**

Run: `npm test`
Expected: PASS, `Tests  345 passed (345)`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/shell.js src/ui/strings.vi.js src/engine/boot.js index.html src/styles/shell.css tests/helpers/page.js tests/unit/shell.test.js tests/unit/strings.test.js tests/paintings/html.test.js tests/unit/boot.test.js
git commit -m "feat(ui): gợi ý của bức và lời mời mài lớp sau lần chạm đầu tiên

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Nối vào sân khấu và vòng đời: camera thở, `ctx.u.pointer`, content, hàng đợi cử chỉ

**Mục tiêu:** Spec §8.5: `run.js` tải `content` song song với bức và renderer (hỏng thì 3D vẫn chạy, bảng lỗi §9); tạo `input` sau khi có camera + controls; mỗi khung: đồng hồ → **cử chỉ** → `setup.update` → các lớp → **camera thở** → controls → render. Khi live: `showHint(content.hint)`, lần chạm đầu → `invite()`. `CameraSpec.breathe` (spec §8.4 [1]) ép về 0 khi giảm chuyển động (Review Focus #4).

**Files:**
- Create: `src/engine/gpu/breath.js`, `tests/unit/breath.test.js`
- Modify: `src/engine/gpu/stage.js` (`u.pointer`, `breathe(t)`), `src/engine/gpu/run.js`

**Interfaces:**
- Consumes: `createInput` (Task 5); `shell.showHint`, `shell.invite` (Task 6); `entry.content?.[lang]` (hợp đồng nhẹ, spec §8.3); `painting.setup(ctx).onGesture` (Task 9 mới có, `?.` nên chưa có vẫn chạy).
- Produces: `breathAmplitude(spec, reducedMotion) → number`; `breathOffset(t, amplitude) → [x, y, z]`. `stage.u.pointer` (uniform vec2, tên `u_pointer`) là `ctx.u.pointer`. `stage.breathe(t)`.

- [ ] **Step 1: Test camera thở**

`tests/unit/breath.test.js`:
```js
// tests/unit/breath.test.js — camera "thở": lệch nhỏ, bị chặn, tất định; biên độ 0 thì đứng yên.
import { describe, it, expect } from 'vitest';
import { breathAmplitude, breathOffset } from '../../src/engine/gpu/breath.js';

describe('breathOffset', () => {
  it('biên độ 0 (hoặc thiếu) → không lệch', () => {
    expect(breathOffset(12.3, 0)).toEqual([0, 0, 0]);
    expect(breathOffset(12.3, undefined)).toEqual([0, 0, 0]);
  });

  it('mỗi trục bị chặn bởi biên độ; cùng t cho cùng kết quả (?freeze tất định)', () => {
    for (let t = 0; t < 60; t += 0.37) {
      const [x, y, z] = breathOffset(t, 0.4);
      expect(Math.abs(x)).toBeLessThanOrEqual(0.4);
      expect(Math.abs(y)).toBeLessThanOrEqual(0.4 * 0.35);
      expect(Math.abs(z)).toBeLessThanOrEqual(0.4 * 0.6);
    }
    expect(breathOffset(7.5, 0.4)).toEqual(breathOffset(7.5, 0.4));
  });

  it('có chuyển động: hai thời điểm khác nhau cho độ lệch khác nhau', () => {
    expect(breathOffset(1, 0.4)).not.toEqual(breathOffset(3, 0.4));
  });
});

describe('breathAmplitude', () => {
  it('lấy CameraSpec.breathe; bức không khai báo thì 0', () => {
    expect(breathAmplitude({ breathe: 0.4 }, false)).toBe(0.4);
    expect(breathAmplitude({}, false)).toBe(0);
  });

  it('người xem xin giảm chuyển động thì camera không thở (§10)', () => {
    expect(breathAmplitude({ breathe: 0.4 }, true)).toBe(0);
  });
});
```

Run: `npx vitest run tests/unit/breath.test.js`
Expected: FAIL: không tải được `src/engine/gpu/breath.js`.

- [ ] **Step 2: Viết `src/engine/gpu/breath.js`**

```js
// engine/gpu/breath.js — camera "thở": độ lệch nhỏ và chậm của điểm nhìn theo thời gian (hàm thuần, tất định).

// Ba nhịp (giây) lệch nhau: chuyển động không bao giờ lặp đều như con lắc.
const PERIODS = [11, 7, 13];

/**
 * Biên độ thở thật sự: CameraSpec.breathe của bức, ép về 0 khi người xem xin giảm chuyển động (§10).
 * @param {{ breathe?: number }} spec
 * @param {boolean} reducedMotion
 */
export function breathAmplitude(spec, reducedMotion) {
  return reducedMotion ? 0 : (spec.breathe ?? 0);
}

/**
 * Độ lệch [x, y, z] của điểm nhìn tại thời điểm t (giây của ctx.u.time, nên ?freeze cho cùng một khung).
 * Biên độ 0 (không khai báo breathe, hoặc người xem xin giảm chuyển động) thì không lệch.
 * @param {number} t
 * @param {number} amplitude  CameraSpec.breathe (đơn vị của cảnh)
 * @returns {[number, number, number]}
 */
export function breathOffset(t, amplitude) {
  if (!amplitude) return [0, 0, 0];
  const wave = (i) => Math.sin((t * 2 * Math.PI) / PERIODS[i] + i);
  return [wave(0) * amplitude, wave(1) * amplitude * 0.35, wave(2) * amplitude * 0.6];
}
```

Run: `npx vitest run tests/unit/breath.test.js`
Expected: PASS (5 test).

- [ ] **Step 3: Sân khấu: `u.pointer` và `breathe(t)`**

Thay `src/engine/gpu/stage.js` bằng:
```js
// engine/gpu/stage.js — Sân khấu 3D: renderer nền đặc, camera + OrbitControls, đồng hồ, resize + DPR, lỗi GPU.
import { WebGPURenderer, Scene, PerspectiveCamera, Vector2, Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createClock } from './clock.js';
import { breathAmplitude, breathOffset } from './breath.js';

/**
 * Dựng sân khấu cho một bức. Chỉ chạy trong trình duyệt có GPU (e2e kiểm, không có unit test).
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier     tầng boot dò được; 'webgl2' ép forceWebGL
 * @param {{ freeze: boolean|number }} opts.flags   cờ URL (engine/flags.js)
 * @param {HTMLElement} opts.parent        phần tử [data-stage]; canvas được gắn vào đây
 * @param {string} opts.clearColor         màu nền đặc, ví dụ palette.denThen
 * @param {boolean} [opts.reducedMotion]   prefers-reduced-motion: tắt quán tính của camera
 * @param {Window} [opts.win]
 */
export async function createStage({ tier, flags, parent, clearColor, reducedMotion = false, win = window }) {
  // WebGPURenderer chỉ quyết định lùi về WebGL2 BÊN TRONG init(); forceWebGL ép tầng B ngay từ đầu.
  const renderer = new WebGPURenderer({ antialias: false, forceWebGL: tier === 'webgl2' });
  await renderer.init();
  // Backend THẬT, chỉ đáng tin sau init(): three có thể lặng lẽ lùi về WebGL2. Huy hiệu dùng giá trị này.
  const backend = renderer.backend.isWebGPUBackend ? 'webgpu' : 'webgl2';
  // alpha mặc định là true: thiếu dòng này thì chỗ trống trong suốt và lộ trang phía sau canvas.
  renderer.setClearColor(clearColor, 1);
  // renderer.toneMapping giữ NoToneMapping (mặc định): tone mapping nằm trong pipeline (Phủ bóng + renderOutput).

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 500);
  // Uniform dùng chung cho mọi lớp. Tên đặt bằng setName phải là định danh hợp lệ (không có '-').
  const u = {
    time: uniform(0).setName('u_time'),
    delta: uniform(1 / 60).setName('u_delta'),
    resolution: uniform(new Vector2()).setName('u_resolution'),
    pointer: uniform(new Vector2()).setName('u_pointer'), // NDC của con trỏ (input.js cập nhật)
  };
  // ?freeze → đồng hồ tất định (khung × 1/60 s); không dùng time/deltaTime của TSL vì chúng chạy theo đồng hồ riêng.
  const clock = createClock({ freeze: flags.freeze });

  // Ghi đè hai callback của renderer. Lỗi GPU đến KHÔNG đồng bộ (không ném từ render()), nên phải nghe ở đây.
  const lostCallbacks = [];
  const errorCallbacks = [];
  renderer.onDeviceLost = (info) => lostCallbacks.forEach((cb) => cb(info));
  renderer.onError = (info) => errorCallbacks.forEach((cb) => cb(info));

  let controls = null;
  let breathAmp = 0; // biên độ "thở" của camera (CameraSpec.breathe; 0 khi giảm chuyển động)
  const base = new Vector3(); // điểm nhìn gốc của bức; thở = lệch quanh điểm này
  let dprMax = 1;
  let lastSize = '';
  const resize = () => {
    const width = parent.clientWidth || win.innerWidth;
    const height = parent.clientHeight || win.innerHeight;
    const ratio = Math.min(win.devicePixelRatio || 1, dprMax);
    // Gán lại canvas.width (dù cùng giá trị) sẽ XÓA khung đang hiện; bỏ qua lần gọi không đổi gì,
    // để khung N của ?freeze=N còn nguyên.
    const size = `${width}x${height}@${ratio}`;
    if (size === lastSize) return;
    lastSize = size;
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(u.resolution.value);
  };
  const observer = new win.ResizeObserver(resize);
  observer.observe(parent);
  // Canvas vào [data-stage] ngay; CSS giữ nó ở opacity 0 cho tới khi shell.crossfade() gắn data-visible.
  parent.appendChild(renderer.domElement);
  resize();

  let disposed = false;
  return {
    renderer,
    scene,
    camera,
    backend,
    u,
    get controls() {
      return controls;
    },

    /** Áp CameraSpec của bức: vị trí, điểm nhìn, fov, rồi OrbitControls bị chặn trong giới hạn bức khai báo. */
    useCamera(spec) {
      controls?.dispose();
      camera.fov = spec.fov;
      camera.position.set(...spec.position);
      camera.updateProjectionMatrix();
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...spec.target);
      base.set(...spec.target);
      breathAmp = breathAmplitude(spec, reducedMotion);
      controls.minAzimuthAngle = spec.azimuth[0];
      controls.maxAzimuthAngle = spec.azimuth[1];
      controls.minPolarAngle = spec.polar[0];
      controls.maxPolarAngle = spec.polar[1];
      controls.minDistance = spec.distance[0];
      controls.maxDistance = spec.distance[1];
      controls.enablePan = false;
      // Damping = quán tính khi thả tay; cần gọi controls.update() mỗi khung (run.js làm).
      controls.enableDamping = !reducedMotion;
      controls.update();
      return controls;
    },

    /**
     * Camera "thở": dời điểm nhìn theo breathOffset(t). OrbitControls giữ nguyên góc và khoảng cách
     * quanh điểm nhìn, nên camera dời theo đúng độ lệch đó (luôn quanh gốc, không trôi dần).
     * Gọi TRƯỚC controls.update() mỗi khung.
     */
    breathe(t) {
      if (!controls || !breathAmp) return;
      const [x, y, z] = breathOffset(t, breathAmp);
      controls.target.set(base.x + x, base.y + y, base.z + z);
    },

    /** Đặt trần DPR theo mức chất lượng (budget.dpr) rồi tính lại kích thước. */
    setDpr(max) {
      dprMax = max;
      resize();
    },

    /** Một nhịp đồng hồ: cập nhật u.time / u.delta. Khung đầu của vòng lặp three có thể không có ms. */
    tick(ms = win.performance.now()) {
      const { t, dt } = clock.tick(ms);
      u.time.value = t;
      u.delta.value = dt;
      return { t, dt };
    },

    onLost(cb) {
      lostCallbacks.push(cb);
    },
    onError(cb) {
      errorCallbacks.push(cb);
    },

    /** Gỡ sân khấu; gọi 2 lần vẫn an toàn. */
    dispose() {
      if (disposed) return;
      disposed = true;
      // Bỏ callback TRƯỚC: WebGLBackend.dispose() tự gọi loseContext(), không được để nó báo "mất thiết bị".
      lostCallbacks.length = 0;
      errorCallbacks.length = 0;
      observer.disconnect();
      controls?.dispose();
      renderer.setAnimationLoop(null);
      renderer.dispose().catch((err) => console.error('Gỡ renderer lỗi:', err));
      renderer.domElement.remove();
    },
  };
}
```
Điểm học: "thở" dời **điểm nhìn** (`controls.target`) quanh điểm gốc của bức. OrbitControls giữ góc và khoảng cách quanh điểm nhìn, nên camera dời theo đúng độ lệch đó, luôn quanh gốc, không trôi dần như khi cộng thẳng vào `camera.position`.

- [ ] **Step 4: Vòng đời: content, input, cử chỉ, thở, gợi ý**

Thay `src/engine/gpu/run.js` bằng:
```js
// engine/gpu/run.js — Vòng đời một bức ở tầng 3D: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ.
import { Color } from 'three/webgpu';
import { mergePalette } from '../palette.js';
import { isMobile, pickLevel, budgetFor } from '../quality.js';
import { createStage } from './stage.js';
import { createDisposer } from './disposer.js';
import { createWeights, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createFailCounter, createBurstCounter } from './guards.js';
import { createInput } from './input.js';

/** content.<lang>.js của bức, hoặc null nếu bức không có hay tải hỏng (3D không phụ thuộc chữ). */
function loadContent(entry, lang) {
  const load = entry.content?.[lang];
  if (!load) return Promise.resolve(null);
  return load().then((m) => m.default, (err) => {
    console.warn(`Không tải được chữ của bức (${lang}):`, err);
    return null;
  });
}

/**
 * Chạy một bức ở tầng A/B (spec §8.5). boot.js gọi hàm này qua import() động, trong hạn 10 giây.
 * Resolve { dispose } khi cảnh đã "live". Ném lỗi (sau khi tự gỡ sạch) nếu hỏng TRƯỚC khi live;
 * hỏng SAU khi live thì gọi onFail(reason, error) đúng một lần.
 * @param {import('../contracts/painting.js').PaintingEntry} entry
 * @param {object} shell   vỏ trang (ui/shell.js): setState, stageEl, crossfade, showBadge, showHint, invite
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier   tầng boot dò được (backend thật có thể khác: xem stage.backend)
 * @param {object} opts.flags             kết quả readFlags()
 * @param {Date} opts.now                 flags.at ?? giờ thật, cố định lúc khởi động
 * @param {string} opts.lang              ngôn ngữ trang (GĐ 1 dùng để tải content)
 * @param {object} opts.t                 chữ giao diện (Sổ tay GĐ 2 dùng; gợi ý của bức nằm trong content)
 * @param {object} opts.sma               window.__sma (engine/sma.js)
 * @param {(reason: string, error?: unknown) => void} opts.onFail   về tầng tĩnh
 * @param {Window} [opts.win]
 * @returns {Promise<{ dispose: () => void }>}
 */
export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail, win = window }) {
  const disposer = createDisposer();
  const handle = { dispose: () => disposer.closeAll() };
  let failed = false;

  // fail() chạy MỘT lần: gỡ mọi thứ theo thứ tự ngược, rồi báo boot về tầng tĩnh với lý do.
  const fail = (reason, error) => {
    if (failed) return;
    failed = true;
    disposer.closeAll();
    onFail(reason, error);
  };
  // Sau mỗi await, trang có thể đã về tầng tĩnh: do fail(), hoặc do boot hết hạn 10 s (showStatic đặt
  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa.
  const stopped = () => failed || sma.state === 'static';
  const quit = () => {
    disposer.closeAll();
    return handle;
  };

  const hex = mergePalette(entry.meta.palette);
  const reducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  try {
    // Song song: tải module nặng của bức và dựng renderer. Sân khấu vào disposer NGAY khi dựng xong,
    // nên dù load() hỏng trước, renderer vẫn được gỡ (add() sau closeAll() chạy fn ngay).
    // Chữ của bức (gợi ý…) tải cùng lúc; hỏng thì cảnh 3D vẫn chạy, chỉ thiếu chữ (bảng lỗi §9).
    const [painting, stage, content] = await Promise.all([
      entry.load(),
      createStage({ tier, flags, parent: shell.stageEl, clearColor: hex.denThen, reducedMotion, win }).then((s) => {
        disposer.add(() => s.dispose());
        return s;
      }),
      loadContent(entry, lang),
    ]);
    if (stopped()) return quit();

    stage.onLost((info) => {
      fail('device-lost', new Error(`Mất thiết bị ${info?.api ?? 'GPU'}: ${info?.message ?? ''}`));
    });
    const gpuErrors = createBurstCounter({ limit: 3, windowMs: 1000 });
    stage.onError((info) => {
      console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
      if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
    });

    stage.useCamera(painting.camera);
    const mobile = isMobile(win.navigator);
    // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2).
    const level = pickLevel({ tier: stage.backend, mobile });
    const budget = budgetFor(level, painting.quality);
    stage.setDpr(budget.dpr);
    sma.set({ backend: stage.backend, level });

    const weights = createWeights(entry.meta.layers);
    /** @type {import('../contracts/runtime.js').EngineCtx} */
    const ctx = {
      tier: stage.backend,
      level,
      budget,
      mobile,
      reducedMotion,
      now,
      renderer: stage.renderer,
      scene: stage.scene,
      camera: stage.camera,
      palette: { hex, color: (token) => new Color(hex[token]) },
      u: stage.u,
      weight: (id) => weights.weight(id),
      debug: Boolean(flags.debug),
    };

    // setup() của bức (GĐ 1) chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
    const setup = painting.setup?.(ctx);
    if (setup?.dispose) disposer.add(() => setup.dispose());
    const shared = setup?.shared ?? {};
    // Thứ tự đăng ký = stage → setup → lớp → pipeline → vòng lặp; closeAll() gỡ NGƯỢC lại.
    const layers = buildLayers(painting.layers, ctx, shared, { tier: ctx.tier, level, budget, now, mobile });
    for (const { layer } of layers) disposer.add(() => layer.dispose());
    // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
    ensureEmissive(stage.scene, {
      warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
    });
    const pipeline = createPipeline({
      renderer: stage.renderer,
      scene: stage.scene,
      camera: stage.camera,
      layers,
      weight: ctx.weight,
    });
    disposer.add(() => pipeline.dispose());

    // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
    const input = createInput({
      canvas: stage.renderer.domElement,
      camera: stage.camera,
      controls: stage.controls,
      pointer: stage.u.pointer,
      win,
    });
    disposer.add(() => input.dispose());

    // Biên dịch trước bằng scenePass.compileAsync (có MRT + render target của pass), trong lúc poster còn hiện.
    shell.setState('compiling');
    await pipeline.compile();
    if (stopped()) return quit();

    const limit = typeof flags.freeze === 'number' ? flags.freeze : Infinity;
    let frames = 0;
    // Một khung: đồng hồ → cử chỉ → setup.update → layer.update theo thứ tự → camera → render → đếm khung.
    const step = (ms) => {
      const { t: time, dt } = stage.tick(ms);
      for (const g of input.drain()) setup?.onGesture?.(g);
      setup?.update?.(dt, time);
      for (const { layer } of layers) layer.update?.(dt, time);
      stage.breathe(time);
      stage.controls?.update();
      pipeline.render();
      frames += 1;
      sma.frame();
    };

    // Khung ẩn (là khung 1): canvas còn opacity 0 sau poster. Reflector, bóng, bloom, quad… chưa được
    // compileAsync biên dịch, nên chúng biên dịch nốt ở khung này thay vì làm khựng lúc đã hiện.
    step(win.performance.now());
    shell.setState('fading');
    await shell.crossfade(stage.renderer.domElement);
    if (stopped()) return quit();
    shell.setState('live');
    shell.showBadge({ tier: stage.backend, level });
    // Gợi ý của bức ("Chạm vào mặt nước"); lần chạm đầu tiên đổi thành lời mời mài lớp.
    if (content?.hint) shell.showHint(content.hint);
    input.onFirst(() => shell.invite());

    const frameErrors = createFailCounter({ limit: 3 });
    const loop = (ms) => {
      if (failed) return;
      try {
        step(ms);
        frameErrors.ok();
      } catch (err) {
        // Lỗi JS trong một khung: ghi log, bỏ qua khung đó; 3 khung lỗi LIÊN TIẾP → tầng tĩnh.
        console.error('Lỗi trong một khung:', err);
        if (frameErrors.fail()) fail('frame-errors', err);
        return;
      }
      // ?freeze=N: dừng vòng lặp sau khung N; canvas giữ nguyên khung N, __sma.frames === N.
      if (frames >= limit) stage.renderer.setAnimationLoop(null);
    };
    disposer.add(() => stage.renderer.setAnimationLoop(null));
    if (frames < limit) stage.renderer.setAnimationLoop(loop);
    return handle;
  } catch (err) {
    disposer.closeAll();
    // fail() đã báo tầng tĩnh với lý do đúng (vd. 'device-lost'); đừng để boot ghi đè thành 'error'.
    if (failed) return handle;
    throw err;
  }
}
```

- [ ] **Step 5: Chạy toàn bộ test và e2e WebGL2**

Run: `npm test`
Expected: PASS, `Tests  350 passed (350)`.

Run: `npm run build && npx playwright test --project=static --project=webgl2-swiftshader`
Expected: PASS (cảnh chưa đổi gì nhìn thấy được: Bức 1 chưa có `setup`, chưa có `content`, camera chưa khai báo `breathe`).

Kiểm tay: `npm run dev`, mở `http://localhost:5173/son-mai-anh-sang/?webgl`, bấm và giữ trên canvas: không có lỗi console; kéo vẫn xoay camera.

- [ ] **Step 6: Commit**

```bash
git add src/engine/gpu/breath.js src/engine/gpu/stage.js src/engine/gpu/run.js tests/unit/breath.test.js
git commit -m "feat(engine): camera thở, ctx.u.pointer, tải content, cử chỉ xử lý đầu mỗi khung, gợi ý khi live

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Chế độ thợ: `?debug` → three.js Inspector, `?debug=stats` → stats-gl

**Mục tiêu:** Spec §4.1 mục 9, §7: `engine/gpu/debug.js` chỉ tải công cụ bằng `import()` động khi có cờ (Inspector 39 KB gzip, stats-gl 9 KB gzip; người xem thường không tốn byte nào). Hai công cụ không bật cùng lúc. Hỏng thì chỉ cảnh báo, cảnh vẫn chạy.

**Files:**
- Create: `src/engine/gpu/debug.js`, `tests/unit/debug.test.js`
- Modify: `package.json`, `package-lock.json` (`stats-gl`), `src/engine/gpu/run.js`, `e2e/painting.spec.js`

**Interfaces:**
- Consumes: `flags.debug: false | true | 'stats'` (`engine/flags.js`, đã có).
- Produces: `mountDebug(mode, renderer, doc = globalThis.document) → Promise<{ update(), dispose() } | null>`. DOM của công cụ có `data-debug="inspector"` hoặc `data-debug="stats"` (e2e đọc).

- [ ] **Step 1: Cài stats-gl**

```bash
npm install stats-gl@^4.2.3
```
Expected: `package.json` có `"stats-gl": "^4.2.3"` trong `dependencies`; `package-lock.json` đổi theo.

- [ ] **Step 2: Test (không có cờ thì không tải gì, không đụng renderer)**

`tests/unit/debug.test.js`:
```js
// tests/unit/debug.test.js — chế độ thợ: không có cờ ?debug thì không tải gì (người xem thường không tốn byte nào).
import { describe, it, expect } from 'vitest';
import { mountDebug } from '../../src/engine/gpu/debug.js';

describe('mountDebug', () => {
  it('không có cờ ?debug → null, không đụng tới renderer', async () => {
    const renderer = new Proxy({}, { get: (_, key) => { throw new Error(`không được đọc renderer.${String(key)}`); } });
    expect(await mountDebug(false, renderer)).toBeNull();
  });
});
```

Run: `npx vitest run tests/unit/debug.test.js`
Expected: FAIL: không tải được `src/engine/gpu/debug.js`.

- [ ] **Step 3: Viết `src/engine/gpu/debug.js`**

```js
// engine/gpu/debug.js — chế độ thợ: ?debug mở three.js Inspector, ?debug=stats mở stats-gl. Chỉ tải bằng import() động.

/**
 * Hai công cụ không bật cùng lúc (cờ ?debug chỉ có một giá trị). Cả hai chỉ tải khi có cờ,
 * nên người xem bình thường không tốn byte nào. Inspector dùng localStorage nên không import tĩnh được.
 * @param {false | true | 'stats'} mode  flags.debug
 * @param {any} renderer
 * @param {Document} [doc]
 * @returns {Promise<{ update: () => void, dispose: () => void } | null>}
 */
export async function mountDebug(mode, renderer, doc = globalThis.document) {
  if (mode === 'stats') {
    const { default: Stats } = await import('stats-gl');
    const stats = new Stats({ trackGPU: true });
    await stats.init(renderer); // bật đo thời gian GPU (timestamp query) nếu máy hỗ trợ
    stats.dom.dataset.debug = 'stats';
    doc.body.append(stats.dom);
    return {
      update() {
        // Đọc kết quả timestamp của các khung trước (bất đồng bộ), rồi vẽ lại biểu đồ.
        renderer.resolveTimestampsAsync().catch(() => {});
        stats.update();
      },
      dispose() {
        stats.dispose();
        stats.dom.remove();
      },
    };
  }
  if (mode) {
    const { Inspector } = await import('three/addons/inspector/Inspector.js');
    const inspector = new Inspector();
    renderer.inspector = inspector; // Inspector tự gắn bảng của nó vào trang
    inspector.domElement.dataset.debug = 'inspector';
    return {
      update() {},
      dispose() {
        inspector.dispose();
        inspector.domElement.remove();
      },
    };
  }
  return null;
}
```
(`doc = globalThis.document`: trong Node không có `document`; viết `doc = document` thì chính dòng khai báo đã ném `ReferenceError`.)

Run: `npm test`
Expected: PASS, `Tests  351 passed (351)`. Luật ranh giới qua: `engine/gpu` chỉ `import()` động `stats-gl` và `three/addons/inspector/…`.

- [ ] **Step 4: Nối vào `run.js`**

Thay `src/engine/gpu/run.js` bằng bản cuối của GĐ 1:
```js
// engine/gpu/run.js — Vòng đời một bức ở tầng 3D: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ.
import { Color } from 'three/webgpu';
import { mergePalette } from '../palette.js';
import { isMobile, pickLevel, budgetFor } from '../quality.js';
import { createStage } from './stage.js';
import { createDisposer } from './disposer.js';
import { createWeights, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createFailCounter, createBurstCounter } from './guards.js';
import { createInput } from './input.js';
import { mountDebug } from './debug.js';

/** content.<lang>.js của bức, hoặc null nếu bức không có hay tải hỏng (3D không phụ thuộc chữ). */
function loadContent(entry, lang) {
  const load = entry.content?.[lang];
  if (!load) return Promise.resolve(null);
  return load().then((m) => m.default, (err) => {
    console.warn(`Không tải được chữ của bức (${lang}):`, err);
    return null;
  });
}

/** Công cụ ?debug (engine/gpu/debug.js), đăng ký vào disposer; tải hỏng thì null (chế độ thợ không được làm hỏng cảnh). */
async function loadDebug(mode, renderer, disposer) {
  try {
    const tool = await mountDebug(mode, renderer);
    if (tool) disposer.add(() => tool.dispose());
    return tool;
  } catch (err) {
    console.warn('Không mở được công cụ ?debug:', err);
    return null;
  }
}

/**
 * Chạy một bức ở tầng A/B (spec §8.5). boot.js gọi hàm này qua import() động, trong hạn 10 giây.
 * Resolve { dispose } khi cảnh đã "live". Ném lỗi (sau khi tự gỡ sạch) nếu hỏng TRƯỚC khi live;
 * hỏng SAU khi live thì gọi onFail(reason, error) đúng một lần.
 * @param {import('../contracts/painting.js').PaintingEntry} entry
 * @param {object} shell   vỏ trang (ui/shell.js): setState, stageEl, crossfade, showBadge, showHint, invite
 * @param {object} opts
 * @param {'webgpu'|'webgl2'} opts.tier   tầng boot dò được (backend thật có thể khác: xem stage.backend)
 * @param {object} opts.flags             kết quả readFlags()
 * @param {Date} opts.now                 flags.at ?? giờ thật, cố định lúc khởi động
 * @param {string} opts.lang              ngôn ngữ trang (GĐ 1 dùng để tải content)
 * @param {object} opts.t                 chữ giao diện (Sổ tay GĐ 2 dùng; gợi ý của bức nằm trong content)
 * @param {object} opts.sma               window.__sma (engine/sma.js)
 * @param {(reason: string, error?: unknown) => void} opts.onFail   về tầng tĩnh
 * @param {Window} [opts.win]
 * @returns {Promise<{ dispose: () => void }>}
 */
export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail, win = window }) {
  const disposer = createDisposer();
  const handle = { dispose: () => disposer.closeAll() };
  let failed = false;

  // fail() chạy MỘT lần: gỡ mọi thứ theo thứ tự ngược, rồi báo boot về tầng tĩnh với lý do.
  const fail = (reason, error) => {
    if (failed) return;
    failed = true;
    disposer.closeAll();
    onFail(reason, error);
  };
  // Sau mỗi await, trang có thể đã về tầng tĩnh: do fail(), hoặc do boot hết hạn 10 s (showStatic đặt
  // sma.state = 'static'). Khi đó dừng êm: gỡ hết và KHÔNG đụng vào shell nữa.
  const stopped = () => failed || sma.state === 'static';
  const quit = () => {
    disposer.closeAll();
    return handle;
  };

  const hex = mergePalette(entry.meta.palette);
  const reducedMotion = Boolean(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  try {
    // Song song: tải module nặng của bức và dựng renderer. Sân khấu vào disposer NGAY khi dựng xong,
    // nên dù load() hỏng trước, renderer vẫn được gỡ (add() sau closeAll() chạy fn ngay).
    // Chữ của bức (gợi ý…) tải cùng lúc; hỏng thì cảnh 3D vẫn chạy, chỉ thiếu chữ (bảng lỗi §9).
    const [painting, stage, content] = await Promise.all([
      entry.load(),
      createStage({ tier, flags, parent: shell.stageEl, clearColor: hex.denThen, reducedMotion, win }).then((s) => {
        disposer.add(() => s.dispose());
        return s;
      }),
      loadContent(entry, lang),
    ]);
    if (stopped()) return quit();

    stage.onLost((info) => {
      fail('device-lost', new Error(`Mất thiết bị ${info?.api ?? 'GPU'}: ${info?.message ?? ''}`));
    });
    const gpuErrors = createBurstCounter({ limit: 3, windowMs: 1000 });
    stage.onError((info) => {
      console.error(`Lỗi GPU ${info?.type ?? ''}: ${info?.message ?? ''}`);
      if (gpuErrors.hit(win.performance.now())) fail('gpu-error', new Error(info?.message ?? 'Lỗi GPU'));
    });

    stage.useCamera(painting.camera);
    const mobile = isMobile(win.navigator);
    // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2).
    const level = pickLevel({ tier: stage.backend, mobile });
    const budget = budgetFor(level, painting.quality);
    stage.setDpr(budget.dpr);
    sma.set({ backend: stage.backend, level });

    const weights = createWeights(entry.meta.layers);
    /** @type {import('../contracts/runtime.js').EngineCtx} */
    const ctx = {
      tier: stage.backend,
      level,
      budget,
      mobile,
      reducedMotion,
      now,
      renderer: stage.renderer,
      scene: stage.scene,
      camera: stage.camera,
      palette: { hex, color: (token) => new Color(hex[token]) },
      u: stage.u,
      weight: (id) => weights.weight(id),
      debug: Boolean(flags.debug),
    };

    // setup() của bức (GĐ 1) chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
    const setup = painting.setup?.(ctx);
    if (setup?.dispose) disposer.add(() => setup.dispose());
    const shared = setup?.shared ?? {};
    // Thứ tự đăng ký = stage → setup → lớp → pipeline → vòng lặp; closeAll() gỡ NGƯỢC lại.
    const layers = buildLayers(painting.layers, ctx, shared, { tier: ctx.tier, level, budget, now, mobile });
    for (const { layer } of layers) disposer.add(() => layer.dispose());
    // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
    ensureEmissive(stage.scene, {
      warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
    });
    const pipeline = createPipeline({
      renderer: stage.renderer,
      scene: stage.scene,
      camera: stage.camera,
      layers,
      weight: ctx.weight,
    });
    disposer.add(() => pipeline.dispose());

    // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
    const input = createInput({
      canvas: stage.renderer.domElement,
      camera: stage.camera,
      controls: stage.controls,
      pointer: stage.u.pointer,
      win,
    });
    disposer.add(() => input.dispose());

    // Biên dịch trước bằng scenePass.compileAsync (có MRT + render target của pass), trong lúc poster còn hiện.
    // ?debug / ?debug=stats tải song song; hỏng thì chỉ cảnh báo, cảnh vẫn chạy.
    shell.setState('compiling');
    const [, debugTool] = await Promise.all([pipeline.compile(), loadDebug(flags.debug, stage.renderer, disposer)]);
    if (stopped()) return quit();

    const limit = typeof flags.freeze === 'number' ? flags.freeze : Infinity;
    let frames = 0;
    // Một khung: đồng hồ → cử chỉ → setup.update → layer.update theo thứ tự → camera → render → đếm khung.
    const step = (ms) => {
      const { t: time, dt } = stage.tick(ms);
      for (const g of input.drain()) setup?.onGesture?.(g);
      setup?.update?.(dt, time);
      for (const { layer } of layers) layer.update?.(dt, time);
      stage.breathe(time);
      stage.controls?.update();
      pipeline.render();
      debugTool?.update();
      frames += 1;
      sma.frame();
    };

    // Khung ẩn (là khung 1): canvas còn opacity 0 sau poster. Reflector, bóng, bloom, quad… chưa được
    // compileAsync biên dịch, nên chúng biên dịch nốt ở khung này thay vì làm khựng lúc đã hiện.
    step(win.performance.now());
    shell.setState('fading');
    await shell.crossfade(stage.renderer.domElement);
    if (stopped()) return quit();
    shell.setState('live');
    shell.showBadge({ tier: stage.backend, level });
    // Gợi ý của bức ("Chạm vào mặt nước"); lần chạm đầu tiên đổi thành lời mời mài lớp.
    if (content?.hint) shell.showHint(content.hint);
    input.onFirst(() => shell.invite());

    const frameErrors = createFailCounter({ limit: 3 });
    const loop = (ms) => {
      if (failed) return;
      try {
        step(ms);
        frameErrors.ok();
      } catch (err) {
        // Lỗi JS trong một khung: ghi log, bỏ qua khung đó; 3 khung lỗi LIÊN TIẾP → tầng tĩnh.
        console.error('Lỗi trong một khung:', err);
        if (frameErrors.fail()) fail('frame-errors', err);
        return;
      }
      // ?freeze=N: dừng vòng lặp sau khung N; canvas giữ nguyên khung N, __sma.frames === N.
      if (frames >= limit) stage.renderer.setAnimationLoop(null);
    };
    disposer.add(() => stage.renderer.setAnimationLoop(null));
    if (frames < limit) stage.renderer.setAnimationLoop(loop);
    return handle;
  } catch (err) {
    disposer.closeAll();
    // fail() đã báo tầng tĩnh với lý do đúng (vd. 'device-lost'); đừng để boot ghi đè thành 'error'.
    if (failed) return handle;
    throw err;
  }
}
```

- [ ] **Step 5: E2E: hai công cụ hiện, cảnh vẫn chạy, không lỗi console**

`e2e/painting.spec.js`: ngay trước dòng chú thích `// Review Focus #5 · giảm chuyển động…` trong `test.describe(\`${meta.title} · 3D\``, thêm:
```js
    for (const [flag, name] of [['debug', 'inspector'], ['debug=stats', 'stats']]) {
      test(`?${flag} → công cụ thợ "${name}" hiện, cảnh vẫn chạy, không lỗi console`, async ({ page }, testInfo) => {
        const { query } = testInfo.project.metadata;
        await page.goto(urlOf(htmlPage, query, flag, 'freeze=20'));
        const settled = await waitForSettled(page);
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        await expect(page.locator(`[data-debug="${name}"]`)).toBeAttached();
        const sma = await waitForFrames(page, 20);
        expect(sma.state).toBe('live');
        expect(log.errors).toEqual([]);
      });
    }

```

Run: `npm run build && npx playwright test --project=static --project=webgl2-swiftshader`
Expected: PASS. `npm run build` in ra hai chunk mới chỉ tải khi có cờ: `Inspector-*.js` (~39 KB gzip) và `main-*.js` (stats-gl, ~9 KB gzip).

Kiểm tay: `npm run dev`, mở `…/?webgl&debug` (bảng Inspector hiện ở cạnh dưới) và `…/?webgl&debug=stats` (biểu đồ FPS/CPU/GPU ở góc trên trái).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/engine/gpu/debug.js src/engine/gpu/run.js tests/unit/debug.test.js e2e/painting.spec.js
git commit -m "feat(engine): chế độ thợ ?debug (three.js Inspector) và ?debug=stats (stats-gl), chỉ tải bằng import() động

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: `setup()` của Bức 1 (`shared.js`), gợi ý của bức, bộ dựng bức trong Node

**Mục tiêu:** Spec §7 (giờ), §6 L4 (gợn sóng), §6 L5 (điểm hút), §8.4 (`PaintingSetup`), §8.6: phần dùng chung của Bức 1 nằm ở `shared.js`, chạy TRƯỚC mọi `createLayer`:
- **giờ mặc định** theo chính sách của bức (đêm: giờ thật; ngày: 21:00 + ghi chú `daytime`) trong uniform `uHour` (Dial GĐ 4 chỉ cần đổi uniform này);
- **hướng trăng** theo giờ (mọc trái, cao nhất nửa đêm, lặn phải; tính nghệ thuật, góc nhỏ để luôn trong khung);
- **bộ đệm vòng 8 gợn sóng** và hàm TSL `makeRippleHeight` (một hàm cho cả pháp tuyến nước lẫn độ nhấp nhô của lá);
- **điểm hút đom đóm** theo cử chỉ; `onGesture` giao tia với mặt nước y = 0.

Thêm `content.vi.js` (gợi ý) và `tests/helpers/fake-ctx.js` (dựng bức trong Node như `run.js`, các task lớp sau dùng).

**Files:**
- Create: `src/paintings/ao-sen-dem/shared.js`, `src/paintings/ao-sen-dem/content.vi.js`, `tests/helpers/fake-ctx.js`, `tests/paintings/ao-sen-dem/shared.test.js`
- Modify: `src/paintings/ao-sen-dem/index.js` (`content`), `src/paintings/ao-sen-dem/painting.js` (`export { setup }`)

**Interfaces:**
- Consumes: `tonight`, `hourOfNight` (`lib/astro/moon.js`); `ctx.now`, `ctx.u.time`, `ctx.reducedMotion`; `Gesture` (Task 5).
- Produces (Task 10–13 dùng):
  - `POND_RADIUS = 60`, `RIPPLE_SLOTS = 8`, `defaultHour(now) → { hour, note }`, `moonDirection(hour) → [x, y, z]`, `createRipples() → { slots: Vector4[], node, add(x, z, t, amp) }`, `makeRippleHeight({ ripples, time, amplitude, speed, decay, wavelength }) → (xz) => node float`.
  - `setup(ctx) → { shared, onGesture(g), update(dt) }` với `shared = { hour: uniform, hourNote, moon: { dir: uniform vec3 }, ripples, attract: { point: uniform vec3, strength: uniform } }`.
  - `fake-ctx.js`: `NOW`, `makeEngineCtx(meta, { level, budget, now, reducedMotion, tier })` (có thêm `weights` để test đặt trọng số), `buildPainting(painting, meta, { until, ...options }) → { ctx, setup, shared, layers: Record<id, Layer> }`.

- [ ] **Step 1: Bộ dựng bức trong Node**

`tests/helpers/fake-ctx.js`:
```js
// tests/helpers/fake-ctx.js — dựng một bức trong Node (không GPU) giống run.js: EngineCtx giả, setup(), rồi các lớp theo thứ tự.
import { vi } from 'vitest';
import { Color, PerspectiveCamera, Scene, Vector2 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { mergePalette } from '../../src/engine/palette.js';
import { buildLayers, createWeights } from '../../src/engine/gpu/layers.js';

/** "Bây giờ" mặc định của test: 21:00 giờ Việt Nam, ngày 18 tháng Tám năm Bính Ngọ. */
export const NOW = new Date('2026-09-28T21:00:00+07:00');

/**
 * EngineCtx giả, cùng hình dạng với ctx của run.js. Scene, camera, uniform là đồ thật của three
 * (dựng được node graph trong Node); renderer chỉ ghi lời gọi compute và giữ cờ shadowMap.
 * @param {object} meta  PaintingMeta
 */
export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, reducedMotion = false, tier = 'webgpu' } = {}) {
  const hex = mergePalette(meta.palette);
  const weights = createWeights(meta.layers);
  return {
    tier,
    level,
    budget,
    mobile: false,
    reducedMotion,
    now,
    renderer: { compute: vi.fn(), shadowMap: { enabled: false } },
    scene: new Scene(),
    camera: new PerspectiveCamera(40, 1.6, 0.1, 500),
    palette: { hex, color: (token) => new Color(hex[token]) },
    u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
    weight: weights.weight,
    weights, // chỉ test dùng: đặt trọng số bằng weights.set(id, v)
    debug: false,
  };
}

/**
 * Dựng bức như run.js: setup(ctx) rồi buildLayers (cùng hàm của xưởng). `until` = id lớp cuối cần dựng.
 * @returns {{ ctx: object, setup: object | undefined, shared: object, layers: Record<string, object> }}
 */
export function buildPainting(painting, meta, { until, ...options } = {}) {
  const ctx = makeEngineCtx(meta, options);
  const setup = painting.setup?.(ctx);
  const shared = setup?.shared ?? {};
  const end = until ? painting.layers.findIndex((m) => m.id === until) + 1 : painting.layers.length;
  const env = { tier: ctx.tier, level: ctx.level, budget: ctx.budget, now: ctx.now, mobile: ctx.mobile };
  const built = buildLayers(painting.layers.slice(0, end), ctx, shared, env);
  return { ctx, setup, shared, layers: Object.fromEntries(built.map((b) => [b.id, b.layer])) };
}
```

- [ ] **Step 2: Test của `shared.js`**

`tests/paintings/ao-sen-dem/shared.test.js`:
```js
// tests/paintings/ao-sen-dem/shared.test.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, cử chỉ.
import { describe, it, expect } from 'vitest';
import { Ray, Vector3 } from 'three/webgpu';
import { vec2 } from 'three/tsl';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import {
  RIPPLE_SLOTS,
  createRipples,
  defaultHour,
  makeRippleHeight,
  moonDirection,
  setup,
} from '../../../src/paintings/ao-sen-dem/shared.js';
import { NOW, makeEngineCtx } from '../../helpers/fake-ctx.js';

const vn = (s) => new Date(`${s}+07:00`);
/** Tia thẳng đứng từ trên cao xuống điểm (x, z) của mặt nước. */
const down = (x, z) => new Ray(new Vector3(x, 10, z), new Vector3(0, -1, 0));

describe('defaultHour: chính sách giờ của Bức 1', () => {
  it('đêm dùng giờ thật trên thang 18 → 29,5', () => {
    expect(defaultHour(vn('2026-09-28T21:00'))).toEqual({ hour: 21, note: null });
    expect(defaultHour(vn('2026-09-29T02:00'))).toEqual({ hour: 26, note: null });
    expect(defaultHour(vn('2026-09-29T05:00')).hour).toBeCloseTo(29, 6);
  });

  it('ban ngày mượn 21:00, ghi chú daytime', () => {
    expect(defaultHour(vn('2026-09-28T12:00'))).toEqual({ hour: 21, note: 'daytime' });
    expect(defaultHour(vn('2026-09-29T05:30'))).toEqual({ hour: 21, note: 'daytime' });
  });
});

describe('moonDirection: trăng mọc trái, cao nhất nửa đêm, lặn phải', () => {
  it('vector đơn vị, luôn ở trên mặt nước và phía trước camera (z < 0)', () => {
    for (let h = 18; h <= 29.5; h += 0.5) {
      const [x, y, z] = moonDirection(h);
      expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
      expect(y).toBeGreaterThan(0);
      expect(z).toBeLessThan(0);
    }
  });

  it('18:00 bên trái, 23:45 chính giữa và cao nhất, 05:30 bên phải', () => {
    expect(moonDirection(18)[0]).toBeLessThan(-0.3);
    expect(moonDirection(23.75)[0]).toBeCloseTo(0, 6);
    expect(moonDirection(29.5)[0]).toBeGreaterThan(0.3);
    const highest = moonDirection(23.75)[1];
    for (const h of [18, 21, 26, 29.5]) expect(moonDirection(h)[1]).toBeLessThan(highest);
  });

  it('giờ ngoài thang bị kẹp về 18 hoặc 29,5', () => {
    expect(moonDirection(10)).toEqual(moonDirection(18));
    expect(moonDirection(40)).toEqual(moonDirection(29.5));
  });
});

describe('createRipples: bộ đệm vòng 8 gợn', () => {
  it('ghi lần lượt; gợn thứ 9 đè lên gợn đầu tiên', () => {
    const r = createRipples();
    expect(r.slots).toHaveLength(RIPPLE_SLOTS);
    expect(r.node.array).toBe(r.slots); // uniformArray đọc thẳng mảng này mỗi khung
    for (let i = 0; i < 9; i++) r.add(i, -i, i * 0.1, 1);
    expect(r.slots[0].toArray()).toEqual([8, -8, 0.8, 1]);
    expect(r.slots[1].toArray()).toEqual([1, -1, 0.1, 1]);
  });

  it('makeRippleHeight dựng được node trong Node (không GPU)', () => {
    const r = createRipples();
    const height = makeRippleHeight({ ripples: r.node, time: 0, amplitude: 1, speed: 3, decay: 0.5, wavelength: 1.4 });
    expect(height(vec2(0, 0)).isNode).toBe(true);
  });
});

describe('setup(ctx)', () => {
  it('shared: giờ, hướng trăng theo giờ, gợn sóng, điểm hút', () => {
    const { shared } = setup(makeEngineCtx(meta));
    expect(shared.hour.value).toBe(21);
    expect(shared.hourNote).toBeNull();
    expect(shared.moon.dir.value.toArray()).toEqual(moonDirection(21));
    expect(shared.ripples.slots).toHaveLength(RIPPLE_SLOTS);
    expect(shared.attract.strength.value).toBe(0);
  });

  it('chạm lên mặt nước: một gợn tại điểm chạm, lúc ctx.u.time; đom đóm quanh đó tản ra', () => {
    const ctx = makeEngineCtx(meta);
    const s = setup(ctx);
    ctx.u.time.value = 2.5;
    s.onGesture({ kind: 'tap', ray: down(3, 4) });
    expect(s.shared.ripples.slots[0].toArray()).toEqual([3, 4, 2.5, 1]);
    expect(s.shared.attract.point.value.toArray()).toEqual([3, 1.2, 4]);
    expect(s.shared.attract.strength.value).toBeLessThan(0);
  });

  it('chạm ngoài ao hoặc tia không cắt mặt nước thì bỏ qua', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'tap', ray: down(100, 0) });
    s.onGesture({ kind: 'tap', ray: new Ray(new Vector3(0, 5, 0), new Vector3(1, 0, 0)) });
    expect(s.shared.ripples.slots.every((v) => v.w === 0)).toBe(true);
  });

  it('giữ tay: lực hút lên dần tới 1; thả tay: đẩy ra rồi tắt dần', () => {
    const s = setup(makeEngineCtx(meta));
    s.onGesture({ kind: 'hold-start', ray: down(0, 10) });
    s.update(0.25, 0.25);
    expect(s.shared.attract.strength.value).toBeCloseTo(0.5, 6);
    s.update(1, 1.25);
    expect(s.shared.attract.strength.value).toBe(1);
    s.onGesture({ kind: 'hold-end', ray: down(0, 10) });
    expect(s.shared.attract.strength.value).toBe(-1.5);
    s.update(1, 2.25);
    expect(s.shared.attract.strength.value).toBeCloseTo(-1.5 * Math.exp(-2.5), 6);
  });

  it('giảm chuyển động: gợn sóng nửa biên độ (§10)', () => {
    const s = setup(makeEngineCtx(meta, { reducedMotion: true }));
    s.onGesture({ kind: 'tap', ray: down(0, 0) });
    expect(s.shared.ripples.slots[0].w).toBe(0.5);
  });

  it('update: trăng đi theo uniform giờ (Dial của GĐ 4 chỉ cần đổi uniform này)', () => {
    const s = setup(makeEngineCtx(meta, { now: NOW }));
    s.shared.hour.value = 26;
    s.update(1 / 60, 0);
    expect(s.shared.moon.dir.value.toArray()).toEqual(moonDirection(26));
  });
});
```

Run: `npx vitest run tests/paintings/ao-sen-dem/shared.test.js`
Expected: FAIL: không tải được `src/paintings/ao-sen-dem/shared.js`.

- [ ] **Step 3: Viết `shared.js`**

`src/paintings/ao-sen-dem/shared.js`:
```js
// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, điểm hút đom đóm, cử chỉ.
import { Plane, Vector3, Vector4 } from 'three/webgpu';
import { Fn, Loop, exp, float, length, sin, step, uniform, uniformArray } from 'three/tsl';
import { hourOfNight, tonight } from '../../lib/astro/moon.js';

export const POND_RADIUS = 60; // bằng bán kính đĩa nước của lớp 4: chạm ngoài đĩa thì không gợn
export const RIPPLE_SLOTS = 8;
const NIGHT = { start: 18, end: 29.5, fallback: 21 }; // thang giờ của Bức 1: 18:00 → 05:30 sáng hôm sau
const FLY_HEIGHT = 1.2; // điểm hút đom đóm nằm trên mặt nước một chút

/**
 * Chính sách giờ của Bức 1 (§7): đang là đêm thì dùng giờ thật (21:00 → 21, 02:00 → 26);
 * ban ngày thì mượn 21:00 và ghi chú 'daytime'. Hộp màu chỉ trả số, chính sách nằm ở đây.
 * @param {Date} now
 * @returns {{ hour: number, note: 'daytime' | null }}
 */
export function defaultHour(now) {
  const { instant, isNight, evening } = tonight(now);
  return isNight ? { hour: hourOfNight(instant, evening), note: null } : { hour: NIGHT.fallback, note: 'daytime' };
}

/**
 * Hướng (vector đơn vị, world) từ tâm ao tới trăng theo giờ. Tính nghệ thuật, không theo thiên văn:
 * camera nhìn về −z (phía nam), nên trăng mọc bên TRÁI (đông), cao nhất lúc nửa đêm, lặn bên PHẢI (tây).
 * Góc giữ nhỏ (±20° ngang, 4°–13° cao) để trăng và bóng trăng luôn nằm trong khung.
 * @param {number} hour  18 → 29.5
 * @returns {[number, number, number]}
 */
export function moonDirection(hour) {
  const s = Math.min(Math.max((hour - NIGHT.start) / (NIGHT.end - NIGHT.start), 0), 1);
  const azimuth = (s - 0.5) * 0.7;
  const altitude = 0.07 + 0.16 * Math.sin(Math.PI * s);
  return [Math.sin(azimuth) * Math.cos(altitude), Math.sin(altitude), -Math.cos(azimuth) * Math.cos(altitude)];
}

/**
 * Bộ đệm vòng 8 gợn sóng: mỗi ô vec4(x, z, lúc bắt đầu, biên độ). Chạm lần thứ 9 ghi đè gợn cũ nhất.
 * uniformArray tự tải lại cả mảng lên GPU mỗi khung (updateType RENDER), nên chỉ cần sửa slots[i].
 */
export function createRipples() {
  const slots = Array.from({ length: RIPPLE_SLOTS }, () => new Vector4(0, 0, -1e4, 0));
  let next = 0;
  return {
    slots,
    node: uniformArray(slots, 'vec4'),
    /** Thêm một gợn tại (x, z), bắt đầu lúc t (giây của ctx.u.time). */
    add(x, z, t, amplitude = 1) {
      slots[next].set(x, z, t, amplitude);
      next = (next + 1) % RIPPLE_SLOTS;
    },
  };
}

/**
 * Hàm TSL độ cao gợn sóng h(xz): cộng 8 vòng sóng đang lan. MỘT hàm dùng chung cho pháp tuyến
 * của nước và độ nhấp nhô của lá (lớp 4 dựng hàm này bằng núm của chính nó).
 * Mỗi vòng: sóng sin quanh bán kính age × speed, chỉ nhô gần đỉnh vòng (hình chuông),
 * tắt dần theo exp(−age × decay). step(0, age) = 0 khi gợn chưa bắt đầu.
 * @param {{ ripples: any, time: any, amplitude: any, speed: any, decay: any, wavelength: any }} p  node hoặc uniform
 * @returns {(xz: any) => any}  gọi được trong TSL: height(positionWorld.xz)
 */
export function makeRippleHeight({ ripples, time, amplitude, speed, decay, wavelength }) {
  return Fn(([xz]) => {
    const h = float(0).toVar();
    Loop(RIPPLE_SLOTS, ({ i }) => {
      const r = ripples.element(i);
      const age = time.sub(r.z);
      const x = length(xz.sub(r.xy)).sub(age.mul(speed)); // khoảng cách tới đỉnh vòng đang lan
      const ring = exp(x.div(wavelength).pow(2).negate());
      const fade = exp(age.mul(decay).negate()).mul(step(0, age));
      h.addAssign(sin(x.mul(Math.PI * 2).div(wavelength)).mul(ring).mul(fade).mul(r.w));
    });
    return h.mul(amplitude);
  });
}

/**
 * setup() của Bức 1: xưởng gọi TRƯỚC mọi createLayer; `shared` đi vào tham số thứ 2 của từng lớp.
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const { hour, note } = defaultHour(ctx.now);
  const uHour = uniform(hour).setName('uHour');
  const moonDir = uniform(new Vector3(...moonDirection(hour))).setName('moonDir');
  const ripples = createRipples();
  const attract = { point: uniform(new Vector3(0, FLY_HEIGHT, 0)), strength: uniform(0) };
  const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng nhẹ hơn

  const water = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  let holding = false;

  return {
    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract },

    // Cử chỉ mà không công cụ nào dùng. Tia đi từ camera qua ngón tay; bức tự giao với mặt nước y = 0.
    onGesture(g) {
      if (!g.ray?.intersectPlane(water, hit) || Math.hypot(hit.x, hit.z) > POND_RADIUS) return;
      attract.point.value.set(hit.x, FLY_HEIGHT, hit.z);
      if (g.kind === 'tap') {
        ripples.add(hit.x, hit.z, ctx.u.time.value, rippleAmp);
        attract.strength.value = -0.6; // chạm: đom đóm quanh đó tản ra
      } else if (g.kind === 'hold-start' || g.kind === 'hold-move') {
        holding = true;
      } else if (g.kind === 'hold-end') {
        holding = false;
        attract.strength.value = -1.5; // thả tay: bung ra như tia lửa lò rèn
      }
    },

    // Mỗi khung, TRƯỚC các lớp: trăng theo giờ; lực hút tiến dần về 1 khi giữ, tắt dần khi thả.
    update(dt) {
      moonDir.value.set(...moonDirection(uHour.value));
      const s = attract.strength;
      s.value = holding ? Math.min(s.value + dt * 2, 1) : s.value * Math.exp(-dt * 2.5);
    },
  };
}
```
Điểm học: `uniformArray(slots, 'vec4')` tự tải lại cả mảng lên GPU mỗi khung (updateType RENDER), nên thêm gợn chỉ là sửa `slots[i]`. Trong `makeRippleHeight`, `Loop(8, …)` sinh vòng lặp thật trong shader; `step(0, age)` tắt gợn chưa bắt đầu mà không cần `If`.

Run: `npx vitest run tests/paintings/ao-sen-dem/shared.test.js`
Expected: PASS (13 test).

- [ ] **Step 4: Nối vào bức: `setup` và `content`**

`src/paintings/ao-sen-dem/painting.js`: ngay sau dòng `export const layers = [cot, matNuoc, vangLa, phuBong];`, thêm:
```js

/** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, cử chỉ (shared.js). */
export { setup } from './shared.js';
```

`src/paintings/ao-sen-dem/content.vi.js`:
```js
// paintings/ao-sen-dem/content.vi.js — chữ tiếng Việt của Bức 1: gợi ý tương tác (GĐ 1); Hiểu/Phá của từng lớp (GĐ 2).

/** @type {import('../../engine/contracts/painting.js').PaintingContent} */
export default {
  hint: 'Chạm vào mặt nước',
};
```

Thay `src/paintings/ao-sen-dem/index.js` bằng:
```js
// paintings/ao-sen-dem/index.js — cửa vào nhẹ của Bức 1: meta có ngay, phần nặng (three) chỉ tải khi gọi load().
import meta from './meta.js';

/**
 * import() động: bundler tách painting.js (và three) ra chunk riêng,
 * nên trang tĩnh (tầng C) không bao giờ tải three.
 * @type {import('../../engine/contracts/painting.js').PaintingEntry}
 */
export default {
  meta,
  load: () => import('./painting.js'),
  content: { vi: () => import('./content.vi.js') },
};
```
(`content` là `import()` động: chữ không nằm trên đường nhẹ, và tầng tĩnh không tải nó.)

- [ ] **Step 5: Chạy toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  364 passed (364)`. Hàng rào từ vựng chỉ quét xưởng, nên `shared.js` được dùng `ripple`, `moonDir`, `uHour`.

Run: `npm run build && npx playwright test --project=static --project=webgl2-swiftshader`
Expected: PASS.

Kiểm tay: `npm run dev`, mở `…/?webgl&at=2026-09-28T21:00`: khi cảnh hiện, dòng *"Chạm vào mặt nước"* hiện giữa khung; chạm một lần thì thành *"Bức tranh này có 4 lớp — mài thử?"* (Task 11 thêm lớp thứ 5). Chưa thấy gợn sóng: lớp Mặt nước v0 chưa đọc `shared.ripples` (Task 12).

- [ ] **Step 6: Commit**

```bash
git add src/paintings/ao-sen-dem/shared.js src/paintings/ao-sen-dem/content.vi.js src/paintings/ao-sen-dem/index.js src/paintings/ao-sen-dem/painting.js tests/helpers/fake-ctx.js tests/paintings/ao-sen-dem/shared.test.js
git commit -m "feat(ao-sen-dem): setup() với giờ đêm nay, hướng trăng, 8 gợn sóng, điểm hút; gợi ý của bức

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Lớp 1 · Cốt hoàn chỉnh (lá nổi, lá đứng, hoa nở bằng uniform, cuống, lau sậy) + bố cục camera

**Mục tiêu:** Spec §6 L1: cả ao là đất sét dựng bằng instancing, khoảng 6 draw call:
- **lá nổi** (90% số lá theo mức) và **lá đứng** trên cuống (khoảng 10%, lõm sâu như cái phễu);
- **12 bông + 20 nụ** dựng từ MỘT cánh sen được instance (3 vòng cánh, gương sen và nhị). Hai bông "chủ đề" đặt tay ở tiền cảnh hai bên lối trăng, như bông sen giữa poster;
- **cuống** chung một InstancedMesh; **300 ngọn lau** thành khóm ở rìa ao;
- đèn xưởng như cũ.

Núm `openness` (uniform) mở/khép hoa không biên dịch lại: `positionNode` xoay từng cánh quanh bản lề của nó (Rodrigues) và xoay cả `normalLocal`, nên ánh sáng đúng với cánh đã ngả (đã kiểm trên cả hai backend). Mỗi việc ngẫu nhiên một hạt giống riêng: số lá đổi theo mức nhưng hoa và lau thì mức nào cũng như nhau. Camera đổi sang bố cục nhìn về trăng (Task 11 thêm trăng) và khai báo `breathe`.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/cot-leaf.js`, `parts/cot-flower.js`, `parts/cot-reeds.js`, `tests/paintings/ao-sen-dem/cot.test.js`
- Modify: `src/paintings/ao-sen-dem/layers/l1-cot.js` (viết lại), `meta.js` (file của Cốt), `painting.js` (camera)
- Modify: `tests/paintings/ao-sen-dem.test.js` (bỏ phần `l1-cot` cũ)

**Interfaces:**
- Consumes: `mulberry32`, `randRange` (`lib/random.js`); `ctx.budget.leaves ?? { cao: 1200, vua: 800, thap: 500 }[level]`; `ctx.knob('openness')`.
- Produces: `knobs = [{ id: 'openness', value: 0.85 }]`. `layer.objects = [leaves, standingLeaves, petals, cores, stems, reeds]` (6 InstancedMesh, đúng thứ tự này). `shared.cot = { leafMaterial, standingMaterial, petalMaterial, coreMaterial, stemMaterial, reedMaterial, petalGeometry, hemi, hemiIntensity, casters: [standingLeaves, petals, cores, stems], receivers: [leaves] }`. Lá và cánh là `MeshPhysicalNodeMaterial` (Task 11 thêm clearcoat/sheen mà không đổi loại material). Geometry lá nổi có thuộc tính instance `instanceCenter` (vec2); geometry lõi hoa có thuộc tính `part` (0 gương, 1 nhị).

- [ ] **Step 1: Test mới của Cốt**

`tests/paintings/ao-sen-dem/cot.test.js`:
```js
// tests/paintings/ao-sen-dem/cot.test.js — Lớp 1 · Cốt: lá nổi, lá đứng, hoa và nụ (nở theo uniform), cuống, lau sậy.
import { describe, it, expect } from 'vitest';
import { Matrix4, Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as cot from '../../../src/paintings/ao-sen-dem/layers/l1-cot.js';
import { makeLeafGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-leaf.js';
import { makePetalGeometry } from '../../../src/paintings/ao-sen-dem/parts/cot-flower.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'cot', ...options });
/** Vị trí (x, z) của instance i trong một InstancedMesh. */
const at = (mesh, i) => new Vector3().setFromMatrixPosition(mesh.getMatrixAt(i, new Matrix4()));

describe('hình học', () => {
  it('một chiếc lá: 40–80 đỉnh, mặt trên hướng lên', () => {
    const g = makeLeafGeometry();
    expect(g.getAttribute('position').count).toBeGreaterThanOrEqual(40);
    expect(g.getAttribute('position').count).toBeLessThanOrEqual(80);
    expect(g.getAttribute('normal').getY(0)).toBeGreaterThan(0.9);
  });

  it('một cánh sen: gốc ở 0, mũi ở y = 1, có uv dọc cánh', () => {
    const g = makePetalGeometry();
    g.computeBoundingBox();
    expect(g.boundingBox.min.y).toBeCloseTo(0, 6);
    expect(g.boundingBox.max.y).toBeCloseTo(1, 6);
    expect(g.getAttribute('uv').itemSize).toBe(2);
  });
});

describe('l1-cot', () => {
  it('lá nổi + lá đứng = số lá theo mức; khoảng 10% là lá đứng', () => {
    for (const [level, total] of [['cao', 1200], ['vua', 800], ['thap', 500]]) {
      const { shared } = build({ level });
      const [leaves, standing] = [shared.cot.receivers[0], shared.cot.casters[0]];
      expect(leaves.count + standing.count, level).toBe(total);
      expect(standing.count / total).toBeGreaterThan(0.05);
      expect(standing.count / total).toBeLessThan(0.15);
    }
    const { shared } = build({ budget: { leaves: 40 } });
    expect(shared.cot.receivers[0].count + shared.cot.casters[0].count).toBe(40);
  });

  it('tâm instance của lá nổi khớp ma trận (lớp Mặt nước đọc để lá nhấp nhô)', () => {
    const [leaves] = build().shared.cot.receivers;
    const centers = leaves.geometry.getAttribute('instanceCenter');
    expect([centers.itemSize, centers.count]).toEqual([2, leaves.count]);
    for (let i = 0; i < leaves.count; i++) {
      const p = at(leaves, i);
      expect([centers.getX(i), centers.getY(i)]).toEqual([p.x, p.z]);
    }
  });

  it('theo hạt giống cố định; hoa và lau không đổi theo mức; lối trăng trước camera trống', () => {
    const a = build().layers.cot.objects;
    const b = build().layers.cot.objects;
    a.forEach((mesh, i) => expect(Array.from(mesh.instanceMatrix.array)).toEqual(Array.from(b[i].instanceMatrix.array)));
    const low = build({ level: 'thap' }).layers.cot.objects;
    for (const k of [2, 3, 5]) expect(Array.from(low[k].instanceMatrix.array)).toEqual(Array.from(a[k].instanceMatrix.array));
    for (const mesh of a.slice(0, 4)) {
      for (let i = 0; i < mesh.count; i++) {
        const { x, z } = at(mesh, i);
        expect(Math.abs(x) < 1.5 && z > -40 && z < 15, `${mesh.name || 'mesh'} ${i} trên lối trăng`).toBe(false);
      }
    }
  });

  it('hoa: 12 bông × 24 cánh + 20 nụ × 5 cánh trong MỘT InstancedMesh; nụ không nở', () => {
    const [, , petals, cores, stems] = build().layers.cot.objects;
    expect(petals.count).toBe(12 * 24 + 20 * 5);
    const hinge = petals.geometry.getAttribute('petalHinge');
    expect(hinge.count).toBe(petals.count);
    expect(hinge.getW(0)).toBeGreaterThan(0); // cánh hoa: có góc mở thêm
    expect(hinge.getW(petals.count - 1)).toBe(0); // cánh nụ: không mở
    expect(petals.material.positionNode).toBeTruthy(); // nở theo uniform openness
    expect(cores.count).toBe(12);
    expect(stems.count).toBeGreaterThanOrEqual(12 + 20);
  });

  it('300 ngọn lau ở rìa ao (bán kính 48–60)', () => {
    const reeds = build().layers.cot.objects[5];
    expect(reeds.count).toBe(300);
    for (let i = 0; i < reeds.count; i++) {
      const { x, z } = at(reeds, i);
      expect(Math.hypot(x, z)).toBeGreaterThan(48);
      expect(Math.hypot(x, z)).toBeLessThan(60);
    }
  });

  it('núm openness (uniform); mọi material là đất sét có emissiveNode; lá và cánh là MeshPhysical', () => {
    expect(cot.knobs.map((k) => [k.id, k.value])).toEqual([['openness', 0.85]]);
    const { shared, layers } = build();
    for (const mesh of layers.cot.objects) {
      expect(mesh.isInstancedMesh).toBe(true);
      expect(mesh.material.colorNode).toBeTruthy();
      expect(mesh.material.emissiveNode).toBeTruthy();
    }
    expect(shared.cot.leafMaterial.isMeshPhysicalNodeMaterial).toBe(true);
    expect(shared.cot.petalMaterial.isMeshPhysicalNodeMaterial).toBe(true);
  });

  it('công bố shared.cot; đèn xưởng; dispose gỡ sạch (2 lần vẫn an toàn)', () => {
    const { ctx, shared, layers } = build();
    const c = shared.cot;
    for (const key of ['leafMaterial', 'standingMaterial', 'petalMaterial', 'coreMaterial', 'stemMaterial', 'reedMaterial']) {
      expect(c[key]?.isNodeMaterial, key).toBe(true);
    }
    expect(c.hemi.isHemisphereLight).toBe(true);
    expect(c.hemiIntensity).toBeCloseTo(Math.PI, 6);
    expect(c.petalGeometry.isBufferGeometry).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([...layers.cot.objects, c.hemi]));
    layers.cot.dispose();
    layers.cot.dispose();
    expect(ctx.scene.children).toHaveLength(0);
  });
});
```

Trong `tests/paintings/ao-sen-dem.test.js`: xóa cả khối `describe('l1-cot (Cốt v0)', () => { … });` và dòng `import * as cot from '../../src/paintings/ao-sen-dem/layers/l1-cot.js';` (Cốt đã có file test riêng; phần `l4`/`l5` ở lại tới Task 12, 13).

Run: `npx vitest run tests/paintings/ao-sen-dem/cot.test.js`
Expected: FAIL: không tải được `parts/cot-leaf.js`.

- [ ] **Step 2: Lá: tách hình và cách rải sang `parts/cot-leaf.js`**

`src/paintings/ao-sen-dem/parts/cot-leaf.js` (hình lá và `placeLeaves` giữ nguyên thuật toán v0; `placeLeaves` trả thêm `clumps` để hoa mọc gần cụm lá; đỉnh lối trăng dời về z = 32 theo camera mới, nửa góc 0,12):
```js
// paintings/ao-sen-dem/parts/cot-leaf.js — của lớp Cốt: hình một chiếc lá sen và cách rải lá theo hạt giống, chừa lối trăng.
import { BufferGeometry, Float32BufferAttribute } from 'three/webgpu';
import { randRange } from '../../../lib/random.js';

export const POND_RADIUS = 50; // lá chỉ mọc trong bán kính này (mặt nước của lớp 4 rộng 60)
// "Lối trăng": hình nêm có đỉnh ở chỗ camera mặc định (painting.js, z ≈ 32), mở về phía xa.
const MOON_PATH = { apexZ: 32, halfAngle: 0.12 };

/**
 * Hình học MỘT chiếc lá (bán kính 1): đĩa có khe hình nêm, lõm lòng chảo, mép lượn sóng.
 * Lưới cực: 1 đỉnh tâm + 3 vòng × 19 đỉnh = 58 đỉnh, 90 tam giác. Mọi lá dùng chung hình này.
 */
export function makeLeafGeometry({ segments = 18, rings = 3, notch = 0.35, cup = 0.22, wave = 0.05 } = {}) {
  const position = [0, 0, 0];
  const uv = [0.5, 0.5];
  for (let r = 1; r <= rings; r++) {
    const t = r / rings;
    for (let s = 0; s <= segments; s++) {
      // Góc chạy từ mép khe bên này sang mép khe bên kia: phần "notch" bị bỏ trống thành cái khe.
      const a = notch / 2 + (s / segments) * (Math.PI * 2 - notch);
      const radius = t * (1 + 0.05 * Math.sin(a * 5)); // mép hơi méo cho đỡ tròn vành vạnh
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      const y = cup * t * t + wave * t ** 3 * Math.sin(a * 7); // lòng chảo + mép gợn sóng
      position.push(x, y, z);
      uv.push(x * 0.5 + 0.5, z * 0.5 + 0.5);
    }
  }
  const row = segments + 1;
  const index = [];
  for (let s = 0; s < segments; s++) index.push(0, 2 + s, 1 + s); // quạt tam giác quanh tâm
  for (let r = 1; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = 1 + (r - 1) * row + s; // đỉnh ở vòng trong
      const b = a + row; // đỉnh cùng góc ở vòng ngoài
      index.push(a, b + 1, b, a, a + 1, b + 1); // thứ tự ngược kim đồng hồ nhìn từ trên → mặt trên hướng lên
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals(); // pháp tuyến trơn từ chính các tam giác
  return geometry;
}

/** Điểm (x, z) có nằm trong "lối trăng" không (để bóng trăng phản chiếu không bị lá che). */
export function inMoonPath(x, z) {
  return Math.abs(Math.atan2(x, MOON_PATH.apexZ - z)) < MOON_PATH.halfAngle;
}

/** Một điểm đều theo DIỆN TÍCH trong đĩa: r = R·√u (lấy u thẳng thì tâm đĩa dày hơn mép). */
export function randomInDisc(rng, radius) {
  const r = radius * Math.sqrt(rng());
  const a = rng() * Math.PI * 2;
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

/**
 * Rải lá: vài cụm dày, nước trống giữa các cụm, chừa lối trăng; lá không chồng quá nhiều lên nhau.
 * Cùng rng (cùng hạt giống) thì cùng kết quả. Có trần số lần thử nên luôn dừng (ao đầy thì trả ít lá hơn).
 * @returns {{ leaves: object[], clumps: { x: number, z: number, r: number }[] }}
 */
export function placeLeaves(count, rng) {
  const clumps = [];
  while (clumps.length < 16) {
    const c = randomInDisc(rng, POND_RADIUS);
    if (!inMoonPath(c.x, c.z)) clumps.push({ ...c, r: randRange(rng, 4, 9) });
  }
  const cell = 2.2; // lưới băm để chỉ so với lá ở 9 ô lân cận
  const grid = new Map();
  const key = (ix, iz) => `${ix},${iz}`;
  const leaves = [];
  for (let tries = 0; leaves.length < count && tries < count * 60; tries++) {
    const { x, z } = randomInDisc(rng, POND_RADIUS);
    const scale = randRange(rng, 0.5, 1.2);
    if (inMoonPath(x, z)) continue;
    let density = 0.04; // nền thưa để thỉnh thoảng có lá lẻ giữa nước
    for (const c of clumps) density = Math.max(density, Math.exp(-((x - c.x) ** 2 + (z - c.z) ** 2) / (c.r * c.r)));
    if (rng() > density) continue;
    const ix = Math.floor(x / cell);
    const iz = Math.floor(z / cell);
    let crowded = false;
    for (let dx = -1; dx <= 1 && !crowded; dx++) {
      for (let dz = -1; dz <= 1 && !crowded; dz++) {
        for (const o of grid.get(key(ix + dx, iz + dz)) ?? []) {
          if (Math.hypot(o.x - x, o.z - z) < 0.6 * (o.scale + scale)) crowded = true;
        }
      }
    }
    if (crowded) continue;
    const leaf = {
      x,
      z,
      scale,
      y: randRange(rng, 0.03, 0.08), // mỗi lá cao thấp một chút: bớt nhấp nháy khi hai lá chạm nhau
      yaw: rng() * Math.PI * 2,
      tiltX: randRange(rng, -0.1, 0.1),
      tiltZ: randRange(rng, -0.1, 0.1),
    };
    leaves.push(leaf);
    const k = key(ix, iz);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(leaf);
  }
  return { leaves, clumps };
}
```

- [ ] **Step 3: Hoa: `parts/cot-flower.js`**

```js
// paintings/ao-sen-dem/parts/cot-flower.js — của lớp Cốt: cánh sen instanced (nở theo uniform), gương sen + nhị, vị trí hoa và nụ.
import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Object3D,
} from 'three/webgpu';
import { Fn, attribute, cos, cross, dot, normalLocal, oneMinus, positionLocal, sin, vec3 } from 'three/tsl';
import { randRange } from '../../../lib/random.js';
import { inMoonPath } from './cot-leaf.js';

// Ba vòng cánh: vòng trong đứng thẳng, vòng ngoài ngả gần nằm. Góc tính từ phương thẳng đứng (rad).
const RINGS = [
  { count: 6, radius: 0.08, closed: 0.08, open: 0.35, scale: 0.8 },
  { count: 8, radius: 0.13, closed: 0.14, open: 0.75, scale: 0.95 },
  { count: 10, radius: 0.18, closed: 0.2, open: 1.1, scale: 1 },
];
const BUD = { count: 5, radius: 0.05, tilt: 0.08, scale: 0.75 };
// Hai bông "chủ đề" đặt tay ở tiền cảnh, hai bên lối trăng (như bông sen giữa poster): bố cục không phó mặc cho số ngẫu nhiên.
const HERO = [
  { x: -7, z: 13, y: 1.9, scale: 2, open: 1, twist: 0.3 },
  { x: 7, z: 8, y: 1.4, scale: 1.7, open: 0.8, twist: 1.1 },
];

/**
 * Hình học MỘT cánh sen (dài 1): gốc ở (0, 0, 0), mũi chỉ +Y, lòng cánh hướng +Z.
 * Rộng nhất ở giữa, nhọn ở mũi; hai mép cong vào (lòng thìa), mũi hơi ngả ra ngoài.
 */
export function makePetalGeometry({ across = 6, along = 10, width = 0.5, cup = 0.1, bend = 0.12 } = {}) {
  const position = [];
  const uv = [];
  for (let j = 0; j <= along; j++) {
    const v = j / along;
    const half = (width / 2) * Math.sin(Math.PI * v ** 0.8) ** 0.7 + 0.004;
    for (let i = 0; i <= across; i++) {
      const u = (i / across) * 2 - 1;
      position.push(u * half, v, cup * u * u * (half / (width / 2)) - bend * v * v);
      uv.push(i / across, v);
    }
  }
  const index = [];
  const row = across + 1;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * row + i;
      index.push(a, a + 1, a + row, a + 1, a + row + 1, a + row);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Chọn chỗ cho hoa và nụ: gần tâm các cụm lá, ngoài lối trăng. Cùng rng thì cùng kết quả.
 * @returns {{ flowers: object[], buds: object[] }}
 */
export function placeFlowers(rng, clumps, { flowers = 12, buds = 20 } = {}) {
  // Một nửa số hoa dồn về 5 cụm gần camera (z lớn) để tiền cảnh luôn có hoa.
  const near = [...clumps].sort((a, b) => b.z - a.z).slice(0, 5);
  const pick = (n, make) => {
    const out = [];
    for (let tries = 0; out.length < n && tries < n * 50; tries++) {
      const pool = out.length % 2 === 0 ? near : clumps;
      const c = pool[Math.floor(rng() * pool.length)];
      const a = rng() * Math.PI * 2;
      const r = c.r * 0.7 * Math.sqrt(rng());
      const x = c.x + Math.cos(a) * r;
      const z = c.z + Math.sin(a) * r;
      if (!inMoonPath(x, z)) out.push({ x, z, ...make() });
    }
    return out;
  };
  return {
    flowers: [...HERO, ...pick(flowers - HERO.length, () => ({
      y: randRange(rng, 1.2, 2.6),
      scale: randRange(rng, 1.6, 2.2),
      open: randRange(rng, 0.7, 1), // mỗi bông nở một độ
      twist: rng() * Math.PI,
    }))],
    buds: pick(buds, () => ({ y: randRange(rng, 0.9, 2.2), scale: randRange(rng, 1.1, 1.5), twist: rng() * Math.PI })),
  };
}

/** Xoay vector v quanh trục đơn vị k một góc a (công thức Rodrigues), viết bằng TSL. */
const rotateAxis = (v, k, a) => v.mul(cos(a)).add(cross(k, v).mul(sin(a))).add(k.mul(dot(k, v)).mul(oneMinus(cos(a))));

/**
 * Mọi cánh của mọi bông và nụ trong MỘT InstancedMesh (một draw call).
 * Ma trận instance đặt cánh ở dáng KHÉP; positionNode ngả cánh ra quanh bản lề của nó thêm
 * `range × openness`. positionNode chạy SAU instancing (r186), nên bản lề và trục xoay tính theo
 * tọa độ của ao; normalLocal cũng xoay theo để ánh sáng đúng với cánh đã ngả.
 * @param {{ flowers: object[], buds: object[], geometry: any, material: any, openness: any }} p
 */
export function makePetals({ flowers, buds, geometry, material, openness }) {
  const items = [];
  for (const f of flowers) {
    RINGS.forEach((ring, r) => {
      for (let k = 0; k < ring.count; k++) {
        const yaw = ((k + r * 0.5) / ring.count) * Math.PI * 2 + f.twist;
        items.push({ f, yaw, radius: ring.radius, tilt: ring.closed, range: (ring.open - ring.closed) * f.open, scale: ring.scale });
      }
    });
  }
  for (const b of buds) {
    for (let k = 0; k < BUD.count; k++) {
      items.push({ f: b, yaw: (k / BUD.count) * Math.PI * 2 + b.twist, radius: BUD.radius, tilt: BUD.tilt, range: 0, scale: BUD.scale });
    }
  }
  const mesh = new InstancedMesh(geometry, material, items.length);
  const hinge = new Float32Array(items.length * 4);
  const yaws = new Float32Array(items.length);
  const dummy = new Object3D();
  // Thứ tự 'YXZ': ma trận = Ry · Rx · Rz, nên cánh ngả quanh X trước, rồi mới quay theo hướng Y.
  dummy.rotation.order = 'YXZ';
  items.forEach(({ f, yaw, radius, tilt, range, scale }, i) => {
    const s = f.scale;
    const x = f.x + Math.cos(yaw) * radius * s;
    const z = f.z + Math.sin(yaw) * radius * s;
    dummy.position.set(x, f.y, z);
    dummy.rotation.set(-tilt, -yaw - Math.PI / 2, 0); // −Z cục bộ chỉ ra ngoài, lòng cánh (+Z) hướng vào tâm
    dummy.scale.setScalar(scale * s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    hinge.set([x, f.y, z, range], i * 4);
    yaws[i] = yaw;
  });
  geometry.setAttribute('petalHinge', new InstancedBufferAttribute(hinge, 4));
  geometry.setAttribute('petalYaw', new InstancedBufferAttribute(yaws, 1));

  const h = attribute('petalHinge', 'vec4');
  const yaw = attribute('petalYaw', 'float');
  const axis = vec3(sin(yaw), 0, cos(yaw).negate()); // trục nằm ngang, vuông góc với hướng cánh
  const angle = h.w.mul(openness);
  material.positionNode = Fn(() => {
    normalLocal.assign(rotateAxis(normalLocal, axis, angle));
    return rotateAxis(positionLocal.sub(h.xyz), axis, angle).add(h.xyz);
  })();
  return mesh;
}

/** Ghép nhiều BufferGeometry có index thành một, kèm thuộc tính 'part' cho biết mảnh nào (0, 1…). */
function mergeParts(parts) {
  const out = { position: [], normal: [], uv: [], part: [] };
  const index = [];
  let offset = 0;
  parts.forEach(({ geometry, part }) => {
    for (const name of ['position', 'normal', 'uv']) out[name].push(...geometry.getAttribute(name).array);
    const n = geometry.getAttribute('position').count;
    for (let i = 0; i < n; i++) out.part.push(part);
    for (const i of geometry.getIndex().array) index.push(i + offset);
    offset += n;
    geometry.dispose();
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(out.position, 3));
  geometry.setAttribute('normal', new Float32BufferAttribute(out.normal, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(out.uv, 2));
  geometry.setAttribute('part', new Float32BufferAttribute(out.part, 1));
  geometry.setIndex(index);
  return geometry;
}

/** Gương sen (part 0) + 20 sợi nhị ngả ra (part 1), ghép thành MỘT hình để cả ao chỉ tốn một draw call. */
export function makeCoreGeometry() {
  const parts = [{ geometry: new CylinderGeometry(0.16, 0.1, 0.16, 14).translate(0, 0.08, 0), part: 0 }];
  const m = new Matrix4();
  const dummy = new Object3D();
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    dummy.position.set(Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19);
    dummy.rotation.set(0, -a, -0.35, 'YXZ'); // ngả ra ngoài
    dummy.updateMatrix();
    m.copy(dummy.matrix);
    parts.push({ geometry: new BoxGeometry(0.018, 0.2, 0.018).translate(0, 0.1, 0).applyMatrix4(m), part: 1 });
  }
  return mergeParts(parts);
}

/** Một instance gương sen cho mỗi bông đã nở (nụ không có). */
export function makeCores(flowers, material) {
  const mesh = new InstancedMesh(makeCoreGeometry(), material, flowers.length);
  const dummy = new Object3D();
  flowers.forEach((f, i) => {
    dummy.position.set(f.x, f.y, f.z);
    dummy.scale.setScalar(f.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  return mesh;
}
```
Điểm học:
- Ma trận instance đặt cánh ở dáng KHÉP; `positionNode` ngả thêm `range × openness` quanh trục nằm ngang `(sin yaw, 0, −cos yaw)` đi qua bản lề. Vì `positionNode` chạy SAU instancing (r186), bản lề phải là tọa độ của ao (thuộc tính instance `petalHinge`), không phải tọa độ của cánh.
- Không gán lại `normalLocal` thì cánh ngả mà pháp tuyến vẫn như cũ: mặt cánh tối sai.
- Gương sen và 20 sợi nhị ghép thành MỘT geometry (`mergeParts`), có thuộc tính `part` để lớp Ánh trăng tô hai màu. Không import `BufferGeometryUtils` vì file đó kéo `three` (bản WebGL) vào bundle.

- [ ] **Step 4: Cuống và lau: `parts/cot-reeds.js`**

```js
// paintings/ao-sen-dem/parts/cot-reeds.js — của lớp Cốt: cuống (hoa, nụ, lá đứng) và lau sậy mọc thành khóm ở rìa ao.
import { CylinderGeometry, DoubleSide, InstancedMesh, Object3D, PlaneGeometry } from 'three/webgpu';
import { randRange } from '../../../lib/random.js';

const RIM = { inner: 50, outer: 58, clumps: 14 };

/**
 * Mọi cuống trong MỘT InstancedMesh: một ống thon cao 1, gốc ở y = 0; mỗi instance kéo dài
 * theo chiều cao của thứ nó đỡ. Cuống của lá nổi nằm dưới nước nên không vẽ.
 * @param {{ x: number, y: number, z: number }[]} heads  đỉnh cuống (tâm hoa, nụ, lá đứng)
 */
export function makeStems(heads, material) {
  const geometry = new CylinderGeometry(0.035, 0.05, 1, 6, 1, true).translate(0, 0.5, 0);
  const mesh = new InstancedMesh(geometry, material, heads.length);
  const dummy = new Object3D();
  heads.forEach((h, i) => {
    dummy.position.set(h.x, 0, h.z);
    dummy.scale.set(1, h.y, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  return mesh;
}

/** Một ngọn lau: dải mảnh thon dần lên ngọn, gốc ở y = 0, cao 1. */
function makeBladeGeometry() {
  const geometry = new PlaneGeometry(0.09, 1, 1, 4).translate(0, 0.5, 0);
  const p = geometry.getAttribute('position');
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (1 - p.getY(i) * 0.9)); // thon về ngọn
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Lau sậy: `count` ngọn chia thành khóm quanh rìa ao, mỗi ngọn cao thấp, nghiêng khác nhau.
 * Hai mặt đều vẽ (DoubleSide) vì dải lau rất mỏng.
 */
export function makeReeds(count, rng, material) {
  material.side = DoubleSide;
  const mesh = new InstancedMesh(makeBladeGeometry(), material, count);
  const centers = Array.from({ length: RIM.clumps }, () => ({
    a: rng() * Math.PI * 2,
    r: randRange(rng, RIM.inner, RIM.outer),
  }));
  const dummy = new Object3D();
  for (let i = 0; i < count; i++) {
    const c = centers[i % RIM.clumps];
    const a = c.a + randRange(rng, -0.05, 0.05);
    const r = c.r + randRange(rng, -1.5, 1.5);
    dummy.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    dummy.rotation.set(randRange(rng, -0.15, 0.15), rng() * Math.PI, randRange(rng, -0.15, 0.15));
    dummy.scale.set(1, randRange(rng, 2, 5), 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  return mesh;
}
```

- [ ] **Step 5: Viết lại `layers/l1-cot.js`**

```js
// paintings/ao-sen-dem/layers/l1-cot.js — Lớp 1 · Cốt: lá, hoa, nụ, cuống, lau sậy bằng đất sét (instancing) + đèn xưởng.
import {
  DoubleSide,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  MeshPhysicalNodeMaterial,
  MeshStandardNodeMaterial,
  Object3D,
} from 'three/webgpu';
import { color, vec3 } from 'three/tsl';
import { mulberry32, randRange } from '../../../lib/random.js';
import { makeLeafGeometry, placeLeaves } from '../parts/cot-leaf.js';
import { makeCores, makePetalGeometry, makePetals, placeFlowers } from '../parts/cot-flower.js';
import { makeReeds, makeStems } from '../parts/cot-reeds.js';

export const id = 'cot';
export const knobs = [{ id: 'openness', min: 0, max: 1, step: 0.01, value: 0.85 }];

const SEED = 20260928; // hạt giống cố định: lần nào mở cũng đúng một ao sen ấy
const STANDING = 0.1; // khoảng 10% lá đứng trên cuống
const REEDS = 300;
// Đèn xưởng: trời trắng, đất xám. Lambert chia cho π nên cường độ ≈ π cho lại gần đúng màu datSet.
const STUDIO = { sky: 0xffffff, ground: 0x24211f, intensity: Math.PI };

/** Đất sét: màu datSet, nhám, không phát sáng. emissiveNode gán tường minh (luật 8 của kỹ thuật). */
function clay(ctx, Material, options = {}) {
  const material = new Material({ roughness: 0.9, metalness: 0, ...options });
  material.colorNode = color(ctx.palette.hex.datSet);
  material.emissiveNode = vec3(0);
  return material;
}

/** Đặt ma trận instance cho từng lá: vị trí, nghiêng, xoay, cỡ. */
function fillLeaves(mesh, list, cup = 1) {
  const dummy = new Object3D();
  list.forEach((leaf, i) => {
    dummy.position.set(leaf.x, leaf.y, leaf.z);
    dummy.rotation.set(leaf.tiltX, leaf.yaw, leaf.tiltZ);
    dummy.scale.set(leaf.scale, leaf.scale * cup, leaf.scale); // cup > 1: lá lõm sâu như cái phễu
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  object dùng chung của bức: Cốt ghi shared.cot cho các lớp sau
 */
export function createLayer(ctx, shared) {
  const total = ctx.budget.leaves ?? { cao: 1200, vua: 800, thap: 500 }[ctx.level];
  // Mỗi việc một dòng số ngẫu nhiên riêng: số lá đổi theo mức nhưng hoa và lau thì mức nào cũng như nhau.
  const { leaves: placed, clumps } = placeLeaves(total, mulberry32(SEED));
  const rng = mulberry32(SEED + 1);

  // Tách ~10% thành lá đứng: nhô cao trên cuống, lõm sâu hơn, nghiêng nhiều hơn.
  const floating = [];
  const standing = [];
  for (const leaf of placed) {
    if (rng() < STANDING) standing.push({ ...leaf, y: randRange(rng, 1.2, 3.2), tiltX: randRange(rng, -0.5, 0.5), tiltZ: randRange(rng, -0.5, 0.5) });
    else floating.push(leaf);
  }
  const { flowers, buds } = placeFlowers(mulberry32(SEED + 2), clumps);

  // Lá và cánh dùng MeshPhysical để lớp Ánh trăng thêm clearcoat (lá) và sheen (cánh) mà không đổi loại material.
  const leafMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const standingMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const petalMaterial = clay(ctx, MeshPhysicalNodeMaterial, { side: DoubleSide });
  const coreMaterial = clay(ctx, MeshStandardNodeMaterial);
  const stemMaterial = clay(ctx, MeshStandardNodeMaterial);
  const reedMaterial = clay(ctx, MeshStandardNodeMaterial);

  // InstancedMesh: MỘT draw call cho cả nghìn lá; mỗi lá chỉ khác nhau ở ma trận instance.
  const leafGeometry = makeLeafGeometry();
  const leaves = new InstancedMesh(leafGeometry, leafMaterial, floating.length);
  fillLeaves(leaves, floating);
  // Tâm (x, z) của từng lá nổi: positionNode chạy SAU instancing, nên lớp Mặt nước cần tâm này
  // để cả chiếc lá nhấp nhô cùng nhịp sóng thay vì từng đỉnh lệch nhau.
  const centers = new Float32Array(floating.flatMap((l) => [l.x, l.z]));
  leafGeometry.setAttribute('instanceCenter', new InstancedBufferAttribute(centers, 2));
  // Lá đứng dùng hình riêng: thuộc tính instance gắn với geometry, không chia được với lá nổi.
  const standingGeometry = makeLeafGeometry();
  const standingLeaves = new InstancedMesh(standingGeometry, standingMaterial, standing.length);
  fillLeaves(standingLeaves, standing, 1.8);

  const petalGeometry = makePetalGeometry();
  const openness = ctx.knob('openness'); // @knob openness
  const petals = makePetals({ flowers, buds, geometry: makePetalGeometry(), material: petalMaterial, openness });
  const cores = makeCores(flowers, coreMaterial);
  const stems = makeStems([...flowers, ...buds, ...standing], stemMaterial);
  const reeds = makeReeds(REEDS, mulberry32(SEED + 3), reedMaterial);

  // Đèn xưởng: đủ để đất sét đọc được hình khối khi mọi lớp khác bằng 0.
  const hemi = new HemisphereLight(STUDIO.sky, STUDIO.ground, STUDIO.intensity);
  hemi.position.set(-1, 2, 0.5); // trời hơi lệch trái: một bên lòng lá sáng hơn bên kia, đọc ra hình lõm

  const objects = [leaves, standingLeaves, petals, cores, stems, reeds];
  ctx.scene.add(...objects, hemi);
  shared.cot = {
    leafMaterial,
    standingMaterial,
    petalMaterial,
    coreMaterial,
    stemMaterial,
    reedMaterial,
    petalGeometry, // hình cánh để lớp sau dùng lại (đèn hoa đăng)
    hemi,
    hemiIntensity: STUDIO.intensity,
    casters: [standingLeaves, petals, cores, stems], // thứ đứng trên mặt nước: đổ bóng lên lá nổi
    receivers: [leaves],
  };

  let disposed = false;
  return {
    objects,
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...objects, hemi);
      for (const o of objects) {
        o.dispose();
        o.geometry.dispose();
        o.material.dispose();
      }
      petalGeometry.dispose();
      hemi.dispose();
    },
  };
}
```

- [ ] **Step 6: Khai báo file của Cốt, đổi camera**

`src/paintings/ao-sen-dem/meta.js`: thay dòng `{ id: 'cot', name: 'Cốt', files: ['paintings/ao-sen-dem/layers/l1-cot.js'] },` bằng:
```js
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/ao-sen-dem/layers/l1-cot.js',
        'paintings/ao-sen-dem/parts/cot-leaf.js',
        'paintings/ao-sen-dem/parts/cot-flower.js',
        'paintings/ao-sen-dem/parts/cot-reeds.js',
      ],
    },
```
(Marker `// @knob` chỉ hợp lệ trong file lớp sở hữu; mỗi file thuộc tối đa một lớp. Test hợp đồng kiểm cả hai.)

`src/paintings/ao-sen-dem/painting.js`: thay khối JSDoc + `export const camera = { … };` ở cuối file bằng:
```js
/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng ở z = 32, cao 6, nhìn gần ngang về phía xa (−z): trăng thấp (4°–13°) nằm ở phần ba trên
 * của khung, lối trăng chạy từ chân trời về tiền cảnh. l1-cot chừa "lối trăng" hướng về đúng chỗ này.
 * breathe: camera "thở" nhẹ quanh điểm nhìn (xưởng tắt khi người xem xin giảm chuyển động).
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 6, 32],
  target: [0, 2.2, -14],
  fov: 42,
  azimuth: [-0.6, 0.6],
  polar: [1.1, 1.52],
  distance: [24, 60],
  breathe: 0.4,
};
```
(`polar` phải chứa góc của vị trí đầu, khoảng 1,49 rad; `distance` phải chứa khoảng cách đầu, khoảng 46,2. Ngoài khoảng thì OrbitControls kẹp camera về mép.)

- [ ] **Step 7: Chạy toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  369 passed (369)`. Nếu test file báo `l1-cot.js` hoặc `parts/*` quá 250 dòng: không xảy ra với code trên (lớn nhất 198 dòng).

- [ ] **Step 8: Nhìn ảnh**

Run: `npm run build && npx playwright test e2e/painting.spec.js --project=webgl2-swiftshader`
Expected: PASS. Tìm ảnh bằng `find e2e/.results -name freeze-40.png` rồi mở bằng công cụ đọc ảnh (khung 640 × 400, WebGL2 mức vừa). Phải thấy (mọi thứ còn màu đất sét, vì Ánh trăng chưa có): lá nổi rải thành cụm; lá đứng trên cuống; hai bông sen lớn ở tiền cảnh hai bên một khoảng nước trống chạy từ giữa đáy khung lên chân trời (lối trăng); lau ở chân trời. Nếu hoa xòe dẹt như hoa súng: giảm `RINGS[*].open` (trong khoảng 0,3–1,2); nếu hai bông chủ đề che lối trăng: dời `HERO[*].x` ra xa trục giữa.

- [ ] **Step 9: Commit**

```bash
git add src/paintings/ao-sen-dem/parts/cot-leaf.js src/paintings/ao-sen-dem/parts/cot-flower.js src/paintings/ao-sen-dem/parts/cot-reeds.js src/paintings/ao-sen-dem/layers/l1-cot.js src/paintings/ao-sen-dem/meta.js src/paintings/ao-sen-dem/painting.js tests/paintings/ao-sen-dem/cot.test.js tests/paintings/ao-sen-dem.test.js
git commit -m "feat(ao-sen-dem): Cốt hoàn chỉnh: lá nổi và lá đứng, hoa nở theo uniform, cuống, lau sậy; camera nhìn về lối trăng

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 11: Lớp 2 · Ánh trăng (trăng đúng pha, ánh trăng + một shadow map, chất liệu ca dao, đèn hoa đăng)

**Mục tiêu:** Spec §6 L2, §5: lớp mới đứng thứ 2 trong bức.
- **Trăng** thuộc lớp này: quả cầu, đường ranh sáng/tối lấy từ `lib/astro/moon.js#sunDirection(pha)` (pha = núm `moonPhase`, mặc định là pha **đêm nay**); vết biển tối vẽ bằng `fbm` (Task 3); phát sáng > 1 để Phủ bóng làm tỏa. Vị trí theo `shared.moon.dir` (giờ, Task 9).
- **Ánh trăng** ngà: `DirectionalLight` từ phía trăng + `HemisphereLight` (trời chàm, nước đen). Đèn xưởng của Cốt lui dần theo trọng số.
- **Một shadow map**, bật một lần lúc dựng theo mức (cao 1024 / vừa 512 / thấp tắt): hoa, nụ, lá đứng, cuống đổ bóng lên lá nổi.
- **Chất liệu** sơn lên đất sét của Cốt bằng `mix(datSet, màu, w)`: lá xanh lục có gân **dát vàng** (kim loại, lóe khi ánh trăng lướt qua) và clearcoat như sáp; cánh trắng ngà ửng hồng đầu cánh, sheen, **viền fresnel** và **sáng khi ngược sáng**; gương sen xanh vàng, nhị vàng.
- **Đèn hoa đăng**: 8 cánh (dùng lại hình cánh của Cốt) quây một `PointLight` ấm, màu theo núm `candleColor`, lung linh theo `ctx.u.time`.

**Files:**
- Create: `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `parts/anh-trang-moon.js`, `parts/anh-trang-paint.js`, `tests/paintings/ao-sen-dem/anh-trang.test.js`
- Modify: `src/paintings/ao-sen-dem/meta.js` (lớp mới + hàng rào từ vựng), `painting.js` (thứ tự lớp)

**Interfaces:**
- Consumes: `shared.cot` (Task 10), `shared.moon.dir` (Task 9), `fbm` (Task 3), `moonPhase`, `sunDirection` (`lib/astro/moon.js`), `ctx.budget.shadow ?? { cao: 1024, vua: 512, thap: 0 }[level]`, `ctx.renderer.shadowMap`.
- Produces: `id = 'anh-trang'` (API công khai từ khi deploy). `knobs`: `moonPhase` (hàm của `env.now`), `rimPower`, `rimColor` (color), `translucency`, `clearcoat` (mặc định 0), `candleColor` (color). `layer.objects = [moon, lantern]`. `MOON = { radius: 5.5, distance: 160, glow: 1.2 }`. Không ghi thêm gì vào `shared`.

- [ ] **Step 1: Test**

`tests/paintings/ao-sen-dem/anh-trang.test.js`:
```js
// tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
import { moonPhase } from '../../../src/lib/astro/moon.js';
import { knobValue } from '../../../src/engine/gpu/layers.js';
import { NOW, buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'anh-trang', ...options });
const lights = (scene, flag) => scene.children.filter((o) => o[flag]);

describe('l2-anh-trang', () => {
  it('núm tĩnh; pha trăng mặc định là pha của đêm nay', () => {
    expect(anhTrang.id).toBe('anh-trang');
    expect(anhTrang.knobs.map((k) => k.id)).toEqual(['moonPhase', 'rimPower', 'rimColor', 'translucency', 'clearcoat', 'candleColor']);
    const phase = anhTrang.knobs.find((k) => k.id === 'moonPhase');
    expect(knobValue(phase, { now: NOW })).toBe(moonPhase(NOW).phase);
  });

  it('trăng và đèn hoa đăng là objects của lớp; trăng có emissiveNode', () => {
    const { ctx, layers } = build();
    const [moon, lantern] = layers['anh-trang'].objects;
    expect(moon.geometry.parameters.radius).toBe(MOON.radius);
    expect(moon.material.emissiveNode).toBeTruthy();
    expect(lantern.isInstancedMesh).toBe(true);
    expect(ctx.scene.children).toEqual(expect.arrayContaining([moon, lantern]));
    expect(lights(ctx.scene, 'isDirectionalLight')).toHaveLength(1);
    expect(lights(ctx.scene, 'isPointLight')).toHaveLength(1);
  });

  it('sơn lên material của Cốt: màu mới, clearcoat cho lá, sheen + emissive cho cánh', () => {
    const { shared } = build();
    const { leafMaterial, standingMaterial, petalMaterial } = shared.cot;
    for (const m of [leafMaterial, standingMaterial]) expect(m.clearcoatNode).toBeTruthy();
    expect(petalMaterial.sheenNode).toBeTruthy();
    expect(petalMaterial.emissiveNode.isNode).toBe(true);
  });

  it('bóng bật MỘT lần lúc dựng theo mức: cao 1024, vừa 512, thấp tắt', () => {
    for (const [level, size] of [['cao', 1024], ['vua', 512], ['thap', 0]]) {
      const { ctx, shared } = build({ level });
      const [sun] = lights(ctx.scene, 'isDirectionalLight');
      expect(ctx.renderer.shadowMap.enabled, level).toBe(size > 0);
      expect(sun.castShadow, level).toBe(size > 0);
      if (size) expect(sun.shadow.mapSize.x).toBe(size);
      for (const o of shared.cot.casters) expect(o.castShadow, level).toBe(size > 0);
      for (const o of shared.cot.receivers) expect(o.receiveShadow, level).toBe(size > 0);
    }
  });

  it('update: trọng số 1 → ánh trăng sáng, đèn xưởng tắt; trọng số 0 → ngược lại; trăng theo hướng của bức', () => {
    const { ctx, shared, layers } = build();
    const [sun] = lights(ctx.scene, 'isDirectionalLight');
    layers['anh-trang'].update(1 / 60, 1);
    expect(sun.intensity).toBeGreaterThan(0);
    expect(shared.cot.hemi.intensity).toBe(0);
    const [moon] = layers['anh-trang'].objects;
    expect(moon.position.clone().normalize().distanceTo(shared.moon.dir.value)).toBeLessThan(1e-9);
    ctx.weights.set('anh-trang', 0);
    layers['anh-trang'].update(1 / 60, 2);
    expect(sun.intensity).toBe(0);
    expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
  });

  it('dispose gỡ trăng, đèn, hoa đăng (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    layers['anh-trang'].dispose();
    layers['anh-trang'].dispose();
    expect(ctx.scene.children.filter((o) => o.isLight && !o.isHemisphereLight)).toHaveLength(0);
    for (const o of layers['anh-trang'].objects) expect(o.parent).toBeNull();
  });
});
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang.test.js`
Expected: FAIL: không tải được `layers/l2-anh-trang.js`.

- [ ] **Step 2: Trăng: `parts/anh-trang-moon.js`**

```js
// paintings/ao-sen-dem/parts/anh-trang-moon.js — của lớp Ánh trăng: quả cầu trăng đúng pha, có vết biển tối, phát sáng quá 1 để bloom.
import { Mesh, MeshStandardNodeMaterial, SphereGeometry, Vector3 } from 'three/webgpu';
import { color, dot, mix, normalView, positionLocal, smoothstep, uniform, vec3 } from 'three/tsl';
import { sunDirection } from '../../../lib/astro/moon.js';
import { fbm } from '../../../lib/tsl/noise.js';

export const MOON = { radius: 5.5, distance: 160, glow: 1.2 };
// Ở vĩ độ thấp như Việt Nam, trăng non nằm ngửa như con thuyền: nghiêng phần sáng xuống dưới.
const CRESCENT_TILT = 0.9;

/**
 * Trăng thuộc lớp Ánh trăng: trọng số 0 → quả cầu đất sét dưới đèn xưởng (luật 3);
 * trọng số 1 → trăng tự sáng (emissive > 1 nên Phủ bóng làm nó tỏa).
 * Đường ranh sáng/tối: dot(normalView, hướng Mặt Trời giả) trong không gian nhìn,
 * với hướng lấy từ lib/astro/moon.js#sunDirection(pha) — cùng hệ trục view space của three.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {any} w  trọng số của lớp
 * @param {any} phase  uniform của núm moonPhase
 */
export function createMoon(ctx, w, phase) {
  const hex = ctx.palette.hex;
  const sun = uniform(new Vector3(0, 0, 1)).setName('moonSun');
  const setSun = () => {
    const tilt = -CRESCENT_TILT * Math.sign(Math.sin(phase.value));
    sun.value.set(...sunDirection(phase.value, { tilt }));
  };
  setSun();

  // Vết biển tối (maria): fbm trên tọa độ của chính quả cầu nên các vết dính vào trăng, không trôi.
  const maria = smoothstep(0.05, 0.45, fbm(positionLocal.div(MOON.radius).mul(1.6), { octaves: 4 }));
  const albedo = mix(1, 0.6, maria);
  const lit = smoothstep(-0.03, 0.12, dot(normalView, sun)); // mềm ở đường ranh
  const tint = mix(color(hex.nga), color(hex.vangLaSang), 0.6); // trăng sơn mài: ngà ngả vàng
  const light = tint.mul(albedo).mul(lit.mul(MOON.glow).add(0.02)); // 0.02: ánh đất mờ trên phần tối

  const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0 });
  material.colorNode = mix(color(hex.datSet), vec3(0), w);
  material.emissiveNode = light.mul(w);
  const moon = new Mesh(new SphereGeometry(MOON.radius, 48, 24), material);
  return {
    moon,
    /** Mỗi khung: đặt trăng theo hướng của bức (giờ đêm), cập nhật pha từ núm. */
    update(dir) {
      moon.position.copy(dir).multiplyScalar(MOON.distance);
      setSun();
    },
    dispose() {
      moon.geometry.dispose();
      material.dispose();
    },
  };
}
```
Điểm học: `sunDirection` trả vector trong **view space** của three (+z về phía người xem), nên so với `normalView` của quả cầu là đúng hệ trục, bất kể trăng nằm đâu trên trời. Pha là uniform của núm; mỗi khung `update()` tính lại vector từ `phase.value` (vài phép sin/cos trên CPU), không biên dịch lại.

- [ ] **Step 3: Chất liệu: `parts/anh-trang-paint.js`**

```js
// paintings/ao-sen-dem/parts/anh-trang-paint.js — của lớp Ánh trăng: sơn màu ca dao lên đất sét của Cốt (lá xanh, bông trắng, nhị vàng).
import {
  abs,
  atan,
  attribute,
  cameraPosition,
  color,
  dot,
  float,
  length,
  mix,
  normalWorld,
  normalize,
  oneMinus,
  positionWorld,
  pow,
  saturate,
  sin,
  smoothstep,
  uv,
} from 'three/tsl';

/**
 * Mọi màu bắt đầu từ đất sét và đi qua mix(datSet, màu, w): trọng số 0 là về lại Cốt (luật 3).
 * Material vẫn là của Cốt; lớp này chỉ gán node MỘT lần lúc dựng (trước khi biên dịch).
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} cot  shared.cot
 * @param {any} w  trọng số của lớp
 * @param {any} moonDir  uniform vec3: hướng tới trăng (world)
 */
export function paintCot(ctx, cot, w, moonDir) {
  const hex = ctx.palette.hex;
  const clay = color(hex.datSet);
  const paint = (material, node) => {
    material.colorNode = mix(clay, node, w);
  };

  // Lá: xanh lục, gân tỏa từ rốn lá (atan(y, x) — TSL không có atan2), mép sẫm hơn giữa.
  const d = uv().sub(0.5);
  const r = length(d).mul(2);
  // Gân "dát vàng" như tranh sơn mài: mảnh, tỏa từ rốn lá ra mép.
  const veins = pow(abs(sin(atan(d.y, d.x).mul(11))), 40).mul(smoothstep(0.1, 0.45, r)).toVar();
  const leaf = mix(mix(color(hex.xanhLuc).mul(1.9), color(hex.xanhLuc).mul(1.2), r), color(hex.vangLa), veins);
  for (const material of [cot.leafMaterial, cot.standingMaterial]) {
    paint(material, leaf);
    // Gân là vàng thật (kim loại, bóng hơn) nên lóe lên khi ánh trăng lướt qua.
    material.metalnessNode = veins.mul(w);
    material.roughnessNode = mix(float(0.9), mix(float(0.8), float(0.35), veins), w);
    // Clearcoat: lớp bóng như sáp phủ trên lá; uniform của núm nhân trọng số, không biên dịch lại.
    material.clearcoatNode = ctx.knob('clearcoat').mul(w); // @knob clearcoat
    material.clearcoatRoughnessNode = float(0.5);
  }

  // Cánh: trắng ngà, ửng hồng nhạt ở đầu cánh (pha chút đỏ son vào ngà).
  const tip = smoothstep(0.55, 1, uv().y);
  paint(cot.petalMaterial, mix(color(hex.nga), mix(color(hex.nga), color(hex.doSon), 0.35), tip));
  cot.petalMaterial.sheenNode = color(hex.nga).mul(0.5).mul(w); // ánh nhung của cánh
  // Viền fresnel: mép cánh (nơi pháp tuyến gần vuông góc với hướng nhìn) sáng lên.
  // Ngược sáng: nhìn xuyên cánh về phía trăng thì cánh sáng như giấy dó trước đèn.
  const view = normalize(cameraPosition.sub(positionWorld));
  const edge = oneMinus(abs(dot(normalWorld, view)));
  const rimPower = ctx.knob('rimPower'); // @knob rimPower
  const rim = pow(edge, rimPower).mul(ctx.knob('rimColor')); // @knob rimColor
  const back = pow(saturate(dot(view.negate(), moonDir)), 4).mul(ctx.knob('translucency')); // @knob translucency
  cot.petalMaterial.emissiveNode = rim.mul(0.5).add(color(hex.nga).mul(back).mul(0.35)).mul(w);

  // Gương sen xanh vàng, nhị vàng lá (thuộc tính 'part' của Cốt: 0 gương, 1 nhị).
  paint(cot.coreMaterial, mix(mix(color(hex.xanhLuc), color(hex.vangLa), 0.45), color(hex.vangLa), attribute('part', 'float')));
  paint(cot.stemMaterial, color(hex.xanhLuc).mul(0.7));
  paint(cot.reedMaterial, mix(color(hex.canhGian), color(hex.xanhLuc), uv().y.mul(0.6)));
}
```
Lưu ý marker: mỗi `// @knob <id>` một dòng riêng. Viết hai marker trên cùng một dòng thì test chỉ đếm được cái đầu (regex cần `//` trước mỗi `@knob`).

- [ ] **Step 4: Lớp: `layers/l2-anh-trang.js`**

```js
// paintings/ao-sen-dem/layers/l2-anh-trang.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + một shadow map, chất liệu, đèn hoa đăng.
import {
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  InstancedMesh,
  MeshStandardNodeMaterial,
  Object3D,
  PointLight,
} from 'three/webgpu';
import { color, mix, uv, vec3 } from 'three/tsl';
import { moonPhase } from '../../../lib/astro/moon.js';
import { createMoon } from '../parts/anh-trang-moon.js';
import { paintCot } from '../parts/anh-trang-paint.js';

export const id = 'anh-trang';
export const knobs = [
  // Mặc định là pha trăng của ĐÊM NAY (ctx.now): value là hàm của env.
  { id: 'moonPhase', min: 0, max: Math.PI * 2, step: 0.01, value: (env) => moonPhase(env.now).phase },
  { id: 'rimPower', min: 0.5, max: 8, step: 0.1, value: 3 },
  { id: 'rimColor', kind: 'color', value: '#F2D48A' },
  { id: 'translucency', min: 0, max: 2, step: 0.01, value: 0.8 },
  { id: 'clearcoat', min: 0, max: 1, step: 0.01, value: 0 },
  { id: 'candleColor', kind: 'color', value: '#F2D48A' },
];

const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1
const SKY_FILL = 7; // trời chàm hắt xuống, nước đen hắt lên
const CANDLE = { intensity: 7, distance: 14, position: [-5, 0.08, 13] };

/** Đèn hoa đăng: 8 cánh (dùng lại hình cánh sen của Cốt) quây một ngọn nến là PointLight ấm. */
function createLantern(ctx, cot, w) {
  const hex = ctx.palette.hex;
  const candle = ctx.knob('candleColor'); // @knob candleColor
  const material = new MeshStandardNodeMaterial({ roughness: 0.8, side: DoubleSide });
  material.colorNode = mix(color(hex.datSet), color(hex.nga), w);
  // Giấy dó sáng từ trong ra: sáng ở gốc cánh (gần nến), nhạt dần lên mép.
  material.emissiveNode = candle.mul(mix(1.6, 0.3, uv().y)).mul(w);
  const mesh = new InstancedMesh(cot.petalGeometry, material, 8);
  const dummy = new Object3D();
  dummy.rotation.order = 'YXZ';
  for (let k = 0; k < 8; k++) {
    const yaw = (k / 8) * Math.PI * 2;
    dummy.position.set(CANDLE.position[0] + Math.cos(yaw) * 0.12, CANDLE.position[1], CANDLE.position[2] + Math.sin(yaw) * 0.12);
    dummy.rotation.set(-0.45, -yaw - Math.PI / 2, 0);
    dummy.scale.setScalar(0.55);
    dummy.updateMatrix();
    mesh.setMatrixAt(k, dummy.matrix);
  }
  const light = new PointLight(candle.value, 0, CANDLE.distance, 2);
  light.position.set(CANDLE.position[0], CANDLE.position[1] + 0.3, CANDLE.position[2]);
  return { mesh, light, candle };
}

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (lớp trước) và shared.moon (setup của bức)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const hex = ctx.palette.hex;
  const { cot } = shared;

  const moon = createMoon(ctx, w, ctx.knob('moonPhase')); // @knob moonPhase
  paintCot(ctx, cot, w, shared.moon.dir);

  // Ánh trăng bạc-ngà: DirectionalLight chiếu từ phía trăng. Cường độ là uniform bên trong
  // node đèn, nên đổi mỗi khung theo trọng số mà không biên dịch lại.
  const moonlight = new DirectionalLight(hex.nga, 0);
  const fill = new HemisphereLight(hex.cham, hex.denThen, 0);

  // MỘT shadow map, bật một lần lúc dựng theo mức (cao 1024 / vừa 512 / thấp tắt).
  // castShadow, receiveShadow, shadowMap.enabled nằm trong cache key: không bao giờ đổi lúc chạy.
  const shadowSize = ctx.budget.shadow ?? { cao: 1024, vua: 512, thap: 0 }[ctx.level];
  if (shadowSize > 0) {
    ctx.renderer.shadowMap.enabled = true;
    moonlight.castShadow = true;
    moonlight.shadow.mapSize.set(shadowSize, shadowSize);
    Object.assign(moonlight.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 320 });
    moonlight.shadow.bias = -0.0005;
    moonlight.shadow.normalBias = 0.03;
    for (const o of cot.casters) o.castShadow = true;
    for (const o of cot.receivers) o.receiveShadow = true;
  }

  const lantern = createLantern(ctx, cot, w);
  const added = [moon.moon, moonlight, moonlight.target, fill, lantern.mesh, lantern.light];
  ctx.scene.add(...added);

  let disposed = false;
  return {
    objects: [moon.moon, lantern.mesh],
    update(dt, t) {
      const k = w.value;
      const dir = shared.moon.dir.value;
      moon.update(dir);
      moonlight.position.copy(dir).multiplyScalar(150);
      moonlight.intensity = MOONLIGHT * k;
      fill.intensity = SKY_FILL * k;
      // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
      cot.hemi.intensity = cot.hemiIntensity * (1 - k);
      // Nến lung linh: hai sóng sin lệch nhịp, theo đồng hồ của xưởng (tất định với ?freeze).
      lantern.light.color.copy(lantern.candle.value);
      lantern.light.intensity = CANDLE.intensity * k * (0.85 + 0.15 * Math.sin(t * 13 + Math.sin(t * 7)));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(...added);
      moon.dispose();
      lantern.mesh.dispose();
      lantern.mesh.material.dispose();
      moonlight.dispose();
      fill.dispose();
      lantern.light.dispose();
    },
  };
}
```
Điểm học: cường độ và màu của **đèn** (`moonlight.intensity`, `hemi.intensity`, `light.color`) là uniform bên trong node đèn: đổi mỗi khung không biên dịch lại. Khác với số trên **material** (luật "không đặt số lên material lúc chạy").

- [ ] **Step 5: Khai báo lớp trong meta và painting**

Thay `src/paintings/ao-sen-dem/meta.js` bằng:
```js
// paintings/ao-sen-dem/meta.js — căn cước Bức 1 · Ao Sen Đêm: tên, thơ, poster, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'ao-sen-dem',
  no: 1,
  title: 'Ao Sen Đêm',
  tagline: 'Một ao sen đêm, sơn từ sáu lớp ánh sáng.',
  poem: {
    lines: [
      'Trong đầm gì đẹp bằng sen',
      'Lá xanh bông trắng lại chen nhị vàng',
      'Nhị vàng bông trắng lá xanh',
      'Gần bùn mà chẳng hôi tanh mùi bùn',
    ],
    source: 'Ca dao',
  },
  poster: {
    src: '/paintings/ao-sen-dem/poster.svg',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài ao sen đêm: trăng soi mặt nước đen, lá sen và những đốm vàng lá.',
  },
  // THỨ TỰ PHỦ: lớp đầu luôn là Cốt; lớp cuối là Phủ bóng dùng chung của xưởng.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/ao-sen-dem/layers/l1-cot.js',
        'paintings/ao-sen-dem/parts/cot-leaf.js',
        'paintings/ao-sen-dem/parts/cot-flower.js',
        'paintings/ao-sen-dem/parts/cot-reeds.js',
      ],
    },
    {
      id: 'anh-trang',
      name: 'Ánh trăng',
      files: [
        'paintings/ao-sen-dem/layers/l2-anh-trang.js',
        'paintings/ao-sen-dem/parts/anh-trang-moon.js',
        'paintings/ao-sen-dem/parts/anh-trang-paint.js',
      ],
    },
    {
      id: 'mat-nuoc',
      name: 'Mặt nước',
      files: ['paintings/ao-sen-dem/layers/l4-mat-nuoc.js'],
      poem: {
        lines: ['Vầng trăng ai xẻ làm đôi', 'Nửa in gối chiếc, nửa soi dặm trường'],
        source: 'Truyện Kiều',
        author: 'Nguyễn Du',
      },
    },
    { id: 'vang-la', name: 'Vàng lá', files: ['paintings/ao-sen-dem/layers/l5-vang-la.js'] },
    phuBong,
  ],
  // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
  fence: ['ripple', 'lotus', 'firefl', 'uhour', 'moondir', 'lantern', 'mặt nước', 'đom đóm', 'hoa sen', 'hoa đăng'],
};
```
(Hàng rào thêm `lantern`, `hoa đăng`: từ của bức, xưởng không được dùng. `anh-trang` tự vào hàng rào vì là id lớp riêng.)

Thay `src/paintings/ao-sen-dem/painting.js` bằng:
```js
// paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers) và camera.
import * as cot from './layers/l1-cot.js';
import * as anhTrang from './layers/l2-anh-trang.js';
import * as matNuoc from './layers/l4-mat-nuoc.js';
import * as vangLa from './layers/l5-vang-la.js';
import * as phuBong from '../../engine/stock/phu-bong/layer.js';

/**
 * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
 * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
 */
export const layers = [cot, anhTrang, matNuoc, vangLa, phuBong];

/** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, cử chỉ (shared.js). */
export { setup } from './shared.js';

/**
 * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
 * Camera đứng ở z = 32, cao 6, nhìn gần ngang về phía xa (−z): trăng thấp (4°–13°) nằm ở phần ba trên
 * của khung, lối trăng chạy từ chân trời về tiền cảnh. l1-cot chừa "lối trăng" hướng về đúng chỗ này.
 * breathe: camera "thở" nhẹ quanh điểm nhìn (xưởng tắt khi người xem xin giảm chuyển động).
 * @type {import('../../engine/contracts/runtime.js').CameraSpec}
 */
export const camera = {
  position: [0, 6, 32],
  target: [0, 2.2, -14],
  fov: 42,
  azimuth: [-0.6, 0.6],
  polar: [1.1, 1.52],
  distance: [24, 60],
  breathe: 0.4,
};
```

- [ ] **Step 6: Chạy toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  375 passed (375)`. Test hợp đồng kiểm: `painting.layers` cùng id, cùng thứ tự với `meta.layers`; marker của `anh-trang` (nằm trong 3 file của lớp) khớp 6 núm.

- [ ] **Step 7: Nhìn ảnh (và kiểm luật 3)**

Run: `npm run build && npx playwright test e2e/painting.spec.js --project=webgl2-swiftshader`, rồi mở `find e2e/.results -name freeze-40.png`.
Phải thấy: trăng vàng ngà ở phần ba trên, lệch trái (21:00), tỏa nhẹ; hai bông sen trắng sáng viền; lá xanh sẫm, gân lóe vàng chỗ ánh trăng lướt; đèn hoa đăng ấm ở dưới bên trái; nền đen then. (Mặt nước vẫn là bản v0: Task 12.)
Nếu lá quá tối để thấy màu: tăng `SKY_FILL` (5–9). Nếu trăng cháy trắng không thấy vết biển: giảm `MOON.glow` (0,9–1,4).

Kiểm luật 3 (mọi trọng số về 0 là cốt đất sét), bằng một sửa TẠM không commit: trong `src/engine/gpu/run.js` đổi `createWeights(entry.meta.layers)` thành `createWeights(entry.meta.layers, 0)`, chạy lại lệnh trên và mở ảnh. Phải thấy cả ao, hoa, lau và quả cầu trăng màu đất sét xám dưới đèn xưởng, nền đen then, không đom đóm, không bloom. Rồi hoàn lại: `git checkout -- src/engine/gpu/run.js`.

- [ ] **Step 8: Commit**

```bash
git add src/paintings/ao-sen-dem/layers/l2-anh-trang.js src/paintings/ao-sen-dem/parts/anh-trang-moon.js src/paintings/ao-sen-dem/parts/anh-trang-paint.js src/paintings/ao-sen-dem/meta.js src/paintings/ao-sen-dem/painting.js tests/paintings/ao-sen-dem/anh-trang.test.js
git commit -m "feat(ao-sen-dem): lớp Ánh trăng: trăng đúng pha đêm nay, ánh trăng và bóng theo mức, sơn màu ca dao, đèn hoa đăng

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Lớp 4 · Mặt nước hoàn chỉnh (gợn sóng xẻ trăng, lối trăng lấp lánh, lá nhấp nhô)

**Mục tiêu:** Spec §6 L4, tiêu chí thành công 2.
- **Nước có chiếu sáng** (`MeshStandardNodeMaterial`): ở trọng số 0 đĩa là đất sét dưới đèn như mọi hình khác (mục hoãn của GĐ 0: v0 dùng MeshBasic không chiếu sáng, nên khi đèn xưởng lui thì đĩa vẫn sáng xám).
- **Ảnh phản chiếu** (reflector) cộng vào qua `emissiveNode`, nhân Schlick fresnel `F0 + (1 − F0)(1 − N·V)^fresnelPower`.
- **Kênh MRT `emissive` riêng** (`mrtNode`): chỉ phần phản chiếu sáng vượt ngưỡng mới bloom (bóng trăng, bóng đom đóm), cả mặt nước thì không.
- **Pháp tuyến** = sai phân của độ cao gợn sóng (`makeRippleHeight`, Task 9) + hai lớp noise trôi (một lớp tần số cao kéo dọc). Nó lệch UV của ảnh phản chiếu (vòng gợn đi qua là bóng trăng bị xẻ) và làm độ nhám rất thấp tạo **lối trăng lấp lánh**: đó là specular của ánh trăng (lớp 2) trên pháp tuyến gợn, nên tự tắt khi lớp Ánh trăng tắt.
- **Lá nổi của Cốt nhấp nhô** theo cùng hàm sóng, đọc tâm lá.

**Files:**
- Modify: `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js` (viết lại)
- Create: `tests/paintings/ao-sen-dem/mat-nuoc.test.js`
- Modify: `tests/paintings/ao-sen-dem.test.js` (bỏ phần `l4-mat-nuoc` cũ)

**Interfaces:**
- Consumes: `shared.ripples.node`, `makeRippleHeight` (Task 9), `shared.cot.leafMaterial` + thuộc tính `instanceCenter` (Task 10), `ctx.budget.reflection ?? (cao 0.5, còn lại 0.35)`.
- Produces: `knobs`: `amplitude` (0,35), `speed` (3), `decay` (0,55), `wavelength` (1,4), `distortion` (0,04), `fresnelPower` (5). `layer.objects = [water]`. Gán `shared.cot.leafMaterial.positionNode` (lá đứng thì không). `refl.target` được thêm vào scene NGAY TRƯỚC mặt nước (test dựa vào thứ tự này).

- [ ] **Step 1: Test**

`tests/paintings/ao-sen-dem/mat-nuoc.test.js`:
```js
// tests/paintings/ao-sen-dem/mat-nuoc.test.js — Lớp 4 · Mặt nước: đĩa nước có chiếu sáng, reflector nằm ngang, MRT riêng, lá nhấp nhô.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as matNuoc from '../../../src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'mat-nuoc', ...options });

describe('l4-mat-nuoc', () => {
  it('núm tĩnh: 4 núm gợn sóng + distortion + fresnelPower', () => {
    expect(matNuoc.id).toBe('mat-nuoc');
    expect(matNuoc.knobs.map((k) => k.id)).toEqual(['amplitude', 'speed', 'decay', 'wavelength', 'distortion', 'fresnelPower']);
  });

  it('đĩa nước nằm ngang bán kính 60; material CÓ chiếu sáng (luật 3: trọng số 0 là đất sét dưới đèn)', () => {
    const [water] = build().layers['mat-nuoc'].objects;
    expect(water.material.isMeshStandardNodeMaterial).toBe(true);
    for (const key of ['colorNode', 'normalNode', 'emissiveNode', 'mrtNode']) expect(water.material[key], key).toBeTruthy();
    water.geometry.computeBoundingSphere();
    expect(water.geometry.boundingSphere.radius).toBeCloseTo(60, 5);
    expect(water.geometry.getAttribute('normal').getY(0)).toBeCloseTo(1, 5);
  });

  it('target của reflector nằm TRONG scene và trục +Z của nó chỉ lên trời (gương nằm ngang)', () => {
    const { ctx, layers } = build();
    const [water] = layers['mat-nuoc'].objects;
    // Lớp Ánh trăng cũng thêm một Object3D (target của đèn trăng); lớp này thêm target NGAY TRƯỚC mặt nước.
    const target = ctx.scene.children[ctx.scene.children.indexOf(water) - 1];
    expect(target.type).toBe('Object3D');
    expect(target?.parent).toBe(ctx.scene);
    ctx.scene.updateMatrixWorld();
    expect(new Vector3(0, 0, 1).transformDirection(target.matrixWorld).y).toBeCloseTo(1, 5);
  });

  it('lá nổi của Cốt nhấp nhô: lớp này gán positionNode cho leafMaterial (lá đứng thì không)', () => {
    const { shared } = build();
    expect(shared.cot.leafMaterial.positionNode).toBeTruthy();
    expect(shared.cot.standingMaterial.positionNode).toBeNull();
  });

  it('dispose gỡ nước và target (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const before = ctx.scene.children.length;
    layers['mat-nuoc'].dispose();
    layers['mat-nuoc'].dispose();
    expect(ctx.scene.children).toHaveLength(before - 2);
  });
});
```

Trong `tests/paintings/ao-sen-dem.test.js`: xóa khối `describe('l4-mat-nuoc (Mặt nước v0)', …)` và dòng `import * as matNuoc …`. Xóa cả `Vector3` khỏi dòng import `three/webgpu` nếu không còn dùng.

Run: `npx vitest run tests/paintings/ao-sen-dem/mat-nuoc.test.js`
Expected: FAIL: `expected false to be true` (material còn là MeshBasic), thiếu 4 núm gợn sóng, `leafMaterial.positionNode` là `null`.

- [ ] **Step 2: Viết lại `layers/l4-mat-nuoc.js`**

```js
// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector), gợn sóng xẻ bóng trăng, lá nhấp nhô.
import { CircleGeometry, Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
import {
  Fn,
  attribute,
  cameraPosition,
  color,
  dot,
  float,
  max,
  mix,
  mrt,
  mx_noise_vec3,
  normalize,
  oneMinus,
  positionLocal,
  positionWorld,
  pow,
  reflector,
  saturate,
  transformNormalToView,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import { makeRippleHeight } from '../shared.js';

export const id = 'mat-nuoc';
export const knobs = [
  { id: 'amplitude', min: 0, max: 1, step: 0.01, value: 0.35 },
  { id: 'speed', min: 0.5, max: 8, step: 0.1, value: 3 },
  { id: 'decay', min: 0.1, max: 2, step: 0.01, value: 0.55 },
  { id: 'wavelength', min: 0.3, max: 4, step: 0.05, value: 1.4 },
  { id: 'distortion', min: 0, max: 0.15, step: 0.001, value: 0.04 },
  { id: 'fresnelPower', min: 1, max: 10, step: 0.1, value: 5 },
];

const WATER_RADIUS = 60; // đĩa nước thuộc lớp này; ở trọng số 0 nó là đất sét
const F0 = 0.03; // phản xạ khi nhìn thẳng xuống (Schlick): nước và sơn bóng đều khoảng 2–4%
const BOB = 0.6; // lá nhô lên bằng 60% độ cao sóng
const GLINT = 0.8; // phần phản chiếu sáng hơn mức này mới vào kênh emissive (bloom)

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.ripples (setup của bức), shared.cot (lớp trước)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng (tất định với ?freeze), KHÔNG dùng time của TSL
  const hex = ctx.palette.hex;

  const ripple = makeRippleHeight({
    ripples: shared.ripples.node,
    time: t,
    amplitude: ctx.knob('amplitude'), // @knob amplitude
    speed: ctx.knob('speed'), // @knob speed
    decay: ctx.knob('decay'), // @knob decay
    wavelength: ctx.knob('wavelength'), // @knob wavelength
  });

  // Pháp tuyến của nước: sai phân của độ cao gợn sóng, cộng hai lớp noise trôi ngược chiều ("nước thở").
  const normal = Fn(() => {
    const p = positionWorld.xz;
    const e = 0.05;
    const h = ripple(p);
    const slope = vec2(h.sub(ripple(p.add(vec2(e, 0)))), h.sub(ripple(p.add(vec2(0, e))))).div(e);
    const slow = mx_noise_vec3(vec3(p.mul(0.18).add(vec2(t.mul(0.05), 0)), t.mul(0.1)));
    const fast = mx_noise_vec3(vec3(p.mul(vec2(1.4, 3.2)).sub(vec2(0, t.mul(0.3))), t.mul(0.4)));
    const breath = slow.xy.mul(0.15).add(fast.xy.mul(0.35));
    return normalize(vec3(slope.x.add(breath.x), 1, slope.y.add(breath.y)));
  })();

  // Reflector: mỗi khung render lại cả cảnh từ camera lật qua mặt nước, vào texture nhỏ hơn màn hình.
  const refl = reflector({ resolutionScale: ctx.budget.reflection ?? (ctx.level === 'cao' ? 0.5 : 0.35) });
  // Pháp tuyến của gương là +Z cục bộ của target: xoay −π/2 để +Z chỉ lên trời. Reflector đọc
  // target.matrixWorld mà KHÔNG tự cập nhật: target phải nằm trong scene, nếu không ta có gương dựng đứng.
  refl.target.rotateX(-Math.PI / 2);
  ctx.scene.add(refl.target);
  // Sóng làm lệch chỗ đọc ảnh phản chiếu: vòng gợn đi qua là bóng trăng bị xẻ đôi.
  refl.uvNode = refl.uvNode.add(normal.xz.mul(ctx.knob('distortion'))); // @knob distortion

  // Schlick fresnel: nhìn càng xiên (về chân trời) nước càng soi rõ; nhìn thẳng xuống thì thấy nước sâu.
  const view = normalize(cameraPosition.sub(positionWorld));
  const fresnel = float(F0).add(oneMinus(saturate(dot(normal, view))).pow(ctx.knob('fresnelPower')).mul(1 - F0)); // @knob fresnelPower
  const mirror = refl.rgb.mul(fresnel).mul(w);

  // Có chiếu sáng: ở trọng số 0 đĩa là đất sét dưới đèn xưởng như mọi hình khác (luật 3).
  const material = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0 });
  material.colorNode = mix(color(hex.datSet), color(hex.denThen), w);
  material.roughnessNode = mix(float(0.9), float(0.06), w);
  material.normalNode = transformNormalToView(mix(vec3(0, 1, 0), normal, w)); // đĩa đặt ở gốc: local = world
  // Ảnh phản chiếu cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
  material.emissiveNode = mirror;
  // ...nhưng kênh MRT 'emissive' của nước CHỈ nhận phần sáng vượt GLINT: bóng trăng và bóng đom đóm
  // tỏa nhẹ, còn cả mặt nước thì không. mrtNode chỉ an toàn vì reflector tự ẩn chính mặt nước khi
  // chụp: material có mrtNode mà vẽ vào target KHÔNG có MRT sẽ hỏng shader (Phụ lục A).
  material.mrtNode = mrt({ emissive: vec4(max(mirror.sub(GLINT), 0), 1) });

  const geometry = new CircleGeometry(WATER_RADIUS, 96).rotateX(-Math.PI / 2);
  const water = new Mesh(geometry, material);
  ctx.scene.add(water);

  // Lá nổi của Cốt nhấp nhô theo cùng hàm sóng, đọc TÂM lá (positionNode chạy sau instancing).
  const center = attribute('instanceCenter', 'vec2');
  shared.cot.leafMaterial.positionNode = positionLocal.add(vec3(0, ripple(center).mul(BOB).mul(w), 0));

  let disposed = false;
  return {
    objects: [water],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(water, refl.target);
      geometry.dispose();
      material.dispose();
      refl.dispose(); // giải phóng render target của ảnh phản chiếu
    },
  };
}
```
Điểm học (đã kiểm trên cả hai backend, Phụ lục A mới):
- `material.mrtNode = mrt({ emissive: … })` ghi đè kênh `emissive` của MRT chỉ cho material này. Chỉ an toàn vì reflector tự ẩn chính mặt nước khi chụp: material có `mrtNode` mà bị vẽ vào target không có MRT (ảnh của reflector, bóng…) sẽ hỏng shader.
- Tắt ảnh phản chiếu mà giữ độ nhám 0,06 thì lối trăng vẫn còn: vệt sáng là specular của ánh trăng, không phải ảnh của quả cầu trăng.

- [ ] **Step 3: Chạy toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  377 passed (377)`.

- [ ] **Step 4: Nhìn ảnh và thử chạm**

Run: `npm run build && npx playwright test e2e/painting.spec.js --project=webgl2-swiftshader`, mở `find e2e/.results -name freeze-40.png`.
Phải thấy: mặt nước đen như sơn then; một lối trăng lấp lánh chạy từ chân trời xuống giữa khung, giữa hai bông sen; bóng hoa và lá in trên nước.

Kiểm tay: `npm run dev`, mở `…/?webgl&at=2026-09-28T21:00`, chạm lên lối trăng: vòng gợn lan ra, cắt ngang lối trăng và làm vỡ bóng trăng; lá nổi gần đó nhấp nhô khi vòng sóng đi qua. Nếu gợn quá mờ: tăng `amplitude` (tới 0,6) hoặc `distortion` (tới 0,08).

- [ ] **Step 5: Commit**

```bash
git add src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js tests/paintings/ao-sen-dem/mat-nuoc.test.js tests/paintings/ao-sen-dem.test.js
git commit -m "feat(ao-sen-dem): Mặt nước hoàn chỉnh: gợn sóng xẻ bóng trăng, lối trăng lấp lánh, lá nhấp nhô, nước là đất sét khi tắt lớp

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Lớp 5 · Vàng lá bản đơn giản (tụ quanh tay, tản khi chạm, bung khi thả)

**Mục tiêu:** Spec §4.2, §6 L5 (bản đơn giản của GĐ 1): kernel compute cộng thêm một **gia tốc** về phía `shared.attract.point`, nhân `shared.attract.strength` (Task 9 điều khiển theo cử chỉ: giữ → tiến dần tới 1; chạm → −0,6; thả → −1,5 rồi tắt dần) và núm `attraction`. Có thành phần bay vòng quanh điểm hút; tốc độ bị kẹp để bung ra không văng khỏi ao. Vẫn chỉ 2 bộ đệm mỗi kernel (giới hạn WebGL2); điểm hút và lực là uniform, không phải bộ đệm.

**Files:**
- Modify: `src/paintings/ao-sen-dem/layers/l5-vang-la.js`
- Create: `tests/paintings/ao-sen-dem/vang-la.test.js`
- Delete: `tests/paintings/ao-sen-dem.test.js` (phần cuối cùng của file test v0)

**Interfaces:**
- Consumes: `shared.attract.point` (uniform vec3), `shared.attract.strength` (uniform float) (Task 9).
- Produces: `knobs`: `size` (0,12), `glow` (3), `attraction` (1). `createLayer(ctx, shared)` (tham số thứ 2 bắt buộc từ GĐ 1).

- [ ] **Step 1: Test**

`tests/paintings/ao-sen-dem/vang-la.test.js`:
```js
// tests/paintings/ao-sen-dem/vang-la.test.js — Lớp 5 · Vàng lá (bản đơn giản): compute trên GPU, một Sprite, hút/đẩy theo cử chỉ.
import { describe, it, expect } from 'vitest';
import { AdditiveBlending } from 'three/webgpu';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'vang-la', ...options });

describe('l5-vang-la', () => {
  it('núm tĩnh size, glow, attraction', () => {
    expect(vangLa.id).toBe('vang-la');
    expect(vangLa.knobs.map((k) => [k.id, k.value])).toEqual([['size', 0.12], ['glow', 3], ['attraction', 1]]);
  });

  it('kernel khởi tạo chạy MỘT lần lúc dựng; mỗi update chạy kernel bước', () => {
    const { ctx, layers } = build();
    const calls = ctx.renderer.compute.mock.calls;
    expect(calls).toHaveLength(1);
    expect([calls[0][0].isComputeNode, calls[0][0].count]).toEqual([true, 3000]);
    layers['vang-la'].update(1 / 60, 1 / 60);
    layers['vang-la'].update(1 / 60, 2 / 60);
    expect(calls).toHaveLength(3);
    expect(calls[1][0]).not.toBe(calls[0][0]);
    expect(calls[2][0]).toBe(calls[1][0]);
  });

  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, có emissiveNode; số con theo mức', () => {
    const [sprite] = build().layers['vang-la'].objects;
    expect(sprite.isSprite).toBe(true);
    expect(sprite.count).toBe(3000);
    expect(sprite.frustumCulled).toBe(false);
    expect(sprite.material.blending).toBe(AdditiveBlending);
    expect(sprite.material.depthWrite).toBe(false);
    expect(sprite.material.emissiveNode).toBeTruthy();
    expect(build({ level: 'thap' }).layers['vang-la'].objects[0].count).toBe(600);
    expect(build({ budget: { fireflies: 7 } }).layers['vang-la'].objects[0].count).toBe(7);
  });

  it('dispose gỡ sprite (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const [sprite] = layers['vang-la'].objects;
    layers['vang-la'].dispose();
    layers['vang-la'].dispose();
    expect(sprite.parent).toBeNull();
    expect(ctx.scene.children).not.toContain(sprite);
  });
});
```

```bash
git rm tests/paintings/ao-sen-dem.test.js
```

Run: `npx vitest run tests/paintings/ao-sen-dem/vang-la.test.js`
Expected: FAIL: núm chỉ có `size`, `glow` (thiếu `attraction`).

- [ ] **Step 2: Viết `layers/l5-vang-la.js`**

```js
// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá (bản đơn giản): đom đóm tính trên GPU, tụ quanh tay, tản khi chạm.
import { AdditiveBlending, Sprite, SpriteNodeMaterial } from 'three/webgpu';
import {
  Fn,
  clamp,
  color,
  cos,
  exp,
  float,
  fract,
  hash,
  instanceIndex,
  instancedArray,
  length,
  max,
  min,
  mix,
  shapeCircle,
  sin,
  smoothstep,
  sqrt,
  vec3,
  vec4,
} from 'three/tsl';

export const id = 'vang-la';
export const knobs = [
  { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
  { id: 'glow', min: 0, max: 10, step: 0.1, value: 3 },
  { id: 'attraction', min: 0, max: 3, step: 0.01, value: 1 },
];

const RADIUS = 40; // đom đóm lượn trong đĩa bán kính này
const LOW = 0.3; // và trong khoảng độ cao [LOW, HIGH] trên mặt nước
const HIGH = 4;
const MAX_SPEED = 6; // bung ra nhanh cỡ nào cũng không văng khỏi ao

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.attract (setup của bức): điểm hút và lực hút theo cử chỉ
 */
export function createLayer(ctx, shared) {
  const count = ctx.budget.fireflies ?? { cao: 3000, vua: 1500, thap: 600 }[ctx.level];
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một đàn đom đóm
  const dt = ctx.u.delta;

  // Hai bộ đệm nằm trên GPU, mỗi con một ô vec4. Mỗi kernel chỉ đụng 2 bộ đệm:
  // WebGL2 chạy compute bằng transform feedback và chỉ cho tối đa 4 bộ đệm mỗi kernel.
  const posPhase = instancedArray(count, 'vec4'); // xyz = vị trí, w = pha nhấp nháy [0, 1)
  const velSeed = instancedArray(count, 'vec4'); // xyz = vận tốc, w = hạt giống riêng [0, 1)

  // Kernel khởi tạo: mỗi luồng GPU lo MỘT con. hash(instanceIndex) là ngẫu nhiên tất định,
  // √u cho mật độ đều theo diện tích đĩa. Chạy một lần ngay lúc dựng lớp.
  const init = Fn(() => {
    const i = instanceIndex;
    const r = sqrt(hash(i)).mul(RADIUS);
    const a = hash(i.add(1)).mul(Math.PI * 2);
    const y = mix(LOW, HIGH, hash(i.add(2)));
    posPhase.element(i).assign(vec4(cos(a).mul(r), y, sin(a).mul(r), hash(i.add(3))));
    velSeed.element(i).assign(vec4(0, 0, 0, hash(i.add(4))));
  })().compute(count);
  ctx.renderer.compute(init);

  // Kernel bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình — trên WebGL2,
  // element(i) luôn trả ô của chính luồng đang chạy, nên không đọc được hàng xóm.
  const step = Fn(() => {
    const cell = posPhase.element(instanceIndex);
    const vs = velSeed.element(instanceIndex);
    const p = cell.xyz.toVar();
    const seed = vs.w;
    // Hướng muốn bay: mỗi con lượn theo nhịp sin/cos riêng, cộng một dòng xoáy chậm quanh tâm ao.
    const wander = vec3(
      sin(t.mul(0.31).add(seed.mul(61))),
      sin(t.mul(0.47).add(seed.mul(23))).mul(0.3),
      cos(t.mul(0.23).add(seed.mul(37))),
    ).mul(0.5);
    const swirl = vec3(p.z.negate(), 0, p.x).mul(0.012);
    // Quán tính: vận tốc chỉ ngả dần về hướng muốn bay, nên đường bay mềm, không giật.
    const v = mix(vs.xyz, wander.add(swirl), min(dt.mul(1.5), 1)).toVar();
    // Tay người xem: lực > 0 hút về điểm chạm và kéo bay vòng quanh; lực < 0 đẩy ra (tản, bung).
    // Chỉ con ở gần mới chịu lực (giảm theo exp của khoảng cách). Lực là gia tốc: cộng thẳng vào vận tốc.
    const toward = shared.attract.point.sub(p);
    const dist = max(length(toward), 0.001);
    const dir = toward.div(dist);
    const orbit = vec3(dir.z.negate(), 0, dir.x).mul(0.8);
    const pull = dir.add(orbit).mul(shared.attract.strength).mul(exp(dist.div(10).negate()));
    v.addAssign(pull.mul(ctx.knob('attraction')).mul(8).mul(dt)); // @knob attraction
    v.assign(v.mul(min(float(1), float(MAX_SPEED).div(max(length(v), 0.001)))));
    p.addAssign(v.mul(dt));
    // Giữ đàn trong đĩa bán kính RADIUS và trong khoảng độ cao.
    const k = min(float(1), float(RADIUS).div(max(length(p.xz), 0.001)));
    cell.assign(vec4(p.x.mul(k), clamp(p.y, LOW, HIGH), p.z.mul(k), cell.w));
    vs.assign(vec4(v, seed));
  })().compute(count);

  // Hiển thị: MỘT Sprite vẽ `count` bản sao (instancing); vị trí đọc thẳng bộ đệm compute
  // qua toAttribute() (thành vertex attribute, không cần storage buffer ở vertex stage).
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  const attr = posPhase.toAttribute();
  material.positionNode = attr.xyz;
  const phase = attr.w;
  const rate = float(1.2).add(fract(phase.mul(7.31)).mul(1.8)); // mỗi con một nhịp nháy riêng
  // Chỉ lóe khi sin > 0.75 (khoảng 1/4 chu kỳ): cả nghìn con cùng sáng thì bloom phủ vàng kín khung.
  const blink = smoothstep(0.75, 1, sin(t.mul(rate).add(phase.mul(Math.PI * 2))));
  const shape = shapeCircle(); // đĩa tròn trên ô vuông của sprite
  const gold = color(ctx.palette.hex.vangLaSang);
  material.colorNode = vec3(0); // chỉ phát sáng: không cộng thêm màu trắng mặc định của sprite
  material.emissiveNode = gold.mul(ctx.knob('glow')).mul(blink).mul(shape).mul(w); // @knob glow
  material.opacityNode = shape.mul(w); // trọng số 0 → tắt hẳn
  material.scaleNode = ctx.knob('size'); // @knob size

  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false; // bounding của sprite không biết vị trí nằm trong bộ đệm GPU
  ctx.scene.add(sprite);

  let disposed = false;
  return {
    objects: [sprite],
    update() {
      ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(sprite);
      material.dispose();
      init.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      step.dispose();
    },
  };
}
```

- [ ] **Step 3: Chạy toàn bộ**

Run: `npm test`
Expected: PASS, `Tests  378 passed (378)`.

- [ ] **Step 4: Thử tay**

`npm run build && npx playwright test --project=static --project=webgl2-swiftshader` (PASS), rồi `npm run dev`, mở `…/?webgl`:
- giữ chuột trên mặt nước khoảng 1 giây: đom đóm quanh đó tụ lại, bay vòng quanh con trỏ; camera không xoay trong lúc giữ;
- thả: chúng bung ra rồi trôi lững lờ lại;
- chạm nhanh: gợn sóng + đom đóm gần đó tản nhẹ.

- [ ] **Step 5: Commit**

```bash
git add src/paintings/ao-sen-dem/layers/l5-vang-la.js tests/paintings/ao-sen-dem/vang-la.test.js
git commit -m "feat(ao-sen-dem): Vàng lá bản đơn giản: đom đóm tụ quanh tay, tản khi chạm, bung khi thả

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 14: E2E của Bức 1: chạm mặt nước đổi ảnh, gợi ý → lời mời, chữ tải hỏng

**Mục tiêu:** Spec §12 (E2E, dòng GĐ 1): "chạm mặt nước thì ảnh đổi, so hai lần chạy cùng `?at&freeze=N` khác nhau đúng một thao tác". Test cũng khẳng định điều ngược lại: không chạm thì hai lần chạy **giống hệt** (§8.7), nếu không thì phép so "khác nhau" vô nghĩa. Thêm Review Focus #3 (chunk chữ hỏng).

**Files:**
- Modify: `e2e/ao-sen-dem.spec.js` (thay bằng bản đầy đủ)

**Interfaces:**
- Consumes: `waitForSettled`, `waitForFrames`, `canvasStats`, `gpuReport`, `collectConsole`, `readSma` (`e2e/helpers.js`, đã có); metadata project `{ kind, query, backend }` (`playwright.config.js`).
- Produces: —

- [ ] **Step 1: Viết bản đầy đủ**

Thay `e2e/ao-sen-dem.spec.js` bằng:
```js
// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm mặt nước thì ảnh đổi; gợi ý → lời mời; trăng SVG ở tầng tĩnh.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';

const AT = 'at=2026-09-28T21:00';
const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
const TAP_AFTER = 15; // chạm sau khung này
// Điểm chạm: giữa ngang, 80% chiều cao khung — mặt nước ngay trước camera, trên lối trăng.
const WATER = { x: 0.5, y: 0.8 };

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/** Mở cảnh ở ?freeze=N, (tùy chọn) chạm mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas. */
async function run(page, testInfo, { tap }) {
  const { query } = testInfo.project.metadata;
  await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  let tappedAt = null;
  if (tap) {
    await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    tappedAt = (await readSma(page)).frames;
  }
  const sma = await waitForFrames(page, N, { timeout: 120_000 });
  expect(sma.frames).toBe(N);
  return { stats: await canvasStats(page), tappedAt };
}

test.describe('Ao Sen Đêm · chạm mặt nước', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('cùng ?at&freeze: không chạm thì hai lần giống hệt; chạm một lần thì ảnh khác', async ({ page }, testInfo) => {
    test.setTimeout(300_000); // ba lần chạy × 90 khung trên GPU phần mềm
    const a = await run(page, testInfo, { tap: false });
    const b = await run(page, testInfo, { tap: false });
    expect(b.stats.checksum, 'hai lần chạy cùng ?at&freeze phải cho cùng một ảnh (§8.7)').toBe(a.stats.checksum);
    const c = await run(page, testInfo, { tap: true });
    expect(c.tappedAt, 'cú chạm đến quá muộn: vòng gợn không kịp lan').toBeLessThan(N - 30);
    await page.screenshot({ path: testInfo.outputPath('cham-mat-nuoc.png') });
    expect(c.stats.checksum, 'chạm mặt nước mà ảnh không đổi: gợn sóng không chạy').not.toBe(a.stats.checksum);
    expect(log.errors).toEqual([]);
  });

  test('gợi ý "Chạm vào mặt nước" khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const hint = page.locator('[data-hint]');
    await expect(hint).toHaveText('Chạm vào mặt nước');
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
    await expect(hint).toHaveText(/^Bức tranh này có \d+ lớp — mài thử\?$/);
  });
});

test.describe('Ao Sen Đêm · chữ của bức tải hỏng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  // Review Focus #3: vừa deploy, HTML cũ trỏ tới chunk chữ đã bị xóa. Cảnh 3D không phụ thuộc chữ.
  test('content.vi-*.js lỗi → cảnh vẫn live, không có gợi ý, không vỡ', async ({ page }, testInfo) => {
    const { query } = testInfo.project.metadata;
    await page.route(/content\.vi-[\w-]+\.js$/, (route) => route.abort());
    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=20`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    const sma = await waitForFrames(page, 20);
    expect(sma.state).toBe('live');
    await expect(page.locator('[data-hint]')).toBeHidden();
  });
});

test.describe('Ao Sen Đêm · tầng tĩnh', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
  });

  test('?static&at=… → trăng SVG đúng pha đêm 18 tháng Tám (trăng tàn, sáng bên trái)', async ({ page }) => {
    await page.goto(`./?static&${AT}`);
    await waitForSettled(page);
    const d = await page.locator('[data-moon] .moon-lit').getAttribute('d');
    // Sau rằm: nửa vòng ngoài đi qua bên TRÁI (sweep 0), phần sáng lớn hơn nửa đĩa.
    expect(d).toMatch(/^M0 -1A1 1 0 0 0 0 1A/);
    await expect(page.locator('[data-moon]')).toBeVisible();
    await expect(page.locator('[data-hint]')).toBeHidden();
  });
});
```
Vì sao chạm được ở khung xác định: cử chỉ vào hàng đợi và được xử lý ở ĐẦU khung kế tiếp (Task 7), gợn sóng lấy thời điểm từ `ctx.u.time` (tất định với `?freeze`). Test đọc `__sma.frames` ngay sau cú chạm và đòi nó còn cách khung cuối ít nhất 30 khung, để vòng gợn kịp lan.

- [ ] **Step 2: Chạy e2e chặn**

Run: `npm run build && npx playwright test --project=static --project=webgl2-swiftshader`
Expected: PASS toàn bộ (khoảng 13 test chạy, còn lại tự bỏ qua theo project; test chạm mặt nước mất khoảng 1 phút trên SwiftShader). Mở `find e2e/.results -name cham-mat-nuoc.png`: thấy vòng gợn cắt ngang lối trăng.

- [ ] **Step 3: Chạy e2e WebGPU (không chặn)**

Run: `npx playwright test --project=webgpu-swiftshader`
Expected: PASS trên macOS (test chạm mặt nước mất tới 3 phút ở mức cao; hạn của test là 5 phút). Nếu project báo "Không có WebGPU adapter" thì tự bỏ qua, không phải lỗi.

- [ ] **Step 4: Commit**

```bash
git add e2e/ao-sen-dem.spec.js
git commit -m "test(e2e): chạm mặt nước đổi ảnh (và không chạm thì tất định), gợi ý thành lời mời, chữ tải hỏng vẫn live

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: CI: thử cho WebGPU e2e chạy được trên ubuntu; dọn workflow

**Mục tiêu:** Mục hoãn của GĐ 0: trên `ubuntu-latest`, mọi test 3D của project WebGPU rơi về tĩnh với `device-lost: "A valid external Instance reference no longer exists"` (headless shell + SwiftShader); trên macOS và trên trang thật thì chạy. Thử có giới hạn **tối đa 3 lần chạy CI**; bước WebGPU vẫn **không chặn** dù kết quả thế nào (spec §12). Kèm hai mục nhỏ: `persist-credentials: false` cho checkout, `timeout-minutes` cho job deploy.

**Files:**
- Modify: `playwright.config.js` (project `webgpu-swiftshader`), `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: —
- Produces: nhánh `gd1-ao-sen-dau-tien` trên GitHub và một PR nháp (Task 17 merge PR này).

- [ ] **Step 1: Phương án A: Chromium đầy đủ (new headless) cho project WebGPU**

`playwright.config.js`, project `webgpu-swiftshader`: thay dòng `use: { … }` bằng:
```js
      // channel 'chromium' = trình duyệt Chromium đầy đủ ở chế độ headless mới, thay cho headless shell.
      // Trên ubuntu, headless shell làm mất device WebGPU ("A valid external Instance reference no longer exists").
      use: {
        browserName: 'chromium',
        channel: 'chromium',
        launchOptions: { args: ['--enable-unsafe-webgpu', ...SWIFTSHADER] },
      },
```

`.github/workflows/deploy.yml`:
- bước `actions/checkout@v7`: thêm
  ```yaml
        with:
          persist-credentials: false
  ```
- bước cài trình duyệt: đổi `npx playwright install --with-deps --only-shell chromium` thành `npx playwright install --with-deps chromium` (cài cả Chromium đầy đủ lẫn headless shell), và đổi tên bước thành `Cài Chromium (đầy đủ + headless shell) và thư viện hệ thống`;
- bước WebGPU: đổi tên thành `E2E không chặn · WebGPU trên SwiftShader (Chromium đầy đủ)`;
- job `deploy`: thêm `timeout-minutes: 10` ngay dưới `runs-on: ubuntu-latest`.

Kiểm cú pháp: `ruby -ryaml -e 'YAML.load_file(".github/workflows/deploy.yml"); puts "ok"'`
Expected: `ok`.

Kiểm local: `npx playwright test --project=webgpu-swiftshader -g "freeze=10"`
Expected: PASS (Chromium đầy đủ chạy được SwiftShader WebGPU trên macOS; đã thử).

- [ ] **Step 2: Commit, push nhánh, mở PR nháp, xem CI**

```bash
git add playwright.config.js .github/workflows/deploy.yml
git commit -m "ci: WebGPU e2e dùng Chromium đầy đủ trên ubuntu; checkout không giữ credentials; deploy có timeout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin gd1-ao-sen-dau-tien
gh pr create --draft --base main --title "GĐ 1 · Ao sen đầu tiên" --body "Kế hoạch: docs/superpowers/plans/2026-09-28-gd1-ao-sen-dau-tien.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
gh run watch "$(gh run list --branch gd1-ao-sen-dau-tien --limit 1 --json databaseId --jq '.[0].databaseId')"
```
(Run của PR có thể cần vài giây mới xuất hiện; `gh run list` rỗng thì chạy lại lệnh cuối.)
Expected: các bước chặn (Vitest, build, e2e tĩnh + WebGL2) xanh. Xem kết quả bước WebGPU: `gh run view --log | grep -A3 "webgpu-swiftshader"`.

- [ ] **Step 3: Nếu WebGPU vẫn hỏng với cùng lỗi: phương án B (cờ Vulkan của SwiftShader)**

Chỉ làm khi Step 2 cho thấy lỗi `device-lost` như cũ. Trong `playwright.config.js`, project `webgpu-swiftshader`, đổi `args` thành:
```js
        launchOptions: {
          args: [
            '--enable-unsafe-webgpu',
            ...SWIFTSHADER,
            // Chỉ trên CI (ubuntu): cho Dawn dùng SwiftShader qua Vulkan.
            ...(process.env.CI ? ['--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader'] : []),
          ],
        },
```
Commit (`ci: thử cờ Vulkan SwiftShader cho WebGPU e2e trên ubuntu`), push, `gh run watch` như Step 2.

- [ ] **Step 4: Chốt kết quả (không quá 3 lần chạy CI)**

- Nếu một phương án xanh: giữ nó; bước WebGPU vẫn `continue-on-error` (spec: không chặn cho tới khi chạy ổn nhiều lần). Ghi phương án vào README ở Task 16.
- Nếu cả hai đều hỏng: hoàn lại `playwright.config.js` và bước cài trình duyệt về như GĐ 0 (`--only-shell`), giữ `persist-credentials` và `timeout-minutes`, commit `ci: giữ WebGPU e2e không chặn; ghi lại hai phương án đã thử`. Task 16 ghi hai phương án đã thử và thông điệp lỗi vào README (mục Kiểm thử) để GĐ 2 không thử lại.

---

### Task 16: Ghi lại GĐ 1: README, CLAUDE.md, spec

**Mục tiêu:** Tài liệu khớp với code. Mục hoãn của GĐ 0: câu về tầng tĩnh trong phần kích thước bundle phải đúng thực tế ("Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang"), số đo phải đo lại.

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

**Interfaces:** —

- [ ] **Step 1: README**

Đoạn "Bức 1 · Ao Sen Đêm" (dòng 16–18, bắt đầu bằng `**Bức 1 · Ao Sen Đêm:**`): thay cả đoạn bằng
```markdown
**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng. Bản hiện tại (giai đoạn 1) có 5 lớp:
Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
chất liệu), Mặt nước (phản chiếu, gợn sóng), Vàng lá (đom đóm tính trên GPU) và Phủ bóng (bloom chọn lọc,
tone mapping AgX). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại.
Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".
```

Bảng "Cờ URL": thay dòng của `?debug` bằng
```markdown
| `?debug` | In chi tiết lỗi và mở three.js Inspector. `?debug=stats` mở stats-gl (FPS, CPU, GPU). Cả hai chỉ tải khi có cờ |
```

Mục "Chạy trên máy": ngay sau khối lệnh, thêm
```markdown
Chưa cài được fnm? Tải Node 24 bản portable từ nodejs.org/dist, giải nén vào một thư mục tạm và đặt thư mục `bin`
của nó lên đầu `PATH` trong terminal đang dùng.
```

Mục "Kích thước bundle": chạy `npm run build` và ghi lại bảng với số mới. Dòng mở đầu ghi ngày đo và commit hiện tại
(`git rev-parse --short HEAD`). Bảng gồm các dòng:
- `assets/ao-sen-dem-*.css`, `assets/ao-sen-dem-*.js` (chunk vào), `assets/run-*.js`, `assets/painting-*.js`,
  `assets/content.vi-*.js`, `assets/three-*.js`;
- **Tổng đường 3D** = chunk vào + run + painting + content + three;
- hai dòng "chỉ tải khi có cờ": `assets/Inspector-*.js` (`?debug`) và `assets/main-*.js` (stats-gl, `?debug=stats`).

Giữ nguyên hai câu dưới bảng: "Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang. Chunk `three-*.js` và
phần 3D chỉ tải khi máy dùng được GPU." và "Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip." (Lần dựng thử:
đường 3D khoảng 272 KB gzip.)

Nếu Task 15 chưa làm WebGPU e2e xanh trên ubuntu: thêm vào cuối mục "Chạy trên máy" một đoạn "WebGPU e2e trên CI" nêu
thông điệp lỗi và hai phương án đã thử.

- [ ] **Step 2: CLAUDE.md**

Mục "Shader và TSL", thêm vào cuối:
```markdown
- `material.mrtNode` chỉ dùng cho material KHÔNG BAO GIỜ bị vẽ vào target không có MRT (ảnh của reflector): nếu lọt vào đó,
  WGSL hỏng ("structures must have at least one member"). Mặt nước của Bức 1 dùng được vì reflector ẩn chính nó.
- Trong `positionNode` (chạy sau instancing) được gán `normalLocal.assign(…)` để xoay cả pháp tuyến (cánh hoa nở theo uniform).
```

Mục "Quy ước file", thêm vào cuối:
```markdown
- Test một lớp của bức: dựng cả bức trong Node bằng `tests/helpers/fake-ctx.js#buildPainting(painting, meta, { until })`
  (giống `run.js`), không tự dựng ctx riêng.
```

Mục "Gỡ lỗi nhanh": thêm `?debug=stats` vào dòng cờ URL, và thêm dòng
```markdown
- `?debug` mở three.js Inspector (draw call, thời gian GPU, cây node); `?debug=stats` mở stats-gl.
```

- [ ] **Step 3: Spec**

`docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:
- §8.1, trong cây thư mục, dưới `engine/gpu/`: thêm hai dòng
  ```
        gesture.js                     [1] phân loại cử chỉ (hàm thuần): tap / hold-* / swipe; kéo là của camera
        breath.js                      [1] camera "thở": breathAmplitude, breathOffset (hàm thuần)
  ```
  và dưới `ao-sen-dem/`, thay dòng `parts/ … [khi cần]` bằng
  ```
        parts/cot-{leaf,flower,reeds}.js       [1] của lớp Cốt (lá, hoa nở bằng uniform, cuống + lau)
        parts/anh-trang-{moon,paint}.js        [1] của lớp Ánh trăng (trăng, chất liệu)
  ```
  và sửa dòng `lib/tsl/noise.js` thành `[1] fbm; [3] thêm curl`.
- §6 Lớp 4, mục "Kỹ thuật": thêm gạch đầu dòng
  ```markdown
  - (GĐ 1) Nước là `MeshStandardNodeMaterial` (có chiếu sáng, nên trọng số 0 là đất sét như mọi hình khác). Ảnh phản chiếu cộng
    vào qua `emissiveNode`; `mrtNode` ghi kênh `emissive` riêng (chỉ phần vượt ngưỡng). Độ nhám rất thấp trên pháp tuyến gợn làm
    specular của ánh trăng (lớp 2) thành lối trăng lấp lánh, tự tắt khi lớp Ánh trăng tắt.
  ```
- §6 Lớp 1, mục "Thấy gì": thêm gạch đầu dòng `- (GĐ 1) Hai bông "chủ đề" đặt tay ở tiền cảnh, hai bên lối trăng (bố cục của poster); mỗi việc ngẫu nhiên (lá, lá đứng, hoa, lau) một hạt giống riêng, nên hoa và lau không đổi theo mức.`
- Phụ lục A, thêm hai mục cuối:
  ```markdown
  19. **`mrtNode` của material** (kiểm ở GĐ 1): ghép đè MRT của pass cho riêng material đó. Khi material bị vẽ vào render target
      không có MRT (ảnh của reflector), three dùng MỘT MÌNH `mrtNode` làm đầu ra: WGSL báo "structures must have at least one
      member", WebGL2 báo "Active draw buffers with missing fragment shader outputs". Chỉ dùng cho material không bao giờ lọt vào
      target như thế (mặt nước: reflector tự ẩn nó).
  20. **`normalLocal` trong `positionNode`** (kiểm ở GĐ 1): `positionNode` chạy sau instancing; gán `normalLocal.assign(…)` bên
      trong nó có hiệu lực cho ánh sáng trên cả WebGPU lẫn WebGL2 (cánh xoay 90° sáng đúng như khi bật flatShading). Shadow
      map cũng dùng `positionNode` của material.
  ```

- [ ] **Step 4: Kiểm và commit**

Run: `npm test`
Expected: PASS, `Tests  378 passed (378)` (tài liệu không đổi test).

```bash
git add README.md CLAUDE.md docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -m "docs: README, CLAUDE.md và spec theo GĐ 1 (cử chỉ, Ánh trăng, mrtNode, normalLocal, số bundle mới)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

---

### Task 17: Merge, deploy, kiểm URL công khai và trên máy thật

**Mục tiêu:** Điều kiện xong của GĐ 1 (spec §14): "Phép màu hiện rõ trên laptop và điện thoại; đã deploy".

**Files:** — (GitHub, memory của Claude)

- [ ] **Step 1: Kiểm toàn bộ lần cuối trên nhánh**

```bash
npm test
npm run e2e
```
Expected: Vitest `378 passed`; e2e: `static` và `webgl2-swiftshader` xanh; `webgpu-swiftshader` xanh trên macOS.

- [ ] **Step 2: Merge PR, deploy**

```bash
gh pr ready
gh pr merge --merge --delete-branch
git switch main && git pull --ff-only
gh run watch "$(gh run list --branch main --limit 1 --json databaseId --jq '.[0].databaseId')"
```
Expected: job `build` xanh (bước WebGPU có thể đỏ nhưng không chặn), job `deploy` xanh.

- [ ] **Step 3: Kiểm URL công khai bằng Playwright (SwiftShader)**

Mở `https://giabao2610.github.io/son-mai-anh-sang/?webgl&force3d&at=2026-09-28T21:00&freeze=40` trong Chromium SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`): chờ `window.__sma.state === 'live'` và `frames === 40`, chụp màn hình, nhìn: trăng, lối trăng, hai bông sen, gợi ý "Chạm vào mặt nước". Mở `…/?static&at=2026-09-28T21:00`: poster, trăng SVG cạnh con dấu "18 tháng Tám · Bính Ngọ".

- [ ] **Step 4: Bao kiểm trên máy thật (thủ công, spec §12)**

Gửi Bao danh sách:
- Laptop (Chrome, WebGPU): mở URL gốc; huy hiệu ghi WebGPU; trăng lệch trái lúc tối, gần giữa lúc nửa đêm; chạm mặt nước → gợn sóng xẻ lối trăng; giữ chuột → đom đóm tụ lại, thả → bung ra; `?debug=stats` xem FPS (mục tiêu 60).
- Điện thoại (Android Chrome, iOS Safari 26 nếu có): chạm, giữ (không bật menu ngữ cảnh), kéo xoay; ghi FPS với `?debug=stats` (mục tiêu 45 là việc của GĐ 3; ở GĐ 1 chỉ ghi lại số).
- Nếu máy có tắt tăng tốc phần cứng: tranh tĩnh kèm hướng dẫn, có trăng SVG.

- [ ] **Step 5: Ghi memory (người điều phối làm)**

Cập nhật memory `project-gd1-followups` (hoặc đổi thành `project-gd2-followups`): GĐ 1 đã ship ngày deploy, commit trên main; các mục hoãn GĐ 1 đã xong; kết quả thử WebGPU trên CI; và các mục chuyển sang GĐ 2/3 phát sinh trong GĐ 1:
- GĐ 2: núm `js`/`rebuild` + `onKnob` cho các núm đã hoãn (danh sách ở đầu kế hoạch); lời mời thành nút vào chế độ mài; màu cảnh 3D còn tối hơn poster: chỉnh cùng Bao khi có Sổ tay (núm).
- GĐ 3: phản chiếu giả ở mức thấp; bỏ compute khi trọng số lớp 5 bằng 0; curl-noise; vòm trời (sẽ làm cảnh bớt "đen then trơn" phía trên).
- Device-lost giữa `renderer.init()` và `stage.onLost()` (hoãn từ GĐ 0, vẫn là việc của GĐ 2).
