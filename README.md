# Anonymous ReSys

Anonymous ReSys là đồ án Web3 cho phép nhà trường tổ chức đánh giá giảng dạy theo lớp học phần. Sinh viên dùng MetaMask để tham gia lớp đã được cấp quyền và gửi điểm từ 1 đến 5 kèm nhận xét. Smart contract ghi dữ liệu đánh giá trên mạng thử nghiệm Ethereum Sepolia.

## Quyền và quy trình sử dụng

| Vai trò | Thao tác trên web | Hàm contract tương ứng |
| --- | --- | --- |
| Nhà trường (Admin) | Duyệt ví giảng viên, mở hoặc đóng cổng đánh giá | `duyetGiangVien`, `batTatDanhGia` |
| Giảng viên đã được duyệt | Tạo lớp học phần, cấp quyền vào lớp mình phụ trách | `taoLopHocPhan`, `capQuyenThamGiaLop` |
| Sinh viên | Tham gia lớp đã được cấp quyền, gửi điểm và nhận xét khi cổng mở | `thamGiaLop`, `guiDanhGia` |

1. Kết nối MetaMask trên Sepolia. Web xác định vai trò từ địa chỉ ví Admin và danh sách giảng viên đã được duyệt trên contract.
2. Admin duyệt ví giảng viên. Giảng viên tạo lớp, rồi giảng viên phụ trách hoặc Admin cấp quyền theo danh sách ví sinh viên đã đối chiếu với danh sách đăng ký học. Contract nhận tối đa 100 địa chỉ mỗi lần cấp quyền.
3. Sinh viên tham gia lớp đã được cấp quyền. Khi Admin mở cổng, mỗi ví được gửi một đánh giá cho mỗi lớp đã tham gia.
4. Khi Admin đóng cổng, sinh viên có thể xem điểm tổng hợp và mở **Xem tất cả nhận xét** của lớp được cấp quyền. Trang nhận xét hiển thị 10 mục mỗi trang, mới nhất trước. Admin và giảng viên có thể xem kết quả trong quá trình quản lý.

Quy tắc ẩn điểm và nhận xét khi cổng mở áp dụng trên web cho sinh viên. Giao diện không hiện địa chỉ ví cạnh nhận xét, nhưng nội dung và giao dịch trên Sepolia vẫn công khai và có thể truy vết. Dự án không cung cấp ẩn danh mật mã.

## Chạy web trên máy

Cần Node.js 24 LTS, npm và trình duyệt có MetaMask. Chạy trong thư mục chứa README này.

```bash
npm ci
```

Tạo file `.env` ở thư mục gốc. Thay `<DIA_CHI_CONTRACT>` bằng địa chỉ contract đã deploy trên Sepolia.

```dotenv
VITE_CONTRACT_ADDRESS=<DIA_CHI_CONTRACT>
VITE_CONTRACT_ABI=vietnamese
VITE_CHAIN_ID=11155111
```

```bash
npm run dev
```

Mở địa chỉ Vite in trong terminal, thường là `http://localhost:5173`. Chọn Sepolia trong MetaMask rồi bấm **Kết nối MetaMask**. Đọc dữ liệu không tốn gas. Thao tác ghi cần xác nhận trong ví và dùng Sepolia ETH để trả phí. Khởi động lại Vite sau khi sửa `.env`.

Các biến `VITE_` là cấu hình công khai của frontend. Giữ khóa riêng và mật khẩu ngoài các biến này.

## Mã nguồn và kiểm thử

Frontend dùng React, Vite và Ethers.js 6 để kết nối MetaMask và đọc hoặc gửi giao dịch đến smart contract. Dữ liệu quyền, lớp học và đánh giá lấy từ contract. Module MySQL hiện chỉ cung cấp kết nối riêng và không cần để chạy luồng Web3.

- [Contract chính](contracts/DecentralizedEduEvaluation.sol) dùng Solidity **0.8.28**, lưu nhận xét theo mã lớp và chỉ số, có các hàm `soNhanXet`, `layNhanXet` và `layDiemTrungBinh`.
- [Giao diện chính](src/components/ChainWorkspace.jsx) và [client Web3](src/web3/client.js) xử lý kết nối ví, đọc quyền và xác nhận giao dịch.
- [Module kết nối MySQL](server/db.js) hỗ trợ phần cơ sở dữ liệu riêng của dự án.

```bash
npm run contracts:compile
npm run contracts:test
npm run web3:test
npm run build
```

Hai bộ test chạy cục bộ, không cần ví cá nhân hoặc giao dịch Sepolia. Khi deploy bằng Remix, dùng file contract chính, chọn **Solidity 0.8.28**, bật optimizer **200 runs** và đặt EVM **paris**. Ví dùng để deploy trở thành Admin. Mỗi lần deploy tạo địa chỉ và dữ liệu riêng.

Xem [hướng dẫn deploy](doc/SMART_CONTRACT.md), [luồng cấp quyền sinh viên](doc/SINH_VIEN_THEO_LOP.md) và [nhật ký đồ án](doc/log.md).
