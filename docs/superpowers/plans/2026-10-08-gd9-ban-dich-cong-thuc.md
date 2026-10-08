# GĐ 9 · Bản dịch và Link công thức: kế hoạch thực thi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm hai công cụ học của xưởng cho cả bốn bức, đúng spec §21, trên nhánh `gd9-ban-dich-cong-thuc`, tới mức sẵn sàng merge:
- **Bản dịch** trong Sổ tay › Chỉnh: mã shader thật mà GPU chạy, ở mọi nơi một lớp có mặt; dòng có uniform của lớp sáng lên; rê núm thì sáng
  dòng của núm;
- **Link công thức** `#r=…`: chép link, thanh địa chỉ tự mang công thức, mở link thì cảnh hiện thẳng theo công thức với thanh lớp mở sẵn;
- sửa kèm một lỗi có từ GĐ 4: chọn view Normal của Kính mài lúc cảnh đang chạy vẽ khung vào render target của scene pass (spec §21.3).

**Architecture:**
- **Giữ khung** (`engine/gpu/hold.js`, mới). three r186 dựng mã của vật TRONG lúc `compileAsync` nhường luồng chính, và lúc dựng đọc render
  target + MRT đang đặt trên renderer (Phụ lục A.103, A.105). Việc nào phải để target của lượt khác qua một lần chờ thì chạy trong
  `hold.run()`: lúc giữ, `scene.step()` bỏ khung như thử ngừng vẽ, vẽ lại khung đứng yên chờ thả. Hai người dùng: `pipeline.compile()` (sửa
  Normal) và `translate.js`.
- **Bản dịch** (`engine/gpu/translate.js`, mới). Đặt target + MRT của scene pass rồi `await renderer.debug.getShaderAsync(scene, camera, vật)`
  trong lúc giữ khung. Quad cuối (`renderPipeline._quadMesh`, trường riêng duy nhất) dịch như `RenderPipeline.render()` vẽ nó. Nơi lớp có
  mặt = mọi vật vẽ được và quad cuối mà mã có uniform của lớp (`w_<id>`, `<id>_<knobId>`). Sổ tay chỉ thấy bàn thợ: `studio.translation(id)`.
- **Công thức.**
  - `engine/recipe.js` (mới, đường nhẹ) đọc và ghi chuỗi `khóa:giá trị`.
  - `engine/gpu/recipe-set.js` (mới) giữ mặc định của máy đang xem, phân loại khóa, tính khác biệt.
  - Công thức áp lúc dựng: `createKnobs` nhận giá trị ban đầu; trọng số và Dial đặt trước lần biên dịch đầu.
  - `engine/gpu/recipe-url.js` (mới) ghi hash bằng `replaceState` (gộp 500 ms) và nghe `hashchange`.
  - Thanh lớp có mục Công thức và dòng tóm tắt (`ui/recipe-panel.js`).

**Tech Stack:** three@0.186.1 (WebGPURenderer + TSL), Vite 8, Vitest 5, Playwright 1.63, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`:
- §21 (cả chương);
- cùng §1 (GĐ 9), §7, §8.1, §8.4, §8.7, §9, §12, §14, §16 và Phụ lục A.102–A.105.

Spec đã sửa một lần sau khi Bao duyệt (commit `cc0d64a`): bản đầu của §21.3 có bước "làm nóng không giữ khung", sai vì A.105. Người thực thi
đọc cả spec lẫn plan.

## Cách dùng plan này (đọc trước)
- **Plan gọn, theo ý Bao** (§21.9; làm thẳng trên nhánh, vừa làm vừa sửa, như GĐ 6–8).
  - Code đầy đủ chỉ ở chỗ khó: giữ khung, đọc mã, quad cuối, đọc/ghi công thức, thanh địa chỉ, tô màu mã.
  - Phần giao diện, plan ghi dựng gì, theo mẫu nào, kiểm ra sao.
- **Code trong plan CHƯA chạy thật.**
  - Sai thì sửa ngay trong task, và ghi một dòng `Lệch plan: …` vào thân commit.
  - Làm khác spec thì sửa spec (§21 hay Phụ lục A) trong cùng commit.
- **Ba điểm dừng:**
  - **Task 2** (luật dừng bốn điều, §21.9): một điều không đạt thì DỪNG, báo Bao, kèm đường lùi "bắt lúc vẽ".
  - **Task 6** (duyệt ảnh): DỪNG, gửi Bao trang ảnh riêng tư; chờ duyệt rồi mới làm Task 7.
  - **Task 9**: hỏi Bao trước khi push, và hỏi lại trước khi merge (merge là deploy).
- **Task nào cũng đi đủ năm bước:**
  1. viết test trước, chạy cho thấy đỏ;
  2. làm cho xanh;
  3. chạy thật (lệnh ghi trong task);
  4. chạy `npm test` cả bộ, phải xanh;
  5. commit, với email cá nhân và dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Trước khi bắt đầu
- **Node 24.** `node -v` phải ra `v24.x`. Máy của Bao chỉ có Node 20 và không có fnm: dùng bản portable trong scratchpad, không sửa
  `~/.zshrc`:

  ```bash
  SP=<scratchpad của phiên>
  test -x "$SP/node-v24.21.0-darwin-arm64/bin/node" || curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz | tar -xz -C "$SP"
  export PATH="$SP/node-v24.21.0-darwin-arm64/bin:$PATH"   # đặt ở đầu MỌI lệnh npm/npx/node
  node -v                                                  # v24.21.0
  ```
- **Nhánh.** Làm trên `gd9-ban-dich-cong-thuc` (từ main `ddb6488`; spec `c55548d`, `cc0d64a`; plan là commit kế tiếp). Trước mỗi task,
  `git status` phải sạch.
- **Mốc ban đầu.** Chạy `npm test` một lần trước Task 1. Phải xanh (1451 test ở `ddb6488`); ghi số vào sổ.
- **E2E local:**
  - SwiftShader rất nặng CPU: chạy một mình, đừng chạy cùng reviewer hay `npm test`.
  - Trước khi tin một lần hỏng vì `timeout`, xem `ps -Ao pcpu,comm -r | head`. Không tắt process của Bao.
  - Không để `vite preview --port 4273` cũ còn chạy: Playwright dùng lại server đang mở và test nhầm `dist/` cũ.
  - GPU thật: `npm run build && E2E_REAL_GPU=1 npx playwright test … --project=webgpu-real-gpu`.
  - Đĩa: e2e cần chừng 1 GB trống (`df -h /`); scratchpad cũ của các task trước thì dọn.
- **Không push.** Push hay mở PR chỉ ở Task 9, sau khi Bao đồng ý. Merge (là deploy) thì hỏi lại Bao lần nữa.

## Global Constraints
Mọi task ngầm gồm các luật dưới đây, chép từ `CLAUDE.md` và spec. Số và tên giữ đúng như ghi.
- **Nguồn tham chiếu:** chỉ TSL, `three@0.186.1`; đối chiếu API với `node_modules/three/src`. Không dùng `ShaderMaterial`,
  `RawShaderMaterial`, `EffectComposer`, `onBeforeCompile`, và các API deprecated (`PostProcessing`, `renderAsync`, `label()`…).
- **Trường riêng của three:** chỉ `engine/gpu/translate.js` được đọc `_quadMesh` và gọi `debug.getShaderAsync` (luật mới, Task 2). Test và
  script kiểm một lần (không commit) được đọc trường riêng khác.
- **`renderer.toneMapping`:** không đổi lúc chạy. Ngoại lệ duy nhất là lúc dịch quad cuối trong `translate.js`, làm y như
  `RenderPipeline.render()` làm mỗi khung (đổi rồi trả trong cùng một lần giữ khung; Phụ lục A.104).
- **Vẽ lại ngoài vòng lặp** (khi `?freeze=N` đã dừng) đợi nhịp `requestAnimationFrame` kế tiếp; từ GĐ 9 còn đợi thả giữ khung.
- **`tuner.sample()` trả `'skip'`** thì `scene.step()` bỏ hết phần sau `quality.sample()`. Giữ khung đi qua đúng dòng đó (`sample()` trả
  `true`), không thêm lối thoát nào khác trong `step()`.
- **Ranh giới:**
  - `ui/` không import engine hay three: mọi thứ của cảnh đến qua `studio()`.
  - Xưởng không chứa từ vựng của bức nào (slug, id lớp, `meta.fence`). Không rẽ nhánh theo `slug`.
  - Bức không đổi gì trong GĐ 9 (không file nào trong `src/paintings/` đổi, trừ khi một test hợp đồng mới đỏ thật).
- **Đường nhẹ** (bao đóng import tĩnh của `engine/boot.js`, mà `engine/recipe.js` thuộc vào): không built-in ES2022 trở lên (`Object.hasOwn`,
  `Array.prototype.at`, `structuredClone`). Phần nặng thì được.
- **Hợp đồng chỉ thêm, không đổi nghĩa.** Id đã deploy (slug, layerId, knobId, dialId) là API công khai: không đổi. `Snapshot` giữ nguyên
  dạng.
- **Chữ:**
  - Chữ người xem thấy chỉ ở `strings.*.js` (xưởng: `t.translation`, `t.recipe`). Không file nào trong `src/` import `strings.*.js`:
    nhận `t` qua tham số.
  - Vùng `aria-live` không bao giờ dùng `hidden`: để trống khi không có gì để nói (CSS thu lại khi `:empty`).
  - Thông báo lỗi và cảnh báo cho lập trình viên viết tiếng Việt.
- **Bố cục:** thứ tự DOM của các tấm cố định giữ nguyên (thanh lớp → thanh công cụ → Sổ tay); thứ mới nằm TRONG thanh lớp hay trong tab Chỉnh.
  Phần tử có con `position: fixed` không có `transform`, `filter`, `backdrop-filter`. Cặp `@media` bù nhau (quy ước `.98`).
- **Quy ước file:**
  - Dòng 1 của mọi `src/**/*.js`: `// <đường dẫn từ src/> — <một câu tiếng Việt>`.
  - Mỗi file khoảng 250 dòng trở xuống; quá 300 là test hỏng. Đang sát: `run.js` 248, `notebook.js` 244, `studio.js` 231.
  - ESM + JSDoc, tên biến tiếng Anh, import tương đối ghi đuôi `.js`. Test cần DOM ghi `// @vitest-environment jsdom` ở dòng 1.
- **Commit:** `Bao Nguyen <giabao261096@gmail.com>` (đã cấu hình trong repo). Không sửa git config global.

## Review Focus
Năm nhóm đầu vào mà spec ngụ ý nhưng test của từng task dễ bỏ sót, xếp từ dễ gặp nhất. Mỗi dòng đã có test ở task sở hữu nó.
1. **Hash bẩn:**
   - `#r=` rỗng, `#r=,,,`, khóa lạ, giá trị sai kiểu, phần trăm hỏng (`%E0%A4%A`);
   - 3.000 ký tự, khóa lặp, `#r=cot:0`;
   - Dial ngoài khoảng, màu 3 chữ số, lựa chọn không có;
   - link của bức này dán vào bức khác.

   Kỳ vọng: mục hỏng bị bỏ kèm MỘT dòng cảnh báo, phần còn lại vẫn áp, cảnh live. Test: Task 4 (unit `readRecipe`), Task 5 (unit
   `classify`, test cảnh với công thức hỏng), Task 7 (e2e Bức 1).
2. **Thay đổi dồn dập:** kéo núm liên tục 5 giây (hơn 100 lần đổi), bật tắt lớp liên tục, `hashchange` trong lúc đang ghi.

   Kỳ vọng: `replaceState` tối đa 2 lần/giây; không `SecurityError`; chuỗi cuối cùng trên thanh địa chỉ đúng với cảnh. Test: Task 6
   (unit `recipe-url` với đồng hồ giả), Task 7 (e2e đếm lần ghi).
3. **Đang dịch mà người xem làm việc khác:**
   - đổi núm `rebuild`, bật thí nghiệm, đổi lớp trong Sổ tay, đóng Sổ tay;
   - chọn Normal của Kính mài (MRT đổi) giữa lúc dịch;
   - `?freeze` đổi núm giữa lúc dịch.

   Kỳ vọng: không khung nào vẽ với target sai; giữ khung luôn được thả; kết quả của lần dịch cũ bị bỏ; mã dịch lại theo MRT mới. Test:
   Task 1 (unit giữ lồng nhau, vẽ lại chờ thả), Task 2 (unit lỗi giữa chừng, mỗi lúc một lần đọc, khóa theo MRT), Task 3 (unit bỏ kết quả cũ).
4. **Link mở trên máy khác:**
   - link làm ở mức cao mở ở `?level=thap` (trần núm thấp hơn);
   - link có Dial giờ mở ban ngày;
   - link mở ở WebGL2.

   Kỳ vọng: giá trị kẹp theo trần của máy mở, không lỗi; mặc định là của máy mở. Test: Task 5 (unit `env` mức thấp), Task 7 (e2e
   `?level=thap` cộng công thức).
5. **Khung hẹp và trợ năng:**
   - điện thoại 390 × 844 (chip công thức trên dải thanh lớp, Bản dịch trong tấm trượt);
   - bàn phím (Tab tới nút Bản dịch, ô Vật, Đỉnh/Điểm ảnh, nút chép link);
   - trình đọc màn hình (dòng trạng thái, "Đã chép link").

   Kỳ vọng: không chồng tấm, không tràn ngang, mọi nút bấm trúng, axe sạch. Test: Task 3 và Task 6 (jsdom: vai trò, aria), Task 7 (a11y,
   e2e khung điện thoại).

## Bản đồ file
| File | Task | Việc |
|---|---|---|
| `src/engine/gpu/hold.js` | 1 | giữ khung: `run`, `active`, `idle`, `onRelease` |
| `src/engine/gpu/scene-quality.js` | 1 | lúc giữ thì `sample()` trả `true`; thôi giữ thì bộ quyết định đo lại |
| `src/engine/gpu/pipeline.js` | 1 | `compile()` chạy trong `hold.run` (sửa Normal lúc cảnh đang chạy) |
| `src/engine/gpu/scene.js` | 1, 2, 5 | dựng `hold`; vẽ lại chờ thả; bộ dịch; công thức lúc dựng |
| `src/engine/gpu/translate.js` | 2 | bản dịch: vật, quad cuối, nơi lớp có mặt |
| `src/engine/gpu/studio.js` | 2, 5 | `translation`; `onChange`; trải ba hàm công thức |
| `src/engine/sma.js` | 2, 5 | `translate`, `recipe`, `applyRecipe` |
| `src/ui/shader-text.js` | 3 | tô màu WGSL/GLSL, đánh dấu uniform (hàm thuần) |
| `src/ui/translation-view.js` | 3 | khung Bản dịch |
| `src/ui/code-view.js`, `src/ui/notebook.js` | 3 | nút Bản dịch; sáng theo núm; dịch lại sau thay đổi |
| `src/ui/strings.vi.js` | 2, 3, 5, 6 | `t.translation`, `t.recipe` |
| `src/styles/notebook.css` | 3, 6 | khung Bản dịch; mục Công thức, dòng tóm tắt, chip trên điện thoại |
| `src/engine/recipe.js` | 4 | `readRecipe`, `writeRecipe`, `formatValue`, `stepDecimals` |
| `src/engine/gpu/recipe-set.js` | 5 | mặc định, `classify`, `diff`, `countsOf`, `recipeMethods` |
| `src/engine/gpu/knob-set.js`, `layers.js` | 5 | giá trị ban đầu từ công thức |
| `src/engine/boot.js`, `static.js`, `gpu/run.js` | 5, 6 | đọc `#r=`; câu của tầng tĩnh; mở xưởng theo công thức |
| `src/engine/gpu/workshop-door.js` | 6 | tách từ `run.js`: lời mời, mở xưởng (mài hay theo công thức) |
| `src/engine/gpu/recipe-url.js` | 6 | thanh địa chỉ: `replaceState` gộp 500 ms, `hashchange` |
| `src/ui/recipe-panel.js`, `layer-rail.js`, `workshop.js` | 6 | mục Công thức, dòng tóm tắt, Về nguyên bản |
| `src/engine/contracts/runtime.js` | 2, 5 | JSDoc: `Studio` thêm hàm, typedef `Translation` |
| `tests/unit/*`, `tests/rules/files.test.js`, `tests/paintings/*` | 1–7 | như từng task |
| `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`, `e2e/a11y.spec.js` | 1, 2, 7 | e2e chung mọi bức; đường đủ của Bức 1; a11y |
| `CLAUDE.md`, `README.md`, spec | 8 | tài liệu khớp code |

---

### Task 1: Giữ khung, và sửa Normal lúc cảnh đang chạy (lỗi từ GĐ 4)

**Files:**
- Create: `src/engine/gpu/hold.js`, `tests/unit/hold.test.js`, `tests/unit/scene-quality.test.js`
- Modify: `src/engine/gpu/scene-quality.js`, `src/engine/gpu/pipeline.js`, `src/engine/gpu/scene.js`, `tests/unit/scene.test.js`,
  `e2e/painting.spec.js`

