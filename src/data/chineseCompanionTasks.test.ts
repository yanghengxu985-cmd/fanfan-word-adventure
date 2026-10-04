import assert from 'node:assert/strict';
import test from 'node:test';
import semesterPlan from './chineseSemesterPlan.json';
import { chineseBookCompanions } from './chineseBookCompanions';
import { chineseCompanionTasks } from './chineseCompanionTasks';
import { getLessonWords, getLessonPaperWords } from './chineseLessons';

const entries = Object.entries(chineseCompanionTasks);
const companionById = new Map(chineseBookCompanions.map(item => [item.id, item]));

function nonempty(value: string, context: string) {
  assert.equal(typeof value, 'string', context);
  assert.ok(value.trim(), `${context} is empty`);
}

function unique(values: string[], context: string) {
  assert.equal(new Set(values).size, values.length, `${context} contains repeated content`);
}

test('23 companion tasks correspond one to one with the complete companion directory', () => {
  assert.equal(chineseBookCompanions.length, 23);
  assert.equal(entries.length, 23);
  unique(chineseBookCompanions.map(item => item.id), 'companion directory IDs');
  assert.deepEqual(entries.map(([id]) => id).sort(), chineseBookCompanions.map(item => item.id).sort());
  assert.equal(new Set(entries.map(([, task]) => task)).size, 23, 'each task has its own material');
  for (const companion of chineseBookCompanions) {
    assert.ok(Object.hasOwn(chineseCompanionTasks, companion.id), `${companion.id} must resolve directly without a default task`);
  }
  const counts = ['speaking', 'writing', 'garden', 'reading', 'example', 'review'].map(kind =>
    entries.filter(([id]) => companionById.get(id)?.kind === kind).length);
  assert.deepEqual(counts, [4, 8, 7, 1, 2, 1]);
});

test('every task has actionable steps, meaningful focus options, child input fields and a paper check', () => {
  for (const [id, task] of entries) {
    nonempty(task.intro, `${id} introduction`);
    assert.equal(task.steps.length, 3, `${id} teaching steps`);
    unique(task.steps.map(step => step.title), `${id} step titles`);
    unique(task.steps.map(step => step.detail), `${id} step details`);
    for (const [index, step] of task.steps.entries()) {
      nonempty(step.title, `${id} step ${index} title`);
      nonempty(step.detail, `${id} step ${index} content`);
      nonempty(step.prompt, `${id} step ${index} oral question`);
      assert.notEqual(step.detail, step.title, `${id} step ${index} needs actual teaching content`);
    }
    assert.ok(task.focusOptions.length >= 2, `${id} needs a real choice of focus`);
    unique(task.focusOptions.map(option => option.label), `${id} focus labels`);
    unique(task.focusOptions.map(option => option.detail), `${id} focus details`);
    for (const option of task.focusOptions) {
      nonempty(option.label, `${id} focus label`);
      nonempty(option.detail, `${id} focus detail`);
      assert.notEqual(option.label, option.detail, `${id} focus must explain what to do`);
    }
    assert.ok(task.fields.length >= 2 && task.fields.length <= 3, `${id} child input fields`);
    unique(task.fields.map(field => field.label), `${id} field labels`);
    for (const field of task.fields) {
      nonempty(field.label, `${id} child field label`);
      nonempty(field.placeholder, `${id} child field prompt`);
      assert.notEqual(field.label, field.placeholder, `${id} field needs a useful starting prompt`);
    }
    nonempty(task.paperTask, `${id} paper task`);
    assert.match(task.paperTask, /写|画|圈|标|记|讲|改|读|说/, `${id} needs a concrete action`);
    assert.equal(task.paperChecks.length, 3, `${id} paper checks`);
    unique(task.paperChecks, `${id} paper checks`);
    task.paperChecks.forEach(check => nonempty(check, `${id} paper check`));
  }
});

