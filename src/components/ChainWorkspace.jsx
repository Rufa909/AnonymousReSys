import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import GrantEnrollmentModal from './GrantEnrollmentModal.jsx';
import CommentsPage from './CommentsPage.jsx';
import { sameAddress, walletAddress } from '../web3/client.js';
import { useSchoolChain } from '../web3/useSchoolChain.js';
import '../web3/styles.css';

const config = {
  address: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  chainId: import.meta.env.VITE_CHAIN_ID || '11155111',
  abiVersion: import.meta.env.VITE_CONTRACT_ABI || 'vietnamese',
};
const short = value => value ? `${value.slice(0, 6)}…${value.slice(-4)}` : 'Chưa kết nối';
const roles = { admin: 'Nhà trường (Admin)', teacher: 'Giảng viên', student: 'Sinh viên' };
const txLabels = { checking: 'Đang kiểm tra quyền và giao dịch…', signing: 'Đang chờ bạn xác nhận trong MetaMask…', pending: 'Đã gửi, đang chờ blockchain xác nhận…', success: 'Giao dịch đã được xác nhận.', error: 'Thao tác chưa hoàn tất.' };
const networkExplorer = config.chainId === '11155111' ? 'https://sepolia.etherscan.io' : null;
function WalletAvatar({ address }) {
  const seed = (address || '000000').slice(2, 8);
  const hue = parseInt(seed, 16) % 360 || 230;
  return <span className="wallet-identicon" aria-hidden="true" style={{ background: `hsl(${hue} 65% 92%)`, color: `hsl(${hue} 55% 38%)` }}>{(address || 'V').slice(2, 4).toUpperCase() || 'V'}</span>;
}

