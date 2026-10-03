// paintings/ao-sen-dem/content.vi.js — chữ tiếng Việt của Bức 1: gợi ý tương tác, thơ của hoa đăng; Hiểu/Chỉnh/Phá của từng lớp trong Sổ tay.
import phuBong from '../../engine/stock/phu-bong/content.vi.js';
import captions from './content.captions.vi.js';
import cotDiagram from './diagrams/cot.svg?raw';
import anhTrangDiagram from './diagrams/anh-trang.svg?raw';
import suongDiagram from './diagrams/suong.svg?raw';
import matNuocDiagram from './diagrams/mat-nuoc.svg?raw';
import vangLaDiagram from './diagrams/vang-la.svg?raw';

/**
 * Mọi nhãn tra theo id (lớp, núm, thí nghiệm, số đo, tên vật): đổi chữ không đụng tới code của lớp.
 * understand ≤ 150 chữ (đếm theo khoảng trắng); đường dẫn "Đọc thêm" chỉ https. Test hợp đồng giữ các luật này.
 * @type {import('../../engine/contracts/painting.js').PaintingContent}
 */
export default {
  hint: 'Chạm vào mặt nước · chạm hai lần để thả hoa đăng',
  // Thơ của hoa đăng (chữ đi theo vật): mỗi lần thả một cặp câu; shared.js chỉ cầm khóa. Tách file riêng để file này dưới 300 dòng.
  captions,
  // Thanh giờ (Dial 'gio' của shared.js). Ghi chú 'daytime' chỉ hiện khi đang là ban ngày và thanh chưa bị kéo đi.
  dials: {
    gio: {
      label: 'Giờ',
      notes: { daytime: 'Bây giờ đang là ban ngày, nên ao sen mượn 21:00 tối nay. Kéo thanh để xem các giờ khác của đêm.' },
    },
  },
  layers: {
    cot: {
      understand:
        'Cốt là lớp đất sét dưới cùng: chỉ có hình khối, chưa có màu hay ánh sáng của bức. Cả ao có hơn một '
        + 'nghìn chiếc lá, nhưng GPU chỉ nhận MỘT hình lá. Instancing gửi hình đó một lần, kèm một bảng ma trận: '
        + 'mỗi lá một ma trận nói lá nằm đâu, xoay bao nhiêu, to nhỏ thế nào. Nhờ vậy cả nghìn lá chỉ tốn một '
        + 'draw call, tức một lần CPU bảo GPU vẽ. Cánh sen cũng thế: 388 cánh của 12 bông và 20 nụ là một hình '
        + 'cánh vẽ 388 lần, cùng nở theo một uniform. Đèn xưởng xám giúp đất sét đọc được khối lõm của lòng lá. '
        + 'Mài hết các lớp khác thì bức trở về đúng lớp này.',
      diagram: cotDiagram,
      learned: [
        'Instancing: một hình, nhiều bản sao, một draw call.',
        'Ma trận instance chứa vị trí, hướng xoay và cỡ của từng bản sao.',
        'Hạt giống cố định cho ra đúng một ao sen mỗi lần mở trang.',
      ],
      readMore: [
        { title: 'three.js · InstancedMesh', url: 'https://threejs.org/docs/#api/en/objects/InstancedMesh' },
        { title: 'Ví dụ three.js: instancing với WebGPU', url: 'https://threejs.org/examples/#webgpu_instance_mesh' },
        { title: 'Sơn mài (Wikipedia tiếng Việt)', url: 'https://vi.wikipedia.org/wiki/S%C6%A1n_m%C3%A0i' },
      ],
      knobs: {
        leafCount: 'Số lá',
        seed: 'Hạt giống (bố cục ao)',
        sizeVariance: 'Độ chênh cỡ lá',
        cupAmount: 'Độ lõm lòng lá',
        openness: 'Độ nở của hoa',
        wireframe: 'Chỉ vẽ khung dây',
      },
      experiments: {
        noInstancing: {
          label: 'Tắt instancing',
          explain: 'Mỗi lá thành một Mesh riêng, tức một draw call riêng. Nhìn số draw call nhảy vọt và số mili '
            + 'giây mỗi khung tăng theo: CPU phải ra lệnh vẽ hàng trăm lần thay vì một lần.',
        },
        flatNormals: {
          label: 'Normal phẳng',
          explain: 'Pháp tuyến là hướng mà bề mặt quay về; ánh sáng đọc nó để biết chỗ nào sáng, chỗ nào tối. '
            + 'Bỏ pháp tuyến trơn thì mỗi tam giác sáng một màu: lá lộ ra là những mảnh phẳng ghép lại.',
        },
      },
      readouts: { leaves: 'Số lá', vertices: 'Số đỉnh mỗi lần vẽ' },
      objects: {
        'la-noi': 'Lá nổi', 'la-dung': 'Lá đứng', 'canh-sen': 'Cánh sen', 'guong-sen': 'Gương sen và nhị',
        cuong: 'Cuống hoa và lá', 'lau-say': 'Lau sậy', 'la-rieng': 'Lá nổi, mỗi lá một Mesh',
      },
    },

    'anh-trang': {
      understand:
        'Lớp này thắp đèn và sơn màu. Trăng là quả cầu tự phát sáng, đúng pha của đêm nay: đường ranh sáng tối '
        + 'tính từ tuổi trăng. Ánh trăng là một DirectionalLight chiếu từ phía trăng, kèm MỘT shadow map: ảnh độ '
        + 'sâu nhìn từ trăng, để biết chỗ nào bị hoa và lá đứng che. Màu lấy đúng câu ca dao: lá xanh, bông '
        + 'trắng, nhị vàng; màu nào cũng trộn từ đất sét theo trọng số. Mép cánh sen sáng lên nhờ fresnel: nhìn '
        + 'càng xiên, bề mặt càng phản quang. Lá có lớp clearcoat bóng như sáp. Đèn hoa đăng ở bờ là đèn thật '
        + '(PointLight): nó chiếu ấm lên lá và cánh sen quanh nó. Hoa đăng thả xuống nước chỉ tự phát sáng '
        + '(emissive, có bloom) như trăng, không chiếu lên gì: thêm đèn thật lúc chạy là mọi chất liệu '
        + 'phải biên dịch lại.',
      diagram: anhTrangDiagram,
      learned: [
        'DirectionalLight: ánh sáng song song từ rất xa, như trăng hay mặt trời.',
        'Shadow map: vẽ cảnh từ phía đèn để biết chỗ nào khuất sáng.',
        'Fresnel: bề mặt phản quang mạnh hơn khi nhìn xiên.',
        'Mọi màu đi từ đất sét: mix(đất sét, màu, trọng số).',
        'Đèn thật chiếu sáng mọi thứ quanh nó nhưng thêm lúc chạy là biên dịch lại; vật tự phát sáng (emissive) rẻ hơn '
          + 'nhiều nhưng không chiếu sáng gì.',
      ],
      readMore: [
        { title: 'LearnOpenGL · Shadow Mapping', url: 'https://learnopengl.com/Advanced-Lighting/Shadows/Shadow-Mapping' },
        { title: 'Xấp xỉ Schlick cho fresnel (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Schlick%27s_approximation' },
        { title: 'three.js · MeshPhysicalMaterial', url: 'https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial' },
      ],
      knobs: {
        moonPhase: 'Pha trăng (0 trăng mới, π rằm)',
        rimPower: 'Độ mảnh của viền fresnel',
        rimColor: 'Màu viền cánh',
        translucency: 'Cánh trong khi ngược sáng',
        clearcoat: 'Lớp bóng trên lá',
        candleColor: 'Màu đèn hoa đăng',
        candleIntensity: 'Độ sáng đèn thật ở bờ',
        shadowMapSize: 'Cỡ shadow map (điểm ảnh)',
        shadowBias: 'Shadow bias',
      },
      experiments: {
        biasZero: {
          label: 'Bias = 0',
          explain: 'Bias đẩy nhẹ phép so độ sâu để một mặt không tự che chính nó. Đặt bằng 0 thì trên lá hiện '
            + 'sọc lốm đốm, gọi là shadow acne. Ở mức chất lượng thấp không có bóng nên không thấy gì.',
        },
        noRim: {
          label: 'Tắt fresnel',
          explain: 'Bỏ viền sáng ở mép cánh sen: bông hoa bẹt hẳn đi, mất cảm giác cánh mỏng và cong.',
        },
        redCandle: {
          label: 'Đổi màu đèn',
          explain: 'Đèn hoa đăng chuyển sang đỏ son. Lá bóng hắt lại thành vệt, cánh sen nhám thì ửng đều, '
            + 'còn mặt nước soi nguyên ngọn đèn.',
        },
      },
      readouts: { shadowMap: 'Cỡ shadow map', lanterns: 'Hoa đăng đang trôi' },
      objects: { trang: 'Trăng', 'hoa-dang': 'Đèn hoa đăng' },
    },

    suong: {
      understand:
        'Lớp này vẽ bầu trời và làn sương. Trời là một quả cầu lớn nhìn từ bên trong: màu mỗi điểm tính từ hướng '
        + 'nhìn, chàm ở đỉnh, đen then ở chân trời; sao là những ô ngẫu nhiên (hash) được chọn cho sáng lên, không '
        + 'cần tấm ảnh nào. Sương thì không phải một vật: mọi bề mặt tự pha màu sương theo khoảng cách tới mắt. Càng '
        + 'xa và càng sát mặt nước thì càng đặc (hàm mũ theo độ cao), còn noise nhiều tầng (fbm) cho sương loang từng '
        + 'mảng và trôi theo gió. Mỗi tầng noise (octave) thêm chi tiết nhỏ nhưng tốn thêm phép tính ở mọi điểm ảnh. '
        + 'Vuốt trên mặt nước để sương xoáy.',
      diagram: suongDiagram,
      learned: [
        'Sương là phép pha màu theo khoảng cách: 1 − e^(−khoảng cách × mật độ).',
        'fbm: cộng nhiều tầng noise, tầng sau nhỏ gấp đôi và nhạt đi một nửa.',
        'Bầu trời vẽ bằng công thức theo hướng nhìn, không cần ảnh.',
      ],
      readMore: [
        { title: 'Inigo Quilez · Better Fog', url: 'https://iquilezles.org/articles/fog/' },
        { title: 'The Book of Shaders · Fractal Brownian Motion', url: 'https://thebookofshaders.com/13/' },
      ],
      knobs: {
        density: 'Mật độ sương',
        heightFalloff: 'Sương mỏng dần theo độ cao',
        noiseScale: 'Cỡ mảng sương (nhỏ là mảng to)',
        octaves: 'Số tầng noise (octave)',
        windStrength: 'Sức gió',
        starDensity: 'Mật độ sao',
        haloSize: 'Cỡ quầng trăng',
      },
      experiments: {
        rawNoise: {
          label: 'Xem noise thô',
          explain: 'Mọi bề mặt hiện thẳng giá trị noise của sương dạng ảnh xám: sáng là chỗ sương đặc. Trời, trăng '
            + 'và đom đóm không nhận sương nên vẫn như cũ.',
        },
        oneOctave: {
          label: 'Chỉ 1 octave',
          explain: 'Sương còn một tầng noise: mảng to, mềm, mất chi tiết. Hai cột đo ms lúc tắt và lúc bật. Máy yếu '
            + 'thấy bớt octave là nhẹ đi; máy mạnh thì cột ms khung có thể bằng nhau vì trình duyệt khóa ở nhịp màn hình. '
            + 'Ở mức thấp sương vốn chỉ có 1 octave: kéo núm "Số tầng noise" lên rồi hãy so.',
        },
      },
      readouts: { octaves: 'Số octave đang chạy' },
      objects: { 'vom-troi': 'Vòm trời' },
    },

    'mat-nuoc': {
      understand:
        'Mặt nước là một đĩa phẳng, nhưng soi được trăng, hoa và trời. Mỗi khung, reflector vẽ lại toàn cảnh từ '
        + 'một camera lật ngược qua mặt nước, vào một ảnh nhỏ hơn màn hình, rồi dán ảnh ấy lên đĩa. Máy yếu (mức '
        + 'thấp) không có reflector, nên hai núm phản chiếu không đổi gì: nước lấy màu trời theo hướng phản xạ. Chạm vào '
        + 'nước là thêm một vòng gợn vào bộ đệm tám vòng; một hàm TSL tính độ cao gợn tại mỗi điểm, và pháp '
        + 'tuyến lấy từ độ dốc của hàm ấy. Pháp tuyến lệch thì chỗ đọc ảnh phản chiếu lệch theo: vòng gợn đi '
        + 'qua là bóng trăng bị xẻ đôi. Fresnel quyết định soi bao nhiêu: nhìn xiên về chân trời thì nước như '
        + 'gương, nhìn thẳng xuống thì thấy nước sâu đen. Lá nổi nhấp nhô theo cùng một hàm gợn.',
      diagram: matNuocDiagram,
      learned: [
        'Phản chiếu phẳng: vẽ cảnh thêm một lần từ camera lật qua mặt gương.',
        'Pháp tuyến lấy từ độ dốc của một hàm độ cao.',
        'Một hàm TSL dùng chung cho mặt nước và cho lá.',
      ],
      readMore: [
        { title: 'Ví dụ three.js: phản chiếu (WebGPU)', url: 'https://threejs.org/examples/#webgpu_reflection' },
        { title: 'Three.js Shading Language (TSL)', url: 'https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language' },
      ],
      knobs: {
        amplitude: 'Độ cao gợn',
        speed: 'Tốc độ lan',
        decay: 'Độ tắt dần',
        wavelength: 'Bước sóng',
        distortion: 'Độ méo ảnh phản chiếu',
        fresnelPower: 'Số mũ fresnel',
        reflectionResolution: 'Độ phân giải phản chiếu',
      },
      experiments: {
        lowRes: {
          label: 'Độ phân giải 0.1',
          explain: 'Ảnh phản chiếu chỉ còn một phần mười chiều rộng màn hình: bóng trăng vỡ thành khối. Đổi lại, '
            + 'lần vẽ thêm này rẻ hơn nhiều; máy yếu dùng mức 0.35.',
        },
        noFresnel: {
          label: 'Tắt fresnel',
          explain: 'Nước soi mạnh như nhau ở mọi góc nhìn, giống một tấm gương phẳng: mất cái sâu thăm thẳm '
            + 'khi nhìn gần xuống.',
        },
        heightfield: {
          label: 'Xem heightfield',
          explain: 'Hiện thẳng độ cao gợn dưới dạng ảnh xám: sáng là đỉnh sóng, tối là đáy sóng. Chạm vào mặt '
            + 'nước để thấy vòng gợn lan ra.',
        },
      },
      readouts: { reflectionScale: 'Độ phân giải phản chiếu (so với màn hình)' },
      objects: { 'mat-nuoc': 'Mặt nước' },
    },

    'vang-la': {
      understand:
        'Đom đóm ở đây không do CPU tính. Vị trí và vận tốc của từng con nằm trong hai bộ đệm trên GPU; mỗi '
        + 'khung, một compute shader chạy song song hàng nghìn luồng, mỗi luồng lo đúng một con: trôi theo dòng '
        + 'curl noise (một trường xoáy không dồn về chỗ nào), bị tay người xem hút lại hay đẩy ra. Rồi MỘT Sprite '
        + 'vẽ cả đàn, đọc vị trí thẳng từ bộ đệm mà không đi qua CPU. Đom đóm chỉ phát sáng (emissive), cộng dồn '
        + 'màu lên nhau (additive), nhấp nháy theo đồng hồ cảnh, và mờ đi trong sương. Phần phát sáng đi vào '
        + 'bloom của lớp Phủ bóng, nên chúng tỏa vàng lá.',
      diagram: vangLaDiagram,
      learned: [
        'Compute shader: GPU chạy cùng một hàm trên hàng nghìn phần tử cùng lúc.',
        'Dữ liệu ở lại trên GPU: bộ đệm vừa được tính vừa được vẽ.',
        'Curl noise: lấy curl của một trường noise để có dòng chảy không phân kỳ.',
        'Additive blending: ánh sáng cộng dồn, không che nhau.',
      ],
      readMore: [
        { title: 'Ví dụ three.js: hạt tính bằng compute (WebGPU)', url: 'https://threejs.org/examples/#webgpu_compute_particles' },
        { title: 'WebGPU Fundamentals · Compute shader', url: 'https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html' },
        { title: 'Bridson · Curl-noise cho mô phỏng dòng chảy (SIGGRAPH 2007)', url: 'https://www.cs.ubc.ca/~rbridson/docs/bridson-siggraph2007-curlnoise.pdf' },
      ],
      knobs: {
        size: 'Cỡ đom đóm',
        glow: 'Độ sáng',
        attraction: 'Lực hút của tay',
        flowScale: 'Cỡ dòng xoáy (nhỏ là xoáy to)',
        speed: 'Tốc độ trôi',
        blinkRate: 'Nhịp nháy',
        count: 'Số con',
      },
      experiments: {
        cpu: {
          label: 'CPU vs GPU',
          explain: 'Cùng luật bay, nhưng tính bằng JS: một vòng lặp đi qua từng con (tối đa 5.000), rồi chép cả mảng vị '
            + 'trí lên GPU mỗi khung. Nhìn cột ms CPU: phần việc mà compute shader làm song song trên GPU.',
        },
        noAdditive: {
          label: 'Tắt additive',
          explain: 'Bỏ phép cộng dồn ánh sáng: con vẽ sau che con vẽ trước, bất kể xa gần, và con đang tắt thành đốm '
            + 'tối. Hạt phát sáng cần additive vì ánh sáng không che nhau.',
        },
      },
      readouts: { count: 'Số con đang vẽ' },
      objects: { 'dom-dom': 'Đom đóm (GPU)', 'dom-dom-cpu': 'Đom đóm (CPU)' },
    },

    // Lớp dùng chung: chữ viết trung tính cho mọi bức. Muốn ví dụ riêng của ao sen thì ghi đè bằng spread ở đây.
    'phu-bong': { ...phuBong.layers['phu-bong'] },
  },
};
