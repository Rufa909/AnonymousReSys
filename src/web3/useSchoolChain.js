import { useCallback, useEffect, useRef, useState } from 'react';
import { SchoolChainClient, formatWeb3Error, sameAddress } from './client.js';

function metaMaskProvider() {
  let discovered;
  const listener = event => { if (event.detail?.info?.rdns === 'io.metamask') discovered = event.detail.provider; };
  window.addEventListener('eip6963:announceProvider', listener);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  window.removeEventListener('eip6963:announceProvider', listener);
  return discovered || window.ethereum?.providers?.find(item => item.isMetaMask) || (window.ethereum?.isMetaMask ? window.ethereum : null);
}

export function useSchoolChain(config) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [inFlight, setInFlight] = useState(false);
  const client = useRef(null), epoch = useRef(0), watches = useRef([]), locked = useRef(false), unsubscribe = useRef(null);
  const reload = useCallback(async (requestAccess = false) => {
    const version = ++epoch.current;
    setLoading(true); setError('');
    try {
      if (!client.current) throw new Error('Hãy kết nối MetaMask trước.');
      const account = await client.current.identity(requestAccess);
      const data = await client.current.snapshot(account, watches.current);
      if (version === epoch.current) setSnapshot(data);
      return version === epoch.current ? data : null;
    } catch (failure) {
      if (version === epoch.current) { setSnapshot(null); setError(formatWeb3Error(failure)); }
      return null;
    } finally { if (version === epoch.current) setLoading(false); }
  }, []);
  const disconnect = useCallback(() => {
    ++epoch.current; setSnapshot(null); setLoading(false); setError(''); setTransaction(null);
    unsubscribe.current?.(); unsubscribe.current = null;
    // Keep provider alive while a submitted transaction may still be waiting.
  }, []);
  const connect = useCallback(async () => {
    if (locked.current) return;
    try {
      if (!client.current) client.current = new SchoolChainClient(metaMaskProvider(), config);
      if (!unsubscribe.current) {
        const wallet = client.current.injected;
        const changed = () => { ++epoch.current; setSnapshot(null); setTransaction(null); void reload(); };
        wallet.on?.('accountsChanged', changed); wallet.on?.('chainChanged', changed); wallet.on?.('disconnect', changed);
        unsubscribe.current = () => {
          wallet.removeListener?.('accountsChanged', changed); wallet.removeListener?.('chainChanged', changed); wallet.removeListener?.('disconnect', changed);
        };
      }
      await reload(true);
    } catch (failure) { setError(formatWeb3Error(failure)); }
  }, [config, reload]);
  const switchNetwork = useCallback(async () => {
    try {
      const wallet = client.current?.injected || metaMaskProvider();
      if (!wallet) throw new Error('Chưa tìm thấy MetaMask trong trình duyệt này.');
      await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${BigInt(config.chainId).toString(16)}` }] });
      if (client.current) await reload();
    } catch (failure) { setError(formatWeb3Error(failure)); }
  }, [config, reload]);
  const lookup = useCallback(async address => {
    if (!snapshot || locked.current) return null;
    const version = epoch.current;
    setError(''); setLoading(true);
    try {
      const row = await client.current.lookupTeacher(snapshot.account, address);
      if (version !== epoch.current) return null;
      watches.current = [...new Set([...watches.current, row.wallet])];
      setSnapshot(current => current ? { ...current, teachers: [...current.teachers.filter(item => !sameAddress(item.wallet, row.wallet)), row] } : current);
      return row;
    } catch (failure) { if (version === epoch.current) setError(formatWeb3Error(failure)); return null; }
    finally { if (version === epoch.current) setLoading(false); }
  }, [snapshot]);
  const transact = useCallback(async (operation, input) => {
    if (!snapshot || locked.current || loading) return false;
    locked.current = true;
    setInFlight(true);
    const version = epoch.current;
    setError(''); setTransaction({ stage: 'checking', hash: '' });
    try {
      await client.current.transact(snapshot.account, operation, input, status => {
        if (version === epoch.current) setTransaction(status);
      });
      if (operation === 'approve') watches.current = [...new Set([...watches.current, input])];
      if (version === epoch.current) await reload();
      return true;
    } catch (failure) {
      if (version === epoch.current) {
        setError(formatWeb3Error(failure));
        setTransaction(current => ({ ...current, stage: 'error' }));
      }
      return false;
    } finally { locked.current = false; setInFlight(false); }
  }, [snapshot, loading, reload]);
  useEffect(() => () => { ++epoch.current; unsubscribe.current?.(); client.current?.destroy(); }, []);
  return { snapshot, loading, error, transaction, connect, disconnect, switchNetwork,
    refresh: () => reload(), lookup, transact,
    busy: loading || inFlight };
}
