import { useCallback, useState } from 'react';
import { applyDemoTransaction, createDemoSchool, demoSnapshot, demoWallets } from '../data/demoSchool.js';
import { walletAddress } from './client.js';

export function useDemoSchoolChain() {
  const [model, setModel] = useState(() => createDemoSchool());
  const [selectedRole, setSelectedRole] = useState('admin');
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [watched, setWatched] = useState([]);
  const account = demoWallets[selectedRole];
  const snapshot = connected ? demoSnapshot(model, account) : null;
  if (snapshot) for (const wallet of watched) if (!snapshot.teachers.some(row => row.wallet === wallet)) snapshot.teachers.push({ wallet, approved: model.approved.includes(wallet.toLowerCase()) });
  const commentsPage = useCallback(async (courseId, page = 0, pageSize = 10) => {
    if (!connected) throw new Error('Hãy kết nối ví mô phỏng trước khi đọc nhận xét.');
    if (!demoSnapshot(model, account).resultsVisible) throw new Error('Cổng đánh giá đang mở. Bạn chỉ được xem nhận xét sau khi Admin đóng cổng.');
    const course = model.courses.find(row => row.id === courseId);
    if (!course) throw new Error('Lớp học phần không tồn tại.');
    const comments = [...course.comments].reverse();
    return { comments: comments.slice(page * pageSize, (page + 1) * pageSize), total: BigInt(comments.length), page, pageSize, hasNext: (page + 1) * pageSize < comments.length, block: 'mô phỏng' };
  }, [model, account, connected]);
  return { snapshot, error, transaction, loading: false, busy: false, selectedRole, demoWallets,
    selectRole: role => { setSelectedRole(role); setConnected(true); setError(''); setTransaction(null); },
    resetDemo: seeded => { setModel(createDemoSchool(seeded)); setSelectedRole('admin'); setConnected(true); setError(''); setTransaction(null); setWatched([]); },
    connect: () => setConnected(true), disconnect: () => setConnected(false), switchNetwork: () => {}, refresh: () => setError(''), commentsPage,
    lookup: async value => { try { const wallet = walletAddress(value); setWatched(current => [...new Set([...current, wallet])]); setError(''); } catch (failure) { setError(failure.message); } },
    transact: async (operation, input) => {
      try {
        const next = applyDemoTransaction(model, account, operation, input);
        setModel(next); setError(''); setTransaction({ stage: 'success', hash: '' }); return true;
      } catch (failure) { setError(failure.message); setTransaction({ stage: 'error', hash: '' }); return false; }
    },
  };
}
