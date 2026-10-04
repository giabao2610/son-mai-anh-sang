// paintings/den-keo-quan/parts/cot-doan-quan.js — của lớp Cốt, dữ liệu thuần: tám hình nhân của đoàn quân rước cờ, ghép từ hình cơ bản (dáng cắt giấy).

/**
 * Mỗi hình: id, bề rộng (hộp bao theo chiều quay), các hình cơ bản. Đơn vị là chiều cao dải (dải cao 0,14 m). x tính từ tâm hình,
 * dương là phía trước (chiều đi); y tính từ mép dưới dải, vạch đất ở 0,031–0,066 nên chân đặt ở y ≈ 0,07.
 * Dáng cắt giấy (spec §18.3): khối phẳng, mép gọn, chân tay đủ dày để bóng còn đọc được qua nửa tối; chân ngựa và cờ so le để
 * bóng chạy có nhịp. Tổng bề rộng của mười hình (núm figures tối đa) không quá chu vi dải: test giữ.
 */

/** Người đứng, đang bước: hai chân, áo, đầu, nón chóp. dx dời cả người theo chiều ngang. */
const walker = (dx = 0) => [
  { kind: 'capsule', ax: dx - 0.035, ay: 0.07, bx: dx - 0.01, by: 0.3, r: 0.027 }, // chân sau
  { kind: 'capsule', ax: dx + 0.055, ay: 0.07, bx: dx + 0.02, by: 0.3, r: 0.027 }, // chân trước
  { kind: 'poly', points: [[dx - 0.055, 0.29], [dx + 0.065, 0.29], [dx + 0.045, 0.55], [dx - 0.035, 0.55]] }, // áo
  { kind: 'circle', cx: dx + 0.01, cy: 0.595, r: 0.038 }, // đầu
  { kind: 'poly', points: [[dx - 0.05, 0.62], [dx + 0.07, 0.62], [dx + 0.01, 0.69]] }, // nón chóp
];

/** Ngựa đang phi (không có người): mình, ức, mông, cổ, đầu cúi, tai, bốn chân so le, đuôi bay. */
const horse = () => [
  { kind: 'ellipse', cx: 0, cy: 0.37, rx: 0.175, ry: 0.08 }, // mình
  { kind: 'circle', cx: 0.12, cy: 0.38, r: 0.068 }, // ức
  { kind: 'circle', cx: -0.13, cy: 0.385, r: 0.07 }, // mông
  { kind: 'poly', points: [[0.1, 0.42], [0.16, 0.53], [0.215, 0.55], [0.2, 0.42]] }, // cổ vươn tới
  { kind: 'poly', points: [[0.17, 0.54], [0.21, 0.585], [0.235, 0.565], [0.285, 0.48], [0.262, 0.455], [0.215, 0.505]] }, // đầu cúi
  { kind: 'poly', points: [[0.195, 0.575], [0.2, 0.625], [0.22, 0.585]] }, // tai
  { kind: 'capsule', ax: 0.14, ay: 0.33, bx: 0.22, by: 0.25, r: 0.022 }, // chân trước, vươn tới
  { kind: 'capsule', ax: 0.22, ay: 0.25, bx: 0.26, by: 0.17, r: 0.018 },
  { kind: 'capsule', ax: 0.11, ay: 0.32, bx: 0.08, by: 0.22, r: 0.022 }, // chân trước, co lại
  { kind: 'capsule', ax: 0.08, ay: 0.22, bx: 0.13, by: 0.15, r: 0.018 },
  { kind: 'capsule', ax: -0.14, ay: 0.33, bx: -0.19, by: 0.23, r: 0.024 }, // chân sau, đạp ra sau
  { kind: 'capsule', ax: -0.19, ay: 0.23, bx: -0.25, by: 0.16, r: 0.018 },
  { kind: 'capsule', ax: -0.1, ay: 0.32, bx: -0.08, by: 0.2, r: 0.024 }, // chân sau, chạm đất
  { kind: 'capsule', ax: -0.08, ay: 0.2, bx: -0.1, by: 0.075, r: 0.018 },
  { kind: 'poly', points: [[-0.18, 0.42], [-0.24, 0.455], [-0.265, 0.43], [-0.245, 0.37], [-0.195, 0.38]] }, // đuôi bay
];

