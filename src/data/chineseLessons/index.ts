import semesterPlan from '../chineseSemesterPlan.json';
import { lexemes } from '../curriculum';
import { earlyLessonMaterials } from './early';
import { lateLessonMaterials } from './late';
import type { ChineseLessonMaterial } from './types';

export const chineseLessonMaterials: ChineseLessonMaterial[] = [...earlyLessonMaterials, ...lateLessonMaterials];
export const lessonMaterialById = new Map(chineseLessonMaterials.map(item => [item.courseId, item]));
export const lessonCourseById = new Map(semesterPlan.courses.map(course => [course.id, course]));
const lexemeById = new Map(lexemes.map(item => [item.id, item]));
export type LessonCourse = typeof semesterPlan.courses[number];
export type WordCategory = 'recognition' | 'writing' | 'words';
export type LessonWord = {
  id: string; text: string; pinyin: string | null; readingVerified: boolean;
  meaning: string; context: string; examples: { text: string; pinyin: string | null; id?: string }[];
};
const allWords = semesterPlan.courses.flatMap(course => course.words);

export function getLessonWords(course: LessonCourse, category: WordCategory): LessonWord[] {
  return course[category].map(item => {
    const lexeme = lexemeById.get(item.lexemeId);
    const grouping = course.grouping.find(group => group.character === item.text);
    const matching = [...course.words, ...allWords.filter(word => word.lexemeId.split('-').slice(0, 2).join('-') !== course.id)]
      .filter(word => word.text.includes(item.text) && word.readingVerified && word.pinyin);
    const examples: LessonWord['examples'] = [];
    for (const word of grouping?.wordExamples || []) if (!examples.some(example => example.text === word.text)) examples.push({ text: word.text, pinyin: word.pinyin });
    for (const word of matching) if (!examples.some(example => example.text === word.text)) examples.push({ text: word.text, pinyin: word.pinyin, id: word.lexemeId });
    return { id: item.lexemeId, text: item.text, pinyin: item.readingVerified ? item.pinyin : null, readingVerified: item.readingVerified,
      meaning: lexeme?.meaningVerified ? lexeme.meaning : '', context: lexeme?.example || '', examples: examples.slice(0, 3) };
  });
}

export type PaperWord = { id: string; text: string; pinyin: string };
export function getLessonPaperWords(course: LessonCourse): PaperWord[] {
  return course.words.filter(item => item.readingVerified && item.pinyin).map(item => ({ id: item.lexemeId, text: item.text, pinyin: item.pinyin! }));
}

export const completedChineseLessonIds = new Set(chineseLessonMaterials.map(item => item.courseId));
