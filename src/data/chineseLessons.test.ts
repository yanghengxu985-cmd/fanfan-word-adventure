import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import test from 'node:test';
import semesterPlan from './chineseSemesterPlan.json';
import audioClips from './chineseLessonsAudioClips.json';
import audioManifest from './chineseLessonsAudioManifest.json';
import { lexemes } from './curriculum';
import {
  chineseLessonMaterials, completedChineseLessonIds, getLessonPaperWords,
  getLessonWords, lessonCourseById, lessonMaterialById, type LessonCourse, type WordCategory,
} from './chineseLessons';
import { getLessonAudioEntry } from '../lib/chineseLessonAudio';

const categories: WordCategory[] = ['recognition', 'writing', 'words'];
const formalCourses = semesterPlan.courses.filter(course => course.kind === 'lesson');
const lexemeById = new Map(lexemes.map(item => [item.id, item]));
const poems = chineseLessonMaterials.flatMap(lesson => lesson.poems || []);

function nonempty(value: string, context: string) {
  assert.equal(typeof value, 'string', context);
  assert.ok(value.trim(), `${context} is empty`);
}

function unique(values: string[], context: string) {
  assert.equal(new Set(values).size, values.length, `${context} contains duplicate values`);
}

test('all 26 formal lessons have one complete material and resolve through the lesson directory', () => {
  assert.equal(formalCourses.length, 26);
  assert.equal(chineseLessonMaterials.length, 26);
  const expected = formalCourses.map(course => course.id).sort();
  const actual = chineseLessonMaterials.map(material => material.courseId).sort();
  unique(actual, 'material course IDs');
  assert.deepEqual(actual, expected);
  assert.deepEqual([...completedChineseLessonIds].sort(), expected);
  assert.equal(lessonMaterialById.size, 26);
  for (const material of chineseLessonMaterials) {
    assert.equal(lessonCourseById.get(material.courseId)?.kind, 'lesson', material.courseId);
    assert.equal(lessonMaterialById.get(material.courseId), material);
  }
});

test('each lesson supplies four distinct teaching steps, one activity and three teacher prompts', () => {
  for (const lesson of chineseLessonMaterials) {
    nonempty(lesson.intro, `${lesson.courseId} introduction`);
    assert.equal(lesson.steps.length, 4, lesson.courseId);
    unique(lesson.steps.map(step => step.summary), `${lesson.courseId} step summaries`);
    for (const [index, step] of lesson.steps.entries()) {
      for (const field of ['label', 'summary', 'prompt', 'explanation'] as const) {
        nonempty(step[field], `${lesson.courseId} step ${index} ${field}`);
      }
    }
    assert.ok(lesson.activity && !Array.isArray(lesson.activity), `${lesson.courseId} needs one activity`);
    for (const field of ['title', 'instruction', 'explanation'] as const) {
      nonempty(lesson.activity[field], `${lesson.courseId} activity ${field}`);
    }
    assert.equal(lesson.teacherPrompts.length, 3, lesson.courseId);
    unique(lesson.teacherPrompts, `${lesson.courseId} teacher prompts`);
    lesson.teacherPrompts.forEach(prompt => nonempty(prompt, `${lesson.courseId} teacher prompt`));
    nonempty(lesson.sourceNotes, `${lesson.courseId} source boundary`);
    assert.match(lesson.sourceNotes, /原创/, `${lesson.courseId} must identify editorial material`);
    assert.match(lesson.sourceNotes, /纸本/, `${lesson.courseId} must preserve the paper-book boundary`);
    assert.ok(lesson.sourceUrls.length > 0, `${lesson.courseId} source URLs`);
    for (const source of lesson.sourceUrls) {
      assert.ok(['https:', 'http:'].includes(new URL(source).protocol), `${lesson.courseId} invalid source URL`);
    }
  }
  unique(chineseLessonMaterials.map(lesson => lesson.activity.instruction), 'lesson activity instructions');
});

