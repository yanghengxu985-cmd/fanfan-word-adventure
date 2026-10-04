import assert from 'node:assert/strict';
import test from 'node:test';
import { getChinesePrecisionLesson, type PrecisionTool } from '../data/chineseLessonPrecision';
import {
  createPrecisionState, getPrecisionView, assessPrecisionTool, selectPrecisionOption,
  setPrecisionParameter, linkPrecisionPair, appendPrecisionRoute, removePrecisionRoute,
  selectPrecisionStop, togglePrecisionEvidence, revealPrecisionOutcome, retryPrecisionPrediction,
  getPrecisionPredictionRecord, setPrecisionGain, toggleClassicalBreak, assessPrecisionReference,
} from './chineseLessonPrecision';

const toolFor = (id: string): PrecisionTool => getChinesePrecisionLesson(id)!.tools[0];

test('scene controls and observation hotspots change a graphic model without advancing a lesson', () => {
  const lake = toolFor('cn-04');
  let state = createPrecisionState(lake);
  const before = getPrecisionView(lake, state);
  state = setPrecisionParameter(lake, state, 100);
  assert.notDeepEqual(getPrecisionView(lake, state).effect, before.effect);
  assert.equal(getPrecisionView(lake, state).effect!.value, 1);
  assert.equal(getPrecisionView(lake, setPrecisionParameter(lake, state, -10)).effect!.value, 0);
  assert.equal(getPrecisionView(lake, setPrecisionParameter(lake, state, Number.NaN)).effect!.value, 0);
  const road = toolFor('cn-05');
  const roadState = createPrecisionState(road);
  assert.equal(getPrecisionView(road, roadState).lens, undefined);
  const leaf = selectPrecisionOption(road, roadState, 'leaf');
  assert.deepEqual(getPrecisionView(road, leaf).lens, { x: 27, y: 68, zoom: 2 });
  assert.equal(getPrecisionView(road, leaf).marks[0].id, 'leaf');
  assert.equal(roadState.spotId, undefined);
  assert.equal(selectPrecisionOption(road, leaf, 'not-a-spot'), leaf);
});

test('a valid meaning relationship supports feedback while a plausible but unrelated link needs review', () => {
  const flower = toolFor('cn-02');
  const state = createPrecisionState(flower);
  const colour = linkPrecisionPair(flower, state, 'colours', 'clothes');
  assert.equal(assessPrecisionTool(flower, colour).supported, true);
  const wrong = linkPrecisionPair(flower, colour, 'colours', 'arms');
  assert.equal(assessPrecisionTool(flower, wrong).supported, false);
  assert.match(assessPrecisionTool(flower, wrong).feedback, /颜色/);
  assert.deepEqual(state.links, {});
  assert.equal(linkPrecisionPair(flower, state, 'fake-source', 'arms'), state);
  const sea = toolFor('cn-16');
  const seaState = linkPrecisionPair(sea, createPrecisionState(sea), 'fish', 'undersea');
  assert.equal(assessPrecisionTool(sea, seaState).supported, true);
  assert.equal(assessPrecisionTool(sea, linkPrecisionPair(sea, seaState, 'fish', 'sea-colour')).supported, false);
});

test('routes are learner-built, removable, and distinguish a wrong direction from a correct story sequence', () => {
  const cow = toolFor('cn-12');
  if (cow.kind !== 'route') throw new Error('missing route');
  const empty = createPrecisionState(cow);
  assert.deepEqual(empty.order, []);
  let state = appendPrecisionRoute(cow, empty, 'second');
  assert.equal(getPrecisionView(cow, state).marks[0].id, 'second');
  assert.equal(appendPrecisionRoute(cow, state, 'second'), state);
  state = removePrecisionRoute(state, 0);
  for (const id of cow.expectedOrder) state = appendPrecisionRoute(cow, state, id);
  assert.equal(assessPrecisionTool(cow, state).matched, true);
  assert.equal(getPrecisionView(cow, state).artStep, 3);
  const reversed = { ...state, order: [...state.order].reverse() };
  assert.equal(assessPrecisionTool(cow, reversed).matched, false);
  assert.deepEqual(empty.order, []);
});

test('prediction outcome is absent before an explicit reveal, which does not require a guess', () => {
  const dog = toolFor('cn-10');
  let state = createPrecisionState(dog);
  assert.equal(getPrecisionView(dog, state).outcome, undefined);
  state = revealPrecisionOutcome(dog, state);
  assert.match(getPrecisionView(dog, state).outcome!, /小公鸡/);
  if (dog.kind !== 'prediction') throw new Error('missing prediction');
  assert.equal(getPrecisionPredictionRecord(dog, state).predictionId, undefined);
  state = selectPrecisionStop(dog, state, 'ending-gate');
  assert.equal(getPrecisionView(dog, state).outcome, undefined);
  state = revealPrecisionOutcome(dog, state);
  assert.match(getPrecisionView(dog, state).outcome!, /三个结局入口/);
});

