import test from 'node:test';
import assert from 'node:assert/strict';
import { courses, lexemes, type Lexeme } from '../data/curriculum';
import { checkAnswer, createQuestion, isQuestionEligible, makeRound, makeReviewRound, normalizeAnswer } from './questions';

function fixture(overrides: Partial<Lexeme> = {}): Lexeme {
  return { id: 'test-cat', courseId: 'test', subject: 'english', kind: 'english_word', text: 'cat', aliases: [],
    meaning: '猫', example: 'I have a cat.', verificationStatus: 'preview_verified', sourceRef: 'test', sourcePage: '10',
    sourceEdition: '2024', sourcePrint: '2025', meaningVerified: true, readingVerified: false,
    audioStatus: 'practice_only', optional: false, writingRequirement: 'pending', ...overrides };
}

test('pending evidence, optional entries and missing meaning cannot silently become main-route questions', () => {
  for (const change of [{ verificationStatus: 'pending_verification' }, { optional: true }, { meaningVerified: false }, { meaning: '' }] as Partial<Lexeme>[]) {
    assert.equal(isQuestionEligible(fixture(change), 'meaning'), false);
    assert.equal(isQuestionEligible(fixture(change), 'recall'), false);
  }
  assert.equal(isQuestionEligible(fixture(), 'spelling'), true, 'spelling is an explicit optional practice, not a required writing claim');
  assert.equal(isQuestionEligible(fixture({ writingRequirement: 'not_required' }), 'spelling'), false);
});

test('English spelling accepts approved forms, punctuation and whitespace without accepting wrong words', () => {
  const question = createQuestion(fixture({ text: "I'm", aliases: ['I am'], meaning: '我是' }), 'spelling')!;
  assert.equal(checkAnswer(question, ' I’m! '), true);
  assert.equal(checkAnswer(question, 'I   am.'), true);
  assert.equal(checkAnswer(question, 'I an'), false);
  assert.equal(normalizeAnswer('Ｈｅｌｌｏ！', 'english'), 'hello');
  const child = createQuestion(fixture({ text: 'child', aliases: ['children'], meaning: '孩子' }), 'spelling')!;
  assert.equal(checkAnswer(child, 'children'), false, 'plural is not a substitute spelling of the singular');
});

test('ambiguous English meaning cues cannot create automatic spelling evidence for a different word', () => {
  for (const text of ['hello', 'hi', 'goodbye', 'bye', 'mother', 'mum', 'father', 'dad',
    'grandfather', 'grandmother', 'look', 'see', 'meet', 'good', 'great', 'cool', 'Thank you.', 'thanks', 'I', 'me']) {
    const item = fixture({ text });
    assert.equal(isQuestionEligible(item, 'spelling'), false, text);
    assert.equal(createQuestion(item, 'spelling'), undefined, text);
    assert.equal(createQuestion(item, 'recall')!.selfCheck, true, `${text} remains available for oral self-check`);
  }
  for (const course of courses.filter(item => item.subject === 'english')) {
    const round = makeRound(course.id, 'spelling', 30);
    assert.equal(round.some(question => ['hello', 'hi', 'mother', 'mum', 'thanks', 'Thank you.'].includes(question.answer)), false);
  }
  const hello = lexemes.find(item => item.subject === 'english' && item.text === 'hello')!;
  assert.deepEqual(makeReviewRound([hello.id], 6, [{ lexemeId: hello.id, skill: 'spelling' }]), []);
});

test('English recall is oral self-check rather than a hidden spelling test', () => {
  const recall = createQuestion(fixture({ text: 'hello', meaning: '你好' }), 'recall')!;
  assert.equal(recall.selfCheck, true);
  assert.equal(checkAnswer(recall, 'hi'), false, 'automatic matching never grades an open oral task');
  assert.equal(recall.options, undefined);
});

