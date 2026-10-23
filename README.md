# TỔNG QUAN ĐỀ TÀI HỌC PHẦN BLOCKCHAIN

**Tên đề tài:** Xây dựng Ứng dụng Phi tập trung (DApp) Quản lý và Đánh giá Giảng viên Ẩn danh dựa trên Công nghệ Blockchain  

---

## 1. THÔNG TIN CHUNG

- **Tên đề tài:** Xây dựng Ứng dụng Phi tập trung (DApp) Quản lý và Đánh giá Giảng viên Ẩn danh dựa trên Công nghệ Blockchain
- **Loại hình đề tài:** Ứng dụng thực hành (Web3 / DApp)
- **Đối tượng sử dụng:** Nhà trường (Admin), Giảng viên, Sinh viên

---

## 2. TÓM TẮT ĐỀ TÀI (ABSTRACT)

Đề tài nghiên cứu và phát triển một **Ứng dụng phi tập trung (DApp)** nhằm giải quyết bài toán khảo sát và đánh giá chất lượng giảng dạy tại các trường đại học. Các hệ thống khảo sát truyền thống thường gặp vấn đề e ngại rò rỉ danh tính sinh viên hoặc nguy cơ dữ liệu bị can thiệp, chỉnh sửa ngầm trên máy chủ tập trung.

Hệ thống đề xuất khai thác ưu điểm của công nghệ **Blockchain** và **Smart Contract**:
1. **Tính ẩn danh:** Định danh người dùng thông qua địa chỉ Ví Web3, hoàn toàn không lưu trữ thông tin cá nhân (Tên, MSSV, Email).
2. **Tính minh bạch & Bất biến:** Kết quả đánh giá được lưu trữ vĩnh viễn trên sổ cái Blockchain, không một cá nhân nào (kể cả Admin/IT) có thể sửa đổi hay xóa bỏ.
3. **Phân quyền & Chống spam:** Mô hình vận hành kết nối 3 phân vai chặt chẽ. Mỗi sinh viên chỉ được phép đánh giá 1 lần duy nhất cho mỗi lớp học phần mình tham gia.

---

## 3. TÍNH CẤP THIẾT VÀ MỤC TIÊU ĐỀ TÀI

### 3.1. Hạn chế của hệ thống truyền thống
- **E ngại lộ thông tin:** Sinh viên lo lắng bị lộ danh tính dẫn đến bị ảnh hưởng điểm số nếu đưa ra phản hồi tiêu cực.
- **Dữ liệu dễ bị can thiệp:** Dữ liệu lưu trên Cơ sở dữ liệu tập trung (MySQL, MongoDB) có thể bị sửa đổi hoặc xóa bỏ các nhận xét không phù hợp từ phía quản trị viên.
- **Thiếu tính xác thực:** Dễ xảy ra tình trạng khảo sát ảo hoặc người không học môn đó vẫn tham gia đánh giá.

### 3.2. Mục tiêu đề tài
- **Bảo mật ẩn danh tuyệt đối:** Xác thực quyền truy cập thông qua chữ ký số của ví MetaMask, bảo vệ 100% quyền riêng tư của sinh viên.
- **Tính bất biến của dữ liệu (Immutable):** Dữ liệu điểm số và phản hồi đã ghi nhận lên Smart Contract không thể bị thao túng.
- **Kiểm soát truy cập chuẩn xác:** Giảng viên tạo lớp học phần $\rightarrow$ Sinh viên đăng ký tham gia $\rightarrow$ Smart Contract xác thực điều kiện trước khi cho phép gửi đánh giá.

---

## 4. MÔ HÌNH KIẾN TRÚC VÀ LUỒNG HOẠT ĐỘNG (WORKFLOW)

### 4.1. Phân quyền 3 bên (Roles & Permissions)

| Vai trò | Trách nhiệm chính | Quyền hạn trên Smart Contract |
| :--- | :--- | :--- |
| **Nhà trường (Admin)** | Quản lý chung, phê duyệt danh tính giảng viên và kiểm soát thời gian khảo sát | - Duyệt ví Giảng viên (`approveTeacher`)<br>- Bật/Tắt cổng đánh giá (`toggleEvaluation`) |
| **Giảng viên (Teacher)** | Quản lý các lớp học phần đảm nhận | - Tạo lớp học phần mới (`createCourse`) sau khi đã được Admin duyệt |
| **Sinh viên (Student)** | Tham gia lớp học và thực hiện đánh giá chất lượng | - Tham gia lớp học phần (`joinCourse`)<br>- Gửi điểm số & nhận xét ẩn danh (`submitReview`) |

### 4.2. Quy trình vận hành hệ thống

```text
  [1. Nhà trường (Admin)]
          │
          ├──► Phê duyệt Địa chỉ Ví của Giảng viên (Whitelist)
          └──► Bật công tắc mở Cổng Đánh Giá cuối kỳ
          
  [2. Giảng viên]
          │
          └──► Dùng Ví đã được duyệt để Tạo Lớp Học Phần mới
          
  [3. Sinh viên]
          │
          ├──► Kết nối ví MetaMask ──► Bấm "Tham gia lớp" (Join Course)
          │
          └──► Đến đợt đánh giá ──► Gửi điểm (1-5 sao)
                                         │
                                         ▼
                            [Smart Contract Kiểm Tra]
                                  │           │
                          (Đủ điều kiện)   (Không hợp lệ/Đã vote)
                                  │           │
                                  ▼           ▼
                           [Ghi nhận trên] [Từ chối Giao dịch]
                            [Blockchain]
```

