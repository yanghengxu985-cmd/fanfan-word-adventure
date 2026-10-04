import { useState } from 'react';
import { Check, RotateCcw, ArrowRight, Lightbulb } from 'lucide-react';
import type { LessonActivity, LessonChoice } from '../data/chineseLessons/types';

function shuffledIndices(length: number) {
  const values = Array.from({ length }, (_, index) => index);
  for (let index = length - 1; index > 0; index--) { const pick = Math.floor(Math.random() * (index + 1)); [values[index], values[pick]] = [values[pick], values[index]]; }
  if (length > 1 && values.every((value, index) => value === index)) [values[0], values[1]] = [values[1], values[0]];
  return values;
}

export default function ChineseLessonActivity({ activity, choices, onPredict }: { activity: LessonActivity; choices: LessonChoice[]; onPredict: () => void }) {
  const [order] = useState(() => activity.kind === 'order' ? shuffledIndices(activity.items.length) : []);
  const [picked, setPicked] = useState<number[]>([]);
  const [groups, setGroups] = useState<Record<number, number>>({});
  const [activeItem, setActiveItem] = useState(0);
  const [checked, setChecked] = useState(false);
  const [compared, setCompared] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [choiceOrder] = useState(() => Object.fromEntries(choices.map(item => [item.id, shuffledIndices(item.options.length)])));
  function reset() { setPicked([]); setGroups({}); setActiveItem(0); setChecked(false); }
  const correct = activity.kind === 'order' ? picked.length === activity.items.length && picked.every((index, position) => index === position)
    : activity.kind === 'classify' ? activity.items.every((item, index) => groups[index] === item.group) : false;
  const complete = activity.kind === 'order' ? picked.length === activity.items.length : activity.kind === 'classify' ? Object.keys(groups).length === activity.items.length : true;

  return <div className="cnl-activities">
    <section className="cnl-operation"><span className="cnl-eyebrow">动手读懂</span><h2>{activity.title}</h2><p className="cnl-instruction">{activity.instruction}</p>
      {activity.kind === 'order' && <><div className="cnl-order-slots" aria-label="已排顺序">{Array.from({ length: activity.items.length }, (_, position) => <button key={position} onClick={() => { setPicked(current => current.filter((_, index) => index !== position)); setChecked(false); }} disabled={picked[position] === undefined}><b>{position + 1}</b><span>{picked[position] === undefined ? '点下面的事情' : activity.items[picked[position]]}</span></button>)}</div><div className="cnl-order-bank">{order.map(index => <button key={index} disabled={picked.includes(index)} onClick={() => { setPicked(current => [...current, index]); setChecked(false); }}>{activity.items[index]}{picked.includes(index) && <Check size={16} />}</button>)}</div></>}
      {activity.kind === 'classify' && <><div className="cnl-classify-items" aria-label="选择要分类的内容">{activity.items.map((item, index) => <button key={index} aria-pressed={index === activeItem} className={index === activeItem ? 'is-active' : ''} onClick={() => setActiveItem(index)}><span>{item.text}</span><small>{groups[index] === undefined ? '待分类' : activity.groups[groups[index]]}</small></button>)}</div><div className="cnl-classify-groups" aria-label="选一个类别">{activity.groups.map((group, index) => <button key={group} onClick={() => { setGroups(current => ({ ...current, [activeItem]: index })); setActiveItem(Math.min(activeItem + 1, activity.items.length - 1)); setChecked(false); }}>{group}</button>)}</div></>}
      {activity.kind === 'compare' && <><div className="cnl-compare-options" role="group" aria-label="选择观察内容">{activity.options.map((item, index) => <button key={item.label} aria-pressed={index === compared} className={index === compared ? 'is-active' : ''} onClick={() => setCompared(index)}>{item.label}</button>)}</div><div className="cnl-compare-detail"><strong>{activity.options[compared].label}</strong><p>{activity.options[compared].detail}</p></div><p className="cnl-question">{activity.question}</p><details><summary>说过了，看看解释</summary><p>{activity.explanation}</p></details></>}
      {activity.kind === 'predict' && <div className="cnl-predict-prompt"><Lightbulb size={26} /><p>猜想可以不同，先说你从哪里想到的。</p><button className="cnl-primary" onClick={onPredict}>去课文里预测 <ArrowRight size={18} /></button><p className="cnl-small">先说依据，再展开后文；不按是否猜中评分。</p></div>}
      {activity.kind === 'evidence' && <div className="cnl-evidence-prompt"><BookEvidence /><p>{activity.explanation}</p><span>带着问题回课本找一句话，再用自己的话解释。</span></div>}
      {(activity.kind === 'order' || activity.kind === 'classify') && <><div className="cnl-operation-controls"><button className="cnl-text-button" onClick={reset}><RotateCcw size={16} />重排</button><button className="cnl-primary" disabled={!complete} onClick={() => setChecked(true)}>排好了，核对 <Check size={18} /></button></div><p className="cnl-operation-feedback" role="status">{checked ? `${correct ? '对应上了。' : '还有一处要再看。'}${activity.explanation}` : '可以直接改，不用从头再来。'}</p></>}
    </section>
    <section className="cnl-understanding-checks"><span className="cnl-eyebrow">回到文字找依据</span><h2>想清楚，再选</h2>{choices.map(item => <div className="cnl-choice" key={item.id}><p>{item.prompt}</p><div>{choiceOrder[item.id].map(index => <button key={index} aria-pressed={answers[item.id] === index} className={answers[item.id] === index ? index === item.answer ? 'is-right' : 'is-wrong' : ''} onClick={() => setAnswers(current => ({ ...current, [item.id]: index }))}>{item.options[index]}{answers[item.id] === index && index === item.answer && <Check size={16} />}</button>)}</div><p className="cnl-choice-feedback" role="status">{answers[item.id] !== undefined && <>{answers[item.id] === item.answer ? '有依据。' : '再找找依据。'}{item.explanation}</>}</p></div>)}</section>
  </div>;
}

function BookEvidence() { return <svg width="58" height="50" viewBox="0 0 58 50" aria-hidden="true"><path d="M4 8Q17 4 29 10Q41 4 54 8V40Q41 35 29 41Q17 35 4 40Z" fill="#d7e2cd" stroke="#52755e" strokeWidth="2" /><path d="M29 10V41M10 16L23 18M10 24L23 25M35 18L48 16M35 25L48 24" stroke="#52755e" strokeWidth="2" /></svg>; }
