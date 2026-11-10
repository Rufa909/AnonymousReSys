import assert from 'node:assert/strict';
import { before, beforeEach, after, test } from 'node:test';
import hre from 'hardhat';
import { BrowserProvider, ContractFactory, ZeroAddress } from 'ethers';
import { compileContract } from '../../scripts/compile-contracts.mjs';

let artifact, connection, provider, admin, viGiangVien, otherTeacher, student, contract;
before(async () => {
  artifact = await compileContract();
  connection = await hre.network.connect('hardhat');
  provider = new BrowserProvider(connection.provider, 'any', { cacheTimeout: -1 });
  provider.pollingInterval = 10;
  [admin, viGiangVien, otherTeacher, student] = await Promise.all([0, 1, 2, 3].map(i => provider.getSigner(i)));
});
beforeEach(async () => {
  contract = await new ContractFactory(artifact.abi, artifact.bytecode, admin).deploy();
  await contract.waitForDeployment();
});
after(async () => { provider?.destroy(); await connection?.close(); });

async function mined(transaction) { return (await transaction).wait(); }
async function expectRevert(call, name, args = []) {
  await assert.rejects(call, error => {
    assert.equal(error.code, 'CALL_EXCEPTION');
    const decoded = contract.interface.parseError(error.data);
    assert.equal(decoded.name, name);
    assert.deepEqual([...decoded.args], args);
    return true;
  });
}
function event(receipt, name) {
  return receipt.logs.map(log => contract.interface.parseLog(log)).find(log => log?.name === name);
}

test('deployment assigns the deployer, closes evaluations and initializes shared storage', async () => {
  assert.equal(await contract.viAdmin(), await admin.getAddress());
  assert.equal(await contract.congDanhGiaDangMo(), false);
  assert.equal(await contract.tongSoLop(), 0n);
  assert.equal(await contract.giangVienDaDuyet(await viGiangVien.getAddress()), false);
  const missing = await contract.danhSachLop(0);
  assert.equal(missing.tonTai, false);
  assert.equal(await contract.sinhVienDaThamGia(0, await student.getAddress()), false);
  assert.equal(await contract.sinhVienDaDanhGia(0, await student.getAddress()), false);
});

test('admin can approve a teacher and emits the approved address', async () => {
  const address = await viGiangVien.getAddress();
  const receipt = await mined(contract.duyetGiangVien(address));
  assert.equal(await contract.giangVienDaDuyet(address), true);
  assert.equal(event(receipt, 'DaDuyetGiangVien').args.viGiangVien, address);
});

test('student and teacher cannot grant teacher permissions', async () => {
  for (const actor of [student, viGiangVien]) {
    const address = await actor.getAddress();
    await expectRevert(() => contract.connect(actor).duyetGiangVien.staticCall(address), 'KhongPhaiAdmin', [address]);
    assert.equal(await contract.giangVienDaDuyet(address), false);
  }
});

test('admin cannot approve zero address or approve an existing teacher twice', async () => {
  await expectRevert(() => contract.duyetGiangVien.staticCall(ZeroAddress), 'DiaChiViKhongHopLe');
  const address = await viGiangVien.getAddress();
  await mined(contract.duyetGiangVien(address));
  await expectRevert(() => contract.duyetGiangVien.staticCall(address), 'GiangVienDaDuocDuyet', [address]);
  assert.equal(await contract.giangVienDaDuyet(address), true);
});

test('only admin can open and close evaluation, with matching events', async () => {
  const opened = await mined(contract.batTatDanhGia());
  assert.equal(await contract.congDanhGiaDangMo(), true);
  assert.equal(event(opened, 'DaThayDoiCongDanhGia').args.dangMo, true);
  await mined(contract.duyetGiangVien(await viGiangVien.getAddress()));
  for (const actor of [student, viGiangVien]) {
    await expectRevert(() => contract.connect(actor).batTatDanhGia.staticCall(), 'KhongPhaiAdmin', [await actor.getAddress()]);
  }
  assert.equal(await contract.congDanhGiaDangMo(), true);
  const closed = await mined(contract.batTatDanhGia());
  assert.equal(await contract.congDanhGiaDangMo(), false);
  assert.equal(event(closed, 'DaThayDoiCongDanhGia').args.dangMo, false);
});

