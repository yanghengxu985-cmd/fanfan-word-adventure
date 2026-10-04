import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import inventoryJson from './inventory.json';
import planJson from './chineseSemesterPlan.json';
import pilotJson from './chinesePilot.json';

type Item = {
  lexemeId: string; text: string; pinyin: string | null; readingVerified: boolean;
  sourcePage: string; sourceId: string; writingRequirement: string;
  pinyinSupplemented?: boolean; readingSourceId?: string; readingContext?: string;
};
type Group = {
  character: string; pinyin: string; context: string; lexemeIds: string[];
  wordExamples: { text: string; pinyin: string; sourceKind: string; sourceId: string; status: string }[];
};
type Requirement = { status: string; scope: string[]; sourcePage: string | null; note: string };
type Counts = { total: number; pinyinReady: number; pinyinPending: number };
type Course = {
  id: string; title: string; kind: string; unitNumber: number; lessonNumber: number | null;
  startPage: number; paperReviewPageRange: string; recognition: Item[]; writing: Item[]; words: Item[];
  counts: { recognition: Counts; writing: Counts; words: Counts };
  grouping: Group[]; groupingStatus: string; recitation: Requirement; dictation: Requirement;
  requirementSourceId: string | null; paperVerified: boolean; pilotAvailable: boolean;
};
type SourceItem = {
  id: string; courseId: string; subject: string; kind: string; text: string;
  pinyin?: string; readingVerified: boolean; sourcePage: string; writingRequirement?: string;
};
const plan = planJson as unknown as {
  schemaVersion: number; edition: { isbn: string; paperVerified: boolean }; sources: { id: string; url: string | null }[];
  summary: {
    lessons: number; gardensInDirectory: number; gardensWithListedItems: number;
    recognition: Counts; writing: Counts; words: Counts; totalRecords: number;
    pinyinReady: number; pinyinPending: number; inventoryPinyinReady: number;
    pilotSupplementedReadings: number; groupingCharacters: number; allPaperVerified: boolean;
  }; courses: Course[];
};
const inventory = inventoryJson as unknown as {
  courses: { id: string; subject: string; title: string; kind: string }[];
  lexemes: SourceItem[];
};
const chinese = inventory.lexemes.filter(item => item.subject === 'chinese');
const categories = [
  ['recognition', 'recognition_character'], ['writing', 'writing_character'], ['words', 'textbook_word'],
] as const;
const supplementIds = new Set(['cn-04-writing_character-02', 'cn-04-writing_character-11']);
const items = plan.courses.flatMap(course => [...course.recognition, ...course.writing, ...course.words]);

test('the Chinese plan preserves all 26 lesson and seven actual garden entries', () => {
  assert.deepEqual(plan.courses.map(course => course.id), inventory.courses.filter(course => course.subject === 'chinese').map(course => course.id));
  assert.deepEqual(plan.courses.filter(course => course.kind === 'lesson').map(course => course.lessonNumber), Array.from({ length: 26 }, (_, index) => index + 1));
  assert.deepEqual(plan.courses.filter(course => course.kind === 'garden').map(course => course.unitNumber), [1, 2, 3, 4, 6, 7, 8]);
  assert.equal(plan.courses.some(course => course.id === 'cn-garden-5'), false);
  assert.equal(items.length, 776);
  assert.equal(new Set(items.map(item => item.lexemeId)).size, 776);
});

test('each course keeps every recognition, writing and word-table item in source order', () => {
  for (const course of plan.courses) {
    assert.equal(course.title, inventory.courses.find(item => item.id === course.id)!.title);
    for (const [category, kind] of categories) {
      const source = chinese.filter(item => item.courseId === course.id && item.kind === kind);
      assert.deepEqual(course[category].map(item => [item.lexemeId, item.text, item.sourcePage]), source.map(item => [item.id, item.text, item.sourcePage]), `${course.id} ${category}`);
      assert.equal(course.counts[category].total, source.length);
    }
  }
  for (const character of ['臂', '禁']) {
    const expected = chinese.filter(item => item.kind === 'recognition_character' && item.text === character).map(item => item.id);
    assert.deepEqual(plan.courses.flatMap(course => course.recognition.filter(item => item.text === character).map(item => item.lexemeId)), expected);
    assert.equal(expected.length, 2, 'multiple-lesson polyphonic records must not be collapsed');
  }
});

