// e2e/dan-ga-me-con.helpers.js — dùng chung cho các spec e2e của Bức 4 (e2e/dan-ga-me-con*.spec.js, mỗi file dưới 300 dòng): tag khói, các vùng của canvas (đổi sang khung 640 × 400 đã nới theo shortFrame), khung tờ giấy đo trên ảnh canvas, mở trang, Lột lớp về một view, đọc số đo `goc`, bỏ qua khi thiếu WebGPU. Không phải file test (Playwright chỉ chạy *.spec.js).
import { test, expect } from '@playwright/test';
import { STAGE_ONLY, gpuReport, twoFrames, waitForFrames, waitForSettled } from './helpers.js';
import { shortGrow } from '../src/engine/gpu/fov.js';
import { CAMERA } from '../src/paintings/dan-ga-me-con/parts/cot-bo-cuc.js';

/** Tag của test khói: nếu CI bật ciWebgpuSmoke cho Bức 4 (Task 13), job WebGPU chỉ chạy các test này. */
export const SMOKE = { tag: '@khoi' };
/**
 * Canvas mặc định của e2e (playwright.config.js: 640 × 400) thấp hơn CameraSpec.shortFrame.below của Bức 4 (800): khung nhìn cao gấp
 * GROW = 1,3 lần (spec §20.2). Camera trực giao chiếu tuyến tính quanh tâm khung (điểm nhìn), nên mọi điểm của cảnh co về tâm khung
 * 1 / GROW lần. `at640` đổi một phần của khung CHƯA nới (16 : 10, cao từ 800, như 1280 × 800) sang phần của canvas 640 × 400: cùng một chỗ
 * của cảnh.
 */
export const GROW = shortGrow(CAMERA.shortFrame, 400);
export const at640 = (u) => 0.5 + (u - 0.5) / GROW;
const onSheet = ({ x0, y0, x1, y1 }) => ({ x0: at640(x0), y0: at640(y0), x1: at640(x1), y1: at640(y1) });
/**
 * Vùng (phần của canvas), chốt theo ảnh thật ở khung chưa nới (GPU thật và SwiftShader; chốt lại sau điểm duyệt ảnh, Task 4: khung cao 13,2,
 * vách thấp 4,5): khung nhìn 21,12 × 13,2 đơn vị; tờ giấy từ y 0,184 tới 0,765, x từ 0,169 tới 0,831; vách tới y 0,362, sàn phẳng từ
 * y 0,557. Vùng trên tờ giấy đi qua `onSheet` (ở 640 × 400: tờ giấy y 0,257–0,704, x 0,245–0,755); vùng ván thì không.
 * BOARD_TOP, BOARD_BOTTOM: ván tối trên và dưới tờ giấy. WALL: vách giấy, không có gà. HEN: mình gà mẹ, phía trên cánh và dưới con trèo
 * lưng (chỉ có màu vàng hòe, không nếp gấp nào). LEFT_EDGE: mép trái tờ giấy (nửa ván, nửa giấy): viền của Bản nét nằm ở đây. FLOOR: mặt
 * sàn trống phía trước bên trái, nghiêng so với camera: không có nét nào.
 */
export const BOARD_TOP = { x0: 0.25, y0: 0.01, x1: 0.75, y1: 0.08 };
export const BOARD_BOTTOM = { x0: 0.25, y0: 0.93, x1: 0.75, y1: 0.99 };
export const WALL = onSheet({ x0: 0.25, y0: 0.21, x1: 0.4, y1: 0.33 });
export const HEN = onSheet({ x0: 0.455, y0: 0.46, x1: 0.495, y1: 0.495 });
export const LEFT_EDGE = onSheet({ x0: 0.15, y0: 0.3, x1: 0.19, y1: 0.7 });
export const FLOOR = onSheet({ x0: 0.18, y0: 0.65, x1: 0.24, y1: 0.745 });
/** Giữa tờ giấy: gà mẹ và sáu gà con quanh mẹ (viền, vảy lông, mắt, cánh của Bản nét đều ở đây). */
export const PAPER_MID = onSheet({ x0: 0.3, y0: 0.4, x1: 0.7, y1: 0.72 });
/**
 * Phóng to 2,5 lần (quanh tâm khung) ở khung chưa nới (test chạy ở 1280 × 800): tờ giấy phủ kín khung. Hàng điểm ảnh sát mép dưới (sàn
 * trống, bên phải các chân gà) và các hàng sàn ngay phía trên nó (gần, để vignette của Phủ bóng gần như bằng nhau).
 */
