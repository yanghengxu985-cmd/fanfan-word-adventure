import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Backpack, BookOpen, ChevronLeft, ChevronRight, Download, Feather, Leaf, Search, X } from 'lucide-react';
import semesterPlan from '../data/chineseSemesterPlan.json';
import { chineseBookCompanions, type BookCompanion } from '../data/chineseBookCompanions';
import { studioUnits } from '../data/chineseBookStudio';
import './chineseForest.css';

export type ChineseForestCourseSummary = {
  browsed?: boolean;
  practiced?: number;
  paperChecks?: number;
  due?: number;
};

export type ChineseForestProps = {
  teacher?: boolean;
  selectedId?: string;
  currentCourseId?: string;
  courseSummaries?: Record<string, ChineseForestCourseSummary>;
  reviewHref?: string;
};

const lessons = semesterPlan.courses.filter(course => course.kind === 'lesson');
const kindLabels: Record<BookCompanion['kind'], string> = {
  writing: '习作', speaking: '口语交际', garden: '语文园地', reading: '快乐读书吧', example: '习作例文', review: '期末复习',
};
const skimLessons = new Set([3, 7, 9, 10, 13, 19, 26]);
const PAGE_SIZE = 4;

function canonicalId(id?: string) {
  const gardenUnit = id?.match(/^cn-garden-([1-8])$/)?.[1];
  return gardenUnit ? `book-u${gardenUnit}-garden` : id;
}

function findUnit(id?: string) {
  const target = canonicalId(id);
  return lessons.find(course => course.id === target)?.unitNumber || chineseBookCompanions.find(item => item.id === target)?.unit;
}

function courseHref(id: string, teacher: boolean) {
  return `#/${id.startsWith('book-') ? 'chinese-companion' : 'chinese-lesson'}/${id}${teacher ? '/teacher' : ''}`;
}

function displayTitle(title: string) {
  return title.split('：')[0];
}

