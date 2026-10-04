import test from 'node:test';
import assert from 'node:assert/strict';
import { englishLabLessons, getEnglishLabLesson, getLabLessonForLexeme, makeLabAttempt, makeLabQuestions } from './englishLearningLab';
import clips from './englishActivityClips.json';
import { lexemes } from './curriculum';
import { createEmptyProgress, recordAttempt, getSkillState } from '../lib/progress';

test('three short lessons have reviewed vocabulary, real matching speech, and distinct teaching and check stages', () => {
  assert.deepEqual(englishLabLessons.map(lesson => lesson.id), ['cat', 'greetings', 'my-your']);
  const allIds: string[] = [];
  for (const lesson of englishLabLessons) {
    assert.ok(lesson.demos.length >= 2);
    assert.deepEqual(lesson.questions.map(question => question.phase), ['guided', 'guided', 'check', 'check', 'transfer', 'transfer']);
    for (const demo of lesson.demos) {
      assert.equal(clips[demo.audioId as keyof typeof clips], demo.text);
      assert.ok(demo.helpZh);
      allIds.push(demo.id);
    }
    for (const question of lesson.questions) {
      const word = lexemes.find(word => word.id === question.lexemeId)!;
      assert.equal(word.subject, 'english');
      assert.equal(word.courseId, lesson.courseId);
      assert.equal(word.meaningVerified && word.readingVerified, true);
      assert.equal(word.optional, false);
      assert.equal(clips[question.audioId as keyof typeof clips], question.answerText);
      assert.equal(question.options.length, 2);
      assert.equal(new Set(question.options.map(option => option.id)).size, 2);
      assert.equal(question.options.filter(option => option.id === question.correctOptionId).length, 1);
      assert.equal(question.contextVisual?.focus, undefined, 'question context cannot visually reveal whose name is the answer');
      allIds.push(question.id);
    }
  }
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(getEnglishLabLesson('unknown'), undefined);
});

test('my and your refer to speaker and listener when the people change roles or positions', () => {
  const lesson = getEnglishLabLesson('my-your')!;
  for (const question of lesson.questions) {
    const speaker = question.contextVisual!.speaker!;
    const owner = question.lexemeId === 'en-02-word-05' ? speaker : speaker === 'Lin' ? 'Lan' : 'Lin';
    assert.equal(question.correctOptionId, owner === 'Lin' ? 'name-lin' : 'name-lan');
    assert.doesNotMatch(clips[question.audioId as keyof typeof clips], /Lin|Lan/, 'a name in the test audio would bypass understanding my/your');
    assert.equal(question.contextText, `${speaker} is speaking.`);
  }
  const myPractice = lesson.questions.find(question => question.id === 'my-practice')!;
  const myCheck = lesson.questions.find(question => question.id === 'my-check')!;
  const mySwitch = lesson.questions.find(question => question.id === 'my-switch')!;
  assert.notEqual(myPractice.correctOptionId, myCheck.correctOptionId, 'swapping the speaker must change the answer');
  assert.equal(myCheck.correctOptionId, mySwitch.correctOptionId, 'swapping left and right cannot change who my refers to');
  assert.equal(mySwitch.contextVisual?.swapped, true);
});

test('transfer uses a new animal image and a new greeting location rather than only an option shuffle', () => {
  for (const id of ['cat', 'greetings']) {
    const lesson = getEnglishLabLesson(id)!;
    const seen = new Set<string>(lesson.demos.map(demo => demo.visual.scene));
    for (const question of lesson.questions.filter(question => question.phase === 'transfer')) {
      assert.equal(seen.has(question.correctOptionId), false);
    }
  }
});

test('switched-name checks cannot be passed by always choosing the same person', () => {
  const lesson = getEnglishLabLesson('my-your')!;
  const switchQuestions = lesson.questions.filter(question => question.phase === 'transfer');
  assert.equal(switchQuestions.length, 2);
  assert.equal(switchQuestions[0].contextVisual?.speaker, switchQuestions[1].contextVisual?.speaker);
  assert.ok(switchQuestions.every(question => question.contextVisual?.swapped));
  assert.notEqual(switchQuestions[0].correctOptionId, switchQuestions[1].correctOptionId);
  assert.equal(lesson.questions.filter(question => question.correctOptionId === 'name-lin').length, 3);
  assert.equal(lesson.questions.filter(question => question.correctOptionId === 'name-lan').length, 3);
});

test('review selects only the requested listening targets and option shuffles do not mutate teaching content', () => {
  const lesson = getEnglishLabLesson('my-your')!;
  const original = structuredClone(lesson);
  const rounds = [makeLabQuestions(lesson, undefined, () => 0), makeLabQuestions(lesson, undefined, () => 1)];
  assert.deepEqual(lesson, original);
  for (let index = 0; index < lesson.questions.length; index++) {
    assert.deepEqual(rounds[0][index].options.map(option => option.id), [...rounds[1][index].options.map(option => option.id)].reverse());
    assert.equal(rounds[0][index].correctOptionId, rounds[1][index].correctOptionId);
  }
  const onlyYour = makeLabQuestions(lesson, ['en-02-word-03']);
  assert.equal(onlyYour.length, 2);
  assert.ok(onlyYour.every(question => question.lexemeId === 'en-02-word-03' && question.phase !== 'guided'));
  assert.deepEqual(makeLabQuestions(lesson, []), []);
  assert.deepEqual(makeLabQuestions(lesson, ['cn-01-recognition-01']), []);
  assert.equal(getLabLessonForLexeme('en-02-word-03')?.id, 'my-your');
  assert.equal(getLabLessonForLexeme('en-01-word-06')?.id, 'cat');
  assert.equal(getLabLessonForLexeme('cn-01-recognition-01'), undefined);
});

test('guided and helped choices stay assisted; listening choices alone cannot become independent recall', () => {
  const lesson = getEnglishLabLesson('cat')!;
  const guided = lesson.questions.find(question => question.phase === 'guided')!;
  const check = lesson.questions.find(question => question.phase === 'check')!;
  assert.equal(makeLabAttempt(lesson.id, guided, guided.correctOptionId, false).assisted, true);
  assert.equal(makeLabAttempt(lesson.id, check, check.correctOptionId, true).assisted, true);
  const wrong = makeLabAttempt(lesson.id, check, check.options.find(option => option.id !== check.correctOptionId)!.id, false);
  assert.equal(wrong.correct, false);
  assert.match(wrong.sourceEvidence!, /prompt-ended:first-choice:/);
  const reviewed = makeLabAttempt(lesson.id, check, check.correctOptionId, false, true);
  assert.match(reviewed.sourceEvidence!, /english-lab:cat:review:/);
  assert.equal(reviewed.skill, 'listening');
  assert.equal(reviewed.mode, 'listening');
  const ids = new Set(lexemes.map(word => word.id));
  let progress = createEmptyProgress();
  for (const timestamp of ['2026-10-01T03:00:00Z', '2026-10-03T03:00:00Z']) {
    progress = recordAttempt(progress, { ...reviewed, timestamp }, ids);
  }
  assert.equal(getSkillState(progress, check.lexemeId, 'listening').status, 'passed');
  assert.equal(getSkillState(progress, check.lexemeId, 'recall').attempts, 0);
});