test('unreviewed polyphonic characters stay cards; paper writing requires pronunciation and meaning', () => {
  const character = fixture({ subject: 'chinese', kind: 'writing_character', text: '禁', aliases: [],
    pinyin: undefined, meaning: '', meaningVerified: false, writingRequirement: 'required' });
  for (const mode of ['meaning', 'recall', 'writing', 'context'] as const) {
    assert.equal(createQuestion(character, mode), undefined);
  }
  const word = fixture({ subject: 'chinese', kind: 'textbook_word', text: '早晨', meaning: '天亮不久的时间',
    pinyin: 'zǎo chén', readingVerified: true, writingRequirement: 'required' });
  const paper = createQuestion(word, 'writing')!;
  assert.equal(paper.selfCheck, true);
  assert.ok(paper.clue!.includes('zǎo chén'));
  assert.equal(paper.prompt.includes('听到'), false);
  assert.equal(paper.clue!.includes('早晨'), false);
  assert.equal(checkAnswer(paper, '早晨'), false, 'an input field cannot certify paper handwriting');
  const revealingMeaning = fixture({ subject: 'chinese', kind: 'textbook_word', text: '厘米',
    meaning: '一百厘米是一米', pinyin: 'lí mǐ', readingVerified: true, writingRequirement: 'required' });
  for (const mode of ['recall', 'context', 'writing'] as const) {
    assert.equal(createQuestion(revealingMeaning, mode), undefined, 'retrieval clues never include the expected headword');
  }
});

test('context uses full lexical boundaries, and cloze is explicitly self checked', () => {
  assert.equal(createQuestion(fixture({ text: 'I', example: 'A family is here.' }), 'context'), undefined);
  assert.equal(createQuestion(fixture({ text: 'am', example: 'Sam is here.' }), 'context'), undefined);
  const question = createQuestion(fixture(), 'context')!;
  assert.equal(question.prompt, 'I have a ____.');
  assert.equal(question.answer, 'cat');
  assert.equal(question.selfCheck, true);
  assert.equal(checkAnswer(question, 'dog'), false);
  assert.equal(createQuestion(fixture({ example: 'A cat looks at another cat.' }), 'context'), undefined,
    'a repeated English word never remains visible after the gap');
});

test('Chinese reduplicated characters cannot reveal the target beside a context gap', () => {
  for (const [text, example] of [['萧', '树叶发出萧萧声。'], ['汪', '小狗汪汪地叫。']]) {
    assert.equal(createQuestion(fixture({ text, example, subject: 'chinese', kind: 'recognition_character',
      meaning: '描写听到的声音' }), 'context'), undefined, `${text} would otherwise remain visible`);
  }
});

test('meaning options omit aliases, synonyms and duplicate or overlapping definitions', () => {
  const hello = fixture({ id: 'hello', text: 'hello', meaning: '你好（打招呼）' });
  const pool = [hello,
    fixture({ id: 'hi', text: 'hi', meaning: '你好' }),
    fixture({ id: 'mom', text: 'mother', meaning: '妈妈' }),
    fixture({ id: 'mum', text: 'mum', meaning: '妈妈' }),
    fixture({ id: 'cat', text: 'cat', meaning: '猫' }),
    fixture({ id: 'bye', text: 'bye', meaning: '再见' }),
  ];
  for (let index = 0; index < 12; index += 1) {
    const question = createQuestion(hello, 'meaning', pool)!;
    assert.equal(question.options!.includes('你好'), false);
    assert.equal(new Set(question.options).size, question.options!.length);
    assert.equal(question.options!.filter(option => option === question.answer).length, 1);
  }
  assert.equal(createQuestion(hello, 'meaning', [hello]), undefined, 'insufficient reliable choices leave no invented question');
});

test('Chinese contained word forms and mixed character-word granularity are never distractors', () => {
  const ball = fixture({ id: 'character-ball', subject: 'chinese', kind: 'recognition_character', text: '球', meaning: '圆形的物体' });
  const pool = [ball,
    fixture({ id: 'skin-ball', subject: 'chinese', kind: 'textbook_word', text: '皮球', meaning: '带弹性的玩具' }),
    fixture({ id: 'another-ball', subject: 'chinese', kind: 'writing_character', text: '球', meaning: '体育项目中用的器具' }),
    fixture({ id: 'word-morning', subject: 'chinese', kind: 'textbook_word', text: '早晨', meaning: '太阳刚出来的一段时间' }),
    fixture({ id: 'cat-character', subject: 'chinese', kind: 'recognition_character', text: '猫', meaning: '会抓老鼠的一种动物' }),
    fixture({ id: 'river-character', subject: 'chinese', kind: 'writing_character', text: '河', meaning: '地面上水流经过的通道' }),
  ];
  const question = createQuestion(ball, 'meaning', pool)!;
  assert.equal(question.options!.includes('带弹性的玩具'), false);
  assert.equal(question.options!.includes('体育项目中用的器具'), false);
  assert.equal(question.options!.includes('太阳刚出来的一段时间'), false);
  assert.equal(question.options!.length, 3);
});