export const FIGURES = [
  {
    id: 'cuoi-ngua', // người cưỡi ngựa phất cờ
    width: 0.57,
    shapes: [
      ...horse(),
      { kind: 'capsule', ax: 0, ay: 0.44, bx: 0.05, by: 0.34, r: 0.026 }, // chân người buông bên hông ngựa
      { kind: 'capsule', ax: 0, ay: 0.46, bx: 0.02, by: 0.6, r: 0.044 }, // mình người
      { kind: 'circle', cx: 0.03, cy: 0.655, r: 0.034 }, // đầu
      { kind: 'poly', points: [[-0.035, 0.675], [0.095, 0.675], [0.03, 0.735]] }, // nón chóp
      { kind: 'capsule', ax: 0.03, ay: 0.57, bx: 0.08, by: 0.62, r: 0.015 }, // tay cầm cờ
      { kind: 'capsule', ax: 0.08, ay: 0.5, bx: 0.065, by: 0.94, r: 0.011 }, // cán cờ
      { kind: 'poly', points: [[0.065, 0.94], [-0.13, 0.9], [-0.09, 0.865], [-0.13, 0.83], [0.065, 0.8]] }, // cờ đuôi nheo bay
    ],
  },
  {
    id: 'linh-co', // lính vác cờ đuôi nheo
    width: 0.3,
    shapes: [
      ...walker(),
      { kind: 'capsule', ax: 0.02, ay: 0.5, bx: 0.07, by: 0.46, r: 0.018 }, // tay
      { kind: 'capsule', ax: 0.07, ay: 0.36, bx: 0.045, by: 0.94, r: 0.011 }, // cán cờ
      { kind: 'poly', points: [[0.045, 0.94], [-0.14, 0.9], [-0.08, 0.865], [-0.14, 0.83], [0.045, 0.8]] }, // cờ đuôi nheo
    ],
  },
  {
    id: 'voi', // voi có bành và người quản tượng
    width: 0.56,
    shapes: [
      { kind: 'ellipse', cx: -0.03, cy: 0.38, rx: 0.19, ry: 0.125 }, // mình
      { kind: 'circle', cx: 0.14, cy: 0.42, r: 0.085 }, // đầu
      { kind: 'circle', cx: 0.165, cy: 0.47, r: 0.05 }, // trán gồ
      { kind: 'poly', points: [[0.07, 0.49], [0.13, 0.5], [0.15, 0.4], [0.12, 0.33], [0.08, 0.36]] }, // tai
      { kind: 'capsule', ax: 0.21, ay: 0.41, bx: 0.235, by: 0.31, r: 0.03 }, // vòi, cong xuống rồi hất lên
      { kind: 'capsule', ax: 0.235, ay: 0.31, bx: 0.23, by: 0.2, r: 0.024 },
      { kind: 'capsule', ax: 0.23, ay: 0.2, bx: 0.255, by: 0.15, r: 0.017 },
      { kind: 'poly', points: [[0.19, 0.345], [0.265, 0.33], [0.195, 0.32]] }, // ngà
      { kind: 'capsule', ax: -0.18, ay: 0.3, bx: -0.18, by: 0.075, r: 0.038 }, // hai cặp chân, cách nhau một khe
      { kind: 'capsule', ax: -0.09, ay: 0.3, bx: -0.1, by: 0.075, r: 0.034 },
      { kind: 'capsule', ax: 0.05, ay: 0.3, bx: 0.05, by: 0.075, r: 0.038 },
      { kind: 'capsule', ax: 0.14, ay: 0.32, bx: 0.145, by: 0.075, r: 0.034 },
      { kind: 'capsule', ax: -0.215, ay: 0.42, bx: -0.25, by: 0.29, r: 0.01 }, // đuôi
      { kind: 'poly', points: [[-0.15, 0.49], [0.05, 0.49], [0.06, 0.58], [-0.16, 0.58]] }, // bành
      { // mái bành: vòm cong
        kind: 'poly',
        points: [[-0.19, 0.58], [-0.17, 0.63], [-0.11, 0.665], [-0.05, 0.68], [0.01, 0.665], [0.07, 0.63], [0.09, 0.58]],
      },
      { kind: 'capsule', ax: -0.05, ay: 0.67, bx: -0.05, by: 0.88, r: 0.008 }, // cờ nhỏ trên mái
      { kind: 'poly', points: [[-0.05, 0.88], [-0.15, 0.85], [-0.05, 0.815]] },
      { kind: 'capsule', ax: 0.15, ay: 0.5, bx: 0.155, by: 0.565, r: 0.026 }, // người quản tượng ngồi trên cổ
      { kind: 'circle', cx: 0.16, cy: 0.6, r: 0.027 },
      { kind: 'poly', points: [[0.125, 0.615], [0.195, 0.615], [0.16, 0.655]] },
    ],
  },

  {
    id: 'danh-trong', // người đánh trống, trống đeo trước ngực
    width: 0.28,
    shapes: [
      ...walker(-0.02),
      { kind: 'circle', cx: 0.065, cy: 0.42, r: 0.062 }, // trống
      { kind: 'capsule', ax: 0.01, ay: 0.5, bx: 0.1, by: 0.57, r: 0.012 }, // tay giơ dùi
      { kind: 'capsule', ax: 0.1, ay: 0.57, bx: 0.12, by: 0.63, r: 0.008 }, // dùi
      { kind: 'capsule', ax: 0.0, ay: 0.47, bx: 0.09, by: 0.47, r: 0.012 }, // tay kia gõ
    ],
  },
  {
    id: 'linh-giao', // lính cầm giáo
    width: 0.26,
    shapes: [
      ...walker(-0.01),
      { kind: 'capsule', ax: 0.01, ay: 0.49, bx: 0.06, by: 0.45, r: 0.018 }, // tay
      { kind: 'capsule', ax: 0.075, ay: 0.12, bx: 0.035, by: 0.88, r: 0.009 }, // cán giáo
      { kind: 'poly', points: [[0.02, 0.88], [0.05, 0.88], [0.034, 0.95]] }, // mũi giáo
    ],
  },
  {
    id: 'ngua', // ngựa phi không người
    width: 0.57,
    shapes: horse(),
  },
  {
    id: 'cam-long', // người cầm lọng
    width: 0.28,
    shapes: [
      ...walker(-0.01),
      { kind: 'capsule', ax: 0.0, ay: 0.5, bx: 0.05, by: 0.52, r: 0.016 }, // tay
      { kind: 'capsule', ax: 0.05, ay: 0.42, bx: 0.03, by: 0.885, r: 0.009 }, // cán lọng
      { // tán lọng: vòm cong quanh cán (tâm x 0,03), mép dưới thẳng
        kind: 'poly',
        points: [[-0.08, 0.79], [-0.07, 0.83], [-0.035, 0.865], [0.03, 0.885], [0.095, 0.865], [0.13, 0.83], [0.14, 0.79]],
      },
      { kind: 'capsule', ax: 0.03, ay: 0.885, bx: 0.03, by: 0.91, r: 0.006 }, // chóp lọng
    ],
  },
  {
    id: 'thoi-tu-va', // người thổi tù và
    width: 0.28,
    shapes: [
      ...walker(-0.03),
      { kind: 'capsule', ax: -0.01, ay: 0.5, bx: 0.04, by: 0.585, r: 0.015 }, // tay đỡ tù và
      { kind: 'capsule', ax: 0.02, ay: 0.6, bx: 0.07, by: 0.62, r: 0.01 }, // tù và: cong lên, loe dần
      { kind: 'capsule', ax: 0.07, ay: 0.62, bx: 0.1, by: 0.67, r: 0.014 },
      { kind: 'capsule', ax: 0.1, ay: 0.67, bx: 0.11, by: 0.74, r: 0.02 },
    ],
  },
];
