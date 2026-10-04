import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, Leaf, Presentation, Volume2 } from 'lucide-react';
import { pilotLessons, selectPilotRound, skillNames, wholePoemItems, type PilotLesson, type PilotSkill } from '../data/chinesePilot';
import { addPilotRound, independentlyWritten, loadPilotProgress, pilotReviews, savePilotProgress, importPilotProgress, type PilotAttempt, type PilotProgress } from '../lib/chinesePilotProgress';
import { createChinesePilotAudioPlayer } from '../lib/chinesePilotAudio';
import './chinesePilot.css';

function downloadRecord(progress: PilotProgress) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = '语文样板学习记录.json'; a.click(); URL.revokeObjectURL(url);
}
function usePilotVoice() {
  const [status, setStatus] = useState('');
  const player = useRef<ReturnType<typeof createChinesePilotAudioPlayer> | null>(null);
  useEffect(() => () => player.current?.stop(), []);
  return { status, stop: () => { player.current?.stop(); setStatus(''); }, play: (id: string) => {
    player.current ??= createChinesePilotAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setStatus }); player.current.play(id);
  } };
}
function path(lesson: PilotLesson, mode = 'home', teacher = false) { return `#/chinese-pilot/${lesson.courseId}/${mode}${teacher ? '/teacher' : ''}`; }
function Frame({ lesson, teacher, title, count, children, footer }: { lesson: PilotLesson; teacher: boolean; title: string; count?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return <section className="cn-stage">
    <header className="cn-stage-head"><a className="cn-exit" href={path(lesson, 'home', teacher)}><ArrowLeft size={20} /><span>返回本课</span></a><span>{teacher ? '课堂投屏 · ' : ''}第{lesson.lessonNumber}课 · {title}</span><b>{count ?? <Leaf size={22} />}</b></header>
    <div className="cn-stage-body">{children}</div><footer className="cn-dock">{footer ?? <span>先自己试一试，学会了就可以休息。</span>}</footer>
  </section>;
}

export default function ChinesePilot({ courseId, mode = 'home', teacher = false, taskId }: { courseId?: string; mode?: string; teacher?: boolean; taskId?: string }) {
  const [progress, setProgress] = useState(loadPilotProgress);
  const [notice, setNotice] = useState('');
  const [importCandidate, setImportCandidate] = useState<PilotProgress | null>(null);
  const lesson = pilotLessons.find(l => l.courseId === courseId);
  function record(attempts: PilotAttempt[]) {
    if (teacher) return;
    const next = addPilotRound(progress, attempts); setProgress(next);
    try { savePilotProgress(next); } catch (e) { setNotice(e instanceof Error ? e.message : '请导出记录。'); }
  }
  if (courseId === 'review') return <div className="cn-hub"><a className="back-link" href="#/map/chinese"><ArrowLeft size={18} />语文森林</a><h1>语文错项小册</h1><p>字音、辨字、组词辨认、纸写与诗句分别复习。今天刚订正的项目也保留，隔天再试。</p><div className="cn-review-list">{pilotReviews(progress).map(r => <a className="cn-review-row" key={r.taskId} href={`#/chinese-pilot/${r.courseId}/${['reading', 'glyph', 'grouping'].includes(r.skill) ? 'detective' : r.skill}/${encodeURIComponent(r.taskId)}`}><span className="cn-badge">{skillNames[r.skill]}</span><strong>{r.prompt}</strong><span>{r.due ? '今天复习' : `${r.dueDate.getMonth() + 1}/${r.dueDate.getDate()}再试`}</span><ArrowRight size={18} /></a>)}</div>{!pilotReviews(progress).length && <div className="cn-empty">暂时没有错项。完成一轮后，写错、选错和没写的题会来到这里。</div>}<div className="cn-backup"><button className="secondary" onClick={() => downloadRecord(progress)}><Download size={18} />导出语文记录</button><label className="secondary">选择备份文件<input type="file" accept="application/json,.json" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { setImportCandidate(importPilotProgress(await file.text())); setNotice('请核对下面的备份信息。'); } catch (err) { setImportCandidate(null); setNotice(err instanceof Error ? err.message : '导入失败，原记录保留。'); } e.target.value = ''; }} /></label></div>{importCandidate && <div className="cn-source-note"><strong>备份有{importCandidate.attempts.length}条；当前有{progress.attempts.length}条。</strong><p>确认后，备份会替换当前语文样板记录。可以先导出当前记录再恢复。</p><div className="cn-backup"><button className="secondary" onClick={() => setImportCandidate(null)}>取消</button><button className="primary" onClick={() => { try { savePilotProgress(importCandidate); setProgress(importCandidate); setImportCandidate(null); setNotice('语文备份已恢复。'); } catch (err) { setNotice(err instanceof Error ? err.message : '恢复失败，原记录保留。'); } }}>确认恢复备份</button></div></div>}<p className="cn-small">样板记录保存在当前浏览器；这份导出文件单独备份语文新练习。</p>{notice && <p role="status">{notice}</p>}</div>;
  if (!lesson) return <div className="cn-empty"><h1>这课样板还在准备</h1><a className="primary" href="#/chinese-plan">查看全学期清单</a></div>;
  const used = new Set(progress.attempts.map(a => a.taskId));
  if (mode === 'detective') return <Detective key={`${courseId}-${taskId ?? ''}`} lesson={lesson} teacher={teacher} taskId={taskId} used={used} onComplete={record} warning={notice} onExport={() => downloadRecord(progress)} />;
  if (['writing', 'recitation', 'dictation'].includes(mode)) return <PaperRound key={`${courseId}-${mode}-${taskId ?? ''}`} lesson={lesson} mode={mode as 'writing' | 'recitation' | 'dictation'} teacher={teacher} taskId={taskId} used={used} onComplete={record} warning={notice} onExport={() => downloadRecord(progress)} />;
  if (mode === 'study' || mode === 'poems') return <Study lesson={lesson} teacher={teacher} poems={mode === 'poems'} />;
  const completed = progress.attempts.filter(a => a.courseId === lesson.courseId);
  const written = new Set(completed.filter(independentlyWritten).map(a => a.taskId)).size;
  return <div className="cn-hub"><a className="back-link" href="#/map/chinese"><ArrowLeft size={18} />语文森林</a><div className="cn-hub-heading"><div><span className="eyebrow">汉字与诗句 · 第{lesson.lessonNumber}课</span><h1>{lesson.title}</h1><p>{teacher ? '投屏演示不会写入孩子的学习记录。' : '认识字音和字形，拿起笔试一试。每轮最多6题，做完一起核对。'}</p></div><span className="cn-seal">字</span></div><div className="cn-hub-actions">
    <a href={path(lesson, 'detective', teacher)}><span className="cn-card-symbol">辨</span><h2>汉字侦探</h2><p>字音、形近字和组词辨认</p><span>开始6题 <ArrowRight size={18} /></span></a>
    <a href={path(lesson, 'writing', teacher)}><span className="cn-card-symbol">写</span><h2>纸上小练笔</h2><p>看拼音或听词语，在纸上写</p><span>开始6题 <ArrowRight size={18} /></span></a>
    {lesson.recitationItems.length > 0 && <a href={path(lesson, 'recitation', teacher)}><span className="cn-card-symbol">忆</span><h2>诗句接力</h2><p>想起下一句，在纸上写下来</p><span>三首诗 · 6句 <ArrowRight size={18} /></span></a>}
    {wholePoemItems(lesson).length > 0 && <a href={path(lesson, 'dictation', teacher)}><span className="cn-card-symbol">默</span><h2>《山行》整首默写</h2><p>四句诗一次写完，再集中核对</p><span>教材默写要求 <ArrowRight size={18} /></span></a>}
  </div><div className="cn-hub-links"><a className="secondary" href={path(lesson, 'study', teacher)}><BookOpen size={18} />本课字词与组词参考</a>{lesson.recitationItems.length > 0 && <a className="secondary" href={path(lesson, 'poems', teacher)}>三首古诗原文与背诵</a>}<a className="secondary" href="#/chinese-pilot/review">错项小册</a><a className="secondary" href={path(lesson, 'home', !teacher)}><Presentation size={18} />{teacher ? '孩子练习' : '老师投屏'}</a><a className="secondary" href="#/chinese-plan">全学期清单</a></div><div className="cn-source-note"><strong>{lesson.courseId === 'cn-04' ? '三首都背诵；《山行》要求默写。另两首的补句属于练习。' : '6个会认字 · 12个会写字 · 11个教材词语。'}</strong><p>{lesson.recitation.requirementNote}</p><p>字音和字词据同目录新版公开预览核对；2026年纸本内页待复核。组词示例为原创练习，不穷尽正确答案。</p>{!teacher && <p>已练{new Set(completed.map(a => a.taskId)).size}项 · 大人核对过的独立纸写{written}项。选对题与自己核对不计入独立会写。</p>}</div></div>;
}

