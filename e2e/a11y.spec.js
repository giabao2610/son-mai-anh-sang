// e2e/a11y.spec.js — trợ năng (axe-core, WCAG 2 A/AA): tranh tĩnh; cảnh 3D có thanh lớp + Sổ tay (ba tab); khi một công cụ bật; đi hết bằng bàn phím.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { paintings } from '../src/paintings/registry.js';
import { waitForSettled, gpuReport, collectConsole, readSma } from './helpers.js';

/** Luật WCAG 2.0 và 2.1, mức A và AA (spec §12). */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Quét trang bằng axe-core; chỉ lỗi mức serious hay critical làm hỏng test (spec §12). Trả danh sách lỗi đọc được:
 * luật, mức, lời giải thích và vài phần tử bị bắt, để biết sửa ở đâu.
 */
async function audit(page, where) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${where} · ${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`);
}

/** URL tương đối của trang một bức (xem painting.spec.js). */
function urlOf(htmlPage, ...parts) {
  const dir = htmlPage.replace(/index\.html$/, '');
  const query = parts.map((p) => p.replace(/^\?/, '')).filter(Boolean).join('&');
  return `./${dir}${query ? `?${query}` : ''}`;
}

let log;
test.beforeEach(({ page }) => {
  log = collectConsole(page);
});
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  const sma = await readSma(page).catch(() => null);
  await testInfo.attach('sma.txt', { body: JSON.stringify(sma, null, 2), contentType: 'text/plain' });
  await testInfo.attach('console.txt', { body: log.all.join('\n') || '(console trống)', contentType: 'text/plain' });
});

for (const { meta, page: htmlPage } of paintings) {
  test.describe(`${meta.title} · a11y`, () => {
    test('tranh tĩnh (?static) và Sổ tay chỉ đọc: không lỗi serious/critical', async ({ page }, testInfo) => {
      test.skip(testInfo.project.metadata.kind !== 'static', 'chỉ chạy ở project static');
      await page.goto(urlOf(htmlPage, 'static'));
      expect((await waitForSettled(page)).state).toBe('static');
      const errors = await audit(page, 'tĩnh');
      await page.locator('[data-static] button').click();
      await expect(page.locator('[data-rail]')).toBeVisible();
      errors.push(...await audit(page, 'Sổ tay chỉ đọc'));
      expect(errors).toEqual([]);
    });

    test.describe('cảnh 3D', () => {
      test.beforeEach(async ({ page }, testInfo) => {
        const { kind, backend } = testInfo.project.metadata;
        test.skip(kind !== '3d', 'chỉ chạy ở project 3D');
        if (backend === 'webgpu') {
          await page.goto(urlOf(htmlPage, 'static'));
          test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
        }
      });

      /** Mở cảnh, chạm canvas (lần tương tác đầu), bấm lời mời: thanh lớp và Sổ tay mở ở chế độ mài. */
      async function openWorkshop(page, testInfo) {
        await page.goto(urlOf(htmlPage, testInfo.project.metadata.query, 'at=2026-09-28T21:00'));
        const settled = await waitForSettled(page, { timeout: 60_000 });
        expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
        const box = await page.locator('[data-stage] canvas').boundingBox();
        await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.8);
        await page.locator('[data-hint] button').click();
        await expect(page.locator('[data-notebook]')).toBeVisible();
      }

      test('thanh lớp + Sổ tay (Hiểu, Chỉnh, Phá) và khi một công cụ bật: không lỗi serious/critical', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await openWorkshop(page, testInfo);
        const notebook = page.locator('[data-notebook]');
        const errors = await audit(page, 'Hiểu');
        await notebook.locator('[data-tab="chinh"]').click();
        await expect(notebook.locator('[data-knobs]')).toHaveAttribute('data-state', /^(ready|empty)$/);
        errors.push(...await audit(page, 'Chỉnh'));
        await notebook.locator('[data-tab="pha"]').click();
        errors.push(...await audit(page, 'Phá'));
        for (const { id } of await page.evaluate(() => window.__sma.tools())) {
          await page.locator(`[data-rail] [data-tool="${id}"]`).click();
          await expect(page.locator('body')).toHaveAttribute('data-tool', id);
          errors.push(...await audit(page, `công cụ ${id}`));
        }
        const wipe = page.locator('[data-toolbar] [data-shape="gat"]');
        await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
        await wipe.click();
        errors.push(...await audit(page, 'Kính mài · gạt'));
        expect(errors).toEqual([]);
        expect(log.errors).toEqual([]);
      });

      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay', async ({
        page,
      }, testInfo) => {
        test.setTimeout(120_000);
        await page.goto(urlOf(htmlPage, testInfo.project.metadata.query, 'at=2026-09-28T21:00'));
        expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
        const focused = () => page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName.toLowerCase()}${el.closest('[data-rail]') ? '@rail' : ''}${el.closest('[data-notebook]') ? '@nb' : ''}`
            + `${el.closest('[data-hint]') ? '@hint' : ''}${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}`
            + `${el.dataset.tool ? `:${el.dataset.tool}` : ''}${el.type === 'range' ? ':range' : ''}`
            + `${el.classList.contains('dial-chip') ? ':chip' : ''}` : 'none';
        });
        // Người chỉ dùng bàn phím: phím đầu tiên là lần tương tác đầu, lời mời (một nút) hiện ra và Tab tới được.
        let reached = false;
        for (let i = 0; i < 8 && !reached; i += 1) {
          await page.keyboard.press('Tab');
          reached = (await focused()).includes('@hint');
        }
        expect(reached, 'Tab không tới được lời mời').toBe(true);
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-rail]')).toBeVisible();
        const seen = new Set();
        for (let i = 0; i < 40; i += 1) {
          await page.keyboard.press('Tab');
          const at = await focused();
          seen.add(at);
          // Khung hẹp (điện thoại): thanh giờ nằm sau nút nhỏ "◷ 21:00"; Enter mở ô trượt, Tab đi tiếp vào đó.
          if (at.endsWith(':chip') && (await page.locator('[data-rail] .dial-chip').getAttribute('aria-expanded')) !== 'true') {
            await page.keyboard.press('Enter');
          }
        }
        const walk = [...seen].join(', ');
        expect(walk, 'tên lớp trên thanh lớp').toContain('button@rail');
        expect(walk, 'công tắc lớp').toContain('button@rail[switch]');
        for (const { id } of await page.evaluate(() => window.__sma.tools())) expect(walk, `nút Đồ nghề "${id}"`).toContain(`@rail:${id}`);
        const dials = await page.evaluate(() => window.__sma.dials());
        if (dials.length > 0) {
          expect(walk, 'thanh trượt của Dial').toContain('input@rail:range');
          await page.locator(`[data-rail] #dial-${dials[0].id}`).focus();
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => page.evaluate(() => window.__sma.dials()[0].value)).toBe(dials[0].value + dials[0].step);
        }
        expect(walk, 'các tab của Sổ tay').toContain('button@nb[tab]');
        // Mũi tên đổi tab (mẫu tab của ARIA), Escape đóng Sổ tay mà thanh lớp vẫn mở.
        await page.locator('[data-notebook] [role="tab"][aria-selected="true"]').focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('[data-notebook] [data-tab="chinh"]')).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Escape');
        await expect(page.locator('[data-notebook]')).toBeHidden();
        await expect(page.locator('[data-rail]')).toBeVisible();
        expect(log.errors).toEqual([]);
      });
    });
  });
}
