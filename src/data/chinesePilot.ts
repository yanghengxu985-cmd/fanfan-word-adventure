import raw from './chinesePilot.json';

export type DetectiveKind = 'reading' | 'glyph' | 'grouping';
export type PilotSkill = DetectiveKind | 'writing' | 'recitation' | 'dictation';
export interface DetectiveQuestion {
  id: string; kind: DetectiveKind; prompt: string;
  options: { id: string; text: string }[]; answerId: string; explanation: string;
}
export interface PaperItem {
  id: string; prompt: string; pinyin: string; answers: string[]; explanation: string;
  audioId: string; targetCharacters: string[]; lexemeIds: string[];
  sourceKind: string; sourcePage: string; dictationRequirement?: string;
}
export interface CharacterItem {
  id: string; character: string; pinyin: string; context: string; audioId: string;
  lexemeId: string; sourcePage: string; wordExamples: { text: string; pinyin: string }[];
}
export interface Poem {
  id: string; title: string; author: string; dynasty: string;
  dictationRequirement: string; lines: { id: string; text: string; pinyin: string; audioId: string }[];
}
export interface PilotLesson {
  courseId: string; title: string; lessonNumber: number; unitNumber: number;
  recognitionCharacters: CharacterItem[]; writingCharacters: CharacterItem[];
  words: { text: string; pinyin: string; audioId: string }[];
  detectiveQuestions: DetectiveQuestion[]; writingItems: PaperItem[]; recitationItems: PaperItem[];
  recitation: { requirementNote: string; poems: Poem[] };
}
export const pilotLessons = raw.lessons as unknown as PilotLesson[];
export const pilotSources = raw.sources;
export const skillNames: Record<PilotSkill, string> = { reading: '字音', glyph: '辨字', grouping: '组词辨认', writing: '字词纸写', recitation: '诗句补写', dictation: '整首默写' };
export function wholePoemItems(lesson: PilotLesson): PaperItem[] {
  return lesson.recitation.poems.filter(p => p.dictationRequirement === 'textbook_required').map(p => ({
    id: `${lesson.courseId}-dictate-${p.id}`, prompt: `在纸上默写《${p.title}》的四句诗，写上标点。`,
    pinyin: '', answers: [p.lines.map(l => l.text).join('\n')], explanation: '按四行逐字核对，特别注意“生处”“坐爱”和标点。',
    audioId: '', targetCharacters: [...new Set(p.lines.flatMap(l => [...l.text].filter(c => /\p{Script=Han}/u.test(c))))],
    lexemeIds: [], sourceKind: 'public_domain_poem', sourcePage: '14—15', dictationRequirement: 'textbook_required',
  }));
}
export const pilotTasks = pilotLessons.flatMap(l => [
  ...l.detectiveQuestions.map(q => ({ courseId: l.courseId, taskId: q.id, skill: q.kind, prompt: q.prompt, item: q })),
  ...(['writing', 'recitation', 'dictation'] as const).flatMap(skill => (skill === 'writing' ? l.writingItems : skill === 'recitation' ? l.recitationItems : wholePoemItems(l)).map(item => ({ courseId: l.courseId, taskId: item.id, skill, prompt: item.prompt, item }))),
]);
/** Fisher–Yates, with unpractised tasks first; choices never keep a fixed answer position. */
export function selectPilotRound<T extends { id: string }>(bank: T[], used: Set<string>, limit = 6, random = Math.random): T[] {
  const shuffle = (values: T[]) => { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.min(i, Math.floor(random() * (i + 1))); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return [...shuffle(bank.filter(x => !used.has(x.id))), ...shuffle(bank.filter(x => used.has(x.id)))].slice(0, limit);
}
