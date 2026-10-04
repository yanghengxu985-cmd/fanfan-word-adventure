import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight, Eye, Link2, Pause, RotateCcw, Search, Volume2, X } from 'lucide-react';
import type { PrecisionTool, PrecisionSoundTool } from '../data/chineseLessonPrecision';
import {
  appendPrecisionRoute, assessPrecisionReference, assessPrecisionTool, getPrecisionPredictionRecord, getPrecisionView,
  linkPrecisionPair, removePrecisionRoute, revealPrecisionOutcome, retryPrecisionPrediction,
  selectPrecisionOption, selectPrecisionStop, setPrecisionGain, setPrecisionParameter,
  toggleClassicalBreak, togglePrecisionEvidence, type PrecisionToolState,
} from '../lib/chineseLessonPrecision';
import ChineseLessonArt from './ChineseLessonArt';
import ChineseSemanticScene, { supportsSemanticScene, type SemanticSceneProps } from './chineseScenes/ChineseSemanticScene';
import './chinesePrecisionTool.css';

// Vite tracks files as they arrive during authoring; absent assets use the existing illustration.
const bitmaps = import.meta.glob('/public/images/chinese-precision/*.webp', { eager: true, query: '?url', import: 'default' });

export function PrecisionIllustration({ courseId, step = 0, variant, overview = false, sceneKey, parameter, gains, paused }: Omit<SemanticSceneProps, 'step'> & {
  step?: number; overview?: boolean;
}) {
  const name = variant || courseId;
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [name]);
  const available = Object.hasOwn(bitmaps, `/public/images/chinese-precision/${name}.webp`);
  const semantic = supportsSemanticScene(courseId) && !overview && (Boolean(sceneKey) || step > 0 || courseId === 'cn-18' || courseId === 'cn-22' || courseId === 'cn-23');
  const bitmap = available && !failed && !semantic;
  const base = new URL(`${import.meta.env.BASE_URL}images/chinese-precision/`, document.baseURI).href;
  return <div className="cpt-illustration" data-art-source={semantic ? 'semantic-scene' : bitmap ? 'bitmap' : 'existing-scene'}>
    {semantic ? <ChineseSemanticScene courseId={courseId} step={step} variant={variant} sceneKey={sceneKey} parameter={parameter} gains={gains} paused={paused} /> : bitmap ? <img src={`${base}${name}.webp`} alt="本课阅读情境示意，文字内容请对照课本" onError={() => setFailed(true)} /> : <ChineseLessonArt courseId={courseId} step={step} variant={variant} />}
  </div>;
}

type Props = { courseId: string; tool: PrecisionTool; state: PrecisionToolState; onChange: (next: PrecisionToolState) => void; onBeforeAudio?: () => void; stopSignal?: number };