test('activities contain usable order, classification, comparison, prediction and evidence tasks', () => {
  assert.deepEqual([...new Set(chineseLessonMaterials.map(lesson => lesson.activity.kind))].sort(),
    ['classify', 'compare', 'evidence', 'order', 'predict']);
  for (const lesson of chineseLessonMaterials) {
    const activity = lesson.activity;
    if (activity.kind === 'order') {
      assert.ok(activity.items.length >= 3, `${lesson.courseId} sequence is too short`);
      unique(activity.items, `${lesson.courseId} ordered cards`);
      activity.items.forEach(item => nonempty(item, `${lesson.courseId} ordered card`));
    } else if (activity.kind === 'classify') {
      assert.ok(activity.groups.length >= 2, `${lesson.courseId} needs multiple groups`);
      unique(activity.groups, `${lesson.courseId} classification groups`);
      activity.groups.forEach(group => nonempty(group, `${lesson.courseId} group label`));
      assert.ok(activity.items.length >= activity.groups.length, `${lesson.courseId} missing cards`);
      unique(activity.items.map(item => item.text), `${lesson.courseId} classification cards`);
      for (const item of activity.items) {
        nonempty(item.text, `${lesson.courseId} classification card`);
        assert.ok(Number.isInteger(item.group) && item.group >= 0 && item.group < activity.groups.length,
          `${lesson.courseId} card ${item.text} has an invalid group`);
      }
      assert.equal(new Set(activity.items.map(item => item.group)).size, activity.groups.length,
        `${lesson.courseId} has an empty group`);
    } else if (activity.kind === 'compare') {
      assert.ok(activity.options.length >= 2, `${lesson.courseId} needs multiple comparison cases`);
      unique(activity.options.map(option => option.label), `${lesson.courseId} comparison labels`);
      unique(activity.options.map(option => option.detail), `${lesson.courseId} comparison details`);
      for (const option of activity.options) {
        nonempty(option.label, `${lesson.courseId} comparison label`);
        nonempty(option.detail, `${lesson.courseId} comparison detail`);
        assert.notEqual(option.label, option.detail, `${lesson.courseId} comparison needs an actual detail`);
      }
      nonempty(activity.question, `${lesson.courseId} comparison question`);
    }
  }
});

test('78 comprehension questions have unique IDs, three distinct options and a valid answer', () => {
  const questions = chineseLessonMaterials.flatMap(lesson => lesson.choices);
  assert.equal(questions.length, 78);
  unique(questions.map(question => question.id), 'global question IDs');
  unique(questions.map(question => question.prompt), 'global question prompts');
  for (const lesson of chineseLessonMaterials) {
    assert.equal(lesson.choices.length, 3, lesson.courseId);
    for (const question of lesson.choices) {
      nonempty(question.id, `${lesson.courseId} question ID`);
      nonempty(question.prompt, `${question.id} prompt`);
      nonempty(question.explanation, `${question.id} answer explanation`);
      assert.equal(question.options.length, 3, question.id);
      unique(question.options.map(option => option.trim()), `${question.id} answer options`);
      question.options.forEach(option => nonempty(option, `${question.id} answer option`));
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length,
        `${question.id} answer must address an existing option`);
      nonempty(question.options[question.answer], `${question.id} correct answer`);
    }
  }
});

// These public-domain originals are independent acceptance fixtures, including the revised-book “生处”.
const canonicalPoems = [
  { title: '望洞庭', author: '刘禹锡', dynasty: '唐', lines: [
    '湖光秋月两相和，', '潭面无风镜未磨。', '遥望洞庭山水翠，', '白银盘里一青螺。',
  ] },
  { title: '山行', author: '杜牧', dynasty: '唐', lines: [
    '远上寒山石径斜，', '白云生处有人家。', '停车坐爱枫林晚，', '霜叶红于二月花。',
  ] },
  { title: '夜书所见', author: '叶绍翁', dynasty: '宋', lines: [
    '萧萧梧叶送寒声，', '江上秋风动客情。', '知有儿童挑促织，', '夜深篱落一灯明。',
  ] },
  { title: '鹿柴', author: '王维', dynasty: '唐', lines: [
    '空山不见人，', '但闻人语响。', '返景入深林，', '复照青苔上。',
  ] },
  { title: '望天门山', author: '李白', dynasty: '唐', lines: [
    '天门中断楚江开，', '碧水东流至此回。', '两岸青山相对出，', '孤帆一片日边来。',
  ] },
  { title: '饮湖上初晴后雨', author: '苏轼', dynasty: '宋', lines: [
    '水光潋滟晴方好，', '山色空蒙雨亦奇。', '欲把西湖比西子，', '淡妆浓抹总相宜。',
  ] },
];

