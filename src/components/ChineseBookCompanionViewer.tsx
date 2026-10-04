import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Feather, Leaf, MessageCircle, Pause, Pencil, RotateCcw, Volume2, X, ExternalLink } from 'lucide-react';
import { chineseBookCompanions, type BookCompanion } from '../data/chineseBookCompanions';
import { chineseCompanionTasks } from '../data/chineseCompanionTasks';
import { getLessonWords, lessonCourseById, type LessonWord, type WordCategory } from '../data/chineseLessons';
import { studioSources } from '../data/chineseBookStudio';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';
import './chineseBookCompanionViewer.css';

type Tab = 'understand' | 'try' | 'paper';
type PaperPhase = 'view' | 'hidden' | 'review';
const companionsById = new Map(chineseBookCompanions.map(item => [item.id, item]));
const tabs: { id: Tab; label: string; icon: typeof Leaf }[] = [
  { id: 'understand', label: '理清内容', icon: Leaf },
  { id: 'try', label: '动手试试', icon: Feather },
  { id: 'paper', label: '纸上完成', icon: Pencil },
];
const kindLabels: Record<BookCompanion['kind'], string> = { writing: '习作', speaking: '口语交际', garden: '语文园地', reading: '快乐读书吧', example: '例文', review: '复习' };
const wordLabels: Record<WordCategory, string> = { writing: '会写字', recognition: '会认字', words: '词语' };

function getWordBank(companion: BookCompanion, unit: number, category: WordCategory): { words: LessonWord[]; fromGarden: boolean } {
  const garden = companion.kind === 'garden' ? lessonCourseById.get(`cn-garden-${companion.unit}`) : undefined;
  const fromGarden = !!garden && ['recognition', 'writing', 'words'].some(kind => garden[kind as WordCategory].length > 0);
  const courses = fromGarden ? [garden!] : [...lessonCourseById.values()].filter(course => course.kind === 'lesson' && course.unitNumber === unit);
  const unique = new Map<string, LessonWord>();
  for (const course of courses) for (const word of getLessonWords(course, category)) if (!unique.has(word.text)) unique.set(word.text, word);
  return { words: [...unique.values()], fromGarden };
}

export default function ChineseBookCompanionViewer({ companionId }: { companionId: string }) {
  const companion = companionsById.get(companionId);
  if (!companion || !chineseCompanionTasks[companionId]) return <main className="cnbc-missing"><h1>这个学习活动暂时没有找到</h1><a href="#/chinese-book">返回全册课堂</a></main>;
  return <CompanionContent key={companionId} companion={companion} />;
}

