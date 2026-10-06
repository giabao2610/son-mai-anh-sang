// e2e/dan-ga-me-con-dan-ga.spec.js — Bức 4 · Đàn Gà Mẹ Con, lớp Đàn gà: chạm vào sàn thì thóc rắc thêm và gà con tới mổ; giữ thì gà mẹ gọi con, thả thì tản; mài Đàn gà về 0 khi thóc đang rơi rồi chạm thì không lỗi, phủ lại không có nắm cũ bung ra. Chạy live (đồng hồ của cảnh theo khung vẽ): chờ bằng poll theo số đo, trần rộng tay như Bức 3. Tiện ích dùng chung ở e2e/dan-ga-me-con.helpers.js.
import { test, expect } from '@playwright/test';
import { collectConsole, pressAt, tapAt, waitForFrames } from './helpers.js';
import { SMOKE, open, skipWithoutWebgpu } from './dan-ga-me-con.helpers.js';

/**
 * Giữa sàn bên trái (phần của canvas): điểm (−4,5; 2,5) trên sàn, xa mép (thóc rơi đúng chỗ chạm, không bị kéo vào tâm vòng) và xa mẹ; ba bốn
 * gà con ở gần chạy tới được.
 */
const MID_FLOOR = [0.287, 0.7];
/** Giữa sàn bên phải: điểm (4,5; 2,5). */
const MID_FLOOR_RIGHT = [0.713, 0.7];
/** Vách giấy phía trên gà mẹ: giữ ở đây không kéo trúng gà, không rắc thóc lên sàn. */
const WALL_TOP = [0.5, 0.25];

test.beforeEach(skipWithoutWebgpu);

test.describe('Đàn Gà Mẹ Con · đàn gà', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });
  const read = (page, id) => page.evaluate((r) => Number(window.__sma.readouts('dan-ga').find((x) => x.id === r)?.value), id);

  test('chạm vào giữa sàn thì thóc rắc thêm (rac tăng); có gà con tới mổ', SMOKE, async ({ page }, testInfo) => {
    // Giảm chuyển động: gà mẹ không bới, nên chỉ cú chạm sinh mổ. Chờ các con ở nhúm thóc lúc mở trang bắt đầu mổ (sau 0,1–0,4 giây phản xạ)
    // rồi thôi mổ (chừng 8 giây cảnh) trước khi chạm: lúc mới mở trang chưa con nào mổ, chờ số 0 ngay lúc ấy là chờ suông.
    const log = collectConsole(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, testInfo, 0);
    await expect.poll(() => read(page, 'dangAn'), { timeout: 60_000 }).toBeGreaterThan(0);
    await expect.poll(() => read(page, 'dangAn'), { timeout: 180_000 }).toBe(0);
    const before = await read(page, 'rac');
    expect(before, 'nhúm lúc mở trang đã rắc').toBeGreaterThan(0);
    await tapAt(page, ...MID_FLOOR);
    await expect.poll(() => read(page, 'rac'), { timeout: 30_000 }).toBeGreaterThan(before);
    await expect.poll(() => read(page, 'dangAn'), { timeout: 60_000 }).toBeGreaterThan(0);
    await page.screenshot({ path: testInfo.outputPath('ga-con-mo.png') });
    expect(log.errors).toEqual([]);
  });

  test('giữ thì gà mẹ gọi con: quanhMe ≤ 4 trước khi giữ, ≥ 8 khi giữ đủ lâu; thả thì giảm dần', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 10, { timeout: 120_000 });
    expect(await read(page, 'quanhMe')).toBeLessThanOrEqual(4);
    const lift = await pressAt(page, ...WALL_TOP);
    await expect.poll(() => read(page, 'quanhMe'), { timeout: 120_000 }).toBeGreaterThanOrEqual(8);
    await page.screenshot({ path: testInfo.outputPath('goi-con.png') });
    await lift();
    await expect.poll(() => read(page, 'quanhMe'), { timeout: 120_000 }).toBeLessThanOrEqual(4);
    expect(log.errors).toEqual([]);
  });

  test('mài Đàn gà về 0 khi thóc đang rơi, rồi chạm: không lỗi console; phủ lại thì không có nắm cũ bung ra', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 0);
    await waitForFrames(page, 10, { timeout: 120_000 });
    await tapAt(page, ...MID_FLOOR_RIGHT);
    await page.evaluate(() => window.__sma.setWeight('dan-ga', 0));
    const before = await read(page, 'rac');
    await tapAt(page, ...MID_FLOOR);
    await waitForFrames(page, (await page.evaluate(() => window.__sma.frames)) + 10, { timeout: 60_000 });
    await page.evaluate(() => window.__sma.setWeight('dan-ga', 1));
    await waitForFrames(page, (await page.evaluate(() => window.__sma.frames)) + 10, { timeout: 60_000 });
    expect(await read(page, 'rac')).toBe(before);
    expect(log.errors).toEqual([]);
  });
});
