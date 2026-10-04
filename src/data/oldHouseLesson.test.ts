import test from 'node:test';
import assert from 'node:assert/strict';
import semesterPlan from './chineseSemesterPlan.json';
import {
  oldHouseLessonCopy, oldHouseMethodTips, oldHousePredictionCases,
  oldHouseRecognitionFocus, oldHouseRequirementNote, oldHouseStoryStops,
  oldHouseTransferCase, oldHouseWordFocus,
} from './oldHouseLesson';

const course = semesterPlan.courses.find(item => item.id === 'cn-08')!;

test('old-house coaching follows revised 8 / 11 / 14 banks, including shared 哦 without extra writing characters', () => {
  assert.deepEqual(oldHouseRecognitionFocus.map(item => item.character), course.recognition.map(item => item.text));
  assert.deepEqual(oldHouseLessonCopy.writingFocus.map(item => item.character), course.writing.map(item => item.text));
  assert.deepEqual(oldHouseWordFocus.map(item => item.text), course.words.map(item => item.text));
  assert.equal(new Set(oldHouseRecognitionFocus.map(item => item.character)).size, 8);
  assert.equal(new Set(oldHouseLessonCopy.writingFocus.map(item => item.character)).size, 11);
  assert.equal(new Set(oldHouseWordFocus.map(item => item.text)).size, 14);
  assert.ok(oldHouseRecognitionFocus.some(item => item.character === '哦'));
  assert.ok(oldHouseLessonCopy.writingFocus.some(item => item.character === '哦'));
  assert.ok(!oldHouseLessonCopy.writingFocus.some(item => ['孵', '偶', '尔'].includes(item.character)));
});

test('context readings and original coaching examples keep polyphonic words and light syllables consistent', () => {
  assert.deepEqual(oldHouseWordFocus.map(item => item.pinyin), course.words.map(item => item.pinyin));
  const allCharacters = new Map([...oldHouseRecognitionFocus, ...oldHouseLessonCopy.writingFocus].map(item => [item.character, item]));
  for (const [character, pinyin] of Object.entries({ 眯: 'mī', 哦: 'ò', 缝: 'fèng', 钻: 'zuān', 漂: 'piào', 孵: 'fū' })) {
    assert.equal(allCharacters.get(character)?.pinyin, pinyin);
  }
  for (const item of [...oldHouseRecognitionFocus, ...oldHouseLessonCopy.writingFocus]) {
    for (const field of ['pinyin', 'parts', 'attention', 'meaning'] as const) assert.ok(item[field].trim());
    assert.ok(item.words.length > 0 && item.words.every(word => word.includes(item.character)));
  }
  for (const word of oldHouseWordFocus) {
    assert.ok(word.meaning.trim() && word.attention.trim());
    assert.ok(word.example.includes(word.text));
  }
  assert.equal(oldHouseWordFocus.find(item => item.text === '漂亮')?.pinyin, 'piào liang');
  assert.equal(oldHouseWordFocus.find(item => item.text === '意思')?.pinyin, 'yì si');
  assert.equal(oldHouseWordFocus.find(item => item.text === '屋子')?.pinyin, 'wū zi');
});

test('story stopping points reveal no later visitor or local outcome in the known summary and evidence', () => {
  assert.deepEqual(oldHouseStoryStops.map(item => item.id), ['opening', 'cat', 'hen', 'spider']);
  assert.deepEqual(oldHousePredictionCases.map(item => item.id), ['cat', 'hen', 'spider']);
  const preReveal = oldHousePredictionCases.map(item => item.knownSummary + item.evidence.map(clue => clue.text).join(''));
  assert.doesNotMatch(preReveal[0], /母鸡|蜘蛛|答应|道谢|第二天/);
  assert.doesNotMatch(preReveal[1], /蜘蛛|孵出来|小鸡|带着|再次答应|又答应/);
  assert.doesNotMatch(preReveal[2], /讲故事|听故事|抓到|继续听|让小蜘蛛/);
  assert.doesNotMatch(oldHouseStoryStops[0].knownSummary, /小猫|母鸡|蜘蛛/);
  for (const scene of oldHousePredictionCases) {
    assert.equal(scene.knownSummary, oldHouseStoryStops.find(stop => stop.id === scene.id)?.knownSummary);
    assert.equal(scene.outcomeSummary, oldHouseStoryStops.find(stop => stop.id === scene.id)?.outcomeSummary);
    assert.ok(scene.outcomeSummary.trim());
    assert.notEqual(scene.knownSummary, scene.outcomeSummary);
  }
});

