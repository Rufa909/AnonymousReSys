import { getAddress, isAddress, ZeroAddress } from 'ethers';

export function normalizeWalletList(values) {
  if (!Array.isArray(values) || !values.length) throw new Error('Hãy nhập danh sách ví sinh viên.');
  const unique = new Map();
  for (const value of values) {
    const text = String(value).trim();
    if (!isAddress(text) || text.toLowerCase() === ZeroAddress) throw new Error(`Địa chỉ ví không hợp lệ: ${text}`);
    unique.set(text.toLowerCase(), getAddress(text));
  }
  if (unique.size > 100) throw new Error('Mỗi giao dịch cấp quyền tối đa 100 ví. Hãy chia danh sách thành nhiều lô.');
  return [...unique.values()];
}

export function parseWalletList(text) {
  return normalizeWalletList(text.trim().split(/[\s,;]+/).filter(Boolean));
}
