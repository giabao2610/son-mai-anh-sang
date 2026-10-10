// e2e/a11y.spec.js — trợ năng (axe-core, WCAG 2 A/AA): tranh tĩnh; cảnh 3D có thanh lớp + Sổ tay, công cụ đang bật, chữ đi theo vật; bàn phím.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { paintings } from '../src/paintings/registry.js';
import { waitForSettled, waitForFrames, gpuReport, collectConsole, readSma, doubleTapAt } from './helpers.js';

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
        // Từng sợi (GĐ 5) khi đã có danh sách lần vẽ: thanh đủ N nấc, "Dệt lại" bấm được, dòng mô tả và tóm tắt đã có chữ.
        await page.evaluate(() => window.__sma.setTool('tung-soi'));
        await expect.poll(async () => Number(await page.locator('#tung-soi-range').getAttribute('max')), { timeout: 30_000 })
          .toBeGreaterThan(0);
        errors.push(...await audit(page, 'Từng sợi'));
        const wipe = page.locator('[data-toolbar] [data-shape="gat"]');
        await page.locator('[data-rail] [data-tool="kinh-mai"]').click();
        await wipe.click();
        errors.push(...await audit(page, 'Kính mài · gạt'));
        expect(errors).toEqual([]);
        expect(log.errors).toEqual([]);
      });

      test('bàn phím: Tab tới lời mời, Enter vào chế độ mài; đi hết thanh lớp, Đồ nghề, thanh giờ, Sổ tay; Escape đóng Sổ tay; từ nút Từng sợi, Tab qua phần còn lại của thanh lớp rồi tới thanh và nút của nó (khung hẹp, máy tính)', async ({
        page,
      }, testInfo) => {
        test.setTimeout(120_000);
        await page.goto(urlOf(htmlPage, testInfo.project.metadata.query, 'at=2026-09-28T21:00'));
        expect((await waitForSettled(page, { timeout: 60_000 })).state).toBe('live');
        const focused = () => page.evaluate(() => {
          const el = document.activeElement;
          return el ? `${el.tagName.toLowerCase()}${el.closest('[data-rail]') ? '@rail' : ''}${el.closest('[data-notebook]') ? '@nb' : ''}`
            + `${el.closest('[data-hint]') ? '@hint' : ''}${el.closest('[data-toolbar]') ? '@tool' : ''}`
            + `${el.getAttribute('role') ? `[${el.getAttribute('role')}]` : ''}`
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
        // Từng sợi (GĐ 5): Enter trên nút Đồ nghề bật công cụ. Thanh công cụ đứng ngay sau thanh lớp trong trang, nên Tab đi qua
        // phần còn lại của thanh lớp rồi vào thẳng thanh và nút "Dệt lại" (WCAG 2.4.3): không vòng về đầu trang, không qua Sổ tay.
        // "Dệt lại" bị khóa tới khi có danh sách lần vẽ, mà Tab bỏ qua nút bị khóa: chờ danh sách trước khi đi.
        const weave = page.locator('[data-rail] [data-tool="tung-soi"]');
        await weave.focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('body')).toHaveAttribute('data-tool', 'tung-soi');
        const range = page.locator('#tung-soi-range');
        await expect.poll(async () => Number(await range.getAttribute('max')), { timeout: 30_000 }).toBeGreaterThan(0);
        /** Các điểm dừng của n lần Tab, tính từ nút Từng sợi trên thanh lớp. */
        const tabsFromWeave = async (n) => {
          await weave.focus();
          const stops = [];
          for (let i = 0; i < n; i += 1) {
            await page.keyboard.press('Tab');
            stops.push(await focused());
          }
          return stops;
        };
        // Phần còn lại của thanh lớp sau nút Từng sợi: nút Đồ nghề đứng sau nó (nếu có), thanh giờ, "Phủ lớp tiếp theo" (chế độ
        // mài: các lớp còn ở 0), nút đóng × (đứng đầu thanh trên máy tính nhưng cuối thanh trong trang).
        const tools = (await page.evaluate(() => window.__sma.tools())).map((x) => x.id);
        const laterTools = tools.slice(tools.indexOf('tung-soi') + 1).map((id) => `button@rail:${id}`);
        const next = (await page.locator('[data-rail] .rail-next').isVisible()) ? ['button@rail'] : [];
        // GĐ 9: mục Công thức (nút "Chép link công thức") nằm trong thanh lớp, sau Đồ nghề và thanh giờ, trước "Phủ lớp tiếp theo".
        const recipeStops = ['button@rail'];
        const toolStops = ['input@tool:range', 'button@tool'];
        // Khung hẹp (640px, như điện thoại): thanh giờ ở sau nút nhỏ "◷ 21:00", ô trượt đã mở ở lượt đi trên; Sổ tay thu lại.
        if (dials.length > 0) await expect(page.locator('[data-rail] .dial-chip')).toHaveAttribute('aria-expanded', 'true');
        const narrowDials = dials.length > 0 ? ['button@rail:chip', ...dials.map(() => 'input@rail:range')] : [];
        const narrow = [...laterTools, ...narrowDials, ...recipeStops, ...next, 'button@rail', ...toolStops];
        expect(await tabsFromWeave(narrow.length), 'khung hẹp: từ nút Từng sợi tới bảng của nó').toEqual(narrow);
        // Máy tính: thanh giờ nằm thẳng trong thanh lớp, và Sổ tay (mở lại, đủ chỗ ở 1280px) đứng SAU bảng công cụ.
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.locator(`[data-rail] [data-layer="${meta.layers[0].id}"] .rail-name`).click();
        await expect(page.locator('[data-notebook]')).toBeVisible();
        const wide = [...laterTools, ...dials.map(() => 'input@rail:range'), ...recipeStops, ...next, 'button@rail', ...toolStops, 'button@nb'];
        expect(await tabsFromWeave(wide.length), 'máy tính: từ nút Từng sợi tới bảng của nó, rồi Sổ tay').toEqual(wide);
        // Mũi tên trên thanh đổi sợi đang xem; trình đọc màn hình nghe qua aria-valuetext.
        await range.focus();
        const valuetext = await range.getAttribute('aria-valuetext');
        await page.keyboard.press('ArrowLeft');
        await expect(range).not.toHaveAttribute('aria-valuetext', valuetext);
        expect(log.errors).toEqual([]);
      });
    });
  });
}

