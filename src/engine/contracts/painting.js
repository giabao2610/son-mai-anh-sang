// engine/contracts/painting.js — hợp đồng NHẸ của một bức (chỉ JSDoc, không three): meta, cửa vào, dòng registry, chữ.
/**
 * Căn cước một bức: src/paintings/<slug>/meta.js. Dữ liệu thuần, JSON.stringify được.
 * @typedef {Object} PaintingMeta
 * @property {string} slug        'ao-sen-dem' = tên thư mục = khóa test. Đã deploy thì KHÔNG đổi.
 * @property {number} no          số thứ tự trong bộ tranh (Bức 1)
 * @property {string} title       'Ao Sen Đêm'
 * @property {string} tagline     một câu cho <meta name="description"> và og:description
 * @property {Poem} poem          thơ của cả bức; phải in sẵn trong HTML tĩnh (test so khớp)
 * @property {Poster} poster
 * @property {string} [og]        đường dẫn trong public/, KHÔNG có '/' đầu: 'paintings/ao-sen-dem/og.png' (GĐ 4)
 * @property {LayerMeta[]} layers THỨ TỰ PHỦ. [0].id === 'cot'. Số lớp = layers.length.
 * @property {Record<string, string>} [palette]  thêm/ghi đè token của chất liệu
 * @property {string[]} [fence]   từ vựng riêng của bức mà xưởng không được dùng (chỉ test đọc)
 */
/** @typedef {Object} Poem
 * @property {string[]} lines
 * @property {string} source      'Ca dao' | 'Truyện Kiều'… BẮT BUỘC
 * @property {string} [author]    'Nguyễn Du'
 */
/** @typedef {Object} Poster
 * @property {string} src         ĐÚNG giá trị src trong HTML nguồn: '/paintings/ao-sen-dem/poster.svg'
 * @property {number} width       để bố cục không nhảy khi ảnh về
 * @property {number} height
 * @property {string} alt
 */
/** @typedef {Object} LayerMeta
 * @property {string} id          kebab-case không dấu, duy nhất trong bức: 'mat-nuoc'
 * @property {string} name        'Mặt nước': hiện trên thanh lớp, kể cả ở tầng tĩnh
 * @property {string[]} files     file mà lớp SỞ HỮU, tính từ src/; file đầu hiện trong Sổ tay.
 *                                Marker '// @knob' chỉ hợp lệ trong các file này; mỗi file thuộc tối đa MỘT lớp.
 * @property {Poem} [poem]        câu thơ riêng của lớp
 */
/** Cửa vào NHẸ: src/paintings/<slug>/index.js. Trang HTML import thẳng file này: `export default { meta, load, content }`.
 * @typedef {Object} PaintingEntry
 * @property {PaintingMeta} meta
 * @property {() => Promise<import('./runtime.js').Painting>} load   chỉ tầng A/B gọi (kéo theo three)
 * @property {Record<string, () => Promise<{ default: PaintingContent }>>} [content]   [1] { vi: () => import('./content.vi.js') }
 */
/** Một dòng registry: { meta, page: 'index.html', lang: 'vi' }. Mỗi trang một ngôn ngữ. */
/** Chữ của một bức trong MỘT ngôn ngữ: content.<lang>.js. Mọi nhãn tra theo id.
 * @typedef {Object} PaintingContent
 * @property {string} hint                              'Chạm vào mặt nước'
 * @property {Record<string, DialText>} [dials]         khóa = Dial.id
 * @property {Record<string, LayerContent>} [layers]    khóa = LayerMeta.id (bắt buộc từ GĐ 2)
 */
/** @typedef {{ label: string, notes?: Record<string, string> }} DialText */
/** Chữ của một lớp trong Sổ tay (GĐ 2). tests/paintings/contract.test.js giữ các luật ghi ở đây.
 * @typedef {Object} LayerContent
 * @property {string} understand     tab Hiểu, ≤ 150 chữ (đếm theo khoảng trắng)
 * @property {string} [diagram]      nội dung SVG của sơ đồ: import './diagrams/<tên>.svg?raw'. Phải có <title>
 *                                   (trình đọc màn hình đọc nó) và chỉ dùng màu của bảng sơn mài
 * @property {string[]} learned      "Bạn vừa học" (≥ 1 mục)
 * @property {{ title: string, url: string }[]} readMore   chỉ https
 * @property {Record<string, string | { label: string, options: Record<string, string> }>} knobs   nhãn cho MỌI núm;
 *                                   núm 'select' dùng dạng { label, options } có nhãn cho mọi lựa chọn
 * @property {Record<string, { label: string, explain: string }>} [experiments]   cho MỌI thí nghiệm của lớp
 * @property {Record<string, string>} [readouts]   nhãn cho MỌI số đo riêng của lớp
 * @property {Record<string, string>} [taps]    nhãn các bước chụp của post (Lột lớp, Kính mài)
 */

export {};
