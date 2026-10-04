/** Shared route vocabulary. A missing activity falls back to the lesson's reading view. */
export type ChineseLessonTab = 'read' | 'words' | 'paper' | 'memory' | 'practice';

const chineseLessonTabs: readonly ChineseLessonTab[] = ['read', 'words', 'paper', 'memory', 'practice'];

export function isChineseLessonTab(value: unknown): value is ChineseLessonTab {
  return typeof value === 'string' && chineseLessonTabs.includes(value as ChineseLessonTab);
}

export function resolveChineseLessonMode<T extends string>(
  requested: ChineseLessonTab | undefined,
  modes: { read: T } & Partial<Record<Exclude<ChineseLessonTab, 'read'>, T>>,
): T {
  return requested ? modes[requested] ?? modes.read : modes.read;
}

export function chineseReturnHref(id: string, teacher = false): string {
  return teacher ? `#/teacher/${encodeURIComponent(id)}` : `#/map/chinese/${encodeURIComponent(id)}`;
}

export function chineseLessonHref(id: string, teacher = false, tab?: ChineseLessonTab): string {
  return `#/chinese-lesson/${encodeURIComponent(id)}${teacher ? '/teacher' : ''}${tab && tab !== 'read' ? `/${tab}` : ''}`;
}

export function chineseCompanionHref(id: string, teacher = false, tab?: ChineseLessonTab): string {
  return `#/chinese-companion/${encodeURIComponent(id)}${teacher ? '/teacher' : ''}${tab && tab !== 'read' ? `/${tab}` : ''}`;
}
