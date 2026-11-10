import { walletAddress, sameAddress } from '../web3/client.js';
import { normalizeWalletList } from '../web3/enrollment.js';
import { canViewResults, hideCourseResults } from '../web3/resultsPolicy.js';
import { adminWallet, teacherWallet, studentWallet } from './demoData.js';

export const demoWallets = { admin: walletAddress(adminWallet.toLowerCase()), teacher: walletAddress(teacherWallet.toLowerCase()), student: walletAddress(studentWallet.toLowerCase()) };
const key = address => address.toLowerCase();

export function createDemoSchool(seeded = true) {
  const model = { approved: seeded ? [key(demoWallets.teacher)] : [], evaluationOpen: seeded, courses: [] };
  if (seeded) {
    const texts = ['Bài giảng rõ ràng và dễ theo dõi.', 'Ví dụ thực tế giúp em hiểu bài tốt hơn.', 'Mong có thêm thời gian thực hành trên lớp.', 'Giảng viên giải đáp các câu hỏi đầy đủ.', 'Nội dung học phần có tính ứng dụng cao.', 'Bài tập nhóm giúp em hiểu quy trình triển khai.', 'Tài liệu cần bổ sung thêm ví dụ minh họa.', 'Phần hướng dẫn thực hành rất hữu ích.', 'Các chủ đề được trình bày có hệ thống.', 'Mong nhận phản hồi bài tập sớm hơn.', 'Nội dung phù hợp với mục tiêu học phần.', 'Em muốn có thêm bài tập về bảo mật.', 'Nhìn chung học phần mang lại nhiều kiến thức mới.'];
    const scores = texts.map((_, index) => index % 3 === 0 ? 4n : 5n);
    model.courses.push({ id: '0', name: 'Công nghệ Blockchain', teacher: demoWallets.teacher, exists: true,
      totalScore: scores.reduce((a, b) => a + b, 0n), reviewCount: BigInt(texts.length),
      comments: texts, allowed: [key(demoWallets.student)], joined: [], evaluated: [] });
    model.courses.push({ id: '1', name: 'Phát triển ứng dụng Web', teacher: demoWallets.teacher, exists: true,
      totalScore: 0n, reviewCount: 0n, comments: [], allowed: [], joined: [], evaluated: [] });
  }
  return model;
}

export function demoSnapshot(model, account) {
  const role = sameAddress(account, demoWallets.admin) ? 'admin' : model.approved.includes(key(account)) ? 'teacher' : 'student';
  const resultsVisible = canViewResults(role, model.evaluationOpen);
  return { account, admin: demoWallets.admin, role, evaluationOpen: model.evaluationOpen, courseCount: BigInt(model.courses.length),
    studentSupported: true, membershipSupported: true, commentSupported: true, block: 'mô phỏng', resultsVisible,
    teachers: [...new Set([key(demoWallets.teacher), ...model.approved])].map(wallet => ({ wallet: walletAddress(wallet), approved: model.approved.includes(wallet) })),
    courses: model.courses.map(({ comments: _comments, ...course }) => ({ ...course, allowed: course.allowed.includes(key(account)), joined: course.joined.includes(key(account)), evaluated: course.evaluated.includes(key(account)),
      score: course.reviewCount ? Number(course.totalScore * 10n / course.reviewCount) / 10 : null })).map(course => resultsVisible ? course : hideCourseResults(course)) };
}

export function applyDemoTransaction(model, account, operation, input) {
  const next = structuredClone(model), snapshot = demoSnapshot(model, account);
  const m = 'Thao tác mô phỏng: ';
  if (['approve', 'toggle'].includes(operation) && snapshot.role !== 'admin') throw new Error(m + 'chỉ Admin có quyền thực hiện.');
  if (operation === 'approve') {
    const wallet = key(walletAddress(input));
    if (next.approved.includes(wallet)) throw new Error('Ví giảng viên này đã được phê duyệt.');
    next.approved.push(wallet);
  } else if (operation === 'toggle') {
    if (typeof input === 'boolean' && input !== next.evaluationOpen) throw new Error('Trạng thái cổng đánh giá đã thay đổi.');
    next.evaluationOpen = !next.evaluationOpen;
  } else if (operation === 'create') {
    if (!next.approved.includes(key(account))) throw new Error('Ví giảng viên chưa được phê duyệt.');
    const name = String(input || '').trim();
    if (!name || name.length > 120 || new TextEncoder().encode(name).length > 480) throw new Error('Tên học phần không hợp lệ.');
    next.courses.push({ id: String(next.courses.length), name, teacher: account, exists: true, totalScore: 0n, reviewCount: 0n, comments: [], allowed: [], joined: [], evaluated: [] });
  } else {
    const course = next.courses.find(row => row.id === String(input?.courseId));
    if (!course) throw new Error('Lớp học phần không tồn tại.');
    if (operation === 'grant') {
      if (snapshot.role !== 'admin' && !sameAddress(course.teacher, account)) throw new Error('Chỉ Admin hoặc giảng viên của lớp được cấp quyền.');
      course.allowed = [...new Set([...course.allowed, ...normalizeWalletList(input.wallets).map(key)])];
    } else if (operation === 'join' || operation === 'review') {
      if (!course.allowed.includes(key(account))) throw new Error('Ví của bạn chưa được cấp quyền tham gia lớp này.');
      if (operation === 'join') {
        if (course.joined.includes(key(account))) throw new Error('Bạn đã tham gia lớp này.');
        course.joined.push(key(account));
      } else {
        if (!next.evaluationOpen) throw new Error('Cổng đánh giá đang đóng.');
        if (!course.joined.includes(key(account))) throw new Error('Bạn cần tham gia lớp trước khi đánh giá.');
        if (course.evaluated.includes(key(account))) throw new Error('Bạn đã đánh giá lớp này.');
        const score = Number(input.score), comment = String(input.comment || '').trim();
        if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Điểm phải từ 1 đến 5.');
        if (comment.length < 10 || comment.length > 500 || new TextEncoder().encode(comment).length > 1000) throw new Error('Nhận xét cần 10–500 ký tự, tối đa 1.000 byte UTF-8.');
        course.evaluated.push(key(account)); course.comments.push(comment); course.totalScore += BigInt(score); course.reviewCount++;
      }
    } else throw new Error('Thao tác không được hỗ trợ.');
  }
  return next;
}
