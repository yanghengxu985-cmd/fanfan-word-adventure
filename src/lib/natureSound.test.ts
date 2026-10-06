import assert from 'node:assert/strict';
import test from 'node:test';
import { createNatureSoundPlayer, type NatureSoundCache, type NatureSoundLayer, type NatureSoundState } from './natureSound';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

class FakeParam {
  value = 1;
  events: Array<{ kind: string; value: number; at: number; constant?: number }> = [];
  setValueAtTime(value: number, at: number) { this.events.push({ kind: 'set', value, at }); }
  linearRampToValueAtTime(value: number, at: number) { this.events.push({ kind: 'ramp', value, at }); }
  cancelScheduledValues(at: number) { this.events.push({ kind: 'cancel', value: this.value, at }); }
  cancelAndHoldAtTime(at: number) { this.events.push({ kind: 'hold', value: this.value, at }); }
  setTargetAtTime(value: number, at: number, constant: number) { this.events.push({ kind: 'target', value, at, constant }); }
}

class FakeGain {
  gain = new FakeParam();
  connections: unknown[] = [];
  disconnectCalls = 0;
  connect(node: unknown) { this.connections.push(node); }
  disconnect() { this.disconnectCalls++; }
}

class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  onended: (() => void) | null = null;
  connections: unknown[] = [];
  starts: number[] = [];
  stopCalls = 0;
  disconnectCalls = 0;
  connect(node: unknown) { this.connections.push(node); }
  start(at: number) { this.starts.push(at); }
  stop() { this.stopCalls++; }
  disconnect() { this.disconnectCalls++; }
}

class FakeContext {
  currentTime = 0;
  destination = {};
  gains: FakeGain[] = [];
  sources: FakeSource[] = [];
  resumeCalls = 0;
  closeCalls = 0;
  decodeCalls = 0;
  duration = 2;
  resumeResult: Promise<void> = Promise.resolve();
  decodeResult?: Promise<AudioBuffer>;
  resume() { this.resumeCalls++; return this.resumeResult; }
  close() { this.closeCalls++; return Promise.resolve(); }
  createGain() { const node = new FakeGain(); this.gains.push(node); return node as unknown as GainNode; }
  createBufferSource() { const node = new FakeSource(); this.sources.push(node); return node as unknown as AudioBufferSourceNode; }
  decodeAudioData() { this.decodeCalls++; return this.decodeResult ?? Promise.resolve({ duration: this.duration } as AudioBuffer); }
}

const layers: NatureSoundLayer[] = [
  { id: 'leaves', source: 'https://classroom.example/audio/leaves.mp3' },
  { id: 'cricket', source: 'https://classroom.example/audio/cricket.mp3' },
  { id: 'geese', source: 'https://classroom.example/audio/geese.mp3' },
];
const response = (ok = true, status = 200) => ({ ok, status, arrayBuffer: async () => new ArrayBuffer(10) }) as Response;
const settle = () => new Promise<void>(resolve => setImmediate(resolve));

function fixture(overrides: {
  layers?: NatureSoundLayer[]; gains?: Record<string, number>; cache?: NatureSoundCache;
  fetcher?: (source: string, signal?: AbortSignal) => Promise<Response>; context?: FakeContext; deadlineMs?: number;
} = {}) {
  const contexts: FakeContext[] = [];
  const requests: string[] = [];
  const states: NatureSoundState[] = [];
  const errors: Error[] = [];
  const timers = new Map<number, () => void>();
  const timerDelays = new Map<number, number>();
  let timerId = 0;
  const cache = overrides.cache ?? new Map();
  const player = createNatureSoundPlayer({
    layers: overrides.layers ?? layers,
    gains: overrides.gains ?? { leaves: .5, cricket: 0, geese: .75 },
    onState: state => states.push(state), onError: error => errors.push(error), cache, deadlineMs: overrides.deadlineMs,
    createContext: () => {
      const context = overrides.context ?? new FakeContext();
      contexts.push(context); return context as unknown as AudioContext;
    },
    fetcher: (async (source: string | URL | Request, init?: RequestInit) => {
      requests.push(String(source));
      return overrides.fetcher ? overrides.fetcher(String(source), init?.signal ?? undefined) : response();
    }) as typeof fetch,
    schedule: (callback, delay) => { const id = ++timerId; timers.set(id, callback); timerDelays.set(id, delay); return id as unknown as ReturnType<typeof setTimeout>; },
    cancelSchedule: timer => { timers.delete(timer as unknown as number); },
  });
  function tick(at: number) {
    contexts.at(-1)!.currentTime = at;
    const [id, callback] = timers.entries().next().value!;
    timers.delete(id); callback();
  }
  return { player, contexts, requests, states, errors, timers, timerDelays, cache, tick };
}

