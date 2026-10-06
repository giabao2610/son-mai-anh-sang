// engine/contracts/runtime.js — hợp đồng NẶNG (chỉ JSDoc): Painting, LayerModule, Knob, Layer, PostStage, EngineCtx, Studio… (spec §8.4).
/** Module nặng: src/paintings/<slug>/painting.js
 * @typedef {Object} Painting
 * @property {LayerModule[]} layers     [0] cùng id, cùng thứ tự với meta.layers (test so khớp)
 * @property {CameraSpec} camera        [0]
 * @property {QualitySpec} [quality]    [3] ngân sách của bức; thiếu thì dùng mặc định của xưởng
 * @property {(ctx: EngineCtx) => PaintingSetup} [setup]   [1] chạy TRƯỚC mọi createLayer
 */
/** @typedef {Object} PaintingSetup
 * @property {object} [shared]          object dùng chung trong bức (thiếu thì xưởng tạo {}) → tham số thứ 2 của createLayer
 * @property {Dial[]} [dials]           [4] núm của CẢ BỨC (Bức 1: 'gio'); xưởng vẽ thanh trượt
 * @property {(g: Gesture) => void} [onGesture]   cử chỉ mà không công cụ nào dùng
 * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp. [4] update(0, t) như Layer.update
 * @property {() => void} [dispose]     gọi 2 lần vẫn an toàn
 */
/** Dữ liệu thuần; xưởng dựng camera phối cảnh ([8] hay trực giao) + OrbitControls có giới hạn.
 * @typedef {Object} CameraSpec
 * @property {'perspective'|'ortho'} [kind] [8] mặc định 'perspective'
 * @property {[number, number, number]} position
 * @property {[number, number, number]} target
 * @property {number} [fov]                 bắt buộc với camera phối cảnh; [8] camera trực giao không dùng
 * @property {number} [height]              [8] camera trực giao (bắt buộc): bề cao khung nhìn ở zoom 1, đơn vị cảnh
 * @property {number} [minWidth]            [8] camera trực giao: khung hẹp thì xưởng nới height để bề ngang thấy đủ chừng này
 *                                          (engine/gpu/fov.js#fitOrtho)
 * @property {[number, number]} [zoom]      [8] camera trực giao: minZoom, maxZoom của OrbitControls; thiếu thì không zoom
 * @property {[number, number]} azimuth     giới hạn xoay ngang (rad); [-Infinity, Infinity] là xoay trọn vòng (GĐ 7)
 * @property {[number, number]} polar       giới hạn xoay dọc (rad)
 * @property {[number, number]} [distance]  bắt buộc với camera phối cảnh; [8] camera trực giao không dùng (khoảng cách đứng yên)
 * @property {number} [breathe]             [1] biên độ "thở"; xưởng ép về 0 khi prefers-reduced-motion
 * @property {number} [minHorizontalFov]    [7] góc nhìn ngang tối thiểu (độ): khung hẹp (điện thoại dọc) thì xưởng nới fov dọc để
 *                                          bề ngang vẫn thấy đủ góc này; khung đủ rộng giữ nguyên fov (engine/gpu/fov.js)
 * @property {{ after: number, duration: number }} [home]   [8] tranh tự khép lại: đứng yên `after` giây thì quay về góc của bức
 *                                          trong `duration` giây (engine/gpu/home.js); giảm chuyển động thì về một bước
 */
/** @typedef {Object} QualitySpec
 * @property {Record<'cao'|'vua'|'thap', Record<string, number>>} levels   ghép lên mức mặc định của xưởng; lớp đọc qua ctx.budget
 * @property {string[]} ladder     thứ tự hạ nấc: 'dpr' | '<layerId>.<stepId>'
 */
/** Một lớp = một module: layers/lN-<id>.js (hoặc engine/stock/<id>/layer.js). Là object thuần:
 * bức có thể ghi đè mặc định của lớp dùng chung bằng spread (§15 a).
 * @typedef {Object} LayerModule
 * @property {string} id           [0] export const id
 * @property {Knob[]} knobs        [0] export const knobs: TĨNH (có thể là [])
 * @property {(ctx: LayerCtx, shared: object) => Layer} createLayer   [0]
 */
