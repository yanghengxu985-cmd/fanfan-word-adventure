import assert from 'node:assert/strict';
import test from 'node:test';
import { lexemes } from '../data/curriculum';
import { pilotTasks } from '../data/chinesePilot';
import { chineseCompanionTasks } from '../data/chineseCompanionTasks';
import { addPilotRound, emptyPilotProgress, type PilotAttempt } from './chinesePilotProgress';
import { lessonPaperKey, savePaperCheck, type PaperCheck } from './chineseLessonPaper';
import { createEmptyProgress, exportProgress, PROGRESS_STORAGE_KEY, recordAttempt } from './progress';
import { CHINESE_PILOT_STORAGE_KEY, CHINESE_VIEWS_STORAGE_KEY, SHANXING_PAPER_STORAGE_KEY, createLearningBackup,
  exportLearningBackup, getChinesePaperReviews, getChineseWordDueReviews, getForestLearningSummaries, loadChineseLearningRecords,
  parseLearningBackup, recordChineseLessonView, restoreLearningBackup, summarizeChineseLessons } from './chineseLearningRecords';

const time1 = new Date('2026-10-02T04:00:00.000Z');
const time2 = new Date('2026-10-03T04:00:00.000Z');
const now = new Date('2026-10-04T04:00:00.000Z');
const word = lexemes.find(item => item.courseId === 'cn-01' && item.kind === 'textbook_word')!;
const otherWord = lexemes.find(item => item.courseId === 'cn-01' && item.kind === 'textbook_word' && item.id !== word.id)!;
const ids = new Set(lexemes.map(item => item.id));
const writingTask = pilotTasks.find(item => item.courseId === 'cn-01' && item.skill === 'writing')!;
const readingTask = pilotTasks.find(item => item.courseId === 'cn-01' && item.skill === 'reading')!;

class MemoryStorage {
  readonly values = new Map<string, string>();
  readonly reads: string[] = [];
  readonly writes: string[] = [];
  failKey: string | null = null;
  getItem(key: string) { this.reads.push(key); return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    this.writes.push(key);
    if (this.failKey === key) { this.failKey = null; throw new Error('quota full'); }
    this.values.set(key, value);
  }
  removeItem(key: string) { this.writes.push(key); this.values.delete(key); }
}
function check(patch: Partial<PaperCheck> = {}): PaperCheck {
  return { courseId: 'cn-01', at: time1.toISOString(), type: 'words', targetIds: [word.id, otherWord.id], needsPractice: [word.id], adult: false, ...patch };
}
function pilotAttempt(patch: Partial<PilotAttempt> = {}): PilotAttempt {
  return { roundId: 'round-1', taskId: writingTask.taskId, courseId: writingTask.courseId, skill: writingTask.skill,
    at: time1.toISOString(), correct: false, assisted: false, confirmedBy: 'self', ...patch };
}
function populated() {
  const storage = new MemoryStorage();
  const progress = recordAttempt(createEmptyProgress(), { lexemeId: word.id, skill: 'meaning', correct: true, mode: 'selection' }, ids, time1);
  storage.values.set(PROGRESS_STORAGE_KEY, exportProgress(progress));
  storage.values.set(CHINESE_PILOT_STORAGE_KEY, JSON.stringify(addPilotRound(emptyPilotProgress(), [pilotAttempt()])));
  savePaperCheck(storage, check());
  storage.values.set(SHANXING_PAPER_STORAGE_KEY, JSON.stringify({ at: time2.toISOString(), adult: true, errors: ['glyph'] }));
  recordChineseLessonView('cn-01', { storage, now: time1 });
  storage.values.set('unrelated-project', 'preserve me');
  storage.values.set('fanfan-word-adventure:preferences:v1', '{"limit":8}');
  storage.writes.length = 0;
  return { storage, progress };
}

