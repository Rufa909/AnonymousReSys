## 1. THÔNG TIN CHUNG

- **Tên đề tài:** Xây dựng Ứng dụng Phi tập trung (DApp) Quản lý và Đánh giá Giảng viên Ẩn danh dựa trên Công nghệ Blockchain
- **Loại hình đề tài:** Ứng dụng thực hành (Web3 / DApp)
- **Đối tượng sử dụng:** Nhà trường (Admin), Giảng viên, Sinh viên

---

## 2. TÓM TẮT ĐỀ TÀI (ABSTRACT)

Đề tài nghiên cứu và phát triển một **Ứng dụng phi tập trung (DApp)** nhằm giải quyết bài toán khảo sát và đánh giá chất lượng giảng dạy tại các trường đại học. Các hệ thống khảo sát truyền thống thường gặp vấn đề e ngại rò rỉ danh tính sinh viên hoặc nguy cơ dữ liệu bị can thiệp, chỉnh sửa ngầm trên máy chủ tập trung.

Hệ thống đề xuất khai thác ưu điểm của công nghệ **Blockchain** và **Smart Contract**:
1. **Giảm lộ danh tính trên giao diện:** Hệ thống không lưu tên, MSSV hoặc email và không đặt địa chỉ ví cạnh nhận xét. Tuy nhiên giao dịch blockchain công khai vẫn có thể được truy vết, nên đây không phải ẩn danh mật mã.
2. **Tính minh bạch & Bất biến:** Kết quả được ghi trên blockchain. Smart Contract hiện không có chức năng sửa hoặc xóa đánh giá đã gửi.
3. **Phân quyền & Chống spam:** Mô hình vận hành kết nối 3 phân vai chặt chẽ. Mỗi ví sinh viên chỉ được đánh giá một lần cho mỗi lớp đã được cấp quyền và đã tham gia.

---

## 3. TÍNH CẤP THIẾT VÀ MỤC TIÊU ĐỀ TÀI

### 3.1. Hạn chế của hệ thống truyền thống
- **E ngại lộ thông tin:** Sinh viên lo lắng bị lộ danh tính dẫn đến bị ảnh hưởng điểm số nếu đưa ra phản hồi tiêu cực.
- **Dữ liệu dễ bị can thiệp:** Dữ liệu lưu trên Cơ sở dữ liệu tập trung (MySQL, MongoDB) có thể bị sửa đổi hoặc xóa bỏ các nhận xét không phù hợp từ phía quản trị viên.
- **Thiếu tính xác thực:** Dễ xảy ra tình trạng khảo sát ảo hoặc người không học môn đó vẫn tham gia đánh giá.

### 3.2. Mục tiêu đề tài
- **Giảm lộ danh tính trên giao diện:** Người dùng kết nối MetaMask, web đọc quyền theo địa chỉ ví trên Smart Contract và MetaMask ký các giao dịch ghi dữ liệu. Giao diện không hiển thị địa chỉ ví cạnh nhận xét.
- **Tính bất biến của dữ liệu (Immutable):** Điểm số và phản hồi đã ghi nhận có thể được đối chiếu trên blockchain.
- **Kiểm soát truy cập chuẩn xác:** Giảng viên tạo lớp học phần, Admin hoặc giảng viên phụ trách cấp quyền theo danh sách ví đã đối chiếu, sau đó sinh viên mới có thể tham gia. Smart Contract kiểm tra điều kiện trước khi ghi đánh giá.

---

## 4. MÔ HÌNH KIẾN TRÚC VÀ LUỒNG HOẠT ĐỘNG (WORKFLOW)

### 4.1. Phân quyền 3 bên (Roles & Permissions)

| Vai trò | Trách nhiệm chính | Quyền hạn trên Smart Contract |
| :--- | :--- | :--- |
| **Nhà trường (Admin)** | Quản lý chung, phê duyệt ví giảng viên và kiểm soát thời gian khảo sát | - Duyệt ví giảng viên (`duyetGiangVien`)<br>- Bật/tắt cổng đánh giá (`batTatDanhGia`)<br>- Cấp quyền vào lớp (`capQuyenThamGiaLop`) |
| **Giảng viên (Teacher)** | Quản lý các lớp học phần đảm nhận | - Tạo lớp (`taoLopHocPhan`) sau khi được Admin duyệt<br>- Cấp quyền vào lớp mình phụ trách (`capQuyenThamGiaLop`) |
| **Sinh viên (Student)** | Tham gia lớp học và thực hiện đánh giá chất lượng | - Tham gia lớp đã được cấp quyền (`thamGiaLop`)<br>- Gửi điểm và nhận xét (`guiDanhGia`) |