test('unlocks Safari synchronously on the click and waits for every actual recording before playing', async () => {
  const pending = layers.map(() => deferred<Response>());
  const f = fixture({ fetcher: source => pending[layers.findIndex(layer => layer.source === source)].promise });
  assert.equal(f.contexts.length, 0);
  assert.equal(f.requests.length, 0);
  const started = f.player.start();
  assert.equal(f.contexts[0].resumeCalls, 1, 'resume must not wait for network or a promise turn');
  assert.deepEqual(f.states, ['loading']);
  assert.equal(f.contexts[0].sources.length, 0);
  pending[0].resolve(response()); pending[1].resolve(response()); await settle();
  assert.equal(f.player.state, 'loading');
  assert.equal(f.contexts[0].sources.length, 0, 'do not silently play a partial set');
  pending[2].resolve(response()); await started;
  assert.deepEqual(f.states, ['loading', 'playing']);
  assert.equal(f.contexts[0].sources.length, 3);
  assert.ok(f.contexts[0].sources.every(source => source.buffer?.duration === 2 && source.starts.length === 1));
  f.player.stop();
});

test('uses the latest slider values during loading and makes later changes smooth and bounded', async () => {
  const pending = deferred<Response>();
  const f = fixture({ fetcher: () => pending.promise });
  const started = f.player.start();
  f.player.setGain('geese', 1.5); f.player.setGain('cricket', -.2);
  pending.resolve(response()); await started;
  const context = f.contexts[0];
  const layerGains = context.gains.slice(1, 4);
  assert.deepEqual(layerGains.map(gain => gain.gain.value), [.5, 0, 1]);
  assert.ok(context.gains[0].gain.value * layers.length <= .8, 'all full-volume layers cannot sum above the master bound');
  context.currentTime = 1.25;
  f.player.setGain('geese', .4);
  assert.equal(layerGains[2].gain.events.at(-2)!.kind, 'hold', 'preserve the current ramp instead of jumping back to its initial gain');
  assert.deepEqual(layerGains[2].gain.events.at(-1), { kind: 'target', value: .4, at: 1.25, constant: .025 });
  f.player.setGain('geese', Number.NaN);
  assert.equal(layerGains[2].gain.events.at(-1)!.value, 0);
  f.player.stop();
});

test('stopping pending network work cannot cause a late start or overwrite the stopped state', async () => {
  const pending = deferred<Response>();
  const f = fixture({ fetcher: () => pending.promise });
  const started = f.player.start();
  f.player.stop(); f.player.stop();
  assert.equal(f.contexts[0].closeCalls, 1);
  pending.resolve(response()); await started;
  assert.equal(f.contexts[0].sources.length, 0);
  assert.deepEqual(f.states, ['loading', 'idle']);
  assert.equal(f.errors.length, 0);
  assert.equal(f.timers.size, 0);
});

test('stale failures after a stop are ignored rather than showing an error for the new page', async () => {
  const pending = deferred<Response>();
  const f = fixture({ fetcher: () => pending.promise });
  const started = f.player.start(); f.player.stop();
  pending.reject(new Error('late network failure')); await started;
  assert.equal(f.player.state, 'idle');
  assert.equal(f.errors.length, 0);
  assert.equal(f.cache.size, 0, 'failed downloads must not poison retry');
});

