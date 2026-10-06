// e2e/dan-ga-me-con-giay.spec.js — Bức 4 · Đàn Gà Mẹ Con, lớp Giấy điệp: vách giấy từ xám đất sét thành ngà; hạt điệp (emissive) có ở góc của tranh, đứng yên khi camera đứng yên và đổi khi xoay; Giấy dó trơn. Tiện ích và các vùng dùng chung ở e2e/dan-ga-me-con.helpers.js.
import { test, expect } from '@playwright/test';
import t from '../src/ui/strings.vi.js';
import { FULL, canvasRegions, collectConsole, toggleExperiment, twoFrames, waitForFrames } from './helpers.js';
import { SMOKE, WALL, goc, layerView, open, skipWithoutWebgpu } from './dan-ga-me-con.helpers.js';

test.beforeEach(skipWithoutWebgpu);

test.describe('Đàn Gà Mẹ Con · giấy điệp', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('mài Giấy điệp về 0 thì vách giấy từ ngà về xám đất sét: sắc độ giảm ít nhất 0,03; có Giấy điệp thì kênh đỏ hơn kênh lam', SMOKE, async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 60);
    const dyed = await canvasRegions(page, { wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('giay-diep.png') });
    await page.evaluate(() => window.__sma.setWeight('giay-diep', 0));
    await twoFrames(page);
    const clay = await canvasRegions(page, { wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('dat-set.png') });
    expect(dyed.wall.chroma - clay.wall.chroma, `ngà ${dyed.wall.chroma.toFixed(3)}, đất sét ${clay.wall.chroma.toFixed(3)}`).toBeGreaterThanOrEqual(0.03);
    const [red, , blue] = dyed.wall.rgb;
    expect(red, `ngà: ${dyed.wall.rgb.map(Math.round)}`).toBeGreaterThan(blue);
    expect(log.errors).toEqual([]);
  });

  test('view Chỉ emissive ở góc của tranh: có hạt điệp lóe; sparkle 0 hay Giấy điệp về 0 thì tắt hẳn (gà không phát sáng)', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const sparkle = (await page.evaluate(() => window.__sma.snapshot())).knobs['giay-diep.sparkle']; // mặc định, để đặt về sau khi thử 0
    await layerView(page, '2', t.views.emissive);
    const glints = await canvasRegions(page, { sheet: FULL });
    await page.screenshot({ path: testInfo.outputPath('hat-diep.png') });
    expect(glints.sheet.mean, 'ở góc của tranh đã có hạt lóe, không chỉ lúc xoay').toBeGreaterThan(0);
    await page.evaluate(() => window.__sma.restore({ knobs: { 'giay-diep.sparkle': 0 } })); // restore vẽ lại khung đứng yên
    expect((await canvasRegions(page, { sheet: FULL })).sheet.mean, 'sparkle 0').toBe(0);
    await page.evaluate((v) => window.__sma.restore({ knobs: { 'giay-diep.sparkle': v } }), sparkle);
    expect((await canvasRegions(page, { sheet: FULL })).sheet.checksum, 'sparkle về mặc định thì về đúng ảnh cũ').toBe(glints.sheet.checksum);
    await page.evaluate(() => window.__sma.setWeight('giay-diep', 0));
    await twoFrames(page);
    expect((await canvasRegions(page, { sheet: FULL })).sheet.mean, 'Giấy điệp về 0').toBe(0);
    expect(log.errors).toEqual([]);
  });

  test('hạt điệp theo góc nhìn (live): camera đứng yên thì hạt đứng yên; kéo chuột 30 px thì hạt khác lóe', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 20, { timeout: 120_000 });
    await layerView(page, '2', t.views.emissive);
    const first = await canvasRegions(page, { wall: WALL });
    await twoFrames(page);
    await twoFrames(page);
    const still = await canvasRegions(page, { wall: WALL });
    expect(still.wall.checksum, 'camera đứng yên thì hạt đứng yên').toBe(first.wall.checksum);
    // Kéo ngang trên vách giấy (không chạm gà): OrbitControls xoay camera.
    const box = await page.locator('[data-stage] canvas').boundingBox();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.25);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5 + 30, box.y + box.height * 0.25, { steps: 3 });
    await page.mouse.up();
    await expect.poll(() => goc(page), { timeout: 15_000, message: 'kéo 30 px phải xoay camera' }).toBeGreaterThan(5);
    await twoFrames(page);
    const turned = await canvasRegions(page, { wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('hat-diep-xoay.png') });
    expect(turned.wall.checksum, 'xoay camera thì hạt khác lóe').not.toBe(first.wall.checksum);
    expect(log.errors).toEqual([]);
  });

  test('trọng số lệch nhau: Bản màu về 0 thì giấy vẫn như cũ; Phủ bóng về 0 (không tone mapping, không bloom) thì giấy sáng hơn mà không cháy trắng, vẫn ngà', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const base = await canvasRegions(page, { wall: WALL });
    await page.evaluate(() => window.__sma.setWeight('ban-mau', 0));
    await twoFrames(page);
    expect((await canvasRegions(page, { wall: WALL })).wall.checksum, 'Bản màu không đụng tới tờ giấy').toBe(base.wall.checksum);
    await page.evaluate(() => window.__sma.setWeight('ban-mau', 1));
    await page.evaluate(() => window.__sma.setWeight('phu-bong', 0));
    await twoFrames(page);
    const raw = await canvasRegions(page, { wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('phu-bong-0.png') });
    expect(raw.wall.mean, `bỏ tone mapping: ${raw.wall.mean.toFixed(3)}, có: ${base.wall.mean.toFixed(3)}`).toBeGreaterThan(base.wall.mean);
    expect(raw.wall.mean, 'giấy sáng không cháy trắng').toBeLessThan(0.97);
    expect(raw.wall.rgb[0], `vẫn ngà: ${raw.wall.rgb.map(Math.round)}`).toBeGreaterThan(raw.wall.rgb[2] + 10);
    expect(log.errors).toEqual([]);
  });

  test('thí nghiệm Giấy dó trơn: bật thì bỏ lớp điệp và hạt, ảnh đổi; tắt thì về đúng ảnh cũ; không lỗi console', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const before = await canvasRegions(page, { wall: WALL });
    await toggleExperiment(page, 'giay-diep', 'giayTron', true);
    await twoFrames(page);
    const plain = await canvasRegions(page, { wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('giay-do-tron.png') });
    expect(plain.wall.checksum, 'Giấy dó trơn khác giấy quét điệp').not.toBe(before.wall.checksum);
    await toggleExperiment(page, 'giay-diep', 'giayTron', false);
    await twoFrames(page);
    expect((await canvasRegions(page, { wall: WALL })).wall.checksum, 'tắt thì về đúng ảnh cũ').toBe(before.wall.checksum);
    expect(log.errors).toEqual([]);
  });
});
