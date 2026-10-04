import { useId, type CSSProperties, type ReactNode } from 'react';
import './chineseNatureScenes.css';

export type ChineseNatureSceneProps = {
  courseId: string;
  step: number;
  sceneKey?: string;
  parameter?: number;
  gains?: Record<string, number>;
  paused?: boolean;
};

const supported = new Set(['cn-01', 'cn-05', 'cn-06', 'cn-07', 'cn-16', 'cn-17', 'cn-18', 'cn-19', 'cn-21', 'cn-22']);
export function supportsNatureScene(courseId: string) { return supported.has(courseId); }

const bound = (n: number | undefined, fallback = 0) => Number.isFinite(n) ? Math.max(0, Math.min(1, n!)) : fallback;
const photo = (id: string) => `${import.meta.env?.BASE_URL ?? '/'}images/chinese-precision/${id}.webp`;

function Definitions({ id }: { id: string }) {
  return <defs>
    <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#c9dfdf" /><stop offset=".62" stopColor="#edf2db" /><stop offset="1" stopColor="#fcf1cb" /></linearGradient>
    <linearGradient id={`${id}-night`} x2="0" y2="1"><stop stopColor="#142f48" /><stop offset="1" stopColor="#476679" /></linearGradient>
    <linearGradient id={`${id}-sea`} x2="0" y2="1"><stop stopColor="#358fa5" /><stop offset=".48" stopColor="#4dc3c0" /><stop offset="1" stopColor="#173f69" /></linearGradient>
    <linearGradient id={`${id}-stream`} x2="1" y2="1"><stop stopColor="#c5e6df" /><stop offset=".5" stopColor="#76b8b7" /><stop offset="1" stopColor="#b1d7c9" /></linearGradient>
    <linearGradient id={`${id}-bark`}><stop stopColor="#625648" /><stop offset=".4" stopColor="#a9926a" /><stop offset=".62" stopColor="#88775b" /><stop offset="1" stopColor="#4f5146" /></linearGradient>
    <linearGradient id={`${id}-green`} x2=".8" y2="1"><stop stopColor="#b4c982" /><stop offset=".35" stopColor="#72995f" /><stop offset="1" stopColor="#34594e" /></linearGradient>
    <linearGradient id={`${id}-gold`} x2=".9" y2="1"><stop stopColor="#fff0a8" /><stop offset=".5" stopColor="#ddb35c" /><stop offset="1" stopColor="#a36835" /></linearGradient>
    <linearGradient id={`${id}-red`} x2=".7" y2="1"><stop stopColor="#e4ad74" /><stop offset=".45" stopColor="#b96940" /><stop offset="1" stopColor="#773f35" /></linearGradient>
    <linearGradient id={`${id}-paper`} x2=".3" y2="1"><stop stopColor="#fffcf0" /><stop offset="1" stopColor="#eee5ce" /></linearGradient>
    <linearGradient id={`${id}-mist`} x2="0" y2="1"><stop stopColor="#f6fae9" stopOpacity="0" /><stop offset=".55" stopColor="#edf4e8" stopOpacity=".78" /><stop offset="1" stopColor="#f6fae9" stopOpacity="0" /></linearGradient>
    <radialGradient id={`${id}-waterdrop`} cx=".28" cy=".2"><stop stopColor="#fffef5" stopOpacity=".95" /><stop offset=".45" stopColor="#e8f1df" stopOpacity=".55" /><stop offset="1" stopColor="#70a6a2" stopOpacity=".8" /></radialGradient>
    <radialGradient id={`${id}-canopy`} cx=".34" cy=".19" r=".82"><stop stopColor="#b8c28a" stopOpacity=".5" /><stop offset=".55" stopColor="#798c5b" stopOpacity=".04" /><stop offset="1" stopColor="#233f36" stopOpacity=".45" /></radialGradient>
    <pattern id={`${id}-foliage`} width="29" height="31" patternUnits="userSpaceOnUse"><path d="M2 11q6-12 13-7-3 10-13 7m15 16q-5-13 6-17 6 10-6 17m-9-3q-10-7-6-14 10 2 6 14" fill="#eadba0" fillOpacity=".16" /><path d="m2 11 9-5m7 20 3-12M9 25 4 17" stroke="#354d35" strokeWidth=".8" opacity=".23" /></pattern>
    <pattern id={`${id}-grain`} width="17" height="19" patternUnits="userSpaceOnUse"><path d="m2 3 3-1m8 10 2-2m-7 7 2-1" stroke="#334738" strokeWidth=".45" opacity=".16" /></pattern>
    <pattern id={`${id}-stones`} width="81" height="45" patternUnits="userSpaceOnUse"><path d="M0 1H81M0 44H81M27 0V23M67 23V45M0 23H81" fill="none" stroke="#b6aa8c" strokeWidth="1.2" /></pattern>
    <filter id={`${id}-shadow`} x="-35%" y="-35%" width="170%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#243a30" floodOpacity=".19" /></filter>
    <clipPath id={`${id}-canvas`}><rect width="900" height="600" rx="4" /></clipPath>
  </defs>;
}

function ImageBackground({ courseId, opacity = 1 }: { courseId: string; opacity?: number }) {
  return <image data-scene-object="context-background" href={photo(courseId)} x="0" y="0" width="900" height="600" opacity={opacity} preserveAspectRatio="xMidYMid slice" />;
}

function LeafShape({ id, kind = 'oval', x = 0, y = 0, size = 1, angle = 0, colour = 'green', className = '', object }: {
  id: string; kind?: 'maple' | 'ginkgo' | 'sycamore' | 'oval'; x?: number; y?: number; size?: number; angle?: number;
  colour?: 'green' | 'gold' | 'red'; className?: string; object?: string;
}) {
  const shape = kind === 'ginkgo'
    ? 'M0 41C-5 10-55-3-70-47C-62-73-38-88-8-90L0-77 9-91C43-86 63-72 71-46C55-7 9 12 0 41Z'
    : kind === 'maple'
      ? 'M0 49-17 19-43 30-40 2-70-10-50-26-66-49-30-45-30-77-10-62 0-105 14-63 32-79 35-44 67-50 51-22 75-5 43 6 45 31 17 19Z'
      : kind === 'sycamore'
        ? 'M0 51-22 25-47 38-45 10-78-1-61-21-87-42-51-43-53-76-20-59-1-112 20-59 48-76 48-45 82-43 62-20 77-1 44 12 45 36 20 26Z'
        : 'M0 55C-42 12-40-42 0-95C41-42 44 12 0 55Z';
  return <g data-scene-object={object} transform={`translate(${x} ${y}) rotate(${angle}) scale(${size})`} className={className}>
    <path d={shape} fill={`url(#${id}-${colour})`} stroke={colour === 'red' ? '#8c4f3c' : '#8b8752'} strokeWidth="1.3" />
    {kind === 'ginkgo' ? <g fill="none" stroke="#957c3e" strokeWidth=".85" opacity=".7">{[-54,-36,-18,0,18,36,54].map((v, i) => <path key={v} d={`M0 34Q${v * .28} -13 ${v} ${-71 + Math.abs(v) * .35 + i % 2 * 3}`} />)}</g>
      : <g fill="none" stroke={colour === 'green' ? '#d0d6aa' : '#9d7842'} strokeWidth="1.2" opacity=".8"><path d="M0 47V-83M0 13-40-4M0-9-47-31M0-36-28-57M0 14 40-5M0-8 43-31M0-34 26-55" /></g>}
    <path d="M0 49Q2 63-4 77" stroke="#8b7a4e" strokeWidth="3" fill="none" />
  </g>;
}

function BranchTree({ id, x, y, size = 1, season = 'summer', kind = 'broad' }: {
  id: string; x: number; y: number; size?: number; season?: string; kind?: 'broad' | 'birch' | 'pine';
}) {
  const winter = season === 'winter';
  const autumn = season === 'autumn';
  const spring = season === 'spring';
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <ellipse cy="4" rx="100" ry="17" fill="#213e38" opacity=".12" />
    <path d="M-19 0Q-11-89-24-195L-32-302H-6L4-192Q17-100 23 0Z" fill={kind === 'birch' ? '#e0dcc4' : `url(#${id}-bark)`} stroke="#625f4b" strokeWidth="1.4" />
    <g fill="none" stroke={kind === 'birch' ? '#d4d1ba' : '#847755'} strokeWidth="10" strokeLinecap="round"><path d="M-4-90-53-188-103-218M3-126 55-214 89-237M-15-203-49-262M-4-233 40-274" /></g>
    {kind === 'birch' && <g stroke="#777760" opacity=".8" strokeWidth="3">{[44,72,111,141,182,225,269].map((n,i) => <path key={n} d={`M${i%2 ? -15 : -9} ${-n}h${i%2 ? 17 : 21}`} />)}</g>}
    {kind === 'pine' ? <g stroke="#416557" strokeWidth="1.4">{[0,1,2,3,4].map(i => <g key={i}><path d={`M-14 ${-362+i*43}Q${-77-i*11} ${-297+i*39} ${-94-i*12} ${-288+i*44}Q-12 ${-267+i*43} ${87+i*14} ${-284+i*43}L-10 ${-362+i*43}Z`} fill={['#517965','#416b5c','#4b7b64','#47785c','#3a644e'][i]} />{winter && <path d={`M-14 ${-362+i*43}Q${-45-i*10} ${-327+i*43} ${-59-i*13} ${-314+i*43}Q-8 ${-305+i*43} ${49+i*15} ${-313+i*43}L-14 ${-362+i*43}Z`} fill="#edf3e9" stroke="#d4e2d9" />}</g>)}</g>
      : <>{!winter && <g>{Array.from({length: 21}, (_,i) => {
        const cx=Math.sin(i*2.399)*Math.sqrt(i/21)*132-8, cy=-258+Math.cos(i*2.399)*Math.sqrt(i/21)*91;
        const r=spring ? 27 : 45;
        const outline=`M${cx-r} ${cy+3}q-11-18 6-28-5-16 15-16 12-23 31-10 21-8 22 13 24 3 15 25 10 17-10 26-8 21-27 13-19 15-32-2-23 6-20-21Z`;
        return <g key={i}><path d={outline} fill={autumn ? ['#bd7845','#ddae61','#9d653f','#ce914d'][i%4] : spring ? ['#afc987','#bed49a','#89ab70'][i%3] : ['#5c875a','#426b52','#7a9a65','#4a7653'][i%4]} /><path d={outline} fill={`url(#${id}-canopy)`} /><path d={outline} fill={`url(#${id}-foliage)`} /></g>;
      })}</g>}{winter && <g fill="none" stroke="#9a9985" strokeWidth="4"><path d="m-30-298-34-39m-26 114-35-3m215-9 34-31m-144 61-49-15m100-56 13-42" /></g>}</>}
    {!winter && kind!=='pine' && <g>{Array.from({length:64},(_,i)=>{
      const x=Math.sin(i*2.399)*Math.sqrt(i/64)*143-8, y=-258+Math.cos(i*2.399)*Math.sqrt(i/64)*92;
      return <g key={i} transform={`translate(${x} ${y}) rotate(${i*51})`}><path d="M0 0Q-11-4-5-12 4-10 0 0Q7-14 13-6 11 3 0 0Z" fill={autumn ? ['#ecc47b','#aa643e','#d99650'][i%3] : spring ? '#d1dfa2' : ['#afbc76','#365c42','#8ca45e'][i%3]} fillOpacity=".85" /><path d="m-4-10 4 10 9-7" fill="none" stroke="#637447" strokeWidth=".6" /></g>;
    })}</g>}
    {kind==='pine' && <g fill="none" stroke={winter ? '#6f927d' : '#91ad79'} strokeWidth="1.2" opacity=".7">{Array.from({length:52},(_,i)=>{
      const y=-336+(i*29)%205, spread=(y+367)*.46, x=Math.sin(i*2.39)*spread;
      return <path key={i} d={`M${x} ${y}l-13 10m13-10 14 8m-14-8 2 14`} />;
    })}</g>}
    <path d="m-8-68 8-73m-13-102 4-30m8 232 5-32" stroke="#d4c4a0" strokeWidth="1.5" opacity=".55" />
  </g>;
}

