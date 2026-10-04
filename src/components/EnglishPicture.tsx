import { useId } from 'react';

export type PictureKey = string;

interface Props {
  picture: PictureKey;
  description?: string;
  decorative?: boolean;
  className?: string;
  nameLabel?: 'Lan' | 'Lin';
}

function Person({ x, y = 25, shirt = '#6c9c84', girl = false, adult = false, waving = false }: {
  x: number; y?: number; shirt?: string; girl?: boolean; adult?: boolean; waving?: boolean;
}) {
  return <g transform={`translate(${x} ${y})`}>
    {girl && <><ellipse cx="-17" cy="24" rx="8" ry="15" fill="#554339" /><ellipse cx="17" cy="24" rx="8" ry="15" fill="#554339" /></>}
    <path d="M-17 78v19m34-19v19" fill="none" stroke="#594e42" strokeWidth="9" strokeLinecap="round" />
    <path d="M-17 99h-8m42 0h8" stroke="#315e56" strokeWidth="8" strokeLinecap="round" />
    <path d={girl && adult ? 'M-17 45Q0 38 17 45L26 81H-26Z' : 'M-21 48Q0 37 21 48L23 79H-23Z'} fill={shirt} />
    <path d={waving ? 'M-19 51L-35 37L-36 19' : 'M-19 51L-27 76'} fill="none" stroke="#dcac87" strokeWidth="9" strokeLinecap="round" />
    <path d="M19 51L27 73" fill="none" stroke="#dcac87" strokeWidth="9" strokeLinecap="round" />
    <circle cy="24" r="22" fill="#e6bc96" />
    <path d="M-22 22Q-24-6 2 0Q26 1 22 24L13 10Q-1 19-16 11Z" fill="#554339" />
    <path d="M-10 25h1m18 0h1" stroke="#554339" strokeWidth="3" strokeLinecap="round" />
    <path d="M-5 34Q0 38 5 34" fill="none" stroke="#a3634c" strokeWidth="2" strokeLinecap="round" />
    <circle cx="-13" cy="32" r="3" fill="#d88e79" opacity=".45" /><circle cx="13" cy="32" r="3" fill="#d88e79" opacity=".45" />
    {adult && <path d="M-17 23h13v9h-13zm21 0h13v9H4zm-8 3h8" fill="none" stroke="#5d6d59" strokeWidth="1.6" />}
    {girl && <path d="M-23 10l-8-4v11l8-4m46-3l8-4v11l-8-4" fill="#ca7c68" />}
  </g>;
}

function Sun({ x = 115, y = 33, size = 17 }: { x?: number; y?: number; size?: number }) {
  return <g transform={`translate(${x} ${y})`} stroke="#dbb459" strokeWidth="3" strokeLinecap="round">
    <circle r={size} fill="#f2d47c" stroke="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => <path key={angle} d={`M0 ${-size - 5}v-5`} transform={`rotate(${angle})`} />)}
  </g>;
}

function Clock({ afternoon }: { afternoon: boolean }) {
  return <g transform="translate(43 72)"><circle r="25" fill="#fffdf2" stroke="#8b9f7b" strokeWidth="3" /><path d={afternoon ? 'M0-17V0h14' : 'M0-17V0L-12 9'} fill="none" stroke="#5d775e" strokeWidth="3" strokeLinecap="round" /><circle r="3" fill="#c49b59" /></g>;
}

