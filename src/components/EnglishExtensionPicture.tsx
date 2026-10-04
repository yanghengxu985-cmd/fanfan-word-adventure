import { useId, type ReactNode } from 'react';

export const englishExtensionPictureKeys = [
  'identity-lin', 'identity-lan', 'answer-yes', 'answer-no', 'inside', 'outside', 'together', 'alone', 'we', 'class-team', 'class-team-1', 'here-i-am', 'sorry',
  'friend', 'many', 'have', 'family-mother', 'family-father', 'family-brother', 'family-sister', 'family-baby', 'family-all',
  'family-grandfather', 'family-grandmother', 'family-uncle', 'family-aunt', 'family-cousin', 'evening',
  'number-1', 'number-2', 'number-3', 'number-4', 'number-5', 'number-6', 'number-7', 'number-8', 'number-9', 'number-10',
  'car', 'book', 'ball', 'cake', 'birthday', 'help', 'gift', 'thanks', 'welcome',
  'action-clean', 'action-draw', 'action-sing', 'action-dance', 'action-photo', 'table', 'picture', 'child', 'ok',
] as const;
export type EnglishExtensionPictureKey = typeof englishExtensionPictureKeys[number];
const extensionKeys = new Set<string>(englishExtensionPictureKeys);
export function isEnglishExtensionPicture(picture: string): picture is EnglishExtensionPictureKey { return extensionKeys.has(picture); }

interface Props { picture: EnglishExtensionPictureKey; description: string; decorative?: boolean; className?: string }
const ink = '#466654';
const green = '#8ca893';
const yellow = '#d5b263';
const skin = '#e6bc96';
const hair = '#554339';

