# Sơn Mài Ánh Sáng

> Vẽ tranh 3D bằng những lớp ánh sáng; mài từng lớp để thấy bức tranh được làm ra thế nào.

**Xem trực tuyến:** https://giabao2610.github.io/son-mai-anh-sang/

## Đây là gì

Trong mỹ thuật Việt, sơn mài là một kỹ thuật: người thợ phủ nhiều lớp sơn, rồi mài cho lớp dưới lộ ra.
Dự án dùng lại đúng ý đó cho đồ họa 3D trên web:

- Mỗi **lớp** là một kỹ thuật dựng hình (instancing, phản chiếu, hạt tính trên GPU, hậu kỳ…), có trọng số từ 0 đến 1.
- **"Mài"** là gỡ dần từng lớp để thấy bức tranh được làm ra thế nào, xuống tận **cốt** đất sét.
- Cảnh nào cũng phải đẹp trọn vẹn, ghi rõ kỹ thuật đang dùng, và có núm chỉnh ngay trên trang: vừa ngắm vừa học.

**Bức 1 · Ao Sen Đêm:** một ao sen đêm, sơn từ sáu lớp ánh sáng (đủ sáu lớp từ giai đoạn 3):
Cốt (lá, hoa, lau sậy bằng đất sét, dựng bằng instancing), Ánh trăng (trăng đúng pha đêm nay, ánh trăng và bóng,
chất liệu), Sương (vòm trời có sao, quầng trăng, Ngân Hà; sương là là trên mặt nước), Mặt nước (phản chiếu, gợn sóng),
Vàng lá (đom đóm tính trên GPU, trôi theo curl noise) và Phủ bóng (bloom chọn lọc, tone mapping AgX/ACES, LUT "sơn mài"
sinh từ bảng màu, hạt, tối góc, FXAA). Chạm mặt nước để thấy gợn sóng xẻ bóng trăng; chạm hai lần để thả một ngọn hoa đăng
mang một cặp câu thơ; giữ tay để đom đóm tụ lại; vuốt để sương xoáy; kéo thanh giờ để trăng đi qua đêm.

**Bức 2 · Đèn Kéo Quân** (giai đoạn 6, trang `tranh/den-keo-quan/`): một ngọn đèn kéo quân treo giữa gian nhà tối, sơn từ sáu
lớp: Cốt (gian nhà, chiếc đèn, trống hình nhân cắt theo một mặt nạ vẽ bằng code), Ngọn nến (đèn điểm thật ở ngọn lửa, luật nghịch
đảo bình phương), Gian nhà (gạch bát, vôi loang, vân gỗ, cột sơn son, đều là texture thủ tục), Giấy (ánh sáng xuyên giấy dó và
nhuộm màu ánh sáng ra phòng), Kéo quân (bóng đoàn quân tính bằng gobo `atan(y, x)` làm node bóng của đèn nến, không có shadow map
nào) và Phủ bóng. Chạm để thổi nến (lửa ngả, bóng khổng lồ chao trên vách); vuốt để gạt trống quay nhanh hơn; giữ để dừng trống.

**Bức 3 · Cung Quế** (giai đoạn 7, trang `tranh/cung-que/`): chú Cuội ngồi gốc cây đa trên một hành tinh nhỏ, con trâu gặm cỏ, Trái
Đất treo trên trời. Không có một tam giác nào cho hành tinh, cây, Cuội và trâu: cả thế giới là một hàm khoảng cách (SDF), vẽ bằng một
quả cầu bao mà mỗi điểm ảnh dò tia vào trong. Sáu lớp: Cốt (thế giới SDF bằng đất sét, ghi độ sâu và pháp tuyến như vật thường), Mặt
trời (nắng theo đúng pha trăng của ngày đang xem, bụi trăng phản xạ kiểu Lommel–Seeliger), Bóng mềm (bóng và AO dò bằng chính hàm
khoảng cách, không shadow map), Ánh đất (Trái Đất có pha ngược pha trăng, bầu trời sao, ánh Trái Đất trên phần đêm), Lá đa (lá rơi
theo trọng lực trăng, đường rơi tính trên GPU, xếp lớp với thế giới SDF nhờ độ sâu) và Phủ bóng. Chạm vào tán để lá rơi; giữ để cây đa
nhổ rễ bay lên mang theo chú Cuội; kéo để đi vòng quanh hành tinh; kéo núm "Ngày âm lịch" để nắng quét qua các pha trăng.

**Bức 4 · Đàn Gà Mẹ Con** (giai đoạn 8, trang `tranh/dan-ga-me-con/`): tranh Đông Hồ "Đàn gà mẹ con" bước vào được. Một tờ giấy điệp
cong (phẳng ở phía trước làm sân, uốn lên thành vách ở phía sau) nằm trên tấm ván sơn đen; gà mẹ ngậm con ong đứng giữa, mười gà con
quây quần. Bức đầu tiên không dựng ánh sáng thật: cảnh vẽ phi hiện thực cho giống tranh in khắc gỗ, nhìn bằng camera trực giao (vật ở xa
không nhỏ đi, chỉ nằm cao hơn trong khung, như lối vẽ của tranh dân gian). Sáu lớp: Cốt (tờ giấy và đàn gà bằng đất sét; gà ghép từ khối
cầu, nón, trụ), Bản màu (năm màu tự nhiên của Đông Hồ, ánh sáng chia nấc), Bản nét (nét mực dò cạnh trên ảnh độ sâu, không thêm lượt vẽ
nào; vảy lông, cánh, mắt vẽ trong shader; bản nét in lệch như in tay), Giấy điệp (sợi dó, vệt chổi, hạt điệp lóe theo góc nhìn), Đàn gà
(thóc tính trên GPU bằng bể hạt dùng chung với đom đóm của Bức 1; gà tính thẳng từ thời gian) và Phủ bóng (ACES, cho giấy ngà và màu in
đậm). Chạm để rắc thóc (gà con chạy tới mổ, nắm thóc vơi dần); giữ để gà mẹ xòe cánh gọi con; kéo để bước vào tranh, buông tay ba giây
thì tranh tự khép lại về góc nhìn ban đầu. Không ai chạm thì cứ 25 giây gà mẹ bới ra một nhúm thóc.