function Detective({ lesson, teacher, used, taskId, onComplete, warning, onExport }: { lesson: PilotLesson; teacher: boolean; used: Set<string>; taskId?: string; onComplete: (a: PilotAttempt[]) => void; warning: string; onExport: () => void }) {
  const [round] = useState(() => {
    const bank = taskId ? lesson.detectiveQuestions.filter(q => q.id === taskId) : lesson.detectiveQuestions;
    return selectPilotRound(bank, used).map(q => ({ ...q, options: selectPilotRound(q.options, new Set(), 3) }));
  });
  const [index, setIndex] = useState(0); const [choice, setChoice] = useState<string>();
  const [answers, setAnswers] = useState<PilotAttempt[]>([]); const [roundId] = useState(() => crypto.randomUUID());
  const q = round[index];
  function next() {
    if (!q || !choice) return;
    const a: PilotAttempt = { courseId: lesson.courseId, taskId: q.id, skill: q.kind, correct: choice === q.answerId, assisted: false, confirmedBy: 'auto', roundId, at: new Date().toISOString() };
    const nextAnswers = [...answers, a]; setAnswers(nextAnswers);
    if (index === round.length - 1) onComplete(nextAnswers);
    setIndex(index + 1); setChoice(undefined);
  }
  if (!q) return <Frame lesson={lesson} teacher={teacher} title="汉字侦探" footer={<a className="primary" href={path(lesson, 'home', teacher)}>回到本课 <ArrowRight size={18} /></a>}><div className="cn-result"><Leaf size={44} /><h1>这一轮完成了</h1><p>{answers.filter(a => a.correct).length} / {answers.length} 题第一次选对</p><p>这是字音、字形与组词辨认的记录。</p>{warning && <div role="alert"><p>{warning}</p><button className="secondary" onClick={onExport}>导出本轮记录</button></div>}<a className="secondary" href="#/chinese-pilot/review">看看错项小册</a></div></Frame>;
  return <Frame lesson={lesson} teacher={teacher} title="汉字侦探" count={`${index + 1} / ${round.length}`} footer={<><span>{choice ? '记住这个小发现，再往前走。' : '先想一想，选一个答案。'}</span><button className="primary" disabled={!choice} onClick={next}>{index === round.length - 1 ? '完成这一轮' : '下一题'} <ArrowRight size={20} /></button></>}><div className="cn-question"><span className="cn-badge">{skillNames[q.kind]}</span><h1>{q.prompt}</h1><div className="cn-options">{q.options.map(option => <button key={option.id} disabled={!!choice} className={`cn-option ${choice === option.id ? choice === q.answerId ? 'right' : 'wrong' : choice && option.id === q.answerId ? 'right' : ''}`} onClick={() => setChoice(option.id)}>{option.text}</button>)}</div><div className="cn-feedback" role="status">{choice && <><strong>{choice === q.answerId ? '发现了！' : '一起看清这个字。'}</strong><p>{q.explanation}</p></>}</div></div></Frame>;
}

