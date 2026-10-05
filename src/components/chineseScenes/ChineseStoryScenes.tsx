import { ProgressiveSvgImage } from '../SceneImageFrame';
import { useId, type CSSProperties, type ReactNode } from 'react';
import './chineseStoryScenes.css';

export type ChineseStorySceneProps = {
  courseId: string;
  step: number;
  sceneKey?: string;
  parameter?: number;
  gains?: Record<string, number>;
  paused?: boolean;
};

const supported = new Set(['cn-02', 'cn-03', 'cn-09', 'cn-10', 'cn-11', 'cn-12', 'cn-13', 'cn-23', 'cn-24', 'cn-25', 'cn-26']);
export function supportsStoryScene(courseId: string) { return supported.has(courseId); }

const colours = { ink: '#473e32', line: '#786b51', moss: '#647d50', leaf: '#88a264', gold: '#d1a451', rose: '#bb735f', blue: '#648b99', cream: '#fff7e4' };
const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
const keys: Record<string, string[]> = {
  'cn-02': ['colours', 'school', 'opening', 'sway'],
  'cn-03': ['doubt', 'ask', 'understand', 'understand'],
  'cn-09': ['journey-start', 'spider-warning', 'snail-direction', 'cancelled-wedding'],
  'cn-10': ['learn-call', 'learning-rooster', 'learning-bird', 'ending-gate'],
  'cn-11': ['grandma', 'peach', 'math', 'sunflower'],
  'cn-12': ['mouth', 'first', 'second', 'outside'],
  'cn-13': ['carry', 'tempted', 'call-back', 'smallest'],
  'cn-23': ['play', 'fall', 'leave', 'break'],
  'cn-24': ['study-difficulty', 'study-hard', 'experiment-hard', 'experiment-result'],
  'cn-25': ['patients', 'danger', 'suggestion', 'continue'],
  'cn-26': ['exhibit', 'new-bowl', 'rice', 'dish'],
};
export function getStorySceneKey(courseId: string, step: number, sceneKey?: string) {
  return sceneKey || keys[courseId]?.[Math.max(0, Math.min(3, Math.floor(step)))] || 'opening';
}

