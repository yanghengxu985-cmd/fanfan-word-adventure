import { courses } from '../data/curriculum';
import { chineseBookCompanions } from '../data/chineseBookCompanions';
import { isChineseLessonTab, type ChineseLessonTab } from './chineseLessonNavigation';

const chineseCourseIndex = new Map(courses.filter(course => course.subject === 'chinese').map(course => [course.id, course]));
const companionIndex = new Map(chineseBookCompanions.map(companion => [companion.id, companion]));

/** Old shared course and game links retain a useful destination in the unified forest. */
export function resolveChineseLegacyRoute(segments: readonly string[]): string[] | null {
  if (!['course', 'play'].includes(segments[0])) return null;
  const course = chineseCourseIndex.get(segments[1]);
  if (!course) return null;
  const paper = ['writing', 'recall'].includes(segments[2]);
  const tab: ChineseLessonTab = segments[0] === 'course' ? 'read' : paper ? 'paper' : segments[2] === 'context' ? 'practice' : 'words';
  if (course.kind === 'garden') {
    const id = `book-u${course.unitNumber}-garden`;
    return companionIndex.has(id) ? ['chinese-companion', id, ...(tab === 'read' ? [] : [tab])] : null;
  }
  return ['chinese-lesson', course.id, ...(tab === 'read' ? [] : [tab])];
}

export function getChineseRouteOptions(segments: readonly string[]): { teacher: boolean; initialTab: ChineseLessonTab } {
  const teacher = segments[2] === 'teacher';
  const requested = segments[teacher ? 3 : 2];
  return { teacher, initialTab: isChineseLessonTab(requested) ? requested : 'read' };
}

/** Viewing is distinct from an exercise. Teacher, planning and invalid links produce no view event. */
export function getChineseViewedCourseId(segments: readonly string[]): string | null {
  const [page, id] = segments;
  if (segments.includes('teacher')) return null;
  if (page === 'chinese-lesson') {
    if (id === 'shanxing') return 'cn-04';
    return chineseCourseIndex.get(id)?.kind === 'lesson' ? id : null;
  }
  if (page === 'chinese-companion' && companionIndex.has(id)) return id;
  return null;
}
