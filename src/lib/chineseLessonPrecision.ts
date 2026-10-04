import type { PrecisionTool, PrecisionMark, PrecisionPredictionTool } from '../data/chineseLessonPrecision';
import { assessPrediction, createPredictionRecord, revealPrediction, selectPrediction, togglePredictionEvidence, type OldHousePredictionRecord } from './oldHousePrediction';

export type PrecisionToolState = {
  optionId?: string; spotId?: string; sourceId?: string; lineId?: string;
  parameter: number;
  links: Record<string, string>;
  order: string[];
  stopId?: string;
  predictionRecords: Record<string, OldHousePredictionRecord>;
  gains: Record<string, number>;
  breaks: Record<string, number[]>;
};
export type PrecisionToolView = {
  artStep: number; artVariant?: string; sceneKey: string; caption: string;
  marks: PrecisionMark[];
  lens?: { x: number; y: number; zoom: number };
  effect?: { type: 'distance' | 'speed' | 'light' | 'rain' | 'colour'; value: number };
  activeLayers?: { id: string; label: string; gain: number; pattern: string; x: number; y: number }[];
  outcome?: string;
};
export type PrecisionAssessment = { complete: boolean; matched: boolean; supported: boolean; feedback: string };

export function createPrecisionState(tool: PrecisionTool): PrecisionToolState {
  return {
    parameter: tool.kind === 'compare' ? tool.parameter?.initial ?? 0 : 0,
    optionId: tool.kind === 'compare' ? tool.options[0]?.id : undefined,
    sourceId: tool.kind === 'association' ? tool.sources[0]?.id : undefined,
    lineId: tool.kind === 'classical' ? tool.lines[0]?.id : undefined,
    links: {}, order: [],
    stopId: tool.kind === 'prediction' ? tool.stops[0]?.id : undefined,
    predictionRecords: tool.kind === 'prediction' ? Object.fromEntries(tool.stops.map(stop => [stop.id, createPredictionRecord()])) : {},
    gains: tool.kind === 'sound' ? Object.fromEntries(tool.layers.map(layer => [layer.id, bounded(layer.initial, 0, 1)])) : {},
    breaks: {},
  };
}

function bounded(value: number, min: number, max: number) { return Number.isNaN(value) ? min : Math.max(min, Math.min(max, value)); }
function currentStop(tool: PrecisionPredictionTool, state: PrecisionToolState) { return tool.stops.find(stop => stop.id === state.stopId) ?? tool.stops[0]; }
export function getPrecisionPredictionRecord(tool: PrecisionPredictionTool, state: PrecisionToolState): OldHousePredictionRecord {
  return state.predictionRecords[currentStop(tool, state).id] ?? createPredictionRecord();
}

/** Direct selection changes the model view; it never advances to a future event automatically. */
export function selectPrecisionOption(tool: PrecisionTool, state: PrecisionToolState, id: string): PrecisionToolState {
  if (tool.kind === 'compare' && tool.options.some(option => option.id === id)) return { ...state, optionId: id };
  if (tool.kind === 'hotspot' && tool.spots.some(spot => spot.id === id)) return { ...state, spotId: id };
  if (tool.kind === 'association' && tool.sources.some(source => source.id === id)) return { ...state, sourceId: id };
  if (tool.kind === 'classical' && tool.lines.some(line => line.id === id)) return { ...state, lineId: id };
  if (tool.kind === 'prediction') {
    const stop = currentStop(tool, state);
    if (stop.predictions.some(prediction => prediction.id === id)) return {
      ...state, predictionRecords: { ...state.predictionRecords, [stop.id]: selectPrediction(getPrecisionPredictionRecord(tool, state), id) },
    };
  }
  return state;
}

export function setPrecisionParameter(tool: PrecisionTool, state: PrecisionToolState, value: number): PrecisionToolState {
  if (tool.kind !== 'compare' || !tool.parameter) return state;
  return { ...state, parameter: bounded(value, tool.parameter.min, tool.parameter.max) };
}

export function linkPrecisionPair(tool: PrecisionTool, state: PrecisionToolState, sourceId: string, targetId: string): PrecisionToolState {
  const valid = tool.kind === 'association'
    ? tool.sources.some(source => source.id === sourceId) && tool.targets.some(target => target.id === targetId)
    : tool.kind === 'classical' && (tool.lines.some(line => line.id === sourceId) && tool.actions.some(action => action.id === targetId)
      || Boolean(tool.refs?.some(reference => reference.id === sourceId && reference.targets.some(target => target.id === targetId))));
  return valid ? { ...state, links: { ...state.links, [sourceId]: targetId } } : state;
}