test('tasks supply distinct classroom content rather than a shared generic worksheet', () => {
  unique(entries.map(([, task]) => task.intro), 'task introductions');
  unique(entries.map(([, task]) => task.paperTask), 'task paper activities');
  unique(entries.map(([, task]) => task.steps.map(step => step.detail).join('\n')), 'task teaching sequences');
  unique(entries.map(([, task]) => task.focusOptions.map(option => `${option.label}:${option.detail}`).join('\n')), 'task focus choices');
  unique(entries.map(([, task]) => task.fields.map(field => `${field.label}:${field.placeholder}`).join('\n')), 'task writing prompts');
  unique(entries.map(([, task]) => task.paperChecks.join('\n')), 'task success criteria');
});

test('all four speaking tasks include direct conversation, and short exercises contain usable alternatives and explanations', () => {
  for (const [id, task] of entries) {
    const companion = companionById.get(id)!;
    if (companion.kind === 'speaking') {
      assert.ok(task.conversation && task.conversation.length >= 3, `${id} needs an actual exchange`);
      unique(task.conversation, `${id} conversation turns`);
      task.conversation.forEach(turn => nonempty(turn, `${id} conversation turn`));
      assert.match(task.conversation.join('\n'), /听众|解答者|对方/, `${id} must include a listener`);
      assert.match(task.conversation.join('\n'), /问|回应|回答|确认/, `${id} must give the child a response to make`);
    }
    if (task.exercise) {
      nonempty(task.exercise.prompt, `${id} exercise question`);
      assert.equal(task.exercise.options.length, 3, `${id} exercise options`);
      unique(task.exercise.options.map(option => option.trim()), `${id} exercise alternatives`);
      task.exercise.options.forEach(option => nonempty(option, `${id} exercise alternative`));
      nonempty(task.exercise.explanation, `${id} exercise explanation`);
    }
  }
});

test('companion source records preserve the distinction between confirmed directory entries and original teaching activities', () => {
  for (const companion of chineseBookCompanions) {
    nonempty(companion.note, `${companion.id} source boundary`);
    if (companion.kind === 'review') {
      assert.equal(companion.page, null, 'the original final review has no textbook page');
      assert.match(companion.note, /原创/);
      assert.match(companion.note, /核定|核对/);
    } else {
      assert.ok(companion.page !== null && Number.isInteger(companion.page) && companion.page > 0, companion.id);
      assert.match(companion.note, /纸本/, `${companion.id} detailed requirements must refer to the actual book`);
      assert.match(companion.note, /核对/, `${companion.id} must not claim that every detail is already verified`);
    }
  }
});

test('gardens one, two and six retain pending word lists and do not invent required recitation or dictation', () => {
  for (const unit of [1, 2, 6]) {
    const companion = chineseBookCompanions.find(item => item.kind === 'garden' && item.unit === unit)!;
    const course = semesterPlan.courses.find(item => item.kind === 'garden' && item.unitNumber === unit)!;
    const task = chineseCompanionTasks[companion.id];
    assert.ok(companion && course && task, `garden ${unit}`);
    for (const category of ['recognition', 'writing', 'words'] as const) {
      assert.deepEqual(course[category], [], `${companion.id} ${category} is pending, not a borrowed lesson bank`);
      assert.deepEqual(getLessonWords(course, category), [], `${companion.id} ${category} classroom bank`);
    }
    assert.deepEqual(getLessonPaperWords(course), [], companion.id);
    assert.equal(course.groupingStatus, 'pending', companion.id);
    assert.equal(course.recitation.status, 'pending', companion.id);
    assert.equal(course.dictation.status, 'pending', companion.id);
    assert.deepEqual(course.recitation.scope, [], companion.id);
    assert.deepEqual(course.dictation.scope, [], companion.id);
    assert.equal(course.paperVerified, false, companion.id);
    assert.match(companion.note, /日积月累.*待.*纸本核对/, `${companion.id} accumulation content remains unverified`);
    assert.match(task.steps[0].detail, /原创(?:句子|短段)/, `${companion.id} the example must identify its editorial origin`);
    // No accumulation original, poem or compulsory-memory bank is supplied by these tasks.
    for (const field of ['poems', 'classicalText', 'recitation', 'dictation', 'accumulationText'] as const) {
      assert.equal(Object.hasOwn(task, field), false, `${companion.id} cannot publish an unverified ${field}`);
    }
  }
});

