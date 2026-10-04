import { useId } from 'react'

type ShanxingSceneProps = {
  focus: number
  motion?: boolean
}

const mapleLeaves = [
  [542, 352, 0.9, -28], [579, 331, 0.8, 14], [611, 358, 1, 32],
  [666, 327, 0.85, -12], [699, 363, 1.05, 26], [732, 345, 0.8, -30],
  [773, 324, 0.85, 9], [803, 366, 1, -22], [845, 341, 0.8, 35],
  [538, 401, 0.75, 24], [578, 423, 0.95, -18], [623, 402, 0.75, 30],
  [657, 408, 1, -22], [711, 421, 0.85, 8], [750, 390, 0.9, 24],
  [793, 428, 0.85, -30], [831, 402, 0.95, 18], [866, 439, 0.7, -12],
] as const

/** An original illustration of the poem's imagery, rather than a historical reconstruction. */
export default function ShanxingScene({ focus, motion = true }: ShanxingSceneProps) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`
  const paint = (name: string) => `url(#${id(name)})`

  return (
    <svg
      className="shan-scene"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      role="img"
      aria-label="山行诗景：一条弯曲石径通向深秋山间，白云轻绕山中人家，一位旅人停下小车，欣赏傍晚红艳的枫林。"
      data-focus={focus}
      data-motion={motion ? 'on' : 'off'}
    >
      <defs>
        <linearGradient id={id('paper')} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#f9f1de" />
          <stop offset="0.58" stopColor="#f0e6cc" />
          <stop offset="1" stopColor="#e5d9b8" />
        </linearGradient>
        <linearGradient id={id('distant')} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#b9cab6" />
          <stop offset="1" stopColor="#d9dfc9" />
        </linearGradient>
        <linearGradient id={id('mountain')} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor="#729582" />
          <stop offset="0.48" stopColor="#9db19a" />
          <stop offset="1" stopColor="#c4ccb0" />
        </linearGradient>
        <linearGradient id={id('near-mountain')} x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#4d7262" />
          <stop offset="0.62" stopColor="#819878" />
          <stop offset="1" stopColor="#a9ad86" />
        </linearGradient>
        <linearGradient id={id('ground')} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#bcbf92" />
          <stop offset="1" stopColor="#d6c397" />
        </linearGradient>
        <linearGradient id={id('path')} x1="0" y1="0" x2="0.5" y2="1">
          <stop stopColor="#ece5cc" />
          <stop offset="1" stopColor="#f6eacb" />
        </linearGradient>
        <linearGradient id={id('maple')} x1="0" y1="0" x2="0.6" y2="1">
          <stop stopColor="#df7748" />
          <stop offset="0.48" stopColor="#bd4c36" />
          <stop offset="1" stopColor="#9d4435" />
        </linearGradient>
        <linearGradient id={id('sun')} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e5b478" stopOpacity="0.57" />
          <stop offset="1" stopColor="#e5b478" stopOpacity="0.08" />
        </linearGradient>
        <filter id={id('soft')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={id('ink')} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <symbol id={id('leaf')} viewBox="-20 -23 40 48">
          <path d="M0 19 -3 9 -14 12 -11 3 -19 -2 -9 -5 -12 -15 -3 -11 0 -22 4 -10 13 -15 10 -4 19 -1 10 4 13 12 3 9Z" fill="currentColor" />
          <path d="M0 21 0 -10M0 7 -9 -2M0 5 10 -3" fill="none" stroke="#ffe0a3" strokeOpacity="0.35" strokeWidth="0.9" />
        </symbol>
      </defs>

      <rect width="900" height="600" fill={paint('paper')} />
      <circle cx="715" cy="105" r="68" fill={paint('sun')} />
      <ellipse cx="682" cy="146" rx="132" ry="41" fill="#edbc81" opacity="0.11" filter={paint('soft')} />

      {/* Misty ridges recede into the warm paper. The mountain is autumnal, without snow. */}
      <g filter={paint('ink')}>
        <path d="M-28 234 64 150 114 172 193 112 237 146 312 84 345 117 402 73 431 117 471 97 530 151 596 117 649 163 714 134 786 189 834 159 931 217V402H-28Z" fill={paint('distant')} opacity="0.72" />
        <path d="M-25 280C32 255 42 226 88 222L151 165 180 205 234 130 266 164 315 106 351 164 389 128 420 188 474 158 508 211 552 182 589 237 657 193 723 254 790 221 934 299V423H-25Z" fill={paint('mountain')} />
        <path d="M-21 317 40 269 96 284 136 234 174 267 210 221 242 271 285 230 311 264 353 213 382 260 420 246 483 299 536 270 590 300 625 259 675 310 731 292 791 334 847 304 931 361V478H-21Z" fill={paint('near-mountain')} />
      </g>

      <g fill="none" strokeLinecap="round">
        <path d="m236 145-18 62-29 30m123-115-16 65-32 35m103-82-7 45 19 22m-226 38 8 26-21 29m374-46-11 30 13 30m116 8 23 31" stroke="#eef0d8" strokeWidth="2" opacity="0.2" />
        <path d="m64 292 50 40m82-60 48 47m117-92 36 50m-97 7-17 39m246-38 61 50m113-38 49 45" stroke="#344f44" strokeWidth="1.4" opacity="0.17" />
      </g>

      <g className="shan-scene-clouds" fill="#fbf6e8">
        <path d="M92 222c19-15 43-8 59-13 29-10 27-26 52-24 18 1 25 15 47 14 31-1 53-22 83-11 18 7 20 18 45 18 21 0 38-8 60-6 23 2 45 12 56 24-32 0-48 8-79 10-41 3-65-9-104-4-47 6-66 16-112 7-39-8-66 1-107-15Z" opacity="0.78" />
        <path d="M194 293c28-12 54-8 77-13 27-6 46-21 74-16 31 6 44 21 78 19 29-1 61-8 92 3 14 4 22 10 33 18-47-4-66 6-106 6-35 0-53-13-88-9-44 5-66 20-99 9-21-7-35-6-61-17Z" opacity="0.9" />
        <path d="M614 211c21-7 40-3 54-9 20-10 40-16 65-8 26 8 39 19 69 17 23-2 35 3 49 12-24 2-43 3-62 5-28 4-43-3-67-6-36-5-58 7-108-11Z" opacity="0.54" />
      </g>

      {/* A small settlement is tucked into the slope, rather than floating on clouds. */}
      <g className="shan-scene-house" stroke="#5b6251" strokeLinejoin="round">
        <path d="M303 296c22-11 50-14 72-9 18 4 38 16 65 19l-6 12-135-8Z" fill="#939f7d" stroke="none" />
        <path d="M326 267v32l39 4 23-11v-32l-42-5Z" fill="#eee6cc" strokeWidth="1.4" />
        <path d="m365 267 23-7v32l-23 11Z" fill="#d6d2b8" strokeWidth="1" />
        <path d="m316 269 29-26 54 14-27 18Z" fill="#697466" strokeWidth="1.6" />
        <path d="m345 243 27 32-13-3-25-22m38 25 27-18" fill="none" stroke="#424f45" strokeWidth="1.2" />
        <path d="m325 266 27 5m-10 12 12 1v11l-12-1Zm-11-1 5 1v8l-5-1Z" fill="#716e56" strokeWidth="0.7" />
        <path d="m371 277 10-3v9l-10 3Z" fill="#5b6a59" strokeWidth="0.7" />
        <path d="m399 279 30 1v20l-28 3Z" fill="#e9dfc2" strokeWidth="1" />
        <path d="m393 281 14-16 31 9-8 10Z" fill="#727767" strokeWidth="1.2" />
        <path d="m412 287 9 1v12l-9 1Z" fill="#6d6751" strokeWidth="0.8" />
        <path d="m315 291-6-12-2-16m4 12-7-9m7 15 6-11m79 25 5-13 2-12m-3 15-7-5" fill="none" stroke="#4c6550" strokeWidth="2" strokeLinecap="round" />
      </g>

      <path d="M-24 394c83-31 140-28 202-5 68 25 97-31 159-39 45-6 71 18 113 21 65 4 120-42 194-30 94 15 163 58 280 50V620H-24Z" fill={paint('ground')} />
      <path d="M-25 495c100-21 148 11 200 4 66-9 129-71 209-68 83 3 127 69 222 53 81-14 169-15 316 29V621H-25Z" fill="#c5b58b" opacity="0.25" />

      <g className="shan-scene-path">
        <path d="M33 607c28-55 91-93 189-125 61-20 132-25 158-50 29-29-66-35-75-63-6-20 36-44 45-65l9-1c-3 29-31 49-24 62 13 20 112 22 101 60-11 41-104 53-176 83-55 23-107 59-118 99Z" fill={paint('path')} stroke="#a8a184" strokeWidth="1.8" />
        <g fill="none" stroke="#c2b598" strokeWidth="1.7" opacity="0.85">
          <path d="m78 555 42 30m8-57 40 31m14-49 29 29m21-45 26 28m26-42 21 24m25-36 19 21m22-40 24 12m-7-39 37 4m-49-15 30-7m-63-5 18-9m-39-4 19-11m-30-2 20-8m-24-5 23-4m-18-11 24 1m-8-15 20 4m-8-14 14 5m-4-12 10 4" />
          <path d="m101 571 8-21m42-8 11-20m31 4 4-19m55 0-4-16m61-3-2-12m51-5-7-12m35-29 3-9m-44-7-5-9m-42-23-6-11" />
        </g>
        <g fill="#a99e7b" opacity="0.65">
          <path d="m98 487 12-6 14 4-4 6-19 1Zm78-24 8-8 16 2 3 6-23 5Zm86-32 9-4 11 3-2 5-15 1Zm69-84 8-2 7 3-2 4-9-1Z" />
        </g>
      </g>

      <g fill="none" stroke="#788362" strokeLinecap="round" opacity="0.62">
        <path d="m36 461 4-11 3 11m8-5 3-8 4 9m128-68 4-10 3 10m9 2 4-9 1 10m311 107 4-14 5 14m11 5 4-13 3 14m-183 70 4-10 4 10m-118-38 2-10 5 9m-2 58 5-14 3 14" strokeWidth="1.4" />
      </g>

      {/* Maples hold the rich red accent of the fourth line. */}
      <g className="shan-scene-maples">
        <g opacity="0.72" fill="#c77946">
          <path d="M562 346c-18-19-6-37 8-37-1-19 20-30 32-15 19-21 43-6 41 14 25 8 25 32 2 43-14 9-60 15-83-5Z" />
          <path d="M663 325c-13-21 0-35 20-34 8-18 30-24 43-9 24-16 47 0 44 18 25 2 31 28 5 40-28 11-91 9-112-15Z" />
          <path d="M802 337c-17-21-1-44 21-38 18-24 41-15 49 2 24-8 40 8 35 29-7 26-84 31-105 7Z" />
        </g>
        <g fill="none" stroke="#695844" strokeLinecap="round">
          <path d="m567 471 8-91 15-43m-15 43-19-23m23 14 24-21m53 141-5-113-16-40m17 45 27-37m-27 55-31-27m132 98-9-117 15-49m-17 71-30-32m32 16 27-32m83 150-8-106 8-38m-7 39-21-23m20 43 27-29" strokeWidth="5" />
          <path d="m603 375 8 48 3 41m-5-49-20-21m20 12 13-20m80-32 7 40 5 61m-4-41 17-20m-20 1-16-18m128-39 1 68 6 36" strokeWidth="2.5" opacity="0.67" />
        </g>
        <g fill={paint('maple')} filter={paint('ink')}>
          <path d="M511 398c-15-13-10-35 8-43-5-21 14-37 33-29 8-23 29-29 45-12 20-13 43-1 42 18 24 3 31 30 14 45 10 19-6 35-24 31-15 19-38 20-49 7-26 10-52 1-69-17Z" />
          <path d="M635 378c-12-19-3-36 15-40-3-20 14-36 32-29 13-27 39-26 50-6 23-12 43 1 40 22 25 5 32 27 12 44 3 21-16 34-35 28-15 17-37 17-49 3-24 5-49-3-65-22Z" />
          <path d="M758 404c-11-19-2-37 17-40-9-17 5-34 22-36 4-28 31-34 49-13 18-15 41-3 39 19 24 4 29 27 13 42 12 22-9 44-29 35-10 18-40 20-51 5-24 12-42 2-60-12Z" />
          <path d="M544 433c-15-13-4-31 11-31 7-22 28-26 39-10 16-16 38-5 36 12 22 4 21 26 3 36-20 16-67 13-89-7Z" opacity="0.78" />
          <path d="M678 434c-14-13-4-28 10-30 3-24 28-27 39-10 19-11 38 2 33 20 15 9 15 25-2 33-23 10-64 7-80-13Z" opacity="0.77" />
          <path d="M816 448c-11-16-1-31 15-29 11-22 32-21 40-3 22-7 40 6 33 26-13 26-72 26-88 6Z" opacity="0.8" />
        </g>
        <g fill="#ecb569" opacity="0.53">
          <path d="M521 357c7-17 20-20 32-19-8 12-19 17-32 19Zm51-30c8-10 18-11 28-7-6 9-15 11-28 7Zm81 27c6-12 15-15 25-12-5 10-15 14-25 12Zm49-43c9-8 17-7 24-1-9 5-16 8-24 1Zm80 54c7-10 16-14 25-11-3 11-13 14-25 11Zm42-43c9-8 18-8 26-1-7 7-15 9-26 1Zm-267 88c7-10 16-12 25-8-6 9-13 12-25 8Zm140 2c8-7 14-8 24-2-6 6-14 7-24 2Z" />
        </g>
        {mapleLeaves.map(([x, y, scale, angle], index) => (
          <use
            key={index}
            href={`#${id('leaf')}`}
            x={-12}
            y={-14}
            width={24}
            height={29}
            transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
            color={index % 3 === 0 ? '#e9a053' : index % 3 === 1 ? '#9f3e30' : '#e27845'}
            opacity="0.88"
          />
        ))}
      </g>

      {/* A modest horse-drawn cart and a traveller looking toward the maple wood. */}
      <g className="shan-scene-cart" stroke="#534e3d" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="414" cy="463" rx="66" ry="9" fill="#968964" opacity="0.18" stroke="none" />
        <path d="m353 451-8-11-2-13 9-8 13 4 8 15 23 7-5 10-34-2Z" fill="#b1a084" strokeWidth="1.7" />
        <path d="m348 426 1-11 8 8m-10 3-8 8 4 4 9-7m15 6 4 17-5 9m20-15 3 12 7 1m-41-11-1 12-6 2m11-31 8 6" fill="none" strokeWidth="2" />
        <path d="m369 443 42 9m-31-2 26 9" fill="none" stroke="#8a6d48" strokeWidth="2" />
        <path d="m397 420 6 27 45 5 10-24Z" fill="#d4be91" strokeWidth="1.8" />
        <path d="m397 420 60 8m-55 11 49 5m-45-21 3 24m12-21 2 23m13-21-1 22" fill="none" stroke="#94734f" strokeWidth="1.3" />
        <path d="M397 420c7-25 18-33 33-31 20 3 28 17 28 39Z" fill="#ebe0be" strokeWidth="1.7" />
        <path d="M407 420c3-17 8-27 18-29m15 34c0-16-6-29-14-34" fill="none" stroke="#b29b70" strokeWidth="1.2" />
        <circle cx="418" cy="452" r="12" fill="#ece1bf" strokeWidth="2.5" />
        <path d="M406 452h24m-12-12v24m-8-20 16 16m-16 0 16-16" fill="none" strokeWidth="1.3" />
        <circle cx="418" cy="452" r="2.6" fill="#66573f" stroke="none" />
        <path d="m473 449-3-26 8-5 11 7-3 23Z" fill="#637764" strokeWidth="1.2" />
        <path d="m477 448-3 15-7 2m16-17 4 12 7 1m-6-34 8 8 10-9m-32 4-10 9" fill="none" strokeWidth="2" />
        <path d="m477 418 2-7 9 1-2 9Z" fill="#d4b88d" strokeWidth="1" />
        <path d="m473 412 20 2-5-6-11-2Z" fill="#846d47" strokeWidth="1" />
        <path d="m506 425 3 38" fill="none" stroke="#92774f" strokeWidth="1.5" />
      </g>

      <g className="shan-scene-falling-leaves">
        <use href={`#${id('leaf')}`} x="-9" y="-11" width="18" height="22" transform="translate(520 458) rotate(-36)" color="#c44f32" />
        <use href={`#${id('leaf')}`} x="-7" y="-8" width="14" height="17" transform="translate(607 487) rotate(32)" color="#d98242" />
        <use href={`#${id('leaf')}`} x="-8" y="-10" width="16" height="20" transform="translate(751 480) rotate(-19)" color="#ba4c32" />
        <use href={`#${id('leaf')}`} x="-6" y="-7" width="12" height="15" transform="translate(651 453) rotate(63)" color="#e59a50" />
      </g>

      <g fill="#b75836" opacity="0.72">
        <path d="m512 501 10-4 7 4-10 3Zm53 26 12-4 5 4-8 3Zm100-27 9-3 8 4-12 2Zm47 36 11-4 6 5-8 2Zm71-40 7-4 9 2-6 4Zm55 36 8-4 10 3-9 4Z" />
      </g>
      <g fill="none" stroke="#526856" strokeWidth="1.6" strokeLinecap="round" opacity="0.54">
        <path d="M591 101q7-8 15 0 7-8 15 0m-67 17q5-6 11 0 5-6 11 0" />
      </g>
      <path d="M0 589c77-19 136-11 213-2 58 7 134 9 205 5 120-7 203-19 294-15 65 3 124 15 188 9v14H0Z" fill="#d7c298" opacity="0.67" />
    </svg>
  )
}
