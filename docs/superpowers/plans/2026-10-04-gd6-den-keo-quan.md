# GĐ 6 · Bức 2 · Đèn Kéo Quân: kế hoạch thực thi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng Bức 2 · Đèn Kéo Quân đúng spec §18 trên nhánh `gd6-den-keo-quan`, tới mức sẵn sàng merge: đủ sáu lớp, ba cử chỉ, lật tranh
giữa hai trang, CI chia hai phần e2e, poster chụp từ cảnh, mọi test và e2e xanh.

**Architecture:**
- Bức mới đi đúng luật 7: thư mục `src/paintings/den-keo-quan/`, trang `tranh/den-keo-quan/index.html`, một dòng registry. Xưởng không đổi
  một dòng JS; chỉ thêm CSS cho link lật tranh.
- Bóng chạy trên vách là **node bóng tự viết** của `PointLight` ngọn nến (`light.shadow.shadowNode`). Với mỗi điểm đang tô, gobo dựng tia
  từ ngọn lửa, cắt ống trụ của trống, tính góc bằng `atan(y, x)` rồi tra mặt nạ hình nhân. Mặt nạ là một `DataTexture` có chuỗi mip tự
  tính bằng JS; mức mip theo bề rộng nửa tối.
- Trống quay và ngọn lửa là hàm thuần, tính thẳng từ thời gian, nên `?freeze` vẫn tất định.

**Tech Stack:** three@0.186.1 (WebGPURenderer + TSL), Vite 8, Vitest 5, Playwright 1.63, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`: §18 (Bức 2), cùng §0, §1, §8.1, §8.7, §12–§17 và Phụ lục
A.77–A.80. Người thực thi đọc cả spec lẫn plan.

## Cách dùng plan này (đọc trước)
- **Plan gọn, theo ý Bao** (§18.9: làm thẳng, vừa làm vừa sửa).
  - Code đầy đủ chỉ có ở chỗ khó: giao tia, gobo, mặt nạ, công thức quay, ngọn lửa, cùng các test và cấu hình CI.
  - Phần dựng hình thường thì plan chỉ ghi cần dựng gì, số nào, theo mẫu nào (`_mau`, Bức 1), và kiểm ra sao.
- **Code trong plan CHƯA chạy thật.**
  - Sai thì sửa ngay trong task, và ghi một dòng `Lệch plan: …` vào thân commit.
  - Làm khác spec thì sửa spec (§18 hay Phụ lục A) trong cùng commit.
- **Ba điểm dừng:**
  - **Task 2** (luật dừng): node bóng tự viết không chạy trên một backend thì DỪNG và báo Bao.
  - **Task 6** (duyệt ảnh): DỪNG, gửi Bao trang ảnh, chờ Bao duyệt hình nhân và bố cục.
  - **Task 10** (luật dừng riêng của thí nghiệm "Shadow map thật").
- **Task nào cũng đi đủ năm bước:**
  1. viết test trước, chạy cho thấy đỏ;
  2. làm cho xanh;
  3. chạy thật (lệnh e2e ghi trong task);
  4. chạy `npm test` cả bộ, phải xanh;
  5. commit, với email cá nhân và dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Trước khi bắt đầu
- **Node 24.** `node -v` phải ra `v24.x`. Ngày 2026-10-04 máy của Bao chỉ có Node 20 (`/usr/local/bin/node`) và không có fnm. Dùng bản
  portable trong scratchpad, không sửa `~/.zshrc`:

  ```bash
  SP=<scratchpad của phiên>
  curl -fsSL https://nodejs.org/dist/v24.21.0/node-v24.21.0-darwin-arm64.tar.gz | tar -xz -C "$SP"
  export PATH="$SP/node-v24.21.0-darwin-arm64/bin:$PATH"   # đặt ở đầu MỌI lệnh npm/npx/node
  node -v                                                  # v24.21.0
  ```
- **Nhánh.** Làm trên `gd6-den-keo-quan` (đã có spec: `9c44111`, `b52ced0`). Trước mỗi task, `git status` phải sạch.
- **Mốc ban đầu.** `npm test` xanh, 872 test ở main `4a19eac`.
- **E2E local:**
  - SwiftShader rất nặng CPU: chạy một mình, đừng chạy cùng reviewer hay `npm test`.
  - Trước khi tin một lần hỏng vì `timeout`, xem `ps -Ao pcpu,comm -r | head`: đã gặp game và trình biên dịch .NET của dự án khác ăn
    200–300% CPU.
  - Không để `vite preview --port 4273` cũ còn chạy: Playwright dùng lại server đang mở, và sẽ test nhầm `dist/` cũ.
  - GPU thật: `E2E_REAL_GPU=1 npx playwright test … --project=webgpu-real-gpu`.
- **Không push.** Push hay mở PR chỉ ở Task 17, sau khi Bao đồng ý.

## Global Constraints
Mọi task ngầm gồm các luật dưới đây (chép từ `CLAUDE.md` và spec). Số và tên giữ đúng như ghi.
- Chỉ TSL, `three@0.186.1`. Không dùng `ShaderMaterial`, `RawShaderMaterial`, `EffectComposer`, `onBeforeCompile`, và các API deprecated:
  `PostProcessing`, `renderAsync`, `label()`, `PCFSoftShadowMap`…
- Không dùng `select()` cho nhánh có node dùng chung: dùng `Fn` + `.toVar()` + `If`. TSL không có `atan2`: dùng `atan(y, x)`.
- `smoothstep(a, b, x)` luôn có **a < b hẳn**: GLSL không định nghĩa trường hợp a ≥ b. Muốn đảo chiều thì viết `1 − smoothstep(a, b, x)`.
  Mọi bề rộng nửa tối có sàn > 0 (`EPS`).
- `pow` chỉ dùng với cơ số chắc chắn ≥ 0; lũy thừa 2, 3, 4 viết bằng `pow2`, `pow3`, `pow4`.
- Tên uniform (`setName`) là định danh hợp lệ: `/^[A-Za-z_][A-Za-z0-9_]*$/`.
- `castShadow`, `receiveShadow`, `renderer.shadowMap.enabled`: đặt MỘT lần lúc dựng, không đổi lúc chạy. Không đặt số lên material lúc
  chạy: mọi thứ đổi theo trọng số hay núm đi qua uniform.
- Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`. Màu nào cũng đi qua `mix(datSet, màu, w)`.
- Không dùng `Math.random`: dùng `src/lib/random.js` (`mulberry32`, `randRange`). Không dùng `time`/`deltaTime` của TSL: dùng
  `ctx.u.time`, `ctx.u.delta`. Chuyển động theo cử chỉ tính thẳng từ thời gian (dạng đóng), để `update(0, t)` ra đúng khung N.
- `DynamicDrawUsage` chỉ cho thuộc tính ghi lại MỖI khung. InstancedMesh: ghi ma trận xong thì `computeBoundingSphere()`.
- Dòng 1 của mọi file `src/**/*.js`: `// <đường dẫn từ src/> — <một câu tiếng Việt>`.
  - Mỗi file khoảng 250 dòng trở xuống; quá 300 là test hỏng.
  - ESM + JSDoc, tên biến tiếng Anh. Import tương đối ghi đuôi `.js`.
  - Chú thích, thông báo lỗi và chữ cho người xem viết tiếng Việt.
- **Ranh giới:**
  - Bức không import bức khác. Lớp không import `parts/` của lớp khác: cần gì thì nhận qua `shared`.
  - `meta.layers[].files` kê mọi file `parts/` mà lớp import, thẳng hay qua part khác.
- **Hàng rào từ vựng** của Bức 2 (`meta.fence`): `drum`, `gobo`, `candle`, `flame`, `turbine`, `silhouet`, `wick`, `kéo quân`,
  `hình nhân`, `ngọn nến`, `đèn cù`, `chong chóng`. Xưởng (`src/engine/`, `src/ui/`, `src/lib/tsl/`) không được chứa từ nào trong số này.
- Id đã chọn ở đây là API công khai từ lúc deploy.
  - Slug: `den-keo-quan`. Lớp: `cot`, `ngon-nen`, `gian-nha`, `giay`, `keo-quan`, `phu-bong`.
  - Núm, thí nghiệm, số đo, tên vật: như các task ghi.
- **Chữ:**
  - `understand` ≤ 150 chữ (đếm theo khoảng trắng); `readMore` chỉ https.
  - Có nhãn cho MỌI núm, thí nghiệm, số đo và vật.
  - Sơ đồ SVG có `<title>` và chỉ dùng màu của bảng đã ghép (kể cả `lua`, `giayDo`).
- **Không có Dial.** Giữ `[data-moon]` cạnh con dấu.
- Commit: `Bao Nguyen <giabao261096@gmail.com>` (đã cấu hình trong repo). Không sửa git config global.

## Review Focus
Năm nhóm đầu vào mà spec ngụ ý nhưng test của từng task dễ bỏ sót, xếp từ dễ gặp nhất. Mỗi dòng đã có test ở task sở hữu nó.
1. **Bão cử chỉ:** chạm liên tiếp hơn 4 lần, vuốt liền nhau, vuốt rất nhanh, giữ ngay sau một cú gạt. Góc trống, tốc độ và độ ngả của lửa
   phải luôn hữu hạn, có trần, và liên tục. (Task 5: test "bão cử chỉ" bằng PRNG có hạt giống.)
2. **Thí nghiệm chồng lên trọng số:**
   - "Shadow map thật" đang bật mà mài Kéo quân về 0 thì bóng cũng phải mờ dần, không được đứng nguyên;
   - "Giấy trong suốt" khi Ngọn nến bằng 0 thì đèn chỉ là đất sét, không phát sáng.

   (Task 10: `shadow.intensity` theo `w5`; Task 9: test trọng số Ngọn nến 0.)
3. **Đèn thứ hai dựng lười phải được gỡ đúng:** bật "Shadow map thật" rồi `dispose()` (như khi "Dựng lại cảnh") thì scene không còn đèn
   nào. Snapshot không mang thí nghiệm, nên sau khi dựng lại, thí nghiệm tắt và đèn chưa được dựng. (Task 10.)
4. **Núm ở hai đầu:** `flameSize` 0, `penumbra` 0 và 2, `sides` 4 và 8, `figures` 6 và 12. Không NaN, không khung đen, mảng màu giấy đủ cho
   8 cạnh. (Task 3: LOD có sàn; Task 4: compile ở núm biên; Task 9: `sides` 8.)
