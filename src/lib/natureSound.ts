export type NatureSoundState = 'idle' | 'loading' | 'playing' | 'error';
export type NatureSoundLayer = { id: string; source: string; loop?: boolean };
export type NatureSoundCache = Map<string, Promise<AudioBuffer>>;

type Options = {
  layers: readonly NatureSoundLayer[];
  gains: Readonly<Record<string, number>>;
  onState: (state: NatureSoundState) => void;
  onError?: (error: Error) => void;
  // Injection keeps cancellation, scheduling and loading failures testable without speakers.
  createContext?: () => AudioContext;
  fetcher?: typeof fetch;
  cache?: NatureSoundCache;
  deadlineMs?: number;
  schedule?: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  cancelSchedule?: (timer: ReturnType<typeof setTimeout>) => void;
};

const recordingCache: NatureSoundCache = new Map();
const recordingRequests = new WeakMap<Promise<AudioBuffer>, { controller: AbortController; consumers: Set<symbol>; settled: boolean }>();
const safeGain = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

function browserContext() {
  const browser = typeof window === 'undefined' ? undefined : window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
  const Context = browser?.AudioContext || browser?.webkitAudioContext;
  if (!Context) throw new Error('This browser does not support recorded nature audio.');
  return new Context();
}

function loadRecording(context: AudioContext, source: string, options: Options, consumer: symbol) {
  const cache = options.cache ?? recordingCache;
  const cached = cache.get(source);
  if (cached) {
    const request = recordingRequests.get(cached);
    if (request && !request.settled) request.consumers.add(consumer);
    return cached;
  }
  const request = { controller: new AbortController(), consumers: new Set([consumer]), settled: false };
  const aborted = new Promise<never>((_, reject) => request.controller.signal.addEventListener('abort', () => reject(new Error('Nature recording loading was cancelled.')), { once: true }));
  const operation = (async () => {
    const response = await (options.fetcher ?? fetch)(source, { signal: request.controller.signal });
    if (!response.ok) throw new Error(`Nature recording could not be loaded (${response.status}).`);
    const bytes = await response.arrayBuffer();
    if (request.controller.signal.aborted) throw new Error('Nature recording loading was cancelled.');
    const buffer = await context.decodeAudioData(bytes);
    if (!Number.isFinite(buffer.duration) || buffer.duration < .1) throw new Error('Nature recording is empty or invalid.');
    return buffer;
  })();
  const promise = Promise.race([operation, aborted]);
  recordingRequests.set(promise, request);
  cache.set(source, promise);
  // The finite catalogue is small; do not retain an unbounded collection of decoded recordings.
  if (cache.size > 16) cache.delete(cache.keys().next().value!);
  void promise.then(() => { request.settled = true; request.consumers.clear(); }, () => {
    request.settled = true; request.consumers.clear();
    if (cache.get(source) === promise) cache.delete(source);
  });
  return promise;
}

