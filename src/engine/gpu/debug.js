// engine/gpu/debug.js — chế độ thợ: ?debug mở three.js Inspector, ?debug=stats mở stats-gl. Chỉ tải bằng import() động.

/**
 * Cả hai công cụ bật renderer.backend.trackTimestamp mà không hỏi máy; WebGPUBackend chỉ tự kiểm lúc init.
 * Máy không có 'timestamp-query' (nhiều điện thoại) thì WebGPU báo lỗi validation mỗi khung và cảnh rơi về
 * tầng tĩnh ('gpu-error'). Tắt lại sau khi gắn công cụ: biểu đồ GPU để trống, cảnh vẫn chạy.
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
    renderer.inspector = inspector; // Inspector tự gắn bảng của nó vào trang
    keepTimestampsSupported(renderer);
    inspector.domElement.dataset.debug = 'inspector';
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
