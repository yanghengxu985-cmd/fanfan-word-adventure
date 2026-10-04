import type { AttemptInput } from '../lib/progress';

export type LabLessonId = 'cat' | 'greetings' | 'my-your';
export type LabPhase = 'guided' | 'check' | 'transfer';
export type LabPerson = 'Lin' | 'Lan';
export type LabSceneKey = 'cat-ginger' | 'cat-grey' | 'cat-black' | 'boy' | 'girl'
  | 'hello-school' | 'goodbye-school' | 'hello-park' | 'goodbye-park'
  | 'hello-library' | 'goodbye-library' | 'conversation' | 'name-lin' | 'name-lan';
export interface LabVisual {
  scene: LabSceneKey;
  speaker?: LabPerson;
  swapped?: boolean;
  focus?: LabPerson;
}
export interface LabDemo {
  id: string;
  text: string;
  audioId: string;
  visual: LabVisual;
  helpZh: string;
}
export interface LabOption { id: string; visual: LabVisual }
export interface LabQuestion {
  id: string;
  phase: LabPhase;
  lexemeId: string;
  audioId: string;
  answerText: string;
  options: LabOption[];
  correctOptionId: string;
  contextVisual?: LabVisual;
  contextText?: string;
  helpZh: string;
}
export interface LabLesson {
  id: LabLessonId;
  title: string;
  subtitle: string;
  courseId: string;
  cover: LabVisual;
  demos: LabDemo[];
  questions: LabQuestion[];
}

export const labGuideAudioId = 'lab-guide';
export const labInstructionAudioId = 'lab-listen-choose';

const pictureOption = (scene: LabSceneKey): LabOption => ({ id: scene, visual: { scene } });
const catQuestion = (id: string, phase: LabPhase, scene: LabSceneKey, distractor: 'boy' | 'girl'): LabQuestion => ({
  id, phase, lexemeId: 'en-01-word-06', audioId: 'activity-041', answerText: 'A cat.',
  options: [pictureOption(scene), pictureOption(distractor)], correctOptionId: scene,
  helpZh: 'cat 是猫。听到 A cat.，选择猫；颜色和姿势变了，它仍然是猫。',
});
const greetingQuestion = (id: string, phase: LabPhase, greeting: 'hello' | 'goodbye', place: 'school' | 'park' | 'library'): LabQuestion => ({
  id, phase, lexemeId: greeting === 'hello' ? 'en-01-word-01' : 'en-01-word-09',
  audioId: greeting === 'hello' ? 'activity-001' : 'activity-003',
  answerText: greeting === 'hello' ? 'Hello!' : 'Goodbye!',
  options: [pictureOption(`hello-${place}`), pictureOption(`goodbye-${place}`)],
  correctOptionId: `${greeting}-${place}`,
  helpZh: greeting === 'hello' ? '两人刚见面时，可以用 Hello! 打招呼。看人物正在见面还是离开。'
    : '告别、准备离开时，可以说 Goodbye!。看人物是否背上书包走出门口。',
});
const nameQuestion = (id: string, phase: LabPhase, word: 'my' | 'your', speaker: LabPerson, swapped = false): LabQuestion => {
  const listener: LabPerson = speaker === 'Lin' ? 'Lan' : 'Lin';
  const person = word === 'my' ? speaker : listener;
  const scene: LabSceneKey = person === 'Lin' ? 'name-lin' : 'name-lan';
  return {
    id, phase, lexemeId: word === 'my' ? 'en-02-word-05' : 'en-02-word-03',
    // No personal name is spoken in the test prompt: the child must follow who is speaking.
    audioId: word === 'my' ? 'lab-my-name' : 'lab-your-name',
    answerText: `${word === 'my' ? 'My' : 'Your'} name.`,
    options: [pictureOption('name-lin'), pictureOption('name-lan')], correctOptionId: scene,
    contextVisual: { scene: 'conversation', speaker, swapped }, contextText: `${speaker} is speaking.`,
    helpZh: `${speaker} 正在说话，${listener} 正在听。${word === 'my' ? 'my 指说话人自己' : 'your 指正在听话的对方'}，所以这里说的是 ${person} 的名字。换一个人说话，指的人也会变化。`,
  };
};

