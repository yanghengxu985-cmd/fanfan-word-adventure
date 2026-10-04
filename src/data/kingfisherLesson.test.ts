import test from 'node:test';
import assert from 'node:assert/strict';
import { birdLessonCopy } from './kingfisherLesson';
import { lessonCourseById } from './chineseLessons';
import { getKingfisherFrame, KINGFISHER_DURATION } from '../lib/kingfisherMotion';

test('the independent lesson gives writing guidance for every required character without promoting recognition-only characters', () => {
  const course = lessonCourseById.get('cn-14')!;
  const required = course.writing.map(item => item.text).sort();
  assert.deepEqual(birdLessonCopy.writingFocus.map(item => item.character).sort(), required);
  assert.equal(new Set(birdLessonCopy.writingFocus.map(item => item.character)).size, required.length);
  assert.ok(course.recognition.some(item => item.text === '衔'));
  assert.ok(!birdLessonCopy.writingFocus.some(item => item.character === '衔'));
});

test('each classroom verb shortcut seeks to a frame that demonstrates that action', () => {
  for (const verb of birdLessonCopy.verbs) {
    assert.ok(verb.at > 0 && verb.at < KINGFISHER_DURATION);
    const frame = getKingfisherFrame(verb.at);
    assert.ok(frame.activeVerbs.includes(verb.id), `${verb.character} shortcut must show its action`);
  }
  const flight = birdLessonCopy.verbs.find(item => item.id === 'fei')!;
  const standing = birdLessonCopy.verbs.find(item => item.id === 'zhan')!;
  assert.ok(getKingfisherFrame(flight.at).hasFish, 'the emerging bird already holds the fish');
  assert.ok(getKingfisherFrame(standing.at).hasFish, 'landing does not swallow the fish prematurely');
  assert.ok(!getKingfisherFrame(KINGFISHER_DURATION).hasFish);
});
