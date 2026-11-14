import React, { useEffect, useRef, useState } from 'react';
import { parseWalletList } from '../web3/enrollment.js';

export default function GrantEnrollmentModal({ course, busy, error, onClose, onSubmit, demo = false }) {
  const [text, setText] = useState('');
  const [wallets, setWallets] = useState(null);
  const [failure, setFailure] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current.querySelector('textarea').focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  function keyDown(event) {
    if (event.key === 'Escape' && !busy) onClose();
    if (event.key !== 'Tab') return;
    const items = [...ref.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled)')];
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <div className="modal-backdrop" onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="grant-title" onKeyDown={keyDown}>
      <h2 id="grant-title">Cấp quyền sinh viên vào lớp</h2>
      <p>{course.name} · HP-{course.id}</p>
      <p>Dùng danh sách ví đã đối chiếu với danh sách đăng ký học của lớp. Tối đa 100 ví mỗi giao dịch.</p>
      <form onSubmit={async event => {
        event.preventDefault(); setFailure('');
        if (!wallets) { try { setWallets(parseWalletList(text)); } catch (err) { setFailure(err.message); } return; }
        await onSubmit({ courseId: course.id, wallets });
      }}>
        <label className="form-label" htmlFor="student-wallets">Danh sách địa chỉ ví</label>
        <textarea id="student-wallets" rows={6} value={text} disabled={busy || Boolean(wallets)} onChange={event => setText(event.target.value)} placeholder="Mỗi ví một dòng, hoặc ngăn cách bằng dấu phẩy / chấm phẩy" required/>
        {wallets && <div className="grant-preview"><strong>Xác nhận {wallets.length} ví sau khi loại trùng:</strong><ul>{wallets.map(wallet => <li key={wallet}><code>{wallet}</code></li>)}</ul><button className="text-button" type="button" disabled={busy} onClick={() => setWallets(null)}>Sửa danh sách</button></div>}
        {(failure || error) && <p className="form-error" role="alert">{failure || error}</p>}
        {busy && <p role="status">Đang xử lý giao dịch, hãy kiểm tra MetaMask…</p>}
        <div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>Hủy</button><button className="primary" disabled={busy}>{wallets ? demo ? 'Cấp quyền mô phỏng' : 'Cấp quyền qua MetaMask' : 'Kiểm tra danh sách'}</button></div>
      </form>
    </section>
  </div>;
}
