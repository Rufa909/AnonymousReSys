# Nhật ký đồ án Anonymous ReSys

## Ngày 10/11/2026 — Phân quyền sinh viên theo từng lớp

- Thêm sinhVienDuocPhep và capQuyenThamGiaLop, tối đa 100 ví/giao dịch; chỉ Admin hoặc giảng viên sở hữu lớp được cấp quyền. Kiểm tra quyền trong thamGiaLop và guiDanhGia.
- UI Admin/Giảng viên có hộp thoại nhập danh sách ví, kiểm tra, loại trùng và xem lại trước khi xác nhận MetaMask. Sinh viên chỉ thấy lớp đã được cấp quyền.
- Adapter nhận diện khả năng phân quyền riêng; contract cũ thiếu khả năng này bị khóa thao tác tham gia/đánh giá. Giữ hỗ trợ tên hàm tiếng Việt.
- Danh sách đăng ký học và ví cần được đối chiếu ngoài blockchain; chưa thêm SSO, đồng bộ MySQL hoặc thu hồi quyền.
- Kiểm tra: 23 test contract và 21 test Web3 đạt; build thành công, còn cảnh báo kích thước bundle trên 500 kB.
- Hướng dẫn: doc/SINH_VIEN_THEO_LOP.md. Chưa deploy, không sửa .env, cần triển khai bản mới để áp dụng kiểm soát này trên Sepolia.

## Ngày 10/11/2026 — Sửa nhận diện contract lúc được lúc không

- Kiểm tra chỉ có một .env; Vite tại cổng 5173 phục vụ đúng địa chỉ 0x1e15Ad55D073B55b080A5426eC78522EcD0Fa40F và ABI vietnamese. Không thấy cấu hình ngôn ngữ khác ghi đè.
- Xác nhận bytecode Sepolia có đủ selector cho sinhVienDaThamGia, sinhVienDaDanhGia, thamGiaLop, guiDanhGia, layDiemTrungBinh.
- Loại bỏ cách cố gọi lớp không tồn tại rồi dựa vào lỗi RPC để xác định khả năng Sinh viên. Với các contract Solidity deploy trực tiếp của dự án, đối chiếu selector PUSH4 trong runtime bytecode, không tìm chuỗi tùy ý trong PUSH data. Cách này không nhằm hỗ trợ proxy contract.
- Thêm test RPC bỏ dữ liệu revert: tải lặp 4 lần vẫn hỗ trợ Sinh viên và không còn gọi thử hàm gây revert. RPC lỗi đọc code phải báo lỗi, không đổi thành “không hỗ trợ”.
- Kết nối lại tạo client mới, hủy listener cũ; ngắt kết nối không giữ lại instance cũ khi không có giao dịch đang chờ. Chặn bấm kết nối trùng và tránh accountsChanged từ chính yêu cầu kết nối gây tải song song.
- Đồng bộ bộ test contract đang gọi tên tiếng Anh sang tên tiếng Việt thực tế; fixture chuyển tên tiếng Anh chỉ dùng kiểm tra tương thích adapter. web3:test chạy cả các test tiếng Việt mới.
- 20/20 test contract và 19/19 test Web3 đạt; đọc contract Sepolia 3 lần liên tiếp đều studentSupported=true, số lớp 0 tại thời điểm đọc. Giữ thư mục test vì còn được sử dụng; không đưa test vào bundle website.
- Không sửa contract/deploy, không đổi .env và không gửi giao dịch Sepolia.

## Ngày 10/11/2026 — Đặt ABI mặc định tiếng Việt và xử lý lỗi MetaMask lồng nhau

- Kiểm tra .env: address 0x1e15Ad55D073B55b080A5426eC78522EcD0Fa40F, ABI vietnamese, chain ID 11155111.
- Dùng adapter đọc trực tiếp RPC Sepolia: studentSupported=true, số lớp bằng 0 tại thời điểm kiểm tra. Không gửi giao dịch.
- Chuyển mặc định contractDefinition từ english sang vietnamese; nhánh english vẫn giữ để tương thích bản deploy cũ và các lời gọi chọn ngôn ngữ rõ ràng.
- Nhận diện lỗi LopKhongTonTai từ revert.name hoặc dữ liệu lỗi MetaMask/RPC lồng nhau; tránh nhận sai khả năng Sinh viên chỉ vì RPC không cung cấp revert.name. Lỗi mạng vẫn được báo, không coi là contract thiếu hàm.
- 5/5 test tập trung tiếng Việt đạt; frontend build thành công, còn cảnh báo kích thước bundle. Cần khởi động lại Vite và tải lại trang để bảo đảm dùng cấu hình và bundle mới.

