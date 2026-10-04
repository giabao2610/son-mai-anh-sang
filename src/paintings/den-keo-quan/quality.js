// paintings/den-keo-quan/quality.js — bảng chất lượng của Bức 2 (spec §18.7): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor). Ba mức luôn cùng bộ khóa.
 * mask: bề rộng mặt nạ hình nhân (texel; cao = rộng / 4). octaves: số tầng noise mặc định của lớp Gian nhà (vôi, gỗ, gạch).
 * fiber: số tầng noise của sợi giấy. shadowMap: cỡ cube shadow map của thí nghiệm "Shadow map thật" (0 = không có thí nghiệm).
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, mask: 2048, bloom: 0.5, octaves: 3, fiber: 2, shadowMap: 512 },
    vua: { dpr: 1.5, mask: 2048, bloom: 0.25, octaves: 2, fiber: 1, shadowMap: 256 },
    thap: { dpr: 1.25, mask: 1024, bloom: 0.25, octaves: 1, fiber: 1, shadowMap: 0 },
  },
  // Máy chậm thì hạ theo thứ tự này: thứ ít thấy nhất trước (độ nét, chi tiết của vôi và gỗ, sợi giấy, rồi bloom).
  ladder: ['dpr', 'gian-nha.chi-tiet', 'giay.soi', 'phu-bong.bloom'],
};