function Figure({ x, y = 26, scale = 1, girl = false, shirt = green, wave = false, raised = false }: {
  x: number; y?: number; scale?: number; girl?: boolean; shirt?: string; wave?: boolean; raised?: boolean;
}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cy="104" rx="31" ry="5" fill="#dbe3ce" />
    {girl && <><ellipse cx="-17" cy="24" rx="8" ry="15" fill={hair} /><ellipse cx="17" cy="24" rx="8" ry="15" fill={hair} /></>}
    <path d="M-15 78v20m30-20v20" stroke="#594e42" strokeWidth="9" strokeLinecap="round" />
    <path d="M-15 99h-8m38 0h8" stroke="#315e56" strokeWidth="8" strokeLinecap="round" />
    <path d={girl ? 'M-20 48Q0 37 20 48L27 79H-27Z' : 'M-21 48Q0 37 21 48L23 79H-23Z'} fill={shirt} />
    <path d={wave || raised ? 'M-19 51L-33 34L-32 8' : 'M-19 51L-28 74'} stroke={skin} strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M19 51L28 73" stroke={skin} strokeWidth="9" fill="none" strokeLinecap="round" />
    <circle cy="24" r="22" fill={skin} /><path d="M-22 22Q-24-6 2 0Q26 1 22 24L13 10Q-1 19-16 11Z" fill={hair} />
    <path d="M-9 25h1m17 0h1" stroke={hair} strokeWidth="3" strokeLinecap="round" /><path d="M-5 34Q0 38 5 34" stroke="#a3634c" strokeWidth="2" fill="none" strokeLinecap="round" />
    {girl && <path d="M-23 10l-7-4v11l7-4m46-3l7-4v11l-7-4" fill="#ca7c68" />}
  </g>;
}
function Book({ x, y, size = 1, open = false, color = '#9ab6a0' }: { x: number; y: number; size?: number; open?: boolean; color?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${size})`}>
    {open ? <><path d="M0 5Q-18-4-35 2v43q18-6 35 4q17-10 35-4V2Q18-4 0 5Z" fill="#fffbed" stroke="#a49d79" strokeWidth="2" /><path d="M0 6v41m-25-32l17 3m-17 8l17 3m18-11l17-3m-17 14l17-3" stroke="#b3b58a" strokeWidth="2" strokeLinecap="round" /></> : <><rect x="-20" width="40" height="53" rx="5" fill={color} stroke="#698b73" strokeWidth="2" /><path d="M-13 2v47m8-37h17m-17 8H8" stroke="#edf1da" strokeWidth="2" strokeLinecap="round" /><path d="M-16 48h33" stroke="#eef0df" strokeWidth="3" /></>}
  </g>;
}
function Cat({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M20 32q25-26 25-5q0 12-19 13" stroke="#c69770" strokeWidth="8" fill="none" strokeLinecap="round" /><ellipse cy="31" rx="25" ry="22" fill="#dba97e" /><path d="M-21-3l-2-20l19 13m25 7l2-20l-19 13" fill="#dba97e" stroke="#bb8a64" strokeWidth="1.5" /><ellipse cy="6" rx="24" ry="21" fill="#e6b992" /><path d="M-9 5h1m16 0h1" stroke="#514738" strokeWidth="3" strokeLinecap="round" /><path d="M-4 14l4 4l4-4Z" fill="#a66a57" /><path d="M0 18v5m-17-7l-16-4m16 12l-16 2m50-10l16-4m-16 12l16 2" stroke="#987356" strokeWidth="1.5" fill="none" strokeLinecap="round" /></g>;
}
function Speech({ x, y, children, right = false }: { x: number; y: number; children: ReactNode; right?: boolean }) {
  return <g transform={`translate(${x} ${y})`}><path d={right ? 'M0 0h46q9 0 9 9v28q0 9-9 9H30l-9 10V46H0q-9 0-9-9V9Q-9 0 0 0Z' : 'M0 0h46q9 0 9 9v28q0 9-9 9H16L6 56V46H0q-9 0-9-9V9Q-9 0 0 0Z'} fill="#fffbed" stroke="#b9c4a1" strokeWidth="2" />{children}</g>;
}
function Heart({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return <path d="M0 7C-18-10-24 8 0 25C24 8 18-10 0 7Z" transform={`translate(${x} ${y}) scale(${size})`} fill="#c99177" />;
}
function Cake({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cy="70" rx="58" ry="8" fill="#dbe3ce" /><rect x="-51" y="20" width="102" height="47" rx="10" fill="#ddbf81" stroke="#b79862" strokeWidth="2" /><path d="M-51 26q10-13 20-1t21 0t21 0t20 0t20 1v12q-7 8-15 0q-7-8-15 0q-7 8-15 0q-7-8-15 0q-7 8-15 0q-7-8-15 0Z" fill="#fff4d9" /><path d="M-26 10v-27M0 10v-27m26 27v-27" stroke="#cf9375" strokeWidth="6" strokeLinecap="round" /><path d="M-26-36q-9 10 0 15q9-5 0-15M0-36q-9 10 0 15q9-5 0-15M26-36q-9 10 0 15q9-5 0-15" fill="#e5bd65" /><path d="M-32 56h65" stroke="#eddaab" strokeWidth="3" strokeLinecap="round" /></g>;
}
function Present({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><rect x="-29" y="4" width="58" height="47" rx="5" fill="#dcbf78" stroke="#ba9d63" strokeWidth="2" /><rect x="-33" y="-3" width="66" height="15" rx="4" fill="#e8cd8b" stroke="#ba9d63" strokeWidth="2" /><path d="M-5-2v54H5V-2Z" fill="#c28e76" /><path d="M0-3q-28-26-26-7q2 10 26 7q28-26 26-7q-2 10-26 7Z" fill="#d6a58c" stroke="#ac7861" strokeWidth="2" /></g>;
}

type FamilyRole = 'mother' | 'father' | 'brother' | 'sister' | 'baby' | 'grandfather' | 'grandmother' | 'uncle' | 'aunt' | 'cousin' | 'Lin';
const familyStyle: Record<FamilyRole, { color: string; girl?: boolean; old?: boolean; baby?: boolean }> = {
  mother: { color: '#c78f79', girl: true }, father: { color: '#89a6b3' }, brother: { color: '#86a2bf' }, sister: { color: '#d7a466', girl: true },
  baby: { color: '#edcabc', baby: true }, grandfather: { color: '#aca482', old: true }, grandmother: { color: '#b49aa2', girl: true, old: true },
  uncle: { color: '#b59875' }, aunt: { color: '#a695be', girl: true }, cousin: { color: '#83b2a7', girl: true }, Lin: { color: green },
};
function FamilyTile({ role, x, y, width = 43, height = 41, highlighted = false }: { role: FamilyRole; x: number; y: number; width?: number; height?: number; highlighted?: boolean }) {
  const style = familyStyle[role];
  const radius = Math.min(width * .23, 10);
  return <g transform={`translate(${x} ${role === 'Lin' ? y - 5 : y})`} data-family-role={role} data-highlighted={highlighted} data-anchor={role === 'Lin'}>
    <rect x={-width / 2} y={-height / 2} width={width} height={height} rx="8" fill={highlighted ? '#f8e6ad' : '#fffbed'} stroke={highlighted ? '#ae8842' : role === 'Lin' ? '#658d74' : '#bec8aa'} strokeWidth={highlighted ? 3.5 : role === 'Lin' ? 2.5 : 1.5} />
    {style.girl && <><ellipse cx={-radius + 1} cy="-3" rx="4" ry="9" fill={style.old ? '#beb7a4' : hair} /><ellipse cx={radius - 1} cy="-3" rx="4" ry="9" fill={style.old ? '#beb7a4' : hair} /></>}
    <circle cy="-5" r={radius} fill={skin} />
    {!style.baby && <path d={`M${-radius} -6Q${-radius - 1} ${-radius - 13} 0 ${-radius - 13}Q${radius + 3} ${-radius - 13} ${radius} -5L${radius * .4} -11Q-3-7 ${-radius * .7}-11Z`} fill={style.old ? '#beb7a4' : hair} />}
    <path d={`M${-width * .3} ${height * .38}Q0 0 ${width * .3} ${height * .38}Z`} fill={style.color} />
    <path d="M-4-4h.5m7 0h.5" stroke={hair} strokeWidth="1.5" strokeLinecap="round" />
    {style.baby && <path d="M-8 2q8 7 16 0m-16 3l16 8m-13 1l11-11" stroke="#c9a9a3" strokeWidth="2" fill="none" />}
    {style.old && role === 'grandfather' && <path d="M-7-7h6v5h-6zm8 0h6v5H1m-2-3h2" stroke="#7c8170" strokeWidth="1" fill="none" />}
    {role === 'Lin' && <text y={height / 2 + 12} textAnchor="middle" fontSize="14" fontWeight="600" fontFamily="Georgia,serif" fill={ink}>Lin</text>}
  </g>;
}
function FamilyPicture({ target }: { target: string }) {
  const highlight = (role: FamilyRole) => target === 'all' || role === target;
  const tile = (role: FamilyRole, x: number, y: number, width = 43, height = 41) => <FamilyTile key={role} role={role} x={x} y={y} width={width} height={height} highlighted={highlight(role)} />;
  if (['grandfather', 'grandmother'].includes(target)) return <g data-family-tree="Lin"><path d="M54 44v9h72v-9" data-relationship="partners" fill="none" stroke="#9bac88" strokeWidth="2.5" /><path d="M90 53v9m0 29v15" data-relationship="parent-child" stroke="#879e7b" strokeWidth="2.5" />{tile('grandfather', 54, 26, 39, 35)}{tile('grandmother', 126, 26, 39, 35)}{tile('father', 90, 77, 39, 35)}{tile('Lin', 90, 121, 39, 32)}</g>;
  if (['uncle', 'aunt', 'cousin'].includes(target)) return <g data-family-tree="Lin"><path d="M71 31h29m-15 0v12H42v7m43-7h29v7" data-relationship="siblings" fill="none" stroke="#97a989" strokeWidth="2.2" /><path d="M114 87v8h39v-8" data-relationship="partners" fill="none" stroke="#9bac88" strokeWidth="2.2" /><path d="M42 87v19M133 95v12" data-relationship="parent-child" fill="none" stroke="#879e7b" strokeWidth="2.2" />{tile('grandfather', 71, 18, 29, 28)}{tile('grandmother', 100, 18, 29, 28)}{tile('father', 42, 69, 36, 36)}{tile('uncle', 114, 69, 36, 36)}{tile('aunt', 153, 69, 32, 36)}{tile('Lin', 42, 123, 36, 31)}{tile('cousin', 132, 123, 36, 31)}</g>;
  const children: FamilyRole[] = target === 'baby' ? ['Lin', 'baby'] : target === 'all' ? ['brother', 'Lin', 'sister', 'baby'] : target === 'brother' || target === 'sister' ? ['brother', 'Lin', 'sister'] : ['Lin'];
  const locations = children.length === 4 ? [27, 69, 111, 153] : children.length === 3 ? [34, 90, 146] : children.length === 2 ? [55, 125] : [90];
  return <g data-family-tree="Lin">{target === 'all' && <rect x="8" y="10" width="164" height="130" rx="18" fill="#e6edda" stroke="#c3b374" strokeWidth="2" />}<path d="M56 67v12h68V67" data-relationship="partners" fill="none" stroke="#9bac88" strokeWidth="2.5" /><path d={`M90 79v9M${locations[0]} 88H${locations[locations.length - 1]}`} data-relationship="parent-child" fill="none" stroke="#879e7b" strokeWidth="2.5" />{locations.map(x => <path key={x} d={`M${x} 88v14`} data-relationship="parent-child" stroke="#879e7b" strokeWidth="2.5" />)}{tile('father', 56, 44)}{tile('mother', 124, 44)}{children.map((role, i) => tile(role, locations[i], 120, children.length === 4 ? 35 : 42, 34))}</g>;
}

function BasketScene({ inside }: { inside: boolean }) {
  return <g><rect x="14" y="18" width="152" height="112" rx="12" fill="#e4ead8" /><path d="M16 115h147" stroke="#ced7bd" strokeWidth="4" />{inside ? <Cat x={66} y={68} scale={.76} /> : <Cat x={129} y={86} scale={.73} />}<path d="M19 82h88l-11 37H30Z" fill="#dec08b" stroke="#b39a6a" strokeWidth="2" /><path d="M21 84h85m-77 9h73m-69 10h66m-61 10h57m-60-26l8 28m11-28l4 28m12-28v28m13-28l-4 28m13-28l-8 28" stroke="#bba477" strokeWidth="1.5" /><path d="M29 82q35-37 70 0" fill="none" stroke="#af9466" strokeWidth="4" /></g>;
}
function GroupScene({ kind }: { kind: 'we' | 'friend' | 'together' | 'alone' | 'class-team' | 'class-team-1' }) {
  if (kind === 'alone') return <g><path d="M25 130h132" stroke="#ced8bd" strokeWidth="4" strokeLinecap="round" /><Figure x={90} y={26} /><text x="90" y="145" textAnchor="middle" fontSize="16" fill={ink} fontFamily="Georgia,serif">Lin</text></g>;
  if (kind === 'class-team' || kind === 'class-team-1') return <g><rect x="17" y="12" width="146" height="117" rx="16" fill="#e5ecda" stroke="#a7b791" strokeWidth="3" /><rect x="66" y="8" width="48" height="27" rx="8" fill="#d8bf7b" /><text x="90" y="28" textAnchor="middle" fontSize="20" fontWeight="600" fill="#74663d">{kind === 'class-team-1' ? 1 : 2}</text>{[47, 91, 135].map((x, i) => <Figure key={x} x={x} y={i === 1 ? 39 : 51} scale={.6} girl={i === 2} shirt={i === 0 ? green : i === 2 ? yellow : '#a1afba'} />)}<path d="M35 127h110" stroke="#b2bda0" strokeWidth="4" strokeLinecap="round" /></g>;
  return <g>{kind === 'we' && <rect x="19" y="38" width="143" height="101" rx="16" fill="#e6edda" stroke="#96ad81" strokeWidth="3" />}{kind === 'friend' && <rect x="96" y="24" width="64" height="108" rx="15" fill="#ecebd1" stroke="#c1a36b" strokeWidth="3" />}<Figure x={kind === 'together' ? 42 : 51} y={39} scale={.8} wave={kind === 'friend'} /><Figure x={kind === 'together' ? 135 : 130} y={39} scale={.8} girl shirt={yellow} />{kind === 'together' && <><Figure x={89} y={33} scale={.85} shirt="#9faabd" /><path d="M64 91h4m44 0h2" stroke={skin} strokeWidth="7" strokeLinecap="round" /></>}{(kind === 'we' || kind === 'friend') && <Speech x={64} y={8}><path d="M10 19h2m10 0h2m10 0h2" stroke="#8da17a" strokeWidth="4" strokeLinecap="round" /></Speech>}<text x={kind === 'together' ? 42 : 51} y="138" textAnchor="middle" fontSize="14" fontFamily="Georgia,serif" fill={ink}>Lin</text></g>;
}
function Response({ yes, ok = false }: { yes: boolean; ok?: boolean }) {
  return <g><Figure x={50} y={43} scale={.75} /><Figure x={129} y={43} scale={.75} girl shirt={yellow} /><Speech x={18} y={7}><text x="24" y="34" textAnchor="middle" fontSize="33" fontWeight="600" fill={ink}>?</text></Speech><Speech x={106} y={9} right>{yes ? <path d="M4 24l11 11l23-26" stroke={ok ? '#6e967e' : '#648868'} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M8 11l27 25M35 11L8 36" stroke="#be9075" strokeWidth="6" strokeLinecap="round" />}</Speech>{yes ? <path d="M150 71l4 4m-4 7l4 4" stroke="#9db294" strokeWidth="2" strokeLinecap="round" /> : <path d="M108 69l-4 2m42-2l4 2" stroke="#be9075" strokeWidth="2" strokeLinecap="round" />}</g>;
}
function Social({ kind }: { kind: 'help' | 'gift' | 'thanks' | 'welcome' | 'sorry' }) {
  return <g><Figure x={48} y={31} scale={.85} /><Figure x={136} y={31} scale={.85} girl shirt={yellow} />{kind === 'gift' ? <><Present x={92} y={75} scale={.7} /><path d="M65 89h8m37 0h10" stroke={skin} strokeWidth="7" strokeLinecap="round" /><Heart x={90} y={20} size={.65} /></> : kind === 'help' ? <><rect x="77" y="87" width="35" height="34" rx="4" fill="#d7bd84" stroke="#b89e6e" strokeWidth="2" /><path d="M92 90v27m-14-13h33" stroke="#c2a575" strokeWidth="2" /><path d="M65 90l15 12m-11-8l9 19m40-23l-9 12" stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M81 125l10-2m8 2l11-2" stroke="#aaba92" strokeWidth="3" strokeLinecap="round" /></> : kind === 'sorry' ? <><g transform="translate(84 98) rotate(16)"><Book x={0} y={0} size={.5} /></g><path d="M82 75l7-5l-1 8l8 1l-7 4" stroke="#c7a56e" strokeWidth="2.5" fill="none" /><Speech x={38} y={6}><path d="M5 29q17 10 33 0M8 12v7m26-7v7" stroke="#9d9272" strokeWidth="2" fill="none" strokeLinecap="round" /></Speech><path d="M61 79l25-2" stroke={skin} strokeWidth="6" strokeLinecap="round" /></> : <><Book x={132} y={76} size={.56} /><Speech x={kind === 'thanks' ? 108 : 25} y={7} right={kind === 'thanks'}>{kind === 'thanks' ? <Heart x={24} y={8} size={.78} /> : <path d="M5 27q18-21 36 0M13 15v-5m19 5v-5" stroke="#92a47a" strokeWidth="3" fill="none" strokeLinecap="round" />}</Speech><path d={kind === 'thanks' ? 'M115 80l9 7l9-7' : 'M61 80l14-9m-2 0l3 4'} stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" /><circle cx={kind === 'thanks' ? 140 : 43} cy="60" r="4" fill="#efdab0" opacity=".65" /></>}</g>;
}
function Action({ kind }: { kind: 'clean' | 'draw' | 'sing' | 'dance' | 'photo' }) {
  return <g>{kind === 'dance' ? <g transform="translate(88 79) rotate(-14) translate(-88 -79)"><Figure x={88} y={27} scale={.85} girl shirt={yellow} wave /><path d="M109 88l22-13" stroke={skin} strokeWidth="7" fill="none" strokeLinecap="round" /></g> : <Figure x={kind === 'photo' ? 116 : 69} y={29} scale={.9} />}{kind === 'clean' ? <><path d="M96 80v48m59-48v48" stroke="#9c865e" strokeWidth="7" strokeLinecap="round" /><path d="M96 68h55l15 17H83Z" fill="#d1b47b" stroke="#af9564" strokeWidth="2.5" /><path d="M87 85h75v6H87Z" fill="#bca16c" /><ellipse cx="145" cy="76" rx="9" ry="3" fill="#9d815a" opacity=".5" /><circle cx="153" cy="79" r="2" fill="#9d815a" opacity=".5" /><rect x="108" y="72" width="27" height="12" rx="4" fill="#b5d4c7" stroke="#759c8b" strokeWidth="2" /><path d="M112 78h19m-11-4v8" stroke="#e1eee2" strokeWidth="1.5" /><path d="M86 72l28 5" stroke={skin} strokeWidth="7" strokeLinecap="round" /><path d="M99 65h16m20-3h12M148 43v12m-6-6h12" stroke="#d6bb75" strokeWidth="2.5" strokeLinecap="round" /></> : kind === 'draw' ? <><path d="M83 87h75m-66 0v42m57-42v42" stroke="#b6a071" strokeWidth="7" strokeLinecap="round" /><path d="M97 70l42-9l13 21l-41 4Z" fill="#fffbed" stroke="#d0c6a0" strokeWidth="2" /><path d="M118 66l-15 19" stroke="#c49368" strokeWidth="4" strokeLinecap="round" /><path d="M125 77l4-5l9 5" stroke="#9dad85" strokeWidth="2" fill="none" /><path d="M86 73l21 0" stroke={skin} strokeWidth="7" strokeLinecap="round" /></> : kind === 'sing' ? <><ellipse cx="69" cy="61" rx="4" ry="3.5" fill="#a66e53" /><path d="M96 73h24v45m-11-4h23" stroke="#839880" strokeWidth="3" strokeLinecap="round" /><rect x="101" y="50" width="15" height="26" rx="7" fill="#658574" stroke="#40654d" strokeWidth="2" /><path d="M134 22v32m0-32l22 5v28" stroke="#b59c58" strokeWidth="3" fill="none" /><ellipse cx="127" cy="55" rx="8" ry="5" fill="#b59c58" /><ellipse cx="149" cy="57" rx="8" ry="5" fill="#b59c58" /><path d="M83 65l23 4" stroke={skin} strokeWidth="7" strokeLinecap="round" /></> : kind === 'dance' ? <><path d="M31 64q-17 18-4 31m123-53q17 15 6 28" stroke="#bbc89e" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M39 27v27l17-6V20Z" fill="#ccb065" /><ellipse cx="32" cy="55" rx="8" ry="5" fill="#ccb065" /><path d="M52 126l11 7m62-2l10-7" stroke="#a4b593" strokeWidth="3" strokeLinecap="round" /></> : <><rect x="91" y="58" width="45" height="28" rx="5" fill="#8aab96" stroke="#5e8067" strokeWidth="2" /><circle cx="113" cy="73" r="10" fill="#efead2" stroke="#5e8067" strokeWidth="3" /><rect x="126" y="63" width="5" height="4" rx="1" fill="#dfc379" /><path d="M66 51l-8-8m9 24H52m12 7l-9 9" stroke="#d9bc6d" strokeWidth="3" strokeLinecap="round" /><rect x="16" y="88" width="54" height="43" rx="4" fill="#fffbed" stroke="#b4bd9b" strokeWidth="2" /><path d="M23 122l12-15l11 11l9-7l9 11Z" fill="#a6c0a2" /><circle cx="55" cy="99" r="5" fill="#e2c77a" /></>}</g>;
}

function drawingFor(picture: EnglishExtensionPictureKey): ReactNode {
  if (picture.startsWith('family-')) return <FamilyPicture target={picture.slice(7)} />;
  if (picture.startsWith('number-')) {
    const count = Number(picture.slice(7));
    return <g><text x="39" y="93" textAnchor="middle" fontSize={count === 10 ? 43 : 58} fontWeight="600" fontFamily="Georgia,serif" fill="#6d8a68">{count}</text><rect x="76" y="29" width="91" height="90" rx="12" fill="#fffbed" stroke="#d8ddc4" strokeWidth="2" />{Array.from({ length: count }, (_, i) => <circle key={i} data-count-dot cx={90 + i % 5 * 16} cy={count > 5 ? 54 + Math.floor(i / 5) * 39 : 75} r="6" fill={i < 5 ? '#94b091' : '#d7bb73'} />)}</g>;
  }
  switch (picture) {
    case 'identity-lin': case 'identity-lan': { const lan = picture === 'identity-lan'; return <g><Figure x={48} y={35} scale={.83} girl={lan} shirt={lan ? yellow : green} /><rect x="87" y="38" width="75" height="79" rx="11" fill="#fffbed" stroke={lan ? '#c4a66b' : '#93ac91'} strokeWidth="2.5" /><circle cx="123" cy="61" r="13" fill={lan ? '#ead29b' : '#cadcc5'} /><circle cx="123" cy="57" r="7" fill={skin} /><path d="M113 71q10-15 20 0" fill={lan ? yellow : green} /><text x="124" y="101" textAnchor="middle" fontSize="26" fontFamily="Georgia,serif" fill={ink}>{lan ? 'Lan' : 'Lin'}</text></g>; }
    case 'answer-yes': return <Response yes />;
    case 'answer-no': return <Response yes={false} />;
    case 'inside': return <BasketScene inside />;
    case 'outside': return <BasketScene inside={false} />;
    case 'we': case 'friend': case 'together': case 'alone': case 'class-team': case 'class-team-1': return <GroupScene kind={picture} />;
    case 'here-i-am': return <g><rect x="97" y="21" width="66" height="59" rx="6" fill="#628674" stroke="#c2ae7c" strokeWidth="3" /><path d="M108 39h41m-41 14h28" stroke="#eff1df" strokeWidth="3" strokeLinecap="round" /><Figure x={64} y={33} scale={.9} raised /><text x="64" y="143" textAnchor="middle" fontSize="16" fontFamily="Georgia,serif" fill={ink}>Lin</text><path d="M43 19v-7m-7 10l-6-3m20-3l6-4" stroke="#d4b76c" strokeWidth="2.5" strokeLinecap="round" /></g>;
    case 'sorry': case 'help': case 'gift': case 'thanks': case 'welcome': return <Social kind={picture} />;
    case 'many': return <g>{[34, 89, 144].map((x, i) => <g key={x}><Book x={x} y={19} size={.72} color={i === 1 ? '#d9bf83' : '#9ab6a0'} /><Book x={x} y={84} size={.72} color={i === 1 ? '#b7a7bd' : '#d3b786'} /></g>)}</g>;
    case 'have': return <g><Figure x={90} y={25} /><Book x={90} y={72} size={.69} /><path d="M66 87l13 3m23 0l12-3" stroke={skin} strokeWidth="8" strokeLinecap="round" /><text x="90" y="142" textAnchor="middle" fontSize="16" fontFamily="Georgia,serif" fill={ink}>Lin</text></g>;
    case 'evening': return <g><rect x="17" y="12" width="146" height="73" rx="14" fill="#82998d" /><path d="M140 23a20 20 0 1 0 7 28a17 17 0 0 1-7-28Z" fill="#f0dda1" /><path d="M44 29v8m-4-4h8m20 9v7m-4-3h8m31-18v7m-4-3h8" stroke="#dae3bd" strokeWidth="2" strokeLinecap="round" /><Figure x={53} y={59} scale={.67} wave /><Figure x={130} y={59} scale={.67} girl shirt={yellow} wave /><rect x="57" y="15" width="63" height="26" rx="7" fill="#fffbed" /><text x="89" y="35" textAnchor="middle" fontSize="19" fontWeight="600" fill={ink}>19:00</text></g>;
    case 'car': return <g><ellipse cx="91" cy="126" rx="65" ry="6" fill="#dbe3ce" /><path d="M34 76l18-33h61l22 33h15q10 0 10 12v25H20V88q0-12 14-12Z" fill="#8faf98" stroke="#5d826d" strokeWidth="3" /><path d="M57 49l-13 27h38V49Zm33 0v27h32l-17-27Z" fill="#e5ecd9" /><circle cx="50" cy="112" r="16" fill="#667e69" /><circle cx="130" cy="112" r="16" fill="#667e69" /><circle cx="50" cy="112" r="7" fill="#d7d9be" /><circle cx="130" cy="112" r="7" fill="#d7d9be" /><path d="M27 90h12m104 0h10M92 88h10" stroke="#e9ddaf" strokeWidth="4" strokeLinecap="round" /></g>;
    case 'book': return <Book x={90} y={37} size={1.65} />;
    case 'ball': return <g><ellipse cx="90" cy="129" rx="47" ry="6" fill="#dbe3ce" /><circle cx="90" cy="79" r="45" fill="#e2c57e" stroke="#be9f60" strokeWidth="3" /><path d="M52 55Q114 62 113 119M65 42Q94 79 49 94M126 50Q82 84 107 120" stroke="#8fae96" strokeWidth="10" fill="none" /><path d="M90 35Q71 80 131 99" stroke="#f9e8b9" strokeWidth="6" fill="none" /></g>;
    case 'cake': return <Cake x={90} y={67} />;
    case 'birthday': return <g><path d="M22 24q63 25 136 0" stroke="#b5bf98" strokeWidth="2" fill="none" /><path d="M33 27l14 3l-10 14Zm32 6l15 1l-8 17Zm37 0l15-1l-6 17Zm33-5l15-3l-2 17Z" fill="#d9bc73" /><Figure x={40} y={52} scale={.67} /><Figure x={141} y={52} scale={.67} girl shirt={yellow} /><Cake x={90} y={93} scale={.55} /><path d="M59 140h67m-60 0v7m51-7v7" stroke="#b4a273" strokeWidth="5" strokeLinecap="round" /></g>;
    case 'action-clean': return <Action kind="clean" />;
    case 'action-draw': return <Action kind="draw" />;
    case 'action-sing': return <Action kind="sing" />;
    case 'action-dance': return <Action kind="dance" />;
    case 'action-photo': return <Action kind="photo" />;
    case 'table': return <g><ellipse cx="90" cy="130" rx="64" ry="6" fill="#dbe3ce" /><path d="M35 65v61m24-48v38m87-51v61m-25-48v38" stroke="#9c845c" strokeWidth="10" strokeLinecap="round" /><path d="M24 45h132l13 32H12Z" fill="#d2b67a" stroke="#ac925e" strokeWidth="3" /><path d="M15 77h151v11H15Z" fill="#bea268" /></g>;
    case 'picture': return <g><rect x="21" y="27" width="138" height="102" rx="9" fill="#d6bd83" stroke="#b39a65" strokeWidth="3" /><rect x="31" y="37" width="118" height="82" rx="3" fill="#e4ecdd" /><circle cx="120" cy="56" r="12" fill="#e6c982" /><path d="M31 101l32-40l34 37l17-22l35 35v8H31Z" fill="#96b196" /><path d="M32 111q40-15 116 0v8H32Z" fill="#b4c6a1" /><path d="M80 18l10-6l10 6" stroke="#aa9a6d" strokeWidth="3" fill="none" /></g>;
    case 'child': return <g><path d="M23 133h134" stroke="#ced8bd" strokeWidth="4" strokeLinecap="round" /><Figure x={90} y={29} scale={.84} shirt="#a4b4a7" /><path d="M131 38v77m-7-73h14m-14 18h9m-9 20h14m-14 20h9" stroke="#b9ac81" strokeWidth="2" strokeLinecap="round" /></g>;
    case 'ok': return <Response yes ok />;
    default: throw new Error(`Unknown English extension picture: ${picture}`);
  }
}

/** New course art is isolated so the original Unit 1–2 pictures render unchanged. */
export default function EnglishExtensionPicture({ picture, description, decorative = false, className = '' }: Props) {
  const titleId = useId();
  const number = picture.startsWith('number-') ? Number(picture.slice(7)) : undefined;
  return <svg className={`english-picture ${className}`} data-picture={picture} data-count={number} data-family-target={picture.startsWith('family-') ? picture.slice(7) : undefined} viewBox="0 0 180 150" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : titleId} focusable="false">
    {!decorative && <title id={titleId}>{description}</title>}
    <ellipse cx="90" cy="76" rx="83" ry="68" fill="#f4f2df" />
    {drawingFor(picture)}
  </svg>;
}
