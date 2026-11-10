import { BrowserProvider, Contract, Interface, ZeroAddress, getAddress, isAddress, toUtf8Bytes } from 'ethers';
import { contractDefinition } from './contract.js';

export const sameAddress = (a, b) => Boolean(a && b && a.toLowerCase() === b.toLowerCase());
export function walletAddress(value) {
  const address = String(value || '').trim();
  if (!isAddress(address) || sameAddress(address, ZeroAddress)) throw new Error('Địa chỉ ví/contract phải là địa chỉ Ethereum hợp lệ và khác địa chỉ zero.');
  return getAddress(address);
}
export function decodedRevertName(error, contractInterface) {
  if (error?.revert?.name) return error.revert.name;
  // MetaMask/RPC may wrap revert bytes in data.originalError or info.error.
  const queue = [error], seen = new Set();
  for (let index = 0; index < queue.length && index < 30; index++) {
    const value = queue[index];
    if (typeof value === 'string' && /^0x[0-9a-fA-F]{8,}$/.test(value)) {
      try { const parsed = contractInterface.parseError(value); if (parsed) return parsed.name; } catch { /* Not ABI-encoded revert data. */ }
    }
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    queue.push(value.data, value.error, value.originalError, value.info?.error, value.cause);
  }
  return null;
}
export function runtimeHasFunctions(bytecode, contractInterface, methods) {
  // Solidity's direct dispatcher uses PUSH4 selectors. Walk instructions rather
  // than searching arbitrary substrings inside PUSH data or reverting eth_call.
  if (!/^0x(?:[0-9a-fA-F]{2})+$/.test(bytecode)) return false;
  const bytes = bytecode.slice(2).toLowerCase(), selectors = new Set();
  for (let offset = 0; offset < bytes.length;) {
    const opcode = parseInt(bytes.slice(offset, offset + 2), 16);
    offset += 2;
    if (opcode === 0x63) selectors.add(bytes.slice(offset, offset + 8));
    if (opcode >= 0x60 && opcode <= 0x7f) offset += (opcode - 0x5f) * 2;
  }
  return methods.every(method => selectors.has(contractInterface.getFunction(method).selector.slice(2).toLowerCase()));
}
export function formatWeb3Error(error) {
  const code = error?.code ?? error?.info?.error?.code;
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Bạn đã từ chối yêu cầu trong MetaMask.';
  if (code === -32002 || error?.info?.error?.code === -32002) return 'MetaMask đang có yêu cầu chờ xử lý. Hãy mở ví để xử lý trước.';
  if (code === 'INSUFFICIENT_FUNDS') return 'Ví chưa đủ ETH trên mạng thử nghiệm để trả phí giao dịch.';
  if (code === 'CALL_EXCEPTION') {
    const message = String(error.revert?.name || error.shortMessage || '');
    if (/UnauthorizedAdmin|KhongPhaiAdmin/.test(message)) return 'Chỉ ví Admin của contract được thực hiện thao tác này.';
    if (/AlreadyApproved|DaDuocDuyet/.test(message)) return 'Ví giảng viên này đã được phê duyệt.';
    if (/TeacherNotApproved|ChuaDuocDuyet/.test(message)) return 'Ví giảng viên chưa được Admin phê duyệt.';
    if (/InvalidCourseName|TenHocPhanKhongHopLe/.test(message)) return 'Tên học phần không hợp lệ.';
    if (/CourseNotFound|LopKhongTonTai/.test(message)) return 'Lớp học phần không tồn tại.';
    if (/StudentAlreadyEnrolled|DaThamGiaLop/.test(message)) return 'Bạn đã tham gia lớp học phần này.';
    if (/StudentNotEnrolled|ChuaThamGiaLop/.test(message)) return 'Bạn cần tham gia lớp trước khi đánh giá.';
    if (/ReviewAlreadySubmitted|DaDanhGiaLop/.test(message)) return 'Bạn đã đánh giá lớp học phần này.';
    if (/EvaluationClosed|CongDanhGiaDangDong/.test(message)) return 'Cổng đánh giá hiện đang đóng.';
    if (/InvalidScore|DiemKhongHopLe/.test(message)) return 'Điểm đánh giá phải từ 1 đến 5.';
    return 'Contract từ chối thao tác. Kiểm tra quyền, dữ liệu và phiên bản ABI đã cấu hình.';
  }
  return error?.shortMessage || error?.message || 'Không thể xử lý yêu cầu blockchain.';
}