5. **`?freeze` sau cử chỉ:** cùng chuỗi sự kiện thì cùng góc; `update(0, t)` vẽ lại đúng khung N. (Task 5: unit; Task 2: e2e "cùng khung thì
   giống hệt".)

## Bản đồ file
| File | Task | Việc |
|---|---|---|
| `src/paintings/den-keo-quan/meta.js` | 1 (sửa ở 2, 3, 7, 8, 9) | căn cước, thơ, poster, màu thêm, thứ tự lớp, `files`, `fence` |
| `src/paintings/den-keo-quan/index.js` | 1 | cửa vào nhẹ |
| `src/paintings/den-keo-quan/painting.js` | 1 (sửa ở 2, 8, 9, 11) | lớp, camera, `quality`, `setup` |
| `src/paintings/den-keo-quan/quality.js` | 1 → 11 | bảng ba mức, thang nấc |
| `src/paintings/den-keo-quan/shared.js` | 1 → 5 | `setup()`: trống, lửa, cử chỉ |
| `src/paintings/den-keo-quan/content.vi.js` | 1 → 14 | gợi ý, chữ của Sổ tay, nhãn |
| `src/paintings/den-keo-quan/diagrams/*.svg` | 14 | sơ đồ tab Hiểu |
| `layers/l1-cot.js` + `parts/cot-phong.js`, `cot-den.js` | 1 | gian nhà; đèn, `LANTERN`, `cylinderExit`, `planeCross` |
| `parts/cot-trong.js` | 2 → 3 | trống, chong chóng, texture mặt nạ |
| `parts/cot-hinh-nhan.js` | 3 → 6 | hình nhân (dữ liệu), `rasterize`, `mipChain` (hàm thuần) |
| `layers/l2-ngon-nen.js` + `parts/ngon-nen-lua.js` | 1 → 7 | đèn thật, node bóng giữ chỗ; mesh ngọn lửa |
| `parts/ngon-nen-thoi.js` | 5 | `createFlame` (hàm thuần) |
| `layers/l3-gian-nha.js` + `parts/gian-nha-vat-lieu.js` | 8 | texture thủ tục |
| `layers/l4-giay.js` | 9 | ánh sáng xuyên giấy, lọc màu |
| `layers/l5-keo-quan.js` + `parts/keo-quan-gobo.js` | 2 → 4 | gobo, node bóng |
| `parts/keo-quan-quay.js` | 5 | `createSpin` (hàm thuần) |
| `parts/keo-quan-that.js` | 10 | đèn thứ hai có cube shadow map |
| `tranh/den-keo-quan/index.html` | 1 (sửa ở 12) | trang Bức 2 |
| `index.html` | 12 | link lật tranh sang Bức 2 |
| `src/paintings/registry.js` | 1 | thêm dòng Bức 2 |
| `src/styles/shell.css` | 12 | kiểu của `nav.series` |
| `public/paintings/den-keo-quan/poster.webp`, `og.jpg` | 1 (chụp lại ở 15) | poster và ảnh og, chụp từ cảnh |
| `tests/paintings/den-keo-quan/*.test.js` | 1 → 11 | unit của Bức 2 |
| `tests/helpers/nodes.js` | 2 | `compileMaterial(…, { shadows: true })` |
| `tests/paintings/html.test.js` | 12 | lật tranh, registry theo `no` |
| `e2e/den-keo-quan.spec.js` | 2 → 11 | e2e riêng của Bức 2 |
| `e2e/lat-tranh.spec.js` | 12 | đi qua lại giữa hai trang |
| `.github/workflows/deploy.yml`, `playwright.config.js` | 13 | e2e chia hai phần |
| `README.md`, `CLAUDE.md`, spec | 16 | tài liệu khớp code |

---

### Task 1: Khung Bức 2 chạy được (luật 7): gian nhà, chiếc đèn, ngọn nến có node bóng giữ chỗ

**Mục tiêu:** Bức 2 có mặt trong registry, trang mở được trên cả hai backend, và đi qua mọi test hợp đồng, tên vật, HTML. Đèn nến bật
`castShadow` với một node bóng giữ chỗ bằng 1. Task này kiểm điều đầu tiên của Phụ lục A.77: bật `castShadow` mà không có shadow map nào
được vẽ.

**Files:**
- Create: `src/paintings/den-keo-quan/{meta.js, index.js, painting.js, quality.js, shared.js, content.vi.js}`
- Create: `src/paintings/den-keo-quan/layers/{l1-cot.js, l2-ngon-nen.js}`
- Create: `src/paintings/den-keo-quan/parts/{cot-phong.js, cot-den.js}`
- Create: `tranh/den-keo-quan/index.html`
- Modify: `src/paintings/registry.js`
- Create (chụp từ cảnh): `public/paintings/den-keo-quan/{poster.webp, og.jpg}`
- Test: `tests/paintings/den-keo-quan/khung.test.js`. Test hợp đồng, tên vật, HTML và e2e chung tự chạy cho bức mới.

**Interfaces:**
- Produces:
  - `LANTERN` và hai `Fn` TSL `cylinderExit(P, C, axis, r) → vec3(góc, độ cao, t)`, `planeCross(P, C, axis, Y) → vec3(dx, dz, t)`
    (`parts/cot-den.js`);
  - `ROOM` (`parts/cot-phong.js`);
  - `shared.cot = { hemi, hemiIntensity, lantern, room, paper, materials, receivers, casters, version }`. `room` là `ROOM`. `lantern` là `LANTERN` (số) cộng `axisNode` (node
    `vec2`), hai Fn trên và `sides` (uniform `lanternSides`). `paper` là Mesh `giay`;
  - `shared.ngonNen = { light, candle, rest, power, size }`: `candle` là uniform vec3 `candlePos`, `rest` là `Vector3` vị trí lửa lúc đứng
    yên, `power` là uniform `candlePower` (cường độ hiệu lực, lớp Giấy dùng), `size` là uniform `flameSize` = 0,01 (cỡ ngọn lửa, tức cỡ
    nguồn sáng; Task 7 thay bằng núm `flameSize`);
  - `shared.theta` (uniform `drumAngle`) và `shared.flame` (tạm: `at() → { offset: [0, 0, 0], glow: 1, lean: 0 }`): Task 5 thay bằng
    hàm thật.

- [ ] **Step 1: Viết test đỏ** `tests/paintings/den-keo-quan/khung.test.js`

```js
// tests/paintings/den-keo-quan/khung.test.js — Bức 2 dựng được như run.js: đèn nến bật castShadow mà không có shadow map (node bóng giữ chỗ), vật nhận bóng, đất sét khi mọi trọng số bằng 0.
import { describe, it, expect } from 'vitest';
import { CylinderGeometry } from 'three/webgpu';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { LANTERN, cornerAngles } from '../../../src/paintings/den-keo-quan/parts/cot-den.js';
import { ROOM } from '../../../src/paintings/den-keo-quan/parts/cot-phong.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, { until: 'ngon-nen', ...options });
const named = (layer, name) => layer.objects.find((o) => o.name === name);

describe('Bức 2 · khung', () => {
  it('trục đèn cách vách sau 1,9; ngọn lửa ở giữa dải hình nhân; lửa nằm trong ống trống', () => {
    expect(LANTERN.axis[1] - -ROOM.half).toBeCloseTo(1.9, 6);
    expect(LANTERN.flame[1]).toBeCloseTo((LANTERN.drum.y0 + LANTERN.drum.y1) / 2, 6);
    expect(Math.hypot(LANTERN.flame[0] - LANTERN.axis[0], LANTERN.flame[2] - LANTERN.axis[1])).toBeLessThan(LANTERN.drum.r);
  });

  it('cornerAngles khớp đỉnh thật của CylinderGeometry (quy ước góc atan(z, x) mà gobo và giấy dùng)', () => {
    for (const sides of [4, 6, 8]) {
      const pos = new CylinderGeometry(1, 1, 1, sides, 1, true).getAttribute('position');
      const real = new Set();
      for (let i = 0; i < pos.count; i += 1) real.add(Math.atan2(pos.getZ(i), pos.getX(i)).toFixed(4));
      const expected = new Set(cornerAngles(sides).map((a) => Math.atan2(Math.sin(a), Math.cos(a)).toFixed(4)));
      expect([...real].sort()).toEqual([...expected].sort());
    }
  });

  it('ngọn nến: một PointLight bật castShadow, có node bóng tự viết (three không dựng PointShadowNode), shadowMap bật', () => {
    const { ctx, shared } = build();
    const lights = ctx.scene.children.filter((o) => o.isPointLight);
    expect(lights).toHaveLength(1);
    const [light] = lights;
    expect(light.castShadow).toBe(true);
    expect(light.shadow.shadowNode?.isNode, 'thiếu light.shadow.shadowNode').toBe(true);
    expect(light.decay).toBe(2);
    expect(ctx.renderer.shadowMap.enabled).toBe(true);
    expect(shared.ngonNen.light).toBe(light);
  });

  it('gian nhà nhận bóng; giấy và vật trong đèn không nhận; vật trong đèn đổ bóng (cho thí nghiệm "Shadow map thật")', () => {
    const { layers } = build();
    for (const name of ['san', 'vach', 'tran', 'xa', 'cot-go']) expect(named(layers.cot, name).receiveShadow, name).toBe(true);
    for (const name of ['giay', 'khung-tre', 'de-chop', 'cay-nen']) expect(named(layers.cot, name).receiveShadow, name).toBe(false);
    for (const name of ['khung-tre', 'de-chop', 'cay-nen']) expect(named(layers.cot, name).castShadow, name).toBe(true);
    expect(named(layers.cot, 'giay').castShadow).toBe(false);
  });

  it('mọi trọng số (trừ Cốt) bằng 0: đèn nến tắt, đèn xưởng đủ sáng (luật 3)', () => {
    const { ctx, shared, layers } = build();
    ctx.weights.set('ngon-nen', 0);
    layers['ngon-nen'].update(0, 0);
    expect(shared.ngonNen.light.intensity).toBe(0);
    expect(shared.cot.hemi.intensity).toBeCloseTo(shared.cot.hemiIntensity, 6);
  });
});
```

- [ ] **Step 2: Chạy, thấy đỏ:** `npx vitest run tests/paintings/den-keo-quan/khung.test.js`. Hỏng vì chưa có module.

- [ ] **Step 3: `meta.js`, `index.js`, registry.**

```js
// paintings/den-keo-quan/meta.js — căn cước Bức 2 · Đèn Kéo Quân: tên, thơ, poster, màu thêm, thứ tự lớp và hàng rào từ vựng.
import phuBong from '../../engine/stock/phu-bong/meta.js';

/**
 * Dữ liệu thuần (JSON.stringify được): Node, test và trang tĩnh đều đọc được, không kéo three.
 * @type {import('../../engine/contracts/painting.js').PaintingMeta}
 */
export default {
  slug: 'den-keo-quan',
  no: 2,
  title: 'Đèn Kéo Quân',
  tagline: 'Một ngọn đèn kéo quân trong gian nhà tối, sơn từ sáu lớp ánh sáng.',
  // Dân ca "Đèn cù" (đèn cù là tên khác của đèn kéo quân), bỏ tiếng đệm lúc hát. Chữ đối chiếu lại trước khi merge (Task 17).
  poem: { lines: ['Khen ai khéo kết đèn cù', 'Voi giấy, ngựa giấy tít mù vòng quanh'], source: 'Ca dao' },
  poster: {
    src: '/paintings/den-keo-quan/poster.webp',
    width: 1600,
    height: 1000,
    alt: 'Tranh sơn mài đèn kéo quân: ngọn đèn giấy treo giữa gian nhà tối, bóng voi ngựa chạy quanh vách.',
    // scripts/poster.js chụp từ chính cảnh. Bức không có giờ hay trăng trong cảnh: at chỉ để con dấu và trăng SVG giống Bức 1.
    // freeze chốt lại ở Task 15, lúc đoàn quân đứng đẹp trên vách sau.
    capture: { at: '2026-10-25T21:00', freeze: 240 },
  },
  og: 'paintings/den-keo-quan/og.jpg',
  // Hai màu thêm vào bảng sơn mài (spec §18.3): lửa cam, giấy dó. Số hex chốt ở lượt màu (Task 15).
  palette: { lua: '#E0782E', giayDo: '#D9C7A0' },
  // THỨ TỰ PHỦ. Task 2 thêm Kéo quân, Task 8 Gian nhà, Task 9 Giấy: cuối cùng là cot, ngon-nen, gian-nha, giay, keo-quan, phu-bong.
  layers: [
    {
      id: 'cot',
      name: 'Cốt',
      files: [
        'paintings/den-keo-quan/layers/l1-cot.js',
        'paintings/den-keo-quan/parts/cot-phong.js',
        'paintings/den-keo-quan/parts/cot-den.js',
      ],
    },
    { id: 'ngon-nen', name: 'Ngọn nến', files: ['paintings/den-keo-quan/layers/l2-ngon-nen.js'] },
    phuBong,
  ],
  fence: ['drum', 'gobo', 'candle', 'flame', 'turbine', 'silhouet', 'wick', 'kéo quân', 'hình nhân', 'ngọn nến', 'đèn cù', 'chong chóng'],
};
```

`index.js` chép đúng `src/paintings/ao-sen-dem/index.js`, chỉ đổi dòng 1. `registry.js`: `import denKeoQuan from './den-keo-quan/meta.js';`
và thêm `{ meta: denKeoQuan, page: 'tranh/den-keo-quan/index.html', lang: 'vi' }` sau dòng Bức 1, giữ đúng thứ tự `no`.

- [ ] **Step 4: Trang `tranh/den-keo-quan/index.html`.** Chép `index.html` rồi đổi:
  - `<title>`, `og:title`: `Đèn Kéo Quân · Sơn Mài Ánh Sáng`;
  - `description`, `og:description`: đúng `meta.tagline`;
  - `og:url`: `https://giabao2610.github.io/son-mai-anh-sang/tranh/den-keo-quan/`;
  - `og:image`: `…/paintings/den-keo-quan/og.jpg`;
  - `data-painting="den-keo-quan"`;
  - `img[data-poster]`: `src`, `alt` theo meta;
  - dòng `<small>Sơn Mài Ánh Sáng · Bức 2</small>`, `<h1>Đèn Kéo Quân</h1>`;
  - `[data-poem]`: hai `<p>` đúng hai câu; `<cite>Ca dao</cite>`;
  - dòng import: `/src/paintings/den-keo-quan/index.js`.

  Giữ `<svg data-moon …>`. Link lật tranh để Task 12.

- [ ] **Step 5: `parts/cot-den.js`.** Số của đèn và hai hàm giao tia mà cả ba lớp Giấy, Kéo quân và thí nghiệm dùng chung (qua
  `shared.cot.lantern`).

```js
// paintings/den-keo-quan/parts/cot-den.js — của lớp Cốt: số đo của chiếc đèn, đỉnh lăng trụ giấy, và hai hàm TSL giao tia từ ngọn lửa (ống trụ, mặt phẳng ngang).
import { Fn, atan, dot, max, sqrt, vec3 } from 'three/tsl';

/**
 * Chiếc đèn treo giữa gian nhà (mét; spec §18.1). Số chốt lúc làm: đổi ở đây thì test khung kiểm lại các ràng buộc.
 * - axis: (x, z) của trục; cách vách sau (z = −2,5) đúng 1,9, nên bóng trên vách sau to gấp 1,9 / 0,09 ≈ 21 lần.
 * - paper: lăng trụ giấy, bán kính ngoại tiếp r, từ y0 tới y1. Đáy kín (đế), miệng trên hở bán kính `mouth`.
 * - drum: trống hình nhân (bán kính r, dải hình từ y0 tới y1). flame: tâm ngọn lửa lúc đứng yên, ở giữa dải hình.
 * - fan: chong chóng (độ cao, bán kính, số cánh). hang: chỗ buộc dây trên xà giữa.
 */
export const LANTERN = Object.freeze({
  axis: Object.freeze([0, -0.6]),
  sides: 6,
  paper: Object.freeze({ r: 0.17, y0: 1.36, y1: 1.74 }),
  mouth: 0.12,
  drum: Object.freeze({ r: 0.09, y0: 1.47, y1: 1.61 }),
  flame: Object.freeze([0, 1.54, -0.6]),
  candle: Object.freeze({ r: 0.012, y0: 1.36, y1: 1.5 }),
  fan: Object.freeze({ y: 1.7, r: 0.1, blades: 8 }),
  hang: 3.05,
});

/**
 * Góc (atan(z, x)) của các đỉnh lăng trụ `sides` cạnh mà CylinderGeometry dựng: three đặt đỉnh đầu tiên ở +z, tức góc π/2, rồi đi
 * ngược chiều atan theo bước 2π/sides. Gobo (nan tre) và lớp Giấy (tấm nào) dùng cùng quy ước này; test khung so với hình thật.
 * @param {number} sides
 */
export function cornerAngles(sides) {
  return Array.from({ length: sides }, (_, k) => Math.PI / 2 - (k * 2 * Math.PI) / sides);
}

/**
 * Tia từ C (ngọn lửa, ở TRONG ống) qua P cắt ống trụ đứng: trục qua `axis` = vec2(x, z), bán kính r.
 * d = P − C không chuẩn hóa, nên t là phần của đoạn C → P ở điểm cắt (t < 1: P ở ngoài ống). Nghiệm dương của
 * |o + t·d.xz|² = r² với o = C.xz − axis: c < 0 vì C ở trong ống, nên luôn có đúng một nghiệm dương.
 * Trả vec3(góc quanh trục bằng atan(z, x) theo radian, độ cao của điểm cắt, t).
 */
export const cylinderExit = Fn(([P, C, axis, r]) => {
  const d = P.sub(C);
  const o = C.xz.sub(axis);
  const a = max(dot(d.xz, d.xz), 1e-8); // tia gần như thẳng đứng: a ≈ 0, điểm cắt ở rất xa trên/dưới
  const b = dot(o, d.xz);
  const c = dot(o, o).sub(r.mul(r));
  const t = b.negate().add(sqrt(max(b.mul(b).sub(a.mul(c)), 0))).div(a);
  const h = C.add(d.mul(t));
  return vec3(atan(h.z.sub(axis.y), h.x.sub(axis.x)), h.y, t);
});

/**
 * Tia từ C qua P cắt mặt phẳng ngang y = Y, PHÍA TRÊN C. Tia đi xuống thì d.y bị kẹp về 1e-4: điểm cắt ra rất xa (hữu hạn), nên
 * người gọi luôn trộn bằng một hệ số "tia đi lên" chứ không cần nhánh If, và không bao giờ sinh NaN.
 * Trả vec3(dx, dz so với trục ở điểm cắt, t).
 */
export const planeCross = Fn(([P, C, axis, Y]) => {
  const d = P.sub(C);
  const t = Y.sub(C.y).div(max(d.y, 1e-4));
  const h = C.xz.add(d.xz.mul(t)).sub(axis);
  return vec3(h.x, h.y, t);
});
```

  Cũng trong `cot-den.js`, thêm hàm `createLantern(ctx, { material, sides })`. Hàm dựng các vật sau, mỗi vật có `name`:
  - `giay`: `CylinderGeometry(r, r, y1 − y0, sides, 1, true)`, mở hai đầu, đặt ở trục;
  - `khung-tre`: InstancedMesh các nan đứng ở `cornerAngles(sides)`, cộng hai vòng ở đáy và đỉnh;
  - `de-chop`: đế gỗ (đĩa kín ở `y0`) và vành miệng trên (vòng từ `mouth` tới `r` ở `y1`), gộp bằng `mergeGeometries` của
    `three/addons/utils/BufferGeometryUtils.js`;
  - `cay-nen`: thân nến;
  - `day-treo`: dây treo từ đỉnh đèn lên `hang`.

  Hàm trả `{ objects, rebuild(sides) }`. Như `parts/cot-leaf.js` của Bức 1, `rebuild` chỉ ghi lại hình học, không tạo mesh mới. Núm
  `sides` còn đổi uniform `lanternSides`.
  - `castShadow = true`: `khung-tre`, `de-chop`, `cay-nen`.
  - `receiveShadow`: mọi vật của đèn đặt `false`. Giấy tự tính ánh sáng xuyên qua (Task 9).

- [ ] **Step 6: `parts/cot-phong.js`.** `ROOM = { half: 2.5, height: 3.2, beams: [-1.8, -0.6, 0.6], beam: [5, 0.2, 0.16], posts: [[-2.3, -2.3], [2.3, -2.3]], post: 0.11 }`.
  Hàm `createRoom(ctx, materials)` dựng các vật, mỗi vật có `name`:
  - `san`: mặt phẳng 5 × 5 ở y = 0;
  - `vach`: ba mặt phẳng (sau z = −2,5; trái x = −2,5; phải x = 2,5) gộp làm MỘT geometry, pháp tuyến quay vào trong;
  - `tran`: mặt phẳng ở y = 3,2, quay xuống;
  - `xa`: InstancedMesh hộp theo `beams`, y = `hang`;
  - `cot-go`: InstancedMesh trụ theo `posts`.

  Mọi vật của gian nhà đặt `receiveShadow = true`. Material: mỗi nhóm một `MeshStandardNodeMaterial`, màu `datSet`, `emissiveNode =
  vec3(0)`. Cột dùng `MeshPhysicalNodeMaterial`: Task 8 thêm clearcoat, mà đổi loại material sau đó là biên dịch lại. Task 8 sửa
  `colorNode`/`roughnessNode` của các material này qua `shared.cot.materials`, nên `createRoom` trả cả `materials`.

  Cuối Task 1, `shared.cot.materials` có đúng các khóa `{ san, vach, tran, go, cot, tre, giay }`:
  - `go`: xà, đế và chóp;
  - `tre`: khung đèn, sau thêm tua;
  - `giay`: lớp Giấy sửa ở Task 9.

  Không material nào dùng chung giữa hai nhóm: Gian nhà sơn từng nhóm một kiểu.

- [ ] **Step 7: `layers/l1-cot.js`.** Làm theo mẫu `_mau/layers/l1-cot.js`:
  - đèn xưởng `HemisphereLight` như `_mau` (`STUDIO`);
  - `objects` = vật của gian nhà + vật của đèn;
  - núm `sides` (rebuild; min 4, max 8, step 2, value 6) và `wireframe` (rebuild, kind `bool`, value `false`). Mỗi núm có marker
    `// @knob` ở dòng xử lý;
  - thí nghiệm `flatNormals` (`flatShading` trên mọi material của Cốt + `needsUpdate`);
  - số đo `vertices`: `position.count × số bản`, như `cot-lab.js` của Bức 1.

  Công bố `shared.cot = { hemi, hemiIntensity, lantern, room: ROOM, paper, materials, receivers, casters, version: 0 }`, trong đó:
  - `lantern = { ...LANTERN, axisNode: vec2(...LANTERN.axis), sides: uniform(6).setName('lanternSides'), cylinderExit, planeCross }`
    (`axis` giữ là số cho JS; TSL dùng `axisNode`);
  - `version` tăng mỗi lần `sides` hay `wireframe` dựng lại.

  `dispose` gỡ mọi thứ (test hợp đồng kiểm scene trống).

- [ ] **Step 8: `layers/l2-ngon-nen.js`** (tối thiểu, Task 7 làm đủ).

```js
// paintings/den-keo-quan/layers/l2-ngon-nen.js — Lớp 2 · Ngọn nến: đèn thật đặt ở ngọn lửa (suy giảm theo bình phương khoảng cách), mang node bóng mà lớp Giấy và Kéo quân góp vào.
import { PointLight, Vector3 } from 'three/webgpu';
import { float, uniform } from 'three/tsl';

export const id = 'ngon-nen';

export const knobs = [
  // Cường độ đèn là thuộc tính JS của PointLight (three đọc mỗi khung), nên đổi không biên dịch lại: núm 'js'.
  { id: 'intensity', via: 'js', min: 0, max: 20, step: 0.1, value: 4 },
];

/** Đèn xưởng còn lại bao nhiêu khi nến sáng hẳn: một chút ánh đêm để chỗ bóng không đen kịt (luật 3). */
const NIGHT = 0.1;

/**
 * @param {import('../../../engine/contracts/runtime.js').LayerCtx} ctx
 * @param {object} shared  đọc shared.cot (lớp trước), shared.flame (setup); ghi shared.ngonNen
 */
export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { lantern, hemi, hemiIntensity } = shared.cot;
  const rest = new Vector3(...lantern.flame);
  const candle = uniform(rest.clone()).setName('candlePos');
  const power = uniform(0).setName('candlePower');
  const size = uniform(0.01).setName('flameSize'); // cỡ ngọn lửa (m) = cỡ nguồn sáng của gobo; Task 7 thay bằng núm
  // decay 2: ánh sáng giảm theo bình phương khoảng cách (vật lý). distance 0: không cắt ở tầm nào.
  const light = new PointLight(ctx.palette.hex.vangLaSang, 0, 0, 2);
  light.position.copy(rest);
  // Bật MỘT lần lúc dựng (castShadow và shadowMap.enabled nằm trong cache key). Có node bóng tự viết thì three dùng node đó thay
  // cho shadow map: không có render target, không lượt vẽ bóng nào (spec Phụ lục A.77). Giữ chỗ bằng 1; lớp Giấy và Kéo quân
  // nhân thêm vào trước khi biên dịch.
  ctx.renderer.shadowMap.enabled = true;
  light.castShadow = true;
  light.shadow.shadowNode = float(1);
  ctx.scene.add(light);
  shared.ngonNen = { light, candle, rest, power, size };
  let intensity = ctx.knobValue('intensity');
  const backWall = lantern.axis[1] + shared.cot.room.half; // từ trục tới vách sau z = −half (m)

  let disposed = false;
  return {
    objects: [],
    update(dt, t) {
      const k = w.value;
      const f = shared.flame.at(t);
      candle.value.set(rest.x + f.offset[0], rest.y + f.offset[1], rest.z + f.offset[2]);
      light.position.copy(candle.value);
      power.value = intensity * f.glow * k;
      light.intensity = power.value;
      hemi.intensity = hemiIntensity * (1 - k * (1 - NIGHT));
    },
    onKnob: {
      intensity: (v) => { intensity = v; }, // @knob intensity
    },
    experiments: [
      // decay là uniform của three (PointLightNode đọc mỗi khung): đổi không biên dịch lại (Phụ lục A.78).
      { id: 'noDecay', toggle: (on) => { light.decay = on ? 0 : 2; } },
    ],
    readouts: [{ id: 'backWall', get: () => Math.round(100 / backWall ** 2), unit: '%' }],
    dispose() {
      if (disposed) return;
      disposed = true;
      ctx.scene.remove(light);
      light.dispose();
    },
  };
}
```

- [ ] **Step 9: `shared.js` (tạm), `painting.js`, `quality.js`.**
  - `shared.js` (`setup`) trả `{ shared: { theta, flame }, update(dt, t) { theta.value = 0.6 * t; } }`, trong đó:
    - `theta = uniform(0).setName('drumAngle')`;
    - `flame = { at: () => ({ offset: [0, 0, 0], glow: 1, lean: 0 }) }`.

    Ghi chú rõ trong code: "tạm, Task 5 thay bằng createSpin/createFlame".
  - `painting.js` như Bức 1:
    - `layers = [cot, ngonNen, phuBong]`;
    - `export { setup } from './shared.js'`;
    - `export { quality } from './quality.js'`;
    - `camera = { position: [0, 1.45, 2.1], target: [0, 1.55, -0.6], fov: 50, azimuth: [-0.6, 0.6], polar: [1.3, 1.75], distance: [1.8, 2.75], breathe: 0.03 }`.

    Chú thích giới hạn camera: ở khoảng cách 2,75 và góc ±0,6, camera vẫn trong gian (|x| ≤ 1,55; z ≤ 2,15).
  - `quality.js`:
    - `levels.cao = { dpr: 2, bloom: 0.5 }`, `vua = { dpr: 1.5, bloom: 0.25 }`, `thap = { dpr: 1.25, bloom: 0.25 }`;
    - `ladder: ['dpr', 'phu-bong.bloom']`.

    Các task sau thêm khóa (ba mức luôn cùng bộ khóa).

- [ ] **Step 10: `content.vi.js`** (Task 14 viết lại cho đủ):
  - `hint: 'Chạm để thổi nến · vuốt để gạt đèn · giữ để dừng'`;
  - `layers.cot`: `understand` hai câu thật về cốt đất sét của gian nhà và chiếc đèn; `learned` một dòng; `readMore` (three.js
    `CylinderGeometry`); `knobs { sides: 'Số cạnh của đèn', wireframe: 'Khung dây' }`; `experiments.flatNormals`; `readouts {
    vertices: 'Số đỉnh' }`; `objects` có nhãn cho cả 10 vật;
  - `layers['ngon-nen']`: chữ ngắn tương tự; `knobs.intensity: 'Độ sáng của nến'`; `experiments.noDecay: { label: 'Ánh sáng không suy
    giảm', explain: 'Bỏ luật nghịch đảo bình phương: vách xa sáng như vách gần, căn phòng mất chiều sâu.' }`; `readouts.backWall: 'Độ rọi
    ở vách sau'`;
  - `'phu-bong': { ...phuBong.layers['phu-bong'] }`, như Bức 1.

- [ ] **Step 11: Chạy test khung, thấy xanh:** `npx vitest run tests/paintings/den-keo-quan/khung.test.js`.

- [ ] **Step 12: Poster tạm từ cảnh, rồi cả bộ test.**
  1. `npm run build && node scripts/poster.js den-keo-quan`. Lệnh này cần GPU thật; WebGPU trên Mac chạy được. Nó ghi `poster.webp` và
     `og.jpg`; Task 15 chụp lại.
  2. `npm test`. Phải xanh, gồm cả hợp đồng, tên vật, HTML và luật hàng rào.

- [ ] **Step 13: Chạy thật.**
  1. `npx playwright test e2e/painting.spec.js --project=static --project=webgl2-swiftshader -g "Đèn Kéo Quân"`: mọi test chung
     của bức mới phải xanh.
  2. `E2E_REAL_GPU=1 npx playwright test e2e/painting.spec.js --project=webgpu-real-gpu -g "Đèn Kéo Quân"`.

  Ghi vào thân commit: số draw call ở mức cao (`__sma.stats().drawCalls`, ước 9 vật + 14 = 23). Số vượt quá chừng đó là có shadow map
  ngầm: dừng lại xem Phụ lục A.77.

- [ ] **Step 14: Commit.**

```bash
git add src/paintings/den-keo-quan src/paintings/registry.js tranh/den-keo-quan public/paintings/den-keo-quan tests/paintings/den-keo-quan
git commit -m "feat(den-keo-quan): khung Bức 2 (gian nhà, chiếc đèn, ngọn nến có node bóng giữ chỗ; trang, registry, poster tạm từ cảnh)"
```

---

### Task 2: Node bóng gobo trên hai backend (task rủi ro nhất, có luật dừng)

**Mục tiêu:** Có lớp Kéo quân tối thiểu, gồm trống quay và mặt nạ tạm (tám ô chữ nhật). Gobo gắn vào node bóng của đèn, nên trên vách sau
có bóng chạy. Task này chứng minh trên cả WebGPU (GPU thật) và WebGL2 (SwiftShader) rằng:
- node bóng tự viết chạy;
- không có lượt vẽ bóng nào;
- quy ước góc giữa trống và gobo khớp nhau.

**LUẬT DỪNG.** DỪNG mọi việc sau đó nếu gặp một trong các trường hợp:
- Một trong hai backend không `live`.
- Console có lỗi shader.
- Mài Kéo quân về 0 mà vách vẫn như cũ (node không được dùng).
- Draw call tăng chừng 6 × số vật đổ bóng (three ngầm dựng shadow map).

Khi dừng:
1. Ghi lỗi (log, ảnh) vào scratchpad.
2. Báo Bao.
3. Đề xuất đường lùi của spec §18.10: nhân gobo thẳng vào ánh sáng của từng material, thay cho node bóng.
4. Chờ Bao quyết.

**Files:**
- Create: `src/paintings/den-keo-quan/layers/l5-keo-quan.js`, `parts/keo-quan-gobo.js`, `parts/cot-trong.js`
- Modify: `meta.js` (thêm lớp `keo-quan` trước `phuBong`; thêm `parts/cot-trong.js` vào `files` của Cốt), `painting.js`, `l1-cot.js`
  (dựng trống), `content.vi.js`
- Modify: `tests/helpers/nodes.js` (tùy chọn `shadows`)
- Test: `tests/paintings/den-keo-quan/keo-quan.test.js`, `e2e/den-keo-quan.spec.js` (tạo mới)

**Interfaces:**
- Consumes: `shared.cot.lantern`, `shared.ngonNen.{ light, candle, rest }`, `shared.theta` (Task 1).
- Produces:
  - `parts/cot-trong.js`:
    - `createMaskTexture(raster) → DataTexture`;
    - `placeholderRaster(width) → { width, height, levels }`: tám ô chữ nhật, không có mip ở Task 2 (một mức);
    - `createDrum(ctx, { lantern, mask, theta, solid }) → { mesh: Mesh 'trong', fan: Mesh 'chong-chong', update() }`;
  - `shared.cot.mask = { texture, width, solid }` (`solid`: uniform `drumSolid`);
  - `parts/keo-quan-gobo.js`: `createGobo({ lantern, mask, candle, rest, size, theta, sides, u }) → { all: Fn(P), figures: Fn(P) }`.
    Ở Task 2 chỉ có phần hình nhân; Task 4 thêm đế, miệng, chong chóng, nan tre;
  - `shared.keoQuan = { gobo, u }`.

- [ ] **Step 1: `compileMaterial` dịch được cả node bóng.** Trong `tests/helpers/nodes.js`, thêm tùy chọn `{ shadows = false }`. Khi
  `shadows` bật, đặt `renderer.shadowMap.enabled = true` trước `createNodeBuilder`, vì `AnalyticLightNode.setupShadow` thoát ngay khi
  cờ này tắt. Ghi chú vào JSDoc: "Không bật thì đèn có node bóng tự viết dịch như không có bóng".

- [ ] **Step 2: Viết test đỏ** `tests/paintings/den-keo-quan/keo-quan.test.js`.

```js
// tests/paintings/den-keo-quan/keo-quan.test.js — Lớp 5 · Kéo quân: gobo là node bóng của đèn nến, dịch được ra WGSL và GLSL; quy ước góc giữa trống và gobo.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';
import { compileMaterial, nodesOf } from '../../helpers/nodes.js';

const build = (options) => buildPainting(painting, meta, { until: 'keo-quan', ...options });
const wall = ({ layers }) => layers.cot.objects.find((o) => o.name === 'vach');

describe('l5-keo-quan', () => {
  it('node bóng của đèn chứa gobo: uniform drumAngle và texture mặt nạ nằm trong đồ thị', () => {
    const { shared } = build();
    const nodes = nodesOf(shared.ngonNen.light.shadow.shadowNode);
    expect(nodes.some((n) => n.isUniformNode && n.name === 'w_keo_quan'), 'trộn theo trọng số của lớp').toBe(true);
  });

  it.each(['webgpu', 'webgl2'])('%s: vách nhận bóng dịch được, có atan và tra texture, không lỗi', (backend) => {
    const built = build();
    const { fragmentShader, problems } = compileMaterial(wall(built), built.ctx, backend, { shadows: true });
    expect(problems).toEqual([]);
    expect(fragmentShader).toMatch(/atan/);
    expect(fragmentShader).toMatch(backend === 'webgpu' ? /textureSampleLevel/ : /textureLod/);
  });

  it('không bật shadows thì shader của vách không có gobo (khẳng định ngược: test trên không qua oan)', () => {
    const built = build();
    const { fragmentShader } = compileMaterial(wall(built), built.ctx, 'webgpu');
    expect(fragmentShader).not.toMatch(/textureSampleLevel/);
  });

  it('quy ước góc: điểm ở góc cục bộ φ của trống, sau khi trống quay θ, nằm ở góc thế giới φ − θ; gobo tra u = (φ_thế giới + θ) / 2π', () => {
    const theta = 0.7;
    for (const phiLocal of [0, 1, 2.5, -2]) {
      const [x, z] = [Math.cos(phiLocal), Math.sin(phiLocal)];
      // rotation.y = θ của three: x' = x cos θ + z sin θ, z' = −x sin θ + z cos θ
      const [xw, zw] = [x * Math.cos(theta) + z * Math.sin(theta), -x * Math.sin(theta) + z * Math.cos(theta)];
      const u = (((Math.atan2(zw, xw) + theta) / (2 * Math.PI)) % 1 + 1) % 1;
      expect(u).toBeCloseTo((((phiLocal / (2 * Math.PI)) % 1) + 1) % 1, 9);
    }
  });
});
```

- [ ] **Step 3: Chạy, thấy đỏ:** `npx vitest run tests/paintings/den-keo-quan/keo-quan.test.js`.

- [ ] **Step 4: `parts/cot-trong.js`.**
  - `createMaskTexture(raster)`:
    - `DataTexture(levels[0].data, width, height, RedFormat, UnsignedByteType)`;
    - `mipmaps = levels.map(({ data, width, height }) => ({ data, width, height }))`;
    - `generateMipmaps = false`; `minFilter = LinearMipmapLinearFilter` (một mức thì `LinearFilter`);
    - `wrapS = RepeatWrapping`, `wrapT = ClampToEdgeWrapping`;
    - `unpackAlignment = 1`: mip hẹp 1–2 byte một hàng, mà WebGL mặc định căn 4;
    - `needsUpdate = true`.
  - `placeholderRaster(width)`: `height = width / 4`; tám ô chữ nhật cao 70% dải, rộng 1/24 chu vi, đặt đều; độ phủ 255 trong ô, 0 ngoài
    ô; một mức.
  - `createDrum(ctx, { lantern, mask, theta, solid })`:
    - trống: `CylinderGeometry(r, r, y1 − y0, 64, 1, true)` dời lên giữa dải;
    - mesh `trong` đặt ở `(LANTERN.axis[0], 0, LANTERN.axis[1])`, mỗi khung `rotation.y = theta.value`;
    - material đất sét, `side: DoubleSide`;
    - `maskNode`: độ phủ > 0,5, hoặc `solid` bật. Tra mặt nạ theo vị trí CỤC BỘ, đúng quy ước của gobo:
      `u = fract(atan(positionLocal.z, positionLocal.x) / 2π)`, `v = (positionLocal.y − y0) / (y1 − y0)`. Three dùng `maskNode` cho cả
      lượt vẽ bóng (Phụ lục A.80);
    - `castShadow = true`;
    - chong chóng `chong-chong`: tám cánh phẳng nghiêng, ở `fan.y`, quay cùng `theta`.

- [ ] **Step 5: `parts/keo-quan-gobo.js`** (phần hình nhân; Task 4 thêm phần còn lại).

```js
// paintings/den-keo-quan/parts/keo-quan-gobo.js — của lớp Kéo quân: gobo tính ngay khi tô từng điểm: tia từ ngọn lửa cắt ống trụ của trống, tra mặt nạ hình nhân theo góc, nhòe theo cỡ ngọn lửa.
import { Fn, float, fract, log2, max, mix, smoothstep, texture, vec2 } from 'three/tsl';

const TAU = Math.PI * 2;
/** Sàn của cỡ nguồn sáng (m): nửa tối luôn > 0, nên smoothstep(a, b, x) luôn có a < b (GLSL không định nghĩa a ≥ b). */
export const EPS = 1e-4;

/**
 * @param {object} p
 * @param {object} p.lantern  shared.cot.lantern: số đo của đèn, `axisNode` (node vec2), `cylinderExit`, `planeCross`, `sides`
 * @param {{ texture: any, width: number, solid: any }} p.mask  shared.cot.mask
 * @param {any} p.candle  uniform vec3: vị trí lửa lúc này (chao theo nhấp nháy và thổi)
 * @param {any} p.rest    node vec3: vị trí lửa lúc đứng yên, trên trục
 * @param {any} p.size    node: cỡ ngọn lửa (m) = cỡ nguồn sáng
 * @param {any} p.theta   uniform: góc trống (rad)
 * @param {{ naive: any, point: any, penumbra: any, strength: any }} p.u  uniform của núm và thí nghiệm của lớp
 * @returns {{ all: any, figures: any }}  hai Fn TSL của P (vị trí thế giới): độ sáng lọt qua, 0 → 1
 */
export function createGobo({ lantern, mask, candle, rest, size, theta, u }) {
  const { axisNode: axis, drum, cylinderExit } = lantern;
  const texelsPerMeter = mask.width / (TAU * drum.r);
  /** Mức mip: log2 của số texel mà nửa tối (quy về mặt trống, mét) trải qua; không âm, nên LOD không bao giờ là −∞. */
  const lodOf = (meters) => log2(max(meters.mul(texelsPerMeter), 1));

  /** Độ phủ của hình nhân dọc tia C → P (0: lọt, 1: bị che). s: cỡ nguồn sáng hiệu lực (m). */
  const cover = Fn(([P, C, s]) => {
    const hit = cylinderExit(P, C, axis, float(drum.r)).toVar(); // vec3(góc, độ cao, t)
    // Trống quay θ thì điểm ở góc cục bộ φ nằm ở góc thế giới φ − θ: tra ngược lại ở φ_thế giới + θ (test quy ước góc).
    const uu = fract(hit.x.add(theta).div(TAU));
    const vv = hit.y.sub(drum.y0).div(drum.y1 - drum.y0);
    // Nửa tối quy về mặt trống: s × (1 − t) (tam giác đồng dạng: lửa cỡ s, điểm cắt ở phần t của đoạn C → P).
    const pen = s.mul(float(1).sub(hit.z));
    const figure = texture(mask.texture, vec2(uu, vv)).level(lodOf(pen)).r;
    // "Trống không cắt" (thí nghiệm của Cốt): cả dải hình thành giấy đặc.
    const band = smoothstep(-0.02, 0.0, vv).mul(float(1).sub(smoothstep(1.0, 1.02, vv)));
    return mix(figure, band, mask.solid).mul(u.strength);
  });

  /** Cỡ nguồn sáng hiệu lực: núm × penumbra, về EPS khi "Nguồn sáng là một điểm". */
  const sizeNode = () => size.mul(u.penumbra).mul(float(1).sub(u.point)).add(EPS);

  /** Ánh sáng ra phòng. Task 2: chỉ hình nhân. Task 4 nhân thêm đế, miệng, chong chóng, nan tre. */
  const all = Fn(([P]) => {
    const C = mix(candle, rest, u.naive).toVar(); // "Công thức gọn": coi như lửa đứng yên trên trục
    return float(1).sub(cover(P, C, sizeNode()));
  });
  /** Ánh sáng xuyên giấy (lớp Giấy nhân vào): chỉ hình nhân, nan tre ở ngoài giấy nên không che giấy. */
  const figures = Fn(([P]) => float(1).sub(cover(P, candle, sizeNode())));
  return { all, figures };
}
```

- [ ] **Step 6: `layers/l5-keo-quan.js`** (tối thiểu).
  - Khai báo núm: `speed` (js, 0–30 vòng/phút, value 6: Task 5 nối vào `shared.spin`, ở Task 2 `onKnob.speed` chỉ ghi lại giá trị);
    `penumbra` (uniform 0–2, value 1); `strength` (uniform 0–1, value 1).
  - Thí nghiệm `pointLight` và `naive`, mỗi cái là một uniform 0/1 (`goboPoint`, `goboNaive`).
  - `size`: `shared.ngonNen.size` (Task 7 đổi nó thành uniform của núm `flameSize`; Kéo quân đọc lúc dựng nên không phải sửa gì).
  - `rest`: `vec3(...shared.cot.lantern.flame)`. `shared.ngonNen.rest` là `Vector3` của JS, còn gobo cần node.
  - Gắn vào đèn:

    ```js
    light.shadow.shadowNode = light.shadow.shadowNode.mul(mix(float(1), gobo.all(positionWorld), w));
    ```

  - Đặt `shared.keoQuan = { gobo, u }`.
  - Trong `l1-cot.js`:
    - dựng trống bằng `createDrum` với mặt nạ từ `createMaskTexture(placeholderRaster(1024))`;
    - công bố `shared.cot.mask`;
    - thí nghiệm `solidDrum`: `mask.solid.value = on ? 1 : 0`;
    - tên vật `trong`, `chong-chong` (nhãn trong content);
    - Cốt `update` xoay trống và chong chóng theo `shared.theta.value`.
  - Content cho `keo-quan`: chữ ngắn thật, nhãn cho `speed`, `penumbra`, `strength`, `pointLight` (Nguồn sáng là một điểm), `naive`
    (Công thức gọn).

- [ ] **Step 7: Chạy test, thấy xanh:** `npx vitest run tests/paintings/den-keo-quan`, rồi `npm test`.

- [ ] **Step 8: E2E go/no-go** `e2e/den-keo-quan.spec.js` (tạo mới).

```js
// e2e/den-keo-quan.spec.js — tương tác và hình ảnh riêng của Bức 2: bóng hình nhân chạy trên vách, mài lớp, cử chỉ, chất lượng, thí nghiệm.
import { test, expect } from '@playwright/test';
import { waitForSettled, waitForFrames, canvasRegions, gpuReport, collectConsole, readSma } from './helpers.js';

const AT = 'at=2026-09-28T21:00';
// Vùng vách sau, bên trái đèn (tỉ lệ khung 640×400 của e2e): đoàn quân chạy ngang qua đây. Chốt lại ở Task 6 theo bố cục cuối.
const WALL = { x0: 0.06, y0: 0.12, x1: 0.32, y1: 0.55 };

let log;
test.beforeEach(async ({ page }, testInfo) => {
  log = collectConsole(page);
  const { kind, backend } = testInfo.project.metadata;
  if (kind === 'static') return;
  if (backend === 'webgpu') {
    await page.goto('./tranh/den-keo-quan/?static');
    test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
  }
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

/** Mở Bức 2 ở ?freeze=frames (cùng ?at), chờ live rồi chờ đủ khung. `extra` là chuỗi query thêm, bắt đầu bằng '&'. */
async function open(page, testInfo, frames, extra = '') {
  const { query } = testInfo.project.metadata;
  await page.goto(`./tranh/den-keo-quan/?${query.replace(/^\?/, '')}&${AT}&freeze=${frames}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
  return waitForFrames(page, frames, { timeout: 120_000 });
}
const wallOf = async (page) => (await canvasRegions(page, { wall: WALL })).wall;