test('six public-domain poems preserve all 24 original lines, authors and punctuation', () => {
  assert.equal(poems.length, 6);
  unique(poems.map(poem => poem.id), 'poem IDs');
  assert.deepEqual(poems.map(poem => ({ title: poem.title, author: poem.author, dynasty: poem.dynasty,
    lines: poem.lines.map(line => line.text) })), canonicalPoems);
  assert.equal(poems.flatMap(poem => poem.lines).length, 24);
  for (const poem of poems) {
    assert.equal(poem.lines.length, 4, poem.title);
    nonempty(poem.note, `${poem.title} reading note`);
    for (const line of poem.lines) {
      assert.match(line.text, /^\p{Script=Han}+[，。]$/u, line.text);
      nonempty(line.meaning, `${poem.title} original meaning`);
      nonempty(line.clue, `${poem.title} picture clue`);
    }
  }
});

test('every poetic character has one modern Mandarin syllable and contextual polyphonic readings stay correct', () => {
  for (const poem of poems) for (const line of poem.lines) {
    const characters = [...line.text].filter(character => /\p{Script=Han}/u.test(character));
    const syllables = line.pinyin.trim().split(/\s+/u);
    assert.equal(syllables.length, characters.length, `${poem.title}: ${line.text}`);
    for (const syllable of syllables) assert.match(syllable, /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹ]+$/u, line.text);
  }
  const contextualReadings = [
    ['潭面无风镜未磨。', '磨', 'mó'],
    ['远上寒山石径斜，', '斜', 'xié'],
    ['知有儿童挑促织，', '挑', 'tiǎo'],
    ['返景入深林，', '景', 'jǐng'],
    ['山色空蒙雨亦奇。', '蒙', 'méng'],
    ['淡妆浓抹总相宜。', '抹', 'mǒ'],
  ];
  for (const [text, character, expected] of contextualReadings) {
    const line = poems.flatMap(poem => poem.lines).find(item => item.text === text)!;
    assert.ok(line, text);
    assert.equal(line.pinyin.split(/\s+/u)[[...line.text].indexOf(character)], expected, text);
  }
});

test('prediction lessons start before later characters appear and all skim lessons preserve empty writing banks', () => {
  const laterCharacters: Record<string, string[]> = {
    'cn-08': ['小猫', '母鸡', '蜘蛛'],
    'cn-09': ['壁虎', '乌鸦', '蜗牛'],
    'cn-10': ['公鸡', '杜鹃', '狐狸', '猎人'],
  };
  assert.deepEqual(chineseLessonMaterials.filter(lesson => lesson.activity.kind === 'predict').map(lesson => lesson.courseId),
    Object.keys(laterCharacters));
  for (const [id, characters] of Object.entries(laterCharacters)) {
    const lesson = lessonMaterialById.get(id)!;
    const start = [lesson.intro, ...Object.values(lesson.steps[0])].join('\n');
    for (const character of characters) assert.ok(!start.includes(character), `${id} reveals ${character} at its first stop`);
  }
  for (const number of [3, 7, 9, 10, 13, 19, 26]) {
    const id = `cn-${String(number).padStart(2, '0')}`;
    const course = lessonCourseById.get(id)!;
    assert.deepEqual(course.writing, [], `${id} must not acquire required writing characters`);
    assert.deepEqual(getLessonWords(course, 'writing'), [], id);
    assert.deepEqual(course.dictation.scope, [], `${id} has no confirmed compulsory dictation`);
    assert.deepEqual(course.recitation.scope, [], `${id} has no confirmed compulsory recitation`);
  }
});

