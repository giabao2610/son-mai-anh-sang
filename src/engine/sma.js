// engine/sma.js — window.__sma: bảng trạng thái công khai của trang, cho e2e và người tò mò mở DevTools

/**
 * `window.__sma` là "ô kính" nhìn vào trang. Playwright đọc nó để biết lúc nào trang đã ổn định
 * (`state` là 'live' hoặc 'static'), đang chạy backend nào, đã vẽ bao nhiêu khung; khi rơi về tầng tĩnh
 * thì `reason` nói vì sao. Có từ GĐ 0, kể cả ở tầng tĩnh.
 *
 * GĐ 2: khi cảnh đã live, `expose()` gắn thêm các hàm của bàn thợ: `layers()`, `setWeight(id, v)`,
 * `snapshot()`, `restore(s)`. Mở DevTools gõ `__sma.setWeight('<id lớp>', 0)` là mài được một lớp.
 * GĐ 3 thêm `quality()` (mức, nấc đang hạ), `degrade()` / `upgrade()` (hạ/nâng tay một nấc) và `stats()`
 * (draw call, tam giác, ms mỗi khung, ms CPU). GĐ 4: `stats().gpuMs`, `quality().gpu`, `quality().locked`, `tools()` và
 * `setTool(id | null)` (bật một công cụ học, hay tắt hết), `dials()` và `setDial(id, v)` (núm của cả bức, ví dụ giờ).
 * GĐ 5: `readouts(layerId)`: số đo riêng của một lớp, như Sổ tay đọc, mà không phải mở Sổ tay (e2e, DevTools).
 *
 * Ngoài hàm, chỉ giữ DỮ LIỆU thuần (chuỗi, số, null), nên `JSON.stringify(window.__sma)` đọc được ngay.
 * @param {Window | Record<string, any>} win
 */
export function createSma(win) {
  const sma = {
    state: 'poster', // luôn bằng body[data-state] (boot nối qua shell.setState → onState)
    tier: null, // tầng dò được: 'webgpu' | 'webgl2' | 'static'
    backend: null, // backend THẬT sau renderer.init() (run.js ghi)
    level: null, // 'cao' | 'vua' | 'thap' (run.js ghi)
    frames: 0,
    reason: null, // vì sao về tầng tĩnh: 'flag' | 'no-gpu' | 'chunk-load' | 'timeout' | 'frame-errors' | ...
    error: null, // message của lỗi, nếu có
    /** Ghép một phần trạng thái: sma.set({ state: 'live' }). */
    set(patch) {
      return Object.assign(sma, patch);
    },
    /** Mỗi khung đã vẽ xong gọi một lần. */
    frame() {
      sma.frames += 1;
    },
    /**
     * Gắn các hàm của một lần dựng cảnh. Trả hàm gỡ: chỉ gỡ đúng những hàm này (sau khi dựng lại cảnh,
     * lần dựng mới đã gắn hàm của nó thì lần gỡ cũ không đụng tới).
     * @param {Record<string, Function>} fns
     * @returns {() => void}
     */
    expose(fns) {
      Object.assign(sma, fns);
      return () => {
        for (const [name, fn] of Object.entries(fns)) if (sma[name] === fn) delete sma[name];
      };
    },
  };
  win.__sma = sma;
  return sma;
}

/**
 * Các hàm của bàn thợ mà window.__sma lộ ra (DevTools, e2e). Luôn đọc bàn thợ HIỆN TẠI qua getStudio(): "Dựng lại cảnh"
 * thay bàn thợ mới, và lúc mất GPU thì chưa có bàn thợ nào (hàm trả null, hay không làm gì).
 * @param {() => any} getStudio  bàn thợ của cảnh đang live (engine/gpu/studio.js), hay null
 * @returns {Record<string, Function>}  truyền thẳng vào sma.expose()
 */
export function studioApi(getStudio) {
  const s = getStudio;
  return {
    layers: () => s()?.layers().map(({ id, name }) => ({ id, name, weight: s().weight(id).value })) ?? [],
    setWeight: (id, v) => s()?.setWeight(id, v),
    snapshot: () => s()?.snapshot() ?? null,
    restore: (snap) => s()?.restore(snap),
    quality: () => s()?.quality() ?? null,
    degrade: () => s()?.degrade(),
    upgrade: () => s()?.upgrade(),
    stats: () => s()?.stats() ?? null,
    tools: () => s()?.tools() ?? [],
    setTool: (id) => s()?.setTool(id),
    dials: () => s()?.dials() ?? [],
    setDial: (id, v) => s()?.setDial(id, v),
    readouts: (layerId) => s()?.readouts(layerId) ?? [],
  };
}
