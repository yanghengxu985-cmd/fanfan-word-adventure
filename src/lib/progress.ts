/** Local, versioned evidence. A correct choice and an independent recall are different events. */
export const PROGRESS_VERSION = 1 as const;
export const PROGRESS_STORAGE_KEY = 'fanfan-word-adventure:progress:v1';
export const SKILLS = ['meaning', 'context', 'recall', 'spelling', 'writing', 'listening'] as const;
export type Skill = (typeof SKILLS)[number];
export type AttemptMode = 'selection' | 'recall' | 'context' | 'spelling' | 'writing' | 'listening';
export type ConfirmedBy = 'self' | 'parent' | 'teacher' | 'auto';
export type ProgressStatus = 'unseen' | 'learning' | 'passed' | 'stable';

export interface Attempt {
  id: string;
  lexemeId: string;
  skill: Skill;
  correct: boolean;
  assisted: boolean;
  confirmedBy: ConfirmedBy;
  timestamp: string;
  localDate: string;
  mode: AttemptMode;
  sourceEvidence: string;
}

export interface Progress {
  version: typeof PROGRESS_VERSION;
  attempts: Attempt[];
}

export interface AttemptInput {
  lexemeId: string;
  skill: Skill;
  /** null means cancelled/unavailable. It produces no learning event. */
  correct: boolean | null;
  assisted?: boolean;
  confirmedBy?: ConfirmedBy;
  timestamp?: string;
  mode?: AttemptMode;
  sourceEvidence?: string;
}

export interface SkillState {
  status: ProgressStatus;
  attempts: number;
  correctAttempts: number;
  independentDays: number;
  successfulDays: number;
  lastAttemptAt: string | null;
  dueAt: string | null;
  nextReviewDays: number | null;
  isDue: boolean;
}

export interface LexemeState {
  status: ProgressStatus;
  skills: Record<Skill, SkillState>;
  practicedSkills: number;
  stableSkills: number;
  isDue: boolean;
}

type AllowedIds = ReadonlySet<string> | readonly string[];
const MODES: readonly AttemptMode[] = ['selection', 'recall', 'context', 'spelling', 'writing', 'listening'];
const CONFIRMERS: readonly ConfirmedBy[] = ['self', 'parent', 'teacher', 'auto'];
const REVIEW_DAYS = [1, 3, 7, 14];
const MAX_IMPORT_BYTES = 5_000_000;
const MAX_ATTEMPTS = 20_000;
const SAFE_ID = /^[\p{L}\p{N}_.:/-]{1,160}$/u;

export function createEmptyProgress(): Progress {
  return { version: PROGRESS_VERSION, attempts: [] };
}

