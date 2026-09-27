// lib/random.js — Số ngẫu nhiên có hạt giống (mulberry32): cùng hạt giống thì ra cùng một dãy số.

/**
 * Tạo một bộ sinh số ngẫu nhiên TẤT ĐỊNH từ một hạt giống (seed).
 *
 * Điểm học: Math.random không cho chọn hạt giống, nên mỗi lần tải trang lại ra một bố cục khác,
 * và hai lần chụp cùng ?freeze=N không thể giống nhau. mulberry32 giữ trạng thái là MỘT số nguyên
 * 32 bit: mỗi lần gọi cộng một hằng số lẻ (đi hết vòng 2^32 mới lặp), rồi "trộn bit" bằng phép
 * nhân Math.imul và XOR với chính nó sau khi dịch bit. Nhanh và đủ đều cho đồ họa (không dùng cho mật mã).
 *
 * @param {number} seed  số nguyên bất kỳ; được ép về số nguyên 32 bit không dấu
 * @returns {() => number}  mỗi lần gọi trả một số trong [0, 1)
 */
export function mulberry32(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296; // chia cho 2^32 → [0, 1)
  };
}

/**
 * Số ngẫu nhiên trong [min, max), lấy từ một bộ sinh `rng` (ví dụ mulberry32(7)).
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randRange(rng, min, max) {
  return min + (max - min) * rng();
}
