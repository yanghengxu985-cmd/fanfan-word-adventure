import { courses, lexemes } from '../data/curriculum';
import { chineseBookCompanions } from '../data/chineseBookCompanions';
import { pilotTasks } from '../data/chinesePilot';
import { emptyPilotProgress, importPilotProgress, independentlyWritten, type PilotProgress } from './chinesePilotProgress';
import { lessonPaperKey, readPaperChecks, type PaperCheck } from './chineseLessonPaper';
import { getDueReviews, getSkillState, importProgress, localDateKey, PROGRESS_STORAGE_KEY, type Progress } from './progress';

export const CHINESE_PILOT_STORAGE_KEY = 'fanfan-word-adventure:chinese-pilot:v1';
export const SHANXING_PAPER_STORAGE_KEY = 'fanfan-shanxing:paper-check:v1';
export const CHINESE_VIEWS_STORAGE_KEY = 'fanfan-chinese-lessons:views:v1';
export const CHINESE_RECORDS_UPDATED_EVENT = 'fanfan:chinese-records-updated';
export const LEARNING_BACKUP_FORMAT = 'fanfan-learning-backup';

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export type ChineseLessonView = { courseId: string; firstViewedAt: string; lastViewedAt: string; visits: number };
export type ChineseViews = { version: 1; lessons: ChineseLessonView[] };
export type ShanxingPaperCheck = { at: string; adult: boolean; errors: string[] };
export type ChineseLearningRecords = {
  progress: Progress; pilot: PilotProgress; paper: PaperCheck[]; shanxing: ShanxingPaperCheck | null;
  views: ChineseViews; warnings: string[];
};
export type ChineseCourseSummary = {
  courseId: string; title: string; viewed: boolean; lastViewedAt: string | null;
  practiceAttempts: number; selfChecks: number; adultChecks: number; paperChecks: number;
  legacyPilotAttempts: number; legacyShanxingChecks: number;
  /** A successful adult check is evidence for that occasion, never a whole-course mastery badge. */
  adultChecksWithoutErrors: number; pendingPaper: number;
};
export type ChinesePaperReview = {
  id: string; courseId: string; courseTitle: string; targetId: string; label: string;
  type: PaperCheck['type']; at: string; adult: boolean; source: 'lesson' | 'pilot' | 'shanxing';
  wordsHref: string; paperHref: string;
};
export type ChineseWordDueReview = ReturnType<typeof getDueReviews>[number] & { text: string; courseId: string; courseTitle: string; href: string;
  paperRecheckedAt?: string; paperRecheckedBy?: 'self' | 'adult' };
export type LearningBackup = {
  format: typeof LEARNING_BACKUP_FORMAT; version: 1; createdAt: string; progress: Progress;
  chinese: { pilot: PilotProgress | null; paper: { version: 1; checks: PaperCheck[] } | null;
    shanxing: ShanxingPaperCheck | null; views: ChineseViews | null };
};
export type LearningBackupCandidate = { kind: 'bundle'; backup: LearningBackup; progress: Progress }
  | { kind: 'legacy'; progress: Progress };

const chineseCourses = courses.filter(course => course.subject === 'chinese');
const courseById = new Map(chineseCourses.map(course => [course.id, course]));
const viewIds = new Set([...courseById.keys(), ...chineseBookCompanions.map(item => item.id)]);
const allLexemeIds = new Set(lexemes.map(item => item.id));
const lexemeById = new Map(lexemes.map(item => [item.id, item]));
const taskById = new Map(pilotTasks.map(item => [item.taskId, item]));
const paperSkills = new Set(['writing', 'recitation', 'dictation']);
const safeId = /^[\p{L}\p{N}_.:/-]{1,160}$/u;
const emptyViews = (): ChineseViews => ({ version: 1, lessons: [] });
const poemNames: Record<string, string> = { wangdongting: '望洞庭', shanxing: '山行', yeshusuojian: '夜书所见', luchai: '鹿柴', wangtianmenshan: '望天门山', yinhushang: '饮湖上初晴后雨' };

function browserStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}
function rejectUnsafeKeys(value: unknown, depth = 0): void {
  if (depth > 20) throw new Error('备份结构过深。');
  if (!value || typeof value !== 'object') return;
  for (const key of Object.keys(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('备份包含不安全字段。');
    rejectUnsafeKeys((value as Record<string, unknown>)[key], depth + 1);
  }
}
function validDate(value: unknown, now: Date): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
    && Date.parse(value) >= Date.UTC(2020, 0, 1) && Date.parse(value) <= now.getTime();
}
function validatePilot(value: unknown, now: Date): PilotProgress {
  const clean = importPilotProgress(JSON.stringify(value));
  if (clean.attempts.some(attempt => !validDate(attempt.at, now))) throw new Error('语文练习记录含无效或未来时间。');
  return clean;
}
function validatePaper(value: unknown, now: Date): { version: 1; checks: PaperCheck[] } {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.checks) || value.checks.length > 100) throw new Error('纸笔检查备份格式无效。');
  const checks = readPaperChecks({ getItem: () => JSON.stringify(value) });
  if (checks.length !== value.checks.length || checks.some(check => !courseById.has(check.courseId) || !validDate(check.at, now)
    || check.targetIds.length > 250 || check.needsPractice.length > 250
    || check.targetIds.some(id => !safeId.test(id))
    || new Set(check.targetIds).size !== check.targetIds.length || new Set(check.needsPractice).size !== check.needsPractice.length)) {
    throw new Error('纸笔检查备份含有无法核对的记录。');
  }
  return { version: 1, checks: checks.map(check => ({ courseId: check.courseId, at: check.at, type: check.type,
    targetIds: [...check.targetIds], needsPractice: [...check.needsPractice], adult: check.adult })) };
}
function validateShanxing(value: unknown, now: Date): ShanxingPaperCheck {
  if (!object(value) || !validDate(value.at, now) || typeof value.adult !== 'boolean'
    || !Array.isArray(value.errors) || value.errors.length > 3
    || !value.errors.every(error => ['glyph', 'missing', 'punctuation'].includes(error))
    || new Set(value.errors).size !== value.errors.length) throw new Error('《山行》纸笔备份格式无效。');
  return { at: value.at, adult: value.adult, errors: [...value.errors] as string[] };
}
function validateViews(value: unknown, now: Date): ChineseViews {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.lessons) || value.lessons.length > viewIds.size) throw new Error('课程浏览备份格式无效。');
  const seen = new Set<string>();
  const lessons = value.lessons.map(entry => {
    if (!object(entry) || typeof entry.courseId !== 'string' || !viewIds.has(entry.courseId) || seen.has(entry.courseId)
      || !validDate(entry.firstViewedAt, now) || !validDate(entry.lastViewedAt, now)
      || Date.parse(entry.lastViewedAt) < Date.parse(entry.firstViewedAt)
      || typeof entry.visits !== 'number' || !Number.isSafeInteger(entry.visits) || entry.visits < 1 || entry.visits > 1_000_000) throw new Error('课程浏览备份含无效记录。');
    seen.add(entry.courseId);
    return { courseId: entry.courseId, firstViewedAt: entry.firstViewedAt, lastViewedAt: entry.lastViewedAt, visits: entry.visits };
  });
  return { version: 1, lessons };
}
function readValidated<T>(storage: ReadStorage | null, key: string, validate: (value: unknown) => T, fallback: T, warnings: string[]): T {
  if (!storage) return fallback;
  try {
    const text = storage.getItem(key);
    if (text === null) return fallback;
    const value: unknown = JSON.parse(text); rejectUnsafeKeys(value);
    return validate(value);
  } catch { warnings.push('有一类语文记录暂时无法读取，原记录仍保留。'); return fallback; }
}

/** A read never repairs, truncates, migrates or writes persistent records. */
export function loadChineseLearningRecords(progress: Progress, storage: ReadStorage | null = browserStorage(), now = new Date()): ChineseLearningRecords {
  const warnings: string[] = storage ? [] : ['浏览器暂时不能读取语文记录。'];
  return { progress, warnings,
    pilot: readValidated(storage, CHINESE_PILOT_STORAGE_KEY, value => validatePilot(value, now), emptyPilotProgress(), warnings),
    paper: readValidated(storage, lessonPaperKey, value => validatePaper(value, now).checks, [], warnings),
    shanxing: readValidated(storage, SHANXING_PAPER_STORAGE_KEY, value => validateShanxing(value, now), null as ShanxingPaperCheck | null, warnings),
    views: readValidated(storage, CHINESE_VIEWS_STORAGE_KEY, value => validateViews(value, now), emptyViews(), warnings),
  };
}
export function notifyChineseRecordsChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHINESE_RECORDS_UPDATED_EVENT));
}
/** Call only for a student lesson route. Teacher routes return before even reading storage. */
export function recordChineseLessonView(courseId: string, options: { teacher?: boolean; storage?: ReadStorage & Pick<Storage, 'setItem'> | null; now?: Date } = {}): boolean {
  if (options.teacher || !viewIds.has(courseId)) return false;
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  if (!storage) return false;
  const now = options.now ?? new Date();
  const warnings: string[] = [];
  const views = readValidated(storage, CHINESE_VIEWS_STORAGE_KEY, value => validateViews(value, now), emptyViews(), warnings);
  if (warnings.length) return false; // Do not replace a corrupt original with an empty history.
  const at = now.toISOString();
  const old = views.lessons.find(item => item.courseId === courseId);
  if (old?.lastViewedAt === at) return true;
  const row: ChineseLessonView = { courseId, firstViewedAt: old?.firstViewedAt ?? at, lastViewedAt: at, visits: Math.min((old?.visits ?? 0) + 1, 1_000_000) };
  try {
    storage.setItem(CHINESE_VIEWS_STORAGE_KEY, JSON.stringify({ version: 1, lessons: [...views.lessons.filter(item => item.courseId !== courseId), row] }));
    notifyChineseRecordsChanged(); return true;
  } catch { return false; }
}

