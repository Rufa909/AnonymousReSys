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
