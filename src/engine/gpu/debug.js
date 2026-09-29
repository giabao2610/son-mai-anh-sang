// engine/gpu/debug.js — chế độ thợ: ?debug mở three.js Inspector, ?debug=stats mở stats-gl. Chỉ tải bằng import() động.

/**
 * Cả hai công cụ đặt renderer.backend.trackTimestamp = true TRƯỚC, rồi mới hỏi hasFeature('timestamp-query'):
 * stats-gl chỉ bỏ biểu đồ GPU, Inspector chỉ ghi một dòng lỗi vào bảng của nó; không bên nào tắt lại cờ.
 * WebGPUBackend chỉ tự kiểm lúc init, nên máy không có 'timestamp-query' (nhiều điện thoại) báo lỗi validation
 * mỗi khung và cảnh rơi về tầng tĩnh ('gpu-error'). Tắt lại sau khi gắn công cụ: biểu đồ GPU để trống, cảnh vẫn chạy.
 * @param {any} renderer
 */
function keepTimestampsSupported(renderer) {
  if (renderer.hasFeature('timestamp-query') !== true) renderer.backend.trackTimestamp = false;
}

/**
 * Hai công cụ không bật cùng lúc (cờ ?debug chỉ có một giá trị). Cả hai chỉ tải khi có cờ,
 * nên người xem bình thường không tốn byte nào. Inspector dùng localStorage nên không import tĩnh được.
 * @param {false | true | 'stats'} mode  flags.debug
 * @param {any} renderer
 * @param {Document} [doc]
 * @returns {Promise<{ update: () => void, dispose: () => void } | null>}
 */
export async function mountDebug(mode, renderer, doc = globalThis.document) {
  if (mode === 'stats') {
    const { default: Stats } = await import('stats-gl');
    const stats = new Stats({ trackGPU: true });
    await stats.init(renderer); // bật đo thời gian GPU (timestamp query)
    keepTimestampsSupported(renderer);
    stats.dom.dataset.debug = 'stats';
    doc.body.append(stats.dom);
    return {
      update() {
        // Đọc kết quả timestamp của các khung trước (bất đồng bộ), rồi vẽ lại biểu đồ.
        renderer.resolveTimestampsAsync().catch(() => {});
        stats.update();
      },
      dispose() {
        stats.dispose();
        stats.dom.remove();
      },
    };
  }
  if (mode) {
    const { Inspector } = await import('three/addons/inspector/Inspector.js');
    const inspector = new Inspector();
    renderer.inspector = inspector;
    keepTimestampsSupported(renderer);
    inspector.domElement.dataset.debug = 'inspector';
    // Inspector tự gắn bảng vào CHA của canvas ([data-stage]). Ô đó là position: fixed nên thành một stacking context
    // nằm dưới lớp chữ (.frame): bảng bị chữ đè. Đợi Inspector gắn xong (một nhịp microtask) rồi dời bảng ra body.
    await Promise.resolve();
    doc.body.append(inspector.domElement);
    return {
      update() {},
      dispose() {
        inspector.dispose();
        inspector.domElement.remove();
      },
    };
  }
  return null;
}

/**
 * Như mountDebug nhưng KHÔNG BAO GIỜ ném: tải hỏng (mạng yếu, chunk cũ sau một lần deploy) thì cảnh báo và trả null.
 * run.js gọi hàm này SAU khi cảnh đã live, nên việc tải công cụ không tính vào hạn 10 giây, và chế độ thợ
 * không bao giờ làm hỏng cảnh.
 * @param {false | true | 'stats'} mode
 * @param {any} renderer
 * @param {Document} [doc]
 */
export async function openDebug(mode, renderer, doc = globalThis.document) {
  if (!mode) return null;
  try {
    return await mountDebug(mode, renderer, doc);
  } catch (err) {
    console.warn('Không mở được công cụ ?debug:', err);
    return null;
  }
}