function reviewLabel(targetId: string): string {
  return lexemeById.get(targetId)?.text
    ?? poemNames[targetId]
    ?? taskById.get(targetId)?.prompt ?? '这次纸稿中的一项';
}
function courseHref(courseId: string, tab: 'words' | 'paper'): string {
  const course = courseById.get(courseId);
  return course?.kind === 'garden' ? `#/chinese-companion/book-u${course.unitNumber}-garden/${tab}` : `#/chinese-lesson/${courseId}/${tab}`;
}
export function getChineseWordDueReviews(records: ChineseLearningRecords, now = new Date()): ChineseWordDueReview[] {
  const pairs = new Map<string, { lexemeId: string; skill: Progress['attempts'][number]['skill'] }>();
  for (const attempt of records.progress.attempts) if (lexemeById.get(attempt.lexemeId)?.subject === 'chinese') {
    pairs.set(`${attempt.lexemeId}:${attempt.skill}`, { lexemeId: attempt.lexemeId, skill: attempt.skill });
  }
  return [...pairs.values()].flatMap(pair => {
    const lexeme = lexemeById.get(pair.lexemeId)!;
    const state = getSkillState(records.progress, pair.lexemeId, pair.skill, now);
    let paperRecheckedAt: string | undefined;
    let paperRecheckedBy: 'self' | 'adult' | undefined;
    let dueAt = state.dueAt;
    // The old word game and the new paper tool retain separate evidence stores. Only an exact word-writing
    // check renews this writing reminder for one day; its adult checkbox proves neither independence nor mastery.
    if (pair.skill === 'writing') {
      const latestPaper = [...records.paper].reverse().filter(check => (check.type === 'words'
        || check.type === 'memory' && lexeme.kind === 'writing_character') && check.courseId === lexeme.courseId
        && check.targetIds.includes(lexeme.id) && (!state.lastAttemptAt || Date.parse(check.at) >= Date.parse(state.lastAttemptAt)))
        .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
      if (latestPaper) {
        const date = new Date(latestPaper.at); date.setDate(date.getDate() + 1); date.setHours(0, 0, 0, 0);
        dueAt = date.toISOString(); paperRecheckedAt = latestPaper.at; paperRecheckedBy = latestPaper.adult ? 'adult' : 'self';
      }
    }
    const isDue = !!dueAt && localDateKey(new Date(dueAt)) <= localDateKey(now);
    if (!isDue) return [];
    return [{ ...pair, ...state, dueAt, isDue, ...(paperRecheckedAt ? { paperRecheckedAt, paperRecheckedBy, nextReviewDays: 1 } : {}),
      text: lexeme.text, courseId: lexeme.courseId, courseTitle: courseById.get(lexeme.courseId)?.title ?? '语文课程',
      href: courseHref(lexeme.courseId, pair.skill === 'writing' || pair.skill === 'recall' ? 'paper' : 'words') }];
  }).sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!));
}
/** Latest checks resolve only their exact targets and evidence type; a word choice cannot clear handwriting. */
export function getChinesePaperReviews(records: ChineseLearningRecords): ChinesePaperReview[] {
  const events: Array<{ courseId: string; type: PaperCheck['type']; targetId: string; label?: string; needsPractice: boolean;
    canResolve: boolean; at: string; adult: boolean; source: ChinesePaperReview['source'] }> = [];
  for (const check of records.paper) for (const targetId of check.targetIds) events.push({ ...check, targetId,
    needsPractice: check.needsPractice.includes(targetId), canResolve: true, source: 'lesson' });
  for (const attempt of records.pilot.attempts.filter(item => paperSkills.has(item.skill))) {
    events.push({ courseId: attempt.courseId, type: attempt.skill === 'writing' ? 'words' : 'poem', targetId: attempt.taskId,
      at: attempt.at, adult: attempt.confirmedBy === 'parent' || attempt.confirmedBy === 'teacher', source: 'pilot',
      needsPractice: !attempt.correct || attempt.assisted, canResolve: independentlyWritten(attempt) });
  }
  if (records.shanxing) events.push({ courseId: 'cn-04', targetId: 'shanxing', type: 'poem', at: records.shanxing.at,
    adult: records.shanxing.adult, source: 'shanxing', needsPractice: records.shanxing.errors.length > 0, canResolve: true,
    label: `《山行》${records.shanxing.errors.map(error => ({ glyph: '字形', missing: '漏字漏句', punctuation: '标点' })[error]).join('、')}` });
  const current = new Map<string, typeof events[number]>();
  for (const event of events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))) {
    const key = `${event.courseId}:${event.type}:${event.targetId}`;
    if (event.needsPractice) current.set(key, event);
    else if (event.canResolve) current.delete(key);
  }
  return [...current].map(([id, event]) => ({ id, courseId: event.courseId, courseTitle: courseById.get(event.courseId)?.title ?? '语文课程',
    targetId: event.targetId, label: event.label ?? reviewLabel(event.targetId), type: event.type,
    at: event.at, adult: event.adult, source: event.source,
    wordsHref: courseHref(event.courseId, 'words'), paperHref: courseHref(event.courseId, 'paper'),
  })).sort((a, b) => Date.parse(b.at) - Date.parse(a.at) || a.id.localeCompare(b.id));
}
export function summarizeChineseLessons(records: ChineseLearningRecords): ChineseCourseSummary[] {
  const reviews = getChinesePaperReviews(records);
  const entries = [...chineseCourses.filter(course => course.kind === 'lesson').map(course => ({ id: course.id, title: course.title, recordId: course.id })),
    ...chineseBookCompanions.map(item => ({ id: item.id, title: item.title, recordId: item.kind === 'garden' ? `cn-garden-${item.unit}` : item.id }))];
  return entries.map(course => {
    const main = records.progress.attempts.filter(attempt => lexemeById.get(attempt.lexemeId)?.courseId === course.recordId);
    const pilot = records.pilot.attempts.filter(attempt => attempt.courseId === course.recordId);
    const checks = records.paper.filter(check => check.courseId === course.recordId);
    const legacy = course.id === 'cn-04' && records.shanxing ? [records.shanxing] : [];
    const pilotPaper = pilot.filter(attempt => paperSkills.has(attempt.skill));
    const mainPaper = main.filter(attempt => attempt.mode === 'writing');
    const view = records.views.lessons.filter(item => item.courseId === course.id || item.courseId === course.recordId)
      .sort((a, b) => Date.parse(b.lastViewedAt) - Date.parse(a.lastViewedAt))[0];
    return { courseId: course.id, title: course.title, viewed: !!view, lastViewedAt: view?.lastViewedAt ?? null,
      practiceAttempts: main.filter(attempt => attempt.mode !== 'writing').length + pilot.filter(attempt => !paperSkills.has(attempt.skill)).length,
      selfChecks: checks.filter(check => !check.adult).length + legacy.filter(check => !check.adult).length
        + pilotPaper.filter(attempt => attempt.confirmedBy === 'self').length + mainPaper.filter(attempt => attempt.confirmedBy === 'self').length,
      adultChecks: checks.filter(check => check.adult).length + legacy.filter(check => check.adult).length
        + pilotPaper.filter(attempt => ['parent', 'teacher'].includes(attempt.confirmedBy)).length + mainPaper.filter(attempt => ['parent', 'teacher'].includes(attempt.confirmedBy)).length,
      adultChecksWithoutErrors: checks.filter(check => check.adult && !check.needsPractice.length).length + legacy.filter(check => check.adult && !check.errors.length).length
        + pilotPaper.filter(independentlyWritten).length + mainPaper.filter(attempt => attempt.correct && !attempt.assisted && ['parent', 'teacher'].includes(attempt.confirmedBy)).length,
      paperChecks: checks.length + legacy.length + pilotPaper.length + mainPaper.length,
      legacyPilotAttempts: pilot.length, legacyShanxingChecks: legacy.length,
      pendingPaper: reviews.filter(review => review.courseId === course.recordId).length,
    };
  });
}
export function getForestLearningSummaries(records: ChineseLearningRecords, now = new Date()): Record<string, { browsed: boolean; practiced: number; paperChecks: number; due: number }> {
  const due = getChineseWordDueReviews(records, now);
  return Object.fromEntries(summarizeChineseLessons(records).map(summary => [summary.courseId, {
    browsed: summary.viewed, practiced: summary.practiceAttempts, paperChecks: summary.paperChecks,
    due: summary.pendingPaper + due.filter(review => {
      const courseId = lexemeById.get(review.lexemeId)?.courseId;
      const course = courseId ? courseById.get(courseId) : undefined;
      return (course?.kind === 'garden' ? `book-u${course.unitNumber}-garden` : courseId) === summary.courseId;
    }).length,
  }]));
}