test('a stalled download times out, aborts the request and allows a fresh successful retry', async () => {
  let signal: AbortSignal | undefined;
  let requests = 0;
  const f = fixture({ layers: [layers[0]], deadlineMs: 5000, fetcher: async (_, requestSignal) => {
    signal = requestSignal;
    return ++requests === 1 ? new Promise<Response>(() => {}) : response();
  } });
  const started = f.player.start();
  assert.deepEqual([...f.timerDelays.values()], [5000]);
  f.tick(5); await started;
  assert.equal(f.player.state, 'error');
  assert.match(f.errors[0].message, /timed out/);
  assert.equal(signal!.aborted, true);
  assert.equal(f.cache.size, 0);
  assert.equal(f.contexts[0].sources.length, 0);
  await f.player.start();
  assert.equal(f.requests.length, 2);
  assert.equal(f.player.state, 'playing');
  f.player.stop();
});

test('stalled decoding and context resume also time out instead of leaving loading forever', async () => {
  for (const phase of ['decode', 'resume']) {
    const context = new FakeContext();
    if (phase === 'decode') context.decodeResult = new Promise(() => {});
    else context.resumeResult = new Promise(() => {});
    const f = fixture({ context, layers: [layers[0]] });
    const started = f.player.start(); await settle();
    assert.equal(f.player.state, 'loading');
    assert.deepEqual([...f.timerDelays.values()], [20_000]);
    f.tick(20); await started;
    assert.equal(f.player.state, 'error', phase);
    assert.equal(context.closeCalls, 1);
    assert.equal(context.sources.length, 0);
    assert.equal(f.timers.size, 0);
    if (phase === 'decode') assert.equal(f.cache.size, 0);
  }
});

test('cancelling and immediately retrying never reuses a decode tied to the cancelled context', async () => {
  const firstResponse = deferred<Response>();
  let requests = 0;
  const f = fixture({ layers: [layers[0]], fetcher: async () => ++requests === 1 ? firstResponse.promise : response() });
  const oldStart = f.player.start(); f.player.stop();
  assert.equal(f.cache.size, 0);
  const newStart = f.player.start();
  await newStart;
  firstResponse.resolve(response()); await oldStart;
  assert.equal(f.requests.length, 2);
  assert.equal(f.contexts[0].decodeCalls, 0, 'do not decode a late download in the closed context');
  assert.equal(f.contexts[1].sources.length, 1);
  assert.equal(f.player.state, 'playing');
  assert.equal(f.errors.length, 0);
  f.player.stop();
});

test('stopping one pending player retains a shared request and decode context needed by another', async () => {
  const pending = deferred<Response>();
  const cache: NatureSoundCache = new Map();
  const one = fixture({ cache, layers: [layers[0]], fetcher: () => pending.promise });
  const two = fixture({ cache, layers: [layers[0]] });
  const firstStart = one.player.start(); const secondStart = two.player.start();
  assert.equal(two.requests.length, 0);
  one.player.stop();
  assert.equal(one.contexts[0].closeCalls, 0, 'preserve the silent decode context until shared loading settles');
  pending.resolve(response()); await Promise.all([firstStart, secondStart]); await settle();
  assert.equal(one.player.state, 'idle');
  assert.equal(one.contexts[0].sources.length, 0);
  assert.equal(one.contexts[0].closeCalls, 1);
  assert.equal(two.player.state, 'playing');
  assert.equal(two.errors.length, 0);
  two.player.stop();
});

test('failed downloads and corrupt recordings are retryable and start never rejects unhandled', async () => {
  let broken = true;
  const f = fixture({ layers: [layers[0]], fetcher: async () => response(!broken, broken ? 404 : 200) });
  await assert.doesNotReject(f.player.start());
  assert.equal(f.player.state, 'error');
  assert.equal(f.errors.length, 1);
  assert.equal(f.cache.size, 0);
  broken = false; await f.player.start();
  assert.equal(f.player.state, 'playing');
  assert.equal(f.requests.length, 2);
  f.player.stop();

  const context = new FakeContext();
  context.decodeResult = Promise.reject(new Error('corrupt MP3'));
  const corrupt = fixture({ context, layers: [layers[0]] });
  await assert.doesNotReject(corrupt.player.start());
  assert.equal(corrupt.player.state, 'error');
  assert.equal(corrupt.cache.size, 0);
});

