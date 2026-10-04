import inventory from './inventory.json';

export type Subject = 'chinese' | 'english';
export type VerificationStatus = 'paper_verified' | 'preview_verified' | 'pending_verification' | 'extension';
export type LexemeKind = 'recognition_character' | 'writing_character' | 'textbook_word' | 'english_word' | 'english_phrase' | 'alphabet';
export type WritingRequirement = 'required' | 'optional' | 'not_required' | 'pending';

export interface Course {
  id: string;
  subject: Subject;
  unitId: string;
  unitNumber: number;
  lessonNumber?: number;
  title: string;
  subtitle: string;
  scene: string;
  kind: 'lesson' | 'garden' | 'unit' | 'project' | 'alphabet';
  linkedCourseIds?: string[];
}

export interface Lexeme {
  id: string;
  courseId: string;
  subject: Subject;
  kind: LexemeKind;
  text: string;
  aliases: string[];
  pinyin?: string;
  meaning: string;
  example?: string;
  verificationStatus: VerificationStatus;
  sourceRef: string;
  sourcePage: string;
  sourceEdition: string;
  sourcePrint: string;
  /** Literal source headword, including printed alternative-spelling notes. */
  sourceHeadword?: string;
  meaningVerified: boolean;
  readingVerified: boolean;
  /** Original editorial explanation; not quoted textbook definitions or a paper-print review. */
  meaningSource?: string;
  /** Synthesized speech is practice only; no textbook audio or speech-scoring claim. */
  audioStatus: 'practice_only' | 'unavailable';
  optional: boolean;
  writingRequirement: WritingRequirement;
  notes?: string;
}

export const courses = inventory.courses as Course[];
export const lexemes = inventory.lexemes as Lexeme[];
export const inventorySummary = inventory.summary;
export const contractions = inventory.contractions;
export const properNames = inventory.properNames;
export const lettersByUnit = inventory.lettersByUnit;

const courseIndex = new Map(courses.map(course => [course.id, course]));
const lexemesByCourse = new Map<string, Lexeme[]>();
for (const item of lexemes) {
  const bucket = lexemesByCourse.get(item.courseId) ?? [];
  bucket.push(item);
  lexemesByCourse.set(item.courseId, bucket);
}

export function getCourseLexemes(courseId: string): Lexeme[] {
  const course = courseIndex.get(courseId);
  if (course?.linkedCourseIds) {
    return course.linkedCourseIds.flatMap(id => lexemesByCourse.get(id) ?? []);
  }
  return lexemesByCourse.get(courseId) ?? [];
}

export const contentNotes = {
  chinese: '依据同目录新版公开预览；2026年纸本第109—116页尚待核对。识字表有276个展示项，教材标注250个新生字，不能混为一个数量。',
  english: '依据同ISBN、2024年第一版、2025年第2次印刷原书；2026年第3次印刷词表尚待核对。127条单元记录包含短语；星号词为选学，非星号词也未全部确认默写要求。',
  explanations: '中文简明释义和例句为本项目编辑的教学素材；英文释义按原书词表目视核对。词条来自公开预览不等于用户纸本已逐项核对。英语采用英式女声的固定慢读音频，语文采用设备朗读；均为合成示范，仅供跟读和自查。',
};