/** Original SVG story pictures. No English answer word is painted into a listening option. */
export default function EnglishPicture({ picture, description = '英语故事插图', decorative = false, className = '', nameLabel = 'Lan' }: Props) {
  const titleId = useId();
  let drawing;
  if (picture === 'cat') {
    drawing = <g><ellipse cx="94" cy="119" rx="47" ry="7" fill="#dbe3ce" /><path d="M113 96q40-37 36-8q-3 12-23 16" fill="none" stroke="#ca9670" strokeWidth="12" strokeLinecap="round" /><ellipse cx="86" cy="96" rx="36" ry="29" fill="#dca77c" /><path d="M62 51L58 25L80 39m26 12l7-26l-23 14" fill="#dca77c" stroke="#bb805e" strokeWidth="2" /><path d="M64 46L63 33L74 41m28 5l6-13l-13 8" fill="#edc8ad" /><ellipse cx="86" cy="63" rx="31" ry="28" fill="#e4b38b" /><path d="M74 62h1m21 0h1" stroke="#514738" strokeWidth="4" strokeLinecap="round" /><path d="M82 72l4 4l4-4z" fill="#a96757" /><path d="M86 76v5m0-1q-8 6-12 0m12 0q8 6 12 0M62 70l-18-4m18 11l-19 2m67-9l18-4m-18 11l19 2" fill="none" stroke="#9a7558" strokeWidth="1.7" strokeLinecap="round" /><path d="M67 113v9m29-9v9" stroke="#ca9670" strokeWidth="10" strokeLinecap="round" /></g>;
  } else if (picture === 'morning' || picture === 'afternoon') {
    const afternoon = picture === 'afternoon';
    drawing = <g><path d="M14 107q39-20 78 0t74 0v20H14Z" fill="#dbe4ca" /><Sun x={119} y={afternoon ? 35 : 83} size={afternoon ? 19 : 21} /><path d="M85 102h79" stroke="#9aac8e" strokeWidth="2" /><Clock afternoon={afternoon} />{!afternoon && <path d="M132 31q5-6 10 0q5-6 10 0M98 24q4-5 8 0q4-5 8 0" fill="none" stroke="#829e91" strokeWidth="2" />}{afternoon && <path d="M74 92h30l-5 18H79Z" fill="#b8cdb5" />}</g>;
  } else if (picture === 'hello' || picture === 'goodbye') {
    const goodbye = picture === 'goodbye';
    drawing = <g><ellipse cx="91" cy="132" rx="64" ry="7" fill="#dbe3ce" /><Person x={52} y={23} shirt="#8ca893" waving />{goodbye ? <><g transform="translate(130 23)"><path d="M-13 74l-8 26m33-26l13 24" stroke="#594e42" strokeWidth="9" strokeLinecap="round" /><path d="M-21 47Q0 38 21 47l3 32h-48Z" fill="#d5b263" /><path d="M-20 51l-12-23m51 23l11 19" stroke="#dcae88" strokeWidth="9" strokeLinecap="round" /><circle cy="24" r="22" fill="#59483b" /><rect x="-16" y="49" width="32" height="33" rx="8" fill="#a9bab0" stroke="#6c8a78" strokeWidth="2" /><path d="M-8 68H8" stroke="#6c8a78" strokeWidth="2" /></g><path d="M88 40h21m-6-6l6 6l-6 6" stroke="#99b39a" strokeWidth="3" fill="none" strokeLinecap="round" /></> : <><Person x={130} y={23} shirt="#d5b263" girl waving /><path d="M82 30q7-8 14 0m-8 9h8" fill="none" stroke="#d5b263" strokeWidth="3" strokeLinecap="round" /></>}</g>;
  } else if (['teacher-woman', 'teacher-man', 'class'].includes(picture)) {
    drawing = <g><rect x="18" y="17" width="100" height="63" rx="5" fill="#638b75" stroke="#c5ac79" strokeWidth="5" /><path d="M31 37h55m-55 13h36m-36 13h46" stroke="#eff2df" strokeWidth="3" strokeLinecap="round" />{picture === 'class' ? <><Person x={137} y={29} shirt="#cfb066" adult girl /><g transform="translate(32 116)"><circle r="14" fill="#ddb794" /><path d="M-14-3q0-18 14-14q15 0 14 15" fill="#5e4a3c" /><path d="M-23 18q23-22 46 0" fill="#9bb6a4" /></g><g transform="translate(82 120)"><circle r="13" fill="#ddb794" /><path d="M-13-3q0-18 13-14q15 0 13 15" fill="#5e4a3c" /><path d="M-23 18q23-22 46 0" fill="#d1b678" /></g></> : <Person x={130} y={27} shirt="#cfb066" adult girl={picture === 'teacher-woman'} />}</g>;
  } else if (picture === 'my' || picture === 'your') {
    const yours = picture === 'your';
    drawing = <g><ellipse cx="90" cy="134" rx="64" ry="7" fill="#dbe3ce" /><Person x={51} y={28} shirt="#8ca893" /><Person x={133} y={28} shirt="#d5b263" girl /><path d="M78 43q7 7 0 14m7-20q12 13 0 26" fill="none" stroke="#9aad81" strokeWidth="3" strokeLinecap="round" /><rect x="20" y="84" width="27" height="32" rx="5" fill="#9dbeb1" stroke="#6b9280" strokeWidth="2" /><path d="M26 85v-8h15v8" fill="none" stroke="#6b9280" strokeWidth="2" /><rect x="129" y="84" width="27" height="32" rx="5" fill="#ecd192" stroke="#c4a365" strokeWidth="2" /><path d="M135 85v-8h15v8" fill="none" stroke="#c4a365" strokeWidth="2" /><path d={yours ? 'M73 71Q102 69 134 93m-1-10l1 10l-11-1' : 'M65 70Q58 74 36 92m1-11l-1 11l11-1'} fill="none" stroke="#c98259" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /><ellipse cx={yours ? 142 : 33} cy="121" rx="18" ry="4" fill="#ddaa5d" opacity=".45" /></g>;
  } else if (['name', 'name-question', 'name-answer'].includes(picture)) {
    drawing = <g><Person x={45} y={27} shirt="#8ca893" /><rect x="88" y="45" width="74" height="67" rx="8" fill="#fffdf1" stroke="#cabb99" strokeWidth="2.5" /><rect x="88" y="45" width="74" height="15" rx="7" fill="#d8bf7d" /><circle cx="105" cy="78" r="8" fill="#b8cab4" /><path d="M96 93q10-15 19 0" fill="none" stroke="#93aa8c" strokeWidth="3" strokeLinecap="round" /><text x="118" y="87" fontSize="17" fill="#54775e" fontFamily="Georgia,serif">{nameLabel}</text>{picture === 'name-question' && <g transform="translate(83 11)"><path d="M0 0h47q9 0 9 10v22q0 9-9 9H25L13 49v-8H0q-9 0-9-9V10Q-9 0 0 0" fill="#e5edda" /><text x="18" y="29" fontSize="27" fill="#54775e" fontFamily="Georgia,serif">?</text></g>}</g>;
  } else if (picture === 'listening-speaker') {
    drawing = <g><ellipse cx="90" cy="134" rx="44" ry="7" fill="#dbe3ce" /><Person x={90} y={26} shirt="#8ca893" /><path d="M62 55V45a28 28 0 0 1 56 0v10" fill="none" stroke="#d2b375" strokeWidth="7" strokeLinecap="round" /><rect x="58" y="48" width="10" height="24" rx="5" fill="#8aa793" /><rect x="112" y="48" width="10" height="24" rx="5" fill="#8aa793" /></g>;
  } else if (picture === 'boy' || picture === 'girl' || picture === 'self') {
    drawing = <g><ellipse cx="90" cy="134" rx="44" ry="7" fill="#dbe3ce" /><Person x={90} y={26} shirt={picture === 'girl' ? '#d5b263' : '#8ca893'} girl={picture === 'girl'} />{picture === 'self' && <><path d="M65 92l20-9m-7-3l7 3l-4 6" fill="none" stroke="#c98259" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><path d="M132 45q8 7 0 14m7-20q13 14 0 26" fill="none" stroke="#c2b276" strokeWidth="3" strokeLinecap="round" /></>}</g>;
  } else {
    // A neutral harbour scene is safer than an invented answer for a new picture key.
    drawing = <g><Sun x={137} y={35} size={14} /><path d="M20 113q35-12 70 0t70 0m-140 12q35-12 70 0t70 0" fill="none" stroke="#b7cdc2" strokeWidth="5" strokeLinecap="round" /><path d="M45 94h82l-17 22H62Z" fill="#9db9a6" /><path d="M85 91V28L51 83H83m5-50l27 49H88" fill="#ecddb5" stroke="#b5a780" strokeWidth="2" /></g>;
  }
  return <svg className={`english-picture ${className}`} viewBox="0 0 180 150" role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : titleId} focusable="false">
    {!decorative && <title id={titleId}>{description}</title>}
    <ellipse cx="90" cy="76" rx="83" ry="68" fill="#f4f2df" />
    {drawing}
  </svg>;
}