test('a full bundle round trip preserves each evidence store and leaves unrelated storage alone', () => {
  const { storage, progress } = populated();
  const original = new Map(storage.values);
  const backup = createLearningBackup(progress, storage, now);
  const parsed = parseLearningBackup(exportLearningBackup(backup), now);
  assert.equal(parsed.kind, 'bundle');
  const destination = new MemoryStorage();
  destination.values.set('unrelated-project', 'destination only');
  destination.values.set('fanfan-word-adventure:preferences:v1', '{"limit":6}');
  const restored = restoreLearningBackup(parsed, destination, now);
  assert.deepEqual(restored, progress);
  const reread = createLearningBackup(restored, destination, now);
  assert.deepEqual(reread, backup);
  assert.equal(destination.values.get('unrelated-project'), 'destination only');
  assert.equal(destination.values.get('fanfan-word-adventure:preferences:v1'), '{"limit":6}');
  assert.deepEqual(storage.values, original, 'export does not alter the source');
  assert.equal(storage.writes.length, 0);
});

test('legacy main-progress import changes only the main key, preserving every Chinese store', () => {
  const { storage } = populated();
  const previous = new Map(storage.values);
  const legacy = parseLearningBackup(exportProgress(createEmptyProgress()), now);
  assert.equal(legacy.kind, 'legacy');
  restoreLearningBackup(legacy, storage, now);
  assert.deepEqual(JSON.parse(storage.values.get(PROGRESS_STORAGE_KEY)!), createEmptyProgress());
  assert.deepEqual(storage.writes, [PROGRESS_STORAGE_KEY]);
  for (const [key, value] of previous) if (key !== PROGRESS_STORAGE_KEY) assert.equal(storage.values.get(key), value);
});

test('full-bundle absent stores remove only their explicit learning keys', () => {
  const { storage } = populated();
  const backup = createLearningBackup(createEmptyProgress(), new MemoryStorage(), now);
  restoreLearningBackup(parseLearningBackup(exportLearningBackup(backup), now), storage, now);
  for (const key of [CHINESE_PILOT_STORAGE_KEY, lessonPaperKey, SHANXING_PAPER_STORAGE_KEY, CHINESE_VIEWS_STORAGE_KEY]) assert.equal(storage.values.has(key), false);
  assert.equal(storage.values.get('unrelated-project'), 'preserve me');
  assert.equal(storage.values.get('fanfan-word-adventure:preferences:v1'), '{"limit":8}');
});

test('tampered payloads are all rejected before any restore write', () => {
  const { storage, progress } = populated();
  const backup = createLearningBackup(progress, storage, now);
  const variants: unknown[] = [
    { ...backup, version: 2 }, { ...backup, createdAt: '2099-01-01T00:00:00.000Z' },
    { ...backup, progress: { version: 1, attempts: [{ ...progress.attempts[0], lexemeId: 'non-existent' }] } },
    { ...backup, chinese: { ...backup.chinese, pilot: { schemaVersion: 1, attempts: [pilotAttempt({ taskId: 'invented' })] } } },
    { ...backup, chinese: { ...backup.chinese, paper: { version: 1, checks: [check({ needsPractice: ['outside-targets'] })] } } },
    { ...backup, chinese: { ...backup.chinese, shanxing: { at: time1.toISOString(), adult: 'true', errors: [] } } },
    { ...backup, chinese: { ...backup.chinese, views: { version: 1, lessons: [{ courseId: 'cn-99', firstViewedAt: time1.toISOString(), lastViewedAt: time1.toISOString(), visits: 1 }] } } },
    { ...backup, chinese: { paper: null } },
  ];
  const original = new Map(storage.values);
  for (const value of variants) {
    assert.throws(() => parseLearningBackup(JSON.stringify(value), now));
    assert.throws(() => restoreLearningBackup({ kind: 'bundle', backup: value, progress } as never, storage, now));
    assert.deepEqual(storage.values, original);
    assert.equal(storage.writes.length, 0);
  }
});

test('unsafe keys, excessive size, duplicate views and impossible evidence are rejected', () => {
  assert.throws(() => parseLearningBackup('{"version":1,"attempts":[],"__proto__":{}}', now));
  assert.throws(() => parseLearningBackup(' '.repeat(10_000_001), now), /10 MB/);
  const { storage, progress } = populated();
  const backup = createLearningBackup(progress, storage, now);
  const row = backup.chinese.views!.lessons[0];
  for (const views of [{ version: 1, lessons: [row, row] }, { version: 1, lessons: [{ ...row, visits: -1 }] },
    { version: 1, lessons: [{ ...row, lastViewedAt: '2099-01-01T00:00:00.000Z' }] }]) {
    assert.throws(() => parseLearningBackup(JSON.stringify({ ...backup, chinese: { ...backup.chinese, views } }), now));
  }
  assert.throws(() => parseLearningBackup(JSON.stringify({ ...backup, chinese: { ...backup.chinese,
    pilot: { schemaVersion: 1, attempts: [pilotAttempt({ confirmedBy: 'auto' })] } } }), now));
  assert.throws(() => parseLearningBackup(JSON.stringify({ ...backup, chinese: { ...backup.chinese,
    shanxing: { at: time1.toISOString(), adult: true, errors: ['glyph', 'glyph'] } } }), now));
});

