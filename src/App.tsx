import { useState, useSyncExternalStore, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import { ArrowRight, ArrowLeft, BookOpen, Map, Backpack, Leaf, Sparkles, Volume2, Check, X, Home, Users, Presentation, Search, ChevronRight, ChevronLeft, Download, Upload, Printer, Maximize2, Flag, Lightbulb, RotateCcw, Pause, Play, Compass, Settings2, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import Island from './components/Island';
import './components/chineseForestShell.css';
import { courses, lexemes, getCourseLexemes, contentNotes, type Course, type Lexeme, type Subject } from './data/curriculum';
import { createProgressStore, recordAttempt, getSkillState, getLexemeState, getDueReviews, localDateKey, SKILLS, type Progress, type Skill, type AttemptInput } from './lib/progress';
import { makeRound, makeReviewRound, checkAnswer, spellingPracticeNote, type Question } from './lib/questions';
import { createEnglishAudioPlayer, getEnglishAudioEntry } from './lib/englishAudio';
import EnglishAdventure from './components/EnglishAdventure';
import EnglishLearningLab from './components/EnglishLearningLab';
import { englishLabLessons, getLabLessonForLexeme, type LabLessonId } from './data/englishLearningLab';
import { hasEnglishActivities, hasEnglishActivityReview, makeEnglishActivityRound, type EnglishActivityKind } from './data/englishActivities';
import { getChineseRouteOptions, getChineseViewedCourseId, resolveChineseLegacyRoute } from './lib/chineseRoutes';
import { CHINESE_RECORDS_UPDATED_EVENT, createLearningBackup, exportLearningBackup, getChinesePaperReviews, getChineseWordDueReviews, getForestLearningSummaries, loadChineseLearningRecords, parseLearningBackup, recordChineseLessonView, restoreLearningBackup, type LearningBackupCandidate } from './lib/chineseLearningRecords';

const ChinesePilot = lazy(() => import('./components/ChinesePilot'));
const ChineseSemesterPlan = lazy(() => import('./components/ChineseSemesterPlan'));
const ShanxingLesson = lazy(() => import('./components/ShanxingLesson'));
const KingfisherLesson = lazy(() => import('./components/KingfisherLesson'));
const GoldenMeadowLesson = lazy(() => import('./components/GoldenMeadowLesson'));
const OldHouseLesson = lazy(() => import('./components/OldHouseLesson'));
const ChineseBookStudio = lazy(() => import('./components/ChineseBookStudio'));
const ChineseLessonViewer = lazy(() => import('./components/ChineseLessonViewer'));
const ChineseBookCompanionViewer = lazy(() => import('./components/ChineseBookCompanionViewer'));
const ChineseForest = lazy(() => import('./components/ChineseForest'));
const ChineseLearningRecords = lazy(() => import('./components/ChineseLearningRecords'));

const allowedIds = new Set(lexemes.map(item => item.id));
const progressStore = createProgressStore(allowedIds);
const subscribeHash = (callback: () => void) => { window.addEventListener('hashchange', callback); return () => window.removeEventListener('hashchange', callback); };
const hashSnapshot = () => window.location.hash.slice(1) || '/';
const skillLabels: Record<Skill, string> = { meaning: '词义理解', context: '语境运用', recall: '独立回忆', spelling: '英文拼写', writing: '独立书写', listening: '听懂' };
const statusLabels = { unseen: '还没练习', learning: '再练一练', passed: '本次通过', stable: '跨日记住' };
const kindLabels: Record<string, string> = { recognition_character: '会认字', writing_character: '会写字', textbook_word: '词语', english_word: '单词', english_phrase: '短语 / 表达', alphabet: '字母' };
type GameMode = 'meaning' | 'context' | 'recall' | 'spelling' | 'writing';
const modeLabels: Record<GameMode, string> = { meaning: '词义宝箱', context: '句子搭桥', recall: '回忆小路', spelling: '拼写练习', writing: '纸上写一写' };
const modes: GameMode[] = ['meaning', 'context', 'recall', 'spelling', 'writing'];

function englishKind(courseId: string, mode: GameMode): EnglishActivityKind | undefined {
  return hasEnglishActivities(courseId) ? mode === 'context' ? 'scene' : mode === 'recall' ? 'listening' : undefined : undefined;
}
function modeLabel(courseId: string, mode: GameMode) {
  const kind = englishKind(courseId, mode);
  return kind === 'scene' ? '情景接话' : kind === 'listening' ? '听音寻宝' : modeLabels[mode];
}
function availableGameModes(courseId: string) {
  return modes.filter(mode => {
    const kind = englishKind(courseId, mode);
    return kind ? makeEnglishActivityRound(courseId, kind, 4).length > 0 : makeRound(courseId, mode, 1).length > 0;
  });
}
function reviewAvailable(target: { lexemeId: string; skill: Skill }) {
  return hasEnglishActivityReview(target.lexemeId, target.skill) || makeReviewRound([target.lexemeId], 1, [target]).length > 0;
}

function readPreferences() {
  try {
    const value = JSON.parse(localStorage.getItem('fanfan-word-adventure:preferences:v1') || '{}');
    return { courseId: courses.some(course => course.id === value.courseId) ? value.courseId as string : 'cn-01', limit: [4, 6, 8].includes(value.limit) ? value.limit as number : 6 };
  } catch { return { courseId: 'cn-01', limit: 6 }; }
}
function courseTitle(course: Course) { return course.title.replace('古诗三首：', '古诗三首 · '); }
function navigate(path: string) { window.location.hash = path; }
function downloadText(filename: string, text: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function useSpeech() {
  const [message, setMessage] = useState('');
  const englishPlayer = useRef<ReturnType<typeof createEnglishAudioPlayer> | null>(null);
  const speechVersion = useRef(0);
  const deviceSpeech = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  function stopPlayback() {
    speechVersion.current += 1;
    englishPlayer.current?.stop();
    deviceSpeech?.cancel();
  }
  function stop() { stopPlayback(); setMessage(''); }
  useEffect(() => () => { stopPlayback(); }, []);
  function speak(item: Lexeme) {
    stopPlayback();
    if (!item.readingVerified || item.audioStatus === 'unavailable') { setMessage('这个字词的读音还在核对，请先跟着课本读。'); return; }
    if (item.subject === 'english') {
      englishPlayer.current ??= createEnglishAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setMessage });
      englishPlayer.current.play(item.id);
      return;
    }
    if (!deviceSpeech) { setMessage('这台设备暂时不能朗读，可以请大人读一读。'); return; }
    const version = speechVersion.current;
    const contextualText = ['recognition_character', 'writing_character'].includes(item.kind) ? item.example || item.text : item.text;
    const speech = new SpeechSynthesisUtterance(contextualText);
    speech.lang = 'zh-CN'; speech.rate = .82;
    const voice = deviceSpeech.getVoices().find(voice => voice.lang.toLowerCase().replace('_', '-').startsWith(speech.lang.toLowerCase()));
    if (voice) speech.voice = voice;
    speech.onerror = () => { if (version === speechVersion.current) setMessage('这次没有听到示范，重试或请大人读一读；学习记录不会受影响。'); };
    speech.onend = () => { if (version === speechVersion.current) setMessage('示范由设备朗读，可以对照课本再读一遍。'); };
    setMessage('正在播放设备朗读示范…');
    deviceSpeech.speak(speech);
  }
  function canSpeak(item: Lexeme) { return item.readingVerified && item.audioStatus !== 'unavailable' && (item.subject !== 'english' || !!getEnglishAudioEntry(item.id)); }
  return { speak, stop, message, canSpeak };
}
function ProgressPill({ progress, item }: { progress: Progress; item: Lexeme }) {
  const state = getLexemeState(progress, item.id);
  return <span className={`status-pill ${state.status}`}>{state.status === 'stable' ? '已测能力跨日记住' : statusLabels[state.status]}</span>;
}

export default function App() {
  const route = useSyncExternalStore(subscribeHash, hashSnapshot);
  const [progress, setProgress] = useState<Progress>(() => progressStore.load());
  const [preferences, setPreferences] = useState(readPreferences);
  const [notice, setNotice] = useState('');
  const [auxiliaryGameFocus, setAuxiliaryGameFocus] = useState(false);
  const requestedSegments = route.split('/').filter(Boolean);
  const segments = resolveChineseLegacyRoute(requestedSegments) || requestedSegments;
  const page = segments[0] || 'home';
  const chineseRouteOptions = getChineseRouteOptions(segments);
  const [recordsRevision, setRecordsRevision] = useState(0);
  const viewedChineseCourse = getChineseViewedCourseId(segments);
  useEffect(() => {
    const refresh = () => setRecordsRevision(value => value + 1);
    window.addEventListener(CHINESE_RECORDS_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(CHINESE_RECORDS_UPDATED_EVENT, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  useEffect(() => { if (viewedChineseCourse) recordChineseLessonView(viewedChineseCourse); }, [viewedChineseCourse]);
  const teacherView = page === 'teacher' || segments.includes('teacher');
  const chineseRecords = useMemo(() => teacherView ? null : loadChineseLearningRecords(progress), [teacherView, progress, recordsRevision]);
  const forestSummaries = useMemo(() => chineseRecords ? getForestLearningSummaries(chineseRecords) : {}, [chineseRecords]);
  const today = localDateKey();
  const due = getDueReviews(progress).filter(reviewAvailable);
  const dueIds = [...new Set(due.map(item => item.lexemeId))];
  const reviewCount = teacherView ? 0 : due.filter(item => lexemes.find(word => word.id === item.lexemeId)?.subject === 'english').length
    + (chineseRecords ? getChineseWordDueReviews(chineseRecords).length + getChinesePaperReviews(chineseRecords).length : 0);
  const todayAttempts = progress.attempts.filter(item => item.localDate === today);
  const activeCourse = courses.find(course => course.id === preferences.courseId) || courses[0];
  const selectedCourse = courses.find(course => course.id === segments[1]);
  const focusedGame = (page === 'chinese-pilot' && !!segments[2] && !['home', 'teacher'].includes(segments[2])) || page === 'english-lab' || (page === 'play' && selectedCourse
    ? !!englishKind(selectedCourse.id, (segments[2] || 'meaning') as GameMode)
    : (page === 'teacher' || page === 'review') && auxiliaryGameFocus);

  function savePreferences(next: typeof preferences) {
    setPreferences(next);
    try { localStorage.setItem('fanfan-word-adventure:preferences:v1', JSON.stringify(next)); } catch { setNotice('这次设置只会保留到关闭页面。'); }
  }
  function saveProgress(next: Progress) {
    progressStore.save(next); setProgress(next);
    if (progressStore.warning) setNotice(progressStore.warning);
  }
  function onAttempt(input: AttemptInput) {
    try {
      const next = recordAttempt(progress, input, allowedIds);
      saveProgress(next);
    } catch (error) { setNotice(error instanceof Error ? error.message : '记录保存失败，请导出备份。'); }
  }
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [route]);
  const navigation = [
    { path: '/', key: 'home', icon: Home, label: '我的冒险' },
    { path: '/map/chinese', key: 'map-chinese', icon: BookOpen, label: '语文森林' },
    { path: '/map/english', key: 'map-english', icon: Compass, label: '英语港湾' },
    { path: '/review', key: 'review', icon: Backpack, label: '复习背包' },
  ];
  const activeKey = page === 'map' ? `map-${segments[1]}` : page;
  if (page === 'chinese-lesson' && segments[1] === 'shanxing') return <Suspense fallback={<div className="empty-state">正在打开《山行》一课体验…</div>}><ShanxingLesson {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-lesson' && segments[1] === 'cn-14') return <Suspense fallback={<div className="empty-state">正在打开《搭船的鸟》观察课堂…</div>}><KingfisherLesson {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-lesson' && segments[1] === 'cn-15') return <Suspense fallback={<div className="empty-state">正在打开《金色的草地》观察课堂…</div>}><GoldenMeadowLesson {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-lesson' && segments[1] === 'cn-08') return <Suspense fallback={<div className="empty-state">正在打开《总也倒不了的老屋》预测课堂…</div>}><OldHouseLesson {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-lesson') return <Suspense fallback={<div className="empty-state">正在打开语文课件…</div>}><ChineseLessonViewer courseId={segments[1] || ''} {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-companion') return <Suspense fallback={<div className="empty-state">正在打开配套课件…</div>}><ChineseBookCompanionViewer companionId={segments[1] || ''} {...chineseRouteOptions} /></Suspense>;
  if (page === 'chinese-book') return <Suspense fallback={<div className="empty-state">正在打开全册学习安排…</div>}><ChineseBookStudio selectedId={segments[1]} /></Suspense>;
  return <div className={`app-shell${page === 'map' && segments[1] === 'chinese' ? ' chinese-forest-shell' : ''}${page === 'teacher' ? ' teacher-directory-shell' : ''}${focusedGame ? ' game-focus' : ''}${focusedGame && page === 'teacher' ? ' teacher-game-focus' : ''}`}>
    <a href="#main" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus(); }}>跳到内容</a>
    <aside className="sidebar">
      <a className="brand" href="#/" aria-label="字词冒险岛首页"><span className="brand-mark"><BookOpen size={24} strokeWidth={1.7} /></span><span>字词冒险岛<small>每次发现一点点</small></span></a>
      <span className="nav-caption">凡凡的探险手册</span>
      <nav aria-label="主要导航">{navigation.map(({ path, key, icon: Icon, label }) => <a key={key} className={`nav-item ${activeKey === key ? 'active' : ''}`} href={`#${path}`} aria-current={activeKey === key ? 'page' : undefined}><Icon size={20} /><span>{label}</span>{key === 'review' && reviewCount > 0 && <b>{reviewCount}</b>}</a>)}</nav>
      <div className="side-note"><Leaf size={22} /><strong>小小的一步，<br />也是大大的发现。</strong><p>学会了可以停下来。<br />明天，我们再见。</p></div>
      <nav className="adult-nav" aria-label="大人入口"><a href="#/teacher" className={page === 'teacher' ? 'active' : ''}><Presentation size={18} />老师投屏<ExternalLink size={12} /></a><a href="#/parent" className={page === 'parent' ? 'active' : ''}><Users size={18} />家长手册<Settings2 size={14} /></a></nav>
      <div className="side-footer"><span className="avatar">凡</span><div><strong>凡凡的小岛</strong><small>三年级 · 上学期</small></div><Leaf size={15} /></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><div className="breadcrumb"><span>我的学习小岛</span><ChevronRight size={14} /><strong>{page === 'teacher' ? '老师的课堂' : page === 'parent' ? '家长手册' : page === 'review' ? '复习背包' : page === 'map' ? segments[1] === 'english' ? '英语港湾' : '语文森林' : page === 'course' || page === 'play' ? selectedCourse?.title || '探索字词' : '今天的冒险'}</strong></div><span className="semester"><Leaf size={14} /> 三年级上册</span><a className="header-avatar" href="#/parent" aria-label="打开家长手册">凡</a></header>
      <main id="main" tabIndex={-1}>
        {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="关闭提示"><X size={17} /></button></div>}
        {progressStore.warning && !notice && <div className="notice">{progressStore.warning}</div>}
        {page === 'home' && <>
          <section className="hero">
            <div className="hero-copy"><div className="eyebrow"><span /> 今天也有新的发现</div><h1>把字词，<br />变成你的<span className="underline">小伙伴。</span></h1><p>走进课本里的小岛。读一读、想一想，<br />每次一小关，把新知识真正记住。</p><button className="primary" onClick={() => navigate(`/course/${activeCourse.id}`)}>开始今天的冒险 <ArrowRight size={18} /></button><div className="hero-foot"><Flag size={14} /> 每次 {preferences.limit} 题 · 随时可以休息</div></div>
            <div className="hero-visual"><span className="illustration-label"><Sparkles size={15} /> 发现新词，点亮小岛</span><Island /><span className="art-stamp">LET'S EXPLORE!</span></div>
          </section>
          <div className="section-heading"><div><span className="eyebrow">YOUR LITTLE PLAN</span><h2>今天的探险计划</h2></div><a href="#/parent">调整学习计划 <Settings2 size={15} /></a></div>
          <section className="daily-grid" aria-label="今日计划">
            <a className="daily-card current" href={`#/course/${activeCourse.id}`}><span className="icon-box green"><BookOpen size={23} /></span><div><small>① 跟着课本出发</small><h3>{courseTitle(activeCourse)}</h3><p>{activeCourse.subject === 'chinese' ? '语文' : '英语'} · {activeCourse.subtitle}</p></div><ArrowRight size={19} /></a>
            <a className="daily-card" href="#/review"><span className="icon-box ochre"><Backpack size={23} /></span><div><small>② 和老朋友见一面</small><h3>{reviewCount ? `${reviewCount} 项练习等你复习` : '背包里，慢慢装满发现'}</h3><p>{reviewCount ? '字词和纸稿里需要再练的内容' : '练习之后，明天安排再见'}</p></div><ArrowRight size={19} /></a>
            <div className="daily-card journal"><span className="icon-box coral"><Leaf size={23} /></span><div><small>③ 记录每一小步</small><h3>{todayAttempts.length ? `今天留下 ${todayAttempts.length} 次尝试` : '今天的小岛，等你来探索'}</h3><p>{todayAttempts.length ? '学习记录已留在这个浏览器' : '按自己的节奏，一点点积累'}</p></div></div>
          </section>
          <div className="section-heading"><div><span className="eyebrow">TWO WAYS TO WONDER</span><h2>想去哪里探索？</h2></div><span className="subtle">每一课都有自己的入口</span></div>
          <section className="subject-grid">
            <a className="subject-card chinese" href="#/map/chinese"><div className="subject-copy"><span className="tag">语文 · 8个单元</span><h2>森林里的汉字故事</h2><p>从一字一词，到读懂一句话。<br />在字词之间，找到课文的意思。</p><span className="link-button">探索语文森林 <ArrowRight size={16} /></span></div><div className="subject-art" aria-hidden="true"><span className="word-tile tile1">字</span><span className="word-tile tile2">词</span><Leaf className="deco-leaf" size={82} strokeWidth={1} /></div><span className="card-footer">26课 · 会认字 / 会写字 / 词语</span></a>
            <a className="subject-card english" href="#/map/english"><div className="subject-copy"><span className="tag">英语 · 8个单元</span><h2>港湾里的新朋友</h2><p>打个招呼，介绍你的家人。<br />用小小的英语，说出大大的世界。</p><span className="link-button">出发去英语港湾 <ArrowRight size={16} /></span></div><div className="subject-art" aria-hidden="true"><span className="speech-bubble">Hello!</span><span className="word-tile letter-tile">Aa</span><Sparkles className="deco-star" size={35} /></div><span className="card-footer">2个主题 · 单词 / 对话 / 26个字母</span></a>
          </section>
          <div className="gentle-note"><Lightbulb size={19} /><p><strong>今天的小提醒</strong>　先自己想一想，再看答案。能在明天想起来，也是一种进步。</p></div>
        </>}
        {page === 'map' && (segments[1] === 'english' ? <SemesterMap subject="english" progress={progress} /> : <Suspense fallback={<div className="empty-state">正在打开语文森林…</div>}><ChineseForest selectedId={segments[2]} currentCourseId={preferences.courseId} courseSummaries={forestSummaries} reviewHref="#/review/chinese" /></Suspense>)}
        {page === 'chinese-plan' && <Suspense fallback={<div className="empty-state">正在打开全学期清单…</div>}><ChineseSemesterPlan /></Suspense>}
        {page === 'chinese-pilot' && <Suspense fallback={<div className="empty-state">正在打开语文练习…</div>}><ChinesePilot key={route} courseId={segments[1]} mode={segments[2]} teacher={segments.includes('teacher')} taskId={segments[3] && segments[3] !== 'teacher' ? decodeURIComponent(segments[3]) : undefined} /></Suspense>}
        {page === 'english-lab' && <EnglishLearningLab key={route} lessonId={segments[1]} teacher={segments[2] === 'teacher'} onAttempt={onAttempt} onExit={segments[2] === 'teacher' ? () => navigate('/teacher/english') : undefined} />}
        {page === 'course' && selectedCourse && <CoursePage key={selectedCourse.id} course={selectedCourse} progress={progress} onSetCurrent={() => { savePreferences({ ...preferences, courseId: selectedCourse.id }); setNotice('已经设为今天的学习课。'); }} onNotice={setNotice} />}
        {page === 'play' && selectedCourse && <CourseRound key={route} course={selectedCourse} mode={modes.includes(segments[2] as GameMode) ? segments[2] as GameMode : 'meaning'} limit={preferences.limit} onAttempt={onAttempt} />}
        {page === 'review' && <ReviewPage key={segments[1] || 'all'} subject={['chinese', 'english'].includes(segments[1]) ? segments[1] as Subject : undefined} progress={progress} dueIds={dueIds} limit={preferences.limit} onAttempt={onAttempt} onGameFocus={setAuxiliaryGameFocus} />}
        {page === 'teacher' && <TeacherPage key={segments[1] === 'english' ? 'english' : 'chinese'} limit={preferences.limit} selectedId={segments[1]} onGameFocus={setAuxiliaryGameFocus} />}
        {page === 'parent' && <ParentPage progress={progress} preferences={preferences} onPreferences={savePreferences} onImport={setProgress} onNotice={setNotice} />}
        {((page === 'course' || page === 'play') && !selectedCourse || !['home', 'map', 'course', 'play', 'review', 'teacher', 'parent', 'english-lab', 'chinese-plan', 'chinese-pilot'].includes(page)) && <EmptyState title="这条小路暂时没有找到" text="回到地图，重新选择一课吧。" action={<a className="primary" href="#/">返回小岛 <Home size={18} /></a>} />}
      </main>
      <footer className="page-footer"><BookOpen size={14} /> 每次发现一点点。<a href="#/teacher">老师投屏</a><span>学习记录保存在当前浏览器 · <a href="#/parent">备份与内容说明</a></span></footer>
    </div>
  </div>;
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><Leaf size={42} strokeWidth={1.3} /><h2>{title}</h2><p>{text}</p>{action}</div>;
}
function SemesterMap({ subject, progress }: { subject: Subject; progress: Progress }) {
  const [search, setSearch] = useState('');
  const subjectCourses = courses.filter(course => course.subject === subject && (!search || `${course.title} ${getCourseLexemes(course.id).map(item => item.text).join(' ')}`.toLowerCase().includes(search.toLowerCase())));
  const units = [...new Set(subjectCourses.map(course => course.unitNumber))];
  return <>
    {subject === 'chinese' && <div className="cn-pilot-entry"><BookOpen size={25} /><div><strong>读懂，再记牢 · 语文逐课安排</strong><p>查看26课的学习方式、字词与检查重点，也可以直接打开《山行》体验。</p></div><a href="#/chinese-book">全册学习安排</a><a href="#/chinese-lesson/shanxing">《山行》一课体验</a><a href="#/chinese-plan">完整字词清单 <ArrowRight size={16} /></a></div>}
    {subject === 'english' && <a className="english-lab-entry" href="#/english-lab"><span className="icon-box green"><Volume2 size={25} /></span><div><strong>英语体验课 · 看情景，听示范</strong><p>先学，再练，再换情景：猫、见面与告别、my / your</p></div><ArrowRight size={22} /></a>}
    <div className={`map-header ${subject}`}><div><span className="eyebrow">YOUR SEMESTER MAP</span><h1>{subject === 'chinese' ? '语文森林' : '英语港湾'}</h1><p>{subject === 'chinese' ? '沿着八条小路，发现汉字、词语和课文的意思。' : '认识朋友，介绍家人。每个单元都是一个新场景。'}</p></div><span className="map-emblem">{subject === 'chinese' ? '字' : 'Aa'}</span></div>
    <div className="map-tools"><span><Flag size={17} /> {subject === 'chinese' ? '26课 · 8个单元' : '8单元 · 2个主题 · 26字母'}</span><label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="找课文，或一个字词…" aria-label="搜索课文或字词" /></label></div>
    {!subjectCourses.length && <EmptyState title="还没找到这个字词" text="试试课文名，或者换一个词搜索。" />}
    {units.map(unit => <section className="unit-section" key={unit}><div className="unit-heading"><span>{unit === 0 ? 'A' : String(unit).padStart(2, '0')}</span><div><h2>{unit === 0 ? '字母小站' : subject === 'english' ? `Unit ${unit} · ${subjectCourses.find(course => course.unitNumber === unit)?.scene}` : `第${unit}单元 · ${subjectCourses.find(course => course.unitNumber === unit)?.scene}`}</h2><small>{subject === 'chinese' ? '先看词卡，再选一条挑战小路' : '从词语开始，试着在一句话里使用'}</small></div></div><div className="course-grid">{subjectCourses.filter(course => course.unitNumber === unit).map(course => {
      const items = getCourseLexemes(course.id);
      const practiced = new Set(progress.attempts.filter(attempt => items.some(item => item.id === attempt.lexemeId)).map(attempt => attempt.lexemeId)).size;
      return <a href={`#/course/${course.id}`} key={course.id} className={`course-card ${subject}`}><span className="course-number">{course.kind === 'garden' ? <Leaf size={21} /> : course.kind === 'project' ? <Flag size={21} /> : course.kind === 'alphabet' ? 'Aa' : String(course.lessonNumber ?? unit).padStart(2, '0')}</span><div><span className="course-meta">{course.kind === 'garden' ? '语文园地' : course.kind === 'project' ? '主题活动 · 内容待补全' : course.kind === 'alphabet' ? 'Alphabet' : subject === 'chinese' ? `第${course.lessonNumber}课` : `Unit ${unit}`}</span><h3>{courseTitle(course)}</h3><p>{items.length ? `${items.length} 项字词${practiced ? ` · ${practiced} 项练习过` : ' · 等你来发现'}` : '正文词项待补全'}</p></div><ChevronRight size={18} /></a>;
    })}</div></section>)}
  </>;
}

function CoursePage({ course, progress, onSetCurrent, onNotice }: { course: Course; progress: Progress; onSetCurrent: () => void; onNotice: (text: string) => void }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { speak, message, canSpeak } = useSpeech();
  const items = getCourseLexemes(course.id);
  const categories = [...new Set(items.map(item => item.kind))];
  const filtered = items.filter(item => (filter === 'all' || filter === item.kind || filter === 'optional' && item.optional) && `${item.text} ${item.pinyin || ''} ${item.meaning}`.toLowerCase().includes(search.toLowerCase()));
  const availableModes = availableGameModes(course.id).filter(mode => course.subject === 'english' || mode !== 'spelling');
  const completeProject = course.kind === 'project';
  return <>
    <a className="back-link" href={`#/map/${course.subject}`}><ArrowLeft size={16} />回到{course.subject === 'chinese' ? '语文森林' : '英语港湾'}</a>
    {['cn-01', 'cn-04'].includes(course.id) && <div className="cn-pilot-entry"><BookOpen size={24} /><div><strong>本课新样板已开放</strong><p>汉字侦探、纸上小练笔{course.id === 'cn-04' ? '、三首古诗背诵与《山行》默写' : '与组词参考'}。</p></div><a href={`#/chinese-pilot/${course.id}`}>打开新练习 <ArrowRight size={18} /></a></div>}
    <div className="lesson-heading"><div><span className="eyebrow">{course.subtitle}</span><h1>{courseTitle(course)}</h1><p>{course.scene} · 先和字词见一面，再选你的冒险。</p></div><button className="secondary" onClick={onSetCurrent}><Flag size={16} />设为今天的课</button></div>
    {completeProject && <div className="info-note">主题任务还在准备中。这里先集合已学单元的词卡，供回顾使用；主题海报和对话活动后续补全。</div>}
    <section className="lesson-actions" aria-label="选择关卡">{availableModes.map(mode => <a key={mode} className={`mode-card ${mode}`} href={`#/play/${course.id}/${mode}`}><span>{mode === 'meaning' ? <Sparkles size={22} /> : mode === 'context' ? <Map size={22} /> : mode === 'recall' ? <Lightbulb size={22} /> : <BookOpen size={22} />}</span><h3>{modeLabel(course.id, mode)}</h3><p>{englishKind(course.id, mode) === 'scene' ? '听朋友说话，选一句来回应' : englishKind(course.id, mode) === 'listening' ? '听清声音，找到对应的图片' : mode === 'meaning' ? '读懂一个字词的意思' : mode === 'context' ? '放进句子里想一想' : mode === 'recall' ? '藏起答案，自己想起来' : mode === 'spelling' ? '自选练习，不要求全词默写' : '纸上完成，请大人来确认'}</p><ArrowRight size={16} /></a>)}</section>
    {hasEnglishActivities(course.id) && <div className="speech-note"><Sparkles size={15} /> 新玩法 · 每轮 4—6 个小任务 · 可以反复听，也可以随时休息</div>}
    {!availableModes.length && <div className="info-note">本课先跟着教材认读。字词的读音与解释确认后，会开放相应小关卡。</div>}
    <div className="section-heading"><div><span className="eyebrow">MEET YOUR NEW FRIENDS</span><h2>这一课的字词卡 <small>{items.length}</small></h2></div><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); onNotice(['localhost', '127.0.0.1'].includes(window.location.hostname) ? '这一课的链接已复制。本地链接在这台电脑开着时可用。' : '这一课的链接已复制，可以发给老师直接打开。'); } catch { onNotice('复制失败，可以直接复制浏览器地址栏。'); } }}>分享本课 <ExternalLink size={15} /></button></div>
    <div className="word-tools"><div className="filter-tabs"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>全部</button>{categories.map(kind => <button key={kind} className={filter === kind ? 'selected' : ''} onClick={() => setFilter(kind)}>{kindLabels[kind]}</button>)}{items.some(item => item.optional) && <button className={filter === 'optional' ? 'selected' : ''} onClick={() => setFilter('optional')}>选学</button>}</div><label className="search-box"><Search size={16} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="找一个字词…" aria-label="搜索本课字词" /></label></div>
    {course.subject === 'english' && <div className="speech-note"><Volume2 size={14} /> 英式女声 · 清晰慢读 · 点小喇叭听，再跟着读一遍</div>}
    {message && <div className="speech-note" role="status">{message}</div>}
    <div className="word-grid">{filtered.map(item => <article key={item.id} className="word-card"><div className="word-card-top"><span>{kindLabels[item.kind]}{item.optional && ' · 选学'}</span><button disabled={!canSpeak(item)} className="sound-button" aria-label={`朗读${item.text}`} onClick={() => speak(item)}><Volume2 size={19} /></button></div><span className="pinyin">{item.pinyin || (item.subject === 'english' ? 'READ & SAY' : '跟着课本读一读')}</span><h3 className={item.text.length > 12 ? 'long-word' : ''}>{item.text}</h3><p className="word-meaning">{item.meaning || '和老师一起，找到它在课文里的意思。'}</p>{item.example && <p className="word-example">{item.example}</p>}<div className="word-card-bottom"><ProgressPill progress={progress} item={item} /><span>{item.writingRequirement === 'required' ? '会写字表' : item.subject === 'english' ? '拼写可自选' : '读一读'}</span></div></article>)}</div>
    {!filtered.length && <EmptyState title={items.length ? '没有符合条件的字词' : '这里还要翻一翻课本'} text={items.length ? '换一种分类或搜索试试。' : '这部分正文词项还未整理完成。其他课的字词已经可以学习。'} />}
  </>;
}

