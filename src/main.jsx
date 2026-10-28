import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const initialTeachers = [
  { wallet: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', approved: false },
  { wallet: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', approved: false },
  { wallet: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', approved: true },
];
const teacherWallet = initialTeachers[2].wallet;
const initialCourses = [
  { id: 0, name: 'Công nghệ Blockchain', teacher: teacherWallet, reviews: 32, score: 4.8 },
  { id: 1, name: 'Phát triển ứng dụng Web', teacher: teacherWallet, reviews: 24, score: 4.6 },
  { id: 2, name: 'An toàn và bảo mật thông tin', teacher: teacherWallet, reviews: 0, score: null },
];
const short = (value) => `${value.slice(0, 6)}…${value.slice(-4)}`;
function Icon({ name, size = 20 }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3a4 4 0 0 1 0 8"/></>,
    book: <><path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2z"/></>,
    shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z"/><path d="m8 12 3 3 5-6"/></>,
    wallet: <><rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5l14-3v3m0 7h4v5h-4a2.5 2.5 0 0 1 0-5Z"/></>,
    arrow: <path d="m9 5 7 7-7 7"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    activity: <path d="M2 12h5l3-8 4 16 3-8h5"/>,
    search: <><circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
}
function App() {
  const [role, setRole] = useState('admin');
  const [page, setPage] = useState('overview');
  const [teachers, setTeachers] = useState(initialTeachers);
  const [courses, setCourses] = useState(initialCourses);
  const [open, setOpen] = useState(true);
  const [connected, setConnected] = useState(false);
  const [modal, setModal] = useState(null);
  const [wallet, setWallet] = useState('');
  const [courseName, setCourseName] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = document.querySelector('[role="dialog"]');
    const focusable = () => [...dialog.querySelectorAll('button, input, select, [tabindex="0"]')];
    (dialog.querySelector('[autofocus]') || dialog.querySelector('input') || focusable()[0])?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [modal]);
  const pending = teachers.filter(t => !t.approved).length;
  const mine = courses.filter(c => c.teacher === teacherWallet);
  const totalReviews = courses.reduce((sum, c) => sum + c.reviews, 0);
  const average = totalReviews ? (courses.reduce((sum, c) => sum + (c.score || 0) * c.reviews, 0) / totalReviews).toFixed(1) : '—';
  const notify = (message) => setNotice(message);
  const showModal = (name) => { setError(''); setWallet(''); setCourseName(''); setModal(name); };
  const navigate = (value) => { setPage(value); setQuery(''); };
  const changeRole = (value) => { setRole(value); navigate('overview'); setNotice(''); };
  const approve = (address) => { setTeachers(current => current.map(t => t.wallet === address ? { ...t, approved: true } : t)); notify('Đã duyệt ví giảng viên trong bản demo.'); };
  const submit = (event) => {
    event.preventDefault();
    if (modal === 'teacher') {
      const address = wallet.trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return setError('Địa chỉ ví phải bắt đầu bằng 0x và có đủ 40 ký tự hex.');
      if (teachers.some(t => t.wallet.toLowerCase() === address.toLowerCase())) return setError('Địa chỉ ví này đã có trong danh sách.');
      setTeachers(current => [...current, { wallet: address, approved: true }]);
      notify('Đã thêm và duyệt ví giảng viên trong bản demo.');
    } else {
      const name = courseName.trim();
      if (!name || name.length > 120) return setError('Vui lòng nhập tên học phần từ 1 đến 120 ký tự.');
      if (!teachers.some(t => t.wallet === teacherWallet && t.approved)) return setError('Ví giảng viên chưa được phê duyệt.');
      setCourses(current => [...current, { id: Math.max(-1, ...current.map(c => c.id)) + 1, name, teacher: teacherWallet, reviews: 0, score: null }]);
      notify(`Đã tạo lớp “${name}” trong bản demo.`);
    }
    setModal(null);
  };
  const displayedTeachers = teachers.filter(t => (filter === 'all' || (filter === 'pending' ? !t.approved : t.approved)) && t.wallet.toLowerCase().includes(query.toLowerCase()));
  const displayedCourses = (role === 'admin' ? courses : mine).filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || String(c.id).includes(query));
  return <div className="app">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e => { e.preventDefault(); navigate('overview'); }}><span className="brand-icon"><Icon name="shield" size={26}/></span><span>ReSys<span className="brand-sub">ANONYMOUS EVALUATION</span></span></a>
      <div className="workspace-label">KHÔNG GIAN LÀM VIỆC</div>
      <div className="role-switch"><label htmlFor="role">Vai trò hiện tại</label><select id="role" value={role} onChange={e => changeRole(e.target.value)}><option value="admin">Nhà trường (Admin)</option><option value="teacher">Giảng viên</option></select></div>
      <nav aria-label="Điều hướng chính">
        <button className={page === 'overview' ? 'active' : ''} onClick={() => navigate('overview')}><Icon name="grid"/>Tổng quan</button>
        {role === 'admin' && <button className={page === 'teachers' ? 'active' : ''} onClick={() => navigate('teachers')}><Icon name="users"/>Quản lý giảng viên <span className="count">{pending}</span></button>}
        <button className={page === 'courses' ? 'active' : ''} onClick={() => navigate('courses')}><Icon name="book"/>{role === 'admin' ? 'Lớp học phần' : 'Lớp học của tôi'}</button>
      </nav>
      <div className="sidebar-note"><Icon name="shield"/><strong>Minh bạch từ nền tảng</strong><p>Hướng đến đánh giá công bằng và bảo vệ quyền riêng tư sinh viên.</p><span>POWERED BY BLOCKCHAIN ↗</span></div>
      <div className="profile"><span className="avatar">{role === 'admin' ? 'AD' : 'GV'}</span><div><strong>{role === 'admin' ? 'Quản trị nhà trường' : 'Giảng viên demo'}</strong><small>{role === 'admin' ? 'Quản lý hệ thống' : short(teacherWallet)}</small></div><span className="online-dot"/></div>
    </aside>
    <div className="main-shell">
      <header><div className="breadcrumb">Không gian quản lý <Icon name="arrow" size={14}/><strong>{role === 'admin' ? 'Nhà trường' : 'Giảng viên'}</strong></div><div className="header-actions"><span className="network"><i/> Sepolia · Demo</span><button className="wallet-button" onClick={() => showModal('wallet')}><Icon name="wallet" size={18}/>{connected ? short(role === 'admin' ? '0x1234567890abcdef1234567890abcdef12345678' : teacherWallet) : 'Connect Wallet'}</button></div></header>
      <main>
        <section className="page-heading"><div><div className="eyebrow">{role === 'admin' ? 'ADMIN WORKSPACE' : 'TEACHER WORKSPACE'}</div><h1>{page === 'teachers' ? 'Quản lý giảng viên' : page === 'courses' ? 'Quản lý lớp học phần' : role === 'admin' ? 'Tổng quan hệ thống' : 'Không gian giảng dạy'}</h1><p>{role === 'admin' ? 'Quản lý giảng viên, lớp học và hoạt động đánh giá tại một nơi.' : 'Tạo lớp học phần và theo dõi kết quả đánh giá từ sinh viên.'}</p></div><button className="primary" onClick={() => showModal(role === 'admin' ? 'teacher' : 'course')}><Icon name="plus" size={18}/>{role === 'admin' ? 'Thêm giảng viên' : 'Tạo lớp học phần'}</button></section>
        {notice && <div className="notice" role="status"><Icon name="check" size={18}/>{notice}<button aria-label="Đóng thông báo" onClick={() => setNotice('')}>×</button></div>}
        {page === 'overview' && <>
          <section className="stats" aria-label="Thống kê tổng quan">
            {(role === 'admin' ? [ ['Giảng viên được duyệt', teachers.filter(t => t.approved).length, 'users', `${pending} ví đang chờ phê duyệt`], ['Lớp học phần', courses.length, 'book', 'Đang có trên hệ thống'], ['Lượt đánh giá', totalReviews, 'activity', 'Dữ liệu minh họa'], ['Điểm trung bình', average, 'shield', 'Trên thang điểm 5.0'] ] : [ ['Lớp học của tôi', mine.length, 'book', 'Học phần đã tạo'], ['Lượt đánh giá', totalReviews, 'activity', 'Dữ liệu minh họa'], ['Điểm trung bình', average, 'shield', 'Trên thang điểm 5.0'] ]).map(([label, value, icon, detail]) => <article className="stat" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon}/></span></div><strong>{value}<small>{label === 'Điểm trung bình' ? '/ 5' : ''}</small></strong><p>{detail}</p></article>)}
          </section>
          <section className="survey"><div className="survey-symbol"><Icon name="activity" size={28}/></div><div className="survey-copy"><div className="survey-title"><h2>Cổng đánh giá học phần</h2><span className={`badge ${open ? 'green' : 'gray'}`}>{open ? 'Đang mở' : 'Đã đóng'}</span></div><p>{open ? 'Sinh viên có thể gửi đánh giá cho các lớp học phần đã tham gia.' : 'Tạm ngừng tiếp nhận đánh giá mới từ sinh viên.'}</p></div>{role === 'admin' ? <div className="switch-area"><span>{open ? 'Đóng cổng đánh giá' : 'Mở cổng đánh giá'}</span><button role="switch" aria-checked={open} aria-label="Bật hoặc tắt cổng đánh giá" className={`switch ${open ? 'on' : ''}`} onClick={() => showModal('survey')}><span/></button></div> : <span className="survey-readonly">Nhà trường quản lý</span>}</section>
        </>}
        {(page === 'teachers' || (page === 'overview' && role === 'admin')) && <section className="panel"><div className="panel-heading"><div><h2>Phê duyệt giảng viên <span className="small-count">{pending} chờ duyệt</span></h2><p>Cấp quyền tạo lớp học phần cho địa chỉ ví giảng viên.</p></div>{page === 'overview' && <button className="text-button" onClick={() => navigate('teachers')}>Xem tất cả <Icon name="arrow" size={15}/></button>}</div><div className="table-toolbar"><div className="tabs">{[['all','Tất cả'],['pending','Chờ duyệt'],['approved','Đã duyệt']].map(([id,label]) => <button key={id} className={filter === id ? 'selected' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm địa chỉ ví" placeholder="Tìm địa chỉ ví…" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="table-scroll"><table><thead><tr><th>ĐỊA CHỈ VÍ GIẢNG VIÊN</th><th>QUYỀN TRUY CẬP</th><th>TRẠNG THÁI</th><th className="align-right">THAO TÁC</th></tr></thead><tbody>{displayedTeachers.map(t => <tr key={t.wallet}><td><div className="wallet-cell"><span className={`wallet-avatar ${t.approved ? 'approved' : ''}`}><Icon name="wallet" size={19}/></span><div><code title={t.wallet}>{short(t.wallet)}</code><small>Ví giảng viên</small></div></div></td><td>Tạo lớp học phần</td><td><span className={`badge ${t.approved ? 'green' : 'amber'}`}><i/>{t.approved ? 'Đã phê duyệt' : 'Chờ phê duyệt'}</span></td><td className="align-right">{t.approved ? <span className="approved-label"><Icon name="check" size={16}/>Đã cấp quyền</span> : <button className="approve-button" onClick={() => approve(t.wallet)}><Icon name="check" size={15}/>Phê duyệt</button>}</td></tr>)}</tbody></table>{!displayedTeachers.length && <div className="empty">Không tìm thấy giảng viên phù hợp.</div>}</div><div className="panel-footer">Hiển thị {displayedTeachers.length} / {teachers.length} địa chỉ ví <span>Chỉ lưu địa chỉ ví, không lưu thông tin cá nhân</span></div></section>}
        {(page === 'courses' || (role === 'teacher' && page === 'overview')) && <section className="panel"><div className="panel-heading"><div><h2>{role === 'teacher' ? 'Lớp học phần của tôi' : 'Tất cả lớp học phần'}</h2><p>{role === 'teacher' ? 'Các học phần được tạo bởi ví giảng viên demo đã duyệt.' : 'Danh sách học phần và kết quả đánh giá minh họa.'}</p></div><label className="search"><Icon name="search" size={17}/><input aria-label="Tìm học phần" placeholder="Tìm học phần…" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="course-grid">{displayedCourses.map(c => <article className="course-card" key={c.id}><div className="course-top"><span className="course-icon"><Icon name="book" size={24}/></span><span className="course-id">HP-{String(c.id).padStart(3,'0')}</span></div><h3>{c.name}</h3><p>Giảng viên <code title={c.teacher}>{short(c.teacher)}</code></p><div className="course-bottom"><span>{c.reviews} lượt đánh giá</span><strong>{c.score ? `★ ${c.score.toFixed(1)}` : 'Chưa có điểm'}</strong></div></article>)}{!displayedCourses.length && <div className="empty">Chưa có học phần phù hợp.{role === 'teacher' && <button className="text-button" onClick={() => showModal('course')}>Tạo lớp đầu tiên</button>}</div>}</div><div className="panel-footer">{displayedCourses.length} lớp học phần <span>Mã lớp bắt đầu từ 0 theo cấu trúc smart contract</span></div></section>}
        <footer><span>© 2026 Anonymous ReSys</span></footer>
      </main>
    </div>
    {modal && <div className="modal-backdrop" onClick={e => { if(e.target === e.currentTarget) setModal(null); }} onKeyDown={e => { if(e.key === 'Escape') setModal(null); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" aria-label="Đóng hộp thoại" onClick={() => setModal(null)}>×</button><span className="modal-icon"><Icon name={modal === 'course' ? 'book' : modal === 'survey' ? 'activity' : 'wallet'} size={26}/></span><h2 id="modal-title">{modal === 'teacher' ? 'Thêm giảng viên' : modal === 'course' ? 'Tạo lớp học phần' : modal === 'survey' ? `${open ? 'Đóng' : 'Mở'} cổng đánh giá?` : 'Kết nối ví mô phỏng'}</h2>{modal === 'teacher' || modal === 'course' ? <form onSubmit={submit}><p>{modal === 'teacher' ? 'Nhập địa chỉ ví để cấp quyền tạo lớp trong bản demo.' : 'Học phần mới sẽ thuộc ví giảng viên demo đã được duyệt.'}</p><label className="form-label" htmlFor="entry">{modal === 'teacher' ? 'Địa chỉ ví Ethereum' : 'Tên học phần'}</label><input id="entry" autoFocus value={modal === 'teacher' ? wallet : courseName} maxLength={modal === 'teacher' ? 42 : 120} placeholder={modal === 'teacher' ? '0x…' : 'Ví dụ: Công nghệ Blockchain'} onChange={e => {setError(''); modal === 'teacher' ? setWallet(e.target.value) : setCourseName(e.target.value);}} aria-invalid={!!error} aria-describedby={error ? 'form-error' : undefined}/>{error && <p id="form-error" className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={() => setModal(null)}>Hủy</button><button className="primary" type="submit">{modal === 'teacher' ? 'Thêm và phê duyệt' : 'Tạo lớp học phần'}</button></div></form> : modal === 'survey' ? <><p>{open ? 'Sinh viên sẽ tạm thời không thể gửi đánh giá mới. Bạn có thể mở lại bất cứ lúc nào.' : 'Cho phép sinh viên gửi đánh giá cho lớp đã tham gia.'} Thao tác chỉ thay đổi trạng thái demo.</p><div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>Hủy</button><button autoFocus className="primary" onClick={() => {setOpen(!open); setModal(null); notify(`Đã ${open ? 'đóng' : 'mở'} cổng đánh giá trong bản demo.`);}}>Xác nhận {open ? 'đóng' : 'mở'} cổng</button></div></> : <><p>Giai đoạn 1 dùng ví mẫu để trình diễn giao diện. Chưa kết nối MetaMask, yêu cầu chữ ký hay gửi giao dịch.</p><div className="demo-wallet"><Icon name="wallet"/><span>{role === 'admin' ? 'Ví quản trị mẫu' : 'Ví giảng viên đã duyệt'}<code>{role === 'admin' ? '0x1234…5678' : short(teacherWallet)}</code></span></div><button autoFocus className="primary full" onClick={() => {setConnected(!connected); setModal(null); notify(connected ? 'Đã ngắt ví mô phỏng.' : 'Đã kết nối ví mô phỏng.');}}>{connected ? 'Ngắt kết nối demo' : 'Dùng ví mô phỏng'}</button></>}</section></div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