/** This feedback checks one word in its sentence, independently of pauses and personal mastery. */
export function assessPrecisionReference(tool: PrecisionTool, state: PrecisionToolState, referenceId: string): PrecisionAssessment {
  const reference = tool.kind === 'classical' ? tool.refs?.find(item => item.id === referenceId) : undefined;
  const target = reference?.targets.find(item => item.id === state.links[referenceId]);
  if (!reference || !target) return { complete: false, matched: false, supported: false, feedback: reference?.question ?? '把字词放回原句，联系人物行动理解。' };
  const matched = target.id === reference.targetId;
  return { complete: true, matched, supported: matched, feedback: target.explanation };
}

export function appendPrecisionRoute(tool: PrecisionTool, state: PrecisionToolState, id: string): PrecisionToolState {
  if (tool.kind !== 'route' || !tool.nodes.some(node => node.id === id) || state.order.includes(id)) return state;
  return { ...state, order: [...state.order, id] };
}
export function removePrecisionRoute(state: PrecisionToolState, position: number): PrecisionToolState {
  return position >= 0 && position < state.order.length ? { ...state, order: state.order.filter((_, index) => index !== position) } : state;
}

export function selectPrecisionStop(tool: PrecisionTool, state: PrecisionToolState, stopId: string): PrecisionToolState {
  return tool.kind === 'prediction' && tool.stops.some(stop => stop.id === stopId) ? { ...state, stopId } : state;
}
export function togglePrecisionEvidence(tool: PrecisionTool, state: PrecisionToolState, evidenceId: string): PrecisionToolState {
  if (tool.kind !== 'prediction') return state;
  const stop = currentStop(tool, state);
  if (!stop.evidence.some(evidence => evidence.id === evidenceId)) return state;
  return { ...state, predictionRecords: { ...state.predictionRecords, [stop.id]: togglePredictionEvidence(getPrecisionPredictionRecord(tool, state), evidenceId) } };
}
export function revealPrecisionOutcome(tool: PrecisionTool, state: PrecisionToolState): PrecisionToolState {
  if (tool.kind !== 'prediction') return state;
  const stop = currentStop(tool, state);
  return { ...state, predictionRecords: { ...state.predictionRecords, [stop.id]: revealPrediction(getPrecisionPredictionRecord(tool, state)) } };
}
export function retryPrecisionPrediction(tool: PrecisionTool, state: PrecisionToolState): PrecisionToolState {
  if (tool.kind !== 'prediction') return state;
  const stop = currentStop(tool, state);
  return { ...state, predictionRecords: { ...state.predictionRecords, [stop.id]: createPredictionRecord() } };
}
export function setPrecisionGain(tool: PrecisionTool, state: PrecisionToolState, layerId: string, gain: number): PrecisionToolState {
  return tool.kind === 'sound' && tool.layers.some(layer => layer.id === layerId)
    ? { ...state, gains: { ...state.gains, [layerId]: bounded(gain, 0, 1) } } : state;
}
export function toggleClassicalBreak(tool: PrecisionTool, state: PrecisionToolState, position: number): PrecisionToolState {
  if (tool.kind !== 'classical') return state;
  const line = tool.lines.find(item => item.id === state.lineId) ?? tool.lines[0];
  const length = Array.from(line.text).length;
  if (!Number.isInteger(position) || position <= 0 || position >= length) return state;
  const before = state.breaks[line.id] ?? [];
  const after = before.includes(position) ? before.filter(index => index !== position) : [...before, position].sort((a, b) => a - b);
  return { ...state, breaks: { ...state.breaks, [line.id]: after } };
}