test('a storage failure halfway through a full restore rolls back existing and newly-created values', () => {
  const { storage, progress } = populated();
  const incoming = parseLearningBackup(exportLearningBackup(createLearningBackup(progress, storage, now)), now);
  const destination = new MemoryStorage();
  destination.values.set(PROGRESS_STORAGE_KEY, '{"version":1,"attempts":[]}');
  destination.values.set(lessonPaperKey, '{"version":1,"checks":[]}');
  destination.values.set('unrelated-project', 'untouched');
  const original = new Map(destination.values);
  destination.failKey = lessonPaperKey;
  assert.throws(() => restoreLearningBackup(incoming, destination, now), /原记录已恢复/);
  assert.deepEqual(destination.values, original);
  assert.ok(destination.writes.every(key => [PROGRESS_STORAGE_KEY, CHINESE_PILOT_STORAGE_KEY, lessonPaperKey, SHANXING_PAPER_STORAGE_KEY, CHINESE_VIEWS_STORAGE_KEY].includes(key)));
});

test('teacher views neither read nor write, while student views are separated from achievement', () => {
  const storage = new MemoryStorage();
  assert.equal(recordChineseLessonView('cn-01', { teacher: true, storage, now }), false);
  assert.deepEqual(storage.reads, []); assert.deepEqual(storage.writes, []);
  recordChineseLessonView('cn-01', { storage, now });
  const records = loadChineseLearningRecords(createEmptyProgress(), storage, now);
  const summary = summarizeChineseLessons(records).find(item => item.courseId === 'cn-01')!;
  assert.equal(summary.viewed, true);
  assert.equal(summary.practiceAttempts, 0); assert.equal(summary.paperChecks, 0);
  assert.equal('mastered' in summary, false); assert.equal('status' in summary, false);
  assert.deepEqual(getForestLearningSummaries(records, now)['cn-01'], { browsed: true, practiced: 0, paperChecks: 0, due: 0 });
});