**Interfaces:**
- Produces: `createHold()` → `{ active, run(fn), idle(), onRelease(cb) }`; `createPipeline({ …, hold })`; `createQuality({ …, hold })`;
  `buildScene(...)` trả thêm `hold`.

- [ ] **Step 1: E2E đỏ trước.** Trong `e2e/painting.spec.js`, describe `${meta.title} · 3D`, ngay sau test 'Normal (GĐ 4)':

```js
    test('Normal lúc cảnh đang chạy (GĐ 9, lỗi từ GĐ 4): biên dịch lại trong lúc giữ khung, không lỗi GPU, cảnh vẫn live', async ({
      page,
    }, testInfo) => {
      test.setTimeout(120_000);
      const { query } = testInfo.project.metadata;
      // KHÔNG ?freeze: vòng lặp chạy trong lúc biên dịch lại cả cảnh với MRT mới (spec §21.3, Phụ lục A.105).
      await page.goto(urlOf(htmlPage, query));
      const settled = await waitForSettled(page);
      expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
      await page.evaluate(() => window.__sma.setTool('kinh-mai'));
      const normal = page.locator('[data-toolbar] [data-view="normal"]');
      await normal.click();
      await expect(normal).toHaveAttribute('aria-pressed', 'true', { timeout: 60_000 });
      const after = (await readSma(page)).frames;
      await expect.poll(async () => (await readSma(page)).frames, { timeout: 60_000 }).toBeGreaterThan(after + 10);
      expect((await readSma(page)).state).toBe('live');
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });
```

Chạy trên code cũ (`npm run build && npx playwright test e2e/painting.spec.js -g "Normal lúc cảnh đang chạy" --project=webgl2-swiftshader`,
rồi `E2E_REAL_GPU=1 … --project=webgpu-real-gpu`). Kỳ vọng ĐỎ:
- WebGL2: `GL_INVALID_OPERATION: glDrawArrays: Active draw buffers with missing fragment shader outputs`;
- WebGPU: `Render pipeline creation failed … Color target has no corresponding fragment stage output`.

Ghi số lỗi vào sổ. Cảnh báo khác không liên quan mà luôn có ở trang không `?freeze` thì ghi ra, rồi lọc đúng câu đó kèm lý do; không nới cả
mảng `warnings`.

- [ ] **Step 2: Unit đỏ trước.** `tests/unit/hold.test.js`:

```js
// tests/unit/hold.test.js — bộ giữ khung (GĐ 9): giữ trong lúc việc async chạy, luôn thả kể cả khi lỗi, lồng nhau, idle() và onRelease.
import { describe, it, expect, vi } from 'vitest';
import { createHold } from '../../src/engine/gpu/hold.js';

/** Việc async mà test tự kết thúc. */
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('createHold', () => {
  it('run(): giữ NGAY lúc gọi (đồng bộ), thả khi việc xong, trả đúng giá trị', async () => {
    const hold = createHold();
    const job = deferred();
    const run = hold.run(() => job.promise);
    expect(hold.active).toBe(true);
    job.resolve(42);
    await expect(run).resolves.toBe(42);
    expect(hold.active).toBe(false);
  });

  it('việc ném lỗi (đồng bộ hay async): vẫn thả, lỗi tới người gọi', async () => {
    const hold = createHold();
    await expect(hold.run(() => { throw new Error('a'); })).rejects.toThrow('a');
    expect(hold.active).toBe(false);
    const job = deferred();
    const run = hold.run(() => job.promise);
    job.reject(new Error('b'));
    await expect(run).rejects.toThrow('b');
    expect(hold.active).toBe(false);
  });

  it('lồng nhau: thả hết mới hết giữ; idle() và onRelease báo đúng một lần, lúc thả hết', async () => {
    const hold = createHold();
    const released = vi.fn();
    hold.onRelease(released);
    const a = deferred();
    const b = deferred();
    const runA = hold.run(() => a.promise);
    const runB = hold.run(() => b.promise);
    let idle = false;
    hold.idle().then(() => { idle = true; });
    a.resolve();
    await runA;
    expect(hold.active).toBe(true);
    expect(idle).toBe(false);
    expect(released).not.toHaveBeenCalled();
    b.resolve();
    await runB;
    await Promise.resolve();
    expect(idle).toBe(true);
    expect(released).toHaveBeenCalledTimes(1);
  });

  it('idle() khi không ai giữ: xong ngay; onRelease trả hàm bỏ nghe', async () => {
    const hold = createHold();
    await expect(hold.idle()).resolves.toBeUndefined();
    const cb = vi.fn();
    hold.onRelease(cb)();
    await hold.run(() => {});
    expect(cb).not.toHaveBeenCalled();
  });
});
```

`tests/unit/scene-quality.test.js` (file mới):

```js
// tests/unit/scene-quality.test.js — bộ điều chỉnh của một cảnh (GĐ 9): lúc giữ khung thì bỏ khung; thôi giữ thì bộ quyết định đo lại từ đầu.
import { describe, it, expect, vi } from 'vitest';
import { createQuality } from '../../src/engine/gpu/scene-quality.js';
import { createHold } from '../../src/engine/gpu/hold.js';

const ladder = { ids: () => [], idAt: () => null, down: () => false, up: () => false, reset() {} };
const timer = { available: false };
const tunerSpy = () => ({
  sample: vi.fn(() => null), guard: vi.fn(), cpu: vi.fn(), gpu: vi.fn(), state: () => ({ capped: false, locked: [] }),
});

describe('createQuality + hold (GĐ 9)', () => {
  it('lúc giữ: sample() trả true (bỏ khung) mà không hỏi bộ quyết định; thôi giữ: tuner.guard(chế độ hiện tại), rồi đo như thường', async () => {
    const hold = createHold();
    const tuner = tunerSpy();
    const quality = createQuality({ level: 'cao', ladder, tuner, timer, hold });
    quality.start();
    quality.guard(true); // thanh lớp mở: chế độ canh
    tuner.guard.mockClear();
    let release;
    const job = hold.run(() => new Promise((resolve) => { release = resolve; }));
    expect(quality.sample(100)).toBe(true);
    expect(tuner.sample).not.toHaveBeenCalled();
    release();
    await job;
    expect(tuner.guard).toHaveBeenCalledWith(true);
    expect(quality.sample(116)).toBe(false);
    expect(tuner.sample).toHaveBeenCalledTimes(1);
  });

  it('?freeze (không có bộ quyết định): giữ vẫn bỏ khung; thả không lỗi', async () => {
    const hold = createHold();
    const quality = createQuality({ level: 'cao', ladder, tuner: null, timer, hold });
    quality.start();
    let release;
    const job = hold.run(() => new Promise((resolve) => { release = resolve; }));
    expect(quality.sample(0)).toBe(true);
    release();
    await job;
    expect(quality.sample(16)).toBe(false);
  });
});
```

Thêm vào `tests/unit/scene.test.js` (describe `buildScene`, dùng `build()` sẵn có):
- "GĐ 9: lúc giữ khung, step() không vẽ, không tiến đồng hồ; thả thì vẽ". Gọi `scene.quality.start()`, rồi
  `scene.hold.run(() => promise treo)`, rồi `scene.step(16)`: `renders()` và `stage.tick` không đổi. Thả, `await`, `scene.step(32)`: vẽ thêm một
  lần.
- "GĐ 9: pipeline.compile() chạy trong lúc giữ khung". `stage.renderer.compileAsync = vi.fn(() => promise treo)`, rồi `const c =
  scene.compile()`: `scene.hold.active` là true. Thả, `await c`: false.
- "GĐ 9: vẽ lại khung đứng yên chờ thả". `scene.freeze()`, giữ khung, `scene.studio.setWeight('to-mau', 0)`, `flush()`: không vẽ. Thả, chờ
  microtask, `flush()`: vẽ đúng một lần.
- "GĐ 9: giữ lại bắt đầu đúng lúc nhịp vẽ lại tới: chờ thả tiếp, không vẽ giữa chừng". Giữ, `setWeight`, thả rồi giữ lại ngay trước
  `flush()`: không vẽ. Thả, `flush()`: vẽ một lần.

Chạy `npx vitest run tests/unit/hold.test.js tests/unit/scene-quality.test.js tests/unit/scene.test.js`: ĐỎ (chưa có `hold.js`).

- [ ] **Step 3: `src/engine/gpu/hold.js`**

```js
// engine/gpu/hold.js — giữ khung: trong lúc một việc async chạy với render target của lượt khác đang đặt trên renderer (biên dịch, đọc mã shader), cảnh không vẽ.

/**
 * Bộ giữ khung của MỘT cảnh (spec §21.3). three r186 dựng mã của vật trong lúc `compileAsync` nhường luồng chính, và lúc dựng nó đọc
 * render target + MRT đang đặt trên renderer (Phụ lục A.103, A.105). Việc nào phải để target của lượt khác qua một lần chờ thì chạy trong
 * `run()`: lúc giữ, scene.step() bỏ khung (scene-quality.js) và vẽ lại khung đứng yên chờ `idle()` (scene.js), nên không khung nào vẽ
 * với target sai.
 */
export function createHold() {
  let count = 0;
  let waiters = [];
  const listeners = new Set();

  const release = () => {
    count -= 1;
    if (count > 0) return;
    const done = waiters;
    waiters = [];
    for (const resolve of done) resolve();
    for (const cb of listeners) cb();
  };

  return {
    /** Có việc nào đang giữ khung không. */
    get active() {
      return count > 0;
    },
    /**
     * Chạy `fn` trong lúc giữ khung; luôn thả, kể cả khi `fn` ném lỗi (lỗi đi tiếp tới người gọi). Giữ lồng nhau được: thả hết mới vẽ.
     * Giữ ngay lúc gọi (phần đồng bộ của hàm async), trước khi `fn` chạy.
     * @template T
     * @param {() => T | Promise<T>} fn
     * @returns {Promise<T>}
     */
    async run(fn) {
      count += 1;
      try {
        return await fn();
      } finally {
        release();
      }
    },
    /** Promise xong khi không còn việc nào giữ (xong ngay nếu đang không giữ). */
    idle() {
      return count === 0 ? Promise.resolve() : new Promise((resolve) => waiters.push(resolve));
    },
    /** Nghe lúc thả hết (bộ điều chỉnh đo lại từ đầu). Trả hàm bỏ nghe. */
    onRelease(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
```

- [ ] **Step 4: `scene-quality.js`.** Thêm tham số `hold = null`:
  - trong thân `createQuality`: `hold?.onRelease(() => tuner?.guard(guarding));`, kèm chú thích "thôi giữ khung (GĐ 9): đo lại từ đầu, đúng
    chế độ canh hiện tại; quãng giữ không thành một mẫu 'khung chậm'";
  - dòng ĐẦU của `sample(ms)`: `if (hold?.active) return true;`, kèm chú thích "giữ khung (GĐ 9, hold.js): như thử ngừng vẽ, không vẽ, không
    tiến đồng hồ";
  - sửa JSDoc của `sample`: `true` = thử ngừng vẽ hay đang giữ khung.

- [ ] **Step 5: `pipeline.js`.** `import { createHold } from './hold.js';`; tham số `hold = createHold()` (test của pipeline không đưa vào);
  `const compile = () => hold.run(() => scenePass.compileAsync(renderer));`. Chú thích, chèn sau hai dòng chú thích có sẵn trên `compile`:
  "GĐ 9: `scenePass.compileAsync` giữ target + MRT của pass suốt lần chờ, mà vòng lặp vẫn vẽ trong lúc đó (view Normal lúc cảnh đang chạy,
  Phụ lục A.105): biên dịch trong lúc giữ khung."

- [ ] **Step 6: `scene.js`.**
  - `import { createHold } from './hold.js';`. Ngay trước `createPipeline` thêm
    `const hold = createHold(); // GĐ 9: giữ khung (biên dịch Normal, Bản dịch: spec §21.3)`, và đưa `hold` vào `createPipeline({ …, hold })`,
    `createQuality({ …, hold })`.
  - Vẽ lại khung đứng yên: tách thân hiện tại thành `drawStill`, chờ thả trước khi xin nhịp, và kiểm lại lúc nhịp tới:

```js
  // Vẽ lại ở nhịp rAF kế tiếp (chú thích cũ giữ nguyên). GĐ 9: đang giữ khung (biên dịch, đọc mã với target của lượt khác) thì chờ thả;
  // nhịp tới mà việc giữ khác vừa bắt đầu (đọc mã vật kế tiếp) thì chờ tiếp, không vẽ giữa chừng (spec §21.3).
  const drawStill = () => new Promise((resolve, reject) => {
    win.requestAnimationFrame(() => {
      if (hold.active) {
        hold.idle().then(drawStill).then(resolve, reject);
        return;
      }
      pending = null;
      try {
        if (!disposer.closed) {
          // … thân cũ giữ nguyên: route(), update(0, t), captionSet.step(), draws.begin(), pipeline.render(), draws.end()
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
  const redraw = () => {
    if (!frozen || disposer.closed) return Promise.resolve();
    pending ??= hold.active ? hold.idle().then(drawStill) : drawStill();
    return pending;
  };
```
  - Thêm `hold` vào object trả về (test và Task 2 dùng).

- [ ] **Step 7: Chạy unit** (Step 2): xanh. **Chạy e2e** Step 1 trên WebGL2 SwiftShader và GPU thật: xanh. Chạy thêm test 'Normal (GĐ 4)' và
  'Lột lớp' (đổi MRT, dùng `?freeze`): vẫn xanh.
- [ ] **Step 8: `npm test`** cả bộ: xanh.
- [ ] **Step 9: Sửa spec nếu lệch** (§21.3 mục giữ khung và Normal, A.105: số đo thật trên SwiftShader nếu khác). Commit:

```bash
git add src/engine/gpu/hold.js src/engine/gpu/scene-quality.js src/engine/gpu/pipeline.js src/engine/gpu/scene.js \
  tests/unit/hold.test.js tests/unit/scene-quality.test.js tests/unit/scene.test.js e2e/painting.spec.js
git commit -m "fix(xuong): giữ khung khi biên dịch lại giữa chừng; Normal của Kính mài lúc cảnh đang chạy không còn vẽ vào target của scene pass" \
  -m "Lỗi từ GĐ 4 (spec §21.3, Phụ lục A.105): scenePass.compileAsync giữ target + MRT của pass suốt lần chờ, vòng lặp vẫn vẽ. engine/gpu/hold.js: lúc giữ thì step() bỏ khung, vẽ lại chờ thả, bộ điều chỉnh đo lại sau khi thả." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `translate.js`: bản dịch của vật và quad cuối (LUẬT DỪNG)

**Files:**
- Create: `src/engine/gpu/translate.js`, `tests/unit/translate.test.js`
- Modify: `src/engine/gpu/scene.js`, `src/engine/gpu/studio.js`, `src/engine/sma.js`, `src/ui/strings.vi.js` (chỉ `translation.post`),
  `src/engine/contracts/runtime.js` (JSDoc), `tests/unit/studio.test.js`, `tests/unit/sma.test.js`, `tests/rules/files.test.js`,
  `e2e/painting.spec.js`

**Interfaces:**
- Consumes: `hold` (Task 1); `pipeline.scenePass`, `pipeline.renderPipeline`; `uniformName` (`knob-set.js`).
- Produces:
  - `createTranslator({ renderer, scene, camera, scenePass, renderPipeline, hold, layers, meta, content, postLabel })` →
    `{ language, translation(layerId, { onProgress }), dispose() }`;
  - `layerUniforms(built)`, `drawablesOf(layers)`, `countLines(code, names)`, `weightUniform(id)`;
  - `studio.translation(layerId, options)`, `__sma.translate(layerId)`;
  - `Translation` = `{ language: 'wgsl'|'glsl', backend: 'webgpu'|'webgl2', uniforms: { weight, knobs }, places, jsOnly }`, mỗi nơi
    `{ key, label, owner, own, vertex, fragment, hits: { vertex, fragment }, ms, error? }`.

- [ ] **Step 1: Unit đỏ trước.** `tests/unit/translate.test.js`:

```js
// tests/unit/translate.test.js — Bản dịch (GĐ 9): target + MRT của scene pass đặt suốt lần chờ trong lúc giữ khung, mỗi lúc một lần đọc, nhớ theo version, quad cuối, nơi lớp có mặt; ghim trường riêng của three.
import { describe, it, expect, vi } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicNodeMaterial, NoToneMapping, RenderPipeline } from 'three/webgpu';
import { createTranslator, countLines, drawablesOf, layerUniforms } from '../../src/engine/gpu/translate.js';
import { createHold } from '../../src/engine/gpu/hold.js';
import { compileRenderer } from '../helpers/nodes.js';

const mesh = (name) => Object.assign(new Mesh(new BoxGeometry(), new MeshBasicNodeMaterial()), { name });

