import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Pencil, RotateCcw } from 'lucide-react';
import { getLessonPaperWords, lessonCourseById } from '../data/chineseLessons';
import { readPaperChecks, savePaperCheck } from '../lib/chineseLessonPaper';
import { notifyChineseRecordsChanged } from '../lib/chineseLearningRecords';
import './chineseLessonPaperPanel.css';

/** A paper check shared by the established illustrated lessons, independent of their reading tools. */
export default function ChineseLessonPaperPanel({ courseId, teacher = false, onIndependentChange }: { courseId: string; teacher?: boolean; onIndependentChange?: (independent: boolean) => void }) {
  const course = lessonCourseById.get(courseId)!;
  const words = getLessonPaperWords(course);
  const [type, setType] = useState<'words' | 'memory'>(words.length ? 'words' : 'memory');
  const [page, setPage] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [adult, setAdult] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [lastCheck, setLastCheck] = useState(() => {
    if (teacher) return undefined;
    try { return readPaperChecks(localStorage).filter(item => item.courseId === courseId).at(-1); } catch { return undefined; }
  });
  const bank = type === 'words' ? words : course.writing.map(item => ({ id: item.lexemeId, text: item.text, pinyin: '' }));
  const items = bank.slice(page * 6, page * 6 + 6);
  const pageCount = Math.max(1, Math.ceil(bank.length / 6));
  const independent = !revealed && (type === 'words' || hidden);
  useEffect(() => { onIndependentChange?.(independent); return () => onIndependentChange?.(false); }, [independent, onIndependentChange]);

  function reset() { setHidden(false); setRevealed(false); setErrors([]); setAdult(false); setSaved(false); setMessage(''); }
  function changeType(next: 'words' | 'memory') { setType(next); setPage(0); reset(); }
  function save() {
    if (teacher || !revealed || !items.length) return;
    const check = { courseId, at: new Date().toISOString(), type, targetIds: items.map(item => item.id), needsPractice: errors, adult };
    try {
      savePaperCheck(localStorage, check); setLastCheck(check); setSaved(true);
      notifyChineseRecordsChanged();
      setMessage(`${adult ? '大人核对' : '自查'}已保存；只记录这次纸稿检查。`);
    } catch { setMessage('浏览器没有保存记录，可以把需要再练的内容记在纸上。'); }
  }

  return <div className="clp-paper" data-phase={revealed ? 'review' : hidden ? 'hidden' : 'ready'}>
    <header className="clp-heading"><div><span>取出纸笔，先独立尝试</span><h2>{type === 'words' ? '看拼音，在纸上写词语' : '记住字，再独立写'}</h2></div><div className="clp-types" role="group" aria-label="纸笔检查类型">{words.length > 0 && <button className={type === 'words' ? 'is-active' : ''} aria-pressed={type === 'words'} onClick={() => changeType('words')}>拼音写词</button>}<button className={type === 'memory' ? 'is-active' : ''} aria-pressed={type === 'memory'} onClick={() => changeType('memory')}>记字再写</button></div></header>
    {!revealed ? <div className="clp-writing"><div className="clp-grid">{items.map((item, index) => <div key={item.id}><span>{page * 6 + index + 1}</span><strong>{type === 'words' ? item.pinyin : hidden ? '□' : item.text}</strong><div className="clp-squares">{[...item.text].map((_, offset) => <i key={offset} />)}</div></div>)}</div><div className="clp-actions"><p>{type === 'memory' && !hidden ? '看清字形，再遮住，在纸上自己写。' : '在纸上尝试以后，再展开核对。'}</p><button className="kf-primary" onClick={() => type === 'memory' && !hidden ? setHidden(true) : setRevealed(true)}>{type === 'memory' && !hidden ? <><EyeOff size={18} />遮住字，开始写</> : <><Eye size={18} />展开，核对纸稿</>}</button></div></div>
      : <div className="clp-review"><div className="clp-answers"><span>对照自己的纸稿</span>{items.map((item, index) => <p key={item.id}><small>{page * 6 + index + 1}</small><strong>{item.text}</strong><span>{item.pinyin}</span></p>)}<button className="kf-text-button" onClick={reset}><RotateCcw size={16} />重新写这一组</button></div><div className="clp-checks"><strong>哪些内容还要再练？</strong><div>{items.map(item => <label key={item.id}><input type="checkbox" checked={errors.includes(item.id)} onChange={() => { setErrors(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id]); setSaved(false); setMessage(''); }} />{item.text}</label>)}</div>{!teacher && <><label className="clp-adult"><input type="checkbox" checked={adult} onChange={event => { setAdult(event.target.checked); setSaved(false); setMessage(''); }} />大人已查看纸稿</label><button className="kf-primary" onClick={save} disabled={saved}>{saved ? '本次已保存' : '保存这次纸稿检查'}<Check size={17} /></button></>}<p role="status">{message || (teacher ? '投屏不读取或保存个人记录。' : '自查与大人核对分开记录，不产生掌握分数。')}</p></div></div>}
    <footer className="clp-footer"><p><Pencil size={15} />{teacher ? '可以用纸稿共同讨论，投屏不写个人记录。' : lastCheck ? `上次${lastCheck.adult ? '大人核对' : '自查'} · ${lastCheck.needsPractice.length ? '有内容要再练' : '当次未标记错误'}` : '写过再核对，选择正确不等于会写。'}</p>{pageCount > 1 && <div role="group" aria-label="选择纸笔练习组">{Array.from({ length: pageCount }, (_, index) => <button key={index} aria-pressed={page === index} className={page === index ? 'is-active' : ''} onClick={() => { setPage(index); reset(); }}>第{index + 1}组</button>)}</div>}</footer>
  </div>;
}