function CourseRound({ course, mode, limit, onAttempt, teacher = false }: { course: Course; mode: GameMode; limit: number; onAttempt?: (input: AttemptInput) => void; teacher?: boolean }) {
  const kind = englishKind(course.id, mode);
  return kind ? <EnglishAdventure course={course} kind={kind} limit={limit} onAttempt={onAttempt} teacher={teacher} />
    : <Round course={course} mode={mode} limit={limit} onAttempt={onAttempt} teacher={teacher} />;
}

function Round({ course, mode, limit, onAttempt, teacher = false, preferredIds, reviewTargets, onExit }: { course?: Course; mode: GameMode; limit: number; onAttempt?: (input: AttemptInput) => void; teacher?: boolean; preferredIds?: string[]; reviewTargets?: { lexemeId: string; skill: Skill }[]; onExit?: () => void }) {
  const [questions] = useState<Question[]>(() => preferredIds ? makeReviewRound(preferredIds, limit, reviewTargets) : makeRound(course!.id, mode, limit));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; assisted: boolean; answer: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [hinted, setHinted] = useState(false);
  const [input, setInput] = useState('');
  const [paused, setPaused] = useState(false);
  const [results, setResults] = useState<{ correct: boolean; assisted: boolean }[]>([]);
  const [confirmer, setConfirmer] = useState<'self' | 'parent'>('self');
  const { speak, stop, message, canSpeak } = useSpeech();
  const question = questions[index];
  const inputRef = useRef<HTMLInputElement>(null);
  function submit(answer: string, selfCorrect?: boolean, assisted = false) {
    if (feedback || teacher) return;
    const correct = selfCorrect ?? checkAnswer(question, answer);
    const helped = hinted || assisted;
    const nextFeedback = { correct, assisted: helped, answer };
    setFeedback(nextFeedback); setResults([...results, nextFeedback]);
    onAttempt?.({ lexemeId: question.lexemeId, skill: question.skill, mode: question.mode, correct, assisted: helped, confirmedBy: question.selfCheck ? confirmer : 'auto', sourceEvidence: `${question.id}:${question.selfCheck ? `${confirmer}-checked-before-reveal` : 'original-question'}` });
  }
  function next() { stop(); setIndex(index + 1); setFeedback(null); setRevealed(false); setHinted(false); setInput(''); setPaused(false); setConfirmer('self'); }
  if (!questions.length) return <EmptyState title="这条挑战小路还在准备" text="先看本课的字词卡，或选择另一种玩法吧。" action={<a href={course ? `#/course/${course.id}` : '#/review'} className="primary">查看字词 <ArrowRight size={18} /></a>} />;
  if (!question) return <div className="round-finish"><div className="finish-seal"><Flag size={48} /></div><span className="eyebrow">ONE LITTLE ADVENTURE, DONE</span><h1>{teacher ? '这一组课堂活动结束了' : '今天又发现了一点点！'}</h1><p>{teacher ? '教师演示没有写入个人学习记录。' : `完成 ${results.length} 次尝试，其中 ${results.filter(item => item.correct && !item.assisted).length} 次无提示完成。`}<br />{teacher ? '可以选另一课继续演示。' : '明天再想一想，让字词记得更牢。'}</p>{onExit ? <button className="primary" onClick={onExit}>回到复习背包 <ArrowRight size={18} /></button> : <a className="primary" href={course ? `#/course/${course.id}` : '#/review'}>回到{course ? '这一课' : '复习背包'} <ArrowRight size={18} /></a>}</div>;
  const item = lexemes.find(item => item.id === question.lexemeId)!;
  return <section className={`round ${teacher ? 'teacher-round' : ''}`}>
    <div className="round-top">{onExit ? <button className="text-button" onClick={onExit}><ArrowLeft size={16} />暂时离开</button> : <a className="back-link" href={course ? `#/course/${course.id}` : '#/review'}><ArrowLeft size={16} />{teacher ? '查看本课词卡' : '暂时离开'}</a>}<span>{teacher ? '课堂演示 · 不记录个人成绩' : modeLabels[mode]} · {index + 1} / {questions.length}</span><button className="icon-button" onClick={() => { stop(); setPaused(!paused); }} aria-label={paused ? '继续练习' : '暂停练习'}>{paused ? <Play size={18} /> : <Pause size={18} />}</button></div>
    <div className="round-progress" aria-label={`已完成${index}题，共${questions.length}题`}><span style={{ width: `${index / questions.length * 100}%` }} /></div>
    {paused ? <EmptyState title="小岛帮你把这一页留着" text="休息一会儿，准备好了再继续。" action={<button className="primary" onClick={() => setPaused(false)}><Play size={18} />继续冒险</button>} /> : <>
      <div className="question-content"><span className="question-badge"><Sparkles size={16} />{skillLabels[question.skill]}</span><h1>{question.prompt}</h1>{question.clue && <p className="question-clue">{question.clue}</p>}{question.skill === 'writing' && <div className="info-note">先在纸上写出来，再揭晓核对。大人确认的书写会单独记录。</div>}
        {question.options && !question.selfCheck && !teacher ? <div className="answers">{question.options.map((answer, optionIndex) => <button key={answer} disabled={!!feedback} className={`answer ${feedback && answer === question.answer ? 'correct' : ''} ${feedback && !feedback.correct && feedback.answer === answer ? 'wrong' : ''}`} onClick={() => submit(answer)}><span>{String.fromCharCode(65 + optionIndex)}</span>{answer}{feedback && answer === question.answer && <Check size={20} />}</button>)}</div> : teacher ? <div className="teacher-answer-area">{revealed ? <div className="revealed-answer"><small>参考答案</small><strong>{question.answer}</strong><p>{question.explanation}</p></div> : <div className="answer-hidden"><BookOpen size={35} /><p>先让同学们自己想一想</p></div>}<button className="primary" onClick={() => revealed ? next() : setRevealed(true)}>{revealed ? '下一题' : '揭晓答案'} <ArrowRight size={18} /></button></div> : question.selfCheck ? <div className="self-check">{!revealed ? <><div className="recall-paper"><BookOpen size={33} strokeWidth={1.3} /><h3>{question.skill === 'writing' ? '在纸上独立写出来' : '先自己说出答案'}</h3><p>想好了，再打开这一页。</p></div><button className="primary" onClick={() => setRevealed(true)}>我完成了，核对答案 <BookOpen size={18} /></button></> : <><div className="revealed-answer"><small>参考答案</small><strong>{question.answer}</strong><p>{question.explanation}</p></div>{!feedback && <><label className="confirmation"><input type="checkbox" checked={confirmer === 'parent'} onChange={event => setConfirmer(event.target.checked ? 'parent' : 'self')} />大人看过我的回答{question.skill === 'writing' && '和纸上书写'}</label><div className="self-check-actions"><button className="primary" onClick={() => submit(question.answer, true)}>我自己想对了 <Check size={18} /></button><button className="secondary" onClick={() => submit(question.answer, true, true)}>看答案才想起来</button><button className="text-button" onClick={() => submit('', false)}>还需要练习</button></div></>}</>}</div> : <form className="typed-answer" onSubmit={event => { event.preventDefault(); submit(input); }}><label htmlFor="answer-input">写下你想起的{item.subject === 'english' ? '英文' : '答案'}</label><input ref={inputRef} id="answer-input" value={input} onChange={event => setInput(event.target.value)} disabled={!!feedback} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="在这里输入…" /><button className="primary" disabled={!input.trim() || !!feedback}>检查答案 <Check size={18} /></button></form>}
      </div>
      {!teacher && !feedback && !revealed && <div className="question-tools"><button className="text-button" onClick={() => setHinted(true)}><Lightbulb size={17} />需要一点提示</button>{hinted && <span className="hint-answer">可以再学一遍：{question.answer} · 这题只算练习</span>}</div>}
      {!teacher && feedback && <div className={`feedback ${feedback.correct ? 'success' : 'retry'}`} role="status"><span className="feedback-icon">{feedback.correct ? <Check size={24} /> : <RotateCcw size={23} />}</span><div><h3>{feedback.correct ? feedback.assisted ? '借着提示，也有新的发现' : '这一次，你想到了！' : '这次先记下来，下一次再试'}</h3><p>{question.explanation}</p>{question.skill === 'writing' && confirmer === 'self' && <small>这次记为自查练习；独立书写证据需要大人确认。</small>}</div><button className="primary" onClick={next}>{index === questions.length - 1 ? '完成这次冒险' : '下一题'} <ArrowRight size={17} /></button></div>}
      {revealed && canSpeak(item) && <div className="audio-practice"><button className="text-button" onClick={() => speak(item)}><Volume2 size={17} />听示范，跟着读</button>{item.subject === 'english' && <small>英式女声 · 清晰慢读</small>}{message && <small role="status">{message}</small>}</div>}
    </>}
  </section>;
}