/** Ba lớp: Cốt có một khối; lớp hai không có vật (góp vào material của Cốt); lớp ba có một Group hai khối. */
function setup({ webgpu = true, shaders } = {}) {
  const khoi = mesh('khoi');
  const nhom = Object.assign(new Group(), { name: 'nhom' });
  nhom.add(mesh(''), mesh(''));
  const layers = [
    { id: 'cot', module: { knobs: [{ id: 'size', min: 0, max: 1, value: 0.5 }] }, layer: { objects: [khoi] } },
    { id: 'lop-hai', module: { knobs: [{ id: 'glow', value: 1 }, { id: 'count', via: 'rebuild', value: 3 }] }, layer: { objects: [] } },
    { id: 'lop-ba', module: { knobs: [] }, layer: { objects: [nhom] } },
  ];
  const meta = { layers: [{ id: 'cot', name: 'Cốt' }, { id: 'lop-hai', name: 'Lớp hai' }, { id: 'lop-ba', name: 'Lớp ba' }] };
  const content = { layers: { cot: { objects: { khoi: 'Khối đất' } } } };
  const hold = createHold();
  const pass = { renderTarget: { name: 'pass' }, getMRT: () => ({ id: 7 }) };
  const quad = { camera: { name: 'quad-camera' }, material: { id: 99, version: 1 } };
  const renderer = {
    backend: { isWebGPUBackend: webgpu },
    target: null,
    mrt: null,
    toneMapping: 4,
    outputColorSpace: 'srgb',
    getRenderTarget() { return this.target; },
    getMRT() { return this.mrt; },
    setRenderTarget(t) { this.target = t; },
    setMRT(m) { this.mrt = m; },
    debug: { getShaderAsync: vi.fn(shaders) },
  };
  const translator = createTranslator({
    renderer, scene: { isScene: true }, camera: () => ({ name: 'camera' }), scenePass: pass,
    renderPipeline: { _quadMesh: quad }, hold, layers, meta, content, postLabel: 'Lượt cuối · hậu kỳ',
  });
  return { translator, renderer, hold, pass, quad, khoi, nhom, layers };
}

/** Mã giả: khối của Cốt có trọng số và núm của lớp hai; nhóm của lớp ba không có gì; quad có trọng số của lớp hai. */
const fakeShaders = (r, quad) => async (scene, camera, object) => {
  await new Promise((res) => setTimeout(res, 0)); // three nhường luồng giữa chừng (Phụ lục A.103)
  if (object === quad) return { vertexShader: 'v quad', fragmentShader: 'f object.w_lop_hai' };
  if (object.name === 'khoi') return { vertexShader: 'v', fragmentShader: 'a = object.w_lop_hai;\nb = object.lop_hai_glow;\nc = object.w_lop_hai_2;' };
  return { vertexShader: 'v', fragmentShader: 'f' };
};

describe('layerUniforms, drawablesOf, countLines', () => {
  it('Cốt không có trọng số (luật 1); núm js/rebuild không có uniform; tên như layers.js và knob-set.js đặt', () => {
    expect(layerUniforms({ id: 'cot', module: { knobs: [{ id: 'size' }] } })).toEqual({ weight: null, knobs: { size: 'cot_size' } });
    expect(layerUniforms({ id: 'lop-hai', module: { knobs: [{ id: 'glow' }, { id: 'count', via: 'rebuild' }] } }))
      .toEqual({ weight: 'w_lop_hai', knobs: { glow: 'lop_hai_glow' } });
  });
  it('mọi vật vẽ được, kể cả con của Group, kèm lớp chủ và thứ tự trong vật gốc', () => {
    const { layers } = setup();
    expect(drawablesOf(layers).map((d) => [d.owner, d.name, d.index, d.of])).toEqual([
      ['cot', 'khoi', 1, 1], ['lop-ba', 'nhom', 1, 2], ['lop-ba', 'nhom', 2, 2],
    ]);
  });
  it('so cả tên: w_lop_hai không khớp w_lop_hai_2', () => {
    expect(countLines('x = w_lop_hai;\ny = w_lop_hai_2;\nz = aw_lop_hai;', ['w_lop_hai'])).toBe(1);
  });
});

describe('createTranslator', () => {
  it('đọc vật: target + MRT của scene pass đặt TRƯỚC lời gọi, còn nguyên SAU lần chờ, trong lúc giữ khung; trả lại sau', async () => {
    const seen = [];
    const ctx = setup({
      shaders: async (scene, camera, object) => {
        seen.push({ before: [ctx.renderer.target, ctx.renderer.mrt?.id, ctx.hold.active] });
        await new Promise((res) => setTimeout(res, 0));
        seen.at(-1).after = [ctx.renderer.target, ctx.renderer.mrt?.id, ctx.hold.active];
        return { vertexShader: 'v', fragmentShader: 'f' };
      },
    });
    await ctx.translator.translation('cot');
    const objects = seen.slice(0, 3);
    for (const s of objects) {
      expect(s.before).toEqual([ctx.pass.renderTarget, 7, true]);
      expect(s.after).toEqual([ctx.pass.renderTarget, 7, true]);
    }
    expect([ctx.renderer.target, ctx.renderer.mrt, ctx.hold.active]).toEqual([null, null, false]);
  });

  it('quad cuối: không target, không MRT, tone mapping tắt trong lúc đọc; trả lại cả bốn', async () => {
    let during = null;
    const ctx = setup({
      shaders: async (scene, camera, object) => {
        if (object === ctx.quad) during = [ctx.renderer.target, ctx.renderer.mrt, ctx.renderer.toneMapping, camera];
        return { vertexShader: 'v', fragmentShader: 'f' };
      },
    });
    ctx.renderer.target = { name: 'trước' };
    await ctx.translator.translation('cot');
    expect(during).toEqual([null, null, NoToneMapping, ctx.quad.camera]);
    expect([ctx.renderer.target.name, ctx.renderer.toneMapping, ctx.renderer.outputColorSpace]).toEqual(['trước', 4, 'srgb']);
  });

  it('nơi lớp có mặt: vật của lớp khác và quad cuối; vật của chính lớp đứng đầu; số dòng có lớp', async () => {
    const ctx = setup();
    ctx.renderer.debug.getShaderAsync.mockImplementation(fakeShaders(ctx.renderer, ctx.quad));
    const tr = await ctx.translator.translation('lop-hai');
    expect(tr.language).toBe('wgsl');
    expect(tr.uniforms).toEqual({ weight: 'w_lop_hai', knobs: { glow: 'lop_hai_glow' } });
    expect(tr.places.map((p) => [p.label, p.hits.fragment, p.own])).toEqual([
      ['Khối đất · Cốt', 2, false], ['Lượt cuối · hậu kỳ', 1, false],
    ]);
    expect(tr.jsOnly).toBe(false);
  });

  it('lớp không có uniform nào trong mã: vật của chính nó, jsOnly; nhóm nhiều khối ghi (1/2), (2/2)', async () => {
    const ctx = setup();
    ctx.renderer.debug.getShaderAsync.mockImplementation(fakeShaders(ctx.renderer, ctx.quad));
    const tr = await ctx.translator.translation('lop-ba');
    expect(tr.jsOnly).toBe(true);
    expect(tr.places.map((p) => p.label)).toEqual(['nhom (1/2) · Lớp ba', 'nhom (2/2) · Lớp ba']);
  });

  it('mở lại: không gọi three, không giữ khung, ms 0; material đổi version: đọc lại đúng vật đó; MRT đổi: đọc lại hết', async () => {
    const ctx = setup();
    ctx.renderer.debug.getShaderAsync.mockImplementation(fakeShaders(ctx.renderer, ctx.quad));
    await ctx.translator.translation('lop-hai');
    const calls = ctx.renderer.debug.getShaderAsync.mock.calls.length;
    const again = await ctx.translator.translation('lop-hai');
    expect(ctx.renderer.debug.getShaderAsync.mock.calls.length).toBe(calls);
    expect(again.places.every((p) => p.ms === 0)).toBe(true);
    ctx.khoi.material.version += 1;
    await ctx.translator.translation('lop-hai');
    expect(ctx.renderer.debug.getShaderAsync.mock.calls.length).toBe(calls + 1);
    ctx.pass.getMRT = () => ({ id: 8 }); // view Normal đã thêm kênh: biến thể khác
    await ctx.translator.translation('lop-hai');
    expect(ctx.renderer.debug.getShaderAsync.mock.calls.length).toBe(calls + 1 + 3);
  });

  it('mỗi lúc một lần đọc: hai bản dịch gọi cùng lúc không chồng lên nhau', async () => {
    let inside = 0;
    let most = 0;
    const ctx = setup({
      shaders: async () => {
        inside += 1;
        most = Math.max(most, inside);
        await new Promise((res) => setTimeout(res, 0));
        inside -= 1;
        return { vertexShader: 'v', fragmentShader: 'f' };
      },
    });
    await Promise.all([ctx.translator.translation('cot'), ctx.translator.translation('lop-ba')]);
    expect(most).toBe(1);
  });

  it('một vật dịch hỏng: nơi đó có error, giữ khung được thả, target trả lại; vật khác vẫn dịch', async () => {
    const ctx = setup();
    ctx.renderer.debug.getShaderAsync.mockImplementation(async (scene, camera, object) => {
      if (object.name === 'khoi') throw new Error('hỏng');
      return { vertexShader: 'v', fragmentShader: 'f object.cot_size' };
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const tr = await ctx.translator.translation('cot');
    warn.mockRestore();
    expect(tr.places.find((p) => p.label === 'Khối đất · Cốt').error).toBe('hỏng');
    expect([ctx.hold.active, ctx.renderer.target]).toEqual([false, null]);
  });

  it('WebGL2: ngôn ngữ glsl, backend webgl2; lớp lạ thì báo lỗi', async () => {
    const ctx = setup({ webgpu: false, shaders: async () => ({ vertexShader: 'v', fragmentShader: 'f' }) });
    const tr = await ctx.translator.translation('cot');
    expect([tr.language, tr.backend]).toEqual(['glsl', 'webgl2']);
    await expect(ctx.translator.translation('khong-co')).rejects.toThrow('Không có lớp "khong-co"');
  });
});

describe('ghim three 0.186.1 (Phụ lục A.104)', () => {
  it('RenderPipeline có _quadMesh là Mesh, có camera; renderer có debug.getShaderAsync', () => {
    const renderer = compileRenderer('webgpu');
    const pipeline = new RenderPipeline(renderer);
    expect(pipeline._quadMesh?.isMesh).toBe(true);
    expect(pipeline._quadMesh.camera?.isCamera).toBe(true);
    expect(typeof renderer.debug.getShaderAsync).toBe('function');
  });
});
```

Thêm vào `tests/rules/files.test.js`, theo mẫu luật `DRAW_HOOK_FILE`:
- `const TRANSLATE_FILE = 'src/engine/gpu/translate.js'`;
- luật "chỉ `TRANSLATE_FILE` gọi `getShaderAsync` và đọc `_quadMesh`", có phần tự kiểm (file còn đó và còn chứa cả hai chữ).

Thêm vào `tests/unit/studio.test.js`: `translation(id)` gọi bộ dịch; lớp lạ thì ném; không có bộ dịch thì Promise hỏng. Thêm vào
`tests/unit/sma.test.js`: `translate` có trong `studioApi`.

Chạy: ĐỎ.

- [ ] **Step 2: `src/engine/gpu/translate.js`**

```js
// engine/gpu/translate.js — Bản dịch (GĐ 9): mã shader thật mà three sinh cho từng vật (biến thể của scene pass) và cho quad cuối, và những nơi một lớp có mặt.
import { ColorManagement, NoToneMapping } from 'three/webgpu';
import { uniformName } from './knob-set.js';

/** Tên uniform trọng số của một lớp, như layers.js#createWeights đặt. */
export const weightUniform = (layerId) => `w_${layerId.replaceAll('-', '_')}`;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Số dòng của `code` có ít nhất một tên trong `names`, so cả tên: `w_suong` không khớp `w_suong_2` hay `aw_suong`.
 * @param {string | null} code
 * @param {string[]} names
 */
export function countLines(code, names) {
  if (!code || names.length === 0) return 0;
  const re = new RegExp(`\\b(?:${names.map(escapeRe).join('|')})\\b`);
  return code.split('\n').filter((line) => re.test(line)).length;
}

/**
 * Uniform mà người xem điều khiển được của một lớp: trọng số (Cốt không có: luật 1) và núm 'uniform' (núm 'js', 'rebuild' không có).
 * @param {{ id: string, module: { knobs?: { id: string, via?: string }[] } }} built
 * @returns {{ weight: string | null, knobs: Record<string, string> }}
 */
export function layerUniforms({ id, module }) {
  const knobs = {};
  for (const k of module.knobs ?? []) if ((k.via ?? 'uniform') === 'uniform') knobs[k.id] = uniformName(id, k.id);
  return { weight: id === 'cot' ? null : weightUniform(id), knobs };
}

/**
 * Mọi vật vẽ được của các lớp, theo thứ tự phủ: Mesh, InstancedMesh, Sprite, Points, Line có MỘT material, kể cả con của một Group nằm
 * trong layer.objects. Mesh nhiều material bị bỏ: getShaderAsync đọc object.material (chưa bức nào có).
 * @param {{ id: string, layer: { objects?: any[] } }[]} layers
 * @returns {{ object: any, owner: string, name: string | null, index: number, of: number }[]}  index/of: thứ tự trong vật gốc
 */
export function drawablesOf(layers) {
  const out = [];
  for (const { id, layer } of layers) {
    for (const root of layer.objects ?? []) {
      const found = [];
      root.traverse((o) => {
        if ((o.isMesh || o.isSprite || o.isPoints || o.isLine) && o.material && !Array.isArray(o.material)) found.push(o);
      });
      found.forEach((object, i) => out.push({ object, owner: id, name: root.name || null, index: i + 1, of: found.length }));
    }
  }
  return out;
}

/**
 * Bộ dịch của MỘT cảnh (spec §21.3). Mỗi lần đọc chạy trong lúc giữ khung, mỗi lúc một lần; mã nhớ theo vật, material, version của
 * material và MRT đang dùng, nên mở lại không gọi three.
 * @param {object} p
 * @param {any} p.renderer
 * @param {any} p.scene
 * @param {() => any} p.camera   camera của sân khấu (stage.camera là getter: đọc lúc dịch)
 * @param {any} p.scenePass
 * @param {any} p.renderPipeline
 * @param {ReturnType<import('./hold.js').createHold>} p.hold
 * @param {{ id: string, module: object, layer: object }[]} p.layers   lớp đã dựng (objects là mảng SỐNG: thí nghiệm thêm, bớt vật)
 * @param {import('../contracts/painting.js').PaintingMeta} p.meta
 * @param {object | null} [p.content]   nhãn vật: content.layers[id].objects[name]
 * @param {string} p.postLabel          nhãn của quad cuối (t.translation.post)
 */
export function createTranslator({ renderer, scene, camera, scenePass, renderPipeline, hold, layers, meta, content = null, postLabel }) {
  const names = new Map(meta.layers.map((l) => [l.id, l.name]));
  const language = renderer.backend?.isWebGPUBackend ? 'wgsl' : 'glsl';
  const cache = new Map(); // khóa → { vertex, fragment }
  let queue = Promise.resolve();
  /** Mỗi lúc một lần đọc: hai lần đặt target chồng nhau thì lần trả trước trả target sai cho lần sau. */
  const serial = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => {});
    return run;
  };

  /** Mã của một vật trong lượt vẽ cảnh. Target + MRT của scene pass đặt SUỐT lần chờ: NodeMaterial đọc chúng lúc dựng (A.105). */
  const readObject = (object) => hold.run(async () => {
    const target = renderer.getRenderTarget();
    const mrt = renderer.getMRT();
    renderer.setRenderTarget(scenePass.renderTarget);
    renderer.setMRT(scenePass.getMRT());
    try {
      return await renderer.debug.getShaderAsync(scene, camera(), object);
    } finally {
      renderer.setRenderTarget(target);
      renderer.setMRT(mrt);
    }
  });

  /**
   * Mã của quad cuối, dịch như RenderPipeline.render() vẽ nó: không target, không MRT, tone mapping tắt, màu ra là không gian làm việc
   * (A.104). Đổi rồi trả tone mapping như chính render() làm mỗi khung: ngoại lệ có chủ đích của luật "không đổi toneMapping lúc chạy".
   */
  const readPost = (quad) => hold.run(async () => {
    const saved = {
      target: renderer.getRenderTarget(), mrt: renderer.getMRT(), tone: renderer.toneMapping, space: renderer.outputColorSpace,
    };
    renderer.setRenderTarget(null);
    renderer.setMRT(null);
    renderer.toneMapping = NoToneMapping;
    renderer.outputColorSpace = ColorManagement.workingColorSpace;
    try {
      return await renderer.debug.getShaderAsync(quad, quad.camera, quad);
    } finally {
      renderer.setRenderTarget(saved.target);
      renderer.setMRT(saved.mrt);
      renderer.toneMapping = saved.tone;
      renderer.outputColorSpace = saved.space;
    }
  });

  /** Mã của một nơi, từ bộ nhớ hay đọc mới. ms = thời gian giữ khung của lần đọc này (0 khi đã nhớ). Lỗi thì ghi vào `error`. */
  const placeOf = (key, label, read) => serial(async () => {
    if (cache.has(key)) return { key, label, ...cache.get(key), ms: 0 };
    const start = performance.now();
    try {
      const { vertexShader, fragmentShader } = await read();
      const code = { vertex: vertexShader ?? null, fragment: fragmentShader ?? '' };
      cache.set(key, code);
      return { key, label, ...code, ms: performance.now() - start };
    } catch (err) {
      console.warn(`Bản dịch: chưa dịch được "${label}":`, err);
      return { key, label, vertex: null, fragment: '', ms: performance.now() - start, error: String(err?.message ?? err) };
    }
  });

  const labelOf = ({ object, owner, name, index, of }) => {
    const base = (name ? content?.layers?.[owner]?.objects?.[name] : undefined) ?? name ?? object.type;
    return `${base}${of > 1 ? ` (${index}/${of})` : ''} · ${names.get(owner) ?? owner}`;
  };

  return {
    language,
    /**
     * Bản dịch của một lớp (spec §21.1): những nơi uniform của lớp có mặt, cộng những nơi dịch hỏng. Vật của chính lớp trước, rồi vật của
     * lớp khác theo thứ tự phủ, rồi quad cuối. Không nơi nào có thì trả vật của chính lớp, `jsOnly` true (lớp đổi cảnh bằng JS).
     * @param {string} layerId
     * @param {{ onProgress?: (done: number, total: number) => void }} [options]
     */
    async translation(layerId, { onProgress } = {}) {
      const built = layers.find((b) => b.id === layerId);
      if (!built) throw new Error(`Không có lớp "${layerId}"`);
      const uniforms = layerUniforms(built);
      const wanted = [uniforms.weight, ...Object.values(uniforms.knobs)].filter(Boolean);
      const items = drawablesOf(layers);
      const total = items.length + 1;
      const mrtKey = scenePass.getMRT()?.id ?? 'none';
      const all = [];
      for (const d of items) {
        const { object } = d;
        const key = `${object.id}:${object.material.id}:${object.material.version}:${mrtKey}`;
        all.push({ ...(await placeOf(key, labelOf(d), () => readObject(object))), owner: d.owner, own: d.owner === layerId });
        onProgress?.(all.length, total);
      }
      const quad = renderPipeline._quadMesh; // trường riêng duy nhất của three mà xưởng đọc (A.104; test ghim)
      const post = await placeOf(`post:${quad.material.id}:${quad.material.version}`, postLabel, () => readPost(quad));
      all.push({ ...post, owner: null, own: false });
      onProgress?.(total, total);
      const counted = all.map((p) => ({ ...p, hits: { vertex: countLines(p.vertex, wanted), fragment: countLines(p.fragment, wanted) } }));
      // Nơi dịch hỏng vẫn hiện (không biết lớp có mặt ở đó hay không: người xem thấy dòng "chưa dịch được").
      const shown = counted.filter((p) => p.error || p.hits.vertex + p.hits.fragment > 0);
      const jsOnly = shown.length === 0;
      const chosen = jsOnly ? counted.filter((p) => p.own) : shown;
      const places = [...chosen.filter((p) => p.own), ...chosen.filter((p) => !p.own)];
      return { language, backend: language === 'wgsl' ? 'webgpu' : 'webgl2', uniforms, places, jsOnly };
    },
    dispose() {
      cache.clear();
    },
  };
}
```

- [ ] **Step 3: Nối vào cảnh và bàn thợ.**
  - `scene.js`: `import { createTranslator } from './translate.js';`. Sau khi có `pipeline`, `hold`, `layers`:

    ```js
      // Bản dịch (GĐ 9, spec §21.3): mã shader thật của từng vật và của quad cuối, đọc trong lúc giữ khung.
      const translator = createTranslator({
        renderer: stage.renderer, scene: stage.scene, camera: () => stage.camera, scenePass: pipeline.scenePass,
        renderPipeline: pipeline.renderPipeline, hold, layers, meta, content, postLabel: t.translation?.post ?? '',
      });
      disposer.add(() => translator.dispose());
    ```

    Đưa `translator` vào `createStudio`.
  - `studio.js`: tham số `translator = null`, và thêm hàm:

    ```js
        /** Bản dịch của một lớp (GĐ 9, spec §21.3): Promise<Translation>. Cảnh không có bộ dịch (test) thì Promise hỏng. */
        translation(layerId, options) {
          layerOf(layerId);
          return translator ? translator.translation(layerId, options) : Promise.reject(new Error('Cảnh này không có bản dịch'));
        },
    ```
  - `sma.js#studioApi`: `translate: (layerId) => s()?.translation(layerId) ?? null,`. Cập nhật chú thích đầu file với dòng GĐ 9.
  - `strings.vi.js`: `translation: { post: 'Lượt cuối · hậu kỳ' }` (Task 3 thêm phần còn lại).
  - `contracts/runtime.js`: JSDoc của `Studio` thêm dòng `[9] translation(layerId, { onProgress }) → Promise<Translation>`, kèm typedef
    `Translation` như Interfaces ở trên.