test('the classroom word banks cover all 33 courses, 250 writing records and 250 textbook words without losing source order', () => {
  assert.equal(semesterPlan.courses.length, 33);
  assert.equal(lessonCourseById.size, 33);
  unique(semesterPlan.courses.map(course => course.id), 'word-bank course IDs');
  const writing = semesterPlan.courses.flatMap<LessonCourse['writing'][number]>(course => course.writing);
  const words = semesterPlan.courses.flatMap<LessonCourse['words'][number]>(course => course.words);
  assert.equal(writing.length, 250);
  assert.equal(words.length, 250);
  unique(writing.map(item => item.lexemeId), 'writing record IDs');
  unique(words.map(item => item.lexemeId), 'textbook word record IDs');
  for (const category of categories) {
    for (const course of semesterPlan.courses) {
      assert.deepEqual(getLessonWords(course, category).map(item => [item.id, item.text]),
        course[category].map(item => [item.lexemeId, item.text]), `${course.id} ${category}`);
    }
  }
});

test('word cards publish only verified readings and meanings, while retaining every writing character for memory checks', () => {
  let pendingReadings = 0;
  let pendingMeanings = 0;
  let pendingWriting = 0;
  for (const course of semesterPlan.courses) for (const category of categories) {
    const bank = getLessonWords(course, category);
    for (const [index, original] of course[category].entries()) {
      const card = bank[index];
      const source = lexemeById.get(original.lexemeId);
      assert.ok(source, original.lexemeId);
      assert.equal(card.readingVerified, original.readingVerified, card.id);
      assert.equal(card.pinyin, original.readingVerified ? original.pinyin : null, card.id);
      assert.equal(card.meaning, source.meaningVerified ? source.meaning : '', card.id);
      if (!original.readingVerified) {
        pendingReadings++;
        assert.equal(card.pinyin, null, card.id);
        if (category === 'writing') {
          pendingWriting++;
          assert.equal(card.text, original.text, `${card.id} remains available for character memory checks`);
        }
      }
      if (!source.meaningVerified) {
        pendingMeanings++;
        assert.equal(card.meaning, '', `${card.id} must hide an unverified meaning`);
      }
    }
  }
  assert.ok(pendingReadings > 0 && pendingMeanings > 0 && pendingWriting > 0,
    'acceptance data must exercise both verified and pending branches');
  assert.equal(semesterPlan.courses.flatMap(course => getLessonWords(course, 'writing')).length, 250);
});

test('pinyin paper writing includes exactly 249 verified words and excludes pending 起来 even if a reading string is supplied', () => {
  const paperWords = semesterPlan.courses.flatMap(course => getLessonPaperWords(course));
  const verified = semesterPlan.courses.flatMap(course => course.words.filter(item => item.readingVerified && item.pinyin));
  assert.equal(paperWords.length, 249);
  assert.deepEqual(paperWords.map(item => [item.id, item.text, item.pinyin]),
    verified.map(item => [item.lexemeId, item.text, item.pinyin]));
  const course = semesterPlan.courses.find(item => item.words.some(word => word.text === '起来' && !word.readingVerified))!;
  assert.ok(course, 'the pending contextual reading must remain explicitly represented');
  const pending = course.words.find(item => item.text === '起来')!;
  assert.equal(getLessonWords(course, 'words').find(item => item.id === pending.lexemeId)?.pinyin, null);
  assert.ok(!paperWords.some(item => item.id === pending.lexemeId));
  const unreviewed = { ...course, words: [{ ...pending, pinyin: 'qǐ lái', readingVerified: false }] } as LessonCourse;
  assert.deepEqual(getLessonPaperWords(unreviewed), [], 'a nonempty reading is insufficient without verification');
  assert.equal(getLessonWords(unreviewed, 'words')[0].pinyin, null);
  assert.equal(pending.pinyin, null, 'the boundary check must not change the original inventory');
});

type AudioReference = { id: string; text: string; pinyin: string; sourceKind: string };
const wordAudio: AudioReference[] = semesterPlan.courses.flatMap(course => course.words
  .filter(item => item.readingVerified && item.pinyin)
  .map(item => ({ id: item.lexemeId, text: item.text, pinyin: item.pinyin!, sourceKind: 'textbook_word' })));
