import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { formatWeb3Error } from '../web3/client.js';

const short = value => `${value.slice(0, 6)}…${value.slice(-4)}`;

export default function CommentsPage({ course, loadPage, onBack, demo = false, sourceLabel = 'Blockchain' }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const block = useRef(undefined), title = useRef(null), list = useRef(null);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); title.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    loadPage(course.id, page, 10, block.current).then(value => {
      if (!active) return;
      block.current = value.block; setResult(value);
    }).catch(failure => { if (active) setError(formatWeb3Error(failure)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [course.id, loadPage, page, retry]);
  const total = result?.total ?? course.reviewCount;
  const pages = total ? (total + 9n) / 10n : 1n;
  function changePage(next) {
    setLoading(true); setPage(next);
    list.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    list.current?.focus({ preventScroll: true });
  }
  return <section className="reviews-workspace" aria-labelledby="reviews-title">
    <button className="reviews-back" onClick={onBack}><span aria-hidden="true">←</span> Quay lại danh sách học phần</button>
    <div className="reviews-heading"><div><div className="reviews-kicker">NHẬN XÉT HỌC PHẦN</div><h1 id="reviews-title" ref={title} tabIndex={-1}>{course.name}</h1><p>Tổng hợp phản hồi từ sinh viên đã tham gia học phần.</p></div><span className="reviews-course-id">HP-{course.id}</span></div>
    <div className="reviews-layout">
      <aside className="reviews-details" aria-label="Thông tin học phần">
        <section className="reviews-score"><span className="reviews-label">Điểm trung bình</span><div className="reviews-score-value">{course.score === null ? '—' : course.score.toFixed(1)}<span>/ 5</span></div><div className="reviews-stars" aria-hidden="true">{[1,2,3,4,5].map(star => <span key={star} className={course.score !== null && star <= Math.round(course.score) ? 'filled' : ''}><Icon name="star" size={20}/></span>)}</div><p>Từ {String(course.reviewCount)} lượt đánh giá</p></section>
        <section className="reviews-course-info"><h2>Thông tin học phần</h2><dl><div><dt>Mã học phần</dt><dd>HP-{course.id}</dd></div><div><dt>Ví giảng viên</dt><dd><code title={course.teacher}>{short(course.teacher)}</code></dd></div><div><dt>Nguồn dữ liệu</dt><dd>{demo ? 'Dữ liệu mô phỏng' : sourceLabel}</dd></div></dl></section>
        <div className="reviews-privacy"><Icon name="shield" size={20}/><p>Danh sách không hiển thị địa chỉ ví bên cạnh nhận xét.{!demo && ' Giao dịch blockchain vẫn có thể được truy vết.'}</p></div>
      </aside>
      <section className="reviews-content" aria-labelledby="reviews-list-title" aria-busy={loading}>
        <div className="reviews-list-heading"><div><h2 id="reviews-list-title">Tất cả nhận xét <span>{String(total)}</span></h2><p>Góc nhìn và trải nghiệm học tập của sinh viên.</p></div><span className="reviews-sort">Mới nhất trước</span></div>
        <div className="reviews-list-body" ref={list} tabIndex={-1}>
          {loading ? <div className="reviews-loading" role="status"><span className="reviews-spinner"/>Đang tải nhận xét…</div>
            : error ? <div className="reviews-empty" role="alert"><h3>Chưa tải được nhận xét</h3><p>{error}</p><button className="secondary" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div>
              : result?.comments.length ? <ol className="reviews-list">{result.comments.map((text, index) => <li key={`${page}-${index}`}><article><div className="review-author"><span className="review-avatar"><Icon name="users" size={17}/></span><div><strong>Phản hồi sinh viên</strong><span>Nhận xét học phần</span></div><span className="review-order">#{String(total - BigInt(page * 10 + index))}</span></div><p>{text}</p></article></li>)}</ol>
                : <div className="reviews-empty"><span className="modal-icon"><Icon name="book" size={26}/></span><h3>Chưa có nhận xét</h3><p>Nhận xét sẽ xuất hiện sau khi sinh viên gửi đánh giá cho học phần này.</p></div>}
        </div>
        <div className="reviews-pagination"><span>{!loading && !error && result?.comments.length ? `${page * 10 + 1}–${page * 10 + result.comments.length} trên ${String(total)} nhận xét` : '10 nhận xét mỗi trang'}</span><div><button className="secondary" disabled={loading || page === 0} onClick={() => changePage(page - 1)}>← Trước</button><span aria-live="polite">Trang {page + 1} / {String(pages)}</span><button className="secondary" disabled={loading || Boolean(error) || !result?.hasNext} onClick={() => changePage(page + 1)}>Sau →</button></div></div>
      </section>
    </div>
  </section>;
}