function Sparrow({ x, y, size = 1, flying = false, className = '', object = 'sparrow' }: { x: number; y: number; size?: number; flying?: boolean; className?: string; object?: string }) {
  return <g data-scene-object={object} transform={`translate(${x} ${y}) scale(${size})`}>
    <g className={className}>
      <path d={flying ? 'M-12 8Q-57-22-50-52Q-13-40 3-4Q31-50 55-37Q55-7 15 12Z' : 'M-22 15-48 32-43 19-26 1Z'} fill="#6e614d" stroke="#4e5145" strokeWidth="1.5" />
      <ellipse cx="0" cy="7" rx="27" ry="18" fill="#c5b69b" stroke="#5e6350" strokeWidth="1.4" />
      <path d="M-25 3Q-13-17 8-5L19 17Q-8 27-25 3Z" fill="#8e7452" /><path d="m-16-1 22 10m-19-1 15 10m-9-19 16 11" stroke="#d9c8a3" strokeWidth="2" />
      <circle cx="20" cy="-5" r="15" fill="#eee4cd" stroke="#6e735d" strokeWidth="1.2" /><path d="M7-12Q18-28 33-10L20-9Z" fill="#846844" /><path d="m17-4 14-3-4 10-7-1Z" fill="#695a43" /><circle cx="26" cy="-8" r="2.2" fill="#273e39" /><path d="m34-5 11 3-11 4Z" fill="#a59b67" />
      {!flying && <path d="m-2 22-3 14m17-13 2 13m-23 1h12m8 0h12" stroke="#777751" strokeWidth="2" fill="none" />}
    </g>
  </g>;
}

function Cricket({ x, y, size = 1, object = 'cricket', active = true }: { x: number; y: number; size?: number; object?: string; active?: boolean }) {
  return <g data-scene-object={object} data-active={active} transform={`translate(${x} ${y}) scale(${size})`} stroke="#554e36" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="-8" cy="-5" rx="35" ry="14" fill="#756f44" strokeWidth="2" />
    <path className={active ? 'nature-cricket-wing' : undefined} d="M-38-9Q-5-36 16-7L-31 6Z" fill="#a19052" strokeWidth="1.5" /><path d="m-26-6 33-4m-29 9 20-5" stroke="#d7c182" strokeWidth="1" />
    <ellipse cx="29" cy="-7" rx="15" ry="12" fill="#7d713e" strokeWidth="2" /><circle cx="36" cy="-11" r="3" fill="#302f27" />
    <path d="M37-13Q61-45 93-46M36-15Q45-54 78-68" fill="none" strokeWidth="1.8" />
    <path d="m-16 1-34-34-27 58m61-18-28 25 8 7m52-40 14 26 18 8m-3-33 15 17 10 1" fill="none" strokeWidth="4" /><path d="m-41 5-12 7" strokeWidth="2" />
  </g>;
}

function Squirrel({ x, y, size = 1, cone = false }: { x: number; y: number; size?: number; cone?: boolean }) {
  return <g data-scene-object="squirrel" transform={`translate(${x} ${y}) scale(${size})`} stroke="#695342" strokeWidth="1.8">
    <path d="M-22 22Q-91 8-84-59Q-83-91-55-97Q-30-87-48-61Q-67-46-53-16L-8 6Z" fill="#b99165" /><path d="M-57-76Q-75-35-29-6" stroke="#e5c692" strokeWidth="7" fill="none" />
    <ellipse cx="0" cy="16" rx="25" ry="37" fill="#a4784f" /><path d="M4-12Q21 12 11 42Q-4 48-10 27Z" fill="#e7cf9f" stroke="none" />
    <path d="M-4-18-3-52 13-32 21-53 24-20Z" fill="#9e764f" /><ellipse cx="16" cy="-17" rx="24" ry="18" fill="#ad8457" /><circle cx="27" cy="-22" r="3" fill="#2c3d34" /><path d="m39-15 7 5-8 3" fill="#554734" />
    <path d="m12 2 17 17m-41 9 21 17-13 10m31-13 14 10" fill="none" strokeWidth="7" strokeLinecap="round" />
    {cone && <PineCone x={33} y={23} size={.45} />}
  </g>;
}

