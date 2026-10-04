import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import type { ChineseLessonMaterial } from '../src/data/chineseLessons/types';

const root = new URL('../', import.meta.url);
const plan = JSON.parse(readFileSync(new URL('src/data/chineseSemesterPlan.json', root), 'utf8'));
const clips: Record<string, { text: string; pinyin: string; sourceKind: string; sourceRef: string }> = {};
for (const course of plan.courses) for (const item of course.words) {
  if (item.readingVerified && item.pinyin) clips[item.lexemeId] = { text: item.text, pinyin: item.pinyin, sourceKind: 'textbook_word', sourceRef: `同目录公开预览词语表 ${item.sourcePage}；2026纸本待复核` };
}
if (!process.argv.includes('--words-only')) {
  for (const bank of ['early', 'late']) {
    const path = new URL(`src/data/chineseLessons/${bank}.ts`, root);
    if (!existsSync(path)) throw new Error(`尚未完成 ${bank} 的课程数据`);
    const imported = await import(path.href);
    const materials: ChineseLessonMaterial[] = imported[`${bank}LessonMaterials`];
    for (const lesson of materials) {
      for (const [index, step] of lesson.steps.entries()) clips[`${lesson.courseId}-explain-${index}`] = { text: step.summary, pinyin: '', sourceKind: 'original_explanation', sourceRef: '本项目原创辅导讲解；不是教材正文朗读' };
      for (const poem of lesson.poems || []) for (const [index, line] of poem.lines.entries()) clips[`${lesson.courseId}-poem-${poem.id}-${index}`] = { text: line.text, pinyin: line.pinyin, sourceKind: 'public_domain_poem', sourceRef: `${poem.dynasty} ${poem.author}《${poem.title}》；公版原诗，按现代普通话练读` };
    }
  }
}
writeFileSync(new URL('src/data/chineseLessonsAudioClips.json', root), JSON.stringify(clips, null, 2) + '\n', 'utf8');
console.log(`已整理 ${Object.keys(clips).length} 个中文练习音频片段。`);
