import test from 'node:test';
import assert from 'node:assert/strict';
import { pilotLessons, pilotTasks, selectPilotRound, wholePoemItems } from '../data/chinesePilot';
import {
  addPilotRound, emptyPilotProgress, importPilotProgress, independentlyWritten,
  loadPilotProgress, pilotReviews, savePilotProgress,
  type PilotAttempt, type PilotProgress,
} from './chinesePilotProgress';

const readingTask = pilotTasks.find(task => task.courseId === 'cn-01' && task.skill === 'reading')!;
const glyphTask = pilotTasks.find(task => task.courseId === 'cn-01' && task.skill === 'glyph')!;
const writingTask = pilotTasks.find(task => task.courseId === 'cn-01' && task.skill === 'writing')!;
const recitationTask = pilotTasks.find(task => task.skill === 'recitation')!;
const dictationTask = pilotTasks.find(task => task.skill === 'dictation')!;
const localDay = (day: number, hour = 12, minute = 0) => new Date(2026, 9, day, hour, minute);
const dateParts = (date: Date) => [date.getFullYear(), date.getMonth(), date.getDate()];
let roundSerial = 0;

function attempt(task = writingTask, patch: Partial<PilotAttempt> = {}, date = localDay(4)): PilotAttempt {
  return {
    taskId: task.taskId, courseId: task.courseId, skill: task.skill,
    roundId: `pilot-test-${++roundSerial}`, correct: true, assisted: false,
    confirmedBy: task.skill === 'reading' || task.skill === 'glyph' || task.skill === 'grouping' ? 'auto' : 'parent',
    at: date.toISOString(), ...patch,
  };
}

function add(progress: PilotProgress, entry: PilotAttempt) { return addPilotRound(progress, [entry]); }

test('detector correctness never produces independently-written evidence, even with parent confirmation', () => {
  for (const task of pilotTasks.filter(task => ['reading', 'glyph', 'grouping'].includes(task.skill))) {
    assert.equal(independentlyWritten(attempt(task)), false);
    assert.equal(independentlyWritten(attempt(task, { confirmedBy: 'parent' })), false);
  }
});

test('paper writing requires unassisted correct parent or teacher confirmation for independent evidence', () => {
  for (const task of [writingTask, recitationTask, dictationTask]) {
    assert.equal(independentlyWritten(attempt(task, { confirmedBy: 'self' })), false);
    assert.equal(independentlyWritten(attempt(task, { confirmedBy: 'auto' })), false);
    assert.equal(independentlyWritten(attempt(task, { confirmedBy: 'parent' })), true);
    assert.equal(independentlyWritten(attempt(task, { confirmedBy: 'teacher' })), true);
    assert.equal(independentlyWritten(attempt(task, { correct: false })), false);
    assert.equal(independentlyWritten(attempt(task, { assisted: true })), false);
  }
});

test('a corrected pronunciation or glyph does not erase a writing error for the same course', () => {
  let progress = add(emptyPilotProgress(), attempt(writingTask, { correct: false }));
  progress = add(progress, attempt(readingTask, { correct: false }));
  progress = add(progress, attempt(readingTask, {}, localDay(5)));
  progress = add(progress, attempt(glyphTask, {}, localDay(5)));
  const reviews = pilotReviews(progress, localDay(5));
  const writing = reviews.find(item => item.taskId === writingTask.taskId)!;
  const reading = reviews.find(item => item.taskId === readingTask.taskId)!;
  assert.equal(writing.skill, 'writing');
  assert.equal(writing.correctedDays, 0);
  assert.equal(writing.due, true);
  assert.equal(reading.skill, 'reading');
  assert.equal(reading.correctedDays, 1);
  assert.equal(reading.due, false);
});

test('reviews use local calendar days for the one, three, and seven day schedule', () => {
  let progress = add(emptyPilotProgress(), attempt(writingTask, { correct: false }, localDay(4, 23, 55)));
  let review = pilotReviews(progress, localDay(5, 0, 5))[0];
  assert.equal(review.due, true, 'the next calendar day is due even if only ten minutes passed');
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(5)));
  progress = add(progress, attempt(writingTask, {}, localDay(5, 0, 5)));
  review = pilotReviews(progress, localDay(7, 23, 59))[0];
  assert.equal(review.correctedDays, 1);
  assert.equal(review.due, false);
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(8)));
  assert.equal(pilotReviews(progress, localDay(8, 0, 1))[0].due, true);
  progress = add(progress, attempt(writingTask, {}, localDay(8, 0, 1)));
  review = pilotReviews(progress, localDay(14, 23, 59))[0];
  assert.equal(review.correctedDays, 2);
  assert.equal(review.due, false);
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(15)));
  assert.equal(pilotReviews(progress, localDay(15, 0, 1))[0].due, true);
});

test('same-day immediate correction stays on the one-day schedule instead of jumping to three days', () => {
  let progress = add(emptyPilotProgress(), attempt(writingTask, { correct: false }, localDay(4, 10)));
  progress = add(progress, attempt(writingTask, {}, localDay(4, 10, 5)));
  progress = add(progress, attempt(writingTask, {}, localDay(4, 11)));
  const review = pilotReviews(progress, localDay(5))[0];
  assert.equal(review.correctedDays, 0);
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(5)));
  assert.equal(review.due, true);
});

test('self-checked paper corrections do not count independent dates or postpone an existing due date', () => {
  for (const task of [writingTask, recitationTask, dictationTask]) {
    let progress = add(emptyPilotProgress(), attempt(task, { correct: false }));
    progress = add(progress, attempt(task, { confirmedBy: 'self' }, localDay(5)));
    progress = add(progress, attempt(task, { confirmedBy: 'self' }, localDay(6)));
    const review = pilotReviews(progress, localDay(6))[0];
    assert.equal(review.correctedDays, 0);
    assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(5)));
    assert.equal(review.due, true);
  }
});