### 4.2. Quy trình vận hành hệ thống

```text
  [1. Nhà trường (Admin)]
          │
          ├──► Duyệt địa chỉ ví của giảng viên
          └──► Mở cổng để nhận đánh giá, đóng cổng khi kết thúc

  [2. Giảng viên]
          │
          ├──► Dùng ví đã được duyệt để tạo lớp học phần
          └──► Cấp quyền theo danh sách ví sinh viên

  [3. Sinh viên]
          │
          ├──► Kết nối MetaMask ──► Tham gia lớp đã được cấp quyền
          │
          └──► Cổng đánh giá mở ──► Gửi điểm (1–5 sao) và nhận xét
                                         │
                                         ▼
                            [Smart Contract Kiểm Tra]
                                  │           │
                          (Đủ điều kiện)   (Không hợp lệ/Đã đánh giá)
                                  │           │
                                  ▼           ▼
                           [Ghi nhận trên] [Từ chối Giao dịch]
                            [Blockchain]
```

Mỗi lần cấp quyền nhận tối đa 100 địa chỉ ví. Trên web, sinh viên xem điểm tổng hợp và nhận xét của lớp được cấp quyền sau khi Admin đóng cổng. Mục **Xem tất cả nhận xét** hiển thị 10 mục mỗi trang, mới nhất trước. Admin và giảng viên có thể xem kết quả trong lúc cổng mở. Quy tắc này áp dụng ở tầng ứng dụng vì dữ liệu trên Sepolia vẫn được công khai.

---

## 5. BỘ CÔNG CỤ VÀ CÔNG NGHỆ THIẾT KẾ (TECH STACK)

1. **Smart Contract (Backend trên Chain):**
   - **Solidity (v0.8.28):** Ngôn ngữ viết Hợp đồng thông minh.
   - **Remix IDE:** Biên dịch và triển khai contract. Bộ kiểm thử cục bộ dùng Hardhat.
2. **Blockchain Network:**
   - **Ethereum Testnet (Sepolia):** Mạng thử nghiệm Ethereum, chain ID `11155111`. Giao dịch ghi dữ liệu dùng Sepolia ETH để trả phí.
3. **Thư viện Web3:**
   - **Ethers.js (v6):** Cầu nối tương tác giữa JavaScript trên Web và Smart Contract.
4. **Giao diện Web (Frontend):**
   - **React và Vite:** Xây dựng và chạy giao diện ứng dụng Web3.
5. **Ví Điện tử (Identity Provider):**
   - **MetaMask Extension:** Quản lý khóa bí mật, thực hiện ký và xác nhận giao dịch.
6. **MySQL:** Dự án có module kết nối riêng. Các thao tác phân quyền, tham gia lớp và đánh giá dùng smart contract.

---

## 6. MÃ NGUỒN SMART CONTRACT HOÀN CHỈNH (SOLIDITY v0.8.28)

