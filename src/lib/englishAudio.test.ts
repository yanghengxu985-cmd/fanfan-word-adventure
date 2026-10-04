import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import audioManifest from '../../public/audio/english/manifest.json';
import runtimeManifest from '../data/englishAudioManifest.json';
import activityRuntimeManifest from '../data/englishActivityAudioManifest.json';
import activityClips from '../data/englishActivityClips.json';
import { lexemes } from '../data/curriculum';
import { createEnglishAudioPlayer, getEnglishActivityAudioEntry, getEnglishAudioEntry, type EnglishAudioElement } from './englishAudio';

class FakeAudio implements EnglishAudioElement {
  preload: HTMLMediaElement['preload'] = 'auto';
  playbackRate = 5;
  currentTime = 3;
  onended: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  playCalls = 0;
  pauseCalls = 0;
  loadCalls = 0;
  removedAttributes: string[] = [];
  resolvePlay!: () => void;
  rejectPlay!: (reason?: unknown) => void;
  started = new Promise<void>((resolve, reject) => { this.resolvePlay = resolve; this.rejectPlay = reject; });
  constructor(readonly url: string) {}
  play() { this.playCalls++; return this.started; }
  pause() { this.pauseCalls++; }
  load() { this.loadCalls++; }
  removeAttribute(name: string) { this.removedAttributes.push(name); }
}

const english = lexemes.filter(item => item.subject === 'english');
const firstId = english[0].id;
const nextId = english.find(item => item.text !== english[0].text)!.id;
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

function fixture(baseUrl = '/fanfan-word-adventure/') {
  const clips: FakeAudio[] = [];
  const messages: string[] = [];
  const events: Array<{ event: 'started' | 'ended' | 'error'; id: string }> = [];
  const player = createEnglishAudioPlayer({
    baseUrl,
    onStatus: message => messages.push(message),
    onEvent: (event, id) => events.push({ event, id }),
    createAudio: url => {
      const clip = new FakeAudio(url);
      clips.push(clip);
      return clip;
    },
  });
  return { ...player, clips, messages, events };
}

test('all 153 English records have real MP3 files matching the chosen voice and tempo', () => {
  assert.equal(audioManifest.schemaVersion, 1);
  assert.equal(audioManifest.voice, 'en-GB-SoniaNeural');
  assert.equal(audioManifest.rate, '-12%');
  assert.equal(audioManifest.locale, 'en-GB');
  for (const key of ['schemaVersion', 'voice', 'rate', 'locale', 'entries'] as const) {
    assert.deepEqual(runtimeManifest[key], audioManifest[key], `bundled manifest out of sync: ${key}`);
  }
  assert.equal(english.length, 153);
  assert.deepEqual(Object.keys(audioManifest.entries).sort(), english.map(item => item.id).sort());
  for (const item of english) {
    const entry = getEnglishAudioEntry(item.id);
    assert.ok(entry, `missing ${item.id}`);
    assert.equal(entry.text, item.text);
    assert.ok(entry.spokenText.length > 0);
    assert.ok(!/[\u3400-\u9fff]/.test(entry.spokenText), `non-English script for ${item.id}`);
    assert.match(entry.file, /^audio\/english\/[A-Za-z0-9_-]+\.mp3$/);
    const bytes = readFileSync(fileURLToPath(new URL(`../../public/${entry.file}`, import.meta.url)));
    assert.equal(bytes.length, entry.bytes, `manifest size mismatch: ${item.id}`);
    assert.ok(bytes.length > 500, `empty audio: ${item.id}`);
    assert.ok(entry.durationSeconds > 0 && entry.durationSeconds < 30);
    const hasId3 = bytes.subarray(0, 3).toString('ascii') === 'ID3';
    const hasMpegHeader = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(hasId3 || hasMpegHeader, `not an MP3: ${item.id}`);
  }
  assert.equal(getEnglishAudioEntry('constructor'), undefined);
  assert.equal(getEnglishAudioEntry('cn-01'), undefined);
});

