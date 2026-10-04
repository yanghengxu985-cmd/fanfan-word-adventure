import assert from 'node:assert/strict';
import test from 'node:test';
import { chinesePrecisionLessons, getChinesePrecisionLesson, getPrecisionPoems, type PrecisionTool } from './chineseLessonPrecision';
import { lessonCourseById, lessonMaterialById } from './chineseLessons';
import { lessonDesigns } from './chineseBookStudio';

test('the complete remaining catalogue is covered while dedicated polished lessons stay separate', () => {
  const dedicated = new Set(['cn-08', 'cn-14', 'cn-15']);
  const expected = [...lessonCourseById.keys()].filter(id => /^cn-\d{2}$/.test(id) && !dedicated.has(id)).sort();
  assert.equal(expected.length, 23);
  assert.deepEqual(chinesePrecisionLessons.map(lesson => lesson.courseId).sort(), expected);
  assert.equal(new Set(chinesePrecisionLessons.map(lesson => lesson.courseId)).size, expected.length);
  for (const id of dedicated) assert.equal(getChinesePrecisionLesson(id), undefined);
  for (const lesson of chinesePrecisionLessons) {
    assert.equal(lesson.type, lessonDesigns.find(design => design.courseId === lesson.courseId)?.format);
    assert.ok(lesson.tools.length > 0);
    assert.equal(lesson.paperTask.optional, true);
    assert.match(lesson.sourceNote, /不增加未核验/);
    assert.match(lesson.sourceNote, /2026纸本/);
  }
});

test('unit priorities produce different operational structures instead of identical text stages', () => {
  assert.equal(getChinesePrecisionLesson('cn-02')!.tools[0].kind, 'association');
  assert.equal(getChinesePrecisionLesson('cn-03')!.tools[0].kind, 'route');
  assert.equal(getChinesePrecisionLesson('cn-05')!.tools[0].kind, 'hotspot');
  assert.equal(getChinesePrecisionLesson('cn-07')!.tools[0].kind, 'sound');
  for (const id of ['cn-09', 'cn-10']) assert.equal(getChinesePrecisionLesson(id)!.tools[0].kind, 'prediction');
  for (const id of ['cn-16', 'cn-17', 'cn-19']) assert.equal(getChinesePrecisionLesson(id)!.tools[0].kind, 'association');
  assert.equal(getChinesePrecisionLesson('cn-21')!.tools[0].kind, 'sound');
  assert.equal(getChinesePrecisionLesson('cn-23')!.tools[0].kind, 'classical');
  assert.equal(new Set(chinesePrecisionLessons.flatMap(lesson => lesson.tools.map(tool => tool.kind))).size, 7);
  assert.equal(new Set(chinesePrecisionLessons.flatMap(lesson => lesson.tools.map(tool => tool.id))).size, 27);
});

test('all actionable references resolve and visual positions and parameters are bounded', () => {
  const checkTool = (tool: PrecisionTool) => {
    if (tool.kind === 'association') {
      for (const source of tool.sources) assert.ok(tool.relations.some(relation => relation.sourceId === source.id), `${tool.id}: source has no supported relationship`);
      for (const relation of tool.relations) {
        assert.ok(tool.sources.some(source => source.id === relation.sourceId));
        assert.ok(tool.targets.some(target => target.id === relation.targetId));
        assert.ok(relation.explanation.length > 5);
      }
    }
    if (tool.kind === 'route') {
      assert.deepEqual([...tool.expectedOrder].sort(), tool.nodes.map(node => node.id).sort());
      assert.notDeepEqual(tool.nodes.map(node => node.id), tool.expectedOrder, 'event bank must not be pre-solved');
    }
    if (tool.kind === 'hotspot') for (const spot of tool.spots) {
      assert.ok(spot.x > 0 && spot.x < 100 && spot.y > 0 && spot.y < 100);
      assert.ok(spot.zoom > 1 && spot.zoom <= 3);
    }
    if (tool.kind === 'compare' && tool.parameter) {
      assert.ok(tool.parameter.min < tool.parameter.max);
      assert.ok(tool.parameter.initial >= tool.parameter.min && tool.parameter.initial <= tool.parameter.max);
    }
    if (tool.kind === 'classical') for (const line of tool.lines) {
      assert.equal(line.chunks.join(''), line.text);
      for (const chunks of line.alternativeChunks ?? []) assert.equal(chunks.join(''), line.text);
      assert.ok(tool.actions.some(action => action.id === line.actionId));
    }
  };
  chinesePrecisionLessons.forEach(lesson => lesson.tools.forEach(checkTool));
});

