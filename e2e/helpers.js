// e2e/helpers.js — Tiện ích e2e: chờ __sma ổn định, chờ khung, đọc pixel canvas (cả khung và từng vùng), báo GPU, gom lỗi console.

/** Cảnh báo API cũ mà three in ra lúc chạy (spec §3: e2e bắt các cảnh báo này). */
export const DEPRECATION = /deprecated|renamed|has been removed/i;

/**
 * Tỉ lệ điểm tối tối thiểu của một ảnh "có sáng có tối" (không cháy trắng, không trống). GĐ 3 có trời chàm và sương
 * nên ít điểm đen tuyệt đối hơn nền đen then trước đó (đo được 7–8% ở khung 10): 3% vẫn đủ chứng minh ảnh có vùng tối.
 */
export const DARK = 0.03;

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

/**
 * Stylesheet chỉ áp lúc chụp: ẩn mọi con của body trừ [data-stage] (poster, tên, thơ, huy hiệu, con dấu), và chữ đi theo vật
 * (GĐ 5): vùng chữ nằm TRONG [data-stage], ngay trên chỗ chạm, nên không ẩn thì ảnh quanh chỗ chạm đổi vì chữ chứ không vì cảnh.
 */
const STAGE_ONLY = 'body > :not([data-stage]), [data-captions] { visibility: hidden !important; }';

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

/** Cả khung (tọa độ 0–1): vùng mặc định của canvasRegions. */
export const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };

/**
 * Số đo của từng VÙNG canvas (GĐ 4, công cụ học): vùng là hình chữ nhật { x0, y0, x1, y1 } theo tỉ lệ khung (0–1), có thể
 * kèm `ring: { r, inside }` để chỉ lấy điểm trong (inside: true) hay ngoài một vòng tròn giữa khung bán kính r × cạnh ngắn.
 * Mỗi vùng: checksum, độ sáng trung bình (0–1), độ lệch chuẩn độ sáng, sắc độ trung bình (chroma = (max − min) / 255: đo
 * theo tuyệt đối, vì độ bão hòa (max − min) / max thổi phồng những điểm gần đen như nền đen then), và `transparent`: số
 * điểm canvas trong suốt. Lúc chụp, nền trang tô màu hồng sen (#ff00ff): điểm trong suốt để lộ nền ấy ra.
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, { x0: number, y0: number, x1: number, y1: number, ring?: { r: number, inside: boolean } }>} regions
 */
export async function canvasRegions(page, regions = { all: FULL }, selector = '[data-stage] canvas') {
  const style = `${STAGE_ONLY} html, body { background: #ff00ff !important; }`;
  const png = await page.locator(selector).screenshot({ style });
  return page.evaluate(async ({ b64, regions: wanted }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const { width: w, height: h } = img;
    const c = new OffscreenCanvas(w, h);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h).data;
    const out = {};
    for (const [name, r] of Object.entries(wanted)) {
      let n = 0;
      let sum = 0;
      let sumL = 0;
      let sumL2 = 0;
      let sumS = 0;
      let transparent = 0;
      const radius = r.ring ? r.ring.r * Math.min(w, h) : 0;
      for (let y = Math.floor(r.y0 * h); y < Math.floor(r.y1 * h); y++) {
        for (let x = Math.floor(r.x0 * w); x < Math.floor(r.x1 * w); x++) {
          if (r.ring && (Math.hypot(x + 0.5 - w / 2, y + 0.5 - h / 2) < radius) !== r.ring.inside) continue;
          const i = (y * w + x) * 4;
          const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
          const max = Math.max(R, G, B);
          const min = Math.min(R, G, B);
          const l = (0.2126 * R + 0.7152 * G + 0.0722 * B) / 255;
          n += 1;
          sum += (R * 3 + G * 5 + B * 7) * ((x % 13) + 1);
          sumL += l;
          sumL2 += l * l;
          sumS += (max - min) / 255;
          if (R > 240 && G < 20 && B > 240) transparent += 1;
        }
      }
      const mean = sumL / n;
      out[name] = { checksum: sum, mean, std: Math.sqrt(Math.max(sumL2 / n - mean * mean, 0)), chroma: sumS / n, transparent };
    }
    return out;
  }, { b64: png.toString('base64'), regions });
}

/** Chờ hai nhịp requestAnimationFrame: vẽ lại khung đứng yên (?freeze) xảy ra ở nhịp kế tiếp sau thay đổi. */
export function twoFrames(page) {
  return page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
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