const summaryAudio: AudioReference[] = chineseLessonMaterials.flatMap(lesson => lesson.steps.map((step, index) => ({
  id: `${lesson.courseId}-explain-${index}`, text: step.summary, pinyin: '', sourceKind: 'original_explanation',
})));
const poemAudio: AudioReference[] = chineseLessonMaterials.flatMap(lesson => (lesson.poems || []).flatMap(poem => poem.lines.map((line, index) => ({
  id: `${lesson.courseId}-poem-${poem.id}-${index}`, text: line.text, pinyin: line.pinyin, sourceKind: 'public_domain_poem',
}))));
const allAudio = [...wordAudio, ...summaryAudio, ...poemAudio];
const clips = audioClips as Record<string, { text: string; pinyin: string; sourceKind: string; sourceRef: string }>;
const recordings = audioManifest.entries as Record<string, {
  text: string; pinyin: string; sourceKind: string; file: string; spokenText: string; durationSeconds: number; bytes: number;
}>;

test('the fixed recording catalog matches every current word, step summary and public-domain line', () => {
  assert.deepEqual([wordAudio.length, summaryAudio.length, poemAudio.length], [249, 104, 24]);
  unique(allAudio.map(reference => reference.id), 'required audio IDs');
  for (const reference of allAudio) {
    const clip = clips[reference.id];
    assert.ok(clip, `${reference.id} missing from recording catalog`);
    assert.equal(clip.text, reference.text, `${reference.id} catalog is stale`);
    assert.equal(clip.pinyin, reference.pinyin, reference.id);
    assert.equal(clip.sourceKind, reference.sourceKind, reference.id);
    nonempty(clip.sourceRef, `${reference.id} audio source boundary`);
  }
  const pending = semesterPlan.courses.flatMap(course => course.words).filter(item => !item.readingVerified);
  for (const item of pending) {
    assert.equal(clips[item.lexemeId], undefined, `${item.lexemeId} has no reviewed pronunciation`);
    assert.equal(recordings[item.lexemeId], undefined, `${item.lexemeId} must not gain a fixed pronunciation`);
  }
});

function checkRecordings(references: AudioReference[], label: string) {
  const missing = references.filter(reference => !Object.hasOwn(recordings, reference.id));
  assert.equal(missing.length, 0,
    `${label}: ${missing.length} recordings missing; first IDs: ${missing.slice(0, 8).map(reference => reference.id).join(', ')}`);
  for (const reference of references) {
    const entry = recordings[reference.id];
    assert.equal(entry.text, reference.text, `${reference.id} recording text is stale`);
    assert.equal(entry.pinyin, reference.pinyin, reference.id);
    assert.equal(entry.sourceKind, reference.sourceKind, reference.id);
    assert.deepEqual(getLessonAudioEntry(reference.id, reference.text), entry, `${reference.id} is not available to the player`);
    nonempty(entry.spokenText, `${reference.id} spoken text`);
    assert.ok(Number.isFinite(entry.durationSeconds) && entry.durationSeconds > 0, `${reference.id} duration`);
    assert.ok(Number.isInteger(entry.bytes) && entry.bytes > 0, `${reference.id} byte count`);
    assert.match(entry.file, /^audio\/chinese-lessons\/[a-z0-9_-]+\.mp3$/, `${reference.id} local audio path`);
    const path = new URL(`../../public/${entry.file}`, import.meta.url);
    assert.ok(existsSync(path), `${reference.id} audio file missing: ${entry.file}`);
    assert.equal(statSync(path).size, entry.bytes, `${reference.id} audio file size disagrees with the manifest`);
  }
}

test('the playable manifest covers all 249 verified textbook-word recordings', () => checkRecordings(wordAudio, 'textbook words'));
test('the playable manifest covers all 104 current lesson-summary recordings', () => checkRecordings(summaryAudio, 'lesson summaries'));
test('the playable manifest covers all 24 public-domain poetic-line recordings', () => checkRecordings(poemAudio, 'poem lines'));
