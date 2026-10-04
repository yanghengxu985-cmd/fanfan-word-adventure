import test from 'node:test';
import assert from 'node:assert/strict';
import semesterPlan from './chineseSemesterPlan.json';
import {
  meadowLessonCopy, meadowLessonRequirementNote, meadowRecognitionFocus, meadowWordFocus,
} from './goldenMeadowLesson';

const course = semesterPlan.courses.find(item => item.id === 'cn-15')!;

test('meadow coaching matches the exact revised 6 / 13 / 11 scope without promoting 茸 to writing', () => {
  assert.deepEqual(meadowRecognitionFocus.map(item => item.character), course.recognition.map(item => item.text));
  assert.deepEqual(meadowLessonCopy.writingFocus.map(item => item.character), course.writing.map(item => item.text));
  assert.deepEqual(meadowWordFocus.map(item => item.text), course.words.map(item => item.text));
  assert.equal(new Set(meadowRecognitionFocus.map(item => item.character)).size, 6);
  assert.equal(new Set(meadowLessonCopy.writingFocus.map(item => item.character)).size, 13);
  assert.equal(new Set(meadowWordFocus.map(item => item.text)).size, 11);
  assert.ok(meadowRecognitionFocus.some(item => item.character === '茸'));
  assert.ok(!meadowLessonCopy.writingFocus.some(item => item.character === '茸'));
});

test('manual coaching keeps word readings and shared-character readings consistent with their contexts', () => {
  assert.deepEqual(meadowWordFocus.map(item => item.pinyin), course.words.map(item => item.pinyin));
  const writing = new Map(meadowLessonCopy.writingFocus.map(item => [item.character, item]));
  for (const item of meadowRecognitionFocus) {
    if (writing.has(item.character)) assert.equal(item.pinyin, writing.get(item.character)!.pinyin);
  }
  const contextReadings = { 朝: 'cháo', 盛: 'shèng', 劲: 'jìn', 钓: 'diào' };
  for (const [character, pinyin] of Object.entries(contextReadings)) {
    assert.equal(writing.get(character)?.pinyin, pinyin);
  }
  for (const item of [...meadowRecognitionFocus, ...meadowLessonCopy.writingFocus]) {
    for (const field of ['pinyin', 'parts', 'attention', 'meaning'] as const) assert.ok(item[field].trim());
    assert.ok(item.words.length > 0 && item.words.every(word => word.includes(item.character)));
  }
});

test('time comparisons connect each observed colour to an available flower state', () => {
  assert.deepEqual(meadowLessonCopy.observationTimes.map(item => item.id), ['morning', 'noon', 'evening']);
  assert.deepEqual(meadowLessonCopy.observationTimes.map(item => item.grassColour), ['绿色', '金色', '绿色']);
  assert.deepEqual(meadowLessonCopy.observationTimes.map(item => item.flowerState), ['closed', 'open', 'closed']);
  const states = new Set(meadowLessonCopy.flowerStates.map(item => item.id));
  assert.equal(states.size, 2);
  for (const observation of meadowLessonCopy.observationTimes) {
    assert.ok(states.has(observation.flowerState));
    assert.ok(observation.evidence.trim());
    assert.ok(observation.question.trim() && observation.answer.trim());
  }
});

test('reading tasks cover phenomena, cause and evidence-based transfer with individual choice feedback', () => {
  assert.deepEqual(meadowLessonCopy.readingPrompts.map(item => item.id), [
    'meadow-time-observations', 'meadow-flower-cause', 'meadow-evidence-record',
  ]);
  for (const prompt of meadowLessonCopy.readingPrompts) {
    assert.equal(prompt.choices.length, 3);
    assert.equal(prompt.choices.filter(choice => choice.correct).length, 1);
    assert.equal(new Set(prompt.choices.map(choice => choice.text)).size, 3);
    for (const choice of prompt.choices) assert.ok(choice.explanation.trim());
  }
  const cause = meadowLessonCopy.readingPrompts[1].choices.find(item => item.correct)!;
  assert.match(cause.text, /显露/);
  assert.match(cause.text, /包住/);
  const transfer = meadowLessonCopy.readingPrompts[2].choices.find(item => item.correct)!;
  assert.match(transfer.text, /继续观察/);
});

test('lesson-local coaching preserves the pending paper and global character-reading boundaries', () => {
  assert.equal(course.paperVerified, false);
  assert.ok([...course.recognition, ...course.writing].every(item => !item.readingVerified));
  assert.equal(course.recitation.status, 'pending');
  assert.equal(course.dictation.status, 'pending');
  assert.match(meadowLessonRequirementNote, /原创/);
  assert.match(meadowLessonRequirementNote, /2026纸本/);
  assert.match(meadowLessonRequirementNote, /仍待核对/);
  assert.match(meadowLessonRequirementNote, /不改变全册核验状态/);
  assert.match(meadowLessonRequirementNote, /固定钟点/);
});
