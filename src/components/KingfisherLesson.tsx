import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, Feather, Leaf, Pause, Pencil, Play, Printer, RotateCcw, Volume2, X, ExternalLink } from 'lucide-react';
import { birdLessonCopy, birdLessonRequirementNote, birdRecognitionFocus } from '../data/kingfisherLesson';
import { getLessonWords, lessonCourseById, type LessonWord, type WordCategory } from '../data/chineseLessons';
import { createChineseLessonAudioPlayer, getLessonAudioEntry } from '../lib/chineseLessonAudio';
import { getKingfisherFrame, KINGFISHER_DURATION } from '../lib/kingfisherMotion';
import KingfisherScene from './KingfisherScene';
import './kingfisherLesson.css';

type Mode = 'observe' | 'catch' | 'words' | 'read';
type BirdPart = 'feathers' | 'wings' | 'beak';
type Verb = 'chong' | 'fei' | 'xian' | 'zhan' | 'tun';
type SelectedWord = { category: WordCategory; id: string };
const tabs: { id: Mode; label: string; icon: typeof Leaf }[] = [
  { id: 'observe', label: '观察翠鸟', icon: Feather },
  { id: 'catch', label: '看它捕鱼', icon: Play },
  { id: 'words', label: '字词练写', icon: Pencil },
  { id: 'read', label: '读懂方法', icon: BookOpen },
];
const wordKinds: WordCategory[] = ['recognition', 'writing', 'words'];
const categoryLabels: Record<WordCategory, string> = { recognition: '会认字', writing: '会写字', words: '课内词语' };
const partColours: Record<BirdPart, string> = { feathers: '#427b55', wings: '#3b7894', beak: '#b7543f' };
const course = lessonCourseById.get('cn-14')!;
const wordBank: Record<WordCategory, LessonWord[]> = {
  recognition: getLessonWords(course, 'recognition'),
  writing: getLessonWords(course, 'writing'),
  words: getLessonWords(course, 'words'),
};
const initialWord = wordBank.writing.find(word => word.text === '翠') || wordBank.writing[0];

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