- [ ] **Step 4: Unit xanh.** `npx vitest run tests/unit/translate.test.js tests/unit/studio.test.js tests/unit/sma.test.js tests/rules/files.test.js`.

- [ ] **Step 5: E2E** (`e2e/painting.spec.js`). Đầu file, sau `ONE_COLOUR_STD`:

```js
/**
 * GĐ 9 (spec §21.8): lớp để thử Bản dịch của mỗi bức (lớp có mặt ở vật của lớp khác, hay ở quad cuối) và công thức thử (Task 7).
 * Bức 1: Sương vào shader của mọi vật qua sương mù; Bức 2: Giấy góp vào material đèn của Cốt; Bức 3: Bóng mềm vào khối bao SDF;
 * Bức 4: Bản nét ở quad cuối.
 */
const GD9 = {
  'ao-sen-dem': { layer: 'suong', recipe: 'suong:0,suong.density:0.02,gio:23' },
  'den-keo-quan': { layer: 'giay', recipe: 'giay:0,giay.dye:0.3' },
  'cung-que': { layer: 'bong-mem', recipe: 'bong-mem:0,ngay:15' },
  'dan-ga-me-con': { layer: 'ban-net', recipe: 'ban-net:0,ban-net.lineWidth:3' },
};
/** Số ảnh fragment shader ghi ra (như tests/helpers/nodes.js#countOutputs): scene pass ghi ≥ 2 (output, emissive), vẽ thẳng ra màn hình 1. */
const outputsOf = (code) => {
  const struct = /struct Output\w* \{([^}]*)\}/.exec(code);
  if (struct) return (struct[1].match(/@location\(/g) ?? []).length;
  return (code.match(/layout\( location = \d+ \) out /g) ?? []).length;
};
```

Hai test trong describe `${meta.title} · 3D`. Test thứ hai mang tag khói cho bức có `ciWebgpuSmoke`: đọc cờ từ dòng registry trong vòng
`for`; import `SMOKE_TAG` từ `../scripts/e2e-groups.js`.

```js
    test('Bản dịch (GĐ 9) dưới ?freeze: mã của lượt vẽ cảnh và của quad cuối, đúng ngôn ngữ; dịch xong ảnh không đổi', async ({
      page,
    }, testInfo) => {
      test.setTimeout(180_000);
      const { backend } = testInfo.project.metadata;
      await still(page, testInfo);
      const before = (await canvasRegions(page)).all.checksum;
      const tr = await page.evaluate((id) => window.__sma.translate(id), GD9[meta.slug].layer);
      expect([tr.backend, tr.language]).toEqual([backend, backend === 'webgpu' ? 'wgsl' : 'glsl']);
      expect(tr.places.some((p) => p.hits.vertex + p.hits.fragment > 0), 'không nơi nào có uniform của lớp').toBe(true);
      expect(tr.places.filter((p) => p.error).map((p) => `${p.label}: ${p.error}`)).toEqual([]);
      for (const p of tr.places.filter((x) => x.owner !== null)) expect(outputsOf(p.fragment), p.label).toBeGreaterThanOrEqual(2);
      const post = await page.evaluate(() => window.__sma.translate('phu-bong'));
      expect(post.places.some((p) => p.owner === null && /\bw_phu_bong\b/.test(p.fragment))).toBe(true);
      expect((await canvasRegions(page)).all.checksum, 'dịch xong mà khung đứng yên đổi').toBe(before);
      expect(log.errors).toEqual([]);
    });

    test('Bản dịch (GĐ 9) lúc cảnh đang chạy: không lỗi GPU, cảnh vẽ tiếp, mở lại không giữ khung', smoke, async ({ page }, testInfo) => {
      test.setTimeout(180_000);
      const { query } = testInfo.project.metadata;
      await page.goto(urlOf(htmlPage, query));
      expect((await waitForSettled(page)).state).toBe('live');
      const first = await page.evaluate((id) => window.__sma.translate(id), GD9[meta.slug].layer);
      const again = await page.evaluate((id) => window.__sma.translate(id), GD9[meta.slug].layer);
      expect(again.places.every((p) => p.ms === 0), 'mở lại vẫn đọc three').toBe(true);
      testInfo.annotations.push({ type: 'giữ khung (ms)', description: first.places.map((p) => Math.round(p.ms)).join(', ') });
      const frames = (await readSma(page)).frames;
      await expect.poll(async () => (await readSma(page)).frames, { timeout: 60_000 }).toBeGreaterThan(frames + 10);
      expect(log.errors).toEqual([]);
      expect(log.warnings).toEqual([]);
    });
```

`smoke` là `ciWebgpuSmoke ? { tag: SMOKE_TAG } : {}`, tính trong vòng `for` của registry. Chạy cả bốn bức trên WebGL2 SwiftShader và GPU thật.

- [ ] **Step 6: LUẬT DỪNG: kiểm một lần, không commit.**
  - Thêm tạm vào `scene.js`, ngay sau `createTranslator`:
    `win.__gd9 = { renderer: stage.renderer, camera: () => stage.camera }; // TẠM, không commit`.
  - `npm run build`, rồi chạy script dưới đây với Bức 1 (`suong`) và Bức 4 (`ban-net`, và `phu-bong`), ở WebGPU GPU thật lẫn `&webgl`.
  - Xong thì `git checkout src/engine/gpu/scene.js`, rồi build lại.

```js
// <scratchpad>/gd9/verify-translate.mjs — một lần, không commit: so mã của Bản dịch với RenderObject mà lượt vẽ cảnh dùng; đếm program.
import { chromium } from '/Users/baonguyen/Documents/Projects/son-mai-anh-sang/node_modules/playwright/index.mjs';
const [, , url, layer] = process.argv; // url: http://localhost:4273/son-mai-anh-sang/?force3d&freeze=10[&webgl]
const browser = await chromium.launch({ channel: 'chromium', headless: true }); // GPU thật
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url);
await page.waitForFunction(() => window.__sma?.state === 'live' && window.__sma.frames >= 10, null, { timeout: 60_000 });
const out = await page.evaluate(async (id) => {
  const { renderer: r, camera } = window.__gd9;
  const real = new Map();
  const prev = r.getRenderObjectFunction?.() ?? null;
  r.setRenderObjectFunction((object, scene, cam, geometry, material, group, lightsNode, clipping, passId) => {
    if (cam === camera()) {
      const ro = r._objects.get(object, material, scene, cam, lightsNode, r._currentRenderContext, clipping, passId);
      const s = ro.getNodeBuilderState();
      real.set(object.id, { v: s.vertexShader, f: s.fragmentShader });
    }
    return (prev ?? r.renderObject).call(r, object, scene, cam, geometry, material, group, lightsNode, clipping, passId);
  });
  await window.__sma.restore({}); // ?freeze: vẽ lại MỘT khung qua móc
  r.setRenderObjectFunction(prev);
  const programs = () => r._pipelines.programs.vertex.size + r._pipelines.programs.fragment.size;
  const p0 = programs();
  const t0 = performance.now();
  const tr = await window.__sma.translate(id);
  const total = performance.now() - t0;
  const rows = tr.places.filter((p) => p.owner !== null).map((p) => {
    const got = real.get(Number(p.key.split(':')[0]));
    return { label: p.label, same: got ? got.f === p.fragment && got.v === p.vertex : 'không vẽ ở khung này', ms: Math.round(p.ms) };
  });
  return { programs: [p0, programs()], total: Math.round(total), rows };
}, layer);
console.log(JSON.stringify(out, null, 2));
await browser.close();
```

  **Bốn điều phải đạt** (§21.9). Một điều không đạt thì DỪNG, báo Bao kèm số đo, đề xuất đường lùi "bắt lúc vẽ", và chờ Bao:
  1. mọi dòng `same: true`, ở cả hai backend;
  2. lần đọc đầu của một vật giữ khung ≤ 250 ms (`ms`), cả bức ≤ 3 giây (`total`), trên GPU thật của Mac M2; mở lại không giữ khung (e2e
     Step 5);
  3. dưới `?freeze`, ảnh trước và sau khi dịch trùng nhau, không lỗi console (e2e Step 5);
  4. `programs` trước và sau bằng nhau: không có lần biên dịch GPU nào mới.

  Đạt hết thì ghi số đo vào spec: §21.7 (số thật của `ms` và `total`), §21.3 (thay "vài chục ms" bằng số đo), Phụ lục A.102 (mã trùng từng
  ký tự, đã kiểm). Đó là lời giải cho rủi ro đầu tiên của §21.10.
- [ ] **Step 7: `npm test`** cả bộ: xanh. **Commit:**

```bash
git add src/engine/gpu/translate.js src/engine/gpu/scene.js src/engine/gpu/studio.js src/engine/sma.js src/ui/strings.vi.js \
  src/engine/contracts/runtime.js tests/unit/translate.test.js tests/unit/studio.test.js tests/unit/sma.test.js tests/rules/files.test.js \
  e2e/painting.spec.js docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md
git commit -m "feat(xuong): Bản dịch: mã shader thật của từng vật (biến thể của scene pass) và của quad cuối, đọc trong lúc giữ khung; __sma.translate" \
  -m "Luật dừng (spec §21.9): mã trùng RenderObject của lượt vẽ cảnh ở WebGPU và WebGL2; giữ khung lần đầu tối đa … ms, cả Bức 1 … ms, Bức 4 … ms; số program không đổi." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Điền số đo thật vào ba chỗ "…" trước khi commit.

---

### Task 3: Bản dịch trong Sổ tay › Chỉnh

**Files:**
- Create: `src/ui/shader-text.js`, `src/ui/translation-view.js`, `tests/unit/shader-text.test.js`, `tests/unit/translation-view.test.js`
- Modify: `src/ui/code-view.js`, `src/ui/notebook.js`, `src/ui/strings.vi.js`, `src/styles/notebook.css`, `tests/unit/code-view.test.js`

**Interfaces:**
- Consumes: `studio().translation(layerId, { onProgress })` (Task 2).
- Produces:
  - `shaderHtml(code, { uniforms })` → `{ html, lines, hits }`;
  - `createTranslationView(doc, { t, view })` → `{ el, show(translation, { layerName, keep }), progress(k, n), failed(), light(knobId), hide() }`;
  - `codeView.show(files, { layerId, layerName, translate })`, `codeView.refresh()`.

- [ ] **Step 1: Unit đỏ trước.** `tests/unit/shader-text.test.js` (môi trường node):
  - escape từng token: `a < b && c > 0` ra `&lt;`, `&amp;&amp;`, `&gt;`;
  - từ khóa WGSL (`fn`, `let`, `var`) và GLSL (`uniform`, `void`) mang `tk-k`; kiểu (`vec4<f32>`, `f32`, `mat4x4`, `sampler2D`) mang
    `tk-t`; số (`0.5`, `1e-3`, `2u`) mang `tk-n`; chú thích `//…` mang `tk-c`; `@location(0)` mang `tk-a`;
  - uniform của lớp: `object.w_suong` ra `<span class="u-layer" data-u="w_suong">`; dòng của nó có `is-layer`; `w_suong_2` không được đánh
    dấu;
  - `lines` bằng số dòng; `hits` bằng số dòng có uniform; dòng trống giữ nguyên; `data-line` từ 1.