/** Khai báo TĨNH của một núm. Xưởng tạo uniform cho núm 'uniform', tên đặt bằng
 * setName(`${layerId.replaceAll('-', '_')}_${knobId}`): tên phải là định danh WGSL/GLSL hợp lệ.
 * Giá trị luôn được chuẩn hóa (engine/gpu/knob-set.js): số kẹp trong [min, trần của tầng], màu '#rrggbb' chữ thường,
 * 'select' phải có trong options. Nhãn hiện trong Sổ tay nằm ở content.layers[layerId].knobs[id], không ở đây.
 * @typedef {Object} Knob
 * @property {string} id           camelCase, duy nhất TRONG LỚP. Đã deploy thì là API công khai: 'layerId.knobId'
 * @property {'number'|'select'|'color'|'bool'} [kind]      mặc định 'number'
 * @property {'uniform'|'js'|'rebuild'} [via]   [0] mặc định 'uniform'; 'js'/'rebuild' xử lý ở Layer.onKnob [2]
 *                                 Marker '// @knob <id>': núm 'uniform' ở dòng dùng uniform; 'js'/'rebuild' ở dòng xử lý onKnob.
 * @property {number|string|boolean|((env: KnobEnv) => any)} value   mặc định; hàm khi phụ thuộc mức/tầng/đêm nay
 * @property {number} [min]
 * @property {number | { webgpu: number, webgl2: number } | ((env: KnobEnv) => number)} [max]   trần theo tầng;
 *                                 [3] hoặc hàm của env (theo mức): núm không kéo được máy yếu quá sức
 * @property {number} [step]
 * @property {string[]} [options]  kind 'select': id các lựa chọn; uniform giữ chỉ số
 */
/** @typedef {{ tier: 'webgpu'|'webgl2', level: 'cao'|'vua'|'thap', budget: Record<string, number>, now: Date, mobile: boolean }} KnobEnv */
/** Thứ createLayer trả về. Trọng số và núm KHÔNG nằm ở đây: xưởng tạo sẵn, lớp chỉ đọc.
 * @typedef {Object} Layer
 * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
 *                                        [5] mỗi vật có name (kebab-case, không trùng trong lớp); nhãn ở content.layers[id].objects
 * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
 *                                 [4] update(0, t): xưởng vẽ lại khung đứng yên (?freeze): đồng bộ theo uniform (hướng trăng, bóng),
 *                                 KHÔNG tiến mô phỏng (compute, hạt CPU)
 * @property {PostStage} [post]           [0] xử lý ẢNH sau scene pass
 * @property {() => void} dispose         [0] gọi 2 lần vẫn an toàn; tự gỡ object khỏi scene
 * @property {Record<string, (v: any) => void | Promise<void>>} [onKnob]   [2] cho núm 'js' | 'rebuild'. Thiếu hàm cho
 *                                        một núm như thế thì buildLayers báo lỗi ngay lúc dựng. Nhận giá trị đã chuẩn hóa.
 * @property {Experiment[]} [experiments] [2] tab Phá
 * @property {Readout[]} [readouts]       [2] xưởng luôn thêm draw calls / tam giác / ms
 * @property {DegradeStep[]} [degrade]    [3] nấc hạ chất lượng mà lớp đưa ra
 */
/** Nhãn và lời giải thích ở content.layers[layerId].experiments[id].
 * @typedef {Object} Experiment
 * @property {string} id
 * @property {(on: boolean) => void | Promise<void>} toggle   trả Promise → UI hiện "đang dựng…"; bật hai lần vẫn an toàn
 * @property {'toggle'|'compare'} [kind]  'compare' [3]: toggle(true) là biến thể, toggle(false) là trạng thái thường. Bàn thợ
 *                                        ghi ms mỗi khung và ms CPU riêng cho từng trạng thái (bỏ 0,25 s đầu sau mỗi lần
 *                                        đổi); Sổ tay vẽ hai cột "Tắt / Bật".
 */
/** Nhãn ở content.layers[layerId].readouts[id]. get() đọc ngay lúc gọi (Sổ tay đọc 4 lần mỗi giây).
 * @typedef {{ id: string, get: () => number | string, unit?: string }} Readout */