/**
 * Bật/tắt một thí nghiệm như người xem. Bấm một phím (lần tương tác đầu, không chạm canvas: chạm là thổi nến) cho lời mời hiện ra,
 * vào chế độ mài, phủ lại mọi lớp về 1 (chế độ mài đưa chúng về 0), mở trang Phá của lớp rồi bấm nút. KHÔNG thêm hàm nào vào __sma:
 * GĐ 6 không đổi JS của xưởng (spec §18.6).
 */
async function toggleExperiment(page, layerId, expId, on) {
  if ((await page.locator('[data-rail]').count()) === 0 || !(await page.locator('[data-rail]').isVisible())) {
    await page.keyboard.press('Shift');
    await page.locator('[data-hint] button').click();
    for (const { id } of await page.evaluate(() => window.__sma.layers())) await page.evaluate((l) => window.__sma.setWeight(l, 1), id);
  }
  await page.locator(`[data-rail] [data-layer="${layerId}"] .rail-name`).click();
  const notebook = page.locator('[data-notebook]');
  await notebook.locator('[data-tab="pha"]').click();
  const button = notebook.locator(`[data-experiment="${expId}"]`);
  if ((await button.getAttribute('aria-pressed')) !== String(on)) await button.click();
  await expect(button).toHaveAttribute('aria-pressed', String(on));
}

test.describe('Đèn Kéo Quân · bóng trên vách', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('đoàn quân in bóng lên vách sau và chạy theo thời gian; cùng khung thì giống hệt; mài Kéo quân về 0 thì hết mép bóng', async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    await open(page, testInfo, 60);
    const a = await wallOf(page);
    await open(page, testInfo, 60);
    const again = await wallOf(page);
    expect(again.checksum, 'cùng ?at&freeze phải ra cùng ảnh').toBe(a.checksum);
    await open(page, testInfo, 120);
    const b = await wallOf(page);
    expect(b.checksum, 'khung 60 và 120 phải khác: trống đã quay').not.toBe(a.checksum);
    await page.evaluate(() => window.__sma.setWeight('keo-quan', 0));
    const flat = await wallOf(page);
    expect(flat.std, 'không còn mép bóng thì vách đều màu hơn hẳn').toBeLessThan(b.std * 0.6);
    expect(log.errors).toEqual([]);
  });

  test('node bóng tự viết không vẽ shadow map nào: draw call ở mức cao không có phần bóng', async ({ page }, testInfo) => {
    await open(page, testInfo, 30, '&level=cao');
    const { drawCalls } = await page.evaluate(() => window.__sma.stats());
    expect(drawCalls).toBeLessThanOrEqual(30); // cube shadow map sẽ thêm ≥ 6 × số vật đổ bóng
  });
});
```

  Chạy, theo thứ tự:
  1. `npm run build && npx playwright test e2e/den-keo-quan.spec.js --project=webgl2-swiftshader`;
  2. `E2E_REAL_GPU=1 npx playwright test e2e/den-keo-quan.spec.js --project=webgpu-real-gpu`;
  3. `npx playwright test e2e/painting.spec.js --project=webgl2-swiftshader -g "Đèn Kéo Quân"`.

  Chụp một ảnh mỗi backend: headless Playwright ở 1280×800, `?at&freeze=120`. Lưu vào scratchpad để so ở Task 3.

  **Áp luật dừng ở đây.**

- [ ] **Step 9: Commit.**

```bash
git add -A src/paintings/den-keo-quan tests e2e/den-keo-quan.spec.js
git commit -m "feat(den-keo-quan): lớp Kéo quân tối thiểu: gobo atan(y, x) làm node bóng của đèn nến, chạy trên WebGPU và WebGL2 (không lượt vẽ bóng nào)"
```

---

### Task 3: Mặt nạ hình nhân, mip tự tính, nửa tối theo khoảng cách

**Mục tiêu:**
- Thay mặt nạ tạm bằng `rasterize` (hàm thuần): khoảng cách có dấu tới từng hình cơ bản cho mép mịn một texel, quấn vòng theo chiều ngang,
  cộng chuỗi mip tự tính.
- Gobo tra mặt nạ ở mức mip theo bề rộng nửa tối: bóng gần đèn nét, trên vách mờ.
- Hai backend phải ra ảnh gần nhau.
- Thêm núm `figures`.

**Files:**
- Create: `src/paintings/den-keo-quan/parts/cot-hinh-nhan.js`
- Modify: `parts/cot-trong.js` (bỏ `placeholderRaster`), `l1-cot.js` (núm `figures`, số đo `mask`), `meta.js` (`files` của Cốt),
  `quality.js` (khóa `mask`), `content.vi.js`
- Test: `tests/paintings/den-keo-quan/cot-hinh-nhan.test.js`, thêm vào `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Produces:
  - `ASPECT = 4`, `MARGIN = 1 / 32`, `GROUND = 0.035`;
  - `shapeDistance(shape, x, y)`, `bounds(shape)`, `rasterize(figures, width, { count, ground }) → { width, height, levels }`,
    `mipChain(width, height, data)`;
  - `FIGURES` (Task 3 có hai hình mẫu; Task 6 làm đủ tám).
- Kiểu `Shape`:
  - `{ kind: 'circle', cx, cy, r }`
  - `{ kind: 'ellipse', cx, cy, rx, ry, rot? }`
  - `{ kind: 'capsule', ax, ay, bx, by, r }`
  - `{ kind: 'poly', points: [[x, y], …] }`

  Đơn vị là chiều cao dải. `x` tính từ tâm của hình theo chiều quay, `y` từ mép dưới của dải (0) lên mép trên (1).

- [ ] **Step 1: Viết test đỏ** `tests/paintings/den-keo-quan/cot-hinh-nhan.test.js`.

