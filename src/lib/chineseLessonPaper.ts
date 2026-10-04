export type PaperCheck = { courseId: string; at: string; type: 'words' | 'memory' | 'poem'; targetIds: string[]; needsPractice: string[]; adult: boolean };
export const lessonPaperKey = 'fanfan-chinese-lessons:paper:v1';
export function readPaperChecks(storage: Pick<Storage, 'getItem'>): PaperCheck[] {
  try {
    const value = JSON.parse(storage.getItem(lessonPaperKey) || 'null');
    if (!value || value.version !== 1 || !Array.isArray(value.checks)) return [];
    return value.checks.filter((item: PaperCheck) => item && typeof item.courseId === 'string' && /^cn-(?:\d{2}|garden-\d)$/.test(item.courseId)
      && typeof item.at === 'string' && Number.isFinite(Date.parse(item.at)) && typeof item.adult === 'boolean'
      && ['words', 'memory', 'poem'].includes(item.type) && Array.isArray(item.targetIds) && item.targetIds.length > 0 && item.targetIds.every(id => typeof id === 'string')
      && Array.isArray(item.needsPractice) && item.needsPractice.every(id => typeof id === 'string' && item.targetIds.includes(id))).slice(-100);
  } catch { return []; }
}
export function savePaperCheck(storage: Pick<Storage, 'getItem' | 'setItem'>, check: PaperCheck) {
  const checks = readPaperChecks(storage);
  storage.setItem(lessonPaperKey, JSON.stringify({ version: 1, checks: [...checks, check].slice(-100) }));
}
