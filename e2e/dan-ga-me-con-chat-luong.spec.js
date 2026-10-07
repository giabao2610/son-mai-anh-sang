// e2e/dan-ga-me-con-chat-luong.spec.js — Bức 4 · Đàn Gà Mẹ Con, chất lượng (spec §20.8): mức cao không quá 30 draw call; ?level=thap chạy được (đúng mức, đúng ngân sách, tờ giấy sáng giữa hai dải ván tối); bật rồi tắt từng thí nghiệm của năm lớp riêng không lỗi console. Tiện ích và các vùng dùng chung ở e2e/dan-ga-me-con.helpers.js.
import { test, expect } from '@playwright/test';
import { canvasRegions, collectConsole, toggleExperiment, twoFrames, waitForFrames } from './helpers.js';
import { BOARD_TOP, SMOKE, WALL, open, skipWithoutWebgpu } from './dan-ga-me-con.helpers.js';

test.beforeEach(skipWithoutWebgpu);

test.describe('Đàn Gà Mẹ Con · chất lượng', () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.metadata.kind !== '3d', 'chỉ chạy ở project 3D');
  });

  test('mức cao: không quá 30 draw call (giấy, gà mẹ ba mesh, gà con, thóc, cộng bloom, FXAA, quad)', SMOKE, async ({ page }, testInfo) => {
    await open(page, testInfo, 0, '&level=cao');
    await waitForFrames(page, 30, { timeout: 120_000 });
    expect(await page.evaluate(() => window.__sma.level)).toBe('cao');
    const calls = await page.evaluate(() => window.__sma.stats().drawCalls);
    expect(calls).toBeGreaterThan(0);
    expect(calls).toBeLessThanOrEqual(30);
  });

  test('?level=thap chạy được: cảnh live ở mức thấp với ngân sách của mức (24 vòng, 1024 hạt thóc), tờ giấy vẫn sáng giữa hai dải ván tối', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30, '&level=thap');
    expect(await page.evaluate(() => window.__sma.level)).toBe('thap');
    const { knobs } = await page.evaluate(() => window.__sma.snapshot());
    expect([knobs['cot.segments'], knobs['dan-ga.count']]).toEqual([24, 1024]);
    const r = await canvasRegions(page, { top: BOARD_TOP, wall: WALL });
    await page.screenshot({ path: testInfo.outputPath('muc-thap.png') });
    expect(r.wall.mean).toBeGreaterThan(r.top.mean + 0.15);
    expect(log.errors).toEqual([]);
  });

  test('bật rồi tắt từng thí nghiệm của năm lớp riêng: không lỗi console', async ({ page }, testInfo) => {
    const log = collectConsole(page);
    await open(page, testInfo, 30);
    const all = [['cot', 'biaPhang'], ['ban-mau', 'toMin'], ['ban-net', 'chiNet'], ['ban-net', 'netTheoMau'], ['giay-diep', 'giayTron'],
      ['dan-ga', 'toTheoLuong']];
    for (const [layer, exp] of all) {
      await toggleExperiment(page, layer, exp, true);
      await twoFrames(page);
      await toggleExperiment(page, layer, exp, false);
    }
    expect(log.errors).toEqual([]);
  });
});