test('only the two explicitly reviewed lesson-four readings supplement the original inventory', () => {
  for (const item of items) {
    const source = chinese.find(original => original.id === item.lexemeId)!;
    if (!source.pinyin && supplementIds.has(item.lexemeId)) {
      const pilot = pilotJson.lessons.flatMap(lesson => lesson.writingCharacters).find(original => original.lexemeId === item.lexemeId)!;
      assert.equal(item.text, pilot.character);
      assert.equal(item.pinyin, pilot.pinyin);
      assert.equal(item.readingVerified, true);
      assert.equal(item.pinyinSupplemented, true);
      assert.equal(item.readingSourceId, pilot.sourceId);
      assert.equal(item.readingContext, pilot.context);
    } else {
      assert.equal(item.pinyin, source.pinyin?.trim() || null, item.lexemeId);
      assert.equal(item.readingVerified, source.readingVerified === true, item.lexemeId);
      assert.equal(item.pinyinSupplemented, undefined, item.lexemeId);
    }
    assert.equal(item.writingRequirement, source.writingRequirement ?? 'pending');
  }
  const lessonFour = plan.courses.find(course => course.id === 'cn-04')!;
  assert.equal(lessonFour.writing.find(item => item.text === '相')!.pinyin, 'xiāng');
  assert.equal(lessonFour.writing.find(item => item.text === '落')!.pinyin, 'luò');
  const pending = items.find(item => item.text === '起来')!;
  assert.equal(pending.pinyin, null);
  assert.equal(pending.readingVerified, false);
});

test('grouping examples cover every pilot character and remain editorial extensions', () => {
  for (const course of plan.courses) {
    const lesson = pilotJson.lessons.find(item => item.courseId === course.id);
    if (!lesson) {
      assert.deepEqual(course.grouping, []);
      assert.equal(course.groupingStatus, 'pending');
      continue;
    }
    const characters = [...lesson.recognitionCharacters, ...lesson.writingCharacters];
    assert.deepEqual(course.grouping.map(group => group.character), [...new Set(characters.map(item => item.character))]);
    for (const group of course.grouping) {
      const originals = characters.filter(item => item.character === group.character);
      assert.deepEqual(group.lexemeIds, originals.map(item => item.lexemeId));
      const expectedExamples = [...new Map(originals.flatMap(item => item.wordExamples).map(example => [`${example.text}:${example.pinyin}`, example])).values()];
      assert.deepEqual(group.wordExamples.map(example => [example.text, example.pinyin, example.sourceKind]), expectedExamples.map(example => [example.text, example.pinyin, example.sourceKind]));
      assert.ok(group.wordExamples.length >= 2);
      assert.ok(group.wordExamples.every(example => example.text.includes(group.character) && example.sourceKind === 'editorial_extension' && example.sourceId === 'editorial'));
    }
  }
});

test('recitation and dictation scopes agree with the reviewed pilot rather than an old-edition list', () => {
  const lessonOne = plan.courses.find(course => course.id === 'cn-01')!;
  assert.equal(lessonOne.recitation.status, 'not_specified_in_preview');
  assert.equal(lessonOne.dictation.status, 'not_specified_in_preview');
  assert.deepEqual(lessonOne.recitation.scope, []);
  assert.deepEqual(lessonOne.dictation.scope, []);
  assert.equal(lessonOne.recitation.sourcePage, '4');
  const lessonFour = plan.courses.find(course => course.id === 'cn-04')!;
  const poems = pilotJson.lessons.find(lesson => lesson.courseId === 'cn-04')!.recitation.poems;
  assert.deepEqual(lessonFour.recitation.scope, poems.filter(poem => poem.reciteRequirement === 'textbook_required').map(poem => poem.title));
  assert.deepEqual(lessonFour.dictation.scope, poems.filter(poem => poem.dictationRequirement === 'textbook_required').map(poem => poem.title));
  assert.deepEqual(lessonFour.dictation.scope, ['山行']);
  assert.equal(lessonFour.dictation.sourcePage, '15');
  for (const course of plan.courses.filter(item => !['cn-01', 'cn-04'].includes(item.id))) {
    assert.equal(course.recitation.status, 'pending', course.id);
    assert.equal(course.dictation.status, 'pending', course.id);
    assert.deepEqual(course.recitation.scope, []);
    assert.deepEqual(course.dictation.scope, []);
    assert.equal(course.requirementSourceId, null);
    assert.match(course.recitation.note, /待核.*不表示无要求/);
  }
});

