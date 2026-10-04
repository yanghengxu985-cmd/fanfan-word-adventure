import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  courses, lexemes, getCourseLexemes, inventorySummary,
  lettersByUnit, contractions, properNames,
} from './curriculum';
import { isQuestionEligible, makeRound, normalizeAnswer, type RoundMode } from '../lib/questions';

const englishWords = lexemes.filter(item => item.subject === 'english' && item.kind !== 'alphabet');
const chineseLessons = courses.filter(course => course.subject === 'chinese' && course.kind === 'lesson');
const modes: RoundMode[] = ['meaning', 'context', 'recall', 'spelling', 'writing'];

describe('semester inventory and safe publication', () => {
  it('preserves every separate textbook category with unique record IDs', () => {
    assert.equal(lexemes.length, 929);
    assert.equal(new Set(lexemes.map(item => item.id)).size, lexemes.length);
    const count = (kind: string) => lexemes.filter(item => item.kind === kind).length;
    assert.equal(count('recognition_character'), 276);
    assert.equal(count('writing_character'), 250);
    assert.equal(count('textbook_word'), 250);
    assert.equal(englishWords.length, 127);
    assert.equal(count('alphabet'), 26);
    assert.equal(new Set(lexemes.filter(item => item.kind === 'recognition_character').map(item => item.text)).size, 274);
    assert.equal(inventorySummary.paperPrintVerified, false);
    assert.ok(lexemes.every(item => item.verificationStatus !== 'paper_verified'));
  });

  it('keeps repeated polyphonic characters attached to separate lesson contexts', () => {
    const records = (text: string) => lexemes.filter(item => item.kind === 'recognition_character' && item.text === text);
    assert.deepEqual(records('臂').map(item => item.courseId).sort(), ['cn-02', 'cn-17']);
    assert.deepEqual(records('禁').map(item => item.courseId).sort(), ['cn-13', 'cn-26']);
    assert.equal(new Set(records('禁').map(item => item.id)).size, 2);
  });

  it('gives all 26 lessons real eligible meanings rather than static placeholder cards', () => {
    assert.equal(chineseLessons.length, 26);
    assert.deepEqual(chineseLessons.map(course => course.lessonNumber).sort((a, b) => a! - b!), Array.from({ length: 26 }, (_, index) => index + 1));
    for (const course of chineseLessons) {
      const eligible = getCourseLexemes(course.id).filter(item => isQuestionEligible(item, 'meaning'));
      assert.ok(eligible.length >= 6, `${course.id} has fewer than six reviewed meanings`);
      assert.equal(makeRound(course.id, 'meaning', 6).length, 6, `${course.id} cannot make a complete round`);
    }
  });

  it('holds uncertain 起来 and 贞 outside every grading mode', () => {
    for (const [courseId, text] of [['cn-18', '起来'], ['cn-22', '贞']]) {
      const item = getCourseLexemes(courseId).find(record => record.text === text);
      assert.ok(item, `missing preserved pending entry: ${text}`);
      assert.equal(item.verificationStatus, 'pending_verification');
      assert.equal(item.meaningVerified, false);
      assert.equal(item.readingVerified, false);
      for (const mode of modes) assert.equal(isQuestionEligible(item, mode), false, `${text} leaked into ${mode}`);
    }
  });

  it('does not turn recognition-only lessons into required handwriting targets', () => {
    for (const number of [3, 7, 9, 10, 13, 19, 26]) {
      const items = getCourseLexemes(`cn-${String(number).padStart(2, '0')}`);
      assert.ok(items.length > 0);
      assert.ok(items.every(item => item.kind !== 'writing_character'));
      assert.ok(items.every(item => item.writingRequirement !== 'required'));
      assert.ok(items.every(item => !isQuestionEligible(item, 'writing')));
    }
    assert.equal(courses.some(course => course.id === 'cn-garden-5'), false, 'the writing unit has no invented garden');
  });

  it('keeps stars, aliases and component assets separate from the 127 English records', () => {
    assert.equal(englishWords.filter(item => item.optional).length, 12);
    assert.equal(englishWords.filter(item => !item.optional).length, 115);
    assert.equal(new Set(englishWords.map(item => item.text)).size, 123);
    assert.equal(new Set(englishWords.flatMap(item => [item.text, ...item.aliases])).size, 128);
    assert.deepEqual(Array.from({ length: 8 }, (_, index) => getCourseLexemes(`en-${String(index + 1).padStart(2, '0')}`).length), [13, 11, 17, 9, 18, 12, 31, 16]);
    assert.ok(englishWords.every(item => item.meaningVerified && item.writingRequirement === 'optional'));
    for (const item of englishWords.filter(item => item.optional)) {
      for (const mode of modes) assert.equal(isQuestionEligible(item, mode), false, `optional ${item.text} became a main-line barrier`);
    }
    const aliasExpectations = { Mr: ['Mr.'], mum: ['mom'], grandfather: ['grandpa'], grandmother: ['grandma'], child: ['children'] };
    for (const [text, expected] of Object.entries(aliasExpectations)) {
      assert.deepEqual(englishWords.find(item => item.text === text)?.aliases, expected);
    }
    assert.equal(normalizeAnswer('You’re welcome!', 'english'), normalizeAnswer("you're welcome.", 'english'));
    assert.equal(contractions.length, 7);
    assert.equal(properNames.length, 11);
    assert.ok(!englishWords.some(item => item.text === 'birthday' || item.text === 'morning'), 'phrase components must not inflate source coverage');
  });

  it('matches all 26 pairs to the actual eight-unit letter distribution', () => {
    assert.deepEqual(lettersByUnit.map(group => group.letters.length), [4, 3, 4, 3, 3, 3, 3, 3]);
    assert.deepEqual(lettersByUnit.flatMap(group => group.letters), getCourseLexemes('en-alphabet').map(item => item.text));
    assert.equal(lettersByUnit.flatMap(group => group.letters).map(pair => pair.charAt(0)).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    assert.ok(lettersByUnit.flatMap(group => group.letters).every(pair => pair.length === 2 && pair[0] === pair[1]?.toUpperCase()));
  });

  it('never presents the target inside a Chinese meaning clue used for recall', () => {
    for (const item of lexemes.filter(record => record.subject === 'chinese' && record.meaningVerified)) {
      assert.ok(!item.meaning.includes(item.text), `${item.courseId}: ${item.text} is exposed in its own clue`);
    }
  });

  it('reuses project vocabulary without inventing extra textbook records', () => {
    assert.equal(getCourseLexemes('en-project-1').length, 50);
    assert.equal(getCourseLexemes('en-project-2').length, 77);
    assert.ok(getCourseLexemes('en-project-1').every(item => item.courseId !== 'en-project-1'));
    assert.ok(getCourseLexemes('en-project-2').every(item => item.courseId !== 'en-project-2'));
  });
});
