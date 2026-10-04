import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyProgress, createProgressStore, exportProgress, getDueReviews,
  getLexemeState, getSkillState, importProgress, localDateKey, recordAttempt,
  type AttemptInput, type Progress,
} from './progress';

const ids = new Set(['en-u1-hello', 'zh-l1-小学']);
const day1 = new Date('2026-10-03T08:00:00.000Z');
const day2 = new Date('2026-10-04T08:00:00.000Z');
const day3 = new Date('2026-10-05T08:00:00.000Z');
const input: AttemptInput = { lexemeId: 'en-u1-hello', skill: 'meaning', correct: true, mode: 'recall', sourceEvidence: 'reviewed-gloss:hello' };
const add = (progress: Progress, patch: Partial<AttemptInput> = {}, now = day1) => recordAttempt(progress, { ...input, ...patch }, ids, now);

test('same-day correct recall stays passed; hints never add independent evidence', () => {
  let progress = add(createEmptyProgress());
  progress = add(progress);
  progress = add(progress, { assisted: true });
  const state = getSkillState(progress, input.lexemeId, 'meaning', day1);
  assert.equal(state.status, 'passed');
  assert.equal(state.independentDays, 1);
  assert.equal(state.nextReviewDays, 1);
  const assisted = getSkillState(add(createEmptyProgress(), { assisted: true }), input.lexemeId, 'meaning', day1);
  assert.equal(assisted.status, 'learning');
  assert.equal(assisted.independentDays, 0);
});

test('two local dates of independent recall stabilize only the practiced skill', () => {
  const progress = add(add(createEmptyProgress()), {}, day2);
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day2).status, 'stable');
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day2).nextReviewDays, 3);
  assert.equal(getSkillState(progress, input.lexemeId, 'spelling', day2).status, 'unseen');
  assert.equal(getLexemeState(progress, input.lexemeId, day2).stableSkills, 1);
  assert.equal(getLexemeState(progress, input.lexemeId, day2, ['meaning', 'spelling']).status, 'passed');
  assert.equal(getLexemeState(progress, input.lexemeId, day2, ['meaning']).status, 'stable');
});

test('review preserves the original skill and clears its current due date', () => {
  let progress = add(createEmptyProgress(), { mode: 'selection' });
  assert.equal(getDueReviews(progress, ids, day2)[0].skill, 'meaning');
  // A no-options meaning review is meaning evidence, not a different recall skill.
  progress = add(progress, { skill: 'meaning', mode: 'recall' }, day2);
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day2).isDue, false);
  assert.equal(getSkillState(progress, input.lexemeId, 'recall', day2).status, 'unseen');
  progress = add(progress, { skill: 'meaning', mode: 'recall' }, day3);
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day3).status, 'stable');
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day3).nextReviewDays, 3);
});

test('choices on different dates cannot create stable recall', () => {
  const progress = add(add(createEmptyProgress(), { mode: 'selection' }), { mode: 'selection' }, day2);
  const state = getSkillState(progress, input.lexemeId, 'meaning', day2);
  assert.equal(state.status, 'passed');
  assert.equal(state.independentDays, 0);
  assert.equal(state.nextReviewDays, 1);
});

test('hints and repeated choices do not postpone an existing independent review', () => {
  let progress = add(add(createEmptyProgress()), {}, day2);
  const before = getSkillState(progress, input.lexemeId, 'meaning', day2);
  progress = add(progress, { assisted: true }, day3);
  progress = add(progress, { mode: 'selection' }, day3);
  const after = getSkillState(progress, input.lexemeId, 'meaning', day3);
  assert.equal(after.dueAt, before.dueAt);
  assert.equal(after.independentDays, 2);
});

test('review intervals advance through distinct independent days to 1/3/7/14', () => {
  let progress = createEmptyProgress();
  [1, 3, 7, 14, 14].forEach((interval, index) => {
    const date = new Date(day1.getTime() + index * 24 * 60 * 60 * 1000);
    progress = add(progress, {}, date);
    assert.equal(getSkillState(progress, input.lexemeId, 'meaning', date).nextReviewDays, interval);
  });
});

test('wrong answer resets evidence for this skill, not another skill', () => {
  let progress = add(add(createEmptyProgress()), {}, day2);
  progress = add(progress, { skill: 'spelling', mode: 'spelling' });
  progress = add(progress, { skill: 'spelling', mode: 'spelling' }, day2);
  progress = add(progress, { correct: false }, day3);
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day3).status, 'learning');
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', day3).nextReviewDays, 1);
  assert.equal(getSkillState(progress, input.lexemeId, 'spelling', day3).status, 'stable');
});