`tests/unit/translation-view.test.js` (jsdom), với một `Translation` giả có hai nơi:
- ô Vật liệt kê nhãn theo thứ tự;
- mặc định là phần có nhiều dòng của lớp hơn; bằng nhau thì Điểm ảnh;
- nút Đỉnh bị khóa khi `vertex` là `null`;
- dòng trạng thái theo `t.translation.status`; dòng nhắc là `weightHint` (Cốt thì trống), hay `jsOnly`;
- `light('glow')` sáng đúng các dòng có `data-u="lop_hai_glow"`, `light(null)` tắt hết; đổi nơi thì giữ núm đang sáng;
- nơi có `error`: dòng trạng thái là `t.translation.failed`;
- `show(…, { keep })` giữ nơi đang xem theo `key` nếu còn.

`tests/unit/code-view.test.js` thêm:
- có `translate` thì hàng nút hiện kể cả khi lớp chỉ có một file, và nút "Bản dịch" (`[data-code-translate]`) đứng cuối; không có thì
  không có nút;
- bấm thì gọi `translate(layerId, onProgress)`; trạng thái "Đang dịch… (k/n)" theo `onProgress`; kết quả hiện ra;
- bấm tên file thì về code JS;
- đang ở Bản dịch thì `light(knobId)` sáng dòng của uniform, không chuyển về code JS;
- kết quả của lần dịch cũ về muộn (đã đổi lớp, hay đã bấm tên file) bị bỏ;
- `refresh()` dịch lại sau 300 ms (đồng hồ giả), chỉ khi đang ở Bản dịch.

- [ ] **Step 2: `src/ui/shader-text.js`**

```js
// ui/shader-text.js — tô màu mã shader do three sinh (WGSL hay GLSL) và đánh dấu uniform của lớp: hàm thuần, không three, không DOM.

const KEYWORDS = new Set([
  'fn', 'let', 'var', 'const', 'return', 'if', 'else', 'for', 'loop', 'while', 'break', 'continue', 'struct', 'switch', 'case',
  'default', 'discard', 'override', 'alias', 'void', 'in', 'out', 'inout', 'uniform', 'layout', 'precision', 'highp', 'mediump', 'lowp',
  'flat', 'smooth',
]);
const TYPES = /^(?:f32|f16|i32|u32|bool|float|int|uint|[iub]?vec[234][fiuh]?|mat[234](?:x[234])?[fh]?|texture_\w+|sampler\w*|array|ptr|atomic)$/;
/** Một token: chú thích, thuộc tính WGSL, số, tên, khoảng trắng, hay một ký tự bất kỳ. */
const TOKEN = /\/\/.*|@\w+|\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?[fiuh]?\b|\.\d+(?:[eE][+-]?\d+)?[fh]?\b|[A-Za-z_]\w*|\s+|./g;
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escape = (s) => s.replace(/[&<>"]/g, (c) => ESC[c]);
const span = (cls, text, extra = '') => `<span class="${cls}"${extra}>${escape(text)}</span>`;

/**
 * Mã shader thành HTML theo dòng (spec §21.5): mỗi dòng `<span class="line" data-line="N">`, dòng có uniform của lớp thêm `is-layer`;
 * mỗi uniform của lớp là `<span class="u-layer" data-u="<tên>">`, để khung Bản dịch sáng dòng theo núm. Escape TỪNG token lúc ghi ra,
 * nên mã có `<`, `&&` vẫn hiện đúng. Màu ở notebook.css, cùng sáu màu của theme code sống (đã có test tương phản).
 * @param {string} code
 * @param {{ uniforms?: string[] }} [options]  tên uniform của lớp (trọng số và núm)
 * @returns {{ html: string, lines: number, hits: number }}
 */
export function shaderHtml(code, { uniforms = [] } = {}) {
  const mine = new Set(uniforms);
  const rows = (code ?? '').replace(/\n$/, '').split('\n');
  let hits = 0;
  const body = rows.map((row, i) => {
    let has = false;
    const html = row.replace(TOKEN, (tok) => {
      if (tok.startsWith('//')) return span('tk-c', tok);
      if (tok.startsWith('@')) return span('tk-a', tok);
      if (/^\.?\d/.test(tok)) return span('tk-n', tok);
      if (/^[A-Za-z_]/.test(tok)) {
        if (mine.has(tok)) {
          has = true;
          return span('u-layer', tok, ` data-u="${tok}"`);
        }
        if (KEYWORDS.has(tok)) return span('tk-k', tok);
        if (TYPES.test(tok)) return span('tk-t', tok);
      }
      return escape(tok);
    });
    if (has) hits += 1;
    return `<span class="line${has ? ' is-layer' : ''}" data-line="${i + 1}">${html}</span>`;
  }).join('\n');
  return { html: `<pre class="shader"><code>${body}</code></pre>`, lines: rows.length, hits };
}
```

- [ ] **Step 3: `src/ui/translation-view.js`.** Phần đầu của khung Bản dịch: ô Vật, hai nút, dòng trạng thái, dòng nhắc. Mã vẽ vào `view`, tức
  khung cuộn mà code JS cũng dùng; `code-view.js` chuyển qua lại giữa hai thứ.

```js
// ui/translation-view.js — khung Bản dịch trong tab Chỉnh (GĐ 9): chọn nơi lớp có mặt, đỉnh hay điểm ảnh, dòng trạng thái, mã đã tô màu, sáng dòng theo núm.
import { h } from './dom.js';
import { shaderHtml } from './shader-text.js';

const STAGES = ['vertex', 'fragment'];

/**
 * Không biết three: nhận Translation của bàn thợ (spec §21.3) qua show().
 * @param {Document} doc
 * @param {{ t: Record<string, any>, view: HTMLElement }} p   view: khung cuộn của code-view.js
 */
export function createTranslationView(doc, { t, view }) {
  const select = h(doc, 'select', { 'data-tr-place': '' });
  const stages = STAGES.map((stage) => h(doc, 'button', {
    type: 'button', 'data-tr-stage': stage, 'aria-pressed': 'false', text: t.translation[stage],
  }));
  const status = h(doc, 'p', { class: 'tr-status', 'aria-live': 'polite' });
  const hint = h(doc, 'p', { class: 'tr-hint' });
  const el = h(doc, 'div', { class: 'tr-head', 'data-translation': '', hidden: true },
    h(doc, 'div', { class: 'tr-controls' },
      h(doc, 'label', { class: 'tr-place' }, t.translation.object, select),
      h(doc, 'div', { class: 'tr-stages', role: 'group', 'aria-label': t.translation.stages }, stages)),
    status, hint);

  let tr = null; // Translation đang hiện
  let layerName = '';
  let place = null;
  let stage = 'fragment';
  let lit = null; // núm đang rê (id)

  const uniforms = () => [tr.uniforms.weight, ...Object.values(tr.uniforms.knobs)].filter(Boolean);

  /** Sáng các dòng có uniform của một núm (null: tắt); cuộn RIÊNG khung mã tới dòng đầu, như code-view.js. Trả số dòng đã sáng. */
  const light = (knobId) => {
    lit = knobId;
    for (const line of view.querySelectorAll('.line.is-lit')) line.classList.remove('is-lit');
    const name = knobId && tr ? tr.uniforms.knobs[knobId] : null;
    if (!name) return 0;
    const lines = [...new Set([...view.querySelectorAll(`[data-u="${name}"]`)].map((u) => u.closest('.line')))];
    for (const line of lines) line.classList.add('is-lit');
    if (lines[0]) view.scrollTop = Math.max(0, lines[0].offsetTop - view.clientHeight / 3);
    return lines.length;
  };

  const draw = () => {
    const out = shaderHtml(place[stage] ?? '', { uniforms: uniforms() });
    view.innerHTML = out.html; // mã do three sinh; shaderHtml đã escape từng token
    for (const b of stages) b.setAttribute('aria-pressed', String(b.dataset.trStage === stage));
    stages[0].disabled = !place.vertex;
    status.textContent = place.error
      ? t.translation.failed
      : t.translation.status({ language: tr.language, backend: tr.backend, lines: out.lines, hits: out.hits, layer: layerName });
    light(lit);
  };

  const pick = (i) => {
    place = tr.places[i];
    select.value = String(i);
    stage = place.hits.vertex > place.hits.fragment ? 'vertex' : 'fragment';
    draw();
  };

  select.addEventListener('change', () => pick(Number(select.value)));
  for (const b of stages) {
    b.addEventListener('click', () => {
      stage = b.dataset.trStage;
      draw();
    });
  }

  return {
    el,
    /** Hiện một Translation. keep: key của nơi đang xem (dịch lại sau một thay đổi thì đứng nguyên chỗ). */
    show(translation, { layerName: name, keep = null } = {}) {
      tr = translation;
      layerName = name;
      select.replaceChildren(...tr.places.map((p, i) => h(doc, 'option', { value: String(i), text: p.label })));
      hint.textContent = tr.jsOnly ? t.translation.jsOnly : tr.uniforms.weight ? t.translation.weightHint(tr.uniforms.weight) : '';
      el.hidden = false;
      if (tr.places.length === 0) {
        view.textContent = '';
        status.textContent = t.translation.jsOnly;
        return;
      }
      const at = tr.places.findIndex((p) => p.key === keep);
      pick(at >= 0 ? at : 0);
    },
    progress(k, n) {
      el.hidden = false;
      status.textContent = t.translation.translating(k, n);
    },
    failed() {
      status.textContent = t.translation.failed;
    },
    light,
    /** key của nơi đang xem (code-view.js giữ chỗ khi dịch lại). */
    get key() {
      return place?.key ?? null;
    },
    hide() {
      el.hidden = true;
    },
  };
}
```

- [ ] **Step 4: `src/ui/code-view.js`.**
  - Dựng `const tr = createTranslationView(doc, { t, view });` và `el.append(bar, tr.el, view)`.
  - `show(fileList, { layerId = null, layerName = '', translate = null } = {})`:
    - vẫn nạp và dựng nút file như cũ;
    - có `translate` thì thêm nút cuối `h(doc, 'button', { type: 'button', 'data-code-translate': '', 'aria-pressed': 'false', text:
      t.translation.button })`;
    - `bar.hidden = files.length < 2 && !translate`.
  - Thêm biến `mode` (`'js' | 'translation'`):
    - `showFile` đặt `mode = 'js'`, gọi `tr.hide()`, tắt `aria-pressed` của nút Bản dịch;
    - bấm nút Bản dịch thì `mode = 'translation'`, `const mine = ++request`, `view.textContent = ''`, rồi
      `translate(layerId, (k, n) => mine === request && tr.progress(k, n))`. Xong mà `mine === request` thì
      `tr.show(result, { layerName, keep: tr.key })`; hỏng thì `tr.failed()` và `console.warn`. Mọi kết quả cũ (`mine !== request`) bị bỏ.
  - `light(knobId)`: `mode === 'translation'` thì `return tr.light(knobId)`; không thì như cũ.
  - `refresh()`: chỉ khi `mode === 'translation'`; gộp các lần gọi trong 300 ms (`setTimeout` của `doc.defaultView`), rồi bấm lại đường dịch.
    Bộ nhớ của `translate.js` làm lần dịch lại nhanh: chỉ vật đổi version mới đọc lại.
  - Cập nhật chú thích đầu file.

- [ ] **Step 5: `src/ui/notebook.js`** (đã 244 dòng: chỉ thêm tối thiểu; quá 250 thì tách `renderBreak` ra `notebook-pages.js`):
  - `code.show(layer.files)` thành
    `code.show(layer.files, { layerId: id, layerName: layer.name, translate: studio() ? translateFn : null })`, với
    `const translateFn = (layerId, onProgress) => studio().translation(layerId, { onProgress });`;
  - sau khi một núm áp xong (`onChange` của `mountKnobs`, nhánh `.then`) gọi thêm `code.refresh()`; sau khi một thí nghiệm áp xong (trong
    `onToggle` của `renderBreak`) cũng vậy.

- [ ] **Step 6: Chữ và CSS.**
  - `strings.vi.js`: `translation` đủ như spec §21.5:

    ```js
      /** Bản dịch (GĐ 9, spec §21.1): khung mã shader trong tab Chỉnh. */
      translation: {
        button: 'Bản dịch',
        object: 'Vật',
        stages: 'Phần của shader',
        vertex: 'Đỉnh',
        fragment: 'Điểm ảnh',
        post: 'Lượt cuối · hậu kỳ',
        translating: (k, n) => `Đang dịch… (${k}/${n})`,
        status: ({ language, backend, lines, hits, layer }) =>
          `${language === 'wgsl' ? 'WGSL' : 'GLSL ES 3.0'} · ${backend === 'webgpu' ? 'WebGPU' : 'WebGL2'} · ${lines} dòng · ${hits} dòng có lớp ${layer}`,
        weightHint: (name) => `Mài lớp này chỉ đổi số trong ${name}: mã không đổi, nên không biên dịch lại.`,
        jsOnly: 'Lớp này đổi cảnh bằng JS: trọng số và núm của nó không vào shader.',
        failed: 'Chưa dịch được vật này; chi tiết ở console của trình duyệt.',
      },
    ```
  - `notebook.css`, sau khối `.code-view`:
    - `.tr-head`, `.tr-controls` (flex, xuống dòng được);
    - `.tr-place select` cùng chữ và viền với `.code-files button`; `.tr-stages button` như `.code-files button` (có
      `aria-pressed='true'`); `.tr-status`, `.tr-hint` (chữ nhỏ, màu đất sét);
    - `.code-view .shader .line`: `display: block; white-space: pre-wrap; overflow-wrap: anywhere; padding-left: 3.8em;
      text-indent: -3.2em;`;
    - số dòng: `::before { content: attr(data-line); display: inline-block; width: 2.8em; margin-right: .4em; text-align: right; color:
      var(--dat-set) }`;
    - token dùng đúng sáu màu của theme code sống (`plugins/vite-plugin-code-view.js#lacquerTheme`), biến của `src/styles/tokens.css`:
      `.tk-k { color: var(--vang-la) }`, `.tk-t { color: var(--vang-la-sang) }`, `.tk-n { color: #D08476 }` (như theme), `.tk-c { color:
      var(--dat-set); font-style: italic }`, `.tk-a { color: var(--bac-la) }`, chữ thường `var(--nga)`; `.u-layer { text-decoration:
      underline var(--vang-la) }`;
    - `.shader .line.is-layer { box-shadow: inset 3px 0 0 var(--vang-la) }`; `.is-lit` dùng lại khối có sẵn.
- [ ] **Step 7: Chạy unit** (Step 1): xanh. **Chạy thật** (`npm run dev`, Bức 1, GPU thật):
  - mở Sổ tay › Sương › Chỉnh › Bản dịch; xem dòng sáng, rê núm `density`, đổi Vật, đổi Đỉnh/Điểm ảnh;
  - lặp lại ở `?webgl`, và ở khung 390 × 844;
  - chụp ảnh vào `<scratchpad>/gd9/shots/task-3/` (để dành cho trang duyệt ảnh của Task 6).
- [ ] **Step 8: `npm test`** cả bộ: xanh. **Commit**
  `feat(so-tay): Bản dịch trong tab Chỉnh: mã shader thật tô màu, nơi lớp có mặt, đỉnh/điểm ảnh, sáng dòng theo núm`.

---

### Task 4: `engine/recipe.js`: đọc và ghi chuỗi công thức

**Files:**
- Create: `src/engine/recipe.js`, `tests/unit/recipe.test.js`

**Interfaces:**
- Produces: `RECIPE_PREFIX = '#r='`, `MAX_RECIPE = 2048`; `readRecipe(hash)` → `{ entries: { key, value }[], problems: string[] } | null`;
  `writeRecipe(entries)` → chuỗi; `formatValue(kind, value, decimals)`; `stepDecimals(step)`.

- [ ] **Step 1: Unit đỏ trước.** `tests/unit/recipe.test.js`:

```js
// tests/unit/recipe.test.js — công thức của tác phẩm trong hash (GĐ 9, spec §21.2, §21.4): đọc, ghi, định dạng giá trị.
import { describe, it, expect } from 'vitest';
import { MAX_RECIPE, formatValue, readRecipe, stepDecimals, writeRecipe } from '../../src/engine/recipe.js';

describe('readRecipe', () => {
  it('không phải công thức: null (hash trống, #, #khac)', () => {
    for (const hash of ['', '#', '#khac', '#r', 'r=suong:0', undefined]) expect(readRecipe(hash)).toBeNull();
  });
  it('đọc trọng số, núm, Dial theo thứ tự; mục rỗng bỏ qua', () => {
    expect(readRecipe('#r=suong:0,,suong.density:0.02,gio:23,')).toEqual({
      entries: [{ key: 'suong', value: '0' }, { key: 'suong.density', value: '0.02' }, { key: 'gio', value: '23' }],
      problems: [],
    });
  });
  it('giải mã phần trăm; giải mã hỏng thì bỏ cả công thức kèm một problem', () => {
    expect(readRecipe('#r=suong%3A0').entries).toEqual([{ key: 'suong', value: '0' }]);
    const bad = readRecipe('#r=suong:%E0%A4%A');
    expect([bad.entries, bad.problems.length]).toEqual([[], 1]);
  });
  it('khóa hay giá trị sai dạng vào problems, mục khác vẫn đọc', () => {
    const r = readRecipe('#r=Suong:0,suong:,x.y.z:1,a.b-c:1,suong:0.5,anh-trang.rimColor:ffcc66,gio:2#3');
    expect(r.entries).toEqual([{ key: 'suong', value: '0.5' }, { key: 'anh-trang.rimColor', value: 'ffcc66' }]);
    expect(r.problems).toEqual(['Suong:0', 'suong:', 'x.y.z:1', 'a.b-c:1', 'gio:2#3']);
  });
  it('khóa lặp: mục sau thắng, đứng ở chỗ của mục sau', () => {
    expect(readRecipe('#r=a:1,b:2,a:3').entries).toEqual([{ key: 'b', value: '2' }, { key: 'a', value: '3' }]);
  });
  it(`dài quá ${MAX_RECIPE} ký tự: bỏ cả công thức kèm một problem`, () => {
    const r = readRecipe(`#r=${'a:1,'.repeat(600)}`);
    expect([r.entries, r.problems.length]).toEqual([[], 1]);
  });
});

