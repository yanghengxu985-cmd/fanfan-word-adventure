import type { ReactNode } from 'react';
import type { LabPerson, LabVisual } from '../data/englishLearningLab';
import './EnglishLabScene.css';

interface Props {
  visual: LabVisual;
  playing?: boolean;
  paused?: boolean;
  decorative?: boolean;
}
type Place = 'school' | 'park' | 'library';
const ink = '#34584a';
const green = '#77a78e';
const gold = '#e1bd6c';
const skin = '#e9bb94';
const hair = '#57443a';

function Child({ person, x, y = 63, waving = false, speaking = false, back = false, facing = 'front' }: {
  person: LabPerson; x: number; y?: number; waving?: boolean; speaking?: boolean;
  back?: boolean; facing?: 'left' | 'right' | 'front';
}) {
  const lan = person === 'Lan';
  const look = facing === 'left' ? -3 : facing === 'right' ? 3 : 0;
  return <g transform={`translate(${x} ${y})`} className={`els-child ${speaking ? 'els-speaking' : ''}`} data-person={person}>
    <ellipse cy="154" rx="34" ry="6" fill="#52654b" opacity=".13" />
    <path d="M-17 102l-3 39m37-39l4 39" stroke="#695244" strokeWidth="12" strokeLinecap="round" />
    <path d="M-21 144h-10m52 0h11" stroke={ink} strokeWidth="10" strokeLinecap="round" />
    {lan && <><ellipse cx="-24" cy="29" rx="10" ry="20" fill={hair} /><ellipse cx="24" cy="29" rx="10" ry="20" fill={hair} /></>}
    <path d={lan ? 'M-24 58Q0 45 24 58L31 106H-31Z' : 'M-26 58Q0 45 26 58L27 105H-27Z'} fill={lan ? gold : green} stroke={lan ? '#bc984e' : '#598b71'} strokeWidth="2" />
    <path d={waving ? 'M-23 65L-39 46L-39 20' : 'M-23 64L-33 94'} stroke={skin} strokeWidth="11" fill="none" strokeLinecap="round" className={waving ? 'els-wave-arm' : undefined} />
    <path d="M23 65L33 94" stroke={skin} strokeWidth="11" fill="none" strokeLinecap="round" />
    <circle cy="28" r="27" fill={back ? hair : skin} />
    {!back && <><path d="M-27 27Q-29-5 1 1Q32 2 27 29L17 14Q0 23-19 13Z" fill={hair} /><g transform={`translate(${look} 0)`}><path d="M-10 29h1m18 0h1" stroke={hair} strokeWidth="4" strokeLinecap="round" /><path d="M-6 41Q0 46 6 41" stroke="#a96954" strokeWidth="2.5" fill="none" strokeLinecap="round" className="els-smile" />{speaking && <ellipse cy="42" rx="6" ry="4.5" fill="#a96954" className="els-speaking-mouth" />}<circle cx="-16" cy="37" r="4" fill="#d48873" opacity=".45" /><circle cx="16" cy="37" r="4" fill="#d48873" opacity=".45" /></g></>}
    {lan && <path d="M-28 13l-9-5v13l9-4m56-4l9-5v13l-9-4" fill="#c98270" />}
    {back && <><path d="M-19 57Q0 44 19 57" stroke="#769988" strokeWidth="5" fill="none" /><rect x="-22" y="60" width="44" height="52" rx="12" fill="#92b7a6" stroke="#57866d" strokeWidth="3" /><path d="M-12 85h24m-23 8h22" stroke="#658f78" strokeWidth="3" strokeLinecap="round" /><rect x="-13" y="74" width="26" height="22" rx="5" fill="#c4d6bc" /></>}
  </g>;
}