function PaperRound({ lesson, teacher, mode, used, taskId, onComplete, warning, onExport }: { lesson: PilotLesson; teacher: boolean; mode: 'writing' | 'recitation' | 'dictation'; used: Set<string>; taskId?: string; onComplete: (a: PilotAttempt[]) => void; warning: string; onExport: () => void }) {
  const [round] = useState(() => {
    const bank = mode === 'writing' ? lesson.writingItems : mode === 'recitation' ? lesson.recitationItems : wholePoemItems(lesson);
    return selectPilotRound(taskId ? bank.filter(q => q.id === taskId) : bank, used);
  });
  const [index, setIndex] = useState(0); const [errors, setErrors] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set()); const [listening, setListening] = useState(false);
  const [adult, setAdult] = useState(false); const [finished, setFinished] = useState(false);
  const [roundId] = useState(() => crypto.randomUUID()); const voice = usePilotVoice();
  const q = round[index];
  function next(skip = false) { voice.stop(); if (skip && q) { setSkipped(s => new Set(s).add(q.id)); setErrors(s => new Set(s).add(q.id)); } setIndex(index + 1); }
  function finish() {
    voice.stop();
    onComplete(round.map(q => ({ courseId: lesson.courseId, taskId: q.id, skill: mode as PilotSkill, roundId, correct: !errors.has(q.id) && !skipped.has(q.id), assisted: skipped.has(q.id), confirmedBy: adult ? 'parent' : 'self', at: new Date().toISOString() })));
    setFinished(true);
  }
  const title = mode === 'writing' ? '纸上小练笔' : mode === 'recitation' ? '诗句接力' : '整首默写';
  if (finished) return <Frame lesson={lesson} teacher={teacher} title={title} footer={<a className="primary" href={path(lesson, 'home', teacher)}>回到本课 <ArrowRight size={20} /></a>}><div className="cn-result"><Check size={48} /><h1>核对好了</h1><p>{round.length - errors.size} / {round.length} 项写对 · {errors.size} 项需要再试</p><p>{teacher ? '本次为课堂演示。' : adult ? '大人核对过的纸写结果已记录。' : '已记录自己核对的练习；独立会写还需要大人查看纸稿。'}</p><p>看着答案补写是订正，隔天不看答案再试一次。</p>{warning && <div role="alert"><p>{warning}</p><button className="secondary" onClick={onExport}>导出本轮记录</button></div>}<a className="secondary" href="#/chinese-pilot/review">错项小册</a></div></Frame>;
  if (!round.length) return <Frame lesson={lesson} teacher={teacher} title={title}><div className="cn-empty">本课没有这一项练习。</div></Frame>;
  if (!q) return <Frame lesson={lesson} teacher={teacher} title="集中核对" count={`${round.length}项`} footer={<><label className="cn-confirm"><input type="checkbox" checked={adult} onChange={e => setAdult(e.target.checked)} />大人已查看揭晓前写好的纸稿</label><button className="primary" onClick={finish}>核对完成 <Check size={20} /></button></>}><div className="cn-check"><div className="cn-check-heading"><h1>对照纸稿，勾出错项</h1><p>错字、漏字、标点不对或没写，都勾选。有正确的另一种组词，请大人判断。</p></div><div className="cn-answer-list">{round.map((item, i) => <label className={`cn-answer-row ${errors.has(item.id) ? 'needs-review' : ''}`} key={item.id}><span>{i + 1}</span><strong>{item.answers.join(' / ')}</strong><span>{skipped.has(item.id) ? '没写' : '有错'}</span><input type="checkbox" checked={errors.has(item.id)} disabled={skipped.has(item.id)} onChange={e => setErrors(s => { const next = new Set(s); if (e.target.checked) next.add(item.id); else next.delete(item.id); return next; })} /></label>)}</div><p className="cn-small">词语核对每个字；古诗还要核对标点。原文已揭晓，接下来补写只算订正。</p></div></Frame>;
  return <Frame lesson={lesson} teacher={teacher} title={title} count={`${index + 1} / ${round.length}`} footer={<><button className="cn-skip" onClick={() => next(true)}>这题还不会</button><button className="primary" onClick={() => next()}>{index === round.length - 1 ? '我写完了，集中核对' : '写好了，下一题'} <ArrowRight size={20} /></button></>}><div className="cn-paper-question"><div className="cn-question-label"><span className="cn-badge">{mode === 'writing' ? q.sourceKind === 'textbook_word' ? '教材词表练习' : '生字组词练习' : q.dictationRequirement === 'textbook_required' ? '《山行》默写要求' : '古诗背诵练习'}</span>{mode === 'writing' && <label className="cn-listen-switch"><input type="checkbox" checked={listening} onChange={e => { voice.stop(); setListening(e.target.checked); }} />听写模式</label>}</div><h1>{q.prompt}</h1>{mode === 'writing' && !listening && <p className="cn-pinyin">{q.pinyin}</p>}{mode === 'writing' && <button className="cn-voice secondary" onClick={() => voice.play(q.audioId)}><Volume2 size={22} />听词语</button>}<div className={`cn-paper-guide ${mode === 'dictation' ? 'poem-guide' : ''}`} aria-hidden="true">{Array.from({ length: mode === 'dictation' ? 7 : mode === 'recitation' ? 7 : Math.min(4, q.answers[0].length) }, (_, i) => <span key={i} />)}</div><p>拿起笔，在纸上写。答案会在这一轮结束后一起出现。</p><p className="cn-audio-status" role="status">{voice.status}</p></div></Frame>;
}

