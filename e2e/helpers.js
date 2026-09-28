// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas, báo GPU, gom lỗi console.

/** Cảnh báo API cũ mà three in ra lúc chạy (spec §3: e2e bắt các cảnh báo này). */
export const DEPRECATION = /deprecated|renamed|has been removed/i;

/** Bản sao dữ liệu của window.__sma (bỏ hàm set/frame, vì hàm không gửi qua evaluate được). */
export function readSma(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(window.__sma ?? null)));
}

/** Chờ trang ổn định: __sma.state là 'live' hoặc 'static'. Trả bản sao __sma. */
export async function waitForSettled(page, { timeout = 30_000 } = {}) {
  await page.waitForFunction(() => ['live', 'static'].includes(window.__sma?.state), null, { timeout });
  return readSma(page);
}

/**
 * Chờ tới khi đã vẽ ít nhất n khung (hoặc trang về tĩnh), rồi đợi thêm 10 nhịp requestAnimationFrame.
 * 10 nhịp thêm đó để chứng minh vòng lặp của ?freeze=N đã DỪNG: nếu chưa dừng, frames sẽ vượt n.
 */
export async function waitForFrames(page, n, { timeout = 30_000 } = {}) {
  await page.waitForFunction(
    (min) => window.__sma && (window.__sma.frames >= min || window.__sma.state === 'static'),
    n,
    { timeout },
  );
  await page.evaluate(() => new Promise((resolve) => {
    let left = 10;
    const tick = () => (--left <= 0 ? resolve() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }));
  return readSma(page);
}

/** Stylesheet chỉ áp lúc chụp: ẩn mọi con của body trừ [data-stage] (poster, tên, thơ, huy hiệu, con dấu). */
const STAGE_ONLY = 'body > :not([data-stage]) { visibility: hidden !important; }';

/**
 * Chụp canvas bằng locator.screenshot() rồi giải mã PNG ngay trong trang (không cần thư viện PNG ở Node).
 * Ảnh chụp là một vùng của trang, nên lớp chữ vẽ đè lên canvas cũng lọt vào. Vì vậy lúc chụp ẩn lớp đó
 * (tùy chọn `style`, không phụ thuộc bức nào): số đo chỉ nói về canvas, và canvas đen cho bright ≈ 0.
 * Không dùng canvas.toDataURL(): với WebGL2 nó trả ảnh đen vì three không bật preserveDrawingBuffer.
 * bright = tỉ lệ pixel có kênh lớn nhất > 60; dark = tỉ lệ pixel có kênh lớn nhất < 30.
 */
export async function canvasStats(page, selector = '[data-stage] canvas') {
  const png = await page.locator(selector).screenshot({ style: STAGE_ONLY });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, img.width, img.height).data;
    let bright = 0;
    let dark = 0;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) {
      const m = Math.max(d[i], d[i + 1], d[i + 2]);
      if (m > 60) bright += 1;
      if (m < 30) dark += 1;
      sum += d[i] + d[i + 1] + d[i + 2];
    }
    const n = img.width * img.height;
    return { width: img.width, height: img.height, bright: bright / n, dark: dark / n, checksum: sum };
  }, png.toString('base64'));
}

/** Hỏi thẳng trình duyệt nó có GPU gì (để bỏ qua test WebGPU khi không có adapter). */
export async function gpuReport(page) {
  return page.evaluate(async () => {
    const out = { webgpu: null, webgl2: null };
    const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
    if (adapter) {
      const { vendor, architecture, device, description, isFallbackAdapter } = adapter.info;
      out.webgpu = { vendor, architecture, device, description, isFallbackAdapter };
    }
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) out.webgl2 = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return out;
  });
}

/**
 * Gom console của trang TỪ LÚC GỌI (gọi trước page.goto).
 * errors: console.error + lỗi JS không bắt; warnings: cảnh báo khớp DEPRECATION; all: mọi dòng (để đính kèm khi hỏng).
 */
export function collectConsole(page) {
  const log = { errors: [], warnings: [], all: [] };
  page.on('console', (msg) => {
    const text = msg.text();
    log.all.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') log.errors.push(text);
    else if (msg.type() === 'warning' && DEPRECATION.test(text)) log.warnings.push(text);
  });
  page.on('pageerror', (err) => {
    log.all.push(`[pageerror] ${err.stack ?? err.message}`);
    log.errors.push(err.message);
  });
  return log;
}
