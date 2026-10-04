import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createChineseLessonAudioPlayer,
  getLessonAudioEntry,
  type ChineseLessonAudioElement,
} from './chineseLessonAudio';

// These whole-word clips already exist; narration generation can run independently.
const first = { id: 'cn-01-textbook_word-01', text: '山坡' };
const second = { id: 'cn-01-textbook_word-02', text: '学校' };
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

class FakeAudio implements ChineseLessonAudioElement {
  preload: HTMLMediaElement['preload'] = 'auto';
  playbackRate = 4;
  onended: ((event: Event) => void) | null = null;
  onerror: ((event: Event | string) => void) | null = null;
  playCalls = 0;
  pauseCalls = 0;
  loadCalls = 0;
  removedAttributes: string[] = [];
  resolvePlay!: () => void;
  rejectPlay!: (reason?: unknown) => void;
  started = new Promise<void>((resolve, reject) => {
    this.resolvePlay = resolve;
    this.rejectPlay = reject;
  });
  constructor(readonly url: string, readonly serial: number, private readonly trace: string[]) {}
  play() { this.playCalls++; this.trace.push(`play:${this.serial}`); return this.started; }
  pause() { this.pauseCalls++; this.trace.push(`pause:${this.serial}`); }
  load() { this.loadCalls++; this.trace.push(`load:${this.serial}`); }
  removeAttribute(name: string) { this.removedAttributes.push(name); this.trace.push(`remove:${this.serial}:${name}`); }
}

function fixture(baseUrl = '/fanfan-word-adventure/') {
  const media: FakeAudio[] = [];
  const messages: string[] = [];
  const events: Array<{ event: 'ended' | 'error'; id: string }> = [];
  const trace: string[] = [];
  const player = createChineseLessonAudioPlayer({
    baseUrl,
    onStatus: message => messages.push(message),
    onEvent: (event, id) => events.push({ event, id }),
    createAudio: url => {
      trace.push(`create:${media.length}`);
      const audio = new FakeAudio(url, media.length, trace);
      media.push(audio);
      return audio;
    },
  });
  return { ...player, media, messages, events, trace };
}

test('a word click creates one local MP3 lazily and uses normal playback speed', () => {
  const player = fixture();
  assert.equal(player.media.length, 0);
  assert.deepEqual(player.messages, []);
  player.play(first.id, first.text);
  const clip = player.media[0];
  assert.ok(clip);
  assert.equal(clip.url, `/fanfan-word-adventure/${getLessonAudioEntry(first.id, first.text)!.file}`);
  assert.equal(clip.preload, 'none');
  assert.equal(clip.playbackRate, 1);
  assert.equal(clip.playCalls, 1);
  assert.match(player.messages.at(-1)!, /合成练习/);
  assert.deepEqual(player.events, []);
  player.stop();
});

test('unknown lesson IDs can reuse a reviewed whole-word pilot clip but never prototype keys', () => {
  const clip = getLessonAudioEntry('word-not-in-current-manifest', '绒毛');
  assert.ok(clip);
  assert.equal(clip.text, '绒毛');
  assert.match(clip.file, /^audio\/chinese-pilot\/[a-z0-9_-]+\.mp3$/);
  for (const id of ['constructor', '__proto__', 'toString']) assert.equal(getLessonAudioEntry(id), undefined);
  assert.equal(getLessonAudioEntry('missing-word', '不存在的测试词'), undefined);
});

