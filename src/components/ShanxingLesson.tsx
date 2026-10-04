import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ExternalLink, Eye, EyeOff, Feather, Leaf, Pause, Pencil, Printer, Volume2, X } from 'lucide-react';
import { shanxing, shanxingChecks, shanxingSources, shanxingWords } from '../data/shanxingLesson';
import { createChinesePilotAudioPlayer } from '../lib/chinesePilotAudio';
import ShanxingScene from './ShanxingScene';
import './shanxingLesson.css';

type Mode = 'read' | 'words' | 'recite' | 'write';
type Mask = 'full' | 'clue' | 'hidden';
type PaperCheck = { at: string; adult: boolean; errors: string[] };
const paperKey = 'fanfan-shanxing:paper-check:v1';
const modes: { id: Mode; label: string; icon: typeof Leaf }[] = [
  { id: 'read', label: '看懂诗', icon: Leaf }, { id: 'words', label: '字词', icon: BookOpen },
  { id: 'recite', label: '背下来', icon: EyeOff }, { id: 'write', label: '默写', icon: Pencil },
];

function loadPaperCheck(): PaperCheck | null {
  try {
    const value = JSON.parse(localStorage.getItem(paperKey) || 'null');
    if (value && typeof value.at === 'string' && Number.isFinite(Date.parse(value.at)) && typeof value.adult === 'boolean'
      && Array.isArray(value.errors) && value.errors.every((e: unknown) => typeof e === 'string' && ['glyph', 'missing', 'punctuation'].includes(e))) return value;
  } catch { /* Private browsing may not provide storage. */ }
  return null;
}

function PoemLines({ pinyin, selected, mask, onSelect }: { pinyin: boolean; selected: number; mask: Mask; onSelect: (index: number) => void }) {
  return <div className={`shan-poem-lines shan-mask-${mask}`}>
    {shanxing.lines.map((line, index) => <button className={`shan-poem-line ${selected === index ? 'is-selected' : ''}`} key={line.id}
      aria-label={mask === 'full' ? `第${index + 1}句：${line.text}` : `第${index + 1}句的画面`} aria-pressed={selected === index} onClick={() => onSelect(index)}>
      <span className="shan-line-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <span className="shan-line-text">{mask === 'hidden' ? <span className="shan-hidden-line">看画面，想起这一句</span> : mask === 'clue' ? <span className="shan-clue-line">{line.clue}</span>
        : [...line.text].map((character, i) => /\p{Script=Han}/u.test(character) && pinyin
          ? <ruby key={i}>{character}<rt>{line.pinyin.split(' ')[i]}</rt></ruby> : <span key={i}>{character}</span>)}</span>
    </button>)}
  </div>;
}

