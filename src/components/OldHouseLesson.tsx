import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CornerDownRight, Eye, ExternalLink, House, Lightbulb, Pencil, Printer, RotateCcw, Search, X } from 'lucide-react';
import {
  oldHouseLessonCopy, oldHouseRecognitionFocus, oldHouseWordFocus, oldHouseRequirementNote,
  oldHouseStoryStops, oldHousePredictionCases, oldHouseMethodTips, oldHouseTransferCase,
  type OldHousePredictionCase, type OldHouseStoryStopId,
} from '../data/oldHouseLesson';
import {
  assessPrediction, createPredictionRecord, reflectPrediction, revealPrediction,
  selectPrediction, togglePredictionEvidence, type OldHousePredictionRecord,
} from '../lib/oldHousePrediction';
import ChineseWordWorkbench, { type ChineseWordWorkbenchHandle } from './ChineseWordWorkbench';
import OldHouseScene from './OldHouseScene';
import './kingfisherLesson.css';
import './oldHouseLesson.css';

type Mode = 'story' | 'predict' | 'words' | 'method';
type ChangeRecord = (record: OldHousePredictionRecord) => OldHousePredictionRecord;
const tabs: { id: Mode; label: string; icon: typeof House }[] = [
  { id: 'story', label: '看故事线索', icon: House },
  { id: 'predict', label: '试着预测', icon: Lightbulb },
  { id: 'words', label: '字词练写', icon: Pencil },
  { id: 'method', label: '读懂预测', icon: BookOpen },
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

function PredictionFolio({ predictionCase, record, onChange, onRetry, transfer = false }: {
  predictionCase: OldHousePredictionCase;
  record: OldHousePredictionRecord;
  onChange: (change: ChangeRecord) => void;
  onRetry: () => void;
  transfer?: boolean;
}) {
  const selected = predictionCase.predictions.find(item => item.id === record.predictionId);
  const reasons = predictionCase.evidence.filter(item => record.evidenceIds.includes(item.id));
  const assessment = assessPrediction(record, predictionCase);
  return <div className={`oh-folio ${record.revealed ? 'is-revealed' : ''} ${transfer ? 'oh-folio-transfer' : ''}`}>
    {!record.revealed ? <>
      <div className="oh-folio-heading"><span className="kf-eyebrow">先留一个想法</span><h2>{transfer ? '接下来，可能怎样？' : '你猜老屋会怎样回应？'}</h2></div>
      <div className="oh-guesses" role="group" aria-label="选择一种可能的猜想">
        {predictionCase.predictions.map((prediction, index) => <button
          key={prediction.id} className={record.predictionId === prediction.id ? 'is-selected' : ''}
          aria-pressed={record.predictionId === prediction.id}
          onClick={() => onChange(current => selectPrediction(current, prediction.id))}
        ><span>{String.fromCharCode(65 + index)}</span><p>{prediction.text}</p><i aria-hidden="true" /></button>)}
      </div>
      <div className="oh-evidence-heading"><Search size={15} /><span>愿意的话，点线索说说理由</span><small>也可以口头说</small></div>
      <div className="oh-evidence-options" role="group" aria-label="选择支持猜想的线索">
        {predictionCase.evidence.map(evidence => <button
          key={evidence.id} aria-pressed={record.evidenceIds.includes(evidence.id)}
          className={record.evidenceIds.includes(evidence.id) ? 'is-selected' : ''}
          onClick={() => onChange(current => togglePredictionEvidence(current, evidence.id))}
        ><span>{evidence.source}</span><p>{evidence.text}</p></button>)}
      </div>
      <div className="oh-before-read"><p>想法可以不同。先说依据，再往下读。</p><button className="kf-primary oh-reveal" onClick={() => onChange(revealPrediction)}><Eye size={18} />看看后文</button></div>
    </> : <>
      <div className="oh-folio-heading"><span className="kf-eyebrow">把前后放在一起读</span><h2>保留猜想，再作比较</h2></div>
      <div className="oh-comparison">
        <div className="oh-original"><span><Pencil size={15} />原来的想法</span><p>{selected?.text || '这次先读了后文，没有留下猜想。'}</p><small>{reasons.length ? `依据：${reasons.map(item => item.text).join('；')}` : selected ? '当时没有点选线索，可以口头补充理由。' : '回头看看，前面有哪些线索？'}</small></div>
        <div className="oh-after"><span><BookOpen size={15} />后文写到的</span><p>{predictionCase.outcomeSummary}</p></div>
      </div>
      <div className="oh-comparison-note" aria-live="polite"><strong>{assessment.supported ? '这个猜想有线索支持' : selected ? '说清猜想和线索的联系' : '读后文，也能回头找线索'}</strong><p>{assessment.feedback}</p></div>
      <p className="oh-compare-detail">{predictionCase.compareNote}</p>
      {selected && <div className="oh-reflection" role="group" aria-label="比较后选择保留或调整想法"><span>读完以后，你想……</span><button className={record.reflection === 'keep' ? 'is-selected' : ''} aria-pressed={record.reflection === 'keep'} onClick={() => onChange(current => reflectPrediction(current, 'keep'))}>保留想法</button><button className={record.reflection === 'adjust' ? 'is-selected' : ''} aria-pressed={record.reflection === 'adjust'} onClick={() => onChange(current => reflectPrediction(current, 'adjust'))}>调整想法</button></div>}
      <div className="oh-after-read"><span>{record.reflection === 'keep' ? '说说你想保留哪一点，理由是什么。' : record.reflection === 'adjust' ? '说说哪条新线索让你改变了想法。' : '可以说一说，也可以直接换一处继续读。'}</span><button className="kf-text-button" onClick={onRetry}><RotateCcw size={16} />重新试一试</button></div>
    </>}
  </div>;
}

export default function OldHouseLesson({ teacher = false }: { teacher?: boolean }) {
  const [mode, setMode] = useState<Mode>('story');
  const [storyId, setStoryId] = useState<OldHouseStoryStopId>('opening');
  const [predictionIndex, setPredictionIndex] = useState(0);
  const [wordHidden, setWordHidden] = useState(false);
  const [records, setRecords] = useState<Record<string, OldHousePredictionRecord>>(() =>
    Object.fromEntries([...oldHousePredictionCases, oldHouseTransferCase].map(item => [item.id, createPredictionRecord()])));
  const workbenchRef = useRef<ChineseWordWorkbenchHandle>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resourceTrigger = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const story = oldHouseStoryStops.find(item => item.id === storyId)!;
  const storyRevealed = storyId !== 'opening' && records[storyId].revealed;
  const predictionCase = oldHousePredictionCases[predictionIndex];
  const predictionRecord = records[predictionCase.id];
  const hideLessonWords = mode === 'words' && wordHidden;

  function stopAudio() { workbenchRef.current?.stopAudio(); }
  function changeMode(next: Mode) { stopAudio(); if (next !== mode) setWordHidden(false); setMode(next); }
  function changeRecord(id: string, change: ChangeRecord) { setRecords(current => ({ ...current, [id]: change(current[id]) })); }
  function retry(id: string) { setRecords(current => ({ ...current, [id]: createPredictionRecord() })); }
  function openResources() { stopAudio(); dialogRef.current?.showModal(); }
  function printLesson() { stopAudio(); window.print(); }
  function predictAtStory() {
    const index = oldHousePredictionCases.findIndex(item => item.id === storyId);
    setPredictionIndex(index < 0 ? 0 : index); changeMode('predict');
  }

  useEffect(() => {
    const previousTitle = document.title;
    const suspend = () => workbenchRef.current?.stopAudio();
    const visibility = () => { if (document.hidden) suspend(); };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('hashchange', suspend);
    window.addEventListener('pagehide', suspend);
    return () => {
      suspend(); document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('hashchange', suspend); window.removeEventListener('pagehide', suspend);
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => { document.title = hideLessonWords ? '字词独立练习 · 三上第8课' : '总也倒不了的老屋 · 边读边想'; }, [hideLessonWords]);

  return <main className="kf-lesson oh-lesson" data-mode={mode} data-teacher={teacher || undefined} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
    <header className="kf-head oh-head">
      <a className="kf-back" href={teacher ? '#/teacher' : '#/chinese-book/cn-08'} aria-label={teacher ? '返回老师课堂' : '返回全册课堂'}><ArrowLeft size={21} /><span>语文课堂</span></a>
      <div className="kf-heading"><span className="kf-eyebrow">{hideLessonWords ? '独立练习手册' : '边读边想 · 阅读手册'}<span>三上 · 第8课{teacher ? ' · 教师投屏' : ''}</span></span><h1>{hideLessonWords ? '字词独立练习' : oldHouseLessonCopy.title}{!hideLessonWords && <span>读到线索，就想一想</span>}</h1></div>
      <button className="kf-resource" ref={resourceTrigger} onClick={openResources}><BookOpen size={18} /><span>资料与指导</span></button>
    </header>
    <nav className="kf-tabs" aria-label="本课学习内容">{tabs.map(({ id, label, icon: Icon }, index) => <button key={id} className={mode === id ? 'is-active' : ''} aria-current={mode === id ? 'page' : undefined} onClick={() => changeMode(id)}><span className="kf-tab-number">0{index + 1}</span><Icon size={18} /><span>{label}</span></button>)}</nav>

    <section className={`kf-panel oh-panel oh-panel-${mode} ${mode === 'words' ? 'kf-panel-words' : ''}`} aria-label={hideLessonWords ? '字词独立练习' : tabs.find(item => item.id === mode)!.label}>
      {mode === 'story' && <>
        <div className="kf-art oh-story-art"><div className="kf-art-heading"><span><House size={16} />走到老屋门前</span><small>画面只呈现当前这一处</small></div><div className="oh-scene-body"><OldHouseScene stage={storyId} revealed={storyRevealed} reducedMotion={reducedMotion} /></div><div className="oh-story-stops" role="group" aria-label="直接选择故事中的停读处">{oldHouseStoryStops.map((stop, index) => <button key={stop.id} aria-pressed={storyId === stop.id} className={storyId === stop.id ? 'is-active' : ''} onClick={() => setStoryId(stop.id)}><span>{index === 0 ? '序' : `0${index}`}</span><strong>{index === 0 ? '故事开始' : `${['第一处', '第二处', '第三处'][index - 1]}`}</strong></button>)}</div></div>
        <div className="oh-story-side" data-revealed={storyRevealed ? 'true' : 'false'}><div className="oh-page-heading"><span className="kf-eyebrow">{storyId === 'opening' ? '从题目和开头想起' : '停在这一处，先看已经读到的'}</span><h2>{storyId === 'opening' ? '老屋前，故事开始了' : story.title}</h2></div><p className="oh-known-summary">{story.knownSummary}</p><div className="oh-story-clue"><span><Search size={15} />留心这条线索</span><p>{story.evidenceSummary}</p></div>{storyRevealed ? <div className="oh-story-outcome" aria-live="polite"><span>接着读到的</span><p>{story.outcomeSummary}</p></div> : <p className="oh-story-question">{story.question}</p>}<div className="oh-story-actions"><button className="kf-primary" onClick={predictAtStory}><Lightbulb size={18} />试着预测<ArrowRight size={16} /></button>{storyId !== 'opening' && !storyRevealed && <button className="kf-text-button" onClick={() => changeRecord(storyId, revealPrediction)}><Eye size={17} />看看后文</button>}{storyRevealed && <span>回头说说：你用了哪些线索？</span>}</div></div>
      </>}

      {mode === 'predict' && <>
        <div className="kf-art oh-prediction-context"><div className="kf-art-heading"><span><BookOpen size={16} />先看已有的情节</span><small>还没读到的，先留作可能</small></div><div className="oh-scene-body"><OldHouseScene stage={predictionCase.id as Exclude<OldHouseStoryStopId, 'opening'>} revealed={predictionRecord.revealed} reducedMotion={reducedMotion} /></div><div className="oh-known-card"><span>已经读到的</span><p>{predictionCase.knownSummary}</p></div><div className="oh-case-nav" role="group" aria-label="直接选择一处预测">{oldHousePredictionCases.map((item, index) => <button key={item.id} className={predictionIndex === index ? 'is-active' : ''} aria-pressed={predictionIndex === index} onClick={() => setPredictionIndex(index)}><span>0{index + 1}</span>{item.title}</button>)}</div></div>
        <PredictionFolio predictionCase={predictionCase} record={predictionRecord} onChange={change => changeRecord(predictionCase.id, change)} onRetry={() => retry(predictionCase.id)} />
      </>}

      {mode === 'words' && <ChineseWordWorkbench ref={workbenchRef} courseId="cn-08" writingFocus={oldHouseLessonCopy.writingFocus} recognitionFocus={oldHouseRecognitionFocus} wordFocus={oldHouseWordFocus} initialCharacter="屋" onHiddenChange={setWordHidden} />}

      {mode === 'method' && <>
        <div className="oh-method-guide"><div className="oh-page-heading"><span className="kf-eyebrow">预测，是边读边想</span><h2>让猜想带着理由</h2></div><div className="oh-method-tips">{oldHouseMethodTips.map((tip, index) => <div key={tip.id}><span>0{index + 1}</span><div><h3>{tip.title}</h3><p>{tip.body}</p></div></div>)}</div><p className="oh-method-margin"><CornerDownRight size={18} />新内容带来新线索，想法也可以改变。</p></div>
        <div className="oh-transfer"><div className="oh-transfer-premise"><span>原创小情境 · {oldHouseTransferCase.title}</span><p>{oldHouseTransferCase.knownSummary}</p></div><PredictionFolio predictionCase={oldHouseTransferCase} record={records.transfer} onChange={change => changeRecord('transfer', change)} onRetry={() => retry('transfer')} transfer /></div>
      </>}
    </section>

    <footer className="kf-footer"><span><BookOpen size={15} />{hideLessonWords ? '先独立尝试，再展开核对。' : ({ story: '用读到的线索，说清你的猜想。', predict: '有依据的猜想，可以和作者安排不同。', words: '会认字练认读，会写字纸笔练习后再核对。', method: '找线索，想可能；读后文，再比较。' })[mode]}</span><span className="kf-footer-mark">{hideLessonWords ? '独立练习手册' : teacher ? '课堂演示' : '边读边想'}<i>08</i></span></footer>

    <dialog className="kf-dialog oh-dialog" ref={dialogRef} onClose={() => resourceTrigger.current?.focus()} onClick={event => { if (event.target === dialogRef.current) dialogRef.current.close(); }} aria-labelledby="oh-resource-title"><div className="kf-dialog-heading"><div><span className="kf-eyebrow">给陪伴学习的大人</span><h2 id="oh-resource-title">{hideLessonWords ? '独立练习说明' : '资料与课堂指导'}</h2></div><button className="kf-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="关闭资料与指导"><X size={22} /></button></div><div className="kf-dialog-body">{hideLessonWords ? <p>当前卡片已收起。先独立练习，展开后再查阅教学资料。</p> : <><p>{oldHouseLessonCopy.intro}</p><div className="kf-adult-guidance"><h3>课堂里可以这样用</h3><ol><li>停在已经读到的地方，用题目、情节或相关生活经验说理由。</li><li>孩子可以选择一种猜想，也可以先口头说。选择线索和查看后文都随时可用。</li><li>后文出现以后，保留原来的猜想，比较新内容带来的线索。不按猜中或猜错评分。</li><li>允许不同的合理猜想，追问“你为什么这样想”。字词认读和纸笔练写随时切换。</li></ol><p>当前页面用于课堂阅读和讨论，不生成个人成绩或“已掌握”记录。</p></div><a className="kf-teacher-link" href="#/chinese-lesson/cn-08/teacher" onClick={() => dialogRef.current?.close()}><BookOpen size={19} /><span>打开教师投屏</span><ArrowRight size={18} /></a><button className="kf-print-button" onClick={printLesson}><Printer size={19} />打印一页预测记录纸</button><h3>内容来源</h3><div className="kf-sources">{oldHouseLessonCopy.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}</span><ExternalLink size={17} /></a>)}</div><div className="kf-source-note"><h3>教材核对与示意说明</h3><p>{oldHouseRequirementNote}</p><p>故事情节使用原创概述，配图辅助阅读，请结合完整课文。方法页的小情境由本项目原创，不作为教材原文或新增必会字词。</p><p>音频沿用现有合成练习示范。字词练写依靠纸稿核对，预测练习依靠理由和前后比较。</p></div></>}</div></dialog>

    <section className="kf-print oh-print" aria-hidden="true">{hideLessonWords ? <><h1>字词独立练习</h1><p>姓名：____________　日期：____________</p><div className="oh-print-blank">{Array.from({ length: 7 }, (_, index) => <p key={index}>________________________________________________</p>)}</div></> : <><h1>《总也倒不了的老屋》预测记录</h1><p>姓名：____________　日期：____________</p><p>先记已经读到的线索，再猜可能的发展。读后文以后，比较并补充想法。</p><table><thead><tr><th>停读处</th><th>已知线索</th><th>我的猜想</th><th>这样猜的依据</th><th>读后文后的想法</th></tr></thead><tbody>{oldHousePredictionCases.map(item => <tr key={item.id}><th>{item.title}</th><td /><td /><td /><td /></tr>)}</tbody></table><h2>说给同伴听</h2><p>我看到________________，所以猜可能________________。</p><p>读到新内容后，我想保留或调整________________，因为________________。</p><small>不同的合理猜想可以保留；记录纸不按是否猜中评分。</small><small>{oldHouseRequirementNote}</small></>}</section>
  </main>;
}
