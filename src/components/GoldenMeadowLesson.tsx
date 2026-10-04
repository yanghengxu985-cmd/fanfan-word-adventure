import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, Flower2, Leaf, Pause, Pencil, Play, Printer, RotateCcw, Sun, Sunrise, Sunset, X, ExternalLink } from 'lucide-react';
import { meadowLessonCopy, meadowLessonRequirementNote, meadowRecognitionFocus, meadowWordFocus } from '../data/goldenMeadowLesson';
import { getLessonWords, lessonCourseById } from '../data/chineseLessons';
import { getGoldenMeadowFrame, GOLDEN_MEADOW_DURATION, GOLDEN_MEADOW_PRESETS } from '../lib/goldenMeadowMotion';
import ChineseWordWorkbench, { type ChineseWordWorkbenchHandle } from './ChineseWordWorkbench';
import GoldenMeadowScene from './GoldenMeadowScene';
import './kingfisherLesson.css';
import './goldenMeadowLesson.css';

type Mode = 'time' | 'flower' | 'words' | 'read';
const tabs: { id: Mode; label: string; neutralLabel: string; icon: typeof Leaf }[] = [
  { id: 'time', label: '看草地变化', neutralLabel: '看变化', icon: Sun },
  { id: 'flower', label: '近看蒲公英', neutralLabel: '近看花朵', icon: Flower2 },
  { id: 'words', label: '字词练写', neutralLabel: '字词练写', icon: Pencil },
  { id: 'read', label: '读懂观察', neutralLabel: '读懂方法', icon: BookOpen },
];
const timeIcons = { morning: Sunrise, noon: Sun, evening: Sunset };
const course = lessonCourseById.get('cn-15')!;
const paperWords = getLessonWords(course, 'words');

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

