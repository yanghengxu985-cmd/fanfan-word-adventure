import deliveryManifest from '../data/chineseImageDelivery.json';

export type ImageStatus = 'loading' | 'ready' | 'error';
export type ImageSnapshot = { status: ImageStatus; url: string };
type DeliveryAsset = { full: string; preview: string; width: number; height: number };
const assets = deliveryManifest as Record<string, DeliveryAsset>;
export function hasImageDelivery(source: string) { return Object.hasOwn(assets, source); }

export function getAtlasImageDelivery(source: string, index: number) {
  const key = `${source}#frame=${index}`;
  return { source: assets[key] ? key : source, split: Boolean(assets[key]) };
}

/** Keep the original artwork path in lesson data; choose its smaller web copy here. */
export function getImageDelivery(source: string, base = import.meta.env?.BASE_URL ?? '/') {
  const imagePath = source.indexOf('images/');
  const key = imagePath >= 0 ? source.slice(imagePath) : source;
  const asset = assets[key];
  const originalUrl = source.startsWith('images/') ? `${base}${source}` : source;
  return { full: asset ? `${base}${asset.full}` : originalUrl, preview: asset ? `${base}${asset.preview}` : undefined };
}

export function createImageDeliveryCache(load: (url: string) => Promise<void>) {
  type Entry = { snapshot: ImageSnapshot; listeners: Set<() => void>; started: boolean; generation: number };
  const entries = new Map<string, Entry>();
  function entry(url: string): Entry {
    let value = entries.get(url);
    if (!value) {
      value = { snapshot: { status: 'loading', url }, listeners: new Set(), started: false, generation: 0 };
      entries.set(url, value);
    }
    return value;
  }
  function notify(value: Entry) { value.listeners.forEach(listener => listener()); }
  function start(url: string, value: Entry, retry = false) {
    value.started = true;
    const generation = ++value.generation;
    // Failed HTTP responses must not make the retry repeat a cached failure.
    const requestedUrl = retry ? `${url}${url.includes('?') ? '&' : '?'}retry=${Date.now()}-${generation}` : url;
    value.snapshot = { status: 'loading', url: requestedUrl };
    notify(value);
    void load(requestedUrl).then(() => {
      if (generation !== value.generation) return;
      value.snapshot = { status: 'ready', url: requestedUrl }; notify(value);
    }, () => {
      if (generation !== value.generation) return;
      value.snapshot = { status: 'error', url: requestedUrl }; notify(value);
    });
  }
  return {
    getSnapshot: (url: string) => entry(url).snapshot,
    subscribe(url: string, listener: () => void) {
      const value = entry(url); value.listeners.add(listener);
      if (!value.started) start(url, value);
      return () => { value.listeners.delete(listener); };
    },
    retry(url: string) { start(url, entry(url), true); },
  };
}

function decodeImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return; settled = true;
      window.clearTimeout(timer); image.onload = null; image.onerror = null;
      if (error) { image.src = ''; reject(error); } else resolve();
    };
    const timer = window.setTimeout(() => finish(new Error('Image download timed out')), 25000);
    image.onload = () => {
      if (typeof image.decode === 'function') void image.decode().then(() => finish(), () => finish(new Error('Image could not be decoded')));
      else finish();
    };
    image.onerror = () => finish(new Error('Image download failed'));
    image.decoding = 'async'; image.src = url;
  });
}

// One request per displayed source, shared by SVG crops, magnifiers and CSS sprites.
// Browser HTTP caching handles later visits; no HTML/service-worker cache can hide a new release.
export const imageDeliveryCache = createImageDeliveryCache(decodeImage);
