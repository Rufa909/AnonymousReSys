import assert from 'node:assert/strict';
import { before, beforeEach, after, afterEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import hre from 'hardhat';
import solc from 'solc';
import { BrowserProvider, ContractFactory, ZeroAddress } from 'ethers';
import { compileContract } from '../../scripts/compile-contracts.mjs';
import { SchoolChainClient, formatWeb3Error, walletAddress } from '../../src/web3/client.js';

let connection, provider, artifact, vietnameseArtifact, admin, teacher, student, contract, selected, clients;
const rpc = { request: async ({ method, params }) => {
  if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [selected];
  return connection.provider.request({ method, params: params || [] });
} };
before(async () => {
  // The actual source is Vietnamese. Compile it directly; derive an English
  // selector fixture only to retain backwards-compatibility coverage.
  vietnameseArtifact = await compileContract();
  let source = await readFile(new URL('../../contracts/DecentralizedEduEvaluation.sol', import.meta.url), 'utf8');
  for (const [from, to] of Object.entries({ viAdmin: 'schoolAdmin', giangVienDaDuyet: 'approvedTeachers',
    congDanhGiaDangMo: 'evaluationOpen', tongSoLop: 'courseCount', danhSachLop: 'courses',
    duyetGiangVien: 'approveTeacher', batTatDanhGia: 'toggleEvaluation', taoLopHocPhan: 'createCourse',
    sinhVienDaThamGia: 'enrolledStudents', sinhVienDaDanhGia: 'hasEvaluated', thamGiaLop: 'joinCourse',
    guiDanhGia: 'submitReview', layDiemTrungBinh: 'getAverageScore' })) {
    source = source.replace(new RegExp(`\\b${from}\\b`, 'g'), to);
  }
  const result = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'Vi.sol': { content: source } },
    settings: { evmVersion: 'paris', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } })));
  assert.equal(result.errors?.some(error => error.severity === 'error') || false, false);
  const vi = result.contracts['Vi.sol'].DecentralizedEduEvaluation;
  artifact = { abi: vi.abi, bytecode: `0x${vi.evm.bytecode.object}` };
  connection = await hre.network.connect('hardhat');
  provider = new BrowserProvider(connection.provider);
  provider.pollingInterval = 10;
  [admin, teacher, student] = await Promise.all([0, 1, 2].map(index => provider.getSigner(index)));
});
beforeEach(async () => {
  selected = await admin.getAddress(); clients = [];
  contract = await new ContractFactory(artifact.abi, artifact.bytecode, admin).deploy();
  await contract.waitForDeployment();
});
afterEach(() => clients.forEach(client => client.destroy()));
after(async () => { provider?.destroy(); await connection?.close(); });
function client(options = {}) {
  const instance = new SchoolChainClient(options.rpc || rpc, { address: options.address || contract.target,
    chainId: options.chainId || 31337, abiVersion: options.abiVersion || 'english' });
  instance.provider.pollingInterval = 10; clients.push(instance); return instance;
}

test('reads role, closed survey and empty courses from the connected account', async () => {
  const api = client();
  const account = await api.identity(true);
  const data = await api.snapshot(account);
  assert.equal(data.role, 'admin'); assert.equal(data.evaluationOpen, false);
  assert.equal(data.courseCount, 0n); assert.equal(data.courses.length, 0);
});

test('approval, teacher course creation and toggle confirm receipts and refresh from chain', async () => {
  const api = client(), statuses = [];
  const teacherAddress = await teacher.getAddress();
  const receipt = await api.transact(selected, 'approve', teacherAddress, status => statuses.push(status));
  assert.equal(receipt.status, 1);
  assert.deepEqual(statuses.map(status => status.stage), ['signing', 'pending', 'success']);
  assert.equal(statuses.at(-1).hash, receipt.hash);
  assert.equal((await api.lookupTeacher(selected, teacherAddress)).approved, true);
  selected = teacherAddress;
  assert.equal((await api.snapshot(selected)).role, 'teacher');
  await api.transact(selected, 'create', 'Công nghệ Blockchain');
  const data = await api.snapshot(selected);
  assert.equal(data.courses[0].name, 'Công nghệ Blockchain');
  assert.equal(data.courses[0].teacher, teacherAddress);
  assert.equal(data.courses[0].score, null);
  assert.equal(data.courses[0].reviewCount, 0n);
  selected = await admin.getAddress();
  await api.transact(selected, 'toggle', false);
  assert.equal((await api.snapshot(selected)).evaluationOpen, true);
});