function CompanionContent({ companion }: { companion: BookCompanion }) {
  const task = chineseCompanionTasks[companion.id];
  const [tab, setTab] = useState<Tab>('understand');
  const [stepIndex, setStepIndex] = useState(0);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [exerciseChoice, setExerciseChoice] = useState<number | null>(null);
  const [exerciseShown, setExerciseShown] = useState(false);
  const [conversationIndex, setConversationIndex] = useState<number | null>(null);
  const [checks, setChecks] = useState<number[]>([]);
  const [paperDone, setPaperDone] = useState(false);
  const [category, setCategory] = useState<WordCategory>('writing');
  const [reviewUnit, setReviewUnit] = useState(companion.unit);
  const [wordIndex, setWordIndex] = useState(0);
  const [paperOffset, setPaperOffset] = useState(0);
  const [paperPhase, setPaperPhase] = useState<PaperPhase>('view');
  const [needsPractice, setNeedsPractice] = useState<string[]>([]);
  const [audioStatus, setAudioStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement>(null);
  const player = useRef<ReturnType<typeof createChineseLessonAudioPlayer> | null>(null);
  const isLexical = companion.kind === 'garden' || companion.kind === 'review';
  const bank = useMemo(() => getWordBank(companion, reviewUnit, category), [companion, reviewUnit, category]);
  const writingBank = useMemo(() => getWordBank(companion, reviewUnit, 'writing'), [companion, reviewUnit]);
  const word = bank.words[wordIndex];
  const paperPageCount = Math.max(1, Math.ceil(writingBank.words.length / 8));
  const paperWords = writingBank.words.slice(paperOffset * 8, paperOffset * 8 + 8);
  const step = task.steps[stepIndex];
  const hasDraft = Object.values(drafts).some(value => value.trim());

  function stopAudio() { player.current?.stop(); setPlaying(false); setAudioStatus(''); }
  function playWord(item: { id?: string; text: string }) {
    stopAudio();
    player.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent: () => setPlaying(false) });
    setPlaying(true); player.current.play(item.id || '', item.text);
  }
  function changeTab(next: Tab) { stopAudio(); setTab(next); }
  function changeCategory(next: WordCategory) { stopAudio(); setCategory(next); setWordIndex(0); }
  function changeUnit(unit: number) { stopAudio(); setReviewUnit(unit); setWordIndex(0); setPaperOffset(0); setPaperPhase('view'); setNeedsPractice([]); }
  function toggleCheck(index: number) { setChecks(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]); setPaperDone(false); }
  function resetPaper() { stopAudio(); setPaperPhase('view'); setNeedsPractice([]); setPaperDone(false); }
  function changePaperGroup(direction: number) { stopAudio(); setPaperOffset(current => (current + direction + paperPageCount) % paperPageCount); setPaperPhase('view'); setNeedsPractice([]); setPaperDone(false); }
  function selectStep(index: number) { stopAudio(); setStepIndex(index); }
  function primaryAction() {
    stopAudio();
    if (tab === 'understand') {
      if (stepIndex < task.steps.length - 1) setStepIndex(stepIndex + 1); else setTab('try');
    } else if (tab === 'try') {
      if (companion.kind === 'speaking' && task.conversation) {
        if (conversationIndex === null) setConversationIndex(0);
        else if (conversationIndex < task.conversation.length - 1) setConversationIndex(conversationIndex + 1);
        else setTab('paper');
      } else setTab('paper');
    } else if (isLexical) {
      if (paperPhase === 'view') setPaperPhase('hidden');
      else if (paperPhase === 'hidden') setPaperPhase('review');
      else { setPaperDone(true); }
    } else setPaperDone(true);
  }
  const primaryLabel = tab === 'understand' ? stepIndex < task.steps.length - 1 ? '继续下一步' : '去动手试试'
    : tab === 'try' ? companion.kind === 'speaking' && task.conversation ? conversationIndex === null ? '开始口头练习' : conversationIndex < task.conversation.length - 1 ? '继续下一轮' : '讲好了，去纸上完成' : isLexical ? '去纸上记写' : '整理好了，去纸上完成'
      : isLexical ? paperPhase === 'view' ? '遮住字，开始写' : paperPhase === 'hidden' ? '写完了，展开核对' : paperDone ? '本次核对完成' : '纸稿核对好了'
        : paperDone ? '本次完成' : companion.kind === 'speaking' ? '我已经讲过并核对了' : '我已在纸上完成';

  useEffect(() => {
    const previous = document.title; document.title = `${companion.title} · 三上语文课堂`;
    return () => { player.current?.stop(); document.title = previous; };
  }, [companion.title]);

  return <main className="cnbc-viewer" data-kind={companion.kind} data-tab={tab}>
    <header className="cnbc-header">
      <a className="cnbc-back" href={`#/chinese-book/${companion.id}`}><ArrowLeft size={20} /><span>全册课堂</span></a>
      <div className="cnbc-heading"><span className="cnbc-eyebrow">三上语文 · 第{companion.unit}单元 · {kindLabels[companion.kind]}{companion.page ? ` · ${companion.page}页` : ''}</span><h1>{companion.title}</h1></div>
      <button className="cnbc-resource" ref={dialogTrigger} onClick={() => { stopAudio(); dialog.current?.showModal(); }}><BookOpen size={20} /><span>资料与指导</span></button>
    </header>

    <nav className="cnbc-tabs" aria-label="学习活动">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'is-active' : ''} aria-pressed={tab === id} onClick={() => changeTab(id)}><Icon size={18} />{label}</button>)}</nav>

    <section className={`cnbc-panel cnbc-panel-${tab}`} aria-label={tabs.find(item => item.id === tab)?.label}>
      {tab === 'understand' && <>
        <aside className="cnbc-path"><div className="cnbc-path-intro"><Feather size={28} /><p>{task.intro}</p></div><div className="cnbc-step-list" role="group" aria-label="选择讲解步骤">{task.steps.map((item, index) => <button key={index} className={index === stepIndex ? 'is-active' : ''} aria-pressed={index === stepIndex} onClick={() => selectStep(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><ChevronRight size={16} /></button>)}</div><p className="cnbc-path-note">先想清，再自己说或写。</p></aside>
        <article className="cnbc-understand-body"><div className="cnbc-page-marker" aria-hidden="true">{String(stepIndex + 1).padStart(2, '0')}<span>/ {task.steps.length}</span></div><span className="cnbc-eyebrow">这一步这样做</span><h2>{step.title}</h2><p className="cnbc-step-detail">{step.detail}</p><div className="cnbc-question"><MessageCircle size={24} /><div><span>先口头想一想</span><p>{step.prompt}</p></div></div><div className="cnbc-goal-strip"><Leaf size={19} /><p>{companion.goal}</p></div></article>
      </>}

      {tab === 'try' && <div className={`cnbc-try-body ${isLexical ? 'is-lexical' : ''}`}>
        <div className="cnbc-focus-section"><div className="cnbc-section-heading"><div><span className="cnbc-eyebrow">选一个入口</span><h2>{isLexical ? '先试一个方法' : companion.kind === 'speaking' ? '准备自己的关键词' : companion.kind === 'reading' ? '留下这次读到的内容' : companion.kind === 'example' ? '带着问题看例文' : '先整理自己的想法'}</h2></div>{companion.kind === 'review' && <label className="cnbc-unit-select">选择单元<select value={reviewUnit} onChange={event => changeUnit(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>第{index + 1}单元</option>)}</select></label>}</div>
          <div className="cnbc-focus-options" role="group" aria-label="选择整理重点">{task.focusOptions.map((option, index) => <button key={index} className={focusIndex === index ? 'is-active' : ''} aria-pressed={focusIndex === index} onClick={() => setFocusIndex(index)}><span>{focusIndex === index ? <Check size={15} /> : String(index + 1).padStart(2, '0')}</span><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div>
        </div>

        {task.exercise && <div className="cnbc-exercise"><div><span className="cnbc-eyebrow">原创小尝试</span><h3>{task.exercise.prompt}</h3></div><div className="cnbc-exercise-options" role="group" aria-label="选择自己的想法">{task.exercise.options.map((option, index) => <button key={index} className={exerciseChoice === index ? 'is-active' : ''} aria-pressed={exerciseChoice === index} onClick={() => { setExerciseChoice(index); setExerciseShown(false); }}>{option}</button>)}</div><button className="cnbc-text-button" disabled={exerciseChoice === null} aria-expanded={exerciseShown} onClick={() => setExerciseShown(!exerciseShown)}>{exerciseShown ? '收起分析' : '选过了，看看分析'}<Eye size={16} /></button>{exerciseShown && <p className="cnbc-exercise-reason">{task.exercise.explanation}</p>}</div>}

        {isLexical ? <div className="cnbc-word-workspace"><div className="cnbc-word-library"><div className="cnbc-word-categories" role="group" aria-label="字词类别">{(['writing', 'recognition', 'words'] as const).map(kind => <button key={kind} className={category === kind ? 'is-active' : ''} aria-pressed={category === kind} onClick={() => changeCategory(kind)}>{wordLabels[kind]}</button>)}</div><p className="cnbc-bank-caption">{bank.fromGarden ? '园地字词' : `第${reviewUnit}单元复习字词`} · {bank.words.length}项</p><div className={`cnbc-word-grid ${category === 'words' ? 'is-words' : ''}`} role="group" aria-label={`全部${wordLabels[category]}`}>{bank.words.map((item, index) => <button key={item.id} className={wordIndex === index ? 'is-active' : ''} aria-pressed={wordIndex === index} onClick={() => { stopAudio(); setWordIndex(index); }}>{item.text}</button>)}</div>{bank.words.length === 0 && <p className="cnbc-small">这一类可直接回纸本选词认读；也可以切换另一类字词。</p>}</div>
          <div className="cnbc-word-detail">{word ? <><span className="cnbc-eyebrow">{wordLabels[category]}</span><p className="cnbc-word-pinyin">{word.pinyin || '读音请对照课本'}</p><strong className={`cnbc-word-face ${word.text.length > 3 ? 'is-long' : ''}`}>{word.text}</strong>{word.meaning && <p className="cnbc-small">{word.meaning}</p>}{word.examples.length > 0 && category !== 'words' && <div className="cnbc-word-examples"><span>放在词语里读</span>{word.examples.map(example => <button key={example.text} onClick={() => { if (getLessonAudioEntry(example.id || '', example.text)) playWord(example); }}><strong>{example.text}</strong><small>{example.pinyin}</small>{getLessonAudioEntry(example.id || '', example.text) && <Volume2 size={15} />}</button>)}</div>}{getLessonAudioEntry(word.id, word.text) && <button className="cnbc-audio" onClick={() => playing ? stopAudio() : playWord(word)}>{playing ? <Pause size={17} /> : <Volume2 size={17} />}{playing ? '停止' : '听读音'}</button>}<p className="cnbc-small" role="status">{audioStatus || (category === 'writing' ? '看清部件，去纸上独立写。' : '把字词放回句子，再读一次。')}</p></> : <p>先选择一类字词。</p>}</div>
        </div> : <>
          {task.conversation && <div className={`cnbc-conversation ${conversationIndex !== null ? 'is-started' : ''}`}><MessageCircle size={24} /><div><span>{conversationIndex === null ? '准备好，就直接和家人说一说' : `第${conversationIndex + 1}轮 · 轮到你们说`}</span><p>{conversationIndex === null ? '用自己的关键词讲，听完对方，再按底部按钮继续。' : task.conversation[conversationIndex]}</p></div></div>}
          <div className="cnbc-draft-grid">{task.fields.map((field, index) => <label className="cnbc-draft-field" key={index}><span><b>{String(index + 1).padStart(2, '0')}</b>{field.label}</span><textarea rows={3} maxLength={160} value={drafts[index] || ''} onChange={event => setDrafts(current => ({ ...current, [index]: event.target.value }))} placeholder={field.placeholder} /><small>关键词或短草稿 · {(drafts[index] || '').length}/160</small></label>)}</div><p className="cnbc-draft-note"><Pencil size={15} />写自己的发现和想法；这页文字离开活动后清空。</p>
        </>}
      </div>}

      {tab === 'paper' && <div className={`cnbc-paper-body ${isLexical ? 'is-lexical' : ''}`}>
        <div className="cnbc-paper-intro"><span className="cnbc-eyebrow">准备纸和笔</span><h2>{isLexical ? paperPhase === 'view' ? '看清字形，记住这一组' : paperPhase === 'hidden' ? '遮住以后，独立写' : '展开字卡，核对纸稿' : companion.kind === 'speaking' ? '记关键词，再讲一遍' : companion.kind === 'reading' ? '画一张阅读图' : companion.kind === 'example' ? '回自己的纸稿试一处' : '在纸上写自己的内容'}</h2><p>{task.paperTask}</p>{companion.kind === 'review' && <label className="cnbc-unit-select">选择单元<select value={reviewUnit} onChange={event => changeUnit(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>第{index + 1}单元</option>)}</select></label>}</div>

        <div className="cnbc-paper-workspace">
          <div className="cnbc-paper-sheet">{isLexical ? <>
            <div className="cnbc-sheet-head"><span>{writingBank.fromGarden ? '园地会写字' : `第${reviewUnit}单元字形复习`} · 第{paperOffset + 1}/{paperPageCount}组</span><small>{paperPhase === 'hidden' ? '字形已遮住' : `${paperWords.length}个字`}</small></div>
            <div className={`cnbc-paper-char-grid ${paperPhase === 'hidden' ? 'is-hidden' : ''}`}>{paperWords.map((item, index) => <div className="cnbc-paper-character" key={item.id}><span>{index + 1}</span><strong aria-label={paperPhase === 'hidden' ? `第${index + 1}个字，已遮住` : item.text}>{paperPhase === 'hidden' ? '□' : item.text}</strong>{paperPhase === 'review' ? <label><input type="checkbox" checked={needsPractice.includes(item.id)} onChange={() => { setNeedsPractice(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]); setPaperDone(false); }} />再练这个字</label> : <small>{paperPhase === 'view' ? '看部件与位置' : '在自己的纸上写'}</small>}</div>)}</div>
            {!paperWords.length && <p className="cnbc-small">可回纸本选一小组会写字，独立写后再对照。</p>}
            {paperPhase === 'review' && <p className="cnbc-review-note">请看自己的纸稿，再勾选要练的字。{needsPractice.length ? `本次选了${needsPractice.length}个字再练。` : '还没有标记需要再练的字。'}</p>}
          </> : <>
            <div className="cnbc-sheet-head"><span>我的整理卡</span><small>{hasDraft ? '参考自己刚才的关键词' : '可以直接在纸上整理'}</small></div>
            {task.fields.map((field, index) => <div className="cnbc-paper-outline" key={index}><span>{String(index + 1).padStart(2, '0')} · {field.label}</span>{drafts[index]?.trim() ? <p>{drafts[index]}</p> : <p className="is-empty">{field.placeholder}</p>}</div>)}
            <p className="cnbc-small">先自己说或写，再看下面三项。需要补充时只改一处。</p>
          </>}</div>

          <aside className="cnbc-check-card"><CheckCircle2 size={27} /><h3>对照自己的纸稿</h3><div className="cnbc-check-list">{task.paperChecks.map((check, index) => <label key={index}><input type="checkbox" checked={checks.includes(index)} onChange={() => toggleCheck(index)} /><span>{check}</span></label>)}</div>{paperDone ? <p className="cnbc-complete" role="status"><Check size={18} />这次已完成。下次换一份内容，再自己试试。</p> : <p className="cnbc-small">由你或家人看过以后勾选；这里只记录本次尝试。</p>}{isLexical && <button className="cnbc-text-button" onClick={resetPaper}><RotateCcw size={16} />重新记写这一组</button>}{!isLexical && <button className="cnbc-text-button" onClick={() => changeTab('try')}><ChevronLeft size={16} />回去补一处关键词</button>}</aside>
        </div>
      </div>}
    </section>

    <footer className="cnbc-footer"><div className="cnbc-footer-guide"><Leaf size={17} /><p>{tab === 'understand' ? `第${stepIndex + 1}/${task.steps.length}步 · 也可以直接点上方标签选活动。` : tab === 'try' ? isLexical ? '全部字卡都可点选，纸写时每次练一小组。' : '自己的关键词会帮助你独立说或写。' : isLexical ? '先独立写，再看自己的纸稿核对。' : '先做自己的内容，再对照检查。'}</p></div><div className="cnbc-footer-actions">{tab === 'understand' && stepIndex > 0 && <button className="cnbc-secondary" onClick={() => selectStep(stepIndex - 1)}><ChevronLeft size={18} />上一步</button>}{tab === 'paper' && isLexical && paperPageCount > 1 && <button className="cnbc-secondary" onClick={() => changePaperGroup(1)}>换一组<RotateCcw size={16} /></button>}<button className="cnbc-primary" onClick={primaryAction} disabled={tab === 'paper' && (paperDone || (isLexical && !paperWords.length))}>{primaryLabel}{tab === 'paper' && isLexical && paperPhase === 'view' ? <EyeOff size={18} /> : tab === 'paper' && isLexical && paperPhase === 'hidden' ? <Eye size={18} /> : <ArrowRight size={18} />}</button></div></footer>

    <dialog className="cnbc-dialog" ref={dialog} onClose={() => dialogTrigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}><div className="cnbc-dialog-head"><h2>资料与大人指导</h2><button aria-label="关闭资料与指导" onClick={() => dialog.current?.close()}><X size={22} /></button></div><div className="cnbc-dialog-body"><h3>家里可以怎样用</h3><p>{companion.form}</p><p>先让孩子自己想、说、写；追问一个具体细节，每次只修改一处。屏幕中的短草稿不上传，不自动评分，离开当前活动后清空。</p><h3>怎样检查</h3><p>{companion.check}</p><h3>内容核对说明</h3><p>{companion.note}</p><p>目录与页码按家长提供的2026纸本照片；本页提纲、问题和小尝试为原创辅导，不是统一作文格式或整篇范文。习作素材、园地栏目、例文正文和推荐书目请对照自己的纸本。</p>{isLexical && <p>{writingBank.fromGarden ? '园地字词按项目已整理的同目录公开预览表提供，2026纸本三表仍待复核。' : '本园地没有已整理的专属字词项，因此这里使用本单元课文字词作原创复习，不把它们新增为园地必写要求。'}会认、会写与词语分别呈现；拼音只显示已核读音。合成语音帮助跟读，不能代替老师核音。</p>}<p>本页不新增未核的背诵或默写范围。完成勾选是本次自查，不等于系统判定已经掌握。</p><h3>教师使用</h3><p>直接点步骤进行投屏讨论；口语交际由两人轮流说，点击底部按钮换轮。园地先展示全部字卡，再按小组遮住记写，展开后查看纸稿。</p><h3>核对与补看入口</h3>{studioSources.map(source => <a className="cnbc-source" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title}<ExternalLink size={14} /></strong><small>{source.note}</small></a>)}</div></dialog>
  </main>;
}