export function getPrecisionView(tool: PrecisionTool, state: PrecisionToolState): PrecisionToolView {
  if (tool.kind === 'compare') {
    const option = tool.options.find(item => item.id === state.optionId) ?? tool.options[0];
    return { artStep: option.artStep, artVariant: option.artVariant, sceneKey: option.id, caption: option.caption, marks: option.marks ?? [],
      effect: tool.parameter ? { type: tool.parameter.effect, value: (bounded(state.parameter, tool.parameter.min, tool.parameter.max) - tool.parameter.min) / (tool.parameter.max - tool.parameter.min) } : undefined };
  }
  if (tool.kind === 'hotspot') {
    const spot = tool.spots.find(item => item.id === state.spotId);
    return { artStep: tool.artStep, artVariant: tool.artVariant, sceneKey: spot?.id ?? 'overview', caption: spot ? `${spot.label}：${spot.clue}` : '点一处细节，再回到纸本找相应描写。',
      marks: spot ? [{ id: spot.id, label: spot.label, x: spot.x, y: spot.y, shape: 'spot' }] : [], lens: spot ? { x: spot.x, y: spot.y, zoom: spot.zoom } : undefined };
  }
  if (tool.kind === 'association') {
    const source = tool.sources.find(item => item.id === state.sourceId) ?? tool.sources[0];
    return { artStep: source.artStep ?? tool.artStep, artVariant: tool.artVariant, sceneKey: source.id, caption: source.text, marks: [] };
  }
  if (tool.kind === 'route') {
    const node = tool.nodes.find(item => item.id === state.order.at(-1));
    return { artStep: node?.artStep ?? 0, sceneKey: node?.id ?? 'overview', caption: node ? node.meaning : tool.routeNote,
      marks: state.order.map((id, index) => ({ id, label: tool.nodes.find(item => item.id === id)!.label, x: 12 + index * (76 / Math.max(1, tool.nodes.length - 1)), y: 78, shape: 'node' })) };
  }
  if (tool.kind === 'prediction') {
    const stop = currentStop(tool, state);
    const record = getPrecisionPredictionRecord(tool, state);
    return { artStep: stop.artStep, sceneKey: `${stop.id}${record.revealed ? '--revealed' : ''}`, caption: stop.known, marks: [], outcome: record.revealed ? stop.outcome ?? stop.outcomeNote : undefined };
  }
  if (tool.kind === 'sound') {
    const active = tool.layers.filter(layer => (state.gains[layer.id] ?? 0) > 0);
    const loudest = [...active].sort((a, b) => state.gains[b.id] - state.gains[a.id])[0];
    return { artStep: loudest?.artStep ?? 0, sceneKey: 'soundscape', caption: active.length ? active.map(layer => layer.label).join(' · ') : '声源暂时收起，想想景物中少了什么。',
      marks: active.map(layer => ({ id: layer.id, label: layer.label, x: layer.x, y: layer.y, shape: 'wave' })),
      activeLayers: active.map(layer => ({ id: layer.id, label: layer.label, gain: state.gains[layer.id], pattern: layer.pattern, x: layer.x, y: layer.y })) };
  }
  const line = tool.lines.find(item => item.id === state.lineId) ?? tool.lines[0];
  return { artStep: line.artStep, sceneKey: line.id, caption: line.meaning, marks: [] };
}

export function assessPrecisionTool(tool: PrecisionTool, state: PrecisionToolState): PrecisionAssessment {
  const exploring = (feedback: string): PrecisionAssessment => ({ complete: false, matched: false, supported: false, feedback });
  if (tool.kind === 'prediction') {
    const stop = currentStop(tool, state);
    const record = getPrecisionPredictionRecord(tool, state);
    const assessment = assessPrediction(record, stop);
    return { complete: record.revealed, matched: assessment.supported, supported: assessment.supported, feedback: assessment.feedback };
  }
  if (tool.kind === 'association') {
    const connected = tool.sources.filter(source => state.links[source.id]);
    const mismatch = connected.find(source => !tool.relations.some(relation => relation.sourceId === source.id && relation.targetId === state.links[source.id]));
    return { complete: connected.length === tool.sources.length, matched: connected.length > 0 && !mismatch, supported: connected.length > 0 && !mismatch,
      feedback: mismatch ? `再看“${mismatch.text}”与所连内容有什么联系。${tool.feedback}` : connected.length ? '这组关联有内容依据。选一组用自己的话说明联系，再到纸本核对。' : tool.feedback };
  }
  if (tool.kind === 'route') {
    const complete = state.order.length === tool.expectedOrder.length;
    const matched = complete && state.order.every((id, index) => id === tool.expectedOrder[index]);
    return { complete, matched, supported: matched, feedback: complete ? `${matched ? '事情的先后对应上了。' : '有一处先后要回到纸本再看。'}${tool.explanation}` : '路线会跟着你放入的事情改变。可以直接移去一张，再接着排。' };
  }
  if (tool.kind === 'classical') {
    const line = tool.lines.find(item => item.id === state.lineId) ?? tool.lines[0];
    const actual = state.breaks[line.id] ?? [];
    const accepted = [line.chunks, ...(line.alternativeChunks ?? [])].map(chunks => chunks.slice(0, -1).map((_, index) => chunks.slice(0, index + 1).join('').length));
    const breaksMatch = accepted.some(expected => actual.length === expected.length && actual.every((position, index) => position === expected[index]));
    const actionMatch = state.links[line.id] === line.actionId;
    return { complete: actual.length > 0 && Boolean(state.links[line.id]), matched: breaksMatch && actionMatch, supported: actionMatch,
      feedback: breaksMatch && actionMatch ? `停顿和行动联系起来了。${line.meaning}` : '先辨认谁在做什么，再试着划分语句；把人物动作连回文言词语。' };
  }
  if (tool.kind === 'hotspot') return state.spotId ? { complete: true, matched: true, supported: true, feedback: tool.spots.find(spot => spot.id === state.spotId)?.meaning ?? tool.question } : exploring(tool.question);
  if (tool.kind === 'sound') return exploring(tool.contrast);
  return exploring(tool.options.find(option => option.id === state.optionId)?.evidence ?? tool.question);
}
