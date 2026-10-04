import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chineseCompanionHref, chineseLessonHref, chineseReturnHref, isChineseLessonTab, resolveChineseLessonMode } from './chineseLessonNavigation';

test('lesson routes retain old standalone URLs and add direct activity links in either context', () => {
  assert.equal(chineseLessonHref('cn-14'), '#/chinese-lesson/cn-14');
  assert.equal(chineseLessonHref('cn-04', true), '#/chinese-lesson/cn-04/teacher');
  assert.equal(chineseLessonHref('cn-14', false, 'paper'), '#/chinese-lesson/cn-14/paper');
  assert.equal(chineseLessonHref('shanxing', true, 'memory'), '#/chinese-lesson/shanxing/teacher/memory');
  assert.equal(chineseCompanionHref('book-u7-garden', true, 'words'), '#/chinese-companion/book-u7-garden/teacher/words');
});

test('return links preserve the selected lesson and keep teachers out of the personal forest', () => {
  assert.equal(chineseReturnHref('cn-20'), '#/map/chinese/cn-20');
  assert.equal(chineseReturnHref('book-u2-writing'), '#/map/chinese/book-u2-writing');
  assert.equal(chineseReturnHref('cn-20', true), '#/teacher/cn-20');
});

test('unsupported memory or word activities fall back to reading without inventing requirements', () => {
  assert.equal(resolveChineseLessonMode('memory', { read: 'observe', words: 'words', paper: 'paper' }), 'observe');
  assert.equal(resolveChineseLessonMode('words', { read: 'understand', paper: 'paper' }), 'understand');
  assert.equal(resolveChineseLessonMode('memory', { read: 'read', memory: 'recite' }), 'recite');
  assert.equal(resolveChineseLessonMode('paper', { read: 'read', paper: 'write' }), 'write');
  assert.equal(isChineseLessonTab('write'), false);
  assert.equal(isChineseLessonTab('paper'), true);
});
