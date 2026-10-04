import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonPaperKey, readPaperChecks, savePaperCheck, type PaperCheck } from './chineseLessonPaper';
import { PROGRESS_STORAGE_KEY } from './progress';

class MemoryStorage {
  readonly values = new Map<string, string>();
  readonly reads: string[] = [];
  readonly writes: Array<{ key: string; value: string }> = [];
  getItem(key: string) { this.reads.push(key); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.writes.push({ key, value }); this.values.set(key, value); }
}

function check(index = 0, patch: Partial<PaperCheck> = {}): PaperCheck {
  return {
    courseId: 'cn-01', at: new Date(Date.UTC(2026, 9, 4, 0, index)).toISOString(), type: 'words',
    targetIds: ['cn-01-textbook_word-01', 'cn-01-textbook_word-02'],
    needsPractice: ['cn-01-textbook_word-02'], adult: false, ...patch,
  };
}

function stored(value: unknown) {
  const storage = new MemoryStorage();
  storage.values.set(lessonPaperKey, JSON.stringify(value));
  return storage;
}

test('missing, corrupt, inaccessible, or unsupported paper storage reads as an empty list without writing', () => {
  const empty = new MemoryStorage();
  assert.deepEqual(readPaperChecks(empty), []);
  for (const raw of ['{broken', '', 'null', '[]', '7', '{"version":2,"checks":[]}', '{"version":1,"checks":{}}']) {
    const storage = new MemoryStorage();
    storage.values.set(lessonPaperKey, raw);
    assert.deepEqual(readPaperChecks(storage), [], raw);
    assert.deepEqual(storage.writes, []);
  }
  assert.deepEqual(readPaperChecks({ getItem() { throw new Error('storage blocked'); } }), []);
  assert.deepEqual(empty.writes, []);
});

test('malformed records are filtered individually while valid paper evidence survives', () => {
  const valid = check();
  const invalid: unknown[] = [null, 4, 'record', {},
    { ...valid, courseId: 'en-01' }, { ...valid, courseId: '../cn-01' },
    { ...valid, at: 'not a date' }, { ...valid, at: 1728000000000 },
    { ...valid, targetIds: [] }, { ...valid, targetIds: 'word-id' }, { ...valid, targetIds: [valid.targetIds[0], 9] },
    { ...valid, needsPractice: null }, { ...valid, needsPractice: [3] },
    { ...valid, needsPractice: ['not-one-of-the-checked-targets'] },
  ];
  const storage = stored({ version: 1, checks: [...invalid, valid, ...invalid] });
  assert.deepEqual(readPaperChecks(storage), [valid]);
  assert.deepEqual(storage.writes, [], 'sanitizing a read must not autosave');
});

test('adult confirmation must be a Boolean and unknown evidence types cannot become paper checks', () => {
  const valid = check();
  for (const adult of ['true', 'false', 1, 0, null, undefined]) {
    assert.deepEqual(readPaperChecks(stored({ version: 1, checks: [{ ...valid, adult }] })), []);
  }
  for (const type of ['choice', 'writing', 'auto', 'WORDS', '', null, 7]) {
    assert.deepEqual(readPaperChecks(stored({ version: 1, checks: [{ ...valid, type }] })), []);
  }
  for (const type of ['words', 'memory', 'poem'] as const) {
    const record = check(0, { type });
    assert.deepEqual(readPaperChecks(stored({ version: 1, checks: [record] })), [record]);
  }
});

test('a target can be marked for practice only when it was part of that exact paper check', () => {
  const first = check(0, { targetIds: ['word-a'], needsPractice: ['word-a'] });
  const wrongGroup = check(1, { targetIds: ['word-b'], needsPractice: ['word-a'] });
  const noError = check(2, { targetIds: ['word-b'], needsPractice: [] });
  assert.deepEqual(readPaperChecks(stored({ version: 1, checks: [first, wrongGroup, noError] })), [first, noError]);
});

