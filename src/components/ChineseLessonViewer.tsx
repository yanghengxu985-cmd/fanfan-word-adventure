import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Eye, EyeOff, Leaf, Pause, Pencil, Printer, RotateCcw, Volume2, X, ExternalLink, Users } from 'lucide-react';
import { getLessonWords, getLessonPaperWords, lessonCourseById, lessonMaterialById, type WordCategory } from '../data/chineseLessons';
import { studioSources } from '../data/chineseBookStudio';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';
import { readPaperChecks, savePaperCheck } from '../lib/chineseLessonPaper';
import ChineseLessonArt from './ChineseLessonArt';
import ChineseLessonActivity from './ChineseLessonActivity';
import './chineseLessonViewer.css';

type Mode = 'read' | 'words' | 'practice' | 'recite' | 'paper';
type PaperType = 'words' | 'memory' | 'poem';
type Mask = 'full' | 'clue' | 'hidden';
const categoryLabels: Record<WordCategory, string> = { recognition: '会认字', writing: '会写字', words: '课内词语' };

export default function ChineseLessonViewer({ courseId, teacher = false }: { courseId: string; teacher?: boolean }) {
  const course = lessonCourseById.get(courseId);
  const material = lessonMaterialById.get(courseId);
  if (!course || !material) return <main className="cnl-missing"><h1>这一课暂时没有找到</h1><a href="#/chinese-book">返回全册课堂</a></main>;
  return <LessonContent key={`${courseId}-${teacher ? 'teacher' : 'student'}`} courseId={courseId} teacher={teacher} />;
}