test('local root, repository subpath, and relative bases produce local asset URLs', () => {
  for (const baseUrl of ['', '/', '/fanfan-word-adventure', '/fanfan-word-adventure/', './', './preview/']) {
    const player = fixture(baseUrl);
    player.play(first.id, first.text);
    const prefix = baseUrl ? baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/` : '/';
    assert.equal(player.media[0].url, `${prefix}${getLessonAudioEntry(first.id, first.text)!.file}`);
    assert.equal(new URL(player.media[0].url, 'https://classroom.example/').origin, 'https://classroom.example');
    player.stop();
  }
});

test('external, encoded, traversal, query, fragment, and backslash bases are rejected before creating audio', () => {
  const unsafe = ['https://outside.example/', '//outside.example/', '../', '/safe/../', './safe/../',
    '/safe/%2e%2e/', '/safe/%2F/', '/safe/..\\', '/safe/?next=x', '/safe/#x', 'data:audio/mp3,AAA'];
  for (const baseUrl of unsafe) {
    const player = fixture(baseUrl);
    player.play(first.id, first.text);
    assert.equal(player.media.length, 0, baseUrl);
    assert.ok(player.messages.at(-1), `failure needs a readable status: ${baseUrl}`);
    assert.deepEqual(player.events, [{ event: 'error', id: first.id }], baseUrl);
  }
});

test('URL-normalized controls cannot disguise an external network path', () => {
  for (const control of ['\t', '\n', '\r']) {
    const baseUrl = `/${control}/outside.example/`;
    assert.equal(new URL(`${baseUrl}audio/chinese-lessons/word.mp3`, 'https://classroom.example/').origin, 'https://outside.example');
    const player = fixture(baseUrl);
    player.play(first.id, first.text);
    assert.equal(player.media.length, 0, `control ${JSON.stringify(control)} must be rejected`);
    assert.deepEqual(player.events, [{ event: 'error', id: first.id }]);
  }
});

test('starting the next word fully releases the previous media before creating and playing another', () => {
  const player = fixture();
  player.play(first.id, first.text);
  const old = player.media[0];
  player.play(second.id, second.text);
  assert.equal(old.onended, null);
  assert.equal(old.onerror, null);
  assert.equal(old.pauseCalls, 1);
  assert.deepEqual(old.removedAttributes, ['src']);
  assert.equal(old.loadCalls, 1);
  assert.ok(player.trace.indexOf('load:0') < player.trace.indexOf('create:1'));
  assert.ok(player.trace.indexOf('load:0') < player.trace.indexOf('play:1'));
  assert.equal(player.media[1].playCalls, 1);
  player.stop();
});

test('stop and unmount cleanup ignore late rejection and captured ended/error callbacks from an old queue', async () => {
  const media: FakeAudio[] = [];
  const messages: string[] = [];
  const events: string[] = [];
  const player = createChineseLessonAudioPlayer({
    baseUrl: '/', onStatus: message => messages.push(message),
    onEvent: (event, id) => { events.push(`${event}:${id}`); player.play(second.id, second.text); },
    createAudio: url => { const clip = new FakeAudio(url, media.length, []); media.push(clip); return clip; },
  });
  player.play(first.id, first.text);
  const old = media[0];
  const ended = old.onended;
  const error = old.onerror;
  const messageCount = messages.length;
  player.stop(); // This is the cleanup returned by the viewer's unmount effect.
  player.stop();
  old.rejectPlay(new Error('late rejection after navigation'));
  ended?.(new Event('ended'));
  error?.(new Event('error'));
  await settle();
  assert.equal(media.length, 1, 'stale events must not start the next queue item');
  assert.equal(messages.length, messageCount);
  assert.deepEqual(events, []);
  assert.equal(old.pauseCalls, 1, 'cleanup remains idempotent');
});

test('a replacement word stays current when the previous word rejects or emits captured events', async () => {
  const player = fixture();
  player.play(first.id, first.text);
  const old = player.media[0];
  const ended = old.onended;
  const error = old.onerror;
  player.play(second.id, second.text);
  const count = player.messages.length;
  old.rejectPlay(new Error('old clip failed'));
  ended?.(new Event('ended'));
  error?.(new Event('error'));
  await settle();
  assert.equal(player.messages.length, count);
  assert.deepEqual(player.events, []);
  assert.equal(player.media[1].pauseCalls, 0);
  player.media[1].resolvePlay();
  player.media[1].onended?.(new Event('ended'));
  await settle();
  assert.deepEqual(player.events, [{ event: 'ended', id: second.id }]);
  assert.equal(player.media[1].pauseCalls, 1);
});

test('a completed word emits one ended event and cannot complete again via a captured handler', async () => {
  const player = fixture();
  player.play(first.id, first.text);
  const audio = player.media[0];
  const ended = audio.onended;
  audio.resolvePlay();
  ended?.(new Event('ended'));
  ended?.(new Event('ended'));
  await settle();
  assert.deepEqual(player.events, [{ event: 'ended', id: first.id }]);
  assert.match(player.messages.at(-1)!, /再读/);
  assert.equal(audio.onended, null);
  assert.equal(audio.onerror, null);
  assert.equal(audio.pauseCalls, 1);
});

test('current playback rejection reports an error once and releases the failed clip', async () => {
  const player = fixture();
  player.play(first.id, first.text);
  const audio = player.media[0];
  const capturedError = audio.onerror;
  audio.rejectPlay(new Error('autoplay denied'));
  await settle();
  capturedError?.(new Event('error'));
  assert.deepEqual(player.events, [{ event: 'error', id: first.id }]);
  assert.match(player.messages.at(-1)!, /再点一次/);
  assert.equal(audio.pauseCalls, 1);
  assert.deepEqual(audio.removedAttributes, ['src']);
});

test('synchronous play throws, constructor failures, and missing entries produce readable error outcomes', () => {
  for (const kind of ['play', 'construct', 'missing'] as const) {
    const messages: string[] = [];
    const events: string[] = [];
    const clips: FakeAudio[] = [];
    const player = createChineseLessonAudioPlayer({
      baseUrl: '/', onStatus: message => messages.push(message), onEvent: (event, id) => events.push(`${event}:${id}`),
      createAudio: url => {
        if (kind === 'construct') throw new Error('media unavailable');
        const audio = new FakeAudio(url, 0, []);
        audio.play = () => { throw new Error('synchronous play failure'); };
        clips.push(audio); return audio;
      },
    });
    const id = kind === 'missing' ? 'no-such-lesson-audio' : first.id;
    assert.doesNotThrow(() => player.play(id, kind === 'missing' ? undefined : first.text));
    assert.deepEqual(events, [`error:${id}`]);
    assert.ok(messages.at(-1));
    if (kind === 'play') assert.equal(clips[0].pauseCalls, 1);
    else assert.equal(clips.length, 0);
  }
});

test('an onStatus callback that stops playback prevents play from starting', () => {
  const media: FakeAudio[] = [];
  const events: string[] = [];
  const player = createChineseLessonAudioPlayer({
    baseUrl: '/', onStatus: () => player.stop(), onEvent: event => events.push(event),
    createAudio: url => { const audio = new FakeAudio(url, 0, []); media.push(audio); return audio; },
  });
  player.play(first.id, first.text);
  assert.equal(media.length, 1);
  assert.equal(media[0].playCalls, 0);
  assert.equal(media[0].pauseCalls, 1);
  assert.deepEqual(events, []);
});

test('stopping from an ended status suppresses the old queue completion event', () => {
  const media: FakeAudio[] = [];
  const events: string[] = [];
  let statuses = 0;
  const player = createChineseLessonAudioPlayer({
    baseUrl: '/', onStatus: () => { if (++statuses > 1) player.stop(); }, onEvent: event => events.push(event),
    createAudio: url => { const audio = new FakeAudio(url, 0, []); media.push(audio); return audio; },
  });
  player.play(first.id, first.text);
  media[0].onended?.(new Event('ended'));
  assert.deepEqual(events, []);
});

test('stopping from an immediate failure status suppresses its old queue error event', () => {
  for (const constructFailure of [false, true]) {
    const events: string[] = [];
    const player = createChineseLessonAudioPlayer({
      baseUrl: '/', onStatus: () => player.stop(), onEvent: event => events.push(event),
      createAudio: () => { throw new Error('constructor failed'); },
    });
    player.play(constructFailure ? first.id : 'no-such-lesson-audio', constructFailure ? first.text : undefined);
    assert.deepEqual(events, [], 'onStatus cleanup invalidates an immediate failure event too');
  }
});

test('the MP3 player never uses browser system speech synthesis, including on failure', () => {
  const names = ['speechSynthesis', 'SpeechSynthesisUtterance'] as const;
  const saved = names.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
  try {
    for (const name of names) Object.defineProperty(globalThis, name, { configurable: true, get() { throw new Error(`system TTS accessed: ${name}`); } });
    const player = fixture();
    assert.doesNotThrow(() => player.play(first.id, first.text));
    assert.doesNotThrow(() => player.play('missing-local-audio'));
    assert.doesNotThrow(() => player.stop());
    assert.equal(player.media.length, 1);
  } finally {
    for (let i = 0; i < names.length; i++) {
      if (saved[i]) Object.defineProperty(globalThis, names[i], saved[i]!);
      else Reflect.deleteProperty(globalThis, names[i]);
    }
  }
});