export const ZOOM_BOTTOM = { x0: 0.75, y0: 0.9975, x1: 0.97, y1: 1 };
export const ZOOM_ABOVE = { x0: 0.75, y0: 0.985, x1: 0.97, y1: 0.995 };

/**
 * Mở trang của Bức 4 theo project (query của ?webgl, ?force3d…), chờ live; `frames` > 0 thì thêm ?freeze=frames và chờ đủ khung (đã dừng).
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {number} frames  0 là chạy live, không ?freeze
 * @param {string} [extra]  phần query thêm, đã có '&' ở đầu
 */
export async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  const freeze = frames ? `&freeze=${frames}` : '';
  await page.goto(`./tranh/dan-ga-me-con/?${query.replace(/^\?/, '')}${freeze}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  if (frames) await waitForFrames(page, frames, { timeout: 120_000 });
}

/**
 * Lột lớp về một view, như e2e của Bức 3. `value` là giá trị của thanh trượt (0 là nấc đầu bên trái, tức view cuối danh sách; Bức 4
 * hiện có Depth ở '0' và Chỉ emissive ở '2': ảnh cuối, ba tap, emissive, normal, depth); `label` là chữ của view (aria-valuetext, lấy từ
 * t.views của giao diện).
 * @param {import('@playwright/test').Page} page
 * @param {string} value
 * @param {string} label
 */
export async function layerView(page, value, label) {
  await page.evaluate(() => window.__sma.setTool('lot-lop'));
  const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]');
  await range.evaluate((el, v) => {
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await expect(range).toHaveAttribute('aria-valuetext', label);
  await twoFrames(page);
}

/**
 * Số đo `goc` của Cốt (độ): độ lệch của camera SỐNG khỏi góc nhìn của tranh, 0 khi đứng ở góc ấy (`__sma.readouts('cot')`). Các test kéo xoay và
 * tranh tự khép lại poll theo nó.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<number>}
 */
export const goc = (page) => page.evaluate(() => Number(window.__sma.readouts('cot').find((r) => r.id === 'goc')?.value));

/**
 * Khung tờ giấy trên trang (px CSS), đo trên điểm ảnh của canvas (đã ẩn chữ): hàng có hơn 15% điểm ảnh sáng (giấy, gà) thuộc tờ giấy; cột
 * sáng ở hơn 30% số hàng ấy cũng vậy. Ván tối (màu xóa của canvas) không bao giờ sáng.
 */
export async function sheetBox(page) {
  const canvas = page.locator('[data-stage] canvas');
  const box = await canvas.boundingBox();
  const png = await canvas.screenshot({ style: STAGE_ONLY });
  return page.evaluate(async ({ b64, at }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    const bright = (x, y) => {
      const i = (y * img.width + x) * 4;
      return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2] > 0.25 * 255;
    };
    const rows = [];
    const cols = new Array(img.width).fill(0);
    for (let y = 0; y < img.height; y++) {
      let n = 0;
      for (let x = 0; x < img.width; x++) if (bright(x, y)) { n += 1; cols[x] += 1; }
      if (n > 0.15 * img.width) rows.push(y);
    }
    const xs = cols.flatMap((n, x) => (n > 0.3 * rows.length ? [x] : []));
    const k = at.width / img.width;
    return { left: at.x + xs[0] * k, right: at.x + (xs.at(-1) + 1) * k, top: at.y + rows[0] * k, bottom: at.y + (rows.at(-1) + 1) * k };
  }, { b64: png.toString('base64'), at: box });
}

/** Móc test.beforeEach: project WebGPU mà không có adapter thì bỏ qua (adapter chỉ hỏi được trên một trang thật: mở trang tĩnh rồi hỏi). */
export async function skipWithoutWebgpu({ page }, testInfo) {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/dan-ga-me-con/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
}