function Study({ lesson, teacher, poems }: { lesson: PilotLesson; teacher: boolean; poems: boolean }) {
  const [category, setCategory] = useState<'recognition' | 'writing'>('recognition'); const [index, setIndex] = useState(0);
  const [examples, setExamples] = useState(false); const voice = usePilotVoice();
  const bank = category === 'recognition' ? lesson.recognitionCharacters : lesson.writingCharacters;
  const char = bank[index]; const poem = lesson.recitation.poems[index];
  return <Frame lesson={lesson} teacher={teacher} title={poems ? '三首古诗 · 背诵' : '字词与组词参考'} footer={<><span>{poems ? '读熟后，合上原文背一背。' : '另一种正确组词也可以，请大人核对。'}</span><a className="primary" href={path(lesson, poems ? 'recitation' : 'writing', teacher)}>去纸上试一试 <ArrowRight size={20} /></a></>}><div className="cn-study"><div className="cn-study-tabs">{poems ? lesson.recitation.poems.map((p, i) => <button className={i === index ? 'selected' : ''} key={p.id} onClick={() => { voice.stop(); setIndex(i); }}>{p.title}</button>) : <>{(['recognition', 'writing'] as const).map(c => <button key={c} className={c === category ? 'selected' : ''} onClick={() => { voice.stop(); setCategory(c); setIndex(0); setExamples(false); }}>{c === 'recognition' ? '会认字' : '会写字'}</button>)}</>}</div>{poems && poem ? <div className="cn-poem"><h1>{poem.title}</h1><span>{poem.dynasty} · {poem.author} · {poem.dictationRequirement === 'textbook_required' ? '背诵与默写' : '背诵'}</span>{poem.lines.map(l => <button key={l.id} onClick={() => voice.play(l.audioId)}><span>{l.text}</span><Volume2 size={19} /></button>)}</div> : char && <><div className="cn-character-tabs">{bank.map((c, i) => <button key={c.id} className={i === index ? 'selected' : ''} onClick={() => { voice.stop(); setIndex(i); setExamples(false); }}>{c.character}</button>)}</div><div className="cn-character-card"><div className="cn-character">{char.character}</div><div><p className="cn-pinyin">{char.pinyin}</p><p>{char.context}</p><button className="secondary" onClick={() => voice.play(char.audioId)}><Volume2 size={20} />听组词示范</button></div></div><div className="cn-grouping"><p>用“{char.character}”说一个词。先自己组，再看参考。</p><button className="secondary" onClick={() => setExamples(true)}>看看参考组词</button>{examples && <p className="cn-examples">{char.wordExamples.map(w => `${w.text}（${w.pinyin}）`).join(' · ')}</p>}</div></>}<p className="cn-audio-status" role="status">{voice.status}</p><p className="cn-small">中文为合成练习音；多音字请对照本课拼音，读音如有偏差以教材和老师为准。</p></div></Frame>;
}
