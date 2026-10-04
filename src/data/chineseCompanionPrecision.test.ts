import assert from 'node:assert/strict';
import test from 'node:test';
import { chineseBookCompanions } from './chineseBookCompanions';
import { chineseCompanionTasks } from './chineseCompanionTasks';
import { companionWorkshops, getWorkshopFields, moveMaterial } from './chineseCompanionPrecision';

test('all 23 companion directory entries have an appropriate original workshop without adding a unit-five garden', () => {
  assert.equal(chineseBookCompanions.length, 23);
  assert.deepEqual(Object.keys(companionWorkshops).sort(), chineseBookCompanions.map(item => item.id).sort());
  assert.equal(chineseBookCompanions.filter(item => item.kind === 'garden').length, 7);
  assert.equal(companionWorkshops['book-u5-garden'], undefined);
  for (const item of chineseBookCompanions) {
    assert.ok(companionWorkshops[item.id].instruction.length > 10, item.id);
    assert.equal(getWorkshopFields(item.id, chineseCompanionTasks[item.id]).length, chineseCompanionTasks[item.id].fields.length, item.id);
    if (item.kind === 'garden') assert.match(companionWorkshops[item.id].note, /原创|原题|真实|待核/, item.id);
  }
});
test('moving a material preserves every original card and its associated student content, including bounds', () => {
  const original = [0, 1, 2];
  const drafts = ['起因', '关键动作', '结果'];
  const moved = moveMaterial(original, 1, -1);
  assert.deepEqual(moved.map(index => drafts[index]), ['关键动作', '起因', '结果']);
  assert.deepEqual(original, [0, 1, 2]);
  assert.deepEqual(moveMaterial(moved, 1, -1), moved);
  assert.deepEqual(moveMaterial(moved, 99, 1), moved);
  assert.deepEqual(moveMaterial(moved, 1, 1), original);
});
test('optional suggestions remain optional in both writing instructions and the actual paper checks', () => {
  const task = chineseCompanionTasks['book-u7-writing'];
  assert.match(companionWorkshops['book-u7-writing'].note, /建议栏可留空/);
  assert.match(task.fields[2].label, /选做/);
  assert.match(task.steps[2].detail, /建议可不写/);
  assert.match(task.paperChecks[2], /选做/);
});
