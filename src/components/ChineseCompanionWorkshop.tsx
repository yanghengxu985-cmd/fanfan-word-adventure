import { useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Eye, EyeOff, Lightbulb, MapPin, MessageCircle, Pencil } from 'lucide-react';
import { companionWorkshops, getWorkshopFields, moveMaterial } from '../data/chineseCompanionPrecision';
import { chineseCompanionTasks } from '../data/chineseCompanionTasks';
import type { BookCompanion } from '../data/chineseBookCompanions';
import './chineseCompanionWorkshop.css';

type Props = { companion: BookCompanion; drafts: Record<number, string>; setDraft: (index: number, text: string) => void; order: number[]; setOrder: (order: number[]) => void; onReview: (kind: 'writing' | 'recognition' | 'words') => void };
export default function ChineseCompanionWorkshop({ companion, drafts, setDraft, order, setOrder, onReview }: Props) {
  const task = chineseCompanionTasks[companion.id], spec = companionWorkshops[companion.id];
  const fields = getWorkshopFields(companion.id, task);
  const [selected, setSelected] = useState(0), [role, setRole] = useState(0), [angle, setAngle] = useState(0);
  const [observationTypes, setObservationTypes] = useState<Record<number, 'fact' | 'guess'>>({ 1: 'fact', 2: 'fact' });
  const roleNames: Record<string, string[]> = {
    'book-u1-speaking': ['讲述者', '听众', '补充细节'], 'book-u3-speaking': ['讲述者', '听众', '双方追问'],
    'book-u7-speaking': ['讲述者', '听众', '回应意见'], 'book-u8-speaking': ['请教者', '解答者', '确认理解', '下一步'],
  };
  const method = ['expression', 'context', 'prediction', 'roles', 'mainidea', 'sound', 'classify', 'review'].includes(spec.kind);
  return <div className={`cncw-workshop cncw-${spec.kind}`} data-workshop={spec.kind}>
    <div className="cncw-intro"><span className="cnbc-eyebrow">{method ? '原创方法工具' : '用自己的内容动手整理'}</span><h2>{spec.title}</h2><p>{spec.instruction}</p></div>
    {method ? <MethodTool kind={spec.kind} drafts={drafts} setDraft={setDraft} onReview={onReview} /> : <div className="cncw-own-board">
      <section className="cncw-canvas" aria-label="自己的材料关系图">
        {spec.kind === 'conversation' && <div className="cncw-roles" role="group" aria-label="选择交流角色">{task.conversation?.map((text, index) => <button key={text} aria-pressed={role === index} className={role === index ? 'is-active' : ''} onClick={() => setRole(index)}><MessageCircle size={16} />{roleNames[companion.id]?.[index] || text.split('：')[0]}</button>)}</div>}
        {spec.kind === 'conversation' && <p className="cncw-role-prompt" role="status">{task.conversation?.[role]?.split('：').slice(1).join('：')}</p>}
        {spec.kind === 'angles' && <div className="cncw-roles" role="group" aria-label="观察角度">{['颜色', '形状', '味道'].map((text, index) => <button key={text} aria-pressed={angle === index} className={angle === index ? 'is-active' : ''} onClick={() => setAngle(index)}>{text}</button>)}</div>}
        {spec.kind === 'angles' && <p className="cncw-role-prompt">{['说清颜色或它的变化；指出实际看见的部位。', '看表面、大小和轮廓，不只说好看。', '只有真正品尝过才写味道，没尝过可以换角度。'][angle]}</p>}
        {spec.kind === 'identity' && <div className="cncw-anonymous" aria-label="名字已藏住"><span>？</span><p>名字不公开<br /><small>用真实特点辨认</small></p></div>}
        <div className="cncw-materials" data-layout={spec.kind}>
          {order.map((index, position) => <div className="cncw-material-wrap" key={index}>
            <button className={`cncw-material ${selected === index ? 'is-active' : ''} ${spec.kind === 'memory' && index === 1 ? 'is-keyframe' : ''}`} aria-pressed={selected === index} onClick={() => setSelected(index)}>
              <span className="cncw-card-number">{spec.kind === 'map' ? <MapPin size={18} /> : String(position + 1).padStart(2, '0')}</span><strong>{fields[index].label}</strong><p className={!drafts[index]?.trim() ? 'is-blank' : ''}>{drafts[index]?.trim() || '点这里，记自己的关键词'}</p>
              {spec.kind === 'observation' && index > 0 && <small className="cncw-type-label">{observationTypes[index] === 'fact' ? '亲眼看到' : '还在猜想'}</small>}
            </button>
            {spec.movable && <div className="cncw-move" role="group" aria-label={`移动${fields[index].label}`}><button aria-label={`将${fields[index].label}前移`} disabled={position === 0} onClick={() => setOrder(moveMaterial(order, index, -1))}><ArrowLeft size={16} /></button><button aria-label={`将${fields[index].label}后移`} disabled={position === order.length - 1} onClick={() => setOrder(moveMaterial(order, index, 1))}><ArrowRight size={16} /></button></div>}
            {position < order.length - 1 && <ArrowDown className="cncw-connector" size={18} aria-hidden="true" />}
          </div>)}
        </div>
        {spec.kind === 'observation' && <div className="cncw-fact-summary" aria-live="polite"><span>亲眼看到：{[1, 2].filter(index => observationTypes[index] === 'fact' && drafts[index]?.trim()).length}条</span><span>原因待查：{[1, 2].filter(index => observationTypes[index] === 'guess' && drafts[index]?.trim()).length}条</span></div>}
      </section>
      <aside className="cncw-editor">
        <label><span><Pencil size={17} />{fields[selected].label}</span><textarea aria-label={fields[selected].label} value={drafts[selected] || ''} maxLength={160} onChange={event => setDraft(selected, event.target.value)} placeholder={fields[selected].placeholder} rows={4} /></label>
        {spec.kind === 'observation' && selected > 0 && <div className="cncw-classify-controls" role="group" aria-label="这条记录是什么">{(['fact', 'guess'] as const).map(type => <button key={type} className={observationTypes[selected] === type ? 'is-active' : ''} aria-pressed={observationTypes[selected] === type} onClick={() => setObservationTypes(value => ({ ...value, [selected]: type }))}>{type === 'fact' ? '亲眼看到' : '还在猜想'}</button>)}</div>}
        <div className="cncw-editor-hint"><Lightbulb size={20} /><p>{task.steps[Math.min(selected, task.steps.length - 1)].prompt}</p></div><p className="cncw-private">只记关键词，离开本活动后清空。也可以直接在纸上画，不必填写。</p>
      </aside>
    </div>}
    <p className="cncw-source-note">{spec.note}</p>
  </div>;
}