export default function GoldenMeadowLesson({ teacher = false }: { teacher?: boolean }) {
  const [mode, setMode] = useState<Mode>('time');
  const [progress, setProgress] = useState(9);
  const [playing, setPlaying] = useState(false);
  const [playbackRun, setPlaybackRun] = useState(0);
  const [timeAnswer, setTimeAnswer] = useState(false);
  const [flowerOpenness, setFlowerOpenness] = useState(1);
  const [wordHidden, setWordHidden] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [teacherAnswers, setTeacherAnswers] = useState<Record<string, boolean>>({});
  const progressRef = useRef(9);
  const animationRef = useRef<number | null>(null);
  const wordWorkbenchRef = useRef<ChineseWordWorkbenchHandle>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resourceTrigger = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const frame = getGoldenMeadowFrame(progress);
  const observation = meadowLessonCopy.observationTimes.find(item => item.id === frame.period)!;
  const timeTransition = frame.phase === 'opening' || frame.phase === 'closing';
  const timeColour = timeTransition ? frame.phase === 'opening' ? '金色逐渐显露' : '金色逐渐被包住' : observation.grassColour;
  const partialFlower = flowerOpenness > 0 && flowerOpenness < 1;
  const openFlower = flowerOpenness >= .5;
  const flower = meadowLessonCopy.flowerStates.find(item => item.id === (openFlower ? 'open' : 'closed'))!;
  const flowerLabel = partialFlower ? '花瓣正在张合' : flower.label;
  const prompt = meadowLessonCopy.readingPrompts[promptIndex];
  const answerIndex = answers[prompt.id];
  const selectedAnswer = answerIndex === undefined ? undefined : prompt.choices[answerIndex];
  const shownAnswer = teacher && teacherAnswers[prompt.id] ? prompt.choices.find(item => item.correct) : selectedAnswer;
  const hideLessonWords = mode === 'words' && wordHidden;

  function pause() {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setPlaying(false);
  }
  function stopMedia() { pause(); wordWorkbenchRef.current?.stopAudio(); }
  function seek(value: number) {
    stopMedia();
    progressRef.current = Math.max(0, Math.min(GOLDEN_MEADOW_DURATION, value));
    setProgress(progressRef.current); setTimeAnswer(false);
  }
  function togglePlayback() {
    if (playing) { pause(); return; }
    if (progressRef.current >= GOLDEN_MEADOW_DURATION) { progressRef.current = 0; setProgress(0); }
    setTimeAnswer(false); setPlaying(true);
  }
  function replay() { seek(0); setPlaybackRun(run => run + 1); setPlaying(true); }
  function changeMode(next: Mode) { stopMedia(); setWordHidden(false); setMode(next); }
  function setFlower(value: number) { stopMedia(); setFlowerOpenness(Math.max(0, Math.min(1, value))); }
  function openResources() { stopMedia(); dialogRef.current?.showModal(); }
  function printLesson() { stopMedia(); window.print(); }

  useEffect(() => {
    if (!playing || mode !== 'time') return;
    let previous: number | null = null;
    let lastPaint = 0;
    const tick = (now: number) => {
      if (previous !== null) progressRef.current = Math.min(GOLDEN_MEADOW_DURATION, progressRef.current + (now - previous) / 1000);
      previous = now;
      if (!reducedMotion || now - lastPaint >= 120 || progressRef.current === GOLDEN_MEADOW_DURATION) { setProgress(progressRef.current); lastPaint = now; }
      if (progressRef.current >= GOLDEN_MEADOW_DURATION) { setPlaying(false); animationRef.current = null; return; }
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => { if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); animationRef.current = null; };
  }, [mode, playing, playbackRun, reducedMotion]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = '金色的草地 · 草地观察手册';
    const suspend = () => stopMedia();
    const onVisibility = () => { if (document.hidden) suspend(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('hashchange', suspend);
    window.addEventListener('pagehide', suspend);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      wordWorkbenchRef.current?.stopAudio();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('hashchange', suspend);
      window.removeEventListener('pagehide', suspend);
      document.title = previousTitle;
    };
  }, []);
  useEffect(() => { document.title = hideLessonWords ? '字词独立练习 · 三上第15课' : '金色的草地 · 草地观察手册'; }, [hideLessonWords]);

  return <main className="kf-lesson gm-lesson" data-mode={mode} data-teacher={teacher || undefined}>
    <header className="kf-head">
      <a className="kf-back" href={teacher ? '#/teacher' : '#/chinese-book/cn-15'} aria-label={teacher ? '返回老师课堂' : '返回全册课堂'}><ArrowLeft size={21} /><span>语文课堂</span></a>
      <div className="kf-heading"><span className="kf-eyebrow">{hideLessonWords ? '本课练习手册' : '草地观察手册'} <span>三上 · 第15课{teacher ? ' · 教师投屏' : ''}</span></span><h1>{hideLessonWords ? '字词独立练习' : meadowLessonCopy.title}<span>{hideLessonWords ? '先自己想，再展开核对' : '一片草地，三次发现'}</span></h1></div>
      <button className="kf-resource" ref={resourceTrigger} onClick={openResources}><BookOpen size={19} /><span>资料与指导</span></button>
    </header>
    <nav className="kf-tabs" aria-label="本课学习内容">{tabs.map(({ id, label, neutralLabel, icon: Icon }, index) => <button key={id} className={mode === id ? 'is-active' : ''} aria-current={mode === id ? 'page' : undefined} onClick={() => changeMode(id)}><span className="kf-tab-number">0{index + 1}</span><Icon size={19} /><span>{hideLessonWords ? neutralLabel : label}</span></button>)}</nav>

    <section className={`kf-panel gm-panel gm-panel-${mode} ${mode === 'words' ? 'kf-panel-words' : ''} ${mode === 'read' ? 'kf-panel-read' : ''}`} aria-label={hideLessonWords ? '字词独立练习' : tabs.find(item => item.id === mode)!.label}>
      {mode === 'time' && <>
        <div className="kf-art gm-time-art">
          <div className="kf-art-heading"><span><Sun size={16} />同一片草地，留心不同时间</span><small>点时段，直接比较</small></div>
          <div className="gm-scene-body"><GoldenMeadowScene mode="time" progress={progress} reducedMotion={reducedMotion} /></div>
          <div className="gm-time-controls">
            <div className="kf-playback-row"><button className="kf-play-button" onClick={togglePlayback} aria-label={playing ? '暂停草地变化' : '播放草地变化'}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}{playing ? '暂停' : '播放'}</button><label className="kf-timeline"><span className="kf-sr-only">拖动比较一天中的草地变化</span><input type="range" min="0" max={GOLDEN_MEADOW_DURATION} step=".01" value={progress} onChange={event => seek(Number(event.target.value))} aria-valuetext={`${frame.periodLabel}，${frame.caption}`} style={{ '--timeline-position': `${progress / GOLDEN_MEADOW_DURATION * 100}%` } as CSSProperties} /><span className="kf-timeline-time">{progress.toFixed(1)} <small>/ {GOLDEN_MEADOW_DURATION} 秒</small></span></label><button className="kf-replay" onClick={replay} aria-label="从早晨重新播放草地变化"><RotateCcw size={19} /><span>重播</span></button></div>
            <div className="gm-time-buttons" role="group" aria-label="直接选择观察时段">{GOLDEN_MEADOW_PRESETS.map(preset => {
              const Icon = timeIcons[preset.id];
              const item = meadowLessonCopy.observationTimes.find(time => time.id === preset.id)!;
              return <button key={preset.id} className={frame.period === preset.id ? 'is-active' : ''} aria-pressed={frame.period === preset.id} onClick={() => seek(preset.at)}><Icon size={20} /><strong>{item.label}</strong><span>{item.grassColour}</span></button>;
            })}</div>
          </div>
        </div>
        <div className="kf-side gm-time-study">
          <div className="kf-section-heading"><span className="kf-eyebrow">把几次发现放在一起</span><h2>一天，三次发现</h2></div>
          <div className={`gm-observation-card is-${timeTransition ? frame.phase : observation.id}`} aria-live="polite"><span className="gm-observation-time">{timeTransition ? frame.phase === 'opening' ? '花瓣逐渐展开' : '花瓣逐渐合拢' : observation.label}{!timeTransition && <small>{observation.timeHint}</small>}</span><div><i /><p><span>{timeTransition ? '留意金色花瓣' : '草地看起来'}</span><strong>{timeColour}</strong></p></div></div>
          <p className="gm-observation-description" aria-live="polite">{timeTransition ? frame.caption : observation.description}</p>
          {timeTransition ? <p className="gm-transition-note">比较花瓣露出的多少，留意远处看到的颜色。</p> : <div className={`gm-time-question ${timeAnswer ? 'is-open' : ''}`}><p>{observation.question}</p><button className="kf-text-button" aria-expanded={timeAnswer} onClick={() => setTimeAnswer(!timeAnswer)}>{timeAnswer ? '收起提示' : teacher ? '展示参考说法' : '说过了，看提示'}{timeAnswer ? <EyeOff size={17} /> : <Eye size={17} />}</button>{timeAnswer && <span aria-live="polite">{observation.answer}</span>}</div>}
        </div>
      </>}

      {mode === 'flower' && <>
        <div className="kf-art gm-flower-art">
          <div className="kf-art-heading"><span><Flower2 size={16} />走近一朵蒲公英</span><small>同一朵黄花，试着张合</small></div>
          <div className="gm-scene-body"><GoldenMeadowScene mode="examine" progress={9} openness={flowerOpenness} reducedMotion={reducedMotion} /></div>
          <div className="gm-flower-controls"><div className="gm-flower-buttons" role="group" aria-label="选择花朵状态"><button className={flowerOpenness === 0 ? 'is-active' : ''} aria-pressed={flowerOpenness === 0} onClick={() => setFlower(0)}>花瓣合拢</button><label className="gm-openness"><span className="kf-sr-only">拖动控制同一朵黄花的张合</span><input type="range" min="0" max="1" step=".01" value={flowerOpenness} onChange={event => setFlower(Number(event.target.value))} aria-valuetext={flowerOpenness === 0 ? '花瓣合拢' : flowerOpenness === 1 ? '花瓣完全张开' : '花瓣逐渐张开'} style={{ '--timeline-position': `${flowerOpenness * 100}%` } as CSSProperties} /></label><button className={flowerOpenness === 1 ? 'is-active' : ''} aria-pressed={flowerOpenness === 1} onClick={() => setFlower(1)}>花瓣张开</button></div><p>点一下，或拖动看看：金色花瓣怎样显露、又怎样被包住。</p></div>
        </div>
        <div className="kf-side gm-flower-study">
          <div className="kf-section-heading"><span className="kf-eyebrow">从看到的现象，找到原因</span><h2>花瓣里，藏着答案</h2></div>
          <div className="gm-flower-description" aria-live="polite"><span>{partialFlower ? '正在比较张开的程度' : '此刻近看花朵'}</span><h3>{flowerLabel}</h3><p>{partialFlower ? '金色花瓣部分显露，继续比较露出的多少。' : flower.appearance}</p></div>
          <div className={`gm-cause-chain ${partialFlower ? 'is-partial' : openFlower ? 'is-open' : 'is-closed'}`} aria-live="polite"><div><span>花朵状态</span><strong>{partialFlower ? '部分张开' : flower.label}</strong></div><ArrowDown size={17} /><div><span>金色花瓣</span><strong>{partialFlower ? '部分显露' : openFlower ? '显露在外面' : '被包在里面'}</strong></div><ArrowDown size={17} /><div><span>远看草地</span><strong>{partialFlower ? '继续比较颜色' : openFlower ? '更显金色' : '更显绿色'}</strong></div></div>
          <p className="gm-flower-reason" aria-live="polite">{partialFlower ? '这里正在比较花瓣露出的程度：露出的金色越多，远看就越显金色。' : flower.reason}</p>
          <p className="gm-hand-note"><Flower2 size={18} />像手掌一样张开、合拢，帮助我们想象花朵的变化。</p>
        </div>
      </>}

      {mode === 'words' && <ChineseWordWorkbench ref={wordWorkbenchRef} courseId="cn-15" writingFocus={meadowLessonCopy.writingFocus} recognitionFocus={meadowRecognitionFocus} wordFocus={meadowWordFocus} initialCharacter="察" onHiddenChange={setWordHidden} />}

      {mode === 'read' && <>
        <div className="kf-art gm-method-art">
          <div className="kf-art-heading"><span><Leaf size={16} />把发现连成一份观察记录</span><small>比较时段，再近看原因</small></div>
          <div className="gm-scene-body"><GoldenMeadowScene mode={promptIndex === 1 ? 'examine' : 'time'} progress={9} openness={promptIndex === 1 ? 0 : undefined} reducedMotion={reducedMotion} /></div>
          <div className="gm-observation-record"><table><caption>课文里的三次观察</caption><thead><tr><th scope="col">什么时候</th><th scope="col">草地颜色</th><th scope="col">花朵状态</th></tr></thead><tbody>{meadowLessonCopy.observationTimes.map(item => <tr key={item.id}><th scope="row">{item.label}</th><td><i className={item.id === 'noon' ? 'is-golden' : ''} />{item.grassColour}</td><td>{item.flowerLabel}</td></tr>)}</tbody></table><p>先记看见的，再走近找出原因。</p></div>
        </div>
        <div className="kf-reading kf-side">
          <div className="kf-section-heading"><span className="kf-eyebrow">留心观察，就有新的发现</span><h2>读懂作者的观察</h2></div>
          <div className="kf-prompt-tabs" role="group" aria-label="直接选择阅读问题">{meadowLessonCopy.readingPrompts.map((item, index) => <button key={item.id} className={promptIndex === index ? 'is-active' : ''} aria-pressed={promptIndex === index} onClick={() => setPromptIndex(index)}>问题 {index + 1}</button>)}</div>
          <h3 className="kf-reading-question">{prompt.question}</h3>
          <div className="kf-reading-choices">{prompt.choices.map((choice, index) => <button key={choice.text} className={`${answerIndex === index ? 'is-selected' : ''} ${(teacher && teacherAnswers[prompt.id] && choice.correct) || (answerIndex === index && choice.correct) ? 'is-correct' : ''} ${answerIndex === index && !choice.correct ? 'is-retry' : ''}`} aria-pressed={answerIndex === index} onClick={() => setAnswers(current => ({ ...current, [prompt.id]: index }))}><span>{String.fromCharCode(65 + index)}</span><p>{choice.text}</p>{((teacher && teacherAnswers[prompt.id] && choice.correct) || (answerIndex === index && choice.correct)) && <Check size={19} />}</button>)}</div>
          <div className={`kf-reading-feedback ${shownAnswer ? 'has-answer' : ''}`} aria-live="polite">{shownAnswer ? <><strong>{shownAnswer.correct ? '这个理由说得清楚' : promptIndex === 2 ? '再对照观察记录想一想' : '再对照课文想一想'}</strong><p>{shownAnswer.explanation}</p></> : <><span>先自己说一说</span><p>看到的现象，和找到的原因，分别是什么？</p></>}</div>
          {teacher && <button className="kf-teacher-answer kf-text-button" aria-expanded={!!teacherAnswers[prompt.id]} onClick={() => setTeacherAnswers(current => ({ ...current, [prompt.id]: !current[prompt.id] }))}>{teacherAnswers[prompt.id] ? <EyeOff size={18} /> : <Eye size={18} />}{teacherAnswers[prompt.id] ? '收起参考答案' : '展示参考答案'}</button>}
        </div>
      </>}
    </section>

    <footer className="kf-footer"><span><Leaf size={15} />{({ time: '点时段或拖动，比较同一片草地。', flower: '花瓣的张合，改变了远处看到的颜色。', words: '看清字形，遮住试写；对照纸稿，找出易错处。', read: '先写看见的，再用观察到的细节解释。' })[mode]}</span><span className="kf-footer-mark">{hideLessonWords ? '本课练习手册' : teacher ? '课堂演示' : '自然观察手册'} <i>15</i></span></footer>

    <dialog className="kf-dialog gm-dialog" ref={dialogRef} onClose={() => resourceTrigger.current?.focus()} onClick={event => { if (event.target === dialogRef.current) dialogRef.current.close(); }} aria-labelledby="gm-resource-title">
      <div className="kf-dialog-heading"><div><span className="kf-eyebrow">给陪伴学习的大人</span><h2 id="gm-resource-title">资料与课堂指导</h2></div><button className="kf-dialog-close" onClick={() => dialogRef.current?.close()} aria-label="关闭资料与指导"><X size={22} /></button></div>
      <div className="kf-dialog-body"><p>{meadowLessonCopy.intro}</p><div className="kf-adult-guidance"><h3>课堂里可以这样用</h3><ol><li>三个时段可以直接点选，让孩子先说出什么时候、看到了什么颜色。</li><li>近看同一朵黄花，拖动花瓣张合，说清金色为什么显露或被包住。</li><li>把时段、草地颜色和花朵状态连起来，区分看到的现象与找到的原因。</li><li>字词随时选择。会认字练认读，会写字在纸上独立写后再核对。</li></ol><p>教师投屏只作演示；这一页不显示或保存个人学习记录。</p></div>
        <a className="kf-teacher-link" href="#/chinese-lesson/cn-15/teacher" onClick={() => dialogRef.current?.close()}><BookOpen size={19} /><span>打开教师投屏</span><ArrowRight size={18} /></a><button className="kf-print-button" onClick={printLesson}><Printer size={19} />打印一页练习纸</button>
        <h3>内容来源</h3><div className="kf-sources">{meadowLessonCopy.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noopener noreferrer"><span>{source.title}</span><ExternalLink size={17} /></a>)}</div>
        <div className="kf-source-note"><h3>教材核对与示意说明</h3><p>{meadowLessonRequirementNote}</p><p>张合演示对应同一生长期的黄色花朵，不把黄花变成茸毛球。时长为观察演示用，具体开花时刻并非植物的通用时间表。</p><p>观察提示、释义与练习为原创辅助；字词音频沿用现有合成练习示范，不调用设备朗读。练写通过纸稿找错，不生成“已掌握”记录。</p></div>
      </div>
    </dialog>
    <section className="kf-print gm-print" aria-hidden="true"><h1>《金色的草地》观察与练写</h1><p>姓名：____________　日期：____________</p><h2>一、说清楚三次发现</h2><table><thead><tr><th>时间</th><th>草地颜色</th><th>花朵状态</th></tr></thead><tbody>{meadowLessonCopy.observationTimes.map(item => <tr key={item.id}><th>{item.label}</th><td>________________</td><td>________________</td></tr>)}</tbody></table><h2>二、找到颜色变化的原因</h2><p>花瓣张开时，金色为什么更显眼？花瓣合拢时，又发生了什么？</p><div className="gm-print-lines">__________________________________________________<br />__________________________________________________</div><h2>三、自选字词，在纸上练写</h2><div className="kf-print-wordbank">{paperWords.map(item => <div key={item.id}><span>{item.pinyin}</span><p>{[...item.text].map(() => '□').join(' ')}</p></div>)}</div><p>核对后需要再练的字词：____________________________</p><small>{meadowLessonRequirementNote}</small></section>
  </main>;
}
