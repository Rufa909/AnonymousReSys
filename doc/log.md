# Nhật ký đồ án Anonymous ReSys

## Thông tin đồ án

- **Học phần:** Blockchain.
- **Đề tài:** DApp quản lý và đánh giá giảng viên ẩn danh dựa trên công nghệ Blockchain.
- **Vai trò sử dụng:** Nhà trường (Admin), Giảng viên, Sinh viên.
- **Phần việc đang thực hiện:** Thành viên 1 — giai đoạn 1, xây dựng UI Admin và Giảng viên.
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
