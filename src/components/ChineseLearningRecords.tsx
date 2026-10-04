import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, ClipboardCheck, Eye, Pencil } from 'lucide-react';
import { type Progress } from '../lib/progress';
import { CHINESE_RECORDS_UPDATED_EVENT, getChinesePaperReviews, getChineseWordDueReviews, loadChineseLearningRecords, summarizeChineseLessons } from '../lib/chineseLearningRecords';
import './chineseLearningRecords.css';

const pageSize = 6;
const dateText = (value: string) => new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
const skillNames = { meaning: '词义', context: '语境', recall: '回忆', spelling: '拼写', writing: '书写', listening: '听读' };

/** A compact, evidence-based view shared by the parent handbook and review backpack. */
export default function ChineseLearningRecords({ progress, mode = 'overview' }: { progress: Progress; mode?: 'overview' | 'review' }) {
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(0);
  const [duePage, setDuePage] = useState(0);
  useEffect(() => {
    const sync = () => setRevision(value => value + 1);
    window.addEventListener(CHINESE_RECORDS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CHINESE_RECORDS_UPDATED_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);
  const records = useMemo(() => loadChineseLearningRecords(progress), [progress, revision]);
  const summaries = useMemo(() => summarizeChineseLessons(records).filter(item => item.viewed || item.practiceAttempts || item.paperChecks), [records]);
  const reviews = useMemo(() => getChinesePaperReviews(records), [records]);
  const wordReviews = useMemo(() => getChineseWordDueReviews(records), [records]);
  const length = mode === 'review' ? reviews.length : summaries.length;
  const pages = Math.max(1, Math.ceil(length / pageSize));
  const visiblePage = Math.min(page, pages - 1);
  const slicedReviews = reviews.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  const slicedSummaries = summaries.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  const duePages = Math.max(1, Math.ceil(wordReviews.length / pageSize));
  const visibleDuePage = Math.min(duePage, duePages - 1);
  const slicedWordReviews = wordReviews.slice(visibleDuePage * pageSize, (visibleDuePage + 1) * pageSize);
  const statistics = summaries.reduce((sum, row) => ({ viewed: sum.viewed + Number(row.viewed), practice: sum.practice + row.practiceAttempts,
    self: sum.self + row.selfChecks, adult: sum.adult + row.adultChecks }), { viewed: 0, practice: 0, self: 0, adult: 0 });

  return <section className={`cn-records cn-records-${mode}`} aria-label={mode === 'review' ? '语文纸笔复习' : '语文学习记录'}>
    <div className="cn-records-heading"><div><span className="eyebrow">语文森林 · 我的记录</span><h2>{mode === 'review' ? '纸稿里，再练一小项' : '读过、练过、写过，分别看见'}</h2></div><span className="cn-records-count">{mode === 'review' ? `${reviews.length}项待练` : `${statistics.viewed}个内容看过`}</span></div>
    <p className="cn-records-note">{mode === 'review' ? '打开本课再独立写一次，保存新的核对结果；同一项未再标错，就会移出这张清单。' : '看过只表示打开过课件。纸笔自查和大人核对分开记录，不据此判断整课已经掌握。'}</p>
    {records.warnings.length > 0 && <p className="cn-records-warning" role="status">{records.warnings[0]}</p>}
    {mode === 'overview' && <div className="cn-records-statistics"><span><BookOpen size={17} /><b>{statistics.practice}</b>次字词练习</span><span><Pencil size={17} /><b>{statistics.self}</b>次纸笔自查</span><span><ClipboardCheck size={17} /><b>{statistics.adult}</b>次大人核对</span></div>}
    {!length ? <div className="cn-records-empty"><Pencil size={23} /><p>{mode === 'review' ? '目前没有保存的纸笔待练项。完成一次纸稿核对后，可以只标出需要再练的字词。' : '从语文森林打开一课，或保存一次纸稿检查，记录会在这里出现。'}</p><a href="#/map/chinese">去语文森林<ArrowRight size={16} /></a></div>
      : mode === 'review' ? <div className="cn-records-list">{slicedReviews.map(item => <article className="cn-records-review-row" key={item.id}><div className="cn-records-review-label"><strong>{item.label}</strong><small>{item.courseTitle} · {dateText(item.at)}{item.adult ? '大人核对' : '自查'}</small></div><div className="cn-records-row-links"><a href={item.wordsHref}><BookOpen size={16} />看字词</a><a className="cn-records-write-link" href={item.paperHref}><Pencil size={16} />再写一次<ArrowRight size={15} /></a></div></article>)}</div>
        : <div className="cn-records-list">{slicedSummaries.map(item => <article className="cn-records-summary-row" key={item.courseId}><a className="cn-records-course" href={`#/${item.courseId.startsWith('book-') ? 'chinese-companion' : 'chinese-lesson'}/${item.courseId}`}><strong>{item.title}</strong><ChevronRight size={17} /></a><div className="cn-records-evidence"><span><Eye size={14} />{item.viewed ? '看过' : '尚无浏览记录'}</span><span>字词练习 {item.practiceAttempts}次</span><span>自查 {item.selfChecks}次</span><span>大人核对 {item.adultChecks}次</span>{item.pendingPaper > 0 && <b>{item.pendingPaper}项纸笔待练</b>}</div>{(item.legacyPilotAttempts > 0 || item.legacyShanxingChecks > 0) && <small className="cn-records-source">保留旧记录：{item.legacyPilotAttempts > 0 && `汉字样板${item.legacyPilotAttempts}次`}{item.legacyPilotAttempts > 0 && item.legacyShanxingChecks > 0 && ' · '}{item.legacyShanxingChecks > 0 && `《山行》纸稿${item.legacyShanxingChecks}次`}</small>}</article>)}</div>}
    {pages > 1 && <div className="cn-records-pagination" aria-label="语文记录翻页"><button disabled={visiblePage === 0} onClick={() => setPage(visiblePage - 1)}><ChevronLeft size={17} />上一页</button><span>{visiblePage + 1} / {pages}</span><button disabled={visiblePage >= pages - 1} onClick={() => setPage(visiblePage + 1)}>下一页<ChevronRight size={17} /></button></div>}
    {mode === 'review' && length > 0 && <p className="cn-records-small">从清单移除表示这次复检未标错，仍可按老师安排再复习。字词闯关的到期练习继续保留在背包里。</p>}
    {mode === 'review' && <div className="cn-records-historical"><div className="cn-records-heading"><h3>历史字词到期</h3><span className="cn-records-count">{wordReviews.length}项能力</span></div><p className="cn-records-note">沿用已经保存的字词复习日期，按字词和能力分别列出。回到本课字词或纸稿练习，旧记录继续保留。</p>
      {!wordReviews.length ? <p className="cn-records-small">目前没有到期的语文字词练习。</p> : <div className="cn-records-list">{slicedWordReviews.map(item => <article className="cn-records-review-row" key={`${item.lexemeId}-${item.skill}`}><div className="cn-records-review-label"><strong>{item.text}</strong><small>{item.courseTitle} · {skillNames[item.skill]} · {dateText(item.dueAt!)}起待复习</small>{item.paperRecheckedAt && <small>{dateText(item.paperRecheckedAt)}纸稿复检 · {item.paperRecheckedBy === 'adult' ? '大人核对' : '自查'}；隔日再写</small>}</div><div className="cn-records-row-links"><a className="cn-records-write-link" href={item.href}>{item.skill === 'writing' || item.skill === 'recall' ? <Pencil size={16} /> : <BookOpen size={16} />}{item.skill === 'writing' || item.skill === 'recall' ? '去纸笔练习' : '去字词练习'}<ArrowRight size={15} /></a></div></article>)}</div>}
      {duePages > 1 && <div className="cn-records-pagination" aria-label="历史语文字词翻页"><button disabled={visibleDuePage === 0} onClick={() => setDuePage(visibleDuePage - 1)}><ChevronLeft size={17} />上一页</button><span>{visibleDuePage + 1} / {duePages}</span><button disabled={visibleDuePage >= duePages - 1} onClick={() => setDuePage(visibleDuePage + 1)}>下一页<ChevronRight size={17} /></button></div>}
    </div>}
  </section>;
}
