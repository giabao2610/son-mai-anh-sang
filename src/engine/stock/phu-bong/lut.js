// engine/stock/phu-bong/lut.js — LUT "sơn mài" 32³ sinh từ bảng màu đã ghép: tối ấm về cánh gián, sáng ánh vàng lá, xanh ngả chàm.
import { ClampToEdgeWrapping, Data3DTexture, LinearFilter } from 'three/webgpu';

/** Cạnh của khối LUT: 32 ô mỗi chiều (32³ = 32.768 màu mẫu); card đồ họa nội suy giữa các ô. */
export const LUT_SIZE = 32;

/** Độ mạnh của ba lần tách tông (0–1 theo sắc độ của màu đích). Núm lutIntensity của lớp trộn thêm một lần nữa. */
const STRENGTH = { shadow: 0.9, light: 0.35, blue: 0.7 };

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Độ sáng cảm nhận (hệ số Rec. 709), tính trên màu hiển thị. */
export const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
/** Sắc độ của một màu: màu trừ đi độ sáng của nó. Cộng sắc độ vào một màu khác là "nhuộm" mà không đổi sáng. */
const chromaOf = (hex) => {
  const [r, g, b] = rgbOf(hex);
  const l = luma(r, g, b);
  return [r - l, g - l, b - l];
};

/**
 * Hàm thuần: mảng RGBA8 của LUT "sơn mài", ô (x, y, z) = màu vào (đỏ, lục, lam) như Lut3DNode tra (uvw = màu).
 * Tách tông theo độ sáng, rồi đặt lại độ sáng cũ: LUT đổi SẮC, gần như không đổi SÁNG.
 * - Vùng tối nhuộm sắc nâu cánh gián; tắt dần về 0 ở đen tuyệt đối, nên đen vẫn đen.
 * - Vùng sáng nhuộm sắc vàng lá; tắt dần ở trắng tuyệt đối, nên trắng vẫn trắng.
 * - Màu ngả lam (lam hơn cả đỏ lẫn lục) nhuộm thêm sắc chàm.
 * - Màu gần xám nhuộm mạnh, màu đậm nhuộm nhẹ: lá vẫn xanh, nhị vẫn vàng (màu của ca dao).
 * Màu lấy từ bảng đã ghép (ctx.palette.hex): bức ghi đè canhGian thì vùng tối của LUT đổi theo.
 * Đã loại hai cách: kéo mỗi màu về token gần nhất (ảnh thành tranh cắt dán), và gradient map theo độ sáng (mất hết lá xanh
 * và trời chàm).
 * @param {Record<string, string>} hex
 * @param {number} [size]
 * @returns {Uint8Array}  size³ × 4 byte
 */
export function lacquerLut(hex, size = LUT_SIZE) {
  const shadow = chromaOf(hex.canhGian);
  const light = chromaOf(hex.vangLa);
  const blue = chromaOf(hex.cham);
  const data = new Uint8Array(size ** 3 * 4);
  let i = 0;
  for (let z = 0; z < size; z++) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = [x / (size - 1), y / (size - 1), z / (size - 1)];
        const l = luma(...c);
        const bluish = clamp01((c[2] - Math.max(c[0], c[1])) * 2); // 0: không ngả lam; 1: lam hẳn
        // Màu càng gần xám thì nhuộm càng mạnh; màu đậm (lá xanh, nhị vàng) chỉ nhuộm nhẹ, để vẫn đúng màu của nó.
        const top = Math.max(...c);
        const soft = 0.4 + 0.6 * (top > 0 ? Math.min(...c) / top : 1);
        // Màu tối mà ngả lam (trời đêm) nhuộm chàm thay cho cánh gián: không để trời chàm ngả nâu.
        const ks = smooth(0, 0.12, l) * (1 - smooth(0.25, 0.6, l)) * (1 - bluish) * soft * STRENGTH.shadow;
        const kl = smooth(0.45, 0.85, l) * (1 - smooth(0.9, 1, l)) * soft * STRENGTH.light;
        const kb = bluish * STRENGTH.blue;
        const out = c.map((v, k) => v + shadow[k] * ks + light[k] * kl + blue[k] * kb);
        const drift = l - luma(...out); // đặt lại độ sáng: nhuộm là đổi sắc, không đổi sáng
        for (let k = 0; k < 3; k++) data[i++] = Math.round(clamp01(out[k] + drift) * 255);
        data[i++] = 255;
      }
    }
  }
  return data;
}

/**
 * Bọc LUT thành texture 3D cho lut3D(). Data3DTexture mặc định lọc NearestFilter (Phụ lục A.14): phải đặt LinearFilter để
 * card đồ họa nội suy giữa 32 ô, không thì màu vỡ thành bậc. Màu trong LUT đã là màu hiển thị: giữ NoColorSpace (mặc định).
 * @param {Record<string, string>} hex
 * @param {number} [size]
 */
export function lutTexture(hex, size = LUT_SIZE) {
  const texture = new Data3DTexture(lacquerLut(hex, size), size, size, size);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.wrapR = ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return texture;
}