test('empty table entries never manufacture extra writing or garden requirements', () => {
  for (const lessonNumber of [3, 7, 9, 10, 13, 19, 26]) {
    const course = plan.courses.find(item => item.lessonNumber === lessonNumber)!;
    assert.deepEqual(course.writing, []);
  }
  for (const unitNumber of [1, 2, 6]) {
    const garden = plan.courses.find(item => item.kind === 'garden' && item.unitNumber === unitNumber)!;
    assert.deepEqual(garden.recognition, []);
    assert.deepEqual(garden.writing, []);
    assert.deepEqual(garden.words, []);
    assert.equal(garden.recitation.status, 'pending');
  }
  assert.deepEqual(plan.courses.filter(course => course.kind === 'garden' && course.recognition.length > 0).map(course => course.unitNumber), [3, 4, 7, 8]);
});

test('the source registry resolves every reference and does not claim paper verification', () => {
  const sourceIds = new Set(plan.sources.map(source => source.id));
  assert.equal(sourceIds.size, plan.sources.length);
  assert.equal(plan.edition.isbn, '978-7-107-39754-7');
  assert.equal(plan.edition.paperVerified, false);
  assert.equal(plan.summary.allPaperVerified, false);
  for (const course of plan.courses) {
    assert.equal(course.paperVerified, false);
    assert.ok(course.startPage > 0);
    assert.match(course.paperReviewPageRange, /^\d+(—\d+)?$/);
    if (course.requirementSourceId) assert.ok(sourceIds.has(course.requirementSourceId));
    for (const item of [...course.recognition, ...course.writing, ...course.words]) {
      assert.ok(sourceIds.has(item.sourceId));
      if (item.readingSourceId) assert.ok(sourceIds.has(item.readingSourceId));
    }
    for (const group of course.grouping) for (const example of group.wordExamples) assert.ok(sourceIds.has(example.sourceId));
  }
});

test('summary readiness counts account for unchanged inventory and explicitly added readings', () => {
  assert.equal(plan.summary.lessons, 26);
  assert.equal(plan.summary.gardensInDirectory, 7);
  assert.equal(plan.summary.gardensWithListedItems, 4);
  assert.equal(plan.summary.totalRecords, chinese.length);
  assert.equal(plan.summary.inventoryPinyinReady, chinese.filter(item => item.pinyin && item.readingVerified).length);
  assert.equal(plan.summary.pilotSupplementedReadings, chinese.filter(item => !item.pinyin && supplementIds.has(item.id)).length);
  assert.equal(plan.summary.pinyinReady, plan.summary.inventoryPinyinReady + plan.summary.pilotSupplementedReadings);
  assert.equal(plan.summary.pinyinPending, chinese.length - plan.summary.pinyinReady);
  assert.equal(plan.summary.groupingCharacters, plan.courses.reduce((sum, course) => sum + course.grouping.length, 0));
  for (const [category] of categories) {
    const source = plan.courses.flatMap(course => course[category]);
    const ready = source.filter(item => item.pinyin && item.readingVerified).length;
    assert.deepEqual(plan.summary[category], { total: source.length, pinyinReady: ready, pinyinPending: source.length - ready });
  }
});

test('the generated Markdown and machine plan stay synchronized with both source inventories', () => {
  const script = fileURLToPath(new URL('../../scripts/export-chinese-plan.mjs', import.meta.url));
  const result = execFileSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.match(result, /"checked": true/);
});
