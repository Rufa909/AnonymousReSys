import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import hre from 'hardhat';
import { BrowserProvider, ContractFactory } from 'ethers';
import { compileContract } from '../../scripts/compile-contracts.mjs';

let artifact;
let connection;
let provider;
let admin;
let viGiangVien;
let student;
let secondStudent;
let contract;

before(async () => {
  artifact = await compileContract();
  connection = await hre.network.connect('hardhat');
  provider = new BrowserProvider(connection.provider, 'any', { cacheTimeout: -1 });
  provider.pollingInterval = 10;
  [admin, viGiangVien, student, secondStudent] = await Promise.all(
    [0, 1, 2, 3].map(index => provider.getSigner(index)),
  );
});

beforeEach(async () => {
  contract = await new ContractFactory(artifact.abi, artifact.bytecode, admin).deploy();
  await contract.waitForDeployment();
});

after(async () => {
  provider?.destroy();
  await connection?.close();
});

async function mined(transaction) {
  return (await transaction).wait();
}

async function taoLopHocPhan(name = 'Công nghệ Blockchain') {
  await mined(contract.duyetGiangVien(await viGiangVien.getAddress()));
  await mined(contract.connect(viGiangVien).taoLopHocPhan(name));
  await mined(contract.capQuyenThamGiaLop(0, [await student.getAddress(), await secondStudent.getAddress()]));
}

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
  return receipt.logs
    .map(log => contract.interface.parseLog(log))
    .find(log => log?.name === name);
}

test('student joins an existing course and emits the student address', async () => {
  await taoLopHocPhan();
  const address = await student.getAddress();
  const receipt = await mined(contract.connect(student).thamGiaLop(0));

  assert.equal(await contract.sinhVienDaThamGia(0, address), true);
  assert.deepEqual([...event(receipt, 'SinhVienDaVaoLop').args], [0n, address]);
});

test('joining a missing course or joining twice is rejected', async () => {
  const address = await student.getAddress();
  await expectRevert(
    () => contract.connect(student).thamGiaLop.staticCall(99),
    'LopKhongTonTai',
    [99n],
  );

  await taoLopHocPhan();
  await mined(contract.connect(student).thamGiaLop(0));
  await expectRevert(
    () => contract.connect(student).thamGiaLop.staticCall(0),
    'DaThamGiaLop',
    [0n, address],
  );
});

test('review is rejected while the evaluation gate is closed', async () => {
  await taoLopHocPhan();
  await mined(contract.connect(student).thamGiaLop(0));
  await expectRevert(
    () => contract.connect(student).guiDanhGia.staticCall(0, 5),
    'CongDanhGiaDangDong',
  );
});

test('only enrolled students can review an existing course', async () => {
  await taoLopHocPhan();
  await mined(contract.batTatDanhGia());
  const address = await student.getAddress();

  await expectRevert(
    () => contract.connect(student).guiDanhGia.staticCall(0, 5),
    'ChuaThamGiaLop',
    [0n, address],
  );
});

test('missing courses and scores outside 1 to 5 are rejected', async () => {
  await taoLopHocPhan();
  await mined(contract.batTatDanhGia());
  await expectRevert(
    () => contract.connect(student).guiDanhGia.staticCall(99, 5),
    'LopKhongTonTai',
    [99n],
  );

  await mined(contract.connect(student).thamGiaLop(0));
  for (const score of [0, 6, 100]) {
    await expectRevert(
      () => contract.connect(student).guiDanhGia.staticCall(0, score),
      'DiemKhongHopLe',
      [BigInt(score)],
    );
  }
});

test('a valid review updates totals, status, event and average score', async () => {
  await taoLopHocPhan();
  await mined(contract.connect(student).thamGiaLop(0));
  await mined(contract.batTatDanhGia());

  const receipt = await mined(contract.connect(student).guiDanhGia(0, 5));
  const course = await contract.danhSachLop(0);
  assert.equal(course.tongDiem, 5n);
  assert.equal(course.soLuotDanhGia, 1n);
  assert.equal(await contract.sinhVienDaDanhGia(0, await student.getAddress()), true);
  assert.deepEqual([...event(receipt, 'DaGuiDanhGia').args], [0n, 5n]);
  assert.equal(await contract.layDiemTrungBinh(0), 50n);
});