function LessonContent({ courseId, teacher }: { courseId: string; teacher: boolean }) {
  const course = lessonCourseById.get(courseId)!;
  const material = lessonMaterialById.get(courseId)!;
  const poems = material.poems || [];
  const [mode, setMode] = useState<Mode>('read');
  const [stepIndex, setStepIndex] = useState(0);
  const [visited, setVisited] = useState(0);
  const [explanation, setExplanation] = useState(false);
  const [poemIndex, setPoemIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [pinyin, setPinyin] = useState(false);
  const [mask, setMask] = useState<Mask>('full');
  const [category, setCategory] = useState<WordCategory>(course.writing.length ? 'writing' : 'recognition');
  const [wordIndex, setWordIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const paperWords = getLessonPaperWords(course);
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
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement>(null);
  const player = useRef<ReturnType<typeof createChineseLessonAudioPlayer> | null>(null);
  const audioQueue = useRef<{ id: string; text?: string }[]>([]);
  const poem = poems[poemIndex];
  const step = material.steps[stepIndex];
  const words = getLessonWords(course, category);
  const word = words[wordIndex];
  const isPredict = material.activity.kind === 'predict';
  const isSkim = !course.writing.length && !poems.length;
  const categories = (['recognition', 'writing', 'words'] as const).filter(kind => course[kind].length > 0);
  const paperBank = paperType === 'memory' ? course.writing.map(item => ({ id: item.lexemeId, text: item.text, pinyin: '' })) : paperWords;
  const paperItems = paperBank.slice(paperPage * 6, paperPage * 6 + 6);
  const paperPages = Math.ceil(paperBank.length / 6);
  const modes: { id: Mode; label: string; icon: typeof Leaf }[] = poems.length
    ? [{ id: 'read', label: '看懂诗', icon: Leaf }, { id: 'words', label: '字词', icon: BookOpen }, { id: 'recite', label: courseId === 'cn-04' ? '背下来' : '记诗句', icon: EyeOff }, { id: 'paper', label: '纸上写', icon: Pencil }]
    : [{ id: 'read', label: '看懂课文', icon: Leaf }, { id: 'words', label: '字词', icon: BookOpen }, { id: 'practice', label: '读懂练习', icon: CheckCircle2 }, ...(!isSkim ? [{ id: 'paper' as const, label: '纸上写', icon: Pencil }] : [])];

  function stopAudio() { audioQueue.current = []; player.current?.stop(); setPlaying(false); setAudioStatus(''); }
  function playQueue(clips: { id: string; text?: string }[]) {
    stopAudio();
    if (!clips.length) return;
    player.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent: event => {
      if (event === 'ended' && audioQueue.current.length) {
        const next = audioQueue.current.shift()!; player.current?.play(next.id, next.text);
      } else { audioQueue.current = []; setPlaying(false); }
    } });
    const [first, ...rest] = clips; audioQueue.current = rest; setPlaying(true); player.current.play(first.id, first.text);
  }
  function resetPaper() { stopAudio(); setRevealed(false); setMemoryHidden(false); setErrors([]); setAdult(false); setSaved(false); setSaveMessage(''); }
  function changeMode(next: Mode) { stopAudio(); if (next === 'paper' && mode !== 'paper') resetPaper(); setMode(next); }
  function selectStep(index: number) { stopAudio(); setStepIndex(index); setExplanation(false); }
  function selectPoem(index: number) { stopAudio(); setPoemIndex(index); setLineIndex(0); setMask('full'); resetPaper(); }
  function saveCheck() {
    if (teacher || !revealed) return;
    const targetIds = paperType === 'poem' ? [poem.id] : paperItems.map(item => item.id);
    const value = { courseId, at: new Date().toISOString(), type: paperType, targetIds, needsPractice: errors, adult };
    try { savePaperCheck(localStorage, value); setLastCheck(value); setSaved(true); setSaveMessage(`${adult ? '大人核对' : '自查'}已保存；这是本次检查。`); }
    catch { setSaveMessage('浏览器没能保存，请记下本次需要再练的内容。'); }
  }
  function toggleError(id: string) { setErrors(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); setSaved(false); }
  useEffect(() => {
    const previous = document.title; document.title = `${course.title} · 三上语文课堂`;
    return () => { audioQueue.current = []; player.current?.stop(); document.title = previous; };
  }, [course.title]);

  const targetPoemRequired = !!poem && course.dictation.scope.some(title => title === poem.title) && course.dictation.status === 'preview_checked';
  const footerText: Record<Mode, string> = { read: isPredict ? '先说出猜想和依据，再读后文。' : '画面帮助理解，内容回课本核对。', words: '读准、组词；会写还要在纸上独立写。', practice: '说出依据，比只选对更重要。', recite: '先理解诗意，再逐渐遮住提示。', paper: '先独立写，再对照纸稿找错。' };
  const next = modes[(modes.findIndex(item => item.id === mode) + 1) % modes.length];
  const paperTargets = paperType === 'poem' ? [{ id: poem.id, text: poem.title }] : paperItems;

  return <main className="cnl-lesson" data-mode={mode}>
    <header className="cnl-head"><a className="cnl-back" href={`#/chinese-book/${courseId}`}><ArrowLeft size={20} /><span>全册课堂</span></a><div className="cnl-heading"><span className="cnl-eyebrow">三上语文 · 第{course.lessonNumber}课{teacher ? ' · 教师投屏' : ''}</span><h1>{poems.length ? '古诗三首' : course.title}</h1></div><button className="cnl-resource" ref={dialogTrigger} onClick={() => { stopAudio(); dialog.current?.showModal(); }}><BookOpen size={19} /><span>资料与指导</span></button></header>
    {poems.length > 0 && <div className="cnl-poem-selector" role="group" aria-label="选择古诗">{poems.map((item, index) => <button key={item.id} aria-pressed={index === poemIndex} className={index === poemIndex ? 'is-active' : ''} onClick={() => selectPoem(index)}>{item.title}</button>)}{courseId === 'cn-04' && <a href="#/chinese-lesson/shanxing">《山行》诗画版 <ArrowRight size={14} /></a>}</div>}
    <nav className="cnl-tabs" aria-label="这一课的学习内容">{modes.map(({ id, label, icon: Icon }) => <button key={id} aria-pressed={mode === id} className={mode === id ? 'is-active' : ''} onClick={() => changeMode(id)}><Icon size={18} />{label}</button>)}</nav>

    <section className={`cnl-panel cnl-panel-${mode}`} aria-label={modes.find(item => item.id === mode)?.label}>
      {(mode === 'read' || mode === 'recite') && <>
        <div className="cnl-art"><div className="cnl-art-top"><Leaf size={16} />{poem ? `${poem.title} · 诗意画面` : step.label}<span>原创情境图</span></div><ChineseLessonArt courseId={courseId} step={poem ? lineIndex : stepIndex} variant={poem?.id} /><div className="cnl-art-bottom">{poem ? poem.lines[lineIndex].clue : step.prompt}</div>
          {!poem && <div className="cnl-step-buttons" role="group" aria-label="选择课文画面">{material.steps.map((item, index) => (!isPredict || index <= visited) && <button key={index} aria-pressed={index === stepIndex} className={index === stepIndex ? 'is-active' : ''} onClick={() => selectStep(index)}>{isPredict ? `已读${index + 1}` : item.label}</button>)}</div>}
        </div>
        <div className="cnl-read-body">
          {poem ? <><div className="cnl-reading-top"><h2>{poem.title}<small>{poem.dynasty} · {poem.author}</small></h2>{mode === 'read' && <button className="cnl-text-button" aria-pressed={pinyin} onClick={() => setPinyin(!pinyin)}>拼音</button>}</div>
            {mode === 'recite' && <div className="cnl-mask-controls" role="group" aria-label="背诵提示">{(['full', 'clue', 'hidden'] as const).map(value => <button key={value} aria-pressed={mask === value} className={mask === value ? 'is-active' : ''} onClick={() => { stopAudio(); setMask(value); }}>{({ full: '看全文', clue: '留线索', hidden: '只看画面' })[value]}</button>)}</div>}
            <div className="cnl-poem-lines">{poem.lines.map((line, index) => <button key={index} aria-pressed={index === lineIndex} aria-label={mode === 'recite' && mask !== 'full' ? `第${index + 1}句的画面` : line.text} className={index === lineIndex ? 'is-active' : ''} onClick={() => { stopAudio(); setLineIndex(index); }}><span>{String(index + 1).padStart(2, '0')}</span>{mode === 'recite' && mask !== 'full' ? <strong>{mask === 'clue' ? line.clue : '·······'}</strong> : <strong>{pinyin && mode === 'read' ? [...line.text].map((character, charIndex) => /\p{Script=Han}/u.test(character) ? <ruby key={charIndex}>{character}<rt>{line.pinyin.split(/\s+/)[charIndex]}</rt></ruby> : character) : line.text}</strong>}</button>)}</div>
            <div className="cnl-audio-tools"><button onClick={() => playing ? stopAudio() : playQueue(poem.lines.map((line, index) => ({ id: `${courseId}-poem-${poem.id}-${index}`, text: line.text })))}>{playing ? <Pause size={18} /> : <Volume2 size={18} />}{playing ? '停止' : '听全诗'}</button>{mode === 'read' && <button onClick={() => playQueue([{ id: `${courseId}-poem-${poem.id}-${lineIndex}`, text: poem.lines[lineIndex].text }])}><Volume2 size={17} />听这一句</button>}</div>
            {mode === 'read' ? <div className="cnl-meaning"><span>这句诗写的是</span><p>{poem.lines[lineIndex].meaning}</p></div> : <p className="cnl-recite-note">先看画面背一遍，再展开全文核对。{courseId === 'cn-20' && '这是自选练习，教材必背范围待核。'}</p>}<p className="cnl-small" role="status">{audioStatus || poem.note}</p>
          </> : <><span className="cnl-eyebrow">带着一个问题读</span><h2>{step.label}</h2><p className="cnl-read-summary">{step.summary}</p>
            {material.classicalText?.[stepIndex] && <div className="cnl-classical"><span>文言原句</span><p>{material.classicalText[stepIndex].text}</p><small>{material.classicalText[stepIndex].meaning}</small></div>}
            <div className="cnl-read-question"><span>想一想</span><p>{step.prompt}</p></div><button className="cnl-text-button cnl-explanation-toggle" aria-expanded={explanation} onClick={() => setExplanation(!explanation)}>{explanation ? '收起解释' : '说过了，看看解释'}{explanation ? <EyeOff size={16} /> : <Eye size={16} />}</button>{explanation && <p className="cnl-read-explanation">{step.explanation}</p>}
            <div className="cnl-audio-tools"><button onClick={() => playing ? stopAudio() : playQueue([{ id: `${courseId}-explain-${stepIndex}` }])}>{playing ? <Pause size={18} /> : <Volume2 size={18} />}{playing ? '停止' : '听讲解'}</button><span>原创讲解，配合课本读</span></div><p className="cnl-small" role="status">{audioStatus}</p>
            {isPredict && <div className="cnl-predict-next">{stepIndex < material.steps.length - 1 ? <button className="cnl-primary" onClick={() => { const nextIndex = stepIndex + 1; setVisited(Math.max(visited, nextIndex)); selectStep(nextIndex); }}>说出猜想了，读后文 <ArrowRight size={18} /></button> : <p>读后文后，想想哪些猜想需要调整。猜得不同也可以有依据。</p>}</div>}
          </>}
        </div>
      </>}

      {mode === 'words' && <div className="cnl-words-panel"><div className="cnl-word-library"><div className="cnl-word-categories" role="group" aria-label="字词类别">{categories.map(kind => <button key={kind} aria-pressed={category === kind} className={category === kind ? 'is-active' : ''} onClick={() => { stopAudio(); setCategory(kind); setWordIndex(0); }}>{categoryLabels[kind]}<span>{course[kind].length}</span></button>)}</div><div className="cnl-word-chips" role="group" aria-label="选择字词">{words.map((item, index) => <button key={item.id} aria-pressed={index === wordIndex} className={index === wordIndex ? 'is-active' : ''} onClick={() => { stopAudio(); setWordIndex(index); }}>{item.text}</button>)}</div><p className="cnl-small">点一个字或词，读一读、说说意思。</p></div>
        {word && <div className="cnl-word-card"><span className="cnl-eyebrow">{categoryLabels[category]}</span><div className={`cnl-word-face ${word.text.length > 3 ? 'is-long' : ''}`}><span>{word.pinyin || '读音请对照课本'}</span><strong>{word.text}</strong></div>{word.meaning && <p className="cnl-word-meaning">{word.meaning}</p>}{word.context && <p className="cnl-word-context">{word.context}</p>}
          {word.examples.length > 0 && category !== 'words' && <div className="cnl-grouping"><span>放在词语里读</span>{word.examples.map(item => <button key={item.text} onClick={() => item.id && getLessonAudioEntry(item.id, item.text) ? playQueue([{ id: item.id, text: item.text }]) : getLessonAudioEntry('', item.text) && playQueue([{ id: '', text: item.text }])}><strong>{item.text}</strong><small>{item.pinyin}</small>{getLessonAudioEntry(item.id || '', item.text) && <Volume2 size={14} />}</button>)}</div>}
          {getLessonAudioEntry(word.id, word.text) && <button className="cnl-word-audio" onClick={() => playQueue([{ id: word.id, text: word.text }])}><Volume2 size={19} />听读音</button>}<p className="cnl-small" role="status">{audioStatus || (category === 'words' ? '读懂词义，再放回课文里的句子。' : '组词是辅导例子，会写还要合书后检查纸稿。')}</p>
          <div className="cnl-word-task"><Pencil size={19} /><p>{category === 'recognition' ? '换到词语里再读一次，说说这个字的意思。' : category === 'writing' ? `在纸上独立写“${word.text}”，再组一个词。` : '合上字卡，试着说出词义，再用它说一句话。'}</p></div>
        </div>}
      </div>}

      {mode === 'practice' && <ChineseLessonActivity activity={isPredict && visited < material.steps.length - 1 ? { kind: 'predict', title: '先作预测，再看后文', instruction: '从已经读到的文字里找一条依据，猜猜接下来可能怎样。', explanation: '先猜想，再回到课本继续阅读。' } : material.activity} choices={isPredict && visited < material.steps.length - 1 ? [] : material.choices} onPredict={() => changeMode('read')} />}

      {mode === 'paper' && <div className="cnl-paper"><div className="cnl-paper-head"><div><span className="cnl-eyebrow">准备纸和笔</span><h2>{paperType === 'poem' ? `${targetPoemRequired ? '默写' : '自选默写'}《${poem.title}》` : paperType === 'memory' ? '记住字，再独立写' : '看拼音，在纸上写词语'}</h2></div><div className="cnl-paper-types">{paperWords.length > 0 && <button aria-pressed={paperType === 'words'} onClick={() => { setPaperType('words'); setPaperPage(0); resetPaper(); }}>拼音写词</button>}{course.writing.length > 0 && <button aria-pressed={paperType === 'memory'} onClick={() => { setPaperType('memory'); setPaperPage(0); resetPaper(); }}>记字再写</button>}{poem && <button aria-pressed={paperType === 'poem'} onClick={() => { setPaperType('poem'); resetPaper(); }}>写诗句</button>}</div></div>
        {!revealed ? <>
          {paperType === 'poem' ? <div className="cnl-poem-paper">{poem.lines.map((line, index) => <div key={index}><span>{index + 1}</span>{Array.from({ length: [...line.text].filter(char => /\p{Script=Han}/u.test(char)).length }, (_, index) => <i key={index} />)}<small>标点</small></div>)}</div> : <div className="cnl-paper-grid">{paperItems.map((item, index) => <div key={item.id}><span>{index + 1}</span>{paperType === 'words' ? <><p>{item.pinyin}</p><div>{[...item.text].map((_, index) => <i key={index} />)}</div><button className="cnl-paper-listen" aria-label={`听第${index + 1}个词`} onClick={() => playQueue([{ id: item.id, text: item.text }])}><Volume2 size={18} /></button></> : <><p className="cnl-memory-character">{memoryHidden ? '□' : item.text}</p><small>{memoryHidden ? '在纸上写出这个字' : '看清字形，再遮住写'}</small></>}</div>)}</div>}
          <div className="cnl-paper-actions"><p>{paperType === 'poem' ? targetPoemRequired ? '合上课本，写全诗句和标点。' : '本项是自选检查，教材必默范围待核。' : paperType === 'memory' && !memoryHidden ? '准备好了，遮住字再写；这一步练独立记写。' : '在纸上独立写，再展开答案核对。'}</p>{paperType === 'memory' && !memoryHidden ? <button className="cnl-primary" onClick={() => { stopAudio(); setMemoryHidden(true); }}>遮住字，开始写 <EyeOff size={18} /></button> : <button className="cnl-primary" onClick={() => { stopAudio(); setRevealed(true); }}>写完了，核对 <Eye size={18} /></button>}</div>
        </> : <div className="cnl-paper-review"><div><span className="cnl-eyebrow">对照自己的纸稿</span>{paperType === 'poem' ? <div className="cnl-paper-poem-answer">{poem.lines.map((line, index) => <p key={index}>{line.text}</p>)}</div> : <div className="cnl-paper-answers">{paperItems.map((item, index) => <p key={item.id}><span>{index + 1}</span><strong>{item.text}</strong><small>{item.pinyin}</small></p>)}</div>}<button className="cnl-text-button" onClick={resetPaper}><RotateCcw size={16} />重写这一组</button></div><div className="cnl-paper-checklist"><strong>哪些内容还要再练？</strong>{paperTargets.map(item => <label key={item.id}><input type="checkbox" checked={errors.includes(item.id)} onChange={() => toggleError(item.id)} />{paperType === 'poem' ? '有错字、漏字或标点问题' : item.text}</label>)}{!teacher && <><label className="cnl-adult-check"><input type="checkbox" checked={adult} onChange={event => { setAdult(event.target.checked); setSaved(false); }} />大人已查看纸稿</label><button className="cnl-primary" disabled={saved} onClick={saveCheck}>{saved ? '本次已保存' : '保存本次检查'} <Check size={18} /></button></>}<p className="cnl-small" role="status">{saveMessage || (teacher ? '投屏模式不保存个人学习记录。' : '自查和大人核对分开记录；选择正确不等于会写。')}</p></div></div>}
        <div className="cnl-paper-bottom"><p className="cnl-small" role="status">{audioStatus || (lastCheck ? `上次${lastCheck.adult ? '大人核对' : '自查'}：${new Date(lastCheck.at).toLocaleDateString('zh-CN')} · ${lastCheck.needsPractice.length ? '有内容要再练' : '当次未标记错误'}` : '只把这次的具体错误记下来，明天换一组再试。')}</p>{paperType !== 'poem' && paperPages > 1 && <button className="cnl-text-button" onClick={() => { setPaperPage((paperPage + 1) % paperPages); resetPaper(); }}>换一组 {paperPage + 1}/{paperPages}<ArrowRight size={16} /></button>}</div>
      </div>}
    </section>

    <footer className="cnl-footer"><p><Leaf size={17} />{footerText[mode]}</p><button className="cnl-primary" onClick={() => changeMode(next.id)}>{next.id === 'read' ? '回到课文' : `去${next.label}`}<ArrowRight size={18} /></button></footer>

    <dialog className="cnl-dialog" ref={dialog} onClose={() => dialogTrigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}><div className="cnl-dialog-head"><h2>这一课怎么用</h2><button aria-label="关闭资料与指导" onClick={() => dialog.current?.close()}><X size={20} /></button></div><div className="cnl-dialog-body"><p>{material.intro}</p><h3>大人可以这样问</h3><ol>{material.teacherPrompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ol><div className="cnl-adult-tools"><button onClick={() => window.print()}><Printer size={18} />打印一页练习纸</button><a href={`#/chinese-lesson/${courseId}${teacher ? '' : '/teacher'}`}><Users size={18} />{teacher ? '学生使用' : '教师投屏'}</a></div><h3>教材要求</h3><p>背诵：{course.recitation.status === 'preview_checked' ? course.recitation.scope.join('、') : course.recitation.status === 'not_specified_in_preview' ? '同目录公开预览未指定；另看老师布置' : '具体范围待核对课后题，空清单不是没有要求'}。</p><p>语句默写：{course.dictation.status === 'preview_checked' ? course.dictation.scope.join('、') : course.dictation.status === 'not_specified_in_preview' ? '同目录公开预览未指定' : '具体范围待核，不默认整课默写'}。</p><h3>补看与范写</h3>{studioSources.map(source => <a className="cnl-source" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title}<ExternalLink size={14} /></strong><small>{source.note}</small></a>)}{material.sourceUrls.filter(url => !studioSources.some(source => source.url === url)).map((url, index) => <a className="cnl-source" key={url} href={url} target="_blank" rel="noopener noreferrer">本课内容核对资料 {index + 1}<ExternalLink size={14} /></a>)}<h3>内容说明</h3><p>{material.sourceNotes}</p><p>教材目录按2026纸本照片确认；字词、正文及大部分背默要求的2026纸本内页尚待逐项复核。现代课文的讲解是原创归纳，结合手边课本阅读；古诗与文言展示公版原文。插画为教学想象，不是史实照片。语音是合成练习示范，技术检查不等于教师逐段审听。记录只保存在当前浏览器。</p></div></dialog>

    <section className="cnl-print" aria-hidden="true"><h1>第{course.lessonNumber}课 · {course.title}</h1><p>姓名：____________　日期：____________</p><h2>一、理解与说明</h2>{material.teacherPrompts.slice(0, 2).map(prompt => <p key={prompt}>{prompt}<br />____________________________________________________________</p>)}<h2>二、字词纸写</h2>{paperWords.length > 0 ? <div className="cnl-print-words">{paperWords.slice(paperPage * 6, paperPage * 6 + 6).map(item => <div key={item.id}><span>{item.pinyin}</span><p>{[...item.text].map(() => '□').join(' ')}</p></div>)}</div> : <p>本课{isSkim ? '以认读和理解为主，不新增必写。' : '会写字请按课本写字表选取；先记字形，遮住后独立写。'}</p>}{poem && <><h2>三、{targetPoemRequired ? '默写' : '自选默写'}《{poem.title}》</h2>{poem.lines.map((_, index) => <p key={index}>____________________________________________________________</p>)}</>}<h2>{poem ? '四' : '三'}、核对纸稿</h2><p>□ 字形　□ 漏字　□ 标点　□ 再练内容：________________________</p><small>按教材与老师要求核对，原创问题不等同于学校必考题；独立写过再核对，明天可以换一组复查。</small></section>
  </main>;
}
