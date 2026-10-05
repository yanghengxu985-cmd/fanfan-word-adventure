import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { chinesePrecisionLessons } from '../data/chineseLessonPrecision';
import { createPrecisionState, getPrecisionView, selectPrecisionOption, appendPrecisionRoute, setPrecisionGain } from './chineseLessonPrecision';

// Styles have no role in server rendering. Browser inspection separately verifies them.
registerHooks({ load(url, context, nextLoad) {
  if (url.endsWith('.css')) return { format: 'module', source: 'export default {};', shortCircuit: true };
  return nextLoad(url, context);
} });
const { default: Scene, supportsSemanticScene } = await import('../components/chineseScenes/ChineseSemanticScene');
const { getPolishedFrame } = await import('../components/chineseScenes/polishedFrames');
const { default: PaintedScene } = await import('../components/chineseScenes/ChinesePolishedScene');
type SceneProps = Parameters<typeof Scene>[0];
function render(props: SceneProps) { return renderToStaticMarkup(createElement(Scene, props)); }
function toolFor(courseId: string) { return chinesePrecisionLessons.find(item => item.courseId === courseId)!.tools[0]; }
function selectScene(courseId: string, id: string) {
  const tool = toolFor(courseId);
  let state = createPrecisionState(tool);
  state = tool.kind === 'route' ? appendPrecisionRoute(tool, state, id) : selectPrecisionOption(tool, state, id);
  const view = getPrecisionView(tool, state);
  return render({ courseId, step: view.artStep, sceneKey: view.sceneKey, variant: view.artVariant });
}
function hasObject(markup: string, object: string) {
  assert.ok(markup.includes(`data-scene-object="${object}"`), `Missing the actual ${object} drawing`);
}

test('each shared lesson supplies a scene for every reading state, with drawable objects', () => {
  for (const lesson of chinesePrecisionLessons) {
    assert.equal(supportsSemanticScene(lesson.courseId), true, lesson.courseId);
    for (let step = 0; step < 4; step++) {
      const variant = lesson.courseId === 'cn-04' ? 'wangdongting' : lesson.courseId === 'cn-20' ? 'luchai' : undefined;
      const markup = render({ courseId: lesson.courseId, step, variant });
      assert.match(markup, /<svg[\s>]/, `${lesson.courseId}, step ${step}`);
      assert.match(markup, /data-scene-object=/, `${lesson.courseId}, step ${step}`);
      assert.match(markup, /<(path|ellipse|image)[\s>]/, 'Object tags alone do not constitute an illustration');
    }
  }
});

test('a shared numeric step preserves the selected semantic option instead of conflating it', () => {
  for (const [courseId, ids] of [['cn-06', ['squirrel', 'frog']], ['cn-11', ['math', 'sunflower']], ['cn-26', ['old-utensil', 'new-bowl']], ['cn-12', ['first', 'second', 'mouth-again']]] as const) {
    const outputs = ids.map(id => selectScene(courseId, id));
    assert.equal(new Set(outputs).size, ids.length, `Distinct ${courseId} teaching objects collapsed`);
    ids.forEach((id, index) => assert.match(outputs[index], new RegExp(`data-scene-key="${id}"`)));
  }
});

test('autumn preparation depicts squirrel and frog, with no unrelated turtle substitute', () => {
  const squirrel = selectScene('cn-06', 'squirrel');
  hasObject(squirrel, 'squirrel'); hasObject(squirrel, 'pine-cone');
  assert.doesNotMatch(squirrel, /data-scene-object="turtle"/);
  const frog = selectScene('cn-06', 'frog');
  hasObject(frog, 'frog');
  assert.doesNotMatch(frog, /data-scene-object="turtle"/);
});

test('sunflower wish cannot silently reuse the arithmetic book illustration', () => {
  const math = selectScene('cn-11', 'math');
  const sunflower = selectScene('cn-11', 'sunflower');
  hasObject(math, 'arithmetic-book'); hasObject(sunflower, 'poorly-growing-sunflower');
  assert.doesNotMatch(sunflower, /data-scene-object="arithmetic-book"/);
});

test('the explanation scene does not show recitation after the teacher starts explaining', () => {
  const reading = render({ courseId: 'cn-03', step: 2 });
  assert.match(reading, /data-scene-key="understand"/);
  const reciting = render({ courseId: 'cn-03', step: 2, sceneKey: 'recite' });
  assert.match(reciting, /data-scene-key="recite"/);
  assert.notEqual(reading, reciting);
});