test('all seven garden records leave accumulation originals and compulsory-memory scopes for paper verification', () => {
  const gardens = chineseBookCompanions.filter(item => item.kind === 'garden');
  assert.deepEqual(gardens.map(item => item.unit), [1, 2, 3, 4, 6, 7, 8]);
  for (const companion of gardens) {
    const course = semesterPlan.courses.find(item => item.kind === 'garden' && item.unitNumber === companion.unit)!;
    assert.ok(course, companion.id);
    assert.match(companion.note, /日积月累.*待纸本核对|日积月累.*待.*纸本核对/, companion.id);
    assert.equal(course.recitation.status, 'pending', companion.id);
    assert.equal(course.dictation.status, 'pending', companion.id);
    assert.deepEqual(course.recitation.scope, [], companion.id);
    assert.deepEqual(course.dictation.scope, [], companion.id);
  }
});

test('both reading examples return to the child’s own observation or draft and do not supply a complete model essay', () => {
  const examples = chineseBookCompanions.filter(item => item.kind === 'example');
  assert.deepEqual(examples.map(item => item.id), ['book-u5-example-dog', 'book-u5-example-bayberry']);
  for (const companion of examples) {
    const task = chineseCompanionTasks[companion.id];
    assert.match(companion.note, /正文.*须核对纸本/, `${companion.id} does not republish the modern original`);
    assert.match(task.steps[0].detail, /纸本例文/, `${companion.id} starts from the actual book`);
    assert.match(task.steps.at(-1)!.detail, /自己|我|手边|亲自/, `${companion.id} returns to the child's experience`);
    assert.match(task.steps.at(-1)!.detail, /观察|发现|见过/, `${companion.id} requires an observed detail`);
    assert.ok(task.fields.some(field => /自己/.test(field.label)), `${companion.id} needs a place for the child's own finding`);
    assert.match(task.paperTask, /自己/, `${companion.id} paper task must help the child's own work`);
    assert.match(task.paperChecks.join('\n'), /自己/, `${companion.id} checks the child's expression`);
    for (const field of ['fullText', 'sampleEssay', 'modelEssay', 'exampleText'] as const) {
      assert.equal(Object.hasOwn(task, field), false, `${companion.id} cannot supply a ready-made essay`);
    }
  }
  const dog = chineseCompanionTasks['book-u5-example-dog'];
  assert.match(dog.paperTask, /草稿.*补/, 'the dog example supports a concrete revision to the existing draft');
  assert.match(dog.exercise!.prompt, /原创/, 'the short animal comparison is editorial, not an excerpt from the example');
  const bayberry = chineseCompanionTasks['book-u5-example-bayberry'];
  assert.match(bayberry.paperTask, /观察卡/, 'the fruit example collects the child’s own details');
  assert.match(bayberry.steps.at(-1)!.detail, /品尝过/, 'taste descriptions require the child’s actual experience');
});

test('continuation, creative writing and review retain the child’s own choices and verified-book boundaries', () => {
  const continuation = chineseCompanionTasks['book-u3-writing'];
  assert.match(continuation.steps[0].detail, /纸本.*续写材料/);
  assert.match(continuation.fields[0].placeholder, /根据/, 'the continuation begins with an existing-story clue');
  assert.match(continuation.paperChecks.join('\n'), /前文依据/);
  const imaginative = chineseCompanionTasks['book-u4-writing'];
  assert.match(imaginative.steps[0].detail, /纸本素材要求/);
  assert.match(imaginative.paperTask, /自己的童话/);
  const review = chineseCompanionTasks['book-final-review'];
  assert.match(review.steps.at(-1)!.detail, /背默.*纸本.*已经明确/, 'the review cannot manufacture a compulsory-memory list');
  assert.match(review.paperChecks.join('\n'), /已核要求/);
});