test('a shared cache avoids repeat downloads/decodes while every player owns its own stoppable nodes', async () => {
  const cache: NatureSoundCache = new Map();
  const first = fixture({ cache }); const second = fixture({ cache });
  await first.player.start(); await second.player.start();
  assert.equal(first.requests.length, 3);
  assert.equal(second.requests.length, 0);
  assert.equal(second.contexts[0].decodeCalls, 0);
  assert.equal(first.contexts[0].sources[0].buffer, second.contexts[0].sources[0].buffer);
  first.player.stop();
  assert.ok(first.contexts[0].sources.every(source => source.stopCalls === 1));
  assert.ok(second.contexts[0].sources.every(source => source.stopCalls === 0));
  assert.equal(second.player.state, 'playing');
  second.player.stop();
});

test('repeated start clicks share one pending start; stopping is idempotent and cancels the loop scheduler', async () => {
  const f = fixture();
  const one = f.player.start(); const two = f.player.start();
  assert.equal(one, two);
  await one;
  await f.player.start();
  assert.equal(f.contexts.length, 1);
  assert.equal(f.contexts[0].sources.length, 3);
  assert.equal(f.timers.size, 1);
  f.player.stop(); f.player.stop();
  assert.equal(f.timers.size, 0);
  assert.equal(f.contexts[0].closeCalls, 1);
  assert.ok(f.contexts[0].sources.every(source => source.stopCalls === 1 && source.disconnectCalls === 1 && source.onended === null));
});

test('loops whole recordings with a short complementary crossfade, retaining animal-call silence', async () => {
  const f = fixture({ layers: [layers[2]] });
  await f.player.start();
  const context = f.contexts[0];
  const first = context.sources[0];
  assert.equal(first.loop, false, 'an oscillator or rapidly repeated chirp is not a recording');
  assert.deepEqual(first.starts, [.025]);
  f.tick(1.8);
  assert.equal(context.sources.length, 2);
  const next = context.sources[1];
  const envelope = first.connections[0] as FakeGain;
  const nextEnvelope = next.connections[0] as FakeGain;
  const fadeOut = envelope.gain.events[2];
  assert.ok(Math.abs(next.starts[0] - fadeOut.at) < 1e-9);
  assert.ok(Math.abs(nextEnvelope.gain.events[1].at - envelope.gain.events[3].at) < 1e-9);
  assert.ok(next.starts[0] - first.starts[0] > 1.9, 'repeat the original 2-second recording, not a synthesised pulse');
  f.tick(10);
  assert.equal(context.sources.length, 3, 'a delayed timer should not unleash many overdue calls at once');
  f.player.stop();
});

test('a finite recording returns to idle on completion and needs no recurring timer', async () => {
  const f = fixture({ layers: [{ ...layers[0], loop: false }] });
  await f.player.start();
  assert.equal(f.timers.size, 0);
  f.contexts[0].sources[0].onended!();
  assert.equal(f.player.state, 'idle');
  assert.equal(f.contexts[0].closeCalls, 1);
});

test('an asynchronous loop scheduling failure reports an error and releases the existing sound', async () => {
  const f = fixture({ layers: [layers[0]] });
  await f.player.start();
  f.contexts[0].createBufferSource = () => { throw new Error('audio device became unavailable'); };
  assert.doesNotThrow(() => f.tick(1.8));
  assert.equal(f.player.state, 'error');
  assert.equal(f.errors[0].message, 'audio device became unavailable');
  assert.equal(f.contexts[0].sources[0].stopCalls, 1);
  assert.equal(f.timers.size, 0);
});

test('context resume failures and missing browser audio support produce a clear error without starting sources', async () => {
  const context = new FakeContext();
  context.resumeResult = Promise.reject(new Error('blocked audio context'));
  const f = fixture({ context });
  await assert.doesNotReject(f.player.start());
  assert.equal(f.player.state, 'error');
  assert.equal(context.sources.length, 0);
  assert.equal(context.closeCalls, 1);
  assert.equal(f.errors[0].message, 'blocked audio context');
  const states: NatureSoundState[] = [];
  const unavailable = createNatureSoundPlayer({ layers, gains: {}, onState: state => states.push(state) });
  await assert.doesNotReject(unavailable.start());
  assert.deepEqual(states, ['error']);
});
