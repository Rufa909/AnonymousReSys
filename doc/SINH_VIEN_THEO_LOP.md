# Sinh viên thuộc lớp nào mới được đánh giá lớp đó

## Luồng sử dụng

1. Nhà trường hoặc giảng viên lấy danh sách đăng ký học chính thức của lớp, đối chiếu địa chỉ ví sinh viên. Danh sách ví không tự chứng minh danh tính hay việc đăng ký học.
2. Admin duyệt ví giảng viên; giảng viên tạo lớp học phần.
3. Admin hoặc giảng viên tạo lớp chọn **Cấp quyền sinh viên** trên thẻ lớp. Dán các địa chỉ ví, mỗi ví một dòng hoặc phân cách bằng dấu phẩy/chấm phẩy.
4. Bấm **Kiểm tra danh sách**, xem lại tên/ID lớp và danh sách ví đầy đủ đã loại trùng, rồi **Cấp quyền qua MetaMask**. Tối đa 100 ví mỗi giao dịch; lớp đông chia thành nhiều lô.
5. Sinh viên kết nối ví, bấm **Tải lại dữ liệu** nếu đang mở web. Chỉ các lớp được cấp quyền xuất hiện. Bấm **Tham gia lớp**, sau đó gửi điểm 1–5 sao kèm nhận xét khi Admin mở cổng. Mỗi ví chỉ đánh giá một lần mỗi lớp.

## Kiểm tra trên contract

- `sinhVienDuocPhep(maLop, viSinhVien)`: ví có quyền tham gia lớp này không.
- `capQuyenThamGiaLop(maLop, danhSachVi)`: chỉ Admin hoặc giảng viên sở hữu lớp được gọi; chặn lớp không tồn tại, danh sách rỗng, quá 100 ví và ví zero. Ví đã cấp được bỏ qua.
- `thamGiaLop(maLop)`: phải có quyền đúng lớp, chưa tham gia.
- `guiDanhGia(maLop, diem, nhanXet)`: phải có quyền, đã tham gia, chưa đánh giá, cổng mở, điểm hợp lệ và nhận xét có nội dung, tối đa 1.000 byte UTF-8.
- `soNhanXet(maLop)`, `layNhanXet(maLop, chiSo)`: đọc số lượng và nội dung nhận xét. Contract không trả địa chỉ ví kèm nhận xét.

Giao diện yêu cầu nhận xét từ 10 đến 500 ký tự. Nhận xét được lưu công khai, không thể sửa hoặc xóa trên contract hiện tại. Giao diện không đặt địa chỉ ví cạnh nhận xét, nhưng người gửi giao dịch vẫn có thể bị truy vết từ dữ liệu blockchain; đây không phải ẩn danh mật mã.

Sửa giao diện hay gọi trực tiếp qua Remix cũng không vượt qua được kiểm tra quyền trên contract. Chức năng hiện cấp thêm quyền, chưa có thu hồi quyền. MySQL và hệ thống quản lý đào tạo chưa tự đồng bộ danh sách vào contract; bước nhập danh sách vẫn do người quản lý thực hiện.

## Áp dụng bản mới

Contract đã deploy không tự cập nhật khi sửa file Solidity. Bản đang cấu hình chưa có hàm nhận xét mới; web sẽ không cho gửi đánh giá bằng ABI mới cho đến khi dùng bản triển khai mới.

1. Sao chép toàn bộ `contracts/DecentralizedEduEvaluation.sol` mới vào Remix, compile Solidity **0.8.28**.
2. Dùng **Browser Extension → MetaMask**, mạng **Sepolia**, chọn ví dự định làm Admin rồi deploy. Xác nhận giao dịch trong ví.
3. Lấy địa chỉ **contract mới** từ Deployed Contracts hoặc trường Contract Address của biên nhận giao dịch. Đây không phải địa chỉ ví Admin.
4. Sửa `.env`: `VITE_CONTRACT_ADDRESS=<địa chỉ contract mới>`, giữ `VITE_CONTRACT_ABI=vietnamese`, `VITE_CHAIN_ID=11155111`.
5. Khởi động lại `npm run dev`. Bản mới bắt đầu với dữ liệu trống; duyệt giảng viên, tạo lớp, cấp quyền sinh viên và mở cổng lại theo nhu cầu. Dữ liệu contract cũ vẫn ở địa chỉ cũ, chưa có chức năng chuyển dữ liệu tự động.

Việc triển khai cần chính chủ ví xác nhận. Thay đổi mã nguồn này chưa deploy hoặc đổi địa chỉ trong `.env`.
