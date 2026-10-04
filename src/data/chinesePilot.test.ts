import test from 'node:test';
import assert from 'node:assert/strict';
import pilot from './chinesePilot.json';
import clips from './chinesePilotClips.json';
import inventory from './inventory.json';

const clipIndex = clips as Record<string, { text: string; pinyin: string; sourceRef: string; sourceKind: string }>;
const lexemeIndex = new Map(inventory.lexemes.map(item => [item.id, item]));
const lesson1 = pilot.lessons.find(lesson => lesson.courseId === 'cn-01')!;
const lesson4 = pilot.lessons.find(lesson => lesson.courseId === 'cn-04')!;

test('Chinese pilot uses the supplied revised edition and keeps paper verification pending', () => {
  assert.equal(pilot.schemaVersion, 1);
  assert.equal(pilot.edition.isbn, '978-7-107-39754-7');
  assert.equal(pilot.edition.status, 'public_preview_checked_paper_pending');
  assert.deepEqual(pilot.lessons.map(lesson => lesson.courseId), ['cn-01', 'cn-04']);
  for (const lesson of pilot.lessons) {
    assert.equal(lesson.status, 'public_preview_checked_paper_pending');
    assert.ok(pilot.sources.some(source => source.id === lesson.sourceId));
  }
});

test('the two pilots cover the exact revised recognition and writing character lists', () => {
  assert.equal(lesson1.recognitionCharacters.map(item => item.character).join(''), '绒昂扬凤墙晃');
  assert.equal(lesson1.writingCharacters.map(item => item.character).join(''), '坡球招呼飘扬读热闹粗壮洁');
  assert.equal(lesson4.recognitionCharacters.map(item => item.character).join(''), '庭未磨斜萧挑促');
  assert.equal(lesson4.writingCharacters.map(item => item.character).join(''), '庭相未寒径斜枫霜挑深落');
  for (const lesson of pilot.lessons) {
    for (const kind of ['recognitionCharacters', 'writingCharacters'] as const) {
      for (const item of lesson[kind]) {
        const existing = lexemeIndex.get(item.lexemeId!);
        assert.ok(existing, `${item.character} must link to the existing inventory`);
        assert.equal(existing.text, item.character);
        assert.equal(existing.courseId, lesson.courseId);
        assert.ok(item.pinyin && item.context);
        assert.ok(item.wordExamples.length >= 2);
        for (const example of item.wordExamples) {
          assert.ok(example.text.includes(item.character));
          assert.ok(example.pinyin);
          assert.equal(example.sourceKind, 'editorial_extension');
        }
      }
    }
  }
});

test('course one contains all eleven new-edition textbook words without silently borrowing the old list', () => {
  assert.deepEqual(lesson1.words.map(item => item.text),
    ['山坡', '学校', '飘扬', '课文', '声音', '招引', '热闹', '古老', '粗壮', '枝干', '洁白']);
  assert.ok(!lesson1.words.some(item => ['早晨', '穿戴', '鲜艳', '服装'].includes(item.text)));
  assert.equal(lesson4.words.length, 0, 'the poetry lesson has no independent textbook word-table row');
  for (const item of lesson1.words) {
    assert.equal(item.sourceKind, 'textbook_word');
    assert.equal(item.sourcePage, '114');
    assert.equal(lexemeIndex.get(item.lexemeId!)?.text, item.text);
    assert.ok(item.pinyin);
  }
});

test('each detective bank includes reading and glyph/grouping practice, without counting choice as writing', () => {
  assert.equal(pilot.practiceRules.choiceEvidence, 'recognition_only');
  for (const lesson of pilot.lessons) {
    assert.equal(lesson.detectiveQuestions.length, 12);
    assert.equal(lesson.detectiveQuestions.filter(question => question.kind === 'reading').length, 6);
    assert.equal(lesson.detectiveQuestions.filter(question => ['glyph', 'grouping'].includes(question.kind)).length, 6);
    assert.equal(new Set(lesson.detectiveQuestions.map(question => question.id)).size, 12);
    for (const question of lesson.detectiveQuestions) {
      assert.equal(new Set(question.options.map(option => option.id)).size, question.options.length);
      assert.equal(new Set(question.options.map(option => option.text)).size, question.options.length);
      assert.ok(question.options.some(option => option.id === question.answerId));
      assert.ok(question.explanation);
      for (const id of question.lexemeIds) assert.ok(id && lexemeIndex.has(id));
    }
  }
});

