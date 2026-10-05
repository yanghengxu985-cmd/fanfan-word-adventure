import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { chinesePrecisionLessons } from '../data/chineseLessonPrecision';
import { getPolishedFrame } from '../components/chineseScenes/polishedFrames';
import type { PolishedFrame } from '../components/chineseScenes/polishedSceneTypes';
import { createPrecisionState, getPrecisionView, selectPrecisionOption, selectPrecisionStop, revealPrecisionOutcome, appendPrecisionRoute, linkPrecisionPair } from './chineseLessonPrecision';

function inspect(frame:PolishedFrame, context:string) {
  assert.ok(existsSync(path.resolve('public',frame.file)),`${context}: missing ${frame.file}`);
  assert.ok(frame.index>=0 && frame.index<frame.columns*frame.rows,`${context}: invalid cell`);
  assert.ok(frame.caption.length>0 && frame.objects.length>0,`${context}: missing scene meaning`);
  if(frame.crop) {
    assert.ok(Object.values(frame.crop).every(Number.isFinite),`${context}: nonfinite crop`);
    assert.ok(frame.crop.x>=0 && frame.crop.y>=0 && frame.crop.width>0 && frame.crop.height>0 && frame.crop.x+frame.crop.width<=900 && frame.crop.y+frame.crop.height<=600,`${context}: crop beyond selected cell`);
  }
  frame.sequence?.frames.forEach((item,index)=>inspect(item,`${context}/transition-${index}`));
}

test('every replaced reading frame and every actual tool selection resolves to a valid asset',()=>{
 const migrated=new Set(['cn-01','cn-02','cn-03','cn-05','cn-07','cn-09','cn-10','cn-11','cn-12','cn-13','cn-16','cn-17','cn-19','cn-21','cn-22','cn-24','cn-25','cn-26']);
 let checked=0;
 for(const lesson of chinesePrecisionLessons) {
  if(migrated.has(lesson.courseId)) for(let step=0;step<4;step++) {
    const frame=getPolishedFrame({courseId:lesson.courseId,step});
    assert.ok(frame,`${lesson.courseId} reading ${step} reverted to crude art`);inspect(frame,`${lesson.courseId}/reading-${step}`);checked++;
  }
  for(const tool of lesson.tools) {
    let state=createPrecisionState(tool);
    const states=[state];
    if(tool.kind==='compare') for(const option of tool.options) states.push(selectPrecisionOption(tool,state,option.id));
    if(tool.kind==='association') for(const source of tool.sources) states.push(linkPrecisionPair(tool,state,source.id,tool.targets[0].id));
    if(tool.kind==='route') for(const node of tool.nodes) states.push(appendPrecisionRoute(tool,state,node.id));
    if(tool.kind==='prediction') for(const stop of tool.stops){const selected=selectPrecisionStop(tool,state,stop.id);states.push(selected,revealPrecisionOutcome(tool,selected));}
    if(tool.kind==='sound') for(const layer of tool.layers) states.push({...state,gains:Object.fromEntries(tool.layers.map(item=>[item.id,item.id===layer.id?1:0]))});
    for(state of states) {
      const view=getPrecisionView(tool,state);
      const frame=getPolishedFrame({courseId:lesson.courseId,step:view.artStep,variant:view.artVariant,sceneKey:view.sceneKey,gains:tool.kind==='sound'?state.gains:undefined});
      if(migrated.has(lesson.courseId) && tool.kind!=='hotspot') assert.ok(frame,`${lesson.courseId}/${view.sceneKey} reverted to crude art`);
      if(frame){inspect(frame,`${lesson.courseId}/${view.sceneKey}`);checked++;}
    }
  }
 }
 assert.ok(checked>140,'Tool coverage unexpectedly narrowed');
});

test('prediction entrances keep unrevealed artwork separate from later clues',()=>{
 const hidden=getPolishedFrame({courseId:'cn-10',step:3,sceneKey:'ending-gate'})!;
 const revealed=getPolishedFrame({courseId:'cn-10',step:3,sceneKey:'ending-gate--revealed'})!;
 assert.notEqual(hidden.index,revealed.index);
 assert.ok(!hidden.objects.some(object=>/^(farmer|cow-ending|revealed-ending)/.test(object)));
 assert.ok(revealed.objects.includes('revealed-ending-entrances'));
});

test('the cricket reading returning to the mouth cannot reuse the stomach scene',()=>{
 const reading=getPolishedFrame({courseId:'cn-12',step:2})!;
 assert.ok(reading.objects.includes('cow-mouth'));
 assert.ok(reading.objects.includes('green-cricket-at-nostril'));
 assert.ok(!reading.objects.includes('second-stomach-story-space'));
});

test('multi-layer sound retains a painted common environment and silent mode has no active cues',()=>{
 const combined=getPolishedFrame({courseId:'cn-21',step:0,sceneKey:'soundscape',gains:{wind:.5,rain:.5,animals:.5,water:.5}})!;
 for(const object of ['wind-leaf-object','rain-struck-leaf','water-stream','bird-and-cricket']) assert.ok(combined.objects.includes(object));
 const quiet=getPolishedFrame({courseId:'cn-21',step:0,sceneKey:'soundscape',gains:{wind:0,rain:0,animals:0,water:0}})!;
 assert.ok(!quiet.objects.includes('active-rain'));
});
