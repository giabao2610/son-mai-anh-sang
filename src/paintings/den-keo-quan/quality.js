// paintings/den-keo-quan/quality.js — bảng chất lượng của Bức 2 (spec §18.7): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor). Ba mức luôn cùng bộ khóa.
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, bloom: 0.5 },
    vua: { dpr: 1.5, bloom: 0.25 },
    thap: { dpr: 1.25, bloom: 0.25 },
  },
  // Máy chậm thì hạ theo thứ tự này: thứ ít thấy nhất trước.
  ladder: ['dpr', 'phu-bong.bloom'],
};