/** Plays complete recordings, including the natural pauses between animal calls. */
export function createNatureSoundPlayer(options: Options) {
  let state: NatureSoundState = 'idle';
  let context: AudioContext | undefined;
  let generation = 0;
  let startPromise: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let detachEvents: (() => void) | undefined;
  const layerGains = new Map<string, GainNode>();
  const levels = new Map(options.layers.map(layer => [layer.id, safeGain(options.gains[layer.id] ?? 0)]));
  const nodes = new Map<AudioBufferSourceNode, GainNode>();
  const consumer = Symbol('nature-player');
  const activeRecordings = new Map<Promise<AudioBuffer>, string>();
  const schedule: NonNullable<Options['schedule']> = options.schedule ?? ((callback, delayMs) => globalThis.setTimeout(callback, delayMs));
  const cancelSchedule: NonNullable<Options['cancelSchedule']> = options.cancelSchedule ?? (pending => globalThis.clearTimeout(pending));

  function setState(next: NatureSoundState) {
    if (next === state) return;
    state = next;
    options.onState(next);
  }

  function release() {
    generation++;
    if (timer !== undefined) cancelSchedule(timer);
    timer = undefined;
    if (deadline !== undefined) cancelSchedule(deadline);
    deadline = undefined;
    detachEvents?.(); detachEvents = undefined;
    for (const [source, envelope] of nodes) {
      source.onended = null;
      try { source.stop(); } catch { /* Already ended. */ }
      source.disconnect(); envelope.disconnect();
    }
    nodes.clear();
    for (const gain of layerGains.values()) gain.disconnect();
    layerGains.clear();
    const previous = context;
    context = undefined; startPromise = undefined;
    const sharedPending: Promise<AudioBuffer>[] = [];
    for (const [promise, source] of activeRecordings) {
      const request = recordingRequests.get(promise);
      if (!request || request.settled) continue;
      request.consumers.delete(consumer);
      if (request.consumers.size) sharedPending.push(promise);
      else {
        const cache = options.cache ?? recordingCache;
        if (cache.get(source) === promise) cache.delete(source);
        request.controller.abort();
      }
    }
    activeRecordings.clear();
    const close = () => { try { void previous?.close().catch(() => {}); } catch { /* Already closed. */ } };
    // Another player may still decode a shared download using this context. It is silent now.
    if (sharedPending.length) void Promise.allSettled(sharedPending).then(close);
    else close();
  }

  function stop() { release(); setState('idle'); }

  function fail(error: unknown, expectedGeneration: number) {
    if (expectedGeneration !== generation) return;
    release();
    setState('error');
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  }

  function setGain(id: string, value: number) {
    if (!levels.has(id)) return;
    const level = safeGain(value);
    levels.set(id, level);
    const gain = layerGains.get(id);
    if (gain && context) {
      // Holding the current ramp avoids snapping back to the earlier slider value.
      gain.gain.cancelAndHoldAtTime?.(context.currentTime);
      gain.gain.setTargetAtTime(level, context.currentTime, .025);
    }
  }

  function start(): Promise<void> {
    if (startPromise && (state === 'loading' || state === 'playing')) return startPromise;
    const version = ++generation;
    let active: AudioContext;
    let resume: Promise<void>;
    try {
      if (!options.layers.length || options.layers.some(layer => !layer.id || !layer.source.trim())
        || new Set(options.layers.map(layer => layer.id)).size !== options.layers.length) {
        throw new Error('Nature sound layers are missing or invalid.');
      }
      active = (options.createContext ?? browserContext)();
      context = active;
      // Keep resume inside the button's synchronous user gesture, before any fetch/await (Safari).
      resume = active.resume();
    } catch (error) {
      fail(error, version);
      return Promise.resolve();
    }
    setState('loading');
    if (version !== generation) { void resume.catch(() => {}); return Promise.resolve(); }
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const hide = () => { if (document.hidden) stop(); };
      window.addEventListener('hashchange', stop);
      window.addEventListener('pagehide', stop);
      document.addEventListener('visibilitychange', hide);
      detachEvents = () => {
        window.removeEventListener('hashchange', stop);
        window.removeEventListener('pagehide', stop);
        document.removeEventListener('visibilitychange', hide);
      };
    }
    startPromise = (async () => {
      let loadingTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        const recordings = options.layers.map(layer => {
          const promise = loadRecording(active, layer.source, options, consumer);
          activeRecordings.set(promise, layer.source); return promise;
        });
        const expired = new Promise<never>((_, reject) => {
          const requested = options.deadlineMs ?? 20_000;
          loadingTimer = schedule(() => reject(new Error('Nature recording loading timed out. Please try again.')), Number.isFinite(requested) && requested > 0 ? requested : 20_000);
          deadline = loadingTimer;
        });
        const [, buffers] = await Promise.race([Promise.all([
          resume,
          Promise.all(recordings),
        ]), expired]);
        if (loadingTimer !== undefined) cancelSchedule(loadingTimer);
        if (deadline === loadingTimer) deadline = undefined;
        if (version !== generation || context !== active) return;
        const master = active.createGain();
        // Bound the sum even when every normalised recording and slider reaches its peak.
        master.gain.value = .8 / options.layers.length;
        master.connect(active.destination);
        const voices = options.layers.map((layer, index) => {
          const gain = active.createGain();
          gain.gain.value = levels.get(layer.id) ?? 0;
          gain.connect(master); layerGains.set(layer.id, gain);
          return { layer, gain, buffer: buffers[index], nextAt: active.currentTime + .025, scheduled: false };
        });

        const queue = () => {
          if (version !== generation || context !== active) return;
          for (const voice of voices) {
            const loop = voice.layer.loop !== false;
            const fade = Math.min(.04, voice.buffer.duration / 10);
            while (voice.nextAt < active.currentTime + .2 && (loop || !voice.scheduled)) {
              // Recover a throttled timer without scheduling a burst of overdue calls.
              const at = Math.max(voice.nextAt, active.currentTime + .005);
              const end = at + voice.buffer.duration;
              const source = active.createBufferSource();
              const envelope = active.createGain();
              source.buffer = voice.buffer;
              source.connect(envelope); envelope.connect(voice.gain);
              envelope.gain.setValueAtTime(0, at);
              envelope.gain.linearRampToValueAtTime(1, at + fade);
              envelope.gain.setValueAtTime(1, end - fade);
              envelope.gain.linearRampToValueAtTime(0, end);
              nodes.set(source, envelope);
              source.onended = () => {
                if (!nodes.has(source)) return;
                nodes.delete(source); source.onended = null; source.disconnect(); envelope.disconnect();
                if (version === generation && voices.every(item => item.layer.loop === false) && !nodes.size) stop();
              };
              source.start(at);
              voice.scheduled = true;
              // Only the tiny recording boundaries overlap; natural call cadence stays intact.
              voice.nextAt = end - fade;
            }
          }
          if (voices.some(voice => voice.layer.loop !== false)) timer = schedule(() => {
            try { queue(); } catch (error) { fail(error, version); }
          }, 50);
        };
        queue();
        if (version === generation && context === active) setState('playing');
      } catch (error) { fail(error, version); }
      finally {
        if (loadingTimer !== undefined) cancelSchedule(loadingTimer);
        if (deadline === loadingTimer) deadline = undefined;
      }
    })();
    return startPromise;
  }

  return { start, setGain, stop, get state() { return state; } };
}
