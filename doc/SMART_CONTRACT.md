## Phạm vi đã triển khai

Mã chạy thực tế nằm trong `contracts/DecentralizedEduEvaluation.sol`. Phần Solidity trong README là bản thiết kế tham khảo; contract thực tế đã triển khai luồng Admin, Giảng viên và Sinh viên.

| Thành phần | Hành vi |
| --- | --- |
| `schoolAdmin()` | Trả về ví triển khai contract; địa chỉ cố định sau khi deploy |
| `approvedTeachers(address)` | Kiểm tra ví được cấp quyền tạo lớp |
| `approveTeacher(address)` | Chỉ Admin; chặn địa chỉ zero và duyệt trùng; phát `TeacherApproved` |
| `evaluationOpen()` | Trạng thái khảo sát chung, mặc định `false` |
| `toggleEvaluation()` | Chỉ Admin; đảo trạng thái và phát `EvaluationStatusChanged` |
| `createCourse(string)` | Chỉ ví được duyệt; tạo lớp thuộc ví gọi hàm và phát `CourseCreated` |
| `courseCount()` | Tổng số lớp; lớp đầu tiên có ID 0 |
| `courses(uint256)` | Trả về tên lớp, ví giảng viên, tồn tại, tổng điểm và số lượt đánh giá |
| `joinCourse(uint256)` | Cho ví tham gia lớp tồn tại; chặn tham gia trùng |
| `submitReview(uint256,uint256)` | Chỉ nhận điểm 1–5 khi cổng mở; yêu cầu đã tham gia và chặn đánh giá trùng |
| `getAverageScore(uint256)` | Trả điểm trung bình nhân 10; ví dụ 4.5 trả về 45 |
| `enrolledStudents(uint256,address)` | Kiểm tra một ví đã tham gia lớp hay chưa |
| `hasEvaluated(uint256,address)` | Kiểm tra một ví đã đánh giá lớp hay chưa |

Admin không mặc nhiên có quyền tạo lớp. Muốn tạo lớp bằng ví Admin, Admin phải duyệt chính địa chỉ đó bằng `approveTeacher`. Quyền được thực thi trên contract, độc lập với bộ chọn vai trò của UI demo.

### Cấu trúc dữ liệu dùng chung

```solidity
struct Course {
    string courseName;
    address teacher;
    bool exists;
    uint256 totalScore;
    uint256 reviewCount;
}
```

Giữ nguyên tên và thứ tự các trường theo README. `totalScore` và `reviewCount` bằng 0 khi tạo lớp. `enrolledStudents` và `hasEvaluated` mặc định `false`, được cập nhật bởi luồng Sinh viên.

`courses(id)` với ID chưa tồn tại trả về các giá trị mặc định và `exists == false`. Khi bổ sung luồng Sinh viên, phải kiểm tra `exists` trước khi ghi dữ liệu.

### Ràng buộc tên học phần

- Không nhận chuỗi rỗng, chỉ gồm khoảng trắng/ký tự điều khiển ASCII hoặc vượt quá 480 byte UTF-8.
- Giới hạn trên contract tính theo **byte**, không phải số ký tự. Ví dụ `ệ` chiếm 3 byte UTF-8.
- Frontend hiện trim và giới hạn 120 ký tự theo JavaScript; contract không trim và không áp cùng giới hạn ký tự. Giới hạn 480 byte đủ chứa tên do UI hiện tại gửi lên.
- Các ký tự trắng Unicode không thuộc ASCII chưa được chuẩn hóa; phía UI cần tiếp tục trim đầu vào. Contract không kiểm tra mã môn hay trùng tên: hai lớp có cùng tên vẫn được tạo với ID riêng.
- Tạo lớp không phụ thuộc cổng đánh giá đang mở hay đóng. Cổng này dành cho kiểm tra khi gửi đánh giá ở phần thành viên 2.

### Lỗi có thể giải mã từ ABI

`UnauthorizedAdmin(address)`, `TeacherNotApproved(address)`, `InvalidTeacherAddress()`, `TeacherAlreadyApproved(address)`, `InvalidCourseName()`.

## Biên dịch và kiểm thử cục bộ

Trong thư mục gốc repository:

```powershell
npm install
npm run contracts:compile
npm run contracts:test
```

Compiler `solc` được cố định ở 0.8.28. Script biên dịch dùng optimizer 200 runs và EVM target `paris`, xuất ABI/bytecode cùng thông tin compiler vào `artifacts/contracts/DecentralizedEduEvaluation.json`. Thư mục artifact được bỏ qua trong Git, có thể tạo lại bằng lệnh compile.

Test dùng Node test runner, Ethers và Hardhat 3 Network trong bộ nhớ (chain ID 31337). Yêu cầu Node.js 22.13+ thuộc dòng phiên bản chẵn được Hardhat hỗ trợ; phiên kiểm tra sử dụng Node.js 24.15.0. Mỗi ca test deploy contract mới, không dùng ví cá nhân, không gọi RPC bên ngoài và không tốn ETH thật. Sau khi cài dependency, compile và test không cần tải compiler từ mạng. `hardhat.config.js` cấu hình EVM test; chạy lệnh `contracts:compile` để sử dụng compiler và thiết lập xuất artifact của dự án.