test('does not create or download audio until a click, then starts synchronously at the Pages subpath', () => {
  const player = fixture();
  assert.equal(player.clips.length, 0);
  assert.equal(player.messages.length, 0);
  assert.ok(getEnglishAudioEntry(firstId));
  assert.equal(player.clips.length, 0);
  player.play(firstId);
  assert.equal(player.clips.length, 1);
  const clip = player.clips[0];
  assert.equal(clip.url, `/fanfan-word-adventure/${getEnglishAudioEntry(firstId)!.file}`);
  assert.equal(clip.preload, 'none');
  assert.equal(clip.playbackRate, 1);
  assert.equal(clip.playCalls, 1);
  assert.deepEqual(player.messages, ['正在播放英式慢读示范…']);
  player.stop();
});

test('supports root and relative deployments while rejecting remote or traversing base paths', () => {
  for (const base of ['/', '/fanfan-word-adventure', './']) {
    const player = fixture(base);
    player.play(firstId);
    const prefix = base.endsWith('/') ? base : `${base}/`;
    assert.equal(player.clips[0].url, `${prefix}${getEnglishAudioEntry(firstId)!.file}`);
    player.stop();
  }
  for (const base of ['https://example.com/', '//example.com/', '/../escape/', '/safe/%2e%2e/', '/safe/..\\escape/', '/safe/?redirect=1']) {
    const player = fixture(base);
    player.play(firstId);
    assert.equal(player.clips.length, 0, base);
    assert.equal(player.messages.at(-1), '声音暂时没加载出来，请再点一次。');
  }
});

test('refuses a manifest asset that points remotely or escapes the English asset directory', () => {
  const entry = getEnglishAudioEntry(firstId)!;
  const originalFile = entry.file;
  try {
    for (const unsafeFile of ['https://example.com/voice.mp3', '//example.com/voice.mp3', 'audio/english/../secret.mp3', 'audio/english/%2e%2e/secret.mp3', 'audio/english/voice.mp3?tracking=1']) {
      entry.file = unsafeFile;
      const player = fixture();
      player.play(firstId);
      assert.equal(player.clips.length, 0, unsafeFile);
      assert.equal(player.messages.at(-1), '声音暂时没加载出来，请再点一次。');
    }
  } finally {
    entry.file = originalFile;
  }
});

test('switching words stops the old clip and ignores its late promise failure and captured events', async () => {
  const player = fixture();
  player.play(firstId);
  const previous = player.clips[0];
  const lateError = previous.onerror;
  const lateEnded = previous.onended;
  player.play(nextId);
  assert.equal(previous.pauseCalls, 1);
  assert.equal(previous.currentTime, 0);
  assert.equal(previous.onended, null);
  assert.equal(previous.onerror, null);
  assert.deepEqual(previous.removedAttributes, ['src']);
  assert.equal(previous.loadCalls, 1);
  const count = player.messages.length;
  previous.rejectPlay(new Error('previous request aborted'));
  lateError?.(new Event('error'));
  lateEnded?.(new Event('ended'));
  await settle();
  assert.equal(player.messages.length, count);
  const current = player.clips[1];
  current.onended?.(new Event('ended'));
  assert.equal(player.messages.at(-1), '再跟着读一遍吧。');
  assert.equal(current.pauseCalls, 1);
});

test('a failed clip can be retried with a fresh Audio object and no speech fallback', async () => {
  const player = fixture();
  player.play(firstId);
  const failed = player.clips[0];
  failed.rejectPlay(new Error('offline'));
  await settle();
  assert.equal(player.messages.at(-1), '声音暂时没加载出来，请再点一次。');
  assert.equal(failed.pauseCalls, 1);
  player.play(firstId);
  assert.equal(player.clips.length, 2);
  assert.equal(player.clips[1].playCalls, 1);
  assert.equal(player.messages.at(-1), '正在播放英式慢读示范…');
  player.clips[1].onerror?.(new Event('error'));
  assert.equal(player.messages.at(-1), '声音暂时没加载出来，请再点一次。');
});