describe('writeRecipe, formatValue, stepDecimals', () => {
  it('ghi theo đúng thứ tự đưa vào; đọc lại ra chính nó', () => {
    const entries = [{ key: 'suong', value: '0' }, { key: 'phu-bong.toneMapping', value: 'aces' }, { key: 'gio', value: '23.25' }];
    const text = writeRecipe(entries);
    expect(text).toBe('suong:0,phu-bong.toneMapping:aces,gio:23.25');
    expect(readRecipe(`#r=${text}`).entries).toEqual(entries);
  });
  it('số: làm tròn theo số chữ số của step, bỏ số 0 thừa, -0 là 0', () => {
    expect(formatValue('number', 0.020000000000000004, 3)).toBe('0.02');
    expect(formatValue('number', 23, 2)).toBe('23');
    expect(formatValue('number', -1.5, 2)).toBe('-1.5');
    expect(formatValue('number', -0.0001, 2)).toBe('0');
    expect(formatValue('number', 1 / 3)).toBe('0.3333');
  });
  it('bool 1/0, select giữ id, màu bỏ # và về chữ thường', () => {
    expect([formatValue('bool', true), formatValue('bool', false)]).toEqual(['1', '0']);
    expect(formatValue('select', 'aces')).toBe('aces');
    expect(formatValue('color', '#FFCC66')).toBe('ffcc66');
  });
  it('stepDecimals: 0.001 → 3, 0.25 → 2, 1 → 0, 0.005 → 3; thiếu step → 4', () => {
    expect([0.001, 0.25, 1, 0.005, undefined, 0].map(stepDecimals)).toEqual([3, 2, 0, 3, 4, 4]);
  });
});
```

- [ ] **Step 2: `src/engine/recipe.js`**

```js
// engine/recipe.js — công thức của tác phẩm trong hash (#r=…): đọc và ghi chuỗi khóa:giá trị (hàm thuần, đường nhẹ, không three).

/** Hash của công thức bắt đầu bằng chuỗi này (spec §8.7, §21.2). */
export const RECIPE_PREFIX = '#r=';
/** Trần độ dài (sau khi giải mã): Bức 1 chỉnh hết mọi núm chưa tới 1.500 ký tự (spec §21.10). */
export const MAX_RECIPE = 2048;
/** Khóa: id lớp (kebab), hay id lớp + '.' + id núm (camelCase), hay id Dial (kebab). */
const KEY = /^[a-z0-9-]+(\.[A-Za-z][A-Za-z0-9]*)?$/;
/** Giá trị: số, 1/0, id lựa chọn, màu hex: không có dấu phẩy, hai chấm, '#'. */
const VALUE = /^[A-Za-z0-9.+-]+$/;

/**
 * Đọc công thức từ location.hash. Mục sai dạng vào `problems` (người gọi cảnh báo MỘT dòng); khóa lặp thì mục sau thắng. Không biết bức
 * nào: phân loại khóa (trọng số, núm, Dial) làm ở engine/gpu/recipe-set.js.
 * @param {string | undefined} hash  ví dụ '#r=suong:0,gio:23'
 * @returns {{ entries: { key: string, value: string }[], problems: string[] } | null}  null: hash không phải công thức
 */
export function readRecipe(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(RECIPE_PREFIX)) return null;
  let text;
  try {
    text = decodeURIComponent(hash.slice(RECIPE_PREFIX.length));
  } catch {
    return { entries: [], problems: [`không giải mã được "${hash.slice(0, 40)}"`] };
  }
  if (text.length > MAX_RECIPE) return { entries: [], problems: [`dài ${text.length} ký tự, quá ${MAX_RECIPE}`] };
  const problems = [];
  const byKey = new Map();
  for (const part of text.split(',')) {
    if (part === '') continue;
    const colon = part.indexOf(':');
    const key = colon < 0 ? part : part.slice(0, colon);
    const value = colon < 0 ? '' : part.slice(colon + 1);
    if (!KEY.test(key) || !VALUE.test(value)) {
      problems.push(part);
      continue;
    }
    byKey.delete(key); // khóa lặp: mục sau thắng, đứng ở chỗ của mục sau
    byKey.set(key, value);
  }
  return { entries: [...byKey].map(([key, value]) => ({ key, value })), problems };
}

/**
 * Ghi các mục thành chuỗi (không có '#r='), đúng thứ tự đưa vào.
 * @param {{ key: string, value: string }[]} entries
 */
export function writeRecipe(entries) {
  return entries.map(({ key, value }) => `${key}:${value}`).join(',');
}

/**
 * Số chữ số thập phân của step (0.001 → 3, 0.25 → 2, 1 → 0), tối đa 4; không có step thì 4.
 * @param {number | undefined} step
 */
export function stepDecimals(step) {
  if (!Number.isFinite(step) || step <= 0) return 4;
  for (let d = 0; d < 4; d += 1) {
    const scaled = step * 10 ** d;
    if (Math.abs(Math.round(scaled) - scaled) < 1e-9) return d;
  }
  return 4;
}

/**
 * Giá trị thành chữ của công thức (spec §21.2): số ghi ngắn nhất theo số chữ số thập phân, bool 1/0, select là id, màu 6 chữ số hex
 * không '#'.
 * @param {'number' | 'bool' | 'select' | 'color'} kind
 * @param {any} value
 * @param {number} [decimals]
 */
export function formatValue(kind, value, decimals = 4) {
  if (kind === 'bool') return value ? '1' : '0';
  if (kind === 'select') return String(value);
  if (kind === 'color') return String(value).replace(/^#/, '').toLowerCase();
  return String(Number(Number(value).toFixed(Math.min(decimals, 4)))); // bỏ số 0 thừa; '-0' thành '0'
}
```

- [ ] **Step 3:** unit xanh. Chạy `npx vitest run tests/rules/imports.test.js` sau khi Task 5 nối `boot.js`; ở task này file chưa nằm trên
  đường nhẹ. `npm test` xanh. **Commit**
  `feat(xuong): engine/recipe.js đọc và ghi chuỗi công thức #r= (đường nhẹ, hàm thuần)`.

---

### Task 5: Công thức trong xưởng: mặc định, áp lúc dựng, bàn thợ, tầng tĩnh

**Files:**
- Create: `src/engine/gpu/recipe-set.js`, `tests/unit/recipe-set.test.js`
- Modify:
  - engine: `src/engine/gpu/knob-set.js`, `src/engine/gpu/layers.js`, `src/engine/gpu/scene.js`, `src/engine/gpu/studio.js`,
    `src/engine/sma.js`, `src/engine/boot.js`, `src/engine/static.js`, `src/engine/gpu/run.js` (tối đa 2 dòng), `src/engine/contracts/runtime.js`;
  - chữ: `src/ui/strings.vi.js` (`t.recipe.staticNote`);
  - test: `tests/unit/{knob-set,layers,studio,scene,boot,static,sma}.test.js`, `tests/paintings/contract.test.js`

**Interfaces:**
- Consumes: `readRecipe`, `writeRecipe`, `formatValue`, `stepDecimals` (Task 4).
- Produces:
  - `createRecipeSet({ modules, env, dials, dialDefaults })` → `{ defaults, classify(entries), diff(snapshot), countsOf(entries) }`;
  - `recipeMethods(recipes, { snapshot, restore, tweenAll })` → `{ recipe(), applyRecipe(text), reset() }`;
  - `createKnobs(layerId, knobs, env, initial)`, `buildLayers(modules, ctx, shared, env, initial)`, `buildScene({ …, recipe })`;
  - `studio.recipe()` → `{ text, counts: { layers, knobs, dials: string[] } }`, `studio.applyRecipe(text)`, `studio.reset()`,
    `studio.onChange(cb)`;
  - `__sma.recipe()`, `__sma.applyRecipe(text)`;
  - `boot` đưa `recipe` (kết quả `readRecipe`) vào `run()` và `showStatic()`.

- [ ] **Step 1: Unit đỏ trước.**
  - `tests/unit/recipe-set.test.js`, với hai lớp giả (một núm số có `step`, một màu, một select, một bool) và một Dial có `step: 0.25`:
    - `defaults` theo `env`, kể cả núm có `value` và `max` là hàm của `env`: mức `thap` ra mặc định và trần của mức thấp;
    - `classify`:
      - số kẹp theo trần của `env`; `1/0/true/false`; lựa chọn lạ vào problems; màu `ffcc66` ra `#ffcc66`, `fc6` vào problems;
      - `cot:0` vào problems ("Cốt luôn là 1"); trọng số 1.5 kẹp về 1; Dial; khóa lạ;
    - `diff`:
      - nguyên bản ra `[]`; `0.020000000000000004` bằng `0.02`;
      - thứ tự: trọng số theo thứ tự phủ, rồi núm theo lớp và theo khai báo, rồi Dial;
      - Dial bằng giá trị lúc dựng thì không ghi;
    - `countsOf`;
    - `recipeMethods`:
      - `applyRecipe` là trạng thái đủ (núm đã đổi trước đó mà công thức không nói thì về mặc định);
      - problems cảnh báo một dòng;
      - `reset` tween trọng số và đưa núm, Dial về mặc định.
  - `tests/unit/knob-set.test.js`: giá trị ban đầu từ `initial` (đã kẹp); giá trị hỏng thì giữ mặc định kèm cảnh báo; `values()` và
    `get()` ra giá trị ban đầu đó.
  - `tests/unit/layers.test.js`: `buildLayers(…, initial)` đưa `{ 'lop.knob': v }` tới `ctx.knobValue('knob')` của đúng lớp. Id lớp là tiền
    tố của id lớp khác (`ban` và `ban-net`) không lẫn.
  - `tests/unit/studio.test.js`:
    - `onChange` báo sau `setWeight` (cả tween), `setKnob`, `setDial`, `restore`, mỗi thay đổi đúng một lần;
    - `recipe().text` rỗng ở nguyên bản, đúng chuỗi sau khi đổi;
    - `applyRecipe(text)` rồi `recipe().text` ra dạng chuẩn.
  - `tests/unit/scene.test.js`: `build({ … })` thêm tham số `recipe` (viết lại `build` cho nhận). Cảnh dựng với
    `readRecipe('#r=to-mau:0,khong-co:1')`:
    - `weights` của `to-mau` là 0 trước lần render đầu;
    - đúng một `console.warn` nhắc `khong-co`;
    - `studio.recipe().text === 'to-mau:0'`.

    Thêm lớp giả có núm `rebuild`: `onKnob` không được gọi lúc dựng; `createLayer` thấy giá trị của công thức qua `ctx.knobValue`.
  - `tests/unit/boot.test.js`: `location.hash` có `#r=` thì `run` nhận `recipe` (entries đúng); tầng tĩnh thì `showStatic` nhận `recipe`.
  - `tests/unit/static.test.js`: có công thức (entries > 0) thì lời giải thích thêm `t.recipe.staticNote`, kể cả lý do `'flag'` (vốn không
    có chữ); không có thì như cũ.
  - `tests/unit/sma.test.js`: `recipe`, `applyRecipe` có trong `studioApi`.
  - `tests/paintings/contract.test.js`:
    - trong test "Dial (nếu có)": `expect(meta.layers.map((l) => l.id), 'id Dial trùng id lớp: chuỗi công thức sẽ mơ hồ').not.toContain(dial.id)`;
    - test mới cho mọi lớp: núm `select` có `options` khớp `^[A-Za-z0-9-]+$`; id núm khớp `^[A-Za-z][A-Za-z0-9]*$` (nếu chưa có luật này).
  - Chạy: ĐỎ.

- [ ] **Step 2: `src/engine/gpu/recipe-set.js`**

```js
// engine/gpu/recipe-set.js — công thức của MỘT cảnh (GĐ 9): mặc định của máy đang xem, phân loại mục của #r= thành trọng số/núm/Dial, khác biệt, tóm tắt, và ba hàm của bàn thợ.
import { RECIPE_PREFIX, formatValue, readRecipe, stepDecimals, writeRecipe } from '../recipe.js';
import { knobValue, normalizeKnob } from './knob-set.js';

const WEIGHT_DECIMALS = 2;
const kindOf = (knob) => knob.kind ?? 'number';

/** Chữ của công thức thành giá trị của núm (chưa kẹp: normalizeKnob làm); không đổi được thì ném lỗi. */
function parseKnob(knob, raw) {
  const kind = kindOf(knob);
  if (kind === 'number') {
    const v = Number(raw);
    if (!Number.isFinite(v)) throw new Error(`"${raw}" không phải số`);
    return v;
  }
  if (kind === 'bool') {
    if (raw === '1' || raw === 'true') return true;
    if (raw === '0' || raw === 'false') return false;
    throw new Error(`"${raw}" không phải 1 hay 0`);
  }
  if (kind === 'color') {
    if (!/^[0-9a-f]{6}$/i.test(raw)) throw new Error(`"${raw}" không phải màu rrggbb`);
    return `#${raw.toLowerCase()}`;
  }
  return raw; // select: normalizeKnob kiểm có trong options
}

/**
 * @param {object} p
 * @param {{ id: string, knobs?: object[] }[]} p.modules   painting.layers (khai báo tĩnh), đúng thứ tự phủ
 * @param {import('../contracts/runtime.js').KnobEnv} p.env   tầng, mức của máy này: mặc định và trần của núm theo đó
 * @param {{ id: string, step?: number }[]} [p.dials]   setup().dials
 * @param {Record<string, number>} [p.dialDefaults]     giá trị Dial ngay sau setup(), TRƯỚC khi áp công thức
 */
export function createRecipeSet({ modules, env, dials = [], dialDefaults = {} }) {
  const layerIds = modules.map((m) => m.id);
  const knobs = new Map(); // 'layer.knob' → { layerId, knob }, theo thứ tự lớp rồi thứ tự khai báo
  for (const m of modules) for (const k of m.knobs ?? []) knobs.set(`${m.id}.${k.id}`, { layerId: m.id, knob: k });
  const dialById = new Map(dials.map((d) => [d.id, d]));
  const defaults = Object.freeze({
    weights: Object.fromEntries(layerIds.map((id) => [id, 1])),
    knobs: Object.fromEntries([...knobs].map(([key, { layerId, knob }]) => [key, normalizeKnob(layerId, knob, knobValue(knob, env), env)])),
    dials: { ...dialDefaults },
  });
  const knobText = ({ knob }, v) => formatValue(kindOf(knob), v, stepDecimals(knob.step));
  const dialText = (dial, v) => formatValue('number', v, stepDecimals(dial.step));
  const one = formatValue('number', 1, WEIGHT_DECIMALS);

  return {
    defaults,
    /** Mục của readRecipe → { weights, knobs, dials, problems } (spec §21.4). Giá trị đã đổi kiểu và kẹp theo trần của máy này. */
    classify(entries) {
      const out = { weights: {}, knobs: {}, dials: {}, problems: [] };
      for (const { key, value } of entries) {
        try {
          const knob = knobs.get(key);
          if (knob) {
            out.knobs[key] = normalizeKnob(knob.layerId, knob.knob, parseKnob(knob.knob, value), env);
          } else if (layerIds.includes(key)) {
            if (key === 'cot') throw new Error('Cốt luôn là 1 (luật 1)');
            const w = Number(value);
            if (!Number.isFinite(w)) throw new Error(`"${value}" không phải số`);
            out.weights[key] = Math.min(Math.max(w, 0), 1);
          } else if (dialById.has(key)) {
            const v = Number(value);
            if (!Number.isFinite(v)) throw new Error(`"${value}" không phải số`);
            out.dials[key] = v; // dial-set.js kẹp và làm tròn theo step khi đặt
          } else {
            throw new Error('khóa lạ');
          }
        } catch (err) {
          out.problems.push(`${key}:${value} (${err.message})`);
        }
      }
      return out;
    },
    /**
     * Giá trị của snapshot khác mặc định, theo thứ tự cố định (spec §21.2). So bằng CHỮ đã làm tròn theo step, nên sai số dấu phẩy động
     * của thanh trượt không tính là đã đổi.
     * @returns {{ key: string, value: string, kind: 'weight' | 'knob' | 'dial' }[]}
     */
    diff(snapshot) {
      const entries = [];
      for (const id of layerIds) {
        const w = snapshot.weights?.[id];
        if (id === 'cot' || w === undefined) continue;
        const text = formatValue('number', w, WEIGHT_DECIMALS);
        if (text !== one) entries.push({ key: id, value: text, kind: 'weight' });
      }
      for (const [key, spec] of knobs) {
        if (!(key in (snapshot.knobs ?? {}))) continue;
        const text = knobText(spec, snapshot.knobs[key]);
        if (text !== knobText(spec, defaults.knobs[key])) entries.push({ key, value: text, kind: 'knob' });
      }
      for (const [id, dial] of dialById) {
        const v = snapshot.dials?.[id];
        if (v === undefined || defaults.dials[id] === undefined) continue;
        const text = dialText(dial, v);
        if (text !== dialText(dial, defaults.dials[id])) entries.push({ key: id, value: text, kind: 'dial' });
      }
      return entries;
    },
    /** Cho dòng tóm tắt: số lớp, số núm đã khác mặc định, và id các Dial đã khác. */
    countsOf(entries) {
      return {
        layers: entries.filter((e) => e.kind === 'weight').length,
        knobs: entries.filter((e) => e.kind === 'knob').length,
        dials: entries.filter((e) => e.kind === 'dial').map((e) => e.key),
      };
    },
  };
}

