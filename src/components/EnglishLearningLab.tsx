import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Headphones, HelpCircle, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import {
  englishLabLessons, getEnglishLabLesson, labGuideAudioId, labInstructionAudioId,
  makeLabAttempt, makeLabQuestions, type LabDemo, type LabLesson, type LabQuestion,
} from '../data/englishLearningLab';
import { createEnglishAudioPlayer } from '../lib/englishAudio';
import type { AttemptInput } from '../lib/progress';
import EnglishLabScene from './EnglishLabScene';
import './EnglishLearningLab.css';

interface Props {
  lessonId?: string;
  teacher?: boolean;
  reviewLexemeIds?: string[];
  onAttempt?: (attempt: AttemptInput) => void;
  onExit?: () => void;
}

type AudioPurpose = 'demo' | 'prompt' | 'guide' | 'instruction' | 'help';
type LabStep = { kind: 'demo'; id: string; demo: LabDemo } | { kind: 'question'; id: string; question: LabQuestion };
interface Feedback { choiceId: string; correct: boolean; isRetry: boolean }
const phaseNames = { learn: 'Learn', guided: 'Practice', check: 'Check', transfer: 'Switch' } as const;
const phases = ['learn', 'guided', 'check', 'transfer'] as const;

function englishAudioStatus(message: string): string {
  if (message === '正在播放英式慢读示范…') return 'Listening…';
  if (message === '再跟着读一遍吧。') return 'Ready. Listen again if you like.';
  return 'No sound. Please try again.';
}

/** The player owns native-media races; this guard also rejects callbacks from a past lesson step. */
function useLabAudio(scope: string, onEnded?: (purpose: AudioPurpose) => void) {
  const scopeRef = useRef(scope);
  const endedRef = useRef(onEnded);
  scopeRef.current = scope;
  endedRef.current = onEnded;
  const disposedRef = useRef(false);
  const activeRef = useRef<{ scope: string; id: string; purpose: AudioPurpose } | null>(null);
  const [playing, setPlaying] = useState<AudioPurpose | null>(null);
  const [pending, setPending] = useState<AudioPurpose | null>(null);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [player] = useState(() => createEnglishAudioPlayer({
    baseUrl: import.meta.env.BASE_URL,
    onStatus: text => {
      const active = activeRef.current;
      if (!disposedRef.current && active?.scope === scopeRef.current) setMessage(englishAudioStatus(text));
    },
    onEvent: (event, id) => {
      const active = activeRef.current;
      if (disposedRef.current || !active || active.id !== id || active.scope !== scopeRef.current) return;
      setPending(null);
      if (event === 'started') setPlaying(active.purpose);
      else {
        setPlaying(null);
        if (event === 'error') setFailed(true);
        else endedRef.current?.(active.purpose);
      }
    },
  }));
  function stop() {
    activeRef.current = null;
    player.stop();
    setPending(null); setPlaying(null); setMessage(''); setFailed(false);
  }
  function play(id: string, purpose: AudioPurpose) {
    if (disposedRef.current) return;
    activeRef.current = { scope: scopeRef.current, id, purpose };
    setFailed(false); setPlaying(null); setPending(purpose);
    player.play(id);
  }
  useEffect(() => {
    disposedRef.current = false;
    return () => { disposedRef.current = true; activeRef.current = null; player.stop(); };
  }, [player]);
  useEffect(() => { stop(); }, [scope, player]);
  return { play, stop, playing, pending, message, failed };
}