/**
 * Chữ đi theo vật (GĐ 5): Bức 1 hiện một cặp câu cạnh hoa đăng khi người xem chạm hai lần lên nước. Cảnh đứng yên ở khung 10
 * (?freeze): giờ của chữ tính theo đồng hồ cảnh, nên chữ ở lại suốt lúc axe quét.
 */
test.describe('Ao Sen Đêm · a11y khi có chữ đi theo vật (GĐ 5)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const { kind, backend } = testInfo.project.metadata;
    test.skip(kind !== '3d', 'chỉ chạy ở project 3D');
    if (backend === 'webgpu') {
      await page.goto('./?static');
      test.skip(!(await gpuReport(page)).webgpu, 'Không có WebGPU adapter trong môi trường này');
    }
  });

  test('thả hoa đăng: vùng chữ (aria-live) có cặp câu và nguồn; không lỗi serious/critical', async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    const { query } = testInfo.project.metadata;
    await page.goto(`./?${query.replace(/^\?/, '')}&at=2026-09-28T21:00&freeze=10`);
    const settled = await waitForSettled(page, { timeout: 60_000 });
    expect(settled.state, `về tầng tĩnh: ${settled.reason} · ${settled.error}`).toBe('live');
    await waitForFrames(page, 10, { timeout: 60_000 });
    await doubleTapAt(page, 0.5, 0.8); // mặt nước ngay trước camera (WATER của ao-sen-dem.spec.js)
    const caption = page.locator('[data-captions] .caption');
    await expect(caption).toHaveAttribute('data-shown', '');
    await expect(caption, 'điểm neo của chữ phải ở trong khung').not.toHaveAttribute('data-away');
    // Chờ chữ hiện hẳn (mờ dần 0,8 s): axe đo độ tương phản của chữ đã hiện, không phải chữ đang mờ.
    await expect.poll(() => caption.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    await expect(caption.locator('.caption-line')).not.toHaveCount(0);
    await expect(caption.locator('.caption-cite cite')).not.toBeEmpty();
    expect(await audit(page, 'chữ đi theo vật')).toEqual([]);
    expect(log.errors).toEqual([]);
  });
});
