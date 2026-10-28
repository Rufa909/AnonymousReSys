import React from 'react';
import Icon from './Icon';

const courseCode = (id) => `HP-${String(id).padStart(3, '0')}`;

export default function StudentWorkspace({
  page,
  courses,
  query,
  setQuery,
  enrolledCourseIds,
  evaluatedCourseIds,
  evaluationOpen,
  onJoin,
  onReview,
  onNavigate,
}) {
  const visibleCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(query.toLowerCase()) || String(course.id).includes(query),
  );
  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id));
  const pendingCourses = enrolledCourses.filter((course) => !evaluatedCourseIds.includes(course.id));

  if (page === 'overview') {
    return <>
      <section className="stats" aria-label="Thống kê sinh viên">
        {[
          ['Lớp đã tham gia', enrolledCourses.length, 'book', 'Học phần của ví sinh viên'],
          ['Chờ đánh giá', pendingCourses.length, 'activity', evaluationOpen ? 'Có thể gửi trong đợt này' : 'Cổng đánh giá đang đóng'],
          ['Đã hoàn thành', evaluatedCourseIds.length, 'check', 'Mỗi lớp chỉ đánh giá một lần'],
        ].map(([label, value, icon, detail]) => <article className="stat" key={label}>
          <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon}/></span></div>
          <strong>{value}</strong><p>{detail}</p>
        </article>)}
      </section>

      <section className="survey">
        <div className="survey-symbol"><Icon name="activity" size={28}/></div>
        <div className="survey-copy"><div className="survey-title"><h2>Cổng đánh giá học phần</h2><span className={`badge ${evaluationOpen ? 'green' : 'gray'}`}>{evaluationOpen ? 'Đang mở' : 'Đã đóng'}</span></div><p>{evaluationOpen ? 'Bạn có thể đánh giá các lớp đã tham gia và chưa gửi phản hồi.' : 'Nhà trường đang tạm ngừng tiếp nhận đánh giá mới.'}</p></div>
        <span className="survey-readonly">Nhà trường quản lý</span>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Học phần cần đánh giá <span className="small-count">{pendingCourses.length} học phần</span></h2><p>Đánh giá được ghi nhận một lần cho mỗi địa chỉ ví tham gia lớp.</p></div><button className="text-button" onClick={() => onNavigate('courses')}>Xem tất cả <Icon name="arrow" size={15}/></button></div>
        <div className="student-course-list">
          {pendingCourses.map((course) => <CourseRow key={course.id} course={course} enrolled evaluated={false} evaluationOpen={evaluationOpen} onJoin={onJoin} onReview={onReview}/>) }
          {!pendingCourses.length && <div className="empty">Bạn đã hoàn thành tất cả đánh giá hiện có.</div>}
        </div>
      </section>
    </>;
  }

  return <section className="panel">
    <div className="panel-heading"><div><h2>Danh sách lớp học phần</h2><p>Tham gia lớp trước khi gửi đánh giá ẩn danh.</p></div><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm học phần" placeholder="Tìm học phần…" value={query} onChange={(event) => setQuery(event.target.value)}/></label></div>
    <div className="student-course-list">
      {visibleCourses.map((course) => <CourseRow key={course.id} course={course} enrolled={enrolledCourseIds.includes(course.id)} evaluated={evaluatedCourseIds.includes(course.id)} evaluationOpen={evaluationOpen} onJoin={onJoin} onReview={onReview}/>) }
      {!visibleCourses.length && <div className="empty">Không tìm thấy lớp học phần phù hợp.</div>}
    </div>
    <div className="panel-footer">Hiển thị {visibleCourses.length} / {courses.length} lớp học phần <span>Ví sinh viên không được hiển thị trong kết quả công khai</span></div>
  </section>;
}

function CourseRow({ course, enrolled, evaluated, evaluationOpen, onJoin, onReview }) {
  return <article className="student-course-card">
    <span className="course-icon"><Icon name="book" size={22}/></span>
    <div className="student-course-copy"><div className="course-meta"><span>{courseCode(course.id)}</span><span>{course.reviews} lượt đánh giá</span></div><h3>{course.name}</h3><p>{course.teacherName} · {course.score ? `★ ${course.score.toFixed(1)} / 5` : 'Chưa có điểm'}</p></div>
    <div className="course-action">
      {evaluated ? <span className="completed-label"><Icon name="check" size={16}/>Đã đánh giá</span>
        : enrolled ? <button className="primary" disabled={!evaluationOpen} title={!evaluationOpen ? 'Cổng đánh giá đang đóng' : ''} onClick={() => onReview(course.id)}><Icon name="star" size={16}/>{evaluationOpen ? 'Đánh giá' : 'Đang đóng'}</button>
          : <button className="secondary" onClick={() => onJoin(course.id)}><Icon name="plus" size={16}/>Tham gia lớp</button>}
    </div>
  </article>;
}

