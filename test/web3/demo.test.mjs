import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createDemoSchool, applyDemoTransaction, demoSnapshot, demoWallets as wallets } from '../../src/data/demoSchool.js';

test('empty demo follows admin approval, class creation, membership, enrollment and one review', () => {
  let model = createDemoSchool(false);
  assert.equal(demoSnapshot(model, wallets.teacher).role, 'student');
  assert.throws(() => applyDemoTransaction(model, wallets.teacher, 'create', 'Blockchain'), /chưa được phê duyệt/);
  model = applyDemoTransaction(model, wallets.admin, 'approve', wallets.teacher);
  model = applyDemoTransaction(model, wallets.teacher, 'create', 'Blockchain');
  assert.throws(() => applyDemoTransaction(model, wallets.student, 'join', { courseId: '0' }), /chưa được cấp quyền/);
  assert.throws(() => applyDemoTransaction(model, wallets.student, 'grant', { courseId: '0', wallets: [wallets.student] }), /Chỉ Admin/);
  model = applyDemoTransaction(model, wallets.teacher, 'grant', { courseId: '0', wallets: [wallets.student] });
  model = applyDemoTransaction(model, wallets.student, 'join', { courseId: '0' });
  const input = { courseId: '0', score: 5, comment: 'Nội dung giảng dạy rõ ràng và hữu ích.' };
  assert.throws(() => applyDemoTransaction(model, wallets.student, 'review', input), /đang đóng/);
  model = applyDemoTransaction(model, wallets.admin, 'toggle', false);
  const before = structuredClone(model);
  model = applyDemoTransaction(model, wallets.student, 'review', input);
  assert.equal(before.courses[0].reviewCount, 0n);
  const snapshot = demoSnapshot(model, wallets.student);
  assert.equal(snapshot.courses[0].evaluated, true); assert.equal(snapshot.courses[0].score, null);
  assert.equal(snapshot.resultsVisible, false);
  model = applyDemoTransaction(model, wallets.admin, 'toggle', true);
  assert.equal(demoSnapshot(model, wallets.student).courses[0].score, 5);
  model = applyDemoTransaction(model, wallets.admin, 'toggle', false);
  assert.deepEqual(model.courses[0].comments, [input.comment]);
  assert.throws(() => applyDemoTransaction(model, wallets.student, 'review', input), /đã đánh giá/);
});
test('seeded demo has consistent scores and comments, and an ineligible second class', () => {
  const model = createDemoSchool();
  const snapshot = demoSnapshot(model, wallets.student);
  assert.equal(model.courses[0].comments.length, Number(demoSnapshot(model, wallets.teacher).courses[0].reviewCount));
  assert.equal(snapshot.courses[0].comments, undefined);
  assert.equal(snapshot.courses[0].allowed, true); assert.equal(snapshot.courses[1].allowed, false);
});