/**
 * Ba hàm công thức của bàn thợ (studio.js trải vào API của nó; tách ra đây cho studio.js dưới 250 dòng).
 * @param {ReturnType<typeof createRecipeSet>} recipes
 * @param {{ snapshot: () => object, restore: (s: object) => Promise<void>, tweenAll: () => void }} studio
 */
export function recipeMethods(recipes, { snapshot, restore, tweenAll }) {
  const recipe = () => {
    const entries = recipes.diff(snapshot());
    return { text: writeRecipe(entries), counts: recipes.countsOf(entries) };
  };
  return {
    /** Công thức hiện tại: text (không có '#r='; rỗng là nguyên bản) và counts cho dòng tóm tắt. */
    recipe,
    /** Áp một công thức (chuỗi sau '#r=') thành trạng thái ĐỦ: thứ gì công thức không nói thì về mặc định (spec §21.2). */
    async applyRecipe(text) {
      const read = readRecipe(RECIPE_PREFIX + text) ?? { entries: [], problems: [] };
      const { weights, knobs, dials, problems } = recipes.classify(read.entries);
      const all = [...read.problems, ...problems];
      if (all.length > 0) console.warn(`Công thức: bỏ ${all.length} mục không áp được: ${all.join(', ')}`);
      const d = recipes.defaults;
      await restore({ weights: { ...d.weights, ...weights }, knobs: { ...d.knobs, ...knobs }, dials: { ...d.dials, ...dials } });
      return { counts: recipe().counts, problems: all };
    },
    /** Về nguyên bản: trọng số phủ lại dần (như công tắc của thanh lớp), núm và Dial về mặc định ngay. */
    async reset() {
      tweenAll();
      await restore({ knobs: recipes.defaults.knobs, dials: recipes.defaults.dials });
    },
  };
}
```

- [ ] **Step 3: Giá trị ban đầu của núm.**
  - `knob-set.js#createKnobs(layerId, knobs, env, initial = {})`: sau khi tính `value` mặc định, thêm đoạn sau và ghi `values[knob.id] = value`
    như cũ:

```js
    // GĐ 9: giá trị ban đầu từ công thức của link (spec §21.4), đã đổi kiểu ở recipe-set.js. Hỏng thì giữ mặc định.
    if (Object.hasOwn(initial, knob.id)) {
      try {
        value = normalizeKnob(layerId, knob, initial[knob.id], env);
      } catch (err) {
        console.warn(`Công thức: núm "${layerId}.${knob.id}" không nhận "${initial[knob.id]}", giữ mặc định.`, err.message);
      }
    }
```
  - Uniform tạo SAU đoạn đó, nên mang giá trị của công thức ngay từ đầu.
  - `layers.js#buildLayers(modules, ctx, shared, env, initial = {})`: mỗi lớp nhận phần của nó,
    `createKnobs(module.id, module.knobs ?? [], env, ownInitial(initial, module.id))`, với `ownInitial` lấy các khóa bắt đầu bằng
    `${layerId}.` rồi bỏ tiền tố.

- [ ] **Step 4: Áp lúc dựng** (`scene.js`). `buildScene({ …, recipe = null })` nhận kết quả của `readRecipe` (hay `null`). Ngay sau
  `const shared = …`:

```js
  // Dial dựng ngay sau setup: giá trị lúc này là mặc định của máy đang xem (Bức 1: giờ của "bây giờ"). GĐ 9: công thức của link (#r=)
  // phân loại theo id của bức rồi áp TRƯỚC khi dựng lớp: Dial và trọng số đặt ngay, núm đi vào createKnobs, nên núm 'rebuild' dựng
  // MỘT lần với giá trị của công thức, và lần biên dịch đầu đã là cảnh của công thức (spec §21.4).
  const dials = createDialSet(setup?.dials ?? []);
  const recipes = createRecipeSet({ modules: painting.layers, env, dials: setup?.dials ?? [], dialDefaults: dials.snapshot() });
  const applied = recipe ? recipes.classify(recipe.entries) : null;
  const problems = [...(recipe?.problems ?? []), ...(applied?.problems ?? [])];
  if (problems.length > 0) console.warn(`Công thức trong link: bỏ ${problems.length} mục không áp được: ${problems.join(', ')}`);
  if (applied) {
    dials.restore(applied.dials);
    for (const [id, v] of Object.entries(applied.weights)) weights.set(id, v);
  }
  const layers = buildLayers(painting.layers, ctx, shared, env, applied?.knobs ?? {});
```

  - `createStudio` nhận `dials` (thay cho `createDialSet(…)` ở chỗ cũ) và `recipes`.
  - `run.js`: `run(…, { …, recipe = null })`, và `buildScene({ …, recipe: snapshot ? null : recipe })`. "Dựng lại cảnh" đi đường snapshot
    như cũ. Tối đa 2 dòng: `run.js` đang 248.
  - `boot.js`:
    - `import { readRecipe } from './recipe.js';`
    - `const recipe = readRecipe(win.location.hash); // GĐ 9: công thức của tác phẩm (spec §21.4); null khi không có`;
    - đưa `recipe` vào cả ba lời gọi `showStatic(…)` và vào `run(…)`.
  - `static.js#showStatic(…, { …, recipe = null })`: thêm `t.recipe.staticNote` khi `recipe?.entries.length > 0`:

    ```js
      const extra = recipe?.entries.length > 0 ? t.recipe.staticNote : null;
      const text = [hint ? `${note.text} ${t.static.debugHint}` : note.text, extra].filter(Boolean).join(' ') || null;
    ```
  - `strings.vi.js`:
    `recipe: { staticNote: 'Link này có công thức mài; công thức chỉ áp được ở bản 3D.' }` (Task 6 thêm phần còn lại).

- [ ] **Step 5: Bàn thợ** (`studio.js`).
  - Tham số `recipes = null`. Thiếu thì dựng từ trạng thái hiện tại (test):
    `createRecipeSet({ modules: layers.map((b) => b.module), env, dials: dials.list(), dialDefaults: dials.snapshot() })`.
  - `onChange`: `const listeners = new Set(); const changed = () => { for (const cb of listeners) cb(); };`. Gọi `changed()` sau
    `setWeight` (cả hai nhánh), sau khi `setKnob` và `setDial` xong (`.finally(changed)` trên Promise của `settle`), và ở cuối `restore`
    (trong `finally`, sau `redraw`). Hàm `onChange(cb)` trả hàm bỏ nghe.
  - Đổi `return { … }` thành `const studio = { …, ...recipeMethods(recipes, { snapshot: () => studio.snapshot(), restore: (s) =>
    studio.restore(s), tweenAll: () => { for (const id of weights.ids) weights.tween(id, 1, tweenSeconds); } }) }; return studio;`.
  - Không quá 250 dòng.
- [ ] **Step 6: `sma.js`**:
  - `recipe: () => s()?.recipe().text ?? null`;
  - `applyRecipe: (text) => s()?.applyRecipe(text)`.

  **`runtime.js`**: JSDoc của `Studio` thêm `[9] recipe() · applyRecipe(text) · reset() · onChange(cb)` như spec §8.4.
- [ ] **Step 7: Chạy unit** (Step 1): xanh. `npx vitest run tests/rules/imports.test.js`: xanh (`recipe.js` nay trên đường nhẹ: không
  built-in ES2022). **Chạy thật:**
  - mở `/?force3d#r=suong:0,suong.density:0.02,gio:23` ở dev;
  - `__sma.snapshot()` đúng công thức;
  - `__sma.recipe()` ra `suong:0,suong.density:0.02,gio:23`;
  - `__sma.applyRecipe('')` về nguyên bản.

  Chưa có giao diện (Task 6).
- [ ] **Step 8: `npm test`** cả bộ: xanh. **Commit**
  `feat(xuong): công thức áp lúc dựng (núm rebuild dựng một lần), bàn thợ recipe/applyRecipe/reset/onChange, câu của tầng tĩnh; luật id cho chuỗi công thức`.

---

### Task 6: Thanh địa chỉ, `hashchange`, mục Công thức của thanh lớp → ĐIỂM DUYỆT ẢNH (DỪNG)

**Files:**
- Create: `src/engine/gpu/recipe-url.js`, `src/engine/gpu/workshop-door.js`, `src/ui/recipe-panel.js`, `tests/unit/recipe-url.test.js`,
  `tests/unit/recipe-panel.test.js`
- Modify:
  - `src/engine/gpu/run.js`, `src/ui/workshop.js`, `src/ui/layer-rail.js`, `src/ui/strings.vi.js`, `src/styles/notebook.css` (hay
    `tools.css`, nơi có khối của thanh lớp);
  - test: `tests/unit/run.test.js`, `tests/unit/workshop.test.js`

**Interfaces:**
- Consumes: `studio.recipe/applyRecipe/reset/onChange/dials` (Task 5).
- Produces:
  - `syncRecipeUrl({ win, studio, onApplied })` → hàm gỡ; `WRITE_MS = 500`;
  - `createRecipePanel(doc, { t, content, studio })` → `{ summary, section, show(), hide(), sync() }`;
  - `workshop.open({ grind, recipe })`;
  - `createWorkshopDoor(…)` (tách từ `run.js`).

- [ ] **Step 1: Unit đỏ trước.**
  - `tests/unit/recipe-url.test.js` (môi trường node, `vi.useFakeTimers()`). Cửa sổ giả là `EventTarget` có:
    - `location: { pathname: '/son-mai-anh-sang/', search: '?force3d', hash }`;
    - `history.replaceState: vi.fn((s, _, url) => { location.hash = url.includes('#') ? url.slice(url.indexOf('#')) : '' })`;
    - `setTimeout`, `clearTimeout`, và `document` (EventTarget có `visibilityState`).

    Bàn thợ giả:

    ```js
    { recipe: () => ({ text }), onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
      applyRecipe: vi.fn(async () => ({ counts: {}, problems: [] })), reset: vi.fn(async () => {}) }
    ```

    Các ca:
    - đổi 20 lần trong 400 ms: không ghi gì; tới 500 ms ghi MỘT lần, với `'/son-mai-anh-sang/?force3d#r=<chuỗi cuối>'`; chuỗi không đổi
      thì không ghi;
    - chuỗi rỗng: ghi `pathname + search`, không có `#r=`;
    - `replaceState` ném `SecurityError`: một `console.warn`, rồi thôi ghi dù còn đổi;
    - `hashchange` tới `#r=a:1`: `applyRecipe('a:1')` rồi `onApplied`; tới `''`: `reset()`; tới `#khac`: không làm gì;
    - `pagehide` hay `visibilityState` thành `'hidden'`: ghi ngay phần còn hẹn;
    - mở trang với hash chưa chuẩn (`#r=a:1.50`, mà `recipe().text` là `a:1.5`): sau 500 ms ghi dạng chuẩn;
    - gỡ: bỏ nghe mọi sự kiện và hủy hẹn.
  - `tests/unit/recipe-panel.test.js` (jsdom):
    - nút chép link: `navigator.clipboard.writeText` giả nhận `origin + pathname + '#r=' + text`, KHÔNG có query string; dòng trạng thái
      `t.recipe.copied`, tự xóa sau 4 giây;
    - chép hỏng (giả ném lỗi, hay không có `clipboard`): ô link chỉ đọc hiện ra, chứa link, đã chọn; dòng trạng thái `t.recipe.copyFailed`;
    - `show()`: dòng tóm tắt theo `t.recipe.summary`. Phần bằng 0 bị bỏ; Dial ghi bằng `content.dials[id].label` và `text` của
      `studio.dials()`;
    - `sync()` cập nhật khi chuỗi đổi; chuỗi về rỗng thì tự ẩn;
    - "Về nguyên bản" gọi `reset()` rồi ẩn;
    - vùng `aria-live` không bao giờ có `hidden`.
  - `tests/unit/workshop.test.js`:
    - `open({ recipe: true })`: thanh lớp mở, KHÔNG tween lớp nào về 0, dòng tóm tắt hiện;
    - `open({ grind: true })`: dòng tóm tắt ẩn;
    - mục Công thức chỉ có khi có `studio()` (tầng tĩnh không có).
  - `tests/unit/run.test.js`:
    - trang mở với `recipe` có chuỗi khác rỗng sau khi áp: lúc live mở xưởng `{ grind: false, recipe: true }`, không gợi ý, không lời mời;
    - không có công thức: như cũ;
    - `syncRecipeUrl` gắn lúc live và gỡ cùng disposer;
    - mọi test cũ của `run` vẫn xanh.
  - Chạy: ĐỎ.

- [ ] **Step 2: `src/engine/gpu/recipe-url.js`**

```js
// engine/gpu/recipe-url.js — thanh địa chỉ mang công thức (GĐ 9): ghi #r=… bằng history.replaceState (gộp 500 ms), và áp công thức khi người xem đổi hash.
import { RECIPE_PREFIX } from '../recipe.js';

/** Gộp các lần đổi trong chừng này ms: WebKit ném SecurityError khi replaceState quá 100 lần trong 30 giây; 500 ms là tối đa 60 lần. */
export const WRITE_MS = 500;

/**
 * run.js gắn khi cảnh live, gỡ bằng disposer; "Dựng lại cảnh" gắn lại với bàn thợ mới (spec §21.4).
 * replaceState không phát 'hashchange', nên chỉ thay đổi của người xem (dán link khác, sửa tay, Back/Forward) tới onHash.
 * @param {object} p
 * @param {Window} p.win
 * @param {{ recipe: () => { text: string }, onChange: (cb: () => void) => () => void, applyRecipe: (text: string) => Promise<any>,
 *   reset: () => Promise<void> }} p.studio   bàn thợ của cảnh này
 * @param {() => void} p.onApplied   người xem đổi hash và công thức đã áp: mở xưởng với dòng tóm tắt
 * @returns {() => void}  gỡ
 */
export function syncRecipeUrl({ win, studio, onApplied }) {
  const fromHash = (hash) => (hash.startsWith(RECIPE_PREFIX) ? hash.slice(RECIPE_PREFIX.length) : '');
  let written = fromHash(win.location.hash); // chuỗi đang nằm trên thanh địa chỉ
  let timer = null;
  let broken = false;

  const write = () => {
    timer = null;
    if (broken) return;
    const { text } = studio.recipe();
    if (text === written) return;
    const { pathname, search } = win.location;
    try {
      // Giữ query string của trang đang mở (cờ của người xem); không thêm mục vào lịch sử.
      win.history.replaceState(win.history.state, '', pathname + search + (text ? RECIPE_PREFIX + text : ''));
      written = text;
    } catch (err) {
      broken = true; // WebKit: quá 100 lần trong 30 giây. Thôi ghi cho phiên này; nút chép link vẫn chạy.
      console.warn('Không ghi được công thức lên thanh địa chỉ; nút "Chép link công thức" vẫn dùng được.', err);
    }
  };
  const schedule = () => {
    timer ??= win.setTimeout(write, WRITE_MS);
  };
  const flush = () => {
    if (timer === null) return;
    win.clearTimeout(timer);
    write();
  };
  const onHash = async () => {
    const { hash } = win.location;
    if (hash === '' || hash === '#') {
      written = '';
      await studio.reset();
      return;
    }
    if (!hash.startsWith(RECIPE_PREFIX)) return; // hash khác dạng: không phải của xưởng
    written = fromHash(hash);
    await studio.applyRecipe(written);
    onApplied();
  };
  const onHide = () => flush();
  const onVisibility = () => {
    if (win.document?.visibilityState === 'hidden') flush();
  };

  const off = studio.onChange(schedule);
  win.addEventListener('hashchange', onHash);
  win.addEventListener('pagehide', onHide);
  win.document?.addEventListener('visibilitychange', onVisibility);
  schedule(); // hash lúc mở trang chưa ở dạng chuẩn (mục hỏng, số chưa làm tròn): ghi lại dạng chuẩn
  return () => {
    off();
    win.clearTimeout(timer);
    timer = null;
    win.removeEventListener('hashchange', onHash);
    win.removeEventListener('pagehide', onHide);
    win.document?.removeEventListener('visibilitychange', onVisibility);
  };
}
```

