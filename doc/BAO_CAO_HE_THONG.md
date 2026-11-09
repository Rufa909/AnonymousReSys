# Báo cáo kiểm tra Anonymous ReSys ngày 09/11/2026

## Kết luận

Frontend build thành công, smart contract biên dịch được và vượt qua 20/20 bài kiểm thử cục bộ. Kết nối MySQL bằng cấu hình hiện tại thành công; database anonymous_resys đã có 6 bảng nhưng toàn bộ bảng đều rỗng. Các phần này chưa được tích hợp thành luồng dữ liệu thật: website vẫn dùng state React khởi tạo từ dữ liệu mẫu, chưa gọi API hoặc MetaMask/contract.

Phiên này kiểm tra mã nguồn, chạy build/compile/test và đọc metadata/số lượng bản ghi của MySQL. Không sửa code ứng dụng, không ghi vào database, không gửi giao dịch Sepolia. Báo cáo không bao gồm kiểm thử thao tác trình duyệt, responsive, tải hoặc kiểm toán bảo mật toàn diện.

## Kết quả thực thi

| Hạng mục | Kết quả |
| --- | --- |
| npm run build | Thành công, 27 module |
| npm run contracts:compile | Thành công, solc 0.8.28 |
| npm run contracts:test | 20 pass, 0 fail: 11 Admin/Giảng viên, 9 Sinh viên/Đánh giá |
| node --env-file=.env server/db.js | Kết nối MySQL thành công: anonymous_resys |
| .env | Được Git bỏ qua, không nằm trong danh sách file tracked |
| npm audit | 3 mục high trong chuỗi dependency công cụ Hardhat/Zod; không có critical |

Lần thử MySQL trong sandbox bị EACCES; kiểm tra lại ngoài sandbox bằng cùng cấu hình đã thành công. Đây không phải lỗi sai mật khẩu hay lỗi kết nối của ứng dụng trong môi trường bình thường.

## Database thực tế

| Bảng | Số bản ghi |
| --- | ---: |
| khoa | 0 |
| hoc_ky | 0 |
| giang_vien | 0 |
| hop_dong | 0 |
| yeu_cau_giang_vien | 0 |
| thong_tin_lop | 0 |

Đã kiểm tra cấu trúc cột, không đọc nội dung hồ sơ hoặc xuất thông tin kết nối. Database hiện chưa có bảng hoc_phan riêng hoặc danh mục lớp học vụ tách biệt: thong_tin_lop là metadata gắn với contract và ID lớp trên chain. Nếu chốt phương án quản lý môn học/học kỳ/lớp bằng MySQL, cần thống nhất mô hình này trước khi viết API.

## Những phần đã có

- UI Admin, Giảng viên, Sinh viên và kết quả công khai.
- Contract với approveTeacher, toggleEvaluation, createCourse, joinCourse, submitReview, getAverageScore.
- Kiểm tra quyền Admin/Giảng viên, lớp tồn tại, tham gia trùng, điểm 1–5, cổng khảo sát và đánh giá trùng theo ví/lớp.
- Connection pool MySQL phía server, prepared-statement API của mysql2 và cấu hình môi trường riêng.

## Phát hiện cần xử lý

### 1. Chưa có luồng dữ liệu thật giữa frontend và backend

src/main.jsx dòng 22–26 khởi tạo giảng viên, lớp, tham gia lớp và phản hồi từ src/data/demoData.js. Các thao tác duyệt, tham gia, tạo lớp và đánh giá chỉ cập nhật state. Không tìm thấy lời gọi API hoặc contract trong src/. Dữ liệu thao tác không được lưu bền vững qua lần tải lại trang.

server/db.js mới cung cấp connection pool và lệnh kiểm tra. Repository chưa có HTTP server, route hoặc API quản lý giảng viên/học phần/lớp.

Ưu tiên: chốt schema học vụ, viết API đọc/ghi có xác thực và thay nguồn dữ liệu React theo từng chức năng. Không mở API ghi chỉ dựa vào địa chỉ ví do client tự gửi.

### 2. Kết nối ví và vai trò vẫn được mô phỏng

src/main.jsx dòng 20 khởi tạo vai trò admin; bộ chọn vai trò cho phép chuyển không gian trực tiếp. Hộp thoại ví chỉ đảo connected, không gọi provider MetaMask. Quyền trên contract được bảo vệ, nhưng frontend chưa sử dụng quyền đó và không gửi giao dịch thực.