test('student view records accept all 23 companion IDs and avoid duplicate same-instant views', () => {
  const storage = new MemoryStorage();
  for (const id of Object.keys(chineseCompanionTasks)) assert.equal(recordChineseLessonView(id, { storage, now }), true, id);
  const id = 'book-u1-speaking';
  assert.equal(recordChineseLessonView(id, { storage, now }), true);
  assert.equal(JSON.parse(storage.values.get(CHINESE_VIEWS_STORAGE_KEY)!).lessons.find((item: { courseId: string }) => item.courseId === id).visits, 1);
  assert.equal(recordChineseLessonView('cn-99', { storage, now }), false);
  const summaries = summarizeChineseLessons(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(summaries.length, 49);
  assert.equal(summaries.filter(item => item.viewed).length, 23);
  assert.equal(getForestLearningSummaries(loadChineseLearningRecords(createEmptyProgress(), storage, now), now)['book-u1-speaking'].browsed, true);
});

test('a corrupt original store is preserved and surfaced, never overwritten by browsing or export', () => {
  const storage = new MemoryStorage();
  storage.values.set(CHINESE_VIEWS_STORAGE_KEY, '{corrupt');
  assert.equal(recordChineseLessonView('cn-01', { storage, now }), false);
  assert.equal(storage.values.get(CHINESE_VIEWS_STORAGE_KEY), '{corrupt');
  assert.equal(storage.writes.length, 0);
  assert.equal(loadChineseLearningRecords(createEmptyProgress(), storage, now).warnings.length, 1);
  assert.throws(() => createLearningBackup(createEmptyProgress(), storage, now));
});

test('all summary reads remain pure and keep word selection, self paper and adult paper distinct', () => {
  const { storage, progress } = populated();
  savePaperCheck(storage, check({ at: time2.toISOString(), adult: true, needsPractice: [] }));
  storage.writes.length = 0;
  const records = loadChineseLearningRecords(progress, storage, now);
  const summary = summarizeChineseLessons(records).find(item => item.courseId === 'cn-01')!;
  assert.equal(summary.practiceAttempts, 1);
  assert.equal(summary.selfChecks, 2, 'one current paper check and one legacy paper check');
  assert.equal(summary.adultChecks, 1);
  assert.equal(summary.adultChecksWithoutErrors, 1);
  assert.equal(summary.paperChecks, 3);
  assert.equal(summary.legacyPilotAttempts, 1);
  assert.equal(summary.pendingPaper, 1, 'the separate pilot handwriting error survives a generic word check');
  assert.equal(storage.writes.length, 0);
});

test('paper reviews deduplicate exact targets and remove only independently rechecked targets in the latest group', () => {
  const storage = new MemoryStorage();
  savePaperCheck(storage, check({ needsPractice: [word.id, otherWord.id] }));
  savePaperCheck(storage, check({ at: time2.toISOString(), targetIds: [word.id], needsPractice: [] }));
  const reviews = getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(reviews.length, 1); assert.equal(reviews[0].targetId, otherWord.id);
  assert.equal(reviews[0].label, otherWord.text);
  assert.equal(reviews[0].wordsHref, '#/chinese-lesson/cn-01/words');
  assert.equal(reviews[0].paperHref, '#/chinese-lesson/cn-01/paper');
  savePaperCheck(storage, check({ at: now.toISOString(), needsPractice: [word.id] }));
  const newer = getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(newer.length, 1); assert.equal(newer[0].targetId, word.id);
});

test('different paper evidence types cannot erase each other and newest checks are listed first', () => {
  const storage = new MemoryStorage();
  savePaperCheck(storage, check({ needsPractice: [word.id] }));
  savePaperCheck(storage, check({ at: time2.toISOString(), type: 'memory', needsPractice: [] }));
  savePaperCheck(storage, check({ at: now.toISOString(), targetIds: [otherWord.id], needsPractice: [otherWord.id] }));
  const reviews = getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(reviews.length, 2);
  assert.equal(reviews[0].targetId, otherWord.id); assert.equal(reviews[1].targetId, word.id);
});

test('a pilot choice or self-confirmed handwriting success never clears an adult-confirmed handwriting error', () => {
  const storage = new MemoryStorage();
  let pilot = addPilotRound(emptyPilotProgress(), [pilotAttempt({ confirmedBy: 'parent' })]);
  pilot = addPilotRound(pilot, [pilotAttempt({ roundId: 'round-2', taskId: readingTask.taskId, skill: readingTask.skill, confirmedBy: 'auto', correct: true, at: time2.toISOString() })]);
  pilot = addPilotRound(pilot, [pilotAttempt({ roundId: 'round-3', confirmedBy: 'self', correct: true, at: time2.toISOString() })]);
  storage.values.set(CHINESE_PILOT_STORAGE_KEY, JSON.stringify(pilot));
  assert.equal(getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now)).length, 1);
  pilot = addPilotRound(pilot, [pilotAttempt({ roundId: 'round-4', confirmedBy: 'teacher', correct: true, at: now.toISOString() })]);
  storage.values.set(CHINESE_PILOT_STORAGE_KEY, JSON.stringify(pilot));
  assert.equal(getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now)).length, 0);
});

test('legacy Shanxing and generic poem checks resolve the same poem according to the most recent actual check', () => {
  const storage = new MemoryStorage();
  storage.values.set(SHANXING_PAPER_STORAGE_KEY, JSON.stringify({ at: time1.toISOString(), adult: true, errors: ['missing', 'punctuation'] }));
  let reviews = getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(reviews.length, 1); assert.match(reviews[0].label, /漏字漏句、标点/);
  savePaperCheck(storage, check({ courseId: 'cn-04', type: 'poem', targetIds: ['shanxing'], needsPractice: [], at: time2.toISOString(), adult: true }));
  reviews = getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now));
  assert.equal(reviews.length, 0);
  storage.values.set(SHANXING_PAPER_STORAGE_KEY, JSON.stringify({ at: now.toISOString(), adult: false, errors: ['glyph'] }));
  assert.equal(getChinesePaperReviews(loadChineseLearningRecords(createEmptyProgress(), storage, now)).length, 1);
});