test('context-sensitive readings distinguish huang, mo, xie, tiao, xiang, and luo correctly', () => {
  const characterReadings = new Map(pilot.lessons.flatMap(lesson =>
    [...lesson.recognitionCharacters, ...lesson.writingCharacters].map(item => [item.character, item.pinyin])));
  for (const [character, expected] of Object.entries({ 晃: 'huàng', 磨: 'mó', 斜: 'xié', 挑: 'tiǎo', 相: 'xiāng', 落: 'luò' })) {
    assert.equal(characterReadings.get(character), expected);
  }
  const selectedAnswers = new Map(lesson4.detectiveQuestions.filter(item => item.kind === 'reading').map(item =>
    [item.prompt, item.options.find(option => option.id === item.answerId)!.text]));
  assert.equal(selectedAnswers.get('“镜未磨”的“磨”读什么？'), 'mó');
  assert.equal(selectedAnswers.get('“石径斜”的“斜”按普通话读什么？'), 'xié');
  assert.equal(selectedAnswers.get('“挑促织”的“挑”读什么？'), 'tiǎo');
  assert.equal(selectedAnswers.get('“两相和”的“相”读什么？'), 'xiāng');
});

test('paper writing banks cover every required character and do not expose target characters in the hint', () => {
  assert.equal(lesson1.writingItems.length, 14);
  assert.equal(lesson4.writingItems.length, 11);
  for (const lesson of pilot.lessons) {
    const covered = new Set(lesson.writingItems.flatMap(item => item.targetCharacters));
    for (const item of lesson.writingCharacters) assert.ok(covered.has(item.character), `${item.character} needs a writing task`);
    for (const item of lesson.writingItems) {
      assert.equal(item.evidence, 'paper_self_checked');
      assert.ok(item.pinyin && item.prompt.includes('提示：') && item.explanation);
      assert.ok(item.answers.length > 0);
      for (const target of item.targetCharacters) {
        assert.ok(!item.prompt.includes(target), `${item.id} exposes ${target} before writing`);
        assert.ok(item.answers.some(answer => answer.includes(target)));
      }
      for (const answer of item.answers) assert.ok(!item.prompt.includes(answer), `${item.id} exposes the entire answer`);
      for (const id of item.lexemeIds) assert.ok(lexemeIndex.has(id));
    }
  }
});

test('writing words added to cover characters remain editorial exercises, not invented textbook dictation requirements', () => {
  assert.deepEqual(lesson1.writingItems.filter(item => item.sourceKind === 'editorial_extension').map(item => item.answers[0]),
    ['皮球', '招呼', '读书']);
  assert.ok(lesson4.writingItems.every(item => item.sourceKind === 'editorial_extension'));
  assert.ok(lesson1.writingItems.every(item => !('dictationRequirement' in item)));
  assert.ok(lesson4.writingItems.every(item => !('dictationRequirement' in item)));
  assert.equal(pilot.practiceRules.writingEvidence, 'paper_self_checked');
  assert.ok(pilot.practiceRules.copyingPolicy.includes('不计独立写对'));
});

test('neutral-tone words preserve separate full-tone character readings', () => {
  assert.equal(lesson1.words.find(item => item.text === '热闹')?.pinyin, 'rè nao');
  assert.equal(lesson1.writingCharacters.find(item => item.character === '闹')?.pinyin, 'nào');
  assert.equal(lesson1.writingItems.find(item => item.answers[0] === '招呼')?.pinyin, 'zhāo hu');
  assert.equal(lesson1.writingCharacters.find(item => item.character === '呼')?.pinyin, 'hū');
});

