// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title Anonymous ReSys - Admin, Giảng viên và Sinh viên
/// @notice Lưu điểm 1–5 và nhận xét; không bảo đảm ẩn danh mật mã.
contract DecentralizedEduEvaluation {
    // Ví triển khai contract trở thành Admin và không thay đổi được.
    address public immutable viAdmin;

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
    uint256 public constant GIOI_HAN_CAP_QUYEN = 100;

    // Trạng thái tham gia lớp và đánh giá của từng ví.
    // ID lớp => ví sinh viên => trạng thái.
    mapping(uint256 => mapping(address => bool))
        public sinhVienDaThamGia;

    mapping(uint256 => mapping(address => bool))
        public sinhVienDaDanhGia;

    // Nhận xét không gắn địa chỉ ví trong dữ liệu hiển thị của contract.
    // Tuy nhiên giao dịch blockchain công khai vẫn có thể được truy vết.
    mapping(uint256 => string[]) private nhanXetTheoLop;

    // Giới hạn theo byte UTF-8, không phải số ký tự.
    uint256 public constant GIOI_HAN_BYTE_TEN_HOC_PHAN = 480;
    uint256 public constant GIOI_HAN_BYTE_NHAN_XET = 1000;

    // Các lỗi.
    error KhongPhaiAdmin(address viGoi);
    error GiangVienChuaDuocDuyet(address viGoi);
    error DiaChiViKhongHopLe();
    error GiangVienDaDuocDuyet(address viGiangVien);
    error TenHocPhanKhongHopLe();
    error LopKhongTonTai(uint256 maLop);
    error DaThamGiaLop(uint256 maLop, address viSinhVien);
    error ChuaThamGiaLop(uint256 maLop, address viSinhVien);
    error DaDanhGiaLop(uint256 maLop, address viSinhVien);
    error CongDanhGiaDangDong();
    error DiemKhongHopLe(uint256 diem);
    error NhanXetKhongHopLe();
    error ChiSoNhanXetKhongHopLe(uint256 chiSo);
    error KhongCoQuyenQuanLyLop(uint256 maLop, address viGoi);
    error ChuaDuocCapQuyenVaoLop(uint256 maLop, address viSinhVien);
    error DanhSachViKhongHopLe();
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
        if (msg.sender != viAdmin) {
            revert KhongPhaiAdmin(msg.sender);
        }
        _;
    }

    // Chỉ ví giảng viên đã được duyệt được gọi.
    modifier chiGiangVienDaDuyet() {
        if (!giangVienDaDuyet[msg.sender]) {
            revert GiangVienChuaDuocDuyet(msg.sender);
        }
        _;
    }

    /// @notice Admin cấp quyền tạo lớp cho một ví giảng viên.
    function duyetGiangVien(address _viGiangVien)
        external
        chiAdmin
    {
        // Không cho phép địa chỉ zero.
        if (_viGiangVien == address(0)) {
            revert DiaChiViKhongHopLe();
        }

        // Không duyệt lại ví đã được duyệt.
        if (giangVienDaDuyet[_viGiangVien]) {
            revert GiangVienDaDuocDuyet(_viGiangVien);
        }

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
        bytes memory duLieuTen = bytes(_tenHocPhan);

        // Chặn tên rỗng hoặc vượt giới hạn byte.
        if (
            duLieuTen.length == 0 ||
            duLieuTen.length > GIOI_HAN_BYTE_TEN_HOC_PHAN
        ) {
            revert TenHocPhanKhongHopLe();
        }

        // Chặn tên chỉ gồm dấu cách hoặc ký tự điều khiển ASCII.
        bool coNoiDung;

        for (uint256 i; i < duLieuTen.length; ++i) {
            if (uint8(duLieuTen[i]) > 32) {
                coNoiDung = true;
                break;
            }
        }

        if (!coNoiDung) {
            revert TenHocPhanKhongHopLe();
        }

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
        if (!lop.tonTai) revert LopKhongTonTai(_maLop);
        if (msg.sender != viAdmin && msg.sender != lop.viGiangVien) {
            revert KhongCoQuyenQuanLyLop(_maLop, msg.sender);
        }
        if (_danhSachVi.length == 0 || _danhSachVi.length > GIOI_HAN_CAP_QUYEN) {
            revert DanhSachViKhongHopLe();
        }
        for (uint256 i; i < _danhSachVi.length; ++i) {
            address viSinhVien = _danhSachVi[i];
            if (viSinhVien == address(0)) revert DiaChiViKhongHopLe();
            if (!sinhVienDuocPhep[_maLop][viSinhVien]) {
                sinhVienDuocPhep[_maLop][viSinhVien] = true;
                emit DaCapQuyenThamGiaLop(_maLop, viSinhVien);
            }
        }
    }

    /// @notice Chỉ ví được cấp quyền cho đúng lớp mới có thể tham gia.
    function thamGiaLop(uint256 _maLop) external {
        if (!danhSachLop[_maLop].tonTai) revert LopKhongTonTai(_maLop);
        if (!sinhVienDuocPhep[_maLop][msg.sender]) revert ChuaDuocCapQuyenVaoLop(_maLop, msg.sender);
        if (sinhVienDaThamGia[_maLop][msg.sender]) {
            revert DaThamGiaLop(_maLop, msg.sender);
        }

        sinhVienDaThamGia[_maLop][msg.sender] = true;
        emit SinhVienDaVaoLop(_maLop, msg.sender);
    }

    /// @notice Gửi một điểm 1–5 và nhận xét cho lớp đã tham gia khi cổng mở.
    function guiDanhGia(
        uint256 _maLop,
        uint256 _diem,
        string calldata _nhanXet
    ) external {
        if (!congDanhGiaDangMo) revert CongDanhGiaDangDong();

        LopHocPhan storage lop = danhSachLop[_maLop];
        if (!lop.tonTai) revert LopKhongTonTai(_maLop);
        if (!sinhVienDaThamGia[_maLop][msg.sender]) {
            revert ChuaThamGiaLop(_maLop, msg.sender);
        }
        if (!sinhVienDuocPhep[_maLop][msg.sender]) revert ChuaDuocCapQuyenVaoLop(_maLop, msg.sender);
        if (sinhVienDaDanhGia[_maLop][msg.sender]) {
            revert DaDanhGiaLop(_maLop, msg.sender);
        }
        if (_diem < 1 || _diem > 5) revert DiemKhongHopLe(_diem);

        bytes memory duLieuNhanXet = bytes(_nhanXet);
        if (
            duLieuNhanXet.length == 0 ||
            duLieuNhanXet.length > GIOI_HAN_BYTE_NHAN_XET
        ) revert NhanXetKhongHopLe();

        bool coNoiDung;
        for (uint256 i; i < duLieuNhanXet.length; ++i) {
            if (uint8(duLieuNhanXet[i]) > 32) {
                coNoiDung = true;
                break;
            }
        }
        if (!coNoiDung) revert NhanXetKhongHopLe();

        sinhVienDaDanhGia[_maLop][msg.sender] = true;
        lop.tongDiem += _diem;
        lop.soLuotDanhGia += 1;
        nhanXetTheoLop[_maLop].push(_nhanXet);
        emit DaGuiDanhGia(_maLop, _diem);
    }

    /// @notice Số nhận xét đã gửi cho một lớp.
    function soNhanXet(uint256 _maLop) external view returns (uint256) {
        if (!danhSachLop[_maLop].tonTai) revert LopKhongTonTai(_maLop);
        return nhanXetTheoLop[_maLop].length;
    }

    /// @notice Đọc nhận xét theo chỉ số, không trả kèm địa chỉ ví.
    function layNhanXet(
        uint256 _maLop,
        uint256 _chiSo
    ) external view returns (string memory) {
        if (!danhSachLop[_maLop].tonTai) revert LopKhongTonTai(_maLop);
        if (_chiSo >= nhanXetTheoLop[_maLop].length) {
            revert ChiSoNhanXetKhongHopLe(_chiSo);
        }
        return nhanXetTheoLop[_maLop][_chiSo];
    }

    /// @notice Trả điểm trung bình nhân 10, làm tròn xuống (45 nghĩa là 4.5).
    function layDiemTrungBinh(uint256 _maLop) external view returns (uint256) {
        LopHocPhan storage lop = danhSachLop[_maLop];
        if (!lop.tonTai) revert LopKhongTonTai(_maLop);
        if (lop.soLuotDanhGia == 0) return 0;
        return (lop.tongDiem * 10) / lop.soLuotDanhGia;
    }
}
