// paintings/cung-que/quality.js — bảng chất lượng của Bức 3 (spec §19.8): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor). Ba mức luôn cùng bộ khóa.
 * steps: số bước dò tối đa của mỗi tia (trần của núm cot.steps). shadowSteps, ao: số bước dò bóng và số mẫu AO (lớp Bóng mềm).
 * leaves: trần số lá đang rơi (lớp Lá đa). bloom: resolutionScale của bloom (Phủ bóng).
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, steps: 128, shadowSteps: 32, ao: 5, leaves: 64, bloom: 0.5 },
    vua: { dpr: 1.5, steps: 96, shadowSteps: 24, ao: 4, leaves: 48, bloom: 0.25 },
    thap: { dpr: 1.25, steps: 64, shadowSteps: 16, ao: 3, leaves: 32, bloom: 0.25 },
  },
  // Máy chậm thì hạ theo thứ tự này: độ nét trước, rồi số bước dò, rồi bloom.
  ladder: ['dpr', 'cot.buoc', 'phu-bong.bloom'],
};