test('lesson and garden checks round trip without converting their evidence types', () => {
  const storage = new MemoryStorage();
  const rows = [check(0), check(1, { courseId: 'cn-garden-2', type: 'memory' }), check(2, { courseId: 'cn-04', type: 'poem', targetIds: ['shanxing'], needsPractice: [] })];
  for (const row of rows) savePaperCheck(storage, row);
  assert.deepEqual(readPaperChecks(storage), rows);
  assert.ok(storage.writes.every(write => write.key === lessonPaperKey));
});

test('reading history or changing an in-memory draft never writes before an explicit save', () => {
  const storage = new MemoryStorage();
  const draft = check();
  readPaperChecks(storage);
  draft.adult = true;
  draft.needsPractice = [];
  readPaperChecks(storage);
  assert.equal(storage.values.has(lessonPaperKey), false);
  assert.deepEqual(storage.writes, []);
  savePaperCheck(storage, draft);
  assert.equal(storage.writes.length, 1);
  assert.deepEqual(readPaperChecks(storage), [draft]);
});

test('self checks and later adult confirmations remain separate records, including their specific mistakes', () => {
  const storage = new MemoryStorage();
  const self = check(0, { adult: false });
  const adult = check(1, { adult: true, needsPractice: [] });
  savePaperCheck(storage, self);
  savePaperCheck(storage, adult);
  const history = readPaperChecks(storage);
  assert.equal(history.length, 2);
  assert.deepEqual(history[0], self, 'adult checking must not rewrite a previous self check');
  assert.deepEqual(history[1], adult);
  assert.equal(history.filter(row => row.adult).length, 1);
  assert.equal(history.filter(row => !row.adult).length, 1);
  assert.deepEqual(history[0].needsPractice, ['cn-01-textbook_word-02']);
});

test('reads and explicit saves keep the latest 100 valid checks in chronological append order', () => {
  const rows = Array.from({ length: 125 }, (_, index) => check(index));
  const storage = stored({ version: 1, checks: rows });
  assert.deepEqual(readPaperChecks(storage), rows.slice(-100));
  const newest = check(126, { adult: true });
  savePaperCheck(storage, newest);
  assert.deepEqual(readPaperChecks(storage), [...rows.slice(-99), newest]);
  assert.equal(JSON.parse(storage.values.get(lessonPaperKey)!).checks.length, 100);
});

test('invalid history is removed before enforcing the 100-record save limit', () => {
  const valid = Array.from({ length: 104 }, (_, index) => check(index));
  const invalid = { ...check(), adult: 'yes' };
  const storage = stored({ version: 1, checks: valid.flatMap(row => [invalid, row]) });
  const newest = check(105);
  savePaperCheck(storage, newest);
  assert.deepEqual(readPaperChecks(storage), [...valid.slice(-99), newest]);
});

test('paper evidence writes only its own key and never changes the game or Chinese pilot progress', () => {
  const storage = new MemoryStorage();
  const pilotKey = 'fanfan-word-adventure:chinese-pilot:v1';
  const unrelated = new Map([
    [PROGRESS_STORAGE_KEY, '{"version":1,"attempts":[{"id":"old-game-attempt","skill":"recall"}]}'],
    [pilotKey, '{"version":1,"attempts":[{"taskId":"old-pilot-task","confirmedBy":"parent"}]}'],
    ['fanfan-preferences', '{"sound":false}'],
  ]);
  for (const [key, value] of unrelated) storage.values.set(key, value);
  readPaperChecks(storage);
  savePaperCheck(storage, check(0));
  savePaperCheck(storage, check(1, { adult: true }));
  assert.deepEqual(new Set(storage.reads), new Set([lessonPaperKey]));
  assert.deepEqual(storage.writes.map(write => write.key), [lessonPaperKey, lessonPaperKey]);
  for (const [key, value] of unrelated) assert.equal(storage.values.get(key), value, `${key} was overwritten`);
});

test('a failed explicit save propagates its error instead of pretending paper evidence was persisted', () => {
  const failure = new Error('quota exhausted');
  assert.throws(() => savePaperCheck({ getItem: () => null, setItem: () => { throw failure; } }, check()), error => error === failure);
});