Ưu tiên: kết nối ví, đọc chain ID, nhận diện schoolAdmin/approvedTeachers, xử lý đổi tài khoản/mạng và gắn các thao tác vào giao dịch contract. Backend ghi dữ liệu cần xác minh người gọi bằng chữ ký/challenge và kiểm tra quyền thích hợp.

### 3. Chưa đối chiếu bản deploy Sepolia với mã hiện tại

Mã nguồn và test trong repo đang sử dụng ABI tiếng Anh. Bản tiếng Việt đã trao đổi trong chat có ABI khác. Chưa có cấu hình contract address/chain ID được frontend sử dụng và chưa xác minh địa chỉ deploy của người dùng có đủ các hàm Sinh viên mới nhất hay không.

Ưu tiên: thống nhất bản contract, ABI, địa chỉ đầy đủ và mạng trước khi tích hợp. Không suy luận địa chỉ hoặc chức năng từ ảnh rút gọn của lần deploy trước.

### 4. Nhận xét văn bản và yêu cầu riêng tư chưa khớp contract

UI yêu cầu nhận xét tối thiểu 10 ký tự, nhưng submitReview trong contract chỉ nhận courseId và score. Chưa có nơi lưu phản hồi văn bản ngoài state React.

Ẩn địa chỉ ví trên giao diện không tạo ẩn danh mật mã. Contract có enrolledStudents, hasEvaluated và event StudentJoined; người gửi giao dịch cũng có thể bị liên kết với đánh giá. Mô hình hiện tại chống đánh giá trùng theo một ví/lớp, không xác minh một ví là sinh viên thật và không ngăn một người dùng nhiều ví. Admin/giảng viên cũng có thể tham gia và đánh giá theo logic hiện tại.

Ưu tiên: chốt nơi lưu nhận xét, tiêu chí tham gia lớp và diễn đạt chính xác mức riêng tư trong báo cáo đề tài. Đây là giới hạn thiết kế, không phải bằng chứng contract bị khai thác.

### 5. Thống kê Giảng viên có lỗi phạm vi dữ liệu

src/main.jsx dòng 59 lọc lớp của giảng viên, nhưng totalReviews và average ở dòng 60–61 tính trên tất cả lớp rồi được dùng cho cả Dashboard Giảng viên. Khi có nhiều giảng viên, Dashboard có thể hiển thị tổng số lượt và điểm của toàn hệ thống thay vì riêng giảng viên đang xem.

Ưu tiên: tính các chỉ số từ tập lớp thuộc giảng viên, dùng địa chỉ ví thực sau khi tích hợp.

### 6. Ngày đánh giá mới bị ghi cứng

src/main.jsx dòng 107 gán createdAt là 28/10/2026 cho mọi đánh giá mới. Ngày hiển thị không phản ánh thời điểm gửi thực tế.

Ưu tiên: khi lưu thật, lấy thời gian từ backend hoặc block giao dịch; phần demo có thể dùng thời điểm hiện tại.

### 7. Dependency công cụ kiểm thử còn cảnh báo

npm audit hiện báo 3 mục high: hardhat, @nomicfoundation/hardhat-zod-utils và zod, thuộc cùng chuỗi dependency phát triển. Không tự chạy audit fix --force trong phiên kiểm tra. Cần chọn bản vá tương thích và kiểm thử lại khi cập nhật công cụ.

## Thứ tự đề xuất

1. Chốt danh mục học phần/lớp cần quản lý bằng MySQL và quan hệ liên kết với ID lớp trên chain.
2. Chốt ABI và bản deploy Sepolia của contract hiện tại.
3. Triển khai MetaMask, xác thực backend và API theo từng luồng Admin/Giảng viên/Sinh viên; lấy quyền từ contract.
4. Thay state mẫu bằng dữ liệu API/contract; xử lý giao dịch chờ xác nhận, thất bại, ghi metadata và thử lại khi cần.
5. Hoàn thiện lưu nhận xét, thống kê theo giảng viên và ngày gửi; kiểm thử xuyên suốt với nhiều ví và mạng.

Trạng thái tổng thể: có giao diện demo, logic contract cục bộ đã được kiểm thử và database đã kết nối; chưa hoàn thành DApp tích hợp dữ liệu thật của giai đoạn 3.
