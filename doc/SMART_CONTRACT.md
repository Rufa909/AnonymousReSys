# Smart contract hiện tại — bản B

Nguồn chính: contracts/DecentralizedEduEvaluation.sol. Ngày 18/11/2026 chuyển từ bản A sang cấu trúc bản B trong file người dùng cung cấp. Phần Solidity tiếng Anh trong README chỉ là thiết kế tham khảo.

## Compiler và cấu trúc

- Solidity được cố định tại **0.8.28**, cả pragma, package solc và cấu hình Hardhat; package-lock ghi lại dependency tương ứng.
- Compiler dùng optimizer 200 runs, EVM target **paris** để giữ tương thích môi trường kiểm thử hiện tại. Nâng compiler không đồng nghĩa cần nâng EVM target.
- Dùng require(condition, reason) và thông báo ASCII. Frontend dịch reason sang tiếng Việt, vẫn hiểu custom error của các contract A đã deploy.
- viAdmin là biến public như bản B, gán ví deploy trong constructor. Không có hàm thay đổi Admin.
- Nhận xét lưu bằng mapping maLop => chiSo => string. soLuotDanhGia đồng thời là số nhận xét; ghi nhận xét tại chỉ số hiện tại trước khi tăng bộ đếm.
- Giữ giới hạn 100 ví/lần cấp quyền, tên tối đa 480 byte UTF-8, nhận xét tối đa 1.000 byte. Các giới hạn viết trực tiếp như B, không còn 3 getter hằng số của A.
- Bổ sung helper private coNoiDung để chặn tên/nhận xét chỉ gồm dấu cách hoặc ký tự điều khiển ASCII. Không có thay đổi ABI từ helper này.

## Các hàm

| Hàm | Quy tắc |
| --- | --- |
| viAdmin() | Ví deploy, Admin |
| giangVienDaDuyet(vi) | Quyền tạo lớp |
| duyetGiangVien(vi) | Chỉ Admin, ví khác zero và chưa duyệt |
| batTatDanhGia() | Chỉ Admin, đảo trạng thái cổng chung |
| taoLopHocPhan(ten) | Giảng viên được duyệt, tên có nội dung, ID từ 0 |
| capQuyenThamGiaLop(maLop, danhSachVi) | Admin hoặc giảng viên của lớp, 1–100 ví; bỏ qua ví đã cấp |
| thamGiaLop(maLop) | Lớp tồn tại, được cấp quyền, chưa tham gia |
| guiDanhGia(maLop, diem, nhanXet) | Cổng mở, có quyền, đã tham gia, chưa đánh giá, điểm 1–5, nhận xét hợp lệ |
| soNhanXet(maLop) | Trả soLuotDanhGia |
| layNhanXet(maLop, chiSo) | Lớp tồn tại, chỉ số nhỏ hơn số lượt |
| layDiemTrungBinh(maLop) | Tổng điểm × 10 / số lượt, làm tròn xuống; chưa có lượt trả 0 |

Contract có 17 hàm public/external tính cả getter tự sinh. Chưa có chức năng đổi ví Admin, thu hồi quyền, xóa/sửa đánh giá hoặc tạo đợt đánh giá mới.

## Kiểm tra local

Chạy npm install, npm run contracts:compile, npm run contracts:test, npm run web3:test và npm run build trong thư mục gốc. Artifact được tạo tại artifacts/contracts/DecentralizedEduEvaluation.json, không đưa vào Git. Test dùng Hardhat chain ID 31337, không gửi giao dịch Sepolia.

## Deploy bản B bằng MetaMask

1. Copy toàn bộ file nguồn chính từ contracts/ vào Remix. Không dùng lại bản thử gốc ở Downloads vì file gốc đó vẫn có pragma cũ.
2. Chọn Solidity **0.8.28**, optimizer **200 runs**, EVM **paris**, rồi compile.
3. Deploy & Run: Browser Extension → MetaMask, mạng Sepolia, chọn ví dự định làm Admin. Deploy và xác nhận giao dịch trong ví.
4. Lấy địa chỉ contract mới từ Deployed Contracts hoặc receipt. Cập nhật riêng VITE_CONTRACT_ADDRESS trong .env; giữ VITE_CONTRACT_ABI=vietnamese, VITE_CHAIN_ID=11155111. Khởi động lại Vite.
5. Bản mới có dữ liệu trống: duyệt giảng viên, tạo lớp và cấp quyền lại. Dữ liệu A vẫn ở địa chỉ cũ, không được chuyển tự động. Storage layout của B khác A, không dùng B để ghi đè storage A qua proxy.

Mã local đã chuyển sang B; chưa deploy hoặc sửa địa chỉ .env. Trước khi đổi địa chỉ, web tiếp tục gọi contract A đang cấu hình.

## Quyền xem kết quả và riêng tư

Ứng dụng chỉ cho sinh viên xem điểm/nhận xét sau khi Admin đóng cổng; Admin/Giảng viên vẫn xem để quản lý. Đây là chính sách frontend/adapter. Getter và giao dịch blockchain vẫn công khai, không phải ẩn danh mật mã. MySQL chưa nằm trong luồng gọi contract.

Giữ compiler 0.8.28 theo lựa chọn của người dùng; không yêu cầu nâng lên bản mới nhất.
