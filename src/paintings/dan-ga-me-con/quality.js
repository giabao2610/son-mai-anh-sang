// paintings/dan-ga-me-con/quality.js — bảng chất lượng của Bức 4 (spec §20.8): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor). Ba mức luôn cùng bộ khóa.
 * grains: trần số hạt thóc (lớp Đàn gà, Task 8). paper: số tầng noise của giấy (lớp Giấy điệp, Task 6). bloom: resolutionScale của
 * bloom (Phủ bóng).
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, grains: 4096, paper: 3, bloom: 0.5 },
    vua: { dpr: 1.5, grains: 2048, paper: 2, bloom: 0.25 },
    thap: { dpr: 1.25, grains: 1024, paper: 2, bloom: 0.25 },
  },
  // Máy chậm thì hạ độ nét trước, rồi bloom. Task 6 và Task 8 thêm nấc của Giấy điệp và Đàn gà vào giữa.
  ladder: ['dpr', 'phu-bong.bloom'],
};
