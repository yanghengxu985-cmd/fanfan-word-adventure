import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, useSyncExternalStore, type HTMLAttributes, type ImgHTMLAttributes, type SVGProps } from 'react';
import { getImageDelivery, imageDeliveryCache, type ImageSnapshot, type ImageStatus } from '../lib/imageDelivery';
import './sceneImageFrame.css';

type TrackedImage = { source: string; status: ImageStatus; retry: () => void };
type ImageFrameContext = { register: (id: string, image: TrackedImage) => void; remove: (id: string) => void };
const ImageFrame = createContext<ImageFrameContext | null>(null);

export function useSceneImageSource(source: string) {
  const id = useId();
  const frame = useContext(ImageFrame);
  const { full, preview } = getImageDelivery(source);
  const subscribe = useCallback((listener: () => void) => imageDeliveryCache.subscribe(full, listener), [full]);
  const read = useCallback((): ImageSnapshot => imageDeliveryCache.getSnapshot(full), [full]);
  const snapshot = useSyncExternalStore(subscribe, read, read);
  const retry = useCallback(() => imageDeliveryCache.retry(full), [full]);
  useEffect(() => { frame?.register(id, { source, status: snapshot.status, retry }); }, [frame, id, source, snapshot.status, retry]);
  useEffect(() => () => frame?.remove(id), [frame, id]);
  const selectedUrl = snapshot.status === 'ready' ? snapshot.url : preview ?? snapshot.url;
  // CSS sprite custom properties also need document-based URLs on Pages subpaths.
  const src = typeof document === 'undefined' ? selectedUrl : new URL(selectedUrl, document.baseURI).href;
  return { src, status: snapshot.status, retry };
}

/** Keep the same root element and geometry; show feedback inside the existing picture. */
export function SceneImageFrame({ as: Tag = 'div', children, ...attributes }: HTMLAttributes<HTMLElement> & { as?: 'div' | 'figure' }) {
  const [images, setImages] = useState<Record<string, TrackedImage>>({});
  const register = useCallback((id: string, image: TrackedImage) => setImages(current => {
    const previous = current[id];
    if (previous?.source === image.source && previous.status === image.status && previous.retry === image.retry) return current;
    return { ...current, [id]: image };
  }), []);
  const remove = useCallback((id: string) => setImages(current => {
    if (!current[id]) return current;
    const next = { ...current }; delete next[id]; return next;
  }), []);
  const context = useMemo(() => ({ register, remove }), [register, remove]);
  const tracked = Object.values(images);
  const failures = tracked.filter(image => image.status === 'error');
  const loading = tracked.some(image => image.status === 'loading');
  const status = failures.length ? 'error' : loading ? 'loading' : 'ready';
  return <Tag {...attributes} className={`${attributes.className ?? ''} scene-image-frame`} data-image-status={status} aria-busy={loading || undefined}>
    <ImageFrame.Provider value={context}>{children}</ImageFrame.Provider>
    {status !== 'ready' && <div className="scene-image-feedback" role="status" aria-live="polite">
      {status === 'loading' ? <><i aria-hidden="true" /><span>画面加载中…</span></> : <>
        <span>画面暂未加载完成</span><button type="button" onClick={() => new Map(failures.map(image => [image.source, image])).forEach(image => image.retry())}>重新加载</button>
      </>}
    </div>}
  </Tag>;
}

export function ProgressiveImage({ source, ...attributes }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & { source: string }) {
  const { src, status } = useSceneImageSource(source);
  return <img {...attributes} src={src} decoding="async" data-image-quality={status === 'ready' ? 'full' : 'preview'} />;
}

export function ProgressiveSvgImage({ source, ...attributes }: Omit<SVGProps<SVGImageElement>, 'href' | 'xlinkHref'> & { source: string }) {
  const { src, status } = useSceneImageSource(source);
  return <image {...attributes} href={src} data-image-quality={status === 'ready' ? 'full' : 'preview'} />;
}