/** Nấc chỉ hạ TRẦN của lớp, KHÔNG BAO GIỜ ghi vào uniform của núm.
 * Núm = ý người xem, nấc = trần của máy, hiệu lực = min(núm, trần).
 * Nấc không được đổi thứ nằm trong cache key (castShadow, receiveShadow, shadowMap.enabled, fogNode…).
 * [3] Lớp chỉ đưa những nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng). Xưởng (engine/gpu/ladder.js)
 * gọi apply/revert như một ngăn xếp: revert luôn gỡ nấc apply gần nhất; mỗi nấc apply tối đa một lần trước khi revert.
 * Địa chỉ trong QualitySpec.ladder là '<layerId>.<id>'.
 * @typedef {{ id: string, apply: () => void, revert: () => void }} DegradeStep */
/** Xưởng nối post của các lớp theo thứ tự:
 *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → overlay công cụ → vec4(rgb, 1)
 * Node dùng lại nhiều lần hoặc trước một nhánh If phải .toVar() bên trong Fn.
 * @typedef {Object} PostStage
 * @property {(i: PostInput) => any} [build]     [0] HDR tuyến tính vào → ra (bloom, tone). Gọi MỘT lần khi dựng pipeline.
 * @property {(i: PostInput) => any} [display]   [4] màu hiển thị (sRGB) vào → ra (LUT, grain, vignette, FXAA)
 */
/** @typedef {Object} PostInput
 * @property {any} color                                   màu hiện tại (từ scene pass hoặc stage trước)
 * @property {(name: 'output'|'emissive'|'normal'|'depth') => any} channel   'normal' chỉ có sau requireView [4]
 *                                                         [8] 'depth' với camera trực giao là chính texture độ sâu (tuyến tính
 *                                                         sẵn): lấy mẫu ở điểm lân cận được mà không thêm lượt vẽ
 * @property {any} weight                                  uniform trọng số của chính lớp này
 * @property {(tapId: string, node: any) => void} [tap]    [4] chụp một bước giữa chừng → view '<layerId>:<tapId>'
 */
/** Núm của cả bức. Nhãn ở content.dials[id]. Dial.id đã deploy là API công khai.
 * @typedef {Object} Dial
 * @property {string} id
 * @property {any} uniform
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {(v: number) => string} [format]   29.5 → '05:30'; [4] cũng là aria-valuetext của thanh trượt
 * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
 */
/** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
 * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'|'hover'|'double-tap'} kind
 *                                 [5] 'double-tap': phát ngay sau 'tap' thứ hai, cùng chỗ, khi lần chạm xuống thứ hai đến trong vòng
 *                                 300 ms sau lần nhấc ngón thứ nhất và cách chỗ chạm đầu ≤ 24 px. Hai lần chạm vẫn là hai 'tap'
 *                                 [4] 'hover': chuột di mà không bấm, mỗi khung tối đa một. CHỈ công cụ nhận; bức không bao giờ
 *                                 nhận 'hover' (onGesture của bức giữ nguyên nghĩa)
 * @property {{ x: number, y: number }} ndc
 * @property {any} ray                          THREE.Ray; bức tự giao với mặt phẳng của nó
 * @property {{ x: number, y: number }} [velocity]   chỉ có ở 'swipe'
 * @property {'mouse'|'touch'|'pen'} [pointer]  [4] pointerType của sự kiện gốc (kính chỉ giữ chạm của ngón tay, bút)
 */
/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js; tên trên nút "Đồ nghề" ở t.tools[id].name
 * @typedef {{ id: string, mount: (api: ToolApi) => ToolInstance }} Tool */
/** @typedef {Object} ToolApi
 * @property {() => ViewInfo[]} views              view ở không gian hiển thị, thứ tự như §7 Lột lớp
 * @property {(id: string) => Promise<void>} requireView   bảo đảm view sẵn sàng (có thể biên dịch lại MỘT lần)
 * @property {HTMLElement} el                      ô của công cụ trong thanh công cụ; công cụ dựng thanh điều khiển ở đây
 * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
 * @property {() => Promise<void>} redraw          vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
 * @property {DrawProbe | null} [draws]            [5] lần vẽ của lượt vẽ cảnh (Từng sợi): engine/gpu/draws.js. Chỉ năm hàm của
 *                                                 DrawProbe: begin()/end() ở lại scene.js, công cụ không tự mở hay đóng khung ghi.
 *                                                 null khi hộp đồ nghề được dựng không có móc: công cụ cần móc thì ném lỗi trong
 *                                                 mount() (như Từng sợi), và toolbox.js bỏ riêng công cụ đó
 */
/** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
/** [5] Móc lần vẽ (renderer.setRenderObjectFunction), phần công cụ thấy (ToolApi.draws). Chỉ gắn giữa start() và stop(); lúc khác
 * cảnh không tốn thêm gì. Móc mà scene.js giữ (createDrawProbe) còn có begin()/end(), gọi quanh mỗi pipeline.render().
 * @typedef {Object} DrawProbe
 * @property {() => void} start                 gắn móc (công cụ bật); khung kế tiếp được ghi lại
 * @property {() => void} stop                  gỡ móc, trả hàm vẽ trước đó; vẽ đủ như chưa có gì
 * @property {() => DrawInfo[]} list            lần vẽ của camera chính ở khung vẽ đủ gần nhất, theo thứ tự GPU nhận
 * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material + lượt: khóa
 *                                              object.id:material.id:passId); null = vẽ đủ.
 *                                              k là số nguyên ≥ 0 (giá trị khác thì ném lỗi); đang limit thì list() đứng yên
 * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt.
 *                                              reflection: lần vẽ của camera khác LỒNG trong lần vẽ một vật (phản chiếu);
 *                                              other: phần còn lại của renderer.info (bóng, bloom, quad của hậu kỳ)
 */
/** @typedef {{ layerId: string | null, layer: string | null, name: string | null, label: string, kind: string,
 *   instances: number, triangles: number, material: string, nested: number }} DrawInfo
 *   layer: tên lớp (meta) · label: nhãn vật trong content (thiếu thì name, rồi kind) · nested: lần vẽ lồng bên trong (phản chiếu) */
/** @typedef {Object} ToolInstance
 * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép sau display khi dựng pipeline; ghép LẠI khi
 *                                 requireView đổi MRT, nên chỉ dựng node, không giữ trạng thái; đổi chế độ = đổi uniform
 * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức. [5] Giữ 'tap' thì giữ cả 'double-tap'
 *                                 (kính tròn của Kính mài giữ cả hai; hình gạt không giữ cử chỉ nào): không thì bức nhận
 *                                 'double-tap' mà không có hai 'tap' làm nên nó
 * @property {(on: boolean) => void} [activate]     bật/tắt: đổi uniform, hiện/giấu thanh điều khiển
 * @property {() => void} dispose
 */
/** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
 * @typedef {Object} EngineCtx
 * @property {'webgpu'|'webgl2'} tier          [0] backend THẬT sau renderer.init()
 * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động ([3] hoặc mức ép bằng ?level); nấc hạ KHÔNG đổi số này
 * @property {Record<string, number>} budget   [0] mức mặc định của xưởng ghép với quality.levels[level] của bức
 * @property {boolean} mobile                  [0]
 * @property {boolean} reducedMotion           [0]
 * @property {Date} now                        [0] flags.at ?? giờ thật, cố định lúc khởi động
 * @property {any} renderer                    [0] WebGPURenderer (compute, info)
 * @property {any} scene                       [0] lớp tự add/remove đối tượng của mình
 * @property {any} camera                      [0]
 * @property {{ hex: Record<string, string>, color: (token: string) => any }} palette   [0] bảng đã ghép; color() trả THREE.Color
 * @property {{ time: any, delta: any, resolution: any, pointer?: any }} u              [0] uniform chung (pointer: [1])
 * @property {(layerId: string) => any} weight [0] uniform trọng số; 'cot' luôn là 1; id lạ → ném lỗi
 * @property {boolean} debug                   [0]
 * @property {{ keys: string[], show: (key: string, anchor: () => ({ x: number, y: number, z: number } | null)) => void }} [captions]
 *                                            [5] chữ đi theo vật: keys = các khóa có trong content.captions (rỗng khi chữ tải hỏng);
 *                                            show() thay dòng đang hiện; anchor() trả null thì chữ ẩn ở khung đó
 */