File nguồn dùng để compile trong dự án là [contracts/DecentralizedEduEvaluation.sol](contracts/DecentralizedEduEvaluation.sol).

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Anonymous ReSys - Admin, Giảng viên và Sinh viên
/// @notice Lưu điểm 1–5 và nhận xét; không bảo đảm ẩn danh mật mã.
contract DecentralizedEduEvaluation {
    // Ví deploy là Admin; contract hiện không có hàm đổi Admin.
    address public viAdmin;

    struct LopHocPhan {
        string tenHocPhan;
        address viGiangVien;
        bool tonTai;
        uint256 tongDiem;
        uint256 soLuotDanhGia;
    }

    // ID lớp => thông tin lớp.
    mapping(uint256 => LopHocPhan) public danhSachLop;
    uint256 public tongSoLop;

    // Ví giảng viên => đã được Admin duyệt hay chưa.
    mapping(address => bool) public giangVienDaDuyet;

    // Mặc định false: cổng đánh giá đang đóng.
    bool public congDanhGiaDangMo;

    // Danh sách ví thuộc từng lớp, do Admin hoặc giảng viên của lớp cấp quyền.
    mapping(uint256 => mapping(address => bool)) public sinhVienDuocPhep;

    // Trạng thái tham gia lớp và đánh giá của từng ví.
    // ID lớp => ví sinh viên => trạng thái.
    mapping(uint256 => mapping(address => bool))
        public sinhVienDaThamGia;

    mapping(uint256 => mapping(address => bool))
        public sinhVienDaDanhGia;

    // Nhận xét không gắn địa chỉ ví trong dữ liệu hiển thị của contract.
    // Tuy nhiên giao dịch blockchain công khai vẫn có thể được truy vết.
    mapping(uint256 => mapping(uint256 => string)) private nhanXetTheoLop;

    event DaCapQuyenThamGiaLop(uint256 indexed maLop, address indexed viSinhVien);

    // Các sự kiện.
    event DaDuyetGiangVien(address indexed viGiangVien);

    event DaThayDoiCongDanhGia(bool dangMo);

    event DaTaoLopHocPhan(
        uint256 indexed maLop,
        string tenHocPhan,
        address indexed viGiangVien
    );

    event SinhVienDaVaoLop(uint256 indexed maLop, address indexed viSinhVien);
    event DaGuiDanhGia(uint256 indexed maLop, uint256 diem);

    constructor() {
        viAdmin = msg.sender;
    }

    // Chỉ ví Admin được gọi.
    modifier chiAdmin() {
        require(msg.sender == viAdmin, "Khong phai admin");
        _;
    }

    // Chỉ ví giảng viên đã được duyệt được gọi.
    modifier chiGiangVienDaDuyet() {
        require(giangVienDaDuyet[msg.sender], "Giang vien chua duoc duyet");
        _;
    }

    /// @notice Admin cấp quyền tạo lớp cho một ví giảng viên.
    function duyetGiangVien(address _viGiangVien)
        external
        chiAdmin
    {
        // Không cho phép địa chỉ zero.
        require(_viGiangVien != address(0), "Dia chi vi khong hop le");

        // Không duyệt lại ví đã được duyệt.
        require(!giangVienDaDuyet[_viGiangVien], "Giang vien da duoc duyet");

        giangVienDaDuyet[_viGiangVien] = true;

        emit DaDuyetGiangVien(_viGiangVien);
    }

    /// @notice Admin mở hoặc đóng cổng đánh giá.
    function batTatDanhGia() external chiAdmin {
        congDanhGiaDangMo = !congDanhGiaDangMo;

        emit DaThayDoiCongDanhGia(congDanhGiaDangMo);
    }

    /// @notice Giảng viên đã được duyệt tạo lớp học phần.
    function taoLopHocPhan(string calldata _tenHocPhan)
        external
        chiGiangVienDaDuyet
    {
        require(bytes(_tenHocPhan).length > 0, "Ten hoc phan rong");
        require(bytes(_tenHocPhan).length <= 480, "Ten hoc phan qua dai");
        require(coNoiDung(_tenHocPhan), "Ten hoc phan chi co khoang trang");

        // ID lớp đầu tiên là 0.
        uint256 maLop = tongSoLop;

        danhSachLop[maLop] = LopHocPhan({
            tenHocPhan: _tenHocPhan,
            viGiangVien: msg.sender,
            tonTai: true,
            tongDiem: 0,
            soLuotDanhGia: 0
        });

        tongSoLop = maLop + 1;

        emit DaTaoLopHocPhan(
            maLop,
            _tenHocPhan,
            msg.sender
        );
    }

    /// @notice Cấp quyền theo danh sách đăng ký học đã được xác minh ngoài blockchain.
    function capQuyenThamGiaLop(uint256 _maLop, address[] calldata _danhSachVi) external {
        LopHocPhan storage lop = danhSachLop[_maLop];
        require(lop.tonTai, "Lop khong ton tai");
        require(msg.sender == viAdmin || msg.sender == lop.viGiangVien, "Khong co quyen quan ly lop");
        require(_danhSachVi.length > 0 && _danhSachVi.length <= 100, "Danh sach vi phai co tu 1 den 100 dia chi");
        for (uint256 i; i < _danhSachVi.length; ++i) {
            address viSinhVien = _danhSachVi[i];
            require(viSinhVien != address(0), "Dia chi vi khong hop le");
            if (!sinhVienDuocPhep[_maLop][viSinhVien]) {
                sinhVienDuocPhep[_maLop][viSinhVien] = true;
                emit DaCapQuyenThamGiaLop(_maLop, viSinhVien);
            }
        }
    }

    /// @notice Chỉ ví được cấp quyền cho đúng lớp mới có thể tham gia.
    function thamGiaLop(uint256 _maLop) external {
        require(danhSachLop[_maLop].tonTai, "Lop khong ton tai");
        require(sinhVienDuocPhep[_maLop][msg.sender], "Chua duoc cap quyen vao lop");
        require(!sinhVienDaThamGia[_maLop][msg.sender], "Da tham gia lop");

        sinhVienDaThamGia[_maLop][msg.sender] = true;
        emit SinhVienDaVaoLop(_maLop, msg.sender);
    }

    /// @notice Gửi một điểm 1–5 và nhận xét cho lớp đã tham gia khi cổng mở.
    function guiDanhGia(
        uint256 _maLop,
        uint256 _diem,
        string calldata _nhanXet
    ) external {
        require(congDanhGiaDangMo, "Cong danh gia dang dong");

        LopHocPhan storage lop = danhSachLop[_maLop];
        require(lop.tonTai, "Lop khong ton tai");
        require(sinhVienDaThamGia[_maLop][msg.sender], "Chua tham gia lop");
        require(sinhVienDuocPhep[_maLop][msg.sender], "Chua duoc cap quyen vao lop");
        require(!sinhVienDaDanhGia[_maLop][msg.sender], "Da danh gia lop");
        require(_diem >= 1 && _diem <= 5, "Diem phai tu 1 den 5");

        require(bytes(_nhanXet).length > 0, "Nhan xet rong");
        require(bytes(_nhanXet).length <= 1000, "Nhan xet qua dai");
        require(coNoiDung(_nhanXet), "Nhan xet chi co khoang trang");

        sinhVienDaDanhGia[_maLop][msg.sender] = true;
        lop.tongDiem += _diem;
        nhanXetTheoLop[_maLop][lop.soLuotDanhGia] = _nhanXet;
        lop.soLuotDanhGia += 1;
        emit DaGuiDanhGia(_maLop, _diem);
    }

    /// @notice Số nhận xét đã gửi cho một lớp.
    function soNhanXet(uint256 _maLop) external view returns (uint256) {
        require(danhSachLop[_maLop].tonTai, "Lop khong ton tai");
        return danhSachLop[_maLop].soLuotDanhGia;
    }

    /// @notice Đọc nhận xét theo chỉ số, không trả kèm địa chỉ ví.
    function layNhanXet(
        uint256 _maLop,
        uint256 _chiSo
    ) external view returns (string memory) {
        require(danhSachLop[_maLop].tonTai, "Lop khong ton tai");
        require(_chiSo < danhSachLop[_maLop].soLuotDanhGia, "Chi so nhan xet khong hop le");
        return nhanXetTheoLop[_maLop][_chiSo];
    }

    /// @notice Trả điểm trung bình nhân 10, làm tròn xuống (45 nghĩa là 4.5).
    function layDiemTrungBinh(uint256 _maLop) external view returns (uint256) {
        LopHocPhan storage lop = danhSachLop[_maLop];
        require(lop.tonTai, "Lop khong ton tai");
        if (lop.soLuotDanhGia == 0) return 0;
        return (lop.tongDiem * 10) / lop.soLuotDanhGia;
    }
    // Chặn chuỗi chỉ gồm dấu cách hoặc ký tự điều khiển ASCII.
    function coNoiDung(string calldata noiDung) private pure returns (bool) {
        bytes calldata duLieu = bytes(noiDung);
        for (uint256 i; i < duLieu.length; ++i) {
            if (uint8(duLieu[i]) > 32) return true;
        }
        return false;
    }
}
```

---

## 7. CHẠY WEB TRÊN MÁY

Cần Node.js 24, npm và trình duyệt có MetaMask. Chạy trong thư mục chứa README này.

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

## 8. KIỂM THỬ VÀ TRIỂN KHAI

```bash
npm run contracts:compile
npm run contracts:test
npm run web3:test
npm run build
```

Hai bộ test chạy cục bộ, không cần ví cá nhân hoặc giao dịch Sepolia. Khi deploy bằng Remix, dùng file contract chính, chọn **Solidity 0.8.28**, bật optimizer **200 runs** và đặt EVM **paris**. Ví dùng để deploy trở thành Admin. Mỗi lần deploy tạo địa chỉ và dữ liệu riêng.

Xem [hướng dẫn deploy](doc/SMART_CONTRACT.md), [luồng cấp quyền sinh viên](doc/SINH_VIEN_THEO_LOP.md) và [nhật ký đồ án](doc/log.md).
