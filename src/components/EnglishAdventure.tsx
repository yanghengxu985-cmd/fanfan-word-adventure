import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Headphones, MessageCircle, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
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
  const [modal, setModal] = useState<'model' | 'oral' | null>(null);
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const focusPromptRef = useRef(false);
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
    setHeardPrompt(false); setFeedback(null); setRetrying(false); setModal(null);
    setPlaying(null); setAudioMessage(''); setAudioFailed(false); setPaused(false);
  }, [activity?.id, player]);
  useEffect(() => {
    setIndex(0); setCompleted([]); setSkipped(0); recordedRef.current.clear();
  }, [questions]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modal && !dialog.open) dialog.showModal();
    else if (!modal && dialog.open) dialog.close();
  }, [modal, activity?.id]);
  useEffect(() => {
    if (!focusPromptRef.current || paused || !promptRef.current) return;
    focusPromptRef.current = false;
    promptRef.current.focus({ preventScroll: true });
  }, [activity?.id, feedback, paused]);

  function openModal(kind: 'model' | 'oral', trigger: HTMLButtonElement) {
    stopAudio();
    modalTriggerRef.current = trigger;
    setModal(kind);
  }
  function closeModal() {
    stopAudio();
    dialogRef.current?.close();
    setModal(null);
    modalTriggerRef.current?.focus({ preventScroll: true });
  }

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
    focusPromptRef.current = true;
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
    focusPromptRef.current = true;
    setFeedback(null); setRetrying(true); setModal(null);
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
  const feedbackTitle = feedback?.correct
    ? feedback.isRetry ? '这次找到啦！' : '听到了，也选对啦！'
    : '没关系，再听听看';
  return <section className={`english-adventure ${kind === 'listening' ? 'ea-listening' : 'ea-scene'}`} data-activity-id={activity.id} data-activity-kind={kind} data-prompt-heard={heardPrompt} aria-label={kind === 'listening' ? '听声音选图片' : '英语情景小剧场'}>
    <header className="ea-topbar">
      <button className="ea-exit" onClick={leave}><ArrowLeft size={19} />{onExit ? '返回背包' : '先回这一课'}</button>
      <div className="ea-route-label">
        <span>{kind === 'scene' ? <MessageCircle size={18} /> : <Headphones size={18} />}<b>{kind === 'scene' ? '情景小剧场' : '听音找朋友'}</b><small>{index + 1} / {questions.length}</small></span>
        <div className="ea-course-label">{teacher ? '课堂演示 · 不记录成绩' : course.title}</div>
        <div className="ea-stops" aria-label={`第 ${index + 1} 站，共 ${questions.length} 站`}>{questions.map((item, step) => <span key={item.id} className={step < index ? 'done' : step === index ? 'current' : ''}>{step < index ? <Check size={12} /> : step + 1}</span>)}</div>
      </div>
      <button className="ea-pause" onClick={togglePause} aria-label={paused ? '继续探险' : '暂停探险'}>{paused ? <Play size={19} /> : <Pause size={19} />}<span>{paused ? '继续' : '休息一下'}</span></button>
    </header>
    {paused ? <div className="ea-body ea-rest"><EnglishPicture picture="harbour" decorative /><h1>船停靠一下，休息一会儿</h1><p>准备好了，我们接着听。这一站还在这里等你。</p></div> : <div className="ea-body">
      <div className="ea-stage">
        <div className="ea-stage-art"><EnglishPicture picture={kind === 'listening' && !showModel ? 'listening-speaker' : activity.picture} description={kind === 'listening' && !showModel ? '正在听声音的小朋友' : activity.scene} /></div>
        <div className="ea-stage-copy"><span className="ea-kicker">{kind === 'scene' ? '你也在故事里' : '把耳朵借给小岛'}</span><h1>{activity.scene}</h1>
          {(kind === 'scene' && heardPrompt || showModel) && <p className="ea-heard-words" lang="en">{activity.promptText}</p>}
          <button ref={promptRef} className={`ea-button ea-listen-button ${playing === 'prompt' ? 'playing' : ''}`} onClick={() => playAudio(activity.promptAudioId, 'prompt')} disabled={playing === 'prompt'}><Volume2 size={23} />{playing === 'prompt' ? '正在听…' : heardPrompt ? '再听一次' : '听一听'}<span className="ea-wave" aria-hidden="true"><i /><i /><i /><i /></span></button>
        </div>
      </div>
      <div className={`ea-choices ea-choices-${activity.choices.length} ${!heardPrompt ? 'waiting' : ''}`} aria-label={kind === 'listening' ? '选择一幅图片' : '选择一个回答'}>
        {activity.choices.map((choice, choiceIndex) => <article className={`ea-choice ${feedback?.choiceId === choice.id ? feedback.correct ? 'chosen-right' : 'chosen-try' : ''}`} key={choice.id} data-choice-id={choice.id}>
          <span className="ea-choice-number">{String.fromCharCode(65 + choiceIndex)}</span>
          <EnglishPicture picture={choice.picture} description={choice.description} nameLabel={kind === 'scene' && /\bLin\b/.test(choice.text || '') ? 'Lin' : 'Lan'} />
          {(kind === 'scene' && heardPrompt || showModel) && choice.text && <p className="ea-choice-words" lang="en">{choice.text}</p>}
          <div className="ea-choice-actions">{choice.audioId && <button className="ea-button ea-light" data-action="listen-choice" disabled={!heardPrompt} onClick={() => playAudio(choice.audioId!, 'choice')} aria-label={`听选项 ${String.fromCharCode(65 + choiceIndex)}`}><Volume2 size={19} /><span className="ea-option-listen-label">听选项</span></button>}<button className="ea-button ea-pick" data-action="choose" disabled={choicesDisabled} onClick={() => choose(choice.id)} aria-label={`我选这个：${choice.description}`}>我选这个 <ArrowRight size={16} /></button></div>
        </article>)}
      </div>
    </div>}

    <footer className={`ea-action-dock ${feedback && !paused ? 'has-feedback' : ''}`} data-action-dock>
      {paused ? <><div className="ea-dock-message"><Pause size={23} /><p>小船停好了，想继续时点这里。</p></div><button className="ea-button ea-primary" onClick={togglePause}><Play size={19} />继续探险</button></> : feedback ? <>
        <div className={`ea-feedback ${feedback.correct ? 'right' : 'try-again'}`} role="status"><span className="ea-feedback-symbol">{feedback.correct ? <Check size={24} /> : <Headphones size={24} />}</span><div><h2>{feedbackTitle}</h2><p lang="en">{activity.modelText}</p></div></div>
        <div className="ea-feedback-actions">
          {!feedback.correct && <button className={`ea-button ${feedback.isRetry ? 'ea-light ea-secondary-retry' : 'ea-primary'}`} onClick={retry} aria-label="再试一次"><RotateCcw size={18} /><span>再试一次</span></button>}
          {(feedback.correct || feedback.isRetry) && <button className="ea-button ea-primary" onClick={() => next()}>{index === questions.length - 1 ? '这次探险完成啦' : '去下一站'} <ArrowRight size={18} /></button>}
          <div className="ea-dock-tools"><button className="ea-button ea-light" onClick={event => openModal('model', event.currentTarget)} aria-label="看看示范"><Volume2 size={19} /><span className="ea-tool-label">看看示范</span></button><button className="ea-button ea-light" onClick={event => openModal('oral', event.currentTarget)} aria-label="轮到你开口"><MessageCircle size={19} /><span className="ea-tool-label">轮到你开口</span></button></div>
        </div>
      </> : <>
        <div className={`ea-dock-message ${audioFailed ? 'ea-audio-retry' : retrying ? 'ea-retry-note' : ''}`}><Headphones size={23} /><div><p>{audioFailed ? '声音没听清，可以再点一次。' : retrying ? '再选一次，这次只练习。' : heardPrompt ? kind === 'listening' ? '声音像哪一幅图？选一个吧。' : '选一句合适的回答吧。' : '先听一听，播完就能选。'}</p><small className={`ea-audio-status ${audioFailed ? 'failed' : ''}`} role="status">{audioMessage || '英式女声 · 清晰慢读'}</small></div></div>
        {audioFailed && <button className="ea-button ea-light" onClick={() => next(true)}>{recordedRef.current.has(activity.id) ? '先去下一站' : '跳过这题，不记结果'} <ArrowRight size={17} /></button>}
      </>}
    </footer>

    <dialog ref={dialogRef} className="ea-dialog" aria-label={modal === 'oral' ? '轮到你当小伙伴' : '小伙伴的示范'} onCancel={event => { event.preventDefault(); closeModal(); }} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal(); } }}>
      <header className="ea-dialog-header"><h2>{modal === 'oral' ? '轮到你当小伙伴' : '小伙伴的示范'}</h2><button className="ea-button ea-light" onClick={closeModal} aria-label="回到题目" autoFocus><X size={21} /><span>回到题目</span></button></header>
      <div className="ea-dialog-content">{modal === 'model' ? <><p className="ea-model-explanation">{activity.explanation}</p><div className="ea-model"><p lang="en">{activity.modelText}</p><div className="ea-modal-audio-actions"><button className="ea-button ea-primary" onClick={() => playAudio(activity.modelAudioId, 'model')}><Volume2 size={19} />听示范</button>{activity.dialogueAudioId && <button className="ea-button ea-light" onClick={() => playAudio(activity.dialogueAudioId!, 'dialogue')}><MessageCircle size={19} />听完整对话</button>}</div></div></> : modal === 'oral' ? <div className="ea-oral"><p>{activity.oralCue}</p><button className="ea-button ea-primary" onClick={() => playAudio(activity.modelAudioId, 'model')}><Volume2 size={19} />听示范</button><small>自己说一说就好，合理的回答可以不一样。这里不打分。</small></div> : null}</div>
      <footer className="ea-dialog-footer"><p role="status">{audioMessage || '可以反复听，想好后再回到题目。'}</p></footer>
    </dialog>
  </section>;
}