export const englishLabLessons: LabLesson[] = [
  {
    id: 'cat', title: 'Meet a cat', subtitle: 'Listen · Look · Choose', courseId: 'en-01',
    cover: { scene: 'cat-ginger' },
    demos: [
      { id: 'cat-learn-1', text: 'A cat.', audioId: 'activity-041', visual: { scene: 'cat-ginger' }, helpZh: '看这只猫，听 A cat.，再跟着说一遍。英文文字在学习时显示，检查听懂时会隐藏。' },
      { id: 'cat-learn-2', text: 'A cat.', audioId: 'activity-041', visual: { scene: 'cat-grey' }, helpZh: '这只猫的颜色和上一只不同。它仍然是 cat，听声音，再看看猫的耳朵、胡须和尾巴。' },
    ],
    questions: [catQuestion('cat-practice-1', 'guided', 'cat-ginger', 'boy'), catQuestion('cat-practice-2', 'guided', 'cat-grey', 'girl'),
      catQuestion('cat-check-1', 'check', 'cat-ginger', 'girl'), catQuestion('cat-check-2', 'check', 'cat-grey', 'boy'),
      catQuestion('cat-switch-1', 'transfer', 'cat-black', 'girl'), catQuestion('cat-switch-2', 'transfer', 'cat-black', 'boy')],
  },
  {
    id: 'greetings', title: 'Hello & goodbye', subtitle: 'Meet · Wave · Go', courseId: 'en-01',
    cover: { scene: 'hello-school' },
    demos: [
      { id: 'hello-learn', text: 'Hello!', audioId: 'activity-001', visual: { scene: 'hello-school' }, helpZh: '两位小朋友走近、见面，互相打招呼：Hello!。注意他们正在开始见面。' },
      { id: 'goodbye-learn', text: 'Goodbye!', audioId: 'activity-003', visual: { scene: 'goodbye-school' }, helpZh: '小朋友背上书包走出门口，向留下的朋友告别：Goodbye!。同样是挥手，发生的事情不同。' },
    ],
    questions: [greetingQuestion('hello-practice', 'guided', 'hello', 'school'), greetingQuestion('goodbye-practice', 'guided', 'goodbye', 'school'),
      greetingQuestion('hello-check', 'check', 'hello', 'park'), greetingQuestion('goodbye-check', 'check', 'goodbye', 'park'),
      greetingQuestion('goodbye-switch', 'transfer', 'goodbye', 'library'), greetingQuestion('hello-switch', 'transfer', 'hello', 'library')],
  },
  {
    id: 'my-your', title: 'My name, your name', subtitle: 'Speak · Listen · Switch', courseId: 'en-02',
    cover: { scene: 'conversation', speaker: 'Lin' },
    demos: [
      { id: 'lin-my-learn', text: 'My name is Lin.', audioId: 'activity-025', visual: { scene: 'conversation', speaker: 'Lin', focus: 'Lin' }, helpZh: 'Lin 在说话，my 指 Lin 自己。看亮起来的是 Lin 的姓名卡。' },
      { id: 'lin-your-learn', text: "What's your name?", audioId: 'activity-023', visual: { scene: 'conversation', speaker: 'Lin', focus: 'Lan' }, helpZh: 'Lin 面对 Lan 问名字，your 指正在听话的 Lan。看亮起来的是 Lan 的姓名卡。' },
      { id: 'lan-my-learn', text: 'My name is Lan.', audioId: 'activity-024', visual: { scene: 'conversation', speaker: 'Lan', focus: 'Lan' }, helpZh: '这次换 Lan 说话。my 变成指 Lan 自己，并不永远指某一个人物。' },
      { id: 'lan-your-learn', text: "What's your name?", audioId: 'activity-023', visual: { scene: 'conversation', speaker: 'Lan', focus: 'Lin' }, helpZh: 'Lan 向 Lin 问名字。your 这次指 Lin，不由左右位置决定。' },
    ],
    questions: [nameQuestion('my-practice', 'guided', 'my', 'Lin'), nameQuestion('your-practice', 'guided', 'your', 'Lin'),
      nameQuestion('my-check', 'check', 'my', 'Lan'), nameQuestion('your-check', 'check', 'your', 'Lan'),
      nameQuestion('your-switch', 'transfer', 'your', 'Lan', true), nameQuestion('my-switch', 'transfer', 'my', 'Lan', true)],
  },
];

export function getEnglishLabLesson(id: string | undefined): LabLesson | undefined {
  return englishLabLessons.find(lesson => lesson.id === id);
}
export function getLabLessonForLexeme(lexemeId: string): LabLesson | undefined {
  return englishLabLessons.find(lesson => lesson.questions.some(question => question.lexemeId === lexemeId));
}
export function makeLabQuestions(lesson: LabLesson, reviewLexemeIds?: readonly string[], random: () => number = Math.random): LabQuestion[] {
  const ids = reviewLexemeIds ? new Set(reviewLexemeIds) : undefined;
  return lesson.questions.filter(question => !ids || question.phase !== 'guided' && ids.has(question.lexemeId)).map(question => {
    const options = [...question.options];
    if (random() < .5) options.reverse();
    return { ...question, options };
  });
}
/** First selections stay listening evidence. Guided practice and opened help are assisted. */
export function makeLabAttempt(lessonId: LabLessonId, question: LabQuestion, choiceId: string, assisted: boolean, review = false): AttemptInput {
  return {
    lexemeId: question.lexemeId, skill: 'listening', mode: 'listening',
    correct: choiceId === question.correctOptionId, assisted: question.phase === 'guided' || assisted,
    confirmedBy: 'auto', sourceEvidence: `english-lab:${lessonId}:${review ? 'review' : question.phase}:${question.id}:prompt-ended:first-choice:${choiceId}`,
  };
}
