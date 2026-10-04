import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, Feather, Leaf, Maximize, Pause, Pencil, Printer, RotateCcw, Volume2, X, ExternalLink } from 'lucide-react';
import { chineseBookCompanions, type BookCompanion } from '../data/chineseBookCompanions';
import { chineseCompanionTasks } from '../data/chineseCompanionTasks';
import ChineseCompanionWorkshop from './ChineseCompanionWorkshop';
import { getWorkshopFields } from '../data/chineseCompanionPrecision';
import { getLessonWords, lessonCourseById, type LessonWord, type WordCategory } from '../data/chineseLessons';
import { studioSources } from '../data/chineseBookStudio';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';
import './chineseBookCompanionViewer.css';

type Tab = 'understand' | 'try' | 'paper';
type PaperPhase = 'view' | 'hidden' | 'review';
const companionsById = new Map(chineseBookCompanions.map(item => [item.id, item]));
const tabs: { id: Tab; label: string; icon: typeof Leaf }[] = [
  { id: 'understand', label: '动手整理', icon: Leaf },
  { id: 'try', label: '我的素材', icon: Feather },
  { id: 'paper', label: '纸笔核对', icon: Pencil },
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

export default function ChineseBookCompanionViewer({ companionId, teacher = false }: { companionId: string; teacher?: boolean }) {
  const companion = companionsById.get(companionId);
  if (!companion || !chineseCompanionTasks[companionId]) return <main className="cnbc-missing"><h1>这个学习活动暂时没有找到</h1><a href="#/chinese-book">返回全册课堂</a></main>;
  return <CompanionContent key={`${companionId}-${teacher}`} companion={companion} teacher={teacher} />;
}

function CompanionContent({ companion, teacher }: { companion: BookCompanion; teacher: boolean }) {
  const task = chineseCompanionTasks[companion.id];
  const [tab, setTab] = useState<Tab>('understand');
  const [order, setOrder] = useState(task.fields.map((_, index) => index));
  const [large, setLarge] = useState(false);
  const [paused, setPaused] = useState(false);
  const [displayStatus, setDisplayStatus] = useState('');
  const [materialField, setMaterialField] = useState(0);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
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
  const fields = getWorkshopFields(companion.id, task);
  const wordPage = Math.floor(wordIndex / 12);
  const wordPages = Math.max(1, Math.ceil(bank.words.length / 12));
  const hasDraft = Object.values(drafts).some(value => value.trim());

  function stopAudio() { player.current?.stop(); setPlaying(false); setAudioStatus(''); }
  async function toggleFullscreen() {
    setDisplayStatus('');
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setDisplayStatus('当前浏览器不支持全屏，可以使用放大字号。');
    } catch { setDisplayStatus('暂时无法进入全屏，可以使用放大字号。'); }
  }
  function playWord(item: { id?: string; text: string }) {
    stopAudio();
    player.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent: () => setPlaying(false) });
    setPlaying(true); player.current.play(item.id || '', item.text);
  }
  function changeTab(next: Tab) { stopAudio(); setTab(next); }
  function changeCategory(next: WordCategory) { stopAudio(); setCategory(next); setWordIndex(0); }
  function changeUnit(unit: number) { stopAudio(); setReviewUnit(unit); setWordIndex(0); setPaperOffset(0); setPaperPhase('view'); setNeedsPractice([]); setChecks([]); setPaperDone(false); }
  function toggleCheck(index: number) { setChecks(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]); setPaperDone(false); }
  function resetPaper() { stopAudio(); setPaperPhase('view'); setNeedsPractice([]); setPaperDone(false); }
  function changePaperGroup(direction: number) { stopAudio(); setPaperOffset(current => (current + direction + paperPageCount) % paperPageCount); setPaperPhase('view'); setNeedsPractice([]); setPaperDone(false); }
  function primaryAction() {
    stopAudio();
    if (tab === 'understand') {
      setTab('paper');
    } else if (tab === 'try') {
      setTab('paper');
    } else if (isLexical) {
      if (paperPhase === 'view') setPaperPhase('hidden');
      else if (paperPhase === 'hidden') setPaperPhase('review');
      else { setPaperDone(true); }
    } else setPaperDone(true);
  }
  const primaryLabel = tab === 'understand' ? '直接去纸笔核对'
    : tab === 'try' ? '直接去纸笔核对'
      : isLexical ? paperPhase === 'view' ? '遮住字，开始写' : paperPhase === 'hidden' ? '展开核对' : paperDone ? '本次人工核对已标记' : '标记人工核对'
        : paperDone ? '本次人工核对已标记' : '标记人工核对';

  useEffect(() => {
    const previous = document.title; document.title = `${companion.title}${teacher ? ' · 教师' : ''} · 三上语文课堂`;
    const stop = () => { player.current?.stop(); setPlaying(false); }; const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('hashchange', stop); window.addEventListener('pagehide', stop); document.addEventListener('visibilitychange', visibility);
    return () => { stop(); document.title = previous; window.removeEventListener('hashchange', stop); window.removeEventListener('pagehide', stop); document.removeEventListener('visibilitychange', visibility); };
  }, [companion.title, teacher]);

  return <main className={`cnbc-viewer ${large ? 'is-large' : ''} ${paused ? 'is-paused' : ''}`} data-kind={companion.kind} data-tab={tab} data-teacher={teacher}>
    <header className="cnbc-header">
      <a className="cnbc-back" href={`#/chinese-book/${companion.id}`}><ArrowLeft size={20} /><span>全册课堂</span></a>
      <div className="cnbc-heading"><span className="cnbc-eyebrow">三上语文 · 第{companion.unit}单元 · {kindLabels[companion.kind]}{companion.page ? ` · ${companion.page}页` : ''}</span><h1>{companion.title}</h1></div>
      <button className="cnbc-resource" ref={dialogTrigger} onClick={() => { stopAudio(); dialog.current?.showModal(); }}><BookOpen size={20} /><span>资料与指导</span></button>
    </header>

    <div className="cnbc-toolbar"><nav className="cnbc-tabs" aria-label="学习活动">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'is-active' : ''} aria-pressed={tab === id} onClick={() => changeTab(id)}><Icon size={18} />{isLexical && id === 'try' ? '字词复习' : label}</button>)}</nav><div className="cnbc-display-tools"><button aria-label={large ? '恢复字号' : '放大字号'} aria-pressed={large} onClick={() => setLarge(!large)}>字{large ? '−' : '+'}</button>{teacher && <button aria-label={paused ? "恢复画面动效" : "暂停动效和声音"} aria-pressed={paused} onClick={() => { stopAudio(); setPaused(!paused); }}><Pause size={17} /></button>}<button aria-label="全屏展示" onClick={toggleFullscreen}><Maximize size={17} /></button><a href={`#/chinese-companion/${companion.id}${teacher ? '' : '/teacher'}`}>{teacher ? '家庭版' : '教师版'}</a></div></div>

    <section className={`cnbc-panel cnbc-panel-${tab}`} aria-label={tabs.find(item => item.id === tab)?.label}>
      <div className={`cnbc-tool-page ${tab !== 'understand' ? 'is-inactive' : ''}`} aria-hidden={tab !== 'understand'} inert={tab !== 'understand'}><ChineseCompanionWorkshop companion={companion} drafts={drafts} setDraft={(index, text) => { setDrafts(current => ({ ...current, [index]: text })); setPaperDone(false); }} order={order} setOrder={setOrder} onReview={kind => { changeCategory(kind); setTab('try'); }} /></div>

      {tab === 'try' && <div className={`cnbc-try-body ${isLexical ? 'is-lexical' : ''}`}>
        <div className="cnbc-section-heading"><div><span className="cnbc-eyebrow">{isLexical ? '认读与纸写分别检查' : '关键词会同步到整理图'}</span><h2>{isLexical ? '直接选择一小组字词' : '我的素材，不是统一作文格式'}</h2></div>{companion.kind === 'review' && <label className="cnbc-unit-select">选择单元<select value={reviewUnit} onChange={event => changeUnit(Number(event.target.value))}>{Array.from({ length: 8 }, (_, index) => <option key={index + 1} value={index + 1}>第{index + 1}单元</option>)}</select></label>}</div>

        {isLexical ? <div className="cnbc-word-workspace"><div className="cnbc-word-library"><div className="cnbc-word-categories" role="group" aria-label="字词类别">{(['writing', 'recognition', 'words'] as const).map(kind => <button key={kind} className={category === kind ? 'is-active' : ''} aria-pressed={category === kind} onClick={() => changeCategory(kind)}>{wordLabels[kind]}</button>)}</div><p className="cnbc-bank-caption">{bank.fromGarden ? '同目录预览园地字词 · 2026纸本待核' : `第${reviewUnit}单元课文复习 · 不新增园地要求`} · {bank.words.length}项</p><div className={`cnbc-word-grid ${category === 'words' ? 'is-words' : ''}`} role="group" aria-label={`本组${wordLabels[category]}`}>{bank.words.slice(wordPage * 12, wordPage * 12 + 12).map((item, index) => <button key={item.id} className={wordIndex === wordPage * 12 + index ? 'is-active' : ''} aria-pressed={wordIndex === wordPage * 12 + index} onClick={() => { stopAudio(); setWordIndex(wordPage * 12 + index); }}>{item.text}</button>)}</div><div className="cnbc-pagination"><button aria-label="上一组字词" disabled={wordPages === 1} onClick={() => { stopAudio(); setWordIndex(((wordPage - 1 + wordPages) % wordPages) * 12); }}><ChevronLeft size={17} /></button><span>{wordPage + 1}/{wordPages}组</span><button aria-label="下一组字词" disabled={wordPages === 1} onClick={() => { stopAudio(); setWordIndex(((wordPage + 1) % wordPages) * 12); }}><ChevronRight size={17} /></button></div>{bank.words.length === 0 && <p className="cnbc-small">这一类可直接回纸本选词认读；也可以切换另一类字词。</p>}</div>
          <div className="cnbc-word-detail">{word ? <><span className="cnbc-eyebrow">{wordLabels[category]}</span><p className="cnbc-word-pinyin">{word.pinyin || '读音请对照课本'}</p><strong className={`cnbc-word-face ${word.text.length > 3 ? 'is-long' : ''}`}>{word.text}</strong>{word.meaning && <p className="cnbc-small">{word.meaning}</p>}{word.examples.length > 0 && category !== 'words' && <div className="cnbc-word-examples"><span>放在词语里读</span>{word.examples.map(example => <button key={example.text} onClick={() => { if (getLessonAudioEntry(example.id || '', example.text)) playWord(example); }}><strong>{example.text}</strong><small>{example.pinyin}</small>{getLessonAudioEntry(example.id || '', example.text) && <Volume2 size={15} />}</button>)}</div>}{getLessonAudioEntry(word.id, word.text) && <button className="cnbc-audio" onClick={() => playing ? stopAudio() : playWord(word)}>{playing ? <Pause size={17} /> : <Volume2 size={17} />}{playing ? '停止' : '听读音'}</button>}<p className="cnbc-small" role="status">{audioStatus || (category === 'writing' ? '看清部件，去纸上独立写。' : '把字词放回句子，再读一次。')}</p></> : <p>先选择一类字词。</p>}</div>
        </div> : <>
          <div className="cnbc-field-select" role="group" aria-label="选择素材卡">{fields.map((field, index) => <button key={field.label} className={materialField === index ? 'is-active' : ''} aria-pressed={materialField === index} onClick={() => setMaterialField(index)}>{field.label}</button>)}</div>
          <div className="cnbc-notebook"><label className="cnbc-draft-field"><span>{fields[materialField].label}</span><textarea rows={5} maxLength={160} value={drafts[materialField] || ''} onChange={event => { setDrafts(current => ({ ...current, [materialField]: event.target.value })); setPaperDone(false); }} placeholder={fields[materialField].placeholder} /><small>关键词或短草稿 · {(drafts[materialField] || '').length}/160</small></label><aside><Feather size={32} /><p>{task.steps[Math.min(materialField, task.steps.length - 1)].prompt}</p><small>可以直接纸写，不必填满。草稿不上传，离开本活动后清空。</small></aside></div>

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
            {order.map(index => <div className="cnbc-paper-outline" key={index}><span>{String(order.indexOf(index) + 1).padStart(2, '0')} · {fields[index].label}</span>{drafts[index]?.trim() ? <p>{drafts[index]}</p> : <p className="is-empty">{fields[index].placeholder}</p>}</div>)}
            <p className="cnbc-small">先自己说或写，再看核对提示。选做项可以跳过，只修改一处。</p>
          </>}</div>

          <aside className="cnbc-check-card"><CheckCircle2 size={27} /><h3>对照自己的纸稿</h3><div className="cnbc-check-list">{task.paperChecks.map((check, index) => <label key={index}><input type="checkbox" checked={checks.includes(index)} onChange={() => toggleCheck(index)} /><span>{check}</span></label>)}</div>{paperDone ? <p className="cnbc-complete" role="status"><Check size={18} />已标记本次人工核对。下次换内容再试，不据此判定掌握。</p> : <p className="cnbc-small">由你或家人看过以后勾选；这里只记录本次尝试。</p>}{isLexical && <button className="cnbc-text-button" onClick={resetPaper}><RotateCcw size={16} />重新记写这一组</button>}{!isLexical && <button className="cnbc-text-button" onClick={() => changeTab('try')}><ChevronLeft size={16} />回去补一处关键词</button>}</aside>
        </div>
      </div>}
    </section>

    <footer className="cnbc-footer"><div className="cnbc-footer-guide"><Leaf size={17} /><p role="status">{displayStatus || (tab === 'understand' ? '直接选卡片，不必先做完上一项。' : tab === 'try' ? '自己的内容，认读与书写分别核对。' : '勾选是人工自查，不是自动判分。')}</p></div><div className="cnbc-footer-actions"><button className="cnbc-secondary" onClick={() => { stopAudio(); window.print(); }}><Printer size={16} />打印空白练习</button>{tab === 'paper' && isLexical && paperPageCount > 1 && <button className="cnbc-secondary" onClick={() => changePaperGroup(1)}>换一组<RotateCcw size={16} /></button>}<button className="cnbc-primary" onClick={primaryAction} disabled={tab === 'paper' && (paperDone || (isLexical && !paperWords.length))}>{primaryLabel}{tab === 'paper' && isLexical && paperPhase === 'view' ? <EyeOff size={18} /> : tab === 'paper' && isLexical && paperPhase === 'hidden' ? <Eye size={18} /> : <ArrowRight size={18} />}</button></div></footer>

    <section className="cnbc-print-only"><h1>{companion.title} · 独立练习</h1><p>第{companion.unit}单元 · 姓名：________ 日期：________</p><p>{task.paperTask}</p>{isLexical ? <><p>本次第{paperOffset + 1}组。打印不带字形答案，家长读词或先看后遮住独立写。</p><div className="cnbc-print-squares">{paperWords.map((_, index) => <div key={index}><span>{index + 1}</span><div className="cnbc-print-square" /></div>)}</div><p>核对时圈出错部件，另写一个组词：________________________________</p></> : fields.map(field => <div className="cnbc-print-field" key={field.label}><strong>{field.label}</strong><div /><div /></div>)}<div className="cnbc-print-checks"><h2>完成后人工核对</h2>{task.paperChecks.map(check => <p key={check}>□ {check}</p>)}</div><p className="cnbc-print-note">原创辅助，实际任务和素材按同版纸本与老师安排。此页自查不代表长期掌握。</p></section>

    <dialog className="cnbc-dialog" ref={dialog} onClose={() => dialogTrigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}><div className="cnbc-dialog-head"><h2>资料与大人指导</h2><button aria-label="关闭资料与指导" onClick={() => dialog.current?.close()}><X size={22} /></button></div><div className="cnbc-dialog-body"><h3>家里可以怎样用</h3><p>{companion.form}</p><p>先让孩子自己想、说、写；追问一个具体细节，每次只修改一处。屏幕中的短草稿不上传，不自动评分，离开当前活动后清空。</p><h3>怎样检查</h3><p>{companion.check}</p><h3>内容核对说明</h3><p>{companion.note}</p><p>目录与页码按家长提供的2026纸本照片；本页提纲、问题和小尝试为原创辅导，不是统一作文格式或整篇范文。习作素材、园地栏目、例文正文和推荐书目请对照自己的纸本。</p>{isLexical && <p>{writingBank.fromGarden ? '园地字词按项目已整理的同目录公开预览表提供，2026纸本三表仍待复核。' : '本园地没有已整理的专属字词项，因此这里使用本单元课文字词作原创复习，不把它们新增为园地必写要求。'}会认、会写与词语分别呈现；拼音只显示已核读音。合成语音帮助跟读，不能代替老师核音。</p>}<p>本页不新增未核的背诵或默写范围。完成勾选是本次自查，不等于系统判定已经掌握。</p><h3>教师使用</h3><p>直接点工具、材料卡或角色投屏讨论，不设轮次门槛。可以控制字号、全屏、音频停止与空白练习打印。教师入口启用空白演示，所有模式不读取或写入孩子个人学习记录。字词每组可直开，认读和纸写分别核对。</p><h3>核对与补看入口</h3>{studioSources.map(source => <a className="cnbc-source" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><strong>{source.title}<ExternalLink size={14} /></strong><small>{source.note}</small></a>)}</div></dialog>
  </main>;
}
