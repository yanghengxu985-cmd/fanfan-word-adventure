import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, ExternalLink, Leaf, Maximize, Minus, Pause, Pencil, Play, Plus, Printer, RotateCcw, Search, Users, Volume2, X } from 'lucide-react';
import { getLessonPaperWords, lessonCourseById, lessonMaterialById } from '../data/chineseLessons';
import { studioSources } from '../data/chineseBookStudio';
import { getChinesePrecisionLesson } from '../data/chineseLessonPrecision';
import { createPrecisionState, type PrecisionToolState } from '../lib/chineseLessonPrecision';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';
import { readPaperChecks, savePaperCheck } from '../lib/chineseLessonPaper';
import { notifyChineseRecordsChanged } from '../lib/chineseLearningRecords';
import { chineseLessonHref, chineseReturnHref, resolveChineseLessonMode, type ChineseLessonTab } from '../lib/chineseLessonNavigation';
import ChineseWordWorkbench, { type ChineseWordWorkbenchHandle } from './ChineseWordWorkbench';
import ChinesePrecisionTool, { PrecisionIllustration } from './ChinesePrecisionTool';
import './kingfisherLesson.css';
import './chineseLessonViewer.css';

type Mode = 'read' | 'words' | 'practice' | 'recite' | 'paper';
type PaperType = 'words' | 'memory' | 'poem';
type Mask = 'full' | 'clue' | 'hidden';

export default function ChineseLessonViewer({ courseId, teacher = false, initialTab }: { courseId: string; teacher?: boolean; initialTab?: ChineseLessonTab }) {
  if (!lessonCourseById.has(courseId) || !lessonMaterialById.has(courseId)) return <main className="cnl-missing"><h1>这一课暂时没有找到</h1><a href={chineseReturnHref(courseId, teacher)}>返回{teacher ? '老师课堂' : '语文森林'}</a></main>;
  return <LessonContent key={`${courseId}-${teacher ? 'teacher' : 'student'}`} courseId={courseId} teacher={teacher} initialTab={initialTab} />;
}

