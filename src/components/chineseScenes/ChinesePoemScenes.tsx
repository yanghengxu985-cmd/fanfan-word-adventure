import { useId, type ReactNode } from 'react';
import './chinesePoemScenes.css';

type Props = { courseId: string; step: number; variant: string; sceneKey?: string; parameter?: number; paused?: boolean };
const ink = '#3f554e';
const poemNames: Record<string, string> = { wangdongting: '洞庭湖的月色、湖面与君山', shanxing: '山路、人家与红枫', yeshusuojian: '秋叶、江风与夜间篱落', luchai: '深林中的人声、夕照与青苔', wangtianmenshan: '两岸青山、江流与行舟观察', yinhushang: '西湖晴天水光与雨中山色' };

function Label({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <text x={x} y={y} fill={ink} fontSize="21" fontFamily="KaiTi, STKaiti, serif" textAnchor="middle">{children}</text>;
}
function Boat({ x, y, scale = 1, sail = false }: { x: number; y: number; scale?: number; sail?: boolean }) {
  return <g data-scene-object="observer-boat" transform={`translate(${x} ${y}) scale(${scale})`} stroke="#65523c" strokeWidth="2.5"><ellipse cy="15" rx="52" ry="8" fill="#577b75" opacity=".15" stroke="none" /><path d="M-55-4Q0 3 55-4L35 16H-35Z" fill="#b68451" /><path d="M-42 3H42" stroke="#ecc996" /><path d="M-13-8Q-8-28 0-26Q12-26 13-8" fill="#638282" /><circle cy="-34" r="9" fill="#d6a37c" />{sail && <g data-scene-object="sail"><path d="M13-5V-91" /><path d="M17-86Q63-49 21-20Z" fill="#f5ead1" /></g>}<path d="M-16-4-51 29" stroke="#67583d" strokeWidth="4" /></g>;
}
function Maple({ x, y, scale = 1, colour = '#b95337' }: { x: number; y: number; scale?: number; colour?: string }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="maple-leaf"><path d="m0 40-9-22-25 6 7-25-28-16 32-8-6-29 25 16 10-42 15 41 26-17-7 32 29 8-27 15 8 24-24-6-14 26Z" fill={colour} stroke="#994832" strokeWidth="1.5" /><path d="M0 45 9-53M4 4-23-17M7-5l28-17M0 26l-20-10" stroke="#f1ba6e" strokeWidth="2" fill="none" /></g>;
}
function Wutong({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} data-scene-object="wutong-leaf"><path d="M0 49Q-18 13-48 8L-29-7-37-34-8-19 2-64 21-26 48-36 35-6 55 7Q24 15 0 49Z" fill="#d3a467" stroke="#9d774b" strokeWidth="2" /><path d="M0 58 2-49M1 14-26-14M2 11 32-15" fill="none" stroke="#f3d098" strokeWidth="2" /></g>;
}

function Luchai({ step, sceneKey, parameter }: Pick<Props, 'step' | 'sceneKey' | 'parameter'>) {
  const light = parameter ?? (step > 1 ? .65 : 0);
  const lit = sceneKey === 'moss' || (!sceneKey && step >= 2);
  const voices = sceneKey === 'voices' || (!sceneKey && step === 1);
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-scenes/luchai-background.webp`;
  return <><g data-scene-object="deep-forest"><g data-scene-object="moss"><image href={source} width="900" height="600" /></g></g>
    {voices && <g data-scene-object="unseen-human-voices" fill="none" stroke="#e5c993" strokeWidth="4"><path d="M714 241q20 15 0 30m16-41q39 26 0 54m16-67q57 39 0 80" /><path d="M675 287q-53 18-97 71" strokeWidth="2" strokeDasharray="4 9" /></g>}
    {lit && light > 0 && <g data-scene-object="sunlight-path" data-light-strength={light}><path d="M778 18 723 25 352 500 540 504Z" fill="#ffe5a0" opacity={light * .27} /><path d="M750 55 446 475" stroke="#ffefb9" strokeWidth={2 + light * 7} opacity={light * .55} /><ellipse cx="453" cy="464" rx="133" ry="48" fill="#f3e9a3" opacity={light * .27} /></g>}
    {voices && <g><rect x="521" y="328" width="326" height="39" rx="10" fill="#fff8e9" opacity=".92" /><Label x={684} y={354}>只闻人声，不见人影</Label></g>}
    {!sceneKey && step === 3 && <g data-scene-object="moss-detail"><rect x="33" y="23" width="310" height="205" rx="12" fill="#fff8e8" stroke="#c2c5a0" /><svg x="40" y="30" width="296" height="161" viewBox="325 361 320 212"><image href={source} width="900" height="600" />{light > 0 && <ellipse cx="453" cy="464" rx="133" ry="48" fill="#f3e9a3" opacity={light * .3} />}</svg><Label x={188} y={216}>近看：青苔上的夕照</Label></g>}
  </>;
}

function Dongting({ step, sceneKey, parameter, uid }: Pick<Props, 'step' | 'sceneKey' | 'parameter'> & { uid: string }) {
  const near = 1 - (parameter ?? (step >= 2 ? .9 : .45));
  const farView = sceneKey === 'island' || (!sceneKey && step >= 2);
  return <><rect width="900" height="600" fill={`url(#${uid}-sky)`} /><path data-scene-object="lake" d="M0 250Q200 220 450 245T900 241V600H0Z" fill={`url(#${uid}-lake)`} /><circle data-scene-object="moon" cx="735" cy="103" r="44" fill="#fff4ce" /><g data-scene-object="moon-reflection" stroke="#fcf1ce" strokeLinecap="round">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${698 - i * 3} ${280 + i * 15}h${50 + i * 6}`} strokeWidth={6 - i * .25} opacity={.65 - i * .035} />)}</g><g data-scene-object="junshan-island" data-island-scale={.55 + near * .35} transform={`translate(430 272) scale(${.55 + near * .35})`}><path d="M-214 5Q-180-31-145-42-124-92-82-59-58-115-22-79 23-118 52-75 109-114 133-49 180-38 208 5Z" fill="#517b61" /><path d="M-180 0Q-114-25-79-11-12-38 58-14 141-35 183 2" fill="#7b9b73" /><path d="M-201 13Q0 48 201 13" stroke="#d4debc" strokeWidth="5" fill="none" /><path d="m-98-43 4 36m24-55 5 57m130-68-6 69m52-43-5 37" stroke="#3d6554" strokeWidth="4" /></g><g stroke="#d2e1d4" strokeWidth="2" opacity=".8">{Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${20 + (i * 127) % 860} ${313 + i * 13}q38-4 81 0`} fill="none" />)}</g>{!farView ? <g data-scene-object="still-lake-surface"><ellipse cx="317" cy="422" rx="172" ry="46" fill="#dde4d1" opacity=".28" /><Label x={303} y={469}>水面平静，月色相映</Label></g> : <g data-scene-object="silver-plate-green-snail" transform="translate(90 370)"><rect width="385" height="158" rx="20" fill="#fff9e9" opacity=".94" stroke="#c0cdb3" /><ellipse cx="115" cy="75" rx="80" ry="30" fill="#eef0db" stroke="#a7b8ac" strokeWidth="3" /><path d="M58 78Q113 91 174 77" stroke="#fffef7" strokeWidth="4" fill="none" /><path d="M243 82C219 65 236 31 262 35 292 38 306 76 284 89 264 101 244 85 254 68 266 51 283 66 273 77" stroke="#527a57" strokeWidth="5" fill="#88a276" /><Label x={194} y={134}>远看：湖如银盘，山如青螺</Label></g>}<Boat x={560 + near * 140} y={345 + near * 170} scale={.5 + near * .3} /><g data-scene-object="observer-route" stroke="#899d91" fill="none" strokeWidth="2" strokeDasharray="6 7"><path d="M558 347Q646 429 714 540" /></g></>;
}

function Tianmen({ step, sceneKey, parameter }: Pick<Props, 'step' | 'sceneKey' | 'parameter'> & { uid: string }) {
  const position = parameter ?? (step / 4);
  const mountains = sceneKey === 'mountains' || (!sceneKey && step === 2);
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-scenes/tianmen-background.webp`;
  return <><g data-scene-object="fixed-left-bank"><g data-scene-object="fixed-right-bank"><g data-scene-object="river"><image href={source} width="900" height="600" /></g></g></g>
    <g data-scene-object="river-flow" stroke="#e2eee0" fill="none" strokeWidth="3" opacity=".74"><path d="M174 504q71 27 115-7M583 470q65 22 108-3" /><path d="m276 487 14 10-18 9m406-42 14 3-14 11" /></g>
    <Boat x={440 + position * 85} y={535 - position * 108} scale={1 - position * .46} sail />
    <g data-scene-object="boat-position" data-observer-position={position} stroke="#fff0b4" strokeWidth="2.5" fill="none"><path d="M440 548Q481 472 525 427" strokeDasharray="7 8" /><path d="m510 434 15-7-2 17" /></g>
    {mountains && <g data-scene-object="viewpoint-comparison" transform="translate(285 37)"><rect width="327" height="127" rx="17" fill="#fff9e9" opacity=".94" stroke="#b2bfa3" /><path d={`M${66 - position * 34} 73 93 29 116 76 130 95H37Z`} fill="#73927a" /><path d={`M${250 + position * 34} 73 230 31 208 76 194 95H290Z`} fill="#73927a" /><path d="M151 94h31" stroke="#82a49a" strokeWidth="7" /><Label x={164} y={115}>船行时，眼前景物位置变化</Label></g>}
  </>;
}

function Night({ step, sceneKey }: { step: number; sceneKey?: string; uid: string }) {
  const leaves = !sceneKey ? step === 0 : ['leaves', 'falling-leaf', 'sound'].includes(sceneKey);
  const wind = !sceneKey ? step === 1 : ['wind', 'river-wind'].includes(sceneKey);
  const cricket = sceneKey === 'cricket' || (!sceneKey && step === 2);
  const lamp = sceneKey === 'lamp' || (!sceneKey && step >= 3);
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-precision/yeshusuojian.webp`;
  const crop = leaves ? '0 0 540 360' : wind ? '360 35 540 360' : '0 0 900 600';
  return <><g data-scene-object={leaves ? 'falling-wutong-leaf' : wind ? 'autumn-river-wind' : 'children-seeking-crickets'}>
    <svg viewBox={crop} width="900" height="600"><image href={source} width="900" height="600" /></svg>
  </g>
    {leaves && <g className="poem-leaf-motion" data-scene-object="wutong-leaf"><Wutong x={698} y={361} scale={.85} /><path d="M701 238q-51 53-9 117" stroke="#e8d5a4" strokeWidth="2" strokeDasharray="5 8" fill="none" /></g>}
    {wind && <g data-scene-object="river-wind-direction" fill="none" stroke="#c6d7d1" strokeWidth="2.5" opacity=".7"><path d="M26 335q93-24 169-4t151-7M474 421q105-29 186-8t181-6" /></g>}
    {(lamp || cricket) && <g data-scene-object="courtyard-fence"><g data-scene-object="fence-lamp"><g data-scene-object="lantern-at-fence">
      <rect x="25" y="20" width="334" height="236" rx="12" fill="#fff8e9" stroke="#c7b695" />
      <svg x="32" y="27" width="320" height="199" viewBox={lamp ? '513 394 161 107' : '500 365 190 126'}><image href={source} width="900" height="600" /></svg>
      <Label x={192} y={245}>{lamp ? '篱边的灯光' : '由灯光想到儿童挑促织'}</Label>
    </g></g></g>}
  </>;
}

function Shanxing({ step, sceneKey }: Pick<Props, 'step' | 'sceneKey'>) {
  const focus = sceneKey || ['road', 'houses', 'carriage', 'red-leaf'][Math.min(step, 3)];
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-precision/shanxing.webp`;
  const crop = focus === 'houses' ? '415 204 295 197' : focus === 'carriage' ? '136 230 295 197' : '52 373 295 197';
  const caption = focus === 'houses' ? '白云深处的人家' : focus === 'carriage' ? '停车，细看眼前的枫林' : '石径沿山坡向上';
  return <g data-scene-object={`mountain-${focus}`}>
    {focus !== 'red-leaf' && <g data-scene-object={focus === 'carriage' ? 'stopped-carriage' : `${focus}-detail`}>
      <rect x="491" y="359" width="367" height="208" rx="16" fill="#fff8e7" opacity=".97" stroke="#c8b591" strokeWidth="2" />
      <svg x="503" y="371" width="343" height="156" viewBox={crop} preserveAspectRatio="xMidYMid slice"><image href={source} width="900" height="600" /></svg>
      <Label x={675} y={552}>{caption}</Label>
    </g>}
    {focus === 'red-leaf' && <g data-scene-object="red-maple-comparison"><rect x="250" y="325" width="409" height="216" rx="22" fill="#fff8e7" opacity=".96" stroke="#bfab88" /><Maple x={373} y={419} scale={1.25} /><g transform="translate(539 416)" data-scene-object="spring-flower"><path d="M0 39V-22m0 39q-43-32-34-20m34 20q41-26 35-14" stroke="#648658" strokeWidth="5" fill="none" />{[0,72,144,216,288].map(r => <ellipse key={r} cx="0" cy="-34" rx="17" ry="23" transform={`rotate(${r} 0 -16)`} fill="#ebadab" />)}<circle cy="-16" r="13" fill="#e1bf73" /></g><Label x={454} y={514}>比较色彩：秋日枫叶更红</Label></g>}
  </g>;
}

export default function ChinesePoemScenes({ courseId, step, variant, sceneKey, parameter, paused }: Props) {
  const uid = `poem-${useId().replace(/:/g, '')}`;
  const source = `${import.meta.env?.BASE_URL ?? '/'}images/chinese-precision/${variant}.webp`;
  const rain = sceneKey === 'rainy' || (!sceneKey && variant === 'yinhushang' && step === 1);
  const sceneLabel = poemNames[variant] || '古诗景物观察';
  return <svg className="chinese-poem-scene" viewBox="0 0 900 600" role="img" aria-label={sceneLabel} data-course={courseId} data-scene-key={sceneKey || `line-${step}`} data-poem={variant} data-paused={paused || undefined}>
    <title>{sceneLabel}</title>
    <defs><linearGradient id={`${uid}-sky`} x2="0" y2="1"><stop stopColor="#b4cfc8" /><stop offset="1" stopColor="#ece6c8" /></linearGradient><linearGradient id={`${uid}-lake`} x2="0" y2="1"><stop stopColor="#769f94" /><stop offset=".6" stopColor="#b0c8b8" /><stop offset="1" stopColor="#7eaaa0" /></linearGradient><linearGradient id={`${uid}-night`} x2="0" y2="1"><stop stopColor="#203f43" /><stop offset="1" stopColor="#607769" /></linearGradient><linearGradient id={`${uid}-mist`} x2="0" y2="1"><stop stopColor="#dce8e7" stopOpacity=".8" /><stop offset="1" stopColor="#a9c2c0" stopOpacity=".1" /></linearGradient><pattern id={`${uid}-paper`} width="27" height="31" patternUnits="userSpaceOnUse"><circle cx="3" cy="5" r=".8" fill="#425c50" opacity=".08" /><circle cx="19" cy="22" r=".7" fill="#ffffff" opacity=".22" /></pattern></defs>
    {variant === 'luchai' ? <Luchai step={step} sceneKey={sceneKey} parameter={parameter} /> : variant === 'wangdongting' ? <Dongting step={step} sceneKey={sceneKey} parameter={parameter} uid={uid} /> : variant === 'wangtianmenshan' ? <Tianmen step={step} sceneKey={sceneKey} parameter={parameter} uid={uid} /> : variant === 'yeshusuojian' ? <Night step={step} sceneKey={sceneKey} uid={uid} /> : <>
      <image href={source} width="900" height="600" preserveAspectRatio="xMidYMid slice" opacity={rain ? .83 : 1} />
      {variant === 'shanxing' ? <Shanxing step={step} sceneKey={sceneKey} /> : rain ? <g data-scene-object="rainy-westlake"><rect width="900" height="430" fill={`url(#${uid}-mist)`} /><g className="poem-rain-motion" stroke="#f0f4ec" strokeWidth="2.2" opacity=".7">{Array.from({ length: 48 }, (_, i) => <path key={i} d={`m${13 + (i * 89) % 873} ${27 + (i * 61) % 515}-10 26`} />)}</g><path d="M40 502q74-12 149 0m283 44q83-11 159 0m78-71q68-8 128 0" fill="none" stroke="#e7ede5" strokeWidth="3" /></g> : <g data-scene-object="sunny-water-glitter" className="poem-water-glitter" fill="#fff6d2">{Array.from({ length: 36 }, (_, i) => <path key={i} d={`m${70 + (i * 137) % 756} ${320 + (i * 47) % 240} l 8 -2 9 2 -9 3 Z`} opacity={.4 + i % 3 * .2} />)}</g>}
      {variant === 'yinhushang' && step === 2 && !sceneKey && <g data-scene-object="two-weather-comparison"><rect x="80" y="380" width="740" height="161" rx="20" fill="#fffaed" opacity=".95" stroke="#b6c5aa" /><g transform="translate(113 408)"><path d="M0 57q125-34 259 0v37H0Z" fill="#aecbbc" /><circle cx="38" cy="19" r="19" fill="#e8c875" /><path d="M36 72h47m20-11h55m26 17h42" stroke="#fff8d6" strokeWidth="5" /></g><g transform="translate(475 408)"><path d="M0 75 56 24 110 65 162 12 250 77Z" fill="#99b3a8" opacity=".6" /><path d="M0 89h266" stroke="#95b8ae" strokeWidth="7" />{[20,78,133,194,249].map(x => <path key={x} d={`m${x} 10-8 22m20 21-8 22`} stroke="#a8c0b9" strokeWidth="2" />)}</g><Label x={450} y={523}>晴天与雨天，各有各的美</Label></g>}
      {variant === 'yinhushang' && step === 3 && !sceneKey && <g data-scene-object="light-and-rich-colour-comparison"><rect x="85" y="360" width="730" height="189" rx="20" fill="#fff9ed" opacity=".95" stroke="#b7c7ac" /><g transform="translate(250 437)"><ellipse rx="91" ry="31" fill="#d0ded0" /><path d="M-76-12-37-59 1-20 34-67 74-11Z" fill="#b5cbbd" /><path d="M-45 11h89" stroke="#f4eed5" strokeWidth="3" /></g><g transform="translate(643 437)"><ellipse rx="91" ry="31" fill="#709a83" /><path d="M-76-12-37-59 1-20 34-67 74-11Z" fill="#4d785f" /><path d="M-45 11h89" stroke="#f3d788" strokeWidth="5" /></g><Label x={253} y={507}>淡：朦胧、柔和</Label><Label x={643} y={507}>浓：鲜明、明亮</Label></g>}
    </>}
    <rect width="900" height="600" fill={`url(#${uid}-paper)`} pointerEvents="none" /><rect x="10" y="10" width="880" height="580" rx="4" fill="none" stroke="#f5ecd3" strokeOpacity=".65" strokeWidth="2" />
  </svg>;
}
