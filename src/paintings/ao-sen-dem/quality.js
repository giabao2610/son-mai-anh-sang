// paintings/ao-sen-dem/quality.js — bảng chất lượng của Bức 1 (spec §10): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor).
 * reflection 0 = phản chiếu giả (không vẽ cảnh lần hai); shadow 0 = tắt bóng.
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, reflection: 0.5, fireflies: 3000, leaves: 1200, shadow: 1024, bloom: 0.5, fogOctaves: 3 },
    vua: { dpr: 1.5, reflection: 0.35, fireflies: 1500, leaves: 800, shadow: 512, bloom: 0.25, fogOctaves: 2 },
    thap: { dpr: 1.25, reflection: 0, fireflies: 600, leaves: 500, shadow: 0, bloom: 0.25, fogOctaves: 1 },
  },
  // Máy chậm thì hạ theo thứ tự này: thứ ít thấy nhất trước (độ nét, chi tiết của sương, độ nét của phản chiếu và bloom),
  // thứ thấy rõ sau cùng (số đom đóm, độ nét của bóng). Mục nào lớp không đưa ra ở mức hiện tại thì xưởng bỏ qua.
  ladder: ['dpr', 'suong.chi-tiet', 'mat-nuoc.phan-chieu', 'phu-bong.bloom', 'vang-la.dom-dom', 'anh-trang.bong'],
};
