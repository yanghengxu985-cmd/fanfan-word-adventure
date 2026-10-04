// Execute with playwright-cli run-code in a dedicated QA browser session.
// Root must open the English course on the real dev/production URL first.
// Audio is instrumented, never mocked: Chromium downloads, decodes and plays the MP3s.
async (page) => {
  const initialUrl = new URL(page.url());
  initialUrl.hash = '';
  const base = initialUrl.href;
  const checks = [];
  const errors = [];
  const browserMediaRequests = [];
  const progressKey = 'fanfan-word-adventure:progress:v1';
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('.mp3')) browserMediaRequests.push(request.url()); });
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
    checks.push(message);
  };
  const go = async path => {
    await page.goto(base + '#' + path);
    await page.locator('main').waitFor();
  };
  const progress = () => page.evaluate(key => localStorage.getItem(key), progressKey);
  const audioCount = () => page.evaluate(() => window.__qaAudios.length);
  const audioState = index => page.evaluate(index => {
    const audio = window.__qaAudios[index];
    return audio && {
      src: audio.currentSrc || audio.src,
      duration: audio.duration,
      currentTime: audio.currentTime,
      playbackRate: audio.playbackRate,
      paused: audio.paused,
      ended: audio.ended,
      error: audio.error?.code ?? null,
      events: [...audio.__qaEvents],
    };
  }, index);
  const waitPlaying = async index => {
    await page.waitForFunction(index => {
      const audio = window.__qaAudios[index];
      return audio && Number.isFinite(audio.duration) && audio.duration > 0
        && audio.__qaEvents.includes('playing') && !audio.paused;
    }, index, { timeout: 20000 });
    return audioState(index);
  };
  const clickAudio = async locator => {
    const index = await audioCount();
    await locator.click();
    await page.waitForFunction(index => window.__qaAudios.length > index, index);
    await waitPlaying(index);
    return index;
  };

  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.__qaAudios = [];
    window.__qaSpeechCalls = 0;
    function TrackedAudio(src) {
      const audio = src === undefined ? new NativeAudio() : new NativeAudio(src);
      audio.__qaEvents = [];
      for (const type of ['loadedmetadata', 'playing', 'pause', 'ended', 'error']) {
        audio.addEventListener(type, () => audio.__qaEvents.push(type));
      }
      window.__qaAudios.push(audio);
      return audio;
    }
    TrackedAudio.prototype = NativeAudio.prototype;
    Object.setPrototypeOf(TrackedAudio, NativeAudio);
    window.Audio = TrackedAudio;
    if (new URL(location.href).searchParams.get('__qaNoSpeech') === '1') {
      Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    } else if (window.speechSynthesis) {
      const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = utterance => {
        window.__qaSpeechCalls += 1;
        return originalSpeak(utterance);
      };
    }
  });
  await page.reload();
  await go('/course/en-01');
  await page.setViewportSize({ width: 1440, height: 1050 });
  assert(await page.getByText('英式女声 · 清晰慢读', { exact: false }).count() > 0,
    '英语词卡明确标注英式女声与清晰慢读');

  const manifestResponse = await page.request.get(new URL('audio/english/manifest.json', base).href, { timeout: 20000 });
  assert(manifestResponse.ok(), '固定英语音频清单在当前站点可读取');
  const manifest = await manifestResponse.json();
  assert(manifest.schemaVersion === 1 && manifest.voice === 'en-GB-SoniaNeural'
    && manifest.locale === 'en-GB' && manifest.rate === '-12%', '音频清单固定为同一英式女声与制作语速');
  const entries = Object.entries(manifest.entries);
  assert(entries.length === 153, '音频清单覆盖全部 127 条英语单元记录与 26 个字母');
  const helloEntry = entries.find(([, entry]) => entry.text === 'hello')?.[1];
  assert(Boolean(helloEntry), '音频清单有 hello 实际文件');
  const uniqueFiles = new Map();
  for (const [id, entry] of entries) {
    if (!/^en-/.test(id) || !/^audio\/english\/[A-Za-z0-9_-]+\.mp3$/.test(entry.file)
      || !Number.isInteger(entry.bytes) || entry.bytes < 100
      || !Number.isFinite(entry.durationSeconds) || entry.durationSeconds <= 0) {
      throw new Error('音频清单条目不完整：' + id);
    }
    const metadata = manifest.files?.[entry.file];
    const sha256 = entry.sha256 || metadata?.sha256;
    if (!/^[a-f0-9]{64}$/i.test(sha256 || '') || metadata?.bytes !== entry.bytes) {
      throw new Error('音频缺少完整哈希或元数据不一致：' + entry.file);
    }
    const previous = uniqueFiles.get(entry.file);
    if (previous && (previous.bytes !== entry.bytes || previous.sha256 !== sha256)) {
      throw new Error('共用音频文件的校验信息不一致：' + entry.file);
    }
    uniqueFiles.set(entry.file, { ...entry, sha256 });
  }
  const assets = [...uniqueFiles.values()];
  const assetResults = [];
  // Bounded batches keep production-host verification small and predictable.
  for (let offset = 0; offset < assets.length; offset += 6) {
    const batch = await Promise.all(assets.slice(offset, offset + 6).map(async entry => {
      const response = await page.request.get(new URL(entry.file, base).href, { timeout: 20000 });
      if (!response.ok()) throw new Error('MP3 请求失败：' + entry.file + ' HTTP ' + response.status());
      const body = await response.body();
      const type = response.headers()['content-type'] || '';
      const mp3Header = body.subarray(0, 3).toString('ascii') === 'ID3'
        || body[0] === 0xff && (body[1] & 0xe0) === 0xe0;
      if (!mp3Header || /text\/|json|html/i.test(type) || body.length !== entry.bytes) {
        throw new Error('MP3 类型或字节数校验失败：' + entry.file);
      }
      if (entry.sha256) {
        const hash = await page.evaluate(async bytes => {
          const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes));
          return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
        }, Array.from(body));
        if (hash !== entry.sha256.toLowerCase()) throw new Error('MP3 SHA-256 不一致：' + entry.file);
      }
      return { file: entry.file, bytes: body.length, sha256Checked: Boolean(entry.sha256) };
    }));
    assetResults.push(...batch);
  }
  checks.push(assetResults.length + ' 个不同 MP3 均通过真实 HTTP、文件头、字节数及已有 SHA-256 校验');
  assert(await audioCount() === 0 && browserMediaRequests.length === 0,
    '未点击朗读时浏览器不创建播放器或下载整套音频');

  const hello = () => page.getByRole('button', { name: '朗读hello', exact: true });
  const hi = () => page.getByRole('button', { name: '朗读hi', exact: true });
  const beforePlayback = await progress();
  const helloIndex = await clickAudio(hello());
  const helloState = await audioState(helloIndex);
  assert(helloState.duration > 0 && helloState.playbackRate === 1
    && helloState.events.includes('loadedmetadata'), 'hello MP3 真实解码、有时长且以原速播放');
  await page.waitForFunction(index => window.__qaAudios[index].__qaEvents.includes('ended'), helloIndex, { timeout: 20000 });
  assert(await page.getByText('再跟着读一遍吧。', { exact: false }).count() > 0, '播放结束后显示跟读提示');

  const previousIndex = await clickAudio(hello());
  const hiIndex = await clickAudio(hi());
  assert((await audioState(previousIndex)).paused && !(await audioState(hiIndex)).paused,
    '快速切换 hello 到 hi 时，旧音频暂停，新音频实际播放');
  await page.getByRole('link', { name: '字词冒险岛首页', exact: true }).click();
  await page.waitForFunction(index => window.__qaAudios[index].paused, hiIndex);
  assert((await audioState(hiIndex)).paused, '导航到首页立即停止词卡音频');
  await go('/course/en-01');

  const helloUrl = new URL(helloEntry.file, base).href;
  let failedRequests = 0;
  const abortHello = async route => { failedRequests += 1; await route.abort('failed'); };
  await page.route(helloUrl, abortHello);
  const failedAudioIndex = await audioCount();
  await hello().click();
  await page.waitForFunction(index => window.__qaAudios[index]?.__qaEvents.includes('error'), failedAudioIndex, { timeout: 20000 });
  await page.getByText('声音暂时没加载出来，请再点一次。', { exact: false }).waitFor();
  assert(failedRequests > 0, '真实 MP3 请求中断时显示可重试提示');
  await page.unroute(helloUrl, abortHello);
  const retryIndex = await clickAudio(hello());
  assert((await audioState(retryIndex)).duration > 0, '恢复请求后同一词卡可重新播放');
  assert(await progress() === beforePlayback, '朗读成功、切换和加载失败均不写入学习结果');

  await go('/play/en-03/recall');
  await page.getByRole('button', { name: '我完成了，核对答案', exact: true }).click();
  const listen = () => page.getByRole('button', { name: '听示范，跟着读', exact: true });
  const roundAudioIndex = await clickAudio(listen());
  await page.getByRole('button', { name: '我自己想对了', exact: true }).click();
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  assert((await audioState(roundAudioIndex)).paused, '英语回忆关换题停止上一题音频');
  await page.getByRole('button', { name: '我完成了，核对答案', exact: true }).click();
  const pausedAudioIndex = await clickAudio(listen());
  await page.getByRole('button', { name: '暂停练习', exact: true }).click();
  assert((await audioState(pausedAudioIndex)).paused, '暂停练习停止当前英语音频');

  const beforeTeacher = await progress();
  await go('/teacher');
  await page.locator('.teacher-controls select').first().selectOption('en-01');
  await page.getByRole('button', { name: '揭晓答案', exact: true }).click();
  const teacherAudioIndex = await clickAudio(listen());
  await page.getByRole('button', { name: '下一题', exact: true }).click();
  assert((await audioState(teacherAudioIndex)).paused && await progress() === beforeTeacher,
    '老师英语演示播放真实音频，换题停止且不写个人学习记录');

  for (const width of [390, 820]) {
    await page.setViewportSize({ width, height: 844 });
    await go('/course/en-01');
    assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      width + 'px 英语词卡页面没有横向溢出');
    if (width === 390) await page.screenshot({ path: 'output/playwright/audio/english-mobile.png', fullPage: true });
  }
  assert(await page.evaluate(() => window.__qaSpeechCalls === 0), '所有英语词卡、回忆和老师流程均未调用设备 TTS');

  const noSpeechUrl = new URL(base);
  noSpeechUrl.searchParams.set('__qaNoSpeech', '1');
  noSpeechUrl.hash = '/course/en-01';
  await page.goto(noSpeechUrl.href);
  await hello().waitFor();
  assert(await page.evaluate(() => typeof window.speechSynthesis === 'undefined'), '缺少设备 TTS 的浏览器条件已实际设置');
  const noSpeechIndex = await clickAudio(hello());
  assert((await audioState(noSpeechIndex)).duration > 0, '没有 speechSynthesis 时英语 MP3 仍真实解码和播放');
  await page.getByRole('link', { name: '字词冒险岛首页', exact: true }).click();
  assert((await audioState(noSpeechIndex)).paused, '没有设备 TTS 时离开页面也能正确停止音频');
  await page.setViewportSize({ width: 1440, height: 1050 });
  await go('/course/en-01');
  assert(errors.length === 0, '固定英语音频全部浏览器流程没有 pageerror');
  return { base, checks, errors, audioEntries: entries.length, uniqueAssets: assetResults.length,
    bytesChecked: assetResults.reduce((sum, entry) => sum + entry.bytes, 0),
    hashesChecked: assetResults.filter(entry => entry.sha256Checked).length,
    helloDurationSeconds: helloState.duration };
}
