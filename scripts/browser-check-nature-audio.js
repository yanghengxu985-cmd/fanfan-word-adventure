// Run with playwright-cli run-code --filename after opening the real site.
// Instrumentation observes native Web Audio; no synthetic replacement or mocked decode.
async (page) => {
  const base = page.url().split('#')[0];
  const checks = [];
  const errors = [];
  const requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/audio\/nature\/.*\.mp3/.test(request.url())) requests.push(request.url()); });
  const assert = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
  await page.addInitScript(() => {
    const Native = window.AudioContext || window.webkitAudioContext;
    if (!Native) return;
    if (Native.__natureTracked) return;
    window.__natureContexts = [];
    window.__natureOscillators = 0;
    function TrackedContext(...args) {
      const context = new Native(...args);
      context.__buffers = [];
      context.__gains = [];
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.__analyser = analyser;
      const gain = context.createGain.bind(context);
      context.createGain = () => {
        const node = gain();
        context.__gains.push(node);
        const connect = node.connect.bind(node);
        node.connect = (...targets) => {
          if (targets[0] === context.destination) {
            connect(analyser); analyser.connect(context.destination); return analyser;
          }
          return connect(...targets);
        };
        return node;
      };
      const source = context.createBufferSource.bind(context);
      context.createBufferSource = () => {
        const node = source();
        const start = node.start.bind(node);
        node.start = (...timing) => {
          const samples = node.buffer.getChannelData(0);
          let square = 0;
          for (const value of samples) square += value * value;
          context.__buffers.push({ duration: node.buffer.duration, rms: Math.sqrt(square / samples.length) });
          return start(...timing);
        };
        return node;
      };
      const oscillator = context.createOscillator.bind(context);
      context.createOscillator = (...oscillatorArgs) => { window.__natureOscillators++; return oscillator(...oscillatorArgs); };
      window.__natureContexts.push(context);
      return context;
    }
    TrackedContext.prototype = Native.prototype;
    TrackedContext.__natureTracked = true;
    window.AudioContext = TrackedContext;
  });
  const open = async (course = 'cn-07', teacher = false) => {
    await page.goto(base + '#/chinese-lesson/' + course + (teacher ? '/teacher' : ''));
    await page.reload();
    await page.getByRole('heading', { name: course === 'cn-07' ? '听听，秋的声音' : '大自然的声音', exact: true }).waitFor();
    await page.getByRole('navigation').getByRole('button', { name: /阅读工具$/ }).click();
  };
  const play = async () => {
    await page.getByRole('button', { name: '试听真实声音', exact: true }).click();
    await page.getByRole('button', { name: '停止声音', exact: true }).waitFor();
    await page.waitForFunction(() => window.__natureContexts.at(-1)?.state === 'running');
  };
  const slider = index => page.locator('.cpt-sound-layers input[type="range"]').nth(index);
  const level = async (index, key) => { await slider(index).focus(); await slider(index).press(key); };
  const allContextsClosed = () => page.waitForFunction(() => window.__natureContexts.every(context => context.state === 'closed'));

  await page.setViewportSize({ width: 1024, height: 700 });
  await open();
  if (!await page.evaluate(() => Boolean(window.AudioContext || window.webkitAudioContext))) {
    await page.getByRole('button', { name: '试听真实声音', exact: true }).click();
    await page.getByRole('status').filter({ hasText: '这个浏览器暂不支持录音混合播放' }).waitFor();
    assert(true, 'Engine without Web Audio shows an accurate unsupported-browser message');
    await page.getByRole('button', { name: '资料与指导', exact: true }).click();
    await page.getByRole('heading', { name: '真实声音的来源' }).waitFor();
    assert(true, 'Recording attribution remains available without Web Audio');
    await page.getByRole('button', { name: '关闭资料与指导', exact: true }).click();
    for (const viewport of [{ width: 1024, height: 700 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      const button = page.getByRole('button', { name: '试听真实声音', exact: true });
      const bounds = await button.boundingBox();
      assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= viewport.height, `Play control visible at ${viewport.width}x${viewport.height}`);
    }
    assert(errors.length === 0, 'No uncaught browser errors in unsupported-audio fallback');
    return { engine: page.context().browser().browserType().name(), audioPlayback: 'unavailable in this engine; not a Safari device playback test', checks, errors };
  }
  await play();
  const first = await page.evaluate(() => ({ state: window.__natureContexts[0].state, buffers: window.__natureContexts[0].__buffers, oscillators: window.__natureOscillators }));
  assert(first.state === 'running' && first.buffers.length === 3, 'Three real MP3 buffers start in a running AudioContext');
  assert(first.buffers.every(buffer => buffer.duration > 8 && buffer.duration < 16 && buffer.rms > .03), 'Every decoded recording is complete and audible');
  assert(first.oscillators === 0, 'Autumn tool creates no electronic oscillators');
  assert(new Set(requests).size === 3 && requests.every(url => url.startsWith(base)), 'Recordings load from this site, without third-party playback requests');

  for (let index = 0; index < 3; index++) await level(index, 'Home');
  await page.getByRole('status').filter({ hasText: '所有声部已静音' }).waitFor();
  await page.waitForFunction(() => {
    const samples = new Float32Array(2048); window.__natureContexts[0].__analyser.getFloatTimeDomainData(samples);
    return samples.every(value => Math.abs(value) < .00001);
  });
  assert(true, 'Muting all three sliders actually silences audio and shows feedback');
  for (let index = 0; index < 3; index++) {
    await level(index, 'End');
    await page.waitForFunction(() => {
      const samples = new Float32Array(2048); window.__natureContexts[0].__analyser.getFloatTimeDomainData(samples);
      return samples.some(value => Math.abs(value) > .0005);
    });
    assert(true, ['Leaves', 'Cricket', 'Flying geese'][index] + ' can be heard as an isolated layer');
    await level(index, 'Home');
  }
  await page.locator('.cpt-sound-layers > div').nth(1).locator('button').click();
  assert(await slider(1).inputValue() === '0.5', 'Tapping a muted layer opens it at a useful volume');
  await page.getByRole('button', { name: '停止声音', exact: true }).click();
  await allContextsClosed();
  assert(true, 'Stop closes the native audio context');

  const initialRequests = requests.length;
  await play();
  assert(requests.length === initialRequests, 'Second playback reuses decoded recordings');
  await page.getByRole('button', { name: '资料与指导', exact: true }).click();
  await allContextsClosed();
  await page.getByRole('heading', { name: '真实声音的来源' }).waitFor();
  assert(await page.getByRole('link', { name: /Jens Loose/ }).count() === 1, 'Sources dialog credits the actual goose recording');
  await page.getByRole('button', { name: '关闭资料与指导', exact: true }).click();
  for (const viewport of [{ width: 1024, height: 700 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find(node => node.textContent === '试听真实声音');
      const rect = button.getBoundingClientRect();
      return { width: document.documentElement.scrollWidth <= innerWidth, bottom: rect.bottom <= innerHeight, top: rect.top >= 0 };
    });
    assert(layout.width && layout.bottom && layout.top, `Play control remains visible at ${viewport.width}x${viewport.height}`);
  }
  await page.screenshot({ path: 'output/playwright/autumn-audio-' + page.context().browser().browserType().name() + '.png' });
  await play();
  await page.getByRole('navigation').getByRole('button', { name: /读进课文$/ }).click();
  await allContextsClosed();
  assert(true, 'Switching tabs stops every layer');

  // Fresh page clears decoded buffers, so failed requests and cancellation exercise real loading.
  await page.route('**/audio/nature/*.mp3', route => route.fulfill({ status: 503, body: 'temporarily unavailable' }));
  await open();
  await page.getByRole('button', { name: '试听真实声音', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '录音暂时没有加载成功' }).waitFor();
  await allContextsClosed();
  assert(true, 'Failed downloads show a retryable error rather than playing');
  await page.unroute('**/audio/nature/*.mp3');
  await play();
  assert(true, 'Retry after failed downloads plays successfully');
  await page.getByRole('button', { name: '停止声音', exact: true }).click();

  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/audio/nature/*.mp3', async route => { await gate; try { await route.continue(); } catch { /* Cancelled request. */ } });
  await open();
  await page.getByRole('button', { name: '试听真实声音', exact: true }).click();
  await page.getByRole('button', { name: '取消加载', exact: true }).waitFor();
  await page.getByRole('button', { name: '取消加载', exact: true }).click();
  release();
  await allContextsClosed();
  await page.unroute('**/audio/nature/*.mp3');
  await page.getByRole('button', { name: '试听真实声音', exact: true }).waitFor();
  assert(true, 'Cancelling a pending load closes audio and leaves the tool ready');
  await play();
  assert(true, 'Immediate retry after cancellation starts a fresh working player');

  await open('cn-07', true);
  await play();
  await page.getByRole('button', { name: '暂停动效和声音', exact: true }).click();
  await allContextsClosed();
  assert(true, 'Teacher pause stops recorded sound layers');

  await open('cn-21');
  await page.getByRole('button', { name: '试听声部示意', exact: true }).click();
  await page.getByRole('button', { name: '停止声音示意', exact: true }).waitFor();
  assert(await page.getByRole('status').filter({ hasText: '合成声部示意' }).count() === 1, 'Existing nature lesson keeps its correctly labelled legacy sound path');
  await page.getByRole('button', { name: '停止声音示意', exact: true }).click();
  assert(errors.length === 0, 'No uncaught browser errors');
  return { engine: page.context().browser().browserType().name(), checks, recordingRequests: [...new Set(requests)], errors };
}
