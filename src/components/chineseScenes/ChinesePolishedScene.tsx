import { useEffect, useId, useState, type ReactNode } from 'react';
import type { SemanticSceneProps } from './ChineseSemanticScene';
import type { PolishedFrame } from './polishedSceneTypes';
import { ProgressiveSvgImage, useSceneImageSource } from '../SceneImageFrame';
import { getAtlasImageDelivery } from '../../lib/imageDelivery';

export function PolishedAtlasImage({ frame }: { frame: PolishedFrame; onError?: () => void }) {
  const column = frame.index % frame.columns;
  const row = Math.floor(frame.index / frame.columns);
  const delivery = getAtlasImageDelivery(frame.file, frame.index);
  return <svg width="900" height="600"
    viewBox={`${column * 900 + 3} ${row * 600 + 3} 894 594`}
    preserveAspectRatio="xMidYMid slice" data-frame-file={frame.file} data-frame-index={frame.index}>
    <ProgressiveSvgImage source={delivery.source} x={delivery.split ? column * 900 : 0} y={delivery.split ? row * 600 : 0}
      width={delivery.split ? 900 : frame.columns * 900} height={delivery.split ? 600 : frame.rows * 600}
      preserveAspectRatio="none" />
  </svg>;
}

function Objects({ objects, children }: { objects: string[]; children: ReactNode }) {
  return objects.reduceRight<ReactNode>((content, object) => <g data-scene-object={object}>{content}</g>, children);
}

function SoundSourceMarks({ courseId, frame, gains }: {courseId:string;frame:PolishedFrame;gains?:Record<string,number>}) {
  if(!gains || !['cn-07','cn-21'].includes(courseId)) return null;
  const positions:Record<string,[number,number,string]> = courseId==='cn-07'
    ? {leaves:[225,186,'树叶'],cricket:[117,408,'蟋蟀'],geese:[657,102,'大雁']}
    : frame.index===4 ? {animals:[300,140,'鸟与虫']}
      : frame.index===2 ? {rain:[335,355,'雨滴'],animals:[170,140,'鸟与虫'],water:[485,510,'溪水']}
        : {wind:[150,150,'树叶'],rain:[280,355,'雨滴'],water:[480,485,'溪水'],animals:[708,90,'鸟与虫']};
  return <g data-sound-source-marks="true">{Object.entries(positions).filter(([id])=>(gains[id]??0)>0).map(([id,[x,y,label]])=>{
    const gain=Math.max(0,Math.min(1,gains[id]));
    return <g key={id} data-scene-object={`active-${id}`} data-source-gain={gain} transform={`translate(${x} ${y})`}>
      <circle r={7+gain*10} fill="#fff9db" fillOpacity=".15" stroke="#fff9db" strokeWidth={1+gain*2} />
      <circle r="4" fill="#f8edba" stroke="#54714b" strokeWidth="1" />
      <rect x="18" y="-12" width={label.length*14+14} height="24" rx="5" fill="#fffced" fillOpacity=".9" />
      <text x="25" y="5" fontSize="14" fill="#365535">{label}</text>
    </g>;
  })}</g>;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

function StaticSequence({ frames }: {frames:PolishedFrame[]}) {
  const clipPrefix=useId();
  const columns=2;
  const rows=Math.ceil(frames.length/columns);
  const width=900/columns, height=600/rows;
  return <g data-static-sequence="true">{frames.map((frame,index)=>{
    const crop=frame.crop??{x:0,y:0,width:900,height:600};
    const clipId=`${clipPrefix}-${index}`;
    return <g key={`${frame.file}:${frame.index}`} transform={`translate(${(index%columns)*width} ${Math.floor(index/columns)*height})`}>
      <Objects objects={frame.objects}>
        <svg width={width-6} height={height-36} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="xMidYMid meet">
          <defs><clipPath id={clipId}><rect x={crop.x} y={crop.y} width={crop.width} height={crop.height} /></clipPath></defs>
          <g clipPath={`url(#${clipId})`}><PolishedAtlasImage frame={frame} /></g>
        </svg>
      </Objects>
      <text x="12" y={height-12} fontSize="18" fill="#355735">{index+1}. {frame.caption.split(/[：，；]/)[0]}</text>
    </g>;
  })}</g>;
}

/** Draw a single complete painted scene, with existing controls selecting its state. */
export default function ChinesePolishedScene({ frame, fallback: _fallback, ...props }: SemanticSceneProps & { frame: PolishedFrame; fallback: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const sequence = frame.sequence;
  const identity = `${props.courseId}:${props.variant ?? ''}:${props.sceneKey ?? props.step}:${frame.file}:${frame.index}`;
  const [position, setPosition] = useState({ identity, index: 0 });
  const index = position.identity === identity ? position.index : 0;
  const active = sequence?.frames[index] ?? frame;
  const { status: imageStatus } = useSceneImageSource(getAtlasImageDelivery(active.file, active.index).source);
  useEffect(() => {
    if (!sequence || props.paused || reducedMotion || imageStatus !== 'ready') return;
    const count = sequence.frames.length;
    const timer = window.setInterval(() => {
      setPosition(current => {
        const next = (current.identity === identity ? current.index : 0) + 1;
        if (next >= count - 1) window.clearInterval(timer);
        return { identity, index: Math.min(count - 1, next) };
      });
    }, Math.max(300, sequence.frameDurationMs));
    return () => window.clearInterval(timer);
  }, [identity, Boolean(sequence), sequence?.frames.length, sequence?.frameDurationMs, props.paused, reducedMotion, imageStatus]);
  const staticFrames=reducedMotion?sequence?.frames:undefined;
  const crop = active.crop ?? { x: 0, y: 0, width: 900, height: 600 };
  const caption=staticFrames?staticFrames.map(frame=>frame.caption).join('；'):active.caption;
  return <svg className="chinese-painted-scene chinese-polished-scene" viewBox="0 0 900 600"
    role="img" aria-label={caption} data-course={props.courseId}
    data-scene-key={props.sceneKey ?? active.sceneKey ?? `read-${props.step}`} data-polished-frame={active.index}
    data-polished-source={active.file} data-sequence-position={index}
    data-scene-location={props.courseId === 'cn-12' ? props.sceneKey : undefined}
    data-observer-position={props.courseId === 'cn-20' && props.variant === 'wangtianmenshan' ? props.parameter : undefined}
    data-paused={props.paused || reducedMotion || undefined}>
    <title>{caption}</title>
    {staticFrames ? <StaticSequence frames={staticFrames} /> : <Objects objects={active.objects}>
      <svg width="900" height="600" viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} preserveAspectRatio="xMidYMid slice">
        <PolishedAtlasImage frame={active} />
      </svg>
    </Objects>}
    <SoundSourceMarks courseId={props.courseId} frame={active} gains={props.gains} />
  </svg>;
}