---

## 5. BỘ CÔNG CỤ VÀ CÔNG NGHỆ THIẾT KẾ (TECH STACK)

1. **Smart Contract (Backend trên Chain):**
   - **Solidity (v0.8.0+):** Ngôn ngữ viết Hợp đồng thông minh.
   - **Remix IDE :** Môi trường phát triển, kiểm thử và deploy contract.
2. **Blockchain Network:**
   - **Ethereum Testnet (Sepolia):** Mạng thử nghiệm miễn phí.
3. **Thư viện Web3:**
   - **Ethers.js (v5/v6) hoặc Web3.js:** Cầu nối tương tác giữa JavaScript trên Web và Smart Contract.
4. **Giao diện Web (Frontend):**
   - **React.js:** Xây dựng giao diện ứng dụng Web3.
5. **Ví Điện tử (Identity Provider):**
   - **MetaMask Extension:** Quản lý khóa bí mật, thực hiện ký và xác nhận giao dịch.

---

## 6. MÃ NGUỒN SMART CONTRACT HOÀN CHỈNH (SOLIDITY v0.8.0+)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title DecentralizedEduEvaluation
 * @dev Hệ thống đánh giá giảng viên ẩn danh phân quyền 3 bên
 */
contract DecentralizedEduEvaluation {
    address public schoolAdmin;

    struct Course {
        string courseName;
        address teacher;
        bool exists;
        uint256 totalScore;
        uint256 reviewCount;
    }

    // Id lớp học => Thông tin lớp học
    mapping(uint256 => Course) public courses;
    uint256 public courseCount;

    // Danh sách ví giảng viên được Nhà trường duyệt: address => true/false
    mapping(address => bool) public approvedTeachers;

    // Cổng đánh giá: Bật (true) / Tắt (false)
    bool public evaluationOpen = false;

    // Kiểm tra sinh viên tham gia lớp: courseId => (studentAddress => bool)
    mapping(uint256 => mapping(address => bool)) public enrolledStudents;

    // Kiểm tra sinh viên đã đánh giá chưa: courseId => (studentAddress => bool)
    mapping(uint256 => mapping(address => bool)) public hasEvaluated;

    // Sự kiện (Events) để Frontend lắng nghe
    event TeacherApproved(address indexed teacher);
    event CourseCreated(uint256 indexed courseId, string courseName, address indexed teacher);
    event StudentJoined(uint256 indexed courseId, address indexed student);
    event ReviewSubmitted(uint256 indexed courseId, uint256 score);

    constructor() {
        schoolAdmin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == schoolAdmin, "Chi Nha truong moi co quyen thuc hien!");
        _;
    }

    // 1. NHÀ TRƯỜNG PHÊ DUYỆT GIẢNG VIÊN
    function approveTeacher(address _teacher) external onlyAdmin {
        approvedTeachers[_teacher] = true;
        emit TeacherApproved(_teacher);
    }

    // 2. NHÀ TRƯỜNG BẬT/TẮT CỔNG ĐÁNH GIÁ
    function toggleEvaluation() external onlyAdmin {
        evaluationOpen = !evaluationOpen;
    }

    // 3. GIẢNG VIÊN TẠO LỚP HỌC PHẦN
    function createCourse(string memory _courseName) external {
        require(approvedTeachers[msg.sender], "Ban chua duoc Nha truong cap phep tao lop!");
        
        courses[courseCount] = Course({
            courseName: _courseName,
            teacher: msg.sender,
            exists: true,
            totalScore: 0,
            reviewCount: 0
        });

        emit CourseCreated(courseCount, _courseName, msg.sender);
        courseCount++;
    }

    // 4. SINH VIÊN TỰ THAM GIA LỚP HỌC
    function joinCourse(uint256 _courseId) external {
        require(courses[_courseId].exists, "Lop hoc khong ton tai!");
        require(!enrolledStudents[_courseId][msg.sender], "Ban da trong lop hoc nay roi!");
        
        enrolledStudents[_courseId][msg.sender] = true;
        emit StudentJoined(_courseId, msg.sender);
    }

    // 5. SINH VIÊN ĐÁNH GIÁ GIẢNG VIÊN (ẨN DANH VIA VÍ)
    function submitReview(uint256 _courseId, uint256 _score) external {
        require(evaluationOpen, "Cong danh gia hien dang dong!");
        require(courses[_courseId].exists, "Lop hoc khong ton tai!");
        require(enrolledStudents[_courseId][msg.sender], "Ban chua tham gia lop hoc nay!");
        require(!hasEvaluated[_courseId][msg.sender], "Ban da danh gia lop hoc nay roi!");
        require(_score >= 1 && _score <= 5, "Diem danh gia phai tu 1 den 5 sao!");

        hasEvaluated[_courseId][msg.sender] = true;
        courses[_courseId].totalScore += _score;
        courses[_courseId].reviewCount += 1;

        emit ReviewSubmitted(_courseId, _score);
    }

    // Hàm lấy điểm trung bình của một lớp học phần
    function getAverageScore(uint256 _courseId) external view returns (uint256) {
        require(courses[_courseId].exists, "Lop hoc khong ton tai!");
        if (courses[_courseId].reviewCount == 0) return 0;
        return (courses[_courseId].totalScore * 10) / courses[_courseId].reviewCount; // Trả về dạng x10 để lấy số thập phân
    }
}

eof