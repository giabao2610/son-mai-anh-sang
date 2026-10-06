// paintings/dan-ga-me-con/quality.js — bảng chất lượng của Bức 4 (spec §20.8): số theo mức, và thứ tự hạ nấc khi máy chậm.

/**
 * Lớp đọc các số này qua ctx.budget (ghép lên mức mặc định của xưởng: engine/quality.js#budgetFor). Ba mức luôn cùng bộ khóa.
 * segments, segmentsMax: số vòng quanh mỗi khối gà (núm cot.segments) mặc định và tối đa. Mức cao 32 là hình đã duyệt ảnh: hai mặt kề nhau
 * gãy dưới góc mà Bản nét coi là nếp gấp. Mức vừa 28 tới ngay góc ấy, không thấy vệt nào, và bớt một phần tư số tam giác; mức thấp 24 bớt
 * gần nửa, mặt đa diện chỉ để lại vệt mực rất nhạt khi phóng to, mà ở cỡ điện thoại thì không thấy. Trần ở mức vừa và thấp là 32, hình đã
 * duyệt: 48 vòng có 334 nghìn tam giác, gấp 2,3 lần. grains: trần số hạt thóc (lớp Đàn gà). paper: số tầng noise của giấy (lớp Giấy
 * điệp). bloom: resolutionScale của bloom (Phủ bóng).
 * @type {import('../../engine/contracts/runtime.js').QualitySpec}
 */
export const quality = {
  levels: {
    cao: { dpr: 2, segments: 32, segmentsMax: 48, grains: 4096, paper: 3, bloom: 0.5 },
    vua: { dpr: 1.5, segments: 28, segmentsMax: 32, grains: 2048, paper: 2, bloom: 0.25 },
    thap: { dpr: 1.25, segments: 24, segmentsMax: 32, grains: 1024, paper: 2, bloom: 0.25 },
  },
  // Máy chậm thì hạ độ nét trước, rồi bớt nửa số hạt thóc, rồi một tầng noise của sợi dó (giấy phủ gần bốn phần mười số điểm ảnh), rồi bloom.
  // Số vòng của khối gà không có nấc: đổi hình lúc chạy là dựng lại geometry, và số tam giác đã theo mức (segments).
  ladder: ['dpr', 'dan-ga.thoc', 'giay-diep.chi-tiet', 'phu-bong.bloom'],
};
