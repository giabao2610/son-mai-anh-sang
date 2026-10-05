// e2e/cung-que.spec.js — Bức 3 · Cung Quế: khối bao dò tia ghi độ sâu và pháp tuyến của hình SDF; pha trăng; bóng; ánh đất; cử chỉ; chất lượng.
import { test, expect } from '@playwright/test';
import {
  waitForSettled, waitForFrames, canvasRegions, collectConsole, gpuReport, holdAt, tapAt, twoFrames, toggleExperiment,
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
/** Mặt đất ngay bên trái gốc cây: ngày 10, nắng xiên thấp từ bên phải nên bóng cây đổ sang đây (chốt theo ảnh thật, Task 5: có bóng
 * chừng 0,26, không bóng chừng 0,49). */
const SHADOW = { x0: 0.45, y0: 0.55, x1: 0.5, y1: 0.575 };
/** Ngày 1: chỏm trên của hành tinh (phía Trái Đất) chìm trong đêm, chỉ có ánh đất (Task 6: 0,18 khi có, 0,004 khi tắt). */
const PLANET_NIGHT = { x0: 0.42, y0: 0.58, x1: 0.58, y1: 0.66 };
/** Trái Đất ở khung mặc định (tâm chừng (0,5; 0,145)). */
const EARTH_BOX = { x0: 0.47, y0: 0.1, x1: 0.53, y1: 0.2 };

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

test.describe('Cung Quế · bóng', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('ngày 10: mặt đất bên trái gốc cây tối hơn rõ khi Bóng mềm bằng 1 so với 0 (bóng cây); bật "Bóng cứng" không lỗi', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await page.evaluate(() => window.__sma.setDial('ngay', 10));
    await twoFrames(page);
    const on = await canvasRegions(page, { shadow: SHADOW });
    await page.screenshot({ path: testInfo.outputPath('bong.png') });
    await page.evaluate(() => window.__sma.setWeight('bong-mem', 0));
    await twoFrames(page);
    const off = await canvasRegions(page, { shadow: SHADOW });
    expect(on.shadow.mean, 'bóng cây làm mặt đất tối đi').toBeLessThan(off.shadow.mean * 0.75);
    await page.evaluate(() => window.__sma.setWeight('bong-mem', 1));
    await toggleExperiment(page, 'bong-mem', 'bongCung', true);
    await twoFrames(page);
    expect(log.errors).toEqual([]);
  });
});

test.describe('Cung Quế · ánh đất', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('ngày 1: phía đêm của hành tinh sáng lên nhờ ánh đất (Ánh đất 1 so với 0); Trái Đất xanh (kênh B lớn hơn R)', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await page.evaluate(() => window.__sma.setDial('ngay', 1));
    await twoFrames(page);
    const on = await canvasRegions(page, { night: PLANET_NIGHT, earth: EARTH_BOX });
    await page.screenshot({ path: testInfo.outputPath('anh-dat.png') });
    await page.evaluate(() => window.__sma.setWeight('anh-dat', 0));
    await twoFrames(page);
    const off = await canvasRegions(page, { night: PLANET_NIGHT });
    expect(on.night.mean, 'ánh đất trên phần đêm').toBeGreaterThan(off.night.mean + 0.05);
    expect(on.earth.rgb[2], 'Trái Đất xanh').toBeGreaterThan(on.earth.rgb[0]);
    expect(log.errors).toEqual([]);
  });

  test('Mặt trời bằng 0, Bóng mềm và Ánh đất bằng 1: hành tinh không đen kịt (đất sét dưới đèn xưởng); bật cùng lúc "Hiện khối bao" và "Không có Trái Đất": không lỗi', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    await page.evaluate(() => window.__sma.setWeight('mat-troi', 0));
    await twoFrames(page);
    const r = await canvasRegions(page, { core: PLANET_CORE });
    expect(r.core.mean, 'đất sét dưới đèn xưởng').toBeGreaterThan(0.15);
    await toggleExperiment(page, 'cot', 'khoiBao', true);
    await toggleExperiment(page, 'anh-dat', 'khongTraiDat', true);
    await twoFrames(page);
    expect(await page.evaluate(() => window.__sma.state)).toBe('live');
    expect(log.errors).toEqual([]);
  });

  test('mài về Cốt: thân hành tinh là đất sét xám (sắc độ dưới 0,05)', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await open(page, testInfo, 30);
    for (const { id } of await page.evaluate(() => window.__sma.layers())) {
      if (id !== 'cot') await page.evaluate((l) => window.__sma.setWeight(l, 0), id);
    }
    await twoFrames(page);
    const r = await canvasRegions(page, { core: PLANET_CORE });
    expect(r.core.chroma).toBeLessThan(0.05);
  });
});

test.describe('Cung Quế · lá đa', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('chạm vào tán: 4 lá rơi (số đo "Lá đang rơi" ≥ 4) rồi chạm đất hết, còn lại lá tự rụng; mài Lá đa về 0 khi lá đang rơi và bật "Không ghi độ sâu": không lỗi', async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    const log = collectConsole(page);
    const query = (testInfo.project.metadata.query ?? '').replace(/^\?/, '');
    await page.goto(`./tranh/cung-que/?${query}&${AT}`); // live: đồng hồ của cảnh phải chạy
    expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
    const la = () => page.evaluate(() => Number(window.__sma.readouts('la-da').find((r) => r.id === 'la')?.value));
    // Lá tự rụng: mỗi 2,5 s một lá, rơi chừng 2,7 s, nên lúc nào cũng có một, hai lá đang rơi
    expect(await la()).toBeLessThanOrEqual(2);
    await tapAt(page, 0.5, 0.4);
    await expect.poll(la, { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
    await page.screenshot({ path: testInfo.outputPath('la-roi.png') });
    // Rơi 0,6 đơn vị mất chừng 2,7 s của cảnh; đồng hồ của cảnh theo khung vẽ, SwiftShader vẽ chậm nên cho rộng thời gian
    await expect.poll(la, { timeout: 60_000 }).toBeLessThanOrEqual(2);
    await tapAt(page, 0.5, 0.4);
    await expect.poll(la, { timeout: 15_000 }).toBeGreaterThanOrEqual(4);
    await toggleExperiment(page, 'la-da', 'doSau', true);
    await page.evaluate(() => window.__sma.setWeight('la-da', 0));
    await twoFrames(page);
    expect(await page.evaluate(() => window.__sma.state)).toBe('live');
    expect(log.errors).toEqual([]);
  });
});