Các bức lật qua lại bằng link ngay dưới tên bức; **Phòng tranh** (`tranh/`) liệt kê mọi bức. Các bức sau dùng chung kỹ thuật và chung
một "xưởng".

Trong lúc tải cảnh 3D, trăng cạnh con dấu có một vòng quầng mảnh vẽ dần theo từng bước tải (tải code, dựng cảnh, hòa dần), nên
mạng chậm vẫn thấy trang đang nhích (giai đoạn 5).

## Thả hoa đăng

Chạm hai lần lên mặt nước (giai đoạn 5): hai lần chạm vẫn tạo hai vòng gợn, và giữa vòng gợn hiện một búp hoa đăng, nở đủ 8 cánh
trong khoảng 1,5 giây. Một cặp câu thơ (ca dao hay thơ cổ điển, có ghi nguồn) hiện phía trên ngọn đèn và đi theo nó.

- Đèn trôi chậm về phía lối trăng, nhấp nhô khi gợn đi qua, hắt một vũng sáng ấm trên nước, hiện trong ảnh phản chiếu và mờ dần
  trong sương. Tới gần bờ, hoặc sau 90 giây, đèn chìm dần rồi tắt.
- Ao giữ tối đa 8 đèn trôi ở mức cao (6 ở mức vừa, 4 ở mức thấp); thả thêm thì đèn cũ nhất chìm sớm.
- Mười hai cặp câu, mỗi đêm một thứ tự khác (cùng `?at` thì cùng thứ tự).
- Mọi đèn chung một InstancedMesh với đèn ở bờ, nên thả bao nhiêu đèn cũng không thêm draw call nào. Đèn thả ra chỉ tự phát sáng
  (thêm đèn thật lúc chạy là mọi chất liệu biên dịch lại). Đường trôi tính thẳng từ thời gian, nên `?freeze=N` vẫn cho đúng khung N.

## Sổ tay: mài từng lớp

Sau lần chạm đầu tiên (hoặc phím đầu tiên, với người dùng bàn phím), trang mời *"Bức tranh này có 6 lớp — mài thử?"*. Bấm vào là vào **chế độ mài**:

- Mọi lớp trừ Cốt mờ dần về 0, bức trở về đất sét xám. Nút **"Phủ lớp tiếp theo"** sơn lại từng lớp một và mở
  **Sổ tay** của lớp vừa phủ. Trên **thanh lớp** có thể bật/tắt tự do từng lớp (Cốt thì không). Đóng thanh lớp là về lại
  bức tranh đầy đủ.
- Sổ tay của mỗi lớp có ba tab. **Hiểu**: lớp làm gì, một sơ đồ, "Bạn vừa học", "Đọc thêm". **Chỉnh**: núm (Tweakpane)
  và code thật của lớp; rê chuột lên một núm thì dòng code dùng núm đó sáng lên. **Phá**: thí nghiệm "Thử phá" (tắt
  instancing, bias = 0, độ phân giải phản chiếu 0.1, CPU vs GPU…) kèm số đo trực tiếp (draw call, tam giác, mili giây
  mỗi khung, mili giây CPU). Thí nghiệm so sánh (như "CPU vs GPU", "Chỉ 1 octave") vẽ hai cột "Tắt / Bật".
- Ở tầng tranh tĩnh vẫn đọc được Sổ tay (nút "Xem 6 lớp của bức tranh"): chữ, sơ đồ và code; núm cần cảnh 3D.
- Trong DevTools: `__sma.layers()`, `__sma.setWeight('mat-nuoc', 0)` (mài một lớp ngay), `__sma.snapshot()`,
  `__sma.restore(s)`, `__sma.stats()` (draw call, ms, ms CPU, ms GPU), `__sma.quality()` (mức, nấc đang hạ, máy có đo được
  GPU không, nấc bị khóa), `__sma.degrade()` / `__sma.upgrade()` (hạ/nâng tay một nấc), `__sma.tools()` /
  `__sma.setTool('kinh-mai')` (công cụ học; `'tung-soi'` là Từng sợi), `__sma.dials()` / `__sma.setDial('gio', 27)` (thanh giờ),
  `__sma.readouts('anh-trang')` (số đo riêng của một lớp, như Sổ tay đọc: ở lớp Ánh trăng có số hoa đăng đang trôi).
- Mất GPU (máy ngủ, đổi card đồ họa): lần đầu trang hiện poster và nút "Dựng lại cảnh", dựng lại đúng trạng thái cũ;
  lần hai thì về tranh tĩnh.