```js
// tests/paintings/den-keo-quan/cot-hinh-nhan.test.js — mặt nạ hình nhân: khoảng cách có dấu, độ phủ có mép mịn, quấn vòng, chuỗi mip, tám hình đặt đều trong dải.
import { describe, it, expect } from 'vitest';
import {
  ASPECT, FIGURES, GROUND, MARGIN, bounds, mipChain, rasterize, shapeDistance,
} from '../../../src/paintings/den-keo-quan/parts/cot-hinh-nhan.js';

const coverage = ({ data }) => data.reduce((s, v) => s + v, 0) / 255;

describe('cot-hinh-nhan', () => {
  it('khoảng cách có dấu: âm ở trong, dương ở ngoài, 0 trên mép (bốn loại hình)', () => {
    expect(shapeDistance({ kind: 'circle', cx: 0, cy: 0.5, r: 0.2 }, 0, 0.5)).toBeCloseTo(-0.2, 9);
    expect(shapeDistance({ kind: 'circle', cx: 0, cy: 0.5, r: 0.2 }, 0.3, 0.5)).toBeCloseTo(0.1, 9);
    expect(shapeDistance({ kind: 'capsule', ax: 0, ay: 0.2, bx: 0, by: 0.8, r: 0.05 }, 0.05, 0.5)).toBeCloseTo(0, 9);
    const square = { kind: 'poly', points: [[-0.1, 0.4], [0.1, 0.4], [0.1, 0.6], [-0.1, 0.6]] };
    expect(shapeDistance(square, 0, 0.5)).toBeCloseTo(-0.1, 9);
    expect(shapeDistance(square, 0.3, 0.5)).toBeCloseTo(0.2, 9);
    expect(shapeDistance({ kind: 'ellipse', cx: 0, cy: 0.5, rx: 0.2, ry: 0.1 }, 0, 0.5)).toBeLessThan(0);
  });

  it('một hình tròn ra đúng diện tích (sai số < 1%) và có mép trung gian', () => {
    const r = 0.3;
    const raster = rasterize([{ id: 'tron', width: 1, shapes: [{ kind: 'circle', cx: 0, cy: 0.5, r }] }], 512, { count: 1, ground: 0 });
    const area = coverage(raster.levels[0]) / raster.height ** 2; // đơn vị chiều cao dải
    expect(Math.abs(area / (Math.PI * r * r) - 1)).toBeLessThan(0.01);
    expect(raster.levels[0].data.some((v) => v > 0 && v < 255)).toBe(true);
  });

  it('tất định: hai lần vẽ cho cùng byte', () => {
    const a = rasterize(FIGURES, 512, { count: 8 });
    const b = rasterize(FIGURES, 512, { count: 8 });
    expect(Buffer.from(a.levels[0].data).equals(Buffer.from(b.levels[0].data))).toBe(true);
  });

  it('cỡ: cao = rộng / 4 (texel vuông trên mặt trụ); mip tới 1 × 1, mỗi mức là trung bình 2 × 2 của mức trước', () => {
    const { width, height, levels } = rasterize(FIGURES, 256, { count: 8 });
    expect(height).toBe(width / ASPECT);
    expect(levels.at(-1)).toMatchObject({ width: 1, height: 1 });
    expect(levels[1]).toMatchObject({ width: 128, height: 32 });
    const [l0, l1] = levels;
    const avg = (l0.data[0] + l0.data[1] + l0.data[l0.width] + l0.data[l0.width + 1]) / 4;
    expect(l1.data[0]).toBe(Math.round(avg));
  });

  it('quấn vòng: hình đặt sát mép phải tràn sang mép trái, không bị cắt', () => {
    const fig = { id: 'ngang', width: 0.6, shapes: [{ kind: 'capsule', ax: -0.3, ay: 0.5, bx: 0.3, by: 0.5, r: 0.1 }] };
    const { levels: [l0], width, height } = rasterize([fig], 256, { count: 1, ground: 0, offset: 0.5 }); // tâm hình ở u = 1
    const row = Math.round(0.5 * height) * width;
    expect(l0.data[row]).toBeGreaterThan(200);
    expect(l0.data[row + width - 1]).toBeGreaterThan(200);
  });

  it('dải để trống MARGIN ở trên và dưới (tra ngoài dải ra 0); vạch đất GROUND phủ kín cả vòng', () => {
    const { levels: [l0], width, height } = rasterize(FIGURES, 512, { count: 8 });
    const rowSum = (j) => l0.data.subarray(j * width, (j + 1) * width).reduce((s, v) => s + v, 0);
    expect(rowSum(0)).toBe(0);
    expect(rowSum(height - 1)).toBe(0);
    expect(rowSum(Math.floor((MARGIN + GROUND / 2) * height))).toBe(255 * width);
  });

  it('mọi hình nằm trong dải [MARGIN, 1 − MARGIN] và trong bề rộng của chính nó', () => {
    for (const fig of FIGURES) {
      for (const s of fig.shapes) {
        const b = bounds(s);
        expect(b.y0, `${fig.id}`).toBeGreaterThanOrEqual(MARGIN - 1e-9);
        expect(b.y1, `${fig.id}`).toBeLessThanOrEqual(1 - MARGIN + 1e-9);
        expect(Math.max(-b.x0, b.x1), `${fig.id}`).toBeLessThanOrEqual(fig.width / 2 + 1e-9);
      }
    }
  });

  it('vẽ ở 2048 nhanh: dưới 120 ms trong Node (mục tiêu 50 ms trên trình duyệt, spec §18.7)', () => {
    const t0 = performance.now();
    rasterize(FIGURES, 2048, { count: 8 });
    expect(performance.now() - t0).toBeLessThan(120);
  });
});
```

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `parts/cot-hinh-nhan.js`.**

```js
// paintings/den-keo-quan/parts/cot-hinh-nhan.js — của lớp Cốt, hàm thuần (không import three): hình nhân của trống bằng dữ liệu, vẽ ra mặt nạ độ phủ quấn vòng cùng chuỗi mip.

/** Bề rộng : chiều cao của dải. Texel vuông trên mặt trụ: chu vi 2π × 0,09 ≈ 0,565 m, dải cao 0,14 m (spec §18.4). */
export const ASPECT = 4;
/** Lề để trống ở trên và dưới dải (phần của chiều cao): tra ngoài dải (ClampToEdge) ra 0, không kéo vệt chân hình. */
export const MARGIN = 1 / 32;
/** Vạch đất (giấy liền) chạy quanh chân dải; đoàn quân đứng trên vạch này. */
export const GROUND = 0.035;

/** Hộp bao của một hình cơ bản (đơn vị chiều cao dải). */
export function bounds(s) {
  if (s.kind === 'circle') return { x0: s.cx - s.r, x1: s.cx + s.r, y0: s.cy - s.r, y1: s.cy + s.r };
  if (s.kind === 'ellipse') {
    const m = Math.max(s.rx, s.ry);
    return { x0: s.cx - m, x1: s.cx + m, y0: s.cy - m, y1: s.cy + m };
  }
  if (s.kind === 'capsule') {
    return {
      x0: Math.min(s.ax, s.bx) - s.r, x1: Math.max(s.ax, s.bx) + s.r,
      y0: Math.min(s.ay, s.by) - s.r, y1: Math.max(s.ay, s.by) + s.r,
    };
  }
  const xs = s.points.map((p) => p[0]);
  const ys = s.points.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Khoảng cách có dấu (âm ở trong) từ (x, y) tới hình s. Elip là gần đúng: đủ cho mép mịn một texel. */
export function shapeDistance(s, x, y) {
  if (s.kind === 'circle') return Math.hypot(x - s.cx, y - s.cy) - s.r;
  if (s.kind === 'ellipse') {
    const c = Math.cos(s.rot ?? 0);
    const n = Math.sin(s.rot ?? 0);
    const dx = x - s.cx;
    const dy = y - s.cy;
    const u = (dx * c + dy * n) / s.rx;
    const v = (-dx * n + dy * c) / s.ry;
    return (Math.hypot(u, v) - 1) * Math.min(s.rx, s.ry);
  }
  if (s.kind === 'capsule') {
    const ex = s.bx - s.ax;
    const ey = s.by - s.ay;
    const h = Math.min(Math.max(((x - s.ax) * ex + (y - s.ay) * ey) / (ex * ex + ey * ey || 1), 0), 1);
    return Math.hypot(x - s.ax - ex * h, y - s.ay - ey * h) - s.r;
  }
  // Đa giác: khoảng cách tới cạnh gần nhất; dấu theo luật chẵn-lẻ (tia ngang cắt bao nhiêu cạnh).
  const p = s.points;
  let d = Infinity;
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i, i += 1) {
    const [xi, yi] = p[i];
    const [xj, yj] = p[j];
    const ex = xj - xi;
    const ey = yj - yi;
    const h = Math.min(Math.max(((x - xi) * ex + (y - yi) * ey) / (ex * ex + ey * ey || 1), 0), 1);
    d = Math.min(d, Math.hypot(x - xi - ex * h, y - yi - ey * h));
    if ((yi > y) !== (yj > y) && x < (ex * (y - yi)) / ey + xi) inside = !inside;
  }
  return inside ? -d : d;
}

/**
 * Vẽ `count` hình (lặp theo thứ tự của `figures`) đặt đều quanh dải, ra độ phủ 8 bit rộng `width`, cao `width / ASPECT`, kèm chuỗi mip.
 * Mỗi texel MỘT mẫu: độ phủ = clamp(0,5 − khoảng cách / cỡ texel), tức mép mịn đúng một texel mà không phải lấy nhiều mẫu. Mỗi hình
 * cơ bản chỉ xét các texel trong hộp bao của nó, nên 2048 × 512 vẽ trong vài chục ms. Hợp của các hình: lấy độ phủ lớn nhất.
 * offset: dời cả đoàn theo vòng (phần của chu vi), test quấn vòng dùng.
 */
export function rasterize(figures, width, { count = figures.length, ground = GROUND, offset = 0 } = {}) {
  const height = width / ASPECT;
  const data = new Uint8Array(width * height);
  const texel = 1 / height;
  // Vạch đất: các hàng từ MARGIN tới MARGIN + ground, phủ kín cả vòng.
  for (let j = Math.floor(MARGIN * height); j < Math.round((MARGIN + ground) * height); j += 1) data.fill(255, j * width, (j + 1) * width);
  for (let k = 0; k < count; k += 1) {
    const fig = figures[k % figures.length];
    const cx = ((k + 0.5) / count + offset) * width; // tâm hình, theo texel
    for (const s of fig.shapes) {
      const b = bounds(s);
      const i0 = Math.floor(cx + (b.x0 - texel) * height);
      const i1 = Math.ceil(cx + (b.x1 + texel) * height);
      const j0 = Math.max(0, Math.floor((b.y0 - texel) * height));
      const j1 = Math.min(height - 1, Math.ceil((b.y1 + texel) * height));
      for (let j = j0; j <= j1; j += 1) {
        const y = (j + 0.5) / height;
        for (let i = i0; i <= i1; i += 1) {
          const cover = Math.min(Math.max(0.5 - shapeDistance(s, (i + 0.5 - cx) / height, y) / texel, 0), 1);
          if (cover <= 0) continue;
          const at = j * width + (((i % width) + width) % width); // quấn vòng theo chiều ngang
          data[at] = Math.max(data[at], Math.round(cover * 255));
        }
      }
    }
  }
  return { width, height, levels: mipChain(width, height, data) };
}

/** Chuỗi mip (mức 0 là ảnh gốc): mỗi mức là trung bình 2 × 2 của mức trước, cạnh nào đã bằng 1 thì giữ 1. Dừng ở 1 × 1. */
export function mipChain(width, height, data) {
  const levels = [{ width, height, data }];
  let [w, h, src] = [width, height, data];
  while (w > 1 || h > 1) {
    const nw = Math.max(1, w >> 1);
    const nh = Math.max(1, h >> 1);
    const out = new Uint8Array(nw * nh);
    for (let j = 0; j < nh; j += 1) {
      const [y0, y1] = [Math.min(j * 2, h - 1), Math.min(j * 2 + 1, h - 1)];
      for (let i = 0; i < nw; i += 1) {
        const [x0, x1] = [Math.min(i * 2, w - 1), Math.min(i * 2 + 1, w - 1)];
        out[j * nw + i] = Math.round((src[y0 * w + x0] + src[y0 * w + x1] + src[y1 * w + x0] + src[y1 * w + x1]) / 4);
      }
    }
    levels.push({ width: nw, height: nh, data: out });
    [w, h, src] = [nw, nh, out];
  }
  return levels;
}
```

  `FIGURES` ở Task 3 có hai hình mẫu. Đây là số khởi đầu (đơn vị chiều cao dải; vạch đất ở y 0,031–0,066 nên chân đặt ở
  y ≈ 0,07). Task 6 làm đủ tám hình và tinh chỉnh theo ảnh.

```js
/**
 * Hình nhân: id, bề rộng (đơn vị chiều cao dải; tổng bề rộng của tối đa 10 hình ≤ ASPECT), các hình cơ bản. x tính từ tâm hình,
 * y từ mép dưới dải. Dáng cắt giấy: khối phẳng, mép gọn; chân ngựa và cờ so le để bóng chạy có nhịp (spec §18.3).
 */
export const FIGURES = [
  {
    id: 'cuoi-ngua', // người cưỡi ngựa phất cờ
    width: 0.62,
    shapes: [
      { kind: 'ellipse', cx: 0, cy: 0.36, rx: 0.17, ry: 0.08 }, // mình ngựa
      { kind: 'capsule', ax: 0.12, ay: 0.4, bx: 0.2, by: 0.52, r: 0.035 }, // cổ
      { kind: 'ellipse', cx: 0.235, cy: 0.52, rx: 0.06, ry: 0.03, rot: -0.5 }, // đầu
      { kind: 'capsule', ax: 0.12, ay: 0.31, bx: 0.22, by: 0.17, r: 0.02 }, // chân trước, đang phi
      { kind: 'capsule', ax: 0.09, ay: 0.3, bx: 0.12, by: 0.07, r: 0.02 },
      { kind: 'capsule', ax: -0.13, ay: 0.31, bx: -0.22, by: 0.17, r: 0.02 }, // chân sau
      { kind: 'capsule', ax: -0.1, ay: 0.3, bx: -0.07, by: 0.07, r: 0.02 },
      { kind: 'poly', points: [[-0.16, 0.38], [-0.27, 0.41], [-0.28, 0.3], [-0.18, 0.34]] }, // đuôi
      { kind: 'capsule', ax: 0, ay: 0.42, bx: 0.02, by: 0.58, r: 0.04 }, // người
      { kind: 'circle', cx: 0.03, cy: 0.64, r: 0.035 }, // đầu người
      { kind: 'poly', points: [[-0.03, 0.66], [0.09, 0.66], [0.03, 0.71]] }, // nón chóp
      { kind: 'capsule', ax: 0.02, ay: 0.55, bx: -0.06, by: 0.9, r: 0.008 }, // cán cờ
      { kind: 'poly', points: [[-0.06, 0.9], [-0.22, 0.86], [-0.06, 0.8]] }, // cờ
    ],
  },
  {
    id: 'linh-co', // lính vác cờ đuôi nheo
    width: 0.3,
    shapes: [
      { kind: 'capsule', ax: -0.03, ay: 0.07, bx: -0.01, by: 0.3, r: 0.025 }, // chân sau
      { kind: 'capsule', ax: 0.05, ay: 0.07, bx: 0.02, by: 0.3, r: 0.025 }, // chân trước (đang bước)
      { kind: 'capsule', ax: 0, ay: 0.32, bx: 0.01, by: 0.52, r: 0.05 }, // mình
      { kind: 'circle', cx: 0.015, cy: 0.59, r: 0.04 }, // đầu
      { kind: 'poly', points: [[-0.04, 0.61], [0.07, 0.61], [0.015, 0.68]] }, // nón chóp
      { kind: 'capsule', ax: 0.06, ay: 0.4, bx: 0.03, by: 0.92, r: 0.008 }, // cán cờ
      { kind: 'poly', points: [[0.03, 0.92], [-0.12, 0.88], [-0.06, 0.85], [-0.12, 0.81], [0.03, 0.8]] }, // cờ đuôi nheo
    ],
  },
];
```

  Hình nào cũng phải nằm trong `±width / 2` theo chiều ngang và trong `[MARGIN, 1 − MARGIN]` theo chiều dọc: test giữ. Nửa bề rộng
  của `cuoi-ngua` là 0,31; đầu ngựa ra tới 0,295.
  Spec §18.3 ghi núm `figures` 6–12. Mười hai hình ngựa và voi không vừa chu vi dải (4 đơn vị), nên trần là 10: sửa §18.3, §18.4 trong
  commit này.

- [ ] **Step 4: Nối vào Cốt.**
  - `createMaskTexture(rasterize(FIGURES, ctx.budget.mask, { count: ctx.knobValue('figures') }))`.
  - Núm `figures` (rebuild 6–10, step 1, value 8): vẽ lại mặt nạ, chép vào texture đã có (cùng cỡ), `needsUpdate = true`. Không tạo
    texture mới: node của gobo giữ tham chiếu texture.
  - Số đo `mask`: chuỗi `` `${w} × ${h}` ``.
  - `quality.js` thêm khóa `mask`: cao 2048, vừa 2048, thấp 1024.
  - Bỏ `placeholderRaster`.

- [ ] **Step 5: Xanh:** `npx vitest run tests/paintings/den-keo-quan`, rồi `npm test`.

- [ ] **Step 6: E2E: nửa tối và hai backend.** Thêm vào `e2e/den-keo-quan.spec.js`:

```js
test('nửa tối theo cỡ lửa: "Nguồn sáng là một điểm" làm mép bóng trên vách gắt hơn (độ lệch chuẩn tăng)', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await open(page, testInfo, 60);
  const soft = await wallOf(page);
  await toggleExperiment(page, 'keo-quan', 'pointLight', true); // vẽ lại khung đứng yên (?freeze), cùng thời điểm
  const hard = await wallOf(page);
  expect(hard.std).toBeGreaterThan(soft.std);
  expect(log.errors).toEqual([]);
});
```

  Thanh lớp và Sổ tay che một phần khung. Nếu vùng `WALL` bị che ở 640×400, đặt viewport rộng hơn cho riêng test này
  (`test.use({ viewport: { width: 1280, height: 800 } })` trong một `describe` riêng) và tính lại `WALL` theo khung đó.

  Chụp lại ảnh hai backend ở 1280×800 (`?at&freeze=120`), so với ảnh Task 2: hai backend phải cùng hình, cùng độ nhòe (mắt thường,
  cạnh nhau). Lệch rõ thì xem lại chuỗi mip (Phụ lục A.79) trước khi đi tiếp.

- [ ] **Step 7: Commit:** `feat(den-keo-quan): mặt nạ hình nhân (khoảng cách có dấu, quấn vòng, mip tự tính) và nửa tối theo khoảng cách`.

---

### Task 4: Gobo đầy đủ: đế, miệng trên, chong chóng, nan tre; số đo của Kéo quân

**Mục tiêu:**
- Gobo đầy đủ:
  - vùng tối dưới đèn (đế che);
  - vầng sáng trên trần qua miệng đèn, có bóng chong chóng xoay;
  - sáu vạch nan tre.
- Mọi bề rộng nửa tối đều tính từ cỡ lửa.
- Số đo `magnify` và `penumbra`.
- Ở các núm biên, shader vẫn dịch được và không có NaN.

**Files:**
- Modify: `parts/keo-quan-gobo.js`, `layers/l5-keo-quan.js`, `content.vi.js`
- Test: `tests/paintings/den-keo-quan/keo-quan.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Consumes: `lantern.{ paper, mouth, fan, planeCross, sides }`, `shared.ngonNen.size`.
- Produces: `createGobo(...).all` có đủ mọi phần; số đo `magnify`, `penumbra` của lớp Kéo quân.

- [ ] **Step 1: Viết test đỏ.** Thêm vào `keo-quan.test.js`:

```js
it('số đo: bóng ở vách sau to gấp vách / bán kính trống; nửa tối ở vách sau theo cỡ lửa và núm penumbra', () => {
  const { layers, shared } = build();
  const read = (id) => layers['keo-quan'].readouts.find((r) => r.id === id).get();
  const d = shared.cot.lantern.axis[1] + shared.cot.room.half; // 1,9
  expect(read('magnify')).toBeCloseTo(d / shared.cot.lantern.drum.r, 1); // ≈ 21,1
  // s × (D − r) / r, đổi ra cm: 0,01 × (1,9 − 0,09) / 0,09 × 100 ≈ 20 cm
  expect(read('penumbra')).toBeCloseTo((0.01 * (d - 0.09)) / 0.09 * 100, 0);
});

it.each([
  ['penumbra 0', { penumbra: 0 }], ['penumbra 2', { penumbra: 2 }], ['nguồn sáng là một điểm', { point: 1 }], ['công thức gọn', { naive: 1 }],
])('núm biên (%s): vách vẫn dịch được ra WGSL và GLSL, không lỗi', (_, set) => {
  const built = build();
  for (const [k, v] of Object.entries(set)) built.shared.keoQuan.u[k].value = v;
  for (const backend of ['webgpu', 'webgl2']) {
    expect(compileMaterial(wall(built), built.ctx, backend, { shadows: true }).problems, backend).toEqual([]);
  }
});

it('sides 4 và 8: góc nan tre theo uniform lanternSides, không cần biên dịch lại', async () => {
  const built = build();
  await built.knobs.cot.set('sides', 8);
  expect(built.shared.cot.lantern.sides.value).toBe(8);
});
```

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: Mở rộng `all` trong `parts/keo-quan-gobo.js`.** Phần hình nhân giữ nguyên như Task 2.

```js
/** Nan tre ở các góc lăng trụ giấy: nửa bề rộng (m). */
export const RIB = 0.004;
/** Chong chóng: phần chu kỳ mà một cánh che (cánh nằm giữa chu kỳ). */
export const BLADE = 0.4;

// ... trong createGobo, sau `cover` và `sizeNode`:
  const { paper, mouth, fan, planeCross, sides } = lantern;

  /** Ánh sáng ra phòng theo tia C → P: hình nhân × nan tre × đế × (vành miệng, chong chóng). 1 là lọt hết. */
  const all = Fn(([P]) => {
    const C = mix(candle, rest, u.naive).toVar(); // "Công thức gọn": coi như lửa đứng yên trên trục
    const s = sizeNode().toVar();
    const out = cylinderExit(P, C, axis, float(paper.r)).toVar(); // tia ra khỏi giấy ở đâu (lăng trụ coi như ống tròn)
    const pen = s.mul(float(1).sub(out.z)).max(EPS).toVar(); // nửa tối ở bán kính của giấy
    // Đế gỗ: tia ra dưới đáy giấy là vướng đế. 0 dưới đáy, 1 trên đáy.
    const base = smoothstep(float(paper.y0).sub(pen), float(paper.y0).add(pen), out.y);
    // Trên đỉnh giấy: hoặc lọt qua miệng, hoặc vướng vành chóp. top: 0 dưới đỉnh, 1 trên đỉnh.
    const top = smoothstep(float(paper.y1).sub(pen), float(paper.y1).add(pen), out.y).toVar();
    const lip = planeCross(P, C, axis, float(paper.y1)).toVar();
    const open = float(1).sub(smoothstep(float(mouth).sub(pen), float(mouth).add(pen), length(lip.xy)));
    // Chong chóng: điểm cắt mặt phẳng của cánh ở bán kính rho, góc tính như trống (quay cùng θ).
    const vane = planeCross(P, C, axis, float(fan.y)).toVar();
    const rho = length(vane.xy).toVar();
    const f = fract(atan(vane.y, vane.x.add(EPS)).add(theta).mul(fan.blades / TAU)); // EPS: atan(0, 0) không định nghĩa
    const pw = pen.mul(fan.blades / TAU).div(rho.max(1e-3)); // nửa tối, đổi ra phần của một chu kỳ cánh
    const onBlade = float(1).sub(smoothstep(float(BLADE / 2).sub(pw), float(BLADE / 2).add(pw), abs(f.sub(0.5))));
    const inFan = float(1).sub(smoothstep(float(fan.r).sub(pen), float(fan.r).add(pen), rho));
    const above = mix(float(1), open.mul(float(1).sub(onBlade.mul(inFan))), top);
    // Nan tre: cung từ chỗ tia ra tới góc gần nhất của lăng trụ (góc ở π/2 − k·2π/sides, xem cornerAngles).
    const k = out.x.sub(Math.PI / 2).div(TAU).mul(sides);
    const arc = abs(fract(k.add(0.5)).sub(0.5)).mul(TAU).div(sides).mul(paper.r);
    const rib = mix(smoothstep(float(RIB).sub(pen), float(RIB).add(pen), arc), float(1), top); // nan chỉ chạy dọc thân
    return base.mul(above).mul(rib).mul(float(1).sub(cover(P, C, s)));
  });