test('one wallet cannot review the same course twice', async () => {
  await taoLopHocPhan();
  await mined(contract.connect(student).thamGiaLop(0));
  await mined(contract.batTatDanhGia());
  await mined(contract.connect(student).guiDanhGia(0, 4));
  const address = await student.getAddress();

  await expectRevert(
    () => contract.connect(student).guiDanhGia.staticCall(0, 5),
    'DaDanhGiaLop',
    [0n, address],
  );
  const course = await contract.danhSachLop(0);
  assert.equal(course.tongDiem, 4n);
  assert.equal(course.soLuotDanhGia, 1n);
});

test('multiple students produce a truncated one-decimal average', async () => {
  await taoLopHocPhan();
  for (const actor of [student, secondStudent]) {
    await mined(contract.connect(actor).thamGiaLop(0));
  }
  await mined(contract.batTatDanhGia());
  await mined(contract.connect(student).guiDanhGia(0, 5));
  await mined(contract.connect(secondStudent).guiDanhGia(0, 4));

  const course = await contract.danhSachLop(0);
  assert.equal(course.tongDiem, 9n);
  assert.equal(course.soLuotDanhGia, 2n);
  assert.equal(await contract.layDiemTrungBinh(0), 45n);
});

test('average is zero without reviews and missing courses are rejected', async () => {
  await taoLopHocPhan();
  assert.equal(await contract.layDiemTrungBinh(0), 0n);
  await expectRevert(
    () => contract.layDiemTrungBinh.staticCall(1),
    'LopKhongTonTai',
    [1n],
  );
});

test('permission is specific to a course and outsiders cannot join or review', async () => {
  await taoLopHocPhan();
  await mined(contract.connect(viGiangVien).taoLopHocPhan('Lớp khác'));
  const address = await student.getAddress();
  assert.equal(await contract.sinhVienDuocPhep(1, address), false);
  await expectRevert(() => contract.connect(student).thamGiaLop.staticCall(1), 'ChuaDuocCapQuyenVaoLop', [1n, address]);
  await mined(contract.batTatDanhGia());
  await expectRevert(() => contract.connect(student).guiDanhGia.staticCall(1, 5), 'ChuaThamGiaLop', [1n, address]);
  assert.equal((await contract.danhSachLop(1)).soLuotDanhGia, 0n);
});

test('only admin or the owner teacher can grant membership, duplicate grants are harmless', async () => {
  await taoLopHocPhan();
  const address = await secondStudent.getAddress();
  await mined(contract.duyetGiangVien(address));
  await expectRevert(() => contract.connect(secondStudent).capQuyenThamGiaLop.staticCall(0, [address]), 'KhongCoQuyenQuanLyLop', [0n, address]);
  await mined(contract.connect(viGiangVien).taoLopHocPhan('Lớp mới'));
  const studentAddress = await student.getAddress();
  await expectRevert(() => contract.connect(student).capQuyenThamGiaLop.staticCall(1, [address]), 'KhongCoQuyenQuanLyLop', [1n, studentAddress]);
  const receipt = await mined(contract.connect(viGiangVien).capQuyenThamGiaLop(1, [studentAddress, studentAddress]));
  assert.equal(receipt.logs.length, 1);
  assert.equal(await contract.sinhVienDuocPhep(1, studentAddress), true);
  assert.equal((await mined(contract.capQuyenThamGiaLop(1, [studentAddress]))).logs.length, 0);
});

test('invalid batches revert atomically, missing classes fail, and 100 wallets are accepted', async () => {
  await taoLopHocPhan();
  await mined(contract.connect(viGiangVien).taoLopHocPhan('Lớp mới'));
  const address = await student.getAddress();
  await expectRevert(() => contract.capQuyenThamGiaLop.staticCall(99, [address]), 'LopKhongTonTai', [99n]);
  await expectRevert(() => contract.capQuyenThamGiaLop.staticCall(1, []), 'DanhSachViKhongHopLe');
  const wallets = Array.from({ length: 100 }, (_, i) => `0x${(i + 100).toString(16).padStart(40, '0')}`);
  await expectRevert(() => contract.capQuyenThamGiaLop.staticCall(1, [...wallets, address]), 'DanhSachViKhongHopLe');
  await assert.rejects(async () => mined(contract.capQuyenThamGiaLop(1, [address, '0x0000000000000000000000000000000000000000'], { gasLimit: 1000000 })));
  assert.equal(await contract.sinhVienDuocPhep(1, address), false);
  await mined(contract.capQuyenThamGiaLop(1, wallets));
  assert.equal(await contract.sinhVienDuocPhep(1, wallets[99]), true);
});