test('unapproved wallets including admin cannot create courses', async () => {
  for (const actor of [admin, viGiangVien, student]) {
    await expectRevert(() => contract.connect(actor).taoLopHocPhan.staticCall('Blockchain'), 'GiangVienChuaDuocDuyet', [await actor.getAddress()]);
  }
  assert.equal(await contract.tongSoLop(), 0n);
});

test('approved teacher creates a Vietnamese course with correct ownership, ID and zero scores', async () => {
  const address = await viGiangVien.getAddress();
  await mined(contract.duyetGiangVien(address));
  const name = 'Công nghệ Blockchain';
  const receipt = await mined(contract.connect(viGiangVien).taoLopHocPhan(name));
  assert.equal(await contract.tongSoLop(), 1n);
  const course = await contract.danhSachLop(0);
  assert.deepEqual([...course], [name, address, true, 0n, 0n]);
  const created = event(receipt, 'DaTaoLopHocPhan');
  assert.deepEqual([...created.args], [0n, name, address]);
  assert.equal(await contract.congDanhGiaDangMo(), false);
});

test('course IDs increase across teachers, preserve older courses, and ignore evaluation gate', async () => {
  for (const actor of [viGiangVien, otherTeacher]) await mined(contract.duyetGiangVien(await actor.getAddress()));
  await mined(contract.connect(viGiangVien).taoLopHocPhan('Lớp thứ nhất'));
  await mined(contract.batTatDanhGia());
  await mined(contract.connect(otherTeacher).taoLopHocPhan('Lớp thứ hai'));
  await mined(contract.connect(viGiangVien).taoLopHocPhan('Lớp thứ ba'));
  assert.equal(await contract.tongSoLop(), 3n);
  assert.equal((await contract.danhSachLop(0)).tenHocPhan, 'Lớp thứ nhất');
  assert.equal((await contract.danhSachLop(1)).viGiangVien, await otherTeacher.getAddress());
  assert.equal((await contract.danhSachLop(2)).viGiangVien, await viGiangVien.getAddress());
  assert.equal((await contract.danhSachLop(3)).tonTai, false);
});

test('empty, whitespace-only and oversized names revert without consuming a course ID', async () => {
  await mined(contract.duyetGiangVien(await viGiangVien.getAddress()));
  for (const name of ['', '   ', '\t\n\r ', 'a'.repeat(481), 'ệ'.repeat(161)]) {
    await expectRevert(() => contract.connect(viGiangVien).taoLopHocPhan.staticCall(name), 'TenHocPhanKhongHopLe');
  }
  assert.equal(await contract.tongSoLop(), 0n);
  assert.equal((await contract.danhSachLop(0)).tonTai, false);
});

test('UTF-8 names exactly at the byte limit are accepted', async () => {
  await mined(contract.duyetGiangVien(await viGiangVien.getAddress()));
  const name = 'ệ'.repeat(160);
  assert.equal(Buffer.byteLength(name, 'utf8'), 480);
  await mined(contract.connect(viGiangVien).taoLopHocPhan(name));
  assert.equal((await contract.danhSachLop(0)).tenHocPhan, name);
});

test('a failed unauthorized transaction is mined with no permission changes', async () => {
  const writer = contract.connect(student);
  const transaction = await writer.duyetGiangVien(await viGiangVien.getAddress(), { gasLimit: 200000 });
  await assert.rejects(() => transaction.wait(), error => {
    assert.equal(error.code, 'CALL_EXCEPTION');
    assert.equal(error.receipt.status, 0);
    assert.equal(error.receipt.hash, transaction.hash);
    return true;
  });
  assert.equal(await contract.giangVienDaDuyet(await viGiangVien.getAddress()), false);
  assert.equal(await contract.tongSoLop(), 0n);
});
