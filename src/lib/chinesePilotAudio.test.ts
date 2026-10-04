import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import publicManifest from '../../public/audio/chinese-pilot/manifest.json';
import clips from '../data/chinesePilotClips.json';
import runtimeManifest from '../data/chinesePilotAudioManifest.json';
import { createChinesePilotAudioPlayer, getChinesePilotAudioEntry, type ChinesePilotAudioElement } from './chinesePilotAudio';

class FakeAudio implements ChinesePilotAudioElement {
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
  play(): Promise<void> | void { this.playCalls++; return this.started; }
  pause() { this.pauseCalls++; }
  load() { this.loadCalls++; }
  removeAttribute(name: string) { this.removedAttributes.push(name); }
}

const firstId = 'cn-01-clip-07'; // 山坡: a current-edition, whole-word dictation clip.
const nextId = 'cn-04-clip-38'; // 远上寒山石径斜: a public-domain poem line.
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

function fixture(baseUrl = '/fanfan-word-adventure/') {
  const media: FakeAudio[] = [];
  const messages: string[] = [];
  const events: Array<{ event: 'started' | 'ended' | 'error'; id: string }> = [];
  const player = createChinesePilotAudioPlayer({
    baseUrl,
    onStatus: message => messages.push(message),
    onEvent: (event, id) => events.push({ event, id }),
    createAudio: url => {
      const clip = new FakeAudio(url);
      media.push(clip);
      return clip;
    },
  });
  return { ...player, media, messages, events };
}

test('all reviewed Chinese pilot clips use real, unchanged local MP3 with matching metadata', () => {
  assert.equal(publicManifest.schemaVersion, 1);
  assert.equal(publicManifest.voice, 'zh-CN-XiaoxiaoNeural');
  assert.equal(publicManifest.rate, '-8%');
  assert.equal(publicManifest.locale, 'zh-CN');
  assert.equal(publicManifest.humanRecorded, false);
  assert.equal(publicManifest.paperTextbookAudio, false);
  for (const key of ['schemaVersion', 'voice', 'rate', 'locale', 'source', 'entries'] as const) {
    assert.deepEqual(runtimeManifest[key], publicManifest[key], `bundled Mandarin manifest out of sync: ${key}`);
  }
  const entries = publicManifest.entries as Record<string, (typeof publicManifest.entries)[keyof typeof publicManifest.entries]>;
  const files = publicManifest.files as Record<string, (typeof publicManifest.files)[keyof typeof publicManifest.files]>;
  assert.equal(Object.keys(clips).length, 45);
  assert.deepEqual(Object.keys(entries).sort(), Object.keys(clips).sort());
  const filenames = new Set<string>();
  for (const [id, source] of Object.entries(clips)) {
    const entry = entries[id];
    assert.deepEqual(getChinesePilotAudioEntry(id), entry);
    assert.equal(entry.id, id);
    assert.equal(entry.text, source.text);
    assert.equal(entry.spokenText, source.text);
    assert.equal(entry.pinyin, source.pinyin);
    assert.equal(entry.sourceRef, source.sourceRef);
    assert.equal(entry.sourceKind, source.sourceKind);
    assert.match(entry.file, /^audio\/chinese-pilot\/[a-f0-9]{24}\.mp3$/);
    const bytes = readFileSync(fileURLToPath(new URL(`../../public/${entry.file}`, import.meta.url)));
    assert.equal(bytes.length, entry.bytes, `MP3 bytes changed: ${id}`);
    assert.equal(bytes.length, files[entry.file].bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), files[entry.file].sha256, `MP3 hash changed: ${id}`);
    assert.equal(entry.durationSeconds, files[entry.file].durationSeconds);
    assert.equal(files[entry.file].sampleRate, 24_000);
    assert.ok(entry.durationSeconds > 0.25 && entry.durationSeconds < 20);
    assert.ok(files[entry.file].peakDBFS < -0.9 && files[entry.file].rmsDBFS > -44);
    const hasId3 = bytes.subarray(0, 3).toString('ascii') === 'ID3';
    const hasMpegHeader = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
    assert.ok(hasId3 || hasMpegHeader, `not an MP3: ${id}`);
    filenames.add(entry.file.split('/').at(-1)!);
  }
  const directory = fileURLToPath(new URL('../../public/audio/chinese-pilot/', import.meta.url));
  assert.deepEqual(readdirSync(directory).filter(name => name.endsWith('.mp3')).sort(), [...filenames].sort());
  assert.deepEqual(Object.keys(files).sort(), [...filenames].map(name => `audio/chinese-pilot/${name}`).sort());
  assert.equal(getChinesePilotAudioEntry('constructor'), undefined);
  assert.equal(getChinesePilotAudioEntry('__proto__'), undefined);
  assert.equal(getChinesePilotAudioEntry('en-01'), undefined);
});

