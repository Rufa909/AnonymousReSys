export const initialTeachers = [
  { wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', approved: false },
  { wallet: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', approved: false },
  { wallet: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', approved: true },
];

export const teacherWallet = initialTeachers[2].wallet;
export const adminWallet = '0x1234567890abcdef1234567890abcdef12345678';
export const studentWallet = '0x8A31B29DE4C94e9DdA41A894dd22a5B83031c92F';

export const initialCourses = [
  { id: 0, name: 'Công nghệ Blockchain', teacher: teacherWallet, teacherName: 'Giảng viên Blockchain', reviews: 32, score: 4.8 },
  { id: 1, name: 'Phát triển ứng dụng Web', teacher: teacherWallet, teacherName: 'Giảng viên Web', reviews: 24, score: 4.6 },
  { id: 2, name: 'An toàn và bảo mật thông tin', teacher: teacherWallet, teacherName: 'Giảng viên An toàn thông tin', reviews: 0, score: null },
];

export const initialEnrollments = [0, 1];
export const initialEvaluations = [1];

export const initialFeedbacks = [
  { id: 1, courseId: 0, score: 5, comment: 'Nội dung rõ ràng, ví dụ thực tế giúp dễ hình dung cách blockchain vận hành.', createdAt: '26/10/2026' },
  { id: 2, courseId: 1, score: 4, comment: 'Bài tập phù hợp và có tính ứng dụng. Mong muốn có thêm thời gian thực hành.', createdAt: '25/10/2026' },
  { id: 3, courseId: 0, score: 5, comment: 'Giảng viên hỗ trợ tốt khi nhóm gặp lỗi với smart contract.', createdAt: '24/10/2026' },
];

