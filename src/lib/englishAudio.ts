import audioManifest from '../data/englishAudioManifest.json';

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

/** The manifest is bundled; finding a word never starts a network request. */
export function getEnglishAudioEntry(lexemeId: string): EnglishAudioEntry | undefined {
  return Object.prototype.hasOwnProperty.call(manifest.entries, lexemeId)
    ? manifest.entries[lexemeId]
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

interface PlayerOptions {
  baseUrl: string;
  onStatus: (message: string) => void;
  createAudio?: (url: string) => EnglishAudioElement;
}

const errorMessage = '声音暂时没加载出来，请再点一次。';

function localAssetUrl(baseUrl: string, file: string): string | undefined {
  // Fixed local assets only: no encoded traversal, remote URL or arbitrary path.
  if (!/^audio\/english\/[A-Za-z0-9_-]+\.mp3$/.test(file)) return undefined;
  const base = baseUrl || '/';
  if (!base.startsWith('/') && !base.startsWith('./')) return undefined;
  if (base.startsWith('//') || /[\\%?#:]/.test(base)) return undefined;
  if (base.split('/').some(segment => segment === '..')) return undefined;
  return `${base.endsWith('/') ? base : `${base}/`}${file}`;
}

export function createEnglishAudioPlayer({ baseUrl, onStatus, createAudio = url => new Audio(url) }: PlayerOptions) {
  let active: EnglishAudioElement | undefined;

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
    const previous = active;
    active = undefined;
    if (previous) release(previous);
    // Intentionally silent: cleanup can run during React unmount.
  }

  function play(lexemeId: string) {
    stop();
    const entry = getEnglishAudioEntry(lexemeId);
    if (!entry) {
      onStatus('这个词的示范声音还没准备好。');
      return;
    }
    const url = localAssetUrl(baseUrl, entry.file);
    if (!url) {
      onStatus(errorMessage);
      return;
    }

    let clip: EnglishAudioElement;
    try { clip = createAudio(url); } catch {
      onStatus(errorMessage);
      return;
    }
    clip.preload = 'none';
    // The recorded voice was already synthesized at -12%; no extra slowdown.
    clip.playbackRate = 1;
    active = clip;
    const finish = (message: string) => {
      if (active !== clip) return;
      active = undefined;
      release(clip);
      onStatus(message);
    };
    clip.onended = () => finish('再跟着读一遍吧。');
    clip.onerror = () => finish(errorMessage);
    onStatus('正在播放英式慢读示范…');
    if (active !== clip) return;
    try {
      // Keep this call synchronous inside the user's click gesture. Awaiting a
      // manifest fetch first would break playback on some mobile browsers.
      const started = clip.play();
      if (started) void started.catch(() => finish(errorMessage));
    } catch {
      finish(errorMessage);
    }
  }

  return { play, stop };
}