test('lookup stays lazy; a click plays synchronously from the Pages subpath at normal playback speed', () => {
  const player = fixture();
  assert.ok(getChinesePilotAudioEntry(firstId));
  assert.equal(player.media.length, 0);
  assert.deepEqual(player.messages, []);
  player.play(firstId);
  assert.equal(player.media.length, 1);
  const clip = player.media[0];
  assert.equal(clip.url, `/fanfan-word-adventure/${getChinesePilotAudioEntry(firstId)!.file}`);
  assert.equal(clip.preload, 'none');
  assert.equal(clip.playbackRate, 1);
  assert.equal(clip.playCalls, 1);
  assert.deepEqual(player.events, []);
  player.stop();
});

test('only local root, relative, and repository base URLs are playable', () => {
  for (const base of ['', '/', '/fanfan-word-adventure', './']) {
    const player = fixture(base);
    player.play(firstId);
    const prefix = !base ? '/' : base.endsWith('/') ? base : `${base}/`;
    assert.equal(player.media[0].url, `${prefix}${getChinesePilotAudioEntry(firstId)!.file}`);
    player.stop();
  }
  for (const base of ['https://example.com/', '//example.com/', '/../escape/', '/safe/%2e%2e/', '/safe/..\\escape/', '/safe/?redirect=1', '/safe/#fragment']) {
    const player = fixture(base);
    player.play(firstId);
    assert.equal(player.media.length, 0, base);
    assert.match(player.messages.at(-1)!, /请再点一次/);
    assert.deepEqual(player.events, [{ event: 'error', id: firstId }]);
  }
});

test('stopping a pending play is silent, releases the clip, and ignores its late resolution and captured events', async () => {
  const player = fixture();
  player.play(firstId);
  const clip = player.media[0];
  const capturedEnded = clip.onended;
  const capturedError = clip.onerror;
  const messageCount = player.messages.length;
  player.stop();
  player.stop();
  assert.equal(clip.pauseCalls, 1);
  assert.equal(clip.currentTime, 0);
  assert.equal(clip.onended, null);
  assert.equal(clip.onerror, null);
  assert.deepEqual(clip.removedAttributes, ['src']);
  assert.equal(clip.loadCalls, 1);
  clip.resolvePlay();
  capturedEnded?.(new Event('ended'));
  capturedError?.(new Event('error'));
  await settle();
  assert.equal(player.messages.length, messageCount);
  assert.deepEqual(player.events, []);
});

test('moving to a new prompt prevents the previous clip from reporting started, ended, or error', async () => {
  const player = fixture();
  player.play(firstId);
  const previous = player.media[0];
  const capturedEnded = previous.onended;
  const capturedError = previous.onerror;
  player.play(nextId);
  const messageCount = player.messages.length;
  previous.resolvePlay();
  capturedEnded?.(new Event('ended'));
  capturedError?.(new Event('error'));
  await settle();
  assert.equal(player.messages.length, messageCount);
  assert.deepEqual(player.events, []);
  assert.equal(previous.pauseCalls, 1);
  const current = player.media[1];
  current.resolvePlay();
  await settle();
  assert.deepEqual(player.events, [{ event: 'started', id: nextId }]);
  const ended = current.onended;
  ended?.(new Event('ended'));
  ended?.(new Event('ended'));
  assert.deepEqual(player.events, [{ event: 'started', id: nextId }, { event: 'ended', id: nextId }]);
  assert.equal(current.pauseCalls, 1);
});

test('late playback rejections after changing prompts or unmounting do not overwrite current state', async () => {
  const player = fixture();
  player.play(firstId);
  const previous = player.media[0];
  player.play(nextId);
  const messageCount = player.messages.length;
  previous.rejectPlay(new Error('old load aborted'));
  await settle();
  assert.equal(player.messages.length, messageCount);
  assert.deepEqual(player.events, []);
  player.stop();
  player.media[1].rejectPlay(new Error('view unmounted'));
  await settle();
  assert.equal(player.messages.length, messageCount);
  assert.deepEqual(player.events, []);
});

