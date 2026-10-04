import test from 'node:test';
import assert from 'node:assert/strict';
import { englishActivities, makeEnglishActivityRound, hasEnglishActivities, hasEnglishActivityReview } from './englishActivities';
import clips from './englishActivityClips.json';
import { lexemes } from './curriculum';
import { createEmptyProgress, recordAttempt, getSkillState } from '../lib/progress';

test('prototype activities stay anchored to reviewed Unit 1/2 words without changing the inventory', () => {
  assert.equal(englishActivities.length, 24);
  assert.equal(new Set(englishActivities.map(item => item.id)).size, 24);
  for (const courseId of ['en-01', 'en-02']) for (const kind of ['scene', 'listening']) {
    assert.equal(englishActivities.filter(item => item.courseId === courseId && item.kind === kind).length, 6);
  }
  for (const activity of englishActivities) {
    const word = lexemes.find(word => word.id === activity.lexemeId)!;
    assert.equal(word.courseId, activity.courseId);
    assert.equal(word.optional, false);
    assert.equal(word.meaningVerified && word.readingVerified, true);
    assert.equal(activity.choices.length, 3);
    assert.ok(activity.oralCue && activity.explanation);
    assert.ok(activity.acceptedChoiceIds.length > 0 && activity.acceptedChoiceIds.length < 3);
    for (const id of activity.acceptedChoiceIds) assert.ok(activity.choices.some(choice => choice.id === id));
    assert.equal(clips[activity.promptAudioId as keyof typeof clips], activity.promptText);
    assert.equal(clips[activity.modelAudioId as keyof typeof clips], activity.modelText);
    if (activity.kind === 'scene') {
      assert.equal(clips[activity.dialogueAudioId as keyof typeof clips], activity.promptText + ' ' + activity.modelText);
      for (const choice of activity.choices) assert.equal(clips[choice.audioId as keyof typeof clips], choice.text);
    } else {
      assert.ok(activity.choices.every(choice => !choice.text && !choice.audioId));
    }
  }
});

test('short rounds progress from two choices to three and preserve valid alternatives', () => {
  for (let seed = 0; seed < 30; seed++) for (const unit of ['en-01', 'en-02']) for (const kind of ['scene', 'listening'] as const) {
    const round = makeEnglishActivityRound(unit, kind, 6, undefined, seed);
    assert.equal(round.length, 6);
    assert.equal(new Set(round.map(item => item.id)).size, 6);
    for (const [index, item] of round.entries()) {
      assert.equal(item.choices.length, index < 2 ? 2 : 3);
      assert.ok(item.choices.some(choice => item.acceptedChoiceIds.includes(choice.id)));
      assert.ok(item.choices.some(choice => !item.acceptedChoiceIds.includes(choice.id)));
    }
  }
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', 6, undefined, 9), makeEnglishActivityRound('en-01', 'scene', 6, undefined, 9));
  assert.equal(makeEnglishActivityRound('en-01', 'scene', 8).length, 6);
  assert.equal(makeEnglishActivityRound('en-02', 'listening', 4).length, 4);
  assert.deepEqual(makeEnglishActivityRound('en-03', 'scene'), []);
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', 0), []);
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', NaN), []);
  assert.ok(englishActivities.every(item => item.choices.length === 3));
});

test('Hello/Hi and Bye/Goodbye are both accepted when offered together', () => {
  for (const id of ['en01-scene-hello', 'en01-scene-goodbye', 'en01-scene-class']) {
    const activity = englishActivities.find(item => item.id === id)!;
    assert.equal(activity.acceptedChoiceIds.length, 2);
  }
});

test('listening and scene reviews return only requested words with matching activity evidence', () => {
  assert.equal(hasEnglishActivities('en-01'), true);
  assert.equal(hasEnglishActivities('cn-01'), false);
  assert.equal(hasEnglishActivityReview('en-01-word-06', 'listening'), true);
  assert.equal(hasEnglishActivityReview('en-01-word-06', 'recall'), false);
  assert.equal(hasEnglishActivityReview('en-02-word-02', 'listening'), false);
  const round = makeEnglishActivityRound('en-01', 'listening', 6, ['en-01-word-06']);
  assert.equal(round.length, 1);
  assert.equal(round[0].lexemeId, 'en-01-word-06');
  assert.deepEqual(makeEnglishActivityRound('en-02', 'scene', 6, ['en-01-word-06']), []);
});

test('picture selection and reply selection cannot create independent recall or stable mastery', () => {
  const id = 'en-01-word-01';
  let progress = createEmptyProgress();
  for (const day of ['2026-10-01', '2026-10-02', '2026-10-03']) {
    for (const skill of ['context', 'listening'] as const) progress = recordAttempt(progress, {
      lexemeId: id, skill, mode: skill === 'context' ? 'selection' : 'listening', correct: true,
      sourceEvidence: 'en01-original-activity:first-choice', timestamp: day + 'T04:00:00.000Z',
    }, undefined, new Date('2026-10-04T04:00:00.000Z'));
  }
  for (const skill of ['context', 'listening'] as const) {
    const state = getSkillState(progress, id, skill, new Date('2026-10-04T04:00:00.000Z'));
    assert.equal(state.independentDays, 0);
    assert.equal(state.status, 'passed');
    assert.equal(state.nextReviewDays, 1);
  }
  assert.equal(getSkillState(progress, id, 'recall').status, 'unseen');
});