/** This bundles only learning evidence. Preferences and unrelated browser storage are never exported or imported. */
export function createLearningBackup(progress: Progress, storage: ReadStorage | null = browserStorage(), now = new Date()): LearningBackup {
  if (!storage) throw new Error('浏览器无法读取全部语文记录，当前未生成全记录备份。请保留当前浏览器记录，恢复存储访问后再导出。');
  const read = <T,>(key: string, validate: (value: unknown) => T): T | null => {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw); rejectUnsafeKeys(value);
    return validate(value);
  };
  return { format: LEARNING_BACKUP_FORMAT, version: 1, createdAt: now.toISOString(),
    progress: importProgress(JSON.stringify(progress), allLexemeIds, now),
    chinese: { pilot: read(CHINESE_PILOT_STORAGE_KEY, value => validatePilot(value, now)),
      paper: read(lessonPaperKey, value => validatePaper(value, now)), shanxing: read(SHANXING_PAPER_STORAGE_KEY, value => validateShanxing(value, now)),
      views: read(CHINESE_VIEWS_STORAGE_KEY, value => validateViews(value, now)) } };
}
export function exportLearningBackup(backup: LearningBackup): string { return JSON.stringify(backup, null, 2); }
export function parseLearningBackup(text: string, now = new Date()): LearningBackupCandidate {
  if (new TextEncoder().encode(text).length > 10_000_000) throw new Error('备份过大，请选择小于 10 MB 的文件。');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('这不是有效的 JSON 备份。'); }
  rejectUnsafeKeys(value);
  if (!object(value)) throw new Error('备份格式无效。');
  if (!('format' in value)) return { kind: 'legacy', progress: importProgress(text, allLexemeIds, now) };
  if (value.format !== LEARNING_BACKUP_FORMAT || value.version !== 1 || !validDate(value.createdAt, now) || !object(value.chinese)) throw new Error('全记录备份版本或格式无效。');
  const chinese = value.chinese;
  if (!['pilot', 'paper', 'shanxing', 'views'].every(key => key in chinese)) throw new Error('全记录备份缺少语文记录字段。');
  const progress = importProgress(JSON.stringify(value.progress), allLexemeIds, now);
  const backup: LearningBackup = { format: LEARNING_BACKUP_FORMAT, version: 1, createdAt: value.createdAt, progress,
    chinese: { pilot: chinese.pilot === null ? null : validatePilot(chinese.pilot, now), paper: chinese.paper === null ? null : validatePaper(chinese.paper, now),
      shanxing: chinese.shanxing === null ? null : validateShanxing(chinese.shanxing, now), views: chinese.views === null ? null : validateViews(chinese.views, now) } };
  return { kind: 'bundle', backup, progress };
}
/** Full preflight, then scoped writes with rollback. Pass the returned progress into the existing main store/UI. */
export function restoreLearningBackup(candidate: LearningBackupCandidate, storage: WriteStorage, now = new Date()): Progress {
  const clean = parseLearningBackup(JSON.stringify(candidate.kind === 'bundle' ? candidate.backup : candidate.progress), now);
  const entries: Array<[string, string | null]> = [[PROGRESS_STORAGE_KEY, JSON.stringify(clean.progress)]];
  if (clean.kind === 'bundle') {
    const data = clean.backup.chinese;
    for (const [key, value] of [[CHINESE_PILOT_STORAGE_KEY, data.pilot], [lessonPaperKey, data.paper],
      [SHANXING_PAPER_STORAGE_KEY, data.shanxing], [CHINESE_VIEWS_STORAGE_KEY, data.views]] as const) entries.push([key, value === null ? null : JSON.stringify(value)]);
  }
  const previous = entries.map(([key]) => [key, storage.getItem(key)] as const);
  try { for (const [key, value] of entries) { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } }
  catch {
    let rollbackFailed = false;
    for (const [key, value] of previous) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); } catch { rollbackFailed = true; }
    }
    throw new Error(rollbackFailed ? '导入保存失败，恢复原记录也受到了存储限制。请保留原备份文件并检查浏览器存储。' : '导入保存失败，原记录已恢复。');
  }
  notifyChineseRecordsChanged();
  return clean.progress;
}