export default function ChainWorkspace({ onDemo, demo = false, chainHook: useChain = useSchoolChain }) {
  const chain = useChain(config);
  const explorer = demo ? null : networkExplorer;
  const { snapshot: data, busy } = chain;
  const [page, setPage] = useState('overview');
  const [commentsCourseId, setCommentsCourseId] = useState(null);
  const commentsReturn = useRef({ page: 'courses', scroll: 0, courseId: null });
  const [modal, setModal] = useState(null);
  const [entry, setEntry] = useState('');
  const [formError, setFormError] = useState('');
  const [lookup, setLookup] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const modalRef = useRef(null);
  useEffect(() => { setModal(null); setEntry(''); setQuery(''); setSelectedCourse(null); setRating(0); setComment(''); setCommentsCourseId(null); setPage('overview'); }, [data?.account, data?.role]);
  useEffect(() => {
    if (!modal || modal === 'grant') return;
    const previous = document.activeElement;
    const dialog = modalRef.current;
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled)')];
    (dialog.querySelector('input,textarea') || focusable()[0])?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = event => {
      if (event.key === 'Escape' && !busy) setModal(null);
      if (event.key !== 'Tab') return;
      const items = focusable(), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [modal, busy]);
  function openModal(name, course = null) {
    setEntry(course?.id || ''); setSelectedCourse(course); setRating(0); setComment(''); setFormError(''); setModal(name);
  }
  async function submit(event) {
    event.preventDefault(); setFormError('');
    let input = entry.trim();
    try {
      if (modal === 'approve') input = walletAddress(input);
      if (modal === 'create' && (!input || input.length > 120)) throw new Error('Vui lòng nhập tên học phần từ 1 đến 120 ký tự.');
      if (modal === 'review' && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error('Vui lòng chọn điểm từ 1 đến 5 sao.');
      if (modal === 'review' && (comment.trim().length < 10 || comment.trim().length > 500 || new TextEncoder().encode(comment.trim()).length > 1000)) throw new Error('Nhận xét cần có từ 10 đến 500 ký tự và tối đa 1.000 byte UTF-8.');
    } catch (failure) { setFormError(failure.message); return; }
    const payload = modal === 'toggle' ? data.evaluationOpen
      : modal === 'join' ? { courseId: input }
      : modal === 'review' ? { courseId: input, score: rating, comment: comment.trim() }
      : input;
    if (await chain.transact(modal, payload)) setModal(null);
  }
  const mine = data?.courses.filter(course => sameAddress(course.teacher, data.account)) || [];
  const relevant = data?.role === 'teacher' ? mine : data?.role === 'student' ? (data.membershipSupported ? data.courses.filter(course => course.allowed) : []) : data?.courses || [];
  const visible = relevant.filter(course => course.name.toLowerCase().includes(query.toLowerCase()) || course.id.includes(query));
  const commentsCourse = data?.resultsVisible ? relevant.find(course => course.id === commentsCourseId) : null;
  function showComments(course) {
    if (!data?.resultsVisible) return;
    commentsReturn.current = { page, scroll: window.scrollY, courseId: course.id };
    setCommentsCourseId(course.id); setPage('comments');
  }
  function backFromComments() {
    setPage(commentsReturn.current.page); setCommentsCourseId(null);
    requestAnimationFrame(() => { window.scrollTo({ top: commentsReturn.current.scroll, behavior: 'instant' }); document.querySelector('[data-reviews-course="' + commentsReturn.current.courseId + '"]')?.focus({ preventScroll: true }); });
  }
  const reviews = relevant.reduce((sum, course) => sum + course.reviewCount, 0n);
  const totalScore = relevant.reduce((sum, course) => sum + course.totalScore, 0n);
  const average = reviews ? (Number(totalScore * 10n / reviews) / 10).toFixed(1) : '—';
  return <div className={`app chain-app role-${data?.role || 'guest'}`}>
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('overview'); }}><span className="brand-icon"><Icon name="shield" size={26}/></span><span>ReSys<span className="brand-sub">ANONYMOUS EVALUATION</span></span></a>
      <div className="workspace-label">KHÔNG GIAN BLOCKCHAIN</div>
      <div className="role-switch">{demo && <><label htmlFor="demo-role">Ví mô phỏng</label><select id="demo-role" value={chain.selectedRole} onChange={event => chain.selectRole(event.target.value)}><option value="admin">Admin</option><option value="teacher">Giảng viên</option><option value="student">Sinh viên</option></select></>}<label>{demo ? 'Quyền của ví mô phỏng' : 'Quyền từ smart contract'}</label><strong>{data ? roles[data.role] : 'Kết nối ví để xác định quyền'}</strong>{demo && <div className="demo-controls"><button className="text-button" onClick={() => chain.resetDemo(false)}>Bắt đầu trống</button><button className="text-button" onClick={() => chain.resetDemo(true)}>Nạp dữ liệu mẫu</button><details><summary>Địa chỉ ví dùng thử</summary><p>Giảng viên: <code>{chain.demoWallets.teacher}</code></p><p>Sinh viên: <code>{chain.demoWallets.student}</code></p></details></div>}</div>
      <nav aria-label="Điều hướng blockchain"><button className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}><Icon name="grid"/>Tổng quan</button>{data?.role === 'admin' && <button className={page === 'teachers' ? 'active' : ''} onClick={() => setPage('teachers')}><Icon name="users"/>Phê duyệt giảng viên</button>}<button className={page === 'courses' || page === 'comments' ? 'active' : ''} onClick={() => setPage('courses')}><Icon name="book"/>Lớp học phần</button></nav>
      <div className="sidebar-note"><Icon name="shield"/><strong>{demo ? 'Dữ liệu mô phỏng' : 'Dữ liệu từ blockchain'}</strong><p>{demo ? 'Các thao tác chỉ dùng dữ liệu mẫu.' : 'Thay đổi cần xác nhận qua MetaMask.'}</p></div>
      <div className="profile"><span className="avatar">{data?.role === 'admin' ? 'AD' : data?.role === 'teacher' ? 'GV' : 'VÍ'}</span><div><strong>{data ? roles[data.role] : 'Chưa kết nối'}</strong><small title={data?.account}>{short(data?.account)}</small></div></div>
    </aside>
    <div className="main-shell"><header><div className="breadcrumb">Quản lý học phần <Icon name="arrow" size={14}/><strong aria-current="page">{{ overview: 'Tổng quan', teachers: 'Phê duyệt giảng viên', courses: 'Lớp học phần', comments: 'Nhận xét học phần' }[page]}</strong></div><div className="header-actions"><button className="text-button demo-entry" disabled={busy} onClick={onDemo}>{demo ? 'Quay lại web thật' : 'Xem bản UI mẫu'}</button><span className="network"><i/>{demo ? 'Mô phỏng' : config.chainId === '11155111' ? 'Sepolia' : `Chain ${config.chainId}`}</span><button className="wallet-button" disabled={busy} onClick={data ? chain.disconnect : chain.connect}>{data ? <WalletAvatar address={data.account}/> : <Icon name="wallet" size={18}/>} {data ? `${short(data.account)} · Ngắt kết nối` : demo ? 'Dùng ví mô phỏng' : 'Kết nối MetaMask'}</button></div></header>
      <main>
        {page !== 'comments' && <section className="page-heading"><div><h1>{data?.role === 'admin' ? 'Quản trị nhà trường' : data?.role === 'teacher' ? 'Không gian giảng dạy' : data?.role === 'student' ? 'Không gian sinh viên' : 'Quản lý học phần trên blockchain'}</h1><p>{demo ? 'Chế độ trải nghiệm dùng ví và dữ liệu mô phỏng; không gửi giao dịch blockchain.' : data ? 'Vai trò được xác định tự động theo ví đang kết nối.' : 'Kết nối ví MetaMask để mở không gian làm việc của bạn.'}</p></div>{data && <button className="secondary" disabled={busy} onClick={chain.refresh}><span className={chain.loading ? 'refresh-spinning' : ''}><Icon name="refresh" size={16}/></span>Tải lại dữ liệu</button>}</section>}
        {!demo && !config.address && <div className="chain-error" role="alert">Hệ thống chưa được cấu hình kết nối blockchain. Vui lòng liên hệ quản trị viên.</div>}
        {chain.error && <div className="chain-error" role="alert">{chain.error}</div>}
        {chain.loading && <div className="loading-state" role="status"><span>Đang đọc dữ liệu và xác định quyền từ blockchain…</span><div className="loading-cards" aria-hidden="true"><i/><i/><i/></div></div>}
        {chain.transaction && page !== 'comments' && <div className={`chain-transaction ${chain.transaction.stage === 'error' ? 'failed' : ''}`} role="status"><span>{demo && chain.transaction.stage === 'success' ? 'Thao tác mô phỏng đã hoàn tất.' : txLabels[chain.transaction.stage]}</span>{chain.transaction.hash && (explorer ? <a href={`${explorer}/tx/${chain.transaction.hash}`} target="_blank" rel="noreferrer">Xem giao dịch ↗</a> : <code>{short(chain.transaction.hash)}</code>)}</div>}
        {!data && !chain.loading && <section className="panel chain-welcome"><span className="modal-icon"><Icon name="wallet" size={32}/></span><h2>Một địa chỉ ví, đúng quyền truy cập</h2><p>Ví Admin quản lý cấp quyền và khảo sát. Ví giảng viên đã được duyệt có thể tạo lớp học phần.</p><div className="chain-welcome-actions"><button className="primary" disabled={busy || !config.address} onClick={chain.connect}>Kết nối MetaMask</button><button className="secondary" disabled={busy} onClick={chain.switchNetwork}>Chuyển sang {config.chainId === '11155111' ? 'Sepolia' : 'mạng cấu hình'}</button></div><small>Nếu chưa thấy MetaMask, mở ứng dụng bằng Chrome hoặc Edge đã cài extension.</small></section>}
        {data && page === 'comments' && !data.resultsVisible && <section className="panel results-waiting"><h2>Chưa đến thời gian xem kết quả</h2><p>Bạn có thể xem điểm tổng hợp và nhận xét sau khi Admin đóng cổng đánh giá.</p><button className="secondary" onClick={() => setPage('courses')}>Quay lại học phần</button></section>}
        {data && page === 'comments' && commentsCourse && <CommentsPage key={commentsCourse.id} course={commentsCourse} loadPage={chain.commentsPage} onBack={backFromComments} demo={demo} sourceLabel={config.chainId === '11155111' ? 'Blockchain · Sepolia' : `Blockchain · Chain ${config.chainId}`}/>}
        {data && page !== 'comments' && <>
          {data.role === 'student' && <div className="notice"><Icon name="shield" size={18}/><span>{data.studentSupported && data.membershipSupported ? 'Chỉ hiện các lớp bạn được cấp quyền. Tham gia lớp để đánh giá khi cổng mở.' : 'Chức năng tham gia và đánh giá chưa khả dụng. Vui lòng liên hệ quản trị viên.'}{!data.resultsVisible && ' Kết quả sẽ hiển thị sau khi Admin đóng cổng.'}</span></div>}
          {!data.membershipSupported && data.role !== 'student' && <div className="notice">Phiên bản hiện tại chưa hỗ trợ cấp quyền sinh viên theo lớp. Cần cập nhật hệ thống để sử dụng chức năng này.</div>}

          {page === 'overview' && <><section className="stats">{[
            ['Lớp học phần', String(relevant.length), 'book'],
            ...(data.role === 'student' && !data.resultsVisible ? [['Đã đánh giá', String(relevant.filter(course => course.evaluated).length), 'check'], ['Chờ đánh giá', String(relevant.filter(course => course.joined && !course.evaluated).length), 'activity']] : [['Lượt đánh giá', String(reviews), 'activity'], ['Điểm trung bình', average, 'shield']]),
          ].map(([title, value, icon], index) => <article className={`stat stat-${index}`} key={title}><div className="stat-top"><span>{title}</span><span className="stat-icon"><Icon name={icon}/></span></div><strong>{value}</strong><div className="stat-detail">{title === 'Điểm trung bình' && value !== '—' ? <div className="stat-stars" aria-label={`Điểm trung bình ${value} trên 5`}>{[1,2,3,4,5].map(star => <span key={star} className={star <= Math.floor(Number(value)) ? "filled" : ""}>★</span>)}</div> : <span>{title === 'Lớp học phần' ? 'Lớp trong phạm vi của bạn' : title === 'Lượt đánh giá' ? 'Tổng lượt đã ghi nhận' : title === 'Đã đánh giá' ? 'Lớp đã gửi phản hồi' : title === 'Chờ đánh giá' ? 'Lớp có thể đánh giá' : 'Chưa có đánh giá'}</span>}</div></article>)}</section>
          <section className="survey"><div className="survey-symbol"><Icon name="activity" size={28}/></div><div className="survey-copy"><div className="survey-title"><h2>Cổng đánh giá học phần</h2><span className={`badge survey-badge ${data.evaluationOpen ? 'green' : 'gray'}`}><i/>{data.evaluationOpen ? 'Đang mở' : 'Đã đóng'}</span></div><p>{demo ? 'Trạng thái cổng đánh giá mô phỏng.' : 'Trạng thái hiện tại trên smart contract.'}</p></div>{data.role === 'admin' && <button className={data.evaluationOpen ? 'danger-outline' : 'primary'} disabled={busy} onClick={() => openModal('toggle')}>{data.evaluationOpen ? 'Đóng cổng đánh giá' : 'Mở cổng đánh giá'}</button>}{data.role !== 'admin' && <span className={`survey-status ${data.evaluationOpen ? 'is-open' : ''}`}><i/>{data.evaluationOpen ? 'Đang tiếp nhận đánh giá' : 'Chưa tiếp nhận đánh giá'}</span>}</section></>}
          {data.role === 'admin' && page !== 'courses' && <section className="panel"><div className="panel-heading"><div><h2>Phê duyệt ví giảng viên</h2><p>Tra cứu ví trước khi cấp quyền tạo lớp học phần.</p></div><button className="primary" disabled={busy} onClick={() => openModal('approve')}><Icon name="plus" size={16}/>Duyệt giảng viên</button></div><form className="chain-lookup" onSubmit={async event => { event.preventDefault(); await chain.lookup(lookup.trim()); }}><label htmlFor="lookup-wallet">Địa chỉ ví giảng viên</label><div><input id="lookup-wallet" value={lookup} onChange={event => setLookup(event.target.value)} placeholder="0x…" required disabled={busy}/><button className="secondary" disabled={busy}>Tra cứu quyền</button></div></form><div className="table-scroll"><table><thead><tr><th>VÍ ĐÃ TRA CỨU / CÓ LỚP</th><th>QUYỀN TRÊN CONTRACT</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>{data.teachers.map(row => <tr key={row.wallet}><td><div className="teacher-wallet"><WalletAvatar address={row.wallet}/><code title={row.wallet}>{short(row.wallet)}</code><button className="wallet-copy" type="button" aria-label={`Sao chép địa chỉ ${row.wallet}`} title="Sao chép địa chỉ ví" onClick={async event => { try { await navigator.clipboard.writeText(row.wallet); event.currentTarget.title = 'Đã sao chép'; } catch { event.currentTarget.title = 'Không thể sao chép'; } }}><Icon name="copy" size={15}/></button>{explorer && <a href={`${explorer}/address/${row.wallet}`} target="_blank" rel="noreferrer" aria-label={`Xem ví ${row.wallet} trên Etherscan`}>↗</a>}</div></td><td><span className={`badge teacher-badge ${row.approved ? 'green' : 'gray'}`}><i/>{row.approved ? 'Đã được duyệt' : 'Chưa được duyệt'}</span></td><td className="align-right">{!row.approved ? <button className="approve-button" disabled={busy} onClick={() => { openModal('approve'); setEntry(row.wallet); }}>Phê duyệt</button> : <span className="teacher-approved">Đã duyệt</span>}</td></tr>)}</tbody></table></div><div className="panel-footer">Danh sách gồm các ví đã tra cứu trong phiên này và ví giảng viên sở hữu lớp.</div></section>}
          {page !== 'teachers' && <section className="panel"><div className="panel-heading"><div><h2>{data.role === 'teacher' ? 'Lớp học phần của tôi' : 'Lớp học phần trên contract'}</h2><p>{data.role === 'teacher' ? 'Lọc theo địa chỉ ví đang kết nối.' : 'ID lớp và chủ sở hữu được xác thực từ blockchain.'}</p></div>{data.role === 'teacher' && <button className="primary" disabled={busy} onClick={() => openModal('create')}><Icon name="plus" size={16}/>Tạo lớp học phần</button>}</div><div className="chain-search"><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm lớp trên blockchain" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc ID lớp…"/></label></div><div className="course-grid">{visible.map(course => <article className="course-card" key={course.id}><div className="course-top"><span className="course-icon"><Icon name="book" size={23}/></span><div className="course-badges"><span className="course-id">HP-{course.id}</span>{data.role === 'student' && course.evaluated && <span className="badge green evaluated-badge"><Icon name="check" size={15}/>Đã đánh giá</span>}</div></div><h3>{course.name}</h3><p>Giảng viên <code title={course.teacher}>{short(course.teacher)}</code></p><div className="course-bottom">{data.resultsVisible ? <><span>{String(course.reviewCount)} lượt đánh giá</span><strong>{course.score === null ? 'Chưa có điểm' : `★ ${course.score.toFixed(1)}`}</strong></> : <span className="results-waiting-label" title="Điểm và nhận xét sẽ hiển thị sau khi Admin đóng cổng đánh giá."><Icon name="lock" size={14}/>Xem kết quả sau khi đóng cổng</span>}</div><div className="course-card-footer">{data.commentSupported && data.resultsVisible && <button className="course-reviews-link" data-reviews-course={course.id} disabled={busy} onClick={() => showComments(course)}><span>Xem tất cả nhận xét</span><span aria-hidden="true">→</span></button>}{data.membershipSupported && (data.role === 'admin' || (data.role === 'teacher' && sameAddress(course.teacher, data.account))) && <div className="student-course-actions"><button className="secondary" disabled={busy} onClick={() => openModal('grant', course)}>Cấp quyền sinh viên</button></div>}{data.role === 'student' && data.studentSupported && data.membershipSupported && course.allowed && <div className="student-course-actions">{course.evaluated ? null : course.joined ? <button className="primary" disabled={busy || !data.evaluationOpen} title={data.evaluationOpen ? '' : 'Cổng đánh giá đang đóng'} onClick={() => openModal('review', course)}>Gửi đánh giá</button> : <button className="secondary" disabled={busy} onClick={() => openModal('join', course)}>Tham gia lớp</button>}</div>}</div></article>)}{!visible.length && <div className="empty">{data.role === 'student' ? 'Ví của bạn chưa được cấp quyền vào lớp nào phù hợp. Liên hệ giảng viên phụ trách lớp.' : 'Chưa có lớp học phần phù hợp.'}{data.role === 'teacher' && <button className="text-button" disabled={busy} onClick={() => openModal('create')}>Tạo lớp đầu tiên</button>}</div>}</div></section>}
          <div className="chain-contract"><span>{demo ? 'Chế độ trải nghiệm · Dữ liệu mô phỏng' : `Hợp đồng hệ thống · Khối ${data.block}`}</span>{explorer ? <a href={`${explorer}/address/${config.address}`} target="_blank" rel="noreferrer">{short(config.address)} ↗</a> : !demo && <code>{short(config.address)}</code>}</div>
        </>}
        <footer><span>© 2026 Anonymous ReSys</span></footer>
      </main>
    </div>
    {modal === 'grant' && data && selectedCourse && <GrantEnrollmentModal demo={demo} course={selectedCourse} busy={busy} error={chain.error} onClose={() => setModal(null)} onSubmit={async payload => { if (await chain.transact('grant', payload)) setModal(null); }}/> }
    {modal && modal !== 'grant' && data && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget && !busy) setModal(null); }}><section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="chain-modal-title"><button className="modal-close" aria-label="Đóng hộp thoại" disabled={busy} onClick={() => setModal(null)}>×</button><span className="modal-icon"><Icon name={modal === 'create' || modal === 'join' ? 'book' : modal === 'toggle' ? 'activity' : modal === 'review' ? 'star' : 'wallet'} size={26}/></span><h2 id="chain-modal-title">{modal === 'approve' ? 'Duyệt ví giảng viên' : modal === 'create' ? 'Tạo lớp học phần' : modal === 'join' ? `Tham gia ${selectedCourse?.name}` : modal === 'review' ? `Đánh giá ${selectedCourse?.name}` : `${data.evaluationOpen ? 'Đóng' : 'Mở'} cổng đánh giá?`}</h2><p>{demo ? 'Thao tác này chỉ cập nhật dữ liệu mô phỏng, không mở MetaMask hay lưu lên blockchain.' : modal === 'review' ? 'Chọn điểm và viết nhận xét. Nội dung được lưu công khai trên blockchain; giao diện không gắn địa chỉ ví cạnh nhận xét nhưng giao dịch vẫn có thể được truy vết.' : 'MetaMask sẽ yêu cầu bạn xác nhận giao dịch. Dữ liệu chỉ cập nhật sau khi giao dịch thành công.'}</p><form onSubmit={submit}>{['approve', 'create'].includes(modal) && <><label className="form-label" htmlFor="chain-entry">{modal === 'approve' ? 'Địa chỉ ví giảng viên' : 'Tên học phần'}</label><input id="chain-entry" value={entry} onChange={event => setEntry(event.target.value)} maxLength={modal === 'approve' ? 42 : 120} placeholder={modal === 'approve' ? '0x…' : 'Ví dụ: Công nghệ Blockchain'} disabled={busy} required/></>}{modal === 'review' && <><fieldset className="rating-field"><legend>Điểm đánh giá</legend><div className="star-picker" aria-label="Chọn điểm từ 1 đến 5 sao">{[1,2,3,4,5].map(value => <button type="button" key={value} className={rating >= value ? 'selected' : ''} onClick={() => { setRating(value); setFormError(''); }} aria-label={`${value} sao`}><Icon name="star" size={28}/></button>)}</div><span>{rating ? `${rating} / 5 sao` : 'Chưa chọn điểm'}</span></fieldset><label className="form-label" htmlFor="review-comment">Nhận xét</label><textarea id="review-comment" rows={5} value={comment} maxLength={500} disabled={busy} placeholder="Viết nhận xét từ 10 đến 500 ký tự…" onChange={event => { setComment(event.target.value); setFormError(''); }} required/><div className="character-count">{comment.length} / 500</div></>}{(formError || chain.error) && <p className="form-error" role="alert">{formError || chain.error}</p>}{busy && <p role="status">{txLabels[chain.transaction?.stage] || 'Đang đọc dữ liệu…'}</p>}<div className="modal-actions"><button className="secondary" type="button" disabled={busy} onClick={() => setModal(null)}>Hủy</button><button className="primary" disabled={busy} type="submit">{busy ? 'Đang xử lý…' : demo ? 'Xác nhận mô phỏng' : 'Tiếp tục với MetaMask'}</button></div></form></section></div>}
  </div>;
}
