import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EnglishPicture from '../components/EnglishPicture';
import { englishActivities, makeEnglishActivityRound, hasEnglishActivities, hasEnglishActivityReview } from './englishActivities';
import clips from './englishActivityClips.json';
import { lexemes } from './curriculum';
import { createEmptyProgress, recordAttempt, getSkillState } from '../lib/progress';

const units = Array.from({ length: 8 }, (_, index) => `en-${String(index + 1).padStart(2, '0')}`);
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('the semester extension preserves the original 24 activities and 48 recordings exactly', () => {
  const originals = englishActivities.filter(item => ['en-01', 'en-02'].includes(item.courseId));
  assert.equal(originals.length, 24);
  assert.equal(digest(originals), '395ae0405d813ed06d1a4e06dc9c48c31e85cd3ff1af70debb94b6a78853a71f');
  const originalClips = Object.fromEntries(Object.entries(clips).filter(([id]) => /^activity-\d{3}$/.test(id)));
  assert.equal(Object.keys(originalClips).length, 48);
  assert.equal(digest(originalClips), 'cdb0d3d7a3fa92790f21e47af6e5a7bff4f09a09d8d60702b42a22894858a7cd');
});

test('all eight unit banks stay anchored to reviewed words and valid, audible choices', () => {
  assert.equal(englishActivities.length, 104);
  assert.equal(new Set(englishActivities.map(item => item.id)).size, 104);
  for (const courseId of units) for (const kind of ['scene', 'listening']) {
    assert.equal(englishActivities.filter(item => item.courseId === courseId && item.kind === kind).length,
      courseId === 'en-07' && kind === 'listening' ? 14 : 6, `${courseId} ${kind}`);
  }
  for (const activity of englishActivities) {
    const word = lexemes.find(word => word.id === activity.lexemeId)!;
    assert.ok(word, `${activity.id} must target an existing word`);
    assert.equal(word.subject, 'english');
    assert.equal(word.courseId, activity.courseId);
    assert.equal(word.optional, false);
    assert.equal(word.meaningVerified && word.readingVerified, true);
    assert.notEqual(word.audioStatus, 'unavailable');
    assert.ok(['paper_verified', 'preview_verified'].includes(word.verificationStatus));
    assert.equal(activity.choices.length, 3);
    assert.ok(activity.oralCue && activity.explanation);
    assert.ok(activity.acceptedChoiceIds.length > 0 && activity.acceptedChoiceIds.length < 3);
    assert.equal(new Set(activity.choices.map(choice => choice.id)).size, 3);
    assert.equal(new Set(activity.acceptedChoiceIds).size, activity.acceptedChoiceIds.length);
    for (const id of activity.acceptedChoiceIds) assert.ok(activity.choices.some(choice => choice.id === id));
    assert.equal(clips[activity.promptAudioId as keyof typeof clips], activity.promptText);
    assert.equal(clips[activity.modelAudioId as keyof typeof clips], activity.modelText);
    if (activity.kind === 'scene') {
      assert.equal(clips[activity.dialogueAudioId as keyof typeof clips], activity.promptText + ' ' + activity.modelText);
      for (const choice of activity.choices) assert.equal(clips[choice.audioId as keyof typeof clips], choice.text);
    } else {
      assert.ok(activity.choices.every(choice => !choice.text && !choice.audioId));
      if (!['en-01', 'en-02'].includes(activity.courseId)) {
        assert.equal(new Set(activity.choices.map(choice => choice.picture)).size, 3,
          `${activity.id}: hidden-caption listening choices need three distinct pictures`);
      }
    }
  }
});

test('every unit keeps six-question rounds, two-to-three choices, and valid alternatives', () => {
  for (let seed = 0; seed < 30; seed++) for (const unit of units) for (const kind of ['scene', 'listening'] as const) {
    const round = makeEnglishActivityRound(unit, kind, 6, undefined, seed);
    assert.equal(round.length, 6);
    assert.equal(new Set(round.map(item => item.id)).size, 6);
    for (const [index, item] of round.entries()) {
      assert.equal(item.choices.length, index < 2 ? 2 : 3);
      assert.ok(item.choices.some(choice => item.acceptedChoiceIds.includes(choice.id)));
      assert.ok(item.choices.some(choice => !item.acceptedChoiceIds.includes(choice.id)));
      const source = englishActivities.find(activity => activity.id === item.id)!;
      assert.deepEqual(new Set(item.acceptedChoiceIds), new Set(source.acceptedChoiceIds
        .filter(id => item.choices.some(choice => choice.id === id))), `${item.id}: no offered reasonable answer may be rejected`);
    }
  }
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', 6, undefined, 9), makeEnglishActivityRound('en-01', 'scene', 6, undefined, 9));
  assert.equal(makeEnglishActivityRound('en-01', 'scene', 8).length, 6);
  assert.equal(makeEnglishActivityRound('en-07', 'listening', 100).length, 6);
  assert.equal(makeEnglishActivityRound('en-02', 'listening', 4).length, 4);
  assert.deepEqual(makeEnglishActivityRound('en-missing', 'scene'), []);
  assert.deepEqual(makeEnglishActivityRound('cn-01', 'scene'), []);
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', 0), []);
  assert.deepEqual(makeEnglishActivityRound('en-01', 'scene', NaN), []);
  assert.ok(englishActivities.every(item => item.choices.length === 3));
});

