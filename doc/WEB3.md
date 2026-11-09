## Kết quả triển khai

Website mặc định mở không gian blockchain thật. MetaMask cung cấp địa chỉ ví; Ethers đọc quyền từ contract để mở Dashboard Admin hoặc Giảng viên. Ba thao tác đã gắn giao dịch: duyệt giảng viên, mở/đóng đánh giá và tạo lớp học phần. Dữ liệu chỉ được tải lại sau receipt thành công, không tự tăng số lớp hoặc đổi quyền trước khi giao dịch được xác nhận.

Bản UI cũ vẫn có ở nút “Xem bản UI mẫu”, hiển thị nhãn dữ liệu mô phỏng riêng. Hai chế độ không dùng chung state và không trộn số liệu mẫu với contract.

## Cấu hình đã xác minh ngày 09/11/2026

- Mạng: Ethereum Sepolia, chain ID `11155111`.
- Contract: `0x43ddAB1A429302eec01df753966718c53Ae108D8`.
- ABI: `vietnamese`, theo bản tiếng Việt đã trao đổi với người dùng.
- Đọc từ RPC công khai: `viAdmin()` trả `0x2483e769B6d8f3D035121813998e7151f8bE23C7`, `tongSoLop()` trả `0`, `congDanhGiaDangMo()` trả `false` ở thời điểm xác minh.
- Địa chỉ Admin trước đó bị gửi nhầm làm contract; địa chỉ mới đã được kiểm tra bằng hàm của đồ án.

Đây là kiểm tra đọc; chưa gửi giao dịch thay đổi trạng thái trên Sepolia trong phiên triển khai này. Không xác nhận bản deploy có các hàm Sinh viên vì ngoài phạm vi thành viên 1.

Ba dòng công khai được thêm vào `.env`, giữ nguyên cấu hình MySQL:

```dotenv
VITE_CONTRACT_ADDRESS=0x43ddAB1A429302eec01df753966718c53Ae108D8
VITE_CHAIN_ID=11155111
VITE_CONTRACT_ABI=vietnamese
```

File `.env.web3.example` cung cấp mẫu tương ứng. Không đặt mật khẩu MySQL, private key hoặc seed phrase vào biến `VITE_`. Khi đổi contract hoặc ABI, phải khởi động lại dev server. Bản production phải build lại sau khi đổi cấu hình.

## Chạy và thử bằng MetaMask

```powershell
npm install
npm run dev -- --port 5174
```

1. Mở `http://localhost:5174/` bằng Chrome/Edge có cài MetaMask. Trình duyệt trong Codex có thể không có extension.
2. Chọn Sepolia trong MetaMask, mở khóa ví và bấm “Kết nối MetaMask”.
3. Dùng ví Admin nêu trên: website tự nhận diện Nhà trường, không có bộ chọn tự cấp quyền.
4. Trong “Phê duyệt giảng viên”, nhập ví muốn kiểm tra rồi bấm “Tra cứu quyền”. Kết quả lấy từ mapping trên contract, không từ danh sách demo.
5. Bấm “Duyệt giảng viên”, nhập ví hợp lệ, bấm “Tiếp tục với MetaMask” và tự xác nhận giao dịch. Chờ trạng thái thành công và kiểm tra trên Etherscan.
6. Bấm mở/đóng cổng đánh giá, xác nhận hộp thoại rồi xác nhận giao dịch MetaMask. Chỉ Admin thực hiện được.
7. Chuyển MetaMask sang ví giảng viên vừa được duyệt. Website xóa dữ liệu phiên cũ và tải lại quyền theo tài khoản mới.
8. Chọn “Tạo lớp học phần”, nhập tên và xác nhận giao dịch. Sau khi receipt thành công, lớp xuất hiện và có ví sở hữu đúng.
9. Tải lại trang rồi kết nối lại: dữ liệu lớp được đọc lại từ contract. Danh sách ví từng tra cứu chỉ lưu trong bộ nhớ phiên, không phải hồ sơ bền vững.
10. Ví chưa được duyệt chỉ thấy thông báo hướng dẫn và danh sách lớp đọc được. Luồng tham gia/gửi đánh giá thật dành cho thành viên 2.

“Ngắt kết nối” chỉ kết thúc phiên trong ứng dụng, không tự thu hồi quyền đã cấp trong MetaMask. Có thể quản lý kết nối website trong ví khi cần.

## Map ABI

| Chức năng | english | vietnamese |
| --- | --- | --- |
| Đọc Admin | schoolAdmin | viAdmin |
| Kiểm tra giảng viên | approvedTeachers | giangVienDaDuyet |
| Trạng thái khảo sát | evaluationOpen | congDanhGiaDangMo |
| Số lớp | courseCount | tongSoLop |
| Đọc lớp | courses | danhSachLop |
| Duyệt ví | approveTeacher | duyetGiangVien |
| Bật/tắt khảo sát | toggleEvaluation | batTatDanhGia |
| Tạo lớp | createCourse | taoLopHocPhan |

