import activitiesJson from './englishActivities.json';
import { lexemes } from './curriculum';

export type EnglishActivityKind = 'scene' | 'listening';
export type PictureKey = string;
export interface EnglishActivityChoice {
  id: string;
  text?: string;
  picture: PictureKey;
  description: string;
  audioId?: string;
}
export interface EnglishActivity {
  id: string;
  courseId: string;
  kind: EnglishActivityKind;
  lexemeId: string;
  scene: string;
  picture: PictureKey;
  promptText: string;
  promptAudioId: string;
  choices: EnglishActivityChoice[];
  acceptedChoiceIds: string[];
  explanation: string;
  modelText: string;
  modelAudioId: string;
  dialogueAudioId?: string;
  oralCue: string;
}
export const englishActivities = activitiesJson as EnglishActivity[];
const byLexeme = new Map(lexemes.map(item => [item.id, item]));
export function hasEnglishActivities(courseId: string): boolean {
  return englishActivities.some(item => item.courseId === courseId);
}
export function hasEnglishActivityReview(lexemeId: string, skill: string): boolean {
  const kind = skill === 'context' ? 'scene' : skill === 'listening' ? 'listening' : undefined;
  return !!kind && englishActivities.some(item => item.lexemeId === lexemeId && item.kind === kind);
}
function eligible(activity: EnglishActivity) {
  const word = byLexeme.get(activity.lexemeId);
  return word?.subject === 'english' && word.courseId === activity.courseId && word.meaningVerified
    && word.readingVerified && word.audioStatus !== 'unavailable' && !word.optional
    && ['paper_verified', 'preview_verified'].includes(word.verificationStatus);
}
function randomFrom(seed?: number) {
  if (seed === undefined) return Math.random;
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
/** Original practice scenes, separate from textbook vocabulary and independent recall evidence. */
export function makeEnglishActivityRound(courseId: string, kind: EnglishActivityKind, limit = 6, preferredLexemeIds?: string[], seed?: number): EnglishActivity[] {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const count = Math.min(6, Math.max(4, Math.floor(limit)));
  const random = randomFrom(seed);
  const preferred = preferredLexemeIds ? new Set(preferredLexemeIds) : undefined;
  const pool = englishActivities.filter(item => item.courseId === courseId && item.kind === kind && eligible(item)
    && (!preferred || preferred.has(item.lexemeId)));
  return shuffle(pool, random).slice(0, count).map((activity, index) => {
    const accepted = new Set(activity.acceptedChoiceIds);
    const right = shuffle(activity.choices.filter(choice => accepted.has(choice.id)), random);
    const wrong = shuffle(activity.choices.filter(choice => !accepted.has(choice.id)), random);
    const candidates = index < 2 ? [right[0], wrong[0]].filter(Boolean) : activity.choices;
    const choices = shuffle(candidates, random);
    return { ...activity, choices, acceptedChoiceIds: choices.filter(choice => accepted.has(choice.id)).map(choice => choice.id) };
  });
}

