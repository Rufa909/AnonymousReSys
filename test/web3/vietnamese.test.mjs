import assert from 'node:assert/strict';
import { before, beforeEach, afterEach, after, test } from 'node:test';
import hre from 'hardhat';
import solc from 'solc';
import { BrowserProvider, ContractFactory } from 'ethers';
import { compileContract } from '../../scripts/compile-contracts.mjs';
import { SchoolChainClient, formatWeb3Error, decodedRevertName, getContractInterface, runtimeHasFunctions } from '../../src/web3/client.js';
import { contractDefinition } from '../../src/web3/contract.js';

let connection, provider, admin, teacher, student, artifact, legacyArtifact, contract, selected, clients;
const injected = { request: async ({ method, params }) => {
  if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [selected];
  return connection.provider.request({ method, params: params || [] });
} };
before(async () => {
  artifact = await compileContract();
  // Reproduce the old deployment with the same public getters but no student methods.
  const legacy = `pragma solidity 0.8.28; contract Legacy {
    address public immutable viAdmin;
    mapping(address => bool) public giangVienDaDuyet;
    bool public congDanhGiaDangMo;
    uint256 public tongSoLop;
    struct Lop { string ten; address gv; bool tonTai; uint256 diem; uint256 luot; }
    mapping(uint256 => Lop) public danhSachLop;
    constructor() { viAdmin = msg.sender; }
  }`;
  const output = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity',
    sources: { 'Legacy.sol': { content: legacy } }, settings: { evmVersion: 'paris',
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } })));
  assert.equal(output.errors?.some(error => error.severity === 'error') || false, false);
  const compiled = output.contracts['Legacy.sol'].Legacy;
  legacyArtifact = { abi: compiled.abi, bytecode: `0x${compiled.evm.bytecode.object}` };
  connection = await hre.network.connect('hardhat');
  provider = new BrowserProvider(connection.provider, 'any', { cacheTimeout: -1 });
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
function client(address = contract.target) {
  const api = new SchoolChainClient(injected, { address, chainId: 31337, abiVersion: 'vietnamese' });
  api.provider.pollingInterval = 10; clients.push(api); return api;
}

test('Vietnamese student can join, review and read actual updated scores', async () => {
  const api = client(), adminAddress = selected, teacherAddress = await teacher.getAddress();
  await api.transact(selected, 'approve', teacherAddress);
  selected = teacherAddress;
  await api.transact(selected, 'create', 'Công nghệ Blockchain');
  selected = await student.getAddress();
  let data = await api.snapshot(selected);
  assert.equal(data.role, 'student'); assert.equal(data.studentSupported, true);
  assert.equal(data.courses[0].joined, false);
  await api.transact(selected, 'join', { courseId: '0' });
  await assert.rejects(() => api.transact(selected, 'review', { courseId: '0', score: 5 }), error => {
    assert.match(formatWeb3Error(error), /đang đóng/); return true;
  });
  selected = adminAddress;
  await api.transact(selected, 'toggle', false);
  selected = await student.getAddress();
  await api.transact(selected, 'review', { courseId: '0', score: 5 });
  data = await api.snapshot(selected);
  assert.equal(data.courses[0].joined, true); assert.equal(data.courses[0].evaluated, true);
  assert.equal(data.courses[0].reviewCount, 1n); assert.equal(data.courses[0].score, 5);
  await assert.rejects(() => api.transact(selected, 'review', { courseId: '0', score: 4 }), error => {
    assert.match(formatWeb3Error(error), /đã đánh giá/); return true;
  });
});

test('old Vietnamese contract still loads but does not advertise or submit student writes', async () => {
  const legacy = await new ContractFactory(legacyArtifact.abi, legacyArtifact.bytecode, admin).deploy();
  await legacy.waitForDeployment();
  const api = client(legacy.target);
  const data = await api.snapshot(selected);
  assert.equal(data.role, 'admin'); assert.equal(data.studentSupported, false);
  selected = await student.getAddress();
  await assert.rejects(() => api.transact(selected, 'join', { courseId: '0' }), /chưa hỗ trợ/);
});

test('full Vietnamese contract is recognized even before its first course is created', async () => {
  const api = client(); selected = await student.getAddress();
  const data = await api.snapshot(selected);
  assert.equal(data.studentSupported, true);
  assert.equal(data.courseCount, 0n); assert.deepEqual(data.courses, []);
});

test('Vietnamese is the default ABI when no version is specified', () => {
  const definition = contractDefinition();
  assert.equal(definition.methods.admin, 'viAdmin');
  assert.equal(definition.methods.join, 'thamGiaLop');
  assert.equal(definition.methods.review, 'guiDanhGia');
  assert.ok(getContractInterface().getFunction('layDiemTrungBinh'));
});

test('nested MetaMask revert data can still be decoded for error messages', () => {
  const iface = getContractInterface('vietnamese');
  const data = iface.encodeErrorResult('LopKhongTonTai', [0]);
  const wrapped = { code: 'CALL_EXCEPTION', info: { error: { data: { originalError: { data } } } } };
  assert.equal(decodedRevertName(wrapped, iface), 'LopKhongTonTai');
  assert.equal(decodedRevertName({ code: 'CALL_EXCEPTION', data: '0x' }, iface), null);
});

test('student detection stays stable when RPC strips error data for invalid course calls', async () => {
  let strippedCalls = 0;
  const selector = getContractInterface('vietnamese').getFunction('layDiemTrungBinh').selector;
  const maskedWallet = { request: async payload => {
    if (payload.method === 'eth_call' && payload.params?.[0]?.data?.startsWith(selector)) {
      strippedCalls++;
      throw Object.assign(new Error('execution reverted'), { code: 3, data: '0x' });
    }
    return injected.request(payload);
  } };
  const api = new SchoolChainClient(maskedWallet, { address: contract.target, chainId: 31337, abiVersion: 'vietnamese' });
  clients.push(api); selected = await student.getAddress();
  for (let i = 0; i < 4; i++) {
    const data = await api.snapshot(selected);
    assert.equal(data.role, 'student'); assert.equal(data.studentSupported, true);
  }
  assert.equal(strippedCalls, 0, 'capability detection must not rely on intentionally reverted calls');
});

test('RPC code read failures are reported, not converted to unsupported student state', async () => {
  const wallet = { request: async payload => {
    if (payload.method === 'eth_getCode') throw Object.assign(new Error('RPC offline'), { code: -32000 });
    return injected.request(payload);
  } };
  const api = new SchoolChainClient(wallet, { address: contract.target, chainId: 31337, abiVersion: 'vietnamese' });
  clients.push(api);
  await assert.rejects(() => api.snapshot(selected), /RPC offline|coalesce|could not/);
});

test('selector bytes hidden inside PUSH data do not count as callable functions', () => {
  const iface = getContractInterface('vietnamese');
  const selector = iface.getFunction('thamGiaLop').selector.slice(2);
  assert.equal(runtimeHasFunctions(`0x63${selector}00`, iface, ['thamGiaLop']), true);
  const fakePushData = `63${selector}`.padEnd(64, '0');
  assert.equal(runtimeHasFunctions(`0x7f${fakePushData}00`, iface, ['thamGiaLop']), false);
});
