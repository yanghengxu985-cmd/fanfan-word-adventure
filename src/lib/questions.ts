import { getCourseLexemes, lexemes, type Lexeme, type Subject } from '../data/curriculum';

export type RoundMode = 'meaning' | 'context' | 'recall' | 'spelling' | 'writing';
export type QuestionSkill = 'meaning' | 'context' | 'recall' | 'spelling' | 'writing' | 'listening';

export interface Question {
  id: string;
  lexemeId: string;
  skill: QuestionSkill;
  mode: 'selection' | 'context' | 'recall' | 'writing';
  prompt: string;
  clue?: string;
  answer: string;
  acceptedAnswers: string[];
  options?: string[];
  explanation: string;
  subject: Subject;
  /** Oral and paper tasks require a child's or parent's explicit self-check. */
  selfCheck?: boolean;
  caseSensitive?: boolean;
}

export interface ReviewTarget {
  lexemeId: string;
  skill: QuestionSkill;
}

const reviewedStatuses = new Set(['paper_verified', 'preview_verified']);

// A meaning-only cue cannot uniquely identify these English word forms. They remain
// available for cards and oral self-check, but never create automatic spelling evidence.
const ambiguousSpellingTerms = new Set([
  'hello', 'hi', 'goodbye', 'bye',
  'mother', 'mum', 'mom', 'father', 'dad',
  'grandfather', 'grandpa', 'grandmother', 'grandma',
  'look', 'see', 'meet', 'good', 'great', 'cool',
  'thank you', 'thanks', 'i', 'me', 'no', 'not', 'yes', 'right',
]);

export const spellingPracticeNote = '自动拼写仅开放有明确词形线索的部分词条；问候语、同义称呼等在词卡和口头自查中练习，不把合理的同义回应判为拼写错误，也不替另一个词条记录拼写掌握。';

function shuffle<T>(values: readonly T[], random: () => number = Math.random): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