function ReviewPage({ progress, subject, dueIds, limit, onAttempt, onGameFocus }: { progress: Progress; subject?: Subject; dueIds: string[]; limit: number; onAttempt: (input: AttemptInput) => void; onGameFocus: (focused: boolean) => void }) {
  const [playing, setPlaying] = useState(false);
  const [englishReview, setEnglishReview] = useState<{ courseId: string; kind: EnglishActivityKind; ids: string[] } | null>(null);
  const [labReview, setLabReview] = useState<{ lessonId: LabLessonId; ids: string[] } | null>(null);
  const focused = !!englishReview || !!labReview;
  useEffect(() => {
    onGameFocus(focused);
    return () => onGameFocus(false);
  }, [focused, onGameFocus]);
  const englishIds = new Set(lexemes.filter(item => item.subject === 'english').map(item => item.id));
  const englishDueIds = dueIds.filter(id => englishIds.has(id));
  const practicedIds = [...new Set(progress.attempts.filter(item => englishIds.has(item.lexemeId)).map(item => item.lexemeId))];
  const [reviewSnapshot, setReviewSnapshot] = useState<{ ids: string[]; targets: { lexemeId: string; skill: Skill }[] }>({ ids: [], targets: [] });
  const targets = (englishDueIds.length ? getDueReviews(progress).filter(target => englishDueIds.includes(target.lexemeId))
    : practicedIds.flatMap(id => SKILLS.filter(skill => getSkillState(progress, id, skill).attempts > 0).map(skill => ({ lexemeId: id, skill })))).filter(reviewAvailable);
  const labIds = new Set(progress.attempts.filter(attempt => attempt.skill === 'listening' && attempt.sourceEvidence.startsWith('english-lab:')).map(attempt => attempt.lexemeId));
  const labTargets = targets.filter(target => target.skill === 'listening' && labIds.has(target.lexemeId) && getLabLessonForLexeme(target.lexemeId));
  const labGroups = englishLabLessons.flatMap(lesson => {
    const ids = labTargets.filter(target => getLabLessonForLexeme(target.lexemeId)?.id === lesson.id).map(target => target.lexemeId);
    return ids.length ? [{ lessonId: lesson.id, ids }] : [];
  });
  const classicTargets = targets.filter(target => !hasEnglishActivityReview(target.lexemeId, target.skill));
  const englishGroups = new globalThis.Map<string, { courseId: string; kind: EnglishActivityKind; ids: string[] }>();
  for (const target of targets.filter(target => hasEnglishActivityReview(target.lexemeId, target.skill) && !labTargets.includes(target))) {
    const item = lexemes.find(item => item.id === target.lexemeId)!;
    const kind = target.skill === 'listening' ? 'listening' : 'scene';
    const key = item.courseId + ':' + kind;
    const group = englishGroups.get(key) ?? { courseId: item.courseId, kind, ids: [] };
    if (!group.ids.includes(item.id)) group.ids.push(item.id);
    englishGroups.set(key, group);
  }
  function startReview() {
    if (!classicTargets.length) {
      if (labGroups.length) setLabReview(labGroups[0]);
      else setEnglishReview([...englishGroups.values()][0] ?? null);
      return;
    }
    setReviewSnapshot({ ids: [...new Set(classicTargets.map(target => target.lexemeId))], targets: classicTargets });
    setPlaying(true);
  }
  const reviewNavigation = <nav className="review-subject-picker" aria-label="选择复习科目"><a href="#/review" aria-current={!subject ? 'page' : undefined}>全部</a><a href="#/review/chinese" aria-current={subject === 'chinese' ? 'page' : undefined}>语文</a><a href="#/review/english" aria-current={subject === 'english' ? 'page' : undefined}>英语</a></nav>;
  if (subject === 'chinese') return <><div className="lesson-heading"><div><h1>语文复习背包</h1><p>从纸稿和历史练习里，选一项再练。</p></div><Backpack className="page-emblem" size={58} strokeWidth={1.2} /></div>{reviewNavigation}<Suspense fallback={null}><ChineseLearningRecords progress={progress} mode="review" /></Suspense></>;
  if (labReview) return <EnglishLearningLab key={labReview.lessonId} lessonId={labReview.lessonId} reviewLexemeIds={labReview.ids} onAttempt={onAttempt} onExit={() => setLabReview(null)} />;
  if (englishReview) return <EnglishAdventure key={englishReview.courseId + englishReview.kind} course={courses.find(course => course.id === englishReview.courseId)!}
    kind={englishReview.kind} limit={limit} preferredLexemeIds={englishReview.ids} onAttempt={onAttempt} onExit={() => setEnglishReview(null)} />;
  if (playing) return <><button className="text-button" onClick={() => setPlaying(false)}><ArrowLeft size={16} />返回复习背包</button><Round key="review-round" mode="recall" limit={limit} preferredIds={reviewSnapshot.ids} reviewTargets={reviewSnapshot.targets} onAttempt={onAttempt} onExit={() => setPlaying(false)} /></>;
  return <><div className="lesson-heading"><div><span className="eyebrow">OLD FRIENDS, NEW DISCOVERIES</span><h1>复习背包</h1><p>按练过的能力，再和熟悉的字词见一面。</p></div><Backpack className="page-emblem" size={58} strokeWidth={1.2} /></div>
    {reviewNavigation}
    {subject !== 'english' && <Suspense fallback={null}><ChineseLearningRecords progress={progress} mode="review" /></Suspense>}
    {labGroups.length > 0 && <section aria-label="英语体验课复习"><div className="section-heading"><h2>换个情景，再听一听</h2><span className="subtle">继续练听懂，不直接计作独立回忆</span></div><div className="lesson-actions">{labGroups.map(group => <button className="mode-card recall" key={group.lessonId} onClick={() => setLabReview(group)}><span><Volume2 size={22} /></span><h3>{englishLabLessons.find(lesson => lesson.id === group.lessonId)?.title}</h3><p>{group.ids.length} 个字词 · 英文情景体验课</p><ArrowRight size={16} /></button>)}</div></section>}
    {englishDueIds.length ? <div className="review-banner"><div><h2>{englishDueIds.length} 个英语字词，今天到了见面的日子</h2><p>选一条练习小路，完成后就可以休息。</p></div><button className="primary" onClick={startReview}>开始复习 <ArrowRight size={18} /></button></div>
      : <EmptyState title={practicedIds.length ? '今天暂时没有到期的英语字词' : '英语背包里还没有字词'} text={practicedIds.length ? '明天再回来看看。也可以主动复习学过的字词。' : '从课本地图选一课，完成第一次小冒险吧。'} action={targets.length ? <button className="secondary" onClick={startReview}>提前练一练 <RotateCcw size={16} /></button> : <a className="primary" href="#/map/english">去英语港湾 <ArrowRight size={16} /></a>} />}
    {englishGroups.size > 0 && <section aria-label="英语新玩法复习"><div className="section-heading"><h2>再玩一小关</h2><span className="subtle">听懂和接话，分别练习</span></div><div className="lesson-actions">{[...englishGroups.entries()].map(([key, group]) => <button className={'mode-card ' + (group.kind === 'scene' ? 'context' : 'recall')} key={key} onClick={() => setEnglishReview(group)}><span><Volume2 size={22} /></span><h3>{group.kind === 'scene' ? '情景接话' : '听音寻宝'}</h3><p>{courses.find(course => course.id === group.courseId)?.subtitle} · {group.ids.length} 个字词</p><ArrowRight size={16} /></button>)}</div></section>}
    {practicedIds.length > 0 && <><div className="section-heading"><h2>背包里的发现</h2><span className="subtle">{practicedIds.length} 项练习过 · 能力分开记录</span></div><div className="review-list">{(englishDueIds.length ? englishDueIds : practicedIds).map(id => { const item = lexemes.find(item => item.id === id)!; const state = getLexemeState(progress, id); return <div className="review-row" key={id}><span className="review-word">{item.text}</span><div><span>{courses.find(course => course.id === item.courseId)?.title}</span><div className="skill-tags">{SKILLS.filter(skill => state.skills[skill].attempts > 0).map(skill => <span key={skill} className={state.skills[skill].isDue ? 'due-tag' : ''}>{skillLabels[skill]} · {state.skills[skill].isDue ? '今天复习' : statusLabels[state.skills[skill].status]}</span>)}</div></div><a href={`#/course/${item.courseId}`} aria-label={`查看${item.text}所在课程`}><ChevronRight size={20} /></a></div>; })}</div></>}
  </>;
}

