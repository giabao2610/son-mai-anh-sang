# GĐ 3 · Sương + Vàng lá GPU: kế hoạch triển khai

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bức 1 đủ sáu lớp (thêm Sương: vòm trời, sương là là, vuốt thì sương xoáy; Vàng lá bay theo curl noise, có bản CPU để so), và cảnh tự giữ nhịp trên nhiều loại máy mà không ép phần cứng quá sức: bảng chất lượng theo mức, nấc hạ của từng lớp, bộ điều chỉnh chạy thật, trần 60 khung/giây. Deploy công khai.

**Architecture:** Giữ ba vùng của GĐ 0–2.
- **Xưởng:**
  - bộ điều chỉnh có trễ, là hàm thuần trong `engine/quality.js`, chỉ QUYẾT định hạ hay nâng;
  - thang nấc `engine/gpu/ladder.js`, là nơi ÁP nấc: `'dpr'` và `layer.degrade`;
  - cảnh (`scene.js`) nối hai thứ trên vào vòng lặp và đo ms CPU; `run.js` chặn 60 khung/giây (`clock.js#createFrameCap`) và cho bộ điều chỉnh chỉ canh khi Sổ tay mở;
  - bàn thợ có thêm thí nghiệm so sánh và API nấc (`__sma.quality/degrade/upgrade/stats`); `Knob.max` được phép là hàm của env (trần theo mức);
  - Sổ tay vẽ hai cột "Tắt / Bật"; huy hiệu ghi "hạ {n} nấc"; cờ `?level`.
- **Hộp màu:** `lib/tsl/noise.js` có thêm fbm với số tầng là node, và `curl`.
- **Lớp dùng chung Phủ bóng:** có nấc `bloom`.
- **Bức 1:**
  - lớp 3 Sương (`l3-suong.js`, `parts/suong-{mu,troi}.js`);
  - Ánh trăng dùng shadow map tĩnh với khung bóng ôm sát;
  - Mặt nước có phản chiếu giả ở mức thấp;
  - Vàng lá có curl, bản CPU và thí nghiệm "Tắt additive";
  - `quality.js` (số theo mức, `ladder`), và một lượt màu theo poster.

**Tech Stack:** Node 24 LTS · three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) · Vite 8 · Vitest 5 (+ jsdom) · Playwright 1.63 · Tweakpane 4.0.5 · Shiki 4.4.3 · stats-gl 4.2.3 · GitHub Actions + Pages. **Không thêm gói npm nào.**

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`. Kế hoạch lập luận từ spec; người thực thi đọc cả hai. Các mục hay dùng (tìm nhãn "(GĐ 3)"):
- §1: Bao muốn hợp nhiều loại phần cứng;
- §4.1: Sổ tay (ms CPU, hai cột), huy hiệu;
- §6: Lớp 2 đến Lớp 6;
- §8.4: `Knob.max`, `DegradeStep`, `Experiment`, `Studio`;
- §8.5: bộ điều chỉnh trong vòng lặp;
- §8.7: `?level`;
- §9: `__sma`;
- §10: ba cái bẫy, không ép phần cứng, các nấc, ngân sách;
- §12: test GĐ 3;
- Phụ lục A: mục 29 trở đi.

**Code trong kế hoạch này đã chạy thật.** Trước khi viết kế hoạch, toàn bộ GĐ 3 đã được dựng thử trong một bản sao của repo (worktree `gd3-proto`), mỗi task một commit:
- Vitest xanh ở MỌI task. Số test sau từng task ghi ở bước "Toàn bộ test"; cuối cùng là 567 test.
- E2E xanh trên `static`, `webgl2-swiftshader`, `webgpu-swiftshader` và GPU thật (`E2E_REAL_GPU=1`, WebGPU/Metal).
- Đo trên GPU thật: 34 draw call ở mức cao, 24 ở mức thấp; đường 3D 297,6 kB gzip.
- Ảnh trước và sau lượt màu đã chụp ở 1280×800 và 390×844.
- Mọi khối code dưới đây sinh tự động từ đúng các commit đó:
  - file mới là nội dung cả file;
  - file sửa là một patch `git diff` hợp lệ. Lưu khối diff ra file rồi `git apply <file>`, hoặc sửa tay theo từng khối `@@`.
- Dòng "Kết quả mong đợi: FAIL" ở mỗi task là lỗi THẬT: nó ghi lại lúc chỉ áp phần test của task lên task trước.

## Global Constraints

Mọi task đều ngầm bao gồm các ràng buộc dưới đây (phần lớn là luật của `CLAUDE.md`; `npm test` giữ nhiều luật và báo lỗi tiếng Việt kèm `file:dòng`: gặp lỗi thì sửa code, không nới luật).

**Công cụ**
- Node **24** (`node -v` ra `v24.x`). Máy của Bao chưa có fnm: nếu `node -v` không ra v24, làm theo Task 1 · Step 1 (Node 24 bản portable trong thư mục tạm, không sửa `~/.zshrc`), và đặt `PATH` đó ở đầu mọi lệnh `node`/`npm`/`npx`.
- `three@0.186.1`, `@playwright/test@1.63.0` ghim đúng phiên bản. GĐ 3 không thêm gói nào.
- Chạy e2e trên SwiftShader khi máy rảnh. SwiftShader ăn CPU, nên khi máy đang bận, cảnh 3D quá hạn 10 giây và về tĩnh với lý do `timeout`. Đó không phải lỗi code: chạy lại khi máy rảnh.

**Quy ước file**
- Dòng 1 của mọi `src/**/*.js` và `plugins/*.js`: `// <đường dẫn> — <một câu tiếng Việt nói file làm gì>`. Test giữ.
- Mỗi file ≤ 250 dòng (quá 300 là test hỏng). JavaScript ESM thuần + JSDoc. Tên biến tiếng Anh, camelCase. Import tương đối ghi đuôi `.js`.
- Chú thích tiếng Việt ở chỗ cần học; lỗi cho lập trình viên (`throw`, `console`) viết tiếng Việt.

**Ranh giới** (spec §8.2, `tests/rules/imports.test.js` giữ)
- Xưởng (`engine/`, `ui/`) không import bức; `ui/` không import `engine/` hay three; `lib/` là lá.
- Hàng rào từ vựng: code trong `engine/`, `ui/`, `lib/tsl/` không chứa slug, id lớp riêng của bức (kể cả `suong`) hay từ trong `meta.fence` (GĐ 3 thêm `milky`, `ngân hà`). Không bao giờ rẽ nhánh theo `slug`.
- Đường nhẹ: `engine/flags.js` KHÔNG import `engine/quality.js` (quality.js mang cả bộ điều chỉnh, chỉ tầng 3D cần); flags.js có danh sách mức riêng, test giữ cho khớp.

**TSL và three r186** (spec Phụ lục A)
- Chỉ TSL; không `select()` khi có node dùng chung giữa các nhánh (dùng `Fn` + `.toVar()` + `If`). Tên uniform là định danh hợp lệ.
- Không đặt số lên material lúc chạy; mọi thứ đổi theo trọng số/núm/thí nghiệm/nấc đi qua uniform trong node. Ngoại lệ có chủ đích: thí nghiệm được đổi thứ nằm trong cache key (`blending` của "Tắt additive") kèm `material.needsUpdate = true`.
- Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled`, `renderer.toneMapping` lúc chạy. `scene.fogNode` gán MỘT lần lúc dựng lớp Sương (A.33); lúc gỡ lớp thì trả về giá trị trước.
- `pow` với số mũ khác 2/3/4 thì cơ số phải `saturate`/`abs` trước. `smoothstep(a, b, x)` luôn có `a < b` (ngược thì viết `oneMinus(smoothstep(b, a, x))`).
- Mọi material gán `emissiveNode` tường minh. Màu nào cũng đi qua `mix(datSet, màu, w)`, hoặc `mix(denThen, trời, w)` cho vòm trời (luật 3: trọng số 0 là nền đen then).
- Hạt cộng dồn: `fog = false` + tự nhân `(1 − fogFactor)` (A.34). Shadow map tĩnh: đổi thứ làm bóng đổi thì `shadow.needsUpdate = true` (A.35).

**Phần cứng** (spec §1, §10 GĐ 3: Bao muốn hợp nhiều loại máy, không ép phần cứng quá sức)
- Nấc chỉ hạ TRẦN, không ghi vào núm; hiệu lực = min(núm, trần); không đổi thứ nằm trong cache key.
- Núm nặng có trần theo mức (`max: (env) => …`); thí nghiệm nặng có trần ("CPU vs GPU" 5.000 con).
- Cảnh vẽ tối đa 60 khung/giây; `?freeze` không có bộ điều chỉnh (ảnh tất định).

**Chuyển động và ngẫu nhiên**
- Không dùng `time`/`deltaTime` của TSL (dùng `ctx.u.time`, `ctx.u.delta`); không dùng `Math.random` (dùng `lib/random.js`).

**Chữ và trợ năng**
- Chữ người xem thấy nằm trong `ui/strings.vi.js`, `content.vi.js` hay các trường chữ của `meta.js`. Không file nào trong `src/` import `strings.*.js`.
- Vùng `aria-live` (kể cả dòng "Lớp này đang tắt" mới) không dùng `hidden` hay `display: none`: để trống, CSS thu lại khi `:empty`.

**Git**
- Làm trên nhánh `gd3-suong-vang-la` (đã có: cherry-pick README `81f0954`, hai commit spec của GĐ 3, và chính file kế hoạch này). Commit bằng danh tính local của repo: `Bao Nguyen <giabao261096@gmail.com>` (kiểm `git config user.email` trước commit đầu). Không sửa git config global.
- Mỗi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Thông điệp commit của từng task ghi sẵn ở bước cuối của task.
- Chỉ push ở Task 18 (việc ra bên ngoài, đã nằm trong kế hoạch Bao duyệt). Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

## Review Focus

Năm tình huống người dùng thật dễ gặp mà spec không nói thẳng. Mỗi tình huống có test ở task sở hữu code:
1. **Màn 120 Hz** (MacBook Pro, iPhone Pro, nhiều máy Android): không chặn thì GPU vẽ gấp đôi số khung cần, máy nóng, pin tụt. Mong đợi: tối đa 60 khung/giây; màn 60 Hz và máy chậm không bỏ khung nào. Test: `tests/unit/clock.test.js` "createFrameCap" (Task 6).
2. **Chế độ tiết kiệm pin khóa 30 fps** (Energy Saver của Chrome, Low Power Mode của iPhone): hạ nấc nào cũng không nhanh hơn. Mong đợi: hạ hết thang, thấy không nhanh hơn thì trả lại hết và thôi hạ; hết khóa thì chạy lại. Test: `tests/unit/quality.test.js` "khóa nhịp 30 fps" (Task 3).
3. **Sổ tay mở trên máy yếu, người xem kéo núm nặng** (tắt instancing, 50.000 đom đóm). Mong đợi: chậm vừa phải thì bộ điều chỉnh để yên cho số đo trung thực; quá tải NẶNG thì vẫn hạ; núm không kéo quá trần của mức. Test: `quality.test.js` "canh (Sổ tay mở)" (Task 3), `scene.test.js` "thanh lớp mở (guard)" (Task 6), `vang-la.test.js` "trần theo tầng VÀ theo mức" (Task 12).
4. **Chế độ mài rồi mở tab Phá của một lớp đang tắt**, bật "CPU vs GPU" hay "Chỉ 1 octave". Lớp ở trọng số 0 thì hai cột bằng nhau, người xem tưởng hỏng. Mong đợi: tab Phá nói rõ "Lớp này đang tắt". Test: `tests/unit/workshop.test.js` "lớp đang tắt (chế độ mài)" (Task 7).
5. **Tab bị ẩn lâu rồi mở lại, hay dừng ở debugger.** Mong đợi: bộ điều chỉnh không tính khoảng trống đó là khung chậm (không hạ nấc oan), và bộ chặn khung vẽ ngay, không vẽ dồn. Test: `quality.test.js` "khoảng > 250 ms" (Task 3), `clock.test.js` "tab vừa hiện lại" (Task 6).

## Bản đồ file sau GĐ 3

| File | Trách nhiệm | Task |
|---|---|---|
| `src/lib/tsl/noise.js` | fbm với số tầng là node (vòng lặp thật), `curl` | 2 |
| `src/engine/quality.js` | `FRAME_BUDGET_MS`, `TUNER`, `createTuner` (bộ điều chỉnh có trễ, chế độ canh) | 3 |
| `src/engine/gpu/ladder.js` (mới), `src/engine/gpu/stage.js` | thang nấc (`dprSteps`, `createLadder`), `stage.dpr()` | 4 |
| `src/engine/gpu/studio.js`, `knob-set.js`, `src/engine/contracts/runtime.js` | ms CPU, `compare`, API nấc; `Knob.max` là hàm của env | 5 |
| `src/engine/gpu/scene.js`, `run.js`, `clock.js`, `src/engine/flags.js`, `src/engine/sma.js` | bộ điều chỉnh trong vòng lặp, trần 60 khung/giây, `?level`, `__sma` | 6 |
| `src/ui/{badge,notebook,notebook-pages,strings.vi}.js`, `src/styles/notebook.css` | huy hiệu "hạ n nấc", hai cột so sánh, ms CPU, "Lớp này đang tắt" | 7 |
| `src/engine/stock/phu-bong/{layer,content.vi}.js` | nấc `bloom`, số đo `bloomScale` | 8 |
| `src/paintings/ao-sen-dem/layers/l{1-cot,2-anh-trang}.js`, `parts/anh-trang-{moon,shadow}.js` | bóng tĩnh, khung bóng ôm sát, nấc `bong`, trăng không nhận sương | 9 |
| `src/paintings/ao-sen-dem/layers/l3-suong.js`, `parts/suong-{mu,troi}.js`, `shared.js`, `meta.js`, `painting.js`, `content.vi.js`, `diagrams/suong.svg` | lớp Sương, xoáy khi vuốt | 10 |
| `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`, `parts/mat-nuoc-gia.js` | phản chiếu giả, ánh lóe trong sương, nấc `phan-chieu`, trần theo mức | 11 |
| `src/paintings/ao-sen-dem/layers/l5-vang-la.js`, `parts/vang-la-dan.js` | curl, núm mới, sương, trọng số 0, nấc `dom-dom`, "Tắt additive", trần theo mức | 12 |
| `src/paintings/ao-sen-dem/parts/vang-la-cpu.js` | bản CPU, "CPU vs GPU" | 13 |
| `src/paintings/ao-sen-dem/quality.js` (mới), `painting.js`, `tests/helpers/fake-ctx.js`, `tests/paintings/contract.test.js` | bảng chất lượng + `ladder`; test dựng bức theo ngân sách của mức | 14 |
| `e2e/{helpers,painting.spec,ao-sen-dem.spec}.js` | e2e GĐ 3 | 15 |
| các lớp của Bức 1 | lượt màu (Bao duyệt bằng ảnh) | 16 |
| `README.md`, `CLAUDE.md`, spec | ghi lại GĐ 3 | 17 |
| (GitHub) | review toàn nhánh, push, PR, CI, kiểm trên máy thật | 18 |

**Không làm trong GĐ 3** (spec xếp vào giai đoạn sau; ghi ở đây để khỏi làm lố):
- Thanh giờ (Dial) và `ui/dials.js`: trời đã đọc `shared.hour`, GĐ 4 chỉ việc nối thanh trượt. Kính mài, Lột lớp, chặng `display` của Phủ bóng (LUT, grain, vignette, FXAA), `tap`, `?poster`, og: GĐ 4.
- Đo ms GPU thật cho thí nghiệm so sánh (`trackTimestamp`), tự lùi về đom đóm CPU khi compute WebGL2 hỏng: để sau (spec §16).
- Hai điểm để ngỏ sau review GĐ 2 (lỗi hook của Inspector khi `?debug`; `onKnob` hỏng giữa chừng) vẫn để ngỏ.

---

### Task 1: Chuẩn bị: máy, nhánh, mốc test

**Mục tiêu:** Có Node 24 và Chromium của Playwright; đứng trên nhánh `gd3-suong-vang-la` (đã có spec GĐ 3 và file kế hoạch này); mốc ban đầu là 507 test xanh.

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
git switch gd3-suong-vang-la
git log --oneline -4   # file kế hoạch, hai commit docs(spec) GĐ 3, cherry-pick README 81f0954; dưới nữa là Merge PR #2
git config user.email  # phải ra giabao261096@gmail.com
npm ci
npx playwright install chromium
npm test
```
Kết quả mong đợi: `npm test` xanh, `Tests  507 passed (507)` (con số của GĐ 2).

---

### Task 2: Hộp màu: fbm với số tầng là node, và curl noise

**Mục tiêu:** `lib/tsl/noise.js` thêm hai thứ mà GĐ 3 cần:
- **fbm nhận số octave là node** (uniform của một núm). Shader có vòng lặp thật (`Loop` tối đa 5 lần, `Break` khi đủ), nên đổi số tầng chỉ đổi uniform, không biên dịch lại. Lớp Sương cần điều này vì đồ thị sương nằm trong cache key của MỌI material (spec §6 Lớp 3, Phụ lục A.33, A.37). Truyền số JS thì fbm vẫn khai triển lúc dựng như cũ (trăng của Ánh trăng dùng cách này).
- **`curl(p)`**: curl của trường `mx_noise_vec3`, tính bằng sai phân trung tâm. Trường này không phân kỳ, nên đàn đom đóm trôi thành dòng xoáy mà không dồn về một chỗ (spec §6 Lớp 5).

**Files:**
- Modify: `src/lib/tsl/noise.js` (thay cả file)
- Test: `tests/unit/noise.test.js` (thay cả file)

**Interfaces:**
- Consumes: —
- Produces: `MAX_OCTAVES = 5`; `fbm(p, { octaves?: number | Node, lacunarity?, gain? }) → Node float` (số JS ngoài 1–5 thì ném `RangeError`, node thì không kiểm); `curl(p, { epsilon = 0.1 } = {}) → Node vec3`.

- [ ] **Step 1: Test (hỏng: chưa có `MAX_OCTAVES`, `curl`)**

`tests/unit/noise.test.js`:
```js
// tests/unit/noise.test.js — lib/tsl/noise.js: fbm (số tầng là số JS hoặc node) và curl dựng được đồ thị node trong Node.
import { describe, it, expect } from 'vitest';
import { uniform, vec3 } from 'three/tsl';
import { MAX_OCTAVES, curl, fbm } from '../../src/lib/tsl/noise.js';

describe('fbm', () => {
  it('trả về node float cho 1 đến 5 tầng', () => {
    expect(MAX_OCTAVES).toBe(5);
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

  it('số tầng là node (uniform của núm): dựng vòng lặp thật; đổi giá trị uniform không đổi node', () => {
    const octaves = uniform(3);
    const node = fbm(vec3(1, 2, 3), { octaves });
    expect(node.isNode).toBe(true);
    octaves.value = 1; // chỉ đổi giá trị: node giữ nguyên, nên shader không phải biên dịch lại
    expect(fbm(vec3(1, 2, 3), { octaves: uniform(0) }).isNode).toBe(true); // số tầng 0 không ném (node không kiểm lúc dựng)
  });
});

describe('curl', () => {
  it('trả về node vec3; bước sai phân chỉnh được', () => {
    expect(curl(vec3(1, 2, 3)).isNode).toBe(true);
    expect(curl(vec3(1, 2, 3), { epsilon: 0.05 }).isNode).toBe(true);
  });
});
```

Run: `npx vitest run tests/unit/noise.test.js`
Kết quả mong đợi: FAIL, 3 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be 5 // Object.is equality`.

- [ ] **Step 2: Thay `src/lib/tsl/noise.js`**

```js
// lib/tsl/noise.js — hàm TSL dùng chung cho mọi bức: fbm (cộng nhiều tầng noise) và curl (dòng xoáy không phân kỳ), dựng trên noise của three.
import { Break, Fn, If, Loop, float, max, mx_noise_float, mx_noise_vec3, vec3 } from 'three/tsl';

/** Trần số tầng của fbm, cả khi số tầng là số JS lẫn khi là node. */
export const MAX_OCTAVES = 5;

/**
 * fbm ("fractal Brownian motion"): cộng nhiều tầng noise. Tầng sau có tần số gấp `lacunarity` lần
 * và biên độ nhân `gain`, nên có cả mảng lớn lẫn chi tiết nhỏ (vân đá, sương, mây).
 *
 * `octaves` có hai dạng, dạy hai điều khác nhau:
 * - SỐ JS: vòng lặp chạy lúc DỰNG đồ thị node, shader sinh ra chỉ là một chuỗi phép cộng, không có vòng lặp.
 *   Rẻ nhất, nhưng đổi số tầng là đồ thị khác, tức phải biên dịch lại.
 * - NODE (ví dụ uniform của một núm): shader có vòng lặp THẬT, chạy tối đa MAX_OCTAVES lần và `Break` khi đủ.
 *   Đổi số tầng chỉ đổi giá trị uniform, không biên dịch lại. Lớp nào đặt fbm vào thứ nằm trong cache key
 *   của mọi material (như scene.fogNode) thì nên dùng dạng này.
 *
 * @param {any} p  node vec3 (tọa độ lấy mẫu)
 * @param {{ octaves?: number | any, lacunarity?: number, gain?: number }} [options]
 * @returns {any}  node float, xấp xỉ trong [−1, 1]
 */
export function fbm(p, { octaves = 4, lacunarity = 2, gain = 0.5 } = {}) {
  if (octaves?.isNode) return fbmLoop(p, octaves, lacunarity, gain);
  if (!Number.isInteger(octaves) || octaves < 1 || octaves > MAX_OCTAVES) {
    throw new RangeError(`fbm: octaves phải là số nguyên từ 1 đến ${MAX_OCTAVES}, nhận ${octaves}`);
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

/** fbm với số tầng là node: vòng lặp thật trong shader (xem fbm). */
function fbmLoop(p, octaves, lacunarity, gain) {
  return Fn(() => {
    const q = vec3(p).toVar();
    const sum = float(0).toVar();
    const total = float(0).toVar();
    const amplitude = float(1).toVar();
    Loop(MAX_OCTAVES, ({ i }) => {
      // i là số nguyên của vòng lặp; so với số thực của uniform thì đổi sang float trước.
      If(float(i).greaterThanEqual(octaves), () => {
        Break();
      });
      sum.addAssign(mx_noise_float(q).mul(amplitude));
      total.addAssign(amplitude);
      amplitude.mulAssign(gain);
      q.mulAssign(lacunarity);
    });
    // Ít nhất một tầng thì total ≥ 1; max(…, 1) chỉ để số tầng 0 cho ra 0 thay vì chia cho 0.
    return sum.div(max(total, 1));
  })();
}

/**
 * Curl noise: curl của trường vec3 F = mx_noise_vec3(p), tức v = ∇ × F, tính bằng sai phân trung tâm (6 lần lấy mẫu).
 * Trường nào là curl của một trường khác thì KHÔNG phân kỳ: hạt trôi theo nó thành những dòng xoáy mềm,
 * không dồn về một chỗ và không tản hết ra (như khói, như nước). Độ lớn xấp xỉ vài đơn vị: nhân thêm hệ số tốc độ.
 * @param {any} p  node vec3
 * @param {{ epsilon?: number }} [options]  bước sai phân, theo đơn vị của p
 * @returns {any}  node vec3
 */
export function curl(p, { epsilon = 0.1 } = {}) {
  return Fn(() => {
    const q = vec3(p).toVar();
    const dx = vec3(epsilon, 0, 0);
    const dy = vec3(0, epsilon, 0);
    const dz = vec3(0, 0, epsilon);
    const x0 = mx_noise_vec3(q.sub(dx)).toVar();
    const x1 = mx_noise_vec3(q.add(dx)).toVar();
    const y0 = mx_noise_vec3(q.sub(dy)).toVar();
    const y1 = mx_noise_vec3(q.add(dy)).toVar();
    const z0 = mx_noise_vec3(q.sub(dz)).toVar();
    const z1 = mx_noise_vec3(q.add(dz)).toVar();
    // (∂Fz/∂y − ∂Fy/∂z, ∂Fx/∂z − ∂Fz/∂x, ∂Fy/∂x − ∂Fx/∂y); mọi đạo hàm cùng chia 2·epsilon ở cuối.
    const cx = y1.z.sub(y0.z).sub(z1.y.sub(z0.y));
    const cy = z1.x.sub(z0.x).sub(x1.z.sub(x0.z));
    const cz = x1.y.sub(x0.y).sub(y1.x.sub(y0.x));
    return vec3(cx, cy, cz).div(2 * epsilon);
  })();
}
```

Run: `npx vitest run tests/unit/noise.test.js`
Kết quả mong đợi: PASS (4 test). Hàng rào từ vựng quét cả `lib/tsl/`: file này không được nhắc tới đom đóm, sương hay bức nào.

- [ ] **Step 3: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  509 passed`.

```bash
git add src/lib/tsl/noise.js tests/unit/noise.test.js
git commit -F - <<'EOF'
feat(lib): fbm nhận số octave là node (vòng lặp thật trong shader), thêm curl noise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 3: Bộ điều chỉnh có trễ (`engine/quality.js`)

**Mục tiêu:** Spec §10 GĐ 3. `createTuner` là hàm thuần, không dùng three. Nó đọc thời điểm của từng khung (nhịp rAF), đo theo cửa sổ 2 giây, rồi trả lời `'down'` (hạ một nấc), `'up'` (nâng một nấc), `'reset'` (trả lại mọi nấc) hoặc `null`. Nó chỉ QUYẾT; việc áp nấc là của `ladder.js` (Task 4).
- **Luật của spec:** quá tải (> 1,2 × ngân sách) 2 cửa sổ liền thì hạ; dư 5 cửa sổ liền thì nâng; không bao giờ nâng quá mức ban đầu.
- **Ba cái bẫy của nhịp rAF, và cách tránh:**
  1. Màn 60 Hz không bao giờ "dư" theo luật 0,7. Vì vậy tính thêm là dư khi không rớt khung nào và trung bình ≤ 1,05 × ngân sách. Nâng rồi phải hạ lại ngay thì khóa nấc đó.
  2. Nhịp bị khóa 30 fps: hạ hết thang mà không nhanh hơn 10% thì `'reset'`, rồi thôi hạ.
  3. Chế độ canh (`guard(true)`) khi Sổ tay mở: chỉ hạ khi quá tải nặng (> 2,2 × ngân sách), không nâng.
- **Chi tiết:** khoảng > 250 ms thì bỏ cửa sổ đang đo; 2 giây khởi động bị bỏ.

Test chạy bộ điều chỉnh trên chuỗi thời điểm khung giả. "Thang giả" phản ứng như máy thật: hạ nấc thì khung nhanh lên.

**Files:**
- Modify: `src/engine/quality.js` (thay cả file)
- Test: `tests/unit/quality.test.js` (thêm dòng 1 và một khối `describe('createTuner …')`)

**Interfaces:**
- Consumes: —
- Produces:
  - `FRAME_BUDGET_MS = { desktop: 1000/60, mobile: 1000/45 }`;
  - `TUNER` (windowMs 2000, warmupMs 2000, hiccupMs 250, over 1.2, severe 2.2, spare 0.7, near 1.05, drop 1.5, downAfter 2, upAfter 5, lockWithin 3, gain 0.9);
  - `createTuner({ budgetMs, ...ghiĐèTUNER })` trả về:
    - `sample(ms, { applied, steps }) → 'down' | 'up' | 'reset' | null`;
    - `guard(on)`;
    - `state() → { guarding, capped, locked: number[] }`.

- [ ] **Step 1: Test (hỏng: chưa có `FRAME_BUDGET_MS`, `createTuner`)**

Áp vào `tests/unit/quality.test.js`:
```diff
diff --git a/tests/unit/quality.test.js b/tests/unit/quality.test.js
index 1f55607..1e685d3 100644
--- a/tests/unit/quality.test.js
+++ b/tests/unit/quality.test.js
@@ -1,5 +1,6 @@
+// tests/unit/quality.test.js — chọn mức, ngân sách của bức, và bộ điều chỉnh có trễ chạy trên chuỗi khung giả.
 import { describe, expect, it } from 'vitest';
-import { DEFAULT_LEVELS, LEVELS, budgetFor, isMobile, pickLevel } from '../../src/engine/quality.js';
+import { DEFAULT_LEVELS, FRAME_BUDGET_MS, LEVELS, budgetFor, createTuner, isMobile, pickLevel } from '../../src/engine/quality.js';
 
 const UA = {
   android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36',
@@ -69,3 +70,133 @@ describe('budgetFor', () => {
     expect(() => budgetFor('sieu')).toThrow('sieu');
   });
 });
+
+const DESKTOP = FRAME_BUDGET_MS.desktop;
+
+/**
+ * Cho bộ điều chỉnh "chạy" `seconds` giây. Khoảng giữa hai khung lấy từ gapFor(số nấc đang áp, i): như máy thật,
+ * hạ nấc thì khung nhanh lên. Thang giả có `steps` nấc; 'down' / 'up' / 'reset' đổi `applied` như ladder.js.
+ * Trả mọi quyết định kèm thời điểm (giây).
+ */
+function run(tuner, { seconds, gapFor, ladder, from = 0 }) {
+  const actions = [];
+  let t = from;
+  for (let i = 0; t < from + seconds * 1000; i++) {
+    t += gapFor(ladder.applied, i);
+    const action = tuner.sample(t, ladder);
+    if (!action) continue;
+    actions.push({ at: +(t / 1000).toFixed(2), action });
+    if (action === 'down') ladder.applied += 1;
+    else if (action === 'up') ladder.applied -= 1;
+    else ladder.applied = 0;
+  }
+  return { actions, end: t };
+}
+const kinds = (actions) => actions.map((a) => a.action);
+
+describe('createTuner (bộ điều chỉnh có trễ)', () => {
+  it('ngân sách: 60 khung/giây trên máy tính, 45 trên điện thoại', () => {
+    expect(FRAME_BUDGET_MS.desktop).toBeCloseTo(16.667, 3);
+    expect(FRAME_BUDGET_MS.mobile).toBeCloseTo(22.222, 3);
+  });
+
+  it('60 fps đều: không làm gì; không bao giờ nâng quá mức ban đầu (chưa hạ nấc nào)', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    expect(run(tuner, { seconds: 60, gapFor: () => DESKTOP, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
+    const fast = createTuner({ budgetMs: DESKTOP });
+    expect(run(fast, { seconds: 60, gapFor: () => 1000 / 120, ladder: { applied: 0, steps: 4 } }).actions).toEqual([]);
+  });
+
+  it('40 fps: 2 giây khởi động + 2 cửa sổ quá tải thì hạ; đủ nhanh thì thử nâng MỘT lần, chậm lại thì hạ và khóa', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 0, steps: 4 };
+    // Máy giả: mỗi nấc bớt 4,5 ms; 2 nấc là về 16 ms (đủ 60 fps, không rớt khung nên trông như còn dư).
+    const { actions } = run(tuner, { seconds: 60, gapFor: (k) => Math.max(25 - k * 4.5, 16), ladder });
+    expect(kinds(actions)).toEqual(['down', 'down', 'up', 'down']);
+    expect(actions[0].at).toBeGreaterThanOrEqual(5.9);
+    expect(actions[0].at).toBeLessThan(6.2);
+    expect(ladder.applied).toBe(2);
+    expect(tuner.state().locked).toEqual([1]);
+  });
+
+  it('màn 60 Hz không rớt khung thì nâng lại sau 5 cửa sổ (0,7 × ngân sách không bao giờ tới được ở 60 Hz)', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 2, steps: 4 };
+    const { actions } = run(tuner, { seconds: 24, gapFor: () => DESKTOP, ladder });
+    expect(kinds(actions)).toEqual(['up', 'up']);
+    expect(actions[0].at).toBeGreaterThanOrEqual(11.9);
+    expect(actions[0].at).toBeLessThan(12.2);
+  });
+
+  it('có rớt khung (mỗi cửa sổ một khung 33 ms) thì không nâng, dù trung bình vẫn gần 16,7 ms', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 1, steps: 4 };
+    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 100 === 50 ? 2 * DESKTOP : DESKTOP), ladder });
+    expect(actions).toEqual([]);
+  });
+
+  it('nâng một nấc rồi phải hạ lại ngay đúng nấc đó: khóa, không nâng nấc ấy nữa (không dao động)', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 1, steps: 4 };
+    // Máy giả chỉ chạy nổi 60 fps khi đã hạ 1 nấc.
+    const { actions } = run(tuner, { seconds: 90, gapFor: (k) => (k >= 1 ? DESKTOP : 25), ladder });
+    expect(kinds(actions)).toEqual(['up', 'down']);
+    expect(tuner.state().locked).toEqual([0]);
+    expect(ladder.applied).toBe(1);
+  });
+
+  it('khóa nhịp 30 fps (tiết kiệm pin): hạ hết thang, không nhanh hơn → trả lại hết, thôi hạ; hết khóa thì chạy lại', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 0, steps: 3 };
+    let gap = 1000 / 30;
+    const first = run(tuner, { seconds: 60, gapFor: () => gap, ladder });
+    expect(kinds(first.actions)).toEqual(['down', 'down', 'down', 'reset']);
+    expect(ladder.applied).toBe(0);
+    expect(tuner.state().capped).toBe(true);
+    // Cắm sạc: về 60 fps, hết khóa (không còn nấc nào để nâng). Rồi máy thật sự chậm (40 fps): lại hạ được.
+    gap = DESKTOP;
+    expect(run(tuner, { seconds: 10, gapFor: () => gap, ladder, from: first.end }).actions).toEqual([]);
+    expect(tuner.state().capped).toBe(false);
+    const again = run(tuner, { seconds: 6, gapFor: () => 25, ladder, from: first.end + 10_000 });
+    expect(kinds(again.actions)).toEqual(['down']);
+  });
+
+  it('khoảng giữa hai khung > 250 ms (tab ẩn, debugger) thì bỏ cả cửa sổ đang đo', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    // 40 fps nhưng cứ 1,5 giây lại có một khoảng 400 ms: không cửa sổ nào đo xong, nên không quyết gì.
+    const { actions } = run(tuner, { seconds: 40, gapFor: (k, i) => (i % 60 === 59 ? 400 : 25), ladder: { applied: 0, steps: 4 } });
+    expect(actions).toEqual([]);
+  });
+
+  it('canh (Sổ tay mở): chậm vừa phải thì để yên (số đo trung thực), quá tải nặng thì vẫn hạ, không bao giờ nâng', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 1, steps: 4 };
+    tuner.guard(true);
+    expect(tuner.state().guarding).toBe(true);
+    const slow = run(tuner, { seconds: 20, gapFor: () => 25, ladder }); // 40 fps: người xem đang thử, để yên
+    expect(slow.actions).toEqual([]);
+    const idle = run(tuner, { seconds: 20, gapFor: () => DESKTOP, ladder, from: slow.end }); // dư mà không nâng
+    expect(idle.actions).toEqual([]);
+    const heavy = run(tuner, { seconds: 7, gapFor: () => 50, ladder, from: idle.end }); // 20 fps: máy bị ép quá sức
+    expect(kinds(heavy.actions)).toEqual(['down']);
+    tuner.guard(false);
+    const normal = run(tuner, { seconds: 7, gapFor: () => 25, ladder, from: heavy.end });
+    expect(kinds(normal.actions)).toEqual(['down']);
+    expect(normal.actions[0].at - heavy.end / 1000).toBeGreaterThanOrEqual(5.9); // đổi chế độ: khởi động lại
+  });
+
+  it('điện thoại 45 fps (ngân sách 22,2 ms): không quá tải, cũng không dư (có rớt khung) → để yên', () => {
+    const tuner = createTuner({ budgetMs: FRAME_BUDGET_MS.mobile });
+    const pattern = [1000 / 60, 1000 / 60, 1000 / 30]; // trung bình 22,2 ms
+    const { actions } = run(tuner, { seconds: 60, gapFor: (k, i) => pattern[i % 3], ladder: { applied: 1, steps: 4 } });
+    expect(actions).toEqual([]);
+  });
+
+  it('màn 120 Hz dư nhiều (< 0,7 × ngân sách): nâng lần lượt từng nấc', () => {
+    const tuner = createTuner({ budgetMs: DESKTOP });
+    const ladder = { applied: 2, steps: 4 };
+    const { actions } = run(tuner, { seconds: 30, gapFor: () => 1000 / 120, ladder });
+    expect(kinds(actions)).toEqual(['up', 'up']);
+    expect(ladder.applied).toBe(0);
+  });
+});
```

Run: `npx vitest run tests/unit/quality.test.js`
Kết quả mong đợi: FAIL, 1 file test không nạp được; lỗi đầu tiên: `TypeError: Cannot read properties of undefined (reading 'desktop')`.

- [ ] **Step 2: Thay `src/engine/quality.js`**

```js
// engine/quality.js — chọn mức chất lượng lúc khởi động, ghép ngân sách của bức, và bộ điều chỉnh có trễ (hàm thuần, không three).

export const LEVELS = Object.freeze(['cao', 'vua', 'thap']);

// Mức mặc định của xưởng chỉ biết DPR tối đa. Mọi con số khác (số lá, độ phân giải phản chiếu…) là của từng bức.
export const DEFAULT_LEVELS = Object.freeze({
  cao: Object.freeze({ dpr: 2 }),
  vua: Object.freeze({ dpr: 1.5 }),
  thap: Object.freeze({ dpr: 1.25 }),
});

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
  drop: 1.5, // một khoảng dài hơn 1,5 × trung vị của cửa sổ là một lần rớt khung
  downAfter: 2, // số cửa sổ quá tải liền nhau thì hạ một nấc
  upAfter: 5, // số cửa sổ dư liền nhau thì nâng một nấc
  lockWithin: 3, // nâng một nấc mà trong chừng này cửa sổ phải hạ lại đúng nấc đó thì khóa nó
  gain: 0.9, // hạ hết thang mà trung bình vẫn ≥ 90% lúc bắt đầu hạ: nhịp bị khóa, không phải GPU yếu
});

/**
 * Máy này có phải điện thoại/máy tính bảng không.
 * iPadOS 13+ gửi UA giống hệt Mac, nên "Macintosh + màn hình cảm ứng nhiều điểm" cũng tính là máy cầm tay.
 * @param {{ userAgent?: string, maxTouchPoints?: number }} [nav]  thường là window.navigator
 */
export function isMobile({ userAgent = '', maxTouchPoints = 0 } = {}) {
  return /Android|iPhone|iPad|Mobile/i.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

/**
 * Bảng §10: WebGPU → cao (desktop) / vừa (điện thoại); WebGL2 → vừa / thấp.
 * @param {{ tier: 'webgpu' | 'webgl2', mobile: boolean }} opts  tier là backend THẬT sau renderer.init()
 * @returns {'cao' | 'vua' | 'thap'}
 */
export function pickLevel({ tier, mobile }) {
  if (tier === 'webgpu') return mobile ? 'vua' : 'cao';
  if (tier === 'webgl2') return mobile ? 'thap' : 'vua';
  throw new Error(`pickLevel: tầng "${tier}" không có mức chất lượng`);
}

/**
 * Ngân sách của một mức = mức mặc định của xưởng, ghép với quality.levels[level] của bức. Lớp đọc qua ctx.budget.
 * @param {'cao' | 'vua' | 'thap'} level
 * @param {{ levels?: Record<string, Record<string, number>> }} [qualitySpec]  Painting.quality (có từ GĐ 3)
 * @returns {Record<string, number>}  object mới, sửa thoải mái
 */
export function budgetFor(level, qualitySpec) {
  if (!LEVELS.includes(level)) throw new Error(`budgetFor: không có mức "${level}"`);
  return { ...DEFAULT_LEVELS[level], ...(qualitySpec?.levels?.[level] ?? {}) };
}

/**
 * Bộ điều chỉnh có trễ: đọc thời điểm của từng khung (nhịp requestAnimationFrame), đo theo cửa sổ 2 giây,
 * rồi trả lời nên hạ một nấc ('down'), nâng một nấc ('up'), trả lại mọi nấc ('reset') hay để yên (null).
 * Chỉ QUYẾT ĐỊNH; việc áp nấc là của engine/gpu/ladder.js. Nấc đã áp là một ngăn xếp: `applied` nấc đầu của thang.
 *
 * Nhịp rAF không phải thời gian GPU: trình duyệt khóa nó theo màn hình (60 Hz: không bao giờ dưới 16,7 ms) và theo
 * chế độ tiết kiệm pin (30 fps). Ba luật ngoài spec gốc sinh ra từ đó (spec §10, GĐ 3):
 * 1. "Dư" gồm cả "không rớt khung nào mà trung bình không vượt ngân sách": màn 60 Hz mới nâng lại được.
 *    Nâng một nấc mà phải hạ lại ngay đúng nấc đó thì khóa nó: không dao động qua lại.
 * 2. Hạ hết thang mà không nhanh hơn lúc bắt đầu hạ thì nhịp đang bị khóa: trả lại hết ('reset') rồi thôi hạ,
 *    cho tới khi trung bình về dưới ngân sách.
 * 3. guard(true) khi Sổ tay mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên chậm vừa phải
 *    thì để yên cho số đo trung thực; nhưng quá tải NẶNG (> ngân sách × 2,2) thì vẫn hạ, để máy không bị ép quá sức.
 *    Lúc canh không bao giờ nâng.
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
  let windowNo = 0;
  let overRun = 0;
  let spareRun = 0;
  let descentStart = null; // trung bình của cửa sổ khiến hạ nấc đầu tiên (từ lúc chưa hạ gì)
  let capped = false; // nhịp đang bị khóa: không hạ nữa
  let lastUp = null; // { index, windowNo } của lần nâng gần nhất
  const locked = new Set();

  const clear = () => {
    gaps = [];
    total = 0;
  };

  /** Quyết định ở cuối mỗi cửa sổ. */
  function decide(avg, drops, applied, steps) {
    const over = avg > budgetMs * (guarding ? o.severe : o.over);
    const spare = !guarding && (avg < budgetMs * o.spare || (avg <= budgetMs * o.near && drops === 0));
    overRun = over ? overRun + 1 : 0;
    spareRun = spare ? spareRun + 1 : 0;
    if (capped) {
      if (avg > budgetMs) return null;
      capped = false; // nhịp hết bị khóa (cắm sạc, tắt tiết kiệm pin): chạy lại như thường
    }
    if (overRun >= o.downAfter) {
      overRun = 0;
      spareRun = 0;
      if (applied < steps) {
        if (applied === 0 && !guarding) descentStart = avg;
        if (lastUp && lastUp.index === applied && windowNo - lastUp.windowNo <= o.lockWithin) locked.add(applied);
        return 'down';
      }
      if (!guarding && descentStart !== null && avg >= descentStart * o.gain) {
        capped = true;
        descentStart = null;
        return 'reset';
      }
      return null;
    }
    if (spareRun >= o.upAfter && applied > 0 && !locked.has(applied - 1)) {
      spareRun = 0;
      lastUp = { index: applied - 1, windowNo };
      return 'up';
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
      gaps.push(gap);
      total += gap;
      if (total < o.windowMs) return null;
      const avg = total / gaps.length;
      const median = [...gaps].sort((a, b) => a - b)[gaps.length >> 1];
      const drops = gaps.filter((g) => g > median * o.drop).length;
      clear();
      windowNo += 1;
      return decide(avg, drops, applied, steps);
    },
    /** Chuyển sang chế độ canh (Sổ tay mở) hay về như thường; đổi chế độ thì đo lại từ đầu, có khởi động. */
    guard(on) {
      guarding = on;
      since = null;
      last = null;
      overRun = 0;
      spareRun = 0;
      clear();
    },
    /** @returns {{ guarding: boolean, capped: boolean, locked: number[] }} */
    state: () => ({ guarding, capped, locked: [...locked] }),
  };
}
```

Run: `npx vitest run tests/unit/quality.test.js`
Kết quả mong đợi: PASS (21 test). Test "40 fps…" cho thấy đúng cái giá của nhịp khóa 60 Hz: máy giả chạy đủ 60 fps ở nấc 2 trông như "còn dư", nên bộ điều chỉnh thử nâng MỘT lần, thấy chậm lại thì hạ và khóa nấc đó (`locked: [1]`).

- [ ] **Step 3: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  520 passed`.

```bash
git add src/engine/quality.js tests/unit/quality.test.js
git commit -F - <<'EOF'
feat(engine): bộ điều chỉnh chất lượng có trễ (hàm thuần): 60 Hz vẫn nâng lại được, khóa nấc dao động, nhận ra nhịp bị khóa 30 fps, chỉ canh quá tải nặng khi Sổ tay mở

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 4: Thang nấc (`engine/gpu/ladder.js`) và `stage.dpr()`

**Mục tiêu:** Spec §10, §8.4 `DegradeStep`. Đây là thang nấc CỤ THỂ của một cảnh, dựng từ `painting.quality.ladder` (thiếu thì chỉ có `'dpr'`):
- `'dpr'` tách thành nhiều nấc, mỗi nấc −0,25, tính từ DPR THẬT lúc dựng (`stage.dpr()` = min(devicePixelRatio, trần)) xuống sàn 1. Gỡ nấc dpr đầu tiên thì trả đúng trần của mức.
- `'<layerId>.<stepId>'` lấy từ `layer.degrade`. Mục không có lớp nào đưa ra ở mức hiện tại thì bỏ qua.
- Nấc áp như ngăn xếp: `down()`, `up()`, `reset()`.

**Files:**
- Create: `src/engine/gpu/ladder.js`, `tests/unit/ladder.test.js`
- Modify: `src/engine/gpu/stage.js` (thêm `dpr()`)

**Interfaces:**
- Consumes: `Layer.degrade: { id, apply(), revert() }[]` (hợp đồng, spec §8.4); sân khấu `{ dpr(), setDpr(max) }`.
- Produces:
  - `DPR_STEP = 0.25`, `DPR_FLOOR = 1`, `dprSteps(start) → number[]`;
  - `createLadder({ ladder = ['dpr'], layers, stage, dpr })` trả về `{ steps, applied, ids(), down(), up(), reset() }`:
    - `steps`, `applied` là getter;
    - `ids()` trả id các nấc đang áp: `'dpr=1.75'` hay `'<layerId>.<stepId>'`;
    - `down()`, `up()` trả `false` khi hết nấc;
  - `stage.dpr() → number`.

- [ ] **Step 1: Test (hỏng: chưa có `ladder.js`)**

Tạo `tests/unit/ladder.test.js`:
```js
// tests/unit/ladder.test.js — thang nấc: 'dpr' nở theo DPR thật, nấc của lớp lấy từ degrade, áp và gỡ như ngăn xếp.
import { describe, it, expect, vi } from 'vitest';
import { DPR_FLOOR, DPR_STEP, createLadder, dprSteps } from '../../src/engine/gpu/ladder.js';

/** Sân khấu giả: nhớ trần DPR đang đặt; DPR thật của máy là `device`. */
function fakeStage(device) {
  let max = Infinity;
  return {
    dpr: () => Math.min(device, max),
    setDpr: vi.fn((v) => {
      max = v;
    }),
  };
}

/** Lớp giả có các nấc ghi lại lời gọi vào `log`. */
function layer(id, stepIds, log) {
  return { id, layer: { degrade: stepIds.map((s) => ({ id: s, apply: () => log.push(`+${id}.${s}`), revert: () => log.push(`-${id}.${s}`) })) } };
}

describe('dprSteps', () => {
  it('mỗi nấc bớt 0,25, dừng ở sàn 1', () => {
    expect([DPR_STEP, DPR_FLOOR]).toEqual([0.25, 1]);
    expect(dprSteps(2)).toEqual([1.75, 1.5, 1.25, 1]);
    expect(dprSteps(1.5)).toEqual([1.25, 1]);
    expect(dprSteps(1.25)).toEqual([1]);
    expect(dprSteps(1)).toEqual([]);
    expect(dprSteps(0.9)).toEqual([]); // trang đang thu nhỏ: DPR dưới 1 thì không hạ nữa
  });
});

describe('createLadder', () => {
  it("thiếu ladder thì chỉ có 'dpr'; màn DPR 1 thì thang rỗng", () => {
    expect(createLadder({ layers: [], stage: fakeStage(2), dpr: 2 }).steps).toBe(4);
    expect(createLadder({ layers: [], stage: fakeStage(1), dpr: 2 }).steps).toBe(0);
  });

  it("'dpr' tính từ DPR THẬT: máy 1,5 ở mức trần 2 có 2 nấc; gỡ nấc đầu thì trả đúng trần của mức", () => {
    const stage = fakeStage(1.5);
    const ladder = createLadder({ layers: [], stage, dpr: 2 });
    expect(ladder.steps).toBe(2);
    ladder.down();
    ladder.down();
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([1.25, 1]);
    expect(ladder.ids()).toEqual(['dpr=1.25', 'dpr=1']);
    ladder.up();
    ladder.up();
    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([1.25, 1, 1.25, 2]);
  });

  it('nấc của lớp theo đúng thứ tự thang; mục không có lớp hay lớp không đưa nấc đó thì bỏ qua', () => {
    const log = [];
    const layers = [layer('mat-nuoc', ['phan-chieu'], log), layer('anh-trang', [], log), layer('phu-bong', ['bloom'], log)];
    const ladder = createLadder({
      ladder: ['dpr', 'phu-bong.bloom', 'anh-trang.bong', 'khong-co.gi', 'mat-nuoc.phan-chieu'],
      layers,
      stage: fakeStage(1),
      dpr: 1.25,
    });
    expect(ladder.steps).toBe(2);
    while (ladder.down());
    expect(log).toEqual(['+phu-bong.bloom', '+mat-nuoc.phan-chieu']);
    expect(ladder.ids()).toEqual(['phu-bong.bloom', 'mat-nuoc.phan-chieu']);
  });

  it('áp và gỡ như ngăn xếp; hết thang hay hết nấc thì trả false; reset gỡ hết theo thứ tự ngược', () => {
    const log = [];
    const ladder = createLadder({ ladder: ['a.x', 'b.y', 'c.z'], layers: [layer('a', ['x'], log), layer('b', ['y'], log), layer('c', ['z'], log)], stage: fakeStage(1), dpr: 1 });
    expect(ladder.up()).toBe(false);
    expect([ladder.down(), ladder.down(), ladder.applied]).toEqual([true, true, 2]);
    expect(ladder.up()).toBe(true);
    expect([ladder.down(), ladder.down(), ladder.down()]).toEqual([true, true, false]);
    ladder.reset();
    expect(ladder.applied).toBe(0);
    expect(log).toEqual(['+a.x', '+b.y', '-b.y', '+b.y', '+c.z', '-c.z', '-b.y', '-a.x']);
  });
});
```

Run: `npx vitest run tests/unit/ladder.test.js`
Kết quả mong đợi: FAIL, 1 file test không nạp được; lỗi đầu tiên: `Error: Cannot find module '…/src/engine/gpu/ladder.js'`.

- [ ] **Step 2: Tạo `src/engine/gpu/ladder.js`**

```js
// engine/gpu/ladder.js — thang nấc cụ thể của MỘT cảnh: 'dpr' nở thành nhiều nấc −0,25; '<lớp>.<nấc>' lấy từ layer.degrade. Áp như ngăn xếp.

/** Mỗi nấc 'dpr' bớt chừng này, và không xuống dưới sàn (dưới 1 thì ảnh nhòe thấy rõ). */
export const DPR_STEP = 0.25;
export const DPR_FLOOR = 1;

/** Các trần DPR của nấc 'dpr', từ DPR thật lúc dựng xuống sàn: 2 → [1.75, 1.5, 1.25, 1]; 1 → []. */
export function dprSteps(start) {
  const out = [];
  for (let d = start - DPR_STEP; d >= DPR_FLOOR - 1e-9; d -= DPR_STEP) out.push(Math.round(d * 100) / 100);
  return out;
}

/**
 * Dựng thang nấc từ `painting.quality.ladder` (thiếu thì chỉ có 'dpr'). Mục nào không có lớp nào đưa ra ở mức hiện tại
 * (ví dụ nấc bóng ở mức thấp đã tắt bóng) thì bỏ qua: thang chỉ gồm những nấc có tác dụng.
 *
 * Nấc được áp theo kiểu ngăn xếp: down() áp nấc kế tiếp, up() gỡ nấc vừa áp gần nhất, reset() gỡ hết theo thứ tự ngược.
 * Nấc chỉ hạ TRẦN (spec §8.4): lớp tự tính hiệu lực = min(núm, trần), nên ý của người xem vẫn còn nguyên.
 *
 * @param {object} p
 * @param {string[]} [p.ladder]   ['dpr', 'mat-nuoc.phan-chieu', …]
 * @param {{ id: string, layer: { degrade?: { id: string, apply: () => void, revert: () => void }[] } }[]} p.layers  kết quả buildLayers
 * @param {{ dpr: () => number, setDpr: (max: number) => void }} p.stage
 * @param {number} p.dpr          trần DPR của mức (budget.dpr): nấc dpr đầu tiên gỡ ra thì trả về đúng số này
 */
export function createLadder({ ladder = ['dpr'], layers, stage, dpr }) {
  const steps = [];
  for (const entry of ladder) {
    if (entry === 'dpr') {
      let previous = dpr;
      for (const d of dprSteps(stage.dpr())) {
        const back = previous;
        steps.push({ id: `dpr=${d}`, apply: () => stage.setDpr(d), revert: () => stage.setDpr(back) });
        previous = d;
      }
      continue;
    }
    const dot = entry.indexOf('.');
    const layerId = entry.slice(0, dot);
    const stepId = entry.slice(dot + 1);
    const step = layers.find((b) => b.id === layerId)?.layer.degrade?.find((s) => s.id === stepId);
    if (step) steps.push({ id: entry, apply: () => step.apply(), revert: () => step.revert() });
  }

  let applied = 0;
  const ladderApi = {
    /** Tổng số nấc có trong thang. */
    get steps() {
      return steps.length;
    },
    /** Số nấc đang áp (luôn là những nấc ĐẦU của thang). */
    get applied() {
      return applied;
    },
    /** Id các nấc đang áp, theo thứ tự đã áp: __sma.quality() và huy hiệu đọc. */
    ids: () => steps.slice(0, applied).map((s) => s.id),
    /** Áp nấc kế tiếp. false khi đã hết thang. */
    down() {
      if (applied >= steps.length) return false;
      steps[applied].apply();
      applied += 1;
      return true;
    },
    /** Gỡ nấc vừa áp gần nhất. false khi không còn nấc nào. */
    up() {
      if (applied === 0) return false;
      applied -= 1;
      steps[applied].revert();
      return true;
    },
    /** Gỡ mọi nấc, theo thứ tự ngược lúc áp. */
    reset() {
      while (ladderApi.up());
    },
  };
  return ladderApi;
}
```

- [ ] **Step 3: Thêm `dpr()` vào `src/engine/gpu/stage.js`**

```diff
diff --git a/src/engine/gpu/stage.js b/src/engine/gpu/stage.js
index 405828d..94a75a8 100644
--- a/src/engine/gpu/stage.js
+++ b/src/engine/gpu/stage.js
@@ -117,12 +117,17 @@ export async function createStage({ tier, flags, parent, clearColor, reducedMoti
       controls.target.set(base.x + x, base.y + y, base.z + z);
     },
 
-    /** Đặt trần DPR theo mức chất lượng (budget.dpr) rồi tính lại kích thước. */
+    /** Đặt trần DPR theo mức chất lượng (budget.dpr), hay theo nấc hạ của bộ điều chỉnh, rồi tính lại kích thước. */
     setDpr(max) {
       dprMax = max;
       resize();
     },
 
+    /** DPR đang dùng: devicePixelRatio của máy, kẹp dưới trần hiện tại. Thang nấc 'dpr' bắt đầu từ số này. */
+    dpr() {
+      return Math.min(win.devicePixelRatio || 1, dprMax);
+    },
+
     /** Một nhịp đồng hồ: cập nhật u.time / u.delta. Khung đầu của vòng lặp three có thể không có ms. */
     tick(ms = win.performance.now()) {
       const { t, dt } = clock.tick(ms);
```

Stage không có unit test (chỉ chạy trong trình duyệt có GPU); e2e của Task 15 đi qua nó.

Run: `npx vitest run tests/unit/ladder.test.js`
Kết quả mong đợi: PASS (5 test).

- [ ] **Step 4: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  525 passed`.

```bash
git add src/engine/gpu/ladder.js src/engine/gpu/stage.js tests/unit/ladder.test.js
git commit -F - <<'EOF'
feat(gpu): thang nấc của một cảnh ('dpr' nở theo DPR thật, nấc của lớp từ degrade), áp như ngăn xếp; stage.dpr()

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 5: Bàn thợ: ms CPU, thí nghiệm so sánh, API nấc; trần núm theo mức

**Mục tiêu:** Spec §4.1, §8.4 (GĐ 3).
- **Bàn thợ đo thêm ms CPU mỗi khung** (`measure(info, wallMs, cpuMs)`), vì ms giữa hai khung bị khóa theo nhịp màn hình.
- **Thí nghiệm `kind: 'compare'`:** bàn thợ ghi ms khung và ms CPU riêng cho lúc tắt và lúc bật (trung bình trượt), bỏ 0,25 s đầu sau mỗi lần đổi; đọc bằng `compare()`.
- **API nấc:** `quality()`, `degrade()`, `upgrade()` (hạ/nâng tay một nấc, Promise xong khi đã vẽ lại), `onQuality(cb)`. Tất cả qua một object `quality` mà scene.js đưa vào (Task 6); thiếu thì là "không có gì để hạ".
- **`Knob.max` được phép là hàm của env** (như `value`): trần theo mức, để núm không kéo máy yếu quá sức (spec §10). `knobMax`, `normalizeKnob` và bàn thợ nhận `env` thay cho `tier`. Hợp đồng chỉ THÊM dạng tùy chọn: `max` là số hay `{ webgpu, webgl2 }` vẫn như cũ.

**Files:**
- Modify: `src/engine/gpu/studio.js` (thay cả file), `src/engine/gpu/knob-set.js`, `src/engine/gpu/scene.js` (một dòng: truyền `env`), `src/engine/contracts/runtime.js`
- Test: `tests/unit/studio.test.js`, `tests/unit/knob-set.test.js`

**Interfaces:**
- Consumes: `createKnobs(layerId, knobs, env)` và `env` từ `createCtx` (GĐ 2).
- Produces:
  - `COMPARE_SKIP_MS = 250`;
  - `createStudio({ meta, layers, weights, env, redraw?, tweenSeconds?, quality? })`;
  - studio:
    - `stats() → { drawCalls, triangles, ms, cpuMs }`;
    - `measure(info, wallMs, cpuMs = 0)`;
    - `compare(layerId, expId) → { off: { ms, cpuMs } | null, on: … }`;
    - `quality() → { level, steps, guarding, capped }`;
    - `degrade() / upgrade() → Promise<boolean>`;
    - `onQuality(cb) → () => void`;
  - `knobMax(knob, env)`; `normalizeKnob(layerId, knob, raw, env)`.

- [ ] **Step 1: Test (hỏng)**

Áp vào `tests/unit/knob-set.test.js`:
```diff
diff --git a/tests/unit/knob-set.test.js b/tests/unit/knob-set.test.js
index 23bd965..f6f63a7 100644
--- a/tests/unit/knob-set.test.js
+++ b/tests/unit/knob-set.test.js
@@ -21,33 +21,38 @@ describe('knobValue / knobMax', () => {
     expect(knobValue({ id: 'size', value: 0.5 }, env)).toBe(0.5);
   });
 
-  it('max theo tầng hoặc một số', () => {
-    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, 'webgl2')).toBe(20000);
-    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, 'webgpu')).toBe(200000);
-    expect(knobMax({ id: 'size', max: 0.5 }, 'webgpu')).toBe(0.5);
-    expect(knobMax({ id: 'size' }, 'webgpu')).toBeUndefined();
+  it('max theo tầng, một số, hoặc (GĐ 3) một hàm của env: trần theo mức chất lượng', () => {
+    const webgl2 = { tier: 'webgl2', level: 'vua' };
+    const webgpu = { tier: 'webgpu', level: 'cao' };
+    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, webgl2)).toBe(20000);
+    expect(knobMax({ id: 'count', max: { webgpu: 200000, webgl2: 20000 } }, webgpu)).toBe(200000);
+    expect(knobMax({ id: 'size', max: 0.5 }, webgpu)).toBe(0.5);
+    expect(knobMax({ id: 'size' }, webgpu)).toBeUndefined();
+    const byLevel = { id: 'count', max: (e) => ({ cao: 9, vua: 5, thap: 2 })[e.level] };
+    expect([knobMax(byLevel, webgpu), knobMax(byLevel, { tier: 'webgpu', level: 'thap' })]).toEqual([9, 2]);
+    expect(normalizeKnob('x', { ...byLevel, min: 1 }, 7, webgl2)).toBe(5);
   });
 });
 
 describe('normalizeKnob', () => {
   it('số: kẹp trong [min, trần của tầng]; chuỗi số cũng nhận; không phải số thì ném lỗi', () => {
     const count = { id: 'count', min: 100, max: { webgpu: 200000, webgl2: 20000 } };
-    expect(normalizeKnob('vang-la', count, 50000, 'webgl2')).toBe(20000);
-    expect(normalizeKnob('vang-la', count, 50000, 'webgpu')).toBe(50000);
-    expect(normalizeKnob('vang-la', count, 3, 'webgpu')).toBe(100);
-    expect(normalizeKnob('vang-la', count, '1500', 'webgpu')).toBe(1500);
-    expect(() => normalizeKnob('vang-la', count, 'nhiều', 'webgpu')).toThrow('Núm "vang-la.count": "nhiều" không phải số');
+    expect(normalizeKnob('vang-la', count, 50000, { tier: 'webgl2' })).toBe(20000);
+    expect(normalizeKnob('vang-la', count, 50000, { tier: 'webgpu' })).toBe(50000);
+    expect(normalizeKnob('vang-la', count, 3, { tier: 'webgpu' })).toBe(100);
+    expect(normalizeKnob('vang-la', count, '1500', { tier: 'webgpu' })).toBe(1500);
+    expect(() => normalizeKnob('vang-la', count, 'nhiều', { tier: 'webgpu' })).toThrow('Núm "vang-la.count": "nhiều" không phải số');
   });
 
   it("bool → true/false; color → '#rrggbb' chữ thường; select phải có trong options", () => {
-    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 1, 'webgpu')).toBe(true);
-    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 0, 'webgpu')).toBe(false);
-    expect(normalizeKnob('x', { id: 'c', kind: 'color' }, '#F2D48A', 'webgpu')).toBe('#f2d48a');
-    expect(() => normalizeKnob('x', { id: 'c', kind: 'color' }, 'vàng', 'webgpu')).toThrow('màu phải có dạng #rrggbb');
+    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 1, { tier: 'webgpu' })).toBe(true);
+    expect(normalizeKnob('cot', { id: 'wireframe', kind: 'bool' }, 0, { tier: 'webgpu' })).toBe(false);
+    expect(normalizeKnob('x', { id: 'c', kind: 'color' }, '#F2D48A', { tier: 'webgpu' })).toBe('#f2d48a');
+    expect(() => normalizeKnob('x', { id: 'c', kind: 'color' }, 'vàng', { tier: 'webgpu' })).toThrow('màu phải có dạng #rrggbb');
     const tone = { id: 'tone', kind: 'select', options: ['none', 'agx'] };
-    expect(normalizeKnob('phu-bong', tone, 'agx', 'webgpu')).toBe('agx');
-    expect(() => normalizeKnob('phu-bong', tone, 'aces', 'webgpu')).toThrow('Núm "phu-bong.tone": "aces" không có trong options');
-    expect(() => normalizeKnob('phu-bong', { id: 'x', kind: 'vector' }, 1, 'webgpu')).toThrow('Núm "phu-bong.x" có kind lạ: "vector"');
+    expect(normalizeKnob('phu-bong', tone, 'agx', { tier: 'webgpu' })).toBe('agx');
+    expect(() => normalizeKnob('phu-bong', tone, 'aces', { tier: 'webgpu' })).toThrow('Núm "phu-bong.tone": "aces" không có trong options');
+    expect(() => normalizeKnob('phu-bong', { id: 'x', kind: 'vector' }, 1, { tier: 'webgpu' })).toThrow('Núm "phu-bong.x" có kind lạ: "vector"');
   });
 });
 
```

Áp vào `tests/unit/studio.test.js`:
```diff
diff --git a/tests/unit/studio.test.js b/tests/unit/studio.test.js
index 1a0c62b..8b743f5 100644
--- a/tests/unit/studio.test.js
+++ b/tests/unit/studio.test.js
@@ -6,8 +6,8 @@ import { createStudio } from '../../src/engine/gpu/studio.js';
 const env = { tier: 'webgl2', level: 'vua', budget: {}, now: new Date('2026-09-28T14:00:00Z'), mobile: false };
 const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }] };
 
-/** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm và số đo. */
-function setup({ tier = 'webgl2' } = {}) {
+/** Hai lớp giả: Cốt có núm uniform + núm rebuild; lớp hai có thí nghiệm (một kiểu compare) và số đo. */
+function setup({ tier = 'webgl2', quality } = {}) {
   const log = [];
   const cot = {
     id: 'cot',
@@ -24,7 +24,10 @@ function setup({ tier = 'webgl2' } = {}) {
     id: 'lop-hai',
     knobs: [{ id: 'tone', kind: 'select', options: ['none', 'agx'], value: 'agx' }],
     createLayer: () => ({
-      experiments: [{ id: 'pha', toggle: vi.fn((on) => { log.push(`pha=${on}`); }) }],
+      experiments: [
+        { id: 'pha', toggle: vi.fn((on) => { log.push(`pha=${on}`); }) },
+        { id: 'so', kind: 'compare', toggle: vi.fn() },
+      ],
       readouts: [{ id: 'dinh', get: () => 42, unit: 'đỉnh' }, { id: 'ten', get: () => 'x' }],
       dispose() {},
     }),
@@ -32,7 +35,7 @@ function setup({ tier = 'webgl2' } = {}) {
   const weights = createWeights(meta.layers);
   const layers = buildLayers([cot, two], {}, {}, { ...env, tier });
   const redraw = vi.fn();
-  const studio = createStudio({ meta, layers, weights, tier, redraw, tweenSeconds: 0.5 });
+  const studio = createStudio({ meta, layers, weights, env: { ...env, tier }, redraw, tweenSeconds: 0.5, quality });
   return { studio, weights, layers, redraw, log };
 }
 
@@ -46,7 +49,10 @@ describe('createStudio', () => {
       { id: 'count', kind: 'number', via: 'rebuild', min: 10, max: 500, step: undefined, options: undefined },
     ]);
     expect(setup({ tier: 'webgpu' }).studio.layers()[0].knobs[1].max).toBe(2000);
-    expect(two).toMatchObject({ experiments: [{ id: 'pha', kind: 'toggle' }], readouts: [{ id: 'dinh', unit: 'đỉnh' }, { id: 'ten', unit: '' }] });
+    expect(two).toMatchObject({
+      experiments: [{ id: 'pha', kind: 'toggle' }, { id: 'so', kind: 'compare' }],
+      readouts: [{ id: 'dinh', unit: 'đỉnh' }, { id: 'ten', unit: '' }],
+    });
   });
 
   it('setWeight: mặc định đặt ngay rồi vẽ lại; tween: true thì chỉ đặt đích (vòng lặp tiến dần)', async () => {
@@ -85,16 +91,66 @@ describe('createStudio', () => {
     expect(() => studio.experiment('lop-hai', 'khac')).toThrow('Lớp "lop-hai" không có thí nghiệm "khac"');
   });
 
-  it('readouts đọc ngay lúc gọi; stats: draw call, tam giác, ms giữa hai khung (trung bình trượt)', () => {
+  it('readouts đọc ngay lúc gọi; stats: draw call, tam giác, ms giữa hai khung và ms CPU (trung bình trượt)', () => {
     const { studio } = setup();
     expect(studio.readouts('lop-hai')).toEqual([{ id: 'dinh', value: 42, unit: 'đỉnh' }, { id: 'ten', value: 'x', unit: '' }]);
     const info = { render: { drawCalls: 21, triangles: 90000 } };
-    studio.measure(info, 1000);
-    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0 });
-    studio.measure(info, 1016);
+    studio.measure(info, 1000, 4);
+    expect(studio.stats()).toEqual({ drawCalls: 21, triangles: 90000, ms: 0, cpuMs: 4 });
+    studio.measure(info, 1016, 4);
     expect(studio.stats().ms).toBe(16);
-    studio.measure(info, 1052);
+    studio.measure(info, 1052, 14);
     expect(studio.stats().ms).toBeCloseTo(16 * 0.9 + 36 * 0.1, 6);
+    expect(studio.stats().cpuMs).toBeCloseTo(4 * 0.9 + 14 * 0.1, 6);
+  });
+
+  it("compare: số đo tách theo trạng thái của thí nghiệm; bỏ 0,25 s đầu sau mỗi lần đổi; thí nghiệm thường thì null", async () => {
+    const { studio } = setup();
+    const info = { render: { drawCalls: 1, triangles: 1 } };
+    let t = 0;
+    const frames = (n, gap, cpu) => {
+      for (let i = 0; i < n; i++) studio.measure(info, (t += gap), cpu);
+    };
+    expect(studio.compare('lop-hai', 'so')).toEqual({ off: null, on: null });
+    frames(10, 16, 2); // 160 ms đầu: còn trong khoảng bỏ qua
+    expect(studio.compare('lop-hai', 'so').off).toBeNull();
+    frames(20, 16, 2);
+    expect(studio.compare('lop-hai', 'so').off).toEqual({ ms: 16, cpuMs: 2 });
+    await studio.toggleExperiment('lop-hai', 'so', true);
+    frames(7, 33, 9); // vừa bật: 231 ms đầu vẫn bị bỏ qua
+    expect(studio.compare('lop-hai', 'so').on).toBeNull();
+    frames(20, 33, 9);
+    expect(studio.compare('lop-hai', 'so')).toEqual({ off: { ms: 16, cpuMs: 2 }, on: { ms: 33, cpuMs: 9 } });
+    expect(studio.compare('lop-hai', 'pha')).toEqual({ off: null, on: null });
+    expect(() => studio.compare('lop-hai', 'khac')).toThrow('Lớp "lop-hai" không có thí nghiệm "khac"');
+  });
+
+  it('nấc: quality() đọc bộ điều chỉnh; degrade()/upgrade() hạ/nâng tay một nấc rồi vẽ lại; thiếu bộ điều chỉnh thì không có gì', async () => {
+    const steps = [];
+    const listeners = [];
+    const quality = {
+      state: () => ({ level: 'cao', steps: [...steps], guarding: false, capped: false }),
+      degrade: () => (steps.length < 2 ? Boolean(steps.push(`n${steps.length}`)) : false),
+      upgrade: () => Boolean(steps.pop()),
+      onChange: (cb) => {
+        listeners.push(cb);
+        return () => {};
+      },
+    };
+    const { studio, redraw } = setup({ quality });
+    expect(await studio.degrade()).toBe(true);
+    expect(await studio.degrade()).toBe(true);
+    expect(await studio.degrade()).toBe(false);
+    expect(studio.quality()).toEqual({ level: 'cao', steps: ['n0', 'n1'], guarding: false, capped: false });
+    expect(await studio.upgrade()).toBe(true);
+    expect(studio.quality().steps).toEqual(['n0']);
+    expect(redraw).toHaveBeenCalledTimes(4);
+    const cb = () => {};
+    studio.onQuality(cb);
+    expect(listeners).toEqual([cb]);
+    const bare = setup().studio;
+    expect(bare.quality()).toEqual({ level: null, steps: [], guarding: false, capped: false });
+    expect(await bare.degrade()).toBe(false);
   });
 
   it('snapshot → JSON gọn: trọng số lấy ĐÍCH của tween, núm theo địa chỉ "layerId.knobId"', () => {
```

Run: `npx vitest run tests/unit/knob-set.test.js tests/unit/studio.test.js`
Kết quả mong đợi: FAIL, 6 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be 20000 // Object.is equality`.

- [ ] **Step 2: Trần núm là hàm của env (`src/engine/gpu/knob-set.js`)**

```diff
diff --git a/src/engine/gpu/knob-set.js b/src/engine/gpu/knob-set.js
index 7b94cdd..0dcdb5e 100644
--- a/src/engine/gpu/knob-set.js
+++ b/src/engine/gpu/knob-set.js
@@ -22,31 +22,33 @@ export function knobValue(knob, env) {
 }
 
 /**
- * Trần của núm theo tầng: `max` là một số, hoặc `{ webgpu, webgl2 }`.
- * @param {{ max?: number | { webgpu: number, webgl2: number } }} knob
- * @param {'webgpu' | 'webgl2'} tier
+ * Trần của núm: `max` là một số, `{ webgpu, webgl2 }` (theo tầng), hoặc (GĐ 3) một hàm của env, như `value`:
+ * trần theo mức chất lượng, để người xem không kéo được máy yếu quá sức (spec §10).
+ * @param {{ max?: number | { webgpu: number, webgl2: number } | ((env: import('../contracts/runtime.js').KnobEnv) => number) }} knob
+ * @param {import('../contracts/runtime.js').KnobEnv} env
  */
-export function knobMax(knob, tier) {
-  return knob.max !== null && typeof knob.max === 'object' ? knob.max[tier] : knob.max;
+export function knobMax(knob, env) {
+  if (typeof knob.max === 'function') return knob.max(env);
+  return knob.max !== null && typeof knob.max === 'object' ? knob.max[env.tier] : knob.max;
 }
 
 const viaOf = (knob) => knob.via ?? 'uniform';
 
 /**
- * Đưa một giá trị về đúng kiểu của núm. Số bị kẹp trong [min, trần của tầng]; màu là '#rrggbb' chữ thường;
+ * Đưa một giá trị về đúng kiểu của núm. Số bị kẹp trong [min, trần]; màu là '#rrggbb' chữ thường;
  * 'select' phải là một id trong options. Nhờ vậy snapshot() luôn là JSON gọn, và Sổ tay không đưa được số lạ vào.
  * @param {string} layerId
  * @param {import('../contracts/runtime.js').Knob} knob
  * @param {any} raw
- * @param {'webgpu'|'webgl2'} tier
+ * @param {import('../contracts/runtime.js').KnobEnv} env  tầng, mức… của máy này (trần của núm có thể tính từ đây)
  */
-export function normalizeKnob(layerId, knob, raw, tier) {
+export function normalizeKnob(layerId, knob, raw, env) {
   const kind = knob.kind ?? 'number';
   const name = `Núm "${layerId}.${knob.id}"`;
   if (kind === 'number') {
     let v = Number(raw);
     if (!Number.isFinite(v)) throw new Error(`${name}: "${raw}" không phải số`);
-    const max = knobMax(knob, tier);
+    const max = knobMax(knob, env);
     if (knob.min !== undefined) v = Math.max(v, knob.min);
     if (max !== undefined) v = Math.min(v, max);
     return v;
@@ -95,7 +97,7 @@ export function createKnobs(layerId, knobs, env) {
   for (const knob of knobs) {
     if (specs.has(knob.id)) throw new Error(`Lớp "${layerId}" khai báo núm "${knob.id}" hai lần`);
     specs.set(knob.id, knob);
-    const value = normalizeKnob(layerId, knob, knobValue(knob, env), env.tier);
+    const value = normalizeKnob(layerId, knob, knobValue(knob, env), env);
     values[knob.id] = value;
     if (viaOf(knob) === 'uniform') uniforms[knob.id] = knobUniform(knob, value).setName(uniformName(layerId, knob.id));
   }
@@ -135,7 +137,7 @@ export function createKnobs(layerId, knobs, env) {
      */
     set(id, raw) {
       const knob = spec(id);
-      const value = normalizeKnob(layerId, knob, raw, env.tier);
+      const value = normalizeKnob(layerId, knob, raw, env);
       if (viaOf(knob) === 'uniform') {
         assignUniform(uniforms[id], knob, value);
         values[id] = value;
```

- [ ] **Step 3: Thay `src/engine/gpu/studio.js`**

```js
// engine/gpu/studio.js — bàn thợ: gom trọng số, núm, thí nghiệm, số đo và nấc chất lượng thành MỘT API cho Sổ tay và __sma.
import { knobMax } from './knob-set.js';
import { TWEEN_SECONDS } from './layers.js';

/** Sau mỗi lần bật/tắt thí nghiệm 'compare', bỏ chừng này ms đầu (còn biên dịch, còn dựng) rồi mới ghi số đo. */
export const COMPARE_SKIP_MS = 250;

/** Cảnh không có bộ điều chỉnh (test, bức cũ): nấc không có gì để hạ. */
const NO_QUALITY = Object.freeze({
  state: () => ({ level: null, steps: [], guarding: false, capped: false }),
  degrade: () => false,
  upgrade: () => false,
  onChange: () => () => {},
});
const ema = (prev, v) => prev * 0.9 + v * 0.1; // trung bình trượt: khung mới góp 10%

/**
 * Sổ tay (ui/) không được import engine/ hay three: nó chỉ thấy object này. Mọi thay đổi đi qua đây:
 * trọng số (tween hoặc đặt ngay), núm (uniform hoặc onKnob), thí nghiệm (toggle).
 *
 * Khi vòng lặp đã dừng (?freeze=N đã tới khung N), mỗi thay đổi gọi redraw() để vẽ lại ĐÚNG khung đó
 * với giá trị mới mà không tiến đồng hồ: e2e so được ảnh trước và sau ở cùng một khung. Mọi hàm đổi trạng thái
 * trả Promise, xong khi khung đã được vẽ lại (hoặc ngay, nếu vòng lặp đang chạy).
 *
 * @param {object} p
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ id: string, module: object, layer: object, knobs: object }[]} p.layers  kết quả của buildLayers
 * @param {ReturnType<import('./layers.js').createWeights>} p.weights
 * @param {import('../contracts/runtime.js').KnobEnv} p.env   tầng, mức… của máy: trần của núm (có thể theo mức)
 * @param {() => (void | Promise<void>)} [p.redraw]    vẽ lại khung hiện tại nếu vòng lặp đã dừng
 * @param {number} [p.tweenSeconds]                    0 khi người xem xin giảm chuyển động
 * @param {{ state: () => object, degrade: () => boolean, upgrade: () => boolean, onChange: (cb: Function) => Function }} [p.quality]
 *   bộ điều chỉnh của cảnh (scene.js): mức, nấc đang hạ, hạ/nâng tay một nấc
 */
export function createStudio({ meta, layers, weights, env, redraw = () => {}, tweenSeconds = TWEEN_SECONDS, quality = NO_QUALITY }) {
  const byId = new Map(layers.map((b) => [b.id, b]));
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  const experimentsOn = new Set(); // 'layerId.expId' đang bật
  const stats = { drawCalls: 0, triangles: 0, ms: 0, cpuMs: 0 };
  let lastWall = null;
  // Thí nghiệm 'compare': số đo riêng cho lúc tắt (off) và lúc bật (on). fresh = vừa đổi, lần đo tới đặt mốc bỏ qua.
  const compares = new Map();
  for (const { id, layer } of layers) {
    for (const e of layer.experiments ?? []) {
      if (e.kind === 'compare') compares.set(`${id}.${e.id}`, { off: null, on: null, fresh: true, skipUntil: 0 });
    }
  }

  const layerOf = (id) => {
    const built = byId.get(id);
    if (!built) throw new Error(`Không có lớp "${id}"`);
    return built;
  };
  const experimentOf = (layerId, expId) => {
    const exp = (layerOf(layerId).layer.experiments ?? []).find((e) => e.id === expId);
    if (!exp) throw new Error(`Lớp "${layerId}" không có thí nghiệm "${expId}"`);
    return exp;
  };
  // Thay đổi có thể trả Promise (núm 'rebuild', thí nghiệm dựng lại hình): chờ xong rồi mới vẽ lại.
  const settle = async (change) => {
    try {
      await change();
    } finally {
      await redraw();
    }
  };

  return {
    /** Khai báo tĩnh cho Sổ tay, theo thứ tự phủ: núm (trần đã tính theo tầng), thí nghiệm, số đo. */
    layers() {
      return layers.map(({ id, module, layer }) => ({
        id,
        name: names.get(id) ?? id,
        knobs: (module.knobs ?? []).map((k) => ({
          id: k.id,
          kind: k.kind ?? 'number',
          via: k.via ?? 'uniform',
          min: k.min,
          max: knobMax(k, env),
          step: k.step,
          options: k.options,
        })),
        experiments: (layer.experiments ?? []).map((e) => ({ id: e.id, kind: e.kind ?? 'toggle' })),
        readouts: (layer.readouts ?? []).map((r) => ({ id: r.id, unit: r.unit ?? '' })),
      }));
    },

    /** Trọng số hiện tại và đích đang hướng tới (thanh lớp vẽ cả hai khi đang tween). */
    weight(id) {
      layerOf(id);
      return { value: weights.weight(id).value, target: weights.target(id) };
    },
    /** tween: true cho thanh lớp (lớp "phủ" dần); false (mặc định) đặt ngay rồi vẽ lại: __sma và e2e dùng. */
    async setWeight(id, v, { tween = false } = {}) {
      layerOf(id);
      if (tween) {
        weights.tween(id, v, tweenSeconds);
        return;
      }
      weights.set(id, v);
      await redraw();
    },

    /** Giá trị hiện tại của mọi núm của một lớp: { knobId: value }. */
    knobs: (layerId) => layerOf(layerId).knobs.values(),
    /** Đổi một núm; Promise xong khi lớp đã áp giá trị (núm 'rebuild' có thể mất vài chục ms). */
    setKnob(layerId, knobId, value) {
      return settle(() => layerOf(layerId).knobs.set(knobId, value));
    },

    experiment(layerId, expId) {
      experimentOf(layerId, expId);
      return experimentsOn.has(`${layerId}.${expId}`);
    },
    async toggleExperiment(layerId, expId, on) {
      const exp = experimentOf(layerId, expId);
      await settle(() => exp.toggle(on));
      if (on) experimentsOn.add(`${layerId}.${expId}`);
      else experimentsOn.delete(`${layerId}.${expId}`);
      const c = compares.get(`${layerId}.${expId}`);
      if (c) c.fresh = true;
    },
    /**
     * Số đo của một thí nghiệm 'compare': { off, on }, mỗi bên { ms, cpuMs } (trung bình trượt), hay null khi chưa đo.
     * Thí nghiệm kiểu khác thì cả hai là null.
     */
    compare(layerId, expId) {
      experimentOf(layerId, expId);
      const c = compares.get(`${layerId}.${expId}`);
      return { off: c?.off ? { ...c.off } : null, on: c?.on ? { ...c.on } : null };
    },

    /** Số đo riêng của lớp, đọc ngay lúc gọi. */
    readouts(layerId) {
      return (layerOf(layerId).layer.readouts ?? []).map((r) => ({ id: r.id, value: r.get(), unit: r.unit ?? '' }));
    },
    /** Số đo của xưởng, của khung vừa vẽ: draw call, tam giác, ms giữa hai khung và ms CPU (trung bình trượt). */
    stats: () => ({ ...stats }),
    /**
     * scene.js gọi cuối mỗi khung. `info` là renderer.info (three tự reset đầu mỗi khung của vòng lặp),
     * `wallMs` là đồng hồ tường: ms đo khung thật, kể cả khi ?freeze giữ đồng hồ của cảnh ở 1/60 s.
     * `cpuMs` là thời gian luồng chính làm khung đó (từ đầu step tới sau render): ms giữa hai khung bị khóa theo
     * nhịp màn hình, còn ms CPU lộ ngay phần việc của JS.
     */
    measure(info, wallMs, cpuMs = 0) {
      stats.drawCalls = info.render.drawCalls;
      stats.triangles = info.render.triangles;
      stats.cpuMs = stats.cpuMs === 0 ? cpuMs : ema(stats.cpuMs, cpuMs);
      if (lastWall !== null) {
        const dt = wallMs - lastWall;
        stats.ms = stats.ms === 0 ? dt : ema(stats.ms, dt);
        for (const [key, c] of compares) {
          if (c.fresh) {
            c.fresh = false;
            c.skipUntil = wallMs + COMPARE_SKIP_MS;
          }
          if (wallMs < c.skipUntil) continue;
          const side = experimentsOn.has(key) ? 'on' : 'off';
          const prev = c[side];
          c[side] = prev ? { ms: ema(prev.ms, dt), cpuMs: ema(prev.cpuMs, cpuMs) } : { ms: dt, cpuMs };
        }
      }
      lastWall = wallMs;
    },

    /** Bộ điều chỉnh: { level, steps: id các nấc đang hạ, guarding (Sổ tay mở: chỉ canh quá tải nặng), capped }. */
    quality: () => quality.state(),
    /** Hạ tay MỘT nấc (DevTools, e2e); false khi hết thang. Xong khi khung đã vẽ lại (nếu ?freeze đã dừng). */
    async degrade() {
      let done = false;
      await settle(() => {
        done = quality.degrade();
      });
      return done;
    },
    /** Nâng tay MỘT nấc (gỡ nấc hạ gần nhất); false khi không còn nấc nào. */
    async upgrade() {
      let done = false;
      await settle(() => {
        done = quality.upgrade();
      });
      return done;
    },
    /** Báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu). Trả hàm bỏ nghe. */
    onQuality: (cb) => quality.onChange(cb),

    /**
     * Trạng thái tác phẩm dạng JSON (spec §16): { weights: { id: số }, knobs: { 'layerId.knobId': giá trị } }.
     * Trọng số lấy ĐÍCH của tween: snapshot giữa lúc đang phủ vẫn ra đúng ý người xem.
     */
    snapshot() {
      const knobs = {};
      for (const { id, knobs: set } of layers) {
        for (const [knobId, value] of Object.entries(set.values())) knobs[`${id}.${knobId}`] = value;
      }
      return { weights: Object.fromEntries(weights.ids.map((id) => [id, weights.target(id)])), knobs };
    },
    /**
     * Áp lại một snapshot: trọng số đặt ngay; núm nào khác giá trị hiện tại thì set (chờ lần lượt, vì núm
     * 'rebuild' có thể dựng lại hình). Id lạ (lớp hay núm không còn) hay núm áp không được thì bỏ qua kèm cảnh báo:
     * "Dựng lại cảnh" gọi hàm này, và một núm hỏng không được kéo cả cảnh về tầng tĩnh (spec §9).
     */
    async restore({ weights: w = {}, knobs = {} } = {}) {
      try {
        for (const [id, v] of Object.entries(w)) {
          if (byId.has(id)) weights.set(id, v);
          else console.warn(`restore: bỏ qua trọng số của lớp lạ "${id}"`);
        }
        for (const [key, v] of Object.entries(knobs)) {
          const dot = key.indexOf('.');
          const built = byId.get(key.slice(0, dot));
          const knobId = key.slice(dot + 1);
          if (!built || !Object.hasOwn(built.knobs.values(), knobId)) {
            console.warn(`restore: bỏ qua núm lạ "${key}"`);
            continue;
          }
          if (built.knobs.get(knobId) === v) continue;
          try {
            await built.knobs.set(knobId, v);
          } catch (err) {
            console.warn(`restore: núm "${key}" áp không được, giữ giá trị cũ:`, err);
          }
        }
      } finally {
        await redraw();
      }
    },
  };
}
```

- [ ] **Step 4: scene.js đưa `env` cho bàn thợ, hợp đồng nặng GĐ 3**

`src/engine/gpu/scene.js`:
```diff
diff --git a/src/engine/gpu/scene.js b/src/engine/gpu/scene.js
index 30af110..fb040c7 100644
--- a/src/engine/gpu/scene.js
+++ b/src/engine/gpu/scene.js
@@ -72,7 +72,7 @@ export function buildScene({ stage, disposer, painting, meta, flags, now, reduce
     meta,
     layers,
     weights,
-    tier: stage.backend,
+    env, // trần của núm theo tầng và theo mức (knob-set.js#knobMax)
     tweenSeconds: reducedMotion ? 0 : undefined, // giảm chuyển động: lớp bật/tắt ngay, không mờ dần
     redraw,
   });
```

`src/engine/contracts/runtime.js`:
```diff
diff --git a/src/engine/contracts/runtime.js b/src/engine/contracts/runtime.js
index aa7b87f..17cc2e2 100644
--- a/src/engine/contracts/runtime.js
+++ b/src/engine/contracts/runtime.js
@@ -45,7 +45,8 @@
  *                                 Marker '// @knob <id>': núm 'uniform' ở dòng dùng uniform; 'js'/'rebuild' ở dòng xử lý onKnob.
  * @property {number|string|boolean|((env: KnobEnv) => any)} value   mặc định; hàm khi phụ thuộc mức/tầng/đêm nay
  * @property {number} [min]
- * @property {number | { webgpu: number, webgl2: number }} [max]   trần theo tầng
+ * @property {number | { webgpu: number, webgl2: number } | ((env: KnobEnv) => number)} [max]   trần theo tầng;
+ *                                 [3] hoặc hàm của env (theo mức): núm không kéo được máy yếu quá sức
  * @property {number} [step]
  * @property {string[]} [options]  kind 'select': id các lựa chọn; uniform giữ chỉ số
  */
@@ -66,13 +67,18 @@
  * @typedef {Object} Experiment
  * @property {string} id
  * @property {(on: boolean) => void | Promise<void>} toggle   trả Promise → UI hiện "đang dựng…"; bật hai lần vẫn an toàn
- * @property {'toggle'|'compare'} [kind]  'compare' [3]: xưởng đo ms lúc tắt/bật và vẽ biểu đồ nhỏ
+ * @property {'toggle'|'compare'} [kind]  'compare' [3]: toggle(true) là biến thể, toggle(false) là trạng thái thường. Bàn thợ
+ *                                        ghi ms mỗi khung và ms CPU riêng cho từng trạng thái (bỏ 0,25 s đầu sau mỗi lần
+ *                                        đổi); Sổ tay vẽ hai cột "Tắt / Bật".
  */
 /** Nhãn ở content.layers[layerId].readouts[id]. get() đọc ngay lúc gọi (Sổ tay đọc 4 lần mỗi giây).
  * @typedef {{ id: string, get: () => number | string, unit?: string }} Readout */
 /** Nấc chỉ hạ TRẦN của lớp, KHÔNG BAO GIỜ ghi vào uniform của núm.
  * Núm = ý người xem, nấc = trần của máy, hiệu lực = min(núm, trần).
  * Nấc không được đổi thứ nằm trong cache key (castShadow, receiveShadow, shadowMap.enabled, fogNode…).
+ * [3] Lớp chỉ đưa những nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng). Xưởng (engine/gpu/ladder.js)
+ * gọi apply/revert như một ngăn xếp: revert luôn gỡ nấc apply gần nhất; mỗi nấc apply tối đa một lần trước khi revert.
+ * Địa chỉ trong QualitySpec.ladder là '<layerId>.<id>'.
  * @typedef {{ id: string, apply: () => void, revert: () => void }} DegradeStep */
 /** Xưởng nối post của các lớp theo thứ tự:
  *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → overlay công cụ → vec4(rgb, 1)
@@ -120,7 +126,7 @@
 /** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
  * @typedef {Object} EngineCtx
  * @property {'webgpu'|'webgl2'} tier          [0] backend THẬT sau renderer.init()
- * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động
+ * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động ([3] hoặc mức ép bằng ?level); nấc hạ KHÔNG đổi số này
  * @property {Record<string, number>} budget   [0] mức mặc định của xưởng ghép với quality.levels[level] của bức
  * @property {boolean} mobile                  [0]
  * @property {boolean} reducedMotion           [0]
@@ -154,9 +160,16 @@
  * @property {(layerId: string, expId: string) => boolean} experiment
  * @property {(layerId: string, expId: string, on: boolean) => Promise<void>} toggleExperiment
  * @property {(layerId: string) => { id: string, value: number | string, unit: string }[]} readouts
- * @property {() => { drawCalls: number, triangles: number, ms: number }} stats   số của khung vừa vẽ
+ * @property {() => { drawCalls: number, triangles: number, ms: number, cpuMs: number }} stats   số của khung vừa vẽ ([3] cpuMs)
  * @property {() => Snapshot} snapshot
  * @property {(s: Snapshot) => Promise<void>} restore
+ * @property {(layerId: string, expId: string) => { off: { ms: number, cpuMs: number } | null, on: { ms: number, cpuMs: number } | null }} compare
+ *   [3] số đo của một thí nghiệm 'compare' theo từng trạng thái (null: chưa đo; thí nghiệm kiểu khác thì luôn null)
+ * @property {() => { level: string | null, steps: string[], guarding: boolean, capped: boolean }} quality
+ *   [3] bộ điều chỉnh: mức, id các nấc đang hạ, đang canh (Sổ tay mở: chỉ hạ khi quá tải nặng), có đang coi là nhịp bị khóa
+ * @property {() => Promise<boolean>} degrade   [3] hạ tay MỘT nấc (DevTools, e2e); false khi hết thang
+ * @property {() => Promise<boolean>} upgrade   [3] nâng tay MỘT nấc; false khi không còn nấc nào
+ * @property {(cb: (q: object) => void) => () => void} onQuality   [3] báo mỗi lần nấc đổi; trả hàm bỏ nghe
  */
 
 export {};
```

Run: `npx vitest run tests/unit/knob-set.test.js tests/unit/studio.test.js tests/unit/scene.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 5: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  527 passed`.

```bash
git add src/engine/gpu/studio.js src/engine/gpu/knob-set.js src/engine/gpu/scene.js src/engine/contracts/runtime.js tests/unit/studio.test.js tests/unit/knob-set.test.js
git commit -F - <<'EOF'
feat(gpu): bàn thợ đo ms CPU mỗi khung, số đo tắt/bật của thí nghiệm compare, hạ/nâng tay một nấc; trần núm theo mức (max là hàm của env); hợp đồng nặng GĐ 3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 6: Cảnh và vòng đời: bộ điều chỉnh trong vòng lặp, trần 60 khung/giây, `?level`

**Mục tiêu:** Spec §8.5, §8.7, §9, §10 (GĐ 3).
- **`scene.js` dựng bộ điều chỉnh của cảnh:**
  - thang nấc (Task 4) dựng SAU pipeline, vì nấc bloom chạm vào node pipeline vừa dựng;
  - bộ quyết định (Task 3), tắt hẳn khi có `?freeze`;
  - `quality.sample(ms)` chạy đầu mỗi khung; đo ms CPU của khung;
  - `?level` ép mức.
- **`run.js`:**
  - thanh lớp mở thì `quality.guard(true)`, đóng thì `guard(false)`; dựng lại cảnh lúc thanh lớp đang mở thì bộ điều chỉnh mới cũng chỉ canh;
  - nấc đổi thì vẽ lại huy hiệu;
  - `__sma` có thêm `quality/degrade/upgrade/stats`;
  - vòng lặp đi qua `createFrameCap()`: tối đa 60 khung/giây trên màn 90/120/144 Hz.
- **`clock.js#createFrameCap`:** mốc "đã vẽ" tiến đều từng bước 1/60 s. Màn 60 Hz dao động nhẹ và máy chậm không bị bỏ khung; tab vừa hiện lại thì vẽ ngay, không vẽ dồn.
- **`flags.js`:** đọc `?level=cao|vua|thap` (giá trị lạ thì bỏ qua; `?debug` thì cảnh báo). Danh sách mức viết riêng trong flags.js (đường nhẹ không kéo quality.js); test so với `LEVELS`.

**Files:**
- Modify: `src/engine/gpu/scene.js` (thay cả file), `src/engine/gpu/run.js`, `src/engine/gpu/clock.js`, `src/engine/flags.js`, `src/engine/sma.js`
- Test: `tests/unit/scene.test.js`, `tests/unit/clock.test.js`, `tests/unit/flags.test.js`

**Interfaces:**
- Consumes:
  - `createTuner`, `FRAME_BUDGET_MS` (Task 3);
  - `createLadder` (Task 4);
  - `createStudio({ …, env, quality })` (Task 5).
- Produces:
  - `readFlags().level: 'cao'|'vua'|'thap'|null`;
  - `MAX_FPS = 60`, `createFrameCap(fps) → { ready(ms): boolean }`;
  - `buildScene(...)` trả thêm `quality: { state, degrade, upgrade, sample, guard, onChange }`;
  - `window.__sma.quality() / degrade() / upgrade() / stats()`.

- [ ] **Step 1: Test (hỏng)**

Áp vào `tests/unit/clock.test.js`:
```diff
diff --git a/tests/unit/clock.test.js b/tests/unit/clock.test.js
index faff91c..1df5034 100644
--- a/tests/unit/clock.test.js
+++ b/tests/unit/clock.test.js
@@ -1,5 +1,5 @@
 import { describe, it, expect } from 'vitest';
-import { createClock } from '../../src/engine/gpu/clock.js';
+import { MAX_FPS, createClock, createFrameCap } from '../../src/engine/gpu/clock.js';
 
 describe('createClock — chế độ freeze (tất định)', () => {
   it('khung 1 có t = 1/60; dt luôn 1/60; ms bị bỏ qua', () => {
@@ -65,3 +65,39 @@ describe('createClock — đồng hồ thật', () => {
     expect(clock.frames).toBe(3);
   });
 });
+
+describe('createFrameCap — tối đa 60 khung/giây', () => {
+  /** Chạy bộ chặn trong `seconds` giây ở nhịp màn hình `hz` (có dao động `jitter` ms); trả số khung được vẽ. */
+  const drawn = (hz, { seconds = 10, jitter = 0 } = {}) => {
+    const cap = createFrameCap();
+    let n = 0;
+    for (let i = 0; i < hz * seconds; i++) {
+      const wobble = jitter * Math.sin(i * 1.7);
+      if (cap.ready((i * 1000) / hz + wobble)) n += 1;
+    }
+    return n / seconds;
+  };
+
+  it('màn 60 Hz (kể cả dao động ±1 ms) và máy chậm: không bỏ khung nào', () => {
+    expect(MAX_FPS).toBe(60);
+    expect(drawn(60, { jitter: 1 })).toBe(60);
+    expect(drawn(45)).toBe(45);
+    expect(drawn(30)).toBe(30);
+  });
+
+  it('màn 90, 120, 144 Hz: vẽ khoảng 60 khung mỗi giây', () => {
+    for (const hz of [90, 120, 144]) {
+      expect(drawn(hz), `${hz} Hz`).toBeGreaterThanOrEqual(59);
+      expect(drawn(hz), `${hz} Hz`).toBeLessThanOrEqual(61);
+    }
+  });
+
+  it('tab vừa hiện lại sau lâu: vẽ ngay rồi đi tiếp, không vẽ dồn; ms không phải số thì vẽ', () => {
+    const cap = createFrameCap();
+    expect(cap.ready(0)).toBe(true);
+    expect(cap.ready(5000)).toBe(true);
+    expect(cap.ready(5008)).toBe(false);
+    expect(cap.ready(5017)).toBe(true);
+    expect(cap.ready(undefined)).toBe(true);
+  });
+});
```

Áp vào `tests/unit/flags.test.js`:
```diff
diff --git a/tests/unit/flags.test.js b/tests/unit/flags.test.js
index a79db88..bc2b9a5 100644
--- a/tests/unit/flags.test.js
+++ b/tests/unit/flags.test.js
@@ -1,5 +1,6 @@
 import { afterEach, describe, expect, it, vi } from 'vitest';
 import { parseAt, readFlags } from '../../src/engine/flags.js';
+import { LEVELS } from '../../src/engine/quality.js';
 
 // 21:00 ngày 28/09/2026 giờ Việt Nam = 14:00 UTC.
 const VN_21H = '2026-09-28T14:00:00.000Z';
@@ -9,7 +10,7 @@ afterEach(() => vi.restoreAllMocks());
 describe('readFlags: cờ bật/tắt', () => {
   it('không có cờ nào thì mọi thứ tắt', () => {
     expect(readFlags('')).toEqual({
-      static: false, webgl: false, force3d: false, debug: false, at: null, freeze: false, poster: false,
+      static: false, webgl: false, force3d: false, debug: false, at: null, freeze: false, poster: false, level: null,
     });
   });
 
@@ -44,6 +45,24 @@ describe('readFlags: cờ bật/tắt', () => {
   });
 });
 
+describe('?level: ép mức chất lượng', () => {
+  it('đúng tên một mức thì nhận; sai hay thiếu thì null', () => {
+    for (const level of LEVELS) expect(readFlags(`?level=${level}`).level).toBe(level);
+    expect(readFlags('?level=sieu').level).toBeNull();
+    expect(readFlags('?level').level).toBeNull();
+    expect(readFlags('?webgl').level).toBeNull();
+  });
+
+  it('có ?debug thì cảnh báo khi ?level sai; không có ?debug thì im lặng', () => {
+    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
+    readFlags('?level=sieu');
+    expect(warn).not.toHaveBeenCalled();
+    readFlags('?debug&level=sieu');
+    expect(warn).toHaveBeenCalledTimes(1);
+    expect(warn.mock.calls[0][0]).toContain('?level');
+  });
+});
+
 describe('parseAt và ?at', () => {
   it('không ghi offset thì hiểu là giờ Việt Nam (+07:00), bất kể múi giờ của máy', () => {
     expect(parseAt('2026-09-28T21:00').toISOString()).toBe(VN_21H);
```

Áp vào `tests/unit/scene.test.js`:
```diff
diff --git a/tests/unit/scene.test.js b/tests/unit/scene.test.js
index 8aad316..39cd946 100644
--- a/tests/unit/scene.test.js
+++ b/tests/unit/scene.test.js
@@ -35,9 +35,10 @@ const painting = {
   ],
 };
 
-/** Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). */
+/** Sân khấu giả: đủ những gì buildScene đọc; renderer là Proxy ghi lời gọi (render, compute…). Máy có DPR 2. */
 function fakeStage(backend) {
   const renderer = fakeRenderer();
+  let dprMax = Infinity;
   const canvas = Object.assign(new EventTarget(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 }) });
   Object.assign(renderer, { toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace, domElement: canvas });
   return {
@@ -48,7 +49,10 @@ function fakeStage(backend) {
     u: { time: uniform(0), delta: uniform(1 / 60), resolution: uniform(new Vector2(640, 400)), pointer: uniform(new Vector2()) },
     controls: { enabled: true, update: vi.fn() },
     useCamera: vi.fn(),
-    setDpr: vi.fn(),
+    setDpr: vi.fn((v) => {
+      dprMax = v;
+    }),
+    dpr: () => Math.min(2, dprMax),
     tick: vi.fn(() => ({ t: 0.5, dt: 1 / 60 })),
     breathe: vi.fn(),
   };
@@ -68,11 +72,11 @@ function fakeWin() {
   return { win, frames, flush: () => frames.splice(0).forEach((cb) => cb(16)) };
 }
 
-function build({ backend = 'webgpu', reducedMotion = false } = {}) {
+function build({ backend = 'webgpu', reducedMotion = false, flags = {} } = {}) {
   const stage = fakeStage(backend);
   const disposer = createDisposer();
   const { win, frames, flush } = fakeWin();
-  const scene = buildScene({ stage, disposer, painting, meta, flags: {}, now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win });
+  const scene = buildScene({ stage, disposer, painting, meta, flags, now: new Date('2026-09-28T14:00:00Z'), reducedMotion, win });
   const renders = () => stage.renderer.render.mock.calls.length;
   return { stage, disposer, scene, frames, flush, renders };
 }
@@ -129,6 +133,53 @@ describe('buildScene', () => {
     expect(renders()).toBe(2);
   });
 
+  it('?level ép mức: WebGPU máy tính mà ?level=thap thì mức thấp (dpr 1.25)', () => {
+    const { scene, stage } = build({ flags: { level: 'thap' } });
+    expect(scene.level).toBe('thap');
+    expect(stage.setDpr).toHaveBeenCalledWith(1.25);
+  });
+
+  it('bộ điều chỉnh: 40 fps thì hạ nấc dpr, huy hiệu được báo; thanh lớp mở (guard) thì chậm vừa phải không hạ nữa', () => {
+    const { scene, stage } = build();
+    const seen = [];
+    scene.quality.onChange((q) => seen.push(q.steps.length));
+    let ms = 0;
+    for (let i = 0; i < 280; i++) scene.step((ms += 25)); // 7 giây ở 40 fps
+    expect(stage.setDpr.mock.calls.map((c) => c[0])).toEqual([2, 1.75]);
+    expect(scene.studio.quality()).toMatchObject({ level: 'cao', steps: ['dpr=1.75'], guarding: false });
+    expect(seen).toEqual([1]);
+    scene.quality.guard(true);
+    for (let i = 0; i < 400; i++) scene.step((ms += 25));
+    expect(scene.studio.quality()).toMatchObject({ steps: ['dpr=1.75'], guarding: true });
+    for (let i = 0; i < 160; i++) scene.step((ms += 50)); // 20 fps: quá tải nặng, vẫn hạ
+    expect(scene.studio.quality().steps.slice(0, 2)).toEqual(['dpr=1.75', 'dpr=1.5']);
+  });
+
+  it('?freeze: không có bộ điều chỉnh (ảnh tất định); hạ/nâng tay vẫn được, rồi vẽ lại', async () => {
+    const { scene, stage, flush, renders } = build({ flags: { freeze: 10 } });
+    let ms = 0;
+    for (let i = 0; i < 400; i++) scene.step((ms += 40));
+    expect(stage.setDpr.mock.calls).toEqual([[2]]);
+    scene.freeze();
+    // degrade() áp nấc rồi mới xin nhịp vẽ lại (sau một microtask): chờ một vòng rồi mới chạy nhịp rAF giả.
+    const tick = () => new Promise((resolve) => setTimeout(resolve, 0)).then(flush);
+    const down = scene.studio.degrade();
+    await tick();
+    expect(await down).toBe(true);
+    expect(stage.setDpr).toHaveBeenLastCalledWith(1.75);
+    const up = scene.studio.upgrade();
+    await tick();
+    expect(await up).toBe(true);
+    expect(stage.setDpr).toHaveBeenLastCalledWith(2);
+    expect(renders()).toBe(402);
+  });
+
+  it('ms CPU của khung đi vào số đo của bàn thợ', () => {
+    const { scene } = build();
+    scene.step(1000);
+    expect(scene.studio.stats()).toHaveProperty('cpuMs');
+  });
+
   it('giảm chuyển động: bật/tắt lớp trên thanh lớp là ngay, không mờ dần', () => {
     const { scene } = build({ reducedMotion: true });
     scene.studio.setWeight('to-mau', 0, { tween: true });
```

Run: `npx vitest run tests/unit/clock.test.js tests/unit/flags.test.js tests/unit/scene.test.js`
Kết quả mong đợi: FAIL, 9 test hỏng; lỗi đầu tiên: `AssertionError: expected undefined to be 60 // Object.is equality`.

- [ ] **Step 2: Bộ chặn 60 khung/giây (`src/engine/gpu/clock.js`) và `?level` (`src/engine/flags.js`)**

```diff
diff --git a/src/engine/gpu/clock.js b/src/engine/gpu/clock.js
index eb0f0a5..39bc187 100644
--- a/src/engine/gpu/clock.js
+++ b/src/engine/gpu/clock.js
@@ -1,7 +1,9 @@
-// engine/gpu/clock.js — đồng hồ của cảnh: thật (theo ms của requestAnimationFrame) hoặc tất định khi có ?freeze.
+// engine/gpu/clock.js — đồng hồ của cảnh (thật, hoặc tất định khi có ?freeze) và bộ chặn 60 khung/giây.
 
 const FRAME = 1 / 60;
 const MAX_DT = 0.1;
+/** Cảnh vẽ tối đa chừng này khung mỗi giây, dù màn hình nhanh hơn (spec §10, GĐ 3). */
+export const MAX_FPS = 60;
 
 /**
  * Hàm thuần, không dùng three: stage.js đổ { t, dt } vào ctx.u.time / ctx.u.delta mỗi khung.
@@ -41,3 +43,27 @@ export function createClock({ freeze = false } = {}) {
     },
   };
 }
+
+/**
+ * Bộ chặn khung (hàm thuần): trình duyệt gọi requestAnimationFrame theo nhịp màn hình (60, 90, 120, 144 Hz…), mà một
+ * bức tranh ngắm chậm chỉ cần 60 khung/giây. Nhịp nào tới sớm quá thì bỏ: màn 120 Hz không bắt GPU vẽ gấp đôi, máy mát
+ * hơn, pin lâu hơn. Mốc "đã vẽ" tiến đều từng bước 1/60 s (không bám nhịp màn hình), nên màn 90 Hz vẽ xen kẽ, trung bình
+ * vẫn 60 khung/giây. Màn 60 Hz, hay máy chậm hơn 60 khung, thì không khung nào bị bỏ.
+ * @param {number} [fps]
+ * @returns {{ ready: (ms: number) => boolean }}  ready(ms) = true: vẽ khung này
+ */
+export function createFrameCap(fps = MAX_FPS) {
+  const step = 1000 / fps;
+  const slack = 1.5; // ms: nhịp 60 Hz thật dao động nhẹ, đừng bỏ nhầm khung của màn 60 Hz
+  let last = -Infinity;
+  return {
+    ready(ms) {
+      if (!Number.isFinite(ms)) return true;
+      const gap = ms - last;
+      if (gap < step - slack) return false;
+      // Tụt lại xa (tab vừa hiện lại, máy chậm): bám lại thời điểm hiện tại, không vẽ dồn để đuổi kịp.
+      last = gap > 2 * step ? ms : last + step;
+      return true;
+    },
+  };
+}
```

```diff
diff --git a/src/engine/flags.js b/src/engine/flags.js
index bbf976a..a01b950 100644
--- a/src/engine/flags.js
+++ b/src/engine/flags.js
@@ -1,9 +1,12 @@
-// engine/flags.js — đọc cờ URL (?static, ?webgl, ?force3d, ?debug, ?at, ?freeze, ?poster) thành một object thuần.
+// engine/flags.js — đọc cờ URL (?static, ?webgl, ?force3d, ?debug, ?at, ?freeze, ?poster, ?level) thành một object thuần.
 
 // ?at chỉ nhận dạng ISO 8601: "2026-09-28T21:00", có thể thêm ":ss" và một offset ("Z", "+07:00", "-05:00").
 // Dạng khác (ví dụ "09/28/2026") bị V8 đọc theo múi giờ của MÁY, nên bị loại: ?at phải cho cùng kết quả ở mọi nơi.
 const AT = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)(Z|[+-]\d{2}:\d{2})?$/;
 const OFF = ['0', 'false'];
+// Cùng ba mức với engine/quality.js#LEVELS (test giữ cho khớp). Không import từ đó: file này nằm trên đường nhẹ
+// của poster, còn quality.js mang cả bộ điều chỉnh mà chỉ tầng 3D mới cần.
+const LEVELS = ['cao', 'vua', 'thap'];
 
 /**
  * Đọc giá trị của ?at thành Date.
@@ -25,7 +28,7 @@ export function parseAt(value) {
  * Cờ bật khi có mặt: ?webgl hay ?webgl=1 đều bật; ?webgl=0 hoặc ?webgl=false thì tắt.
  * @param {string} [search]  location.search, ví dụ '?webgl&at=2026-09-28T21:00'
  * @returns {{ static: boolean, webgl: boolean, force3d: boolean, debug: false | true | 'stats',
- *   at: Date | null, freeze: false | true | number, poster: boolean }}
+ *   at: Date | null, freeze: false | true | number, poster: boolean, level: 'cao' | 'vua' | 'thap' | null }}
  */
 export function readFlags(search = '') {
   const q = new URLSearchParams(search);
@@ -42,5 +45,11 @@ export function readFlags(search = '') {
     console.warn(`?at="${q.get('at')}" không hợp lệ nên dùng giờ thật. Ví dụ đúng: ?at=2026-09-28T21:00`);
   }
 
-  return { static: on('static'), webgl: on('webgl'), force3d: on('force3d'), debug, at, freeze, poster: on('poster') };
+  // ?level=thap: ép mức chất lượng thay cho bảng tầng × máy (xem mức thấp ngay trên máy tính; e2e dùng).
+  const level = LEVELS.includes(q.get('level')) ? q.get('level') : null;
+  if (debug && q.has('level') && level === null) {
+    console.warn(`?level="${q.get('level')}" không hợp lệ nên bỏ qua. Dùng một trong: ${LEVELS.join(', ')}`);
+  }
+
+  return { static: on('static'), webgl: on('webgl'), force3d: on('force3d'), debug, at, freeze, poster: on('poster'), level };
 }
```

- [ ] **Step 3: Thay `src/engine/gpu/scene.js`**

```js
// engine/gpu/scene.js — dựng MỘT cảnh trên một sân khấu: ctx → setup → lớp → pipeline → thang nấc → input → bàn thợ; và hàm vẽ một khung.
import { FRAME_BUDGET_MS, budgetFor, createTuner, isMobile, pickLevel } from '../quality.js';
import { createCtx, buildLayers, ensureEmissive } from './layers.js';
import { createPipeline } from './pipeline.js';
import { createLadder } from './ladder.js';
import { createStudio } from './studio.js';
import { createInput } from './input.js';

/**
 * Bộ điều chỉnh của một cảnh: bộ quyết định (tuner, hàm thuần) + thang nấc (ladder, chạm GPU).
 * tuner = null khi ?freeze: ảnh phải tất định, chỉ hạ/nâng tay (__sma) được.
 */
function createQuality({ level, ladder, tuner }) {
  const listeners = new Set();
  let guarding = false;
  const state = () => ({ level, steps: ladder.ids(), guarding, capped: tuner?.state().capped ?? false });
  const changed = () => {
    for (const cb of listeners) cb(state());
  };
  const act = (action) => {
    let done = true;
    if (action === 'down') done = ladder.down();
    else if (action === 'up') done = ladder.up();
    else ladder.reset();
    if (done) changed();
    return done;
  };
  return {
    state,
    degrade: () => act('down'),
    upgrade: () => act('up'),
    /** Mỗi khung, trước khi vẽ: bộ quyết định nói hạ / nâng / trả lại hết thì áp ngay. */
    sample(ms) {
      const action = tuner?.sample(ms, ladder);
      if (action) act(action);
    },
    /**
     * Thanh lớp mở: người xem cố ý làm chậm để học (tắt instancing, nhiều đom đóm), nên bộ điều chỉnh chỉ CANH:
     * chậm vừa phải thì để yên cho số đo trung thực, quá tải nặng thì vẫn hạ để máy không bị ép quá sức.
     */
    guard(on) {
      guarding = on;
      tuner?.guard(on);
      changed();
    },
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

/**
 * run.js gọi hàm này một lần khi mở trang, và thêm một lần nữa nếu người xem bấm "Dựng lại cảnh" sau khi mất GPU.
 * Mọi thứ tạo ra đều đăng ký vào `disposer` theo thứ tự tạo (setup → lớp → pipeline → input), nên gỡ được ngược lại.
 * Nếu setup/createLayer ném lỗi, buildLayers đã gỡ các lớp dựng dở; lỗi đi tiếp lên run.js.
 *
 * @param {object} p
 * @param {Awaited<ReturnType<import('./stage.js').createStage>>} p.stage
 * @param {ReturnType<import('./disposer.js').createDisposer>} p.disposer
 * @param {import('../contracts/runtime.js').Painting} p.painting
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {{ debug?: any, freeze?: boolean | number, level?: 'cao'|'vua'|'thap'|null }} p.flags
 * @param {Date} p.now
 * @param {boolean} p.reducedMotion
 * @param {Window} p.win
 */
export function buildScene({ stage, disposer, painting, meta, flags, now, reducedMotion, win }) {
  stage.useCamera(painting.camera);
  const mobile = isMobile(win.navigator);
  // Mức chọn theo backend THẬT (three có thể đã lùi WebGPU → WebGL2); ?level ép một mức khác (xem mức thấp trên máy tính).
  const level = flags.level ?? pickLevel({ tier: stage.backend, mobile });
  const budget = budgetFor(level, painting.quality);
  stage.setDpr(budget.dpr);

  const { ctx, weights, env } = createCtx({ meta, stage, level, budget, mobile, reducedMotion, now, debug: Boolean(flags.debug) });
  // setup() của bức chạy TRƯỚC mọi createLayer; không có setup thì các lớp dùng chung một object {}.
  const setup = painting.setup?.(ctx);
  if (setup?.dispose) disposer.add(() => setup.dispose());
  const shared = setup?.shared ?? {};
  const layers = buildLayers(painting.layers, ctx, shared, env);
  for (const { layer } of layers) disposer.add(() => layer.dispose());
  // Lưới an toàn của luật 8: material nào thiếu emissiveNode thì gán vec3(0) trước khi biên dịch.
  ensureEmissive(stage.scene, {
    warn: (name) => ctx.debug && console.warn(`Material "${name}" thiếu emissiveNode; xưởng gán vec3(0).`),
  });
  const pipeline = createPipeline({ renderer: stage.renderer, scene: stage.scene, camera: stage.camera, layers, weight: ctx.weight });
  disposer.add(() => pipeline.dispose());
  // Thang nấc dựng SAU pipeline: nấc của lớp dùng chung (bloom) chạm vào node mà pipeline vừa dựng.
  const ladder = createLadder({ ladder: painting.quality?.ladder, layers, stage, dpr: budget.dpr });
  const tuner = flags.freeze ? null : createTuner({ budgetMs: mobile ? FRAME_BUDGET_MS.mobile : FRAME_BUDGET_MS.desktop });
  const quality = createQuality({ level, ladder, tuner });

  // Con trỏ → cử chỉ (hàng đợi, xử lý đầu mỗi khung). Kéo là của camera; công cụ học (GĐ 4) nhận trước bức.
  const input = createInput({ canvas: stage.renderer.domElement, camera: stage.camera, controls: stage.controls, pointer: stage.u.pointer, win });
  disposer.add(() => input.dispose());

  // Vòng lặp đã dừng ở khung N của ?freeze=N: thay đổi từ Sổ tay hay __sma thì vẽ lại đúng khung đó (không tiến đồng hồ).
  // Vẽ lại ở nhịp requestAnimationFrame KẾ TIẾP, gộp mọi thay đổi trong cùng nhịp làm một: scene pass và reflector
  // của three chỉ vẽ lại cảnh một lần mỗi frameId, mà frameId chỉ tăng ở mỗi nhịp rAF của renderer. Vẽ lại hai lần
  // trong cùng một nhịp thì lần sau dùng lại ảnh cảnh cũ. Vẽ hỏng thì Promise hỏng theo (không treo mãi):
  // Sổ tay báo lỗi và mở khóa nút, __sma.setWeight trả lỗi cho người gọi.
  let frozen = false;
  let pending = null;
  const redraw = () => {
    if (!frozen || disposer.closed) return Promise.resolve();
    pending ??= new Promise((resolve, reject) => {
      win.requestAnimationFrame(() => {
        pending = null;
        try {
          if (!disposer.closed) pipeline.render();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
    return pending;
  };
  const studio = createStudio({
    meta,
    layers,
    weights,
    env, // trần của núm theo tầng và theo mức (knob-set.js#knobMax)
    tweenSeconds: reducedMotion ? 0 : undefined, // giảm chuyển động: lớp bật/tắt ngay, không mờ dần
    redraw,
    quality,
  });

  return {
    level,
    studio,
    input,
    quality,
    /** Biên dịch trước với đúng render target + MRT của pass, trong lúc poster còn hiện. */
    compile: () => pipeline.compile(),
    /** Một khung: nấc → đồng hồ → cử chỉ → setup.update → layer.update → tween trọng số → camera → render → số đo. */
    step(ms) {
      const start = win.performance.now();
      quality.sample(ms ?? start);
      const { t, dt } = stage.tick(ms);
      for (const g of input.drain()) setup?.onGesture?.(g);
      setup?.update?.(dt, t);
      for (const { layer } of layers) layer.update?.(dt, t);
      weights.step(dt);
      stage.breathe(t);
      stage.controls?.update();
      pipeline.render();
      const end = win.performance.now();
      studio.measure(stage.renderer.info, end, end - start); // ms CPU: luồng chính bận bao lâu cho khung này
    },
    /** run.js gọi khi vòng lặp dừng ở khung N của ?freeze=N. */
    freeze() {
      frozen = true;
    },
  };
}
```

- [ ] **Step 4: `run.js` (canh khi thanh lớp mở, huy hiệu, `__sma`, chặn khung) và chú thích của `sma.js`**

```diff
diff --git a/src/engine/gpu/run.js b/src/engine/gpu/run.js
index e3bf399..8ee254a 100644
--- a/src/engine/gpu/run.js
+++ b/src/engine/gpu/run.js
@@ -6,6 +6,7 @@ import { createDisposer } from './disposer.js';
 import { buildScene } from './scene.js';
 import { createFailCounter, createBurstCounter } from './guards.js';
 import { openDebug } from './debug.js';
+import { createFrameCap } from './clock.js';
 import { mountWorkshop } from '../../ui/workshop.js';
 
 /** Hạn cho một lần "Dựng lại cảnh" (lần mở trang đã có hạn 10 s của boot.js). */
@@ -43,6 +44,7 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
   const { meta } = entry;
   let disposer = createDisposer(); // của lần dựng hiện tại; "Dựng lại cảnh" thay bằng một cái mới
   let studio = null; // bàn thợ của cảnh đang live (null khi chưa live, hoặc đang mất GPU)
+  let quality = null; // bộ điều chỉnh của cảnh đang live: chỉ canh quá tải nặng khi thanh lớp mở
   let workshop = null; // thanh lớp + Sổ tay: tạo một lần, sống qua các lần dựng lại
   let losses = 0;
   let failed = false;
@@ -79,13 +81,16 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
   let painting = null;
   let content = null;
 
-  // Lời mời "{n} lớp — mài thử?" là một nút: bấm vào thì vào chế độ mài (mọi lớp trừ Cốt mờ về 0).
-  // Đóng thanh lớp thì lời mời quay lại, để người xem mở lại được lúc nào cũng được.
+  // Lời mời "{n} lớp — mài thử?" là nút vào chế độ mài; đóng thanh lớp thì lời mời quay lại (mở lại lúc nào cũng được).
+  // Thanh lớp mở = người xem đang học, có khi cố ý làm chậm cảnh: bộ điều chỉnh chỉ canh quá tải nặng tới khi đóng.
+  const onClose = () => {
+    quality?.guard(false);
+    shell.invite(openWorkshop);
+  };
   const openWorkshop = () => {
-    workshop ??= mountWorkshop(win.document, {
-      meta, content, t, studio: () => studio, onClose: () => shell.invite(openWorkshop),
-    });
+    workshop ??= mountWorkshop(win.document, { meta, content, t, studio: () => studio, onClose });
     workshop.open({ grind: true });
+    quality?.guard(true);
   };
 
   /** Mất GPU trước khi live, hoặc lần thứ hai: tầng tĩnh. Lần đầu sau khi live: poster + nút "Dựng lại cảnh". */
@@ -150,15 +155,24 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     shell.setState('live');
     shell.showBadge({ tier: stage.backend, level: scene.level });
     studio = scene.studio;
+    quality = scene.quality;
     d.add(() => {
       studio = null;
+      quality = null;
     });
-    // DevTools: __sma.setWeight('<id lớp>', 0) mài một lớp; e2e dùng để so ảnh ở cùng một khung.
+    // Nấc đổi → huy hiệu ghi "hạ {n} nấc". Dựng lại cảnh lúc thanh lớp đang mở thì bộ điều chỉnh mới cũng chỉ canh.
+    d.add(scene.quality.onChange((q) => shell.showBadge({ tier: stage.backend, level: q.level, steps: q.steps.length })));
+    if (workshop?.isOpen) scene.quality.guard(true);
+    // DevTools: __sma.setWeight('<id lớp>', 0) mài một lớp, __sma.degrade() hạ một nấc; e2e so ảnh ở cùng một khung.
     d.add(sma.expose({
       layers: () => studio?.layers().map(({ id, name }) => ({ id, name, weight: studio.weight(id).value })) ?? [],
       setWeight: (id, v) => studio?.setWeight(id, v),
       snapshot: () => studio?.snapshot() ?? null,
       restore: (s) => studio?.restore(s),
+      quality: () => studio?.quality() ?? null,
+      degrade: () => studio?.degrade(),
+      upgrade: () => studio?.upgrade(),
+      stats: () => studio?.stats() ?? null,
     }));
     // Gợi ý của bức ("Chạm vào…") chỉ lúc mở trang; lần chạm đầu tiên đổi thành lời mời mài lớp.
     if (!snapshot && content?.hint) shell.showHint(content.hint);
@@ -177,8 +191,9 @@ export async function run(entry, shell, { tier, flags, now, lang, t, sma, onFail
     });
 
     const frameErrors = createFailCounter({ limit: 3 });
+    const cap = createFrameCap(); // màn 90/120/144 Hz: tối đa 60 khung/giây, GPU không phải vẽ gấp đôi
     const loop = (ms) => {
-      if (failed || d.closed) return;
+      if (failed || d.closed || !cap.ready(ms)) return;
       try {
         frame(ms);
         frameErrors.ok();
```

```diff
diff --git a/src/engine/sma.js b/src/engine/sma.js
index becb744..eaca1ab 100644
--- a/src/engine/sma.js
+++ b/src/engine/sma.js
@@ -7,6 +7,8 @@
  *
  * GĐ 2: khi cảnh đã live, `expose()` gắn thêm các hàm của bàn thợ: `layers()`, `setWeight(id, v)`,
  * `snapshot()`, `restore(s)`. Mở DevTools gõ `__sma.setWeight('<id lớp>', 0)` là mài được một lớp.
+ * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
+ * (draw call, tam giác, ms mỗi khung, ms CPU).
  *
  * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
  * @param {Window | Record<string, any>} win
```

Run: `npx vitest run tests/unit/clock.test.js tests/unit/flags.test.js tests/unit/scene.test.js`
Kết quả mong đợi: PASS. Test "?freeze" cho thấy khi không có bộ điều chỉnh, hạ và nâng tay vẫn vẽ lại đúng khung đứng yên: `degrade()` chờ một microtask rồi mới xin nhịp rAF, nên test đợi một vòng trước khi chạy nhịp rAF giả.

- [ ] **Step 5: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  536 passed`. `run.js` dài đúng 250 dòng.

```bash
git add src/engine/gpu/scene.js src/engine/gpu/run.js src/engine/gpu/clock.js src/engine/flags.js src/engine/sma.js tests/unit/scene.test.js tests/unit/clock.test.js tests/unit/flags.test.js
git commit -F - <<'EOF'
feat(gpu): cảnh có bộ điều chỉnh (tắt khi ?freeze, chỉ canh quá tải nặng khi thanh lớp mở), trần 60 khung/giây, ms CPU mỗi khung; ?level ép mức; __sma.quality/degrade/upgrade/stats

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 7: Giao diện: huy hiệu "hạ n nấc", hai cột so sánh, ms CPU, "Lớp này đang tắt"

**Mục tiêu:** Spec §4.1 (GĐ 3).
- **Huy hiệu** ghi "WebGPU · cao · hạ 2 nấc" khi đang hạ, có `data-steps` cho e2e đọc; lời giải thích nói máy đang bớt chi tiết để giữ nhịp.
- **Tab Phá:**
  - số đo của xưởng thêm "Mili giây CPU mỗi khung";
  - thí nghiệm kiểu `compare` có hai hàng "Tắt / Bật" ngay dưới nút (`compareBars`), mỗi hàng hai vạch (ms khung màu vàng lá, ms CPU màu bạc lá) và số viết ra, đổi 4 lần mỗi giây;
  - lớp ở trọng số 0 (chế độ mài) thì nhắc "Lớp này đang tắt…" (Review Focus #4). Dòng nhắc là vùng `aria-live`: luôn có mặt, trống thì CSS thu lề lại (không `display: none`, không `hidden`).

**Files:**
- Modify: `src/ui/badge.js`, `src/ui/notebook.js`, `src/ui/notebook-pages.js`, `src/ui/strings.vi.js`, `src/styles/notebook.css`
- Test: `tests/unit/badge.test.js`, `tests/unit/workshop.test.js`

**Interfaces:**
- Consumes: studio `compare()`, `stats().cpuMs`, `weight(id).target` (Task 5).
- Produces:
  - `renderBadge(el, { tier, level, steps = 0 }, t)` (+ `data-steps`); `compareBars(doc, { t }) → { el, update(data) }`;
  - chữ mới trong `strings.vi.js`: `badge.steps(n)`, `badge.stepsExplain(n)`, `notebook.readouts.cpuMs`, `notebook.compare.{off,on,empty,value}`, `notebook.layerOff`.

- [ ] **Step 1: Test (hỏng)**

Áp vào `tests/unit/badge.test.js`:
```diff
diff --git a/tests/unit/badge.test.js b/tests/unit/badge.test.js
index f8f6aa3..4368ac8 100644
--- a/tests/unit/badge.test.js
+++ b/tests/unit/badge.test.js
@@ -28,6 +28,17 @@ describe('renderBadge', () => {
     expect(el.title).toBe(t.badge.explain.static);
   });
 
+  it('bộ điều chỉnh đang hạ nấc: ghi thêm "hạ n nấc", data-steps, lời giải thích nói vì sao', () => {
+    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 2 }, t);
+    expect(el.textContent).toBe('WebGPU · cao · hạ 2 nấc');
+    expect(el.dataset.steps).toBe('2');
+    expect(el.title).toBe(`${t.badge.explain.webgpu} ${t.badge.stepsExplain(2)}`);
+    renderBadge(el, { tier: 'webgpu', level: 'cao', steps: 0 }, t);
+    expect(el.textContent).toBe('WebGPU · cao');
+    expect(el.dataset.steps).toBe('0');
+    expect(el.title).toBe(t.badge.explain.webgpu);
+  });
+
   it('vẽ lại thì thay hẳn chữ cũ, không cộng dồn', () => {
     renderBadge(el, { tier: 'webgpu', level: 'cao' }, t);
     expect(el.textContent).toBe('WebGPU · cao');
```

Áp vào `tests/unit/workshop.test.js`:
```diff
diff --git a/tests/unit/workshop.test.js b/tests/unit/workshop.test.js
index 2014d64..0341f0c 100644
--- a/tests/unit/workshop.test.js
+++ b/tests/unit/workshop.test.js
@@ -21,7 +21,10 @@ const content = {
       learned: ['Fresnel'],
       readMore: [],
       knobs: {},
-      experiments: { pha: { label: 'Phá thử', explain: 'Xem chuyện gì xảy ra.' } },
+      experiments: {
+        pha: { label: 'Phá thử', explain: 'Xem chuyện gì xảy ra.' },
+        so: { label: 'So sánh', explain: 'Đo lúc tắt và lúc bật.' },
+      },
       readouts: { dinh: 'Số đỉnh' },
     },
   },
@@ -35,7 +38,7 @@ function fakeStudio() {
     calls: [],
     layers: () => [
       { id: 'cot', knobs: [{ id: 'size', kind: 'number', via: 'uniform', min: 0, max: 1, step: 0.1 }], experiments: [], readouts: [] },
-      { id: 'hai', knobs: [], experiments: [{ id: 'pha', kind: 'toggle' }], readouts: [{ id: 'dinh', unit: '' }] },
+      { id: 'hai', knobs: [], experiments: [{ id: 'pha', kind: 'toggle' }, { id: 'so', kind: 'compare' }], readouts: [{ id: 'dinh', unit: '' }] },
       { id: 'ba', knobs: [], experiments: [], readouts: [] },
     ],
     weight: (id) => ({ value: weights[id], target: weights[id] }),
@@ -48,7 +51,8 @@ function fakeStudio() {
     experiment: (layerId, id) => on.has(`${layerId}.${id}`),
     toggleExperiment: vi.fn(async (layerId, id, value) => (value ? on.add(`${layerId}.${id}`) : on.delete(`${layerId}.${id}`))),
     readouts: () => [{ id: 'dinh', value: 1234, unit: '' }],
-    stats: () => ({ drawCalls: 21, triangles: 90000, ms: 16.66 }),
+    stats: () => ({ drawCalls: 21, triangles: 90000, ms: 16.66, cpuMs: 3.21 }),
+    compare: (layerId, id) => (id === 'so' ? { off: { ms: 16.7, cpuMs: 2 }, on: { ms: 33.4, cpuMs: 9.5 } } : { off: null, on: null }),
   };
 }
 
@@ -265,6 +269,40 @@ describe('Sổ tay', () => {
     expect(read('lop:dinh')).toBe('1.234');
     expect(read('drawCalls')).toBe('21');
     expect(read('ms')).toBe('16,7');
+    expect(read('cpuMs')).toBe('3,2');
+    workshop.dispose();
+  });
+
+  it('Phá: lớp đang tắt (chế độ mài) thì nhắc bật lớp lên; phủ lớp rồi thì dòng nhắc trống', () => {
+    vi.useFakeTimers();
+    const studio = fakeStudio();
+    const { workshop, rail, notebook } = mount(studio);
+    workshop.open({ grind: true }); // mọi lớp trừ Cốt về 0
+    rail.querySelector('[data-layer="hai"] .rail-name').click();
+    notebook.querySelector('[data-tab="pha"]').click();
+    const hint = notebook.querySelector('.nb-off');
+    expect(hint.textContent).toBe(t.notebook.layerOff);
+    studio.setWeight('hai', 1);
+    vi.advanceTimersByTime(300);
+    expect(hint.textContent).toBe('');
+    workshop.dispose();
+  });
+
+  it('Phá: thí nghiệm so sánh có hai cột "Tắt / Bật" ngay dưới nút (ms khung và ms CPU); thí nghiệm thường thì không', () => {
+    vi.useFakeTimers();
+    const { workshop, rail, notebook } = mount(fakeStudio());
+    workshop.open();
+    rail.querySelector('[data-layer="hai"] .rail-name').click();
+    notebook.querySelector('[data-tab="pha"]').click();
+    const bars = notebook.querySelectorAll('[data-compare]');
+    expect(bars).toHaveLength(1);
+    expect(bars[0].previousElementSibling.dataset.experiment).toBe('so');
+    const row = (side) => bars[0].querySelector(`[data-side="${side}"]`);
+    expect(row('off').textContent).toBe(`${t.notebook.compare.off}khung 16,7 ms · CPU 2 ms`);
+    expect(row('on').querySelector('.nb-compare-value').textContent).toBe('khung 33,4 ms · CPU 9,5 ms');
+    const [frame, cpu] = row('off').querySelectorAll('.nb-bars i');
+    expect([frame.style.width, cpu.style.width]).toEqual(['50%', `${(2 / 9.5) * 100}%`]);
+    expect(row('on').querySelector('.nb-bars').getAttribute('aria-hidden')).toBe('true');
     workshop.dispose();
   });
 
```

Run: `npx vitest run tests/unit/badge.test.js tests/unit/workshop.test.js`
Kết quả mong đợi: FAIL, 4 test hỏng; lỗi đầu tiên: `AssertionError: expected 'WebGPU · cao' to be 'WebGPU · cao · hạ 2 nấc' // Object.is equality`.

- [ ] **Step 2: Chữ giao diện (`src/ui/strings.vi.js`) và huy hiệu (`src/ui/badge.js`)**

```diff
diff --git a/src/ui/strings.vi.js b/src/ui/strings.vi.js
index 8a58a2f..b294d14 100644
--- a/src/ui/strings.vi.js
+++ b/src/ui/strings.vi.js
@@ -47,6 +47,10 @@ const t = {
       static: 'Bạn đang xem bản tranh tĩnh: poster, thơ và con dấu, không cần GPU. '
         + 'Cảnh 3D chỉ chạy khi trình duyệt dùng được WebGPU hoặc WebGL2.',
     },
+    /** Bộ điều chỉnh chất lượng đang hạ n nấc (GĐ 3). */
+    steps: (n) => `hạ ${n} nấc`,
+    stepsExplain: (n) => `Máy đang bớt ${n} nấc chi tiết (độ nét, phản chiếu, bloom…) để hình không giật; `
+      + 'khi máy rảnh hơn, chi tiết tự trở lại.',
   },
   static: {
     noGpu: 'Máy này chưa vẽ được cảnh 3D, thường là vì trình duyệt đang tắt tăng tốc phần cứng. '
@@ -92,8 +96,21 @@ const t = {
     noExperiments: 'Lớp này chưa có thí nghiệm.',
     knobsStatic: 'Núm chỉ chạy khi có cảnh 3D. Code thì đọc được ngay.',
     experimentsStatic: 'Thử phá cần cảnh 3D.',
+    layerOff: 'Lớp này đang tắt: bật nó trên thanh lớp thì thí nghiệm và số đo mới có ý nghĩa.',
     measure: 'Số đo trực tiếp',
-    readouts: { drawCalls: 'Draw call mỗi khung', triangles: 'Tam giác mỗi khung', ms: 'Mili giây mỗi khung' },
+    readouts: {
+      drawCalls: 'Draw call mỗi khung',
+      triangles: 'Tam giác mỗi khung',
+      ms: 'Mili giây mỗi khung',
+      cpuMs: 'Mili giây CPU mỗi khung',
+    },
+    /** Hai cột "Tắt / Bật" của thí nghiệm so sánh (GĐ 3). */
+    compare: {
+      off: 'Tắt',
+      on: 'Bật',
+      empty: 'chưa đo',
+      value: (ms, cpu) => `khung ${ms} ms · CPU ${cpu} ms`,
+    },
     /** Nút mở Sổ tay ở tầng tĩnh (chỉ đọc). */
     openStatic: (n) => `Xem ${n} lớp của bức tranh`,
   },
```

```diff
diff --git a/src/ui/badge.js b/src/ui/badge.js
index e10c291..e633400 100644
--- a/src/ui/badge.js
+++ b/src/ui/badge.js
@@ -1,17 +1,19 @@
-// ui/badge.js — huy hiệu tầng: WebGPU / WebGL2 / Tranh tĩnh kèm mức chất lượng, có data-backend cho test đọc
+// ui/badge.js — huy hiệu tầng: WebGPU / WebGL2 / Tranh tĩnh kèm mức chất lượng và số nấc đang hạ; data-backend, data-steps cho test đọc
 
 /**
  * Vẽ huy hiệu vào nút [data-badge]. Huy hiệu ghi backend THẬT (run.js đọc sau renderer.init()),
  * vì three có thể lặng lẽ lùi từ WebGPU về WebGL2. `data-backend` là thứ e2e kiểm; chữ hiển thị
  * thì có thể đổi theo ngôn ngữ nên test không dựa vào chữ.
+ * Bộ điều chỉnh đang hạ nấc (GĐ 3) thì ghi thêm "hạ {n} nấc", và lời giải thích nói máy đang bớt chi tiết để giữ nhịp.
  * @param {HTMLElement} el
- * @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: 'cao' | 'vua' | 'thap' | null }} info
+ * @param {{ tier: 'webgpu' | 'webgl2' | 'static', level?: 'cao' | 'vua' | 'thap' | null, steps?: number }} info
  * @param {Record<string, any>} t  chữ giao diện của trang (strings.<lang>.js)
  */
-export function renderBadge(el, { tier, level }, t) {
-  const text = t.tierName[tier] + (level ? ` · ${t.levelName[level]}` : '');
-  const explain = t.badge.explain[tier];
+export function renderBadge(el, { tier, level, steps = 0 }, t) {
+  const text = t.tierName[tier] + (level ? ` · ${t.levelName[level]}` : '') + (steps > 0 ? ` · ${t.badge.steps(steps)}` : '');
+  const explain = t.badge.explain[tier] + (steps > 0 ? ` ${t.badge.stepsExplain(steps)}` : '');
   el.dataset.backend = tier;
+  el.dataset.steps = String(steps);
   el.textContent = text;
   el.title = explain; // chuột: rê vào là thấy; chạm: shell.js mở ô giải thích
   el.setAttribute('aria-label', `${text}. ${explain}`);
```

- [ ] **Step 3: Hai cột so sánh (`src/ui/notebook-pages.js`), tab Phá (`src/ui/notebook.js`), CSS**

```diff
diff --git a/src/ui/notebook-pages.js b/src/ui/notebook-pages.js
index 078a249..e7496fa 100644
--- a/src/ui/notebook-pages.js
+++ b/src/ui/notebook-pages.js
@@ -1,4 +1,4 @@
-// ui/notebook-pages.js — nội dung các trang của Sổ tay: Hiểu (thơ, chữ, sơ đồ, bạn vừa học, đọc thêm), thí nghiệm, số đo.
+// ui/notebook-pages.js — nội dung các trang của Sổ tay: Hiểu (thơ, chữ, sơ đồ, bạn vừa học, đọc thêm), thí nghiệm, số đo, cột so sánh.
 import { h } from './dom.js';
 
 /**
@@ -96,3 +96,39 @@ export function readoutList(doc, { rows, lang }) {
     },
   };
 }
+
+/**
+ * Hai cột "Tắt / Bật" của một thí nghiệm 'compare' (GĐ 3). Mỗi hàng có hai vạch: ms mỗi khung (vàng lá) và ms CPU
+ * (bạc lá), dài theo số lớn hơn của hai hàng; kèm số viết ra. Vạch chỉ để nhìn (aria-hidden), số là chữ để đọc.
+ * Máy mạnh thường thấy hai vạch ms khung bằng nhau: trình duyệt khóa ở nhịp màn hình. ms CPU thì không bị khóa.
+ * @param {Document} doc
+ * @param {{ t: Record<string, any> }} p
+ */
+export function compareBars(doc, { t }) {
+  const format = new Intl.NumberFormat(t.lang, { maximumFractionDigits: 1 });
+  const row = (side) => {
+    const frame = h(doc, 'i');
+    const cpu = h(doc, 'i');
+    const value = h(doc, 'span', { class: 'nb-compare-value', text: t.notebook.compare.empty });
+    const el = h(doc, 'div', { class: 'nb-compare-row', 'data-side': side },
+      h(doc, 'span', { text: t.notebook.compare[side] }),
+      h(doc, 'span', { class: 'nb-bars', 'aria-hidden': 'true' }, frame, cpu),
+      value);
+    return { el, frame, cpu, value };
+  };
+  const rows = { off: row('off'), on: row('on') };
+  return {
+    el: h(doc, 'div', { class: 'nb-compare', 'data-compare': '' }, rows.off.el, rows.on.el),
+    /** @param {{ off: { ms: number, cpuMs: number } | null, on: { ms: number, cpuMs: number } | null }} data */
+    update(data) {
+      const top = (key) => Math.max(data.off?.[key] ?? 0, data.on?.[key] ?? 0) || 1;
+      for (const side of ['off', 'on']) {
+        const { frame, cpu, value } = rows[side];
+        const v = data[side];
+        frame.style.width = v ? `${(v.ms / top('ms')) * 100}%` : '0%';
+        cpu.style.width = v ? `${(v.cpuMs / top('cpuMs')) * 100}%` : '0%';
+        value.textContent = v ? t.notebook.compare.value(format.format(v.ms), format.format(v.cpuMs)) : t.notebook.compare.empty;
+      }
+    },
+  };
+}
```

```diff
diff --git a/src/ui/notebook.js b/src/ui/notebook.js
index 65c4d27..bb90d64 100644
--- a/src/ui/notebook.js
+++ b/src/ui/notebook.js
@@ -1,7 +1,7 @@
 // ui/notebook.js — Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá (panel bên phải trên máy tính, tấm trượt dưới trên điện thoại).
 import { h } from './dom.js';
 import { createCodeView } from './code-view.js';
-import { understandPage, experimentList, readoutList } from './notebook-pages.js';
+import { understandPage, experimentList, readoutList, compareBars } from './notebook-pages.js';
 
 const TABS = ['hieu', 'chinh', 'pha'];
 const READOUT_MS = 250; // số đo đổi 4 lần mỗi giây: đủ đọc được, không làm nặng khung hình
@@ -45,6 +45,9 @@ export function createNotebook(doc, { meta, content, t, studio, loadKnobs = () =
   let pane = null; // Tweakpane của lớp đang mở (null: chưa dựng)
   let paneFor = null;
   let readouts = null;
+  let compares = new Map(); // id thí nghiệm 'compare' → hai cột "Tắt / Bật"
+  // "Lớp đang tắt": vùng aria-live nên luôn có mặt, trống khi lớp đang phủ (CSS thu lại khi :empty, không dùng hidden).
+  const off = h(doc, 'p', { class: 'nb-off', 'aria-live': 'polite' });
   let timer = null;
   let pending = 0;
 
@@ -127,6 +130,9 @@ export function createNotebook(doc, { meta, content, t, studio, loadKnobs = () =
     const values = { ...s.stats() };
     for (const r of s.readouts(layerId)) values[`lop:${r.id}`] = r.value;
     readouts.update(values);
+    for (const [expId, bars] of compares) bars.update(s.compare(layerId, expId));
+    // Lớp ở trọng số 0 (chế độ mài): thí nghiệm của nó không làm gì thấy được, số đo so sánh cũng vô nghĩa.
+    off.textContent = s.weight(layerId).target < 0.5 ? t.notebook.layerOff : '';
   };
   const stopTimer = () => {
     clearInterval(timer);
@@ -147,16 +153,23 @@ export function createNotebook(doc, { meta, content, t, studio, loadKnobs = () =
       onToggle: studio() ? (expId, on) => track(() => studio()?.toggleExperiment(id, expId, on)) : null,
     });
     readouts = null;
+    compares = new Map();
     if (!spec) {
       panels.pha.replaceChildren(list, h(doc, 'p', { class: 'nb-missing', text: t.notebook.experimentsStatic }));
       return;
     }
+    // Thí nghiệm so sánh: hai cột "Tắt / Bật" ngay dưới nút, cùng nhịp với số đo.
+    for (const { id: expId } of experiments.filter((e) => e.kind === 'compare')) {
+      const bars = compareBars(doc, { t });
+      list.querySelector(`[data-experiment="${expId}"]`).after(bars.el);
+      compares.set(expId, bars);
+    }
     const rows = [
       ...spec.readouts.map((r) => ({ id: `lop:${r.id}`, label: text?.readouts?.[r.id] ?? r.id, unit: r.unit })),
-      ...['drawCalls', 'triangles', 'ms'].map((id) => ({ id, label: t.notebook.readouts[id] })),
+      ...['drawCalls', 'triangles', 'ms', 'cpuMs'].map((id) => ({ id, label: t.notebook.readouts[id] })),
     ];
     readouts = readoutList(doc, { rows, lang: t.lang });
-    panels.pha.replaceChildren(list, h(doc, 'h3', { text: t.notebook.measure }), readouts.el);
+    panels.pha.replaceChildren(off, list, h(doc, 'h3', { text: t.notebook.measure }), readouts.el);
   };
 
   /** Chọn tab: đúng mẫu tab của ARIA (aria-selected, roving tabindex). Chỉnh → dựng núm; Phá → chạy số đo. */
```

```diff
diff --git a/src/styles/notebook.css b/src/styles/notebook.css
index bd6aace..97387a8 100644
--- a/src/styles/notebook.css
+++ b/src/styles/notebook.css
@@ -258,6 +258,16 @@ body:is([data-state='lost'], [data-state='loading'], [data-state='compiling'], [
 .nb-readouts dt { color: var(--bac-la); }
 .nb-readouts dd { margin: 0; font: 400 13px/1.5 var(--mono); text-align: right; color: var(--vang-la-sang); }
 
+/* Thí nghiệm so sánh (GĐ 3): hai hàng Tắt / Bật, mỗi hàng hai vạch (ms khung: vàng lá; ms CPU: bạc lá) và số. */
+.nb-compare { display: grid; gap: 4px; margin: 8px 0 0; font: 400 12px/1.4 var(--mono); }
+.nb-compare-row { display: grid; grid-template-columns: 2.5em minmax(40px, 1fr) auto; align-items: center; gap: 8px; color: var(--bac-la); }
+.nb-bars { display: grid; gap: 2px; }
+.nb-bars i { display: block; height: 4px; width: 0; border-radius: 2px; background: var(--vang-la); }
+.nb-bars i + i { background: var(--bac-la); }
+.nb-compare-value { color: var(--vang-la-sang); white-space: nowrap; }
+.nb-off { margin: 0 0 8px; font-size: 13px; line-height: 1.5; color: var(--vang-la); }
+.nb-off:empty { margin: 0; }
+
 /* ── Điện thoại: thanh lớp là dải ngang dưới đáy, Sổ tay là tấm trượt ngay trên nó ─── */
 @media (max-width: 640px) {
   .rail {
```

Run: `npx vitest run tests/unit/badge.test.js tests/unit/workshop.test.js tests/unit/shell.test.js`
Kết quả mong đợi: PASS.

- [ ] **Step 4: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  539 passed`.

```bash
git add src/ui/badge.js src/ui/notebook.js src/ui/notebook-pages.js src/ui/strings.vi.js src/styles/notebook.css tests/unit/badge.test.js tests/unit/workshop.test.js
git commit -F - <<'EOF'
feat(ui): huy hiệu "hạ n nấc" (data-steps), hai cột Tắt/Bật cho thí nghiệm so sánh, số đo ms CPU trong Sổ tay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 8: Phủ bóng: nấc `bloom` và số đo `bloomScale`

**Mục tiêu:** Spec §6 Lớp 6, §10. Nấc `bloom` nhân `resolutionScale` của bloom với 0,5 (gỡ thì nhân 2). `BloomNode` đọc số này và đặt lại cỡ render target mỗi khung (Phụ lục A.36), nên không biên dịch lại. Nấc áp được cả trước khi pipeline dựng bloom: lớp giữ số, dựng xong thì đặt. Số đo `bloomScale` cho tab Phá thấy nấc đang ở đâu. Chữ viết trung tính cho mọi bức.

**Files:**
- Modify: `src/engine/stock/phu-bong/layer.js`, `src/engine/stock/phu-bong/content.vi.js`
- Test: `tests/unit/phu-bong.test.js`

**Interfaces:**
- Consumes: `ctx.budget.bloom` (bảng của bức, Task 14; thiếu thì 0.5).
- Produces: `layer.degrade = [{ id: 'bloom', apply, revert }]`; `layer.readouts = [{ id: 'bloomScale' }]`; nhãn `readouts.bloomScale` trong content.

- [ ] **Step 1: Test (hỏng: lớp chưa có `degrade`)**

Áp vào `tests/unit/phu-bong.test.js`:
```diff
diff --git a/tests/unit/phu-bong.test.js b/tests/unit/phu-bong.test.js
index 8b25add..e924f6a 100644
--- a/tests/unit/phu-bong.test.js
+++ b/tests/unit/phu-bong.test.js
@@ -93,6 +93,21 @@ describe('engine/stock/phu-bong/layer.js', () => {
     layer.dispose();
   });
 
+  it("nấc 'bloom': chia đôi độ phân giải của bloom rồi trả lại; số đo đọc theo; áp được cả trước khi dựng pipeline", () => {
+    const { glow, layer } = buildOnce(makeCtx({ bloom: 0.5 }));
+    const [step] = layer.degrade;
+    const scale = () => layer.readouts.find((r) => r.id === 'bloomScale').get();
+    expect(step.id).toBe('bloom');
+    step.apply();
+    expect([glow.node.getResolutionScale(), scale()]).toEqual([0.25, 0.25]);
+    step.revert();
+    expect([glow.node.getResolutionScale(), scale()]).toEqual([0.5, 0.5]);
+    const early = phuBong.createLayer(makeCtx({ bloom: 0.25 }));
+    early.degrade[0].apply();
+    expect(early.readouts[0].get()).toBe(0.125);
+    layer.dispose();
+  });
+
   it('dispose gỡ bloom; gọi hai lần (hoặc trước build) vẫn an toàn', () => {
     expect(() => {
       const fresh = phuBong.createLayer(makeCtx());
```

Run: `npx vitest run tests/unit/phu-bong.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`.

- [ ] **Step 2: Nấc và số đo (`layer.js`), nhãn (`content.vi.js`)**

```diff
diff --git a/src/engine/stock/phu-bong/layer.js b/src/engine/stock/phu-bong/layer.js
index 0581dd6..4e32362 100644
--- a/src/engine/stock/phu-bong/layer.js
+++ b/src/engine/stock/phu-bong/layer.js
@@ -22,6 +22,13 @@ export const knobs = [
  */
 export function createLayer(ctx) {
   let glow = null;
+  // BloomNode mặc định chạy ở nửa độ phân giải (0.5); mức 'vừa'/'thấp' của bức có thể hạ xuống 0.25.
+  // Nấc 'bloom' của bộ điều chỉnh chia đôi tiếp. BloomNode đọc số này mỗi khung: không biên dịch lại.
+  let scale = ctx.budget.bloom ?? 0.5;
+  const setScale = (v) => {
+    scale = v;
+    glow?.setResolutionScale(v);
+  };
   // Thí nghiệm "Bloom cả khung": 0 = chỉ ảnh emissive tỏa (chọn lọc), 1 = cả ảnh màu tỏa.
   const whole = uniform(0).setName('phu_bong_whole');
 
@@ -36,8 +43,7 @@ export function createLayer(ctx) {
           ctx.knob('bloomRadius'), // @knob bloomRadius
           ctx.knob('bloomThreshold'), // @knob bloomThreshold
         );
-        // BloomNode mặc định chạy ở nửa độ phân giải (0.5); mức 'vừa'/'thấp' của bức có thể hạ xuống 0.25.
-        glow.setResolutionScale(ctx.budget.bloom ?? 0.5);
+        glow.setResolutionScale(scale);
         const exposure = ctx.knob('exposure');
         const tone = ctx.knob('toneMapping');
 
@@ -66,6 +72,9 @@ export function createLayer(ctx) {
         },
       },
     ],
+    readouts: [{ id: 'bloomScale', get: () => scale }],
+    // Nấc của bộ điều chỉnh (spec §10): ảnh bloom còn một nửa mỗi chiều, tức một phần tư số điểm ảnh phải làm nhòe.
+    degrade: [{ id: 'bloom', apply: () => setScale(scale * 0.5), revert: () => setScale(scale * 2) }],
     dispose() {
       glow?.dispose();
       glow = null;
```

```diff
diff --git a/src/engine/stock/phu-bong/content.vi.js b/src/engine/stock/phu-bong/content.vi.js
index ddfc417..f810c7b 100644
--- a/src/engine/stock/phu-bong/content.vi.js
+++ b/src/engine/stock/phu-bong/content.vi.js
@@ -41,6 +41,7 @@ export default {
             + 'đọng trên ống kính. Vì vậy bloom cần chọn lọc.',
         },
       },
+      readouts: { bloomScale: 'Độ phân giải bloom (so với màn hình)' },
     },
   },
 };
```

Run: `npx vitest run tests/unit/phu-bong.test.js tests/paintings`
Kết quả mong đợi: PASS. Test hợp đồng đòi nhãn cho mọi số đo, nên thiếu `readouts.bloomScale` là hỏng.

- [ ] **Step 3: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  540 passed`.

```bash
git add src/engine/stock/phu-bong/layer.js src/engine/stock/phu-bong/content.vi.js tests/unit/phu-bong.test.js
git commit -F - <<'EOF'
feat(phu-bong): nấc 'bloom' (độ phân giải bloom chia đôi, không biên dịch lại) và số đo bloomScale

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 9: Cốt và Ánh trăng: bóng tĩnh, khung bóng ôm sát, nấc `bong`; trăng không nhận sương

**Mục tiêu:** Spec §6 Lớp 2 (GĐ 3), gồm các mục hoãn của GĐ 2:
- **Shadow map tĩnh:** `autoUpdate = false`. `createShadowWatch().check()` chạy mỗi khung (rẻ: vài phép so sánh) và chỉ đặt `needsUpdate = true` khi có thứ đổi: hướng trăng, độ nở hoa (`shared.cot.openness`), bố cục của Cốt (`shared.cot.version`), hay cỡ map. Trước đây bóng vẽ lại mỗi khung, và vẽ HAI lần (Phụ lục A.17). Bias chỉ dùng lúc tra bóng nên không cần vẽ lại.
- **Khung chiếu bóng ôm sát vùng lá** (`fitShadowCamera`: 16 điểm trên vành đáy và vành đỉnh của khối trụ bán kính 54, cao 6, chiếu vào không gian của đèn): chiều dọc từ 110 còn dưới 32 đơn vị suốt đêm.
- **Nấc `bong`:** trần `mapSize` chia đôi, không dưới 256; hiệu lực = min(núm, trần). Mức thấp tắt bóng nên không có nấc này.
- **Trăng `fog = false`:** sương không phủ lên trăng.
- **Cốt công bố `openness`** (uniform của núm) và `version`. `version` tăng mỗi lần ghi lại hình, hay đổi thứ nằm trong cache key.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/anh-trang-shadow.js`
- Modify: `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `src/paintings/ao-sen-dem/layers/l1-cot.js`, `src/paintings/ao-sen-dem/parts/anh-trang-moon.js`, `src/paintings/ao-sen-dem/meta.js` (thêm file vào lớp Ánh trăng)
- Test: `tests/paintings/ao-sen-dem/anh-trang.test.js`, `tests/paintings/ao-sen-dem/cot.test.js`

**Interfaces:**
- Consumes: `shared.moon.dir` (setup của bức), `shared.cot` (lớp trước).
- Produces:
  - `shared.cot.openness`, `shared.cot.version` (getter);
  - trong `parts/anh-trang-shadow.js`: `LIGHT_DISTANCE = 150`, `SHADOW_BOX = { radius: 54, height: 6 }`, `fitShadowCamera(camera, dir, box?) → { width, height }`, `createShadowWatch({ shadow, dir, cot }) → { check(): boolean }`;
  - l2: `degrade = [{ id: 'bong' }]` (rỗng ở mức thấp).

- [ ] **Step 1: Test (hỏng: chưa có `anh-trang-shadow.js`)**

Áp vào `tests/paintings/ao-sen-dem/anh-trang.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/anh-trang.test.js b/tests/paintings/ao-sen-dem/anh-trang.test.js
index 6f26424..a18b893 100644
--- a/tests/paintings/ao-sen-dem/anh-trang.test.js
+++ b/tests/paintings/ao-sen-dem/anh-trang.test.js
@@ -1,9 +1,12 @@
 // tests/paintings/ao-sen-dem/anh-trang.test.js — Lớp 2 · Ánh trăng: trăng đúng pha, ánh trăng + bóng theo mức, sơn màu cho Cốt, hoa đăng.
 import { describe, it, expect } from 'vitest';
+import { OrthographicCamera, Vector3 } from 'three/webgpu';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import * as anhTrang from '../../../src/paintings/ao-sen-dem/layers/l2-anh-trang.js';
 import { MOON } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-moon.js';
+import { LIGHT_DISTANCE, SHADOW_BOX, fitShadowCamera } from '../../../src/paintings/ao-sen-dem/parts/anh-trang-shadow.js';
+import { moonDirection } from '../../../src/paintings/ao-sen-dem/shared.js';
 import { moonPhase } from '../../../src/lib/astro/moon.js';
 import { knobValue } from '../../../src/engine/gpu/knob-set.js';
 import { NOW, buildPainting } from '../../helpers/fake-ctx.js';
@@ -23,11 +26,12 @@ describe('l2-anh-trang', () => {
     expect(knobValue(phase, { now: NOW })).toBe(moonPhase(NOW).phase);
   });
 
-  it('trăng và đèn hoa đăng là objects của lớp; trăng có emissiveNode', () => {
+  it('trăng và đèn hoa đăng là objects của lớp; trăng có emissiveNode và không nhận sương', () => {
     const { ctx, layers } = build();
     const [moon, lantern] = layers['anh-trang'].objects;
     expect(moon.geometry.parameters.radius).toBe(MOON.radius);
     expect(moon.material.emissiveNode).toBeTruthy();
+    expect(moon.material.fog).toBe(false);
     expect(lantern.isInstancedMesh).toBe(true);
     expect(ctx.scene.children).toEqual(expect.arrayContaining([moon, lantern]));
     expect(lights(ctx.scene, 'isDirectionalLight')).toHaveLength(1);
@@ -98,6 +102,71 @@ describe('l2-anh-trang', () => {
     expect(build({ level: 'thap' }).layers['anh-trang'].readouts[0].get()).toBe(0); // mức thấp: tắt bóng
   });
 
+  it('khung bóng ôm sát vùng lá theo hướng trăng (thay ±55, tức 110 đơn vị): cả đêm, chiều dọc chỉ còn dưới 32', () => {
+    for (let hour = 18; hour <= 29.5; hour += 0.5) {
+      const camera = new OrthographicCamera();
+      const dir = new Vector3(...moonDirection(hour));
+      const { width, height } = fitShadowCamera(camera, dir);
+      expect(width, `${hour}h`).toBeLessThanOrEqual(2 * SHADOW_BOX.radius + 1e-6);
+      expect(height, `${hour}h`).toBeLessThan(32);
+      // Các điểm trên vành đáy và vành đỉnh của vùng lá nằm trong khung (camera nhìn từ trăng về tâm ao, như three làm).
+      camera.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);
+      camera.lookAt(0, 0, 0);
+      camera.updateMatrixWorld();
+      for (const [x, y, z] of [[-54, 0, 0], [54, 6, 0], [0, 6, 54], [0, 0, -54], [38, 6, -38], [-38, 0, 38]]) {
+        const p = new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
+        expect(p.x).toBeGreaterThanOrEqual(camera.left);
+        expect(p.x).toBeLessThanOrEqual(camera.right);
+        expect(p.y).toBeGreaterThanOrEqual(camera.bottom);
+        expect(p.y).toBeLessThanOrEqual(camera.top);
+        expect(-p.z).toBeGreaterThanOrEqual(camera.near);
+        expect(-p.z).toBeLessThanOrEqual(camera.far);
+      }
+    }
+  });
+
+  it('shadow map tĩnh: chỉ vẽ lại khi hướng trăng, độ nở hoa hay bố cục của Cốt đổi', () => {
+    const { ctx, shared, layers, knobs } = build();
+    const [sun] = lights(ctx.scene, 'isDirectionalLight');
+    const layer = layers['anh-trang'];
+    expect(sun.shadow.autoUpdate).toBe(false);
+    const frame = () => {
+      sun.shadow.needsUpdate = false; // như ShadowNode sau khi vẽ xong
+      layer.update(1 / 60, 1);
+      return sun.shadow.needsUpdate;
+    };
+    expect(frame()).toBe(true); // khung đầu: khớp khung bóng, vẽ một lần
+    expect(sun.shadow.camera.top - sun.shadow.camera.bottom).toBeLessThan(34);
+    expect(frame()).toBe(false); // không gì đổi: không vẽ lại
+    shared.cot.openness.value = 0.2;
+    expect(frame()).toBe(true);
+    knobs.cot.set('seed', 5);
+    expect(frame()).toBe(true);
+    shared.moon.dir.value.set(...moonDirection(26));
+    expect(frame()).toBe(true);
+    knobs['anh-trang'].set('shadowBias', -0.001); // bias chỉ dùng lúc tra bóng: không cần vẽ lại map
+    expect(frame()).toBe(false);
+    knobs['anh-trang'].set('shadowMapSize', 512);
+    expect(sun.shadow.needsUpdate).toBe(true);
+  });
+
+  it("nấc 'bong': trần cỡ map chia đôi (không dưới 256) rồi trả lại; hiệu lực = min(núm, trần); mức thấp không có nấc", () => {
+    const { ctx, layers, knobs } = build();
+    const [sun] = lights(ctx.scene, 'isDirectionalLight');
+    const [step] = layers['anh-trang'].degrade;
+    expect(step.id).toBe('bong');
+    step.apply();
+    expect(sun.shadow.mapSize.x).toBe(512);
+    knobs['anh-trang'].set('shadowMapSize', 2048); // người xem kéo núm lên: trần vẫn giữ
+    expect(sun.shadow.mapSize.x).toBe(512);
+    knobs['anh-trang'].set('shadowMapSize', 256); // núm dưới trần: theo núm
+    expect(sun.shadow.mapSize.x).toBe(256);
+    step.revert();
+    knobs['anh-trang'].set('shadowMapSize', 2048);
+    expect(sun.shadow.mapSize.x).toBe(2048);
+    expect(build({ level: 'thap' }).layers['anh-trang'].degrade).toEqual([]);
+  });
+
   it('Phá: "Bias = 0" rồi trả lại đúng bias của núm; "Tắt fresnel", "Đổi màu đèn" chỉ đổi uniform', () => {
     const { ctx, layers, knobs } = build();
     const layer = layers['anh-trang'];
```

Áp vào `tests/paintings/ao-sen-dem/cot.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/cot.test.js b/tests/paintings/ao-sen-dem/cot.test.js
index 8632eef..820a7ba 100644
--- a/tests/paintings/ao-sen-dem/cot.test.js
+++ b/tests/paintings/ao-sen-dem/cot.test.js
@@ -136,6 +136,16 @@ describe('l1-cot', () => {
 });
 
 describe('l1-cot · núm rebuild (GĐ 2): ghi lại InstancedMesh sẵn có, không tạo mesh mới', () => {
+  it('công bố độ nở hoa (uniform của núm) và số lần ghi lại hình (lớp Ánh trăng vẽ lại bóng khi số này đổi)', () => {
+    const { shared, knobs } = build();
+    expect(shared.cot.openness).toBe(knobs.cot.knob('openness'));
+    const v = shared.cot.version;
+    knobs.cot.set('leafCount', 900);
+    expect(shared.cot.version).toBe(v + 1);
+    knobs.cot.set('wireframe', true);
+    expect(shared.cot.version).toBe(v + 2);
+  });
+
   it('leafCount: đổi số lá, cùng các object cũ', () => {
     const { layers, knobs } = build();
     const before = [...layers.cot.objects];
```

Run: `npx vitest run tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/cot.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `Error: Cannot find module '…/src/paintings/ao-sen-dem/parts/anh-trang-shadow.js'`.

- [ ] **Step 2: Cốt công bố độ nở hoa và số lần ghi lại hình (`l1-cot.js`)**

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l1-cot.js b/src/paintings/ao-sen-dem/layers/l1-cot.js
index f246a6b..7c204f0 100644
--- a/src/paintings/ao-sen-dem/layers/l1-cot.js
+++ b/src/paintings/ao-sen-dem/layers/l1-cot.js
@@ -100,6 +100,7 @@ export function createLayer(ctx, shared) {
   hemi.position.set(-1, 2, 0.5); // trời hơi lệch trái: một bên lòng lá sáng hơn bên kia, đọc ra hình lõm
 
   const objects = [leaves, standingLeaves, petals, cores, stems, reeds]; // mảng SỐNG: thí nghiệm thêm/bớt tại chỗ
+  let version = 0; // tăng mỗi lần hình đổi: lớp Ánh trăng thấy số này đổi thì vẽ lại shadow map (bóng tĩnh, GĐ 3)
   let loose = null; // các Mesh rời của "Tắt instancing": tạo lần đầu bật, giữ tới khi gỡ lớp (bật/tắt chỉ hiện/giấu)
   let looseOn = false;
   const setLoose = (on) => {
@@ -120,6 +121,7 @@ export function createLayer(ctx, shared) {
     fillStems(stems, [...pond.flowers, ...pond.buds, ...pond.standing]);
     fillReeds(reeds, mulberry32(SEED + params.seed * 7919 + 3));
     if (looseOn) loose.sync();
+    version += 1;
   };
   const rebuild = (key) => (v) => {
     params[key] = v;
@@ -131,6 +133,7 @@ export function createLayer(ctx, shared) {
       m[prop] = v;
       m.needsUpdate = true;
     }
+    version += 1;
   };
   apply();
 
@@ -143,6 +146,10 @@ export function createLayer(ctx, shared) {
     stemMaterial,
     reedMaterial,
     petalGeometry,
+    openness: ctx.knob('openness'), // độ nở của hoa: hình cánh đổi thì bóng của hoa đổi
+    get version() {
+      return version;
+    },
     hemi,
     hemiIntensity: STUDIO.intensity,
     casters: [standingLeaves, petals, cores, stems], // thứ đứng trên mặt nước: đổ bóng lên lá nổi
```

- [ ] **Step 3: Tạo `src/paintings/ao-sen-dem/parts/anh-trang-shadow.js`**

```js
// paintings/ao-sen-dem/parts/anh-trang-shadow.js — của lớp Ánh trăng: khung chiếu bóng ôm sát ao theo hướng trăng; shadow map chỉ vẽ lại khi cần.
import { Matrix4, Vector3 } from 'three/webgpu';

/** Đèn trăng đứng cách tâm ao chừng này, theo hướng trăng. */
export const LIGHT_DISTANCE = 150;
/** Khối trụ chứa mọi thứ đổ bóng và nhận bóng: lá, hoa, cuống trong bán kính của vùng lá (có lề), cao tới đỉnh hoa, lá đứng. */
export const SHADOW_BOX = Object.freeze({ radius: 54, height: 6 });
const MARGIN = 1; // lề quanh khung (đơn vị cảnh): mép bóng không bị cắt, và bù phần đa giác 16 cạnh hụt so với vòng tròn
const RIM = 16; // số điểm lấy trên mỗi vành (đáy, đỉnh) của khối trụ

const _look = new Matrix4();
const _eye = new Vector3();
const _origin = new Vector3();
const _up = new Vector3(0, 1, 0);
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _d = new Vector3();

/**
 * Khung (orthographic) của camera bóng vừa khít khối trụ, nhìn từ `dir × LIGHT_DISTANCE` về tâm ao. Cùng phép nhìn mà three
 * dùng trong LightShadow.updateMatrices: camera ở vị trí đèn, lookAt target của đèn (tâm ao), up = +y.
 * Khung cố định ±55 của GĐ 2 phí phần lớn chiều dọc: trăng thấp (4°–13°) nên nhìn từ trăng, cả ao dẹt lại thành một dải.
 * Cùng cỡ shadow map, khung càng nhỏ thì mỗi điểm ảnh của bóng càng mịn.
 * @param {import('three/webgpu').OrthographicCamera} camera  moonlight.shadow.camera
 * @param {import('three/webgpu').Vector3} dir  hướng (đơn vị) từ tâm ao tới trăng
 * @param {{ radius: number, height: number }} [box]
 * @returns {{ width: number, height: number }}  cỡ khung (đơn vị cảnh), để test đọc
 */
export function fitShadowCamera(camera, dir, box = SHADOW_BOX) {
  _eye.copy(dir).multiplyScalar(LIGHT_DISTANCE);
  _look.lookAt(_eye, _origin, _up).extractBasis(_x, _y, _z); // ba trục của camera, trong không gian thế giới
  let [left, right, bottom, top, near, far] = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
  for (let i = 0; i < RIM; i++) {
    const a = (i / RIM) * Math.PI * 2;
    for (const y of [0, box.height]) {
      _d.set(Math.cos(a) * box.radius, y, Math.sin(a) * box.radius).sub(_eye);
      const u = _d.dot(_x);
      const v = _d.dot(_y);
      const depth = -_d.dot(_z); // camera nhìn về −z của chính nó
      [left, right, bottom, top] = [Math.min(left, u), Math.max(right, u), Math.min(bottom, v), Math.max(top, v)];
      [near, far] = [Math.min(near, depth), Math.max(far, depth)];
    }
  }
  Object.assign(camera, {
    left: left - MARGIN,
    right: right + MARGIN,
    bottom: bottom - MARGIN,
    top: top + MARGIN,
    near: Math.max(0.5, near - MARGIN),
    far: far + MARGIN,
  });
  camera.updateProjectionMatrix(); // three không tự tính lại ma trận chiếu của camera bóng
  return { width: right - left, height: top - bottom };
}

/**
 * Shadow map TĨNH: `autoUpdate = false`, chỉ vẽ lại khi có thứ đổi. check() chạy mỗi khung (rẻ: vài phép so sánh);
 * có gì khác lần trước thì khớp lại khung bóng và đặt `needsUpdate = true`, ShadowNode vẽ lại MỘT lần rồi tự tắt cờ.
 * Thứ nhận bóng (lá nổi nhấp nhô theo sóng) không cần vẽ lại: nó tự tra shadow map theo vị trí của mình.
 * @param {{ shadow: any, dir: any, cot: { openness: any, version: number } }} p
 *   shadow: moonlight.shadow; dir: uniform hướng trăng; cot: shared.cot (độ nở hoa, số lần Cốt ghi lại hình)
 */
export function createShadowWatch({ shadow, dir, cot }) {
  shadow.autoUpdate = false;
  const seen = { dir: new Vector3(Number.NaN, 0, 0), open: Number.NaN, version: -1 };
  return {
    check() {
      const d = dir.value;
      if (seen.dir.equals(d) && seen.open === cot.openness.value && seen.version === cot.version) return false;
      seen.dir.copy(d);
      seen.open = cot.openness.value;
      seen.version = cot.version;
      fitShadowCamera(shadow.camera, d);
      shadow.needsUpdate = true;
      return true;
    },
  };
}
```

- [ ] **Step 4: Ánh trăng dùng bóng tĩnh, có nấc `bong`; trăng không nhận sương; file mới vào meta**

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index 6a165f2..e4f0245 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -12,10 +12,12 @@ import { color, mix, uniform, uv, vec3 } from 'three/tsl';
 import { moonPhase } from '../../../lib/astro/moon.js';
 import { createMoon } from '../parts/anh-trang-moon.js';
 import { paintCot } from '../parts/anh-trang-paint.js';
+import { LIGHT_DISTANCE, createShadowWatch } from '../parts/anh-trang-shadow.js';
 
 export const id = 'anh-trang';
 
 const SHADOW = { cao: 1024, vua: 512, thap: 0 }; // cỡ shadow map theo mức; 0 = tắt bóng
+const SHADOW_FLOOR = 256; // nấc 'bong' chia đôi cỡ map nhưng không xuống dưới số này
 const BIAS = { bias: -0.0005, normal: 0.03 };
 
 export const knobs = [
@@ -88,20 +90,41 @@ export function createLayer(ctx, shared) {
 
   // MỘT shadow map, bật một lần lúc dựng theo mức (cao 1024 / vừa 512 / thấp tắt).
   // castShadow, receiveShadow, shadowMap.enabled nằm trong cache key: không bao giờ đổi lúc chạy.
-  // Cỡ map và bias thì đổi được: ShadowNode đọc chúng mỗi khung (setSize, reference), không biên dịch lại.
+  // Bias đổi được bất cứ lúc nào (ShadowNode đọc bằng reference() khi tra bóng). Shadow map thì TĨNH (GĐ 3): chỉ vẽ lại
+  // khi hướng trăng, độ nở hoa hay bố cục của Cốt đổi, hoặc khi cỡ map đổi (ShadowNode gọi setSize lúc vẽ lại).
   const shadowOn = (ctx.budget.shadow ?? SHADOW[ctx.level]) > 0;
   let bias = ctx.knobValue('shadowBias');
   let acne = false; // thí nghiệm "Bias = 0" đang bật
+  let size = ctx.knobValue('shadowMapSize'); // ý người xem (núm)
+  let cap = Infinity; // trần của máy (nấc 'bong' của bộ điều chỉnh); hiệu lực = min(núm, trần)
+  const applySize = () => {
+    const s = Math.min(size, cap);
+    moonlight.shadow.mapSize.set(s, s);
+    moonlight.shadow.needsUpdate = true;
+  };
+  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
+  const halveShadow = {
+    id: 'bong',
+    apply() {
+      before = cap;
+      cap = Math.max(SHADOW_FLOOR, Math.min(size, cap) / 2);
+      applySize();
+    },
+    revert() {
+      cap = before;
+      applySize();
+    },
+  };
+  let watch = null;
   if (shadowOn) {
-    const size = ctx.knobValue('shadowMapSize');
     ctx.renderer.shadowMap.enabled = true;
     moonlight.castShadow = true;
-    moonlight.shadow.mapSize.set(size, size);
-    Object.assign(moonlight.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 320 });
+    applySize();
     moonlight.shadow.bias = bias;
     moonlight.shadow.normalBias = BIAS.normal;
     for (const o of cot.casters) o.castShadow = true;
     for (const o of cot.receivers) o.receiveShadow = true;
+    watch = createShadowWatch({ shadow: moonlight.shadow, dir: shared.moon.dir, cot });
   }
 
   const lantern = createLantern(ctx, cot, w);
@@ -116,7 +139,8 @@ export function createLayer(ctx, shared) {
       const k = w.value;
       const dir = shared.moon.dir.value;
       moon.update(dir);
-      moonlight.position.copy(dir).multiplyScalar(150);
+      moonlight.position.copy(dir).multiplyScalar(LIGHT_DISTANCE);
+      watch?.check(); // có gì đổi thì khớp lại khung bóng và vẽ lại shadow map MỘT lần
       moonlight.intensity = MOONLIGHT * k;
       fill.intensity = SKY_FILL * k;
       // Đèn xưởng lui dần khi trăng lên: ở trọng số 1 chỉ còn ánh sáng của bức.
@@ -127,7 +151,10 @@ export function createLayer(ctx, shared) {
     },
     onKnob: {
       candleIntensity: (v) => { candleIntensity = v; }, // @knob candleIntensity
-      shadowMapSize: (v) => moonlight.shadow.mapSize.set(v, v), // @knob shadowMapSize
+      shadowMapSize: (v) => { // @knob shadowMapSize
+        size = v;
+        applySize();
+      },
       shadowBias: (v) => { // @knob shadowBias
         bias = v;
         if (!acne) moonlight.shadow.bias = v;
@@ -147,6 +174,8 @@ export function createLayer(ctx, shared) {
       { id: 'redCandle', toggle: (on) => { lantern.swap.value = on ? 1 : 0; } },
     ],
     readouts: [{ id: 'shadowMap', get: () => (shadowOn ? moonlight.shadow.mapSize.x : 0), unit: 'px' }],
+    // Nấc của bộ điều chỉnh: chia đôi cỡ shadow map (không dưới 256). Mức thấp tắt bóng nên không có nấc này.
+    degrade: shadowOn ? [halveShadow] : [],
     dispose() {
       if (disposed) return;
       disposed = true;
```

```diff
diff --git a/src/paintings/ao-sen-dem/parts/anh-trang-moon.js b/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
index 1223ac8..409b14b 100644
--- a/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
+++ b/src/paintings/ao-sen-dem/parts/anh-trang-moon.js
@@ -34,6 +34,7 @@ export function createMoon(ctx, w, phase) {
   const light = tint.mul(albedo).mul(lit.mul(MOON.glow).add(0.02)); // 0.02: ánh đất mờ trên phần tối
 
   const material = new MeshStandardNodeMaterial({ roughness: 1, metalness: 0 });
+  material.fog = false; // trăng ở rất xa mà vẫn phải rõ: sương của lớp Sương không phủ lên nó (quầng trăng vẽ trên trời)
   material.colorNode = mix(color(hex.datSet), vec3(0), w);
   material.emissiveNode = light.mul(w);
   const moon = new Mesh(new SphereGeometry(MOON.radius, 48, 24), material);
```

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index 9fdcec9..739eb77 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -45,6 +45,7 @@ export default {
         'paintings/ao-sen-dem/layers/l2-anh-trang.js',
         'paintings/ao-sen-dem/parts/anh-trang-moon.js',
         'paintings/ao-sen-dem/parts/anh-trang-paint.js',
+        'paintings/ao-sen-dem/parts/anh-trang-shadow.js',
       ],
     },
     {
```

Run: `npx vitest run tests/paintings`
Kết quả mong đợi: PASS. Test hợp đồng kiểm file mới nằm trong `LayerMeta.files` và trong glob `?code`.

- [ ] **Step 5: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  544 passed`.

```bash
git add src/paintings/ao-sen-dem/parts/anh-trang-shadow.js src/paintings/ao-sen-dem/layers/l2-anh-trang.js src/paintings/ao-sen-dem/layers/l1-cot.js src/paintings/ao-sen-dem/parts/anh-trang-moon.js src/paintings/ao-sen-dem/meta.js tests/paintings/ao-sen-dem/anh-trang.test.js tests/paintings/ao-sen-dem/cot.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): shadow map tĩnh (vẽ lại khi trăng, hoa hay bố cục đổi), khung bóng ôm sát vùng lá, nấc 'bong'; trăng không nhận sương

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 10: Lớp 3 · Sương

**Mục tiêu:** Spec §6 Lớp 3 (GĐ 3). Đây là lớp thứ sáu của Bức 1, đứng giữa Ánh trăng và Mặt nước:
- **Vòm trời** (`parts/suong-troi.js`): quả cầu bán kính 300, `BackSide`, `fog = false`, `depthWrite = false`, `renderOrder = −1`. Màu tính từ hướng nhìn:
  - chàm ở đỉnh, xuống đen then ở chân trời; chạng vạng ấm hơn, đọc `shared.hour`;
  - sao sinh bằng `mx_cell_noise_float`;
  - quầng trăng, sáng theo `shared.anhTrang.glow`;
  - dải Ngân Hà là fbm 2 tầng;
  - dưới chân trời là màu sương.
- **Sương là là** (`parts/suong-mu.js`): hệ số đúng công thức của spec, nhân `w3`.
  - Miền noise xoay quanh tâm xoáy (`shared.swirl`, do cử chỉ vuốt ghi) rồi trôi theo gió.
  - `scene.fogNode` gán MỘT lần; gỡ lớp thì trả giá trị cũ.
  - "Xem noise thô" là một uniform: mọi bề mặt hiện noise xám.
- **`octaves` là UNIFORM:** `min(núm, trần)`, trần do nấc `chi-tiet` và thí nghiệm "Chỉ 1 octave" (kiểu compare) đặt. Ở mức thấp, núm kéo tối đa 3.
- **Công bố `shared.suong = { fogFactor, sky }`** cho Mặt nước và Vàng lá.
- **Ánh trăng công bố `shared.anhTrang.glow`**, tức trọng số × phần trăng được chiếu.
- **Chữ và thơ:** thơ riêng của lớp là ca dao "Đêm qua ra đứng bờ ao…"; có chữ Sổ tay và sơ đồ; hàng rào từ vựng thêm `milky`, `ngân hà`.

**Files:**
- Create: `src/paintings/ao-sen-dem/layers/l3-suong.js`, `src/paintings/ao-sen-dem/parts/suong-mu.js`, `src/paintings/ao-sen-dem/parts/suong-troi.js`, `src/paintings/ao-sen-dem/diagrams/suong.svg`, `tests/paintings/ao-sen-dem/suong.test.js`
- Modify: `src/paintings/ao-sen-dem/shared.js` (xoáy khi vuốt), `src/paintings/ao-sen-dem/layers/l2-anh-trang.js` (công bố độ sáng của trăng), `src/paintings/ao-sen-dem/meta.js`, `src/paintings/ao-sen-dem/painting.js`, `src/paintings/ao-sen-dem/content.vi.js`
- Test: `tests/paintings/ao-sen-dem/shared.test.js`

**Interfaces:**
- Consumes:
  - `fbm(p, { octaves: node })`, `MAX_OCTAVES` (Task 2);
  - `shared.moon.dir`, `shared.hour` (setup của bức).
- Produces:
  - trong `shared`: `shared.swirl = { center: uniform vec2, start: uniform, spin: uniform }`, `shared.anhTrang = { glow }`, `shared.suong = { fogFactor: Node, sky: (dir) => Node }`;
  - `SKY_RADIUS = 300`; `createFog(ctx, {…}) → { node, factor, color, raw }`; `makeSky(ctx, {…}) → (dir) => Node`; `createSkyDome(skyColor) → Mesh`;
  - lớp `suong`:
    - 7 núm uniform;
    - thí nghiệm `rawNoise`, `oneOctave` (compare);
    - số đo `octaves`;
    - nấc `chi-tiet`.

- [ ] **Step 1: Test (hỏng: chưa có lớp Sương, chưa có xoáy)**

Tạo `tests/paintings/ao-sen-dem/suong.test.js`:
```js
// tests/paintings/ao-sen-dem/suong.test.js — Lớp 3 · Sương: vòm trời, sương gán MỘT lần vào scene.fogNode, octave là uniform, nấc, thí nghiệm.
import { describe, it, expect } from 'vitest';
import { BackSide } from 'three/webgpu';
import { vec3 } from 'three/tsl';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import * as suong from '../../../src/paintings/ao-sen-dem/layers/l3-suong.js';
import { SKY_RADIUS } from '../../../src/paintings/ao-sen-dem/parts/suong-troi.js';
import { knobMax, knobValue } from '../../../src/engine/gpu/knob-set.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'suong', ...options });
const octaves = (layer) => layer.readouts.find((r) => r.id === 'octaves').get();

describe('l3-suong', () => {
  it('núm tĩnh, đều là uniform (kể cả octaves: không biên dịch lại); octave mặc định theo mức', () => {
    expect(suong.id).toBe('suong');
    expect(suong.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
      ['density', 'uniform'], ['heightFalloff', 'uniform'], ['noiseScale', 'uniform'], ['octaves', 'uniform'],
      ['windStrength', 'uniform'], ['starDensity', 'uniform'], ['haloSize', 'uniform'],
    ]);
    const knob = suong.knobs.find((k) => k.id === 'octaves');
    expect(knobValue(knob, { budget: {} })).toBe(3);
    expect(knobValue(knob, { budget: { fogOctaves: 1 } })).toBe(1);
    expect([knobMax(knob, { tier: 'webgpu', level: 'cao' }), knobMax(knob, { tier: 'webgl2', level: 'thap' })]).toEqual([5, 3]);
  });

  it('vòm trời: cầu bán kính 300 nhìn từ trong, không nhận sương, không ghi độ sâu, vẽ trước, có emissiveNode', () => {
    const { ctx, layers } = build();
    const [dome] = layers.suong.objects;
    expect(ctx.scene.children).toContain(dome);
    expect(dome.geometry.parameters.radius).toBe(SKY_RADIUS);
    expect(dome.material.side).toBe(BackSide);
    expect([dome.material.fog, dome.material.depthWrite, dome.renderOrder]).toEqual([false, false, -1]);
    expect(dome.material.colorNode.isNode).toBe(true);
    expect(dome.material.emissiveNode).toBeTruthy();
  });

  it('sương gán MỘT lần vào scene.fogNode; công bố fogFactor và sky cho các lớp sau', () => {
    const { ctx, shared } = build();
    expect(ctx.scene.fogNode?.isNode).toBe(true);
    expect(shared.suong.fogFactor.isNode).toBe(true);
    expect(shared.suong.sky(vec3(0, 1, 0)).isNode).toBe(true);
  });

  it('thí nghiệm chỉ đổi uniform: fogNode giữ nguyên (không biên dịch lại mọi material)', () => {
    const { ctx, layers } = build();
    const fogNode = ctx.scene.fogNode;
    for (const exp of layers.suong.experiments) {
      exp.toggle(true);
      exp.toggle(false);
    }
    expect(ctx.scene.fogNode).toBe(fogNode);
    expect(layers.suong.experiments.map((e) => [e.id, e.kind ?? 'toggle'])).toEqual([['rawNoise', 'toggle'], ['oneOctave', 'compare']]);
  });

  it('số octave đang chạy = min(núm, trần): "Chỉ 1 octave" và nấc chi-tiet hạ trần; núm vẫn là ý người xem', () => {
    const { layers, knobs } = build();
    const layer = layers.suong;
    const [one] = layer.experiments.filter((e) => e.id === 'oneOctave');
    const [step] = layer.degrade;
    expect(octaves(layer)).toBe(3);
    one.toggle(true);
    expect(octaves(layer)).toBe(1);
    one.toggle(false);
    expect(octaves(layer)).toBe(3);
    expect(step.id).toBe('chi-tiet');
    step.apply();
    expect(octaves(layer)).toBe(1);
    knobs.suong.set('octaves', 5);
    expect([octaves(layer), knobs.suong.get('octaves')]).toEqual([1, 5]);
    step.revert();
    expect(octaves(layer)).toBe(5);
    expect(octaves(build({ level: 'thap', budget: { fogOctaves: 1 } }).layers.suong)).toBe(1);
  });

  it('dispose gỡ vòm trời và trả fogNode về như cũ (2 lần vẫn an toàn)', () => {
    const { ctx, layers } = build();
    const [dome] = layers.suong.objects;
    layers.suong.dispose();
    layers.suong.dispose();
    expect(dome.parent).toBeNull();
    expect(ctx.scene.fogNode ?? null).toBeNull(); // Scene của three không có fogNode cho tới khi được gán
  });
});
```

Áp vào `tests/paintings/ao-sen-dem/shared.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/shared.test.js b/tests/paintings/ao-sen-dem/shared.test.js
index 9489999..5ed99af 100644
--- a/tests/paintings/ao-sen-dem/shared.test.js
+++ b/tests/paintings/ao-sen-dem/shared.test.js
@@ -72,13 +72,14 @@ describe('createRipples: bộ đệm vòng 8 gợn', () => {
 });
 
 describe('setup(ctx)', () => {
-  it('shared: giờ, hướng trăng theo giờ, gợn sóng, điểm hút', () => {
+  it('shared: giờ, hướng trăng theo giờ, gợn sóng, điểm hút, xoáy sương (chưa xoáy)', () => {
     const { shared } = setup(makeEngineCtx(meta));
     expect(shared.hour.value).toBe(21);
     expect(shared.hourNote).toBeNull();
     expect(shared.moon.dir.value.toArray()).toEqual(moonDirection(21));
     expect(shared.ripples.slots).toHaveLength(RIPPLE_SLOTS);
     expect(shared.attract.strength.value).toBe(0);
+    expect(shared.swirl.spin.value).toBe(0);
   });
 
   it('chạm lên mặt nước: một gợn tại điểm chạm, lúc ctx.u.time; đom đóm quanh đó tản ra', () => {
@@ -91,7 +92,26 @@ describe('setup(ctx)', () => {
     expect(s.shared.attract.strength.value).toBeLessThan(0);
   });
 
-  it('vuốt trên mặt nước: không dời điểm hút, không tạo gợn (vuốt để dành cho sương, GĐ 3)', () => {
+  it('vuốt trên mặt nước: sương xoáy quanh chỗ vuốt, lúc ctx.u.time; chiều theo hướng vuốt; độ mạnh theo tốc độ (có kẹp)', () => {
+    const ctx = makeEngineCtx(meta);
+    const s = setup(ctx);
+    ctx.u.time.value = 3;
+    s.onGesture({ kind: 'swipe', ray: down(5, -4), velocity: { x: 4, y: 0.5 } });
+    expect(s.shared.swirl.center.value.toArray()).toEqual([5, -4]);
+    expect(s.shared.swirl.start.value).toBe(3);
+    expect(s.shared.swirl.spin.value).toBeCloseTo(Math.hypot(4, 0.5) * 0.35, 6);
+    s.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: -40, y: 0 } }); // vuốt rất nhanh sang trái
+    expect(s.shared.swirl.spin.value).toBe(-2.4);
+    s.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: 0, y: 0.1 } }); // rất chậm: vẫn xoáy nhẹ
+    expect(Math.abs(s.shared.swirl.spin.value)).toBe(0.6);
+    s.onGesture({ kind: 'swipe', ray: down(100, 0), velocity: { x: 4, y: 0 } }); // ngoài ao: bỏ qua
+    expect(s.shared.swirl.center.value.toArray()).toEqual([0, 0]);
+    const calm = setup(makeEngineCtx(meta, { reducedMotion: true }));
+    calm.onGesture({ kind: 'swipe', ray: down(0, 0), velocity: { x: 40, y: 0 } });
+    expect(calm.shared.swirl.spin.value).toBe(1.2); // giảm chuyển động: nửa góc
+  });
+
+  it('vuốt trên mặt nước: không dời điểm hút, không tạo gợn', () => {
     const s = setup(makeEngineCtx(meta));
     const before = s.shared.attract.point.value.toArray();
     s.onGesture({ kind: 'swipe', ray: down(5, 5), velocity: { x: 1, y: 0 } });
```

Run: `npx vitest run tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/shared.test.js`
Kết quả mong đợi: FAIL, 2 test hỏng; lỗi đầu tiên: `Error: Cannot find module '…/src/paintings/ao-sen-dem/layers/l3-suong.js'`.

- [ ] **Step 2: Vuốt → sương xoáy (`shared.js`); độ sáng của trăng cho lớp sau (`l2-anh-trang.js`)**

```diff
diff --git a/src/paintings/ao-sen-dem/shared.js b/src/paintings/ao-sen-dem/shared.js
index 1363e98..6dbe354 100644
--- a/src/paintings/ao-sen-dem/shared.js
+++ b/src/paintings/ao-sen-dem/shared.js
@@ -1,5 +1,5 @@
-// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, điểm hút đom đóm, cử chỉ.
-import { Plane, Vector3, Vector4 } from 'three/webgpu';
+// paintings/ao-sen-dem/shared.js — setup() của Bức 1: giờ đêm nay, hướng trăng, bộ đệm gợn sóng, điểm hút đom đóm, xoáy sương, cử chỉ.
+import { Plane, Vector2, Vector3, Vector4 } from 'three/webgpu';
 import { Fn, Loop, exp, float, length, pow2, sin, step, uniform, uniformArray } from 'three/tsl';
 import { hourOfNight, tonight } from '../../lib/astro/moon.js';
 
@@ -7,6 +7,8 @@ export const POND_RADIUS = 60; // bán kính mặt nước: đĩa nước của
 export const RIPPLE_SLOTS = 8;
 const NIGHT = { start: 18, end: 29.5, fallback: 21 }; // thang giờ của Bức 1: 18:00 → 05:30 sáng hôm sau
 const FLY_HEIGHT = 1.2; // điểm hút đom đóm nằm trên mặt nước một chút
+// Vuốt → sương xoáy: góc xoay (radian) ở tâm xoáy tăng theo tốc độ vuốt (NDC mỗi giây), kẹp trong [min, max].
+const SWIRL_SPIN = { min: 0.6, max: 2.4, perSpeed: 0.35 };
 
 /**
  * Chính sách giờ của Bức 1 (§7): đang là đêm thì dùng giờ thật (21:00 → 21, 02:00 → 26);
@@ -87,14 +89,20 @@ export function setup(ctx) {
   const moonDir = uniform(new Vector3(...moonDirection(hour))).setName('moonDir');
   const ripples = createRipples();
   const attract = { point: uniform(new Vector3(0, FLY_HEIGHT, 0)), strength: uniform(0) };
-  const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng nhẹ hơn
+  // Xoáy sương (lớp Sương đọc): tâm trên mặt nước (x, z), lúc bắt đầu, góc xoay có dấu (chiều vuốt).
+  const swirl = {
+    center: uniform(new Vector2()).setName('swirlCenter'),
+    start: uniform(-1e4).setName('swirlStart'),
+    spin: uniform(0).setName('swirlSpin'),
+  };
+  const rippleAmp = ctx.reducedMotion ? 0.5 : 1; // §10: giảm chuyển động thì gợn sóng (và xoáy sương) nhẹ hơn
 
   const water = new Plane(new Vector3(0, 1, 0), 0);
   const hit = new Vector3();
   let holding = false;
 
   return {
-    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract },
+    shared: { hour: uHour, hourNote: note, moon: { dir: moonDir }, ripples, attract, swirl },
 
     // Cử chỉ mà không công cụ nào dùng. Tia đi từ camera qua ngón tay; bức tự giao với mặt nước y = 0.
     onGesture(g) {
@@ -106,7 +114,18 @@ export function setup(ctx) {
         holding = false;
         return;
       }
-      // Chỉ chạm và giữ mới dời điểm hút; vuốt thì không (vuốt để dành cho sương, GĐ 3).
+      // Vuốt trên mặt nước: sương xoáy quanh chỗ vuốt, chiều theo hướng vuốt; không dời điểm hút, không tạo gợn.
+      if (g.kind === 'swipe') {
+        if (!onPond) return;
+        const v = g.velocity ?? { x: 0, y: 0 };
+        const along = Math.abs(v.x) >= Math.abs(v.y) ? v.x : -v.y;
+        const spin = Math.min(SWIRL_SPIN.max, Math.max(SWIRL_SPIN.min, Math.hypot(v.x, v.y) * SWIRL_SPIN.perSpeed));
+        swirl.center.value.set(hit.x, hit.z);
+        swirl.start.value = ctx.u.time.value;
+        swirl.spin.value = (along < 0 ? -1 : 1) * spin * rippleAmp;
+        return;
+      }
+      // Chỉ chạm và giữ mới dời điểm hút.
       if (!onPond || !['tap', 'hold-start', 'hold-move'].includes(g.kind)) return;
       attract.point.value.set(hit.x, FLY_HEIGHT, hit.z);
       if (g.kind === 'tap') {
```

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index e4f0245..02ec9f4 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -8,7 +8,7 @@ import {
   Object3D,
   PointLight,
 } from 'three/webgpu';
-import { color, mix, uniform, uv, vec3 } from 'three/tsl';
+import { color, cos, mix, oneMinus, uniform, uv, vec3 } from 'three/tsl';
 import { moonPhase } from '../../../lib/astro/moon.js';
 import { createMoon } from '../parts/anh-trang-moon.js';
 import { paintCot } from '../parts/anh-trang-paint.js';
@@ -82,6 +82,9 @@ export function createLayer(ctx, shared) {
 
   const moon = createMoon(ctx, w, ctx.knob('moonPhase')); // @knob moonPhase
   const paint = paintCot(ctx, cot, w, shared.moon.dir);
+  // Độ sáng của trăng cho các lớp sau (quầng trăng, sương sáng về phía trăng, phản chiếu giả): trọng số × phần mặt trăng
+  // được chiếu, (1 − cos pha) / 2: rằm là 1, trăng mới là 0.
+  shared.anhTrang = { glow: w.mul(oneMinus(cos(ctx.knob('moonPhase'))).mul(0.5)) };
 
   // Ánh trăng bạc-ngà: DirectionalLight chiếu từ phía trăng. Cường độ là uniform bên trong
   // node đèn, nên đổi mỗi khung theo trọng số mà không biên dịch lại.
```

- [ ] **Step 3: Tạo `src/paintings/ao-sen-dem/parts/suong-mu.js`**

```js
// paintings/ao-sen-dem/parts/suong-mu.js — của lớp Sương: hệ số sương là là (dày sát nước, trôi theo gió, xoáy khi vuốt) và màu sương.
import {
  Fn,
  cameraPosition,
  color,
  cos,
  dot,
  exp,
  fog,
  max,
  mix,
  normalize,
  oneMinus,
  positionView,
  positionWorld,
  pow,
  saturate,
  sin,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

const WIND = [0.92, 0, 0.4]; // hướng gió trên mặt ao (gần như từ trái sang phải khung hình)
const WIND_SPEED = 0.1; // miền noise trôi chừng này đơn vị mỗi giây khi sức gió = 1
const SWIRL = { radius: 9, settle: 0.6 }; // xoáy: bán kính ảnh hưởng (đơn vị cảnh), tốc độ lắng (mỗi giây)

/**
 * Màu sương theo hướng nhìn (đơn vị): bạc lá pha chàm, tối như đêm; ngả vàng lá khi nhìn về phía trăng, vì sương tán xạ
 * ánh trăng về phía trước (nhìn ngược sáng thì sương sáng nhất). `moonLight`: độ sáng của trăng (lớp Ánh trăng công bố).
 * @returns {(dir: any) => any}  gọi được trong TSL
 */
export function makeFogColor(ctx, { moonDir, moonLight }) {
  const hex = ctx.palette.hex;
  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.25);
  const glow = color(hex.vangLaSang).mul(0.12).mul(moonLight);
  // saturate trước pow: pow của số âm là NaN trên GPU thật.
  return Fn(([dir]) => base.add(glow.mul(pow(saturate(dot(dir, moonDir)), 16))));
}

/**
 * Sương của cả cảnh: node cho `scene.fogNode`, cùng hệ số sương để các lớp sau dùng lại.
 * Hệ số (spec §6): w × (1 − exp(−d × density × exp(−y × heightFalloff) × (0.6 + 0.4 × noise))), d = khoảng cách theo trục nhìn.
 * Mọi thứ đổi lúc chạy (trọng số, núm, xoáy, "Xem noise thô") là uniform bên trong: fogNode nằm trong cache key của MỌI
 * material, nên node này dựng MỘT lần và không bao giờ gán lại.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ w: any, swirl: any, moonDir: any, moonLight: any, density: any, heightFalloff: any, noiseScale: any,
 *   windStrength: any, octaves: any }} p  node hoặc uniform
 */
export function createFog(ctx, { w, swirl, moonDir, moonLight, density, heightFalloff, noiseScale, windStrength, octaves }) {
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một làn sương
  const raw = uniform(0).setName('suong_raw'); // thí nghiệm "Xem noise thô": 1 → mọi bề mặt hiện noise xám
  const wind = vec3(...WIND).normalize().mul(windStrength).mul(WIND_SPEED);

  // noise ∈ [−1, 1] tại điểm đang vẽ. Miền noise xoay quanh tâm xoáy một góc tắt dần theo thời gian và khoảng cách
  // (vuốt tay → sương xoáy rồi lắng), rồi trôi theo gió.
  const noise = Fn(() => {
    const p = positionWorld;
    const d = p.xz.sub(swirl.center).toVar();
    const age = max(t.sub(swirl.start), 0);
    const angle = swirl.spin.mul(exp(age.mul(-SWIRL.settle))).mul(exp(dot(d, d).div(-(SWIRL.radius ** 2))));
    const c = cos(angle);
    const s = sin(angle);
    const xz = vec2(d.x.mul(c).sub(d.y.mul(s)), d.x.mul(s).add(d.y.mul(c))).add(swirl.center);
    return fbm(vec3(xz.x, p.y, xz.y).mul(noiseScale).add(wind.mul(t)), { octaves });
  })();

  const distance = positionView.z.negate();
  const thick = exp(positionWorld.y.mul(heightFalloff).negate()); // sát mặt nước (y = 0) đặc nhất, lên cao mỏng dần
  const amount = distance.mul(density).mul(thick).mul(noise.mul(0.4).add(0.6));
  const factor = oneMinus(exp(amount.negate())).mul(w);

  const fogColor = makeFogColor(ctx, { moonDir, moonLight });
  const view = normalize(positionWorld.sub(cameraPosition));
  // "Xem noise thô": màu sương thành noise xám, hệ số thành 1 (mọi bề mặt thay hẳn bằng noise). Chỉ đổi uniform.
  const node = fog(mix(fogColor(view), vec3(noise.mul(0.5).add(0.5)), raw), mix(factor, 1, raw));
  return { node, factor, color: fogColor, raw };
}
```

- [ ] **Step 4: Tạo `src/paintings/ao-sen-dem/parts/suong-troi.js`**

```js
// paintings/ao-sen-dem/parts/suong-troi.js — của lớp Sương: màu vòm trời theo hướng nhìn (chàm → đen then, sao, quầng trăng, Ngân Hà, sương chân trời).
import { BackSide, Mesh, MeshBasicNodeMaterial, SphereGeometry } from 'three/webgpu';
import {
  Fn,
  cameraPosition,
  color,
  dot,
  exp,
  float,
  floor,
  fract,
  length,
  mix,
  mx_cell_noise_float,
  normalize,
  oneMinus,
  positionWorld,
  pow2,
  pow3,
  saturate,
  sin,
  smoothstep,
  step,
  vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

export const SKY_RADIUS = 300; // lớn hơn quỹ đạo trăng (160), nhỏ hơn tầm nhìn xa của camera (500)
const STARS = { scale: 220, maxShare: 0.035 }; // ô sao: 220 ô mỗi đơn vị hướng; mật độ 1 = 3,5% số ô có sao
const GALAXY = [0.42, 0.55, 0.72]; // pháp tuyến của mặt phẳng dải Ngân Hà (một đường tròn lớn nghiêng qua trời)

/**
 * Hàm màu trời theo hướng nhìn (vector đơn vị, từ mắt ra trời). Không cần ảnh nào: mọi thứ tính từ hướng.
 * Trả màu TUYẾN TÍNH, chưa trộn trọng số (lớp tự trộn với đen then).
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ moonDir: any, moonLight: any, hour: any, fogColor: (dir: any) => any, density: any, starDensity: any,
 *   haloSize: any }} p  moonLight: độ sáng của trăng (trọng số Ánh trăng × phần được chiếu); hour: 18 → 29,5
 * @returns {(dir: any) => any}
 */
export function makeSky(ctx, { moonDir, moonLight, hour, fogColor, density, starDensity, haloSize }) {
  const hex = ctx.palette.hex;
  const t = ctx.u.time;
  return Fn(([dir]) => {
    const e = dir.y; // độ cao của hướng nhìn: 0 là chân trời, 1 là đỉnh đầu
    // Dải màu theo poster: đen then ở chân trời, chàm ở đỉnh. Chạng vạng (18h–19h30) và gần sáng (28h30–29h30)
    // chân trời ấm lên màu nâu cánh gián. Giờ là uniform của bức: thanh giờ (GĐ 4) chỉ việc đổi nó.
    const dusk = oneMinus(smoothstep(18, 19.5, hour)).add(smoothstep(28.5, 29.5, hour));
    const base = mix(color(hex.denThen), color(hex.cham), smoothstep(0, 0.6, e))
      .add(color(hex.canhGian).mul(dusk.mul(0.6)).mul(oneMinus(smoothstep(0, 0.25, e))));

    // Sao: chia hướng nhìn thành lưới ô 3D. Mỗi ô một số ngẫu nhiên cố định (mx_cell_noise_float = hash của ô);
    // số đó vượt ngưỡng thì ô có sao, đặt lệch trong ô cho khỏi thẳng hàng. Mờ dần về chân trời và gần trăng.
    const cellPos = dir.mul(STARS.scale);
    const cell = floor(cellPos);
    const pick = mx_cell_noise_float(cell);
    const jitter = vec3(mx_cell_noise_float(cell.add(17)), mx_cell_noise_float(cell.add(31)), mx_cell_noise_float(cell.add(47)));
    const offset = fract(cellPos).sub(0.5).sub(jitter.sub(0.5).mul(0.6));
    const dot1 = oneMinus(smoothstep(0, 0.2, length(offset))); // chấm tròn nhỏ giữa ô
    const lit = step(float(1).sub(starDensity.mul(STARS.maxShare)), pick);
    const twinkle = sin(t.mul(pick.mul(3).add(1)).add(pick.mul(40))).mul(0.25).add(0.75);
    const moonCos = dot(dir, moonDir);
    const clear = smoothstep(0.02, 0.2, e).mul(oneMinus(smoothstep(0.97, 0.995, moonCos)));
    const stars = color(hex.nga).mul(dot1.mul(lit).mul(twinkle).mul(pow3(fract(pick.mul(13.7)))).mul(clear).mul(1.6));

    // Quầng trăng: sáng quanh hướng trăng, tắt dần theo góc. 1 − cos(góc) ≈ góc²/2, nên exp(−k(1 − cos)) là một chuông.
    const off = oneMinus(moonCos);
    const halo = exp(off.mul(-60).div(pow2(haloSize).add(0.01))).mul(0.1).add(exp(off.mul(-1500)).mul(0.3));
    const moonHalo = color(hex.vangLaSang).mul(halo.mul(moonLight));

    // Ngân Hà: một vành rất mờ quanh một đường tròn lớn, lốm đốm theo fbm 2 tầng.
    const band = exp(pow2(dot(dir, normalize(vec3(...GALAXY)))).div(-0.012));
    const dust = pow2(fbm(dir.mul(4.2), { octaves: 2 }).mul(0.5).add(0.5));
    const milky = color(hex.bacLa).mul(band.mul(dust).mul(0.035).mul(smoothstep(0.05, 0.35, e)));

    // Sương ở chân trời: dưới chân trời là màu sương, nên mép ao đặc sương tan liền vào trời.
    const horizon = oneMinus(smoothstep(-0.02, 0.12, e)).mul(saturate(density.mul(20)));
    return mix(base.add(stars).add(moonHalo).add(milky), fogColor(dir), horizon);
  });
}

/**
 * Vòm trời: quả cầu lớn nhìn từ BÊN TRONG (BackSide), vẽ trước mọi thứ và không ghi độ sâu, nên luôn nằm sau cùng.
 * Không nhận sương (sương chân trời đã vẽ trong màu trời), không phát sáng (trời không bloom).
 * @param {(dir: any) => any} skyColor  màu trời đã trộn trọng số
 */
export function createSkyDome(skyColor) {
  const material = new MeshBasicNodeMaterial({ side: BackSide, depthWrite: false, fog: false });
  // Hướng từ mắt tới điểm trên vòm: sao đứng yên so với người xem, và camera lật của reflector soi đúng trời.
  material.colorNode = skyColor(normalize(positionWorld.sub(cameraPosition)));
  material.emissiveNode = vec3(0);
  const dome = new Mesh(new SphereGeometry(SKY_RADIUS, 48, 24), material);
  dome.renderOrder = -1;
  return dome;
}
```

- [ ] **Step 5: Tạo `src/paintings/ao-sen-dem/layers/l3-suong.js`**

```js
// paintings/ao-sen-dem/layers/l3-suong.js — Lớp 3 · Sương: vòm trời (sao, quầng trăng, Ngân Hà) và sương là là trên mặt nước (scene.fogNode).
import { color, min, mix, uniform } from 'three/tsl';
import { MAX_OCTAVES } from '../../../lib/tsl/noise.js';
import { createFog } from '../parts/suong-mu.js';
import { createSkyDome, makeSky } from '../parts/suong-troi.js';

export const id = 'suong';

export const knobs = [
  { id: 'density', min: 0, max: 0.12, step: 0.001, value: 0.012 },
  { id: 'heightFalloff', min: 0.05, max: 2, step: 0.01, value: 1 },
  { id: 'noiseScale', min: 0.01, max: 0.4, step: 0.005, value: 0.07 },
  // Số tầng noise là UNIFORM (không phải rebuild): fbm chạy vòng lặp thật trong shader nên đổi số tầng không biên dịch lại.
  // Đồ thị của sương nằm trong cache key của MỌI material: dựng lại nó là mọi material biên dịch lại (spec §6, GĐ 3).
  // Mức thấp (máy yếu) kéo tối đa 3 tầng: noise sương chạy trên gần như mọi điểm ảnh.
  { id: 'octaves', min: 1, max: (env) => (env.level === 'thap' ? 3 : MAX_OCTAVES), step: 1, value: (env) => env.budget.fogOctaves ?? 3 },
  { id: 'windStrength', min: 0, max: 3, step: 0.05, value: 0.6 },
  { id: 'starDensity', min: 0, max: 1, step: 0.01, value: 0.3 },
  { id: 'haloSize', min: 0.2, max: 2, step: 0.01, value: 1 },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.moon, shared.hour, shared.swirl (setup của bức); shared.anhTrang.glow (lớp trước)
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const moonLight = shared.anhTrang.glow;
  // Số octave chạy thật = min(núm, trần). Trần do nấc 'chi-tiet' của bộ điều chỉnh và thí nghiệm "Chỉ 1 octave" đặt:
  // nấc chỉ hạ TRẦN, không bao giờ ghi vào núm (ý người xem).
  const octaveCap = uniform(MAX_OCTAVES).setName('suong_octaveCap');
  let degradeCap = MAX_OCTAVES;
  let oneOctave = false;
  const syncCap = () => {
    octaveCap.value = oneOctave ? 1 : degradeCap;
  };

  const fog = createFog(ctx, {
    w,
    swirl: shared.swirl,
    moonDir: shared.moon.dir,
    moonLight,
    density: ctx.knob('density'), // @knob density
    heightFalloff: ctx.knob('heightFalloff'), // @knob heightFalloff
    noiseScale: ctx.knob('noiseScale'), // @knob noiseScale
    windStrength: ctx.knob('windStrength'), // @knob windStrength
    octaves: min(ctx.knob('octaves'), octaveCap), // @knob octaves
  });
  const sky = makeSky(ctx, {
    moonDir: shared.moon.dir,
    moonLight,
    hour: shared.hour,
    fogColor: fog.color,
    density: ctx.knob('density'), // @knob density
    starDensity: ctx.knob('starDensity'), // @knob starDensity
    haloSize: ctx.knob('haloSize'), // @knob haloSize
  });
  // Trời theo trọng số: 0 là nền đen then, đúng màu nền của canvas (luật 3: mài hết thì không còn trời).
  const skyW = (dir) => mix(color(ctx.palette.hex.denThen), sky(dir), w);
  const dome = createSkyDome(skyW);
  ctx.scene.add(dome);
  // Gán MỘT lần, không bao giờ gán lại hay đặt null lúc chạy: fogNode nằm trong cache key của mọi material.
  const previousFog = ctx.scene.fogNode;
  ctx.scene.fogNode = fog.node;
  // Sương không tác động lên kênh MRT emissive: lớp sau tự nhân (1 − fogFactor). Mặt nước dùng sky cho phản chiếu giả.
  shared.suong = { fogFactor: fog.factor, sky: skyW };

  let disposed = false;
  return {
    objects: [dome],
    experiments: [
      { id: 'rawNoise', toggle: (on) => { fog.raw.value = on ? 1 : 0; } },
      {
        // So chi tiết và số ms: 1 tầng noise so với số tầng của núm. Chỉ đổi trần (uniform): không biên dịch lại.
        id: 'oneOctave',
        kind: 'compare',
        toggle(on) {
          oneOctave = on;
          syncCap();
        },
      },
    ],
    readouts: [{ id: 'octaves', get: () => Math.min(ctx.knob('octaves').value, octaveCap.value) }],
    degrade: [
      {
        id: 'chi-tiet',
        apply() {
          degradeCap = 1;
          syncCap();
        },
        revert() {
          degradeCap = MAX_OCTAVES;
          syncCap();
        },
      },
    ],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(dome);
      dome.geometry.dispose();
      dome.material.dispose();
      if (ctx.scene.fogNode === fog.node) ctx.scene.fogNode = previousFog; // gỡ cảnh: trả scene về như trước khi dựng
    },
  };
}
```

- [ ] **Step 6: Lắp lớp vào bức: `meta.js`, `painting.js`**

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index 739eb77..fddf4cf 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -48,6 +48,16 @@ export default {
         'paintings/ao-sen-dem/parts/anh-trang-shadow.js',
       ],
     },
+    {
+      id: 'suong',
+      name: 'Sương',
+      files: [
+        'paintings/ao-sen-dem/layers/l3-suong.js',
+        'paintings/ao-sen-dem/parts/suong-troi.js',
+        'paintings/ao-sen-dem/parts/suong-mu.js',
+      ],
+      poem: { lines: ['Đêm qua ra đứng bờ ao', 'Trông cá cá lặn, trông sao sao mờ'], source: 'Ca dao' },
+    },
     {
       id: 'mat-nuoc',
       name: 'Mặt nước',
@@ -62,5 +72,5 @@ export default {
     phuBong,
   ],
   // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
-  fence: ['ripple', 'lotus', 'firefl', 'uhour', 'moondir', 'lantern', 'mặt nước', 'đom đóm', 'hoa sen', 'hoa đăng'],
+  fence: ['ripple', 'lotus', 'firefl', 'uhour', 'moondir', 'lantern', 'milky', 'mặt nước', 'đom đóm', 'hoa sen', 'hoa đăng', 'ngân hà'],
 };
```

```diff
diff --git a/src/paintings/ao-sen-dem/painting.js b/src/paintings/ao-sen-dem/painting.js
index b13e6cd..0e51406 100644
--- a/src/paintings/ao-sen-dem/painting.js
+++ b/src/paintings/ao-sen-dem/painting.js
@@ -1,6 +1,7 @@
 // paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers) và camera.
 import * as cot from './layers/l1-cot.js';
 import * as anhTrang from './layers/l2-anh-trang.js';
+import * as suong from './layers/l3-suong.js';
 import * as matNuoc from './layers/l4-mat-nuoc.js';
 import * as vangLa from './layers/l5-vang-la.js';
 import * as phuBong from '../../engine/stock/phu-bong/layer.js';
@@ -9,9 +10,9 @@ import * as phuBong from '../../engine/stock/phu-bong/layer.js';
  * Mỗi lớp là một module { id, knobs, createLayer }; import namespace (`* as`) cho ra đúng object đó.
  * @type {import('../../engine/contracts/runtime.js').LayerModule[]}
  */
-export const layers = [cot, anhTrang, matNuoc, vangLa, phuBong];
+export const layers = [cot, anhTrang, suong, matNuoc, vangLa, phuBong];
 
-/** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, cử chỉ (shared.js). */
+/** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, xoáy sương, cử chỉ (shared.js). */
 export { setup } from './shared.js';
 
 /**
```

- [ ] **Step 7: Chữ và sơ đồ của Sổ tay**

Tạo `src/paintings/ao-sen-dem/diagrams/suong.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" role="img" aria-labelledby="dg-su-title" font-family="'Be Vietnam Pro', system-ui, sans-serif" font-size="12">
  <title id="dg-su-title">Sương: mỗi điểm ảnh tự pha màu sương theo khoảng cách tới mắt. Sát mặt nước sương đặc, lên cao mỏng dần theo hàm mũ; noise nhiều tầng làm sương loang từng mảng. Bông sen càng xa càng chìm vào sương.</title>
  <defs>
    <linearGradient id="dg-su-mu" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#C9C6BD" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#C9C6BD" stop-opacity="0"/>
    </linearGradient>
    <marker id="dg-su-mui" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" fill="#F2D48A"/>
    </marker>
  </defs>
  <!-- sương: đặc sát mặt nước, mỏng dần lên cao -->
  <rect x="10" y="58" width="330" height="52" fill="url(#dg-su-mu)"/>
  <path d="M10 110 H350" stroke="#C9C6BD" stroke-width="2"/>
  <text x="14" y="128" fill="#C9C6BD">mặt nước</text>
  <!-- mắt (camera) -->
  <g fill="none" stroke="#EDE3CF" stroke-width="1.6">
    <rect x="18" y="62" width="26" height="18" rx="3"/>
    <path d="M44 68 L52 64 V78 L44 74"/>
  </g>
  <text x="31" y="56" fill="#EDE3CF" text-anchor="middle">mắt</text>
  <!-- tia tới hai bông sen: gần thì rõ, xa thì chìm trong sương -->
  <path d="M54 74 L150 92" stroke="#F2D48A" stroke-width="1.6" fill="none" marker-end="url(#dg-su-mui)"/>
  <circle cx="158" cy="94" r="6" fill="#EDE3CF"/>
  <path d="M54 74 L290 98" stroke="#F2D48A" stroke-width="1.2" stroke-dasharray="4 4" fill="none" marker-end="url(#dg-su-mui)"/>
  <circle cx="298" cy="99" r="6" fill="#EDE3CF" fill-opacity="0.3"/>
  <text x="158" y="80" fill="#EDE3CF" text-anchor="middle">gần: rõ</text>
  <text x="298" y="84" fill="#8A8580" text-anchor="middle">xa: chìm</text>
  <!-- độ cao -->
  <path d="M344 108 V30" stroke="#8A8580" stroke-width="1.2" marker-end="url(#dg-su-mui)"/>
  <text x="336" y="28" fill="#8A8580" text-anchor="end">cao: sương mỏng</text>
  <text x="180" y="150" fill="#D4A94A" text-anchor="middle">hệ số = 1 − e^(−xa × mật độ × e^(−cao × độ mỏng) × noise)</text>
</svg>
```

Áp vào `src/paintings/ao-sen-dem/content.vi.js`:
```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index c63c476..b9460b3 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -2,6 +2,7 @@
 import phuBong from '../../engine/stock/phu-bong/content.vi.js';
 import cotDiagram from './diagrams/cot.svg?raw';
 import anhTrangDiagram from './diagrams/anh-trang.svg?raw';
+import suongDiagram from './diagrams/suong.svg?raw';
 import matNuocDiagram from './diagrams/mat-nuoc.svg?raw';
 import vangLaDiagram from './diagrams/vang-la.svg?raw';
 
@@ -105,6 +106,48 @@ export default {
       readouts: { shadowMap: 'Cỡ shadow map' },
     },
 
+    suong: {
+      understand:
+        'Lớp này vẽ bầu trời và làn sương. Trời là một quả cầu lớn nhìn từ bên trong: màu mỗi điểm tính từ hướng '
+        + 'nhìn, chàm ở đỉnh, đen then ở chân trời; sao là những ô ngẫu nhiên (hash) được chọn cho sáng lên, không '
+        + 'cần tấm ảnh nào. Sương thì không phải một vật: mọi bề mặt tự pha màu sương theo khoảng cách tới mắt. Càng '
+        + 'xa và càng sát mặt nước thì càng đặc (hàm mũ theo độ cao), còn noise nhiều tầng (fbm) cho sương loang từng '
+        + 'mảng và trôi theo gió. Mỗi tầng noise (octave) thêm chi tiết nhỏ nhưng tốn thêm phép tính ở mọi điểm ảnh. '
+        + 'Vuốt trên mặt nước để sương xoáy.',
+      diagram: suongDiagram,
+      learned: [
+        'Sương là phép pha màu theo khoảng cách: 1 − e^(−khoảng cách × mật độ).',
+        'fbm: cộng nhiều tầng noise, tầng sau nhỏ gấp đôi và nhạt đi một nửa.',
+        'Bầu trời vẽ bằng công thức theo hướng nhìn, không cần ảnh.',
+      ],
+      readMore: [
+        { title: 'Inigo Quilez · Better Fog', url: 'https://iquilezles.org/articles/fog/' },
+        { title: 'The Book of Shaders · Fractal Brownian Motion', url: 'https://thebookofshaders.com/13/' },
+      ],
+      knobs: {
+        density: 'Mật độ sương',
+        heightFalloff: 'Sương mỏng dần theo độ cao',
+        noiseScale: 'Cỡ mảng sương (nhỏ là mảng to)',
+        octaves: 'Số tầng noise (octave)',
+        windStrength: 'Sức gió',
+        starDensity: 'Mật độ sao',
+        haloSize: 'Cỡ quầng trăng',
+      },
+      experiments: {
+        rawNoise: {
+          label: 'Xem noise thô',
+          explain: 'Mọi bề mặt hiện thẳng giá trị noise của sương dạng ảnh xám: sáng là chỗ sương đặc. Trời, trăng '
+            + 'và đom đóm không nhận sương nên vẫn như cũ.',
+        },
+        oneOctave: {
+          label: 'Chỉ 1 octave',
+          explain: 'Sương còn một tầng noise: mảng to, mềm, mất chi tiết. Hai cột đo ms lúc tắt và lúc bật. Máy yếu '
+            + 'thấy bớt octave là nhẹ đi; máy mạnh thì cột ms khung có thể bằng nhau vì trình duyệt khóa ở nhịp màn hình.',
+        },
+      },
+      readouts: { octaves: 'Số octave đang chạy' },
+    },
+
     'mat-nuoc': {
       understand:
         'Mặt nước là một đĩa phẳng, nhưng soi được trăng, hoa và trời. Mỗi khung, reflector vẽ lại toàn cảnh từ '
```

Run: `npx vitest run tests/paintings tests/rules`
Kết quả mong đợi: PASS. Test hợp đồng giữ nhiều thứ cho lớp mới:
- marker `// @knob` khớp 7 núm (density có marker ở cả hai chỗ dùng);
- dựng được ở mức cao và mức thấp, gỡ ngược thì scene trống;
- Hiểu không quá 150 chữ; có nhãn cho mọi núm, thí nghiệm, số đo;
- sơ đồ chỉ dùng màu của bảng sơn mài.

Hàng rào từ vựng giữ để xưởng không nhắc tới `suong` hay `milky`.

- [ ] **Step 8: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  551 passed`.

```bash
git add src/paintings/ao-sen-dem tests/paintings/ao-sen-dem/suong.test.js tests/paintings/ao-sen-dem/shared.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): lớp Sương: vòm trời (sao, quầng trăng, Ngân Hà, chân trời theo giờ), sương là là gán một lần vào scene.fogNode, vuốt thì sương xoáy; octave là uniform; nấc chi-tiet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

- [ ] **Step 9: Nhìn tận mắt (nên làm, trên GPU thật)**

`npm run dev`, mở `http://localhost:5173/son-mai-anh-sang/?at=2026-09-28T21:00`. Mong đợi:
- đỉnh trời chàm có sao, quanh trăng có quầng, chân trời có sương mỏng;
- `__sma.setWeight('suong', 0)` thì về đúng cảnh của GĐ 2 (nền đen then, không sương);
- console không có lỗi.

Trình duyệt chưa bật GPU thì bỏ qua bước này: e2e ở Task 15 kiểm trên cả hai backend.

---

### Task 11: Mặt nước: phản chiếu giả ở mức thấp, ánh lóe trong sương, nấc `phan-chieu`

**Mục tiêu:** Spec §6 Lớp 4 (GĐ 3).
- **Mức thấp** (`budget.reflection === 0`): KHÔNG tạo reflector. Phản chiếu giả (`parts/mat-nuoc-gia.js`) gồm:
  - màu trời theo tia phản xạ `reflect(−hướng nhìn, pháp tuyến)`, dùng đúng hàm `shared.suong.sky`;
  - cộng đĩa trăng phản xạ (`pow(saturate(dot(tia, hướng trăng)), 900)`), nhân `shared.anhTrang.glow`.

  Pháp tuyến gợn làm đĩa trăng vỡ thành lối trăng lấp lánh.
- **Ánh lóe** trong kênh emissive nhân `(1 − fogFactor)`.
- **Nấc `phan-chieu`:** trần độ phân giải × 0,5, sàn 0,15.
- **Trần núm theo mức:** `reflectionResolution` tối đa 1 ở mức cao, 0,6 ở mức khác.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/mat-nuoc-gia.js`
- Modify: `src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js`, `src/paintings/ao-sen-dem/meta.js`
- Test: `tests/paintings/ao-sen-dem/mat-nuoc.test.js`

**Interfaces:**
- Consumes: `shared.suong.sky`, `shared.suong.fogFactor` (Task 10), `shared.anhTrang.glow`, `shared.moon.dir`.
- Produces: `fakeReflection(ctx, shared, normal) → Node vec3`; l4 có `degrade = [{ id: 'phan-chieu' }]` (rỗng ở mức thấp) và số đo `reflectionScale` = 0 khi phản chiếu giả.

- [ ] **Step 1: Test (hỏng)**

Áp vào `tests/paintings/ao-sen-dem/mat-nuoc.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/mat-nuoc.test.js b/tests/paintings/ao-sen-dem/mat-nuoc.test.js
index 996af43..7d271f2 100644
--- a/tests/paintings/ao-sen-dem/mat-nuoc.test.js
+++ b/tests/paintings/ao-sen-dem/mat-nuoc.test.js
@@ -32,6 +32,9 @@ describe('l4-mat-nuoc', () => {
     expect(scale(water)).toBe(0.1);
     low.toggle(false);
     expect(scale(water)).toBe(0.6);
+    const vua = build({ level: 'vua' });
+    vua.knobs['mat-nuoc'].set('reflectionResolution', 1); // mức vừa: trần 0.6, máy yếu không bị kéo quá sức
+    expect(scale(vua.layers['mat-nuoc'])).toBe(0.6);
   });
 
   it('thí nghiệm "Tắt fresnel" và "Xem heightfield" chỉ đổi uniform (material giữ nguyên node)', () => {
@@ -73,6 +76,43 @@ describe('l4-mat-nuoc', () => {
     expect(shared.cot.standingMaterial.positionNode).toBeNull();
   });
 
+  it("nấc 'phan-chieu': trần độ phân giải chia đôi (không dưới 0,15) rồi trả lại; hiệu lực = min(núm, trần)", () => {
+    const scale = (layer) => layer.readouts.find((r) => r.id === 'reflectionScale').get();
+    const { layers, knobs } = build();
+    const water = layers['mat-nuoc'];
+    const [step] = water.degrade;
+    expect(step.id).toBe('phan-chieu');
+    step.apply();
+    expect(scale(water)).toBe(0.25);
+    knobs['mat-nuoc'].set('reflectionResolution', 0.8); // người xem kéo núm lên: trần vẫn giữ
+    expect(scale(water)).toBe(0.25);
+    knobs['mat-nuoc'].set('reflectionResolution', 0.2); // núm dưới trần: theo núm
+    expect(scale(water)).toBe(0.2);
+    step.revert();
+    knobs['mat-nuoc'].set('reflectionResolution', 0.8);
+    expect(scale(water)).toBe(0.8);
+    knobs['mat-nuoc'].set('reflectionResolution', 0.2);
+    step.apply(); // min(0.2, ∞) × 0.5 = 0.1 → sàn 0.15; núm 0.2 → hiệu lực 0.15
+    expect(scale(water)).toBe(0.15);
+  });
+
+  it('mức thấp (budget.reflection = 0): phản chiếu GIẢ, không có reflector, không nấc; thí nghiệm vẫn bật/tắt được', () => {
+    const { ctx, layers } = build({ level: 'thap', budget: { reflection: 0 } });
+    const water = layers['mat-nuoc'];
+    const [mesh] = water.objects;
+    expect(ctx.scene.children.filter((o) => o.type === 'Object3D' && o !== mesh)).toHaveLength(1); // chỉ target của đèn trăng
+    expect(water.readouts[0].get()).toBe(0);
+    expect(water.degrade).toEqual([]);
+    for (const key of ['colorNode', 'normalNode', 'emissiveNode', 'mrtNode']) expect(mesh.material[key], key).toBeTruthy();
+    for (const exp of water.experiments) {
+      exp.toggle(true);
+      exp.toggle(false);
+    }
+    const before = ctx.scene.children.length;
+    water.dispose();
+    expect(ctx.scene.children).toHaveLength(before - 1);
+  });
+
   it('dispose gỡ nước và target (2 lần vẫn an toàn)', () => {
     const { ctx, layers } = build();
     const before = ctx.scene.children.length;
```

Run: `npx vitest run tests/paintings/ao-sen-dem/mat-nuoc.test.js`
Kết quả mong đợi: FAIL, 3 test hỏng; lỗi đầu tiên: `AssertionError: expected 1 to be 0.6 // Object.is equality`.

- [ ] **Step 2: Tạo `src/paintings/ao-sen-dem/parts/mat-nuoc-gia.js`**

```js
// paintings/ao-sen-dem/parts/mat-nuoc-gia.js — của lớp Mặt nước: phản chiếu GIẢ ở mức thấp (màu trời theo hướng phản xạ + đĩa trăng), không vẽ cảnh lần hai.
import { cameraPosition, color, dot, mix, normalize, positionWorld, pow, reflect, saturate } from 'three/tsl';

const SHARPNESS = 900; // đĩa trăng phản xạ: số mũ càng lớn đĩa càng nhỏ (trăng rộng chừng 2°)
const MOON_GLOW = 2.5; // sáng quá 1 để bóng trăng trên nước còn bloom

/**
 * Máy yếu không đủ sức vẽ cả cảnh thêm một lần cho reflector. Thay vào đó, mỗi điểm trên mặt nước tự tính tia phản xạ
 * (reflect: tia từ mắt bật lên khỏi mặt nước theo pháp tuyến gợn), rồi hỏi "trời theo hướng này màu gì" bằng đúng hàm màu
 * trời của lớp Sương, cộng đĩa trăng nếu tia gần hướng trăng. Pháp tuyến gợn và noise làm tia lệch từng chút: đĩa trăng
 * vỡ thành lối trăng lấp lánh, đúng cách lối trăng thật hình thành. Cái giá: trong nước không có sen, lá hay đom đóm.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ suong: { sky: (dir: any) => any }, moon: { dir: any }, anhTrang: { glow: any } }} shared
 * @param {any} normal  pháp tuyến (thế giới) của mặt nước tại điểm đang vẽ
 */
export function fakeReflection(ctx, shared, normal) {
  const hex = ctx.palette.hex;
  const view = normalize(cameraPosition.sub(positionWorld)); // từ mặt nước tới mắt
  const ray = reflect(view.negate(), normal); // tia từ mắt, bật lên khỏi mặt nước
  const disc = pow(saturate(dot(ray, shared.moon.dir)), SHARPNESS); // saturate: cơ số không âm trước pow
  const tint = mix(color(hex.nga), color(hex.vangLaSang), 0.6); // cùng màu với trăng của lớp Ánh trăng
  return shared.suong.sky(ray).add(tint.mul(disc.mul(MOON_GLOW)).mul(shared.anhTrang.glow));
}
```

- [ ] **Step 3: `l4-mat-nuoc.js` và `meta.js`**

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
index 3377f3a..e05b5cb 100644
--- a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
+++ b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
@@ -1,4 +1,4 @@
-// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector), gợn sóng xẻ bóng trăng, lá nhấp nhô.
+// paintings/ao-sen-dem/layers/l4-mat-nuoc.js — Lớp 4 · Mặt nước: đĩa nước soi cảnh (reflector; mức thấp soi giả), gợn sóng xẻ bóng trăng, lá nhấp nhô.
 import { CircleGeometry, Mesh, MeshStandardNodeMaterial } from 'three/webgpu';
 import {
   Fn,
@@ -25,6 +25,7 @@ import {
   vec4,
 } from 'three/tsl';
 import { POND_RADIUS, makeRippleHeight } from '../shared.js';
+import { fakeReflection } from '../parts/mat-nuoc-gia.js';
 
 export const id = 'mat-nuoc';
 export const knobs = [
@@ -35,16 +36,25 @@ export const knobs = [
   { id: 'distortion', min: 0, max: 0.15, step: 0.001, value: 0.04 },
   { id: 'fresnelPower', min: 1, max: 10, step: 0.1, value: 5 },
   // Độ phân giải ảnh phản chiếu so với màn hình (cao 0.5 / vừa 0.35). Reflector đọc số này mỗi khung.
-  { id: 'reflectionResolution', via: 'js', min: 0.1, max: 1, step: 0.05, value: (env) => env.budget.reflection ?? (env.level === 'cao' ? 0.5 : 0.35) },
+  // Trần theo mức: ngoài mức cao, kéo tối đa 0.6 (vẽ cả cảnh lần hai ở độ phân giải đầy đủ là quá sức máy yếu).
+  {
+    id: 'reflectionResolution',
+    via: 'js',
+    min: 0.1,
+    max: (env) => (env.level === 'cao' ? 1 : 0.6),
+    step: 0.05,
+    value: (env) => env.budget.reflection ?? (env.level === 'cao' ? 0.5 : 0.35),
+  },
 ];
 
 const F0 = 0.03; // phản xạ khi nhìn thẳng xuống (Schlick): nước và sơn bóng đều khoảng 2–4%
+const RES_FLOOR = 0.15; // nấc 'phan-chieu' chia đôi độ phân giải phản chiếu nhưng không xuống dưới số này
 const BOB = 0.6; // lá nhô lên bằng 60% độ cao sóng
 const GLINT = 0.8; // phần phản chiếu sáng hơn mức này mới vào kênh emissive (bloom)
 
 /**
  * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
- * @param {object} shared  shared.ripples (setup của bức), shared.cot (lớp trước)
+ * @param {object} shared  shared.ripples, shared.moon (setup của bức); shared.cot, shared.anhTrang, shared.suong (lớp trước)
  */
 export function createLayer(ctx, shared) {
   const w = ctx.weight(id);
@@ -73,14 +83,24 @@ export function createLayer(ctx, shared) {
   })();
 
   // Reflector: mỗi khung render lại cả cảnh từ camera lật qua mặt nước, vào texture nhỏ hơn màn hình.
-  let scale = ctx.knobValue('reflectionResolution');
-  const refl = reflector({ resolutionScale: scale });
-  // Pháp tuyến của gương là +Z cục bộ của target: xoay −π/2 để +Z chỉ lên trời. Reflector đọc
-  // target.matrixWorld mà KHÔNG tự cập nhật: target phải nằm trong scene, nếu không ta có gương dựng đứng.
-  refl.target.rotateX(-Math.PI / 2);
-  ctx.scene.add(refl.target);
-  // Sóng làm lệch chỗ đọc ảnh phản chiếu: vòng gợn đi qua là bóng trăng bị xẻ đôi.
-  refl.uvNode = refl.uvNode.add(normal.xz.mul(ctx.knob('distortion'))); // @knob distortion
+  // Mức thấp (budget.reflection = 0) không có reflector: phản chiếu giả, tính theo công thức (parts/mat-nuoc-gia.js).
+  const fake = ctx.budget.reflection === 0;
+  let scale = ctx.knobValue('reflectionResolution'); // ý người xem (núm)
+  let cap = Infinity; // trần của máy (nấc 'phan-chieu'); hiệu lực = min(núm, trần)
+  let lowRes = false; // thí nghiệm "Độ phân giải 0.1" đang bật
+  const refl = fake ? null : reflector({ resolutionScale: scale });
+  const applyScale = () => {
+    if (refl) refl.reflector.resolutionScale = lowRes ? 0.1 : Math.min(scale, cap); // reflector đọc số này ở khung sau
+  };
+  if (refl) {
+    // Pháp tuyến của gương là +Z cục bộ của target: xoay −π/2 để +Z chỉ lên trời. Reflector đọc
+    // target.matrixWorld mà KHÔNG tự cập nhật: target phải nằm trong scene, nếu không ta có gương dựng đứng.
+    refl.target.rotateX(-Math.PI / 2);
+    ctx.scene.add(refl.target);
+    // Sóng làm lệch chỗ đọc ảnh phản chiếu: vòng gợn đi qua là bóng trăng bị xẻ đôi.
+    refl.uvNode = refl.uvNode.add(normal.xz.mul(ctx.knob('distortion'))); // @knob distortion
+  }
+  const reflection = refl ? refl.rgb : fakeReflection(ctx, shared, normal);
 
   // Hai công tắc của tab Phá (uniform, bật/tắt không biên dịch lại).
   const fresnelOn = uniform(1).setName('mat_nuoc_fresnelOn'); // "Tắt fresnel": 0 → soi như gương phẳng
@@ -90,7 +110,7 @@ export function createLayer(ctx, shared) {
   const view = normalize(cameraPosition.sub(positionWorld));
   const schlick = float(F0).add(oneMinus(saturate(dot(normal, view))).pow(ctx.knob('fresnelPower')).mul(1 - F0)); // @knob fresnelPower
   const fresnel = mix(float(1), schlick, fresnelOn);
-  const mirror = refl.rgb.mul(fresnel).mul(w).mul(oneMinus(showHeight));
+  const mirror = reflection.mul(fresnel).mul(w).mul(oneMinus(showHeight));
   // Độ cao gợn sóng (khoảng ±0.5) đổi thành xám quanh 0.5: sáng là đỉnh sóng, tối là đáy sóng.
   const height = vec3(ripple(positionWorld.xz).mul(2).add(0.5)).mul(showHeight);
 
@@ -102,9 +122,10 @@ export function createLayer(ctx, shared) {
   // Ảnh phản chiếu cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
   material.emissiveNode = mirror.add(height);
   // ...nhưng kênh MRT 'emissive' của nước CHỈ nhận phần sáng vượt GLINT: bóng trăng và bóng đom đóm
-  // tỏa nhẹ, còn cả mặt nước thì không. mrtNode chỉ an toàn vì reflector tự ẩn chính mặt nước khi
-  // chụp: material có mrtNode mà vẽ vào target KHÔNG có MRT sẽ hỏng shader (Phụ lục A).
-  material.mrtNode = mrt({ emissive: vec4(max(mirror.sub(GLINT), 0), 1) });
+  // tỏa nhẹ, còn cả mặt nước thì không. Sương không chạm tới kênh emissive, nên tự nhân (1 − hệ số sương):
+  // bóng trăng ở xa trong sương không bloom xuyên sương. mrtNode chỉ an toàn vì reflector tự ẩn chính mặt nước
+  // khi chụp (mức thấp thì không có reflector): material có mrtNode mà vẽ vào target KHÔNG có MRT sẽ hỏng shader.
+  material.mrtNode = mrt({ emissive: vec4(max(mirror.sub(GLINT), 0).mul(oneMinus(shared.suong.fogFactor)), 1) });
 
   const geometry = new CircleGeometry(POND_RADIUS, 96).rotateX(-Math.PI / 2); // đĩa nước thuộc lớp này
   const water = new Mesh(geometry, material);
@@ -114,14 +135,14 @@ export function createLayer(ctx, shared) {
   const center = attribute('instanceCenter', 'vec2');
   shared.cot.leafMaterial.positionNode = positionLocal.add(vec3(0, ripple(center).mul(BOB).mul(w), 0));
 
-  let lowRes = false; // thí nghiệm "Độ phân giải 0.1" đang bật
+  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
   let disposed = false;
   return {
     objects: [water],
     onKnob: {
       reflectionResolution: (v) => { // @knob reflectionResolution
         scale = v;
-        if (!lowRes) refl.reflector.resolutionScale = v; // reflector đọc số này ngay ở khung sau
+        applyScale();
       },
     },
     experiments: [
@@ -130,20 +151,38 @@ export function createLayer(ctx, shared) {
         id: 'lowRes',
         toggle(on) {
           lowRes = on;
-          refl.reflector.resolutionScale = on ? 0.1 : scale;
+          applyScale();
         },
       },
       { id: 'noFresnel', toggle: (on) => { fresnelOn.value = on ? 0 : 1; } },
       { id: 'heightfield', toggle: (on) => { showHeight.value = on ? 1 : 0; } },
     ],
-    readouts: [{ id: 'reflectionScale', get: () => refl.reflector.resolutionScale }],
+    readouts: [{ id: 'reflectionScale', get: () => (refl ? refl.reflector.resolutionScale : 0) }],
+    // Nấc của bộ điều chỉnh: chia đôi độ phân giải phản chiếu (không dưới 0,15). Phản chiếu giả thì không có gì để hạ.
+    degrade: refl
+      ? [{
+        id: 'phan-chieu',
+        apply() {
+          before = cap;
+          cap = Math.max(RES_FLOOR, Math.min(scale, cap) * 0.5);
+          applyScale();
+        },
+        revert() {
+          cap = before;
+          applyScale();
+        },
+      }]
+      : [],
     dispose() {
       if (disposed) return;
       disposed = true;
-      ctx.scene.remove(water, refl.target);
+      ctx.scene.remove(water);
       geometry.dispose();
       material.dispose();
-      refl.dispose(); // giải phóng render target của ảnh phản chiếu
+      if (refl) {
+        ctx.scene.remove(refl.target);
+        refl.dispose(); // giải phóng render target của ảnh phản chiếu
+      }
     },
   };
 }
```

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index fddf4cf..a6cfd12 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -61,7 +61,7 @@ export default {
     {
       id: 'mat-nuoc',
       name: 'Mặt nước',
-      files: ['paintings/ao-sen-dem/layers/l4-mat-nuoc.js'],
+      files: ['paintings/ao-sen-dem/layers/l4-mat-nuoc.js', 'paintings/ao-sen-dem/parts/mat-nuoc-gia.js'],
       poem: {
         lines: ['Vầng trăng ai xẻ làm đôi', 'Nửa in gối chiếc, nửa soi dặm trường'],
         source: 'Truyện Kiều',
```

Run: `npx vitest run tests/paintings`
Kết quả mong đợi: PASS.

- [ ] **Step 4: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  553 passed`.

```bash
git add src/paintings/ao-sen-dem/parts/mat-nuoc-gia.js src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js src/paintings/ao-sen-dem/meta.js tests/paintings/ao-sen-dem/mat-nuoc.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): mặt nước soi giả ở mức thấp (màu trời theo tia phản xạ + đĩa trăng), ánh lóe tắt dần trong sương, nấc 'phan-chieu'

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 12: Vàng lá: curl noise, núm mới, sương, trọng số 0, nấc, "Tắt additive"

**Mục tiêu:** Spec §6 Lớp 5 (GĐ 3).
- **Hướng muốn bay** = `curl(p × flowScale + trôi theo t) × speed` (thành phần đứng yếu hơn), cộng xoáy chậm quanh tâm ao; lực hút của tay giữ như GĐ 1.
- **Luật chung của đàn** nằm ở `parts/vang-la-dan.js` (hằng số `FLOCK`, Sprite, `setAdditive`), để bản CPU ở Task 13 dùng ĐÚNG luật đó.
- **Sprite trong sương:** `fog = false`, emissive × `(1 − fogFactor)` (Phụ lục A.34).
- **Trọng số 0:** không compute, giấu sprite.
- **Nấc `dom-dom`:** trần = nửa số mặc định của mức, sàn 100.
- **"Tắt additive":** blending Normal + `needsUpdate`.
- **Số đo** `count`.
- **Trần núm `count` theo mức:** min(tầng: webgpu 200.000 / webgl2 20.000, mức: cao 200.000 / vừa 50.000 / thấp 10.000). Bộ đệm cấp phát theo đúng trần đó.
- **Núm mới** `flowScale`, `speed`, `blinkRate`.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/vang-la-dan.js`
- Modify: `src/paintings/ao-sen-dem/layers/l5-vang-la.js` (thay cả file), `src/paintings/ao-sen-dem/meta.js`, `src/paintings/ao-sen-dem/content.vi.js`
- Test: `tests/paintings/ao-sen-dem/vang-la.test.js`

**Interfaces:**
- Consumes:
  - `curl` (Task 2);
  - `shared.suong.fogFactor` (Task 10);
  - `shared.attract` (setup);
  - `knobMax` là hàm của env (Task 5).
- Produces:
  - `FLOCK` (radius 40, low 0.3, high 4, maxSpeed 6, flow 0.4, lift 0.35, drift 0.05, swirl 0.012, turn 1.5, reach 10, orbit 0.8, pull 8);
  - `createFireflySprite(ctx, { cell, w, fogFactor, count }) → Sprite`; `setAdditive(sprite, additive)`;
  - l5:
    - núm `size, glow, attraction, flowScale, speed, blinkRate, count`;
    - thí nghiệm `noAdditive`;
    - số đo `count`;
    - nấc `dom-dom`.

- [ ] **Step 1: Test (hỏng: núm cũ, sprite còn nhận sương, chưa có nấc)**

Áp vào `tests/paintings/ao-sen-dem/vang-la.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/vang-la.test.js b/tests/paintings/ao-sen-dem/vang-la.test.js
index 8244032..ff42bb5 100644
--- a/tests/paintings/ao-sen-dem/vang-la.test.js
+++ b/tests/paintings/ao-sen-dem/vang-la.test.js
@@ -1,20 +1,25 @@
 // tests/paintings/ao-sen-dem/vang-la.test.js — Lớp 5 · Vàng lá (bản đơn giản): compute trên GPU, một Sprite, hút/đẩy theo cử chỉ.
 import { describe, it, expect } from 'vitest';
-import { AdditiveBlending } from 'three/webgpu';
+import { AdditiveBlending, NormalBlending } from 'three/webgpu';
 import meta from '../../../src/paintings/ao-sen-dem/meta.js';
 import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
 import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';
 import { buildPainting } from '../../helpers/fake-ctx.js';
+import { knobMax } from '../../../src/engine/gpu/knob-set.js';
 
 const build = (options) => buildPainting(painting, meta, { until: 'vang-la', ...options });
 
 describe('l5-vang-la', () => {
-  it('núm tĩnh size, glow, attraction (uniform) và count (js, trần theo tầng)', () => {
+  it('núm tĩnh: size, glow, attraction, flowScale, speed, blinkRate (uniform) và count (js, trần theo tầng)', () => {
     expect(vangLa.id).toBe('vang-la');
     expect(vangLa.knobs.map((k) => [k.id, k.via ?? 'uniform'])).toEqual([
-      ['size', 'uniform'], ['glow', 'uniform'], ['attraction', 'uniform'], ['count', 'js'],
+      ['size', 'uniform'], ['glow', 'uniform'], ['attraction', 'uniform'], ['flowScale', 'uniform'], ['speed', 'uniform'],
+      ['blinkRate', 'uniform'], ['count', 'js'],
     ]);
-    expect(vangLa.knobs.find((k) => k.id === 'count').max).toEqual({ webgpu: 200000, webgl2: 20000 });
+    // Trần theo tầng VÀ theo mức: máy yếu không bị kéo quá sức.
+    const count = vangLa.knobs.find((k) => k.id === 'count');
+    const max = (tier, level) => knobMax(count, { tier, level });
+    expect([max('webgpu', 'cao'), max('webgpu', 'vua'), max('webgl2', 'vua'), max('webgl2', 'thap')]).toEqual([200000, 50000, 20000, 10000]);
   });
 
   it('kernel khởi tạo chạy lúc dựng trên CẢ bộ đệm (trần của tầng); WebGL2 chạy hai lần; mỗi update chạy kernel bước', () => {
@@ -34,13 +39,14 @@ describe('l5-vang-la', () => {
     expect(calls[2][0]).toBe(calls[1][0]);
   });
 
-  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, có emissiveNode; số con theo mức', () => {
+  it('một Sprite vẽ cả đàn: cộng dồn, không ghi depth, không cull, không nhận sương (tự mờ đi), có emissiveNode; số con theo mức', () => {
     const [sprite] = build().layers['vang-la'].objects;
     expect(sprite.isSprite).toBe(true);
     expect(sprite.count).toBe(3000);
     expect(sprite.frustumCulled).toBe(false);
     expect(sprite.material.blending).toBe(AdditiveBlending);
     expect(sprite.material.depthWrite).toBe(false);
+    expect(sprite.material.fog).toBe(false);
     expect(sprite.material.emissiveNode).toBeTruthy();
     expect(build({ level: 'thap' }).layers['vang-la'].objects[0].count).toBe(600);
     expect(build({ budget: { fireflies: 700 } }).layers['vang-la'].objects[0].count).toBe(700);
@@ -60,6 +66,54 @@ describe('l5-vang-la', () => {
     expect(ctx.renderer.compute.mock.calls[2][0]).toBe(step);
   });
 
+  it('trọng số 0: không chạy compute và giấu sprite (không tốn draw call); bật lại thì tính tiếp', () => {
+    const { ctx, layers } = build();
+    const layer = layers['vang-la'];
+    const [sprite] = layer.objects;
+    const calls = ctx.renderer.compute.mock.calls;
+    ctx.weights.set('vang-la', 0);
+    layer.update(1 / 60, 1 / 60);
+    expect([calls.length, sprite.visible]).toEqual([1, false]);
+    ctx.weights.set('vang-la', 0.5);
+    layer.update(1 / 60, 2 / 60);
+    expect([calls.length, sprite.visible]).toEqual([2, true]);
+  });
+
+  it("nấc 'dom-dom': trần = nửa số mặc định của mức; hiệu lực = min(núm, trần); số đo đọc theo", () => {
+    const { ctx, layers, knobs } = build();
+    const layer = layers['vang-la'];
+    const [step] = layer.degrade;
+    const count = () => layer.readouts.find((r) => r.id === 'count').get();
+    layer.update(1 / 60, 1 / 60);
+    const kernel = ctx.renderer.compute.mock.calls[1][0];
+    expect(step.id).toBe('dom-dom');
+    step.apply();
+    expect([count(), kernel.count]).toEqual([1500, 1500]);
+    knobs['vang-la'].set('count', 50000); // người xem kéo núm lên: trần vẫn giữ
+    expect(count()).toBe(1500);
+    knobs['vang-la'].set('count', 800); // núm dưới trần: theo núm
+    expect(count()).toBe(800);
+    step.revert();
+    knobs['vang-la'].set('count', 50000);
+    expect([count(), kernel.count]).toEqual([50000, 50000]);
+    const low = build({ level: 'thap' }).layers['vang-la'];
+    low.degrade[0].apply();
+    expect(low.readouts[0].get()).toBe(300);
+  });
+
+  it('"Tắt additive": blending thường rồi trả lại, báo cần biên dịch lại một lần', () => {
+    const [layer] = [build().layers['vang-la']];
+    const [sprite] = layer.objects;
+    const [exp] = layer.experiments;
+    expect(exp.id).toBe('noAdditive');
+    const version = sprite.material.version;
+    exp.toggle(true);
+    expect(sprite.material.blending).toBe(NormalBlending);
+    expect(sprite.material.version).toBeGreaterThan(version);
+    exp.toggle(false);
+    expect(sprite.material.blending).toBe(AdditiveBlending);
+  });
+
   it('dispose gỡ sprite (2 lần vẫn an toàn)', () => {
     const { ctx, layers } = build();
     const [sprite] = layers['vang-la'].objects;
```

Run: `npx vitest run tests/paintings/ao-sen-dem/vang-la.test.js`
Kết quả mong đợi: FAIL, 5 test hỏng; lỗi đầu tiên: `AssertionError: expected [ [ 'size', 'uniform' ], …(3) ] to deeply equal [ [ 'size', 'uniform' ], …(6) ]`.

- [ ] **Step 2: Tạo `src/paintings/ao-sen-dem/parts/vang-la-dan.js`**

```js
// paintings/ao-sen-dem/parts/vang-la-dan.js — của lớp Vàng lá: luật chung của đàn đom đóm (GPU và CPU cùng dùng) và Sprite vẽ cả đàn.
import { AdditiveBlending, NormalBlending, Sprite, SpriteNodeMaterial } from 'three/webgpu';
import { color, float, fract, oneMinus, shapeCircle, sin, smoothstep, vec3 } from 'three/tsl';

/**
 * Luật bay, dùng chung cho kernel GPU (l5-vang-la.js) và bản JS (vang-la-cpu.js): hai bên tính CÙNG một việc,
 * nên "CPU vs GPU" so đúng cái giá của việc tính, không phải hai cách bay khác nhau.
 */
export const FLOCK = Object.freeze({
  radius: 40, // đàn lượn trong đĩa bán kính này
  low: 0.3, // và trong khoảng độ cao [low, high] trên mặt nước
  high: 4,
  maxSpeed: 6, // bung ra nhanh cỡ nào cũng không văng khỏi ao
  flow: 0.4, // curl noise (độ lớn vài đơn vị) nhân hệ số này thành vận tốc muốn bay
  lift: 0.35, // dòng xoáy theo phương đứng yếu hơn: đom đóm trôi ngang là chính
  drift: 0.05, // trường curl trôi lên theo thời gian (đơn vị noise mỗi giây): dòng bay đổi dần
  swirl: 0.012, // xoáy chậm quanh tâm ao
  turn: 1.5, // quán tính: mỗi giây vận tốc ngả chừng này phần về hướng muốn bay
  reach: 10, // lực của tay giảm theo exp(−khoảng cách / reach)
  orbit: 0.8, // thành phần bay vòng quanh tay
  pull: 8, // hệ số của lực hút/đẩy
});

/**
 * MỘT Sprite vẽ cả đàn (instancing): mỗi bản sao đọc vị trí và pha từ `cell` (vec4: xyz vị trí, w pha nháy),
 * tức một bộ đệm GPU (compute) hay một thuộc tính instance do CPU ghi. Mỗi con nháy theo nhịp riêng, chỉ phát sáng,
 * cộng dồn (additive), và tắt dần trong sương.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ cell: any, w: any, fogFactor: any, count: number }} p
 */
export function createFireflySprite(ctx, { cell, w, fogFactor, count }) {
  const material = new SpriteNodeMaterial({ transparent: true, depthWrite: false, blending: AdditiveBlending });
  // fog của three trộn MÀU ĐẦU RA về màu sương (Phụ lục A.34): với additive, mỗi con sẽ cộng thêm một đĩa màu sương.
  // Nên tắt fog và tự nhân (1 − hệ số sương): trong sương dày, đom đóm mờ đi thay vì hóa đốm sương.
  material.fog = false;
  material.positionNode = cell.xyz;
  const phase = cell.w;
  const rate = float(1.2).add(fract(phase.mul(7.31)).mul(1.8)).mul(ctx.knob('blinkRate')); // @knob blinkRate
  // Chỉ lóe khi sin > 0.75 (khoảng 1/4 chu kỳ): cả nghìn con cùng sáng thì bloom phủ vàng kín khung.
  const blink = smoothstep(0.75, 1, sin(ctx.u.time.mul(rate).add(phase.mul(Math.PI * 2))));
  const shape = shapeCircle(); // đĩa tròn trên ô vuông của sprite
  const gold = color(ctx.palette.hex.vangLaSang);
  material.colorNode = vec3(0); // chỉ phát sáng: không cộng thêm màu trắng mặc định của sprite
  material.emissiveNode = gold.mul(ctx.knob('glow')).mul(blink).mul(shape).mul(w).mul(oneMinus(fogFactor)); // @knob glow
  material.opacityNode = shape.mul(w); // trọng số 0 → tắt hẳn
  material.scaleNode = ctx.knob('size'); // @knob size

  const sprite = new Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false; // bounding của sprite không biết vị trí nằm trong bộ đệm
  return sprite;
}

/**
 * Thí nghiệm "Tắt additive": blending thường thì con vẽ sau che con vẽ trước (bất kể xa gần, vì không ghi độ sâu),
 * và con đang tắt thành đốm tối. Blending nằm trong cache key: đổi là biên dịch lại một lần.
 * @param {import('three/webgpu').Sprite} sprite
 * @param {boolean} additive
 */
export function setAdditive(sprite, additive) {
  sprite.material.blending = additive ? AdditiveBlending : NormalBlending;
  sprite.material.needsUpdate = true;
}
```

- [ ] **Step 3: Thay `src/paintings/ao-sen-dem/layers/l5-vang-la.js`**

```js
// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá: đom đóm tính trên GPU (compute), trôi theo curl noise, tụ quanh tay, tắt trong sương.
import {
  Fn,
  clamp,
  cos,
  exp,
  float,
  hash,
  instanceIndex,
  instancedArray,
  length,
  max,
  min,
  mix,
  sin,
  sqrt,
  vec3,
  vec4,
} from 'three/tsl';
import { curl } from '../../../lib/tsl/noise.js';
import { FLOCK, createFireflySprite, setAdditive } from '../parts/vang-la-dan.js';

export const id = 'vang-la';

const COUNT = { cao: 3000, vua: 1500, thap: 600 }; // số con mặc định theo mức (spec §6)
/** Trần theo tầng: WebGPU compute chạy hàng trăm nghìn con; WebGL2 (transform feedback) thì ít hơn nhiều. */
const TIER_MAX = { webgpu: 200000, webgl2: 20000 };
/** Trần theo mức: máy yếu (điện thoại) không bị kéo quá sức, dù người xem kéo núm tới đâu. */
const LEVEL_MAX = { cao: 200000, vua: 50000, thap: 10000 };
const countMax = (env) => Math.min(TIER_MAX[env.tier], LEVEL_MAX[env.level]);
const COUNT_FLOOR = 100; // sprite có count > 1 nằm trong cache key của three: không bao giờ xuống 0 hay 1

export const knobs = [
  { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
  { id: 'glow', min: 0, max: 10, step: 0.1, value: 3 },
  { id: 'attraction', min: 0, max: 3, step: 0.01, value: 1 },
  { id: 'flowScale', min: 0.02, max: 0.6, step: 0.01, value: 0.12 },
  { id: 'speed', min: 0, max: 3, step: 0.05, value: 1 },
  { id: 'blinkRate', min: 0.1, max: 4, step: 0.05, value: 1 },
  { id: 'count', via: 'js', min: COUNT_FLOOR, max: countMax, step: 100, value: (env) => env.budget.fireflies ?? COUNT[env.level] },
];

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  shared.attract (setup của bức): điểm hút và lực hút theo cử chỉ; shared.suong.fogFactor (lớp Sương)
 */
export function createLayer(ctx, shared) {
  let wanted = ctx.knobValue('count'); // ý người xem (núm)
  const levelCount = wanted; // số mặc định của mức: nấc 'dom-dom' hạ trần về một nửa số này
  let cap = Infinity; // trần của máy (nấc); số con được tính và vẽ = min(núm, trần)
  // Cấp phát theo TRẦN của núm một lần (200k con × 2 ô vec4 = 6,4 MB ở mức cao): lúc chạy, núm count chỉ đổi
  // số con được tính và được vẽ, không tạo bộ đệm mới, nên kéo núm không khựng.
  const capacity = countMax(ctx);
  const w = ctx.weight(id);
  const t = ctx.u.time; // đồng hồ của xưởng: ?freeze cho ra đúng cùng một đàn đom đóm
  const dt = ctx.u.delta;

  // Hai bộ đệm nằm trên GPU, mỗi con một ô vec4. Mỗi kernel chỉ đụng 2 bộ đệm:
  // WebGL2 chạy compute bằng transform feedback và chỉ cho tối đa 4 bộ đệm mỗi kernel.
  const posPhase = instancedArray(capacity, 'vec4'); // xyz = vị trí, w = pha nhấp nháy [0, 1)
  const velSeed = instancedArray(capacity, 'vec4'); // xyz = vận tốc, w = hạt giống riêng [0, 1)

  // Kernel khởi tạo: mỗi luồng GPU lo MỘT con. hash(instanceIndex) là ngẫu nhiên tất định,
  // √u cho mật độ đều theo diện tích đĩa. Chạy một lần ngay lúc dựng lớp.
  const init = Fn(() => {
    const i = instanceIndex;
    const r = sqrt(hash(i)).mul(FLOCK.radius);
    const a = hash(i.add(1)).mul(Math.PI * 2);
    const y = mix(FLOCK.low, FLOCK.high, hash(i.add(2)));
    posPhase.element(i).assign(vec4(cos(a).mul(r), y, sin(a).mul(r), hash(i.add(3))));
    velSeed.element(i).assign(vec4(0, 0, 0, hash(i.add(4))));
  })().compute(capacity); // khởi tạo CẢ bộ đệm: tăng count lúc chạy thì con mới đã có chỗ đứng
  ctx.renderer.compute(init);
  // WebGL2 chạy compute bằng transform feedback: mỗi bộ đệm có HAI bản (một để đọc, một để ghi, đổi vai sau mỗi lần
  // chạy), và kernel bước chỉ ghi [0, count). Chạy init lần nữa để bản kia cũng đầy (Phụ lục A.29): nếu không, tăng
  // count lúc chạy thì con mới đọc từ bản chưa từng được ghi, cả đám cùng xuất phát ở (0, 0, 0).
  if (ctx.tier === 'webgl2') ctx.renderer.compute(init);

  // Kernel bước (mỗi khung): mỗi con chỉ đọc và ghi ĐÚNG ô của mình — trên WebGL2,
  // element(i) luôn trả ô của chính luồng đang chạy, nên không đọc được hàng xóm.
  const step = Fn(() => {
    const cell = posPhase.element(instanceIndex);
    const vs = velSeed.element(instanceIndex);
    const p = cell.xyz.toVar();
    // Hướng muốn bay: dòng curl noise (không phân kỳ: đàn trôi thành dòng xoáy mềm, không dồn một chỗ), trôi dần theo
    // thời gian, cộng một vòng xoáy chậm quanh tâm ao.
    const field = p.mul(ctx.knob('flowScale')).add(vec3(0, t.mul(FLOCK.drift), 0)); // @knob flowScale
    const flow = curl(field).mul(vec3(1, FLOCK.lift, 1)).mul(ctx.knob('speed')).mul(FLOCK.flow); // @knob speed
    const swirl = vec3(p.z.negate(), 0, p.x).mul(FLOCK.swirl);
    // Quán tính: vận tốc chỉ ngả dần về hướng muốn bay, nên đường bay mềm, không giật.
    const v = mix(vs.xyz, flow.add(swirl), min(dt.mul(FLOCK.turn), 1)).toVar();
    // Tay người xem: lực > 0 hút về điểm chạm và kéo bay vòng quanh; lực < 0 đẩy ra (tản, bung).
    // Chỉ con ở gần mới chịu lực (giảm theo exp của khoảng cách). Lực là gia tốc: cộng thẳng vào vận tốc.
    const toward = shared.attract.point.sub(p);
    const dist = max(length(toward), 0.001);
    const dir = toward.div(dist);
    const orbit = vec3(dir.z.negate(), 0, dir.x).mul(FLOCK.orbit);
    const pull = dir.add(orbit).mul(shared.attract.strength).mul(exp(dist.div(FLOCK.reach).negate()));
    v.addAssign(pull.mul(ctx.knob('attraction')).mul(FLOCK.pull).mul(dt)); // @knob attraction
    v.assign(v.mul(min(float(1), float(FLOCK.maxSpeed).div(max(length(v), 0.001)))));
    p.addAssign(v.mul(dt));
    // Giữ đàn trong đĩa bán kính FLOCK.radius và trong khoảng độ cao.
    const k = min(float(1), float(FLOCK.radius).div(max(length(p.xz), 0.001)));
    cell.assign(vec4(p.x.mul(k), clamp(p.y, FLOCK.low, FLOCK.high), p.z.mul(k), cell.w));
    vs.assign(vec4(v, vs.w));
  })().compute(wanted);

  // Hiển thị: MỘT Sprite vẽ `count` bản sao; vị trí đọc thẳng bộ đệm compute qua toAttribute()
  // (thành vertex attribute, không cần storage buffer ở vertex stage).
  const sprite = createFireflySprite(ctx, { cell: posPhase.toAttribute(), w, fogFactor: shared.suong.fogFactor, count: wanted });
  ctx.scene.add(sprite);

  /** Số con được tính và được vẽ = min(núm, trần). Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
  const applyCount = () => {
    const n = Math.min(wanted, cap);
    step.count = n; // WebGPU tính lại số nhóm dispatch, WebGL2 vẽ ít/nhiều đỉnh hơn
    sprite.count = n;
  };
  let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
  let disposed = false;
  return {
    objects: [sprite],
    update() {
      // Trọng số 0: đom đóm tắt hẳn, nên không tính (bỏ compute) và không vẽ (visible không nằm trong cache key).
      const on = w.value > 0;
      sprite.visible = on;
      if (on) ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
    },
    onKnob: {
      count: (v) => { // @knob count
        wanted = v;
        applyCount();
      },
    },
    experiments: [{ id: 'noAdditive', toggle: (on) => setAdditive(sprite, !on) }],
    readouts: [{ id: 'count', get: () => sprite.count }],
    // Nấc của bộ điều chỉnh: trần số con = nửa số mặc định của mức (không dưới 100).
    degrade: [
      {
        id: 'dom-dom',
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
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(sprite);
      sprite.material.dispose();
      init.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
      step.dispose();
    },
  };
}
```

- [ ] **Step 4: `meta.js` (file mới của lớp), `content.vi.js` (nhãn núm mới, thí nghiệm, số đo)**

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index a6cfd12..75fdd4a 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -68,7 +68,11 @@ export default {
         author: 'Nguyễn Du',
       },
     },
-    { id: 'vang-la', name: 'Vàng lá', files: ['paintings/ao-sen-dem/layers/l5-vang-la.js'] },
+    {
+      id: 'vang-la',
+      name: 'Vàng lá',
+      files: ['paintings/ao-sen-dem/layers/l5-vang-la.js', 'paintings/ao-sen-dem/parts/vang-la-dan.js'],
+    },
     phuBong,
   ],
   // Từ vựng riêng của bức: test luật cấm xưởng (engine/, ui/, lib/tsl/) nhắc tới.
```

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index b9460b3..3363b21 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -198,27 +198,40 @@ export default {
     'vang-la': {
       understand:
         'Đom đóm ở đây không do CPU tính. Vị trí và vận tốc của từng con nằm trong hai bộ đệm trên GPU; mỗi '
-        + 'khung, một compute shader chạy song song hàng nghìn luồng, mỗi luồng lo đúng một con: lượn theo nhịp '
-        + 'riêng, xoáy chậm quanh ao, bị tay người xem hút lại hay đẩy ra. Rồi MỘT Sprite vẽ cả đàn, đọc vị trí '
-        + 'thẳng từ bộ đệm mà không đi qua CPU. Đom đóm chỉ phát sáng (emissive), cộng dồn màu lên nhau '
-        + '(additive), và nhấp nháy theo sin của đồng hồ cảnh. Phần phát sáng đi vào bloom của lớp Phủ bóng, '
-        + 'nên chúng tỏa vàng lá.',
+        + 'khung, một compute shader chạy song song hàng nghìn luồng, mỗi luồng lo đúng một con: trôi theo dòng '
+        + 'curl noise (một trường xoáy không dồn về chỗ nào), bị tay người xem hút lại hay đẩy ra. Rồi MỘT Sprite '
+        + 'vẽ cả đàn, đọc vị trí thẳng từ bộ đệm mà không đi qua CPU. Đom đóm chỉ phát sáng (emissive), cộng dồn '
+        + 'màu lên nhau (additive), nhấp nháy theo đồng hồ cảnh, và mờ đi trong sương. Phần phát sáng đi vào '
+        + 'bloom của lớp Phủ bóng, nên chúng tỏa vàng lá.',
       diagram: vangLaDiagram,
       learned: [
         'Compute shader: GPU chạy cùng một hàm trên hàng nghìn phần tử cùng lúc.',
         'Dữ liệu ở lại trên GPU: bộ đệm vừa được tính vừa được vẽ.',
+        'Curl noise: lấy curl của một trường noise để có dòng chảy không phân kỳ.',
         'Additive blending: ánh sáng cộng dồn, không che nhau.',
       ],
       readMore: [
         { title: 'Ví dụ three.js: hạt tính bằng compute (WebGPU)', url: 'https://threejs.org/examples/#webgpu_compute_particles' },
         { title: 'WebGPU Fundamentals · Compute shader', url: 'https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html' },
+        { title: 'Bridson · Curl-noise cho mô phỏng dòng chảy (SIGGRAPH 2007)', url: 'https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf' },
       ],
       knobs: {
         size: 'Cỡ đom đóm',
         glow: 'Độ sáng',
         attraction: 'Lực hút của tay',
+        flowScale: 'Cỡ dòng xoáy (nhỏ là xoáy to)',
+        speed: 'Tốc độ trôi',
+        blinkRate: 'Nhịp nháy',
         count: 'Số con',
       },
+      experiments: {
+        noAdditive: {
+          label: 'Tắt additive',
+          explain: 'Bỏ phép cộng dồn ánh sáng: con vẽ sau che con vẽ trước, bất kể xa gần, và con đang tắt thành đốm '
+            + 'tối. Hạt phát sáng cần additive vì ánh sáng không che nhau.',
+        },
+      },
+      readouts: { count: 'Số con đang vẽ' },
     },
 
     // Lớp dùng chung: chữ viết trung tính cho mọi bức. Muốn ví dụ riêng của ao sen thì ghi đè bằng spread ở đây.
```

Run: `npx vitest run tests/paintings`
Kết quả mong đợi: PASS.

- [ ] **Step 5: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  556 passed`.

```bash
git add src/paintings/ao-sen-dem/parts/vang-la-dan.js src/paintings/ao-sen-dem/layers/l5-vang-la.js src/paintings/ao-sen-dem/meta.js src/paintings/ao-sen-dem/content.vi.js tests/paintings/ao-sen-dem/vang-la.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): Vàng lá trôi theo curl noise (núm flowScale, speed, blinkRate), tắt dần trong sương, bỏ compute khi trọng số 0, nấc 'dom-dom', "Tắt additive", số đo số con

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 13: Vàng lá: bản CPU và thí nghiệm "CPU vs GPU"

**Mục tiêu:** Spec §6 Lớp 5 "Biến thể CPU".
- **Cùng luật bay** (`FLOCK`), nhưng tính bằng JS:
  - noise gradient 3D "improved noise" với bảng hoán vị xáo theo `mulberry32`;
  - curl bằng sai phân trung tâm, như `lib/tsl/noise.js#curl`: 18 lần gọi noise mỗi con mỗi khung.
- **Tối đa 5.000 con** (Phụ lục A.39 có số đo: 3.000 con khoảng 2 ms JS mỗi khung).
- **Hiển thị:** một Sprite thứ hai, đọc `InstancedBufferAttribute` qua `instancedDynamicBufferAttribute` (A.37). Sprite này dựng khi thí nghiệm bật lần đầu, rồi giữ lại; bật/tắt chỉ đổi đàn nào hiện và phía nào tính.
- **Thí nghiệm `cpu`** kiểu `compare`: bàn thợ đo ms khung và ms CPU của hai trạng thái.

**Files:**
- Create: `src/paintings/ao-sen-dem/parts/vang-la-cpu.js`, `tests/paintings/ao-sen-dem/vang-la-cpu.test.js`
- Modify: `src/paintings/ao-sen-dem/layers/l5-vang-la.js`, `src/paintings/ao-sen-dem/meta.js`, `src/paintings/ao-sen-dem/content.vi.js`
- Test: `tests/paintings/ao-sen-dem/vang-la.test.js`

**Interfaces:**
- Consumes: `FLOCK`, `createFireflySprite`, `setAdditive` (Task 12); `mulberry32` (`lib/random.js`).
- Produces:
  - `CPU_MAX = 5000`; `makeNoise(seed) → (x, y, z) => number`; `makeCurl(noise) → (x, y, z, out) => out`;
  - `createCpuFlock(ctx, { w, fogFactor, attract, knobs, count }) → { sprite, cells, setCount(n), step(dt, t), dispose() }`;
  - l5: thí nghiệm `cpu` (compare).

- [ ] **Step 1: Test (hỏng: chưa có `vang-la-cpu.js`)**

Tạo `tests/paintings/ao-sen-dem/vang-la-cpu.test.js`:
```js
// tests/paintings/ao-sen-dem/vang-la-cpu.test.js — bản CPU của đàn đom đóm: noise JS, curl không phân kỳ, luật bay giữ đàn trong ao.
import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three/webgpu';
import { float, uniform } from 'three/tsl';
import { CPU_MAX, createCpuFlock, makeCurl, makeNoise } from '../../../src/paintings/ao-sen-dem/parts/vang-la-cpu.js';
import { FLOCK } from '../../../src/paintings/ao-sen-dem/parts/vang-la-dan.js';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import { makeEngineCtx } from '../../helpers/fake-ctx.js';
import { createKnobs } from '../../../src/engine/gpu/knob-set.js';
import * as vangLa from '../../../src/paintings/ao-sen-dem/layers/l5-vang-la.js';

describe('makeNoise (noise gradient 3D bằng JS)', () => {
  it('tất định theo hạt giống, trong [−1, 1], bằng 0 ở mọi điểm lưới nguyên, liền mạch', () => {
    const a = makeNoise(7);
    const b = makeNoise(7);
    for (let i = 0; i < 200; i++) {
      const [x, y, z] = [i * 0.37, i * 0.11 - 5, 3 - i * 0.23];
      expect(a(x, y, z)).toBe(b(x, y, z));
      expect(Math.abs(a(x, y, z))).toBeLessThanOrEqual(1);
      expect(Math.abs(a(x, y, z) - a(x + 1e-4, y, z))).toBeLessThan(1e-3);
    }
    expect(a(3, -2, 5)).toBe(0);
    expect(makeNoise(8)(0.5, 0.5, 0.5)).not.toBe(a(0.5, 0.5, 0.5));
  });
});

describe('makeCurl', () => {
  it('trường curl không phân kỳ: div ≈ 0 (sai phân của sai phân), trong khi bản thân noise thì không', () => {
    const noise = makeNoise(3);
    const curl = makeCurl(noise);
    const at = (x, y, z) => curl(x, y, z, new Float64Array(3));
    const h = 0.05;
    for (const [x, y, z] of [[0.3, 1.7, -2.2], [4.1, 0.2, 0.9], [-3.3, 2.5, 1.1]]) {
      const div = (at(x + h, y, z)[0] - at(x - h, y, z)[0] + at(x, y + h, z)[1] - at(x, y - h, z)[1]
        + at(x, y, z + h)[2] - at(x, y, z - h)[2]) / (2 * h);
      expect(Math.abs(div)).toBeLessThan(0.05);
    }
  });
});

describe('createCpuFlock', () => {
  const setupFlock = (count = 2000) => {
    const ctx = makeEngineCtx(meta);
    const attract = { point: uniform(new Vector3(5, 1.2, 5)), strength: uniform(0) };
    const knobs = createKnobs(vangLa.id, vangLa.knobs, ctx.env);
    Object.assign(ctx, { knob: knobs.knob });
    const flock = createCpuFlock(ctx, { w: float(1), fogFactor: float(0), attract, knobs: knobs.uniforms, count });
    return { flock, attract };
  };
  const cells = (flock) => flock.cells;

  it('một Sprite đọc thuộc tính instance do CPU ghi; số con kẹp ở 5.000 (thí nghiệm không ép máy yếu quá sức)', () => {
    const { flock } = setupFlock(50000);
    expect(CPU_MAX).toBe(5000);
    expect(flock.sprite.count).toBe(5000);
    flock.setCount(300);
    expect(flock.sprite.count).toBe(300);
  });

  it('mỗi bước: số hữu hạn, đàn ở trong đĩa bán kính 40 và trong khoảng cao [0,3; 4], kể cả khi tay đẩy mạnh', () => {
    const { flock, attract } = setupFlock();
    attract.strength.value = -1.5;
    for (let f = 0; f < 240; f++) flock.step(1 / 60, f / 60);
    const a = cells(flock);
    for (let i = 0; i < 2000; i++) {
      const [x, y, z] = [a[i * 4], a[i * 4 + 1], a[i * 4 + 2]];
      expect(Number.isFinite(x + y + z)).toBe(true);
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(FLOCK.radius + 1e-3);
      expect(y).toBeGreaterThanOrEqual(FLOCK.low);
      expect(y).toBeLessThanOrEqual(FLOCK.high);
    }
  });

  it('giữ tay (lực > 0) thì đàn quanh tay dồn lại gần hơn', () => {
    const { flock, attract } = setupFlock();
    const near = () => {
      const a = cells(flock);
      let n = 0;
      for (let i = 0; i < 2000; i++) if (Math.hypot(a[i * 4] - 5, a[i * 4 + 2] - 5) < 6) n += 1;
      return n;
    };
    const before = near();
    attract.strength.value = 1;
    for (let f = 0; f < 180; f++) flock.step(1 / 60, f / 60);
    expect(near()).toBeGreaterThan(before);
  });
});
```

Áp vào `tests/paintings/ao-sen-dem/vang-la.test.js`:
```diff
diff --git a/tests/paintings/ao-sen-dem/vang-la.test.js b/tests/paintings/ao-sen-dem/vang-la.test.js
index ff42bb5..42bfc56 100644
--- a/tests/paintings/ao-sen-dem/vang-la.test.js
+++ b/tests/paintings/ao-sen-dem/vang-la.test.js
@@ -102,10 +102,9 @@ describe('l5-vang-la', () => {
   });
 
   it('"Tắt additive": blending thường rồi trả lại, báo cần biên dịch lại một lần', () => {
-    const [layer] = [build().layers['vang-la']];
+    const layer = build().layers['vang-la'];
     const [sprite] = layer.objects;
-    const [exp] = layer.experiments;
-    expect(exp.id).toBe('noAdditive');
+    const exp = layer.experiments.find((e) => e.id === 'noAdditive');
     const version = sprite.material.version;
     exp.toggle(true);
     expect(sprite.material.blending).toBe(NormalBlending);
@@ -114,6 +113,32 @@ describe('l5-vang-la', () => {
     expect(sprite.material.blending).toBe(AdditiveBlending);
   });
 
+  it('"CPU vs GPU" (compare): lần bật đầu dựng đàn CPU (một Sprite thứ hai, giữ lại); bật thì JS tính thay compute, tối đa 5.000 con', () => {
+    const { ctx, layers, knobs } = build();
+    const layer = layers['vang-la'];
+    const exp = layer.experiments.find((e) => e.id === 'cpu');
+    expect(exp.kind).toBe('compare');
+    const count = () => layer.readouts.find((r) => r.id === 'count').get();
+    const children = ctx.scene.children.length;
+    exp.toggle(true);
+    expect(ctx.scene.children).toHaveLength(children + 1);
+    const [gpuSprite, cpuSprite] = layer.objects;
+    expect([gpuSprite.visible, cpuSprite.visible]).toEqual([false, true]);
+    const computes = ctx.renderer.compute.mock.calls.length;
+    layer.update(1 / 60, 1 / 60);
+    expect(ctx.renderer.compute.mock.calls).toHaveLength(computes); // CPU tính: không gọi compute
+    knobs['vang-la'].set('count', 50000);
+    expect(count()).toBe(5000);
+    exp.toggle(false);
+    expect([gpuSprite.visible, cpuSprite.visible, count()]).toEqual([true, false, 50000]);
+    layer.update(1 / 60, 2 / 60);
+    expect(ctx.renderer.compute.mock.calls).toHaveLength(computes + 1);
+    exp.toggle(true); // bật lại: dùng lại đàn CPU cũ, không dựng thêm
+    expect(ctx.scene.children).toHaveLength(children + 1);
+    layer.dispose();
+    expect(ctx.scene.children).toHaveLength(children - 1);
+  });
+
   it('dispose gỡ sprite (2 lần vẫn an toàn)', () => {
     const { ctx, layers } = build();
     const [sprite] = layers['vang-la'].objects;
```

Run: `npx vitest run tests/paintings/ao-sen-dem/vang-la-cpu.test.js tests/paintings/ao-sen-dem/vang-la.test.js`
Kết quả mong đợi: FAIL, 1 test hỏng; lỗi đầu tiên: `Error: Cannot find module '…/src/paintings/ao-sen-dem/parts/vang-la-cpu.js'`.

- [ ] **Step 2: Tạo `src/paintings/ao-sen-dem/parts/vang-la-cpu.js`**

```js
// paintings/ao-sen-dem/parts/vang-la-cpu.js — của lớp Vàng lá: cùng luật bay nhưng tính bằng JS trên CPU (thí nghiệm "CPU vs GPU", đường lùi).
import { DynamicDrawUsage, InstancedBufferAttribute } from 'three/webgpu';
import { instancedDynamicBufferAttribute } from 'three/tsl';
import { mulberry32 } from '../../../lib/random.js';
import { FLOCK, createFireflySprite } from './vang-la-dan.js';

/**
 * CPU tính tối đa chừng này con. Đo trên máy tính (GĐ 3): 3.000 con tốn chừng 2 ms JS mỗi khung (bản GPU: gần 0),
 * 20.000 con chừng 10 ms; điện thoại chậm hơn vài lần. Trần thấp để thí nghiệm không ép máy yếu quá sức.
 */
export const CPU_MAX = 5000;
const SEED = 20260930;
const EPS = 0.1; // bước sai phân của curl (cùng số với lib/tsl/noise.js#curl)
const OFFSETS = [[0, 0, 0], [31.4, 17.3, 47.9], [73.1, 59.2, 11.7]]; // ba kênh noise lệch nhau: một trường vec3

/**
 * Noise gradient 3D ("improved noise" của Ken Perlin, 2002) viết bằng JS: bảng hoán vị xáo theo hạt giống, mỗi góc
 * của ô lưới một gradient, nội suy bằng đường cong mềm 6t⁵ − 15t⁴ + 10t³. Trả số trong khoảng [−1, 1].
 * Cùng họ với mx_noise_float của GPU (Perlin), không cần trùng từng số: hai bên chỉ cần tốn công như nhau.
 * @param {number} seed
 * @returns {(x: number, y: number, z: number) => number}
 */
export function makeNoise(seed) {
  const rng = mulberry32(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t, a, b) => a + t * (b - a);
  const grad = (h, x, y, z) => {
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
  };
  return (x, y, z) => {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const Z = Math.floor(z);
    const fx = x - X;
    const fy = y - Y;
    const fz = z - Z;
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const A = p[X & 255] + (Y & 255);
    const B = p[(X + 1) & 255] + (Y & 255);
    const AA = p[A] + (Z & 255);
    const AB = p[A + 1] + (Z & 255);
    const BA = p[B] + (Z & 255);
    const BB = p[B + 1] + (Z & 255);
    const near = lerp(v, lerp(u, grad(p[AA] & 15, fx, fy, fz), grad(p[BA] & 15, fx - 1, fy, fz)),
      lerp(u, grad(p[AB] & 15, fx, fy - 1, fz), grad(p[BB] & 15, fx - 1, fy - 1, fz)));
    const far = lerp(v, lerp(u, grad(p[AA + 1] & 15, fx, fy, fz - 1), grad(p[BA + 1] & 15, fx - 1, fy, fz - 1)),
      lerp(u, grad(p[AB + 1] & 15, fx, fy - 1, fz - 1), grad(p[BB + 1] & 15, fx - 1, fy - 1, fz - 1)));
    return lerp(w, near, far);
  };
}

/**
 * Curl của trường vec3 F = (noise, noise lệch, noise lệch) bằng sai phân trung tâm: đúng công thức của
 * lib/tsl/noise.js#curl (18 lần gọi noise mỗi con mỗi khung: đó là phần việc mà GPU làm song song).
 * @param {(x: number, y: number, z: number) => number} noise
 * @returns {(x: number, y: number, z: number, out: Float64Array) => Float64Array}
 */
export function makeCurl(noise) {
  const F = (k, x, y, z) => noise(x + OFFSETS[k][0], y + OFFSETS[k][1], z + OFFSETS[k][2]);
  return (x, y, z, out) => {
    const dFz_dy = F(2, x, y + EPS, z) - F(2, x, y - EPS, z);
    const dFy_dz = F(1, x, y, z + EPS) - F(1, x, y, z - EPS);
    const dFx_dz = F(0, x, y, z + EPS) - F(0, x, y, z - EPS);
    const dFz_dx = F(2, x + EPS, y, z) - F(2, x - EPS, y, z);
    const dFy_dx = F(1, x + EPS, y, z) - F(1, x - EPS, y, z);
    const dFx_dy = F(0, x, y + EPS, z) - F(0, x, y - EPS, z);
    out[0] = (dFz_dy - dFy_dz) / (2 * EPS);
    out[1] = (dFx_dz - dFz_dx) / (2 * EPS);
    out[2] = (dFy_dx - dFx_dy) / (2 * EPS);
    return out;
  };
}

/**
 * Đàn đom đóm tính trên CPU: mỗi khung, một vòng lặp JS đi qua TỪNG con (tuần tự, một luồng), rồi chép cả mảng
 * vị trí lên GPU. So với compute shader (hàng nghìn luồng song song, dữ liệu không rời GPU): ms CPU tăng thấy rõ.
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {{ w: any, fogFactor: any, attract: { point: any, strength: any }, knobs: { flowScale: any, speed: any, attraction: any }, count: number }} p
 */
export function createCpuFlock(ctx, { w, fogFactor, attract, knobs, count }) {
  const noise = makeNoise(SEED);
  const curl = makeCurl(noise);
  const rng = mulberry32(SEED + 1);
  const cells = new Float32Array(CPU_MAX * 4); // xyz vị trí, w pha nháy: đúng hình dạng của bộ đệm GPU
  const velocity = new Float32Array(CPU_MAX * 3);
  for (let i = 0; i < CPU_MAX; i++) {
    const r = Math.sqrt(rng()) * FLOCK.radius;
    const a = rng() * Math.PI * 2;
    cells.set([Math.cos(a) * r, FLOCK.low + (FLOCK.high - FLOCK.low) * rng(), Math.sin(a) * r, rng()], i * 4);
  }
  const attr = new InstancedBufferAttribute(cells, 4).setUsage(DynamicDrawUsage);
  const sprite = createFireflySprite(ctx, { cell: instancedDynamicBufferAttribute(attr), w, fogFactor, count: Math.min(count, CPU_MAX) });
  const flow = new Float64Array(3);

  return {
    sprite,
    cells, // mảng vị trí (xyz) + pha của từng con: Sprite đọc, test đọc
    /** Số con được tính và vẽ (kẹp ở CPU_MAX). */
    setCount(n) {
      sprite.count = Math.min(n, CPU_MAX);
    },
    /** Một bước của cả đàn, cùng luật với kernel GPU (l5-vang-la.js). */
    step(dt, t) {
      const scale = knobs.flowScale.value;
      const k = FLOCK.flow * knobs.speed.value;
      const hand = attract.point.value;
      // Lực của tay đã gồm mọi hệ số trừ khoảng cách: pull = lực × núm hút × hệ số × dt (như kernel GPU).
      const force = attract.strength.value * knobs.attraction.value * FLOCK.pull * dt;
      const turn = Math.min(dt * FLOCK.turn, 1);
      for (let i = 0; i < sprite.count; i++) {
        const o = i * 4;
        const q = i * 3;
        let x = cells[o];
        let y = cells[o + 1];
        let z = cells[o + 2];
        curl(x * scale, y * scale + t * FLOCK.drift, z * scale, flow);
        // Quán tính: vận tốc ngả dần về hướng muốn bay (dòng curl + xoáy chậm quanh tâm ao).
        let vx = velocity[q] + (flow[0] * k - z * FLOCK.swirl - velocity[q]) * turn;
        let vy = velocity[q + 1] + (flow[1] * k * FLOCK.lift - velocity[q + 1]) * turn;
        let vz = velocity[q + 2] + (flow[2] * k + x * FLOCK.swirl - velocity[q + 2]) * turn;
        // Tay người xem: hút về (lực > 0) hay đẩy ra (lực < 0), kèm bay vòng quanh; giảm theo khoảng cách.
        const tx = hand.x - x;
        const ty = hand.y - y;
        const tz = hand.z - z;
        const dist = Math.max(Math.hypot(tx, ty, tz), 0.001);
        const pull = (force * Math.exp(-dist / FLOCK.reach)) / dist; // chia dist: (tx, ty, tz) / dist là hướng đơn vị
        vx += (tx - tz * FLOCK.orbit) * pull;
        vy += ty * pull;
        vz += (tz + tx * FLOCK.orbit) * pull;
        const limit = Math.min(1, FLOCK.maxSpeed / Math.max(Math.hypot(vx, vy, vz), 0.001));
        vx *= limit;
        vy *= limit;
        vz *= limit;
        x += vx * dt;
        y += vy * dt;
        z += vz * dt;
        const keep = Math.min(1, FLOCK.radius / Math.max(Math.hypot(x, z), 0.001));
        cells[o] = x * keep;
        cells[o + 1] = Math.min(Math.max(y, FLOCK.low), FLOCK.high);
        cells[o + 2] = z * keep;
        velocity[q] = vx;
        velocity[q + 1] = vy;
        velocity[q + 2] = vz;
      }
      attr.needsUpdate = true; // chép mảng vị trí lên GPU: việc mà bản compute không bao giờ phải làm
    },
    dispose() {
      sprite.material.dispose();
    },
  };
}
```

Vòng lặp nóng (18 lần gọi noise mỗi con) viết bằng biến thường, không destructuring mảng. Destructuring có thể cấp phát rác mỗi lần gọi, làm phép so "CPU vs GPU" đo cả GC thay vì đo phần tính.

- [ ] **Step 3: Nối vào `l5-vang-la.js`; `meta.js`, `content.vi.js`**

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l5-vang-la.js b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
index d25b3c6..a398a30 100644
--- a/src/paintings/ao-sen-dem/layers/l5-vang-la.js
+++ b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
@@ -1,4 +1,4 @@
-// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá: đom đóm tính trên GPU (compute), trôi theo curl noise, tụ quanh tay, tắt trong sương.
+// paintings/ao-sen-dem/layers/l5-vang-la.js — Lớp 5 · Vàng lá: đom đóm tính trên GPU (compute; bản CPU để so), trôi theo curl noise, tụ quanh tay.
 import {
   Fn,
   clamp,
@@ -19,6 +19,7 @@ import {
 } from 'three/tsl';
 import { curl } from '../../../lib/tsl/noise.js';
 import { FLOCK, createFireflySprite, setAdditive } from '../parts/vang-la-dan.js';
+import { CPU_MAX, createCpuFlock } from '../parts/vang-la-cpu.js';
 
 export const id = 'vang-la';
 
@@ -109,22 +110,35 @@ export function createLayer(ctx, shared) {
   // (thành vertex attribute, không cần storage buffer ở vertex stage).
   const sprite = createFireflySprite(ctx, { cell: posPhase.toAttribute(), w, fogFactor: shared.suong.fogFactor, count: wanted });
   ctx.scene.add(sprite);
+  const objects = [sprite]; // mảng SỐNG: đàn CPU thêm vào khi được dựng
+
+  // "CPU vs GPU": đàn CPU (parts/vang-la-cpu.js) dựng lần đầu bật thí nghiệm, rồi giữ lại; bật/tắt chỉ đổi đàn nào
+  // được tính và đàn nào hiện. Cũng là đường lùi nếu compute trên máy thật hỏng (bật tay, spec §16).
+  let cpu = null;
+  let onCpu = false;
+  let additive = true;
+  const show = () => {
+    const on = w.value > 0; // trọng số 0: không vẽ (visible không nằm trong cache key, không biên dịch lại)
+    sprite.visible = on && !onCpu;
+    if (cpu) cpu.sprite.visible = on && onCpu;
+  };
 
   /** Số con được tính và được vẽ = min(núm, trần). Chỉ đổi SỐ: không tạo bộ đệm, không biên dịch lại. */
   const applyCount = () => {
     const n = Math.min(wanted, cap);
     step.count = n; // WebGPU tính lại số nhóm dispatch, WebGL2 vẽ ít/nhiều đỉnh hơn
     sprite.count = n;
+    cpu?.setCount(n);
   };
   let before = Infinity; // trần trước khi áp nấc (bộ điều chỉnh gỡ nấc thì trả đúng số này)
   let disposed = false;
   return {
-    objects: [sprite],
-    update() {
-      // Trọng số 0: đom đóm tắt hẳn, nên không tính (bỏ compute) và không vẽ (visible không nằm trong cache key).
-      const on = w.value > 0;
-      sprite.visible = on;
-      if (on) ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
+    objects,
+    update(dt, t) {
+      show();
+      if (w.value <= 0) return; // tắt hẳn: không tính gì
+      if (onCpu) cpu.step(dt, t);
+      else ctx.renderer.compute(step); // bước đọc ctx.u.delta / ctx.u.time: xưởng đã cập nhật trước khi gọi
     },
     onKnob: {
       count: (v) => { // @knob count
@@ -132,8 +146,32 @@ export function createLayer(ctx, shared) {
         applyCount();
       },
     },
-    experiments: [{ id: 'noAdditive', toggle: (on) => setAdditive(sprite, !on) }],
-    readouts: [{ id: 'count', get: () => sprite.count }],
+    experiments: [
+      {
+        id: 'cpu',
+        kind: 'compare', // bàn thợ đo ms khung và ms CPU lúc tắt (GPU) và lúc bật (CPU)
+        toggle(on) {
+          if (on && !cpu) {
+            const uniforms = { flowScale: ctx.knob('flowScale'), speed: ctx.knob('speed'), attraction: ctx.knob('attraction') };
+            cpu = createCpuFlock(ctx, { w, fogFactor: shared.suong.fogFactor, attract: shared.attract, knobs: uniforms, count: Math.min(wanted, cap) });
+            if (!additive) setAdditive(cpu.sprite, false);
+            ctx.scene.add(cpu.sprite);
+            objects.push(cpu.sprite);
+          }
+          onCpu = on;
+          show();
+        },
+      },
+      {
+        id: 'noAdditive',
+        toggle(on) {
+          additive = !on;
+          setAdditive(sprite, additive);
+          if (cpu) setAdditive(cpu.sprite, additive);
+        },
+      },
+    ],
+    readouts: [{ id: 'count', get: () => (onCpu ? cpu.sprite.count : sprite.count) }],
     // Nấc của bộ điều chỉnh: trần số con = nửa số mặc định của mức (không dưới 100).
     degrade: [
       {
@@ -152,8 +190,9 @@ export function createLayer(ctx, shared) {
     dispose() {
       if (disposed) return;
       disposed = true;
-      ctx.scene.remove(sprite);
+      ctx.scene.remove(...objects);
       sprite.material.dispose();
+      cpu?.dispose();
       init.dispose(); // gỡ pipeline compute; bộ đệm storage được giải phóng cùng renderer
       step.dispose();
     },
```

```diff
diff --git a/src/paintings/ao-sen-dem/meta.js b/src/paintings/ao-sen-dem/meta.js
index 75fdd4a..8d2fed9 100644
--- a/src/paintings/ao-sen-dem/meta.js
+++ b/src/paintings/ao-sen-dem/meta.js
@@ -71,7 +71,11 @@ export default {
     {
       id: 'vang-la',
       name: 'Vàng lá',
-      files: ['paintings/ao-sen-dem/layers/l5-vang-la.js', 'paintings/ao-sen-dem/parts/vang-la-dan.js'],
+      files: [
+        'paintings/ao-sen-dem/layers/l5-vang-la.js',
+        'paintings/ao-sen-dem/parts/vang-la-dan.js',
+        'paintings/ao-sen-dem/parts/vang-la-cpu.js',
+      ],
     },
     phuBong,
   ],
```

```diff
diff --git a/src/paintings/ao-sen-dem/content.vi.js b/src/paintings/ao-sen-dem/content.vi.js
index 3363b21..d5ba9e4 100644
--- a/src/paintings/ao-sen-dem/content.vi.js
+++ b/src/paintings/ao-sen-dem/content.vi.js
@@ -225,6 +225,11 @@ export default {
         count: 'Số con',
       },
       experiments: {
+        cpu: {
+          label: 'CPU vs GPU',
+          explain: 'Cùng luật bay, nhưng tính bằng JS: một vòng lặp đi qua từng con (tối đa 5.000), rồi chép cả mảng vị '
+            + 'trí lên GPU mỗi khung. Nhìn cột ms CPU: phần việc mà compute shader làm song song trên GPU.',
+        },
         noAdditive: {
           label: 'Tắt additive',
           explain: 'Bỏ phép cộng dồn ánh sáng: con vẽ sau che con vẽ trước, bất kể xa gần, và con đang tắt thành đốm '
```

Run: `npx vitest run tests/paintings`
Kết quả mong đợi: PASS. Test hợp đồng bật rồi tắt mọi thí nghiệm, kể cả `cpu`: lần bật đầu dựng đàn CPU, lúc gỡ thì scene trống.

- [ ] **Step 4: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  562 passed`.

```bash
git add src/paintings/ao-sen-dem/parts/vang-la-cpu.js src/paintings/ao-sen-dem/layers/l5-vang-la.js src/paintings/ao-sen-dem/meta.js src/paintings/ao-sen-dem/content.vi.js tests/paintings/ao-sen-dem/vang-la-cpu.test.js tests/paintings/ao-sen-dem/vang-la.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): "CPU vs GPU": cùng luật bay tính bằng JS (noise gradient 3D, curl), tối đa 5.000 con, một Sprite thứ hai dựng lần đầu bật

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 14: Bảng chất lượng của Bức 1 (`quality.js`) và thang nấc

**Mục tiêu:** Spec §10 (bảng của Bức 1, GĐ 3).
- **`painting.quality`:**
  - các khóa theo mức: `dpr`, `reflection` (0 = phản chiếu giả), `fireflies`, `leaves`, `shadow` (0 = tắt), `bloom`, `fogOctaves`;
  - `ladder`: `dpr → suong.chi-tiet → mat-nuoc.phan-chieu → phu-bong.bloom → vang-la.dom-dom → anh-trang.bong`.
- **`buildPainting` trong test dựng bức theo `budgetFor(level, painting.quality)`**, giống `run.js`. Nhờ vậy test hợp đồng ở mức thấp đi đúng đường phản chiếu giả.
- **Test hợp đồng GĐ 3:** `ladder` không trùng; mỗi mục (trừ `dpr`) trỏ tới một nấc có thật ở mức cao; gỡ nấc ra thì số đo về như cũ.

**Files:**
- Create: `src/paintings/ao-sen-dem/quality.js`, `tests/paintings/ao-sen-dem/quality.test.js`
- Modify: `src/paintings/ao-sen-dem/painting.js`, `tests/helpers/fake-ctx.js`
- Test: `tests/paintings/contract.test.js`

**Interfaces:**
- Consumes: `layer.degrade` của các lớp (Task 8–12), `createLadder` (Task 4), `budgetFor`.
- Produces: `export const quality` trong `painting.js`; `buildPainting(painting, meta, { level, budget, ... })` ghép `budget` lên ngân sách của mức.

- [ ] **Step 1: Test (hỏng: bức chưa có `quality`)**

Tạo `tests/paintings/ao-sen-dem/quality.test.js`:
```js
// tests/paintings/ao-sen-dem/quality.test.js — bảng chất lượng của Bức 1: số theo mức, và thang nấc thật ở mức cao và thấp.
import { describe, it, expect, vi } from 'vitest';
import meta from '../../../src/paintings/ao-sen-dem/meta.js';
import * as painting from '../../../src/paintings/ao-sen-dem/painting.js';
import { budgetFor } from '../../../src/engine/quality.js';
import { createLadder } from '../../../src/engine/gpu/ladder.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

/** Thang nấc như scene.js dựng, trên một màn hình có DPR `device`. */
function ladderAt(level, device) {
  const { built } = buildPainting(painting, meta, { level, tier: level === 'cao' ? 'webgpu' : 'webgl2' });
  const budget = budgetFor(level, painting.quality);
  const stage = { dpr: () => Math.min(device, budget.dpr), setDpr: vi.fn() };
  return createLadder({ ladder: painting.quality.ladder, layers: built, stage, dpr: budget.dpr });
}

describe('quality.js của Bức 1', () => {
  it('bảng §10: DPR, phản chiếu (0 = giả), đom đóm, lá, bóng (0 = tắt), bloom, octave sương', () => {
    expect(budgetFor('cao', painting.quality)).toEqual({ dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3 });
    expect(budgetFor('thap', painting.quality)).toMatchObject({ reflection: 0, shadow: 0, fogOctaves: 1 });
  });

  it('mức cao, màn DPR 2: 4 nấc dpr rồi đủ 5 nấc của các lớp, đúng thứ tự', () => {
    const ladder = ladderAt('cao', 2);
    while (ladder.down());
    expect(ladder.ids()).toEqual([
      'dpr=1.75', 'dpr=1.5', 'dpr=1.25', 'dpr=1',
      'suong.chi-tiet', 'mat-nuoc.phan-chieu', 'phu-bong.bloom', 'vang-la.dom-dom', 'anh-trang.bong',
    ]);
  });

  it('mức thấp: phản chiếu giả và không bóng nên không có hai nấc đó; màn DPR 1 thì không có nấc dpr', () => {
    const ladder = ladderAt('thap', 1);
    while (ladder.down());
    expect(ladder.ids()).toEqual(['suong.chi-tiet', 'phu-bong.bloom', 'vang-la.dom-dom']);
  });
});
```

Áp vào `tests/paintings/contract.test.js`:
```diff
diff --git a/tests/paintings/contract.test.js b/tests/paintings/contract.test.js
index 4891090..8380341 100644
--- a/tests/paintings/contract.test.js
+++ b/tests/paintings/contract.test.js
@@ -138,6 +138,27 @@ describe.each(ALL.map((p) => [p.meta.slug, p]))('Bức "%s"', (slug, row) => {
     });
   });
 
+  it('quality (nếu có): đủ ba mức; ladder chỉ gồm dpr và nấc có thật của các lớp (ở mức cao); nấc gỡ ra thì số đo như cũ', async () => {
+    const { painting } = await loadPainting();
+    if (!painting.quality) return;
+    expect(Object.keys(painting.quality.levels).sort(), 'quality.levels phải có cao, vua, thap').toEqual(['cao', 'thap', 'vua']);
+    const { ladder } = painting.quality;
+    expect(new Set(ladder).size, `ladder có mục trùng: ${ladder.join(', ')}`).toBe(ladder.length);
+    const { built } = buildPainting(painting, meta, { level: 'cao' });
+    for (const entry of ladder.filter((e) => e !== 'dpr')) {
+      const dot = entry.indexOf('.');
+      const b = built.find((x) => x.id === entry.slice(0, dot));
+      expect(b, `ladder "${entry}": bức không có lớp "${entry.slice(0, dot)}"`).toBeTruthy();
+      const step = b.layer.degrade?.find((s) => s.id === entry.slice(dot + 1));
+      expect(step, `ladder "${entry}": lớp không đưa nấc này ở mức cao`).toBeTruthy();
+      const read = () => (b.layer.readouts ?? []).map((r) => r.get());
+      const before = read();
+      step.apply();
+      step.revert();
+      expect(read(), `nấc "${entry}" gỡ ra thì số đo phải về như cũ`).toEqual(before);
+    }
+  });
+
   describe('chữ (content) theo từng ngôn ngữ', () => {
     const palette = new Set(Object.values(mergePalette(meta.palette)).map((h) => h.toUpperCase()));
 
```

Run: `npx vitest run tests/paintings/ao-sen-dem/quality.test.js`
Kết quả mong đợi: FAIL, 3 test hỏng; lỗi đầu tiên: `AssertionError: expected { dpr: 2 } to deeply equal { dpr: 2, reflection: 0.5, …(5) }`.

- [ ] **Step 2: Tạo `src/paintings/ao-sen-dem/quality.js`, export trong `painting.js`**

```js
// paintings/ao-sen-dem/quality.js — bảng chất lượng của Bức 1 (spec §10): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor).
 * reflection 0 = phản chiếu giả (không vẽ cảnh lần hai); shadow 0 = tắt bóng.
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3 },
    vua: { dpr: 1.5, reflection: 0.35, fireflies: 1500, leaves: 800, shadow: 512, bloom: 0.25, fogOctaves: 2 },
    thap: { dpr: 1.25, reflection: 0, fireflies: 600, leaves: 500, shadow: 0, bloom: 0.25, fogOctaves: 1 },
  },
  // Máy chậm thì hạ theo thứ tự này: thứ ít thấy nhất trước (độ nét, chi tiết của sương, độ nét của phản chiếu và bloom),
  // thứ thấy rõ sau cùng (số đom đóm, độ nét của bóng). Mục nào lớp không đưa ra ở mức hiện tại thì xưởng bỏ qua.
  ladder: ['dpr', 'suong.chi-tiet', 'mat-nuoc.phan-chieu', 'phu-bong.bloom', 'vang-la.dom-dom', 'anh-trang.bong'],
};
```

```diff
diff --git a/src/paintings/ao-sen-dem/painting.js b/src/paintings/ao-sen-dem/painting.js
index 0e51406..bcea9f8 100644
--- a/src/paintings/ao-sen-dem/painting.js
+++ b/src/paintings/ao-sen-dem/painting.js
@@ -1,4 +1,4 @@
-// paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers) và camera.
+// paintings/ao-sen-dem/painting.js — phần nặng của Bức 1: chồng lớp (cùng thứ tự với meta.layers), camera, bảng chất lượng.
 import * as cot from './layers/l1-cot.js';
 import * as anhTrang from './layers/l2-anh-trang.js';
 import * as suong from './layers/l3-suong.js';
@@ -15,6 +15,9 @@ export const layers = [cot, anhTrang, suong, matNuoc, vangLa, phuBong];
 /** setup() chạy TRƯỚC mọi createLayer: giờ, hướng trăng, gợn sóng, xoáy sương, cử chỉ (shared.js). */
 export { setup } from './shared.js';
 
+/** Số theo mức (cao / vừa / thấp) và thứ tự hạ nấc của bộ điều chỉnh (quality.js). */
+export { quality } from './quality.js';
+
 /**
  * Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn từ đây.
  * Camera đứng ở z = 32, cao 6, nhìn gần ngang về phía xa (−z): trăng thấp (4°–13°) nằm ở phần ba trên
```

- [ ] **Step 3: Dựng bức trong test theo ngân sách của mức (`tests/helpers/fake-ctx.js`)**

```diff
diff --git a/tests/helpers/fake-ctx.js b/tests/helpers/fake-ctx.js
index 2dc0184..aa3bb1c 100644
--- a/tests/helpers/fake-ctx.js
+++ b/tests/helpers/fake-ctx.js
@@ -3,6 +3,7 @@ import { vi } from 'vitest';
 import { PerspectiveCamera, Scene, Vector2 } from 'three/webgpu';
 import { uniform } from 'three/tsl';
 import { buildLayers, createCtx } from '../../src/engine/gpu/layers.js';
+import { budgetFor } from '../../src/engine/quality.js';
 
 /** "Bây giờ" mặc định của test: 21:00 giờ Việt Nam, ngày 18 tháng Tám năm Bính Ngọ. */
 export const NOW = new Date('2026-09-28T21:00:00+07:00');
@@ -45,11 +46,12 @@ export function makeEngineCtx(meta, { level = 'cao', budget = {}, now = NOW, red
 }
 
 /**
- * Dựng bức như run.js: setup(ctx) rồi buildLayers (cùng hàm của xưởng). `until` = id lớp cuối cần dựng.
+ * Dựng bức như run.js: ngân sách của mức (budgetFor, ghép bảng của bức), setup(ctx) rồi buildLayers (cùng hàm của xưởng).
+ * `until` = id lớp cuối cần dựng; `budget` ghi đè vài số của mức.
  * @returns {{ ctx: object, setup: object | undefined, shared: object, built: object[], layers: Record<string, object>, knobs: Record<string, object> }}
  */
-export function buildPainting(painting, meta, { until, ...options } = {}) {
-  const ctx = makeEngineCtx(meta, options);
+export function buildPainting(painting, meta, { until, budget = {}, ...options } = {}) {
+  const ctx = makeEngineCtx(meta, { ...options, budget: { ...budgetFor(options.level ?? 'cao', painting.quality), ...budget } });
   const setup = painting.setup?.(ctx);
   const shared = setup?.shared ?? {};
   const end = until ? painting.layers.findIndex((m) => m.id === until) + 1 : painting.layers.length;
```

Run: `npx vitest run tests/paintings`
Kết quả mong đợi: PASS. Các test cũ (số lá, cỡ bóng, số đom đóm theo mức) vẫn xanh vì bảng mới ghi đúng các số mặc định cũ; test nào truyền `budget` riêng thì số đó ghi đè lên bảng.

- [ ] **Step 4: Chạy toàn bộ rồi commit**

Run: `npm test`
Kết quả mong đợi: xanh, `Tests  567 passed`.

```bash
git add src/paintings/ao-sen-dem/quality.js src/paintings/ao-sen-dem/painting.js tests/helpers/fake-ctx.js tests/paintings/ao-sen-dem/quality.test.js tests/paintings/contract.test.js
git commit -F - <<'EOF'
feat(ao-sen-dem): bảng chất lượng của Bức 1 (số theo mức, phản chiếu giả và tắt bóng ở mức thấp, octave sương) và thang hạ nấc; test dựng bức theo ngân sách của mức, hợp đồng kiểm ladder

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 15: E2E của GĐ 3

**Mục tiêu:** Spec §12 E2E (GĐ 3). Kiểm trên trình duyệt thật những thứ mà unit test không thấy được (shader biên dịch trên cả hai backend, GPU vẽ đúng):
- **Mọi bức:** dùng `__sma.degrade()` hạ hết nấc (cùng khung `?freeze`) thì cảnh vẫn vẽ, có sáng có tối, `data-steps` đúng, không lỗi; nâng lại hết thì về ĐÚNG ảnh cũ.
- **Bức 1:**
  - vuốt trên mặt nước thì ảnh đổi (kéo cũng xoay camera, nên luật xoáy do unit test giữ; ở đây giữ đường đi thật của shader có xoáy);
  - mức cao ≤ 45 draw call;
  - `?level=thap` lên live, ít draw call hơn mức cao;
  - Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU" thì hai cột đều có số.
- **Ngưỡng "có sáng có tối":** điểm tối > 3%, đưa vào `helpers.js` thành `DARK`. Trước đây là 10%, nhưng trời chàm và sương làm khung 10 chỉ còn 7–8% điểm tối (spec §12).
- **Test chế độ mài có sẵn:** lớp tiếp theo sau Ánh trăng giờ là Sương.

**Files:**
- Modify: `e2e/helpers.js`, `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`

**Interfaces:**
- Consumes: `__sma.quality/degrade/upgrade/stats` (Task 6), `data-steps` (Task 7), `?level` (Task 6), thí nghiệm `cpu` (Task 13).
- Produces: `DARK` trong `e2e/helpers.js`.

- [ ] **Step 1: Áp e2e**

```diff
diff --git a/e2e/helpers.js b/e2e/helpers.js
index 4c444c6..9a43dbe 100644
--- a/e2e/helpers.js
+++ b/e2e/helpers.js
@@ -3,6 +3,12 @@
 /** Cảnh báo API cũ mà three in ra lúc chạy (spec §3: e2e bắt các cảnh báo này). */
 export const DEPRECATION = /deprecated|renamed|has been removed/i;
 
+/**
+ * Tỉ lệ điểm tối tối thiểu của một ảnh "có sáng có tối" (không cháy trắng, không trống). GĐ 3 có trời chàm và sương
+ * nên ít điểm đen tuyệt đối hơn nền đen then trước đó (đo được 7–8% ở khung 10): 3% vẫn đủ chứng minh ảnh có vùng tối.
+ */
+export const DARK = 0.03;
+
 /** Bản sao dữ liệu của window.__sma (bỏ hàm set/frame, vì hàm không gửi qua evaluate được). */
 export function readSma(page) {
   return page.evaluate(() => JSON.parse(JSON.stringify(window.__sma ?? null)));
```

```diff
diff --git a/e2e/painting.spec.js b/e2e/painting.spec.js
index 40dd120..b4bcd92 100644
--- a/e2e/painting.spec.js
+++ b/e2e/painting.spec.js
@@ -2,7 +2,7 @@
 import { readdirSync } from 'node:fs';
 import { test, expect } from '@playwright/test';
 import { paintings } from '../src/paintings/registry.js';
-import { waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
+import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
 
 /**
  * URL tương đối (không có '/' đầu) để giữ base '/son-mai-anh-sang/' của baseURL.
@@ -125,7 +125,7 @@ for (const { meta, page: htmlPage, lang } of paintings) {
         const stats = await canvasStats(page);
         await page.screenshot({ path: testInfo.outputPath(`freeze-${n}.png`) });
         expect(stats.bright, `freeze=${n}: quá ít điểm sáng`).toBeGreaterThan(0.02);
-        expect(stats.dark, `freeze=${n}: quá ít điểm tối`).toBeGreaterThan(0.1);
+        expect(stats.dark, `freeze=${n}: quá ít điểm tối`).toBeGreaterThan(DARK);
         shots.push(stats);
       }
       const still = 'khung 10 và khung 40 giống hệt nhau: cảnh không chuyển động theo ctx.u.time';
@@ -229,6 +229,35 @@ for (const { meta, page: htmlPage, lang } of paintings) {
       expect(log.warnings).toEqual([]);
     });
 
+    test('hạ hết mọi nấc bằng __sma.degrade(): vẫn vẽ, có sáng có tối, không lỗi; nâng lại hết thì về đúng ảnh cũ', async ({
+      page,
+    }, testInfo) => {
+      const { query } = testInfo.project.metadata;
+      test.setTimeout(120_000);
+      await page.goto(urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00'));
+      const settled = await waitForSettled(page);
+      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+      await waitForFrames(page, 10);
+      const base = await canvasStats(page);
+      // ?freeze: không có bộ điều chỉnh (ảnh tất định), nhưng hạ/nâng tay vẫn được và vẽ lại đúng khung 10.
+      let steps = 0;
+      while (await page.evaluate(() => window.__sma.degrade())) steps += 1;
+      const quality = await page.evaluate(() => window.__sma.quality());
+      expect(quality.steps).toHaveLength(steps);
+      await expect(page.locator('[data-badge]')).toHaveAttribute('data-steps', String(steps));
+      const low = await canvasStats(page);
+      await page.screenshot({ path: testInfo.outputPath('ha-het-nac.png') });
+      expect(low.bright, 'hạ hết nấc: quá ít điểm sáng').toBeGreaterThan(0.02);
+      expect(low.dark, 'hạ hết nấc: quá ít điểm tối').toBeGreaterThan(DARK);
+      while (await page.evaluate(() => window.__sma.upgrade()));
+      await expect(page.locator('[data-badge]')).toHaveAttribute('data-steps', '0');
+      const again = await canvasStats(page);
+      expect(again.checksum, 'nâng lại hết nấc thì phải về đúng ảnh cũ').toBe(base.checksum);
+      expect((await readSma(page)).frames, 'hạ/nâng nấc không được tiến đồng hồ').toBe(10);
+      expect(log.errors).toEqual([]);
+      expect(log.warnings).toEqual([]);
+    });
+
     test('Sổ tay: lời mời → chế độ mài; tab Chỉnh của lớp đầu tiên có núm; rê chuột lên núm thì dòng code sáng', async ({
       page,
     }, testInfo) => {
```

```diff
diff --git a/e2e/ao-sen-dem.spec.js b/e2e/ao-sen-dem.spec.js
index 86610a2..daca8a7 100644
--- a/e2e/ao-sen-dem.spec.js
+++ b/e2e/ao-sen-dem.spec.js
@@ -1,6 +1,6 @@
-// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm mặt nước thì ảnh đổi; gợi ý → lời mời → chế độ mài; trăng SVG ở tầng tĩnh.
+// e2e/ao-sen-dem.spec.js — tương tác riêng của Bức 1: chạm, giữ, vuốt mặt nước; chế độ mài; chất lượng (draw call, mức thấp); CPU vs GPU; trăng SVG.
 import { test, expect } from '@playwright/test';
-import { waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
+import { DARK, waitForSettled, waitForFrames, canvasStats, gpuReport, collectConsole, readSma } from './helpers.js';
 
 const AT = 'at=2026-09-28T21:00';
 const N = 90; // số khung của mỗi lần chạy; vòng gợn kịp lan trong ~1 giây đồng hồ của cảnh
@@ -30,18 +30,24 @@ test.afterEach(async ({ page }, testInfo) => {
  * Mở cảnh ở ?freeze=N, (tùy chọn) chạm hoặc GIỮ tay trên mặt nước sau khung TAP_AFTER, chờ đủ N khung rồi đo canvas.
  * Giữ = nhấn xuống, đợi thêm HOLD_FRAMES khung (dài hơn 350 ms giữ của gesture.js), rồi mới thả.
  */
-async function run(page, testInfo, { tap = false, hold = false }) {
+async function run(page, testInfo, { tap = false, hold = false, swipe = false }) {
   const { query } = testInfo.project.metadata;
   await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&freeze=${N}`);
   const settled = await waitForSettled(page, { timeout: 60_000 });
   expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
   let tappedAt = null;
-  if (tap || hold) {
+  if (tap || hold || swipe) {
     await page.waitForFunction((n) => window.__sma.frames >= n, TAP_AFTER, { timeout: 60_000 });
     const box = await page.locator('[data-stage] canvas').boundingBox();
     const [x, y] = [box.x + box.width * WATER.x, box.y + box.height * WATER.y];
     if (tap) await page.mouse.click(x, y);
-    else {
+    else if (swipe) {
+      // Vuốt = kéo nhanh (dưới 300 ms) và xa (trên 40 px) rồi thả (gesture.js). Kéo cũng xoay camera một chút.
+      await page.mouse.move(x - 60, y);
+      await page.mouse.down();
+      await page.mouse.move(x + 60, y, { steps: 3 });
+      await page.mouse.up();
+    } else {
       await page.mouse.move(x, y);
       await page.mouse.down();
       const from = (await readSma(page)).frames;
@@ -82,6 +88,16 @@ test.describe('Ao Sen Đêm · chạm mặt nước', () => {
     expect(log.errors).toEqual([]);
   });
 
+  test('vuốt trên mặt nước: cảnh vẫn chạy, không lỗi, ảnh khác lần không vuốt (cùng ?at&freeze)', async ({ page }, testInfo) => {
+    // Kéo cũng xoay camera, nên ảnh khác chưa chứng minh sương xoáy: luật xoáy có unit test (shared.test.js). Ở đây giữ
+    // đường đi thật: vuốt → shared.swirl → sương (shader có xoáy) biên dịch và vẽ được trên cả hai backend.
+    test.setTimeout(300_000);
+    const a = await run(page, testInfo, {});
+    const swiped = await run(page, testInfo, { swipe: true });
+    expect(swiped.stats.checksum, 'vuốt mà ảnh không đổi').not.toBe(a.stats.checksum);
+    expect(log.errors).toEqual([]);
+  });
+
   test('gợi ý "Chạm vào mặt nước" khi live; chạm lần đầu thì thành lời mời mài lớp', async ({ page }, testInfo) => {
     const { query } = testInfo.project.metadata;
     await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
@@ -118,7 +134,7 @@ test.describe('Ao Sen Đêm · chế độ mài', () => {
     await page.locator('[data-rail] .rail-next').click();
     await expect(notebook.locator('h2')).toHaveText('Ánh trăng');
     await expect.poll(async () => (await weights(page))['anh-trang'], { timeout: 30_000 }).toBe(1);
-    await expect(page.locator('[data-rail] .rail-next')).toHaveText(/Mặt nước$/);
+    await expect(page.locator('[data-rail] .rail-next')).toHaveText(/Sương$/);
     await page.locator('[data-rail] .rail-close').click();
     await expect(page.locator('[data-rail]')).toBeHidden();
     await expect.poll(async () => Object.values(await weights(page)).every((w) => w === 1), { timeout: 30_000 }).toBe(true);
@@ -126,6 +142,66 @@ test.describe('Ao Sen Đêm · chế độ mài', () => {
   });
 });
 
+test.describe('Ao Sen Đêm · chất lượng', () => {
+  test.beforeEach(({}, testInfo) => {
+    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
+  });
+
+  /** Mở cảnh ở một mức ép bằng ?level, chờ N khung, trả __sma.stats() và ảnh. */
+  async function atLevel(page, testInfo, level) {
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}&level=${level}&freeze=30`);
+    const settled = await waitForSettled(page, { timeout: 60_000 });
+    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
+    const sma = await waitForFrames(page, 30, { timeout: 120_000 });
+    expect(sma.level).toBe(level);
+    return { stats: await page.evaluate(() => window.__sma.stats()), image: await canvasStats(page) };
+  }
+
+  test('mức cao: tổng draw call mỗi khung ≤ 45 (spec §10; bóng tĩnh không vẽ lại mỗi khung)', async ({ page }, testInfo) => {
+    const { stats } = await atLevel(page, testInfo, 'cao');
+    expect(stats.drawCalls).toBeGreaterThan(10);
+    expect(stats.drawCalls).toBeLessThanOrEqual(45);
+    expect(log.errors).toEqual([]);
+  });
+
+  test('?level=thap: phản chiếu giả, không bóng; vẫn có sáng có tối, ít draw call hơn mức cao', async ({ page }, testInfo) => {
+    test.setTimeout(120_000);
+    const low = await atLevel(page, testInfo, 'thap');
+    await page.screenshot({ path: testInfo.outputPath('muc-thap.png') });
+    expect(low.image.bright).toBeGreaterThan(0.02);
+    expect(low.image.dark).toBeGreaterThan(DARK);
+    await expect(page.locator('[data-badge]')).toContainText('thấp');
+    const high = await atLevel(page, testInfo, 'cao');
+    expect(low.stats.drawCalls, 'mức thấp không vẽ cảnh lần hai cho phản chiếu').toBeLessThan(high.stats.drawCalls);
+    expect(log.errors).toEqual([]);
+  });
+
+  test('Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU" thì hai cột Tắt / Bật đều có số', async ({ page }, testInfo) => {
+    test.setTimeout(120_000);
+    const { query } = testInfo.project.metadata;
+    await page.goto(`./?${query.replace(/^\?/, '')}&${AT}`);
+    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
+    const box = await page.locator('[data-stage] canvas').boundingBox();
+    await page.mouse.click(box.x + box.width * WATER.x, box.y + box.height * WATER.y);
+    await page.locator('[data-hint] button').click();
+    await page.evaluate(() => window.__sma.setWeight('vang-la', 1)); // chế độ mài đưa mọi lớp về 0: phủ lại Vàng lá
+    await page.locator('[data-rail] [data-layer="vang-la"] .rail-name').click();
+    const notebook = page.locator('[data-notebook]');
+    await notebook.locator('[data-tab="pha"]').click();
+    const button = notebook.locator('[data-experiment="cpu"]');
+    const bars = notebook.locator('[data-compare]');
+    await expect(bars.locator('[data-side="off"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
+    await button.click();
+    await expect(button).toHaveAttribute('aria-pressed', 'true');
+    await expect(bars.locator('[data-side="on"] .nb-compare-value')).toContainText('ms', { timeout: 30_000 });
+    await button.click();
+    await expect(button).toHaveAttribute('aria-pressed', 'false');
+    await page.screenshot({ path: testInfo.outputPath('cpu-vs-gpu.png') });
+    expect(log.errors).toEqual([]);
+  });
+});
+
 test.describe('Ao Sen Đêm · chữ của bức tải hỏng', () => {
   test.beforeEach(({}, testInfo) => {
     test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
```

- [ ] **Step 2: Chạy e2e (máy rảnh: SwiftShader ăn CPU)**

```bash
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu   # chỉ trên máy có GPU thật
```
Kết quả mong đợi (bản dựng thử):
- `static` + `webgl2-swiftshader`: 23 passed, 23 skipped;
- `webgpu-swiftshader`: 17 passed, 6 skipped;
- `webgpu-real-gpu`: 17 passed, 6 skipped.

Test 3D nào về tĩnh với lý do `timeout` là do máy bận: chạy lại khi máy rảnh trước khi coi là lỗi.

- [ ] **Step 3: Commit**

```bash
git add e2e/helpers.js e2e/painting.spec.js e2e/ao-sen-dem.spec.js
git commit -F - <<'EOF'
test(e2e): GĐ 3: hạ hết nấc rồi nâng lại (mọi bức), vuốt mặt nước, draw call ở mức cao, ?level=thap, CPU vs GPU trong Sổ tay; ngưỡng điểm tối theo trời chàm và sương

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 16: Lượt màu theo poster

**Mục tiêu:** Spec §5 "Lượt màu (GĐ 3)". Đo trên GPU thật (1280×800, khung 300), thứ làm ảnh bệch nhất là quầng bloom của 3.000 đom đóm: tắt Vàng lá thì độ sáng trung bình 63 → 47, điểm tối 8% → 28%. Lượt màu gồm:
- đom đóm dịu lại (`glow` 3 → 1,8);
- sương mỏng và tối hơn (`density` 0,012 → 0,008, màu nền sương × 0,2);
- đỉnh trời chàm đậm hơn (× 2), đèn trời chàm yếu đi (`SKY_FILL` 7 → 4);
- thân lá bớt bóng (`specularIntensity` 0,3 khi lớp Ánh trăng phủ);
- nước sâu ngả nâu cánh gián như đáy poster.

Mọi số là giá trị mặc định hay hằng số, nằm trong MỘT commit riêng: bỏ commit này là về lại màu cũ. Bao đã xem ảnh trước và sau lúc duyệt kế hoạch.

**Files:**
- Modify: `src/paintings/ao-sen-dem/layers/l2-anh-trang.js`, `l3-suong.js`, `l4-mat-nuoc.js`, `l5-vang-la.js`, `src/paintings/ao-sen-dem/parts/anh-trang-paint.js`, `parts/suong-mu.js`, `parts/suong-troi.js`

**Interfaces:**
- Consumes: —
- Produces: — (chỉ đổi số)

- [ ] **Step 1: Áp các giá trị mới**

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
index 02ec9f4..6e6d475 100644
--- a/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
+++ b/src/paintings/ao-sen-dem/layers/l2-anh-trang.js
@@ -35,7 +35,7 @@ export const knobs = [
 ];
 
 const MOONLIGHT = 3; // cường độ ánh trăng ở trọng số 1
-const SKY_FILL = 7; // trời chàm hắt xuống, nước đen hắt lên
+const SKY_FILL = 4; // trời chàm hắt xuống, nước đen hắt lên
 const CANDLE = { distance: 14, position: [-5, 0.08, 13] };
 
 /**
```

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l3-suong.js b/src/paintings/ao-sen-dem/layers/l3-suong.js
index 8cb767c..dea44ea 100644
--- a/src/paintings/ao-sen-dem/layers/l3-suong.js
+++ b/src/paintings/ao-sen-dem/layers/l3-suong.js
@@ -7,7 +7,7 @@ import { createSkyDome, makeSky } from '../parts/suong-troi.js';
 export const id = 'suong';
 
 export const knobs = [
-  { id: 'density', min: 0, max: 0.12, step: 0.001, value: 0.012 },
+  { id: 'density', min: 0, max: 0.12, step: 0.001, value: 0.008 },
   { id: 'heightFalloff', min: 0.05, max: 2, step: 0.01, value: 1 },
   { id: 'noiseScale', min: 0.01, max: 0.4, step: 0.005, value: 0.07 },
   // Số tầng noise là UNIFORM (không phải rebuild): fbm chạy vòng lặp thật trong shader nên đổi số tầng không biên dịch lại.
```

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
index e05b5cb..110bc6d 100644
--- a/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
+++ b/src/paintings/ao-sen-dem/layers/l4-mat-nuoc.js
@@ -116,7 +116,8 @@ export function createLayer(ctx, shared) {
 
   // Có chiếu sáng: ở trọng số 0 đĩa là đất sét dưới đèn xưởng như mọi hình khác (luật 3).
   const material = new MeshStandardNodeMaterial({ roughness: 0.9, metalness: 0 });
-  material.colorNode = mix(mix(color(hex.datSet), color(hex.denThen), w), vec3(0), showHeight);
+  // Nước sâu: đen then ngả nâu cánh gián như đáy poster (lượt màu GĐ 3); trọng số 0 là đất sét.
+  material.colorNode = mix(mix(color(hex.datSet), mix(color(hex.denThen), color(hex.canhGian), 0.5), w), vec3(0), showHeight);
   material.roughnessNode = mix(float(0.9), float(0.06), w);
   material.normalNode = transformNormalToView(mix(vec3(0, 1, 0), normal, w)); // đĩa đặt ở gốc: local = world
   // Ảnh phản chiếu cộng vào như ánh sáng tự phát (không bị đèn làm tối)...
```

```diff
diff --git a/src/paintings/ao-sen-dem/layers/l5-vang-la.js b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
index a398a30..08e63c7 100644
--- a/src/paintings/ao-sen-dem/layers/l5-vang-la.js
+++ b/src/paintings/ao-sen-dem/layers/l5-vang-la.js
@@ -33,7 +33,7 @@ const COUNT_FLOOR = 100; // sprite có count > 1 nằm trong cache key của thr
 
 export const knobs = [
   { id: 'size', min: 0.02, max: 0.5, step: 0.005, value: 0.12 },
-  { id: 'glow', min: 0, max: 10, step: 0.1, value: 3 },
+  { id: 'glow', min: 0, max: 10, step: 0.1, value: 1.8 },
   { id: 'attraction', min: 0, max: 3, step: 0.01, value: 1 },
   { id: 'flowScale', min: 0.02, max: 0.6, step: 0.01, value: 0.12 },
   { id: 'speed', min: 0, max: 3, step: 0.05, value: 1 },
```

```diff
diff --git a/src/paintings/ao-sen-dem/parts/anh-trang-paint.js b/src/paintings/ao-sen-dem/parts/anh-trang-paint.js
index 37ca01d..d870d45 100644
--- a/src/paintings/ao-sen-dem/parts/anh-trang-paint.js
+++ b/src/paintings/ao-sen-dem/parts/anh-trang-paint.js
@@ -49,6 +49,9 @@ export function paintCot(ctx, cot, w, moonDir) {
     // Gân là vàng thật (kim loại, bóng hơn) nên lóe lên khi ánh trăng lướt qua.
     material.metalnessNode = veins.mul(w);
     material.roughnessNode = mix(float(0.9), mix(float(0.8), float(0.35), veins), w);
+    // Thân lá bớt bóng: camera nhìn về phía trăng, nên mặt lá nằm ngang hắt ánh trăng thành một lớp xám phủ lên màu xanh.
+    // specularIntensity giảm cả phản xạ ở góc xiên (F90); gân là kim loại nên vẫn lóe (lượt màu GĐ 3).
+    material.specularIntensityNode = mix(float(1), float(0.3), w);
     // Clearcoat: lớp bóng như sáp phủ trên lá; uniform của núm nhân trọng số, không biên dịch lại.
     material.clearcoatNode = ctx.knob('clearcoat').mul(w); // @knob clearcoat
     material.clearcoatRoughnessNode = float(0.5);
```

```diff
diff --git a/src/paintings/ao-sen-dem/parts/suong-mu.js b/src/paintings/ao-sen-dem/parts/suong-mu.js
index 58f02af..75555dc 100644
--- a/src/paintings/ao-sen-dem/parts/suong-mu.js
+++ b/src/paintings/ao-sen-dem/parts/suong-mu.js
@@ -33,7 +33,7 @@ const SWIRL = { radius: 9, settle: 0.6 }; // xoáy: bán kính ảnh hưởng (
  */
 export function makeFogColor(ctx, { moonDir, moonLight }) {
   const hex = ctx.palette.hex;
-  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.25);
+  const base = mix(color(hex.cham), color(hex.bacLa), 0.25).mul(0.2);
   const glow = color(hex.vangLaSang).mul(0.12).mul(moonLight);
   // saturate trước pow: pow của số âm là NaN trên GPU thật.
   return Fn(([dir]) => base.add(glow.mul(pow(saturate(dot(dir, moonDir)), 16))));
```

```diff
diff --git a/src/paintings/ao-sen-dem/parts/suong-troi.js b/src/paintings/ao-sen-dem/parts/suong-troi.js
index 5342bb4..09801d2 100644
--- a/src/paintings/ao-sen-dem/parts/suong-troi.js
+++ b/src/paintings/ao-sen-dem/parts/suong-troi.js
@@ -45,7 +45,7 @@ export function makeSky(ctx, { moonDir, moonLight, hour, fogColor, density, star
     // Dải màu theo poster: đen then ở chân trời, chàm ở đỉnh. Chạng vạng (18h–19h30) và gần sáng (28h30–29h30)
     // chân trời ấm lên màu nâu cánh gián. Giờ là uniform của bức: thanh giờ (GĐ 4) chỉ việc đổi nó.
     const dusk = oneMinus(smoothstep(18, 19.5, hour)).add(smoothstep(28.5, 29.5, hour));
-    const base = mix(color(hex.denThen), color(hex.cham), smoothstep(0, 0.6, e))
+    const base = mix(color(hex.denThen), color(hex.cham).mul(2), smoothstep(0, 0.6, e))
       .add(color(hex.canhGian).mul(dusk.mul(0.6)).mul(oneMinus(smoothstep(0, 0.25, e))));
 
     // Sao: chia hướng nhìn thành lưới ô 3D. Mỗi ô một số ngẫu nhiên cố định (mx_cell_noise_float = hash của ô);
```

- [ ] **Step 2: Test và e2e vẫn xanh**

Run: `npm test` rồi `npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu` (máy không có GPU thật thì chạy `--project=webgl2-swiftshader`).
Kết quả mong đợi: `Tests  567 passed`; e2e xanh. Ảnh tối hơn và đậm hơn, nên các ngưỡng "có sáng có tối" vẫn thừa.

- [ ] **Step 3: Chụp ảnh cho PR (GPU thật, headless, không mở cửa sổ)**

Script nằm ngoài repo (ví dụ thư mục tạm), chạy khi `npx vite preview --port 4291 --strictPort --host 127.0.0.1` đang phục vụ `dist/`:

```js
// check.mjs: node check.mjs <tên> '<query>' [rộng×cao]
import { chromium } from '@playwright/test';
const [name, query = '', size = '1280x800'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({ viewport: { width, height } });
await page.goto(`http://127.0.0.1:4291/son-mai-anh-sang/${query}`);
await page.waitForFunction(() => ['live', 'static'].includes(window.__sma?.state), null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${name}.png` });
console.log(await page.evaluate(() => ({ state: __sma.state, level: __sma.level, stats: __sma.stats?.() })));
await browser.close();
```
Chụp `'?at=2026-09-28T21:00&freeze=300'` ở `1280x800` và `390x844`, rồi đính kèm vào PR (Task 18).

- [ ] **Step 4: Commit (riêng, để bỏ được nếu Bao muốn màu cũ)**

```bash
git add src/paintings/ao-sen-dem
git commit -F - <<'EOF'
style(ao-sen-dem): lượt màu theo poster: sương mỏng và tối hơn, đỉnh trời chàm đậm hơn, đèn trời yếu đi, thân lá bớt bóng, nước sâu ngả cánh gián, đom đóm dịu lại (glow 1.8)

Đo trên GPU thật (1280×800, khung 300): quầng bloom của 3.000 đom đóm là thứ làm ảnh bệch nhất
(tắt Vàng lá: độ sáng TB 63 → 47, điểm tối 8% → 28%). Mọi số ở đây là giá trị mặc định: bỏ commit này là về lại
màu trước lượt chỉnh.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 17: Ghi lại GĐ 3: README, CLAUDE.md, spec

**Mục tiêu:**
- **README:** đủ sáu lớp; mục "Chất lượng: hợp với nhiều loại máy"; `?level`; `__sma` mới; bảng kích thước bundle đo lại.
- **CLAUDE.md:** luật mới (fogNode, hạt cộng dồn, shadow map tĩnh, nhóm luật "Chất lượng và phần cứng"), cờ `?level`, `__sma` mới.
- **Spec:**
  - §5 "Lượt màu", kèm số đo;
  - §10 draw call ĐO ĐƯỢC (34 ở mức cao, 24 ở mức thấp) và kích thước JS;
  - §12 ngưỡng điểm tối;
  - Phụ lục A.35–37 chuyển sang "kiểm bằng code chạy thật"; thêm A.38 (sao bằng `mx_cell_noise_float`) và A.39 (số đo chi phí).

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

**Interfaces:**
- Consumes: số đo của Task 15–16.
- Produces: —

- [ ] **Step 1: README**

```diff
diff --git a/README.md b/README.md
index 5e5e153..818b5dc 100644
--- a/README.md
+++ b/README.md
@@ -13,28 +13,44 @@ Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:
 - **"Mài"** là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt** đất sét.
 - Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang: vừa ngắm vừa học.
 
-**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng. Bản hiện tại (giai đoạn 2) có 5 lớp:
+**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng (đủ sáu lớp từ giai đoạn 3):
 Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
-chất liệu), Mặt nước (phản chiếu, gợn sóng), Vàng lá (đom đóm tính trên GPU) và Phủ bóng (bloom chọn lọc,
-tone mapping AgX/ACES). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại.
+chất liệu), Sương (vòm trời có sao, quầng trăng, Ngân Hà; sương là là trên mặt nước), Mặt nước (phản chiếu, gợn sóng),
+Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES).
+Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; giữ tay để đom đóm tụ lại; vuốt để sương xoáy.
 Các bức sau sẽ dùng chung kỹ thuật và chung một "xưởng".
 
 ## Sổ tay: mài từng lớp
 
-Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng bàn phím), trang mời *"Bức tranh này có 5 lớp — mài thử?"*. Bấm vào là vào **chế độ mài**:
+Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng bàn phím), trang mời *"Bức tranh này có 6 lớp — mài thử?"*. Bấm vào là vào **chế độ mài**:
 
 - Mọi lớp trừ Cốt mờ dần về 0, bức trở về đất sét xám. Nút **"Phủ lớp tiếp theo"** sơn lại từng lớp một và mở
   **Sổ tay** của lớp vừa phủ. Trên **thanh lớp** có thể bật/tắt tự do từng lớp (Cốt thì không). Đóng thanh lớp là về lại
   bức tranh đầy đủ.
 - Sổ tay của mỗi lớp có ba tab. **Hiểu**: lớp làm gì, một sơ đồ, "Bạn vừa học", "Đọc thêm". **Chỉnh**: núm (Tweakpane)
   và code thật của lớp; rê chuột lên một núm thì dòng code dùng núm đó sáng lên. **Phá**: thí nghiệm "Thử phá" (tắt
-  instancing, bias = 0, độ phân giải phản chiếu 0.1…) kèm số đo trực tiếp (draw call, tam giác, mili giây mỗi khung).
-- Ở tầng tranh tĩnh vẫn đọc được Sổ tay (nút "Xem 5 lớp của bức tranh"): chữ, sơ đồ và code; núm cần cảnh 3D.
+  instancing, bias = 0, độ phân giải phản chiếu 0.1, CPU vs GPU…) kèm số đo trực tiếp (draw call, tam giác, mili giây
+  mỗi khung, mili giây CPU). Thí nghiệm so sánh (như "CPU vs GPU", "Chỉ 1 octave") vẽ hai cột "Tắt / Bật".
+- Ở tầng tranh tĩnh vẫn đọc được Sổ tay (nút "Xem 6 lớp của bức tranh"): chữ, sơ đồ và code; núm cần cảnh 3D.
 - Trong DevTools: `__sma.layers()`, `__sma.setWeight('mat-nuoc', 0)` (mài một lớp ngay), `__sma.snapshot()`,
-  `__sma.restore(s)`.
+  `__sma.restore(s)`, `__sma.stats()` (draw call, ms), `__sma.quality()` (mức và nấc đang hạ), `__sma.degrade()` /
+  `__sma.upgrade()` (hạ/nâng tay một nấc).
 - Mất GPU (máy ngủ, đổi card đồ họa): lần đầu trang hiện poster và nút "Dựng lại cảnh", dựng lại đúng trạng thái cũ;
   lần hai thì về tranh tĩnh.
 
+## Chất lượng: hợp với nhiều loại máy
+
+Trang tự chọn mức theo máy: WebGPU trên máy tính là **cao**, WebGPU trên điện thoại hay WebGL2 trên máy tính là **vừa**,
+WebGL2 trên điện thoại là **thấp** (phản chiếu giả, không bóng, ít đom đóm hơn). Sau đó, không ép máy quá sức:
+
+- **Tối đa 60 khung/giây**, kể cả trên màn 90/120/144 Hz: GPU không phải vẽ gấp đôi.
+- **Bộ điều chỉnh tự động** đo nhịp khung theo cửa sổ 2 giây. Chậm (dưới 50 khung/giây trên máy tính, 37 trên điện thoại)
+  thì hạ từng nấc: độ nét (DPR), chi tiết sương, độ nét phản chiếu, bloom, số đom đóm, cỡ bóng. Rảnh lại thì nâng lên.
+  Đang hạ thì huy hiệu ghi *"hạ n nấc"*. Khi Sổ tay mở (bạn đang thử phá), nó chỉ ra tay nếu máy quá tải nặng.
+- **Núm có trần theo mức:** trên máy yếu, núm không kéo được số đom đóm, độ phân giải phản chiếu hay số tầng noise của
+  sương lên quá sức máy.
+- Xem trước mức khác ngay trên máy tính: thêm `?level=thap` (hoặc `vua`, `cao`) vào địa chỉ.
+
 Dựng bằng three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) và Vite 8.
 Máy không dùng được GPU vẫn thấy poster, thơ và con dấu ngày âm lịch (tầng tranh tĩnh).
 Không có backend, tài khoản hay tracking.
@@ -84,6 +100,7 @@ Thêm vào sau địa chỉ trang, ví dụ `…/son-mai-anh-sang/?webgl&freeze=
 | `?at=2026-09-28T21:00` | "Bây giờ" giả lập. Không ghi múi giờ thì hiểu là giờ Việt Nam; muốn ghi thì dùng `Z` hoặc `%2B07:00` |
 | `?freeze`, `?freeze=N` | Đồng hồ tất định: mỗi khung đúng 1/60 giây. `?freeze=N` dừng sau khung N |
 | `?poster` | (Giai đoạn 4) ẩn mọi giao diện trừ canvas, để chụp poster |
+| `?level=cao\|vua\|thap` | Ép mức chất lượng (bỏ qua cách tự chọn theo máy); giá trị lạ thì bỏ qua |
 
 ## Cấu trúc
 
@@ -101,26 +118,26 @@ Luật làm việc với code (cho người và cho AI) nằm trong [CLAUDE.md](
 
 ## Kích thước bundle
 
-Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-09-29 (giai đoạn 2). Tên file đã bỏ phần hash.
+Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-09-30 (giai đoạn 3). Tên file đã bỏ phần hash.
 
 | File | Kích thước | gzip |
 |---|---:|---:|
-| `assets/ao-sen-dem-*.css` | 32.23 kB | 12.19 kB |
-| `assets/ao-sen-dem-*.js` (chunk vào) | 17.74 kB | 8.48 kB |
-| `assets/run-*.js` | 38.99 kB | 12.52 kB |
-| `assets/workshop-*.js` (thanh lớp + Sổ tay) | 10.98 kB | 4.46 kB |
-| `assets/painting-*.js` | 28.84 kB | 11.04 kB |
-| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay) | 22.79 kB | 6.97 kB |
-| `assets/three-*.js` | 897.51 kB | 245.49 kB |
-| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **288.96 kB** |
+| `assets/ao-sen-dem-*.css` | 32.75 kB | 12.30 kB |
+| `assets/ao-sen-dem-*.js` (chunk vào) | 19.00 kB | 8.92 kB |
+| `assets/run-*.js` | 42.83 kB | 14.13 kB |
+| `assets/workshop-*.js` (thanh lớp + Sổ tay) | 12.91 kB | 4.98 kB |
+| `assets/painting-*.js` | 39.73 kB | 15.39 kB |
+| `assets/content.vi-*.js` (chữ + sơ đồ của Sổ tay) | 28.25 kB | 8.63 kB |
+| `assets/three-*.js` | 897.63 kB | 245.55 kB |
+| **Tổng đường 3D** (chunk vào + run + workshop + painting + content + three) | | **297.60 kB** |
 | `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.22 kB | 30.91 kB |
-| 11 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 2.1–6.0 kB mỗi file |
-| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.83 kB | 38.68 kB |
+| 18 chunk `?code` (code đã tô màu của từng file lớp, tải theo lớp) | | 1.6–6.1 kB mỗi file |
+| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.84 kB | 38.66 kB |
 | `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |
 
 Tầng tĩnh chỉ tải CSS (kèm font), poster và chunk vào của trang; mở Sổ tay chỉ đọc thì tải thêm `workshop` và `content`.
 Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.
-Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 320 KB).
+Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: 328.51 kB).
 
 ## Giấy phép
 
```

Chạy `npm run build` rồi đối chiếu các số gzip trong bảng với số Vite in ra. Build của máy khác có thể lệch vài chục byte: sửa bảng theo số thật, và "Tổng đường 3D" là tổng của sáu dòng trên.

- [ ] **Step 2: CLAUDE.md**

```diff
diff --git a/CLAUDE.md b/CLAUDE.md
index d525d3b..e80fc51 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -18,6 +18,8 @@ Trang web 3D để học về vẻ đẹp của 3D, không thương mại. Spec
 
 - Phần nhẹ của xưởng (`src/engine/*.js`: boot, flags, tier, quality, palette, deadline, sma, static) chạy khi poster
   đang hiện và **không kéo theo three**. Phần nặng (`src/engine/gpu/`) chỉ được tải bằng `import()` động ở tầng 3D.
+- Chất lượng (GĐ 3): `engine/quality.js` chọn mức và QUYẾT định hạ/nâng nấc (hàm thuần, test bằng chuỗi khung giả);
+  `engine/gpu/ladder.js` ÁP nấc (`'dpr'` và `layer.degrade`). Bảng số và thứ tự nấc của Bức 1: `paintings/ao-sen-dem/quality.js`.
 - Lớp dùng chung (thuộc kỹ thuật, bức nào cũng lắp được): `src/engine/stock/<id>/`, hiện có Phủ bóng.
 - `src/paintings/registry.js`: danh sách các bức. Node đọc (vite.config, test, e2e); trình duyệt không import.
 - `src/paintings/_mau/`: tranh mẫu 2 lớp, KHÔNG deploy (không có trong registry). Là fixture của test hợp đồng và là
@@ -79,12 +81,25 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
   sprite về `count` 0 hay 1.
 - Vẽ lại ngoài vòng lặp (khi `?freeze=N` đã dừng) phải đợi nhịp `requestAnimationFrame` kế tiếp: scene pass và
   reflector chỉ vẽ lại cảnh một lần mỗi `frameId`, mà `frameId` chỉ tăng ở mỗi nhịp rAF của renderer.
+- `scene.fogNode` nằm trong cache key của MỌI material: gán một lần; mọi thứ đổi lúc chạy trong sương là uniform. `fbm` cần
+  số tầng đổi được thì truyền node (vòng lặp thật trong shader), đừng dựng lại đồ thị.
+- Hạt cộng dồn (Sprite `AdditiveBlending`) đặt `fog = false` và tự nhân emissive với `(1 − hệ số sương)`: fog của three trộn
+  màu đầu ra về màu sương, với additive thì mỗi hạt thành một đĩa màu sương.
+- Shadow map tĩnh (`shadow.autoUpdate = false`): thứ làm bóng đổi (hướng đèn, hình của vật đổ bóng, cỡ map) thì đặt
+  `shadow.needsUpdate = true`. Bias và normalBias chỉ dùng lúc tra bóng: đổi không cần vẽ lại map.
 - `material.mrtNode` chỉ dùng cho material KHÔNG BAO GIỜ bị vẽ vào target không có MRT (ảnh của reflector): nếu lọt vào đó,
   WGSL hỏng ("structures must have at least one member"). Mặt nước của Bức 1 dùng được vì reflector ẩn chính nó.
 - Trong `positionNode` (chạy sau instancing) được gán `normalLocal.assign(…)` để xoay cả pháp tuyến (cánh hoa nở theo uniform).
 - Lũy thừa 2, 3, 4 viết bằng `pow2`/`pow3`/`pow4`; `pow` với số mũ khác thì cơ số phải chắc chắn ≥ 0 (`saturate`, `abs`).
   GLSL/WGSL không định nghĩa `pow` của số âm: SwiftShader vẫn ra số, GPU thật có thể ra NaN.
 
+### Chất lượng và phần cứng (GĐ 3: sản phẩm phải hợp nhiều loại máy)
+- Nấc (`Layer.degrade`) chỉ hạ TRẦN, không ghi vào núm; hiệu lực = min(núm, trần); không đổi thứ nằm trong cache key.
+  Lớp chỉ đưa nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng).
+- Núm nào kéo lên được quá sức máy yếu thì đặt trần theo mức: `max: (env) => …` (như `value`). Thí nghiệm nặng có trần.
+- Cảnh vẽ tối đa 60 khung/giây (`createFrameCap` trong run.js): đừng thêm vòng `requestAnimationFrame` riêng để vẽ cảnh.
+- Số lượng theo máy (số lá, số hạt, độ phân giải…) đọc từ `ctx.budget` (bảng `quality.js` của bức), không viết cứng.
+
 ### Chuyển động và ngẫu nhiên
 - Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
 - Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).
@@ -117,7 +132,9 @@ Repo có `.nvmrc` ghi `24`; trong thư mục repo, `node -v` phải ra `v24.x`.
   Không sửa git config global.
 
 ## Gỡ lỗi nhanh
-- Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?debug=stats`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`.
+- Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?debug=stats`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`,
+  `?level=cao|vua|thap` (ép mức chất lượng: xem mức thấp ngay trên máy tính).
 - `?debug` mở three.js Inspector (draw call, thời gian GPU, cây node); `?debug=stats` mở stats-gl.
 - `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`. Khi cảnh live còn có
-  `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`.
+  `__sma.layers()`, `__sma.setWeight(id, v)` (mài một lớp ngay), `__sma.snapshot()`, `__sma.restore(s)`, `__sma.stats()`
+  (draw call, ms, ms CPU), `__sma.quality()` (nấc đang hạ), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc).
```

- [ ] **Step 3: Spec**

```diff
diff --git a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
index 885388f..8574260 100644
--- a/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
+++ b/docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
@@ -228,6 +228,13 @@ Nguồn là trường bắt buộc `poem.source` trong meta.
 - Lớp Mặt nước: *"Vầng trăng ai xẻ làm đôi / Nửa in gối chiếc, nửa soi dặm trường"* (Truyện Kiều, Nguyễn Du).
 - Lớp nào cũng có thể thêm một câu ngắn khác, nhưng phải là văn học dân gian hoặc cổ điển đã hết bản quyền, và phải ghi nguồn.
 
+### Lượt màu (GĐ 3)
+Đo trên GPU thật, cùng khung 1280×800 (độ sáng trung bình / độ bão hòa / tỉ lệ điểm tối): poster 33 / 0,42 / 30%; bản GĐ 2 là
+48 / 0,54 / 30%; bản GĐ 3 trước lượt màu là 64 / 0,31 / 10%. Thứ làm ảnh bệch nhất là **quầng bloom của 3.000 con đom đóm**
+(tắt Vàng lá: độ sáng 63 → 47, điểm tối 8% → 28%), không phải sương hay đèn. Lượt màu: đom đóm dịu lại (`glow` 3 → 1,8), sương
+mỏng và tối hơn, đỉnh trời chàm đậm hơn, đèn trời chàm yếu đi (7 → 4), thân lá bớt bóng (`specularIntensity` 0,3), nước sâu
+ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc định của núm hay hằng số, nằm trong một commit riêng.
+
 ### Chi tiết sống
 - **Trăng đúng pha của đêm hôm đó**, tính từ `ctx.now`. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
 - **Con dấu đỏ ghi ngày âm lịch** ở góc tranh, ví dụ *"18 tháng Tám · Bính Ngọ"*. Bức nào cũng có (luật 5).
@@ -1096,12 +1103,12 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
   - "Cảnh" là số đối tượng renderable trong scene; riêng ao sen khoảng 5.
   - Mục tiêu ở mức cao: cảnh ≤ 10 và tổng ≤ 45. Cảnh thử 4 đối tượng đã đo được 21.
   - (GĐ 3) Bóng tĩnh chỉ vẽ khi có thay đổi, nên khung thường không có phần `2 × bóng`. Bức 1 đủ sáu lớp có 11 đối tượng (Cốt 6,
-    trăng, đèn hoa đăng, vòm trời, mặt nước, đom đóm): ước `11 + 10 + 12 + 1 = 34` ở mức cao. Mục tiêu chính là **tổng ≤ 45**
-    (e2e đo ở mức cao); mức thấp không có phản chiếu nên còn khoảng 24.
+    trăng, đèn hoa đăng, vòm trời, mặt nước, đom đóm): `11 + 10 + 12 + 1 = 34` ở mức cao, **đo được đúng 34** trên cả WebGPU lẫn
+    WebGL2; mức thấp không có phản chiếu nên đo được 24. Mục tiêu chính là **tổng ≤ 45** (e2e đo ở mức cao).
 - **Poster:** WebP 150 KB trở xuống (GĐ 4).
 - **JS:**
   - Chunk `three` đo được khoảng 243 KB gzip. Con số này gần như cố định, vì `three/tsl` kéo cả namespace nên không tree-shake được.
-  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB.)
+  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,6 KB; cộng Tweakpane 328,5 KB.)
   - Mục tiêu cho cả đường 3D: **450 KB gzip trở xuống**. Số đo ghi vào README.
   - Inspector (39 KB) và stats-gl (10 KB) chỉ tải khi có `?debug`.
 - **Máy yếu:** biên dịch trước bằng `scenePass.compileAsync(renderer)`, rồi vẽ một khung ẩn trong lúc poster còn hiện.
@@ -1254,6 +1261,8 @@ tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (n
   - Bức 1: vuốt trên mặt nước thì ảnh khác lần không vuốt (cùng `?at&freeze`); ở mức cao (`webgpu-swiftshader`) `__sma.stats().drawCalls`
     ≤ 45; `?level=thap` lên live với `__sma.level === 'thap'`, ảnh có sáng có tối; Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU"
     thì hai cột "Tắt / Bật" đều có số.
+- (GĐ 3) Ngưỡng "có sáng có tối" của e2e: điểm tối (kênh lớn nhất < 30) trên 3% (trước là 10%): trời chàm và sương làm ảnh ít
+  điểm đen tuyệt đối hơn nền đen then cũ (đo được 7–8% ở khung 10); 3% vẫn đủ chứng minh ảnh không cháy trắng, không trống.
 - **GĐ 4:** "mài về cốt". Mọi trọng số về 0 thì ảnh có độ bão hòa thấp, độ sáng trung bình gần `datSet`, và độ lệch chuẩn độ sáng đủ lớn (thấy hình khối).
 - Ảnh chụp và trace lưu vào `e2e/.results/`.
 
@@ -1552,13 +1561,22 @@ Các mục dưới đây đã được kiểm bằng ba cách:
 34. **Sương áp lên đầu ra của MỌI NodeMaterial có `fog = true`, kể cả Sprite** (đọc mã nguồn r186, GĐ 3): `NodeMaterial.setupOutput`
     thay đầu ra bằng `fogNode`, tức `mix(output.rgb, màu sương, hệ số)`, SAU khi emissive đã cộng vào ánh sáng. Hạt vẽ bằng
     `AdditiveBlending` mà để `fog = true` thì mỗi hạt cộng thêm một đĩa màu sương: phải đặt `fog = false` và tự nhân `(1 − hệ số)`.
-35. **Shadow map tĩnh** (đọc mã nguồn r186, GĐ 3): `ShadowNode.updateBefore` vẽ khi `shadow.needsUpdate || shadow.autoUpdate`, tối đa
+35. **Shadow map tĩnh** (đọc mã nguồn r186 và kiểm bằng code chạy thật, GĐ 3: e2e đo 34 draw call ở mức cao, bóng không còn
+    vẽ lại mỗi khung): `ShadowNode.updateBefore` vẽ khi `shadow.needsUpdate || shadow.autoUpdate`, tối đa
     một lần cho mỗi camera mỗi `frameId`, rồi đặt `needsUpdate = false`; không vẽ trong lúc biên dịch trước (`_isPreCompiling`).
     `renderShadow` gọi `shadowMap.setSize(mapSize)` và `shadow.updateMatrices(light)` mỗi lần vẽ. Vì vậy với `autoUpdate = false`,
     đổi cỡ map, bias hay hướng đèn thì phải đặt `needsUpdate = true` thì mới có hiệu lực.
-36. **`BloomNode` đọc `resolutionScale` mỗi khung** (đọc mã nguồn r186, GĐ 3): `updateBefore` gọi `setSize(kích thước, …)` với
+36. **`BloomNode` đọc `resolutionScale` mỗi khung** (đọc mã nguồn r186 và kiểm bằng e2e "hạ hết nấc rồi nâng lại", GĐ 3): `updateBefore` gọi `setSize(kích thước, …)` với
     `_resolutionScale` hiện tại, và `RenderTarget.setSize` chỉ cấp phát lại khi kích thước đổi. `setResolutionScale` lúc chạy
     không biên dịch lại.
-37. **Vòng lặp thật và thuộc tính instance động trong TSL** (đọc mã nguồn r186, GĐ 3): `Loop`, `Break`, `Continue` có trong
-    `three/tsl` (`LoopNode.js`); `instancedDynamicBufferAttribute(attr)` là thuộc tính instance với `DynamicDrawUsage`. Bản dựng
-    thử của GĐ 3 kiểm lại cả ba mục 35–37 bằng code chạy thật, và bổ sung mục mới vào đây.
+37. **Vòng lặp thật và thuộc tính instance động trong TSL** (kiểm bằng code chạy thật trên WebGPU và WebGL2, cả SwiftShader lẫn
+    GPU thật, GĐ 3): `Loop(5, ({ i }) => { If(float(i).greaterThanEqual(u), () => { Break(); }); … })` với `u` là uniform biên dịch
+    và chạy đúng trên WGSL lẫn GLSL (sương của lớp Sương); `i` là số nguyên nên phải đổi sang float trước khi so với uniform.
+    `instancedDynamicBufferAttribute(attr)` (thuộc tính instance, `DynamicDrawUsage`) làm `positionNode` của một `Sprite` có
+    `count` chạy được: CPU ghi mảng rồi `attr.needsUpdate = true` mỗi khung (biến thể CPU của lớp Vàng lá).
+38. **Sao không cần ảnh** (GĐ 3): `mx_cell_noise_float(floor(hướng × 220))` cho mỗi ô lưới một số ngẫu nhiên cố định; ô nào vượt
+    ngưỡng thì có sao, lệch trong ô bằng ba lần `mx_cell_noise_float` nữa. Chạy trên cả hai backend, trong cả ảnh phản chiếu.
+39. **Số đo chi phí** (GĐ 3, máy Mac Apple Silicon, Chromium, GPU thật): noise gradient 3D viết bằng JS tốn khoảng 30 ns một lần
+    gọi (Node 24); một bước của 20.000 đom đóm trên CPU (18 lần gọi noise mỗi con) tốn khoảng 11 ms, 3.000 con khoảng 2 ms, trong
+    khi bản compute chỉ tốn phần gửi lệnh. ms mỗi khung đứng yên ở 16,7 dù CPU bận thêm vài ms: trình duyệt khóa nhịp theo màn
+    hình, nên thí nghiệm so sánh phải đo cả ms CPU.
```

- [ ] **Step 4: Commit**

Run: `npm test` (xanh, `Tests  567 passed`).

```bash
git add README.md CLAUDE.md docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -F - <<'EOF'
docs: README, CLAUDE.md và spec theo GĐ 3 (sáu lớp, chất lượng hợp nhiều loại máy, ?level, số đo thật, lượt màu, Phụ lục A.35–39)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

---

### Task 18: Nghiệm thu: review toàn nhánh, PR, CI; kiểm trên máy thật

**Mục tiêu:** Nhánh sẵn sàng merge. Hai reviewer độc lập đã đọc toàn nhánh, CI xanh, ảnh trước và sau nằm trong PR. Việc kiểm trên máy thật được giao rõ cho Bao.

**Files:** những file mà review yêu cầu sửa (mỗi sửa một commit, kèm test).

**Interfaces:**
- Consumes: toàn bộ nhánh.
- Produces: PR `gd3-suong-vang-la` → `main`.

- [ ] **Step 1: Hai reviewer độc lập (chạy nền, song song)**

Gửi cho `pr-review-toolkit:code-reviewer` và `pr-review-toolkit:silent-failure-hunter` cùng một phạm vi: `git diff main...gd3-suong-vang-la`, kèm spec và kế hoạch này. Nhắc hai reviewer những chỗ dễ sai:
- bộ điều chỉnh: ba bẫy, chế độ canh, cờ `?freeze`;
- nấc gỡ ra có trả đúng trạng thái không;
- bóng tĩnh có bỏ sót thứ làm bóng đổi không;
- `scene.fogNode` chỉ gán một lần;
- hạt cộng dồn và fog;
- trần núm theo mức và bộ đệm cấp phát theo trần;
- trần 60 khung/giây với `?freeze`;
- aria-live của dòng "Lớp này đang tắt".

- [ ] **Step 2: Sửa theo review (mỗi lỗi thật một test hỏng trước, rồi một commit), và cho reviewer đọc lại MỌI commit sửa**

Ở GĐ 2, reviewer tìm ra lỗi thật, và tìm ra cả lỗi trong lần sửa đầu tiên. Đừng push một commit sửa chưa được đọc lại. Góp ý nào không đúng thì ghi rõ lý do vào PR, không sửa cho có.

- [ ] **Step 3: Kiểm toàn bộ lần cuối**

```bash
npm test
npm run build
npx playwright test --project=static --project=webgl2-swiftshader
npx playwright test --project=webgpu-swiftshader
E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu
```
Kết quả mong đợi: tất cả xanh (số test như Task 15, cộng test mới của các lần sửa).

- [ ] **Step 4: Push và mở PR**

```bash
git push -u origin gd3-suong-vang-la
gh pr create --base main --head gd3-suong-vang-la --title "GĐ 3 · Sương + Vàng lá GPU + bộ điều chỉnh chất lượng" --body-file <file tạm>
```
Thân PR (tiếng Việt), gồm:
- tóm tắt GĐ 3 theo spec §14;
- các biện pháp giữ phần cứng nhẹ;
- số test, e2e và kích thước bundle;
- ảnh trước và sau (Task 16);
- danh sách kiểm tay của Bao (Step 6).

Dòng cuối: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

- [ ] **Step 5: CI**

```bash
gh run watch
```
Kết quả mong đợi:
- `npm test`, build, e2e `static` + `webgl2-swiftshader` xanh (bước chặn);
- `webgpu-swiftshader` không chặn, nhưng mong là cũng xanh.

Merge vào `main` là việc của Bao; merge xong thì Pages tự deploy.

- [ ] **Step 6: Kiểm tay (Bao, sau khi deploy; spec §12)**

- Điện thoại tầm trung (Android, và iPhone nếu có): mở `…/son-mai-anh-sang/?debug=stats`, để yên 30 giây; khung hình ≥ 45 fps. Huy hiệu có thể ghi "hạ n nấc": đó là bộ điều chỉnh đang làm việc.
- Máy có màn 120 Hz (MacBook Pro, iPhone Pro): stats-gl cho thấy tối đa khoảng 60 fps.
- Bật Low Power Mode (iPhone) hay Energy Saver (Chrome chạy pin): cảnh không bị hạ dần tới mờ; sau khoảng nửa phút, nấc trả lại hết.
- Vuốt trên mặt nước: sương xoáy rồi lắng. Giữ tay: đom đóm tụ lại.
- Sổ tay › Vàng lá › Phá › "CPU vs GPU": cột ms CPU của "Bật" cao hơn rõ.
- Màu: so với poster; muốn chỉnh tiếp thì dùng núm trong Sổ tay, rồi ghi giá trị mới vào một commit riêng.
