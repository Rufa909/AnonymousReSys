// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

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

    // ID lớp => ví sinh viên => trạng thái.
    mapping(uint256 => mapping(address => bool))
        public sinhVienDaThamGia;

    mapping(uint256 => mapping(address => bool))
        public sinhVienDaDanhGia;

    // Giới hạn theo byte UTF-8, không phải số ký tự.
    uint256 public constant GIOI_HAN_BYTE_TEN_HOC_PHAN = 480;

    // Các lỗi.
    error KhongPhaiAdmin(address viGoi);
    error GiangVienChuaDuocDuyet(address viGoi);
    error DiaChiViKhongHopLe();
    error GiangVienDaDuocDuyet(address viGiangVien);
    error TenHocPhanKhongHopLe();

    // Các sự kiện.
    event DaDuyetGiangVien(address indexed viGiangVien);

    event DaThayDoiCongDanhGia(bool dangMo);

    event DaTaoLopHocPhan(
        uint256 indexed maLop,
        string tenHocPhan,
        address indexed viGiangVien
    );

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
}