## Ngày 10/11/2026 — Khôi phục địa chỉ deploy khi Remix không hiện instance

- Remix hiện giao dịch constructor dấu xanh nhưng lỗi giao diện đọc result, không thêm instance vào Deployed Contracts.
- Đọc receipt Sepolia tại block 12105381, transaction index 25: status 1, from ví Admin 0x2483e769B6d8f3D035121813998e7151f8bE23C7, contract tạo tại 0x1e15Ad55D073B55b080A5426eC78522EcD0Fa40F.
- Transaction hash: 0xde6a34a6b5c052c2405f679e81165cf6bdb76c261efc0fe7e7c05177f00d2046.
- Xác minh viAdmin đúng ví; tongSoLop bằng 0. Mô phỏng layDiemTrungBinh(0) và thamGiaLop(0) trả LopKhongTonTai; guiDanhGia(0,5) trả CongDanhGiaDangDong, xác nhận đủ hàm Sinh viên.
- Cập nhật riêng VITE_CONTRACT_ADDRESS trong .env sang địa chỉ mới, giữ nguyên ABI vietnamese, Sepolia và cấu hình MySQL. .env vẫn được Git bỏ qua.
- Các kiểm tra đều là đọc receipt/eth_call, không gửi thêm giao dịch hoặc deploy. Người dùng có thể dùng Add Contract với địa chỉ đã khôi phục.

## Ngày 10/11/2026 — Sửa nhận diện Sinh viên cho ABI tiếng Việt

- Kiểm tra ảnh và mã nguồn thực tế: adapter vietnamese thiếu tên hàm Sinh viên; thông báo giao diện còn yêu cầu đổi sang english.
- Bổ sung mapping và ABI cho sinhVienDaThamGia, sinhVienDaDanhGia, thamGiaLop, guiDanhGia, layDiemTrungBinh cùng các lỗi tiếng Việt.
- Kiểm tra khả năng Sinh viên từ contract thực tế thay vì chỉ nhìn cấu hình ABI. Contract cũ vẫn tải được dữ liệu nhưng không hiện/gửi chức năng Sinh viên chưa hỗ trợ.
- Thay thông báo sai về đổi ngôn ngữ bằng hướng dẫn deploy bản đầy đủ và cập nhật địa chỉ, giữ ABI khớp contract.
- Đọc Sepolia tại địa chỉ đang cấu hình 0x43ddAB1A429302eec01df753966718c53Ae108D8: tongSoLop trả 1 nhưng layDiemTrungBinh(0) revert rỗng, xác nhận địa chỉ hiện tại vẫn chưa có hàm mới.
- node --test test/web3/vietnamese.test.mjs: 3/3 ca đạt, gồm Sinh viên tiếng Việt tham gia/gửi điểm, bản cũ bị chặn và bản mới chưa có lớp vẫn được nhận diện.
- Frontend build thành công; git diff --check không có lỗi whitespace. Không đổi địa chỉ .env và không gửi giao dịch Sepolia.

## Thông tin đồ án

- **Học phần:** Blockchain.
- **Đề tài:** DApp quản lý và đánh giá giảng viên ẩn danh dựa trên công nghệ Blockchain.
- **Vai trò sử dụng:** Nhà trường (Admin), Giảng viên, Sinh viên.
- **Phần việc đang thực hiện:** Thành viên 1 — đã hoàn thành UI giai đoạn 1 và smart contract Admin/Giảng viên giai đoạn 2; chưa tích hợp Web3 giai đoạn 3.
- **Nguồn yêu cầu:** `README.md` và tài liệu phân công `AnonymousRESYS.docx` do người dùng cung cấp.

## Quy ước cập nhật

- Ghi thêm một mục theo ngày sau mỗi phiên làm việc có thay đổi đáng kể; giữ lại lịch sử các phiên trước.
- Mỗi mục ghi mục tiêu, công việc đã thực hiện, file liên quan, kiểm tra thực tế, vấn đề còn tồn tại và bước tiếp theo.
- Phân biệt rõ phần đã triển khai, phần mô phỏng và phần dự kiến. Chỉ ghi kiểm tra thành công khi có kết quả xác nhận.
- Không đưa khóa riêng, seed phrase, thông tin đăng nhập hoặc dữ liệu cá nhân vào nhật ký.

## Ngày 28/10/2026 — Xây dựng UI giai đoạn 1

### Mục tiêu

Đọc tổng quan đề tài và phân công để xây dựng phần giao diện của thành viên 1: layout chung, Dashboard Nhà trường và Dashboard Giảng viên.

### Hiện trạng ban đầu