Bộ test gồm 20 ca: 11 ca Admin/Giảng viên và 9 ca Sinh viên. Phần Sinh viên kiểm tra tham gia lớp, lớp không tồn tại, tham gia trùng, cổng đánh giá đóng, chưa tham gia, điểm ngoài 1–5, đánh giá hợp lệ, đánh giá trùng và tính điểm trung bình nhiều sinh viên.

### Kiểm tra dependency ngày 07/11/2026

Đã dùng Hardhat 3.21.2 thay cho Hardhat 2 để giảm dependency cũ và override `tmp` của `solc` sang dòng 0.2.6 đã vá. Compile và test dùng API JSON của solc đã chạy thành công với cấu hình này.

`npm audit --omit=dev` không ghi nhận lỗ hổng. Audit toàn bộ còn 3 mục mức high trong chuỗi Hardhat → hardhat-zod-utils → Zod 3, cùng liên quan cảnh báo cạn bộ nhớ khi validate collection quá lớn. Hardhat hiện phụ thuộc Zod 3; không ép sang Zod 4 vì khác major và có thể làm hỏng công cụ. Bộ test này dùng cấu hình và dữ liệu cục bộ do dự án quản lý. Cần kiểm tra bản vá tương thích trước khi mở rộng công cụ thành dịch vụ nhận dữ liệu ngoài.

## Demo thủ công trong Remix

1. Mở [Remix IDE](https://remix.ethereum.org), tạo file `DecentralizedEduEvaluation.sol`, chép nội dung file trong `contracts/` vào.
2. Trong Solidity Compiler, chọn **0.8.28**, bật optimizer với **200 runs**, chọn EVM **paris**, rồi Compile.
3. Trong Deploy & Run, chọn môi trường **Remix VM** có sẵn và tài khoản A, deploy `DecentralizedEduEvaluation`. A trở thành Admin.
4. Đọc `schoolAdmin`, `evaluationOpen` và `courseCount`: phải lần lượt là A, `false`, `0`.
5. Sao chép địa chỉ tài khoản B của Remix. Dùng A gọi `approveTeacher(B)`, sau đó kiểm tra `approvedTeachers(B) == true`.
6. Chuyển sang B, gọi `createCourse("Công nghệ Blockchain")`. Kiểm tra `courses(0)` có tên đúng, teacher là B, exists là `true`, tổng điểm và lượt đánh giá bằng 0; `courseCount == 1`.
7. Chuyển sang tài khoản C chưa được duyệt, thử tạo lớp hoặc gọi hàm Admin: phải bị từ chối.
8. Chuyển về A, gọi `toggleEvaluation` hai lần: lần đầu mở, lần sau đóng. Xem event trong transaction log.
9. Dùng A thử duyệt B lần nữa hoặc địa chỉ `0x0000000000000000000000000000000000000000`: phải bị từ chối. Dùng B thử tạo lớp với tên rỗng: phải bị từ chối.

Đây là hướng dẫn để người dùng chạy lại; việc kiểm tra tự động trong repository dùng EVM cục bộ, không phải thao tác đã thực hiện trên Remix hay deploy Sepolia.

## Phần Thành viên 2

- `joinCourse(courseId)` kiểm tra lớp tồn tại và trạng thái tham gia trước khi cập nhật `enrolledStudents` và phát `StudentJoined`.
- `submitReview(courseId, score)` kiểm tra cổng đánh giá, lớp, tư cách tham gia, trạng thái đánh giá và điểm 1–5; sau đó cập nhật `hasEvaluated`, `totalScore`, `reviewCount` và phát `ReviewSubmitted`.
- `getAverageScore(courseId)` trả điểm trung bình dạng nhân 10 để giữ một chữ số thập phân mà không dùng số thực trong Solidity.
- Các custom error cung cấp dữ liệu course ID, ví sinh viên hoặc điểm không hợp lệ để frontend giải mã.

Nhận xét văn bản chưa được lưu trên contract. Cần thống nhất dùng event, IPFS kèm hash hoặc lưu off-chain trước khi tích hợp frontend.

Chưa kết nối UI với contract và chưa deploy Sepolia. `server/db.js` mới tạo connection pool MySQL, chưa có schema/API và chưa liên kết với frontend. Các phần tích hợp MetaMask/Ethers thuộc giai đoạn 3; Ethers hiện dùng trong test, chưa được gọi từ frontend.

## Tài liệu đối chiếu

- [Solidity 0.8.28 — Compiler settings và Standard JSON](https://docs.soliditylang.org/en/v0.8.28/using-the-compiler.html).
- [Hardhat 3 — Cấu hình](https://hardhat.org/docs/reference/configuration).
