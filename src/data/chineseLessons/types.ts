export type LessonStep = {
  label: string;
  summary: string;
  prompt: string;
  explanation: string;
};

export type LessonChoice = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type LessonActivity =
  | { kind: 'order'; title: string; instruction: string; items: string[]; explanation: string }
  | { kind: 'classify'; title: string; instruction: string; groups: string[]; items: { text: string; group: number }[]; explanation: string }
  | { kind: 'compare'; title: string; instruction: string; options: { label: string; detail: string }[]; question: string; explanation: string }
  | { kind: 'predict'; title: string; instruction: string; explanation: string }
  | { kind: 'evidence'; title: string; instruction: string; explanation: string };

export type LessonPoem = {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  lines: { text: string; pinyin: string; meaning: string; clue: string }[];
  note: string;
};

export type ChineseLessonMaterial = {
  courseId: string;
  intro: string;
  steps: LessonStep[];
  activity: LessonActivity;
  choices: LessonChoice[];
  teacherPrompts: string[];
  sourceNotes: string;
  sourceUrls: string[];
  poems?: LessonPoem[];
  classicalText?: { text: string; meaning: string }[];
};
