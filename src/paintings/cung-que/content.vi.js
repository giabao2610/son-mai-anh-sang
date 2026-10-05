// paintings/cung-que/content.vi.js — chữ tiếng Việt của Bức 3: gợi ý tương tác; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';

/**
 * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm vào tán đa · giữ để cây bay lên · kéo để xoay',
  dials: {
    ngay: {
      label: 'Ngày âm lịch',
      notes: {
        trangMoi: 'Trăng mới: phía Trái Đất chìm trong đêm',
        thuongHuyen: 'Thượng huyền: nắng từ bên phải',
        ram: 'Rằm: trăng tròn',
        haHuyen: 'Hạ huyền: nắng từ bên trái',
      },
    },
  },
  layers: {
    cot: {
      understand: 'Cốt là cả thế giới bằng đất sét: một hành tinh nhỏ có hố, cây đa ở đỉnh. Ở đây không có một tam giác nào. Thế giới '
        + 'là một hàm khoảng cách: đưa vào một điểm, hàm trả về khoảng cách tới bề mặt gần nhất. Một quả cầu bao quanh mọi thứ; mỗi '
        + 'điểm ảnh của nó dò tia vào trong, mỗi bước tiến đúng bằng khoảng cách hàm cho, tới khi chạm mặt. Mài hết các lớp thì bức '
        + 'trở về đây.',
      learned: [
        'Một hàm khoảng cách có dấu (SDF) tả được cả một thế giới mà không cần lưới tam giác.',
        'Dò tia (sphere tracing): mỗi bước tiến đúng bằng khoảng cách tới mặt gần nhất, nên không bao giờ đi xuyên qua mặt.',
        'Hòa mềm (smooth union) làm hai hình liền nhau như đất nặn.',
      ],
      readMore: [
        { title: 'Inigo Quilez · distance functions', url: 'https://iquilezles.org/articles/distfunctions/' },
        { title: 'Inigo Quilez · smooth minimum', url: 'https://iquilezles.org/articles/smin/' },
      ],
      knobs: { steps: 'Số bước dò tối đa', smooth: 'Độ hòa khối' },
      experiments: {
        soBuoc: {
          label: 'Tô theo số bước',
          explain: 'Mỗi điểm ảnh tô theo số bước nó đã dò: mép hình, nơi tia đi sát mặt, sáng rực. Đó là chỗ shader làm việc nhiều nhất.',
        },
        khoiBao: {
          label: 'Hiện khối bao',
          explain: 'Chỗ tia trượt mọi hình được tô mờ thay vì bỏ đi: hiện ra quả cầu chứa cả thế giới. Ngoài quả cầu, không điểm ảnh nào phải dò.',
        },
        hoaCung: {
          label: 'Hòa khối cứng',
          explain: 'Hòa mềm thành ghép cứng: lộ đường nối giữa rễ và đất, giữa các khối của tán.',
        },
      },
      readouts: { bay: 'Cây bay lên', buoc: 'Bước dò tối đa', hinh: 'Số hình SDF' },
      objects: { 'khoi-bao': 'Khối bao (cả thế giới SDF)' },
    },
    'mat-troi': {
      understand: 'Mặt trời chiếu theo đúng pha trăng của ngày đang xem. Pha là góc giữa hướng nắng và hướng về Trái Đất: rằm thì nắng '
        + 'rọi thẳng xuống đỉnh cây, trăng mới thì phía Trái Đất chìm trong đêm. Kéo núm Ngày âm lịch để thấy vệt sáng quét qua hành '
        + 'tinh. Bụi trăng không phản xạ như mặt Lambert: nó không tối dần ra mép, nên trăng rằm trông như một đĩa phẳng sáng đều, và '
        + 'bừng lên khi nắng ở sau lưng người nhìn.',
      learned: [
        'Pha trăng chỉ là góc chiếu của nắng so với hướng nhìn từ Trái Đất.',
        'Mỗi bề mặt có một BRDF riêng: bụi trăng (Lommel–Seeliger) khác hẳn mặt Lambert.',
      ],
      readMore: [
        { title: 'NASA · Moon phases', url: 'https://science.nasa.gov/moon/moon-phases/' },
        { title: 'Opposition surge (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Opposition_surge' },
      ],
      knobs: { intensity: 'Cường độ nắng', surge: 'Độ bừng khi trăng tròn' },
      experiments: {
        lambert: {
          label: 'Bề mặt Lambert',
          explain: 'Bụi trăng thành mặt Lambert: trăng rằm tối dần ra mép như một quả bóng thạch cao, không còn là đĩa phẳng sáng đều.',
        },
      },
      readouts: { tuoi: 'Tuổi trăng (ngày)', sang: 'Phần sáng nhìn từ Trái Đất', goc: 'Góc tuổi trăng' },
    },
    'bong-mem': {
      understand: 'Bóng ở đây không cần shadow map, cũng không cần đèn. Từ mỗi điểm chạm, shader dò thêm một tia về phía Mặt Trời bằng '
        + 'chính hàm khoảng cách của Cốt. Tia chạm vật thì điểm nằm trong bóng. Tia đi sát mép vật mà không chạm thì điểm nằm trong '
        + 'nửa tối: càng sát càng tối. Nhờ vậy bóng mềm dần khi xa vật che, như bóng thật. Thêm năm mẫu dọc pháp tuyến để đo độ che '
        + 'quanh mỗi điểm (AO): khe rễ, đáy hố, chỗ Cuội tựa gốc cây tối hơn.',
      learned: [
        'Trường khoảng cách cho bóng mềm gần như miễn phí: chỉ cần nhớ tia đã đi sát vật tới đâu.',
        'AO đo bằng vài mẫu dọc pháp tuyến: chỗ nào khoảng cách nhỏ hơn quãng đã đi thì quanh đó có vật che.',
      ],
      readMore: [
        { title: 'Inigo Quilez · soft shadows in raymarched SDFs', url: 'https://iquilezles.org/articles/rmshadows/' },
        { title: 'Ambient occlusion (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Ambient_occlusion' },
      ],
      knobs: { softness: 'Hệ số k của bóng (nhỏ: nửa tối rộng)', ao: 'Độ đậm AO' },
      experiments: {
        bongCung: {
          label: 'Bóng cứng',
          explain: 'k thành 128: nửa tối gần như biến mất, bóng sắc như bóng của shadow map ở Đèn Kéo Quân. Bóng thật thì mềm dần khi '
            + 'xa vật che.',
        },
      },
      readouts: { buocBong: 'Bước dò bóng', mauAo: 'Số mẫu AO' },
    },
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