- Repository chỉ có `README.md`, chưa có ứng dụng frontend.
- README mô tả kiến trúc, ba vai trò và mã smart contract tham khảo.
- Tài liệu phân công tách công việc thành bốn giai đoạn: UI, smart contract, tích hợp Web3, kiểm thử và báo cáo.
- UI Sinh viên và trang kết quả công khai thuộc phần việc của thành viên 2.

### Công việc đã thực hiện

**Khởi tạo frontend**

- Tạo ứng dụng React với Vite, cấu hình các lệnh chạy development, build và preview.
- Bổ sung `.gitignore` cho dependency, bản build, cache cài đặt và cấu hình môi trường cục bộ.
- Thiết kế giao diện tiếng Việt với tông xanh lá, Header, Sidebar, bộ chọn vai trò và nút Connect Wallet.
- Viết CSS thích ứng kích thước desktop và điện thoại.

**Dashboard Admin**

- Hiển thị thống kê giảng viên được duyệt, lớp học phần, lượt đánh giá và điểm trung bình.
- Hiển thị danh sách ví giảng viên; hỗ trợ tìm kiếm, lọc tất cả/chờ duyệt/đã duyệt.
- Cho phép duyệt ví chờ và thêm ví mới đã duyệt trong dữ liệu demo.
- Kiểm tra định dạng địa chỉ ví Ethereum và chặn địa chỉ trùng, không phân biệt chữ hoa/chữ thường.
- Thêm công tắc cổng đánh giá kèm hộp thoại xác nhận mở/đóng.

**Dashboard Giảng viên**

- Hiển thị thống kê và danh sách lớp của ví giảng viên demo đã được duyệt.
- Tạo học phần bằng tên, kiểm tra tên sau khi bỏ khoảng trắng thừa và giới hạn 120 ký tự.
- Tìm học phần theo tên hoặc ID; hiển thị số lượt đánh giá và điểm minh họa.
- Hiển thị trạng thái cổng khảo sát do Admin quản lý.

**Tương tác và tài liệu**

- Thêm thông báo kết quả thao tác và thông báo khi không có kết quả tìm kiếm.
- Thêm hộp thoại ví mô phỏng, hỗ trợ kết nối/ngắt kết nối demo.
- Hộp thoại hỗ trợ Escape, giới hạn focus bằng Tab và khôi phục focus khi đóng.
- Viết `FRONTEND.md` hướng dẫn cài đặt, chạy ứng dụng, cách demo và hướng tích hợp Web3.

### File liên quan

| File | Nội dung |
| --- | --- |
| `package.json` | Dependency React/Vite và lệnh chạy ứng dụng |
| `package-lock.json` | Khóa phiên bản dependency |
| `index.html` | Trang đầu vào và metadata tiếng Việt |
| `src/main.jsx` | Dashboard, dữ liệu mẫu, form và logic tương tác demo |
| `src/styles.css` | Giao diện và các breakpoint responsive |
| `.gitignore` | Loại trừ file sinh ra và cấu hình cục bộ |
| `FRONTEND.md` | Hướng dẫn chạy và phạm vi giai đoạn 1 |
| `NHAT_KY_DU_AN.md` | Nhật ký công việc của đồ án |

### Kiểm tra đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| `npm run build` | Thành công; Vite tạo bản production trong `dist/` |
| Mở ứng dụng trên trình duyệt | Hiển thị Dashboard Admin và Giảng viên |
| Duyệt một ví đang chờ | Chuyển sang đã duyệt; thống kê và số ví chờ cập nhật |
| Đóng cổng đánh giá | Có bước xác nhận; trạng thái chuyển sang đã đóng |
| Chuyển vai trò sang Giảng viên | Hiển thị không gian giảng dạy và danh sách lớp |
| Tạo lớp “Kiểm thử Blockchain” | Thông báo thành công; danh sách và số lớp cập nhật |
| Thêm ví sai định dạng `0x123` | Hiển thị lỗi định dạng, không thêm ví |
| Tải lại trang | Dữ liệu trở về bộ mẫu ban đầu |

Đã quan sát bố cục desktop trên trình duyệt. CSS responsive đã được viết, nhưng chưa kiểm tra trực tiếp đầy đủ các kích thước điện thoại. Chưa có bộ kiểm thử tự động.

### Vấn đề và cách xử lý

- File Word đang được ứng dụng khác sử dụng: đọc nội dung bằng chế độ chia sẻ đọc/ghi, không chỉnh sửa tài liệu nguồn.
- Cài dependency gặp tải chậm và lỗi `EBUSY` khi chạy esbuild. Sau khi dừng các lượt cài đang chạy, cài lại từ cache và chạy build thành công.
- Dev server trong sandbox không truy cập được từ trình duyệt của người dùng; chạy dev server ngoài sandbox tại cổng 5174 để kiểm tra giao diện.