/** Ctx mà createLayer nhận: EngineCtx cộng hai hàm của CHÍNH lớp đang dựng.
 * @typedef {Object} LayerCtxExtra
 * @property {(knobId: string) => any} knob         [0] uniform của một núm 'uniform'; id lạ hay núm 'js'/'rebuild' → ném lỗi
 * @property {(knobId: string) => any} knobValue    [2] giá trị ban đầu (đã chuẩn hóa) của MỌI núm, kể cả 'js'/'rebuild':
 *                                                  lớp dựng hình theo đúng giá trị này, rồi onKnob đổi nó lúc chạy
 */
/** @typedef {EngineCtx & LayerCtxExtra} LayerCtx   [0] */

/** Trạng thái tác phẩm dạng JSON (spec §16): trọng số và núm; [4] dials: { dialId: số } (bức không có Dial thì bỏ trống).
 * @typedef {{ weights: Record<string, number>, knobs: Record<string, any>, dials?: Record<string, number> }} Snapshot
 *   [2] khóa núm là 'layerId.knobId'
 */
/** Một bên của thí nghiệm 'compare' [3]: trung bình trượt. [4] gpuMs: null khi máy không đo được thời gian GPU.
 * @typedef {{ ms: number, cpuMs: number, gpuMs: number | null }} CompareSide */
/** Bàn thợ [2] (engine/gpu/studio.js): API DUY NHẤT mà Sổ tay (ui/) và __sma thấy. Không có ở tầng tĩnh.
 * @typedef {Object} Studio
 * @property {() => { id: string, name: string, knobs: object[], experiments: { id: string, kind: string }[], readouts: { id: string, unit: string }[] }[]} layers
 * @property {(id: string) => { value: number, target: number }} weight   giá trị hiện tại và đích của tween
 * @property {(id: string, v: number, opts?: { tween?: boolean }) => void} setWeight   tween: thanh lớp; không tween: __sma, e2e
 * @property {(layerId: string) => Record<string, any>} knobs
 * @property {(layerId: string, knobId: string, v: any) => Promise<void>} setKnob
 * @property {(layerId: string, expId: string) => boolean} experiment
 * @property {(layerId: string, expId: string, on: boolean) => Promise<void>} toggleExperiment
 * @property {(layerId: string) => { id: string, value: number | string, unit: string }[]} readouts
 * @property {() => { drawCalls: number, triangles: number, ms: number, cpuMs: number, gpuMs: number | null }} stats
 *   số của khung vừa vẽ ([3] cpuMs; [4] gpuMs: null khi máy không đo được thời gian GPU)
 * @property {() => Snapshot} snapshot
 * @property {(s: Snapshot) => Promise<void>} restore
 * @property {(layerId: string, expId: string) => { off: CompareSide | null, on: CompareSide | null }} compare
 *   [3] số đo của một thí nghiệm 'compare' theo từng trạng thái (null: chưa đo; thí nghiệm kiểu khác thì luôn null)
 * @property {() => { level: string | null, steps: string[], guarding: boolean, capped: boolean, gpu: boolean, locked: string[] }} quality
 *   [3] bộ điều chỉnh: mức, id các nấc đang hạ, đang canh (Sổ tay mở: chỉ hạ khi quá tải nặng), có đang coi là nhịp bị khóa;
 *   [4] gpu: máy đo được ms GPU (chẩn đoán theo tải); locked: id các nấc bị khóa chống dao động (giữ tới khi tải lại trang)
 * @property {() => Promise<boolean>} degrade   [3] hạ tay MỘT nấc (DevTools, e2e); false khi hết thang
 * @property {() => Promise<boolean>} upgrade   [3] nâng tay MỘT nấc; false khi không còn nấc nào
 * @property {(cb: (q: object) => void) => () => void} onQuality   [3] báo mỗi lần nấc đổi; trả hàm bỏ nghe
 * @property {() => { id: string, on: boolean }[]} tools   [4] công cụ học, theo thứ tự engine/tools/index.js
 * @property {(id: string | null) => Promise<void>} setTool   [4] bật một công cụ (tắt các cái khác), null tắt hết
 * @property {() => { id: string, min: number, max: number, step: number, value: number, text: string, note: string | null }[]} dials
 *   [4] núm của cả bức: text là chữ của format (cũng là aria-valuetext), note là khóa ghi chú
 * @property {(id: string, v: number) => Promise<void>} setDial   [4] kẹp theo min/max/step
 */

export {};