test('a reasonable prediction remains supported despite a different story, and stop records remain independent', () => {
  const turtle = toolFor('cn-09');
  if (turtle.kind !== 'prediction') throw new Error('missing prediction');
  let state = selectPrecisionOption(turtle, createPrecisionState(turtle), 'reconsider');
  state = togglePrecisionEvidence(turtle, state, 'slow');
  assert.equal(assessPrecisionTool(turtle, state).supported, true);
  state = revealPrecisionOutcome(turtle, state);
  assert.equal(assessPrecisionTool(turtle, state).supported, true);
  assert.equal(getPrecisionPredictionRecord(turtle, selectPrecisionOption(turtle, state, 'continue')).predictionId, 'reconsider');
  const saved = state;
  state = selectPrecisionStop(turtle, state, 'cancelled-wedding');
  assert.deepEqual(getPrecisionPredictionRecord(turtle, state), { evidenceIds: [], revealed: false });
  assert.equal(getPrecisionView(turtle, state).outcome, undefined);
  state = revealPrecisionOutcome(turtle, state);
  assert.match(getPrecisionView(turtle, state).outcome!, /自己的续编/);
  state = retryPrecisionPrediction(turtle, state);
  assert.equal(getPrecisionPredictionRecord(turtle, state).revealed, false);
  assert.deepEqual(state.predictionRecords['spider-warning'], saved.predictionRecords['spider-warning']);
});

test('sound gain changes the visible mixture, keeps silent layers absent, and clamps invalid values', () => {
  const sound = toolFor('cn-21');
  const original = createPrecisionState(sound);
  assert.deepEqual(getPrecisionView(sound, original).activeLayers!.map(layer => layer.id), ['wind']);
  let state = setPrecisionGain(sound, original, 'rain', .8);
  assert.equal(getPrecisionView(sound, state).activeLayers!.find(layer => layer.id === 'rain')!.gain, .8);
  assert.equal(getPrecisionView(sound, state).artStep, 2);
  state = setPrecisionGain(sound, state, 'wind', 0);
  assert.deepEqual(getPrecisionView(sound, state).activeLayers!.map(layer => layer.id), ['rain']);
  assert.equal(setPrecisionGain(sound, state, 'rain', Infinity).gains.rain, 1);
  assert.equal(setPrecisionGain(sound, state, 'rain', Number.NaN).gains.rain, 0);
  assert.equal(original.gains.rain, 0);
});

test('classical pauses accept more than one reasonable phrasing but action meaning must still connect', () => {
  const classical = toolFor('cn-23');
  let state = createPrecisionState(classical);
  state = toggleClassicalBreak(classical, state, 2);
  state = linkPrecisionPair(classical, state, 'play', 'playing');
  assert.equal(assessPrecisionTool(classical, state).matched, true, '群儿 / 戏于庭 is a valid phrasing');
  state = toggleClassicalBreak(classical, state, 3);
  assert.equal(assessPrecisionTool(classical, state).matched, true, '群儿 / 戏 / 于庭 is also a valid phrasing');
  const wrongAction = linkPrecisionPair(classical, state, 'play', 'leaving');
  assert.equal(assessPrecisionTool(classical, wrongAction).supported, false);
  const another = selectPrecisionOption(classical, state, 'leave');
  assert.deepEqual(another.breaks.play, [2, 3]);
  assert.equal(getPrecisionView(classical, another).artStep, 2);
});

test('classical references distinguish a person from the broken vessel and a modern destination from leaving', () => {
  const tool = toolFor('cn-23');
  let state = createPrecisionState(tool);
  assert.equal(assessPrecisionReference(tool, state, 'zhi-object').complete, false);
  const untouched = state;
  state = linkPrecisionPair(tool, state, 'zhi-object', 'child');
  assert.equal(assessPrecisionReference(tool, state, 'zhi-object').matched, false);
  assert.match(assessPrecisionReference(tool, state, 'zhi-object').feedback, /获救的人/);
  state = linkPrecisionPair(tool, state, 'zhi-object', 'jar');
  assert.equal(assessPrecisionReference(tool, state, 'zhi-object').matched, true);
  state = linkPrecisionPair(tool, state, 'qu-action', 'toward');
  assert.equal(assessPrecisionReference(tool, state, 'qu-action').supported, false);
  state = linkPrecisionPair(tool, state, 'qu-action', 'leave');
  assert.equal(assessPrecisionReference(tool, state, 'qu-action').supported, true);
  assert.equal(state.links['zhi-object'], 'jar', 'word meanings keep independent selections');
  assert.equal(assessPrecisionTool(tool, state).complete, false, 'word mapping does not pretend the pause exercise is done');
  assert.equal(linkPrecisionPair(tool, state, 'zhi-object', 'leave'), state, 'a target from another word cannot be selected');
  assert.equal(linkPrecisionPair(tool, state, 'made-up', 'jar'), state);
  assert.deepEqual(untouched.links, {});
  assert.deepEqual(createPrecisionState(tool).links, {});
});