function DiscoveryMenu({ teacher = false, onExit }: Pick<Props, 'teacher' | 'onExit'>) {
  const [paused, setPaused] = useState(false);
  const audio = useLabAudio('discovery-menu');
  function back() { audio.stop(); if (onExit) onExit(); else window.location.hash = '/'; }
  return <section className="english-learning-lab ell-menu" data-phase="menu" data-teacher={teacher} lang="en">
    <header className="ell-header">
      <button className="ell-button ell-back" onClick={back}><ArrowLeft size={19} />Back</button>
      <div className="ell-menu-heading"><span className="ell-eyebrow">ENGLISH DISCOVERY</span><h1>Pick a little story.</h1></div>
      <div className="ell-header-tools">
        <button className="ell-button ell-guide" aria-label="Guide" disabled={paused || audio.pending === 'guide' || audio.playing === 'guide'} onClick={() => { if (!paused) audio.play(labGuideAudioId, 'guide'); }}><Headphones size={19} /><span>Guide</span></button>
        <button className="ell-button ell-pause" aria-label={paused ? 'Continue' : 'Pause'} onClick={() => { audio.stop(); setPaused(value => !value); }}>{paused ? <Play size={19} /> : <Pause size={19} />}<span>{paused ? 'Continue' : 'Pause'}</span></button>
      </div>
    </header>
    {paused ? <div className="ell-rest"><Pause size={42} /><h2>A little break.</h2><p>Come back when you are ready.</p></div> : <div className="ell-lesson-menu">
      {englishLabLessons.map(lesson => <a className="ell-lesson-card" key={lesson.id} href={`#/english-lab/${lesson.id}${teacher ? '/teacher' : ''}`} data-lesson-link={lesson.id} onClick={() => audio.stop()}>
        <div className="ell-cover"><EnglishLabScene visual={lesson.cover} playing paused={paused} decorative /></div>
        <div className="ell-lesson-caption"><span className="ell-eyebrow">A LITTLE STORY</span><h2>{lesson.title}</h2><p>{lesson.subtitle}</p><span className="ell-open">Let’s go <ArrowRight size={18} /></span></div>
      </a>)}
    </div>}
    <footer className="ell-dock" data-lab-dock>
      <div className="ell-dock-copy"><Headphones size={22} /><div><p>{paused ? 'Ready to look and listen?' : 'Listen. Look. Choose.'}</p><span className={audio.failed ? 'ell-audio-status is-error' : 'ell-audio-status'} role="status">{teacher ? 'Teacher view' : audio.message || 'Three little stories to try.'}</span></div></div>
      {paused ? <button className="ell-button ell-primary" onClick={() => setPaused(false)}><Play size={19} />Continue</button> : null}
    </footer>
  </section>;
}