function seededRandom(seed?: number): () => number {
  if (seed === undefined || !Number.isFinite(seed)) return Math.random;
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeAnswer(value: string, subject: Subject): string {
  const normalized = value.normalize('NFKC').replace(/[‘’ʼ]/g, "'").trim();
  if (subject === 'chinese') {
    return normalized.replace(/\s+/g, '').replace(/[。！？!?.,，；;：:]+$/u, '');
  }
  return normalized.toLowerCase().replace(/\s+/g, ' ').replace(/[.!?,;:]+$/, '').trim();
}

export function checkAnswer(question: Question, value: string): boolean {
  if (question.selfCheck) return false;
  const normalize = question.caseSensitive
    ? (answer: string) => answer.normalize('NFKC').trim()
    : (answer: string) => normalizeAnswer(answer, question.subject);
  return question.acceptedAnswers.some(answer => normalize(answer) === normalize(value));
}

function answerForms(item: Lexeme): string[] {
  return [...new Set([item.text, ...item.aliases].map(value => value.trim()).filter(Boolean))];
}

function spellingForms(item: Lexeme): string[] {
  // The word list records a plural for coverage, not an interchangeable spelling of its singular.
  return item.subject === 'english' && normalizeAnswer(item.text, 'english') === 'child'
    ? answerForms(item).filter(form => normalizeAnswer(form, 'english') !== 'children')
    : answerForms(item);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** The exact gap answer is supplied by the example, rather than inferred from a random word. */
function contextGap(item: Lexeme): { sentence: string; answer: string } | undefined {
  if (!item.example?.trim()) return undefined;
  for (const form of answerForms(item).sort((a, b) => b.length - a.length)) {
    const target = form.replace(/[。！？.!?]+$/, '');
    if (!target) continue;
    if (item.subject === 'chinese') {
      const index = item.example.indexOf(target);
      if (index >= 0) {
        const sentence = item.example.slice(0, index) + '____' + item.example.slice(index + target.length);
        // A reduplicated word such as 萧萧 or 汪汪 would otherwise reveal the same character beside the gap.
        if (sentence.includes(target)) return undefined;
        return { sentence, answer: target };
      }
    } else {
      // Letter boundaries stop "I" being removed from "family", or "am" from "Sam".
      const expression = new RegExp(`(^|[^A-Za-z])(${escapeRegExp(target)})(?=$|[^A-Za-z])`, 'i');
      const match = expression.exec(item.example);
      if (match) {
        const index = match.index + match[1]!.length;
        const sentence = item.example.slice(0, index) + '____' + item.example.slice(index + match[2]!.length);
        if (expression.test(sentence)) return undefined;
        return {
          sentence,
          answer: match[2]!,
        };
      }
    }
  }
  return undefined;
}

export function isQuestionEligible(item: Lexeme, mode: RoundMode): boolean {
  if (!reviewedStatuses.has(item.verificationStatus) || item.optional || !item.text.trim()) return false;
  if (item.kind === 'alphabet') return mode !== 'context' && mode !== 'writing';
  if (!item.meaningVerified || !item.meaning.trim()) return false;
  if (mode !== 'meaning' && normalizeAnswer(item.meaning, item.subject).includes(normalizeAnswer(item.text, item.subject))) return false;
  if (mode === 'context') return Boolean(contextGap(item));
  if (mode === 'spelling') {
    return item.subject === 'english'
      && item.writingRequirement !== 'not_required'
      && !answerForms(item).some(form => ambiguousSpellingTerms.has(normalizeAnswer(form, 'english')));
  }
  if (mode === 'writing') {
    return item.subject === 'chinese'
      && item.writingRequirement === 'required'
      && item.readingVerified
      && Boolean(item.pinyin?.trim());
  }
  return true;
}

function meaningKey(value: string): string {
  return value.normalize('NFKC').replace(/[\s\p{P}]/gu, '');
}

function bigrams(value: string): Set<string> {
  const key = meaningKey(value);
  return new Set(Array.from({ length: Math.max(0, key.length - 1) }, (_, index) => key.slice(index, index + 2)));
}

/** Similar or overlapping explanations are withheld from a selection question. */
function meaningsOverlap(first: string, second: string): boolean {
  const a = meaningKey(first);
  const b = meaningKey(second);
  if (!a || !b || a === b || a.includes(b) || b.includes(a)) return true;
  const firstPairs = bigrams(a);
  const secondPairs = bigrams(b);
  const shared = [...firstPairs].filter(pair => secondPairs.has(pair)).length;
  return shared > 0 && shared / Math.min(firstPairs.size, secondPairs.size) >= 0.4;
}

const relatedWords = [
  ['hello', 'hi'], ['goodbye', 'bye'], ['mother', 'mum', 'mom'], ['father', 'dad'],
  ['grandfather', 'grandpa'], ['grandmother', 'grandma'], ['good', 'great', 'cool'],
  ['look', 'see'], ['come', 'go'], ['yes', 'right'], ['name', 'my name'],
];

function related(first: Lexeme, second: Lexeme): boolean {
  const formsA = answerForms(first).map(form => normalizeAnswer(form, first.subject));
  const formsB = answerForms(second).map(form => normalizeAnswer(form, second.subject));
  if (formsA.some(form => formsB.includes(form))) return true;
  if (first.subject === 'chinese' && formsA.some(a => formsB.some(b => a.includes(b) || b.includes(a)))) return true;
  return relatedWords.some(group => formsA.some(form => group.includes(form)) && formsB.some(form => group.includes(form)));
}

function meaningOptions(item: Lexeme, pool: readonly Lexeme[], random: () => number): string[] | undefined {
  const choices = [item.meaning];
  // Definitions, rather than synonymous English headwords, are offered as answers.
  for (const other of shuffle(pool, random)) {
    if (other.id === item.id || other.subject !== item.subject || other.kind === 'alphabet'
      || !isQuestionEligible(other, 'meaning') || related(item, other)) continue;
    // Single-character explanations and word explanations are different teaching units;
    // a description of a word may also be a valid description of one of its characters.
    if (item.subject === 'chinese' && (Array.from(item.text).length === 1) !== (Array.from(other.text).length === 1)) continue;
    if (choices.some(choice => meaningsOverlap(choice, other.meaning))) continue;
    choices.push(other.meaning);
    if (choices.length === 4) break;
  }
  // Two or three genuinely different choices are preferable to an invented fourth one.
  return choices.length >= 2 ? shuffle(choices, random) : undefined;
}

export function createQuestion(item: Lexeme, mode: RoundMode, pool: readonly Lexeme[] = lexemes, random: () => number = Math.random): Question | undefined {
  if (!isQuestionEligible(item, mode)) return undefined;
  const base = { id: `${item.id}:${mode}`, lexemeId: item.id, subject: item.subject };

  if (item.kind === 'alphabet') {
    const upper = item.text.charAt(0).toUpperCase();
    const lower = upper.toLowerCase();
    const explanation = `${upper} 和 ${lower} 是同一个字母的大小写。`;
    if (mode === 'meaning') {
      const distractors = shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(letter => letter !== upper), random).slice(0, 3);
      return { ...base, skill: 'meaning', mode: 'selection', prompt: `小写 ${lower} 对应哪个大写字母？`, answer: upper,
        acceptedAnswers: [upper], options: shuffle([upper, ...distractors], random), explanation, caseSensitive: true };
    }
    return { ...base, skill: mode === 'spelling' ? 'spelling' : 'recall', mode: 'recall',
      prompt: `写出小写 ${lower} 对应的大写字母。`, answer: upper, acceptedAnswers: [upper], explanation, caseSensitive: true };
  }

  if (mode === 'meaning') {
    const options = meaningOptions(item, pool, random);
    if (!options) return undefined;
    return { ...base, skill: 'meaning', mode: 'selection', prompt: `“${item.text}”是什么意思？`,
      answer: item.meaning, acceptedAnswers: [item.meaning], options,
      explanation: item.example ? `${item.meaning}。例句：${item.example}` : item.meaning };
  }

  if (mode === 'context') {
    const gap = contextGap(item);
    if (!gap) return undefined;
    // Free cloze can have multiple sensible answers, so the child checks against the original example.
    return { ...base, skill: 'context', mode: 'context', prompt: gap.sentence, clue: `想一想这个意思：${item.meaning}`,
      answer: gap.answer, acceptedAnswers: [gap.answer], explanation: `这一句的示范是：${item.example}`,
      selfCheck: true };
  }

  if (mode === 'writing') {
    return { ...base, skill: 'writing', mode: 'writing', prompt: '看拼音和意思，在纸上写出这个字词，写好后再揭晓核对。',
      clue: `拼音：${item.pinyin}；意思：${item.meaning}`, answer: item.text, acceptedAnswers: answerForms(item),
      explanation: `${item.text}（${item.pinyin}）。请逐字核对，再由自己或家长确认。`, selfCheck: true };
  }

  const oral = mode === 'recall';
  return { ...base, skill: mode === 'spelling' ? 'spelling' : 'recall', mode: 'recall',
    prompt: mode === 'spelling' ? '按本课词卡的表达练习拼写，同义表达可揭晓后自查。' : '不看选项，先说出你想到的字词，再揭晓自查。意思相同的合理表达也可以。',
    clue: item.meaning, answer: item.text, acceptedAnswers: mode === 'spelling' ? spellingForms(item) : answerForms(item),
    explanation: item.example ? `${item.text}：${item.example}` : `${item.text}：${item.meaning}`,
    selfCheck: oral };
}

function limitCount(limit: number): number {
  return Number.isFinite(limit) ? Math.max(0, Math.min(30, Math.floor(limit))) : 6;
}

function buildRound(items: readonly Lexeme[], mode: RoundMode, limit: number, preferredIds: readonly string[], random: () => number = Math.random): Question[] {
  const preference = new Set(preferredIds);
  const ordered = [...shuffle(items.filter(item => preference.has(item.id)), random), ...shuffle(items.filter(item => !preference.has(item.id)), random)];
  const seen = new Set<string>();
  const questions: Question[] = [];
  for (const item of ordered) {
    // A written and a recognition record for the same text should not create consecutive duplicate questions.
    const key = normalizeAnswer(item.text, item.subject);
    if (seen.has(key)) continue;
    const question = createQuestion(item, mode, lexemes, random);
    if (!question) continue;
    seen.add(key);
    questions.push(question);
    if (questions.length >= limitCount(limit)) break;
  }
  return limitCount(limit) === 0 ? [] : questions;
}

export function makeRound(courseId: string, mode: RoundMode, limit = 6, preferredIds: string[] = [], seed?: number): Question[] {
  return buildRound(getCourseLexemes(courseId), mode, limit, preferredIds, seededRandom(seed));
}

function reviewQuestion(item: Lexeme, skill: QuestionSkill): Question | undefined {
  if (skill === 'listening') return undefined; // No reviewed listening assessment source exists in this version.
  if (skill === 'meaning') {
    if (!isQuestionEligible(item, 'meaning')) return undefined;
    if (item.kind === 'alphabet') return createQuestion(item, 'recall');
    return { id: `${item.id}:review:meaning`, lexemeId: item.id, skill: 'meaning', mode: 'recall',
      subject: item.subject, prompt: `先用自己的话解释“${item.text}”，再揭晓自查。`,
      answer: item.meaning, acceptedAnswers: [item.meaning],
      explanation: item.example ? `${item.meaning}。例句：${item.example}` : item.meaning, selfCheck: true };
  }
  return createQuestion(item, skill);
}

export function makeReviewRound(ids: string[], limit = 6, targets?: ReviewTarget[]): Question[] {
  const count = limitCount(limit);
  if (!count) return [];
  const requested = new Set(ids);
  const byId = new Map(lexemes.map(item => [item.id, item]));
  const scheduled = targets ?? ids.map(lexemeId => ({ lexemeId, skill: 'recall' as const }));
  const seen = new Set<string>();
  const result: Question[] = [];
  for (const target of scheduled) {
    if (!requested.has(target.lexemeId)) continue;
    const key = `${target.lexemeId}:${target.skill}`;
    const item = byId.get(target.lexemeId);
    if (!item || seen.has(key)) continue;
    const question = reviewQuestion(item, target.skill);
    if (!question) continue;
    // Preserve the due skill even when an alphabet's recall widget is reused.
    result.push({ ...question, id: `${key}:review`, skill: target.skill });
    seen.add(key);
    if (result.length >= count) break;
  }
  return result;
}