/** Calendar days use the student's local timezone, never UTC slicing. */
export function localDateKey(date: Date = new Date()): string {
  if (!Number.isFinite(date.getTime())) throw new Error('时间无效。');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function plusLocalDays(timestamp: string, days: number): string {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function asIdSet(ids?: AllowedIds): ReadonlySet<string> | undefined {
  return ids === undefined ? undefined : ids instanceof Set ? ids : new Set(ids);
}

function isIndependent(attempt: Attempt): boolean {
  if (!attempt.correct || attempt.assisted || !attempt.sourceEvidence.trim()) return false;
  if (attempt.mode === 'selection' || attempt.mode === 'listening') return false;
  // A child's self-confirmation after seeing the answer is not verified handwriting evidence.
  if (attempt.skill === 'writing' || attempt.mode === 'writing') {
    return attempt.mode === 'writing' && (attempt.confirmedBy === 'parent' || attempt.confirmedBy === 'teacher');
  }
  return ['recall', 'context', 'spelling'].includes(attempt.mode);
}

export function recordAttempt(
  progress: Progress,
  input: AttemptInput,
  allowedIds?: AllowedIds,
  now: Date = new Date(),
): Progress {
  if (progress.version !== PROGRESS_VERSION) throw new Error('备份版本不受支持。');
  if (input.correct === null) return progress;
  const timestamp = input.timestamp ?? now.toISOString();
  const attempt: Attempt = {
    id: typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `attempt-${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    lexemeId: input.lexemeId,
    skill: input.skill,
    correct: input.correct,
    assisted: input.assisted ?? false,
    confirmedBy: input.confirmedBy ?? 'auto',
    timestamp,
    localDate: localDateKey(new Date(timestamp)),
    mode: input.mode ?? 'selection',
    sourceEvidence: input.sourceEvidence ?? 'local-answer-key',
  };
  validateAttempt(attempt, asIdSet(allowedIds), now);
  if (progress.attempts.length >= MAX_ATTEMPTS) throw new Error('练习记录已满，请先导出备份。');
  return { version: PROGRESS_VERSION, attempts: [...progress.attempts, attempt] };
}

export function getSkillState(
  progress: Progress,
  lexemeId: string,
  skill: Skill,
  now: Date = new Date(),
): SkillState {
  const attempts = progress.attempts
    .filter((attempt) => attempt.lexemeId === lexemeId && attempt.skill === skill && Date.parse(attempt.timestamp) <= now.getTime())
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  if (!attempts.length) return {
    status: 'unseen', attempts: 0, correctAttempts: 0, independentDays: 0, successfulDays: 0,
    lastAttemptAt: null, dueAt: null, nextReviewDays: null, isDue: false,
  };
  let lastWrong = -1;
  attempts.forEach((attempt, index) => { if (!attempt.correct) lastWrong = index; });
  const afterWrong = attempts.slice(lastWrong + 1);
  const successes = afterWrong.filter((attempt) => attempt.correct && !attempt.assisted
    && ((attempt.skill !== 'writing' && attempt.mode !== 'writing') || isIndependent(attempt)));
  const successDays = new Set(successes.map((attempt) => attempt.localDate));
  const independent = afterWrong.filter(isIndependent);
  const independentDays = new Set(independent.map((attempt) => attempt.localDate));
  const hasRecallOrContext = independent.some((attempt) => ['recall', 'context', 'spelling', 'writing'].includes(attempt.mode));
  const stable = independentDays.size >= 2 && hasRecallOrContext;
  const last = attempts.at(-1)!;
  const status: ProgressStatus = stable ? 'stable' : successes.length ? 'passed' : 'learning';
  // Hints and repeated choices never grow the interval; only new independent days do.
  const nextReviewDays = last.correct
    ? REVIEW_DAYS[Math.min(Math.max(independentDays.size - 1, 0), REVIEW_DAYS.length - 1)]
    : 1;
  const reviewAnchor = independent.at(-1) ?? successes.at(-1) ?? attempts.at(lastWrong) ?? last;
  const dueAt = plusLocalDays(reviewAnchor.timestamp, nextReviewDays);
  return {
    status, attempts: attempts.length, correctAttempts: attempts.filter((attempt) => attempt.correct).length,
    independentDays: independentDays.size, successfulDays: successDays.size,
    lastAttemptAt: last.timestamp, dueAt, nextReviewDays,
    isDue: localDateKey(new Date(dueAt)) <= localDateKey(now),
  };
}

/**
 * Without requiredSkills, status summarizes only practiced skills, not whole-word mastery.
 * Pass a lexeme's reviewed requiredSkills when presenting a whole-word completion badge.
 */
export function getLexemeState(
  progress: Progress,
  lexemeId: string,
  now: Date = new Date(),
  requiredSkills?: readonly Skill[],
): LexemeState {
  const skills = Object.fromEntries(SKILLS.map((skill) => [skill, getSkillState(progress, lexemeId, skill, now)])) as Record<Skill, SkillState>;
  const practiced = Object.values(skills).filter((state) => state.status !== 'unseen');
  const masteryScope = requiredSkills?.length
    ? [...new Set(requiredSkills)].map((skill) => skills[skill])
    : practiced;
  const status: ProgressStatus = !practiced.length ? 'unseen'
    : masteryScope.every((state) => state.status === 'stable') ? 'stable'
    : practiced.some((state) => state.status === 'learning') ? 'learning' : 'passed';
  return {
    status, skills, practicedSkills: practiced.length,
    stableSkills: practiced.filter((state) => state.status === 'stable').length,
    isDue: practiced.some((state) => state.isDue),
  };
}

export function getDueReviews(progress: Progress, allowedIds?: AllowedIds, now: Date = new Date()) {
  const allowed = asIdSet(allowedIds);
  const pairs = new Map<string, { lexemeId: string; skill: Skill }>();
  progress.attempts.forEach(({ lexemeId, skill }) => {
    if (!allowed || allowed.has(lexemeId)) pairs.set(`${lexemeId}\u0000${skill}`, { lexemeId, skill });
  });
  return [...pairs.values()]
    .map((pair) => ({ ...pair, ...getSkillState(progress, pair.lexemeId, pair.skill, now) }))
    .filter((review) => review.isDue)
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
}

export function getProgressSummary(progress: Progress, allowedIds?: AllowedIds, now: Date = new Date()) {
  const allowed = asIdSet(allowedIds);
  const ids = [...new Set(progress.attempts.map((attempt) => attempt.lexemeId))].filter((id) => !allowed || allowed.has(id));
  const states = ids.map((id) => getLexemeState(progress, id, now));
  return {
    practiced: states.filter((state) => state.status !== 'unseen').length,
    passed: states.filter((state) => state.status === 'passed').length,
    stable: states.filter((state) => state.status === 'stable').length,
    learning: states.filter((state) => state.status === 'learning').length,
    due: getDueReviews(progress, allowedIds, now).length,
    attempts: progress.attempts.filter((attempt) => Date.parse(attempt.timestamp) <= now.getTime() && (!allowed || allowed.has(attempt.lexemeId))).length,
    todayAttempts: progress.attempts.filter((attempt) => attempt.localDate === localDateKey(now) && Date.parse(attempt.timestamp) <= now.getTime() && (!allowed || allowed.has(attempt.lexemeId))).length,
  };
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype;
}

function rejectUnsafeKeys(value: unknown, depth = 0): void {
  if (depth > 20) throw new Error('备份结构过深，无法安全读取。');
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('备份包含不安全字段。');
    rejectUnsafeKeys((value as Record<string, unknown>)[key], depth + 1);
  }
}

function validateAttempt(value: unknown, allowedIds: ReadonlySet<string> | undefined, now: Date): asserts value is Attempt {
  if (!plainObject(value)) throw new Error('练习记录格式无效。');
  if (typeof value.id !== 'string' || !SAFE_ID.test(value.id)) throw new Error('练习记录编号无效。');
  if (typeof value.lexemeId !== 'string' || !SAFE_ID.test(value.lexemeId) || (allowedIds && !allowedIds.has(value.lexemeId))) throw new Error('备份含有当前词库之外的词条。');
  if (!SKILLS.includes(value.skill as Skill) || !MODES.includes(value.mode as AttemptMode) || !CONFIRMERS.includes(value.confirmedBy as ConfirmedBy)) throw new Error('练习技能或方式无效。');
  if (typeof value.correct !== 'boolean' || typeof value.assisted !== 'boolean') throw new Error('练习结果格式无效。');
  if (typeof value.timestamp !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.timestamp)) throw new Error('练习时间格式无效。');
  const timestamp = Date.parse(value.timestamp);
  if (!Number.isFinite(timestamp) || timestamp < Date.UTC(2020, 0, 1) || timestamp > now.getTime()) throw new Error('备份含有无效或未来的练习时间。');
  if (new Date(timestamp).toISOString().replace('.000Z', 'Z') !== value.timestamp.replace('.000Z', 'Z')) throw new Error('练习日期不存在。');
  if (typeof value.localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.localDate)) throw new Error('练习本地日期无效。');
  // Permit valid historical dates from another timezone without recomputing them on import.
  const dateParts = value.localDate.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
  if (calendarDate.toISOString().slice(0, 10) !== value.localDate || Math.abs(Date.parse(`${value.localDate}T12:00:00Z`) - timestamp) > 36 * 60 * 60 * 1000) throw new Error('练习日期与时间不匹配。');
  if (typeof value.sourceEvidence !== 'string' || value.sourceEvidence.length > 500) throw new Error('练习依据格式无效。');
}

export function importProgress(text: string, allowedIds: AllowedIds, now: Date = new Date()): Progress {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES) throw new Error('备份过大，请选择小于 5 MB 的文件。');
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new Error('这不是有效的 JSON 备份。'); }
  rejectUnsafeKeys(parsed);
  if (!plainObject(parsed) || parsed.version !== PROGRESS_VERSION) throw new Error('备份版本不受支持。');
  if (!Array.isArray(parsed.attempts) || parsed.attempts.length > MAX_ATTEMPTS) throw new Error('备份记录数量无效。');
  const allowed = asIdSet(allowedIds);
  const seen = new Set<string>();
  const attempts = parsed.attempts.map((value: unknown) => {
    validateAttempt(value, allowed, now);
    if (seen.has(value.id)) throw new Error('备份有重复记录。');
    seen.add(value.id);
    return {
      id: value.id, lexemeId: value.lexemeId, skill: value.skill, correct: value.correct,
      assisted: value.assisted, confirmedBy: value.confirmedBy, timestamp: value.timestamp,
      localDate: value.localDate, mode: value.mode, sourceEvidence: value.sourceEvidence,
    };
  });
  return { version: PROGRESS_VERSION, attempts };
}

export function exportProgress(progress: Progress): string {
  return JSON.stringify({ version: PROGRESS_VERSION, attempts: progress.attempts }, null, 2);
}

export interface ProgressStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }

/** Storage failures are visible; session-memory practice remains usable. */
export function createProgressStore(allowedIds: AllowedIds, providedStorage?: ProgressStorage | null) {
  let memory = createEmptyProgress();
  let storage: ProgressStorage | null = null;
  let warning: string | null = null;
  try {
    storage = providedStorage === undefined ? (typeof localStorage === 'undefined' ? null : localStorage) : providedStorage;
  } catch { storage = null; }
  if (!storage) warning = '浏览器无法保存进度，本次练习只保留到关闭页面；请导出备份。';
  const store = {
    get availability(): 'persistent' | 'memory' { return storage ? 'persistent' : 'memory'; },
    get warning(): string | null { return warning; },
    load(now: Date = new Date()): Progress {
      if (!storage) return memory;
      try {
        const text = storage.getItem(PROGRESS_STORAGE_KEY);
        if (text) memory = importProgress(text, allowedIds, now);
      } catch (error) {
        warning = `已有进度暂时无法读取：${error instanceof Error ? error.message : '存储不可用'} 原始备份未被覆盖。`;
        storage = null;
      }
      return memory;
    },
    save(progress: Progress, now: Date = new Date()): void {
      // Validation happens before replacing either memory or persistent data.
      if (progress.version !== PROGRESS_VERSION) throw new Error('备份版本不受支持。');
      const clean = importProgress(exportProgress(progress), allowedIds, now);
      memory = clean;
      if (!storage) return;
      try { storage.setItem(PROGRESS_STORAGE_KEY, exportProgress(clean)); }
      catch { storage = null; warning = '进度保存失败，已改为本次会话保存；请导出备份。'; }
    },
  };
  return store;
}