function PineCone({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g data-scene-object="pine-cone" transform={`translate(${x} ${y}) scale(${size})`} stroke="#7f6040" strokeWidth="1.5"><path d="M0-46Q40-29 31 20Q15 59-10 33Q-43 1-26-27Q-14-44 0-46Z" fill="#a37a4b" />{[-24,-9,6,21].map((r,i) => <path key={r} d={`M${-19+i%2*5} ${r}q15 23 38 0m-22-4 1 20`} fill="none" stroke="#ddbb79" strokeWidth="2" />)}<path d="m0-44 8-17" fill="none" stroke="#796047" strokeWidth="4" /></g>;
}

function Frog({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g data-scene-object="frog" transform={`translate(${x} ${y}) scale(${size})`} stroke="#4c6742" strokeWidth="2"><path d="M-20 18Q-42-2-29-22Q-22-44-9-32 13-48 29-25Q45-9 23 15Z" fill="#89a061" /><ellipse cy="9" rx="24" ry="17" fill="#b8c785" /><path d="M-24 1Q-55-4-52 23L-31 29m55-28q34-8 29 22l-22 9" fill="#7f9858" strokeWidth="7" strokeLinecap="round" /><path d="m-15 18-11 21-14-2m54-19 12 21 13-2" fill="none" strokeWidth="6" /><circle cx="-14" cy="-26" r="8" fill="#cbd59b" /><circle cx="15" cy="-28" r="8" fill="#cbd59b" /><circle cx="-12" cy="-26" r="3.5" fill="#324b34" /><circle cx="17" cy="-28" r="3.5" fill="#324b34" /><path d="M-13-12q14 9 27-2" fill="none" strokeWidth="1.3" /></g>;
}

function Flower({ id, x, y, size = 1, colour = '#dcb665', chrysanthemum = false }: { id: string; x: number; y: number; size?: number; colour?: string; chrysanthemum?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path d="M0 2Q-9 30-2 66" fill="none" stroke="#54794e" strokeWidth="3" /><path d="M-4 41Q-32 9-38 31Q-30 52-4 46m3 9q25-34 32-18 0 18-33 25" fill={`url(#${id}-green)`} stroke="#78956a" strokeWidth="1" />
    {Array.from({length: chrysanthemum ? 20 : 7}, (_,i) => <ellipse key={i} cy={chrysanthemum ? -18 : -15} rx={chrysanthemum ? 3 : 9} ry={chrysanthemum ? 23 : 16} fill={colour} stroke="#866b4f" strokeWidth=".35" transform={`rotate(${i*360/(chrysanthemum ? 20 : 7)})`} />)}
    <circle r={chrysanthemum ? 7 : 8} fill="#9b7840" /><circle cy="-1" r="4" fill="#d6ae57" />
  </g>;
}

function Deer({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <g data-scene-object="deer" transform={`translate(${x} ${y}) scale(${size})`} stroke="#826546" strokeWidth="1.6"><ellipse cx="-8" cy="0" rx="55" ry="27" fill="#ba956b" /><path d="M18-11Q27-46 45-63L62-60Q48-24 40 9Z" fill="#ba956b" /><path d="M42-55Q54-82 75-67L89-48Q87-36 61-43Z" fill="#b38d61" /><path d="m47-67-9-24 18 11m12 6 13-24 2 26" fill="#a77b50" /><circle cx="74" cy="-57" r="3" fill="#304236" /><path d="m87-44 10 1" strokeWidth="4" /><path d="m-41 18-5 63m14-62 9 62m50-63-5 63m16-66 10 65" stroke="#a8865a" strokeWidth="8" fill="none" /><path d="m-48 81h14m-10-1h13m33 0h14m5-1h14" stroke="#6b6147" strokeWidth="5" /><path d="m-57-8-18-11" fill="none" strokeWidth="8" strokeLinecap="round" /><g fill="#ead8b5">{[-35,-13,9].map((v,i) => <ellipse key={v} cx={v} cy={i%2 ? -5 : -13} rx="5" ry="3" />)}</g></g>;
}

function Child({ x, y, size = 1, pose = 'walk', colour = '#b27552', skirt = false }: { x: number; y: number; size?: number; pose?: 'walk' | 'read' | 'dance' | 'look'; colour?: string; skirt?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`} stroke="#6b624c" strokeWidth="1.4">
    <path d={pose === 'dance' ? 'M-15-2-34 15m49-17 37-22' : pose === 'read' ? 'M-15-4-27 17-3 25m18-30 16 20-22 8' : 'M-16-5-25 23m41-27 23 22'} stroke="#d7ad85" strokeWidth="8" fill="none" strokeLinecap="round" />
    <path d={skirt ? 'M-17-17H17L29 41H-27Z' : 'M-18-17H18L21 35H-20Z'} fill={colour} /><path d="m-13-9 26 1m-23 10h19m-18 12h17" stroke="#e6d5aa" strokeWidth="3" />
    <path d={pose === 'dance' || pose === 'walk' ? 'm-11 36-12 40m36-40 12 34' : 'm-11 36 1 42m20-42 3 42'} stroke="#596b60" strokeWidth="9" fill="none" strokeLinecap="round" /><path d={pose === 'dance' || pose === 'walk' ? 'm-26 78h13m10-6h13' : 'm-15 80h13m11 0h14'} stroke="#695f45" strokeWidth="7" fill="none" strokeLinecap="round" />
    <circle cy="-36" r="21" fill="#e0b68b" /><path d="M-21-35Q-25-68 4-62Q27-64 23-33L13-43Q1-37-11-47Z" fill="#494d41" /><circle cx="-6" cy="-34" r="1.5" fill="#39483b" /><circle cx="9" cy="-34" r="1.5" fill="#39483b" /><path d="m-4-24q5 4 10-1" stroke="#a47b5d" fill="none" />
    {pose === 'read' && <g data-scene-object="open-book"><path d="M-27 3Q-12-1 0 7Q12-1 27 3L23 34Q11 29 0 36Q-9 29-23 33Z" fill="#f6f0d9" stroke="#857b5d" /><path d="M0 8V35M-20 10l14 1m-13 6 12 1m11-6 14-2m-13 8 12-2" fill="none" stroke="#b2a184" strokeWidth="1.2" /></g>}
  </g>;
}

function SoundRings({ x, y, gain, id }: { x: number; y: number; gain: number; id: string }) {
  if (!gain) return null;
  return <g data-scene-object={`${id}-sound`} data-gain={gain} opacity={.3+gain*.65} className="nature-sound-rings" fill="none" stroke="#dfb860" strokeWidth={1.4+gain*1.6}>{[0,1,2].map(i => <circle key={i} cx={x} cy={y} r={20+i*(10+gain*11)} style={{ animationDelay: `${i*.2}s` }} />)}</g>;
}

function Merchant({ x, y, colour, carrying = false }: { x: number; y: number; colour: string; carrying?: boolean }) {
  return <g data-scene-object="merchant" transform={`translate(${x} ${y})`} stroke="#625e49" strokeWidth="1.5">
    <path d="M-24-71H22L30 17H-29Z" fill={colour} /><path d="M-4-66V13m-17-44 13 3m14-15 15 8m-38 27 13 9" fill="none" stroke="#e2d4b5" strokeWidth="2" />
    <path d="m-16 17-3 62m35-62 8 61" stroke="#67756b" strokeWidth="17" fill="none" /><path d="m-30 84h21m11 0h25" stroke="#575e4c" strokeWidth="10" strokeLinecap="round" />
    <path d={carrying ? 'M-24-59-38-9-10-2m32-55 27 48-17 7' : 'M-25-57-35-7m58-50 15 51'} fill="none" stroke="#d3ab81" strokeWidth="10" strokeLinecap="round" />
    <ellipse cy="-95" rx="22" ry="27" fill="#d5ad84" /><path d="M-21-92Q-28-126 0-125Q25-127 23-92L14-104Q-9-99-21-92Z" fill="#4d5448" /><path d="M-8-95h3m15 0h3m-14 17h12" stroke="#6e624b" strokeWidth="1.8" />
    {carrying && <g data-scene-object="carried-goods"><path d="M-29-8H30V33H-29Z" fill="#cfb082" stroke="#8e7d5a" /><path d="M-29 5H30M-10-8V33M11-8V33" stroke="#ab916a" strokeWidth="2" /></g>}
  </g>;
}

function Campus({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = sceneKey === 'lesson' ? 1 : sceneKey === 'break' ? 2 : step;
  if (phase === 1) return <>
    <rect width="900" height="600" fill="#ede4cf" />
    <path d="M0 490H580V600H0Z" fill="#a29577" /><path d="M0 540H580M90 490l-24 110m141-110-4 110m112-110 17 110m103-110 30 110" stroke="#8b8069" opacity=".5" />
    <svg x="589" y="80" width="267" height="405" viewBox="0 0 267 405"><image href={photo('cn-01')} width="1500" height="1000" preserveAspectRatio="xMinYMin slice" /></svg>
    <g data-scene-object="classroom-window"><rect x="588" y="80" width="267" height="405" rx="3" fill="none" stroke="#ded4b9" strokeWidth="24" /><path d="M722 84V489M592 273H851" stroke="#baaa87" strokeWidth="9" /><path d="M854 87h24v407h-24" fill="#a79672" /><path d="M589 489h289v18H581Z" fill="#dacbb0" /></g>
    <path d="M28 50H538V218H28Z" fill="#305951" stroke="#8a795b" strokeWidth="9" /><path d="M85 86h165m-165 18h157m-149 30h265m-267 18h243m-212 28h255" stroke="#cdd8b8" strokeWidth="3" opacity=".6" />
    <g data-scene-object="reading-children">{[154,325,485].map((x,i) => <g key={x}><Child x={x} y={401+i%2*40} size={1.1} pose="read" colour={['#a87757','#6b8977','#a59b63'][i]} skirt={i===1} /><path d={`M${x-71} ${431+i%2*40}h142v15H${x-71}m12 15v95m116-95v95`} fill="#b19b75" stroke="#776e56" strokeWidth="2" /><path d={`M${x-53} ${446+i%2*40}h107`} stroke="#d2bf96" strokeWidth="2" /></g>)}</g>
    <g data-scene-object="quiet-window-animals"><path d="M624 292Q744 284 832 235" stroke="#796f51" strokeWidth="10" fill="none" /><Sparrow x={748} y={271} size={.85} /><Squirrel x={785} y={455} size={.5} /></g>
    <path className="nature-reading-rhythm" d="M100 285q9-19 18 0m26 3q9-21 18 0m25 1q9-21 18 0m27 1q9-20 18 0" fill="none" stroke="#c4a464" strokeWidth="3" />
  </>;
  if (phase === 2) return <><ImageBackground courseId="cn-01" /><path d="M0 448Q302 406 621 455T900 454V600H0Z" fill="#c9bd99" opacity=".96" /><g data-scene-object="play-under-tree">{[235,345,453,560].map((x,i) => <Child key={x} x={x} y={439+i%2*27} size={1.06} pose="dance" colour={['#b57558','#6a8d7e','#b49b65','#7b8760'][i]} skirt={i%2===0} />)}</g><Squirrel x={726} y={480} size={.64} /><Sparrow x={147} y={489} size={.9} /><path d="M314 553Q428 580 542 545" fill="none" stroke="#f1dfb2" strokeWidth="5" strokeDasharray="5 9" /><g data-scene-object="school-butterfly" transform="translate(689 404)"><path d="M0 0Q-40-37-42-6Q-31 29 0 4Q36-34 41-7Q36 27 0 4Z" fill="#d4b66b" stroke="#8c784e" /><path d="M0-9V15" stroke="#667455" strokeWidth="3" /></g></>;
  if (phase === 3) return <><ImageBackground courseId="cn-01" /><g data-scene-object="bronze-school-bell" transform="translate(604 244)" filter={`url(#${id}-shadow)`}><path d="M-80-138H80M0-137V-78" stroke="#7e7859" strokeWidth="8" /><path d="M-58 36Q-37 0-41-47Q-37-78 0-81Q38-78 40-45Q39 0 61 36Z" fill={`url(#${id}-gold)`} stroke="#78633d" strokeWidth="3" /><ellipse cy="36" rx="61" ry="12" fill="#806840" /><path d="M-30-40H29m-37 22h15m-2 28h25" stroke="#c6aa68" strokeWidth="3" /><path d="M0 32V64" stroke="#685f43" strokeWidth="7" /></g><g data-scene-object="phoenix-tail-bamboo" stroke="#547b56" strokeWidth="5" fill="none">{[752,792,834,872].map((x,i) => <g key={x}><path d={`M${x} 579Q${x-37} 317 ${x-72} ${196+i*29}`} />{[0,1,2,3,4].map(j => <path key={j} d={`M${x-15-j*9} ${471-j*45}q${-26-j*4} -38 ${-45-j*3} -25m${43+j*3} 18q${26+j*3} -32 ${43+j*3} -25`} />)}</g>)}</g></>;
  return <><ImageBackground courseId="cn-01" /><g data-scene-object="arriving-children">{[292,388,496].map((x,i) => <Child key={x} x={x} y={448+i*24} size={.85+i*.08} colour={['#9e7055','#6b8a7b','#b0a26b'][i]} skirt={i===1} />)}</g></>;
}

function RainRoad({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = sceneKey === 'puddle' ? 0 : sceneKey === 'leaf' ? 1 : sceneKey === 'spread' ? 2 : step;
  return <><ImageBackground courseId="cn-05" />
    {phase === 0 && <g data-scene-object="puddle-blue-sky-reflection"><path d="M460 423Q550 359 721 406Q837 444 712 483Q557 513 451 457Z" fill={`url(#${id}-stream)`} fillOpacity=".6" stroke="#e9e6cd" strokeWidth="3" /><path d="M547 432q51-15 111 0m-87 24q85-17 125-3" stroke="#eaf2e4" strokeWidth="2" fill="none" className="nature-river-ripple" /></g>}
    {phase === 1 && <g data-scene-object="sycamore-leaf-closeup"><rect x="35" y="55" width="385" height="480" rx="18" fill={`url(#${id}-paper)`} fillOpacity=".97" stroke="#ccbd98" strokeWidth="2" filter={`url(#${id}-shadow)`} /><path d="M50 459H405" stroke="#b6aa8c" /><LeafShape id={id} kind="sycamore" x={227} y={334} size={1.92} angle={-18} colour="gold" object="five-lobed-sycamore-leaf" /><g fill={`url(#${id}-waterdrop)`} stroke="#dfecda" strokeWidth="1">{[[209,286,8],[258,304,5],[173,316,6],[281,355,9],[214,391,7],[326,321,5],[129,357,8]].map(([x,y,r]) => <ellipse key={x} cx={x} cy={y} rx={r} ry={r*.7} />)}</g><path d="M57 487q165-17 337-1" fill="none" stroke="#c7b897" strokeWidth="2" /><path d="M81 480q15-7 29-1m252-4q15-7 30-1" stroke="#af9d76" /></g>}
    {phase === 2 && <g data-scene-object="irregular-leaf-carpet">{Array.from({length:22},(_,i) => <LeafShape key={i} id={id} kind="sycamore" x={145+(i*163)%677} y={360+(i*67)%218} size={.12+((i*7)%9)/50} angle={(i*57)%360} colour={i%4 ? 'gold' : 'red'} />)}</g>}
    {phase === 3 && <g data-scene-object="brown-rain-boots" transform="translate(553 392)"><g className="nature-walking-boot"><path d="M-61-145H-7L-17 10H-67Z" fill="#637b70" /><path d="M-68-4H-14L-16 100Q5 100 18 115Q26 141-69 133Z" fill="#985f40" stroke="#694c3e" strokeWidth="3" /><path d="M-69 130H14m-68-109h38" stroke="#4e5141" strokeWidth="7" /><path d="M-63 2H-19" stroke="#bb8a60" strokeWidth="6" /></g><g transform="translate(93 -17) rotate(8)" className="nature-walking-boot nature-delay"><path d="M-52-145H0L-6 12H-54Z" fill="#637b70" /><path d="M-57-2H-3L-5 98Q23 99 33 117Q42 138-56 135Z" fill="#a46c49" stroke="#694c3e" strokeWidth="3" /><path d="M-56 132H30m-71-110h30" stroke="#4e5141" strokeWidth="7" /><path d="M-51 3H-7" stroke="#c59367" strokeWidth="6" /></g></g>}
  </>;
}

function Orchard({ id, keyName }: { id: string; keyName: string }) {
  return <g data-scene-object={keyName}>
    <ImageBackground courseId="cn-06" />
    <rect x="539" y="76" width="326" height="460" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#c3af83" strokeWidth="2" filter={`url(#${id}-shadow)`} />
    <path d="M557 361Q667 249 854 155m-202 118-27-80m116 24 46 49m-89-20-9-124" fill="none" stroke="#86734f" strokeWidth="9" strokeLinecap="round" />
    {[[625,210],[722,153],[778,250],[591,307]].map(([x,y],i)=><LeafShape key={x} id={id} x={x} y={y} size={.35+i%2*.08} angle={i*79-30} />)}
    {[[653,274,0],[743,369,1],[610,436,1]].map(([x,y,kind],i)=><g key={x} data-scene-object={kind ? 'pear' : 'apple'} transform={`translate(${x} ${y}) scale(${1.46-i*.14})`}>
      <path d={kind ? 'M0-27Q-10-38-20-18Q-17 0-28 17Q-40 54 0 57Q39 55 30 19Q15-3 15-20Q8-39 0-27Z' : 'M0-19Q-41-42-44 8Q-36 63 0 45Q38 64 44 10Q39-41 0-19Z'} fill={kind ? '#dac37b' : `url(#${id}-red)`} stroke="#9b7750" strokeWidth="1.4" />
      <path d="M0-24q-2-14 5-28" stroke="#7d6848" strokeWidth="4" fill="none" /><path d="M-19-6q-13 23-1 39" stroke="#f2dcad" strokeWidth="4" fill="none" opacity=".7" />
      {Array.from({length:23},(_,j)=><circle key={j} cx={Math.sin(j*2.39)*Math.sqrt(j/23)*27} cy={12+Math.cos(j*2.39)*Math.sqrt(j/23)*30} r=".7" fill="#997849" opacity=".5" />)}
    </g>)}
    <g data-scene-object="child-noticing-fruit"><path d="M387 390Q451 353 524 365" fill="none" stroke="#f4e8c4" strokeWidth="4" strokeDasharray="3 12" /><path d="m511 356 16 9-16 6" fill="none" stroke="#f4e8c4" strokeWidth="3" /></g>
  </g>;
}

function AutumnRain({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = sceneKey === 'leaves' ? 1 : sceneKey === 'fruit' ? 2 : ['squirrel','frog'].includes(sceneKey ?? '') ? 3 : step;
  if (phase === 2) return <Orchard id={id} keyName="autumn-fruit-orchard" />;
  if (phase === 3) return <>
    <ImageBackground courseId="cn-06" /><rect x="31" y="81" width="838" height="488" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#bfae87" strokeWidth="2" />
    <BranchTree id={id} x={169} y={479} size={.87} season="autumn" kind="pine" /><BranchTree id={id} x={745} y={472} size={.73} season="autumn" /><path d="M32 507Q170 437 385 515T868 495V568H32Z" fill="#c5b58b" />
    <g data-scene-object="pine-cone-store" opacity={sceneKey==='frog' ? .42 : 1}><path d="M137 371Q176 324 214 371L222 442H125Z" fill="#544b3a" /><Squirrel x={314} y={437} size={1.07} cone /><PineCone x={162} y={410} size={.42} /><PineCone x={194} y={413} size={.35} /><PineCone x={149} y={453} size={.32} /></g>
    <g data-scene-object="frog-winter-hole" opacity={sceneKey==='squirrel' ? .42 : 1}><path d="M570 530Q576 389 731 427Q794 454 795 535Z" fill="#9a906a" /><path d="M612 536Q606 441 693 452Q741 473 741 537Z" fill="#4a5340" /><path d="M614 532Q665 489 741 536Z" fill="#747a51" /><Frog x={578} y={511} size={.85} /><LeafShape id={id} kind="maple" x={746} y={515} size={.3} angle={65} colour="red" /><LeafShape id={id} kind="ginkgo" x={672} y={454} size={.25} angle={20} colour="gold" /></g>
    <path d="M312 496q-88-28-130-89M579 548q63-15 94-45" fill="none" stroke="#ead3a0" strokeWidth="3" strokeDasharray="4 10" />
  </>;
  if (phase === 1) return <>
    <ImageBackground courseId="cn-06" />
    <rect x="31" y="37" width="464" height="363" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#c3af83" strokeWidth="2" filter={`url(#${id}-shadow)`} />
    <path d="M260 59V370" stroke="#d4c49f" strokeWidth="1.5" />
    <g data-scene-object="ginkgo-fan-leaves"><LeafShape id={id} kind="ginkgo" x={151} y={276} size={1.15} angle={-8} colour="gold" /><LeafShape id={id} kind="ginkgo" x={209} y={328} size={.37} angle={47} colour="gold" /></g>
    <g data-scene-object="red-maple-leaves"><LeafShape id={id} kind="maple" x={381} y={294} size={1.06} angle={17} colour="red" /><LeafShape id={id} kind="maple" x={307} y={355} size={.32} angle={-43} colour="red" /></g>
    <g data-scene-object="golden-field"><path d="M509 470Q639 430 824 472" fill="none" stroke="#eed498" strokeWidth="3" /><g stroke="#9e7c36" strokeWidth="2">{Array.from({length:19},(_,i)=><g key={i} transform={`translate(${520+i*16} ${553-i%3*13}) rotate(${i%2 ? 8 : -8})`}><path d="M0 0V-70" />{[0,1,2,3].map(j=><g key={j}><ellipse cx={j%2 ? 4 : -4} cy={-59+j*8} rx="3" ry="7" fill="#dabb69" transform={`rotate(${j%2 ? 25 : -25} ${j%2 ? 4 : -4} ${-59+j*8})`} /></g>)}</g>)}</g></g>
    <g data-scene-object="fruit-tree"><path d="M836 53Q770 79 795 164" fill="none" stroke="#857957" strokeWidth="7" /><circle cx="795" cy="175" r="23" fill={`url(#${id}-red)`} stroke="#a28548" /><LeafShape id={id} x={826} y={139} size={.31} angle={33} /></g>
    <rect x="34" y="441" width="367" height="123" rx="15" fill={`url(#${id}-paper)`} fillOpacity=".96" stroke="#c3af83" />
    <g data-scene-object="multicolour-chrysanthemums">{[[86,476,'#e1d28b'],[163,481,'#d5a27c'],[244,477,'#cba0bb'],[332,485,'#ddbd68']].map(([x,y,c])=><Flower key={x} id={id} x={Number(x)} y={Number(y)} size={.96} colour={String(c)} chrysanthemum />)}</g>
  </>;
  return <><ImageBackground courseId="cn-06" /><g data-scene-object="gentle-autumn-rain" stroke="#d9e6df" strokeWidth="1.7" opacity=".75" className="nature-falling-rain">{Array.from({length:37},(_,i)=><path key={i} d={`m${16+(i*83)%884} ${35+(i*67)%516} -6 20`} />)}</g><LeafShape id={id} x={619} y={451} kind="ginkgo" colour="gold" size={.8} angle={20} object="autumn-yellow-leaf" /></>;
}

function AutumnSounds({ id, step, sceneKey, gains }: { id: string; step: number; sceneKey?: string; gains?: Record<string, number> }) {
  const mix = gains !== undefined;
  const chosen = sceneKey ?? ['leaves','cricket','geese','details'][step] ?? 'leaves';
  const level = (key: string) => mix ? bound(gains![key]) : chosen === key || chosen==='details' ? .65 : 0;
  return <>
    <ImageBackground courseId="cn-07" />
    <rect x="109" y="116" width="265" height="302" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".96" stroke="#c4b287" strokeWidth="2" />
    <g data-scene-object="wind-leaves" data-gain={level('leaves')} style={{'--nature-strength':level('leaves')} as CSSProperties} className={level('leaves') ? 'nature-bending-leaves' : undefined}><LeafShape id={id} kind="ginkgo" x={232} y={245} size={.8} angle={-20} colour="gold" /><LeafShape id={id} kind="maple" x={303} y={354} size={.48} angle={40} colour="red" /><path d="M130 381q86-29 205 0" fill="none" stroke="#b8a783" strokeWidth="2" /></g>
    <g data-scene-object="cricket-balcony" data-gain={level('cricket')}><rect x="284" y="420" width="362" height="147" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#c4b287" strokeWidth="2" /><path d="M295 540H634V555H295" fill="#b0a287" stroke="#877d62" strokeWidth="2" /><Cricket x={459} y={506} size={1.22} active={level('cricket')>0} /></g>
    <rect x="578" y="48" width="300" height="162" rx="17" fill={`url(#${id}-sky)`} fillOpacity=".96" stroke="#c4b287" strokeWidth="2" />
    <g data-scene-object="flying-geese" data-gain={level('geese')}>{[0,1,2,3,4,5,6].map(i=><g key={i} transform={`translate(${627+i*29} ${113+Math.abs(i-3)*12}) scale(${.63-i%2*.08})`}><path className={level('geese') ? 'nature-goose-wings' : undefined} d="M0 0Q-35-30-53-16Q-26-14-6 8Q12-5 42-32Q20-31 0 0Z" fill="#646f67" stroke="#4c5d54" strokeWidth="2" /><path d="M-5 8Q10 11 21-7L25-14" fill="none" stroke="#606a62" strokeWidth="7" strokeLinecap="round" /></g>)}</g>
    {step===3 && !mix && <g data-scene-object="flower-and-grain-details"><Flower id={id} x={632} y={510} size={.72} colour="#d09c83" />{[0,1,2,3].map(i=><g key={i} transform={`translate(${749+i*15} ${517+i%2*12}) rotate(${i*21})`}><ellipse rx="6" ry="12" fill="#d1a755" stroke="#9b7d42" /><path d="M0-7V7" stroke="#e8cf90" /></g>)}</g>}
    <SoundRings x={234} y={240} gain={level('leaves')} id="leaves" /><SoundRings x={459} y={493} gain={level('cricket')} id="cricket" /><SoundRings x={675} y={132} gain={level('geese')} id="geese" />
  </>;
}

function ReefFish({ x, y, size = 1, kind = 0 }: { x: number; y: number; size?: number; kind?: number }) {
  const colours = ['#e9c76f','#6cc1bb','#d6a1a3','#bfd283'];
  return <g data-scene-object="reef-fish" transform={`translate(${x} ${y}) scale(${size})`} stroke="#36566a" strokeWidth="1.3">
    <g className="nature-swimming-fish">
      <path d={kind===3 ? 'M-47 0Q-7-58 29-21Q69 7 24 31Q-9 56-47 0Z' : kind===1 ? 'M-55 0Q-22-20 25-15L49-4Q59 11 18 17Q-23 21-55 0Z' : 'M-46 0Q-13-40 29-20Q55-9 48 6Q31 35-10 27Z'} fill={colours[kind%4]} /><path d="M-43-4-72-27-64 6-72 29-42 12Z" fill={colours[(kind+1)%4]} /><path d="M-15-22 0-44 17-21m-23 46 13 14 10-15" fill={colours[kind%4]} />
      {kind===0 && <g stroke="#738c6b" strokeWidth="7"><path d="M-23-18-15 22M-2-25 6 25m9-41 8 30" /></g>}
      {kind===2 && <g fill="#aa7c78" stroke="none">{[[-17,-3],[-4,13],[11,-9],[3,1],[-26,8]].map(([a,b])=><circle key={a} cx={a} cy={b} r="3" />)}</g>}
      {kind===3 && <g stroke="#79946d" strokeWidth="2">{Array.from({length:9},(_,i)=><path key={i} d={`M${-38+i*9} ${-17-Math.sin(i*.35)*12}l${i-4} -10`} />)}</g>}
      <circle cx="31" cy="-6" r="4" fill="#203e54" /><circle cx="32" cy="-7" r="1.1" fill="#ecf5e3" /><path d="M46 8q-7 1-9-3M20-17q-10 17 0 30" fill="none" stroke="#6a877d" /><path d="m-3-6-18 10 18 6" fill="#cce2cd" fillOpacity=".5" />
    </g>
  </g>;
}

function Coral({ x, y, kind = 0 }: { x: number; y: number; kind?: number }) {
  return <g data-scene-object={kind===0 ? 'branching-coral' : 'rounded-coral'} transform={`translate(${x} ${y})`}>
    {kind===0 ? <g fill="none" stroke="#d39387" strokeWidth="13" strokeLinecap="round"><path d="M0 0V-123M0-47-48-101m48 31 44-57m-44 42 22-54M-34-83-39-131m65 28 26-7m-53-32-24-23m69 24 9-25" /><path d="M-43-125-17-94M20-127 2-104" stroke="#e7b5a1" strokeWidth="6" /></g>
      : <g data-scene-object="layered-plate-coral"><path d="M-13 0Q-4-52 8-73L27-9Z" fill="#a29369" stroke="#7c7d5e" strokeWidth="2" />{[0,1,2,3].map(i=><g key={i} transform={`translate(${i%2 ? 13 : -5} ${-15-i*27})`}><path d={`M${-70+i*9} 0Q0 27 ${70-i*9} 0L${60-i*7} 15Q0 37 ${-60+i*7} 15Z`} fill={i%2 ? '#ab9670' : '#bda47a'} stroke="#8c815c" strokeWidth="1.3" /><ellipse rx={70-i*9} ry={15-i} fill={i%2 ? '#d7c491' : '#d2b987'} stroke="#eee1b4" strokeWidth="2" /><g fill="#a69467" opacity=".8">{Array.from({length:24},(_,j)=><circle key={j} cx={Math.sin(j*2.399)*Math.sqrt(j/24)*(60-i*8)} cy={Math.cos(j*2.399)*Math.sqrt(j/24)*(10-i)} r="1.2" />)}</g></g>)}</g>}
  </g>;
}

function Xisha({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = ({water:0,coral:1,fish:2,birds:3} as Record<string,number>)[sceneKey ?? ''] ?? step;
  if (phase===0) return <><rect width="900" height="600" fill={`url(#${id}-sky)`} /><path d="M0 242H900V600H0Z" fill="#205d87" /><path data-scene-object="shallow-turquoise-water" d="M0 269Q216 340 409 275Q657 216 900 344V470Q655 307 414 425Q213 503 0 427Z" fill="#65c5c1" /><path data-scene-object="middle-blue-water" d="M0 365Q223 424 426 360Q688 283 900 412V533Q649 393 429 494Q208 559 0 506Z" fill="#448eab" /><path data-scene-object="deep-indigo-water" d="M0 518Q311 548 507 459Q720 424 900 500V600H0Z" fill="#2c507f" /><path d="M26 329q167 14 291-13m39 117q194-48 290-24m-299 130q133-49 266-35" fill="none" stroke="#d0eeea" strokeWidth="3" opacity=".8" /><g data-scene-object="island"><path d="M417 252Q479 180 610 212Q669 220 704 254Z" fill="#69976c" /><path d="M409 253Q567 234 707 257L688 269H428Z" fill="#ecdca6" />{[457,497,547,609,646].map((x,i)=><BranchTree key={x} id={id} x={x} y={246} size={.11+i%2*.025} />)}</g></>;
  if (phase===3) return <><ImageBackground courseId="cn-16" opacity={.48} /><rect width="900" height="600" fill="#e3e9d5" opacity=".25" /><path d="M0 420Q356 337 900 424V600H0Z" fill="#b5c1a0" /><BranchTree id={id} x={267} y={513} size={1.38} /><BranchTree id={id} x={750} y={501} size={.96} /><g data-scene-object="bird-nest-with-eggs" transform="translate(538 397)"><path d="M-82-34Q0 38 91-37Q96 47-3 53Q-77 38-82-34Z" fill="#a5966e" stroke="#716e4f" strokeWidth="2" />{[-20,7,33].map((x,i)=><ellipse key={x} cx={x} cy={-8-i%2*8} rx="15" ry="21" fill="#f4eacc" stroke="#b6ac83" strokeWidth="1" />)}{[0,1,2,3,4].map(i=><path key={i} d={`M${-78+i*7} ${-17+i*9}q90 49 166 -18`} fill="none" stroke="#d0bd8b" strokeWidth="3" />)}</g><Sparrow x={464} y={354} size={1.24} /><Sparrow x={669} y={265} size={1} flying /><Sparrow x={363} y={242} size={.8} /><Sparrow x={813} y={416} size={.75} /><path d="M395 366Q538 409 680 330" stroke="#776c4a" strokeWidth="12" fill="none" /></>;
  return <><rect width="900" height="600" fill={`url(#${id}-sea)`} /><path d="M0 0 287 600H388L109 0m338 0 160 600h76L540 0" fill="#ccede0" opacity=".1" /><path d="M0 490Q218 450 450 497T900 494V600H0Z" fill="#b4bd9b" /><path d="M0 544Q415 508 900 541" fill="none" stroke="#d8d5b0" strokeWidth="17" />
    <Coral x={135} y={520} /><Coral x={385} y={521} kind={1} /><Coral x={728} y={538} /><Coral x={862} y={550} kind={1} />
    {phase===1 && <><g data-scene-object="sea-cucumber" transform="translate(512 522)"><path d="M-56 0Q-67-22-28-26L38-17Q70-5 54 14L-31 16Z" fill="#767d5b" stroke="#485e50" strokeWidth="2" />{[-40,-23,-5,14,33,49].map((x,i)=><path key={x} d={`m${x} ${i%2 ? -7 : 3} 5-8 4 9`} fill="#536650" />)}</g><g data-scene-object="lobster" transform="translate(645 497)" fill="#b38760" stroke="#705a49" strokeWidth="2"><path d="M-38 3Q-17-23 17-12L39 3 13 25-23 20Z" /><path d="m-30 12-26 14 17 6m11-12-13 24m20-22-6 24m25-23 12 24m-1-30 23 24m-6-40 29 12m-28-8q46-48 90-28m-96 25q13-68 41-72" fill="none" /><path d="m-31 12-34-23-7 27 34 13Z" /><path d="M24 3 55-12 67-35 71-9 99 0 66 8 45 16Z" /><circle cx="27" cy="0" r="3" fill="#344b42" /></g></>}
    <g data-scene-object={phase===2 ? 'many-different-fish' : 'undersea-context-fish'}>{Array.from({length:phase===2 ? 19 : 4},(_,i)=><ReefFish key={i} x={105+(i*151)%713} y={101+(i*83)%300} kind={i%4} size={phase===2 ? .61+(i%4)*.17 : .63} />)}</g>
    <g fill="none" stroke="#c5e8df" strokeWidth="1.6" opacity=".5">{[92,238,447,728].map((x,i)=><g key={x}><circle cx={x} cy={367-i*47} r="6" /><circle cx={x+9} cy={331-i*47} r="4" /></g>)}</g>
  </>;
}

function SeasideTown({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = ({trees:1,shade:2,clean:3} as Record<string,number>)[sceneKey ?? ''] ?? step;
  if (phase===0) return <><ImageBackground courseId="cn-17" /><g data-scene-object="returning-fishing-boats">{[243,459,651].map((x,i)=><g key={x} transform={`translate(${x} ${347+i*27}) scale(${.68+i*.12})`}><path d="M-83 0H87L64 34H-56Z" fill="#897451" stroke="#685c44" strokeWidth="2" /><path d="M-30 0V-51H38V0" fill="#e5d5a6" stroke="#756847" /><path d="M2-54V-124m0 12 59 50H4Z" fill="#c6baa0" stroke="#746c52" strokeWidth="2" /></g>)}</g><path data-scene-object="shells-on-beach" d="M43 524q20-23 43 1l-43 1m112 20q16-17 35 0l-35 1m518 10q17-26 43 0l-43 1" fill="#eee0c5" stroke="#bcab86" strokeWidth="1.5" /></>;
  if (phase===1) return <><ImageBackground courseId="cn-17" /><path d="M0 482Q367 432 900 466V600H0Z" fill="#c5b994" fillOpacity=".72" />

    <g data-scene-object="courtyard-varied-trees"><BranchTree id={id} x={171} y={516} size={.83} /><BranchTree id={id} x={737} y={498} size={.88} /><BranchTree id={id} x={574} y={463} size={.56} kind="pine" /></g>
    <g data-scene-object="courtyard-flower-blossoms">{[0,1,2,3,4,5,6,7,8].map(i=><Flower key={i} id={id} x={650+(i*37)%203} y={178+(i*27)%120} size={.43} colour={i%2 ? '#d99985' : '#bf7e6d'} />)}</g><g data-scene-object="fragrant-courtyard-leaves"><LeafShape id={id} x={140} y={283} size={.44} angle={23} /><LeafShape id={id} x={185} y={334} size={.4} angle={-37} /></g></>;
  if (phase===2) return <><ImageBackground courseId="cn-17" /><path d="M0 442Q383 403 900 441V600H0Z" fill="#b4ba8e" fillOpacity=".83" /><path d="M0 558Q274 484 571 519T900 543" fill="none" stroke="#ded3b2" strokeWidth="48" /><g data-scene-object="banyan-wide-canopy"><path d="M424 479Q402 359 429 238L465 233Q490 329 474 480Z" fill={`url(#${id}-bark)`} stroke="#6d7055" strokeWidth="2" />{Array.from({length:36},(_,i)=><g key={i}>{[0,1,2].map(layer=><ellipse key={layer} cx={450+Math.sin(i*2.399)*Math.sqrt(i/36)*339} cy={219+Math.cos(i*2.399)*Math.sqrt(i/36)*126} rx="76" ry="47" fill={layer===0 ? ['#426d53','#517f58','#76975f','#5c885b'][i%4] : `url(#${id}-${layer===1 ? 'canopy' : 'foliage'})`} />)}</g>)}<path d="M425 381 255 264m177 49 175-66m-157 78-90-93m106 76 73-100" fill="none" stroke="#7c7c57" strokeWidth="14" /><path d="M224 270V464m95-178v199m279-207v187m111-210v221" fill="none" stroke="#9b986c" strokeWidth="2" /></g><ellipse data-scene-object="banyan-shade" cx="460" cy="478" rx="307" ry="57" fill="#426447" opacity=".18" /><g data-scene-object="people-resting-in-shade"><path d="M318 456H580V478H318m20 0v62m217-62v62M339 414H558V441H339Z" fill="#a69370" stroke="#776e52" strokeWidth="2" /><Child x={383} y={416} size={.73} pose="look" /><Child x={508} y={419} size={.77} pose="read" colour="#768e78" /></g></>;
  return <><ImageBackground courseId="cn-17" />
    <g data-scene-object="clean-open-street"><path d="M459 278H481L828 600H84Z" fill="#d3c7a9" stroke="#b8a881" strokeWidth="2" /><path d="M464 292 138 600m338-308 299 308" stroke="#e3d6b7" strokeWidth="5" /><path d="M224 528q111-37 215-47m61-40q96 22 167 63m-300 63q93-18 157-4" stroke="#c5b78e" strokeWidth="1" fill="none" opacity=".6" /></g>
    <g data-scene-object="street-road-surface" fill="#ad9b77" opacity=".32">{Array.from({length:113},(_,i)=>{const y=361+(i*43)%227;const spread=(y-278)*.88;const x=470+Math.sin(i*2.399)*spread;return <ellipse key={i} cx={x} cy={y} rx={.7+(y-360)*.007} ry={.4+(y-360)*.003} />;})}</g>
    <g data-scene-object="street-side-planters">{[[143,514,.8],[742,476,.67]].map(([x,y,size],i)=><g key={x} transform={`translate(${x} ${y}) scale(${size})`}><path d="M-43-4H42L31 71H-29Z" fill="#a99772" stroke="#776f53" strokeWidth="2" /><ellipse cy="-4" rx="43" ry="12" fill="#5f684c" />{[0,1,2,3].map(j=><Flower key={j} id={id} x={-27+j*18} y={-54-j%2*18} size={.7} colour={i ? '#e3cf86' : '#d7a08e'} />)}</g>)}</g>
  </>;
}

function FourSeasons({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const season = ['spring','summer','autumn','winter'].includes(sceneKey ?? '') ? sceneKey! : ['spring','summer','autumn','winter'][Math.max(0,Math.min(3,step))];
  const winter = season==='winter'; const autumn=season==='autumn'; const summer=season==='summer';
  return <>
    <rect width="900" height="600" fill={winter ? '#dae6e7' : `url(#${id}-sky)`} />
    <path d="M0 306Q188 214 401 312T900 266V600H0Z" fill={winter ? '#b6cbc4' : summer ? '#769780' : '#a4b894'} /><path d="M0 374Q315 294 626 360T900 341V600H0Z" fill={winter ? '#eff4e9' : autumn ? '#b7ab75' : '#a9bc88'} />
    <g data-scene-object="same-forest-trees">{[61,211,340,514,681,829].map((x,i)=><BranchTree key={x} id={id} x={x} y={427+i%2*19} size={.51+(i%3)*.08} season={season} kind={i%2 ? 'pine' : 'birch'} />)}<BranchTree id={id} x={134} y={537} size={1.45} season={season} kind="birch" /><BranchTree id={id} x={754} y={510} size={1.22} season={season} kind="pine" /></g>
    <path data-scene-object="same-forest-stream" d="M386 330Q496 376 444 426T427 516Q485 563 544 600H260Q414 532 362 492T380 425Q432 373 365 330Z" fill={winter ? '#bfd4d5' : `url(#${id}-stream)`} /><path d="M398 425q31-12 53-2m-67 72q48-16 72-2m-73 69q58-21 100 0" fill="none" stroke="#e9f4e6" strokeWidth="3" className="nature-river-ripple" />
    {season==='spring' && <><g data-scene-object="spring-new-leaves">{[[306,202],[341,175],[362,218],[305,232]].map(([x,y],i)=><LeafShape key={y} id={id} x={x} y={y} size={.24} angle={i*63-80} colour="green" />)}</g><g data-scene-object="melting-snow"><path d="M20 524Q53 504 99 527L119 542H22Zm420-174q36-20 61 4l-4 10h-61Z" fill="#f8f8e8" stroke="#d3e2d4" /><path d="M447 365q-4 16-13 24m-349 157-13 14" stroke="#94bbba" strokeWidth="3" fill="none" /></g><Deer x={568} y={456} size={.83} /></>}
    {summer && <><rect data-scene-object="summer-forest-mist" x="0" y="296" width="900" height="108" fill={`url(#${id}-mist)`} /><path data-scene-object="summer-sunbeams" d="M435 39 277 544H353L518 38m59 0L439 542h55L632 38" fill="#f7e6a6" opacity=".24" /><g data-scene-object="summer-wildflowers">{Array.from({length:19},(_,i)=><Flower key={i} id={id} x={27+(i*129)%846} y={473+(i*41)%97} size={.33+(i%4)*.11} colour={['#cfa2b5','#e7d489','#cbd3bd','#dcb098'][i%4]} />)}</g></>}
    {autumn && <><g data-scene-object="autumn-coloured-leaves">{Array.from({length:17},(_,i)=><LeafShape key={i} id={id} kind={i%2 ? 'maple' : 'oval'} x={26+(i*143)%849} y={446+(i*37)%131} size={.11+i%4*.05} angle={i*71} colour={i%2 ? 'gold' : 'red'} />)}</g><g data-scene-object="forest-grapes-and-mushrooms" transform="translate(639 445)"><path d="M-40 37Q-13 25 18-47m-18 72 83-49" fill="none" stroke="#637d52" strokeWidth="4" /><LeafShape id={id} x={30} y={-34} kind="maple" size={.4} angle={34} />{[[-10,0],[6,-7],[21,0],[-1,15],[15,15],[7,32]].map(([x,y])=><circle key={`${x}${y}`} cx={x} cy={y} r="9" fill="#766387" stroke="#5b586b" strokeWidth="1" />)}{[71,116,149].map((x,i)=><g key={x} transform={`translate(${x} ${57+i%2*13})`}><path d="M-4 0H4L8 27H-7Z" fill="#dfd3aa" stroke="#9c8760" /><path d="M-23 1Q-10-31 12-17Q29-6 23 1Z" fill="#aa8058" stroke="#7d684d" /><path d="M-17-4q16-17 31 0" fill="none" stroke="#c99d6e" strokeWidth="2" /></g>)}</g></>}
    {winter && <><g data-scene-object="winter-snow"><path d="M0 478Q62 454 188 493L186 537Q57 498 0 524Zm545 74q140-69 355-22v70H529Z" fill="#f5f7eb" /><g fill="#f5f8ed">{Array.from({length:37},(_,i)=><circle key={i} cx={16+(i*97)%881} cy={36+(i*83)%489} r={1.8+i%3} />)}</g></g><g data-scene-object="bear-winter-den" transform="translate(72 442)"><path d="M-70 48Q-66-86 44-67Q119-54 126 54Z" fill="#9ba89a" /><path d="M-34 45Q-34-47 34-40Q84-37 88 50Z" fill="#48584b" /><ellipse cx="35" cy="30" rx="43" ry="24" fill="#8d775b" /><circle cx="69" cy="18" r="18" fill="#8b755a" /><circle cx="65" cy="0" r="7" fill="#7b6852" /><path d="m68 17 6 1" stroke="#3b4439" strokeWidth="2" /></g><Squirrel x={649} y={448} size={.82} cone /><g data-scene-object="sable" transform="translate(545 543)"><path d="M-21 1Q-76-20-104 1Q-66 6-41 18Z" fill="#5f5547" /><ellipse rx="38" ry="16" fill="#645949" /><path d="m24-7 18-13 13 9-10 23-23-2Z" fill="#685d4c" /><circle cx="45" cy="-10" r="2" fill="#d9cdb1" /><path d="m-20 9-12 12m31-8 6 14m20-19 16 7" stroke="#544c41" strokeWidth="5" fill="none" /></g><path d="M409 129q193-49 344-9m-211 33q180-24 276-9" fill="none" stroke="#f1f5e9" strokeWidth="4" className="nature-wind-line" /></>}
  </>;
}

function HongKong({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase = ({goods:0,dishes:1,sculpture:2,lights:3} as Record<string,number>)[sceneKey ?? ''] ?? step;
  if (phase===1) return <><rect width="900" height="600" fill="#e9dfc5" /><path d="M0 111H900V285H0Z" fill="#b1ab8b" /><path d="M0 0H900V119H0Z" fill="#6c826e" /><g stroke="#d1c5a2" strokeWidth="3">{[117,308,501,700].map(x=><path key={x} d={`M${x} 7V277`} />)}</g><path d="M25 395Q450 288 879 394V600H25Z" fill="#aa8b63" /><ellipse cx="450" cy="420" rx="379" ry="111" fill="#b79b73" stroke="#765e43" strokeWidth="3" /><g data-scene-object="different-cuisines"><g transform="translate(270 366)"><ellipse rx="130" ry="51" fill="#eadcc0" stroke="#917d58" strokeWidth="3" />{[[-48,-7],[0,-16],[49,-2],[-23,20],[33,22]].map(([x,y],i)=><g key={x} transform={`translate(${x} ${y})`}><path d="M-27 3Q-24-28 0-29Q25-24 29 3Q-1 18-27 3Z" fill={i%2 ? '#dec29c' : '#ecd8b2'} stroke="#b59465" /><path d="m-14-11 9 12m8-21 2 19m10-12-7 16" stroke="#bba074" /></g>)}</g><g transform="translate(652 399)"><ellipse rx="115" ry="48" fill="#eee1c6" stroke="#a18c65" strokeWidth="3" /><path d="M-66 5Q-29-45 5-13Q56-45 81 5L60 27H-51Z" fill="#d79b61" stroke="#996b42" /><path d="M-47-3 62 12m-80-29 12 38m29-33 13 31" stroke="#dfba77" strokeWidth="6" /><path d="m-75 11 24 10m-9-28-15 4m114-1 33 8" stroke="#81935d" strokeWidth="9" /></g><g transform="translate(458 476)"><ellipse rx="123" ry="51" fill="#b9bfa0" stroke="#7b8870" strokeWidth="3" /><path d="M-114-2Q-74 93 0 93Q75 91 115-2" fill="#cbd0b0" stroke="#859277" strokeWidth="3" /><g fill="none" stroke="#e5cd91" strokeWidth="5">{[0,1,2,3,4].map(i=><path key={i} d={`M${-73+i*24} 10q-30-42 10-46t32 44`} />)}</g></g></g><path className="nature-steam" d="M237 260q-17-26 2-50m47 43q-16-29 3-44m360 70q-18-30 4-56" fill="none" stroke="#eee8d4" strokeWidth="4" /></>;
  if (phase===2) return <><rect width="900" height="600" fill={`url(#${id}-sky)`} /><path d="M0 339H900V600H0Z" fill="#78aeb6" /><path d="M0 437H900V600H0Z" fill="#c1bba3" /><path d="M250 535H650V572H250Z" fill="#938c72" stroke="#7a7864" /><path data-scene-object="golden-bauhinia-pedestal" d="M361 430H539V538H361Z" fill="#b5a077" stroke="#827253" strokeWidth="3" /><g data-scene-object="golden-bauhinia-sculpture" transform="translate(450 272)" fill={`url(#${id}-gold)`} stroke="#a28544" strokeWidth="2.4">{[0,72,144,216,288].map(r=><path key={r} transform={`rotate(${r})`} d="M0 17Q-70-16-64-89Q-51-140-12-113Q34-101 27-61Q19-24 0 17Z" />)}<circle r="18" fill="#caa455" /><path d="M-1 9Q-44 76-32 156H13Q34 87 28 31Z" /></g><path d="M25 392q152-16 217 0m404-12q148-17 228 2" fill="none" stroke="#cde2d9" strokeWidth="3" /><g data-scene-object="harbour-buildings" fill="#78968e" opacity=".5">{Array.from({length:11},(_,i)=><rect key={i} x={25+i*81} y={284-i%3*16} width="35" height={57+i%3*16} />)}</g></>;
  const night=phase===3;
  return <><ImageBackground courseId="cn-19" />
    {night && <><rect width="900" height="600" fill={`url(#${id}-night)`} opacity=".74" /><g data-scene-object="lit-harbour-skyline">{Array.from({length:55},(_,i)=><path key={i} d={`M${334+(i*47)%533} ${158+(i*31)%159}h${3+i%3}v${6+i%2*3}`} stroke={i%3 ? '#edd396' : '#aedddd'} strokeWidth="2" opacity=".8" />)}</g></>}
    {!night && <rect x="66" y="294" width="754" height="290" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".97" stroke="#c4b287" strokeWidth="2" />}

    {night ? <><g data-scene-object="harbour-light-reflections" strokeWidth="4" opacity=".7">{Array.from({length:21},(_,i)=><path key={i} d={`M${21+i*44} 343v${33+(i*29)%118}m-8 18h18m-16 22h14`} fill="none" stroke={i%3 ? '#c7b274' : '#89c4c1'} />)}</g><g data-scene-object="harbour-night-ferry" transform="translate(607 480)"><path d="M-122 0H106L75 42H-76Z" fill="#384c50" stroke="#92b7af" strokeWidth="2" /><path d="M-75-43H55V0H-75Z" fill="#b6bda5" /><path d="M-58-26H38" stroke="#e8d69c" strokeWidth="16" /><path d="M-96 44H90" stroke="#a7c6b5" strokeWidth="2" /></g></>
      : <g data-scene-object="goods-and-cargo-ship"><path d="M120 409H732L671 469H184Z" fill="#576c69" stroke="#405850" strokeWidth="3" /><path d="M632 409V315H698V409" fill="#e6dec2" stroke="#798876" />{[0,1,2,3,4,5,6,7,8].map(i=><g key={i}><rect x={180+i%5*88} y={355-Math.floor(i/5)*50} width="84" height="49" fill={['#b77e59','#9ca66d','#7ea79a','#cfb881'][i%4]} stroke="#5f715d" strokeWidth="2" /><path d={`M${193+i%5*88} ${362-Math.floor(i/5)*50}v35m15-35v35m15-35v35m15-35v35`} stroke="#e2d5b0" opacity=".4" /></g>)}<path d="M66 589H876V600H66Z" fill="#b2ac92" /><g transform="translate(314 541)"><path d="M-81-53H87V39H-81Z" fill="#c2a77f" stroke="#8e7858" strokeWidth="2" /><path d="M-53-53V39M52-53V39M-81-22H87M-81 8H87" stroke="#a89168" strokeWidth="3" /><g transform="translate(172 -30) scale(.67)"><Merchant x={0} y={0} colour="#a38b6b" carrying /></g><g transform="translate(-126 -28) scale(.65)"><Merchant x={0} y={0} colour="#7c9380" /></g></g></g>}
  </>;
}

function NatureOrchestra({ id, step, sceneKey, gains, parameter }: { id: string; step: number; sceneKey?: string; gains?: Record<string,number>; parameter?: number }) {
  const overview = !gains && step===0;
  const chosen=sceneKey ?? ['', 'wind', 'water', 'animals'][Math.min(3,step)];
  const level=(key: string) => gains ? bound(gains[key]) : overview ? .5 : chosen===key || chosen==='water' && key==='rain' ? bound(parameter,.65) : 0;
  const wind=level('wind'), rain=level('rain'), water=level('water'), animals=level('animals');
  return <>
    <ImageBackground courseId="cn-21" />
    <g data-scene-object="water-stream" data-gain={water} data-active={water>0}><g fill="none" stroke="#e1f1e3" strokeWidth={1+water*3} opacity={.25+water*.65} className={water ? 'nature-river-ripple' : undefined}><path d="M419 414q41-8 72 0m-105 41q57-14 95 0m-33 33q65-16 114 0m-83 77q85-13 201 0" /></g></g>
    <rect x="61" y="75" width="293" height="240" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".96" stroke="#c4b287" strokeWidth="2" />
    <g data-scene-object="wind-leaf-object" data-gain={wind} data-active={wind>0} style={{'--nature-strength':wind} as CSSProperties} className={wind ? 'nature-bending-leaves' : undefined}><path d="M88 277Q153 227 282 144" fill="none" stroke="#7e7c52" strokeWidth="8" /><LeafShape id={id} x={200} y={208} size={.75} angle={47} /><LeafShape id={id} x={273} y={263} size={.48} angle={-20} /></g>
    {wind>0 && <g data-scene-object="active-wind" className="nature-wind-line" opacity={.3+wind*.7} fill="none" stroke="#d6be7c" strokeWidth={1.5+wind*3}><path d="M83 120q113-39 240 0m-229 47q119-30 179-7" /></g>}
    <rect x="491" y="256" width="225" height="178" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".97" stroke="#c4b287" strokeWidth="2" />
    <g data-scene-object="rain-struck-leaf" data-gain={rain} data-active={rain>0}><LeafShape id={id} x={588} y={356} size={.85} angle={-70} /><path d="M540 388q38 27 77 0" fill="none" stroke="#547b57" strokeWidth="3" /></g>
    {rain>0 && <g data-scene-object="active-rain" opacity={.3+rain*.65}><g className="nature-falling-rain" stroke="#7aabaf" strokeWidth={1.1+rain*1.2}>{Array.from({length:12+Math.round(rain*37)},(_,i)=><path key={i} d={`m${51+(i*83)%822} ${57+(i*47)%452} -5 ${11+rain*13}`} />)}</g><g data-scene-object="rain-impact-ripples" className="nature-river-ripple" fill="none" stroke="#e5f1da" strokeWidth="2"><ellipse cx="441" cy="474" rx="22" ry="6" /><ellipse cx="618" cy="341" rx="17" ry="5" /><path d="m614 324-7-11m12 10 8-7" /></g></g>}
    <g data-scene-object="bird-and-cricket" data-gain={animals} data-active={animals>0}><rect x="600" y="52" width="267" height="163" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#c4b287" strokeWidth="2" /><path d="M620 183Q735 177 841 143" fill="none" stroke="#7b7051" strokeWidth="9" /><Sparrow x={738} y={145} size={1.32} className={animals ? 'nature-singing-bird' : undefined} /><rect x="638" y="443" width="218" height="135" rx="17" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#c4b287" strokeWidth="2" /><Cricket x={728} y={525} size={1.02} active={animals>0} /></g>
    {water>0 && <g data-scene-object="stream-river-sea-progression" data-gain={water} transform="translate(32 482)"><rect x="0" y="0" width="574" height="99" rx="16" fill="#f7f1db" fillOpacity=".98" stroke="#a4b49b" />
      <g data-scene-object="small-stream-example"><path d="M13 41 47 12 84 43 108 23 137 41V86H13Z" fill="#aebd98" /><path d="M65 37q28 16 5 26t30 23H54q21-13 8-25t-4-24Z" fill="#88b7b4" /><path d="M69 62h14" stroke="#ecf1d8" strokeWidth="2" /></g>
      <g data-scene-object="river-example"><path d="M207 36q52-31 117 0v49H207Z" fill="#b9c3a1" /><path d="M246 26q35 28 17 59h-37q30-35 9-59Z" fill="#78aeb1" /><path d="m237 55 23 2m-28 15h21" stroke="#edf2dc" strokeWidth="2" /></g>
      <g data-scene-object="sea-example"><path d="M396 30h155v55H396Z" fill="#65a1b0" /><g className="nature-river-ripple" fill="none" stroke="#e4efe1" strokeWidth={1+water*2}><path d="M402 43q23-15 47 0t47 0t47 0m-141 22q23-15 47 0t47 0t47 0" /></g></g>
      <path d="M158 55h34m-12-7 12 7-12 7m161-7h33m-12-7 12 7-12 7" stroke="#a6aa80" strokeWidth="2" fill="none" />
    </g>}
    <SoundRings x={206} y={207} gain={wind} id="wind" /><SoundRings x={588} y={345} gain={rain} id="rain" /><SoundRings x={471} y={459} gain={water} id="water" /><SoundRings x={738} y={143} gain={animals} id="animals" /><SoundRings x={728} y={511} gain={animals} id="insect" />
  </>;
}

function Ants({ x, y }: { x: number; y: number }) {
  return <g data-scene-object="ordered-ant-group" transform={`translate(${x} ${y})`}>
    <path d="M-266 25Q-130-58-35 10T241-2" fill="none" stroke="#b3a478" strokeWidth="3" />
    {Array.from({length:12},(_,i)=><g key={i} transform={`translate(${-246+i*43} ${17+Math.sin(i*.72)*30}) rotate(${Math.cos(i*.7)*11})`} className="nature-ant-step" fill="#625743" stroke="#625743" strokeWidth="1.5"><ellipse cx="-10" rx="8" ry="5" /><ellipse cx="3" rx="5" ry="4" /><circle cx="12" cy="-1" r="5" /><path d="m-6-3-5-9m9 10 4-8m8 6 7-7m-21 17-6 9m8-7 5 8m8-10 6 8m2-19 7-7m-5 9 10-1" fill="none" /><g transform="translate(2 -10)"><path d="m-9-2 20-7-8 13Z" fill="#9cad70" stroke="#748653" /></g></g>)}
  </g>;
}

function NatureBook({ id, step, sceneKey }: { id: string; step: number; sceneKey?: string }) {
  const phase=({bird:0,insect:1,plant:2} as Record<string,number>)[sceneKey ?? ''] ?? step;
  if (phase===1) return <><ImageBackground courseId="cn-22" /><rect x="24" y="270" width="852" height="304" rx="18" fill={`url(#${id}-paper)`} fillOpacity=".98" stroke="#b9b191" strokeWidth="2" /><path d="M44 494Q325 422 596 485T852 466V554H44Z" fill="#c8b98f" /><g data-scene-object="ant-observation"><LeafShape id={id} x={152} y={398} size={.62} angle={22} /><LeafShape id={id} x={731} y={439} size={.71} angle={-24} colour="gold" /><Ants x={439} y={452} /></g><path d="M214 318q175-29 320-1" fill="none" stroke="#d5c69b" strokeWidth="2" /></>;
  if (phase===2) return <><ImageBackground courseId="cn-22" opacity={.37} /><rect x="26" y="42" width="848" height="516" rx="18" fill={`url(#${id}-paper)`} fillOpacity=".97" stroke="#b6b18e" strokeWidth="2" /><path d="M304 88V515M593 88V515" stroke="#d7ccb1" strokeWidth="2" /><g data-scene-object="plant-colours-and-shapes"><Flower id={id} x={132} y={278} size={1.85} colour="#cea2b5" /><Flower id={id} x={237} y={383} size={1.27} colour="#e3c076" /><LeafShape id={id} kind="oval" x={182} y={462} size={.55} angle={-35} /><LeafShape id={id} kind="ginkgo" x={232} y={497} size={.52} angle={26} colour="gold" /></g><g data-scene-object="fruit-tree-blossom-to-fruit">
    <g data-scene-object="flowering-branch"><path d="M387 281 468 141m-50 85-42-37m64 0 36-3" stroke="#8d805f" strokeWidth="7" fill="none" strokeLinecap="round" />{[[390,188],[446,166],[472,181]].map(([x,y])=><Flower key={x} id={id} x={x} y={y} size={.59} colour="#ead9cf" />)}<LeafShape id={id} x={423} y={252} size={.21} angle={65} /></g>
    <path data-scene-object="plant-time-arrow" d="M452 281v48m-10-13 10 13 10-13" stroke="#a5ab7b" strokeWidth="4" fill="none" />
    <g data-scene-object="fruiting-branch"><path d="M406 510 479 374m-41 82-39-27m63-17 31-4" stroke="#8d805f" strokeWidth="7" fill="none" strokeLinecap="round" />{[[407,419],[481,405],[449,461]].map(([x,y])=><g key={y} data-scene-object="fruit-after-blossom"><circle cx={x} cy={y} r="19" fill="#bd815a" stroke="#9c6948" /><path d={`M${x-8} ${y-6}q-4 8 0 14`} stroke="#e8ba82" strokeWidth="2" fill="none" /><LeafShape id={id} x={x+14} y={y-16} size={.21} angle={40} /></g>)}</g>
    </g><g data-scene-object="grass-leaf-differences">{[0,1,2,3,4,5].map(i=><path key={i} d={`M${649+i*35} 511Q${604+i*43} ${283+i%2*43} ${651+i*34} ${202+i%3*33}Q${681+i*33} 291 ${649+i*35} 511Z`} fill={i%2 ? '#79976a' : '#9db481'} stroke="#537853" strokeWidth="1.3" />)}</g></>;
  if (phase===3) return <><ImageBackground courseId="cn-22" opacity={.35} /><rect x="26" y="37" width="848" height="529" rx="18" fill={`url(#${id}-paper)`} fillOpacity=".92" stroke="#b9b393" strokeWidth="2" /><g data-scene-object="bamboo-growth-and-leaves" stroke="#618455" strokeWidth="7" fill="none">{[126,175,220,260].map((x,i)=><g key={x}><path d={`M${x} 523V${134+i%3*36}`} />{[0,1,2,3,4,5].map(j=><g key={j}><path d={`M${x-7} ${185+j*51}h15`} stroke="#b6c090" strokeWidth="4" /><path d={`M${x} ${184+j*51}q-48-65-63-48m65 30q57-55 76-29`} stroke="#7b9c67" strokeWidth="3" /></g>)}</g>)}</g><g data-scene-object="palm-fronds-and-reflection"><path d="M633 456Q607 286 612 166" stroke="#958662" strokeWidth="19" fill="none" />{[0,1,2,3,4,5,6].map(i=><g key={i} transform={`translate(613 178) rotate(${-84+i*27})`}><path d="M0 0Q23-86 0-133" fill="none" stroke="#688d62" strokeWidth="5" />{[0,1,2,3,4,5].map(j=><path key={j} d={`M${j<3 ? j*3 : (5-j)*3} ${-12-j*20}q-51-18-59-49m61 43q40-36 47-48`} fill="none" stroke="#7d9c69" strokeWidth="4" />)}</g>)}<path d="M418 453Q640 424 839 466V532H420Z" fill="#afc9bc" /><path d="M625 465Q584 487 643 524m-9-59q113 29 127 31m-134-23q-79 25-97 7" fill="none" stroke="#789e8c" strokeWidth="9" opacity=".5" /><path d="M446 497h101m134 18h118" stroke="#d2e1cb" strokeWidth="3" /></g></>;
  return <><ImageBackground courseId="cn-22" /><rect x="370" y="27" width="501" height="254" rx="18" fill={`url(#${id}-paper)`} fillOpacity=".96" stroke="#bab394" strokeWidth="2" /><g data-scene-object="sparrow-hopping-observation"><path d="M397 244H542" stroke="#a59b76" strokeWidth="3" /><Sparrow x={458} y={199} size={1.23} /><path d="M431 255q31-30 65 0" fill="none" stroke="#c1ac72" strokeWidth="2" strokeDasharray="3 6" /></g><g data-scene-object="eagle-flight-observation" transform="translate(700 140)"><path className="nature-eagle-glide" d="M0 10Q-52-78-120-44L-101-17-79-14-56 5-29 20Q-19 43-4 42L13 31Q38 6 70-6L98-21 123-24Q80-58 37-4L17 5 0 10Z" fill="#81745a" stroke="#4d5d50" strokeWidth="2" /><path d="M-15 9Q-9-14 9-8L22 6 18 18-2 19Z" fill="#b7aa87" /><path d="m19 5 13 7-15 1" fill="#cab277" /><circle cx="10" cy="4" r="2.6" fill="#273e35" /><path d="m-105-26 41 20m-53-3 50 14m139-31-24 19m47-22-34 22" stroke="#c2b799" strokeWidth="3" /><path d="M-5 27-13 61 12 55 22 30Z" fill="#736850" stroke="#53604e" /></g></>;
}

const descriptions: Record<string, string[]> = {
  'cn-01': ['孩子走进大青树下的校园。', '教室内孩子打开书朗读，窗外鸟与松鼠安静停留。', '同一校园课间，孩子在树下游戏，动物来到附近。', '校园中的铜钟、大青树与凤尾竹。'],
  'cn-05': ['雨后道路与映出蓝天的水洼。', '放大的金黄梧桐叶，五个叶裂、叶脉与水珠清晰可见。', '形状与方向各不相同的金黄落叶铺向路的尽头。', '棕红色雨靴在金黄落叶路上小心迈步。'],
  'cn-06': ['温柔秋雨中的秋景。', '银杏扇形叶、红枫叶、金黄田野、果树与多色菊花。', '挂着苹果和梨的果树，孩子留意水果。', '松鼠搬松果入树洞，青蛙靠近过冬洞穴。'],
  'cn-07': ['秋树落叶、阳台蟋蟀、飞行大雁与金黄田野。', '阳台上的蟋蟀振动翅膀，树叶与大雁仍在同一秋景里。', '成行大雁飞过田野，秋风吹动树叶。', '树叶、小花与谷粒让秋景有更多可观察的细节。'],
  'cn-16': ['深浅不同的海水形成青绿、蓝与深蓝色带。', '海底有鹿角状枝珊瑚和层叠盘状珊瑚、海参和龙虾。', '条纹、长形、带斑点与圆形的鱼成群游动。', '海岛树枝上有多只鸟，鸟巢内可见鸟蛋。'],
  'cn-17': ['渔船向海边靠近，沙滩上可见贝壳。', '庭院里的不同树木、树叶与一片花景。', '榕树树冠宽阔浓密，树下有阴影和休息的人。', '同一小城开阔而整洁的街道路面。'],
  'cn-18': ['同一森林的新枝嫩叶、融雪、溪流与小鹿。', '同一森林浓密树冠、林间雾、阳光与野花。', '同一森林彩叶、山葡萄与蘑菇。', '同一森林积雪，松鼠持松果、紫貂活动、熊在洞中。'],
  'cn-19': ['港口货船、不同商品与来往的人。', '蒸点、烤制菜肴与面食展示不同的饮食风味。', '海港旁的金紫荆雕塑。', '维多利亚港夜景中的建筑灯光、倒影与渡船。'],
  'cn-21': ['同一自然声场中树叶、雨滴、流水、鸟与蟋蟀都有对应对象。', '树叶随风摆动，风的强弱决定摆动和波纹幅度。', '雨滴敲击叶面和溪流，小溪、河流、大海的示意逐级变宽。', '树枝上的鸟与草边的蟋蟀，有与声音强弱同步的波纹。'],
  'cn-22': ['局部对比麻雀蹦跳与老鹰展翅滑翔。', '放大观察成行活动的蚂蚁。', '花色、叶形、果树开花结果与草叶形状的差异。', '竹子的节与叶、棕榈扇展的叶子及水中倒影。'],
};

export default function ChineseNatureScenes({ courseId, step, sceneKey, parameter, gains, paused = false }: ChineseNatureSceneProps) {
  const id=`nature-${useId().replace(/[^a-zA-Z0-9]/g,'')}`;
  const phase=Number.isFinite(step) ? Math.max(0,Math.min(3,Math.floor(step))) : 0;
  const props={id,step:phase,sceneKey,gains,parameter};
  let scene: ReactNode;
  switch(courseId) {
    case 'cn-01': scene=<Campus {...props} />; break;
    case 'cn-05': scene=<RainRoad {...props} />; break;
    case 'cn-06': scene=<AutumnRain {...props} />; break;
    case 'cn-07': scene=<AutumnSounds {...props} />; break;
    case 'cn-16': scene=<Xisha {...props} />; break;
    case 'cn-17': scene=<SeasideTown {...props} />; break;
    case 'cn-18': scene=<FourSeasons {...props} />; break;
    case 'cn-19': scene=<HongKong {...props} />; break;
    case 'cn-21': scene=<NatureOrchestra {...props} />; break;
    case 'cn-22': scene=<NatureBook {...props} />; break;
    default: return null;
  }
  const description=gains && courseId==='cn-21' ? '同一自然声场里，树叶、雨滴敲击的叶面、流水、鸟与蟋蟀都有真实画中对象；每一层是否活动及其强弱跟随对应控制。' : gains && courseId==='cn-07' ? '同一秋景里，落叶、阳台上的蟋蟀与成行的大雁同时可见；每个对象的动作和波纹跟随对应声源的强弱。' : descriptions[courseId][phase];
  return <svg className="chinese-nature-scene" viewBox="0 0 900 600" role="img" aria-labelledby={`${id}-title`} data-course-id={courseId} data-scene-key={sceneKey ?? `read-${phase}`} data-scene-step={phase} data-paused={paused || undefined}>
    <title id={`${id}-title`}>{description}</title><Definitions id={id} />
    <g clipPath={`url(#${id}-canvas)`}>{scene}<rect width="900" height="600" fill={`url(#${id}-grain)`} pointerEvents="none" /><rect x="10" y="10" width="880" height="580" fill="none" stroke="#d9d0b4" strokeWidth="1" opacity=".55" /></g>
  </svg>;
}