test('all three new-edition poems are recited, while only Shan Xing is marked for textbook dictation', () => {
  assert.equal(lesson1.recitation.poems.length, 0);
  assert.equal(lesson1.recitationItems.length, 0);
  assert.ok(lesson1.recitation.requirementNote.includes('未指定'));
  assert.deepEqual(lesson4.recitation.poems.map(poem => poem.title), ['望洞庭', '山行', '夜书所见']);
  assert.ok(lesson4.recitation.poems.every(poem => poem.reciteRequirement === 'textbook_required'));
  assert.deepEqual(lesson4.recitation.poems.filter(poem => poem.dictationRequirement === 'textbook_required').map(poem => poem.title), ['山行']);
  assert.ok(lesson4.recitation.poems.every(poem => poem.requirementSourcePage === '15' && poem.status === 'public_preview_checked_paper_pending'));
});

test('poetry text preserves confirmed characters and full punctuation without publishing a modern prose passage', () => {
  const poems = lesson4.recitation.poems;
  assert.equal(poems[0].lines.map(line => line.text).join(''), '湖光秋月两相和，潭面无风镜未磨。遥望洞庭山水翠，白银盘里一青螺。');
  assert.equal(poems[1].lines.map(line => line.text).join(''), '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。');
  assert.equal(poems[2].lines.map(line => line.text).join(''), '萧萧梧叶送寒声，江上秋风动客情。知有儿童挑促织，夜深篱落一灯明。');
  for (const poem of poems) {
    assert.equal(poem.textLicense, 'public_domain');
    assert.equal(poem.lines.length, 4);
    for (const line of poem.lines) assert.match(line.text, /^[\u4e00-\u9fff]{7}[。，]$/u);
  }
  assert.ok(!JSON.stringify(pilot).includes('早晨，从山坡上，从坪坝里'));
});

test('six paper continuation prompts match the exact next line and carry separate dictation labels', () => {
  assert.equal(lesson4.recitationItems.length, 6);
  for (const item of lesson4.recitationItems) {
    const poem = lesson4.recitation.poems.find(poem => poem.id === item.poemId)!;
    const target = poem.lines.find(line => item.answerLineIds.includes(line.id))!;
    const index = poem.lines.indexOf(target);
    assert.ok(item.prompt.includes(poem.lines[index - 1].text));
    assert.ok(!item.prompt.includes(target.text));
    assert.deepEqual(item.answers, [target.text]);
    assert.equal(item.dictationRequirement, poem.dictationRequirement);
    assert.equal(item.evidence, 'paper_self_checked');
    assert.equal(item.audioId, target.audioId);
  }
});

test('every fixed recording reference exists, pronounces a whole word or poetic line, and is course-limited', () => {
  assert.equal(Object.keys(clips).length, 45);
  const references = pilot.lessons.flatMap(lesson => [
    ...lesson.recognitionCharacters, ...lesson.writingCharacters, ...lesson.words,
    ...lesson.writingItems, ...lesson.recitationItems, ...lesson.recitation.poems.flatMap(poem => poem.lines),
  ]);
  const used = new Set(references.map(item => item.audioId));
  assert.equal(used.size, Object.keys(clips).length);
  for (const item of references) assert.ok(clipIndex[item.audioId], `${item.audioId} missing`);
  for (const [id, clip] of Object.entries(clipIndex)) {
    assert.match(id, /^cn-(01|04)-clip-\d{2}$/);
    assert.ok(clip.text.length >= 2 && clip.text.length <= 12);
    assert.ok(clip.pinyin && clip.sourceRef.includes('1067004050'));
  }
  assert.equal(Object.values(clipIndex).find(clip => clip.text === '读书')?.pinyin, 'dú shū');
  assert.equal(Object.values(clipIndex).find(clip => clip.text === '知有儿童挑促织，')?.pinyin, 'zhī yǒu ér tóng tiǎo cù zhī');
});
