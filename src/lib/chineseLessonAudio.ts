import manifest from '../data/chineseLessonsAudioManifest.json';
import pilotManifest from '../data/chinesePilotAudioManifest.json';

type Entry = { file: string; text: string; spokenText: string; durationSeconds: number; bytes: number };
const entries = manifest.entries as Record<string, Entry>;
const pilotEntries = pilotManifest.entries as Record<string, Entry>;
const pilotByText = new Map(Object.values(pilotEntries).map(entry => [entry.text, entry]));
export function getLessonAudioEntry(id: string, text?: string): Entry | undefined {
  return Object.hasOwn(entries, id) ? entries[id] : text ? pilotByText.get(text) : undefined;
}

export type ChineseLessonAudioElement = Pick<HTMLAudioElement, 'preload' | 'playbackRate' | 'onended' | 'onerror' | 'play' | 'pause' | 'removeAttribute' | 'load'>;
export function createChineseLessonAudioPlayer(options: { baseUrl: string; onStatus: (message: string) => void; onEvent?: (event: 'ended' | 'error', id: string) => void; createAudio?: (url: string) => ChineseLessonAudioElement }) {
  let current: ChineseLessonAudioElement | undefined;
  let version = 0;
  function release(audio: ChineseLessonAudioElement) {
    audio.onended = null; audio.onerror = null; audio.pause();
    audio.removeAttribute('src'); audio.load();
  }
  function stop() { version++; const previous = current; current = undefined; if (previous) release(previous); }
  function play(id: string, text?: string) {
    stop();
    const generation = version;
    const entry = getLessonAudioEntry(id, text);
    const base = options.baseUrl || '/';
    if (!entry || !/^audio\/chinese-(?:lessons|pilot)\/[a-z0-9_-]+\.mp3$/.test(entry.file)
      || !entry.spokenText?.trim() || !(entry.durationSeconds > 0) || !(entry.bytes > 0)
      || (!base.startsWith('/') && !base.startsWith('./')) || base.startsWith('//') || /[\\%?#:\s\u0000-\u001f\u007f]/.test(base) || base.split('/').includes('..')) {
      options.onStatus('这个读音请先对照课本，或请老师示范。');
      if (generation === version) options.onEvent?.('error', id); return;
    }
    let audio: ChineseLessonAudioElement;
    try { audio = (options.createAudio || (url => new Audio(url)))(`${base.endsWith('/') ? base : `${base}/`}${entry.file}`); }
    catch { options.onStatus('声音暂时没加载出来，请再点一次。'); if (generation === version) options.onEvent?.('error', id); return; }
    current = audio; audio.preload = 'none'; audio.playbackRate = 1;
    const finish = (event: 'ended' | 'error') => {
      if (current !== audio || generation !== version) return;
      current = undefined; release(audio);
      options.onStatus(event === 'ended' ? '可以跟着再读一遍。' : '声音暂时没加载出来，请再点一次。');
      if (generation === version) options.onEvent?.(event, id);
    };
    audio.onended = () => finish('ended'); audio.onerror = () => finish('error');
    options.onStatus('正在播放合成练习示范…');
    if (current !== audio || generation !== version) return;
    try {
      Promise.resolve(audio.play()).catch(() => { if (generation === version && current === audio) finish('error'); });
    } catch { finish('error'); }
  }
  return { play, stop };
}
