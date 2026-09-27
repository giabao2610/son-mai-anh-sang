// engine/contracts/runtime.js — hợp đồng NẶNG (chỉ JSDoc): Painting, LayerModule, Knob, Layer, PostStage, EngineCtx… (spec §8.4).
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
 * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp
 * @property {() => void} [dispose]     gọi 2 lần vẫn an toàn
 */
/** Dữ liệu thuần; xưởng dựng PerspectiveCamera + OrbitControls có giới hạn.
 * @typedef {Object} CameraSpec
 * @property {[number, number, number]} position
 * @property {[number, number, number]} target
 * @property {number} fov
 * @property {[number, number]} azimuth     giới hạn xoay ngang (rad)
 * @property {[number, number]} polar       giới hạn xoay dọc (rad)
 * @property {[number, number]} distance
 * @property {number} [breathe]             [1] biên độ "thở"; xưởng ép về 0 khi prefers-reduced-motion
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
 * @typedef {Object} Knob
 * @property {string} id           camelCase, duy nhất TRONG LỚP
 * @property {'number'|'select'|'color'|'bool'} [kind]      mặc định 'number'
 * @property {'uniform'|'js'|'rebuild'} [via]   [0] mặc định 'uniform'; 'js'/'rebuild' xử lý ở Layer.onKnob [2]
 * @property {number|string|boolean|((env: KnobEnv) => any)} value   mặc định; hàm khi phụ thuộc mức/tầng/đêm nay
 * @property {number} [min]
 * @property {number | { webgpu: number, webgl2: number }} [max]   trần theo tầng
 * @property {number} [step]
 * @property {string[]} [options]  kind 'select': id các lựa chọn; uniform giữ chỉ số
 */
/** @typedef {{ tier: 'webgpu'|'webgl2', level: 'cao'|'vua'|'thap', budget: Record<string, number>, now: Date, mobile: boolean }} KnobEnv */
/** Thứ createLayer trả về. Trọng số và núm KHÔNG nằm ở đây: xưởng tạo sẵn, lớp chỉ đọc.
 * @typedef {Object} Layer
 * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
 * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
 * @property {PostStage} [post]           [0] xử lý ẢNH sau scene pass
 * @property {() => void} dispose         [0] gọi 2 lần vẫn an toàn; tự gỡ object khỏi scene
 * @property {Record<string, (v: any) => void | Promise<void>>} [onKnob]   [2] cho núm 'js' | 'rebuild'
 * @property {Experiment[]} [experiments] [2] tab Phá
 * @property {Readout[]} [readouts]       [2] xưởng luôn thêm draw calls / tam giác / ms
 * @property {DegradeStep[]} [degrade]    [3] nấc hạ chất lượng mà lớp đưa ra
 */
/** @typedef {Object} Experiment
 * @property {string} id
 * @property {(on: boolean) => void | Promise<void>} toggle   trả Promise → UI hiện "đang dựng…"
 * @property {'toggle'|'compare'} [kind]  'compare': xưởng đo ms lúc tắt/bật và vẽ biểu đồ nhỏ
 */
/** @typedef {{ id: string, get: () => number | string, unit?: string }} Readout */
/** Nấc chỉ hạ TRẦN của lớp, KHÔNG BAO GIỜ ghi vào uniform của núm.
 * Núm = ý người xem, nấc = trần của máy, hiệu lực = min(núm, trần).
 * Nấc không được đổi thứ nằm trong cache key (castShadow, receiveShadow, shadowMap.enabled, fogNode…).
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
 * @property {(v: number) => string} [format]   29.5 → '05:30'
 * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
 */
/** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
 * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'} kind
 * @property {{ x: number, y: number }} ndc
 * @property {any} ray                          THREE.Ray; bức tự giao với mặt phẳng của nó
 * @property {{ x: number, y: number }} [velocity]   chỉ có ở 'swipe'
 */
/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js
 * @typedef {{ id: string, mount: (api: ToolApi) => ToolInstance }} Tool */
/** @typedef {Object} ToolApi
 * @property {() => ViewInfo[]} views              view ở không gian hiển thị, thứ tự như §7 Lột lớp
 * @property {(id: string) => Promise<void>} requireView   bảo đảm view sẵn sàng (có thể biên dịch lại MỘT lần)
 * @property {HTMLElement} el
 * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
 */
/** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
/** @typedef {Object} ToolInstance
 * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép MỘT LẦN sau display; đổi chế độ = đổi uniform
 * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức
 * @property {() => void} dispose
 */
/** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
 * @typedef {Object} EngineCtx
 * @property {'webgpu'|'webgl2'} tier          [0] backend THẬT sau renderer.init()
 * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động
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
 */
/** @typedef {EngineCtx & { knob: (knobId: string) => any }} LayerCtx   [0] knob(): uniform của núm 'uniform' của CHÍNH lớp đang dựng */

export {};
