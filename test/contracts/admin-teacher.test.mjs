import assert from 'node:assert/strict';
import { before, beforeEach, after, test } from 'node:test';
import hre from 'hardhat';
import { BrowserProvider, ContractFactory, ZeroAddress } from 'ethers';
import { compileContract } from '../../scripts/compile-contracts.mjs';

let artifact, connection, provider, admin, teacher, otherTeacher, student, contract;
before(async () => {
  artifact = await compileContract();
  connection = await hre.network.connect('hardhat');
  provider = new BrowserProvider(connection.provider);
  provider.pollingInterval = 10;
  [admin, teacher, otherTeacher, student] = await Promise.all([0, 1, 2, 3].map(i => provider.getSigner(i)));
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
  assert.equal(await contract.schoolAdmin(), await admin.getAddress());
  assert.equal(await contract.evaluationOpen(), false);
  assert.equal(await contract.courseCount(), 0n);
  assert.equal(await contract.approvedTeachers(await teacher.getAddress()), false);
  const missing = await contract.courses(0);
  assert.equal(missing.exists, false);
  assert.equal(await contract.enrolledStudents(0, await student.getAddress()), false);
  assert.equal(await contract.hasEvaluated(0, await student.getAddress()), false);
});

test('admin can approve a teacher and emits the approved address', async () => {
  const address = await teacher.getAddress();
  const receipt = await mined(contract.approveTeacher(address));
  assert.equal(await contract.approvedTeachers(address), true);
  assert.equal(event(receipt, 'TeacherApproved').args.teacher, address);
});

test('student and teacher cannot grant teacher permissions', async () => {
  for (const actor of [student, teacher]) {
    const address = await actor.getAddress();
    await expectRevert(() => contract.connect(actor).approveTeacher.staticCall(address), 'UnauthorizedAdmin', [address]);
    assert.equal(await contract.approvedTeachers(address), false);
  }
});

test('admin cannot approve zero address or approve an existing teacher twice', async () => {
  await expectRevert(() => contract.approveTeacher.staticCall(ZeroAddress), 'InvalidTeacherAddress');
  const address = await teacher.getAddress();
  await mined(contract.approveTeacher(address));
  await expectRevert(() => contract.approveTeacher.staticCall(address), 'TeacherAlreadyApproved', [address]);
  assert.equal(await contract.approvedTeachers(address), true);
});

test('only admin can open and close evaluation, with matching events', async () => {
  const opened = await mined(contract.toggleEvaluation());
  assert.equal(await contract.evaluationOpen(), true);
  assert.equal(event(opened, 'EvaluationStatusChanged').args.evaluationOpen, true);
  await mined(contract.approveTeacher(await teacher.getAddress()));
  for (const actor of [student, teacher]) {
    await expectRevert(() => contract.connect(actor).toggleEvaluation.staticCall(), 'UnauthorizedAdmin', [await actor.getAddress()]);
  }
  assert.equal(await contract.evaluationOpen(), true);
  const closed = await mined(contract.toggleEvaluation());
  assert.equal(await contract.evaluationOpen(), false);
  assert.equal(event(closed, 'EvaluationStatusChanged').args.evaluationOpen, false);
});

test('unapproved wallets including admin cannot create courses', async () => {
  for (const actor of [admin, teacher, student]) {
    await expectRevert(() => contract.connect(actor).createCourse.staticCall('Blockchain'), 'TeacherNotApproved', [await actor.getAddress()]);
  }
  assert.equal(await contract.courseCount(), 0n);
});

test('approved teacher creates a Vietnamese course with correct ownership, ID and zero scores', async () => {
  const address = await teacher.getAddress();
  await mined(contract.approveTeacher(address));
  const name = 'Công nghệ Blockchain';
  const receipt = await mined(contract.connect(teacher).createCourse(name));
  assert.equal(await contract.courseCount(), 1n);
  const course = await contract.courses(0);
  assert.deepEqual([...course], [name, address, true, 0n, 0n]);
  const created = event(receipt, 'CourseCreated');
  assert.deepEqual([...created.args], [0n, name, address]);
  assert.equal(await contract.evaluationOpen(), false);
});

test('course IDs increase across teachers, preserve older courses, and ignore evaluation gate', async () => {
  for (const actor of [teacher, otherTeacher]) await mined(contract.approveTeacher(await actor.getAddress()));
  await mined(contract.connect(teacher).createCourse('Lớp thứ nhất'));
  await mined(contract.toggleEvaluation());
  await mined(contract.connect(otherTeacher).createCourse('Lớp thứ hai'));
  await mined(contract.connect(teacher).createCourse('Lớp thứ ba'));
  assert.equal(await contract.courseCount(), 3n);
  assert.equal((await contract.courses(0)).courseName, 'Lớp thứ nhất');
  assert.equal((await contract.courses(1)).teacher, await otherTeacher.getAddress());
  assert.equal((await contract.courses(2)).teacher, await teacher.getAddress());
  assert.equal((await contract.courses(3)).exists, false);
});

test('empty, whitespace-only and oversized names revert without consuming a course ID', async () => {
  await mined(contract.approveTeacher(await teacher.getAddress()));
  for (const name of ['', '   ', '\t\n\r ', 'a'.repeat(481), 'ệ'.repeat(161)]) {
    await expectRevert(() => contract.connect(teacher).createCourse.staticCall(name), 'InvalidCourseName');
  }
  assert.equal(await contract.courseCount(), 0n);
  assert.equal((await contract.courses(0)).exists, false);
});

test('UTF-8 names exactly at the byte limit are accepted', async () => {
  await mined(contract.approveTeacher(await teacher.getAddress()));
  const name = 'ệ'.repeat(160);
  assert.equal(Buffer.byteLength(name, 'utf8'), 480);
  await mined(contract.connect(teacher).createCourse(name));
  assert.equal((await contract.courses(0)).courseName, name);
});

test('a failed unauthorized transaction is mined with no permission changes', async () => {
  const writer = contract.connect(student);
  const transaction = await writer.approveTeacher(await teacher.getAddress(), { gasLimit: 200000 });
  await assert.rejects(() => transaction.wait(), error => {
    assert.equal(error.code, 'CALL_EXCEPTION');
    assert.equal(error.receipt.status, 0);
    assert.equal(error.receipt.hash, transaction.hash);
    return true;
  });
  assert.equal(await contract.approvedTeachers(await teacher.getAddress()), false);
  assert.equal(await contract.courseCount(), 0n);
});