test('blocked storage remains visible, and restoring cannot falsely report success', () => {
  const records = loadChineseLearningRecords(createEmptyProgress(), null, now);
  assert.equal(records.warnings.length, 1);
  assert.equal(recordChineseLessonView('cn-01', { storage: null, now }), false);
  const destination = new MemoryStorage();
  destination.setItem = () => { throw new Error('persistent failure'); };
  assert.throws(() => restoreLearningBackup(parseLearningBackup(exportProgress(createEmptyProgress()), now), destination, now), /保存失败/);
});

test('inaccessible export storage cannot silently become an empty full backup that would erase Chinese records', () => {
  const { storage, progress } = populated();
  const original = new Map(storage.values);
  assert.throws(() => createLearningBackup(progress, null, now), /未生成全记录备份/);
  assert.throws(() => createLearningBackup(progress, { getItem() { throw new Error('storage inaccessible'); } }, now), /storage inaccessible/);
  assert.deepEqual(storage.values, original);
  assert.equal(storage.writes.length, 0);
  // An accessible browser with genuinely absent keys can still export an empty, intentional snapshot.
  const empty = createLearningBackup(createEmptyProgress(), new MemoryStorage(), now);
  assert.deepEqual(empty.chinese, { pilot: null, paper: null, shanxing: null, views: null });
});

test('historical Chinese due reviews retain the exact skill and link back to the lesson without English mixing', () => {
  const english = lexemes.find(item => item.subject === 'english' && item.kind === 'english_word')!;
  let progress = recordAttempt(createEmptyProgress(), { lexemeId: word.id, skill: 'meaning', correct: true, mode: 'selection' }, ids, time1);
  progress = recordAttempt(progress, { lexemeId: word.id, skill: 'writing', correct: false, mode: 'writing', confirmedBy: 'self' }, ids, time1);
  progress = recordAttempt(progress, { lexemeId: english.id, skill: 'meaning', correct: true, mode: 'selection' }, ids, time1);
  const records = loadChineseLearningRecords(progress, new MemoryStorage(), now);
  const due = getChineseWordDueReviews(records, now);
  assert.equal(due.length, 2);
  assert.ok(due.every(item => item.lexemeId === word.id));
  assert.equal(due.find(item => item.skill === 'meaning')!.href, '#/chinese-lesson/cn-01/words');
  assert.equal(due.find(item => item.skill === 'writing')!.href, '#/chinese-lesson/cn-01/paper');
  assert.equal(getForestLearningSummaries(records, now)['cn-01'].due, 2);
});

test('garden history maps to one canonical companion without counting its due reviews twice', () => {
  const gardenWord = lexemes.find(item => item.courseId === 'cn-garden-3')!;
  const storage = new MemoryStorage();
  recordChineseLessonView('book-u3-garden', { storage, now: time2 });
  const progress = recordAttempt(createEmptyProgress(), { lexemeId: gardenWord.id, skill: 'meaning', correct: false, mode: 'selection' }, ids, time1);
  savePaperCheck(storage, check({ courseId: 'cn-garden-3', targetIds: [gardenWord.id], needsPractice: [gardenWord.id] }));
  const records = loadChineseLearningRecords(progress, storage, now);
  const summaries = getForestLearningSummaries(records, now);
  assert.equal('cn-garden-3' in summaries, false);
  assert.deepEqual(summaries['book-u3-garden'], { browsed: true, practiced: 1, paperChecks: 1, due: 2 });
  assert.equal(Object.values(summaries).reduce((sum, item) => sum + item.due, 0), 2);
  assert.equal(getChinesePaperReviews(records)[0].wordsHref, '#/chinese-companion/book-u3-garden/words');
  assert.equal(getChineseWordDueReviews(records, now)[0].href, '#/chinese-companion/book-u3-garden/words');
});