export class SchoolChainClient {
  constructor(injected, config) {
    if (!injected?.request) throw new Error('Chưa tìm thấy MetaMask. Hãy mở website trong trình duyệt đã cài MetaMask.');
    this.address = walletAddress(config.address);
    this.chainId = BigInt(config.chainId || 11155111);
    if (this.chainId <= 0n) throw new Error('Chain ID không hợp lệ.');
    const { abi, methods } = contractDefinition(config.abiVersion);
    this.injected = injected;
    this.methods = methods;
    this.abi = abi;
    this.provider = new BrowserProvider(injected, 'any', { cacheTimeout: -1 });
    this.contract = new Contract(this.address, abi, this.provider);
  }
  async identity(requestAccess = false) {
    const accounts = await this.injected.request({ method: requestAccess ? 'eth_requestAccounts' : 'eth_accounts' });
    if (!accounts.length) throw new Error('Chưa có tài khoản ví được kết nối. Hãy kết nối MetaMask.');
    const chain = BigInt(await this.injected.request({ method: 'eth_chainId' }));
    if (chain !== this.chainId) {
      const error = new Error(`Ví đang ở mạng ${chain}. Hãy chuyển sang ${this.chainId === 11155111n ? 'Sepolia' : `mạng ${this.chainId}`} rồi kết nối lại.`);
      error.code = 'WRONG_CHAIN';
      throw error;
    }
    return walletAddress(accounts[0]);
  }
  async assertIdentity(expected) {
    if (!sameAddress(await this.identity(), expected)) throw new Error('Tài khoản ví đã thay đổi. Hãy tải lại dữ liệu trước khi thao tác.');
  }
  async snapshot(account, watchedWallets = []) {
    await this.assertIdentity(account);
    const block = await this.provider.getBlockNumber();
    const runtimeCode = await this.provider.getCode(this.address, block);
    if (runtimeCode === '0x') throw new Error('Địa chỉ cấu hình không có smart contract trên mạng đang chọn.');
    const m = this.methods, read = { blockTag: block };
    let admin, approved, evaluationOpen, count;
    try {
      [admin, approved, evaluationOpen, count] = await Promise.all([
        this.contract[m.admin](read), this.contract[m.approved](account, read),
        this.contract[m.open](read), this.contract[m.count](read),
      ]);
    } catch { throw new Error('Không đọc được contract. Kiểm tra địa chỉ và ABI tiếng Anh/tiếng Việt của bản đã deploy.'); }
    // Bound RPC requests; never silently present a truncated list as the full system.
    if (count > 1000n) throw new Error('Contract có hơn 1.000 lớp. Cần bổ sung phân trang/indexer trước khi tải toàn bộ dữ liệu.');
    const courses = [];
    for (let offset = 0; offset < Number(count); offset += 10) {
      const rows = await Promise.all(Array.from({ length: Math.min(10, Number(count) - offset) }, async (_, index) => {
        const id = String(offset + index);
        const [name, teacher, exists, totalScore, reviewCount] = await this.contract[m.course](id, read);
        return { id, name, teacher, exists, totalScore, reviewCount,
          score: reviewCount ? Number(totalScore * 10n / reviewCount) / 10 : null };
      }));
      courses.push(...rows.filter(row => row.exists));
    }
    const addresses = [...new Set([...watchedWallets, account, ...courses.map(row => row.teacher)].map(address => walletAddress(address).toLowerCase()))];
    const teachers = [];
    for (let offset = 0; offset < addresses.length; offset += 10) {
      teachers.push(...await Promise.all(addresses.slice(offset, offset + 10).map(async wallet => ({
        wallet: getAddress(wallet), approved: await this.contract[m.approved](wallet, read),
      }))));
    }
    await this.assertIdentity(account);
    const studentSupported = await this.supportsStudents(count, read, runtimeCode);
    if (studentSupported) {
      for (let offset = 0; offset < courses.length; offset += 10) {
        const states = await Promise.all(courses.slice(offset, offset + 10).map(async course => ({
          id: course.id,
          joined: await this.contract[m.enrolled](course.id, account, read),
          evaluated: await this.contract[m.evaluated](course.id, account, read),
        })));
        for (const state of states) Object.assign(courses.find(course => course.id === state.id), state);
      }
    }
    await this.assertIdentity(account);
    return { account, admin, role: sameAddress(admin, account) ? 'admin' : approved ? 'teacher' : 'student',
      evaluationOpen, courseCount: count, courses, teachers, block, studentSupported };
  }
  async supportsStudents(_count, overrides = {}, runtimeCode) {
    // These project contracts are direct deployments, not proxy contracts.
    // Code is immutable for an address; RPC failures must propagate as errors.
    const code = runtimeCode ?? await this.provider.getCode(this.address, overrides.blockTag ?? 'latest');
    const m = this.methods;
    return runtimeHasFunctions(code, this.contract.interface, [m.enrolled, m.evaluated, m.join, m.review, m.average]);
  }
  async lookupTeacher(account, address) {
    await this.assertIdentity(account);
    const wallet = walletAddress(address);
    const approved = await this.contract[this.methods.approved](wallet);
    await this.assertIdentity(account);
    return { wallet, approved };
  }
  async transact(account, operation, input, onStatus = () => {}) {
    if (!['approve', 'toggle', 'create', 'join', 'review'].includes(operation)) throw new Error('Thao tác không được hỗ trợ.');
    await this.assertIdentity(account);
    const m = this.methods;
    if ((operation === 'join' || operation === 'review') && !await this.supportsStudents(await this.contract[m.count]())) {
      throw new Error('Contract đang cấu hình chưa hỗ trợ chức năng Sinh viên.');
    }
    const [admin, approved] = await Promise.all([this.contract[m.admin](), this.contract[m.approved](account)]);
    if (operation === 'create' && !approved) throw new Error('Ví hiện tại không có quyền thực hiện thao tác này.');
    if (['approve', 'toggle'].includes(operation) && !sameAddress(admin, account)) throw new Error('Ví hiện tại không có quyền thực hiện thao tác này.');
    let args = [];
    if (operation === 'approve') args = [walletAddress(input)];
    if (operation === 'create') {
      const name = String(input || '').trim();
      if (!name || name.length > 120 || toUtf8Bytes(name).length > 480) throw new Error('Tên học phần cần có từ 1 đến 120 ký tự, tối đa 480 byte UTF-8.');
      args = [name];
    }
    if (operation === 'join' || operation === 'review') {
      const courseId = String(input?.courseId ?? '');
      if (!/^\d+$/.test(courseId)) throw new Error('ID lớp học phần không hợp lệ.');
      args = [BigInt(courseId)];
      if (operation === 'review') {
        const score = Number(input?.score);
        if (!Number.isInteger(score) || score < 1 || score > 5) throw new Error('Điểm đánh giá phải từ 1 đến 5.');
        args.push(score);
      }
    }
    // Toggle is non-idempotent. Check displayed state before asking for a signature.
    if (operation === 'toggle' && typeof input === 'boolean' && await this.contract[m.open]() !== input) {
      throw new Error('Trạng thái khảo sát đã thay đổi. Hãy tải lại dữ liệu rồi xác nhận lại.');
    }
    const signer = await this.provider.getSigner(account);
    const writer = this.contract.connect(signer)[m[operation]];
    await writer.staticCall(...args);
    await this.assertIdentity(account);
    onStatus({ stage: 'signing', hash: '' });
    const transaction = await writer(...args);
    onStatus({ stage: 'pending', hash: transaction.hash });
    let receipt;
    try { receipt = await transaction.wait(1); }
    catch (error) {
      if (error.code !== 'TRANSACTION_REPLACED' || error.cancelled) throw error;
      // Only accept an equivalent speed-up, never a replacement with different data.
      if (!error.replacement || !sameAddress(error.replacement.to, transaction.to) || error.replacement.data !== transaction.data) {
        throw new Error('Giao dịch đã được thay bằng thao tác khác. Hãy tải lại dữ liệu.');
      }
      receipt = error.receipt;
    }
    if (!receipt || receipt.status !== 1) throw new Error('Giao dịch thất bại trên blockchain.');
    onStatus({ stage: 'success', hash: receipt.hash });
    return receipt;
  }
  destroy() { this.provider.destroy(); }
}

// Exported for validation tests and later member-2 integration.
export function getContractInterface(version) { return new Interface(contractDefinition(version).abi); }