```

  Import thêm `abs`, `atan`, `length` từ `three/tsl`.
  - `RIB − pen` có thể âm. Không sao: smoothstep vẫn có a < b, vì `pen` ≥ `EPS` > 0.
  - Nếu Task 1 đổi số của `LANTERN`, kiểm lại rằng tia ra qua miệng đi trên dải hình (không tra mặt nạ): ở bán kính trống, độ cao
    của tia phải > `drum.y1`.

- [ ] **Step 4: Số đo của Kéo quân.**
  - Gọi `D = lantern.axis[1] + room.half` (từ trục tới vách sau).
  - `magnify`: `Math.round((D / drum.r) * 10) / 10`, đơn vị `×`.
  - `penumbra`: `Math.round(size.value * penumbra.value * (1 − point.value) * ((D − r) / r) * 100)`, đơn vị `cm`. Đây là nửa tối ở vách
    sau.
  - Content: `readouts { magnify: 'Bóng phóng to ở vách sau', penumbra: 'Nửa tối ở vách sau' }`.

- [ ] **Step 5: Xanh:** `npx vitest run tests/paintings/den-keo-quan`, rồi `npm test`.

- [ ] **Step 6: E2E trần và sàn.** Thêm vào `den-keo-quan.spec.js`. Định nghĩa tạm ba hằng ở đầu file, cạnh `WALL`; Task 6 chốt lại
  theo bố cục cuối:
  - `CEILING`: vùng trần ngay trên đèn;
  - `FLOOR`: vùng sàn ngay dưới đèn, so với `FLOOR_FAR` gần vách bên.

```js
test('trần có vầng sáng mang bóng chong chóng xoay; sàn ngay dưới đèn tối hơn sàn gần vách', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await open(page, testInfo, 60);
  const a = await canvasRegions(page, { ceiling: CEILING, under: FLOOR, far: FLOOR_FAR });
  await open(page, testInfo, 75);
  const b = await canvasRegions(page, { ceiling: CEILING });
  expect(b.ceiling.checksum, 'chong chóng quay: trần đổi giữa hai khung').not.toBe(a.ceiling.checksum);
  expect(a.under.mean, 'đế che: sàn dưới đèn tối hơn').toBeLessThan(a.far.mean);
});
```

  Chạy webgl2-swiftshader và GPU thật.

- [ ] **Step 7: Commit:** `feat(den-keo-quan): gobo đủ phần (đế, miệng trên, chong chóng, nan tre) và số đo phóng to, nửa tối`.

---

### Task 5: Trống quay và ngọn lửa: hàm thuần, cử chỉ, số đo

**Mục tiêu:**
- `createSpin` và `createFlame`: hàm thuần, tính thẳng từ thời gian.
- `setup()` nhận ba cử chỉ: chạm là thổi, giữ là giữ trống, vuốt là gạt.
- Số đo `rpm` (Kéo quân) và `lean` (Ngọn nến).
- Núm `speed` nối vào trống.
- Bão cử chỉ vẫn hữu hạn và có trần.

**Files:**
- Create: `parts/keo-quan-quay.js`, `parts/ngon-nen-thoi.js`
- Modify: `shared.js`, `layers/l5-keo-quan.js`, `layers/l2-ngon-nen.js`, `meta.js` (`files` của hai lớp), `content.vi.js`,
  `e2e/helpers.js` (`swipeAt`)
- Test: `tests/paintings/den-keo-quan/{keo-quan-quay,ngon-nen-thoi,cu-chi}.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Produces:
  - `SPIN`, `rpmToOmega(rpm)`, `flickOf(velocity)`, `createSpin({ omega }) → { angle(t), speed(t), grip(t), release(t), flick(t, dOmega),
    setBase(t, omega) }`;
  - `FLAME`, `createFlame({ reduced }) → { blow(t, dir), at(t) → { offset: [x, y, z], glow, lean }, flicker }` (`flicker`: hệ số 0 → 2,
    ghi được);
  - `shared = { spin, flame, theta, slow }`. `slow` = 0,5 khi người xem xin giảm chuyển động, không thì 1.

- [ ] **Step 1: Viết test đỏ** `tests/paintings/den-keo-quan/keo-quan-quay.test.js`.

```js
// tests/paintings/den-keo-quan/keo-quan-quay.test.js — trống quay tính thẳng từ thời gian: giữ, thả, gạt, đổi tốc độ; không có trạng thái theo khung.
import { describe, it, expect } from 'vitest';
import { SPIN, createSpin, flickOf, rpmToOmega } from '../../../src/paintings/den-keo-quan/parts/keo-quan-quay.js';
import { mulberry32 } from '../../../src/lib/random.js';

const W = rpmToOmega(6);

describe('keo-quan-quay', () => {
  it('không có sự kiện: quay đều ở tốc độ thường', () => {
    const s = createSpin({ omega: W });
    expect(s.speed(10)).toBeCloseTo(W, 12);
    expect(s.angle(10)).toBeCloseTo(W * 10, 12);
  });

  it('giữ: tốc độ về gần 0 trong ≤ 1 s, rồi góc gần như đứng yên', () => {
    const s = createSpin({ omega: W });
    s.grip(2);
    expect(Math.abs(s.speed(3))).toBeLessThan(W * 0.02);
    expect(s.angle(5) - s.angle(3)).toBeLessThan(0.01);
  });

  it('thả: quay lại, dần về tốc độ thường (sau 5τ còn lệch < 1%)', () => {
    const s = createSpin({ omega: W });
    s.grip(1);
    s.release(3);
    expect(s.speed(3)).toBeLessThan(W * 0.05);
    expect(s.speed(3 + 5 * SPIN.tauFree)).toBeCloseTo(W, 2);
  });

  it('gạt: cộng tốc độ theo chiều vuốt, tắt dần về tốc độ thường; có trần; vuốt ngược hãm được', () => {
    const s = createSpin({ omega: W });
    s.flick(1, flickOf({ x: 1500, y: 0 }));
    expect(s.speed(1)).toBeGreaterThan(W + 1);
    expect(s.speed(1 + 6 * SPIN.tauFree)).toBeCloseTo(W, 2);
    s.flick(20, 1e6);
    expect(s.speed(20)).toBeLessThanOrEqual(SPIN.maxOmega);
    const r = createSpin({ omega: W });
    r.flick(1, flickOf({ x: -4000, y: 0 }));
    expect(r.speed(1)).toBeLessThan(0);
  });

  it('θ và ω liên tục tại mỗi sự kiện (không nhảy)', () => {
    const s = createSpin({ omega: W });
    for (const [t, act] of [[1, 'grip'], [2.5, 'release'], [4, 'base']]) {
      const before = { a: s.angle(t), w: s.speed(t) };
      if (act === 'base') s.setBase(t, rpmToOmega(12)); else s[act](t);
      expect(s.angle(t)).toBeCloseTo(before.a, 12);
      expect(s.speed(t)).toBeCloseTo(before.w, 12);
    }
  });

  it('angle(t) không có trạng thái theo khung: gọi nhiều lần, theo thứ tự bất kỳ, ra cùng số', () => {
    const s = createSpin({ omega: W });
    s.flick(1, 2);
    const once = s.angle(7.3);
    s.angle(2);
    s.angle(9);
    expect(s.angle(7.3)).toBe(once);
  });

  it('bão cử chỉ (Review Focus 1): 300 sự kiện có hạt giống, góc và tốc độ luôn hữu hạn, |ω| ≤ trần', () => {
    const rng = mulberry32(6);
    const s = createSpin({ omega: W });
    let t = 0;
    for (let i = 0; i < 300; i += 1) {
      t += rng() * 0.2;
      const pick = rng();
      if (pick < 0.3) s.grip(t);
      else if (pick < 0.6) s.release(t);
      else s.flick(t, flickOf({ x: (rng() - 0.5) * 20000, y: 0 }));
      expect(Number.isFinite(s.angle(t)) && Number.isFinite(s.speed(t))).toBe(true);
      expect(Math.abs(s.speed(t))).toBeLessThanOrEqual(SPIN.maxOmega + 1e-9);
    }
  });
});
```

- [ ] **Step 2: Viết test đỏ** `tests/paintings/den-keo-quan/ngon-nen-thoi.test.js`.

```js
// tests/paintings/den-keo-quan/ngon-nen-thoi.test.js — ngọn lửa: thổi thì ngả theo hướng thổi rồi đứng lại trong ~2 s; bốn lần thổi chồng; nhấp nháy tất định.
import { describe, it, expect } from 'vitest';
import { FLAME, createFlame } from '../../../src/paintings/den-keo-quan/parts/ngon-nen-thoi.js';

describe('ngon-nen-thoi', () => {
  it('chưa thổi: chỉ nhấp nháy vài mm, sáng quanh 1; tất định', () => {
    const f = createFlame();
    const a = f.at(3.21);
    expect(Math.hypot(...a.offset)).toBeLessThan(0.005);
    expect(a.glow).toBeGreaterThan(0.85);
    expect(createFlame().at(3.21)).toEqual(a);
    expect(a.lean).toBe(0);
  });

  it('thổi: lửa ngả theo hướng thổi (cỡ 1 cm), tối đi, rồi đứng lại (sau 3 s còn < 0,5 mm)', () => {
    const f = createFlame();
    f.blow(1, [0, -1]);
    const peak = Math.max(...[1.1, 1.2, 1.3].map((t) => f.at(t).lean));
    expect(peak).toBeGreaterThan(0.006);
    expect(f.at(1.15).offset[2]).toBeLessThan(0); // ngả về −z, đúng hướng thổi
    expect(f.at(1.2).glow).toBeLessThan(0.9);
    expect(f.at(4).lean).toBeLessThan(0.0005);
  });

  it('lửa không giật: ngay lúc thổi chưa ngả (bắt đầu từ 0)', () => {
    const f = createFlame();
    f.blow(1, [1, 0]);
    expect(f.at(1).lean).toBeLessThan(1e-6);
  });

  it('tối đa FLAME.blows lần thổi cùng lúc: lần thứ năm đẩy lần đầu ra; độ ngả có trần', () => {
    const f = createFlame();
    for (let i = 0; i < 10; i += 1) f.blow(1 + i * 0.01, [1, 0]);
    expect(f.at(1.2).lean).toBeLessThanOrEqual(FLAME.blows * FLAME.lean + 1e-9);
    expect(f.at(1.2).glow).toBeGreaterThanOrEqual(FLAME.minGlow);
  });

  it('giảm chuyển động: ngả và nhấp nháy ít hơn', () => {
    const [a, b] = [createFlame(), createFlame({ reduced: true })];
    a.blow(1, [1, 0]);
    b.blow(1, [1, 0]);
    expect(b.at(1.2).lean).toBeLessThan(a.at(1.2).lean);
  });

  it('flicker = 0 ("Tắt nhấp nháy"): đứng yên khi không thổi', () => {
    const f = createFlame();
    f.flicker = 0;
    expect(f.at(5)).toEqual({ offset: [0, 0, 0], glow: 1, lean: 0 });
  });
});
```

- [ ] **Step 3: Chạy hai test, thấy đỏ.**

- [ ] **Step 4: `parts/keo-quan-quay.js`.**

```js
// paintings/den-keo-quan/parts/keo-quan-quay.js — của lớp Kéo quân, hàm thuần: góc của trống tính thẳng từ thời gian (giữ, thả, gạt), không cộng dồn theo khung.

/**
 * tauFree: hằng số thời gian khi thả (ma sát, khí nóng kéo trống về tốc độ thường). tauGrip: khi tay giữ, trống dừng nhanh.
 * maxOmega: trần tốc độ (rad/s, ≈ 57 vòng/phút). perPx: một px/s vận tốc vuốt cộng bao nhiêu rad/s. maxFlick: trần của một cú gạt.
 */
export const SPIN = Object.freeze({ tauFree: 2.5, tauGrip: 0.25, maxOmega: 6, perPx: 0.002, maxFlick: 4 });

export const rpmToOmega = (rpm) => (rpm * 2 * Math.PI) / 60;

/** Một cú vuốt → lượng tốc độ cộng vào (rad/s): theo chiều ngang của vuốt (px/s), có trần. Vuốt sang phải: mặt trước trống chạy sang phải. */
export function flickOf(velocity) {
  const vx = velocity?.x ?? 0;
  return Math.sign(vx) * Math.min(Math.abs(vx) * SPIN.perPx, SPIN.maxFlick);
}

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/**
 * Trống quay: ω đi dần về ω* với hằng số thời gian τ. Đang giữ thì ω* = 0, τ = tauGrip; không thì ω* = tốc độ thường, τ = tauFree.
 * Giữa hai sự kiện có dạng đóng (Δ = t − t₀):
 *   ω(t) = ω* + (ω₀ − ω*)·e^(−Δ/τ)
 *   θ(t) = θ₀ + ω*·Δ + (ω₀ − ω*)·τ·(1 − e^(−Δ/τ))
 * Sự kiện nào cũng CHỐT trạng thái (t₀, θ₀, ω₀) ở lúc đó rồi mới đổi ω*, τ hay ω, nên θ và ω liên tục. angle(t) chỉ đọc trạng
 * thái đã chốt: gọi bao nhiêu lần cũng ra một số, và update(0, t) lúc ?freeze vẽ lại đúng khung N (CLAUDE.md, chuyển động).
 * @param {{ omega: number }} p  tốc độ thường lúc đầu (rad/s)
 */
export function createSpin({ omega }) {
  let base = omega;
  let gripped = false;
  let pinned = { t: 0, theta: 0, omega };
  const at = (t) => {
    const dt = Math.max(0, t - pinned.t);
    const target = gripped ? 0 : base;
    const tau = gripped ? SPIN.tauGrip : SPIN.tauFree;
    const e = Math.exp(-dt / tau);
    return { theta: pinned.theta + target * dt + (pinned.omega - target) * tau * (1 - e), omega: target + (pinned.omega - target) * e };
  };
  const pin = (t) => {
    const s = at(t);
    pinned = { t: Math.max(t, pinned.t), theta: s.theta, omega: s.omega };
  };
  return {
    angle: (t) => at(t).theta,
    speed: (t) => at(t).omega,
    grip(t) { pin(t); gripped = true; },
    release(t) { pin(t); gripped = false; },
    flick(t, dOmega) {
      pin(t);
      if (!gripped) pinned.omega = clamp(pinned.omega + dOmega, -SPIN.maxOmega, SPIN.maxOmega);
    },
    setBase(t, value) { pin(t); base = clamp(value, -SPIN.maxOmega, SPIN.maxOmega); },
  };
}
```

- [ ] **Step 5: `parts/ngon-nen-thoi.js`.**

```js
// paintings/den-keo-quan/parts/ngon-nen-thoi.js — của lớp Ngọn nến, hàm thuần: ngọn lửa nhấp nháy và bị thổi, tính thẳng từ thời gian (vị trí lệch, độ sáng).

/**
 * blows: số lần thổi nhớ cùng lúc. lean: độ ngả lớn nhất của một lần thổi (m). rise, tau, wobble: lửa ngả lên trong ~0,1 s, tắt dần
 * với hằng số tau, dao động wobble rad/s. dim, dimTau: một lần thổi làm tối đi bao nhiêu và trong bao lâu. minGlow: không tối hơn mức này.
 * waves: ba sóng nhấp nháy [tần số Hz, biên độ dời (m), biên độ sáng]; tần số không chia hết cho nhau nên không lặp lại sớm.
 */
export const FLAME = Object.freeze({
  blows: 4, lean: 0.012, rise: 0.06, tau: 0.7, wobble: 9, dim: 0.35, dimTau: 0.6, minGlow: 0.4,
  waves: Object.freeze([[1.7, 0.0012, 0.03], [2.9, 0.0008, 0.02], [5.3, 0.0005, 0.01]]),
});

/** @param {{ reduced?: boolean }} [p]  reduced: người xem xin giảm chuyển động (ngả và nhấp nháy ít hơn) */
export function createFlame({ reduced = false } = {}) {
  const ring = []; // { t, dir: [x, z], amp }
  const scale = reduced ? 0.4 : 1;
  const flame = {
    /** Hệ số nhấp nháy (núm flicker; 0 = "Tắt nhấp nháy"). */
    flicker: 1,
    /** Thổi lúc t theo hướng dir (vec2 đơn vị trên mặt sàn). */
    blow(t, dir) {
      ring.push({ t, dir, amp: scale });
      if (ring.length > FLAME.blows) ring.shift();
    },
    /** Trạng thái lửa lúc t: offset (m) so với chỗ đứng yên, glow (hệ số sáng), lean (độ ngả do thổi, m). */
    at(t) {
      let [x, z, dim] = [0, 0, 0];
      for (const b of ring) {
        const s = t - b.t;
        if (s < 0) continue;
        // ngả lên êm (không giật), rồi tắt dần và dao động
        const g = (1 - Math.exp(-s / FLAME.rise)) * Math.exp(-s / FLAME.tau) * Math.cos(FLAME.wobble * s);
        x += b.amp * b.dir[0] * FLAME.lean * g;
        z += b.amp * b.dir[1] * FLAME.lean * g;
        dim += b.amp * FLAME.dim * Math.exp(-s / FLAME.dimTau);
      }
      const lean = Math.hypot(x, z);
      const k = flame.flicker * scale;
      let [fx, fz, fg] = [0, 0, 0];
      FLAME.waves.forEach(([hz, move, light], i) => {
        const ph = 2 * Math.PI * hz * t;
        fx += move * Math.sin(ph + i);
        fz += move * Math.cos(ph * 1.3 + 2 * i);
        fg += light * Math.sin(ph * 0.9 + 3 * i);
      });
      const glow = Math.max(FLAME.minGlow, 1 - dim + fg * k);
      return { offset: [x + fx * k, 0, z + fz * k], glow: k === 0 && dim === 0 ? 1 : glow, lean };
    },
  };
  return flame;
}
```

  Trường hợp `flicker = 0` mà chưa thổi: kết quả là đúng `{ offset: [0, 0, 0], glow: 1, lean: 0 }`. Nếu số `-0` làm `toEqual` hỏng thì chuẩn
  hóa bằng `+ 0`.

- [ ] **Step 6: Viết test đỏ** `tests/paintings/den-keo-quan/cu-chi.test.js`.

```js
// tests/paintings/den-keo-quan/cu-chi.test.js — ba cử chỉ của Bức 2 đi qua setup().onGesture: chạm thổi nến, giữ dừng trống, vuốt gạt trống; chạm hai lần không làm gì thêm.
import { describe, it, expect } from 'vitest';
import meta from '../../../src/paintings/den-keo-quan/meta.js';
import * as painting from '../../../src/paintings/den-keo-quan/painting.js';
import { buildPainting } from '../../helpers/fake-ctx.js';

const build = (options) => buildPainting(painting, meta, options);
const at = (ctx, t) => { ctx.u.time.value = t; };

describe('cử chỉ của Bức 2', () => {
  it('chạm: lửa ngả theo hướng nhìn của camera (chiếu xuống sàn)', () => {
    const { ctx, setup, shared } = build();
    ctx.camera.position.set(0, 1.45, 2.1);
    ctx.camera.lookAt(0, 1.55, -0.6);
    at(ctx, 1);
    setup.onGesture({ kind: 'tap', ndc: { x: 0, y: 0 } });
    expect(shared.flame.at(1.15).offset[2]).toBeLessThan(0); // camera nhìn về −z: lửa ngả ra xa người xem
  });

  it('giữ rồi thả: trống dừng rồi quay lại; số đo rpm đi theo', () => {
    const { ctx, setup, layers, shared } = build();
    const rpm = () => layers['keo-quan'].readouts.find((r) => r.id === 'rpm').get();
    at(ctx, 2);
    setup.onGesture({ kind: 'hold-start', ndc: { x: 0, y: 0 } });
    at(ctx, 3);
    expect(rpm()).toBeLessThan(0.3);
    setup.onGesture({ kind: 'hold-end', ndc: { x: 0, y: 0 } });
    at(ctx, 20);
    expect(rpm()).toBeCloseTo(6, 0);
    expect(shared.spin.speed(20)).toBeGreaterThan(0);
  });

  it('vuốt: trống quay nhanh hơn tốc độ thường', () => {
    const { ctx, setup, layers } = build();
    at(ctx, 1);
    setup.onGesture({ kind: 'swipe', ndc: { x: 0, y: 0 }, velocity: { x: 1500, y: 0 } });
    expect(layers['keo-quan'].readouts.find((r) => r.id === 'rpm').get()).toBeGreaterThan(10);
  });

  it('chạm hai lần: không làm gì thêm ngoài hai lần chạm đã tới trước nó', () => {
    const { ctx, setup, shared } = build();
    at(ctx, 1);
    const before = JSON.stringify(shared.flame.at(1.5));
    setup.onGesture({ kind: 'double-tap', ndc: { x: 0, y: 0 } });
    expect(JSON.stringify(shared.flame.at(1.5))).toBe(before);
  });

  it('giảm chuyển động: trống quay chậm còn một nửa', () => {
    const fast = build();
    const slow = build({ reducedMotion: true });
    expect(slow.shared.spin.speed(5)).toBeCloseTo(fast.shared.spin.speed(5) / 2, 9);
  });

  it('?freeze: update(0, t) vẽ lại đúng góc (Review Focus 5): cùng chuỗi cử chỉ thì cùng góc', () => {
    const run = () => {
      const { ctx, setup, shared } = build();
      at(ctx, 1);
      setup.onGesture({ kind: 'swipe', ndc: { x: 0, y: 0 }, velocity: { x: 900, y: 0 } });
      at(ctx, 2);
      setup.onGesture({ kind: 'hold-start', ndc: { x: 0, y: 0 } });
      setup.update(0, 4);
      return shared.theta.value;
    };
    expect(run()).toBe(run());
  });
});
```

