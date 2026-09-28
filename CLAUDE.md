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
- Lớp dùng chung (thuộc kỹ thuật, bức nào cũng lắp được): `src/engine/stock/<id>/`, hiện có Phủ bóng.
- `src/paintings/registry.js`: danh sách các bức. Node đọc (vite.config, test, e2e); trình duyệt không import.
- Cách phân biệt: tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thuộc xưởng; tên chủ đề (sen, trăng,
  gợn nước, đom đóm) thuộc bức.

## Lệnh

| Việc | Lệnh |
|---|---|
| Chạy dev | `npm run dev`, mở http://localhost:5173/son-mai-anh-sang/ |
| Unit + luật + hợp đồng | `npm test` (một file: `npx vitest run tests/unit/flags.test.js`) |
| Build | `npm run build` (ra `dist/`) |
| E2E | `npm run e2e` (build rồi chạy Playwright); một project: `npm run build && npx playwright test --project=webgl2-swiftshader` |
| Lần đầu chạy e2e | `npx playwright install chromium` |

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

### Chuyển động và ngẫu nhiên
- Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time` và `ctx.u.delta` (nhờ vậy `?freeze` cho ảnh tất định).
- Không dùng `Math.random`; dùng `src/lib/random.js` (PRNG có hạt giống).

### Chữ và chú thích
- Mọi material gán `emissiveNode` tường minh, kể cả `vec3(0)`.
- Chữ người xem thấy nằm trong `strings.*.js`, `content.*.js` và các trường chữ của `meta.js`: tên lớp (`meta.name`), cùng `title`, `tagline`, thơ (`poem`) và `poster.alt`.
  Không file nào trong `src/` import `strings.*.js`: trang HTML import rồi truyền `t` vào `boot`.
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

### Commit
- Dùng email cá nhân: mọi commit mang `Bao Nguyen <giabao261096@gmail.com>`, đã cấu hình local trong repo.
  Không sửa git config global.

## Gỡ lỗi nhanh
- Cờ URL (spec §8.7): `?static`, `?webgl`, `?force3d`, `?debug`, `?at=2026-09-28T21:00` (giờ Việt Nam), `?freeze=N`.
- `window.__sma` trong DevTools cho biết `state`, `tier`, `backend`, `level`, `frames`, `reason`.