function SpeakerBadge({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`} className="els-speaker-badge"><circle r="15" fill="#3f7c60" stroke="#fff9df" strokeWidth="3" /><path d="M-8-4h5l5-4v16l-5-4h-5Z" fill="#fff9df" /><path d="M6-5q6 5 0 10m4-14q9 9 0 18" stroke="#fff9df" fill="none" strokeWidth="1.8" strokeLinecap="round" /></g>;
}

function NameCard({ person, x, y = 217, focus = false, large = false }: {
  person: LabPerson; x: number; y?: number; focus?: boolean; large?: boolean;
}) {
  const lan = person === 'Lan';
  return <g transform={`translate(${x} ${y})`} className={`els-name-card ${focus ? 'els-focused-card' : ''}`} data-name={person} data-highlighted={focus}>
    <rect x={large ? -83 : -58} y={large ? -62 : -22} width={large ? 166 : 116} height={large ? 136 : 45} rx={large ? 18 : 12} fill={focus ? '#fff0ba' : '#fffbed'} stroke={focus ? '#b98e3e' : lan ? '#cfb574' : '#91ae92'} strokeWidth={focus ? 4 : 2} />
    {large ? <><circle cy="-23" r="22" fill={lan ? '#f0dab0' : '#d4e6d3'} /><circle cy="-25" r="12" fill={skin} /><path d="M-12-27Q-13-42 0-38Q14-38 12-26L6-32Q0-28-9-33Z" fill={hair} /><path d="M-17-6q17-21 34 0" fill={lan ? gold : green} /><text y="37" textAnchor="middle" fontSize="36" fontWeight="600" fill={ink} fontFamily="Georgia,serif">{person}</text><path d="M-43 52h86" stroke={lan ? '#c4a15e' : '#88a28a'} strokeWidth="2" strokeLinecap="round" /></> : <><circle cx="-34" cy="-2" r="12" fill={lan ? '#efdbad' : '#d2e5cf'} /><circle cx="-34" cy="-5" r="6" fill={skin} /><path d="M-42 6q8-13 16 0" fill={lan ? gold : green} /><text x="9" y="8" textAnchor="middle" fontSize="26" fontWeight="600" fill={ink} fontFamily="Georgia,serif">{person}</text></>}
  </g>;
}

function PlaceBackdrop({ place, departure }: { place: Place; departure: boolean }) {
  return <g className="els-place-backdrop">
    <path d="M13 200Q170 177 347 197V246H13Z" fill={place === 'park' ? '#dde7cf' : '#e9e3c9'} />
    {place === 'school' ? <><rect x="23" y="31" width="199" height="154" rx="9" fill="#e9d6a4" stroke="#c4ab70" strokeWidth="3" /><path d="M14 35L125 8L231 35Z" fill="#99b2a0" /><rect x="43" y="59" width="48" height="43" rx="4" fill="#deeee4" stroke="#b3c5ac" strokeWidth="3" /><rect x="112" y="59" width="48" height="43" rx="4" fill="#deeee4" stroke="#b3c5ac" strokeWidth="3" /><path d="M67 59v43m-24-22h48m45-21v43m-24-22h48" stroke="#b2c3aa" strokeWidth="2" /><path d="M191 18v-12m0 5h22l-6 7h-16" fill="#d4b15d" stroke="#ad975f" strokeWidth="2" /><rect x={departure ? 242 : 246} y="45" width="84" height="160" rx="5" fill="#c0d4bd" stroke="#9cae8d" strokeWidth="5" /><path d="M250 50l45 12v139l-45 2Z" fill="#f4e5bd" stroke="#c3ac77" strokeWidth="3" /><circle cx="286" cy="125" r="4" fill="#b08b53" /></> : place === 'park' ? <><path d="M38 165V84m151 73V66" stroke="#a58961" strokeWidth="13" strokeLinecap="round" /><path d="M41 38Q3 30 9 63Q-5 85 27 101Q17 124 52 123Q77 125 82 99Q111 84 85 57Q74 27 41 38Z" fill="#95b699" /><path d="M191 26Q153 22 155 57Q129 74 157 103Q153 125 183 124Q215 130 223 103Q251 90 232 63Q237 33 207 30Z" fill="#a9bf98" /><path d="M237 208V67Q281 18 331 67v141" fill="none" stroke="#8ca38b" strokeWidth="10" strokeLinecap="round" /><path d="M240 95h20v103m71-103h-20v103" stroke="#b7a276" strokeWidth="5" fill="none" /><path d="M260 199q20 9 51 1l34 25" stroke="#f4eed7" strokeWidth="24" fill="none" /></> : <><rect x="18" y="27" width="200" height="165" rx="9" fill="#dbddbe" stroke="#aab293" strokeWidth="3" />{[54, 101, 148].map((y, shelf) => <g key={y}><path d={`M31 ${y + 33}h172`} stroke="#ac9565" strokeWidth="5" />{[0, 1, 2, 3, 4, 5].map(book => <rect key={book} x={39 + book * 26} y={y + (book % 2) * 4} width={book % 2 ? 17 : 20} height={30 - (book % 2) * 4} rx="2" fill={['#9ebba5', '#d4b46b', '#d6a391'][(book + shelf) % 3]} />)}</g>)}<rect x="242" y="35" width="89" height="172" rx="6" fill="#bdd0bd" stroke="#a5b59b" strokeWidth="5" /><path d="M250 40l43 13v151l-43 1Z" fill="#efe4c6" stroke="#c4b28b" strokeWidth="3" /><circle cx="285" cy="124" r="4" fill="#b49867" /></>}
    <path d="M16 224h327" stroke="#d2c9a8" strokeWidth="2" strokeLinecap="round" />
  </g>;
}

function GreetingScene({ departure, place }: { departure: boolean; place: Place }) {
  return <g><PlaceBackdrop place={place} departure={departure} />{departure ? <>
    <Child person="Lin" x={79} y={64} waving facing="right" />
    <path d="M146 218l8-3m20 6l9-3m20 6l9-3m18 4l9-3" stroke="#b7bfa3" strokeWidth="4" strokeLinecap="round" />
    <g className="els-departing-lan"><Child person="Lan" x={317} y={66} back waving /></g>
    <path d="M40 37q13-14 27 0m-20 9h15" stroke="#73947b" strokeWidth="4" strokeLinecap="round" fill="none" />
  </> : <>
    <g className="els-meeting-lin"><Child person="Lin" x={132} y={68} waving facing="right" /></g>
    <g className="els-meeting-lan"><g transform="translate(228 68) scale(-1 1)"><Child person="Lan" x={0} y={0} waving facing="right" /></g></g>
    <g className="els-meeting-bubble"><path d="M150 40h59q13 0 13 13v15q0 13-13 13h-9l-10 13v-13h-26l-11 11v-11h-3q-13 0-13-13V53q0-13 13-13Z" fill="#fff7de" stroke="#bca464" strokeWidth="2" /><path d="M161 59h4m13 0h4m13 0h4" stroke="#8c9c74" strokeWidth="5" strokeLinecap="round" /></g>
  </>}</g>;
}

function Conversation({ visual }: { visual: LabVisual }) {
  const left: LabPerson = visual.swapped ? 'Lan' : 'Lin';
  const right: LabPerson = left === 'Lin' ? 'Lan' : 'Lin';
  const speaker = visual.speaker ?? 'Lin';
  const speakerOnLeft = speaker === left;
  return <g><path d="M30 218Q173 194 330 220" stroke="#d9e3cc" strokeWidth="25" strokeLinecap="round" fill="none" />
    <Child person={left} x={102} y={58} speaking={speakerOnLeft} facing="right" /><Child person={right} x={258} y={58} speaking={!speakerOnLeft} facing="left" />
    <g className="els-conversation-bubble" transform={speakerOnLeft ? undefined : 'translate(360 0) scale(-1 1)'}><path d="M72 15h96q15 0 15 15v20q0 15-15 15h-42l-17 17v-17H72q-15 0-15-15V30q0-15 15-15Z" fill="#e4eecf" stroke="#8aab8a" strokeWidth="2.5" /><path d="M91 41h5m14 0h5m14 0h5" stroke="#749679" strokeWidth="6" strokeLinecap="round" /></g>
    <SpeakerBadge x={speakerOnLeft ? 66 : 294} y={106} />
    <NameCard person={left} x={102} y={232} focus={visual.focus === left} /><NameCard person={right} x={258} y={232} focus={visual.focus === right} />
  </g>;
}

function CatScene({ kind }: { kind: 'ginger' | 'grey' | 'black' }) {
  if (kind === 'ginger') return <g><ellipse cx="180" cy="218" rx="104" ry="20" fill="#dfd4b0" /><path d="M103 217l13 15m11-25l13 25m95-25l12 25m12-18l12 14" stroke="#c2b183" strokeWidth="3" />
    <g className="els-cat-breathe"><path d="M219 185q69-66 66-11q-4 34-49 32" stroke="#c58f62" strokeWidth="21" strokeLinecap="round" fill="none" /><ellipse cx="177" cy="174" rx="60" ry="48" fill="#dca36f" /><path d="M139 98l-11-52l45 29m39 23l24-50l-54 25" fill="#dca36f" stroke="#be8759" strokeWidth="3" /><path d="M142 83l-5-22l22 16m48 6l17-20l-6 21" fill="#f0c5a7" /><ellipse cx="179" cy="113" rx="55" ry="48" fill="#e8b784" /><path d="M158 109h2m39 0h2" stroke="#4f4737" strokeWidth="7" strokeLinecap="round" /><path d="M171 124l9 8l9-8Z" fill="#b77261" /><path d="M180 131v9m0 0q-12 9-23 0m23 0q12 9 23 0M147 124l-36-7m36 16l-36 3m101-9l36-7m-35 18l36 4" stroke="#9d7557" strokeWidth="3" strokeLinecap="round" fill="none" /><path d="M147 195v24m55-24v24" stroke="#c88d5e" strokeWidth="18" strokeLinecap="round" /><path d="M169 71l-3 15m17-17v15m17-11l-4 14" stroke="#c18b61" strokeWidth="5" strokeLinecap="round" /></g></g>;
  if (kind === 'grey') return <g><rect x="42" y="22" width="126" height="113" rx="9" fill="#dce8dc" stroke="#b0c3a8" strokeWidth="5" /><path d="M105 22v111M44 79h122" stroke="#b0c3a8" strokeWidth="4" /><circle cx="73" cy="53" r="15" fill="#f0d38a" /><rect x="33" y="192" width="294" height="15" rx="6" fill="#c4b487" /><path d="M55 207v23m248-23v23" stroke="#ab9870" strokeWidth="9" strokeLinecap="round" />
    <g className="els-cat-breathe"><ellipse cx="213" cy="160" rx="85" ry="41" fill="#9da9a7" /><path d="M198 151q61-21 72 10q4 22-42 24" stroke="#7f9290" strokeWidth="22" strokeLinecap="round" fill="none" /><path d="M86 133L87 79l39 30m35 19l27-41l-47 21" fill="#9da9a7" stroke="#7e928b" strokeWidth="3" /><ellipse cx="127" cy="147" rx="56" ry="41" fill="#b8c3be" /><path d="M95 92l2 24l17-12m40 10l20-15l-10 24" fill="#d9c6bc" /><path d="M103 142q8 8 17 0m17 0q8 8 17 0" stroke="#546e63" strokeWidth="4" strokeLinecap="round" fill="none" /><path d="M121 153l7 6l7-6Z" fill="#b77d71" /><path d="M128 158v8M88 150l-29-7m30 19l-31 3m105-13l27-6m-27 18l28 3" stroke="#718d81" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M181 183l-42 8m67-8l-40 10" stroke="#92a49a" strokeWidth="12" strokeLinecap="round" /></g></g>;
  return <g><path d="M29 216q118-41 301 0v25H29Z" fill="#dfe9cd" /><path d="M41 204l-5-19m15 18l6-18m238 18l5-18m9 21l8-14" stroke="#a1b990" strokeWidth="4" strokeLinecap="round" /><circle cx="89" cy="211" r="19" fill="#dcc077" stroke="#ba9a5e" strokeWidth="3" /><path d="M74 199l25 24m-29-10l30-8" stroke="#f8e6b7" strokeWidth="3" />
    <g className="els-cat-tail"><path d="M252 132q40-57 13-95" stroke="#434f4b" strokeWidth="19" fill="none" strokeLinecap="round" /></g><path d="M112 180q13-73 82-71q61 1 71 60l-12 14Z" fill="#4f5d55" /><path d="M133 171l-6 44m102-46l11 46" stroke="#44554b" strokeWidth="18" strokeLinecap="round" /><path d="M142 112L136 66l36 31m24 15l25-44l-42 27" fill="#4f5d55" stroke="#394c42" strokeWidth="3" /><ellipse cx="177" cy="133" rx="48" ry="39" fill="#586c5d" /><path d="M145 83l3 23l18-9m34 10l13-22l-4 24" fill="#bb9c8b" /><ellipse cx="160" cy="130" rx="6" ry="9" fill="#e1d597" /><ellipse cx="193" cy="130" rx="6" ry="9" fill="#e1d597" /><path d="M170 142l7 6l7-6Z" fill="#c49c87" /><path d="M177 148v7m0 0q-8 7-15 1m15-1q8 7 15 1M137 143l-29-6m30 17l-28 4m103-13l27-7m-28 18l28 4" stroke="#c0cab0" strokeWidth="2.5" fill="none" strokeLinecap="round" /></g>;
}

function assertScene(value: never): never { throw new Error(`Unknown English lab scene: ${String(value)}`); }
function sceneDescription(visual: LabVisual): string {
  switch (visual.scene) {
    case 'cat-ginger': return 'A ginger cat sitting on a rug.';
    case 'cat-grey': return 'A grey cat resting by a window.';
    case 'cat-black': return 'A black cat playing in a garden.';
    case 'boy': return 'Lin, a boy in green.';
    case 'girl': return 'Lan, a girl in yellow.';
    case 'hello-school': return 'Lin and Lan meet at school.';
    case 'hello-park': return 'Lin and Lan meet in a park.';
    case 'hello-library': return 'Lin and Lan meet at a library.';
    case 'goodbye-school': return 'Lan walks out of school with a backpack while Lin stays and waves.';
    case 'goodbye-park': return 'Lan walks out of a park with a backpack while Lin stays and waves.';
    case 'goodbye-library': return 'Lan walks out of a library with a backpack while Lin stays and waves.';
    case 'conversation': { const speaker = visual.speaker ?? 'Lin'; return `${speaker} is speaking. ${speaker === 'Lin' ? 'Lan' : 'Lin'} is listening.${visual.focus ? ` ${visual.focus}'s name card is highlighted.` : ''}`; }
    case 'name-lin': return 'Lin and a portrait name card reading Lin.';
    case 'name-lan': return 'Lan and a portrait name card reading Lan.';
    default: return assertScene(visual.scene);
  }
}
function sceneDrawing(visual: LabVisual): ReactNode {
  switch (visual.scene) {
    case 'cat-ginger': return <CatScene kind="ginger" />;
    case 'cat-grey': return <CatScene kind="grey" />;
    case 'cat-black': return <CatScene kind="black" />;
    case 'boy': return <><Child person="Lin" x={180} y={50} /><NameCard person="Lin" x={180} y={228} /></>;
    case 'girl': return <><Child person="Lan" x={180} y={50} /><NameCard person="Lan" x={180} y={228} /></>;
    case 'hello-school': return <GreetingScene place="school" departure={false} />;
    case 'hello-park': return <GreetingScene place="park" departure={false} />;
    case 'hello-library': return <GreetingScene place="library" departure={false} />;
    case 'goodbye-school': return <GreetingScene place="school" departure />;
    case 'goodbye-park': return <GreetingScene place="park" departure />;
    case 'goodbye-library': return <GreetingScene place="library" departure />;
    case 'conversation': return <Conversation visual={visual} />;
    case 'name-lin': return <><Child person="Lin" x={90} y={58} /><NameCard person="Lin" x={244} y={126} large /></>;
    case 'name-lan': return <><Child person="Lan" x={90} y={58} /><NameCard person="Lan" x={244} y={126} large /></>;
    default: return assertScene(visual.scene);
  }
}

/** Every picture conveys the event without painting the tested word into the scene. */
export default function EnglishLabScene({ visual, playing = false, paused = false, decorative = false }: Props) {
  const description = sceneDescription(visual);
  return <svg className={`english-lab-scene ${playing || paused ? 'els-has-motion' : ''} ${paused ? 'els-paused' : ''}`} viewBox="0 0 360 260" data-scene={visual.scene} data-speaker={visual.speaker ?? ''} data-focus={visual.focus ?? ''} data-swapped={Boolean(visual.swapped)} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : description} aria-hidden={decorative || undefined} focusable="false">
    {!decorative && <title>{description}</title>}
    <rect x="4" y="4" width="352" height="252" rx="27" fill="#f7f3df" />
    {sceneDrawing(visual)}
  </svg>;
}