- [ ] **Step 7: Viết `shared.js`.** Thay phần tạm của Task 1.

```js
// paintings/den-keo-quan/shared.js — setup() của Bức 2: trống quay và ngọn lửa (hàm thuần, tính thẳng từ thời gian), và ba cử chỉ: chạm thổi nến, giữ dừng trống, vuốt gạt trống.
import { Vector3 } from 'three/webgpu';
import { uniform } from 'three/tsl';
import { createSpin, flickOf, rpmToOmega } from './parts/keo-quan-quay.js';
import { createFlame } from './parts/ngon-nen-thoi.js';

/** Tốc độ thường của trống lúc dựng (vòng/phút); lớp Kéo quân đặt lại theo núm speed ngay khi dựng. */
const BASE_RPM = 6;

/**
 * @param {import('../../engine/contracts/runtime.js').EngineCtx} ctx
 * @returns {import('../../engine/contracts/runtime.js').PaintingSetup}
 */
export function setup(ctx) {
  const slow = ctx.reducedMotion ? 0.5 : 1; // §18.2: giảm chuyển động thì trống quay chậm còn một nửa
  const spin = createSpin({ omega: rpmToOmega(BASE_RPM) * slow });
  const flame = createFlame({ reduced: ctx.reducedMotion });
  const theta = uniform(0).setName('drumAngle');
  const forward = new Vector3();
  return {
    shared: { spin, flame, theta, slow },
    // Chạm ở đâu cũng được: cả căn phòng là của ngọn đèn. Thời điểm là đồng hồ của cảnh (tất định với ?freeze).
    onGesture(g) {
      const t = ctx.u.time.value;
      if (g.kind === 'tap') {
        ctx.camera.getWorldDirection(forward); // thổi theo hướng nhìn, chiếu xuống mặt sàn
        const len = Math.hypot(forward.x, forward.z) || 1;
        flame.blow(t, [forward.x / len, forward.z / len]);
      } else if (g.kind === 'hold-start') {
        spin.grip(t);
      } else if (g.kind === 'hold-end') {
        spin.release(t);
      } else if (g.kind === 'swipe') {
        spin.flick(t, flickOf(g.velocity) * slow);
      }
    },
    // Mỗi khung, TRƯỚC các lớp; cả update(0, t) lúc ?freeze vẽ lại.
    update(dt, t) {
      theta.value = spin.angle(t);
    },
  };
}
```

  Các lớp nối vào:
  - Kéo quân:
    - lúc dựng gọi `shared.spin.setBase(0, rpmToOmega(ctx.knobValue('speed')) * shared.slow)`;
    - `onKnob.speed: (v) => shared.spin.setBase(ctx.u.time.value, rpmToOmega(v) * shared.slow)`; marker `// @knob speed` ở dòng đó;
    - số đo `rpm` = `Math.round(shared.spin.speed(ctx.u.time.value) * 600 / (2 * Math.PI)) / 10`.

    `parts/keo-quan-quay.js` là part của chính lớp Kéo quân, nên lớp import thẳng `rpmToOmega` được.
  - Ngọn nến: số đo `lean` = `Math.round(shared.flame.at(ctx.u.time.value).lean * 1000)`, đơn vị `mm`.
  - Content: nhãn `rpm` 'Vòng mỗi phút', `lean` 'Lửa lệch'.

  `files`:
  - `parts/keo-quan-quay.js` thuộc lớp Kéo quân (lớp import `rpmToOmega`).
  - `parts/ngon-nen-thoi.js` thuộc lớp Ngọn nến. Lớp không import nó (nó đọc `shared.flame`), nhưng vẫn kê để Sổ tay hiện code của ngọn
    lửa. Kê thừa thì được; test hợp đồng chỉ bắt kê thiếu và một file thuộc hai lớp.
  - `shared.js` import cả hai part này. Đó là việc của cả bức, không thuộc lớp nào (như `anh-trang-drift.js` của Bức 1).

- [ ] **Step 8: Xanh:** `npx vitest run tests/paintings/den-keo-quan`, rồi `npm test`.

- [ ] **Step 9: E2E cử chỉ.**
  - Thêm `swipeAt(page, fx, fy, { dx = 160, ms = 60, pointerType = 'mouse' })` vào `e2e/helpers.js`, theo đúng mẫu `doubleTapAt`. Sự
    kiện phát ngay trong trang: `pointerdown`, rồi hai `pointermove` cách nhau `ms / 2`, rồi `pointerup`, `pointerId` 1. Ghi chú vì sao
    như vậy: mỗi sự kiện chuột của Playwright đợi một khung (Phụ lục A.51), nên trên SwiftShader một cú vuốt dễ quá 300 ms và thành kéo.
  - Thêm vào `den-keo-quan.spec.js` một `describe` "Đèn Kéo Quân · cử chỉ" (không `?freeze`, đồng hồ chạy thật). Mọi lần chờ dùng
    `waitForFunction` trên số đo, không chờ cứng theo giây: trên SwiftShader, đồng hồ của cảnh có thể chậm hơn đồng hồ tường.
    - chạm giữa khung: `lean` > 2 trong 10 s, rồi < 0,5 trong 30 s;
    - giữ chuột (`mouse.down` ở giữa): `rpm` < 0,3 trong 15 s; thả: `rpm` > 3 trong 30 s;
    - `swipeAt(page, 0.5, 0.6, { dx: 220 })`: `rpm` > 9 trong 10 s;
    - không lỗi console.

- [ ] **Step 10: Commit:** `feat(den-keo-quan): trống quay và ngọn lửa tính thẳng từ thời gian; chạm thổi nến, giữ dừng trống, vuốt gạt trống`.

---

### Task 6: Tám hình nhân, bố cục, camera → ĐIỂM DUYỆT ẢNH (DỪNG)

**Mục tiêu:**
- Đủ tám hình nhân của §18.3, đúng dáng cắt giấy.
- Chiều đi của đoàn quân trên vách sau đúng với chiều quay.
- Chốt bố cục và camera cho đẹp ở 1280×800 và 390×844.
- Thêm tua ở sáu góc đèn.
- Rồi **DỪNG**: gửi Bao trang ảnh, chờ Bao duyệt.

**Files:**
- Modify: `parts/cot-hinh-nhan.js` (đủ 8 hình, `FACING`), `parts/cot-den.js` (tua), `painting.js` (camera), `parts/cot-phong.js` (nếu chỉnh
  gian nhà), `e2e/den-keo-quan.spec.js` (chốt `WALL`, `CEILING`, `FLOOR`, `FLOOR_FAR`), `content.vi.js` (nhãn `tua`)
- Test: `cot-hinh-nhan.test.js`

**Interfaces:**
- Produces: `FIGURES` đủ 8 id theo thứ tự: `cuoi-ngua`, `linh-co`, `voi`, `danh-trong`, `linh-giao`, `ngua`, `cam-long`, `thoi-tu-va`;
  `FACING` (1 hoặc −1); vật `tua` (InstancedMesh) của Cốt.

- [ ] **Step 1: Thêm test** vào `cot-hinh-nhan.test.js`.

```js
it('đủ tám hình theo thứ tự của spec §18.3', () => {
  expect(FIGURES.map((f) => f.id)).toEqual(['cuoi-ngua', 'linh-co', 'voi', 'danh-trong', 'linh-giao', 'ngua', 'cam-long', 'thoi-tu-va']);
});

it('6 tới 10 hình (núm figures): tổng bề rộng không quá chu vi dải', () => {
  for (const count of [6, 8, 10]) {
    const total = Array.from({ length: count }, (_, k) => FIGURES[k % FIGURES.length].width).reduce((s, v) => s + v, 0);
    expect(total, `${count} hình`).toBeLessThanOrEqual(ASPECT);
  }
});

it('chân của mọi hình chạm vạch đất (có hình cơ bản xuống tới mép trên của vạch)', () => {
  for (const fig of FIGURES) {
    const lowest = Math.min(...fig.shapes.map((s) => bounds(s).y0));
    expect(lowest, fig.id).toBeLessThanOrEqual(MARGIN + GROUND + 0.01);
  }
});
```

- [ ] **Step 2: Vẽ tám hình** trong `FIGURES`, theo mẫu hai hình của Task 3:
  - **voi:** mình elip lớn, bốn chân viên thuốc, vòi là chuỗi viên thuốc cong, ngà; bành trên lưng là đa giác; người quản tượng.
  - **danh-trong:** người với trống tròn đeo trước ngực, hai dùi.
  - **linh-giao:** người với ngọn giáo dài, mũi giáo tam giác.
  - **ngua:** ngựa phi không người, đuôi bay.
  - **cam-long:** người với cán lọng; tán lọng là đa giác cong.
  - **thoi-tu-va:** người với tù và cong (chuỗi viên thuốc thu nhỏ dần).

  Bề rộng từng hình sao cho 10 hình vừa chu vi (gợi ý: voi 0,55, ngựa 0,45, người 0,26–0,3). Dáng đi, tay, cờ so le nhau.
  - **Chiều đi:**
    1. Chụp hai khung cách nhau 30.
    2. Nếu bóng trên vách sau chạy ngược chiều mặt hình, đặt `FACING = -1`: `rasterize` nhân x của mọi hình cơ bản với `FACING`.
    3. Ghi lý do vào chú thích. Mặt sau của trống chạy ngược chiều mặt trước, và bóng trên vách sau là của mặt sau.

- [ ] **Step 3: Bố cục.**
  - Tua: InstancedMesh viên thuốc nhỏ (`tua`) treo ở sáu góc đáy đèn, màu đất sét. `castShadow` bật: dưới đèn có bóng tua.
  - Chốt camera ở `painting.js` để đèn ở khoảng giữa, hơi trên tâm khung, vách sau chiếm phần lớn khung; ở 390×844 vẫn thấy đèn và
    một đoạn đoàn quân.
  - Có thể chỉnh `LANTERN` (độ cao nến, cỡ đế) nếu vùng tối dưới đèn quá lớn (§18.10). Đổi số thì sửa §18.1 của spec trong commit này.

- [ ] **Step 4: Chốt vùng đo của e2e** theo bố cục mới: `WALL` (vách sau, có đoàn quân), `CEILING`, `FLOOR`, `FLOOR_FAR`. Chạy lại
  `e2e/den-keo-quan.spec.js` trên webgl2-swiftshader và GPU thật.

- [ ] **Step 5: Xanh** (`npm test`), rồi commit: `feat(den-keo-quan): tám hình nhân của đoàn quân rước cờ, tua đèn, bố cục và camera`.

- [ ] **Step 6: ĐIỂM DUYỆT ẢNH. DỪNG.**
  1. Chụp trên GPU thật bằng headless Playwright (`channel: 'chromium'`, không mở cửa sổ lên màn hình của Bao):
     - 1280×800 và 390×844 (`devices['Pixel 7']`), `?at=2026-09-28T21:00&freeze=N` với ba N cách nhau 20 khung (thấy đoàn quân chạy);
     - một ảnh khi Kéo quân bằng 0 (so);
     - dải mặt nạ phẳng: vẽ `rasterize(FIGURES, 2048)` ra PNG bằng canvas ngay trong trang.
  2. Dựng một trang ảnh riêng tư (Artifact, như trang ảnh của GĐ 5), có:
     - các ảnh;
     - ba câu hỏi cho Bao: hình nhân có ổn không, bố cục và camera có ổn không, chỗ tối dưới đèn có nặng quá không;
     - ghi chú: chưa có màu giấy và chất liệu gian nhà (Task 8–9).
  3. Gửi Bao link và **chờ**.
     - Bao sửa gì thì sửa trong `FIGURES`, camera hay `LANTERN`, chụp lại, gửi lại.
     - Bao "ok" thì mới sang Task 7.

---

### Task 7: Lớp Ngọn nến đầy đủ: ngọn lửa, cỡ lửa, nhấp nháy, sắc nến, ánh đêm

**Mục tiêu:**
- Lớp Ngọn nến làm đúng §18.4:
  - mesh ngọn lửa (chỉ thấy khi giấy trong suốt hay qua công cụ học);
  - núm `flameSize` (thay uniform tạm), `flicker`, `warmth`;
  - thí nghiệm `steady`;
  - đèn xưởng lui về ánh đêm chàm/cánh gián.
- Tên vật `ngon-lua`.

**Files:**
- Create: `parts/ngon-nen-lua.js`
- Modify: `layers/l2-ngon-nen.js`, `meta.js` (`files`), `content.vi.js`
- Test: `tests/paintings/den-keo-quan/ngon-nen.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Consumes: `shared.flame` (Task 5), `shared.cot.lantern`.
- Produces:
  - `shared.ngonNen.size` = `ctx.knob('flameSize')` (uniform của xưởng, tên `ngon_nen_flameSize`);
  - `shared.ngonNen.color` (uniform `candleColor`, Color);
  - `createFlameMesh(ctx, { w, color, lean, glow, rest }) → { mesh, dispose }`.

- [ ] **Step 1: Viết test đỏ** `ngon-nen.test.js`:
  - núm `['intensity', 'js'], ['flameSize', 'uniform'], ['flicker', 'js'], ['warmth', 'js']`;
  - `objects` có `ngon-lua`, `AdditiveBlending`, `depthWrite` false, `renderOrder` nhỏ hơn của giấy;
  - `steady` bật thì `shared.flame.flicker` = 0, tắt thì về giá trị núm;
  - Ngọn nến bằng 0 thì `light.intensity` 0 và `power` 0;
  - đèn xưởng ở trọng số 1 còn `NIGHT` × cường độ, màu ngả chàm (`hemi.color` gần `cham`);
  - `shared.ngonNen.size` chính là uniform của núm `flameSize`: test bằng `nodesOf` của node bóng, có uniform tên `ngon_nen_flameSize`;
  - mesh lửa dịch được trên cả hai backend (`compileMaterial`), không lỗi.

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `parts/ngon-nen-lua.js`.**
  - `LatheGeometry` hình giọt nước (12–16 điểm profile, cao chừng 0,04, rộng 0,012), đặt ở `rest`.
  - `MeshBasicNodeMaterial`, `AdditiveBlending`, `depthWrite = false`, `transparent = true`, `fog = false`.
  - `colorNode` và `emissiveNode` theo độ cao chuẩn hóa `h = positionLocal.y / cao`:
    - chân xanh lam (`cham` sáng) ở `h < 0,15`;
    - lõi `vangLaSang` × 4 (bloom);
    - rìa `lua` theo `1 − |N·V|` (fresnel).

    Tất cả nhân `w` và `glow` (uniform). Viết bằng `mix`/`smoothstep` (a < b).
  - `positionNode`: uốn lửa theo `lean` (uniform vec2) × `h²`, kéo dài theo `glow`.
  - `renderOrder = -1`: lửa vẽ trước giấy (§18.4 Lớp Giấy).

- [ ] **Step 4: Nối vào `l2-ngon-nen.js`.**
  - Núm `flameSize` (uniform, 0–0,04, step 0,001, value 0,01): `shared.ngonNen.size = ctx.knob('flameSize')`, có marker `// @knob
    flameSize`. Bỏ uniform `flameSize` tạm của Task 1.
  - `flicker` (js 0–2, value 1) → `shared.flame.flicker = v`.
  - `warmth` (js 0–1, value 0,5) → màu đèn: `lerpColors(lua, vangLaSang, warmth)`, ghi vào `light.color` và vào uniform `color`
    (`candleColor`) mà lửa và lớp Giấy đọc.
  - Thí nghiệm `steady`.
  - `update`:
    - lửa nhận `lean` và `glow` từ `shared.flame.at(t)`;
    - đèn xưởng: `hemi.color.lerpColors(STUDIO.sky, cham, k)`, `hemi.groundColor.lerpColors(STUDIO.ground, canhGian, k)`, cường độ như
      Task 1.

    Chỉ đổi thuộc tính JS của đèn, không đụng cache key.

- [ ] **Step 5: Xanh** (`npm test`). E2E:
  - "Ánh sáng không suy giảm" làm góc xa (vùng sàn gần vách bên) sáng hơn rõ (`mean` tăng);
  - "Tắt nhấp nháy" làm hai khung `?freeze` liền nhau giống hệt ở vùng vách.

  Chạy webgl2-swiftshader và GPU thật.

- [ ] **Step 6: Sửa spec §18.4 (Lớp 2) trong commit này.** Spec ghi `flicker` và `warmth` là núm `uniform`, nhưng ở đây chúng là
  `js`: nhấp nháy và màu đi qua đèn thật (thuộc tính JS của `PointLight`) và qua `createFlame` trên CPU, còn shader của lửa và giấy chỉ
  đọc kết quả qua uniform. Ghi lại lý do một câu.

- [ ] **Step 7: Commit:** `feat(den-keo-quan): lớp Ngọn nến đủ (ngọn lửa tự phát sáng, cỡ lửa là cỡ nguồn sáng, nhấp nháy, sắc nến, ánh đêm)`.

---

### Task 8: Lớp Gian nhà: texture thủ tục (gạch bát, vôi, gỗ, sơn son)

**Mục tiêu:** Lớp 3 của §18.4:
- sàn gạch bát có mạch vữa;
- vách vôi loang;
- trần, xà, khung tre có vân;
- hai cột sơn son có clearcoat.

Đi kèm: năm núm, hai thí nghiệm, nấc `chi-tiet`, số đo `octaves`. Lớp không thêm vật nào.

**Files:**
- Create: `layers/l3-gian-nha.js`, `parts/gian-nha-vat-lieu.js`
- Modify: `meta.js` (thêm lớp `gian-nha` giữa `ngon-nen` và `keo-quan`), `painting.js`, `quality.js` (khóa `octaves`: 3 / 2 / 1;
  ladder thêm `'gian-nha.chi-tiet'` sau `'dpr'`), `content.vi.js`
- Test: `tests/paintings/den-keo-quan/gian-nha.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Consumes: `shared.cot.materials = { san, vach, tran, go, cot, tre }` (Task 1; `go` gồm xà và ván trần, `tre` là khung đèn).
- Produces: `paintRoom(ctx, materials, { w, u }) → { flat, raw }` (uniform của hai thí nghiệm).

- [ ] **Step 1: Viết test đỏ** `gian-nha.test.js`:
  - mọi trọng số khác 0 thì `colorNode` của sàn có uniform `w_gian_nha` (`nodesOf`);
  - nấc `chi-tiet` ở mức cao hạ trần octave về 1 rồi trả lại (theo kiểu của test hợp đồng);
  - mức thấp (`budget.octaves` = 1) KHÔNG có nấc `chi-tiet`;
  - núm `octaves` có `max` theo mức: cao 5, thấp 3;
  - `flat`, `rawTiles` bật/tắt chỉ đổi uniform: material không bị `needsUpdate`;
  - vách, sàn, cột dịch được trên cả hai backend (`compileMaterial`, có `shadows: true`), không lỗi.

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `parts/gian-nha-vat-lieu.js`.** Hàm TSL dùng `lib/tsl/noise.js`: `fbm(p, { octaves })`, số octave là node như sương của
  Bức 1.
  - **Gạch bát** (sàn): ô `q = positionWorld.xz / tileSize`.
    - Chỉ số viên `id = floor(q)`; trong viên `f = fract(q)`.
    - Mạch: `m = smoothstep(0, 0.04, min(f.x, f.y, 1 − f.x, 1 − f.y))`, viết `min` hai lần.
    - Màu viên: `mix(doSon × 0,55, canhGian, hash(id))`, mòn theo `fbm(q × 3)`.
    - Mạch màu `datSet` tối.
    - `roughness` 0,75 ± 0,15 theo `hash`.
  - **Vôi** (vách): `mix(nga × 0,85, bacLa, fbm(p × 1,5) × stain)`, chân vách thẫm dần theo `smoothstep(0, 0.6, y)`; `roughness` 0,9.
  - **Gỗ** (ván trần, xà, khung tre): vân bằng `sin((p.x + fbm(p × 2) × grain) × 40)`, màu `canhGian` ↔ `canhGian` sáng hơn. Tre:
    `vangLa` × 0,6, có đốt theo `fract(y × 6)`.
  - **Sơn son** (cột): `doSon`, `clearcoatNode = clearcoat × w`, `clearcoatRoughness` 0,15.
  - Mọi màu là `mix(datSet, màu, w)`.
  - `flat`: `mix(màu, vec3(0.45), flat)`.
  - `rawTiles`: sàn hiện `hash(id)` và mạch bằng màu giả. Màu giả vẫn lấy trong bảng: `vangLa` cho mạch, `cham`/`xanhLuc` theo `hash`.
- [ ] **Step 4: Nối lớp.**
  - Núm: `tileSize` (0,2–0,6, value 0,3), `stain` (0–1, 0,5), `grain` (0–1, 0,6), `clearcoat` (0–1, 0,8), `octaves` (1–5, step 1;
    `value: (env) => env.budget.octaves`; `max: (env) => (env.level === 'thap' ? 3 : 5)`).
  - Nấc `chi-tiet`: trần octave 1, hiệu lực = min(núm, trần). Chỉ đưa ra khi `budget.octaves > 1`.
  - Số đo `octaves`.
  - Content: chữ ngắn thật; nhãn cho núm, thí nghiệm, số đo.

