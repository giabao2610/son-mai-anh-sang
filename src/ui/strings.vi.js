// ui/strings.vi.js — Chữ tiếng Việt của xưởng: tầng, tầng tĩnh, lời mời, thanh lớp, công cụ học, Sổ tay, mất GPU, tháng/can/chi, con dấu.
//
// Quy ước: file này KHÔNG import gì và không file nào trong src/ import nó. Chỉ trang HTML import rồi
// truyền `t` vào boot(); engine/ và ui/ nhận `t` qua tham số. Thêm ngôn ngữ = thêm strings.<lang>.js cùng bộ khóa.

/** Tên tháng âm theo chỉ số 1..12 (ô 0 để trống). Tháng 11 viết "Mười Một" cho khỏi nhầm tháng 1 dương lịch. */
export const THANG = Object.freeze([
  '', 'Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp',
]);

/** 10 thiên can, theo chỉ số `can` của canChiIndex() (lib/astro/lunar.js). */
export const CAN = Object.freeze(['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']);

/** 12 địa chi, theo chỉ số `chi` của canChiIndex(). */
export const CHI = Object.freeze(['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']);

/**
 * Chữ trên con dấu: "{ngày} tháng {Tên tháng}{ nhuận?} · {Can Chi}", ví dụ "18 tháng Tám · Bính Ngọ".
 * Đầu vào là số: ui/shell.js ghép lunarFromDate(now) với canChiIndex(năm âm).
 * `traditional: true` gọi tháng 11 theo lối cổ là "Một"; tháng 12 vẫn là "Chạp".
 * @param {{ day: number, month: number, leap: boolean, can: number, chi: number }} lunar
 * @param {{ traditional?: boolean }} [options]
 * @returns {string}
 */
export function formatSeal({ day, month, leap, can, chi }, { traditional = false } = {}) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`Tháng âm không hợp lệ: ${month}`);
  }
  if (!Number.isInteger(can) || can < 0 || can > 9 || !Number.isInteger(chi) || chi < 0 || chi > 11) {
    throw new RangeError(`Can chi không hợp lệ: can ${can}, chi ${chi}`);
  }
  const name = traditional && month === 11 ? 'Một' : THANG[month];
  return `${day} tháng ${name}${leap ? ' nhuận' : ''} · ${CAN[can]} ${CHI[chi]}`;
}

const COUNT = new Intl.NumberFormat('vi');
/** Số đếm kiểu Việt, dấu chấm ngăn hàng nghìn (1.200), như số đo của Sổ tay: số lần vẽ, số bản, số tam giác. */
const num = (v) => COUNT.format(v);