export default function ShanxingLesson() {
  const [mode, setMode] = useState<Mode>('read');
  const [selected, setSelected] = useState(0);
  const [pinyin, setPinyin] = useState(false);
  const [mask, setMask] = useState<Mask>('clue');
  const [wordIndex, setWordIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [adult, setAdult] = useState(false);
  const [lastCheck, setLastCheck] = useState<PaperCheck | null>(loadPaperCheck);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [audioStatus, setAudioStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const resourceTrigger = useRef<HTMLButtonElement>(null);
  const player = useRef<ReturnType<typeof createChinesePilotAudioPlayer> | null>(null);
  const playback = useRef<{ index: number; all: boolean } | null>(null);

  useEffect(() => {
    const oldTitle = document.title;
    document.title = '山行 · 一课体验';
    return () => { document.title = oldTitle; playback.current = null; player.current?.stop(); };
  }, []);

  function stopAudio() { playback.current = null; player.current?.stop(); setPlaying(false); setAudioStatus(''); }
  function audioPlayer() {
    player.current ??= createChinesePilotAudioPlayer({ baseUrl: import.meta.env.BASE_URL, onStatus: setAudioStatus, onEvent(event) {
      if (event === 'started') setPlaying(true);
      if (event === 'error') { playback.current = null; setPlaying(false); }
      if (event === 'ended') {
        const next = playback.current;
        if (next?.all && next.index < 3) {
          next.index += 1; setSelected(next.index);
          player.current?.play(shanxing.lines[next.index].audioId);
        } else { playback.current = null; setPlaying(false); setAudioStatus('读一遍，再用自己的话说说诗意。'); }
      }
    } });
    return player.current;
  }
  function play(all: boolean) {
    stopAudio();
    const index = all ? 0 : selected;
    playback.current = { index, all }; setSelected(index); audioPlayer().play(shanxing.lines[index].audioId);
  }
  function selectLine(index: number) { stopAudio(); setSelected(index); }
  function changeMode(next: Mode) { stopAudio(); if (next === 'write' && mode !== 'write') resetPaper(); setMode(next); }
  function toggleError(id: string) {
    setSaved(false); setSaveMessage('');
    setErrors(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function saveCheck() {
    const value: PaperCheck = { at: new Date().toISOString(), adult, errors: [...errors] };
    setLastCheck(value); setSaved(true);
    try { localStorage.setItem(paperKey, JSON.stringify(value)); setSaveMessage(adult ? '已保存大人核对的纸稿结果。' : '已保存本次自查；可以请大人再看看纸稿。'); }
    catch { setSaveMessage('本次检查已完成，但这个浏览器暂时不能保存记录。'); }
  }
  function resetPaper() { setRevealed(false); setErrors(new Set()); setAdult(false); setSaved(false); setSaveMessage(''); }
  const line = shanxing.lines[selected];
  const word = shanxingWords[wordIndex];
  const nextMode: Record<Mode, Mode> = { read: 'words', words: 'recite', recite: 'write', write: 'read' };
  const nextText = { read: '看看字词', words: '试着背一背', recite: '去纸上默写', write: '再看诗景' };
  const footerText = { read: '点一句诗，看看它写的画面。', words: '读准字音，再试着组一个词。', recite: '不用背译文，能说清意思就好。', write: '准备纸和笔，合上课本再写。' };

  return <main className="shan-lesson" data-mode={mode}>
    <header className="shan-head">
      <a className="shan-back" href="#/map/chinese" aria-label="返回语文课程"><ArrowLeft size={20} /><span>语文</span></a>
      <div className="shan-heading"><span className="shan-eyebrow">诗画课堂 · 三上第4课</span><h1>山行 <span>唐 · 杜牧</span></h1></div>
      <button className="shan-resource-button" ref={resourceTrigger} onClick={() => { stopAudio(); dialog.current?.showModal(); }}><BookOpen size={19} /><span>资料与指导</span></button>
    </header>

    <nav className="shan-tabs" aria-label="这一课的学习内容">{modes.map(({ id, label, icon: Icon }) => <button key={id} aria-current={mode === id ? 'page' : undefined} className={mode === id ? 'is-active' : ''} onClick={() => changeMode(id)}><Icon size={19} />{label}</button>)}</nav>

    <section className={`shan-panel shan-panel-${mode}`} aria-label={modes.find(m => m.id === mode)!.label}>
      {(mode === 'read' || mode === 'recite') && <>
        <div className="shan-art"><div className="shan-art-caption"><Leaf size={16} />{mode === 'recite' ? '让画面帮你想起诗句' : '一幅秋景，藏着四句诗'}</div><ShanxingScene focus={selected} /><div className="shan-scene-caption"><span className="shan-scene-dot" />{line.focus}<span>诗意插画</span></div></div>
        <div className="shan-reading">
          <div className="shan-reading-top"><h2>{mode === 'read' ? '读一读，看一看' : '把这首诗记在心里'}</h2>{mode === 'read' && <button className={`shan-pinyin-toggle ${pinyin ? 'is-active' : ''}`} aria-pressed={pinyin} onClick={() => setPinyin(!pinyin)}>拼音</button>}</div>
          {mode === 'recite' && <div className="shan-mask-controls" role="group" aria-label="背诵提示">{([{ id: 'full', label: '看全文' }, { id: 'clue', label: '留线索' }, { id: 'hidden', label: '只看画面' }] as const).map(item => <button key={item.id} aria-pressed={mask === item.id} className={mask === item.id ? 'is-active' : ''} onClick={() => { stopAudio(); setMask(item.id); }}>{item.label}</button>)}</div>}
          <PoemLines pinyin={mode === 'read' && pinyin} selected={selected} mask={mode === 'read' ? 'full' : mask} onSelect={selectLine} />
          <div className="shan-audio-tools"><button className="shan-audio-button" onClick={() => playing ? stopAudio() : play(true)}>{playing ? <Pause size={18} /> : <Volume2 size={18} />}{playing ? '停止朗读' : '听全诗'}</button><button className="shan-line-audio" onClick={() => play(false)}><Volume2 size={17} />听这一句</button></div>
          {mode === 'read' ? <div className="shan-meaning" aria-live="polite"><span>这句诗写的是</span><p>{line.meaning}</p><small>{line.note}</small></div>
            : <div className="shan-recitation-note"><p>先看画面背一遍，再点“看全文”核对。</p><span>哪一句忘了，就点它旁边的序号看画面。</span></div>}
          <p className="shan-audio-status" role="status">{audioStatus || '朗读为合成练习示范。'}</p>
        </div>
      </>}

      {mode === 'words' && <>
        <div className="shan-word-study"><span className="shan-eyebrow">这首诗里的五个会写字</span><div className="shan-word-tabs" role="group" aria-label="选择生字">{shanxingWords.map((item, index) => <button key={item.character} aria-pressed={wordIndex === index} className={wordIndex === index ? 'is-active' : ''} onClick={() => setWordIndex(index)}>{item.character}</button>)}</div>
          <div className="shan-character-card"><ruby>{word.character}<rt>{word.pinyin}</rt></ruby><div><span>在诗中</span><strong>{word.context}</strong></div></div>
          <div className="shan-word-examples"><span>可以这样组词</span><strong>{word.words.join(' · ')}</strong></div>
          <p className="shan-word-tip">{word.tip}</p><p className="shan-shape-tip"><Pencil size={18} />{word.shape}</p>
        </div>
        <div className="shan-word-checks"><div><span className="shan-eyebrow">写诗句时留意这两个字</span><h2>生，还是深？坐，还是座？</h2></div>
          {shanxingChecks.map(item => <div className="shan-spelling-check" key={item.id}><p>{item.prompt}</p><div className="shan-spelling-options">{item.options.map(option => <button key={option} aria-pressed={choices[item.id] === option} className={choices[item.id] === option ? option === item.answer ? 'is-right' : 'is-wrong' : ''} onClick={() => setChoices(current => ({ ...current, [item.id]: option }))}>{option}{choices[item.id] === option && option === item.answer && <Check size={18} />}</button>)}</div><div className="shan-choice-feedback" role="status">{choices[item.id] && <><strong>{choices[item.id] === item.answer ? '选对了。' : '再看清原句。'}</strong>{item.reason}</>}</div></div>)}
          <p className="shan-check-note">在纸上写写“{word.words[0]}”，看看这个字能不能独立写出来。</p>
        </div>
      </>}

      {mode === 'write' && <div className="shan-paper-panel">
        {!revealed ? <><div className="shan-paper-title"><Feather size={24} /><div><h2>合上课本，写下《山行》</h2><p>四句诗都写出来，别忘了标点。</p></div></div><div className="shan-paper-rows" aria-hidden="true">{[0, 1, 2, 3].map(row => <div key={row}><span>{row + 1}</span>{Array.from({ length: 7 }, (_, i) => <i key={i} />)}<b>标点</b></div>)}</div><div className="shan-paper-bottom"><p>在纸上写，不用在屏幕上输入。</p><button className="shan-primary" onClick={() => setRevealed(true)}>写完了，核对 <Eye size={19} /></button></div>{lastCheck && <p className="shan-last-check">上次{lastCheck.adult ? '大人核对' : '自查'}：{new Date(lastCheck.at).toLocaleDateString('zh-CN')} · {lastCheck.errors.length ? '还有地方要再练' : '当次未标记错误'}</p>}</>
          : <><div className="shan-paper-title"><CheckCircle2 size={24} /><div><h2>对照纸稿，逐字核对</h2><p>先找错在哪里，再补写一次。</p></div><button className="shan-text-button" onClick={resetPaper}>重新默写</button></div><div className="shan-paper-review"><div className="shan-answer-poem">{shanxing.lines.map(item => <p key={item.id}>{item.text}</p>)}<span>留意：生处、坐爱、石径斜、霜叶，以及标点。</span></div><div className="shan-paper-checklist"><strong>纸稿里有哪些需要再练？</strong>{[{ id: 'glyph', label: '有错别字' }, { id: 'missing', label: '有漏字或漏句' }, { id: 'punctuation', label: '标点要改' }].map(item => <label key={item.id}><input type="checkbox" checked={errors.has(item.id)} onChange={() => toggleError(item.id)} />{item.label}</label>)}<label className="shan-adult-check"><input type="checkbox" checked={adult} onChange={e => { setAdult(e.target.checked); setSaved(false); setSaveMessage(''); }} />大人已查看纸稿</label><button className="shan-primary" disabled={saved} onClick={saveCheck}>{saved ? '本次已保存' : '保存本次检查'} <Check size={18} /></button><p className="shan-save-message" role="status">{saveMessage || '看着答案补写后，明天合上原文再试一次。'}</p></div></div></>}
      </div>}
    </section>

    <footer className="shan-footer"><p><span className="shan-footer-leaf"><Leaf size={17} /></span>{footerText[mode]}</p><button className="shan-primary" onClick={() => changeMode(nextMode[mode])}>{nextText[mode]}<ArrowRight size={19} /></button></footer>

    <dialog className="shan-dialog" ref={dialog} onClose={() => resourceTrigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <div className="shan-dialog-header"><h2>这一课怎么用</h2><button onClick={() => dialog.current?.close()} aria-label="关闭资料与指导"><X size={21} /></button></div>
      <div className="shan-dialog-body"><p>先说清诗意，再读熟、背诵，最后在纸上独立默写。已经会的部分可以直接跳过。</p><div className="shan-parent-prompts"><strong>大人只需要问这三个问题</strong><ol><li>这是哪个季节？你从诗中哪里看出来？</li><li>为什么停车？什么比什么更红？</li><li>合上原文，四句诗和标点能写对吗？</li></ol><p>前两项意思说对即可，不要求背译文；纸笔检查保留自查与大人核对的区别。</p></div>
        <button className="shan-print-button" onClick={() => window.print()}><Printer size={19} />打印一页练习纸</button>
        <h3>需要补听或看范写时</h3><div className="shan-source-list">{shanxingSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer"><div><strong>{source.title}<ExternalLink size={15} /></strong><p>{source.description}</p></div><ArrowRight size={18} /></a>)}</div>
        <div className="shan-source-note"><strong>内容依据</strong><p>教材：人教统编语文三年级上册，2025修订版；凡凡的纸本为2026印刷。原文、拼音和“背诵三首，默写《山行》”按同目录公开预览第14—15页核对，2026纸本内页仍待复核。</p><p>诗景、释义和练习为原创辅导整理；组词是辅导例子，不增加教材必写词。诗景中的房屋位置与车马是想象示意。课程与范写保留原站链接，未搬运其视频或课件。</p><p>中文朗读沿用现有合成练习音，不作为真人教师范读；记录只保存在当前浏览器，不计入原有游戏成绩。</p></div>
      </div>
    </dialog>

    <section className="shan-print" aria-hidden="true"><h1>《山行》一课练习</h1><p>姓名：____________　日期：____________</p><h2>一、先说一说</h2><p>什么季节？从诗中哪里看出来？诗人为什么停车？什么比什么更红？</p><h2>二、看拼音写词语</h2><div className="shan-print-words">{shanxingWords.map(item => <div key={item.character}><span>{({ 寒: 'hán lěng', 径: 'xiǎo jìng', 斜: 'qīng xié', 枫: 'fēng yè', 霜: 'qiū shuāng' } as Record<string, string>)[item.character]}</span><p>□ □</p></div>)}</div><h2>三、合上课本，默写四句诗，写上标点</h2><div className="shan-print-lines">{[1, 2, 3, 4].map(i => <p key={i}>________________________________________________________________</p>)}</div><h2>四、大人核对</h2><p>□ 字词要再练　□ 有漏字或漏句　□ 标点要改　□ 当次未发现错误</p><small>先独立写，再对照课本核对。“会选”与“会写”分开检查；明天可以再默写一次。</small></section>
  </main>;
}
