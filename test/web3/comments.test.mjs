import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SchoolChainClient, getContractInterface } from '../../src/web3/client.js';
import { contractDefinition } from '../../src/web3/contract.js';

const admin = '0x0000000000000000000000000000000000000001';
const teacher = '0x0000000000000000000000000000000000000002';
function fixture() {
  const client = Object.create(SchoolChainClient.prototype), calls = [];
  const { methods } = contractDefinition(); client.methods = methods;
  const iface = getContractInterface();
  const code = '0x' + Object.values(methods).map(method => '63' + iface.getFunction(method).selector.slice(2)).join('');
  client.assertIdentity = async () => {};
  client.provider = { getBlockNumber: async () => 50, getCode: async () => code };
  client.contract = { interface: iface,
    viAdmin: async () => admin, giangVienDaDuyet: async () => true, congDanhGiaDangMo: async () => true, tongSoLop: async () => 21n,
    danhSachLop: async id => [`Lớp ${id}`, Number(id) === 20 ? teacher : admin, true, 60n, 12n],
    sinhVienDuocPhep: async () => true, sinhVienDaThamGia: async () => false, sinhVienDaDanhGia: async () => false,
    soNhanXet: async (_id, read) => { calls.push(read.blockTag); return 12n; },
    layNhanXet: async (id, index, read) => { calls.push(read.blockTag); return `${id}:${index}`; },
  };
  return { client, calls };
}
test('course snapshots do not load comments before opening the reviews page', async () => {
  const { client, calls } = fixture();
  const data = await client.snapshot(teacher);
  assert.equal(data.courses[20].comments, undefined);
  assert.equal(data.courses[0].comments, undefined);
  assert.equal(calls.length, 0);
});
test('all classes remain accessible through newest-first pages without a shared comment budget', async () => {
  const { client, calls } = fixture();
  const data = await client.snapshot(admin);
  assert.equal(data.courses[20].comments, undefined);
  const first = await client.commentsPage(admin, '20', 0, 10);
  assert.equal(first.total, 12n); assert.equal(first.comments[0], '20:11'); assert.equal(first.comments.at(-1), '20:2'); assert.equal(first.hasNext, true);
  const last = await client.commentsPage(admin, '20', 1, 10, first.block);
  assert.deepEqual(last.comments, ['20:1', '20:0']); assert.equal(last.hasNext, false);
  assert.ok(calls.every(block => block === 50));
  await assert.rejects(() => client.commentsPage(admin, '20', 2), /không còn tồn tại/);
});
test('pagination rejects bad IDs, negative or fractional pages and oversized requests', async () => {
  const { client } = fixture();
  for (const args of [['x', 0, 10], ['0', -1, 10], ['0', 0.5, 10], ['0', 0, 100]]) {
    await assert.rejects(() => client.commentsPage(admin, ...args), /không hợp lệ/);
  }
});

test('student results and pages follow gate state, including after a review has been sent', async () => {
  const { client, calls } = fixture();
  const student = '0x0000000000000000000000000000000000000003';
  let open = true;
  client.contract.giangVienDaDuyet = async () => false;
  client.contract.congDanhGiaDangMo = async () => open;
  client.contract.sinhVienDaDanhGia = async () => true;
  const hidden = await client.snapshot(student);
  assert.equal(hidden.courses[0].evaluated, true);
  assert.equal(hidden.courses[0].score, null); assert.equal(hidden.courses[0].reviewCount, 0n);
  assert.equal(hidden.resultsVisible, false);
  await assert.rejects(() => client.commentsPage(student, '0'), /sau khi Admin đóng cổng/);
  assert.equal(calls.length, 0);
  open = false;
  const visible = await client.snapshot(student);
  assert.equal(visible.resultsVisible, true); assert.equal(visible.courses[0].score, 5);
  const page = await client.commentsPage(student, '0');
  assert.equal(page.comments.length, 10);
  open = true;
  await assert.rejects(() => client.commentsPage(student, '0', 1, 10, page.block), /sau khi Admin đóng cổng/);
  assert.equal((await client.snapshot(admin)).resultsVisible, true);
});

test('reopening during an in-flight comment read prevents returning results to students', async () => {
  const { client } = fixture();
  const student = '0x0000000000000000000000000000000000000003';
  let open = false;
  client.contract.giangVienDaDuyet = async () => false;
  client.contract.congDanhGiaDangMo = async () => open;
  const read = client.contract.layNhanXet;
  client.contract.layNhanXet = async (...args) => { open = true; return read(...args); };
  await assert.rejects(() => client.commentsPage(student, '0'), /sau khi Admin đóng cổng/);
});
