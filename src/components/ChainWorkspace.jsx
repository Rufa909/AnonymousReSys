import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
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
const explorer = config.chainId === '11155111' ? 'https://sepolia.etherscan.io' : null;

export default function ChainWorkspace({ onDemo }) {
  const chain = useSchoolChain(config);
  const { snapshot: data, busy } = chain;
  const [page, setPage] = useState('overview');
  const [modal, setModal] = useState(null);
  const [entry, setEntry] = useState('');
  const [formError, setFormError] = useState('');
  const [lookup, setLookup] = useState('');
  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rating, setRating] = useState(0);
  const modalRef = useRef(null);
  useEffect(() => { setModal(null); setEntry(''); setQuery(''); setSelectedCourse(null); setRating(0); setPage('overview'); }, [data?.account, data?.role]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const dialog = modalRef.current;
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
    (dialog.querySelector('input') || focusable()[0])?.focus();
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
    setEntry(course?.id || ''); setSelectedCourse(course); setRating(0); setFormError(''); setModal(name);
  }
  async function submit(event) {
    event.preventDefault(); setFormError('');
    let input = entry.trim();
    try {
      if (modal === 'approve') input = walletAddress(input);
      if (modal === 'create' && (!input || input.length > 120)) throw new Error('Vui lòng nhập tên học phần từ 1 đến 120 ký tự.');
      if (modal === 'review' && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error('Vui lòng chọn điểm từ 1 đến 5 sao.');
    } catch (failure) { setFormError(failure.message); return; }
    const payload = modal === 'toggle' ? data.evaluationOpen
      : modal === 'join' ? { courseId: input }
      : modal === 'review' ? { courseId: input, score: rating }
      : input;
    if (await chain.transact(modal, payload)) setModal(null);
  }
  const mine = data?.courses.filter(course => sameAddress(course.teacher, data.account)) || [];
  const relevant = data?.role === 'teacher' ? mine : data?.courses || [];
  const visible = relevant.filter(course => course.name.toLowerCase().includes(query.toLowerCase()) || course.id.includes(query));
  const reviews = relevant.reduce((sum, course) => sum + course.reviewCount, 0n);
  const totalScore = relevant.reduce((sum, course) => sum + course.totalScore, 0n);
  const average = reviews ? (Number(totalScore * 10n / reviews) / 10).toFixed(1) : '—';
  return <div className="app chain-app">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); setPage('overview'); }}><span className="brand-icon"><Icon name="shield" size={26}/></span><span>ReSys<span className="brand-sub">ANONYMOUS EVALUATION</span></span></a>
      <div className="workspace-label">KHÔNG GIAN BLOCKCHAIN</div>
      <div className="role-switch"><label>Quyền từ smart contract</label><strong>{data ? roles[data.role] : 'Kết nối ví để xác định quyền'}</strong></div>
      <nav aria-label="Điều hướng blockchain"><button className={page === 'overview' ? 'active' : ''} onClick={() => setPage('overview')}><Icon name="grid"/>Tổng quan</button>{data?.role === 'admin' && <button className={page === 'teachers' ? 'active' : ''} onClick={() => setPage('teachers')}><Icon name="users"/>Phê duyệt giảng viên</button>}<button className={page === 'courses' ? 'active' : ''} onClick={() => setPage('courses')}><Icon name="book"/>Lớp học phần</button></nav>
      <div className="sidebar-note"><Icon name="shield"/><strong>Dữ liệu từ blockchain</strong><p>Quyền và lớp học được đọc từ contract. Mọi thay đổi cần xác nhận trong MetaMask.</p><button className="text-button" disabled={busy} onClick={onDemo}>Xem bản UI mẫu ↗</button></div>
      <div className="profile"><span className="avatar">{data?.role === 'admin' ? 'AD' : data?.role === 'teacher' ? 'GV' : 'VÍ'}</span><div><strong>{data ? roles[data.role] : 'Chưa kết nối'}</strong><small title={data?.account}>{short(data?.account)}</small></div></div>
    </aside>
    <div className="main-shell"><header><div className="breadcrumb">Quản lý học phần <Icon name="arrow" size={14}/><strong>Blockchain</strong></div><div className="header-actions"><span className="network"><i/>{config.chainId === '11155111' ? 'Sepolia' : `Chain ${config.chainId}`}</span><button className="wallet-button" disabled={busy} onClick={data ? chain.disconnect : chain.connect}><Icon name="wallet" size={18}/>{data ? `${short(data.account)} · Ngắt kết nối` : 'Kết nối MetaMask'}</button></div></header>
      <main>
        <section className="page-heading"><div><div className="eyebrow">WEB3 · GIAI ĐOẠN 3</div><h1>{data?.role === 'admin' ? 'Quản trị nhà trường' : data?.role === 'teacher' ? 'Không gian giảng dạy' : data?.role === 'student' ? 'Không gian sinh viên' : 'Quản lý học phần trên blockchain'}</h1><p>{data ? 'Vai trò được xác định tự động theo ví đang kết nối.' : 'Kết nối ví MetaMask để mở không gian làm việc của bạn.'}</p></div>{data && <button className="secondary" disabled={busy} onClick={chain.refresh}>Tải lại dữ liệu</button>}</section>
        {!config.address && <div className="chain-error" role="alert">Chưa cấu hình contract của nhà trường. Xem hướng dẫn trong doc/WEB3_THANH_VIEN_1.md để thiết lập địa chỉ đã deploy.</div>}
        {chain.error && <div className="chain-error" role="alert">{chain.error}</div>}
        {chain.loading && <div className="notice" role="status">Đang đọc dữ liệu và xác định quyền từ blockchain…</div>}
        {chain.transaction && <div className={`chain-transaction ${chain.transaction.stage === 'error' ? 'failed' : ''}`} role="status"><span>{txLabels[chain.transaction.stage]}</span>{chain.transaction.hash && (explorer ? <a href={`${explorer}/tx/${chain.transaction.hash}`} target="_blank" rel="noreferrer">Xem giao dịch ↗</a> : <code>{short(chain.transaction.hash)}</code>)}</div>}
        {!data && !chain.loading && <section className="panel chain-welcome"><span className="modal-icon"><Icon name="wallet" size={32}/></span><h2>Một địa chỉ ví, đúng quyền truy cập</h2><p>Ví Admin quản lý cấp quyền và khảo sát. Ví giảng viên đã được duyệt có thể tạo lớp học phần.</p><div className="chain-welcome-actions"><button className="primary" disabled={busy || !config.address} onClick={chain.connect}>Kết nối MetaMask</button><button className="secondary" disabled={busy} onClick={chain.switchNetwork}>Chuyển sang {config.chainId === '11155111' ? 'Sepolia' : 'mạng cấu hình'}</button></div><small>Nếu chưa thấy MetaMask, mở ứng dụng bằng Chrome hoặc Edge đã cài extension.</small></section>}
        {data && <>
          {data.role === 'student' && <div className="notice">{data.studentSupported ? 'Bạn đang ở không gian Sinh viên. Hãy tham gia lớp trước khi gửi một đánh giá từ 1 đến 5 sao.' : 'Bản contract đang dùng chưa có chức năng Sinh viên. Cần deploy contract đầy đủ của thành viên 2 và đổi VITE_CONTRACT_ABI sang english.'}</div>}
          {page === 'overview' && <><section className="stats">{[
            ['Lớp học phần', String(data.role === 'teacher' ? mine.length : data.courseCount), 'book'],
            ['Lượt đánh giá', String(reviews), 'activity'], ['Điểm trung bình', average, 'shield'],
          ].map(([title, value, icon]) => <article className="stat" key={title}><div className="stat-top"><span>{title}</span><span className="stat-icon"><Icon name={icon}/></span></div><strong>{value}</strong><p>{data.role === 'teacher' ? 'Các lớp do ví này tạo' : 'Dữ liệu đọc từ contract'}</p></article>)}</section>
          <section className="survey"><div className="survey-symbol"><Icon name="activity" size={28}/></div><div className="survey-copy"><div className="survey-title"><h2>Cổng đánh giá học phần</h2><span className={`badge ${data.evaluationOpen ? 'green' : 'gray'}`}>{data.evaluationOpen ? 'Đang mở' : 'Đã đóng'}</span></div><p>Trạng thái hiện tại trên smart contract.</p></div>{data.role === 'admin' && <button className="primary" disabled={busy} onClick={() => openModal('toggle')}>{data.evaluationOpen ? 'Đóng cổng đánh giá' : 'Mở cổng đánh giá'}</button>}</section></>}
          {data.role === 'admin' && page !== 'courses' && <section className="panel"><div className="panel-heading"><div><h2>Phê duyệt ví giảng viên</h2><p>Tra cứu ví trước khi cấp quyền tạo lớp học phần.</p></div><button className="primary" disabled={busy} onClick={() => openModal('approve')}><Icon name="plus" size={16}/>Duyệt giảng viên</button></div><form className="chain-lookup" onSubmit={async event => { event.preventDefault(); await chain.lookup(lookup.trim()); }}><label htmlFor="lookup-wallet">Địa chỉ ví giảng viên</label><div><input id="lookup-wallet" value={lookup} onChange={event => setLookup(event.target.value)} placeholder="0x…" required disabled={busy}/><button className="secondary" disabled={busy}>Tra cứu quyền</button></div></form><div className="table-scroll"><table><thead><tr><th>VÍ ĐÃ TRA CỨU / CÓ LỚP</th><th>QUYỀN TRÊN CONTRACT</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>{data.teachers.map(row => <tr key={row.wallet}><td><code title={row.wallet}>{short(row.wallet)}</code></td><td><span className={`badge ${row.approved ? 'green' : 'gray'}`}>{row.approved ? 'Đã được duyệt' : 'Chưa được duyệt'}</span></td><td className="align-right">{!row.approved && <button className="approve-button" disabled={busy} onClick={() => { openModal('approve'); setEntry(row.wallet); }}>Phê duyệt</button>}</td></tr>)}</tbody></table></div><div className="panel-footer">Danh sách ví đã tra cứu trong phiên này và ví sở hữu lớp. Không phải danh sách hồ sơ chờ duyệt từ MySQL.</div></section>}
          {page !== 'teachers' && <section className="panel"><div className="panel-heading"><div><h2>{data.role === 'teacher' ? 'Lớp học phần của tôi' : 'Lớp học phần trên contract'}</h2><p>{data.role === 'teacher' ? 'Lọc theo địa chỉ ví đang kết nối.' : 'ID lớp và chủ sở hữu được xác thực từ blockchain.'}</p></div>{data.role === 'teacher' && <button className="primary" disabled={busy} onClick={() => openModal('create')}><Icon name="plus" size={16}/>Tạo lớp học phần</button>}</div><div className="chain-search"><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm lớp trên blockchain" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên hoặc ID lớp…"/></label></div><div className="course-grid">{visible.map(course => <article className="course-card" key={course.id}><div className="course-top"><span className="course-icon"><Icon name="book" size={23}/></span><span className="course-id">HP-{course.id}</span></div><h3>{course.name}</h3><p>Giảng viên <code title={course.teacher}>{short(course.teacher)}</code></p><div className="course-bottom"><span>{String(course.reviewCount)} lượt đánh giá</span><strong>{course.score === null ? 'Chưa có điểm' : `★ ${course.score.toFixed(1)}`}</strong></div>{data.role === 'student' && data.studentSupported && <div className="student-course-actions">{course.evaluated ? <span className="badge green">Đã đánh giá</span> : course.joined ? <button className="primary" disabled={busy || !data.evaluationOpen} title={data.evaluationOpen ? '' : 'Cổng đánh giá đang đóng'} onClick={() => openModal('review', course)}>Gửi đánh giá</button> : <button className="secondary" disabled={busy} onClick={() => openModal('join', course)}>Tham gia lớp</button>}</div>}</article>)}{!visible.length && <div className="empty">Chưa có lớp học phần phù hợp.{data.role === 'teacher' && <button className="text-button" disabled={busy} onClick={() => openModal('create')}>Tạo lớp đầu tiên</button>}</div>}</div></section>}
          <div className="chain-contract"><span>Contract {config.abiVersion === 'vietnamese' ? 'tiếng Việt' : 'tiếng Anh'} · Block {data.block}</span>{explorer ? <a href={`${explorer}/address/${config.address}`} target="_blank" rel="noreferrer">{short(config.address)} ↗</a> : <code>{short(config.address)}</code>}</div>
        </>}
        <footer><span>© 2026 Anonymous ReSys</span><span>Admin, Giảng viên & Sinh viên · Dữ liệu blockchain</span></footer>
      </main>
    </div>
    {modal && data && <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget && !busy) setModal(null); }}><section ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="chain-modal-title"><button className="modal-close" aria-label="Đóng hộp thoại" disabled={busy} onClick={() => setModal(null)}>×</button><span className="modal-icon"><Icon name={modal === 'create' || modal === 'join' ? 'book' : modal === 'toggle' ? 'activity' : modal === 'review' ? 'star' : 'wallet'} size={26}/></span><h2 id="chain-modal-title">{modal === 'approve' ? 'Duyệt ví giảng viên' : modal === 'create' ? 'Tạo lớp học phần' : modal === 'join' ? `Tham gia ${selectedCourse?.name}` : modal === 'review' ? `Đánh giá ${selectedCourse?.name}` : `${data.evaluationOpen ? 'Đóng' : 'Mở'} cổng đánh giá?`}</h2><p>{modal === 'review' ? 'Chọn điểm từ 1 đến 5 sao. Contract chỉ lưu điểm và không công khai địa chỉ ví trong kết quả tổng hợp.' : 'MetaMask sẽ yêu cầu bạn xác nhận giao dịch. Dữ liệu chỉ cập nhật sau khi giao dịch thành công.'}</p><form onSubmit={submit}>{['approve', 'create'].includes(modal) && <><label className="form-label" htmlFor="chain-entry">{modal === 'approve' ? 'Địa chỉ ví giảng viên' : 'Tên học phần'}</label><input id="chain-entry" value={entry} onChange={event => setEntry(event.target.value)} maxLength={modal === 'approve' ? 42 : 120} placeholder={modal === 'approve' ? '0x…' : 'Ví dụ: Công nghệ Blockchain'} disabled={busy} required/></>}{modal === 'review' && <fieldset className="rating-field"><legend>Điểm đánh giá</legend><div className="star-picker" aria-label="Chọn điểm từ 1 đến 5 sao">{[1,2,3,4,5].map(value => <button type="button" key={value} className={rating >= value ? 'selected' : ''} onClick={() => { setRating(value); setFormError(''); }} aria-label={`${value} sao`}><Icon name="star" size={28}/></button>)}</div><span>{rating ? `${rating} / 5 sao` : 'Chưa chọn điểm'}</span></fieldset>}{(formError || chain.error) && <p className="form-error" role="alert">{formError || chain.error}</p>}{busy && <p role="status">{txLabels[chain.transaction?.stage] || 'Đang đọc dữ liệu…'}</p>}<div className="modal-actions"><button className="secondary" type="button" disabled={busy} onClick={() => setModal(null)}>Hủy</button><button className="primary" disabled={busy} type="submit">{busy ? 'Đang xử lý…' : 'Tiếp tục với MetaMask'}</button></div></form></section></div>}
  </div>;
}
