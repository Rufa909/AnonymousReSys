// Human-readable ABI for the member-1 flows. The English ABI is canonical in repo.
const variants = {
  english: {
    admin: 'schoolAdmin', approved: 'approvedTeachers', open: 'evaluationOpen',
    count: 'courseCount', course: 'courses', approve: 'approveTeacher',
    toggle: 'toggleEvaluation', create: 'createCourse',
  },
  vietnamese: {
    admin: 'viAdmin', approved: 'giangVienDaDuyet', open: 'congDanhGiaDangMo',
    count: 'tongSoLop', course: 'danhSachLop', approve: 'duyetGiangVien',
    toggle: 'batTatDanhGia', create: 'taoLopHocPhan',
  },
};
export function contractDefinition(version = 'english') {
  const methods = variants[version];
  if (!methods) throw new Error('Phiên bản ABI phải là english hoặc vietnamese.');
  return { methods, abi: [
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
  ] };
}
