import React from 'react';
import Icon from './Icon';

export default function PublicResults({ courses, feedbacks, query, setQuery }) {
  const ranked = [...courses]
    .filter((course) => course.reviews > 0)
    .sort((a, b) => b.score - a.score || b.reviews - a.reviews);
  const visible = ranked.filter((course) =>
    course.name.toLowerCase().includes(query.toLowerCase()) || course.teacherName.toLowerCase().includes(query.toLowerCase()),
  );

  return <>
    <section className="public-summary">
      <div><span className="public-symbol"><Icon name="globe" size={25}/></span><div><h2>Kết quả minh bạch, không công khai danh tính</h2><p>Trang tổng hợp chỉ hiển thị điểm và phản hồi; địa chỉ ví sinh viên được ẩn khỏi giao diện.</p></div></div>
      <span className="chain-status"><i/> Dữ liệu demo Sepolia</span>
    </section>

    <section className="panel">
      <div className="panel-heading"><div><h2>Kết quả đánh giá học phần</h2><p>Xếp hạng theo điểm trung bình và số lượt đánh giá.</p></div><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm kết quả" placeholder="Tìm học phần, giảng viên…" value={query} onChange={(event) => setQuery(event.target.value)}/></label></div>
      <div className="result-grid">
        {visible.map((course, index) => <article className="result-card" key={course.id}>
          <div className="result-rank">#{index + 1}</div><span className="course-id">HP-{String(course.id).padStart(3, '0')}</span>
          <h3>{course.name}</h3><p>{course.teacherName}</p>
          <div className="score-line"><strong>{course.score.toFixed(1)}</strong><span><span className="stars">★★★★★</span><small>{course.reviews} lượt đánh giá</small></span></div>
          <div className="score-bar"><span style={{ width: `${course.score * 20}%` }}/></div>
        </article>)}
        {!visible.length && <div className="empty">Chưa có kết quả phù hợp.</div>}
      </div>
    </section>

    <section className="panel">
      <div className="panel-heading"><div><h2>Phản hồi gần đây</h2><p>Nội dung minh họa được công khai mà không kèm địa chỉ ví người gửi.</p></div><span className="privacy-label"><Icon name="lock" size={15}/>Ẩn danh trên giao diện</span></div>
      <div className="feedback-list">
        {feedbacks.slice(0, 6).map((feedback) => {
          const course = courses.find((item) => item.id === feedback.courseId);
          return <article className="feedback-item" key={feedback.id}><div className="feedback-score">★ {feedback.score}.0</div><div><h3>{course?.name || 'Học phần'}</h3><p>“{feedback.comment}”</p><small>{feedback.createdAt} · Sinh viên ẩn danh</small></div></article>;
        })}
      </div>
    </section>
  </>;
}
