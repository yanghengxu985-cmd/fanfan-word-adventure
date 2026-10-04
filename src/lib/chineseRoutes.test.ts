import test from 'node:test';
import assert from 'node:assert/strict';
import { courses } from '../data/curriculum';
import { chineseBookCompanions } from '../data/chineseBookCompanions';
import { getChineseRouteOptions, getChineseViewedCourseId, resolveChineseLegacyRoute } from './chineseRoutes';

test('all old Chinese course cards open the matching lesson or garden without a second directory', () => {
  for (const course of courses.filter(item => item.subject === 'chinese')) {
    const route = resolveChineseLegacyRoute(['course', course.id]);
    assert.deepEqual(route, course.kind === 'garden' ? ['chinese-companion', `book-u${course.unitNumber}-garden`] : ['chinese-lesson', course.id]);
  }
  assert.equal(resolveChineseLegacyRoute(['course', 'en-01']), null);
  assert.equal(resolveChineseLegacyRoute(['course', 'missing-course']), null);
});

test('legacy Chinese exercise links retain a relevant direct task and English links remain unchanged', () => {
  assert.deepEqual(resolveChineseLegacyRoute(['play', 'cn-01', 'writing']), ['chinese-lesson', 'cn-01', 'paper']);
  assert.deepEqual(resolveChineseLegacyRoute(['play', 'cn-01', 'meaning']), ['chinese-lesson', 'cn-01', 'words']);
  assert.deepEqual(resolveChineseLegacyRoute(['play', 'cn-08', 'context']), ['chinese-lesson', 'cn-08', 'practice']);
  assert.equal(resolveChineseLegacyRoute(['play', 'en-01', 'context']), null);
});

test('student and teacher direct tabs resolve without mistaking a tab for teacher mode', () => {
  assert.deepEqual(getChineseRouteOptions(['chinese-lesson', 'cn-01', 'paper']), { teacher: false, initialTab: 'paper' });
  assert.deepEqual(getChineseRouteOptions(['chinese-lesson', 'cn-01', 'teacher', 'words']), { teacher: true, initialTab: 'words' });
  assert.deepEqual(getChineseRouteOptions(['chinese-lesson', 'cn-01', 'invalid']), { teacher: false, initialTab: 'read' });
});

test('only the 49 real student entries count as viewing, with Shanxing belonging to lesson four', () => {
  const lessons = courses.filter(course => course.subject === 'chinese' && course.kind === 'lesson');
  assert.equal(lessons.length + chineseBookCompanions.length, 49);
  for (const course of lessons) {
    assert.equal(getChineseViewedCourseId(['chinese-lesson', course.id]), course.id);
    assert.equal(getChineseViewedCourseId(['chinese-lesson', course.id, 'teacher', 'paper']), null);
  }
  for (const companion of chineseBookCompanions) {
    assert.equal(getChineseViewedCourseId(['chinese-companion', companion.id]), companion.id);
    assert.equal(getChineseViewedCourseId(['chinese-companion', companion.id, 'teacher']), null);
  }
  assert.equal(getChineseViewedCourseId(['chinese-lesson', 'shanxing']), 'cn-04');
  assert.equal(getChineseViewedCourseId(['chinese-lesson', 'missing']), null);
  assert.equal(getChineseViewedCourseId(['chinese-book', 'cn-04']), null);
});