test('repeated successful rounds on one local day count as one effective review day', () => {
  let progress = add(emptyPilotProgress(), attempt(writingTask, { correct: false }));
  progress = add(progress, attempt(writingTask, {}, localDay(5, 8)));
  progress = add(progress, attempt(writingTask, {}, localDay(5, 22)));
  const review = pilotReviews(progress, localDay(6))[0];
  assert.equal(review.correctedDays, 1);
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(8)));
});

test('a wrong or assisted review restarts the error schedule without adding independent evidence', () => {
  let progress = add(emptyPilotProgress(), attempt(writingTask, { correct: false }));
  progress = add(progress, attempt(writingTask, {}, localDay(5)));
  progress = add(progress, attempt(writingTask, { assisted: true }, localDay(8)));
  const review = pilotReviews(progress, localDay(8))[0];
  assert.equal(review.correctedDays, 0);
  assert.deepEqual(dateParts(review.dueDate), dateParts(localDay(9)));
  assert.equal(review.due, false);
});

test('resubmitting the same completed round does not record it twice', () => {
  const entry = attempt();
  const original = add(emptyPilotProgress(), entry);
  assert.equal(add(original, entry), original);
  assert.equal(original.attempts.length, 1);
  const next = add(original, attempt());
  assert.equal(next.attempts.length, 2);
  assert.equal(original.attempts.length, 1, 'the caller keeps an immutable prior record');
});

test('one atomic round cannot contain two different round IDs', () => {
  const first = attempt(writingTask);
  const second = attempt(readingTask);
  assert.throws(() => addPilotRound(emptyPilotProgress(), [first, second]));
});

test('malformed import rejects invalid tasks, crossed skills, fake automatic writing, duplicate results, and broken dates', () => {
  const valid = attempt();
  const serialize = (entries: unknown[]) => JSON.stringify({ schemaVersion: 1, attempts: entries });
  assert.throws(() => importPilotProgress('not JSON'));
  assert.throws(() => importPilotProgress(JSON.stringify({ schemaVersion: 2, attempts: [] })));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, taskId: 'en-01-guess' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, courseId: 'cn-04' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, skill: 'reading' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, confirmedBy: 'auto' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, correct: 'true' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, assisted: 0 }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, at: '2026-99-04' }])));
  assert.throws(() => importPilotProgress(serialize([{ ...valid, roundId: '' }])));
  assert.throws(() => importPilotProgress(serialize([valid, valid])));
  assert.throws(() => importPilotProgress(serialize(Array.from({ length: 10_001 }, (_, i) => ({ ...valid, roundId: `r-${i}` })))));
  assert.throws(() => importPilotProgress(' '.repeat(4_000_001)));
  assert.deepEqual(importPilotProgress(serialize([valid])), { schemaVersion: 1, attempts: [valid] });
});

test('a failed import or invalid save does not overwrite existing browser records', () => {
  const storageKey = 'fanfan-word-adventure:chinese-pilot:v1';
  const existing = add(emptyPilotProgress(), attempt());
  const store = new Map([[storageKey, JSON.stringify(existing)], ['fanfan-word-adventure:progress:v1', 'old-English-progress']]);
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  } });
  try {
    assert.deepEqual(loadPilotProgress(), existing);
    assert.throws(() => importPilotProgress('{"schemaVersion":1,"attempts":[{}]}'));
    assert.equal(store.get(storageKey), JSON.stringify(existing));
    const bad = { schemaVersion: 1, attempts: [{ ...existing.attempts[0], confirmedBy: 'auto' }] } as PilotProgress;
    assert.throws(() => savePilotProgress(bad));
    assert.equal(store.get(storageKey), JSON.stringify(existing));
    const valid = add(existing, attempt());
    savePilotProgress(valid);
    assert.deepEqual(loadPilotProgress(), valid);
    assert.equal(store.get('fanfan-word-adventure:progress:v1'), 'old-English-progress');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('whole-poem dictation derives only the confirmed Shan Xing requirement and contains four lines', () => {
  assert.equal(wholePoemItems(pilotLessons[0]).length, 0);
  const bank = wholePoemItems(pilotLessons[1]);
  assert.equal(bank.length, 1);
  assert.equal(bank[0].id, 'cn-04-dictate-shan-xing');
  assert.equal(bank[0].answers.length, 1);
  assert.equal(bank[0].answers[0].split('\n').length, 4);
  assert.ok(!bank[0].prompt.includes('远上寒山'));
  assert.equal(bank[0].dictationRequirement, 'textbook_required');
  assert.equal(dictationTask.taskId, bank[0].id);
  assert.equal(dictationTask.skill, 'dictation');
});

test('short rounds prefer unseen tasks, remain unique, and do not reorder the authored bank', () => {
  const bank = pilotLessons[0].writingItems;
  const before = JSON.stringify(bank);
  const used = new Set(bank.slice(0, 8).map(item => item.id));
  const unseen = new Set(bank.slice(8).map(item => item.id));
  const first = selectPilotRound(bank, used, 6, () => 0.61);
  assert.equal(first.length, 6);
  assert.equal(new Set(first.map(item => item.id)).size, 6);
  assert.ok(first.every(item => unseen.has(item.id)));
  const small = selectPilotRound(bank.slice(0, 2), new Set(), 6, () => 0);
  assert.equal(small.length, 2);
  assert.equal(JSON.stringify(bank), before);
});