function Label({ x, y, children, small = false, fill = colours.ink, anchor = 'middle', fontSize }: {
  x: number; y: number; children: ReactNode; small?: boolean; fill?: string; anchor?: 'middle' | 'start' | 'end'; fontSize?: number;
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} className={small ? 'css-label css-label-small' : 'css-label'} style={fontSize ? {fontSize} : undefined}>{children}</text>;
}
function Tag({ x, y, children, width = 132, colour = colours.moss }: { x: number; y: number; children: ReactNode; width?: number; colour?: string }) {
  const fit = typeof children === 'string' ? Math.min(20, (width - 25) / Math.max(1,[...children].length)) : 20;
  return <g transform={`translate(${x} ${y})`}><rect x={-width / 2} y="-23" width={width} height="40" rx="20" fill="#fffaf0" stroke={colour} strokeWidth="1.8" /><Label x={0} y={4} fill={colour} small fontSize={fit}>{children}</Label></g>;
}
function Arrow({ x, y, length = 74, angle = 0, colour = colours.gold, dashed = false }: { x: number; y: number; length?: number; angle?: number; colour?: string; dashed?: boolean }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`} stroke={colour} fill="none" strokeLinecap="round" strokeLinejoin="round"><path d={`M0 0H${length}`} strokeWidth="4" strokeDasharray={dashed ? '5 9' : undefined} /><path d={`m${length - 13} -9 13 9-13 9`} strokeWidth="4" /></g>;
}
function Spark({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#e3bc69"><path d="M0-16 4-4 16 0 4 4 0 16-4 4-16 0-4-4Z" /><circle cx="27" cy="-18" r="3" /></g>;
}
function Ground({ y = 484 }: { y?: number }) {
  return <g><ellipse cx="458" cy={y + 24} rx="370" ry="24" fill="#967d4e" opacity=".08" /><path d={`M43 ${y + 15}Q257 ${y - 9} 442 ${y + 14}T857 ${y + 11}`} fill="none" stroke="#b6b687" strokeWidth="2" /><g stroke="#83986c" strokeWidth="2.5" fill="none">{[91,127,778,819].map((x, i) => <path key={x} d={`M${x} ${y + 6}q-9-${19 + i * 2} -17-17m17 17q4-24 16-30`} />)}</g></g>;
}
function Panel({ x, y, width, height, title, children, tint = '#fff8e9' }: { x: number; y: number; width: number; height: number; title?: string; children: ReactNode; tint?: string }) {
  return <g transform={`translate(${x} ${y})`}><rect width={width} height={height} rx="27" fill={tint} stroke="#d7cbb0" strokeWidth="1.4" />{title && <><Label x={width / 2} y={34} small fill="#877150">{title}</Label><path d={`M24 49H${width - 24}`} stroke="#e5d9be" /></>}{children}</g>;
}

/** Large illustrated figures, with faces, cloth folds and hands; never the old stick-person artwork. */
function Person({ x, y, scale = 1, pose = 'stand', coat = '#819890', adult = false, elder = false, face = 'calm', cap = false, mirror = false }: {
  x: number; y: number; scale?: number; pose?: 'stand' | 'read' | 'raise' | 'explain' | 'carry' | 'run' | 'stone' | 'strike' | 'care'; coat?: string;
  adult?: boolean; elder?: boolean; face?: 'calm' | 'question' | 'worried' | 'smile'; cap?: boolean; mirror?: boolean;
}) {
  const legs = pose === 'run';
  const raised = pose === 'raise' || pose === 'stone';
  return <g transform={`translate(${x} ${y}) scale(${mirror ? -scale : scale} ${scale})`} className="css-person">
    <ellipse cx="0" cy="4" rx="49" ry="9" fill="#725c3e" opacity=".12" />
    <g fill="#646e68" stroke="#4e554e" strokeWidth="1.6"><path d={legs ? 'M-27-79-39-40-67-13-55-5-17-27 17-77Z' : 'M-29-79-28-9-6-9 1-73Z'} /><path d={legs ? 'M4-77 25-43 62-7 76-17 43-66 27-82Z' : 'M0-74 10-8H33L28-82Z'} /></g>
    <path d={legs ? 'm-72-15 26 8-2 11-33-4q-10-6 9-15m135-3 18-2 12 9-12 9-23-12Z' : 'M-30-13h26v13h-38q-4-8 12-13M10-12h24q18 4 15 12H10Z'} fill="#463f38" />
    <path d="M-31-149Q-52-119-39-74 0-59 39-74 49-112 30-149Z" fill={coat} stroke="#65726a" strokeWidth="2" />
    <path d="M-30-145 0-131 29-145M0-130V-78m-21-19 12 3m18-6 18 5" fill="none" stroke="#f0efe0" strokeOpacity=".5" strokeWidth="2" />
    <path d="m-28-141 18-6 10 16-14 10Zm57 0-17-6-12 16 14 10Z" fill="#dde2cf" />
    <g stroke={coat} strokeWidth="20" strokeLinecap="round" fill="none"><path d={pose === 'strike' ? 'M-30-138 24-145 81-140' : raised ? 'M-30-138-53-161-57-201' : pose === 'explain' ? 'M-30-136-60-116-86-143' : pose === 'read' ? 'M-29-137-45-110-17-101' : pose === 'carry' || pose === 'care' ? 'M-31-139-54-107-79-109' : 'M-30-135-49-101-45-83'} /><path d={pose === 'strike' ? 'M29-136 67-115 110-138' : pose === 'stone' ? 'M29-136 48-171 28-192' : pose === 'read' ? 'M29-137 46-111 18-99' : pose === 'explain' || pose === 'care' ? 'M31-138 56-109 80-118' : pose === 'carry' ? 'M30-137 52-107 79-109' : 'M30-134 48-103 48-84'} /></g>
    <g fill="#e9bd91" stroke="#ba9274" strokeWidth="1.2"><ellipse cx={pose === 'strike' ? 84 : raised ? -57 : pose === 'explain' ? -87 : pose === 'read' ? -15 : pose === 'carry' || pose === 'care' ? -81 : -45} cy={pose === 'strike' ? -140 : raised ? -207 : pose === 'explain' ? -145 : pose === 'read' ? -101 : pose === 'carry' || pose === 'care' ? -109 : -78} rx="8" ry="10" /><ellipse cx={pose === 'strike' ? 111 : pose === 'stone' ? 25 : pose === 'read' ? 16 : pose === 'explain' || pose === 'care' ? 83 : pose === 'carry' ? 82 : 48} cy={pose === 'strike' ? -140 : pose === 'stone' ? -198 : pose === 'read' ? -101 : pose === 'explain' || pose === 'care' ? -120 : pose === 'carry' ? -109 : -79} rx="8" ry="10" /></g>
    <path d="M-10-150v-18H11v19" fill="#e0af84" />
    <ellipse cy="-190" rx={adult ? 29 : 31} ry="35" fill="#e9bf94" stroke="#b68d70" strokeWidth="1.8" />
    <ellipse cx="-29" cy="-190" rx="5" ry="9" fill="#e4b98f" /><ellipse cx="29" cy="-190" rx="5" ry="9" fill="#e4b98f" />
    <path d={elder ? 'M-29-190q-14-41 12-46 40-14 48 22l-3 28-9-26q-23 8-35-7l-10 29Z' : 'M-30-185q-11-47 20-51 43-12 44 35l-6 20-9-32q-15 14-36 9Z'} fill={elder ? '#a1a291' : '#4c4034'} />
    {cap && <><path d="M-33-213q4-32 36-25 29 2 32 26Z" fill="#8d9b80" stroke="#57674e" strokeWidth="2" /><path d="M-36-213q35-9 75 0l-12 9h-60Z" fill="#7a8e6d" /><path d="m0-231 3 6 7 1-5 4 1 6-6-3-6 3 1-6-5-4 7-1Z" fill="#b66047" /></>}
    <path d="m-17-195 8-1m16 0 9 1" stroke="#695341" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="-12" cy="-190" rx="2.5" ry="3" fill="#3d3a32" /><ellipse cx="12" cy="-190" rx="2.5" ry="3" fill="#3d3a32" />
    <path d="m0-190-3 11 5 1" fill="none" stroke="#bf926c" strokeWidth="1.5" />
    <path d={face === 'worried' ? 'm-8-167q8-6 16 0' : face === 'question' ? 'm-5-169q5-5 10 0' : 'm-8-173q8 9 16 0'} fill="none" stroke="#886147" strokeWidth="1.7" strokeLinecap="round" />
    {elder && <><path d="m-18-178 4 3m28-3-4 3" stroke="#a08061" /><path d="M-13-162q13 25 26 0" fill="#c5c4af" /></>}
    {pose === 'read' && <Book x={0} y={-101} scale={.44} />}
    {pose === 'stone' && <path data-scene-object="stone" d="m-65-209 35-19 40 17-14 26-52-2Z" fill="#8b9388" stroke="#647266" strokeWidth="2" />}
    {pose === 'strike' && <path data-scene-object="stone" d="m81-157 28-16 30 20-14 24-34-4Z" fill="#8b9388" stroke="#647266" strokeWidth="2" />}
  </g>;
}
function Book({ x, y, scale = 1, maths = false, blank = false }: { x: number; y: number; scale?: number; maths?: boolean; blank?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={maths ? 'arithmetic-book' : 'open-book'}><path d="M-99-37Q-40-57 0-28q47-29 99-10V48Q49 29 0 54-47 24-99 45Z" fill="#dfcca2" stroke="#b29566" strokeWidth="3" /><path d="M-90-43Q-41-61 0-32q48-28 89-12V35Q40 24 0 45-46 21-90 35Z" fill="#fff8de" stroke="#d3bd8b" strokeWidth="2" /><path d="M0-32V43" stroke="#ad9b78" strokeWidth="2" />{!blank && <g stroke="#b7aa86" strokeWidth="2.3" strokeLinecap="round">{[-19,-4,11].map(y0 => <path key={y0} d={`M-73 ${y0}q27-8 58 0m30 0q30-8 59-1`} />)}</g>}{maths && <><Label x={-46} y={14} fill="#756341">＋</Label><Label x={46} y={14} fill="#756341">？</Label></>}</g>;
}
function Leaf({ x, y, scale = 1, angle = 0, colour = '#73975c' }: { x: number; y: number; scale?: number; angle?: number; colour?: string }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}><path d="M0 0Q-47-52-5-86 26-63 0 0Z" fill={colour} stroke="#557648" strokeWidth="1.5" /><path d="M0-2-5-72m2 28-16-11m18 22 15-16" stroke="#b2c08b" strokeWidth="1.5" fill="none" /></g>;
}
function Flower({ x, y, scale = 1, colour = '#dbaf55', open = 1, imagination = false, stretched = false }: {
  x: number; y: number; scale?: number; colour?: string; open?: number; imagination?: boolean; stretched?: boolean;
}) {
  const amount = clamp(open);
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={imagination ? 'flower-child' : 'real-flower'} className={stretched ? 'css-flower-sway' : undefined}>
    <ellipse cy="9" rx="46" ry="9" fill="#56734c" opacity=".1" /><path d="M0 0Q-8-61 0-117" stroke="#6c8752" strokeWidth="7" fill="none" /><Leaf x={-2} y={-25} angle={-46} scale={.55} /><Leaf x={0} y={-51} angle={51} scale={.49} />
    <g transform="translate(0 -130)" stroke="#b38642" strokeWidth="1.1">{[0,60,120,180,240,300].map((angle, i) => <ellipse key={angle} cx="0" cy={-16 - amount * 8} rx={10 + amount * 7} ry={17 + amount * 16} transform={`rotate(${angle * amount})`} fill={i % 2 ? colour : colour} style={{ transition: 'rx .6s, ry .6s, cy .6s, transform .6s' }} />)}<circle r={12 + amount * 4} fill="#f2d58c" /><circle r="8" fill="#c79a43" opacity=".35" />{imagination && <><circle cx="-6" cy="-3" r="2" fill="#55472e" /><circle cx="6" cy="-3" r="2" fill="#55472e" /><path d="m-5 5q5 6 10 0" stroke="#6b542e" fill="none" /></>}</g>
    {imagination && <><path d={stretched ? 'M-4-91-49-144-61-182M4-92 47-143 64-182' : 'M-4-81-49-106M5-85 51-110'} fill="none" stroke="#759257" strokeWidth="6" strokeLinecap="round" /><circle cx={stretched ? -61 : -49} cy={stretched ? -182 : -106} r="6" fill="#a1b375" /><circle cx={stretched ? 64 : 51} cy={stretched ? -182 : -110} r="6" fill="#a1b375" /><path d="m-4-3-24 18m31-18 24 17" stroke="#628548" strokeWidth="5" strokeLinecap="round" /></>}
  </g>;
}
function Cricket({ x, y, red = false, scale = 1, raised = false }: { x: number; y: number; red?: boolean; scale?: number; raised?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={red ? 'red-cricket' : 'green-cricket'}><ellipse cy="16" rx="47" ry="8" fill="#4e613c" opacity=".1" /><path d="M-40 1q19-31 51-13L36 7q-35 25-76-6Z" fill={red ? '#b57957' : '#709456'} stroke="#4e643f" strokeWidth="2" /><path d="M-27-3q32-15 48 4m-49-1 25 12" stroke={red ? '#d9a47a' : '#b9cb87'} strokeWidth="2" fill="none" /><circle cx="33" cy="-8" r="17" fill={red ? '#b98b63' : '#93ac6a'} stroke="#55694b" strokeWidth="2" /><circle cx="38" cy="-12" r="4" fill="#313c2a" /><path d="M36-24q-6-32 14-45m-10 47q17-29 35-27" fill="none" stroke="#657849" strokeWidth="2" /><g stroke="#63754b" strokeWidth="4" fill="none" strokeLinecap="round"><path d="M-18 6-44-21-72 19m68-12-4 20 19 0m11-21 18 17 18-2" />{raised && <path d="M31 7 63-4 76-25" />}</g></g>;
}
function Turtle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="taotao-turtle"><ellipse cy="25" rx="88" ry="12" fill="#546848" opacity=".12" /><g stroke="#566d4a" strokeWidth="3" fill="#8da66f"><path d="m-55 9-21 20 26 5 18-19m35-3 24 20 20-8-15-16" /><ellipse cx="73" cy="-4" rx="31" ry="23" /><path d="m-67 2-24 11 23 7" /></g><path d="M-62 8q-10-88 56-89Q51-81 64 8 8 38-62 8Z" fill="#809669" stroke="#4e6b45" strokeWidth="4" /><path d="M-24-69 13-70 39-43 26-9-11-9-34-38Zm-10 31-26 8m49 22-13 30m37-30 24 25m-11-60 20-3" fill="none" stroke="#bdc48b" strokeWidth="3" /><path d="m64-15 18-3" stroke="#62754e" strokeWidth="3" /><circle cx="80" cy="-9" r="3.5" fill="#364b34" /><path d="m79 6 11-1" stroke="#647549" strokeWidth="2" /></g>;
}
function Dog({ x, y, scale = 1, calling = false }: { x: number; y: number; scale?: number; calling?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="learning-dog"><ellipse cy="25" rx="110" ry="13" fill="#806139" opacity=".1" /><path d="M-76-62Q-125-107-129-69-117-28-70-36" fill="#b98150" stroke="#895933" strokeWidth="3" /><path d="M-82-56q48-47 108-11l10 41-73 18-38-11Z" fill="#c89561" stroke="#8d623b" strokeWidth="3" /><path d="M-64-21-63 21h22l8-44m44-9L24 22h23l-1-51" fill="#cda06b" stroke="#89613f" strokeWidth="3" /><path d="M-48-73q28-24 55 1" stroke="#e4bd89" strokeWidth="14" fill="none" /><path d="M0-55q-12-73 42-88 58-5 62 52 1 49-53 63Z" fill="#d9ae77" stroke="#976b43" strokeWidth="3" /><path d="M16-138q-48-11-30 63 12 12 29-3l10-41Z" fill="#a77747" stroke="#87613a" strokeWidth="3" /><ellipse cx="83" cy="-70" rx="34" ry="25" fill="#ead0a0" /><path d="M107-86q18-2 13 12l-15 3Z" fill="#4c4537" /><circle cx="64" cy="-105" r="5" fill="#443b2e" /><circle cx="65" cy="-107" r="1.5" fill="#fff8e7" /><path d="M55-120q13-7 21-1" stroke="#97754c" strokeWidth="3" fill="none" />{calling ? <ellipse cx="93" cy="-58" rx="9" ry="8" fill="#79503b" className="css-voice-mouth" /> : <path d="m80-52q15 5 21-5" fill="none" stroke="#976848" strokeWidth="2.5" />}</g>;
}
function Gourd({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="imagined-gourd"><path d="M-7-124q-17 17-8 39-48 14-47 60-2 49 62 48 64-1 59-46-4-38-43-61 14-28-9-41Z" fill="#d2aa54" stroke="#a48236" strokeWidth="3" /><path d="m-4-123 5-27q3-12 16-12" fill="none" stroke="#688548" strokeWidth="5" /><path d="M-40-33q-4 33 31 41m1-108 8-11" fill="none" stroke="#f4d58a" strokeWidth="5" strokeLinecap="round" /><path d="m-35-68 53 6" stroke="#91a065" strokeWidth="5" /></g>;
}
function Ant({ x, y, scale = 1, small = false, raised = false }: { x: number; y: number; scale?: number; small?: boolean; raised?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={small ? 'smallest-ant' : 'ant-captain'}><ellipse cy="22" rx="63" ry="8" fill="#796246" opacity=".09" /><ellipse cx="-38" cy="-3" rx="27" ry="19" fill="#8f6b48" stroke="#604f39" strokeWidth="2" /><ellipse cx="-4" cy="-9" rx="19" ry="16" fill="#a27b51" stroke="#604f39" strokeWidth="2" /><circle cx="30" cy="-27" r="23" fill="#b59165" stroke="#66573e" strokeWidth="2" /><circle cx="39" cy="-32" r="4" fill="#463b2d" /><path d="M24-47q-4-26 8-29m-2 30q18-29 31-19m-24 46 13 1" stroke="#66573e" strokeWidth="2.5" strokeLinecap="round" fill="none" /><g stroke="#6c573d" strokeWidth="3.5" strokeLinecap="round" fill="none"><path d="m-40 11-20 13-13-2m41-9-1 21 18 1m13-29 9 22 17-1m-10-21 14 10 16 0" />{raised && <path d="M24-8 53-19 58-44" />}</g></g>;
}
function Cheese({ x, y, scale = 1, crumb = false }: { x: number; y: number; scale?: number; crumb?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={crumb ? 'cheese-crumb' : 'cheese-block'}><path d="M-63-25 28-57 80-15 66 33-67 17Z" fill="#edd187" stroke="#c8a351" strokeWidth="3" /><path d="m-64-25 126 11 18-1-52-42Z" fill="#f6e1a0" /><path d="M62-14v46M-60-22 62-14" stroke="#d5b35c" strokeWidth="2" />{[-33,12,43].map((x0, i) => <ellipse key={x0} cx={x0} cy={i === 1 ? 7 : -1} rx={7 + i * 2} ry="6" fill="#cdab61" />)}</g>;
}
function Bowl({ x, y, scale = 1, food = 'empty', old = false }: { x: number; y: number; scale?: number; food?: 'empty' | 'rice' | 'porridge' | 'vegetables'; old?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object={old ? 'old-utensil' : food === 'rice' ? 'rough-bowl-with-rice' : food === 'porridge' ? 'wild-greens-porridge' : food === 'vegetables' ? 'seventh-squad-dish-bowl' : 'new-rough-porcelain-bowl'}><ellipse cy="53" rx="90" ry="11" fill="#6c634d" opacity=".13" /><path d="M-94-13Q-74 57 0 61 79 61 96-12Z" fill={old ? '#96764f' : '#a7afa2'} stroke={old ? '#715434' : '#728273'} strokeWidth="3" /><ellipse cy="-13" rx="94" ry="27" fill={old ? '#bd9869' : '#dbe0cb'} stroke={old ? '#8e6941' : '#8d9e8a'} strokeWidth="3" /><ellipse cy="-13" rx="79" ry="18" fill={food === 'porridge' ? '#a9b981' : '#b4c2a7'} />{food === 'rice' && <g fill="#fff8df" stroke="#ede0b9" strokeWidth="1">{Array.from({length:24}, (_, i) => <ellipse key={i} cx={-60 + (i * 29) % 127} cy={-20 + (i * 13) % 25} rx="11" ry="4" transform={`rotate(${i * 31} ${-60 + (i * 29) % 127} ${-20 + (i * 13) % 25})`} />)}</g>}{(food === 'porridge' || food === 'vegetables') && <g>{[-51,-22,6,37,58].map((x0,i) => <g key={x0} transform={`translate(${x0} ${-18+i%2*13}) rotate(${i*37})`}><path d="M-13 1Q-12-17 4-13 18-7 9 7Z" fill={i%2 ? '#648950' : '#86a963'} /><path d="m-9-2 18 5" stroke="#c1cf91" strokeWidth="2" /></g>)}</g>}<path d="M-78 1q17 38 52 45m54 4 20-4" fill="none" stroke="#e7ead7" strokeWidth="3" strokeLinecap="round" /><path d="m-65 21 10 8m94 0 14-9" stroke="#8c9a82" strokeWidth="2" /><path d="M-34 61H34" stroke="#6c7c6c" strokeWidth="5" /></g>;
}

function FlowersScene({ sceneKey, parameter }: { sceneKey: string; parameter?: number }) {
  const opening = ['opening','holiday'].includes(sceneKey);
  const sway = ['sway','arms'].includes(sceneKey);
  const school = sceneKey === 'school';
  const open = parameter === undefined ? opening || sway ? 1 : .86 : clamp(parameter);
  return <>
    <Panel x={35} y={100} width={386} height={398} title="看得见的自然" tint="#edf1df"><path d="M1 314Q141 246 384 290V374Q382 398 359 398H27Q1 398 1 374Z" fill="#dce6c3" /><g className={opening ? 'css-rain-drops' : undefined} stroke="#a8c4ba" strokeWidth="3" opacity=".8">{[60,128,210,292,349].map((x,i)=><path key={x} d={`m${x} ${65+i%2*27}-8 18`} />)}</g>{[110,211,310].map((x,i)=><Flower key={x} x={x} y={329-i%2*17} scale={.97} colour={['#b98baf','#e4bd58','#df9a87'][i]} open={open} stretched={sway} />)}<Label x={193} y={375} small>{sway ? '花枝伸展、随风摆动' : opening ? '雨后，花瓣向外展开' : '花瓣的颜色各不相同'}</Label></Panel>
    <Arrow x={433} y={281} length={32} colour="#cba45c" />
    <Panel x={478} y={100} width={387} height={398} title="作者想到的花孩子" tint="#fff0dc">{school && <g data-scene-object="imagined-underground-school"><path d="M32 271V106Q191 68 351 107V271Z" fill="#e1cba0" stroke="#a18a60" strokeWidth="2" /><path d="M39 153H348m-311 37h312" stroke="#b89b68" strokeWidth="3" /><Book x={195} y={275} scale={.62} /></g>}{[105,211,311].map((x,i)=><Flower key={x} x={x} y={329-i%2*17} scale={.93} colour={['#b98baf','#e4bd58','#df9a87'][i]} open={open} imagination stretched={sway} />)}{opening && <g data-scene-object="flower-school-door"><rect x="21" y="112" width="43" height="149" rx="20" fill="#c9ac79" /><path d="M64 261H350" stroke="#dec497" strokeWidth="5" /><Arrow x={65} y={280} length={77} dashed /></g>}<Label x={193} y={375} small>{sway ? '伸出双手、跳起舞来' : opening ? '放假了，从学校走出来' : school ? '地下学校是文学想象' : '穿着不同颜色的衣裳'}</Label></Panel>
    <Tag x={449} y={544} width={516}>同一处特点，一边是自然，一边是想象</Tag>
  </>;
}

function QuestionScene({ sceneKey }: { sceneKey: string }) {
  const asking = sceneKey === 'ask'; const understood = sceneKey === 'understand'; const reciting = sceneKey === 'recite';
  return <>
    <g data-scene-object="old-classroom"><rect x="61" y="108" width="775" height="327" rx="27" fill="#e8dcc1" stroke="#c9b692" strokeWidth="2" /><rect x="105" y="139" width="151" height="181" rx="5" fill="#afc7ad" stroke="#8a8869" strokeWidth="9" /><path d="M155 144V315m53-173v173m-99-90h142" stroke="#ede4c5" strokeWidth="5" /><path d="M706 125V343m-51-171h91" stroke="#b6a686" strokeWidth="2" /><path d="M70 435H830" stroke="#c1ac85" strokeWidth="5" /><path d="M104 409H502v20H104m22 20v65m345-65v65" fill="#af8c62" stroke="#8e7252" strokeWidth="2" /></g>
    <Person x={300} y={450} scale={1.13} pose={asking ? 'raise' : 'read'} coat="#9a7966" face={understood ? 'smile' : 'question'} />
    <Person x={642} y={446} scale={1.2} adult elder pose={understood ? 'explain' : 'stand'} coat="#6f8580" />
    <Book x={305} y={397} scale={.71} />
    {asking ? <g data-scene-object="question-about-meaning"><path d="M348 201q48-42 154-13 26 26 7 68-36 30-111 16l-29 26 8-35q-43-15-29-62Z" fill="#fff8df" stroke="#d1b57b" strokeWidth="2" /><Label x={429} y={235}>是什么意思？</Label></g> : understood ? <g data-scene-object="teacher-explaining"><Arrow x={543} y={267} length={128} angle={172} /><Spark x={402} y={224} /><Tag x={452} y={195} width={241}>先生讲解，大家认真听</Tag></g> : <g data-scene-object={reciting ? 'reciting-known-text' : 'memorised-without-understanding'}><Tag x={471} y={212} width={228}>{reciting ? '能背出功课' : '会背，意思还不懂'}</Tag><Label x={479} y={266} fill="#bd9461">{reciting ? '背书 ≠ 讲清意思' : '？'}</Label></g>}
    <Ground /><Tag x={449} y={544} width={535}>{asking ? '提出具体疑问，才知道需要解释哪里' : understood ? '同一本书：声音记住了，意思也要弄懂' : '观察他的疑问，而不是只看是否背得流利'}</Tag>
  </>;
}

function TurtleScene({ sceneKey }: { sceneKey: string }) {
  sceneKey = sceneKey.replace(/--revealed$/, '');
  const spider = sceneKey === 'spider-warning'; const snail = sceneKey === 'snail-direction'; const gecko = sceneKey === 'cancelled-wedding';
  return <>
    <g data-scene-object="travel-path"><path d="M43 499Q134 300 355 387T772 254" fill="none" stroke="#dbc69c" strokeWidth="72" strokeLinecap="round" /><path d="M48 499Q150 307 356 387T772 254" fill="none" stroke="#efe2bd" strokeWidth="44" strokeLinecap="round" />{[89,731,825].map((x,i)=><g key={x}><Leaf x={x} y={480-i*90} angle={i%2 ? 33 : -27} scale={1.16} /><Leaf x={x+22} y={462-i*90} angle={-33} scale={.83} /></g>)}</g>
    <Turtle x={322} y={428} scale={1.29} />
    {spider && <g transform="translate(653 334)" data-scene-object="spider-warning"><path d="M0-162V-50" stroke="#c3bea3" strokeWidth="2" /><g fill="#796749" stroke="#5e513e" strokeWidth="4" strokeLinecap="round"><ellipse cy="-26" rx="25" ry="36" /><circle cy="19" r="17" /><path d="m-20-36-41-34-11-27m49 75-54-10-17-19m74 61-56 19-20 23m66-24-23 47m74-111 41-34 11-27m-49 75 54-10 17-19m-74 61 56 19 20 23m-66-24 23 47" fill="none" /></g><circle cx="-5" cy="16" r="3" fill="#f8eccd" /><circle cx="5" cy="16" r="3" fill="#f8eccd" /><Tag x={0} y={113} width={218}>劝阻：怕你赶不上</Tag></g>}
    {snail && <g transform="translate(660 373)" data-scene-object="snail-direction"><path d="M-78 59Q-54 1 40 24l54 20-3 16Z" fill="#bca77c" stroke="#927b51" strokeWidth="3" /><circle cx="-9" cy="9" r="54" fill="#cbb084" stroke="#9a794a" strokeWidth="3" /><path d="M-8-31q45 4 28 37-8 21-33 7-9-11 7-18" stroke="#99764c" strokeWidth="4" fill="none" /><path d="M64 42 75-17m1 60 27-47" stroke="#927b51" strokeWidth="4" strokeLinecap="round" /><circle cx="75" cy="-18" r="5" fill="#665d41" /><circle cx="103" cy="-5" r="5" fill="#665d41" /><Arrow x={-128} y={-90} angle={-31} length={98} colour="#628559" /><Tag x={-2} y={113} width={206}>提醒：方向要调整</Tag></g>}
    {gecko && <g transform="translate(662 379)" data-scene-object="gecko-new-message"><path d="M-25-7Q-77 20-112-5-99 36-28 31L36 13q45 8 47-13 2-28-29-28Z" fill="#91a574" stroke="#677d4d" strokeWidth="3" /><path d="m-10 3-32-37-21 7m63 41-26 39-25-6M32 4 40-42 63-49m-38 60 43 31 24-9" fill="none" stroke="#758a58" strokeWidth="9" strokeLinecap="round" /><circle cx="66" cy="-14" r="4" fill="#455337" /><Tag x={-2} y={113} width={217}>新消息：婚礼取消了</Tag></g>}
    {!spider && !snail && !gecko && <g data-scene-object="journey-goal"><rect x="643" y="143" width="17" height="149" rx="5" fill="#aa9062" /><path d="M613 149H778l26 29-26 29H613Z" fill="#f0dcaa" stroke="#b59a61" strokeWidth="2" /><Label x={698} y={185} small>带着目标上路</Label></g>}
    <Tag x={449} y={544} width={550}>{spider ? '劝阻不等于方向错误：先听清消息的依据' : snail ? '目标还在，路线可以因有用提醒而调整' : gecko ? '后续留给阅读与续编，画面不补原著结局' : '这里只呈现当前读到的旅途'}</Tag>
  </>;
}

function DogScene({ sceneKey }: { sceneKey: string }) {
  const revealed = sceneKey.endsWith('--revealed');
  sceneKey = sceneKey.replace(/--revealed$/, '');
  const rooster = sceneKey === 'learning-rooster' || (sceneKey === 'learn-call' && revealed); const bird = sceneKey === 'learning-bird'; const gate = sceneKey === 'ending-gate';
  return <>
    <path d="M55 487Q223 444 450 474T843 449" stroke="#e6cf9c" strokeWidth="47" fill="none" strokeLinecap="round" /><Ground y={479} />
    <Dog x={343} y={444} scale={1.34} calling={rooster || bird} />
    {!rooster && !bird && !gate && <g data-scene-object="wish-to-learn-call"><path d="M448 129q92-20 155 32 21 37-9 68-30 24-107 4l-37 27 5-37q-34-38-7-94Z" fill="#fff7df" stroke="#cdb585" strokeWidth="2" /><Label x={524} y={179}>想学会叫</Label><path d="M488 205h66" stroke="#cba86f" strokeWidth="2" /><circle cx="517" cy="244" r="5" fill="#d8c497" /></g>}
    {rooster && <g transform="translate(660 376)" data-scene-object="rooster-teaching-call"><path d="M-27 35Q-97-6-75-62-57-46-38-47-39-105-1-98 37-94 33-56 58-48 48-17 27 26-27 35Z" fill="#c79555" stroke="#926835" strokeWidth="3" /><path d="M-43 14q-91-43-85-86 17-33 33 3 7-68 26-45 20 19 6 63" fill="#5f8170" stroke="#46675a" strokeWidth="3" /><path d="M5-88q-18-42 6-40 13-14 20 5 26-1 18 25Z" fill="#bd6950" /><path d="m28-75 34 13-29 11Z" fill="#dab762" /><circle cx="22" cy="-74" r="4" fill="#413b2d" /><path d="m-20 31-5 44-25 3m62-53 10 48 23 1" stroke="#9d7947" strokeWidth="5" fill="none" /><g stroke="#b59655" strokeWidth="3" fill="none" className="css-voice-waves"><path d="M77-88q17 23 0 46m14-59q28 36 0 73" /></g><Tag x={-3} y={119} width={208}>先听，再试着学</Tag></g>}
    {bird && <g data-scene-object="bird-teaching-call"><path d="M599 141q90-31 146 31m-100-32 34-44" stroke="#96754b" strokeWidth="12" fill="none" strokeLinecap="round" /><g transform="translate(658 226)"><ellipse rx="49" ry="33" fill="#82978b" stroke="#5c7065" strokeWidth="3" /><path d="M-26 8-70 39-72 9Z" fill="#687b71" /><path d="M-9-9q36-9 31 35-24-3-31-35Z" fill="#b0bd9f" /><circle cx="43" cy="-23" r="25" fill="#91a796" stroke="#637a68" strokeWidth="3" /><path d="m63-29 26 13-27 9Z" fill="#c9985a" /><circle cx="47" cy="-30" r="4" fill="#3b4738" /><path d="m0 32 3 15m22-18 10 18" stroke="#8e734e" strokeWidth="4" /></g><Tag x={654} y={410} width={212}>另一次学叫经历</Tag></g>}
    {gate && <g data-scene-object={revealed ? 'revealed-ending-entrances' : 'unrevealed-ending-paths'}><path d="M585 411q39-110 163-139m-160 146q50-42 165-38m-163 44q87 17 161 62" fill="none" stroke="#c8b389" strokeWidth="8" strokeDasharray="9 12" strokeLinecap="round" />{[[751,228],[757,349],[755,468]].map(([x,y],i)=><g key={x+y}><circle cx={x} cy={y} r="34" fill="#fffae9" stroke="#c6aa72" strokeWidth="2" />{revealed ? <g data-scene-object={['cow-ending-entrance','farmer-ending-entrance','dog-call-ending-entrance'][i]}>{i===0 ? <CowMouth x={x} y={y+9} scale={.34} /> : i===1 ? <><circle cx={x} cy={y-2} r="16" fill="#dcba8f" /><path d={`M${x-22} ${y-13}q22-29 44 0Z`} fill="#c5ac76" /><path d={`M${x-29} ${y-10}h58`} stroke="#9f8153" strokeWidth="4" /></> : <g stroke="#7a956d" strokeWidth="3" fill="none"><path d={`M${x-15} ${y-10}v20m12-29v37m12-29v20m12-11v4`} /></g>}<Label x={x} y={y+65} small>{['小母牛','农民','汪汪声'][i]}</Label></g> : <><Label x={x} y={y+8}>？</Label><Label x={x} y={y+65} small>{`入口 ${i+1}`}</Label></>}</g>)}</g>}
    <Tag x={449} y={544} width={626}>{gate ? revealed ? '这里只显示三个阅读入口，不补写未核的完整结局' : '结局尚未打开：保留可能，不提前画出新来者' : rooster || bird ? '把“听见什么、怎样练习”联系起来说' : '这里只看小狗的困难与愿望，后面的人物先不出现'}</Tag>
  </>;
}

function GrandmotherStoryteller({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} data-scene-object="grandmother-storyteller">
    <ellipse cy="5" rx="48" ry="8" fill="#725c3e" opacity=".12" />
    <path d="M-31-18h20v18h-29q-6-8 9-18M10-18h21q15 5 13 18H10Z" fill="#514740" />
    <path d="M-31-92Q-45-47-36-14H38Q40-54 29-94Z" fill="#625970" stroke="#514959" strokeWidth="2" />
    <path d="M-23-75-27-25m25-51v55m22-54 8 51" stroke="#8d7a92" strokeWidth="2" fill="none" />
    <path d="M-28-147Q-49-132-39-76 0-60 38-78 43-121 26-146Z" fill="#96717a" stroke="#78565e" strokeWidth="2" />
    <path d="M-7-145-13-126 0-116 14-128 8-145Z" fill="#efe3cd" />
    <path d="M0-115v40m-28-10 15 3m26-4 16-3" stroke="#bd939b" strokeWidth="2" fill="none" />
    {[-106,-91,-78].map(y0 => <circle key={y0} cx="1" cy={y0} r="2.2" fill="#e4c7ac" />)}
    <path d="M-29-132-48-113-52-91M28-133 50-114 72-132" fill="none" stroke="#96717a" strokeWidth="20" strokeLinecap="round" />
    <g fill="#e1b88d" stroke="#b89071" strokeWidth="1.2"><ellipse cx="-53" cy="-86" rx="8" ry="10" /><path d="M66-140q-2-14 3-14 4 0 3 11 8-13 11-10 4 3-5 15 14-6 15-1 0 4-17 11-10 4-10-12Z" /></g>
    <path d="M-10-146v-17h20v17" fill="#d5a77f" />
    <g data-scene-object="gray-hair-bun"><circle cx="-15" cy="-236" r="16" fill="#aba99b" stroke="#7b7d74" strokeWidth="2" /><path d="M-25-243q14-11 23 0m-21 7q12-7 21 0" fill="none" stroke="#d7d5c6" strokeWidth="2" /></g>
    <ellipse cy="-192" rx="29" ry="35" fill="#e4bc94" stroke="#b18a6b" strokeWidth="1.8" />
    <ellipse cx="-29" cy="-191" rx="5" ry="8" fill="#dfb68e" /><ellipse cx="29" cy="-191" rx="5" ry="8" fill="#dfb68e" />
    <path d="M-29-190q-11-39 9-46 35-15 50 18l-1 30-9-24q-12-1-20-14-6 13-20 15Z" fill="#aba99b" stroke="#85877d" strokeWidth="1.5" />
    <path d="m-24-216 9-11m20 0 13 13" stroke="#dddaca" strokeWidth="2" strokeLinecap="round" />
    <g data-scene-object="grandmother-spectacles" fill="none" stroke="#726355" strokeWidth="1.5"><ellipse cx="-12" cy="-190" rx="10" ry="8" /><ellipse cx="12" cy="-190" rx="10" ry="8" /><path d="M-2-191h4m-24-2-6-2m50 2 6-2" /></g>
    <circle cx="-12" cy="-191" r="2" fill="#544435" /><circle cx="12" cy="-191" r="2" fill="#544435" />
    <path d="m0-189-3 11 5 1m-11 6q9 8 18 0m-32-6 5 3m27-3-5 3m-24-21-5-1m31 0 5-1" fill="none" stroke="#a07a5b" strokeWidth="1.5" strokeLinecap="round" />
  </g>;
}

function PoorlyGrowingSunflower() {
  return <g data-scene-object="poorly-growing-sunflower">
    <path d="M235 290h125l-17 57h-91Z" fill="#b98761" stroke="#956644" strokeWidth="3" />
    <ellipse cx="298" cy="290" rx="61" ry="12" fill="#977151" stroke="#c79771" strokeWidth="3" />
    <path data-scene-object="weak-bent-sunflower-stem" d="M297 289C291 252 285 214 297 184 310 150 342 177 332 223" stroke="#879064" strokeWidth="3.5" fill="none" />
    <g data-scene-object="drooping-sunflower-leaves" fill="#909768" stroke="#727d55" strokeWidth="1.5"><path d="M291 234q-35-18-44 13-1 18 8 30 3-28 36-43Z" /><path d="M295 264q31-13 45 11 5 17-1 28-6-28-44-39Z" /><path d="M295 210q-15-8-27 7-10 13-7 28 12-23 34-35Z" /><path d="M289 238q-24 4-34 26m43 1q31 8 38 26" fill="none" stroke="#b8b88a" /></g>
    <g data-scene-object="drooping-sunflower-head" transform="translate(328 232) rotate(13)" stroke="#ab8846" strokeWidth="1.2">
      <path d="M-23-4q-18 14-13 30 14-3 19-23M-15 4q-8 29 3 36 9-12 10-31M-2 7q3 29 16 33 4-17-7-32M13 2q15 26 28 24-1-16-24-29M19-9q23 5 24 18-16 6-27-12" fill="#c5a15b" />
      <ellipse rx="23" ry="14" fill="#96794b" /><ellipse rx="16" ry="9" fill="#a98c59" />
      {[-11,0,11].map((x0,i) => <g key={x0} fill="#776440" stroke="none"><circle cx={x0} cy={i%2 ? 3 : -2} r="2" /><circle cx={x0-2} cy={i%2 ? -4 : 5} r="1.6" /></g>)}
    </g>
  </g>;
}

function GourdScene({ sceneKey }: { sceneKey: string }) {
  const math = sceneKey === 'math'; const sunflower = sceneKey === 'sunflower'; const grandma = sceneKey === 'grandma' || sceneKey === 'peach';
  return <>
    <Panel x={36} y={107} width={427} height={396} title={grandma || sceneKey === 'peach' ? '奶奶正在讲故事' : '王葆眼前的困难'}>
      {grandma ? <GrandmotherStoryteller x={135} y={324} /> : <Person x={135} y={324} scale={1.02} pose="read" coat="#849b92" face={math || sunflower ? 'question' : 'smile'} />}
      {grandma ? <g data-scene-object="child-listening-to-grandmother"><Person x={305} y={331} scale={.76} coat="#b49067" face="smile" mirror /></g> : math ? <Book x={301} y={231} scale={.87} maths /> : sunflower ? <PoorlyGrowingSunflower /> : <Gourd x={299} y={279} scale={.89} />}
      <Label x={211} y={376} small>{grandma ? '讲述 ≠ 事情已经发生' : math ? '算术书本里的问题' : sunflower ? '向日葵长得不理想' : '故事里的神奇本领'}</Label>
    </Panel>
    <g data-scene-object={grandma || sceneKey === 'peach' ? 'grandmother-story-imagination' : 'wangbao-wish-imagination'}><path d="M506 145Q594 81 752 134q107 35 99 154-10 129-158 141-76 9-139-40l-63 20 32-57q-55-106-17-207Z" fill="#fff3d5" fillOpacity=".97" stroke="#d3b26e" strokeWidth="2" strokeDasharray="7 10" /><Gourd x={686} y={294} scale={.85} /><Spark x={579} y={192} /><Spark x={789} y={314} scale={.66} />{sceneKey === 'peach' && <g data-scene-object="imagined-peach" transform="translate(790 231)"><path d="M0-15q-33-22-42 9-6 28 40 44 45-17 43-44-6-30-41-9Z" fill="#dfa093" stroke="#b87869" strokeWidth="2" /><Leaf x={3} y={-16} scale={.4} angle={49} /></g>}<Label x={685} y={374} small>{grandma || sceneKey === 'peach' ? '故事中的想象' : '希望困难一下子解决'}</Label></g>
    {!grandma && <Arrow x={438} y={274} length={81} dashed />}<Tag x={448} y={546} width={571}>虚线里是讲述或愿望，不是王葆已经得到宝葫芦</Tag>
  </>;
}

function CowMouth({ x, y, scale = 1 }: {x:number; y:number; scale?:number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="cow-mouth"><path d="M-44-22q-39-30-57-1l40 17m105-16q39-30 57-1L63-6" fill="#bea475" stroke="#8d7652" strokeWidth="3" /><path d="m-30-44-8-23m70 23 10-23" stroke="#c8bea0" strokeWidth="8" strokeLinecap="round" /><path d="M-48-37q48-32 95 0l6 70q-50 40-105 0Z" fill="#d8c69b" stroke="#a08c62" strokeWidth="3" /><ellipse cy="24" rx="52" ry="32" fill="#c7aa81" stroke="#947653" strokeWidth="2" /><ellipse cx="-23" cy="22" rx="7" ry="5" fill="#6f5c42" /><ellipse cx="23" cy="22" rx="7" ry="5" fill="#6f5c42" /><circle cx="-25" cy="-17" r="4" fill="#4e4936" /><circle cx="25" cy="-17" r="4" fill="#4e4936" /><path d="M-21 44q21 12 43 0" fill="none" stroke="#8e7050" strokeWidth="3" /></g>;
}
function CricketTravelScene({ sceneKey }: { sceneKey: string }) {
  const pathKeys = ['grass','mouth','first','second','mouth-again','outside'];
  const active = Math.max(0,pathKeys.indexOf(sceneKey));
  const locations = [[91,202],[245,202],[416,202],[590,202],[745,202],[745,393]];
  const [cx,cy] = locations[active];
  return <>
    <g data-scene-object="story-location-path"><path d="M90 202H742Q821 202 821 280V311Q821 393 741 393H569" stroke="#d4c49e" strokeWidth="10" fill="none" strokeLinecap="round" />{locations.map(([x,y],i)=><g key={pathKeys[i]} data-scene-object={`story-node-${pathKeys[i]}`}><circle cx={x} cy={y} r={active===i ? 52 : 44} fill={active===i ? '#fff0ce' : '#eee6ce'} stroke={active===i ?  '#b08541' : '#c3b490'} strokeWidth={active===i ? 3 : 1.5} />{i===0 ? <g data-scene-object="grass-at-hiding-place"><Leaf x={x-12} y={y+9} scale={.39} angle={-27} /><Leaf x={x+10} y={y+12} scale={.45} angle={21} /></g> : i===1 || i===4 ? <CowMouth x={x} y={y-2} scale={.46} /> : i===2 || i===3 ? <g data-scene-object={i===2 ? 'first-stomach-story-space' : 'second-stomach-story-space'}><path d={`M${x-26} ${y-19}q29-17 52 0v33q-27 18-52 0Z`} fill="#d7c9a7" stroke="#af956d" strokeWidth="2" /><Leaf x={x+3} y={y+13} scale={.33} angle={44} /><Label x={x-9} y={y+6} small>{i===2?'1':'2'}</Label></g> : <g data-scene-object="grass-outside-mouth"><Leaf x={x-12} y={y+17} scale={.36} angle={-21} /><Leaf x={x+10} y={y+17} scale={.35} angle={31} /></g>}<Label x={x} y={y+79} small>{['青草','牛嘴','第一个胃','第二个胃','返回牛嘴','牛嘴外'][i]}</Label></g>)}<Arrow x={283} y={202} length={49} /><Arrow x={454} y={202} length={48} /><Arrow x={631} y={202} length={39} /><Arrow x={821} y={274} angle={90} length={42} /></g>
    <g transform={`translate(${cx} ${cy-59})`} data-scene-object="current-red-cricket-location" data-scene-location={pathKeys[active]}><Cricket x={0} y={0} red scale={.59} /><Label x={0} y={-36} small fill="#995f45">红头在这里</Label></g>
    <Panel x={34} y={313} width={506} height={190} title={sceneKey === 'outside' ? '动作怎样产生结果' : '伙伴怎样帮助'} tint="#edf0df">
      <Cricket x={99} y={126} scale={.91} raised />
      <Label x={330} y={88} small>{sceneKey === 'outside' ? '青头在牛鼻孔里蹭动' : sceneKey === 'mouth-again' ? '回到嘴里，红头还不能动' : sceneKey === 'first' || sceneKey === 'second' ? '青头提醒、安慰红头' : '分清红头的位置与青头的帮助'}</Label>
      <Label x={330} y={124} small fill="#668152">{sceneKey === 'outside' ? '牛打喷嚏 → 红头随草出来' : sceneKey === 'mouth-again' ? '还需要伙伴采取行动' : sceneKey === 'first' || sceneKey === 'second' ? '位置在变，提醒也要跟上' : '先按课文寻找这一处'}</Label>
    </Panel>
    {sceneKey === 'outside' ? <g data-scene-object="sneeze-and-escape"><path d="M601 401q36 40 102 34" fill="none" stroke="#ac9670" strokeWidth="5" /><g stroke="#b5c9ab" strokeWidth="4"><path d="m739 357 47-33m-41 48 54-10m-50 26 45 20" /></g><Leaf x={651} y={466} scale={.53} angle={74} /><Spark x={791} y={432} scale={.55} /></g> : <g data-scene-object="carried-with-grass"><Leaf x={655} y={476} scale={.84} angle={60} /></g>}
    <Tag x={447} y={551} width={723}>课文情节节点示意：不是器官解剖图，不增加课文外的消化步骤</Tag>
  </>;
}

function AntScene({ sceneKey }: { sceneKey: string }) {
  const tempted = sceneKey === 'tempted'; const called = sceneKey === 'call-back'; const given = sceneKey === 'smallest';
  return <>
    <Ground /><Cheese x={214} y={246} scale={1.25} /><Tag x={210} y={142} width={148}>大家的奶酪</Tag>
    <Ant x={373} y={394} scale={1.45} raised={called} /><Cheese x={535} y={440} scale={.43} crumb />
    {tempted && <g data-scene-object="thought-not-action"><path d="M425 115q106-39 188 13 41 56-10 103-72 38-161 0l-36 35 12-47q-46-47 7-104Z" fill="#fff3d8" stroke="#d4b478" strokeWidth="2" strokeDasharray="7 9" /><Cheese x={512} y={175} scale={.45} crumb /><Label x={515} y={214} small>很想吃……</Label><path d="M461 385H519" stroke="#a99268" strokeWidth="2" strokeDasharray="4 6" /><Tag x={633} y={467} width={229}>奶酪渣还没有被吃掉</Tag></g>}
    {(called || given) && <g data-scene-object="partners-called-back"><Ant x={667} y={391} scale={.81} small /><Ant x={759} y={459} scale={1.03} /><Ant x={747} y={290} scale={1.09} />{given ? <><Cheese x={645} y={374} scale={.35} crumb /><Arrow x={565} y={409} length={49} angle={-24} /><Tag x={656} y={207} width={252}>公开分给最小的伙伴</Tag></> : <><g stroke="#b79556" strokeWidth="3" fill="none" className="css-voice-waves"><path d="M470 287q22 22 0 46m15-58q34 32 0 69" /></g><Tag x={657} y={207} width={250}>把伙伴叫回来，一起看</Tag></>}</g>}
    {!tempted && !called && !given && <g data-scene-object="team-carrying-cheese"><Ant x={648} y={403} scale={1.02} /><Ant x={716} y={458} scale={.9} /><Arrow x={273} y={267} length={112} angle={19} /></g>}
    <Tag x={449} y={544} width={544}>{tempted ? '虚线气泡是念头；是否执行规则，要看实际行动' : given ? '不是给队长自己：观察奶酪渣最后到了谁那里' : called ? '叫回伙伴是真实行动，和“想吃”分开看' : '先看队伍搬运，再看队长怎样面对诱惑'}</Tag>
  </>;
}

function Jar({ x, y, scale = 1, cracked = false, water = true, child = false, flowing = false }: { x: number; y: number; scale?: number; cracked?: boolean; water?: boolean; child?: boolean; flowing?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="jar"><g data-scene-object={cracked ? 'broken-jar' : 'water-jar'}><ellipse cy="183" rx="141" ry="16" fill="#6f6346" opacity=".12" /><path d="M-139 0Q-152 90-98 167 4 212 98 165 153 89 138 0Z" fill="#bba276" stroke="#8b744f" strokeWidth="4" /><path d="M-123 16q-5 87 43 127m-33-98q121 34 232 1m-207 46q99 34 181 0m-157 48q77 20 129-1" stroke="#d1ba91" strokeWidth="3" fill="none" /><ellipse rx="139" ry="40" fill="#d5bb8d" stroke="#8b744f" strokeWidth="4" /><ellipse rx="115" ry="26" fill={water ? '#a6c1ba' : '#8b785c'} />{water && <path d="M-97-4q51-16 85-5t94-1" stroke="#d9e8d9" strokeWidth="3" fill="none" />}{child && <g data-scene-object="child-in-water"><circle cy="-27" r="23" fill="#e7bd90" stroke="#ae8967" strokeWidth="2" /><path d="M-23-33q-1-31 26-24l21 20" fill="#4e4435" /><path d="M-27 1-48-34M26 0 50-34" stroke="#e0b184" strokeWidth="12" strokeLinecap="round" /><circle cx="-5" cy="-27" r="2" fill="#5b4833" /><circle cx="8" cy="-27" r="2" fill="#5b4833" /><ellipse cy="-14" rx="4" ry="5" fill="#9b674c" /></g>}{cracked && <g data-scene-object="cracked-jar"><path d="m-55 86 25-17 32 21-8 47-35 3-27-26Z" fill="#5e7770" stroke="#e4c89a" strokeWidth="4" /><path d="m-32 70-12-20 16-21m34 57 24-13 22 7m-27 59 8 16-10 18" stroke="#6d644e" strokeWidth="3" fill="none" /></g>}{flowing && <g data-scene-object="water"><path d="M-43 111Q-119 142-200 186q-30 8-73-1" fill="none" stroke="#8fb8b2" strokeWidth="22" strokeLinecap="round" /><path d="M-44 107Q-100 129-180 178" fill="none" stroke="#dbede0" strokeWidth="5" strokeLinecap="round" /><ellipse cx="-242" cy="191" rx="73" ry="13" fill="#a7c9bc" fillOpacity=".8" /><path d="M-288 193h63m-25-10h39" stroke="#e3eee1" strokeWidth="3" /></g>}</g></g>;
}
function SimaguangScene({ sceneKey, parameter }: { sceneKey: string; parameter?: number }) {
  const alias: Record<string,string> = {playing:'play',falling:'fall',leaving:'leave',breaking:'break',saving:'saved',jar:'crack-jar',child:'fall',toward:'play','ref-child':'fall','ref-jar':'crack-jar','ref-toward':'play','ref-leave':'leave'};
  let key = alias[sceneKey] || sceneKey;
  if (key === 'break') key = parameter === undefined ? 'hold-stone' : ['hold-stone','strike-jar','crack-jar','flowing-water','saved'][Math.min(4,Math.floor(clamp(parameter)*5))];
  const hold = key === 'hold-stone'; const hit = key === 'strike-jar'; const cracked = ['break','crack-jar','flowing-water','saved'].includes(key); const flowing = ['break','flowing-water','saved'].includes(key); const saved = key === 'saved'; const fall = key === 'fall'; const leave = key === 'leave';
  return <>
    <path d="M40 479H861" stroke="#cfbd94" strokeWidth="6" /><path d="M88 134H243v255H88Z" fill="#c9d5b4" stroke="#a2ae8d" strokeWidth="3" /><path d="M169 137v250m-79-135h152" stroke="#f0e7cb" strokeWidth="5" />
    <Jar x={536} y={281} scale={1.04} cracked={cracked} child={fall || leave || hold || hit || key==='crack-jar'} flowing={flowing} water={!saved} />
    <Person x={hit ? 310 : 276} y={455} scale={1.01} coat="#a28062" pose={hit ? 'strike' : hold ? 'stone' : cracked ? 'care' : 'stand'} face={fall || leave ? 'worried' : 'calm'} />
    {hit && <g data-scene-object="striking"><Arrow x={383} y={278} length={64} angle={20} /><Spark x={445} y={321} scale={.58} /></g>}
    {hold && <Tag x={280} y={162} width={139}>持石：拿起石头</Tag>}
    {saved ? <g data-scene-object="rescued-child"><Person x={736} y={470} scale={.88} coat="#b2a475" pose="stand" face="smile" /><Person x={824} y={466} scale={.76} coat="#8ea398" pose="care" mirror /><Tag x={737} y={228} width={188}>儿得活：孩子获救</Tag></g> : leave ? <g data-scene-object="others-leaving"><Person x={779} y={453} scale={.73} pose="run" coat="#8b9d8b" /><Arrow x={768} y={236} length={60} /></g> : key==='play' ? <g data-scene-object="children-playing"><Person x={756} y={454} scale={.84} coat="#9aab8b" face="smile" /><Person x={820} y={415} scale={.62} coat="#b49b73" face="smile" /></g> : null}
    {sceneKey==='ref-child' && <g data-scene-object="reference-child"><ellipse cx="536" cy="254" rx="65" ry="51" fill="none" stroke="#b4864b" strokeWidth="4" strokeDasharray="7 7" /><Tag x={722} y={162} width={209}>看孩子：被打破的是谁？</Tag></g>}
    {sceneKey==='ref-jar' && <g data-scene-object="reference-jar"><ellipse cx="536" cy="363" rx="160" ry="143" fill="none" stroke="#b4864b" strokeWidth="4" strokeDasharray="7 7" /></g>}
    {sceneKey==='ref-toward' && <g data-scene-object="reference-toward"><Arrow x={768} y={300} length={155} angle={180} /><Tag x={728} y={189} width={214}>走向瓮边：看箭头方向</Tag></g>}
    {sceneKey==='ref-leave' && <g data-scene-object="reference-leave"><Arrow x={704} y={300} length={131} /><Tag x={728} y={189} width={206}>离开这里：往外走</Tag></g>}
    <Tag x={534} y={135} width={233}>{saved ? '水出，孩子获救' : flowing ? '水迸：水从破口涌出' : cracked ? '破之：“之”指这个瓮' : hit ? '击瓮：石头击向瓮壁' : leave ? '去：其他孩子离开' : fall ? '失足，孩子落入水中' : hold ? '先拿石头，再击瓮' : '群儿戏于庭'}</Tag>
    <Tag x={448} y={547} width={632}>{saved ? '获救是结果，前面的动作说明怎样改变险情' : '持石 → 击瓮 → 破瓮 → 水出 → 获救：观察动作与结果'}</Tag>
  </>;
}

function ObservationMicroscope({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="observation-instrument-schematic">
    <path d="M-45 0h94l-12-14h-69Z" fill="#82988d" stroke="#5d7668" strokeWidth="2" />
    <path d="M16-13C56-53 40-103 4-117" stroke="#7e998b" strokeWidth="13" strokeLinecap="round" fill="none" />
    <path d="M-43-140-33-151-2-120-14-108Z" fill="#657f72" stroke="#4f695d" strokeWidth="2" />
    <path d="m-13-119 23 21-11 12-25-21Z" fill="#a6b4a2" stroke="#5c7668" strokeWidth="2" />
    <path d="m-41-142 10-11" stroke="#d8deca" strokeWidth="4" />
    <circle cx="-3" cy="-64" r="12" fill="#c4ceba" stroke="#5e776a" strokeWidth="3" /><circle cx="-3" cy="-64" r="4" fill="#809488" />
    <path d="M-27-38h69l-5 8h-64Z" fill="#a6b7a5" stroke="#667e6d" strokeWidth="2" /><path d="M5-27v12" stroke="#6f897b" strokeWidth="6" />
    <ellipse cx="-4" cy="-16" rx="20" ry="4" fill="#d4dbc6" stroke="#8b9e89" strokeWidth="1.5" />
  </g>;
}

function ExperimentAction({ result }: { result: boolean }) {
  return <g data-scene-object="experiment-observation-not-specific-procedure">
    <g data-scene-object="observation-workbench"><path d="M26 287h333v15H26Z" fill="#b99f76" stroke="#907852" strokeWidth="2" /><path d="M43 303v44m299-44v44" stroke="#9b845f" strokeWidth="9" /><path d="M35 289h315" stroke="#d7c39a" strokeWidth="2" /></g>
    {result ? <>
      <ObservationMicroscope x={309} y={244} scale={.57} />
      <g data-scene-object="observation-notebook"><path d="m194 266 88-13 55 32-91 12Z" fill="#e2cda6" stroke="#ac9167" strokeWidth="2" /><path d="m198 260 87-11 49 31-87 11Z" fill="#fff8e2" stroke="#c6b08a" strokeWidth="1.5" /><path d="m244 255 16 29m-13-19 33-5m-27 11 34-5m-30 11 35-5" fill="none" stroke="#b8a57c" strokeWidth="1.7" /><path d="m220 261 11 6-8 7-12-6Z" fill="none" stroke="#79927e" strokeWidth="1.7" /></g>
      <g data-scene-object="scientist-recording-observation">
        <path d="m109 257-5 81h25l12-78m3-3 13 81h24l-3-82" fill="#66726b" stroke="#4e5d54" strokeWidth="1.8" /><path d="M104 337h28v12H93q-4-7 11-12m53 0h25q12 3 12 12h-39Z" fill="#4b463c" />
        <path d="M110 204q-26 22-17 62 45 14 90-6-1-42-33-62Z" fill="#91a198" stroke="#6b8276" strokeWidth="2" /><path d="M130 201 147 219l14-18M146 221l3 35m-39-2 17 2" stroke="#d5dec9" strokeWidth="2" fill="none" />
        <path d="M112 220 122 255 155 279m13-64 22 31 33 19" fill="none" stroke="#91a198" strokeWidth="20" strokeLinecap="round" />
        <ellipse cx="159" cy="280" rx="9" ry="7" fill="#e3b98e" stroke="#b58e6c" />
        <path d="M149 202v-24l16 1 2 21" fill="#d7ab81" />
        <g transform="translate(157 166) rotate(19)"><ellipse rx="28" ry="33" fill="#e6bd94" stroke="#b38c6c" strokeWidth="1.8" /><path d="M-27-4q-11-35 19-41 38-9 40 32l-5 19-9-25q-16 10-36 1Z" fill="#4e463a" /><path d="m-12 2 7 2m14 1 7-1" stroke="#72583e" strokeWidth="2" strokeLinecap="round" /><path d="m4 5-2 8 5 2m-10 7q8 4 14-2" fill="none" stroke="#a07856" strokeWidth="1.5" /></g>
        <g data-scene-object="pen-on-observation-page"><path d="m228 244 9 33" stroke="#71634a" strokeWidth="4" strokeLinecap="round" /><path d="m235 272 2 6 3 1" fill="none" stroke="#433d33" strokeWidth="1.5" /><ellipse cx="226" cy="265" rx="9" ry="7" fill="#e5bd92" stroke="#b78e6b" strokeWidth="1.2" /></g>
      </g>
      <Label x={194} y={376} small>记录观察，回看实践的结果</Label>
    </> : <>
      <ObservationMicroscope x={252} y={285} />
      <g data-scene-object="scientist-observing-through-eyepiece">
        <path d="M102 258 95 338h25l18-73m6-9 13 81h26l-4-87" fill="#66736b" stroke="#4f5e55" strokeWidth="1.8" /><path d="M95 338h27v11H84q-3-7 11-11m62-1h27q12 3 12 12h-42Z" fill="#4a463c" />
        <path d="M105 181q-32 29-13 82 42 9 81-9-5-42 9-73l-18-25Z" fill="#8fa197" stroke="#657d70" strokeWidth="2" /><path d="m153 159 9 22-11 16-15-18m5 21-8 49m-26-5 16 5" stroke="#d9dfcb" strokeWidth="2" fill="none" />
        <path d="M107 201 124 248 186 272m-31-77 24 21 58 5" fill="none" stroke="#8fa197" strokeWidth="20" strokeLinecap="round" /><ellipse cx="188" cy="273" rx="9" ry="7" fill="#e3b98d" stroke="#b18a67" strokeWidth="1.2" />
        <path d="m153 164 14-20 17 7-12 27" fill="#d9ad83" />
        <g transform="translate(176 135) rotate(19)"><ellipse rx="27" ry="32" fill="#e7bf97" stroke="#b38c6b" strokeWidth="1.8" /><path d="M-26-3q-12-36 18-43 39-6 40 28L23 1 12-18q-15 12-32 3Z" fill="#4d4437" /><path d="m14 2 13 8-10 3m-3 10 10-2" fill="none" stroke="#ae805c" strokeWidth="1.5" /><path data-scene-object="scientist-eye-at-eyepiece" d="m17-3 7 2" stroke="#5d4b38" strokeWidth="2.4" strokeLinecap="round" /></g>
        <g data-scene-object="scientist-adjusting-instrument"><ellipse cx="241" cy="221" rx="9" ry="7" fill="#e5ba8e" stroke="#b38b67" strokeWidth="1.2" /><path d="m237 217 9 3m-9 3 9 2" stroke="#b38863" strokeWidth="1.2" /></g>
      </g>
      <Label x={194} y={376} small>靠近观察，动手调整仪器</Label>
    </>}
  </g>;
}

function StudyScene({ sceneKey }: { sceneKey: string }) {
  const experiment = sceneKey.startsWith('experiment'); const result = sceneKey.endsWith('result'); const difficult = sceneKey.endsWith('difficulty');
  return <>
    <Panel x={36} y={100} width={387} height={399} title={experiment ? '留学经历：面对困难' : '中学经历：改变学习情况'} tint={experiment ? '#eef0e1' : '#fff4df'}>
      {experiment && !difficult ? <ExperimentAction result={result} /> : <><Person x={139} y={335} scale={1.1} coat={experiment ? '#8e9c94' : '#84978b'} pose="read" adult={experiment} face={difficult ? 'worried' : 'calm'} />{experiment ? <g data-scene-object="experiment-difficulty-before-action"><ObservationMicroscope x={295} y={276} scale={.66} /><Label x={288} y={321} small>难题还需要实践回应</Label></g> : <g data-scene-object="study-book-and-geometric-work"><Book x={295} y={218} scale={.72} blank /><path d="m251 204 39-33 20 56Z" fill="none" stroke="#a08b5e" strokeWidth="2" /><path d="M309 186h23v23h-23Z" fill="none" stroke="#7f986d" strokeWidth="2" /><Label x={282} y={313} small>弄懂问题、认真练习</Label></g>}</>}
      {!(experiment && !difficult) && <Label x={194} y={376} small>{difficult ? '困难需要具体看清' : '让努力落在具体行动上'}</Label>}
    </Panel>
    <Panel x={478} y={100} width={387} height={399} title="从困难，到行动，再看结果" tint="#edf0e0">
      <g data-scene-object={experiment ? 'experiment-difficulty-action-result' : 'study-difficulty-action-result'}>
        <Tag x={193} y={93} width={281}>{experiment ? '困难：实验难，受到轻视' : '困难：基础薄弱、学习落后'}</Tag>
        <Arrow x={193} y={125} angle={90} length={46} />
        <Tag x={193} y={210} width={281}>{experiment ? '行动：钻研并反复实践' : '行动：勤学，弄懂不会的内容'}</Tag>
        <Arrow x={193} y={242} angle={90} length={46} />
        <Tag x={193} y={327} width={281}>{experiment ? '结果：实验做成，回应轻视' : '结果：各科赶上，几何满分'}</Tag>
        {result && <><Spark x={344} y={326} scale={.69} /><path d="m43 324 9 10 16-24" fill="none" stroke="#78935e" strokeWidth="4" strokeLinecap="round" /></>}
      </g>
    </Panel>
    <Tag x={449} y={546} width={662}>{experiment ? '只表现观察与反复实践，不补造教材未核的实验步骤' : '比较努力怎样解决困难，不把人物作息变成孩子的时长要求'}</Tag>
  </>;
}

function MedicalWorkers() {
  return <g data-scene-object="doctor-and-assistant-working-together">
    <g data-scene-object="doctor-leaning-toward-covered-table">
      <ellipse cx="278" cy="478" rx="65" ry="9" fill="#68725d" opacity=".12" />
      <path d="M250 395 241 465h25l17-62m13-7 16 69h25l-13-73" fill="#7e8678" stroke="#5e695d" strokeWidth="2" /><path d="M241 461h27v15h-39q-3-8 12-15m71 0h25q15 3 15 15h-39Z" fill="#565b50" />
      <path d="M257 270q-29 38-27 124 47 34 104 8-8-87-28-128Z" fill="#e9e8d7" stroke="#9ea793" strokeWidth="2.5" />
      <path d="m285 269 9 23-15 15-20-25m35 12 12 97m-60-7 16 1m49-1 14-4" fill="none" stroke="#bdc7b2" strokeWidth="2" />
      {[[297,318],[301,342],[305,365]].map(([x,y]) => <circle key={y} cx={x} cy={y} r="2.3" fill="#a6b39e" />)}
      <path d="m281 272-4-23 21-4 9 33" fill="#d8b085" />
      <g transform="translate(278 232) rotate(23)" data-scene-object="doctor-bowed-head-and-white-cap"><ellipse rx="29" ry="34" fill="#e4bd93" stroke="#af8d6c" strokeWidth="1.8" /><path d="M-29-11q-6-25 9-28h42l9 26-9 9-4-22-37 6-8 13Z" fill="#9d9e8e" /><path d="M-31-27q3-28 34-27 25 0 30 29l-7 13h-52Z" fill="#f3f1e1" stroke="#a1ad96" strokeWidth="2" /><path d="M-27-26h54" stroke="#cdd5c0" strokeWidth="2" /><path d="m-17-2 8 3m13 0 8-1" stroke="#655641" strokeWidth="2" strokeLinecap="round" /><path d="M-22 9q21-8 42-2v18q-22 10-43-1Z" fill="#f6f3df" stroke="#c2c9b4" strokeWidth="1.5" /><path d="m-21 10-9-4m50 2 9-7" stroke="#c2c9b4" strokeWidth="1.5" /></g>
      <g data-scene-object="doctor-hands-at-covered-table"><path d="M260 286 289 330 353 363M304 284 330 315 383 346" fill="none" stroke="#e8e8d7" strokeWidth="23" strokeLinecap="round" /><path d="m348 355 9 15m20-31 12 13" stroke="#bdc8b2" strokeWidth="2" /><ellipse cx="361" cy="366" rx="11" ry="8" transform="rotate(20 361 366)" fill="#f7f0db" stroke="#a9b79e" strokeWidth="1.6" /><ellipse cx="392" cy="350" rx="11" ry="8" transform="rotate(23 392 350)" fill="#f7f0db" stroke="#a9b79e" strokeWidth="1.6" /><path d="m362 362 7 5m21-22 7 6" stroke="#c6cdb9" strokeWidth="1.2" /></g>
    </g>
    <g data-scene-object="assistant-leaning-toward-covered-table">
      <ellipse cx="615" cy="477" rx="63" ry="8" fill="#657466" opacity=".12" />
      <path d="M589 401 577 465h25l13-59m10-3 8 62h26l-8-69" fill="#657d74" stroke="#4f665e" strokeWidth="2" /><path d="M577 463h27v13h-38q-5-8 11-13m57-1h25q14 3 14 14h-39Z" fill="#4f5f57" />
      <path d="M589 274q-20 48-12 127 42 21 88-2-4-75-30-124Z" fill="#89a19a" stroke="#617d73" strokeWidth="2.5" />
      <path d="m601 276-16 29 12 13 23-26m-8 6 3 44" stroke="#c8d3c1" strokeWidth="2" fill="none" />
      <path d="M599 298 628 301 651 402q-39 16-70 0Z" fill="#e5e7d3" stroke="#b7c4ad" strokeWidth="2" /><path d="m589 384 44 5m-44-69-7 34" stroke="#c5cfb7" strokeWidth="2" fill="none" />
      <path d="m593 275 6-24 19 4 4 21" fill="#d9b187" />
      <g transform="translate(603 226) rotate(-21)" data-scene-object="assistant-bowed-head-and-headcloth"><circle cx="21" cy="-23" r="13" fill="#5d5747" /><ellipse rx="27" ry="33" fill="#e6be96" stroke="#b3906d" strokeWidth="1.8" /><path d="M-28-5q-7-40 19-42 33-9 42 25l-7 20-9-20q-15 11-32 6Z" fill="#5d5848" /><path d="M-31-18q10-35 36-27 22 4 25 22l-9 7q-13-9-38 3Z" fill="#f3f0df" stroke="#a6b7a0" strokeWidth="2" /><path d="m-29-17 48-8m3 8 13 9-4 24-14-16" fill="#e9ecda" stroke="#b3c2a9" strokeWidth="1.5" /><path d="m-15 1 8 2m12 0 8-2m-11 5-3 10 5 2m-8 6 13-2" stroke="#947552" strokeWidth="1.7" fill="none" strokeLinecap="round" /></g>
      <g data-scene-object="assistant-hands-at-covered-table"><path d="M594 289 568 322 540 354m89-64-35 53-40 26" fill="none" stroke="#89a19a" strokeWidth="22" strokeLinecap="round" /><path d="m539 347 9 13m4 0 10 15" stroke="#c5d0bb" strokeWidth="4" /><ellipse cx="535" cy="360" rx="11" ry="8" transform="rotate(-28 535 360)" fill="#f1eed9" stroke="#9eaf94" strokeWidth="1.6" /><ellipse cx="550" cy="374" rx="11" ry="8" transform="rotate(-27 550 374)" fill="#f1eed9" stroke="#9eaf94" strokeWidth="1.6" /><path d="m529 358 7 4m8 10 7 4" stroke="#c3cbb5" strokeWidth="1.2" /></g>
    </g>
    <Label x={268} y={501} small>医生专注救治</Label><Label x={621} y={501} small>助手在台边协作</Label>
  </g>;
}

function MedicalScene({ sceneKey }: { sceneKey: string }) {
  const danger = sceneKey==='danger'; const suggestion = sceneKey==='suggestion';
  return <>
    <g data-scene-object="field-medical-tent"><path d="M54 198 447 86 846 198V468H54Z" fill="#d3d3b9" stroke="#9caa8b" strokeWidth="3" /><path d="M447 91V465m-390-267 390 102 396-102" stroke="#b6bea0" strokeWidth="3" fill="none" /><path d="M48 466H851" stroke="#b8ac86" strokeWidth="5" /></g>
    {(danger || suggestion) && <g data-scene-object="smoke-outside-tent" opacity=".55"><path d="M84 219Q4 175 62 145 26 98 81 81 118 50 141 100 186 91 185 130 226 151 189 186 226 224 165 239Z" fill="#8c967d" /><path d="M710 203q-56-64 10-71-26-54 36-66 39-25 54 31 50 7 19 55 43 45-34 67Z" fill="#9fa78a" /></g>}
    <g data-scene-object="covered-patient-and-operating-table"><path d="M304 378H573v30H304m16 30v72m227-72v72" fill="#8a907b" stroke="#686f5d" strokeWidth="3" /><path d="M316 353q109-60 234-8l12 46H307Z" fill="#f6f1dd" stroke="#d0cbb0" strokeWidth="3" /><ellipse cx="318" cy="351" rx="23" ry="18" fill="#dccba5" /><path d="M351 350q95-20 182 8" stroke="#e3ddc6" strokeWidth="3" fill="none" /></g>
    <MedicalWorkers />
    {suggestion && <g data-scene-object="messenger-proposes-leaving"><Person x={771} y={458} scale={.97} coat="#8e9e7e" cap pose="explain" mirror /><Tag x={682} y={189} width={211}>有人转达撤离决定</Tag></g>}
    <Tag x={435} y={143} width={danger ? 303 : 270}>{danger ? '外面的危险正在增加' : '救治伤员是当前的职责'}</Tag>
    <Tag x={449} y={547} width={659}>{danger ? '环境变危险，仍要联系人物具体行动解释课题' : suggestion ? '读他的回应和后续行动，不替故事添加危险处置规则' : '画面只表现救治协作，不展示伤口或编造手术过程'}</Tag>
  </>;
}

function BowlScene({ sceneKey }: { sceneKey: string }) {
  const old = sceneKey==='old-utensil'; const rice = sceneKey==='rice'; const dish=sceneKey==='dish'; const newBowl=sceneKey==='new-bowl';
  return <>
    {rice ? <>
      <Panel x={34} y={108} width={525} height={394} title="较好的米饭，拨回锅里" tint="#fff3dd">
        <g data-scene-object="rice-returned-to-pot"><path d="M233 282q-2 85 113 85 119-7 112-84Z" fill="#8d9883" stroke="#65735e" strokeWidth="3" /><ellipse cx="346" cy="282" rx="113" ry="30" fill="#c5cdb5" stroke="#7e8c72" strokeWidth="3" /><g fill="#fff7df">{Array.from({length:14},(_,i)=><ellipse key={i} cx={289+i*9} cy={278+i%3*9} rx="10" ry="4" />)}</g><Bowl x={126} y={214} scale={.75} food="rice" /><Arrow x={173} y={240} length={72} angle={23} /><path d="m159 170 92 90" stroke="#a58b60" strokeWidth="8" strokeLinecap="round" /><path d="m235 248 21 25" stroke="#e3caa2" strokeWidth="14" strokeLinecap="round" /></g>
        <Label x={263} y={375} small>米饭留给战士，不是倒掉</Label>
      </Panel>
      <Panel x={603} y={108} width={263} height={394} title="自己换野菜粥" tint="#eaf0df"><Bowl x={131} y={254} scale={1.04} food="porridge" /><Label x={131} y={376} small>饭食的去向不同</Label></Panel>
    </> : dish ? <>
      <g data-scene-object="shared-seventh-squad-table"><path d="M172 332H735v29H172m23 29v110m510-110v110" fill="#b19569" stroke="#886e4a" strokeWidth="3" /><Bowl x={451} y={302} scale={1.13} food="vegetables" /><Person x={202} y={461} scale={.98} coat="#91a285" cap pose="carry" /><Person x={712} y={464} scale={.96} coat="#9dac8f" cap pose="carry" mirror /><path d="m243 264 107 28m319-24-93 27" stroke="#a08151" strokeWidth="5" strokeLinecap="round" /><Tag x={450} y={170} width={279}>同一个粗瓷碗，给七班盛菜</Tag></g>
    </> : old || newBowl ? <>
      <Person x={201} y={461} scale={1.1} coat="#939d81" cap pose="carry" />
      <Person x={733} y={461} scale={1.12} coat="#889982" cap pose="carry" mirror />
      <Panel x={320} y={148} width={260} height={326} title={old ? '先送出：原有用具' : '后来找到：粗瓷碗'} tint={old ? '#fff1d8' : '#e9efdf'}><Bowl x={130} y={210} scale={1.13} food={newBowl ? 'rice' : 'empty'} old={old} /><Label x={130} y={305} small>{old ? '与后来找到的碗分开' : '通讯员找到并盛上饭'}</Label></Panel>
      <Arrow x={262} y={265} length={52} /><Arrow x={584} y={265} length={54} />
      <Tag x={200} y={153} width={168}>{old ? '赵一曼' : '通讯员'}</Tag><Tag x={730} y={153} width={168}>{old ? '新战士' : '赵一曼'}</Tag>
    </> : <g data-scene-object="museum-rough-bowl"><path d="M186 383H714v77H186Z" fill="#cfbfa0" stroke="#af9970" strokeWidth="3" /><path d="M167 146H734V383H167Z" fill="#e7eddc" fillOpacity=".65" stroke="#a8b49a" strokeWidth="3" /><Bowl x={450} y={299} scale={1.68} /><path d="m190 167 65 166m439-167-46 134" stroke="#fff9e9" strokeOpacity=".7" strokeWidth="5" /><Tag x={450} y={148} width={232}>从物品，追踪人的行动</Tag></g>}
    <Tag x={450} y={547} width={658}>{rice ? '米饭回锅 → 换野菜粥：分别观察两种食物的去向' : dish ? '碗服务于谁，能帮助我们理解物品背后的关心' : old ? '旧用具送出是一件事，新粗瓷碗找来是另一件事' : newBowl ? '先看谁找到碗，再看后来饭食怎样换、碗又去了哪里' : '粗瓷外表不是重点，后面的行动才是叙事线索'}</Tag>
  </>;
}

const titles: Record<string,string> = {'cn-02':'花的学校 · 同一特点，两层画面','cn-03':'不懂就要问 · 会背与理解','cn-09':'犟龟 · 读到哪里，看到哪里','cn-10':'小狗学叫 · 困难、愿望与新线索','cn-11':'宝葫芦的秘密 · 困难与想象','cn-12':'在牛肚子里旅行 · 位置与帮助','cn-13':'一块奶酪 · 念头与实际行动','cn-23':'司马光 · 动作怎样改变险情','cn-24':'一定要争气 · 困难、行动、结果','cn-25':'手术台就是阵地 · 环境与职责','cn-26':'一个粗瓷大碗 · 物品与饭食的去向'};

export default function ChineseStoryScenes({ courseId, step, sceneKey, parameter, paused = false }: ChineseStorySceneProps) {
  const uid = useId().replace(/:/g,'');
  if (!supportsStoryScene(courseId)) return null;
  const key = getStorySceneKey(courseId,step,sceneKey);
  const imageBase = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-precision/`;
  const render: Record<string, ReactNode> = {
    'cn-02': <FlowersScene sceneKey={key} parameter={parameter} />,
    'cn-03': <QuestionScene sceneKey={key} />,
    'cn-09': <TurtleScene sceneKey={key} />,
    'cn-10': <DogScene sceneKey={key} />,
    'cn-11': <GourdScene sceneKey={key} />,
    'cn-12': <CricketTravelScene sceneKey={key} />,
    'cn-13': <AntScene sceneKey={key} />,
    'cn-23': <SimaguangScene sceneKey={key} parameter={parameter} />,
    'cn-24': <StudyScene sceneKey={key} />,
    'cn-25': <MedicalScene sceneKey={key} />,
    'cn-26': <BowlScene sceneKey={key} />,
  };
  const style = {'--css-scene-duration':'1.8s'} as CSSProperties;
  return <svg className="chinese-story-scene" viewBox="0 0 900 600" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby={`${uid}-title ${uid}-description`} data-course={courseId} data-scene-key={key} data-paused={paused || undefined} style={style}>
    <title id={`${uid}-title`}>{titles[courseId]}</title><desc id={`${uid}-description`}>原创教学观察示意。当前对象和动作：{key}。现代课文须配合纸本，图景不代替原文依据。</desc>
    <defs><linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffaeb" /><stop offset="1" stopColor="#e8e9d4" /></linearGradient><filter id={`${uid}-shadow`} x="-15%" y="-15%" width="130%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#6b5b3b" floodOpacity=".12" /></filter></defs>
    <rect width="900" height="600" rx="26" fill={`url(#${uid}-paper)`} />
    <ProgressiveSvgImage source={`${imageBase}${courseId}.webp`} x="0" y="0" width="900" height="600" preserveAspectRatio="xMidYMid slice" opacity=".12" aria-hidden="true" />
    <path d="M28 87H872M28 571H872" stroke="#cabd99" strokeOpacity=".55" />
    <Label x={450} y={51}>{titles[courseId]}</Label><Label x={450} y={77} small fill="#8b826a">观察对象和变化，再把依据读回课本</Label>
    <g className="css-main-objects" filter={`url(#${uid}-shadow)`}>{render[courseId]}</g>
  </svg>;
}
