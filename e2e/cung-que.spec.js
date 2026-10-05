// e2e/cung-que.spec.js — Bức 3 · Cung Quế: khối bao dò tia ghi độ sâu và pháp tuyến của hình SDF; pha trăng; bóng; ánh đất; cử chỉ; chất lượng.
import { test, expect } from '@playwright/test';
import {
  waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, holdAt, twoFrames, toggleExperiment,
} from './helpers.js';

const AT = 'at=2026-10-21T21:00';
/**
 * Vùng (phần của canvas 640×400 mặc định), theo ảnh thật ở khung mặc định. Độ sáng `mean` của canvasRegions ở thang 0–1.
 * PLANET_CORE: thân hành tinh dưới gốc cây, tránh các hố: tia trúng hình.
 * OUTSIDE_SDF: bên trái tán, trên mặt hành tinh: trong khối bao (cầu r 1,82) nhưng ngoài mọi hình, nên tia trượt.
 */
const PLANET_CORE = { x0: 0.46, y0: 0.66, x1: 0.54, y1: 0.74 };
const OUTSIDE_SDF = { x0: 0.3, y0: 0.3, x1: 0.36, y1: 0.36 };
/** Tán đa (giữa khung, phía trên hành tinh) và hai nửa thân hành tinh, để so pha trăng. */
const CANOPY = { x0: 0.45, y0: 0.37, x1: 0.55, y1: 0.42 };
const PLANET_LEFT = { x0: 0.38, y0: 0.6, x1: 0.45, y1: 0.68 };
const PLANET_RIGHT = { x0: 0.55, y0: 0.6, x1: 0.62, y1: 0.68 };

async function open(page, testInfo, frames, extra = '') {
  const query = testInfo.project.metadata.query ?? '';
  await page.goto(`./tranh/cung-que/?${query.replace(/^\?/, '')}&${AT}&freeze=${frames}${extra}`);
  const settled = await waitForSettled(page, { timeout: 60_000 });
  expect(settled.state, `về tĩnh: ${settled.reason}`).toBe('live');
  return waitForFrames(page, frames, { timeout: 120_000 });
}

/** Lột lớp về nấc "Depth": nấc đầu bên trái (các nấc theo thứ tự §7; ảnh cuối ở cuối bên phải). */
async function depthView(page) {
  await page.evaluate(() => window.__sma.setTool('lot-lop'));
  const range = page.locator('[data-tool-slot="lot-lop"] input[type="range"]');
  await range.evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(range).toHaveAttribute('aria-valuetext', 'Depth');
  await twoFrames(page);
}

/** Project WebGPU mà máy không có adapter (SwiftShader ở vài môi trường) thì bỏ qua, như e2e của Bức 2. */
test.beforeEach(async ({ page }, testInfo) => {
  const { kind, backend } = testInfo.project.metadata;
  if (kind !== '3d' || backend !== 'webgpu') return;
  await page.goto('./tranh/cung-que/?static');
  test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
});

test.describe('Cung Quế · khối bao', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('độ sâu là của hình SDF: bật "Hiện khối bao"; trong view Depth, chỗ tia trúng hình gần (sáng) hơn hẳn chỗ tia trượt (mặt sau khối bao)', async ({ page }, testInfo) => {
    // Không có depthNode thì mọi điểm của khối bao mang độ sâu của mặt sau quả cầu, và hai vùng sáng gần bằng nhau.
    test.setTimeout(180_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await toggleExperiment(page, 'cot', 'khoiBao', true);
    await depthView(page);
    const r = await canvasRegions(page, { core: PLANET_CORE, miss: OUTSIDE_SDF });
    await page.screenshot({ path: testInfo.outputPath('depth.png') });
    // View Depth nén mọi độ sâu gần về sáng (đường cong của views.js), nên chênh lệch nhỏ. Chiều của nó mới là bằng chứng: không có
    // depthNode thì giữa hành tinh mang độ sâu mặt sau quả cầu (xa hơn chỗ trượt), nên TỐI hơn; có depthNode thì sáng hơn.
    expect(r.core.mean, 'trúng hình gần hơn chỗ trượt').toBeGreaterThan(r.miss.mean + 0.01);
    expect(log.errors).toEqual([]);
  });

  test('cùng một khung ?freeze thì giống hệt nhau', async ({ page }, testInfo) => {
    await open(page, testInfo, 40);
    const a = await canvasRegions(page, { core: PLANET_CORE });
    await page.reload();
    await open(page, testInfo, 40);
    const b = await canvasRegions(page, { core: PLANET_CORE });
    expect(b.core.checksum).toBe(a.core.checksum);
  });
});

