import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Headphones, MessageCircle, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { Course } from '../data/curriculum';
import { makeEnglishActivityRound, type EnglishActivity, type EnglishActivityKind } from '../data/englishActivities';
import { createEnglishAudioPlayer } from '../lib/englishAudio';
import type { AttemptInput } from '../lib/progress';
import EnglishPicture from './EnglishPicture';
import './englishAdventure.css';

interface Props {
  course: Course;
  kind: EnglishActivityKind;
  limit: number;
  teacher?: boolean;
  preferredLexemeIds?: string[];
  onAttempt?: (attempt: AttemptInput) => void;
  onExit?: () => void;
}

type AudioPurpose = 'prompt' | 'choice' | 'model' | 'dialogue';
interface ActiveAudio { id: string; activityId: string; purpose: AudioPurpose }
interface Feedback { choiceId: string; correct: boolean; isRetry: boolean }

/** Listening and scene selections are guided practice, never independent recall scores. */
export default function EnglishAdventure({ course, kind, limit, teacher = false, preferredLexemeIds, onAttempt, onExit }: Props) {
  const preferredKey = preferredLexemeIds?.join('\0');
  const questions = useMemo(() => makeEnglishActivityRound(course.id, kind, limit,
    preferredKey === undefined ? undefined : preferredKey ? preferredKey.split('\0') : []), [course.id, kind, limit, preferredKey]);
  const [index, setIndex] = useState(0);
  const [heardPrompt, setHeardPrompt] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [oralOpen, setOralOpen] = useState(false);
  const [playing, setPlaying] = useState<AudioPurpose | null>(null);
  const [audioMessage, setAudioMessage] = useState('');
  const [audioFailed, setAudioFailed] = useState(false);
  const [completed, setCompleted] = useState<{ activityId: string; correct: boolean }[]>([]);
  const [skipped, setSkipped] = useState(0);
  const activity = questions[index];
  const activityRef = useRef<EnglishActivity | undefined>(activity);
  activityRef.current = activity;
  const activeAudioRef = useRef<ActiveAudio | null>(null);
  const disposedRef = useRef(false);
  const lockedRef = useRef(false);
  const recordedRef = useRef(new Set<string>());
  const [player] = useState(() => createEnglishAudioPlayer({
    baseUrl: import.meta.env.BASE_URL,
    onStatus: message => {
      if (!disposedRef.current && activeAudioRef.current?.activityId === activityRef.current?.id) setAudioMessage(message);
    },
    onEvent: (event, id) => {
      const active = activeAudioRef.current;
      if (disposedRef.current || !active || active.id !== id || active.activityId !== activityRef.current?.id) return;
      if (event === 'started') setPlaying(active.purpose);
      else {
        setPlaying(null);
        if (event === 'ended' && active.purpose === 'prompt') setHeardPrompt(true);
        if (event === 'error') setAudioFailed(true);
        // Keep the context for the following status callback; stop() invalidates it explicitly.
      }
    },
  }));

  function stopAudio() {
    activeAudioRef.current = null;
    player.stop();
    setPlaying(null);
    setAudioMessage('');
  }
  function playAudio(id: string, purpose: AudioPurpose) {
    if (!activity || paused) return;
    activeAudioRef.current = { id, activityId: activity.id, purpose };
    setAudioFailed(false);
    setPlaying(purpose);
    player.play(id);
  }
  useEffect(() => {
    disposedRef.current = false;
    return () => { disposedRef.current = true; activeAudioRef.current = null; player.stop(); };
  }, [player]);
  useEffect(() => {
    activeAudioRef.current = null;
    player.stop();
    lockedRef.current = false;
    setHeardPrompt(false); setFeedback(null); setRetrying(false); setOralOpen(false);
    setPlaying(null); setAudioMessage(''); setAudioFailed(false); setPaused(false);
  }, [activity?.id, player]);
  useEffect(() => {
    setIndex(0); setCompleted([]); setSkipped(0); recordedRef.current.clear();
  }, [questions]);

  function leave() {
    stopAudio();
    if (onExit) onExit();
    else window.location.hash = `/course/${course.id}`;
  }
  function next(skip = false) {
    if (skip && !recordedRef.current.has(activity!.id)) setSkipped(value => value + 1);
    stopAudio();
    // Lock until the new activity effect has cleared its previous feedback.
    lockedRef.current = true;
    setIndex(value => value + 1);
  }
  function choose(choiceId: string) {
    if (!activity || !heardPrompt || paused || feedback || lockedRef.current) return;
    lockedRef.current = true;
    stopAudio();
    const correct = activity.acceptedChoiceIds.includes(choiceId);
    const firstAnswer = !recordedRef.current.has(activity.id);
    setFeedback({ choiceId, correct, isRetry: !firstAnswer });
    if (firstAnswer) {
      recordedRef.current.add(activity.id);
      setCompleted(value => [...value, { activityId: activity.id, correct }]);
      if (!teacher) onAttempt?.({
        lexemeId: activity.lexemeId,
        skill: kind === 'scene' ? 'context' : 'listening',
        mode: kind === 'scene' ? 'selection' : 'listening',
        correct, assisted: false, confirmedBy: 'auto',
        sourceEvidence: `${activity.id}:prompt-ended:first-choice:${choiceId}`,
      });
    }
  }
  function retry() {
    stopAudio();
    lockedRef.current = false;
    setFeedback(null); setRetrying(true); setOralOpen(false);
  }
  function togglePause() {
    stopAudio();
    setPaused(value => !value);
  }

  if (!questions.length) return <section className="english-adventure ea-empty">
    <Compass size={45} /><h1>这一站先和词卡见见面</h1><p>这里还没有可用的情景或听音练习。选一课，再来探险吧。</p>
    <button className="ea-button ea-primary" onClick={leave}><ArrowLeft size={18} />{onExit ? '回到复习背包' : '回到这一课'}</button>
  </section>;
  if (!activity) return <section className="english-adventure ea-finish">
    <div className="ea-finish-picture"><EnglishPicture picture="hello" decorative /></div>
    <span className="ea-kicker">A LITTLE ADVENTURE, DONE</span><h1>这一趟小探险，到站啦！</h1>
    <p>走过了 {questions.length} 个{kind === 'scene' ? '生活情景' : '听音小站'}。{skipped > 0 && <><br />有 {skipped} 站的声音没听清，我们下次再来。</>}</p>
    <div className="ea-finish-note">{teacher ? '课堂演示没有写入个人学习记录。' : <>{completed.length} 次第一次选择已记在背包里。听示范和再试一次，都是练习。</>}</div>
    <button className="ea-button ea-primary" onClick={leave}>{onExit ? '回到复习背包' : '回到这一课'} <ArrowRight size={19} /></button>
  </section>;

  const showModel = Boolean(feedback) || retrying;
  const choicesDisabled = !heardPrompt || paused || Boolean(feedback);
  return <section className={`english-adventure ${kind === 'listening' ? 'ea-listening' : 'ea-scene'}`} data-activity-id={activity.id} data-activity-kind={kind} data-prompt-heard={heardPrompt} aria-label={kind === 'listening' ? '听声音选图片' : '英语情景小剧场'}>
    <header className="ea-topbar">
      <button className="ea-exit" onClick={leave}><ArrowLeft size={19} />{onExit ? '返回背包' : '先回这一课'}</button>
      <div className="ea-route-label">{kind === 'scene' ? <MessageCircle size={19} /> : <Headphones size={19} />}<span>{kind === 'scene' ? '情景小剧场' : '听音找朋友'}<small>{index + 1} / {questions.length}</small></span></div>
      <button className="ea-pause" onClick={togglePause} aria-label={paused ? '继续探险' : '暂停探险'}>{paused ? <Play size={19} /> : <Pause size={19} />}<span>{paused ? '继续' : '休息一下'}</span></button>
    </header>
    <div className="ea-stops" aria-label={`第 ${index + 1} 站，共 ${questions.length} 站`}>{questions.map((item, step) => <span key={item.id} className={step < index ? 'done' : step === index ? 'current' : ''}>{step < index ? <Check size={14} /> : step + 1}</span>)}</div>
    {teacher && <div className="ea-teacher-label">一起听，一起选 · 课堂活动不记录个人成绩</div>}
    {paused ? <div className="ea-rest"><EnglishPicture picture="harbour" decorative /><h1>船停靠一下，休息一会儿</h1><p>准备好了，我们接着听。这一站还在这里等你。</p><button className="ea-button ea-primary" onClick={togglePause}><Play size={19} />继续探险</button></div> : <>
      <div className="ea-stage">
        <div className="ea-stage-art"><EnglishPicture picture={kind === 'listening' && !showModel ? 'listening-speaker' : activity.picture} description={kind === 'listening' && !showModel ? '正在听声音的小朋友' : activity.scene} /><span className="ea-art-caption">{kind === 'scene' ? '你也在故事里' : '把耳朵借给小岛'}</span></div>
        <div className="ea-stage-copy"><span className="ea-kicker">{course.title} · 第 {index + 1} 站</span><h1>{activity.scene}</h1>
          {(kind === 'scene' && heardPrompt || showModel) && <p className="ea-heard-words" lang="en">{activity.promptText}</p>}
          <button className={`ea-button ea-listen-button ${playing === 'prompt' ? 'playing' : ''}`} onClick={() => playAudio(activity.promptAudioId, 'prompt')} disabled={playing === 'prompt'}><Volume2 size={23} />{playing === 'prompt' ? '正在听…' : heardPrompt ? '再听一次' : '听一听'}<span className="ea-wave" aria-hidden="true"><i /><i /><i /><i /></span></button>
          <p className="ea-stage-help">{heardPrompt ? kind === 'listening' ? '声音像哪一幅图？选一个吧。' : '听听小伙伴的回答，选一句合适的。' : '先点「听一听」。声音播完，选项就会亮起来。'}</p>
        </div>
      </div>
      {audioMessage && <p className={`ea-audio-status ${audioFailed ? 'failed' : ''}`} role="status">{audioMessage}</p>}
      {audioFailed && !feedback && <div className="ea-audio-retry"><span>声音没听清也没关系，可以再点一次。</span><button className="ea-button ea-light" onClick={() => next(true)}>{recordedRef.current.has(activity.id) ? '先去下一站' : '跳过这题，不记结果'} <ArrowRight size={17} /></button></div>}
      {retrying && !feedback && <div className="ea-retry-note"><RotateCcw size={18} />跟着示范，再选一次吧。这次只练习，不再记结果。</div>}
      <div className={`ea-choices ea-choices-${activity.choices.length} ${!heardPrompt ? 'waiting' : ''}`} aria-label={kind === 'listening' ? '选择一幅图片' : '选择一个回答'}>
        {activity.choices.map((choice, choiceIndex) => <article className={`ea-choice ${feedback?.choiceId === choice.id ? feedback.correct ? 'chosen-right' : 'chosen-try' : ''}`} key={choice.id} data-choice-id={choice.id}>
          <span className="ea-choice-number">{String.fromCharCode(65 + choiceIndex)}</span>
          <EnglishPicture picture={choice.picture} description={choice.description} nameLabel={kind === 'scene' && /\bLin\b/.test(choice.text || '') ? 'Lin' : 'Lan'} />
          {(kind === 'scene' && heardPrompt || showModel) && choice.text && <p className="ea-choice-words" lang="en">{choice.text}</p>}
          <span className="ea-picture-description">选项 {String.fromCharCode(65 + choiceIndex)}</span>
          <div className="ea-choice-actions">{choice.audioId && <button className="ea-button ea-light" data-action="listen-choice" disabled={!heardPrompt} onClick={() => playAudio(choice.audioId!, 'choice')} aria-label={`听选项 ${String.fromCharCode(65 + choiceIndex)}`}><Volume2 size={19} />听选项</button>}<button className="ea-button ea-pick" data-action="choose" disabled={choicesDisabled} onClick={() => choose(choice.id)} aria-label={`我选这个：${choice.description}`}>我选这个 <ArrowRight size={16} /></button></div>
        </article>)}
      </div>
      {feedback && <div className={`ea-feedback ${feedback.correct ? 'right' : 'try-again'}`} role="status">
        <div className="ea-feedback-heading"><span>{feedback.correct ? <Check size={25} /> : <Headphones size={25} />}</span><div><h2>{feedback.correct ? feedback.isRetry ? '这次找到啦！' : '听到了，也选对啦！' : '没关系，换个角度再听听'}</h2><p>{activity.explanation}</p></div></div>
        <div className="ea-model"><span>小伙伴的示范</span><p lang="en">{activity.modelText}</p><button className="ea-button ea-light" onClick={() => playAudio(activity.modelAudioId, 'model')}><Volume2 size={19} />听示范</button>{activity.dialogueAudioId && <button className="ea-button ea-light" onClick={() => playAudio(activity.dialogueAudioId!, 'dialogue')}><MessageCircle size={19} />听完整对话</button>}</div>
        <div className="ea-feedback-actions">{!feedback.correct && <button className="ea-button ea-primary" onClick={retry}><RotateCcw size={18} />再试一次</button>}{(feedback.correct || feedback.isRetry) && <button className="ea-button ea-primary" onClick={() => next()}>{index === questions.length - 1 ? '这次探险完成啦' : '去下一站'} <ArrowRight size={18} /></button>}<button className="ea-button ea-outline" onClick={() => setOralOpen(value => !value)}><MessageCircle size={19} />轮到你开口</button></div>
        {oralOpen && <div className="ea-oral"><h3>轮到你当小伙伴</h3><p>{activity.oralCue}</p><button className="ea-button ea-light" onClick={() => playAudio(activity.modelAudioId, 'model')}><Volume2 size={19} />听示范</button><small>自己说一说就好，可以说出不一样的合理回答。这里不打分。</small></div>}
      </div>}
      <p className="ea-bottom-note"><Headphones size={16} />英式女声 · 清晰慢读 <span>可以反复听，也可以随时休息。</span></p>
    </>}
  </section>;
}
