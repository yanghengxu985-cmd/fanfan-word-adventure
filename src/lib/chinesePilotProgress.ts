import { pilotTasks, type PilotSkill } from '../data/chinesePilot';

export interface PilotAttempt {
  roundId: string; taskId: string; courseId: string; skill: PilotSkill;
  correct: boolean; assisted: boolean; confirmedBy: 'auto' | 'self' | 'parent' | 'teacher'; at: string;
}
export interface PilotProgress { schemaVersion: 1; attempts: PilotAttempt[] }
const STORAGE_KEY = 'fanfan-word-adventure:chinese-pilot:v1';
const taskMap = new Map(pilotTasks.map(t => [t.taskId, t]));
const confirmations = new Set(['auto', 'self', 'parent', 'teacher']);
export function emptyPilotProgress(): PilotProgress { return { schemaVersion: 1, attempts: [] }; }
export function importPilotProgress(text: string): PilotProgress {
  if (text.length > 4_000_000) throw new Error('记录文件过大。');
  const value = JSON.parse(text) as PilotProgress;
  if (value?.schemaVersion !== 1 || !Array.isArray(value.attempts) || value.attempts.length > 10_000) throw new Error('这不是语文样板的学习记录。');
  const seen = new Set<string>();
  for (const a of value.attempts) {
    const task = a && taskMap.get(a.taskId);
    if (!task || a.courseId !== task.courseId || a.skill !== task.skill || typeof a.correct !== 'boolean' || typeof a.assisted !== 'boolean'
      || !confirmations.has(a.confirmedBy) || typeof a.roundId !== 'string' || !a.roundId || a.roundId.length > 100
      || typeof a.at !== 'string' || !Number.isFinite(Date.parse(a.at))) throw new Error('记录中有无法核对的题目或结果。');
    if (['writing', 'recitation', 'dictation'].includes(a.skill) && a.confirmedBy === 'auto') throw new Error('纸上书写需要人工核对。');
    const key = `${a.roundId}:${a.taskId}`;
    if (seen.has(key)) throw new Error('记录中有重复结果。');
    seen.add(key);
  }
  return { schemaVersion: 1, attempts: value.attempts.map(a => ({ roundId: a.roundId, taskId: a.taskId, courseId: a.courseId, skill: a.skill, correct: a.correct, assisted: a.assisted, confirmedBy: a.confirmedBy, at: a.at })) };
}
export function loadPilotProgress(): PilotProgress {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? importPilotProgress(saved) : emptyPilotProgress(); } catch { return emptyPilotProgress(); }
}
export function savePilotProgress(progress: PilotProgress) {
  const valid = importPilotProgress(JSON.stringify(progress));
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(valid)); } catch { throw new Error('浏览器未能保存，请导出本轮学习记录。'); }
}
export function addPilotRound(progress: PilotProgress, attempts: PilotAttempt[]): PilotProgress {
  if (!attempts.length) return progress;
  if (attempts.some(a => a.roundId !== attempts[0].roundId)) throw new Error('一轮记录必须使用同一个轮次编号。');
  if (progress.attempts.some(a => a.roundId === attempts[0].roundId)) return progress;
  return importPilotProgress(JSON.stringify({ schemaVersion: 1, attempts: [...progress.attempts, ...attempts].slice(-10_000) }));
}
export function independentlyWritten(a: PilotAttempt): boolean {
  return ['writing', 'recitation', 'dictation'].includes(a.skill) && a.correct && !a.assisted && (a.confirmedBy === 'parent' || a.confirmedBy === 'teacher');
}
function dayKey(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); }
/** Each task keeps its own error; correcting a glyph choice cannot clear a writing error. */
export function pilotReviews(progress: PilotProgress, now = new Date()) {
  const byTask = new Map<string, PilotAttempt[]>();
  for (const a of progress.attempts) byTask.set(a.taskId, [...(byTask.get(a.taskId) ?? []), a]);
  return [...byTask].flatMap(([id, attempts]) => {
    const sorted = [...attempts].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    let lastError = -1;
    sorted.forEach((a, i) => { if (!a.correct || a.assisted) lastError = i; });
    if (lastError < 0) return [];
    const errorDate = dayKey(new Date(sorted[lastError].at));
    const eligible = sorted.slice(lastError + 1).filter(a => {
      const evidence = ['writing', 'recitation', 'dictation'].includes(a.skill) ? independentlyWritten(a) : a.correct && !a.assisted;
      return evidence && dayKey(new Date(a.at)) > errorDate;
    });
    const goodDays = new Set(eligible.map(a => dayKey(new Date(a.at))));
    const last = sorted[sorted.length - 1];
    const intervals = [1, 3, 7, 14];
    const anchor = eligible[eligible.length - 1] ?? sorted[lastError];
    const dueDate = new Date(anchor.at); dueDate.setDate(dueDate.getDate() + intervals[Math.min(3, goodDays.size)]);
    const task = taskMap.get(id)!;
    return [{ ...task, last, dueDate, due: dayKey(now) >= dayKey(dueDate), correctedDays: goodDays.size }];
  });
}