test('a failed recording retries with fresh media; duplicate failure events are suppressed', async () => {
  const player = fixture();
  player.play(firstId);
  const failed = player.media[0];
  const capturedError = failed.onerror;
  failed.rejectPlay(new Error('offline'));
  await settle();
  capturedError?.(new Event('error'));
  assert.deepEqual(player.events, [{ event: 'error', id: firstId }]);
  assert.match(player.messages.at(-1)!, /请再点一次/);
  assert.equal(failed.pauseCalls, 1);
  player.play(firstId);
  assert.equal(player.media.length, 2);
  assert.notEqual(player.media[1], failed);
  assert.equal(player.media[1].url, failed.url);
  player.media[1].resolvePlay();
  await settle();
  assert.deepEqual(player.events, [{ event: 'error', id: firstId }, { event: 'started', id: firstId }]);
  player.media[1].onended?.(new Event('ended'));
  assert.deepEqual(player.events.at(-1), { event: 'ended', id: firstId });
});

test('replaying a pending clip only allows the latest media instance to emit successful events', async () => {
  const player = fixture();
  player.play(firstId);
  player.play(firstId);
  assert.equal(player.media.length, 2);
  player.media[0].resolvePlay();
  await settle();
  assert.deepEqual(player.events, []);
  player.media[1].resolvePlay();
  await settle();
  assert.deepEqual(player.events, [{ event: 'started', id: firstId }]);
  player.stop();
});

test('missing and malformed clips stop previous playback without using remote audio or system speech', () => {
  const player = fixture();
  player.play(firstId);
  player.play('unknown-poem');
  assert.equal(player.media.length, 1);
  assert.equal(player.media[0].pauseCalls, 1);
  assert.match(player.messages.at(-1)!, /还没准备好/);
  assert.deepEqual(player.events, [{ event: 'error', id: 'unknown-poem' }]);
  const entry = getChinesePilotAudioEntry(firstId)!;
  const original = { ...entry };
  try {
    for (const file of ['https://example.com/voice.mp3', 'audio/english/voice.mp3', 'audio/chinese-pilot/../secret.mp3', 'audio/chinese-pilot/%2e%2e/voice.mp3', 'audio/chinese-pilot/voice.mp3?tracking=1']) {
      entry.file = file;
      const invalid = fixture();
      invalid.play(firstId);
      assert.equal(invalid.media.length, 0, file);
      assert.deepEqual(invalid.events, [{ event: 'error', id: firstId }]);
    }
    Object.assign(entry, original);
    for (const patch of [{ spokenText: '' }, { durationSeconds: Number.NaN }, { durationSeconds: 0 }, { bytes: 0 }]) {
      Object.assign(entry, original, patch);
      const invalid = fixture();
      invalid.play(firstId);
      assert.equal(invalid.media.length, 0);
      assert.deepEqual(invalid.events, [{ event: 'error', id: firstId }]);
    }
  } finally {
    Object.assign(entry, original);
  }
});

test('synchronous play and Audio construction failures leave no active audio; legacy void play can succeed', () => {
  const throwing = new FakeAudio('/test.mp3');
  throwing.play = () => { throw new Error('gesture blocked'); };
  const events: string[] = [];
  const player = createChinesePilotAudioPlayer({ baseUrl: '/', onStatus: () => {}, onEvent: event => events.push(event), createAudio: () => throwing });
  assert.doesNotThrow(() => player.play(firstId));
  assert.deepEqual(events, ['error']);
  player.stop();
  assert.equal(throwing.pauseCalls, 1);
  const unavailable = createChinesePilotAudioPlayer({ baseUrl: '/', onStatus: () => {}, onEvent: event => events.push(event), createAudio: () => { throw new Error('Audio unavailable'); } });
  assert.doesNotThrow(() => unavailable.play(firstId));
  assert.deepEqual(events, ['error', 'error']);
  const legacy = new FakeAudio('/test.mp3');
  legacy.play = () => { legacy.playCalls++; };
  const compatible = createChinesePilotAudioPlayer({ baseUrl: '/', onStatus: () => {}, onEvent: event => events.push(event), createAudio: () => legacy });
  compatible.play(firstId);
  assert.equal(legacy.playCalls, 1);
  assert.deepEqual(events, ['error', 'error', 'started']);
  compatible.stop();
});

test('a parent that stops during a status callback suppresses further playback and event callbacks', async () => {
  let stop = () => {};
  const events: string[] = [];
  const clip = new FakeAudio('/test.mp3');
  const player = createChinesePilotAudioPlayer({ baseUrl: '/', onStatus: () => stop(), onEvent: event => events.push(event), createAudio: () => clip });
  stop = player.stop;
  player.play(firstId);
  assert.equal(clip.playCalls, 0);
  assert.equal(clip.pauseCalls, 1);
  clip.resolvePlay();
  await settle();
  assert.deepEqual(events, []);
});