function PrecisionLens({ courseId, step, variant, spot }: {
  courseId: string; step: number; variant?: string; spot: { id: string; label: string; x: number; y: number; zoom: number };
}) {
  const port = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const node = port.current!;
    const measure = () => setBounds(current => current.width === node.clientWidth && current.height === node.clientHeight ? current : { width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  // Measure the crop port, while keeping the illustration itself at its original 3:2 ratio.
  const width = bounds.width * spot.zoom;
  const height = width / 1.5;
  const left = Math.min(0, Math.max(bounds.width - width, bounds.width / 2 - spot.x * width / 100));
  const top = Math.min(0, Math.max(bounds.height - height, bounds.height / 2 - spot.y * height / 100));
  return <div className="cpt-lens" ref={port}>
    <div style={bounds.width ? { width, height, left, top } : { width: `${spot.zoom * 100}%`, aspectRatio: '3 / 2' }}><PrecisionIllustration courseId={courseId} step={step} variant={variant} overview /></div>
    <span><Search size={13} />近看 · {spot.label}</span>
  </div>;
}

export default function ChinesePrecisionTool({ courseId, tool, state, onChange, onBeforeAudio, stopSignal }: Props) {
  const view = getPrecisionView(tool, state);
  const assessment = assessPrecisionTool(tool, state);
  const [checked, setChecked] = useState(false);
  const [actionScene, setActionScene] = useState<string>();
  const [classicalMode, setClassicalMode] = useState<'pause' | 'action' | 'reference'>('pause');
  const [referenceId, setReferenceId] = useState<string>();
  const [soundLayerId, setSoundLayerId] = useState<string>();
  const [soundPlaying, setSoundPlaying] = useState(false);
  const [soundStatus, setSoundStatus] = useState('');
  const sound = useRef<{ context: AudioContext; gains: Record<string, GainNode> } | null>(null);
  function change(next: PrecisionToolState) { setChecked(false); onChange(next); }
  function stopSound() { const current = sound.current; sound.current = null; void current?.context.close(); setSoundPlaying(false); setSoundStatus(''); }
  useEffect(() => { stopSound(); }, [stopSignal]);
  useEffect(() => {
    const stop = () => stopSound();
    const hide = () => { if (document.hidden) stop(); };
    window.addEventListener('hashchange', stop); window.addEventListener('pagehide', stop); document.addEventListener('visibilitychange', hide);
    return () => { const current = sound.current; sound.current = null; void current?.context.close(); window.removeEventListener('hashchange', stop); window.removeEventListener('pagehide', stop); document.removeEventListener('visibilitychange', hide); };
  }, []);
  useEffect(() => { for (const [id, gain] of Object.entries(sound.current?.gains ?? {})) gain.gain.setTargetAtTime((state.gains[id] ?? 0) * .12, sound.current!.context.currentTime, .035); }, [state.gains]);
  useEffect(() => { setChecked(false); }, [tool.id]);
  async function playSound(soundTool: PrecisionSoundTool) {
    if (soundPlaying) { stopSound(); return; }
    onBeforeAudio?.();
    try {
      const Context = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) { setSoundStatus('这个浏览器暂不能播放声音示意，可以看声部线索。'); return; }
      const context = new Context(); const master = context.createGain(); master.gain.value = .7; master.connect(context.destination);
      const gains: Record<string, GainNode> = {};
      const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
      const values = noise.getChannelData(0); let seed = 917;
      for (let i = 0; i < values.length; i++) { seed = (seed * 16807) % 2147483647; values[i] = seed / 1073741823.5 - 1; }
      for (const layer of soundTool.layers) {
        const gain = context.createGain(); gain.gain.value = (state.gains[layer.id] ?? 0) * .12; gain.connect(master); gains[layer.id] = gain;
        if (layer.pattern === 'bird' || layer.pattern === 'insect') {
          const voice = context.createOscillator(); voice.type = 'sine'; voice.frequency.value = layer.pattern === 'bird' ? 1100 : 2800;
          const flutter = context.createOscillator(); const amount = context.createGain(); flutter.frequency.value = layer.pattern === 'bird' ? 3.2 : 7.5; amount.gain.value = layer.pattern === 'bird' ? 350 : 80;
          flutter.connect(amount); amount.connect(voice.frequency); voice.connect(gain); flutter.start(); voice.start();
        } else {
          const voice = context.createBufferSource(); voice.buffer = noise; voice.loop = true;
          const filter = context.createBiquadFilter(); filter.type = layer.pattern === 'rain' ? 'highpass' : 'lowpass'; filter.frequency.value = layer.pattern === 'wind' ? 420 : layer.pattern === 'stream' ? 1300 : 2600;
          voice.connect(filter); filter.connect(gain); voice.start();
        }
      }
      sound.current = { context, gains }; await context.resume(); if (sound.current?.context !== context) return; setSoundPlaying(true); setSoundStatus('正在播放合成声部示意，拖动滑杆比较轻重。');
    } catch { stopSound(); setSoundStatus('声音暂时没打开，可以先比较画面中的声源。'); }
  }

  const stop = tool.kind === 'prediction' ? tool.stops.find(item => item.id === state.stopId) ?? tool.stops[0] : undefined;
  const record = tool.kind === 'prediction' ? getPrecisionPredictionRecord(tool, state) : undefined;
  const line = tool.kind === 'classical' ? tool.lines.find(item => item.id === state.lineId) ?? tool.lines[0] : undefined;
  const selectedSpot = tool.kind === 'hotspot' ? tool.spots.find(item => item.id === state.spotId) : undefined;
  const option = tool.kind === 'compare' ? tool.options.find(item => item.id === state.optionId) ?? tool.options[0] : undefined;
  const reference = tool.kind === 'classical' ? tool.refs?.find(item => item.id === referenceId) ?? tool.refs?.[0] : undefined;
  const referenceTarget = reference?.targets.find(item => item.id === state.links[reference.id]);
  const soundLayer = tool.kind === 'sound' ? tool.layers.find(item => item.id === soundLayerId) ?? tool.layers[0] : undefined;
  const semantic = supportsSemanticScene(courseId) && (tool.kind !== 'hotspot' || (courseId === 'cn-22' && Boolean(selectedSpot)));
  const actionFrames = tool.kind === 'classical' && line?.id === 'break'
    ? [{ id: 'hold-stone', label: '持石' }, { id: 'strike-jar', label: '击瓮' }, { id: 'crack-jar', label: '破之' }]
    : tool.kind === 'classical' && line?.id === 'saved'
      ? [{ id: 'flowing-water', label: '水迸' }, { id: 'saved', label: '儿得活' }] : [];
  const currentAction = actionFrames.find(frame => frame.id === actionScene)?.id ?? actionFrames[0]?.id;
  const sceneKey = classicalMode === 'reference' && referenceTarget
    ? `ref-${referenceTarget.id}` : currentAction ?? view.sceneKey;
  const experienceFrames = courseId === 'cn-24' && tool.kind === 'association'
    ? (view.sceneKey.startsWith('experiment')
      ? [{ id: 'experiment-difficulty', label: '困难' }, { id: 'experiment-hard', label: '行动' }, { id: 'experiment-result', label: '结果' }]
      : [{ id: 'study-difficulty', label: '困难' }, { id: 'study-hard', label: '行动' }, { id: 'study-result', label: '结果' }]) : [];
  const currentExperience = experienceFrames.find(frame => frame.id === actionScene)?.id;
  const visualStyle = {
    '--cpt-amount': view.effect?.value ?? 0,
    transform: !semantic && view.effect?.type === 'distance' ? `scale(${1.35 - (view.effect.value * .35)})` : undefined,
  } as CSSProperties;

  return <div className={`cpt-tool cpt-${tool.kind}`} data-revealed={record?.revealed || undefined} data-classical-view={tool.kind === 'classical' ? classicalMode : undefined}>
    <div className="cpt-scene">
      <div className="cpt-scene-head"><span><Search size={16} />{tool.kind === 'prediction' ? '只看已经读到的' : tool.title}</span><small>教学情境示意</small></div>
      <div className="cpt-stage">
        <div className="cpt-scene-frame" style={!semantic && view.effect?.type === 'distance' ? visualStyle : undefined}>
        <div className={`cpt-image-layer cpt-effect-${semantic ? 'none' : view.effect?.type ?? 'none'}`} style={semantic || view.effect?.type === 'distance' ? undefined : visualStyle}><PrecisionIllustration courseId={courseId} step={classicalMode === 'reference' && referenceTarget ? referenceTarget.artStep : view.artStep} variant={view.artVariant} overview={tool.kind === 'hotspot' && !semantic} sceneKey={currentExperience ?? sceneKey} parameter={view.effect?.value} gains={tool.kind === 'sound' ? state.gains : undefined} /></div>
        {!semantic && view.effect?.type === 'rain' && <div className="cpt-rain" style={visualStyle} aria-hidden="true" />}
        {!semantic && view.effect?.type === 'light' && <div className="cpt-light" style={visualStyle} aria-hidden="true" />}
        {tool.kind === 'hotspot' && !semantic ? tool.spots.map(spot => <button key={spot.id} className={`cpt-hotspot-button ${state.spotId === spot.id ? 'is-active' : ''}`} style={{ left: `clamp(${27 + spot.label.length * 6}px, ${spot.x}%, calc(100% - ${27 + spot.label.length * 6}px))`, top: `clamp(22px, ${spot.y}%, calc(100% - 22px))` }} aria-label={`近看${spot.label}`} aria-pressed={state.spotId === spot.id} onClick={() => change(selectPrecisionOption(tool, state, spot.id))}><span /><strong>{spot.label}</strong></button>) : !semantic && view.marks.map(mark => <span key={mark.id} className={`cpt-mark cpt-mark-${mark.shape}`} style={{ left: `${mark.x}%`, top: `${mark.y}%` }}><i /><strong>{mark.label}</strong></span>)}
        {!semantic && tool.kind === 'route' && state.order.length > 1 && <svg className="cpt-route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${view.marks.map(mark => `${mark.x},${mark.y}`).join(' L ')}`} /></svg>}
        {!semantic && view.effect?.type === 'speed' && <span className="cpt-motion-cue" style={{ left: `${15 + view.effect.value * 65}%` }} aria-hidden="true">→</span>}
        </div>
      </div>
      <div className="cpt-scene-caption"><span /><p>{soundLayer ? `${soundLayer.label}：${soundLayer.clue}` : view.caption}</p></div>
      {classicalMode !== 'reference' && actionFrames.length > 0 && <div className="cpt-direct-options cpt-scene-actions" role="group" aria-label="直接观察当前句的动作过程">{actionFrames.map(frame => <button key={frame.id} className={currentAction === frame.id ? 'is-active' : ''} aria-pressed={currentAction === frame.id} onClick={() => setActionScene(frame.id)}>{frame.label}</button>)}</div>}
      {experienceFrames.length > 0 && <div className="cpt-direct-options cpt-scene-actions" role="group" aria-label="直接比较困难、行动和结果">{experienceFrames.map(frame => <button key={frame.id} className={(currentExperience ?? view.sceneKey) === frame.id ? 'is-active' : ''} aria-pressed={(currentExperience ?? view.sceneKey) === frame.id} onClick={() => setActionScene(frame.id)}>{frame.label}</button>)}</div>}
      {tool.kind === 'prediction' && <div className="cpt-direct-options">{tool.stops.map((item, i) => <button key={item.id} className={state.stopId === item.id ? 'is-active' : ''} aria-pressed={state.stopId === item.id} onClick={() => change(selectPrecisionStop(tool, state, item.id))}><small>0{i + 1}</small>{item.title}</button>)}</div>}
      {tool.kind === 'route' && <p className="cpt-boundary">{tool.routeNote}</p>}
    </div>

    <div className="cpt-work">
      <div className="cpt-heading"><span className="cnl-eyebrow">{tool.kind === 'prediction' ? '猜想可以不同，要能说清理由' : '动手看变化，带着依据说'}</span><h2>{tool.title}</h2><p>{tool.kind === 'classical' ? classicalMode === 'pause' ? '点字间的位置，试着按意思停顿。' : classicalMode === 'action' ? '点一句，再连到它写到的行动。' : '看词语在这句话里对应谁或什么。' : tool.instruction}</p></div>
      {tool.kind === 'compare' && <>
        <div className="cpt-direct-options">{tool.options.map(item => <button key={item.id} className={state.optionId === item.id ? 'is-active' : ''} aria-pressed={state.optionId === item.id} onClick={() => change(selectPrecisionOption(tool, state, item.id))}>{item.label}</button>)}</div>
        {tool.parameter && <label className="cpt-parameter"><span>{tool.parameter.label}<small>{Math.round((view.effect?.value ?? 0) * 100)}%</small></span><input type="range" min={tool.parameter.min} max={tool.parameter.max} step={(tool.parameter.max - tool.parameter.min) / 100} value={state.parameter} onChange={event => change(setPrecisionParameter(tool, state, Number(event.target.value)))} /></label>}
        <div className="cpt-detail"><span>从画面和文字一起看</span><p>{option?.evidence}</p></div><p className="cpt-question">{tool.question}</p>
      </>}
      {tool.kind === 'hotspot' && <>
        <div className="cpt-direct-options">{tool.spots.map(item => <button key={item.id} className={state.spotId === item.id ? 'is-active' : ''} aria-pressed={state.spotId === item.id} onClick={() => change(selectPrecisionOption(tool, state, item.id))}>{item.label}</button>)}</div>
        {selectedSpot ? <>{courseId !== 'cn-22' && <PrecisionLens courseId={courseId} step={tool.artStep} variant={tool.artVariant} spot={selectedSpot} />}<div className="cpt-detail"><span>把细节读回文字</span><p>{selectedSpot.meaning}</p></div></> : <div className="cpt-lens-empty"><Search size={34} /><p>点图中一处，再近看它的细节。</p></div>}
        <p className="cpt-question">{tool.question}</p>
      </>}
      {tool.kind === 'association' && <>
        <div className="cpt-relations"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="你连接的词句关系">{tool.sources.map((source, i) => { const target = tool.targets.findIndex(item => item.id === state.links[source.id]); return target < 0 ? null : <path key={source.id} d={`M 44,${(i + .5) * 100 / tool.sources.length} C 53,${(i + .5) * 100 / tool.sources.length} 47,${(target + .5) * 100 / tool.targets.length} 56,${(target + .5) * 100 / tool.targets.length}`} />; })}</svg><div>{tool.sources.map(source => <button key={source.id} className={state.sourceId === source.id ? 'is-active' : ''} aria-pressed={state.sourceId === source.id} onClick={() => { setActionScene(undefined); change(selectPrecisionOption(tool, state, source.id)); }}>{source.text}{state.links[source.id] && <Link2 size={14} />}</button>)}</div><div>{tool.targets.map(target => <button key={target.id} className={state.sourceId && state.links[state.sourceId] === target.id ? 'is-linked' : ''} onClick={() => state.sourceId && change(linkPrecisionPair(tool, state, state.sourceId, target.id))}>{target.text}</button>)}</div></div>
        <p className="cpt-question">{tool.question}</p><div className="cpt-check-row"><button className="cnl-text-button" onClick={() => setChecked(!checked)}><Eye size={17} />{checked ? '收起联系' : '看看联系'}</button><small>先点左边，再点与它有关的右边。</small></div>{checked && <p className="cpt-feedback" role="status">{assessment.feedback}{tool.relations.filter(relation => state.links[relation.sourceId] === relation.targetId).slice(0, 1).map(relation => ` ${relation.explanation}`)}</p>}
      </>}
      {tool.kind === 'route' && <>
        <div className="cpt-route-slots" aria-label="你排出的故事路线">{Array.from({ length: tool.nodes.length }, (_, index) => { const node = tool.nodes.find(item => item.id === state.order[index]); return <button key={index} disabled={!node} onClick={() => change(removePrecisionRoute(state, index))}><span>0{index + 1}</span><p>{node?.label || '放入一件事'}</p>{node && <X size={15} />}</button>; })}</div>
        <div className="cpt-route-bank">{tool.nodes.map(node => <button key={node.id} disabled={state.order.includes(node.id)} onClick={() => change(appendPrecisionRoute(tool, state, node.id))}>{node.label}<ArrowRight size={14} /></button>)}</div>
        <div className="cpt-check-row"><button className="cnl-text-button" onClick={() => setChecked(!checked)}><Eye size={17} />{checked ? '收起线索' : '对照先后线索'}</button><small>点已放入的卡可以移去重排。</small></div>{checked && <p className="cpt-feedback" role="status">{assessment.feedback}</p>}
      </>}
      {tool.kind === 'prediction' && stop && record && <>
        {!record.revealed ? <><div className="cpt-guesses">{stop.predictions.map((prediction, index) => <button key={prediction.id} className={record.predictionId === prediction.id ? 'is-active' : ''} aria-pressed={record.predictionId === prediction.id} onClick={() => change(selectPrecisionOption(tool, state, prediction.id))}><span>{String.fromCharCode(65 + index)}</span>{prediction.text}</button>)}</div><span className="cpt-evidence-label">愿意的话，点一条依据；也可以口头说。</span><div className="cpt-evidence">{stop.evidence.map(evidence => <button key={evidence.id} className={record.evidenceIds.includes(evidence.id) ? 'is-active' : ''} aria-pressed={record.evidenceIds.includes(evidence.id)} onClick={() => change(togglePrecisionEvidence(tool, state, evidence.id))}>{evidence.text}</button>)}</div><div className="cpt-reveal-row"><p>可以随时往下读，再比较想法。</p><button className="cnl-primary" onClick={() => change(revealPrecisionOutcome(tool, state))}><Eye size={18} />看看后文</button></div></> : <><div className="cpt-prediction-result"><div><span>原来的猜想</span><p>{stop.predictions.find(item => item.id === record.predictionId)?.text || '这次先读后文，没有留下猜想。'}</p><small>{record.evidenceIds.length ? `依据：${stop.evidence.filter(item => record.evidenceIds.includes(item.id)).map(item => item.text).join('；')}` : '可以回头找找，前面有哪些线索。'}</small></div><div><span>{stop.outcome ? '接着读到的' : '回到纸本继续读'}</span><p>{view.outcome}</p></div></div><p className="cpt-feedback">{assessment.feedback}</p><p className="cpt-question">{stop.outcomeNote}</p><div className="cpt-check-row"><button className="cnl-text-button" onClick={() => change(retryPrecisionPrediction(tool, state))}><RotateCcw size={16} />重新想一想</button><small>{record.predictionId ? '原来的想法保留在上方，可以说说保留或调整的理由。' : '回头找找线索，也可以重新留下自己的猜想。'}</small></div></>}
      </>}
      {tool.kind === 'sound' && <>
        <div className="cpt-sound-layers">{tool.layers.map(layer => <div key={layer.id}><button className={state.gains[layer.id] > 0 ? 'is-active' : ''} aria-pressed={state.gains[layer.id] > 0} onClick={() => { setSoundLayerId(layer.id); change(setPrecisionGain(tool, state, layer.id, state.gains[layer.id] > 0 ? 0 : .5)); }}><span className={`cpt-wave cpt-wave-${layer.pattern}`} aria-hidden="true">{[1, 2, 3, 4, 5].map(i => <i key={i} style={{ height: `${7 + (i * 7 % 17)}px` }} />)}</span><strong>{layer.label}</strong></button><label><span>声部轻重 · {Math.round(state.gains[layer.id] * 100)}%</span><input aria-label={`${layer.label}的轻重`} type="range" min="0" max="1" step=".05" value={state.gains[layer.id]} onChange={event => { setSoundLayerId(layer.id); change(setPrecisionGain(tool, state, layer.id, Number(event.target.value))); }} /></label></div>)}</div>
        <p className="cpt-question">{tool.question}</p><div className="cpt-check-row"><button className="cnl-primary" onClick={() => void playSound(tool)}>{soundPlaying ? <Pause size={17} /> : <Volume2 size={17} />}{soundPlaying ? '停止声音示意' : '试听声部示意'}</button></div><small className="cpt-boundary" role="status">{soundStatus || tool.simulationNote}</small>
      </>}
      {tool.kind === 'classical' && line && <>
        <div className="cpt-classical-views" role="group" aria-label="直接选择文言阅读工具">{(['pause', 'action', 'reference'] as const).map(value => <button key={value} className={classicalMode === value ? 'is-active' : ''} aria-pressed={classicalMode === value} onClick={() => { setChecked(false); setClassicalMode(value); if (value === 'reference' && reference) change(selectPrecisionOption(tool, state, reference.lineId)); }}>{({ pause: '按意思停顿', action: '词句连行动', reference: '词义与对象' })[value]}</button>)}</div>
        {classicalMode === 'reference' && reference ? <><div className="cpt-direct-options">{tool.refs!.map(item => <button key={item.id} className={reference.id === item.id ? 'is-active' : ''} aria-pressed={reference.id === item.id} onClick={() => { setReferenceId(item.id); change(selectPrecisionOption(tool, state, item.lineId)); }}>看“{item.word}”</button>)}</div><p className="cpt-classical-original">{line.text}</p><p className="cpt-question">{reference.question}</p><div className="cpt-reference-targets">{reference.targets.map(target => <button key={target.id} className={state.links[reference.id] === target.id ? 'is-active' : ''} aria-pressed={state.links[reference.id] === target.id} onClick={() => change(linkPrecisionPair(tool, state, reference.id, target.id))}>{target.text}<Link2 size={15} /></button>)}</div><p className="cpt-feedback" role="status">{assessPrecisionReference(tool, state, reference.id).feedback}</p></> : <><div className="cpt-direct-options">{tool.lines.map((item, index) => <button key={item.id} className={state.lineId === item.id ? 'is-active' : ''} aria-pressed={state.lineId === item.id} onClick={() => change(selectPrecisionOption(tool, state, item.id))}>第{index + 1}句</button>)}</div>{classicalMode === 'pause' ? <><div className="cpt-classical-text" aria-label="点字间的位置添加或取消停顿">{Array.from(line.text).map((character, index) => <span key={index}><strong>{character}</strong>{index < line.text.length - 1 && <button aria-label={`在第${index + 1}字后停顿`} aria-pressed={(state.breaks[line.id] ?? []).includes(index + 1)} className={(state.breaks[line.id] ?? []).includes(index + 1) ? 'is-active' : ''} onClick={() => change(toggleClassicalBreak(tool, state, index + 1))}>{(state.breaks[line.id] ?? []).includes(index + 1) ? '/' : '·'}</button>}</span>)}</div><div className="cpt-check-row"><button className="cnl-text-button" onClick={() => setChecked(!checked)}><Eye size={17} />{checked ? '收起示例' : '看看停顿示例'}</button></div>{checked && <div className="cpt-detail"><p className="cpt-classical-example">{line.chunks.join(' / ')}</p><small>{line.meaning} 停顿可有不同合理读法，先弄懂语意。</small></div>}</> : <><p className="cpt-classical-original">{line.text}</p><div className="cpt-classical-actions">{tool.actions.map(action => <button key={action.id} className={state.links[line.id] === action.id ? 'is-active' : ''} aria-pressed={state.links[line.id] === action.id} onClick={() => change(linkPrecisionPair(tool, state, line.id, action.id))}>{action.text}</button>)}</div>{state.links[line.id] && <p className="cpt-feedback">{assessment.supported ? line.meaning : '再看当前这句中的人物和动作，比较它与所连行动的联系。'}</p>}</>}</>}
      </>}
      <p className="cpt-margin-note">{tool.kind === 'prediction' ? '有依据的猜想可以和作者安排不同。' : tool.kind === 'sound' ? '从声源、动作和感受一起读声音。' : '把刚才的操作，连回课本中的描写。'}</p>
    </div>
  </div>;
}