function MethodTool({ kind, drafts, setDraft, onReview }: { kind: string; drafts: Record<number, string>; setDraft: Props['setDraft']; onReview: Props['onReview'] }) {
  const [view, setView] = useState(0), [active, setActive] = useState(0), [shown, setShown] = useState(false);
  const [originalPrediction, setOriginalPrediction] = useState<{ guess: string; clues: number[] } | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<number[]>([]), [assignments, setAssignments] = useState<Record<number, number>>({});
  const choices = kind === 'expression' ? ['平常说法', '新鲜表达'] : kind === 'context' ? ['看前后', '想经验', '查解释'] : kind === 'sound' ? ['平常说法', '声音词', '加一点联想'] : kind === 'review' ? ['字音', '字形', '阅读方法'] : [];
  const toggleDetail = (index: number) => setSelectedDetails(values => values.includes(index) ? values.filter(value => value !== index) : [...values, index]);
  return <div className={`cncw-method cncw-method-${kind}`}>
    {choices.length > 0 && <div className="cncw-roles" role="group" aria-label="直接选择方法">{choices.map((label, index) => <button key={label} className={view === index ? 'is-active' : ''} aria-pressed={view === index} onClick={() => setView(index)}>{label}</button>)}</div>}
    {(kind === 'expression' || kind === 'sound') && <div className={`cncw-expression-view ${view > 0 ? 'is-vivid' : ''}`}>
      <div className="cncw-illustrated-scene" aria-hidden="true">{kind === 'expression' ? <><div className="cncw-playground"><i /><i /><i /><i /><i /></div><div className="cncw-motion-lines">{view ? '笑声　脚步声　游戏' : '操场'}</div></> : <><div className="cncw-bamboo"><i /><i /><i /></div><div className="cncw-motion-lines">{view ? '沙沙　沙沙' : '竹林'}</div></>}</div>
      <div className="cncw-expression-text"><span>原创句子</span><p>{kind === 'expression' ? view ? <>铃声一响，操场就<span className="cncw-highlight">沸腾</span>了。</> : '铃声一响，操场很热闹。' : view === 0 ? '风吹动了竹叶。' : view === 1 ? <>微风吹来，竹叶<span className="cncw-highlight">沙沙响</span>。</> : <>竹叶沙沙响，<span className="cncw-highlight">像有人在轻声说话</span>。</>}</p><small>{kind === 'expression' ? '说具体：你仿佛看见哪些动作、听见什么？“沸腾”不是水烧开。' : '哪一处帮助听见声音，哪一处让你感到轻柔？'}</small></div>
    </div>}
    {kind === 'context' && <div className="cncw-context-view"><div className="cncw-rain-comparison" aria-hidden="true"><div><i /><i /><i /><i /><i /><strong>起初</strong></div><ArrowRight size={30} /><div><i /><i /><strong>后来</strong></div></div><p className="cncw-example-sentence">起初雨很大，后来雨点<span className="cncw-highlight">渐渐</span>稀疏了。</p><div className="cncw-context-evidence" role="status">{['看“起初雨很大”和“后来稀疏”：前后有慢慢变化的过程。', '回想雨慢慢变小的经历，再检查它能否放进这个句子。', '查到“慢慢地”的解释后，放回句子读一遍。'][view]}</div><p className="cncw-method-question">换回纸本中的一个难词，说清你用的线索。</p></div>}
    {kind === 'prediction' && <div className="cncw-prediction-board"><section><span>只看开头</span><p>小雨抱着一幅画来到教室门口，门上贴着“作品展示”。</p><div className="cncw-clues">{['抱着一幅画', '作品展示'].map((text, index) => <button key={text} className={selectedDetails.includes(index) ? 'is-active' : ''} aria-pressed={selectedDetails.includes(index)} onClick={() => toggleDetail(index)}>{text}</button>)}</div><label>{originalPrediction ? '现在的想法，可以调整' : '我的猜想'}<textarea value={drafts[0] || ''} maxLength={160} onChange={event => setDraft(0, event.target.value)} placeholder="我猜她可能……因为……" rows={2} /></label></section><section><button className="cncw-reveal" aria-expanded={shown} onClick={() => { if (!originalPrediction) setOriginalPrediction({ guess: drafts[0]?.trim() || '', clues: [...selectedDetails] }); setShown(!shown); }}>{shown ? <EyeOff size={17} /> : <Eye size={17} />}{shown ? '遮住后文' : '直接展开后文'}</button>{shown ? <div role="status"><p>她把画递给老师，又在墙上寻找展示的位置。</p><div className="cncw-original-prediction"><span>展开前留下的猜想</span><p>{originalPrediction?.guess || '当时没有填写猜想，可以直接阅读。'}</p><small>{originalPrediction?.clues.length ? `当时选的线索：${originalPrediction.clues.map(index => ['抱着一幅画', '作品展示'][index]).join('、')}` : '当时没有点选线索。'}现在有哪些新依据？不按猜中与否判分。</small></div></div> : <div className="cncw-folded-story"><BookOpen size={40} /><p>这里暂时停一停<br /><small>展开不需要先回答</small></p></div>}</section></div>}
    {kind === 'roles' && <div className="cncw-role-tool"><div className="cncw-roles" aria-label="选文具角色">{['铅笔', '橡皮'].map((label, index) => <button key={label} aria-pressed={active === index} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>{label}</button>)}</div><div className="cncw-role-art" aria-hidden="true"><div className={`cncw-pencil ${active === 0 ? 'is-active' : ''}`} /><div className="cncw-correction">{view ? '修改后' : '还在尝试'}<span>{view ? '字形更清楚了' : '一处写错的部件'}</span></div><div className={`cncw-eraser ${active === 1 ? 'is-active' : ''}`} /></div><div className="cncw-roles" aria-label="选择行动">{['先看错在哪', '合作修改'].map((label, index) => <button key={label} aria-pressed={view === index} className={view === index ? 'is-active' : ''} onClick={() => setView(index)}>{label}</button>)}</div><p className="cncw-method-question">{active === 0 ? '铅笔能补写，但先要看清该改哪一处。' : '橡皮能擦掉错误，接着需要铅笔重新写。'}文具说话是童话想象，行动要前后接得上。</p></div>}
    {kind === 'mainidea' && <div className="cncw-mainidea-tool"><div className="cncw-mainidea-card"><span>原创段落的主意</span><strong>课间的校园很热闹。</strong><div className="cncw-gathered-details">{selectedDetails.map(index => <span key={index}>{['篮球场响起加油声', '走廊里同学交换图书', '早晨我吃了一碗粥'][index]}</span>)}{!selectedDetails.length && <small>点选下方细节，放到这里比较</small>}</div></div><div className="cncw-roles" aria-label="选支持细节">{['篮球场响起加油声', '走廊里同学交换图书', '早晨我吃了一碗粥'].map((text, index) => <button key={text} className={selectedDetails.includes(index) ? 'is-active' : ''} aria-pressed={selectedDetails.includes(index)} onClick={() => toggleDetail(index)}>{text}</button>)}</div><p className="cncw-method-question" role="status">{selectedDetails.includes(2) ? '早餐发生在别的时间与场景，不能直接支持课间校园的主意。看看另外两张如何相关。' : '选的细节要发生在课间校园，并能说明它怎样热闹；用自己的话解释联系。'}</p></div>}
    {kind === 'classify' && <div className="cncw-classification"><div className="cncw-items" role="group" aria-label="选择物品">{['故事书', '书签', '纸', '笔', '水杯', '展示设备'].map((text, index) => <button key={text} className={active === index ? 'is-active' : ''} aria-pressed={active === index} onClick={() => setActive(index)}>{text}</button>)}</div><div className="cncw-baskets">{['阅读', '记录', '活动'].map((label, category) => <button key={label} aria-label={`把当前物品放入${label}`} onClick={() => setAssignments(values => ({ ...values, [active]: category }))}><strong>{label}</strong><span>{Object.entries(assignments).filter(([, value]) => value === category).map(([index]) => ['故事书', '书签', '纸', '笔', '水杯', '展示设备'][Number(index)]).join('、') || '点这里放入'}</span></button>)}</div><p className="cncw-method-question">{['故事书可以供阅读，也可能用于展示。', '书签可帮助标记阅读位置。', '纸可记录，也可做展示材料。', '笔一般用于记录自己的想法。', '水杯用于饮水，先看活动实际需要。', '设备用于展示或共同阅读，按真实用途归类。'][active]}说清理由，不只记住一个固定分类。</p></div>}
    {kind === 'review' && <div className="cncw-review-tool"><div className="cncw-review-symbol" aria-hidden="true">{view === 0 ? <MessageCircle size={64} /> : view === 1 ? <Pencil size={64} /> : <BookOpen size={64} />}</div><h3>{['把字放到词里读', '合书后在纸上独立写', '找语句支持自己的理解'][view]}</h3><p>{['先自己读，再听已核的读音。多音字按课文语境，词中的轻声另看。', '记住一小组字，遮住再写，展开时看实际纸稿，错哪个部件就练哪里。', '选一段自己读过的课文，说明主要意思，再指一处依据。隔几天换一段。'][view]}</p><button className="cncw-reveal" onClick={() => onReview(view === 0 ? 'recognition' : view === 1 ? 'writing' : 'words')}>{view === 2 ? '用字词检查语境，再回课文找依据' : '直接选一组字词'}<ArrowRight size={17} /></button></div>}
  </div>;
}