test('unmount cleanup is silent and ignores any late events or rejected play promise', async () => {
  const player = fixture();
  player.play(firstId);
  const clip = player.clips[0];
  const lateEnded = clip.onended;
  const lateError = clip.onerror;
  const count = player.messages.length;
  player.stop();
  player.stop();
  assert.equal(clip.pauseCalls, 1);
  assert.equal(clip.currentTime, 0);
  clip.rejectPlay(new Error('cleanup interrupted playback'));
  lateEnded?.(new Event('ended'));
  lateError?.(new Event('error'));
  await settle();
  assert.equal(player.messages.length, count);
});

test('missing recordings stop prior playback and show an honest message', () => {
  const player = fixture();
  player.play(firstId);
  player.play('nonexistent-word');
  assert.equal(player.clips.length, 1);
  assert.equal(player.clips[0].pauseCalls, 1);
  assert.equal(player.messages.at(-1), '这个词的示范声音还没准备好。');
});

test('synchronous browser playback failures are handled without leaving an active clip', () => {
  const messages: string[] = [];
  const clip = new FakeAudio('/test.mp3');
  clip.play = () => { throw new Error('play blocked'); };
  const player = createEnglishAudioPlayer({ baseUrl: '/', onStatus: message => messages.push(message), createAudio: () => clip });
  player.play(firstId);
  assert.equal(messages.at(-1), '声音暂时没加载出来，请再点一次。');
  assert.equal(clip.pauseCalls, 1);
  player.stop();
  assert.equal(clip.pauseCalls, 1);
});

test('a browser without a usable Audio constructor gets a readable failure', () => {
  const messages: string[] = [];
  const player = createEnglishAudioPlayer({
    baseUrl: '/',
    onStatus: message => messages.push(message),
    createAudio: () => { throw new Error('Audio unavailable'); },
  });
  assert.doesNotThrow(() => player.play(firstId));
  assert.deepEqual(messages, ['声音暂时没加载出来，请再点一次。']);
  player.stop();
});

test('playback events start after the play promise succeeds and end only on the media ended event', async () => {
  const player = fixture();
  player.play(firstId);
  const clip = player.clips[0];
  assert.deepEqual(player.events, []);
  clip.resolvePlay();
  assert.deepEqual(player.events, []);
  await settle();
  assert.deepEqual(player.events, [{ event: 'started', id: firstId }]);
  clip.resolvePlay();
  await settle();
  assert.equal(player.events.length, 1);
  const ended = clip.onended;
  ended?.(new Event('ended'));
  assert.deepEqual(player.events, [{ event: 'started', id: firstId }, { event: 'ended', id: firstId }]);
  ended?.(new Event('ended'));
  assert.equal(player.events.length, 2);
});

test('a switched or stopped clip cannot emit late started, ended or error events', async () => {
  const player = fixture();
  player.play(firstId);
  const previous = player.clips[0];
  const lateEnded = previous.onended;
  const lateError = previous.onerror;
  player.play(nextId);
  previous.resolvePlay();
  lateEnded?.(new Event('ended'));
  lateError?.(new Event('error'));
  await settle();
  assert.deepEqual(player.events, []);
  const current = player.clips[1];
  const nextLateEnded = current.onended;
  const nextLateError = current.onerror;
  player.stop();
  current.rejectPlay(new Error('stopped'));
  nextLateEnded?.(new Event('ended'));
  nextLateError?.(new Event('error'));
  await settle();
  assert.deepEqual(player.events, []);
});

test('the same clip ID can be replayed with fresh media and distinct successful playback events', async () => {
  const player = fixture();
  player.play(firstId);
  player.clips[0].resolvePlay();
  await settle();
  player.play(firstId);
  assert.equal(player.clips.length, 2);
  assert.equal(player.clips[0].pauseCalls, 1);
  assert.equal(player.clips[1].url, player.clips[0].url);
  player.clips[1].resolvePlay();
  await settle();
  player.clips[1].onended?.(new Event('ended'));
  assert.deepEqual(player.events, [
    { event: 'started', id: firstId },
    { event: 'started', id: firstId },
    { event: 'ended', id: firstId },
  ]);
});