const t = {
  lang: 'vi',
  tierName: { webgpu: 'WebGPU', webgl2: 'WebGL2', static: 'Tranh tĩnh' },
  levelName: { cao: 'cao', vua: 'vừa', thap: 'thấp' },
  badge: {
    // Hiện khi chạm vào huy hiệu (title + aria-label): mỗi tầng 1–2 câu.
    explain: {
      webgpu: 'Cảnh đang được vẽ bằng WebGPU, chuẩn đồ họa mới nhất của trình duyệt. '
        + 'Mọi lớp ánh sáng chạy thẳng trên GPU của máy bạn.',
      webgl2: 'Cảnh đang được vẽ bằng WebGL2, chuẩn đồ họa cũ hơn nhưng chạy được trên hầu hết các máy. '
        + 'Vẫn là bức tranh ấy, có khi bớt vài chi tiết để hình luôn mượt.',
      static: 'Bạn đang xem bản tranh tĩnh: poster, thơ và con dấu, không cần GPU. '
        + 'Cảnh 3D chỉ chạy khi trình duyệt dùng được WebGPU hoặc WebGL2.',
    },
    /** Bộ điều chỉnh chất lượng đang hạ n nấc (GĐ 3). */
    steps: (n) => `hạ ${n} nấc`,
    stepsExplain: (n) => `Máy đang bớt ${n} nấc chi tiết (độ nét, phản chiếu, bloom…) để hình không giật; `
      + 'khi máy rảnh hơn, chi tiết tự trở lại.',
    /** Có nấc bị khóa chống dao động (GĐ 4): nói thật là nấc đó giữ tới khi tải lại trang. */
    lockedExplain: (n, k) => `Máy đang bớt ${n} nấc chi tiết (độ nét, phản chiếu, bloom…) để hình không giật. `
      + `${k} nấc trong số đó giữ nguyên tới khi tải lại trang, vì trả lại là máy chậm ngay.`,
  },
  static: {
    noGpu: 'Máy này chưa vẽ được cảnh 3D, thường là vì trình duyệt đang tắt tăng tốc phần cứng. '
      + 'Mở chrome://gpu để kiểm tra; nếu WebGL báo “Disabled”, hãy vào Cài đặt › Hệ thống, '
      + 'bật “Use hardware acceleration when available” (có bản ghi là “Use graphics acceleration when available”) '
      + 'rồi mở lại trình duyệt.',
    chunkLoad: 'Trang vừa được cập nhật, tải lại nhé.',
    timeout: 'Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.',
    error: 'Cảnh 3D gặp lỗi trên máy này.',
    debugHint: 'Thêm ?debug vào địa chỉ để xem chi tiết.',
    reload: 'Tải lại',
  },
  /** Lời mời sau lần chạm đầu tiên (là một nút: bấm để vào chế độ mài); n = số lớp của bức. */
  invite: (n) => `Bức tranh này có ${n} lớp — mài thử?`,
  /** Tên trang và số thứ tự của một bức: trình sinh trang (scripts/pages.js, GĐ 7) in vào HTML của mọi trang. */
  site: { name: 'Sơn Mài Ánh Sáng', no: (n) => `Bức ${n}` },
  /** Dải lật tranh dưới tên bức (GĐ 6; GĐ 7 sinh bằng scripts/pages.js). */
  series: {
    label: 'Các bức tranh',
    prev: (n, title) => `← Bức ${n} · ${title}`,
    gallery: 'Phòng tranh',
    next: (n, title) => `Bức ${n} · ${title} →`,
  },
  /** Phòng tranh (GĐ 7): trang tĩnh liệt kê mọi bức. */
  gallery: {
    title: 'Phòng tranh',
    intro: 'Mỗi bức sơn từ nhiều lớp ánh sáng; mài dần từng lớp để thấy cốt đất sét bên dưới.',
  },
  /** Mất GPU lần đầu (GĐ 2): poster hiện lại kèm nút dựng lại. */
  lost: {
    text: 'Trình duyệt vừa dừng GPU của trang (máy ngủ, đổi card đồ họa, hoặc thiếu bộ nhớ). Cảnh có thể dựng lại như cũ.',
    rebuild: 'Dựng lại cảnh',
  },
  /** Thanh lớp: tên từng lớp theo thứ tự phủ, công tắc (trừ Cốt), nút phủ lớp kế tiếp. */
  rail: {
    label: 'Các lớp của bức tranh',
    toggle: (name) => `Bật hoặc tắt lớp ${name}`,
    next: (name) => `Phủ lớp tiếp theo · ${name}`,
    close: 'Đóng thanh lớp, xem lại bức tranh',
    /** Mục dưới danh sách lớp (GĐ 4): công cụ học và thanh trượt của bức (Dial). */
    tools: 'Đồ nghề',
  },
  /** Công cụ học (GĐ 4): tên trên nút "Đồ nghề" của thanh lớp, và chữ trên thanh điều khiển của từng công cụ. */
  tools: {
    'kinh-mai': {
      name: 'Kính mài',
      shapeLabel: 'Hình kính',
      shapes: { tron: 'Tròn', gat: 'Gạt' },
      viewLabel: 'Soi qua kính',
      handle: 'Vạch gạt: bên trái là ảnh đang soi, bên phải là ảnh cuối',
    },
    'lot-lop': {
      name: 'Lột lớp',
      label: 'Lột dần ảnh',
    },
    /** GĐ 5: mỗi sợi là một lần vẽ (draw call) của lượt vẽ cảnh; info là một DrawInfo của móc lần vẽ (engine/gpu/draws.js). */
    'tung-soi': {
      name: 'Từng sợi',
      label: 'Sợi',
      play: 'Dệt lại',
      counting: 'Đang đếm các lần vẽ…',
      /** Đếm quá 3 giây (tab đang hiện) mà móc chưa thấy lần vẽ nào: không để "Đang đếm…" đứng mãi. */
      stalled: 'Chưa thấy lần vẽ nào của cảnh. Tắt rồi bật lại Từng sợi, hoặc tải lại trang.',
      empty: 'Chưa vẽ sợi nào: chỉ còn màu nền xóa khung, vẫn qua hậu kỳ.',
      step: (k, n) => `${num(k)}/${num(n)}`,
      valuetext: (k, n, label) => (k === 0 ? `Sợi 0 trên ${num(n)}: chưa vẽ gì` : `Sợi ${num(k)} trên ${num(n)}: ${label}`),
      detail: ({ label, layer, kind, instances, triangles }) => `${label} · ${layer ? `lớp ${layer}` : 'không thuộc lớp nào'} · `
        + `${kind}${instances > 1 ? ` × ${num(instances)}` : ''} · ${num(triangles)} tam giác.`,
      /** Câu thêm sau dòng mô tả khi vật kéo theo lần vẽ lồng (mặt soi: reflector vẽ lại cảnh ngay trước khi vật được vẽ). */
      nested: (count) => `Trước khi vẽ vật này, GPU vẽ lại ${num(count)} lần cho ảnh phản chiếu.`,
      summary: ({ scene, reflection, other }) => `Khung này: lượt vẽ cảnh ${num(scene)} · phản chiếu ${num(reflection)} · `
        + `các lượt khác (bóng, bloom, hậu kỳ) ${num(other)} draw call.`,
      note: 'Bóng đổ và ảnh phản chiếu vẽ ở lượt riêng, nên lúc nào cũng đủ, kể cả khi các vật sau chưa được vẽ ở lượt chính.',
    },
  },
  /** Các view của xưởng mà công cụ nhìn được; tap của lớp lấy nhãn ở content của lớp. */
  views: { final: 'Ảnh cuối', emissive: 'Chỉ emissive', normal: 'Normal', depth: 'Depth' },
  /** Dòng trạng thái (aria-live) trên thanh công cụ: view Normal phải biên dịch lại một lần. */
  toolStatus: { grinding: 'đang mài…', failed: 'Không mài được view này; vẫn giữ view cũ.' },
  /**
   * Bản dịch (GĐ 9, spec §21.1): khung mã shader thật trong tab Chỉnh. `post`: nhãn của quad cuối (mọi phần hậu kỳ ghép lại).
   * `translating` là chuỗi thường: một bản dịch chỉ là một khung vẽ, nên không có tiến độ để đếm.
   */
  recipe: {
    staticNote: 'Link này có công thức mài; công thức chỉ áp được ở bản 3D.',
    /** Mục Công thức trong thanh lớp (GĐ 9, spec §21.5). */
    title: 'Công thức',
    copy: 'Chép link công thức',
    copied: 'Đã chép link',
    copyFailed: 'Chưa chép được: link ở ô dưới, chọn rồi chép.',
    /** Không đọc được công thức của cảnh (cảnh vừa gỡ, hay lỗi của xưởng): không có link nào để đưa ra ô. */
    linkFailed: 'Chưa lấy được công thức của cảnh; chi tiết ở console của trình duyệt.',
    linkLabel: 'Link công thức',
    reset: 'Về nguyên bản',
    /** Dòng tóm tắt đầu thanh lớp; phần bằng 0 bị bỏ. dials: [{ label, text }]. */
    summary: ({ layers, knobs, dials }) => `Công thức trong link: ${[
      layers ? `${layers} lớp đã mài` : null, knobs ? `${knobs} núm đã chỉnh` : null, ...dials.map((d) => `${d.label} ${d.text}`),
    ].filter(Boolean).join(' · ')}`,
  },
  translation: {
    button: 'Bản dịch',
    object: 'Vật',
    stages: 'Phần của shader',
    vertex: 'Đỉnh',
    fragment: 'Điểm ảnh',
    post: 'Lượt cuối · hậu kỳ',
    translating: 'Đang dịch…',
    status: ({ language, backend, lines, hits, layer }) => `${language === 'wgsl' ? 'WGSL' : 'GLSL ES 3.0'} · `
      + `${backend === 'webgpu' ? 'WebGPU' : 'WebGL2'} · ${num(lines)} dòng · ${num(hits)} dòng có lớp ${layer}`,
    weightHint: (name) => `Mài lớp này chỉ đổi số trong ${name}: mã không đổi, nên không biên dịch lại.`,
    jsOnly: 'Lớp này đổi cảnh bằng JS: trọng số và núm của nó không vào shader.',
    /** Vật của chính lớp mà khung vừa bắt không vẽ (đang ẩn, hay nằm ngoài khung nhìn): không có mã để đọc. */
    notDrawn: 'Vật này không được vẽ ở khung vừa rồi (đang ẩn hay ngoài khung nhìn).',
    /** Dòng nhắc khi KHÔNG vật nào của lớp được vẽ (thường là lớp đang ở trọng số 0): chưa biết lớp có vào shader hay không. */
    undrawn: 'Khung vừa rồi không vẽ vật nào của lớp này (lớp đang tắt?), nên chưa biết nó có mặt ở đâu trong mã.',
    failed: 'Chưa dịch được vật này; chi tiết ở console của trình duyệt.',
  },
  /** Sổ tay của một lớp: ba tab Hiểu / Chỉnh / Phá. */
  notebook: {
    label: 'Sổ tay',
    layerNo: (i, n) => `Lớp ${i} / ${n}`,
    close: 'Đóng Sổ tay',
    tabs: { hieu: 'Hiểu', chinh: 'Chỉnh', pha: 'Phá' },
    learned: 'Bạn vừa học',
    readMore: 'Đọc thêm',
    code: 'Code thật của lớp',
    loading: 'Đang tải…',
    knobsFailed: 'Chưa tải được núm. Mở lại tab này để thử lại, hoặc tải lại trang.',
    building: 'đang dựng…',
    changeFailed: 'Thay đổi vừa rồi không áp được; chi tiết ở console của trình duyệt.',
    codeMissing: 'Chưa tải được code của file này.',
    contentMissing: 'Chưa tải được chữ của lớp này.',
    noKnobs: 'Lớp này không có núm.',
    noExperiments: 'Lớp này chưa có thí nghiệm.',
    knobsStatic: 'Núm chỉ chạy khi có cảnh 3D. Code thì đọc được ngay.',
    experimentsStatic: 'Thử phá cần cảnh 3D.',
    layerOff: 'Lớp này đang tắt: bật nó trên thanh lớp thì thí nghiệm và số đo mới có ý nghĩa.',
    measure: 'Số đo trực tiếp',
    readouts: {
      drawCalls: 'Draw call mỗi khung',
      triangles: 'Tam giác mỗi khung',
      ms: 'Mili giây mỗi khung',
      cpuMs: 'Mili giây CPU mỗi khung',
      gpuMs: 'Mili giây GPU mỗi khung',
    },
    /** Máy không đo được thời gian GPU (GĐ 4): dòng ms GPU ghi "—" kèm câu này. */
    gpuMissing:
      'Máy này chưa đo được thời gian GPU: Safari và nhiều điện thoại chưa cho đo, còn GPU Apple trên Chrome báo các lượt vẽ chồng lên nhau nên số không dùng được.',
    /** Hai cột "Tắt / Bật" của thí nghiệm so sánh (GĐ 3). */
    compare: {
      off: 'Tắt',
      on: 'Bật',
      empty: 'chưa đo',
      value: (ms, cpu, gpu) => `khung ${ms} ms · CPU ${cpu} ms${gpu === null ? '' : ` · GPU ${gpu} ms`}`,
    },
    /** Nút mở Sổ tay ở tầng tĩnh (chỉ đọc). */
    openStatic: (n) => `Xem ${n} lớp của bức tranh`,
  },
  formatSeal,
};

export default t;