test('every prediction node permits multiple reasoned guesses and only references available relevant evidence', () => {
  for (const scene of [...oldHousePredictionCases, oldHouseTransferCase]) {
    const evidence = new Map(scene.evidence.map(item => [item.id, item]));
    assert.equal(evidence.size, scene.evidence.length);
    assert.ok(scene.predictions.filter(item => item.supported).length >= 2);
    assert.equal(new Set(scene.predictions.map(item => item.id)).size, scene.predictions.length);
    for (const prediction of scene.predictions) {
      assert.ok(prediction.explanation.trim());
      assert.equal(prediction.supported, prediction.basisIds.length > 0);
      for (const basisId of prediction.basisIds) {
        assert.ok(evidence.has(basisId), `${scene.id} has an unavailable evidence id ${basisId}`);
        assert.notEqual(evidence.get(basisId)?.source, '无关线索');
      }
    }
  }
  // These guesses deliberately differ from the author's outcome, yet remain
  // supported by the old house's intention or the time required for a task.
  assert.equal(oldHousePredictionCases[0].predictions.find(item => item.id === 'cat-rest')?.supported, true);
  assert.equal(oldHousePredictionCases[1].predictions.find(item => item.id === 'hen-hesitate')?.supported, true);
  assert.equal(oldHousePredictionCases[2].predictions.find(item => item.id === 'spider-time')?.supported, true);
});

test('comparison preserves an open ending and labels the transfer scenario separately from textbook facts', () => {
  const final = oldHousePredictionCases.find(item => item.id === 'spider')!;
  assert.match(final.outcomeSummary, /仍在听/);
  assert.match(final.compareNote, /课文没有全部写明/);
  assert.ok(!final.predictions.find(item => item.id === 'spider-forever')?.supported);
  assert.equal(oldHouseTransferCase.id, 'transfer');
  assert.ok(oldHouseTransferCase.evidence.filter(item => item.source === '情境线索').length > 0);
  assert.ok(!oldHouseTransferCase.evidence.some(item => item.source === '课文线索'));
  assert.match(oldHouseTransferCase.teachingNote, /原创/);
  assert.match(oldHouseTransferCase.compareNote, /不同环节/);
  assert.equal(oldHouseMethodTips.length, 3);
  assert.ok(oldHouseMethodTips.every(item => item.title.trim() && item.body.trim()));
});

test('lesson resources do not falsely promote pending paper, dictation or recitation verification', () => {
  assert.equal(course.paperVerified, false);
  assert.ok([...course.recognition, ...course.writing].every(item => !item.readingVerified));
  assert.equal(course.recitation.status, 'pending');
  assert.equal(course.dictation.status, 'pending');
  assert.match(oldHouseRequirementNote, /2026纸本/);
  assert.match(oldHouseRequirementNote, /仍待核对/);
  assert.match(oldHouseRequirementNote, /不改变全册核验状态/);
  assert.match(oldHouseRequirementNote, /原创概述/);
  assert.ok(oldHouseLessonCopy.sources.some(item => item.url.startsWith('https://www.pep.com.cn/') && item.title.includes('预测')));
  assert.ok(oldHouseLessonCopy.sources.every(item => /^https:\/\//.test(item.url)));
});
