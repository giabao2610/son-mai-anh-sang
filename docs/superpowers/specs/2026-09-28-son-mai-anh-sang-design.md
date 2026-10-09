# Sơn Mài Ánh Sáng: thiết kế

> Vẽ tranh 3D bằng những lớp ánh sáng; mài từng lớp để thấy bức tranh được làm ra thế nào.
>
> **Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng.
>
> **Bức 2 · Đèn Kéo Quân** (GĐ 6, §18): một ngọn đèn kéo quân trong gian nhà tối, sơn từ sáu lớp ánh sáng.
>
> **Bức 3 · Cung Quế** (GĐ 7, §19): chú Cuội ngồi gốc cây đa trên một mặt trăng nhỏ, sơn từ sáu lớp ánh sáng.
>
> **Bức 4 · Đàn Gà Mẹ Con** (GĐ 8, §20): một tờ tranh Đông Hồ bước vào được, sơn từ sáu lớp ánh sáng.
>
> **GĐ 9** (§21): hai công cụ học cho cả bốn bức: **Bản dịch** (mã shader thật của từng lớp) và **Link công thức** (gửi bức đã mài
> bằng một link).

- **Ngày:** 2026-09-28
- **Chủ dự án:** Bao Nguyen (GitHub `giabao2610`)
- **Trạng thái:** bản 2. Bản 1 đã được duyệt trong hội thoại. Bản 2 thêm định nghĩa kỹ thuật và kiến trúc để mở rộng, sau đó qua 4 vòng phản biện: nhất quán, thử mở rộng, đối chiếu bằng chứng API, và tải của GĐ 0. Các chi tiết API đã được kiểm bằng code chạy thật trên three@0.186.1 (Phụ lục A).

### Bản 2 đổi gì so với bản 1
- **§0 (mới):** "Sơn Mài Ánh Sáng" là **một kỹ thuật**. Ao Sen Đêm là **Bức 1** làm bằng kỹ thuật đó. Có bảng từ vựng và 8 luật của kỹ thuật.
- **§8:** kiến trúc gồm ba vùng: **xưởng** (`src/engine/`, `src/ui/`), **hộp màu** (`src/lib/`) và **các bức** (`src/paintings/<slug>/`). Có hợp đồng JSDoc, luật phụ thuộc do test giữ, và vòng đời của một bức.
- **§6, §7, §9, §10:** sửa theo những gì đã kiểm trên r186:
  - `resolutionScale`, blend mode của kênh `emissive`;
  - tone mapping chọn bằng `Fn` + `If` (không dùng `select()`, vì cách đó làm alpha bằng 0);
  - tên uniform phải là định danh hợp lệ;
  - target của reflector phải nằm trong scene;
  - nền canvas đặc;
  - sương và bóng không bật/tắt lúc chạy;
  - lỗi GPU đến không đồng bộ;
  - bloom 0.5/0.25;
  - cách đếm draw call.
- **§8.7:** định nghĩa đủ các cờ URL: `?at` (giờ Việt Nam), `?freeze` (đồng hồ tất định), `?poster`, `?debug`.
- **§12, §13:** thêm test luật ranh giới (phân tích bằng `parseSync` của Vite), test hợp đồng, e2e đã chạy thử, cách cài Node 24 theo thư mục, và thứ tự deploy lần đầu.
- **§14:** GĐ 0 dựng **Ao Sen Đêm v0** đi qua đúng hợp đồng lớp.
- **§15, §16 (mới):** công thức mở rộng từng bước, và danh sách việc để sau (đã có đường đi).
- **Phụ lục A (mới):** các sự thật API đã kiểm.

---

## 0. Sơn Mài Ánh Sáng là một kỹ thuật

Trong mỹ thuật Việt, **sơn mài là một kỹ thuật**, không phải một loại tranh. Người thợ phủ nhiều lớp sơn, có khi dát vàng, dát bạc hay cẩn vỏ trứng. Sau đó họ mài cho lớp dưới lộ ra, rồi phủ bóng.

Dự án dùng lại đúng ý đó. **Sơn Mài Ánh Sáng là cách dựng tranh 3D bằng nhiều lớp ánh sáng:**
- Mỗi lớp là một kỹ thuật dựng hình, có trọng số từ 0 đến 1.
- "Mài" là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt đất sét**.

Ao Sen Đêm là **Bức 1**. (GĐ 6) Đèn Kéo Quân là **Bức 2** (§18). (GĐ 7) Cung Quế là **Bức 3** (§19). (GĐ 8) Đàn Gà Mẹ Con, một tranh Đông Hồ, là **Bức 4** (§20). Bức nào cũng làm bằng cùng kỹ thuật và dùng chung một xưởng.

### Từ vựng (dùng giống nhau trong tài liệu và trong code)

| Từ | Nghĩa | Trong code |
|---|---|---|
| **kỹ thuật** | cả dự án cùng các luật của nó (mục dưới) | repo này |
| **xưởng** | đồ nghề dùng chung: khung vẽ, pipeline, bộ điều chỉnh chất lượng, Sổ tay, công cụ học, lớp Phủ bóng. **Xưởng không biết có bức nào tồn tại.** | `src/engine/`, `src/ui/` |
| **hộp màu** | hàm "lá", không biết gì về xưởng hay tranh: âm lịch, pha trăng, PRNG, hàm TSL dùng chung | `src/lib/` |
| **bức tranh** | một tác phẩm: một thư mục, một trang HTML, một dòng registry | `src/paintings/<slug>/` |
| **lớp** | một kỹ thuật dựng hình trong một bức, có trọng số 0 → 1. Lớp đầu luôn là **Cốt** | `layers/lN-<id>.js` |
| **lớp dùng chung** | lớp thuộc về kỹ thuật, bức nào cũng lắp được (hiện có Phủ bóng) | `src/engine/stock/<id>/` |
| **núm** | tham số người xem chỉnh được của một lớp | `export const knobs` |
| **núm của bức** (Dial) | tham số của cả bức, ví dụ thanh giờ của Bức 1 | `setup().dials` |
| **nấc** | một bước hạ chất lượng khi máy yếu | `Layer.degrade` |
| **công cụ** | công cụ học chạy được trên mọi bức: Kính mài, Lột lớp | `src/engine/tools/` |
| **view** | một ảnh trung gian mà công cụ nhìn được: `final`, `emissive`, `normal`, `depth`, hoặc ảnh chụp giữa chừng (tap) của một lớp | `pipeline.views()` |
| **con dấu** | dấu đỏ ghi ngày âm lịch, chữ ký của kỹ thuật, bức nào cũng có | `[data-seal]` |

**Cách phân biệt:** thứ gì mang tên một bước của nghề (cốt, phủ, mài, phủ bóng, con dấu) thì thuộc về xưởng. Thứ gì mang tên chủ đề (sen, trăng, gợn nước, đom đóm, giờ đêm) thì thuộc về bức.

### Luật của kỹ thuật (mọi bức phải theo)
1. Bức nào cũng là một chồng lớp có thứ tự. Lớp đầu tiên luôn là **Cốt**:
   - id là `'cot'`, trọng số cố định bằng 1, không tắt được;
   - Cốt dựng hình khối và **đèn xưởng** (đèn trung tính để đất sét đọc được hình).

   Số lớp là `N`, không cố định ở 6.
2. Mỗi lớp khác Cốt có **trọng số** `0 → 1` do xưởng tạo. Bật/tắt là tween uniform, **không biên dịch lại shader**.
3. **Khi mọi trọng số (trừ Cốt) bằng 0, bức trở về cốt đất sét:**
   - hình khối có màu `datSet #8A8580` dưới đèn xưởng;
   - ánh sáng, hạt và hậu kỳ đều tắt;
   - nền là `denThen`.

   Màn hình không bao giờ đen kịt, trống hay trong suốt.
4. Lớp nào cũng có đủ 3 tab **Hiểu / Chỉnh / Phá** trong Sổ tay.
5. Bức nào cũng có **con dấu âm lịch** và **thơ có ghi nguồn**. Màu đi ra từ **bảng màu sơn mài** (§5).
6. Bức nào cũng có **3 tầng dự phòng** (§9), và poster hiện ra từ HTML tĩnh.
7. Thêm một bức = **một thư mục + một trang HTML + một thư mục poster trong `public/` + một dòng registry**.
   - Không phải sửa xưởng, trừ khi bức cần một khả năng mới. Khi đó chỉ **thêm trường tùy chọn** vào hợp đồng và xưởng làm một lần, mọi bức sau dùng được.
   - Không bao giờ viết code rẽ nhánh theo `slug`.
8. Mọi material trong scene pass **gán `emissiveNode` tường minh** (kể cả `vec3(0)`), vì xưởng đọc kênh `emissive` của mọi bức. Trước khi biên dịch, xưởng tự gán `vec3(0)` cho material nào còn thiếu, như một lưới an toàn.

---

## 1. Bối cảnh và mục tiêu

### Bạn đã nói
- Muốn làm một trang web 3D lấy cảm hứng từ project "Trung Thu 3D" (của devpan.vercel.app). Project đó chỉ để **tham khảo**.
- **Không thương mại.** Mục đích là **khám phá và học về vẻ đẹp của 3D**.
- Cách gắn bó: **"vừa ngắm vừa học"**. Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang.
- Chọn hướng **1 · Sơn Mài Ánh Sáng** trong 3 hướng đã đề xuất.
- Đợt này làm phần lõi, từ giai đoạn 0 đến 4.
- Repo **public** trên GitHub cá nhân, deploy bằng GitHub Pages.
- **(Bản 2)** Muốn về sau **dễ phát triển thêm** (§0).
- **(Bản 2)** Muốn viết xong kế hoạch là **thực thi luôn** cho tới khi ra sản phẩm.
- **(GĐ 3)** Muốn sản phẩm **hợp với nhiều loại phần cứng**, không ép phần cứng quá sức (các biện pháp ở §10).
- **(GĐ 4)** Muốn GĐ 4 gồm:
  - đủ các mục ở §14, cộng các mục còn nợ của GĐ 3;
  - bộ điều chỉnh **đo thời gian GPU thật**, và chẩn đoán theo máy khi đo được (§10);
  - kiểm tra a11y bằng axe-core ngay trong e2e.

  Đồ nghề (Kính mài, Lột lớp, thanh giờ) nằm trong thanh lớp. Kính mài có hai hình: tròn, và gạt trước/sau (§4.1, §7).
- **(GĐ 5)** GĐ 5 là giai đoạn tùy chọn. Bạn chọn ba mục trong sáu mục của §14:
  - **Trăng tiến độ:** trăng cạnh con dấu có một vòng quầng vẽ dần theo các bước tải cảnh 3D (§4.1);
  - **Từng sợi:** công cụ học thứ ba, dựng lại khung hình từng lần vẽ một, chỉ trong lượt vẽ cảnh (§7);
  - **Thả hoa đăng:** chạm hai lần lên nước thì thả một ngọn hoa đăng mang một cặp câu thơ, chữ đi theo đèn (§4.2).

  Bạn duyệt ba cách làm: Từng sợi chặn lần vẽ bằng `renderer.setRenderObjectFunction`; xưởng thêm `ctx.captions` cho chữ đi theo một
  điểm 3D; hoa đăng thuộc lớp Ánh trăng, gộp với đèn ở bờ thành một InstancedMesh. Link công thức, "Xem bản dịch" và đàn bầu để sau
  (§16). Bạn giao cho Claude tự quyết chi tiết của Từng sợi, trăng tiến độ và phần kiểm thử, rồi duyệt lại một lượt trong spec.

  Lúc dựng thử GĐ 5, Bạn chọn thêm:
  - chữ đi theo vật dừng trên chân khung, thay cho làm mờ thơ khi có chữ (§4.1 mục 10; thơ luôn hiện, mục 2);
  - sửa luôn trong GĐ 5 hai lỗi có từ GĐ 4: bảng công cụ nằm dưới Sổ tay trên máy tính, và Tab từ nút công cụ phải vòng qua cả
    trang mới tới bảng của nó (§4.1 mục 6, §7 "Thanh công cụ");
  - sửa luôn lỗi có từ GĐ 2: "Dựng lại cảnh" quá hạn 10 giây vẫn đổi trang đã về tĩnh (§9, §12 `run`).
- **(GĐ 6)** Bạn chọn làm **Bức 2 · Đèn Kéo Quân** (§18), trả lời từng câu ngày 2026-10-04:
  - bố cục **gian nhà tối**: đèn ở giữa gian nhà gỗ, bóng chạy quanh vách và trần;
  - cử chỉ **thổi nến, giữ trống**: chạm để thổi nến, giữ để giữ trống, vuốt để gạt trống;
  - bộ hình nhân **đoàn quân rước cờ**: ngựa, voi, lính vác cờ, người đánh trống;
  - điều hướng **lật tranh trước/sau**: link viết sẵn trong HTML tĩnh; Phòng tranh để tới Bức 3, cùng lúc với trình sinh HTML (§16);
  - cách dựng bóng **A**: gobo `atan(y, x)` làm node bóng tự viết của ngọn nến (`light.shadow.shadowNode`), không thêm lượt vẽ nào;
    shadow map thật là một thí nghiệm kiểu "so" trong tab Phá;
  - sáu lớp: Cốt, Ngọn nến, Gian nhà, Giấy, Kéo quân, Phủ bóng.

  Sau phần thiết kế đầu tiên (sáu lớp), Bạn nói "làm luôn đến spec": Claude tự quyết phần còn lại của §18, rồi Bạn duyệt một lượt
  trong spec. Duyệt xong, Bạn chọn làm thẳng, vừa làm vừa sửa, thay cho dựng thử trên nhánh vứt đi như GĐ 4–5 (§18.9).
- **(GĐ 7)** Bạn chọn làm **Bức 3 · Cung Quế** (§19), trả lời từng câu ngày 2026-10-04 và 2026-10-05:
  - chủ đề **Cung Quế**: chú Cuội ngồi gốc cây đa trên cung trăng; kỹ thuật **SDF raymarching**: không có tam giác nào, bóng mềm và AO
    lấy từ trường khoảng cách;
  - bố cục **tiểu hành tinh**: mặt trăng là một hành tinh nhỏ giữa trời đen, Trái Đất treo trên trời, camera xoay quanh;
  - ánh sáng **pha trăng thật**: nắng theo pha trăng của ngày đang xem; núm "Ngày âm lịch" kéo qua cả tháng; phần đêm có ánh đất;
  - cử chỉ **chạm và giữ**: chạm thì lá đa rơi (trọng lực trăng), giữ thì cây đa nhổ rễ bay lên (hòa khối của SDF); kéo vẫn xoay camera;
  - cách vẽ **khối bao**: một mesh cầu bao quanh thế giới; shader của nó dò tia vào trong, ghi độ sâu và pháp tuyến như vật thường.

  Sau phần thiết kế đầu tiên (cảnh, sáu lớp, cử chỉ), Bạn nói "làm luôn đến spec": Claude tự quyết phần còn lại của §19 (kỹ thuật,
  Phòng tranh và trình sinh trang, CI, kiểm thử, cách làm), rồi Bạn duyệt một lượt trong spec.
- **(GĐ 8)** Bạn chọn làm **Bức 4 · Đàn Gà Mẹ Con** (§20), trả lời từng câu ngày 2026-10-05:
  - ý tưởng **Bước vào tranh**: nhìn thẳng là một tờ tranh Đông Hồ (mảng màu phẳng, nét đen, giấy điệp); kéo xoay thì tranh hóa ra
    một sa bàn 3D, đàn gà là tượng đất; mài là gỡ từng bản in, về lại tượng đất;
  - tranh **Đàn gà mẹ con**: gà mẹ và mười gà con; hạt compute là thóc;
  - camera **tranh tự khép lại**: buông tay vài giây thì camera quay về góc nhìn của tranh;
  - cử chỉ **rắc thóc, gà mẹ gọi**: chạm thì rắc thóc, gà con chạy tới mổ; giữ thì gà mẹ xòe cánh gọi, đàn con chạy về núp;
  - ba cách làm Claude đề xuất:
    - **camera trực giao thật** (`CameraSpec.kind: 'ortho'`);
    - **nét mực dò cạnh trên ảnh độ sâu**, cộng nét trong vẽ bằng shader và núm lệch bản;
    - **rút hạt compute lên `lib/tsl/particles.js`**: Bức 1 giữ nguyên từng ký tự shader, Sổ tay hiện cả code trong `lib`.

  Sau phần thiết kế đầu tiên (cảnh, sáu lớp, cử chỉ), Bạn nói "làm luôn đến spec": Claude tự quyết phần còn lại của §20 (xưởng, bể
  hạt, chất lượng, kiểm thử, cách làm), rồi Bạn duyệt một lượt trong spec.
- **(GĐ 9)** Bạn chọn hai công cụ học trong dòng "9+" của §14: **Bản dịch** và **Link công thức** (§21), trả lời từng câu ngày
  2026-10-07 và 2026-10-08:
  - bản dịch nằm ở **Sổ tay › Chỉnh**, cạnh code JS của lớp: chọn vật mà lớp có mặt, dòng có uniform của lớp sáng lên, rê núm thì sáng
    đúng dòng của núm;
  - lấy link bằng **nút "Chép link công thức" cộng thanh địa chỉ** tự mang công thức (`#r=…`) mỗi khi mài hay chỉnh;
  - mở một link có công thức thì cảnh hiện thẳng theo công thức, **thanh lớp mở sẵn** với một dòng tóm tắt và nút "Về nguyên bản";
  - lấy mã shader bằng **API công khai** `renderer.debug.getShaderAsync`, đặt đúng render target và MRT của lượt vẽ cảnh; lúc đọc thì
    cảnh giữ khung. Task đầu thử trước; hỏng thì đổi sang đọc RenderObject của lần vẽ thật. Luật dừng của Task 2 không đạt (mã lệch từng
    ký tự, thêm program mới: §21.9); ngày 2026-10-09 Bạn đồng ý đường lùi **"bắt lúc vẽ"**: mã đọc từ chính RenderObject của một khung vẽ
    thật, qua móc lần vẽ (§21.3).

  Sau phần thiết kế đầu tiên (Bản dịch), Bạn nói "làm luôn đến spec": Claude tự quyết phần còn lại của §21 (dạng link, áp công
  thức lúc dựng, thanh địa chỉ, xưởng, kiểm thử, cách làm), rồi Bạn duyệt một lượt trong spec.

### Giả định (bạn đã xem và không phản đối)
- Project nằm ở `~/Documents/Projects/son-mai-anh-sang`.
- Git dùng `Bao Nguyen <giabao261096@gmail.com>`, chỉ cấu hình trong repo này. Cấu hình git global (email công ty) giữ nguyên.
- Phong cách mang chất Việt và nên thơ, không gắn với một lễ hội cụ thể nào.
- **(Bản 2)** Máy đang có Node 20.15. Bản này đã hết hỗ trợ từ 04/2026 và không chạy được Vite 8 hay Vitest 5. Dự án yêu cầu **Node 24 LTS**, cài theo thư mục để không ảnh hưởng các project công việc (§13).

### Bản tham khảo làm gì, và mình làm khác thế nào
| Bản tham khảo (Trung Thu 3D) | Sơn Mài Ánh Sáng |
|---|---|
| three.js 2021, `WebGLRenderer` | three.js **0.186.1**, `WebGPURenderer`, TSL (tự lùi về WebGL2) |
| Không có shader tự viết, glow giả bằng sprite | Shader TSL, bloom chọn lọc thật qua MRT |
| Hạt cập nhật bằng CPU | Đom đóm chạy bằng GPU compute, có công tắc để so với CPU |
| Một file `script.js` 23KB, không có chú thích | Mỗi lớp một file, code hiện ngay trên trang |
| Một cảnh duy nhất, viết cứng | Một kỹ thuật với một xưởng dùng chung; mỗi bức là một thư mục |
| Máy không có WebGL thì báo lỗi rồi dừng | 3 tầng dự phòng, không bao giờ để trống màn hình |
| Code bị làm rối, chặn DevTools (devpan) | Mã nguồn mở MIT, khuyến khích mở DevTools |

## 2. Tiêu chí thành công

1. Mở link là thấy **poster trong dưới 1 giây**. Cảnh 3D hòa dần lên; trên laptop mạng tốt mất khoảng 3 giây.
2. **Chạm vào mặt nước** thì gợn sóng lan ra và **xẻ đôi bóng trăng** rõ ràng.
3. Cả **6 lớp của Bức 1** bật/tắt được mà không khựng hình. Lớp nào cũng có đủ 3 tab **Hiểu / Chỉnh / Phá**, và kéo núm thì **dòng code thật sáng lên**.
4. Đạt **60fps trên laptop** và **từ 45fps trở lên trên điện thoại tầm trung**. Không bao giờ hiện màn hình lỗi rồi dừng.
5. Bao đọc được từng file: mỗi file khoảng 250 dòng trở xuống, các điểm cần học có chú thích tiếng Việt.
6. Trang deploy công khai trên GitHub Pages của tài khoản cá nhân. Mọi commit mang email cá nhân.
7. **(Bản 2)** Code của xưởng không chứa từ vựng của bức nào. Thêm một bức theo đúng luật 7 ở §0. `npm test` giữ các luật này và báo lỗi bằng tiếng Việt.

## 3. Không làm (non-goals)

- Không có backend, tài khoản, analytics hay tracking.
- Không tự phát nhạc. Không dùng modal lời chúc kèm ảnh kiểu thiệp.
- Không dùng lại ảnh, nhạc hay lời chúc của bản tham khảo thương mại. Mọi hình ảnh đều sinh bằng code.
- Không dùng React/R3F, `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` hay `EffectComposer`. `three/webgpu` vẫn export `ShaderMaterial` và `RawShaderMaterial`, nên việc cấm do test quét mã giữ (§12).
- Không dùng API đã deprecated trong r186:
  - `PostProcessing` (dùng `RenderPipeline`);
  - `renderAsync`, các `clear*Async`, `hasFeatureAsync`, `initTextureAsync`;
  - `setResolution` của PassNode (dùng `setResolutionScale`);
  - tùy chọn `resolution` của `reflector` (dùng `resolutionScale`);
  - `label()` (dùng `setName()`);
  - `directionToColor` (dùng `packNormalToRGB`);
  - `PCFSoftShadowMap`.

  E2e bắt các cảnh báo deprecated lúc chạy (§12).
- Không dùng định vị, micro hay dữ liệu thời tiết.
- **(Bản 2)** Không dùng npm workspaces, plugin loader, SPA router, scene DSL, ECS, class kế thừa cho lớp, thư viện i18n, event bus hay state store trung tâm, và không chuyển sang TypeScript. Lý do nằm ở §16.

## 4. Trải nghiệm người xem

### 4.1 Trải nghiệm của kỹ thuật (bức nào cũng có)
1. **Mở trang (GĐ 0):**
   - HTML tĩnh hiện ngay poster của bức, tên bức, thơ và con dấu ngày âm lịch.
   - JS 3D tải ngầm, dò tầng, biên dịch trước (`scenePass.compileAsync(renderer)`), rồi vẽ một khung ẩn sau poster để các pipeline còn lại kịp biên dịch.
   - Sau đó **hòa dần** từ poster sang cảnh 3D. Poster được ẩn khi hòa xong. Không có spinner.
   - (GĐ 5) **Trăng tiến độ:** trong lúc tải phần 3D, trăng SVG cạnh con dấu có thêm một **vòng quầng** mảnh màu vàng lá sáng,
     vẽ dần theo chiều kim đồng hồ từ đỉnh. Trăng vẫn giữ đúng pha đêm nay; chỉ quầng là tiến độ.
     - Quầng hiện từ `loading`, rồi nhích qua hai mốc: tải xong code 3D (`chunk`), dựng xong renderer và bức (`compiling`). Mỗi mốc
       đặt một đích; quầng bò chậm dần về đích đó, nên mạng chậm vẫn thấy nó nhích chứ không đứng hẳn. Không có mốc "biên dịch
       xong" hay "vẽ xong khung ẩn": khung ẩn chặn luồng chính, mà `fading` tới ngay sau nó trong cùng một tác vụ (§8.5).
     - Quầng đầy ở `fading` rồi tan cùng lúc hòa dần. Tầng tĩnh không có quầng; rơi về tĩnh giữa chừng thì quầng biến mất ngay.
       "Dựng lại cảnh" vẽ quầng lại từ đầu.
     - Quầng chỉ để nhìn (`aria-hidden`, như trăng). Người xem xin giảm chuyển động thì quầng nhảy thẳng tới từng mốc, không bò.
     - Vòng vẽ ở tọa độ riêng lớn gấp 100 rồi thu lại: `<circle r="105" pathLength="1" transform="rotate(-90) scale(0.01)">`, nét 9,
       `stroke-dasharray: 1 2`. Trên trăng (bán kính 1) là bán kính 1,05 và nét 0,09, chừng 1,6 px ở trăng 40 px. Vẽ thẳng ở tọa độ
       nhỏ thì Chrome đo `pathLength` quá thô và vòng không bao giờ khép (Phụ lục A.54).
     - Chi tiết ở §8.5.
2. **Ngắm (mặc định):** không có UI.
   - Chỉ có câu thơ ở góc và camera chuyển động chậm như đang thở (GĐ 1).
   - Kéo để xoay camera trong giới hạn do bức khai báo (`CameraSpec`).
3. **Lời mời (GĐ 1):** sau lần tương tác đầu tiên, hiện nhẹ *"Bức tranh này có {n} lớp — mài thử?"*, với `n = meta.layers.length`.
   Từ GĐ 2 lời mời là **một nút**: bấm thì vào chế độ mài. Đóng thanh lớp thì lời mời quay lại, để mở lại lúc nào cũng được.
   "Lần tương tác đầu tiên" là chạm canvas, hoặc phím đầu tiên (người chỉ dùng bàn phím không chạm được canvas). Dựng lại
   cảnh sau khi mất GPU mà thanh lớp đang đóng thì lời mời hiện lại ngay (poster lúc mất GPU đã xóa nó).
4. **Chế độ mài có hướng dẫn (GĐ 2):**
   - Mọi lớp trừ Cốt mờ dần về 0 (tween 0,8 giây theo đồng hồ của cảnh); bức trở về **đất sét xám**. Sổ tay mở trang Cốt.
   - Nút *"Phủ lớp tiếp theo · {tên}"* sơn lại lớp đầu tiên (sau Cốt) đang hướng về 0, rồi mở Sổ tay của lớp vừa phủ
     (tab Hiểu). Vì luôn tính lại từ trọng số, bật/tắt tự do không làm lệch thứ tự.
   - Người xem cũng có thể bật/tắt tự do trên **thanh lớp** (công tắc `role="switch"`, vạch trọng số chạy theo tween).
     Cốt không có công tắc. Đóng thanh lớp thì mọi lớp phủ lại: về chế độ ngắm.
   - Người xem xin giảm chuyển động thì bật/tắt lớp là ngay, không mờ dần.
5. **Sổ tay (GĐ 2):** panel bên phải trên desktop, tấm trượt dưới đáy (ngay trên dải thanh lớp) trên điện thoại. Có 3 tab
   theo mẫu tab của ARIA (mũi tên đổi tab; Escape đóng Sổ tay):
   - **Hiểu:** thơ riêng của lớp (nếu có), tối đa 150 chữ (đếm theo khoảng trắng), 1 sơ đồ SVG, mục "Bạn vừa học", mục "Đọc thêm".
   - **Chỉnh:** núm Tweakpane cộng với code thật của lớp (mọi file trong `LayerMeta.files`, mỗi file một nút). Đưa chuột vào,
     focus bằng bàn phím, hoặc kéo một núm thì Sổ tay mở đúng file có marker của núm đó và dòng code tương ứng sáng lên.
     Núm `rebuild` chỉ áp khi thả tay (dựng lại hình ở mỗi nấc kéo thì khựng); trong lúc dựng hiện "đang dựng…".
   - **Phá:** các thí nghiệm "Thử phá" (nút bật/tắt `aria-pressed` kèm lời giải thích), rồi số đo trực tiếp: số đo riêng
     của lớp, và của xưởng (draw call, tam giác, mili giây mỗi khung), đổi 4 lần mỗi giây.
     (GĐ 3) Xưởng đo thêm **mili giây CPU mỗi khung**: thời gian luồng chính làm xong một khung. Mili giây mỗi khung bị khóa
     theo nhịp màn hình (máy mạnh với màn 60 Hz luôn thấy 16,7), còn ms CPU lộ ngay phần việc của JS. Thí nghiệm kiểu
     `compare` có thêm hai cột ngang nhỏ "Tắt / Bật" dưới nút: ms mỗi khung và ms CPU của từng trạng thái.
     (GĐ 4) Máy đo được thời gian GPU (WebGPU có `timestamp-query`, hoặc WebGL2 có `EXT_disjoint_timer_query_webgl2`) thì số đo
     của xưởng có thêm **ms GPU**, và hai cột "Tắt / Bật" cũng có ms GPU. Máy không đo được thì dòng đó ghi "—" kèm một câu giải
     thích: Safari và nhiều điện thoại chưa đo được.
   - Tầng tĩnh có **Sổ tay chỉ đọc** (nút "Xem {n} lớp của bức tranh" trong ô ghi chú): thanh lớp chỉ có tên, Hiểu và code
     đọc được, núm và thí nghiệm cần cảnh 3D.
6. **Công cụ học (GĐ 4):** Kính mài và Lột lớp (§7). Cả hai chạy trên mọi bức, vì chỉ nhìn các view mà xưởng liệt kê.
   - Công cụ nằm trong thanh lớp, ở mục **"Đồ nghề"** ngay dưới danh sách lớp. Mỗi công cụ là một nút `aria-pressed`.
   - Lúc ngắm (thanh lớp đóng) không có UI nào của công cụ. Tầng tĩnh (Sổ tay chỉ đọc) không có mục Đồ nghề hay thanh giờ, vì cả
     hai cần cảnh 3D.
   - Mỗi lúc chỉ bật được **một** công cụ: bật cái này thì cái kia tắt. Bấm lại nút đang bật, hay đóng thanh lớp, thì công cụ tắt
     và tranh về ảnh cuối.
   - Công cụ đang bật hiện thanh điều khiển của nó: trên máy tính ở đáy tranh, trên điện thoại ngay trên dải thanh lớp.
   - (GĐ 5) **Bảng công cụ không bao giờ nằm dưới thanh lớp hay Sổ tay** (GĐ 4 chỉ thu Sổ tay lại trên điện thoại, nên trên máy
     tính dưới chừng 1500 px Sổ tay che mất một phần bảng; chi tiết ở §7 "Thanh công cụ"):
     - xưởng đóng: bảng ở giữa đáy cả khung, như GĐ 4;
     - máy tính, thanh lớp mở: bảng ở giữa khoảng trống sau thanh lớp. Từ 1240 px trở lên, khoảng trống đó dừng trước chỗ của Sổ
       tay, cả khi người xem đóng Sổ tay (bảng không nhảy chỗ);
     - hẹp hơn 1240 px (máy tính hẹp và điện thoại, một ngưỡng chung): Sổ tay thu lại khi một công cụ bật, hiện lại khi tắt. Trong
       lúc đó, bấm tên lớp hay "Phủ lớp tiếp theo" vẫn đổi trang của Sổ tay đang ẩn; tắt công cụ thì thấy trang ấy (điện thoại vốn
       vậy từ GĐ 4);
     - Tab: từ nút công cụ trên thanh lớp, Tab đi qua phần còn lại của thanh lớp rồi vào thẳng bảng của công cụ, sau đó mới tới Sổ
       tay (WCAG 2.4.3). Trang làm được nhờ thứ tự DOM (thanh lớp → thanh công cụ → Sổ tay), không chuyển focus khi bật công cụ:
       người dùng chuột không bị nhảy focus.
   - (GĐ 5) Đồ nghề có thêm **Từng sợi** (§7): dựng lại khung hình từng lần vẽ một, theo đúng thứ tự GPU nhận.
7. **Núm của bức (Dial, GĐ 4):** xưởng vẽ thanh trượt cho mọi Dial mà bức khai báo. Thanh trượt nằm trong thanh lớp, dưới "Đồ nghề".
   - Mỗi Dial là một `input type="range"`:
     - nhãn lấy từ `content.dials[id].label`;
     - chữ giá trị lấy từ `Dial.format` (ví dụ "21:00"), cũng dùng làm `aria-valuetext`;
     - ghi chú lấy từ `content.dials[id].notes[note()]`, nếu có.
   - Trên điện thoại, dải thanh lớp có một nút nhỏ ghi giá trị ("◷ 21:00"). Chạm vào thì ô trượt mở ra ngay trên dải.
   - Giá trị Dial nằm trong snapshot (`dials`), nên "Dựng lại cảnh" giữ đúng giờ người xem đã chọn.
8. **Huy hiệu tầng (GĐ 0):**
   - Hiện WebGPU / WebGL2 / Tranh tĩnh cùng mức chất lượng. Chạm vào để đọc giải thích.
   - Ghi **backend thật**, đọc sau `renderer.init()`, vì three có thể lặng lẽ lùi về WebGL2.
   - Có thuộc tính `data-backend` để test đọc.
   - (GĐ 3) Khi bộ điều chỉnh đang hạ nấc (§10), huy hiệu ghi thêm "hạ {n} nấc" (`data-steps`); chạm vào thì lời giải thích
     nói máy đang bớt chi tiết để giữ nhịp khung hình.
   - (GĐ 4) Có nấc bị khóa chống dao động (§10) thì lời giải thích nói đúng như vậy: nấc đó giữ tới khi tải lại trang. Không hứa
     rằng chi tiết sẽ trở lại.
9. **Chế độ thợ:**
   - `?debug` ở GĐ 0: in chi tiết lỗi. Từ GĐ 1: mở thêm three.js Inspector.
   - `?debug=stats` (GĐ 1): mở stats-gl. Không bật cùng lúc với Inspector.
10. **Chữ đi theo vật (GĐ 5):** bức có thể cho một dòng chữ (thơ, chú thích) hiện cạnh một điểm trong cảnh và đi theo điểm đó.
    - Chữ nằm ở `content.captions[key]`, cùng dạng với thơ của meta: `{ lines, source, author? }`. Bức gọi
      `ctx.captions.show(key, anchor)`, với `anchor()` trả vị trí 3D của điểm neo ở mỗi khung (§8.4).
    - Mỗi lúc một dòng: dòng mới thay dòng đang hiện. Chữ hiện mờ dần (0,8 giây), đứng 9 giây theo đồng hồ của cảnh
      (`CAPTION_SECONDS`), tan trong 1,2 giây cuối (`CAPTION_FADE`); hai số nằm ở `ui/captions.js`. `?freeze` đứng đồng hồ thì chữ ở lại.
    - Chỗ đặt: chữ đứng ngay TRÊN điểm neo, căn giữa theo chiều ngang, cách điểm neo một khe nhỏ (padding dưới 10 px).
      - Điểm neo sát mép thì chữ dừng ở mép mà vẫn ở trên điểm: cả khung chữ (kể cả lề 16 px hai bên, bằng lề của khung trên điện
        thoại) luôn ở trong màn hình. Chữ rộng tối đa `min(26rem, 90vw)`: một câu lục bát vừa một hàng ở 360 px.
      - Điểm neo thấp hơn mép trên của chân khung (gợi ý hay lời mời, thơ, trăng, con dấu: `[data-hint], [data-poem], [data-seal],
        [data-moon]`; sau GĐ 5 cả bảng của công cụ đang bật, `[data-tool-slot]`: bảng nằm ở dải dưới và vẽ đè lên vùng chữ; ô cao 0
        thì bỏ qua) thì chữ dừng ở mép đó, vẫn đi theo điểm neo sang ngang. `main.frame` vẽ đè lên vùng chữ:
        xuống thấp hơn là hai lớp chữ in chồng lên nhau. Màn thấp quá, không đủ chỗ cho cả hai, thì giữ cả câu (mép trên thắng).
        Bao chọn cách này thay cho làm mờ thơ khi có chữ (mục 2: thơ luôn hiện).
      - Giới hạn đã biết: cỡ chữ và chân khung chỉ đo một lần cho mỗi dòng (lúc `show`, một lần tính bố cục). Gợi ý đổi hay xoay
        máy giữa chừng thì số đo lệch trong mấy giây còn lại của dòng đó (§16).
    - Vùng chứa chữ là một `aria-live="polite"` phủ lên canvas. Theo luật của vùng live, nó không bao giờ `hidden` và để trống khi
      không có chữ. Trình đọc màn hình đọc câu chữ và nguồn.
    - Điểm neo ra ngoài khung hay ra sau camera thì chữ mang `data-away` (CSS đưa opacity về 0 ngay), không bao giờ `hidden`:
      `hidden` (display: none) gỡ chữ khỏi cây trợ năng, nên vào lại khung là trình đọc màn hình đọc lại cả câu, và còn hủy
      transition (Phụ lục A.57). Vào lại khung thì chữ mờ dần hiện ra. "Trong khung" là: độ sâu trong tọa độ camera nằm trong
      [near, far], và x, y của NDC trong [−1, 1]; không xét z của NDC (Phụ lục A.56).
    - `anchor()` trả `null` là khung đó không có điểm neo (Bức 1: đèn đã chìm hẳn): chữ ẩn, không cảnh báo. Trả `undefined`, số
      không hữu hạn hay ném lỗi là lỗi của bức: chữ ẩn ở khung đó, cảnh báo một lần cho mỗi dòng (§9).
    - `?poster` không có chữ. Người xem xin giảm chuyển động thì chữ hiện và tắt ngay, không mờ dần, cũng không tan sớm: dòng đứng
      nguyên tới hết 9 giây. Tầng tĩnh không có cảnh nên không có chữ.

### 4.2 Trải nghiệm riêng của Bức 1 · Ao Sen Đêm
- Gợi ý duy nhất: *"Chạm vào mặt nước"*, lấy từ `content.hint` (GĐ 1). (GĐ 5) Gợi ý thành *"Chạm vào mặt nước · chạm hai lần để
  thả hoa đăng"*.
- Chạm thì tạo gợn sóng, đom đóm tản ra. Giữ thì đom đóm tụ lại quanh ngón tay, thả ra thì chúng bung ra (GĐ 1).
- Vuốt trên mặt nước thì sương xoáy quanh chỗ vuốt rồi lắng lại (GĐ 3).
- **Thanh "giờ"** là Dial của Bức 1: kéo từ 18:00 đến 05:30 (§7, GĐ 4). Từ GĐ 1, giờ mặc định đã điều khiển vị trí trăng.
  (GĐ 4) Kéo thanh giờ thì:
  - trăng đi theo: vị trí, lối trăng trên nước, hướng bóng;
  - trời và sương ấm lên lúc chạng vạng và lúc gần sáng;
  - trăng càng thấp thì ánh trăng càng yếu.
- Thơ của cả bức, và câu Truyện Kiều ở lớp Mặt nước (§5).
- (GĐ 5) **Thả hoa đăng:** chạm hai lần lên nước.
  - Mỗi lần chạm vẫn là một lần chạm, nên hai vòng gợn lan ra. Giữa vòng gợn hiện một búp hoa đăng, nở đủ 8 cánh trong khoảng
    1,5 giây.
  - Một cặp câu thơ cùng nguồn hiện phía trên ngọn đèn và đi theo nó (chữ đi theo vật, §4.1 mục 10; danh sách thơ ở §5). Điểm
    neo cao 0,9 trên mặt nước, trên ngọn nến một chút; đèn chìm hẳn thì `anchor()` trả `null` và chữ ẩn.
  - Đèn trôi chậm ra xa về phía lối trăng. Hướng trôi lấy theo trăng lúc thả, nên kéo thanh giờ sau đó không làm đèn đổi đường.
    Đèn lắc nhẹ, nhấp nhô khi gợn đi qua, hắt một vũng sáng ấm trên nước, hiện trong ảnh phản chiếu, và mờ dần trong sương.
    - (Dựng thử) Đèn nhắm tới một điểm trên lối trăng: cách chỗ đứng của camera trên mặt nước, (0, 32), 100 đơn vị theo phương vị
      của trăng (`driftDirection`). Điểm đó luôn ở ngoài ao (cách tâm ít nhất 100 − 32 = 68 > 60), nên đèn thả ở đâu cũng trôi ra
      xa; đích mà nằm trong ao thì đèn thả xa hơn đích sẽ quay đầu về phía người xem.
    - Tốc độ đều 0,6 đơn vị/giây, tăng mềm trong vài giây đầu. Đo trên màn hình (1280×800 và 390×844): đèn thả trước mặt đi chừng
      7 px/giây lúc đầu, 3,5 px/giây ở giây 30 (đã vào lối trăng), 1 px/giây khi đã xa.
  - Tới vùng mép (còn cách bờ 4 đơn vị), hoặc sau 90 giây, đèn chìm dần trong 3 giây rồi tắt: nhỏ đi 35% và xuống thấp 0,45 đơn vị,
    nên cả mũi cánh lặn dưới mặt nước trước khi đèn bị giấu (lặn chứ không biến mất). Thả ở dải sát bờ mà hướng trôi ra ngoài thì
    đèn chìm ngay từ lúc thả, và không tính là một đèn nổi: không bắt đèn nào khác chìm theo.
  - Ao giữ tối đa N đèn trôi (N = `budget.lanterns`: 8 ở mức cao, 6 ở mức vừa, 4 ở mức thấp); thêm một ô cho đèn cũ đang chìm.
    Thả đèn thứ N + 1 thì đèn thả sớm nhất bắt đầu chìm ngay, chìm dần trong 3 giây ở ô thừa đó. Số đo "Hoa đăng đang trôi" đếm
    cả đèn đang chìm, nên có thể là N + 1 trong tối đa 3 giây. Thả dồn dập tới mức mọi ô đều có đèn thì ô có đèn chìm lâu nhất
    được dùng lại.
  - **Thứ tự thơ:** PRNG (`lib/random.js`) xáo danh sách, hạt giống là số thứ tự của ĐÊM chứa `ctx.now`: một đêm tính từ 12 giờ
    trưa tới 12 giờ trưa hôm sau, giờ Việt Nam, nên cả đêm của bức (18:00 → 05:30) chỉ có một thứ tự, không đổi lúc nửa đêm. Mỗi
    đêm một thứ tự khác; cùng `?at` thì cùng thứ tự, nên e2e đoán trước được (`verseOrder(keys, parseAt(at))`). Hết danh sách thì
    quay lại từ đầu.
  - Mài lớp Ánh trăng về 0 thì đèn thành đất sét, không sáng, và vũng sáng tắt. Chữ vẫn hiện: chữ là giao diện, không thuộc lớp nào.
  - Chạm hai lần ngoài ao (lên trời) thì không có gì, như chạm, và không tốn câu nào của danh sách.
  - Kính mài đang bật ở hình tròn thì cú chạm hai lần của ngón tay hay bút là của kính (§7), nên không thả đèn ngoài ý người xem;
    nhấp đúp chuột vẫn thả. Ở hình gạt, canvas không giữ cử chỉ nào (tay nắm là một phần tử riêng), nên chạm hai lần lên nước vẫn
    thả đèn.

## 5. Chỉ đạo nghệ thuật

### Bảng màu sơn mài: 10 token của chất liệu (thuộc xưởng)
Bảng nằm ở `src/engine/palette.js`, dùng chung cho CSS và TSL. `src/styles/tokens.css` được unit test giữ cho khớp với bảng này.

| Token | Tên | Hex |
|---|---|---|
| `denThen` | đen then (nền sơn) | `#0E0A08` |
| `canhGian` | nâu cánh gián | `#3B1F14` |
| `doSon` | đỏ son | `#B3261E` |
| `vangLa` | vàng lá | `#D4A94A` |
| `vangLaSang` | vàng lá sáng | `#F2D48A` |
| `bacLa` | bạc lá | `#C9C6BD` |
| `nga` | ngà vỏ trứng | `#EDE3CF` |
| `cham` | chàm | `#1B2A4A` |
| `xanhLuc` | xanh lục (màu lá) | `#2E4A3A` |
| `datSet` | đất sét, màu của cốt khi mài hết | `#8A8580` |

- Một bức có thể **thêm hoặc ghi đè** token qua `meta.palette`. Ví dụ, (GĐ 8) Bức 4 thêm năm màu tự nhiên của tranh Đông Hồ, trong đó có `diep` (§20.3). Lớp đọc bảng đã ghép qua `ctx.palette`.
- LUT "sơn mài" sinh từ bảng đã ghép (GĐ 4), nên bức đổi màu thì LUT tự đổi theo.
- Không dùng neon hồng tím. Màu sen của Bức 1 lấy **đúng từ câu ca dao**: *lá xanh, bông trắng, nhị vàng*.

### Chữ
- Font tự host qua `@fontsource` 5.3, không gọi Google Fonts lúc chạy:
  - **Cormorant Garamond** (có tiếng Việt) cho thơ và tiêu đề: `500.css`, `500-italic.css`.
  - **Be Vietnam Pro** cho giao diện: `400.css`, `600.css`.
  - **JetBrains Mono** cho code: `400.css`.
- Các file này được import ở đầu `src/styles/shell.css`. **Không import `vietnamese-*.css` riêng lẻ**: các file đó không có `unicode-range` và thiếu phần Latin cơ bản. Trình duyệt chỉ tải subset `latin`, `latin-ext` và `vietnamese`.

### Thơ (có ghi nguồn, không in số câu)
Nguồn là trường bắt buộc `poem.source` trong meta.
- Cả Bức 1: *"Trong đầm gì đẹp bằng sen / Lá xanh bông trắng lại chen nhị vàng / Nhị vàng bông trắng lá xanh / Gần bùn mà chẳng hôi tanh mùi bùn"* (ca dao).
- Lớp Mặt nước: *"Vầng trăng ai xẻ làm đôi / Nửa in gối chiếc, nửa soi dặm trường"* (Truyện Kiều, Nguyễn Du).
- Lớp nào cũng có thể thêm một câu ngắn khác, nhưng phải là văn học dân gian hoặc cổ điển đã hết bản quyền, và phải ghi nguồn.
- (GĐ 5) **Thơ của hoa đăng** (`content.captions`, mỗi mục một cặp câu cùng nguồn). Mười hai mục, đều là ca dao hay thơ cổ điển
  đã hết bản quyền (Nguyễn Trãi thế kỷ 15, Hồ Xuân Hương và Nguyễn Du đầu thế kỷ 19, Nguyễn Khuyến mất năm 1909). Thứ tự hiện xáo
  theo đêm (§4.2). Khóa trong ngoặc là id của mục. Chữ nằm ở `content.captions.vi.js` (`content.vi.js` gộp vào `captions`; tách
  riêng để `content.vi.js` dưới 300 dòng): ca dao ghi `source: 'Ca dao'`, mục khác ghi tên bài ở `source` và tác giả ở `author`.
  1. *"Đèn khoe đèn tỏ hơn trăng / Đèn ra trước gió còn chăng, hỡi đèn?"* (ca dao) `den-khoe`
  2. *"Trăng khoe trăng tỏ hơn đèn / Cớ sao trăng phải chịu luồn đám mây?"* (ca dao) `trang-khoe`
  3. *"Thuyền về có nhớ bến chăng? / Bến thì một dạ khăng khăng đợi thuyền"* (ca dao) `thuyen-ve`
  4. *"Gió đưa cành trúc la đà / Tiếng chuông Trấn Vũ, canh gà Thọ Xương"* (ca dao) `gio-dua`
  5. *"Mịt mù khói tỏa ngàn sương / Nhịp chày Yên Thái, mặt gương Tây Hồ"* (ca dao) `mit-mu`
  6. *"Trăng bao nhiêu tuổi trăng già / Núi bao nhiêu tuổi gọi là núi non"* (ca dao) `trang-bao-nhieu`
  7. *"Thạch lựu hiên còn phun thức đỏ / Hồng liên trì đã tiễn mùi hương"* (Bảo kính cảnh giới, Nguyễn Trãi) `thach-luu`
  8. *"Chén rượu hương đưa say lại tỉnh / Vầng trăng bóng xế khuyết chưa tròn"* (Tự tình II, Hồ Xuân Hương) `chen-ruou`
  9. *"Gương nga chênh chếch dòm song / Vàng gieo ngấn nước, cây lồng bóng sân"* (Truyện Kiều, Nguyễn Du) `guong-nga`
  10. *"Ao thu lạnh lẽo nước trong veo / Một chiếc thuyền câu bé tẻo teo"* (Thu điếu, Nguyễn Khuyến) `ao-thu`
  11. *"Lưng giậu phất phơ màu khói nhạt / Làn ao lóng lánh bóng trăng loe"* (Thu ẩm, Nguyễn Khuyến) `lung-giau`
  12. *"Nước biếc trông như tầng khói phủ / Song thưa để mặc bóng trăng vào"* (Thu vịnh, Nguyễn Khuyến) `nuoc-biec`

  Chữ của cả mười hai mục đã đối chiếu với nguồn trên mạng trước khi deploy GĐ 5 (mục 9 với bản Truyện Kiều trên Wikisource).
  Ca dao có nhiều dị bản; mục 1 và 2 theo bản in phổ biến nhất.

### Lượt màu (GĐ 3)
Đo trên GPU thật, cùng khung 1280×800 (độ sáng trung bình / độ bão hòa / tỉ lệ điểm tối): poster 33 / 0,42 / 30%; bản GĐ 2 là
48 / 0,54 / 30%; bản GĐ 3 trước lượt màu là 64 / 0,31 / 10%. Thứ làm ảnh bệch nhất là **quầng bloom của 3.000 con đom đóm**
(tắt Vàng lá: độ sáng 63 → 47, điểm tối 8% → 28%), không phải sương hay đèn. Lượt màu: đom đóm dịu lại (`glow` 3 → 1,8), sương
mỏng và tối hơn, đỉnh trời chàm đậm hơn, đèn trời chàm yếu đi (7 → 4), thân lá bớt bóng (`specularIntensity` 0,3), nước sâu
ngả nâu cánh gián như đáy poster. Mọi số là giá trị mặc định của núm hay hằng số, nằm trong một commit riêng.

(GĐ 4) Chặng display của Phủ bóng (LUT sơn mài, grain, vignette, FXAA; §6 Lớp 6) đổi màu cả bức thêm một lần.
- Số mặc định của ba núm mới được chốt bằng cùng cách đo như lượt màu GĐ 3: độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối, trên
  GPU thật, ở cả 1280×800 và 390×844.
- Bao duyệt ảnh trước và sau khi thêm chặng display.
- Poster mới được chụp từ chính cảnh đã duyệt (§8.7). Từ GĐ 4, poster và cảnh 3D là cùng một ảnh.
- (Dựng thử GĐ 4, `?at=2026-09-28T21:00&freeze=300`, mức cao) Trước chặng display: 57,7 / 0,32 / 10,1% ở 1280×800, 68,2 / 0,28 / 6,4% ở
  390×844. LUT 0,6 làm sương chân trời ngả cam. Chọn `lutIntensity` 0,45, `vignette` 0,45, `grain` 0,03: 54,3 / 0,43 / 12,2% và
  62,5 / 0,39 / 7,1%, tức nhích về phía poster cũ (33 / 0,42 / 30%) mà không bệt. Ba số nằm trong một commit riêng.

(GĐ 5) Tinh chỉnh trên GPU thật (1280×800 và 390×844) chỉ đổi số của hoa đăng, chữ đi theo vật và quầng trăng, trong một commit
riêng: vũng sáng `POOL` (bán kính 1,6 → 1,1), lề hai bên và bề rộng của chữ (12 → 16 px, `min(26rem, 80vw)` → `90vw`), quầng
(bán kính 104 → 105 và nét 7 → 9 ở tọa độ riêng; số giây bò của `loading`, `chunk`, `compiling` từ 6, 3, 4 thành 10, 4, 3). Tốc độ
trôi giữ 0,6. Cảnh mặc định (không có đèn thả) giống từng điểm ảnh trước và sau lượt chỉnh này. So với bản GĐ 4, chỉ đèn ở bờ
khác: tối đi chừng 1% vì hệ số sương mà mọi đèn chung (§6 Lớp 3). Vì vậy không chụp lại poster.

### Chi tiết sống
- **Trăng đúng pha của đêm hôm đó**, tính từ `ctx.now`. Vị trí trăng trên trời là tính nghệ thuật, không theo thiên văn thật.
- **Con dấu đỏ ghi ngày âm lịch** ở góc tranh, ví dụ *"18 tháng Tám · Bính Ngọ"*. Bức nào cũng có (luật 5).

## 6. Bức 1 · Ao Sen Đêm: sáu lớp

**Nơi ở:** `src/paintings/ao-sen-dem/`. Lớp 6 là lớp dùng chung `src/engine/stock/phu-bong/`. Số trong tên file (`lN`) là **vị trí cuối cùng** của lớp trong Bức 1 và không đổi. Ở v0, `l4` đứng ở vị trí thứ 2 vì các lớp 2 và 3 chưa có.

**Trọng số:**
- Lớp đọc trọng số của chính mình qua `ctx.weight(id)`.
- Màu nào cũng bắt đầu từ `datSet` và đi qua `mix(datSet, màu, w)`.
- **Không đặt số trực tiếp lên material lúc chạy** (`material.clearcoat = 0`, `emissiveIntensity`…). Trong r186, một số vượt qua 0 sẽ đổi cache key và gây biên dịch lại. Mọi thứ thay đổi theo trọng số hay núm phải đi qua `uniform` bên trong node, ví dụ `clearcoatNode = uClearcoat.mul(w2)`.

**Liên kết giữa các lớp:** lớp trước công bố những gì lớp sau cần vào `shared.<layerId>`. Ví dụ, Cốt ghi `shared.cot = { leafMaterial, petalMaterial, hemi }`, rồi Ánh trăng trộn màu vào các material đó và giảm đèn xưởng theo `w2`. Lớp chỉ đọc `shared` của lớp **đứng trước** nó. Nếu bức không có `setup`, xưởng vẫn truyền một object `shared = {}` dùng chung cho mọi lớp.

**Số theo mức:** các con số phụ thuộc máy lấy từ bảng §10 qua `ctx.budget`, không viết cứng trong lớp.

**Tên vật (GĐ 5):** mọi vật trong `layer.objects` có `name` (kebab-case không dấu, không trùng trong lớp), kể cả vật mà thí nghiệm
thêm vào. Nhãn cho người xem nằm ở `content.layers[id].objects[name]`. Từng sợi (§7) hiện nhãn này; Inspector của `?debug` cũng
hiện tên. `tests/paintings/objects.test.js` giữ luật này (§12). Vật là con của một vật trong `objects` (như các Mesh rời trong
Group `la-rieng`) không cần tên riêng: Từng sợi gán nó cho vật cha.

**Kiểu núm** (`Knob.via`):
- `uniform` (mặc định): không biên dịch lại.
- `js`: đổi một thuộc tính JS qua `onKnob`, ví dụ `computeNode.count`, cường độ đèn, `resolutionScale`.
- `rebuild`: dựng lại hình hoặc biên dịch lại. UI debounce và hiện "đang dựng…".

### Lớp 1 · Cốt: hình khối và instancing (`layers/l1-cot.js`)
- **Thấy gì:**
  - **Lá sen:** cao 1.200 / vừa 800 / thấp 500 lá. Hình học tự sinh: đĩa tròn có khe hình nêm, lõm lòng chảo, mép lượn sóng, khoảng 40–80 đỉnh. Khoảng 10% là lá đứng trên cuống.
  - **Hoa:** khoảng 12 bông và 20 nụ, dựng từ **một cánh hoa được instance**. Mỗi bông 3 vòng cánh, có tham số độ nở, có gương sen, nhị vàng và cuống.
  - Khoảng 300 ngọn lau sậy ở rìa ao.
  - Lá được rải theo hạt giống cố định (jittered Poisson, `lib/random.js`), chừa một **"lối trăng"** trống để thấy bóng trăng phản chiếu.
  - (GĐ 1) Hai bông "chủ đề" đặt tay ở tiền cảnh, hai bên lối trăng (bố cục của poster); mỗi việc ngẫu nhiên (lá, lá đứng, hoa, lau) một hạt giống riêng, nên hoa và lau không đổi theo mức.
- **Đèn xưởng:** một `HemisphereLight` xám trung tính, để đất sét đọc được hình khối khi mọi lớp khác bằng 0. Cốt công bố đèn này qua `shared.cot.hemi`, và lớp Ánh trăng giảm nó theo `w2`. Cường độ đèn là uniform, nên không gây biên dịch lại.
- **Kỹ thuật:**
  - `BufferGeometry` tự sinh; `InstancedMesh`, cảnh chính của cả ao chỉ khoảng 5 draw call.
  - Biến thể theo từng instance; `computeVertexNormals`; ma trận instance.
  - Attribute **tâm instance** (`InstancedBufferAttribute`), để lớp 4 làm lá nhấp nhô theo cả chiếc lá.
- **Núm:** `leafCount` (rebuild, 0–2400), `seed` (rebuild, 0–99; 0 là đúng ao của poster), `sizeVariance` (rebuild), `cupAmount` (rebuild), `openness` (uniform), `wireframe` (rebuild).
  - (GĐ 2) Các InstancedMesh được cấp phát theo trần của núm MỘT lần; núm `rebuild` chỉ ghi lại ma trận, thuộc tính instance và `count` (vài ms), không tạo mesh mới, không biên dịch lại. `wireframe` và `flatShading` nằm trong cache key nên đổi là biên dịch lại một lần.
  - (GĐ 2) `flatShading` không làm núm riêng: đã có thí nghiệm *"Normal phẳng"*.
- **Phá:**
  - *"Tắt instancing"* (`noInstancing`): vẽ lá nổi bằng từng `Mesh` riêng (tối đa 1.200 ở mức cao, 600 ở mức vừa, 300 ở mức thấp) để thấy draw call tăng vọt và FPS tụt.
  - *"Normal phẳng"* (`flatNormals`): `flatShading` trên mọi material của Cốt.
- **Số đo:**
  - `leaves` (số lá) và `vertices`: số đỉnh tự tính (`position.count × số instance`), vì `renderer.info` không có bộ đếm đỉnh.
  - Số tam giác và draw calls lấy từ `renderer.info.render`, đọc ở cuối khung (xưởng thêm cho mọi lớp).
- (GĐ 5) **Tên vật:** `la-noi` (lá nổi), `la-dung` (lá đứng), `canh-sen`, `guong-sen` (gương sen và nhị), `cuong`, `lau-say`; lá
  rời của "Tắt instancing" là `la-rieng`.

### Lớp 2 · Ánh trăng: ánh sáng và chất liệu (`layers/l2-anh-trang.js`)
- **Thấy gì:**
  - Trăng đúng pha, có vùng biển tối (worley/fbm). Cường độ phát sáng lớn hơn 1 để bloom.
  - Ánh trăng bạc-ngà là `DirectionalLight` hướng từ trăng, cộng `HemisphereLight` (trời chàm, nước đen).
  - Cánh sen trắng ngà, ửng hồng nhạt ở đầu cánh, có **viền fresnel** và **sáng lên khi ngược sáng**. Lá có **clearcoat** bóng như sáp, gân lá vẽ bằng TSL.
  - Một **ngọn đèn hoa đăng** nhỏ (dùng lại hình cánh hoa) chứa `PointLight` ấm, **đổi màu được**. Đây là thí nghiệm "cùng một ánh sáng, khác chất liệu".
- **Kỹ thuật:**
  - Đèn và **một** shadow map (hoa và lá đứng đổ bóng lên lá nổi). Kích thước theo mức (cao 1024 / vừa 512 / thấp tắt), dùng PCF. Bóng được bật **một lần lúc dựng**, theo mức ban đầu; `castShadow`, `receiveShadow` và `shadowMap.enabled` không bao giờ đổi lúc chạy (§10).
  - `MeshPhysicalNodeMaterial` với `colorNode`, `emissiveNode`, `clearcoatNode`, `sheenNode`.
  - Fresnel `pow(1 − N·V, p)`; wrap lighting.
  - Hướng mặt trời giả cho đường phân sáng của trăng lấy từ `lib/astro/moon.js#sunDirection`.
- **Núm:** `moonPhase` (uniform, mặc định là đêm nay), `rimPower`, `rimColor`, `translucency`, `clearcoat` (uniform), `candleColor` (uniform), `candleIntensity` (js), `shadowMapSize` (js, 256–2048; mức thấp tắt bóng nên núm không làm gì), `shadowBias` (js).
  - (GĐ 2) ShadowNode đọc `mapSize` (setSize) và `bias`/`normalBias` (reference) mỗi khung, nên ba núm js này không biên dịch lại.
- **Phá:** *"Bias = 0"* (`biasZero`, xem shadow acne), *"Tắt fresnel"* (`noRim`), *"Đổi màu đèn"* (`redCandle`: đèn hoa đăng sang đỏ son). Số đo: `shadowMap` (cỡ shadow map).
- (GĐ 2) Wrap lighting để sau (§16): viền fresnel và ánh xuyên cánh (`translucency`) đã cho cánh cảm giác mỏng; wrap thật cần một lighting model riêng.
- (GĐ 3) Trăng đặt `material.fog = false`: sương không phủ lên trăng. Quầng trăng nằm trên vòm trời của lớp Sương.
- (GĐ 3) **Shadow map tĩnh:** `moonlight.shadow.autoUpdate = false`. Lớp đặt `shadow.needsUpdate = true` khi có thứ đổi: hướng trăng,
  độ nở hoa (`shared.cot.openness`), bố cục của Cốt (`shared.cot.version`: Cốt tăng số này mỗi lần ghi lại hình, hay đổi thứ nằm trong
  cache key như wireframe, normal phẳng; GĐ 4 sửa lời: "Tắt instancing" không cần tăng số này, vì lá nổi không đổ bóng), cùng núm và thí
  nghiệm của chính lớp (cỡ map, bias). Trước GĐ 3, bóng được vẽ
  lại mỗi khung và vẽ HAI lần (camera chính và camera ảo của reflector, Phụ lục A.17); giờ chỉ vẽ khi cần (Phụ lục A.35). Lá nổi nhấp
  nhô theo sóng là thứ NHẬN bóng: nó tự tra shadow map theo vị trí của mình, không cần vẽ lại bóng.
- (GĐ 3) **Khung chiếu bóng ôm sát ao:** thay khung ±55 cố định bằng hộp bao của vùng có lá và hoa (bán kính vùng lá, cao vài đơn vị)
  chiếu vào không gian của đèn; tính lại khi hướng trăng đổi. Trăng thấp (4°–13°) nên chiều dọc của khung giảm từ 110 đơn vị còn
  khoảng 11–27: cùng cỡ map, bóng nét hơn 4–10 lần theo chiều đó.
- (GĐ 3) **Nấc `bong`:** trần `mapSize` chia đôi (tối thiểu 256) rồi vẽ lại bóng một lần; hiệu lực = min(núm `shadowMapSize`, trần).
  Mức thấp tắt bóng nên không đưa nấc này.
- (GĐ 4) **Theo thanh giờ:**
  - Cường độ ánh trăng giảm khi trăng thấp (lúc chạng vạng, lúc gần sáng). Ở giờ mặc định 21:00, ảnh vẫn giữ như GĐ 3.
  - Hướng trăng đổi thì bộ canh bóng sẵn có vẽ lại bóng một lần (`shadow.needsUpdate`). Việc này xảy ra cả khi vẽ lại lúc `?freeze`,
    vì xưởng gọi `update(0, t)` (§8.4).
- (GĐ 5) **Hoa đăng** (§4.2). `parts/anh-trang-lantern.js` dựng và vẽ đèn; `parts/anh-trang-drift.js` là hàm thuần (đường trôi,
  vòng đệm, thứ tự thơ), không import three (chỉ `lib/random.js`), nên test và e2e gọi thẳng được. `files` của lớp kê cả hai.
  - **Vòng đệm N + 1 ô:** `setup()` của bức dựng `shared.lanterns = createLanternSlots(budget.lanterns, { pond: POND_RADIUS })`:
    N ô cho đèn nổi, một ô cho đèn cũ đang chìm (§4.2). `release({ x, z, t, dir, key })` ghi một lần thả và trả số ô (mỗi lần thả
    tự lấy một pha lệch góc vàng, ≈ 137,5°: hai đèn liền nhau quay mặt và lượn khác nhịp); `alive(t)` đếm đèn còn sống.
  - **Một InstancedMesh cho mọi đèn:** đèn ở bờ và mọi hoa đăng thả ra là MỘT `InstancedMesh` gồm `(1 + slots.length) × 8` =
    `(2 + budget.lanterns) × 8` cánh (80 ở mức cao), tên `hoa-dang`, một draw call. 8 cánh đầu là đèn ở bờ: đứng yên, vẫn có
    `PointLight` như cũ. Ô trống có ma trận cỡ 0 đặt ngay ở đèn ở bờ (không làm khung bao phình ra), và `count` không bao giờ đổi.
  - **Dáng đèn:** búp vừa thả có cánh chụm vào trên ngọn nến (góc ngả `CLOSED_TILT` = +0,25 quanh trục X của cánh; dấu theo quy
    ước cánh sen của Cốt: âm là mũi cánh ngả ra ngoài, dương là chụm vào), rồi nở dần trong 1,5 giây tới đúng góc của đèn ở bờ
    (−0,45). Chìm: nhỏ đi 35% và xuống 0,45 đơn vị (`SINK`), đủ để cả mũi cánh ở dưới mặt nước (y = 0) ở khung cuối trước khi ô bị
    giấu (test giữ).
  - **Chung material:** núm `candleColor` và thí nghiệm "Đổi màu đèn" áp cho mọi đèn. Trọng số 0 thì mọi đèn là đất sét, không sáng.
    Độ sáng riêng của từng đèn đi qua thuộc tính instance `lanternGlow` (đèn ở bờ luôn 1; hoa đăng sáng dần lúc thả, tắt dần khi chìm).
  - **Hoa đăng không có đèn thật:** số đèn nằm trong cache key, nên thêm đèn lúc chạy là mọi material biên dịch lại; mỗi đèn thật
    còn làm mọi điểm ảnh có chiếu sáng tính thêm một lần. Hoa đăng chỉ tự phát sáng (emissive, nên có bloom). Vũng sáng trên nước do
    lớp Mặt nước vẽ.
  - **Đường trôi tính thẳng theo thời gian:** `lanternAt(ô, t)` trả vị trí, góc xoay, độ nở và độ sáng từ công thức, không cộng dồn
    từng khung. Vì vậy `update(0, t)` lúc `?freeze` cho đúng khung N, và test kiểm được bằng số.
  - **Mỗi khung** (`write(t)`, cả khi vẽ lại bằng `update(0, t)`): khi có đèn còn sống, CPU viết lại ma trận cánh của chúng (tối
    đa `(lanterns + 1) × 8` = 72 ở mức cao) và hai thuộc tính instance: `lanternCenter` (tâm đèn, vec2, cho lớp Mặt nước) và
    `lanternGlow`; đèn vừa tắt được ghi thêm MỘT khung để giấu. Rồi `computeBoundingSphere()`: `setMatrixAt` không cập nhật khung
    bao, mà frustum culling dùng nó (Phụ lục A.63). "Không có đèn trôi thì không ghi gì" là nói việc ghi của CPU: không ghi, không
    đánh dấu `needsUpdate`.
    - Hai thuộc tính instance để usage mặc định, không `DynamicDrawUsage`: ở r186 cờ đó tải lại thuộc tính ở MỌI lần render, bất kể
      version (Phụ lục A.62).
    - Ma trận (80 × 64 byte = 5 KB, dưới giới hạn uniform buffer) đi theo uniform buffer của từng lượt vẽ, mà r186 chép lại ở MỖI
      lượt vẽ dù có `needsUpdate` hay không (Phụ lục A.64): rẻ, và không tránh được.
  - **Công bố** `shared.anhTrang.lantern = { material, pool, flame }`: material của đèn (lớp Sương và lớp Mặt nước sửa node của nó),
    `pool = { node, count, size }` (`node`: `uniformArray` `lanterns + 1` ô `vec4(x, z, độ sáng, 0)`, tên `lanternPool`, đèn còn sống
    dồn lên đầu; `count`: uniform SỐ THỰC `lanternCount`, số đèn còn sống; `size` = `lanterns + 1`), `flame` (node màu nến, đã tính
    "Đổi màu đèn").
  - **Số đo:** `lanterns`, nhãn "Hoa đăng đang trôi": số đèn còn sống (đang nổi + đang chìm), nên có thể là N + 1 trong tối đa 3
    giây (§4.2). `__sma.readouts('anh-trang')` đọc được số này (§9).
  - **Núm:** `candleIntensity` giờ chỉ đổi đèn thật ở bờ, nên nhãn đổi thành "Độ sáng đèn thật ở bờ" (id giữ nguyên: API công khai).
  - **Hiểu:** viết lại để thêm ý "đèn thật và vật tự phát sáng", vẫn trong 150 chữ. "Bạn vừa học" thêm một dòng: đèn thật chiếu
    sáng mọi thứ quanh nó nhưng thêm lúc chạy là biên dịch lại; vật tự phát sáng rẻ hơn nhiều nhưng không chiếu sáng gì.
  - **Tên vật:** `trang`, `hoa-dang`.

### Lớp 3 · Sương: bầu trời, noise, sương mù (`layers/l3-suong.js`)
- **Thấy gì:**
  - Vòm trời đổi dần từ chàm xuống đen then.
  - Sao sinh bằng hash, không dùng texture. Có quầng trăng và dải Ngân Hà mờ vẽ bằng fbm.
  - **Sương là là:** dày sát mặt nước, mỏng dần lên cao, trôi theo gió. Vuốt tay thì sương xoáy rồi lắng lại.
- **Kỹ thuật:**
  - Vòm trời là sphere `BackSide` có `colorNode`. Sương ở chân trời vẽ luôn trong `colorNode` đó.
  - **`scene.fogNode = fog(màuSương, hệSốSương)` được gán một lần** và không bao giờ gán lại hay đặt `null`, vì fogNode nằm trong cache key của mọi material.
  - Hệ số sương: `w3 × (1 − exp(−d × density × exp(−positionWorld.y × falloff) × (0.6 + 0.4 × noise3D(p × scale + wind × t))))`, với `d = positionView.z.negate()`.
  - Vòm trời, trăng và quầng trăng đặt `material.fog = false`.
  - Hàm hệ số sương được công bố qua `shared.suong.fogFactor`. Lớp 5 nhân `emissiveNode` của đom đóm với `(1 − hệSốSương)`, vì sương không tác động lên kênh MRT `emissive`.
  - `Fn()` noise/fbm dùng chung nằm ở `lib/tsl/noise.js`, lớp 5 cũng dùng.
- **Núm:** `density`, `heightFalloff`, `noiseScale` (uniform), `octaves` (uniform, 1–5; GĐ 3 đổi từ rebuild, xem dưới), `windStrength`, `starDensity`, `haloSize` (uniform).
- **Phá:** *"Xem noise thô"* (`rawNoise`: hiện hệ số sương dạng ảnh xám), *"Chỉ 1 octave"* (`oneOctave`, kiểu compare: so chi tiết và số ms với số octave của núm; GĐ 3 thay cho "Octave 1 vs 5").
- (GĐ 3) **File:** `layers/l3-suong.js` (dựng lớp, núm, thí nghiệm, nấc), `parts/suong-troi.js` (màu vòm trời: hàm `sky(dir)`),
  `parts/suong-mu.js` (hệ số sương, xoáy khi vuốt, màu sương).
- (GĐ 3) **Vòm trời:** `SphereGeometry` bán kính 300 (trăng ở 160 nằm bên trong; camera far 500), `BackSide`, `MeshBasicNodeMaterial`,
  `fog = false`, `depthWrite = false`, `renderOrder = −1`, `emissiveNode = vec3(0)` (trời không bloom).
  `colorNode = mix(denThen, sky(hướng), w3)`: trọng số 0 là nền đen then (luật 3). Hàm `sky(dir)`:
  - dải màu theo poster: chàm ở đỉnh, xuống đen then ở chân trời; dưới chân trời là màu sương, nên mép ao tan vào trời;
  - chạng vạng còn ấm ở chân trời, gần sáng chàm nhạt dần: đọc `shared.hour` (GĐ 4 gắn thanh giờ vào đúng uniform này);
  - sao: chia hướng nhìn thành lưới ô, mỗi ô có một sao khi `hash(ô) > 1 − starDensity`; sao nhấp nháy theo `ctx.u.time`, mờ dần
    về chân trời và khi gần trăng;
  - quầng trăng vàng lá quanh `shared.moon.dir`, rộng theo `haloSize`;
  - dải Ngân Hà: một vành quanh một đường tròn lớn của bầu trời, độ sáng theo fbm 2 octave, rất mờ.
- (GĐ 3) **Màu sương:** bạc lá pha chàm, tối; sáng lên và ngả vàng lá khi hướng nhìn gần hướng trăng (sương tán xạ ánh trăng về phía trước).
- (GĐ 3) **`octaves` là uniform, không phải rebuild.** `NodeManager.getCacheKey` gộp `fogNode.getCacheKey()` vào cache key của mọi
  render object (Phụ lục A.33): đổi đồ thị của sương là biên dịch lại MỌI material. Vì vậy `fbm(p, { octaves })` của `lib/tsl/noise.js`
  nhận thêm một node làm số octave: khi đó shader có vòng lặp thật (`Loop` tối đa 5 lần, `Break` khi đủ), và đổi số octave không
  biên dịch lại. Nhờ vậy "Chỉ 1 octave" đo ms không dính cú khựng biên dịch, và lớp có được nấc hạ chất lượng `chi-tiet`.
  Truyền số JS thì `fbm` vẫn khai triển lúc dựng như trước (trăng của lớp Ánh trăng dùng cách này).
- (GĐ 3) **Vuốt tay:** `shared.js` giữ một "xoáy" (`shared.swirl`: tâm trên mặt nước, lúc bắt đầu, chiều và độ mạnh theo vận tốc vuốt).
  Hệ số sương xoay miền noise quanh tâm đó một góc giảm dần theo `exp` của thời gian và của khoảng cách: sương xoáy rồi lắng lại.
  Vuốt vẫn không dời điểm hút của đom đóm.
- (GĐ 3) **Công bố:** `shared.suong = { fogFactor, sky }`. Vàng lá dùng `fogFactor`. Mặt nước dùng `sky` cho phản chiếu giả ở mức thấp,
  và `fogFactor` để làm mờ ánh lóe trên nước.
- (GĐ 3) **"Xem noise thô":** sương thành `fog(mix(màu, vec3(noise), raw), mix(hệ số, 1, raw))`: mọi bề mặt có sương hiện noise xám.
  Công tắc là uniform, không biên dịch lại. Vòm trời, trăng, đom đóm không có sương nên vẫn như cũ.
- (GĐ 3) **Số đo:** `octaves` (số octave đang chạy = min(núm, trần)).
- (GĐ 3) **Nấc `chi-tiet`:** trần số octave về 1.
- (GĐ 3) **Trần núm theo mức** (§10): ở mức thấp, `octaves` kéo tối đa 3.
- (GĐ 3) **Thơ của lớp:** *"Đêm qua ra đứng bờ ao / Trông cá cá lặn, trông sao sao mờ"* (ca dao).
- (GĐ 4) **Theo thanh giờ:** nền của màu sương ấm về nâu cánh gián lúc chạng vạng và lúc gần sáng. Sương dùng cùng hệ số `dusk` với vòm
  trời, nên chân trời và sương đổi màu cùng nhau.
- (GĐ 4) **Nấc `chi-tiet`:** chỉ đưa ra khi `budget.fogOctaves > 1`. Mức thấp vốn đã chạy 1 octave, nên ở đó nấc này không có tác dụng.
  Đưa ra một nấc không tác dụng là trái luật "lớp chỉ đưa nấc có tác dụng ở mức hiện tại".
- (GĐ 5) **Hoa đăng trong sương:** nhân `emissiveNode` của đèn (`shared.anhTrang.lantern.material`) với `(1 − fogFactor)`, như đom
  đóm: đèn ở xa không bloom xuyên sương. Đây đúng là cách lớp sau sửa node của lớp trước, trước khi biên dịch. Tên vật: `vom-troi`.
  - Khác đom đóm, đèn vẫn để `fog = true` (sương trộn màu đầu ra), nên trong ảnh chính phần tự phát sáng bị nhân `(1 − hệ số)` hai
    lần, kênh bloom một lần. Đèn không dùng `mrtNode` để chỉ làm mờ kênh bloom được: reflector vẽ đèn vào ảnh không có MRT (Phụ lục
    A.19).
  - Mọi đèn chung material, nên đèn ở bờ cũng mờ theo sương. Đo ở khung poster trên GPU thật: so với bản GĐ 4, cả cảnh mặc định chỉ
    khác ở đèn ở bờ, tối đi chừng 1%. Vì vậy không chụp lại poster.

### Lớp 4 · Mặt nước: phản chiếu và gợn sóng (`layers/l4-mat-nuoc.js`)
- **Thấy gì:**
  - **Mặt nước là một đĩa phẳng bán kính khoảng 60, thuộc lớp này.** Ở trọng số 0, đĩa là đất sét.
  - Nước đen bóng như sơn, soi trăng, sen và trời.
  - Chạm vào thì gợn sóng lan ra, bóng trăng **bị xẻ đôi**, lá sen nhấp nhô khi sóng đi qua.
- **Kỹ thuật:**
  - Phản chiếu bằng `reflector({ resolutionScale })`: cao 0.5 / vừa 0.35.
    - Gọi `refl.target.rotateX(−π/2)` rồi **`scene.add(refl.target)`**, và gỡ nó ra trong `dispose`. Reflector đọc `target.matrixWorld` mà không tự cập nhật, nên target nằm ngoài scene sẽ cho một gương dựng đứng.
    - Đổi `refl.reflector.resolutionScale` lúc chạy có hiệu lực ngay.
    - Reflector tự ẩn material của chính nó và render cảnh **không có MRT**.
  - UV phản chiếu lệch theo normal: `refl.uvNode = refl.uvNode.add(normal.xz × distortion)`. Normal lấy từ 2 lớp noise trôi cộng trường gợn sóng.
  - Pha giữa phản chiếu và màu nước sâu bằng Schlick fresnel.
  - **Gợn sóng (GĐ 1):**
    - `uniformArray` 8 phần tử `vec4(x, z, startTime, amp)` dùng như ring buffer. Chỉ cần sửa `array[i]`: ở mỗi lượt vẽ có dùng
      mảng, three tự chép mảng vào bộ đệm của nó. (GĐ 5 sửa lời: ở r186 bộ đệm đó là một binding riêng trong nhóm uniform của từng
      vật, `objectGroup`, nên được tải lên GPU ở MỖI lần vẽ có dùng nó (nước, lá, hoa đăng), không phải một lần mỗi khung; mảng chỉ
      8 × 16 byte nên vẫn rẻ. Phụ lục A.64.)
    - **Một hàm TSL `rippleHeight(xz)` dùng chung**, nằm trong `shared.js` của bức, cho normal của nước lẫn độ nhấp nhô của lá.
    - Lá đọc attribute tâm instance của lớp 1. Trong r186, `positionNode` chạy **sau** instancing.
  - `emissiveNode` của nước lấy phần sáng vượt ngưỡng trong ảnh phản chiếu, nên bóng đom đóm và bóng trăng trên nước cũng bloom nhẹ. Đây là cách duy nhất, vì ảnh phản chiếu không có kênh emissive.
  - (GĐ 1) Nước là `MeshStandardNodeMaterial` (có chiếu sáng, nên trọng số 0 là đất sét như mọi hình khác). Ảnh phản chiếu cộng
    vào qua `emissiveNode`; `mrtNode` ghi kênh `emissive` riêng (chỉ phần vượt ngưỡng). Độ nhám rất thấp trên pháp tuyến gợn làm
    specular của ánh trăng (lớp 2) thành lối trăng lấp lánh, tự tắt khi lớp Ánh trăng tắt.
- **Mức thấp:** "phản chiếu giả" bằng màu trời cộng vệt trăng tính theo công thức, không render cảnh lần thứ hai.
  - (GĐ 3) Mức thấp (`budget.reflection === 0`) không tạo reflector. Phản chiếu giả = `shared.suong.sky(hướng phản xạ)` cộng đĩa trăng
    phản xạ: `pow(saturate(dot(hướng phản xạ, hướng trăng)), độ gắt)` nhân màu trăng và trọng số của lớp Ánh trăng. Pháp tuyến gợn và
    noise làm đĩa trăng vỡ thành lối trăng lấp lánh, đúng cách lối trăng thật hình thành. Ở mức này không có thí nghiệm "Độ phân
    giải 0.1" (không có ảnh nào để hạ; review GĐ 3); hai núm `distortion` và `reflectionResolution` không làm gì, tab Hiểu nói rõ
    điều đó; số đo `reflectionScale` là 0. Không có sen, lá hay đom đóm trong nước: đó là cái giá.
- (GĐ 3) Ánh lóe trong kênh `emissive` (`mrtNode`) nhân `(1 − shared.suong.fogFactor)`: bóng trăng ở xa trong sương không bloom xuyên sương.
- (GĐ 3) **Nấc `phan-chieu`:** trần độ phân giải phản chiếu nhân 0,5 (tối thiểu 0,15); hiệu lực = min(núm, trần). Mức thấp không có nấc này.
- (GĐ 3) **Trần núm theo mức** (§10): `reflectionResolution` tối đa 1 ở mức cao, 0,6 ở mức khác (vẽ cả cảnh lần hai ở độ phân giải đầy đủ là quá sức máy yếu).
- **Núm:** `amplitude`, `speed`, `decay`, `wavelength`, `distortion`, `fresnelPower` (uniform), `reflectionResolution` (js, 0.1–1).
- **Phá:** *"Độ phân giải 0.1"* (`lowRes`, phản chiếu vỡ hạt), *"Tắt fresnel"* (`noFresnel`), *"Xem heightfield"* (`heightfield`: ảnh xám của độ cao gợn). Hai thí nghiệm sau là uniform bên trong node, không biên dịch lại. Số đo: `reflectionScale`.
- (GĐ 5) **Hoa đăng trên nước:**
  - `positionNode` của đèn cộng độ cao gợn tại `lanternCenter`, nhân trọng số của lớp, giống lá (`BOB` 0,6). Đèn ở bờ cũng vậy;
    không có gợn thì đèn đứng yên, nên poster không đổi.
    - (Dựng thử) Độ nhấp nhô còn nhân `lanternGlow` (đã gồm `1 − độ chìm`): đèn đang chìm thôi nhấp nhô cùng lúc với tắt dần. Ở
      khung cuối, mũi cánh chỉ còn dưới mặt nước chừng 0,06; sóng mà vẫn nâng đèn thì mũi cánh nhô lên đúng lúc ô bị giấu (đèn
      "bật" mất thay vì lặn). Đèn ở bờ có độ sáng luôn 1, nên nhấp nhô đủ.
  - **Vũng sáng:** nước cộng vào `emissiveNode` một quầng ấm quanh mỗi đèn còn sống: `Σ exp(−d²/r²) × độ sáng`, màu `flame`, nhân
    trọng số của lớp Ánh trăng và của lớp này; "Xem heightfield" tắt nó như tắt ảnh phản chiếu. Vòng lặp đọc `pool` bằng `Loop`
    `pool.size` vòng (`lanterns + 1`: 9 / 7 / 5) và `Break` khi chỉ số (đổi sang float) chạm `lanternCount` (như `fbm` có số octave
    là node): không có đèn trôi thì vòng đầu đã `Break`, shader không cộng ô nào. Đèn ở bờ không có trong mảng: nó có đèn thật
    chiếu xuống nước rồi.
    - `POOL = { radius: 1.1, intensity: 0.6 }`, chốt trên GPU thật: bán kính 1,6 lúc đầu trải một vệt vàng rộng gấp chục lần ngọn
      đèn, mặt nước quanh đèn bạc thành màu be; 1,1 giữ ánh nến quanh chân đèn, cách đèn chừng hai đơn vị nước lại đen như sơn mài.
  - Vũng sáng không vào kênh emissive (`mrtNode` giữ nguyên): chỉ ngọn đèn tỏa, mặt nước quanh nó thì không. Dựng thử trên GPU thật
    thấy đủ, nên không cho phần vượt `GLINT` vào.
  - Tên vật: `mat-nuoc`.

### Lớp 5 · Vàng lá: đom đóm tính trên GPU (`layers/l5-vang-la.js`)
- **Thấy gì:**
  - Đom đóm vàng lá trôi lững lờ theo dòng curl-noise. Mỗi con nhấp nháy theo nhịp riêng và có bóng phản chiếu run run trên nước.
  - Giữ tay thì chúng tụ lại và bay vòng quanh, thả ra thì chúng bung ra như tia lửa lò rèn.
  - Ở trọng số 0 đom đóm tắt hẳn.
- **Kỹ thuật:**
  - Hai bộ đệm `instancedArray(MAX, 'vec4')`: `posPhase` (xyz + pha) và `velSeed` (vận tốc + hạt giống).
    - Mỗi kernel dùng **tối đa 4 bộ đệm**, vì WebGL2 chạy compute qua transform feedback, và SwiftShader đo được giới hạn là 4.
    - Cấp phát theo mức tối đa một lần. Lúc chạy chỉ đổi `computeNode.count` và `sprite.count`.
  - Mỗi khung chạy `renderer.compute(stepNode)`. Kernel chỉ đọc và ghi phần tử của chính nó, vì trên WebGL2 `element(i)` luôn trả phần tử của chính invocation.
  - Curl noise tính bằng sai phân của noise 3D (`lib/tsl/noise.js`).
  - Điểm hút là giao điểm của tia từ con trỏ với mặt phẳng nước, có độ giảm mềm. Tia lấy từ `Gesture.ray`; phép giao do bức tự làm.
  - Nhấp nháy: `smoothstep(sin(t·rate + phase))`, với `t` là `ctx.u.time`.
  - **Hiển thị:**
    - `Sprite` với `SpriteNodeMaterial`, `positionNode = posPhase.toAttribute().xyz`, `sprite.count = N`, `frustumCulled = false`.
    - `AdditiveBlending`, `depthWrite = false`.
    - `emissiveNode` nhân với trọng số và với `(1 − hệSốSương)`.
    - Pipeline của xưởng đặt `setBlendMode('emissive', new BlendMode(MaterialBlending))`, để các con cộng dồn thay vì đè lên nhau.
- **Số lượng:**
  - Mặc định cao 3.000 / vừa 1.500 / thấp 600.
  - Núm cho tăng tới 200k trên WebGPU và 20k trên WebGL2 (`max` theo tầng của núm).
- **Biến thể CPU (GĐ 3):** cùng luật đó chạy trên JS, ghi vào `InstancedBufferAttribute` (tối đa 5k) qua `instancedDynamicBufferAttribute(attr)`. Dùng cho thí nghiệm *"CPU vs GPU"* (`kind: 'compare'`), có biểu đồ ms. Đây cũng là đường lùi chính thức nếu compute trên WebGL2 của máy thật gặp lỗi.
- **Núm:** `count` (js), `flowScale`, `speed`, `attraction`, `blinkRate`, `size`, `glow` (uniform).
  - (GĐ 2) Đã có `size`, `glow`, `attraction` và `count`. Bộ đệm cấp phát theo trần của tầng (200k / 20k) một lần; `count` chỉ đổi `computeNode.count` và `sprite.count`. `count` tối thiểu 100: sprite có `count > 1` nằm trong cache key của three.
- **Phá:** *"CPU vs GPU"*, *"Tắt additive"* (thấy lỗi thứ tự vẽ).
- (GĐ 3) **Dòng bay:** hướng muốn bay = `curl(p × flowScale + trôi theo t) × speed`, cộng xoáy chậm quanh tâm ao; lực hút của tay giữ như
  GĐ 1. `curl(p)` (`lib/tsl/noise.js`) là curl của trường `mx_noise_vec3`, tính bằng sai phân trung tâm: trường không phân kỳ, nên đàn trôi
  thành những dòng xoáy mà không dồn về một chỗ. Núm mới `flowScale`, `speed`, `blinkRate` (uniform).
- (GĐ 3) **Trong sương:** sprite đặt `fog = false` và nhân emissive với `(1 − fogFactor)`. `fog` của three trộn MÀU ĐẦU RA về màu sương
  (Phụ lục A.34); với `AdditiveBlending`, mỗi con sẽ cộng thêm một đĩa màu sương lên cảnh.
- (GĐ 3) **Trọng số 0:** không chạy compute và giấu sprite (`visible = false`, không nằm trong cache key): không tốn draw call.
- (GĐ 3) **Biến thể CPU** (`parts/vang-la-cpu.js`): cùng luật bay viết bằng JS (noise gradient 3D, curl bằng sai phân), tối đa 5.000 con,
  ghi vào một `InstancedBufferAttribute` mà material đọc qua `instancedDynamicBufferAttribute`. Một Sprite thứ hai (material cùng
  công thức) được dựng khi thí nghiệm bật lần đầu. GĐ 4 sửa lời: việc dựng này đồng bộ và chỉ mất vài mili giây, nên không cần
  Promise hay "đang dựng…". Từ lần đó, bật/tắt chỉ đổi sprite nào hiện và phía nào tính.
  Đàn CPU xuất phát từ hạt giống riêng (`lib/random.js`), không đọc ngược bộ đệm GPU.
- (GĐ 3) **Thí nghiệm:** *"CPU vs GPU"* (`cpu`, kiểu compare: ms CPU lộ ngay phần việc của JS) và *"Tắt additive"* (`noAdditive`: blending
  Normal + `needsUpdate`, biên dịch lại một lần như "Normal phẳng"; con đang tắt thành đốm tối, con vẽ sau đè con vẽ trước).
- (GĐ 3) **Số đo:** `count` (số con đang vẽ = min(núm, trần); ở chế độ CPU còn kẹp ở 5.000).
- (GĐ 3) **Nấc `dom-dom`:** trần số con = nửa số mặc định của mức (tối thiểu 100).
- (GĐ 3) **Trần núm theo mức** (§10): `count` tối đa = min(trần của tầng, trần của mức): cao 200.000, vừa 50.000, thấp 10.000;
  WebGL2 không quá 20.000. Bộ đệm cấp phát theo đúng trần đó.
- (GĐ 3) **Đường lùi:** biến thể CPU hiện chỉ bật tay qua thí nghiệm. Tự phát hiện compute WebGL2 hỏng trên máy thật để sau (§16).
- (GĐ 4) **Vẽ lại lúc `?freeze`:** `update(0, t)` không chạy compute và không bước đàn CPU. dt = 0 nghĩa là đồng bộ lại chứ không
  tiến mô phỏng (§8.4), nên khung N vẫn đúng là khung N.
- (GĐ 5) **Tên vật:** `dom-dom` (sprite của GPU), `dom-dom-cpu` (sprite của biến thể CPU, có khi thí nghiệm "CPU vs GPU" bật).

### Lớp 6 · Phủ bóng: hậu kỳ (lớp dùng chung `src/engine/stock/phu-bong/`)
Phủ bóng là bước cuối của nghề sơn mài, nên nó thuộc về kỹ thuật. Bức nào cũng lắp được, qua `post` của hợp đồng lớp (§8.4). Xưởng lo phần chuyển màu cuối: `renderer.toneMapping` luôn là `NoToneMapping`, `renderPipeline.outputColorTransform = false`, và `renderOutput` được chèn giữa hai chặng `build` và `display`.

- **Thấy gì:**
  - Chỉ những thứ có emissive mới bloom.
  - Tone mapping AgX giữ lại chi tiết vùng sáng.
  - **LUT "sơn mài"** làm vùng tối ấm về nâu cánh gián, vùng sáng ánh vàng lá, chàm hơi ngả.
  - Thêm grain nhẹ, vignette và FXAA.
- **`build`** (HDR tuyến tính vào, ra):
  1. `hdr = color + bloom(channel('emissive'), bloomStrength, bloomRadius, bloomThreshold) × w`. Bloom (`three/addons/tsl/display/BloomNode.js`) nhận uniform của núm làm tham số và tốn 12 draw call mỗi khung. Cách làm theo example `webgpu_postprocessing_bloom_emissive`.
  2. **Tone mapping chọn bằng uniform, viết bằng `Fn` + `.toVar()` + `If`, không dùng `select()`.** Trong r186, `select()` sinh `if/else`: node nào dựng lần đầu trong một nhánh rồi dùng lại bên ngoài (ví dụ `hdr.a`) sẽ đọc biến chưa gán, và alpha bằng 0.
     ```js
     const toned = Fn(() => {
       const h = hdr.toVar();                              // vật chất hóa TRƯỚC mọi nhánh
       const c = h.rgb.mul(uExposure).toVar();             // 'none'
       If(uTone.equal(1), () => { c.assign(agxToneMapping(h.rgb, uExposure)); })
       .ElseIf(uTone.equal(2), () => { c.assign(acesFilmicToneMapping(h.rgb, uExposure)); });
       return vec4(mix(h.rgb.mul(uExposure), c, w), h.a);
     })();
     ```
     Đã kiểm: +0 program khi đổi `uTone`, ảnh đúng trên cả hai backend. GĐ 0 chỉ có AgX, trộn theo `w`, cũng viết trong `Fn` với `.toVar()`.
- **`display`** (màu sRGB vào, ra; GĐ 4): `lut3D` với LUT 32³ **sinh bằng code** từ bảng màu đã ghép (`Data3DTexture` phải đặt `LinearFilter`), rồi grain tự viết (trung bình bằng 0, không dùng `film()`), rồi vignette bằng TSL, rồi `fxaa()` cuối cùng (FXAA cần đầu vào sRGB, tốn thêm 1 draw call). Mọi hiệu ứng đều trộn theo `w`.
  - (GĐ 4) **LUT "sơn mài"** (`stock/phu-bong/lut.js`):
    - Hàm thuần `lacquerLut(hex, size)` trả mảng RGBA8 kích thước 32³, tính từ bảng màu đã ghép (`ctx.palette.hex`). Mảng được bọc
      thành `Data3DTexture` với `LinearFilter` và `ClampToEdge`.
    - Cách tính là tách tông theo độ sáng: vùng tối kéo về `canhGian`, vùng sáng về `vangLa`, màu ngả xanh kéo về `cham`. Độ sáng của
      từng điểm gần như giữ nguyên.
    - (Dựng thử GĐ 4) Màu càng gần xám thì nhuộm càng mạnh, màu đậm (lá xanh, nhị vàng) chỉ nhuộm nhẹ; màu tối mà ngả lam (trời
      đêm) nhuộm chàm thay cho cánh gián, để trời chàm không ngả nâu.
    - Test khóa **tính chất**, không khóa công thức:
      - đen vẫn đen, trắng vẫn gần trắng;
      - độ sáng lệch ít;
      - xám tối ấm lên (kênh đỏ > kênh lam), xám sáng ngả vàng;
      - bức ghi đè `canhGian` thì màu vùng tối đổi theo.
    - Hai cách khác đã loại: kéo mỗi màu về token gần nhất (ảnh thành tranh cắt dán), và gradient map theo độ sáng (mất hết xanh lá
      và chàm).
  - (GĐ 4) **Grain** = `(hash(tọa độ điểm ảnh, số khung) − 0,5) × grain`, nên trung bình bằng 0. Số khung tính từ `ctx.u.time`, vì vậy
    `?freeze` vẫn cho ảnh tất định.
  - (GĐ 4) **Vignette:** tối dần theo khoảng cách tới tâm khung (có tính tỉ lệ khung), bằng `smoothstep`.
  - (GĐ 4) **FXAA** đứng cuối. `fxaa(node)` vẽ phần chuỗi phía trước ra một RTT (+1 lượt vẽ, Phụ lục A.42), rồi đọc các điểm quanh
    từng điểm ảnh.
  - (GĐ 4) Cả bốn hiệu ứng trộn theo `w6`. FXAA còn trộn thêm theo thí nghiệm "Tắt FXAA".
- **Khi `w6` = 0:** không bloom, không LUT, không grain, tone `none`. Tất cả là phép trộn trong cùng một đồ thị. Người xem thấy ảnh HDR bị cháy trắng, và đó chính là bài học.
  (GĐ 4) Cũng không vignette và không FXAA, nên mép lá lộ răng cưa.
- **Tap cho công cụ (GĐ 4):** `tap('truoc-tone', hdr)` và `tap('truoc-bloom', color)` sinh ra các view `phu-bong:truoc-tone` và `phu-bong:truoc-bloom`.
  - (GĐ 4) Tap ghi một **biểu thức node thuần**: texture của scene pass, texture của bloom, uniform. Không ghi biến `.toVar()` nằm trong
    `Fn`. Lý do: overlay của công cụ chạy ở lượt vẽ cuối (sau RTT của FXAA), nên phải tính lại biểu thức đó ngay tại điểm ảnh ấy.
  - (GĐ 4) Nhãn của tap nằm ở `content.layers['phu-bong'].taps`: 'Trước tone', 'Trước bloom'.
- **Núm:** `bloomStrength`, `bloomRadius`, `bloomThreshold`, `toneMapping` (uniform chọn: none/AgX/ACES), `exposure`, `lutIntensity`, `grain`, `vignette`, tất cả là uniform. GĐ 0 có `bloomStrength` và `exposure`; GĐ 2 có đủ núm của chặng `build`; ba núm cuối đi cùng chặng `display` ở GĐ 4.
  - (GĐ 2) `bloom()` giữ nguyên node được truyền vào làm strength/radius/threshold, nên ba núm bloom là uniform thật.
  - (GĐ 4) Khoảng giá trị: `lutIntensity` 0–1, `grain` 0–0,15, `vignette` 0–1. Số mặc định chốt ở lượt màu GĐ 4 (§5): 0,45 / 0,03 /
    0,45. Nhãn thêm vào content của lớp dùng chung.
- **Nấc:** `bloom` nhân `resolutionScale` hiện tại với 0.5 (mặc định lấy `ctx.budget.bloom ?? 0.5`).
  (GĐ 3) `BloomNode` đọc `resolutionScale` và đặt lại cỡ render target mỗi khung (Phụ lục A.36), nên nấc này không biên dịch lại.
- **Phá:** *"Bloom cả khung vs chọn lọc"* (bloom lên cả output thì ảnh bết), *"Tắt tone mapping"*, thanh trượt so sánh trước/sau.
  - (GĐ 2) Có *"Bloom cả khung"* (`wholeFrame`: đầu vào của bloom là `mix(emissive, output, uniform)`). "Tắt tone mapping" là núm `toneMapping = none`; thanh trượt trước/sau đi cùng Kính mài (GĐ 4).
  - (GĐ 4) Thêm *"Tắt FXAA"* (`noFxaa`): mép lá và cuống sen lộ răng cưa.
  - (GĐ 4) Thanh so sánh trước/sau chính là hình **gạt** của Kính mài (§7): chọn view "Trước tone" rồi gạt qua lại.
  - (GĐ 4) Tab Hiểu (≤ 150 chữ) viết lại cho đủ hai chặng `build` và `display`. Sơ đồ thêm chặng display.
- **Nội dung (Hiểu/Phá) của lớp dùng chung viết trung tính** với mọi bức. Ví dụ riêng của một bức thì bức đó ghi đè khi import (§8.6).

## 7. Công cụ học

**(GĐ 5) Thanh công cụ** (`[data-toolbar]`, chung cho mọi công cụ). Sửa lỗi có từ GĐ 4: ở 1280×800, khi thanh lớp và Sổ tay cùng
mở, Sổ tay che 112 px của bảng Từng sợi, kể cả nút "Dệt lại" (Kính mài mất nút view cuối theo cùng cách).
- Bề rộng ở `:root` của `notebook.css`: `--rail-w: 224px`, `--notebook-w: min(440px, calc(100vw - 300px))`. Thanh lớp, Sổ tay và
  `tools.css` cùng đọc hai biến này.
- Thanh lớp mở (`.rail:not([hidden]) ~ .toolbar`: đọc bằng bộ chọn anh em, vì thanh công cụ đứng ngay sau thanh lớp trong trang;
  không dùng `:has()`, thứ trình duyệt cũ ở tầng WebGL2 có thể chưa có; không thêm thuộc tính nào cho `body`):
  - mặc định, ngoài mọi `@media`: bảng bắt đầu sau thanh lớp một khe 16 px (`left: calc(var(--gutter) + var(--rail-w) + 16px)`,
    `right: var(--gutter)`);
  - `@media (min-width: 1240px)`: thêm `right: calc(var(--gutter) + var(--notebook-w) + 16px)`, bảng ở giữa khoảng trống giữa thanh
    lớp và chỗ của Sổ tay;
  - `@media (max-width: 640px)`: `left: 0; right: 0` (điện thoại: bảng trải ngang ngay trên dải thanh lớp).
- `@media (max-width: 1239.98px)`: `body[data-tool] .notebook { display: none }`. Ngưỡng 1240 = 2 lề 32 + thanh lớp 224 + Sổ tay
  440 + 2 khe 16 + 480, bề rộng hẹp nhất mà bảng còn dùng được (đo trên GPU thật: hàng của Từng sợi trên một dòng là 451 px, cộng
  26 px đệm và viền là 477 px; Kính mài 475 px, Lột lớp 458 px). `tests/unit/shell-css.test.js` tính lại ngưỡng từ các biến.
- Các cặp ngưỡng bù nhau, không hở: bề rộng CSS có thể lẻ (zoom trình duyệt hay tỉ lệ hiển thị của hệ điều hành: cửa sổ 1549 px
  ở 125% là 1239,2 px), nên không có cặp `max-width: 1239px` / `min-width: 1240px` hay `max-width: 640px` / `min-width: 641px`
  (Phụ lục A.74).
- `max-width` của `.tool-panel` trên máy tính giữ `min(560px, calc(100vw - 2 * var(--gutter)))`, không có phần trăm. Bảng nằm trong
  ô `.tool`, mà ô là phần tử flex của thanh: phần trăm ở đó "vòng" lúc tính bề rộng nội dung của ô, và Chromium bỏ cả `max-width`,
  kể cả 560 px (Phụ lục A.73). Trên điện thoại `max-width: 100%` (chỉ phần trăm) thì không sao.
- Thứ tự trong trang: thanh lớp → thanh công cụ → Sổ tay (Tab đi theo thứ tự DOM, WCAG 2.4.3). `toolbox.js` gắn thanh công cụ ngay
  sau `[data-rail]` nếu đã có ("Dựng lại cảnh"), không thì cuối `body`; `workshop.js` mở lần đầu thì đặt thanh lớp ngay trước và Sổ
  tay ngay sau `[data-toolbar]` đã có. z-index (thanh công cụ 1 < thanh lớp, Sổ tay 2), không phải thứ tự DOM, giữ thanh công cụ và
  tay nắm gạt (cao cả khung) ở dưới hai tấm.
- Vẫn không `transform`, `filter`, `backdrop-filter` trên `.toolbar` và `.tool` (GĐ 4: tay nắm gạt là con `position: fixed`).
- Quét trên GPU thật (26 bề rộng từ 360 tới 2560 px ở cao 800, 8 bề rộng ở cao 400): không tấm nào chồng lên nhau, bảng nằm trong
  khung nhìn, mọi nút bấm trúng, tay nắm của Kính mài vẫn đo theo khung nhìn. Từ 641 tới 783 px, hàng của bảng xuống 2–3 dòng mà
  vẫn dùng được.

### Kính mài (công cụ của xưởng, `engine/tools/kinh-mai.js`, GĐ 4)
- **Uniform:** `uLensPos` (tọa độ màn hình), `uLensRadius`, `uLensMode`.
- **Chế độ:** lấy từ `pipeline.views()`, không liệt kê cứng. Có `final`, `emissive`, `normal`, `depth`, cộng các tap của lớp.
- **Ghép:** `mix(final, view, 1 − smoothstep(r − feather, r, dist))`, cộng một viền vàng lá.
  - Overlay đặt **sau** chặng `display` (sau FXAA) và được ghép **một lần** khi dựng pipeline. (GĐ 4) Ngoại lệ duy nhất:
    `requireView` đổi MRT thì overlay được ghép lại một lần nữa, trên chuỗi post cũ (xem dưới).
  - Chọn chế độ bằng `If` bên trong `Fn`, không dùng `select()`.
  - View tuyến tính đi qua `renderOutput(…, NoToneMapping)` trước khi trộn, nên `views()` luôn trả node ở không gian hiển thị.
- **View chưa sẵn sàng:** `view(id)` trả một node giữ chỗ. `requireView('normal')` làm theo thứ tự: thêm `normal: packNormalToRGB(normalView)` vào MRT, rồi `getTextureNode('normal')`, rồi dựng lại `outputNode`, rồi `needsUpdate = true`. Việc này biên dịch lại một lần, trong lúc đó hiện chữ "đang mài…". Depth lấy từ `scenePass.getLinearDepthNode()`.
- **Cử chỉ:** công cụ đang bật nhận cử chỉ trước. Nếu công cụ trả `true` thì cử chỉ dừng ở đó, không chuyển cho bức. Nhờ vậy, trên điện thoại, khi bật kính thì chạm dùng cho kính; lúc khác chạm dùng cho mặt nước.
- (GĐ 4) **Hai hình.** Chọn bằng uniform `uLensShape` (`If` trong `Fn`, không biên dịch lại):
  - **Tròn:** như trên. Bán kính mặc định bằng 18% cạnh ngắn của khung, có viền vàng lá.
    - Máy tính: kính đi theo chuột (cử chỉ `hover`, §8.4).
    - Điện thoại: chạm để đặt kính, giữ rồi kéo để dời. Kéo nhanh vẫn là xoay camera, vì xưởng giữ `drag` cho camera.
  - **Gạt:** một vạch vàng lá chia khung ở `uLensSplit` (0–1 theo chiều ngang). Bên trái vạch là view đang chọn, bên phải là ảnh cuối.
    - Tay nắm là một phần tử DOM `role="slider"`. Kéo được bằng chuột hay ngón tay; bàn phím: mũi tên ±2%, Home/End.
    - Nhờ vậy dùng được bằng bàn phím và trình đọc màn hình.
    - Đây chính là thanh so sánh trước/sau của Phủ bóng (§6).
- (GĐ 4) **Thanh điều khiển:** hai nút hình (Tròn / Gạt), và một nhóm nút view (`aria-pressed`) lấy từ `views()`, bỏ `final`.
  Chọn một view chưa sẵn sàng (Normal) thì:
  1. gọi `requireView` trước;
  2. hiện "đang mài…" trong một vùng `aria-live`;
  3. xong rồi mới đổi `uLensMode`.

  Khi một công cụ đang bật, thơ và con dấu ở chân tranh ẩn đi (`visibility: hidden`, vẫn giữ chỗ) để nhường chỗ cho thanh điều
  khiển; tắt công cụ thì hiện lại.
- (GĐ 4) **Cử chỉ:** kính chỉ giữ cú chạm và cú giữ của ngón tay hay bút (`g.pointer !== 'mouse'`). Trên máy tính, bấm chuột dưới kính
  vẫn tạo gợn sóng như thường.
  (GĐ 5) Kính tròn giữ cả cú chạm hai lần của ngón tay hay bút: hai `tap` làm nên nó đã là của kính, nên bức mà nhận `double-tap`
  thì làm điều người xem không định (Bức 1 thả hoa đăng). Luật chung ở §8.4 `ToolInstance.onGesture`. Nhấp đúp chuột vẫn tới bức.
  Hình gạt không giữ cử chỉ nào trên canvas (tay nắm là phần tử DOM riêng), nên mọi cú chạm, kể cả chạm hai lần, vẫn tới bức.
- (GĐ 4) **`requireView('normal')`**, theo thứ tự:
  1. đổi MRT của scene pass: thêm `normal`, đặt lại blend của `emissive`;
  2. ghép lại overlay của các công cụ lên **chuỗi post cũ**. Không gọi lại `build`/`display`, nên bloom không bị dựng hai lần;
  3. đặt `needsUpdate = true`.

  MRT nằm trong cache key của material, nên mọi material biên dịch lại một lần. `view('normal')` trả node giữ chỗ cho tới lúc đó.

### Lột lớp (`engine/tools/lot-lop.js`, GĐ 4)
- Thanh trượt đi ngược danh sách view.
- Thứ tự view: `final`, các tap theo thứ tự ngược pipeline, rồi `emissive`, `normal`, `depth`. Với Bức 1 là *Ảnh cuối → Trước tone → Trước bloom → Chỉ emissive → Normal → Depth*.
- Nhãn lấy từ `content.layers[id].taps` và `t` (§8.2).
- (GĐ 4) Thanh là một `input type="range"`:
  - số nấc bằng số view (Bức 1 có sáu); `aria-valuetext` là tên view; phím mũi tên đi từng nấc;
  - nấc bên phải cùng là "Ảnh cuối", kéo sang trái là lột dần về trước;
  - cả khung hiện view đang chọn (`uPeel` là chỉ số view; 0 là tắt overlay).
- (GĐ 4) Lột lớp không giữ cử chỉ nào trên canvas: chạm vẫn tạo gợn sóng, để người xem thấy gợn sóng hiện ra trong ảnh Normal hay Depth.

### Từng sợi (`engine/tools/tung-soi.js`, GĐ 5)
Dệt lại khung hình từng sợi một. Mỗi sợi là một lần vẽ (draw call) của lượt vẽ cảnh (scene pass), theo đúng thứ tự GPU nhận. Lột lớp
cho thấy các bước SAU lượt vẽ cảnh (bloom, tone); Từng sợi cho thấy chính lượt vẽ cảnh được làm ra thế nào.
- **Chặn lần vẽ** (`engine/gpu/draws.js`): khi công cụ bật, xưởng gắn `renderer.setRenderObjectFunction(móc)`; khi tắt thì gỡ, nên
  lúc không dùng cảnh không tốn thêm gì.
  - Móc nhận mọi lần vẽ của `renderer.render()`. Bóng đổ, bloom và RTT của FXAA tự cất rồi trả lại móc; phản chiếu vẽ bằng camera ảo
    của reflector (Phụ lục A.53). Móc chỉ chặn lần vẽ của **camera chính**. Lần vẽ của camera khác **lồng** trong lần vẽ một vật được
    đếm riêng là "phản chiếu". Lần vẽ của camera khác ở ngoài cùng (quad của hậu kỳ) nằm trong "các lượt khác".
  - Scene pass phải vẽ **đầu tiên** trong lượt cuối. RTT của FXAA gỡ móc trong lượt của nó: scene pass vẽ lần đầu từ bên trong RTT
    thì móc không thấy lượt vẽ cảnh. `views.js` bọc ảnh cuối bằng một `Fn` mở đầu bằng `scenePass.toVar()` (Phụ lục A.53).
  - Lần vẽ được phép thì móc gọi hàm vẽ trước đó (hàm `renderObject` của three, hay hàm mà ai đó đã đặt trước). Lần vẽ không được phép
    thì bỏ qua. Không đụng vào `visible` hay thứ gì trong cache key, nên không biên dịch lại.
  - **Ghi danh sách** của một khung vẽ đủ. Mỗi mục gồm: vật (và lớp của nó: vật nằm trong `layer.objects`, hay là con của một vật như
    thế), nhãn, loại (`Mesh`, `InstancedMesh`, `Sprite`…), số bản (`count`), số tam giác, loại material, và số lần vẽ lồng bên trong.
    Mặt nước kéo theo cả lượt phản chiếu, vì reflector vẽ lại cảnh ngay trước khi nước được vẽ. Mesh nhiều material vẽ mỗi nhóm một
    lần, và vật trong suốt có transmission vẽ hai lượt: mỗi lần là một sợi.
  - **`limit(k)`:** chỉ vẽ k lần đầu của danh sách đã ghi, bỏ qua phần còn lại. So theo vật, material và lượt (khóa
    `object.id:material.id:passId`), không theo thứ tự: camera dời làm three sắp lại vật đục theo độ sâu, mà sợi đang xem vẫn là
    những vật ấy. `limit(null)` vẽ đủ và ghi lại danh sách ở mỗi khung. k là số nguyên ≥ 0, giá trị khác thì ném lỗi. Đang limit
    thì danh sách đứng yên (không ghi lại), để thanh không nhảy khi người xem dừng ở một sợi.
  - `renderer.info` chỉ về 0 ở nhịp rAF của renderer (`autoReset`), không ở mỗi `render()`: móc lấy hiệu số draw call từ lúc
    `begin()`. `scene.js` bọc mỗi `pipeline.render()` (cả lần vẽ lại khung đứng yên) bằng `begin()`/`end()`; công cụ không có hai
    hàm này.
  - **Chỗ danh sách chưa khớp three** (ghi ở đầu `draws.js`): lần vẽ mà three rồi tự bỏ bên trong `renderObject` (count 0, pipeline
    chưa biên dịch xong) vẫn được ghi; vật wireframe vẽ đoạn thẳng mà vẫn báo số tam giác của hình (Bức 1 gặp khi bật núm
    `wireframe` của Cốt); hai nhóm của một Mesh dùng chung một material thì chung một khóa; vật trong suốt DoubleSide không có
    transmission (`forceSinglePass` false): `renderObject` của three tự vẽ hai lần trong MỘT lần gọi móc, nên đó là một sợi cho hai
    draw call (lần thừa vào "các lượt khác"), và `limit(k)` giữ hay bỏ cả hai. Bức 1 không có material như thế.
- **Thanh điều khiển** (trong thanh công cụ, như Lột lớp):
  - Một `input type="range"` từ 0 tới N (N là số lần vẽ của lượt vẽ cảnh). Mở công cụ thì thanh ở N: ảnh không đổi gì. Nấc 0 là
    chưa vẽ gì: chỉ còn màu nền xóa khung (màu xóa của sân khấu, đen then), vẫn qua hậu kỳ.
  - Nút "Dệt lại" (`aria-pressed`) chạy từ 0 tới N, mỗi sợi khoảng 0,6 giây; cả lượt không quá chừng 12 giây, nên nhiều sợi thì đi
    nhanh hơn. Bấm lại thì dừng; kéo thanh cũng dừng.
    - (Dựng thử) Một bước không ngắn hơn 16 ms, nên quá 750 sợi thì mỗi bước đi `playStride(N) = ⌈N × 16 / 12000⌉` sợi, bước cuối
      đáp đúng N, mỗi bước `playStepMs(N)` ms: cả lượt vẫn chừng 12 giây (như khi bật "Tắt instancing" ở mức cao: 1.200 sợi thì
      mỗi bước 2 sợi, 20 ms).
    - Bước kế tiếp chỉ hẹn giờ khi khung trước đã vẽ lại xong, nên lần vẽ lại chậm lúc `?freeze` không làm các bước dồn lại (ở đó cả
      lượt dài hơn 12 giây). Vẽ lại hỏng thì "Dệt lại" dừng.
    - Lúc mới bật, móc chưa ghi khung nào: thanh là 0/0, dòng mô tả ghi "Đang đếm các lần vẽ…", và "Dệt lại" bị khóa (`disabled`);
      có danh sách thì nút mở và thanh đứng ở nấc N. Đang xem đủ khung thì cứ 250 ms (`POLL_MS`) đọc lại danh sách, thanh theo N mới
      (camera kéo làm vật ra khỏi khung, thí nghiệm thêm hàng trăm Mesh); chỉ ghi vào DOM khi có gì đổi, để trình đọc màn hình không
      đọc lại.
    - (Sau GĐ 5) Đếm quá 3 giây (`STALL_MS`: 12 nhịp đọc liền lúc tab đang hiện; tab ẩn không vẽ khung nào nên không tính) mà vẫn chưa
      thấy lần vẽ nào thì dòng mô tả và `aria-valuetext` đổi sang `t.tools['tung-soi'].stalled` ("Chưa thấy lần vẽ nào của cảnh. Tắt
      rồi bật lại Từng sợi, hoặc tải lại trang."), console cảnh báo một lần. Đang đếm dựa vào thứ tự `updateBefore` của lượt cuối
      (Phụ lục A.53): thứ tự ấy mà hỏng thì người xem không phải nhìn một dòng đứng mãi. Danh sách tới thì về như thường.
    - (Sau GĐ 5) Hộp đồ nghề không có móc (`api.draws` là `null`) thì `mount()` ném lỗi; `toolbox.js` bỏ riêng công cụ này kèm cảnh
      báo, nên thanh lớp không có nút Từng sợi mở ra một bảng trống.
  - Ô số "k/N" (`<output>`) đặt `aria-live="off"`: `<output>` ngầm là `role="status"` (vùng live polite), mà "Dệt lại" ghi số ở
    mỗi bước (40 ms với 300 sợi) sẽ làm ngập hàng đợi của trình đọc màn hình (Phụ lục A.68). Tiến độ tới người nghe qua
    `aria-valuetext` của thanh.
  - Dòng mô tả sợi đang xem: nhãn vật (`content.layers[id].objects[name]`; thiếu thì dùng tên vật), tên lớp, loại, số bản, số tam
    giác. Mặt nước thêm "Trước khi vẽ vật này, GPU vẽ lại {n} lần cho ảnh phản chiếu.". `aria-valuetext` = "Sợi k trên N: nhãn vật"
    ("Sợi 0 trên N: chưa vẽ gì" ở nấc 0). Số viết kiểu Việt (1.200).
  - Dòng tóm tắt khung: lượt vẽ cảnh {a} · phản chiếu {b} · các lượt khác (bóng, bloom, hậu kỳ) {c} draw call. {c} = tổng của
    `renderer.info` trừ hai số kia.
- **Điều Từng sợi dạy được, nói ngay trong dòng mô tả:**
  - Bóng đổ và ảnh phản chiếu là các lượt riêng, nên luôn đủ. Tới sợi của mặt nước, nước soi cả cảnh, dù các vật sau nó chưa được vẽ
    ở lượt chính.
  - Bật "Tắt instancing" thì mỗi lá nổi thành một sợi (hơn nghìn sợi ở mức cao, tối đa 1.200): thấy ngay vì sao instancing quan
    trọng.
- **Cử chỉ:** Từng sợi không giữ cử chỉ nào; chạm và chạm hai lần vẫn tới bức.
- **`?freeze`:** mỗi lần đổi sợi thì vẽ lại đúng khung N (`api.redraw()`).
- **Bức không biết gì:** Từng sợi chỉ nhìn `ToolApi.draws` (§8.4), chạy trên mọi bức, kể cả `_mau`.

### Núm của bức: thanh "giờ" của Bức 1 (`uHour`, 18.0 → 29.5, tức 05:30)
Đây là **Dial** do `paintings/ao-sen-dem/shared.js` khai báo. Xưởng chỉ vẽ thanh trượt (`ui/dials.js`, GĐ 4).
- **Điều khiển:**
  - Độ cao và phương vị của trăng: mọc phía đông lúc chạng vạng, cao nhất lúc nửa đêm, lặn phía tây trước khi sáng.
  - Dải màu trời: chạng vạng còn ấm ở chân trời, gần sáng thì chàm nhạt dần.
  - Màu sương, hướng và cường độ ánh trăng.
- **Mặc định:** `shared.js` gọi `tonight(ctx.now)` của `lib/astro/moon.js`, nhận `{ instant, isNight, evening }`.
  - Nếu là đêm: `uHour = hourOfNight(instant, evening)` (ví dụ 21 hoặc 26).
  - Nếu là ngày: `uHour = 21`, kèm ghi chú `daytime`.

  Cách quy đổi sang thang 18–29,5 và mặc định 21:00 là chính sách của Bức 1, không nằm trong hộp màu.
- (GĐ 4) **Khai báo:** `setup()` trả `dials: [{ id: 'gio', uniform: uHour, min: 18, max: 29.5, step: 0.25, format, note }]`.
  - `format(29.5)` trả `'05:30'`.
  - `note()` trả `'daytime'` khi đang là ban ngày **và** thanh giờ còn ở giá trị mặc định. Người xem kéo đi rồi thì thôi ghi chú.
  - Nhãn và ghi chú nằm ở `content.dials.gio`: `label: 'Giờ'` và `notes.daytime`.
- (GĐ 4) **Thứ mà giờ điều khiển, đúng như code:**
  - vị trí trăng và lối trăng (`setup.update`, có từ GĐ 1);
  - hướng ánh trăng và hướng bóng (Lớp 2);
  - dải màu trời (Lớp 3, có từ GĐ 3);
  - GĐ 4 thêm cường độ ánh trăng theo độ cao của trăng (Lớp 2), và màu sương ấm lúc chạng vạng, lúc gần sáng (Lớp 3).
- (GĐ 4) Kéo thanh giờ chỉ đổi `uHour.value`, không biên dịch lại. Khi `?freeze` đã dừng vòng lặp, xưởng vẽ lại bằng `update(0, t)`
  (§8.4), để trăng và bóng vẫn đi theo.

### Code sống (GĐ 2)
- Vite plugin `plugins/vite-plugin-code-view.js` (tự viết, nằm trong repo) biến import `?code` thành HTML đã highlight bằng **Shiki 4 lúc build**. Mỗi dòng mang `data-line`, và plugin kèm bảng tra `knobId → [dòng]`.
  - Module `?code` là `{ html, knobs }`. Theme Shiki làm từ bảng màu sơn mài (nền đen then, chữ ngà, từ khóa vàng lá…); mọi màu chữ đạt tương phản ≥ 4.5:1, test giữ.
  - `ui/code-view.js` là nơi DUY NHẤT dùng `import.meta.glob`: `paintings/*/layers/*.js`, `paintings/*/parts/*.js`, `engine/stock/*/layer.js`, trừ `_mau`. Glob không eager: mỗi file một chunk nhỏ, chỉ tải khi tab Chỉnh mở. Test hợp đồng kiểm mọi file trong `LayerMeta.files` của bức đã deploy đều nằm trong glob (`hasCode`).
  - Rê một núm: khung code chuyển sang file có marker của núm, làm sáng các dòng đó và chỉ cuộn RIÊNG khung code (cuộn cả Sổ tay sẽ kéo núm ra khỏi con trỏ).
- **Núm khai báo tĩnh (từ GĐ 0):** mỗi file lớp có `export const knobs = [...]`. Test đọc được danh sách này mà không cần GPU.
- **Marker (từ GĐ 0):**
  - Núm `uniform`: `// @knob <id>` ở dòng dùng uniform đó.
  - Núm `js`/`rebuild`: marker ở dòng xử lý `onKnob[id]`.

  Marker chỉ hợp lệ trong các file mà lớp sở hữu (`LayerMeta.files`). Id núm có phạm vi trong lớp. Địa chỉ đầy đủ `layerId.knobId` là API công khai.
- **Test (tĩnh):** trong các file của một lớp, tập marker phải bằng đúng tập `knobs.map(k => k.id)`.

### Bản dịch (GĐ 9)
- Sổ tay › Chỉnh có thêm nút "Bản dịch": mã shader thật (WGSL ở WebGPU, GLSL ở WebGL2) mà three dịch từ code TSL, ở mọi nơi lớp có
  mặt (vật của mọi lớp, và lượt cuối của hậu kỳ). Dòng có uniform của lớp sáng lên; rê một núm thì sáng dòng của núm đó. Chi tiết:
  §21.1, §21.3.

### Link công thức (GĐ 9)
- Mục "Công thức" của thanh lớp chép một link `#r=…` mang trọng số, núm và Dial khác mặc định; thanh địa chỉ tự mang công thức; mở
  link thì cảnh hiện thẳng theo công thức. Chi tiết: §21.2, §21.4.

### Huy hiệu và chế độ thợ
- **Huy hiệu:** hiện tầng thật và mức chất lượng, có `data-backend`. Chạm vào để xem giải thích bằng tiếng Việt.
- **`?debug` (GĐ 1):** `engine/gpu/debug.js` gọi `import()` động `three/addons/inspector/Inspector.js`. Không import tĩnh được, vì Inspector dùng `localStorage`.
- **`?debug=stats` (GĐ 1):** `import()` động `stats-gl`, `await stats.init(renderer)`, và mỗi khung gọi `renderer.resolveTimestampsAsync()`. Không bật cùng lúc với Inspector.

## 8. Kiến trúc

### 8.1 Ba vùng và cây thư mục
**Ba vùng:**
- **Xưởng** (`src/engine/` + `src/ui/`) không biết có bức nào.
- **Hộp màu** (`src/lib/`) là "lá": không import xưởng, không import tranh.
- **Các bức** (`src/paintings/<slug>/`) độc lập với nhau.

**Ký hiệu trong cây:** `[0]` là file có từ GĐ 0. `[0→4]` là file có từ GĐ 0 ở dạng thô và hoàn chỉnh ở GĐ 4. `[2]` là file xuất hiện từ GĐ 2.

```
son-mai-anh-sang/
  index.html                         [0→6] trang Bức 1: poster, tên, thơ, [data-seal], [data-badge], [data-static]; [1]: [data-moon]; [4]: poster.webp, thẻ og; [6]: link lật tranh
  tranh/den-keo-quan/index.html      [6] trang Bức 2 (§18), cùng khung với Bức 1; link lật tranh về Bức 1
  tranh/cung-que/index.html          [7] trang Bức 3 (§19); từ GĐ 7, mọi trang do scripts/pages.js sinh từ một khuôn
  tranh/dan-ga-me-con/index.html     [8] trang Bức 4 (§20)
  tranh/index.html                   [7] Phòng tranh: trang tĩnh sinh từ registry, không có script
  vite.config.js                     [0] base '/son-mai-anh-sang/'; input = các trang trong registry; tách chunk 'three'
  vitest.config.js playwright.config.js   [0]
  package.json .nvmrc .gitignore CLAUDE.md LICENSE   [0]
  README.md                          [0→8] GĐ 4 thêm mục "Thêm một bức tranh mới"; GĐ 5: tên vật + nhãn, chữ đi theo vật; GĐ 8: Bức 4, camera trực giao, bể hạt dùng chung, bảng bundle bốn bức
  .github/workflows/deploy.yml       [0] test → build → e2e → deploy Pages
  public/
    favicon.svg                      [0]
    paintings/ao-sen-dem/poster.svg  [0] poster tạm: SVG viết tay trong repo, ≤ 10 KB; GĐ 4 xóa (poster.webp thay)
    paintings/ao-sen-dem/poster.webp [4] poster thật ≤ 150 KB, chụp từ cảnh
    paintings/ao-sen-dem/og.jpg      [4] 1200×630, JPEG (bản đầu định PNG: grain làm PNG nặng gấp nhiều lần)
    paintings/den-keo-quan/          [6] poster.webp + og.jpg của Bức 2, chụp từ cảnh bằng scripts/poster.js
    paintings/cung-que/              [7] poster.webp + og.jpg của Bức 3
    paintings/dan-ga-me-con/         [8] poster.webp + og.jpg của Bức 4 (khung 240 của meta.poster.capture)
  plugins/
    vite-plugin-code-view.js         [2] import '?code' → HTML Shiki có data-line + bảng knobId → dòng
  scripts/
    poster.js                        [4] Playwright chụp ?at&freeze=N&poster cho một slug (GPU thật); mã hóa WebP/JPEG ngay trong trang
    pages.js                         [7] npm run pages: viết trang của mọi bức và Phòng tranh từ registry
    e2e-groups.js                    [7] nhóm e2e theo bức cho CI (ma trận job)
  src/
    engine/                          XƯỞNG: không biết bức nào tồn tại
      boot.js                        [0→5] khởi động một bức: cờ URL → tầng → tĩnh | import('./gpu/run.js'); GĐ 5: báo mốc 'chunk' cho quầng trăng; export BOOT_DEADLINE_MS (chặng đầu của quầng bò đúng bằng nó); GĐ 9: đọc `#r=` (readRecipe), đưa vào run và showStatic
      flags.js                       [0→3] đọc cờ URL (§8.7), hàm thuần; GĐ 3: ?level
      recipe.js                      [9] công thức `#r=`: đọc, ghi chuỗi (hàm thuần, đường nhẹ; §21.4)
      tier.js                        [0] dò tầng A/B/C, hàm thuần nhận env
      quality.js                     [0→4] GĐ 0: chọn mức, mức mặc định, isMobile; GĐ 3: bộ điều chỉnh có trễ; GĐ 4: bộ điều chỉnh tách ra tuner.js
      tuner.js                       [4] bộ điều chỉnh có trễ (hàm thuần, không three): nhịp rAF, và ms GPU/CPU khi đo được
      palette.js                     [0] 10 token; ghép phần ghi đè của bức (hàm thuần, không three)
      deadline.js                    [0] withDeadline(): hạn 10 s cho khởi động (hàm thuần)
      sma.js                         [0→5] window.__sma: state, tier, backend, level, frames, reason; GĐ 2: expose() (GĐ 4 chỉ thêm hàm qua expose); GĐ 5: readouts(layerId); GĐ 9: recipe(), applyRecipe(text), translate(layerId)
      static.js                      [0→2] tầng C theo lý do; GĐ 2: Sổ tay chỉ đọc (import() động ui/workshop.js); GĐ 9: câu thêm khi link có công thức
      contracts/painting.js          [0→8] JSDoc hợp đồng NHẸ; GĐ 4: Poster.capture; GĐ 5: PaintingContent.captions, LayerContent.objects; GĐ 8: LayerMeta.files kê được lib/tsl
      contracts/runtime.js           [0→8] JSDoc hợp đồng NẶNG; GĐ 4: update(0, t), Gesture 'hover'/pointer, ToolInstance.activate, Studio, Snapshot.dials; GĐ 5: Gesture 'double-tap', EngineCtx.captions, ToolApi.draws; GĐ 8: CameraSpec.kind, height, minWidth, shortFrame, zoom, home
      gpu/                           PHẦN NẶNG: chỉ tải ở tầng A/B
        run.js                       [0→5] vòng đời: dựng → compileAsync → khung ẩn → hòa dần → chạy → gỡ; GĐ 2: mất GPU lần đầu → dựng lại; GĐ 4: bộ điều chỉnh đo từ lúc live; GĐ 5: bringUp kiểm gone() trước việc đầu tiên và sau mỗi lần chờ ("Dựng lại cảnh" quá hạn không đụng trang đã về tĩnh), sự kiện GPU đến khi trang đã tĩnh thì bỏ qua (không có code nào của quầng trăng); GĐ 9: trang mở có công thức thì mở xưởng không mài, kèm dòng tóm tắt; gắn recipe-url lúc live
        scene.js                     [2→8] dựng MỘT cảnh trên một sân khấu (ctx → setup → lớp → pipeline → input → bàn thợ) + một khung; GĐ 4: đồ nghề, Dial, đo GPU, vẽ lại bằng update(0, t); GĐ 5: chữ đi theo vật, móc lần vẽ; GĐ 8: stage.returnHome(dt) mỗi khung, sau breathe, trước controls.update(); bức đã nhận 'hold-start' thì luôn nhận 'hold-end' (công cụ bật giữa chừng không giữ mất nó); bộ điều chỉnh tách ra scene-quality.js
        scene-quality.js             [8] bộ điều chỉnh của một cảnh (tách từ scene.js): nối tuner, thang nấc và bộ đo GPU; scene.quality; GĐ 9: khung bị giữ (hold.js) thì bỏ khung, thôi giữ thì đo lại từ đầu
        ladder.js                    [3] thang nấc cụ thể: 'dpr' nở thành nhiều nấc −0,25; '<lớp>.<nấc>' lấy từ layer.degrade
        stage.js                     [0→8] renderer, nền đặc, camera + OrbitControls theo CameraSpec, đồng hồ, resize, DPR, lỗi GPU; GĐ 4: trackTimestamp; GĐ 8: camera trực giao (CameraSpec.kind), stage.camera là getter
        disposer.js                  [0] đăng ký mọi thứ đã tạo, gỡ theo thứ tự ngược
        guards.js                    [0] bộ đếm lỗi thuần của vòng lặp (3 khung lỗi liên tiếp, 3 lỗi GPU trong 1 giây), chốt báo bù sự kiện một lần (mất thiết bị)
        pipeline.js                  [0→8] scene pass + MRT; build → renderOutput → display; alpha 1; views(); overlay; GĐ 8: độ sâu tuyến tính chọn theo loại camera; GĐ 9: compile() chạy trong lúc giữ khung (sửa Normal lúc cảnh đang chạy)
        views.js                     [4→8] danh sách view (kênh, tap, Normal lười), ghép overlay của công cụ, requireView; GĐ 5: scene pass đứng đầu lượt cuối (móc lần vẽ thấy lượt vẽ cảnh); GĐ 8: view Độ sâu dùng độ sâu của pipeline (linearDepth, bắt buộc)
        gpu-timer.js                 [4] ms GPU mỗi khung: resolveTimestampsAsync (render + compute), không chờ, không gọi chồng
        meter.js                     [4] số đo của bàn thợ: draw call, tam giác, ms, ms CPU, ms GPU; hai bên "Tắt / Bật" của compare
        toolbox.js                   [4→5] hộp đồ nghề: gắn công cụ, cử chỉ tới công cụ trước bức, mỗi lúc một công cụ, body[data-tool]; GĐ 5: ToolApi.draws (năm hàm của móc), thanh công cụ ngay sau thanh lớp (thứ tự Tab)
        draws.js                     [5→9] móc lần vẽ cho Từng sợi (setRenderObjectFunction): ghi danh sách lần vẽ của lượt vẽ cảnh, chỉ vẽ k lần đầu; tắt thì gỡ móc; GĐ 9: capture() bắt mã shader của RenderObject đang vẽ (Bản dịch: chỗ duy nhất đọc _objects, _currentRenderContext), móc gắn khi Từng sợi bật hay còn lần bắt chờ; dispose() khi gỡ cảnh
        draw-info.js                 [9] hàm thuần của DrawInfo (loại vật, số bản, số tam giác) và chỗ DrawInfo chưa khớp three, tách từ draws.js
        caption-set.js               [5] chữ đi theo vật: tra content.captions, chiếu điểm neo ra màn hình mỗi khung, hết giờ theo đồng hồ của cảnh
        dial-set.js                  [4] Dial của bức: đọc/ghi (kẹp min/max/step), chữ giá trị, ghi chú, snapshot
        recipe-set.js                [9] công thức của một cảnh: mặc định của máy đang xem, phân loại khóa, khác biệt, tóm tắt
        recipe-url.js                [9] thanh địa chỉ mang công thức: replaceState gộp 500 ms, hashchange
        translate.js                 [9] bản dịch: nơi lớp có mặt, theo thứ tự phủ, từ mã của MỘT khung vẽ thật (draws.capture(); không getShaderAsync, không giữ khung)
        hold.js                      [9] giữ khung: việc async chạy với target của lượt khác đang đặt thì cảnh không vẽ (biên dịch lại giữa chừng: view Normal)
        clock.js                     [3→4] đồng hồ + trần 60 khung/giây; GĐ 4: màn ≤ ~63 Hz không bị bỏ khung nào
        layers.js                    [0→5] trọng số (GĐ 2: tween), createCtx, dựng lớp theo thứ tự + nối onKnob, lưới an toàn emissive; GĐ 5: ctx.captions
        knob-set.js                  [2→4] bộ núm của một lớp: uniform có tên hợp lệ, giá trị đã chuẩn hóa, get/set/values, onKnob; GĐ 4: kiểm trần do max() trả; GĐ 9: giá trị ban đầu từ công thức
        studio.js                    [2→4] bàn thợ: API duy nhất cho Sổ tay và __sma (trọng số, núm, thí nghiệm, số đo, snapshot); GĐ 3: compare, ms CPU, nấc; GĐ 4: công cụ, Dial, ms GPU; GĐ 9: translation, recipe, applyRecipe, reset, onChange
        input.js                     [1→4] pointer → cử chỉ + tia; công cụ trước, bức sau; 'drag' cho camera; GĐ 4: 'hover' (chuột, chỉ công cụ), g.pointer
        debug.js                     [1→2] ?debug → Inspector; ?debug=stats → stats-gl (import động); GĐ 2: openDebug không bao giờ ném
        gesture.js                   [1→5] phân loại cử chỉ (hàm thuần): tap / hold-* / swipe; kéo là của camera; GĐ 5: double-tap
        breath.js                    [1] camera "thở": breathAmplitude, breathOffset (hàm thuần)
        camera.js                    [8] dựng camera theo CameraSpec (phối cảnh hay trực giao), khớp khung, giới hạn OrbitControls; phần tính của stage.js tách ra để unit test
        fov.js                       [7→8] fitFov: nới fov dọc ở khung hẹp (minHorizontalFov); GĐ 8: fitOrtho cho camera trực giao (minWidth, shortFrame)
        home.js                      [8] tranh tự khép lại (CameraSpec.home): đếm giờ đứng yên, quay về góc của bức; phần tính là hàm thuần; đặt dampingFactor theo giây của cảnh (Phụ lục A.98)
      stock/phu-bong/                LỚP DÙNG CHUNG "Phủ bóng"
        meta.js                      [0] { id: 'phu-bong', name: 'Phủ bóng', files } (dữ liệu thuần)
        layer.js                     [0→4] build: bloom chọn lọc + tone (GĐ 2: chọn bằng If, đủ núm); GĐ 4: display (LUT, grain, vignette, FXAA) + tap
        display.js                   [4] chặng display: LUT, grain, vignette, FXAA (trộn theo trọng số) + thí nghiệm "Tắt FXAA"
        lut.js                       [4] LUT 32³ sinh từ bảng màu đã ghép (phần tính màu là hàm thuần)
        content.vi.js diagram.svg    [2] Hiểu/Phá/nhãn, viết trung tính; sơ đồ import '?raw'
      tools/
        index.js                     [4→5] [kinhMai, lotLop, tungSoi]; thêm công cụ = thêm 1 dòng
        kinh-mai.js                  [4→5] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ; GĐ 5: kính tròn giữ cả double-tap của ngón tay, bút
        lot-lop.js                   [4] overlay (If trong Fn) + thanh điều khiển (ui/dom.js) + cử chỉ
        pick.js                      [4→8] chọn một view theo chỉ số bằng If/ElseIf (hai công cụ dùng chung); GĐ 8: mỗi view bọc isolate() không cache cha (Phụ lục A.95)
        tung-soi.js                  [5] Từng sợi: thanh trượt 0 → N lần vẽ, nút "Dệt lại", dòng mô tả sợi và tóm tắt khung; chỉ nhìn ToolApi.draws
    lib/                             HỘP MÀU: hàm "lá", trả số (astro, random) hay node TSL (tsl/); không import xưởng hay bức
      random.js                      [0] PRNG có hạt giống (mulberry32)
      astro/lunar.js                 [0] âm lịch Hồ Ngọc Đức (tz tham số, mặc định +7); canChiIndex
      astro/moon.js                  [0] tuổi trăng, độ sáng, tonight(), hourOfNight(), sunDirection()
      tsl/noise.js                   [1] fbm; [3] thêm curl, và fbm nhận số octave là node (vòng lặp thật trong shader)
      tsl/particles.js               [8] bể hạt compute (Bức 1 và Bức 4): cấp phát một lần, khởi tạo, bước, đổi số lượng, rắc theo vòng đệm
    ui/                              DOM thuần: không three, không import engine/; nhận t qua tham số
      strings.vi.js                  [0→5] export default t: chữ của xưởng, bảng tên tháng/can/chi, formatSeal(); GĐ 4: t.tools, t.views, ms GPU, nấc khóa; GĐ 5: t.tools['tung-soi']; GĐ 9: t.translation, t.recipe
      shell.js                       [0→5] poster ↔ canvas, data-state, con dấu, hòa dần; [1]: gợi ý, lời mời "{n} lớp"; [4]: ?poster (body[data-poster]); [5]: progress(mốc) → quầng trăng
      badge.js                       [0→4] huy hiệu tầng + mức, data-backend; GĐ 3: "hạ {n} nấc", data-steps; GĐ 4: nấc bị khóa
      moon-svg.js                    [1] vẽ trăng đúng pha vào [data-moon] nếu trang có ô đó
      moon-progress.js               [5] quầng trăng tiến độ trong [data-moon]: HALO_STEPS (mốc → đích, số giây bò), CSS transition, tan khi hòa dần (CROSSFADE_MS); vòng vẽ ở tọa độ gấp 100 (r 105, rotate(-90) scale(0.01), pathLength 1)
      captions.js                    [5] DOM của chữ đi theo vật: một vùng aria-live phủ lên canvas, mỗi lúc một dòng (câu + nguồn); giữ chữ trong màn hình và trên chân khung; CAPTION_SECONDS, CAPTION_FADE
      workshop.js                    [2→5] thanh lớp + Sổ tay + chế độ mài; nhận studio() (null ở tầng tĩnh: chỉ đọc); GĐ 4: Đồ nghề + Dial, đóng thì tắt công cụ; GĐ 5: thanh lớp ngay trước, Sổ tay ngay sau thanh công cụ (thứ tự Tab)
      layer-rail.js notebook.js notebook-pages.js code-view.js dom.js   [2]; GĐ 3: notebook-pages.js vẽ hai cột "Tắt / Bật" của compare; GĐ 4: ms GPU; GĐ 8: code-view.js hiện cả lib/tsl; GĐ 9: code-view.js có nút Bản dịch
      knobs.js                       [2] Tweakpane; chỉ được import() động khi tab Chỉnh mở lần đầu
      dials.js                       [4] thanh trượt cho các Dial của bức
      rail-tools.js                  [4] mục "Đồ nghề" (nút aria-pressed của từng công cụ) + Dial, trong thanh lớp
      recipe-panel.js                [9] mục "Công thức" của thanh lớp (chép link) + dòng tóm tắt và "Về nguyên bản"
      translation-view.js            [9] khung Bản dịch trong tab Chỉnh: Vật, Đỉnh/Điểm ảnh, dòng trạng thái, mã
      shader-text.js                 [9] tô màu WGSL/GLSL, đánh dấu uniform của lớp (hàm thuần)
    styles/ tokens.css shell.css     [0→5] (GĐ 5: khung chữ một cột; quầng trăng cạnh trăng)   notebook.css [2→5] (shell.css @import; GĐ 5: --rail-w, --notebook-w)   tools.css [4→5] thanh công cụ, kính, tay nắm gạt, Đồ nghề; GĐ 5: bảng công cụ không nằm dưới thanh lớp hay Sổ tay, Sổ tay thu lại dưới 1240px   captions.css [5] chữ đi theo vật   gallery.css [7] Phòng tranh
    paintings/
      registry.js                    [0] SITE + [{ meta, page, lang }]. Node đọc được; trình duyệt KHÔNG import
      _mau/                          [2→5] tranh mẫu 2 lớp (Cốt + Tô màu), KHÔNG deploy: fixture cho test + khuôn để copy; GĐ 5: tên vật + nhãn
      ao-sen-dem/                    BỨC 1
        meta.js                      [0→8] căn cước + fence (từ vựng của bức); GĐ 4: poster.webp, poster.capture, og; GĐ 5: files của lớp Ánh trăng có thêm hai parts; GĐ 8: files của Vàng lá kê lib/tsl/particles.js
        index.js                     [0] cửa vào nhẹ: export default { meta, load, content }
        painting.js                  [0→4] layers[], camera, quality, setup()
        shared.js                    [1→5] giờ (Dial 'gio'), ripples[8], rippleHeight(), moonDir, wind, onGesture; GĐ 3: swirl (vuốt → sương xoáy); GĐ 4: dials; GĐ 5: chạm hai lần → thả hoa đăng (vòng đệm) + chữ
        quality.js                   [3→5] bảng cao/vừa/thấp của bức + ladder; GĐ 5: lanterns
        content.vi.js                [1→5] gợi ý (GĐ 1); Hiểu/Phá/Đọc thêm, nhãn tra theo id (GĐ 2); GĐ 4: dials.gio; GĐ 5: gợi ý mới, nhãn vật, captions
        content.captions.vi.js       [5] thơ của hoa đăng (content.vi.js import vào captions; tách riêng để content.vi.js dưới 300 dòng)
        layers/l1-cot.js             [0→5] GĐ 0: lá instanced thô + đèn xưởng; GĐ 5: tên vật
        layers/l2-anh-trang.js       [1→5] GĐ 5: hoa đăng (parts/anh-trang-lantern.js dựng và vẽ, parts/anh-trang-drift.js hàm thuần)
        layers/l3-suong.js           [3→5] vòm trời + sương là là; GĐ 5: hoa đăng mờ trong sương. parts/suong-troi.js [3→5] (GĐ 5: tên vật), parts/suong-mu.js [3]
        layers/l4-mat-nuoc.js        [0→5] GĐ 0: đĩa nước + reflector thô; GĐ 3: phản chiếu giả ở mức thấp; GĐ 5: hoa đăng nhấp nhô, vũng sáng quanh đèn
        layers/l5-vang-la.js         [0→8] GĐ 0: sprite compute thô; GĐ 3: curl, biến thể CPU (parts/vang-la-cpu.js), luật chung của đàn và Sprite (parts/vang-la-dan.js); GĐ 5: tên vật; GĐ 8: bể hạt của lib/tsl/particles.js, mã shader giống bản ghi
        parts/cot-leaf.js            [1→2] của lớp Cốt (lá); GĐ 2: cấp phát theo trần, ghi lại
        parts/cot-{flower,reeds}.js  [1→5] của lớp Cốt (hoa nở bằng uniform, cuống + lau); GĐ 2: cấp phát theo trần, ghi lại; GĐ 5: tên vật
        parts/cot-lab.js             [2→5] của lớp Cốt: thí nghiệm "Tắt instancing", đếm đỉnh; GĐ 5: tên vật (Group của các Mesh rời)
        parts/anh-trang-moon.js      [1→5] của lớp Ánh trăng (trăng); GĐ 5: tên vật
        parts/anh-trang-paint.js     [1] của lớp Ánh trăng (chất liệu)
        parts/anh-trang-shadow.js    [3] của lớp Ánh trăng: khung chiếu bóng ôm sát ao theo hướng trăng; shadow map chỉ vẽ lại khi cần
        parts/mat-nuoc-gia.js        [3] của lớp Mặt nước: phản chiếu giả ở mức thấp (màu trời theo hướng phản xạ + đĩa trăng)
        parts/anh-trang-lantern.js   [5] của lớp Ánh trăng: một InstancedMesh cho đèn ở bờ và mọi hoa đăng; mỗi khung ghi ma trận, tâm, độ sáng; pool cho lớp Mặt nước
        parts/anh-trang-drift.js     [5] của lớp Ánh trăng, hàm thuần (chỉ import lib/random.js): vòng đệm N + 1 ô, lanternAt theo thời gian, driftDirection, verseOrder
        diagrams/*.svg               [2] sơ đồ của tab Hiểu (content.vi.js import '?raw')
      den-keo-quan/                  BỨC 2 (GĐ 6, §18): cùng khuôn với Bức 1
        meta.js index.js painting.js quality.js shared.js content.vi.js   [6] căn cước (+ fence, palette: lua, giayDo); setup: trống, lửa, cử chỉ
        layers/l1-cot.js             [6] gian nhà, đèn, trống cắt theo mặt nạ; parts/cot-phong.js, cot-den.js (cylinderExit, planeCross), cot-trong.js (trống, chong chóng), cot-hinh-nhan.js (mặt nạ, hàm thuần), cot-doan-quan.js (tám hình nhân, dữ liệu thuần)
        layers/l2-ngon-nen.js        [6] PointLight + node bóng giữ chỗ, ngọn lửa; parts/ngon-nen-lua.js, ngon-nen-thoi.js (nhấp nháy, thổi; hàm thuần)
        layers/l3-gian-nha.js        [6] texture thủ tục: gạch, vôi, gỗ, sơn son; parts/gian-nha-vat-lieu.js
        layers/l4-giay.js            [6] ánh sáng xuyên giấy, lọc màu vào node bóng
        layers/l5-keo-quan.js        [6] gobo (parts/keo-quan-gobo.js), "Shadow map thật" (parts/keo-quan-that.js), trống quay (parts/keo-quan-quay.js, hàm thuần)
        diagrams/*.svg               [6] sơ đồ của tab Hiểu
      cung-que/                      BỨC 3 (GĐ 7, §19): khối bao dò tia SDF; lớp cot, mat-troi, bong-mem, anh-dat, la-da, phu-bong
      dan-ga-me-con/                 BỨC 4 (GĐ 8, §20): cùng khuôn với các bức trước
        meta.js index.js painting.js quality.js shared.js content.vi.js   [8] căn cước (+ fence, palette: năm màu Đông Hồ, hex in là màu vào ACES); painting: Phủ bóng ghi đè mặc định (ACES, lộ sáng 1,2, bloom 0,5); setup: đàn gà, cử chỉ
        layers/l1-cot.js             [8] tờ giấy cong, gà mẹ, gà con; parts/cot-giay.js, cot-hinh-ga.js, cot-bo-cuc.js (bố cục và góc nhìn của tranh, dữ liệu thuần)
        layers/l2-ban-mau.js         [8] màu in, chia nấc; parts/ban-mau-bang.js
        layers/l3-ban-net.js         [8] dò cạnh trên độ sâu (post), nét trong, lệch bản; parts/ban-net-do-canh.js, ban-net-net-trong.js
        layers/l4-giay-diep.js       [8] sợi dó, vệt chổi, hạt điệp; parts/giay-diep-mat.js
        layers/l5-dan-ga.js          [8] thóc (bể hạt của lib/tsl/particles.js), đàn gà; parts/dan-ga-thoc.js (luật thóc, TSL); dan-ga-song.js, dan-ga-pha.js, dan-ga-duong.js, dan-ga-cho.js, dan-ga-ke.js (đàn gà dạng đóng, hàm thuần, shared.js dựng)
        diagrams/*.svg               [8] năm sơ đồ của tab Hiểu: truc-giao, chia-nac, lech-mat-phang, hat-diep, vong-dem
  tests/
    unit/                            [0] flags tier quality palette tokens-css random lunar moon strings deadline disposer layers source
                                     [4] tuner gpu-timer lut views toolbox kinh-mai lot-lop dial-set dials rail-tools poster
                                     [5] gesture (double-tap) captions caption-set draws tung-soi moon-progress shell-halo run (vòng đời của run(), jsdom)
                                     [8] camera (createCamera, fitCamera, limitControls), home, particles (bể hạt), fov (fitOrtho); thêm vào pipeline (linearDepth, isolate của pick.js), input và caption-set (camera trực giao), scene (returnHome)
    paintings/ao-sen-dem/            [1→8] test của từng lớp Bức 1 (dựng cả bức bằng buildPainting); GĐ 5: anh-trang-drift (hàm thuần), tha-hoa-dang (chạm hai lần); GĐ 8: vang-la-ma (mã shader của đom đóm so với __fixtures__/vang-la/, không bao giờ ghi lại)
    paintings/den-keo-quan/          [6] test của từng lớp Bức 2 (khung, ngon-nen, gian-nha, giay, keo-quan); cot-hinh-nhan, keo-quan-quay, ngon-nen-thoi (hàm thuần); cử chỉ; chữ; quality
    paintings/cung-que/              [7] test của từng lớp Bức 3 (cot, mat-troi, bong-mem, anh-dat, la-da); the-gioi, cot-cay-bay; chữ; quality
    paintings/dan-ga-me-con/         [8] test của từng lớp Bức 4 (cot, ban-mau, ban-net, giay-diep, dan-ga, phu-bong); cot-bo-cuc, cot-hinh-ga; đàn gà dạng đóng (dan-ga-song, dan-ga-duong, dan-ga-tranh-me, dan-ga-muot); dan-ga-thoc (bản JS của luật, khóa bằng __fixtures__/thoc/); cử chỉ (cu-chi); chữ; quality
    rules/imports.test.js            [0→8] luật ranh giới, đường nhẹ, hàng rào từ vựng; GĐ 5: phần nhẹ không gọi built-in ES2022 trở lên (Safari 14); GĐ 8: tự kiểm hàng rào bắt từ của Bức 4, không bắt denThen hay grain
    rules/files.test.js              [0→9] dòng 1 là chú thích, số dòng, API cấm; GĐ 5: chỉ draws.js đặt móc lần vẽ; GĐ 9: chỉ draws.js đọc _objects, _currentRenderContext của renderer, không file nào gọi getShaderAsync
    rules/e2e.test.js                [7→8] describe của spec riêng bắt đầu bằng "{tên bức} · "; nhóm e2e của CI; GĐ 8: gom cả spec tách file theo slug dài nhất, đếm test mang tag khói trên mọi file của bức
    scripts/pages.test.js main-guard.test.js   [7] trang sinh ra khớp từng byte trang trên đĩa; script chạy trực tiếp nhận ra mình là module chính
    paintings/html.test.js           [0] trang HTML của mỗi dòng registry khớp meta (JSDOM, không chạy script)
    paintings/contract.test.js       [0→8] lặp qua registry (+ _mau từ GĐ 2); GĐ 4: mức cùng bộ khóa, Dial, nhãn tap, poster/og; GĐ 5: captions, files của lớp kê đủ parts/ mà lớp import; GĐ 8: CameraSpec theo loại (trực giao cần height > 0), file lib/tsl được kê thì lớp phải import
    paintings/objects.test.js        [5] tên vật: mọi vật trong layer.objects có name kebab-case, không trùng trong lớp, có nhãn; không nhãn thừa (mức cao, thấp, lúc bật từng thí nghiệm)
    paintings/captions-rule.test.js  [5] luật của content.captions tự kiểm (bắt được mục sai, nhận mục đúng)
    helpers/source.js                [0] phân tích mã bằng parseSync của vite
    helpers/fake-ctx.js              [1→8] Scene/Camera/uniform thật, renderer giả (Proxy ghi lời gọi); dựng ctx bằng createCtx của xưởng; GĐ 5: captions giả (ghi lời gọi); GĐ 8: buildPainting dựng camera theo painting.camera (engine/gpu/camera.js)
    helpers/svg.js                   [2] đọc mã màu trong SVG (poster, sơ đồ)
    helpers/image.js                 [4] đọc cỡ ảnh WebP, JPEG từ phần đầu file (poster, og)
    helpers/final-pass.js            [5] dựng ảnh cuối như three dựng lượt cuối (WGSLNodeBuilder thật, chặng setup): thứ tự updateBefore, thân Fn của views.js
    helpers/paintings.js             [5] ALL: mọi dòng registry và _mau, kèm cửa vào đã nạp (contract, objects lặp qua đây)
    helpers/caption-rules.js         [5] captionErrors: luật của content.captions (test hợp đồng dùng, captions-rule.test.js tự kiểm)
    helpers/kebab.js                 [5] KEBAB: kebab-case không dấu (slug, id lớp, id Dial, khóa chữ, tên vật)
    helpers/nodes.js                 [5→8] nodesOf, compileMaterial: soi đồ thị node; dịch material ra WGSL/GLSL bằng builder thật, có render target + MRT như scene pass; GĐ 6: nạp đèn, bật shadow map, trả tên uniform shader đọc; GĐ 8: compileCompute (dịch compute node), normalizeIds (số id của node trong bản ghi mã shader), compileMaterial trả cả uniformNodes
    helpers/rays.js                  [5] tia thẳng đứng xuống mặt nước cho test cử chỉ của bức
    helpers/page.js                  [0] khung trang tối thiểu (đủ các ô mà xưởng điền vào) trong document của jsdom
  e2e/
    helpers.js                       [0→6] chờ trạng thái, đọc pixel canvas (screenshot), báo GPU; GĐ 5: doubleTapAt (chạm hai lần phát ngay trong trang), điểm sáng ấm (warm); GĐ 6: tapAt, swipeAt, màu trung bình (rgb) của vùng
    painting.spec.js                 [0→8] lặp qua registry: tĩnh, WebGL2, WebGPU; GĐ 3: hạ hết nấc rồi nâng lại; GĐ 4: mài về cốt, Kính mài, Lột lớp, ?poster; GĐ 5: Từng sợi, quầng trăng, chỗ của bảng công cụ (1280/1240/1440, 1024); GĐ 8: Lột lớp cho "Trước tone" trùng "Trước bloom" khi và chỉ khi không có gì phát sáng
    ao-sen-dem.spec.js               [1→5] chạm mặt nước thì ảnh đổi (so ở cùng ?freeze=N); GĐ 3: vuốt, draw call, ?level=thap, CPU vs GPU; GĐ 4: thanh giờ, vuốt → sương xoáy; GĐ 5: thả hoa đăng, draw call khi có đèn
    den-keo-quan.spec.js             [6] bóng chạy theo ?freeze, mài Kéo quân/Giấy, ngọn nến, gạch bát, giấy trong suốt, thổi/giữ/vuốt, draw call, ?level=thap, "Shadow map thật" (§18.8)
    cung-que.spec.js                 [7] Bức 3: khối bao dò tia ghi độ sâu và pháp tuyến của hình SDF, pha trăng, bóng, ánh đất, cử chỉ, lá đa, thí nghiệm, chất lượng (§19.9); tag khói @khoi
    dan-ga-me-con.spec.js            [8] Bức 4: tờ tranh ở góc nhìn của tranh, độ sâu của camera trực giao, Bản nét (viền, nét trong, lệch bản, mép khung, hai thí nghiệm), chữ trên ván tối, tranh tự khép lại (§20.9)
    dan-ga-me-con-giay.spec.js       [8] Giấy điệp: vách ngà, hạt điệp (view Chỉ emissive), Giấy dó trơn, trọng số lệch nhau
    dan-ga-me-con-dan-ga.spec.js     [8] Đàn gà (live, poll theo số đo): chạm rắc thóc, giữ gọi con, mài về 0 khi thóc đang rơi
    dan-ga-me-con-chat-luong.spec.js [8] chất lượng: draw call ở mức cao, ?level=thap, bật rồi tắt mọi thí nghiệm
    dan-ga-me-con.helpers.js         [8] dùng chung cho bốn spec của Bức 4 (vùng của canvas, tag khói SMOKE, mở trang, Lột lớp về một view, số đo goc); không phải file test
    lat-tranh.spec.js                [6→8] tầng tĩnh: đi qua lại giữa hai bức bằng link lật tranh; ?poster ẩn link; GĐ 7: link Phòng tranh, Bức 2 ⇄ Bức 3; GĐ 8: Bức 3 ⇄ Bức 4
    phong-tranh.spec.js              [7] Phòng tranh: trang tĩnh liệt kê đủ các bức theo thứ tự, bấm thì tới đúng trang, không script, axe không có lỗi serious/critical
    a11y.spec.js                     [4→5] axe-core (@axe-core/playwright): tĩnh, 3D có thanh lớp + Sổ tay, công cụ đang bật; đi hết bằng bàn phím; GĐ 5: chữ đi theo vật, Từng sợi, đường Tab từ nút Từng sợi
```

### 8.2 Luật hướng phụ thuộc (test giữ)

| Từ ↓ được import → | `three*` | npm khác | `lib/` | `engine/*.js` (nhẹ) | `engine/stock/` | `engine/gpu`, `tools` | `ui/` | `paintings/` |
|---|---|---|---|---|---|---|---|---|
| `lib/` | chỉ `lib/tsl` | ✘ | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ |
| `engine/*.js`, `contracts/` | ✘ | ✘ | `astro`, `random` | ✔ | ✘ | chỉ `import()` động (boot.js) | ✔ | ✘ |
| `engine/gpu/`, `engine/tools/` | ✔ | chỉ `import()` động: `stats-gl`, inspector | ✔ | ✔ | ✘ | ✔ | ✔ (`knobs.js` chỉ `import()` động) | ✘ |
| `engine/stock/<id>/` | ✔ | ✘ | ✔ | ✘ (màu qua `ctx.palette`, kiểu qua JSDoc `import()`) | chỉ thư mục mình | ✘ | ✘ | ✘ |
| `ui/` | ✘ | chỉ `ui/knobs.js` → `tweakpane` | `astro` | ✘ | ✘ | ✘ | ✔ | ✘ |
| `paintings/<slug>/` | ✔ | ✘ | ✔ | ✘ (kiểu qua JSDoc `import()`) | ✔ | ✘ | ✘ | **chỉ thư mục mình** |
| `paintings/registry.js` | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | chỉ `*/meta.js` |

**Các luật kèm theo** (`tests/rules/imports.test.js`):
- **Ngoại lệ glob:** `ui/code-view.js` (GĐ 2) được glob `?code` trên `paintings/*/` (trừ `_mau`) và `engine/stock/`. `import.meta.glob` chỉ được dùng ở đó, và luôn kèm `?code`.
- **(GĐ 5) Móc lần vẽ:** chỉ `engine/gpu/draws.js` được gọi `setRenderObjectFunction` (`tests/rules/files.test.js` quét sau khi bỏ chú
  thích). Một móc thứ hai ở chỗ khác sẽ âm thầm đè móc của Từng sợi, hay bị Từng sợi đè.
- **(GĐ 9) RenderObject đang vẽ:** chỉ `engine/gpu/draws.js` được đọc `_objects` và `_currentRenderContext` của renderer (Bản dịch bắt lúc
  vẽ, §21.3; test ghim với three 0.186.1); không file nào trong `src/` gọi `getShaderAsync` (Phụ lục A.102: nó không trả mã đang chạy).
- **`@fontsource/*`** chỉ được import từ file `.css`.
- **Chữ giao diện:** không file nào trong `src/` import `ui/strings.*.js`.
  - Chỉ trang HTML import file đó, rồi truyền `{ lang, t }` vào `boot`.
  - `engine/`, `ui/` và `tools/` nhận `t` qua tham số.
- **Đường nhẹ (danh sách cho phép):**
  - Bao đóng import **tĩnh** bắt đầu từ `engine/boot.js` và từng `paintings/*/index.js` chỉ được chứa file thuộc `engine/*.js`, `engine/contracts/`, `engine/stock/*/meta.js`, `ui/` (trừ `knobs.js`), `lib/astro/`, `lib/random.js`, và `paintings/<slug>/{index,meta}.js`.
  - Mọi specifier trần (gói npm) là lỗi.
  - Đây là bằng chứng cho yêu cầu poster dưới 1 giây.
  - (GĐ 5) Đường nhẹ chạy cả trên trình duyệt cũ của tầng tĩnh: bao đóng tĩnh của các gốc ấy không được gọi built-in từ ES2022 trở
    đi (`Object.hasOwn`, `.at()`, `findLast`/`findLastIndex`, `toSorted`/`toReversed`/`toSpliced`, `Object.groupBy`/`Map.groupBy`,
    `Promise.withResolvers`), và cả `structuredClone` (API của trình duyệt, không thuộc ES, Safari 14 cũng chưa có); quét sau khi bỏ
    chú thích. Phần nhẹ đã cần `replaceChildren`, có từ Safari 14, nên đó là mốc; `Object.hasOwn` và `.at()` phải tới Safari 15.4
    (Phụ lục A.75). Gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ huy hiệu và ghi chú. Phần nặng chỉ chạy trên trình duyệt có
    WebGPU/WebGL2 đời mới nên được dùng (`caption-set.js` dùng `Object.hasOwn`); `ui/moon-progress.js` nằm trên đường nhẹ nên viết
    `Object.prototype.hasOwnProperty.call`.
- **Hàng rào từ vựng:**
  - Quét trong `engine/`, `ui/` và `lib/tsl/`, sau khi bỏ chú thích.
  - Không được có: `slug` của mọi bức; id của mọi lớp riêng của bức (trừ `cot` và id lớp dùng chung); các từ trong `meta.fence` của mọi bức.
  - Từ ASCII khớp **chuỗi con, không phân biệt hoa thường**. Cụm tiếng Việt khớp theo ranh giới `\p{L}` sau khi chuẩn hóa NFC.
  - Test tự kiểm chính nó: phải bắt được `rippleHeight`, `addRipple`, `uHourNode`; không được bắt `vangLa`, `tripleBuffer`, `Firefox`.
- **Chữ tiếng Việt trong xưởng:**
  - Chữ **người xem** thấy nằm trong `strings.*.js`, `content.*.js` và trường `name` của `meta.js`.
  - Thông báo lỗi cho lập trình viên (`throw`, `console`) được viết tiếng Việt.
  - Luật này ghi trong `CLAUDE.md`. Test tự động cho luật này chỉ được bật khi có ngôn ngữ thứ hai (§15 d).

### 8.3 Hợp đồng nhẹ (`src/engine/contracts/painting.js`, chỉ JSDoc, không three)
```js
/**
 * Căn cước một bức: src/paintings/<slug>/meta.js. Dữ liệu thuần, JSON.stringify được.
 * @typedef {Object} PaintingMeta
 * @property {string} slug        'ao-sen-dem' = tên thư mục = khóa test. Đã deploy thì KHÔNG đổi.
 * @property {number} no          số thứ tự trong bộ tranh (Bức 1)
 * @property {string} title       'Ao Sen Đêm'
 * @property {string} tagline     một câu cho <meta name="description"> và og:description
 * @property {Poem} poem          thơ của cả bức; phải in sẵn trong HTML tĩnh (test so khớp)
 * @property {Poster} poster
 * @property {string} [og]        đường dẫn trong public/, KHÔNG có '/' đầu: 'paintings/ao-sen-dem/og.jpg' (GĐ 4; 1200×630)
 * @property {LayerMeta[]} layers THỨ TỰ PHỦ. [0].id === 'cot'. Số lớp = layers.length.
 * @property {Record<string, string>} [palette]  thêm/ghi đè token của chất liệu
 * @property {string[]} [fence]   từ vựng riêng của bức mà xưởng không được dùng (chỉ test đọc)
 */
/** @typedef {Object} Poem
 * @property {string[]} lines
 * @property {string} source      'Ca dao' | 'Truyện Kiều'… BẮT BUỘC
 * @property {string} [author]    'Nguyễn Du'
 */
/** @typedef {Object} Poster
 * @property {string} src         ĐÚNG giá trị src trong HTML nguồn: '/paintings/ao-sen-dem/poster.svg' (GĐ 4: '…/poster.webp')
 * @property {number} width       để bố cục không nhảy khi ảnh về
 * @property {number} height
 * @property {string} alt
 * @property {{ at: string, freeze: number }} [capture]   [4] scripts/poster.js chụp ?at=<at>&freeze=<freeze>&poster&level=cao
 */
/** @typedef {Object} LayerMeta
 * @property {string} id          kebab-case không dấu, duy nhất trong bức: 'mat-nuoc'
 * @property {string} name        'Mặt nước': hiện trên thanh lớp, kể cả ở tầng tĩnh
 * @property {string[]} files     file mà lớp SỞ HỮU, tính từ src/; file đầu hiện trong Sổ tay.
 *                                Marker '// @knob' chỉ hợp lệ trong các file này; mỗi file thuộc tối đa MỘT lớp.
 *                                [8] kê được cả file của hộp màu 'lib/tsl/*.js' mà lớp import (Sổ tay hiện chúng); không có
 *                                marker ở đó
 * @property {Poem} [poem]        câu thơ riêng của lớp
 */
/** Cửa vào NHẸ: src/paintings/<slug>/index.js. Trang HTML import thẳng file này: `export default { meta, load, content }`.
 * @typedef {Object} PaintingEntry
 * @property {PaintingMeta} meta
 * @property {() => Promise<import('./runtime.js').Painting>} load   chỉ tầng A/B gọi (kéo theo three)
 * @property {Record<string, () => Promise<{ default: PaintingContent }>>} [content]   [1] { vi: () => import('./content.vi.js') }
 */
/** Một dòng registry: { meta, page: 'index.html', lang: 'vi' }. Mỗi trang một ngôn ngữ. */
/** Chữ của một bức trong MỘT ngôn ngữ: content.<lang>.js. Mọi nhãn tra theo id.
 * @typedef {Object} PaintingContent
 * @property {string} hint                              'Chạm vào mặt nước'
 * @property {Record<string, DialText>} [dials]         khóa = Dial.id
 * @property {Record<string, LayerContent>} [layers]    khóa = LayerMeta.id (bắt buộc từ GĐ 2)
 * @property {Record<string, Poem>} [captions]          [5] chữ đi theo vật: khóa → { lines (1–2 dòng), source, author? };
 *                                                     bức gọi ctx.captions.show(khóa, anchor). Khóa kebab-case không dấu
 */
/** @typedef {{ label: string, notes?: Record<string, string> }} DialText */
/** @typedef {Object} LayerContent
 * @property {string} understand     tab Hiểu, ≤ 150 chữ (đếm theo khoảng trắng)
 * @property {string} [diagram]      [2] nội dung SVG: import './diagrams/<tên>.svg?raw'; có <title>, chỉ màu của bảng
 * @property {string[]} learned      "Bạn vừa học" (≥ 1 mục)
 * @property {{ title: string, url: string }[]} readMore   chỉ https
 * @property {Record<string, string | { label: string, options: Record<string, string> }>} knobs
 * @property {Record<string, { label: string, explain: string }>} [experiments]
 * @property {Record<string, string>} [readouts]
 * @property {Record<string, string>} [taps]    nhãn các bước chụp của post (Lột lớp, Kính mài)
 * @property {Record<string, string>} [objects] [5] nhãn cho MỌI vật trong layer.objects, khóa = object.name (Từng sợi)
 */
```

### 8.4 Hợp đồng nặng (`src/engine/contracts/runtime.js`, chỉ JSDoc)
**Quy tắc đánh dấu giai đoạn:**
- Một typedef được một trường `[N]` tham chiếu tới thì có từ GĐ N.
- Trường không đánh dấu thừa hưởng giai đoạn của typedef chứa nó.
- Hợp đồng **chỉ thêm trường tùy chọn**, không đổi nghĩa trường cũ.

```js
/** Module nặng: src/paintings/<slug>/painting.js
 * @typedef {Object} Painting
 * @property {LayerModule[]} layers     [0] cùng id, cùng thứ tự với meta.layers (test so khớp)
 * @property {CameraSpec} camera        [0]
 * @property {QualitySpec} [quality]    [3] ngân sách của bức; thiếu thì dùng mặc định của xưởng
 * @property {(ctx: EngineCtx) => PaintingSetup} [setup]   [1] chạy TRƯỚC mọi createLayer
 */
/** @typedef {Object} PaintingSetup
 * @property {object} [shared]          object dùng chung trong bức (thiếu thì xưởng tạo {}) → tham số thứ 2 của createLayer
 * @property {Dial[]} [dials]           [4] núm của CẢ BỨC (Bức 1: 'gio'); xưởng vẽ thanh trượt
 * @property {(g: Gesture) => void} [onGesture]   cử chỉ mà không công cụ nào dùng. [8] Trừ một chỗ: bức đã nhận 'hold-start' thì luôn
 *                                     nhận 'hold-end' của cái giữ đó, kể cả khi công cụ bật giữa chừng giữ nó (engine/gpu/scene.js#route)
 * @property {(dt: number, t: number) => void} [update]   mỗi khung, TRƯỚC các lớp. [4] update(0, t) như Layer.update
 * @property {() => void} [dispose]     gọi 2 lần vẫn an toàn
 */
/** Dữ liệu thuần; xưởng dựng camera phối cảnh ([8] hay trực giao) + OrbitControls có giới hạn.
 * @typedef {Object} CameraSpec
 * @property {'perspective'|'ortho'} [kind] [8] mặc định 'perspective'
 * @property {[number, number, number]} position
 * @property {[number, number, number]} target
 * @property {number} [fov]                 bắt buộc với camera phối cảnh; [8] camera trực giao không dùng
 * @property {number} [height]              [8] camera trực giao (bắt buộc): bề cao khung nhìn ở zoom 1, đơn vị cảnh
 * @property {number} [minWidth]            [8] camera trực giao: khung hẹp thì xưởng nới height để bề ngang thấy đủ chừng này
 *                                          (engine/gpu/fov.js#fitOrtho)
 * @property {{ below: number, maxGrow: number }} [shortFrame]   [8] camera trực giao: canvas thấp hơn `below` điểm ảnh CSS thì xưởng
 *                                          nhân bề cao khung nhìn với below / bề cao canvas, tới `maxGrow` lần (≥ 1), để chữ của trang (cỡ
 *                                          CSS cố định) còn chỗ trên ván ở laptop màn thấp; gộp với minWidth bằng max; camera phối cảnh bỏ
 *                                          qua (engine/gpu/fov.js#shortGrow)
 * @property {[number, number]} [zoom]      [8] camera trực giao: minZoom, maxZoom của OrbitControls; thiếu thì không zoom
 * @property {[number, number]} azimuth     giới hạn xoay ngang (rad); [-Infinity, Infinity] là xoay trọn vòng (GĐ 7)
 * @property {[number, number]} polar       giới hạn xoay dọc (rad)
 * @property {[number, number]} [distance]  bắt buộc với camera phối cảnh; [8] camera trực giao không dùng (khoảng cách đứng yên)
 * @property {number} [breathe]             [1] biên độ "thở"; xưởng ép về 0 khi prefers-reduced-motion
 * @property {number} [minHorizontalFov]    [7] góc nhìn ngang tối thiểu (độ): khung hẹp (điện thoại dọc) thì xưởng nới fov dọc để
 *                                          bề ngang vẫn thấy đủ góc này; khung đủ rộng giữ nguyên fov (engine/gpu/fov.js)
 * @property {{ after: number, duration: number }} [home]   [8] tranh tự khép lại: đứng yên `after` giây thì quay về góc của bức
 *                                          trong `duration` giây (engine/gpu/home.js); giảm chuyển động thì về một bước
 */
/** @typedef {Object} QualitySpec
 * @property {Record<'cao'|'vua'|'thap', Record<string, number>>} levels   ghép lên mức mặc định của xưởng; lớp đọc qua ctx.budget
 * @property {string[]} ladder     thứ tự hạ nấc: 'dpr' | '<layerId>.<stepId>'
 */
/** Một lớp = một module: layers/lN-<id>.js (hoặc engine/stock/<id>/layer.js). Là object thuần:
 * bức có thể ghi đè mặc định của lớp dùng chung bằng spread (§15 a).
 * @typedef {Object} LayerModule
 * @property {string} id           [0] export const id
 * @property {Knob[]} knobs        [0] export const knobs: TĨNH (có thể là [])
 * @property {(ctx: LayerCtx, shared: object) => Layer} createLayer   [0]
 */
/** Khai báo TĨNH của một núm. Xưởng tạo uniform cho núm 'uniform', tên đặt bằng
 * setName(`${layerId.replaceAll('-', '_')}_${knobId}`): tên phải là định danh WGSL/GLSL hợp lệ.
 * @typedef {Object} Knob
 * @property {string} id           camelCase, duy nhất TRONG LỚP
 * @property {'number'|'select'|'color'|'bool'} [kind]      mặc định 'number'
 * @property {'uniform'|'js'|'rebuild'} [via]   [0] mặc định 'uniform'; 'js'/'rebuild' xử lý ở Layer.onKnob [2]
 * @property {number|string|boolean|((env: KnobEnv) => any)} value   mặc định; hàm khi phụ thuộc mức/tầng/đêm nay
 * @property {number} [min]
 * @property {number | { webgpu: number, webgl2: number } | ((env: KnobEnv) => number)} [max]   trần theo tầng;
 *                                 [3] hoặc hàm của env (như value): trần theo mức, núm không kéo được máy yếu quá sức
 * @property {number} [step]
 * @property {string[]} [options]  kind 'select': id các lựa chọn; uniform giữ chỉ số
 */
/** @typedef {{ tier: 'webgpu'|'webgl2', level: 'cao'|'vua'|'thap', budget: Record<string, number>, now: Date, mobile: boolean }} KnobEnv */
/** Thứ createLayer trả về. Trọng số và núm KHÔNG nằm ở đây: xưởng tạo sẵn, lớp chỉ đọc.
 * @typedef {Object} Layer
 * @property {any[]} [objects]            [0] mảng SỐNG các mesh/sprite của lớp; lớp sửa tại chỗ khi dựng lại
 *                                       [5] mỗi vật có name (kebab-case, không trùng trong lớp); nhãn ở content.layers[id].objects
 * @property {(dt: number, t: number) => void} [update]   [0] lớp 5 gọi ctx.renderer.compute() ở đây
 *                                 [4] update(0, t): xưởng vẽ lại khung đứng yên (?freeze): đồng bộ theo uniform (hướng trăng, bóng),
 *                                 KHÔNG tiến mô phỏng (compute, hạt CPU)
 * @property {PostStage} [post]           [0] xử lý ẢNH sau scene pass
 * @property {() => void} dispose         [0] gọi 2 lần vẫn an toàn; tự gỡ object khỏi scene
 * @property {Record<string, (v: any) => void | Promise<void>>} [onKnob]   [2] cho núm 'js' | 'rebuild'
 * @property {Experiment[]} [experiments] [2] tab Phá
 * @property {Readout[]} [readouts]       [2] xưởng luôn thêm draw calls / tam giác / ms
 * @property {DegradeStep[]} [degrade]    [3] nấc hạ chất lượng mà lớp đưa ra
 */
/** @typedef {Object} Experiment
 * @property {string} id
 * @property {(on: boolean) => void | Promise<void>} toggle   trả Promise → UI hiện "đang dựng…"
 * @property {'toggle'|'compare'} [kind]  'compare': xưởng đo ms lúc tắt/bật và vẽ biểu đồ nhỏ
 *   [3] toggle(true) là biến thể, toggle(false) là trạng thái thường. Bàn thợ ghi ms mỗi khung và ms CPU riêng cho
 *   từng trạng thái (trung bình trượt, bỏ 0,25 s đầu sau mỗi lần đổi); Sổ tay vẽ hai cột "Tắt / Bật".
 */
/** @typedef {{ id: string, get: () => number | string, unit?: string }} Readout */
/** Nấc chỉ hạ TRẦN của lớp, KHÔNG BAO GIỜ ghi vào uniform của núm.
 * Núm = ý người xem, nấc = trần của máy, hiệu lực = min(núm, trần).
 * Nấc không được đổi thứ nằm trong cache key (castShadow, receiveShadow, shadowMap.enabled, fogNode…).
 * [3] Lớp chỉ đưa những nấc có tác dụng ở mức hiện tại (mức thấp tắt bóng thì không có nấc bóng). Xưởng gọi apply và
 * revert theo kiểu ngăn xếp: revert luôn gỡ nấc được apply gần nhất; mỗi nấc apply tối đa một lần trước khi revert.
 * @typedef {{ id: string, apply: () => void, revert: () => void }} DegradeStep */
/** Xưởng nối post của các lớp theo thứ tự:
 *   màu scene pass → build của từng lớp → renderOutput(x, NoToneMapping) → display của từng lớp → overlay công cụ → vec4(rgb, 1)
 * Node dùng lại nhiều lần hoặc trước một nhánh If phải .toVar() bên trong Fn.
 * @typedef {Object} PostStage
 * @property {(i: PostInput) => any} [build]     [0] HDR tuyến tính vào → ra (bloom, tone). Gọi MỘT lần khi dựng pipeline.
 * @property {(i: PostInput) => any} [display]   [4] màu hiển thị (sRGB) vào → ra (LUT, grain, vignette, FXAA)
 */
/** @typedef {Object} PostInput
 * @property {any} color                                   màu hiện tại (từ scene pass hoặc stage trước)
 * @property {(name: 'output'|'emissive'|'normal'|'depth') => any} channel   'normal' chỉ có sau requireView [4]
 *                                                         [8] 'depth' với camera trực giao là chính texture độ sâu (tuyến tính
 *                                                         sẵn): lấy mẫu ở điểm lân cận được mà không thêm lượt vẽ
 * @property {any} weight                                  uniform trọng số của chính lớp này
 * @property {(tapId: string, node: any) => void} [tap]    [4] chụp một bước giữa chừng → view '<layerId>:<tapId>'.
 *                                 node là biểu thức THUẦN (texture, uniform), không phải biến .toVar() trong Fn: overlay tính lại
 *                                 nó ở lượt vẽ cuối. Nhãn ở content.layers[layerId].taps[tapId]
 */
/** Núm của cả bức. Nhãn ở content.dials[id]. Dial.id đã deploy là API công khai.
 * @typedef {Object} Dial
 * @property {string} id
 * @property {any} uniform
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {(v: number) => string} [format]   29.5 → '05:30'; [4] cũng là aria-valuetext của thanh trượt
 * @property {() => string | null} [note]        khóa ghi chú trong content.dials[id].notes ('daytime')
 */
/** @typedef {Object} Gesture   [1] xưởng giữ 'drag' để xoay camera
 * @property {'tap'|'hold-start'|'hold-move'|'hold-end'|'swipe'|'hover'|'double-tap'} kind
 *                                 [5] 'double-tap': phát ngay sau 'tap' thứ hai, cùng chỗ, khi lần chạm xuống thứ hai đến trong vòng
 *                                 300 ms sau lần nhấc ngón thứ nhất và cách chỗ chạm đầu ≤ 24 px. Hai lần chạm vẫn là hai 'tap'
 *                                 [4] 'hover': chuột di mà không bấm, mỗi khung tối đa một. CHỈ công cụ nhận; bức không bao giờ
 *                                 nhận 'hover' (onGesture của bức giữ nguyên nghĩa)
 * @property {{ x: number, y: number }} ndc
 * @property {any} ray                          THREE.Ray; bức tự giao với mặt phẳng của nó
 * @property {{ x: number, y: number }} [velocity]   chỉ có ở 'swipe'
 * @property {'mouse'|'touch'|'pen'} [pointer]  [4] pointerType của sự kiện gốc (kính chỉ giữ chạm của ngón tay, bút)
 */
/** Công cụ học [4]: chạy với MỌI bức. src/engine/tools/<id>.js; tên trên nút "Đồ nghề" ở t.tools[id].name
 * @typedef {{ id: string, mount: (api: ToolApi) => ToolInstance }} Tool */
/** @typedef {Object} ToolApi
 * @property {() => ViewInfo[]} views              view ở không gian hiển thị, thứ tự như §7 Lột lớp
 * @property {(id: string) => Promise<void>} requireView   bảo đảm view sẵn sàng (có thể biên dịch lại MỘT lần)
 * @property {HTMLElement} el                      [4] ô của công cụ trong thanh công cụ; công cụ dựng thanh điều khiển ở đây
 * @property {Record<string, any>} t               chữ giao diện của trang (strings.<lang>.js)
 * @property {() => Promise<void>} redraw          [4] vẽ lại khung đứng yên (?freeze) sau khi công cụ đổi uniform
 * @property {DrawProbe | null} [draws]           [5] lần vẽ của lượt vẽ cảnh (Từng sợi): engine/gpu/draws.js. Chỉ năm hàm của
 *                                                DrawProbe: begin()/end() ở lại scene.js, công cụ không tự mở hay đóng khung ghi.
 *                                                null khi hộp đồ nghề được dựng không có móc: công cụ cần móc thì ném lỗi trong
 *                                                mount() (như Từng sợi), và toolbox.js bỏ riêng công cụ đó
 */
/** @typedef {{ id: string, label: string, ready: boolean }} ViewInfo */
/** [5] Móc lần vẽ (renderer.setRenderObjectFunction), phần công cụ thấy (ToolApi.draws). Chỉ gắn giữa start() và stop(); lúc khác
 * cảnh không tốn thêm gì. Móc mà scene.js giữ (createDrawProbe) còn có begin()/end(), gọi quanh mỗi pipeline.render().
 * @typedef {Object} DrawProbe
 * @property {() => void} start                 gắn móc (công cụ bật); khung kế tiếp được ghi lại
 * @property {() => void} stop                  gỡ móc, trả hàm vẽ trước đó; vẽ đủ như chưa có gì
 * @property {() => DrawInfo[]} list            lần vẽ của camera chính ở khung vẽ đủ gần nhất, theo thứ tự GPU nhận
 * @property {(k: number | null) => void} limit  chỉ vẽ k lần đầu của list() (so theo vật + material + lượt: khóa
 *                                              object.id:material.id:passId); null = vẽ đủ.
 *                                              k là số nguyên ≥ 0 (giá trị khác thì ném lỗi); đang limit thì list() đứng yên
 * @property {() => { scene: number, reflection: number, other: number }} counts   draw call của khung vẽ đủ gần nhất, theo lượt.
 *                                              reflection: lần vẽ của camera khác LỒNG trong lần vẽ một vật (phản chiếu);
 *                                              other: phần còn lại của renderer.info (bóng, bloom, quad của hậu kỳ)
 */
/** @typedef {{ layerId: string | null, layer: string | null, name: string | null, label: string, kind: string,
 *   instances: number, triangles: number, material: string, nested: number }} DrawInfo
 *   layer: tên lớp (meta) · label: nhãn vật trong content (thiếu thì name, rồi kind) · nested: lần vẽ lồng bên trong (phản chiếu) */
/** @typedef {Object} ToolInstance
 * @property {(final: any, view: (id: string) => any) => any} [overlay]  ghép sau display khi dựng pipeline; [4] ghép LẠI khi
 *                                 requireView đổi MRT, nên chỉ dựng node, không giữ trạng thái; đổi chế độ = đổi uniform
 * @property {(g: Gesture) => boolean} [onGesture]  true = đã dùng, không chuyển cho bức; [8] trừ 'hold-end' mà bức còn chờ (bức đã
 *                                 nhận 'hold-start' của cái giữ đó trước khi công cụ bật): công cụ nhận trước, bức vẫn nhận sau
 *                                 (engine/gpu/scene.js#route). [5] Giữ 'tap' thì giữ cả 'double-tap'
 *                                 (kính tròn của Kính mài giữ cả hai; hình gạt không giữ cử chỉ nào): không thì bức nhận
 *                                 'double-tap' mà không có hai 'tap' làm nên nó
 * @property {(on: boolean) => void} [activate]     [4] bật/tắt: đổi uniform, hiện/giấu thanh điều khiển
 * @property {() => void} dispose
 */
/** Thứ xưởng đưa cho bức. Bức chỉ chạm vào thế giới qua đây và qua three.
 * @typedef {Object} EngineCtx
 * @property {'webgpu'|'webgl2'} tier          [0] backend THẬT sau renderer.init()
 * @property {'cao'|'vua'|'thap'} level        [0] mức lúc khởi động ([3] hoặc mức ép bằng ?level); nấc hạ KHÔNG đổi số này
 * @property {Record<string, number>} budget   [0] mức mặc định của xưởng ghép với quality.levels[level] của bức
 * @property {boolean} mobile                  [0]
 * @property {boolean} reducedMotion           [0]
 * @property {Date} now                        [0] flags.at ?? giờ thật, cố định lúc khởi động
 * @property {any} renderer                    [0] WebGPURenderer (compute, info)
 * @property {any} scene                       [0] lớp tự add/remove đối tượng của mình
 * @property {any} camera                      [0]
 * @property {{ hex: Record<string, string>, color: (token: string) => any }} palette   [0] bảng đã ghép; color() trả THREE.Color
 * @property {{ time: any, delta: any, resolution: any, pointer?: any }} u              [0] uniform chung (pointer: [1])
 * @property {(layerId: string) => any} weight [0] uniform trọng số; 'cot' luôn là 1; id lạ → ném lỗi
 * @property {boolean} debug                   [0]
 * @property {{ keys: string[], show: (key: string, anchor: () => ({ x: number, y: number, z: number } | null)) => void }} [captions]
 *                                            [5] chữ đi theo vật: keys = các khóa có trong content.captions (rỗng khi chữ tải hỏng);
 *                                            show() thay dòng đang hiện; anchor() trả null thì chữ ẩn ở khung đó
 */
/** @typedef {EngineCtx & { knob: (knobId: string) => any, knobValue: (knobId: string) => any }} LayerCtx
 *   [0] knob(): uniform của núm 'uniform' của CHÍNH lớp đang dựng
 *   [2] knobValue(): giá trị ban đầu (đã chuẩn hóa) của MỌI núm của lớp, kể cả 'js'/'rebuild'
 */
/** [2] { weights: { layerId: số }, knobs: { 'layerId.knobId': giá trị } } — dạng JSON của trạng thái tác phẩm
 * [4] thêm dials: { dialId: số } (bức không có Dial thì bỏ trống)
 * @typedef {{ weights: Record<string, number>, knobs: Record<string, any>, dials?: Record<string, number> }} Snapshot */
/** [2] Bàn thợ (engine/gpu/studio.js): API DUY NHẤT mà Sổ tay (ui/) và __sma thấy; không có ở tầng tĩnh.
 * layers() · weight(id) → { value, target } · setWeight(id, v, { tween }) · knobs(layerId) · setKnob(layerId, knobId, v)
 * experiment(layerId, id) · toggleExperiment(layerId, id, on) · readouts(layerId) · stats() · snapshot() · restore(s)
 * [3] stats() thêm cpuMs · compare(layerId, id) → { off, on }, mỗi bên { ms, cpuMs } hoặc null khi chưa đo
 * [3] quality() → { level, steps: string[], guarding, capped } · degrade() / upgrade() → Promise<boolean> (hạ/nâng tay MỘT nấc;
 *     false khi không còn nấc) · onQuality(cb) báo mỗi lần nấc đổi (run.js vẽ lại huy hiệu)
 * [4] tools() → { id, on }[] · setTool(id | null) (bật một, tắt các cái khác) · dials() → { id, min, max, step, value, text, note }[]
 *     · setDial(id, v) (kẹp theo min/max/step) · stats().gpuMs (null khi máy không đo được) · compare() mỗi bên thêm gpuMs
 *     · quality() thêm gpu (đo được ms GPU không) và locked (id các nấc bị khóa chống dao động) · snapshot()/restore() có dials
 * [9] translation(layerId) → Promise<Translation> (§21.3) · recipe() → { text, counts } · applyRecipe(text) → Promise<{ counts, problems }>
 *     · reset() → Promise (về mặc định của máy đang xem) · onChange(cb) → hàm bỏ nghe (sau mọi thay đổi trọng số, núm, Dial)
 * Mọi hàm đổi trạng thái trả Promise, xong khi khung đã được vẽ lại (khi ?freeze đã dừng vòng lặp).
 * @typedef {Object} Studio */
```

**Bức 1 đi qua hợp đồng:**
- `index.js`: `export default { meta, load: () => import('./painting.js') }`. Từ GĐ 1 thêm `content: { vi: () => import('./content.vi.js') }`.
- `painting.js` export:
  - `layers`: v0 là `[cot, matNuoc, vangLa, phuBong]`; bản cuối là `[cot, anhTrang, suong, matNuoc, vangLa, phuBong]`;
  - `camera`;
  - từ GĐ 1 có `setup(ctx)`; từ GĐ 3 có `quality`.

### 8.5 Vòng đời một bức và luồng mỗi khung
```
t=0  HTML tĩnh: poster + tên + thơ + [data-seal]                           data-state="poster"
     entry chunk (KHÔNG three): boot(entry, { lang, t })
 ├─ flags = readFlags(location.search); now = flags.at ?? new Date()
 ├─ sma = createSma(window); shell = mountShell(document, meta, { now, t }) → con dấu
 ├─ tier = await detectTier(flags, envFromWindow(window))                   "detecting"
 ├─ 'static' → showStatic(entry, shell, { reason: 'flag' | 'no-gpu' }) ──── "static" ■
 └─ withDeadline(10 s): import('./gpu/run.js') → run(entry, shell, { tier, flags, now, t, sma })   "loading"
      ├─ song song: entry.load() · entry.content?.[lang]?.() · createStage({ tier, flags })   (GĐ 2: phần dưới ở scene.js)
      │             (renderer + init + nền denThen đặc; backend THẬT)
      ├─ stage.useCamera(painting.camera); level = pickLevel(...); budget = budgetFor(level, painting.quality)
      ├─ ctx = makeCtx(...)                          ← trọng số cho từng meta.layers[i].id ('cot' = 1)
      ├─ setup = painting.setup?.(ctx); shared = setup?.shared ?? {}
      ├─ với mỗi module: uniform núm từ khai báo tĩnh → createLayer(ctx + knob, shared)
      ├─ lưới an toàn emissive (luật 8)
      ├─ pipeline = createPipeline(...)              ← build → renderOutput → display → overlay, ghép MỘT lần   "compiling"
      ├─ await scenePass.compileAsync(renderer); render 1 khung ẩn (canvas opacity 0)
      ├─ shell.crossfade(canvas) → poster hidden                                   "fading"
      ├─ huy hiệu (backend thật, data-backend); GĐ 1–4: gợi ý, thanh lớp, Sổ tay, dials
      ├─ GĐ 2: __sma.expose(bàn thợ); lời mời (nút) → ui/workshop.js; công cụ ?debug tải SAU khi live
      └─ loop: đồng hồ (thật, hoặc tất định nếu ?freeze) → cử chỉ (công cụ → bức; drag → camera)
               → setup.update → layer.update theo thứ tự → tween trọng số → quality.sample
               → (apply/revert một nấc) → render → đọc renderer.info → sma.frames++          "live"
               ?freeze=N: dừng loop sau khung N (canvas giữ khung N); đổi trọng số/núm lúc đó thì vẽ lại
               ĐÚNG khung N ở nhịp rAF kế tiếp (không tiến đồng hồ)
     mất GPU sau khi live, lần đầu: snapshot() → gỡ → poster + "Dựng lại cảnh"                   "lost"
               → bấm: renderer + canvas MỚI → dựng lại (scene.js) → restore(snapshot) → hòa dần → "live"
                 (GĐ 5: hạn 10 s của run.js; quá hạn → tĩnh 'timeout', phần xong muộn chỉ tự dọn)
               lần hai (hoặc mất trước khi live): tầng tĩnh ('device-lost')
Gỡ: disposer.closeAll() theo thứ tự NGƯỢC (loop → UI → tools → pipeline → lớp ngược → setup → stage)
```

**(GĐ 3) Bộ điều chỉnh trong vòng lặp:** mỗi khung, `quality.sample(thời điểm rAF)` có thể trả lời "hạ một nấc" hay "nâng một nấc";
`ladder.js` áp nấc đó rồi mới vẽ. Khi thanh lớp mở, bộ điều chỉnh chuyển sang chế độ canh (run.js báo: chỉ hạ khi quá tải nặng),
tắt hẳn khi có `?freeze` (ảnh phải
tất định), và bắt đầu lại từ đầu sau "Dựng lại cảnh" (nấc là trạng thái của máy, không nằm trong snapshot).

**(GĐ 4) Vòng lặp có thêm:**
- **Cử chỉ** đi qua hộp đồ nghề (`gpu/toolbox.js`) trước. Công cụ đang bật nhận trước; nó trả `true` thì cử chỉ dừng ở đó.
  `hover` không bao giờ tới bức.
- **Đo GPU:** sau `render()`, `gpuTimer.poll()` gọi `resolveTimestampsAsync('render')` và `('compute')`, nhưng chỉ khi không có lần nào
  đang dở, và không chờ kết quả. Kết quả về sau vài khung. Hai số được cộng thành ms GPU của một khung, rồi đưa cho bộ điều chỉnh và
  bàn thợ.
- **Bộ điều chỉnh** bắt đầu đo từ lúc `live` (sau hòa dần). Khung ẩn và 0,9 giây hòa dần không được tính.
- **Vẽ lại khung đứng yên** (`?freeze`), ở nhịp rAF kế tiếp: `setup.update(0, t)` → `layer.update(0, t)` → `render()`. dt = 0 nghĩa là
  đồng bộ theo uniform (hướng trăng, bóng) mà không tiến mô phỏng, nên ảnh vẫn là khung N.

**(GĐ 5) Mốc của quầng trăng:** `shell.setState` đã báo mọi trạng thái cho quầng. Boot báo thêm MỘT mốc không phải trạng thái,
`'chunk'`, bằng `shell.progress('chunk')` ngay khi `loadRun()` xong, trước khi gọi `run()`. `progress` đi qua vỏ trang "bị khóa"
của boot như các hàm khác, nên phần 3D đến muộn không vẽ lại quầng. `run.js` không có code nào của quầng.

Mỗi mốc đặt một ĐÍCH (phần vòng) và một thời gian bò (`HALO_STEPS` của `ui/moon-progress.js`). Quầng bò từ chỗ đang đứng tới đích
đó theo đường ease-out dài (`cubic-bezier(0.15, 0.6, 0.25, 1)`: đi được 90% quãng sau nửa thời gian):

| Lúc | Mốc | Đích (phần vòng) | Bò trong |
|---|---|---|---|
| `setState('loading')` (boot; "Dựng lại cảnh": run.js) | trạng thái; vẽ vòng mới, rỗng | 0,45 | 10 s, đúng bằng `BOOT_DEADLINE_MS` |
| `loadRun()` xong (`boot.js`) | `'chunk'` | 0,62 | 4 s |
| `setState('compiling')` (`run.js`: bức, renderer, chữ đều đã có) | trạng thái | 0,9 | 3 s |
| `setState('fading')` | trạng thái | 1 | 0,3 s, rồi tan (opacity) trong 0,6 s còn lại của 900 ms hòa dần (`CROSSFADE_MS`) |
| `'live'` | trạng thái | gỡ quầng (đã tan hết) | |
| `'static'`, `'lost'` | trạng thái | gỡ ngay, không tan | |

- Chỉ `'loading'` vẽ vòng mới. Mốc nào tới khi không còn vòng trên trang (chưa tới `loading`, đã gỡ, trăng vừa vẽ lại) thì bỏ qua,
  nên phần 3D đến muộn sau khi trang đã về tĩnh không vẽ lại quầng. Vòng không bao giờ lùi: mốc tới muộn mà đích thấp hơn đích
  đang có thì bỏ qua.
- Bò bằng CSS transition trên `stroke-dashoffset` (vòng có `pathLength="1"` và `stroke-dasharray: 1 2`: dashoffset 1 là rỗng, 0 là
  đầy), không có vòng `requestAnimationFrame` nào. JS chỉ đặt đích và `transition` inline; mốc tới giữa chừng thì transition mới đi
  tiếp từ chỗ đang đứng. Vòng mới được "chốt" ở dashoffset 1 (đọc `getComputedStyle` ngay sau khi gắn), không thì mốc đầu nhảy
  thẳng thay vì bò (Phụ lục A.58).
- Giảm chuyển động: `shell.css` đặt `transition: none !important` (thắng transition inline), quầng nhảy thẳng tới từng mốc.
- **Số giây** chốt theo thời gian đo được của từng chặng (dựng thử, Mac M2 có GPU thật; SwiftShader thay cho máy yếu; bảng chép ở
  chú thích của `HALO_STEPS`). "Ấm": trình duyệt đã có cache; "lạnh": trình duyệt mới, không cache; Fast/Slow 4G: hai mức giả lập
  mạng của DevTools, trên M2; SwiftShader đo ở lần mở trang đầu của trình duyệt.

  | Chặng (ms) | M2 ấm | M2 lạnh | Fast 4G | Slow 4G | WebGPU SwiftShader | WebGL2 SwiftShader |
  |---|---|---|---|---|---|---|
  | `loading` → `chunk` | 24–45 | 30–60 | 700 | 3390 | 30 | 35–60 |
  | `chunk` → `compiling` | 33–44 | 45 | 265 | 820 | 1840–1950 | 1320–1360 |
  | `compiling`: compileAsync | 137–154 | 155 | 150 | 160 | 840–910 | 360–390 |
  | khung ẩn, rồi `fading` | 115–127 | 125 | 125 | 130 | 135 | 940 |

  Trang thật lần đầu sau deploy (CDN chưa có file) mất 9,2 giây, gần hết ở chặng đầu: chặng đầu bò 10 giây, bằng hạn của boot, để
  quầng không đứng hẳn trước lúc quá hạn (`BOOT_DEADLINE_MS` export từ `engine/boot.js`; `ui/` không import được `engine/`, nên
  `tests/unit/boot.test.js` giữ hai số bằng nhau). Ease-out dồn quãng vào nửa đầu: từ giây thứ 7 tới lúc rơi về tĩnh, quầng chỉ
  nhích thêm chừng 0,012 vòng. `chunk` bò 4 giây và `compiling` bò 3 giây, gấp 2 và 3,3 lần chặng chậm nhất đo được, nên mốc sau
  tới khi quầng còn đang bò. Máy nhanh thì cả vòng chạy chưa tới một giây.
- **Vì sao không có mốc nào giữa compileAsync và `fading`:** transition của `stroke-dashoffset` tính trên luồng chính (Phụ lục
  A.70). Quầng chỉ bò khi trang đang chờ (chờ mạng; chờ GPU: xin adapter, compileAsync) và đứng yên trong việc đồng bộ: dựng cảnh
  (40–60 ms) và khung ẩn. run.js vẽ khung ẩn rồi đặt `fading` liền trong một tác vụ, nên một đích đặt trước khung ẩn bị `fading`
  thay trước khi trình duyệt kịp vẽ khung nào. Bản thiết kế có mốc `'compiled'` ở đó; quầng không bao giờ vẽ được nó, nên đã bỏ.
  - Trên WebGL2 SwiftShader, `getContext` chặn 1,25 giây ngay sau `chunk`, trong cùng tác vụ: quầng nằm gần 0 (0,003–0,012) rồi
    nhảy lên chừng 0,48, vì transition của `chunk` lấy giờ bắt đầu từ khung trước lúc chặn. Rồi compileAsync chặn chừng 0,2 giây và
    khung ẩn chừng 0,95 giây: quầng đứng ở chừng 0,59 gần 1,2 giây trước `fading`.
  - Trên WebGPU SwiftShader, lúc xin adapter (1,8 giây) luồng chính rảnh mà khung vẫn thưa, có khi cách nhau 0,4 giây: quầng đi giật.
- "Dựng lại cảnh" đi lại từ `loading` (không có mốc `'chunk'`, vì code 3D đã tải).

**(GĐ 5) Vòng lặp có thêm:**
- **Chữ đi theo vật:** sau `controls.update()` và trước `render()`, `caption-set.js` gọi `anchor()` của dòng đang hiện, chiếu ra
  màn hình bằng camera rồi đặt `transform` cho chữ. Hết giờ (theo `ctx.u.time`) thì gỡ chữ. Không có chữ thì không làm gì. Lúc
  `?freeze` đã dừng, đồng hồ đứng nên chữ ở lại; vẽ lại khung đứng yên cũng chiếu lại chữ (camera có thể vừa bị kéo).
  - (Dựng thử) Trước khi chiếu, `camera.updateMatrixWorld()`: `OrbitControls.update()` chỉ gọi `camera.lookAt()`, nên tới `render()`
    ma trận của camera mới được tính lại; không tính trước thì chữ chạy trễ camera một khung khi người xem kéo (Phụ lục A.55).
  - `show()` đặt chữ ngay (không đợi khung sau): cử chỉ có thể tới ngoài vòng lặp, lúc `?freeze` đã dừng.
- **Móc lần vẽ** (chỉ khi Từng sợi bật): `pipeline.render()` đi qua móc của `draws.js`. Móc ghi lại lần vẽ của khung vẽ đủ, và bỏ
  các lần vẽ sau sợi đang xem.
- **`setup.onGesture('double-tap')`:** cử chỉ mới đi đúng đường cũ: công cụ đang bật nhận trước, không công cụ nào dùng thì tới bức.

### 8.6 Mỗi mối quan tâm chung nằm ở đâu
| Mối quan tâm | Nơi ở | Quy tắc |
|---|---|---|
| Token màu | `engine/palette.js` (tầng chất liệu) + `meta.palette` (bức) | `ctx.palette` là bản đã ghép. `styles/tokens.css` khớp `palette.js` (unit test) |
| Thư viện TSL | `lib/tsl/noise.js` (có từ GĐ 1) | Fresnel, wrap lighting, `rippleHeight` **ở lại trong bức**. Chỉ rút lên `lib/tsl/` khi bức thứ hai cần (**luật hai lần**) |
| Âm lịch, pha trăng | `lib/astro/`, chỉ trả về số | Tên tháng/can/chi và `formatSeal` nằm ở `ui/strings.vi.js` |
| Con dấu | `<span data-seal>` trong HTML của mọi bức; `ui/shell.js` điền vào | Chữ ký của kỹ thuật |
| Trăng SVG ở tầng tĩnh | `ui/moon-svg.js` điền vào `<svg data-moon>` **nếu trang có ô đó** (GĐ 1) | Bức nào không có trăng thì bỏ ô đó đi |
| Thanh giờ | Dial của Bức 1 trong `paintings/ao-sen-dem/shared.js`; `ui/dials.js` vẽ | Xưởng không biết "giờ" là gì |
| Pointer, gợn sóng | Xưởng: `ctx.u.pointer`, `Gesture{kind, ndc, ray}` (GĐ 1). Bức: `ripples[8]`, `rippleHeight`, giao tia với mặt nước, điểm hút | Công cụ nhận cử chỉ trước, sau đó tới bức; `drag` dành cho camera |
| Liên kết lớp | `shared.<layerId>` do lớp trước ghi | Lớp chỉ đọc `shared` của lớp đứng trước nó |
| Content và chữ giao diện | Bức: `content.vi.js`. Lớp dùng chung: `engine/stock/<id>/content.vi.js`, viết trung tính; bức **import tường minh** và ghi đè bằng spread: `layers: { 'phu-bong': { ...phuBong.layers['phu-bong'], understand: '…' } }`. Xưởng: `ui/strings.vi.js`, truyền vào dưới dạng `t` | Sẵn sàng đa ngôn ngữ mà không cần framework |
| Code-view, marker | Plugin chung; `ui/code-view.js` glob file lớp của các bức (trừ `_mau`) và của `engine/stock/` | Marker chỉ hợp lệ trong `LayerMeta.files`; id núm có phạm vi trong lớp |
| Bảng chất lượng | Xưởng: chọn mức, mức mặc định (`dpr`), ngân sách khung, độ trễ, nấc `dpr`. Bức: số theo mức và `ladder`. Lớp dùng chung: mặc định của riêng nó (`ctx.budget.bloom ?? 0.5`) | Lớp đọc số qua `ctx.budget` và đưa ra `degrade` |
| Bộ điều chỉnh (GĐ 3) | `engine/quality.js` (quyết định, hàm thuần không three, test bằng chuỗi khung giả) + `engine/gpu/ladder.js` (áp nấc) | Quyết định tách khỏi việc áp: logic trễ test được trong Node, việc áp nấc chạm GPU thì e2e giữ |
| Đo GPU (GĐ 4) | `gpu/gpu-timer.js` lấy số; `engine/tuner.js` dùng số (hàm thuần; tách từ `quality.js`); bàn thợ và Sổ tay hiện số | Máy không đo được thì mọi thứ chạy như GĐ 3 |
| Công cụ học (GĐ 4) | `engine/tools/<id>.js` (overlay, thanh điều khiển, cử chỉ); `gpu/toolbox.js` (gắn, định tuyến, mỗi lúc một công cụ); `gpu/views.js` (danh sách view); `ui/rail-tools.js` (nút trong thanh lớp) | Công cụ chỉ nhìn `views()`, bức không biết có công cụ. Nhãn nằm ở `t.tools`, `t.views` và `content.layers[id].taps` |
| Dial (GĐ 4) | Bức khai báo trong `setup().dials` (Bức 1: `shared.js`); `gpu/dial-set.js` đọc/ghi; `ui/dials.js` vẽ | Xưởng không biết Dial nghĩa là gì, chỉ biết uniform, khoảng giá trị và cách ghi chữ |
| Chữ đi theo vật (GĐ 5) | Chữ ở `content.captions` của bức; bức gọi `ctx.captions.show(khóa, anchor)`; `gpu/caption-set.js` chiếu và tính giờ; `ui/captions.js` vẽ DOM | Code của bức không chứa chữ nào cho người xem, chỉ chứa khóa. Mỗi lúc một dòng |
| Tiến độ tải (GĐ 5) | `ui/moon-progress.js` trong `[data-moon]`; `shell.js` nối với `setState` và `progress(mốc)`; `boot.js` báo mốc `'chunk'`, các mốc còn lại là trạng thái | Chỉ CSS, đường nhẹ, không three. Bức nào không có trăng thì không có quầng |
| Lần vẽ (GĐ 5) | `gpu/draws.js` (móc của renderer); `ToolApi.draws`; `tools/tung-soi.js` vẽ thanh điều khiển; nhãn vật ở `content.layers[id].objects` | Móc chỉ gắn khi Từng sợi bật; chỉ `draws.js` được đặt móc (§8.2) |

### 8.7 Cờ URL, HTML, poster và chunk trên GitHub Pages
**Cờ URL** (`engine/flags.js`). Query string là môi trường; hash là trạng thái tác phẩm. Từ GĐ 9, `#r=…` là link công thức (§21.2,
§21.4): `engine/recipe.js` đọc nó, không qua `readFlags`.

| Cờ | Nghĩa |
|---|---|
| `?static` | tầng C |
| `?webgl` | tầng B (`forceWebGL: true`) |
| `?force3d` | bỏ qua mọi kiểm tra phần mềm (để e2e chạy trên SwiftShader) |
| `?debug`, `?debug=stats` | GĐ 0: in chi tiết lỗi. GĐ 1: Inspector hoặc stats-gl (§7) |
| `?at=2026-09-28T21:00` | "bây giờ" giả lập |
| `?freeze`, `?freeze=N` | đồng hồ tất định |
| `?poster` | (GĐ 4) ẩn mọi UI trừ canvas, để chụp poster: `body[data-poster]`, CSS ẩn chữ, huy hiệu, thanh lớp, Sổ tay, thanh công cụ (GĐ 5: cả vùng chữ đi theo vật); không có gợi ý hay lời mời. Dùng cùng `?at&freeze=N` |
| `?level=cao\|vua\|thap` | (GĐ 3) ép mức chất lượng thay cho `pickLevel` (xem mức thấp ngay trên laptop; e2e phủ đường phản chiếu giả). Giá trị lạ thì bỏ qua (`?debug` in cảnh báo) |

- **`?at`:** giá trị không ghi offset được hiểu là **giờ Việt Nam (+07:00)**, bất kể múi giờ của máy.
  - Muốn ghi offset thì viết `Z` hoặc `%2B07:00`. Dấu `+` trong query string bị giải mã thành khoảng trắng, nên `flags.js` đổi khoảng trắng về `+` trước khi parse.
  - Giá trị hỏng thì bỏ qua (dùng giờ thật; `?debug` in cảnh báo).
- **`?freeze`:** đồng hồ tất định.
  - `u.time = số khung đã vẽ × 1/60` giây, `u.delta = 1/60`. Không đọc đồng hồ tường.
  - Mọi ngẫu nhiên đi qua `lib/random.js` có hạt giống.
  - `?freeze=N` còn **dừng loop sau khung N**; canvas giữ khung N, `__sma.frames === N`.
  - Trên cùng máy và cùng backend, hai lần chạy cùng `?at&freeze=N` cho cùng một ảnh.
  - Vì vậy **không dùng `time`/`deltaTime` của TSL** (chúng chạy theo đồng hồ riêng của renderer). Mọi chuyển động đọc `ctx.u.time` / `ctx.u.delta`.

**HTML (hiện tại có một bức):**
- Chỉ có `index.html` ở gốc, viết tay: `<body data-painting="ao-sen-dem" data-state="poster">`. URL: `https://giabao2610.github.io/son-mai-anh-sang/`.
- Poster là `<img src="/paintings/ao-sen-dem/poster.svg" width height alt fetchpriority="high">`, có sẵn trong HTML.
- CSS: `<link rel="stylesheet" href="/src/styles/shell.css">`.
  - `shell.css` mở đầu bằng `@import './tokens.css'` và 5 file `@fontsource/…/<weight>.css`.
  - Vite gộp tất cả thành một file CSS có hash (khoảng 3 KB, không kể font). Font dùng `font-display: swap`.
- Script duy nhất là một `<script type="module">` inline, vốn đã được hoãn nên không chặn vẽ:
  `import { boot } from '/src/engine/boot.js'; import entry from '/src/paintings/ao-sen-dem/index.js'; import t from '/src/ui/strings.vi.js'; boot(entry, { lang: 'vi', t });`
  Vite 8 chuyển script này thành một entry chunk có hash và thêm base cho mọi đường dẫn tuyệt đối (đã kiểm).
- `<title>`: `Ao Sen Đêm · Sơn Mài Ánh Sáng`, tên bức trước, tên kỹ thuật sau. Poster in sẵn dòng `Sơn Mài Ánh Sáng · Bức 1`.
- **OG (GĐ 4):** `og:image` là URL tuyệt đối, viết tay; test so sánh với `SITE + meta.og`. `SITE = 'https://giabao2610.github.io/son-mai-anh-sang/'` (có `/` cuối), nằm trong `registry.js`.
- **(GĐ 6) Hai bức.** Bức 2 ở `tranh/den-keo-quan/index.html`, viết tay theo cùng khung (§18.6). `og:url` của mỗi trang là `SITE`
  cộng thư mục của trang (test đã tính như vậy từ GĐ 4).
- **(GĐ 6) Lật tranh:** ngay dưới `<h1>` của mỗi trang có `<nav class="series" aria-label="Các bức tranh">`, gồm link tới bức kề trước
  (`rel="prev"`, "← Bức {n−1} · {tên}") và bức kề sau (`rel="next"`, "Bức {n+1} · {tên} →"), nếu có.
  - Đích là đường dẫn tương đối tới thư mục của trang kia. Vite không viết lại `<a href>`, nên đường dẫn tương đối chạy dưới mọi `base`.
  - Chỉ là HTML và CSS (`shell.css`), không có JS: chạy cả ở tầng tĩnh. `?poster` ẩn cùng `.frame`.
  - Test HTML so link với registry (xếp theo `meta.no`).
- **(GĐ 7) Trang sinh từ một khuôn** (§19.7):
  - `scripts/pages.js` (`npm run pages`) viết trang của mọi bức và Phòng tranh từ registry, `meta` và `ui/strings.vi.js`;
  - trang vẫn là file HTML commit trong repo; test báo lỗi khi file trên đĩa lệch với trang sinh ra;
  - dải link có thêm "Phòng tranh" ở giữa (trước, Phòng tranh, sau);
  - trình sinh luôn in `<svg data-moon>`, vì mọi bức đều giữ trăng SVG (cả ba bức của GĐ 7, và Bức 4).
- **(GĐ 7) Phòng tranh** `tranh/index.html`: trang tĩnh không có script, liệt kê các bức theo `meta.no`; nằm trong `input` của Vite.
  URL gốc vẫn là Bức 1.

**Poster và OG (GĐ 4):**
- `node scripts/poster.js <slug>` chạy trên máy có GPU thật (máy của Bao, WebGPU), trên bản build (`vite preview`):
  1. Mở `?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao` ở khung `poster.width × poster.height`, DPR 1.
  2. Chờ `__sma.frames === freeze`, rồi chụp canvas.
  3. Mã hóa WebP ngay trong trang bằng `canvas.toBlob('image/webp', q)`. Dò `q` từ cao xuống tới khi file ≤ 150 KB, rồi ghi ra
     `public/paintings/<slug>/poster.webp`.
  4. Cắt phần giữa 1200×630, mã hóa JPEG (q 0,85), ghi ra `og.jpg`.
- Không thêm gói npm (không cần sharp). CI không chạy script này: ảnh được commit vào repo.
- **Bức 1** đặt `poster.capture = { at: '2026-10-25T21:00', freeze: 300 }`:
  - đêm 16 tháng Chín, trăng tròn (99,6%), đúng giờ mặc định 21:00;
  - khung 300 (5 giây) để đom đóm kịp tản đều.

  Muốn đổi thời điểm thì sửa một dòng trong meta rồi chạy lại script.
- **HTML:** `<img src="/paintings/ao-sen-dem/poster.webp">` thay cho bản SVG (xóa `poster.svg`). Thêm các thẻ:
  - `og:title`, `og:description` (= `meta.tagline`), `og:type = website`, `og:url` (= `SITE`);
  - `og:image` (= `SITE + meta.og`), `og:image:width`, `og:image:height`;
  - `twitter:card = summary_large_image`.

  Test HTML so từng thẻ với meta.
- **og dùng JPEG** thay cho PNG như dự kiến ban đầu: grain làm PNG nặng gấp nhiều lần, và mạng xã hội nào cũng đọc được JPEG.

**Chunk:**
- Một entry nhỏ gồm boot, shell, meta và lunar (khoảng 1–3 KB gzip).
- Một chunk `three` dùng chung, khoảng 243 KB gzip:
  - tách bằng `build.rolldownOptions.output.codeSplitting.groups`;
  - chỉ khớp `node_modules/three/build/`, để Inspector không bị kéo vào.
- Một chunk cho từng bức. Một chunk `tweakpane`, tải khi tab Chỉnh mở lần đầu (GĐ 2).
- (GĐ 2) Một chunk `workshop` (thanh lớp + Sổ tay) dùng chung cho tầng 3D và Sổ tay chỉ đọc của tầng tĩnh; mỗi file lớp có một chunk `?code` nhỏ, tải khi tab Chỉnh mở lớp đó.

**Về sau (N bức):**
- Bức thứ n nằm ở `tranh/<slug>/index.html` (GĐ 6: Bức 2 là bức đầu tiên đi đường này). GH Pages phục vụ index của thư mục. **URL gốc là Bức 1 mãi mãi.**
- `vite.config.js` lấy `input` từ `registry.js`. Registry chỉ import các `meta.js` (dữ liệu thuần), nên Node đọc được.
- Build nhiều trang đã được thử: các trang dùng chung đúng một chunk `three` (cùng hash).

## 9. Tầng dự phòng (của từng bức)

### Thứ tự quyết định (`engine/tier.js`, hàm thuần nhận `env`)
1. **Cờ URL:** `?static` → C. `?webgl` → B. `?force3d` bỏ qua mọi kiểm tra phần mềm.
2. **A · WebGPU:** cần đủ ba điều kiện.
   - Có `navigator.gpu`, chỉ có trong secure context. GitHub Pages dùng https; `localhost` cũng được tính là secure.
   - `requestAdapter({ featureLevel: 'compatibility' })` (giống cách three xin adapter) trả về adapter.
   - Adapter không phải phần mềm: `adapter.info.isFallbackAdapter !== true`, và `info.architecture`, `info.vendor`, `info.description` gộp lại không khớp `/swiftshader/i`.
3. **B · WebGL2:**
   - `getContext('webgl2', { failIfMajorPerformanceCaveat: true })` phải thành công.
   - `WEBGL_debug_renderer_info` không được khớp `/SwiftShader|llvmpipe|Software|Basic Render/i`. Cờ `failIfMajorPerformanceCaveat` vẫn cho SwiftShader đi qua, nên chỉ phép kiểm tên renderer này mới bắt được.
4. **Còn lại là C · Tranh tĩnh.**
5. Bất kỳ ngoại lệ nào trong một phép dò đều tính là phép dò đó thất bại. `detectTier` không bao giờ ném lỗi.

**Sau `renderer.init()`:** tầng trên huy hiệu và trong `ctx.tier` là backend thật (`renderer.backend.isWebGPUBackend`).

### `window.__sma` (từ GĐ 0, có cả ở tầng tĩnh)
- `boot.js` tạo `window.__sma = { state, tier, backend: null, level: null, frames: 0, reason: null, error: null }`. `state` luôn bằng `body[data-state]`.
- `run.js` cập nhật `backend`, `level` và `frames`.
- Mỗi lần về tầng tĩnh, `reason` được ghi một trong các giá trị `'flag' | 'no-gpu' | 'chunk-load' | 'timeout' | 'frame-errors' | 'gpu-error' | 'device-lost' | 'error'`.
- GĐ 2 thêm `layers()`, `setWeight(id, v)`, `snapshot()` và `restore()` qua `sma.expose()`, khi cảnh đã live. `expose()` trả hàm gỡ đúng các hàm đó (dựng lại cảnh thì gắn hàm mới). `setWeight` đặt ngay (không tween) và trả Promise xong khi khung đã được vẽ lại.
- GĐ 2 thêm trạng thái `'lost'` (mất GPU lần đầu, đang chờ "Dựng lại cảnh"): e2e chờ `live`/`static` nên không coi `lost` là ổn định.
- GĐ 3 thêm `quality()` (mức, các nấc đang hạ, đang canh hay không, có đang coi là bị khóa nhịp không), `degrade()` và
  `upgrade()` (hạ/nâng tay một nấc; Promise xong khi khung đã vẽ lại, trả `false` khi không còn nấc), và `stats()` (draw call,
  tam giác, ms mỗi khung, ms CPU của khung vừa vẽ). Cả bốn đi qua bàn thợ, như các hàm của GĐ 2.
- GĐ 4 thêm, cũng qua bàn thợ:
  - `tools()` và `setTool(id | null)`;
  - `dials()` và `setDial(id, v)`: e2e dùng, trả Promise như `setWeight`;
  - `stats().gpuMs`;
  - `quality().gpu` và `quality().locked`.

  Cờ `?poster` không đổi gì trong `__sma`.
- GĐ 5 thêm `readouts(layerId)`: số đo riêng của một lớp, qua bàn thợ (e2e đọc số hoa đăng đang trôi; DevTools xem mọi số đo mà không
  phải mở Sổ tay).
- GĐ 9 thêm `recipe()` (chuỗi công thức hiện tại, không có `#r=`), `applyRecipe(text)` và `translate(layerId)` (bản dịch của lớp, như
  Sổ tay đọc, bắt từ khung vẽ kế tiếp; §21.3), cũng qua bàn thợ.

### Tranh tĩnh (tầng C) của một bức: `showStatic(entry, shell, { reason, error })`, gọi nhiều lần vẫn an toàn
- (GĐ 5) Không có quầng trăng: tầng tĩnh không tải gì để chờ. Rơi về tĩnh giữa lúc tải thì quầng biến mất ngay.
- Luôn có: poster, thơ và con dấu lấy từ HTML của chính bức đó. GĐ 1 thêm trăng SVG vào `[data-moon]` nếu trang có ô này. GĐ 2 thêm Sổ tay chỉ đọc: nút "Xem {n} lớp của bức tranh" trong ô ghi chú (trừ lý do `chunk-load`), tải `ui/workshop.js` và chữ của bức bằng `import()` động; vẫn không tải three.
- Thêm theo lý do:
  - `'flag'`: không thêm gì.
  - `'no-gpu'`: hướng dẫn kiểm tra `chrome://gpu` và bật "Use hardware acceleration when available".
  - `'chunk-load'`: "Trang vừa được cập nhật, tải lại nhé", kèm nút tải lại.
  - `'timeout'` (GĐ 1): "Mạng chậm hoặc máy đang bận nên cảnh 3D chưa kịp dựng. Tải lại thử nhé.", kèm nút tải lại. Không gợi ý `?debug`, vì quá hạn thường không phải lỗi.
  - Các lý do khác: "Cảnh 3D gặp lỗi trên máy này", kèm gợi ý `?debug`.
- Có `?debug` thì in thêm `error.message`.

### Bảng lỗi (không bao giờ có màn hình trắng)
| Chỗ hỏng | Hệ quả |
|---|---|
| `detectTier` gặp ngoại lệ | Phép dò đó thất bại; nếu không còn gì thì tầng tĩnh (`no-gpu`) |
| `import()` chunk lỗi: do mạng, hoặc do HTML cũ trỏ tới chunk đã bị xóa sau lần deploy mới (`vite:preloadError`) | Tầng tĩnh (`chunk-load`) |
| Tải content lỗi (GĐ 1+) | 3D vẫn chạy; Sổ tay báo không tải được chữ |
| `setup`/`createLayer` ném lỗi | Gỡ những gì đã tạo, rồi tầng tĩnh (`error`) |
| `compileAsync` bị reject, hoặc khởi động quá 10 giây | Tầng tĩnh (`timeout`/`error`). Phần khởi động xong trễ tự dọn qua disposer đã đóng |
| Lỗi JS trong một khung | Ghi log, bỏ qua khung đó; **3 khung lỗi liên tiếp** thì tầng tĩnh (`frame-errors`) |
| **Lỗi GPU không đồng bộ** (`renderer.onError`: lỗi validation, hết bộ nhớ, lỗi nội bộ; không ném từ `render()`) | Mỗi lần gọi tính là một lỗi; 3 lần trong 1 giây thì tầng tĩnh (`gpu-error`) |
| Mất context/device (`renderer.onDeviceLost`) | GĐ 0–1: tầng tĩnh (`device-lost`). GĐ 2: lần đầu hiện poster và nút "Dựng lại cảnh"; bấm thì tạo **renderer và canvas mới** (WebGPURenderer không tự khôi phục được) rồi `restore(snapshot)`; lần 2 thì tầng tĩnh |
| `dispose()` của một lớp ném lỗi | Ghi log, vẫn gỡ tiếp phần còn lại |
| (GĐ 2) Công cụ `?debug` tải hỏng, hay `update()` của nó ném lỗi | Cảnh báo, tắt công cụ; cảnh vẫn chạy (không tính là khung lỗi, không tính vào hạn 10 giây) |
| (GĐ 2) Núm hay thí nghiệm áp không được (onKnob ném lỗi) | Ghi log, báo một dòng ở đáy Sổ tay; núm và nút đọc lại trạng thái thật (giá trị hỏng không vào snapshot); cảnh vẫn chạy. `restore` bỏ qua núm hỏng, nên "Dựng lại cảnh" không vì thế mà về tĩnh |
| (GĐ 2) Chunk Tweakpane (tab Chỉnh) tải hỏng | Ô núm báo lỗi thay cho "Đang tải…"; mở lại tab thì tải lại |
| (GĐ 2) Chunk Sổ tay chỉ đọc (tầng tĩnh) tải hỏng | Ghi chú thành lời nhắc tải lại, như lý do `chunk-load` |
| (GĐ 2) Vẽ lại khung đứng yên (`?freeze`) ném lỗi | Promise của thay đổi hỏng theo (không treo); Sổ tay báo, `__sma.setWeight` trả lỗi |
| (GĐ 4) Một công cụ ném lỗi khi gắn (`mount`) hay khi ghép overlay | Cảnh báo và bỏ công cụ đó (không có nút của nó); cảnh và công cụ còn lại vẫn chạy |
| (GĐ 4) `requireView` hỏng (biên dịch lại lỗi) | Thanh công cụ báo "không mài được view này" và quay về view trước; cảnh vẫn chạy |
| (GĐ 4) `resolveTimestampsAsync` bị reject, hay trả số vô lý (≤ 0, không hữu hạn) | Bỏ mẫu đó. Hỏng 3 lần liền thì tắt đo GPU cho phiên này: bộ điều chỉnh và Sổ tay chạy như GĐ 3 |
| (GĐ 5) `ctx.captions.show` với khóa không có trong `content.captions` (hay chữ tải hỏng) | Không hiện gì; có `?debug` thì cảnh báo. Đèn vẫn được thả |
| (GĐ 5) `anchor()` ném lỗi, trả `undefined` hay số không hữu hạn | Ẩn chữ ở khung đó, cảnh báo một lần cho mỗi dòng chữ; không tính là khung lỗi. Trả `null` không phải lỗi: bức nói khung đó không có điểm neo, chữ ẩn mà không cảnh báo |
| (GĐ 5) Móc lần vẽ ném lỗi | Lỗi đi lên `render()` như mọi lỗi trong khung (3 khung lỗi liên tiếp thì tầng tĩnh). `stop()` luôn trả hàm vẽ cũ, kể cả khi công cụ bị gỡ vì lỗi |
| (GĐ 5) "Dựng lại cảnh" quá 10 giây, kể cả khi `createStage`, `restore(snapshot)`, `compile()` hay lúc hòa dần còn dở (lỗi có từ GĐ 2) | Tầng tĩnh (`timeout`), báo một lần; sân khấu và cảnh của lần dựng đó gỡ ngay lúc quá hạn; `createStage` còn dở thì chưa có sân khấu để gỡ, và sân khấu bị gỡ ngay khi tới muộn (disposer đã đóng, `add()` gỡ ngay). Phần xong muộn chỉ tự dọn, không gọi gì khác tới vỏ trang, `__sma`, sân khấu hay cảnh (`run.js#bringUp` kiểm `gone()` trước việc đầu tiên và sau mỗi lần chờ). Boot chỉ khóa vỏ trang khi LẦN MỞ TRANG quá hạn hay hỏng; hạn của "Dựng lại cảnh" là của run.js, nên run.js phải tự dừng |
| (GĐ 5) Lần mở trang đã quá 10 giây (tầng tĩnh `timeout`) mà phần 3D còn đang dựng, rồi mất GPU hay 3 lỗi GPU trong 1 giây (lỗi có từ GĐ 1) | Bỏ qua: không về tĩnh lần hai, lý do vẫn là `timeout` (`onLost`, `onError` của run.js xét `stopped()`). Lần dựng tự dọn ở lần kiểm `gone()` kế tiếp |

## 10. Hiệu năng và chất lượng

### Mức chất lượng
**Xưởng chọn mức** (`engine/quality.js#pickLevel`):

| | desktop | điện thoại |
|---|---|---|
| WebGPU | cao | vừa |
| WebGL2 | vừa | thấp |

- "Điện thoại" do `isMobile({ userAgent, maxTouchPoints })` xác định: UA khớp `/Android|iPhone|iPad|Mobile/i`, hoặc `maxTouchPoints > 1` trên UA `Macintosh` (iPadOS).
- Mức mặc định của xưởng chỉ có `dpr` (cao 2 / vừa 1.5 / thấp 1.25). Bức ghép thêm các khóa của nó.
- (GĐ 3) Cờ `?level=cao|vua|thap` ép mức, bỏ qua bảng trên (§8.7).

**Bảng của Bức 1** (`paintings/ao-sen-dem/quality.js`, GĐ 3; trước đó các lớp v0 dùng số ở cột mặc định):

| Mức | DPR tối đa | Phản chiếu | Đom đóm | Lá | Bóng | Bloom (`resolutionScale`) | Octave sương (GĐ 3) | Hoa đăng (GĐ 5) |
|---|---|---|---|---|---|---|---|---|
| **cao** | 2 | 0.5 | 3.000 | 1.200 | 1024 | 0.5 (mặc định của BloomNode) | 3 | 8 |
| **vừa** | 1.5 | 0.35 | 1.500 | 800 | 512 | 0.25 | 2 | 6 |
| **thấp** | 1.25 | giả | 600 | 500 | tắt | 0.25 | 1 | 4 |

(GĐ 3) Khóa trong `quality.js`: `dpr`, `reflection` (0 = phản chiếu giả), `fireflies`, `leaves`, `shadow` (0 = tắt), `bloom`, `fogOctaves`.
(GĐ 5) Thêm `lanterns`: số hoa đăng trôi tối đa. Số này để ao không rối mắt hơn là để giữ nhịp khung: mọi đèn chung một draw call.
Hoa đăng không có nấc hạ chất lượng.

### Bộ điều chỉnh tự động (xưởng, GĐ 3)
- **Ngân sách khung:** 16,7 ms (60fps) trên desktop, 22,2 ms (45fps) trên điện thoại.
- Đo frame time trung bình theo cửa sổ 2 giây.
- Hai cửa sổ liên tiếp vượt ngân sách × 1,2 thì hạ một nấc theo `ladder` của bức. Với Bức 1: `dpr` (−0,25 mỗi nấc) → `suong.chi-tiet` → `mat-nuoc.phan-chieu` → `phu-bong.bloom` → `vang-la.dom-dom` → `anh-trang.bong`. (GĐ 3 chen `suong.chi-tiet` lên sớm: noise của sương chạy trên gần như mọi điểm ảnh, bớt octave ít thấy nhất; vị trí chốt lại sau khi đo trên máy thật.)
- Năm cửa sổ liên tiếp "dư" thì nâng một nấc, nhưng không vượt mức ban đầu.
- **Nấc chỉ hạ trần, không ghi vào núm.** Hiệu lực = min(núm, trần).
- **Nấc không đổi thứ nằm trong cache key.** (GĐ 3) Shadow map đã tĩnh sẵn (§6 Lớp 2), nên nấc `anh-trang.bong` chỉ hạ `mapSize` rồi vẽ lại bóng một lần. Không bao giờ đổi `castShadow`, `receiveShadow` hay `shadowMap.enabled`, vì đổi các thứ đó sẽ biên dịch lại mọi material có ánh sáng.

**(GĐ 3) Ba cái bẫy khi đo bằng nhịp `requestAnimationFrame`, và cách tránh:**
1. **Màn 60 Hz không bao giờ "dư".** Trình duyệt khóa nhịp rAF theo màn hình: khung 16,7 ms không bao giờ dưới 0,7 × 16,7 = 11,7 ms.
   Chỉ một lần giật tạm (mở app khác) là hạ nấc mãi mãi. Vì vậy một cửa sổ là "dư" khi trung bình dưới 0,7 × ngân sách, **hoặc**
   trung bình không quá 1,05 × ngân sách và không rớt khung nào. Rớt khung đếm trên cả cửa sổ: số nhịp 60 khung/giây đã trôi qua
   trừ số khung đã vẽ, thiếu từ 0,75 nhịp trở lên mới tính. Không so từng khoảng với trung vị: sau bộ chặn 60 khung/giây, màn
   72/75/85/144 Hz có nhịp lệch đều (75 Hz: 26,7 + 13,3 + 13,3 + 13,3 ms) mà không rớt khung nào; so với trung vị thì khoảng
   dài ấy thành "rớt khung" ở mọi cửa sổ và các màn đó không bao giờ nâng lại được (review GĐ 3 tìm ra).
   Chống dao động: nâng một nấc mà trong 3 cửa sổ sau lại phải hạ đúng nấc đó thì khóa nấc ấy, không nâng nó nữa trong phiên.
2. **Trình duyệt khóa ở 30 fps** (Energy Saver của Chrome khi chạy pin, Low Power Mode của iPhone): hạ nấc nào cũng không nhanh hơn.
   (Sau GĐ 5) **Thử ngừng vẽ:** lần hạ đầu của một đợt hạ (lúc mới live, sau một lần nâng, hay sau khi hết khóa nhịp) được thay bằng
   một lần thử. Xưởng
   không vẽ gì trong 6 nhịp rAF (`tuner.sample()` trả `'skip'`; `scene.js` bỏ cả khung: không vẽ, không tiến đồng hồ, ảnh cũ ở lại),
   bỏ 2 khoảng đầu (GPU làm nốt các khung đã gửi) rồi lấy trung vị phần còn lại. Không vẽ gì mà nhịp vẫn chậm hơn 1,2 × ngân sách
   thì trình duyệt đang khóa nhịp: vào "bị khóa nhịp" ngay, với mốc "nhịp bị khóa" là chính nhịp đo được lúc không vẽ. Máy vẽ chậm
   hơn cả nhịp ấy (tiết kiệm pin còn hạ xung nhịp GPU) thì luật "quá tải thật" ở dưới vẫn hạ về lại nhịp ấy; không thì không hạ nấc
   nào. Nhanh lên thì máy là nút cổ chai: hạ như cũ, không thử lại tới lần nâng sau. Sổ tay mở thì không thử (người xem đang nhìn cảnh); khoảng lạ (tab ẩn, debugger) thì bỏ lần thử, đo lại hai
   cửa sổ rồi thử lại. Đo trên GPU Apple, rAF giả 30 Hz: luật cũ hạ 5 nấc từ giây 6 tới giây 22 rồi mới trả lại hết; giờ "bị khóa
   nhịp" ở giây 6,4, không hạ nấc nào (Phụ lục A.76).
   **Lưới an toàn** (GĐ 3, vẫn giữ cho máy mà lần thử nói "không kịp" nhưng hạ nấc không giúp gì): mốc "lúc bắt đầu hạ" là trung bình của cửa sổ khiến hạ nấc đầu tiên, ghi cả khi Sổ tay đang mở, và bỏ đi khi đã nâng về hết
   nấc (lần hạ sau đo mốc mới; dùng lại mốc cũ thì có thể trả nấc sai lúc, review GĐ 3 tìm ra).
   Khi đã hạ hết thang (từ lúc chưa hạ nấc nào) mà trung bình vẫn không nhanh hơn 10% so với lúc bắt đầu hạ, thì đó là nhịp
   bị khóa, không phải GPU yếu: trả lại mọi nấc và thôi hạ ("bị khóa nhịp"). Hết khóa khi nhịp nhanh hẳn lên: trung bình
   ≤ 1,05 × ngân sách (cùng dung sai với "dư vừa", nên màn 59,94 Hz hay một khung rớt lẻ vẫn thoát được), hoặc nhanh hơn nhịp
   bị khóa ÷ 1,25. Còn khóa mà chậm hẳn hơn nhịp bị khóa (× 1,25, 2 cửa sổ liền: người xem kéo 200.000 đom đóm) là quá tải
   thật: vẫn hạ, kể cả khi Sổ tay mở, để về lại nhịp bị khóa rồi dừng. Về lại đúng nhịp bị khóa 5 cửa sổ liền (người xem trả
   núm về) thì trả dần các nấc ấy, như luật "dư" (Sổ tay mở thì chờ; trả mà quá tải lại ngay thì khóa nấc ấy, nhưng chỉ tới
   khi hết khóa nhịp: cắm sạc thì mọi nấc luôn trả lại được).
3. **Sổ tay cố ý làm chậm** (tắt instancing, nhiều đom đóm, CPU vs GPU): hạ nấc vì chậm vừa phải thì số đo sai, bài học hỏng;
   nhưng để máy bị ép quá sức thì trái mục tiêu hợp nhiều phần cứng. Vì vậy khi thanh lớp mở, bộ điều chỉnh chuyển sang chế độ
   **canh**: chậm vừa phải thì để yên, chỉ hạ khi quá tải NẶNG (trung bình > 2,2 × ngân sách trong 2 cửa sổ), không bao giờ nâng.
   Đóng thanh lớp thì về như thường (cửa sổ mới, có khởi động).

**(GĐ 3) Không ép phần cứng quá sức** (Bao, GĐ 3: sản phẩm phải hợp nhiều loại máy):
- **Trần 60 khung/giây** (`engine/gpu/clock.js#createFrameCap`, run.js): màn 90/120/144 Hz không bắt GPU vẽ gấp đôi. Mốc "đã vẽ"
  tiến đều từng bước 1/60 s nên màn 90 Hz vẽ xen kẽ, trung bình vẫn 60; màn 60 Hz và máy chậm không bỏ khung nào. `?freeze`
  vẫn tất định (đồng hồ đếm khung đã vẽ).
- **Trần núm theo mức:** `Knob.max` có thể là hàm của env (hợp đồng thêm dạng tùy chọn, §8.4), như `value`. Bức 1 đặt trần theo
  mức cho ba núm nặng nhất: số đom đóm, độ phân giải phản chiếu, số octave của sương (§6).
- **Bộ điều chỉnh canh cả khi Sổ tay mở** (bẫy 3 ở trên), và **thí nghiệm có trần**: "CPU vs GPU" tối đa 5.000 con, "Tắt instancing"
  tối đa 1.200/600/300 Mesh theo mức (GĐ 2).
- **Mặc định nhẹ theo mức** (bảng trên): phản chiếu giả và không bóng ở mức thấp, octave sương 3/2/1, bóng tĩnh ở mọi mức.

**(GĐ 3) Chi tiết:**
- Khoảng giữa hai khung dài hơn 250 ms (tab bị ẩn, dừng ở debugger, biên dịch) thì bỏ cả cửa sổ đang đo. 2 giây đầu sau khi live
  hay sau khi chạy lại cũng bỏ (còn biên dịch dở).
- Có `?freeze` thì không có bộ điều chỉnh: ảnh phải tất định. `__sma.degrade()` / `upgrade()` vẫn hạ/nâng tay được (e2e dùng).
- Nấc `dpr` nở thành nhiều nấc, mỗi nấc −0,25, tính từ DPR thật lúc dựng (`min(devicePixelRatio, budget.dpr)`) xuống tới 1.
  Màn DPR 1 thì không có nấc `dpr` nào.
- Mục nào của `ladder` không có lớp nào đưa ra ở mức hiện tại thì bỏ qua (ví dụ `anh-trang.bong` ở mức thấp). Test hợp đồng giữ
  mọi mục của `ladder` trỏ tới một lớp có thật, và ở mức cao lớp đó có nấc ấy.

**(GĐ 3) Các nấc của Bức 1:**

| Nấc | Làm gì (hiệu lực = min(núm, trần)) | Sàn |
|---|---|---|
| `dpr` | trần DPR −0,25 | 1 |
| `suong.chi-tiet` | trần số octave của sương về 1 | 1 |
| `mat-nuoc.phan-chieu` | trần độ phân giải phản chiếu × 0,5 | 0,15 |
| `phu-bong.bloom` | `resolutionScale` của bloom × 0,5 | — |
| `vang-la.dom-dom` | trần số đom đóm = nửa số mặc định của mức | 100 |
| `anh-trang.bong` | trần `mapSize` ÷ 2, rồi vẽ lại bóng một lần | 256 |

### Bộ điều chỉnh đo được thời gian GPU: chẩn đoán theo máy (GĐ 4)
Chỉ nhìn nhịp rAF thì không phân biệt được "GPU không kịp" với "trình duyệt khóa nhịp". Một laptop yếu cần 20 ms mỗi khung trên màn
60 Hz, và một máy khóa 30 fps vì tiết kiệm pin, cho ra đúng cùng một nhịp: 33 ms. Thời gian GPU thật tách được hai trường hợp này.

**Lấy số** (`gpu/gpu-timer.js`):
- Renderer được tạo với `trackTimestamp: true` (Phụ lục A.40):
  - WebGPU tự tắt cờ lúc `init` nếu adapter không có `timestamp-query`;
  - WebGL2 chỉ đo khi có `EXT_disjoint_timer_query_webgl2`.
- Sau mỗi `render()`, nếu không có lần resolve nào đang dở thì gọi `resolveTimestampsAsync('render')` và `('compute')`, không chờ kết
  quả. Hai số cộng lại thành ms GPU của một khung.
- Mẫu đến trễ vài khung và không đều. Cửa sổ 2 giây vẫn đủ mẫu.
- Máy được coi là "đo được" khi đã có ít nhất một mẫu hợp lệ: hữu hạn, lớn hơn 0, và không lớn hơn 1,5 lần nhịp khung trung bình
  của mẻ đó (`GPU_PLAUSIBLE`).
  - Mỗi lần hỏi, three gom các khung đã vẽ từ lần hỏi trước thành một mẻ, rồi trả tổng thời gian các pass của khung cuối mẻ. GPU
    vẽ lần lượt từng pass thì không thể bận lâu hơn nhịp khung.
  - Mẻ không có nhịp khung đáng tin thì không có trần: lần hỏi đầu (chưa có mốc), hay mẻ có nhịp trung bình dài hơn một lần nghẽn
    (`TUNER.hiccupMs`, 250 ms: lúc hòa dần, tab ẩn). Mẫu hợp lệ của mẻ đó bị bỏ mà không tính là hỏng: số chưa kiểm được thì không
    vào Sổ tay hay bộ điều chỉnh.
  - (Dựng thử GĐ 4) GPU Apple trên Chrome báo thời lượng các pass chồng lên nhau: 16 pass, mỗi pass khoảng 10 ms, kể cả các lượt
    bloom rất nhỏ. three cộng lại thành khoảng 160 ms cho một khung 16,7 ms (Phụ lục A.48). Luật 1,5 lần loại các số đó: mẫu của lần
    hỏi đầu bị bỏ, ba mẫu có trần kế tiếp đều vô lý, nên việc đo thôi ngay sau khi live, Sổ tay không bao giờ hiện 160 ms, và bộ
    điều chỉnh đi đường nhịp.
  - Máy nặng lên đột ngột (bật một thí nghiệm nặng) chỉ lệch một mẫu, vì mẻ sau đã đo theo nhịp mới.

**Phân loại một cửa sổ** (`engine/tuner.js`), khi cửa sổ có từ 3 mẫu GPU trở lên. Tải = max(trung vị ms GPU, trung bình ms CPU):
- **Quá tải:** trung bình nhịp > ngân sách × 1,05 **và** tải > ngân sách × 0,85, tức máy là nút cổ chai.
  - Hạ nấc sau 2 cửa sổ liền, kể cả khi nhịp trông như bị khóa 30 fps.
  - Nhờ vậy laptop yếu không còn kẹt ở 30 fps với đủ chi tiết.
- **Bị khóa nhịp:** trung bình nhịp > ngân sách × 1,2 mà tải < ngân sách × 0,5, tức trình duyệt đang khóa. Vào "bị khóa nhịp" ngay,
  không phải hạ hết thang rồi trả lại.
- **Dư:** tải < ngân sách × 0,6. Nâng nấc sau 5 cửa sổ liền, dù màn chạy 60,1 Hz, 75 Hz hay đang bị khóa nhịp.
- **Còn lại:** để yên.
- **Thoát "bị khóa nhịp":** như GĐ 3, khi trung bình nhịp ≤ ngân sách × 1,05. Trong lúc bị khóa, luật "quá tải" và luật "dư" vẫn chạy
  theo tải. Vì vậy các nấc đã hạ trước đó được trả lại dần khi máy dư, không phải chờ hết khóa.
- **Chế độ canh** (Sổ tay mở) giữ như GĐ 3: chỉ hạ khi tải > ngân sách × 2,2, không bao giờ nâng.
- **Dùng chung với đường nhịp của GĐ 3:** cửa sổ, khởi động, bỏ cửa sổ khi giật, chống dao động, khóa nấc.
- Các ngưỡng 0,5 / 0,6 / 0,85 vẫn là số khởi đầu. Máy dựng thử (GPU Apple) không cho số dùng được. Trên SwiftShader mọi phép vẽ
  chạy trên CPU, nên ms GPU gần bằng nhịp khung (khoảng 300 ms). Việc kiểm các ngưỡng trên một máy Windows hay Linux có GPU thật
  nằm trong mục kiểm tra thủ công (§12). Nếu lệch nhiều thì sửa số trong `TUNER` (`engine/tuner.js`), test sửa theo.

**Không đo được** (Safari, nhiều điện thoại, WebGL2 không có extension, GPU Apple trên Chrome vì số chồng nhau): chạy y hệt GĐ 3.

**Kèm theo:**
- `quality()` có thêm `gpu` (đo được hay không) và `locked`.
- Huy hiệu nói đúng khi có nấc bị khóa (§4.1). Sổ tay có ms GPU.
- `quality.js` chỉ còn chọn mức và ghép ngân sách. Bộ điều chỉnh tách sang `engine/tuner.js`, vẫn là hàm thuần, không three.

**(GĐ 4) Sửa các lỗi còn lại của bộ điều chỉnh GĐ 3:**
- **Trần 60 khung/giây bỏ nhầm khung.** Trên các màn "60 Hz" thật ra chạy 60,02–60,1 Hz, mỗi phút bỏ 2–15 khung (đo khi dựng thử
  GĐ 4, nhịp dao động 0–1 ms), tức hình giật một nhịp vài giây một lần.
  - Nguyên nhân: mốc "đã vẽ" tiến đúng 16,67 ms mỗi bước, còn nhịp màn hình ngắn hơn một chút. Độ lệch dồn dần, tới lúc quá 1,5 ms
    thì một khung bị bỏ.
  - Sửa: `createFrameCap` đo nhịp màn hình, bằng trung bình trượt của mọi khoảng rAF (kể cả khung bị bỏ).
    - Màn có nhịp từ khoảng 15,9 ms trở lên (tức ≤ ~63 Hz) thì không bỏ khung nào.
    - Màn nhanh hơn thì vẫn chặn như GĐ 3: 90 Hz vẽ xen kẽ, trung bình 60.
- **Đo từ lúc `live`:** không tính khung ẩn và lúc hòa dần.
- **Đường nhịp (máy không đo được GPU):** mốc "lúc bắt đầu hạ" được đo lại ở lần hạ đầu tiên sau mỗi lần nâng, không chỉ khi đã nâng
  về hết.
- **Còn để sau (§16):**
  - Trên đường nhịp: nấc đã hạ lúc canh rồi đóng thanh lớp khi đang bị khóa nhịp thì vẫn giữ tới khi hết khóa.
  - Khóa nấc vẫn kéo dài cả phiên. Huy hiệu đã nói thật về điều này.

### Ngân sách
- **Draw call:** `renderer.info.render.drawCalls` đếm mọi pass.
  - Tổng mỗi khung = `cảnh + (cảnh − 1) [phản chiếu] + 2 × bóng [bóng vẽ lại cho camera của reflector] + 12 [bloom] + 1 [FXAA] + 1 [quad]`.
  - "Cảnh" là số đối tượng renderable trong scene; riêng ao sen khoảng 5.
  - Mục tiêu ở mức cao: cảnh ≤ 10 và tổng ≤ 45. Cảnh thử 4 đối tượng đã đo được 21.
  - (GĐ 3) Bóng tĩnh chỉ vẽ khi có thay đổi, nên khung thường không có phần `2 × bóng`. Bức 1 đủ sáu lớp có 11 đối tượng (Cốt 6,
    trăng, đèn hoa đăng, vòm trời, mặt nước, đom đóm): `11 + 10 + 12 + 1 = 34` ở mức cao, **đo được đúng 34** trên cả WebGPU lẫn
    WebGL2; mức thấp không có phản chiếu nên đo được 24. Mục tiêu chính là **tổng ≤ 45** (e2e đo ở mức cao).
  - (GĐ 4) FXAA vẽ chuỗi display ra một RTT, thêm 1 lượt vẽ: mức cao đo được 35 ở 1280×800 và 33 ở 390×844; e2e vẫn giữ ≤ 45. Overlay của công cụ nằm trong
    lượt cuối nên không thêm lượt vẽ. View Normal (`requireView`) thêm một target MRT, cũng không thêm lượt vẽ.
  - (GĐ 5) Hoa đăng gộp vào InstancedMesh của đèn ở bờ, nên draw call không đổi: mức cao vẫn 35. E2e đo trên WebGPU (SwiftShader
    và GPU thật): 35 trước khi thả, 35 khi có hai đèn trôi. Từng sợi không thêm lượt vẽ; khi xem sợi k < N, khung còn ít lượt vẽ hơn.
- (GĐ 5) **Chi phí lúc chưa dùng tính năng mới:**
  - Từng sợi: không có móc nào khi công cụ tắt.
  - Chữ đi theo vật: không chiếu gì khi không có chữ.
  - Quầng trăng: chỉ CSS, và chỉ trong lúc tải.
  - Hoa đăng: không có đèn trôi thì CPU không ghi ma trận hay thuộc tính nào, và vòng lặp vũng sáng trong shader của nước `Break`
    ngay. Ma trận của 80 cánh (5 KB) và mảng `lanternPool` vẫn được chép lên GPU ở mỗi lượt vẽ, như mọi uniform buffer của từng vật
    ở r186 (Phụ lục A.64). Shader của đèn chỉ thêm độ cao gợn (như lá) và hệ số sương; số pipeline không đổi.
  - JS: đường 3D thêm 7,4 kB gzip (306,57 → 313,97 kB, đo ngày 2026-10-03); chi tiết từng chunk trong README.
- **Poster:** WebP 150 KB trở xuống (GĐ 4). `og.jpg` 1200×630, 200 KB trở xuống.
- **JS:**
  - Chunk `three` đo được khoảng 243 KB gzip. Con số này gần như cố định, vì `three/tsl` kéo cả namespace nên không tree-shake được.
  - Toàn bộ cảnh ước khoảng 253 KB; cộng Tweakpane khoảng 284 KB. (GĐ 2 đo được: đường 3D 289 KB, gồm cả Sổ tay và chữ của nó; cộng Tweakpane 320 KB. GĐ 3 đo được: đường 3D 297,8 KB; cộng Tweakpane 328,8 KB. GĐ 4 đo được: đường 3D 306,6 KB; cộng Tweakpane 337,5 KB. GĐ 5 đo được: đường 3D 314,0 KB; cộng Tweakpane 344,9 KB.)
  - Mục tiêu cho cả đường 3D: **450 KB gzip trở xuống**. Số đo ghi vào README.
  - (GĐ 4) Đồ nghề, Dial, LUT và chặng display đi cùng đường 3D; `@axe-core/playwright` chỉ là gói dev, không vào bundle.
  - (GĐ 5) Quầng trăng nằm ở chunk vào (đường nhẹ, cả tầng tĩnh tải); Từng sợi, móc lần vẽ và chữ đi theo vật ở `run`; hoa đăng ở
    `painting`; thơ ở `content`. Code của hai file mới (`anh-trang-lantern`, `anh-trang-drift`) là hai chunk `?code`, chỉ tải khi
    mở tab Chỉnh của lớp Ánh trăng.
  - Inspector (39 KB) và stats-gl (10 KB) chỉ tải khi có `?debug`.
- **Máy yếu:** biên dịch trước bằng `scenePass.compileAsync(renderer)`, rồi vẽ một khung ẩn trong lúc poster còn hiện.
- (GĐ 4) **Đo trên máy dựng thử** (GPU Apple, Chrome, cảnh live): đủ 60 khung/giây ở cả ba mức, ở 1280×800 (DPR 2) và 390×844
  (DPR 3). ms CPU mỗi khung khoảng 1,2–1,8 ms.
- **`prefers-reduced-motion`:** `CameraSpec.breathe` bị ép về 0, gợn sóng nhẹ hơn.

## 11. Âm lịch và pha trăng (`src/lib/astro/`, chỉ trả về số)

**`lunar.js`:**
- Thuật toán Hồ Ngọc Đức, múi giờ là tham số (mặc định +7).
- Hàm chính:
  - `convertSolar2Lunar(d, m, y, tz)` trả `{ day, month, year, leap }`.
  - `convertLunar2Solar`, trả `null` với tháng nhuận không tồn tại.
  - `newMoon(k)` trả `{ k, jd, day }`: JD chính xác và ngày nguyên.
  - `lunarFromDate(date, tz)` đọc ngày theo UTC+tz, nên kết quả không phụ thuộc múi giờ của máy.
  - `canChiIndex(year)` trả `{ can: 0–9, chi: 0–11 }`.
- **Không có chữ:** bảng tên tháng, can và chi nằm ở `ui/strings.vi.js`.

**`moon.js`:**
- `moonPhase(date)` trả `{ phase, age, illumination, waxing }`.
  - Tuổi trăng tính từ trăng mới **đã xảy ra** gần nhất (dùng JD chính xác của `lunar.js`), nên không bao giờ âm.
  - `phase` đi từ 0 đến 2π: 0 là trăng mới, π là trăng tròn. Độ sáng `(1 − cos(phase))/2`.
  - Pha được nội suy thẳng theo từng đoạn trăng mới → trăng tròn → trăng mới. Kết quả đúng tại trăng mới và trăng tròn; sai số lớn nhất so với Meeus ch.48 là 0,074, ở gần trăng bán nguyệt. Có test khóa sai số dưới 0,08 cho năm 2026.
- `sunDirection(phase)` trả vector đơn vị trong view space của three (+x phải, +y lên, +z hướng về người xem). Vector thỏa `(1 + L·V)/2 = độ sáng`.
- `tonight(date, tz)` trả `{ instant, isNight, evening }`:
  - `isNight` đúng khi giờ địa phương từ 18:00 đến trước 05:30.
  - `evening` là 00:00 địa phương của ngày mà đêm bắt đầu.
- `hourOfNight(instant, evening)` trả số giờ tính từ `evening` (21:00 → 21, 02:00 hôm sau → 26).

**Nhãn con dấu:** `t.formatSeal({ day, month, leap, can, chi })` trong `ui/strings.vi.js` trả `"{ngày} tháng {Tên tháng}{ nhuận?} · {Can Chi}"`.
- Tên tháng: Giêng, Hai, Ba, Tư, Năm, Sáu, Bảy, Tám, Chín, Mười, **Mười Một**, Chạp. Tháng 11 mặc định là "Mười Một", vì ngày nay "tháng Một" dễ bị hiểu là tháng 1 dương lịch. Cách gọi cổ "Một" có qua `{ traditional: true }`.
- Can chi lấy theo **năm âm lịch**: một ngày cuối tháng Giêng dương lịch trước Tết vẫn mang can chi của năm cũ.
- `ui/shell.js` ghép `lunarFromDate(now)` với `canChiIndex(year)` rồi gọi `t.formatSeal`.

## 12. Kiểm thử

**(GĐ 5) Số test của bản dựng thử:** Vitest 73 file, 860 test (trước GĐ 5: 62 file, 687 test). E2e: mỗi project liệt kê 40
test; `static` chạy 6, mỗi project 3D (`webgl2-swiftshader`, `webgpu-swiftshader`, `webgpu-real-gpu`) chạy 33, còn lại Playwright
ghi "skipped" vì chúng thuộc project khác. Cổng chặn của CI (`static` + `webgl2-swiftshader`) chạy 39 test.

### Unit (Vitest 5, môi trường `node`; file nào cần DOM thì ghi `// @vitest-environment jsdom` ở dòng 1)
- **`lunar`:**
  - Tết 2024 = 2024-02-10, Tết 2025 = 2025-01-29, Tết 2026 = 2026-02-17.
  - Trung Thu 2025 = 2025-10-06, Trung Thu 2026 = 2026-09-25.
  - 2026-09-28 = ngày 18 tháng 8, năm 2026, `canChiIndex(2026)` là Bính Ngọ.
  - Tháng nhuận: 2023 nhuận tháng 2; các năm nhuận 2017–2033 khớp lịch.
  - Múi giờ: Tết 1985 là 21/1 ở +7 nhưng 20/2 ở +8.
  - Chạy đúng với mọi `TZ` của máy.
  - Mọi dữ liệu đã được đối chiếu độc lập bằng thuật toán Meeus.
- **`moon`:**
  - Độ sáng lớn hơn 0,97 lúc 21:00 +07:00 các đêm trăng tròn 2026-03-03, 2026-08-28, 2026-09-26.
  - Độ sáng nhỏ hơn 0,05 lúc 12:00 +07:00 ngày trăng mới 2026-09-11.
  - Có test cho `tonight()`, `hourOfNight()` và `sunDirection()`.
- **`strings`:** các assert chuỗi con dấu của bản kiểm cũ chuyển sang đây (`formatSeal`): tháng nhuận, can chi của năm âm lịch ở giáp Tết, tên tháng 11 và 12.
- **`flags`:**
  - `?webgl`, `?webgl=1` và `?webgl=0`.
  - `at`: có `+`, `%2B`, `Z`, không offset (hiểu là +07:00), chuỗi hỏng.
  - `freeze`: không có giá trị, và `freeze=N`.
- **`tier`:** bảng tình huống env giả lập:
  - WebGPU: có / không có / adapter fallback / `architecture: 'swiftshader'`.
  - WebGL2: renderer SwiftShader.
  - Cờ `?webgl`, `?static`, `?force3d`.
  - Không phải secure context; một phép dò ném lỗi.
- **`quality` (GĐ 0):** bảng `pickLevel`, `isMobile`, `budgetFor`. **GĐ 3:** độ trễ không dao động qua lại, đúng thứ tự `ladder`, không nâng vượt mức ban đầu.
  - (GĐ 3) Bộ điều chỉnh chạy trên chuỗi thời điểm khung giả: 60 fps đều thì không làm gì; 40 fps thì hạ sau đúng 2 cửa sổ; màn
    60 Hz không rớt khung thì nâng lại sau 5 cửa sổ; nâng rồi phải hạ ngay thì khóa; khóa nhịp 30 fps thì hạ hết rồi trả lại hết
    và thôi hạ; khoảng > 250 ms bỏ cửa sổ; chế độ canh để yên khi chậm vừa phải nhưng vẫn hạ khi quá tải nặng, không nâng;
    2 giây khởi động bị bỏ.
  - (GĐ 3) Trần 60 khung/giây (`createFrameCap`): màn 60 Hz dao động nhẹ và máy chậm không bỏ khung; màn 90/120/144 Hz vẽ
    khoảng 60 khung mỗi giây; tab hiện lại sau lâu thì vẽ ngay, không vẽ dồn.
- (GĐ 3) **`knob-set`:** `max` là hàm của env (trần theo mức) kẹp giá trị như `max` thường.
- (GĐ 3) **`ladder`:** `'dpr'` nở đúng số nấc theo DPR thật (DPR 1 thì không có); mục không có lớp nào đưa ra thì bỏ qua; apply/revert
  theo kiểu ngăn xếp; `degrade()` hết nấc thì trả `false`.
- (GĐ 3) **`studio`:** `compare()` tách số đo theo trạng thái của thí nghiệm, bỏ 0,25 s đầu sau mỗi lần đổi; `stats().cpuMs`.
- (GĐ 3) **`flags`:** `?level` đúng, sai, thiếu. **`badge`:** "hạ {n} nấc" và `data-steps`.
- (GĐ 3) **`noise`:** `fbm` với số octave là số (khai triển) và là node (vòng lặp); `curl` dựng được node vec3.
- (GĐ 3) **Lớp của Bức 1:** Sương (gán `fogNode` một lần; vòm trời `fog = false`; núm, thí nghiệm, nấc), Vàng lá (sprite `fog = false`;
  bỏ compute khi trọng số 0; CPU vs GPU dựng sprite thứ hai một lần; luật bay JS ra số hữu hạn và ở trong ao), Mặt nước (mức thấp
  không có reflector), Ánh trăng (bóng tĩnh chỉ vẽ lại khi có thứ đổi; khung bóng ôm hộp của ao).
- (GĐ 4) **`tuner`:** tách từ `quality`; mọi test của GĐ 3 giữ nguyên. Thêm cột ms GPU, với các tình huống:
  - laptop yếu (GPU 20 ms, nhịp 33 ms): hạ nấc;
  - khóa 30 fps mà GPU chỉ 5 ms: vào "bị khóa nhịp" ngay, không hạ;
  - GPU 6 ms trên màn 75 Hz, 60,1 Hz, hay lúc đang bị khóa: nâng nấc;
  - cửa sổ dưới 3 mẫu GPU: đi đường nhịp;
  - chế độ canh dùng tải;
  - `state()` có `locked` và `gpu`.
- (Sau GĐ 5) **`tuner`, thử ngừng vẽ** (helper `run()` có `idleFor`: nhịp rAF khi không vẽ): khóa 30 fps (không vẽ vẫn 33 ms) thì
  6 khung `'skip'` rồi "bị khóa nhịp", không hạ nấc nào, không thử lại, cả trên điện thoại; khóa 30 fps mà nấc 0 vẽ mất 50 ms thì
  vẫn hạ một nấc về lại 33 ms (mốc là nhịp đo lúc không vẽ), trả thử rồi khóa nấc ấy; máy là nút cổ chai (không vẽ thì 60 Hz)
  thì hạ như cũ, hạ hết mà không nhanh hơn thì vẫn trả lại hết (lưới an toàn); thử trước lần hạ đầu của mỗi đợt hạ (lúc mới live,
  sau mỗi lần nâng); Sổ tay mở thì không thử; khoảng > 250 ms giữa lần thử thì bỏ, đo lại rồi thử lại. **`scene`:** khung `'skip'`
  không vẽ, không tiến đồng hồ; khóa 30 fps mà không đo được GPU thì không hạ nấc nào.
- (GĐ 4) **Trần khung:** màn 60,02 / 60,05 / 60,1 Hz không bỏ khung nào trong 60 giây; màn 72/75/90/120/144 Hz vẫn khoảng 60 khung
  mỗi giây.
- (GĐ 4) **`gpu-timer`** (renderer giả): không gọi resolve chồng; cộng render + compute; bỏ số vô lý; mẻ không có nhịp để so (lần
  hỏi đầu, mẻ dài hơn một lần nghẽn) thì bỏ mẫu mà không tính là hỏng; hỏng 3 lần liền thì tắt.
- (GĐ 4) **`lut`:** các tính chất ở §6 Lớp 6; mảng dài 32³ × 4; đổi bảng màu thì LUT đổi theo.
- (GĐ 4) **`views`:**
  - thứ tự và nhãn: tap của lớp, `t.views`;
  - `ready` của Normal là false cho tới khi `requireView`;
  - `requireView` không gọi lại `build`/`display`;
  - (GĐ 5) ảnh cuối đã ghép là một `Fn` mở đầu bằng `scenePass.toVar()` rồi trả `vec4(rgb, 1)` (thân Fn dựng bằng
    `tests/helpers/final-pass.js`).
- (GĐ 5) **`pipeline`:** lượt cuối dựng bằng `WGSLNodeBuilder` thật (chặng setup, `tests/helpers/final-pass.js`): scene pass là
  `updateBefore` đầu tiên, cả khi display vẽ ra RTT (như FXAA) và overlay đọc texture của scene pass (Phụ lục A.53).
- (GĐ 4) **`toolbox`, `kinh-mai`, `lot-lop`** (jsdom):
  - mỗi lúc một công cụ; đóng thanh lớp thì công cụ tắt;
  - `hover` không tới bức; kính chỉ giữ chạm của ngón tay;
  - tay nắm gạt là `role="slider"`, đổi `uLensSplit` được bằng phím;
  - Lột lớp là `input type="range"` có `aria-valuetext`.
  - (GĐ 5) `toolbox`: `api.draws` là đúng năm hàm của móc của cảnh (không có `begin`/`end`), không có móc thì `null`; thanh công cụ
    gắn cuối `body` khi chưa có thanh lớp, gắn NGAY SAU thanh lớp khi đã có ("Dựng lại cảnh"), trước Sổ tay. `kinh-mai`: kính tròn
    giữ cả cú chạm hai lần của ngón tay; chuột thì không.
  - (Sau GĐ 5) **`tools`:** luật "giữ `'tap'` thì giữ cả `'double-tap'`" (hợp đồng [5]) kiểm cho MỌI công cụ của
    `engine/tools/index.js`: ngón tay, bút, chuột; trước và sau khi bật; mọi hình chọn bằng nút `[data-shape]`.
  - (GĐ 5) `workshop` (thứ tự trong trang, WCAG 2.4.3): Sổ tay mở lần đầu khi cảnh đã có thanh công cụ thì thanh lớp đứng ngay trước
    nó, Sổ tay ngay sau; chưa có thanh công cụ (tầng tĩnh, bức không có công cụ) thì thanh lớp rồi Sổ tay ở cuối `body`; cả vòng đời
    (mở trang → mở Sổ tay → "Dựng lại cảnh", với `createToolbox` thật) luôn là thanh lớp → thanh công cụ → Sổ tay.
- (GĐ 5) **CSS** (`tests/unit/shell-css.test.js`, đọc luật bằng bộ phân tích nhỏ của chính test):
  - hòa dần đúng `CROSSFADE_MS` của `ui/moon-progress.js`; khung chữ một cột (mọi khối của `.frame` ghim vào cột 1);
  - quầng: không tô, `stroke-dasharray: 1 2`, nét 9; giảm chuyển động thì `transition: none !important`;
  - chữ đi theo vật: vùng chữ phủ kín `[data-stage]`, không nhận chạm; vùng live lẫn chữ không bao giờ `display: none` hay
    `visibility: hidden`; `data-away` đè `[data-shown]` và `[data-fading]`, cả khi giảm chuyển động; tan đúng `CAPTION_FADE`; giảm
    chuyển động thì không mờ dần và giữ dòng tới khi bị gỡ; `?poster` ẩn vùng chữ;
  - bảng công cụ: thanh lớp và Sổ tay đọc bề rộng từ `--rail-w`, `--notebook-w`; luật mặc định, khối điện thoại và khối
    `(min-width: 1240px)` đúng thứ tự; chỉ một khối thu Sổ tay, `(max-width: 1239.98px)`; ngưỡng tính lại từ các biến (2 lề + thanh
    lớp + Sổ tay + 2 khe + 480); `max-width` máy tính của `.tool-panel` không có `%`; không thuộc tính nào tạo khối chứa (transform,
    filter, backdrop-filter…) trên `.toolbar` và `.tool`.
  - `tests/paintings/html.test.js`: z-index của thanh công cụ nhỏ hơn hẳn thanh lớp và Sổ tay; các dòng chữ dưới hàng của bảng giữ
    khoảng 8 px, dòng trống thì thu lại; `shell.css` `@import` cả `captions.css`.
- (GĐ 4) **`dial-set`, `ui/dials`, `rail-tools`:** Dial đổi uniform, kẹp theo min/max/step; `aria-valuetext` = `format`; ghi chú theo
  `note()`; snapshot/restore có `dials`.
- (GĐ 4) **`knob-set`:** `max()` trả số không hữu hạn, hay nhỏ hơn `min`, thì ném lỗi tiếng Việt ngay lúc dựng.
- (GĐ 4) **`flags`/`shell`:** `?poster` gắn `body[data-poster]`, không có gợi ý, không có lời mời. **`badge`:** câu về nấc bị khóa.
- (GĐ 4) **Lớp của Bức 1:**
  - Sương không đưa nấc `chi-tiet` ở mức thấp;
  - Vàng lá không chạy compute khi `update(0, t)`;
  - Ánh trăng vẽ lại bóng khi giờ đổi lúc đứng yên.
- (GĐ 5) **`gesture`:** hai lần chạm trong 300 ms và 24 px ra `tap`, `tap`, `double-tap` (cùng chỗ với lần chạm hai, ngay sau `tap`
  của nó); 300 ms đo từ lúc NHẤC ngón đầu, 24 px đo từ chỗ chạm xuống, đúng ngưỡng vẫn tính; quá thì chỉ là hai `tap`; chạm ba lần
  liền chỉ ra một `double-tap` (cặp tính lại từ đầu); lần chạm hai mà thành giữ hay kéo thì không có `double-tap`; ngón thứ hai,
  `cancel` hay mất `pointerup` giữa hai lần chạm thì lần chạm đầu bị quên. **`input`:** chạm hai lần liền nhau ra `tap`, `tap`,
  `double-tap` kèm NDC, tia và loại con trỏ. **`sma`:** `readouts(id)` đọc qua bàn thợ, chưa có bàn thợ thì mảng rỗng. **`layers`:**
  `ctx.captions` mặc định không có chữ (`keys` rỗng, `show` không làm gì).
- (GĐ 5) **`ui/captions`** (jsdom): vùng `aria-live="polite"` nằm trong `[data-stage]` sau canvas, không bao giờ `hidden`, rỗng lúc
  đầu; mỗi lúc một dòng, câu và nguồn (` · tác giả` khi có) như thơ của Sổ tay; hiện mờ dần (đọc style khi chữ đã vào trang rồi mới
  gắn `data-shown`); ra ngoài khung thì chữ mang `data-away`, chỉ ghi khi đổi; sát mép thì chữ dừng ở mép mà vẫn ở trên điểm neo;
  không xuống dưới chân khung (mép trên cao nhất của `[data-hint], [data-poem], [data-seal], [data-moon]` và, sau GĐ 5, bảng của
  công cụ đang bật `[data-tool-slot]`; ô cao 0 bỏ qua), màn
  quá thấp thì mép trên thắng; cỡ chữ và chân khung chỉ đo lúc `show`. **`caption-set`:** khóa lạ không hiện gì (chỉ `?debug` mới
  cảnh báo); `show` đặt chữ ngay; chữ đi theo điểm neo; sau camera, ngoài khung, xa hơn far hay sát hơn near thì ẩn, theo cả quy ước
  độ sâu của WebGL lẫn WebGPU; `anchor()` trả `null` thì ẩn, không cảnh báo; ném lỗi, `undefined` hay số không hữu hạn thì ẩn và
  cảnh báo một lần; camera vừa xoay mà ma trận chưa cập nhật vẫn chiếu theo hướng mới; hết `CAPTION_SECONDS` thì gỡ, trước đó
  `CAPTION_FADE` thì tan, một lần; đồng hồ đứng thì chữ ở lại; `keys` đông cứng, rỗng khi không có chữ; `fakeCaptions` của test cùng
  dạng với api thật. **`scene`:** chữ theo camera của CHÍNH khung đó, vẽ lại khung đứng yên thì chiếu lại; `begin`/`end` của móc bọc
  `render` ở cả `step()` lẫn lần vẽ lại; disposer gỡ vùng chữ và móc.
- (GĐ 5) **`draws`** (renderer giả): `start()` gắn móc và `stop()` trả đúng hàm cũ (kể cả khi đã có hàm khác trước đó); chỉ ghi lần
  vẽ của camera chính, `list()` và từng mục đông cứng; lần vẽ lồng (camera khác, giữa lúc vẽ một vật) cộng vào `nested` của vật đó
  (lồng trong một lần vẽ của camera chính lồng nữa thì vào sợi trong cùng), lần vẽ của camera khác ở ngoài cùng vào `other`; khung
  sau không mang số của khung trước (`drawCalls` của renderer không về 0 giữa hai khung); `limit(k)` bỏ đúng các lần vẽ sau k, so
  theo vật + material + lượt (nhóm của Mesh nhiều material, lượt `backSide`), nhận số nguyên ≥ 0 hay `null`, giá trị khác thì ném
  lỗi; `limit(null)` vẽ đủ; vật là con của một vật trong `layer.objects` thì nhận lớp và nhãn của vật đó; chữ của bức tải hỏng thì
  nhãn rơi về tên vật, rồi về loại; số tam giác theo `drawRange` và nhóm, như three; Points, Line không có tam giác;
  `InstancedBufferGeometry` lấy số bản ở `instanceCount`; lần vẽ ném lỗi thì `list()` giữ khung đủ trước đó và `stop()` vẫn trả hàm cũ.
  (Sau GĐ 5) Khung vẽ đủ chỉ cất bản ghi thô: không ai hỏi `list()` thì không duyệt `layer.objects`; hỏi lại cùng khung thì trả đúng
  danh sách đã dựng, khung mới thì dựng lại; `stop()` thả khung đã ghi (bản ghi thô giữ vật, hình, material).
- (GĐ 5) **`tung-soi`** (jsdom, đồng hồ giả): Đồ nghề có Từng sợi sau Kính mài và Lột lớp; bật thì `draws.start()`, đang đếm thì
  "Dệt lại" bị khóa, có danh sách thì thanh ở N; `aria-valuetext` và dòng mô tả nói về sợi đang xem (sợi k là lần vẽ thứ k), nấc 0
  nói chưa vẽ gì; ô số k/N có `aria-live="off"`; kéo về k < N gọi `limit(k)`, về N gọi `limit(null)`; "Dệt lại" đi 0 → N theo
  `playStepMs` rồi dừng, bấm lại hay kéo thanh thì dừng; quá 750 sợi thì mỗi bước `playStride(N)` sợi, bước cuối đáp đúng N, cả lượt
  chừng `MAX_PLAY_MS`; `?freeze`: bước kế chỉ hẹn giờ khi vẽ lại xong, vẽ lại hỏng thì dừng; số sợi đổi giữa chừng: đang xem đủ khung
  thì theo N mới, đang dừng ở k < N hay đang dệt thì giữ nguyên; danh sách co lại rồi người xem kéo quá N mới thì kẹp về N, không
  ném; nhịp đọc mà khung không đổi thì không ghi gì vào DOM; với móc thật (`draws.js`, renderer giả) nấc k chỉ vẽ k vật đầu; tắt
  công cụ thì `limit(null)` rồi `stop()`, gọi hai lần vẫn an toàn. (Sau GĐ 5) `api.draws` là `null` thì `mount()` ném lỗi tiếng Việt
  và hộp đồ nghề thật bỏ công cụ này (không còn ô nào trong trang); đếm tới `STALL_MS` lúc tab đang hiện thì dòng mô tả và thanh báo
  `stalled`, console cảnh báo một lần, danh sách tới thì về như thường, rỗng lại thì đếm lại từ đầu, tắt rồi bật là phiên mới; tab ẩn
  không tính.
- (GĐ 5) **`moon-progress`** (jsdom): chưa tới `loading` thì không có quầng; `loading` tạo vòng `pathLength` 1, dashoffset đích 0,55,
  transition 10 s (bằng hạn của boot); các mốc sau đi đúng đích (`chunk` 0,38 → `compiling` 0,1 → `fading` 0); mốc tới muộn không kéo
  vòng lùi; `fading` đầy rồi tan cùng lúc hòa dần, `live` gỡ; `static`, `lost` gỡ ngay; chỉ `loading` vẽ vòng mới (mốc tới muộn sau
  khi gỡ, hay sau khi trăng vẽ lại, không vẽ lại quầng); `dispose` thôi nhận mốc. **`shell-halo`** (jsdom): `setState('loading')` vẽ
  quầng trong `[data-moon]`, `progress('chunk')` cho quầng đi tiếp, về tĩnh thì gỡ; trang không có `[data-moon]` thì `progress` không
  làm gì. **`boot`:** báo `'chunk'` sau khi `loadRun()` xong và trước khi `run` chạy; quá hạn thì `progress` bị khóa như các hàm khác
  của vỏ trang; chặng đầu của quầng bằng `BOOT_DEADLINE_MS`.
- (GĐ 5) **`run`** (jsdom; `vi.mock` cho stage, scene, tools, Sổ tay, debug; deadline, disposer, guards, clock, palette và `studioApi`
  thật; vỏ trang và `__sma` là đồ giả ghi mọi lời gọi theo thứ tự, cùng các bước dựng của sân khấu và cảnh; đồng hồ giả cho hạn
  10 s). Trước GĐ 5, `run()` chỉ có e2e giữ.
  - Mở trang qua `compiling` → `fading` → `live`, huy hiệu sau `live`, bộ điều chỉnh bắt đầu đo.
  - Mất GPU sau khi live: "Dựng lại cảnh" dựng trên sân khấu mới, `restore(snapshot)`, live lại; mất lần hai thì tĩnh `device-lost`.
  - Hạn 10 s của lần dựng lại tới khi `createStage`, `restore`, `compile` hay `crossfade` còn dở (mỗi bước một ca): `onFail('timeout')`
    một lần, sân khấu gỡ ngay lúc quá hạn (hay ngay khi tới muộn), phần xong muộn không gọi gì tới vỏ trang, `__sma`, sân khấu hay cảnh.
  - Lần mở trang, boot đã hết hạn: khi `createStage` còn dở thì sân khấu đến muộn bị gỡ, không dựng cảnh; khi `compile` còn dở mà mất
    GPU hay có 3 lỗi GPU trong 1 giây thì bỏ qua (không `onFail`, lý do vẫn `timeout`).
  - Thêm một lần chờ vào `bringUp` thì thêm `if (gone()) return false;` ngay sau nó và thêm tên bước vào bảng `it.each` của test.
- (GĐ 5) **Lớp của Bức 1:**
  - `anh-trang-drift` (hàm thuần):
    - `lanternAt`: lúc thả đúng chỗ thả, búp khép, chưa sáng; sáng dần rồi 1,5 giây sau nở đủ; đi theo hướng trôi, quãng khớp tốc độ,
      lúc đầu rất chậm; xoay theo `DRIFT.spin`, mỗi lần thả một pha (lệch góc vàng); tất định; tới vùng mép thì chìm 3 giây rồi tắt;
      quá 90 giây thì chìm; thả sát bờ hướng ra ngoài thì chìm ngay; biên độ lượn cộng quãng trôi lúc chìm nhỏ hơn `DRIFT.margin`; ở
      trong ao suốt đời đèn;
    - `driftDirection`: vector đơn vị với mọi chỗ thả và mọi hướng trăng; nhắm đúng điểm cách camera (0, 32) một đoạn `reach` theo
      phương vị trăng; đích ở ngoài ao nên không đèn nào trôi ngược về phía camera;
    - `createLanternSlots`: thả quá sức chứa thì đèn nổi lâu nhất chìm sớm, đèn mới vào ô thừa, `alive(t)` đếm cả đèn đang chìm; đèn
      chìm ngay lúc thả không bắt đèn khác chìm theo; chuỗi thả bất kỳ: đèn nổi ≤ capacity, đèn sống ≤ capacity + 1; thả dồn dập thì
      dùng lại ô có đèn chìm lâu nhất; nhiều lần thả cùng một t (`?freeze`) vẫn xoay vòng; capacity sai thì ném lỗi;
    - `verseOrder`: hoán vị, mảng gốc giữ nguyên; cả một đêm (12 giờ trưa tới 12 giờ trưa hôm sau, giờ Việt Nam) một thứ tự; khác đêm
      thì khác (ở các cặp đêm đã chọn, kể cả hai phút quanh 12 giờ trưa).
  - Ánh trăng: InstancedMesh `hoa-dang` có `(1 + lanterns + 1) × 8` bản ở cả ba mức, `count` không đổi; số đo `lanterns` 0 → 1 sau
    một lần thả; `pool` dồn đèn còn sống lên đầu; ma trận của đèn vừa thả ở gần chỗ thả, ô trống cỡ 0; khung bao chứa mọi đèn, ao
    trống thì chỉ quanh đèn ở bờ; búp khép lúc thả, nở đủ sau `DRIFT.open` thì cánh ngả đúng như đèn ở bờ; gốc cánh k ở góc yaw + k·45°;
    đèn chìm xuống hẳn dưới mặt nước trước khi ô bị giấu; `update(0, t)` hai lần ra cùng ma trận; "Đổi màu đèn" đổi mọi đèn, emissive
    theo độ sáng riêng và trọng số của lớp; không có đèn trôi thì `version` của thuộc tính đứng yên, không thuộc tính instance nào dùng
    `DynamicDrawUsage`.
  - `tha-hoa-dang` (setup của bức, `ctx.captions` giả): chạm hai lần trên ao thả một đèn đúng chỗ, lúc `ctx.u.time`; chữ là khóa đầu
    của `verseOrder(keys, NOW)` và neo theo đèn; đèn trôi theo trăng LÚC THẢ, kéo thanh giờ sau đó không đổi đường; mỗi lần thả là câu
    kế tiếp, hết thì quay lại đầu; lên trời hay ngoài ao: không đèn, không chữ, không tốn câu; không có chữ thì vẫn thả đèn; hai lần
    chạm vẫn là hai `tap` (gợn sóng, đom đóm tản), `double-tap` theo sau chỉ thả đèn; `content.vi.js` có đúng mười hai cặp câu của §5
    theo thứ tự, gợi ý nhắc chạm hai lần.
  - Sương: `emissiveNode` của đèn được bọc thêm `(1 − hệ số sương)`. Mặt nước: `positionNode` của đèn cộng độ cao gợn tại
    `lanternCenter`, nhân trọng số của lớp và `lanternGlow`; vũng sáng vào `emissiveNode` của nước (màu nến, nhân trọng số của hai lớp,
    tắt khi "Xem heightfield"), không vào `mrtNode`; nước dịch ra WGSL và GLSL ở mức cao và thấp như scene pass vẽ nó (có MRT): vòng
    vũng sáng chạy `pool.size` vòng, `Break` khi chỉ số chạm `lanternCount`, mỗi vòng cộng `exp(−d²/r²) × độ sáng`; material của đèn
    dịch được ở cả scene pass (MRT) lẫn ảnh phản chiếu (không MRT).
  - `pow`: cơ số của mọi `pow` không âm, quét cả mức cao và mức thấp (phản chiếu giả có `pow` riêng). `quality`: bảng §10 có
    `lanterns`. Cốt: "Tắt instancing" đặt lá rời trong Group `la-rieng`.
- **`palette`, `tokens-css`, `random`, `deadline`, `disposer`.**
- **`layers`:** mọi tên uniform khớp `/^[A-Za-z_][A-Za-z0-9_]*$/`; `weight('cot')` bằng 1; id lạ thì ném lỗi.
- **`source`:** các helper chạy trên chuỗi mẫu.

### Luật (Vitest, tĩnh)
- **`tests/helpers/source.js`** dùng `parseSync` của `vite`, không thêm dependency:
  - `listSrc(re?)` trả `src/**/*.js` và `plugins/*.js`, đường dẫn tính từ gốc repo.
  - `stripComments(code)` thay chú thích bằng khoảng trắng và **giữ dấu xuống dòng**.
  - `importsOf(f) → {spec, target, dynamic, line}[]` bắt cả 5 dạng: `import … from`, `import '…'`, `export … from`, `export * from`, và `import()`.
    - Bỏ hậu tố `?…` trước khi phân giải; import có `?code|?raw|?url` không tính vào luật.
    - `import()` có tham số không phải chuỗi hằng là **lỗi luật**.
    - Import tương đối phải ghi đuôi `.js` hoặc `.css`.
  - `staticClosure(f)` chỉ đi theo import tĩnh tới file `.js` trong repo. Specifier trần và file `.css` là lá; không đi vào `node_modules`.
- **`rules/imports.test.js`:** bảng §8.2, đường nhẹ (danh sách cho phép), hàng rào từ vựng (kèm phần tự kiểm), và luật "không import `strings.*.js`".
  (GĐ 5) Phần nhẹ không gọi built-in từ ES2022 trở đi (§8.2: tầng tĩnh chạy cả trên Safari 14).
- **`rules/files.test.js`**, áp cho mọi `src/**/*.js` và `plugins/*.js`:
  - Dòng 1 khớp `/^(\/\/|\/\*)/`.
  - Số dòng vật lý (như `wc -l`): trên 300 thì hỏng, kèm lời khuyên tách sang `parts/`. Từ 251 đến 300 thì in một bảng tổng hợp trong `afterAll`, không hỏng.
  - Sau khi bỏ chú thích, không còn các mẫu sau:
    - `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, `EffectComposer`;
    - `Math.random` (ngẫu nhiên phải có hạt giống);
    - import `time` hoặc `deltaTime` từ `three/tsl`.
  - (GĐ 5) `setRenderObjectFunction` ở bất cứ file nào ngoài `engine/gpu/draws.js` (§8.2).
  - (GĐ 9) `_objects`, `_currentRenderContext` ở bất cứ file nào ngoài `engine/gpu/draws.js`; `getShaderAsync` ở bất cứ đâu (§8.2).

### Hợp đồng (`tests/paintings/contract.test.js`, lặp qua registry; từ GĐ 2 lặp cả `_mau`)
- **GĐ 0:**
  - Meta hợp lệ:
    - `slug` trùng tên thư mục;
    - `poem.source` có mặt;
    - `layers[0].id === 'cot'`;
    - id duy nhất;
    - file trong `files` tồn tại, và mỗi file thuộc tối đa một lớp.
  - HTML của mỗi dòng registry khớp meta. Test đọc bằng `new JSDOM(html)` và so:
    - `data-painting`, `<title>`;
    - thơ, theo `textContent.trim()` sau NFC của từng con trong `[data-poem]`;
    - `src`, `width`, `height` của poster (`src` phải đúng bằng `meta.poster.src`).
  - `painting.js` có cùng danh sách id với `meta.layers`, đúng thứ tự. Test import module thật, vì `three/webgpu` dựng node graph được trong Node mà không cần GPU (đã kiểm).
  - Marker tĩnh khớp `knobs`.
- **GĐ 2:**
  - Content theo từng ngôn ngữ: đủ Hiểu (≤ 150 chữ), "Bạn vừa học", "Đọc thêm" (chỉ https), nhãn cho mọi núm, thí nghiệm và số đo. Sơ đồ (nếu có) là SVG có `<title>`, chỉ dùng màu của bảng đã ghép.
  - Runtime: dựng giống `run.js` (dùng chung `createCtx` và `buildLayers` với `gpu/layers.js`): `setup(fakeCtx)` rồi `createLayer` theo thứ tự, ở mức cao và mức thấp.
    - Renderer giả là một Proxy no-op ghi lại lời gọi.
    - Lớp phải trả `dispose`, `objects` hợp lệ, và mọi NodeMaterial có `emissiveNode`. Gỡ ngược (dispose hai lần) thì scene trống.
    - Mọi núm `js`/`rebuild` áp được giá trị của chính nó; thí nghiệm bật rồi tắt được; số đo trả số hoặc chuỗi.
  - Mọi file trong `LayerMeta.files` của bức đã deploy nằm trong glob `?code` (`hasCode`).
  - Chỉ kiểm HTML cho các dòng registry. Tranh mẫu `_mau` được kiểm như mọi bức, trừ HTML và glob code.
- **GĐ 3:**
  - `painting.quality` (nếu có): đủ ba mức; mọi mục của `ladder` là `'dpr'` hoặc `'<layerId>.<stepId>'` với lớp có thật, và khi dựng ở
    mức cao lớp đó có nấc ấy. Mọi nấc apply rồi revert được, và sau revert thì số đo của lớp về đúng như trước.
  - Thí nghiệm kiểu `compare` bật rồi tắt được như thí nghiệm thường.
- **GĐ 4:**
  - `quality.levels`: ba mức có cùng bộ khóa.
  - `setup().dials` (nếu có):
    - id hợp lệ và không trùng; `min < max`;
    - `format(min)` và `format(max)` là chuỗi;
    - có nhãn ở `content.dials[id].label`, và mọi khóa mà `note()` trả ra đều có chữ trong `notes`.
  - Mọi tap mà các lớp ghi trong `build`/`display` có nhãn ở `content.layers[id].taps`.
  - `meta.poster.capture` (nếu có): `at` đọc được bằng `parseAt`, `freeze` là số nguyên dương.
  - File poster đúng `width × height` (đọc header WebP) và ≤ 150 KB.
  - `meta.og` trỏ tới một file có trong `public/`, kích thước 1200×630.
- **GĐ 5:**
  - Danh sách các bức (mọi dòng registry và `_mau`, kèm cửa vào đã nạp) nằm ở `tests/helpers/paintings.js` (`ALL`), dùng chung cho
    test hợp đồng và test tên vật. `KEBAB` (kebab-case không dấu) nằm ở `tests/helpers/kebab.js`.
  - `content.captions` (nếu có): khóa kebab-case không dấu; mỗi mục có `lines` gồm 1–2 dòng không rỗng, mỗi dòng ≤ 60 ký tự (đếm
    theo ký tự, không theo đơn vị UTF-16), `source` không rỗng, `author` có thì không rỗng. Luật nằm ở `tests/helpers/caption-rules.js`
    (`captionErrors`); `tests/paintings/captions-rule.test.js` tự kiểm nó (bắt được mục sai, nhận mục đúng, kể cả chữ ngoài BMP).
  - Tên vật (`tests/paintings/objects.test.js`, lặp qua `ALL`): dựng ở mức cao và mức thấp, và trong lúc mỗi thí nghiệm đang bật, mọi
    vật trong `layer.objects` có `name` kebab-case không dấu, không trùng trong lớp, và có nhãn ở `content.layers[id].objects[name]`.
    Mọi khóa trong `objects` của content ứng với một vật có thật ở một trong các lần dựng đó (không có nhãn thừa). Dòng lỗi ghi cả
    mức đã gặp lỗi (`(mức thap)`): lỗi chỉ có ở mức thấp thì dựng ở mức cao sẽ không thấy.
  - `LayerMeta.files` của mỗi lớp kê đủ mọi file trong `parts/` của bức mà file lớp (trong `layers/`) import tĩnh, thẳng hay qua part
    khác (`staticClosure`, chỉ đi qua `parts/`): Sổ tay hiện đủ code của lớp. Cùng với luật "mỗi file thuộc tối đa một lớp", part là
    của riêng một lớp: lớp khác cần gì của nó thì nhận qua `shared`.

### E2E (Playwright 1.63, Chromium headless shell, chạy trên bản build qua `vite preview`)
- **Cấu hình chung:**
  - `page.goto` dùng đường dẫn tương đối `./?…`; `baseURL` kết thúc bằng `/son-mai-anh-sang/`.
  - E2e chờ `__sma.state` là `'live'` hoặc `'static'`. Nếu gặp `static` khi không mong đợi thì hỏng và in `reason`.
- **Project `webgl2-swiftshader` (cổng chặn):**
  - Cờ khởi chạy: `--use-angle=swiftshader --enable-unsafe-swiftshader`.
  - URL `./?webgl&force3d&freeze=10` và `./?webgl&force3d&freeze=40`. Mỗi ảnh có cả điểm sáng lẫn điểm tối; hai ảnh khác nhau.
  - Đọc pixel bằng `locator('canvas').screenshot()`, không dùng `toDataURL` (cách đó trả ảnh đen trên WebGL2).
  - `data-backend="webgl2"`.
  - Không có lỗi console (cần favicon thật), và không có cảnh báo khớp `/deprecated|renamed|has been removed/i`.
- **Project `webgpu-swiftshader` (không chặn, cho tới khi chạy ổn trên ubuntu):**
  - Cờ khởi chạy: `--enable-unsafe-webgpu --use-angle=swiftshader --enable-unsafe-swiftshader`.
  - Các kiểm tra như trên với `./?force3d&freeze=N`. Tự bỏ qua nếu không có adapter.
- **`?static`:**
  - Thấy poster, thơ và con dấu; không có canvas; **không có request nào tới chunk `three`**.
  - `./?static&at=2026-09-28T21:00` cho con dấu `18 tháng Tám · Bính Ngọ`.
- **GĐ 1:** chạm mặt nước thì ảnh đổi, so hai lần chạy cùng `?at&freeze=N` khác nhau đúng một thao tác.
- **GĐ 2:**
  - Với mỗi lớp khác Cốt, `__sma.setWeight(id, 0)` thì ảnh khác (cùng `freeze`, cùng số khung); đặt lại 1 thì về đúng ảnh cũ.
  - Sổ tay: chọn lớp đầu tiên có núm, di chuột lên núm thì dòng code sáng lên; không lớp nào có núm thì bỏ qua.
  - Mất context WebGL: lần đầu → `lost` + "Dựng lại cảnh" → bấm → live với canvas mới và trọng số đã restore; lần hai → tĩnh.
  - `?static`: Sổ tay chỉ đọc mở được và vẫn không tải chunk three.
  - Bức 1: chế độ mài (lời mời → đất sét → "Phủ lớp tiếp theo" → đóng thanh lớp thì đủ lớp); giữ tay trên mặt nước thì ảnh khác.
- **GĐ 3:**
  - Mọi bức: hạ hết mọi nấc bằng `__sma.degrade()` (cùng khung `?freeze`) thì cảnh vẫn vẽ, ảnh có sáng có tối, không lỗi console;
    nâng lại hết bằng `upgrade()` thì về đúng ảnh cũ.
  - Bức 1: vuốt trên mặt nước thì ảnh khác lần không vuốt (cùng `?at&freeze`); ở mức cao (`webgpu-swiftshader`) `__sma.stats().drawCalls`
    ≤ 45; `?level=thap` lên live với `__sma.level === 'thap'`, ảnh có sáng có tối; Sổ tay › Vàng lá › Phá: bật rồi tắt "CPU vs GPU"
    thì hai cột "Tắt / Bật" đều có số.
- (GĐ 3) Ngưỡng "có sáng có tối" của e2e: điểm tối (kênh lớn nhất < 30) trên 3% (trước là 10%): trời chàm và sương làm ảnh ít
  điểm đen tuyệt đối hơn nền đen then cũ (đo được 7–8% ở khung 10); 3% vẫn đủ chứng minh ảnh không cháy trắng, không trống.
- **GĐ 4:**
  - **Mọi bức · "mài về cốt":** mọi trọng số (trừ Cốt) về 0 thì:
    - ảnh có độ bão hòa thấp, độ sáng trung bình gần `datSet` dưới đèn xưởng;
    - độ lệch chuẩn độ sáng đủ lớn (thấy hình khối);
    - không có điểm trong suốt.

    Đặt lại 1 thì về đúng ảnh cũ.
  - **Mọi bức · Kính mài** (cùng khung `?freeze`):
    - bật kính tròn ở giữa khung và chọn một view: ảnh trong vùng kính khác, ngoài vùng kính như cũ;
    - hình gạt ở 50%: nửa trái khác, nửa phải như cũ;
    - tắt công cụ thì về đúng ảnh cũ.
  - **Mọi bức · Lột lớp:** mỗi nấc cho ảnh khác nấc kề bên; về nấc cuối thì đúng ảnh cũ. (GĐ 8) Trừ một cặp: "Trước tone" là "Trước bloom"
    cộng ánh bloom, nên bức không có gì phát sáng (ảnh "Chỉ emissive" đen tuyền, như Bức 4 khi chưa có giấy điệp) thì hai nấc ấy phải
    TRÙNG nhau; có thì phải khác.
  - **Mọi bức · Normal:** chọn Normal thì thấy "đang mài…", rồi ảnh đổi, không có lỗi console.
  - **Mọi bức · `?poster`:** ngoài canvas không có phần tử UI nào hiện.
  - **A11y** (`e2e/a11y.spec.js`, `@axe-core/playwright`, luật WCAG 2 A/AA):
    - quét ba trạng thái: trang tĩnh; trang 3D khi mở thanh lớp và Sổ tay (cả ba tab); khi một công cụ đang bật;
    - lỗi mức `serious` hay `critical` là test hỏng;
    - bàn phím: Tab tới lời mời, Enter vào chế độ mài, rồi đi hết thanh lớp, Đồ nghề, thanh giờ và Sổ tay bằng Tab và phím mũi tên;
      Escape đóng Sổ tay.
  - **Bức 1 · thanh giờ:** `__sma.setDial('gio', 27)` ở cùng khung thì ảnh khác; về giá trị cũ thì đúng ảnh cũ.
  - **Bức 1 · vuốt:** chứng minh được sương xoáy. Chỉ bật Cốt + Sương, rồi so hai ảnh có vuốt và không vuốt (thay test GĐ 3 vốn chỉ
    so cả khung).
- **GĐ 5:**
  - **Mọi bức · Từng sợi** (khung 10 của `?freeze`):
    - bật công cụ, chờ danh sách (`max` của thanh > 0): thanh đứng ở N và ảnh đúng bằng ảnh không có công cụ (checksum);
    - thanh về 0 thì ảnh gần như một màu: độ lệch chuẩn độ sáng < 0,02 (`ONE_COLOUR_STD`; đo được 0,0073 trên WebGL2 SwiftShader,
      WebGPU SwiftShader và GPU thật, chỉ còn hạt và tối góc của Phủ bóng; khung đủ chừng 0,13), và không điểm nào trong suốt;
    - ở mỗi nấc k = 1…4: `aria-valuetext` bắt đầu bằng `valuetext(k, N, '')` và có thêm nhãn vật; `.tool-detail` có đúng nhãn ấy;
    - "Dệt lại" đi từng bước (một MutationObserver ghi từng giá trị: 0, rồi mỗi bước thêm `playStride(N)` sợi, bước cuối đúng N) và
      dừng ở N với `aria-pressed` false. Trần chờ tính từ `playStepMs`/`playStride`, mỗi bước cộng 1 giây cho lần vẽ lại trên GPU
      phần mềm;
    - tắt công cụ thì về đúng ảnh cũ; không lỗi, không cảnh báo console.
  - **Mọi bức · quầng trăng** (bức có `[data-moon]`):
    - chunk `three` tới chậm 1,5 giây (`page.route`). Một MutationObserver gắn bằng `addInitScript` ghi mọi ĐÍCH inline mà quầng nhận,
      kèm thời điểm (giá trị mới của mỗi bản ghi đọc từ `oldValue` của bản ghi kế tiếp trên cùng phần tử: Phụ lục A.71, A.72);
    - lúc trang ở `loading` trở đi thì quầng có mặt, giá trị tính được của `stroke-dashoffset` trong [0, 1]; trang về tĩnh thì test
      báo ngay lý do (`__sma.reason`) chứ không chờ hết giờ;
    - `live` thì quầng đã gỡ; các đích không bao giờ tăng (vòng không lùi) và có đủ, đúng thứ tự, đích của `loading` → `chunk` →
      `compiling` → `fading` (đọc từ `HALO_STEPS`). Đây là kiểm tra duy nhất của dây nối `progress('chunk')` của boot trong trình
      duyệt thật, với lần `import()` thật của run.js; `tests/unit/boot.test.js` giữ dây nối ấy trong jsdom (`loadRun` giả);
    - `?static`: không có quầng, nhật ký rỗng.
  - **Mọi bức · bảng công cụ** (máy tính, xưởng mở bằng lời mời):
    - 1280×800: bật lần lượt Từng sợi, Kính mài, Lột lớp: Sổ tay vẫn mở; bảng không chồng lên thanh lớp hay Sổ tay và ở giữa khoảng
      trống giữa hai tấm (lệch ≤ 1 px); "Dệt lại", mọi nút của Kính mài, thanh của Lột lớp bấm trúng (nằm trọn trong khung nhìn,
      `elementFromPoint` ở tâm là chính nó); hàng của Từng sợi (thanh, số đếm, "Dệt lại") trên một dòng. Một dòng chỉ kiểm ở 1280
      px: ở 1240 px hàng chỉ dư chừng 4 px với chữ của macOS, mà chữ trên Ubuntu của CI có thể rộng hơn;
    - 1240 px (ngưỡng): Sổ tay vẫn mở, bảng không chồng tấm nào, "Dệt lại" bấm trúng. 1440 px: bảng 560 px vẫn ở giữa khoảng trống
      680 px. Đóng thanh lớp: bảng về giữa cả khung;
    - 1024×768: bật Từng sợi thì Sổ tay thu lại, bảng không chồng lên thanh lớp và ở giữa thanh công cụ, "Dệt lại" bấm trúng; tắt thì
      Sổ tay hiện lại;
    - "Dựng lại cảnh" (trong test mất context WebGL): cảnh mới có `[data-rail] + [data-toolbar]`.
  - **Bức 1 · thả hoa đăng** (`?at=2026-10-25T21:00&freeze=120`, đêm 16 tháng Chín (trăng gần tròn, sáng 99,6%), đêm của poster):
    chạm hai lần lên nước bằng sự kiện con trỏ phát ngay trong trang (`e2e/helpers.js#doubleTapAt`, §17), sau khung 15 và không muộn
    hơn khung 29: tới khung 120 búp đã đủ 1,5 giây để nở, nến đủ 0,5 giây để sáng. Rồi:
    - `__sma.readouts('anh-trang')` có `lanterns` = 1; chữ hiện (`data-shown`, không `data-away`) và đúng câu đoán trước,
      `verseOrder(Object.keys(captions), parseAt(at))[0]`, từng dòng và dòng nguồn;
    - quanh chỗ chạm có nhiều điểm sáng ấm (R > 150, G > 110, R − B > 40) hơn hẳn lần chạy có cùng hai lần chạm cách nhau 600 ms (hai
      lần chạm thường: có gợn, không đèn, không chữ, `lanterns` = 0): hơn ít nhất 300 điểm. Đo ở 640×400: có đèn 843 (WebGL2
      SwiftShader, mức vừa), 927 (WebGPU SwiftShader), 937 (GPU thật); hai lần chạm thường 18–43. Phần lớn số điểm là vũng sáng;
    - thả lần hai ở chỗ khác thì `lanterns` = 2 và chữ đổi sang câu `[1]`; chạm hai lần lên trời thì vẫn 2 và chữ không đổi; không lỗi
      console.
  - (Sau GĐ 5) **Bức 1 · ngón tay chạm hai lần** (`?at=2026-10-25T21:00&freeze=15`, `doubleTapAt(…, { pointerType: 'touch' })`): Kính
    mài hình tròn đang bật thì không có đèn nào, không có chữ; tắt kính rồi chạm lại thì đúng một đèn và một dòng chữ.
  - **Bức 1 · draw call có hoa đăng** (chỉ WebGPU, `?level=cao&freeze=90`): thả hai đèn khi vòng lặp còn chạy; `__sma.stats().drawCalls`
    đúng bằng số trước khi thả (35 → 35) và ≤ 45: đèn chung InstancedMesh với đèn ở bờ.
  - **A11y:**
    - axe quét thêm hai trạng thái: Từng sợi đang bật (đã có danh sách: thanh đủ N nấc, "Dệt lại" bấm được), và lúc có chữ đi theo vật
      (Bức 1, `?at=2026-09-28T21:00&freeze=10`, chạm hai lần lên nước, chờ chữ hiện hẳn: opacity 1);
    - bàn phím: Enter trên nút Từng sợi của thanh lớp bật công cụ; chờ danh sách ("Dệt lại" bị khóa tới lúc đó, mà Tab bỏ qua nút bị
      khóa); rồi đường Tab từ nút ấy phải ĐÚNG như danh sách dựng từ `__sma.tools()` và `__sma.dials()`. Với Bức 1, ở 640 px:
      `button@rail:chip, input@rail:range, button@rail, button@rail, input@tool:range, button@tool` (nút "◷ 21:00", thanh giờ, "Phủ lớp
      tiếp theo", nút đóng, rồi thanh và nút của Từng sợi); ở 1280 px với Sổ tay mở lại:
      `input@rail:range, button@rail, button@rail, input@tool:range, button@tool, button@nb`. Không vòng về đầu trang, Sổ tay sau bảng.
      Phím mũi tên trên thanh đổi `aria-valuetext`.
- Ảnh chụp và trace lưu vào `e2e/.results/`.

### Kiểm tra thủ công
- `chrome://gpu` trên máy của Bao.
- Điện thoại thật của Bao, cả Android lẫn iOS nếu có.
- Safari 26 (WebGPU).
- Local có project tùy chọn `E2E_REAL_GPU=1`, dùng GPU thật qua `channel: 'chromium'`.
- (GĐ 3) Điện thoại tầm trung từ 45 fps trở lên (`?debug=stats`), cả khi bộ điều chỉnh đã chạy vài chục giây.
- (GĐ 3) Lượt màu: ảnh chụp trên GPU thật (1280×800 và 390×844) so với poster; Bao duyệt trước khi ghi giá trị mặc định mới.
- (GĐ 4) Lượt màu của chặng display: ảnh trước và sau trên GPU thật (1280×800 và 390×844). Bao duyệt trước khi chụp poster mới.
- (GĐ 4) VoiceOver (Safari trên macOS và iOS): lời mời, thanh lớp, Đồ nghề, thanh giờ và Sổ tay được đọc đúng tên và trạng thái.
- (GĐ 4) Bộ điều chỉnh đo GPU trên máy thật:
  - laptop yếu (hoặc `?level=cao` trên máy yếu) không kẹt ở 30 fps;
  - Energy Saver / Low Power Mode vẫn vào "bị khóa nhịp" mà không hạ nấc;
  - màn 60,0x Hz không giật định kỳ;
  - `__sma.quality().gpu` đúng với máy;
  - máy Windows hay Linux có GPU thật (NVIDIA, AMD, Intel) trên Chrome: ms GPU trong Sổ tay nhỏ hơn ms mỗi khung và đổi theo mức;
    từ đó chốt ba ngưỡng 0,5 / 0,6 / 0,85 (§10);
  - GPU Apple trên Chrome: vài giây sau khi live, `__sma.quality().gpu` là `false` và Sổ tay ghi "—" kèm lời giải thích.
- (GĐ 5) Bao đọc lại mười hai cặp câu thơ của hoa đăng trên trang (chữ, dấu, nguồn; §5).
- (GĐ 5) Điện thoại thật: chạm hai lần thả được đèn, không làm trình duyệt phóng to; chữ không tràn ra ngoài màn hình.
- (GĐ 5) VoiceOver đọc cặp câu và nguồn khi đèn được thả, và đọc được thanh của Từng sợi.
- (GĐ 5) Mạng chậm (DevTools › Network › Slow 4G): quầng trăng nhích đều tới lúc hòa dần, không đứng hẳn ở mốc nào.
- (GĐ 5) Tab và VoiceOver trên Mac thật ở 1280 px và 1024 px: từ nút Từng sợi, Tab đi hết phần còn lại của thanh lớp rồi vào bảng
  của nó, trước Sổ tay; VoiceOver đọc thanh của Từng sợi (`aria-valuetext`) mà không đọc lại ô số k/N ở mỗi bước của "Dệt lại".
- (GĐ 5) Zoom trình duyệt (125%, 150%) ở bề rộng quanh 1240 px: bảng công cụ không nằm dưới Sổ tay.
- (GĐ 6) Bức 2 trên điện thoại thật: bóng trên vách đọc được, thổi nến và giữ trống bằng ngón tay, 45 khung/giây ở mức vừa và thấp.
- (GĐ 6) VoiceOver đọc link lật tranh ở cả hai trang (tên bức và chiều đi).
- (GĐ 6) Bao đọc lại thơ của Bức 2 trên trang (chữ, dấu, nguồn; §18.2) và duyệt ảnh poster (§18.3).
- (GĐ 7) Bức 3 trên điện thoại thật: 45 khung/giây ở mức vừa và thấp; chạm cho lá rơi, giữ cho cây bay bằng ngón tay.
- (GĐ 7) VoiceOver đọc Dial "Ngày âm lịch" (nhãn ngày) và dải link có "Phòng tranh" ở cả ba trang; Phòng tranh trên Safari của
  điện thoại.
- (GĐ 7) Bao đọc lại thơ của Bức 3 trên trang (§19.2) và duyệt ảnh poster (§19.3).
- (GĐ 8) Bức 4 trên điện thoại thật: tờ tranh vừa bề ngang; dùng ngón tay để chạm rắc thóc, giữ cho gà mẹ gọi con, kéo rồi xem
  tranh tự khép lại.
- (GĐ 8) VoiceOver đọc dải link Bức 3 ⇄ Bức 4; Phòng tranh có bốn mục.
- (GĐ 8) Bao đọc lại thơ của Bức 4 trên trang (§20.2), duyệt hình gà và ảnh poster (§20.3).
- (GĐ 9) Safari trên Mac và iPhone: thanh địa chỉ đổi theo khi mài; chép link; mở link nhận được thì đúng bức đã mài (§21.2).
- (GĐ 9) VoiceOver đọc dòng trạng thái của Bản dịch và dòng "Đã chép link".

## 13. Repo, CI, deploy

- **Remote:** `github.com/giabao2610/son-mai-anh-sang`, **public**, giấy phép MIT.
- **Thứ tự deploy lần đầu:**
  1. `gh repo create giabao2610/son-mai-anh-sang --public --source=. --remote=origin --push`.
  2. `gh api --method POST repos/giabao2610/son-mai-anh-sang/pages -f build_type=workflow`. Nếu nhận 409 thì dùng `PUT`.
  3. `gh workflow run deploy.yml --ref main`, rồi `gh run watch`.

  Lần chạy đầu (trước khi bật Pages) đỏ là bình thường.
- **Commit:** mọi commit mang `Bao Nguyen <giabao261096@gmail.com>`, cấu hình local trong repo.
- **Node 24 LTS**, cài theo thư mục để không đổi Node của các project công việc:
  - `brew install fnm`;
  - thêm `eval "$(fnm env --use-on-cd --shell zsh)"` vào `~/.zshrc`;
  - `fnm install 24`.

  Repo có `.nvmrc` ghi `24` và `engines.node` ghi `>=24`. CI dùng `node-version-file: .nvmrc`.
- **Phiên bản đã kiểm:** `three@0.186.1` (ghim cứng), `vite@^8.3.1`, `vitest@^5.0.2`, `jsdom@^30`, `@playwright/test@1.63.0` (ghim cứng), `@fontsource/*@^5.3.0`, `tweakpane@^4.0.5`, `stats-gl@^4.2.3`, `shiki@^4.4.3`. (GĐ 4) `@axe-core/playwright@^4.13.0`: gói dev, giấy phép MPL-2.0, chỉ e2e dùng, không vào bundle.
- **`.gitignore`:** `node_modules/ dist/ e2e/.results/ test-results/ playwright-report/ .DS_Store`, cùng các thư mục làm việc cục bộ của công cụ AI: `.claude/ .superpowers/ .playwright-mcp/`.
- **Scripts:** `dev`, `build`, `preview`, `test` (vitest run), `e2e` (`vite build && playwright test`). Chạy e2e local lần đầu cần `npx playwright install chromium`.
- **Vite:** `base: '/son-mai-anh-sang/'`, `build.target: 'es2022'`. Chunk `three` tách bằng `rolldownOptions.output.codeSplitting.groups` (`manualChunks` đã deprecated trong rolldown).
- **Vitest:** `include: ['tests/**/*.test.js']`. Nếu thiếu dòng này, Vitest 5 gom luôn cả `e2e/*.spec.js`.
- **GitHub Actions (`deploy.yml`):**
  - Các action: `actions/checkout@v7`, `setup-node@v7` (`node-version-file: .nvmrc`, cache npm), `upload-artifact@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
  - Các bước: `npm ci` → `npm test` → `npm run build` → `npx playwright install --with-deps --only-shell chromium` → `npx playwright test --project=static --project=webgl2-swiftshader` (chặn) → `npx playwright test --project=webgpu-swiftshader` (`continue-on-error`) → giữ ảnh e2e → upload → deploy.
  - Chỉ deploy từ `main`, và chỉ khi mọi bước chặn đều qua.
  - (GĐ 4) Tách thành hai job chạy song song. Lý do: ở PR #3, bước WebGPU nằm chung job `build` với trần 15 phút mà đã chạy mất
    14,9 phút.
    - **`build`** (chặn, trần 40 phút): `npm ci` → `npm test` → `npm run build` → cài Chromium → e2e `static` + `webgl2-swiftshader`
      (gồm cả a11y) → giữ ảnh e2e → đóng gói Pages.
    - **`e2e-webgpu`** (không chặn: `continue-on-error: true` ở cấp job, trần 25 phút): `npm ci` → `npm run build` → cài Chromium đầy
      đủ → e2e `webgpu-swiftshader` → giữ ảnh vào thư mục riêng.
    - **`deploy`** chỉ cần `build`.
    - (Sau merge GĐ 4, PR #5) `e2e-webgpu` có trần 40 phút: bước cài Chromium có lúc mất gần 7 phút, cộng 18,5 phút e2e là quá 25.
      `e2e/.results` là thư mục ẩn, mà `upload-artifact` (từ v4.4) mặc định bỏ file ẩn: cả hai bước giữ ảnh đặt
      `include-hidden-files: true`.
  - (GĐ 6) Hai bức nhân đôi phần e2e chung, mà job `build` đã mất khoảng 22 phút trên trần 40. Vì vậy:
    - **`build`** (chặn, trần 20 phút) chỉ còn `npm ci` → `npm test` → `npm run build` → đóng gói Pages;
    - **`e2e`** (chặn) chạy hai phần song song (`--shard=1/2`, `--shard=2/2`, `--fully-parallel` để chia theo test, không theo file).
      Mỗi phần tự `npm run build`: build chỉ mất vài giây, nhanh hơn chuyển `dist/` qua artifact, và không thêm action mới
      (`download-artifact`).
      - Mỗi project chia riêng (hai lệnh trong mỗi phần): `--shard` chia theo SỐ test và theo thứ tự project, nên chia chung hai
        project thì phần 1 nhận trọn project tĩnh (vài giây) còn phần 2 nhận trọn WebGL2 (thấy lúc chạy thử, GĐ 6).
      - Đếm lúc làm: mỗi project 83 test, chia 42 / 41;
    - **`e2e-webgpu`** (không chặn) cũng hai phần (83 test chia 42 / 41);
    - **`deploy`** cần `build` và cả hai phần của `e2e`.

    Thời gian thật đo khi làm (§18.9).
  - (GĐ 7) Sau GĐ 6, phần 1 của mỗi job đã gần trần 40 phút (e2e chặn 26 phút, e2e WebGPU có lần 32 phút): `--shard` chia theo số
    test và theo thứ tự file, nên phần 1 nhận mọi spec riêng của các bức. GĐ 7 chia **theo bức** (§19.9):
    - job `nhom-e2e` chạy `node scripts/e2e-groups.js`, in ra ma trận các nhóm từ registry: mỗi bức một nhóm (`--grep "{tên bức} · "`),
      cộng nhóm `chung` (`--grep-invert` mọi tên bức: lật tranh, Phòng tranh);
    - `e2e` (chặn) và `e2e-webgpu` (không chặn) chạy một job cho mỗi nhóm (`matrix.group`, `fromJSON`); giá trị của ma trận đi qua
      `env`. Không có `--pass-with-no-tests` (sau GĐ 7): nhóm không khớp test nào thì Playwright báo "No tests found" và job đỏ;
    - `deploy` cần `build` và mọi job của `e2e`;
    - thêm bức thì thêm job, tự động; test luật giữ quy ước tên `describe`;
    - (sau GĐ 7) thời gian thật của lượt CI đầu, và vì sao job WebGPU chỉ chạy test khói của Bức 3: §19.9;
    - (sau GĐ 8) thời gian thật của lượt CI đầu có Bức 4 (PR #9), vì sao hai loại test của Bức 4 hỏng trên runner, và vì sao job WebGPU
      của Bức 4 cũng chỉ chạy test khói: §20.9.
- **URL:** `https://giabao2610.github.io/son-mai-anh-sang/`.
- **Luật trong `CLAUDE.md`:**
  - **Nguồn tham chiếu:**
    - Chỉ dùng TSL. Ghim `three@0.186.1`.
    - Đối chiếu API với `node_modules/three/src` và `examples/jsm`. Example HTML **không có trong gói npm**: xem tại `github.com/mrdoob/three.js/tree/r186/examples`.
    - Không dùng `ShaderMaterial`, `EffectComposer`, `onBeforeCompile`, hay các API deprecated ở §3.
  - **Ranh giới:**
    - Xưởng không import bức; các bức không import lẫn nhau.
    - Theo luật hai lần. Hợp đồng chỉ thêm trường tùy chọn.
    - Id đã deploy (slug, layerId, knobId, dialId) là API công khai.
  - **Shader và TSL:**
    - Không đổi `renderer.toneMapping` lúc chạy.
    - Không đặt số lên material lúc chạy; đi qua uniform trong node.
    - Không đổi `castShadow`, `receiveShadow`, `shadowMap.enabled` hay `scene.fogNode` lúc chạy.
    - **Không dùng `select()` cho nhánh có node dùng chung.** Dùng `Fn` + `.toVar()` + `If`.
    - Tên uniform (`setName`) phải là định danh hợp lệ, không có `-`.
    - TSL không có `atan2`: dùng `atan(y, x)`. Dùng `setName` thay cho `label()`.
  - **Chuyển động và ngẫu nhiên:**
    - Không dùng `time`/`deltaTime` của TSL; dùng `ctx.u.time`.
    - Không dùng `Math.random`; dùng `lib/random.js`.
  - **Chữ và chú thích:**
    - Mọi material gán `emissiveNode`.
    - Chữ người xem thấy nằm trong `strings`/`content`/`meta.name`.
    - Chú thích tiếng Việt ở những điểm cần học.
  - **Commit:** dùng email cá nhân.

## 14. Lộ trình

Mỗi giai đoạn có kế hoạch triển khai riêng (`docs/superpowers/plans/`). Kế hoạch của giai đoạn sau được viết khi giai đoạn trước đã xong và đã deploy.

| Giai đoạn | Nội dung | Điều kiện xong |
|---|---|---|
| **0 · Nền móng** | Xem danh sách ngay dưới bảng | URL công khai chạy Ao Sen Đêm v0 trên cả 2 backend; `?static` hoạt động; unit, luật và hợp đồng đều qua; cổng e2e qua trong CI |
| **1 · Ao sen đầu tiên ✨** | Lớp 1, 2, 4 hoàn chỉnh (gợn sóng xẻ trăng); đom đóm bản đơn giản; `setup`/`shared.js` (giờ mặc định điều khiển trăng); `input.js` + cử chỉ + tia + `ctx.u.pointer`; `CameraSpec.breathe`; `lib/tsl/noise.js`; `content.vi.js` (gợi ý) + lời mời; `ui/moon-svg.js` + `[data-moon]`; `?debug` Inspector và `?debug=stats` (`gpu/debug.js`); e2e `ao-sen-dem.spec.js` | "Phép màu" hiện rõ trên laptop và điện thoại; đã deploy |
| **2 · Sổ tay** | Hoàn thiện `contracts/runtime.js`; núm `js`/`rebuild` + `onKnob`; thanh lớp, chế độ mài; Sổ tay 3 tab; Tweakpane (import động); code sống; nhãn chuyển sang content; tween trọng số; `snapshot`/`restore` + "Dựng lại cảnh"; `sma.expose()`; Phủ bóng chọn tone bằng `If` + đủ núm; tranh mẫu `_mau`; contract test đầy đủ; Phá cho lớp 1/2/4; e2e `setWeight` và Sổ tay | Bật/tắt lớp không khựng; test marker và hợp đồng qua |
| **3 · Sương + Vàng lá GPU** | Lớp 3 hoàn chỉnh; lớp 5 compute + biến thể CPU; `degrade`, `quality.js` của bức và `ladder`; bộ điều chỉnh chất lượng chạy thật. Kèm theo (chốt khi lập kế hoạch GĐ 3): trần 60 khung/giây, trần núm theo mức, bộ điều chỉnh canh cả khi Sổ tay mở; vuốt → sương xoáy; curl noise; thí nghiệm `compare` + ms CPU; `?level`; huy hiệu "hạ {n} nấc"; `__sma.quality/degrade/upgrade/stats`; mục hoãn của GĐ 2 (phản chiếu giả ở mức thấp, bóng tĩnh + khung bóng ôm sát, bỏ compute khi `w5 = 0`, đo draw call); Phụ lục A.29+; lượt màu cả bức so với poster | Điện thoại từ 45fps trở lên; mức cao ≤ 45 draw call; đã deploy |
| **4 · Phủ bóng + Kính mài** | Phủ bóng hoàn chỉnh (chặng `display`: LUT từ bảng màu, grain, vignette, FXAA; `tap`); `Tool` + Kính mài + Lột lớp dựng từ `views()`; `Dial` + `ui/dials.js` + thanh giờ; `?poster` + poster thật + og (`scripts/poster.js`); e2e "mài về cốt"; kiểm tra a11y; README gồm mục "Thêm một bức tranh mới". Kèm theo (chốt khi lập kế hoạch GĐ 4): bộ điều chỉnh đo thời gian GPU thật (chẩn đoán theo máy, `engine/tuner.js`) và ms GPU trong Sổ tay; Kính mài có hai hình (tròn, gạt trước/sau); đồ nghề và thanh giờ nằm trong thanh lớp; a11y bằng axe-core; og dạng JPEG; các mục còn nợ của GĐ 3 (trần khung trên màn 60,0x Hz, nấc `suong.chi-tiet` ở mức thấp, `update(0, t)` khi vẽ lại lúc `?freeze`, kiểm trần do `max()` trả, ba mức cùng bộ khóa, e2e vuốt chứng minh sương xoáy, tách e2e WebGPU ra job riêng, sửa lời spec) | Mọi e2e qua; đã deploy; README đầy đủ |
| **5 · Hoa đăng + Từng sợi** *(tùy chọn)* | Trong sáu mục dự kiến, Bao chọn ba: **trăng tiến độ** (quầng trong `[data-moon]`, mốc từ `boot`/`run`), **Từng sợi** (`engine/gpu/draws.js` + `tools/tung-soi.js`, `ToolApi.draws`, tên vật + nhãn), **thả hoa đăng** (cử chỉ `double-tap`, `ctx.captions` + `ui/captions.js`, đèn gộp InstancedMesh của lớp Ánh trăng, vũng sáng trên nước, 12 cặp câu thơ). Kèm theo: `__sma.readouts`, luật móc lần vẽ, gợi ý mới. Chốt khi dựng thử: bảng công cụ không còn nằm dưới Sổ tay và Tab từ nút công cụ không còn vòng qua cả trang mới tới bảng (lỗi GĐ 4), "Dựng lại cảnh" quá hạn không đụng trang đã về tĩnh cùng bộ test đầu tiên cho `run()` (lỗi GĐ 2), khung chữ một cột (lỗi GĐ 1), luật đường nhẹ không dùng built-in ES2022, luật `files` của lớp kê đủ `parts/`. Ba mục còn lại (link công thức, Xem bản dịch, đàn bầu) để sau (§16) | Mọi test và e2e qua; mức cao vẫn ≤ 45 draw call (đèn không thêm draw call); Bao duyệt chữ của thơ; đã deploy |
| **6 · Bức 2 · Đèn Kéo Quân** | Bức mới theo luật 7 (§18): gian nhà tối, đèn lục giác, đoàn quân rước cờ; sáu lớp Cốt, Ngọn nến, Gian nhà, Giấy, Kéo quân, Phủ bóng; gobo `atan(y, x)` làm node bóng tự viết của ngọn nến, shadow map thật là thí nghiệm "so"; ba cử chỉ thổi nến, giữ trống, gạt trống (tính thẳng theo thời gian); link lật tranh giữa các trang; e2e chia hai phần trên CI. Làm thẳng, task rủi ro nhất trước (§18.9) | Mọi test và e2e qua (cả Bức 1); mức cao ≤ 45 draw call; hợp đồng không đổi; Bao duyệt thơ, hình nhân và poster; đã deploy |
| **7 · Bức 3 · Cung Quế** | Bức mới theo luật 7 (§19): tiểu hành tinh SDF, dò tia trong một khối bao; sáu lớp Cốt, Mặt trời, Bóng mềm, Ánh đất, Lá đa, Phủ bóng; pha trăng thật với Dial "Ngày âm lịch"; chạm cho lá rơi, giữ cho cây bay. Kèm theo: Phòng tranh và trình sinh trang (§19.7); CI chia e2e theo bức (§19.9) | Bức 3 chạy trên cả hai backend, 60 khung/giây trên Mac M2 ở mức cao; e2e chặn qua trong CI; Bao duyệt ảnh và thơ; đã deploy |
| **8 · Bức 4 · Đàn Gà Mẹ Con** | Bức mới theo luật 7 (§20): một tờ tranh Đông Hồ bước vào được; sáu lớp Cốt, Bản màu, Bản nét, Giấy điệp, Đàn gà, Phủ bóng; vẽ phi hiện thực (chia nấc, dò cạnh trên ảnh độ sâu, hạt điệp); chạm để rắc thóc, giữ để gà mẹ gọi con. Kèm theo: camera trực giao và tranh tự khép lại (trường tùy chọn của `CameraSpec`), độ sâu đúng cho camera trực giao, bể hạt `lib/tsl/particles.js` (Bức 1 chuyển sang mà giữ nguyên shader), Sổ tay hiện code của hộp màu | Bức 4 chạy trên cả hai backend, 60 khung/giây trên Mac M2 ở mức cao; mã shader của đom đóm (Bức 1) không đổi; e2e chặn qua trong CI; Bao duyệt ảnh và thơ; đã deploy |
| **9 · Bản dịch + Link công thức** *(tùy chọn)* | Hai công cụ học của xưởng cho cả bốn bức (§21): **Bản dịch** trong Sổ tay › Chỉnh (mã shader thật của RenderObject đang vẽ, bắt từ một khung qua móc lần vẽ: "bắt lúc vẽ", sau khi `getShaderAsync` không qua luật dừng; mọi nơi lớp có mặt, kể cả lượt cuối; sáng dòng theo núm) và **Link công thức** `#r=…` (đọc được; chỉ giá trị khác mặc định; áp lúc dựng; thanh địa chỉ tự mang công thức; nút chép link; mở link thì thanh lớp mở sẵn với dòng tóm tắt và "Về nguyên bản"). Kèm theo: sửa Normal của Kính mài lúc cảnh đang chạy (lỗi từ GĐ 4) | Hai công cụ chạy trên cả hai backend ở cả bốn bức; mã của Bản dịch trùng mã của lượt vẽ cảnh; e2e chặn qua trong CI; Bao duyệt trang ảnh giữa chừng; đã deploy |
| 10+ · *(tùy chọn)* | Chọn từ §16 khi muốn: công cụ học (tô sáng sợi vừa vẽ, bản dịch của compute và theo từng sợi); thêm cho các bức đã có (Bức 3 quay hành tinh, Hằng Nga; Bức 2 Dial gió, hơi nóng; Bức 1 cánh sen sáng xuyên; Bức 4 camera phối cảnh để so); âm thanh (đàn bầu); bản tiếng Anh (§15 d); dọn nợ (tách `tuner.js`); bức mới, như một tranh Đông Hồ khác (lúc đó rút Bản nét, Giấy điệp lên lớp dùng chung theo luật hai lần) | tùy |

**GĐ 0 · Nền móng gồm:**
- **Máy và công cụ:** Node 24 (hướng dẫn fnm), Vite 8, Vitest 5, Playwright; `.gitignore`; `CLAUDE.md`; README khung.
- **Xưởng (phần nhẹ):** `flags`, `tier`, `quality` (chọn mức), `palette`, `deadline`, `sma`, `static` (theo lý do), `boot`, `contracts/`.
- **Xưởng (phần nặng):**
  - `gpu/run`: vòng đời, hòa dần, 3 khung lỗi, lỗi GPU, hạn 10 giây.
  - `gpu/stage`: renderer, nền đặc, camera và controls từ `CameraSpec`, đồng hồ tất định, resize, DPR, mất device.
  - `gpu/disposer`.
  - `gpu/pipeline`: MRT có blend cho emissive; chuỗi `build` → `renderOutput` → `display`; alpha 1.
  - `gpu/layers`: trọng số, núm tĩnh thành uniform có tên hợp lệ.
- **Lớp dùng chung:** Phủ bóng v0 (`meta` + `layer`): bloom chọn lọc, AgX trộn theo `w` (viết bằng `Fn` + `.toVar()`), núm `bloomStrength` và `exposure`.
- **Hộp màu:** `random`, `astro/lunar`, `astro/moon` (chỉ trả số; code gốc đã kiểm bằng 54 test).
- **Giao diện:** `strings.vi` (`t` + `formatSeal`), `shell` (con dấu, `data-state`, hòa dần), `badge` (`data-backend`).
- **Bức 1:**
  - `registry` (`SITE`, `lang`), `ao-sen-dem/meta` (+ `fence`), `index`, `painting` (4 lớp v0 + camera).
  - `l1` v0: lá instanced + đèn xưởng.
  - `l4` v0: đĩa nước + reflector, núm `distortion`, `fresnelPower`.
  - `l5` v0: sprite compute, núm `size`, `glow`.
- **Test:**
  - Unit.
  - Luật (imports, files).
  - Hợp đồng: meta, HTML, thứ tự lớp, marker.
  - E2e: tĩnh (kèm con dấu theo `?at` và không có request three), cổng WebGL2, WebGPU không chặn.
- **Deploy:** repo public, Pages, CI.

## 15. Công thức mở rộng

**(a) Thêm một bức (ví dụ Đèn kéo quân)**
1. `cp -r src/paintings/_mau src/paintings/den-keo-quan`, rồi sửa `slug`, `no`, `title`, `tagline`, `poem`, `poster`, `og` và **`fence`** (từ vựng riêng của bức mới) trong `meta.js`.
2. Viết `layers/lN-*.js` (mỗi file có `id`, `knobs`, `createLayer`), `shared.js` nếu cần, rồi `painting.js` (layers, camera, quality, setup) và `content.vi.js`.
   - Lớp cuối thường là Phủ bóng dùng chung: import `meta` của nó trong meta, `layer` trong painting, `content` trong content.
   - Muốn đổi mặc định của lớp dùng chung thì ghi đè trong `painting.js`: `{ ...phuBong, knobs: phuBong.knobs.map((k) => k.id === 'bloomStrength' ? { ...k, value: 0.3 } : k) }`. Chỉ đổi `value`, `min`, `max`, không đổi `id`, và không sửa module dùng chung (các bức khác lắp chính nó).
     - (GĐ 8) Bức 4 làm vậy cho tone, lộ sáng và bloom của Phủ bóng (§20.4 lớp 6); `tests/paintings/dan-ga-me-con/phu-bong.test.js` giữ
       ba số ấy (id có thật trong lớp dùng chung, giá trị hợp lệ với núm, module dùng chung không đổi).
     - (GĐ 8) Đổi tone hay lộ sáng thì hex in của `meta.palette` là màu VÀO tone mapping, chốt sao cho màu hiện ra đúng màu thiết kế
       (§20.3).
   - (GĐ 5) Đặt `name` cho mọi vật trong `objects` của từng lớp, và nhãn ở `content.layers[id].objects`. Muốn chữ hiện cạnh một vật
     (thơ, chú thích) thì ghi vào `content.captions` rồi gọi `ctx.captions.show(khóa, anchor)` (§4.1 mục 10).
   - (GĐ 7) Bố cục hẹp bề ngang (vật tròn ở giữa khung) thì khai báo `CameraSpec.minHorizontalFov`, để điện thoại dọc không cắt hai bên.
   - (GĐ 8) Bức nhìn bằng camera trực giao (tranh in, sa bàn) thì khai báo `CameraSpec.kind: 'ortho'` cùng `height`, `minWidth`,
     `zoom` (§20.6). Muốn camera tự về góc của bức khi người xem buông tay thì thêm `home: { after, duration }`.
   - (GĐ 8) Hạt tính trên GPU thì dùng bể hạt `lib/tsl/particles.js` (§20.7), luật chuyển động viết trong bức; lớp kê file đó trong
     `files` để Sổ tay hiện cả code của bể (§20.6 mục 4).
3. Thêm một dòng vào `paintings/registry.js`: `{ meta, page: 'tranh/den-keo-quan/index.html', lang: 'vi' }`. (GĐ 6) Registry xếp
   theo `meta.no`.
4. (GĐ 7) Chạy `npm run pages`: trình sinh viết trang của bức mới từ `meta` (§19.7), thêm link "bức sau" vào trang của bức kề trước,
   và thêm bức vào Phòng tranh. Không viết tay trang nữa; test HTML báo khi file trên đĩa lệch với trang sinh ra. (Trước GĐ 7: copy
   `index.html` rồi sửa tay `data-painting`, title, thơ, poster, og, dòng import và link lật tranh.)
5. Chụp poster và ảnh og từ chính cảnh: `npm run build && node scripts/poster.js den-keo-quan` (máy có GPU thật; thời điểm và khung theo
   `meta.poster.capture`). Ảnh ghi vào `public/paintings/den-keo-quan/`; commit cả hai.
6. Chạy `npm test` rồi sửa theo từng lỗi tiếng Việt. Chạy `npm run e2e`: e2e chung tự chạy trên bức mới. Tương tác riêng của bức viết vào `e2e/den-keo-quan.spec.js`.
   - (GĐ 7) Mọi `describe` trong spec riêng bắt đầu bằng `"{tên bức} · "`: CI gom e2e theo bức (`scripts/e2e-groups.js`), nên bức mới
     tự có job riêng mà không sửa workflow. `tests/rules/e2e.test.js` giữ quy ước này.
   - (GĐ 8) Spec riêng dài quá thì tách thêm `e2e/den-keo-quan-<phần>.spec.js` (Bức 4: `-giay`, `-dan-ga`, `-chat-luong`); tiện ích,
     vùng của canvas và tag khói dùng chung ở `e2e/den-keo-quan.helpers.js` (§20.9). Test luật đọc mọi file của bức.
7. Cần thứ gì của Ao Sen Đêm thì **không import chéo**; rút nó lên trước theo công thức (e). Cần khả năng mới của xưởng thì thêm **trường tùy chọn** vào hợp đồng (luật 7).

**(b) Thêm một lớp**
1. Tạo `layers/lN-<id>.js` gồm `export const id`, `export const knobs` và `export function createLayer(ctx, shared)`.
   - Màu nào cũng đi qua `mix(datSet, màu, ctx.weight(id))`.
   - Mọi material gán `emissiveNode`.
   - Thứ lớp sau cần thì ghi vào `shared.<id>`.
   - (GĐ 5) Mọi vật trong `objects` có `name`; nhãn ở `content.layers[<id>].objects`.
2. Với mỗi núm `uniform`: lấy uniform bằng `ctx.knob('<id>')` và ghi `// @knob <id>` ở dòng dùng nó. Núm `js`/`rebuild` thì đặt `via` và thêm `onKnob[id]`, với marker ở dòng xử lý.
3. Thêm `{ id, name, files }` vào `meta.layers`, và thêm module vào `painting.layers`, ở cùng vị trí.
   - (GĐ 5) `files` kê mọi file `parts/` mà lớp import, thẳng hay qua part khác (Sổ tay hiện đủ code); lớp khác cần gì thì nhận qua
     `shared`, không import part của lớp này (test hợp đồng giữ).
4. Thêm `content.vi.js › layers[<id>]`.
5. Nếu lớp tốn tài nguyên: thêm `degrade` (không đụng tới thứ nằm trong cache key), thêm khóa vào `quality.levels`, và đặt vị trí trong `ladder`.
6. Chạy `npm test`. Thanh lớp, lời mời "{n} lớp" và chế độ mài tự nhận lớp mới.

**(c) Thêm một công cụ học**
1. Tạo `src/engine/tools/<id>.js` export `{ id, mount(api) }`. `mount` trả `{ overlay?, onGesture?, activate?, dispose }`.
   - Công cụ ảnh dùng `api.views()` và `api.requireView()`.
   - `overlay()` được ghép khi dựng pipeline, và (GĐ 4) ghép lại khi `requireView` đổi MRT: nó chỉ dựng node, không giữ trạng thái.
     Đổi chế độ bằng uniform, dùng `If` trong `Fn`.
   - (GĐ 4) Thanh điều khiển dựng trong `api.el` bằng `ui/dom.js`. `activate(on)` hiện/giấu thanh và đổi uniform; đổi uniform
     xong thì gọi `api.redraw()`.
   - (GĐ 5) Công cụ soi lần vẽ dùng `api.draws` (`start`, `stop`, `list`, `limit`, `counts`; §8.4), như Từng sợi. Thay cho dự định
     cũ (`ToolApi.layers()`/`stats()`): danh sách lần vẽ đã có lớp, nhãn và số tam giác của từng vật.
2. Thêm một dòng vào `tools/index.js`; thêm chữ vào `ui/strings.vi.js` (`t.tools[id]`). Nút trong mục "Đồ nghề" tự có.
3. Cần buffer mới thì có hai cách: lớp gọi `tap()` trong `post`, hoặc xưởng thêm một kênh (biên dịch lại một lần, hiện "đang mài…").
4. Thêm một kiểm tra vào `e2e/painting.spec.js`. Kiểm tra đó tự chạy trên mọi bức.

**(d) Thêm một ngôn ngữ (ví dụ `en`)**
0. Bật luật tự động "chữ tiếng Việt chỉ nằm trong `strings`/`content`/`meta.name`" trong `rules/files.test.js`.
1. Viết `content.en.js` cho mỗi bức (và cho lớp dùng chung), rồi thêm vào `index.js › content`.
2. Viết `ui/strings.en.js` với cùng bộ khóa như bản `vi`, kèm `formatSeal`.
3. Thêm các trường tùy chọn vào `PaintingContent`: `title`, `tagline`, `posterAlt`, `poemTranslation`. Thêm `LayerContent.name`; UI hiện `content.layers[id].name ?? meta.name`.
4. Tạo trang tĩnh `en/…` (chữ trên poster phải có sẵn trong HTML), rồi thêm dòng registry với `lang: 'en'`. Test HTML so với content khi `lang !== 'vi'`. Đây cũng là lúc làm trình sinh HTML (§16).
5. Thơ giữ nguyên bản gốc, kèm bản dịch nghĩa tự viết. Chú thích code vẫn viết tiếng Việt.

**(e) Rút một kỹ thuật TSL ra dùng lại**
1. Theo luật hai lần: chỉ rút khi bức thứ hai thật sự cần.
2. (GĐ 8) TRƯỚC khi rút, ghi mã WGSL và GLSL của bức cũ thành bản ghi: test dịch material hay compute bằng builder thật
   (`tests/helpers/nodes.js#compileMaterial`, `compileCompute`), thay số id của node bằng `normalizeIds` rồi so bằng `toMatchFileSnapshot`
   (mẫu: `tests/paintings/ao-sen-dem/vang-la-ma.test.js`). Lần chạy đầu (`npx vitest run <file test>`) ghi bản ghi; commit nó trước khi rút.
3. Chuyển phần chung sang `src/lib/tsl/<ten>.js` (`git mv` nếu đi cả file). Đổi đầu vào thành tham số và bỏ từ vựng của bức; hàng rào
   từ vựng sẽ bắt nếu còn sót. Hộp màu không đặt tên uniform: một bức có thể dùng nó hai lần.
4. Chạy lại test bản ghi, KHÔNG có `-u`: mã phải giống từng ký tự. Lệch thì sửa code, không ghi lại bản ghi. Rồi chạy lại e2e của bức cũ:
   `npm run build && npx playwright test --project=webgl2-swiftshader --grep "<tên bức> · "`.
5. Lớp của bức cũ kê `lib/tsl/<ten>.js` trong `meta.layers[].files` (§20.6 mục 4), để Sổ tay vẫn hiện code của phần đã rút.
6. Nếu dùng lại cả một lớp thì tạo `engine/stock/<id>/` gồm `meta.js`, `layer.js`, `content.vi.js` (viết trung tính).
7. (GĐ 8) Ví dụ đã làm: bể hạt compute của đom đóm thành `lib/tsl/particles.js` khi thóc của Bức 4 cần (§20.7). Sáu bản ghi (khởi tạo,
   bước, Sprite; WGSL và GLSL) giống từng ký tự sau khi rút; luật chuyển động ở lại trong bức.

## 16. Để sau (đã có đường đi) và không làm

| Việc | Khi nào | Đường đi |
|---|---|---|
| ~~Trình sinh HTML~~ | Làm ở GĐ 7 | §19.7: `scripts/pages.js` (`npm run pages`) sinh trang từ một khuôn; trang vẫn commit trong repo, test giữ trang khớp. Không làm plugin Vite: trang phải là file thật cho tầng tĩnh, và build không ghi vào thư mục nguồn |
| ~~Phòng tranh `/tranh/`~~ | Làm ở GĐ 7 | §19.7: trang tĩnh sinh từ registry, không có script. URL gốc vẫn là Bức 1 |
| ~~Link công thức `#r=`~~ | Làm ở GĐ 9 | §21.2, §21.4: `engine/recipe.js` đọc, ghi chuỗi đọc được; `gpu/recipe-set.js` lấy mặc định của máy đang xem và khác biệt; áp lúc dựng (núm `rebuild` dựng một lần); thanh địa chỉ tự mang công thức (`replaceState` gộp 500 ms) |
| ~~Xem bản dịch~~ | Làm ở GĐ 9 | §21.1, §21.3: trong Sổ tay › Chỉnh; không chỉ `layer.objects` của lớp mà mọi nơi uniform của lớp có mặt, cộng quad cuối; đọc RenderObject của một khung vẽ thật (bắt lúc vẽ). Tên đặt bằng `setName` là thứ để tìm lớp trong mã |
| ~~Công cụ soi ("Từng sợi")~~ | Làm ở GĐ 5 | §7 Từng sợi: `ToolApi.draws` thay cho `layers()`/`stats()` dự định trước đây |
| Đàn bầu | Khi Bao chọn (GĐ 5 không chọn) | Trường tùy chọn `Painting.sound` cùng `lib/audio/`, chỉ phát khi người xem bật |
| ~~Đông Hồ~~ | Làm ở GĐ 8 | §20: Bức 4 · Đàn Gà Mẹ Con. `CameraSpec.kind: 'ortho'`, thêm `home`; bể hạt `lib/tsl/particles.js`; `meta.palette` đã có từ GĐ 0 |
| ~~Cung Quế~~ | Làm ở GĐ 7 | §19. Khác dự định cũ: dò tia trong một khối cầu bao thay cho mesh phủ màn hình (chỉ tốn ở phần khối chiếm); `depthNode` và `normalNode` trên `NodeMaterial` gốc; không cần `meta.requires`, vì WebGL2 chạy được; nấc đầu là `dpr`, rồi bóng, rồi số bước |
| (GĐ 7) SDF, dò tia, bóng mềm dùng chung | Luật hai lần: khi bức thứ hai cần | `git mv` phần chung của `parts/cot-sdf.js`, `parts/cot-do-tia.js`, `parts/bong-mem-tia.js` sang `lib/tsl/sdf.js`; đầu vào thành tham số |
| (GĐ 7) Dò bóng ở độ phân giải thấp hơn | Khi đo thấy bóng mềm quá đắt trên điện thoại | Một lượt vẽ riêng ghi độ che của nắng ở nửa độ phân giải, rồi lớp Bóng mềm đọc lại; thêm một nấc |
| (GĐ 7) Vuốt quay hành tinh, khóa thủy triều | Khi Bao chọn (GĐ 7 không chọn) | Góc quay tính thẳng theo thời gian như trống của Bức 2, rồi từ từ quay mặt có chú Cuội về Trái Đất |
| (GĐ 7) Hằng Nga, cung điện trên trăng | Khi Bao chọn | Thêm hình vào `scene`; hình bao riêng để không tăng giá của điểm ảnh ở xa |
| Wrap lighting cho cánh sen | Khi làm lighting model riêng (GĐ 5+) | `LightingModel` tự viết cho cánh; hiện viền fresnel + `translucency` đã cho cảm giác cánh mỏng |
| Test số của `rippleHeight` | Khi có bộ tính TSL trên CPU | Hiện chỉ kiểm dựng được node; e2e "chạm mặt nước đổi ảnh" giữ hành vi |
| ~~Đo ms GPU thật cho thí nghiệm `compare`~~ | Làm ở GĐ 4 | §10 "Bộ điều chỉnh đo được thời gian GPU": `gpu-timer.js`, cột ms GPU trong "Tắt / Bật" |
| Trả nấc đã hạ lúc canh, khi đóng thanh lớp mà đang bị khóa nhịp (máy không đo được GPU) | Khi gặp trên máy thật | Trả dần các nấc đó khi về lại đúng nhịp bị khóa, như luật "dư" |
| Khóa nấc chống dao động kéo dài cả phiên | Khi số đo GPU cho thấy khóa quá chặt | Mở khóa sau vài phút, hoặc khi tải GPU dư nhiều |
| Đo GPU trên GPU kiểu tile (Apple, điện thoại) | Khi three trả thời điểm đầu/cuối của từng pass, hay khi cần đường tải trên Mac | Lấy khoảng từ lúc pass đầu bắt đầu tới lúc pass cuối xong (span của khung) thay cho tổng các pass (Phụ lục A.48). Hiện luật 1,5 lần nhịp khung tắt việc đo trên các máy này |
| Đổi bán kính kính tròn (lăn chuột, chụm hai ngón) | Khi người xem cần | Uniform `uLensRadius` đã có, chỉ còn thiếu cử chỉ |
| Các mục nhỏ còn lại từ PR #3: đổi cỡ khung vẽ lại bóng một lần thừa; Inspector ném lỗi trong hook khi có `?debug`; `onKnob` ném lỗi giữa chừng để lại trạng thái dở | Khi gặp | Ghi trong PR #3, phần "Để sau" |
| Tự lùi về đom đóm CPU khi compute WebGL2 hỏng | Khi gặp máy thật lỗi | Đếm lỗi của `renderer.onError` trong vài khung đầu; quá ngưỡng thì bật biến thể CPU làm mặc định cho lần dựng đó |
| Rút `curl`, noise JS sang dùng chung | Luật hai lần | `curl` đã ở `lib/tsl/noise.js` (spec đặt từ đầu); noise JS của biến thể CPU ở lại `parts/vang-la-cpu.js` tới khi bức thứ hai cần |
| ~~Trăng làm thanh tiến độ~~ | Làm ở GĐ 5 | §4.1 mục 1, §8.5: quầng trăng |
| Từng sợi cho mọi lượt vẽ (phản chiếu, bloom, hậu kỳ) | Khi người xem cần | `DrawProbe` đã đếm lần vẽ của camera khác; bloom và RTT của FXAA tự cất móc (`resetRendererState`, Phụ lục A.53), nên phải móc ở chỗ khác hay dùng Inspector |
| Từng sợi tách hai lần vẽ của vật trong suốt DoubleSide | Khi một bức có material như thế | three vẽ cả hai mặt trong MỘT lần gọi móc (§7, Phụ lục A.53): đặt `forceSinglePass`, hay chia thành hai material |
| Chữ đi theo vật đo lại khi bố cục đổi giữa chừng | Khi thấy chữ lệch sau khi xoay máy | Hiện cỡ chữ và chân khung chỉ đo lúc `show` (§4.1 mục 10). Đo lại khi `resize`, hay `ResizeObserver` trên các ô của chân khung |
| Tô sáng sợi vừa vẽ | Khi người xem cần | Vẽ thêm một lượt mặt nạ cho vật của sợi k, rồi overlay trộn viền vàng lá như Kính mài |
| Tách `engine/tuner.js` (gần 290 dòng sau gói sửa sau GĐ 5, quá mức mềm 250) | Lần sửa bộ điều chỉnh kế tiếp | Đưa đường tải (GĐ 4: `byLoad`, ngưỡng `busy`/`idle`/`light`) ra file riêng; trạng thái hai đường dùng chung (`overRun`, `capped`, `down`/`up`…) đi qua một object |
| Hoa đăng tránh lá, hay bị gợn đẩy đi | Khi thấy cần | Đường trôi hiện tính thẳng theo thời gian (tất định với `?freeze`); bị đẩy thì phải tích phân từng khung, và `update(0, t)` phải giữ đúng khung N |
| Hoa đăng chiếu sáng thật | Không làm | Mỗi `PointLight` thêm lúc chạy là biên dịch lại mọi material và tốn thêm ở mọi điểm ảnh; vũng sáng trên nước đã cho cảm giác đèn soi nước |
| (GĐ 6) Hơi nóng trên miệng đèn kéo quân | Khi người xem cần | `post.build` của một lớp: lệch UV của ảnh cảnh theo noise trong vùng phía trên miệng đèn (chiếu vùng đó ra màn hình) |
| (GĐ 6) Shadow map thật có màu giấy | Khi thí nghiệm "Shadow map thật" cần giống hơn | `castShadowNode` của giấy (bóng có màu) cùng `renderer.shadowMap.transmitted = true` (Phụ lục A.80); đổi cờ đó lúc chạy chưa kiểm |
| (GĐ 6) Đèn kéo quân đung đưa khi thổi | Khi thấy cần | Con lắc tính thẳng theo thời gian như trống (§18.5); trục đèn thành uniform của gobo |
| (GĐ 6) Dial cho Bức 2 (gió, độ cao bấc nến) | Khi Bao chọn | `setup().dials`; gió đổi tốc độ thường của trống và độ ngả của lửa |
| (GĐ 8) Thí nghiệm "Camera phối cảnh" cho Bức 4 | Khi Bao chọn | Sân khấu giữ hai camera cùng khung (fov chọn để ở điểm nhìn, bề cao khung bằng `height`); đổi `stage.camera`, `controls.object` và camera của scene pass. Độ sâu chọn bằng uniform trong `If` thay cho chọn lúc dựng. Lần bật đầu biên dịch lại, vì hướng nhìn khác theo loại camera (Phụ lục A.91) |
| (GĐ 8) Nét từ pháp tuyến | Khi dò cạnh trên độ sâu thiếu nét | Trường tùy chọn để bức xin kênh normal trong MRT ngay lúc dựng (biên dịch một lần, không đổi MRT giữa chừng); Bản nét cộng độ dốc của pháp tuyến |
| (GĐ 8) Rút Bản nét, Bản màu, Giấy điệp lên lớp dùng chung | Luật hai lần: khi bức thứ hai cần (một tranh Đông Hồ khác, như Đàn lợn âm dương) | `engine/stock/<id>/` như Phủ bóng, chữ viết trung tính; fence của Bức 4 đã không rào tên kỹ thuật (§20.6) |
| (GĐ 8) Chữ Hán Nôm in trên tranh | Khi Bao chọn | Chữ vẽ sẵn thành texture, dán ở góc tờ giấy, màu mực của bản nét |
| (GĐ 8) Bóng in dưới chân gà | Khi thấy gà "lơ lửng" lúc xoay | Một hình bầu dục tối mềm trên giấy dưới mỗi con, tính từ mảng vị trí (uniform); không dùng shadow map |
| (GĐ 9) Bản dịch của compute shader (đom đóm, thóc) | Khi three có API công khai, hay khi Bao chọn | three không có hàm công khai trả mã compute: đọc `renderer._nodes.getForCompute(node).computeShader` (trường riêng, ghim bằng test), hay dịch riêng như `tests/helpers/nodes.js#compileCompute`; lớp khai báo node compute của mình bằng một trường tùy chọn |
| (GĐ 9) Bản dịch theo từng sợi | Khi người xem cần | Bảng của Từng sợi thêm nút "Xem bản dịch" của sợi đang xem; dùng chung `translate.js` |
| (GĐ 9) Công thức mang thí nghiệm, góc camera | Khi Bao chọn | Thêm loại khóa riêng cho thí nghiệm và cho camera; Bức 4 tự khép lại, nên góc camera chỉ có nghĩa ở Bức 1–3 |
| (GĐ 9) Chia sẻ bằng bảng chia sẻ của điện thoại | Khi thấy cần | Nút chép link dùng `navigator.share` trên máy có bảng chia sẻ, chép link ở máy khác |

**Không làm**, và lý do:
- **npm workspaces:** một repo, một người đọc; thư mục cộng test ranh giới là đủ.
- **plugin loader, SPA router:** mỗi bức là một trang, GH Pages phục vụ trực tiếp.
- **scene DSL / JSON, ECS, class kế thừa cho lớp:** hàm thuần `createLayer` dễ đọc hơn cho người học.
- **thư viện i18n:** đuôi `.vi.js`, map `content` và `t` truyền qua tham số là đủ.
- **event bus, state store:** trạng thái đã nằm trong uniform; `snapshot()` suy ra từ đó.
- **validator chạy ở production:** CI đã chặn trước.
- **TypeScript:** JSDoc là đủ, và không cần bước build.

## 17. Rủi ro và cách tránh

- **API TSL thay đổi nhanh, AI hay bịa API.**
  - Ghim phiên bản; đối chiếu với `node_modules/three/src`, `examples/jsm` và tag `r186`; ghi luật trong `CLAUDE.md`.
  - Bản thử GĐ 0 (Ao Sen Đêm v0) dùng đúng các API mà cảnh sẽ dùng.
  - Phụ lục A là bằng chứng đã kiểm, gồm cả những cái bẫy đã tìm ra (`select()`, target của reflector, tên uniform).
- **WebGL2 qua WebGPURenderer trên Android yếu.**
  - Mức thấp mặc định dùng phản chiếu giả.
  - `compileAsync` chạy sau khi poster đã hiện.
  - Có bộ điều chỉnh tự động; chấp nhận mục tiêu 45fps.
- **Compute trên WebGL2.** Đã chạy được, với giới hạn 4 bộ đệm mỗi kernel và chỉ đọc phần tử của chính mình. Biến thể CPU là đường lùi chính thức.
- **WebGPU trên CI ubuntu chưa rõ.** Project WebGPU e2e để không chặn cho tới khi lần chạy đầu cho thấy kết quả.
- **Pixel khác nhau giữa các máy.** So pixel chỉ trong cùng máy, cùng backend, cùng `?freeze=N`. Ngưỡng "sáng/tối" rộng, không so ảnh tuyệt đối.
- **Trông na ná "ao đêm có đom đóm" của các trang khác.** Dùng chất liệu sơn mài thật (clearcoat, LUT sơn mài), màu sen lấy từ ca dao, không neon, bloom chọn lọc.
- **Logic của bức rò vào xưởng.** Có hàng rào từ vựng lấy từ meta của mọi bức, test ranh giới và luật hai lần.
- **Mở rộng làm chậm Bức 1.** Các điểm nối tốn khoảng 1–1,5 ngày tính cả test, rải qua các giai đoạn. GĐ 0–4 chỉ làm những gì ghi ở §14.
- **Phạm vi phình to.** Chưa đạt ngân sách FPS thì không thêm lớp; giai đoạn nào xong cũng phải deploy; giai đoạn 5 và 6 là tùy chọn.
- **(GĐ 6) Bức 2:** hình nhân trông thô, node bóng tự viết là đường ít người dùng của three, mip khác nhau giữa hai backend, chi phí
  trên điện thoại, CI dài gấp đôi. Cách tránh ở §18.10.
- **(GĐ 3) Bộ điều chỉnh đoán sai.** Nhịp rAF không phải thời gian GPU: nó bị khóa theo màn hình và theo chế độ tiết kiệm pin.
  - Luật "dư" tính cả trường hợp không rớt khung; nâng rồi phải hạ ngay thì khóa nấc; hạ hết mà không nhanh hơn thì trả lại hết (§10).
    (Sau GĐ 5) Trước lần hạ đầu của một đợt hạ, ngừng vẽ chừng 0,2 giây để biết trình duyệt có đang khóa nhịp không.
  - Logic nằm trong một hàm thuần, test bằng chuỗi khung giả cho từng tình huống; chỉ canh quá tải nặng khi Sổ tay mở; tắt khi `?freeze`.
  - Huy hiệu và `__sma.quality()` cho thấy máy đang hạ gì, nên người xem và Bao biết khi nó hạ.
- **Máy của Bao đang tắt WebGL và dùng Node 20.** Kiểm tra `chrome://gpu`; cài Node 24 bằng fnm (§13). Tầng C giải thích cách bật lại tăng tốc phần cứng.
- **(GĐ 4) Số đo GPU không đáng tin như nhau trên mọi máy.** Chrome làm tròn timestamp (bước 0,066 ms trên máy dựng thử); WebGL2 có
  thể báo "disjoint"; GPU kiểu tile (Apple, điện thoại) báo thời lượng các pass chồng lên nhau, và three cộng chúng lại (Phụ lục A.48).
  - Số lớn hơn 1,5 lần nhịp khung của mẻ là số vô lý. Trên GPU Apple, luật này làm việc đo thôi sau 3 mẫu có trần (mẫu của lần
    hỏi đầu bị bỏ vì chưa có nhịp để so).
  - Chỉ dùng số GPU khi một cửa sổ có từ 3 mẫu hữu hạn trở lên, và lấy trung vị. Số vô lý thì bỏ; hỏng liền thì tắt đo cho phiên đó.
  - Máy không đo được thì đi đường nhịp của GĐ 3, vốn đã test kỹ.
  - E2e trên SwiftShader không kiểm được số GPU thật. Bù lại có project GPU thật ở máy local, và mục kiểm tra thủ công.
- **(GĐ 4) axe-core báo nhầm hoặc báo thiếu.** Canvas không có chữ; Tweakpane tự dựng DOM của nó.
  - Chỉ bỏ qua đúng luật và đúng vùng, kèm lý do ghi ngay trong test. Lỗi thật thì sửa.
  - axe không thay được VoiceOver, nên vẫn giữ mục kiểm tra thủ công.
- **(GĐ 4) `requireView` biên dịch lại mọi material.** Trên máy yếu và trên SwiftShader có thể khựng vài giây. Có chữ "đang mài…", và việc
  này chỉ xảy ra một lần mỗi phiên, khi người xem chọn Normal.
- **(GĐ 4) Poster chụp trên GPU của Bao.** Người xem nhận một file ảnh tĩnh, nên không phụ thuộc máy của họ. Nhưng chạy lại script
  trên máy khác sẽ ra ảnh hơi khác, vì vậy chụp lại poster là việc có chủ ý và cần Bao duyệt.
- **(GĐ 5) Móc `setRenderObjectFunction` là API ít người dùng.** Bản sau của three có thể đổi cách gọi nó.
  - Ghim r186; Phụ lục A.53 ghi đúng chỗ three gọi, cất và trả móc. Chỉ `draws.js` đặt móc (luật §8.2), móc gọi lại hàm trước đó, và
    `stop()` luôn trả hàm cũ.
  - Unit test dùng renderer giả; e2e giữ hai đầu: sợi 0 gần như một màu, sợi N đúng bằng ảnh không có công cụ.
  - Chỗ dễ vỡ nhất là THỨ TỰ `updateBefore` của lượt cuối (Phụ lục A.53): móc chỉ thấy lượt vẽ cảnh khi scene pass vẽ đầu tiên.
    `tests/unit/pipeline.test.js` dựng lượt cuối bằng `WGSLNodeBuilder` thật để bắt ngay khi three đổi thứ tự đó.
- **(GĐ 5) E2e chạm hai lần phụ thuộc thời gian.** Hai lần chạm phải trong 300 ms, mà mỗi sự kiện chuột của Playwright đợi một nhịp
  khung (Phụ lục A.51), có khi vài trăm ms trên GPU phần mềm. E2e phát sự kiện ngay trong trang, trong một lần `page.evaluate`:
  `e2e/helpers.js#doubleTapAt(page, fx, fy, { gapMs = 40 })` phát `pointerdown`/`pointerup`, chờ `gapMs` ngay trong trang
  (`setTimeout`), rồi `pointerdown`/`pointerup` lần nữa, với `pointerId: 1`, `pointerType: 'mouse'` (sau GĐ 5,
  `{ pointerType: 'touch' }` cho đường của ngón tay, vẫn id 1): OrbitControls gọi
  `setPointerCapture(pointerId)` lúc chạm xuống, mà hàm đó ném lỗi với id không phải con trỏ đang có (Phụ lục A.66); con trỏ chuột
  (id 1) thì Chromium luôn có. Hàm trả `__sma.frames` ngay sau lần chạm hai.
  - Trong lúc chờ `gapMs`, trang vẫn chạy tiếp: luồng chính kẹt quá chừng 260 ms (300 − 40) giữa hai lần chạm thì cử chỉ thành hai
    lần chạm thường, và test HỎNG (`lanterns` vẫn 0, không có chữ), không bao giờ qua oan.
  - Phép so của test hoa đăng dùng `gapMs: 600` (quá 300 ms): hai lần chạm thường. Unit test của `gesture` giữ các ngưỡng.
- **(GĐ 5) Chạm hai lần trên điện thoại có thể làm trình duyệt phóng to.** OrbitControls đặt `touch-action: none` cho canvas, nên
  trình duyệt không phóng to khi chạm vào cảnh. Kiểm trên điện thoại thật (§12).
- **(GĐ 5) Thơ in sai chữ.** Lúc viết spec, mười một cặp câu đã ghi là đối chiếu rồi, nhưng lần đối chiếu lại trước khi deploy vẫn bắt
  được một chữ khác bản phổ biến (`trang-khoe` ghi "lại" thay vì "phải"). Ca dao có nhiều dị bản: thêm câu nào thì đối chiếu với vài
  nguồn và chọn bản in phổ biến nhất. Bao đọc lại thơ trên trang thật (§12). Chữ nằm trong `content.captions.vi.js`, sửa không đụng
  tới code.
- **(GĐ 5) Đèn trôi xuyên qua lá.** Đèn nổi cao hơn lá và đi về phía lối trăng, nơi Cốt chừa trống, nên chỉ lướt qua lá một lúc ngắn.
  Tránh lá thật sự để sau (§16).

---

## 18. Bức 2 · Đèn Kéo Quân (GĐ 6)

> Một ngọn đèn kéo quân treo giữa gian nhà tối. Ánh nến xuyên qua giấy màu, hắt bóng voi, ngựa và lính rước cờ chạy vòng
> quanh bốn vách.

**Nơi ở:** `src/paintings/den-keo-quan/`, trang `tranh/den-keo-quan/index.html`, poster ở `public/paintings/den-keo-quan/`. Lớp 6 là
Phủ bóng dùng chung. Mọi luật của kỹ thuật (§0) và của xưởng (§8–§10, `CLAUDE.md`) áp như Bức 1; chương này chỉ ghi phần riêng của
Bức 2. Những gì Bao đã chọn nằm ở §1 (GĐ 6); phần còn lại của chương này do Claude quyết, Bao duyệt khi đọc spec.

**Số trong chương này** (đơn vị mét, giây) là số thiết kế. Số cuối cùng chốt lúc làm (§18.9); số nào đổi thì sửa lại ở đây, trong cùng task.

### 18.1 Cảnh
- **Gian nhà** rộng 5 × 5, cao 3,2:
  - sàn gạch bát; ba vách vôi (sau, trái, phải); trần ván gỗ với ba xà ngang; hai cột sơn son ở hai góc sau;
  - phía camera để trống: không có vách thứ tư (camera không bao giờ quay ra sau, §18.2).
- **Đèn** treo bằng một sợi dây từ xà giữa. Trục đèn ở x = 0, z = −0,6, cách vách sau 1,9 và cách hai vách bên 2,5.
  - Đèn lục giác: khung tre, sáu tấm giấy cao khoảng 0,38, bán kính ngoại tiếp 0,17; chóp và tua ở sáu góc.
  - Một tấm giấy quay thẳng về camera, không phải một góc. Nhờ vậy không có nan nào che giữa ngọn lửa, và giữa vách sau không có vạch
    tối của nan: hai vạch nan rơi ra hai bên đoàn quân (chốt lúc làm lớp Giấy, GĐ 6).
  - Đáy kín (đế gỗ giữ nến). Miệng trên hở cho khí nóng thoát ra.
  - Bên trong, từ dưới lên:
    - cây nến đứng trên đế; ngọn lửa ở giữa chiều cao của dải hình nhân;
    - trống hình nhân: bán kính 0,09, dải hình cao 0,14;
    - trên cùng là chong chóng tám cánh, quay cùng trục với trống.
- **Bóng phóng to theo khoảng cách:**
  - Vách sau cách trục 1,9, nên bóng to gấp 1,9 / 0,09 ≈ 21 lần: hình nhân cao 6 cm thành bóng cao khoảng 1,3 m, và cả dải hình
    phủ gần hết chiều cao vách.
  - Vách bên xa hơn (2,5), nên bóng to hơn và tràn lên trần, xuống sàn.
  - Trên trần có một vầng sáng tròn: ánh nến đi qua miệng đèn, mang bóng chong chóng xoay.
  - Ngay dưới đèn, sàn tối vì đế đèn che; ra gần vách thì sàn sáng dần. Nến đặt đủ cao để vùng tối này không nuốt hết sàn.
- **Trang không có trăng trong cảnh**, nhưng vẫn giữ trăng SVG cạnh con dấu: trăng đúng pha của đêm nay, và quầng tiến độ (§4.1
  mục 1) chạy như ở Bức 1.
- **Không có Dial.** Ba cử chỉ đã là cách chơi, nên thanh lớp không có thanh trượt nào dưới Đồ nghề.

### 18.2 Trải nghiệm riêng của Bức 2
- **Camera** (`CameraSpec`):
  - đứng phía trước gian, cao ngang đèn, nhìn hơi ngước về đèn và vách sau;
  - giới hạn xoay ngang, xoay dọc và khoảng cách giữ camera luôn ở trong gian: không bao giờ thấy mép ngoài của vách;
  - `breathe` nhỏ.

  Số chốt lúc làm (`painting.js`): `position` [0; 1,45; 2,1], `target` [0; 1,55; −0,6], `fov` 50, xoay ngang ±0,6, xoay dọc 1,3–1,75,
  khoảng cách 1,8–2,75, `breathe` 0,03. Ở khoảng cách lớn nhất và góc ngang lớn nhất, camera vẫn cách mỗi vách hơn 0,9 m.
- **Gợi ý** (`content.hint`): *"Chạm để thổi nến · vuốt để gạt đèn · giữ để dừng"*.
- **Ba cử chỉ.** Bức nhận cử chỉ qua `setup().onGesture`. Chạm ở đâu trên tranh cũng được; công cụ học vẫn được ưu tiên như ở mọi
  bức.
  1. **Chạm là thổi nến** (`'tap'`):
     - Ngọn lửa ngả ra xa người xem, theo hướng nhìn của camera chiếu xuống mặt sàn. Lửa chập chờn rồi đứng lại trong khoảng 2 giây;
       đèn tối đi một chút rồi sáng lại.
     - Nguồn sáng nhích tối đa 1,2 cm, nên bóng trên vách sau dời cả mảng, chừng 20–25 cm: đúng cảnh "bóng khổng lồ rung theo ngọn
       lửa".
     - Chạm liền nhiều lần thì các lần thổi cộng lại, tối đa 4 lần cùng lúc (như vòng gợn của Bức 1).
  2. **Giữ là giữ trống** (`'hold-start'` → `'hold-end'`):
     - Trống chậm lại và dừng trong khoảng nửa giây, đoàn quân đứng yên trên vách.
     - Thả tay thì trống quay lại, dần về tốc độ thường trong vài giây.
     - Camera không xoay trong lúc giữ: xưởng đã tắt OrbitControls khi giữ (`input.js`, §8.1).
  3. **Vuốt là gạt trống** (`'swipe'`):
     - Trống quay nhanh hơn theo chiều vuốt (tăng theo vận tốc vuốt, có trần), rồi chậm dần về tốc độ thường.
     - Vuốt ngược chiều quay thì hãm trống, có thể làm nó quay ngược một lúc.
  - `'double-tap'` không làm gì: hai `'tap'` đến trước nó đã là hai lần thổi. Kéo vẫn là của camera.
  - **Tất định:** góc trống và độ ngả của lửa tính thẳng từ thời gian (§18.5), nên `?freeze` và `update(0, t)` cho đúng khung N.
  - Người xem xin giảm chuyển động thì trống quay chậm còn một nửa, lửa nhấp nháy và ngả ít hơn, và camera không thở.
- **Thơ của cả bức** (`meta.poem`, in sẵn trong HTML):

  *"Khen ai khéo kết đèn cù / Voi giấy, ngựa giấy tít mù vòng quanh"* (ca dao).
  - Đây là hai câu lục bát của bài dân ca "Đèn cù". Đèn cù là tên khác của đèn kéo quân. Lúc hát có thêm tiếng đệm ("ối a", "nó
    lại").
  - Nhạc sĩ Đỗ Nhuận chỉ viết thêm đoạn mở đầu cho bài hát, nên lời gốc là dân gian (báo Tiền Phong, "Trung thu, đèn cù và Đỗ
    Nhuận").
  - Dị bản: "khéo kết" hay "khéo xếp"; dấu phẩy sau "Voi giấy" có nơi có, nơi không. Đối chiếu ngày 2026-10-04 (mọi nguồn đều in bản
    hát, có tiếng đệm "ối a", "cái", "nó lại"):
    - "khéo kết": báo Tiền Phong ("Trung thu, đèn cù và Đỗ Nhuận"); tên bài của Đỗ Nhuận, "Khen ai khéo kết cái đèn cù";
    - "khéo xếp": Wikipedia tiếng Việt ("Đèn kéo quân", mục dân ca), báo Công giáo và Dân tộc ("Ký ức đèn cù vòng quanh", in
      "Voi giấy, ngựa giấy" có dấu phẩy), lời dân ca trên trang karaoke;
    - chưa mở được bản số hóa của hai bộ sách ca dao (Kho tàng ca dao người Việt; Tục ngữ ca dao dân ca Việt Nam của Vũ Ngọc Phan).

    Trang dùng bản lục bát không tiếng đệm: "Khen ai khéo kết đèn cù / Voi giấy, ngựa giấy tít mù vòng quanh". Bao chốt "kết" hay
    "xếp" trước khi merge, như GĐ 5; đổi thì sửa `meta.poem` và thơ in sẵn trong trang (test HTML giữ hai chỗ khớp nhau).
  - Câu thơ hợp đúng bộ hình nhân: voi giấy, ngựa giấy chạy vòng quanh.
- **Lật tranh** (§18.6):
  - header của Bức 2 có link "← Bức 1 · Ao Sen Đêm";
  - Bức 1 có thêm link "Bức 2 · Đèn Kéo Quân →".

### 18.3 Chỉ đạo nghệ thuật
- **Không khí:**
  - gian nhà chìm trong đêm, ánh nến ấm loang trên vách vôi;
  - mấy mảng màu đỏ son, vàng lá, xanh lục, chàm của giấy hắt lên tường;
  - đoàn quân to lớn, mép bóng mềm, lặng lẽ chạy vòng.

  Không neon, không màu bão hòa gắt.
- **Không gắn với lễ hội** (giữ giả định ở §1): không lân, không mâm cỗ, không trẻ con rước đèn. Chỉ có một ngọn đèn trong một đêm
  bình thường.
- **Bảng màu:** dùng bảng sơn mài (§5). Bức thêm hai token qua `meta.palette`:
  - `lua` (lửa cam, khoảng `#E0782E`): rìa ngọn lửa và màu ánh nến;
  - `giayDo` (giấy dó, khoảng `#D9C7A0`): nền của giấy chưa nhuộm.

  Số hex chốt ở lượt màu. LUT của Phủ bóng sinh từ bảng đã ghép, nên tự đổi theo.
- **Giấy sáu màu** quanh đèn, theo thứ tự: đỏ son, vàng lá, xanh lục, đỏ son, vàng lá, chàm. Tấm chàm làm một góc phòng tối và lạnh
  hơn: cảnh có chỗ nghỉ mắt.
  - Tấm quay về camera là vàng lá, rồi theo thứ tự trên: tấm nhìn ra vách sau cũng là vàng lá (sân khấu chính sáng nhất), góc sau
    bên trái là chàm.
  - Núm `sides` 4 hay 8 thì sáu màu được rải đều quanh đèn, nên tấm nhìn ra vách sau vẫn là vàng lá.
- **Hình nhân:** mặc định 8 hình. Núm `figures` cho 6–10 hình, lặp lại theo thứ tự này (mười hình ngựa và voi đã kín chu vi dải, nên
  trần là 10):
  1. người cưỡi ngựa phất cờ;
  2. lính vác cờ đuôi nheo;
  3. voi có bành và người quản tượng;
  4. người đánh trống (trống đeo trước ngực);
  5. lính cầm giáo;
  6. ngựa không người;
  7. người cầm lọng;
  8. người thổi tù và.

  - Dáng **cắt giấy**: mỗi hình ghép từ vài hình cơ bản (elip, viên thuốc, đa giác).
  - Chân ngựa và cờ có nhịp so le, để bóng chạy có tiết tấu.
  - Mọi hình đứng chung một đường chân: mép dưới của dải.
  - Bao duyệt ảnh của đủ 8 hình, cả bóng trên vách, ở điểm duyệt ảnh giữa chừng (§18.9), trước khi làm các lớp còn lại.
- **Poster:**
  - chụp từ cảnh bằng `scripts/poster.js den-keo-quan`, lúc đoàn quân đang ở chỗ đẹp trên vách sau;
  - `poster.capture = { at: '2026-10-25T21:00', freeze: 200 }`: khung 200 có con ngựa phi và lá cờ giữa vách sau (chốt ở lượt màu);
  - `poster.alt`: "Tranh sơn mài đèn kéo quân: ngọn đèn giấy treo giữa gian nhà tối, bóng voi ngựa chạy quanh vách.".
- **Lượt màu:**
  - đo như §5: độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối; ở 1280×800 và 390×844, trên GPU thật;
  - số mặc định của các núm nằm trong một commit riêng;
  - Bao duyệt ảnh.
  - (Đo 2026-10-04, Mac M2, `?at=2026-10-25T21:00&freeze=240&level=cao`, DPR 1; độ sáng 0–255, độ bão hòa HSV, điểm tối là kênh lớn
    nhất < 30.) Trước lượt màu: 52,4 / 0,50 / 10,7% ở 1280×800 và 74,1 / 0,57 / 15,0% ở 390×844. Ảnh ấm nhưng "sữa": vách sau màu
    kem nhạt, giấy pastel, bóng ngả xám tím.
  - Lượt màu: cường độ nến 8 → 6,3; độ đậm màu nhuộm 0,7 → 0,9; ánh đêm 10% → 7%; phơi sáng của giấy 0,05 → 0,04. Sau: 40,3 / 0,51 /
    21,1% và 61,3 / 0,61 / 18,5%. Tối và ấm hơn; ba mảng màu trên vách (vàng lá ở giữa, đỏ son bên phải, chàm lạnh bên trái) và ba
    tấm giấy trước mặt đọc rõ; đoàn quân vẫn rõ. Màu `lua`, `giayDo` giữ như thiết kế.

### 18.4 Sáu lớp
**Nối các lớp.** Như Bức 1: lớp trước công bố trong `shared.<id>`, lớp sau sửa node của lớp trước trước khi biên dịch.

Riêng Bức 2 có **node bóng của ngọn nến**, được ba lớp góp vào:
1. Ngọn nến tạo `PointLight` với `castShadow = true`, rồi gắn `light.shadow.shadowNode` là một node giữ chỗ bằng 1.
   - Có node riêng thì three không dựng shadow map cho đèn này (Phụ lục A.77).
   - Không có node riêng thì three dựng cube shadow map, và mỗi khung vẽ bóng 6 lần.
2. Giấy nhân thêm màu của tấm giấy mà tia sáng đi qua: `shadowNode = node trước × mix(1, màu giấy, w4)`.
3. Kéo quân nhân thêm bóng của hình nhân, khung tre và đế đèn: `shadowNode = node trước × mix(1, gobo, w5)`.

Nhờ vậy:
- Mọi bề mặt nhận bóng (sàn, vách, trần, xà, cột) có màu và bóng đúng theo hệ chiếu sáng PBR của three.
- Bật/tắt lớp chỉ là đổi uniform.

Hai cờ đặt một lần lúc dựng, không đổi lúc chạy:
- `renderer.shadowMap.enabled = true`, ở mọi mức: node bóng tự viết chỉ chạy khi cờ này bật (Phụ lục A.77).
- Vật nhận bóng đặt `receiveShadow = true`. Giấy và các vật bên trong đèn không nhận bóng: giấy tự tính ánh sáng xuyên qua nó.

#### Lớp 1 · Cốt (`layers/l1-cot.js`)
- **Thấy gì:**
  - gian nhà, cột, xà, dây treo;
  - đèn: khung tre, giấy, đế, chóp, tua;
  - bên trong: trống hình nhân, chong chóng, cây nến.

  Tất cả là đất sét dưới đèn xưởng (`HemisphereLight` xám, như Bức 1).
- **Kỹ thuật:**
  - Hình học tự sinh: hộp và mặt phẳng cho gian nhà; `InstancedMesh` cho xà, cột, nan tre và tua. Gian nhà ở `parts/cot-phong.js`,
    đèn ở `parts/cot-den.js`.
  - Trống, khung tre, đế, chong chóng và cây nến đặt `castShadow = true` ngay lúc dựng, giấy thì không. Gobo không cần cờ này; nó chỉ
    để thí nghiệm "Shadow map thật" của lớp Kéo quân có vật đổ bóng mà không đổi cache key lúc chạy.
  - **Mặt nạ hình nhân** (`parts/cot-hinh-nhan.js`, hàm thuần, không import three):
    - Hình nhân khai báo bằng dữ liệu: các hình cơ bản, đặt trong khung riêng của từng hình.
    - `rasterize(figures, width)` vẽ ra một dải độ phủ 8 bit, rộng `width`, cao `width / 4`. Tỉ lệ này cho texel vuông trên mặt
      trụ: chu vi 2π × 0,09 ≈ 0,57 m, dải cao 0,14 m.
    - Mép mịn nhờ khoảng cách có dấu tới mép hình: độ phủ của một texel = clamp(0,5 − d / cỡ texel). Không cần lấy mẫu dày (lấy mẫu
      4 × 4 là thiết kế ban đầu, chậm hơn nhiều).
    - Hàm tự tính chuỗi mipmap (trung bình 2 × 2), không nhờ GPU sinh, để hai backend ra cùng một ảnh.
    - Bọc thành `DataTexture` với `LinearMipmapLinearFilter`, lặp theo chiều ngang (`RepeatWrapping`).
  - **Trống** là một ống trụ hở:
    - cắt hình theo mặt nạ bằng `maskNode` (đúng khi độ phủ > 0,5). Three dùng `maskNode` cho cả lượt vẽ bóng khi không có
      `maskShadowNode` (Phụ lục A.80), nên thí nghiệm "Shadow map thật" thấy đúng hình cắt;
    - quay quanh trục theo góc `θ(t)` của `shared` (§18.5); chong chóng quay cùng góc.
- **Núm:**
  - `sides` (rebuild; 4, 6 hay 8 cạnh): đổi hình đèn và số tấm giấy;
  - `figures` (rebuild; 6–10, mức thấp 6–8): vẽ lại mặt nạ vào chính texture đã có (node giữ tham chiếu texture);
  - `wireframe` (rebuild).

  Như Bức 1, mọi thứ cấp phát theo trần MỘT lần; rebuild chỉ ghi lại dữ liệu.
- **Phá:**
  - *"Trống không cắt"* (`solidDrum`): mặt nạ thành 1 trên cả dải, nên bóng thành một vành tối liền. Người xem hiểu ngay bóng là do
    chỗ cắt.
  - *"Normal phẳng"* (`flatNormals`): biên dịch lại một lần.
- **Số đo:** `vertices`; `mask` ("Mặt nạ": cỡ texture, ví dụ "2048 × 512").
- **Công bố** `shared.cot = { hemi, hemiIntensity, lantern, room, paper, mask, materials, receivers, casters, version }`:
  - `lantern`: hình học của đèn, dưới dạng số (`LANTERN` của `parts/cot-den.js`) và node: tâm trục `axisNode`, bán kính trống, dải
    hình, bán kính giấy, độ cao của đế và của miệng, số cạnh `sides` (uniform `lanternSides`). Có thêm hai `Fn` TSL dùng chung:
    - `cylinderExit(P, C, axis, r)`: giao tia từ ngọn lửa C qua điểm P với một ống trụ đứng (của trống, hay của giấy coi như ống
      tròn). Trả góc quanh trục bằng `atan(z, x)`, độ cao của điểm cắt, và phần t của đoạn C → P; đúng cả khi C lệch trục;
    - `planeCross(P, C, axis, Y)`: tia cắt một mặt phẳng ngang phía trên C (miệng đèn, chong chóng);
  - `materials`: material của từng nhóm bề mặt (lớp Gian nhà và Giấy sơn lên chúng);
  - `mask`: texture mặt nạ và uniform `drumSolid` của thí nghiệm "Trống không cắt";
  - `version`: tăng mỗi lần Cốt ghi lại hình (như Bức 1); lớp Giấy dựa vào nó để rải lại màu các tấm khi đổi số cạnh.
- **Tên vật:** `san`, `vach`, `tran`, `xa`, `cot-go`, `day-treo`, `khung-tre`, `giay`, `de-chop`, `tua`, `trong`, `chong-chong`,
  `cay-nen`.

#### Lớp 2 · Ngọn nến (`layers/l2-ngon-nen.js`)
- **Thấy gì:**
  - ánh nến ấm loang khắp gian nhà, gần thì sáng, xa thì tối;
  - ánh sáng run nhẹ theo ngọn lửa; khi thổi thì cả căn phòng chao đi.

  Ngọn lửa (lõi vàng trắng, rìa cam, chân xanh lam) chỉ thấy được khi giấy trong suốt (thí nghiệm của lớp Giấy) hoặc qua công cụ
  học. Như với đèn thật, người xem chỉ thấy ánh sáng.
- **Kỹ thuật:**
  - **`PointLight` thật** đặt ở ngọn lửa, suy giảm theo bình phương khoảng cách (`decay` 2). Mỗi khung, vị trí đèn lấy theo vị trí
    lửa của `shared.flame` (gồm nhấp nháy và thổi).
  - **Ngọn lửa** là một mesh tròn xoay (`LatheGeometry`) hình giọt nước, cao 5,5 cm, chân đứng ngay trên đỉnh nến; đèn thật nằm
    quãng giữa thân lửa:
    - `MeshBasicNodeMaterial`, cộng dồn (`AdditiveBlending`, `depthWrite = false`);
    - màu đổi theo chiều cao, viết bằng TSL, và nằm hết ở `emissiveNode` (`colorNode` = 0), lớn hơn 1 để có bloom: bloom chỉ đọc ảnh
      emissive, nên thấy đủ cả ngọn lửa;
    - `positionNode` uốn lửa theo độ ngả và độ nhấp nháy. Lửa dùng chung uniform với đèn, nên lửa và bóng chao cùng nhịp.
  - Đèn xưởng (`shared.cot.hemi`) giảm theo trọng số, xuống còn một chút ánh đêm: chàm ở trên, cánh gián ở dưới. Nhờ vậy chỗ bóng
    không bao giờ đen kịt (luật 3).
    - Ánh đêm chỉ ngả 30% về hai sắc đó và giữ nguyên độ sáng của đèn xưởng; độ sáng do hệ số đêm (7%, chốt ở lượt màu) giữ.
    - Ngả hết về chàm thì bóng thành xanh tím và át mất ánh nến ấm (thấy lúc làm, GĐ 6).
- **Núm:**
  - `flameSize` (uniform; 0–0,04 m, mặc định 0,004): cũng là cỡ nguồn sáng, dùng cho nửa tối của lớp Kéo quân. Ở 1 cm, nửa tối trên
    vách xóa hết chân tay và cán cờ của hình nhân; ở 4 mm hình còn đọc được (thấy lúc làm, GĐ 6).
  - `flicker` (js; 0–2): độ nhấp nháy;
  - `warmth` (js; 0–1, mặc định 0,5): màu ánh nến, từ đỏ cam (`lua`) tới vàng ngà (`vangLaSang`);
  - `intensity` (js): cường độ của đèn thật.

  `flicker` và `warmth` là `js`, không phải `uniform`: nhấp nháy và màu đi qua đèn thật (thuộc tính JS của `PointLight`) và qua
  `createFlame` trên CPU. Shader của lửa và của giấy chỉ đọc kết quả qua uniform (`candleColor`, độ ngả, độ sáng của lửa).
- **Phá:**
  - *"Ánh sáng không suy giảm"* (`noDecay`): `decay` = 0. Vách xa sáng như vách gần, và căn phòng mất chiều sâu. `decay` là uniform
    của three nên không biên dịch lại (Phụ lục A.78).
  - *"Tắt nhấp nháy"* (`steady`).
- **Số đo:**
  - `lean` ("Lửa lệch", mm);
  - `backWall` ("Độ rọi ở vách sau", tính bằng % so với một điểm cách đèn 1 m): 1 / 1,9² ≈ 28%.
- **Công bố** `shared.ngonNen = { light, candle, rest, power, size, color }`: `candle` là uniform vec3 vị trí lửa, `size` là uniform cỡ
  lửa (núm `flameSize`), `power` là công suất lúc này (lớp Giấy nhân vào ánh sáng xuyên giấy), `color` là uniform `candleColor`.
- **Tên vật:** `ngon-lua`.

#### Lớp 3 · Gian nhà (`layers/l3-gian-nha.js`)
- **Thấy gì:**
  - gạch bát đỏ sẫm, mòn không đều, có mạch vữa;
  - vách vôi ngà loang ố;
  - ván trần và xà gỗ có vân;
  - hai cột sơn son bóng, soi vệt sáng của ngọn đèn;
  - khung tre của đèn có đốt.
- **Kỹ thuật:**
  - **Texture thủ tục bằng TSL**, không dùng ảnh nào:
    - lưới gạch bằng `fract` của tọa độ sàn; màu từng viên theo `hash` của chỉ số viên; mạch vữa bằng `smoothstep`;
    - vôi loang bằng `fbm` (`lib/tsl/noise.js`), số octave là node như sương của Bức 1;
    - vân gỗ bằng `sin` của tọa độ đã bị noise làm cong.
  - Cột sơn son dùng `MeshPhysicalNodeMaterial`, `clearcoatNode` = núm × trọng số.
  - Mọi màu đi qua `mix(datSet, màu, w3)`.
- **Núm:** `tileSize`, `stain`, `grain`, `clearcoat`, `octaves` (đều là uniform; `octaves` có trần theo mức như §10).
- **Phá:**
  - *"Một màu cho tất cả"* (`flat`): mọi bề mặt về một màu trung bình. Thấy texture thủ tục làm được bao nhiêu cho cảnh.
  - *"Xem lưới gạch"* (`rawTiles`): sàn hiện chỉ số viên và mạch vữa bằng màu giả.
- **Số đo:** `octaves`.
- **Nấc `chi-tiet`:** trần số octave về 1. Chỉ đưa ra khi `budget.octaves > 1`.
- **Tên vật:** lớp không thêm vật nào; chỉ đổi material của Cốt.

#### Lớp 4 · Giấy (`layers/l4-giay.js`)
- **Thấy gì:**
  - sáu tấm giấy dó nhuộm sáng lên từ bên trong, thấy cả sợi giấy;
  - mép tre in bóng mảnh lên giấy;
  - ra khỏi đèn, ánh sáng mang màu của tấm giấy nó vừa đi qua, nên trên vách có những mảng đỏ, vàng, xanh, chàm.
- **Kỹ thuật:**
  - **Ánh sáng xuyên mặt mỏng:** nhìn mặt ngoài nhưng tính ánh nến chiếu vào mặt trong.
    `emissiveNode` = màu nến × cường độ × độ thấu `exp(−σ × dày)` × `max(0, −N·L)` / r² × màu tấm giấy × sợi giấy × hệ số phơi sáng.
    Lớp Kéo quân nhân thêm bóng hình nhân vào node này.
    - Hệ số phơi sáng (0,04, chốt ở lượt màu) là lựa chọn của người vẽ. Theo vật lý, giấy cách lửa 15 cm sáng gấp vài trăm lần vách cách 1,9 m; màn hình
      không chứa nổi khoảng đó, nên AgX nén giấy về trắng và mất màu nhuộm. Hạ riêng độ sáng của giấy thì màu còn đọc được.
    - Ánh sáng ra phòng đã qua giấy nhuộm nên tối hơn ánh nến trần, vì vậy cường độ mặc định của đèn là 6,3 (lượt màu), không phải 4.
  - Màu từng tấm là một mảng uniform 8 ô, tính trên CPU theo số cạnh. Đổi số cạnh chỉ ghi lại mảng, không biên dịch lại.
  - Tia qua miệng trên (lên trần) không đi qua giấy nào, nên giữ màu nến.
  - **Lọc màu:** nhân `mix(1, màu tấm giấy, w4)` vào node bóng của đèn. Tia đi qua tấm nào thì `cylinderExit` với bán kính của
    giấy trả về (góc của chỗ ra → số thứ tự tấm).
  - Sợi giấy: noise kéo dài theo một chiều (`fbm` của tọa độ đã giãn).
  - Thí nghiệm "Giấy trong suốt" không được đổi cache key, nên giấy được dựng `transparent = true` ngay từ đầu, với `opacityNode`
    là uniform (bằng 1 khi thường).
    - Giấy chỉ vẽ mặt ngoài.
    - Ngọn lửa vẽ trước giấy (`renderOrder`): giấy đục thì che lửa, giấy trong thì thấy lửa.
- **Núm:** `thickness`, `dye` (độ đậm của màu nhuộm), `fiber` (đều là uniform).
- **Phá:**
  - *"Giấy trong suốt"* (`clear`): thấy trống và hình nhân quay bên trong. Bí mật của đèn lộ ra.
  - *"Tắt sợi giấy"* (`noFiber`).
- **Số đo:** `transmit` ("Ánh sáng qua giấy", %).
- **Nấc `soi`:** tắt noise sợi giấy (uniform).
- **Tên vật:** lớp không thêm vật nào.

#### Lớp 5 · Kéo quân (`layers/l5-keo-quan.js`)
- **Thấy gì:**
  - đoàn quân chạy trên giấy, và trên vách, trần, sàn;
  - bóng nét ở gần đèn, mềm dần trên vách xa;
  - khung tre in sáu vạch mảnh;
  - đế đèn để lại một vùng tối dưới sàn;
  - trên trần có vầng sáng với bóng chong chóng xoay.
- **Kỹ thuật** (`parts/keo-quan-gobo.js`). Node bóng `gobo(P)` tính cho mỗi điểm P đang tô:
  1. Tia từ ngọn lửa C (đang chao theo `shared.ngonNen.candle`) tới P cắt ống trụ của trống (`cylinderExit`). Điểm cắt cho:
     - góc φ quanh trục, tính bằng `atan(z, x)` (TSL không có `atan2`);
     - độ cao v trong dải hình.

     Nến nằm đúng trục thì góc của P cũng là góc của tia. Nến lệch trục thì phải giải một phương trình bậc hai: vẫn rẻ, và đúng.
  2. Tra mặt nạ:
     - tia cắt trống trong dải hình: tra ở `u = fract((φ + θ) / 2π)` và `v`. Trống quay θ (`rotation.y`) thì điểm ở góc cục bộ φ
       nằm ở góc thế giới φ − θ, nên tra ngược lại ở φ_thế giới + θ (test giữ quy ước này);
     - ngoài dải: tia chỉ đi qua giấy trơn;
     - tia đi xuống dưới đế: tối;
     - tia ra qua miệng trên: tra bóng chong chóng, cũng theo góc.
  3. **Nửa tối theo khoảng cách:**
     - Gọi s là cỡ lửa, D là khoảng cách từ trục tới P theo phương ngang, r là bán kính trống. Quy về mặt trống, nửa tối rộng
       `s × (D − r) / D`.
     - Đổi bề rộng đó ra số texel, rồi lấy `log2` làm mức mip khi tra mặt nạ.
     - Trên giấy (D gần r), bóng gần như nét. Trên vách (D ≫ r), bóng mờ đúng bằng cỡ lửa: nhòe là do nguồn sáng có kích thước.
  4. Khung tre: tia ra gần góc của lăng trụ giấy (góc theo `cornerAngles`) thì tối theo một vạch mảnh, cũng có nửa tối.
  - Kết quả nhân vào hai chỗ:
    - node bóng của đèn: `mix(1, gobo, w5)`;
    - ánh sáng xuyên giấy của lớp Giấy, ở phía mặt trong: cùng hàm, với D gần bằng bán kính giấy.
  - **Không thêm lượt vẽ nào:** mọi thứ tính ngay lúc tô từng điểm ảnh.
- **Núm:**
  - `speed` (js): tốc độ thường của trống, tính bằng vòng/phút, ghi vào `shared.spin`;
  - `penumbra` (uniform; 0–2): nhân bề rộng nửa tối;
  - `strength` (uniform): độ đậm của bóng.
- **Phá:**
  - *"Shadow map thật"* (`shadowMap`, kiểu `compare`):
    - Thêm một `PointLight` thứ hai có cube shadow map (cỡ `budget.shadowMap`). Trống, khung và đế đổ bóng thật; trống cắt hình bằng
      `maskNode` (Phụ lục A.80). Đèn gobo tắt, đèn mới bật. Giấy vẫn sáng như cũ: ánh sáng xuyên giấy là của lớp Giấy, không đi qua
      đèn nào; phép so nằm trên vách, trần và sàn.
    - Người xem thấy ngay bốn điều:
      - mỗi khung thêm 6 lượt vẽ bóng: trống quay, nên không thể vẽ bóng một lần rồi giữ;
      - ms ở hai cột Tắt / Bật;
      - bóng trên vách lộ răng cưa theo cỡ map;
      - nhòe đều khắp nơi, không theo khoảng cách.
    - Đèn thứ hai **chỉ được dựng khi bật lần đầu.** Thêm một đèn là đổi bộ đèn nằm trong cache key, nên lần bật đầu biên dịch lại
      một lần: cảnh khựng một nhịp, như "Normal phẳng" (thí nghiệm không trả Promise, nên Sổ tay không hiện "đang dựng…"). Từ đó,
      tắt chỉ là đặt `intensity` 0 và `shadow.autoUpdate = false`:
      không vẽ bóng nữa.
    - Mức thấp không có thí nghiệm này (`budget.shadowMap` = 0).
    - Bản shadow map không có màu giấy (§16).
  - *"Nguồn sáng là một điểm"* (`pointLight`): s = 0, bóng cứng ở mọi khoảng cách.
  - *"Công thức gọn"* (`naive`): lấy góc của chính P thay cho giao tia. Nến đúng trục thì không khác gì; thổi nến thì bóng thôi chao
    theo lửa. Thấy vì sao phải giao tia.
- **Số đo:**
  - `rpm` ("Vòng mỗi phút");
  - `magnify` ("Bóng phóng to ở vách sau": ×21);
  - `penumbra` ("Nửa tối ở vách sau", cm).

  `__sma.readouts('keo-quan')` đọc được các số này; e2e dùng `rpm`.
- **Không có nấc.** Node rẻ: với mỗi điểm nhận bóng, ba phương trình bậc hai (giao với trống, với giấy cho gobo và cho màu giấy), bốn
  lần `atan`, một lần tra texture có mip. Hạ nó là mất đúng thứ bức muốn khoe.
- **Tên vật:** lớp không thêm vật nào. Đèn thứ hai của "Shadow map thật" là đèn, không phải vật được vẽ.

#### Lớp 6 · Phủ bóng (dùng chung, §6)
- Bloom cho lửa, giấy và vầng sáng trên trần.
- AgX; LUT sinh từ bảng đã ghép (có cả `lua`, `giayDo`); grain, vignette, FXAA.
- Số mặc định có thể ghi đè trong `painting.js` (§15 a), sau lượt màu.

### 18.5 Chuyển động tất định (`shared.js` của bức)
`setup(ctx)` làm ba việc:
- dựng `shared.spin` (trống) và `shared.flame` (lửa);
- nhận cử chỉ qua `onGesture`;
- mỗi khung (`update(dt, t)`, kể cả `update(0, t)` của `?freeze`), ghi vào uniform: góc trống, vị trí và độ sáng của lửa.

`spin` và `flame` là hàm thuần (không import three). Mỗi bộ là một file `parts/` thuộc lớp dùng nó: `keo-quan-quay.js` của Kéo quân,
`ngon-nen-thoi.js` của Ngọn nến. Test bằng số, như `anh-trang-drift.js` của Bức 1.

**Trống** (`createSpin`):
- Tốc độ góc ω đi dần về một tốc độ đích ω*, với hằng số thời gian τ:
  - khi thả: ω* = tốc độ thường (núm `speed`, mặc định 6 vòng/phút), τ = τ_tự_do = 2,5 s;
  - khi giữ: ω* = 0, τ = τ_giữ = 0,25 s.
- Vuốt cộng thẳng một lượng Δω vào ω: Δω = 0,35 × vận tốc ngang của cú vuốt, trần ±4 rad/s, và |ω| không quá 6 rad/s. Vận tốc vuốt
  mà xưởng đưa tới tính bằng NDC mỗi giây (`input.js`), không phải pixel mỗi giây: một cú vuốt nhanh chừng 10 NDC/s.
- Người xem xin giảm chuyển động thì tốc độ thường và Δω nhân 0,5.
- Giữa hai sự kiện, θ và ω có dạng đóng (Δ = t − t₀; (t₀, θ₀, ω₀) là trạng thái ở sự kiện gần nhất):
  - ω(t) = ω* + (ω₀ − ω*) × e^(−Δ/τ);
  - θ(t) = θ₀ + ω* × Δ + (ω₀ − ω*) × τ × (1 − e^(−Δ/τ)).
- Mỗi sự kiện (giữ, thả, vuốt, đổi núm `speed`) chốt trạng thái ở thời điểm đó, rồi mới đổi ω*, τ hay ω.
- Không cộng dồn theo khung: `angle(t)` chỉ phụ thuộc trạng thái đã chốt và t.
- Thời điểm của sự kiện lấy theo đồng hồ của cảnh (`ctx.u.time`), nên `?freeze` và `update(0, t)` cho đúng khung N.

**Lửa** (`createFlame`):
- Nhấp nháy: tổng ba sóng sin (1,7; 2,9; 5,3 Hz) tính thẳng từ t. Lửa lệch tối đa 2,5 mm, độ sáng đổi ±6%. Núm `flicker` nhân biên
  độ; giảm chuyển động thì nhân 0,4.
- Thổi:
  - vòng đệm 4 lần thổi `{ t, hướng, biên độ }`;
  - độ ngả = Σ biên độ × hướng × g(t − t_thổi), với g(s) = (1 − e^(−s/0,06)) × e^(−s/0,7) × cos(9s): ngả lên êm trong chừng 0,1 s,
    dao động rồi tắt dần trong khoảng 2 giây; độ ngả lớn nhất 12 mm;
  - độ sáng giảm 35% theo e^(−s/0,6) của cùng lần thổi, không dưới 40%;
  - hướng thổi là hướng nhìn của camera chiếu xuống mặt sàn, lấy ở lúc chạm.
- `flame.at(t)` trả `{ offset, glow, lean }`. Vị trí lửa và vị trí đèn = vị trí gốc + `offset`.

### 18.6 Xưởng và hợp đồng: thêm một bức đúng luật 7
- **Hợp đồng không đổi.** Mọi thứ Bức 2 cần đã có:
  - `Painting.setup`;
  - các cử chỉ `'tap'`, `'hold-*'`, `'swipe'`;
  - `Layer.experiments` kiểu `compare`, và thí nghiệm trả Promise;
  - `readouts`, `degrade`, `quality`.

  Node bóng tự viết là chuyện giữa bức và three (`light.shadow.shadowNode`); xưởng không cần biết. Đây là phép thử thật của §0:
  bức thứ hai vào mà xưởng không đổi một dòng JS.
- **Xưởng chỉ đổi CSS:** thêm kiểu cho link lật tranh (`shell.css`; link bật lại `pointer-events`, vì `.frame` tắt nó cho canvas).
  Ngoài xưởng có đổi:
  - test HTML (lật tranh); a11y vẫn xanh với link là điểm dừng Tab đầu tiên;
  - helper của test: `tests/helpers/nodes.js#compileMaterial` nạp đèn và bật shadow map như bức, và trả tên uniform mà shader đọc;
    `e2e/helpers.js` có `tapAt`, `swipeAt` (phát sự kiện con trỏ ngay trong trang) và trung bình R, G, B của mỗi vùng;
  - CI chia e2e thành hai phần bằng cờ `--shard`, `--fully-parallel` (§13); cấu hình Playwright không đổi.
- **Lật tranh** (HTML của từng trang, §8.7):
  - Ngay dưới `<h1>` có `<nav class="series" aria-label="Các bức tranh">`, với tối đa hai link:
    - `<a rel="prev">← Bức {n−1} · {tên}</a>`;
    - `<a rel="next">Bức {n+1} · {tên} →</a>`.

    Bức 1 chỉ có link sau. Bức 2 chỉ có link trước, cho tới khi có Bức 3.
  - Đích là đường dẫn tương đối tới thư mục của trang kia: `tranh/den-keo-quan/` khi đi từ gốc, `../../` khi đi từ Bức 2. Vite
    không viết lại `<a href>`, và đường dẫn tương đối chạy được dưới mọi `base`.
  - Chỉ là HTML, nên chạy được cả ở tầng tĩnh, không cần JS. `?poster` ẩn link theo `.frame`.
  - Link nằm đầu trang, nên là điểm dừng Tab đầu tiên, trước huy hiệu.
  - Test HTML giữ:
    - registry xếp theo `meta.no` (1, 2, … liên tiếp);
    - link của mỗi trang khớp đúng bức kề trước, kề sau: số, tên, đích tương đối, `rel`.
- **Hàng rào từ vựng** của Bức 2 (`meta.fence`): `drum`, `gobo`, `candle`, `flame`, `turbine`, `silhouet`, `wick`, `kéo quân`,
  `hình nhân`, `ngọn nến`, `đèn cù`, `chong chóng`.
  - Không rào `figure`, `spin`, `blow`, `paper`: đó là từ chung, và `ui/notebook-pages.js` đã có `figure`.
  - Test tự kiểm phải bắt được ít nhất một từ của Bức 2 và không bắt nhầm.
- **Luật hai lần:**
  - Bức 2 không cần gì của Bức 1 ngoài những thứ đã ở hộp màu (`lib/tsl/noise.js`, `lib/random.js`) và lớp dùng chung Phủ bóng.
  - GĐ 6 không rút gì lên `lib/` hay `stock/`. Mặt nạ cắt hình và giao tia với ống trụ ở lại trong bức, tới khi một bức khác cần.
- **Trang** `tranh/den-keo-quan/index.html` làm theo §15 a bước 3:
  - `data-painting="den-keo-quan"`, `<title>Đèn Kéo Quân · Sơn Mài Ánh Sáng</title>`, dòng "Sơn Mài Ánh Sáng · Bức 2";
  - thơ, poster, thẻ og: `og:url` = `SITE + 'tranh/den-keo-quan/'`;
  - giữ `[data-moon]`.

### 18.7 Chất lượng và ngân sách
**Bảng của Bức 2** (`paintings/den-keo-quan/quality.js`):

| Mức | DPR tối đa | Mặt nạ (bề rộng) | Octave vôi, gỗ | Octave sợi giấy | Shadow map (thí nghiệm) | Bloom (`resolutionScale`) |
|---|---|---|---|---|---|---|
| **cao** | 2 | 2048 | 3 | 2 | 512 | 0.5 |
| **vừa** | 1.5 | 2048 | 2 | 1 | 256 | 0.25 |
| **thấp** | 1.25 | 1024 | 1 | 1 | 0 (không có thí nghiệm) | 0.25 |

- Khóa trong `quality.js`: `dpr`, `mask`, `octaves`, `fiber`, `shadowMap`, `bloom`.
- Thang: `['dpr', 'gian-nha.chi-tiet', 'giay.soi', 'phu-bong.bloom']`.
- **Draw call:**
  - 14 vật (Cốt 13, lửa 1), nên mức cao có `14 + 12 (bloom) + 1 (FXAA) + 1 (quad) = 28`. Không có phản chiếu, không có shadow map.
  - E2e giữ ≤ 45, như Bức 1.
  - Bật "Shadow map thật" thì mỗi khung thêm 6 lượt × số vật đổ bóng, chừng 30 lần vẽ nữa. Vượt 45 là chủ ý: thí nghiệm này để thấy
    cái giá.
- **Mặt nạ** được vẽ trong `createLayer` của Cốt, lúc poster còn hiện.
  - Mục tiêu: ≤ 50 ms ở mức cao trên máy của Bao (Mac M2), đo ở task mặt nạ.
  - Quá thì vẽ ở bề rộng nhỏ hơn rồi lọc. (Mỗi texel chỉ một mẫu, nhờ khoảng cách có dấu; không có lấy mẫu dày để giảm.)
- **Chi phí mỗi điểm ảnh:**
  - Node gobo chạy trên mọi bề mặt nhận bóng, tức gần cả màn hình: ba phương trình bậc hai, bốn lần `atan`, một lần tra texture có
    mip.
  - Đo ms GPU lúc làm: task đầu đo riêng node gobo, đo lại khi đủ sáu lớp. Mục tiêu như §2: 60 khung/giây trên laptop, 45 trên điện thoại tầm trung (mức vừa và thấp).
- **JS:** chunk của bức cộng chunk content; chunk `three` dùng chung với Bức 1 (§8.7). Số đo ghi vào README.
- **Trần núm theo mức:** `figures` tối đa 8 ở mức thấp (mỗi lần kéo là vẽ lại cả mặt nạ), 10 ở mức cao và vừa; `octaves` của Gian nhà
  tối đa 3 ở mức thấp.
- **Số đo** (2026-10-04, Mac M2 8 GB, Chromium headless qua Playwright, WebGPU, bản build, đo sau 10 giây live):

  | Mức | 1280×800, DPR 2 | 390×844, DPR 3 (giả lập điện thoại) |
  |---|---|---|
  | **cao** | 60 khung/giây · 28 draw call · CPU 0,9 ms | 60 · 28 · 0,6 ms |
  | **vừa** | 60 · 28 · 0,5 ms | 59 · 28 · 1,3 ms |
  | **thấp** | 60 · 28 · 0,6 ms | 60 · 28 · 0,8 ms |

  - Mọi ô đều chạm trần 60 khung/giây của xưởng; bộ điều chỉnh không hạ nấc nào.
  - ms GPU: Chrome trên GPU Apple báo các pass chồng lên nhau (Phụ lục A.48), xưởng bỏ số vô lý, nên gần như không có mẫu.
  - Tải nặng để đo chi phí mỗi điểm ảnh: 2560×1600, DPR 2, mức cao cho 43 khung/giây, bộ điều chỉnh tự hạ DPR về 1,75. Tức chừng
    2 ns mỗi điểm ảnh trên M2.
  - Khung điện thoại ở mức vừa chỉ có khoảng 0,74 triệu điểm ảnh, tức khoảng 1,4 ms trên M2. Một GPU điện thoại tầm trung chậm hơn
    8–15 lần vẫn trên mốc 45 khung/giây. Vì vậy chưa thêm nấc "tra mặt nạ không nội suy" (§18.10); đo lại trên điện thoại thật ở
    lượt kiểm tay (§12).
  - WebGL2 (SwiftShader): 28 draw call, như WebGPU.
  - Mặt nạ (Chromium, M2): bề rộng 2048 lần đầu 35–48 ms, các lần sau 13 ms; bề rộng 1024 lần đầu 16 ms. Đạt mục tiêu ≤ 50 ms, giữ
    một mẫu cho mỗi texel.

### 18.8 Kiểm thử
**Tự chạy cho Bức 2**, vì các test này lặp qua registry:
- hợp đồng, tên vật, HTML;
- e2e chung (`painting.spec.js`): tĩnh, WebGL2, WebGPU, mài về cốt, công cụ học, `?poster`, quầng trăng;
- a11y.

**Unit mới** (`tests/paintings/den-keo-quan/`):
- `cot-hinh-nhan`:
  - rasterize tất định;
  - độ phủ của hình mẫu: một hình tròn ra đúng diện tích, mép có giá trị trung gian;
  - chuỗi mip đúng cỡ, mỗi mức là trung bình của mức trước;
  - `figures` từ 6 tới 10 hình: tổng bề rộng không quá chu vi dải;
  - không hình nào tràn khỏi dải.
- `keo-quan-quay`:
  - giữ thì ω về gần 0 trong ≤ 1 s; thả thì ω về tốc độ thường;
  - vuốt cộng thêm tốc độ rồi tắt dần;
  - θ và ω liên tục tại mỗi sự kiện (không nhảy);
  - gọi `angle(t)` nhiều lần, theo bất kỳ thứ tự nào, đều ra cùng một số: không có trạng thái theo khung;
  - đổi `speed` giữa chừng không làm góc nhảy.
- `ngon-nen-thoi`:
  - thổi rồi tắt dần trong khoảng 2 s;
  - 4 lần thổi chồng lên nhau;
  - hướng thổi đúng;
  - nhấp nháy tất định.
- **Từng lớp**, dựng cả bức bằng `buildPainting` (như Bức 1):
  - node bóng của đèn là node tự viết, không phải `PointShadowNode`;
  - `shadowMap.enabled` bật; `receiveShadow` đúng ở từng vật;
  - mọi trọng số bằng 0 thì về đất sét;
  - thí nghiệm "Shadow map thật" dựng đèn thứ hai ở lần bật đầu, và không có ở mức thấp;
  - nấc chỉ có khi có tác dụng.
- **Cử chỉ** (gọi `setup().onGesture` với cử chỉ giả): chạm là thổi, giữ là giữ trống, vuốt là gạt, `'double-tap'` không làm gì.
- **Chữ của Sổ tay** (`chu.test.js`): mọi lớp riêng có sơ đồ, đoạn Hiểu nhắc đúng khái niệm của lớp; **chất lượng**
  (`quality.test.js`): bảng ba mức, thang nấc, trần `figures` ở mức thấp.
- **Node gobo:** biên dịch được ra WGSL và GLSL (`tests/helpers/nodes.js`). Hành vi của nó kiểm bằng e2e: TSL chưa có bộ tính trên CPU
  (§16).

**HTML:** link lật tranh, như §18.6.

**E2e riêng** (`e2e/den-keo-quan.spec.js`; WebGL2 trên SwiftShader là cổng chặn, WebGPU không chặn):
- hai khung `?freeze` khác nhau thì vùng vách sau khác nhau (đoàn quân đã chạy); cùng một khung thì giống nhau;
- mài Kéo quân về 0 thì vách sau sáng lên rõ (hết bóng); trần có vầng sáng mang bóng chong chóng xoay; sàn dưới đèn tối vì đế che;
- giấy sáng lên từ bên trong (điểm ấm ở giữa tấm trước mặt); vách sau tấm đỏ son ngả đỏ hơn hẳn vách sau tấm vàng lá, mài Giấy về 0
  thì hết khác biệt đó; "Giấy trong suốt" lộ trống bên trong, tắt Ngọn nến thì giấy trong suốt cũng không sáng;
- "Ánh sáng không suy giảm" làm góc xa sáng lên rõ; "Tắt nhấp nháy" làm hai khung khác nhau giống hệt (khi trống, hạt và bóng đứng yên);
- gạch bát: sàn đậm sắc hơn hẳn khi Gian nhà = 1 so với đất sét;
- chạm thì số đo "Lửa lệch" > 0, rồi về gần 0 sau khoảng 3 s; giữ thì `rpm` về gần 0; vuốt thì `rpm` vượt tốc độ thường;
- draw call ≤ 30 ở mức cao (đo được 28: không có lượt vẽ bóng nào; trần chung của bức là 45); `?level=thap` chạy được;
- `?level=thap` không có thí nghiệm "Shadow map thật";
- bật "Shadow map thật": cảnh vẫn chạy, không có lỗi console, draw call tăng ít nhất 6 (đo được 28 → 58), vách vẫn có bóng hình nhân;
  tắt thì draw call về như cũ;
- lật tranh: từ Bức 1 bấm "Bức 2 · Đèn Kéo Quân →" thì tới đúng trang, cả khi `?static`; và đi ngược lại.

**CI.** Hai bức nhân đôi phần e2e chung. Job `build` hiện mất khoảng 22 phút trên trần 40 phút (§13), nên GĐ 6 đổi cách chạy:
- `build` chỉ còn unit, build và đóng gói Pages; mỗi job e2e tự build (§13);
- e2e chặn tách thành 2 phần chạy song song (`--shard=1/2`, `--shard=2/2`). Bật `--fully-parallel` để chia theo từng test, không
  theo file;
- `deploy` chờ cả hai phần;
- e2e WebGPU (không chặn) cũng tách 2 phần.

**Kiểm tay** (thêm vào §12):
- xem bóng trên vách trên điện thoại thật;
- thổi nến trên màn cảm ứng;
- VoiceOver đọc link lật tranh;
- Bao duyệt thơ và ảnh poster.

### 18.9 Cách làm GĐ 6
GĐ 4 và GĐ 5 dựng thử trên một nhánh vứt đi rồi mới viết plan, để code trong plan là code đã chạy. Cái giá là viết code gần như hai
lần: GĐ 5 có 18 commit dựng thử, plan 11.990 dòng chép lại chúng, và lúc thực thi chép lại lần nữa. Sau khi duyệt spec, Bao chọn
cho GĐ 6 **làm thẳng, vừa làm vừa sửa**:
1. **Plan gọn.** Mỗi task ghi mục tiêu, file, test viết trước, cách kiểm bằng chạy thật. Code đầy đủ chỉ có ở chỗ khó: gobo, giao
   tia, công thức quay, mặt nạ. Bao xem plan và chọn cách thực thi.
2. **Task rủi ro nhất làm trước.** Khung tối thiểu của Bức 2 (gian nhà, trống, đèn có node bóng tự viết, mặt nạ tạm) chạy thật trên
   WebGPU (GPU thật) và WebGL2 (SwiftShader), đếm draw call. Node bóng tự viết không chạy ở một backend nào đó thì dừng, báo Bao, và
   chuyển sang đường lùi (§18.10).
3. Mặt nạ có mip tự tính (so ảnh của hai backend), rồi tám hình nhân, bố cục, camera.
4. **Điểm duyệt ảnh giữa chừng** (một trang ảnh riêng tư, như GĐ 5): hình nhân, bóng trên vách, bố cục. Bao duyệt trước khi làm các
   lớp còn lại. Hình là dữ liệu, nên sửa rẻ.
5. Các lớp còn lại, cử chỉ, lật tranh, CI, chữ của Sổ tay, lượt màu, poster. Task nào cũng có test viết trước, chạy thật, và review.
   Chỗ nào làm khác spec thì sửa spec trong cùng task.
6. Review cuối cả nhánh, đối chiếu thơ, rồi hỏi Bao trước khi push (push là deploy).

### 18.10 Rủi ro riêng
- **Hình nhân trông thô.** Ghép từ hình cơ bản dễ ra dáng búp bê.
  - Cách tránh: chọn dáng cắt giấy có chủ ý (khối phẳng, mép gọn); Bao duyệt ảnh của đủ 8 hình ở điểm duyệt giữa chừng (§18.9).
  - Hình là dữ liệu, nên sửa hình không đụng tới code.
- **Node bóng tự viết là một đường ít người dùng của three.**
  - Mới đọc mã (Phụ lục A.77), chưa chạy thật. Task đầu chạy thật trên cả hai backend; hỏng thì dừng ở đó (§18.9).
  - Đường lùi: gobo vẫn là một hàm TSL, nhân thẳng được vào ánh sáng của từng material. Cách đó mất phần tách bạch giữa đèn và bóng,
    nhưng chắc chắn chạy.
- **Mip của DataTexture có thể khác nhau giữa hai backend.** Chuỗi mip tự tính bằng JS, không nhờ GPU sinh; task mặt nạ so ảnh của hai
  backend.
- **Chi phí trên điện thoại.** Node gobo chạy trên gần cả màn hình. Đo lúc làm; nếu thiếu thì thêm một nấc (tra mặt nạ không
  nội suy giữa các mức mip).
- **CI dài gấp đôi.** Chia phần như §18.8; thời gian đo ở task CI.
- **Sàn tối dưới đèn.** Đáy đèn kín, nên sàn quanh chân đèn chỉ có ánh đêm. Ảnh nặng nề quá thì nâng ngọn nến hoặc thu nhỏ đế (số
  của Cốt), không đổi cách làm.

## 19. Bức 3 · Cung Quế (GĐ 7)

> Mặt trăng là một hành tinh nhỏ giữa trời đen. Chú Cuội ngồi gốc cây đa, con trâu gặm cỏ, Trái Đất treo trên đầu, và nắng chiếu
> theo đúng pha trăng của đêm nay.

**Nơi ở:** `src/paintings/cung-que/`, trang `tranh/cung-que/index.html`, poster ở `public/paintings/cung-que/`. Lớp 6 là Phủ bóng dùng
chung. Mọi luật của kỹ thuật (§0) và của xưởng (§8–§10, `CLAUDE.md`) áp như hai bức trước. Chương này chỉ ghi phần riêng của Bức 3,
cùng hai việc đi kèm: Phòng tranh với trình sinh trang (§19.7), và CI chia e2e theo bức (§19.9). Những gì Bao đã chọn nằm ở §1 (GĐ 7);
phần còn lại do Claude quyết, Bao duyệt khi đọc spec.

**Số trong chương này** là số thiết kế, theo đơn vị của cảnh: một đơn vị coi như 10 m khi tính trọng lực (§19.5). Số cuối cùng chốt
lúc làm (§19.10); số nào đổi thì sửa lại ở đây, trong cùng task.

**Điều mới so với hai bức trước:** thế giới của bức (hành tinh, cây, người, trâu) không có một tam giác nào. Nó là một hàm khoảng
cách có dấu (SDF), và một shader dò tia (raymarching) vẽ nó bên trong một khối cầu bao. Ánh sáng, bóng và AO cũng tự tính trong
shader đó: cảnh không có đèn nào của three.

### 19.1 Cảnh
- **Hành tinh** là mặt trăng thu nhỏ: quả cầu bán kính 1, tâm ở gốc tọa độ, trục +Y hướng về Trái Đất.
  - Sáu hố va chạm, bán kính 0,12–0,3, sâu 0,03–0,06, có gờ miệng thấp. Mỗi hố là một phép lõm mềm trên quả cầu, tính theo góc giữa
    điểm và tâm hố: rẻ, không cần noise trong lúc dò tia.
  - Mặt đất gồ ghề chỉ có ở pháp tuyến lúc tô (bump từ noise, tính một lần ở điểm chạm), không có trong hình dò tia. Dò tia qua noise
    nhiều tầng là cái giá lớn nhất của SDF.
- **Cây đa** đứng ở đỉnh (+Y), chỗ luôn hướng về Trái Đất:
  - thân là một nón tròn, cao 0,42, bán kính 0,11 ở gốc, 0,06 ở ngọn;
  - năm chân rễ bạnh ra sát đất, hòa vào thân; góc của chúng chừa một khe ở phía camera cho Cuội ngồi;
  - chân cây hòa vào đất (hòa khối, §19.4 lớp 1);
  - bốn cành chính tỏa ra ở độ cao chừng 0,37;
  - tán là bảy khối bầu dục hòa vào nhau thành một vòm thấp, xòe rộng chừng 1,1, từ độ cao 0,39 tới 0,78 trên mặt đất, như cây đa đầu
    làng;
  - rễ phụ: mười sợi mảnh buông từ cành xuống, không chạm đất. Rễ phụ lặp quanh trục bằng phép chia góc (domain repetition): một hình
    cho nhiều bản, mà giá chỉ như một.
  - (GĐ 7, Task 2) Thiết kế đầu có tán rộng 0,9, cao tới 0,8. Ảnh đầu tiên cho thấy cây nhỏ quá so với hành tinh, nên tán to và thấp
    hơn, thân to hơn.
- **Chú Cuội** ngồi tựa gốc đa, quay về phía camera mặc định: hông, mình, đầu, hai tay ôm gối, chân co; cao chừng 0,24 khi ngồi.
- **Con trâu** gặm cỏ, cách gốc đa chừng 0,42 trên mặt đất (lệch về phía +X), đứng nghiêng với camera: mình bầu dục, đầu cúi, hai
  sừng cong, bốn chân, đuôi; dài chừng 0,28 (thân), 0,33 từ đuôi tới mõm.
  - (GĐ 7, điểm duyệt ảnh Task 4) Thiết kế đầu: Cuội cao 0,17, trâu dài 0,2. Ở khung máy tính, Cuội chỉ chừng 2% bề cao khung. Bao để
    Claude chỉnh theo đề xuất: cả hai phóng 1,4 lần, giữ nguyên dáng. Số trong `parts/cot-the-gioi.js` vẫn là cỡ thiết kế đầu;
    `scaleFigure` phóng quanh chỗ vật chạm đất (Cuội: chỗ ngồi sát thân cây; trâu: giữa bốn chân), kể cả hình bao và độ hòa khớp.
- Mỗi vật (cây, Cuội, trâu) có một hình cầu bao rẻ trong shader. Hình của Cuội và trâu là dữ liệu (`parts/cot-the-gioi.js`): test
  kiểm mọi phần nằm gọn trong hình cầu bao của vật.
- **Trái Đất** treo thẳng trên đỉnh cây, ở (0; 2,7; 0), bán kính 0,28. Đây là một mesh cầu bình thường, có biển, lục địa, mây và
  viền khí quyển, tự quay chậm. Tỉ lệ là của truyện cổ tích, không phải của thiên văn.
  - (GĐ 7, Task 6) Thiết kế đầu đặt ở cao 3,1. Camera đã dời gần ở Task 2, nên ở khung 16:10 mép trên Trái Đất ra ngoài khung (25,1°
    so với nửa fov 24°). Ở cao 2,7, mép trên cách mép khung chừng 7%, và Trái Đất cách tán đang bay cao nhất chừng 0,19. Test tính góc
    giữ điều này ở 16:10 và 390×844, và ở mọi góc xoay dọc nó vẫn trong khung.
- **Bầu trời** đen sơn mài, có sao vàng li ti: một mesh cầu lớn vẽ mặt trong, sao sinh bằng hàm băm theo hướng nhìn.
- **Mặt Trời** không có trong khung; chỉ có hướng nắng (§19.2, pha trăng).
- **Khối bao** là một mesh cầu tâm (0; 0,82; 0), bán kính 1,86. Nó chứa trọn hành tinh, Cuội, trâu, và cả cây đa khi bay lên cao nhất
  (§19.5). Lá rơi, Trái Đất và bầu trời là mesh riêng.
  - (GĐ 7, Task 6) Trái Đất ở cao 2,7 chạm chỏm trên của khối bao (đỉnh khối ở 2,68). Không sao: tia trong khối bao không thấy Trái
    Đất, còn Trái Đất là mesh đục, so độ sâu với điểm chạm của SDF như mọi vật (`depthNode`).
  - (GĐ 7, Task 1) Thiết kế đầu là tâm (0; 0,6; 0), bán kính 1,75. Test thấy hình cầu bao của tán lúc bay cao nhất lọt ra ngoài.
  - Số mới gần như là quả cầu nhỏ nhất chứa hai cầu: hành tinh (bán kính 1,02, kể cả gờ hố) và tán đang bay cao nhất (tâm cao 2,035,
    bán kính 0,6), cộng lề cho chỗ phình của hòa khối.
- **Trang có trăng SVG cạnh con dấu**, như hai bức trước.

### 19.2 Trải nghiệm riêng của Bức 3
- **Camera** (`CameraSpec`):
  - đứng ngang hành tinh, nhìn hơi ngước lên, nên khung mặc định có hành tinh ở dưới (đáy bị cắt nhẹ), cây ở giữa, Trái Đất ở trên;
  - số thiết kế: `position` [0; 0,95; 4,6], `target` [0; 1,2; 0], `fov` 48; xoay dọc 1,2–1,95; khoảng cách 3,6–6,5; `breathe` 0,05.
    (GĐ 7, Task 2) Thiết kế đầu đứng xa hơn ([0; 0,7; 5], `fov` 50), nên cây, Cuội và trâu quá nhỏ trong khung;
  - **xoay ngang trọn vòng**: `azimuth` [−Infinity, Infinity]. OrbitControls coi đó là không giới hạn (Phụ lục A.86). Tiểu hành
    tinh thì phải đi vòng quanh được.

  Chốt ở điểm duyệt ảnh (§19.10), kể cả khung dọc của điện thoại: ở 390×844, hành tinh vừa khít bề ngang.
  - (GĐ 7, điểm duyệt ảnh Task 4) Bố cục máy tính giữ nguyên. Ở 390×844, fov dọc 48° chỉ cho góc ngang chừng 23°, nên hành tinh bị cắt
    hai bên (chiếm 110% bề ngang). Cách sửa là một trường tùy chọn mới của `CameraSpec`: `minHorizontalFov` (độ).
    - Khung hẹp thì xưởng nới fov dọc vừa đủ để góc ngang bằng số này, có trần 100° (`engine/gpu/fov.js#fitFov`, tính lại mỗi lần
      resize). Khung đủ rộng thì giữ nguyên fov của bức.
    - Camera không dời, nên khoảng cách vẫn do người xem chọn.
    - Bức 3 khai báo 30°: ở 390×844, fov dọc thành chừng 60° và hành tinh chiếm chừng 84% bề ngang. Ở máy tính 16:10 (góc ngang chừng
      71°) và iPad dọc (chừng 37°), không có gì đổi.
    - Bức 1 và Bức 2 không khai báo trường này, nên không đổi gì.
- **Gợi ý** (`content.hint`): *"Chạm vào tán đa · giữ để cây bay lên · kéo để xoay"*.
- **Hai cử chỉ** (`setup().onGesture`). Công cụ học vẫn được ưu tiên như ở mọi bức.
  1. **Chạm là lá rơi** (`'tap'`):
     - Lá rơi từ điểm trên tán gần tia chạm nhất: tia giao với hình bầu dục bao tán, tính bằng JS (§19.4 lớp 5). Chạm trượt ra
       ngoài tán thì lá vẫn rơi, từ điểm trên tán gần tia nhất, nên chạm ở đâu cũng có phản hồi.
     - Mỗi lần chạm có 4 lá (núm `burst`).
     - Lá rơi chậm: trọng lực trên trăng chừng bằng 1/6 Trái Đất, nên lá từ tán xuống đất mất chừng 2,7 giây, trên Trái Đất thì
       chừng 1,1 giây.
     - Lá không chao lượn, vì trên trăng không có không khí: lá vừa quay đều vừa rơi thẳng, như chiếc lông chim rơi cùng cây búa
       trong thí nghiệm của Apollo 15.
     - Lá nằm lại trên mặt đất vài giây rồi nhỏ dần và biến mất. Cùng lúc có tối đa `budget.leaves` lá; lá cũ nhất nhường chỗ.
     - (GĐ 7, Task 7) **Lá tự rụng:** không ai chạm thì cứ 2,5 giây một lá rụng từ mép dưới của tán, ở chỗ tất định theo số thứ tự
       của lá. Cảnh mở ra giữa chừng (lá đầu rụng từ 5 giây trước), nên khung đầu đã có lá đang rơi và lá nằm trên đất.
       - Lý do: chưa chạm thì lớp Lá đa không có vật nào, nên mài lớp này không đổi gì. Người xem mài thấy một lớp "không làm gì",
         và test chung "mài từng lớp" bắt được điều đó.
       - Giảm chuyển động thì không có lá tự rụng. (Sau GĐ 7) Thay vào đó ba lá dừng giữa lúc rơi, ở 0,3, 0,55 và 0,8 thời gian rơi
         của chúng (chừng 9%, 30% và 64% quãng từ tán xuống đất), như lá trong một bức tranh: mài Lá đa vẫn thấy khác mà không có gì
         chuyển động. Chúng rụng từ mép tán phía camera mặc định, nên nằm trước thân cây. Lá nằm trên đất thì gần như khuất: camera
         thấp hơn đỉnh hành tinh, nhìn mặt đất quanh gốc cây gần như song song. Lá do người xem chạm vẫn rơi. Ô nhường chỗ theo thứ
         tự: ô trống hay lá đã tan, rồi lá cũ nhất đang hiện; lá dừng sau cùng (chỉ nhường khi mọi ô đều là lá dừng), nên chạm bao
         nhiêu lần ba lá dừng vẫn còn.
     - (GĐ 7, Task 7) **Lá vàng tỏa nhẹ:** lá đa thần trong truyện Cuội có lá thuốc. Lá rụng màu vàng lá pha chút xanh, có emissive
       nhỏ (0,35 × vàng lá), nên Phủ bóng làm nó lấp lánh.
       - Lý do: ảnh thật cho thấy lá xanh thẫm vừa rơi nằm trong bóng của chính tán, lại trên nền trời đen, nên vô hình tới khi chạm
         đất chỗ có nắng. Về đêm thì chạm mà không thấy gì.
       - Lá dài chừng 0,07, to hơn thiết kế đầu (0,055) 1,3 lần.
  2. **Giữ là cây bay** (`'hold-start'` → `'hold-end'`), theo truyền thuyết cây đa bay lên trời mang theo chú Cuội:
     - Cây nhổ lên, cao dần tới 0,45 trong chừng 1,5 giây; chú Cuội níu theo một rễ và lên cùng cây.
     - Chân rễ hòa khối với mặt đất, nên đất bị kéo dài lên như đất sét, rồi đứt khi cây lên cao quá độ hòa (`smooth`). Đây là cảnh
       "đúng chất SDF" của bức.
     - Thả tay thì cây rơi xuống chậm theo trọng lực trăng, nảy nhẹ một lần rồi đứng yên; rễ liền lại với đất.
     - Camera không xoay trong lúc giữ: xưởng tắt OrbitControls khi giữ (§8.1).
  - `'swipe'` và `'double-tap'` không làm gì riêng: hai `'tap'` của một lần chạm đúp đã là hai chùm lá. Kéo là của camera.
  - **Tất định:** độ cao của cây và đường rơi của lá tính thẳng từ thời gian (§19.5), nên `?freeze` và `update(0, t)` cho đúng khung N.
  - **Giảm chuyển động:** camera không thở; cây bay lên và hạ xuống chậm còn một nửa; lá vẫn rơi, vì đó là phản hồi của cú chạm.
- **Pha trăng thật**, với **Dial "Ngày âm lịch"** (`setup().dials`, id `ngay`):
  - Hướng nắng S (từ hành tinh tới Mặt Trời) tính từ góc tuổi trăng φ của `lib/astro/moon.js` (0 là trăng mới, π là trăng tròn):
    `S = −E·cos φ + A·sin φ`, với E = +Y (hướng về Trái Đất) và A = +X (bên phải của khung mặc định):
    - trăng tròn (φ = π): S = E. Nắng rọi thẳng xuống đỉnh cây; nửa trên của hành tinh, nửa mà Trái Đất nhìn thấy, sáng trọn;
    - trăng mới (φ = 0): S = −E. Nắng rọi từ dưới; chú Cuội ngồi trong đêm, chỉ có ánh đất;
    - thượng huyền (φ = π/2): nắng từ bên phải; đường ranh sáng tối dựng đứng giữa hành tinh.

    Phần được nắng chiếu của nửa trên là (1 − cos φ)/2, đúng bằng `illumination` của `moonPhase`. Người xem thấy tận mắt vì sao trăng
    có pha.
  - Dial `ngay` đi từ 1 tới 30, bước 0,25, và φ = 2π(ngày − 1)/29,53.
  - Mặc định là tuổi trăng của `ctx.now` (`?at` hay giờ thật): `1 + moonPhase(now).fraction × 29,53`. Nhờ vậy lúc mở trang, hành
    tinh sáng đúng như trăng ngoài trời đêm nay.
  - Số mặc định được làm tròn về lưới bước 0,25, lệch tối đa 0,125 ngày (chừng 1,5° góc pha). Ô trượt HTML làm tròn về lưới khi bấm
    phím, nên mặc định lệch lưới thì một lần bấm mũi tên không cộng đúng một bước. Test a11y chung đã bắt lỗi này ở GĐ 7, Task 4.
  - Nhãn (`format`, cũng là `aria-valuetext`) chỉ là số ngày: "1" … "30". Thanh trượt đã mang nhãn "Ngày âm lịch".
  - Tên pha là ghi chú của Dial: `note()` trả khóa `trangMoi`, `thuongHuyen`, `ram`, `haHuyen` khi ngày ở gần bốn pha chính (±0,9 ngày),
    `null` ở giữa; chữ ở `content.dials.ngay.notes` ("Rằm: trăng tròn"…).
  - (GĐ 7, Task 4) Thiết kế đầu in "mùng 1", "rằm" trong `format`. Đó là chữ người xem thấy, nên phải nằm trong `content`, không nằm
    trong code.
  - Hệ trục khác `sunDirection` của hộp màu: hàm đó trả hướng trong view space, để vẽ một quả cầu trăng nhìn từ Trái Đất (Bức 1).
    Bức 3 cần hướng trong world space quanh một hành tinh. Công thức chỉ một dòng nên viết trong bức (`parts/mat-troi-pha.js`), không
    đổi hộp màu.
- **Thơ của cả bức** (`meta.poem`, in sẵn trong HTML): *"Thằng Cuội ngồi gốc cây đa / Để trâu ăn lúa gọi cha ời ời"* (ca dao).
  - Câu thơ hợp đúng cảnh: chú Cuội, gốc đa, con trâu.
  - Dị bản đã biết: "Để trâu ăn lúa" và "Bỏ trâu ăn lúa". Nguồn được đối chiếu ở cuối GĐ (§19.10); Bao chốt trước khi merge, như GĐ 6.
  - (GĐ 7, đối chiếu ngày 2026-10-05) "Thằng Cuội ngồi gốc cây đa / Để trâu ăn lúa gọi cha ời ời" là bản được in nhiều hơn:
    - Wikipedia tiếng Việt, bài "Cuội (cung trăng)", cạnh truyện "Cây thuốc cải tử hoàn sinh hay sự tích thằng Cuội cung trăng" của
      Nguyễn Đổng Chi (có dấu phẩy sau "lúa");
    - báo Công an Nhân dân, bài "Có hai chú Cuội!" của Nguyễn Thanh Tú (18/09/2021);
    - sách "Đồng dao Việt Nam" (bản trên Thư viện Đáng Nhớ).
  - Dị bản "Chú Cuội ngồi gốc cây đa / Bỏ trâu ăn lúa gọi cha ời ời" có ở bài "Con trâu trong nền văn hoá Việt Nam" của VUSTA
    (18/06/2009). Vài trang cho trẻ em in "Chú Cuội" cùng "Để trâu".
  - Chưa đối chiếu với bản số hóa của các bộ sách ca dao (Kho tàng ca dao người Việt; Tục ngữ ca dao dân ca Việt Nam của Vũ Ngọc Phan).
  - Bức giữ "Thằng Cuội… / Để trâu ăn lúa…", không dấu phẩy sau "lúa" (như báo Công an Nhân dân và sách đồng dao). Bao chốt.
- **Lật tranh và Phòng tranh** (§19.7):
  - header của Bức 3 có "← Bức 2 · Đèn Kéo Quân" và "Phòng tranh";
  - Bức 2 có thêm "Bức 3 · Cung Quế →";
  - mọi trang đều có link "Phòng tranh".

### 19.3 Chỉ đạo nghệ thuật
- **Không khí:** một truyện cổ tích lặng lẽ giữa vũ trụ. Hành tinh bạc xám dưới nắng, cây đa sẫm, ánh đất xanh lam nhạt trên phần
  đêm, sao vàng li ti. Không neon, không màu bão hòa gắt.
- **Không gắn với lễ hội** (giữ giả định ở §1): có truyền thuyết chú Cuội, nhưng không đèn lồng, không bánh, không rước.
- **Bảng màu:** bảng sơn mài (§5) đã có gần đủ.
  - Bụi trăng: `bacLa` (bạc lá). Thân và rễ đa, áo chú Cuội: `canhGian`. Tán đa và lá rơi: `xanhLuc`. Trâu: `denThen` sáng lên một
    chút.
  - Trái Đất: biển `cham`, đất `xanhLuc`, mây `nga`. Sao: `vangLaSang`. Nắng: `nga`.
    - (GĐ 7, lượt màu Task 13) Mây đổi sang `bacLa`, mỏng và trải rộng hơn: mây `nga` đi qua LUT thành những đốm cam nhỏ, mép gắt.
    - Nắng là `nga` pha 35% `anhDat`: nắng ngoài không gian thì trắng. Với nắng `nga`, 95–99% vùng được nắng của hành tinh "ấm" (kênh
      đỏ hơn kênh lam quá 20), nên bụi trăng đọc là kem, không phải bạc. Hạ LUT của Phủ bóng gần như không đổi gì.
    - Lá rơi: vàng lá pha chút xanh lục, có tỏa nhẹ (§19.2, Task 7).
  - Bức thêm một token qua `meta.palette`: `anhDat` (xanh ánh đất, khoảng `#7E9CC8`), cho ánh đất và viền khí quyển. Số hex chốt ở lượt
    màu.
- **Dáng:** khối tròn, mềm, như tượng đất nặn rồi sơn mài, vì đó là thứ SDF làm đẹp nhất (hòa khối). Không cố tả từng chiếc lá trên
  tán: tán là một khối, lá chỉ có ở màu (noise) và ở lá rơi.
- **Poster:**
  - chụp từ cảnh bằng `scripts/poster.js cung-que`;
  - `poster.capture` thiết kế là `{ at: '2026-10-21T21:00', freeze: 120 }`: chừng ngày 11 âm lịch, trăng gần tròn, đường ranh sáng
    tối cắt chéo hành tinh nên thấy được bóng mềm của cây. Chốt ở lượt màu, Bao duyệt;
    - (GĐ 7, lượt màu Task 13) Chốt `{ at: '2026-10-19T21:00', freeze: 120 }`: ngày 9,5. Đã thử bốn khung: ngày 9,5, 11,4, 13,3 và rằm.
      Từ ngày 11 trở đi, nắng lên cao nên Cuội nằm trong bóng tán. Ở ngày 9,5, nắng xiên từ bên phải, nên Cuội, cây và trâu cùng được
      nắng; đường ranh sáng tối rõ, phía đêm có ánh đất. Poster 70 KB (WebP), og 30 KB;
  - `poster.alt`: "Tranh sơn mài cung trăng: chú Cuội ngồi gốc cây đa trên một hành tinh nhỏ, con trâu gặm cỏ, Trái Đất treo trên
    trời.".
- **Lượt màu:** đo như §5 và §18.3 (độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối; 1280×800 và 390×844; GPU thật). Riêng Bức 3 đo ở
  ba pha: mùng 3 (lưỡi liềm, có ánh đất), mùng 8 (thượng huyền), rằm. Bao duyệt ảnh.
  - (GĐ 7, Task 13) Bầu trời đen chiếm phần lớn khung, nên số đo cả khung ít nói lên điều gì. Đo thêm vùng được nắng (điểm có độ sáng
    trên 120): độ sáng trung bình, tỉ lệ cháy trắng (cả ba kênh trên 240), tỉ lệ "ấm".

    | Pha | Trước (1280×800) | Sau (1280×800) | Sau (390×844) |
    |---|---|---|---|
    | mùng 3 | 9,5 · 0,12 · 89,6% · nắng 155,8, ấm 98% | 8,6 · 0,12 · 90,9% · nắng 149,3, ấm 12% | 19,3 · 0,19 · 78,9% · ấm 3% |
    | mùng 8 | 11,5 · 0,11 · 90,8% · nắng 164,0, ấm 95% | 10,7 · 0,11 · 91,8% · nắng 158,0, ấm 21% | 21,8 · 0,17 · 82,0% · ấm 14% |
    | rằm | 13,1 · 0,09 · 91,2% · nắng 163,3, ấm 99% | 12,3 · 0,08 · 91,2% · nắng 155,8, ấm 13% | 23,9 · 0,12 · 82,3% · ấm 13% |

    (sáng trung bình 0–255 · bão hòa · tỉ lệ điểm tối · vùng nắng; không pha nào có điểm cháy trắng.)
  - Đổi: nắng `nga` pha 35% `anhDat`; `anh-dat.earthshine` 0,25 → 0,18 (mùng 3: phần đêm đọc được nhưng tối, lưỡi liềm nổi lên); mây
    Trái Đất. Giữ: `mat-troi.intensity` 1,6, `surge` 0,5, `bong-mem.ao` 0,8, hex `anhDat`.
  - Rằm: thân cây và Cuội nằm trong bóng tán, in đen trên trăng sáng. Giữ, vì đó đúng là bóng "chú Cuội ngồi gốc cây đa" người ta thấy
    trên trăng rằm. Không thêm ánh hắt từ mặt đất.

### 19.4 Sáu lớp
**Một shader cho cả thế giới.** Khối bao là MỘT mesh với MỘT material. Mọi lớp góp vào material đó lúc dựng, như các lớp của Bức 2
nhân vào node bóng của ngọn nến (§18.4). Cách nối:
1. Cốt dựng material bằng lớp gốc `NodeMaterial`, không dùng `MeshBasicNodeMaterial` hay `MeshStandardNodeMaterial` (Phụ lục A.81):
   - lớp gốc có `lights = false`, nên màu ra là `colorNode`, không đèn nào của three chen vào;
   - `normalNode` là pháp tuyến SDF (view space), nên kênh normal của MRT, cùng Kính mài và Lột lớp, thấy đúng hình SDF chứ không thấy
     quả cầu bao;
   - `depthNode` là độ sâu của điểm chạm (Phụ lục A.82), nên mesh khác (lá, Trái Đất) xếp lớp đúng với thế giới SDF;
   - `emissiveNode` gán tường minh, như luật chung.
2. Màu, pháp tuyến và độ sâu đều cần kết quả dò tia, nhưng mỗi điểm ảnh chỉ dò MỘT lần: hàm dò bọc trong `Fn(...).once()` (Phụ lục
   A.84). Task đầu kiểm điều này trong mã shader sinh ra (§19.9).
3. Cốt công bố `shared.cot.recipe`: các hàm JS dựng node từ "điểm chạm" `h = { p, n, v, id }` (vị trí, pháp tuyến, hướng nhìn, vật
   nào). Lớp sau thay hay bọc hàm của lớp trước TRƯỚC khi biên dịch. Thân `Fn` chạy lúc biên dịch, tức sau khi mọi lớp đã dựng, nên
   nó thấy đủ các hàm:
   - `albedo(h)`: màu của vật (Cốt: đất sét; Mặt trời: màu thật);
   - `sun(h)`: nắng (Mặt trời viết); `visibility(h)`: phần nắng không bị che (Bóng mềm nhân thêm);
   - `ambient(h)`: ánh sáng không đến từ hướng nắng (Ánh đất cộng thêm); `occlusion(h)`: AO (Bóng mềm nhân thêm).

   Màu cuối = `mix(đất sét dưới đèn xưởng, albedo × sun × visibility, w2) + albedo × ambient × occlusion`. Mỗi phần tự trộn theo trọng
   số của lớp sở hữu nó, nên mọi trọng số bằng 0 thì về đất sét (luật 1 của §0).
4. Lá rơi (lớp 5) là mesh riêng, nhưng tô bằng cùng `recipe`, với điểm chạm là điểm trên lá. Vì vậy lá có bóng cây đè lên (dò tia
   bóng từ chỗ của lá) và có ánh đất như mọi vật.

Cảnh không có đèn nào của three, và không bật `renderer.shadowMap` (test giữ).

#### Lớp 1 · Cốt (`layers/l1-cot.js`)
- **Thấy gì:** hành tinh, hố, cây đa, rễ, chú Cuội, con trâu. Tất cả là đất sét dưới "đèn xưởng" viết trong shader: một hướng sáng cố
  định cộng một phần sáng đều, như `HemisphereLight` của hai bức trước. Nền đen.
- **Kỹ thuật:**
  - **Hình SDF** (`parts/cot-sdf.js`):
    - các hàm khoảng cách cơ bản: cầu, nón tròn, viên thuốc, bầu dục, xuyến;
    - phép hòa mềm `smin` (Inigo Quilez, dạng đa thức), phép chia góc cho rễ phụ;
    - `scene(p)` trả khoảng cách và id của vật gần nhất (đất, cây, Cuội, trâu). Trước khi tính hình đắt (tán, rễ), nó tính khoảng
      cách tới một hình bao rẻ; còn xa thì trả luôn khoảng cách đó.
    - `scene` là MỘT hàm shader có layout (`sdfScene`). Uniform (độ cao bay, độ hòa khối) đi vào làm tham số, không đọc thẳng trong thân
      hàm (Phụ lục A.87); tên tham số tránh từ khóa của WGSL và GLSL (`smooth` là từ khóa, nên dùng `blend`).
  - **Dò tia** (`parts/cot-do-tia.js`):
    - tia đi từ `cameraPosition` qua điểm trên mặt khối bao; giao giải tích với quả cầu bao cho đoạn [t0; t1];
    - sphere tracing từ t0: mỗi bước tiến đúng bằng khoảng cách SDF, nhân 0,9 cho an toàn, vì hố và bump làm SDF không còn chính xác;
    - chạm khi khoảng cách < ε·t, với ε theo cỡ điểm ảnh: càng xa càng cho phép sai nhiều hơn;
    - quá `steps` bước hay đi quá t1 thì `Discard()`.
  - Khối bao vẽ mặt TRONG (`BackSide`), nên camera ở trong khối vẫn có điểm ảnh để dò; tia bắt đầu từ max(t0; 0).
  - Pháp tuyến là gradient của SDF, lấy theo bốn điểm hình tứ diện (bốn lần gọi `scene`), rồi đổi sang view space cho `normalNode`.
    Hàm pháp tuyến không có layout, vì lời gọi `scene` đọc uniform (Phụ lục A.87). Nó được bọc trong `Fn().once()`, nên vẫn chỉ tính một
    lần cho mỗi điểm ảnh.
  - Độ sâu: `viewZToPerspectiveDepth(viewZ của điểm chạm, cameraNear, cameraFar)` (Phụ lục A.82).
  - **Cây bay:** hình cây (thân, cành, tán, rễ phụ) và chú Cuội dời lên theo uniform `treeLift` (§19.5). Chân rễ hòa với đất bằng
    `smin` với độ hòa `smooth`: cây lên thấp hơn độ hòa thì đất kéo dài theo, lên cao hơn thì đứt.
- **Núm:**
  - `steps` (uniform; số bước dò tối đa, 16 tới `budget.steps`): ít bước thì mép hình, và chỗ tia đi sát bề mặt, bị thủng;
  - `smooth` (uniform; 0–0,15, mặc định 0,06): độ hòa khối giữa rễ và đất, giữa các khối của tán.
- **Phá** (cả ba là uniform, không biên dịch lại):
  - *"Tô theo số bước"* (`soBuoc`): tô mỗi điểm ảnh theo số bước nó đã dò, từ chàm tới vàng lá. Mép hình, nơi tia đi sát bề mặt,
    sáng rực: thấy chỗ shader làm việc nhiều nhất. (Sau GĐ 7) Điểm ảnh có tia trượt cũng được tô, không bị bỏ: tia đi sát mép hình mà
    trượt là chỗ tốn bước nhất.
  - *"Hiện khối bao"* (`khoiBao`): điểm ảnh nào có tia trượt thì tô mờ thay cho `Discard()`, nên hiện ra quả cầu chứa cả thế giới.
  - *"Hòa khối cứng"* (`hoaCung`): `smin` thành `min`, lộ đường nối giữa rễ và đất, giữa các khối của tán.
- **Số đo:** `bay` ("Cây bay lên", m), `buoc` ("Bước dò tối đa"), `hinh` ("Số hình SDF": số hình cơ bản trong `scene`).
- **Nấc** `buoc`: hạ trần số bước dò còn ba phần tư (uniform; hạ trần, không ghi vào núm `steps`).
- **Công bố** `shared.cot = { mesh, material, scene, recipe, bounds, lift, smooth, depthOff }`:
  - `scene`: hàm TSL khoảng cách của cả thế giới; Bóng mềm và Lá đa dò tia lại bằng nó;
  - `bounds`: số của khối bao và của hình bầu dục bao tán (JS, cho cú chạm);
  - `depthOff`: uniform của thí nghiệm "Không ghi độ sâu" (lớp 5).

#### Lớp 2 · Mặt trời (`layers/l2-mat-troi.js`)
- **Thấy gì:** nắng chiếu theo pha trăng, và màu thật hiện ra: bụi trăng bạc xám, thân đa nâu, tán xanh sẫm, áo nâu của chú Cuội, trâu
  đen. Phía không có nắng tối hẳn, vì chưa có ánh đất.
- **Kỹ thuật** (`parts/mat-troi-pha.js`, `parts/mat-troi-brdf.js`):
  - Hướng nắng `S` theo Dial `ngay` (§19.2), tính trong shader từ uniform của Dial.
  - **Bụi trăng không phải mặt Lambert.** Mặt đất của hành tinh dùng mô hình Lommel–Seeliger cộng phần "bừng" khi nắng ở sau lưng người
    nhìn (opposition surge, dạng gọn của mô hình Hapke):
    `f = 2·μ0 / (μ0 + μ) · (1 + B0·exp(−g / w))`, với μ0 là cos góc tới, μ là cos góc nhìn, g là góc giữa hướng nắng và hướng nhìn.
    - Hệ số 2 làm giữa đĩa sáng bằng mặt Lambert.
    - Bụi trăng không tối dần ra mép như mặt Lambert, nên trăng rằm trông như một đĩa phẳng sáng đều.
    - Khi nắng ở sau lưng người nhìn (g gần 0), bụi bừng sáng hơn hẳn.
  - Cây, Cuội, trâu dùng Lambert.
- **Núm:** `intensity` (0–3, mặc định 1,6), `surge` (độ bừng B0, 0–1, mặc định 0,5).
- **Phá:** *"Bề mặt Lambert"* (`lambert`): bụi trăng thành mặt Lambert, nên trăng rằm tối dần ra mép như một quả bóng thạch cao.
- **Số đo:** `tuoi` ("Tuổi trăng", ngày), `sang` ("Phần sáng nhìn từ Trái Đất", %), `goc` ("Góc pha", độ).

#### Lớp 3 · Bóng mềm (`layers/l3-bong-mem.js`)
- **Thấy gì:** cây đa đổ bóng lên mặt đất; chú Cuội và con trâu có bóng. Bóng có nửa tối mềm, càng xa vật che càng mềm. Khe rễ, đáy
  hố, chỗ Cuội tựa gốc thì tối hơn (AO).
- **Kỹ thuật** (`parts/bong-mem-tia.js`):
  - **Bóng mềm từ trường khoảng cách:** từ điểm chạm, dò tia về phía `S` bằng chính `scene`. Ở mỗi bước, khoảng cách h tới vật gần
    nhất cho biết tia đi sát vật tới đâu: `bóng = min(bóng, k·h/t)`. Tia đi sát mép vật mà không chạm thì rơi vào nửa tối; k càng
    nhỏ thì nửa tối càng rộng. Không cần shadow map, không cần đèn: chỉ thêm một vòng dò.
    - Tia bóng dừng ở mép khối bao (giao giải tích, như tia chính), không đi đủ 3 đơn vị: ngoài khối bao không còn gì che nắng (lá và
      Trái Đất là mesh riêng). Bước bị kẹp dưới 0,2, nên trong khoảng trống mỗi tia đi hết 3 đơn vị mất ít nhất 15 lần gọi `scene`.
    - (GĐ 7, Task 5) Đo trên M2, 1280×800, DPR 2, mức cao: dò đủ 3 đơn vị chỉ được 54 khung/giây (18,5 ms); dừng ở mép khối bao thì
      lại đủ 60. Thử thêm cách chỉ tô ở điểm chạm (bọc phần tô trong `If(chạm)`, vì `Discard` không dừng luồng): không đổi số đo, nên
      bỏ, giữ code dò tia chính như cũ.
  - **AO từ trường khoảng cách:** lấy năm điểm cách đều dọc pháp tuyến. Điểm nào có khoảng cách nhỏ hơn quãng đã đi thì quanh đó có
    vật che; cộng dồn lại thành độ che.
    - (GĐ 7, Task 8) Các mẫu trải thẳng bằng vòng `for` của JS, không dùng `Loop` của TSL: số mẫu là `budget.ao` (5, 4, 3), cố định
      theo mức lúc dựng (Phụ lục A.88).
  - Bọc `recipe.visibility` (nhân `mix(1, bóng, w3)`) và `recipe.occlusion` (nhân `mix(1, AO, w3)`).
- **Núm:** `softness` (k, 2–32, mặc định 8), `ao` (độ đậm AO, 0–1, mặc định 0,8).
- **Phá:** *"Bóng cứng"* (`bongCung`): k = 128, nửa tối gần như biến mất. Đem so với bóng shadow map của Bức 2.
- **Số đo:** `buocBong` ("Bước dò bóng"), `mauAo` ("Số mẫu AO").
- **Nấc** `chi-tiet`: số bước dò bóng giảm một nửa (hạ trần, không ghi vào núm).
  - (GĐ 7, Task 8) Thiết kế đầu hạ cả số mẫu AO. Mẫu AO giờ trải thẳng trong shader, nên đổi số mẫu là biên dịch lại; số mẫu AO cố
    định theo mức.

#### Lớp 4 · Ánh đất (`layers/l4-anh-dat.js`)
- **Thấy gì:** Trái Đất treo trên trời và bầu trời sao. Phần đêm của hành tinh không còn đen hẳn mà có ánh xanh lam nhạt.
- **Kỹ thuật** (`parts/anh-dat-troi.js`):
  - **Trái Đất** là một mesh cầu, cũng dùng `NodeMaterial` như khối bao.
    - Màu biển, đất, mây sinh bằng noise theo hướng trên mặt cầu, tô bằng cùng hướng nắng `S`. Vì vậy pha của Trái Đất nhìn từ trăng
      ngược với pha trăng nhìn từ Trái Đất: trăng mới thì Trái Đất tròn.
    - Viền khí quyển (fresnel) màu `anhDat`, ghi vào emissive, nên Phủ bóng làm nó tỏa nhẹ.
  - **Ánh đất** (earthshine): Trái Đất phản chiếu nắng xuống hành tinh, từ hướng +Y.
    - Cường độ theo phần sáng của Trái Đất nhìn từ trăng, (1 + cos φ)/2, nên mạnh nhất lúc trăng mới.
    - Cộng vào `recipe.ambient`, nhân `w4`.
    - Đây chính là ánh "tro" người ta thấy trên phần tối của trăng lưỡi liềm.
  - **Bầu trời:** một mesh cầu lớn, vẽ mặt trong, không ghi độ sâu, vẽ trước mọi thứ (`renderOrder`). Sao sinh bằng hàm băm theo ô trên
    hướng nhìn, nhấp nháy theo `ctx.u.time` (tất định). Sao ghi vào emissive, nhân `w4`.
- **Núm:** `earthshine` (0–1, mặc định 0,25), `stars` (mật độ sao, 0–1, mặc định 0,6).
- **Phá:** *"Không có Trái Đất"* (`khongTraiDat`): giấu Trái Đất và tắt ánh đất. Phần đêm đen kịt, nên thấy ngay ánh đất đã góp gì.
  - Trái Đất giấu bằng `visible = false`, không bằng màu 0: màu 0 để lại một đĩa đen che sao. Ánh đất tắt bằng uniform.
- **Số đo:** `traiDat` ("Trái Đất sáng, nhìn từ trăng", %).
- **Vật:** `trai-dat`, `bau-troi`.

#### Lớp 5 · Lá đa (`layers/l5-la-da.js`)
- **Thấy gì:** chạm thì lá rơi (§19.2); không ai chạm thì thỉnh thoảng một lá tự rụng. Lá vàng, tỏa nhẹ. Lá khuất sau thân cây thì
  bị che, lá trước thân thì nằm trên.
- **Kỹ thuật:**
  - **Đường rơi** (`parts/la-da-roi.js`, hàm thuần, không import three) có dạng đóng:
    - `p(t) = p0 + v0·τ + ½·g·τ²`, với τ = t − lúc rơi, và g hướng về tâm hành tinh, lấy tại điểm xuất phát;
    - lúc chạm đất là nghiệm của một phương trình bậc hai theo phương thẳng đứng tại chỗ đó;
    - sau đó lá nằm yên, rồi nhỏ dần trong 1 giây và biến mất;
    - lá quay đều quanh một trục ngẫu nhiên, vì không có không khí để hãm.
  - **Mesh** là một `InstancedMesh`, cấp theo trần `budget.leaves` MỘT lần:
    - Mỗi lá có thuộc tính riêng (lúc rơi, điểm xuất phát, vận tốc đầu, trục quay, hạt giống). Thuộc tính chỉ ghi lúc chạm (đặt
      `needsUpdate`, không dùng `DynamicDrawUsage`).
    - `positionNode` tính vị trí và độ xoay của lá theo thời gian trên GPU, xoay cả `normalLocal`: không có ma trận nào phải ghi lại
      mỗi khung.
    - Ô trống có lúc rơi rất xa trong quá khứ, nên lá có cỡ 0 và nằm ở tâm hành tinh.
    - `frustumCulled = false`, vì vị trí thật chỉ có trong shader.
  - **Cú chạm** (JS): giao tia của cử chỉ với hình bầu dục bao tán, đã dời theo `treeLift`. Không giao thì lấy điểm trên hình bầu dục
    gần tia nhất. Các lá xuất phát quanh điểm đó, với hạt giống từ `lib/random.js` theo số lần chạm, nên tất định.
  - **Xếp lớp nhờ độ sâu:** lá là mesh thường, nên phép thử độ sâu của GPU so lá với độ sâu mà khối bao đã ghi (lớp 1). Không có độ sâu
    đó thì lá luôn nằm trên mọi thứ.
  - Màu lá theo `recipe` của khối bao (lớp 1–4): xanh sẫm, có nắng, có bóng cây (dò tia bóng ngắn từ chỗ của lá), có ánh đất.
  - Lá to dần theo `w5`, và bằng 0 thì không thấy: lớp này chỉ thêm vật, không đổi màu vật khác.
- **Núm:**
  - `burst` (js; 1–8, mặc định 4): số lá mỗi lần chạm;
  - `gravity` (select: `trang` 1,62 m/s² hay `traiDat` 9,81 m/s²): đổi sang trọng lực Trái Đất thì lá rơi nhanh gấp chừng 2,5 lần
    (√6).
- **Phá:** *"Không ghi độ sâu"* (`doSau`): khối bao ghi độ sâu xa nhất (uniform `shared.cot.depthOff`), nên lá sau thân cây vẫn vẽ đè
  lên thân. Thấy vì sao hai lối vẽ phải dùng chung một bộ đệm độ sâu.
- **Số đo:** `la` ("Lá đang rơi"), `roi` ("Thời gian rơi từ tán", giây, theo núm `gravity`).
- **Vật:** `la-roi`.

#### Lớp 6 · Phủ bóng (dùng chung)
Như hai bức trước. Thứ có emissive là sao và viền khí quyển của Trái Đất. Bụi trăng không tự phát sáng: chỗ sáng nhất là nắng thật.

### 19.5 Chuyển động tất định (`shared.js` của bức)
- **Cây bay** (`parts/cot-cay-bay.js`, hàm thuần) có dạng đóng theo các mốc giữ và thả, như trống của Bức 2:
  - đang giữ (từ t0, độ cao L0, vận tốc v0): lò xo tắt dần tới hạn kéo về H, `lift = H + (A + B·s)·e^(−s/τ)` với s = t − t0,
    A = L0 − H, B = v0 + A/τ; H = 0,45, τ = 0,3 s. Cây lên tới 95% trong chừng 1,4 s.
    (GĐ 7, Task 3) Thiết kế đầu dùng `L0 + (H − L0)(1 − e^(−s/τ))`: công thức đó làm vận tốc nhảy ở mốc giữ, nên đổi sang lò xo;
  - thả ở t1 (độ cao L1, vận tốc v1 lấy từ đoạn trước): rơi tự do `L1 + v1·Δ − ½·g·Δ²` với g của trăng, tới khi chạm 0; nảy một lần
    với vận tốc còn 0,3 lần; rồi đứng yên;
    - (GĐ 7, review cuối) vận tốc lên lúc thả có trần `v1 ≤ √(2g(H − L1))`, để đỉnh của đường rơi không quá H. Không có trần thì giữ chừng
      0,5–1 giây rồi thả, cây mang vận tốc lên của lò xo (chừng 0,55 đơn vị/giây) vào lúc rơi tự do với g của trăng và bay tới 1,06: tán ló
      ra ngoài khối bao (bị cắt phẳng) và đâm vào Trái Đất. Test cũ chỉ chạy một hạt giống, nên không bắt được; giờ quét lúc thả và chạy
      40 hạt giống;
  - mỗi mốc lưu (t, độ cao, vận tốc) tính từ đoạn trước, nên độ cao liên tục; vận tốc liên tục trừ khi thả sớm chạm trần ở trên. Gọi
    `lift(t)` bao nhiêu lần, theo thứ tự nào, cũng ra cùng một số;
  - giảm chuyển động: τ và thời gian rơi gấp đôi.
- **Lá:** §19.4 lớp 5. Mốc rơi là `ctx.u.time` lúc chạm.
- **Trái Đất** tự quay một vòng mỗi 120 giây theo `ctx.u.time`; sao nhấp nháy theo `ctx.u.time`.
- **Đơn vị:** một đơn vị cảnh coi như 10 m. Vì vậy g của trăng là 0,162 đơn vị/s² (1,62 m/s²), của Trái Đất là 0,981. Cây đa cao chừng
  8 m.

### 19.6 Xưởng và hợp đồng
- **Hợp đồng không đổi, logic của xưởng không đổi.** Mọi thứ Bức 3 cần đã có:
  - `Painting.setup` với `dials` và `onGesture`;
  - các cử chỉ `'tap'` và `'hold-*'`;
  - thí nghiệm, số đo, nấc, `quality`.

  Raymarching là chuyện giữa bức và three (`NodeMaterial`, `depthNode`, `normalNode`); xưởng không cần biết. Đây là phép thử của §0 lần
  thứ hai: một bức vẽ theo lối khác hẳn vẫn vào được xưởng mà không đổi một dòng logic.
  - Chỉ thêm chữ: `ui/strings.vi.js` có thêm khóa `site` (tên trang, "Bức N"), `series` (nhãn và chữ của dải link lật tranh) và
    `gallery` (chữ của Phòng tranh), §19.7. Trình sinh trang đọc chúng; không file nào trong `src/` import `strings.vi.js`.
  - `CameraSpec.azimuth` nhận `±Infinity` (Phụ lục A.86); JSDoc ghi thêm điều này.
- **Luật hai lần:**
  - Bức 3 dùng của hộp màu `lib/astro/moon.js` (pha trăng) và `lib/tsl/noise.js` (biển, đất, mây của Trái Đất; bump của mặt đất), cùng
    lớp dùng chung Phủ bóng.
  - Không rút gì lên `lib/`: SDF, dò tia, bóng mềm ở lại trong bức, tới khi một bức khác cần (§16).
- **Hàng rào từ vựng** (`meta.fence`): `banyan`, `buffalo`, `earthshine`, `regolith`, `chú cuội`, `cuội`, `cây đa`, `trâu`, `ánh đất`,
  `bụi trăng`.
  - Không rào `sdf`, `raymarch`, `march`: đó là tên kỹ thuật, bức sau có thể cần rút chúng lên hộp màu.
  - Test tự kiểm phải bắt được ít nhất một từ của Bức 3 và không bắt nhầm.
- **Tên vật** (Từng sợi): `khoi-bao` (lớp 1), `trai-dat`, `bau-troi` (lớp 4), `la-roi` (lớp 5). Cả cảnh chỉ có bốn lần vẽ, và Từng sợi
  cho thấy điều đó: một quả cầu chứa cả thế giới.
- **Trang** `tranh/cung-que/index.html` do trình sinh trang viết ra (§19.7), không viết tay.

### 19.7 Phòng tranh và trình sinh trang
**Trình sinh trang** (`scripts/pages.js`, lệnh `npm run pages`):
- Trang của các bức chỉ khác nhau ở phần chữ và đường dẫn: tên, mô tả, thẻ og, poster, số bức, link lật tranh, thơ, dòng import. Trình
  sinh viết mọi trang từ MỘT khuôn, đọc registry, `meta` và `ui/strings.vi.js`.
- Trang sinh ra được **commit vào repo** như trước, không sinh lúc build:
  - trang vẫn là file HTML thật, đọc được, chạy được ở tầng tĩnh; Vite vẫn lấy `input` từ registry như cũ;
  - không có bước build nào ghi vào thư mục nguồn;
  - test "trang trên đĩa khớp với trang sinh ra" báo lỗi tiếng Việt khi lệch, kèm lệnh `npm run pages`. Các test HTML cũ giữ nguyên vai
    trò (§8.7).

  §16 từng ghi "plugin Vite"; GĐ 7 chọn script cộng test vì các lý do trên.
- Lần đầu, trình sinh phải ra đúng từng byte hai trang hiện có (một test giữ), rồi mới đổi khuôn: thêm link Phòng tranh, thêm Bức 3.
- Thêm một bức về sau: thêm dòng registry, chạy `npm run pages`. Link "bức sau" của bức kề trước tự có (§15 a).

**Dải link** dưới `<h1>` của mỗi trang (`<nav class="series" aria-label="Các bức tranh">`), theo thứ tự:
1. `← Bức {n−1} · {tên}` (`rel="prev"`);
2. `Phòng tranh`;
3. `Bức {n+1} · {tên} →` (`rel="next"`).

Bức đầu không có link trước, bức cuối không có link sau. Đường dẫn tương đối như GĐ 6:
- từ gốc, Phòng tranh là `tranh/`;
- từ `tranh/<slug>/`, Phòng tranh là `../`, bức kề là `../<slug>/`, Bức 1 là `../../`.

**Phòng tranh** (`tranh/index.html`, URL `…/son-mai-anh-sang/tranh/`):
- Trang tĩnh, sinh từ registry, không có script nào (không three, không boot), nên chạy trên mọi trình duyệt, mọi tầng.
- Nội dung:
  - dòng nhỏ "Sơn Mài Ánh Sáng", `<h1>` "Phòng tranh", một câu giới thiệu kỹ thuật;
  - một danh sách có thứ tự (`<ol>`) các bức theo `meta.no`. Mỗi mục là một link gồm poster, "Bức N", tên và `tagline`. Poster có
    `loading="lazy"`, `width`, `height`, và `alt=""` vì chữ của link đã nói đủ.
- Kiểu: `src/styles/gallery.css`, dùng `tokens.css` và font của trang tranh; một cột trên điện thoại, nhiều cột trên máy tính.
  - (GĐ 7, Task 10) Ba biến font (`--serif`, `--sans`, `--mono`) chuyển từ `shell.css` sang `tokens.css`, để `shell.css` và
    `gallery.css` cùng dùng một chỗ. Trang Phòng tranh không import `notebook.css`, `tools.css`, `captions.css`.
- Thẻ og: `og:title` "Phòng tranh · Sơn Mài Ánh Sáng", `og:url` = `SITE + 'tranh/'`, `og:image` lấy của Bức 1.
- `vite.config.js` thêm trang này vào `input` (khóa `phong-tranh`).
- URL gốc vẫn là Bức 1.

### 19.8 Chất lượng và ngân sách
**Bảng của Bức 3** (`paintings/cung-que/quality.js`):

| Mức | DPR tối đa | Bước dò (`steps`) | Bước dò bóng | Mẫu AO | Lá tối đa | Bloom (`resolutionScale`) |
|---|---|---|---|---|---|---|
| **cao** | 2 | 128 | 32 | 5 | 64 | 0.5 |
| **vừa** | 1.5 | 96 | 24 | 4 | 48 | 0.25 |
| **thấp** | 1.25 | 64 | 16 | 3 | 32 | 0.25 |

- Khóa: `dpr`, `steps`, `shadowSteps`, `ao`, `leaves`, `bloom`.
- Thang: `['dpr', 'bong-mem.chi-tiet', 'cot.buoc', 'phu-bong.bloom']`. Nấc `cot.buoc` hạ trần số bước dò còn ba phần tư. Số bước là
  uniform (vòng lặp có cận là uniform, Phụ lục A.83), nên hạ nấc không biên dịch lại.
- Trần núm theo mức: `steps` tối đa `budget.steps`; `burst` tối đa 8 ở mọi mức (số lá đã có trần `leaves`).
- **Draw call:** khối bao, Trái Đất, bầu trời, lá là 4 vật, nên mức cao có `4 + 12 (bloom) + 1 (FXAA) + 1 (quad) = 18`. E2e giữ ≤ 30.
- **Chi phí mỗi điểm ảnh** là rủi ro chính của bức:
  - chỉ điểm ảnh trong khối bao mới dò, và khối bao chiếm chừng một nửa khung mặc định;
  - mỗi điểm ảnh tốn: tới `steps` lần gọi `scene` (mỗi lần vài chục phép tính, có hình bao để bỏ qua phần đắt), 4 lần cho pháp tuyến,
    tới `shadowSteps` lần cho bóng, `ao` lần cho AO;
  - mục tiêu như §2: 60 khung/giây trên laptop (Mac M2, 1280×800, DPR 2, mức cao), 45 trên điện thoại tầm trung (mức vừa và thấp);
  - đo ở task đầu với một hình SDF đại diện (§19.10), rồi đo lại khi đủ sáu lớp.
  - (GĐ 7, Task 8) Đo khi đủ sáu lớp, sau khi trải thẳng AO (Phụ lục A.88). Mac M2, Chrome, WebGPU, cảnh live 10 giây:

    | Mức | 1280×800, DPR 2 | 390×844, DPR 3, isMobile | Draw call | ms CPU |
    |---|---|---|---|---|
    | **cao** | 60,1 | 59,6 | 18 | 0,9–1,7 |
    | **vừa** | 60,2 | 60,5 | 18 | 1,0–1,8 |
    | **thấp** | 60,2 | 60,5 | 18 | 0,8–1,0 |

    - Đo nặng: 2560×1600, DPR 2, mức cao: 24,2 khung/giây sau khi bộ điều chỉnh hạ DPR về 1,75 (41,3 ms cho 12,5 triệu điểm ảnh,
      chừng 3,3 ns mỗi điểm ảnh).
    - Trước khi trải thẳng AO: mức cao ở 1280×800, DPR 2 chỉ được 40 khung/giây; ở 2560×1600, 80,8 ms.
  - (GĐ 7, Task 5) Có Bóng mềm (32 bước bóng, 5 mẫu AO): 60 khung/giây ở cả ba mức, 1280×800, DPR 2. Ở 2560×1600, DPR 2, mức cao:
    24,5 khung/giây sau khi bộ điều chỉnh hạ DPR về 1,75 (chừng 3,3 ns mỗi điểm ảnh; trước Bóng mềm chừng 2 ns). Suy ra ở 1280×800,
    DPR 2 GPU bận chừng 13,4 ms mỗi khung, dư chừng 20%. Chrome headless không báo ms GPU trên máy này (`gpuMs` null), nên khoảng dư
    là số suy ra.
- **JS:** chunk của bức cộng chunk content; chunk `three` dùng chung. Số đo ghi vào README.

### 19.9 Kiểm thử
**Tự chạy cho Bức 3**, vì các test này lặp qua registry:
- hợp đồng, tên vật, HTML;
- e2e chung: tĩnh, WebGL2, WebGPU, mài về Cốt, công cụ học, `?poster`, quầng trăng;
- a11y.

**Unit mới** (`tests/paintings/cung-que/`):
- `mat-troi-pha`:
  - ngày 1 cho S = −E, ngày ≈ 15,77 cho S = +E, ngày ≈ 8,38 cho S = A;
  - phần sáng bằng `illumination`;
  - nhãn của Dial ("mùng 1", "rằm", "ngày 20"); mặc định theo `?at`.
- `cot-cay-bay`:
  - giữ thì lên gần H trong 1,5 s; thả thì về 0 và nảy một lần;
  - độ cao và vận tốc liên tục ở mỗi mốc; giữ, thả nhiều lần;
  - gọi theo thứ tự nào cũng ra cùng số;
  - giảm chuyển động thì chậm gấp đôi.
- `la-da-roi`:
  - rơi từ tán mất chừng 2,7 s với g của trăng, chừng 1,1 s với g của Trái Đất;
  - chạm đất đúng chỗ; nằm yên rồi biến mất;
  - vòng ô theo trần; tất định theo số lần chạm;
  - tia trượt tán thì điểm xuất phát là điểm gần tia nhất.
- `cot-the-gioi`: khối bao chứa hình bao của mọi vật, kể cả khi cây bay cao nhất.
- **Từng lớp**, dựng cả bức bằng `buildPainting`:
  - khối bao là `NodeMaterial` gốc, có `depthNode`, `normalNode`, `emissiveNode`;
  - cảnh không có đèn nào của three, `shadowMap` tắt;
  - thí nghiệm và số đo đủ, có nhãn; nấc chỉ có khi có tác dụng.

  "Mọi trọng số bằng 0 thì về đất sét" kiểm ở e2e (mài về Cốt), vì TSL chưa có bộ tính trên CPU (§16).
- **Cử chỉ:** chạm sinh `burst` lá; giữ và thả gọi đúng mốc của cây bay; `'swipe'`, `'double-tap'` không làm gì riêng.
- **Shader** (`tests/helpers/nodes.js#compileMaterial`, WGSL và GLSL):
  - khối bao, Trái Đất, bầu trời, lá biên dịch được ở cả hai backend;
  - **mã fragment của khối bao có đúng một vòng dò tia chính** (đếm tên biến của vòng dò), dù màu, pháp tuyến và độ sâu cùng dùng nó.
- **Chữ của Sổ tay** và **chất lượng**: như Bức 2.

**Trình sinh trang, Phòng tranh, CI:**
- `tests/paintings/html.test.js`:
  - trang trên đĩa khớp với trang sinh ra;
  - dải link đúng thứ tự: trước, Phòng tranh, sau;
  - Phòng tranh liệt kê đủ các bức theo `meta.no`, link và poster trỏ đúng, không có `<script>`.
- `tests/rules/e2e.test.js`:
  - mọi `test.describe` trong `e2e/<slug>.spec.js` bắt đầu bằng `` `${meta.title} · ` ``;
  - nhóm e2e (`scripts/e2e-groups.js`) gồm đúng các bức của registry, cộng nhóm `chung`.

**E2e riêng** (`e2e/cung-que.spec.js`; WebGL2 trên SwiftShader là cổng chặn, WebGPU không chặn):
- Dial: ngày 15 thì vùng tán đa sáng hơn hẳn ngày 1; ngày 8 thì nửa phải của hành tinh sáng hơn nửa trái.
- Mài: mọi lớp về 0 thì vùng hành tinh xám đều (độ bão hòa thấp). Cùng một khung `?freeze` thì giống hệt nhau.
- Ánh đất: ở ngày 1, phần đêm của hành tinh có ánh khi Ánh đất bằng 1, đen kịt khi bằng 0. Vùng Trái Đất có màu lam.
- Bóng mềm: ở ngày 10 (nắng xiên từ bên phải, chừng 20° trên chân trời ở gốc cây), vùng bóng cây trên mặt đất tối hơn rõ khi Bóng
  mềm bằng 1 so với 0. Trước thượng huyền (ngày < 8,4), mặt trời còn dưới chân trời ở đỉnh hành tinh, nên cây chưa đổ bóng.
- Độ sâu của SDF:
  - Bật "Hiện khối bao". Trong view Depth của Lột lớp, chỗ tia trúng hình phải gần (sáng) hơn hẳn chỗ tia trượt, vì chỗ trượt mang độ sâu
    của mặt sau khối bao.
  - Không có `depthNode` thì hai chỗ cùng mang độ sâu của mặt sau quả cầu. Nhìn chỗ trượt là nền thì không chứng minh được gì, vì
    `Discard()` đã cho nền ở đó.
  - Pháp tuyến SDF: test chung "Normal" (Kính mài) chạy trên Bức 3.
- Chạm vào tán thì số đo `la` > 0.
- Giữ thì số đo `bay` ("Cây bay lên", m) vượt 3 m. Thả thì về dưới 0,5 m: rơi từ 0,45 mất chừng 2,4 s, nảy thêm chừng 1,4 s. E2e
  chạy live và chờ rộng tay, vì đồng hồ của cảnh theo khung vẽ, mà SwiftShader vẽ chậm.
- Draw call ≤ 30 ở mức cao; `?level=thap` chạy được; bật từng thí nghiệm không có lỗi console.

**E2e Phòng tranh** (`e2e/phong-tranh.spec.js`, ở project tĩnh, không cần GPU):
- đủ ba mục, đúng thứ tự;
- bấm từng mục thì tới đúng trang;
- axe không có lỗi serious hay critical.

`e2e/lat-tranh.spec.js` thêm Bức 2 ⇄ Bức 3, và link "Phòng tranh" ở mọi trang.

**CI: chia e2e theo bức** (§13):
- **Lý do:**
  - `--shard` chia theo SỐ test và theo thứ tự file, nên phần 1 nhận mọi spec riêng của các bức, là phần nặng nhất.
  - Sau GĐ 6, phần 1 của e2e chặn mất 26 phút, phần 1 của e2e WebGPU có lần mất 32 phút, trên trần 40. Thêm Bức 3 là quá trần.
- **Cách mới:** mỗi bức một job, cộng một job `chung` cho các test không thuộc bức nào (lật tranh, Phòng tranh).
  - Job `nhom-e2e` chạy `node scripts/e2e-groups.js`. Script này đọc registry rồi in ra ma trận `[{ id, grep }, …, { id: 'chung',
    grepInvert }]`; tên bức đã được thoát ký tự đặc biệt của regex.
  - `e2e` và `e2e-webgpu` lấy `matrix.group` từ đó (`fromJSON`), rồi chạy `--grep` (hay `--grep-invert`) theo nhóm. (Sau GĐ 7) Không
    kèm `--pass-with-no-tests`: mọi nhóm đều có test ở cả ba project, nên cờ đó chỉ che lỗi (đặt sai tên `describe`, đổi tên bức thì
    nhóm rỗng mà vẫn xanh). Test luật khớp regex bằng chính hàm của Playwright (`forceRegExp`, cờ `gi`: không phân biệt hoa thường).
  - Giá trị của ma trận đi qua `env`, không chèn thẳng vào lệnh shell.
  - Gom được vì mọi test của một bức đều nằm trong `describe` bắt đầu bằng `"{tên bức} · "`: e2e chung, a11y và spec riêng đều đã như
    vậy. Test luật giữ quy ước này.
  - Không dùng `PWTEST_SHARD_WEIGHTS`, vì đó là biến nội bộ của Playwright (Phụ lục A.85).
- **Ước lượng** từ số đo GĐ 6: mỗi job một bức chừng 15–20 phút, cộng 3 phút cài đặt; job `chung` vài phút. Thêm bức thì thêm job, tự
  động, không sửa workflow. Thời gian thật đo ở task CI.
- (Sau GĐ 7) **Thời gian thật**, lượt CI đầu của PR #8 (tính cả bước cài đặt):

  | Nhóm | `e2e` (chặn) | `e2e-webgpu` (không chặn) |
  |---|---|---|
  | Ao Sen Đêm | 22,4 phút | 23,2 phút |
  | Đèn Kéo Quân | 15,3 phút | 9,5 phút |
  | Cung Quế | 28,7 phút, hỏng: hai test quá trần 60 giây (mỗi test chạy hai lần) | quá trần 40 phút, bị hủy |
  | `chung` | 0,6 phút | 0,6 phút |

  - `build` 0,6 phút; `nhom-e2e` 6 giây. Các job chạy song song, nên cả lượt mất bằng job dài nhất.
  - Runner vẽ Bức 3 trên SwiftShader chậm hơn Mac M2 nhiều lần. Với WebGL2, nhiều test mất 40–60 giây, thay vì 10–15 giây ở máy local.
    Với WebGPU, chừng 0,2 khung/giây: đồng hồ của cảnh nhích chừng 1 giây trong 60 giây thật. Vì vậy:
    - `e2e/cung-que.spec.js` đặt trần chung 180 giây (`test.describe.configure`). Kéo camera dùng 4 bước chuột thay cho 20, vì mỗi sự
      kiện chuột của Playwright đợi một nhịp khung;
    - registry có `ciWebgpuSmoke` (tùy chọn). Bức có nó thì job WebGPU chỉ chạy các test mang tag `@khoi` của bức đó (`webgpuGrep` của
      `scripts/e2e-groups.js`). Bức 3 có ba test khói: độ sâu của hình SDF, các thí nghiệm, mức thấp. Job chặn (WebGL2) vẫn chạy đủ, và
      cả nhóm chạy đủ trên GPU thật ở máy local (37 test qua).
- `deploy` cần `build` và mọi job của `e2e`.

**Kiểm tay** (thêm vào §12):
- Bức 3 trên điện thoại thật: mượt ở mức vừa và thấp; chạm, giữ bằng ngón tay;
- VoiceOver đọc Dial "Ngày âm lịch" và dải link (có Phòng tranh);
- Phòng tranh trên Safari của điện thoại;
- Bao duyệt thơ và poster.

### 19.10 Cách làm GĐ 7
Như GĐ 6 (§18.9): làm thẳng trên nhánh `gd7-cung-que`, vừa làm vừa sửa.
1. **Plan gọn.** Mỗi task ghi mục tiêu, file, test viết trước, cách kiểm bằng chạy thật. Code đầy đủ chỉ có ở chỗ khó: dò tia,
   `depthNode`, pháp tuyến, bóng mềm, BRDF bụi trăng, đường rơi, trình sinh trang, ma trận CI. Bao xem plan và chọn cách thực thi.
2. **Task rủi ro nhất làm trước:** khối bao với một SDF đại diện (hành tinh có hố, một cây có tán và rễ), chạy thật trên WebGPU (GPU
   thật) và WebGL2 (SwiftShader).

   **Luật dừng:** một trong bốn điều sau không đạt thì dừng, báo Bao, và chọn đường lùi (§19.11):
   - `depthNode` đúng ở cả hai backend: một mesh thử bị che đúng sau hình SDF;
   - kênh normal thấy pháp tuyến SDF (`normalNode` qua `normalView`, Phụ lục A.81);
   - mã fragment có đúng một vòng dò chính (`Fn().once()`, Phụ lục A.84);
   - trên Mac M2, 1280×800, DPR 2, mức cao: ≥ 60 khung/giây.
3. Đủ hình (cây, rễ, Cuội, trâu), camera, lớp Mặt trời với Dial pha trăng.
4. **Điểm duyệt ảnh giữa chừng** (một trang ảnh riêng tư): hình, bố cục, ba pha. Bao duyệt trước khi làm các lớp còn lại. Hình là số
   trong `parts/cot-the-gioi.js` và `parts/cot-sdf.js`, nên sửa rẻ.
5. Bóng mềm, Ánh đất, Lá đa và cây bay; trình sinh trang và Phòng tranh; CI theo bức; chữ của Sổ tay và sơ đồ; lượt màu; poster. Task
   nào cũng có test viết trước và chạy thật. Chỗ nào làm khác spec thì sửa spec trong cùng task.
6. Review cuối cả nhánh, đối chiếu thơ, rồi hỏi Bao trước khi push, và hỏi lại trước khi merge (merge là deploy).

### 19.11 Rủi ro riêng
- **Chi phí mỗi điểm ảnh:** dò tia, bóng và AO chạy trên chừng nửa màn hình.
  - Cách tránh: hình bao rẻ trước hình đắt; bump chỉ có lúc tô; ε theo cỡ điểm ảnh; số bước là uniform nên hạ được bằng nấc; đo ở task
    đầu.
  - Nếu vẫn thiếu: chia khối bao làm hai (hành tinh, cây) để bớt điểm ảnh có tia trượt; giảm `steps` mặc định. Dò bóng ở độ phân giải
    thấp hơn là việc để sau (§16).
- **`depthNode` hay `normalNode` không chạy như đọc mã, ở một backend nào đó.**
  - Đường lùi cho độ sâu: lá tự kiểm che khuất bằng cách dò tia từ camera tới lá qua `scene` (lá nhỏ nên rẻ). Hoặc để lá luôn nằm trên,
    và ghi vào phần giới hạn đã biết.
  - Đường lùi cho pháp tuyến: bỏ `normalNode`; view Normal của Bức 3 thấy quả cầu bao, ghi vào phần giới hạn đã biết.
- **Vòng dò chạy nhiều lần** vì có ba chỗ dùng: màu, pháp tuyến, độ sâu. `Fn().once()` có thể vẫn sinh lại vòng dò trong lượt dựng
  riêng của pháp tuyến (`subBuild` 'NORMAL'). Đường lùi: dò một lần trong `colorNode`, giữ kết quả bằng `.toVar()` cho `normalNode` và
  `depthNode` đọc lại. Nếu không được thì bỏ `normalNode` như trên.
- **Hình SDF trông thô:** khối tròn dễ thành đồ chơi nhựa. Cách tránh: dáng đất nặn có chủ ý, màu sơn mài; Bao duyệt ở điểm duyệt ảnh.
- **Thủng hình khi tia đi sát mặt** (rễ phụ mảnh, mép tán). Cách tránh: bước nhân 0,9; ε theo khoảng cách; rễ phụ đủ dày so với cỡ
  điểm ảnh ở khoảng cách gần nhất. Thí nghiệm "Tô theo số bước" giúp thấy chỗ hỏng.
- **Trình sinh trang làm lệch trang cũ.** Cách tránh: test từng byte với hai trang hiện có trước khi đổi khuôn.
- **CI:** chia theo bức như §19.9; đo ở task CI.

## 20. Bức 4 · Đàn Gà Mẹ Con (GĐ 8)

> Một tờ tranh Đông Hồ nằm trên tấm ván sơn đen: gà mẹ ngậm con ong, mười gà con quây quần. Nhìn thẳng thì là tranh in; kéo xoay thì
> bước vào được, và đàn gà là tượng nặn đứng trên tờ giấy điệp.

**Nơi ở:** `src/paintings/dan-ga-me-con/`, trang `tranh/dan-ga-me-con/index.html` (trình sinh trang viết), poster ở
`public/paintings/dan-ga-me-con/`. Lớp 6 là Phủ bóng dùng chung. Mọi luật của kỹ thuật (§0) và của xưởng (§8–§10, `CLAUDE.md`) áp như ba
bức trước. Chương này chỉ ghi phần riêng của Bức 4, cùng những việc đi kèm: camera trực giao, độ sâu đúng cho camera trực giao, tranh tự
khép lại (§20.6) và bể hạt dùng chung (§20.7). Những gì Bao đã chọn nằm ở §1 (GĐ 8); phần còn lại do Claude quyết, Bao duyệt khi đọc
spec.

**Số trong chương này** là số thiết kế, theo đơn vị của cảnh: một đơn vị là 10 cm (gà mẹ dài chừng 40 cm). Số cuối cùng chốt ở điểm duyệt
ảnh và lượt màu (§20.10); số nào đổi thì sửa lại ở đây, trong cùng task.

**Điều mới so với ba bức trước:**
- Bức đầu tiên **không dựng ánh sáng thật**. Nó vẽ phi hiện thực (NPR), để cảnh 3D trông như tranh in khắc gỗ: mảng màu phẳng, nét mực,
  giấy điệp.
- **Camera trực giao** (`CameraSpec.kind: 'ortho'`) và **tranh tự khép lại** (`CameraSpec.home`): hai trường tùy chọn mới của hợp đồng.
- **Lần đầu rút code của một bức lên hộp màu theo luật hai lần:** phần chung của hạt compute đom đóm (Bức 1) thành
  `lib/tsl/particles.js`; Bức 4 dùng nó cho thóc.
- Bức đầu tiên có ảnh **sáng** (giấy điệp). Chữ của trang nằm trên phần ván tối quanh tờ giấy.

### 20.1 Cảnh
- **Theo tranh gốc** "Đàn gà mẹ con" của làng Đông Hồ:
  - một gà mái mẹ đứng giữa, mỏ ngậm một con ong mớm cho con (ý dân gian: mẹ bắt cái nguy hiểm để che chở con);
  - quanh mẹ là mười gà con, mỗi con một dáng: rỉa lông, trèo lên lưng mẹ, nấp dưới bụng mẹ, chạy chơi, ngước nhìn mồi;
  - tranh gốc không có gà trống và không có cảnh nền.

  Bố cục của Bức 4 theo tinh thần đó, không chép nét của bản khắc.
- **Tờ giấy cong.** Tờ giấy điệp nằm phẳng ở phía trước (sân của đàn gà) rồi uốn lên thành vách ở phía sau, như phông chụp ảnh:
  - mặt sàn rộng 14, sâu 10; chỗ uốn có bán kính 2; vách cao 4,5 (mép trên ở y 4,5). Vách cao 6 lúc đầu để trống gần nửa tờ giấy phía
    trên đàn gà; điểm duyệt ảnh (GĐ 8 Task 4) hạ xuống 4,5;
  - từ camera mặc định, phần sàn (bị thu ngắn theo góc nhìn) và phần vách ghép thành một hình chữ nhật 14 × 7,6 đơn vị trên màn, tức chừng
    11 : 6 (1,83 : 1), như một tờ tranh khổ ngang. Đo trên GPU thật sau điểm duyệt ảnh: 844 × 460 điểm ảnh CSS ở khung 1280 × 800. Số cũ
    "chừng 4 : 3" là ước lượng trước khi có camera; 14 × 9,1 (3 : 2) là của vách cao 6. Nền tranh Đông Hồ trơn, nên chỗ uốn không lộ;
  - kéo xoay mới thấy tờ giấy cong, và gà đứng trên phần sàn.
  - Lý do không dùng một tờ phẳng nằm ngang: nhìn chếch 20° thì tờ phẳng thu thành một dải dẹt; nhìn cao hơn thì gà bị nhìn từ trên
    xuống, mất dáng nghiêng của tranh. Còn tờ phẳng dựng đứng thì gà không có chỗ đứng, thóc không có chỗ rơi.
- **Tấm ván sơn** là nền `denThen` (màu xóa của canvas), không có mesh nào.
  - Tờ giấy chiếm chừng 58% bề cao của khung máy tính (đo: 58,0% ở 1280 × 800, 58,1% ở 1440 × 900 và 1920 × 1080), nằm cao hơn tâm
    khung một chút. Ở điện thoại dọc 390 × 844, khung nới theo `minWidth`: tờ giấy rộng gần hết bề ngang và chỉ cao chừng 23%
    (352 × 193 điểm ảnh CSS).
  - Phần ván tối ở trên và dưới là chỗ của tên, thơ, gợi ý và con dấu, vì chữ màu ngà đặt trên giấy sáng không đọc được.
    - Đo ở 1280 × 800: tờ giấy từ y 148 tới 612 (điểm ảnh CSS); tên tranh và dải link hết ở y 132, gợi ý bắt đầu ở y 628. Cách 16 điểm
      ảnh mỗi phía, như bảng ở §20.2; ở 1440 × 900 và 1920 × 1080 còn rộng hơn (30–81). Đo lại sau lượt CI đầu (e2e WebGL2 trên
      SwiftShader, khung 10): ở ba khung có trong bảng §20.2 (GPU thật), lệch dưới một điểm ảnh. Số của Task 4 (cách 18, 57,5%) đo
      trước các vòng sau, không còn đúng. E2e "chữ trên ván tối" giữ điều này ở năm khung máy tính (cả hai khung laptop thấp 1366 × 650,
      1280 × 720) và ở 390 × 844.
    - Chữ của trang có cỡ cố định theo điểm ảnh, còn tờ giấy co theo bề cao khung: trước vòng sau điểm duyệt ảnh, khung máy tính thấp hơn
      chừng 740 điểm ảnh CSS thì gợi ý chạm mép dưới tờ giấy (1280 × 720: chạm 3 điểm ảnh; trang của laptop 1366 × 768, chừng
      1366 × 650: tên và dải link đè 14, gợi ý đè 19). `CameraSpec.shortFrame` sửa điều đó (§20.2): canvas thấp hơn 800 thì tờ giấy chiếm
      phần nhỏ hơn của bề cao.
- **Gà mẹ** dài chừng 4, cao chừng 3,2, đứng giữa sàn, quay nghiêng sang trái. Con ong là một phần hình của đầu gà mẹ.
- **Mười gà con**, mỗi con dài chừng 1,3. Chỗ đứng ("nhà") và dáng của từng con là dữ liệu (`parts/cot-bo-cuc.js`), theo tranh gốc:
  - hai con trước mặt mẹ, hai con phía sau mẹ;
  - hai con ở xa (nằm cao hơn trong khung), hai con ở gần (nằm thấp hơn). Hai con ở xa đứng ra ngoài đầu và đuôi mẹ: camera nhìn chếch
    20° nên mặt sàn chỉ cao chừng 2,7 đơn vị trên màn, và con ở xa đứng sau lưng mẹ thì bị mẹ (cao 3,2) che hẳn;
  - một con nấp dưới bụng mẹ, một con trèo trên lưng mẹ. Bụng mẹ chỉ cách sàn 0,5 mà gà con cao chừng 1,2, nên con nấp bụng đứng sát
    bụng mẹ phía người xem, dưới cánh trái; con trèo lưng đứng trên lưng, chân chạm lưng (y 2,6). Cả hai không lún vào mẹ (test giữ).
  - Ở góc nhìn của tranh, không con nào bị che hẳn: test bắn tia qua đầu và mình từng con (§20.9).
  - Hướng lúc nghỉ của từng con là dữ liệu, như chỗ đứng. Vòng sau điểm duyệt ảnh (Task 11, Bao đồng ý) xoay hai gà con xanh cho lộ mắt
    ra người xem: con sau lưng mẹ (chỉ số 2) từ −1,9 sang −1,4 rad (trước chỉ lộ một mép mắt), con ở gần (chỉ số 6) từ 2,6 sang 1,6 (trước
    quay lưng, không thấy mắt); các con khác giữ hướng cũ. Mọi test của đàn gà (không chồng nhau, tia thấy được, chỗ núp, nhúm thóc lúc mở
    trang) vẫn qua, không sửa test nào.
- **Ánh sáng:** một hướng nắng cố định, từ trên, bên trái, phía trước.
  - Không có đèn nào của three, và không có bóng đổ (tranh Đông Hồ không vẽ bóng).
  - Không bật `renderer.shadowMap` (test giữ).
- **Trang có trăng SVG cạnh con dấu**, như ba bức trước.

### 20.2 Trải nghiệm riêng của Bức 4
- **Camera trực giao** (§20.6):
  - số thiết kế:
    - `position` [0; 6,26; 11,9], `target` [0; 1,86; −0,1]: nhìn chếch xuống chừng 20° (`position − target` = [0; 4,4; 12]); tờ giấy nằm
      cao hơn tâm khung 0,33 đơn vị, để tên tranh, dải link ở trên và gợi ý, thơ ở dưới đều nằm trên ván tối (§20.1). Điểm nhìn gần tâm gà
      mẹ, nên kéo xoay thì đàn gà quay quanh chính nó;
    - `height` 13,2, `minWidth` 15,5, `zoom` [1; 2,5];
    - số trước điểm duyệt ảnh (GĐ 8 Task 4): `position` [0; 7,2; 11,55], `target` [0; 2,8; −0,45], `height` 12, vách cao 6. Giấy chiếm 75%
      bề cao, và dải link, gợi ý đè lên giấy. Số cũ hơn, `position` [0; 6; 12], `target` [0; 1,6; 0], để giấy lệch hẳn lên trên: mép trên
      chỉ cách mép khung 0,15 đơn vị (sửa ở GĐ 8 Task 1);
    - xoay ngang ±75°; xoay dọc từ 10° tới 70° trên mặt sàn;
    - `breathe` 0: tờ tranh đứng yên;
  - không có điểm tụ: vật ở xa không nhỏ đi, chỉ nằm cao hơn trong khung, đúng lối vẽ của tranh dân gian;
  - ở khung hẹp (điện thoại dọc), xưởng nới bề cao của khung nhìn để bề ngang thấy đủ `minWidth`: tờ giấy rộng 14, cộng lề;
  - chốt ở điểm duyệt ảnh (§20.10), cả ở khung máy tính 16 : 10 lẫn 390×844.
  - **Canvas thấp** (`shortFrame: { below: 800, maxGrow: 1,3 }`, vòng sau điểm duyệt ảnh Task 11, Bao đồng ý):
    - vấn đề: chữ của trang có cỡ CSS cố định, tờ giấy luôn chiếm 58% bề cao. Trang của laptop 1366 × 768 chỉ còn chừng 1366 × 650 (thanh
      tab, thanh địa chỉ, thanh tác vụ): tên tranh và dải link đè mép trên tờ giấy 14 điểm ảnh, gợi ý đè mép dưới 19;
    - cách sửa (§8.4, xưởng, bức nào cũng dùng được): canvas thấp hơn `below` điểm ảnh CSS thì bề cao khung nhìn nhân với below / bề cao
      canvas, tới `maxGrow` lần (`fov.js#shortGrow`, `fitOrtho` lấy max với phần nới theo `minWidth`). Phần bề cao mà tờ giấy chiếm co lại
      theo bề cao canvas (58% · bề cao / 800), nên dải ván trên và dưới còn gần bằng số điểm ảnh của chúng ở 1280 × 800, chỗ của chữ.
      `stage.js` truyền bề cao canvas mỗi lần đổi cỡ; zoom (chụm ngón, tranh tự khép lại) không đổi; ba bức đầu không khai báo nên như cũ;
    - đo trên GPU thật (khung 120, khe = điểm ảnh CSS giữa chữ và tờ giấy, âm là đè; trên: tên và dải link, dưới: gợi ý):

      | Khung | Trước: trên / dưới | Sau: trên / dưới | Tờ giấy, phần bề cao |
      |---|---|---|---|
      | 1366 × 650 | −14 / −19 | 24 / 13 | 58% → 47% |
      | 1280 × 720 | 1 / −3 | 24 / 16 | 58% → 52% |
      | 1280 × 800 | 16 / 16 | 16 / 16 (không đổi) | 58% |
      | 844 × 390 (điện thoại xoay ngang) | −18 / −52 | 10 / −28 | 58% → 45% |

      Khung 1280 × 615, 1366 × 780, 1440 × 760, 1536 × 730 đo được khe 10–26; 1440 × 900, 1920 × 1080, 390 × 844 không đổi;
    - `maxGrow` 1,3: nới đủ cho canvas cao từ 615 (800 / 1,3; trang của laptop 1280 × 720 có thanh tác vụ, chừng 1280 × 595, đo được gợi ý
      còn cách 4). Không trần thì điện thoại xoay ngang nới 2,05 lần, tờ giấy còn 28% bề cao (tính), một dải nhỏ giữa ván; ở 1,3 còn 45%, tên
      tranh không đè, gợi ý đè mép dưới 28 điểm ảnh (trước là 52), như ba bức đầu cũng để chữ đè ở điện thoại xoay ngang;
    - `below` 800, không phải 760: dải ván dưới còn gần bằng ở `below`, nên `below` 760 để khe của gợi ý chỉ chừng 6 điểm ảnh từ 760
      xuống 650; ở 800 nó bằng khe đã duyệt ở 1280 × 800 (16).
- **Tranh tự khép lại** (`home: { after: 3, duration: 1,2 }`):
  - buông tay 3 giây thì camera êm êm quay về góc nhìn của tranh trong 1,2 giây, cả góc xoay lẫn zoom;
  - chạm hay kéo lại giữa chừng thì camera thôi quay về;
  - giảm chuyển động: đủ 3 giây thì camera về ngay một bước, không lượn.
- **Gợi ý** (`content.hint`): *"Chạm để rắc thóc · giữ để gà mẹ gọi con · kéo để bước vào tranh"*.
- **Hai cử chỉ** (`setup().onGesture`). Công cụ học vẫn được ưu tiên như ở mọi bức.
  1. **Chạm là rắc thóc** (`'tap'`):
     - Tia của camera trực giao cắt mặt sàn (y = 0) ở chỗ chạm. Chạm ra ngoài sàn (lên vách, ra ván) thì lấy điểm gần nhất trên sàn,
       nên chạm ở đâu cũng có phản hồi. Chạm sát mép sàn thì thóc rơi vào trong một chút (tới 1,25 theo mỗi trục: chạm đúng góc sàn thì
       chừng 1,8 theo đường chéo), đúng tâm vòng gà con đứng quanh (§20.5), để mỏ chạm sàn ngay trên nắm thóc.
     - Một nắm chừng 120 hạt (núm `handful`) văng ra từ cao chừng 3 (tầm tay), tỏa hình nón, rơi theo trọng lực, nảy một hai lần, lăn rồi
       nằm yên, thành một nắm gọn (nửa số hạt trong chừng 0,4), để các con đứng quanh mổ trúng (§20.4 lớp 5).
       - Trọng lực là của Trái Đất: 9,81 m/s², tức 98,1 đơn vị/s². Thóc chạm sàn chừng 0,25 giây sau khi văng, như rắc thật.
       - Núm `gravity` cho chọn trọng lực của trăng, để so với lá rơi của Bức 3.
     - Ba tới bốn gà con đang rảnh, ở gần chỗ rắc nhất, chạy tới. Tới nơi thì mổ quanh đó chừng 8 giây, rồi đi về chỗ của mình.
     - Mỏ đang mổ chạm hạt nào thì hạt đó biến mất (§20.4 lớp 5): nắm vơi đi thấy rõ (nắm rắc giữa sàn hay sát mép bị ăn chừng 60–80%,
       nhúm lúc mở trang chừng một nửa; sân đông, nhiều nắm cùng lúc thì chừng 45%). Hạt không con nào ăn thì nằm 30 giây rồi nhỏ dần.
     - Lớp Đàn gà mài về 0 (gà đứng như tượng, không có thóc) thì chạm và giữ không làm gì, gà mẹ vẫn bới theo đồng hồ (§20.4 lớp 5).
  2. **Giữ là gà mẹ gọi con** (`'hold-start'` → `'hold-end'`):
     - Gà mẹ xòe hai cánh, cúi đầu gọi "cục cục" theo nhịp (gật sâu nhất 23°). Mọi gà con đang rảnh chạy về tám chỗ quanh và dưới cánh mẹ; con
       trèo lưng và con nấp bụng vốn đã ở sát mẹ, nên ở yên.
     - Buông tay thì mẹ khép cánh, các con tản ra: tới chỗ rắc mới nhất nếu nắm đó mới rắc chưa tới 20 giây, không thì về chỗ của mình.
     - Camera không xoay trong lúc giữ: xưởng tắt OrbitControls khi giữ (§8.1).
  - `'swipe'` và `'double-tap'` không làm gì riêng: một lần chạm đúp là hai `'tap'`, tức hai nắm thóc. Kéo là của camera.
- **Gà mẹ bới:** không ai chạm thì cứ 25 giây gà mẹ cào chân một lần, một nhúm 24 hạt văng ra trước mặt mẹ (văng thấp, chừng 10 cm), và
  hai ba con gần nhất xúm lại. Lúc mở trang đã có sẵn một nhúm 40 hạt nằm trước mặt mẹ, gà con đang mổ.
  - Lý do: chưa ai chạm thì lớp Đàn gà vẫn có thứ để mài (test chung "mài từng lớp"), và sân gà không đứng im.
  - Giảm chuyển động: không có gà mẹ bới. Nhúm thóc lúc mở trang vẫn có.
- **Tất định:**
  - gà mẹ và gà con tính thẳng từ thời gian theo các mốc chạm, giữ, bới (§20.5);
  - thóc là mô phỏng chạy từng khung trên GPU, như đom đóm. Với `?freeze`, mô phỏng chạy lại từ khung 0, nên lần nào cũng ra như nhau.
- **Giảm chuyển động:** tranh khép lại không lượn; gà đi và chạy chậm còn một nửa; không có gà mẹ bới. Thóc vẫn rơi, vì đó là phản hồi
  của cú chạm.
- **Thơ của cả bức** (`meta.poem`, in sẵn trong HTML): *"Khôn ngoan đối đáp người ngoài / Gà cùng một mẹ chớ hoài đá nhau"* (ca dao).
  - Câu thơ hợp đúng cảnh: mười gà con cùng một mẹ.
  - Đây là hai câu lục bát, không có tiếng đệm. Truyện kể rằng hai gà trống con trong một ổ cứ đá nhau, gà bố bèn dặn câu này; Phạm Văn
    Tình dẫn truyện "Gà ông Đồ và gà ông Nghè" của Ôn Như Nguyễn Văn Ngọc (*Truyện cổ nước Nam*, NXB Khoa học Xã hội, 1990) làm gốc tích
    (qua bài báo, chưa mở được cuốn sách).
  - Đối chiếu ngày 2026-10-07 (GĐ 8 Task 13, theo lệ §18.2: nhiều nguồn, ghi dị bản, Bao chốt):
    - đúng từng chữ như trên trang ("đối đáp", "cùng một mẹ", "chớ hoài"), có nguồn xếp vào ca dao:
      - Thi Viện, "Khôn ngoan đối đáp người ngoài" (Khuyết danh Việt Nam, Ca dao về gia đình, họ hàng):
        https://www.thivien.net/Khuy%E1%BA%BFt-danh-Vi%E1%BB%87t-Nam/Kh%C3%B4n-ngoan-%C4%91%E1%BB%91i-%C4%91%C3%A1p-ng%C6%B0%E1%BB%9Di-ngo%C3%A0i/poem-EUvisw1izcoLF8u--ss-6A
        (4 nguồn tham khảo của trang bị ẩn nên không biết sách nào);
      - báo Người Đô Thị, PGS-TS Phạm Văn Tình, "Gà cùng một mẹ, chớ hoài đá nhau", 2019-03-30:
        https://www.nguoidothi.net.vn/ga-cung-mot-me-cho-hoai-da-nhau-19567.html (cùng tác giả, đăng lại ở Phật giáo, 2021-07-05);
      - VOH, Hồ Diễm Quỳnh, "Ý nghĩa câu Khôn ngoan đối đáp người ngoài; Gà cùng một mẹ chớ hoài đá nhau", 2022-06-20:
        https://voh.com.vn/song-dep/khon-ngoan-doi-dap-nguoi-ngoai-ga-cung-mot-me-cho-hoai-da-nhau-438434.html;
      - Wiktionary, mục "gà", ví dụ cho nghĩa danh từ: https://en.wiktionary.org/wiki/gà; cùng bản có ở VnDoc (Văn mẫu lớp 9) và
        VietJack ("Ý nghĩa Khôn ngoan đối đáp người ngoài…"), đều ghi "ca dao".
    - dị bản (đều lẻ tẻ, không nguồn nào in sách):
      - "đá đáp người ngoài": Thi Viện ghi làm khảo dị của chính bài trên, và một câu hỏi người dùng đăng ở hoidap247. "Đối đáp" là chữ
        của mọi nguồn có tên tác giả hay tòa soạn;
      - "gà cùng một nhà": một chỗ ở reader.com.vn; "gà chung một mẹ": báo Pháp Luật Việt Nam, Lương Thiện Nhân, "Con gà trong ca dao
        tục ngữ Việt Nam", 2017-01-29 (chỉ dẫn câu sau);
      - bản nói ngược, trêu: "Khôn ngoan đá đáp người trong, / Gà cùng một mẹ chỉ tròng nhau chơi" (Thi Viện, một bài riêng): không dùng;
      - không thấy nguồn nào in "đừng hoài", "chớ có" hay "đáp đối".
    - chưa mở được bản số hóa của các bộ sách ca dao (Kho tàng ca dao người Việt; *Tục ngữ ca dao dân ca Việt Nam* của Vũ Ngọc Phan;
      *Tục ngữ phong dao* của Nguyễn Văn Ngọc): các nguồn trên là web, nhiều bài chép lại nhau, nên số nguồn đếm được không phải số
      bản độc lập.
  - Kết luận: bản trên trang ("Khôn ngoan đối đáp người ngoài / Gà cùng một mẹ chớ hoài đá nhau") là bản có nhiều nguồn nhất và khớp
    từng chữ; khuyến nghị giữ nguyên `meta.poem` và thơ in sẵn trong trang. Ghi "Ca dao" khớp với Thi Viện và các bài báo trên. Bao
    chốt giữ nguyên câu chữ (vòng sau điểm duyệt ảnh), như GĐ 5 và GĐ 6; sau này muốn đổi thì sửa `meta.poem` rồi chạy `npm run pages`.
- **Lật tranh và Phòng tranh**, đều do `npm run pages` sinh (§19.7):
  - dải link của Bức 4 có "← Bức 3 · Cung Quế" và "Phòng tranh";
  - Bức 3 có thêm "Bức 4 · Đàn Gà Mẹ Con →";
  - Phòng tranh có bốn mục.

### 20.3 Chỉ đạo nghệ thuật
- **Không khí:** tranh dân gian của làng Đông Hồ, mộc và vui: mảng màu phẳng, nét đen đậm, giấy điệp ánh lên khi nghiêng. Không neon,
  không chuyển màu bóng bẩy.
- **Không gắn với lễ hội** (giữ giả định ở §1): tranh Đông Hồ thường treo dịp Tết, nhưng bức không có câu đối, pháo hay chữ chúc Tết.
- **Năm màu tự nhiên của Đông Hồ**, thêm vào bảng qua `meta.palette` (hex chốt ở lượt màu):

  | Token | Màu | Làm từ | Hex thiết kế | Hex chốt (lượt màu, GĐ 8 Task 11) |
  |---|---|---|---|---|
  | `diep` | trắng điệp | bột vỏ sò điệp trộn hồ, quét lên giấy dó | `#EFE6D2` | `#EFE6D2` |
  | `hoe` | vàng | hoa hòe | `#E0AC3A` | `#D08E2A` |
  | `sonSoi` | đỏ son | sỏi son | `#B9472E` | `#994533` |
  | `xanhDong` | xanh | lá chàm, gỉ đồng | `#41705F` | `#3F6358` |
  | `muc` | đen | than lá tre | `#221E1A` | `#272C2C` |

  - Hex thiết kế là màu người xem phải thấy. Hex chốt là màu VÀO: Phủ bóng của Bức 4 dùng ACES (§20.4 lớp 6), làm màu in đậm và sáng hơn
    (hex thiết kế hiện ra vàng chanh, đỏ cam), nên bốn màu in chốt ở số mà qua ACES, lộ sáng 1,2 và LUT 0,45, nấc sáng hiện ra đúng hex
    thiết kế (tính ngược bằng mô hình JS của chuỗi Phủ bóng, đo lại trên GPU thật). Mực lạnh hơn vì LUT nhuộm vùng tối sắc nâu cánh gián:
    ra đen than (34, 30, 26), không đen kịt (23, 15, 9 nếu giữ `#221E1A`). Giấy giữ hex thiết kế.
  - Sơ đồ của Sổ tay chỉ dùng màu của bảng đã ghép (test hợp đồng), nên dùng hex chốt.

  - Gà mẹ: mình `hoe`; cánh `sonSoi`; đuôi `xanhDong`; mào và mảng cổ `sonSoi`; mỏ và chân `hoe`; con ong `hoe` (thân và cánh).
    - Mắt (gà mẹ và mọi gà con) `diep`, như mắt khắc trên ván: vòng mắt và con ngươi là nét trong của Bản nét (GĐ 8 Task 5), nên mắt đọc
      được trên mọi màu lông, cả gà con đen lẫn gà con trắng.
    - Mảng cổ (`NECK`, GĐ 8 Task 11; Bao chọn ở điểm duyệt ảnh của Task 4): Bản màu tô theo phần (`part`), mà cổ là chỗ đầu nối mình,
      nên mảng cổ là một phần riêng của hình: một cầu bán kính 0,55 đặt ở vòng giao của đầu và mình (vòng tâm (0; 2,38; 1,29) trong khung
      của mẹ, bán kính chừng 0,39). Cầu to hơn vòng ấy nên ló ra khỏi cả đầu lẫn mình thành một dải đỏ son quanh chỗ đầu nối mình, rộng
      nhất ở gáy, hẹp dần về cổ họng; Bản nét có sẵn nét gấp ở hai mép dải (chỗ cầu cổ gặp đầu và mình). Mảng cổ đi theo đầu (như mọi
      phần từ HEAD trở lên), mà tâm cầu gần khớp cổ nên đầu gật thì nó gần như đứng yên. Trước đó (GĐ 8 Task 4) không có mảng cổ.
    - Nét `muc` trên đuôi và vằn của con ong là nét trong của Bản nét (GĐ 8 Task 5), không phải màu in.
  - Gà con: mỗi con một màu như tranh gốc (`hoe`, `sonSoi`, `xanhDong`, `muc`); có con "trắng", tức để màu giấy và chỉ có nét.
  - Con ong: `hoe` có vằn `muc` ở thân; cánh ong là phần riêng (`BEE_WING`), không có vằn. Thóc: `hoe`. Nét: `muc`. Giấy: `diep`.
  - LUT "sơn mài" sinh từ bảng đã ghép như mọi bức. Năm token mới không đổi LUT, vì LUT chỉ đọc `canhGian`, `vangLa`, `cham`.
- **Thứ tự in của làng quyết thứ tự lớp:** màu in trước (đỏ, xanh, vàng, trắng), bản nét đen in sau cùng (§20.4).
- **Dáng:** khối tròn, mập, như tượng đất rồi in màu. Mỏ, mào, đuôi là khối đơn giản. Không tả từng sợi lông: lông chỉ có ở nét trong.
- **Poster:**
  - chụp từ cảnh bằng `scripts/poster.js dan-ga-me-con`, ở góc nhìn của tranh;
  - `poster.capture` chốt ở lượt màu: một khung có gà con đang mổ nhúm thóc;
    - (GĐ 8 Task 11) Chốt `{ at: '2026-10-05T21:00', freeze: 240 }` (4 giây): gà con đỏ và vàng cúi mổ nhúm thóc lúc mở trang, gà con đen bên
      phải quay nghiêng thấy mắt. Đã thử khung 120, 240, 360: khung 120 gà con đen quay lưng thành một khối đen; khung 360 gần như khung 240.
      Poster 87 KB (WebP, chất lượng 0,88), og 58 KB;
    - (vòng sau điểm duyệt ảnh) chụp lại ở cùng khung sau khi đổi hướng hai gà con xanh (§20.1): poster cũ cho thấy hai con quay đi, nên
      lúc poster hòa sang cảnh hai con ấy quay đầu. Poster 87 KB (WebP 0,88), og 58 KB;
  - `poster.alt`: "Tranh Đông Hồ đàn gà mẹ con trên giấy điệp, đặt trên ván sơn đen: gà mẹ ngậm con ong, mười gà con quây quần.".
- **Lượt màu:** đo như §5 (độ sáng trung bình, độ bão hòa, tỉ lệ điểm tối; 1280×800 và 390×844; GPU thật). Đo thêm:
  - tỉ lệ điểm ảnh của giấy (sáng hơn 200);
  - độ ngà của giấy (kênh đỏ hơn kênh lam).

  AgX của Phủ bóng nén vùng sáng, nên giấy có thể ngả xám. Chỉnh `exposure`, hay chọn tone khác của Phủ bóng, trong lượt màu. Bao duyệt
  ảnh.
  - (GĐ 8 Task 11. Đo 2026-10-07, Mac M2, WebGPU, `?freeze=120&poster&level=cao`, DPR 1. Độ sáng là luma Rec. 709, 0–255; độ bão hòa
    HSV; điểm tối là kênh lớn nhất < 30. Giấy: vách bên trái gà mẹ, không có gà. Mảng in: mình gà mẹ trên cánh, cánh gà mẹ, gà con xanh
    ở gần, trung bình cả vảy lông và hai nấc. Mực: điểm có luma < 60 quanh bốn gà con bên trái. Ván sát: dải ván 3–20 điểm ảnh quanh tờ
    giấy, độ sáng lớn nhất.)

    | Đo | 1280×800 trước | 1280×800 sau | 390×844 trước | 390×844 sau |
    |---|---|---|---|---|
    | Cả khung: sáng · bão hòa · tối | 68,7 · 0,50 · 61,4% | 78,3 · 0,39 · 61,5% | 37,9 · 0,59 · 79,1% | 42,3 · 0,44 · 79,2% |
    | Giấy: RGB · luma > 200 · ngà (R − B) | 196, 187, 168 · 0,1% · 28 | 229, 219, 198 · 100% · 31 | 196, 187, 168 · 0% · 28 | 229, 219, 198 · 100% · 31 |
    | Mình gà mẹ: RGB · bão hòa | 189, 156, 93 · 0,51 | 214, 162, 56 · 0,74 | 189, 155, 92 · 0,51 | 214, 160, 56 · 0,74 |
    | Cánh gà mẹ | 180, 90, 65 · 0,64 | 178, 66, 44 · 0,75 | 180, 91, 66 · 0,63 | 179, 67, 44 · 0,75 |
    | Gà con xanh | 79, 108, 92 · 0,28 | 60, 97, 82 · 0,38 | 75, 98, 83 · 0,28 | 57, 89, 74 · 0,34 |
    | Mực (RGB) | 57, 39, 28 | 53, 41, 34 | 58, 41, 30 | 51, 42, 34 |
    | Ván sát (độ sáng lớn nhất; ván xa chừng 2–3) | 18 | 8 | 27 | 11 |

    "Trước" là khi đã có lề không lóe quanh mép và mảng cổ (hai commit trước lượt màu). Trước hai việc ấy (7bf91a1) các số gần như vậy
    (lệch tới 3/255; cả khung 69,0 · 0,50 · 61,3% ở 1280×800), trừ ván sát: 80 ở 1280×800, 47 ở 390×844.
  - Trước: giấy xám be, năm màu in nhạt như phấn (AgX nén vùng sáng và kéo màu về xám), mực nâu. Bão hòa của cả khung giảm sau lượt màu
    vì ván (hơn 60% khung) từ nâu đen thành đen dưới ACES; bão hòa của mảng in tăng (mình gà mẹ 0,51 → 0,74).
  - Đổi: Phủ bóng ACES, lộ sáng 1,2, bloom 0,5 (§20.4 lớp 6); bốn màu in theo bảng trên. Đã thử: AgX lộ sáng 1,6 (giấy 214, 205, 184,
    màu in vẫn nhạt); không tone mapping (màu in đúng hex, nhưng hạt điệp nào cũng cháy trắng, giấy lấm tấm khắp nơi, vệt chổi gắt); ACES
    với hex thiết kế (vàng chanh, đỏ cam). Lộ sáng 1,0 và 1,1 cho giấy 222 và 226: chọn 1,2 cho giấy sáng mà chưa cháy trắng.
  - Giữ: `ban-mau.shade` 0,18 (hai nấc phân biệt mà vẫn phẳng); `giay-diep` `sparkle` 1,2, `density` 14, `fiber` 0,5, `brush` 0,6 (hạt lóe
    nhẹ, vệt chổi và sợi dó vừa thấy); LUT, grain, vignette của Phủ bóng.

### 20.4 Sáu lớp
**Một công thức tô cho mọi vật**, như `recipe` của Bức 3 (§19.4). Cốt công bố `shared.cot.recipe`: các hàm JS dựng node từ "điểm tô"
`s = { kind, part, n, uv, pos, pigment }` (loại vật, phần của vật, pháp tuyến, UV, vị trí, chỉ số màu). Lớp sau bọc hàm của lớp trước
TRƯỚC khi biên dịch:
- `base(s)`: đất sét dưới đèn xưởng (Cốt);
- `fill(s)`: màu in và nấc sáng (Bản màu);
- `ink(s)`: nét bên trong vật (Bản nét);
- `paper(s)`: giấy dó, điệp (Giấy điệp); `glint(s)`: emissive của hạt điệp.

Cách ghép:
- màu cuối của một vật in màu là `mix(base, fill, w2)`, rồi `mix(…, muc, ink · w3)`;
- màu của tờ giấy là `mix(base, paper, w4)`;
- mọi trọng số bằng 0 thì về đất sét (luật 1 của §0).

Material của các mesh là lớp gốc `NodeMaterial` như Bức 3: `lights = false`, nên màu ra là `colorNode` cộng `emissiveNode` (Phụ lục A.81;
hạt điệp lóe đi ra qua `emissiveNode` của tờ giấy, lớp 4). Thóc dùng
`SpriteNodeMaterial` (lớp 5). Mọi material gán `emissiveNode` tường minh.

#### Lớp 1 · Cốt (`layers/l1-cot.js`)
- **Thấy gì:** tờ giấy cong, gà mẹ (mình và hai cánh), mười gà con, trên nền ván đen. Camera trực giao.
  - Tất cả là đất sét dưới đèn xưởng.
  - Đèn xưởng viết trong shader: một hướng sáng cộng một phần sáng đều, như `HemisphereLight` của hai bức đầu.
- **Kỹ thuật:**
  - **Hình gà** ghép từ khối cơ bản (cầu kéo dãn, nón, trụ) thành một `BufferGeometry` (`parts/cot-hinh-ga.js`). Mỗi đỉnh mang thuộc tính
    `part` (mình, đầu, mỏ, mào, cánh, đuôi, chân, mắt, thân ong, cánh ong, và mảng cổ của gà mẹ từ GĐ 8 Task 11), để Bản nét vẽ nét
    trong và để đầu cúi được.
    Bảng khối của gà con (`CHICK_SHAPE`) và gà mẹ (`HEN_SHAPE`) nằm ở đó; số chốt ở điểm duyệt ảnh (GĐ 8 Task 4).
    - Mắt là cầu lún vào đầu, chỉ ló ra một chỏm (chừng 55° quanh hướng từ tâm đầu ra tâm mắt ở gà con, 60° ở gà mẹ). Cầu mắt xoay cho
      cực trên (uv.y = 1) nằm giữa chỏm, nên Bản nét vẽ vòng mắt và con ngươi theo góc tính từ cực ấy (GĐ 8 Task 5).
    - Cốt công bố `shared.cot.hen.bodyFrame`: ma trận đưa điểm thế giới về khung của khối mình gà mẹ (mặt khối là cầu đơn vị), ở dáng
      nghỉ, và `shared.cot.hen.bodyRadius` (GĐ 8 Task 9): uniform `henBodyRadius` = cos(π/n), n là số vòng quanh của khối mình; núm
      `segments` đổi số này, không biên dịch lại. Hai thứ này cho viền cánh của Bản nét (lớp 3).
    - Cốt công bố `shared.cot.pose(state, k)` (GĐ 8 Task 8): lớp Đàn gà gọi mỗi khung với trạng thái của đàn gà và k là trọng số của nó.
      Cốt hòa từ dáng nghỉ (nhà, hướng của bố cục, đầu ngẩng) tới dáng của đàn gà theo k (hướng đi đường ngắn nhất), ghi `pose`, `head` và
      đặt `needsUpdate`, rồi đặt bốn uniform của gà mẹ bằng góc của đàn gà nhân k. Chưa có lớp Đàn gà thì gà đứng ở dáng nghỉ ghi lúc dựng.
  - **Mười gà con** là MỘT `InstancedMesh`, ma trận instance giữ đơn vị, `frustumCulled = false` (vị trí thật chỉ có trong shader), như lá
    của Bức 3. Mỗi con mang ba thuộc tính instance riêng:
    - `pose` (x, y, z, hướng) và `head` (góc cúi, 0–1): lớp Đàn gà ghi mỗi khung, nên dùng `instancedDynamicBufferAttribute`;
    - `pigment` (chỉ số màu): ghi một lần lúc dựng, usage mặc định.

    `positionNode` xoay đầu (mọi phần từ HEAD trở lên) quanh trục ngang qua TÂM MÌNH (y 0,48), không qua cổ: quanh cổ thì mỏ không với
    tới sàn. Cúi hẳn (`headDown` = 60°) thì đầu mỏ hạ từ y 0,86 xuống chừng 0. Rồi cả con quay theo hướng, dời tới chỗ trong `pose`, và
    `normalLocal` xoay theo để nấc sáng đúng với đầu đã cúi. `beakTip(k)` (`parts/cot-bo-cuc.js`) tính đầu mỏ bằng cùng phép xoay.
  - **Gà mẹ** là ba mesh trong một `Group` (vật `ga-me`): mình (kèm đuôi, chân, đầu, mỏ, mào, mắt, con ong) và hai cánh. Geometry đã
    xoay, dời sẵn tới chỗ của mẹ, nên `positionNode` làm ở tọa độ thế giới, với bốn uniform dáng (radian) mà lớp Đàn gà ghi (§20.5):
    - `henNod`: đầu gật quanh trục ngang qua cổ; `henLook`: ngoảnh quanh trục đứng qua cổ;
    - `henScratch`: chân trái (phía người xem) đá ra sau quanh hông;
    - `henWing`: mỗi cánh xoay ± góc này quanh trục vai (theo hướng trước của mẹ), nên góc dương xòe cả hai cánh.

    Ba mesh đều dời đỉnh trong shader, nên `frustumCulled = false`.
  - **Tờ giấy** (`parts/cot-giay.js`) là một lưới cong (sàn, chỗ uốn, vách). UV chạy theo chiều dài cung, nên thớ giấy không bị kéo dãn
    ở chỗ uốn.
  - Góc nhìn của tranh (`CAMERA`) nằm trong `parts/cot-bo-cuc.js`; `painting.js` và lớp này cùng đọc.
- **Núm:** `segments` (độ mịn của khối, dựng lại), `wireframe` (bool, dựng lại).
  - `segments` mặc định và tối đa theo mức (§20.8: cao 32 và 48, vừa 28 và 32, thấp 24 và 32): số vòng của mỗi khối là `segments` ×
    `detail` của khối. Ở 32, hai mặt kề nhau của mọi khối gãy dưới 20°, dưới góc Bản nét bắt đầu in nếp gấp (chừng 21°, lớp 3): mình gà mẹ
    (cầu kéo dãn) 18,6°, mình gà con 14°, đầu 11,3°.
  - Ở 28 (mức vừa) mình gà mẹ và mào tới 21,3°, ngay ngưỡng: không thấy vệt nào, kể cả khi phóng to. Ở 24 (mức thấp) 24,3–24,6°: còn
    vệt mực rất nhạt ở ngực và cuối mình gà mẹ khi phóng to trên máy tính; ở cỡ điện thoại (gà mẹ chừng 100 điểm ảnh, DPR 1,25) không
    phân biệt được với 32. Từ 20 trở xuống vòng mặt đa diện thành nét rõ (GĐ 8 Task 9, chụp trên GPU thật).
  - Khối dẹt gãy gắt ở vành: cùng 32 vòng thì cánh gà mẹ 39,7°, cánh gà con 31,4°, mào 36,3° (16 vòng), bàn chân 69,8° (16 vòng), và vành
    của chúng thành sọc mực khi phóng to. Vì vậy chúng có nhiều vòng hơn: cánh mẹ 2,25 lần, cánh con 1,75, bàn chân 2,25, mào và ong 1.
  - Riêng cánh ong mỏng 0,09 lần: vành luôn gãy gắt (95° ở 32 vòng), và thành nét viền của cánh.
  - Lưới giữ index, nên mỗi đỉnh chạy `positionNode` một lần. Ở 32, cả cảnh có chừng 86 nghìn đỉnh, 149 nghìn tam giác (28: 114
    nghìn, 24: 83 nghìn, 48: 337 nghìn; §20.8; tính cả mảng cổ của GĐ 8 Task 11).
- **Thí nghiệm "Tấm bìa phẳng"** (`biaPhang`):
  - dẹt từng con gà quanh tâm của nó, theo hướng nhìn của tranh, còn 5%;
  - ở góc nhìn của tranh, ảnh gần như không đổi; kéo xoay mới thấy gà chỉ là tấm bìa;
  - bài học: phép chiếu trực giao bỏ hẳn chiều theo hướng nhìn, nên ảnh nhìn thẳng không phân biệt được tượng tròn với tấm bìa phẳng;
  - làm bằng uniform trong `positionNode`, không biên dịch lại. Pháp tuyến giữ nguyên, nên nấc sáng không đổi.
- **Số đo:** `goc`, góc lệch của camera khỏi góc nhìn của tranh (độ, một số lẻ), đọc từ `ctx.camera` (`viewAngle` của `parts/cot-bo-cuc.js`).
  Là góc 3D giữa hướng từ điểm nhìn tới camera và hướng của tranh, nên xoay ngang 30° ra chừng 28°, không phải 30° (camera nhìn chếch xuống
  nên đi trên một vòng nhỏ hơn). E2e đọc nó để kiểm tranh tự khép lại.
- **Vật:** `giay`, `ga-me`, `ga-con`.

#### Lớp 2 · Bản màu (`layers/l2-ban-mau.js`)
- **Thấy gì:** gà từ đất sét thành mảng màu in. Ánh sáng chỉ còn vài nấc phẳng.
- **Kỹ thuật:**
  - màu lấy theo `part` và chỉ số màu, từ bảng màu của bức (`parts/ban-mau-bang.js`, đọc `ctx.palette`):
    - hai `uniformArray` màu, một theo phần (màu của gà mẹ, và phần không phải lông của gà con), một theo con (`pigment`); một mảng cờ
      "lông" theo phần: mình, đuôi, cánh, đầu của gà con theo màu của con, còn chân, mỏ, mắt theo bảng của gà mẹ;
    - chỉ số làm tròn rồi mới đổi sang số nguyên (`int(x + 0,5)`): `part`, `pigment` tới fragment shader qua nội suy, có thể lệch khỏi số
      nguyên một chút;
  - **chia nấc (cel shading):** `l = max(dot(n, nắng), 0)`, `x = l · bands`. Bậc `k = floor(x) + smoothstep(1 − soft, 1, fract(x))`, mép
    mềm trong `soft = max(fwidth(x) + edge, 10⁻³)` (chống răng cưa, rồi mềm thêm theo núm). `q = min(k, bands − 1) / max(bands − 1, 1)`;
    `bands` = 1 thì `q` = 1 (phẳng hẳn). Nấc sáng nhất là đúng màu in (`q` = 1); công thức cũ `floor(l · bands) / bands` không bao giờ tới
    1. Màu ra là `màu in · mix(1 − shade, 1, q)`: nấc tối sáng bằng `1 − shade` lần nấc sáng;
  - mặc định 2 nấc, nấc tối chỉ đậm hơn 18%: ở góc nhìn của tranh gần như phẳng như bản in, xoay đi mới thấy khối.
- **Núm:** `bands` (1–4), `edge` (độ mềm của mép nấc), `shade` (độ đậm của nấc tối).
- **Thí nghiệm "Tô mịn"** (`toMin`, kiểu so): ánh sáng liền (Lambert) thay cho chia nấc. Hai cột "Tắt / Bật" cho thấy chia nấc gần như
  không tốn gì.
- Không có vật riêng.

#### Lớp 3 · Bản nét (`layers/l3-ban-net.js`)
- **Thấy gì:** nét mực đen bao quanh mọi vật, khung tranh ở mép giấy, và nét lông, cánh, mắt bên trong.
- **Viền** (`post.build`, `parts/ban-net-do-canh.js`): dò cạnh trên ảnh độ sâu.
  - Với camera trực giao, `channel('depth')` là chính texture độ sâu, tuyến tính sẵn (§20.6, Phụ lục A.89–A.90). Vì vậy lấy mẫu ở điểm
    lân cận được mà không tốn lượt vẽ nào.
  - Độ sâu đổi ra đơn vị cảnh bằng near, far của `ctx.camera`, qua uniform đặt từ JS. Trong post, `cameraNear` của TSL là của camera vẽ
    quad, không phải camera của cảnh (Phụ lục A.93).
  - Lấy mẫu trên lưới 3×3 (chín lần đọc), mỗi bước `lineWidth` điểm ảnh. Mỗi hướng trong bốn hướng (ngang, dọc, hai chéo) tính **độ lệch
    khỏi mặt phẳng** `e = D(+) + D(−) − 2·D(giữa)`, với D là độ sâu theo đơn vị cảnh:
    - trên MỌI mặt phẳng, dù nghiêng tới đâu, `e = 0`;
    - bậc độ sâu cao H (mép vật trước nền, vật trước vật) cho `|e| ≈ H`. `e > 0` nghĩa là điểm giữa nằm trên vật ở trước: nét chỉ vẽ phía
      đó, như nét viền của vật; `e` từ `threshold` trở lên thì đậm hẳn;
    - nếp gấp dù không có bậc (cổ nối mình, cánh áp thân): **góc gãy của mặt** `atan(s₊ − s₋, 1 + s₊·s₋)`, với s₋, s₊ là độ dốc của độ
      sâu hai bên điểm giữa (hiệu độ sâu chia độ dài thật của bước; hướng chéo dài hơn √2 lần). Từ chừng 21° bắt đầu thành nét, từ 34°
      đậm hẳn; độ đậm nhân `crease`. Bậc lớn đã là viền thì không tính lại, để phía sau của bậc không dày thêm.
    - Vì sao đo góc chứ không đo hiệu độ dốc (`|e|` chia độ dài bước, cách của GĐ 8 Task 1): gần mép khối, mặt nghiêng gần 90° so với màn,
      độ dốc rất lớn, nên hai mặt kề nhau của khối cầu đa diện, dù chỉ gãy 11–15°, cũng chênh độ dốc quá ngưỡng. Vòng mặt đa diện thành
      nét bên trong viền (thấy trên GPU thật ở DPR 2, GĐ 8 Task 4). Góc thì không phụ thuộc mặt nghiêng bao nhiêu: mặt kề nhau của khối gãy
      dưới 20° ở 32 vòng (mức cao; lớp 1, `segments`), còn chỗ nối thật gãy nhiều hơn.
    - Góc ở chỗ nối, đo dọc đường giao của hai mặt (góc giữa hai pháp tuyến): đầu vào mình 92–123°, mào 87–90°, chân 68–102°, mỏ 42–60°,
      mắt 48–51°, đuôi 34–69°, cánh gà con 52–90°. Riêng cánh gà mẹ áp sát sườn: có đoạn chỉ gãy 13–20° (giữa 32°), nên ảnh độ sâu không
      có nét ở chỗ cánh nằm sát sườn. Nét trong vẽ viền cánh ở đó (ở dưới).

    Vì sao không dùng Sobel trên độ sâu: ở góc nhìn của tranh, độ sâu của mặt sàn đổi chừng 0,02 đơn vị mỗi điểm ảnh (khung cao 13,2 trên
    1600 điểm ảnh thiết bị, nhìn chếch 20°); kéo xuống góc thấp nhất và ở DPR 1 thì gấp bốn. Độ dốc của Sobel trên mặt sàn khi ấy vượt
    ngưỡng của một bậc thật, và cả mặt sàn thành nét đen. Độ lệch khỏi mặt phẳng thì bằng 0 trên mọi mặt nghiêng, nên chỉ bậc thật thành
    viền; nếp gấp đo riêng bằng góc gãy (ở trên), cũng không bị mặt nghiêng đánh lừa.
  - Mọi mẫu nằm đúng **tâm một điểm ảnh**, cách điểm giữa một số NGUYÊN điểm ảnh: bước là `lineWidth` (núm chỉ có số nguyên; shader
    vẫn làm tròn, tối thiểu 1), lệch bản cũng làm tròn. Texture độ sâu không lọc được, nên three đọc điểm ảnh gần nhất (Phụ lục
    A.96): bước 1,5 điểm ảnh rơi đúng mép giữa hai điểm ảnh, hai mẫu không còn đối xứng, và mặt sàn nghiêng thành sọc mực (đã thấy
    trên GPU thật, GĐ 8 Task 1).
  - Mép tờ giấy cũng là một bậc độ sâu (giấy đứng trước khoảng trống), nên khung tranh tự có nét.
  - Thóc không ghi độ sâu (lớp 5), nên không bao giờ thành chấm đen.
  - **Mẫu ngoài khung bị bỏ:** cả hai backend đọc điểm ảnh ở mép cho mẫu ngoài khung (Phụ lục A.99). Mẫu ấy trùng điểm giữa thì mặt sàn
    nghiêng ra góc gãy 70°, và hàng sát khung thành vệt mực giả khi phóng to tới mức tờ giấy chạm khung (hay khi xoay tranh). Cặp mẫu nào
    có một mẫu, hay điểm giữa, nằm ngoài texture thì bỏ cả cặp: vẫn chín lần đọc, chỉ nhân 0.
- **Nét trong** (`recipe.ink`, `parts/ban-net-net-trong.js`): hàm khoảng cách 2D trên UV của từng phần, chỉ trên gà (tờ giấy, thóc không
  có). Nét dày theo đơn vị cảnh (chừng 0,025, tức 3 điểm ảnh ở DPR 2), nên to ra khi zoom.
  - **Mép mềm của nét** (GĐ 8 Task 8): 0,3 nửa bề dày, nhưng không mỏng hơn một điểm ảnh (`fwidth` của khoảng cách tới nét), đặt quanh
    0,85 nửa bề dày (chỗ mép mềm của bản đầu). Ở DPR 1 (máy tính thường, mức thấp, khung e2e) nét dài mảnh hơn một điểm ảnh: không có sàn
    này thì nét đứt thành vạch nhấp nháy khi gà chạy (thấy trên GPU thật); có sàn thì thành nét mềm liền. Mép mềm đặt quanh 0,85 chứ không
    lùi vào trong (plan: `smoothstep(half − soft, half, d)`) để ở DPR 2 nét vẫn dày như bản đầu đã duyệt ảnh. Chỗ khoảng cách nhảy (đường
    nối hai hàng vảy) `fwidth` vọt lên, nhưng ở đó khoảng cách lớn ở cả hai phía nên không thành vệt.
  - **Vảy lông** (mình): hàng cung võng xuống, như vảy cá, hàng trên lệch nửa ô; ở nửa trên của mình (uv.y 0,55–0,88). Gà mẹ 14 cột quanh
    mình và 8 hàng từ chân lên đỉnh, gà con 8 và 6: ở giữa sườn mỗi hàng cao chừng nửa bề rộng một cột, nên mỗi cung là nửa vòng tròn và
    đáy cung chạm chỗ hai cung của hàng dưới gặp nhau.
  - **Mắt:** vòng có chấm trên chính cầu mắt, quanh cực của nó (lớp 1): con ngươi dưới 22° tính từ cực, lòng trắng tới 40°, vòng mực từ
    40° ra tới mép chỏm. Không đặt theo hướng nhìn của tranh: mắt chỉ là chỏm ló ra khỏi đầu, mà ở góc của tranh, điểm của cầu mắt quay
    về người xem nằm lệch mép chỏm ở gà mẹ và gà con nấp bụng (chỏm lệch 39°), và nằm hẳn trong đầu ở hai gà con quay đi (56°, 78°; một con
    lông đen). Con ngươi theo hướng nhìn thì mất ở hai con ấy, vòng theo hướng nhìn thì bị đầu cắt. Vòng có chấm trên chính mắt thì con nào
    cũng có, chỉ nghiêng đi như hình tròn vẽ trên mặt nghiêng. Mắt luôn đậm (không nhân mực không đều): mắt gà con chỉ chừng 9 điểm ảnh ở
    DPR 2.
  - **Cánh:** ba nét lông song song mép, ở nửa dưới phía sau (bầu dục ρ = 0,55, 0,72, 0,88 của cầu dẹt nhìn từ bên). Gà mẹ có thêm viền:
    mép riêng của cánh (ρ = 1), và chỗ cánh lún vào sườn, đo bằng khoảng cách từ hình ở dáng nghỉ (`positionGeometry`) tới mặt khối mình
    (`shared.cot.hen.bodyFrame`). Dọc lưng và phía sau, mép riêng của cánh nằm trong mình; mép thấy được là chỗ mặt cánh chui vào sườn
    (ρ chừng 0,88–0,94), nên viền vẽ ở mép riêng của cánh không thấy được ở đó. Gà con không có viền: cánh con đứng ra khỏi mình, đã có viền
    dò trên độ sâu.
    - Khối mình là đa diện (GĐ 8 Task 9): đỉnh nằm trên mặt bầu dục thật, mặt phẳng giữa các đỉnh lõm vào trong, sâu nhất
      1 − cos(π/n)·cos(π/2m) ở tâm mặt (n vòng quanh, m vòng từ chân lên đỉnh). Đo tới mặt thật thì nét nằm ngoài chỗ cánh chui vào mình đa
      diện: một dải màu cánh giữa nét và sườn, 1–2 điểm ảnh ở 32 vòng, 3–5 ở 24, hơn chục ở 8 (phóng to 2,5 lần, DPR 2, GPU thật).
    - Vì vậy nét đo tới mặt co lại `bodyRadius` = cos(π/n) lần (tâm cạnh của một vòng, lớp 1), và dày thêm đúng độ co (`sag`, cùng cách
      xấp xỉ bậc một). Mép ngoài của nét vẫn ở chỗ cũ, mép trong với tới tâm các mặt: nét chạm sườn ở mọi số vòng, từ 8 tới 48.
    - Chỉ co lại mà không dày thêm thì nét mảnh đi một nửa, và có chỗ gần đứt ở hàng đỉnh, nơi mặt đa diện chạm mặt thật.
  - **Đuôi:** các nét dọc nón đuôi, chụm lại ở chóp (gà mẹ năm nét ở mặt quay ra người xem, gà con hai).
  - **Con ong:** ba vằn quanh trục dài của thân ong; cánh ong (`BEE_WING`) không có vằn.
- **Mực không đều:** độ đậm của nét nhân `1 − 0,3·smoothstep(0; 0,6; n)` với n là một noise thưa: phần lớn nét đậm hẳn, chỗ n cao mực mỏng
  còn 70%, như chỗ ván ăn ít mực. Nét trong lấy noise theo hình gốc của gà (`positionGeometry`, cộng chỉ số màu), nên vết mực đi theo con gà
  khi nó cúi, chạy; viền lấy noise 2D theo điểm ảnh của màn, vì hậu kỳ không biết điểm ảnh thuộc vật nào, và chỉ tính ở điểm ảnh có mực
  (nhánh `If`): tính cho mọi điểm ảnh thì tốn chừng 3 ms mỗi khung ở 2560 × 1600, DPR 2 (Mac M2).
- **Lệch bản** (`misregister`): bản nét in lệch xuống phải so với bản màu, như tờ giấy trượt khi in tay. Hướng trên màn (0,82; 0,57) (x
  sang phải, y xuống, như `screenUV`) nhân với núm rồi làm tròn tới số nguyên điểm ảnh: 2 là (2, 1), 6 là (5, 3). Điểm ảnh đọc ảnh độ sâu
  ở phía ngược lại, nên viền ở chỗ Q hiện ra ở Q + lệch. Nét trong nằm trong màu của vật nên không lệch theo; ở 1–2 điểm ảnh thì gần như
  không thấy.
- **Chỉ chạy với camera trực giao.** Bức dùng camera phối cảnh mà muốn nét như thế thì bọc độ sâu bằng `convertToTexture`, tốn thêm một
  lượt vẽ.
- **Núm:** `lineWidth` (1–3 điểm ảnh thiết bị, bước 1, mặc định 2: chỉ số nguyên, vì mẫu độ sâu phải cách nhau số nguyên điểm ảnh),
  `threshold` (bậc độ sâu tối thiểu, đơn vị cảnh; mặc định 0,3, tức 3 cm), `crease` (độ đậm của nét nếp gấp, 0–1), `misregister`
  (0–6 điểm ảnh thiết bị, bước 1, mặc định 2: số nguyên như `lineWidth`, vì độ sâu đọc ở tâm điểm ảnh; shader vẫn làm tròn).
- **Thí nghiệm** (chỉ đổi uniform, không biên dịch lại):
  - "Chỉ bản nét" (`chiNet`): màu in của mọi thứ in màu (gà, thóc) thành trắng giấy, chỉ còn nét đen, như bản nét in riêng trước khi in
    màu. Bọc `recipe.fill`
    bằng `mix(fill, diep, chiNet · w3)`: Bản nét về 0 thì màu in trở lại, nên mọi trọng số bằng 0 vẫn về đất sét;
  - "Dò cạnh theo màu" (`netTheoMau`): Sobel trên độ sáng của ảnh màu (scene pass) thay cho độ sâu, cùng lưới, bước và lệch bản. Nét mọc ở
    ranh của nấc sáng và hai bên nét trong, và mất ở chỗ hai mảng cùng màu chồng nhau (đầu gà mẹ trước mình, cùng vàng hòe). Tám mẫu màu
    nằm trong nhánh `If` theo uniform của thí nghiệm, nên lúc tắt không đọc thêm texture nào. Độ sáng của mỗi mẫu kẹp ở 1 (GĐ 8 Task 11):
    ảnh của scene pass là HDR, hạt điệp lóe sáng chừng 15 lần giấy, nên không kẹp thì mỗi hạt lóe thành một vòng mực đậm. Kẹp rồi vẫn còn
    một chấm mực nhỏ ở mỗi hạt đang lóe, vì sáng hơn giấy là một ranh màu thật (thấy trên GPU thật); chữ của thí nghiệm nói điều này.
- **Tap:** `truoc-net` (ảnh trước khi có viền).
- Không có vật riêng.

#### Lớp 4 · Giấy điệp (`layers/l4-giay-diep.js`)
- **Thấy gì:** tờ giấy từ đất sét thành giấy dó quét điệp: màu ngà, sợi dó, vệt chổi lá thông chạy xiên. Hạt điệp lấp lánh khi xoay tranh.
- **Màu giấy** (`parts/giay-diep-mat.js#paperColor`, theo UV của tờ giấy, đơn vị cảnh): `mix(nền dó, điệp, lớp điệp) · (1 − sợi)`. Không có
  phần ánh sáng nào: tranh in phẳng, chỗ uốn chỉ hiện ra ở hình dạng và ở hạt điệp.
  - nền dó là `diep` nhân 0,82; lớp điệp là đúng `diep`, nên điệp sáng và ngà hơn nền;
  - **sợi dó:** `fbm` (`lib/tsl/noise.js`) kéo dài theo chiều dài cung (tần số 16 theo u, 1,2 theo v), nên sợi chạy dọc tờ giấy. Số tầng là
    node (một uniform, theo mức), nên nấc `chi-tiet` đổi nó mà không biên dịch lại. Nhân với `0,3 · fiber`: biên độ 0,06 của bản đầu
    chỉ lệch chừng ±2% độ sáng ngay ở `fiber` 1, không thấy, và núm thành vô dụng;
  - **vệt chổi:** `fbm` 2 tầng kéo dài theo hướng xiên 0,5 rad (tần số 0,35 dọc vệt, 3 ngang vệt); `smoothstep(−0,2; 0,4; ·) · brush` là độ
    dày của lớp điệp.
- **Hạt điệp** (`parts/giay-diep-mat.js#glints`):
  - mặt giấy chia thành ô (`density` ô mỗi đơn vị cảnh); mỗi ô có một hạt: một vệt sáng mềm `e^(−4·(d/r)²)` ở chỗ lệch ngẫu nhiên, bán trục
    0,2 ô; vị trí và độ nghiêng băm theo số ô, nên cùng một khung luôn ra cùng một ảnh;
  - **hạt nghiêng trong mặt phẳng tiếp tuyến của tờ giấy:** pháp tuyến hạt là pháp tuyến giấy cộng `dx·T + dy·B`, với T là trục x của tờ
    giấy, B = n × T chạy theo chiều dài cung, dx và dy ngẫu nhiên trong ±1,4 (là tan của góc nghiêng, tới chừng 54°). Nghiêng theo trục
    x và z của thế giới thì sai: vách có pháp tuyến (0, 0, 1), nghiêng theo z không đổi gì, mà vách cần nghiêng lên xuống mới bắt được nắng;
  - hạt sáng khi tia nắng phản xạ trên nó đi vào mắt: `pow(saturate(dot(reflect(−nắng, n_hạt), hướng_nhìn)), 80)`. Hạt chỉ lóe khi pháp
    tuyến của nó trùng nửa vector H của hướng nắng và hướng nhìn, nên tầm nghiêng phải với tới H:
    - ở góc của tranh, H lệch khỏi pháp tuyến sàn tới 1,32 (53°), khỏi pháp tuyến vách 0,76 (37°), và gần như trùng pháp tuyến giữa chỗ uốn;
    - tầm nghiêng ±0,6 theo x và z (bản đầu) cho 0 hạt lóe trên sàn và vách, ở góc của tranh và khi xoay ±30° (mô phỏng cùng phép tính
      của shader), chỉ chỗ uốn có: một dải, không phải một lớp điệp phủ khắp tờ giấy. Với ±1,4, chừng 0,3–1% số ô lóe hơn nửa độ sáng ở mỗi
      vùng, ở các góc nhìn trên;
  - với camera trực giao, hướng nhìn như nhau ở mọi điểm ảnh (Phụ lục A.91), nên H cũng vậy: khắp tờ giấy, chỉ hạt có pháp tuyến quay
    đúng về H mới lóe (với camera phối cảnh, hướng nhìn và H đổi theo chỗ trên giấy). Xoay camera là đổi H cho cả tờ giấy cùng lúc, nên hạt
    này tắt, hạt khác lóe lên. Câu cũ "đứng yên thì hạt đứng yên" đúng với mọi camera đứng yên, không phải điều camera trực giao thêm vào
    (sửa ở GĐ 8 Task 10);
  - **cỡ chấm:** bán trục 0,2 ô, không nhỏ hơn 0,8 điểm ảnh MÀN HÌNH theo từng trục (bề rộng một điểm ảnh tính bằng ô: `|dFdx| + |dFdy|`
    của lưới ô; đặt sàn theo đơn vị cảnh của một điểm ảnh, `shared.cot.pixel` như Bản nét, thì chỉ đúng theo chiều ngang, vì chiều sâu của
    sàn bị co), và không quá 0,25 ô để chấm nằm gọn trong ô. Trần 0,25 ô thắng khi một ô nhỏ hơn chừng 3,2 điểm ảnh (sửa ở GĐ 8 Task 11:
    bản trước viết "hạt nào cũng to ít nhất chừng hai điểm ảnh"):
    - vách: ô rộng chừng 4,3 điểm ảnh ở DPR 1 (khung 1280 × 800), 8,7 ở DPR 2: chấm 0,2 ô, tức chừng 0,9 và 1,7 điểm ảnh;
    - sàn: nhìn chếch 20° co chiều sâu còn 1/3, ô chỉ cao chừng 1,5 điểm ảnh ở DPR 1, 2,9 ở DPR 2, 1,8 ở điện thoại 390 × 844 (DPR 3), nên
      chấm chỉ cao chừng 0,37, 0,74 và 0,46 điểm ảnh: hạt trên sàn là vạch ngang mảnh, nhạt hơn hạt trên vách (đúng với mặt giấy nhìn chếch).
      Đo trên GPU thật (view "Chỉ emissive", khung 120): số điểm ảnh có hạt trên sàn và trên vách gần như nhau (chừng 0,4–0,6%), nhưng ở ảnh
      cuối hạt trên sàn chỉ hiện rõ ở DPR 2; ở DPR 1 và trên điện thoại gần như không thấy. Giữ như vậy: hạt điệp lóe nhẹ, và hạt to hơn trên
      sàn phải tràn sang ô kề hay thưa hạt đi (ảnh ở trang duyệt của Task 11);
  - phần sáng của hạt là `emissiveNode` với độ sáng HDR `16 · sparkle`. Tone mapping nén vùng sáng: hạt chỉ sáng gấp đôi giấy thì gần
    như không thấy (đo trên GPU thật dưới AgX, trước lượt màu, DPR 2, góc của tranh: đỉnh 1 và 3,4 gần như không thấy hạt trong ảnh cuối;
    8 mờ; 16 thấy rõ), và bloom của Phủ bóng chỉ có gì để tỏa khi đỉnh từ chừng 10. ACES mà lượt màu chọn (lớp 6) cũng nén vùng sáng: giữ
    `16`, và sau lượt màu hạt vẫn lóe nhẹ ở ảnh cuối (Phụ lục A.100);
  - **lề không lóe** (GĐ 8 Task 11): hạt tắt dần từ 0,5 vào tới 0,25 đơn vị cách mép tờ giấy (khoảng cách UV tới mép gần nhất; Cốt công bố
    khổ UV ở `shared.cot.sheet`). Quầng bloom của một hạt tỏa ra vài chục điểm ảnh, mà ngoài mép là ván sơn đen: chưa có lề thì hạt sát mép
    để lại những đốm sáng mờ trên ván. Đo trên GPU thật (khung 120, 1280 × 800, DPR 1, dải ván 3–20 điểm ảnh quanh tờ giấy): độ sáng lớn
    nhất của ván 80 khi chưa có lề, 18 khi có (0–255; ván xa chừng 3).
- **Núm:** `sparkle` (0–4, mặc định 1,2), `density` (4–40 ô mỗi đơn vị, mặc định 14), `fiber` (0–1, mặc định 0,5), `brush` (0–1, mặc định
  0,6). Số hạt không đổi chi phí: không có vòng lặp nào theo số ô.
- **Thí nghiệm "Giấy dó trơn"** (`giayTron`): bỏ lớp điệp và hạt, chỉ còn nền dó và sợi.
- **Nấc** `chi-tiet`: bớt một tầng noise của sợi dó. Chỉ có khi `paper` lớn hơn 1.
- Không có vật riêng. Cốt: `recipe.paper` và `recipe.glint` là hai hàm duy nhất lớp này bọc, nên gà không đổi.

#### Lớp 5 · Đàn gà (`layers/l5-dan-ga.js`)
- **Thấy gì:** thóc rắc ra, nảy, lăn; gà con chạy, mổ, rỉa lông; gà mẹ gọi con, cào chân bới thóc.
  - Mài lớp này thì thóc biến mất, và đàn gà đứng yên ở chỗ của mình như tượng: vị trí và dáng hòa về dáng nghỉ theo trọng số.
- **Thóc** là một bể hạt của `lib/tsl/particles.js` (§20.7): hai bộ đệm vec4 cấp một lần theo trần (`budget.grains`), một compute bước
  mỗi khung, vẽ bằng một `Sprite` có `count`.
  - `a = (vị trí, lúc sinh)`, `b = (vận tốc, hạt giống)`. Lúc sinh âm nghĩa là ô trống, hay hạt đã bị ăn.
  - **Luật** (`parts/dan-ga-thoc.js`, số ở `GRAIN`):
    - văng ra trong một đĩa bán kính 0,15, tốc độ ngang tới 1,2 và hất lên tới 1,5; rơi theo trọng lực;
    - đang bay mà chạm sàn là một lần rơi: nảy với hệ số `bounce`, và vận tốc ngang còn một nửa (giấy hãm hạt). Đang nằm trên sàn (lăn)
      thì chạm sàn mỗi khung do trọng lực: chỉ kẹp lại, không nảy, không hãm thêm. Nảy lên chậm hơn 1 thì thôi nảy; nảy thấp hơn trọng lực
      của một khung thì tự tắt, nên ở 10 khung/giây hạt vẫn nằm yên được (bản của plan thì nảy mãi, vì một khung 0,1 giây trọng lực đã
      cộng 9,8 vào vận tốc);
    - lăn chậm dần theo `e^(−6t)`, chậm hẳn thì nằm yên; ra tới mép sàn thì dội lại; nằm yên thì thôi tích phân, nhưng vẫn kiểm mỏ.
    - Nắm gọn: nửa số hạt nằm trong chừng 0,4 quanh chỗ rơi, gần hết trong 0,55, nảy chừng hai lần, nằm yên sau chừng nửa giây, ở 60, 30
      và 10 khung/giây như nhau (đo bằng bản JS của luật). Số của plan (tốc độ ngang 2,4, không hãm khi rơi, ma sát 3) tỏa nắm ra chừng 1,3
      (gần hết trong 1,8): các con mổ trong chừng 0,5 quanh tâm nắm chỉ ăn được 3–7% mỗi nắm. Trọng lực của trăng rơi lâu hơn, nên tỏa
      rộng gấp đôi.
  - **Mổ:** một mảng uniform 10 điểm (`uniformArray`, vec4) giữ mỏ của mười gà con; thành phần w là "đang mổ". Gà mẹ ngậm con ong
    nên không mổ. Mỗi hạt tự kiểm các mỏ đang mổ: đầu mỏ thấp hơn 0,3, hạt cũng thấp hơn 0,3 (hạt đang bay qua thì không), cách hạt dưới
    0,2 đo trên mặt sàn, thì tự xóa. Mỗi hạt chỉ đọc và ghi chính nó, vì compute của WebGL2 chỉ cho như vậy (§20.7).
    - Vì sao 0,2 chứ không 0,06 (số cũ của spec): mỗi nắm chỉ có chín tới mười hai chỗ mổ (ba bốn con, mỗi con ba chỗ nhảy), và mỏ đứng
      yên suốt mỗi chỗ; ở 0,06 mỗi lần mổ trúng chừng một hạt, một nắm 120 hạt gần như không vơi. 0,15 (plan) đủ khi các con còn nhảy vào
      giữa nắm; từ khi chỉ nhảy ra phía ngoài (§20.5, để đầu hai con không đâm vào nhau), 0,2 mới phủ được nắm.
    - Đo bằng bản JS của luật cùng đàn gà thật (`tests/paintings/dan-ga-me-con/dan-ga-thoc.test.js`): một nắm rắc giữa sàn hay sát mép
      bị ăn chừng 60–80% (60 khung/giây), nhúm lúc mở trang chừng một nửa; cảnh bận (chạm khắp sàn, giữ, thả), nắm có con tới bị ăn trung
      bình chừng 45%, hiếm nắm nào dưới 10%. Ở 10 khung/giây ít hơn một chút: mỏ "đang mổ" chừng 0,1 giây mỗi nhịp cúi, nên mỗi nhịp chỉ
      một khung, có nhịp không khung nào.
  - **Rắc** đi qua `emit` của bể: các hạt của nắm mới tự khởi tạo lại ở bước kế tiếp (§20.7). Thóc rơi ở điểm `takeScatters` trả, là tâm
    vòng các con đứng quanh (§20.5 luật 1): sát mép thì vào trong một chút, sát mẹ thì ra bên cạnh mẹ. `origin.y` của nắm là độ cao văng:
    3 (tầm tay) khi rắc, 1 khi gà mẹ bới (chân cào hất thóc lên thấp; nhúm gọn hơn).
  - Chỉ rắc ở khung có `dt > 0`: `update(0, t)` của `?freeze` không rắc, không compute. Trọng số về 0 thì nắm tới lúc văng bị bỏ (nhúm gà
    mẹ bới, vì gà mẹ vẫn bới theo đồng hồ) và nắm đang chờ trong bể bị `clear()`: phủ lại lớp không có nắm cũ nào bung ra cùng lúc.
  - Trọng số về 0 thì `shared.js` cũng không đưa chạm và giữ tới đàn gà (GĐ 8 Task 8, sửa sau review): chạm lên bầy tượng không gọi con
    nào chạy, núp hay mổ mà không ai thấy, và `dangAn`, `quanhMe` không đếm theo cú chạm ấy. Thả thì luôn tới đàn gà: thả mà chưa giữ thì
    đàn gà bỏ qua, còn cái giữ bắt đầu lúc lớp còn phủ phải được thả, không thì gà mẹ xòe cánh mãi. `drift(t)` vẫn chạy mỗi khung: gà mẹ
    vẫn bới theo đồng hồ mà nhúm của mẹ bị bỏ, nên hai ba con vẫn tới mổ nền trống (số đo đếm chúng), và phủ lại lớp giữa lúc đó thì thấy
    chúng mổ đất tới hết lượt mổ. Chấp nhận: gà mẹ bới theo đồng hồ là điều §20.2 đòi.
  - **Vẽ:**
    - `positionNode` đọc bộ đệm;
    - `scaleNode` cho hạt hình dẹt (0,08 × 0,04), với sàn theo điểm ảnh (§20.11); `rotationNode` theo hạt giống;
    - hạt đã bị ăn, hay đã nằm hết 30 giây, nhỏ về 0;
    - `transparent` (vẽ sau mọi vật đục), không ghi độ sâu (`depthWrite = false`) nhưng vẫn bị gà che (`depthTest`), nên Bản nét không vẽ
      viền quanh hạt;
    - màu đi qua `recipe.fill`: thóc là `hoe` khi có Bản màu, đất sét khi không; "Chỉ bản nét" in nó thành trắng giấy như mọi thứ in màu.
- **Đàn gà** (`parts/dan-ga-song.js`, hàm thuần, chỉ import `lib/random.js`):
  - vị trí, hướng, góc cúi đầu của mười gà con, và cánh của gà mẹ, tính thẳng từ thời gian theo các mốc (§20.5);
  - `shared.js` giữ các mốc (cử chỉ đến đó); lớp này đọc mốc mới để `emit` thóc. Hợp đồng của đàn gà: `drift(t)` chạy trước mọi cử chỉ
    của khung (xưởng giao cử chỉ trước `setup.update`, nên `onGesture` gọi `drift(t)` trước, rồi `setup.update` gọi lại, cùng t không thêm
    gì). Điểm chạm đi qua `floorPoint`, hàm toàn phần: tia hỏng (khung cỡ 0, NaN, thiếu tia) vẫn ra một điểm hữu hạn trong sàn;
  - mỗi khung, `update` gọi `shared.cot.pose(state, k)`: Cốt ghi chỗ, hướng (`pose`) và góc cúi đầu (`head`) vào thuộc tính instance riêng
    của gà con, và bốn uniform của gà mẹ (lớp 1); lớp này ghi mảng mỏ.
  - Ma trận instance giữ đơn vị và `frustumCulled = false` (lớp 1), nên không ghi ma trận và không cần `computeBoundingSphere()`.
  - `pose`, `head` ghi lại mỗi khung, nên là `instancedDynamicBufferAttribute` (`DynamicDrawUsage`).
- **Núm:** `handful` (số hạt mỗi nắm), `bounce`, `gravity` (select: `traiDat`, `trang`), `count` (trần số hạt, `via: 'js'`, như đom đóm).
- **Thí nghiệm "Tô theo luồng"** (`toTheoLuong`): mỗi hạt một màu theo chỉ số luồng GPU (`instanceIndex`). Sắc màu (hue) xoay một góc
  vàng (2,4 rad, chừng 137,5°) mỗi luồng, nên hai hạt kề nhau trên vòng đệm khác màu hẳn: màu không cho thấy một nắm là đoạn liền.
  - Thấy được mỗi hạt ở yên một luồng (nên một màu) suốt đời: hạt giữ nguyên màu khi rơi, nảy, lăn. Ngược lại thì không đúng: một luồng
    tính nhiều hạt nối nhau, vì hết vòng đệm thì nắm mới lấy lại luồng (ý dưới).
  - Hạ `count` rồi rắc liền tay thì thấy nắm mới lấy lại luồng của những hạt cũ nhất (mỗi nắm là một đoạn liền của vòng đệm): hạt ở nắm
    cũ biến mất.
  - Bản đầu của chữ trong Sổ tay viết "hạt cùng một nắm có màu liền nhau", sai với góc vàng (sửa ở GĐ 8 Task 10).
- **Số đo:** `rac` (số hạt đã rắc thật còn trong vòng đệm: bể đếm lúc một nắm ra khỏi hàng đợi, §20.7), `dangAn` (số gà con đang mổ),
  `quanhMe` (số gà con cách tâm gà mẹ dưới 2,2).
- **Nấc** `thoc`: trần số hạt còn một nửa.
- **Vật:** `thoc`.

#### Lớp 6 · Phủ bóng (lớp dùng chung)
- Bloom chọn lọc làm hạt điệp tỏa; ngoài hạt điệp, không vật nào có emissive.
- LUT, grain, vignette, FXAA như ba bức trước. Mặc định của núm ghi đè trong `painting.js` nếu lượt màu cần (§15 a): `bloomStrength`
  thấp hơn, `exposure` để giấy không xám.
  - Chốt ở lượt màu (GĐ 8 Task 11; bức đầu tiên ghi đè mặc định của lớp dùng chung): `toneMapping` `'aces'`, `exposure` 1,2,
    `bloomStrength` 0,5; các núm khác giữ mặc định. `painting.js` chép module của Phủ bóng, chỉ thay `value` của ba núm ấy (`PHU_BONG`).
  - Mài Phủ bóng về 0 vẫn là bài học cũ: không tone mapping, không bloom; giấy sáng hơn (lộ sáng 1,2 nhân thẳng) mà chưa cháy trắng.

### 20.5 Chuyển động tất định (`parts/dan-ga-song.js`, và `dan-ga-pha.js`, `dan-ga-duong.js`, `dan-ga-cho.js`, `dan-ga-ke.js`)
- **Mốc:**
  - `scatter(t, điểm, hạt giống)`: chạm, hay gà mẹ bới;
  - `grip(t)` và `release(t)`: giữ, thả. Giữ hai lần liền, hay thả khi chưa giữ, thì bỏ qua;
  - "đang giữ" kéo dài qua các mốc rắc: `grip`, `release` và bới hỏi mốc cuối có đang giữ không (`underGrip`), không hỏi loại của mốc cuối;
  - giữ tối đa 32 mốc gần nhất, như Bức 3. Sau khi bỏ mốc cũ, `state(t)` với t sớm hơn mốc cũ nhất đọc kế hoạch của chính mốc ấy ở t: pha
    đã bắt đầu trước t tính như thường, pha chưa bắt đầu thì đứng ở trạng thái đầu của nó (con mà mốc ấy gọi đi đứng ở chỗ của nó lúc mốc ấy);
  - **"Bây giờ":** mỗi hàm ghi (`scatter`, `grip`, `release`, `drift`) nhớ thời điểm lớn nhất nó đã nhận. Mốc có thời điểm lùi xếp vào "bây
    giờ" chứ không lùi hơn, nên không viết lại các khung đã vẽ và đàn không nhảy. Hợp đồng gọi: `drift(t)` chạy mỗi khung, một lần, trước cử
    chỉ và trước `state(t)`, nên "bây giờ" là thời điểm khung đang vẽ; mốc bới của `drift` cũng không xếp vào khung đã vẽ trước lần gọi
    hiện tại. `state(t)` vẫn là hàm thuần của các mốc: không ghi gì;
  - thời điểm hay điểm rắc không hữu hạn thì ném lỗi: một số NaN lọt vào mốc làm hỏng mọi trạng thái sau đó.
- **Gà mẹ là vật cản.** Thân mẹ trên sàn là hình viên thuốc: mọi điểm cách đoạn xương sống (dọc mẹ, dài 1,6) không quá 1,2 (`LAYOUT.body`).
  Gà con đứng thẳng, hướng nào, không lún vào mẹ khi cách xương sống từ 1,85, gọi là **vòng cấm** (đo bằng chỗ thật của khối ở 48 hướng:
  cách 1,75 còn lún, từ 1,78 hết; lấy 1,85). Ba luật:
  1. **Nắm rơi bên cạnh mẹ.** Gà con xúm quanh nắm trên vòng bán kính 1 và nhảy tối đa 0,25, nên tâm vòng phải cách xương sống từ 3,1. Điểm
     rắc mà tâm vòng của nó (kéo vào trong sàn) gần hơn thì dời tới điểm gần nhất trong sàn thỏa điều ấy. Nắm ném vào mẹ, sát mẹ, hay chạm
     lên vách (điểm rắc kẹp về mép sau sàn, ngay sau lưng mẹ) thì rơi bên cạnh mẹ. Rồi điểm rắc kéo vào trong sàn thành chính tâm vòng (GĐ 8
     Task 8): `takeScatters` trả tâm vòng ấy, lớp Đàn gà rắc thóc ở đó, nên thóc nằm đúng giữa các con. Trước đó thóc rơi ở điểm chạm, mà
     chạm sát mép thì tâm vòng bị kéo vào tới 1,25 theo mỗi trục: các con mổ cách nắm thóc cả đơn vị, không trúng hạt nào.
  2. **Đường chạy không cắt vòng cấm.** Đường thẳng cắt vòng cấm thì vòng qua đầu hay đuôi mẹ, bên nào gần: một đường gấp khúc, cả đường chung
     MỘT lần tăng giảm tốc (không dừng ở góc), hướng quay dần trong 0,3 giây sau mỗi góc.
  3. **Tới chỗ núp không quay mỏ vào mẹ.** Sáu trong tám chỗ núp nằm trong vòng cấm. Gà con chạy tới điểm dừng ngoài vòng cấm (cách vòng 0,35,
     thẳng ra ngoài từ chỗ núp), đứng quay tại chỗ sang hướng ra ngoài trong 0,3 giây (mỏ quét ở xa mẹ), rồi lùi vào chỗ núp, mặt vẫn hướng
     ra ngoài. Ra khỏi chỗ núp (thả) thì ngược lại: đi thẳng ra điểm dừng (mặt đã hướng ra) rồi chạy, cùng một chuyến êm. Hai chỗ giữa lưng
     mẹ đã ngoài vòng cấm nên chạy thẳng tới.
  - Đo bằng chỗ thật của khối, từng khung: 150 cảnh ngẫu nhiên (chạm khắp sàn kể cả trúng mẹ, giữ, thả; 2,9 triệu khung gà con) không khung
    nào ở trong thân mẹ, và ở trong vòng cấm chỉ khi cách một chỗ núp dưới 1,1, mặt quay ra ngoài trong 50°; giữ sau bốn cú chạm (60 lần):
    không khung nào lún (trước khi có ba luật: 713 khung, 59 lần có khung lún).
- **Trạng thái của một gà con ở thời điểm t:** đi qua các mốc theo thứ tự. Trạng thái đầu của mỗi đoạn là trạng thái cuối của đoạn trước: vị
  trí, hướng đang có (không phải hướng muốn tới: chuyến ngắn hơn 0,3 giây không làm hướng giật) và độ cúi đầu, tắt dần trong 0,25 giây (gà đang
  mổ mà bị gọi đi thì đầu không rơi về 0 trong một khung). Mỗi đoạn có dạng đóng:
  - **rảnh:** lượn quanh chỗ "nhà" theo hai sóng sin của thời gian, biên độ 0,3 mỗi trục (bán kính tối đa chừng 0,42), xen lẫn cúi đầu
    rỉa lông theo chu kỳ có hạt giống;
  - **chạy tới:** từ chỗ đang đứng tới điểm đích, là một chỗ trên vòng bán kính 1 quanh điểm rắc.
    - Các con chạy tới cùng một nắm đứng cách đều nhau trên vòng ấy, mỗi con một chỗ (hạt giống xoay cả vòng), nên không chồng lên nhau: gà
      con rộng chừng 1. Điểm rắc sát mép sàn thì tâm vòng được kéo vào trong sàn (chừa cả vòng và bước nhảy), nên gà con luôn đứng trên giấy.
    - Mỗi chỗ đứng cách chỗ đứng của mọi con khác (đang mổ nắm khác, đang nghỉ ở nhà, con nấp bụng) từ 1,4: cộng hai bước nhảy thì hai con
      cách nhau ≥ 0,9. Nhà của mọi con đang đi vắng hay đang về cũng là chỗ đã có người, vì xong việc nó về đứng ở đó (GĐ 8 Task 8: trước
      đó con mổ đứng sát nhà một con đang vắng, rồi con kia về đứng chồng lên, 93 trong 200 cảnh bận).
    - Vòng vướng thì xoay tới góc có nhiều chỗ hợp lệ nhất; chỗ nào không hợp lệ thì con ấy ở yên. Vòng không bao giờ nở: mỏ lúc mổ chỉ với
      tới trước chân chừng 0,75, nên đứng trên vòng nở (×1,4; ×1,8, cách của GĐ 8 Task 7) là mổ cạnh nắm thóc. Đo bằng bản JS của luật
      thóc (GĐ 8 Task 8, 40 cảnh bận, chạm khắp sàn): giữ vòng nở làm đường lùi khi vòng bán kính 1 không còn chỗ nào thì 51 trong 474 nắm
      có con tới bị ăn dưới 10%; bỏ hẳn vòng nở thì 11 trong 420 (có thêm vài nắm không con nào tới).
      Đông tới mức không còn chỗ nào thì không con nào tới nắm mới (các con khác đang vây rồi): spacing không bao giờ nới.
    - Con nào vào chỗ nào gán sao cho tổng quãng đường (cả đoạn vòng qua mẹ) ngắn nhất, như chỗ núp.
    - Tốc độ 9 đơn vị/s (0,9 m/s), có tăng giảm tốc (`smootherstep`) trên cả đường.
    - Bắt đầu sau 0,1–0,4 giây (phản xạ, theo hạt giống).
  - **mổ:** quanh điểm đích, nhảy giữa ba chỗ cách chỗ đứng 0,1–0,25 (mỗi chỗ 8/3 giây), luôn nhìn về tâm vòng (nắm thóc). Nhảy ngắn thì
    hai con kề nhau trên vòng (bốn con thì cách 1,41) vẫn cách nhau ≥ 0,9. Đầu cúi theo nhịp 2,5 lần mỗi giây; mỏ "đang mổ" ở đáy nhịp,
    trước chân chừng 0,75, nên chạm sàn trong 0,55 quanh tâm vòng: vòng luôn bán kính 1, và tâm vòng là chỗ thóc rơi (luật 1 ở trên).
    - Chỗ nhảy ở phía ngoài vòng: lệch tối đa ±60° khỏi hướng từ tâm nắm ra chỗ đứng (GĐ 8 Task 8). Mỏ mọi con chụm về tâm nắm, nên nhảy
      vào trong thì đầu hai con cạnh nhau (bán kính 0,3) đâm vào nhau: đo bằng tâm đầu thật, 8% số cặp-khung hai đầu lún vào nhau, sâu tới
      0,4; nhảy ra ngoài ±60° thì dưới 0,5%, sâu không quá chừng 0,04.
    - Cả nhóm cùng một nắm thôi mổ cùng lúc: con tới sau cùng mổ 8 giây, con tới trước mổ lâu hơn một chút (chỗ nhảy cuối dài ra, nhịp
      cúi vẫn liền). Lý do: khi mỗi con thôi mổ 8 giây sau lúc chính nó tới, con tới trước về trước, rồi đứng nghỉ ở nhà ngay sát chỗ một
      con cùng nhóm còn đang mổ (GĐ 8 Task 8, đo trước luật này: 15 trong 200 cảnh bận, sau khi đã tính nhà của con đi vắng; có luật: 0);
  - **về:** đi bộ về chỗ "nhà", 5 đơn vị/s;
  - **núp** (khi giữ): chạy về một trong tám chỗ quanh và dưới cánh mẹ (luật 3 ở trên), đứng sát, quay ra ngoài (lưng về phía mẹ), đầu ngó
    nghiêng (hướng lắc ±0,5 rad). Chỗ gán sao cho tổng quãng đường của tám con (cả đoạn vòng qua mẹ) ngắn nhất, nên con nào cũng ưu tiên
    chỗ phía mình; không hai con một chỗ.
    - Tám chỗ là dữ liệu của bố cục (`SLOTS`), trên vòng bán kính 2,1 quanh tâm mẹ: dưới 2,2 để `quanhMe` đếm đủ mười; đủ xa để gà
      con quay ra ngoài không lún vào thân, đuôi, đầu hay cánh mẹ (kể cả cánh mở 60°); đôi một cách nhau ≥ 1,35 và cách con nấp bụng
      ≥ 1,5, nên không chồng lên nhau kể cả lúc ngó nghiêng (test đọc chỗ thật của khối).
    - Hai chỗ giữa lưng mẹ bị mẹ che hẳn từ camera của tranh; kéo xoay mới thấy gà con núp ở đó.
- **Ai chạy tới chỗ rắc:** ba tới bốn con gần nhất (số theo hạt giống) trong các con đang rảnh hay đang về.
  - Đang núp thì không đi. Con đã chạy tới hay đang mổ một nắm thì không bị nắm khác gọi đi.
  - Con trèo lưng và con nấp bụng luôn giữ chỗ của mình: không chạy tới chỗ rắc, và khi giữ thì ở yên (vốn đã ở sát mẹ).
- **Thứ tự ưu tiên** khi các mốc chồng nhau: núp > chạy tới > về > rảnh. Rắc trong lúc giữ thì thóc vẫn rơi, nhưng các con ở lại với mẹ.
- **Hướng:**
  - đang đi thì quay theo đoạn đường đang đi (đường gấp khúc: quay dần 0,3 giây sau mỗi góc); mọi lần đổi hướng đều êm, không quá
    π rad trong 0,3 giây;
  - đứng yên ở nhà thì theo dáng của bố cục (lắc nhẹ); đứng mổ thì nhìn về nắm thóc; núp thì quay ra ngoài, lưng về phía mẹ.
- **Gà mẹ:** đứng yên giữa sàn; đầu ngoảnh chậm theo thời gian.
  - Giữ: hai cánh mở tới 60° theo lò xo tắt dần tới hạn (như cây bay của Bức 3); đầu gật "cục cục" 2 lần mỗi giây, sâu nhất 0,4 rad
    (23°, `FLOCK.nod`). Mọi góc của gà mẹ trong trạng thái (cánh, gật, ngoảnh, cào) là radian, Cốt áp thẳng. Plan để gật 0–1 rồi áp như
    radian (tới 57°): đầu và con ong của mẹ lún vào gà con núp trước ngực (test đọc chỗ thật của khối giữ điều này).
  - Thả: cánh khép theo cùng lò xo.
  - Bới: chân cào trong 0,6 giây; thóc văng ra ở giữa nhịp cào. Không ai chạm 25 giây (kể từ mốc cuối, và không đang giữ) thì bới một
    lần: một nhúm 24 hạt ở `HEN_FRONT`, hai ba con gần nhất xúm lại.
- **Nhúm lúc mở trang:** 40 hạt nằm yên ở `PILE`; hai ba con gần nhất đã đứng sẵn quanh đó, chờ 0,1–0,4 giây rồi mổ, lệch nhịp nhau
  (poster chụp ở 2 giây có gà mổ).
  - `PILE` và `HEN_FRONT` đặt ở x = −3,95, trước mỏ mẹ (mỏ ở −2,6) chừng 1,35: đúng chỗ gà con xúm quanh được (cách đầu xương sống (−0,8; 0)
    từ 3,1), nên luật 1 không phải dời. Đặt ở x = −2,6 thì luật 1 dời tới đó: đo bằng chỗ thật của khối, đứng quanh nhúm ở x = −2,6 thì
    chừng một khung mổ trong chín có con lún vào ngực mẹ.
- **Đơn vị:** một đơn vị là 10 cm. Trọng lực của Trái Đất là 98,1 đơn vị/s², của trăng là 16,2.
- **Giảm chuyển động:** tốc độ chạy và đi còn một nửa, cánh mở chậm gấp đôi; không có gà mẹ bới (nhúm lúc mở trang vẫn có).
- Gọi `state(t)` bao nhiêu lần, theo thứ tự nào, cũng ra cùng một số; `update(0, t)` ra đúng khung N.

### 20.6 Xưởng và hợp đồng
Bức 4 cần bốn thay đổi của xưởng. Mỗi cái là một trường tùy chọn của hợp đồng, hay một thay đổi không đổi nghĩa cũ (luật 7). Bức nào cũng
dùng được.

**1. Camera trực giao** (`CameraSpec.kind: 'ortho'`)
- Trường mới (§8.4): `kind`, mặc định `'perspective'`. Với `'ortho'`:
  - `height`: bề cao của khung nhìn ở zoom 1, theo đơn vị cảnh. Nó thay cho `fov`.
  - `minWidth` (tùy chọn): khung hẹp thì xưởng nới `height` để bề ngang thấy đủ chừng này, có trần 4 lần `height`. Hàm
    `engine/gpu/fov.js#fitOrtho` tính lại mỗi lần resize, giống `minHorizontalFov` của camera phối cảnh.
  - `shortFrame` (tùy chọn, vòng sau điểm duyệt ảnh): `{ below, maxGrow }`. Canvas thấp hơn `below` điểm ảnh CSS thì `height` nhân với
    below / bề cao canvas, tới `maxGrow` lần (`fov.js#shortGrow`); `fitOrtho` lấy max với phần nới theo `minWidth`, không nhân dồn.
    `stage.js` truyền bề cao canvas cho `createCamera`/`fitCamera` mỗi lần resize. Camera phối cảnh bỏ qua; test hợp đồng chỉ cho nó ở
    camera trực giao (`below > 0`, `maxGrow ≥ 1`). Lý do và số đo ở §20.2.
  - `zoom` (tùy chọn): `[min, max]`, thành `minZoom` và `maxZoom` của OrbitControls. Thiếu thì không zoom.
  - `fov` và `distance` không dùng. Khoảng cách của camera chỉ để cắt near/far, và đứng yên: OrbitControls với camera trực giao đổi
    `zoom`, không đổi khoảng cách (Phụ lục A.92).
- `stage.js` dùng `engine/gpu/camera.js` (file mới: phần tính của camera tách ra để unit test, vì `stage.js` cần GPU):
  - `useCamera(spec)` dựng đúng loại camera (`createCamera`). `stage.camera` thành getter: mọi chỗ dùng (scene, pipeline, input, chữ đi
    theo vật, móc lần vẽ) đều đọc sau `useCamera`;
  - khi resize, `fitCamera`: camera trực giao tính `left`, `right`, `top`, `bottom` từ tỉ lệ khung và `fitOrtho`; zoom người xem chọn giữ
    nguyên;
  - `limitControls`: với camera trực giao, zoom kẹp trong `spec.zoom`, khoảng cách không đụng tới; với camera phối cảnh như cũ;
  - near 0,1 và far 500 giữ nguyên.
- Những chỗ đã đúng sẵn, chỉ thêm test: tia của Raycaster (gốc nằm trên mặt phẳng của camera, hướng là hướng nhìn; Phụ lục A.92), chiếu
  điểm neo của chữ đi theo vật. Camera "thở" không cần test riêng: `breath.js` là hàm thuần không biết loại camera, và Bức 4 có
  `breathe` 0.
- `contracts/runtime.js` (JSDoc) và test hợp đồng: `fov > 0` chỉ bắt buộc với camera phối cảnh; camera trực giao bắt buộc `height > 0`.
  `tests/helpers/fake-ctx.js` dựng camera theo `painting.camera`.

**2. Độ sâu đúng cho camera trực giao**
- three luôn đổi texture độ sâu bằng công thức phối cảnh (`PassNode.getViewZNode`, `getLinearDepthNode`; Phụ lục A.89). Với camera trực
  giao, view Độ sâu thành một bóng trắng trên nền đen.
- Sửa ở MỘT chỗ (`pipeline.js`), chọn bằng JS lúc dựng pipeline. Phải chọn bằng JS vì camera cần biết là của sân khấu; trong post, camera
  của TSL là camera vẽ quad.
  - Camera trực giao: độ sâu tuyến tính chính là texture độ sâu (Phụ lục A.90).
  - Camera phối cảnh: `getLinearDepthNode()` như cũ.
- `channel('depth')` và view Độ sâu (`views.js`) cùng dùng chỗ đó. Với camera phối cảnh, node giữ nguyên như cũ (test giữ), nên ba bức cũ
  không đổi.

**3. Tranh tự khép lại** (`CameraSpec.home: { after, duration }`, tính bằng giây; file mới `engine/gpu/home.js`)
- Nghe sự kiện `start` và `end` của OrbitControls. Từ `end`, đếm thời gian đứng yên, tính bằng giây của cảnh (`dt` của từng khung).
- Đủ `after` giây thì quay về góc ngang, góc dọc và zoom (hay khoảng cách, với camera phối cảnh) của `CameraSpec` trong `duration` giây,
  theo `smoothstep`, đi đường ngắn nhất. Có `start` mới thì dừng ngay.
- Mỗi khung đang về, bộ đếm đặt THẲNG vị trí camera, quanh `controls.target` lúc chạy (không phải `spec.target`: camera "thở" dời nó), và
  `zoom` (camera trực giao, rồi `updateProjectionMatrix()`); `controls.update()` chạy ngay sau như mọi khung, nhìn về điểm nhìn và kẹp trong
  giới hạn. Đổi cỡ khung giữa đường thì vẫn về đủ: `fitCamera` đổi khung nhìn, không đổi zoom.
- Giảm chuyển động: đủ `after` giây thì về một bước.
- **Quán tính của OrbitControls** tắt theo số lần `update()`, không theo giây (Phụ lục A.98), mà dt của khung bị kẹp 0,1 s: ở máy vẽ chậm,
  phần xoay dở sau khi buông tay còn lại nhiều và kéo camera ra khỏi nhà lần nữa. Nên `step(dt)` đặt `dampingFactor = 1 − (1 − mặc định)^(dt × 60)`
  trước `controls.update()` (khi `enableDamping`): quán tính tắt theo giây của cảnh ở mọi nhịp khung, và đúng bằng mặc định (0,05) ở 60 khung/giây.
  Chỉ bức có `CameraSpec.home` chịu thay đổi này; bộ đếm gỡ đi thì trả `dampingFactor` về như cũ.
- Phần tính là hàm thuần (`homeAt(từ, tới, k)` và bước đếm giờ), test bằng chuỗi khung giả. `scene.step()` gọi `stage.returnHome(dt)` sau
  `stage.breathe(t)` và trước `controls.update()`; khung bị bỏ (thử ngừng vẽ) thì không gọi.
- Với `?freeze`, vòng lặp dừng, nên camera không tự về.

**4. Sổ tay hiện code của hộp màu**
- `LayerMeta.files` kê được file `lib/tsl/*.js` mà lớp dùng (§8.3), và glob của `ui/code-view.js` thêm `../lib/tsl/*.js`.
- Kê là tùy chọn. Kê thì phải dùng thật: test hợp đồng kiểm file `lib` được kê nằm trong `lib/tsl/` và trong bao đóng import tĩnh của file
  lớp (thẳng hay qua part). Như mọi file trong `files`, mỗi file thuộc tối đa một lớp của bức (test hợp đồng giữ). Theo quy ước, file mà
  nhiều lớp cùng dùng thì không lớp nào kê: ở Bức 1, `noise.js` mà ba lớp cùng dùng (Sương, Vàng lá, và Ánh trăng qua
  `parts/anh-trang-moon.js`) không lớp nào kê; ở Bức 4 chỉ Giấy điệp dùng nó, nên lớp ấy kê. Hộp màu không biết núm, nên không có marker `// @knob` ở đó.
- Lý do: rút code của đom đóm lên `lib/tsl/particles.js` mà không kê thì Sổ tay của lớp Vàng lá mất đoạn code đó.

**Sửa một lỗi của xưởng, tìm ra khi làm Bức 4** (không phải trường mới; GĐ 8 Task 1): `tools/pick.js` bọc view của mỗi nhánh `If` trong
`isolate(…).setParent(false)` (Phụ lục A.95). Trước đó Lột lớp và Kính mài của ba bức đầu ra đen ở nấc "Trước bloom", từ GĐ 5.

**Không đổi:** cử chỉ, Dial (Bức 4 không có Dial), thí nghiệm, số đo, nấc, `quality`, chữ đi theo vật (Bức 4 không dùng).

**Hàng rào từ vựng** (`meta.fence`): `chick`, `poultry`, `rooster`, `gà mẹ`, `gà con`, `thóc`, `con ong`, `đông hồ`, `điệp`, `bản nét`,
`bản màu`, `lá tre`.
- Không rào `hen`: đó là chuỗi con của `denThen`, token của xưởng. Không rào `grain`: Phủ bóng có núm `grain`.
- Không rào `ink`, `paper`, `outline`, `toon`, `cel`, `sobel`, `ortho`: đó là tên kỹ thuật, bức sau có thể cần rút chúng lên hộp màu hay
  lớp dùng chung (§16).
- Test tự kiểm phải bắt được ít nhất một từ của Bức 4 và không bắt nhầm.

**Tên vật** (Từng sợi): `giay`, `ga-me`, `ga-con` (lớp 1), `thoc` (lớp 5). Cả cảnh có sáu lần vẽ, vì gà mẹ là một Group ba mesh.

### 20.7 Hạt dùng chung: `lib/tsl/particles.js`
**Luật hai lần, lần đầu tiên.** Đom đóm (Bức 1) là bức thứ nhất cần hạt compute; thóc là bức thứ hai. Phần chung rút lên hộp màu; luật
chuyển động ở lại trong bức.

- **Bể hạt** `createPool({ capacity, count, init, law, spawn, tier, renderer })` thuộc hộp màu: chỉ import three, không biết xưởng hay
  bức.
  - Cấp MỘT lần hai bộ đệm vec4 (`instancedArray`) theo `capacity`. `count` (mặc định `capacity`) là số phần tử được tính và vẽ lúc đầu.
  - `init` và `law` là hàm TSL nhận `{ a, b, index }`, tức vec4 của CHÍNH phần tử đó. Compute khởi tạo và compute bước bọc chúng.
  - Quy ước: mọi nhánh của `init`, `law`, `spawn` gán CẢ `a` lẫn `b`, để mỗi nhánh nói đủ trạng thái mới của phần tử. Nhánh không gán
    thì ô đó giữ giá trị cũ, ở cả hai backend: WebGL2 chép bản đọc sang bản ghi trước khi chạy luật (Phụ lục A.97), nên không có rác.
  - Bể nhận `renderer` và `tier` lúc dựng, vì compute khởi tạo chạy ngay lúc đó, trên cả bộ đệm (theo `capacity`). WebGL2 chạy nó hai lần,
    để cả hai bản ping-pong có dữ liệu (Phụ lục A.29).
  - `setCount(n, ...vật vẽ)` đổi `count` của compute bước, và của vật vẽ do bức truyền vào, rồi trả số đã kẹp. Sàn là 100, vì sprite có
    `count` > 1 mới có cache key riêng; trần là `capacity`.
  - `step(dt, w)` không làm gì khi `dt === 0` hay `w ≤ 0`: `update(0, t)` không tiến mô phỏng, nắm đang chờ vẫn chờ. Không thì chạy đúng
    một compute bước. `step` không nhận `renderer`: bể đã giữ nó từ lúc dựng.
  - `dispose()` gỡ hai compute node.
  - Hộp màu không đặt tên uniform (`setName`): một bức có thể dựng hai bể.
- **Rắc** (`spawn`, tùy chọn; chỉ Bức 4 dùng): `emit({ origin, count, seed, still })` xếp một nắm vào hàng đợi và trả chỗ của nắm trên
  vòng đệm, `{ start, size }` (nắm 0 hạt thì `null`). Bể không có `spawn` thì `emit` ném lỗi.
  - Mỗi bước lấy một nắm ra, ghi vào uniform `batch = { start, count, origin, seed, still }`: đầu nắm, số hạt, gốc, hạt giống, nằm yên.
    Không có uniform "lúc rắc": `spawn` đọc đồng hồ của cảnh (`ctx.u.time`) ở bước đó.
  - Ở compute bước, phần tử nào thuộc nắm (`(index − đầu + count) mod count < số hạt`, với `count` là số phần tử đang tính) thì gọi
    `spawn` để tự khởi tạo lại; phần tử khác gọi `law`.
  - Vòng đệm quấn theo số phần tử đang tính, không theo `capacity`: nắm rơi vào phần không được tính thì không ai thấy. Nắm lớn hơn số
    đó thì bị cắt. Con trỏ vòng đệm đi tiếp sau mỗi nắm, nên nắm mới đè lên hạt cũ nhất.
  - Mỗi bước tối đa một nắm; nắm sau chờ bước sau. Hàng đợi giữ tối đa 16 nắm, bỏ nắm cũ nhất: chạm dồn lúc khung đứng không làm nó
    phình mãi.
  - `emit` chép `origin` ngay lúc xếp hàng: người gọi dùng lại mảng của mình cũng không đổi nắm đang chờ.
  - `clear()` bỏ mọi nắm đang chờ, không đụng tới shader; con trỏ vòng đệm lùi về đầu nắm chờ cũ nhất, nên nắm sau vẫn đè lên hạt cũ
    nhất. Lý do: `step` không chạy khi `w ≤ 0` mà nắm chờ thì vẫn chờ, nên mài lớp về 0 rồi phủ lại là các nắm cũ bung ra cùng lúc. Bức
    gọi `clear()` mỗi khung lớp tắt hẳn (Bức 4, lớp Đàn gà).
  - `emitted()`: số phần tử đã rắc THẬT (nắm đã ra khỏi hàng đợi ở một bước) còn trong vòng đệm, không quá số đang tính. Đếm lúc rắc,
    không lúc xếp hàng: nắm đang chờ, nắm bị trần hàng đợi hay `clear()` bỏ không tính.
  - `still` cho nắm nằm yên ngay từ đầu (nhúm thóc lúc mở trang).
  - Vì sao không cho mỗi hạt đọc hạt khác: compute của WebGL2 là transform feedback, mỗi luồng chỉ đọc và ghi phần tử của chính nó
    (`element(i)` bỏ qua `i`, Phụ lục A.10). Thứ cần đi giữa các vật (mỏ gà) đi qua uniform.
- **Bức 1 dùng bể chung, ảnh giữ nguyên:**
  - `l5-vang-la.js` gọi `createPool` với luật của đom đóm: dòng xoáy curl, quán tính, hút về tay, kẹp trong ao. Marker `@knob` vẫn ở file
    của lớp. Id lớp, núm, thí nghiệm, số đo, nấc không đổi.
  - **Test so mã:**
    - TRƯỚC khi rút, ghi mã WGSL và GLSL của compute khởi tạo, compute bước và material của đom đóm thành fixture;
    - sau khi rút, mã phải giống từng ký tự, chỉ trừ số id của node trong tên (`NodeBuffer_<id>`, kiểu `NodeBuffer_<id>Struct` của
      WGSL, `buffer<id>` của GLSL), được đổi thành chỗ giữ đánh số theo thứ tự xuất hiện (`#0`, `#1`): hai bộ đệm vẫn phân biệt được;
    - helper mới `tests/helpers/nodes.js#compileCompute` dịch compute node bằng builder thật, như `compileMaterial`.
  - Biến thể CPU (`parts/vang-la-cpu.js`) ở lại Bức 1, vì chỉ đom đóm cần.
  - `meta.layers` của Vàng lá kê thêm `lib/tsl/particles.js`, nên Sổ tay vẫn hiện đủ code (§20.6 mục 4).
- Hàng rào từ vựng: hộp màu không chứa từ vựng của bức nào (`firefl`, `thóc`…); test luật giữ như mọi file trong `lib/tsl`.

### 20.8 Chất lượng và ngân sách
**Bảng của Bức 4** (`paintings/dan-ga-me-con/quality.js`):

| Mức | DPR tối đa | Vòng của khối gà (`segments`; tối đa `segmentsMax`) | Thóc tối đa (`grains`) | Tầng noise của giấy (`paper`) | Bloom (`resolutionScale`) |
|---|---|---|---|---|---|
| **cao** | 2 | 32; 48 | 4096 | 3 | 0.5 |
| **vừa** | 1.5 | 28; 32 | 2048 | 2 | 0.25 |
| **thấp** | 1.25 | 24; 32 | 1024 | 2 | 0.25 |

- Khóa: `dpr`, `segments`, `segmentsMax`, `grains`, `paper`, `bloom`.
- Thang: `['dpr', 'dan-ga.thoc', 'giay-diep.chi-tiet', 'phu-bong.bloom']`. Nấc `giay-diep.chi-tiet` chỉ có khi `paper` lớn hơn 1. Số vòng
  của khối gà không có nấc: đổi hình lúc chạy là dựng lại geometry, và số tam giác đã theo mức.
- Trần núm theo mức: `count` tối đa `budget.grains`; `segments` mặc định `budget.segments`, tối đa `budget.segmentsMax`; `handful` tối đa
  300 ở mọi mức, vì số hạt đã có trần riêng.
  - `segments` theo mức có từ GĐ 8 Task 9. Trước đó mọi mức 32, và núm kéo tới 48 (334 nghìn tam giác) ở mức nào cũng được.
  - Mức vừa 28 tới ngay góc thành nét của Bản nét, không thấy vệt nào; mức thấp 24 có vệt rất nhạt khi phóng to, ở cỡ điện thoại không
    phân biệt được với 32 (§20.4 lớp 1). Trần của hai mức ấy là 32, hình đã duyệt ảnh.
- **Tam giác** của các vật có hình (tờ giấy 480, gà mẹ, mười gà con). `renderer.info` đếm thêm 2 mỗi hạt thóc đang vẽ và 1 mỗi lượt hậu kỳ:

  | Mức | Mặc định | `segments` hết cỡ | `renderer.info` lúc mặc định (đo lại, GĐ 8 Task 12) |
  |---|---|---|---|
  | **cao** | 149 264 | 336 936 (48) | 157 470 |
  | **vừa** | 114 174 | 149 264 (32) | 118 284 |
  | **thấp** | 82 860 | 149 264 (32) | 84 922 |

  Mảng cổ của gà mẹ (GĐ 8 Task 11) thêm 1 152 tam giác ở 32 vòng (896 ở 28, 624 ở 24, 2 688 ở 48), đã tính trong cả ba cột; Task 9
  đo `renderer.info` trước mảng cổ được 156 318, 117 388, 84 298, đúng bằng số mới trừ phần ấy. `quality.test.js` giữ ngân sách: 150,
  115, 85 nghìn ở mặc định; 340, 150, 150 nghìn khi kéo hết cỡ (trước mảng cổ: 335 nghìn ở mức cao).
- **Draw call:** giấy, mình gà mẹ, hai cánh, gà con (instanced), thóc (sprite) là 6 lần vẽ. Mức cao có `6 + 12 (bloom) + 1 (FXAA) + 1
  (quad) = 20`. Bản nét không thêm lượt vẽ nào, vì nó đọc thẳng texture độ sâu. E2e giữ ≤ 30. Đo được 20 ở cả ba mức (GĐ 8 Task 9).
- **Chi phí:** thấp.
  - Mỗi điểm ảnh: 9 mẫu độ sâu (Bản nét), noise và hạt điệp trên giấy.
  - Thóc: 4096 phần tử, mỗi phần tử một vòng qua 10 mỏ.
  - Mục tiêu như §2: 60 khung/giây trên Mac M2 (1280×800, DPR 2, mức cao), 45 trên điện thoại tầm trung. Đo ở task đầu, rồi đo lại khi đủ
    sáu lớp.
  - (GĐ 8, Task 1, bản khung: Cốt, Bản nét, Phủ bóng; Chrome headless, GPU thật) M2, 1280×800, DPR 2: 60 khung/giây ở cả ba mức (trần
    60 của xưởng), 17 draw call, CPU 1,1–1,8 ms mỗi khung, bộ điều chỉnh không hạ nấc nào; Bản nét về 0 cũng vậy. Tải nặng 2560×1600,
    DPR 2, mức cao: vẫn 60 khung/giây, không hạ nấc. Ms GPU ở mức vừa 8,2, thấp 5,9; ở mức cao GPU Apple báo các lượt chồng lên nhau nên
    bị coi là không đo được (README).
  - (GĐ 8, Task 6, thêm Giấy điệp: Cốt, Bản màu, Bản nét, Giấy điệp, Phủ bóng; cùng máy) 1280×800, DPR 2, mức cao: 60 khung/giây, 19 draw
    call, CPU 1,4 ms, không hạ nấc. Tải nặng 2560×1600, DPR 2 (5120×3200 điểm ảnh): 50 khung/giây, bộ điều chỉnh hạ dpr một nấc (1,75).
    Chưa tách riêng chi phí của giấy (năm lần lấy mẫu noise mỗi điểm ảnh ở mức cao); Task 9 đo lại đủ sáu lớp ở ba mức.
  - (GĐ 8, Task 9, đủ sáu lớp; cùng máy, mỗi ô đo sau 12–15 giây live; hai lượt ở hai khung tham chiếu, một lượt ở tải nặng) Điện
    thoại là Chrome giả lập (`isMobile`, `hasTouch`) trên GPU của Mac: chỉ để so, máy thật là việc kiểm tay (§20.9).

    | Mức | 1280 × 800, DPR 2 | 390 × 844, DPR 3, giả lập điện thoại | 2560 × 1600, DPR 2 (tải nặng) |
    |---|---|---|---|
    | **cao** | 60 khung/giây, không hạ nấc, CPU 1,1–1,4 ms | 60, không hạ nấc, CPU 1,1–1,5 ms | 56,5, hạ dpr một nấc (1,75) |
    | **vừa** | 60, không hạ nấc, CPU 1,4 ms | 60, không hạ nấc, CPU 1,3–1,7 ms; GPU 10,9–11,7 ms | 60, không hạ nấc |
    | **thấp** | 60, không hạ nấc, CPU 1,0–1,4 ms | 60, không hạ nấc, CPU 1,5–1,6 ms; GPU 7,1–7,4 ms | 60, không hạ nấc |

    - Mọi ô 20 draw call, số tam giác như bảng trên. Ms GPU chỉ đo được ở khung điện thoại, mức vừa và thấp; ở đó GPU Apple cộng các lượt
      chồng lên nhau, nên số cao hơn thời gian thật và dao động nhiều (README). Cùng khung, ở 32 vòng (trước Task 9): mức thấp 9,1 ms,
      mức vừa 12,1–15,4.
    - Tải nền lúc đo: chính trình duyệt đo (40–45% CPU), WindowServer 15–20%; vài ô có dịch vụ hệ thống (ANECompilerService) tới 95%.
    - Tải nặng, mức cao: chi phí theo điểm ảnh. Bớt một tầng noise của giấy (`paper` 2) vẫn hạ dpr một nấc rồi giữ 60 (thay vì 56,5):
      một tầng noise không đủ giữ DPR 2 ở 16,4 triệu điểm ảnh. Thang hạ độ nét trước là đúng; ở hai khung tham chiếu mức cao giữ 60 mà
      không hạ nấc nào, nên không cần đường rẻ hơn cho giấy.
  - (GĐ 8 Task 12, đo lại trên code cuối: sau lượt màu (ACES, bloom 0,5), mảng cổ và lề không lóe của Task 11; cùng máy, một lượt, đếm khung
    trong 5 giây sau 12 giây live) Hai khung tham chiếu, cả ba mức: 59,9–60,0 khung/giây, không hạ nấc, 20 draw call, không lỗi console.
    `renderer.info` đếm 157 470, 118 284, 84 922 tam giác ở mức cao, vừa, thấp: đúng số của Task 9 cộng tam giác của mảng cổ (1 152, 896,
    624). Ms GPU chỉ đo được ở điện thoại mức thấp (6,3 ms); các ô khác máy báo không đo được. Tải nặng 2560 × 1600 không đo lại.
- **JS** (đo lại ở GĐ 8 Task 12 trên code cuối, `npm run build`, gzip): chunk của bức (`painting-*`) 36,3 kB (15,6 kB gzip), content
  (`content.vi-*`) 36,5 kB (11,0 kB gzip; chữ của Phủ bóng ở chunk dùng chung của mọi bức). Content lớn lên từ 11,9 kB (4,7 kB gzip) ở
  Task 9 vì năm sơ đồ SVG của Sổ tay (Task 10). `lib/tsl/particles.js` thành chunk riêng 1,5 kB (0,8 kB gzip), Bức 1 và Bức 4 cùng import;
  `BufferGeometryUtils` của three cũng thành chunk riêng 3,8 kB (1,1 kB gzip), Bức 2 và Bức 4 cùng import. Mã của bể tô màu cho Sổ tay
  (33 kB, 4,6 kB gzip) chỉ tải khi mở code. Cả đường 3D của Bức 4: 331,0 kB gzip, 362,0 kB kể cả Tweakpane (mục tiêu ≤ 450 KB, §10).
  Bảng đủ ở README.

### 20.9 Kiểm thử
**Tự chạy cho Bức 4**, vì các test này lặp qua registry:
- hợp đồng, tên vật, HTML;
- e2e chung: tĩnh, WebGL2, WebGPU, mài về Cốt, công cụ học, `?poster`, quầng trăng;
- a11y.

**Unit của xưởng** (`tests/unit/`):
- `fov`: `fitOrtho` giữ `height` ở khung rộng, nới ở khung hẹp, có trần; `shortFrame`: như cũ từ `below` trở lên (hay khi không biết
  bề cao canvas), nới theo below / bề cao ở canvas thấp, có trần `maxGrow`, gộp với `minWidth` bằng max; `camera`: camera phối cảnh bỏ
  qua nó.
- `home` (mới):
  - đứng yên đủ `after` thì về trong `duration`; có `start` giữa chừng thì dừng, buông lần nữa thì đếm lại từ đầu;
  - đi đường ngắn nhất, kể cả khi qua ±π;
  - giảm chuyển động thì về một bước;
  - camera phối cảnh về khoảng cách, camera trực giao về zoom; đổi cỡ khung giữa đường vẫn về đủ;
  - quán tính theo giây của cảnh (Phụ lục A.98): `dampingFactor` theo `dt`; OrbitControls thật ở 10, 30, 60 khung/giây không trôi khỏi nhà
    sau khi về.
- `scene`: mỗi khung gọi `stage.returnHome(dt)` sau `breathe` và trước `controls.update()`; khung thử ngừng vẽ thì không gọi.
- `camera` (`createCamera`, `fitCamera`, `limitControls` của `engine/gpu/camera.js`; `stage.js` cần GPU nên không có unit test):
  `kind: 'ortho'` cho `OrthographicCamera`, khung nhìn đúng tỉ lệ, giữ zoom khi khớp khung, `minZoom`/`maxZoom` của OrbitControls; không
  có `kind` thì như cũ.
- `pipeline` và `views`: với camera trực giao, `channel('depth')` và view Độ sâu là texture độ sâu, không có `perspectiveDepthToViewZ` trong
  đồ thị; với camera phối cảnh, node giữ nguyên như cũ.
- `input`: tia của camera trực giao (gốc trên mặt phẳng camera, hướng là hướng nhìn). `caption-set`: chiếu điểm neo với camera trực giao.
- `particles` (`tests/unit/particles.test.js`):
  - cấp phát một lần; `setCount` có sàn và trần;
  - `step` không chạy khi `dt = 0` hay `w ≤ 0`; WebGL2 khởi tạo hai lần;
  - vòng đệm của `emit`: quấn qua cuối theo số phần tử đang tính, nắm lớn hơn bể thì cắt, mỗi bước một nắm; hàng đợi giữ tối đa 16 nắm;
  - nắm đang chờ thì chờ khi `dt = 0` hay `w ≤ 0`; `emitted()` đếm lúc rắc thật (nắm bị trần hàng đợi bỏ không tính); `emit` chép
    `origin`; `clear()` bỏ nắm chờ (không bung ra, không tính, nắm sau đè hạt cũ nhất); `dispose()` hai lần vẫn an toàn;
  - compute bước dịch được ở cả hai backend, và nhánh rắc đọc đầu và số hạt của nắm (`compileCompute(...).uniforms`).
- Bức 1: **mã shader của đom đóm giống fixture** (§20.7).
- Hợp đồng: camera trực giao đúng hình dạng; file `lib` được kê thì phải được import.

**Unit của Bức 4** (`tests/paintings/dan-ga-me-con/`):
- `cot-bo-cuc`: đủ mười gà con; mọi chỗ "nhà" nằm trên sàn, không chồng lên nhau hay lên gà mẹ (trừ con trèo lưng và con nấp bụng);
  chỗ nhà của tám con còn lại cách tâm mẹ hơn 2,2, nên lúc nghỉ `quanhMe` chỉ đếm con trèo lưng và con nấp bụng. `beakTip`: lúc ngẩng
  là `CHICK.beak`, cúi hẳn thì mỏ chạm sàn, cúi dần thì mỏ hạ dần. Khung máy tính 16 : 10 và 16 : 9: tờ giấy chiếm 55–61% bề cao, tâm
  giấy cao hơn tâm khung một chút; điện thoại dọc 390 × 844: cả tờ giấy trong khung. Tám chỗ núp (`SLOTS`): trên sàn, cách tâm mẹ dưới 2,2,
  ngoài bầu dục thân mẹ, đôi một cách nhau hơn 1,3, cách con nấp bụng hơn 1,4; nhúm thóc và chỗ gà mẹ bới nằm trên sàn, ngoài đầu mẹ.
- `cot-hinh-ga`: gà mẹ, gà con đủ phần; đầu mỏ của hình khớp `CHICK`; khớp của gà mẹ ở tọa độ thế giới; con trèo lưng và con nấp bụng sát
  mẹ mà không lún vào khối nào của mẹ (cầu xoay, nón, trụ: đọc chỗ thật qua `placement()`, chung với hình), đáy chân con trèo lưng chạm
  lưng; ở góc nhìn của tranh (khung 16 : 10 và 390 × 844), tia qua tâm đầu và tâm mình (đọc từ `CHICK_SHAPE`) mỗi con trúng chính nó
  trước (không con nào bị che hẳn). Tám chỗ núp, gà con quay ra ngoài và ngó nghiêng hết cỡ: không đỉnh gà con nào nằm trong khối của
  mẹ và không đỉnh mẹ nào nằm trong khối gà con; cánh mở 60° nằm trên đầu gà con; hai gà con ở hai chỗ kề nhau, hay kề con nấp bụng,
  không chồng nhau. Cả chuyến đi (giữ từ lúc nghỉ, giữ lúc chờ/chạy/mổ, chạm ngay vào mẹ và sau lưng mẹ, thả rồi giữ lại, mẹ bới), lấy
  mẫu 30 Hz: không khung nào có đỉnh gà con nằm trong khối của mẹ. Gà mẹ gật hết cỡ (`FLOCK.nod`) và ngoảnh ±0,25: đầu, mỏ, mào, con ong
  không lún vào gà con núp ở tám chỗ (gật 1 rad thì lún: test bắt được).
- `dan-ga-song`:
  - chạm thì 3–4 con rảnh ở gần nhất chạy tới, và tới nơi đúng lúc tính theo tốc độ; mổ 8 giây rồi về. Các con tới cùng một nắm đứng
    cách nhau ≥ 0,9 và luôn trên sàn, kể cả chạm sát mép và góc; hai nắm cách 0,6, hay nắm cạnh con nấp bụng, cũng không dồn các con vào
    nhau (≥ gap − hai bước nhảy); lúc mổ nhìn về nắm, mỏ chạm sàn trong 0,55 quanh điểm rắc; con đang bận nắm này không bị nắm khác gọi đi;
  - chạm sát mép hay góc thì thóc rơi ở tâm vòng (trong sàn, chừa vòng và bước nhảy) và mỏ chạm sàn trong 0,55 quanh đó; cả nhóm thôi mổ
    cùng lúc; 200 cảnh bận (bốn cú chạm khắp sàn): con mổ cách con đang đứng ở nhà ≥ gap − wander·√2 − bước nhảy;
  - giữ thì mọi con rảnh về các chỗ quanh mẹ, quay ra ngoài, không hai con một chỗ; thả thì tản ra, tới nắm mới nhất nếu chưa quá 20 giây;
  - vị trí liên tục ở mỗi mốc, kể cả giữ lúc một con đang chờ phản xạ, đang chạy hay đang mổ; "bão" chạm, giữ, thả (20 hạt giống PRNG × 100 bước,
    mốc lùi, khoảng lặng cho gà mẹ bới) giữ vị trí và cánh liên tục KỂ CẢ MỐC LÙI, mọi số hữu hạn, luôn trên sàn, không con nào vào thân
    mẹ, không hai con một chỗ núp; mốc lùi xếp vào "bây giờ" (đàn không nhảy, khung đã vẽ không bị viết lại); `drift` xếp mốc bới sau lần
    gọi trước; hai mươi lần chạm trong một giây; giữ hai lần liền, thả khi chưa giữ;
  - gọi theo thứ tự nào cũng ra cùng số; tối đa 32 mốc; `drift` gọi từng khung hay một lần đều ra cùng dãy mốc;
  - giảm chuyển động thì chậm gấp đôi, cánh mở chậm hơn, không có gà mẹ bới; nhúm lúc mở trang có gà mổ lệch nhịp nhau;
  - đầu vào hỏng (thời điểm hay điểm rắc không hữu hạn, bố cục thiếu chỗ núp) thì ném lỗi.
- `dan-ga-duong`: hình học viên thuốc (đoạn gần nhất, khoảng cách hai đoạn); hành trình vòng qua đầu hay đuôi mẹ (mọi đoạn và đỉnh ngoài
  vòng cấm, đối xứng, 300 cặp điểm ngẫu nhiên); điểm dừng và lùi vào chỗ núp; `assign` bằng vét cạn; điểm rắc dời tới điểm gần nhất đứng
  quanh được; chỗ đứng quanh nắm (cách đều, chỉ trên vòng bán kính 1, tránh con khác, không bao giờ phạm sàn hay vòng cấm: 300 trường
  hợp).
- `dan-ga-tranh-me`: nắm ném vào mẹ, sau lưng mẹ, ở hai đầu rơi bên cạnh mẹ (nắm xa mẹ giữ nguyên, sát mép thì kéo vào tâm vòng); 24 cảnh
  ngẫu nhiên × 24 giây, từng
  khung: không con nào vào thân mẹ, vào vòng cấm chỉ khi ra vào chỗ núp và mặt quay ra ngoài (trong 60°); giữ gán tổng quãng đường ngắn
  nhất (vét cạn 8!); chạy từ trước mặt ra sau lưng mẹ thì vòng qua đầu hay đuôi.
- `dan-ga-muot`: từng khung 60 Hz qua rắc, giữ, thả, giữ lại ngay (0,05–0,8 giây), giữ lúc chờ/chạy/mổ, mở trang, mẹ bới, bão: hướng không
  nhảy quá nửa vòng trong 0,3 giây, đầu không nhảy quá nhịp cúi, vị trí không nhảy quá tốc độ đỉnh; chuyến chạy ngắn hơn 0,3 giây;
  đầu đang cúi tắt dần ở mốc.
- `dan-ga-thoc` (bản JS của luật, cùng `GRAIN`, với đàn gà thật): nắm rơi, nảy, lăn rồi nằm yên trong chừng một giây, gọn (nửa số hạt trong
  0,45, gần hết trong 0,65) ở 60, 30 và 10 khung/giây; trọng lực trăng tỏa rộng hơn, nhúm gà mẹ bới gọn hơn; gà con ăn được nhúm lúc mở
  trang (≥ 40%), nhúm gà mẹ bới, nắm rắc giữa sàn hay sát mép (≥ 30%) ở 60 và 10 khung/giây; cảnh bận: nắm có con tới bị ăn trung bình
  ≥ 30%, nắm có con mổ mà bị ăn dưới 10% ≤ 6%. Bản JS khóa với luật thật: mã WGSL và GLSL của bước compute (nhánh rắc và nhánh luật) so
  từng ký tự với bản ghi `__fixtures__/thoc/` (bỏ số id như fixture của đom đóm); luật hay three đổi thì test đỏ, sửa bản JS rồi mới ghi lại.
- `dan-ga` (lớp, dựng cả bức): compute khởi tạo và bước của bể thóc dịch được ở hai backend, bước đọc mảng mỏ 10 phần tử
  (`array<vec4<f32>, 10>` ở WGSL, khối `NodeBuffer_` ở GLSL); Sprite `thoc` không ghi độ sâu, transparent, không cắt theo khung bao,
  `count` = `budget.grains`, đọc `w_dan_ga`, `w_ban_mau`, Chỉ bản nét, Tô theo luồng, `cotPixel`; `update(0, t)` không compute, không rắc;
  trọng số 0 thì không compute, nắm bị bỏ, phủ lại không có nắm cũ bung ra; số đo, thí nghiệm, nấc `thoc` (trần về nửa rồi gỡ); núm ở
  hai đầu (`gravity` cả hai lựa chọn, `bounce` 0 và 0,8) dịch được, `handful` 300 khi `count` 100 thì Sprite vẽ 100 hạt và `rac` không vượt
  100 (cắt nắm lớn hơn bể: test của bể); nhúm gà mẹ bới tới hạn lúc lớp tắt hẳn không bung ra khi phủ lại; Cốt áp dáng
  (`pose` của trọng số 1 và 0, hướng đường ngắn nhất, bốn uniform của gà mẹ).
- Từng lớp, dựng cả bức bằng `buildPainting`:
  - material của các mesh là `NodeMaterial` gốc; mọi material có `emissiveNode`;
  - cảnh không có đèn nào của three, `shadowMap` tắt;
  - Bản nét có tap `truoc-net`; đồ thị màu của gà đọc `w_ban_net` (nét trong), tờ giấy thì không; núm ở hai đầu (`lineWidth` 1 và 3,
    `threshold` 0,05 và 2, `crease` 0 và 1, `misregister` 0 và 6) dịch được cả lượt cuối lẫn gà; hai thí nghiệm chỉ đổi uniform; tám mẫu
    Sobel nằm trong nhánh `If`; mỗi nét trong đọc `fwidth` của khoảng cách (mép mềm tối thiểu một điểm ảnh); mọi mesh gà đọc uniform
    `henBodyRadius` (viền cánh chỗ áp sườn theo số vòng, không phải hằng);
  - Cốt: gà mẹ ba mesh có `positionNode`, mỗi mesh đọc đúng uniform dáng của nó; `pose`, `head` là thuộc tính ghi mỗi khung; Tấm bìa
    phẳng chỉ đổi uniform (`material.version` không đổi); dịch được ở `segments` 8 và 48; `bodyRadius` (uniform `henBodyRadius`) bằng
    cos(π/n), nằm giữa đỉnh và tâm mặt lõm nhất của khối mình thật, đổi theo núm `segments`;
  - Bản màu: đồ thị màu của gà đọc `w_ban_mau` và ba núm; núm ở hai đầu dịch được; `pigment` ghi một lần; Tô mịn là kiểu so;
  - Giấy điệp:
    - đồ thị màu của tờ giấy đọc `w_giay_diep`, bốn núm, số tầng noise và Giấy dó trơn; shader của tờ giấy có `reflect` (hạt điệp), shader của
      gà thì không và không đọc `w_giay_diep`; cỡ chấm đọc đạo hàm màn hình;
    - tầm nghiêng của hạt với tới nửa vector của nắng và hướng nhìn ở sàn, chỗ uốn và vách (góc của tranh, xoay ±30°);
    - núm ở hai đầu (`density` 4 và 40, `sparkle` 0 và 4, `fiber` 0 và 1, `brush` 0 và 1) dịch được; nấc `chi-tiet` hạ số tầng một bậc rồi
      gỡ về như cũ, chỉ có khi `paper` > 1; Giấy dó trơn chỉ đổi uniform;
  - thí nghiệm và số đo đủ, có nhãn; nấc chỉ có khi có tác dụng.
- Cử chỉ (`cu-chi`, dựng cả bức):
  - chạm thì có mốc rắc ở đúng điểm trên sàn (tia của camera trực giao), kể cả khi chạm lên vách, ra ván, tia song song mặt sàn, khung cỡ 0
    (NDC NaN hay vô cực), cử chỉ thiếu tia: không ném lỗi, nắm luôn hữu hạn và trong sàn;
  - giữ, thả gọi đúng mốc (`quanhMe` ≥ 8 rồi về 2);
  - `'swipe'`, `'double-tap'`, `'hold-move'` không làm gì riêng; hai mươi lần chạm trong một giây: tối đa 32 mốc, đàn gà hữu hạn;
  - `drift` chạy trước cử chỉ: cú chạm đầu tiên sau 25 giây lặng không xóa lần gà mẹ bới đã tới hạn;
  - lớp Đàn gà mài về 0: chạm và giữ không thêm mốc, không con nào chạy hay mổ; gà mẹ vẫn bới; cái giữ bắt đầu lúc lớp còn phủ vẫn được thả.
- Chữ của Sổ tay: như Bức 2 và Bức 3.
- Chất lượng (`quality.test.js`, như Bức 3):
  - ba mức đúng bảng §20.8, cùng bộ khóa; thang đúng thứ tự; mọi nấc của thang có thật ở lớp ở cả ba mức;
  - `count` và `segments` mặc định và tối đa theo mức (kéo quá thì kẹp lại); Sprite thóc vẽ đúng `grains`; `handful` tối đa 300;
  - số tam giác của các vật trong ngân sách của mức, ở mặc định và khi kéo `segments` hết cỡ; ở mức cao, 48 vòng thì hơn gấp đôi;
  - `paper` = 1 thì không có nấc `chi-tiet`.
- Phủ bóng ghi đè (`phu-bong.test.js`, GĐ 8 Task 12): đúng ba núm chốt ở lượt màu mang số mới (chỉ đổi `value`), id có thật trong lớp
  dùng chung, giá trị hợp lệ với núm; các núm khác là chính núm của lớp dùng chung; module dùng chung không bị sửa (ba bức kia vẫn AgX).

**E2e riêng** (26 test trong bốn file `e2e/dan-ga-me-con*.spec.js`; WebGL2 trên SwiftShader là cổng chặn, WebGPU không chặn). Spec chính
tới gần 300 dòng nên tách: `dan-ga-me-con-giay.spec.js` (Giấy điệp), `-dan-ga.spec.js` (Đàn gà), `-chat-luong.spec.js` (chất lượng); tiện ích,
các vùng của canvas và tag khói (`SMOKE`) dùng chung ở `e2e/dan-ga-me-con.helpers.js`. `tests/rules/e2e.test.js` gom file theo slug dài nhất
(slug `dan-ga` không nhận nhầm `dan-ga-me-con*.spec.js`), kiểm mọi `describe` của các file ấy bắt đầu bằng tên bức, và (bức có
`ciWebgpuSmoke`) đếm test mang tag khói trên cả các file, tag khai báo trong file hay import từ `<slug>.helpers.js` (Bức 4 có 7 test như vậy).
Ngưỡng dưới đây là ngưỡng thật của test, ở khung 640 × 400, DPR 1 (trừ khi ghi khác): độ sáng là luma 0–1, sắc độ là (kênh lớn nhất − kênh
nhỏ nhất) / 255, kênh màu 0–255. Khung 640 × 400 thấp hơn `shortFrame.below` (§20.2), nên khung nhìn cao gấp 1,3: vùng trên tờ giấy (và
điểm chạm, điểm kéo) chốt ở khung chưa nới rồi đổi bằng `at640` của helpers (co về tâm khung 1/1,3, cùng chỗ của cảnh, vì camera trực giao
chiếu tuyến tính quanh điểm nhìn); vùng ván giữ nguyên.
- Góc nhìn của tranh (`?freeze=30`): hai dải ván trên và dưới tối (độ sáng < 0,08); vách giấy sáng hơn ván trên ít nhất 0,15; mình gà mẹ
  in màu vàng hòe (sắc độ > 0,15; đỏ hơn lam 40, lục hơn lam 20); không lỗi console. Vòng mặt đa diện thành nét (§20.4 lớp 3) chỉ thấy rõ ở
  DPR 2, nên kiểm bằng ảnh ở điểm duyệt ảnh, không bằng e2e.
- Chữ trên ván tối (sau lượt CI đầu: mỗi khung một test; mở ở 640 × 400 với `?freeze=10`, đổi cỡ, đợi bộ đệm vẽ đổi theo, rồi
  `__sma.restore({})` vẽ lại khung đứng yên ở cỡ mới): ở 1366 × 650, 1280 × 720 (laptop màn thấp, `shortFrame`), 1280 × 800, 1440 × 900,
  1920 × 1080 và 390 × 844, canvas phủ cả khung, và khung tờ giấy đo trên điểm ảnh của canvas (hàng có hơn 15%
  điểm ảnh sáng hơn 0,25; cột sáng ở hơn 30% số hàng ấy) nằm dưới tên tranh và dải link, trên gợi ý và thơ, mỗi phía cách hơn 2 điểm ảnh;
  cả tờ giấy trong khung.
- Bản nét:
  - viền: mép trái tờ giấy tối hơn ít nhất 0,01 khi có Bản nét; mặt sàn nghiêng lệch dưới 0,01 giữa có và không có Bản nét (mẫu độ sâu
    đối xứng, không sọc mực), và vùng sàn phải là giấy (độ sáng > 0,2, như phép phóng to dưới đây); draw call như nhau khi tắt Bản nét,
    và ≤ 30;
  - Bản nét về 0 thì giữa tờ giấy sáng lên hơn 0,02; riêng vùng mình gà mẹ phía trên cánh (không viền, không nếp gấp) sáng lên hơn 0,005:
    nét trong có thật, không chỉ viền (GĐ 8 Task 9: chừng 0,014 trên GPU thật, 0,015 trên SwiftShader; bỏ nét trong thì 0,001 và kiểm này
    đỏ; đo lại sau lượt CI đầu, ở khung 640 × 400 đã nới theo `shortFrame`: 0,036 trên WebGL2, 0,040 trên WebGPU, cả hai SwiftShader);
  - `misregister` bằng 6 thì ảnh ở mép trái khác lúc bằng 0;
  - phóng to 2,5 lần ở 1280 × 800 (tờ giấy chạm khung, không lệch bản; ở 640 × 400 khung đã nới, mép trước tờ giấy chỉ cách mép dưới khung
    chừng 4 điểm ảnh, sát vùng đo): hàng sát mép dưới lệch sàn ngay trên dưới 0,02, tức không có vệt mực giả (chưa
    bỏ mẫu ngoài khung: chừng 0,07); vùng ngay trên phải là giấy (độ sáng > 0,2), không thì hai vùng cùng là ván tối và kiểm trôi qua mà
    không kiểm gì;
  - bật Chỉ bản nét, rồi Dò cạnh theo màu: ảnh giữa tờ giấy đổi, không lỗi console.
- Độ sâu của camera trực giao (view Depth của Lột lớp): vùng gà sáng hơn vùng vách ít nhất 0,02, và vách dưới 0,97 (không phải một bóng
  trắng như với công thức phối cảnh).
- Giấy điệp (`e2e/dan-ga-me-con-giay.spec.js`):
  - Giấy điệp về 0 thì vách giấy về xám đất sét: sắc độ giảm ít nhất 0,03 (đo trên GPU thật ở GĐ 8 Task 6, trước lượt màu: 0,110 so với
    0,047), và có Giấy điệp thì kênh đỏ hơn kênh lam;
  - view "Chỉ emissive": ở góc của tranh đã có hạt lóe (độ sáng > 0); `sparkle` 0 hay Giấy điệp về 0 thì đen tuyền (đúng 0), vì gà không
    phát sáng; `sparkle` về mặc định thì về đúng ảnh cũ;
  - camera đứng yên thì hạt đứng yên (vùng vách, hai lần đọc cách nhau bốn nhịp rAF, giống hệt); kéo chuột 30 px (`goc` > 5, poll tới 60
    giây; kéo bằng `dragCamera`, xem **CI** dưới) thì hạt khác lóe lên;
  - Giấy dó trơn bật thì ảnh đổi, tắt thì về đúng ảnh cũ;
  - trọng số lệch nhau: Bản màu về 0 thì vùng vách y nguyên (giấy không đọc bảng màu); Phủ bóng về 0 thì giấy sáng hơn, dưới 0,97 (không
    cháy trắng) và vẫn ngà (đỏ hơn lam 10).
- Đàn gà (`e2e/dan-ga-me-con-dan-ga.spec.js`, live, chờ bằng poll theo số đo):
  - giảm chuyển động (không có gà mẹ bới): chờ các con ở nhúm lúc mở trang bắt đầu rồi thôi mổ (`dangAn` > 0 rồi về 0: lúc mới mở trang
    chưa con nào mổ, chờ số 0 ngay lúc ấy là chờ suông), chạm giữa sàn (xa mép, xa mẹ) thì `rac` tăng, rồi `dangAn` > 0;
  - trước khi giữ, `quanhMe` ≤ 4; giữ trên vách thì `quanhMe` ≥ 8; thả thì về ≤ 4;
  - mài Đàn gà về 0 khi thóc đang rơi rồi chạm: không lỗi console, phủ lại thì `rac` không đổi (không có nắm cũ bung ra).
- Tranh tự khép lại: lúc mở trang `goc` < 1; kéo camera (`dragCamera`) thì `goc` > 15 (poll tới 60 giây); buông tay rồi chờ (poll tới 90
  giây) thì `goc` < 1, và hai nhịp sau vẫn < 1. Giảm chuyển động: camera về MỘT bước khi đủ 3 giây cảnh; `goc` ghi ở mỗi khung rAF, mọi
  mẫu hoặc còn ở chỗ buông (≥ mẫu đầu − 1°) hoặc đã ở nhà (≤ 1°), không mẫu nào lượn ở giữa.
- Chất lượng (`e2e/dan-ga-me-con-chat-luong.spec.js`): `?level=cao` đúng mức và draw call ≤ 30; `?level=thap` chạy được, đúng mức và đúng
  ngân sách (24 vòng, 1024 hạt), vách giấy sáng hơn ván trên ít nhất 0,15; bật rồi tắt sáu thí nghiệm của năm lớp riêng không có lỗi console.
- E2e chạy live và chờ rộng tay như Bức 3, vì đồng hồ của cảnh theo khung vẽ: trần 180 giây mỗi test (Đàn gà 240 giây; nhóm "khung" giữ
  trần mặc định 60 giây).
- `e2e/lat-tranh.spec.js` thêm Bức 3 ⇄ Bức 4; `e2e/phong-tranh.spec.js` đếm bốn mục.

**CI:** nhóm e2e theo bức tự có job của Bức 4 (§19.9). Đo thời gian thật ở lượt CI đầu. Job WebGPU quá trần thì bật `ciWebgpuSmoke` cho
Bức 4, như Bức 3.
- (Sau GĐ 8) **Thời gian thật**, lượt CI đầu của PR #9 (run 37586738134, tính cả bước cài đặt):

  | Nhóm | `e2e` (chặn) | `e2e-webgpu` (không chặn) |
  |---|---|---|
  | Ao Sen Đêm | 19,2 phút | 27,0 phút |
  | Đèn Kéo Quân | 8,7 phút | 9,5 phút |
  | Cung Quế | 26,3 phút | 5,0 phút (chỉ test khói) |
  | Đàn Gà Mẹ Con | 21,5 phút; 41 qua, 1 hỏng (chữ trên ván tối, cả hai lần chạy) | 28,1 phút; 37 qua, 4 hỏng |
  | `chung` | 0,7 phút | 0,6 phút |

  - `build` 0,9 phút. Ba bức đầu xanh ở cả hai job.
  - **Chữ trên ván tối** (hỏng ở cả hai job): sáu khung nằm trong MỘT test, đổi cỡ trên trang đang chạy live, nên quá trần 180 giây (lần
    chạy lại cũng vậy). Ở khung lớn (1920 × 1080) SwiftShader vẽ mỗi khung lâu, và ảnh chụp canvas, `page.evaluate` đọc ảnh phải chen giữa
    các khung ấy. Sửa: mỗi khung một test (mỗi test một trần 180 giây), và trang đứng yên lúc chụp, đọc ảnh: mở ở 640 × 400 với
    `?freeze=10` như mọi test khác (khởi động, khung ẩn và mười khung đều ở cỡ nhỏ), đổi cỡ, rồi `__sma.restore({})` vẽ lại khung đứng
    yên ở cỡ mới, một lần vẽ ở cỡ lớn. Giữ đủ sáu khung và mọi ngưỡng. Ở máy local (Mac M2, SwiftShader) mỗi test mất 5–8 giây với
    WebGL2, 6–26 giây với WebGPU.
  - **Kéo camera** (chỉ job WebGPU: hạt điệp theo góc nhìn, hai test tranh tự khép lại): `goc` đứng ở 0 suốt 15 giây chờ. Không phải chờ
    chưa đủ: camera không xoay. Chuột của Playwright đợi một nhịp khung mỗi sự kiện (Phụ lục A.51), nên lần dời đầu tới sau lần xuống
    một khung. Khung của Bức 4 trên runner WebGPU lâu hơn `GESTURE.holdMs` (350 ms; suy từ `goc` 0 và từ lần tái hiện dưới đây), nên hẹn
    giờ "giữ" của `input.js` nổ trước, cú kéo thành cú giữ, và camera bị khóa (`controls.enabled = false`). Tái hiện ở máy local (WebGL2
    SwiftShader) bằng cách kẹt mỗi khung rAF 500 ms: lần dời đầu tới sau lần xuống 2 giây, `goc` lớn nhất 0; không kẹt thì 70 ms, `goc`
    69,7°. Sửa: `dragCamera` của `e2e/dan-ga-me-con.helpers.js` phát PointerEvent ngay trong trang (các lần dời đi ngay sau lần xuống,
    nhấc sau `swipeMs`), như `tapAt`, `swipeAt`; khung kẹt 500 ms thì `goc` vẫn tới 69,7°. Poll `goc` (> 15, > 5) chờ tới 60 giây thay cho
    15. Ngưỡng giữ nguyên.
  - **`ciWebgpuSmoke: true` cho Bức 4** (plan Task 13): job WebGPU mất 28 phút, gần trần 40, mỗi test chậm hơn ở job chặn tới 1,8 lần,
    mà gần như cả bộ trùng với job chặn. Từ đây job WebGPU của Bức 4 chỉ chạy bảy test khói: góc nhìn của tranh, độ sâu của camera trực
    giao, Bản nét về 0 (nét trong), Giấy điệp về 0, chạm rắc thóc, mức cao (draw call), tranh tự khép lại. Ở lượt đầu, sáu test đầu qua
    trên WebGPU trong chừng 3,7 phút (21–66 giây mỗi test); test thứ bảy là test kéo camera vừa sửa. Ở máy local (WebGPU SwiftShader) cả
    bảy qua, 10–21 giây mỗi test. Job chặn (WebGL2) vẫn chạy đủ.

**Kiểm tay** (thêm vào §12):
- Bức 4 trên điện thoại thật: tờ tranh vừa bề ngang; dùng ngón tay để chạm rắc thóc, giữ, kéo rồi xem tranh tự khép lại;
- VoiceOver đọc dải link (Bức 3 ⇄ Bức 4), và Phòng tranh có bốn mục;
- Bao duyệt thơ, hình gà và poster.

### 20.10 Cách làm GĐ 8
Như GĐ 6 và GĐ 7 (§18.9, §19.10): làm thẳng trên nhánh `gd8-dan-ga-me-con`, vừa làm vừa sửa.
1. **Plan gọn.** Mỗi task ghi mục tiêu, file, test viết trước, cách kiểm bằng chạy thật. Code đầy đủ chỉ có ở chỗ khó: camera trực giao, độ
   sâu, tự khép lại, dò cạnh, bể hạt và việc chuyển Bức 1, luật của thóc, dạng đóng của đàn gà. Bao xem plan và chọn cách thực thi.
2. **Task rủi ro nhất làm trước:** camera trực giao trong xưởng, độ sâu đúng, và Bản nét dò cạnh trên một Bức 4 khung (tờ giấy cong, vài
   khối giữ chỗ), chạy thật trên WebGPU (GPU thật) và WebGL2 (SwiftShader).

   **Luật dừng:** một trong bốn điều sau không đạt thì dừng, báo Bao, và chọn đường lùi (§20.11):
   - camera trực giao vẽ đúng ở cả hai backend, và chạm trúng đúng điểm trên sàn;
   - view Độ sâu có độ dốc (không phải bóng trắng), ở cả hai backend;
   - Bản nét lấy mẫu lân cận của texture độ sâu ở cả hai backend, mà số draw call không tăng;
   - trên Mac M2, 1280×800, DPR 2, mức cao: ≥ 60 khung/giây.
3. **Task rủi ro thứ hai:** bể hạt và việc chuyển Bức 1.

   **Luật dừng:** mã của đom đóm không giống fixture (sau khi thay id) thì dừng và báo Bao. Đường lùi là giữ nguyên Bức 1, chỉ Bức 4 dùng
   bể chung (§20.11).
4. Tranh tự khép lại; Sổ tay hiện code của hộp màu.
5. Hình gà, bố cục, tờ giấy, Bản màu, camera.

   **Điểm duyệt ảnh giữa chừng** (một trang ảnh riêng tư): góc nhìn của tranh trên máy tính và điện thoại dọc, ba góc xoay, từng lớp. Bao
   duyệt trước khi làm các lớp còn lại. Hình là số trong `parts/cot-hinh-ga.js` và `parts/cot-bo-cuc.js`, nên sửa rẻ.
6. Bản nét đủ (nét trong, lệch bản); Giấy điệp; Đàn gà (thóc, đàn gà, cử chỉ, gà mẹ bới); trang và Phòng tranh (`npm run pages`); chữ của
   Sổ tay và sơ đồ; e2e; lượt màu; poster. Task nào cũng có test viết trước và chạy thật. Chỗ nào làm khác spec thì sửa spec trong cùng
   task.
7. Review cuối cả nhánh, đối chiếu thơ, rồi hỏi Bao trước khi push, và hỏi lại trước khi merge (merge là deploy).

### 20.11 Rủi ro riêng
- **Còn chỗ khác trong xưởng ngầm coi camera là phối cảnh**, ngoài độ sâu. Ví dụ, hướng nhìn tự tính trong shader
  (`cameraPosition − positionWorld`) sai với camera trực giao.
  - Cách tránh: Bức 4 dùng `positionViewDirection`, vì three tự xử lý camera trực giao (Phụ lục A.91). Task đầu soát lại cả xưởng bằng
    một cảnh khung chạy thật.
- **Dò cạnh chỉ trên độ sâu bỏ sót nét:** hai mặt chạm nhau mà cùng độ sâu thì không có bậc.
  - Cách tránh: ngoài bậc (độ lệch khỏi mặt phẳng), Bản nét đo góc gãy của mặt, nên bắt cả nếp gấp (§20.4 lớp 3); nét trong vẽ trong
    shader. Chỗ nối nông (cánh gà mẹ áp sát sườn, 13–20°) không có nét trên độ sâu: nét trong vẽ viền cánh ở đó, đo tới mặt khối mình co lại
    theo số vòng (§20.4 lớp 3).
  - Nếu vẫn thiếu: thêm kênh normal vào MRT từ đầu cho bức cần (một trường tùy chọn mới, biên dịch một lần lúc dựng). Việc này để ở §16.
- **Dò nếp gấp vẽ cả mặt đa diện:** khối cầu của gà là đa diện; đo độ đổi độ dốc thì gần mép khối, nơi mặt nghiêng gần 90°, hai mặt kề
  nhau cũng thành nét (GĐ 8 Task 4).
  - Cách tránh: đo góc gãy của mặt (§20.4 lớp 3); `segments` theo mức (32, 28, 24: §20.8), khối dẹt (cánh, bàn chân) nhiều vòng hơn
    (`detail`, §20.4 lớp 1).
- **Lấy mẫu texture độ sâu ở WebGL2.** View Độ sâu đã đọc texture này ở cả hai backend từ GĐ 4, nên lấy mẫu ở điểm lân cận chỉ là cùng
  phép đọc. Nếu hỏng: bọc `convertToTexture`, thêm một lượt vẽ như FXAA.
- **Bức 1 đổi ảnh khi rút bể hạt.**
  - Cách tránh: test so mã với fixture ghi TRƯỚC khi rút; chạy lại đủ e2e của Bức 1.
  - Đường lùi: Bức 1 giữ code cũ, chỉ Bức 4 dùng `lib/tsl/particles.js`, và §16 ghi việc chuyển Bức 1 để sau.
- **Ảnh sáng làm hỏng chữ và test chung:** chữ màu ngà trên giấy không đọc được; test chung đòi đủ điểm tối.
  - Cách tránh: tờ giấy chỉ chiếm chừng 58% bề cao, chữ nằm trên ván tối (e2e "chữ trên ván tối", §20.1).
  - Mài về Cốt thì giấy thành đất sét, nên độ sáng trung bình vẫn dưới 0,8.
- **Dạng đóng của đàn gà phức tạp** khi các mốc chồng nhau (rắc trong lúc giữ, giữ trong lúc đang chạy tới). Cách tránh: một thứ tự ưu tiên
  duy nhất (§20.5), test vị trí liên tục ở mỗi mốc, tối đa 32 mốc.
- **Gà mẹ là vật cản của đàn gà dạng đóng** (§20.5): không có luật thì gà con lún vào mẹ (đo trước khi có: chạm đều khắp sàn thì 27%
  số cú chạm có con lún lúc mổ, chạm lên vách sau lưng mẹ thì 87%), chạy xuyên thân mẹ, và tới chỗ núp thì mặt quay vào mẹ (59 trong 60
  lần giữ sau bốn cú chạm có khung lún).
  - Cách tránh: ba luật của §20.5 (nắm dời ra bên cạnh mẹ, đường vòng qua đầu hay đuôi mẹ, điểm dừng rồi lùi vào chỗ núp); test đo từng
    khung bằng chỗ thật của khối (`cot-hinh-ga`, `dan-ga-tranh-me`).
  - Còn lại: nắm người chạm lên mẹ hay vách rơi bên cạnh mẹ chứ không ở chỗ chạm (thóc rơi ở đầu hay đuôi mẹ, cách 2–4 đơn vị); gà con
    tới chỗ núp lâu hơn chừng nửa giây (quay tại chỗ, lùi vào); sau lưng mẹ sàn hẹp nên ở đó không có vòng gà con nào. Chạm sát mép sàn thì
    thóc rơi vào trong tới 1,25 theo mỗi trục (tâm vòng; chạm đúng góc thì chừng 1,8 theo đường chéo). Sân đông thì nắm mới có khi không
    con nào tới: vòng không nở, spacing không nới.
- **Thóc quá nhỏ trên điện thoại:** 0,08 đơn vị là chừng 2 điểm ảnh ở 390×844. Cách tránh: cỡ hạt có sàn theo điểm ảnh (chia theo
  `u.resolution` và zoom).
- **Tranh tự khép lại đánh nhau với quán tính của OrbitControls:** `end` đến khi buông tay, nhưng damping còn quay thêm một lúc, và phần
  quay dở ấy tắt theo số lần `update()`, không theo giây (Phụ lục A.98). Ở 60 khung/giây, sau `after` (3 giây) chỉ còn chừng 1/10 000; ở máy
  vẽ chậm (dt kẹp 0,1 s, chừng 10 khung/giây) còn hơn 10% sau 4,2 giây cảnh, và camera trôi ra khỏi nhà sau khi đã về.
  - Cách tránh: `home.js` đặt `dampingFactor` theo dt của khung (§20.6 mục 3), nên `after` luôn dài hơn thời gian damping tắt ở mọi nhịp khung;
    khi quay về thì đặt thẳng góc và zoom, rồi gọi `controls.update()`.
  - Test: unit với OrbitControls thật ở 10, 30 và 60 khung/giây (camera không trôi sau khi về); e2e `goc` < 1 là bằng chứng tích hợp.
- **AgX làm giấy xám:** chỉnh ở lượt màu (`exposure`, tone của Phủ bóng). Đã chỉnh (GĐ 8 Task 11): ACES, lộ sáng 1,2 (§20.3).
- **Hàng rào từ vựng bắt nhầm:** `hen` là chuỗi con của `denThen`, nên đã bỏ khỏi fence (§20.6).

## 21. Bản dịch và Link công thức (GĐ 9)

> Hai công cụ học cho cả bốn bức. **Bản dịch:** code TSL của một lớp thành mã shader thật mà GPU chạy, và trọng số, núm của lớp nằm ở dòng
> nào trong mã ấy. **Link công thức:** mài, chỉnh xong thì gửi được đúng bức tranh ấy bằng một link.

**Nơi ở:** cả hai thuộc xưởng (`src/engine/`, `src/ui/`): không biết có bức nào, không đổi gì trong bốn bức. Những gì Bao đã chọn nằm ở §1
(GĐ 9); phần còn lại do Claude quyết, Bao duyệt khi đọc spec.

**Điều mới so với các giai đoạn trước:**
- Lần đầu Sổ tay hiện thứ do GPU dịch ra lúc chạy, không phải file trong repo: code sống (§7) là code JS lúc build; bản dịch là WGSL hay
  GLSL mà three sinh ra trên chính máy người xem.
- Lần đầu hash của URL mang trạng thái tác phẩm, như §8.7 đã giữ chỗ từ GĐ 0: `#r=…`.
- **Sửa kèm một lỗi có từ GĐ 4** (§21.3 "Normal lúc cảnh đang chạy"): chọn view Normal của Kính mài khi cảnh không đứng yên làm quad cuối
  vẽ vào render target của scene pass trong lúc biên dịch. Giữ khung (`hold.js`, §21.3) sửa nó.

### 21.1 Bản dịch: người xem thấy gì

Ở **Sổ tay › Chỉnh**, chỉ ở bản 3D (tầng tĩnh không có renderer, nên không có Bản dịch).
- Hàng nút tên file có thêm nút cuối **"Bản dịch"**. Hàng nút luôn hiện ở bản 3D, kể cả khi lớp chỉ có một file. Bấm vào thì khung code đổi
  sang mã shader; bấm tên một file thì về code JS như cũ.
- Trên khung:
  - ô chọn **Vật** (`<select>` có nhãn): những nơi lớp có mặt (dưới đây);
  - hai nút **Đỉnh / Điểm ảnh** (`aria-pressed`): vertex shader hay fragment shader. Mặc định là phần có nhiều dòng của lớp hơn; bằng nhau
    thì Điểm ảnh;
  - một dòng trạng thái (`aria-live`): "WGSL · WebGPU · 412 dòng · 6 dòng có lớp Sương". WebGL2 thì "GLSL ES 3.0 · WebGL2". Vùng này luôn
    nằm trong cây và không có tổ tiên nào `hidden` (chữ điền cùng nhịp với lúc bỏ `hidden` thì VoiceOver bỏ qua); trống thì CSS thu lại
    bằng `:empty`. Chỉ ô Vật, hai nút và dòng nhắc ẩn, tới khi có gì để chọn;
  - một dòng nhắc, cố định cho mọi lớp trừ Cốt: "Mài lớp này chỉ đổi số trong `w_suong`: mã không đổi, nên không biên dịch lại." (luật 2
    của kỹ thuật, thấy tận mắt).
- Mã hiện theo dòng, có số dòng, tô màu bằng bảng sơn mài (§21.5). Dòng dài (mã sinh ra có dòng gần 1.000 ký tự) thì xuống dòng, thụt vào
  sau số dòng.
- Dòng có uniform của lớp có vạch vàng lá bên trái. Uniform của lớp là:
  - trọng số `w_<id>` (`layers.js#createWeights`, gạch nối thành gạch dưới);
  - núm `uniform`: `<id>_<knobId>` (`knob-set.js#uniformName`). Núm `js`, `rebuild` không có uniform: rê lên chúng chỉ sáng code JS, như
    trước.
- Rê một núm (`onHover` của Tweakpane, như code JS đang làm): sáng đúng các dòng có uniform của núm ấy, và khung mã cuộn tới dòng đầu.
  Dòng ấy nằm ở 1/3 phần khung mà người xem THẤY: tab Chỉnh dài hơn màn hình laptop (bảy núm cộng đầu khung Bản dịch), nên khung hay thò
  xuống dưới đáy Sổ tay, và 1/3 cả khung là chỗ bị cắt (đo trên Bức 1 ở 1280 × 800).
- Mở Bản dịch: "Đang dịch…" tới khi khung vẽ kế tiếp xong. Xưởng đọc mã của chính khung ấy (§21.3): cảnh không khựng, không giữ khung;
  dưới `?freeze`, khung đứng yên được vẽ lại một lần.
- Đổi núm hay bật thí nghiệm lúc Bản dịch đang mở thì dịch lại (chờ 300 ms sau thay đổi cuối): núm `rebuild` hay thí nghiệm có thể đổi
  material, nên mã đổi. Dịch lại KHÔNG xóa khung: nơi đang xem, phần Đỉnh/Điểm ảnh và núm đang sáng ở nguyên chỗ, dòng "Đang dịch…" không
  hiện, và mã y hệt thì khung không vẽ lại, dòng trạng thái không ghi lại (kéo một núm `uniform` không đổi mã, nên không có gì nhấp nháy,
  trình đọc màn hình không đọc lại câu cũ). Chỉ cú bấm "Bản dịch" xóa khung và bắt đầu lại từ nơi đầu tiên.

**Những nơi lớp có mặt.** Nhiều lớp không có vật riêng (`objects: []`): Sương góp vào shader của lá sen, Bản màu của Bức 4 góp vào material
của đàn gà, Bản nét và Phủ bóng nằm trong lượt hậu kỳ. Nên danh sách Vật không lấy từ `layer.objects` của riêng lớp:
- xưởng đọc mã của mọi **vật vẽ được** của bức trong khung bắt được: Mesh, InstancedMesh, Sprite, Points, Line có material, tìm trong
  `objects` của mọi lớp, kể cả con của một Group; mỗi cặp (vật, lượt vẽ) một mục; vật của chính lớp mà khung ấy không vẽ vẫn có mục (không
  có mã: dòng trạng thái là "Vật này không được vẽ ở khung vừa rồi (đang ẩn hay ngoài khung nhìn).", khung mã trống, hai nút Đỉnh/Điểm
  ảnh bị khóa). Vật không lớp nào giữ chỉ thành mục khi mã có uniform của lớp. Cộng một mục **"Lượt cuối · hậu kỳ"**: quad của RenderPipeline
  (§21.3);
- giữ những mục mà mã có uniform của lớp (so cả tên, `\b<tên>\b`, không so tiền tố). Thứ tự: vật của chính lớp, rồi vật của các lớp khác
  theo thứ tự phủ, rồi vật không lớp nào giữ, rồi lượt cuối;
- nhãn: nhãn vật của lớp chủ (`content.layers[chủ].objects[tên]`, như Từng sợi) · tên lớp chủ, ví dụ "Lá sen · Cốt". Group có nhiều material
  thì thêm "(1/3)"; vật thiếu nhãn thì dùng tên vật;
- lớp không có uniform nào trong mọi mã (chỉ đổi cảnh bằng JS) thì hiện vật của chính nó, kèm câu "Lớp này đổi cảnh bằng JS: trọng số và
  núm của nó không vào shader." Lớp không có vật nào và không có uniform trong mã: chỉ câu ấy.

**Để sau** (§16): mã compute (đom đóm, thóc: three không có API công khai để lấy mã compute); bản dịch theo từng sợi của Từng sợi.

### 21.2 Link công thức: người xem thấy gì

**Dạng link** (đọc được, sửa tay được):
`https://giabao2610.github.io/son-mai-anh-sang/#r=suong:0,mat-nuoc:0,suong.density:0.02,phu-bong.toneMapping:aces,gio:23`
- `#r=` rồi các mục `khóa:giá trị` cách nhau bằng dấu phẩy. Khóa:
  - `<layerId>`: trọng số (đích của tween, như `snapshot()`), 0–1;
  - `<layerId>.<knobId>`: núm;
  - `<dialId>`: Dial (núm của cả bức).
- Giá trị:
  - số: ghi ngắn nhất, làm tròn theo số chữ số thập phân của `step` (tối đa 4; trọng số 2), bỏ số 0 thừa: `0.02`, `23`, `-1.5`;
  - bool: `1` / `0`;
  - select: id của lựa chọn (`aces`);
  - màu: 6 chữ số hex, không `#` (dấu `#` thứ hai trong URL không hợp lệ): `ffcc66`.
- Chỉ ghi những giá trị **khác mặc định**; thứ tự cố định: trọng số theo thứ tự phủ, rồi núm theo lớp và theo thứ tự khai báo, rồi Dial.
  Nên hai người mài giống nhau ra cùng một link, và bức nguyên bản không có `#r=`.
- Mặc định là của **máy đang xem**: trọng số 1; núm là `value` đã chuẩn hóa theo tầng và mức của máy này; Dial là giá trị ngay sau
  `setup()` (Bức 1: giờ của "bây giờ", ban ngày thì 21:00; Bức 3: ngày âm lịch hôm nay). Nên link không mang giờ nếu người gửi không kéo
  thanh giờ: người nhận thấy đêm của chính họ.

**Lấy link:**
- Mục **"Công thức"** trong thanh lớp, ngay dưới Đồ nghề: nút "Chép link công thức".
  - Link = `origin + pathname + #r=…`: **bỏ query string**. Cờ là môi trường của máy người gửi (`?debug`, `?level=thap`, `?freeze`), không
    phải tác phẩm.
  - Chép bằng `navigator.clipboard.writeText`; dòng trạng thái (`aria-live`): "Đã chép link", tự xóa sau 4 giây. Chép không được (trình
    duyệt chặn): hiện link trong một ô chỉ đọc đã chọn sẵn, kèm "Chưa chép được: link ở ô dưới".
- **Thanh địa chỉ tự mang công thức:** mỗi lần trọng số, núm hay Dial đổi, xưởng ghi lại hash bằng `history.replaceState` (§21.4). Tải lại
  trang không mất việc đang mài; bookmark hay chép thẳng từ thanh địa chỉ đều được. `replaceState` giữ nguyên query string của trang đang mở
  và không thêm mục vào lịch sử (nút Back không phải bấm qua từng lần mài).

**Mở một link có công thức:**
- Cảnh hiện thẳng theo công thức: công thức áp lúc dựng, trước lần biên dịch đầu (§21.4), nên poster hòa sang đúng bức đã mài.
- Thanh lớp mở sẵn, **không** vào chế độ mài (không tween mọi lớp về 0). Đầu thanh có một dòng tóm tắt và nút **"Về nguyên bản"**:
  "Công thức trong link: 2 lớp đã mài · 3 núm đã chỉnh · giờ 23:00". Phần nào bằng 0 thì bỏ; Dial ghi bằng nhãn và chữ giá trị của nó
  (`content.dials[id].label`, `format`). Sổ tay vẫn đóng.
- Không có gợi ý "Chạm vào…" và lời mời "mài thử?" (thanh lớp đang mở).
- "Về nguyên bản": trọng số tween về 1 như công tắc của thanh lớp, núm và Dial về mặc định ngay, hash về trống, dòng tóm tắt biến mất (vùng
  `aria-live` để trống, không `hidden`).
- Đóng thanh lớp vẫn như cũ (§4.1): mọi lớp phủ lại, núm và Dial giữ nguyên; hash theo đó còn núm và Dial.
- Đang xem mà hash đổi (dán link khác vào cùng tab, sửa tay, Back/Forward): áp công thức mới thành **trạng thái đủ** (mọi thứ không có
  trong link về mặc định), và thanh lớp mở với dòng tóm tắt mới. Hash trống: như "Về nguyên bản".
- Ở tầng tĩnh: không áp (không có gì để mài). Lời giải thích của trang tĩnh thêm câu "Link này có công thức mài; công thức chỉ áp được ở
  bản 3D."
- Mục hỏng (khóa lạ, giá trị sai kiểu, lựa chọn không có) thì bỏ, kèm MỘT dòng `console.warn` liệt kê; các mục còn lại vẫn áp. Công thức
  không bao giờ đưa trang về tĩnh. Giá trị vượt trần của máy này thì kẹp (`normalizeKnob`), như kéo núm.

**Công thức không mang** (§16): thí nghiệm đang bật, công cụ đang bật, góc camera, mức chất lượng.

### 21.3 Xưởng: đọc mã lúc vẽ (`engine/gpu/draws.js`, `engine/gpu/translate.js`)

**Bắt lúc vẽ.** Mã của một nơi là chuỗi mà three đã dịch cho chính RenderObject nó vừa vẽ, không phải một lần dịch riêng. Cách đầu tiên của
spec (`renderer.debug.getShaderAsync` trong ngữ cảnh của scene pass, giữ khung suốt lần đọc) không qua luật dừng của Task 2 (§21.9, Phụ lục
A.102); ngày 2026-10-09 Bao đồng ý đường lùi này. Móc lần vẽ của GĐ 5 (`draws.js`, chỗ duy nhất đặt `setRenderObjectFunction`) có thêm
`capture()`: Promise mã của khung vẽ KẾ TIẾP giữa `begin()` và `end()`. Trong khung ấy, ngay sau mỗi lần vẽ, móc tìm lại RenderObject đúng
như `Renderer._renderObjectDirect` tìm lúc vẽ, rồi đọc chuỗi mã đã dịch của nó:

```js
renderer._objects.get(object, material, scene, camera, lightsNode, context, clippingContext, passId).getNodeBuilderState()
// → { vertexShader, fragmentShader }: chuỗi mà Pipelines đã dùng làm khóa của program GPU (A.103)
```

- `context` là `renderer._currentRenderContext` lấy LÚC VÀO móc: lần vẽ lồng bên trong (phản chiếu, scene pass vẽ trong lần vẽ quad cuối)
  đổi rồi trả nó. Cùng tham số với lần vẽ thì ra đúng RenderObject ấy, không tạo mới; NodeBuilderState của nó đã dựng lúc vẽ, nên chỉ đọc
  chuỗi: không dựng, không biên dịch, không thêm program nào. Hai trường riêng (`_objects`, `_currentRenderContext`) chỉ `draws.js` đọc;
  test ghim lời gọi của `_renderObjectDirect`, `QuadMesh.isQuadMesh` và `RenderObject.getNodeBuilderState` với three 0.186.1 (§21.8).
- Lần vẽ của camera chính (scene pass) vào danh sách `scene`, kể cả lần mà Từng sợi đang bỏ (`limit(k)`: RenderObject đã có từ các khung vẽ
  đủ trước). Lần vẽ ngoài cùng của camera khác mà là `QuadMesh` vào danh sách `post`: quad cuối của RenderPipeline, dịch đúng như
  `RenderPipeline.render()` vẽ nó (tone mapping tắt, `_vertexNode` của QuadMesh), vì đó chính là lần vẽ ấy. Phản chiếu (lần vẽ lồng của camera
  khác) không bắt; bóng đổ, bloom và RTT tự cất móc (A.53), nên móc không thấy chúng.
- Đọc một vật hỏng thì mục ấy có `error`; khung và móc chạy tiếp. `render()` ném lỗi (không tới `end()`) thì lần bắt chờ khung sau. Gỡ cảnh
  (`draws.dispose()`, disposer của `scene.js`) thì lần bắt còn chờ hỏng, kèm câu tiếng Việt.
- Móc chỉ gắn khi có người cần: Từng sợi bật, hay còn lần bắt đang chờ. `capture()` gắn ngay, để khung kế tiếp đi qua móc; khung bắt xong thì
  gỡ, trừ khi Từng sợi đang bật. `start()`, `stop()` và `capture()` dùng chung một lần gắn: không gắn hai lần, không gỡ của nhau, không mất hàm
  vẽ trước đó. `list()`, `limit()`, `counts()` của Từng sợi không đổi. Lúc không ai cần, cảnh không tốn gì.

**Một bản dịch là một khung.** `translate.js#createTranslator({ renderer, draws, redraw, layers, meta, content, postLabel })`:
`translation(layerId)` gắn lần bắt rồi gọi `redraw()` trong một `Promise.all` (redraw hỏng thì bản dịch hỏng theo, và lần bắt bị làm hỏng sau
đó khi gỡ cảnh vẫn có người nghe). Dưới `?freeze`, `redraw()` vẽ lại khung đứng yên một lần và khung ấy được bắt; lúc cảnh chạy, nó xong ngay
và khung kế tiếp của vòng lặp được bắt. Không giữ khung; không đổi target, MRT hay tone mapping; không nhớ mã: mở lại là bắt một khung mới, nên
mã luôn là mã đang chạy (núm `rebuild`, thí nghiệm hay view Normal đổi biến thể thì lần dịch sau thấy ngay).

**Những nơi, theo thứ tự cố định** (không theo thứ tự vẽ: three sắp vật đục theo độ sâu, camera dời là đổi):
- mỗi vật vẽ được của các lớp theo thứ tự phủ (`drawablesOf`: Mesh, InstancedMesh, Sprite, Points, Line có một material, kể cả con của một
  Group), một nơi cho mỗi lần vẽ đã bắt của vật ấy. Vật của CHÍNH lớp mà khung ấy không vẽ vẫn có một nơi: `drawn: false`, không có mã;
- vật không lớp nào giữ: chỉ khi mã có uniform của lớp (`owner` null, nhãn là tên vật hay loại);
- quad cuối, sau cùng: "Lượt cuối · hậu kỳ" (`post: true`; thêm "(i/n)" nếu có nhiều). Mã ấy gồm mọi phần hậu kỳ ghép vào lượt cuối (Bản
  nét, Phủ bóng, overlay của công cụ đang bật); bloom và FXAA có lượt vẽ riêng bên trong node của chúng, không nằm trong mục này;
- khóa: `<object.id>:<passId>` (vật trong suốt có transmission vẽ hai lượt, mỗi lượt một nơi) và `post:<i>`: bền qua các lần dịch, để Sổ tay
  giữ chỗ người xem đang xem;
- giữ những nơi mà mã có uniform của lớp, cộng nơi đọc hỏng; vật của chính lớp lên đầu. Không nơi nào có thì trả vật của chính lớp, `jsOnly`.

**Giữ khung** (`engine/gpu/hold.js`, file mới; một bộ giữ cho mỗi cảnh, `scene.js` dựng trước pipeline). Bản dịch không dùng nó: chỉ còn
`pipeline.compile()` (biên dịch lại giữa chừng, mục dưới). Lúc đang giữ, `step()` bỏ khung, nên lần bắt chờ tới khung vẽ đầu tiên sau khi thả.
- `hold.run(fn)` chạy việc async trong lúc giữ và luôn thả (`finally`), kể cả khi `fn` ném lỗi; giữ lồng nhau được (đếm số lần);
  `hold.active`; `hold.idle()` là Promise xong khi không còn ai giữ; `hold.onRelease(cb)`;
- lúc giữ, `quality.sample()` trả `true` như lúc thử ngừng vẽ: `scene.step()` không vẽ, không tiến đồng hồ, ảnh cũ ở lại (luật của
  `CLAUDE.md`: việc mới trong `step()` đi qua đúng dòng đó). Thôi giữ thì `dt` của khung sau vẫn bị kẹp 0,1 s như mọi khung;
- `redraw()` của `?freeze` chờ `hold.idle()` rồi mới vẽ (Sổ tay đổi núm giữa lúc đang biên dịch);
- thôi giữ thì bộ điều chỉnh đo lại từ đầu (`tuner.guard(chế độ hiện tại)`, có khởi động 2 giây), nên quãng giữ không bao giờ thành một
  mẫu "khung chậm".

**Normal lúc cảnh đang chạy (lỗi có từ GĐ 4).** `views.require('normal')` thêm kênh normal vào MRT rồi biên dịch lại cả cảnh bằng
`scenePass.compileAsync(renderer)`. Hàm đó của three đặt target + MRT của scene pass, chờ `renderer.compileAsync`, rồi mới trả (A.105); vòng
lặp vẫn vẽ trong lúc chờ, nên quad cuối vẽ vào target của scene pass. Đo trên site thật ngày 2026-10-08 (headless Chromium, GPU thật, không
`?freeze`), bật Kính mài rồi chọn Normal:
- Bức 1, WebGPU: "Render pipeline creation failed … Color target has no corresponding fragment stage output", và hai "Lỗi GPU" (trần là ba
  lỗi trong một giây, quá là về tĩnh);
- Bức 1, WebGL2: mười bảy lần "GL_INVALID_OPERATION: glDrawArrays: Active draw buffers with missing fragment shader outputs";
- Bức 4, WebGPU: năm dòng lỗi như trên.

E2e của GĐ 4 không thấy vì luôn mở với `?freeze` (vòng lặp đã dừng). Sửa: `pipeline.compile()` chạy trong `hold.run`: cảnh đứng yên trong
lúc "đang mài…" (đo được 0,2 giây trên GPU thật ở WebGPU, 1 giây ở WebGL2), không khung nào vẽ với target sai. Lần biên dịch lúc mở trang
cũng đi đường này (chưa có vòng lặp nên không khác gì).

**Gỡ cảnh.** `translator.dispose()` thì lần dịch sau hỏng ngay; lần bắt đang chờ thì `draws.dispose()` làm hỏng (draws.js giữ chúng). Không có
bộ nhớ mã nào để bỏ.

**Bàn thợ.** `studio.translation(layerId)` → `Promise<Translation>` (không có tùy chọn: một bản dịch là một khung, không có tiến độ):
```js
/** [9] @typedef {{ language: 'wgsl' | 'glsl', backend: 'webgpu' | 'webgl2',
 *   uniforms: { weight: string | null, knobs: Record<string, string> },   // tên trong mã; Cốt: weight null (luật 1)
 *   places: { key: string, label: string, owner: string | null, own: boolean, post: boolean, drawn: boolean, vertex: string | null,
 *             fragment: string | null, hits: { vertex: number, fragment: number }, error?: string }[],
 *   jsOnly: boolean }} Translation   // jsOnly: không mã nào có uniform của lớp (places là vật của chính lớp) */
```
`__sma.translate(layerId)` trả đúng object đó (DevTools, e2e).

### 21.4 Xưởng: công thức

**`engine/recipe.js`** (đường nhẹ, hàm thuần, không three; `boot.js` import nó, nên luật của đường nhẹ áp: không built-in ES2022 trở lên):
- `readRecipe(hash)` → `{ entries: { key, value }[], problems: string[] } | null`: `null` khi hash không bắt đầu bằng `#r=`. Giải mã
  phần trăm, dài quá 2.048 ký tự thì bỏ cả công thức (một problem), tách theo dấu phẩy và dấu hai chấm đầu tiên. Khóa phải khớp
  `^[a-z0-9-]+(\.[A-Za-z][A-Za-z0-9]*)?$`, giá trị `^[A-Za-z0-9.+-]+$`; mục không khớp vào `problems`. Khóa lặp thì mục sau thắng.
- `writeRecipe(entries)` → chuỗi (không có `#r=`); `formatValue(kind, value, step)` theo luật của §21.2.
- Không biết bức nào: phân loại khóa (trọng số, núm, Dial) cần id của bức, nên làm ở phần nặng.

**`engine/gpu/recipe-set.js`** (công thức của một cảnh; `studio.js` đã 231 dòng nên phần này ở file riêng, như `dial-set.js`):
- `defaults`: chụp lúc dựng (trước khi áp công thức): trọng số 1; núm `normalizeKnob(knobValue(k, env))` theo `env` của máy này; Dial
  ngay sau `setup()`.
- `classify(entries)` → `{ weights, knobs, dials, problems }`: khóa có dấu chấm là núm (lớp và núm phải có thật; chuỗi đổi sang kiểu của
  núm: số, `1`/`0`, lựa chọn có trong `options`, `#` + hex); khóa không chấm là id lớp (trọng số 0–1; `cot` bỏ qua, luật 1) hay id Dial.
  Còn lại vào `problems`.
- `diff(snapshot)` → entries: chỉ giá trị khác `defaults` (số so sau khi làm tròn theo `step`, nên 0.0200000004 bằng 0.02).
- `countsOf(entries)` → `{ layers, knobs, dials }` cho dòng tóm tắt (`dials`: id các Dial đã khác mặc định).
- `recipeMethods(recipes, …)`: ba hàm `recipe`, `applyRecipe`, `reset` mà bàn thợ trải vào API của nó.

**Áp lúc dựng** (§16 đã ghi: "giải mã trước `createLayer`"):
- `boot.js` đọc `readRecipe(location.hash)` cùng lúc với cờ, đưa vào `run()` như `flags`; tầng tĩnh thì đưa vào `showStatic` (câu thêm của
  §21.2).
- `scene.js` phân loại sau `setup()` (id Dial chỉ có từ đó), rồi:
  - núm: `buildLayers` nhận giá trị ban đầu, `createKnobs(layerId, knobs, env, initial)` dùng `initial[id]` thay cho `knobValue()`; giá trị
    hỏng thì cảnh báo và dùng mặc định. Lớp đọc giá trị ban đầu bằng `ctx.knobValue(id)` như luật đã có, nên núm `rebuild` dựng MỘT lần với
    giá trị của công thức;
  - trọng số: `weights.set(id, v)` (không tween) ngay sau khi dựng lớp;
  - Dial: `dials.restore(…)` ngay sau `createDialSet`;
  - tất cả trước `scene.compile()`: lần biên dịch đầu đã là cảnh của công thức.
- `run.js`: lần mở trang có công thức thì lúc live mở xưởng không mài, kèm dòng tóm tắt, thay cho gợi ý và lời mời. "Dựng lại cảnh" vẫn đi
  đường `restore(snapshot)` như GĐ 2.

**Bàn thợ** thêm:
- `recipe()` → `{ text, counts: { layers, knobs, dials } }` (`text` không có `#r=`; rỗng là nguyên bản; `dials` là id);
- `applyRecipe(text)` → `Promise`: trạng thái đủ = `defaults` ghép công thức, đi qua `restore()` (trọng số đặt ngay; núm khác giá trị hiện tại
  thì set lần lượt; Dial); trả `{ counts, problems }`;
- `reset()` → `Promise`: về `defaults`, trọng số tween;
- `onChange(cb)` → hàm bỏ nghe: báo sau mọi `setWeight`, `setKnob`, `setDial`, `restore`, `applyRecipe`, `reset`. Không báo theo khung:
  tween không đổi đích.

**`engine/gpu/recipe-url.js`** (thanh địa chỉ; `run.js` gắn lúc live, gỡ bằng `disposer`; "Dựng lại cảnh" gắn lại với bàn thợ mới):
- nghe `studio.onChange`: chuỗi mới khác chuỗi đã ghi thì hẹn ghi, gộp các lần đổi trong 500 ms (WebKit ném `SecurityError` khi
  `replaceState` quá 100 lần trong 30 giây; 500 ms là tối đa 60 lần). Trang ẩn (`pagehide`, `visibilitychange`) thì ghi ngay phần còn hẹn;
- ghi: `history.replaceState(history.state, '', pathname + search + (text ? '#r=' + text : ''))`. Lỗi thì cảnh báo một lần và thôi ghi cho
  phiên đó; nút chép link vẫn chạy;
- nghe `hashchange` (`replaceState` không phát sự kiện này, nên chỉ thay đổi của người xem tới đây): `readRecipe` → `applyRecipe` → mở xưởng
  với dòng tóm tắt; hash trống thì `reset()`; hash khác dạng (không bắt đầu bằng `#r=`) thì bỏ qua.

**`__sma`** thêm `recipe()` (chuỗi `text`) và `applyRecipe(text)`, qua bàn thợ như mọi hàm khác.

### 21.5 Giao diện và chữ

**File mới ở `ui/`** (DOM thuần, không import engine hay three; mọi thứ của cảnh qua `studio()`):
- `ui/shader-text.js`: hàm thuần `shaderHtml(code, { uniforms })` → `{ html, lines, hits }` (`uniforms`: mọi tên uniform của lớp, trọng số và
  núm; mã rỗng hay `null` ra khung rỗng, 0 dòng; WGSL và GLSL dùng chung một bộ token nên không cần `language`). Escape TỪNG token lúc ghi
  ra, rồi tô:
  - từ khóa (WGSL: `fn let var const return if else for loop break continue struct switch case default discard`; GLSL: thêm `void in out
    uniform layout precision highp mediump`);
  - kiểu (`f32 i32 u32 bool vec2…4 vec2f… mat3x3 mat4x4 texture_2d sampler`; GLSL `float int vec2…4 mat3 mat4 sampler2D`);
  - số (`1`, `1.`, `.5`, `1e-3`, `2u`, `0x1Fu`), chú thích `//`, thuộc tính WGSL (`@location`, `@builtin`, `@group`, `@binding`, `@vertex`, `@fragment`);
  - uniform của lớp: `<span class="u-layer" data-u="<tên>">`; dòng có nó mang `is-layer`.

  Màu lấy từ theme của code sống (§7: chữ ngà trên đen then, từ khóa vàng lá…), cùng luật tương phản ≥ 4,5:1. Không kéo Shiki vào lúc chạy:
  Shiki và ngữ pháp WGSL/GLSL nặng hơn cả chunk của Sổ tay, mà mã sinh ra chỉ cần chừng ấy loại token.
- `ui/translation-view.js`: khung Bản dịch (ô Vật, hai nút Đỉnh/Điểm ảnh, dòng trạng thái, dòng nhắc, mã). `code-view.js` thêm nút "Bản
  dịch" và chuyển giữa hai khung; `light(knobId)` sáng cả dòng JS (như cũ) lẫn dòng của uniform trong Bản dịch đang mở. Kết quả của một
  lần dịch chỉ được dùng khi đó VẪN là lần dịch mới nhất và người xem VẪN ở Bản dịch (bấm tên một file không tăng bộ đếm lần dịch, nên
  chỉ xét bộ đếm thì kết quả về muộn đè lên code JS). Bộ đếm lần dịch TÁCH khỏi bộ đếm lần nạp của `show()` (chung một bộ đếm thì bấm "Bản
  dịch" của lớp cũ lúc file của lớp mới còn đang nạp làm `show()` tự bỏ cuộc, và hàng nút, khung, dòng trạng thái của lớp cũ ở lại dưới tên
  lớp mới); `show()` cũng tăng bộ đếm lần dịch (lần dịch còn chờ của lớp cũ thành vô hiệu) và khóa hàng nút cũ ngay từ đầu (`disabled`,
  bỏ `aria-pressed`; không dùng `inert`, tầng tĩnh chạy cả trên Safari 14) tới khi hàng nút mới thay vào; `hide()` của khung Bản dịch quên cả
  danh sách nơi. `code-view.js` đặt `refresh()` (300 ms, gộp lần gọi) vào sau mỗi thay đổi của núm
  hay thí nghiệm: `notebook.js#track` gọi nó, vì cả hai đều đi qua `track`.
- `ui/recipe-panel.js`: mục "Công thức" của thanh lớp (nút chép link, dòng trạng thái, ô link khi chép hỏng) và dòng tóm tắt + "Về nguyên
  bản" ở đầu thanh. `workshop.open({ recipe })` hiện dòng tóm tắt.

**Thứ tự Tab** không đổi (thanh lớp → thanh công cụ → Sổ tay, §7): dòng tóm tắt và mục Công thức nằm TRONG thanh lớp, Bản dịch nằm trong
tab Chỉnh.

**Điện thoại:** thanh lớp là một dải ngang (§7). Dòng tóm tắt thu thành một chip "Công thức · Về nguyên bản" trên dải; mục Công thức là một
nút trên dải, như nút của Dial. Bản dịch trong tấm trượt của Sổ tay: khung mã cuộn riêng, dòng dài xuống dòng.

**Chữ của xưởng** (`strings.vi.js`):
- `t.translation`: `button` "Bản dịch", `object` "Vật", `stages` "Phần của shader", `vertex` "Đỉnh", `fragment` "Điểm ảnh", `translating`
  "Đang dịch…" (chuỗi thường, không đếm), `status({ language, backend, lines, hits, layer })`, `weightHint(name)`, `jsOnly`, `post` "Lượt
  cuối · hậu kỳ", `notDrawn` "Vật này không được vẽ ở khung vừa rồi (đang ẩn hay ngoài khung nhìn).", `failed`;
- `t.recipe`: `title` "Công thức", `copy` "Chép link công thức", `copied` "Đã chép link", `copyFailed`, `summary(parts)`, `reset` "Về nguyên
  bản", `staticNote`.

Không có chữ mới trong `content` của các bức: nhãn vật đã có từ GĐ 5, nhãn Dial từ GĐ 4.

### 21.6 Hợp đồng và luật

- **Không có trường mới** trong hợp đồng của bức. `contracts/runtime.js` (JSDoc) thêm vào `Studio`: `translation`, `recipe`, `applyRecipe`,
  `reset`, `onChange`, và typedef `Translation`. `Snapshot` giữ nguyên.
- **Test hợp đồng** thêm hai luật cho mọi bức đã deploy, để chuỗi công thức không bao giờ mơ hồ:
  - id Dial không trùng id lớp nào (`gio:23` chỉ có một nghĩa);
  - id lựa chọn của núm `select` khớp `^[A-Za-z0-9-]+$` (không có dấu phẩy, hai chấm). Bốn bức hiện đều đạt.
- **Test luật** (`tests/rules/files.test.js`), như luật `setRenderObjectFunction` của GĐ 5:
  - chỉ `engine/gpu/draws.js` được đọc `_objects` và `_currentRenderContext` của renderer (tự kiểm: file ấy còn đọc cả hai);
  - không file nào trong `src/` gọi `getShaderAsync` (A.102: nó không trả mã của RenderObject đang vẽ).

  Luật "không đổi `renderer.toneMapping` lúc chạy" không có ngoại lệ nào: Bản dịch đọc quad cuối lúc RenderPipeline vẽ nó, không dịch lại.
- **Kích thước file:** `run.js` đã 248 dòng. Phần mở xưởng (lời mời, mở theo công thức) tách ra `engine/gpu/workshop-door.js` ở task thêm
  phần mở theo công thức (Task 6 của plan). `studio.js` không quá 250: phần công thức ở `recipe-set.js`.
- **`CLAUDE.md`** thêm mục GĐ 9: biên dịch giữa chừng trong lúc giữ khung (`hold.js`); Bản dịch bắt lúc vẽ (`draws.js#capture`, hai trường
  riêng của renderer, không `getShaderAsync`); dạng `#r=`, `replaceState` có gộp.

### 21.7 Chất lượng và hiệu năng

- Không thêm draw call, không tốn gì mỗi khung khi không dùng. Đồng bộ thanh địa chỉ chạy theo thay đổi, không theo khung.
- Bản dịch là MỘT khung, đo trên Mac M2 (headless Chromium, GPU thật, mức cao, `?freeze=10`, 2026-10-09):
  - từ lúc gọi tới lúc có kết quả (vẽ lại khung đứng yên một lần): 15–19 ms ở cả hai backend (Bức 1 Sương 19 ms WebGPU, 18 ms WebGL2;
    Bức 4 Bản nét 18 ms cả hai; Phủ bóng 15–16 ms); lúc cảnh chạy là khung kế tiếp của vòng lặp;
  - không giữ khung, không dựng, không biên dịch: số program của renderer trước và sau bằng nhau (Bức 1: 74 ở WebGPU, 67 ở WebGL2; Bức 4: 27
    ở cả hai);
  - khung bắt chỉ tra thêm một RenderObject cho mỗi lần vẽ và đọc chuỗi có sẵn; khung không bắt không tốn gì (móc không gắn);
  - sau khi dịch, khung hình không đổi (so checksum dưới `?freeze`) và cảnh vẽ tiếp (e2e).
- Không giữ mã giữa hai lần dịch: chuỗi chỉ sống trong Translation mà Sổ tay đang hiện (vài chục vật, mỗi vật vài chục kB chữ: dưới 2 MB).
- Công thức không đổi gì của bộ điều chỉnh: nấc, mức, trần của núm giữ nguyên luật GĐ 3–4 (giá trị trong link bị kẹp theo trần của máy này).

### 21.8 Kiểm thử

**Unit (Vitest, node; jsdom cho file `ui/`):**
- `recipe.js`: đọc/ghi qua lại cho mọi kiểu; thứ tự; làm tròn theo `step`; giải mã phần trăm; khóa lặp; mục hỏng vào `problems`; dài quá
  2.048; hash không phải `#r=` ra `null`; không dùng built-in ES2022 (luật đường nhẹ có sẵn).
- `recipe-set.js`: `defaults` theo `env` (trần theo mức), `classify` (lớp, núm, Dial, `cot`, lựa chọn lạ, màu), `diff` bỏ sai số dấu phẩy
  động, `counts`.
- `knob-set.js`: giá trị ban đầu từ công thức, kẹp theo trần, hỏng thì về mặc định kèm cảnh báo; `buildLayers` đưa đúng giá trị tới
  `ctx.knobValue`.
- `studio.js`: `applyRecipe` là trạng thái đủ; `reset`; `onChange` báo đúng một lần mỗi thay đổi; `recipe().text` rỗng ở nguyên bản.
- `recipe-url.js` (cửa sổ giả): gộp 500 ms; ghi giữ query string; `SecurityError` thì thôi ghi; `hashchange` áp công thức; hash trống thì
  `reset`; ghi của chính nó không quay về như một lần đổi.
- `draws.js#capture` (renderer giả có `_objects`, `_currentRenderContext`): Từng sợi tắt thì gắn, bắt, gỡ và trả đúng hàm cũ; Từng sợi bật
  thì móc, `list()`, `counts()` còn nguyên, và `stop()` lúc bắt còn chờ chưa gỡ móc; lần vẽ mà `limit(k)` bỏ vẫn được bắt; phản chiếu không
  bắt, quad cuối thì có (`post`); mã đọc bằng context lấy lúc vào móc; một vật đọc hỏng thì có `error`, vật khác vẫn có mã; `render()` ném
  lỗi thì bắt ở khung sau; gỡ cảnh thì lần bắt chờ hỏng.
- `translate.js` (móc giả): gắn lần bắt trước khi vẽ lại; thứ tự theo thứ tự phủ, không theo thứ tự vẽ; nhãn và `(i/n)`; vật của chính lớp
  mà khung không vẽ thì `drawn: false`; vật không lớp nào giữ chỉ khi có uniform; quad cuối sau cùng; hai lượt (`passId`) là hai nơi; `jsOnly`;
  WGSL/GLSL; lớp lạ; vẽ lại hỏng thì bản dịch hỏng mà không để lại lỗi lơ lửng.
- `hold.js`: `run` đếm lồng nhau, thả cả khi lỗi; `idle()`; `onRelease`.
- `scene-quality.js`: lúc giữ thì `sample()` trả `true`; thôi giữ thì `tuner.guard()` được gọi lại.
- `scene.js`: `redraw()` chờ `hold.idle()`; `pipeline.compile()` chạy trong lúc giữ; Bản dịch bắt khung kế tiếp lúc cảnh chạy, vẽ lại khung
  đứng yên dưới `?freeze`, gỡ cảnh thì lần bắt chờ hỏng.
- `shader-text.js`: escape trước khi tô, các loại token, uniform so cả tên (`w_suong` không khớp `w_suong_2`), đếm dòng và `hits`.
- `translation-view.js`, `recipe-panel.js`, `code-view.js` (jsdom): nút Bản dịch chỉ khi có `studio()`; Đỉnh/Điểm ảnh; dòng trạng thái;
  sáng dòng theo núm; chép link (clipboard giả, hỏng thì ô link); dòng tóm tắt; Về nguyên bản.
- `boot.js`, `static.js`: công thức tới `run()`; tầng tĩnh thêm câu.
- Ghim three 0.186.1 (`draws.test.js`): `Renderer._renderObjectDirect` tìm RenderObject bằng đúng lời gọi `this._objects.get( object,
  material, scene, camera, lightsNode, this._currentRenderContext, clippingContext, passId )`; `QuadMesh` có `isQuadMesh`;
  `RenderObject.getNodeBuilderState` có mặt.

**Test của bức** (Node, `buildPainting`, `compileMaterial`): mỗi lớp của mỗi bức, liệt kê những vật mà mã có uniform của lớp, rồi ghi lại
bằng bảng snapshot. Thay đổi làm một lớp mất khỏi mọi mã thì test đỏ và người sửa thấy ngay. Lượt cuối (quad của RenderPipeline) kiểm ở e2e.

**E2E** (mỗi bức trong `describe` của nó, nên vào job của bức; Bức 3, Bức 4 thêm tag `@khoi` cho job WebGPU):
- **Bản dịch**: mở Sổ tay › Chỉnh › Bản dịch của một lớp có mặt ở vật của lớp khác (Bức 1: Sương; Bức 2: Giấy, góp vào material đèn
  của Cốt; Bức 3: Bóng mềm; Bức 4: Bản nét, ở lượt cuối) và của Phủ bóng:
  - nhãn ngôn ngữ đúng backend;
  - mã có `w_<id>`, số dòng sáng > 0;
  - rê một núm uniform thì có dòng sáng;
  - không lỗi console;
  - cảnh vẫn chạy sau đó (`frames` tăng);
  - dưới `?freeze`, ảnh sau khi dịch trùng ảnh trước.

  E2e của `__sma.translate` (Task 2, mọi bức, cả hai backend): dưới `?freeze`, dịch lại ra cùng mã từng ký tự, nơi của lượt vẽ cảnh ghi ≥ 2
  ảnh (MRT), quad cuối (`post`) có `w_phu_bong`, ảnh đứng yên không đổi; lúc cảnh chạy, hai lần dịch liền nhau ra cùng mã, cảnh vẽ tiếp,
  không lỗi GPU (quét `log.all`). Kiểm một lần (script, không commit; §21.9): mã của mọi nơi trùng từng ký tự với mã của program GPU mà
  backend vẽ, ở cả hai backend.
- **Link công thức** (Bức 1 đủ đường, ba bức kia mở link):
  - mở `?force3d&freeze=N#r=…` thì `__sma.snapshot()` đúng công thức, thanh lớp mở với dòng tóm tắt, ảnh khác ảnh nguyên bản;
  - "Về nguyên bản" thì snapshot về mặc định và hash trống;
  - tắt một lớp thì hash đổi (chờ hết 500 ms);
  - đổi hash trong trang thì áp;
  - nút chép link đưa vào clipboard (giả) đúng link, không có query string;
  - mục hỏng thì bỏ, cảnh vẫn live;
  - Bức 1 có Dial `gio`, Bức 3 có Dial `ngay`.
- **Normal lúc cảnh đang chạy** (mọi bức, mở không `?freeze`): bật Kính mài, chọn Normal, chờ nút báo xong; không lỗi console, cảnh vẫn
  live. Test này đỏ trên code cũ (lỗi của §21.3). Chromium báo lỗi GL của WebGL2 ở mức `console.warning` (không phải `error`) và chữ
  không khớp DEPRECATION, nên `collectConsole` không giữ riêng chúng: test quét thẳng `log.all` tìm `GL_INVALID_`, "Lỗi GPU" và
  "Render pipeline creation failed" (không quét thì test xanh trên code cũ ở WebGL2). Đo trên code cũ, Bức 1: WebGL2 SwiftShader bảy lần
  `GL_INVALID_OPERATION` (hai lượt chạy giống nhau); WebGPU GPU thật năm dòng lỗi, trang về tĩnh (`reason: gpu-error`), nút Normal không bao
  giờ báo xong.
- a11y (axe) với Bản dịch đang mở và với dòng tóm tắt.
- Trên GPU thật ở máy local; khung nhìn điện thoại (390 × 844) cho chip công thức và Bản dịch trong tấm trượt.

**Kiểm tay** (thêm vào §12): Safari trên Mac và iPhone (thanh địa chỉ đổi theo khi mài; chép link; mở link nhận được); VoiceOver đọc dòng
trạng thái của Bản dịch và dòng "Đã chép link".

### 21.9 Cách làm GĐ 9

Như GĐ 6–8: làm thẳng trên nhánh `gd9-ban-dich-cong-thuc`, vừa làm vừa sửa; plan gọn, code đầy đủ chỉ ở chỗ khó (giữ khung, đọc mã, lượt cuối,
đọc/ghi công thức).
Plan: `docs/superpowers/plans/2026-10-08-gd9-ban-dich-cong-thuc.md` (chín task).
1. **Hai task rủi ro nhất làm trước**, chạy thật trên Bức 1 (vật thường) và Bức 4 (lượt cuối), WebGPU trên GPU thật và WebGL2 SwiftShader:
   - Task 1: `hold.js` và sửa Normal lúc cảnh đang chạy (cùng bộ giữ), e2e đỏ trước trên code cũ;
   - Task 2: `translate.js`, bàn thợ, `__sma.translate` (cuối cùng: bắt lúc vẽ qua `draws.js#capture`).

   **Luật dừng (Task 2):** một trong bốn điều sau không đạt thì dừng, báo Bao, và chọn đường lùi:
   - mã của vật trùng từng ký tự với mã của RenderObject mà lượt vẽ cảnh dùng, ở cả hai backend;
   - lần đọc đầu của một vật giữ khung tối đa 250 ms, cả bức dưới 3 giây (Bức 1 và Bức 4, Mac M2); mở lại không giữ khung;
   - dưới `?freeze`, ảnh sau khi dịch trùng ảnh trước; không lỗi console;
   - không có lần biên dịch GPU nào mới (đếm program của renderer trước và sau).

   **Đường lùi:** "bắt lúc vẽ": `draws.js` (chỗ duy nhất đặt móc) đọc RenderObject của lần vẽ thật bằng trường riêng của three; test ghim
   trường đó với three 0.186.1.

   **Kết quả (2026-10-08, Mac M2, headless Chromium, `?freeze=10`): cách `getShaderAsync` không đạt điều 1, 2 và 4.**
   - Mã lệch từng ký tự: Bức 1 lệch 8/10 vật ở WebGPU, 4/10 ở WebGL2 (tên `NodeBuffer_<id>`, thứ tự thành viên của struct uniform, thứ tự
     hàm; Lá nổi và Mặt nước còn lệch cả sau khi bỏ số id); Bức 4 lệch Mười gà con, và quad cuối là một biến thể khác (vertex shader mặc
     định thay cho `_vertexNode` của QuadMesh).
   - Thêm program: Bức 1 74 → 89 (WebGPU), 67 → 74 (WebGL2); Bức 4 27 → 31 ở cả hai: `compileAsync` vẽ lại phản chiếu và scene pass ở độ
     sâu gọi 0, và dựng quad với vertex shader mặc định.
   - Lần đọc đầu của quad cuối Bức 4 lúc bộ đệm shader của máy còn lạnh: 738 ms (WebGPU), 696 ms (WebGL2); ấm thì 78–112 ms. Cả bức dưới
     1 giây.
   - Đạt: ảnh dưới `?freeze` không đổi, console sạch, mở lại không giữ khung.

   Nguyên nhân ở Phụ lục A.102. Bao đồng ý đường lùi ngày 2026-10-09. Kiểm một lần cho đường lùi (2026-10-09; script, không commit), Bức 1
   (Sương, Phủ bóng) và Bức 4 (Bản nét, Phủ bóng), WebGPU GPU thật và WebGL2: mã của MỌI nơi trùng từng ký tự với mã của program GPU mà
   backend vẽ (`backend.draw` nhận RenderObject; `_pipelines.get(ro).pipeline` cho hai program), đo ở một khung riêng trước khung bắt; số
   program trước và sau bằng nhau; mỗi bản dịch 15–19 ms.
2. Task 3: Bản dịch trong Sổ tay: `shader-text.js`, `translation-view.js`, nút ở `code-view.js`, những nơi lớp có mặt, sáng theo núm.
3. Task 4–5: công thức: `recipe.js`, `recipe-set.js`, áp lúc dựng (`createKnobs` nhận giá trị ban đầu), bàn thợ, `__sma`, câu của tầng tĩnh.
4. Task 6: thanh địa chỉ và `hashchange` (`recipe-url.js`); mục Công thức, dòng tóm tắt, Về nguyên bản; tách `workshop-door.js` khỏi
   `run.js`.

   **Điểm duyệt ảnh giữa chừng** (một trang ảnh riêng tư, cuối Task 6): Bản dịch trong Sổ tay (máy tính và điện thoại dọc, cả hai backend),
   thanh lớp có dòng tóm tắt và mục Công thức (máy tính và điện thoại). Bao duyệt trước khi viết e2e và chữ cuối.
5. Task 7: e2e bốn bức, a11y, test của bức. Task 8: `CLAUDE.md`, README (mục "Link công thức" cho người xem), spec.
6. Task 9: review cuối cả nhánh, rồi hỏi Bao trước khi push, và hỏi lại trước khi merge (merge là deploy).

### 21.10 Rủi ro riêng

- **`getShaderAsync` không ra đúng mã đang chạy** (đã gặp ở Task 2, §21.9): RenderObject của nó nằm ở chain map khác (`'default'`; lần vẽ
  dùng passId `null`) và dựng bằng một lần dựng NodeBuilder khác (A.102). Giải: bắt lúc vẽ (§21.3), kiểm một lần trùng từng ký tự với
  program GPU ở cả hai backend; luật cấm `getShaderAsync` trong `src/`.
- **Trường riêng của three đổi ở bản sau** (`_objects`, `_currentRenderContext`, lời gọi trong `_renderObjectDirect`, `isQuadMesh`): test ghim
  đỏ khi nâng three; chỉ `draws.js` phải xem lại.
- **Lần bắt không tới** (tab ẩn nên vòng lặp không vẽ, khung lỗi): bản dịch chờ khung vẽ kế tiếp; khung lỗi thì bắt ở khung sau; gỡ cảnh thì
  hỏng kèm câu tiếng Việt, không treo mãi.
- **Khung vẽ trong lúc biên dịch lại giữa chừng** (view Normal): giữ khung (§21.3).
- **Bộ điều chỉnh hiểu quãng giữ là máy chậm**: thôi giữ thì đo lại từ đầu (§21.3).
- **Mã quá dài trên điện thoại** (800 dòng, dòng gần 1.000 ký tự): xuống dòng, cuộn riêng khung mã; vài nghìn `span` không làm chậm Sổ tay
  (đo ở Task 3).
- **Safari giới hạn `replaceState`**: gộp 500 ms, bắt lỗi rồi thôi ghi (§21.4).
- **Link dài**: chỉ ghi giá trị khác mặc định. Bức 1 (nhiều núm nhất) chỉnh hết mọi núm, tắt hết mọi lớp và kéo giờ thì chưa tới 1.500 ký tự,
  dưới trần 2.048 của `readRecipe`.
- **Mặc định khác nhau giữa hai máy** (núm có `value` theo mức, Dial theo giờ): link chỉ mang giá trị người gửi đã đổi, nên phần còn lại là
  mặc định của máy người nhận. Đó là ý định (§21.2), ghi trong README.
- **Công thức đổi `rebuild` lúc dựng làm chậm lần mở trang**: núm `rebuild` dựng một lần với giá trị của công thức (§21.4), nên không chậm
  hơn trang nguyên bản; giá trị nặng hơn mặc định (nhiều vòng hơn) thì đã bị kẹp theo trần của máy.

## Phụ lục A: sự thật API đã kiểm trên three@0.186.1

Các mục dưới đây đã được kiểm bằng ba cách:
- đọc mã nguồn đã cài và các example r186;
- chạy cảnh thử headless trên Chromium 153 với cả hai backend. Cảnh gồm reflector, sprite compute, bloom chọn lọc qua MRT, AgX dạng node, LUT sinh bằng code, grain, vignette và FXAA; kết quả là không có lỗi console, 21 draw call cho 4 đối tượng, compute đọc ngược về đúng;
- các bài kiểm riêng của 4 vòng phản biện.

1. **Khởi tạo renderer:** `WebGPURenderer` chỉ quyết định việc lùi về WebGL2 bên trong `await renderer.init()`. `powerPreference` bị bỏ qua trên WebGL. `alpha` mặc định là `true`, nên nếu không có `setClearColor(màu, 1)` thì chỗ trống sẽ trong suốt.
2. **`RenderPipeline`:** thay cho `PostProcessing` (deprecated từ r183). Sau khi thay `outputNode` phải tự đặt `needsUpdate = true`. Nếu `renderer.toneMapping` hoặc `outputColorSpace` đổi, pipeline tự dựng lại. Với `outputColorTransform = false`, three **không** tự thêm `renderOutput`.
3. **Biên dịch trước:** dùng `scenePass.compileAsync(renderer)`. `renderer.compileAsync(scene, camera)` biên dịch mà không có MRT và render target của pass. Reflector, bóng, bloom và quad vẫn biên dịch ở khung đầu, nên cần vẽ một khung ẩn.
4. **Blend của MRT:** các target MRT khác `output` mặc định **không blend**. Phải dùng `mrt.setBlendMode('emissive', new BlendMode(MaterialBlending))`. Trên WebGL, việc này cần `OES_draw_buffers_indexed`. Ở WebGPU compatibility mode, mọi target dùng blend của material.
5. **`bloom`:** `bloom(node, strength, radius, threshold)` nằm ở `three/addons/tsl/display/BloomNode.js` và nhận được node làm tham số. Scale nội bộ mặc định là 0.5. Tốn 12 draw call mỗi khung.
6. **Tone mapping:**
   - Đổi loại qua `renderer.toneMapping` thì phải biên dịch lại (+2 program).
   - **`select()` sinh `if/else`:** node dựng trong nhánh rồi dùng lại bên ngoài sẽ đọc biến chưa gán, nên alpha bằng 0 và khung đen hoặc trong suốt. Cách đúng là `Fn` + `.toVar()` + `If`: +0 program, ảnh đúng.
   - FXAA cần đầu vào sRGB, nên đặt sau `renderOutput`.
7. **`reflector`:**
   - Dùng `reflector({ resolutionScale })`. Tùy chọn `resolution` đã deprecated từ r180.
   - Pháp tuyến là +Z cục bộ của `target`. Reflector đọc `target.matrixWorld` mà **không cập nhật**, nên target phải nằm trong scene (hoặc gắn vào mesh đã xoay).
   - Ảnh phản chiếu render không có MRT.
8. **`positionNode`:** trong r186 chạy sau instancing. Muốn dịch cả một instance thì cần attribute tâm instance.
9. **Sương:**
   - `scene.fogNode = fog(color, factor)` tính `mix(output.rgb, color, factor)`. Các hàm hệ số có sẵn dùng `−positionView.z`.
   - `fogNode` nằm trong cache key của mọi material: gán lại là biên dịch lại tất cả.
   - `NodeMaterial.fog` mặc định là `true`. Sương không tác động lên kênh `emissive`.
10. **Compute trên WebGL2** chạy qua transform feedback, với các giới hạn:
    - khoảng 4 bộ đệm được tham chiếu trong mỗi kernel;
    - `element(i)` bỏ qua `i`, trừ khi dùng `setPBO(true)`;
    - `count` phải là số;
    - `computeNode.count` và `sprite.count` đổi được lúc chạy.
11. **`renderer.info.render`** có `drawCalls`, `triangles`, `points`, `lines`, nhưng không có bộ đếm đỉnh. Loop của renderer reset `info` mỗi tick.
12. **Lỗi và mất device:**
    - `renderer.onDeviceLost(info)` áp dụng cho cả hai backend, nhưng WebGPURenderer không có đường khôi phục.
    - `renderer.onError(info)` nhận lỗi GPU không đồng bộ (validation, hết bộ nhớ, lỗi nội bộ); các lỗi này không ném từ `render()`.
13. **Headless Chromium:**
    - Không có cờ: có `navigator.gpu` nhưng `requestAdapter()` trả `null`.
    - Có cờ SwiftShader: `isFallbackAdapter === true` và `architecture === 'swiftshader'`.
    - `failIfMajorPerformanceCaveat` vẫn cho SwiftShader đi qua.
14. **Chi tiết nhỏ:**
    - `Data3DTexture` mặc định dùng `NearestFilter`.
    - `film()` không có trung bình bằng 0.
    - Inspector không import được ngoài trình duyệt.
    - `time`/`deltaTime` của TSL chạy theo đồng hồ riêng của renderer.
15. **Node thuần:** `three/webgpu` và `three/tsl` import được trong Node và dựng được node graph (material, reflector, instancedArray, pass + MRT + bloom). Vì vậy test hợp đồng có thể import lớp thật.
16. **Tên và hàm:**
    - `uniform().setName(name)` đưa `name` thẳng vào shader. Tên có `-` làm hỏng cả WGSL lẫn GLSL. `label()` đã deprecated từ r179.
    - TSL không có `atan2`: `atan(y, x)` với 2 tham số được biên dịch thành atan2.
17. **Bóng:**
    - `castShadow`, `receiveShadow` và `shadowMap.enabled` đều nằm trong cache key.
    - ShadowNode cập nhật một lần cho mỗi camera mỗi khung, nên camera ảo của reflector làm shadow map được vẽ hai lần.
18. **Vite 8:**
    - `parseSync(file, code)` trả `{ program, comments, module }` với vị trí chú thích đúng, kể cả khi có chữ tiếng Việt đứng trước.
    - Script module inline trong HTML, `rolldownOptions.input` nhiều trang và `codeSplitting.groups` đều build được. Entry không preload three. `vite:preloadError` có phát ra.
19. **`mrtNode` của material** (kiểm ở GĐ 1): ghép đè MRT của pass cho riêng material đó. Khi material bị vẽ vào render target
    không có MRT (ảnh của reflector), three dùng MỘT MÌNH `mrtNode` làm đầu ra: WGSL báo "structures must have at least one
    member", WebGL2 báo "Active draw buffers with missing fragment shader outputs". Chỉ dùng cho material không bao giờ lọt vào
    target như thế (mặt nước: reflector tự ẩn nó).
20. **`normalLocal` trong `positionNode`** (kiểm ở GĐ 1): `positionNode` chạy sau instancing; gán `normalLocal.assign(…)` bên
    trong nó có hiệu lực cho ánh sáng trên cả WebGPU lẫn WebGL2 (cánh xoay 90° sáng đúng như khi bật flatShading). Shadow
    map cũng dùng `positionNode` của material.
21. **Đo thời gian GPU của công cụ thợ** (kiểm ở GĐ 1, sửa lời ở GĐ 2, đọc mã nguồn): stats-gl 4.2.3 và `Inspector` của r186
    đặt `renderer.backend.trackTimestamp = true` TRƯỚC, rồi mới hỏi `hasFeature('timestamp-query')`: stats-gl chỉ bỏ biểu đồ
    GPU, Inspector chỉ ghi một dòng lỗi vào bảng của nó; không bên nào tắt lại cờ. `WebGPUBackend` chỉ tự kiểm lúc `init`. Máy
    không có tính năng này thì WebGPU báo lỗi validation mỗi khung. `engine/gpu/debug.js` tắt lại cờ sau khi gắn công cụ.
22. **OrbitControls và cử chỉ của bức** (kiểm ở GĐ 1): `onPointerDown` của OrbitControls bỏ qua sự kiện khi `enabled === false`.
    `input.js` nghe ở pha capture (chạy trước listener của OrbitControls trên cùng canvas) để thả camera kịp khi ngón thứ hai chạm
    xuống giữa lúc giữ. Dời `controls.target` rồi `update()` thì camera giữ nguyên vị trí, chỉ quay theo điểm nhìn.
23. **Đổi `count` lúc chạy** (kiểm ở GĐ 2, đọc `RenderObject.getCacheKey`): object có `isInstancedMesh` hoặc `count > 1` được
    thêm uuid vào cache key, nên đổi `InstancedMesh.count` (miễn không vượt sức chứa đã cấp phát) không biên dịch lại. Sprite
    về `count` 0 hay 1 thì đổi key. `ComputeNode.count` đổi được lúc chạy: WebGPU tính lại số nhóm dispatch khi count khác lần
    trước, WebGL2 đọc `count` mỗi lần.
24. **Vẽ lại ngoài vòng lặp** (kiểm ở GĐ 2, e2e): `Animation` của renderer chạy `requestAnimationFrame` từ lúc `init()`, kể cả
    khi `setAnimationLoop(null)`, và tăng `nodeFrame.frameId` mỗi nhịp. `PassNode`, `ReflectorBaseNode` (không bounce) và
    `ComputeNode` có `updateBeforeType = FRAME`: chỉ vẽ lại (tính lại) một lần mỗi `frameId`. Hai lần `render()` trong cùng một
    nhịp thì lần sau dùng lại ảnh cảnh cũ, chỉ hậu kỳ chạy lại. Muốn vẽ lại sau khi đổi uniform thì đợi nhịp rAF kế tiếp.
25. **Núm đổi được mà không biên dịch lại** (kiểm ở GĐ 2): `ShadowNode` gọi `shadowMap.setSize(mapSize)` mỗi lần cập nhật, đọc
    `bias` và `normalBias` bằng `reference()`; `reflector.resolutionScale` đọc mỗi khung; `bloom(node, strength, radius,
    threshold)` giữ nguyên node được truyền vào (`isNode ? node : uniform(x)`).
26. **Inspector gắn bảng vào CHA của canvas** (kiểm ở GĐ 2): `[data-stage]` là `position: fixed`, tức một stacking context nằm dưới
    lớp chữ, nên bảng bị chữ đè. `engine/gpu/debug.js` dời bảng ra `body` sau một nhịp microtask.
27. **Tweakpane 4.0.5** (kiểm ở GĐ 2, jsdom + trình duyệt): `<option>` của danh sách có `value` là chỉ số, nhãn là chữ; sự kiện
    `change` có `last` (true khi thả tay); số mặc định chỉ hiện 3 chữ số thập phân (truyền `format` theo bước của núm); màu
    dùng `view: 'color'` với chuỗi `#rrggbb`. Chạy được trong jsdom. Nén gzip khoảng 31 KB.
28. **Shiki 4.4.3** (kiểm ở GĐ 2): `createHighlighter({ themes: [themeObject], langs: ['javascript'] })` nhận thẳng một theme
    TextMate dạng object; `codeToHtml(…, { transformers: [{ line(node, n) { node.properties['data-line'] = n; } }] })` gắn số
    dòng vào từng `<span class="line">`. Chạy lúc build (và trong Vitest), trình duyệt không tải Shiki.
29. **Compute trên WebGL2 có HAI bản của mỗi bộ đệm** (tìm ra ở review GĐ 2, e2e): transform feedback đọc một bản, ghi bản kia, rồi
    đổi vai sau mỗi lần chạy; kernel có `count` nhỏ hơn sức chứa chỉ ghi `[0, count)`. Kernel khởi tạo phải chạy HAI lần trên WebGL2,
    nếu không, tăng `count` lúc chạy thì phần tử mới đọc từ bản chưa từng được ghi (cả đám xuất phát ở gốc tọa độ).
30. **Tweakpane 4 `pane.refresh()` phát sự kiện `change`** cho những giá trị khác với trên màn hình (review GĐ 2, jsdom): đọc lại
    trạng thái thật bằng `refresh()` thì phải chặn bằng một cờ, kẻo nó bị tính là người xem vừa đổi núm.
31. **Gỡ MỌI mesh đang dùng một cặp material + geometry thì three gỡ luôn pipeline** (`usedTimes` về 0; review GĐ 2): lần dùng sau
    phải biên dịch lại. Thứ bật/tắt được (như "Tắt instancing") thì giữ một bộ mesh tạo một lần, bật/tắt chỉ hiện/giấu.
32. **jsdom không giữ `scrollTop` và không có layout** (review GĐ 2): test cuộn thì gắn setter giả cho `scrollTop` để ghi lại giá trị.
33. **`fogNode` nằm trong cache key của MỌI render object** (đọc mã nguồn r186, GĐ 3): `NodeManager.getCacheKey(scene, lightsNode)`
    đẩy `fogNode.getCacheKey()` vào khóa, và khóa của một node là băm cấu trúc đồ thị của nó. Đổi đồ thị của sương (thêm một octave
    khai triển) là mọi material biên dịch lại. Số thay đổi lúc chạy phải là uniform bên trong đồ thị cố định.
34. **Sương áp lên đầu ra của MỌI NodeMaterial có `fog = true`, kể cả Sprite** (đọc mã nguồn r186, GĐ 3): `NodeMaterial.setupOutput`
    thay đầu ra bằng `fogNode`, tức `mix(output.rgb, màu sương, hệ số)`, SAU khi emissive đã cộng vào ánh sáng. Hạt vẽ bằng
    `AdditiveBlending` mà để `fog = true` thì mỗi hạt cộng thêm một đĩa màu sương: phải đặt `fog = false` và tự nhân `(1 − hệ số)`.
35. **Shadow map tĩnh** (đọc mã nguồn r186 và kiểm bằng code chạy thật, GĐ 3: e2e đo 34 draw call ở mức cao, bóng không còn
    vẽ lại mỗi khung): `ShadowNode.updateBefore` vẽ khi `shadow.needsUpdate || shadow.autoUpdate`, tối đa
    một lần cho mỗi camera mỗi `frameId`, rồi đặt `needsUpdate = false`; không vẽ trong lúc biên dịch trước (`_isPreCompiling`).
    `renderShadow` gọi `shadowMap.setSize(mapSize)` và `shadow.updateMatrices(light)` mỗi lần vẽ. Vì vậy với `autoUpdate = false`,
    đổi cỡ map, bias hay hướng đèn thì phải đặt `needsUpdate = true` thì mới có hiệu lực.
36. **`BloomNode` đọc `resolutionScale` mỗi khung** (đọc mã nguồn r186 và kiểm bằng e2e "hạ hết nấc rồi nâng lại", GĐ 3): `updateBefore` gọi `setSize(kích thước, …)` với
    `_resolutionScale` hiện tại, và `RenderTarget.setSize` chỉ cấp phát lại khi kích thước đổi. `setResolutionScale` lúc chạy
    không biên dịch lại.
37. **Vòng lặp thật và thuộc tính instance động trong TSL** (kiểm bằng code chạy thật trên WebGPU và WebGL2, cả SwiftShader lẫn
    GPU thật, GĐ 3): `Loop(5, ({ i }) => { If(float(i).greaterThanEqual(u), () => { Break(); }); … })` với `u` là uniform biên dịch
    và chạy đúng trên WGSL lẫn GLSL (sương của lớp Sương); `i` là số nguyên nên phải đổi sang float trước khi so với uniform.
    `instancedDynamicBufferAttribute(attr)` (thuộc tính instance, `DynamicDrawUsage`) làm `positionNode` của một `Sprite` có
    `count` chạy được: CPU ghi mảng rồi `attr.needsUpdate = true` mỗi khung (biến thể CPU của lớp Vàng lá).
38. **Sao không cần ảnh** (GĐ 3): `mx_cell_noise_float(floor(hướng × 220))` cho mỗi ô lưới một số ngẫu nhiên cố định; ô nào vượt
    ngưỡng thì có sao, lệch trong ô bằng ba lần `mx_cell_noise_float` nữa. Chạy trên cả hai backend, trong cả ảnh phản chiếu.
39. **Số đo chi phí** (GĐ 3, máy Mac Apple Silicon, Chromium, GPU thật): noise gradient 3D viết bằng JS tốn khoảng 30 ns một lần
    gọi (Node 24); một bước của 20.000 đom đóm trên CPU (18 lần gọi noise mỗi con) tốn khoảng 11 ms, 3.000 con khoảng 2 ms, trong
    khi bản compute chỉ tốn phần gửi lệnh. ms mỗi khung đứng yên ở 16,7 dù CPU bận thêm vài ms: trình duyệt khóa nhịp theo màn
    hình, nên thí nghiệm so sánh phải đo cả ms CPU.
40. **Đo thời gian GPU** (đọc mã nguồn r186, GĐ 4):
    - **Bật đo:** `new WebGPURenderer({ trackTimestamp: true })`.
      - `WebGPUBackend` xin mọi feature mà adapter có (kể cả `timestamp-query`). Lúc `init`, nó đặt
        `trackTimestamp = trackTimestamp && hasFeature('timestamp-query')`, nên máy không có tính năng này không bị lỗi validation.
        Đây là chỗ khác với việc bật cờ SAU `init` ở A.21.
      - WebGL2 chỉ đo khi có `EXT_disjoint_timer_query_webgl2`; không có thì `initTimestampQuery` bỏ qua.
    - **Lấy số:** `renderer.resolveTimestampsAsync(type)` trả TỔNG thời gian GPU của khung mới nhất trong mẻ. Tổng này cộng mọi render
      context có đuôi `:f<frameId>`, và được ghi vào `renderer.info[type].timestamp`.
    - **Đang có lần resolve dở:** WebGPU trả lại chính Promise đó; WebGL2 trả `lastValue`.
    - **Hai pool riêng:** `render` và `compute`. Mỗi pool chứa 2048 truy vấn; đầy thì tự resolve và đếm lại từ đầu.

    Hệ quả: mỗi mẫu GPU là của một khung vài nhịp trước. Mẫu không đến đều từng khung.
41. **`lut3D(node, lut, size, intensity)`** (`three/addons/tsl/display/Lut3DNode.js`, đọc mã nguồn r186, GĐ 4):
    - kéo tọa độ tra vào nửa texel ở mép, rồi trả `mix(base, lut(base.rgb), intensity)`;
    - đầu vào phải nằm trong [0, 1], tức màu hiển thị, đặt sau `renderOutput`;
    - `lut` là node `texture3D`. `Data3DTexture` mặc định dùng `NearestFilter` (A.14), nên phải đặt `LinearFilter`.
42. **`fxaa(node)` = `new FXAANode(convertToTexture(node))`** (đọc mã nguồn r186, GĐ 4):
    - Đầu vào không phải texture thì được vẽ ra một RTT: `HalfFloat`, tự đổi cỡ theo canvas, cập nhật một lần mỗi `frameId`. Tức là
      thêm một lượt vẽ mỗi khung.
    - `FXAANode` tính ngay trong lượt dùng nó, bằng cách đọc nhiều điểm quanh mỗi điểm ảnh của RTT; `updateBefore` chỉ đặt kích thước
      nghịch đảo.
    - Vì vậy node đứng SAU `fxaa` (overlay của công cụ) chạy ở lượt cuối, và phải tự lấy mẫu các view từ texture của chúng.
43. **`packNormalToRGB(n) = n × 0,5 + 0,5`** (đọc mã nguồn r186, GĐ 4): hàm này thay `directionToColor` (deprecated từ r185; gọi hàm cũ thì
    có cảnh báo "renamed").
44. **Đổi MRT lúc chạy** (`requireView('normal')`; kiểm bằng e2e trên WebGL2 và WebGPU SwiftShader, và GPU thật, GĐ 4):
    `scenePass.setMRT(mrt có thêm 'normal')` TRƯỚC, rồi mới `getTextureNode('normal')`. Render target nhận thêm ảnh ở lần vẽ
    sau, và mọi material biên dịch lại một lần: khoảng 0,17 giây trên GPU Apple, 0,4 giây trên WebGL2 SwiftShader. Gọi
    `getTextureNode` cho kênh chưa có trong MRT thì `getTexture()` đã thêm ảnh vào target; target có nhiều ảnh hơn số đầu ra của
    shader là vỡ. Vì vậy view Normal dùng node giữ chỗ tới lúc đó.
45. **`screenCoordinate` có gốc ở góc trên trái trên cả hai backend** (đọc mã nguồn `ScreenNode`, kiểm bằng ảnh, GĐ 4): WebGL lật
    trục y theo `screenSize`. Kính mài đổi NDC của con trỏ (y hướng lên) thành `(x/2 + 0,5, 0,5 − y/2)`.
46. **`If` trong một `Fn` gọi ngay** (kiểm khi dựng thử GĐ 4): nhánh trả giá trị (`() => x.assign(…)`) làm three cảnh báo
    "Return statement used in an inline 'Fn()'". Viết thân nhánh trong ngoặc nhọn.
47. **FXAA và phép trộn cùng đọc một RTT** (đo bằng e2e, GĐ 4): `convertToTexture(node)`, rồi `mix(rtt, fxaa(rtt), k)`. Lượt cuối
    không tính lại cả chuỗi display. Mức cao đo được 35 draw call (34 + 1 lượt vẽ RTT).
48. **Đo GPU trên máy thử** (đo bằng Playwright trên GPU thật và SwiftShader, dựng thử GĐ 4): WebGPU trên GPU Apple có
    `timestamp-query`, nhưng thời lượng các pass chồng lên nhau. Một khung ở 1280×800 (DPR 2, mức cao) có 16 pass; pass nào cũng báo
    10–12 ms, kể cả các lượt bloom rất nhỏ, trong khi cảnh vẫn chạy đủ 60 khung/giây. `resolveTimestampsAsync('render')` trả
    **tổng các pass của khung cuối** (`framesDuration` của `WebGPUTimestampQueryPool`), nên ra khoảng 160 ms. Timestamp được làm tròn
    theo bước 0,066 ms. WebGL2 và WebGPU trên SwiftShader cũng báo số, khoảng 300 ms mỗi khung, gần bằng nhịp khung, vì mọi phép vẽ
    chạy trên CPU; nhịp đó dài hơn một lần nghẽn (250 ms), nên gpu-timer bỏ các mẫu này và e2e không dựa vào ms GPU. Mẫu của lần hỏi
    đầu (khung đầu còn biên dịch pipeline) và của mẻ trải qua lúc hòa dần không có nhịp khung đáng tin, nên cũng bị bỏ mà không tính là
    hỏng (sửa sau review GĐ 4: trước đó GPU Apple kịp hiện 160 ms trong Sổ tay).
49. **OrbitControls tự gọi `update()` khi rê** (đọc mã nguồn, kiểm bằng e2e, GĐ 4): camera đổi ngay cả khi vòng lặp đã dừng ở
    `?freeze`, nhưng canvas chỉ đổi ở lần vẽ lại kế tiếp. E2e sương xoáy ép vẽ lại, để so hai cú kéo có cùng một camera.
50. **Mã hóa ảnh ngay trong trang** (`scripts/poster.js`, GĐ 4): `canvas.toBlob('image/webp', q)` của Chromium ra WebP dạng
    `VP8 ` (nén mất dữ liệu). Poster 1600×1000 của Bức 1 nặng 142 KB ở q 0,88; og JPEG q 0,85 nặng 86 KB.
51. **Chromium giao `pointermove` theo nhịp khung** (đo bằng Playwright trên WebGL2 SwiftShader, dựng thử GĐ 4): các sự kiện rê
    được gộp lại và giao ngay trước `requestAnimationFrame`, còn `pointerdown`/`pointerup` giao ngay. GPU phần mềm còn dồn việc vẽ
    lại (năm lần `setWeight`, mỗi lần một lần vẽ) thì khung chậm: một cú vuốt 3 bước bị giãn từ khoảng 140 ms lên hơn 500 ms, thành
    cú kéo. E2e sương xoáy vì vậy gộp các `setWeight` vào một nhịp, rồi đợi 4 khung trước khi vuốt. `gesture.js` đo bằng
    `performance.now()` lúc xử lý sự kiện; trên máy thật, nhịp khung do bộ điều chỉnh giữ, nên độ giãn chỉ chừng một khung.
    Lượt CI đầu của `main` sau khi merge GĐ 4 cho thấy thêm hai điều. Mỗi sự kiện chuột của Playwright phải đợi một nhịp khung mới
    tới trang, nên cú vuốt 5 sự kiện đã mất 200–250 ms trên máy Mac rảnh; máy CI chậm hơn là quá 300 ms. Còn cú kéo chậm có bước
    đầu 6 px (dưới `tapPx` 8) thì còn ở "chờ": bước kế tới trễ quá 350 ms là thành "giữ", và `input.js` tắt camera giữa chừng. E2e
    giờ cho cú kéo bước đầu 12 px, cú vuốt chỉ một bước; test đo thời lượng nét ngay trong trang và vuốt lại (tối đa ba lần) khi
    môi trường quá chậm. (GĐ 5) Cũng vì vậy, e2e chạm hai lần (trong 300 ms) phát sự kiện con trỏ ngay trong trang (§17).
52. **`color('#hex')` của TSL là màu tuyến tính** (unit test và đo pixel, sửa sau GĐ 4): chuỗi hex đi qua `Color.setStyle`, và
    `ColorManagement` đổi nó từ sRGB sang không gian làm việc (tuyến tính). Màu trộn ở không gian hiển thị (overlay của công cụ, sau
    `renderOutput`) phải là số sRGB: `new Color('#D4A94A').convertLinearToSRGB()`. Viền Kính mài của GĐ 4 dùng thẳng
    `color('#D4A94A')`, nên hiện màu cam đất (168, 101, 17) thay vì vàng lá.
53. **`renderer.setRenderObjectFunction(fn)`** (đọc mã nguồn r186, GĐ 5; dựng thử kiểm lại bằng e2e): `_renderObjects` gọi
    `_currentRenderObjectFunction(object, scene, camera, geometry, material, group, lightsNode, clippingContext, passId)` cho từng mục
    của render list, theo đúng thứ tự đã sắp (đục trước, trong suốt sau). Mỗi lần `render()` đặt hàm hiện tại là `fn ?? renderObject`.
    - `compileAsync` luôn dùng `renderObject` gốc, nên biên dịch trước không đi qua móc.
    - `ShadowNode` cất móc, đặt hàm riêng cho lượt vẽ bóng, rồi trả lại. `RendererUtils.resetRendererState` (BloomNode, RTTNode của
      FXAA, và các pass có sẵn khác) đặt móc về `null` rồi trả lại. Vì vậy móc không thấy lượt vẽ bóng, bloom hay quad của RTT.
    - Reflector gọi `renderer.render(scene, camera ảo)` ngay trong lúc vẽ mặt nước (từ `updateBefore` của node), không đặt lại móc: móc
      thấy các lần vẽ đó với camera ảo, lồng bên trong lần vẽ của mặt nước. `_renderScene` cất và trả hàm hiện tại quanh lượt lồng này.
    - `RenderPipeline` vẽ quad cuối bằng `renderer.render()` mà không gỡ móc: móc thấy quad (camera trực giao) ở ngoài cùng, và scene
      pass được vẽ từ BÊN TRONG lần vẽ quad ấy (`updateBefore` của node). Quad không phải phản chiếu: nó vào "các lượt khác".
    - **Thứ tự `updateBefore`** (phát hiện khi review GĐ 5, kiểm bằng `WGSLNodeBuilder` với đồ thị thật của Bức 1): three gọi
      `updateBefore` của một material theo thứ tự node dựng xong, con trước cha (`Node.build` gọi `addSequentialNode` sau khi dựng các
      con; `buildUpdateNodes` giữ thứ tự đó). Ảnh cuối của Bức 1 có RTT của FXAA nằm sâu bên trong, nên RTT tới lượt trước: nó gỡ móc
      rồi vẽ quad của nó, và `updateBefore` của quad ấy vẽ scene pass lần đầu trong khung bằng `renderObject` gốc. Scene pass cập nhật
      mỗi `frameId` một lần (FRAME), nên lượt cuối không vẽ lại nó; không có công cụ thì scene pass còn không nằm trong lượt cuối. Lượt
      cuối thật đo được `[RTTNode, FXAANode, PassNode, BloomNode]` khi có Kính mài và Lột lớp. Vì vậy `views.js` bọc ảnh cuối bằng
      `Fn(() => { scenePass.toVar(); return vec4(c.rgb, 1); })()`: stack của `Fn` dựng `scenePass.toVar()` trước giá trị trả về, nên
      scene pass luôn là `updateBefore` đầu tiên của lượt cuối (`[PassNode, RTTNode, FXAANode, BloomNode]`) và chạy khi móc còn gắn.
      Biến không ai đọc thì `StackNode` bỏ qua lúc sinh code: WGSL y hệt khi không có biến. Hệ quả: scene pass xóa ảnh `output` bằng
      màu xóa của sân khấu (đen then, alpha 1) chứ không phải màu đen của RTT, như trước GĐ 4. Ảnh `emissive` và `normal` vẫn xóa về đen:
      cả hai backend chỉ dùng màu xóa của renderer cho ảnh đầu của MRT. Vòm trời của Bức 1 (lớp Sương, luôn hiện) che kín nền, nên chỉ
      các sợi trước vòm trời của Từng sợi mới thấy màu xóa.
    - Không gọi hàm vẽ cho một mục là mục đó không được vẽ, và `renderer.info` không đếm nó. Mặt nước bị bỏ qua thì reflector cũng không
      vẽ lại ở khung đó.
    - Inspector của `?debug` không dùng móc này (không file nào của inspector gọi nó).
    - Một lần gọi hàm vẽ không luôn là một draw call: material trong suốt, `DoubleSide`, `forceSinglePass` false thì
      `Renderer.renderObject` tự vẽ hai lần (lượt `'backSide'` rồi mặt trước) trong MỘT lần gọi. Vật có transmission thì khác: render
      list xếp nó vào lượt riêng, và hàm vẽ được gọi hai lần, lần đầu với `passId` `'backSide'`. Vì vậy khóa của `limit(k)` có
      `passId` (§7).
    - `renderer.info` chỉ về 0 ở nhịp rAF của renderer (`Animation`, khi `info.autoReset`), không ở mỗi `render()`: draw call của một
      khung là hiệu số tính từ đầu khung.
    - Hệ quả về màu xóa (ở trên) đã kiểm trên GPU thật lúc tinh chỉnh GĐ 5: ảnh mặc định của Bức 1 không đổi.
    - **E2e kiểm lại** (test Từng sợi, trên WebGL2 SwiftShader, WebGPU SwiftShader và GPU thật): bật công cụ là có danh sách lần vẽ
      (N > 0); sợi 0 gần như một màu (độ lệch chuẩn độ sáng 0,0073, khung đủ chừng 0,13); sợi N đúng bằng ảnh không có công cụ. Sợi 0
      chỉ một màu được khi móc thấy và chặn được mọi lần vẽ của lượt vẽ cảnh, tức scene pass đứng đầu lượt cuối. Thứ tự `updateBefore`
      còn được `tests/unit/pipeline.test.js` giữ bằng `WGSLNodeBuilder` thật.
54. **Chrome đo `pathLength` của hình rất nhỏ quá thô** (kiểm trên Chrome, dựng thử GĐ 5): với `<circle r="1.05"
    pathLength="1">` (trăng có viewBox ±1,1), Chrome tính chu vi thô tới mức mỗi phần tư vòng thành một dây cung: chừng 4·r·√2 ≈
    0,9·2πr. Nét `stroke-dasharray` tính theo `pathLength` vì vậy không bao giờ khép: lúc rỗng vẫn ló một cung. Vẽ ở tọa độ riêng lớn
    gấp 100 (`r="105"`, `transform="rotate(-90) scale(0.01)"`, nét 9) thì đo đúng. Khoảng trống của `stroke-dasharray: 1 2` dài hơn cả
    vòng, nên lúc rỗng không có nét nào của chu kỳ sau ló ra, trình duyệt nào cũng vậy.
55. **`OrbitControls.update()` chỉ gọi `camera.lookAt()`** (đọc mã nguồn, kiểm bằng unit test, GĐ 5): hướng mới nằm trong
    `quaternion`, còn `matrixWorld` và `matrixWorldInverse` tới lúc `render()` mới được tính lại. Chiếu một điểm 3D ra màn hình trước
    `render()` (chữ đi theo vật) thì gọi `camera.updateMatrixWorld()` trước, không thì chữ chạy trễ camera một khung khi người xem kéo.
56. **`render()` đặt `camera.coordinateSystem` theo backend** (đọc mã nguồn `Renderer.js`, kiểm bằng unit test, GĐ 5): với WebGPU, z
    của NDC nằm trong [0, 1] (WebGL: [−1, 1]; `reversedDepth` thì đảo chiều), và ma trận chiếu được tính lại theo đó. Luật "trong
    khung" mà xét z của NDC trong (−1, 1) sẽ nhận cả điểm sát camera hơn near trên WebGPU. Cách đúng ở mọi quy ước: xét độ sâu trong
    tọa độ camera (−z trong [near, far]), rồi mới xét x, y của NDC trong [−1, 1].
57. **`display: none` (thuộc tính `hidden`) hủy transition và gỡ phần tử khỏi cây trợ năng** (chốt khi làm chữ đi theo vật, GĐ 5):
    phần tử bị `hidden` rồi hiện lại thì trình đọc màn hình có thể đọc lại nội dung của nó (trong vùng `aria-live`: đọc lại cả câu),
    và CSS transition không chạy (hiện lại đột ngột). Chữ cần ẩn tạm mà vẫn ở trong vùng live thì ẩn bằng opacity qua một thuộc tính
    (`data-away`); luật đó cùng độ ưu tiên với `[data-shown]`/`[data-fading]` nên phải đứng sau chúng để thắng.
58. **Transition từ giá trị đầu cần chốt style sau khi gắn phần tử** (kiểm trên trình duyệt, GĐ 5): gắn phần tử với giá trị đầu
    (dashoffset 1, opacity 0) rồi đặt đích trong cùng một lần tính style thì trình duyệt chỉ thấy giá trị đích: không có transition,
    phần tử nhảy thẳng. Đọc `getComputedStyle(el).<thuộc tính>` ngay sau khi gắn để trình duyệt tính style một lần, rồi mới đặt đích
    (`ui/moon-progress.js` lúc vẽ vòng mới, `ui/captions.js` trước khi gắn `data-shown`).
59. **`InstancedMesh` của r186 không đặt `type` riêng** (đọc mã nguồn, unit test, GĐ 5): `type` vẫn là `'Mesh'`; phân biệt bằng
    `isInstancedMesh` (`draws.js`, test tên vật).
60. **Soi đồ thị TSL trong test** (dựng trong Node, không GPU, GĐ 5):
    - `Fn(…)()` và `vec4(a, b)` trả một VarNode "intent" bọc node thật (`ShaderCallNodeInternal`, `JoinNode`): bóc `node.node` khi
      `isVarNode && intent`.
    - Thân của `Fn` chỉ chạy lúc dựng, và `getChildren()` không đi vào thân. Muốn thấy vòng lặp hay phép so bên trong `Fn` thì dịch ra
      mã (`tests/helpers/nodes.js#compileMaterial`), hay dựng bằng builder thật rồi đọc stack của thân (`getOutputNode(builder)`,
      `tests/helpers/final-pass.js`).
    - Một `.toVar()` không ai đọc vẫn được dựng, theo đúng thứ tự trong thân `Fn` (A.53 dựa vào điều này), nhưng `StackNode` bỏ qua
      nó lúc sinh code: shader y hệt khi không có biến. Kiểm lại sau GĐ 5 (review cuối GĐ 5 nghĩ `toVar()` là `createVar(node).toStack()`
      nên phải sinh một dòng `var`): ở bước generate, `StackNode.build` bỏ qua VarNode chỉ có chính stack làm cha; dịch một material
      có và không có biến đọc texture ấy ra WGSL và GLSL cho hai đoạn y hệt từng byte.
    - `NodeBuilder.addStack()` đặt stack hiện tại của TSL, một biến toàn cục: dựng xong phải `removeStack()`.
      `ShaderCallNodeInternal.setupOutput` tự `addStack()` và chỉ `removeStack()` khi thân `Fn` không ném lỗi, nên dựng hỏng giữa
      chừng thì trả HẾT stack của builder (`while (builder.stacks.length > 0) builder.removeStack()`), không thì stack rò sang test sau.
61. **Dịch material trong test** (kiểm bằng `tests/helpers/nodes.js`, GĐ 5):
    - r186 chỉ áp MRT của renderer và `mrtNode` của material khi đang vẽ vào một render target (`NodeMaterial.setup`:
      `renderer.getRenderTarget() !== null`). Không đặt target là dịch biến thể vẽ thẳng ra canvas: một đầu ra, bỏ qua `mrtNode`,
      biến thể mà cảnh không bao giờ vẽ. `compileMaterial` gọi `setRenderTarget` trước khi dịch (ảnh HalfFloat với MRT như scene pass,
      hay một ảnh, MRT `null`, như reflector); hàm đó chỉ ghi lại target, nên chưa `init()` vẫn dùng được.
    - `warnOnce` của three nhớ theo tiến trình (Vitest: theo file test): cảnh báo đã in lúc dựng đồ thị thì lúc dịch không in lại.
      `warn` thường (như "Return statement used in an inline 'Fn()'", A.46) thì lần dịch nào cũng in.
62. **`DynamicDrawUsage` tải lại thuộc tính ở MỌI lần render** (đọc mã nguồn `renderers/common/Attributes.js`, chung cho WebGPU và
    WebGL2, GĐ 5): thuộc tính được chép lên GPU khi `version` của nó tăng (`needsUpdate`), HOẶC khi `usage === DynamicDrawUsage`, bất
    kể version. Thuộc tính chỉ đổi lúc có việc (hoa đăng) thì để usage mặc định và đặt `needsUpdate` khi ghi; `DynamicDrawUsage` chỉ
    cho thuộc tính ghi lại mỗi khung (đom đóm CPU, A.37).
63. **`setMatrixAt` không cập nhật `InstancedMesh.boundingSphere`** (đọc mã nguồn, unit test, GĐ 5): three tính khung bao một lần (lần
    đầu cần tới) rồi giữ. Frustum culling dùng khung bao này: ma trận mới đưa bản ra ngoài khung cũ, rồi khung cũ ra khỏi màn hình,
    thì three bỏ cả mesh. Ghi ma trận xong thì `computeBoundingSphere()`; ô trống (ma trận cỡ 0) đặt ở chỗ không làm phình khung bao.
64. **Uniform buffer của từng vật được chép lại ở MỖI lượt vẽ** (đọc mã nguồn r186, GĐ 5):
    - `uniformArray` là một `BufferNode` trong nhóm `objectGroup`, một binding riêng. Nhóm đó có `updateType` OBJECT, nên
      `NodeManager.updateGroup` luôn trả true: mảng được chép vào bộ đệm của nó ở mỗi lần render (`updateType` RENDER), và cả bộ đệm
      được ghi lên GPU ở MỖI lượt vẽ có dùng nó (mảng gợn sóng: nước, lá, hoa đăng, cả trong ảnh phản chiếu), không phải một lần
      mỗi khung.
    - `InstancedMesh` có `count × 64` byte không quá giới hạn uniform buffer (WebGPU ≥ 64 KB, WebGL2 ≥ 16 KB) thì `instanceMatrix` đi
      vào uniform buffer của vật (`nodes/accessors/Instance.js`), cũng chép lại ở mỗi lượt vẽ dù `needsUpdate` có bật hay không. Quá
      giới hạn thì three chuyển sang thuộc tính interleaved, lúc đó `needsUpdate` (và `DynamicDrawUsage`, A.62) mới có tác dụng.
65. **`GLSLNodeBuilder` đặt lại tên mọi `uniformArray`** (đọc mã nguồn, unit test, GĐ 5): `setName('lanternPool')` chỉ hiện trong WGSL
    (`var<uniform> lanternPool`). Ở mỗi lần dịch GLSL, `getUniformFromNode` gán `node.name = 'NodeBuffer_<id>'` (cache của nó không
    được giữ), ghi đè luôn tên của node: mã WebGL2 luôn là `uniform NodeBuffer_<id> { … }`, và một lần dịch WGSL SAU đó trên cùng node
    cũng mang tên mới. Test dịch cả hai backend từ một đồ thị thì dịch WGSL trước.
66. **`setPointerCapture` ném lỗi với pointerId không có thật** (kiểm bằng Playwright, GĐ 5): OrbitControls gọi
    `domElement.setPointerCapture(event.pointerId)` lúc chạm xuống. Sự kiện con trỏ tự phát (`dispatchEvent`) với id không phải con trỏ
    đang có thì hàm đó ném `NotFoundError`. Con trỏ chuột (id 1) thì Chromium luôn có, nên e2e phát `pointerId: 1, pointerType: 'mouse'`.
    Sau GĐ 5: `pointerType: 'touch'` với id 1 cũng được (OrbitControls đi nhánh chạm, `setPointerCapture(1)` không ném), nên e2e thử
    được đường của ngón tay.
67. **Trình duyệt cắt phần lẻ của thời gian `setTimeout`** (WebIDL `long`, GĐ 5): `setTimeout(fn, 16.8)` hẹn 16 ms. "Dệt lại" với 5.000
    sợi có bước 16,8 ms nên chạy 16 ms một bước, cả lượt chừng 11,4 giây (vẫn dưới 12). Đồng hồ giả của Vitest cũng cắt (`parseInt`),
    nên test chọn N có bước tròn (1.200 → 20 ms, 2.000 → 18 ms).
68. **`<output>` ngầm là một vùng live** (ARIA, GĐ 5): vai trò ngầm của `<output>` là `status` (`aria-live` polite). Ô số đổi ở mỗi bước
    của một hoạt ảnh (40 ms một bước) sẽ làm ngập hàng đợi của trình đọc màn hình: đặt `aria-live="off"`, tiến độ đi qua
    `aria-valuetext` của thanh. Nút `disabled` bị Tab bỏ qua, nên e2e đi bằng bàn phím phải chờ tới lúc nút mở. Test (jsdom 30): lỗi
    ném trong listener `input` không tới chỗ gọi `dispatchEvent` mà thành sự kiện `error` trên `window`.
69. **CSS grid xếp phần tử sang một cột ngầm khi hai phần tử cùng hàng** (lỗi có từ GĐ 1, tìm ra khi tinh chỉnh GĐ 5 trên GPU thật):
    `[data-static]` (vùng live: luôn có mặt, rỗng thì thu lại) và `.hint` đều ghim `grid-row: 2` mà không ghim cột, nên lưới tự đặt
    `.hint` vào một cột ngầm thứ hai. Cột đó ép gợi ý thành một cột chữ hẹp (86 px, năm dòng trên điện thoại 390 px), còn đầu và chân
    trang chỉ còn cột 1: huy hiệu và con dấu lệch vào giữa màn hình máy tính thay vì nằm ở góc phải. Sửa: `.frame > * { grid-column: 1 }`.
70. **Transition của `stroke-dashoffset` chạy trên luồng chính** (đo bằng Playwright trên GPU thật và SwiftShader, GĐ 5): compositor
    chỉ chạy hộ vài thuộc tính (opacity, transform). Luồng chính bận (dựng cảnh, khung ẩn đồng bộ) thì quầng đứng yên, rảnh ra mới
    nhảy tới chỗ đáng lẽ đã tới. Transition đặt TRONG một tác vụ dài lấy giờ bắt đầu từ khung trước lúc chặn: trên WebGL2 SwiftShader,
    mốc `chunk` được đặt trong cùng tác vụ với `getContext` (chặn 1,25 giây), nên khung đầu tiên sau đó coi như transition đã chạy
    1,25 trong 4 giây (31% thời gian là 77% quãng theo đường ease-out): quầng nhảy từ gần 0 lên chừng 0,48.
71. **Chromium không có accessor riêng cho từng thuộc tính của `CSSStyleDeclaration`** (kiểm bằng Playwright, GĐ 5): thay setter của
    `strokeDashoffset` trên prototype không bắt được gì, vì gán `el.style.strokeDashoffset = …` không đi qua đó. Muốn ghi mọi giá trị
    inline mà một phần tử nhận thì dùng `MutationObserver` trên thuộc tính `style`, có `attributeOldValue`.
72. **`MutationObserver` gom mọi lần đổi của một tác vụ vào một lần gọi** (kiểm bằng Playwright, GĐ 5): một mốc của quầng đổi `style`
    hai, ba lần liền nhau (opacity, transition, dashoffset), mà callback chỉ được gọi một lần với nhiều bản ghi, mỗi bản ghi chỉ có
    `oldValue`. Giá trị MỚI của bản ghi i là `oldValue` của bản ghi kế tiếp trên cùng phần tử, hay style hiện tại nếu không còn bản
    ghi nào sau nó.
73. **Phần trăm trong `max-width` của con một phần tử flex có thể "vòng"** (đo trên GPU thật, GĐ 5): `.toolbar > .tool > .tool-panel`,
    với `.tool` là phần tử flex của thanh. Lúc tính bề rộng nội dung của `.tool`, phần trăm trong `max-width` của bảng lại phụ thuộc
    chính bề rộng đó, nên Chromium bỏ CẢ khai báo `max-width` (kể cả phần 560 px): ô rộng theo dòng chữ dài nhất và bảng lệch 58 px
    khỏi giữa. Giữ `max-width: min(560px, calc(100vw - 2 * var(--gutter)))`, không có `%`; unit test cấm `%` ở đó.
74. **Bề rộng CSS có thể lẻ** (đo trên GPU thật bằng iframe có `zoom: 1.25`, review GĐ 5): zoom trình duyệt hay tỉ lệ hiển thị của hệ
    điều hành cho bề rộng như 1239,2 px (cửa sổ 1549 px ở 125%). Cặp `@media (max-width: 1239px)` / `(min-width: 1240px)` để hở khoảng
    giữa 1239 và 1240: không luật nào khớp, và bảng công cụ lại nằm dưới Sổ tay. Viết cặp bù nhau: một luật mặc định cộng một luật đè,
    hay quy ước `.98` của Bootstrap (`max-width: 1239.98px`). Cú pháp khoảng `width < 1240px` cũng được, nhưng Safari 16.2–16.3 (vẫn
    có `color-mix` mà trang dùng) chưa hiểu.
75. **Phần nhẹ chạy trên trình duyệt cũ** (GĐ 5): tầng tĩnh là chỗ dựa của máy cũ, mà phần nhẹ đã cần `replaceChildren` (có từ
    Safari 14). Built-in từ ES2022 trở đi chưa có ở đó: `Object.hasOwn` (Safari 15.4, Chrome 93), `Array.prototype.at` (Safari 15.4),
    `findLast`…; `structuredClone` cũng chưa có (API của trình duyệt, không thuộc ES). Gọi tới là ném lỗi trước khi tầng tĩnh kịp vẽ
    huy hiệu và ghi chú. `tests/rules/imports.test.js` quét bao đóng tĩnh của đường nhẹ (§8.2).
76. **Thử ngừng vẽ** (đo trên GPU thật, Chrome headless trên Mac M2, sau GĐ 5):
    - Trình duyệt khóa nhịp thì rAF vẫn tới theo nhịp bị khóa dù trang không vẽ gì; máy chậm vì việc vẽ thì khung không vẽ tới theo
      màn 60 Hz sau một, hai khung (GPU làm nốt việc đã gửi). Giả khóa 30 Hz: mỗi `requestAnimationFrame` đợi hai nhịp. Giả máy chậm:
      nhịp rAF sau mỗi khung có lệnh vẽ trễ thêm 25 ms.
    - Khung không vẽ thì canvas giữ ảnh cũ: screencast quanh lần thử không có khung đen nào (độ sáng 51–54), chỉ 0,24 giây không có
      khung mới. Bộ chặn 60 khung/giây (`createFrameCap`) vốn bỏ khung theo cùng cách trên màn 90/120/144 Hz.
    - Trên cùng máy, WebGPU không đo được ms GPU (A.48), còn WebGL2 (`?webgl`) và SwiftShader thì đo được
      (`EXT_disjoint_timer_query_webgl2`): muốn thử đường nhịp trên WebGL2 thì giấu phần mở rộng ấy.
    - Hệ quả nhỏ, tự hết sau vài khung: `__sma.frames` đếm cả các nhịp không vẽ (`run.js` đếm nhịp của vòng lặp); khung đầu sau lần
      thử có `dt` bị kẹp ở 0,1 giây, nên số ms của `__sma.stats()` nhích lên một khung, và một mẻ của `gpu-timer` có nhịp khung dài
      hơn (Sổ tay mở thì không có lần thử, nên số đo "Tắt / Bật" không bị ảnh hưởng).
77. **Node bóng tự viết của một đèn** (đọc mã nguồn r186, `nodes/lighting/AnalyticLightNode.js`; đã chạy thật ở GĐ 6: WebGPU trên GPU
    thật và WebGL2 trên SwiftShader cho cùng một ảnh, 28 draw call ở mức cao, không có lượt vẽ bóng nào):
    - `setup()` chỉ gọi `setupShadow` khi `light.castShadow` và `builder.object.receiveShadow` cùng đúng. `setupShadow` thoát ngay khi
      `renderer.shadowMap.enabled` là `false`.
    - Có `light.shadow.shadowNode` thì three dùng node đó (`nodeObject(customShadowNode)`) thay cho `setupShadowNode()`: không tạo
      `ShadowNode`, nên không có render target hay lượt vẽ bóng nào. Màu đèn được nhân với node đó (`colorNode.mul(shadowNode)`), nên
      node trả `vec3` thì ánh sáng có màu.
    - `castShadow` của đèn nằm trong khóa của bộ đèn (`LightsNode`: `_hashData.push(light.castShadow ? 1 : 0)`). Bật/tắt nó lúc chạy
      là biên dịch lại; thêm hay bớt một đèn cũng vậy.
    - Node bóng của mỗi đèn được dựng một lần rồi giữ lại (`shadowColorNode`): đổi chế độ bằng uniform, không thay node lúc chạy.
    - (GĐ 6, chạy thật) Node `vec3` cho ánh sáng có màu: lớp Giấy nhân màu tấm giấy vào, và vách sau mang màu của tấm nó nhìn ra.
      Test dịch shader trong Node cần nạp đèn của scene vào `LightsNode` như lúc vẽ; không nạp thì shader không có đèn nào và không
      thấy node bóng (`tests/helpers/nodes.js`).
78. **`PointLight`** (`nodes/lighting/PointLightNode.js`): `decay` và `distance` là uniform, cập nhật mỗi khung (`decayExponentNode`,
    `cutoffDistanceNode`). Đổi lúc chạy không biên dịch lại. (GĐ 6, chạy thật) Thí nghiệm "Ánh sáng không suy giảm" đổi `decay` lúc
    chạy; e2e thấy góc xa sáng lên ngay ở khung đứng yên.
79. **`DataTexture` có mip tự tính** (`renderers/webgpu/utils/WebGPUTextureUtils.js`): với `DataTexture`, backend WebGPU nạp từng mức
    trong `texture.mipmaps`. `TextureNode` nhận mức mip qua `level()`. (GĐ 6, chạy thật) WebGL2 cũng nạp đủ các mức; nửa tối của
    gobo trên vách giống nhau ở hai backend khi so ảnh.
80. **Vật cắt hình trong lượt vẽ bóng** (`renderers/common/Renderer.js`, `materials/nodes/NodeMaterial.js`):
    - Lượt vẽ bóng dùng `material.maskShadowNode`; không có thì dùng `material.maskNode`. Điểm nào có mặt nạ `false` thì bị bỏ
      (`discard`).
    - `maskNode` cũng cắt ở lượt vẽ thường. Vì vậy một `maskNode` đủ cho trống của Bức 2 ở cả hai lượt.
    - `castShadowNode` cho bóng có màu, và cần `renderer.shadowMap.transmitted = true` (thiếu thì three cảnh báo một lần).
    - (GĐ 6, chạy thật) Thí nghiệm "Shadow map thật": trống cắt đúng hình trong lượt vẽ bóng trên cả WebGPU và WebGL2 (WebGL2 lộ
      răng cưa rõ hơn). Camera bóng của `PointLight` mặc định thấy từ 0,5 m: trống cách lửa 9 cm, nên phải hạ `shadow.camera.near`
      (0,02), không thì cả chiếc đèn nằm ngoài cube map.
81. **`NodeMaterial` gốc cho một hình tự dò tia** (đọc mã nguồn r186: `materials/nodes/NodeMaterial.js`, `MeshBasicNodeMaterial.js`,
    `nodes/accessors/Normal.js`; GĐ 7 chạy thật ở task đầu):
    - Lớp gốc có `lights = false`, nên `setupOutgoingLight()` trả `diffuseColor.rgb` (tức `colorNode`): màu ra không qua đèn nào.
      `emissiveNode` vẫn được cộng vào, và được ghi vào kênh emissive của MRT.
    - Ở fragment, `normalView` là `builder.context.setupNormal()`, và lớp gốc trả `normalNode` (nếu có). Vì vậy kênh normal của MRT
      (`packNormalToRGB(normalView)`, `engine/gpu/pipeline.js`) mang đúng pháp tuyến mà material đưa vào.
    - `MeshBasicNodeMaterial.setupNormal()` luôn trả `normalViewGeometry` và bỏ qua `normalNode`, nên không dùng được cho hình tự dò tia.
    - Lớp gốc có `fog = true` mặc định. Bức 3 không có sương, nhưng vẫn đặt `fog = false` cho rõ.
    - (GĐ 7, chạy thật) View Normal của Kính mài và Lột lớp thấy pháp tuyến SDF ở cả GPU thật và WebGL2: thân hành tinh quay về camera
      ra kênh lam trội (`e2e/cung-que.spec.js`, "view Normal của Lột lớp"). Emissive của sao, viền khí quyển, lá vào bloom như dự đoán.
82. **Ghi độ sâu từ fragment** (`NodeMaterial.setupDepth`, `nodes/display/ViewportDepthNode.js`):
    - Có `depthNode` thì three gán `depth.assign(depthNode)`: fragment ghi độ sâu của chính nó (WGSL `@builtin(frag_depth)`, GLSL
      `gl_FragDepth`).
    - Renderer của xưởng không bật `logarithmicDepthBuffer` hay `reversedDepthBuffer` (`engine/gpu/stage.js`). Khi đó độ sâu của phần
      cứng là `viewZToPerspectiveDepth(viewZ, near, far) = (near + viewZ)·far / ((far − near)·viewZ)`, nằm trong [0; 1], giống nhau ở
      WebGPU và WebGL2: với ma trận chiếu của WebGL, (z_ndc + 1)/2 ra đúng biểu thức này.
    - (GĐ 7, chạy thật) Mã sinh ra có `frag_depth` (WGSL) và `gl_FragDepth` (GLSL). Bật "Hiện khối bao" rồi xem view Depth: chỗ tia
      trúng hình gần hơn chỗ tia trượt ở cả hai backend; lá rơi khuất sau thân cây đúng chỗ, và thí nghiệm "Không ghi độ sâu" làm lá đè
      lên thân.
83. **Vòng lặp trong TSL** (`nodes/utils/LoopNode.js`, `nodes/utils/Discard.js`):
    - `Loop(n, ({ i }) => …)` nhận `n` là số hay node `int`. Cận là uniform cũng được: đổi lúc chạy mà không biên dịch lại.
    - `Break()` và `Continue()` đặt trong `If`; `Discard()` bỏ điểm ảnh.
    - (GĐ 7, chạy thật) Cận là uniform chạy đúng ở cả hai backend, và nấc hạ số bước không biên dịch lại. Nhưng vòng có cận động bọc
      một hàm SDF lớn rất đắt, kể cả khi chỉ chạy một vòng: xem A.88.
84. **`Fn(...).once()`** (`nodes/tsl/TSLCore.js`): đặt `shaderNode.once = true`, nên lời gọi được giữ lại để dùng chung trong một lần
    dựng shader. Có tham số `subBuilds` (như `normalView` dùng `['NORMAL', 'VERTEX']`). Bức 3 dựa vào đó để vòng dò tia chạy một lần
    cho cả màu, pháp tuyến và độ sâu; task đầu kiểm mã sinh ra (§19.10).
    - (GĐ 7, chạy thật) Mã fragment của khối bao có đúng một vòng dò chính (một khai báo `sdfT`, WGSL `var<private>`, GLSL `float`):
      `sdfScene` được gọi 5 lần (4 cho pháp tuyến, 1 trong vòng dò), dù màu, `normalNode` và `depthNode` cùng đọc kết quả.
85. **Playwright 1.63: lọc và chia test** (`playwright/lib/common/index.js`, `runner/index.js`):
    - `--grep` so với chuỗi ghép từ tên project, đường dẫn file, các `describe`, tên test và tag (`_grepTitleWithTags`).
    - `--shard` chia theo số test, theo thứ tự. Trọng số cho từng phần chỉ có qua biến môi trường `PWTEST_SHARD_WEIGHTS`: biến nội bộ
      Playwright dùng để tự test, không phải API công khai.
    - (GĐ 7, chạy thật) `--list` theo nhóm: mỗi project 130 test, gom đủ vào bốn nhóm (ao-sen-dem 41, den-keo-quan 42, cung-que 41,
      chung 6), không test nào ở hai nhóm. Tên bức có dấu cách và dấu "·" đi qua biến môi trường của workflow mà không vỡ.
86. **OrbitControls xoay trọn vòng** (`examples/jsm/controls/OrbitControls.js`): `minAzimuthAngle` và `maxAzimuthAngle` mặc định là
    `−Infinity` và `Infinity`, tức không giới hạn. Xưởng gán thẳng từ `CameraSpec.azimuth` (`engine/gpu/stage.js`), nên
    `[−Infinity, Infinity]` cho camera đi vòng quanh. (GĐ 7, chạy thật) Kéo ngang 1,5 vòng trên GPU thật và WebGL2: camera sang mặt bên
    kia của hành tinh, cảnh vẫn chạy, không lỗi (`e2e/cung-que.spec.js`).
87. **Hàm có layout không được đọc uniform trực tiếp** (r186: `NodeBuilder.buildFunctionNode`; GĐ 7, chạy thật):
    - Mã của mỗi hàm `Fn(...).setLayout(...)` được giữ trong một bộ nhớ đệm cấp module, theo BACKEND (`_functionNodeCache`: backend →
      WeakMap theo shaderNode). Mã chỉ dựng một lần.
    - Uniform đọc thẳng trong thân hàm chỉ được đăng ký vào khối uniform ở lần dựng đầu. Lần dựng sau (một material khác, hay chính
      material đó được biên dịch lại, ví dụ khi đổi MRT) dùng lại mã hàm mà không đăng ký. Kết quả: WGSL báo "struct member … not found",
      cảnh về tĩnh (`gpu-error`).
    - Dịch thử trong Node không thấy lỗi nếu mỗi lần dịch một renderer mới. Phải dịch lại trên CÙNG renderer mới tái hiện được
      (`tests/helpers/nodes.js#compileRenderer`).
    - Cách làm: truyền uniform vào làm tham số của hàm; chỗ gọi (trong hàm chính) đọc uniform. Hàm nào gọi một hàm như thế mà phải đọc
      uniform thì không có layout (viết thẳng, bọc `Fn().once()` nếu cần tính một lần).
    - Tên tham số của hàm có layout tránh từ khóa của WGSL và GLSL: `smooth` là từ khóa của cả hai.
88. **Vòng lặp có cận là uniform bọc một hàm SDF lớn rất đắt** (GĐ 7 Task 8, đo trên Mac M2, Chrome, WebGPU):
    - AO của Bức 3 viết bằng `Loop(aoCap, …)`, mỗi vòng gọi `scene`. Cả khung chậm gấp đôi so với không có AO: 2560×1600, mức cao,
      80,8 ms so với 45,8 ms.
    - Chi phí không theo số vòng: chạy 1 vòng (78,8 ms), 3 vòng (74,9 ms), 5 vòng (80,8 ms) gần như nhau. Vòng có mặt nhưng chạy
      0 vòng: 45,8 ms.
    - Trải thẳng năm mẫu bằng vòng `for` của JS (năm lời gọi `scene` liền nhau, không vòng lặp trong shader): 41,1 ms, rẻ hơn cả bản
      có vòng mà chạy 0 vòng.
    - Đoán nguyên nhân: hàm SDF được inline; một bản chép nữa nằm trong vòng lặp động làm tăng thanh ghi, GPU chạy ít luồng song song
      hơn. Chưa kiểm bằng số đo của GPU (Chrome headless không báo ms GPU trên máy này).
    - Luật: vòng lặp có cận động chỉ dùng khi cần thoát sớm (dò tia chính, dò bóng). Số mẫu cố định (AO, gradient) thì trải thẳng bằng
      JS; số đó cố định theo mức lúc dựng, không có nấc nào đổi nó. Test đếm `for (` trong mã sinh ra giữ luật này cho Bức 3.
89. **`PassNode` đổi độ sâu theo công thức phối cảnh, bất kể camera** (`nodes/display/PassNode.js`; đọc mã; đã chạy thật ở GĐ 8):
    - `getViewZNode()` luôn gọi `perspectiveDepthToViewZ(texture độ sâu, near, far)`. `getLinearDepthNode()` dựng trên nó, kèm chú thích
      `// TODO: just if ( builder.camera.isPerspectiveCamera )`.
    - Với camera trực giao, texture độ sâu đã tuyến tính. Đi qua công thức phối cảnh thì gần như mọi điểm dồn về sát 0 (near 0,1, far
      500: 0,5 thành chừng 0,0002), nên view Độ sâu thành một bóng trắng trên nền đen.
    - (GĐ 8, chạy thật) Đúng như vậy trên GPU thật, cả WebGPU lẫn WebGL2 (Task 1): với công thức cũ, tờ giấy và đàn gà trắng tinh một màu;
      dùng `pipeline.js#linearDepth` thì có độ dốc. E2e "độ sâu của camera trực giao" giữ điều này (§20.9).
90. **Texture độ sâu của camera trực giao là tuyến tính ở cả hai backend:**
    - WebGL đưa z của NDC từ [−1, 1] về [0, 1]; WebGPU dùng thẳng [0, 1]. Với phép chiếu trực giao, cả hai cho
      `d = (−viewZ − near) / (far − near)`.
    - `orthographicDepthToViewZ` (`nodes/display/ViewportDepthNode.js`) có nhánh riêng cho `renderer.reversedDepthBuffer`. Xưởng không bật
      cờ đó.
    - (GĐ 8, chạy thật) View Độ sâu dùng thẳng texture có độ dốc ở WebGPU (GPU thật) và WebGL2 (SwiftShader): gà gần sáng hơn vách xa. Bản
      nét đổi texture ra đơn vị cảnh chỉ bằng một phép nhân với `far − near`, và độ lệch khỏi mặt phẳng của mặt sàn nghiêng bằng 0 ở cả hai
      backend (e2e: mặt sàn không đổi khi tắt Bản nét): texture đúng là tuyến tính, không chỉ đơn điệu.
91. **`positionViewDirection` tự xử lý camera trực giao** (`nodes/accessors/Position.js`):
    - Lúc dựng shader, `builder.camera.isOrthographicCamera` thì hướng nhìn là `vec3(0, 0, 1)` (view space); không thì là `−positionView`
      chuẩn hóa. Vì vậy shader khác nhau theo loại camera.
    - Mã tự tính `cameraPosition − positionWorld` (Bức 1, 2, 3 có vài chỗ) chỉ đúng với camera phối cảnh.
    - (GĐ 8, chạy thật) Hạt điệp của Bức 4 tính tia phản xạ với `positionViewDirection`: camera đứng yên thì hạt đứng yên, kéo xoay 30 px
      thì hạt khác lóe (e2e trên WebGL2 SwiftShader và GPU thật). Shader của tờ giấy dịch được ở cả hai backend.
92. **OrbitControls và Raycaster với camera trực giao:**
    - OrbitControls (`examples/jsm/controls/OrbitControls.js`):
      - dolly (lăn chuột, chụm hai ngón) đổi `object.zoom`, kẹp trong `minZoom`/`maxZoom` (mặc định 0 và ∞), rồi gọi
        `updateProjectionMatrix()`;
      - bán kính chỉ bị kẹp trong `minDistance`/`maxDistance`, không đổi theo dolly;
      - phát sự kiện `start` và `end` khi bắt đầu và kết thúc một lần tương tác.
    - `Raycaster.setFromCamera` (`core/Raycaster.js`): gốc tia là điểm NDC trên mặt phẳng của camera (`unproject`); hướng là hướng nhìn của
      camera, tức `(0, 0, −1)` biến đổi theo `matrixWorld`. Test cũ của `input.js` đòi gốc tia bằng vị trí camera: điều đó chỉ đúng với
      camera phối cảnh.
    - (GĐ 8, chạy thật) Lăn chuột phóng to và zoom kẹp ở 2,5 (`CameraSpec.zoom`): e2e "phóng to 2,5 lần" thấy tờ giấy phủ kín khung.
      `start`, `end` điều khiển tranh tự khép lại (e2e: kéo thì `goc` > 15, buông thì về dưới 1). Tia chạm: unit test đưa tia của
      `setFromCamera` với camera trực giao thật vào `floorPoint`, trúng (0; 0), (−4; 3), (5; −2), (6; 4,5) sai số dưới 10⁻⁶ ở khung 1,6 và
      390/844; chạm giữa sàn trên trang thật thì thóc rắc ra (e2e Đàn gà).
93. **Trong post, camera của TSL là camera vẽ quad:**
    - `RenderPipeline` vẽ qua `QuadMesh`, và `QuadMesh` có một `OrthographicCamera` riêng (`renderers/common/QuadMesh.js`). Vì vậy
      `cameraNear`, `cameraFar` hay `builder.camera` trong post không phải camera của cảnh.
    - Cần near, far của camera cảnh thì đặt uniform từ JS. Chọn công thức theo loại camera thì chọn bằng JS lúc dựng.
    - (GĐ 8, chạy thật) Bản nét của Bức 4 không đọc `cameraNear`, `cameraFar` của TSL: `far − near` của `ctx.camera` vào uniform
      `banNetSpan` lúc dựng, và lớp ném lỗi nếu camera của sân khấu không phải trực giao; `pipeline.js#linearDepth` chọn theo
      `camera.isOrthographicCamera` của sân khấu. Nét đúng ở cả hai backend.
94. **`SpriteNodeMaterial` với camera trực giao** (`materials/nodes/SpriteNodeMaterial.js`):
    - `scaleNode` được nhân như `vec2`, nên hạt dẹt được; `rotationNode` xoay hạt trong mặt phẳng màn hình;
    - `sizeAttenuation` chỉ có nghĩa với camera phối cảnh.
    - (GĐ 8, chạy thật) Thóc là Sprite dẹt (`scaleNode` 0,08 × 0,04, quay theo hạt giống) dưới camera trực giao, có sàn theo điểm ảnh
      (2,5 × 1,5 điểm ảnh; `cotPixel` = bề cao khung nhìn / `zoom` / số điểm ảnh). Ảnh trên GPU thật ở WebGPU và WebGL2 (Task 8): cùng
      một nắm, cùng số hạt còn lại sau khi gà con mổ.

    Đom đóm của Bức 1 và thóc của Bức 4 vẽ theo cùng một cách.
95. **Nhánh của `If` dùng chung biến texture với nhánh khác** (r186: `ConditionalNode`, `ContextNode`, `IsolateNode`, `TextureNode`; GĐ 8
    Task 1, chạy thật trên GPU thật và SwiftShader):
    - Mỗi nhánh dựng trong một cache cô lập CÓ cache cha (`isolate()`). Nhưng `ContextNode.setup` trả node vừa dựng trong cache cô lập, và
      `Node.build` dựng nó THÊM một lần ở cache cha. Dữ liệu của mọi node trong nhánh vì vậy cũng nằm ở cache cha, nên nhánh anh em tìm
      thấy nó qua cache cha.
    - `TextureNode.generate` nhận hai tham số, nên three không gán lại biến của nó cho từng khối (`addFlowCodeHierarchy` chỉ chạy với
      node "generate once"). Texture đọc lần đầu ở nhánh 1 thì nhánh 2 đọc lại biến chưa gán: ra 0, ảnh đen. Phép tính thường (TempNode)
      thì được dựng lại trong nhánh.
    - Gặp ở `tools/pick.js`: mọi tap chứa màu của scene pass, nên Lột lớp và Kính mài ra đen ở nấc "Trước bloom" (ba bức đầu, từ GĐ 5)
      và "Trước khi in bản nét" (Bức 4). Cách tránh: bọc view của mỗi nhánh trong `isolate(node).setParent(false)`, cache KHÔNG có cha:
      nhánh nào cũng tự đọc texture của nó; thuộc tính, varying, uniform và `VarNode` vẫn dùng chung vì nằm ở cache toàn cục. Test dịch
      lượt cuối (WGSL, GLSL) và kiểm mỗi nhánh chỉ đọc biến nó tự gán hay biến gán ngoài mọi nhánh (`tests/unit/pipeline.test.js`).
96. **Texture độ sâu đọc kiểu nearest** (`textures/DepthTexture.js`, `renderers/webgpu/nodes/WGSLNodeBuilder.js`; GĐ 8 Task 1):
    - `DepthTexture` mặc định `NearestFilter`, và WGSL coi nó là không lọc được: `textureLoad` ở điểm ảnh `floor(uv · cỡ)`. WebGL2 đọc
      điểm ảnh gần nhất như vậy.
    - Lấy mẫu lân cận ở `tâm ± k` điểm ảnh với k lẻ nửa (1,5) rơi đúng mép giữa hai điểm ảnh: bên này làm tròn lên, bên kia xuống, hai
      mẫu không còn đối xứng. Độ lệch khỏi mặt phẳng của mặt sàn nghiêng khi ấy khác 0, và Bản nét của Bức 4 vẽ cả sàn thành sọc mực.
      Cách tránh: tính tâm điểm ảnh theo cỡ của chính texture độ sâu (`textureSize`) và dời một số NGUYÊN điểm ảnh.
97. **Compute trên WebGL2: nhánh không gán một bộ đệm thì bộ đệm giữ giá trị cũ** (`nodes/accessors/StorageBufferNode.js`,
    `renderers/webgl-fallback/nodes/GLSLNodeBuilder.js`; GĐ 8 Task 2, đọc ngược bằng `getArrayBufferAsync` trên GPU thật, cả hai backend):
    - Không có storage buffer (WebGL2), mỗi bộ đệm mà kernel đọc hay ghi thành một thuộc tính (bản để đọc) và một varying (bản để ghi,
      transform feedback bắt lại): `StorageBufferNode.generate` gọi `registerTransform`. three chép thuộc tính sang varying ở đầu `main()`
      (khối `// transforms` của `getTransforms`), TRƯỚC phần luật. Nhánh không gán ô đó thì bản ghi nhận đúng giá trị cũ, không phải rác.
      WebGPU ghi tại chỗ nên cũng giữ giá trị cũ.
    - Kiểm: nhánh `index < 64` chỉ gán `a`, nhánh kia gán cả hai; sau ba bước, `b` của nhánh đầu vẫn là giá trị khởi tạo, ở cả WebGL2 lẫn
      WebGPU.
    - Bể hạt (§20.7) vẫn giữ quy ước mọi nhánh gán đủ `a` lẫn `b`, cho mỗi nhánh nói đủ trạng thái mới của phần tử; quy ước đó không phải
      để tránh rác.
98. **Quán tính của OrbitControls tắt theo số lần `update()`, không theo giây** (`examples/jsm/controls/OrbitControls.js`, `update()`;
    GĐ 8 Task 3, OrbitControls thật trong unit test, không cần DOM):
    - Mỗi lần `update()` khi `enableDamping`: camera xoay thêm `_sphericalDelta × dampingFactor`, rồi `_sphericalDelta` nhân với
      `1 − dampingFactor` (dòng 717–718 và 799–802). Phần xoay dở của một lần kéo sau n lần là `(1 − dampingFactor)ⁿ`, mỗi khung dài
      bao lâu cũng vậy.
    - `scene.js` kẹp dt của khung ở 0,1 s (`clock.js`): ở 10 khung/giây (SwiftShader trên runner CI), 4,2 giây cảnh chỉ là 42 lần
      `update()`, còn 0,95⁴² ≈ 12% phần xoay dở. Phần ấy tiếp tục xoay camera ra khỏi nhà sau khi tranh tự khép lại đã đặt nó về. Ở 60
      khung/giây cùng quãng ấy còn 0,95²⁵² ≈ 2·10⁻⁶.
    - Cách tránh: đặt `dampingFactor = 1 − (1 − 0,05)^(dt × 60)` mỗi khung, TRƯỚC `update()` (`home.js`, chỉ bức có `CameraSpec.home`).
      Quán tính tắt theo giây của cảnh ở mọi nhịp khung và đúng bằng mặc định ở 60 khung/giây. Test: OrbitControls thật, `rotateLeft(1)`
      rồi buông, 8 giây cảnh ở 10, 30, 60 khung/giây: sai lệch khỏi nhà dưới 0,01° (bỏ dòng đặt `dampingFactor` thì ở 10 khung/giây còn
      chừng 5,5°, ở 30 khung/giây chừng 0,08°). E2e SwiftShader ở máy dựng thử chạy đủ nhanh nên chưa thấy lỗi này.
99. **Mẫu ngoài khung của texture độ sâu đọc điểm ảnh ở mép, ở cả hai backend** (`renderers/webgpu/nodes/WGSLNodeBuilder.js`,
    `generateTextureLod`; GĐ 8 Task 5, đọc mã WGSL sinh ra và chạy thật trên GPU thật lẫn SwiftShader):
    - WebGPU: texture độ sâu lọc kiểu nearest là texture không lọc được, đọc bằng `textureLoad`. three kẹp uv theo cách quấn của texture
      (`ClampToEdgeWrapping`: `tsl_coord_clampS_clampT_2d`), rồi kẹp chỉ số điểm ảnh vào [0, cỡ − 1]. Lần đọc ngoài khung vì vậy không bao
      giờ tới GPU (không phải chuyện "tùy máy" của WGSL), mà ra điểm ảnh ở mép.
    - WebGL2: `texture()` với `CLAMP_TO_EDGE` cũng ra điểm ảnh ở mép.
    - Hệ quả cho dò cạnh lấy mẫu lân cận: ở hàng sát khung, mẫu ngoài khung có thể trùng chính điểm giữa, nên độ lệch khỏi mặt phẳng thành
      hiệu bậc một và góc gãy của mặt sàn nghiêng 20° là 70°: một vệt mực giả dọc khung. Bản nét của Bức 4 bỏ cặp mẫu có điểm ngoài khung
      (§20.4 lớp 3). E2e: phóng to 2,5 lần, không lệch bản: chưa bỏ thì hàng sát mép dưới tối hơn sàn ngay trên 0,07 (độ sáng 0–1), bỏ rồi
      còn 0,004. Lệch bản mặc định (2, 1) dời điểm giữa lên một hàng, mẫu ngoài khung không trùng điểm giữa nữa, góc gãy chỉ còn chừng 16°,
      nên ở góc của tranh vệt giả không hiện; kéo xoay chừng 65° (mặt sàn nghiêng theo chiều ngang) rồi phóng to thì nó hiện dọc mép trái
      của khung (thấy trên GPU thật).
100. **Tone mapping AgX nén vùng sáng: hạt emissive trên giấy sáng phải có độ sáng HDR cỡ chục** (`agxToneMapping` và bloom chọn lọc trên kênh
     `emissive` của Phủ bóng; GĐ 8 Task 6, đo trên GPU thật, DPR 2, góc của tranh):
    - giấy ngà (màu tuyến tính chừng 0,8) hiện ra RGB 196, 187, 168 ở vách, cùng LUT và vignette mặc định của Phủ bóng;
    - hạt điệp là chấm hai điểm ảnh có đỉnh tuyến tính 1 (`sparkle` 1,2), 3,4 (`sparkle` 4), 8 và 16. Ảnh cuối gần như không thấy hạt ở 1
      và 3,4, mờ ở 8, rõ ở 16 (điểm trắng, quầng nhỏ). View "Chỉ emissive" thì thấy hạt ở mọi mức, vì không qua tone mapping: đừng chỉnh
      độ sáng của hạt theo view ấy;
    - bloom (ngưỡng 0, cường độ 1) trên kênh emissive chỉ tỏa đáng kể từ đỉnh chừng 10: chấm hai điểm ảnh bị nhòe ở nửa độ phân giải;
    - hệ quả: phần phát sáng của một vật trên nền sáng đặt theo HDR (hàng chục), không theo độ sáng của nền. Ở góc nhìn của Bức 4,
      hạt ở mép giấy tỏa cả ra ván tối: Giấy điệp tắt hạt trong một lề quanh mép (GĐ 8 Task 11, §20.4 lớp 4).
101. **Mảng uniform (`uniformArray`) mà compute đọc được tải lại ở mỗi lần `renderer.compute`** (`nodes/accessors/UniformArrayNode.js`,
     `renderers/common/Renderer.js#compute`, `nodes/core/NodeFrame.js#updateNode`; GĐ 8 Task 8, chạy thật: thóc bị mỏ gà ăn ở cả hai backend):
    - `UniformArrayNode.updateType` là `RENDER`. `compute()` đặt `nodeFrame.renderId = info.calls`, số tăng ở mỗi lần gọi, nên
      `updateForCompute` gọi `update()` của mảng ở mọi lần compute, và `update()` chép `.array` vào bộ đệm uniform.
    - Hệ quả: lớp chỉ cần ghi `array[i].set(…)` trước khi compute (mảng mỏ của Bức 4, mỗi khung), không `needsUpdate`, không dựng node mới.
    - WGSL đặt mảng trong một struct uniform riêng, tên theo `setName` (`array< vec4<f32>, 10 >`, có dấu cách: test so bằng regex). GLSL
      (transform feedback của WebGL2) đặt nó vào một khối `uniform NodeBuffer_<id>` và bỏ tên (như `CLAUDE.md` ghi từ GĐ 6 cho material).
102. **`renderer.debug.getShaderAsync` KHÔNG trả mã của RenderObject đang vẽ; móc lần vẽ tìm lại được đúng RenderObject ấy**
     (`renderers/common/Renderer.js#debug.getShaderAsync`, `#_renderObjectDirect`, `#_renderScene`, `RenderObjects.js#get`,
     `RenderContexts.js#get`, `Pipelines.js#getForRender`; GĐ 9, đọc mã nguồn rồi đo trên site, §21.9):
    - `getShaderAsync(scene, camera, object)` gọi `await this.compileAsync(object, camera, scene)` rồi mới đọc `this._renderTarget ||
      this._outputRenderTarget` và `this._mrt` để lấy RenderObject bằng `this._objects.get(…)` KHÔNG có passId: tham số mặc định của
      `RenderObjects.getChainMap(passId = 'default')` chỉ áp cho `undefined`, nên nó tra chain map `'default'`. Lần vẽ (`_renderObjects`,
      `renderObject`) và `compileAsync` truyền passId `null`. Nên nó KHÔNG BAO GIỜ trả RenderObject mà renderer vẽ, kể cả với quad cuối
      (câu cũ "quad cuối ... cùng một RenderObject" là sai): nó lấy hay tạo một RenderObject riêng, mà NodeBuilderState đến từ bộ nhớ chung của
      `Nodes` (khóa là cache key của RenderObject), tức lần dựng lúc `pipeline.compile()` mở trang (độ sâu gọi 0), không phải lần dựng của
      scene pass (độ sâu 1: khóa của render context gồm cả độ sâu gọi).
    - Mã sinh ra phụ thuộc lịch sử dựng: tên `NodeBuffer_<id của node>`, thứ tự thành viên của struct uniform, thứ tự hàm. Hai lần dựng cùng
      material, target và MRT ra mã tương đương mà không trùng từng ký tự (Bức 1: 8/10 vật lệch ở WebGPU, 4/10 ở WebGL2).
    - `compileAsync` của nó chạy `updateBefore` loại FRAME của từng vật (`frameId` đã tăng trong `nodeFrame.update()`): reflector vẽ lại phản
      chiếu, PassNode vẽ lại scene pass, ở độ sâu gọi 0, nên có RenderObject mới với tên node mới, thành program mới (Bức 1: 74 → 89).
    - Với quad cuối, `compileAsync(quad, camera, quad)` dùng `sceneRef = _scene` (lightsNode khác lần vẽ) và dựng không có `_vertexNode` của
      QuadMesh (`QuadMesh.render` chỉ gán nó quanh lần vẽ của chính nó): một biến thể với vertex shader mặc định (`renderStruct`), thêm program.
    - Cách đúng (GĐ 9, `draws.js#capture`): ngay trong lần vẽ, sau khi hàm vẽ gốc trả về, gọi lại đúng lời gọi của `_renderObjectDirect`:
      `renderer._objects.get(object, material, scene, camera, lightsNode, context, clippingContext, passId)`, với `context` =
      `renderer._currentRenderContext` lấy LÚC VÀO móc (`_renderScene` của lượt lồng đổi rồi trả nó). Cùng chain key (vật, material, context,
      lightsNode; passId) thì ra đúng RenderObject vừa vẽ, không tạo mới; `getNodeBuilderState()` trả NodeBuilderState đã dựng, và
      `Pipelines.getForRender` dùng chính hai chuỗi ấy làm khóa của program GPU (A.103). Quad cuối nhận ra bằng `isQuadMesh` ở lần vẽ ngoài
      cùng. Đo một lần (§21.9): trùng từng ký tự với mã của program mà backend vẽ, không thêm program nào.
103. **`compileAsync` chụp render context lúc gọi rồi nhường luồng chính giữa các vật; program giữ theo chuỗi mã**
     (`Renderer.js#compileAsync`, `#_createObjectPipeline`, `utils.js#yieldToMain`, `Pipelines.js#getForRender`; GĐ 9, đọc mã nguồn):
    - phần đồng bộ (tới trước lần chờ đầu) tính render context từ target và MRT đang đặt, chiếu vật vào render list, và mỗi vật thành một việc
      của hàng đợi mang theo chính `renderContext` đó (`_createObjectPipeline` ở chế độ async chỉ ghi việc);
    - phần async làm từng việc: `await nodes.getForRenderAsync`, tạo pipeline, rồi `await yieldToMain()` (`scheduler.yield()`, không có thì
      `requestAnimationFrame`). Giữa hai vật, vòng lặp của trang vẽ được khung;
    - hệ quả: render context chụp lúc gọi, nhưng mã dựng sau đó đọc target và MRT HIỆN TẠI của renderer (A.105): trả target + MRT ngay sau
      lời gọi thì dựng ra biến thể sai cho một render context đúng. Phải để chúng nguyên suốt lần chờ, và giữ khung (§21.3: `pipeline.compile`);
    - `Pipelines` giữ program đỉnh, điểm ảnh và compute trong `programs.vertex`, `.fragment`, `.compute`, khóa là chính chuỗi mã: RenderObject
      mới mà mã trùng thì dùng lại program cũ.
104. **`RenderPipeline` vẽ quad cuối với tone mapping tắt; quad là trường riêng** (`renderers/common/RenderPipeline.js`; GĐ 9, đọc mã nguồn):
    - `render()` gọi `_update()`, tạm đặt `renderer.toneMapping = NoToneMapping` và `outputColorSpace` = không gian màu làm việc, tắt XR, vẽ
      `this._quadMesh` (một `QuadMesh` với `NodeMaterial` tên `'RenderPipeline'`), rồi trả lại cả ba;
    - `_updateContext()` đặt `material.contextNode = context({ toneMapping, outputColorSpace, … })` (khi `outputColorTransform` là `false`) và
      `material.fragmentNode = outputNode`;
    - không có API công khai trả quad hay mã của nó. GĐ 9 không chép việc này: Bản dịch bắt quad cuối ngay lúc RenderPipeline vẽ nó (A.102),
      không đọc `_quadMesh`, không đổi tone mapping.
105. **`NodeMaterial.setup` đọc render target và MRT của renderer lúc dựng; `PassNode.compileAsync` giữ chúng suốt lần chờ**
     (`materials/nodes/NodeMaterial.js#setup`, `nodes/display/PassNode.js#compileAsync`; GĐ 9, đọc mã nguồn và chạy thật trên site):
    - `setup(builder)` gọi `renderer.getRenderTarget()`; khác `null` thì ghép `renderer.getMRT()` (và `mrtNode` của material) vào đầu ra, và
      dựng độ sâu từ MRT nếu có kênh `depth`. Không có target thì một đầu ra, bỏ `mrtNode`. Hai thứ ấy không lấy từ render context.
    - `PassNode.compileAsync(renderer)` đặt target + MRT của pass, `await renderer.compileAsync(scene, camera)`, rồi mới trả lại. Đúng cho
      mã (A.103), nhưng vòng lặp của trang vẽ khung trong lúc chờ (`yieldToMain`): `RenderPipeline.render()` vẽ quad cuối vào target đang đặt,
      tức ảnh của scene pass mà quad đang đọc.
    - Đo trên site thật (2026-10-08, headless Chromium, GPU thật, không `?freeze`), Kính mài chọn Normal lúc cảnh đang chạy: WebGPU báo
      "Render pipeline creation failed … Color target has no corresponding fragment stage output" kèm hai lỗi GPU (Bức 1; Bức 4 năm dòng lỗi);
      WebGL2 báo mười bảy lần "GL_INVALID_OPERATION: glDrawArrays: Active draw buffers with missing fragment shader outputs". Xưởng biên dịch
      lại trong lúc giữ khung (`engine/gpu/hold.js`, §21.3); Bản dịch không đặt target nào (bắt lúc vẽ, A.102).
    - Lỗi GL của WebGL2 đến console ở mức `warning`, không phải `error`: e2e chỉ thấy khi quét `log.all` (§21.8). Trên SwiftShader (Bức 1)
      đo bảy lần (mười bảy trên GPU thật): số lần theo số khung vẽ lọt vào lúc chờ, nên khác nhau giữa các máy.
