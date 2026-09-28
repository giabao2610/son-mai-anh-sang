// engine/gpu/debug.js — chế độ thợ: ?debug mở three.js Inspector, ?debug=stats mở stats-gl. Chỉ tải bằng import() động.

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
    await stats.init(renderer); // bật đo thời gian GPU (timestamp query) nếu máy hỗ trợ
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