test.describe('Cung Quế · camera', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('kéo ngang 1,5 vòng: camera đi vòng quanh hành tinh (xoay ngang không giới hạn), cảnh vẫn chạy, không lỗi', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    const query = (testInfo.project.metadata.query ?? '').replace(/^\?/, '');
    await page.goto(`./tranh/cung-que/?${query}&${AT}`);
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const before = (await canvasRegions(page)).all.checksum;
    // OrbitControls xoay 2π mỗi bề cao của canvas (400 px): ba lần kéo 200 px là 1,5 vòng, sang mặt bên kia của hành tinh
    const box = await page.locator('[data-stage] canvas').boundingBox();
    for (let i = 0; i < 3; i += 1) {
      await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.3 + 200, box.y + box.height * 0.5, { steps: 20 });
      await page.mouse.up();
    }
    await twoFrames(page);
    expect((await canvasRegions(page)).all.checksum, 'camera đã sang chỗ khác').not.toBe(before);
    expect(await page.evaluate(() => window.__sma.state)).toBe('live');
    expect(log.errors).toEqual([]);
  });
});

test.describe('Cung Quế · khung dọc', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('điện thoại dọc thấy trọn bề ngang hành tinh: hai mép khung là nền, giữa là đất sét (CameraSpec.minHorizontalFov)', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const log = collectConsole(page);
    await open(page, testInfo, 20);
    // Chỉ còn Cốt: hành tinh đất sét sáng đều dưới đèn xưởng, nền tối, nên mép khung đọc ra ngay là nền hay hành tinh
    for (const { id } of await page.evaluate(() => window.__sma.layers())) {
      if (id !== 'cot') await page.evaluate((l) => window.__sma.setWeight(l, 0), id);
    }
    await twoFrames(page);
    // Dải mép cao từ giữa khung xuống gần đáy: chỗ hành tinh rộng nhất nằm trong dải, ở khung dọc nào cũng vậy
    const r = await canvasRegions(page, {
      left: { x0: 0, y0: 0.55, x1: 0.02, y1: 0.95 },
      right: { x0: 0.98, y0: 0.55, x1: 1, y1: 0.95 },
      planet: { x0: 0.4, y0: 0.7, x1: 0.6, y1: 0.8 },
    });
    await page.screenshot({ path: testInfo.outputPath('khung-doc.png') });
    expect(r.planet.mean, 'giữa khung là hành tinh đất sét').toBeGreaterThan(0.25);
    expect(r.left.mean, 'mép trái là nền').toBeLessThan(0.08);
    expect(r.right.mean, 'mép phải là nền').toBeLessThan(0.08);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Cung Quế · cử chỉ', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('giữ: cây bay lên (số đo "Cây bay lên" > 3 m); thả: rơi về dưới 0,5 m', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const log = collectConsole(page);
    const query = (testInfo.project.metadata.query ?? '').replace(/^\?/, '');
    await page.goto(`./tranh/cung-que/?${query}&${AT}`); // live: đồng hồ của cảnh phải chạy
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const bay = () => page.evaluate(() => Number(window.__sma.readouts('cot').find((r) => r.id === 'bay')?.value));
    expect(await bay()).toBe(0);
    const held = holdAt(page, 0.5, 0.75, 4000);
    // Đồng hồ của cảnh theo khung vẽ: SwiftShader vẽ chậm nên cho rộng thời gian
    await expect.poll(bay, { timeout: 15_000 }).toBeGreaterThan(3);
    await held;
    await expect.poll(bay, { timeout: 30_000 }).toBeLessThan(0.5);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Cung Quế · pha trăng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('rằm: tán đa sáng hơn hẳn mùng 1; thượng huyền: nửa phải hành tinh sáng hơn nửa trái', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const setDay = async (d) => {
      await page.evaluate((v) => window.__sma.setDial('ngay', v), d);
      await twoFrames(page);
    };
    await setDay(15);
    const full = await canvasRegions(page, { canopy: CANOPY });
    await setDay(1);
    const dark = await canvasRegions(page, { canopy: CANOPY });
    expect(full.canopy.mean, 'rằm sáng hơn mùng 1').toBeGreaterThan(dark.canopy.mean * 2);
    await setDay(8.4);
    const q = await canvasRegions(page, { left: PLANET_LEFT, right: PLANET_RIGHT });
    await page.screenshot({ path: testInfo.outputPath('thuong-huyen.png') });
    expect(q.right.mean, 'thượng huyền: nắng từ bên phải').toBeGreaterThan(q.left.mean + 0.06); // mean ở thang 0–1
    expect(log.errors).toEqual([]);
  });
});