export default function ChineseForest({ teacher = false, selectedId, currentCourseId, courseSummaries = {}, reviewHref = '#/review' }: ChineseForestProps) {
  const selected = canonicalId(selectedId);
  const currentId = canonicalId(currentCourseId);
  const [unitNumber, setUnitNumber] = useState(findUnit(selectedId || currentCourseId) || 1);
  const [section, setSection] = useState<'lessons' | 'companions'>((selected || currentId)?.startsWith('book-') ? 'companions' : 'lessons');
  const [query, setQuery] = useState('');
  const [resultPage, setResultPage] = useState(0);
  const unit = studioUnits.find(item => item.number === unitNumber)!;
  const unitLessons = lessons.filter(item => item.unitNumber === unitNumber);
  const unitCompanions = chineseBookCompanions.filter(item => item.unit === unitNumber);
  const current = lessons.find(item => item.id === currentId) || chineseBookCompanions.find(item => item.id === currentId);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const allEntries = [
    ...lessons.map(item => ({ id: item.id, title: item.title, unit: item.unitNumber, lesson: item, companion: undefined })),
    ...chineseBookCompanions.map(item => ({ id: item.id, title: item.title, unit: item.unit, lesson: undefined, companion: item })),
  ];
  const filteredEntries = normalizedQuery
    ? allEntries.filter(item => `${item.title} ${item.lesson ? `第${item.lesson.lessonNumber}课` : kindLabels[item.companion!.kind]}`.toLocaleLowerCase().includes(normalizedQuery))
    : allEntries.filter(item => item.unit === unitNumber && (section === 'lessons' ? item.lesson : item.companion));
  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const safePage = Math.min(resultPage, pageCount - 1);
  const visibleEntries = filteredEntries.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const dueCount = Object.values(courseSummaries).reduce((sum, summary) => sum + (summary.due || 0), 0);

  useEffect(() => {
    const nextUnit = findUnit(selectedId);
    if (!nextUnit) return;
    setUnitNumber(nextUnit);
    setSection(selected?.startsWith('book-') ? 'companions' : 'lessons');
    setQuery('');
    setResultPage(0);
  }, [selectedId, selected]);

  function selectUnit(number: number) {
    setUnitNumber(number);
    setQuery('');
    setResultPage(0);
  }

  return <section className={`chinese-forest${teacher ? ' chinese-forest--teacher' : ''}`} aria-label={teacher ? '语文课堂选课' : '语文森林全册目录'}>
    <header className="forest-heading">
      <div className="forest-heading-copy"><span className="forest-eyebrow"><Leaf size={14} />三年级上册 · 8个单元</span><h1>{teacher ? '语文课堂' : '语文森林'}</h1><p>{teacher ? '选一课直接投屏，课文和配套都在这里。' : '看课文、练字词、做纸笔检查，从同一课出发。'}</p></div>
      <div className="forest-branch" aria-hidden="true"><svg viewBox="0 0 120 100" fill="none"><path d="M25 94C54 72 66 48 87 14M47 75L29 54M64 53L100 40" stroke="currentColor" strokeWidth="2" /><path d="M34 63C17 64 10 45 12 35C29 34 40 45 34 63ZM69 47C54 39 55 17 63 9C77 18 81 34 69 47ZM79 62C87 44 105 44 113 49C110 65 95 75 79 62Z" fill="currentColor" opacity=".52" /><path d="M89 26C78 9 91 0 102 1C112 18 103 31 89 26Z" fill="currentColor" opacity=".28" /></svg></div>
    </header>

    {!teacher && <div className="forest-shortcuts">
      <a className="forest-current" href={courseHref(current?.id || 'cn-01', false)}><BookOpen size={22} /><div><small>{current ? '继续这一课' : '从第一课开始'}</small><strong>{displayTitle(current?.title || lessons[0].title)}</strong></div><ArrowRight size={18} /></a>
      <a className="forest-review" href={reviewHref}><Backpack size={22} /><div><strong>复习背包</strong><small>{dueCount ? `${dueCount}项待复习` : '看看练过的字词'}</small></div><ArrowRight size={18} /></a>
    </div>}

    <nav className="forest-units" aria-label="选择语文单元">{studioUnits.map(item => <button key={item.number} type="button" aria-pressed={item.number === unitNumber && !normalizedQuery} className={item.number === unitNumber && !normalizedQuery ? 'is-active' : ''} onClick={() => selectUnit(item.number)}><span>第{item.number}单元</span><strong>{item.title}</strong></button>)}</nav>

    <section className="forest-directory" aria-labelledby={teacher ? 'forest-teacher-list-title' : 'forest-list-title'}>
      <div className="forest-directory-top"><div className="forest-list-title"><span className="forest-eyebrow">{normalizedQuery ? '全册查找' : `第${unitNumber}单元`}</span><h2 id={teacher ? 'forest-teacher-list-title' : 'forest-list-title'}>{normalizedQuery ? `找到${filteredEntries.length}项` : unit.title}</h2></div><label className="forest-search"><Search size={17} /><span className="forest-sr-only">搜索全册课文和配套</span><input type="search" value={query} placeholder="找课文、古诗、习作…" onChange={event => { setQuery(event.target.value); setResultPage(0); }} />{query && <button type="button" aria-label="清除搜索" onClick={() => { setQuery(''); setResultPage(0); }}><X size={17} /></button>}</label></div>

      {!normalizedQuery && <div className="forest-list-options"><nav className="forest-section-tabs" aria-label="选择单元内容"><button type="button" className={section === 'lessons' ? 'is-active' : ''} aria-pressed={section === 'lessons'} onClick={() => { setSection('lessons'); setResultPage(0); }}><BookOpen size={16} />课文 <span>{unitLessons.length}</span></button><button type="button" className={section === 'companions' ? 'is-active' : ''} aria-pressed={section === 'companions'} onClick={() => { setSection('companions'); setResultPage(0); }}><Feather size={16} />配套学习 <span>{unitCompanions.length}</span></button></nav><p>{teacher ? '直接打开教师模式' : '点一下，直接打开这一课'}</p></div>}

      <div className="forest-cards">{visibleEntries.map(item => {
        const summary = courseSummaries[item.id] || (item.companion?.kind === 'garden' ? courseSummaries[`cn-garden-${item.unit}`] : undefined);
        const isCurrent = currentId === item.id;
        return <a key={item.id} className={`forest-card${item.companion ? ' forest-card--companion' : ''}${isCurrent && !teacher ? ' is-current' : ''}`} href={courseHref(item.id, teacher)} aria-label={`${teacher ? '投屏' : '打开'}${item.title}`}>
          <span className="forest-card-number" aria-hidden="true">{item.lesson ? String(item.lesson.lessonNumber).padStart(2, '0') : <Feather size={23} />}</span>
          <div className="forest-card-copy"><div className="forest-card-label"><span>{item.lesson ? `第${item.lesson.lessonNumber}课${skimLessons.has(item.lesson.lessonNumber!) ? ' · 略读' : ''}` : kindLabels[item.companion!.kind]}{normalizedQuery ? ` · 第${item.unit}单元` : ''}</span>{isCurrent && !teacher && <em>当前课</em>}</div><h3>{displayTitle(item.title)}</h3><p>{item.title.includes('：') ? item.title.split('：')[1].replaceAll('、', ' · ') : item.lesson ? `会认${item.lesson.recognition.length}字${item.lesson.writing.length ? ` · 会写${item.lesson.writing.length}字` : ''}` : item.companion!.page ? `教材第${item.companion!.page}页` : '全册回顾'}</p>{!teacher && summary && <div className="forest-record-tags">{summary.browsed && <span>已浏览</span>}{!!summary.practiced && <span>字词{summary.practiced}次</span>}{!!summary.paperChecks && <span>纸笔{summary.paperChecks}次</span>}{!!summary.due && <span className="is-due">待复习{summary.due}</span>}</div>}</div><ArrowRight className="forest-card-arrow" size={18} />
        </a>;
      })}</div>
      {filteredEntries.length === 0 && <div className="forest-no-result"><Leaf size={24} /><p>没有找到这一项。试试课名里的几个字。</p><button type="button" onClick={() => setQuery('')}><ArrowLeft size={16} />回到本单元</button></div>}
      {pageCount > 1 && <nav className="forest-result-pages" aria-label="目录翻页"><button type="button" aria-label="上一页目录" disabled={safePage === 0} onClick={() => setResultPage(safePage - 1)}><ChevronLeft size={18} />上一页</button><span>第{safePage + 1}/{pageCount}页</span><button type="button" aria-label="下一页目录" disabled={safePage === pageCount - 1} onClick={() => setResultPage(safePage + 1)}>下一页<ChevronRight size={18} /></button></nav>}
    </section>

    <footer className="forest-footer"><span>26课 · 23项配套</span><a href="#/parent">{teacher ? '教学资料与全册规划' : '家长资料'}<ArrowRight size={14} /></a>{teacher && <a href={`${import.meta.env.BASE_URL}plans/chinese-precision-master-plan.md`} download="语文全册规划.md"><Download size={14} />下载规划</a>}</footer>
  </section>;
}
