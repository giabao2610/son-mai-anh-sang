// paintings/dan-ga-me-con/parts/cot-giay.js — của lớp Cốt: tờ giấy cong như phông chụp ảnh (sàn, chỗ uốn, vách) thành một lưới; UV theo đơn vị cảnh, chạy theo chiều dài cung nên thớ giấy không giãn ở chỗ uốn.
import { BufferGeometry, Float32BufferAttribute } from 'three/webgpu';
import { PAPER } from './cot-bo-cuc.js';

const FLAT = PAPER.front - PAPER.back; // 8
const ARC = (Math.PI / 2) * PAPER.bend; // ≈ 3,14
const WALL = PAPER.top - PAPER.bend; // 2,5
/** Chiều dài mặt cắt, từ mép trước tới mép trên (đơn vị cảnh). Giấy điệp đặt noise theo UV này. */
export const PAPER_LENGTH = FLAT + ARC + WALL;

/**
 * Điểm trên mặt cắt ở chiều dài cung s (0 ở mép trước): y, z và pháp tuyến (ny, nz).
 * Sàn: y = 0, pháp tuyến lên. Chỗ uốn: cung tròn tâm (y = bend, z = back), pháp tuyến quay dần từ lên sang ra phía trước. Vách: z = back − bend.
 * @param {number} s
 * @returns {{ y: number, z: number, ny: number, nz: number }}
 */
export function profile(s) {
  if (s <= FLAT) return { y: 0, z: PAPER.front - s, ny: 1, nz: 0 };
  if (s <= FLAT + ARC) {
    const a = (s - FLAT) / PAPER.bend;
    return { y: PAPER.bend * (1 - Math.cos(a)), z: PAPER.back - PAPER.bend * Math.sin(a), ny: Math.cos(a), nz: Math.sin(a) };
  }
  return { y: PAPER.bend + (s - FLAT - ARC), z: PAPER.back - PAPER.bend, ny: 0, nz: 1 };
}

const range = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / n);

/** Lưới của tờ giấy: 8 cột theo x; hàng thưa trên sàn và vách, dày ở chỗ uốn (để cung tròn mịn). UV = (x + 7, s), theo đơn vị cảnh. */
export function paperGeometry() {
  const rows = [...range(0, FLAT, 8), ...range(FLAT, FLAT + ARC, 16), ...range(FLAT + ARC, PAPER_LENGTH, 6), PAPER_LENGTH];
  const cols = 8;
  const pos = [];
  const nor = [];
  const uv = [];
  for (const s of rows) {
    const p = profile(s);
    for (let c = 0; c <= cols; c += 1) {
      const x = -PAPER.width / 2 + (PAPER.width * c) / cols;
      pos.push(x, p.y, p.z);
      nor.push(0, p.ny, p.nz);
      uv.push(x + PAPER.width / 2, s);
    }
  }
  const index = [];
  for (let r = 0; r < rows.length - 1; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const a = r * (cols + 1) + c;
      const d = a + cols + 1;
      index.push(a, a + 1, d, a + 1, d + 1, d); // ngược chiều kim đồng hồ khi nhìn từ phía pháp tuyến
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  return g;
}