test('the fourteen-item birthday listening bank remains reachable across short rounds', () => {
  const expected = new Set(englishActivities.filter(item => item.courseId === 'en-07' && item.kind === 'listening').map(item => item.id));
  assert.equal(expected.size, 14);
  const reached = new Set<string>();
  for (let seed = 0; seed < 100; seed++) {
    // Spread reproducible seeds across the 32-bit range; adjacent tiny seeds
    // have correlated first draws in the factory's seeded LCG.
    const round = makeEnglishActivityRound('en-07', 'listening', 6, undefined, Math.imul(seed + 1, 0x9e3779b1) >>> 0);
    assert.equal(round.length, 6);
    assert.equal(new Set(round.map(item => item.id)).size, 6);
    for (const item of round) reached.add(item.id);
  }
  assert.deepEqual(reached, expected);
  const headwords = englishActivities.filter(item => expected.has(item.id))
    .map(item => lexemes.find(word => word.id === item.lexemeId)!.text);
  assert.deepEqual(new Set(headwords), new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'car', 'book', 'ball', 'cake']));
  const numbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  for (const [index, word] of numbers.entries()) {
    const activity = englishActivities.find(item => item.id === `en07-listen-number-${index + 1}`)!;
    assert.equal(activity.promptText.toLowerCase(), word);
    const correct = activity.choices.filter(choice => activity.acceptedChoiceIds.includes(choice.id));
    assert.deepEqual(correct.map(choice => choice.picture), [`number-${index + 1}`]);
    assert.ok(activity.choices.filter(choice => !activity.acceptedChoiceIds.includes(choice.id))
      .every(choice => choice.picture !== `number-${index + 1}`));
  }
});

test('Hello/Hi and Bye/Goodbye are both accepted when offered together', () => {
  for (const id of ['en01-scene-hello', 'en01-scene-goodbye', 'en01-scene-class']) {
    const activity = englishActivities.find(item => item.id === id)!;
    assert.equal(activity.acceptedChoiceIds.length, 2);
  }
});

test('new scenes accept family aliases and equivalent polite or age replies', () => {
  const alternatives: Record<string, string[]> = {
    'en05-scene-mother': ['She is my mother.', 'She is my mum.'],
    'en05-scene-father': ['He is my father.', 'He is my dad.'],
    'en06-scene-grandfather': ['Yes, he is. He is my grandfather.', 'Yes, he is my grandpa.'],
    'en06-scene-grandmother': ['Yes, she is. She is my grandmother.', 'Yes, she is my grandma.'],
    'en04-scene-thanks': ['Thank you.', 'Thanks!'],
    'en07-scene-birthday': ['Thank you!', 'Thanks!'],
    'en07-scene-age': ['I am eight.', 'Eight.'],
    'en07-scene-welcome': ['You are welcome.', "You're welcome."],
  };
  for (const [id, texts] of Object.entries(alternatives)) {
    const activity = englishActivities.find(item => item.id === id)!;
    assert.ok(activity, id);
    assert.deepEqual(new Set(activity.choices.filter(choice => activity.acceptedChoiceIds.includes(choice.id)).map(choice => choice.text)), new Set(texts),
      `${id}: a reasonable equivalent reply must remain correct`);
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
  for (const unit of units) for (const kind of ['scene', 'listening'] as const) {
    const target = englishActivities.find(item => item.courseId === unit && item.kind === kind)!;
    const skill = kind === 'scene' ? 'context' : 'listening';
    assert.equal(hasEnglishActivities(unit), true);
    assert.equal(hasEnglishActivityReview(target.lexemeId, skill), true);
    assert.equal(hasEnglishActivityReview(target.lexemeId, 'recall'), false);
    const review = makeEnglishActivityRound(unit, kind, 6, [target.lexemeId]);
    assert.ok(review.length > 0);
    assert.ok(review.every(item => item.courseId === unit && item.kind === kind && item.lexemeId === target.lexemeId));
    assert.deepEqual(makeEnglishActivityRound(unit, kind, 6, ['not-a-word']), []);
  }
});

test('every new picture key renders a dedicated picture, not the harbour fallback', () => {
  const pictures = new Set(englishActivities.filter(item => !['en-01', 'en-02'].includes(item.courseId))
    .flatMap(item => [item.picture, ...item.choices.map(choice => choice.picture)]));
  const originalPictures = new Set(englishActivities.filter(item => ['en-01', 'en-02'].includes(item.courseId))
    .flatMap(item => [item.picture, ...item.choices.map(choice => choice.picture)]));
  for (const picture of pictures) {
    if (originalPictures.has(picture)) continue;
    const svg = renderToStaticMarkup(createElement(EnglishPicture, { picture }));
    assert.ok(svg.includes(`data-picture="${picture}"`), `${picture} requires its dedicated SVG renderer`);
    if (picture.startsWith('number-')) {
      const count = Number(picture.slice('number-'.length));
      assert.ok(svg.includes(`data-count="${count}"`), `${picture} must identify its exact quantity`);
      assert.equal((svg.match(/data-count-dot=/g) || []).length, count, `${picture} must draw countable objects`);
    }
    if (picture.startsWith('family-')) {
      const target = picture.slice('family-'.length);
      assert.ok(svg.includes('data-family-tree="Lin"'), `${picture} needs a consistent child anchor`);
      assert.ok(svg.includes('data-anchor='), `${picture} must visibly anchor the family relation`);
      assert.ok(svg.includes(`data-family-target="${target}"`), `${picture} must identify the highlighted family relation`);
      assert.ok(svg.includes('data-highlighted="true"'), `${picture} must highlight exactly the target relative`);
      const highlights = [...svg.matchAll(/data-family-role="([^"]+)" data-highlighted="true"/g)].map(match => match[1]);
      if (target === 'all') assert.ok(highlights.length >= 4 && highlights.includes('Lin'), 'The whole-family picture must include the child and family together');
      else assert.deepEqual(highlights, [target], `${picture} may highlight only its target relative`);
    }
  }
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