- [ ] **Step 5: Xanh** (`npm test`). E2E: sàn ở vùng `FLOOR_FAR` có sắc độ (`chroma`) lớn hơn khi Gian nhà = 1 so với 0. Chạy hai
  backend.

- [ ] **Step 6: Commit:** `feat(den-keo-quan): lớp Gian nhà (texture thủ tục: gạch bát, vôi loang, vân gỗ, sơn son có clearcoat)`.

---

### Task 9: Lớp Giấy: ánh sáng xuyên giấy, lọc màu ra phòng, sợi giấy, giấy trong suốt

**Mục tiêu:** Lớp 4 của §18.4:
- sáu tấm giấy dó nhuộm sáng lên từ bên trong, có bóng hình nhân trên giấy (Kéo quân nhân vào);
- ánh sáng ra phòng mang màu tấm giấy nó đi qua;
- sợi giấy;
- thí nghiệm "Giấy trong suốt" và "Tắt sợi giấy";
- nấc `soi`, số đo `transmit`.

**Files:**
- Create: `layers/l4-giay.js`
- Modify: `meta.js` (thêm lớp `giay` giữa `gian-nha` và `keo-quan`), `painting.js`, `quality.js` (khóa `fiber`: 2 / 1 / 1; ladder thêm
  `'giay.soi'` sau `'gian-nha.chi-tiet'`), `layers/l5-keo-quan.js` (nhân bóng hình nhân vào ánh sáng xuyên giấy), `content.vi.js`
- Test: `tests/paintings/den-keo-quan/giay.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Consumes: `shared.cot.{ lantern, paper, materials.giay }`, `shared.ngonNen.{ light, candle, power, color }`.
- Produces: `shared.giay = { tintAt }` (Fn của P → màu tấm giấy, đã trộn `dye`). Kéo quân nhân
  `paper.material.emissiveNode × mix(1, gobo.figures(positionWorld), w5)`.

- [ ] **Step 1: Viết test đỏ** `giay.test.js`:
  - `emissiveNode` của giấy có uniform `w_giay` và `candlePower`. Nhờ vậy, Ngọn nến = 0 thì `power` = 0 và giấy không sáng (Review
    Focus 2);
  - node bóng của đèn có `w_giay` (lọc màu ra phòng);
  - `paperTints` có đủ 8 màu, nên `sides` 8 không tra quá mảng (Review Focus 4);
  - `material.transparent` là `true` ngay từ khi dựng;
  - `clear` bật/tắt chỉ đổi uniform (không `needsUpdate`);
  - nấc `soi` có ở mức cao và mức thấp, gỡ ra thì số đo như cũ;
  - giấy và vách dịch được trên cả hai backend, không lỗi.

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `layers/l4-giay.js`.** Phần khó (ánh sáng xuyên giấy, lọc màu):

```js
// paintings/den-keo-quan/layers/l4-giay.js — Lớp 4 · Giấy: giấy dó nhuộm sáng lên từ bên trong (ánh sáng xuyên mặt mỏng), và nhuộm màu ánh sáng đi ra phòng.
import { Vector3 } from 'three/webgpu';
import {
  Fn, atan, color, dot, exp, float, floor, fract, max, min, mix, normalWorld, positionLocal, positionWorld, uniform, uniformArray, vec3,
} from 'three/tsl';
import { fbm } from '../../../lib/tsl/noise.js';

export const id = 'giay';

export const knobs = [
  { id: 'thickness', min: 0, max: 1, step: 0.01, value: 0.4 },
  { id: 'dye', min: 0, max: 1, step: 0.01, value: 0.7 },
  { id: 'fiber', min: 0, max: 1, step: 0.01, value: 0.5 },
];

const TAU = Math.PI * 2;
/** Độ đục của giấy dó: độ thấu = exp(−SIGMA × độ dày). Chốt ở lượt màu (Task 15). */
const SIGMA = 2.2;
/** Màu sáu tấm giấy theo thứ tự quanh đèn (spec §18.3), đủ 8 ô cho núm sides = 8. */
const PANELS = ['doSon', 'vangLa', 'xanhLuc', 'doSon', 'vangLa', 'cham', 'doSon', 'vangLa'];

export function createLayer(ctx, shared) {
  const w = ctx.weight(id);
  const { lantern, paper } = shared.cot;
  const { light, candle, power, color: candleColor } = shared.ngonNen;
  const tints = uniformArray(PANELS.map((t) => new Vector3(...ctx.palette.color(t).toArray())), 'vec3').setName('paperTints');
  const dye = ctx.knob('dye'); // @knob dye
  const thickness = ctx.knob('thickness'); // @knob thickness
  const fiberKnob = ctx.knob('fiber'); // @knob fiber
  const fiberCap = uniform(1).setName('paperFiberCap'); // nấc 'soi' hạ trần này về 0; hiệu lực = min(núm, trần)
  const noFiber = uniform(0).setName('paperNoFiber');
  const opacity = uniform(1).setName('paperOpacity');
  const plain = color(ctx.palette.hex.giayDo);

  /** Tấm giấy có góc phi (atan(z, x)) chứa: các góc ở π/2 − k·2π/sides (cornerAngles), tấm k nằm giữa góc k và k + 1. */
  const panelAt = (phi) => floor(fract(float(Math.PI / 2).sub(phi).div(TAU)).mul(lantern.sides)).toInt();
  /** Màu tấm giấy mà tia từ lửa tới P đi qua, đã trộn độ đậm của màu nhuộm. */
  const tintAt = Fn(([P]) => {
    const out = lantern.cylinderExit(P, candle, lantern.axisNode, float(lantern.paper.r));
    return mix(plain, tints.element(panelAt(out.x)), dye);
  });
  shared.giay = { tintAt };

  // Sợi giấy: noise kéo dài theo chiều đứng (tọa độ đã giãn), số octave theo mức.
  const fiber = fbm(positionLocal.mul(vec3(40, 4, 40)), { octaves: ctx.budget.fiber ?? 2 });
  const fiberK = min(fiberKnob, fiberCap).mul(float(1).sub(noFiber));

  // Ánh sáng xuyên mặt mỏng: nhìn mặt ngoài, nhưng tính ánh nến chiếu vào MẶT TRONG (pháp tuyến ngược lại).
  // Bức xạ ra = độ rọi ở mặt trong × độ thấu / π (giấy tán xạ đều như mặt Lambert).
  const glow = Fn(() => {
    const L = candle.sub(positionWorld).toVar();
    const r2 = max(dot(L, L), 1e-4);
    const cosIn = max(dot(normalWorld.negate(), L.normalize()), 0);
    const T = exp(thickness.mul(-SIGMA));
    // Giấy không xoay và tâm mesh nằm trên trục: góc cục bộ chính là góc quanh trục, nên mỗi tấm tự biết màu của mình.
    const ownTint = mix(plain, tints.element(panelAt(atan(positionLocal.z, positionLocal.x))), dye);
    return candleColor.mul(power).mul(cosIn).div(r2).mul(T).mul(ownTint).mul(mix(float(1), fiber.mul(0.5).add(0.75), fiberK)).div(Math.PI);
  })();
  const mat = paper.material; // của Cốt (shared.cot.materials.giay)
  mat.transparent = true; // đặt TRƯỚC lần biên dịch đầu: "Giấy trong suốt" chỉ đổi uniform opacity
  mat.opacityNode = opacity;
  mat.colorNode = mix(color(ctx.palette.hex.datSet), plain.mul(0.35), w); // mặt ngoài dưới ánh đêm: giấy hơi ngà
  mat.emissiveNode = glow.mul(w);
  // Ánh sáng ra phòng mang màu tấm giấy nó vừa đi qua (vec3: đèn có màu).
  light.shadow.shadowNode = light.shadow.shadowNode.mul(mix(vec3(1), tintAt(positionWorld), w));
  // ...
}
```

  Phần còn lại của lớp:
  - Thí nghiệm `clear` (`opacity` 1 ↔ 0,15) và `noFiber`.
  - Nấc `soi`: `fiberCap` 1 → 0, revert trả lại.
  - Số đo `transmit`: `Math.round(Math.exp(-SIGMA * thicknessValue) * 100)`, đơn vị `%`, đọc giá trị núm qua `ctx.knobValue` lúc dựng và
    `onKnob`. Núm là uniform, nên số đo đọc `.value` của uniform.
  - `dispose`: gỡ `opacityNode`, trả `transparent = false`. Material là của Cốt, nhưng Cốt dispose sau và tự bỏ material.
- [ ] **Step 4: Kéo quân nhân bóng hình nhân vào ánh sáng xuyên giấy:**
  `paper.material.emissiveNode = paper.material.emissiveNode.mul(mix(float(1), gobo.figures(positionWorld), w))`. Lớp Giấy đứng TRƯỚC
  Kéo quân, nên node đã có khi Kéo quân dựng.

- [ ] **Step 5: Xanh** (`npm test`). E2E:
  - vùng đèn (hằng `LANTERN_BOX`, định nghĩa ở đầu file theo bố cục của Task 6) có điểm ấm (`warm` > 0) khi Giấy = 1, và không có khi
    Giấy = 0;
  - sắc độ của `WALL` khi Giấy = 1 lớn hơn khi Giấy = 0;
  - "Giấy trong suốt" làm vùng đèn đổi (`checksum` khác: thấy trống bên trong);
  - Ngọn nến = 0 và "Giấy trong suốt" bật: vùng đèn không có điểm ấm (Review Focus 2).

  Chạy hai backend.

- [ ] **Step 6: Commit:** `feat(den-keo-quan): lớp Giấy (ánh sáng xuyên mặt mỏng, lọc màu ra phòng, sợi giấy, giấy trong suốt)`.

---

### Task 10: Thí nghiệm "Shadow map thật" (kiểu so), dựng lười, có luật dừng riêng

**Mục tiêu:** Thí nghiệm `shadowMap` của Kéo quân:
- đèn thứ hai có cube shadow map, dựng ở lần bật đầu (biên dịch lại một lần);
- trống, khung, đế đổ bóng thật, và trống cắt hình đúng trong lượt vẽ bóng;
- mài Kéo quân về 0 thì bóng thật cũng mờ đi (`shadow.intensity`);
- tắt là `intensity` 0 và `autoUpdate = false`;
- mức thấp không có thí nghiệm này;
- `dispose` gỡ cả đèn thứ hai.

**LUẬT DỪNG RIÊNG.** DỪNG thí nghiệm này và báo Bao nếu gặp một trong hai trường hợp:
- cube shadow map hỏng trên WebGL2 (lỗi console, khung đen);
- trống không cắt hình trong lượt vẽ bóng: bóng là một vành liền.

Khi dừng, đưa hai lựa chọn: (a) chỉ có thí nghiệm này trên WebGPU; (b) bỏ thí nghiệm, ghi vào §16. Các task khác vẫn làm tiếp.

**Files:**
- Create: `parts/keo-quan-that.js`
- Modify: `layers/l5-keo-quan.js`, `meta.js` (`files`), `quality.js` (khóa `shadowMap`: 512 / 256 / 0), `content.vi.js`
- Test: `keo-quan.test.js`, `e2e/den-keo-quan.spec.js`

**Interfaces:**
- Consumes: `shared.ngonNen.{ light, power }`, `shared.cot.casters`.
- Produces: `createRealShadow(ctx, { source, size }) → { toggle(on), sync({ power, weight, on }), dispose(), get light }`.

- [ ] **Step 1: Viết test đỏ** (thêm vào `keo-quan.test.js`):

```js
it('"Shadow map thật": chưa bật thì scene chỉ có MỘT đèn điểm; bật lần đầu thêm đèn thứ hai có castShadow; tắt thì không vẽ bóng', () => {
  const { ctx, layers } = build();
  const points = () => ctx.scene.children.filter((o) => o.isPointLight);
  expect(points()).toHaveLength(1);
  const exp = layers['keo-quan'].experiments.find((e) => e.id === 'shadowMap');
  expect(exp.kind).toBe('compare');
  exp.toggle(true);
  expect(points()).toHaveLength(2);
  const real = points().find((l) => !l.shadow.shadowNode);
  expect(real.castShadow).toBe(true);
  expect(real.shadow.mapSize.x).toBe(512);
  exp.toggle(false);
  expect(real.shadow.autoUpdate).toBe(false);
});

it('mức thấp: không có thí nghiệm "Shadow map thật"', () => {
  const { layers } = build({ level: 'thap' });
  expect(layers['keo-quan'].experiments.map((e) => e.id)).not.toContain('shadowMap');
});

it('bật rồi gỡ lớp (như "Dựng lại cảnh", Review Focus 3): không còn đèn nào trong scene', () => {
  const { ctx, layers, built } = build();
  layers['keo-quan'].experiments.find((e) => e.id === 'shadowMap').toggle(true);
  for (const b of [...built].reverse()) b.layer.dispose();
  expect(ctx.scene.children.filter((o) => o.isLight)).toHaveLength(0);
});

it('mài Kéo quân về 0 khi bóng thật đang bật thì bóng thật mờ theo (Review Focus 2): shadow.intensity = trọng số', () => {
  const { ctx, layers } = build();
  layers['keo-quan'].experiments.find((e) => e.id === 'shadowMap').toggle(true);
  ctx.weights.set('keo-quan', 0.25);
  layers['keo-quan'].update(0, 1);
  const real = ctx.scene.children.find((o) => o.isPointLight && !o.shadow.shadowNode);
  expect(real.shadow.intensity).toBeCloseTo(0.25, 6);
});
```

- [ ] **Step 2: Chạy, thấy đỏ.**

- [ ] **Step 3: `parts/keo-quan-that.js`.**

```js
// paintings/den-keo-quan/parts/keo-quan-that.js — của lớp Kéo quân: thí nghiệm "Shadow map thật": một đèn điểm thứ hai có cube shadow map, dựng ở lần bật đầu.
import { PointLight } from 'three/webgpu';

/**
 * Đèn thứ hai chỉ được dựng khi người xem bật thí nghiệm lần đầu. Thêm một đèn là đổi bộ đèn nằm trong cache key của mọi material
 * (spec Phụ lục A.77), nên lần bật đầu biên dịch lại MỘT lần (khựng một nhịp). Từ đó tắt chỉ là intensity 0 và autoUpdate = false:
 * shadow map không được vẽ nữa, và không có gì phải biên dịch lại.
 * @param {object} ctx
 * @param {{ source: any, size: number }} p  source: đèn nến (vị trí, màu); size: cỡ cube shadow map (budget.shadowMap)
 */
export function createRealShadow(ctx, { source, size }) {
  let real = null;
  return {
    get light() { return real; },
    toggle(on) {
      if (on && !real) {
        real = new PointLight(source.color, 0, 0, 2);
        real.castShadow = true; // PointShadowNode: cube shadow map, 6 lượt vẽ mỗi khung (trống quay nên không vẽ một lần rồi giữ)
        real.shadow.mapSize.set(size, size);
        real.shadow.bias = -0.002;
        real.position.copy(source.position);
        ctx.scene.add(real);
      }
      if (real) real.shadow.autoUpdate = on;
    },
    /** Mỗi khung (kể cả update(0, t)): theo vị trí, màu, cường độ của đèn nến; bóng mờ theo trọng số của lớp. */
    sync({ power, weight, on }) {
      if (!real) return;
      real.position.copy(source.position);
      real.color.copy(source.color);
      real.intensity = on ? power : 0;
      real.shadow.intensity = weight; // reference() trong ShadowNode: đổi lúc chạy không biên dịch lại
    },
    dispose() {
      if (!real) return;
      ctx.scene.remove(real);
      real.dispose();
      real = null;
    },
  };
}
```

- [ ] **Step 4: Nối vào Kéo quân.**
  - `const real = (ctx.budget.shadowMap ?? 0) > 0 ? createRealShadow(ctx, { source: light, size: ctx.budget.shadowMap }) : null;`
  - Thí nghiệm `{ id: 'shadowMap', kind: 'compare', toggle(on) { realOn = on; real.toggle(on); } }`, chỉ có khi `real` có.
  - `update`, sau Ngọn nến:
    - `if (realOn) light.intensity = 0;` (đèn gobo tắt; Ngọn nến đã ghi cường độ trước đó trong cùng khung);
    - `real?.sync({ power: shared.ngonNen.power.value, weight: w.value, on: realOn })`.
  - `dispose` gọi `real?.dispose()`.
  - Content: `experiments.shadowMap` với nhãn "Shadow map thật". Lời giải thích nói đủ bốn điều thấy được (§18.4) và câu "lần bật đầu
    khựng một nhịp vì biên dịch lại".
  - Spec §18.4 đã ghi đúng điều này: lần bật đầu khựng một nhịp; thí nghiệm không trả Promise nên Sổ tay không hiện "đang dựng…".

- [ ] **Step 5: Xanh** (`npm test`). E2E (`describe` riêng, viewport 1280×800):
  - bật thí nghiệm bằng `toggleExperiment`: cảnh vẫn `live`, không lỗi console;
  - `drawCalls` tăng ít nhất 6;
  - vùng `WALL` có bóng (độ lệch chuẩn > 70% của lúc tắt);
  - tắt: `drawCalls` về như cũ;
  - `?level=thap`: Sổ tay › Kéo quân › Phá không có nút `[data-experiment="shadowMap"]`.

  Chạy webgl2-swiftshader và GPU thật. **Áp luật dừng riêng ở đây.**

- [ ] **Step 6: Commit:** `feat(den-keo-quan): thí nghiệm "Shadow map thật" (đèn thứ hai có cube shadow map, dựng lười, mờ theo trọng số; không có ở mức thấp)`.

---

### Task 11: Chất lượng và hiệu năng

**Mục tiêu:**
- Bảng ba mức đủ khóa của §18.7, thang nấc cuối cùng, trần núm theo mức.
- Đo ms GPU và nhịp khung trên máy thật và khi giả lập điện thoại. Số ghi vào spec §18.7 và vào thân commit.
- Thiếu nhịp thì thêm nấc theo §18.10 (tra mặt nạ không nội suy giữa các mức mip).

**Files:**
- Modify: `quality.js`, các lớp (trần `max` của núm), spec §18.7 (số đo)
- Test: `tests/paintings/den-keo-quan/quality.test.js`, `e2e/den-keo-quan.spec.js`

- [ ] **Step 1: Viết test đỏ** `quality.test.js`, theo mẫu `tests/paintings/ao-sen-dem/quality.test.js`:

```js
// tests/paintings/den-keo-quan/quality.test.js — bảng chất lượng của Bức 2 (spec §18.7): ba mức cùng bộ khóa, số đúng bảng, thang nấc đúng thứ tự.
import { describe, it, expect } from 'vitest';
import { quality } from '../../../src/paintings/den-keo-quan/quality.js';

describe('quality của Bức 2', () => {
  it('đúng bảng §18.7', () => {
    expect(quality.levels).toEqual({
      cao: { dpr: 2, mask: 2048, octaves: 3, fiber: 2, shadowMap: 512, bloom: 0.5 },
      vua: { dpr: 1.5, mask: 2048, octaves: 2, fiber: 1, shadowMap: 256, bloom: 0.25 },
      thap: { dpr: 1.25, mask: 1024, octaves: 1, fiber: 1, shadowMap: 0, bloom: 0.25 },
    });
  });

  it('thang: thứ ít thấy nhất hạ trước', () => {
    expect(quality.ladder).toEqual(['dpr', 'gian-nha.chi-tiet', 'giay.soi', 'phu-bong.bloom']);
  });
});
```

- [ ] **Step 2: Chạy, thấy đỏ** (nếu các task trước đã đủ khóa thì test xanh ngay: ghi lại, vẫn giữ test).

- [ ] **Step 3: Làm cho đúng bảng.** Thêm trần theo mức cho núm `octaves` (Task 8 đã có) và `figures` (thấp: tối đa 8). Kiểm test hợp
  đồng "quality … ladder chỉ gồm dpr và nấc có thật (ở mức cao)".

- [ ] **Step 4: Đo.**
  1. `npm run build`.
  2. Headless Playwright, `channel: 'chromium'`, GPU thật:
     - mỗi mức ép bằng `?level=cao|vua|thap`;
     - hai khung 1280×800 (DPR 2) và 390×844 (`devices['Pixel 7']`, DPR 3);
     - đọc `__sma.stats()` (draw call, ms, ms CPU, ms GPU nếu có) sau 10 giây live.
  3. WebGL2 SwiftShader (`?webgl&force3d`): số draw call.
  4. Ghi bảng số vào spec §18.7: "Đo ngày …, máy …".
  5. Mục tiêu §2: 60 khung/giây trên laptop.
  6. Nếu mức vừa hay thấp ở 390×844 không giữ được nhịp 45: thêm nấc `keo-quan.mip` (tra mặt nạ ở một mức mip, không nội suy), đặt sau
     `giay.soi` trong thang, và ghi vào §18.7.

- [ ] **Step 5: E2E:**
  - `?level=cao`: `drawCalls` ≤ 45 (ước 28);
  - `?level=thap`: chạy được, không lỗi console;
  - bộ điều chỉnh hạ hết nấc rồi nâng lại được: test chung của `painting.spec.js` đã có cho mọi bức; chạy lại riêng
    `-g "Đèn Kéo Quân"`.

- [ ] **Step 6: Commit:** `perf(den-keo-quan): bảng chất lượng ba mức, thang nấc, trần núm; số đo trên máy thật`.

---

### Task 12: Lật tranh giữa hai trang

**Mục tiêu:**
- Mỗi trang có `<nav class="series" aria-label="Các bức tranh">` ngay dưới `<h1>`, với link tới bức kề trước và kề sau:
  - đích là đường dẫn tương đối;
  - test HTML so với registry, và registry phải xếp theo `meta.no`;
  - CSS ở `shell.css`;
  - chạy cả ở tầng tĩnh.
- `?poster` ẩn link.
- Đường Tab có link ở đầu.

**Files:**
- Modify: `index.html`, `tranh/den-keo-quan/index.html`, `src/styles/shell.css`, `tests/paintings/html.test.js`
- Create: `e2e/lat-tranh.spec.js`

- [ ] **Step 1: Viết test đỏ** (thêm vào `tests/paintings/html.test.js`).

```js
// Ở đầu file: import { posix } from 'node:path';