function LessonSession({ lesson, teacher = false, reviewLexemeIds, onAttempt, onExit }: Props & { lesson: LabLesson }) {
  const review = reviewLexemeIds !== undefined;
  const reviewKey = reviewLexemeIds?.join('\0');
  const steps = useMemo<LabStep[]>(() => {
    const questions = makeLabQuestions(lesson, reviewKey === undefined ? undefined : reviewKey ? reviewKey.split('\0') : []);
    return [...(review ? [] : lesson.demos.map(demo => ({ kind: 'demo' as const, id: demo.id, demo }))),
      ...questions.map(question => ({ kind: 'question' as const, id: question.id, question }))];
  }, [lesson, reviewKey, review]);
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(false);
  const [paused, setPaused] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helped, setHelped] = useState(false);
  const heardRef = useRef(false);
  const lockedRef = useRef(false);
  const advancingRef = useRef(false);
  const recordedRef = useRef(new Set<string>());
  const helpedRef = useRef(new Set<string>());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const helpTriggerRef = useRef<HTMLButtonElement>(null);
  const listenRef = useRef<HTMLButtonElement>(null);
  const focusListenRef = useRef(false);
  const step = steps[index];
  const audio = useLabAudio(`${lesson.id}:${step?.id ?? 'finished'}`, purpose => {
    if (step && purpose === (step.kind === 'demo' ? 'demo' : 'prompt')) {
      heardRef.current = true;
      setHeard(true);
    }
  });
  const question = step?.kind === 'question' ? step.question : undefined;
  const demo = step?.kind === 'demo' ? step.demo : undefined;
  const phase = question?.phase ?? 'learn';
  const assisted = question?.phase === 'guided' || helped || retrying;
  const revealed = question?.phase === 'guided' || retrying || Boolean(feedback);
  const soundBusy = audio.playing ?? audio.pending;
  const canAdvance = !paused && !!step && (demo ? heard : Boolean(feedback?.correct || feedback?.isRetry));

  useEffect(() => {
    heardRef.current = false; lockedRef.current = false; advancingRef.current = false;
    setHeard(false); setPaused(false); setFeedback(null); setRetrying(false); setHelpOpen(false);
    setHelped(step ? helpedRef.current.has(step.id) : false);
  }, [step?.id]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (helpOpen && !dialog.open) dialog.showModal();
    else if (!helpOpen && dialog.open) dialog.close();
  }, [helpOpen, step?.id]);
  useEffect(() => {
    if (focusListenRef.current && !paused && listenRef.current) {
      focusListenRef.current = false;
      listenRef.current.focus({ preventScroll: true });
    }
  }, [step?.id, retrying, paused]);

  function play(id: string, purpose: AudioPurpose) { if (!paused) audio.play(id, purpose); }
  function leave() {
    audio.stop();
    if (onExit) onExit(); else window.location.hash = '/english-lab';
  }
  function advance() {
    if (!canAdvance || advancingRef.current || lockedRef.current && !feedback) return;
    advancingRef.current = true;
    audio.stop(); lockedRef.current = true; heardRef.current = false;
    setHeard(false); setFeedback(null); setRetrying(false); setHelpOpen(false);
    focusListenRef.current = true;
    setIndex(value => value + 1);
  }
  function choose(choiceId: string) {
    if (!question || !heardRef.current || paused || helpOpen || feedback || lockedRef.current) return;
    if (!question.options.some(option => option.id === choiceId)) return;
    lockedRef.current = true;
    audio.stop();
    const firstAnswer = !recordedRef.current.has(question.id);
    setFeedback({ choiceId, correct: choiceId === question.correctOptionId, isRetry: !firstAnswer });
    if (firstAnswer) {
      recordedRef.current.add(question.id);
      if (!teacher) onAttempt?.(makeLabAttempt(lesson.id, question, choiceId,
        helpedRef.current.has(question.id) || retrying, review));
    }
  }
  function retry() {
    if (!question || !feedback || paused) return;
    audio.stop(); lockedRef.current = false;
    helpedRef.current.add(question.id); setHelped(true);
    setRetrying(true); setFeedback(null); setHelpOpen(false);
    focusListenRef.current = true;
  }
  function openHelp() {
    if (!step || paused) return;
    audio.stop();
    if (question) { helpedRef.current.add(question.id); setHelped(true); }
    setHelpOpen(true);
  }
  function closeHelp() {
    audio.stop(); dialogRef.current?.close(); setHelpOpen(false);
    helpTriggerRef.current?.focus({ preventScroll: true });
  }
  function togglePause() { audio.stop(); setPaused(value => !value); }

  if (!step) return <section className="english-learning-lab ell-finished" data-lesson-id={lesson.id} data-phase="finished" data-review={review} data-teacher={teacher} lang="en">
    <div className="ell-finish-art"><EnglishLabScene visual={lesson.cover} playing decorative /></div>
    <span className="ell-eyebrow">{review ? 'A LITTLE REVIEW' : 'A LITTLE STORY'}</span>
    <h1>{steps.length ? 'Great work!' : 'All done for now.'}</h1>
    <p>{steps.length ? 'You looked, listened and tried.' : 'There are no pictures to practise here today.'}</p>
    {teacher ? <p className="ell-teacher-note">Teacher view · No learning records.</p> : null}
    <button className="ell-button ell-primary" onClick={leave}>{onExit ? 'Back' : 'Choose a story'}<ArrowRight size={19} /></button>
  </section>;

  const answerText = demo?.text ?? question!.answerText;
  const stepAudioId = demo?.audioId ?? question!.audioId;
  const purpose = demo ? 'demo' : 'prompt';
  const helpZh = demo?.helpZh ?? question!.helpZh;
  return <section className={`english-learning-lab ell-session ${demo ? 'ell-is-learning' : 'ell-is-question'} ${question?.contextVisual ? 'ell-has-context' : ''}`} data-lesson-id={lesson.id} data-step-id={step.id} data-phase={phase} data-heard={heard} data-assisted={assisted} data-review={review} data-teacher={teacher} data-paused={paused} lang="en">
    <header className="ell-header">
      <button className="ell-button ell-back" onClick={leave}><ArrowLeft size={19} />Back</button>
      <div className="ell-route">
        <nav className="ell-phase-track" aria-label="Lesson steps">{phases.filter(item => !review || item !== 'learn' && item !== 'guided').map(item => <span key={item} className={item === phase ? 'is-current' : ''} aria-current={item === phase ? 'step' : undefined}>{phaseNames[item]}</span>)}</nav>
        <p className="ell-lesson-title">{teacher ? 'Teacher view' : phase === 'check' || phase === 'transfer' ? 'Listen and choose' : lesson.title}<span>{index + 1} / {steps.length}</span></p>
      </div>
      <div className="ell-header-tools"><button className="ell-button ell-guide" aria-label="Guide" disabled={paused || soundBusy === 'guide'} onClick={() => play(labGuideAudioId, 'guide')}><Headphones size={19} /><span>Guide</span></button><button className="ell-button ell-pause" aria-label={paused ? 'Continue' : 'Pause'} onClick={togglePause}>{paused ? <Play size={19} /> : <Pause size={19} />}<span>{paused ? 'Continue' : 'Pause'}</span></button></div>
    </header>
    {paused ? <div className="ell-rest"><Pause size={42} /><h1>A little break.</h1><p>Come back when you are ready.</p></div> : demo ? <div className="ell-learn-layout">
      <div className="ell-demo-scene"><EnglishLabScene visual={demo.visual} playing={audio.playing === 'demo'} paused={helpOpen} /></div>
      <div className="ell-demo-copy"><span className="ell-eyebrow">LOOK AND LISTEN</span><h1 className="ell-answer-text">{demo.text}</h1><p>Listen, then say it.</p><button ref={listenRef} className="ell-button ell-primary ell-listen" data-action="listen-demo" disabled={soundBusy === 'demo'} onClick={() => play(demo.audioId, 'demo')}><Volume2 size={23} />{soundBusy === 'demo' ? 'Listening…' : heard ? 'Listen again' : 'Listen'}</button></div>
    </div> : <div className="ell-question-layout">
      <div className="ell-task-panel">
        {question!.contextVisual ? <div className="ell-context-scene"><EnglishLabScene visual={question!.contextVisual} playing={audio.playing === 'prompt'} paused={helpOpen} /></div> : <Headphones className="ell-task-icon" size={46} />}
        <div className="ell-task-copy"><span className="ell-eyebrow">{phaseNames[phase]}</span><h1>Listen.<br />{' '}Choose a picture.</h1>{question!.contextText ? <p className="ell-context-text">{question!.contextText}</p> : null}
          {revealed ? <p className="ell-answer-text">{question!.answerText}</p> : null}
          <div className="ell-listen-row"><button ref={listenRef} className="ell-button ell-primary ell-listen" data-action="listen-prompt" disabled={soundBusy === 'prompt'} onClick={() => play(question!.audioId, 'prompt')}><Volume2 size={23} />{soundBusy === 'prompt' ? 'Listening…' : heard ? 'Listen again' : 'Listen'}</button><button className="ell-button ell-instruction" data-action="listen-instruction" aria-label="Hear the instructions" disabled={soundBusy === 'instruction'} onClick={() => play(labInstructionAudioId, 'instruction')}><HelpCircle size={20} /></button></div>
        </div>
      </div>
      <div className="ell-options" aria-label="Choose a picture">{question!.options.map((option, optionIndex) => {
        const hint = (question!.phase === 'guided' || retrying) && option.id === question!.correctOptionId;
        const selected = feedback?.choiceId === option.id;
        return <article className={`ell-option ${hint ? 'has-hint' : ''} ${selected ? feedback?.correct ? 'is-correct' : 'is-try-again' : ''}`} key={option.id} data-option-id={option.id} data-hint={hint}>
          <span className="ell-option-number" aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
          <div className="ell-option-scene"><EnglishLabScene visual={option.visual} playing paused={helpOpen} decorative /></div>
          {hint ? <p className="ell-guided-answer">{question!.answerText}</p> : <div className="ell-option-spacer" />}
          <button className="ell-button ell-choose" data-action="choose" disabled={!heard || Boolean(feedback)} aria-label={`Choose picture ${String.fromCharCode(65 + optionIndex)}`} onClick={() => choose(option.id)}>{hint ? <Check size={18} /> : null}Choose<ArrowRight size={17} /></button>
        </article>;
      })}</div>
    </div>}
    <footer className="ell-dock" data-lab-dock>
      <div className="ell-dock-copy">{feedback?.correct ? <Check size={23} /> : <Headphones size={23} />}<div>
        <p className="ell-feedback-title">{paused ? 'Ready to listen?' : feedback ? feedback.correct ? 'Great!' : 'Let’s try again.' : demo ? heard ? 'Now try saying it.' : 'Listen first.' : retrying ? 'Try again. This is practice.' : heard ? 'Choose a picture.' : 'Listen first.'}</p>
        <span className={audio.failed ? 'ell-audio-status is-error' : 'ell-audio-status'} role="status">{audio.message || (feedback ? answerText : question?.phase === 'guided' ? 'Look at the hint.' : 'Listen. Look. Choose.')}</span>
      </div></div>
      <div className="ell-dock-actions">{paused ? <button className="ell-button ell-primary" onClick={togglePause}><Play size={19} />Continue</button> : <>
        {feedback && !feedback.correct ? <button className="ell-button ell-retry" aria-label="Try again" onClick={retry}><RotateCcw size={18} /><span>Try again</span></button> : null}
        <button className="ell-button ell-primary ell-next" aria-label="Next" disabled={!canAdvance} onClick={advance}>Next<ArrowRight size={19} /></button>
        <button ref={helpTriggerRef} className="ell-button ell-help" aria-label="Help" onClick={openHelp}><HelpCircle size={20} /><span>Help</span></button>
      </>}</div>
    </footer>
    <dialog ref={dialogRef} className="ell-help-dialog" aria-label="Help" onCancel={event => { event.preventDefault(); closeHelp(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeHelp(); } }}>
      <header><h2>Help</h2><button className="ell-button ell-help-close" aria-label="Close help" onClick={closeHelp} autoFocus><X size={20} /><span>Back</span></button></header>
      {helpOpen ? <div className="ell-help-content"><span className="ell-eyebrow">CHINESE HELP</span><p className="ell-help-translation" lang="zh-CN">{helpZh}</p><p className="ell-help-answer" lang="en">{answerText}</p><button className="ell-button ell-primary" data-action="listen-help" disabled={soundBusy === 'help'} onClick={() => play(stepAudioId, 'help')}><Volume2 size={22} />{soundBusy === 'help' ? 'Listening…' : 'Listen'}</button><p className="ell-help-note">Listen, then try saying it.</p></div> : null}
      <footer role="status">{audio.message || 'Take your time.'}</footer>
    </dialog>
  </section>;
}

export default function EnglishLearningLab(props: Props) {
  const lesson = getEnglishLabLesson(props.lessonId);
  if (!lesson) return <DiscoveryMenu teacher={props.teacher} onExit={props.onExit} />;
  const sessionKey = `${lesson.id}:${props.teacher ? 'teacher' : 'child'}:${props.reviewLexemeIds?.join('\0') ?? 'learn'}`;
  return <LessonSession key={sessionKey} {...props} lesson={lesson} />;
}