test('alphabet practice checks the requested letter case', () => {
  const item = fixture({ id: 'alpha-a', text: 'Aa', kind: 'alphabet', meaning: '', meaningVerified: false });
  const question = createQuestion(item, 'recall')!;
  assert.equal(checkAnswer(question, 'A'), true);
  assert.equal(checkAnswer(question, 'a'), false);
  const selection = createQuestion(item, 'meaning')!;
  assert.equal(new Set(selection.options).size, 4);
  assert.equal(selection.options!.includes('A'), true);
});

test('every generated course round has eligible references and only one correct option', () => {
  const byId = new Map(lexemes.map(item => [item.id, item]));
  for (const course of courses) {
    for (const mode of ['meaning', 'context', 'recall', 'spelling', 'writing'] as const) {
      const round = makeRound(course.id, mode, 6);
      assert.ok(round.length <= 6);
      assert.equal(new Set(round.map(question => question.id)).size, round.length);
      for (const question of round) {
        const item = byId.get(question.lexemeId)!;
        assert.ok(item, `${question.id} needs an existing lexeme`);
        assert.equal(isQuestionEligible(item, mode), true);
        if (question.options) {
          assert.equal(new Set(question.options).size, question.options.length);
          assert.equal(question.options.filter(option => checkAnswer(question, option)).length, 1);
        }
      }
    }
  }
  assert.deepEqual(makeRound('not-a-course', 'meaning', 6), []);
  assert.deepEqual(makeRound('en-01', 'meaning', 0), []);
  assert.deepEqual(makeReviewRound(['unknown-id']), []);
});

test('a seed reproduces both questions and shuffled choices', () => {
  assert.deepEqual(makeRound('en-01', 'meaning', 6, [], 42), makeRound('en-01', 'meaning', 6, [], 42));
});

test('review keeps each due skill and permits two skills for the same lexeme', () => {
  const item = lexemes.find(lexeme => lexeme.subject === 'english' && !lexeme.optional
    && isQuestionEligible(lexeme, 'context') && isQuestionEligible(lexeme, 'spelling'));
  assert.ok(item, 'review needs a genuinely playable real-data word');
  const targets = ['meaning', 'context', 'recall', 'spelling'].map(skill => ({ lexemeId: item.id, skill: skill as 'meaning' | 'context' | 'recall' | 'spelling' }));
  const round = makeReviewRound([item.id], 6, [...targets, targets[0]!]);
  assert.deepEqual(round.map(question => question.skill), ['meaning', 'context', 'recall', 'spelling']);
  assert.equal(round[0]!.mode, 'recall');
  assert.equal(round[0]!.selfCheck, true);
  assert.equal(round[0]!.answer, item.meaning);
  assert.equal(round[0]!.options, undefined);
  assert.equal(round[3]!.selfCheck, false);
  assert.deepEqual(makeReviewRound([item.id], 6, [{ lexemeId: 'unknown-id', skill: 'meaning' }]), []);
});

test('no generated real-data context leaves its gap answer visible in the sentence', () => {
  for (const item of lexemes) {
    const question = createQuestion(item, 'context');
    if (!question) continue;
    if (item.subject === 'chinese') {
      assert.equal(question.prompt.includes(question.answer), false, item.id);
    } else {
      const escaped = question.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      assert.equal(new RegExp(`(^|[^A-Za-z])${escaped}(?=$|[^A-Za-z])`, 'i').test(question.prompt), false, item.id);
    }
  }
});