test('an exact paper word recheck updates only the historical writing reminder for one local day', () => {
  const storage = new MemoryStorage();
  let progress = recordAttempt(createEmptyProgress(), { lexemeId: word.id, skill: 'writing', correct: false, mode: 'writing', confirmedBy: 'self' }, ids, time1);
  progress = recordAttempt(progress, { lexemeId: word.id, skill: 'meaning', correct: false, mode: 'selection' }, ids, time1);
  progress = recordAttempt(progress, { lexemeId: word.id, skill: 'recall', correct: false, mode: 'recall' }, ids, time1);
  const original = structuredClone(progress);
  for (const adult of [false, true]) {
    savePaperCheck(storage, check({ at: now.toISOString(), targetIds: [word.id], needsPractice: [], adult }));
    const records = loadChineseLearningRecords(progress, storage, now);
    const today = getChineseWordDueReviews(records, now);
    assert.equal(today.some(item => item.skill === 'writing'), false);
    assert.deepEqual(today.map(item => item.skill).sort(), ['meaning', 'recall']);
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const writing = getChineseWordDueReviews(records, tomorrow).find(item => item.skill === 'writing')!;
    assert.ok(writing); assert.equal(writing.nextReviewDays, 1);
    assert.equal(writing.paperRecheckedAt, now.toISOString());
    assert.equal(writing.paperRecheckedBy, adult ? 'adult' : 'self');
    assert.equal(writing.status, 'learning'); assert.equal(writing.independentDays, 0);
    assert.deepEqual(progress, original);
    assert.equal(getForestLearningSummaries(records, now)['cn-01'].due, 2);
  }
});

test('a wrong target, wrong course, non-word paper check, or stale paper cannot postpone historical writing', () => {
  const progress = recordAttempt(createEmptyProgress(), { lexemeId: word.id, skill: 'writing', correct: false, mode: 'writing', confirmedBy: 'parent' }, ids, time2);
  for (const paper of [check({ at: now.toISOString(), targetIds: [otherWord.id], needsPractice: [] }),
    check({ at: now.toISOString(), courseId: 'cn-02', needsPractice: [] }),
    check({ at: now.toISOString(), type: 'memory', needsPractice: [] }), check({ at: time1.toISOString(), needsPractice: [] })]) {
    const storage = new MemoryStorage(); savePaperCheck(storage, paper);
    assert.equal(getChineseWordDueReviews(loadChineseLearningRecords(progress, storage, now), now)[0].skill, 'writing');
  }
});

test('a paper error stays immediately actionable even while its historical writing reminder waits until tomorrow', () => {
  const progress = recordAttempt(createEmptyProgress(), { lexemeId: word.id, skill: 'writing', correct: false, mode: 'writing', confirmedBy: 'self' }, ids, time1);
  const storage = new MemoryStorage(); savePaperCheck(storage, check({ at: now.toISOString(), targetIds: [word.id], needsPractice: [word.id] }));
  const records = loadChineseLearningRecords(progress, storage, now);
  assert.equal(getChineseWordDueReviews(records, now).length, 0);
  assert.equal(getChinesePaperReviews(records).length, 1);
  assert.equal(getForestLearningSummaries(records, now)['cn-01'].due, 1);
});

test('real character memory writing renews only that character writing reminder, while poem checks cannot', () => {
  const character = lexemes.find(item => item.courseId === 'cn-01' && item.kind === 'writing_character')!;
  let progress = recordAttempt(createEmptyProgress(), { lexemeId: character.id, skill: 'writing', correct: false, mode: 'writing', confirmedBy: 'self' }, ids, time1);
  progress = recordAttempt(progress, { lexemeId: character.id, skill: 'recall', correct: false, mode: 'recall' }, ids, time1);
  const storage = new MemoryStorage();
  savePaperCheck(storage, check({ at: now.toISOString(), type: 'memory', targetIds: [character.id], needsPractice: [], adult: true }));
  const records = loadChineseLearningRecords(progress, storage, now);
  assert.deepEqual(getChineseWordDueReviews(records, now).map(item => item.skill), ['recall']);
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const writing = getChineseWordDueReviews(records, tomorrow).find(item => item.skill === 'writing')!;
  assert.equal(writing.nextReviewDays, 1); assert.equal(writing.independentDays, 0); assert.equal(writing.status, 'learning');
  const poemOnly = new MemoryStorage();
  savePaperCheck(poemOnly, check({ at: now.toISOString(), type: 'poem', targetIds: [character.id], needsPractice: [], adult: true }));
  assert.equal(getChineseWordDueReviews(loadChineseLearningRecords(progress, poemOnly, now), now).filter(item => item.skill === 'writing').length, 1);
});