test('the cricket route keeps one Hongtou, at the directly selected node', () => {
  for (const sceneKey of ['outside', 'first', 'mouth-again', 'second', 'mouth']) {
    const markup = render({ courseId: 'cn-12', step: 0, sceneKey });
    assert.equal(markup.match(/data-scene-object="red-cricket"/g)?.length, 1, sceneKey);
    hasObject(markup, 'current-red-cricket-location');
    assert.match(markup, new RegExp(`data-scene-location="${sceneKey}"`));
  }
});

test('holding, striking, breaking, flowing water and rescue are separate drawable stages', () => {
  const frames = ['hold-stone', 'strike-jar', 'crack-jar', 'flowing-water', 'saved'];
  const outputs = frames.map(sceneKey => render({ courseId: 'cn-23', step: 3, sceneKey }));
  assert.equal(new Set(outputs).size, frames.length);
  hasObject(outputs[0], 'stone'); hasObject(outputs[1], 'stone');
  assert.doesNotMatch(outputs[0], /data-scene-object="rescued-child"/);
  // Rescue now includes water falling and the wet child stepping out before
  // the preserved final illustration. Check the genuine ending, not a label
  // that would falsely claim the child has already escaped in the first frame.
  const rescue = getPolishedFrame({courseId:'cn-23',step:3,sceneKey:'saved'})!;
  assert.ok(rescue.sequence && rescue.sequence.frames.length >= 3);
  assert.ok(rescue.sequence.frames[0].objects.includes('flowing-water'));
  assert.ok(rescue.sequence.frames.some(frame=>frame.objects.includes('wet-clothes-water-drops')));
  const final = rescue.sequence.frames.at(-1)!;
  hasObject(renderToStaticMarkup(createElement(PaintedScene,{courseId:'cn-23',step:3,sceneKey:'saved',frame:final,fallback:null,paused:true})), 'rescued-child');
});

test('multiple active sound sources remain in the same illustration', () => {
  const tool = toolFor('cn-21');
  let state = createPrecisionState(tool);
  state = setPrecisionGain(tool, state, 'rain', .5);
  state = setPrecisionGain(tool, state, 'animals', .5);
  const view = getPrecisionView(tool, state);
  assert.deepEqual(view.activeLayers?.map(layer => layer.id), ['wind', 'rain', 'animals']);
  const markup = render({ courseId: 'cn-21', step: view.artStep, sceneKey: view.sceneKey, gains: state.gains });
  hasObject(markup, 'active-rain'); hasObject(markup, 'bird-and-cricket');
});

test('Luchai light control changes the path to moss rather than a whole-picture brightness layer', () => {
  const dark = render({ courseId: 'cn-20', step: 1, variant: 'luchai', sceneKey: 'moss', parameter: 0 });
  const lit = render({ courseId: 'cn-20', step: 1, variant: 'luchai', sceneKey: 'moss', parameter: 1 });
  hasObject(dark, 'moss'); hasObject(lit, 'moss');
  assert.doesNotMatch(dark, /data-scene-object="sunlight-path"/);
  hasObject(lit, 'sunlight-path');
});

test('Tianmen moves the observer boat while retaining fixed banks', () => {
  const far = render({ courseId: 'cn-20', step: 1, variant: 'wangtianmenshan', sceneKey: 'mountains', parameter: 0 });
  const near = render({ courseId: 'cn-20', step: 1, variant: 'wangtianmenshan', sceneKey: 'mountains', parameter: 1 });
  for (const markup of [far, near]) { hasObject(markup, 'fixed-left-bank'); hasObject(markup, 'fixed-right-bank'); hasObject(markup, 'observer-boat'); }
  assert.match(far, /data-observer-position="0"/); assert.match(near, /data-observer-position="1"/);
  // Complete painted viewpoints replace the old moving polygon boat.
  assert.notEqual(far.match(/data-polished-frame="(\d+)"/)?.[1], near.match(/data-polished-frame="(\d+)"/)?.[1]);
  assert.notDeepEqual(getPolishedFrame({courseId:'cn-20',step:1,variant:'wangtianmenshan',sceneKey:'mountains',parameter:0})?.crop,
    getPolishedFrame({courseId:'cn-20',step:1,variant:'wangtianmenshan',sceneKey:'mountains',parameter:1})?.crop);
});
