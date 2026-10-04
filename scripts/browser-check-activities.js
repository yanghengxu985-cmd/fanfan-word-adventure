// Execute with playwright-cli run-code after root confirms the real server URL.
// Uses native Audio downloads/decoding/events. No play() or media events are mocked.
// Expected keys below are a compact snapshot of src/data/englishActivities.json.
// This script restores the browser's original progress/preferences on completion or failure.
async (page) => {
  const tasks = {"en01-scene-hello":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-01","promptText":"Hello!","promptAudioId":"activity-001","modelText":"Hi!","modelAudioId":"activity-002","dialogueAudioId":"activity-004","acceptedChoiceIds":["en01-scene-hello-choice-1","en01-scene-hello-choice-3"],"choices":[{"id":"en01-scene-hello-choice-1","text":"Hi!","audioId":"activity-002"},{"id":"en01-scene-hello-choice-2","text":"Goodbye!","audioId":"activity-003"},{"id":"en01-scene-hello-choice-3","text":"Hello!","audioId":"activity-001"}]},"en01-scene-morning":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-11","promptText":"Good morning, class!","promptAudioId":"activity-005","modelText":"Good morning, Miss Lin!","modelAudioId":"activity-006","dialogueAudioId":"activity-009","acceptedChoiceIds":["en01-scene-morning-choice-1"],"choices":[{"id":"en01-scene-morning-choice-1","text":"Good morning, Miss Lin!","audioId":"activity-006"},{"id":"en01-scene-morning-choice-2","text":"Good afternoon, Miss Lin!","audioId":"activity-007"},{"id":"en01-scene-morning-choice-3","text":"Goodbye, Miss Lin!","audioId":"activity-008"}]},"en01-scene-afternoon":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-12","promptText":"Good afternoon!","promptAudioId":"activity-010","modelText":"Good afternoon!","modelAudioId":"activity-010","dialogueAudioId":"activity-012","acceptedChoiceIds":["en01-scene-afternoon-choice-1"],"choices":[{"id":"en01-scene-afternoon-choice-1","text":"Good afternoon!","audioId":"activity-010"},{"id":"en01-scene-afternoon-choice-2","text":"Good morning!","audioId":"activity-011"},{"id":"en01-scene-afternoon-choice-3","text":"Goodbye!","audioId":"activity-003"}]},"en01-scene-goodbye":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-09","promptText":"Goodbye!","promptAudioId":"activity-003","modelText":"Bye!","modelAudioId":"activity-013","dialogueAudioId":"activity-014","acceptedChoiceIds":["en01-scene-goodbye-choice-1","en01-scene-goodbye-choice-3"],"choices":[{"id":"en01-scene-goodbye-choice-1","text":"Bye!","audioId":"activity-013"},{"id":"en01-scene-goodbye-choice-2","text":"Hello!","audioId":"activity-001"},{"id":"en01-scene-goodbye-choice-3","text":"Goodbye!","audioId":"activity-003"}]},"en01-scene-self":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-03","promptText":"I am Lin.","promptAudioId":"activity-015","modelText":"I am Lan.","modelAudioId":"activity-016","dialogueAudioId":"activity-018","acceptedChoiceIds":["en01-scene-self-choice-1"],"choices":[{"id":"en01-scene-self-choice-1","text":"I am Lan.","audioId":"activity-016"},{"id":"en01-scene-self-choice-2","text":"I am Lin.","audioId":"activity-015"},{"id":"en01-scene-self-choice-3","text":"I am a cat.","audioId":"activity-017"}]},"en01-scene-class":{"courseId":"en-01","kind":"scene","lexemeId":"en-01-word-08","promptText":"Hello, class!","promptAudioId":"activity-019","modelText":"Hello, Miss Lin!","modelAudioId":"activity-020","dialogueAudioId":"activity-022","acceptedChoiceIds":["en01-scene-class-choice-1","en01-scene-class-choice-3"],"choices":[{"id":"en01-scene-class-choice-1","text":"Hello, Miss Lin!","audioId":"activity-020"},{"id":"en01-scene-class-choice-2","text":"Goodbye, Miss Lin!","audioId":"activity-008"},{"id":"en01-scene-class-choice-3","text":"Hi, Miss Lin!","audioId":"activity-021"}]},"en02-scene-name":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-04","promptText":"What's your name?","promptAudioId":"activity-023","modelText":"My name is Lan.","modelAudioId":"activity-024","dialogueAudioId":"activity-026","acceptedChoiceIds":["en02-scene-name-choice-1"],"choices":[{"id":"en02-scene-name-choice-1","text":"My name is Lan.","audioId":"activity-024"},{"id":"en02-scene-name-choice-2","text":"My name is Lin.","audioId":"activity-025"},{"id":"en02-scene-name-choice-3","text":"Goodbye!","audioId":"activity-003"}]},"en02-scene-your":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-03","promptText":"Hello! What's your name?","promptAudioId":"activity-027","modelText":"My name is Lan.","modelAudioId":"activity-024","dialogueAudioId":"activity-028","acceptedChoiceIds":["en02-scene-your-choice-1"],"choices":[{"id":"en02-scene-your-choice-1","text":"My name is Lan.","audioId":"activity-024"},{"id":"en02-scene-your-choice-2","text":"My name is Lin.","audioId":"activity-025"},{"id":"en02-scene-your-choice-3","text":"Bye!","audioId":"activity-013"}]},"en02-scene-my":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-05","promptText":"My name is Lin.","promptAudioId":"activity-025","modelText":"My name is Lan.","modelAudioId":"activity-024","dialogueAudioId":"activity-029","acceptedChoiceIds":["en02-scene-my-choice-1"],"choices":[{"id":"en02-scene-my-choice-1","text":"My name is Lan.","audioId":"activity-024"},{"id":"en02-scene-my-choice-2","text":"My name is Lin.","audioId":"activity-025"},{"id":"en02-scene-my-choice-3","text":"Goodbye!","audioId":"activity-003"}]},"en02-scene-nice":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-11","promptText":"Nice to meet you!","promptAudioId":"activity-030","modelText":"Nice to meet you too!","modelAudioId":"activity-031","dialogueAudioId":"activity-032","acceptedChoiceIds":["en02-scene-nice-choice-1"],"choices":[{"id":"en02-scene-nice-choice-1","text":"Nice to meet you too!","audioId":"activity-031"},{"id":"en02-scene-nice-choice-2","text":"Goodbye!","audioId":"activity-003"},{"id":"en02-scene-nice-choice-3","text":"Bye!","audioId":"activity-013"}]},"en02-scene-mr":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-10","promptText":"Good morning, class!","promptAudioId":"activity-005","modelText":"Good morning, Mr Lin!","modelAudioId":"activity-033","dialogueAudioId":"activity-036","acceptedChoiceIds":["en02-scene-mr-choice-1"],"choices":[{"id":"en02-scene-mr-choice-1","text":"Good morning, Mr Lin!","audioId":"activity-033"},{"id":"en02-scene-mr-choice-2","text":"Good afternoon, Mr Lin!","audioId":"activity-034"},{"id":"en02-scene-mr-choice-3","text":"Goodbye, Mr Lin!","audioId":"activity-035"}]},"en02-scene-girl":{"courseId":"en-02","kind":"scene","lexemeId":"en-02-word-09","promptText":"I am Lin. I am a boy.","promptAudioId":"activity-037","modelText":"I am Lan. I am a girl.","modelAudioId":"activity-038","dialogueAudioId":"activity-040","acceptedChoiceIds":["en02-scene-girl-choice-1"],"choices":[{"id":"en02-scene-girl-choice-1","text":"I am Lan. I am a girl.","audioId":"activity-038"},{"id":"en02-scene-girl-choice-2","text":"I am Lan. I am a boy.","audioId":"activity-039"},{"id":"en02-scene-girl-choice-3","text":"Goodbye!","audioId":"activity-003"}]},"en01-listen-hello":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-01","promptText":"Hello!","promptAudioId":"activity-001","modelText":"Hello!","modelAudioId":"activity-001","acceptedChoiceIds":["en01-listen-hello-choice-1"],"choices":[{"id":"en01-listen-hello-choice-1"},{"id":"en01-listen-hello-choice-2"},{"id":"en01-listen-hello-choice-3"}]},"en01-listen-goodbye":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-09","promptText":"Goodbye!","promptAudioId":"activity-003","modelText":"Goodbye!","modelAudioId":"activity-003","acceptedChoiceIds":["en01-listen-goodbye-choice-1"],"choices":[{"id":"en01-listen-goodbye-choice-1"},{"id":"en01-listen-goodbye-choice-2"},{"id":"en01-listen-goodbye-choice-3"}]},"en01-listen-morning":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-11","promptText":"Good morning!","promptAudioId":"activity-011","modelText":"Good morning!","modelAudioId":"activity-011","acceptedChoiceIds":["en01-listen-morning-choice-1"],"choices":[{"id":"en01-listen-morning-choice-1"},{"id":"en01-listen-morning-choice-2"},{"id":"en01-listen-morning-choice-3"}]},"en01-listen-afternoon":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-12","promptText":"Good afternoon!","promptAudioId":"activity-010","modelText":"Good afternoon!","modelAudioId":"activity-010","acceptedChoiceIds":["en01-listen-afternoon-choice-1"],"choices":[{"id":"en01-listen-afternoon-choice-1"},{"id":"en01-listen-afternoon-choice-2"},{"id":"en01-listen-afternoon-choice-3"}]},"en01-listen-cat":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-06","promptText":"A cat.","promptAudioId":"activity-041","modelText":"A cat.","modelAudioId":"activity-041","acceptedChoiceIds":["en01-listen-cat-choice-1"],"choices":[{"id":"en01-listen-cat-choice-1"},{"id":"en01-listen-cat-choice-2"},{"id":"en01-listen-cat-choice-3"}]},"en01-listen-i":{"courseId":"en-01","kind":"listening","lexemeId":"en-01-word-03","promptText":"I.","promptAudioId":"activity-042","modelText":"I.","modelAudioId":"activity-042","acceptedChoiceIds":["en01-listen-i-choice-1"],"choices":[{"id":"en01-listen-i-choice-1"},{"id":"en01-listen-i-choice-2"},{"id":"en01-listen-i-choice-3"}]},"en02-listen-my":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-05","promptText":"My.","promptAudioId":"activity-043","modelText":"My.","modelAudioId":"activity-043","acceptedChoiceIds":["en02-listen-my-choice-1"],"choices":[{"id":"en02-listen-my-choice-1"},{"id":"en02-listen-my-choice-2"},{"id":"en02-listen-my-choice-3"}]},"en02-listen-your":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-03","promptText":"Your.","promptAudioId":"activity-044","modelText":"Your.","modelAudioId":"activity-044","acceptedChoiceIds":["en02-listen-your-choice-1"],"choices":[{"id":"en02-listen-your-choice-1"},{"id":"en02-listen-your-choice-2"},{"id":"en02-listen-your-choice-3"}]},"en02-listen-boy":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-07","promptText":"A boy.","promptAudioId":"activity-045","modelText":"A boy.","modelAudioId":"activity-045","acceptedChoiceIds":["en02-listen-boy-choice-1"],"choices":[{"id":"en02-listen-boy-choice-1"},{"id":"en02-listen-boy-choice-2"},{"id":"en02-listen-boy-choice-3"}]},"en02-listen-girl":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-09","promptText":"A girl.","promptAudioId":"activity-046","modelText":"A girl.","modelAudioId":"activity-046","acceptedChoiceIds":["en02-listen-girl-choice-1"],"choices":[{"id":"en02-listen-girl-choice-1"},{"id":"en02-listen-girl-choice-2"},{"id":"en02-listen-girl-choice-3"}]},"en02-listen-mr":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-10","promptText":"Mr Lin.","promptAudioId":"activity-047","modelText":"Mr Lin.","modelAudioId":"activity-047","acceptedChoiceIds":["en02-listen-mr-choice-1"],"choices":[{"id":"en02-listen-mr-choice-1"},{"id":"en02-listen-mr-choice-2"},{"id":"en02-listen-mr-choice-3"}]},"en02-listen-name":{"courseId":"en-02","kind":"listening","lexemeId":"en-02-word-04","promptText":"Name.","promptAudioId":"activity-048","modelText":"Name.","modelAudioId":"activity-048","acceptedChoiceIds":["en02-listen-name-choice-1"],"choices":[{"id":"en02-listen-name-choice-1"},{"id":"en02-listen-name-choice-2"},{"id":"en02-listen-name-choice-3"}]}};
  const initialUrl = new URL(page.url());
  initialUrl.hash = '';
  const base = initialUrl.href;
  const checks = [];
  const errors = [];
  const progressKey = 'fanfan-word-adventure:progress:v1';
  const preferencesKey = 'fanfan-word-adventure:preferences:v1';
  const originalStorage = await page.evaluate(({ progressKey, preferencesKey }) => ({
    progress: localStorage.getItem(progressKey), preferences: localStorage.getItem(preferencesKey),
  }), { progressKey, preferencesKey });
  page.on('pageerror', error => errors.push(error.message));
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };
  const go = async path => {
    await page.goto(base + '#' + path);
    await page.locator('main').waitFor();
    const round = path.match(/^\/play\/(en-\d{2})\/(context|recall)$/);
    if (round) {
      const prefix = round[1].replace('-', '') + '-' + (round[2] === 'context' ? 'scene' : 'listen') + '-';
      await page.locator('.english-adventure[data-activity-id^="' + prefix + '"]').waitFor();
    }
  };
  const progress = () => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{"version":1,"attempts":[]}'), progressKey);
  const attemptCount = async () => (await progress()).attempts.length;
  const section = () => page.locator('.english-adventure[data-activity-id]');
  const choices = () => section().locator('.ea-choice[data-choice-id]');
  const picks = () => section().locator('.ea-pick');
  const promptButton = () => section().locator('.ea-listen-button');
  const audioCount = () => page.evaluate(() => window.__qaActivityAudios.length);
  const audioState = index => page.evaluate(index => {
    const audio = window.__qaActivityAudios[index];
    return audio && { duration: audio.duration, paused: audio.paused, playbackRate: audio.playbackRate,
      events: [...audio.__qaActivityEvents] };
  }, index);
  const waitPlaying = async index => {
    await page.waitForFunction(index => {
      const audio = window.__qaActivityAudios[index];
      return audio && Number.isFinite(audio.duration) && audio.duration > 0
        && audio.__qaActivityEvents.includes('playing') && !audio.paused;
    }, index, { timeout: 20000 });
    return audioState(index);
  };
  const waitEnded = index => page.waitForFunction(index =>
    window.__qaActivityAudios[index]?.__qaActivityEvents.includes('ended'), index, { timeout: 30000 });
  const play = async locator => {
    const index = await audioCount();
    await locator.click();
    await page.waitForFunction(index => window.__qaActivityAudios.length > index, index, { timeout: 10000 });
    const state = await waitPlaying(index);
    assert(state.duration > 0 && state.playbackRate === 1, '实际 MP3 解码播放，未重复降低录音速度');
    return index;
  };
  const listenFully = async locator => {
    const index = await play(locator);
    await waitEnded(index);
    return index;
  };
  const disabledChoices = () => picks().evaluateAll(buttons => buttons.length > 0 && buttons.every(button => button.disabled));
  const currentTask = async () => {
    await section().waitFor();
    const id = await section().getAttribute('data-activity-id');
    const task = tasks[id];
    if (!task) throw new Error('活动 ID 没有对应的核对答案：' + id);
    return { id, ...task };
  };
  // data-choice-id is on the card; answer and sound remain separate real buttons.
  const pickChoice = id => section().locator('.ea-choice[data-choice-id="' + id + '"] .ea-pick');
  const availableChoiceIds = () => choices().evaluateAll(cards => cards.map(card => card.getAttribute('data-choice-id')));
  const feedback = () => section().locator('.ea-feedback');
  const nextButton = () => section().getByRole('button', { name: /^(去下一站|这次探险完成啦)$/ });

  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__qaActivityAudios = [];
    window.__qaActivitySpeechCalls = 0;
    function TrackedActivityAudio(src) {
      const audio = src === undefined ? new NativeAudio() : new NativeAudio(src);
      audio.__qaActivityEvents = [];
      for (const type of ['loadedmetadata', 'playing', 'pause', 'ended', 'error']) {
        audio.addEventListener(type, () => audio.__qaActivityEvents.push(type));
      }
      window.__qaActivityAudios.push(audio);
      return audio;
    }
    TrackedActivityAudio.prototype = NativeAudio.prototype;
    Object.setPrototypeOf(TrackedActivityAudio, NativeAudio);
    window.Audio = TrackedActivityAudio;
    if (window.speechSynthesis) {
      const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = utterance => {
        window.__qaActivitySpeechCalls += 1;
        return originalSpeak(utterance);
      };
    }
  });

  try {
    await page.evaluate(({ progressKey, preferencesKey }) => {
      localStorage.setItem(progressKey, JSON.stringify({ version: 1, attempts: [] }));
      localStorage.setItem(preferencesKey, JSON.stringify({ courseId: 'en-01', limit: 6 }));
    }, { progressKey, preferencesKey });
    await page.reload();
    await page.setViewportSize({ width: 1440, height: 1050 });
    const manifestResponse = await page.request.get(new URL('audio/english-activities/manifest.json', base).href);
    assert(manifestResponse.ok(), '独立活动音频清单可通过当前站点访问');
    const manifest = await manifestResponse.json();
    assert(manifest.voice === 'en-GB-SoniaNeural' && manifest.rate === '-12%' && manifest.locale === 'en-GB',
      '情景与听力使用已经选定的英式女声和清晰慢读');
    assert(Object.keys(manifest.entries).length === 48, '48 条活动录音完整存在且独立于词卡清单');
    for (const [id, task] of Object.entries(tasks)) {
      assert(manifest.entries[task.promptAudioId]?.text === task.promptText
        && manifest.entries[task.modelAudioId]?.text === task.modelText, id + ' 的提示与示范录音对应实际脚本');
      for (const choice of task.choices.filter(choice => choice.audioId)) {
        assert(manifest.entries[choice.audioId]?.text === choice.text, id + ' 的选项录音对应实际英文');
      }
    }

    const visited = new Set();
    const wrongKinds = new Set();
    let pauseTested = false;
    for (const courseId of ['en-01', 'en-02']) {
      await go('/course/' + courseId);
      assert(await page.getByRole('link', { name: /情景接话/ }).count() > 0
        && await page.getByRole('link', { name: /听音寻宝/ }).count() > 0,
        courseId + ' 保留两个清晰的新玩法入口');
      assert(await page.getByRole('link', { name: /词义宝箱/ }).count() > 0,
        courseId + ' 保留原有词义宝箱');
      for (const [mode, kind] of [['context', 'scene'], ['recall', 'listening']]) {
        await go('/play/' + courseId + '/' + mode);
        assert(await audioCount() === 0 || await page.evaluate(() => window.__qaActivityAudios.every(audio => audio.paused)),
          '进入新关卡不会自动播放声音');
        const roundBefore = await attemptCount();
        for (let step = 0; step < 6; step++) {
          const task = await currentTask();
          assert(task.courseId === courseId && task.kind === kind && !visited.has(task.id),
            task.id + ' 属于当前单元和玩法，没有重复抽题');
          visited.add(task.id);
          const before = await attemptCount();
          assert(await disabledChoices(), task.id + ' 首次选项在听完声音前锁定');
          assert(await section().getByRole('button', { name: /我自己想对了|看答案才想起来|我完成了，核对答案/ }).count() === 0,
            task.id + ' 没有自评或自己给自己打分的入口');
          if (kind === 'listening') {
            assert(await section().locator('.ea-heard-words, .ea-choice-words').count() === 0,
              task.id + ' 反馈前不展示提示英文或选项英文');
          }
          if (!pauseTested) {
            const index = await play(promptButton());
            await section().getByRole('button', { name: '暂停探险', exact: true }).click();
            assert((await audioState(index)).paused && await attemptCount() === before,
              '首次提示播放中暂停立即停声，尚未答题不记结果');
            await section().getByRole('button', { name: '继续探险', exact: true }).last().click();
            assert(await disabledChoices(), '未听完就暂停后，恢复仍需完整听一次');
            pauseTested = true;
          }
          const promptIndex = await play(promptButton());
          assert(await disabledChoices() && await attemptCount() === before,
            task.id + ' 实际播放开始仍不可抢答，不产生学习记录');
          await waitEnded(promptIndex);
          await picks().first().waitFor({ state: 'visible' });
          await page.waitForFunction(() => [...document.querySelectorAll('.english-adventure .ea-pick')].every(button => !button.disabled));
          if (kind === 'listening') {
            assert(await section().locator('.ea-heard-words, .ea-choice-words').count() === 0,
              task.id + ' 提示播放结束后仍需靠声音判断图片');
          } else {
            const optionSound = section().getByRole('button', { name: /^听选项 / }).first();
            await listenFully(optionSound);
            assert(await attemptCount() === before, task.id + ' 真实听完选项录音不计成绩');
          }
          const ids = await availableChoiceIds();
          const right = ids.find(id => task.acceptedChoiceIds.includes(id));
          const wrong = ids.find(id => !task.acceptedChoiceIds.includes(id));
          assert(Boolean(right) && Boolean(wrong), task.id + ' 实际随机选项保留合理答案与干扰项');
          if (!wrongKinds.has(kind)) {
            await pickChoice(wrong).click();
            await feedback().waitFor();
            const firstAttempt = (await progress()).attempts.at(-1);
            assert(await attemptCount() === before + 1 && firstAttempt.correct === false
              && firstAttempt.lexemeId === task.lexemeId && firstAttempt.skill === (kind === 'scene' ? 'context' : 'listening'),
              kind + ' 第一次选错准确记录一次对应能力的练习');
            assert(await disabledChoices(), '反馈出现后原选项锁定，不能重复提交');
            await pickChoice(wrong).click({ force: true });
            assert(await attemptCount() === before + 1, '重复点击已经锁定的错选项不重复记结果');
            await section().getByRole('button', { name: '再试一次', exact: true }).click();
            await pickChoice(right).click();
            await feedback().waitFor();
            assert(await attemptCount() === before + 1 && (await progress()).attempts.at(-1).correct === false,
              '看过示范再选对只算重试，第一次错误记录不会被改写或重复追加');
            wrongKinds.add(kind);
          } else {
            await pickChoice(right).click();
            await feedback().waitFor();
            const attempt = (await progress()).attempts.at(-1);
            assert(await attemptCount() === before + 1 && attempt.correct === true
              && attempt.lexemeId === task.lexemeId && attempt.skill === (kind === 'scene' ? 'context' : 'listening')
              && attempt.mode === (kind === 'scene' ? 'selection' : 'listening') && attempt.confirmedBy === 'auto',
              task.id + ' 由答案键记录一次相应能力的选择练习');
          }
          const recorded = await attemptCount();
          await section().getByRole('button', { name: '轮到你开口', exact: true }).click();
          assert(await section().getByText('这里不打分。', { exact: false }).count() > 0 && await attemptCount() === recorded,
            task.id + ' 可选口头练习不打分，也不写结果');
          await listenFully(section().locator('.ea-model').getByRole('button', { name: '听示范', exact: true }));
          assert(await attemptCount() === recorded, task.id + ' 听完示范不额外记录');
          if (task.dialogueAudioId) {
            const dialogueButton = section().getByRole('button', { name: '听完整对话', exact: true });
            await listenFully(dialogueButton);
            assert(await attemptCount() === recorded, task.id + ' 完整对话真实播完且不额外计分');
          }
          if (/en02-listen-(my|your)$/.test(task.id)) {
            await page.screenshot({ path: 'output/playwright/audio/' + task.id + '.png', fullPage: true });
          }
          const nextPlaying = await play(section().locator('.ea-model').getByRole('button', { name: '听示范', exact: true }));
          await nextButton().click();
          await page.waitForFunction(id => document.querySelector('.english-adventure[data-activity-id]')?.getAttribute('data-activity-id') !== id, task.id);
          assert((await audioState(nextPlaying)).paused, task.id + ' 换题或完成一轮立即停止上一段录音');
        }
        await page.getByRole('heading', { name: '这一趟小探险，到站啦！', exact: true }).waitFor();
        assert(await attemptCount() === roundBefore + 6, courseId + ' ' + kind + ' 六题完成且只记录六次首次选择');
      }
    }
    assert(visited.size === Object.keys(tasks).length, 'Unit 1/2 共 24 个情景和听力任务全部真实走通');

    const beforeNavigation = await attemptCount();
    await go('/play/en-02/context');
    const navIndex = await play(promptButton());
    await section().locator('.ea-exit').click();
    assert((await audioState(navIndex)).paused && await attemptCount() === beforeNavigation,
      '听提示时离开关卡立即停声，不把取消当成答错');

    await go('/play/en-01/recall');
    const abortTask = await currentTask();
    const abortUrl = new URL(manifest.entries[abortTask.promptAudioId].file, base).href;
    const beforeAbort = await attemptCount();
    let aborted = 0;
    const failAudio = async route => { aborted++; await route.abort('failed'); };
    await page.route(abortUrl, failAudio);
    const failedIndex = await audioCount();
    await promptButton().click();
    await page.waitForFunction(index => window.__qaActivityAudios[index]?.__qaActivityEvents.includes('error'), failedIndex, { timeout: 20000 });
    await section().getByText('声音暂时没加载出来，请再点一次。', { exact: true }).waitFor();
    assert(aborted > 0 && await disabledChoices() && await attemptCount() === beforeAbort,
      '真实提示音频请求中断不记答错，选项保持锁定并提示重试');
    await page.unroute(abortUrl, failAudio);
    await listenFully(promptButton());
    await page.waitForFunction(() => [...document.querySelectorAll('.english-adventure .ea-pick')].every(button => !button.disabled));
    const recoveredIds = await availableChoiceIds();
    await pickChoice(recoveredIds.find(id => abortTask.acceptedChoiceIds.includes(id))).click();
    await feedback().waitFor();
    assert(await attemptCount() === beforeAbort + 1 && (await progress()).attempts.at(-1).correct === true,
      '网络恢复后同一任务能正常听完并且只在回答时记录一次');

    const beforeTeacher = JSON.stringify(await progress());
    await go('/teacher');
    await page.locator('.teacher-controls select').first().selectOption('en-02');
    for (const mode of ['context', 'recall']) {
      await page.locator('.teacher-controls select').nth(1).selectOption(mode);
      const task = await currentTask();
      await listenFully(promptButton());
      await page.waitForFunction(() => [...document.querySelectorAll('.english-adventure .ea-pick')].every(button => !button.disabled));
      const ids = await availableChoiceIds();
      await pickChoice(ids.find(id => task.acceptedChoiceIds.includes(id))).click();
      await feedback().waitFor();
      const index = await play(section().locator('.ea-model').getByRole('button', { name: '听示范', exact: true }));
      await nextButton().click();
      assert((await audioState(index)).paused && JSON.stringify(await progress()) === beforeTeacher,
        '老师的 ' + mode + ' 演示播放、选择、换题都不写个人学习记录');
    }

    for (const width of [390, 820]) {
      await page.setViewportSize({ width, height: 844 });
      for (const courseId of ['en-01', 'en-02']) {
        for (const mode of ['context', 'recall']) {
          await go('/play/' + courseId + '/' + mode);
          await section().waitFor();
          assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
            width + 'px ' + courseId + ' ' + mode + ' 关卡无横向溢出');
          if (width === 390) await page.screenshot({ path: 'output/playwright/audio/' + courseId + '-' + mode + '-mobile.png', fullPage: true });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await go('/play/en-02/meaning');
    assert(await page.locator('.answers .answer').count() > 0 && await page.locator('.english-adventure').count() === 0,
      '原有词义宝箱仍使用自动判答案的原关卡');

    const reviewTask = Object.values(tasks).find(task => task.kind === 'listening' && task.courseId === 'en-02');
    await page.evaluate(({ key, lexemeId }) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      const localDate = yesterday.getFullYear() + '-' + String(yesterday.getMonth() + 1).padStart(2, '0') + '-' + String(yesterday.getDate()).padStart(2, '0');
      localStorage.setItem(key, JSON.stringify({ version: 1, attempts: [{
        id: 'qa-activity-listening-review', lexemeId, skill: 'listening', correct: true,
        assisted: false, confirmedBy: 'auto', timestamp: yesterday.toISOString(), localDate,
        mode: 'listening', sourceEvidence: 'qa-activity:prompt-ended:first-choice',
      }] }));
    }, { key: progressKey, lexemeId: reviewTask.lexemeId });
    await go('/review');
    await page.reload();
    await page.getByRole('button', { name: '开始复习', exact: true }).click();
    const due = await currentTask();
    assert(due.kind === 'listening' && due.lexemeId === reviewTask.lexemeId,
      '到期的英语听力记录进入新听音复习，不转换成自评回忆');
    await listenFully(promptButton());
    await page.waitForFunction(() => [...document.querySelectorAll('.english-adventure .ea-pick')].every(button => !button.disabled));
    const reviewIds = await availableChoiceIds();
    await pickChoice(reviewIds.find(id => due.acceptedChoiceIds.includes(id))).click();
    await feedback().waitFor();
    const reviewProgress = await progress();
    assert(reviewProgress.attempts.length === 2 && reviewProgress.attempts.at(-1).skill === 'listening'
      && reviewProgress.attempts.at(-1).mode === 'listening' && !reviewProgress.attempts.some(attempt => attempt.skill === 'recall'),
      '新复习保留听力能力，只记录实际听音选择结果');
    assert(await page.evaluate(() => window.__qaActivitySpeechCalls === 0), '新情景与听力不调用机械设备语音');
    assert(errors.length === 0, '全部情景、听力、老师、复习流程没有 pageerror');
    return { base, checks, errors, activitiesCovered: visited.size, activityAudioEntries: Object.keys(manifest.entries).length };
  } finally {
    await page.evaluate(({ progressKey, preferencesKey, originalStorage }) => {
      for (const [key, value] of [[progressKey, originalStorage.progress], [preferencesKey, originalStorage.preferences]]) {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      }
    }, { progressKey, preferencesKey, originalStorage });
    // Reload also restores the application's in-memory progress/preferences and
    // stops any clip left playing if an assertion interrupted the run.
    await page.reload();
    await page.locator('main').waitFor();
  }
}