function LessonContent({ courseId, teacher, initialTab }: { courseId: string; teacher: boolean; initialTab?: ChineseLessonTab }) {
  const course = lessonCourseById.get(courseId)!;
  const material = lessonMaterialById.get(courseId)!;
  const precision = getChinesePrecisionLesson(courseId);
  const poems = material.poems || [];
  const paperWords = getLessonPaperWords(course);
  const skim = !course.writing.length && !poems.length;
  const prediction = material.activity.kind === 'predict';
  const initialMode = resolveChineseLessonMode<Mode>(initialTab, { read: 'read', words: 'words', paper: 'paper', practice: poems.length ? 'read' : 'practice', ...(poems.length ? { memory: 'recite' as const } : {}) });
  const [mode, setMode] = useState<Mode>(initialMode);
  const [stepIndex, setStepIndex] = useState(0);
  const [explanation, setExplanation] = useState(false);
  const [poemIndex, setPoemIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [pinyin, setPinyin] = useState(false);
  const [mask, setMask] = useState<Mask>('full');
  const [poemTool, setPoemTool] = useState(false);
  const [toolIndex, setToolIndex] = useState(0);
  const [toolStates, setToolStates] = useState<Record<string, PrecisionToolState>>({});
  const [wordHidden, setWordHidden] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [textScale, setTextScale] = useState(1);
  const [presentationPaused, setPresentationPaused] = useState(false);
  const [stopSignal, setStopSignal] = useState(0);
  const [presentationStatus, setPresentationStatus] = useState('');
  const [paperType, setPaperType] = useState<PaperType>(poems.length ? 'poem' : paperWords.length ? 'words' : 'memory');
  const [paperPage, setPaperPage] = useState(0);
  const [memoryHidden, setMemoryHidden] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [adult, setAdult] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastCheck, setLastCheck] = useState(() => {
    if (teacher) return undefined;
    try { return readPaperChecks(localStorage).filter(item => item.courseId === courseId).at(-1); } catch { return undefined; }
  });
  const lessonRoot = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement>(null);
  const workbench = useRef<ChineseWordWorkbenchHandle>(null);
  const player = useRef<ReturnType<typeof createChineseLessonAudioPlayer> | null>(null);
  const audioQueue = useRef<{ id: string; text?: string }[]>([]);
  const poem = poems[poemIndex];
  const step = material.steps[stepIndex];
  const tool = precision?.tools[toolIndex] ?? precision?.tools[0];
  const toolState = tool ? toolStates[tool.id] ?? createPrecisionState(tool) : undefined;
  const paperBank = paperType === 'memory' ? course.writing.map(item => ({ id: item.lexemeId, text: item.text, pinyin: '' })) : paperWords;
  const paperItems = paperBank.slice(paperPage * 6, paperPage * 6 + 6);
  const paperPages = Math.ceil(paperBank.length / 6);
  const targetPoemRequired = !!poem && courseId === 'cn-04' && poem.title === '山行' && course.dictation.status === 'preview_checked' && course.dictation.scope.some(title => title === '山行');
  const independent = mode === 'words' && wordHidden || mode === 'paper' && !revealed && !skim;
  const modes: { id: Mode; label: string; icon: typeof Leaf }[] = poems.length ? [
    { id: 'read', label: '读懂诗意', icon: Leaf }, { id: 'recite', label: courseId === 'cn-04' ? '遮字背诵' : '选做记诗', icon: EyeOff },
    { id: 'words', label: '字词练写', icon: BookOpen }, { id: 'paper', label: '纸笔自查', icon: Pencil },
  ] : [
    { id: 'read', label: prediction ? '看故事线索' : '读进课文', icon: BookOpen }, { id: 'practice', label: prediction ? '试着预测' : '阅读工具', icon: Search },
    { id: 'words', label: skim ? '字词认读' : '字词练写', icon: Pencil }, { id: 'paper', label: skim ? '选做观察纸' : '纸笔自查', icon: Eye },
  ];
  function stopAudio() { audioQueue.current = []; player.current?.stop(); workbench.current?.stopAudio(); setPlaying(false); setAudioStatus(''); }
  function stopAll() { stopAudio(); setStopSignal(value => value + 1); }
  function playQueue(clips: { id: string; text?: string }[]) {
    stopAudio(); if (!clips.length) return;
    player.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent: event => {
      if (event === 'ended' && audioQueue.current.length) { const next = audioQueue.current.shift()!; player.current?.play(next.id, next.text); }
      else { audioQueue.current = []; setPlaying(false); }
    } });
    const [first, ...rest] = clips; audioQueue.current = rest; setPlaying(true); player.current.play(first.id, first.text);
  }
  function resetPaper() { stopAudio(); setRevealed(false); setMemoryHidden(false); setErrors([]); setAdult(false); setSaved(false); setSaveMessage(''); }
  function changeMode(next: Mode) { stopAll(); if (next !== mode) setWordHidden(false); if (next === 'paper' && mode !== 'paper') resetPaper(); setMode(next); }
  useEffect(() => { changeMode(initialMode); }, [initialMode, initialTab]);
  function selectStep(index: number) { stopAudio(); setStepIndex(index); setExplanation(false); }
  function selectPoem(index: number) { stopAll(); setPoemIndex(index); setToolIndex(index); setLineIndex(0); setMask('full'); resetPaper(); }
  function chooseTool(index: number) { if (poems.length) selectPoem(index); else { stopAll(); setToolIndex(index); } }
  function printLesson() { stopAll(); window.print(); }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else if (lessonRoot.current?.requestFullscreen) await lessonRoot.current.requestFullscreen(); else setPresentationStatus('可使用浏览器的全屏或投屏功能。'); }
    catch { setPresentationStatus('请使用浏览器的全屏或投屏功能。'); }
  }
  function saveCheck() {
    if (teacher || !revealed || skim) return;
    const targetIds = paperType === 'poem' ? [poem.id] : paperItems.map(item => item.id);
    const value = { courseId, at: new Date().toISOString(), type: paperType, targetIds, needsPractice: errors, adult };
    try { savePaperCheck(localStorage, value); notifyChineseRecordsChanged(); setLastCheck(value); setSaved(true); setSaveMessage(`${adult ? '大人核对' : '自查'}已保存；只记录这次纸稿检查。`); }
    catch { setSaveMessage('浏览器没能保存，可以把需要再练的内容记在纸上。'); }
  }
  function toggleError(id: string) { setErrors(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); setSaved(false); }
  useEffect(() => {
    const previous = document.title;
    const suspend = () => { audioQueue.current = []; player.current?.stop(); workbench.current?.stopAudio(); setPlaying(false); setAudioStatus(''); setStopSignal(value => value + 1); };
    const hide = () => { if (document.hidden) suspend(); };
    window.addEventListener('hashchange', suspend); window.addEventListener('pagehide', suspend); document.addEventListener('visibilitychange', hide);
    return () => { audioQueue.current = []; player.current?.stop(); workbench.current?.stopAudio(); window.removeEventListener('hashchange', suspend); window.removeEventListener('pagehide', suspend); document.removeEventListener('visibilitychange', hide); document.title = previous; };
  }, []);
  useEffect(() => { document.title = independent ? `独立练习 · 三上第${course.lessonNumber}课` : `${poem?.title || course.title} · 三上阅读手册`; }, [independent, course.title, course.lessonNumber, poem?.title]);
  const paperTargets = paperType === 'poem' ? [{ id: poem.id, text: poem.title }] : paperItems;
  const firstStop = precision?.tools.find(item => item.kind === 'prediction');
  const known = prediction && firstStop?.kind === 'prediction' ? firstStop.stops[0].known : step.summary;
  const renderTool = () => tool && toolState ? <><div className="cnl-tool-body"><ChinesePrecisionTool key={tool.id} courseId={courseId} tool={tool} state={toolState} onChange={next => setToolStates(current => ({ ...current, [tool.id]: next }))} onBeforeAudio={stopAudio} stopSignal={stopSignal} paused={presentationPaused} /></div>{!poems.length && precision!.tools.length > 1 && <div className="cnl-tool-selector" role="group" aria-label="直接选择阅读工具">{precision!.tools.map((item, index) => <button key={item.id} className={index === toolIndex ? 'is-active' : ''} aria-pressed={index === toolIndex} onClick={() => chooseTool(index)}>{item.title}</button>)}</div>}</> : <div className="cnl-tool-pending"><BookOpen size={34} /><h2>带着问题回到课本</h2><p>{material.activity.instruction}</p></div>;

  return <main ref={lessonRoot} className="kf-lesson cnl-lesson" style={{ '--cnl-text-scale': textScale } as CSSProperties} data-mode={mode} data-memory-mask={mode === 'recite' ? mask : undefined} data-course={courseId} data-kind={precision?.type || 'scene'} data-skim={skim || undefined} data-independent={independent || undefined} data-teacher={teacher || undefined} data-paused={presentationPaused || undefined}>
    <header className="kf-head cnl-head"><a className="kf-back" href={chineseReturnHref(courseId, teacher)} aria-label={teacher ? '返回老师课堂' : '返回语文森林'}><ArrowLeft size={21} /><span>{teacher ? '老师课堂' : '语文森林'}</span></a><div className="kf-heading"><span className="kf-eyebrow">{independent ? '独立练习手册' : '把文字读成画面 · 阅读手册'}<span>三上 · 第{course.lessonNumber}课{teacher ? ' · 教师投屏' : ''}</span></span><h1>{independent ? mode === 'words' ? '字词独立练习' : '纸笔独立练习' : poems.length ? '古诗三首' : course.title}</h1></div>{teacher && <div className="cnl-teacher-controls"><button aria-label="减小正文" onClick={() => setTextScale(value => Math.max(.9, Math.round((value - .1) * 10) / 10))}><Minus size={15} /></button><span>{Math.round(textScale * 100)}%</span><button aria-label="放大正文" onClick={() => setTextScale(value => Math.min(1.1, Math.round((value + .1) * 10) / 10))}><Plus size={15} /></button><button aria-label={presentationPaused ? '恢复画面动效' : '暂停动效和声音'} aria-pressed={presentationPaused} onClick={() => { if (!presentationPaused) stopAll(); setPresentationPaused(!presentationPaused); }}>{presentationPaused ? <Play size={17} /> : <Pause size={17} />}</button><button aria-label="切换全屏" onClick={() => void toggleFullscreen()}><Maximize size={17} /></button></div>}<button className="kf-resource" ref={dialogTrigger} onClick={() => { stopAll(); dialog.current?.showModal(); }}><BookOpen size={18} /><span>资料与指导</span></button></header>
    {poems.length > 0 && mode !== 'words' && <div className="cnl-poem-selector" role="group" aria-label="直接选择古诗">{poems.map((item, index) => <button key={item.id} aria-pressed={index === poemIndex} className={index === poemIndex ? 'is-active' : ''} onClick={() => selectPoem(index)}>{item.title}</button>)}{mode === 'read' && <button className={`cnl-poem-tool ${poemTool ? 'is-active' : ''}`} aria-pressed={poemTool} onClick={() => { stopAll(); setPoemTool(!poemTool); }}>{poemTool ? '回看诗句' : '诗意工具'}<Search size={14} /></button>}</div>}
    <nav className="kf-tabs cnl-tabs" aria-label="直接选择本课学习内容">{modes.map(({ id, label, icon: Icon }, index) => <button key={id} aria-current={mode === id ? 'page' : undefined} className={mode === id ? 'is-active' : ''} onClick={() => changeMode(id)}><span className="kf-tab-number">0{index + 1}</span><Icon size={18} /><span>{label}</span></button>)}</nav>
    <section className={`kf-panel cnl-panel cnl-panel-${mode} ${mode === 'read' && poemTool && poem ? 'cnl-tool-panel' : ''}`} aria-label={modes.find(item => item.id === mode)?.label}>
      {mode === 'read' && poem && poemTool ? renderTool() : (mode === 'read' || mode === 'recite') && <>
        <div className="cnl-art"><div className="cnl-art-top"><span><Leaf size={16} />{poem ? `${poem.title} · 诗意画面` : prediction ? '读到这里，先留一个问题' : step.label}</span><small>教学情境示意</small></div><div className="cnl-art-body"><PrecisionIllustration courseId={courseId} step={poem ? lineIndex : prediction ? 0 : stepIndex} variant={poem?.id} paused={presentationPaused} /></div><div className="cnl-art-bottom"><span /><p>{poem ? mode === 'recite' && mask === 'hidden' ? '看画面，试着回想诗句。' : poem.lines[lineIndex].clue : prediction ? '用已经读到的线索猜想，后文由你主动展开。' : step.prompt}</p></div>{!poem && !prediction && <div className="cnl-step-buttons" role="group" aria-label="直接选择课文情境">{material.steps.map((item, index) => <button key={index} aria-pressed={index === stepIndex} className={index === stepIndex ? 'is-active' : ''} onClick={() => selectStep(index)}><small>0{index + 1}</small>{item.label}</button>)}</div>}</div>
        <div className="cnl-read-body">
          {poem ? <><div className="cnl-reading-top"><div><span className="cnl-eyebrow">{mode === 'recite' ? courseId === 'cn-20' ? '选做练习 · 教材必背范围待核' : '看画面想诗句，再展开核对' : '诗句、景物与心情一起读'}</span><h2>{poem.title}<small>{poem.dynasty} · {poem.author}</small></h2></div>{mode === 'read' && <button className="cnl-text-button" aria-pressed={pinyin} onClick={() => setPinyin(!pinyin)}>拼音</button>}</div>
            {mode === 'recite' && <div className="cnl-mask-controls" role="group" aria-label="背诵提示">{(['full', 'clue', 'hidden'] as const).map(value => <button key={value} aria-pressed={mask === value} className={mask === value ? 'is-active' : ''} onClick={() => { stopAudio(); setMask(value); }}>{({ full: '看全文', clue: '留线索', hidden: '只看画面' })[value]}</button>)}</div>}
            <div className="cnl-poem-lines">{poem.lines.map((line, index) => <button key={index} aria-pressed={index === lineIndex} aria-label={mode === 'recite' && mask !== 'full' ? `第${index + 1}句的画面` : line.text} className={index === lineIndex ? 'is-active' : ''} onClick={() => { stopAudio(); setLineIndex(index); }}><span>0{index + 1}</span>{mode === 'recite' && mask !== 'full' ? <strong>{mask === 'clue' ? line.clue : '·······'}</strong> : <strong>{pinyin && mode === 'read' ? [...line.text].map((character, charIndex) => /\p{Script=Han}/u.test(character) ? <ruby key={charIndex}>{character}<rt>{line.pinyin.split(/\s+/)[charIndex]}</rt></ruby> : character) : line.text}</strong>}</button>)}</div>
            {mode === 'read' ? <div className="cnl-meaning"><span>这句诗写的是</span><p>{poem.lines[lineIndex].meaning}</p></div> : <p className="cnl-recite-note">先试着背一遍，再展开核对。{courseId === 'cn-20' && '本课三首均为选做，教材必背范围待核。'}</p>}
            <div className="cnl-audio-tools"><button className="cnl-text-button" onClick={() => playing ? stopAudio() : playQueue(poem.lines.map((line, index) => ({ id: `${courseId}-poem-${poem.id}-${index}`, text: line.text })))}>{playing ? <Pause size={18} /> : <Volume2 size={18} />}{playing ? '停止朗读' : '听全诗'}</button>{mode === 'read' && <button className="cnl-text-button" onClick={() => playQueue([{ id: `${courseId}-poem-${poem.id}-${lineIndex}`, text: poem.lines[lineIndex].text }])}><Volume2 size={17} />听这一句</button>}</div><p className="cnl-small" role="status">{audioStatus || (mode === 'recite' && mask === 'hidden' ? '试过以后，再展开诗句核对。背默范围见纸笔自查。' : poem.note)}</p>
          </> : <><div className="cnl-page-heading"><span className="cnl-eyebrow">{prediction ? '只用现在已读到的情节' : precision?.goal || '带着一个问题读'}</span><h2>{prediction ? '故事从这里开始' : step.label}</h2></div><p className="cnl-read-summary">{known}</p>{material.classicalText?.[stepIndex] && <div className="cnl-classical"><span>文言原句 · 公版文字</span><p>{material.classicalText[stepIndex].text}</p></div>}<div className="cnl-read-question"><span>留心这一点</span><p>{prediction ? firstStop?.question || step.prompt : explanation ? step.explanation : step.prompt}</p></div>{!prediction && <button className="cnl-text-button cnl-explanation-toggle" aria-expanded={explanation} onClick={() => setExplanation(!explanation)}>{explanation ? '回看问题' : '说一说，再看看解释'}{explanation ? <EyeOff size={16} /> : <Eye size={16} />}</button>}<div className="cnl-read-actions">{!prediction && getLessonAudioEntry(`${courseId}-explain-${stepIndex}`) && <button className="cnl-text-button" onClick={() => playing ? stopAudio() : playQueue([{ id: `${courseId}-explain-${stepIndex}` }])}>{playing ? <Pause size={17} /> : <Volume2 size={17} />}{playing ? '停止讲解' : '听讲解'}</button>}<button className="cnl-primary" onClick={() => changeMode('practice')}>{prediction ? '试着预测' : '打开阅读工具'}<ArrowRight size={16} /></button></div><p className="cnl-small" role="status">{audioStatus || (prediction ? '不求猜中，重点是找到理由并读后比较。' : '讲解为原创归纳，配合手边课本阅读。')}</p></>}
        </div>
      </>}
      {mode === 'practice' && renderTool()}
      {mode === 'words' && <ChineseWordWorkbench ref={workbench} courseId={courseId} writingFocus={[]} recognitionFocus={[]} initialCharacter={course.writing[0]?.text || course.recognition[0]?.text} onHiddenChange={setWordHidden} />}
      {mode === 'paper' && <div className={`cnl-paper ${skim ? 'cnl-paper-optional' : ''}`}>
        <div className="cnl-paper-head"><div><span className="cnl-eyebrow">{skim ? '选做记录 · 不新增必写' : '取出纸笔，先尝试再核对'}</span><h2>{skim ? precision?.paperTask.title || '把阅读发现记在纸上' : paperType === 'poem' ? `${targetPoemRequired ? '教材必默' : '选做默写'} · ${poem.title}` : paperType === 'memory' ? '记住字，再独立写' : '看拼音，在纸上写词语'}</h2></div>{!skim && <div className="cnl-paper-types">{paperWords.length > 0 && <button aria-pressed={paperType === 'words'} onClick={() => { setPaperType('words'); setPaperPage(0); resetPaper(); }}>拼音写词</button>}{course.writing.length > 0 && <button aria-pressed={paperType === 'memory'} onClick={() => { setPaperType('memory'); setPaperPage(0); resetPaper(); }}>记字再写</button>}{poem && <button aria-pressed={paperType === 'poem'} onClick={() => { setPaperType('poem'); resetPaper(); }}>写诗句</button>}</div>}</div>
        {skim ? <><p className="cnl-paper-optional-note">本课以认读和阅读交流为主。下面是原创选做记录，可以口头交流，也可以记在纸上。</p><div className="cnl-observation-paper">{(precision?.paperTask.prompts || material.teacherPrompts.slice(0, 3)).map((prompt, index) => <div key={prompt}><span>0{index + 1}</span><p>{prompt}</p><i /></div>)}</div><div className="cnl-paper-actions"><p>{precision?.paperTask.note || '不把选做记录列为教材必写任务。'}</p><button className="cnl-primary" onClick={printLesson}><Printer size={18} />打印观察纸</button></div></> : !revealed ? <>
          {paperType === 'poem' ? <div className="cnl-poem-paper">{poem.lines.map((line, index) => <div key={index}><span>{index + 1}</span>{Array.from({ length: [...line.text].filter(char => /\p{Script=Han}/u.test(char)).length }, (_, index) => <i key={index} />)}<small>标点</small></div>)}</div> : <div className="cnl-paper-grid">{paperItems.map((item, index) => <div key={item.id}><span>{paperPage * 6 + index + 1}</span>{paperType === 'words' ? <><p>{item.pinyin}</p><div>{[...item.text].map((_, index) => <i key={index} />)}</div>{getLessonAudioEntry(item.id, item.text) && <button className="cnl-paper-listen" aria-label={`听第${index + 1}个词`} onClick={() => playQueue([{ id: item.id, text: item.text }])}><Volume2 size={18} /></button>}</> : <><p className="cnl-memory-character">{memoryHidden ? '□' : item.text}</p><small>{memoryHidden ? '在纸上写出这个字' : '看清字形，再遮住写'}</small></>}</div>)}</div>}
          <div className="cnl-paper-actions"><p>{paperType === 'poem' ? targetPoemRequired ? '按公开预览课后要求默写《山行》，写全诗句和标点。' : '这是选做检查，不增加教材必默要求。2026纸本范围待核。' : paperType === 'memory' && !memoryHidden ? '先记字形，再遮住独立写。' : '在纸上尝试以后，再展开核对。'}</p>{paperType === 'memory' && !memoryHidden ? <button className="cnl-primary" onClick={() => { stopAudio(); setMemoryHidden(true); }}>遮住字，开始写<EyeOff size={17} /></button> : <button className="cnl-primary" onClick={() => { stopAudio(); setRevealed(true); }}>展开，核对纸稿<Eye size={17} /></button>}</div>
        </> : <div className="cnl-paper-review"><div><span className="cnl-eyebrow">对照自己的纸稿</span>{paperType === 'poem' ? <div className="cnl-paper-poem-answer">{poem.lines.map((line, index) => <p key={index}>{line.text}</p>)}</div> : <div className="cnl-paper-answers">{paperItems.map((item, index) => <p key={item.id}><span>{paperPage * 6 + index + 1}</span><strong>{item.text}</strong><small>{item.pinyin}</small></p>)}</div>}<button className="cnl-text-button" onClick={resetPaper}><RotateCcw size={16} />重试这一组</button></div><div className="cnl-paper-checklist"><strong>哪些内容还要再练？</strong>{paperTargets.map(item => <label key={item.id}><input type="checkbox" checked={errors.includes(item.id)} onChange={() => toggleError(item.id)} />{paperType === 'poem' ? '有错字、漏字或标点问题' : item.text}</label>)}{!teacher && <><label className="cnl-adult-check"><input type="checkbox" checked={adult} onChange={event => { setAdult(event.target.checked); setSaved(false); }} />大人已查看纸稿</label><button className="cnl-primary" disabled={saved} onClick={saveCheck}>{saved ? '本次已保存' : '保存这次纸稿检查'}<Check size={17} /></button></>}<p className="cnl-small" role="status">{saveMessage || (teacher ? '投屏模式不读取或保存个人学习记录。' : '自查与大人核对分开记录，不产生掌握分数。')}</p></div></div>}
        {!skim && <div className="cnl-paper-bottom"><p className="cnl-small" role="status">{audioStatus || (lastCheck ? `上次${lastCheck.adult ? '大人核对' : '自查'}：${new Date(lastCheck.at).toLocaleDateString('zh-CN')} · ${lastCheck.needsPractice.length ? '有内容要再练' : '当次未标记错误'}` : teacher ? '可以用纸稿共同讨论，投屏不写个人记录。' : '只记录这次的纸稿情况，下一次可以换一组。')}</p>{paperType !== 'poem' && paperPages > 1 && <div className="cnl-paper-pages">{Array.from({ length: paperPages }, (_, index) => <button key={index} className={paperPage === index ? 'is-active' : ''} aria-pressed={paperPage === index} onClick={() => { setPaperPage(index); resetPaper(); }}>第{index + 1}组</button>)}</div>}</div>}
      </div>}
    </section>
    <footer className="kf-footer cnl-footer"><span><BookOpen size={15} />{presentationStatus || (initialTab === 'memory' && !poems.length && mode === 'read' ? '背默内容须按纸本与老师要求核对，先回到阅读。' : '') || (independent ? '先自己尝试，再展开核对。' : ({ read: '画面帮助理解，文字回到纸本核对。', practice: prediction ? '有依据的猜想可以与后文不同。' : '把操作与文字联系起来，说明你的发现。', words: skim ? '会认字放进词语读，不新增必写。' : '认读、理解与纸笔独立写，随时切换。', recite: courseId === 'cn-20' ? '本课三首选做记忆，教材必背范围待核。' : '先理解，再背诵；展开后逐句核对。', paper: skim ? '原创选做记录，可以口头交流。' : '具体错误留在纸稿上，下次再核对。' })[mode])}</span><span className="kf-footer-mark">阅读手册<i>{String(course.lessonNumber).padStart(2, '0')}</i></span></footer>
    <dialog className="kf-dialog cnl-dialog" ref={dialog} onClose={() => dialogTrigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="cnl-resource-title"><div className="kf-dialog-heading"><div><span className="cnl-eyebrow">给陪伴学习的大人</span><h2 id="cnl-resource-title">{independent ? '独立练习说明' : '资料与课堂指导'}</h2></div><button className="kf-dialog-close" aria-label="关闭资料与指导" onClick={() => dialog.current?.close()}><X size={22} /></button></div><div className="kf-dialog-body">{independent ? <p>现在保留独立尝试的空间。展开卡片或纸稿核对区以后，再查阅教学资料。</p> : <><p>{precision?.goal || material.intro}</p><h3>课堂里可以这样用</h3><ol>{(precision?.teacherPrompts || material.teacherPrompts).map(prompt => <li key={prompt}>{prompt}</li>)}</ol><div className="cnl-adult-tools"><button onClick={printLesson}><Printer size={18} />打印一页练习纸</button><a href={chineseLessonHref(courseId, !teacher)} onClick={() => { stopAll(); dialog.current?.close(); }}><Users size={18} />{teacher ? '学生使用' : '教师投屏'}</a>{courseId === 'cn-04' && <a href={chineseLessonHref('shanxing', teacher)} onClick={() => dialog.current?.close()}>《山行》诗画版<ArrowRight size={15} /></a>}</div><h3>教材要求与边界</h3><p>背诵：{course.recitation.status === 'preview_checked' ? course.recitation.scope.join('、') : course.recitation.status === 'not_specified_in_preview' ? '同目录公开预览未指定，另看老师布置' : '具体范围待核对纸本课后题，空清单不是没有要求'}。</p><p>语句默写：{course.dictation.status === 'preview_checked' ? course.dictation.scope.join('、') : course.dictation.status === 'not_specified_in_preview' ? '同目录公开预览未指定' : '具体范围待核，不默认整课默写'}。</p>{skim && <p>本课以认读和阅读交流为主；观察纸为原创选做，不新增必写任务。</p>}<h3>内容核对资料</h3>{studioSources.map(source => <a className="cnl-source" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title}<ExternalLink size={14} /></strong><small>{source.note}</small></a>)}{material.sourceUrls.filter(url => !studioSources.some(source => source.url === url)).map((url, index) => <a className="cnl-source" key={url} href={url} target="_blank" rel="noopener noreferrer">本课内容核对资料 {index + 1}<ExternalLink size={14} /></a>)}<h3>内容说明</h3><p>{precision?.sourceNote || material.sourceNotes}</p><p>2026教材目录已有纸本照片依据；字词、现代正文与大部分背默要求的纸本内页仍待复核。现代课文展示原创归纳；古诗、文言展示公版文字。情境图为教学示意，后续按具体对象与动作显示；总览与局部观察可使用同一背景。语音是合成练习示范，仍须教师审听。纸稿记录只在学生主动保存时写入当前浏览器；教师投屏不读取或保存个人记录。</p></>}</div></dialog>
    <section className="cnl-print" aria-hidden="true"><h1>{mode === 'words' && wordHidden ? '独立练习记录' : `第${course.lessonNumber}课 · ${poem?.title || course.title}`}</h1><p>姓名：____________　日期：____________</p>{mode === 'words' && wordHidden ? <><h2>先独立尝试，再展开核对</h2>{[1, 2, 3, 4].map(index => <p key={index}>____________________________________________________________</p>)}</> : <><h2>一、{precision?.paperTask.title || '阅读发现与依据'}</h2>{(precision?.paperTask.prompts || material.teacherPrompts.slice(0, 2)).slice(0, 2).map(prompt => <p key={prompt}>{prompt}<br />____________________________________________________________</p>)}{!skim && <><h2>二、{paperType === 'poem' ? `${targetPoemRequired ? '教材必默' : '选做默写'} · ${poem.title}` : '本组字词纸写'}</h2>{paperType === 'poem' ? poem.lines.map((line, index) => <p className="cnl-print-poem-row" key={index}>{[...line.text].filter(char => /\p{Script=Han}/u.test(char)).map((_, i) => <i key={i} />)}<small>标点</small></p>) : paperWords.length ? <div className="cnl-print-words">{paperWords.slice(paperPage * 6, paperPage * 6 + 6).map(item => <div key={item.id}><span>{item.pinyin}</span><p>{[...item.text].map(() => '□').join(' ')}</p></div>)}</div> : <p>可从本课会写字中自选：________________。记住字形，合书写，再核对。</p>}</>}<h2>{skim ? '二' : '三'}、回看自己的记录</h2><p>□ 线索说清了　□ 字形　□ 漏字　□ 标点<br />下次还想核对：________________________________________</p><small>{precision?.paperTask.note || '原创纸笔任务可按课堂需要选择，教材要求以纸本与老师布置为准。'}{poem && !targetPoemRequired && '诗句默写是选做，不增加教材必默范围。'}</small></>}</section>
  </main>;
}
