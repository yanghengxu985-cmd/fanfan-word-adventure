import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Download, ExternalLink, Feather, Leaf, Pencil, CheckCircle2 } from 'lucide-react';
import semesterPlan from '../data/chineseSemesterPlan.json';
import { lessonDesigns, studioSources, studioUnits } from '../data/chineseBookStudio';
import { chineseBookCompanions } from '../data/chineseBookCompanions';
import { getChinesePrecisionLesson } from '../data/chineseLessonPrecision';
import { companionWorkshops } from '../data/chineseCompanionPrecision';
import { chineseReturnHref } from '../lib/chineseLessonNavigation';
import './chineseBookStudio.css';

type Section = 'lessons' | 'companions';
type Detail = 'how' | 'words' | 'check';
const skimLessons = new Set([3, 7, 9, 10, 13, 19, 26]);
const detailLabels: { id: Detail; label: string }[] = [{ id: 'how', label: '怎么学' }, { id: 'words', label: '字词与背默' }, { id: 'check', label: '检查与资料' }];
const kindLabels = { writing: '习作', speaking: '口语交际', garden: '语文园地', reading: '快乐读书吧', example: '习作例文', review: '期末复习' };

export default function ChineseBookStudio({ selectedId }: { selectedId?: string }) {
  const initialCourse = semesterPlan.courses.find(item => item.kind === 'lesson' && item.id === selectedId);
  const initialCompanion = chineseBookCompanions.find(item => item.id === selectedId);
  const [unitNumber, setUnitNumber] = useState(initialCourse?.unitNumber || initialCompanion?.unit || 2);
  const [section, setSection] = useState<Section>(initialCompanion ? 'companions' : 'lessons');
  const [selection, setSelection] = useState(initialCourse?.id || initialCompanion?.id || 'cn-04');
  const [detail, setDetail] = useState<Detail>('how');
  const unit = studioUnits.find(item => item.number === unitNumber)!;
  const lessons = semesterPlan.courses.filter(item => item.kind === 'lesson' && item.unitNumber === unitNumber);
  const companions = chineseBookCompanions.filter(item => item.unit === unitNumber);
  const course = section === 'lessons' ? lessons.find(item => item.id === selection) : undefined;
  const companion = section === 'companions' ? companions.find(item => item.id === selection) : undefined;
  const lexicalCourse = course || (companion?.kind === 'garden' ? semesterPlan.courses.find(item => item.kind === 'garden' && item.unitNumber === unitNumber) : undefined);
  const design = lessonDesigns.find(item => item.courseId === course?.id);
  const precision = getChinesePrecisionLesson(course?.id || '');
  const workshop = companion ? companionWorkshops[companion.id] : undefined;
  const isSkim = !!course?.lessonNumber && skimLessons.has(course.lessonNumber);

  useEffect(() => {
    const previous = document.title;
    document.title = '家长与老师资料 · 三年级上册';
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    const nextCourse = semesterPlan.courses.find(item => item.kind === 'lesson' && item.id === selectedId);
    const nextCompanion = chineseBookCompanions.find(item => item.id === selectedId);
    if (!nextCourse && !nextCompanion) return;
    setSelection(selectedId!);
    setUnitNumber(nextCourse?.unitNumber || nextCompanion!.unit);
    setSection(nextCourse ? 'lessons' : 'companions');
    setDetail('how');
  }, [selectedId]);

  function selectItem(id: string) {
    setSelection(id); setDetail('how');
    window.location.hash = `/chinese-book/${id}`;
  }

  function selectUnit(number: number) {
    setUnitNumber(number);
    const first = section === 'lessons' ? semesterPlan.courses.find(item => item.kind === 'lesson' && item.unitNumber === number)?.id : chineseBookCompanions.find(item => item.unit === number)?.id;
    selectItem(first!);
  }
  function selectSection(next: Section) {
    setSection(next);
    selectItem(next === 'lessons' ? lessons[0].id : companions[0].id);
  }

  return <main className="book-studio">
    <header className="book-studio-head">
      <a className="book-back" href={chineseReturnHref(selection)}><ArrowLeft size={19} /><span>语文森林</span></a>
      <div><span className="book-eyebrow">读懂，再记牢 · 三年级上册</span><h1>家长与老师资料</h1></div>
      <a className="book-download" href={`${import.meta.env.BASE_URL}plans/chinese-book-plan.md`} download="语文全册学习安排.md"><Download size={18} /><span>下载安排</span></a>
    </header>

    <nav className="book-units" aria-label="选择单元">{studioUnits.map(item => <button key={item.number} className={item.number === unitNumber ? 'is-active' : ''} aria-pressed={item.number === unitNumber} onClick={() => selectUnit(item.number)}><span>第{item.number}单元</span><strong>{item.title}</strong></button>)}</nav>

    <section className="book-unit-goals" aria-label="本单元目标"><Leaf size={21} /><div><p><strong>阅读</strong>{unit.readingGoal}</p><p><strong>表达</strong>{unit.writingGoal}</p></div></section>

    <div className="book-workspace">
      <aside className="book-index" aria-label="本单元内容">
        <div className="book-index-tabs"><button aria-pressed={section === 'lessons'} className={section === 'lessons' ? 'is-active' : ''} onClick={() => selectSection('lessons')}>课文 <span>{lessons.length}</span></button><button aria-pressed={section === 'companions'} className={section === 'companions' ? 'is-active' : ''} onClick={() => selectSection('companions')}>配套学习 <span>{companions.length}</span></button></div>
        <div className="book-cards">{section === 'lessons' ? lessons.map(item => <button key={item.id} aria-pressed={item.id === selection} className={`book-card ${item.id === selection ? 'is-active' : ''}`} onClick={() => selectItem(item.id)}><span className="book-card-number">{String(item.lessonNumber).padStart(2, '0')}</span><div><strong>{[4, 20].includes(item.lessonNumber!) ? '古诗三首' : item.title}{skimLessons.has(item.lessonNumber!) && <em>略读</em>}</strong><small>{item.startPage}页 · 逐课课件</small></div><ArrowRight size={16} /></button>) : companions.map(item => <button key={item.id} aria-pressed={item.id === selection} className={`book-card book-companion-card ${item.id === selection ? 'is-active' : ''}`} onClick={() => selectItem(item.id)}><span className="book-card-number"><Feather size={20} /></span><div><strong>{item.title}</strong><small>{kindLabels[item.kind]}{item.page && ` · ${item.page}页`} · 可打开</small></div><ArrowRight size={16} /></button>)}</div>
        <div className="book-index-note"><BookOpen size={18} /><p>26课 · 8篇习作 · 4次口语交际<br />7个园地，另含阅读与复习。</p></div>
      </aside>

      <section className="book-detail" aria-label="本课安排" key={selection}>
        <header className="book-detail-head"><span className="book-eyebrow">{course ? `第${course.lessonNumber}课${isSkim ? ' · 略读' : ''}` : companion ? kindLabels[companion.kind] : ''}</span><h2>{course?.title || companion?.title}</h2></header>
        <nav className="book-detail-tabs" aria-label="查看本课安排">{detailLabels.filter(item => lexicalCourse || item.id !== 'words').map(item => <button key={item.id} aria-pressed={detail === item.id} className={detail === item.id ? 'is-active' : ''} onClick={() => setDetail(item.id)}>{item.label}</button>)}</nav>
        <div className="book-detail-body">
          {detail === 'how' && <>
            <div className="book-design-block"><span>这一课要读懂</span><p>{precision?.goal || design?.focus || companion?.goal}</p></div>
            <div className="book-design-block"><span>这一课的形式</span><p>{precision ? precision.tools.map(tool => `${tool.title}：${tool.instruction}`).join('；') : workshop ? `${workshop.title}：${workshop.instruction}` : design?.form || companion?.form}</p></div>
            {design && <div className="book-design-block"><span>练习重点</span><p>{design.practice}</p></div>}
            <p className="book-design-note">{design?.note || companion?.note}</p>
            <a className="book-primary" href={course ? `#/chinese-lesson/${course.id}` : `#/chinese-companion/${companion!.id}`}>打开本课课件 <ArrowRight size={18} /></a>
            <a className="book-source" href={course ? `#/chinese-lesson/${course.id}/teacher` : `#/chinese-companion/${companion!.id}/teacher`}>教师投屏入口 <ArrowRight size={16} /></a>
            {course?.id === 'cn-04' && <a className="book-source" href="#/chinese-lesson/shanxing">《山行》诗画版 <ArrowRight size={16} /></a>}
          </>}
          {detail === 'words' && lexicalCourse && <>
            <div className="book-word-counts"><span>会认字 <b>{lexicalCourse.recognition.length}</b></span><span>会写字 <b>{lexicalCourse.writing.length}</b></span><span>课内词语 <b>{lexicalCourse.words.length}</b></span></div>
            <div className="book-word-lists">
              <p><strong>会认</strong>{lexicalCourse.recognition.map(item => item.text).join('　') || (companion ? '本园地条目待补充核对，不代表没有内容' : '本课清单未列项目')}</p>
              <p><strong>会写</strong>{lexicalCourse.writing.map(item => item.text).join('　') || (companion ? '本园地条目待补充核对，不代表没有内容' : isSkim ? '略读课书后未列本课会写字，不追加必写' : '书后未列本课会写字')}</p>
              <p><strong>词语</strong>{lexicalCourse.words.map(item => item.text).join('、') || (companion ? '本园地条目待补充核对，不代表没有内容' : [4, 20, 23].includes(lexicalCourse.lessonNumber!) ? '按诗句或课文中的生字组词；书后词语表未另列本课词语' : '书后词语表未列本课词语')}</p>
            </div>
            <div className="book-requirements">
              <p><strong>背诵</strong>{lexicalCourse.recitation.status === 'preview_checked' ? `${lexicalCourse.recitation.scope.map(title => `《${title}》`).join('、')}；同目录预览已核，2026纸本待复核` : lexicalCourse.recitation.status === 'not_specified_in_preview' ? '同目录预览未指定课文背诵；另看老师布置' : '范围待核对原页。待核不代表没有要求。'}</p>
              <p><strong>语句默写</strong>{lexicalCourse.dictation.status === 'preview_checked' ? `${lexicalCourse.dictation.scope.map(title => `《${title}》`).join('、')}；不把另外两首自动列为必默` : lexicalCourse.dictation.status === 'not_specified_in_preview' ? '同目录预览未指定语句默写；字词纸写另外检查' : '范围待核；只按核实要求安排，不默认整篇默写。'}</p>
            </div>
            <p className="book-design-note">字词按同目录公开预览整理，2026纸本书后三表待复核。拼音只用已核读音练习；多音字按课内语境，字音与词中轻声分开处理。</p>
          </>}
          {detail === 'check' && <>
            <div className="book-check-target"><CheckCircle2 size={23} /><div><span>怎样检查学会了</span><p>{design?.check || companion?.check}</p></div></div>
            {course && <p className="book-paper-check"><Pencil size={18} />{isSkim ? '指认课内生字、换到词语中再读；用原文证据回答，不追加抄写。' : '会认：换到词语中再读。会写：合书后纸写、组词，再对照纸稿查错；选择正确不等于会写。'}</p>}
            <div className="book-source-links">{studioSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.title}<ExternalLink size={14} /></strong><small>{source.note}</small></div><ArrowRight size={16} /></a>)}</div>
            <p className="book-design-note">呈现形式与检查问题是原创辅导方案，不是学校试卷的必考清单。网课按本课标题查找，课件与视频保留原站入口。</p>
          </>}
        </div>
      </section>
    </div>

    <footer className="book-studio-footer"><p>26课与23项配套的规划已审核；教材待核项目单独列明。</p><a href={`${import.meta.env.BASE_URL}plans/chinese-precision-master-plan.md`} download="语文全册精修规划.md"><Download size={15} />逐项精修规划</a><a href={`${import.meta.env.BASE_URL}plans/chinese-precision-release.md`} download="语文逐项验收台账.md"><Download size={15} />逐项验收台账</a><a href="#/chinese-plan">完整字词清单 <ArrowRight size={15} /></a></footer>
  </main>;
}