File Solidity trong repository vẫn giữ ABI tiếng Anh để tương thích với contract/test của cả nhóm. Adapter frontend hỗ trợ cả hai phiên bản bằng cấu hình, không đổi mã contract đã deploy.

## Tổ chức mã

| File | Trách nhiệm |
| --- | --- |
| src/web3/contract.js | ABI và mapping tên hàm của hai phiên bản |
| src/web3/client.js | Provider/signer Ethers, đọc snapshot, kiểm tra quyền/mạng và gửi giao dịch |
| src/web3/useSchoolChain.js | Trạng thái React, kết nối ví, account/network events và chống kết quả cũ ghi đè phiên mới |
| src/components/ChainWorkspace.jsx | UI Admin/Giảng viên đọc dữ liệu thật |
| src/web3/styles.css | Giao diện kết nối, lỗi, tiến trình và chế độ mẫu |
| src/main.jsx | Chọn không gian blockchain mặc định hoặc bản UI mẫu |
| test/web3/client.test.mjs | Kiểm thử lớp tích hợp trên EVM cục bộ |

## Quy tắc giao dịch

- Kiểm tra địa chỉ khác zero, mạng đang chọn, tài khoản đang kết nối và quyền contract trước thao tác.
- Đọc snapshot ở cùng block để các trường nhất quán; kiểm tra lại tài khoản/mạng sau khi tải.
- Mô phỏng bằng staticCall trước yêu cầu ký; lỗi trả về được diễn giải bằng tiếng Việt.
- Có trạng thái kiểm tra, chờ ký, chờ xác nhận, thành công, lỗi; khóa thao tác trùng khi đang xử lý.
- Chờ một xác nhận, hiển thị transaction hash/Etherscan; refresh thất bại sau receipt không được tự gửi lại giao dịch.
- Hỗ trợ giao dịch speed-up cùng nội dung, không coi giao dịch hủy hoặc thay bằng nội dung khác là thành công của thao tác ban đầu.
- Đổi tài khoản/mạng làm mất hiệu lực snapshot cũ. Các kết quả cũ không được phép tự ghi đè dữ liệu của phiên mới.
- Trước toggle kiểm tra trạng thái khảo sát so với màn hình để chặn xác nhận dựa trên dữ liệu đã cũ. Do contract dùng toggle, một thao tác khác được ghi nhận trong thời gian chờ giao dịch vẫn có thể thay đổi kết quả cuối; nên đọc lại trạng thái sau xác nhận.

## Kiểm thử

```powershell
npm run web3:test
npm run contracts:test
npm run build
```

Bộ Web3 gồm 10 ca: đọc trạng thái; duyệt/tạo lớp/toggle; tương thích ABI tiếng Việt; chặn vượt quyền; sai mạng/đổi ví; đổi ví trong lúc đọc; sai ABI/địa chỉ; toggle dùng trạng thái cũ; từ chối ký; tên rỗng và duyệt trùng. Test deploy các fixture vào Hardhat trong bộ nhớ, không dùng ví hay ETH của người dùng.

Đã kiểm tra trên trình duyệt không có MetaMask: hiển thị đúng màn hình chào và thông báo thiếu ví; chuyển qua lại UI mẫu có nhãn phân biệt. Chưa hoàn thành kiểm thử bằng ký giao dịch MetaMask thật trên Sepolia, người dùng cần chạy lại luồng thủ công ở trên.

## Giới hạn và bàn giao

- MySQL giữ nguyên connection pool hiện có; không tạo API hay ghi hồ sơ/metadata vào database trong phần này. Tạo lớp hiện ghi tên lớp và ví sở hữu lên contract. Việc gắn lớp với danh mục học vụ MySQL cần API và xác thực backend riêng.
- Danh sách giảng viên hiển thị các ví đã tra cứu trong phiên, ví đang kết nối và ví sở hữu lớp. Không khẳng định đó là toàn bộ giảng viên đã duyệt; chưa index TeacherApproved hoặc đọc danh sách hồ sơ MySQL.
- Tải tối đa 1.000 lớp từ contract theo batch 10 RPC, dừng và báo rõ nếu vượt giới hạn. Cần bổ sung phân trang/indexer cho quy mô lớn.
- Điểm/lượt đọc từ contract để phục vụ dashboard; không triển khai chức năng gửi đánh giá hay nhận xét thật của thành viên 2.
- Chưa thay đổi cơ chế riêng tư hoặc danh sách sinh viên hợp lệ của contract.
- Quyền Admin được ưu tiên khi một ví đồng thời là Admin và giảng viên; dùng hai tài khoản riêng để demo hai dashboard.

## Tài liệu đối chiếu

- [Ethers BrowserProvider](https://docs.ethers.org/v6/api/providers/#BrowserProvider).
- [MetaMask provider API và các sự kiện](https://docs.metamask.io/metamask-connect/evm/reference/provider-api/).