describe('lật tranh (GĐ 6)', () => {
  it('registry xếp theo meta.no: 1, 2, … liên tiếp', () => {
    expect(paintings.map((p) => p.meta.no)).toEqual(paintings.map((_, i) => i + 1));
  });
});

/** Đường dẫn tương đối từ thư mục của trang `from` tới thư mục của trang `to` ('index.html' → '', 'tranh/x/index.html' → 'tranh/x/'). */
const dirOf = (page) => page.replace(/index\.html$/, '');
const relative = (from, to) => {
  const rel = posix.relative(dirOf(from) || '.', dirOf(to) || '.');
  return rel === '' ? './' : `${rel}/`;
};

// Trong vòng for của từng trang:
it('lật tranh: nav.series dưới <h1>, link tới bức kề trước/sau đúng số, tên, đích tương đối và rel', () => {
  const nav = $('header nav.series');
  expect(nav, 'thiếu <nav class="series"> trong header').not.toBeNull();
  expect(nav.getAttribute('aria-label')).toBe('Các bức tranh');
  expect(nav.previousElementSibling?.tagName).toBe('H1');
  const i = paintings.findIndex((p) => p.page === page);
  const expected = [];
  if (i > 0) expected.push({ rel: 'prev', href: relative(page, paintings[i - 1].page), text: `← Bức ${paintings[i - 1].meta.no} · ${paintings[i - 1].meta.title}` });
  if (i < paintings.length - 1) expected.push({ rel: 'next', href: relative(page, paintings[i + 1].page), text: `Bức ${paintings[i + 1].meta.no} · ${paintings[i + 1].meta.title} →` });
  expect([...nav.querySelectorAll('a')].map((a) => ({ rel: a.getAttribute('rel'), href: a.getAttribute('href'), text: nfc(a.textContent) })))
    .toEqual(expected.map((e) => ({ ...e, text: nfc(e.text) })));
});
```

  Kiểm kết quả mong đợi: từ `index.html` tới Bức 2 là `tranh/den-keo-quan/`; từ Bức 2 về là `../../`.

- [ ] **Step 2: Chạy, thấy đỏ:** `npx vitest run tests/paintings/html.test.js`.

- [ ] **Step 3: HTML.**
  - `index.html`: sau `<h1>Ao Sen Đêm</h1>` thêm
    `<nav class="series" aria-label="Các bức tranh"><a rel="next" href="tranh/den-keo-quan/">Bức 2 · Đèn Kéo Quân →</a></nav>`.
  - Bức 2: `<nav class="series" aria-label="Các bức tranh"><a rel="prev" href="../../">← Bức 1 · Ao Sen Đêm</a></nav>`.

- [ ] **Step 4: CSS** (`shell.css`, ngay sau luật của `header h1`):
  - `.series`: `display: flex`, `gap: 12px`, chữ nhỏ (`font: 400 13px/1.4 var(--sans)`), màu `--bac-la`;
  - `.series a`: `color: inherit`, gạch chân mảnh `text-underline-offset: 3px`;
  - `.series a:hover`: `color: var(--vang-la)`;
  - `.series a:focus-visible`: `outline: 2px solid var(--vang-la-sang)`, `outline-offset: 3px`;
  - không có `transform` hay `filter` (CLAUDE.md, phần tử có con `position: fixed`);
  - màn hẹp: giữ một hàng, cắt bằng `text-overflow: ellipsis` nếu cần.

  `body[data-poster]` đã ẩn `.frame`, nên không cần luật thêm cho `?poster`.

- [ ] **Step 5: E2E** `e2e/lat-tranh.spec.js` (project `static`: không cần 3D).

```js
// e2e/lat-tranh.spec.js — đi qua lại giữa các bức bằng link lật tranh, ở tầng tĩnh (link là HTML thuần, không cần JS hay GPU).
import { test, expect } from '@playwright/test';
import { paintings } from '../src/paintings/registry.js';

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
});

test('từ Bức 1 bấm "Bức 2 · …" thì tới trang Bức 2; bấm "← Bức 1 · …" thì về', async ({ page }) => {
  const [first, second] = paintings;
  await page.goto('./?static');
  await page.locator('nav.series a[rel="next"]').click();
  await expect(page).toHaveURL(/\/tranh\/den-keo-quan\/$/);
  await expect(page.locator('h1')).toHaveText(second.meta.title);
  await page.locator('nav.series a[rel="prev"]').click();
  await expect(page).toHaveURL(/\/son-mai-anh-sang\/$/);
  await expect(page.locator('h1')).toHaveText(first.meta.title);
});

test('?poster ẩn link lật tranh', async ({ page }) => {
  await page.goto('./?static&poster');
  await expect(page.locator('nav.series')).toBeHidden();
});
```

- [ ] **Step 6: a11y.**
  1. Chạy `npm run build && npx playwright test e2e/a11y.spec.js --project=static --project=webgl2-swiftshader`.
  2. Link mới là điểm dừng Tab đầu tiên. Test đi bằng bàn phím cho phép tới 8 lần Tab trước lời mời: kiểm nó vẫn xanh ở cả hai trang.
  3. axe không có lỗi serious/critical (độ tương phản của `--bac-la` trên nền tối).

- [ ] **Step 7: Xanh** (`npm test`), rồi commit: `feat: lật tranh giữa các bức (nav trong HTML tĩnh, link tương đối, test so registry)`.

---

### Task 13: CI: e2e chia hai phần

**Mục tiêu:**
- Job `build` chỉ còn unit, build và đóng gói Pages.
- E2e chặn (`static` + `webgl2-swiftshader`) chạy hai phần song song, chia theo test (`--fully-parallel`).
- E2e WebGPU (không chặn) cũng hai phần.
- `deploy` chờ `build` và cả hai phần e2e chặn.
- Mỗi job e2e tự build (không thêm action mới).

**Files:**
- Modify: `.github/workflows/deploy.yml`, spec §13 (nếu khác điều đã ghi)

- [ ] **Step 1: Kiểm cờ của Playwright 1.63.**
  1. `npx playwright test --help | grep -E "fully-parallel|shard"`: phải có cả hai cờ.
  2. `npx playwright test --project=static --project=webgl2-swiftshader --shard=1/2 --fully-parallel --list | tail -1`.
  3. Làm lại với `--shard=2/2`.
  4. Tổng số test của hai phần phải bằng số test của lần chạy không chia, và hai phần lệch nhau ít.

- [ ] **Step 2: Sửa `deploy.yml`.** Giữ nguyên SHA đã ghim của mọi action.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    # Cổng chặn phần 1: unit, luật, hợp đồng, build. E2e ở job riêng (GĐ 6: hai bức nhân đôi e2e chung, spec §13).
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Unit, luật và hợp đồng (Vitest)
        run: npm test
      - name: Build (Vite, base /son-mai-anh-sang/)
        run: npm run build
      - name: Đóng gói dist cho Pages
        if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
        uses: actions/upload-pages-artifact@fc324d3547104276b827a68afc52ff2a11cc49c9 # v5.0.0
        with:
          path: dist

  e2e:
    # Cổng chặn phần 2: tranh tĩnh + WebGL2 trên SwiftShader (kèm a11y), chia hai phần chạy song song theo từng test.
    runs-on: ubuntu-latest
    timeout-minutes: 40
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Build (mỗi phần tự build: nhanh hơn chuyển dist qua artifact, và không thêm action mới)
        run: npm run build
      - name: Cài Chromium headless shell và thư viện hệ thống
        run: npx playwright install --with-deps --only-shell chromium
      - name: E2E chặn · phần ${{ matrix.shard }}/2
        run: npx playwright test --project=static --project=webgl2-swiftshader --shard=${{ matrix.shard }}/2 --fully-parallel
      - name: Giữ ảnh chụp và trace của e2e
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: e2e-results-${{ matrix.shard }}
          path: e2e/.results/
          include-hidden-files: true
          if-no-files-found: ignore
          retention-days: 7

  e2e-webgpu:
    # WebGPU trên SwiftShader (Chromium đầy đủ): KHÔNG chặn; chia hai phần như e2e chặn.
    runs-on: ubuntu-latest
    continue-on-error: true
    timeout-minutes: 40
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2]
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - name: Build (Vite, base /son-mai-anh-sang/)
        run: npm run build
      - name: Cài Chromium đầy đủ và thư viện hệ thống
        run: npx playwright install --with-deps --no-shell chromium
      - name: E2E không chặn · WebGPU trên SwiftShader · phần ${{ matrix.shard }}/2
        run: npx playwright test --project=webgpu-swiftshader --shard=${{ matrix.shard }}/2 --fully-parallel
      - name: Giữ ảnh chụp và trace của e2e WebGPU
        if: ${{ !cancelled() }}
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
        with:
          name: e2e-results-webgpu-${{ matrix.shard }}
          path: e2e/.results/
          include-hidden-files: true # thư mục ẩn
          if-no-files-found: ignore
          retention-days: 7

  deploy:
    # Chỉ deploy từ main, và chỉ khi build và CẢ HAI phần e2e chặn đều qua (không chờ e2e-webgpu).
    if: github.event_name != 'pull_request' && github.ref == 'refs/heads/main'
    needs: [build, e2e]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d # v6.0.0
      - id: deployment
        uses: actions/deploy-pages@368f82528645a54fb793d4d04e342629a3f51346 # v5.0.1
```

  Phần đầu file (`name`, `on`, `permissions`, `concurrency`) giữ nguyên. Đối chiếu từng bước của `deploy` với file cũ trước khi xóa:
  file cũ có bước nào khác (ví dụ một bước kiểm khác) thì giữ lại.

- [ ] **Step 3: Kiểm cú pháp:** `npx --yes yaml-lint .github/workflows/deploy.yml`, hoặc `node -e "require('yaml')"` nếu gói đã có; không
  thì `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml'))"`. CI thật chạy ở Task 17, khi mở PR (PR không
  deploy).

- [ ] **Step 4: Commit:** `ci: e2e chặn và e2e WebGPU chia hai phần chạy song song (hai bức nhân đôi e2e chung); deploy chờ cả hai phần`.

---

### Task 14: Chữ của Sổ tay và năm sơ đồ

**Mục tiêu:**
- `content.vi.js` đủ cho năm lớp riêng: `understand` ≤ 150 chữ, `learned`, `readMore` (https), nhãn cho MỌI núm, thí nghiệm, số đo và
  vật.
- Năm sơ đồ SVG có `<title>`, chỉ dùng màu của bảng đã ghép.
- Chữ đúng điều spec §18.4 nói lớp đó dạy.

**Files:**
- Modify: `content.vi.js`
- Create: `diagrams/{cot,ngon-nen,gian-nha,giay,keo-quan}.svg`

- [ ] **Step 1: Test đỏ.** Kiểm test hợp đồng hiện có đã bắt chữ thiếu chưa. Có nhãn còn thiếu thì đó là chỗ đỏ. Thêm vào
  `tests/paintings/den-keo-quan/chu.test.js`:
  - mỗi lớp riêng có `diagram` (bức này cam kết có sơ đồ, dù hợp đồng để tùy);
  - `understand` của Kéo quân nhắc `atan` và "nửa tối";
  - `understand` của Giấy nhắc "mặt trong";
  - `content.hint` đúng chuỗi của §18.2.

- [ ] **Step 2: Viết chữ.** Mỗi lớp: một đoạn Hiểu ≤ 150 chữ; 2–3 dòng "Bạn vừa học"; 1–3 link Đọc thêm.
  - **Cốt:** cốt đất sét của gian nhà và chiếc đèn; mặt nạ hình nhân vẽ bằng code (khoảng cách có dấu, mép mịn một texel, mip).
    Đọc thêm: three.js `CylinderGeometry` (https://threejs.org/docs/#api/en/geometries/CylinderGeometry), Wikipedia "Đèn kéo quân"
    (https://vi.wikipedia.org/wiki/%C4%90%C3%A8n_k%C3%A9o_qu%C3%A2n).
  - **Ngọn nến:** đèn điểm, luật nghịch đảo bình phương; vật tự phát sáng khác đèn thật (nối bài của Bức 1). Đọc thêm: three.js
    `PointLight` (https://threejs.org/docs/#api/en/lights/PointLight), Wikipedia "Inverse-square law"
    (https://en.wikipedia.org/wiki/Inverse-square_law).
  - **Gian nhà:** texture thủ tục (`fract`, `hash`, `fbm`), clearcoat. Đọc thêm: The Book of Shaders "Patterns"
    (https://thebookofshaders.com/09/), "Noise" (https://thebookofshaders.com/11/).
  - **Giấy:** ánh sáng xuyên mặt mỏng (tính ở mặt trong), lọc màu. Đọc thêm: Wikipedia "Translucency"
    (https://en.wikipedia.org/wiki/Transparency_and_translucency).
  - **Kéo quân:** gobo bằng `atan(y, x)`, giao tia với ống trụ, nửa tối theo cỡ nguồn sáng, node bóng tự viết của đèn; vì sao không
    dùng shadow map (thí nghiệm). Đọc thêm: Wikipedia "Gobo (lighting)" (https://en.wikipedia.org/wiki/Gobo_(lighting)), "Umbra, penumbra
    and antumbra" (https://en.wikipedia.org/wiki/Umbra,_penumbra_and_antumbra), three.js `LightShadow`
    (https://threejs.org/docs/#api/en/lights/shadows/LightShadow).

  Mở từng link một lần (WebFetch) để chắc link sống. Lời giải thích của thí nghiệm nói người xem sẽ THẤY gì, như Bức 1.

- [ ] **Step 3: Năm sơ đồ.** SVG nhỏ, theo mẫu `src/paintings/ao-sen-dem/diagrams/*.svg` (`viewBox`, nét mảnh, chữ ngắn, `<title>`),
  import bằng `?raw`:
  - Cốt: dải mặt nạ cuộn thành ống trụ;
  - Ngọn nến: hai vách ở hai khoảng cách, độ sáng 1/d²;
  - Gian nhà: lưới `fract` thành viên gạch;
  - Giấy: tia sáng vào mặt trong, ra mặt ngoài, đổi màu;
  - Kéo quân: tia từ lửa qua trống tới vách; góc `atan`; nửa tối rộng dần theo khoảng cách.

  Chỉ dùng màu trong `mergePalette(meta.palette)`.

- [ ] **Step 4: Xanh** (`npm test`, gồm hợp đồng: ≤ 150 chữ, https, màu sơ đồ).

- [ ] **Step 5: Commit:** `docs(den-keo-quan): chữ của Sổ tay cho năm lớp và năm sơ đồ`.

---

### Task 15: Lượt màu và poster thật

**Mục tiêu:**
- Chốt số mặc định của các núm (màu giấy, độ dày, cường độ nến, `lua`/`giayDo`, Phủ bóng nếu cần ghi đè) bằng cách đo như §5, trên GPU
  thật.
- Chụp poster và og từ cảnh.
- Bao duyệt ảnh.

**Files:**
- Modify: các núm (`value`) của các lớp, `meta.js` (`palette`, `poster.capture.freeze`), `painting.js` (ghi đè Phủ bóng nếu cần), spec
  §18.3 (số đo của lượt màu)
- Create (ghi đè): `public/paintings/den-keo-quan/{poster.webp, og.jpg}`

- [ ] **Step 1: Đo trước.**
  1. Script headless (GPU thật) chụp `?at=2026-10-25T21:00&freeze=N&poster&level=cao` ở 1280×800 và 390×844.
  2. Tính độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối, theo cách của §5 (script của GĐ 3–4: đọc PNG trong trang như
     `canvasRegions`).

- [ ] **Step 2: Chỉnh.** Mục tiêu:
  - tối, ấm, không bệt;
  - mảng màu giấy rõ mà không gắt;
  - đoàn quân đọc được.

  Gom mọi số mặc định vào MỘT commit riêng: `style(den-keo-quan): lượt màu (…số trước/sau…)`. Ghi số đo vào §18.3 của spec.

- [ ] **Step 3: Poster.**
  1. Chọn `freeze` cho đẹp (đoàn quân giữa vách sau), sửa `meta.poster.capture`.
  2. `npm run build && node scripts/poster.js den-keo-quan`.
  3. Kiểm `npm test` (cỡ, ≤ 150 KB, og 1200×630 ≤ 200 KB).

- [ ] **Step 4: Bao duyệt ảnh.** Thêm ảnh trước/sau lượt màu và poster vào trang ảnh của Task 6 (hay một trang mới), rồi gửi Bao. Bao
  nói sửa thì sửa và chụp lại. Không chặn các task 16–17, nhưng Task 17 không hỏi push khi Bao chưa duyệt ảnh.

- [ ] **Step 5: Commit:** `feat(den-keo-quan): poster và og chụp từ cảnh`.

---

### Task 16: Tài liệu khớp code

**Mục tiêu:** README, `CLAUDE.md` và spec khớp với code của GĐ 6.

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md`

- [ ] **Step 1: README.**
  - Bức 2 (link, sáu lớp, cử chỉ).
  - Số bundle: chạy `npm run build`, ghi kB gzip của chunk `painting` và `content` của Bức 2, theo cách README đã ghi cho Bức 1.
  - Mục "Thêm một bức tranh mới": thêm bước lật tranh, và điều học được (node bóng tự viết; lớp không import part của lớp khác, dùng
    `shared`).

- [ ] **Step 2: `CLAUDE.md`.**
  - Bản đồ dự án: Bức 2 ở `src/paintings/den-keo-quan/`, trang `tranh/den-keo-quan/`.
  - Luật mới, mỗi luật một gạch đầu dòng, đúng giọng của file:
    - đèn có node bóng tự viết (`light.shadow.shadowNode`): `castShadow` của đèn và `shadowMap.enabled` phải bật lúc dựng; vật nhận
      bóng có `receiveShadow`; không có node đó thì three dựng shadow map thật;
    - thêm hay bớt đèn lúc chạy là biên dịch lại mọi material (thí nghiệm "Shadow map thật" chấp nhận một lần);
    - `smoothstep(a, b, x)` luôn a < b;
    - `atan(0, 0)` không định nghĩa: cộng `EPS`;
    - lật tranh: link tương đối viết tay trong HTML; registry xếp theo `no`;
    - CI chia hai phần, `--fully-parallel`.

- [ ] **Step 3: Spec.**
  - Duyệt lại §18 từ đầu tới cuối, sửa mọi số đã chốt lúc làm (kích thước, camera, `figures` 6–10, số đo hiệu năng, lượt màu).
  - §8.1: cây file đúng file thật.
  - Phụ lục A.77–A.80: đổi "đọc mã" thành "đã chạy thật (GĐ 6)", kèm điều thấy được (ví dụ "draw call 28 ở mức cao, không lượt vẽ
    bóng").
  - §13 khớp workflow.

- [ ] **Step 4: Xanh** (`npm test`), rồi commit: `docs: README, CLAUDE.md và spec theo GĐ 6 (Bức 2, lật tranh, node bóng tự viết, CI chia phần)`.

---

### Task 17: Review cuối, đối chiếu thơ, hỏi Bao trước khi push

**Mục tiêu:** cả nhánh được một reviewer mới review; mọi test và e2e xanh; thơ đối chiếu với bản in; rồi DỪNG, hỏi Bao về push và PR.

- [ ] **Step 1: Chạy đủ** (một mình, máy rảnh):
  1. `npm test`;
  2. `npm run build`;
  3. `npx playwright test --project=static --project=webgl2-swiftshader`;
  4. `E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`;
  5. `npx playwright test --project=webgpu-swiftshader` (không chặn).

  Ghi số test và thời gian. Hỏng vì `timeout` dưới tải nặng thì kiểm CPU rồi chạy lại một lần.

- [ ] **Step 2: Review cuối.**
  - Một reviewer mới (model mạnh nhất) đọc toàn nhánh từ `4a19eac`, theo spec §18, Global Constraints và Review Focus của plan này.
  - Sửa mọi mục Critical/Important. Mục Minor thì ghi lại để Bao quyết.
  - Thêm một reviewer `silent-failure-hunter` cho phần đèn thứ hai và `dispose`.

- [ ] **Step 3: Đối chiếu thơ.**
  - Tra ít nhất hai nguồn in, hay bản số hóa của sách ca dao, cho câu "Khen ai khéo kết đèn cù / Voi giấy, ngựa giấy tít mù vòng
    quanh".
  - Chốt chữ theo bản in phổ biến nhất: "kết" hay "xếp", dấu phẩy sau "Voi giấy". Sửa `meta.js` và trang HTML (test HTML giữ chúng
    khớp nhau).
  - Ghi nguồn đã đối chiếu vào §18.2.

- [ ] **Step 4: DỪNG, hỏi Bao.** Gửi Bao:
  - tóm tắt;
  - số test;
  - các mục Minor;
  - ảnh poster (nếu Bao chưa duyệt ở Task 15);
  - danh sách kiểm tay của Bao (spec §12, GĐ 6): điện thoại thật, VoiceOver với link lật tranh, đọc thơ trên trang;
  - câu hỏi: push nhánh và mở PR (CI chạy thật hai phần e2e; PR không deploy), hay giữ local.

  **Không push, không merge khi Bao chưa nói.** Merge vào `main` là deploy.
  - Khi merge: `gh pr merge N --merge --match-head-commit <sha> --author-email giabao261096@gmail.com …`.
  - Không xóa nhánh trên remote.