function TeacherPage({ limit, selectedId, onGameFocus }: { limit: number; selectedId?: string; onGameFocus: (focused: boolean) => void }) {
  const [subject, setSubject] = useState<Subject>(selectedId === 'english' ? 'english' : 'chinese');
  const [courseId, setCourseId] = useState(courses.find(item => item.subject === 'english' && item.kind === 'unit')!.id);
  const [mode, setMode] = useState<GameMode>('meaning');
  const [roundKey, setRoundKey] = useState(0);
  const course = courses.find(item => item.id === courseId)!;
  const items = getCourseLexemes(courseId);
  const availableModes = availableGameModes(courseId);
  const focused = subject === 'english' && !!englishKind(courseId, mode);
  useEffect(() => {
    onGameFocus(focused);
    return () => onGameFocus(false);
  }, [focused, onGameFocus]);
  const subjectPicker = <nav className="teacher-subject-picker" aria-label="选择课堂科目"><button type="button" aria-pressed={subject === 'chinese'} onClick={() => setSubject('chinese')}><BookOpen size={18} />语文课件</button><button type="button" aria-pressed={subject === 'english'} onClick={() => setSubject('english')}><Compass size={18} />英语课堂</button><a href="#/parent">全册规划与教学资料 <ExternalLink size={15} /></a></nav>;
  if (subject === 'chinese') return <div className="teacher-directory">{subjectPicker}<Suspense fallback={<div className="empty-state">正在打开语文选课目录…</div>}><ChineseForest teacher selectedId={selectedId} /></Suspense></div>;
  return <>{subjectPicker}<div className="lesson-heading"><div><span className="eyebrow">A LITTLE WONDER FOR THE WHOLE CLASS</span><h1>把小岛，带进课堂。</h1><p>选一课，投屏提问。先思考，再一起揭晓。</p><div className="english-lab-teacher-links">{englishLabLessons.map(lesson => <a key={lesson.id} href={`#/english-lab/${lesson.id}/teacher`}>体验课 · {lesson.title} <ExternalLink size={15} /></a>)}</div></div><Presentation className="page-emblem" size={58} strokeWidth={1.2} /></div>
    <section className="teacher-controls"><label>选择英语课目<select value={courseId} onChange={event => { setCourseId(event.target.value); const first = availableGameModes(event.target.value)[0]; setMode(first || 'meaning'); setRoundKey(roundKey + 1); }}>{courses.filter(item => item.subject === 'english').map(item => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label>课堂玩法<select value={mode} onChange={event => { setMode(event.target.value as GameMode); setRoundKey(roundKey + 1); }}>{availableModes.map(item => <option key={item} value={item}>{modeLabel(courseId, item)}</option>)}</select></label><button className="secondary" onClick={() => setRoundKey(roundKey + 1)}><RotateCcw size={17} />换一组</button><button className="secondary" onClick={() => document.documentElement.requestFullscreen?.().catch(() => undefined)}><Maximize2 size={17} />全屏</button><button className="secondary" onClick={() => window.print()}><Printer size={17} />打印本课词单</button></section>
    <CourseRound key={`${courseId}-${mode}-${roundKey}`} course={course} mode={mode} limit={limit} teacher />
    <section className="print-sheet"><h2>{course.title} · 字词练习单</h2><p>姓名：________________　日期：________________</p>{[...new Set(items.map(item => item.kind))].map(kind => <div key={kind}><h3>{kindLabels[kind]}</h3><div className="print-words">{items.filter(item => item.kind === kind).map(item => <span key={item.id}>{item.text}<small>____________</small></span>)}</div></div>)}<small>词表来自同版公开预览，使用前请核对学校纸本；合成语音仅供跟读示范。</small></section>
    <details className="content-details"><summary>本课词库与教学说明</summary><p>{contentNotes.english}</p><p>{contentNotes.explanations}</p><a href={`#/course/${course.id}`}>查看本课全部词卡 →</a></details>
  </>;
}

function ParentPage({ progress, preferences, onPreferences, onImport, onNotice }: { progress: Progress; preferences: { courseId: string; limit: number }; onPreferences: (next: { courseId: string; limit: number }) => void; onImport: (next: Progress) => void; onNotice: (message: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const importRequest = useRef(0);
  const [importCandidate, setImportCandidate] = useState<LearningBackupCandidate | null>(null);
  const practicedIds = [...new Set(progress.attempts.map(item => item.lexemeId))];
  const reviewedMeaning = lexemes.filter(item => item.meaningVerified && item.verificationStatus !== 'pending_verification').length;
  async function readImport(file?: File) {
    if (!file) return;
    const request = ++importRequest.current;
    setImportCandidate(null);
    try {
      if (file.size > 10_000_000) throw new Error('备份文件太大，请使用本工具导出的学习记录。');
      const candidate = parseLearningBackup(await file.text());
      if (request === importRequest.current) setImportCandidate(candidate);
    } catch (error) { if (request === importRequest.current) onNotice(error instanceof Error ? error.message : '无法读取这个备份，原记录未改变。'); }
    if (request === importRequest.current && fileInput.current) fileInput.current.value = '';
  }
  function saveBackup() {
    try { downloadText(`凡凡全记录备份-${localDateKey()}.json`, exportLearningBackup(createLearningBackup(progress))); }
    catch (error) { onNotice(error instanceof Error ? error.message : '这次未能导出备份，请保留当前浏览器记录。'); }
  }
  function confirmImport() {
    if (!importCandidate) return;
    try { const restored = restoreLearningBackup(importCandidate, localStorage); onImport(restored); setImportCandidate(null); onNotice('学习记录已导入。'); }
    catch (error) { onNotice(error instanceof Error ? error.message : '导入失败，请保留备份文件。'); }
  }
  return <>
    <div className="lesson-heading"><div><span className="eyebrow">GROW AT YOUR OWN PACE</span><h1>家长探险手册</h1><p>看见具体的进步，也给“还没想起来”留一点时间。</p></div><Users className="page-emblem" size={58} strokeWidth={1.2} /></div>
    <section className="parent-panel"><h2><Flag size={20} />安排今天的一小步</h2><div className="preferences"><label>跟随学校的当前课<select value={preferences.courseId} onChange={event => onPreferences({ ...preferences, courseId: event.target.value })}>{courses.filter(course => ['lesson', 'unit', 'alphabet'].includes(course.kind)).map(course => <option value={course.id} key={course.id}>{course.subject === 'chinese' ? '语文' : '英语'} · {course.title}</option>)}</select></label><label>每轮的题目上限<select value={preferences.limit} onChange={event => onPreferences({ ...preferences, limit: Number(event.target.value) })}>{[4, 6, 8].map(limit => <option key={limit} value={limit}>{limit} 题</option>)}</select></label></div><p className="small-note">默认不倒计时。词卡学习不计成绩；同一天重复答对不等于跨日记住。英文拼写可选，语音示范不自动评分。</p></section>
    <section className="parent-panel"><h2><Download size={20} />保存这一路的发现</h2><p>全记录备份包含字词尝试、语文纸笔检查、旧样板、《山行》和浏览记录。清理浏览器或换设备前先导出，在其他设备可手动导入。旧版字词备份仍可使用。</p><div className="backup-actions"><button className="primary" onClick={saveBackup}><Download size={17} />导出学习记录</button><button className="secondary" onClick={() => fileInput.current?.click()}><Upload size={17} />导入备份</button><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={event => void readImport(event.target.files?.[0])} /><span>{progress.attempts.length} 条尝试 · {practicedIds.length} 个字词</span></div>{importCandidate && <div className="import-confirm" role="alert"><p>已检查备份，包含 {importCandidate.progress.attempts.length} 条字词尝试。{importCandidate.kind === 'bundle' ? '确认后替换字词、语文纸笔、旧样板、山行和浏览记录。' : '这是旧版字词备份，只替换字词记录，现有语文纸笔记录保留。'}请先导出当前全记录备份。</p><button className="primary" onClick={confirmImport}>确认替换记录</button><button className="secondary" onClick={() => setImportCandidate(null)}>取消</button></div>}</section>
    <section className="parent-panel chinese-adult-resources"><h2><BookOpen size={20} />全册规划与教学资料</h2><div className="chinese-adult-links"><a href="#/chinese-book">逐课目标与教学安排 <ArrowRight size={16} /></a><a href="#/chinese-plan">全册字词与教材要求 <ArrowRight size={16} /></a><a href="#/teacher">打开老师课堂 <ArrowRight size={16} /></a><a href={`${import.meta.env.BASE_URL}plans/chinese-precision-master-plan.md`} download="语文全册规划.md">下载全册规划</a><a href={`${import.meta.env.BASE_URL}plans/chinese-precision-release.md`} download="语文课件验收台账.md">制作与验收台账</a></div></section>
    <Suspense fallback={null}><ChineseLearningRecords progress={progress} mode="overview" /></Suspense>
    <section className="parent-panel"><h2><Leaf size={20} />每一种能力，分别看见</h2><p>“本次通过”记录这一次的回答。“跨日记住”需要至少两个日期的无提示独立证据，其中有回忆、语境或书写；下一次遗忘只调整相关能力。手写自查算练习，独立书写需要大人确认。</p><p className="small-note">下表保留字词关卡的练习证据与原安排。语文纸稿复检后的当前待练内容，请查看上方语文记录与<a href="#/review/chinese">语文复习背包</a>。</p>{practicedIds.length ? <div className="table-wrap"><table><thead><tr><th>字词 / 课程</th><th>已经练习的能力</th><th>关卡复习日期</th></tr></thead><tbody>{practicedIds.map(id => { const item = lexemes.find(item => item.id === id)!; const states = SKILLS.map(skill => ({ skill, state: getSkillState(progress, id, skill) })).filter(row => row.state.attempts); const dueDate = states.map(row => row.state.dueAt).filter(Boolean).sort()[0]; return <tr key={id}><td><strong>{item.text}</strong><small>{courses.find(course => course.id === item.courseId)?.title}</small></td><td>{states.map(({ skill, state }) => <span className="table-skill" key={skill}>{skillLabels[skill]}：{statusLabels[state.status]}<small>{state.independentDays}个日期有独立证据</small></span>)}</td><td>{dueDate ? new Date(dueDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) : '—'}</td></tr>; })}</tbody></table></div> : <p className="small-note">完成第一次闯关后，这里会显示具体字词；目前没有学习成绩。</p>}</section>
    <section className="parent-panel content-audit"><h2><BookOpen size={20} />教材内容与待核对项</h2><div className="inventory-stats"><div><strong>276 / 250 / 250</strong><small>语文识字展示 / 写字 / 词语记录</small></div><div><strong>127 + 26</strong><small>英语单元词条 + 字母</small></div><div><strong>{reviewedMeaning}</strong><small>已有教学释义的记录（含重复类别）</small></div></div><p>{contentNotes.chinese}</p><p>{contentNotes.english}</p><p>{contentNotes.explanations}</p><p>{spellingPracticeNote}</p><div className="info-note">纸本已逐项核对：0 项。第18课“起来”、第22课“贞”以及多音字等保留原表并待复核；对应未审核题型关闭。语文园地1、2、6正文词项与英语两个Project任务待补全。词库完整收录公开书后表，不代表整本教材教学内容全部完成。</div><details><summary>查看词条来源、字段审核与待核对清单</summary><div className="table-wrap"><table><thead><tr><th>字词</th><th>课程 / 来源页</th><th>字段状态</th><th>说明</th></tr></thead><tbody>{lexemes.map(item => <tr key={item.id}><td>{item.text}<small>{kindLabels[item.kind]}</small></td><td>{courses.find(course => course.id === item.courseId)?.title}<small>{item.sourcePage} · {item.sourceEdition} / {item.sourcePrint}</small></td><td>{item.verificationStatus === 'pending_verification' ? '待核对' : item.verificationStatus === 'extension' ? '补充练习' : '公开词表已核读'}<small>释义{item.meaningVerified ? '可用' : '待核'} · 读音{item.readingVerified ? '已编辑' : '待核'}</small></td><td>{item.notes || '2026纸本印次仍待复核'}</td></tr>)}</tbody></table></div></details><div className="source-links"><a href="https://jc.pep.com.cn/" target="_blank" rel="noreferrer">人教教材目录 <ExternalLink size={14} /></a><a href="https://keben.app/book/0163" target="_blank" rel="noreferrer">英文词表核读来源 <ExternalLink size={14} /></a></div></section>
  </>;
}