test('absent or malformed assets, construction failures and rejected play all emit one error', async () => {
  const missing = fixture();
  missing.play('missing-activity');
  assert.deepEqual(missing.events, [{ event: 'error', id: 'missing-activity' }]);
  const entry = getEnglishAudioEntry(firstId)!;
  const spokenText = entry.spokenText;
  try {
    entry.spokenText = '';
    const malformed = fixture();
    malformed.play(firstId);
    assert.equal(malformed.clips.length, 0);
    assert.deepEqual(malformed.events, [{ event: 'error', id: firstId }]);
  } finally {
    entry.spokenText = spokenText;
  }
  const events: Array<[string, string]> = [];
  const unavailable = createEnglishAudioPlayer({
    baseUrl: '/', onStatus: () => {}, onEvent: (event, id) => events.push([event, id]),
    createAudio: () => { throw new Error('unavailable'); },
  });
  unavailable.play(firstId);
  assert.deepEqual(events, [['error', firstId]]);
  const failed = fixture();
  failed.play(firstId);
  const lateError = failed.clips[0].onerror;
  failed.clips[0].rejectPlay(new Error('autoplay denied'));
  await settle();
  lateError?.(new Event('error'));
  assert.deepEqual(failed.events, [{ event: 'error', id: firstId }]);
});

test('stopping from a status callback suppresses subsequent playback event callbacks', async () => {
  let stop = () => {};
  const events: string[] = [];
  const clip = new FakeAudio('/test.mp3');
  const player = createEnglishAudioPlayer({
    baseUrl: '/',
    onStatus: message => { if (message === '再跟着读一遍吧。') stop(); },
    onEvent: event => events.push(event),
    createAudio: () => clip,
  });
  stop = player.stop;
  player.play(firstId);
  clip.resolvePlay();
  await settle();
  assert.deepEqual(events, ['started']);
  clip.onended?.(new Event('ended'));
  assert.deepEqual(events, ['started']);
});

test('activity recordings are bundled separately and play from their own Pages asset directory', () => {
  const activityIds = Object.keys(activityRuntimeManifest.entries);
  assert.ok(activityIds.length > 0, 'activity recordings have not been generated');
  assert.equal(activityRuntimeManifest.schemaVersion, 1);
  assert.equal(activityRuntimeManifest.voice, 'en-GB-SoniaNeural');
  assert.equal(activityRuntimeManifest.rate, '-12%');
  assert.equal(activityRuntimeManifest.locale, 'en-GB');
  assert.deepEqual(activityIds.sort(), Object.keys(activityClips).sort());
  const publicManifest = JSON.parse(readFileSync(fileURLToPath(new URL('../../public/audio/english-activities/manifest.json', import.meta.url)), 'utf8'));
  for (const key of ['schemaVersion', 'voice', 'rate', 'locale', 'entries'] as const) {
    assert.deepEqual(activityRuntimeManifest[key], publicManifest[key], `activity bundle out of sync: ${key}`);
  }
  for (const id of activityIds) {
    assert.equal(getEnglishAudioEntry(id), undefined, `activity ${id} leaked into the textbook word map`);
    const entry = getEnglishActivityAudioEntry(id);
    assert.ok(entry);
    assert.equal(entry.text, (activityClips as Record<string, string>)[id]);
    assert.ok(entry.spokenText.trim());
    assert.ok(!/[\u3400-\u9fff]/.test(entry.spokenText));
    assert.match(entry.file, /^audio\/english-activities\/[A-Za-z0-9_-]+\.mp3$/);
    const bytes = readFileSync(fileURLToPath(new URL(`../../public/${entry.file}`, import.meta.url)));
    assert.equal(bytes.length, entry.bytes, id);
    assert.ok(bytes.length > 500);
    assert.ok(entry.durationSeconds > 0);
    const hasId3 = bytes.subarray(0, 3).toString('ascii') === 'ID3';
    const hasMpegHeader = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(hasId3 || hasMpegHeader, `not an MP3: ${id}`);
  }
  assert.equal(getEnglishActivityAudioEntry('constructor'), undefined);
  const id = activityIds[0];
  const player = fixture();
  player.play(id);
  assert.equal(player.clips[0].url, `/fanfan-word-adventure/${getEnglishActivityAudioEntry(id)!.file}`);
  assert.equal(player.clips[0].playCalls, 1);
  player.stop();
});