test('writing needs parent or teacher confirmation for independent evidence', () => {
  let progress = add(createEmptyProgress(), { skill: 'writing', mode: 'writing', confirmedBy: 'self' });
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day1).status, 'learning');
  progress = add(progress, { skill: 'writing', mode: 'writing', confirmedBy: 'self' }, day2);
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day2).status, 'learning');
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day2).successfulDays, 0);
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day2).independentDays, 0);
  progress = add(progress, { skill: 'writing', mode: 'writing', confirmedBy: 'parent' }, day2);
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day2).status, 'passed');
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day2).independentDays, 1);
  progress = add(progress, { skill: 'writing', mode: 'writing', confirmedBy: 'teacher' }, day3);
  assert.equal(getSkillState(progress, input.lexemeId, 'writing', day3).status, 'stable');
});

test('cancelled or missing audio creates no wrong attempt', () => {
  const empty = createEmptyProgress();
  assert.equal(add(empty, { skill: 'listening', correct: null }), empty);
  assert.equal(getDueReviews(empty, ids, day3).length, 0);
});

test('date key is a local calendar date, including near midnight', () => {
  const localMidnight = new Date(2026, 9, 3, 0, 15, 0);
  assert.equal(localDateKey(localMidnight), '2026-10-03');
  const progress = add(createEmptyProgress(), {}, localMidnight);
  assert.equal(progress.attempts[0].localDate, '2026-10-03');
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', new Date(2026, 9, 3, 23, 59)).isDue, false);
  assert.equal(getSkillState(progress, input.lexemeId, 'meaning', new Date(2026, 9, 4, 0, 0)).isDue, true);
});

test('export/import preserves validated evidence', () => {
  const progress = add(createEmptyProgress());
  assert.deepEqual(importProgress(exportProgress(progress), ids, day1), progress);
});

test('invalid JSON, versions, unknown IDs, future timestamps and unsafe keys are rejected', () => {
  assert.throws(() => importProgress('{', ids, day1), /JSON/);
  assert.throws(() => importProgress('{"version":2,"attempts":[]}', ids, day1), /版本/);
  assert.throws(() => importProgress('{"version":1,"attempts":[],"__proto__":{"x":1}}', ids, day1), /不安全/);
  const progress = add(createEmptyProgress());
  assert.throws(() => importProgress(exportProgress(progress), new Set(['other']), day1), /词库之外/);
  assert.throws(() => add(createEmptyProgress(), { timestamp: day2.toISOString() }, day1), /未来/);
  const future = structuredClone(progress);
  future.attempts[0].timestamp = day2.toISOString();
  assert.throws(() => importProgress(exportProgress(future), ids, day1), /未来/);
  const impossible = structuredClone(progress);
  impossible.attempts[0].timestamp = '2026-02-30T08:00:00.000Z';
  assert.throws(() => importProgress(exportProgress(impossible), ids, day3), /不存在/);
});

test('bad import or unavailable persistent storage never silently destroys the in-memory progress', () => {
  const map = new Map<string, string>();
  const store = createProgressStore(ids, { getItem: (key) => map.get(key) ?? null, setItem: () => { throw new Error('quota'); } });
  const progress = add(createEmptyProgress());
  store.save(progress, day1);
  assert.equal(store.availability, 'memory');
  assert.match(store.warning!, /导出备份/);
  assert.deepEqual(store.load(day1), progress);
  assert.throws(() => store.save({ version: 2, attempts: [] } as unknown as Progress, day1), /版本/);
  assert.deepEqual(store.load(day1), progress);
});

test('a clock rollback during load warns and preserves the original future-dated backup', () => {
  const futureBackup = exportProgress(add(createEmptyProgress(), {}, day2));
  const map = new Map<string, string>([['fanfan-word-adventure:progress:v1', futureBackup]]);
  const store = createProgressStore(ids, {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value); },
  });
  assert.equal(store.load(day1).attempts.length, 0);
  assert.match(store.warning!, /未来.*原始备份未被覆盖/);
  assert.equal(store.availability, 'memory');
  store.save(add(createEmptyProgress()), day1);
  assert.equal(map.get('fanfan-word-adventure:progress:v1'), futureBackup);
  assert.equal(store.load(day1).attempts.length, 1);
});