test('student joins a course, submits one score and refreshes personal state', async () => {
  const api = client();
  const adminAddress = selected;
  const teacherAddress = await teacher.getAddress();
  const studentAddress = await student.getAddress();
  await api.transact(adminAddress, 'approve', teacherAddress);
  selected = teacherAddress;
  await api.transact(selected, 'create', 'An toàn Blockchain');
  await api.transact(selected, 'grant', { courseId: '0', wallets: [studentAddress] });

  selected = studentAddress;
  let data = await api.snapshot(selected);
  assert.equal(data.role, 'student'); assert.equal(data.studentSupported, true);
  assert.equal(data.courses[0].joined, false); assert.equal(data.courses[0].evaluated, false);
  await api.transact(selected, 'join', { courseId: '0' });
  data = await api.snapshot(selected);
  assert.equal(data.courses[0].joined, true); assert.equal(data.courses[0].evaluated, false);
  await assert.rejects(() => api.transact(selected, 'join', { courseId: '0' }), error => {
    assert.match(formatWeb3Error(error), /đã tham gia/); return true;
  });

  selected = adminAddress;
  await api.transact(selected, 'toggle', false);
  selected = studentAddress;
  await api.transact(selected, 'review', { courseId: '0', score: 5, comment: 'Giảng viên hỗ trợ sinh viên rất tốt.' });
  data = await api.snapshot(selected);
  assert.equal(data.courses[0].evaluated, true);
  assert.equal(data.courses[0].reviewCount, 1n); assert.equal(data.courses[0].score, 5);
  await assert.rejects(() => api.transact(selected, 'review', { courseId: '0', score: 4, comment: 'Không thể gửi nhận xét lần thứ hai.' }), error => {
    assert.match(formatWeb3Error(error), /đã đánh giá/); return true;
  });
});

test('Vietnamese ABI works for the same complete member-1 workflow', async () => {
  const vi = await new ContractFactory(vietnameseArtifact.abi, vietnameseArtifact.bytecode, admin).deploy();
  await vi.waitForDeployment();
  const api = client({ address: vi.target, abiVersion: 'vietnamese' });
  const teacherAddress = await teacher.getAddress();
  assert.equal((await api.snapshot(selected)).role, 'admin');
  await api.transact(selected, 'approve', teacherAddress);
  await api.transact(selected, 'toggle', false);
  selected = teacherAddress;
  await api.transact(selected, 'create', 'Lớp tiếng Việt');
  const data = await api.snapshot(selected);
  assert.equal(data.role, 'teacher'); assert.equal(data.evaluationOpen, true);
  assert.equal(data.studentSupported, true);
  assert.equal(data.courses[0].name, 'Lớp tiếng Việt');
});

test('student and unapproved teacher cannot perform member-1 writes', async () => {
  const api = client(); selected = await student.getAddress();
  assert.equal((await api.snapshot(selected)).role, 'student');
  for (const [operation, input] of [['approve', await teacher.getAddress()], ['toggle', false], ['create', 'Lớp']]) {
    await assert.rejects(() => api.transact(selected, operation, input), /không có quyền/);
  }
  assert.equal(await contract.courseCount(), 0n);
});

test('wrong network and a changed wallet are rejected before writes', async () => {
  const api = client({ chainId: 11155111 });
  await assert.rejects(() => api.identity(), { code: 'WRONG_CHAIN' });
  const correct = client(), expected = selected;
  selected = await student.getAddress();
  await assert.rejects(() => correct.transact(expected, 'toggle', false), /Tài khoản ví đã thay đổi/);
  assert.equal(await contract.evaluationOpen(), false);
});

test('an account change during snapshot invalidates the returned data', async () => {
  let changed = false;
  const original = selected;
  const api = client({ rpc: { request: async payload => {
    const value = await rpc.request(payload);
    if (payload.method === 'eth_call' && !changed) { changed = true; selected = await student.getAddress(); }
    return value;
  } } });
  await assert.rejects(() => api.snapshot(original), /Tài khoản ví đã thay đổi/);
});

test('wrong ABI and an externally-owned address fail contract validation', async () => {
  await assert.rejects(() => client({ abiVersion: 'vietnamese' }).snapshot(selected), /Không đọc được contract/);
  await assert.rejects(() => client({ address: selected }).snapshot(selected), /không có smart contract/);
  assert.throws(() => walletAddress(ZeroAddress), /khác địa chỉ zero/);
  assert.throws(() => walletAddress('0x123'), /hợp lệ/);
});

test('stale toggle state is not silently inverted', async () => {
  const api = client(); await (await contract.toggleEvaluation()).wait();
  await assert.rejects(() => api.transact(selected, 'toggle', false), /Trạng thái khảo sát đã thay đổi/);
  assert.equal(await contract.evaluationOpen(), true);
});

test('wallet rejection does not report success or mutate contract', async () => {
  const states = [];
  const api = client({ rpc: { request: async payload => {
    if (payload.method === 'eth_sendTransaction') throw Object.assign(new Error('User rejected'), { code: 4001 });
    return rpc.request(payload);
  } } });
  await assert.rejects(() => api.transact(selected, 'toggle', false, status => states.push(status.stage)),
    error => { assert.match(formatWeb3Error(error), /từ chối/); return true; });
  assert.deepEqual(states, ['signing']); assert.equal(await contract.evaluationOpen(), false);
});

test('empty names and duplicate approvals are rejected before a new transaction', async () => {
  const api = client(), address = await teacher.getAddress();
  await api.transact(selected, 'approve', address);
  await assert.rejects(() => api.transact(selected, 'approve', address), error => {
    assert.match(formatWeb3Error(error), /đã được phê duyệt/); return true;
  });
  selected = address;
  for (const name of [' ', 'a'.repeat(121)]) await assert.rejects(() => api.transact(selected, 'create', name), /Tên học phần/);
  assert.equal(await contract.courseCount(), 0n);
});
