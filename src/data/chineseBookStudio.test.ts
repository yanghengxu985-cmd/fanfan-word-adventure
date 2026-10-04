import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { studioUnits, lessonDesigns } from './chineseBookStudio';
import { chineseBookCompanions } from './chineseBookCompanions';
import semesterPlan from './chineseSemesterPlan.json';

test('全册安排与已确认的26课、8单元逐一对应，没有沿用旧版课次', () => {
  assert.deepEqual(studioUnits.map(item => item.number), [1, 2, 3, 4, 5, 6, 7, 8]);
  const lessons = semesterPlan.courses.filter(item => item.kind === 'lesson');
  assert.equal(lessons.length, 26);
  assert.deepEqual(lessonDesigns.map(item => item.courseId), lessons.map(item => item.id));
  assert.equal(new Set(lessonDesigns.map(item => item.courseId)).size, 26);
  for (const design of lessonDesigns) for (const key of ['focus', 'form', 'practice', 'check', 'note'] as const) assert.ok(design[key].trim(), `${design.courseId} 缺少${key}`);
});

test('配套覆盖4次口语、8习作、7园地及阅读例文，期末复习另列', () => {
  const count = (kind: string) => chineseBookCompanions.filter(item => item.kind === kind).length;
  assert.deepEqual(['speaking', 'writing', 'garden', 'reading', 'example', 'review'].map(count), [4, 8, 7, 1, 2, 1]);
  assert.equal(new Set(chineseBookCompanions.map(item => item.id)).size, 23);
  assert.deepEqual(chineseBookCompanions.filter(item => item.kind === 'garden').map(item => item.unit), [1, 2, 3, 4, 6, 7, 8]);
  assert.equal(chineseBookCompanions.find(item => item.unit === 8 && item.kind === 'writing')?.title, '那次经历真难忘');
  for (const item of chineseBookCompanions) assert.ok(studioUnits.some(unit => unit.number === item.unit));
});

test('网页下载和文档与逐课字词及要求的源数据保持一致', () => {
  const script = fileURLToPath(new URL('../../scripts/export-chinese-book-plan.ts', import.meta.url));
  execFileSync(process.execPath, ['--import', 'tsx', script, '--check'], { cwd: fileURLToPath(new URL('../../', import.meta.url)), stdio: 'pipe' });
});

test('下载安排包括园地三表，保留全册276个识字表展示项、250个会写字与250个词语', () => {
  const content = readFileSync(new URL('../../docs/CHINESE_BOOK_STUDIO_PLAN.md', import.meta.url), 'utf8');
  const total = (label: string) => [...content.matchAll(new RegExp(`${label}（(\\d+)）`, 'g'))].reduce((sum, match) => sum + Number(match[1]), 0);
  assert.deepEqual(['会认字', '会写字', '课内词语'].map(total), [276, 250, 250]);
});
