// tests/helpers/image.js — đọc cỡ ảnh từ phần đầu file (WebP, JPEG) mà không cần thư viện ảnh: test hợp đồng kiểm poster và og.

/**
 * Cỡ của một ảnh WebP. Ba dạng khung đầu: 'VP8 ' (nén mất dữ liệu, canvas.toBlob sinh dạng này), 'VP8L' (không mất),
 * 'VP8X' (mở rộng: có alpha, metadata).
 * @param {Buffer} buf
 * @returns {{ width: number, height: number }}
 */
export function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('không phải file WebP');
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
  throw new Error(`WebP có khung đầu lạ: "${chunk}"`);
}

/**
 * Cỡ của một ảnh JPEG: đi qua các đoạn (marker) tới khung SOF (baseline hay progressive), nơi ghi cao và rộng.
 * @param {Buffer} buf
 * @returns {{ width: number, height: number }}
 */
export function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('không phải file JPEG');
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`JPEG hỏng ở byte ${i}`);
    const marker = buf[i + 1];
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('JPEG không có khung SOF');
}