### Giới hạn hiện tại

- Mọi thao tác chỉ cập nhật state React; chưa lưu bền vững và chưa ghi lên blockchain.
- Connect Wallet dùng ví mẫu, chưa kết nối MetaMask hoặc yêu cầu ký giao dịch.
- Bộ chọn vai trò phục vụ trình diễn; chưa phải xác thực hay phân quyền thực tế.
- Điểm số và số lượt đánh giá là dữ liệu minh họa.
- Chưa triển khai UI Sinh viên, trang kết quả công khai hoặc smart contract riêng trong repository.
- Contract tham khảo trong README chưa có trường lưu lời nhận xét, dù mô tả đề tài có nhắc đến phản hồi văn bản. Cần thống nhất yêu cầu trước khi triển khai phần này.
- Chỉ sử dụng địa chỉ ví không bảo đảm ẩn danh tuyệt đối trên blockchain công khai; cần đánh giá cơ chế bảo vệ danh tính ở các giai đoạn tiếp theo.

### Việc tiếp theo

- [ ] Kiểm tra trực tiếp giao diện trên các kích thước điện thoại và tablet.
- [ ] Thống nhất component, màu sắc và cấu trúc frontend với thành viên 2.
- [ ] Tách component và lớp truy cập dữ liệu khi bắt đầu tích hợp các phần của nhóm.
- [ ] Giai đoạn 2: triển khai và kiểm thử phần smart contract `approveTeacher`, `toggleEvaluation`, `createCourse` cùng cấu trúc dữ liệu liên quan.
- [ ] Giai đoạn 3: kết nối MetaMask, đọc vai trò từ contract, tích hợp Ethers.js và trạng thái giao dịch.
- [ ] Giai đoạn 4: kiểm thử bằng các ví khác nhau, hoàn thiện báo cáo kỹ thuật và hướng dẫn chạy.

### Cách chạy lại

```sh
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Khi cần dùng cổng 5174 như phiên kiểm tra:

```sh
npm run dev -- --port 5174
```

Kiểm tra bản production bằng `npm run build`.

## Mẫu ghi cho phiên tiếp theo

## Ngày 28/10/2026 — Xây dựng UI Sinh viên và kết quả công khai

### Mục tiêu

Tiếp tục phần việc của thành viên 2 trên nền giao diện Admin và Giảng viên đã có, giữ nguyên tông xanh, cấu trúc điều hướng và dữ liệu dùng chung giữa các vai trò.

### Công việc đã thực hiện

- Bổ sung vai trò Sinh viên vào bộ chọn không gian làm việc, hồ sơ ví mẫu và điều hướng responsive.
- Xây dựng Dashboard Sinh viên với thống kê lớp đã tham gia, lớp chờ đánh giá và số đánh giá đã hoàn thành.
- Xây dựng danh sách học phần để sinh viên tìm kiếm, tham gia lớp và nhận trạng thái đã đánh giá.
- Xây dựng biểu mẫu đánh giá gồm chọn 1–5 sao, nhận xét tối đa 500 ký tự, kiểm tra độ dài và thông báo quyền riêng tư.
- Chặn đánh giá khi chưa tham gia lớp, cổng đánh giá đóng, chưa chọn sao hoặc ví đã đánh giá lớp đó.
- Xây dựng trang kết quả công khai gồm xếp hạng học phần, điểm trung bình, số lượt đánh giá và phản hồi gần đây.
- Dùng chung state giữa ba vai trò: đánh giá mới cập nhật ngay số lượt, điểm trung bình và phản hồi công khai.
- Tách dữ liệu mẫu, bộ icon, giao diện Sinh viên và trang công khai thành các module riêng để phần mới liên kết với cấu trúc hiện có mà không lặp mã.

### File liên quan

| File | Nội dung |
| --- | --- |
| `src/main.jsx` | Kết nối vai trò Sinh viên, state dùng chung và luồng đánh giá |
| `src/components/Icon.jsx` | Bộ icon dùng chung cho toàn ứng dụng |
| `src/components/StudentWorkspace.jsx` | Dashboard và danh sách lớp của Sinh viên |
| `src/components/PublicResults.jsx` | Trang kết quả và phản hồi công khai |
| `src/data/demoData.js` | Dữ liệu mẫu dùng chung giữa ba vai trò |
| `src/styles.css` | Kiểu giao diện Sinh viên, kết quả, biểu mẫu đánh giá và responsive |

### Kiểm tra đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| `npm run build` | Thành công; 27 module được biên dịch |
| Chuyển vai trò sang Sinh viên | Hiển thị đúng Dashboard, thống kê và ví sinh viên |
| Gửi đánh giá 5 sao cho Công nghệ Blockchain | Thành công; số lượt tăng từ 32 lên 33 |
| Mở trang kết quả công khai | Phản hồi mới xuất hiện, không hiển thị địa chỉ ví sinh viên |
| Tham gia lớp An toàn và bảo mật thông tin | Nút chuyển từ Tham gia lớp sang Đánh giá |
| Console trình duyệt | Không có warning hoặc error |

### Giới hạn hiện tại

- Dữ liệu vẫn nằm trong state React và trở về mặc định khi tải lại trang.
- Chưa kết nối MetaMask, Ethers.js hoặc smart contract thật.
- Nhận xét văn bản mới được mô phỏng ở frontend; smart contract tham khảo trong README hiện chỉ lưu điểm số.
- “Ẩn danh” hiện là ẩn địa chỉ ví trên giao diện, chưa phải cơ chế ẩn danh mật mã trên blockchain công khai.

### Việc tiếp theo

- [ ] Tách lớp truy cập dữ liệu để thay state demo bằng Ethers.js.
- [ ] Thống nhất cách lưu nhận xét: on-chain, event hoặc IPFS kèm hash.
- [ ] Bổ sung smart contract và kiểm thử cho `joinCourse`, `submitReview` và chống đánh giá trùng.
- [ ] Kiểm thử responsive trên thêm kích thước tablet và điện thoại thực tế.

```markdown
## Ngày DD/MM/YYYY — Tên công việc

