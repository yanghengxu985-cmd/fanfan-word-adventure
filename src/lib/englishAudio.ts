import audioManifest from '../data/englishAudioManifest.json';
import activityAudioManifest from '../data/englishActivityAudioManifest.json';

export interface EnglishAudioEntry {
  file: string;
  text: string;
  spokenText: string;
  durationSeconds: number;
  bytes: number;
}

interface EnglishAudioManifest {
  schemaVersion: number;
  voice: string;
  rate: string;
  locale: string;
  entries: Record<string, EnglishAudioEntry>;
}

const manifest = audioManifest as EnglishAudioManifest;
const activityManifest = activityAudioManifest as EnglishAudioManifest;

/** The manifest is bundled; finding a word never starts a network request. */
export function getEnglishAudioEntry(lexemeId: string): EnglishAudioEntry | undefined {
  return Object.prototype.hasOwnProperty.call(manifest.entries, lexemeId)
    ? manifest.entries[lexemeId]
    : undefined;
}

/** Activity clips are separate assets; they do not add textbook word records. */
export function getEnglishActivityAudioEntry(clipId: string): EnglishAudioEntry | undefined {
  return Object.prototype.hasOwnProperty.call(activityManifest.entries, clipId)
    ? activityManifest.entries[clipId]
    : undefined;
}

/** Small injectable media surface so playback races can be tested without a DOM. */
export interface EnglishAudioElement {
  preload: HTMLMediaElement['preload'];
  playbackRate: number;
  currentTime: number;
  onended: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  play(): Promise<void> | void;
  pause(): void;
  removeAttribute(name: string): void;
  load(): void;
}

export interface PlayerOptions {
  baseUrl: string;
  onStatus: (message: string) => void;
  onEvent?: (event: 'started' | 'ended' | 'error', id: string) => void;
  createAudio?: (url: string) => EnglishAudioElement;
}

const errorMessage = '声音暂时没加载出来，请再点一次。';

function localAssetUrl(baseUrl: string, file: string): string | undefined {
  // Fixed local assets only: no encoded traversal, remote URL or arbitrary path.
  if (!/^audio\/(?:english|english-activities)\/[A-Za-z0-9_-]+\.mp3$/.test(file)) return undefined;
  const base = baseUrl || '/';
  if (!base.startsWith('/') && !base.startsWith('./')) return undefined;
  if (base.startsWith('//') || /[\\%?#:]/.test(base)) return undefined;
  if (base.split('/').some(segment => segment === '..')) return undefined;
  return `${base.endsWith('/') ? base : `${base}/`}${file}`;
}

export function createEnglishAudioPlayer({ baseUrl, onStatus, onEvent, createAudio = url => new Audio(url) }: PlayerOptions) {
  let active: EnglishAudioElement | undefined;
  let generation = 0;

  function release(clip: EnglishAudioElement) {
    clip.onended = null;
    clip.onerror = null;
    clip.pause();
    try { clip.currentTime = 0; } catch { /* An unloaded clip may not be seekable yet. */ }
    // Removing src also releases any in-flight download. Never set src to "",
    // which some browsers interpret as a request for the current page.
    clip.removeAttribute('src');
    clip.load();
  }

  function stop() {
    generation++;
    const previous = active;
    active = undefined;
    if (previous) release(previous);
    // Intentionally silent: cleanup can run during React unmount.
  }

  function play(clipId: string) {
    stop();
    const currentGeneration = generation;
    const reportError = (message: string) => {
      onStatus(message);
      if (generation === currentGeneration) onEvent?.('error', clipId);
    };
    const entry = getEnglishAudioEntry(clipId) ?? getEnglishActivityAudioEntry(clipId);
    if (!entry) {
      reportError('这个词的示范声音还没准备好。');
      return;
    }
    if (typeof entry.file !== 'string' || typeof entry.spokenText !== 'string'
      || !entry.spokenText.trim() || !Number.isFinite(entry.durationSeconds)
      || entry.durationSeconds <= 0 || !Number.isFinite(entry.bytes) || entry.bytes <= 0) {
      reportError(errorMessage);
      return;
    }
    const url = localAssetUrl(baseUrl, entry.file);
    if (!url) {
      reportError(errorMessage);
      return;
    }

    let clip: EnglishAudioElement;
    try { clip = createAudio(url); } catch {
      reportError(errorMessage);
      return;
    }
    clip.preload = 'none';
    // The recorded voice was already synthesized at -12%; no extra slowdown.
    clip.playbackRate = 1;
    active = clip;
    let hasStarted = false;
    const notifyStarted = () => {
      if (active !== clip || hasStarted) return;
      hasStarted = true;
      onEvent?.('started', clipId);
    };
    const finish = (message: string, event: 'ended' | 'error') => {
      if (active !== clip) return;
      active = undefined;
      release(clip);
      onStatus(message);
      if (generation === currentGeneration) onEvent?.(event, clipId);
    };
    clip.onended = () => finish('再跟着读一遍吧。', 'ended');
    clip.onerror = () => finish(errorMessage, 'error');
    onStatus('正在播放英式慢读示范…');
    if (active !== clip) return;
    try {
      // Keep this call synchronous inside the user's click gesture. Awaiting a
      // manifest fetch first would break playback on some mobile browsers.
      const started = clip.play();
      if (started) void started.then(notifyStarted, () => finish(errorMessage, 'error'));
      else notifyStarted(); // Legacy browsers return void after a successful play().
    } catch {
      finish(errorMessage, 'error');
    }
  }

  return { play, stop };
}