## Link công thức: gửi đúng bức tranh bạn vừa mài

Mài vài lớp, chỉnh vài núm, kéo thanh giờ, rồi muốn gửi cho ai đó đúng bức tranh ấy:

- **Chép link:** trong thanh lớp có mục **Công thức**, nút "Chép link công thức". Link dạng `…/son-mai-anh-sang/#r=suong:0,gio:23`:
  đọc được, sửa tay được. Cờ như `?debug` hay `?level=thap` không vào link, vì chúng là môi trường của máy bạn, không phải bức tranh.
  Chép không được (trình duyệt chặn) thì link hiện trong một ô để bạn chép tay.
- **Thanh địa chỉ tự mang công thức:** mỗi lần mài hay chỉnh, thanh địa chỉ đổi theo (không thêm mục vào lịch sử, nút Back vẫn là Back).
  Tải lại trang không mất việc đang mài; đánh dấu trang hay chép thẳng từ thanh địa chỉ đều được.
- **Mở một link có công thức:** bức hiện thẳng theo công thức, thanh lớp mở sẵn với một dòng tóm tắt ("2 lớp đã mài · 3 núm đã chỉnh ·
  giờ 23:00"). Dán một link khác vào cùng tab cũng áp ngay. Mục nào trong link hỏng thì bỏ, các mục còn lại vẫn áp.
- **Về nguyên bản:** nút cạnh dòng tóm tắt; các lớp phủ lại, núm và Dial về mặc định, link về trống.
- **Mặc định là của máy người mở.** Link chỉ ghi những gì bạn đã đổi. Thanh giờ bạn không kéo thì không có trong link: người nhận
  thấy đêm của chính họ. Núm có trần theo mức máy thì bị kẹp theo máy người nhận.
- Link không mang thí nghiệm đang bật, công cụ đang bật, góc camera và mức chất lượng.

## Bản dịch: đọc mã shader mà GPU thật sự chạy

Ở Sổ tay › **Chỉnh**, cạnh code JS của lớp có thêm nút **Bản dịch** (chỉ ở bản 3D). Code TSL là code JS; three dịch nó ra WGSL
(WebGPU) hay GLSL (WebGL2) trên chính máy bạn, và đó mới là thứ GPU chạy.

- Chọn **Vật** mà lớp có mặt (nhiều lớp không có vật riêng: Sương góp vào shader của lá sen, Phủ bóng nằm trong lượt cuối · hậu kỳ),
  rồi **Đỉnh** hay **Điểm ảnh**. Dòng có uniform của lớp (`w_<lớp>`, `<lớp>_<núm>`) có vạch vàng; rê một núm thì sáng đúng các dòng
  của núm ấy.
- Vì sao có `w_<lớp>`: trọng số của lớp là một uniform trong mã. **Mài lớp chỉ đổi con số ấy, mã không đổi, nên không biên dịch lại**
  (luật 2 của kỹ thuật). Mài thử rồi mở Bản dịch: mã vẫn y nguyên, chỉ giá trị của `w_<lớp>` đổi.
- Mã là của một khung vẽ thật: xưởng bắt lấy chuỗi mã mà three vừa dùng, nên cảnh không khựng và không tạo thêm program nào cho GPU.
  Đổi núm hay bật thí nghiệm lúc Bản dịch đang mở thì nó dịch lại.
- Chưa có: mã compute (đom đóm, thóc), vì three không có API công khai để lấy.

## Công cụ học: nhìn vào bên trong một khung hình

Trong thanh lớp có mục **Đồ nghề** (mỗi lúc bật một công cụ; đóng thanh lớp thì công cụ tắt):

- **Kính mài:** soi một bước giữa chừng của khung hình (*Trước tone*, *Trước bloom*, *Chỉ emissive*, *Normal*, *Depth*).
  Hình **tròn** đi theo chuột (điện thoại: chạm để đặt, giữ rồi kéo để dời); hình **gạt** chia khung bằng một vạch kéo được
  (cả bằng bàn phím): bên trái là ảnh đang soi, bên phải là ảnh cuối. Chọn *Normal* lần đầu thì xưởng phải biên dịch lại một lần
  ("đang mài…").
- **Lột lớp:** một thanh trượt lột dần ảnh cuối về từng bước, từ ảnh cuối tới depth.
- **Từng sợi** (giai đoạn 5): dệt lại khung hình từng lần vẽ (draw call) một, theo đúng thứ tự GPU nhận. Thanh trượt đi từ 0 (chưa
  vẽ gì, chỉ còn màu nền) tới N (ảnh đủ); nút "Dệt lại" chạy hết 0 → N, mỗi sợi chừng 0,6 giây, cả lượt không quá chừng 12 giây
  (nhiều sợi thì đi nhanh hơn). Dòng mô tả cho biết sợi đang xem vẽ vật gì (nhãn, lớp, số bản, số tam giác), và dòng tóm tắt đếm
  lượt vẽ cảnh, phản chiếu, các lượt khác. Bật "Tắt instancing" là thấy mỗi lá nổi thành một sợi: hơn nghìn sợi ở mức cao (tối
  đa 1.200). Xưởng chỉ gắn móc lần vẽ (`renderer.setRenderObjectFunction`) khi công cụ bật.
- **Thanh giờ:** kéo từ 18:00 tới 05:30; trăng, lối trăng, bóng, màu trời và sương đi theo; trăng thấp thì ánh trăng yếu.

Công cụ chạy trên mọi bức: chúng chỉ nhìn các "view" (và Từng sợi chỉ nhìn danh sách lần vẽ) mà xưởng đưa cho, bức không biết có
công cụ nào. Trên máy tính, bảng của công cụ nằm giữa thanh lớp và Sổ tay; màn hẹp hơn 1240 px thì Sổ tay thu lại khi một công cụ
bật. Từ nút công cụ trên thanh lớp, phím Tab đi hết phần còn lại của thanh lớp (các nút Đồ nghề sau nó, thanh giờ, "Phủ lớp
tiếp theo", nút đóng) rồi mới vào bảng của công cụ; sau bảng là Sổ tay.

## Chất lượng: hợp với nhiều loại máy

Trang tự chọn mức theo máy: WebGPU trên máy tính là **cao**, WebGPU trên điện thoại hay WebGL2 trên máy tính là **vừa**,
WebGL2 trên điện thoại là **thấp** (phản chiếu giả, không bóng, ít đom đóm hơn). Sau đó, không ép máy quá sức:

- **Tối đa 60 khung/giây**, kể cả trên màn 90/120/144 Hz: GPU không phải vẽ gấp đôi. Màn "60 Hz" thật ra chạy 60,02–60,1 Hz
  không bị bỏ khung nào.
- **Bộ điều chỉnh tự động** đo nhịp khung theo cửa sổ 2 giây. Chậm (dưới 50 khung/giây trên máy tính, 37 trên điện thoại)
  thì hạ từng nấc: độ nét (DPR), chi tiết sương, độ nét phản chiếu, bloom, số đom đóm, cỡ bóng. Rảnh lại thì nâng lên.
  Đang hạ thì huy hiệu ghi *"hạ n nấc"*. Khi Sổ tay mở (bạn đang thử phá), nó chỉ ra tay nếu máy quá tải nặng.
- **Đo thời gian GPU thật** khi máy cho phép (Chrome, Edge trên máy tính): bộ điều chỉnh phân biệt được máy yếu (hạ nấc) với
  trình duyệt đang khóa 30 khung/giây để tiết kiệm pin (không hạ gì). Sổ tay có thêm dòng mili giây GPU. Safari và nhiều
  điện thoại chưa đo được; GPU Apple trên Chrome báo các lượt vẽ chồng lên nhau (số lớn hơn cả nhịp khung) nên cũng bị coi là
  không đo được. Khi đó dòng ms GPU ghi "—", bộ điều chỉnh đoán theo nhịp khung. Trước lần hạ đầu, nó ngừng vẽ chừng 0,2 giây để
  thử: không vẽ gì mà nhịp vẫn chậm thì trình duyệt đang khóa nhịp để tiết kiệm pin, và nó không hạ gì (trước đây, trên Mac để chế độ
  tiết kiệm pin, ảnh mờ dần chừng 20 giây rồi mới nét lại).
- **Núm có trần theo mức:** trên máy yếu, núm không kéo được số đom đóm, độ phân giải phản chiếu hay số tầng noise của
  sương lên quá sức máy.
- Xem trước mức khác ngay trên máy tính: thêm `?level=thap` (hoặc `vua`, `cao`) vào địa chỉ.

Dựng bằng three.js 0.186.1 (`WebGPURenderer` + TSL, tự lùi về WebGL2) và Vite 8.
Máy không dùng được GPU vẫn thấy poster, thơ và con dấu ngày âm lịch (tầng tranh tĩnh).
Không có backend, tài khoản hay tracking.

Thiết kế đầy đủ: [docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md](docs/superpowers/specs/2026-09-28-son-mai-anh-sang-design.md).

## Chạy trên máy

Cần **Node 24** (Vite 8 và Vitest 5 không chạy trên Node 20). Cách cài theo thư mục, không đổi Node của project khác:

```bash
brew install fnm
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc   # rồi mở một terminal mới
fnm install 24
```

Chưa cài được fnm? Tải Node 24 bản portable từ nodejs.org/dist, giải nén vào một thư mục tạm và đặt thư mục `bin`
của nó lên đầu `PATH` trong terminal đang dùng.

Trong thư mục repo (fnm tự đọc `.nvmrc`):

```bash
node -v                            # v24.x
npm install
npm run dev                        # mở http://localhost:5173/son-mai-anh-sang/ (Bức 2: …/tranh/den-keo-quan/, Bức 3: …/tranh/cung-que/, Bức 4: …/tranh/dan-ga-me-con/, Phòng tranh: …/tranh/)
npm test                           # unit, luật ranh giới, hợp đồng
npm run pages                      # sinh lại trang HTML của mọi bức và Phòng tranh (rồi commit các file đổi)
npx playwright install chromium    # chỉ cần lần đầu, trước khi chạy e2e
npm run e2e                        # build rồi chạy e2e (tranh tĩnh, WebGL2, WebGPU)
```

Số test (giai đoạn 8): `npm test` chạy 118 file, 1451 test. E2e liệt kê 185 test cho mỗi project; test nào không thuộc project đó
thì tự bỏ qua (Playwright ghi "skipped").

**WebGPU e2e trên CI (ubuntu):** với headless shell của Playwright, mọi test WebGPU rơi về tranh tĩnh vì
`device-lost: "A valid external Instance reference no longer exists"`. Project `webgpu-swiftshader` vì vậy dùng Chromium
đầy đủ (`channel: 'chromium'`) và, chỉ khi chạy trên CI, thêm cờ Vulkan của SwiftShader
(`--enable-features=Vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader`). Từ giai đoạn 4, e2e WebGPU chạy ở một job
riêng (`e2e-webgpu`, không chặn deploy, trần 40 phút), song song với job `build` (chặn: unit, build, e2e tĩnh + WebGL2 kèm a11y).

**E2E chia theo bức trên CI (giai đoạn 7):** job `nhom-e2e` chạy `node scripts/e2e-groups.js`, in ma trận các nhóm sinh từ registry:
mỗi bức một nhóm (test có "{tên bức} · " trong tên), cộng nhóm `chung` (lật tranh, Phòng tranh). Mỗi nhóm một job `e2e` (chặn) và một
job `e2e-webgpu` (không chặn). Thêm bức là thêm job, không phải sửa workflow. Vì vậy mọi `describe` trong `e2e/<slug>.spec.js` bắt đầu
bằng `"{tên bức} · "` (test luật giữ quy ước này). Spec của một bức dài quá thì tách thành `e2e/<slug>-<phần>.spec.js` (giai đoạn 8:
bốn file của Bức 4), tiện ích dùng chung ở `e2e/<slug>.helpers.js`; test luật đọc mọi file của bức.

**E2E trên GPU thật của máy mình** (nhanh, bắt được lỗi của driver mà SwiftShader che mất):
`npm run build && E2E_REAL_GPU=1 npx playwright test --project=webgpu-real-gpu`.

## Cờ URL

Thêm vào sau địa chỉ trang, ví dụ `…/son-mai-anh-sang/?webgl&freeze=40`. Cờ bật khi có mặt; `=0` hoặc `=false` thì tắt.

| Cờ | Nghĩa |
|---|---|
| `?static` | Tranh tĩnh (tầng C): chỉ poster, thơ và con dấu, không tải three.js |
| `?webgl` | Ép dùng WebGL2 (tầng B) dù máy có WebGPU |
| `?force3d` | Bỏ qua kiểm tra GPU phần mềm (để e2e chạy được trên SwiftShader) |
| `?debug` | In chi tiết lỗi và mở three.js Inspector. `?debug=stats` mở stats-gl (FPS, CPU, GPU). Cả hai chỉ tải khi có cờ |
| `?at=2026-09-28T21:00` | "Bây giờ" giả lập. Không ghi múi giờ thì hiểu là giờ Việt Nam; muốn ghi thì dùng `Z` hoặc `%2B07:00` |
| `?freeze`, `?freeze=N` | Đồng hồ tất định: mỗi khung đúng 1/60 giây. `?freeze=N` dừng sau khung N |
| `?poster` | Ẩn mọi giao diện trừ canvas, để chụp poster (dùng cùng `?at` và `?freeze=N`) |
| `?level=cao\|vua\|thap` | Ép mức chất lượng (bỏ qua cách tự chọn theo máy); giá trị lạ thì bỏ qua |

Hash khác với query: `#r=…` là công thức của bức tranh (xem "Link công thức"), không phải cờ.

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `src/engine/`, `src/ui/` | **Xưởng**: đồ nghề dùng chung (khởi động, dò tầng, pipeline, lớp dùng chung). Không biết có bức nào |
| `src/lib/` | **Hộp màu**: hàm "lá" (âm lịch, pha trăng, PRNG có hạt giống) và TSL dùng chung (noise, bể hạt compute `lib/tsl/particles.js`) |
| `src/paintings/<slug>/` | **Các bức**: mỗi bức một thư mục; `src/paintings/registry.js` liệt kê các bức |
| `src/paintings/_mau/` | **Tranh mẫu** hai lớp, không deploy: khuôn để copy khi làm bức mới, và là fixture của test hợp đồng |
| `plugins/` | Plugin Vite `?code`: tô màu code của lớp bằng Shiki lúc build cho tab Chỉnh của Sổ tay |
| `scripts/poster.js` | Chụp poster (WebP) và ảnh chia sẻ (og, JPEG) từ chính cảnh 3D, trên GPU thật |
| `scripts/pages.js` | Trình sinh trang (`npm run pages`): trang HTML của mọi bức và Phòng tranh từ một khuôn; test giữ từng byte |
| `scripts/e2e-groups.js` | Ma trận nhóm e2e của CI, sinh từ registry |
| `tranh/` | Trang của các bức sau Bức 1 (`tranh/<slug>/index.html`) và Phòng tranh (`tranh/index.html`), đều do trình sinh viết |
| `tests/` | Unit, luật ranh giới (`tests/rules/`), hợp đồng của các bức |
| `e2e/` | Playwright: tranh tĩnh, WebGL2 và WebGPU trên SwiftShader, trợ năng (axe-core) |

Luật làm việc với code (cho người và cho AI) nằm trong [CLAUDE.md](CLAUDE.md).

## Thêm một bức tranh mới

Mỗi bức là một thư mục, một trang HTML, một thư mục ảnh trong `public/` và một dòng registry (luật 7 của spec §0).
Không phải sửa xưởng, trừ khi bức cần một khả năng mới.

1. `cp -r src/paintings/_mau src/paintings/<slug>`, rồi sửa trong `meta.js`: `slug` (trùng tên thư mục, kebab-case không dấu),
   `no`, `title`, `tagline`, `poem` (có `source`), `poster` (kèm `capture`: thời điểm và khung để chụp), `og`, và `fence`
   (từ vựng riêng của bức, để test cấm xưởng nhắc tới).
2. Viết các lớp `layers/lN-<id>.js` (mỗi file `export const id`, `knobs`, `createLayer`); lớp đầu luôn là Cốt, lớp cuối thường
   là Phủ bóng dùng chung. Thêm `painting.js` (lớp, camera, `quality`, `setup`) và `content.vi.js` (chữ của Sổ tay).
   - Mọi vật trong `objects` của lớp có `name` (kebab-case không dấu, không trùng trong lớp), và nhãn ở
     `content.layers[id].objects[name]`: Từng sợi hiện nhãn này. Test tên vật kiểm cả vật mà thí nghiệm thêm vào.
   - `meta.layers[].files` kê mọi file trong `parts/` mà lớp import (thẳng hay qua part khác); lớp khác cần gì thì nhận qua
     `shared`, không import part của lớp khác. Kê thêm được file `lib/tsl/*.js` mà lớp import (giai đoạn 8), để Sổ tay hiện cả code
     của hộp màu. Mỗi file thuộc tối đa một lớp (test hợp đồng giữ); theo quy ước, file mà nhiều lớp cùng dùng thì không lớp nào kê,
     như `lib/tsl/noise.js` mà ba lớp của Bức 1 cùng dùng (Sương, Vàng lá, Ánh trăng).
   - Tùy chọn: muốn một dòng chữ (thơ, chú thích) hiện cạnh một vật và đi theo nó thì ghi chữ vào `content.captions`
     (`{ lines, source, author? }`, 1–2 dòng) rồi gọi `ctx.captions.show(khóa, anchor)`; code của bức chỉ cầm khóa.
   - Tùy chọn (giai đoạn 8): tranh in hay sa bàn thì nhìn bằng camera trực giao: `camera` có `kind: 'ortho'` cùng `height` (bề cao khung
     nhìn), `minWidth`, `zoom`. Muốn camera tự về góc của bức khi người xem buông tay thì thêm `home: { after, duration }` (giây). Chữ của
     trang đè lên tranh ở laptop màn thấp thì thêm `shortFrame: { below, maxGrow }`: canvas thấp hơn `below` điểm ảnh CSS thì khung nhìn cao
     thêm below / bề cao, tới `maxGrow` lần (Bức 4: 800 và 1,3).
   - Tùy chọn (giai đoạn 8): hạt tính trên GPU thì dùng bể hạt `lib/tsl/particles.js` (`createPool`: cấp phát một lần, vòng đệm, rắc
     theo nắm); luật chuyển động viết trong bức, và lớp kê `lib/tsl/particles.js` trong `files`.
   - Tùy chọn: đổi mặc định của Phủ bóng (tone, lộ sáng, bloom) bằng spread trong `painting.js`, chỉ thay `value` (hay `min`, `max`),
     như Bức 4; không sửa module dùng chung, vì các bức khác lắp chính nó.
3. Thêm `{ meta, page: 'tranh/<slug>/index.html', lang: 'vi' }` vào `src/paintings/registry.js`.
4. `npm run pages`: trình sinh viết trang của bức mới từ khuôn chung (tiêu đề, thơ, poster, thẻ og, dòng import, dải lật tranh) và
   viết lại dải link của bức kề trước cùng Phòng tranh. Không sửa trang bằng tay: test so từng byte với trang sinh ra.
5. Chụp poster từ chính cảnh: `npm run build && node scripts/poster.js <slug>` (máy có GPU thật). Ảnh ghi vào
   `public/paintings/<slug>/`.
6. `npm test` rồi sửa theo từng lỗi tiếng Việt; `npm run e2e`. E2e chung (mài lớp, hạ nấc, Kính mài, Lột lớp, Từng sợi, quầng
   trăng, a11y…) tự chạy trên bức mới. E2e riêng của bức viết vào `e2e/<slug>.spec.js` (dài quá thì tách thêm
   `e2e/<slug>-<phần>.spec.js`), mọi `describe` bắt đầu bằng `"{tên bức} · "`.

Công thức đầy đủ (thêm lớp, thêm công cụ học, thêm ngôn ngữ): spec §15.

Điều học được khi làm Bức 2 (giai đoạn 6):
- Một đèn có thể mang **node bóng tự viết** (`light.shadow.shadowNode`): three dùng node đó thay cho shadow map, nên bóng tính thẳng
  bằng hình học mà không thêm lượt vẽ nào. Các lớp góp vào node đó bằng phép nhân lúc dựng (màu giấy, bóng hình nhân).
- Lớp không import part của lớp khác: dữ liệu và hàm dùng chung (số đo của đèn, hàm giao tia) đi qua `shared`.

Điều học được khi làm Bức 3 (giai đoạn 7):
- **Hình tự dò tia** sống chung với mesh thường được, nếu nó ghi độ sâu và pháp tuyến như vật thường: `NodeMaterial` gốc (không phải
  `MeshBasicNodeMaterial`, vì nó bỏ qua `normalNode`), `depthNode` bằng `viewZToPerspectiveDepth`, vòng dò bọc `Fn().once()` để màu,
  pháp tuyến và độ sâu dùng chung một lần dò.
- Hàm shader có layout (`setLayout`) không đọc uniform trực tiếp trong thân: three giữ mã của hàm theo backend, nên lần biên dịch sau
  thiếu uniform (spec Phụ lục A.87). Truyền uniform vào làm tham số.
- Vòng lặp có cận là uniform bọc một hàm SDF lớn làm cả khung chậm gấp đôi trên GPU Apple, kể cả khi chỉ chạy một vòng: số mẫu cố
  định (AO) thì trải thẳng bằng vòng `for` của JS (spec Phụ lục A.88).
- Không có đèn nào của three: các lớp góp vào một "công thức tô" (`shared.cot.recipe`) lúc dựng.

Điều học được khi làm Bức 4 (giai đoạn 8):
- **Camera trực giao** cần độ sâu khác: three luôn đổi texture độ sâu bằng công thức phối cảnh, nên view Độ sâu thành một bóng trắng.
  Với camera trực giao, texture độ sâu đã tuyến tính: xưởng chọn công thức theo loại camera ở một chỗ (`pipeline.js#linearDepth`,
  spec Phụ lục A.89–A.90). Hướng nhìn trong shader lấy từ `positionViewDirection`, không tự tính từ vị trí camera.
- **Dò cạnh trên độ sâu** bằng độ lệch khỏi mặt phẳng (đạo hàm bậc hai) chứ không bằng Sobel: mặt sàn nhìn chếch có độ dốc lớn nhưng
  độ lệch bằng 0, nên không thành nét; nếp gấp đo bằng góc gãy của mặt. Texture độ sâu đọc kiểu nearest, nên mẫu đặt ở tâm điểm ảnh
  và cách nhau số nguyên điểm ảnh (spec Phụ lục A.96).
- **Luật hai lần, lần đầu:** bể hạt compute của đom đóm thành `lib/tsl/particles.js` khi thóc cần tới. Mã shader của đom đóm được ghi
  lại trước khi rút, và sau khi rút vẫn giống từng ký tự (trừ số id của node).
- Quán tính của OrbitControls tắt theo số khung, không theo giây: tranh tự khép lại đặt `dampingFactor` theo độ dài của khung, nên máy
  vẽ chậm cũng về đúng góc (spec Phụ lục A.98).
- three r186 dùng chung biến texture giữa các nhánh `If` anh em: view của Kính mài và Lột lớp phải bọc `isolate(…).setParent(false)`.
  Lỗi này làm nấc "Trước bloom" của ba bức trước ra đen từ giai đoạn 5 (spec Phụ lục A.95).
- Tone mapping nén vùng sáng: hạt điệp trên giấy sáng cần độ sáng HDR cỡ chục mới thấy (spec Phụ lục A.100). Bức đổi tone của Phủ
  bóng (Bức 4 dùng ACES) thì hex in của bảng màu là màu vào, chốt cho màu hiện ra đúng màu thiết kế.

## Poster và ảnh chia sẻ

Poster (`poster.webp`, ≤ 150 KB) và ảnh og (`og.jpg`, 1200×630) được chụp từ chính cảnh 3D, nên poster hiện ngay lúc mở trang
và cảnh 3D hòa lên trên là cùng một ảnh:

```bash
npm run build
node scripts/poster.js ao-sen-dem   # cần GPU thật (WebGPU); tự mở vite preview
```

Script mở `?at=<capture.at>&freeze=<capture.freeze>&poster&level=cao` ở cỡ của poster, chờ đúng khung đó, rồi mã hóa WebP và
JPEG ngay trong trang (không thêm gói npm nào). Muốn đổi thời điểm thì sửa `poster.capture` trong `meta.js` rồi chạy lại.
CI không chạy script này: ảnh được commit vào repo.

## Kích thước bundle

Số gzip do `npm run build` (Vite 8) in ra, đo ngày 2026-10-07 (giai đoạn 8, bốn bức). Tên file đã bỏ phần hash. Phần dùng chung
của các trang (phần nhẹ của trang, Phủ bóng) là chunk riêng, nên chunk vào của mỗi trang chỉ chừng 1 kB gzip.

| File | Kích thước | gzip |
|---|---:|---:|
| `assets/strings-*.css` (CSS chung, kèm chữ đi theo vật, quầng trăng, lật tranh) | 38.85 kB | 13.51 kB |
| `assets/phong-tranh-*.css` (Phòng tranh: bảng màu, font, lưới các bức; trang không có script) | 19.55 kB | 8.76 kB |
| `assets/strings.vi-*.js` (phần nhẹ dùng chung: khởi động, vỏ trang, chữ giao diện) | 22.02 kB | 10.26 kB |
| `assets/ao-sen-dem-*.js` · `den-keo-quan-*.js` · `cung-que-*.js` · `dan-ga-me-con-*.js` (chunk vào của từng trang) | 2.66 · 2.21 · 2.15 · 2.57 kB | 1.19 · 0.99 · 0.99 · 1.14 kB |
| `assets/run-*.js` (kèm đồ nghề, Từng sợi, móc lần vẽ, chữ đi theo vật, view, bộ điều chỉnh, camera trực giao, tranh tự khép lại) | 65.48 kB | 22.84 kB |
| `assets/workshop-*.js` (thanh lớp + Sổ tay + Đồ nghề) | 21.96 kB | 6.97 kB |
| `assets/layer-*.js` (Phủ bóng: bloom, LUT, grain, FXAA; kèm `lib/tsl/noise.js`; dùng chung) | 13.67 kB | 4.94 kB |
| `assets/content.vi-*.js` của Phủ bóng (dùng chung) | 5.56 kB | 2.20 kB |
| `assets/particles-*.js` (bể hạt `lib/tsl/particles.js`; Bức 1 và Bức 4) | 1.47 kB | 0.84 kB |
| `assets/BufferGeometryUtils-*.js` (của three; Bức 2 và Bức 4) | 3.77 kB | 1.10 kB |
| `assets/random-*.js` (PRNG; Bức 1, 3, 4) · `rolldown-runtime-*.js` (mọi đường 3D) | 0.21 · 0.15 kB | 0.17 · 0.15 kB |
| `assets/painting-*.js` của Bức 1 (kèm hoa đăng) | 36.91 kB | 15.25 kB |
| `assets/content.vi-*.js` của Bức 1 (chữ + sơ đồ của Sổ tay, thơ của hoa đăng) | 27.45 kB | 8.99 kB |
| `assets/painting-*.js` của Bức 2 (gobo, mặt nạ hình nhân, ngọn lửa, giấy, gian nhà, "Shadow map thật") | 27.42 kB | 10.84 kB |
| `assets/content.vi-*.js` của Bức 2 (chữ + năm sơ đồ của Sổ tay) | 20.15 kB | 6.56 kB |
| `assets/painting-*.js` của Bức 3 (thế giới SDF, khối bao dò tia, pha trăng, bóng mềm, Trái Đất, lá rơi) | 21.96 kB | 9.27 kB |
| `assets/content.vi-*.js` của Bức 3 (chữ + năm sơ đồ của Sổ tay) | 18.76 kB | 6.02 kB |
| `assets/painting-*.js` của Bức 4 (hình gà, bản màu, bản nét, giấy điệp, thóc, đàn gà dạng đóng) | 36.28 kB | 15.59 kB |
| `assets/content.vi-*.js` của Bức 4 (chữ + năm sơ đồ của Sổ tay) | 36.49 kB | 10.96 kB |
| `assets/three-*.js` | 926.30 kB | 253.85 kB |
| **Tổng đường 3D của Bức 1** (mọi chunk mà chunk vào, run, painting, content import tĩnh: phần nhẹ, workshop, Phủ bóng, three, chunk nhỏ dùng chung) | | **327.65 kB** |
| **Tổng đường 3D của Bức 2** (cùng cách tính) | | **320.70 kB** |
| **Tổng đường 3D của Bức 3** (cùng cách tính) | | **317.66 kB** |
| **Tổng đường 3D của Bức 4** (cùng cách tính) | | **331.01 kB** |
| `assets/knobs-*.js` (Tweakpane, chỉ tải khi mở tab Chỉnh lần đầu) | 149.30 kB | 30.96 kB |
| 73 chunk `?code` (code đã tô màu của từng file lớp, của cả bốn bức và hộp màu, tải theo lớp) | | 1.2–8.7 kB mỗi file |
| `assets/Inspector-*.js` (chỉ tải khi có `?debug`) | 172.84 kB | 38.66 kB |
| `assets/main-*.js` (stats-gl, chỉ tải khi có `?debug=stats`) | 33.10 kB | 8.95 kB |

Mục tiêu của spec (§10): cả đường 3D ≤ 450 KB gzip (kể cả Tweakpane: Bức 1 358.61 kB, Bức 2 351.66 kB, Bức 3 348.62 kB, Bức 4
361.97 kB). Từ giai đoạn 8, tổng tính mọi chunk mà đường 3D tải, kể cả hai chunk nhỏ dùng chung (runtime 0.15 kB, `random` 0.17 kB)
mà bảng của giai đoạn 7 bỏ sót. Tính cùng cách, giai đoạn 8 thêm 2.13 kB gzip cho đường 3D của Bức 1 (build lại cuối giai đoạn 7:
325.52 kB): `run` +0.78 kB (camera trực giao, tranh tự khép lại), chunk bể hạt 0.84 kB, `workshop` +0.40 kB (Sổ tay có thêm 20 file
code: 18 file của Bức 4, hai file của hộp màu), `three` +0.12 kB. `BufferGeometryUtils` tách khỏi chunk của Bức 2 vì Bức 4 cũng dùng.

Tầng tĩnh chỉ tải CSS (kèm font), poster, chunk vào của trang và phần nhẹ dùng chung; mở Sổ tay chỉ đọc thì tải thêm `workshop` và
`content`. Chunk `three-*.js` và phần 3D chỉ tải khi máy dùng được GPU.

## Giấy phép

MIT, xem [LICENSE](LICENSE). Mọi hình ảnh đều sinh bằng code. Thơ: ca dao (cả hai câu "Đèn cù" của Bức 2, hai câu chú Cuội của Bức 3,
hai câu "Khôn ngoan đối đáp người ngoài" của Bức 4);
Truyện Kiều (Nguyễn Du); thơ của hoa đăng là ca dao và thơ cổ điển đã hết bản quyền (Nguyễn Trãi, Hồ Xuân Hương, Nguyễn Du, Nguyễn
Khuyến).