export default function KingfisherLesson({ teacher = false }: { teacher?: boolean }) {
  const [mode, setMode] = useState<Mode>('observe');
  const [selectedPart, setSelectedPart] = useState<BirdPart>('feathers');
  const [partAnswer, setPartAnswer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackRun, setPlaybackRun] = useState(0);
  const [selectedVerb, setSelectedVerb] = useState<Verb>('chong');
  const [compare, setCompare] = useState(false);
  const [selectedWord, setSelectedWord] = useState<SelectedWord>({ category: 'writing', id: initialWord.id });
  const [focusedCharacter, setFocusedCharacter] = useState('翠');
  const [wordHidden, setWordHidden] = useState(false);
  const [paperReview, setPaperReview] = useState(false);
  const [audioStatus, setAudioStatus] = useState('');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [teacherAnswers, setTeacherAnswers] = useState<Record<string, boolean>>({});
  const progressRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const audioPlayer = useRef<ReturnType<typeof createChineseLessonAudioPlayer> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resourceTrigger = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const part = birdLessonCopy.observationParts.find(item => item.id === selectedPart)!;
  const frame = getKingfisherFrame(progress);
  const focusVerbId = frame.activeVerbs.includes(selectedVerb) ? selectedVerb : frame.activeVerbs[0];
  const focusVerb = birdLessonCopy.verbs.find(item => item.id === focusVerbId);
  const word = wordBank[selectedWord.category].find(item => item.id === selectedWord.id)!;
  const writingFocus = birdLessonCopy.writingFocus.find(item => item.character === focusedCharacter);
  const recognitionFocus = birdRecognitionFocus.find(item => item.character === focusedCharacter);
  const writingCharacter = wordBank.writing.some(item => item.text === focusedCharacter);
  const prompt = birdLessonCopy.readingPrompts[promptIndex];
  const answerIndex = answers[prompt.id];
  const answer = answerIndex === undefined ? undefined : prompt.choices[answerIndex];
  const shownAnswer = teacher && teacherAnswers[prompt.id] ? prompt.choices.find(item => item.correct) : answer;

  function stopAudio() {
    audioPlayer.current?.stop();
    setAudioPlaying(false);
    setAudioStatus('');
  }
  function pause() {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setPlaying(false);
  }
  function seek(value: number) {
    pause();
    stopAudio();
    const next = Math.max(0, Math.min(KINGFISHER_DURATION, value));
    progressRef.current = next;
    setProgress(next);
  }
  function changeMode(next: Mode) { pause(); stopAudio(); setMode(next); }
  function selectPart(next: BirdPart) { setSelectedPart(next); setPartAnswer(false); }
  function togglePlayback() {
    stopAudio();
    if (playing) { pause(); return; }
    if (progressRef.current >= KINGFISHER_DURATION) { progressRef.current = 0; setProgress(0); }
    setPlaying(true);
  }
  function replay() { seek(0); setSelectedVerb('chong'); setPlaybackRun(run => run + 1); setPlaying(true); }
  function selectWord(item: LessonWord, category: WordCategory) {
    stopAudio();
    setSelectedWord({ category, id: item.id });
    setFocusedCharacter([...item.text].find(character => birdLessonCopy.writingFocus.some(focus => focus.character === character)) || [...item.text][0]);
    setWordHidden(false);
    setPaperReview(false);
  }
  function playWord() {
    if (audioPlaying) { stopAudio(); return; }
    if (!getLessonAudioEntry(word.id, word.text)) return;
    audioPlayer.current ??= createChineseLessonAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus,
      onEvent: () => setAudioPlaying(false) });
    setAudioPlaying(true);
    audioPlayer.current.play(word.id, word.text);
  }
  function openResources() { pause(); stopAudio(); dialogRef.current?.showModal(); }
  function printLesson() { pause(); stopAudio(); window.print(); }

  useEffect(() => {
    if (!playing || mode !== 'catch') return;
    let previous: number | null = null;
    let lastPaint = 0;
    const tick = (now: number) => {
      if (previous !== null) progressRef.current = Math.min(KINGFISHER_DURATION, progressRef.current + (now - previous) / 1000);
      previous = now;
      if (!reducedMotion || now - lastPaint >= 120 || progressRef.current === KINGFISHER_DURATION) {
        setProgress(progressRef.current); lastPaint = now;
      }
      if (progressRef.current >= KINGFISHER_DURATION) { setPlaying(false); animationRef.current = null; return; }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [playing, mode, reducedMotion, playbackRun]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '搭船的鸟 · 河上观察手册';
    const suspend = () => { pause(); stopAudio(); };
    const onVisibility = () => { if (document.hidden) suspend(); };
    window.addEventListener('hashchange', suspend);
    window.addEventListener('pagehide', suspend);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      audioPlayer.current?.stop();
      window.removeEventListener('hashchange', suspend);
      window.removeEventListener('pagehide', suspend);
      document.removeEventListener('visibilitychange', onVisibility);
      document.title = previousTitle;
    };
  }, []);

  return <main className="kf-lesson" data-mode={mode} data-teacher={teacher || undefined}>
    <header className="kf-head">
      <a className="kf-back" href={teacher ? '#/teacher' : '#/chinese-book/cn-14'} aria-label={teacher ? '返回老师课堂' : '返回全册课堂'}><ArrowLeft size={21} /><span>语文课堂</span></a>
      <div className="kf-heading"><span className="kf-eyebrow">河上观察手册 <span>三上 · 第14课{teacher ? ' · 教师投屏' : ''}</span></span><h1>{birdLessonCopy.title}<span>一位特别的乘客</span></h1></div>
      <button className="kf-resource" ref={resourceTrigger} onClick={openResources}><BookOpen size={19} /><span>资料与指导</span></button>
    </header>
    <nav className="kf-tabs" aria-label="本课学习内容">{tabs.map(({ id, label, icon: Icon }, index) => <button key={id} className={mode === id ? 'is-active' : ''} aria-current={mode === id ? 'page' : undefined} onClick={() => changeMode(id)}><span className="kf-tab-number">0{index + 1}</span><Icon size={19} /><span>{label}</span></button>)}</nav>

    <section className={`kf-panel kf-panel-${mode}`} aria-label={tabs.find(tab => tab.id === mode)!.label}>
      {mode === 'observe' && <>
        <div className="kf-art kf-observe-art">
          <div className="kf-art-heading"><span><Leaf size={16} />先看清它的样子</span><small>点一处，仔细看</small></div>
          <div className="kf-scene-body"><KingfisherScene mode="observe" progress={0} selectedPart={selectedPart} onSelectPart={selectPart} reducedMotion={reducedMotion} /></div>
          <div className="kf-art-caption"><span className="kf-caption-line" /><p>船头多了一位特别的小乘客。</p><span>观察外形</span></div>
        </div>
        <div className="kf-observation kf-side">
          <div className="kf-section-heading"><span className="kf-eyebrow">把“好看”说具体</span><h2>看哪里，写哪里</h2></div>
          <div className="kf-part-buttons" role="group" aria-label="选择观察部位">{birdLessonCopy.observationParts.map(item => <button key={item.id} aria-pressed={selectedPart === item.id} className={selectedPart === item.id ? 'is-active' : ''} onClick={() => selectPart(item.id as BirdPart)}><i style={{ background: partColours[item.id as BirdPart] }} /><span>{item.label}</span></button>)}</div>
          <div className="kf-colour-note" style={{ '--part-colour': partColours[selectedPart] } as React.CSSProperties} aria-live="polite"><span className="kf-colour-swatch" /><div><span>{part.label}</span><strong>{part.colour}</strong></div></div>
          <p className="kf-observation-description">{part.description}</p>
          <div className="kf-notice-question"><span>再仔细一点</span><p>{part.question}</p><button className="kf-text-button" aria-expanded={partAnswer} onClick={() => setPartAnswer(!partAnswer)}>{partAnswer ? '收起提示' : teacher ? '展示参考说法' : '说过了，看提示'}{partAnswer ? <EyeOff size={17} /> : <Eye size={17} />}</button><p className="kf-part-answer" aria-live="polite">{partAnswer ? part.answer : '看图，也回到课文里找一找。'}</p></div>
          <p className="kf-margin-note"><Feather size={18} />颜色和样子写清楚，翠鸟就好像站在眼前。</p>
        </div>
      </>}

      {mode === 'catch' && <>
        <div className="kf-art kf-catch-art">
          <div className="kf-art-heading"><span><Eye size={16} />看见动作，再读动词</span><small>连续动作 · 可随时停住</small></div>
          <div className="kf-scene-body"><KingfisherScene mode="catch" progress={progress} reducedMotion={reducedMotion} /></div>
          <div className="kf-movie-controls">
            <div className="kf-playback-row"><button className="kf-play-button" aria-label={playing ? '暂停捕鱼动作' : '播放捕鱼动作'} onClick={togglePlayback}>{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}{playing ? '暂停' : '播放'}</button><label className="kf-timeline"><span className="kf-sr-only">拖动查看捕鱼动作</span><input type="range" min="0" max={KINGFISHER_DURATION} step="0.01" value={progress} onChange={event => seek(Number(event.target.value))} aria-valuetext={`${progress.toFixed(1)}秒，${frame.phase}`} style={{ '--timeline-position': `${progress / KINGFISHER_DURATION * 100}%` } as React.CSSProperties} /><span className="kf-timeline-time">{progress.toFixed(1)} <small>/ {KINGFISHER_DURATION} 秒</small></span></label><button className="kf-replay" onClick={replay} aria-label="从头重播捕鱼动作"><RotateCcw size={19} /><span>重播</span></button></div>
            <div className="kf-verb-track" role="group" aria-label="点一个动词，查看对应动作">{birdLessonCopy.verbs.map(item => <button key={item.id} className={`${frame.activeVerbs.includes(item.id as Verb) ? 'is-active' : ''} ${focusVerbId === item.id ? 'is-focused' : ''}`} aria-pressed={focusVerbId === item.id} onClick={() => { seek(item.at); setSelectedVerb(item.id as Verb); }}><strong>{item.character}</strong><small>{item.at.toFixed(1)}秒</small><span className="kf-verb-indicator" /></button>)}</div>
          </div>
        </div>
        <div className="kf-action-study kf-side">
          <div className="kf-section-heading"><span className="kf-eyebrow">动词，让动作活起来</span><h2>它是怎样捕鱼的？</h2></div>
          <div className="kf-current-action" aria-live="polite"><span>{frame.activeVerbs.length ? '此刻你能看到' : progress >= 14 ? '鱼已经吞下了' : '先盯住船头的翠鸟'}</span><div>{frame.activeVerbs.length ? frame.activeVerbs.map(id => <button key={id} className={focusVerbId === id ? 'is-focused' : ''} aria-pressed={focusVerbId === id} onClick={() => setSelectedVerb(id)}>{birdLessonCopy.verbs.find(item => item.id === id)!.character}</button>) : <strong>{progress >= 14 ? '捕鱼结束' : '静静等待'}</strong>}</div>{frame.activeVerbs.includes('fei') && frame.activeVerbs.includes('xian') && <small>飞起来时，嘴里已经衔着鱼；飞和衔一起发生。</small>}{frame.activeVerbs.includes('zhan') && <small>站住时，嘴里仍然衔着小鱼。</small>}</div>
          <div className="kf-verb-detail" aria-live="polite">{focusVerb ? <><p className="kf-verb-meaning">{focusVerb.meaning}</p><div className="kf-evidence"><span>从动作里看出来</span><p>{focusVerb.evidence}</p></div><p className="kf-verb-note">{focusVerb.note}</p></> : <><p className="kf-verb-meaning">{progress >= 14 ? '先站稳，再把鱼吞下去。' : '点播放，看看小鱼怎样被捕到。'}</p><div className="kf-evidence"><span>{progress >= 14 ? '留意这个细节' : '观察小提醒'}</span><p>{progress >= 14 ? '“吞”是把鱼送进肚子里；吞完以后，嘴里就没有鱼了。' : '动词下的圆点会跟着画面亮起。暂停后，点亮着的字，仔细看看为什么用它。'}</p></div></>}</div>
          <div className={`kf-word-comparison ${compare ? 'is-open' : ''}`}><button className="kf-text-button" aria-expanded={compare} onClick={() => setCompare(!compare)}><span>把“冲”换个词试试</span>{compare ? <EyeOff size={17} /> : <ArrowRight size={17} />}</button>{compare && <div className="kf-comparison-content"><p><strong>冲</strong><span>突然、迅速地向水里飞去。</span></p><p><strong>慢慢走进</strong><span>速度慢，还是“走”，和眼前的俯冲不相称。</span></p><small>原创换词对比，帮助体会用词。</small></div>}</div>
        </div>
      </>}

      {mode === 'words' && <>
        <div className="kf-word-library">{!wordHidden ? <><div className="kf-section-heading"><span className="kf-eyebrow">本课完整字词清单</span><h2>点一个，仔细练</h2></div>{wordKinds.map(category => <div className={`kf-word-group kf-word-group-${category}`} key={category}><div className="kf-word-group-label"><h3>{categoryLabels[category]}</h3><span>{wordBank[category].length}{category === 'words' ? '个' : '字'}</span></div><div className="kf-word-chips" role="group" aria-label={`选择${categoryLabels[category]}`}>{wordBank[category].map(item => <button key={item.id} className={selectedWord.id === item.id && selectedWord.category === category ? 'is-active' : ''} aria-pressed={selectedWord.id === item.id && selectedWord.category === category} onClick={() => selectWord(item, category)}>{item.text}</button>)}</div></div>)}<p className="kf-library-note">会认，重在读准；会写，还要合书独立写。</p></> : <div className="kf-covered-library"><EyeOff size={33} /><span className="kf-eyebrow">字词卡已合上</span><h2>先自己试一试</h2><p>回想刚才选中的字或词。{getLessonAudioEntry(word.id, word.text) ? "需要提示时，可以听读音。" : "想不起来时，可以返回看字。"}准备好以后，再展开核对。</p><button className="kf-text-button" onClick={() => { stopAudio(); setWordHidden(false); setPaperReview(false); }}><Eye size={18} />返回看字</button></div>}</div>
        <div className="kf-word-workbench">
          <div className="kf-word-workbench-top"><span className="kf-eyebrow">{categoryLabels[selectedWord.category]} · {writingCharacter ? wordHidden ? '凭记忆，在纸上写' : '看清字形，再自己写' : wordHidden ? '合上字卡，自己读' : '放进词语，读准字音'}</span>{getLessonAudioEntry(word.id, word.text) && <button className="kf-audio-button" onClick={playWord}>{audioPlaying ? <Pause size={18} /> : <Volume2 size={18} />}{audioPlaying ? '停止' : '听读音'}</button>}</div>
          <div className={`kf-word-display ${word.text.length > 2 ? 'is-long' : ''} ${wordHidden ? 'is-hidden' : ''}`}><span className="kf-word-pinyin">{word.pinyin || writingFocus?.pinyin || recognitionFocus?.pinyin || (wordHidden ? '想一想刚才看到的字' : '读音请对照课本')}</span><strong aria-label={wordHidden ? '字形已遮住' : word.text}>{wordHidden ? [...word.text].map(() => '□').join(' ') : word.text}</strong></div>
          {word.text.length > 1 && !wordHidden && <div className="kf-focus-characters" role="group" aria-label="选择词语中要留意的字"><span>留意这个字</span>{[...word.text].map((character, index) => <button key={`${character}-${index}`} aria-pressed={focusedCharacter === character} className={focusedCharacter === character ? 'is-active' : ''} onClick={() => { setFocusedCharacter(character); setPaperReview(false); }}>{character}</button>)}</div>}
          <div className="kf-writing-guidance" aria-live="polite">{!wordHidden ? writingFocus ? <><div className="kf-character-structure"><span>字形拆开看</span><strong>{writingFocus.parts}</strong></div><div className="kf-writing-attention"><Pencil size={20} /><p>{writingFocus.attention}</p></div>{writingFocus.distinguish && <p className="kf-distinguish">{writingFocus.distinguish}</p>}<div className="kf-example-words"><span>放进词语读</span><strong>{writingFocus.words.join(' · ')}</strong></div></> : recognitionFocus ? <><div className="kf-character-structure"><span>认字线索</span><strong>{recognitionFocus.parts}</strong></div><div className="kf-writing-attention"><Volume2 size={20} /><p>{recognitionFocus.attention}</p></div><p className="kf-distinguish">{recognitionFocus.meaning}</p><div className="kf-example-words"><span>放进词语读</span><strong>{recognitionFocus.words.join(" · ")}</strong></div></> : <><div className="kf-character-structure"><span>{selectedWord.category === 'recognition' ? '认字小提醒' : '放回课文读一读'}</span><strong>{focusedCharacter === '衔' ? '用嘴叼着，就是“衔”' : selectedWord.category === 'recognition' ? `先认清“${focusedCharacter}”` : word.text}</strong></div><div className="kf-writing-attention"><BookOpen size={20} /><p>{focusedCharacter === '衔' ? '捕鱼时，翠鸟衔着小鱼飞回来。“衔”是会认字，先把字音和意思读清楚。' : word.meaning || (selectedWord.category === 'recognition' ? '把这个字放回课文的词语里读，遇到不确定的字音，请对照课本或听老师示范。' : '先读准这个词，再在课文中找它，说说句子里写的是什么。')}</p></div>{word.context && <p className="kf-distinguish">{word.context}</p>}{word.examples.length > 0 && <div className="kf-example-words"><span>放进词语读</span><strong>{word.examples.map(item => item.text).join(' · ')}</strong></div>}</> : <div className="kf-hidden-writing"><Pencil size={31} /><h3>{writingCharacter ? `在纸上写出${word.text.length > 1 ? '这个词语' : '刚才的字'}` : '合上字卡，自己读一读'}</h3><p>{writingCharacter ? '写好以后，展开字形，逐处对照。' : '想想它在哪个词语里，再展开核对。'}</p></div>}</div>
          {paperReview && <div className="kf-paper-review" role="status"><Check size={20} /><p>请看自己的纸稿：{writingFocus ? writingFocus.attention : '字形写全了吗？有没有漏掉笔画？'}<span>发现不一样的地方，在旁边改写一次。</span></p></div>}
          <div className="kf-paper-actions"><p>{wordHidden ? '先自己想，再核对。' : writingCharacter ? '准备纸和笔，遮住以后独立写。' : '遮住字卡，在词语里读一次。'}</p><button className="kf-primary" onClick={() => { stopAudio(); if (wordHidden) { setWordHidden(false); setPaperReview(writingCharacter); } else { setWordHidden(true); setPaperReview(false); } }}>{wordHidden ? <><Eye size={18} />{writingCharacter ? '展开，核对纸稿' : '展开字卡，核对'}</> : <><EyeOff size={18} />遮住，自己试</>}</button></div>
          <p className="kf-audio-status" role="status">{audioStatus || (getLessonAudioEntry(word.id, word.text) ? '合成朗读示范 · 听一遍，再自己读。' : writingCharacter ? '和课本对照，读准字音，再独立写。' : '和课本对照，把字放进词语里读。')}</p>
        </div>
      </>}

      {mode === 'read' && <>
        <div className="kf-art kf-method-art"><div className="kf-art-heading"><span><Feather size={16} />像作者一样留心看</span><small>细看 · 细想 · 请教</small></div><div className="kf-scene-body"><KingfisherScene mode={promptIndex === 1 ? 'catch' : 'observe'} progress={promptIndex === 1 ? 7 : 0} selectedPart={promptIndex === 0 ? 'feathers' : null} reducedMotion={reducedMotion} /></div><div className="kf-method-notes"><div><span>01</span><strong>看外形</strong><p>颜色、样子，写具体。</p></div><div><span>02</span><strong>看动作</strong><p>连续观察，用准动词。</p></div><div><span>03</span><strong>问名称</strong><p>不认识，还可以请教。</p></div></div></div>
        <div className="kf-reading kf-side"><div className="kf-section-heading"><span className="kf-eyebrow">从一只鸟，学会观察</span><h2>读懂作者的方法</h2></div><div className="kf-prompt-tabs" role="group" aria-label="直接选择阅读问题">{birdLessonCopy.readingPrompts.map((item, index) => <button key={item.id} className={promptIndex === index ? 'is-active' : ''} aria-pressed={promptIndex === index} onClick={() => setPromptIndex(index)}>问题 {index + 1}</button>)}</div><h3 className="kf-reading-question">{prompt.question}</h3><div className="kf-reading-choices">{prompt.choices.map((choice, index) => <button key={choice.text} className={`${answerIndex === index ? 'is-selected' : ''} ${(teacher && teacherAnswers[prompt.id] && choice.correct) || (answerIndex === index && choice.correct) ? 'is-correct' : ''} ${answerIndex === index && !choice.correct ? 'is-retry' : ''}`} aria-pressed={answerIndex === index} onClick={() => setAnswers(current => ({ ...current, [prompt.id]: index }))}><span>{String.fromCharCode(65 + index)}</span><p>{choice.text}</p>{((teacher && teacherAnswers[prompt.id] && choice.correct) || (answerIndex === index && choice.correct)) && <Check size={19} />}</button>)}</div><div className={`kf-reading-feedback ${shownAnswer ? 'has-answer' : ''}`} aria-live="polite">{shownAnswer ? <><strong>{shownAnswer.correct ? '这个理由说得清楚' : '再对照课文想一想'}</strong><p>{shownAnswer.explanation}</p></> : <><span>先自己说一说</span><p>选出想法，再说说你是从哪里看出来的。</p></>}</div>{teacher && <button className="kf-teacher-answer kf-text-button" aria-expanded={!!teacherAnswers[prompt.id]} onClick={() => setTeacherAnswers(current => ({ ...current, [prompt.id]: !current[prompt.id] }))}>{teacherAnswers[prompt.id] ? <EyeOff size={18} /> : <Eye size={18} />}{teacherAnswers[prompt.id] ? '收起参考答案' : '展示参考答案'}</button>}</div>
      </>}
    </section>
    <footer className="kf-footer"><span><Leaf size={15} />{({ observe: '留心身边的事物，就会有新的发现。', catch: '拖动或点动词，停在你想仔细看的地方。', words: '看清字形，遮住试写；对照纸稿，找出易错处。', read: '外形、动作和请教，让一次观察更完整。' })[mode]}</span><span className="kf-footer-mark">{teacher ? '课堂演示' : '河上观察手册'} <i>14</i></span></footer>

    <dialog className="kf-dialog" ref={dialogRef} onClose={() => resourceTrigger.current?.focus()} onClick={event => { if (event.target === dialogRef.current) dialogRef.current.close(); }} aria-labelledby="kf-resource-title"><div className="kf-dialog-heading"><div><span className="kf-eyebrow">给陪伴学习的大人</span><h2 id="kf-resource-title">资料与课堂指导</h2></div><button className="kf-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="关闭资料与指导"><X size={22} /></button></div><div className="kf-dialog-body"><p>{birdLessonCopy.intro}</p><div className="kf-adult-guidance"><h3>课堂里可以这样用</h3><ol><li>点翠鸟的三个部位，让孩子把颜色和样子说具体。</li><li>播放捕鱼动作，停在“飞、衔”同时出现的地方，理解两个词写的是同一时刻的不同动作。</li><li>字词可以直接选择。纸上独立写后，再展开字形核对。</li><li>三道阅读题随时切换，让孩子说出课文中的依据。</li></ol><p>教师投屏只作演示；这一页不读取或保存个人学习记录。</p></div><a className="kf-teacher-link" href="#/chinese-lesson/cn-14/teacher" onClick={() => dialogRef.current?.close()}><BookOpen size={19} /><span>打开教师投屏</span><ArrowRight size={18} /></a><button className="kf-print-button" onClick={printLesson}><Printer size={19} />打印一页练习纸</button><h3>内容来源</h3><div className="kf-sources">{birdLessonCopy.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}</span><ExternalLink size={17} /></a>)}</div><div className="kf-source-note"><h3>教材核对与示意说明</h3><p>{birdLessonRequirementNote}</p><p>观察提示、换词对比和练习由本页原创整理。画面辅助理解课文，动作时长为演示用；翠鸟的外形颜色与动作描述请回到课文核对。</p><p>本页使用现有合成练习音频，不调用设备朗读。纸笔核对用于找出需要再练的地方，不生成“已掌握”记录。</p></div></div></dialog>
    <section className="kf-print" aria-hidden="true"><h1>《搭船的鸟》观察与练写</h1><p>姓名：____________　日期：____________</p><h2>一、把翠鸟说具体</h2><p>羽毛：____________　翅膀：____________　长嘴：____________</p><h2>二、边看动作，边说动词</h2><p>冲　飞　衔　站　吞</p><p>飞回船头时，翠鸟怎样带着小鱼？为什么“冲”比“慢慢走进”更合适？</p><div className="kf-print-lines">______________________________________________<br />______________________________________________</div><h2>三、在纸上独立练写</h2><div className="kf-print-wordbank">{wordBank.words.map(item => <div key={item.id}><span>{item.pinyin}</span><p>{[...item.text].map(() => '□').join(' ')}</p></div>)}</div><h2>四、对照纸稿再看一遍</h2><p>留意：礻与衤；翠字上部；蓝字下部；悄的忄；捕字右边的点。</p><p>需要再练的字词：__________________________________</p><small>{birdLessonRequirementNote}</small></section>
  </main>;
}