test('six poems reuse existing public text and pinyin and keep their own scene references', () => {
  const expected = ['wangdongting', 'shanxing', 'yeshusuojian', 'luchai', 'wangtianmenshan', 'yinhushang'];
  const poems = ['cn-04', 'cn-20'].flatMap(id => getPrecisionPoems(id));
  assert.deepEqual(poems.map(poem => poem.id), expected);
  for (const id of ['cn-04', 'cn-20']) assert.equal(getPrecisionPoems(id), lessonMaterialById.get(id)!.poems);
  for (const poem of poems) assert.ok(poem.lines.every(line => line.text && line.pinyin));
  const variants = ['cn-04', 'cn-20'].flatMap(id => getChinesePrecisionLesson(id)!.tools.flatMap(tool => tool.kind === 'compare' ? tool.options.map(option => option.artVariant) : tool.kind === 'hotspot' || tool.kind === 'association' ? [tool.artVariant] : []));
  assert.deepEqual([...new Set(variants)].sort(), expected.sort());
});

test('prediction candidates have more than one plausible basis and no invented complete ending', () => {
  for (const id of ['cn-09', 'cn-10']) {
    const tool = getChinesePrecisionLesson(id)!.tools[0];
    assert.equal(tool.kind, 'prediction');
    if (tool.kind !== 'prediction') return;
    for (const stop of tool.stops) {
      assert.ok(stop.predictions.length >= 2);
      assert.ok(stop.predictions.every(prediction => prediction.basisIds.length > 0 && prediction.basisIds.every(basis => stop.evidence.some(evidence => evidence.id === basis))));
      assert.ok(!('answer' in stop));
    }
  }
  const turtle = getChinesePrecisionLesson('cn-09')!.tools[0];
  const dog = getChinesePrecisionLesson('cn-10')!.tools[0];
  if (turtle.kind !== 'prediction' || dog.kind !== 'prediction') throw new Error('missing prediction tools');
  assert.equal(turtle.stops.at(-1)!.outcome, undefined);
  assert.match(turtle.stops.at(-1)!.outcomeNote, /自己的续编/);
  assert.doesNotMatch(dog.stops[0].known + dog.stops[0].evidence.map(item => item.text).join(''), /小公鸡|狐狸|杜鹃|猎人|小母牛|农民|汪汪/);
  assert.doesNotMatch(dog.stops.at(-1)!.known + dog.stops.at(-1)!.predictions.map(item => item.text).join(''), /小母牛|农民|汪汪/);
  assert.match(dog.stops.at(-1)!.outcome!, /入口/);
});

test('reading-only lessons keep paper tasks optional and storytelling and scientific models stay distinct', () => {
  for (const id of ['cn-03', 'cn-07', 'cn-09', 'cn-10', 'cn-13', 'cn-19', 'cn-26']) {
    const lesson = getChinesePrecisionLesson(id)!;
    assert.match(lesson.sourceNote, /略读/);
    assert.match(lesson.sourceNote, /不新增必写/);
    assert.equal(lesson.paperTask.optional, true);
  }
  const cow = getChinesePrecisionLesson('cn-12')!.tools[0];
  assert.equal(cow.kind, 'route');
  if (cow.kind === 'route') assert.match(cow.routeNote, /不代表牛全部消化过程/);
  const classical = getChinesePrecisionLesson('cn-23')!.tools[0];
  if (classical.kind === 'classical') {
    assert.match(classical.lines.find(line => line.id === 'leave')!.meaning, /离开/);
    assert.match(classical.lines.find(line => line.id === 'break')!.meaning, /之指瓮/);
    assert.ok(classical.lines.some(line => (line.alternativeChunks?.length ?? 0) > 0));
    assert.deepEqual(classical.refs?.map(reference => reference.word), ['之', '去']);
    for (const reference of classical.refs ?? []) {
      assert.ok(classical.lines.some(line => line.id === reference.lineId && line.text.includes(reference.word)));
      assert.ok(reference.targets.some(target => target.id === reference.targetId));
    }
    assert.equal(classical.refs?.find(reference => reference.word === '之')?.targetId, 'jar');
    assert.equal(classical.refs?.find(reference => reference.word === '去')?.targetId, 'leave');
  }
});
