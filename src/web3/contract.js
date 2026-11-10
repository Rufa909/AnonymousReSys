// Human-readable ABIs for both full English and Vietnamese deployments.
const variants = {
  english: {
    admin: 'schoolAdmin', approved: 'approvedTeachers', open: 'evaluationOpen',
    count: 'courseCount', course: 'courses', approve: 'approveTeacher',
    toggle: 'toggleEvaluation', create: 'createCourse', enrolled: 'enrolledStudents',
    evaluated: 'hasEvaluated', join: 'joinCourse', review: 'submitReview', average: 'getAverageScore',
  },
  vietnamese: {
    admin: 'viAdmin', approved: 'giangVienDaDuyet', open: 'congDanhGiaDangMo',
    count: 'tongSoLop', course: 'danhSachLop', approve: 'duyetGiangVien',
    toggle: 'batTatDanhGia', create: 'taoLopHocPhan', enrolled: 'sinhVienDaThamGia',
    evaluated: 'sinhVienDaDanhGia', join: 'thamGiaLop', review: 'guiDanhGia', average: 'layDiemTrungBinh',
  },
};
export function contractDefinition(version = 'vietnamese') {
  if (!variants[version]) throw new Error('Phiên bản ABI phải là english hoặc vietnamese.');
  const methods = { ...variants[version], allowed: 'sinhVienDuocPhep', grant: 'capQuyenThamGiaLop' };
  const abi = [
    'function sinhVienDuocPhep(uint256,address) view returns (bool)',
    'function capQuyenThamGiaLop(uint256,address[])',
    'error KhongCoQuyenQuanLyLop(uint256,address)',
    'error ChuaDuocCapQuyenVaoLop(uint256,address)',
    'error DanhSachViKhongHopLe()',
    `function ${methods.admin}() view returns (address)`,
    `function ${methods.approved}(address) view returns (bool)`,
    `function ${methods.open}() view returns (bool)`,
    `function ${methods.count}() view returns (uint256)`,
    `function ${methods.course}(uint256) view returns (string,address,bool,uint256,uint256)`,
    `function ${methods.approve}(address)`,
    `function ${methods.toggle}()`,
    `function ${methods.create}(string)`,
    'error UnauthorizedAdmin(address)', 'error TeacherNotApproved(address)',
    'error InvalidTeacherAddress()', 'error TeacherAlreadyApproved(address)', 'error InvalidCourseName()',
    'error KhongPhaiAdmin(address)', 'error GiangVienChuaDuocDuyet(address)',
    'error DiaChiViKhongHopLe()', 'error GiangVienDaDuocDuyet(address)', 'error TenHocPhanKhongHopLe()',
  ];
  if (methods.join) abi.push(
    `function ${methods.enrolled}(uint256,address) view returns (bool)`,
    `function ${methods.evaluated}(uint256,address) view returns (bool)`,
    `function ${methods.join}(uint256)`,
    `function ${methods.review}(uint256,uint256)`,
    `function ${methods.average}(uint256) view returns (uint256)`,
    'error CourseNotFound(uint256)', 'error StudentAlreadyEnrolled(uint256,address)',
    'error StudentNotEnrolled(uint256,address)', 'error ReviewAlreadySubmitted(uint256,address)',
    'error EvaluationClosed()', 'error InvalidScore(uint256)',
    'error LopKhongTonTai(uint256)', 'error DaThamGiaLop(uint256,address)',
    'error ChuaThamGiaLop(uint256,address)', 'error DaDanhGiaLop(uint256,address)',
    'error CongDanhGiaDangDong()', 'error DiemKhongHopLe(uint256)',
  );
  return { methods, abi };
}