- [ ] **Step 3: `src/ui/recipe-panel.js`.** Hai phần tử gắn vào thanh lớp:
  - **`summary`** (đầu thanh): `<div class="rail-recipe" data-recipe-summary>`, chứa `<p class="rail-recipe-text" aria-live="polite">` và nút
    `[data-recipe-reset]` "Về nguyên bản" (`hidden` khi không có tóm tắt; nút được `hidden`, vùng `aria-live` thì không).
  - **`section`** (sau Đồ nghề): `<section class="rail-recipe-tools" aria-labelledby="rail-recipe-title">` gồm:
    - tiêu đề `t.recipe.title`;
    - nút `[data-recipe-copy]`;
    - dòng `<p class="rail-recipe-status" aria-live="polite">`;
    - ô `<input type="text" readonly class="rail-recipe-link" hidden aria-label=t.recipe.linkLabel>`.

  Hành vi:
  - chép: `const url = win.location.origin + win.location.pathname + (text ? '#r=' + text : '')`. `await
    win.navigator.clipboard.writeText(url)` trong `try` (không có `clipboard` thì cũng vào `catch`). Được: `t.recipe.copied`, xóa sau 4 giây.
    Hỏng: điền và hiện ô link, `field.select()`, `t.recipe.copyFailed`;
  - `show()`: `showing = true`, rồi `sync()`. `hide()`: `showing = false`, xóa chữ, ẩn nút "Về nguyên bản";
  - `sync()`: chỉ khi `showing`. Đọc `studio().recipe()`; chuỗi khác lần trước thì viết lại tóm tắt (`t.recipe.summary(parts)`); chuỗi rỗng
    thì `hide()`. Có `parts = { layers, knobs, dials: [{ label: content?.dials?.[id]?.label ?? id, text }] }`, với `text` từ
    `studio().dials()`.
  - "Về nguyên bản": `await studio()?.reset()`, rồi `hide()`.

  Không biết engine: mọi thứ qua `studio()`.
- [ ] **Step 4: Nối vào thanh lớp và xưởng.**
  - `layer-rail.js#createRail(doc, { …, recipe = null })`: `recipe?.summary` đứng đầu `nav` (trước `list`), `recipe?.section` sau `tools`.
    Thứ tự Tab vẫn trong thanh lớp.
  - `workshop.js`: tạo `createRecipePanel` khi `interactive`, đưa vào `createRail`.
    - `open({ grind = false, recipe = false } = {})`: `recipe` thì `panel.show()` (không mài); `grind` thì `panel.hide()` rồi mài như cũ.
    - `sync()` gọi `panel?.sync()`.
- [ ] **Step 5: `run.js` → `workshop-door.js`.** Chuyển nguyên văn `onClose`, `openWorkshop`, biến `workshop` và đoạn "gợi ý + lời mời" sau
  live sang `engine/gpu/workshop-door.js`:

  ```js
  createWorkshopDoor({ win, meta, t, shell, getContent, getStudio, getQuality })
    → { open({ grind, recipe }), afterLive({ input, rebuilt }), get isOpen, dispose() }
  ```

  Rồi thêm nhánh công thức vào `afterLive`:

```js
    // GĐ 9: trang mở bằng link có công thức (spec §21.2): thanh lớp mở sẵn, không mài, có dòng tóm tắt; không gợi ý, không lời mời.
    if (!rebuilt && getStudio()?.recipe().text) {
      open({ grind: false, recipe: true });
      return;
    }
```
  - `open` mặc định `{ grind: true }` để lời mời (`shell.invite(open)`, gọi không tham số) vẫn vào chế độ mài.
  - Trong `bringUp`, sau `d.add(sma.expose(…))`:
    `d.add(syncRecipeUrl({ win, studio: scene.studio, onApplied: () => door.open({ grind: false, recipe: true }) }));`.
  - `run.js` phải về dưới 250 dòng; mọi test của `run.test.js` (kể cả bảng `gone()`) vẫn xanh.
- [ ] **Step 6: Chữ và CSS.**
  - `strings.vi.js` thêm vào `recipe`:

    ```js
        title: 'Công thức',
        copy: 'Chép link công thức',
        copied: 'Đã chép link',
        copyFailed: 'Chưa chép được: link ở ô dưới, chọn rồi chép.',
        linkLabel: 'Link công thức',
        reset: 'Về nguyên bản',
        summary: ({ layers, knobs, dials }) => `Công thức trong link: ${[
          layers ? `${layers} lớp đã mài` : null, knobs ? `${knobs} núm đã chỉnh` : null, ...dials.map((d) => `${d.label} ${d.text}`),
        ].filter(Boolean).join(' · ')}`,
    ```
  - CSS:
    - máy tính: `.rail-recipe` là một khối nhỏ đầu thanh, viền vàng lá mờ; `.rail-recipe-tools` như `.rail-tools`;
    - điện thoại (`max-width: 640px`): dòng tóm tắt thu thành chip "Công thức · Về nguyên bản" trên dải, theo mẫu `.dial-chip`; mục Công
      thức là một nút trên dải;
    - `:empty` cho các vùng `aria-live`;
    - không `transform`/`filter` trên tổ tiên của phần tử fixed; cặp `@media` bù nhau.
- [ ] **Step 7: Chạy unit**: xanh. **Chạy thật** (GPU thật, dev) Bức 1:
  - mở link `#r=suong:0,mat-nuoc:0,suong.density:0.02,gio:23`: thanh lớp mở, dòng tóm tắt đúng;
  - tắt thêm một lớp: thanh địa chỉ đổi sau nửa giây;
  - chép link (cả ở `http://localhost`); dán link khác vào thanh địa chỉ thì áp; Về nguyên bản;
  - điện thoại 390 × 844.
- [ ] **Step 8: `npm test`** cả bộ: xanh. **Commit**
  `feat(cong-thuc): thanh địa chỉ mang công thức (replaceState gộp 500 ms, hashchange), mục Công thức trong thanh lớp, mở link thì mở xưởng theo công thức; tách workshop-door.js khỏi run.js`.
- [ ] **Step 9: ĐIỂM DUYỆT ẢNH (DỪNG).**
  - Chụp bằng script Playwright headless (GPU thật, `channel: 'chromium'`), lưu vào `<scratchpad>/gd9/shots/task-6/`:
    1. Bức 1 Sổ tay › Sương › Chỉnh › Bản dịch, 1280 × 800, WebGPU; một ảnh khi rê núm `density`;
    2. như (1) ở `?webgl` (GLSL);
    3. như (1) ở 390 × 844 (tấm trượt);
    4. Bức 4 Sổ tay › Bản nét › Bản dịch, lượt cuối;
    5. Bức 1 mở bằng link có công thức: thanh lớp có dòng tóm tắt, 1280 × 800 và 390 × 844;
    6. mục Công thức sau khi chép (dòng "Đã chép link"), và khi chép hỏng (ô link).
  - Bộ điều khiển dựng một trang ảnh riêng tư (Artifact) có các ảnh và 3–5 câu hỏi kèm đề xuất (cỡ chữ của mã, chip trên điện thoại, chữ
    của dòng tóm tắt…).
  - Gửi Bao, rồi DỪNG. Bao trả lời rồi mới làm Task 7. "ok hay chỉnh theo đề xuất" thì áp đề xuất, ghi thành `Ruling:` trong sổ.

---

### Task 7: E2E bốn bức, a11y, test của bức

**Files:**
- Create: `tests/paintings/ban-dich.test.js` (+ snapshot)
- Modify: `e2e/painting.spec.js`, `e2e/ao-sen-dem.spec.js`, `e2e/a11y.spec.js`

- [ ] **Step 1: E2E chung mọi bức** (`e2e/painting.spec.js`, describe `${meta.title} · 3D`, dùng `GD9` của Task 2). Bức có
  `ciWebgpuSmoke` thì gắn tag khói (`smoke`) cho test (1) và (2):
  1. **"Bản dịch qua Sổ tay".**
     - Mở trang không `?freeze`, chạm canvas, bấm lời mời (như test Sổ tay có sẵn ở `painting.spec.js`).
     - Vào lớp `GD9[slug].layer` › Chỉnh › `[data-code-translate]`. Chờ `.tr-status` chứa "dòng có lớp" (tối đa 120 giây trên SwiftShader).
     - Kiểm: `.shader .line.is-layer` > 0; nhãn ngôn ngữ đúng backend (`WGSL`/`GLSL ES 3.0`).
     - Rê núm đầu tiên có uniform: `.shader .line.is-lit` > 0.
     - Chọn nơi "Lượt cuối · hậu kỳ" trong ô Vật của Phủ bóng: có `is-layer`.
     - Không lỗi console.
  2. **"Mở link có công thức".**
     - Mở `urlOf(htmlPage, query, 'freeze=10', 'at=2026-09-28T21:00') + '#r=' + GD9[slug].recipe`.
     - `__sma.snapshot()` mang đúng các giá trị (đã kẹp theo `step`); `__sma.recipe()` ra đúng chuỗi.
     - `[data-rail]` hiện; `[data-recipe-summary] .rail-recipe-text` không rỗng.
     - Ảnh khác ảnh của trang cùng cờ mà không có công thức (`canvasRegions`).
     - Không lỗi console.
  3. **"Link công thức ở mức thấp".** Bức 1 (`ao-sen-dem.spec.js`): `?level=thap` cộng một công thức có núm vượt trần của mức thấp; giá trị
     trong snapshot bằng trần của mức thấp.
- [ ] **Step 2: Đường đủ của Bức 1** (`e2e/ao-sen-dem.spec.js`, describe mới `'Ao Sen Đêm · link công thức (GĐ 9)'`):
  - "Về nguyên bản": snapshot về mặc định; `location.hash` rỗng; dòng tóm tắt rỗng;
  - tắt một lớp trên thanh lớp: chờ tới khi `location.hash` có `#r=…` (poll ≤ 2 giây); đổi núm liên tục 3 giây
    (`__sma.setKnob`/`setWeight` 60 lần): đếm `replaceState` (gói trong `addInitScript`) ≤ 2 lần mỗi giây;
  - `location.hash = '#r=anh-trang:0'` trong trang: áp (snapshot đổi), thanh lớp có tóm tắt mới;
  - nút chép link: clipboard giả bằng `addInitScript` (`navigator.clipboard.writeText` đẩy vào `window.__copied`); link đúng, không có
    query string;
  - công thức có mục hỏng (`#r=suong:0,khong-co:1,suong.density:abc`): cảnh live, đúng một cảnh báo nhắc hai mục, `suong` vẫn về 0;
  - khung 390 × 844: chip công thức thấy được, bấm trúng; Bản dịch trong tấm trượt không tràn ngang (`scrollWidth <= clientWidth` của
    `body`).
- [ ] **Step 3: a11y** (`e2e/a11y.spec.js`, theo mẫu có sẵn): thêm hai trạng thái, Sổ tay ở Bản dịch và thanh lớp có dòng tóm tắt. axe
  sạch.
- [ ] **Step 4: Test của bức** (`tests/paintings/ban-dich.test.js`).
  - Mỗi bức trong registry:
    - nạp `painting` như `tests/paintings/contract.test.js#loadPainting`;
    - `buildPainting` ở mức `cao`;
    - với mỗi vật của `drawablesOf(built)`, `compileMaterial(object, ctx, 'webgpu', { renderer, lights: true, shadows:
      ctx.renderer.shadowMap.enabled })`, một `compileRenderer` dùng chung;
    - với mỗi lớp, liệt kê `owner/name` của những vật mà mã có uniform của lớp (`layerUniforms`, `countLines`).
  - Ghi bảng `{ slug: { layerId: [...] } }` bằng `toMatchSnapshot()`. Trần thời gian 60 giây mỗi bức.
  - Lớp chỉ có ở quad cuối (Phủ bóng, Bản nét) có danh sách rỗng ở đây: e2e kiểm phần đó. Đọc bảng một lần và ghi tóm tắt vào sổ: lớp nào
    có mặt ở đâu là thứ Bao sẽ thấy trong Sổ tay.
- [ ] **Step 5: Chạy đủ local:**
  - `npm test`;
  - `npm run e2e` (tĩnh + WebGL2 SwiftShader);
  - GPU thật (`webgpu-real-gpu`);
  - WebGPU SwiftShader cho Bức 1, Bức 2 (Bức 3, 4 chỉ test khói).

  Ghi số test, thời gian và mọi lần chạy lại vào sổ.
- [ ] **Step 6: Commit**
  `test(gd9): e2e Bản dịch và Link công thức cho bốn bức, đường đủ của Bức 1, a11y; bảng nơi mỗi lớp có mặt trong mã`.

---

### Task 8: Tài liệu khớp code

**Files:** `CLAUDE.md`, `README.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

- [ ] **Step 1: `CLAUDE.md`.** Thêm mục `### Bản dịch, giữ khung, link công thức (GĐ 9)`:
  - việc async để target của lượt khác qua một lần chờ (biên dịch, đọc mã) chạy trong `hold.run`; `NodeMaterial` đọc target + MRT lúc dựng
    (A.105);
  - chỉ `translate.js` gọi `getShaderAsync` và đọc `_quadMesh`; ngoại lệ tone mapping lúc dịch quad cuối;
  - dạng `#r=` (khóa, giá trị, chỉ giá trị khác mặc định của máy đang xem); id Dial không trùng id lớp; id lựa chọn không có dấu phẩy, hai
    chấm;
  - `replaceState` gộp 500 ms; `studio.onChange` báo sau mọi thay đổi trọng số, núm, Dial;
  - `createKnobs` nhận giá trị ban đầu (công thức áp trước lần biên dịch đầu);
  - e2e Normal lúc cảnh chạy mở không `?freeze`.

  Thêm vào "Gỡ lỗi nhanh": `__sma.translate(id)`, `__sma.recipe()`, `__sma.applyRecipe(text)`, và hash `#r=`. Bản đồ dự án thêm một câu
  về Bản dịch và Link công thức.
- [ ] **Step 2: `README.md`.** Mục cho người xem: "Link công thức" (chép link, thanh địa chỉ, mở link, Về nguyên bản; mặc định là của máy
  người mở). Mục cho người học: "Bản dịch" (đọc gì, vì sao `w_<lớp>` cho thấy luật 2).
- [ ] **Step 3: Spec.**
  - §21: số đo thật (giữ khung, thời gian dịch, số test);
  - §13: nhóm e2e nếu thời gian đổi đáng kể;
  - §12: kiểm tay.

  Mỗi chỗ làm khác plan đã có `Lệch plan:` thì spec phải khớp.
- [ ] **Step 4:** `npm test` (luật đọc `CLAUDE.md` nếu có). **Commit** `docs: GĐ 9 trong CLAUDE.md, README và spec khớp code`.

---

### Task 9: Review cuối, hỏi Bao trước khi push

- [ ] **Step 1:** review cả nhánh (`ddb6488..HEAD`) bằng reviewer mạnh nhất, cộng một lượt tìm lỗi im lặng (`silent-failure-hunter`).
  Phát hiện Critical/Important thì sửa trong MỘT đợt, có test đỏ trước rồi xanh; re-review đúng phạm vi.
- [ ] **Step 2:** chạy lại đủ local (như Task 7 Step 5) trên commit cuối.
- [ ] **Step 3: DỪNG, hỏi Bao trước khi push.** Gửi tóm tắt: những gì đã làm, số test, số đo, lỗi Normal đã sửa, những điều để sau. Bao đồng
  ý thì:
  - push `gd9-ban-dich-cong-thuc`;
  - mở PR (thân PR kết bằng `🤖 Generated with [Claude Code](https://claude.com/claude-code)`);
  - theo dõi CI, ghi thời gian thật của các nhóm e2e vào spec nếu đổi đáng kể.
- [ ] **Step 4: Hỏi Bao lần nữa trước khi merge** (merge là deploy).

  ```bash
  gh pr merge <N> --merge --match-head-commit <sha> --author-email giabao261096@gmail.com
  ```

  Giữ nhánh remote. Sau deploy:
  - kiểm site thật trên GPU thật (bốn bức: Bản dịch, link công thức, Normal lúc cảnh chạy);
  - dọn workspace SDD;
  - cập nhật memory.
