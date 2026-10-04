// Run with playwright-cli run-code in a fresh browser profile after confirming the server URL.
// Native Audio is observed, never replaced with a fake play() or a synthetic ended event.
// This compact expectation snapshot is independent of src/data/englishLearningLab.ts.
// The original URL and all localStorage values are restored, including on failure.
async (page) => {
  const question = (id, phase, lexemeId, audioId, text, correct, options, speaker, swapped = false) =>
    ({ id, phase, lexemeId, audioId, text, correct, options, speaker, swapped });
  const cat = (id, phase, scene, other) => question(id, phase, 'en-01-word-06', 'activity-041', 'A cat.', scene, [scene, other]);
  const greet = (id, phase, word, place) => question(id, phase, word === 'hello' ? 'en-01-word-01' : 'en-01-word-09',
    word === 'hello' ? 'activity-001' : 'activity-003', word === 'hello' ? 'Hello!' : 'Goodbye!',
    word + '-' + place, ['hello-' + place, 'goodbye-' + place]);
  const name = (id, phase, word, speaker, swapped = false) => question(id, phase,
    word === 'my' ? 'en-02-word-05' : 'en-02-word-03', 'lab-' + word + '-name',
    word === 'my' ? 'My name.' : 'Your name.',
    'name-' + (word === 'my' ? speaker : speaker === 'Lin' ? 'Lan' : 'Lin').toLowerCase(),
    ['name-lin', 'name-lan'], speaker, swapped);
  const lessons = {
    cat: {
      hiddenWords: /\bcat\b/i,
      demos: [['cat-learn-1', 'activity-041', 'A cat.', 'cat-ginger'], ['cat-learn-2', 'activity-041', 'A cat.', 'cat-grey']],
      questions: [cat('cat-practice-1', 'guided', 'cat-ginger', 'boy'), cat('cat-practice-2', 'guided', 'cat-grey', 'girl'),
        cat('cat-check-1', 'check', 'cat-ginger', 'girl'), cat('cat-check-2', 'check', 'cat-grey', 'boy'),
        cat('cat-switch-1', 'transfer', 'cat-black', 'girl'), cat('cat-switch-2', 'transfer', 'cat-black', 'boy')],
    },
    greetings: {
      hiddenWords: /\b(?:hello|goodbye)\b/i,
      demos: [['hello-learn', 'activity-001', 'Hello!', 'hello-school'], ['goodbye-learn', 'activity-003', 'Goodbye!', 'goodbye-school']],
      questions: [greet('hello-practice', 'guided', 'hello', 'school'), greet('goodbye-practice', 'guided', 'goodbye', 'school'),
        greet('hello-check', 'check', 'hello', 'park'), greet('goodbye-check', 'check', 'goodbye', 'park'),
        greet('goodbye-switch', 'transfer', 'goodbye', 'library'), greet('hello-switch', 'transfer', 'hello', 'library')],
    },
    'my-your': {
      hiddenWords: /\b(?:my|your)\b/i,
      demos: [['lin-my-learn', 'activity-025', 'My name is Lin.', 'conversation'],
        ['lin-your-learn', 'activity-023', "What's your name?", 'conversation'],
        ['lan-my-learn', 'activity-024', 'My name is Lan.', 'conversation'],
        ['lan-your-learn', 'activity-023', "What's your name?", 'conversation']],
      questions: [name('my-practice', 'guided', 'my', 'Lin'), name('your-practice', 'guided', 'your', 'Lin'),
        name('my-check', 'check', 'my', 'Lan'), name('your-check', 'check', 'your', 'Lan'),
        name('your-switch', 'transfer', 'your', 'Lan', true), name('my-switch', 'transfer', 'my', 'Lan', true)],
    },
  };
  const clipText = { 'lab-guide': 'Listen. Look. Choose. You can listen again.',
    'lab-listen-choose': 'Listen and choose.', 'lab-my-name': 'My name.', 'lab-your-name': 'Your name.' };
  for (const lesson of Object.values(lessons)) {
    for (const [, id, text] of lesson.demos) clipText[id] = text;
    for (const item of lesson.questions) clipText[item.audioId] = item.text;
  }

  const originalUrl = page.url();
  const initialUrl = new URL(originalUrl);
  initialUrl.hash = '';
  const base = initialUrl.href;
  const progressKey = 'fanfan-word-adventure:progress:v1';
  const preferencesKey = 'fanfan-word-adventure:preferences:v1';
  const originalStorage = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key)])));
  const checks = [], errors = [], coveredSteps = new Set(), coveredLessons = new Set(), audioEvidence = [];
  let manifest, failure, failureRoute, restored = false, childQuestions = 0, teacherQuestions = 0, reviewQuestions = 0;
  const onPageError = error => errors.push(error.message);
  page.on('pageerror', onPageError);
  const assert = (condition, description) => {
    if (!condition) throw new Error(description);
    checks.push(description);
  };
  const section = () => page.locator('.english-learning-lab[data-lesson-id]');
  const next = () => section().getByRole('button', { name: 'Next', exact: true });
  const choices = () => section().locator('[data-action="choose"]');
  const pick = id => section().locator('.ell-option[data-option-id="' + id + '"] [data-action="choose"]');
  const target = () => section().locator('[data-action="listen-demo"], [data-action="listen-prompt"]');
  const helpDialog = () => page.getByRole('dialog', { name: 'Help', exact: true });
  const progress = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{"version":1,"attempts":[]}'), progressKey);
  const attemptCount = async () => (await progress()).attempts.length;
  const state = () => section().evaluate(element => ({ step: element.dataset.stepId, phase: element.dataset.phase,
    heard: element.dataset.heard, assisted: element.dataset.assisted, teacher: element.dataset.teacher, review: element.dataset.review }));
  const allDisabled = () => choices().evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled));
  const waitHeard = () => page.waitForFunction(() => document.querySelector('.english-learning-lab[data-step-id]')?.getAttribute('data-heard') === 'true');
  const go = async (lessonId, teacher = false) => {
    await page.goto(base + '#/english-lab/' + lessonId + (teacher ? '/teacher' : ''));
    // A completed lesson at the same exact hash otherwise keeps its existing React session.
    await page.reload();
    await page.locator('.english-learning-lab[data-lesson-id="' + lessonId + '"][data-teacher="' + teacher
      + '"][data-step-id="' + lessons[lessonId].demos[0][0] + '"]').waitFor();
    assert(await section().getAttribute('data-lesson-id') === lessonId, lessonId + ': route');
  };
  const waitStep = id => page.locator('.english-learning-lab[data-step-id="' + id + '"]').waitFor();
  const audioCount = () => page.evaluate(() => window.__qaLabAudios.length);
  const audioState = index => page.evaluate(index => {
    const audio = window.__qaLabAudios[index];
    if (!audio) return null;
    return { src: audio.__qaLabSrc, duration: audio.__qaLabDuration, playbackRate: audio.playbackRate,
      paused: audio.paused, events: audio.__qaLabEvents.map(event => ({ ...event })) };
  }, index);
  const waitPlaying = index => page.waitForFunction(index => {
    const audio = window.__qaLabAudios[index];
    return audio && Number.isFinite(audio.__qaLabDuration) && audio.__qaLabDuration > 0
      && audio.__qaLabEvents.some(event => event.type === 'playing') && !audio.paused;
  }, index, { timeout: 20000 });
  const waitEnded = index => page.waitForFunction(index =>
    window.__qaLabAudios[index]?.__qaLabEvents.some(event => event.type === 'ended'), index, { timeout: 30000 });
  const play = async (button, clipId) => {
    const index = await audioCount();
    await button.click();
    await page.waitForFunction(index => window.__qaLabAudios.length > index, index, { timeout: 10000 });
    await waitPlaying(index);
    const info = await audioState(index);
    const expected = manifest.entries[clipId];
    assert(info.src === new URL(expected.file, base).href && info.playbackRate === 1
      && Math.abs(info.duration - expected.durationSeconds) < .15, clipId + ': native MP3 playing');
    audioEvidence.push({ clipId, url: info.src, duration: info.duration, endedNaturally: false });
    return { index, evidence: audioEvidence.length - 1 };
  };
  const finishAudio = async played => {
    await waitEnded(played.index);
    const info = await audioState(played.index);
    assert(info.events.some(event => event.type === 'ended' && event.currentTime > 0),
      audioEvidence[played.evidence].clipId + ': native ended');
    audioEvidence[played.evidence].endedNaturally = true;
  };
  const listenFully = async (button, clipId) => {
    const played = await play(button, clipId);
    await finishAudio(played);
    return played;
  };
  const advance = async expected => {
    assert(await next().isEnabled(), 'Next unlocked after target/answer');
    await next().click();
    if (expected) await waitStep(expected);
    else await page.locator('.english-learning-lab[data-phase="finished"]').waitFor();
  };
  const cleanTest = async (lessonId, item) => {
    if (!['check', 'transfer'].includes(item.phase)) return;
    const text = await section().innerText();
    assert(!/[\u3400-\u9fff]/u.test(text) && !lessons[lessonId].hiddenWords.test(text), item.id + ': no Chinese/target word before answer');
    assert(await section().locator('.ell-answer-text:visible, .ell-guided-answer:visible').count() === 0
      && await section().locator('.ell-option[data-hint="true"]').count() === 0, item.id + ': no visible answer hint');
  };
  const verifyRole = async item => {
    if (!item.speaker) return;
    const visual = section().locator('.ell-context-scene svg[data-scene="conversation"]');
    assert(await visual.getAttribute('data-speaker') === item.speaker
      && await visual.getAttribute('data-swapped') === String(item.swapped), item.id + ': correct speaker/switch');
    const speakers = await visual.locator('.els-child.els-speaking').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-person')));
    const cards = await visual.locator('.els-name-card').evaluateAll(nodes => nodes.map(node => ({
      name: node.getAttribute('data-name'), transform: node.getAttribute('transform'), highlighted: node.getAttribute('data-highlighted'),
    })));
    const left = item.swapped ? 'Lan' : 'Lin';
    assert(speakers.length === 1 && speakers[0] === item.speaker && cards[0]?.name === left
      && cards[0].transform.includes('102') && cards[1]?.name !== left
      && cards.every(card => card.highlighted === 'false'), item.id + ': drawing follows role, not fixed position');
  };
  const help = async (clipId, stopEarly = false) => {
    await section().getByRole('button', { name: 'Help', exact: true }).click();
    await helpDialog().waitFor();
    assert(/[\u3400-\u9fff]/u.test(await helpDialog().locator('.ell-help-translation').innerText()), 'Help alone exposes Chinese');
    const played = await play(helpDialog().locator('[data-action="listen-help"]'), clipId);
    if (!stopEarly) await finishAudio(played);
    await helpDialog().getByRole('button', { name: 'Close help', exact: true }).click();
    await helpDialog().waitFor({ state: 'hidden' });
    assert((await audioState(played.index)).paused, 'Help close stops its audio');
    return played;
  };
  const assertAttempt = async (before, lessonId, item, choiceId, assisted, teacher = false, review = false) => {
    const saved = await progress();
    assert(saved.attempts.length === before + (teacher ? 0 : 1), item.id + ': first-answer count');
    if (teacher) return;
    const attempt = saved.attempts.at(-1);
    assert(attempt.lexemeId === item.lexemeId && attempt.skill === 'listening' && attempt.mode === 'listening'
      && attempt.confirmedBy === 'auto' && attempt.assisted === assisted && attempt.correct === (choiceId === item.correct)
      && attempt.sourceEvidence === `english-lab:${lessonId}:${review ? 'review' : item.phase}:${item.id}:prompt-ended:first-choice:${choiceId}`,
    item.id + ': precise listening evidence');
  };
  const demos = async (lessonId, testGuide = false) => {
    const list = lessons[lessonId].demos;
    for (let index = 0; index < list.length; index++) {
      const [id, clipId, text, scene] = list[index];
      await waitStep(id);
      const before = await attemptCount();
      assert((await state()).phase === 'learn' && await section().locator('.ell-answer-text').innerText() === text
        && await section().locator('.ell-demo-scene [data-scene="' + scene + '"]').count() === 1, id + ': learn scene/text');
      assert(await next().isDisabled(), id + ': demo Next locked before target');
      if (testGuide && index === 0) {
        await listenFully(section().getByRole('button', { name: 'Guide', exact: true }), 'lab-guide');
        assert((await state()).heard === 'false' && await next().isDisabled(), id + ': Guide cannot unlock demo');
      }
      const played = await play(target(), clipId);
      assert((await state()).heard === 'false' && await next().isDisabled(), id + ': Next locked during target');
      await finishAudio(played);
      await waitHeard();
      assert(await attemptCount() === before, id + ': learning playback records no answer');
      coveredSteps.add(id);
      await advance(list[index + 1]?.[0] ?? lessons[lessonId].questions[0].id);
    }
  };
  const answerQuestion = async (lessonId, item, options = {}) => {
    const { teacher = false, review = false, testInstructions = false, helpBefore = false, wrongRetry = false, secondWrong = false } = options;
    await waitStep(item.id);
    const before = await attemptCount();
    const entry = await state();
    assert(entry.phase === item.phase && entry.heard === 'false' && await allDisabled() && await next().isDisabled(), item.id + ': phase/initial locks');
    const optionIds = await section().locator('.ell-option').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-option-id')).sort());
    assert(JSON.stringify(optionIds) === JSON.stringify([...item.options].sort()), item.id + ': correct option pictures');
    await verifyRole(item);
    await cleanTest(lessonId, item);
    if (item.phase === 'guided') assert(await section().locator('.ell-answer-text').innerText() === item.text
      && await section().locator('.ell-option[data-option-id="' + item.correct + '"][data-hint="true"]').count() === 1, item.id + ': guided target visible');
    if (testInstructions) {
      await listenFully(section().locator('[data-action="listen-instruction"]'), 'lab-listen-choose');
      assert((await state()).heard === 'false' && await allDisabled() && await next().isDisabled(), item.id + ': instructions do not unlock');
      await listenFully(section().getByRole('button', { name: 'Guide', exact: true }), 'lab-guide');
      assert((await state()).heard === 'false' && await allDisabled() && await next().isDisabled(), item.id + ': Guide does not unlock');
    }
    if (helpBefore) {
      await help(item.audioId);
      assert((await state()).assisted === 'true' && (await state()).heard === 'false' && await allDisabled()
        && await next().isDisabled() && await attemptCount() === before, item.id + ': help marks assisted but cannot unlock');
      await cleanTest(lessonId, item);
    }
    const played = await play(target(), item.audioId);
    assert((await state()).heard === 'false' && await allDisabled() && await next().isDisabled(), item.id + ': locked until native target ends');
    await finishAudio(played);
    await waitHeard();
    assert(await choices().evaluateAll(nodes => nodes.every(node => !node.disabled)), item.id + ': choose unlocked after target');
    await cleanTest(lessonId, item);
    const wrong = item.options.find(id => id !== item.correct);
    const firstChoice = wrongRetry ? wrong : item.correct;
    await pick(firstChoice).click();
    await section().locator('.ell-feedback-title').filter({ hasText: wrongRetry ? /^Let’s try again\.$/ : /^Great!$/ }).waitFor();
    await assertAttempt(before, lessonId, item, firstChoice, item.phase === 'guided' || helpBefore, teacher, review);
    assert((await section().locator('.ell-answer-text').innerText()) === item.text, item.id + ': feedback reveals target');
    if (wrongRetry) {
      const originalAttempt = JSON.stringify((await progress()).attempts.at(-1));
      assert(await next().isDisabled(), item.id + ': first mistake requires practice');
      await help(item.audioId, true);
      assert(await attemptCount() === before + (teacher ? 0 : 1) && await next().isDisabled(), item.id + ': post-answer help adds no result');
      await section().getByRole('button', { name: 'Try again', exact: true }).click();
      assert((await state()).assisted === 'true' && await section().locator('.ell-option[data-hint="true"]').count() === 1, item.id + ': retry is guided');
      await listenFully(target(), item.audioId);
      await pick(secondWrong ? wrong : item.correct).click();
      await section().locator('.ell-feedback-title').filter({ hasText: secondWrong ? /^Let’s try again\.$/ : /^Great!$/ }).waitFor();
      assert(await attemptCount() === before + (teacher ? 0 : 1)
        && JSON.stringify((await progress()).attempts.at(-1)) === originalAttempt && await next().isEnabled(),
      item.id + ': retry neither overwrites nor adds first answer');
    }
    coveredSteps.add(item.id);
    if (!teacher && !review) childQuestions++;
    if (teacher) teacherQuestions++;
    if (review) reviewQuestions++;
  };

  await page.addInitScript(() => {
    if (window.__qaLabAudios) return;
    const NativeAudio = window.Audio;
    window.__qaLabAudios = [];
    window.__qaLabSpeechCalls = 0;
    function TrackedAudio(src) {
      const audio = src === undefined ? new NativeAudio() : new NativeAudio(src);
      audio.__qaLabSrc = audio.src;
      audio.__qaLabDuration = NaN;
      audio.__qaLabEvents = [];
      for (const type of ['loadedmetadata', 'playing', 'pause', 'ended', 'error']) {
        audio.addEventListener(type, () => {
          if (Number.isFinite(audio.duration) && audio.duration > 0) audio.__qaLabDuration = audio.duration;
          audio.__qaLabEvents.push({ type, currentTime: audio.currentTime, duration: audio.duration });
        });
      }
      window.__qaLabAudios.push(audio);
      return audio;
    }
    TrackedAudio.prototype = NativeAudio.prototype;
    Object.setPrototypeOf(TrackedAudio, NativeAudio);
    window.Audio = TrackedAudio;
    if (window.speechSynthesis) {
      const speak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = utterance => { window.__qaLabSpeechCalls++; return speak(utterance); };
    }
  });

  try {
    await page.evaluate(({ progressKey, preferencesKey }) => {
      localStorage.setItem(progressKey, JSON.stringify({ version: 1, attempts: [] }));
      localStorage.setItem(preferencesKey, JSON.stringify({ courseId: 'en-01', limit: 6 }));
    }, { progressKey, preferencesKey });
    // A hash-only goto does not create a document or execute addInitScript.
    // Reload also picks up the just-seeded storage in React's in-memory state.
    await page.reload();
    await page.locator('main').waitFor();
    const response = await page.request.get(new URL('audio/english-activities/manifest.json', base).href);
    assert(response.ok(), 'Activity manifest served');
    manifest = await response.json();
    assert(manifest.voice === 'en-GB-SoniaNeural' && manifest.rate === '-12%' && manifest.locale === 'en-GB', 'Selected voice/rate unchanged');
    for (const [id, text] of Object.entries(clipText)) assert(manifest.entries[id]?.text === text, id + ': fixed audio text');

    for (const [lessonId, lesson] of Object.entries(lessons)) {
      await go(lessonId);
      coveredLessons.add(lessonId);
      await demos(lessonId, true);
      for (let index = 0; index < lesson.questions.length; index++) {
        const item = lesson.questions[index];
        await answerQuestion(lessonId, item, {
          testInstructions: index === 0 || item.id === 'my-check',
          helpBefore: item.id === 'my-check',
          wrongRetry: item.id === 'cat-check-1' || item.id === 'cat-switch-1',
          secondWrong: item.id === 'cat-switch-1',
        });
        await advance(lesson.questions[index + 1]?.id);
      }
      assert(await section().getAttribute('data-phase') === 'finished', lessonId + ': all four phases complete');
      assert(await page.evaluate(() => window.__qaLabSpeechCalls === 0), lessonId + ': no device speech synthesis');
    }
    assert((await progress()).attempts.length === 18, 'Three child lessons save exactly eighteen first answers');

    // A stopped real prompt must remain locked even after a different clip ends.
    await go('my-your');
    const interrupted = await play(target(), 'activity-025');
    const guide = await play(section().getByRole('button', { name: 'Guide', exact: true }), 'lab-guide');
    assert((await audioState(interrupted.index)).paused
      && !(await audioState(interrupted.index)).events.some(event => event.type === 'ended'), 'Guide interrupts target without an ended event');
    await finishAudio(guide);
    assert((await state()).heard === 'false' && await next().isDisabled(), 'Other audio cannot finish interrupted target');
    const pausing = await play(target(), 'activity-025');
    await section().getByRole('button', { name: 'Pause', exact: true }).click();
    assert((await audioState(pausing.index)).paused && await section().getAttribute('data-paused') === 'true', 'Pause stops native playback');
    await section().locator('.ell-header').getByRole('button', { name: 'Continue', exact: true }).click();
    assert((await state()).heard === 'false' && await next().isDisabled(), 'Continue does not unlock unheard target');
    const exiting = await play(target(), 'activity-025');
    await section().getByRole('button', { name: 'Back', exact: true }).click();
    await page.locator('.english-learning-lab[data-phase="menu"]').waitFor();
    assert((await audioState(exiting.index)).paused, 'Back stops native playback');

    // Real request failure and recovery; never turn an unavailable recording into a wrong answer.
    await go('cat');
    await demos('cat');
    const failedQuestion = lessons.cat.questions[0];
    const beforeFailure = await attemptCount();
    const failUrl = new URL(manifest.entries[failedQuestion.audioId].file, base).href;
    let aborted = 0;
    const abortAudio = async route => { aborted++; await route.abort('failed'); };
    await page.route(failUrl, abortAudio);
    failureRoute = { url: failUrl, handler: abortAudio };
    const failedIndex = await audioCount();
    await target().click();
    await page.waitForFunction(index => window.__qaLabAudios[index]?.__qaLabEvents.some(event => event.type === 'error'), failedIndex, { timeout: 20000 });
    await section().locator('.ell-audio-status.is-error').filter({ hasText: /^No sound\. Please try again\.$/ }).waitFor();
    assert(aborted > 0 && await allDisabled() && await next().isDisabled() && await attemptCount() === beforeFailure, 'Native audio failure keeps choices locked and saves no mistake');
    await page.unroute(failUrl, abortAudio);
    failureRoute = undefined;
    await listenFully(target(), failedQuestion.audioId);
    await waitHeard();
    await pick(failedQuestion.correct).click();
    await section().locator('.ell-feedback-title').filter({ hasText: /^Great!$/ }).waitFor();
    await assertAttempt(beforeFailure, 'cat', failedQuestion, failedQuestion.correct, true);
    assert(!await section().locator('.ell-audio-status.is-error').count(), 'Audio failure recovers through real replay');

    const teacherBefore = JSON.stringify(await progress());
    for (const [lessonId, lesson] of Object.entries(lessons)) {
      await go(lessonId, true);
      assert((await state()).teacher === 'true', lessonId + ': explicit teacher mode');
      await demos(lessonId);
      for (let index = 0; index < lesson.questions.length; index++) {
        await answerQuestion(lessonId, lesson.questions[index], { teacher: true });
        await advance(lesson.questions[index + 1]?.id);
      }
      assert(JSON.stringify(await progress()) === teacherBefore, lessonId + ': entire teacher lesson saves no personal progress');
    }

    // Deliberately seed another ability on a lab word and an old-game listening record.
    // Only the lab-origin listening target should enter this lab review.
    await page.evaluate(key => {
      const date = new Date(); date.setDate(date.getDate() - 1); date.setHours(12, 0, 0, 0);
      const localDate = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const saved = (id, lexemeId, skill, mode, sourceEvidence) => ({ id, lexemeId, skill, mode, sourceEvidence,
        correct: true, assisted: false, confirmedBy: 'auto', timestamp: date.toISOString(), localDate });
      localStorage.setItem(key, JSON.stringify({ version: 1, attempts: [
        saved('qa-lab-your', 'en-02-word-03', 'listening', 'listening', 'english-lab:my-your:check:your-check:prompt-ended:first-choice:name-lin'),
        saved('qa-lab-my-meaning', 'en-02-word-05', 'meaning', 'selection', 'qa-meaning'),
        saved('qa-old-cat', 'en-01-word-06', 'listening', 'listening', 'en01-listen-cat:prompt-ended:first-choice:cat'),
      ] }));
    }, progressKey);
    await page.goto(base + '#/review');
    await page.reload();
    await page.locator('main').waitFor();
    const labReview = page.getByRole('region', { name: '英语体验课复习', exact: true });
    await labReview.waitFor();
    assert(await labReview.getByRole('button').count() === 1, 'Review groups include only lab-origin listening targets');
    await labReview.getByRole('button').click();
    const reviewList = lessons['my-your'].questions.filter(item => item.phase !== 'guided' && item.lexemeId === 'en-02-word-03');
    const beforeReview = await attemptCount();
    for (let index = 0; index < reviewList.length; index++) {
      const item = reviewList[index];
      await waitStep(item.id);
      assert((await state()).review === 'true' && item.phase !== 'guided', item.id + ': review skips learn/guided');
      await answerQuestion('my-your', item, { review: true });
      await advance(reviewList[index + 1]?.id);
    }
    const reviewSaved = await progress();
    assert(reviewSaved.attempts.length === beforeReview + 2 && reviewSaved.attempts.slice(beforeReview).every(attempt =>
      attempt.lexemeId === 'en-02-word-03' && attempt.skill === 'listening' && attempt.mode === 'listening'
      && attempt.sourceEvidence.startsWith('english-lab:my-your:review:')), 'Review retains only the same word and listening ability');
    await section().getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('heading', { name: '复习背包', exact: true }).waitFor();
    assert(await page.locator('.app-shell.game-focus').count() === 0, 'Review exit restores ordinary navigation');
    assert(errors.length === 0, 'No application pageerrors');
  } catch (error) {
    failure = error;
    errors.push('CHECK FAILED: ' + error.message);
  } finally {
    try {
      if (failureRoute) await page.unroute(failureRoute.url, failureRoute.handler);
      await page.evaluate(storage => {
        localStorage.clear();
        for (const [key, value] of Object.entries(storage)) localStorage.setItem(key, value);
      }, originalStorage);
      await page.goto(originalUrl);
      await page.reload();
      await page.locator('main').waitFor();
      const actual = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])));
      restored = JSON.stringify(actual) === JSON.stringify(Object.fromEntries(Object.entries(originalStorage).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)));
      if (!restored) throw new Error('Original localStorage was not restored exactly');
    } catch (error) {
      failure = failure || error;
      errors.push('RESTORE FAILED: ' + error.message);
    }
    page.off('pageerror', onPageError);
  }
  const report = { base, checks, checkCount: checks.length, errors, storageRestored: restored,
    lessonsCovered: [...coveredLessons], stepsCovered: coveredSteps.size, childQuestionCount: childQuestions,
    teacherQuestionCount: teacherQuestions, reviewQuestionCount: reviewQuestions,
    nativePlayCount: audioEvidence.length, nativeEndedCount: audioEvidence.filter(item => item.endedNaturally).length };
  if (failure || errors.length) throw new Error(JSON.stringify(report));
  return report;
}