### Mục tiêu

### Công việc đã thực hiện

### File liên quan

### Kiểm tra đã thực hiện

### Vấn đề và cách xử lý

### Việc tiếp theo
```

## Ngày 07/11/2026 — Giai đoạn 2 thành viên 1

### Mục tiêu

Triển khai cấu trúc dữ liệu, phân quyền và logic quản lý Admin/Giảng viên theo phân công. Giữ phần đăng ký lớp và gửi đánh giá cho thành viên 2.

### Công việc đã thực hiện

- Kiểm tra repository: UI của cả ba vai trò và trang kết quả công khai đã có; chưa có file Solidity thực thi.
- Tạo `contracts/DecentralizedEduEvaluation.sol` bằng Solidity 0.8.28.
- Đặt ví deploy làm `schoolAdmin` cố định; bổ sung modifier `onlyAdmin`, `onlyApprovedTeacher` để kiểm tra quyền trên contract.
- Khai báo `Course`, `courses`, `courseCount`, `approvedTeachers`, `evaluationOpen`; chuẩn bị storage `enrolledStudents`, `hasEvaluated` cho thành viên 2.
- Triển khai `approveTeacher`: chỉ Admin, chặn địa chỉ zero, chặn duyệt trùng, phát event `TeacherApproved`.
- Triển khai `toggleEvaluation`: chỉ Admin, mặc định đóng, phát event khi đổi trạng thái.
- Triển khai `createCourse`: chỉ giảng viên được duyệt; ID tăng từ 0; lớp thuộc ví gọi hàm; tổng điểm và lượt đánh giá ban đầu bằng 0.
- Kiểm tra tên lớp: không rỗng, không chỉ chứa khoảng trắng/ký tự điều khiển ASCII, tối đa 480 byte UTF-8; lưu tên nguyên trạng, không ép trùng giới hạn ký tự của frontend.
- Viết script compile bằng solc-js cố định phiên bản, xuất ABI/bytecode có thể tái tạo; optimizer 200 runs, EVM target paris.
- Thiết lập EVM Hardhat 3 trong bộ nhớ và 11 ca kiểm thử bằng Node test runner/Ethers.
- Viết tài liệu chạy lệnh, demo Remix theo ba tài khoản và bàn giao storage/hàm cần bổ sung cho thành viên 2.
- Thêm liên kết triển khai thực tế ở đầu README; giữ phần code mẫu toàn luồng làm tài liệu tham khảo.

### File liên quan

| File | Nội dung |
| --- | --- |
| `contracts/DecentralizedEduEvaluation.sol` | Contract Admin/Giảng viên và cấu trúc dữ liệu dùng chung |
| `scripts/compile-contracts.mjs` | Biên dịch solc-js, xuất ABI và bytecode |
| `hardhat.config.js` | Blockchain cục bộ dùng trong test, chain ID 31337 |
| `test/contracts/admin-teacher.test.mjs` | Kiểm thử quyền, dữ liệu, event và các trường hợp lỗi |
| `package.json`, `package-lock.json` | Lệnh compile/test và dependency công cụ |
| `.gitignore` | Bỏ qua artifacts và cache |
| `doc/SMART_CONTRACT.md` | Hướng dẫn và lưu ý tích hợp |
| `README.md` | Liên kết đến contract và hướng dẫn mới |
| `doc/log.md` | Nhật ký phiên này |

### Kiểm tra đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| `npm run contracts:compile` | Thành công với solc 0.8.28; tạo ABI/bytecode trong `artifacts/contracts/` |
| `npm run contracts:test` | 11/11 ca thành công trên Hardhat 3 EVM cục bộ |
| Khởi tạo | Admin đúng ví deploy; cổng đóng; chưa có lớp và quyền giảng viên |
| Phê duyệt | Ví hợp lệ được cấp quyền, event đúng; chặn ví zero, duyệt trùng và gọi trái quyền |
| Cổng khảo sát | Admin mở/đóng đúng, event đúng; giảng viên và sinh viên không thể đổi trạng thái |
| Tạo lớp | Giảng viên được duyệt tạo được lớp tiếng Việt; ID và chủ sở hữu đúng; điểm/lượt ban đầu bằng 0 |
| Phân quyền tạo lớp | Admin chưa được duyệt, giảng viên chưa duyệt và sinh viên đều bị từ chối |
| Giới hạn tên | Chặn tên rỗng, ASCII whitespace, vượt 480 byte; nhận tên UTF-8 đúng 480 byte |
| Nhiều giảng viên | ID tăng liên tục, không ghi đè lớp trước; tạo lớp được khi khảo sát đóng hoặc mở |
| Giao dịch trái quyền thực tế | Receipt status 0, đúng transaction hash; quyền và số lớp không đổi |
| `npm run build` | Frontend build thành công, 27 module |
| `git diff --check` | Không phát hiện lỗi whitespace |
| `npm audit --omit=dev` | Không ghi nhận lỗ hổng |

### Vấn đề và cách xử lý

- Sandbox không phân giải được npm registry: cài dependency bằng quyền thực thi ngoài sandbox đã được công cụ cho phép.
- Hardhat 2 cần tạo cấu hình trong thư mục người dùng và có nhiều dependency phụ cũ. Đã chuyển sang Hardhat 3.21.2, kiểm thử lại thành công.
- `solc` 0.8.28 phụ thuộc `tmp` cũ: override sang dòng 0.2.6, kiểm tra compile/test thành công.
- Audit toàn bộ còn 3 mục mức high cùng thuộc chuỗi Hardhat/Zod 3. Không ép nâng Zod 4 khác major; lưu chi tiết và giới hạn sử dụng công cụ test cục bộ trong `doc/SMART_CONTRACT.md`.

### Giới hạn hiện tại

- Chưa triển khai `joinCourse`, `submitReview`, `getAverageScore` và event Sinh viên; thuộc thành viên 2 giai đoạn 2.
- Chưa có cơ chế lưu nhận xét văn bản trên contract.
- Chưa triển khai database hoặc kết nối frontend với contract. UI vẫn dùng dữ liệu demo.
- Chưa deploy Sepolia hoặc thao tác Remix trong phiên này; tài liệu Remix là hướng dẫn chạy lại.
- Chưa có chuyển quyền Admin hoặc thu hồi quyền giảng viên vì nằm ngoài ba hàm được phân công.
- Kiểm tra tên không chuẩn hóa khoảng trắng Unicode; frontend cần trim đầu vào khi tích hợp.

### Việc tiếp theo

- [x] Hoàn thành smart contract Admin/Giảng viên giai đoạn 2 thành viên 1.
- [x] Biên dịch, kiểm thử tự động và viết hướng dẫn demo Remix.
- [ ] Bàn giao cho thành viên 2 bổ sung logic Sinh viên và đánh giá vào cùng contract.
- [ ] Thống nhất cách lưu nhận xét trước khi hoàn thiện contract chung.
- [ ] Giai đoạn 3 thành viên 1: kết nối MetaMask, đọc quyền thực tế và gọi các hàm Admin/Giảng viên từ UI.
- [ ] Kiểm tra bản vá tương thích của Hardhat/Zod trước khi cập nhật công cụ kiểm thử.

## Ngày 08/11/2026 — Smart contract Sinh viên và đánh giá

### Mục tiêu

Hoàn thiện phần Smart Contract giai đoạn 2 của thành viên 2 trên contract Admin/Giảng viên hiện có, giữ nguyên ABI tiếng Anh để đồng bộ README, test và tích hợp frontend sau này.

### Công việc đã thực hiện

- Khôi phục ABI tiếng Anh tương thích với tài liệu và bộ test Admin/Giảng viên.
- Bổ sung custom error cho lớp không tồn tại, tham gia trùng, chưa tham gia, đánh giá trùng, cổng đóng và điểm không hợp lệ.
- Triển khai `joinCourse`, phát `StudentJoined` và cập nhật `enrolledStudents`.
- Triển khai `submitReview`, chặn điểm ngoài 1–5 và bảo đảm mỗi ví chỉ đánh giá một lần cho mỗi lớp.
- Triển khai `getAverageScore`, trả điểm trung bình nhân 10.
- Tạo `student-review.test.mjs` với 9 ca kiểm thử và cập nhật lệnh test để chạy cả hai nhóm.
- Cập nhật `SMART_CONTRACT.md` theo trạng thái triển khai thực tế.

### Kiểm tra đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| `npm.cmd run contracts:compile` | Thành công với Solidity 0.8.28 |
| Test Admin/Giảng viên | 11/11 thành công |
| Test Sinh viên/Đánh giá | 9/9 thành công |
| Tổng bộ test | 20 pass, 0 fail |

### Giới hạn hiện tại

- Frontend vẫn dùng state React demo và chưa gọi ABI bằng Ethers.js.
- Chưa lưu nhận xét văn bản trên blockchain.
- Chưa deploy contract lên Sepolia.
- MySQL mới có connection pool, chưa có schema/API hoặc tích hợp giao diện.

### Việc tiếp theo

- [ ] Tạo lớp truy cập blockchain cho MetaMask và Ethers.js.
- [ ] Thay các thao tác demo bằng giao dịch contract thật.
- [ ] Thống nhất cách lưu nhận xét văn bản.
- [ ] Deploy Sepolia và lưu contract address theo biến môi trường.

## Ngày 09/11/2026 — Giai đoạn 3 thành viên 1

### Mục tiêu

Kết nối MetaMask và gắn giao dịch thật cho Admin/Giảng viên; giữ phần Sinh viên giai đoạn 3 cho thành viên 2.

### Công việc đã thực hiện

- Tạo không gian blockchain thật mặc định, tự đọc vai trò theo địa chỉ ví và contract.
- Tách UI mẫu thành chế độ có nhãn rõ ràng; không dùng số liệu demo trong dashboard thật.
- Thêm adapter Ethers hỗ trợ ABI tiếng Anh trong repo và ABI tiếng Việt người dùng đang deploy.
- Gắn approveTeacher/duyetGiangVien, toggleEvaluation/batTatDanhGia và createCourse/taoLopHocPhan vào MetaMask signer.
- Hiển thị trạng thái giao dịch, link Etherscan và lỗi từ chối ký, sai quyền, sai mạng, sai contract.
- Xử lý accountsChanged, chainChanged, disconnect; chống kết quả đọc cũ ghi đè phiên mới và khóa thao tác trùng.
- Lọc thống kê giảng viên theo lớp của ví hiện tại; lớp mới chỉ xuất hiện sau giao dịch thành công và đọc lại contract.
- Thêm file cấu hình công khai .env.web3.example; bổ sung biến VITE_ vào .env hiện tại, giữ nguyên thông số MySQL.
- Xác minh qua RPC Sepolia địa chỉ contract do người dùng cung cấp: 0x43ddAB1A429302eec01df753966718c53Ae108D8. viAdmin trả 0x2483e769B6d8f3D035121813998e7151f8bE23C7, tongSoLop bằng 0, cổng khảo sát đóng tại thời điểm đọc.
- Viết doc/WEB3_THANH_VIEN_1.md và 10 ca test tích hợp Web3 bằng EVM cục bộ.

### Kiểm tra và giới hạn

- Web3: 10/10 ca đạt, có workflow cả ABI Anh/Việt và các tình huống sai mạng, đổi ví, từ chối ký, vượt quyền.
- Bộ test contract hiện có: 20/20 ca đạt. Tổng cộng 30 ca kiểm thử thành công trong hai bộ.
- Frontend build thành công; Vite cảnh báo bundle JavaScript khoảng 548 KB sau khi thêm Ethers, có thể tách chunk khi tối ưu hiệu năng.
- git diff --check không phát hiện lỗi whitespace; .env tiếp tục được Git bỏ qua.
- Kiểm tra giao diện trong trình duyệt: màn hình blockchain mặc định, báo thiếu MetaMask và chuyển UI mẫu hoạt động.
- Không ký hoặc gửi giao dịch thay đổi trạng thái trên Sepolia bằng ví người dùng. Cần người dùng demo lại bằng MetaMask thật.
- Không thêm API MySQL hoặc luồng Sinh viên thật trong phiên này. Danh sách ví giảng viên là các ví đã tra cứu/có lớp, không phải toàn bộ hồ sơ trên MySQL.
- Adapter giới hạn tải toàn bộ ở 1.000 lớp; quy mô lớn cần phân trang/indexer.

### File liên quan

src/web3/contract.js, src/web3/client.js, src/web3/useSchoolChain.js, src/web3/styles.css, src/components/ChainWorkspace.jsx, src/main.jsx, test/web3/client.test.mjs, package.json, package-lock.json, doc/WEB3.md.

## Ngày 09/11/2026 — Giai đoạn 3 thành viên 2

### Công việc đã thực hiện

- Mở rộng ABI tiếng Anh cho `enrolledStudents`, `hasEvaluated`, `joinCourse` và `submitReview`.
- Đọc trạng thái tham gia/đánh giá riêng của ví đang kết nối ở cùng snapshot blockchain.
- Thêm nút Tham gia lớp, chọn 1–5 sao và Gửi đánh giá bằng MetaMask cho vai trò Sinh viên.
- Diễn giải lỗi contract bằng tiếng Việt: lớp không tồn tại, tham gia trùng, chưa tham gia, đánh giá trùng, cổng đóng và điểm không hợp lệ.
- Giữ tương thích đọc Admin/Giảng viên với contract tiếng Việt cũ; hiển thị rõ bản đó chưa hỗ trợ luồng Sinh viên.
- Bổ sung kiểm thử Web3 trọn luồng Sinh viên: tạo lớp, tham gia, mở cổng, gửi điểm và chặn thao tác trùng.

### Kiểm tra và việc tiếp theo

- Contract: 20/20 ca đạt; Web3: 11/11 ca đạt; frontend build thành công.
- [x] Deploy `contracts/DecentralizedEduEvaluation.sol` hiện tại lên Sepolia, đặt địa chỉ mới vào `.env` và đổi `VITE_CONTRACT_ABI=english`.
- Giao dịch deploy do người dùng tự xác nhận trong MetaMask; tác nhân hỗ trợ không truy cập private key hoặc seed phrase.

## Ngày 11/11/2026 — Bổ sung nhận xét khi sinh viên đánh giá

### Công việc đã thực hiện

- Mở rộng `guiDanhGia` để nhận điểm 1–5 kèm nhận xét và lưu nội dung theo lớp trên smart contract.
- Chặn nhận xét rỗng, chỉ có khoảng trắng hoặc vượt 1.000 byte UTF-8; giao diện yêu cầu từ 10 đến 500 ký tự.
- Bổ sung `soNhanXet` và `layNhanXet` để đọc nhận xét mà không trả kèm địa chỉ ví.
- Thêm ô nhập nhận xét, bộ đếm ký tự và cảnh báo rõ dữ liệu blockchain công khai, có thể truy vết giao dịch.
- Hiển thị tối đa 5 nhận xét gần nhất trên thẻ lớp; giới hạn tổng 100 nhận xét mỗi lần tải dữ liệu.
- Cập nhật ABI, lớp Web3 và thông báo lỗi tiếng Việt; giữ phát hiện phiên bản contract bằng mã bytecode.
- Mở rộng kiểm thử contract cho nhận xét hợp lệ, rỗng, khoảng trắng và vượt giới hạn; cập nhật kiểm thử luồng Web3.

### Kiểm tra đã thực hiện

| Hạng mục | Kết quả |
| --- | --- |
| Biên dịch Solidity 0.8.28 | Thành công |
| Kiểm thử smart contract | 24/24 thành công |
| Kiểm thử Web3 | 21/21 thành công |
| Dựng giao diện Vite | Thành công |
| `git diff --check` | Không phát hiện lỗi khoảng trắng |

### Việc tiếp theo

- [ ] Triển khai lại `contracts/DecentralizedEduEvaluation.sol` lên Sepolia bằng ví Admin.
- [ ] Cập nhật `VITE_CONTRACT_ADDRESS` trong `.env` bằng địa chỉ contract mới và khởi động lại `npm run dev`.
- [ ] Thiết lập lại dữ liệu trên contract mới: duyệt giảng viên, tạo lớp, cấp quyền sinh viên và mở cổng đánh giá.

Contract đang chạy tại địa chỉ cũ không tự nhận thay đổi này. Không có cơ chế tự động chuyển dữ liệu từ contract cũ sang contract mới.

### Deploy Sepolia

- Người dùng đã deploy contract đầy đủ tại `0xe5d259F7bF6025883f61F5a688D865B75d49Fb0B` bằng ví `0x417c2EFdddF3e4A89e3C651e557246E6B04B7F0e`.
- Đã xác minh qua RPC Sepolia: có bytecode, đúng Admin, `courseCount = 0` và `evaluationOpen = false`.
- Đã cập nhật `.env` sang địa chỉ mới và `VITE_CONTRACT_ABI=english`; build frontend thành công.
