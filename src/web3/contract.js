// Human-readable ABI for the member-1 flows. The English ABI is canonical in repo.
const variants = {
  english: {
    admin: 'schoolAdmin', approved: 'approvedTeachers', open: 'evaluationOpen',
    count: 'courseCount', course: 'courses', approve: 'approveTeacher',
    toggle: 'toggleEvaluation', create: 'createCourse', enrolled: 'enrolledStudents',
    evaluated: 'hasEvaluated', join: 'joinCourse', review: 'submitReview',
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
  const abi = [
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
    'error CourseNotFound(uint256)', 'error StudentAlreadyEnrolled(uint256,address)',
    'error StudentNotEnrolled(uint256,address)', 'error ReviewAlreadySubmitted(uint256,address)',
    'error EvaluationClosed()', 'error InvalidScore(uint256)',
  );
  return { methods, abi };
}
